import {
  app,
  session,
  BrowserWindow,
  WebContentsView,
  ipcMain,
  safeStorage,
  dialog,
  clipboard,
  shell
} from 'electron'
import { mkdir, readFile, rename, writeFile } from 'fs/promises'
import os from 'node:os'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { basename, join, resolve } from 'path'
import { randomUUID } from 'crypto'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

const toolbarHeight = 86
const execFileAsync = promisify(execFile)
const browserWindows = new Map()
const downloadSessions = new WeakSet()
const googleAccountSessions = new WeakSet()
const googleAccountTimers = new WeakMap()
const extensionRestorePromises = new WeakMap()
const hrxAiRequests = new Map()
let hrxAiConversationWrite = Promise.resolve()
let nextTabId = 1
let previousCpuSample = null
let previousNetworkSample = null
let thermalSampleAt = 0
let thermalSample = null
app.setName('Hrishikesh')

const authCallbackScheme = 'hrishikesh:'
let pendingAuthCallback = process.argv.find((value) => isAuthCallbackUrl(value)) || ''

function isAuthCallbackUrl(value) {
  try {
    const url = new URL(value)
    return (
      url.protocol === authCallbackScheme && url.hostname === 'auth' && url.pathname === '/callback'
    )
  } catch {
    return false
  }
}

function queueAuthCallback(value) {
  if (!isAuthCallbackUrl(value)) return false
  pendingAuthCallback = value
  const mainWindow = [...browserWindows.keys()].find(
    (window) => !window.isDestroyed() && !browserWindows.get(window)?.incognito
  )
  if (mainWindow && !mainWindow.webContents.isLoadingMainFrame()) {
    mainWindow.webContents.send('browser:auth-callback', value)
  }
  return true
}

const hasSingleInstanceLock = app.requestSingleInstanceLock()
if (!hasSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, commandLine) => {
    const callbackUrl = commandLine.find((value) => isAuthCallbackUrl(value))
    if (callbackUrl) queueAuthCallback(callbackUrl)
    const mainWindow = [...browserWindows.keys()].find((window) => !window.isDestroyed())
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })
  app.on('open-url', (event, value) => {
    event.preventDefault()
    queueAuthCallback(value)
  })
}

const shaderStyles = {
  none: '',
  shiftfx: 'html { filter: hue-rotate(18deg) contrast(1.06) saturate(1.2) !important; }',
  midnightfx: 'html { filter: brightness(.78) saturate(.82) contrast(1.08) !important; }',
  fadefx: 'html { filter: saturate(.55) contrast(.92) brightness(1.04) !important; }',
  boostfx: 'html { filter: contrast(1.14) saturate(1.24) !important; }',
  monocore: 'html { filter: grayscale(1) contrast(1.08) !important; }',
  duofx: 'html { filter: hue-rotate(142deg) saturate(1.12) contrast(1.06) !important; }'
}

async function applyShaderEffect(tab, effect) {
  const contents = tab?.view?.webContents
  if (!contents || contents.isDestroyed()) return
  if (tab.shaderCssKey) {
    await contents.removeInsertedCSS(tab.shaderCssKey).catch(() => {})
    tab.shaderCssKey = ''
  }
  const css = shaderStyles[effect] || ''
  if (css) {
    try {
      tab.shaderCssKey = await contents.insertCSS(css, { cssOrigin: 'user' })
    } catch {
      tab.shaderCssKey = ''
    }
  }
}

function readCpuCounters() {
  return os.cpus().reduce(
    (total, cpu) => {
      const idle = cpu.times.idle
      const elapsed = Object.values(cpu.times).reduce((sum, value) => sum + value, 0)
      return { idle: total.idle + idle, elapsed: total.elapsed + elapsed }
    },
    { idle: 0, elapsed: 0 }
  )
}

async function readNetworkCounters() {
  if (process.platform !== 'win32') return null
  const script =
    '$a=Get-NetAdapter -Physical -ErrorAction Stop | Where-Object Status -eq "Up"; $s=@($a | ForEach-Object {Get-NetAdapterStatistics -Name $_.Name -ErrorAction SilentlyContinue}); $r=($s|Measure-Object -Property ReceivedBytes -Sum).Sum; $t=($s|Measure-Object -Property SentBytes -Sum).Sum; [PSCustomObject]@{received=[double]$r;sent=[double]$t}|ConvertTo-Json -Compress'
  try {
    const { stdout } = await execFileAsync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', script],
      { windowsHide: true, timeout: 6000, maxBuffer: 128 * 1024 }
    )
    const counters = JSON.parse(stdout.trim())
    if (Number.isFinite(counters.received) && Number.isFinite(counters.sent)) return counters
  } catch {
    return null
  }
  return null
}

async function readSystemTemperatureC() {
  if (process.platform !== 'win32') return null
  if (Date.now() - thermalSampleAt < 30000) return thermalSample
  thermalSampleAt = Date.now()
  const script =
    '$t=Get-CimInstance -Namespace root/wmi -ClassName MSAcpi_ThermalZoneTemperature -ErrorAction Stop | Measure-Object -Property CurrentTemperature -Average; if($t.Count -gt 0){[math]::Round(($t.Average/10)-273.15,1)}'
  try {
    const { stdout } = await execFileAsync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', script],
      { windowsHide: true, timeout: 5000, maxBuffer: 64 * 1024 }
    )
    const parsed = Number.parseFloat(stdout.trim())
    thermalSample = Number.isFinite(parsed) && parsed >= 15 && parsed <= 110 ? parsed : null
  } catch {
    thermalSample = null
  }
  return thermalSample
}

async function getSystemMetrics() {
  const cpuCounters = readCpuCounters()
  const previousCpu = previousCpuSample
  previousCpuSample = cpuCounters
  const cpuElapsed = previousCpu ? cpuCounters.elapsed - previousCpu.elapsed : 0
  const cpuIdle = previousCpu ? cpuCounters.idle - previousCpu.idle : 0
  const cpu = cpuElapsed > 0 ? Math.max(0, Math.min(100, (1 - cpuIdle / cpuElapsed) * 100)) : 0
  const network = await readNetworkCounters()
  const temperatureC = await readSystemTemperatureC()
  const now = Date.now()
  const previousNetwork = previousNetworkSample
  previousNetworkSample = network ? { ...network, at: now } : null
  const seconds = previousNetwork && network ? (now - previousNetwork.at) / 1000 : 0
  return {
    cpu,
    memoryTotalBytes: os.totalmem(),
    memoryUsedBytes: os.totalmem() - os.freemem(),
    temperatureC,
    networkSupported: Boolean(network),
    downloadMbps:
      seconds > 0
        ? Math.max(0, ((network.received - previousNetwork.received) * 8) / seconds / 1e6)
        : 0,
    uploadMbps:
      seconds > 0 ? Math.max(0, ((network.sent - previousNetwork.sent) * 8) / seconds / 1e6) : 0
  }
}

async function readSystemVpnProfiles() {
  if (process.platform !== 'win32') return { supported: false, profiles: [] }
  const script =
    '$p=@(Get-VpnConnection -ErrorAction SilentlyContinue); try {$p+=@(Get-VpnConnection -AllUserConnection -ErrorAction Stop)} catch {}; $p | Sort-Object -Property Name -Unique | Select-Object Name,ConnectionStatus,ServerAddress,TunnelType | ConvertTo-Json -Compress'
  try {
    const { stdout } = await execFileAsync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', script],
      { windowsHide: true, timeout: 8000, maxBuffer: 256 * 1024 }
    )
    const rows = JSON.parse(stdout.trim() || '[]')
    const profiles = (Array.isArray(rows) ? rows : [rows])
      .filter((profile) => typeof profile.Name === 'string')
      .map((profile) => ({
        name: profile.Name.slice(0, 128),
        status: profile.ConnectionStatus === 'Connected' ? 'Connected' : 'Disconnected',
        server:
          typeof profile.ServerAddress === 'string' ? profile.ServerAddress.slice(0, 255) : '',
        tunnel: typeof profile.TunnelType === 'string' ? profile.TunnelType.slice(0, 40) : ''
      }))
    return { supported: true, profiles }
  } catch {
    return { supported: true, profiles: [], error: 'Could not read Windows VPN profiles.' }
  }
}

function normalizeWebAddress(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null

  const destination =
    trimmed.includes('.') && !trimmed.includes(' ')
      ? /^https?:\/\//i.test(trimmed)
        ? trimmed
        : `https://${trimmed}`
      : `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`

  try {
    const parsed = new URL(destination)
    return ['https:'].includes(parsed.protocol) ? parsed.href : null
  } catch {
    return null
  }
}

function isGoogleSignInUrl(value) {
  try {
    const url = new URL(value)
    return (
      url.protocol === 'https:' &&
      ['mail.google.com', 'accounts.google.com'].includes(url.hostname.toLowerCase())
    )
  } catch {
    return false
  }
}

function getWindowState(mainWindow) {
  const data = browserWindows.get(mainWindow)
  const tabs = data?.tabs ?? []
  const activeTab = tabs.find((tab) => tab.id === data?.activeTabId)
  const activeView = activeTab?.view
  const showingHome = !activeTab || activeTab.showingHome

  return {
    tabs: tabs.map((tab) => ({
      id: tab.id,
      title: tab.title,
      group: tab.group || '',
      url: tab.showingHome ? '' : tab.view?.webContents.getURL() || ''
    })),
    incognito: Boolean(data?.incognito),
    verticalTabs: Boolean(data?.verticalTabs),
    gamingBoost: Boolean(data?.gamingBoost),
    shaderEffect: data?.shaderEffect || 'none',
    resourceControls: data?.resourceControls ?? null,
    readerMode: Boolean(activeTab?.readerMode),
    activeTabId: data?.activeTabId ?? null,
    canGoBack: Boolean(!showingHome && activeView?.webContents.navigationHistory.canGoBack()),
    canGoForward: Boolean(!showingHome && activeView?.webContents.navigationHistory.canGoForward()),
    isLoading: Boolean(!showingHome && activeView?.webContents.isLoading()),
    url: showingHome ? '' : activeView?.webContents.getURL() || ''
  }
}

function sendWindowState(mainWindow) {
  if (!mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed()) {
    mainWindow.webContents.send('browser:navigation-state', getWindowState(mainWindow))
  }
}

async function readGoogleAccountState(browserSession) {
  const cookies = await browserSession.cookies.get({ url: 'https://accounts.google.com/' })
  const signedInCookieNames = new Set([
    'SID',
    'HSID',
    'SSID',
    'APISID',
    'SAPISID',
    '__Secure-1PSID',
    '__Secure-3PSID',
    '__Host-1PLSID',
    '__Host-3PLSID'
  ])
  return { signedIn: cookies.some((cookie) => signedInCookieNames.has(cookie.name)) }
}

function sendGoogleAccountState(browserSession) {
  readGoogleAccountState(browserSession)
    .then((state) => {
      for (const [window, data] of browserWindows) {
        if (!window.isDestroyed() && data.browserSession === browserSession) {
          window.webContents.send('browser:google-account-state', state)
        }
      }
    })
    .catch(() => {})
}

function monitorGoogleAccount(browserSession) {
  if (googleAccountSessions.has(browserSession)) return
  googleAccountSessions.add(browserSession)
  browserSession.cookies.on('changed', () => {
    clearTimeout(googleAccountTimers.get(browserSession))
    googleAccountTimers.set(
      browserSession,
      setTimeout(() => sendGoogleAccountState(browserSession), 250)
    )
  })
}

function getBrowserSession(mainWindow) {
  const data = browserWindows.get(mainWindow)
  const partition = data.incognito
    ? `hrishikesh-incognito-${mainWindow.id}`
    : 'persist:hrishikesh-profile'
  const browserSession =
    data.browserSession ?? (data.browserSession = session.fromPartition(partition))
  monitorGoogleAccount(browserSession)
  if (!data.incognito) void ensureSavedExtensionsLoaded(browserSession)
  return browserSession
}

async function applyResourceControls(tab, controls) {
  const contents = tab?.view?.webContents
  if (!contents || contents.isDestroyed()) return { ok: true, applied: false }
  const enabled = Boolean(controls?.networkEnabled || controls?.cpuEnabled)
  if (!enabled) {
    if (tab.resourceDebuggerAttached && contents.debugger.isAttached()) {
      contents.debugger.detach()
      tab.resourceDebuggerAttached = false
    }
    return { ok: true, applied: true }
  }

  if (!contents.debugger.isAttached()) {
    contents.debugger.attach('1.3')
    tab.resourceDebuggerAttached = true
  } else if (!tab.resourceDebuggerAttached) {
    return { ok: false, reason: 'DevTools is using this tab. Close DevTools and try again.' }
  }

  if (controls.cpuEnabled) {
    await contents.debugger.sendCommand('Emulation.setCPUThrottlingRate', {
      rate: Math.max(1, Math.min(8, Number(controls.cpuRate) || 1))
    })
  } else {
    await contents.debugger.sendCommand('Emulation.setCPUThrottlingRate', { rate: 1 })
  }
  if (controls.networkEnabled) {
    await contents.debugger.sendCommand('Network.enable')
    await contents.debugger.sendCommand('Network.emulateNetworkConditions', {
      offline: false,
      latency: 0,
      downloadThroughput: (Math.max(0.1, Number(controls.downloadMbps) || 0.1) * 1024 * 1024) / 8,
      uploadThroughput: (Math.max(0.1, Number(controls.uploadMbps) || 0.1) * 1024 * 1024) / 8,
      connectionType: 'wifi'
    })
  } else {
    await contents.debugger.sendCommand('Network.emulateNetworkConditions', {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1,
      connectionType: 'wifi'
    })
  }
  if (!controls.cpuEnabled && !controls.networkEnabled && tab.resourceDebuggerAttached) {
    contents.debugger.detach()
    tab.resourceDebuggerAttached = false
  }
  return { ok: true, applied: true }
}

function resizeActiveView(mainWindow) {
  const data = browserWindows.get(mainWindow)
  const activeTab = data?.tabs.find((tab) => tab.id === data.activeTabId)
  if (!activeTab?.view || activeTab.showingHome) return

  const { width, height } = mainWindow.getContentBounds()
  const sidebarWidth = data.verticalTabs ? 216 : 0
  const popupWidth = data.popupOpen ? Math.min(360, Math.max(0, width - 320)) : 0
  const suggestionsHeight = data.addressSuggestionsOpen ? 232 : 0
  activeTab.view.setBounds({
    x: sidebarWidth,
    y: toolbarHeight + suggestionsHeight,
    width: Math.max(0, width - sidebarWidth - popupWidth),
    height: Math.max(0, height - toolbarHeight - suggestionsHeight)
  })
}

function handleBrowserShortcut(mainWindow, event, input) {
  if (input.type !== 'keyDown' || (!input.control && !input.meta)) return
  const key = input.key.toLowerCase()
  const tab = getActiveTab(mainWindow)
  const openPanel = (name) => {
    event.preventDefault()
    mainWindow.webContents.send('browser:open-menu-view', name)
  }

  if (input.shift && key === 'n') {
    event.preventDefault()
    createWindow({ incognito: true })
  } else if (key === 'n') {
    event.preventDefault()
    createWindow()
  } else if (key === 't') {
    event.preventDefault()
    removeAllBrowserViews(mainWindow)
    createTab(mainWindow)
    sendWindowState(mainWindow)
  } else if (key === 'h') openPanel('history')
  else if (key === 'j') openPanel('downloads')
  else if (key === 'd') openPanel('bookmarks')
  else if (input.shift && key === 'o') openPanel('bookmarks')
  else if (key === 'f') openPanel('find')
  else if (input.shift && key === 'delete') openPanel('clear-data')
  else if (key === 'l') {
    event.preventDefault()
    mainWindow.webContents.send('browser:focus-address')
  } else if (key === 'p') {
    event.preventDefault()
    if (tab?.view && !tab.showingHome) tab.view.webContents.print()
  } else if (key === '0') {
    event.preventDefault()
    tab?.view?.webContents.setZoomFactor(1)
    mainWindow.webContents.send('browser:zoom-changed', 100)
  } else if (key === '+' || key === '=' || key === '-') {
    event.preventDefault()
    if (tab?.view) {
      const next = Math.max(
        50,
        Math.min(
          300,
          Math.round(tab.view.webContents.getZoomFactor() * 100) + (key === '-' ? -10 : 10)
        )
      )
      tab.view.webContents.setZoomFactor(next / 100)
      mainWindow.webContents.send('browser:zoom-changed', next)
    }
  }
}

function removeAllBrowserViews(mainWindow) {
  for (const child of [...mainWindow.contentView.children]) {
    if (child instanceof WebContentsView) mainWindow.contentView.removeChildView(child)
  }
}

function createTab(mainWindow) {
  const data = browserWindows.get(mainWindow)
  const tab = {
    id: `tab-${nextTabId++}`,
    title: 'New Tab',
    group: '',
    view: null,
    showingHome: true,
    readerMode: false,
    readerCssKey: '',
    shaderCssKey: ''
  }
  data.tabs.push(tab)
  data.activeTabId = tab.id
  return tab
}

function activateTab(mainWindow, tab) {
  removeAllBrowserViews(mainWindow)
  const data = browserWindows.get(mainWindow)
  data.activeTabId = tab.id
  if (tab.view && !tab.showingHome && !tab.view.webContents.isLoading()) {
    mainWindow.contentView.addChildView(tab.view)
    resizeActiveView(mainWindow)
  }
  sendWindowState(mainWindow)
}

async function ensureTabView(mainWindow, tab) {
  if (tab.view) return tab.view

  const data = browserWindows.get(mainWindow)
  const browserSession = getBrowserSession(mainWindow)
  if (!data.incognito) await ensureSavedExtensionsLoaded(browserSession)
  if (!downloadSessions.has(browserSession)) {
    downloadSessions.add(browserSession)
    browserSession.on('will-download', (_event, item, sourceWebContents) => {
      const owner = [...browserWindows.entries()].find(
        ([window, windowData]) =>
          !window.isDestroyed() &&
          windowData.browserSession === browserSession &&
          windowData.tabs.some((candidate) => candidate.view?.webContents === sourceWebContents)
      )
      if (!owner) return
      const [ownerWindow, ownerData] = owner
      const download = {
        id: randomUUID(),
        name: item.getFilename(),
        state: 'Downloading',
        received: 0,
        total: item.getTotalBytes()
      }
      ownerData.downloads.unshift(download)
      const sendDownloads = () => {
        if (!ownerWindow.isDestroyed() && !ownerWindow.webContents.isDestroyed()) {
          ownerWindow.webContents.send(
            'browser:downloads-updated',
            ownerData.downloads.slice(0, 50)
          )
        }
      }
      item.on('updated', () => {
        download.name = item.getFilename()
        download.received = item.getReceivedBytes()
        download.total = item.getTotalBytes()
        download.state = item.isPaused() ? 'Paused' : 'Downloading'
        sendDownloads()
      })
      item.once('done', (_doneEvent, state) => {
        download.name = item.getFilename()
        download.received = item.getReceivedBytes()
        download.total = item.getTotalBytes()
        download.path = item.getSavePath()
        download.state = state === 'completed' ? 'Complete' : state
        sendDownloads()
      })
      sendDownloads()
    })
  }
  browserSession.setPermissionRequestHandler((_webContents, permission, callback) =>
    callback(permission === 'notifications' && data.notificationsEnabled)
  )
  browserSession.setPermissionCheckHandler(
    (_webContents, permission) => permission === 'notifications' && data.notificationsEnabled
  )
  const view = new WebContentsView({
    webPreferences: {
      session: browserSession,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  })
  tab.view = view
  view.webContents.setBackgroundThrottling(!data.gamingBoost)
  if (data.resourceControls) {
    void applyResourceControls(tab, data.resourceControls).catch(() => {})
  }

  const updateTab = () => {
    if (view.webContents.isDestroyed()) return
    const url = view.webContents.getURL()
    if (url) {
      tab.showingHome = false
      tab.title = view.webContents.getTitle() || new URL(url).hostname || 'New Tab'
    }
    sendWindowState(mainWindow)
  }

  view.webContents.on('did-navigate', updateTab)
  view.webContents.on('did-navigate-in-page', updateTab)
  view.webContents.on('page-title-updated', updateTab)
  view.webContents.on('did-start-loading', () => {
    const windowData = browserWindows.get(mainWindow)
    if (
      windowData?.activeTabId === tab.id &&
      !mainWindow.isDestroyed() &&
      mainWindow.contentView.children.includes(view)
    ) {
      mainWindow.contentView.removeChildView(view)
    }
    sendWindowState(mainWindow)
  })
  view.webContents.on('did-stop-loading', () => {
    const windowData = browserWindows.get(mainWindow)
    if (
      windowData?.activeTabId === tab.id &&
      !tab.showingHome &&
      !mainWindow.isDestroyed() &&
      !mainWindow.contentView.children.includes(view)
    ) {
      mainWindow.contentView.addChildView(view)
      resizeActiveView(mainWindow)
    }
    if (tab.readerMode) void updateReaderMode(tab, true)
    if (browserWindows.get(mainWindow)?.shaderEffect) {
      void applyShaderEffect(tab, browserWindows.get(mainWindow).shaderEffect)
    }
    updateTab()
  })
  view.webContents.on('found-in-page', (_event, result) => {
    if (!mainWindow.webContents.isDestroyed()) {
      mainWindow.webContents.send('browser:find-result', {
        matches: result.matches,
        activeMatchOrdinal: result.activeMatchOrdinal
      })
    }
  })
  view.webContents.on('before-input-event', (event, input) => {
    handleBrowserShortcut(mainWindow, event, input)
  })
  view.webContents.on('before-mouse-event', (_event, mouse) => {
    if (mouse.type !== 'mouseDown' || mainWindow.isDestroyed()) return
    if (!data.popupOpen && !data.addressSuggestionsOpen) return
    data.popupOpen = false
    data.addressSuggestionsOpen = false
    mainWindow.webContents.send('browser:dismiss-popups')
    setImmediate(() => {
      if (!mainWindow.isDestroyed()) resizeActiveView(mainWindow)
    })
  })
  view.webContents.on('will-navigate', (event, url) => {
    try {
      if (new URL(url).protocol !== 'https:') event.preventDefault()
    } catch {
      event.preventDefault()
    }
  })
  view.webContents.on('will-redirect', (event, url) => {
    try {
      if (new URL(url).protocol !== 'https:') event.preventDefault()
    } catch {
      event.preventDefault()
    }
  })
  view.webContents.setWindowOpenHandler(({ url }) => {
    if (isGoogleSignInUrl(url)) {
      void shell.openExternal(url).catch(() => {})
    }
    return { action: 'deny' }
  })
  return view
}

function getActiveTab(mainWindow) {
  const data = browserWindows.get(mainWindow)
  return data?.tabs.find((tab) => tab.id === data.activeTabId)
}

async function getTabProcessRows(mainWindow) {
  const data = browserWindows.get(mainWindow)
  if (!data) return []
  const processMetrics = app.getAppMetrics()
  return Promise.all(
    data.tabs.map(async (tab) => {
      const contents = tab.view?.webContents
      if (!contents || contents.isDestroyed()) {
        return {
          id: tab.id,
          title: tab.title,
          url: '',
          status: 'New tab',
          pid: null,
          cpu: 0,
          memoryKb: 0
        }
      }
      const pid = contents.getOSProcessId()
      const metrics = processMetrics.find((item) => item.pid === pid)
      const memoryKb = await contents
        .getProcessMemoryInfo()
        .then((memory) => memory.private || memory.residentSet || 0)
        .catch(() => 0)
      return {
        id: tab.id,
        title: contents.getTitle() || tab.title,
        url: contents.getURL(),
        status: contents.isLoading() ? 'Loading' : 'Running',
        pid,
        cpu: metrics?.cpu?.percentCPUUsage ?? 0,
        memoryKb
      }
    })
  )
}

function getTrustedMainWindow(event) {
  if (event.senderFrame && event.senderFrame !== event.sender.mainFrame) return null
  const mainWindow = BrowserWindow.fromWebContents(event.sender)
  return mainWindow?.webContents === event.sender ? mainWindow : null
}
function sanitizePreferences(value) {
  if (!value || typeof value !== 'object') return null
  const isColor = (item) => typeof item === 'string' && /^#[0-9a-f]{6}$/i.test(item)
  const theme = value.theme
  if (
    !theme ||
    typeof theme !== 'object' ||
    typeof theme.name !== 'string' ||
    theme.name.length > 32
  )
    return null
  if (
    !['background', 'panel', 'accent', 'text', 'muted', 'border'].every((key) =>
      isColor(theme[key])
    )
  )
    return null
  if (!['customBackground', 'customPanel', 'customAccent'].every((key) => isColor(value[key])))
    return null

  const backgroundPhoto = value.backgroundPhoto ?? ''
  if (typeof backgroundPhoto !== 'string' || backgroundPhoto.length > 7_000_000) return null
  if (
    backgroundPhoto &&
    !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(backgroundPhoto)
  )
    return null

  return {
    theme: {
      name: theme.name,
      background: theme.background,
      panel: theme.panel,
      accent: theme.accent,
      text: theme.text,
      muted: theme.muted,
      border: theme.border,
      dark: Boolean(theme.dark)
    },
    customBackground: value.customBackground,
    customPanel: value.customPanel,
    customAccent: value.customAccent,
    backgroundPhoto,
    photoZoom:
      Number.isInteger(value.photoZoom) && value.photoZoom >= 100 && value.photoZoom <= 200
        ? value.photoZoom
        : 100,
    photoX:
      Number.isInteger(value.photoX) && value.photoX >= 0 && value.photoX <= 100
        ? value.photoX
        : 50,
    photoY:
      Number.isInteger(value.photoY) && value.photoY >= 0 && value.photoY <= 100
        ? value.photoY
        : 50,
    photoBrightness:
      Number.isInteger(value.photoBrightness) &&
      value.photoBrightness >= 60 &&
      value.photoBrightness <= 120
        ? value.photoBrightness
        : 100,
    showBookmarksBar: Boolean(value.showBookmarksBar),
    ...(Array.isArray(value.shortcuts)
      ? {
          shortcuts:
            value.shortcuts.length <= 20
              ? value.shortcuts
                  .filter((site) => {
                    if (
                      !site ||
                      typeof site.name !== 'string' ||
                      !site.name.trim() ||
                      site.name.length > 20
                    )
                      return false
                    if (typeof site.url !== 'string' || site.url.length > 2048) return false
                    try {
                      return new URL(site.url).protocol === 'https:'
                    } catch {
                      return false
                    }
                  })
                  .map((site) => ({
                    name: site.name.trim(),
                    url: site.url,
                    tone: [
                      'google',
                      'youtube',
                      'github',
                      'instagram',
                      'linkedin',
                      'gmail'
                    ].includes(site.tone)
                      ? site.tone
                      : 'custom'
                  }))
              : []
        }
      : {}),
    ...(Array.isArray(value.bookmarks)
      ? {
          bookmarks: value.bookmarks
            .filter((item) => {
              if (
                !item ||
                typeof item.name !== 'string' ||
                !item.name.trim() ||
                item.name.length > 80 ||
                typeof item.url !== 'string' ||
                item.url.length > 2048
              )
                return false
              try {
                return new URL(item.url).protocol === 'https:'
              } catch {
                return false
              }
            })
            .slice(0, 100)
            .map((item) => ({ name: item.name.trim(), url: item.url }))
        }
      : {}),
    ...(Array.isArray(value.readingList)
      ? {
          readingList: value.readingList
            .filter((item) => {
              if (
                !item ||
                typeof item.name !== 'string' ||
                !item.name.trim() ||
                item.name.length > 80 ||
                typeof item.url !== 'string' ||
                item.url.length > 2048
              )
                return false
              try {
                return new URL(item.url).protocol === 'https:'
              } catch {
                return false
              }
            })
            .slice(0, 100)
            .map((item) => ({ name: item.name.trim(), url: item.url }))
        }
      : {})
  }
}

function passwordVaultPath() {
  return join(app.getPath('userData'), 'passwords.enc')
}

function hrxAiConversationPath() {
  return join(app.getPath('userData'), 'hrx-ai-conversation.json')
}

async function readHrxAiConversation() {
  try {
    const conversation = JSON.parse(await readFile(hrxAiConversationPath(), 'utf8'))
    return Array.isArray(conversation) ? conversation : []
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
}

function appendHrxAiConversation(messages) {
  hrxAiConversationWrite = hrxAiConversationWrite
    .catch(() => {})
    .then(async () => {
      const conversation = await readHrxAiConversation().catch(() => [])
      const nextConversation = [...conversation, ...messages].slice(-200)
      const folder = app.getPath('userData')
      const temporaryPath = `${hrxAiConversationPath()}.${randomUUID()}.tmp`
      await mkdir(folder, { recursive: true })
      await writeFile(temporaryPath, JSON.stringify(nextConversation), 'utf8')
      await rename(temporaryPath, hrxAiConversationPath())
    })
  return hrxAiConversationWrite
}

async function readPasswordVault() {
  try {
    const encrypted = await readFile(passwordVaultPath())
    const { result } = await safeStorage.decryptStringAsync(encrypted)
    const records = JSON.parse(result)
    return Array.isArray(records) ? records : []
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
}

async function writePasswordVault(records) {
  if (!(await safeStorage.isAsyncEncryptionAvailable())) return false
  const encrypted = await safeStorage.encryptStringAsync(JSON.stringify(records))
  await mkdir(app.getPath('userData'), { recursive: true })
  await writeFile(passwordVaultPath(), encrypted)
  return true
}

function extensionRegistryPath() {
  return join(app.getPath('userData'), 'unpacked-extensions.json')
}

async function saveExtensionRegistry(browserSession) {
  const paths = browserSession.extensions
    .getAllExtensions()
    .map((extension) => extension.path)
    .filter((path) => typeof path === 'string' && path.length <= 2048)
  const folder = app.getPath('userData')
  await mkdir(folder, { recursive: true })
  await writeFile(extensionRegistryPath(), JSON.stringify(paths), 'utf8')
}

function ensureSavedExtensionsLoaded(browserSession) {
  const existing = extensionRestorePromises.get(browserSession)
  if (existing) return existing

  const restorePromise = (async () => {
    try {
      const paths = JSON.parse(await readFile(extensionRegistryPath(), 'utf8'))
      if (!Array.isArray(paths)) return
      for (const path of paths) {
        if (typeof path !== 'string' || !path.trim() || path.length > 2048) continue
        try {
          await browserSession.extensions.loadExtension(path)
        } catch {
          // A removed or incompatible extension should not stop the browser from opening.
        }
      }
    } catch {
      // No saved extensions is the normal first-run state.
    }
  })()
  extensionRestorePromises.set(browserSession, restorePromise)
  return restorePromise
}

const readerModeStyles = `
  html { background: #f7f4ec !important; }
  body {
    box-sizing: border-box !important;
    width: min(820px, calc(100% - 40px)) !important;
    margin: 40px auto !important;
    padding: 48px clamp(20px, 6vw, 76px) !important;
    color: #26231e !important;
    background: #fffdf7 !important;
    box-shadow: 0 10px 50px #241e1414 !important;
    font: 19px/1.8 Georgia, 'Times New Roman', serif !important;
  }
  body :is(header, nav, footer, aside, [role="banner"], [role="navigation"], [role="complementary"], [role="contentinfo"], [aria-modal="true"]) {
    display: none !important;
  }
  body :is(article, main, [role="main"]) {
    width: auto !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
    color: inherit !important;
    background: transparent !important;
    box-shadow: none !important;
  }
  body :is(h1, h2, h3) { line-height: 1.25 !important; }
  body img, body video { max-width: 100% !important; height: auto !important; }
  body a { color: #4d4b9b !important; }
`

async function updateReaderMode(tab, enabled) {
  tab.readerMode = Boolean(enabled)
  if (!tab.view || tab.view.webContents.isDestroyed()) return tab.readerMode
  const contents = tab.view.webContents
  if (!tab.readerMode) {
    if (tab.readerCssKey) {
      try {
        await contents.removeInsertedCSS(tab.readerCssKey)
      } catch {
        // The page may have navigated and discarded its inserted stylesheet.
      }
      tab.readerCssKey = ''
    }
    return false
  }
  try {
    tab.readerCssKey = await contents.insertCSS(readerModeStyles, { cssOrigin: 'user' })
  } catch {
    tab.readerCssKey = ''
  }
  return true
}

function createWindow({ incognito = false } = {}) {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 760,
    show: false,
    title: incognito ? 'Incognito — Hrishikesh' : 'Hrishikesh',
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0f0d11',
      symbolColor: '#f6f1f4',
      height: 32
    },
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  })
  mainWindow.setContentProtection(true)

  browserWindows.set(mainWindow, {
    tabs: [],
    activeTabId: null,
    downloads: [],
    popupOpen: false,
    addressSuggestionsOpen: false,
    verticalTabs: false,
    gamingBoost: false,
    shaderEffect: 'none',
    notificationsEnabled: false,
    incognito,
    resourceControls: {
      cpuEnabled: false,
      cpuRate: 1,
      networkEnabled: false,
      downloadMbps: 5,
      uploadMbps: 2
    },
    browserSession: null,
    downloadListenerInstalled: false
  })
  createTab(mainWindow)
  mainWindow.on('ready-to-show', () => mainWindow.show())
  mainWindow.on('resize', () => resizeActiveView(mainWindow))
  mainWindow.on('closed', () => {
    const data = browserWindows.get(mainWindow)
    for (const tab of data?.tabs ?? []) {
      if (tab.view && !tab.view.webContents.isDestroyed()) tab.view.webContents.destroy()
    }
    browserWindows.delete(mainWindow)
  })

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  mainWindow.webContents.on('will-navigate', (event, url) => {
    let allowed
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      try {
        allowed = new URL(url).origin === new URL(process.env['ELECTRON_RENDERER_URL']).origin
      } catch {
        allowed = false
      }
    } else {
      allowed = url.startsWith('file://')
    }
    if (!allowed) event.preventDefault()
  })
  let devRendererFallbackStarted = false
  mainWindow.webContents.on(
    'did-fail-load',
    (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      console.error('[Hrishikesh] Renderer failed to load', {
        errorCode,
        errorDescription,
        validatedURL,
        isMainFrame
      })
      if (
        is.dev &&
        isMainFrame &&
        !devRendererFallbackStarted &&
        validatedURL === process.env['ELECTRON_RENDERER_URL']
      ) {
        devRendererFallbackStarted = true
        mainWindow.loadFile(join(__dirname, '../renderer/index.html')).catch((error) => {
          console.error('[Hrishikesh] Failed to load built renderer fallback', error)
        })
      }
    }
  )
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('[Hrishikesh] Renderer process exited', details)
  })
  mainWindow.webContents.on('console-message', (details) => {
    if (details.level === 'error') {
      console.error('[Hrishikesh] Renderer console error', {
        message: details.message,
        line: details.lineNumber,
        sourceId: details.sourceId
      })
    }
  })
  mainWindow.webContents.on('did-finish-load', () => sendWindowState(mainWindow))
  mainWindow.webContents.on('did-finish-load', () => {
    const data = browserWindows.get(mainWindow)
    if (data) sendGoogleAccountState(getBrowserSession(mainWindow))
    if (pendingAuthCallback && !data?.incognito) {
      mainWindow.webContents.send('browser:auth-callback', pendingAuthCallback)
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']).catch((error) => {
      console.error('[Hrishikesh] Failed to load dev renderer', error)
    })
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html')).catch((error) => {
      console.error('[Hrishikesh] Failed to load packaged renderer', error)
    })
  }
}

app.whenReady().then(() => {
  if (!hasSingleInstanceLock) return
  if (process.defaultApp && process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('hrishikesh', process.execPath, [resolve(process.argv[1])])
  } else {
    app.setAsDefaultProtocolClient('hrishikesh')
  }
  electronApp.setAppUserModelId('com.hrishikesh.browser')
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))

  ipcMain.handle('browser:get-preferences', async (event) => {
    if (!getTrustedMainWindow(event)) return null
    try {
      const filePath = join(app.getPath('userData'), 'home-preferences.json')
      return sanitizePreferences(JSON.parse(await readFile(filePath, 'utf8')))
    } catch {
      return null
    }
  })

  ipcMain.handle('browser:save-preferences', async (event, value) => {
    if (!getTrustedMainWindow(event)) return { ok: false }
    const preferences = sanitizePreferences(value)
    if (!preferences) return { ok: false }
    const folder = app.getPath('userData')
    await mkdir(folder, { recursive: true })
    await writeFile(join(folder, 'home-preferences.json'), JSON.stringify(preferences), 'utf8')
    return { ok: true }
  })

  ipcMain.handle('browser:get-state', (event) => {
    const mainWindow = getTrustedMainWindow(event)
    return mainWindow ? getWindowState(mainWindow) : null
  })

  ipcMain.handle('browser:capture-screenshot', async (event, options = {}) => {
    const mainWindow = getTrustedMainWindow(event)
    if (!mainWindow || !['tab', 'screen', 'app'].includes(options?.source)) {
      return { ok: false, reason: 'invalid-request' }
    }
    try {
      let image
      if (options.source === 'screen') {
        const { desktopCapturer, screen } = await import('electron')
        const display = screen.getPrimaryDisplay()
        const sources = await desktopCapturer.getSources({
          types: ['screen'],
          thumbnailSize: { width: display.size.width, height: display.size.height }
        })
        image = sources.find((source) => source.display_id === String(display.id))?.thumbnail
        if (!image || image.isEmpty()) return { ok: false, reason: 'screen-unavailable' }
      } else if (options.source === 'tab') {
        const tab = getActiveTab(mainWindow)
        if (!tab?.view || tab.showingHome) return { ok: false, reason: 'no-active-page' }
        image = await tab.view.webContents.capturePage()
      } else {
        image = await mainWindow.webContents.capturePage()
      }
      const dataUrl = image.toDataURL()
      if (options.copy === true) clipboard.writeImage(image)
      if (options.save === true) {
        const result = await dialog.showSaveDialog(mainWindow, {
          title: 'Save Hrishikesh screenshot',
          defaultPath: join(app.getPath('pictures'), `Hrishikesh-${Date.now()}.png`),
          filters: [{ name: 'PNG image', extensions: ['png'] }]
        })
        if (result.canceled || !result.filePath) return { ok: false, reason: 'cancelled' }
        await writeFile(result.filePath, image.toPNG())
        return { ok: true, path: result.filePath, dataUrl }
      }
      return { ok: true, dataUrl }
    } catch (error) {
      console.error('[Hrishikesh] Screenshot failed', error)
      return { ok: false, reason: 'capture-failed' }
    }
  })

  ipcMain.handle('browser:save-recording', async (event, value) => {
    const mainWindow = getTrustedMainWindow(event)
    if (!mainWindow || typeof value?.dataUrl !== 'string' || value.dataUrl.length > 500_000_000) {
      return { ok: false, reason: 'invalid-recording' }
    }
    const match = value.dataUrl.match(/^data:video\/webm;base64,([A-Za-z0-9+/=]+)$/)
    if (!match) return { ok: false, reason: 'invalid-recording' }
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Hrishikesh screen recording',
      defaultPath: join(app.getPath('videos'), `Hrishikesh-${Date.now()}.webm`),
      filters: [{ name: 'WebM video', extensions: ['webm'] }]
    })
    if (result.canceled || !result.filePath) return { ok: false, reason: 'cancelled' }
    await writeFile(result.filePath, Buffer.from(match[1], 'base64'))
    return { ok: true, path: result.filePath }
  })

  ipcMain.handle('browser:save-screenshot-data', async (event, value) => {
    const mainWindow = getTrustedMainWindow(event)
    if (!mainWindow || typeof value?.dataUrl !== 'string' || value.dataUrl.length > 80_000_000) {
      return { ok: false, reason: 'invalid-image' }
    }
    const match = value.dataUrl.match(/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/)
    if (!match) return { ok: false, reason: 'invalid-image' }
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Hrishikesh screenshot',
      defaultPath: join(app.getPath('pictures'), `Hrishikesh-${Date.now()}.png`),
      filters: [{ name: 'PNG image', extensions: ['png'] }]
    })
    if (result.canceled || !result.filePath) return { ok: false, reason: 'cancelled' }
    await writeFile(result.filePath, Buffer.from(match[1], 'base64'))
    return { ok: true, path: result.filePath }
  })

  ipcMain.handle('browser:save-ai-code', async (event, value) => {
    const mainWindow = getTrustedMainWindow(event)
    if (!mainWindow || typeof value?.code !== 'string' || value.code.length > 500_000) {
      return { ok: false, reason: 'invalid-code' }
    }
    const safeName = basename(String(value.name || 'hrx-code.txt').replace(/[<>:"|?*]/g, '_'))
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save generated code',
      defaultPath: join(app.getPath('documents'), safeName),
      filters: [
        {
          name: 'Code file',
          extensions: ['html', 'js', 'jsx', 'ts', 'tsx', 'css', 'py', 'json', 'txt']
        }
      ]
    })
    if (result.canceled || !result.filePath) return { ok: false, reason: 'cancelled' }
    await writeFile(result.filePath, value.code, 'utf8')
    return { ok: true, path: result.filePath }
  })

  ipcMain.handle('browser:open-google-oauth', async (event, value) => {
    if (!getTrustedMainWindow(event) || typeof value !== 'string') return { ok: false }
    try {
      const url = new URL(value)
      if (
        url.origin !== 'https://srhbpyftypduiveeqzeq.supabase.co' ||
        url.pathname !== '/auth/v1/authorize' ||
        url.searchParams.get('provider') !== 'google' ||
        url.searchParams.get('redirect_to') !== 'hrishikesh://auth/callback'
      ) {
        return { ok: false }
      }
      await shell.openExternal(url.href)
      return { ok: true }
    } catch {
      return { ok: false }
    }
  })

  ipcMain.handle('browser:take-auth-callback', (event) => {
    if (!getTrustedMainWindow(event)) return ''
    const callbackUrl = pendingAuthCallback
    pendingAuthCallback = ''
    return callbackUrl
  })

  ipcMain.handle('browser:ack-auth-callback', (event, value) => {
    if (!getTrustedMainWindow(event) || typeof value !== 'string') return false
    if (pendingAuthCallback === value) pendingAuthCallback = ''
    return true
  })

  ipcMain.handle('browser:set-window-title', (event, value) => {
    const mainWindow = getTrustedMainWindow(event)
    if (!mainWindow) return false
    const title = typeof value === 'string' ? value.trim().slice(0, 48) : ''
    mainWindow.setTitle(title || 'Hrishikesh')
    return true
  })

  ipcMain.handle('browser:get-app-version', (event) => {
    return getTrustedMainWindow(event) ? app.getVersion() : ''
  })

  ipcMain.handle('browser:copy-text', (event, value) => {
    if (!getTrustedMainWindow(event) || typeof value !== 'string') return false
    clipboard.writeText(value.slice(0, 4000))
    return true
  })

  ipcMain.handle('browser:get-google-account-state', async (event) => {
    const mainWindow = getTrustedMainWindow(event)
    return mainWindow ? readGoogleAccountState(getBrowserSession(mainWindow)) : { signedIn: false }
  })

  ipcMain.handle('browser:sign-out-google', async (event) => {
    const mainWindow = getTrustedMainWindow(event)
    if (!mainWindow) return false
    const browserSession = getBrowserSession(mainWindow)
    const authCookieNames = new Set([
      'SID',
      'HSID',
      'SSID',
      'APISID',
      'SAPISID',
      '__Secure-1PSID',
      '__Secure-3PSID',
      '__Host-1PLSID',
      '__Host-3PLSID'
    ])
    const cookies = await browserSession.cookies.get({ domain: 'google.com' })
    await Promise.all(
      cookies
        .filter((cookie) => authCookieNames.has(cookie.name))
        .map((cookie) => {
          const host = cookie.domain.replace(/^\./, '')
          const protocol = cookie.secure ? 'https:' : 'http:'
          return browserSession.cookies.remove(
            `${protocol}//${host}${cookie.path || '/'}`,
            cookie.name
          )
        })
    )
    sendGoogleAccountState(browserSession)
    return true
  })

  ipcMain.handle('browser:set-popup-open', (event, open) => {
    const mainWindow = getTrustedMainWindow(event)
    const data = mainWindow && browserWindows.get(mainWindow)
    if (!mainWindow || !data) return false
    data.popupOpen = Boolean(open)
    resizeActiveView(mainWindow)
    return true
  })

  ipcMain.handle('browser:set-address-suggestions-open', (event, open) => {
    const mainWindow = getTrustedMainWindow(event)
    const data = mainWindow && browserWindows.get(mainWindow)
    if (!mainWindow || !data) return false
    data.addressSuggestionsOpen = Boolean(open)
    resizeActiveView(mainWindow)
    return true
  })

  ipcMain.handle('browser:set-vertical-tabs', (event, enabled) => {
    const mainWindow = getTrustedMainWindow(event)
    const data = mainWindow && browserWindows.get(mainWindow)
    if (!mainWindow || !data) return false
    data.verticalTabs = Boolean(enabled)
    resizeActiveView(mainWindow)
    sendWindowState(mainWindow)
    return data.verticalTabs
  })

  ipcMain.handle('browser:hrx-ai-history', async (event) => {
    const mainWindow = getTrustedMainWindow(event)
    if (!mainWindow || browserWindows.get(mainWindow)?.incognito) return []
    try {
      return (await readHrxAiConversation()).slice(-200)
    } catch {
      return []
    }
  })

  ipcMain.handle('browser:hrx-ai-models', async (event) => {
    if (!getTrustedMainWindow(event)) return { ok: false, reason: 'Request not allowed.' }
    try {
      const response = await fetch('http://127.0.0.1:11434/api/tags', {
        signal: AbortSignal.timeout(2500)
      })
      if (!response.ok) return { ok: false, reason: 'The local AI engine is not responding.' }
      const data = await response.json()
      return {
        ok: true,
        models: Array.isArray(data.models) ? data.models.map((item) => item.name) : []
      }
    } catch {
      return {
        ok: false,
        reason: 'Local AI is offline. Start Ollama on this computer to connect HRX AI.'
      }
    }
  })

  ipcMain.handle('browser:hrx-ai-chat', async (event, value) => {
    const mainWindow = getTrustedMainWindow(event)
    if (!mainWindow) return { ok: false, reason: 'Request not allowed.' }
    const persistConversation = !browserWindows.get(mainWindow)?.incognito
    const model = typeof value?.model === 'string' ? value.model.slice(0, 80) : ''
    const messages = Array.isArray(value?.messages)
      ? value.messages.slice(-20).flatMap((item) => {
          if (
            !['system', 'user', 'assistant'].includes(item?.role) ||
            typeof item.content !== 'string'
          )
            return []
          return [{ role: item.role, content: item.content.slice(0, 5000) }]
        })
      : []
    const images = Array.isArray(value?.images)
      ? value.images
          .filter((image) => typeof image === 'string' && image.length <= 12_000_000)
          .slice(0, 1)
      : []
    if (!model || !messages.length)
      return { ok: false, reason: 'Choose a local model and enter a message.' }
    if (images.length && !/(vision|llava|moondream|qwen.*vl|pixtral)/i.test(model)) {
      return {
        ok: false,
        reason:
          'Choose an installed vision model, or run `ollama pull llama3.2-vision` and select it.'
      }
    }
    const requestId =
      typeof value?.requestId === 'string' ? value.requestId.slice(0, 80) : randomUUID()
    const requestKey = `${event.sender.id}:${requestId}`
    const controller = new AbortController()
    hrxAiRequests.set(requestKey, controller)
    const question = [...messages].reverse().find((item) => item.role === 'user')
    if (persistConversation && question) {
      await appendHrxAiConversation([
        { role: 'user', content: question.content, createdAt: new Date().toISOString() }
      ]).catch(() => {})
    }
    try {
      const requestMessages = messages.map((message) =>
        images.length && message === question ? { ...message, images } : message
      )
      const response = await fetch('http://127.0.0.1:11434/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model, messages: requestMessages, stream: true }),
        signal: controller.signal
      })
      if (!response.ok)
        return {
          ok: false,
          reason: (await response.text()).slice(0, 400) || 'The local model could not answer.'
        }
      let answer = ''
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let pending = ''
      while (true) {
        const { value: chunk, done } = await reader.read()
        pending += decoder.decode(chunk || new Uint8Array(), { stream: !done })
        const lines = pending.split('\n')
        pending = lines.pop() || ''
        for (const line of lines) {
          if (!line.trim()) continue
          const data = JSON.parse(line)
          const token = data.message?.content || ''
          if (!token) continue
          answer += token
          if (!event.sender.isDestroyed())
            event.sender.send('browser:hrx-ai-stream', { requestId, token })
        }
        if (done) break
      }
      if (pending.trim()) {
        const data = JSON.parse(pending)
        answer += data.message?.content || ''
      }
      answer ||= 'The model returned an empty answer.'
      if (persistConversation) {
        await appendHrxAiConversation([
          { role: 'assistant', content: answer, model, createdAt: new Date().toISOString() }
        ]).catch(() => {})
      }
      return { ok: true, answer }
    } catch {
      if (controller.signal.aborted) return { ok: false, reason: 'Generation stopped.' }
      return {
        ok: false,
        reason:
          'Could not reach local AI. Check that Ollama is running and the selected model is installed.'
      }
    } finally {
      hrxAiRequests.delete(requestKey)
    }
  })

  ipcMain.handle('browser:hrx-ai-cancel', (event, requestId) => {
    const mainWindow = getTrustedMainWindow(event)
    if (!mainWindow || typeof requestId !== 'string') return false
    const controller = hrxAiRequests.get(`${event.sender.id}:${requestId.slice(0, 80)}`)
    if (!controller) return false
    controller.abort()
    return true
  })

  ipcMain.handle('browser:set-gaming-boost', (event, enabled) => {
    const mainWindow = getTrustedMainWindow(event)
    const data = mainWindow && browserWindows.get(mainWindow)
    if (!mainWindow || !data) return false
    data.gamingBoost = Boolean(enabled)
    for (const tab of data.tabs) {
      if (tab.view && !tab.view.webContents.isDestroyed()) {
        tab.view.webContents.setBackgroundThrottling(!data.gamingBoost)
      }
    }
    sendWindowState(mainWindow)
    return data.gamingBoost
  })

  ipcMain.handle('browser:set-notifications-enabled', (event, enabled) => {
    const mainWindow = getTrustedMainWindow(event)
    const data = mainWindow && browserWindows.get(mainWindow)
    if (!data) return false
    data.notificationsEnabled = Boolean(enabled)
    return data.notificationsEnabled
  })

  ipcMain.handle('browser:set-resource-controls', async (event, value) => {
    const mainWindow = getTrustedMainWindow(event)
    const data = mainWindow && browserWindows.get(mainWindow)
    if (!mainWindow || !data || !value || typeof value !== 'object') {
      return { ok: false, reason: 'Invalid control settings.' }
    }
    const clamp = (number, minimum, maximum, fallback) => {
      const parsed = Number(number)
      return Number.isFinite(parsed) ? Math.max(minimum, Math.min(maximum, parsed)) : fallback
    }
    const controls = {
      cpuEnabled: Boolean(value.cpuEnabled),
      cpuRate: clamp(value.cpuRate, 1, 8, 1),
      networkEnabled: Boolean(value.networkEnabled),
      downloadMbps: clamp(value.downloadMbps, 0.1, 100, 5),
      uploadMbps: clamp(value.uploadMbps, 0.1, 100, 2)
    }
    const failures = []
    for (const tab of data.tabs) {
      try {
        const result = await applyResourceControls(tab, controls)
        if (!result.ok) failures.push(result.reason)
      } catch {
        failures.push('A tab could not apply the resource limit.')
      }
    }
    if (failures.length) {
      for (const tab of data.tabs) {
        try {
          await applyResourceControls(tab, data.resourceControls)
        } catch {
          // Keep the original control settings if a tab's debugger is unavailable.
        }
      }
      return { ok: false, reason: failures[0], controls: data.resourceControls }
    }
    data.resourceControls = controls
    sendWindowState(mainWindow)
    return { ok: true, controls }
  })

  ipcMain.handle('browser:set-shader-effect', async (event, value) => {
    const mainWindow = getTrustedMainWindow(event)
    const data = mainWindow && browserWindows.get(mainWindow)
    const effect = typeof value === 'string' ? value.toLowerCase() : ''
    if (!mainWindow || !data || !Object.hasOwn(shaderStyles, effect)) {
      return { ok: false, effect: data?.shaderEffect || 'none' }
    }
    data.shaderEffect = effect
    await Promise.all(data.tabs.map((tab) => applyShaderEffect(tab, effect)))
    sendWindowState(mainWindow)
    return { ok: true, effect }
  })

  ipcMain.handle('browser:toggle-reader-mode', async (event) => {
    const mainWindow = getTrustedMainWindow(event)
    const tab = mainWindow && getActiveTab(mainWindow)
    if (!mainWindow || !tab?.view || tab.showingHome) return { ok: false }
    const enabled = await updateReaderMode(tab, !tab.readerMode)
    sendWindowState(mainWindow)
    return { ok: true, enabled }
  })

  ipcMain.handle('browser:get-tab-processes', async (event) => {
    const mainWindow = getTrustedMainWindow(event)
    return mainWindow ? getTabProcessRows(mainWindow) : []
  })

  ipcMain.handle('browser:get-cleanup-stats', async (event) => {
    const mainWindow = getTrustedMainWindow(event)
    const data = mainWindow && browserWindows.get(mainWindow)
    if (!mainWindow || !data) return null
    const cacheBytes = await getBrowserSession(mainWindow)
      .getCacheSize()
      .catch(() => 0)
    return {
      cacheBytes,
      tabCount: data.tabs.length,
      historyCount: data.tabs.reduce(
        (total, tab) =>
          total + (tab.view?.webContents.navigationHistory.getAllEntries().length || 0),
        0
      ),
      downloadCount: data.downloads.length
    }
  })

  ipcMain.handle('browser:get-system-metrics', async (event) => {
    if (!getTrustedMainWindow(event)) return null
    return getSystemMetrics()
  })

  ipcMain.handle('browser:get-vpn-profiles', async (event) => {
    if (!getTrustedMainWindow(event)) return { supported: false, profiles: [] }
    return readSystemVpnProfiles()
  })

  ipcMain.handle('browser:connect-vpn', async (event, profileName) => {
    if (!getTrustedMainWindow(event) || typeof profileName !== 'string') return { ok: false }
    const { supported, profiles } = await readSystemVpnProfiles()
    if (!supported) return { ok: false, reason: 'System VPN controls are available on Windows.' }
    const profile = profiles.find((item) => item.name === profileName)
    if (!profile) return { ok: false, reason: 'Choose a VPN profile configured in Windows.' }
    if (profile.status === 'Connected') return { ok: true }
    try {
      await execFileAsync('rasdial.exe', [profile.name], {
        windowsHide: true,
        timeout: 20000,
        maxBuffer: 128 * 1024
      })
      return { ok: true }
    } catch {
      return {
        ok: false,
        reason: 'Windows could not connect. Check the VPN profile and saved sign-in details.'
      }
    }
  })

  ipcMain.handle('browser:disconnect-vpn', async (event, profileName) => {
    if (!getTrustedMainWindow(event) || typeof profileName !== 'string') return { ok: false }
    const { supported, profiles } = await readSystemVpnProfiles()
    if (!supported) return { ok: false, reason: 'System VPN controls are available on Windows.' }
    const profile = profiles.find((item) => item.name === profileName)
    if (!profile) return { ok: false, reason: 'Choose a VPN profile configured in Windows.' }
    try {
      await execFileAsync('rasdial.exe', [profile.name, '/disconnect'], {
        windowsHide: true,
        timeout: 15000,
        maxBuffer: 128 * 1024
      })
      return { ok: true }
    } catch {
      return { ok: false, reason: 'Windows could not disconnect this VPN profile.' }
    }
  })

  ipcMain.handle('browser:open-vpn-settings', async (event) => {
    if (!getTrustedMainWindow(event) || process.platform !== 'win32') return false
    try {
      await shell.openExternal('ms-settings:network-vpn')
      return true
    } catch {
      return false
    }
  })

  ipcMain.handle('browser:get-page-performance', async (event) => {
    const mainWindow = getTrustedMainWindow(event)
    const tab = mainWindow && getActiveTab(mainWindow)
    if (!mainWindow || !tab?.view || tab.showingHome || tab.view.webContents.isDestroyed()) {
      return null
    }
    const [rows, timing] = await Promise.all([
      getTabProcessRows(mainWindow),
      tab.view.webContents
        .executeJavaScript(
          '(() => { const item = performance.getEntriesByType("navigation")[0]; return item ? { loadMs: Math.round(item.loadEventEnd || item.duration), domMs: Math.round(item.domContentLoadedEventEnd || 0), transferBytes: item.transferSize || 0 } : null })()'
        )
        .catch(() => null)
    ])
    return { process: rows.find((row) => row.id === tab.id) || null, timing }
  })

  ipcMain.handle('browser:get-extensions', async (event) => {
    const mainWindow = getTrustedMainWindow(event)
    if (!mainWindow) return []
    const data = browserWindows.get(mainWindow)
    if (data.incognito) return []
    const browserSession = getBrowserSession(mainWindow)
    await ensureSavedExtensionsLoaded(browserSession)
    return browserSession.extensions.getAllExtensions().map(({ id, name, version }) => ({
      id,
      name,
      version
    }))
  })

  ipcMain.handle('browser:load-extension', async (event) => {
    const mainWindow = getTrustedMainWindow(event)
    if (!mainWindow) return { ok: false }
    const data = browserWindows.get(mainWindow)
    if (data.incognito) return { ok: false, reason: 'incognito-not-supported' }
    const choice = await dialog.showOpenDialog(mainWindow, {
      title: 'Choose an unpacked extension folder',
      properties: ['openDirectory']
    })
    if (choice.canceled || !choice.filePaths[0]) return { canceled: true }
    const browserSession = getBrowserSession(mainWindow)
    await ensureSavedExtensionsLoaded(browserSession)
    try {
      const extension = await browserSession.extensions.loadExtension(choice.filePaths[0])
      await saveExtensionRegistry(browserSession)
      return {
        ok: true,
        extension: { id: extension.id, name: extension.name, version: extension.version }
      }
    } catch (error) {
      return {
        ok: false,
        reason: String(error?.message || 'Extension could not be loaded').slice(0, 300)
      }
    }
  })

  ipcMain.handle('browser:remove-extension', async (event, extensionId) => {
    const mainWindow = getTrustedMainWindow(event)
    if (!mainWindow || typeof extensionId !== 'string') return false
    const data = browserWindows.get(mainWindow)
    if (data.incognito) return false
    const browserSession = getBrowserSession(mainWindow)
    const extension = browserSession.extensions.getExtension(extensionId)
    if (!extension) return false
    browserSession.extensions.removeExtension(extensionId)
    await saveExtensionRegistry(browserSession)
    return true
  })

  ipcMain.handle('browser:new-window', (event, incognito = false) => {
    if (!getTrustedMainWindow(event)) return false
    createWindow({ incognito: Boolean(incognito) })
    return true
  })

  ipcMain.handle('browser:get-history', (event) => {
    const mainWindow = getTrustedMainWindow(event)
    const data = mainWindow && browserWindows.get(mainWindow)
    if (!data) return []
    return data.tabs
      .flatMap((tab) =>
        (tab.view?.webContents.navigationHistory.getAllEntries() ?? [])
          .filter((entry) => /^https:\/\//i.test(entry.url))
          .map((entry) => ({ title: entry.title || entry.url, url: entry.url, tabId: tab.id }))
      )
      .reverse()
      .slice(0, 100)
  })

  ipcMain.handle('browser:get-downloads', (event) => {
    const mainWindow = getTrustedMainWindow(event)
    return (mainWindow && browserWindows.get(mainWindow)?.downloads.slice(0, 50)) ?? []
  })

  ipcMain.handle('browser:zoom', (event, percent) => {
    const mainWindow = getTrustedMainWindow(event)
    const tab = mainWindow && getActiveTab(mainWindow)
    const value = Math.max(50, Math.min(300, Math.round(Number(percent) / 10) * 10))
    if (Number.isFinite(value)) {
      if (tab?.view && !tab.showingHome) {
        tab.view.webContents.setZoomFactor(value / 100)
      } else if (tab?.showingHome && mainWindow && !mainWindow.webContents.isDestroyed()) {
        mainWindow.webContents.send('browser:zoom-changed', value)
      }
    }
    return value
  })

  ipcMain.handle('browser:print', (event) => {
    const mainWindow = getTrustedMainWindow(event)
    const tab = mainWindow && getActiveTab(mainWindow)
    if (tab?.view && !tab.showingHome) tab.view.webContents.print()
    return Boolean(tab?.view && !tab.showingHome)
  })

  ipcMain.handle('browser:save-page', async (event) => {
    const mainWindow = getTrustedMainWindow(event)
    const tab = mainWindow && getActiveTab(mainWindow)
    if (!mainWindow || !tab?.view || tab.showingHome) return { ok: false }
    const suggestedName = `${(tab.title || 'webpage').replace(/[<>:"/\\|?*]/g, '_')}.html`
    const choice = await dialog.showSaveDialog(mainWindow, {
      title: 'Save page',
      defaultPath: join(app.getPath('downloads'), suggestedName),
      filters: [{ name: 'Web page', extensions: ['html'] }]
    })
    if (choice.canceled || !choice.filePath) return { ok: false, canceled: true }
    try {
      await tab.view.webContents.savePage(choice.filePath, 'HTMLComplete')
      return { ok: true }
    } catch {
      return { ok: false }
    }
  })

  ipcMain.handle('browser:share-url', (event) => {
    const mainWindow = getTrustedMainWindow(event)
    const tab = mainWindow && getActiveTab(mainWindow)
    const url = tab?.view && !tab.showingHome ? tab.view.webContents.getURL() : ''
    if (!url || !url.startsWith('https://')) return { ok: false }
    clipboard.writeText(url)
    return { ok: true }
  })

  ipcMain.handle('browser:open-devtools', (event) => {
    const mainWindow = getTrustedMainWindow(event)
    const tab = mainWindow && getActiveTab(mainWindow)
    if (!tab?.view || tab.showingHome) return false
    tab.view.webContents.openDevTools({ mode: 'detach' })
    return true
  })

  ipcMain.handle('browser:exit', (event) => {
    if (!getTrustedMainWindow(event)) return false
    app.quit()
    return true
  })

  ipcMain.handle('browser:find', (event, value) => {
    const mainWindow = getTrustedMainWindow(event)
    const tab = mainWindow && getActiveTab(mainWindow)
    const term = typeof value === 'string' ? value.slice(0, 200) : ''
    if (!term || !tab?.view || tab.showingHome) return false
    tab.view.webContents.findInPage(term, { forward: true })
    return true
  })

  ipcMain.handle('browser:stop-find', (event) => {
    const mainWindow = getTrustedMainWindow(event)
    const tab = mainWindow && getActiveTab(mainWindow)
    tab?.view?.webContents.stopFindInPage('clearSelection')
  })

  ipcMain.handle('browser:edit', (event, command) => {
    const mainWindow = getTrustedMainWindow(event)
    const tab = mainWindow && getActiveTab(mainWindow)
    const methods = {
      undo: 'undo',
      redo: 'redo',
      cut: 'cut',
      copy: 'copy',
      paste: 'paste',
      selectAll: 'selectAll'
    }
    const method = methods[command]
    if (method && tab?.view && !tab.showingHome) tab.view.webContents[method]()
  })

  ipcMain.handle('browser:group-tab', (event, group) => {
    const mainWindow = getTrustedMainWindow(event)
    const tab = mainWindow && getActiveTab(mainWindow)
    if (!tab) return false
    tab.group = typeof group === 'string' ? group.trim().slice(0, 24) : ''
    sendWindowState(mainWindow)
    return true
  })

  ipcMain.handle('browser:clear-data', async (event) => {
    if (!getTrustedMainWindow(event)) return false
    for (const [mainWindow, data] of browserWindows) {
      await data.browserSession?.clearStorageData()
      await data.browserSession?.clearCache()
      for (const tab of data.tabs) {
        tab.view?.webContents.navigationHistory.clear()
        if (tab.view && !tab.view.webContents.isDestroyed()) tab.view.webContents.destroy()
      }
      removeAllBrowserViews(mainWindow)
      data.tabs = []
      createTab(mainWindow)
      sendWindowState(mainWindow)
    }
    return true
  })

  ipcMain.handle('browser:clean-selected-data', async (event, selection) => {
    const mainWindow = getTrustedMainWindow(event)
    if (!mainWindow || !selection || typeof selection !== 'object') return { ok: false }
    const windows = [...browserWindows.entries()].filter(([window]) => !window.isDestroyed())
    if (selection.cache) {
      const sessions = new Set(windows.map(([window]) => getBrowserSession(window)))
      for (const browserSession of sessions) await browserSession.clearCache()
    }
    if (selection.cookies) {
      const sessions = new Set(windows.map(([window]) => getBrowserSession(window)))
      for (const browserSession of sessions) {
        await browserSession.clearStorageData({
          storages: [
            'cookies',
            'filesystem',
            'indexdb',
            'localstorage',
            'serviceworkers',
            'cachestorage'
          ]
        })
      }
    }
    if (selection.tabs || selection.history) {
      for (const [window, data] of windows) {
        if (selection.tabs) {
          removeAllBrowserViews(window)
          for (const tab of data.tabs) {
            if (tab.view && !tab.view.webContents.isDestroyed()) tab.view.webContents.destroy()
          }
          data.tabs = []
          createTab(window)
        } else {
          for (const tab of data.tabs) tab.view?.webContents.navigationHistory.clear()
        }
        sendWindowState(window)
      }
    }
    if (selection.downloads) {
      for (const [window, data] of windows) {
        data.downloads = []
        if (!window.webContents.isDestroyed())
          window.webContents.send('browser:downloads-updated', [])
      }
    }
    return { ok: true }
  })

  ipcMain.handle('browser:list-passwords', async (event) => {
    if (!getTrustedMainWindow(event) || !(await safeStorage.isAsyncEncryptionAvailable())) return []
    try {
      return (await readPasswordVault()).map(({ id, host, username }) => ({ id, host, username }))
    } catch {
      return []
    }
  })

  ipcMain.handle('browser:save-password', async (event, value) => {
    const mainWindow = getTrustedMainWindow(event)
    const tab = mainWindow && getActiveTab(mainWindow)
    if (!tab?.view || tab.showingHome || !(await safeStorage.isAsyncEncryptionAvailable())) {
      return { ok: false, reason: 'unavailable' }
    }
    const username = typeof value?.username === 'string' ? value.username.trim().slice(0, 256) : ''
    const password = typeof value?.password === 'string' ? value.password.slice(0, 2048) : ''
    let origin
    try {
      const page = new URL(tab.view.webContents.getURL())
      if (page.protocol !== 'https:') return { ok: false, reason: 'https-only' }
      origin = page.origin
    } catch {
      return { ok: false, reason: 'no-page' }
    }
    if (!username || !password) return { ok: false, reason: 'missing-fields' }
    const records = await readPasswordVault()
    const existing = records.findIndex(
      (item) => item.origin === origin && item.username === username
    )
    const record = { id: randomUUID(), origin, host: new URL(origin).hostname, username, password }
    if (existing >= 0) records[existing] = record
    else records.push(record)
    return { ok: await writePasswordVault(records) }
  })

  ipcMain.handle('browser:remove-password', async (event, id) => {
    if (!getTrustedMainWindow(event) || typeof id !== 'string') return false
    const records = await readPasswordVault()
    return writePasswordVault(records.filter((item) => item.id !== id))
  })

  ipcMain.handle('browser:autofill-password', async (event, id) => {
    const mainWindow = getTrustedMainWindow(event)
    const tab = mainWindow && getActiveTab(mainWindow)
    if (!tab?.view || tab.showingHome) return { ok: false }
    const records = await readPasswordVault()
    const credential = records.find((item) => item.id === id)
    if (!credential || new URL(tab.view.webContents.getURL()).origin !== credential.origin) {
      return { ok: false }
    }
    const source = `(() => {
      const userValue = ${JSON.stringify(credential.username)};
      const passwordValue = ${JSON.stringify(credential.password)};
      const fields = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([disabled])'));
      const passwordField = fields.find((field) => field.type === 'password');
      const userField = fields.find((field) => field !== passwordField && /email|user|login|account/i.test([field.name, field.id, field.autocomplete, field.placeholder].join(' ')));
      const setValue = (field, value) => {
        if (!field) return;
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(field, value);
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
      };
      setValue(userField, userValue);
      setValue(passwordField, passwordValue);
      return Boolean(passwordField);
    })()`
    try {
      const filled = await tab.view.webContents.executeJavaScript(source)
      return { ok: Boolean(filled) }
    } catch {
      return { ok: false }
    }
  })

  ipcMain.handle('browser:navigate', async (event, value) => {
    const destination = normalizeWebAddress(value)
    const mainWindow = getTrustedMainWindow(event)
    const tab = mainWindow && getActiveTab(mainWindow)
    if (!destination || !mainWindow || !tab) return { ok: false }

    if (isGoogleSignInUrl(destination)) {
      try {
        await shell.openExternal(destination)
        return { ok: true, url: destination, external: true }
      } catch {
        return { ok: false }
      }
    }

    const view = await ensureTabView(mainWindow, tab)
    tab.showingHome = false
    removeAllBrowserViews(mainWindow)
    mainWindow.contentView.addChildView(view)
    resizeActiveView(mainWindow)
    try {
      await view.webContents.loadURL(destination)
      sendWindowState(mainWindow)
      return { ok: true, url: destination }
    } catch {
      sendWindowState(mainWindow)
      return { ok: false }
    }
  })

  ipcMain.handle('browser:back', (event) => {
    const mainWindow = getTrustedMainWindow(event)
    const tab = mainWindow && getActiveTab(mainWindow)
    if (mainWindow && tab?.view?.webContents.navigationHistory.canGoBack()) {
      tab.showingHome = false
      removeAllBrowserViews(mainWindow)
      mainWindow.contentView.addChildView(tab.view)
      resizeActiveView(mainWindow)
      tab.view.webContents.navigationHistory.goBack()
    }
    if (mainWindow) sendWindowState(mainWindow)
  })

  ipcMain.handle('browser:forward', (event) => {
    const mainWindow = getTrustedMainWindow(event)
    const tab = mainWindow && getActiveTab(mainWindow)
    if (mainWindow && tab?.view?.webContents.navigationHistory.canGoForward()) {
      tab.showingHome = false
      removeAllBrowserViews(mainWindow)
      mainWindow.contentView.addChildView(tab.view)
      resizeActiveView(mainWindow)
      tab.view.webContents.navigationHistory.goForward()
    }
    if (mainWindow) sendWindowState(mainWindow)
  })

  ipcMain.handle('browser:reload', (event) => {
    const mainWindow = getTrustedMainWindow(event)
    const tab = mainWindow && getActiveTab(mainWindow)
    if (tab?.view && !tab.showingHome) tab.view.webContents.reload()
  })
  ipcMain.handle('browser:home', (event) => {
    const mainWindow = getTrustedMainWindow(event)
    const tab = mainWindow && getActiveTab(mainWindow)
    if (mainWindow && tab) {
      tab.showingHome = true
      removeAllBrowserViews(mainWindow)
      sendWindowState(mainWindow)
    }
  })

  ipcMain.handle('browser:new-tab', (event) => {
    const mainWindow = getTrustedMainWindow(event)
    if (!mainWindow) return
    removeAllBrowserViews(mainWindow)
    createTab(mainWindow)
    sendWindowState(mainWindow)
  })

  ipcMain.handle('browser:switch-tab', (event, tabId) => {
    const mainWindow = getTrustedMainWindow(event)
    const tab = mainWindow && browserWindows.get(mainWindow)?.tabs.find((item) => item.id === tabId)
    if (mainWindow && tab) activateTab(mainWindow, tab)
  })

  ipcMain.handle('browser:close-tab', (event, tabId) => {
    const mainWindow = getTrustedMainWindow(event)
    const data = mainWindow && browserWindows.get(mainWindow)
    const index = data?.tabs.findIndex((item) => item.id === tabId) ?? -1
    if (!mainWindow || !data || index < 0) return

    const [tab] = data.tabs.splice(index, 1)
    if (tab.view) {
      if (mainWindow.contentView.children.includes(tab.view)) {
        mainWindow.contentView.removeChildView(tab.view)
      }
      if (!tab.view.webContents.isDestroyed()) tab.view.webContents.destroy()
    }

    if (data.tabs.length === 0) {
      createTab(mainWindow)
    } else if (data.activeTabId === tabId) {
      const nextTab = data.tabs[Math.min(index, data.tabs.length - 1)]
      activateTab(mainWindow, nextTab)
      return
    }
    sendWindowState(mainWindow)
  })

  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
