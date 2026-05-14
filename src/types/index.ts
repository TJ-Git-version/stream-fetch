// 视频信息
export interface VideoInfo {
  id: string
  title: string
  author: string
  duration: number // 秒
  thumbnail: string
  url: string
  qualities: Quality[]
}

// 清晰度选项
export interface Quality {
  label: string
  value: string
  size?: number // bytes
}

// 下载任务
export interface DownloadTask {
  id: string
  videoInfo: VideoInfo
  quality: string
  format?: 'mp4' | 'mp3'
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'failed'
  progress: number // 0-100
  speed: number // bytes/s
  downloaded: number // bytes
  total: number // bytes
  error?: string
}

// 应用设置
export interface AppSettings {
  downloadPath: string
  maxConcurrent: number
  language: 'zh-CN' | 'en-US'
  theme: 'light' | 'dark' | 'auto'
}

// IPC 通道名称
export const IPC_CHANNELS = {
  // 下载相关
  PARSE_URL: 'parse-url',
  START_DOWNLOAD: 'start-download',
  PAUSE_DOWNLOAD: 'pause-download',
  RESUME_DOWNLOAD: 'resume-download',
  CANCEL_DOWNLOAD: 'cancel-download',
  DOWNLOAD_PROGRESS: 'download-progress',
  DOWNLOAD_COMPLETE: 'download-complete',
  DOWNLOAD_ERROR: 'download-error',
  // 设置相关
  GET_SETTINGS: 'get-settings',
  SAVE_SETTINGS: 'save-settings',
  SELECT_PATH: 'select-path',
  // 应用相关
  GET_APP_VERSION: 'get-app-version',
} as const