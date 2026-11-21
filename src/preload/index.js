import { contextBridge, ipcRenderer } from 'electron'

const api = {
  getState: () => ipcRenderer.invoke('browser:get-state'),
  setWindowTitle: (title) => ipcRenderer.invoke('browser:set-window-title', title),
  getAppVersion: () => ipcRenderer.invoke('browser:get-app-version'),
  copyText: (text) => ipcRenderer.invoke('browser:copy-text', text),
  getGoogleAccountState: () => ipcRenderer.invoke('browser:get-google-account-state'),
  signOutGoogle: () => ipcRenderer.invoke('browser:sign-out-google'),
  setPopupOpen: (open) => ipcRenderer.invoke('browser:set-popup-open', open),
  setAddressSuggestionsOpen: (open) =>
    ipcRenderer.invoke('browser:set-address-suggestions-open', open),
  setVerticalTabs: (enabled) => ipcRenderer.invoke('browser:set-vertical-tabs', enabled),
  setGamingBoost: (enabled) => ipcRenderer.invoke('browser:set-gaming-boost', enabled),
  setBrowserNotifications: (enabled) =>
    ipcRenderer.invoke('browser:set-notifications-enabled', enabled),
  setResourceControls: (settings) => ipcRenderer.invoke('browser:set-resource-controls', settings),
  setShaderEffect: (effect) => ipcRenderer.invoke('browser:set-shader-effect', effect),
  getHrxAiModels: () => ipcRenderer.invoke('browser:hrx-ai-models'),
  askHrxAi: (messages, model) => ipcRenderer.invoke('browser:hrx-ai-chat', { messages, model }),
  toggleReaderMode: () => ipcRenderer.invoke('browser:toggle-reader-mode'),
  getTabProcesses: () => ipcRenderer.invoke('browser:get-tab-processes'),
  getCleanupStats: () => ipcRenderer.invoke('browser:get-cleanup-stats'),
  getSystemMetrics: () => ipcRenderer.invoke('browser:get-system-metrics'),
  getVpnProfiles: () => ipcRenderer.invoke('browser:get-vpn-profiles'),
  connectVpn: (name) => ipcRenderer.invoke('browser:connect-vpn', name),
  disconnectVpn: (name) => ipcRenderer.invoke('browser:disconnect-vpn', name),
  openVpnSettings: () => ipcRenderer.invoke('browser:open-vpn-settings'),
  getPagePerformance: () => ipcRenderer.invoke('browser:get-page-performance'),
  getExtensions: () => ipcRenderer.invoke('browser:get-extensions'),
  loadExtension: () => ipcRenderer.invoke('browser:load-extension'),
  removeExtension: (extensionId) => ipcRenderer.invoke('browser:remove-extension', extensionId),
  navigate: (value) => ipcRenderer.invoke('browser:navigate', value),
  back: () => ipcRenderer.invoke('browser:back'),
  forward: () => ipcRenderer.invoke('browser:forward'),
  home: () => ipcRenderer.invoke('browser:home'),
  reload: () => ipcRenderer.invoke('browser:reload'),
  newTab: () => ipcRenderer.invoke('browser:new-tab'),
  switchTab: (tabId) => ipcRenderer.invoke('browser:switch-tab', tabId),
  closeTab: (tabId) => ipcRenderer.invoke('browser:close-tab', tabId),
  getPreferences: () => ipcRenderer.invoke('browser:get-preferences'),
  savePreferences: (preferences) => ipcRenderer.invoke('browser:save-preferences', preferences),
  newWindow: (incognito = false) => ipcRenderer.invoke('browser:new-window', incognito),
  getHistory: () => ipcRenderer.invoke('browser:get-history'),
  getDownloads: () => ipcRenderer.invoke('browser:get-downloads'),
  zoom: (percent) => ipcRenderer.invoke('browser:zoom', percent),
  print: () => ipcRenderer.invoke('browser:print'),
  savePage: () => ipcRenderer.invoke('browser:save-page'),
  shareUrl: () => ipcRenderer.invoke('browser:share-url'),
  openDevTools: () => ipcRenderer.invoke('browser:open-devtools'),
  exit: () => ipcRenderer.invoke('browser:exit'),
  find: (text) => ipcRenderer.invoke('browser:find', text),
  stopFind: () => ipcRenderer.invoke('browser:stop-find'),
  edit: (command) => ipcRenderer.invoke('browser:edit', command),
  groupTab: (group) => ipcRenderer.invoke('browser:group-tab', group),
  clearData: () => ipcRenderer.invoke('browser:clear-data'),
  cleanSelectedData: (selection) => ipcRenderer.invoke('browser:clean-selected-data', selection),
  listPasswords: () => ipcRenderer.invoke('browser:list-passwords'),
  savePassword: (value) => ipcRenderer.invoke('browser:save-password', value),
  removePassword: (id) => ipcRenderer.invoke('browser:remove-password', id),
  autofillPassword: (id) => ipcRenderer.invoke('browser:autofill-password', id),
  onDownloadsUpdated: (callback) => {
    const listener = (_event, downloads) => callback(downloads)
    ipcRenderer.on('browser:downloads-updated', listener)
    return () => ipcRenderer.removeListener('browser:downloads-updated', listener)
  },
  onFindResult: (callback) => {
    const listener = (_event, result) => callback(result)
    ipcRenderer.on('browser:find-result', listener)
    return () => ipcRenderer.removeListener('browser:find-result', listener)
  },
  onBrowserCommand: (callback) => {
    const listener = (_event, command) => callback(command)
    ipcRenderer.on('browser:open-menu-view', listener)
    return () => ipcRenderer.removeListener('browser:open-menu-view', listener)
  },
  onDismissPopups: (callback) => {
    const listener = () => callback()
    ipcRenderer.on('browser:dismiss-popups', listener)
    return () => ipcRenderer.removeListener('browser:dismiss-popups', listener)
  },
  onFocusAddress: (callback) => {
    const listener = () => callback()
    ipcRenderer.on('browser:focus-address', listener)
    return () => ipcRenderer.removeListener('browser:focus-address', listener)
  },
  onZoomChanged: (callback) => {
    const listener = (_event, percent) => callback(percent)
    ipcRenderer.on('browser:zoom-changed', listener)
    return () => ipcRenderer.removeListener('browser:zoom-changed', listener)
  },
  onNavigationState: (callback) => {
    const listener = (_event, state) => callback(state)
    ipcRenderer.on('browser:navigation-state', listener)
    return () => ipcRenderer.removeListener('browser:navigation-state', listener)
  },
  onGoogleAccountState: (callback) => {
    const listener = (_event, state) => callback(state)
    ipcRenderer.on('browser:google-account-state', listener)
    return () => ipcRenderer.removeListener('browser:google-account-state', listener)
  }
}

contextBridge.exposeInMainWorld('api', api)
