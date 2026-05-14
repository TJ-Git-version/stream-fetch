import { useEffect, useCallback } from 'react'
import { useDownloadStore } from '../stores/downloadStore'
import { IPC_CHANNELS } from '../types'

export const useIPC = () => {
  const { updateTask } = useDownloadStore()

  // 监听下载进度更新
  useEffect(() => {
    const handleProgress = (data: { id: string; progress: number; speed: number; downloaded: number }) => {
      updateTask(data.id, {
        progress: data.progress,
        speed: data.speed,
        downloaded: data.downloaded,
        status: 'downloading',
      })
    }

    const handleComplete = (data: { id: string }) => {
      updateTask(data.id, { status: 'completed', progress: 100 })
    }

    const handleError = (data: { id: string; error: string }) => {
      updateTask(data.id, { status: 'failed', error: data.error })
    }

    // 注册 IPC 监听
    window.electronAPI?.on?.(IPC_CHANNELS.DOWNLOAD_PROGRESS, handleProgress as (...args: unknown[]) => void)
    window.electronAPI?.on?.(IPC_CHANNELS.DOWNLOAD_COMPLETE, handleComplete as (...args: unknown[]) => void)
    window.electronAPI?.on?.(IPC_CHANNELS.DOWNLOAD_ERROR, handleError as (...args: unknown[]) => void)

    return () => {
      window.electronAPI?.off?.(IPC_CHANNELS.DOWNLOAD_PROGRESS, handleProgress as (...args: unknown[]) => void)
      window.electronAPI?.off?.(IPC_CHANNELS.DOWNLOAD_COMPLETE, handleComplete as (...args: unknown[]) => void)
      window.electronAPI?.off?.(IPC_CHANNELS.DOWNLOAD_ERROR, handleError as (...args: unknown[]) => void)
    }
  }, [updateTask])

  const parseUrl = useCallback(async (url: string) => {
    return window.electronAPI?.invoke?.(IPC_CHANNELS.PARSE_URL, { url })
  }, [])

  const startDownload = useCallback(async (id: string, url: string, quality: string) => {
    return window.electronAPI?.invoke?.(IPC_CHANNELS.START_DOWNLOAD, { id, url, quality })
  }, [])

  const pauseDownload = useCallback(async (id: string) => {
    return window.electronAPI?.invoke?.(IPC_CHANNELS.PAUSE_DOWNLOAD, { id })
  }, [])

  const resumeDownload = useCallback(async (id: string) => {
    return window.electronAPI?.invoke?.(IPC_CHANNELS.RESUME_DOWNLOAD, { id })
  }, [])

  const cancelDownload = useCallback(async (id: string) => {
    return window.electronAPI?.invoke?.(IPC_CHANNELS.CANCEL_DOWNLOAD, { id })
  }, [])

  const selectPath = useCallback(async () => {
    return window.electronAPI?.invoke?.(IPC_CHANNELS.SELECT_PATH)
  }, [])

  return {
    parseUrl,
    startDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    selectPath,
  }
}