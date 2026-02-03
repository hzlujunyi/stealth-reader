const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('open-file'),
  getStore: (key) => ipcRenderer.invoke('get-store', key),
  setStore: (key, value) => ipcRenderer.invoke('set-store', key, value),
  setOpacity: (opacity) => ipcRenderer.invoke('set-opacity', opacity),
  setAlwaysOnTop: (value) => ipcRenderer.invoke('set-always-on-top', value),
  setFrameless: (value) => ipcRenderer.invoke('set-frameless', value),
  setAutoHide: (value) => ipcRenderer.invoke('set-auto-hide', value),
  showWindow: () => ipcRenderer.invoke('show-window'),
  hideWindow: () => ipcRenderer.invoke('hide-window'),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  restoreWindow: () => ipcRenderer.invoke('restore-window'),
  getWindowBounds: () => ipcRenderer.invoke('get-window-bounds'),
  setWindowBounds: (bounds) => ipcRenderer.invoke('set-window-bounds', bounds),
  moveWindow: (deltaX, deltaY) => ipcRenderer.invoke('move-window', deltaX, deltaY),
  pauseAutoHide: (paused) => ipcRenderer.invoke('pause-auto-hide', paused),
  showContextMenu: () => ipcRenderer.invoke('show-context-menu'),
  captureScreen: () => ipcRenderer.invoke('capture-screen'),

  // 事件监听
  onMenuOpenFile: (callback) => ipcRenderer.on('menu-open-file', callback),
  onMenuShowToc: (callback) => ipcRenderer.on('menu-show-toc', callback),
  onMenuShowSearch: (callback) => ipcRenderer.on('menu-show-search', callback),
  onMenuShowSettings: (callback) => ipcRenderer.on('menu-show-settings', callback),
  onMenuShowStatistics: (callback) => ipcRenderer.on('menu-show-statistics', callback)
})
