/// <reference types="vite/client" />

interface ElectronAPI {
  openFile: () => Promise<{ path: string; name: string; content: string } | null>
  getStore: (key: string) => Promise<any>
  setStore: (key: string, value: any) => Promise<void>
  setOpacity: (opacity: number) => Promise<void>
  setAlwaysOnTop: (value: boolean) => Promise<void>
  setFrameless: (value: boolean) => Promise<void>
  setAutoHide: (value: boolean) => Promise<void>
  showWindow: () => Promise<void>
  hideWindow: () => Promise<void>
  minimizeWindow: () => Promise<void>
  restoreWindow: () => Promise<void>
  getWindowBounds: () => Promise<{ x: number; y: number; width: number; height: number } | null>
  setWindowBounds: (bounds: { x?: number; y?: number; width?: number; height?: number }) => Promise<void>
  moveWindow: (deltaX: number, deltaY: number) => Promise<void>
  pauseAutoHide: (paused: boolean) => Promise<void>
  showContextMenu: () => Promise<void>
  captureScreen: () => Promise<string | null>
  onMenuOpenFile: (callback: () => void) => void
  onMenuShowToc: (callback: () => void) => void
  onMenuShowSearch: (callback: () => void) => void
  onMenuShowSettings: (callback: () => void) => void
  onMenuShowStatistics: (callback: () => void) => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
