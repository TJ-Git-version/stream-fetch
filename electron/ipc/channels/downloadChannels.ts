// electron/ipc/channels/downloadChannels.ts
import { ipcMain, IpcMainInvokeEvent, BrowserWindow } from 'electron'
import { YtDlpRunner, VideoMetadata } from '../download/YtDlpRunner'
import { DownloadManager, DownloadTaskConfig } from '../download/DownloadManager'

let downloadManager: DownloadManager | null = null

export function initializeDownloadChannels(): void {
  downloadManager = new DownloadManager(3)

  // 进度回调 - 推送至渲染进程
  downloadManager.onProgress((taskId, state) => {
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('download:progress', { taskId, ...state })
    })
  })

  // 完成回调
  downloadManager.onComplete((taskId, outputPath) => {
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('download:complete', { taskId, outputPath })
    })
  })

  // 错误回调
  downloadManager.onError((taskId, error) => {
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('download:error', { taskId, error })
    })
  })

  // 解析 URL
  ipcMain.handle('download:parse-url', async (_event: IpcMainInvokeEvent, url: string): Promise<VideoMetadata> => {
    console.log('[downloadChannels] parse-url called with:', url)
    return YtDlpRunner.parseUrl(url)
  })

  // 开始下载
  ipcMain.handle('download:start', async (_event: IpcMainInvokeEvent, config: DownloadTaskConfig): Promise<void> => {
    console.log('[downloadChannels] start-download called with:', config.id)
    if (downloadManager) {
      downloadManager.startDownload(config)
    }
  })

  // 暂停下载
  ipcMain.handle('download:pause', async (_event: IpcMainInvokeEvent, taskId: string): Promise<void> => {
    console.log('[downloadChannels] pause-download called with:', taskId)
    downloadManager?.pauseTask(taskId)
  })

  // 继续下载
  ipcMain.handle('download:resume', async (_event: IpcMainInvokeEvent, taskId: string): Promise<void> => {
    console.log('[downloadChannels] resume-download called with:', taskId)
    downloadManager?.resumeTask(taskId)
  })

  // 取消下载
  ipcMain.handle('download:cancel', async (_event: IpcMainInvokeEvent, taskId: string): Promise<void> => {
    console.log('[downloadChannels] cancel-download called with:', taskId)
    downloadManager?.cancelTask(taskId)
  })

  // 获取任务状态
  ipcMain.handle('download:status', async (_event: IpcMainInvokeEvent, taskId: string) => {
    return downloadManager?.getTaskState(taskId)
  })
}