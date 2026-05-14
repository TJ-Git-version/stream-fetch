import { ipcMain } from 'electron'

// 注册基础 IPC 处理器
ipcMain.handle('get-app-version', () => {
  const { app } = require('electron')
  return app.getVersion()
})

// 初始化下载 IPC 通道
import '../download/YtDlpRunner'
import '../download/FFmpegRunner'
import '../download/DownloadManager'
import './channels/downloadChannels'

initializeDownloadChannels()