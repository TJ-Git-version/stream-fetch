// src/api/downloadApi.ts

export interface DownloadTaskConfig {
  id: string
  url: string
  outputPath: string
  quality: string
  format: 'mp4' | 'mp3'
}

export interface DownloadProgress {
  taskId: string
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'failed'
  progress: number
  speed: number
  downloaded: number
  total: number
  error?: string
}

export interface VideoMetadata {
  id: string
  title: string
  author: string
  duration: number
  thumbnail: string
  url: string
  qualities: Array<{ label: string; value: string; size?: number }>
}

// 使用 preload 中暴露的 electronAPI
const api = window.electronAPI

export const downloadApi = {
  parseUrl: (url: string): Promise<VideoMetadata> => {
    return api.invoke('download:parse-url', url) as Promise<VideoMetadata>
  },

  startDownload: (config: DownloadTaskConfig): Promise<void> => {
    return api.invoke('download:start', config) as Promise<void>
  },

  pauseDownload: (taskId: string): Promise<void> => {
    return api.invoke('download:pause', taskId) as Promise<void>
  },

  resumeDownload: (taskId: string): Promise<void> => {
    return api.invoke('download:resume', taskId) as Promise<void>
  },

  cancelDownload: (taskId: string): Promise<void> => {
    return api.invoke('download:cancel', taskId) as Promise<void>
  },

  getStatus: (taskId: string): Promise<DownloadProgress | null> => {
    return api.invoke('download:status', taskId) as Promise<DownloadProgress | null>
  },

  onProgress: (callback: (progress: DownloadProgress) => void) => {
    const handler = ((data: unknown) => callback(data as DownloadProgress)) as (...args: unknown[]) => void
    api.on('download:progress', handler)
    return handler
  },

  onComplete: (callback: (taskId: string, outputPath: string) => void) => {
    const handler = ((data: unknown) => {
      const d = data as { taskId: string; outputPath: string }
      callback(d.taskId, d.outputPath)
    }) as (...args: unknown[]) => void
    api.on('download:complete', handler)
    return handler
  },

  onError: (callback: (taskId: string, error: string) => void) => {
    const handler = ((data: unknown) => {
      const d = data as { taskId: string; error: string }
      callback(d.taskId, d.error)
    }) as (...args: unknown[]) => void
    api.on('download:error', handler)
    return handler
  },

  offProgress: (handler: (...args: unknown[]) => void) => {
    api.off('download:progress', handler)
  },

  offComplete: (handler: (...args: unknown[]) => void) => {
    api.off('download:complete', handler)
  },

  offError: (handler: (...args: unknown[]) => void) => {
    api.off('download:error', handler)
  }
}