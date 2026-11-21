import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import browserMark from '../../../build/icon.svg'
import homeWordmark from './assets/hrishikesh-wordmark.png'
import gxWallpaper from './assets/hrishikesh-gx-wallpaper.png'
import './assets/home.css'
import './assets/gaming.css'

const themes = [
  ['Hrishikesh Gaming', '#09090d', '#17131a', '#ff174e', true],
  ['Midnight', '#111522', '#1d2333', '#9486ff', true],
  ['Ocean', '#eaf6fb', '#ffffff', '#188db3', false],
  ['Forest', '#edf5ee', '#ffffff', '#3f7c50', false],
  ['Sunset', '#fff2e8', '#ffffff', '#e5794f', false],
  ['Rose', '#fff0f4', '#ffffff', '#d65479', false],
  ['Lavender', '#f3efff', '#ffffff', '#7658c9', false],
  ['Sand', '#f5f0e6', '#fffdf8', '#98703f', false],
  ['Crimson', '#fff0f0', '#ffffff', '#c8444b', false],
  ['Emerald', '#eaf7f2', '#ffffff', '#218468', false],
  ['Arctic', '#eef6ff', '#ffffff', '#347bbd', false],
  ['Sakura', '#fff2f7', '#ffffff', '#d65b94', false],
  ['Cyber', '#11111d', '#1d1d2d', '#19cce0', true],
  ['Graphite', '#25282e', '#30343c', '#aeb8c6', true],
  ['Royal', '#efefff', '#ffffff', '#4446a8', false],
  ['Peach', '#fff2ea', '#ffffff', '#cf7652', false],
  ['Mint', '#e9f7f0', '#ffffff', '#38a585', false],
  ['Mocha', '#f2e9df', '#fffaf4', '#825c47', false],
  ['Neon', '#151a12', '#222a1e', '#c5ef4a', true],
  ['Gray', '#e7e9ed', '#f7f8fa', '#6b7280', false]
].map(([name, background, panel, accent, dark]) => ({
  name,
  background,
  panel,
  accent,
  text: dark ? '#f4f5fb' : '#262b43',
  muted: dark ? '#b0b7ca' : '#9297ab',
  border: dark ? '#3a4054' : '#e6e8ef',
  dark
}))

const shaderEffects = [
  { id: 'none', name: 'None' },
  { id: 'shiftfx', name: 'ShiftFX' },
  { id: 'midnightfx', name: 'MidnightFX' },
  { id: 'fadefx', name: 'FadeFX' },
  { id: 'boostfx', name: 'BoostFX' },
  { id: 'monocore', name: 'MonoCore' },
  { id: 'duofx', name: 'DuoFX' }
]

function isDarkColor(hex) {
  const value = hex.replace('#', '')
  const red = Number.parseInt(value.slice(0, 2), 16)
  const green = Number.parseInt(value.slice(2, 4), 16)
  const blue = Number.parseInt(value.slice(4, 6), 16)
  return red * 0.299 + green * 0.587 + blue * 0.114 < 145
}
// The icon names come from the fixed shortcut list above.
// eslint-disable-next-line react/prop-types
function ShortcutLogo({ name }) {
  const paths = {
    Google: (
      <>
        <path
          fill="#4285F4"
          d="M47.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h13.2a11.3 11.3 0 0 1-4.9 7.4l7.7 6C44.5 38.2 47.5 32 47.5 24.5Z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.5 0 12-2.1 16-5.7l-7.7-6c-2.1 1.4-4.8 2.2-8.3 2.2-6.3 0-11.6-4.2-13.5-9.9l-8 6.2C6.5 42.6 14.6 48 24 48Z"
        />
        <path
          fill="#FBBC05"
          d="M10.5 28.6a14.4 14.4 0 0 1 0-9.2l-8-6.2a24 24 0 0 0 0 21.6l8-6.2Z"
        />
        <path
          fill="#EA4335"
          d="M24 9.5c3.5 0 6.7 1.2 9.2 3.6l6.9-6.9C35.9 2.4 30.5 0 24 0 14.6 0 6.5 5.4 2.5 13.2l8 6.2C12.4 13.7 17.7 9.5 24 9.5Z"
        />
      </>
    ),
    YouTube: (
      <>
        <rect x="3" y="9" width="42" height="30" rx="9" fill="#ff0033" />
        <path d="m20 16 13 8-13 8V16Z" fill="white" />
      </>
    ),
    GitHub: (
      <path
        fill="currentColor"
        d="M24 .9C11.3.9 1 11.2 1 23.9c0 10.2 6.6 18.8 15.7 21.8 1.1.2 1.6-.5 1.6-1.1v-4.2c-6.4 1.4-7.8-2.7-7.8-2.7-1-2.7-2.6-3.4-2.6-3.4-2.1-1.4.2-1.4.2-1.4 2.3.2 3.5 2.4 3.5 2.4 2.1 3.5 5.4 2.5 6.7 1.9.2-1.5.8-2.5 1.4-3.1-5.1-.6-10.5-2.5-10.5-11.3 0-2.5.9-4.6 2.4-6.2-.2-.6-1-2.9.2-6.1 0 0 2-.6 6.4 2.4a22 22 0 0 1 11.6 0c4.4-3 6.4-2.4 6.4-2.4 1.2 3.2.4 5.5.2 6.1 1.5 1.6 2.4 3.7 2.4 6.2 0 8.8-5.4 10.7-10.5 11.3.8.7 1.5 2 1.5 4.1v6.2c0 .6.4 1.3 1.6 1.1 9.1-3 15.7-11.6 15.7-21.8C47 11.2 36.7.9 24 .9Z"
      />
    ),
    Instagram: (
      <>
        <defs>
          <linearGradient id="instagramGradient" x1="0" y1="1" x2="1" y2="0">
            <stop stopColor="#ffb13d" />
            <stop offset=".48" stopColor="#e1306c" />
            <stop offset="1" stopColor="#833ab4" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="40" height="40" rx="12" fill="url(#instagramGradient)" />
        <rect
          x="12"
          y="12"
          width="24"
          height="24"
          rx="7"
          fill="none"
          stroke="white"
          strokeWidth="3.5"
        />
        <circle cx="24" cy="24" r="6" fill="none" stroke="white" strokeWidth="3.5" />
        <circle cx="33" cy="15" r="2" fill="white" />
      </>
    ),
    LinkedIn: (
      <>
        <rect x="3" y="3" width="42" height="42" rx="8" fill="#0a66c2" />
        <path
          fill="white"
          d="M13 19h5v16h-5V19Zm2.5-7a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM21 19h4.8v2.2h.1c.7-1.3 2.3-2.7 4.8-2.7 5.1 0 6.1 3.4 6.1 7.8V35h-5v-7.7c0-1.8 0-4.1-2.5-4.1s-2.9 2-2.9 4V35h-5V19Z"
        />
      </>
    ),
    Gmail: (
      <>
        <path fill="#4285f4" d="M7 12h5v25H7z" />
        <path fill="#34a853" d="M36 12h5v25h-5z" />
        <path fill="#ea4335" d="M7 14.5 10 11l14 10 14-10 3 3.5-17 13L7 14.5Z" />
        <path fill="#c5221f" d="M7 12.5 10 11l2 1.5V17l-5-3.5v-1Z" />
        <path fill="#fbbc04" d="M41 12.5 38 11l-2 1.5V17l5-3.5v-1Z" />
      </>
    )
  }

  return (
    <svg className="shortcut-logo" viewBox="0 0 48 48" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

// eslint-disable-next-line react/prop-types
function GxMeter({ label, value, display, unit = '' }) {
  const percent = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <div
      className="gx-dial-meter"
      role="meter"
      aria-label={`${label}: ${display}${unit}`}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow={Math.round(percent)}
    >
      <div className="gx-dial-ring" style={{ '--dial-value': `${percent}%` }}>
        <div className="gx-dial-core">
          <small>{label}</small>
          <strong>
            {display}
            {unit && <i>{unit}</i>}
          </strong>
        </div>
      </div>
    </div>
  )
}

function App() {
  const addressInputRef = useRef(null)
  const bookmarkImportRef = useRef(null)
  const [addressQuery, setAddressQuery] = useState('')
  const [homeQuery, setHomeQuery] = useState('')
  const [activeTheme, setActiveTheme] = useState(themes[0])
  const [showCustomizer, setShowCustomizer] = useState(false)
  const [customBackground, setCustomBackground] = useState('#09090d')
  const [customPanel, setCustomPanel] = useState('#17131a')
  const [customAccent, setCustomAccent] = useState('#ff174e')
  const [backgroundPhoto, setBackgroundPhoto] = useState('')
  const [photoZoom, setPhotoZoom] = useState(100)
  const [photoX, setPhotoX] = useState(50)
  const [photoY, setPhotoY] = useState(50)
  const [photoBrightness, setPhotoBrightness] = useState(100)
  const [saveMessage, setSaveMessage] = useState('')
  const [homeShortcuts, setHomeShortcuts] = useState([])
  const [bookmarks, setBookmarks] = useState([])
  const [readingList, setReadingList] = useState([])
  const [showBookmarksBar, setShowBookmarksBar] = useState(false)
  const [bookmarkMenuOpen, setBookmarkMenuOpen] = useState(false)
  const [browserMenuOpen, setBrowserMenuOpen] = useState(false)
  const [browserMenuView, setBrowserMenuView] = useState('')
  const [hoveredBrowserMenuView, setHoveredBrowserMenuView] = useState('')
  const [hoveredBrowserMenuTop, setHoveredBrowserMenuTop] = useState(0)
  const [browserNotice, setBrowserNotice] = useState('')
  const [homeAppsOpen, setHomeAppsOpen] = useState(false)
  const [homeProfileOpen, setHomeProfileOpen] = useState(false)
  const [googleSignedIn, setGoogleSignedIn] = useState(false)
  const [accountPageTabId, setAccountPageTabId] = useState(null)
  const [helpPageTabId, setHelpPageTabId] = useState(null)
  const [hrxAiPageTabId, setHrxAiPageTabId] = useState(null)
  const [hrxAiModel, setHrxAiModel] = useState('')
  const [hrxAiModels, setHrxAiModels] = useState([])
  const [hrxAiStatus, setHrxAiStatus] = useState('Checking local AI…')
  const [hrxAiMessages, setHrxAiMessages] = useState([])
  const [hrxAiInput, setHrxAiInput] = useState('')
  const [hrxAiBusy, setHrxAiBusy] = useState(false)
  const [hrxAiNotice, setHrxAiNotice] = useState('')
  const [modsPageTabId, setModsPageTabId] = useState(null)
  const [modDraftName, setModDraftName] = useState('')
  const [modDraftTheme, setModDraftTheme] = useState('Cyber')
  const [modDraftEffect, setModDraftEffect] = useState('shiftfx')
  const [modNotice, setModNotice] = useState('')
  const [modsSoundEnabled, setModsSoundEnabled] = useState(
    () => window.localStorage.getItem('hrx-mod-sound') !== 'off'
  )
  const [modsSoundVolume, setModsSoundVolume] = useState(() =>
    Number(window.localStorage.getItem('hrx-mod-volume') || 35)
  )
  const [userMods, setUserMods] = useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem('hrx-user-mods') || '[]')
      return Array.isArray(saved) ? saved : []
    } catch {
      return []
    }
  })
  const [accountEmail, setAccountEmail] = useState('')
  const [accountConnectMessage, setAccountConnectMessage] = useState('')
  const [verticalTabs, setVerticalTabs] = useState(false)
  const [readerMode, setReaderMode] = useState(false)
  const [homeMailOpen, setHomeMailOpen] = useState(false)
  const [otherMailUrl, setOtherMailUrl] = useState('')
  const [historyEntries, setHistoryEntries] = useState([])
  const [addressSuggestionsOpen, setAddressSuggestionsOpen] = useState(false)
  const [homeSuggestionsOpen, setHomeSuggestionsOpen] = useState(false)
  const [activeAddressSuggestion, setActiveAddressSuggestion] = useState(-1)
  const [downloads, setDownloads] = useState([])
  const [tabProcesses, setTabProcesses] = useState([])
  const [gamingBoost, setGamingBoost] = useState(false)
  const [resourceControls, setResourceControls] = useState({
    cpuEnabled: false,
    cpuRate: 1,
    networkEnabled: false,
    downloadMbps: 5,
    uploadMbps: 2
  })
  const [resourceNotice, setResourceNotice] = useState('')
  const [systemMetrics, setSystemMetrics] = useState(null)
  const [shaderEffect, setShaderEffect] = useState(() => {
    const saved = window.localStorage.getItem('hrishikesh-shader-effect') || 'none'
    return shaderEffects.some((effect) => effect.id === saved) ? saved : 'none'
  })
  const [vpnData, setVpnData] = useState({ supported: false, profiles: [] })
  const [vpnNotice, setVpnNotice] = useState('')
  const [vpnBusy, setVpnBusy] = useState('')
  const [cpuGuardEnabled, setCpuGuardEnabled] = useState(false)
  const [ramGuardEnabled, setRamGuardEnabled] = useState(false)
  const [cpuGuardLimit, setCpuGuardLimit] = useState(65)
  const [ramGuardLimit, setRamGuardLimit] = useState(4096)
  const [guardNotice, setGuardNotice] = useState('')
  const [cleanupStats, setCleanupStats] = useState(null)
  const [cleanerSettings, setCleanerSettings] = useState({
    cache: true,
    cookies: false,
    tabs: false,
    history: true,
    downloads: false
  })
  const [cleanerPreset, setCleanerPreset] = useState('med')
  const [cleanerConfirm, setCleanerConfirm] = useState(false)
  const [cleanerNotice, setCleanerNotice] = useState('')
  const [sidebarVisibility, setSidebarVisibility] = useState(() => {
    const defaults = {
      home: true,
      games: true,
      stream: true,
      spaces: true,
      saved: true,
      history: true,
      settings: true
    }
    try {
      const saved = JSON.parse(window.localStorage.getItem('hrishikesh-sidebar-icons') || 'null')
      if (saved && typeof saved === 'object') {
        return {
          ...defaults,
          ...Object.fromEntries(
            Object.keys(defaults)
              .filter((key) => typeof saved[key] === 'boolean')
              .map((key) => [key, saved[key]])
          )
        }
      }
    } catch {
      // Keep all sidebar items visible when stored settings are unavailable.
    }
    return defaults
  })
  const sidebarSetupDefaults = {
    workspace0: true,
    workspace1: true,
    gxControl: true,
    gxCleaner: true,
    shaders: true,
    vpn: true,
    mods: true,
    twitch: true,
    hrxAi: true,
    messenger: false,
    whatsapp: false,
    discord: false,
    telegram: false,
    instagram: false,
    x: false,
    bluesky: false,
    rewards: false,
    player: true,
    flow: false,
    speedDial: true,
    bookmarks: true,
    news: false,
    pinboards: false,
    history: true,
    downloads: true,
    extensions: true,
    settings: true,
    showSidebar: true,
    notifications: false,
    gxMessengerIcons: true,
    centreIcons: false
  }
  const [sidebarSetupOpen, setSidebarSetupOpen] = useState(false)
  const [sidebarSetupPinned, setSidebarSetupPinned] = useState(false)
  const [sidebarSetupExpanded, setSidebarSetupExpanded] = useState(false)
  const [sidebarSetup, setSidebarSetup] = useState(() => {
    try {
      return {
        ...sidebarSetupDefaults,
        ...JSON.parse(window.localStorage.getItem('hrishikesh-sidebar-setup') || '{}')
      }
    } catch {
      return sidebarSetupDefaults
    }
  })
  const [sidebarWorkspaces, setSidebarWorkspaces] = useState(() => {
    try {
      return JSON.parse(
        window.localStorage.getItem('hrishikesh-workspaces') || '["Workspace 1","Workspace 2"]'
      )
    } catch {
      return ['Workspace 1', 'Workspace 2']
    }
  })
  const [sidebarExtensions, setSidebarExtensions] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem('hrishikesh-sidebar-extensions') || '[]')
    } catch {
      return []
    }
  })
  const notifiedDownloadIdsRef = useRef(new Set())
  const guardBusyRef = useRef(false)
  const resourceControlTimerRef = useRef(null)
  const [pagePerformance, setPagePerformance] = useState(null)
  const [extensions, setExtensions] = useState([])
  const [extensionNotice, setExtensionNotice] = useState('')
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')
  const [zoomPercent, setZoomPercent] = useState(100)
  const [findText, setFindText] = useState('')
  const [findMatches, setFindMatches] = useState(0)
  const [passwords, setPasswords] = useState([])
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [passwordNotice, setPasswordNotice] = useState('')
  const [tabGroupName, setTabGroupName] = useState('')
  const [tabSearchQuery, setTabSearchQuery] = useState('')
  const [windowName, setWindowName] = useState('')
  const [appVersion, setAppVersion] = useState('')
  const [issueReportText, setIssueReportText] = useState('')
  const [issueReportNotice, setIssueReportNotice] = useState('')
  const [clearDataConfirm, setClearDataConfirm] = useState(false)
  const [showShortcutForm, setShowShortcutForm] = useState(false)
  const [shortcutName, setShortcutName] = useState('')
  const [shortcutUrl, setShortcutUrl] = useState('')
  const [shortcutFormError, setShortcutFormError] = useState('')
  const [shortcutMenuUrl, setShortcutMenuUrl] = useState('')
  const [editingShortcutUrl, setEditingShortcutUrl] = useState('')
  const [editShortcutName, setEditShortcutName] = useState('')
  const [editShortcutAddress, setEditShortcutAddress] = useState('')
  const [tabs, setTabs] = useState([{ id: 'tab-1', title: 'New Tab' }])
  const [activeTabId, setActiveTabId] = useState('tab-1')
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)
  const [currentUrl, setCurrentUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isIncognito, setIsIncognito] = useState(false)
  const activeTab = tabs.find((tab) => tab.id === activeTabId)
  const homeWorkspace = activeTab?.group || 'Personal'
  const homeCpu = tabProcesses.reduce((total, row) => total + (row.cpu || 0), 0)
  const homeMemoryMb = Math.round(
    tabProcesses.reduce((total, row) => total + (row.memoryKb || 0), 0) / 1024
  )
  const systemRamPercent = systemMetrics?.memoryTotalBytes
    ? Math.min(100, (systemMetrics.memoryUsedBytes / systemMetrics.memoryTotalBytes) * 100)
    : 0
  const peakNetworkMbps = Math.max(
    systemMetrics?.downloadMbps || 0,
    systemMetrics?.uploadMbps || 0,
    0.1
  )
  const networkMeterScale = Math.max(20, 2 ** (Math.ceil(Math.log2(peakNetworkMbps)) + 1))

  useEffect(() => {
    const applyState = (state) => {
      if (!state) return
      setTabs(state.tabs)
      setActiveTabId(state.activeTabId)
      setCanGoBack(state.canGoBack)
      setCanGoForward(state.canGoForward)
      setIsLoading(Boolean(state.isLoading))
      setCurrentUrl(state.url)
      setIsIncognito(Boolean(state.incognito))
      setVerticalTabs(Boolean(state.verticalTabs))
      setGamingBoost(Boolean(state.gamingBoost))
      if (state.resourceControls) setResourceControls(state.resourceControls)
      setReaderMode(Boolean(state.readerMode))
      setAddressQuery(state.url || '')
      if (!state.url) setHomeQuery('')
    }

    const unsubscribe = window.api.onNavigationState(applyState)
    window.api.getState().then(applyState)
    window.api.getPreferences().then((saved) => {
      if (!saved) return
      if (saved.theme) {
        setActiveTheme(
          ['Aurora', 'Hrishikesh GX'].includes(saved.theme.name) ? themes[0] : saved.theme
        )
      }
      setCustomBackground(saved.customBackground)
      setCustomPanel(saved.customPanel)
      setCustomAccent(saved.customAccent)
      setBackgroundPhoto(saved.backgroundPhoto || '')
      setPhotoZoom(saved.photoZoom ?? 100)
      setPhotoX(saved.photoX ?? 50)
      setPhotoY(saved.photoY ?? 50)
      setPhotoBrightness(saved.photoBrightness ?? 100)
      setShowBookmarksBar(Boolean(saved.showBookmarksBar))
      if (Array.isArray(saved.shortcuts)) {
        const retainedShortcuts = saved.shortcuts.filter(
          (item) => !/chatgpt|claude/i.test(`${item.name || ''} ${item.url || ''}`)
        )
        setHomeShortcuts(retainedShortcuts)
        if (retainedShortcuts.length !== saved.shortcuts.length) {
          window.api.savePreferences({ ...saved, shortcuts: retainedShortcuts })
        }
      }
      if (Array.isArray(saved.bookmarks)) setBookmarks(saved.bookmarks)
      if (Array.isArray(saved.readingList)) setReadingList(saved.readingList)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    const applyGoogleAccountState = (state) => setGoogleSignedIn(Boolean(state?.signedIn))
    const unsubscribe = window.api.onGoogleAccountState(applyGoogleAccountState)
    window.api.getGoogleAccountState().then(applyGoogleAccountState)
    return unsubscribe
  }, [])

  useEffect(() => {
    window.api.getAppVersion().then(setAppVersion)
  }, [])

  useEffect(() => {
    const unsubscribeCommand = window.api.onBrowserCommand((command) => {
      if (command === 'bookmarks') {
        setBookmarkMenuOpen(false)
        setBrowserMenuOpen(true)
        setBrowserMenuView('bookmarks')
      } else {
        setBrowserMenuOpen(true)
        setBrowserMenuView(command)
        if (command === 'history') window.api.getHistory().then(setHistoryEntries)
        if (command === 'downloads') window.api.getDownloads().then(setDownloads)
      }
    })
    const unsubscribeDismiss = window.api.onDismissPopups(() => {
      setBrowserMenuOpen(false)
      setBrowserMenuView('')
      setBookmarkMenuOpen(false)
      setAddressSuggestionsOpen(false)
      setHomeSuggestionsOpen(false)
    })
    const unsubscribeFocus = window.api.onFocusAddress(() => {
      addressInputRef.current?.focus()
    })
    const unsubscribeZoom = window.api.onZoomChanged(setZoomPercent)
    return () => {
      unsubscribeCommand()
      unsubscribeDismiss()
      unsubscribeFocus()
      unsubscribeZoom()
    }
  }, [currentUrl])

  useEffect(() => {
    const dismissPopups = (event) => {
      const target = event.target
      if (
        !target.closest(
          '.shortcut-menu, .shortcut-menu-trigger, .shortcut-edit-form, .bookmark-menu, .bookmark-toggle, .browser-menu, .browser-menu-toggle, .hrx-brand-control'
        )
      ) {
        setShortcutMenuUrl('')
        setEditingShortcutUrl('')
        setBookmarkMenuOpen(false)
        setBrowserMenuOpen(false)
        setBrowserMenuView('')
      }
      if (!target.closest('.home-app-launcher, .home-app-menu')) setHomeAppsOpen(false)
      if (!target.closest('.home-profile-button, .home-profile-menu')) setHomeProfileOpen(false)
      if (!target.closest('.home-mail-button, .home-mail-menu')) setHomeMailOpen(false)
      if (!target.closest('.toolbar-address, .home-search, .address-suggestions')) {
        setAddressSuggestionsOpen(false)
        setHomeSuggestionsOpen(false)
      }
      if (!target.closest('.customizer-panel, .appearance-toggle')) {
        setShowCustomizer(false)
      }
    }
    document.addEventListener('pointerdown', dismissPopups)
    return () => document.removeEventListener('pointerdown', dismissPopups)
  }, [])

  useEffect(() => {
    if (!showShortcutForm) return
    const onEscape = (event) => {
      if (event.key === 'Escape') setShowShortcutForm(false)
    }
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [showShortcutForm])

  useEffect(() => {
    window.api.setPopupOpen(browserMenuOpen || bookmarkMenuOpen)
  }, [browserMenuOpen, bookmarkMenuOpen])

  useEffect(() => {
    const unsubscribeDownloads = window.api.onDownloadsUpdated((items) => {
      setDownloads(items)
      if (
        !sidebarSetup.notifications ||
        !('Notification' in window) ||
        Notification.permission !== 'granted'
      )
        return
      items
        .filter((item) => item.state === 'Complete' && !notifiedDownloadIdsRef.current.has(item.id))
        .forEach((item) => {
          notifiedDownloadIdsRef.current.add(item.id)
          new Notification('Hrishikesh download complete', { body: item.name })
        })
    })
    const unsubscribeFind = window.api.onFindResult((result) => setFindMatches(result.matches))
    return () => {
      unsubscribeDownloads()
      unsubscribeFind()
    }
  }, [sidebarSetup.notifications])

  useEffect(() => {
    window.api.setBrowserNotifications(sidebarSetup.notifications)
  }, [sidebarSetup.notifications])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (!event.ctrlKey && !event.metaKey) return
      const key = event.key.toLowerCase()
      if (key === 't') {
        event.preventDefault()
        window.api.newTab()
      } else if (key === 'n') {
        event.preventDefault()
        window.api.newWindow(event.shiftKey)
      } else if (key === 'h') {
        event.preventDefault()
        setBrowserMenuOpen(true)
        setBrowserMenuView('history')
        window.api.getHistory().then(setHistoryEntries)
      } else if (key === 'j') {
        event.preventDefault()
        setBrowserMenuOpen(true)
        setBrowserMenuView('downloads')
        window.api.getDownloads().then(setDownloads)
      } else if (event.shiftKey && key === 'o') {
        event.preventDefault()
        setBrowserMenuOpen(true)
        setBrowserMenuView('bookmarks')
      } else if (key === 'd' && currentUrl) {
        event.preventDefault()
        setBrowserMenuOpen(true)
        setBrowserMenuView('bookmarks')
      } else if (key === 'f') {
        event.preventDefault()
        setBrowserMenuOpen(true)
        setBrowserMenuView('find')
      } else if (key === 'p') {
        event.preventDefault()
        window.api.print()
      } else if (key === 'l') {
        event.preventDefault()
        setAddressQuery(currentUrl)
        addressInputRef.current?.focus()
      } else if (key === '0') {
        event.preventDefault()
        window.api.zoom(100).then(setZoomPercent)
      } else if (key === '=' || key === '+') {
        event.preventDefault()
        window.api.zoom(zoomPercent + 10).then(setZoomPercent)
      } else if (key === '-') {
        event.preventDefault()
        window.api.zoom(zoomPercent - 10).then(setZoomPercent)
      } else if (event.shiftKey && key === 'delete') {
        event.preventDefault()
        setBrowserMenuOpen(true)
        setBrowserMenuView('clear-data')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [currentUrl, zoomPercent])

  const navigate = (value) => {
    if (!value.trim()) return
    setAddressSuggestionsOpen(false)
    setHomeSuggestionsOpen(false)
    setIsLoading(true)
    window.api.navigate(value.trim()).then((result) => {
      if (!result?.ok) setIsLoading(false)
    })
  }

  const goBack = () => {
    if (!canGoBack) return
    setIsLoading(true)
    window.api.back()
  }

  const goForward = () => {
    if (!canGoForward) return
    setIsLoading(true)
    window.api.forward()
  }

  const reloadPage = () => {
    if (!currentUrl) return
    setIsLoading(true)
    window.api.reload()
  }

  const suggestionQuery = homeSuggestionsOpen ? homeQuery : addressQuery
  const trimmedSuggestionQuery = suggestionQuery.trim()
  const seenSuggestionUrls = new Set()
  const matchingAddressPages = [
    ...historyEntries,
    ...bookmarks.map((item) => ({
      title: item.name,
      url: item.url
    }))
  ]
    .filter((item) => {
      const url = typeof item.url === 'string' ? item.url : ''
      const title = typeof item.title === 'string' ? item.title : ''
      const matches =
        !trimmedSuggestionQuery ||
        url.toLowerCase().includes(trimmedSuggestionQuery.toLowerCase()) ||
        title.toLowerCase().includes(trimmedSuggestionQuery.toLowerCase())
      if (!url || !matches || seenSuggestionUrls.has(url)) return false
      seenSuggestionUrls.add(url)
      return true
    })
    .slice(0, 6)
    .map((item) => ({ kind: 'page', title: item.title || item.url, url: item.url }))
  const hasAddressHistory = historyEntries.length > 0 || bookmarks.length > 0
  const addressSuggestions = [
    ...(trimmedSuggestionQuery && !/^https?:\/\//i.test(trimmedSuggestionQuery)
      ? [
          {
            kind: 'search',
            title: `Search the web for “${trimmedSuggestionQuery}”`,
            value: trimmedSuggestionQuery
          }
        ]
      : []),
    ...matchingAddressPages
  ].slice(0, 7)

  useEffect(() => {
    window.api.setAddressSuggestionsOpen(
      (addressSuggestionsOpen || homeSuggestionsOpen) && hasAddressHistory
    )
  }, [addressSuggestionsOpen, homeSuggestionsOpen, hasAddressHistory])

  const chooseAddressSuggestion = (suggestion) => {
    setAddressSuggestionsOpen(false)
    setHomeSuggestionsOpen(false)
    navigate(suggestion.kind === 'search' ? suggestion.value : suggestion.url)
  }

  const submitSearch = (event, searchTerm) => {
    event.preventDefault()
    navigate(searchTerm)
  }

  const persistBookmarks = (nextBookmarks) => {
    setBookmarks(nextBookmarks)
    window.api.savePreferences({
      theme: activeTheme,
      customBackground,
      customPanel,
      customAccent,
      backgroundPhoto,
      photoZoom,
      photoX,
      photoY,
      photoBrightness,
      showBookmarksBar,
      shortcuts: homeShortcuts,
      bookmarks: nextBookmarks,
      readingList
    })
  }

  const persistReadingList = (nextReadingList) => {
    setReadingList(nextReadingList)
    window.api.savePreferences({
      theme: activeTheme,
      customBackground,
      customPanel,
      customAccent,
      backgroundPhoto,
      photoZoom,
      photoX,
      photoY,
      photoBrightness,
      showBookmarksBar,
      shortcuts: homeShortcuts,
      bookmarks,
      readingList: nextReadingList
    })
  }

  const toggleBookmarksBar = () => {
    const next = !showBookmarksBar
    setShowBookmarksBar(next)
    window.api.savePreferences({
      theme: activeTheme,
      customBackground,
      customPanel,
      customAccent,
      backgroundPhoto,
      photoZoom,
      photoX,
      photoY,
      photoBrightness,
      showBookmarksBar: next,
      shortcuts: homeShortcuts,
      bookmarks,
      readingList
    })
  }

  const importBookmarksFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const markup = await file.text()
      const documentFromFile = new DOMParser().parseFromString(markup, 'text/html')
      const imported = Array.from(documentFromFile.querySelectorAll('a[href]'))
        .map((link) => ({ name: link.textContent.trim().slice(0, 80), url: link.href }))
        .filter((item) => item.name && item.url.startsWith('https://'))
      const next = [...bookmarks]
      for (const item of imported) {
        if (!next.some((saved) => saved.url === item.url) && next.length < 100) next.push(item)
      }
      persistBookmarks(next)
      setBrowserNotice(`Imported ${next.length - bookmarks.length} bookmarks.`)
    } catch {
      setBrowserNotice('Could not read that bookmarks file. Choose a Chrome HTML export.')
    }
  }

  const exportBookmarksFile = () => {
    const escapeHtml = (value) =>
      value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')
    const rows = bookmarks
      .map((item) => `<DT><A HREF="${escapeHtml(item.url)}">${escapeHtml(item.name)}</A></DT>`)
      .join('\n')
    const file = new Blob(
      [`<!DOCTYPE NETSCAPE-Bookmark-file-1><META charset="utf-8"><DL><p>${rows}</DL>`],
      { type: 'text/html' }
    )
    const fileUrl = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = 'hrishikesh-bookmarks.html'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1000)
  }

  const persistShortcuts = (nextShortcuts) => {
    setHomeShortcuts(nextShortcuts)
    window.api.savePreferences({
      theme: activeTheme,
      customBackground,
      customPanel,
      customAccent,
      backgroundPhoto,
      photoZoom,
      photoX,
      photoY,
      photoBrightness,
      showBookmarksBar,
      shortcuts: nextShortcuts,
      bookmarks,
      readingList
    })
  }

  const showBrowserMenuView = (view) => {
    setBrowserMenuView(view)
    setHoveredBrowserMenuView('')
    if (view === 'history') window.api.getHistory().then(setHistoryEntries)
    if (view === 'downloads') window.api.getDownloads().then(setDownloads)
    if (view === 'passwords') window.api.listPasswords().then(setPasswords)
    if (view === 'extensions') window.api.getExtensions().then(setExtensions)
    if (view === 'performance') window.api.getPagePerformance().then(setPagePerformance)
    if (view === 'task-manager') window.api.getTabProcesses().then(setTabProcesses)
    if (view === 'qr-code' && currentUrl) {
      setQrCodeDataUrl('')
      QRCode.toDataURL(currentUrl, { errorCorrectionLevel: 'M', margin: 2, width: 240 })
        .then(setQrCodeDataUrl)
        .catch(() => setQrCodeDataUrl(''))
    }
    if (view !== 'more-tools' && view !== 'cast') setBrowserNotice('')
  }

  useEffect(() => {
    if (!browserMenuOpen || browserMenuView !== 'task-manager') return
    const refresh = () => window.api.getTabProcesses().then(setTabProcesses)
    refresh()
    const timer = window.setInterval(refresh, 2000)
    return () => window.clearInterval(timer)
  }, [browserMenuOpen, browserMenuView])

  useEffect(() => {
    let active = true
    const refreshTabStats = () => {
      window.api
        .getTabProcesses()
        .then((rows) => {
          if (active) setTabProcesses(rows)
        })
        .catch(() => {})
    }
    refreshTabStats()
    const timer = window.setInterval(refreshTabStats, 2000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [tabs.length])

  useEffect(() => {
    if (currentUrl) return
    let active = true
    let inFlight = false
    const refresh = async () => {
      if (inFlight) return
      inFlight = true
      try {
        const metrics = await window.api.getSystemMetrics()
        if (active && metrics) setSystemMetrics(metrics)
      } catch {
        if (active) setSystemMetrics(null)
      } finally {
        inFlight = false
      }
    }
    refresh()
    const timer = window.setInterval(refresh, 2500)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [currentUrl])

  useEffect(() => {
    let active = true
    const refresh = () =>
      window.api
        .getVpnProfiles()
        .then((result) => {
          if (active && result) setVpnData(result)
        })
        .catch(() => {})
    refresh()
    const timer = window.setInterval(refresh, 15000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem('hrishikesh-shader-effect', shaderEffect)
    window.api.setShaderEffect(shaderEffect).catch(() => {})
  }, [shaderEffect])

  useEffect(() => {
    if (currentUrl && !cpuGuardEnabled && !ramGuardEnabled) return
    const refresh = () =>
      window.api
        .getCleanupStats()
        .then(setCleanupStats)
        .catch(() => {})
    refresh()
    const timer = window.setInterval(refresh, 5000)
    return () => window.clearInterval(timer)
  }, [currentUrl, tabs.length, cpuGuardEnabled, ramGuardEnabled])

  useEffect(() => {
    if (guardBusyRef.current || (!cpuGuardEnabled && !ramGuardEnabled)) return
    const inactive = tabProcesses.filter((row) => row.id !== activeTabId)
    const hotCpuTab = cpuGuardEnabled
      ? inactive.filter((row) => row.cpu >= cpuGuardLimit).sort((a, b) => b.cpu - a.cpu)[0]
      : null
    const inactiveMemory = inactive.reduce((total, row) => total + (row.memoryKb || 0), 0) / 1024
    const hotRamTab =
      ramGuardEnabled && homeMemoryMb > ramGuardLimit && inactiveMemory > 0
        ? inactive.sort((a, b) => b.memoryKb - a.memoryKb)[0]
        : null
    const target = hotCpuTab || hotRamTab
    if (!target) return
    guardBusyRef.current = true
    window.api
      .closeTab(target.id)
      .then(async () => {
        setGuardNotice(`Closed inactive tab: ${target.title}`)
        setTabProcesses(await window.api.getTabProcesses())
      })
      .finally(() => {
        guardBusyRef.current = false
      })
  }, [
    activeTabId,
    cpuGuardEnabled,
    cpuGuardLimit,
    homeMemoryMb,
    ramGuardEnabled,
    ramGuardLimit,
    tabProcesses
  ])

  const browserMenuHoverItems = {
    account: ['Hrishikesh Account', 'Customize Hrishikesh', 'Profile settings'],
    passwords: ['Google Password Manager', 'Saved passwords', 'Autofill settings'],
    history: ['Open history page', 'Recent tabs', 'History in this window'],
    downloads: ['Recent downloads', 'Open downloads list'],
    bookmarks: ['Bookmark this tab', 'Open bookmarks manager', 'Reading list'],
    groups: ['Create new tab group', 'Group open tabs'],
    'clear-data': ['Browsing history', 'Cookies and site data', 'Cached files'],
    extensions: ['Manage extensions', 'Load unpacked extension'],
    find: ['Find in page', 'Cut', 'Copy', 'Paste'],
    cast: ['HrishikeshCast', 'Share current page by QR', 'Windows wireless display'],
    'more-tools': ['Tab search', 'Name this window', 'Developer tools'],
    help: ['About Hrishikesh', "What's new", 'Help center', 'Report an issue'],
    settings: ['Customize Hrishikesh', 'Privacy and browsing data', 'Profile and sync']
  }

  const runEditCommand = (command) => {
    window.api.edit(command)
    setBrowserMenuOpen(false)
    setBrowserMenuView('')
  }

  const applyCustomTheme = () => {
    const dark = isDarkColor(customBackground)
    setActiveTheme({
      name: 'Custom',
      background: customBackground,
      panel: customPanel,
      accent: customAccent,
      text: dark ? '#f4f5fb' : '#262b43',
      muted: dark ? '#b0b7ca' : '#9297ab',
      border: dark ? '#3a4054' : '#e6e8ef',
      dark
    })
  }

  const showHomeMenu = (view) => {
    setBrowserMenuOpen(true)
    showBrowserMenuView(view)
  }

  const toggleGamingBoost = async () => {
    const next = !gamingBoost
    const enabled = await window.api.setGamingBoost(next)
    setGamingBoost(Boolean(enabled))
  }

  const updateResourceControl = (key, value) => {
    const next = { ...resourceControls, [key]: value }
    setResourceControls(next)
    setResourceNotice('Applying to open tabs…')
    window.clearTimeout(resourceControlTimerRef.current)
    resourceControlTimerRef.current = window.setTimeout(async () => {
      try {
        const result = await window.api.setResourceControls(next)
        if (result?.controls) setResourceControls(result.controls)
        setResourceNotice(
          result?.ok
            ? 'Applied to open tabs.'
            : result?.reason || 'This control could not be applied to every tab.'
        )
      } catch (error) {
        setResourceNotice(error?.message || 'Could not apply the control to open tabs.')
      }
    }, 350)
  }

  const updateShaderEffect = (effect) => {
    setShaderEffect(effect)
    if (!currentUrl)
      setBrowserNotice(`${shaderEffects.find((item) => item.id === effect)?.name} applied.`)
  }

  const openModsLab = () => {
    setBrowserMenuOpen(false)
    setBookmarkMenuOpen(false)
    setShowCustomizer(false)
    setAccountPageTabId(null)
    setHelpPageTabId(null)
    setModsPageTabId(activeTabId)
    setModNotice('')
  }

  const openHrxAi = async () => {
    setBrowserMenuOpen(false)
    setBookmarkMenuOpen(false)
    setShowCustomizer(false)
    setAccountPageTabId(null)
    setHelpPageTabId(null)
    setModsPageTabId(null)
    setHrxAiPageTabId(activeTabId)
    setHrxAiNotice('')
    setHrxAiStatus('Checking local AI…')
    try {
      const [result, savedMessages] = await Promise.all([
        window.api.getHrxAiModels(),
        window.api.getHrxAiHistory()
      ])
      setHrxAiMessages(Array.isArray(savedMessages) ? savedMessages : [])
      if (result?.ok) {
        const models = result.models || []
        setHrxAiModels(models)
        setHrxAiModel((current) => (models.includes(current) ? current : models[0] || ''))
        setHrxAiStatus(
          models.length ? 'LOCAL ENGINE CONNECTED' : 'Engine connected · no model installed'
        )
      } else {
        setHrxAiModels([])
        setHrxAiStatus('LOCAL ENGINE OFFLINE')
        setHrxAiNotice(result?.reason || 'Start local AI to begin chatting.')
      }
    } catch {
      setHrxAiModels([])
      setHrxAiStatus('LOCAL ENGINE OFFLINE')
      setHrxAiNotice('Could not check the local AI engine.')
    }
  }

  const submitHrxAiMessage = async (event) => {
    event.preventDefault()
    const content = hrxAiInput.trim()
    if (!content || hrxAiBusy) return
    if (!hrxAiModel) {
      setHrxAiNotice('Install a local model in Ollama, then press Check connection.')
      return
    }
    const nextMessages = [...hrxAiMessages, { role: 'user', content }]
    setHrxAiMessages(nextMessages)
    setHrxAiInput('')
    setHrxAiBusy(true)
    setHrxAiNotice('')
    try {
      const result = await window.api.askHrxAi(nextMessages, hrxAiModel)
      if (result?.ok) {
        setHrxAiMessages([...nextMessages, { role: 'assistant', content: result.answer }])
      } else {
        setHrxAiNotice(result?.reason || 'The local model could not answer.')
      }
    } catch {
      setHrxAiNotice('Could not reach the local model.')
    } finally {
      setHrxAiBusy(false)
    }
  }

  const playModSound = () => {
    if (!modsSoundEnabled) return
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      if (!AudioContextClass) return
      const context = new AudioContextClass()
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = 'sawtooth'
      oscillator.frequency.setValueAtTime(440, context.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(660, context.currentTime + 0.08)
      gain.gain.setValueAtTime(Math.max(0.001, modsSoundVolume / 1000), context.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.16)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start()
      oscillator.stop(context.currentTime + 0.17)
      oscillator.onended = () => context.close()
    } catch {
      /* Audio is optional when the device blocks playback. */
    }
  }

  const applyMod = (mod) => {
    const theme = themes.find((item) => item.name === mod.theme)
    const effect = shaderEffects.find((item) => item.id === mod.effect)
    if (theme) setActiveTheme(theme)
    if (effect) updateShaderEffect(effect.id)
    setModNotice(`${mod.name} applied and saved on this device.`)
    window.localStorage.setItem('hrx-active-mod', mod.id || mod.name)
    window.api
      .savePreferences({
        theme: theme || activeTheme,
        customBackground,
        customPanel,
        customAccent,
        backgroundPhoto,
        photoZoom,
        photoX,
        photoY,
        photoBrightness,
        showBookmarksBar,
        shortcuts: homeShortcuts,
        bookmarks,
        readingList
      })
      .catch(() => {})
    playModSound()
  }

  const saveUserMod = (event) => {
    event.preventDefault()
    const name = modDraftName.trim().slice(0, 28)
    if (!name) return
    const next = [
      ...userMods,
      { id: `mod-${Date.now()}`, name, theme: modDraftTheme, effect: modDraftEffect }
    ]
    setUserMods(next)
    window.localStorage.setItem('hrx-user-mods', JSON.stringify(next))
    setModDraftName('')
    setModNotice(`${name} saved to My Mods.`)
    playModSound()
  }

  const removeUserMod = (id) => {
    const next = userMods.filter((mod) => mod.id !== id)
    setUserMods(next)
    window.localStorage.setItem('hrx-user-mods', JSON.stringify(next))
    setModNotice('Mod removed from this device.')
  }

  const runVpnAction = async (profile) => {
    if (!profile || vpnBusy) return
    setVpnBusy(profile.name)
    setVpnNotice('Updating the Windows VPN connection…')
    try {
      const result =
        profile.status === 'Connected'
          ? await window.api.disconnectVpn(profile.name)
          : await window.api.connectVpn(profile.name)
      setVpnNotice(result?.ok ? 'VPN status updated.' : result?.reason || 'VPN action failed.')
      const refreshed = await window.api.getVpnProfiles()
      if (refreshed) setVpnData(refreshed)
    } catch {
      setVpnNotice('Could not reach Windows VPN settings.')
    } finally {
      setVpnBusy('')
    }
  }

  const toggleHotTabGuard = (type, enabled) => {
    if (
      enabled &&
      !window.confirm(
        'This may close inactive tabs that cross the limit. Any unsaved work in those tabs could be lost. Continue?'
      )
    ) {
      return
    }
    if (type === 'cpu') setCpuGuardEnabled(enabled)
    else setRamGuardEnabled(enabled)
    setGuardNotice(enabled ? 'Guard is watching inactive tabs.' : 'Guard turned off.')
  }

  const closeHottestTab = (metric) => {
    const candidate = tabProcesses
      .filter((row) => row.id !== activeTabId)
      .sort((first, second) =>
        metric === 'cpu' ? second.cpu - first.cpu : second.memoryKb - first.memoryKb
      )[0]
    if (!candidate) {
      setGuardNotice('Keep at least one tab open; no inactive tab can be closed.')
      return
    }
    setGuardNotice(`Closed inactive tab: ${candidate.title}`)
    window.api.closeTab(candidate.id)
  }

  const updateCleanerSetting = (key, enabled) => {
    setCleanerSettings((current) => ({ ...current, [key]: enabled }))
    setCleanerPreset('custom')
    setCleanerNotice('')
  }

  const applyCleanerPreset = (preset) => {
    const presets = {
      min: { cache: true, cookies: false, tabs: false, history: false, downloads: false },
      med: { cache: true, cookies: false, tabs: false, history: true, downloads: true },
      max: { cache: true, cookies: true, tabs: true, history: true, downloads: true }
    }
    setCleanerPreset(preset)
    setCleanerSettings(presets[preset])
    setCleanerNotice('')
  }

  const updateSidebarVisibility = (key, enabled) => {
    const next = { ...sidebarVisibility, [key]: enabled }
    setSidebarVisibility(next)
    window.localStorage.setItem('hrishikesh-sidebar-icons', JSON.stringify(next))
  }

  const updateSidebarSetup = (key, enabled) => {
    if (key === 'notifications') {
      window.api.setBrowserNotifications(enabled).then((allowed) => {
        if (
          enabled &&
          allowed &&
          'Notification' in window &&
          Notification.permission === 'default'
        ) {
          Notification.requestPermission().then((permission) => {
            if (permission !== 'granted') updateSidebarSetup('notifications', false)
          })
        }
      })
    }
    const next = { ...sidebarSetup, [key]: enabled }
    setSidebarSetup(next)
    window.localStorage.setItem('hrishikesh-sidebar-setup', JSON.stringify(next))
  }

  const addSidebarWorkspace = () => {
    if (sidebarWorkspaces.length >= 8) return
    const name = window.prompt('Workspace name')?.trim()
    if (!name) return
    const next = [...sidebarWorkspaces, name.slice(0, 24)]
    setSidebarWorkspaces(next)
    window.localStorage.setItem('hrishikesh-workspaces', JSON.stringify(next))
    updateSidebarSetup(`workspace${next.length - 1}`, true)
  }

  const addSidebarExtension = () => {
    if (sidebarExtensions.length >= 12) return
    const name = window.prompt('Shortcut name')?.trim()
    if (!name) return
    const url = window.prompt('Website address')?.trim()
    if (!url) return
    const next = [
      ...sidebarExtensions,
      { name: name.slice(0, 24), url: /^https?:\/\//i.test(url) ? url : `https://${url}` }
    ]
    setSidebarExtensions(next)
    window.localStorage.setItem('hrishikesh-sidebar-extensions', JSON.stringify(next))
  }

  const openSidebarItem = (key) => {
    const destinations = {
      gxControl: () =>
        document
          .querySelector('[aria-label="GX Control"]')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      gxCleaner: () =>
        document
          .querySelector('[aria-label="GC Cleaner"]')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      shaders: () =>
        document
          .querySelector('[aria-label="Shaders"]')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      vpn: () =>
        document
          .querySelector('[aria-label="System VPN"]')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      mods: openModsLab,
      twitch: () => navigate('https://www.twitch.tv/'),
      hrxAi: openHrxAi,
      messenger: () => navigate('https://www.messenger.com/'),
      whatsapp: () => navigate('https://web.whatsapp.com/'),
      discord: () => navigate('https://discord.com/app'),
      telegram: () => navigate('https://web.telegram.org/'),
      instagram: () => navigate('https://www.instagram.com/'),
      x: () => navigate('https://x.com/'),
      bluesky: () => navigate('https://bsky.app/'),
      rewards: () => {
        setBrowserNotice('GX Rewards requires an Opera account and is not provided by Hrishikesh.')
        window.setTimeout(() => setBrowserNotice(''), 3500)
      },
      player: () => navigate('https://music.youtube.com/'),
      flow: () => {
        const note = window.prompt(
          'Save a note in My Flow on this device',
          window.localStorage.getItem('hrishikesh-flow-note') || ''
        )
        if (note !== null) {
          window.localStorage.setItem('hrishikesh-flow-note', note)
          setBrowserNotice('My Flow note saved on this device.')
          window.setTimeout(() => setBrowserNotice(''), 2500)
        }
      },
      speedDial: () => window.api.home(),
      bookmarks: () => showHomeMenu('bookmarks'),
      news: () => navigate('https://news.google.com/'),
      pinboards: () => showHomeMenu('bookmarks'),
      history: () => showHomeMenu('history'),
      downloads: () => showHomeMenu('downloads'),
      extensions: () => showHomeMenu('extensions'),
      settings: () => setShowCustomizer(true)
    }
    setSidebarSetupOpen(false)
    destinations[key]?.()
  }

  const sidebarSections = [
    {
      title: 'GX FEATURES',
      rows: [
        ['gxControl', '◴', 'GX Control'],
        ['gxCleaner', '♧', 'GX Cleaner'],
        ['shaders', '▨', 'Shaders'],
        ['vpn', '◉', 'System VPN'],
        ['mods', '▣', 'Mods'],
        ['twitch', '▤', 'Twitch']
      ]
    },
    {
      title: 'AI SERVICES',
      rows: [['hrxAi', '✳', 'Hrishikesh AI']]
    },
    {
      title: 'MESSENGERS',
      rows: [
        ['messenger', '◉', 'Facebook Messenger'],
        ['whatsapp', '◷', 'WhatsApp'],
        ['discord', '◈', 'Discord'],
        ['telegram', '➤', 'Telegram']
      ]
    },
    {
      title: 'SOCIAL MEDIA',
      rows: [
        ['instagram', '◎', 'Instagram'],
        ['x', '𝕏', 'X'],
        ['bluesky', '✦', 'Bluesky']
      ]
    },
    {
      title: 'SPECIAL FEATURES',
      rows: [
        ['rewards', '♔', 'GX Rewards'],
        ['player', '▷', 'Player'],
        ['flow', '➤', 'My Flow']
      ]
    },
    {
      title: 'OPERA TOOLS',
      rows: [
        ['speedDial', '▦', 'Speed Dial'],
        ['bookmarks', '☆', 'Bookmarks'],
        ['news', '▤', 'Personal news'],
        ['pinboards', '⚑', 'Pinboards'],
        ['history', '◷', 'History'],
        ['downloads', '⇩', 'Downloads'],
        ['extensions', '♧', 'Extensions'],
        ['settings', '⚙', 'Settings']
      ]
    }
  ]

  const runSelectedCleanup = async () => {
    const result = await window.api.cleanSelectedData(cleanerSettings)
    setCleanerConfirm(false)
    setCleanerNotice(
      result?.ok
        ? 'Selected browser data cleaned. Downloaded files were kept.'
        : 'Cleanup did not finish. Try again.'
    )
    window.api.getCleanupStats().then(setCleanupStats)
    window.api.getDownloads().then(setDownloads)
  }
  return (
    <main
      className={`browser-home${backgroundPhoto ? ' has-home-photo' : ''}${currentUrl ? ' has-active-site' : ''}${verticalTabs ? ' vertical-tabs' : ''}${shaderEffect !== 'none' ? ` shader-${shaderEffect}` : ''}`}
      style={{
        '--home-zoom': `${zoomPercent}%`,
        '--theme-background': activeTheme.background,
        '--theme-panel': activeTheme.panel,
        '--theme-accent': activeTheme.accent,
        '--theme-text': activeTheme.text,
        '--theme-muted': activeTheme.muted,
        '--theme-border': activeTheme.border,
        '--gx-wallpaper': `url("${gxWallpaper}")`,
        '--home-photo': backgroundPhoto ? 'url("' + backgroundPhoto + '")' : 'none',
        '--home-photo-overlay':
          photoBrightness < 100
            ? 'linear-gradient(rgba(0,0,0,' +
              (100 - photoBrightness) / 100 +
              '), rgba(0,0,0,' +
              (100 - photoBrightness) / 100 +
              '))'
            : photoBrightness > 100
              ? 'linear-gradient(rgba(255,255,255,' +
                (photoBrightness - 100) / 100 +
                '), rgba(255,255,255,' +
                (photoBrightness - 100) / 100 +
                '))'
              : 'none',
        '--home-photo-size': photoZoom + '%',
        '--home-photo-position': photoX + '% ' + photoY + '%'
      }}
    >
      <div className="browser-toolbar">
        <button type="button" aria-label="Back" title="Back" disabled={!canGoBack} onClick={goBack}>
          ←
        </button>
        <button
          type="button"
          aria-label="Forward"
          title="Forward"
          disabled={!canGoForward}
          onClick={goForward}
        >
          →
        </button>{' '}
        <button
          type="button"
          aria-label="Reload page"
          title="Reload page"
          disabled={!currentUrl}
          onClick={reloadPage}
        >
          ⟳
        </button>
        <div className="toolbar-address">
          <button
            className="address-home"
            type="button"
            aria-label="Go to home"
            title="Home"
            onClick={() => window.api.home()}
          >
            <img src={browserMark} alt="" />
          </button>
          <input
            ref={addressInputRef}
            value={addressQuery}
            onChange={(event) => {
              setAddressQuery(event.target.value)
              setHomeQuery('')
              setActiveAddressSuggestion(-1)
            }}
            onFocus={() => {
              setHomeQuery('')
              setHomeSuggestionsOpen(false)
              if (currentUrl) {
                setAddressQuery(currentUrl)
                requestAnimationFrame(() => addressInputRef.current?.select())
              }
              setHomeSuggestionsOpen(false)
              setAddressSuggestionsOpen(true)
              setActiveAddressSuggestion(-1)
              window.api.getHistory().then(setHistoryEntries)
            }}
            onKeyDown={(event) => {
              if (
                event.key === 'ArrowDown' &&
                addressSuggestionsOpen &&
                addressSuggestions.length
              ) {
                event.preventDefault()
                setActiveAddressSuggestion((index) => (index + 1) % addressSuggestions.length)
                return
              }
              if (event.key === 'ArrowUp' && addressSuggestionsOpen && addressSuggestions.length) {
                event.preventDefault()
                setActiveAddressSuggestion((index) =>
                  index <= 0 ? addressSuggestions.length - 1 : index - 1
                )
                return
              }
              if (event.key === 'Escape' && addressSuggestionsOpen) {
                event.preventDefault()
                setAddressSuggestionsOpen(false)
                return
              }
              if (event.key === 'Enter') {
                event.preventDefault()
                const selectedSuggestion = addressSuggestions[activeAddressSuggestion]
                if (selectedSuggestion) chooseAddressSuggestion(selectedSuggestion)
                else navigate(addressQuery)
              }
            }}
            placeholder="Search Google or enter a website"
            aria-label="Search or enter a website address"
          />
          {addressSuggestionsOpen && hasAddressHistory && addressSuggestions.length > 0 && (
            <div className="address-suggestions" role="listbox" aria-label="Search suggestions">
              {addressSuggestions.map((suggestion, index) => (
                <button
                  className={`address-suggestion${index === activeAddressSuggestion ? ' active' : ''}`}
                  type="button"
                  role="option"
                  aria-selected={index === activeAddressSuggestion}
                  key={suggestion.kind === 'search' ? 'search-query' : suggestion.url}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveAddressSuggestion(index)}
                  onClick={() => chooseAddressSuggestion(suggestion)}
                >
                  <span className="address-suggestion-icon" aria-hidden="true">
                    {suggestion.kind === 'search' ? '⌕' : '◷'}
                  </span>
                  <span className="address-suggestion-copy">
                    <strong>{suggestion.title}</strong>
                    {suggestion.kind === 'page' && <small>{suggestion.url}</small>}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="toolbar-go" type="button" onClick={() => navigate(addressQuery)}>
          Go
        </button>
        <div className="bookmark-area">
          <button
            className="bookmark-toggle"
            type="button"
            aria-label="Bookmarks"
            aria-expanded={bookmarkMenuOpen}
            title="Bookmarks"
            onClick={() => setBookmarkMenuOpen((open) => !open)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-3.7L6 21V4.75Z" />
            </svg>
          </button>
          {bookmarkMenuOpen && (
            <div className="bookmark-menu" aria-label="Saved bookmarks">
              <h2>Bookmarks</h2>
              {currentUrl && (
                <button
                  className="bookmark-current-page"
                  type="button"
                  onClick={() => {
                    const existing = bookmarks.some((item) => item.url === currentUrl)
                    const title = tabs.find((tab) => tab.id === activeTabId)?.title || currentUrl
                    persistBookmarks(
                      existing
                        ? bookmarks.filter((item) => item.url !== currentUrl)
                        : [...bookmarks, { name: title.slice(0, 80), url: currentUrl }]
                    )
                  }}
                >
                  {bookmarks.some((item) => item.url === currentUrl)
                    ? 'Remove this page'
                    : 'Bookmark this page'}
                </button>
              )}
              {bookmarks.length ? (
                <div className="bookmark-list">
                  {bookmarks.map((item) => (
                    <div className="bookmark-row" key={item.url}>
                      <button
                        type="button"
                        title={item.url}
                        onClick={() => {
                          navigate(item.url)
                          setBookmarkMenuOpen(false)
                        }}
                      >
                        {item.name}
                      </button>
                      <button
                        type="button"
                        aria-label={'Remove bookmark ' + item.name}
                        title="Remove bookmark"
                        onClick={() =>
                          persistBookmarks(
                            bookmarks.filter((bookmark) => bookmark.url !== item.url)
                          )
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No bookmarks saved yet.</p>
              )}
            </div>
          )}
        </div>
        <div className="browser-menu-area">
          <button
            className="appearance-toggle"
            type="button"
            aria-label="Appearance and theme settings"
            aria-expanded={showCustomizer}
            title="Appearance and theme settings"
            onClick={() => setShowCustomizer((open) => !open)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3.5 14 4l.9 2.1 1.9 1.1 2.3-.2 1 1.8-1.1 2 .3 2.1 1.4 1.7-.8 1.9-2.3.2-1.5 1.5-.5 2.2h-2.1l-1.4-1.8-2-.6-2 .7-1.5-1.5.6-2.2-1-1.8-2.1-.9v-2.1l2.1-.9 1-1.9-.3-2.2 1.8-1.1 1.9 1.1 2-.4L12 3.5Z" />
              <circle cx="12" cy="12.5" r="3" />
            </svg>
          </button>
          {browserMenuOpen && (
            <div className="browser-menu-stack" onMouseLeave={() => setHoveredBrowserMenuView('')}>
              <div
                className="browser-menu"
                onMouseOver={(event) => {
                  const row = event.target.closest('[data-hover-view]')
                  if (row) {
                    const view = row.dataset.hoverView
                    const stack = event.currentTarget.parentElement
                    const rowTop = row.getBoundingClientRect().top
                    const stackTop = stack.getBoundingClientRect().top
                    const items = browserMenuHoverItems[view] || []
                    const panelHeight = Math.min(items.length * 32 + 48, window.innerHeight - 116)
                    const maxTop = Math.max(0, window.innerHeight - stackTop - panelHeight - 8)

                    setHoveredBrowserMenuView(view)
                    setHoveredBrowserMenuTop(Math.min(Math.max(0, rowTop - stackTop), maxTop))
                  }
                }}
              >
                <div className="browser-menu-title">HRX Menu</div>
                {browserNotice && (
                  <div className="browser-menu-status" role="status">
                    {browserNotice}
                  </div>
                )}
                {browserMenuView ? (
                  <>
                    <div className="browser-menu-panel-heading">
                      <button type="button" onClick={() => setBrowserMenuView('')}>
                        ←
                      </button>
                      <strong>
                        {browserMenuView === 'history' && 'History'}
                        {browserMenuView === 'bookmarks' && 'Bookmarks and lists'}
                        {browserMenuView === 'downloads' && 'Downloads'}
                        {browserMenuView === 'passwords' && 'Passwords and autofill'}
                        {browserMenuView === 'find' && 'Find in page'}
                        {browserMenuView === 'groups' && 'Tab groups'}
                        {browserMenuView === 'clear-data' && 'Delete browsing data'}
                        {browserMenuView === 'extensions' && 'Extensions'}
                        {browserMenuView === 'performance' && 'Page performance'}
                        {browserMenuView === 'task-manager' && 'Task Manager'}
                        {browserMenuView === 'qr-code' && 'Share this page'}
                        {browserMenuView === 'account' && 'Hrishikesh Account'}
                        {browserMenuView === 'settings' && 'Settings'}
                        {browserMenuView === 'help' && 'Help'}
                        {browserMenuView === 'about' && 'About Hrishikesh'}
                        {browserMenuView === 'whats-new' && "What's new"}
                        {browserMenuView === 'report-issue' && 'Report an issue'}
                        {browserMenuView === 'more-tools' && 'More tools'}
                        {browserMenuView === 'name-window' && 'Name this window'}
                        {browserMenuView === 'cast' && 'HrishikeshCast'}
                      </strong>
                    </div>
                    {browserMenuView === 'history' && (
                      <div className="browser-menu-list">
                        {tabs.filter((tab) => tab.id !== activeTabId).length > 0 && (
                          <>
                            <div className="browser-menu-subtitle">Recent tabs</div>
                            {tabs
                              .filter((tab) => tab.id !== activeTabId)
                              .map((tab) => (
                                <button
                                  className="browser-menu-list-item"
                                  type="button"
                                  key={tab.id}
                                  onClick={() => {
                                    window.api.switchTab(tab.id)
                                    setBrowserMenuOpen(false)
                                  }}
                                >
                                  <span>{tab.title}</span>
                                  <small>{tab.url || 'New tab'}</small>
                                </button>
                              ))}
                          </>
                        )}
                        <div className="browser-menu-subtitle">History in this window</div>
                        {historyEntries.length ? (
                          historyEntries.map((entry, index) => (
                            <button
                              className="browser-menu-list-item"
                              type="button"
                              key={entry.tabId + entry.url + index}
                              onClick={() => {
                                navigate(entry.url)
                                setBrowserMenuOpen(false)
                              }}
                            >
                              <span>{entry.title}</span>
                              <small>{entry.url}</small>
                            </button>
                          ))
                        ) : (
                          <p className="browser-menu-empty">No history in this session.</p>
                        )}
                        <div className="browser-menu-device-note">
                          History from other devices needs Hrishikesh sync, which is not available
                          yet.
                        </div>
                      </div>
                    )}
                    {browserMenuView === 'bookmarks' && (
                      <div className="browser-menu-form">
                        <button
                          type="button"
                          disabled={!currentUrl}
                          onClick={() => {
                            if (!currentUrl) return
                            const alreadySaved = bookmarks.some((item) => item.url === currentUrl)
                            const title =
                              tabs.find((tab) => tab.id === activeTabId)?.title || currentUrl
                            persistBookmarks(
                              alreadySaved
                                ? bookmarks.filter((item) => item.url !== currentUrl)
                                : [...bookmarks, { name: title.slice(0, 80), url: currentUrl }]
                            )
                          }}
                        >
                          {bookmarks.some((item) => item.url === currentUrl)
                            ? 'Remove bookmark from this tab'
                            : 'Bookmark this tab · Ctrl+D'}
                        </button>
                        <button
                          type="button"
                          disabled={!tabs.some((tab) => tab.url)}
                          onClick={() => {
                            const next = [...bookmarks]
                            for (const tab of tabs) {
                              if (
                                tab.url &&
                                next.length < 100 &&
                                !next.some((item) => item.url === tab.url)
                              ) {
                                next.push({
                                  name: (tab.title || tab.url).slice(0, 80),
                                  url: tab.url
                                })
                              }
                            }
                            persistBookmarks(next)
                            setBrowserNotice('Open tabs added to bookmarks.')
                          }}
                        >
                          Bookmark all open tabs
                        </button>
                        <button type="button" onClick={toggleBookmarksBar}>
                          {showBookmarksBar ? 'Hide bookmarks bar' : 'Show bookmarks bar'}
                        </button>
                        <button type="button" onClick={() => bookmarkImportRef.current?.click()}>
                          Import bookmarks from Chrome
                        </button>
                        <input
                          ref={bookmarkImportRef}
                          type="file"
                          hidden
                          accept=".html,.htm,text/html"
                          onChange={importBookmarksFile}
                        />
                        <button
                          type="button"
                          disabled={!bookmarks.length}
                          onClick={exportBookmarksFile}
                        >
                          Export bookmarks
                        </button>
                        <div className="browser-menu-subtitle">Saved bookmarks</div>
                        {bookmarks.length ? (
                          <div className="browser-menu-list">
                            {bookmarks.map((item) => (
                              <button
                                className="browser-menu-list-item"
                                type="button"
                                key={item.url}
                                onClick={() => {
                                  navigate(item.url)
                                  setBrowserMenuOpen(false)
                                }}
                              >
                                <span>{item.name}</span>
                                <small>{item.url}</small>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="browser-menu-empty">No bookmarks saved yet.</p>
                        )}
                        <div className="browser-menu-subtitle">Reading list</div>
                        <button
                          type="button"
                          disabled={
                            !currentUrl || readingList.some((item) => item.url === currentUrl)
                          }
                          onClick={() => {
                            if (!currentUrl || readingList.length >= 100) return
                            const title =
                              tabs.find((tab) => tab.id === activeTabId)?.title || currentUrl
                            persistReadingList([
                              ...readingList,
                              { name: title.slice(0, 80), url: currentUrl }
                            ])
                          }}
                        >
                          Add current tab to Reading list
                        </button>
                        {readingList.length ? (
                          readingList.map((item) => (
                            <div className="browser-menu-reading-row" key={item.url}>
                              <button
                                className="browser-menu-list-item"
                                type="button"
                                onClick={() => {
                                  navigate(item.url)
                                  setBrowserMenuOpen(false)
                                }}
                              >
                                <span>{item.name}</span>
                                <small>{item.url}</small>
                              </button>
                              <button
                                type="button"
                                aria-label={'Remove ' + item.name + ' from Reading list'}
                                onClick={() =>
                                  persistReadingList(
                                    readingList.filter((saved) => saved.url !== item.url)
                                  )
                                }
                              >
                                ×
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className="browser-menu-empty">No pages saved to the Reading list.</p>
                        )}
                      </div>
                    )}
                    {browserMenuView === 'downloads' && (
                      <div className="browser-menu-list">
                        {downloads.length ? (
                          downloads.map((item) => (
                            <div className="browser-menu-list-item" key={item.id}>
                              <span>{item.name}</span>
                              <small>
                                {item.state}
                                {item.total
                                  ? ' · ' + Math.round((item.received / item.total) * 100) + '%'
                                  : ''}
                              </small>
                            </div>
                          ))
                        ) : (
                          <p className="browser-menu-empty">No downloads yet.</p>
                        )}
                      </div>
                    )}
                    {browserMenuView === 'passwords' && (
                      <div className="browser-menu-form">
                        <p>
                          Logins are encrypted on this device. Choose Fill to put a saved login into
                          its matching website.
                        </p>
                        <div className="browser-menu-shortcut-grid">
                          {[
                            ['Google Password Manager', 'https://passwords.google.com/'],
                            ['Payments', 'https://payments.google.com/'],
                            ['Contact info', 'https://myaccount.google.com/personal-info'],
                            ['Identity docs', 'https://myaccount.google.com/'],
                            ['Travel', 'https://www.google.com/travel/']
                          ].map(([label, url]) => (
                            <button
                              type="button"
                              key={label}
                              onClick={() => {
                                navigate(url)
                                setBrowserMenuOpen(false)
                              }}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        {passwords.map((item) => (
                          <div className="password-row" key={item.id}>
                            <span>
                              <b>{item.host}</b>
                              <small>{item.username}</small>
                            </span>
                            <button
                              type="button"
                              onClick={async () => {
                                const result = await window.api.autofillPassword(item.id)
                                setPasswordNotice(
                                  result?.ok ? 'Login filled.' : 'Open this login’s website first.'
                                )
                              }}
                            >
                              Fill
                            </button>
                            <button
                              type="button"
                              aria-label={'Remove login for ' + item.host}
                              onClick={async () => {
                                await window.api.removePassword(item.id)
                                setPasswords(await window.api.listPasswords())
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <form
                          onSubmit={async (event) => {
                            event.preventDefault()
                            const result = await window.api.savePassword({
                              username: loginUsername,
                              password: loginPassword
                            })
                            setPasswordNotice(
                              result?.ok
                                ? 'Login saved securely.'
                                : 'Open an HTTPS sign-in page and enter both fields.'
                            )
                            if (result?.ok) {
                              setLoginUsername('')
                              setLoginPassword('')
                              setPasswords(await window.api.listPasswords())
                            }
                          }}
                        >
                          <label>
                            Username or email
                            <input
                              autoComplete="off"
                              value={loginUsername}
                              onChange={(event) => setLoginUsername(event.target.value)}
                            />
                          </label>
                          <label>
                            Password
                            <input
                              type="password"
                              autoComplete="new-password"
                              value={loginPassword}
                              onChange={(event) => setLoginPassword(event.target.value)}
                            />
                          </label>
                          <button type="submit" disabled={!currentUrl.startsWith('https://')}>
                            Save login for this page
                          </button>
                        </form>
                        {passwordNotice && (
                          <small className="browser-menu-status">{passwordNotice}</small>
                        )}
                      </div>
                    )}
                    {browserMenuView === 'find' && (
                      <form
                        className="browser-menu-form"
                        onSubmit={(event) => {
                          event.preventDefault()
                          window.api.find(findText)
                        }}
                      >
                        <label>
                          Find text
                          <input
                            autoFocus
                            value={findText}
                            onChange={(event) => setFindText(event.target.value)}
                          />
                        </label>
                        <div className="browser-menu-form-actions">
                          <button type="submit" disabled={!currentUrl || !findText}>
                            Find next
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              window.api.stopFind()
                              setFindMatches(0)
                              setFindText('')
                            }}
                          >
                            Close
                          </button>
                        </div>
                        <small className="browser-menu-status">{findMatches} matches</small>
                      </form>
                    )}
                    {browserMenuView === 'groups' && (
                      <form
                        className="browser-menu-form"
                        onSubmit={(event) => {
                          event.preventDefault()
                          window.api.groupTab(tabGroupName)
                          setBrowserMenuOpen(false)
                        }}
                      >
                        <label>
                          Group name for this tab
                          <input
                            maxLength="24"
                            value={tabGroupName}
                            onChange={(event) => setTabGroupName(event.target.value)}
                          />
                        </label>
                        <div className="browser-menu-form-actions">
                          <button type="submit">Save group</button>
                          <button
                            type="button"
                            onClick={() => {
                              setTabGroupName('')
                              window.api.groupTab('')
                              setBrowserMenuOpen(false)
                            }}
                          >
                            Remove group
                          </button>
                        </div>
                      </form>
                    )}
                    {browserMenuView === 'clear-data' && (
                      <div className="browser-menu-form">
                        <p>
                          Clear this browser’s open tabs, session history, cookies, and site storage
                          in all open windows.
                        </p>
                        {clearDataConfirm ? (
                          <div className="browser-menu-form-actions">
                            <button
                              className="danger-action"
                              type="button"
                              onClick={async () => {
                                await window.api.clearData()
                                setClearDataConfirm(false)
                                setBrowserMenuOpen(false)
                              }}
                            >
                              Clear data now
                            </button>
                            <button type="button" onClick={() => setClearDataConfirm(false)}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            className="danger-action"
                            type="button"
                            onClick={() => setClearDataConfirm(true)}
                          >
                            Continue to clear data
                          </button>
                        )}
                      </div>
                    )}
                    {browserMenuView === 'extensions' && (
                      <div className="browser-menu-form">
                        <p>
                          Load an unpacked extension folder. Electron supports only part of the
                          Chrome extension APIs; Chrome Web Store one-click installs are not
                          available.
                        </p>
                        <button
                          type="button"
                          disabled={isIncognito}
                          onClick={async () => {
                            const result = await window.api.loadExtension()
                            if (result?.ok) {
                              setExtensionNotice(`${result.extension.name} loaded.`)
                              window.api.getExtensions().then(setExtensions)
                            } else if (!result?.canceled) {
                              setExtensionNotice(result?.reason || 'Could not load that extension.')
                            }
                          }}
                        >
                          Load unpacked extension…
                        </button>
                        {isIncognito && (
                          <small>Extensions are unavailable in incognito windows.</small>
                        )}
                        {extensionNotice && <small role="status">{extensionNotice}</small>}
                        {extensions.map((extension) => (
                          <div className="browser-menu-extension-row" key={extension.id}>
                            <span>
                              <strong>{extension.name}</strong>
                              <small>Version {extension.version}</small>
                            </span>
                            <button
                              type="button"
                              aria-label={`Remove ${extension.name}`}
                              onClick={async () => {
                                await window.api.removeExtension(extension.id)
                                window.api.getExtensions().then(setExtensions)
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => window.api.getExtensions().then(setExtensions)}
                        >
                          Refresh extensions
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('https://chromewebstore.google.com/')}
                        >
                          Visit Chrome Web Store
                        </button>
                      </div>
                    )}
                    {browserMenuView === 'performance' && (
                      <div className="browser-menu-form">
                        <p>Measurements for the current page process.</p>
                        <button
                          type="button"
                          onClick={() => window.api.getPagePerformance().then(setPagePerformance)}
                        >
                          Refresh measurements
                        </button>
                        {pagePerformance?.process ? (
                          <dl className="browser-menu-metrics">
                            <div>
                              <dt>Page</dt>
                              <dd>{pagePerformance.process.title}</dd>
                            </div>
                            <div>
                              <dt>CPU</dt>
                              <dd>{pagePerformance.process.cpu.toFixed(1)}%</dd>
                            </div>
                            <div>
                              <dt>Private memory</dt>
                              <dd>{(pagePerformance.process.memoryKb / 1024).toFixed(1)} MB</dd>
                            </div>
                            <div>
                              <dt>Page load</dt>
                              <dd>{pagePerformance.timing?.loadMs ?? '—'} ms</dd>
                            </div>
                            <div>
                              <dt>Transferred</dt>
                              <dd>
                                {pagePerformance.timing?.transferBytes
                                  ? `${(pagePerformance.timing.transferBytes / 1024).toFixed(1)} KB`
                                  : '—'}
                              </dd>
                            </div>
                          </dl>
                        ) : (
                          <p className="browser-menu-empty">Open a page to see its measurements.</p>
                        )}
                      </div>
                    )}
                    {browserMenuView === 'task-manager' && (
                      <div className="browser-menu-form">
                        <p>Open tabs in this window. Values refresh every two seconds.</p>
                        {tabProcesses.map((row) => (
                          <div className="browser-menu-process-row" key={row.id}>
                            <span>
                              <strong>{row.title}</strong>
                              <small>{row.url || row.status}</small>
                              <small>
                                CPU {row.cpu.toFixed(1)}% · {(row.memoryKb / 1024).toFixed(1)} MB
                              </small>
                            </span>
                            {tabProcesses.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  window.api.closeTab(row.id)
                                  window.api.getTabProcesses().then(setTabProcesses)
                                }}
                              >
                                Close tab
                              </button>
                            )}
                          </div>
                        ))}
                        {!tabProcesses.length && (
                          <p className="browser-menu-empty">No open tabs.</p>
                        )}
                      </div>
                    )}
                    {browserMenuView === 'account' && (
                      <div className="browser-menu-form">
                        {googleSignedIn ? (
                          <>
                            <div className="browser-account-status">
                              <span>H</span>
                              <div>
                                <strong>Hrishikesh Account</strong>
                                <small>Local browser profile · Google websites connected</small>
                              </div>
                              <em>On this device</em>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                navigate('https://myaccount.google.com/')
                                setBrowserMenuOpen(false)
                              }}
                            >
                              Manage Google website sign-in
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await window.api.signOutGoogle()
                                setGoogleSignedIn(false)
                              }}
                            >
                              Sign out of Google
                            </button>
                          </>
                        ) : (
                          <>
                            <p>
                              Your browser profile is saved on this device. Account sign-in will be
                              connected with the other services later.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setBrowserMenuOpen(false)
                                setAccountEmail('')
                                setAccountConnectMessage('')
                                setHelpPageTabId(null)
                                setAccountPageTabId(activeTabId)
                              }}
                            >
                              Open Hrishikesh Account
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setBrowserMenuOpen(false)
                            setShowCustomizer(true)
                          }}
                        >
                          Customize Hrishikesh
                        </button>
                      </div>
                    )}
                    {browserMenuView === 'settings' && (
                      <div className="browser-menu-list">
                        <button
                          className="browser-menu-row"
                          type="button"
                          onClick={() => {
                            setBrowserMenuOpen(false)
                            setShowCustomizer(true)
                          }}
                        >
                          <span>Customize Hrishikesh</span>
                          <kbd>Theme and shortcuts</kbd>
                        </button>
                        <button
                          className="browser-menu-row"
                          type="button"
                          onClick={() => showBrowserMenuView('passwords')}
                        >
                          <span>Passwords and autofill</span>
                          <kbd>Security</kbd>
                        </button>
                        <button
                          className="browser-menu-row"
                          type="button"
                          onClick={() => {
                            setClearDataConfirm(false)
                            showBrowserMenuView('clear-data')
                          }}
                        >
                          <span>Privacy and browsing data</span>
                          <kbd>Clear data</kbd>
                        </button>
                        <button
                          className="browser-menu-row"
                          type="button"
                          onClick={() => showBrowserMenuView('account')}
                        >
                          <span>Hrishikesh profile and sync</span>
                          <kbd>On this device</kbd>
                        </button>
                      </div>
                    )}
                    {browserMenuView === 'help' && (
                      <div className="browser-menu-form browser-help-center">
                        <p className="browser-help-intro">
                          <strong>Hrishikesh Help Center</strong>
                          <br />
                          Short guides written for this browser.
                        </p>
                        <button type="button" onClick={() => showBrowserMenuView('about')}>
                          About Hrishikesh
                        </button>
                        <button type="button" onClick={() => showBrowserMenuView('whats-new')}>
                          What’s new
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIssueReportText('')
                            setIssueReportNotice('')
                            showBrowserMenuView('report-issue')
                          }}
                        >
                          Report an issue
                        </button>
                        <button
                          type="button"
                          disabled={!currentUrl}
                          onClick={() => {
                            navigate(
                              'https://safebrowsing.google.com/safebrowsing/report_phish/?url=' +
                                encodeURIComponent(currentUrl)
                            )
                            setBrowserMenuOpen(false)
                          }}
                        >
                          Report unsafe site
                        </button>
                        <details className="browser-help-article">
                          <summary>Search and move between pages</summary>
                          <p>
                            Type a phrase in the address bar to search Google, or enter a website
                            address. Use Back, Forward, Reload, and the HRX home button to move
                            around.
                          </p>
                        </details>
                        <details className="browser-help-article">
                          <summary>Make the home page yours</summary>
                          <p>
                            Open the appearance settings to choose a theme, set a background image,
                            and arrange your shortcuts. Changes can be saved on this device.
                          </p>
                        </details>
                        <details className="browser-help-article">
                          <summary>Bookmarks, history, and downloads</summary>
                          <p>
                            Use the bookmark control to keep a page handy. The HRX menu opens your
                            recent history and downloads for this browser profile.
                          </p>
                        </details>
                        <details className="browser-help-article">
                          <summary>Accounts and your browser data</summary>
                          <p>
                            Home page choices, bookmarks, and shortcuts are stored on this device.
                            Hrishikesh Account sign-in and cross-device sync are not connected yet.
                            Signing in to a website is separate from an Hrishikesh account.
                          </p>
                        </details>
                        <details className="browser-help-article">
                          <summary>CPU, memory, and network meters</summary>
                          <p>
                            CPU and memory rings show live device readings. The network rings show
                            current download and upload traffic; an idle connection can read close
                            to zero. CPU slowdown affects browser page processing, while the RAM
                            guard can close inactive tabs when its soft limit is crossed.
                          </p>
                        </details>
                        <details className="browser-help-article">
                          <summary>A page will not load</summary>
                          <p>
                            Check the address and connection, then try Reload. If other sites open,
                            the page may be unavailable. If none open, reconnect to the internet and
                            try again.
                          </p>
                        </details>
                        <p className="browser-help-footer">
                          These guides are original Hrishikesh help text. Product terms and privacy
                          details can be added separately as the browser features are finalized.
                        </p>
                      </div>
                    )}
                    {browserMenuView === 'about' && (
                      <div className="browser-menu-form">
                        <p>
                          <strong>Hrishikesh Browser</strong>
                        </p>
                        <p>Version {appVersion || '1.0.0'}</p>
                        <p>
                          Built for Hrishikesh. Your bookmarks and home page settings stay on this
                          device.
                        </p>
                      </div>
                    )}
                    {browserMenuView === 'whats-new' && (
                      <div className="browser-menu-form">
                        <p>
                          <strong>Recent updates</strong>
                        </p>
                        <p>Shortcuts now stay in one row and scroll sideways when needed.</p>
                        <p>
                          Google sign-in status, bookmarks bar, import/export, and named windows are
                          available from the browser menu.
                        </p>
                      </div>
                    )}
                    {browserMenuView === 'report-issue' && (
                      <div className="browser-menu-form">
                        <p>
                          Write down what happened. Copying keeps the report on your device; you
                          choose where to send it.
                        </p>
                        <label>
                          What went wrong?
                          <textarea
                            autoFocus
                            maxLength="3000"
                            rows="5"
                            value={issueReportText}
                            onChange={(event) => setIssueReportText(event.target.value)}
                          />
                        </label>
                        <button
                          type="button"
                          disabled={!issueReportText.trim()}
                          onClick={async () => {
                            const copied = await window.api.copyText(
                              `Hrishikesh Browser issue\nPage: ${currentUrl || 'Home'}\n\n${issueReportText.trim()}`
                            )
                            setIssueReportNotice(
                              copied ? 'Issue report copied.' : 'Could not copy the report.'
                            )
                          }}
                        >
                          Copy issue report
                        </button>
                        {issueReportNotice && (
                          <small className="browser-menu-status" role="status">
                            {issueReportNotice}
                          </small>
                        )}
                      </div>
                    )}
                    {browserMenuView === 'more-tools' && (
                      <div className="browser-menu-list">
                        <label className="browser-menu-tab-search">
                          Search tabs
                          <input
                            value={tabSearchQuery}
                            onChange={(event) => setTabSearchQuery(event.target.value)}
                            placeholder="Search open tabs"
                          />
                        </label>
                        {tabs
                          .filter((tab) =>
                            `${tab.title} ${tab.url || ''}`
                              .toLowerCase()
                              .includes(tabSearchQuery.toLowerCase())
                          )
                          .map((tab) => (
                            <button
                              className="browser-menu-list-item"
                              type="button"
                              key={tab.id}
                              onClick={() => {
                                window.api.switchTab(tab.id)
                                setBrowserMenuOpen(false)
                              }}
                            >
                              <span>{tab.title}</span>
                              <small>{tab.url || 'New tab'}</small>
                            </button>
                          ))}
                        <button
                          className="browser-menu-row"
                          type="button"
                          onClick={() => {
                            setWindowName('')
                            showBrowserMenuView('name-window')
                          }}
                        >
                          <span>Name window…</span>
                          <kbd>Window title</kbd>
                        </button>
                        <button
                          className="browser-menu-row"
                          type="button"
                          onClick={() => {
                            setBrowserMenuOpen(false)
                            setShowCustomizer(true)
                          }}
                        >
                          <span>Customize Hrishikesh</span>
                          <kbd>Home page</kbd>
                        </button>
                        <button
                          className="browser-menu-row"
                          type="button"
                          onClick={async () => {
                            const enabled = await window.api.setVerticalTabs(!verticalTabs)
                            setVerticalTabs(Boolean(enabled))
                          }}
                        >
                          <span>
                            {verticalTabs ? 'Show tabs across the top' : 'Show tabs vertically'}
                          </span>
                          <kbd>{verticalTabs ? 'On' : 'Off'}</kbd>
                        </button>
                        <button
                          className="browser-menu-row"
                          type="button"
                          disabled={!currentUrl}
                          onClick={async () => {
                            const result = await window.api.toggleReaderMode()
                            if (result?.ok) setReaderMode(Boolean(result.enabled))
                            setBrowserMenuOpen(false)
                          }}
                        >
                          <span>{readerMode ? 'Exit reading mode' : 'Reading mode'}</span>
                          <kbd>{currentUrl ? (readerMode ? 'On' : 'Off') : 'Open a page'}</kbd>
                        </button>
                        <button
                          className="browser-menu-row"
                          type="button"
                          disabled={!currentUrl}
                          onClick={() => showBrowserMenuView('performance')}
                        >
                          <span>Performance</span>
                          <kbd>{currentUrl ? 'Page stats' : 'Open a page'}</kbd>
                        </button>
                        <button
                          className="browser-menu-row"
                          type="button"
                          onClick={() => showBrowserMenuView('task-manager')}
                        >
                          <span>Task manager</span>
                          <kbd>{tabs.length} tabs</kbd>
                        </button>
                        <button
                          className="browser-menu-row"
                          type="button"
                          disabled={!currentUrl}
                          onClick={async () => {
                            const result = await window.api.savePage()
                            setBrowserNotice(
                              result?.ok
                                ? 'Page saved.'
                                : result?.canceled
                                  ? 'Save cancelled.'
                                  : 'Open a web page first.'
                            )
                          }}
                        >
                          <span>Save page as</span>
                          <kbd>HTML</kbd>
                        </button>
                        <button
                          className="browser-menu-row"
                          type="button"
                          disabled={!currentUrl}
                          onClick={() => {
                            if (currentUrl) {
                              const name = (() => {
                                try {
                                  return new URL(currentUrl).hostname
                                } catch {
                                  return 'Saved page'
                                }
                              })()
                              persistBookmarks([
                                ...bookmarks.filter((item) => item.url !== currentUrl),
                                { name, url: currentUrl }
                              ])
                              setBrowserNotice('Added to bookmarks.')
                            }
                          }}
                        >
                          <span>Add current page to bookmarks</span>
                          <kbd></kbd>
                        </button>
                        <button
                          className="browser-menu-row"
                          type="button"
                          disabled={!currentUrl || homeShortcuts.length >= 20}
                          onClick={() => {
                            setShortcutName(tabs.find((tab) => tab.id === activeTabId)?.title || '')
                            setShortcutUrl(currentUrl)
                            setShortcutFormError('')
                            setShowShortcutForm(true)
                            setBrowserMenuOpen(false)
                          }}
                        >
                          <span>Create shortcut</span>
                          <kbd>Home page</kbd>
                        </button>
                        <button
                          className="browser-menu-row"
                          type="button"
                          disabled={!currentUrl}
                          onClick={() => window.api.openDevTools()}
                        >
                          <span>Developer tools</span>
                          <kbd></kbd>
                        </button>
                      </div>
                    )}
                    {browserMenuView === 'name-window' && (
                      <form
                        className="browser-menu-form"
                        onSubmit={async (event) => {
                          event.preventDefault()
                          await window.api.setWindowTitle(windowName)
                          setBrowserNotice('Window name updated.')
                          setBrowserMenuOpen(false)
                        }}
                      >
                        <label>
                          Window name
                          <input
                            autoFocus
                            maxLength="48"
                            value={windowName}
                            onChange={(event) => setWindowName(event.target.value)}
                            placeholder="Hrishikesh"
                          />
                        </label>
                        <button type="submit" disabled={!windowName.trim()}>
                          Save window name
                        </button>
                      </form>
                    )}
                    {browserMenuView === 'qr-code' && (
                      <div className="browser-menu-form browser-menu-qr">
                        <p>Scan this code with your phone to open the current page.</p>
                        {qrCodeDataUrl ? (
                          <img src={qrCodeDataUrl} alt={`QR code for ${currentUrl}`} />
                        ) : (
                          <p className="browser-menu-empty">Creating QR code…</p>
                        )}
                        <small>
                          Generated on this device; the URL is not sent to a QR service.
                        </small>
                      </div>
                    )}
                    {browserMenuView === 'cast' && (
                      <div className="browser-menu-form">
                        <p>
                          HrishikeshCast lets a nearby phone open this page by scanning a QR code.
                          To mirror your Windows screen to a wireless display, press{' '}
                          <kbd>Win+K</kbd>.
                        </p>
                        <button
                          type="button"
                          disabled={!currentUrl}
                          onClick={() => showBrowserMenuView('qr-code')}
                        >
                          Share this page with HrishikeshCast
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <section className="browser-menu-section">
                      <h3>New</h3>
                      <button
                        className="browser-menu-row"
                        type="button"
                        onClick={() => {
                          window.api.newTab()
                          setBrowserMenuOpen(false)
                        }}
                      >
                        <span>New tab</span>
                        <kbd>Ctrl+T</kbd>
                      </button>
                      <button
                        className="browser-menu-row"
                        type="button"
                        onClick={() => {
                          window.api.newWindow(false)
                          setBrowserMenuOpen(false)
                        }}
                      >
                        <span>New window</span>
                        <kbd>Ctrl+N</kbd>
                      </button>
                      <button
                        className="browser-menu-row"
                        type="button"
                        onClick={() => {
                          window.api.newWindow(true)
                          setBrowserMenuOpen(false)
                        }}
                      >
                        <span>New incognito window</span>
                        <kbd>Ctrl+Shift+N</kbd>
                      </button>
                    </section>
                    <section className="browser-menu-section">
                      <h3>Profile</h3>
                      <button
                        className="browser-menu-row"
                        data-hover-view="account"
                        type="button"
                        onClick={() => {
                          setBrowserMenuOpen(false)
                          setBrowserMenuView('')
                          setAccountEmail('')
                          setAccountConnectMessage('')
                          setHelpPageTabId(null)
                          setAccountPageTabId(activeTabId)
                        }}
                      >
                        <span>Hrishikesh Account</span>
                        <kbd>{googleSignedIn ? 'Browser profile' : 'Sign in'}</kbd>
                      </button>
                    </section>
                    <section className="browser-menu-section">
                      <h3>HrishikeshCast, save, and share</h3>
                      <button
                        className="browser-menu-row"
                        data-hover-view="cast"
                        type="button"
                        onClick={() => showBrowserMenuView('cast')}
                      >
                        <span>HrishikeshCast</span>
                        <kbd>Nearby devices</kbd>
                      </button>
                      <button
                        className="browser-menu-row"
                        type="button"
                        disabled={!currentUrl}
                        onClick={async () => {
                          const result = await window.api.savePage()
                          setBrowserNotice(
                            result?.ok
                              ? 'Page saved.'
                              : result?.canceled
                                ? 'Save cancelled.'
                                : 'Open a web page first.'
                          )
                        }}
                      >
                        <span>Save page as</span>
                        <kbd></kbd>
                      </button>
                      <button
                        className="browser-menu-row"
                        type="button"
                        disabled={!currentUrl || homeShortcuts.length >= 20}
                        onClick={() => {
                          setShortcutName(tabs.find((tab) => tab.id === activeTabId)?.title || '')
                          setShortcutUrl(currentUrl)
                          setShortcutFormError('')
                          setShowShortcutForm(true)
                          setBrowserMenuOpen(false)
                        }}
                      >
                        <span>Create shortcut</span>
                        <kbd>Home page</kbd>
                      </button>
                      <button
                        className="browser-menu-row"
                        type="button"
                        disabled={!currentUrl}
                        onClick={async () => {
                          const result = await window.api.shareUrl()
                          setBrowserNotice(
                            result?.ok
                              ? 'Link copied. Paste it into any app to share.'
                              : 'Open a web page first.'
                          )
                        }}
                      >
                        <span>Copy link to share</span>
                        <kbd></kbd>
                      </button>
                      <button
                        className="browser-menu-row"
                        type="button"
                        disabled={!currentUrl}
                        onClick={() => showBrowserMenuView('qr-code')}
                      >
                        <span>Share page to another device</span>
                        <kbd>{currentUrl ? 'QR code' : 'Open a page'}</kbd>
                      </button>
                      <button
                        className="browser-menu-row"
                        type="button"
                        disabled={!currentUrl}
                        onClick={() => showBrowserMenuView('qr-code')}
                      >
                        <span>Create QR code</span>
                        <kbd>{currentUrl ? 'On this device' : 'Open a page'}</kbd>
                      </button>
                    </section>
                    <section className="browser-menu-section">
                      <h3>History and tools</h3>
                      <button
                        className="browser-menu-row"
                        data-hover-view="passwords"
                        type="button"
                        onClick={() => showBrowserMenuView('passwords')}
                      >
                        <span>Passwords and autofill</span>
                        <kbd></kbd>
                      </button>
                      <button
                        className="browser-menu-row"
                        data-hover-view="history"
                        type="button"
                        onClick={() => showBrowserMenuView('history')}
                      >
                        <span>History</span>
                        <kbd>Ctrl+H</kbd>
                      </button>
                      <button
                        className="browser-menu-row"
                        data-hover-view="downloads"
                        type="button"
                        onClick={() => showBrowserMenuView('downloads')}
                      >
                        <span>Downloads</span>
                        <kbd>Ctrl+J</kbd>
                      </button>
                      <button
                        className="browser-menu-row"
                        data-hover-view="bookmarks"
                        type="button"
                        onClick={() => {
                          showBrowserMenuView('bookmarks')
                        }}
                      >
                        <span>Bookmarks and lists</span>
                        <kbd>Ctrl+Shift+O</kbd>
                      </button>
                      <button
                        className="browser-menu-row"
                        data-hover-view="groups"
                        type="button"
                        onClick={() => showBrowserMenuView('groups')}
                      >
                        <span>Tab groups</span>
                        <kbd></kbd>
                      </button>
                      <button
                        className="browser-menu-row"
                        data-hover-view="clear-data"
                        type="button"
                        onClick={() => {
                          setClearDataConfirm(false)
                          showBrowserMenuView('clear-data')
                        }}
                      >
                        <span>Delete browsing data</span>
                        <kbd>Ctrl+Shift+Del</kbd>
                      </button>
                    </section>
                    <section className="browser-menu-section">
                      <h3>Zoom</h3>
                      <div className="browser-menu-zoom">
                        <button
                          type="button"
                          aria-label="Zoom out"
                          onClick={() => window.api.zoom(zoomPercent - 10).then(setZoomPercent)}
                        >
                          −
                        </button>
                        <span>{zoomPercent}%</span>
                        <button
                          type="button"
                          aria-label="Zoom in"
                          onClick={() => window.api.zoom(zoomPercent + 10).then(setZoomPercent)}
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => window.api.zoom(100).then(setZoomPercent)}
                        >
                          Reset
                        </button>
                      </div>
                    </section>
                    <section className="browser-menu-section">
                      <h3>Page</h3>
                      <button
                        className="browser-menu-row"
                        type="button"
                        disabled={!currentUrl}
                        onClick={() => {
                          window.api.print()
                          setBrowserMenuOpen(false)
                        }}
                      >
                        <span>Print</span>
                        <kbd>Ctrl+P</kbd>
                      </button>
                      <button className="browser-menu-row" type="button" onClick={openHrxAi}>
                        <span>Open Hrishikesh AI</span>
                        <kbd>HRX AI</kbd>
                      </button>
                      <button
                        className="browser-menu-row"
                        type="button"
                        onClick={() => {
                          navigate('https://lens.google.com/')
                          setBrowserMenuOpen(false)
                        }}
                      >
                        <span>Search with Google Lens</span>
                        <kbd>Image search</kbd>
                      </button>
                      <button
                        className="browser-menu-row"
                        type="button"
                        onClick={() => {
                          navigate(
                            currentUrl
                              ? 'https://translate.google.com/translate?sl=auto&tl=en&u=' +
                                  encodeURIComponent(currentUrl)
                              : 'https://translate.google.com/'
                          )
                          setBrowserMenuOpen(false)
                        }}
                      >
                        <span>Translate to English</span>
                        <kbd></kbd>
                      </button>
                      <button
                        className="browser-menu-row"
                        data-hover-view="find"
                        type="button"
                        disabled={!currentUrl}
                        onClick={() => showBrowserMenuView('find')}
                      >
                        <span>Find in page</span>
                        <kbd>Ctrl+F</kbd>
                      </button>
                      <button
                        className="browser-menu-row"
                        type="button"
                        onClick={() => runEditCommand('undo')}
                      >
                        <span>Undo</span>
                        <kbd>Ctrl+Z</kbd>
                      </button>
                      <button
                        className="browser-menu-row"
                        type="button"
                        onClick={() => runEditCommand('redo')}
                      >
                        <span>Redo</span>
                        <kbd>Ctrl+Y</kbd>
                      </button>
                      <div className="browser-menu-edit-row">
                        <button type="button" onClick={() => runEditCommand('cut')}>
                          Cut <kbd>Ctrl+X</kbd>
                        </button>
                        <button type="button" onClick={() => runEditCommand('copy')}>
                          Copy <kbd>Ctrl+C</kbd>
                        </button>
                        <button type="button" onClick={() => runEditCommand('paste')}>
                          Paste <kbd>Ctrl+V</kbd>
                        </button>
                        <button type="button" onClick={() => runEditCommand('selectAll')}>
                          Select all <kbd>Ctrl+A</kbd>
                        </button>
                      </div>
                    </section>
                    <section className="browser-menu-section">
                      <h3>Extensions</h3>
                      <button
                        className="browser-menu-row"
                        data-hover-view="more-tools"
                        type="button"
                        onClick={() => showBrowserMenuView('more-tools')}
                      >
                        <span>More tools</span>
                        <kbd>›</kbd>
                      </button>
                    </section>
                    <section className="browser-menu-section">
                      <h3>Browser</h3>
                      <button
                        className="browser-menu-row"
                        data-hover-view="help"
                        type="button"
                        onClick={() => {
                          setBrowserMenuOpen(false)
                          setBrowserMenuView('')
                          setAccountPageTabId(null)
                          setHelpPageTabId(activeTabId)
                        }}
                      >
                        <span>Help</span>
                        <kbd></kbd>
                      </button>
                      <button
                        className="browser-menu-row"
                        data-hover-view="settings"
                        type="button"
                        onClick={() => showBrowserMenuView('settings')}
                      >
                        <span>Settings</span>
                        <kbd></kbd>
                      </button>
                      <button
                        className="browser-menu-row"
                        type="button"
                        onClick={() => window.api.exit()}
                      >
                        <span>Exit</span>
                        <kbd>Alt+F4</kbd>
                      </button>
                    </section>
                  </>
                )}
              </div>
              {!browserMenuView && hoveredBrowserMenuView && (
                <div
                  className="browser-menu-hover-panel"
                  role="menu"
                  style={{ marginTop: `${hoveredBrowserMenuTop}px` }}
                >
                  <div className="browser-menu-hover-title">
                    {hoveredBrowserMenuView === 'account' && 'Hrishikesh profile'}
                    {hoveredBrowserMenuView === 'passwords' && 'Passwords and autofill'}
                    {hoveredBrowserMenuView === 'history' && 'History'}
                    {hoveredBrowserMenuView === 'downloads' && 'Downloads'}
                    {hoveredBrowserMenuView === 'bookmarks' && 'Bookmarks and lists'}
                    {hoveredBrowserMenuView === 'groups' && 'Tab groups'}
                    {hoveredBrowserMenuView === 'clear-data' && 'Delete browsing data'}
                    {hoveredBrowserMenuView === 'extensions' && 'Extensions'}
                    {hoveredBrowserMenuView === 'find' && 'Find and edit'}
                    {hoveredBrowserMenuView === 'cast' && 'HrishikeshCast, save, and share'}
                    {hoveredBrowserMenuView === 'more-tools' && 'More tools'}
                    {hoveredBrowserMenuView === 'help' && 'Help'}
                    {hoveredBrowserMenuView === 'settings' && 'Settings'}
                  </div>
                  {(browserMenuHoverItems[hoveredBrowserMenuView] || []).map((item) => (
                    <button
                      type="button"
                      className="browser-menu-hover-item"
                      key={item}
                      onClick={() => {
                        if (hoveredBrowserMenuView === 'help' && item === 'Help center') {
                          setBrowserMenuOpen(false)
                          setBrowserMenuView('')
                          setAccountPageTabId(null)
                          setHelpPageTabId(activeTabId)
                        } else if (
                          hoveredBrowserMenuView === 'help' &&
                          item === 'About Hrishikesh'
                        ) {
                          showBrowserMenuView('about')
                        } else if (hoveredBrowserMenuView === 'help' && item === "What's new") {
                          showBrowserMenuView('whats-new')
                        } else if (
                          hoveredBrowserMenuView === 'help' &&
                          item === 'Report an issue'
                        ) {
                          setIssueReportText('')
                          setIssueReportNotice('')
                          showBrowserMenuView('report-issue')
                        } else {
                          showBrowserMenuView(hoveredBrowserMenuView)
                        }
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {isLoading && (
        <section className="page-loading-screen" role="status" aria-label="Loading page">
          <div className="page-loading-content">
            <img src={browserMark} alt="" />
            <span className="page-loading-spinner" aria-hidden="true" />
            <strong>Loading page…</strong>
            {currentUrl && <small>{currentUrl}</small>}
          </div>
        </section>
      )}
      {isLoading && (
        <div className="browser-loading-indicator" role="status" aria-label="Loading page" />
      )}

      <div className="tab-strip" role="tablist" aria-label="Browser tabs">
        <button
          className="hrx-brand-control"
          type="button"
          aria-label="Open HRX menu"
          title="HRX menu"
          aria-expanded={browserMenuOpen}
          onClick={() => {
            setBrowserMenuOpen((open) => !open)
            setBrowserMenuView('')
          }}
        >
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path d="M16 2.5 27.5 9v14L16 29.5 4.5 23V9L16 2.5Z" />
            <path d="M10 22V10h3.2l5.6 7.2V10H22v12h-3.1l-5.7-7.3V22H10Z" />
            <path d="m25.3 5.8 3.1-3.1" />
          </svg>
          <span className="hrx-brand-copy">
            <strong>HRX</strong>
          </span>
        </button>
        {tabs.map((tab) => (
          <div className={`tab-item${activeTabId === tab.id ? ' active' : ''}`} key={tab.id}>
            <button
              className="tab-label"
              type="button"
              role="tab"
              aria-selected={activeTabId === tab.id}
              onClick={() => window.api.switchTab(tab.id)}
            >
              {tab.title}
              {tab.group && <span className="tab-group-label">{tab.group}</span>}
            </button>
            <button
              className="tab-close"
              type="button"
              aria-label={`Close ${tab.title}`}
              onClick={() => window.api.closeTab(tab.id)}
            >
              ×
            </button>
          </div>
        ))}
        <button
          className="tab-add"
          type="button"
          aria-label="New tab"
          title="New tab"
          onClick={() => window.api.newTab()}
        >
          +
        </button>
      </div>

      {showBookmarksBar && (
        <div className="browser-bookmarks-bar" aria-label="Bookmarks bar">
          {bookmarks.slice(0, 12).map((item) => (
            <button
              type="button"
              key={item.url}
              title={item.url}
              onClick={() => navigate(item.url)}
            >
              {item.name}
            </button>
          ))}
          {!bookmarks.length && <span>No saved bookmarks yet</span>}
          <button
            className="browser-bookmarks-bar-manage"
            type="button"
            onClick={() => {
              setBrowserMenuOpen(true)
              showBrowserMenuView('bookmarks')
            }}
          >
            All bookmarks
          </button>
        </div>
      )}

      <section className="start-page">
        <header className="home-topbar">
          {isIncognito && <span className="incognito-badge">Incognito</span>}
          <nav className="home-top-links" aria-label="Home links">
            <button
              className="home-mail-button"
              type="button"
              aria-expanded={homeMailOpen}
              onClick={() => setHomeMailOpen((open) => !open)}
            >
              Mail
            </button>
            <button
              className="home-images-button"
              type="button"
              onClick={() => navigate('https://www.google.com/imghp')}
            >
              Images
            </button>
            <button
              className="home-app-launcher"
              type="button"
              aria-label="Open browser apps"
              title="Browser apps"
              aria-expanded={homeAppsOpen}
              onClick={() => setHomeAppsOpen((open) => !open)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {[4, 12, 20].flatMap((y) =>
                  [4, 12, 20].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.7" />)
                )}
              </svg>
            </button>
            {googleSignedIn ? (
              <button
                className="home-profile-button home-google-account-button"
                type="button"
                aria-label="Hrishikesh Account"
                title="Hrishikesh Account"
                aria-expanded={homeProfileOpen}
                onClick={() => setHomeProfileOpen((open) => !open)}
              >
                <span aria-hidden="true">H</span>
              </button>
            ) : (
              <button
                className="home-sign-in-button"
                type="button"
                onClick={() => setHomeProfileOpen(true)}
              >
                Sign in
              </button>
            )}
            {homeMailOpen && (
              <div className="home-mail-menu">
                <strong>Choose your mail</strong>
                <div className="home-mail-providers">
                  {[
                    ['Gmail', 'https://mail.google.com/'],
                    ['Yahoo Mail', 'https://mail.yahoo.com/'],
                    ['Outlook', 'https://outlook.live.com/mail/'],
                    ['iCloud Mail', 'https://www.icloud.com/mail/'],
                    ['Proton Mail', 'https://mail.proton.me/'],
                    ['Zoho Mail', 'https://mail.zoho.com/'],
                    ['AOL Mail', 'https://mail.aol.com/'],
                    ['GMX Mail', 'https://www.gmx.com/mail/'],
                    ['Fastmail', 'https://www.fastmail.com/'],
                    ['Yandex Mail', 'https://mail.yandex.com/']
                  ].map(([name, url]) => (
                    <button
                      type="button"
                      key={name}
                      onClick={() => {
                        navigate(url)
                        setHomeMailOpen(false)
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    let address = otherMailUrl.trim()
                    if (!address) return
                    if (!/^https:\/\//i.test(address)) address = 'https://' + address
                    try {
                      if (new URL(address).protocol !== 'https:') return
                      navigate(address)
                      setOtherMailUrl('')
                      setHomeMailOpen(false)
                    } catch {
                      return
                    }
                  }}
                >
                  <input
                    aria-label="Other mail website"
                    placeholder="Other mail website"
                    value={otherMailUrl}
                    onChange={(event) => setOtherMailUrl(event.target.value)}
                  />
                  <button type="submit" disabled={!otherMailUrl.trim()}>
                    Open
                  </button>
                </form>
              </div>
            )}
            {homeAppsOpen && (
              <div className="home-app-menu">
                {[
                  ['Hrishikesh AI', 'hrx-ai', '✳'],
                  ['Lens', 'https://lens.google.com/', '⌕'],
                  ['Mail', 'https://mail.google.com/', '✉'],
                  ['YouTube', 'https://www.youtube.com/', '▶']
                ].map(([name, url, icon]) => (
                  <button
                    type="button"
                    key={name}
                    onClick={() => {
                      if (url === 'hrx-ai') openHrxAi()
                      else navigate(url)
                      setHomeAppsOpen(false)
                    }}
                  >
                    <span className={name === 'Hrishikesh AI' ? 'hrx-ai-app-icon' : ''}>
                      {icon}
                    </span>
                    {name}
                  </button>
                ))}
              </div>
            )}
            {homeProfileOpen && (
              <div className="home-profile-menu">
                <span className="home-google-avatar-large" aria-hidden="true">
                  H
                </span>
                <strong>Hrishikesh Account</strong>
                <small>
                  {googleSignedIn
                    ? 'Your browser profile is saved on this device. Google websites are signed in separately.'
                    : 'Your browser profile is saved on this device. Online account sign-in and sync are not connected yet.'}
                </small>
                {googleSignedIn && (
                  <button
                    type="button"
                    onClick={() => {
                      navigate('https://myaccount.google.com/')
                      setHomeProfileOpen(false)
                    }}
                  >
                    Manage Google website sign-in
                  </button>
                )}
              </div>
            )}
          </nav>
        </header>

        <aside
          className={`gx-command-rail${sidebarSetup.showSidebar ? '' : ' gx-rail-collapsed'}${sidebarSetup.centreIcons ? ' gx-rail-centred' : ''}${sidebarSetup.gxMessengerIcons ? ' gx-rail-gx-icons' : ''}`}
          aria-label="Hrishikesh navigation"
        >
          <div className="gx-rail-brand" aria-hidden="true">
            <img src={browserMark} alt="" />
            <span>
              HRISHIKESH
              <br />
              GAMING
            </span>
          </div>
          <span className="gx-rail-label">NAVIGATION</span>
          {sidebarVisibility.home && (
            <button
              className="selected"
              type="button"
              title="Home"
              onClick={() => window.api.home()}
            >
              <span aria-hidden="true">⌂</span>
              <b>Home</b>
            </button>
          )}
          {sidebarVisibility.games && (
            <button
              type="button"
              title="Open Steam"
              onClick={() => navigate('https://store.steampowered.com/')}
            >
              <span aria-hidden="true">◈</span>
              <b>Games</b>
            </button>
          )}
          {sidebarVisibility.stream && (
            <button
              type="button"
              title="Open Twitch"
              onClick={() => navigate('https://www.twitch.tv/')}
            >
              <span aria-hidden="true">▣</span>
              <b>Stream</b>
            </button>
          )}
          {sidebarVisibility.spaces && (
            <button type="button" title="Tab workspaces" onClick={() => showHomeMenu('groups')}>
              <span aria-hidden="true">▦</span>
              <b>Spaces</b>
            </button>
          )}
          {sidebarVisibility.saved && (
            <button type="button" title="Bookmarks" onClick={() => showHomeMenu('bookmarks')}>
              <span aria-hidden="true">☆</span>
              <b>Saved</b>
            </button>
          )}
          {sidebarWorkspaces.map(
            (name, index) =>
              sidebarSetup[`workspace${index}`] && (
                <button
                  key={`workspace-${name}-${index}`}
                  type="button"
                  title={`Switch to ${name}`}
                  onClick={() => window.api.groupTab(name)}
                >
                  <span aria-hidden="true">{index === 0 ? '⌂' : '♧'}</span>
                  <b>{name}</b>
                </button>
              )
          )}
          {sidebarSections
            .flatMap((section) => section.rows)
            .filter(([key]) => sidebarSetup[key])
            .map(([key, icon, label]) => (
              <button key={key} type="button" title={label} onClick={() => openSidebarItem(key)}>
                <span aria-hidden="true">{icon}</span>
                <b>{label}</b>
              </button>
            ))}
          {sidebarExtensions.map((item) => (
            <button
              key={item.url}
              type="button"
              title={item.name}
              onClick={() => navigate(item.url)}
            >
              <span aria-hidden="true">↗</span>
              <b>{item.name}</b>
            </button>
          ))}
          <div className="gx-rail-spacer" />
          {sidebarVisibility.history && (
            <button type="button" title="Browser history" onClick={() => showHomeMenu('history')}>
              <span aria-hidden="true">◷</span>
              <b>History</b>
            </button>
          )}
          {sidebarVisibility.settings && (
            <button
              type="button"
              title="Customize Hrishikesh"
              onClick={() => setShowCustomizer(true)}
            >
              <span aria-hidden="true">⚙</span>
              <b>Settings</b>
            </button>
          )}
          <button
            type="button"
            className="gx-sidebar-setup-trigger"
            title="Sidebar Setup"
            onClick={() => setSidebarSetupOpen(true)}
          >
            <span aria-hidden="true">•••</span>
            <b>Sidebar Setup</b>
          </button>
          <span className="gx-rail-version">HRISHIKESH GAMING</span>
        </aside>

        {sidebarSetupOpen && (
          <div
            className="gx-sidebar-backdrop"
            onClick={() => {
              if (!sidebarSetupPinned) setSidebarSetupOpen(false)
            }}
          >
            <section
              className="gx-sidebar-setup"
              aria-label="Sidebar Setup"
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <header className="gx-sidebar-setup-head">
                <div>
                  <img src={browserMark} alt="" />
                  <strong>SIDEBAR SETUP</strong>
                </div>
                <span>
                  <button
                    type="button"
                    title="Restore sidebar defaults"
                    onClick={() => {
                      setSidebarSetup(sidebarSetupDefaults)
                      window.localStorage.setItem(
                        'hrishikesh-sidebar-setup',
                        JSON.stringify(sidebarSetupDefaults)
                      )
                    }}
                  >
                    ↻
                  </button>
                  <button
                    type="button"
                    title={sidebarSetupPinned ? 'Unpin panel' : 'Pin panel'}
                    aria-pressed={sidebarSetupPinned}
                    onClick={() => setSidebarSetupPinned((value) => !value)}
                  >
                    ♧
                  </button>
                  <button
                    type="button"
                    title="Close sidebar setup"
                    onClick={() => setSidebarSetupOpen(false)}
                  >
                    ×
                  </button>
                </span>
              </header>
              <div className="gx-sidebar-setup-scroll">
                <section className="gx-sidebar-setup-section">
                  <div className="gx-sidebar-section-title">WORKSPACES</div>
                  <div className="gx-sidebar-setup-card">
                    {sidebarWorkspaces.map((name, index) => {
                      const key = `workspace${index}`
                      return (
                        <div className="gx-sidebar-setup-row" key={`${name}-${index}`}>
                          <button
                            type="button"
                            className="gx-sidebar-open-item"
                            title={`Switch to ${name}`}
                            onClick={() => window.api.groupTab(name)}
                          >
                            <span>{index === 0 ? '⌂' : '♧'}</span>
                            {name}
                          </button>
                          <button
                            type="button"
                            className={`gx-setup-switch${sidebarSetup[key] ? ' active' : ''}`}
                            role="switch"
                            aria-checked={sidebarSetup[key]}
                            aria-label={`Show ${name}`}
                            onClick={() => updateSidebarSetup(key, !sidebarSetup[key])}
                          >
                            <i />
                          </button>
                        </div>
                      )
                    })}
                    <button
                      type="button"
                      className="gx-sidebar-add"
                      onClick={addSidebarWorkspace}
                      disabled={sidebarWorkspaces.length >= 8}
                    >
                      Add <b>＋</b>
                    </button>
                  </div>
                </section>
                {sidebarSections.map((section) => (
                  <section className="gx-sidebar-setup-section" key={section.title}>
                    <div className="gx-sidebar-section-title">{section.title}</div>
                    <div className="gx-sidebar-setup-card">
                      {(section.title === 'MESSENGERS' && !sidebarSetupExpanded
                        ? section.rows.slice(0, 3)
                        : section.rows
                      ).map(([key, icon, label]) => (
                        <div className="gx-sidebar-setup-row" key={key}>
                          <button
                            type="button"
                            className="gx-sidebar-open-item"
                            title={`Open ${label}`}
                            onClick={() => openSidebarItem(key)}
                          >
                            <span>{icon}</span>
                            {label}
                          </button>
                          <button
                            type="button"
                            className={`gx-setup-switch${sidebarSetup[key] ? ' active' : ''}`}
                            role="switch"
                            aria-checked={sidebarSetup[key]}
                            aria-label={`Show ${label} in sidebar`}
                            onClick={() => updateSidebarSetup(key, !sidebarSetup[key])}
                          >
                            <i />
                          </button>
                        </div>
                      ))}
                      {section.title === 'MESSENGERS' && (
                        <button
                          type="button"
                          className="gx-sidebar-show-more"
                          onClick={() => setSidebarSetupExpanded((value) => !value)}
                        >
                          {sidebarSetupExpanded ? 'Show less' : 'Show more'}⌄
                        </button>
                      )}
                    </div>
                  </section>
                ))}
                <section className="gx-sidebar-setup-section">
                  <div className="gx-sidebar-section-title">SIDEBAR EXTENSIONS</div>
                  <div className="gx-sidebar-setup-card">
                    {sidebarExtensions.map((item) => (
                      <div className="gx-sidebar-setup-row" key={item.url}>
                        <button
                          type="button"
                          className="gx-sidebar-open-item"
                          onClick={() => {
                            setSidebarSetupOpen(false)
                            navigate(item.url)
                          }}
                        >
                          <span>↗</span>
                          {item.name}
                        </button>
                        <button
                          type="button"
                          className="gx-setup-switch active"
                          role="switch"
                          aria-checked="true"
                          aria-label={`Remove ${item.name}`}
                          onClick={() => {
                            const next = sidebarExtensions.filter((entry) => entry.url !== item.url)
                            setSidebarExtensions(next)
                            window.localStorage.setItem(
                              'hrishikesh-sidebar-extensions',
                              JSON.stringify(next)
                            )
                          }}
                        >
                          <i />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="gx-sidebar-add"
                      onClick={addSidebarExtension}
                      disabled={sidebarExtensions.length >= 12}
                    >
                      Add <b>＋</b>
                    </button>
                  </div>
                </section>
                <section className="gx-sidebar-setup-section">
                  <div className="gx-sidebar-section-title">SETTINGS</div>
                  <div className="gx-sidebar-setup-card">
                    {[
                      ['showSidebar', 'Show sidebar'],
                      ['notifications', 'Enable notifications for messengers'],
                      ['gxMessengerIcons', 'Use GX style icons'],
                      ['centreIcons', 'Centre icons']
                    ].map(([key, label]) => (
                      <div className="gx-sidebar-setup-row" key={key}>
                        <span className="gx-sidebar-setting-label">{label}</span>
                        <button
                          type="button"
                          className={`gx-setup-switch${sidebarSetup[key] ? ' active' : ''}`}
                          role="switch"
                          aria-checked={sidebarSetup[key]}
                          aria-label={label}
                          onClick={() => updateSidebarSetup(key, !sidebarSetup[key])}
                        >
                          <i />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </section>
          </div>
        )}

        <aside className="gx-mission-panel" aria-label="Mission Control">
          <div className="gx-panel-heading">
            <div>
              <span className="gx-live-dot" />
              <span>MISSION CONTROL</span>
            </div>
            <small>HRX / 01</small>
          </div>
          <button
            className="gx-workspace-card"
            type="button"
            onClick={() => showHomeMenu('groups')}
          >
            <span className="gx-card-icon">▦</span>
            <span>
              <small>ACTIVE SPACE</small>
              <strong>{homeWorkspace}</strong>
            </span>
            <span className="gx-arrow">›</span>
          </button>
          <section className="gx-performance-card">
            <div className="gx-card-title">
              <span>LIVE PERFORMANCE</span>
              <button
                type="button"
                title="Open task manager"
                onClick={() => showHomeMenu('task-manager')}
              >
                •••
              </button>
            </div>
            <div className="gx-performance-meters">
              <GxMeter
                label="CPU LOAD"
                value={systemMetrics?.cpu || 0}
                display={systemMetrics ? systemMetrics.cpu.toFixed(0) : '--'}
                unit="%"
              />
              <GxMeter
                label="SYSTEM RAM"
                value={systemRamPercent}
                display={
                  systemMetrics ? (systemMetrics.memoryUsedBytes / 1024 ** 3).toFixed(1) : '--'
                }
                unit="GB"
              />
            </div>
            <div className="gx-process-foot">
              <span>
                {tabs.length} OPEN {tabs.length === 1 ? 'TAB' : 'TABS'}
              </span>
              <span>LIVE</span>
            </div>
          </section>
          <button
            className={`gx-boost-toggle${gamingBoost ? ' enabled' : ''}`}
            type="button"
            role="switch"
            aria-checked={gamingBoost}
            onClick={toggleGamingBoost}
          >
            <span className="gx-boost-icon">⚡</span>
            <span>
              <strong>Gaming Boost</strong>
              <small>
                {gamingBoost ? 'Background tabs stay active' : 'Background tabs save power'}
              </small>
            </span>
            <i className="gx-switch">
              <b />
            </i>
          </button>
          <div className="gx-privacy-status">
            <span className="gx-lock-icon">▣</span>
            <span>
              <strong>SCREEN SHIELD ACTIVE</strong>
              <small>Protected from screen capture</small>
            </span>
            <i />
          </div>
          <section className="gx-tool-box" aria-label="GX Control">
            <div className="gx-box-heading">
              <span>01 / GX CONTROL</span>
              <small>SYSTEM + TABS</small>
            </div>
            <section className="gx-system-readout" aria-label="Live system activity">
              <div className="gx-system-readout-heading">
                <span className="gx-live-dot" />
                <strong>LIVE SYSTEM TELEMETRY</strong>
              </div>
              <div className="gx-system-metrics-grid">
                <div className="gx-system-metric">
                  <small>SYSTEM CPU</small>
                  <GxMeter
                    label="CPU"
                    value={systemMetrics?.cpu || 0}
                    display={systemMetrics ? systemMetrics.cpu.toFixed(0) : '--'}
                    unit="%"
                  />
                </div>
                <div className="gx-system-metric">
                  <small>SYSTEM RAM</small>
                  <GxMeter
                    label="RAM"
                    value={systemRamPercent}
                    display={
                      systemMetrics ? (systemMetrics.memoryUsedBytes / 1024 ** 3).toFixed(1) : '--'
                    }
                    unit="GB"
                  />
                </div>
                <div className="gx-system-metric gx-network-speed-metric">
                  <small>LIVE NETWORK SPEED</small>
                  {systemMetrics?.networkSupported ? (
                    <>
                      <div className="gx-network-meter-pair">
                        <GxMeter
                          label="DOWNLOAD"
                          value={Math.min(
                            100,
                            (systemMetrics.downloadMbps / networkMeterScale) * 100
                          )}
                          display={systemMetrics.downloadMbps.toFixed(1)}
                          unit="Mbps"
                        />
                        <GxMeter
                          label="UPLOAD"
                          value={Math.min(
                            100,
                            (systemMetrics.uploadMbps / networkMeterScale) * 100
                          )}
                          display={systemMetrics.uploadMbps.toFixed(1)}
                          unit="Mbps"
                        />
                      </div>
                      <span className="gx-network-meter-scale">
                        METER RANGE · 0–{networkMeterScale} Mbps
                      </span>
                    </>
                  ) : (
                    <strong className="gx-system-metric-unavailable">
                      Network meter unavailable
                    </strong>
                  )}
                </div>
              </div>
              <small className="gx-system-source">
                Read from Windows system counters · updates every 2.5 seconds
              </small>
            </section>
            <div className="gx-control-line">
              <span>
                <strong>CPU limiter</strong>
                <small>Slow down page processing</small>
              </span>
              <button
                type="button"
                className={`gx-mini-switch${resourceControls.cpuEnabled ? ' active' : ''}`}
                role="switch"
                aria-checked={resourceControls.cpuEnabled}
                aria-label="CPU limiter"
                onClick={() => updateResourceControl('cpuEnabled', !resourceControls.cpuEnabled)}
              >
                <i />
              </button>
            </div>
            {resourceControls.cpuEnabled && (
              <label className="gx-range-setting">
                <span>
                  Slowdown <b>{resourceControls.cpuRate.toFixed(1)}×</b>
                </span>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="0.5"
                  value={resourceControls.cpuRate}
                  onChange={(event) => updateResourceControl('cpuRate', Number(event.target.value))}
                />
              </label>
            )}
            <div className="gx-control-line">
              <span>
                <strong>Network limiter</strong>
                <small>Download and upload cap</small>
              </span>
              <button
                type="button"
                className={`gx-mini-switch${resourceControls.networkEnabled ? ' active' : ''}`}
                role="switch"
                aria-checked={resourceControls.networkEnabled}
                aria-label="Network limiter"
                onClick={() =>
                  updateResourceControl('networkEnabled', !resourceControls.networkEnabled)
                }
              >
                <i />
              </button>
            </div>
            {resourceControls.networkEnabled && (
              <div className="gx-network-limits">
                <label>
                  Download{' '}
                  <input
                    aria-label="Download limit in megabits per second"
                    type="number"
                    min="0.1"
                    max="100"
                    step="0.1"
                    value={resourceControls.downloadMbps}
                    onChange={(event) =>
                      updateResourceControl('downloadMbps', Number(event.target.value))
                    }
                  />
                  <small>Mbps</small>
                </label>
                <label>
                  Upload{' '}
                  <input
                    aria-label="Upload limit in megabits per second"
                    type="number"
                    min="0.1"
                    max="100"
                    step="0.1"
                    value={resourceControls.uploadMbps}
                    onChange={(event) =>
                      updateResourceControl('uploadMbps', Number(event.target.value))
                    }
                  />
                  <small>Mbps</small>
                </label>
              </div>
            )}
            <div className="gx-limit-divider" />
            <div className="gx-control-line">
              <span>
                <strong>CPU hot-tab guard</strong>
                <small>Close inactive tab above {cpuGuardLimit}%</small>
              </span>
              <button
                type="button"
                className={`gx-mini-switch${cpuGuardEnabled ? ' active' : ''}`}
                role="switch"
                aria-checked={cpuGuardEnabled}
                aria-label="CPU hot-tab guard"
                onClick={() => toggleHotTabGuard('cpu', !cpuGuardEnabled)}
              >
                <i />
              </button>
            </div>
            {cpuGuardEnabled && (
              <label className="gx-range-setting">
                <span>
                  CPU trip point <b>{cpuGuardLimit}%</b>
                </span>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={cpuGuardLimit}
                  onChange={(event) => setCpuGuardLimit(Number(event.target.value))}
                />
              </label>
            )}
            <div className="gx-control-line">
              <span>
                <strong>RAM guard</strong>
                <small>Close inactive tabs above limit</small>
              </span>
              <button
                type="button"
                className={`gx-mini-switch${ramGuardEnabled ? ' active' : ''}`}
                role="switch"
                aria-checked={ramGuardEnabled}
                aria-label="RAM guard"
                onClick={() => toggleHotTabGuard('ram', !ramGuardEnabled)}
              >
                <i />
              </button>
            </div>
            <label className="gx-range-setting">
              <span>
                RAM soft limit <b>{ramGuardLimit} MB</b>
              </span>
              <input
                type="range"
                min="512"
                max="8192"
                step="256"
                value={ramGuardLimit}
                onChange={(event) => setRamGuardLimit(Number(event.target.value))}
              />
            </label>
            <div className="gx-guard-meter">
              <div className="gx-guard-meter-heading">
                <span>TAB MEMORY</span>
                <strong>
                  {homeMemoryMb} <small>/ {ramGuardLimit} MB</small>
                </strong>
              </div>
              <div
                className="gx-guard-meter-track"
                role="meter"
                aria-label={`Tab memory uses ${homeMemoryMb} of ${ramGuardLimit} megabytes`}
                aria-valuemin="0"
                aria-valuemax={ramGuardLimit}
                aria-valuenow={homeMemoryMb}
              >
                <i style={{ width: `${Math.min(100, (homeMemoryMb / ramGuardLimit) * 100)}%` }} />
              </div>
              <small>{Math.round((homeMemoryMb / ramGuardLimit) * 100)}% of soft limit</small>
            </div>
            <div className="gx-hot-tab-actions">
              <button
                type="button"
                disabled={!tabProcesses.some((row) => row.id !== activeTabId)}
                onClick={() => closeHottestTab('cpu')}
              >
                Close hottest CPU tab
              </button>
              <button
                type="button"
                disabled={!tabProcesses.some((row) => row.id !== activeTabId)}
                onClick={() => closeHottestTab('ram')}
              >
                Close largest RAM tab
              </button>
            </div>
            <div className="gx-thermal-status">
              <span>
                OPEN TABS · CPU {homeCpu.toFixed(1)}% · RAM {homeMemoryMb} MB
              </span>
              <span>
                {systemMetrics?.temperatureC != null
                  ? `ACPI sensor ${systemMetrics.temperatureC.toFixed(1)}°C`
                  : 'Device temperature sensor unavailable'}
              </span>
            </div>
            {resourceNotice && <p className="gx-control-notice">{resourceNotice}</p>}
            {guardNotice && <p className="gx-control-notice">{guardNotice}</p>}
            <p className="gx-capability-note">
              RAM guard is a soft tab limit, not a physical memory cap. CPU control slows page work,
              not the whole computer. Temperature sensors are unavailable here.
            </p>
          </section>

          <section className="gx-tool-box" aria-label="System VPN">
            <div className="gx-box-heading">
              <span>02 / SYSTEM VPN</span>
              <button
                type="button"
                className="gx-vpn-refresh"
                title="Refresh VPN profiles"
                onClick={() =>
                  window.api.getVpnProfiles().then((result) => result && setVpnData(result))
                }
              >
                ↻
              </button>
            </div>
            <p className="gx-cleaner-intro">
              Uses VPN profiles already configured in Windows and routes the whole device through
              them.
            </p>
            {!vpnData.supported ? (
              <p className="gx-control-notice">System VPN controls are available on Windows.</p>
            ) : vpnData.profiles.length ? (
              <div className="gx-vpn-profiles">
                {vpnData.profiles.map((profile) => (
                  <div className="gx-vpn-profile" key={profile.name}>
                    <span>
                      <strong>{profile.name}</strong>
                      <small>
                        {profile.status} · {profile.server || profile.tunnel || 'Windows profile'}
                      </small>
                    </span>
                    <button
                      type="button"
                      disabled={Boolean(vpnBusy)}
                      onClick={() => runVpnAction(profile)}
                    >
                      {vpnBusy === profile.name
                        ? 'Wait…'
                        : profile.status === 'Connected'
                          ? 'Disconnect'
                          : 'Connect'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="gx-control-notice">
                No Windows VPN profile found. Add a provider/profile in Windows first.
              </p>
            )}
            <button
              type="button"
              className="gx-vpn-settings-button"
              onClick={() => window.api.openVpnSettings()}
            >
              Open Windows VPN settings ↗
            </button>
            {vpnNotice && <p className="gx-control-notice">{vpnNotice}</p>}
          </section>

          <section className="gx-tool-box" aria-label="Shaders">
            <div className="gx-box-heading">
              <span>03 / SHADERS</span>
              <small>PAGE FX</small>
            </div>
            <p className="gx-cleaner-intro">
              Display filters apply to this browser’s open pages and stay selected after restart.
            </p>
            <div className="gx-shader-options" role="radiogroup" aria-label="Page display effect">
              {shaderEffects.map((effect) => (
                <button
                  type="button"
                  key={effect.id}
                  role="radio"
                  aria-checked={shaderEffect === effect.id}
                  className={`gx-shader-option${shaderEffect === effect.id ? ' active' : ''}`}
                  onClick={() => updateShaderEffect(effect.id)}
                >
                  <span className={`gx-shader-swatch gx-shader-${effect.id}`} />
                  <strong>{effect.name}</strong>
                  <i />
                </button>
              ))}
            </div>
          </section>

          <section className="gx-tool-box" aria-label="GC Cleaner">
            <div className="gx-box-heading">
              <span>04 / GC CLEANER</span>
              <small>
                {cleanupStats
                  ? `${(cleanupStats.cacheBytes / (1024 * 1024)).toFixed(0)} MB CACHE`
                  : 'SCANNING'}
              </small>
            </div>
            <p className="gx-cleaner-intro">
              Choose what to clear. This only cleans Hrishikesh browser data.
            </p>
            <div className="gx-cleaner-presets" role="group" aria-label="Cleanup level">
              {[
                ['min', 'MIN'],
                ['med', 'MED'],
                ['max', 'MAX']
              ].map(([preset, label]) => (
                <button
                  type="button"
                  key={preset}
                  aria-pressed={cleanerPreset === preset}
                  className={cleanerPreset === preset ? 'active' : ''}
                  onClick={() => applyCleanerPreset(preset)}
                >
                  {label}
                </button>
              ))}
            </div>
            {[
              ['cache', 'Cache', `${(cleanupStats?.cacheBytes ?? 0) / (1024 * 1024)} MB`],
              ['cookies', 'Cookies & site data', 'May sign you out'],
              ['tabs', 'Open tabs', `${cleanupStats?.tabCount ?? tabs.length} tabs`],
              ['history', 'Browser history', `${cleanupStats?.historyCount ?? 0} entries`],
              ['downloads', 'Downloads list', 'Downloaded files stay on disk']
            ].map(([key, label, detail]) => (
              <div className="gx-cleaner-row" key={key}>
                <span>
                  <strong>{label}</strong>
                  <small>{detail}</small>
                </span>
                <button
                  type="button"
                  className={`gx-mini-switch${cleanerSettings[key] ? ' active' : ''}`}
                  role="switch"
                  aria-checked={cleanerSettings[key]}
                  aria-label={`Clear ${label}`}
                  onClick={() => updateCleanerSetting(key, !cleanerSettings[key])}
                >
                  <i />
                </button>
              </div>
            ))}
            {cleanerConfirm ? (
              <div className="gx-cleaner-confirm">
                <p>
                  Cookies may sign you out; selected tabs and history will be cleared. Continue?
                </p>
                <button type="button" onClick={runSelectedCleanup}>
                  Confirm clean
                </button>
                <button type="button" onClick={() => setCleanerConfirm(false)}>
                  Cancel
                </button>
              </div>
            ) : (
              <button
                className="gx-cleaner-start"
                type="button"
                disabled={!Object.values(cleanerSettings).some(Boolean)}
                onClick={() => setCleanerConfirm(true)}
              >
                Start cleaning
              </button>
            )}
            {cleanerNotice && <p className="gx-control-notice">{cleanerNotice}</p>}
          </section>

          <details className="gx-tool-box gx-advanced-setup">
            <summary>05 / ADVANCED SETUP · SIDEBAR ICONS</summary>
            {[
              ['home', 'Home'],
              ['games', 'Games'],
              ['stream', 'Stream'],
              ['spaces', 'Spaces'],
              ['saved', 'Saved'],
              ['history', 'History'],
              ['settings', 'Settings']
            ].map(([key, label]) => (
              <div className="gx-cleaner-row" key={key}>
                <span>
                  <strong>{label}</strong>
                  <small>Show in navigation rail</small>
                </span>
                <button
                  type="button"
                  className={`gx-mini-switch${sidebarVisibility[key] ? ' active' : ''}`}
                  role="switch"
                  aria-checked={sidebarVisibility[key]}
                  aria-label={`Show ${label} sidebar icon`}
                  onClick={() => updateSidebarVisibility(key, !sidebarVisibility[key])}
                >
                  <i />
                </button>
              </div>
            ))}
          </details>
          <div className="gx-panel-footer">
            <span>HRISHIKESH GAMING</span>
            <span>{appVersion ? `v${appVersion}` : 'SECURE SESSION'}</span>
          </div>
        </aside>

        <section className="welcome-panel">
          <div className="home-brand-logo">
            <img className="home-wordmark-image" src={homeWordmark} alt="hrishikesh" />
          </div>
          <form className="home-search" onSubmit={(event) => submitSearch(event, homeQuery)}>
            <span className="home-search-icon" aria-hidden="true">
              ⌕
            </span>
            <input
              value={homeQuery}
              onChange={(event) => {
                setHomeQuery(event.target.value)
                setAddressQuery('')
                setActiveAddressSuggestion(-1)
              }}
              onFocus={() => {
                setAddressQuery('')
                setAddressSuggestionsOpen(false)
                setHomeSuggestionsOpen(true)
                setActiveAddressSuggestion(-1)
                window.api.getHistory().then(setHistoryEntries)
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown' && homeSuggestionsOpen && addressSuggestions.length) {
                  event.preventDefault()
                  setActiveAddressSuggestion((index) => (index + 1) % addressSuggestions.length)
                } else if (
                  event.key === 'ArrowUp' &&
                  homeSuggestionsOpen &&
                  addressSuggestions.length
                ) {
                  event.preventDefault()
                  setActiveAddressSuggestion((index) =>
                    index <= 0 ? addressSuggestions.length - 1 : index - 1
                  )
                } else if (event.key === 'Escape' && homeSuggestionsOpen) {
                  event.preventDefault()
                  setHomeSuggestionsOpen(false)
                } else if (event.key === 'Enter' && addressSuggestions[activeAddressSuggestion]) {
                  event.preventDefault()
                  chooseAddressSuggestion(addressSuggestions[activeAddressSuggestion])
                }
              }}
              placeholder="Dil ka khoya hua bhi mil jayega (shayad)... pehle type toh kar 💔"
              aria-label="Search or type a web address"
            />
            <button
              type="button"
              className="home-lens-button"
              aria-label="Search with an image using Google Lens"
              title="Search with an image"
              onClick={() => navigate('https://lens.google.com/')}
            >
              ◉
            </button>
            <button type="submit" aria-label="Search">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="10.8" cy="10.8" r="6.5" />
                <path d="m16 16 4.5 4.5" />
              </svg>
            </button>
            {homeSuggestionsOpen && hasAddressHistory && addressSuggestions.length > 0 && (
              <div
                className="address-suggestions home-address-suggestions"
                role="listbox"
                aria-label="Search suggestions"
              >
                {addressSuggestions.map((suggestion, index) => (
                  <button
                    className={`address-suggestion${index === activeAddressSuggestion ? ' active' : ''}`}
                    type="button"
                    role="option"
                    aria-selected={index === activeAddressSuggestion}
                    key={
                      suggestion.kind === 'search' ? 'home-search-query' : `home-${suggestion.url}`
                    }
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActiveAddressSuggestion(index)}
                    onClick={() => chooseAddressSuggestion(suggestion)}
                  >
                    <span className="address-suggestion-icon" aria-hidden="true">
                      {suggestion.kind === 'search' ? '⌕' : '◷'}
                    </span>
                    <span className="address-suggestion-copy">
                      <strong>{suggestion.title}</strong>
                      {suggestion.kind === 'page' && <small>{suggestion.url}</small>}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </form>
          <div className="home-action-cards" aria-label="Quick actions">
            <button type="button" className="home-action-card" onClick={openHrxAi}>
              <span className="home-action-icon hrx-ai-mark" aria-hidden="true">
                H
              </span>
              <span>
                <strong>Hrishikesh AI</strong>
                <small>Your private, local AI workspace</small>
              </span>
            </button>
            <button
              type="button"
              className="home-action-card"
              onClick={() => navigate('https://lens.google.com/')}
            >
              <span className="home-action-icon lens-mark" aria-hidden="true">
                ⌕
              </span>
              <span>
                <strong>Search by image</strong>
                <small>Find things from a photo</small>
              </span>
            </button>
          </div>
        </section>

        <section className="quick-access" aria-label="Shortcuts">
          <div className="shortcut-grid">
            {homeShortcuts.map((item) => (
              <div className="shortcut-item" key={item.url}>
                <button
                  className="shortcut-card"
                  title={item.name}
                  aria-label={item.name}
                  onClick={() => navigate(item.url)}
                >
                  <span className={'shortcut-symbol ' + (item.tone || 'custom') + ''}>
                    {item.tone && item.tone !== 'custom' ? (
                      <ShortcutLogo name={item.name} />
                    ) : (
                      item.name.charAt(0).toUpperCase()
                    )}
                  </span>
                  <span className="shortcut-name">{item.name}</span>
                </button>
                <button
                  className="shortcut-menu-trigger"
                  type="button"
                  aria-label={'Shortcut options for ' + item.name}
                  aria-expanded={shortcutMenuUrl === item.url}
                  title="Shortcut options"
                  onClick={() =>
                    setShortcutMenuUrl((current) => (current === item.url ? '' : item.url))
                  }
                >
                  ⋯
                </button>
                {shortcutMenuUrl === item.url && (
                  <div className="shortcut-menu" role="menu">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setEditShortcutName(item.name)
                        setEditShortcutAddress(item.url)
                        setEditingShortcutUrl(item.url)
                        setShortcutMenuUrl('')
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        persistShortcuts(homeShortcuts.filter((site) => site.url !== item.url))
                        setShortcutMenuUrl('')
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
                {editingShortcutUrl === item.url && (
                  <form
                    className="shortcut-edit-form"
                    onSubmit={(event) => {
                      event.preventDefault()
                      const name = editShortcutName.trim()
                      let address = editShortcutAddress.trim()
                      if (!name || !address) return
                      if (!/^https?:\/\//i.test(address)) address = 'https://' + address
                      try {
                        const parsed = new URL(address)
                        if (
                          parsed.protocol !== 'https:' ||
                          homeShortcuts.some(
                            (site) => site.url === parsed.href && site.url !== item.url
                          )
                        )
                          return
                        persistShortcuts(
                          homeShortcuts.map((site) =>
                            site.url === item.url
                              ? {
                                  ...site,
                                  name: name.slice(0, 20),
                                  url: parsed.href,
                                  tone: parsed.href === item.url ? site.tone : 'custom'
                                }
                              : site
                          )
                        )
                        setEditingShortcutUrl('')
                      } catch {
                        return
                      }
                    }}
                  >
                    <input
                      aria-label="Edit shortcut name"
                      maxLength="20"
                      required
                      value={editShortcutName}
                      onChange={(event) => setEditShortcutName(event.target.value)}
                    />
                    <input
                      aria-label="Edit website address"
                      required
                      value={editShortcutAddress}
                      onChange={(event) => setEditShortcutAddress(event.target.value)}
                    />
                    <button type="submit">Save</button>
                    <button type="button" onClick={() => setEditingShortcutUrl('')}>
                      Cancel
                    </button>
                  </form>
                )}
              </div>
            ))}
            <button
              className="shortcut-add-tile"
              type="button"
              disabled={homeShortcuts.length >= 20}
              title={homeShortcuts.length >= 20 ? 'Maximum 20 shortcuts' : 'Add shortcut'}
              aria-label="Add shortcut"
              onClick={() => {
                setShortcutName('')
                setShortcutUrl('')
                setShortcutFormError('')
                setShowShortcutForm(true)
              }}
            >
              <span className="shortcut-add-icon">+</span>
              <span className="shortcut-name">Add shortcut</span>
            </button>
          </div>
        </section>

        {showShortcutForm && (
          <div
            className="shortcut-modal-backdrop"
            role="presentation"
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) setShowShortcutForm(false)
            }}
          >
            <form
              className="shortcut-add-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="shortcut-modal-title"
              onSubmit={(event) => {
                event.preventDefault()
                const name = shortcutName.trim()
                let address = shortcutUrl.trim()
                if (!name || !address || homeShortcuts.length >= 20) return
                if (!/^https?:\/\//i.test(address)) address = 'https://' + address
                try {
                  const parsed = new URL(address)
                  if (parsed.protocol !== 'https:') {
                    setShortcutFormError('Use a secure HTTPS website address.')
                    return
                  }
                  if (homeShortcuts.some((site) => site.url === parsed.href)) {
                    setShortcutFormError('This website is already in your shortcuts.')
                    return
                  }
                  const newShortcut = {
                    name: name.slice(0, 20),
                    url: parsed.href,
                    tone: 'custom'
                  }
                  const nextShortcuts = [...homeShortcuts, newShortcut]
                  persistShortcuts(nextShortcuts)
                  setShortcutName('')
                  setShortcutUrl('')
                  setShowShortcutForm(false)
                } catch {
                  setShortcutFormError('Enter a valid website address.')
                  return
                }
              }}
            >
              <h2 id="shortcut-modal-title">Add shortcut</h2>
              <label>
                Name
                <input
                  autoFocus
                  aria-label="Shortcut name"
                  placeholder="Name"
                  maxLength="20"
                  required
                  value={shortcutName}
                  onChange={(event) => {
                    setShortcutName(event.target.value)
                    setShortcutFormError('')
                  }}
                />
              </label>
              <label>
                URL
                <input
                  aria-label="Shortcut website"
                  placeholder="Website address"
                  required
                  value={shortcutUrl}
                  onChange={(event) => {
                    setShortcutUrl(event.target.value)
                    setShortcutFormError('')
                  }}
                />
              </label>
              {shortcutFormError && <p className="shortcut-modal-error">{shortcutFormError}</p>}
              <div className="shortcut-modal-actions">
                <button
                  type="button"
                  className="shortcut-modal-cancel"
                  onClick={() => setShowShortcutForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="shortcut-modal-done"
                  disabled={
                    !shortcutName.trim() || !shortcutUrl.trim() || homeShortcuts.length >= 20
                  }
                >
                  Done
                </button>
              </div>
            </form>
          </div>
        )}

        {showCustomizer && (
          <section className="customizer-panel" aria-label="Appearance and theme settings">
            <div className="customizer-heading">
              <div>
                <h2>HRX Theme Lab</h2>
              </div>
              <button
                type="button"
                className="customizer-close"
                aria-label="Close themes"
                onClick={() => setShowCustomizer(false)}
              >
                ×
              </button>
            </div>
            <div className="theme-grid">
              {themes.map((theme) => (
                <button
                  className={`theme-choice${activeTheme.name === theme.name ? ' selected' : ''}`}
                  type="button"
                  key={theme.name}
                  aria-pressed={activeTheme.name === theme.name}
                  onClick={() => setActiveTheme(theme)}
                >
                  <span
                    className="theme-preview"
                    style={{ background: theme.background, borderColor: theme.border }}
                  >
                    <span style={{ background: theme.panel }}></span>
                    <i style={{ background: theme.accent }}></i>
                  </span>
                  <span>{theme.name}</span>
                </button>
              ))}
            </div>
            <div className="custom-colors">
              <div>
                <h3>Make your own</h3>
                <p>Choose your own background, card, and accent colors.</p>
              </div>
              <label>
                Background{' '}
                <input
                  type="color"
                  value={customBackground}
                  onChange={(event) => setCustomBackground(event.target.value)}
                />
              </label>
              <label>
                Cards{' '}
                <input
                  type="color"
                  value={customPanel}
                  onChange={(event) => setCustomPanel(event.target.value)}
                />
              </label>
              <label>
                Accent{' '}
                <input
                  type="color"
                  value={customAccent}
                  onChange={(event) => setCustomAccent(event.target.value)}
                />
              </label>
              <label className="photo-picker">
                Background photo
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    event.target.value = ''
                    if (!file) return
                    if (file.size > 5 * 1024 * 1024) {
                      setSaveMessage('Choose an image smaller than 5 MB.')
                      return
                    }
                    const reader = new FileReader()
                    reader.onload = () => {
                      if (typeof reader.result === 'string') {
                        setBackgroundPhoto(reader.result)
                        setSaveMessage('Photo selected. Save to keep it on this device.')
                      }
                    }
                    reader.readAsDataURL(file)
                  }}
                />
              </label>
              {backgroundPhoto && (
                <div className="photo-controls">
                  <label>
                    Zoom <output>{photoZoom}%</output>
                    <input
                      type="range"
                      min="100"
                      max="200"
                      value={photoZoom}
                      onChange={(event) => setPhotoZoom(Number(event.target.value))}
                    />
                  </label>
                  <label>
                    Left / right <output>{photoX}%</output>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={photoX}
                      onChange={(event) => setPhotoX(Number(event.target.value))}
                    />
                  </label>
                  <label>
                    Up / down <output>{photoY}%</output>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={photoY}
                      onChange={(event) => setPhotoY(Number(event.target.value))}
                    />
                  </label>
                  <label>
                    Brightness <output>{photoBrightness}%</output>
                    <input
                      type="range"
                      min="60"
                      max="120"
                      value={photoBrightness}
                      onChange={(event) => setPhotoBrightness(Number(event.target.value))}
                    />
                  </label>
                </div>
              )}
              {backgroundPhoto && (
                <button
                  className="remove-photo"
                  type="button"
                  onClick={() => setBackgroundPhoto('')}
                >
                  Remove photo
                </button>
              )}
              <button className="apply-custom-theme" type="button" onClick={applyCustomTheme}>
                Apply custom theme
              </button>
              <button
                className="save-appearance"
                type="button"
                onClick={async () => {
                  try {
                    const result = await window.api.savePreferences({
                      theme: activeTheme,
                      customBackground,
                      customPanel,
                      customAccent,
                      backgroundPhoto,
                      photoZoom,
                      photoX,
                      photoY,
                      photoBrightness,
                      showBookmarksBar,
                      shortcuts: homeShortcuts,
                      bookmarks,
                      readingList
                    })
                    setSaveMessage(
                      result?.ok ? 'Saved on this device.' : 'Could not save. Try again.'
                    )
                    if (result?.ok) setShowCustomizer(false)
                  } catch {
                    setSaveMessage('Could not save. Try again.')
                  }
                }}
              >
                Save
              </button>
              {saveMessage && (
                <span className="save-message" role="status">
                  {saveMessage}
                </span>
              )}
            </div>
          </section>
        )}
        {accountPageTabId === activeTabId && accountPageTabId !== null && (
          <section className="hrx-account-page" aria-label="Hrishikesh Account sign in">
            <button
              className="hrx-account-close"
              type="button"
              aria-label="Close Hrishikesh Account"
              onClick={() => setAccountPageTabId(null)}
            >
              ×
            </button>
            <div className="hrx-account-brand">
              <img src={browserMark} alt="" />
              <span>HRISHIKESH</span>
              <i>ACCOUNT</i>
            </div>
            <form
              className="hrx-account-card"
              onSubmit={(event) => {
                event.preventDefault()
                setAccountConnectMessage(
                  'Account service will be connected with the other sign-in options later. Your email was not sent.'
                )
              }}
            >
              <div className="hrx-account-card-brand">HRX</div>
              <h1>Let’s start with your email</h1>
              <p>Use one Hrishikesh Account across your browser devices.</p>
              <label htmlFor="hrx-account-email">Email</label>
              <input
                id="hrx-account-email"
                autoComplete="email"
                type="email"
                placeholder="Email address"
                value={accountEmail}
                onChange={(event) => {
                  setAccountEmail(event.target.value)
                  setAccountConnectMessage('')
                }}
                required
              />
              <button className="hrx-account-continue" type="submit">
                Continue
              </button>
              <div className="hrx-account-divider">
                <span>or continue with</span>
              </div>
              <div className="hrx-account-providers">
                {['Google', 'Facebook', 'Apple'].map((provider) => (
                  <button
                    type="button"
                    key={provider}
                    onClick={() =>
                      setAccountConnectMessage(
                        `${provider} sign-in will be connected when account services are set up.`
                      )
                    }
                  >
                    {provider}
                  </button>
                ))}
              </div>
              {accountConnectMessage && (
                <p className="hrx-account-connect-message" role="status">
                  {accountConnectMessage}
                </p>
              )}
              <small className="hrx-account-local-note">
                Sign-in options are ready for connection. Your browser data stays on this device
                until account sync is set up.
              </small>
            </form>
          </section>
        )}
        {helpPageTabId === activeTabId && helpPageTabId !== null && (
          <section className="hrx-help-page" aria-labelledby="hrx-help-title">
            <header className="hrx-help-topbar">
              <div className="hrx-help-brand">
                <img src={browserMark} alt="" />
                <span>HRISHIKESH</span>
                <i>SUPPORT SYSTEM</i>
              </div>
              <button
                className="hrx-help-close"
                type="button"
                aria-label="Close Help Center"
                onClick={() => setHelpPageTabId(null)}
              >
                × <span>Back to browser</span>
              </button>
            </header>
            <div className="hrx-help-content">
              <div className="hrx-help-heading">
                <span className="hrx-help-eyebrow">HRX / FIELD GUIDE 01</span>
                <h1 id="hrx-help-title">Help Center</h1>
                <p>Everything you need to get around Hrishikesh Browser, all in one place.</p>
                <button
                  type="button"
                  onClick={() => {
                    setHelpPageTabId(null)
                    setIssueReportText('')
                    setIssueReportNotice('')
                    showBrowserMenuView('report-issue')
                  }}
                >
                  Report a problem <span>↗</span>
                </button>
              </div>
              <div className="hrx-help-grid">
                <article className="hrx-help-card">
                  <span>01 / BROWSING</span>
                  <h2>Search and move around</h2>
                  <p>
                    Type a question or phrase in the address bar to search Google. Enter a website
                    address to open it directly. The arrows go back and forward, Reload refreshes
                    the page, and the HRX mark returns to Home.
                  </p>
                  <kbd>New tab Ctrl+T · Find Ctrl+F</kbd>
                </article>
                <article className="hrx-help-card">
                  <span>02 / HOME SETUP</span>
                  <h2>Make Home yours</h2>
                  <p>
                    Open appearance settings to choose a theme, set a background photo, and arrange
                    shortcuts. Save your changes to keep them on this device.
                  </p>
                  <kbd>New window Ctrl+N</kbd>
                </article>
                <article className="hrx-help-card">
                  <span>03 / LIBRARY</span>
                  <h2>Bookmarks and downloads</h2>
                  <p>
                    Save useful pages with the bookmark control. Use the HRX Menu to open bookmarks,
                    recent history, and downloads for this browser profile.
                  </p>
                  <kbd>History Ctrl+H · Downloads Ctrl+J</kbd>
                </article>
                <article className="hrx-help-card">
                  <span>04 / PROFILE</span>
                  <h2>Accounts and saved data</h2>
                  <p>
                    Your browser settings, shortcuts, and bookmarks stay on this device. Hrishikesh
                    Account sign-in and cross-device sync are not connected yet. Website accounts
                    are separate from an Hrishikesh account.
                  </p>
                  <kbd>Incognito Ctrl+Shift+N</kbd>
                </article>
                <article className="hrx-help-card">
                  <span>05 / PERFORMANCE</span>
                  <h2>Read the gaming meters</h2>
                  <p>
                    CPU and memory meters show current system readings. Download and upload meters
                    show live network traffic; they can sit near zero when the connection is idle.
                    CPU slowdown affects page processing. The RAM guard uses a soft tab limit.
                  </p>
                  <kbd>Open GX Control from the side rail</kbd>
                </article>
                <article className="hrx-help-card">
                  <span>06 / TROUBLESHOOTING</span>
                  <h2>A page will not open</h2>
                  <p>
                    Check the address and internet connection, then Reload. Try another site to see
                    if the connection is working. If only one site fails, it may be temporarily
                    unavailable.
                  </p>
                  <kbd>Reload Ctrl+R</kbd>
                </article>
                <article className="hrx-help-card">
                  <span>07 / SHORTCUTS</span>
                  <h2>Useful keyboard controls</h2>
                  <p>
                    Open tabs and windows, find text on a page, print, or adjust zoom without
                    leaving the keyboard.
                  </p>
                  <kbd>Print Ctrl+P · Zoom Ctrl + / − · Reset Ctrl+0</kbd>
                </article>
                <article className="hrx-help-card">
                  <span>08 / CONNECTED SITES</span>
                  <h2>Websites and services</h2>
                  <p>
                    Websites and services opened in Hrishikesh are provided by their own operators.
                    Their sign-in, content, and privacy choices are handled on those services. Check
                    a site’s own information before sharing personal details.
                  </p>
                  <kbd>Google Lens · HRX AI · Mail providers</kbd>
                </article>
              </div>
              <footer className="hrx-help-footer">
                <span>HRX HELP / MADE FOR HRISHIKESH</span>
                <span>Guides will grow as more browser features are added.</span>
              </footer>
            </div>
          </section>
        )}
        {modsPageTabId === activeTabId && modsPageTabId !== null && (
          <section className="hrx-mods-page" aria-labelledby="hrx-mods-title">
            <header className="hrx-mods-topbar">
              <div className="hrx-mods-brand">
                <img src={browserMark} alt="" />
                <span>HRX</span>
                <i>MOD LAB</i>
              </div>
              <button
                type="button"
                className="hrx-mods-close"
                onClick={() => setModsPageTabId(null)}
              >
                × <span>Back to browser</span>
              </button>
            </header>
            <div className="hrx-mods-content">
              <div className="hrx-mods-hero">
                <span className="hrx-mods-kicker">PERSONALIZE YOUR BROWSER / 01</span>
                <h1 id="hrx-mods-title">
                  Build your own <em>system.</em>
                </h1>
                <p>Install a look, tune the interface, and save your own combinations locally.</p>
                <div className="hrx-mods-status">
                  <span className="hrx-mods-live-dot" /> CURRENT BUILD <b>{activeTheme.name}</b>
                  <small>{shaderEffects.find((item) => item.id === shaderEffect)?.name}</small>
                </div>
              </div>

              <section className="hrx-mods-section" aria-labelledby="hrx-mod-store-title">
                <div className="hrx-mods-section-heading">
                  <div>
                    <span>01 / READY TO APPLY</span>
                    <h2 id="hrx-mod-store-title">Mod library</h2>
                  </div>
                  <small>Applies instantly · saved on this device</small>
                </div>
                <div className="hrx-mods-library">
                  {[
                    {
                      id: 'neon-circuit',
                      name: 'Neon Circuit',
                      detail: 'Electric cyan · fast contrast',
                      theme: 'Cyber',
                      effect: 'shiftfx',
                      color: '#13d9e8'
                    },
                    {
                      id: 'redline',
                      name: 'Redline Protocol',
                      detail: 'Hot red · deep black',
                      theme: 'Hrishikesh Gaming',
                      effect: 'boostfx',
                      color: '#ff3158'
                    },
                    {
                      id: 'night-ops',
                      name: 'Night Ops',
                      detail: 'Violet shadows · calm glow',
                      theme: 'Midnight',
                      effect: 'midnightfx',
                      color: '#9a83ff'
                    },
                    {
                      id: 'mono-core',
                      name: 'Mono Core',
                      detail: 'Clean grayscale · focused',
                      theme: 'Graphite',
                      effect: 'monocore',
                      color: '#abb5c8'
                    },
                    {
                      id: 'dual-pulse',
                      name: 'Dual Pulse',
                      detail: 'Split tone · vivid edges',
                      theme: 'Neon',
                      effect: 'duofx',
                      color: '#c5ef4a'
                    },
                    {
                      id: 'soft-landing',
                      name: 'Soft Landing',
                      detail: 'Warm neutral · low glare',
                      theme: 'Mocha',
                      effect: 'fadefx',
                      color: '#d6a17d'
                    }
                  ].map((mod) => (
                    <article
                      className="hrx-mod-card"
                      key={mod.id}
                      style={{ '--mod-color': mod.color }}
                    >
                      <div className="hrx-mod-art">
                        <span>HRX</span>
                        <i />
                        <b>{mod.effect.toUpperCase()}</b>
                      </div>
                      <div className="hrx-mod-card-info">
                        <h3>{mod.name}</h3>
                        <p>{mod.detail}</p>
                        <button type="button" onClick={() => applyMod(mod)}>
                          Apply mod <span>↗</span>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section
                className="hrx-mods-section hrx-mods-create-section"
                aria-labelledby="hrx-mod-create-title"
              >
                <div className="hrx-mods-section-heading">
                  <div>
                    <span>02 / YOUR DESIGN</span>
                    <h2 id="hrx-mod-create-title">Create a mod</h2>
                  </div>
                  <small>Mix a theme with an effect</small>
                </div>
                <form className="hrx-mod-create" onSubmit={saveUserMod}>
                  <label>
                    Mod name
                    <input
                      value={modDraftName}
                      maxLength={28}
                      onChange={(event) => setModDraftName(event.target.value)}
                      placeholder="e.g. Hrishi night run"
                      required
                    />
                  </label>
                  <label>
                    Color system
                    <select
                      value={modDraftTheme}
                      onChange={(event) => setModDraftTheme(event.target.value)}
                    >
                      {themes.map((theme) => (
                        <option key={theme.name} value={theme.name}>
                          {theme.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Visual effect
                    <select
                      value={modDraftEffect}
                      onChange={(event) => setModDraftEffect(event.target.value)}
                    >
                      {shaderEffects.map((effect) => (
                        <option key={effect.id} value={effect.id}>
                          {effect.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button type="submit">
                    Save to My Mods <span>＋</span>
                  </button>
                </form>
              </section>

              <section className="hrx-mods-section" aria-labelledby="hrx-my-mods-title">
                <div className="hrx-mods-section-heading">
                  <div>
                    <span>03 / LOCAL COLLECTION</span>
                    <h2 id="hrx-my-mods-title">
                      My mods <small>{userMods.length}</small>
                    </h2>
                  </div>
                  <small>Stored in this browser profile</small>
                </div>
                {userMods.length ? (
                  <div className="hrx-user-mod-list">
                    {userMods.map((mod) => (
                      <article key={mod.id}>
                        <span className="hrx-user-mod-mark">✳</span>
                        <div>
                          <strong>{mod.name}</strong>
                          <small>
                            {mod.theme} /{' '}
                            {shaderEffects.find((item) => item.id === mod.effect)?.name || 'None'}
                          </small>
                        </div>
                        <button type="button" onClick={() => applyMod(mod)}>
                          Apply
                        </button>
                        <button
                          className="hrx-remove-mod"
                          type="button"
                          onClick={() => removeUserMod(mod.id)}
                        >
                          Remove
                        </button>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="hrx-mod-empty">Your saved builds will appear here.</p>
                )}
              </section>

              <section className="hrx-mods-section" aria-labelledby="hrx-mod-tuning-title">
                <div className="hrx-mods-section-heading">
                  <div>
                    <span>04 / BEHAVIOR</span>
                    <h2 id="hrx-mod-tuning-title">Interface & sound</h2>
                  </div>
                  <small>These switches control real local settings</small>
                </div>
                <div className="hrx-mod-tuning">
                  <label>
                    <span>
                      <b>Vertical tabs</b>
                      <small>Move tabs into the browser side rail</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={verticalTabs}
                      onChange={(event) => {
                        const next = event.target.checked
                        setVerticalTabs(next)
                        window.api.setVerticalTabs(next)
                      }}
                    />
                  </label>
                  <label>
                    <span>
                      <b>Browser sidebar</b>
                      <small>Show or hide the HRX navigation rail</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={sidebarSetup.showSidebar}
                      onChange={(event) => updateSidebarSetup('showSidebar', event.target.checked)}
                    />
                  </label>
                  <label>
                    <span>
                      <b>Mod sound cue</b>
                      <small>Play a short tone when applying or saving</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={modsSoundEnabled}
                      onChange={(event) => {
                        const enabled = event.target.checked
                        setModsSoundEnabled(enabled)
                        window.localStorage.setItem('hrx-mod-sound', enabled ? 'on' : 'off')
                        if (enabled) playModSound()
                      }}
                    />
                  </label>
                  <label className="hrx-volume-row">
                    <span>
                      <b>Sound level</b>
                      <small>{modsSoundVolume}%</small>
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={modsSoundVolume}
                      onChange={(event) => {
                        const volume = Number(event.target.value)
                        setModsSoundVolume(volume)
                        window.localStorage.setItem('hrx-mod-volume', String(volume))
                      }}
                    />
                  </label>
                  <button
                    className="hrx-sound-preview"
                    type="button"
                    onClick={playModSound}
                    disabled={!modsSoundEnabled}
                  >
                    Preview sound <span>▶</span>
                  </button>
                </div>
              </section>
              {modNotice && (
                <p className="hrx-mod-notice" role="status">
                  {modNotice}
                </p>
              )}
              <footer className="hrx-mods-footer">
                <span>HRX MOD LAB / MADE BY HRISHIKESH</span>
                <span>Build settings stay on this device.</span>
              </footer>
            </div>
          </section>
        )}
        {hrxAiPageTabId === activeTabId && hrxAiPageTabId !== null && (
          <section className="hrx-ai-page" aria-labelledby="hrx-ai-title">
            <header className="hrx-ai-topbar">
              <div className="hrx-ai-brand">
                <img src={browserMark} alt="" />
                <span>HRISHIKESH</span>
                <i>AI</i>
              </div>
              <div className="hrx-ai-header-status">
                <span className={hrxAiModels.length ? 'connected' : ''} />
                {hrxAiStatus}
              </div>
              <button type="button" onClick={() => setHrxAiPageTabId(null)}>
                × <span>Back to browser</span>
              </button>
            </header>
            <div className="hrx-ai-shell">
              <div className="hrx-ai-title-row">
                <span className="hrx-ai-orbit">H</span>
                <div>
                  <span className="hrx-ai-eyebrow">YOUR ON-DEVICE ASSISTANT</span>
                  <h1 id="hrx-ai-title">
                    Hrishikesh <em>AI</em>
                  </h1>
                  <p>Private chat powered by a model running on this computer.</p>
                </div>
              </div>
              {!hrxAiModels.length && (
                <aside className="hrx-ai-connect-card">
                  <div className="hrx-ai-connect-icon">⌁</div>
                  <div>
                    <strong>Connect your local AI engine</strong>
                    <p>
                      {hrxAiNotice ||
                        'Hrishikesh AI needs Ollama and at least one model installed on this computer.'}
                    </p>
                    <small>
                      After setup, return here and check the connection. Available local models will
                      appear below.
                    </small>
                  </div>
                  <button type="button" onClick={openHrxAi}>
                    Check connection
                  </button>
                </aside>
              )}
              {hrxAiModels.length > 0 && (
                <div className="hrx-ai-model-row">
                  <label htmlFor="hrx-ai-model">LOCAL MODEL</label>
                  <select
                    id="hrx-ai-model"
                    value={hrxAiModel}
                    onChange={(event) => setHrxAiModel(event.target.value)}
                  >
                    {hrxAiModels.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                  <span>Runs on this computer</span>
                </div>
              )}
              <div className="hrx-ai-chat" aria-live="polite">
                {hrxAiMessages.length === 0 ? (
                  <div className="hrx-ai-welcome">
                    <span>✳</span>
                    <h2>What should we work on?</h2>
                    <p>Ask a question, plan an idea, or get help with your browser.</p>
                    <div>
                      {[
                        'Explain a browser feature',
                        'Help me plan a project',
                        'Summarize an idea'
                      ].map((prompt) => (
                        <button type="button" key={prompt} onClick={() => setHrxAiInput(prompt)}>
                          {prompt}
                          <b>↗</b>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  hrxAiMessages.map((message, index) => (
                    <article
                      className={`hrx-ai-message ${message.role}`}
                      key={`${message.role}-${index}`}
                    >
                      <span>{message.role === 'user' ? 'YOU' : 'HRX AI'}</span>
                      <p>{message.content}</p>
                    </article>
                  ))
                )}
                {hrxAiBusy && (
                  <div className="hrx-ai-thinking">
                    <i />
                    <i />
                    <i /> Hrishikesh AI is thinking…
                  </div>
                )}
              </div>
              {hrxAiNotice && hrxAiModels.length > 0 && (
                <p className="hrx-ai-notice" role="status">
                  {hrxAiNotice}
                </p>
              )}
              <form className="hrx-ai-composer" onSubmit={submitHrxAiMessage}>
                <textarea
                  aria-label="Message Hrishikesh AI"
                  value={hrxAiInput}
                  onChange={(event) => setHrxAiInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      event.currentTarget.form?.requestSubmit()
                    }
                  }}
                  placeholder={
                    hrxAiModels.length
                      ? 'Message Hrishikesh AI…'
                      : 'Connect local AI to start chatting'
                  }
                  disabled={!hrxAiModels.length || hrxAiBusy}
                  rows={2}
                />
                <button
                  type="submit"
                  disabled={!hrxAiModels.length || !hrxAiInput.trim() || hrxAiBusy}
                  aria-label="Send message"
                >
                  ↑
                </button>
                <small>Chats save on this device and go only to your local model.</small>
              </form>
            </div>
          </section>
        )}
        <footer className="home-footer">
          <span>MADE BY HRISHIKESH</span>
        </footer>
      </section>
    </main>
  )
}

export default App
