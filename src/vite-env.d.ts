/// <reference types="vite/client" />

interface ElectronAPI {
  platform: string
  versions: {
    node: string
    chrome: string
    electron: string
  }
  invoke: (channel: string, data?: unknown) => Promise<unknown>
  on: (channel: string, callback: (...args: unknown[]) => void) => void
  off: (channel: string, callback: (...args: unknown[]) => void) => void
  parseUrl: (url: string) => Promise<unknown>
  selectPath: () => Promise<string | null>
  startDownload: (id: string, url: string, quality: string) => Promise<void>
  pauseDownload: (id: string) => Promise<void>
  resumeDownload: (id: string) => Promise<void>
  cancelDownload: (id: string) => Promise<void>
  getSettings: () => Promise<unknown>
  saveSettings: (settings: unknown) => Promise<void>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}