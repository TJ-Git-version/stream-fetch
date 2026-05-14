import { create } from 'zustand'
import { DownloadTask, VideoInfo } from '../types'
import { downloadApi, DownloadProgress } from '../api/downloadApi'

interface DownloadStore {
  tasks: DownloadTask[]
  isLoading: boolean
  error: string | null
  initIPCListeners: () => void
  addTask: (videoInfo: VideoInfo, quality: string, format?: 'mp4' | 'mp3') => void
  updateTask: (id: string, updates: Partial<DownloadTask>) => void
  removeTask: (id: string) => void
  pauseTask: (id: string) => void
  resumeTask: (id: string) => void
  clearCompleted: () => void
  startDownload: (id: string, outputPath: string) => Promise<void>
  cancelDownload: (id: string) => Promise<void>
}

export const useDownloadStore = create<DownloadStore>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  initIPCListeners: () => {
    downloadApi.onProgress((progress: DownloadProgress) => {
      set(state => ({
        tasks: state.tasks.map(t =>
          t.id === progress.taskId
            ? {
                ...t,
                status: progress.status,
                progress: progress.progress,
                speed: progress.speed,
                downloaded: progress.downloaded,
                total: progress.total || t.total,
                error: progress.error
              }
            : t
        )
      }))
    })

    downloadApi.onComplete((taskId: string, _outputPath: string) => {
      set(state => ({
        tasks: state.tasks.map(t =>
          t.id === taskId
            ? { ...t, status: 'completed' as const, progress: 100 }
            : t
        )
      }))
    })

    downloadApi.onError((taskId: string, error: string) => {
      set(state => ({
        tasks: state.tasks.map(t =>
          t.id === taskId
            ? { ...t, status: 'failed' as const, error }
            : t
        )
      }))
    })
  },

  addTask: (videoInfo, quality, format = 'mp4') =>
    set(state => ({
      tasks: [
        ...state.tasks,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          videoInfo,
          quality,
          format,
          status: 'pending' as const,
          progress: 0,
          speed: 0,
          downloaded: 0,
          total: videoInfo.qualities.find(q => q.value === quality)?.size || 0,
        },
      ],
    })),

  updateTask: (id, updates) =>
    set(state => ({
      tasks: state.tasks.map(task =>
        task.id === id ? { ...task, ...updates } : task
      ),
    })),

  removeTask: (id) =>
    set(state => ({
      tasks: state.tasks.filter(task => task.id !== id),
    })),

  pauseTask: (id) => {
    downloadApi.pauseDownload(id)
    set(state => ({
      tasks: state.tasks.map(task =>
        task.id === id ? { ...task, status: 'paused' as const } : task
      ),
    }))
  },

  resumeTask: (id) => {
    downloadApi.resumeDownload(id)
    set(state => ({
      tasks: state.tasks.map(task =>
        task.id === id ? { ...task, status: 'downloading' as const } : task
      ),
    }))
  },

  clearCompleted: () =>
    set(state => ({
      tasks: state.tasks.filter(task => task.status !== 'completed'),
    })),

  startDownload: async (id, outputPath) => {
    const { tasks } = get()
    const task = tasks.find(t => t.id === id)
    if (!task) return

    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === id ? { ...t, status: 'downloading' as const } : t
      ),
      isLoading: true,
      error: null
    }))

    try {
      await downloadApi.startDownload({
        id: task.id,
        url: task.videoInfo.url,
        outputPath,
        quality: task.quality,
        format: task.format || 'mp4'
      })
    } catch (error) {
      set(state => ({
        tasks: state.tasks.map(t =>
          t.id === id ? { ...t, status: 'failed' as const, error: String(error) } : t
        ),
        isLoading: false,
        error: String(error)
      }))
    }
  },

  cancelDownload: async (id) => {
    await downloadApi.cancelDownload(id)
    set(state => ({
      tasks: state.tasks.filter(task => task.id !== id),
      isLoading: false
    }))
  },
}))