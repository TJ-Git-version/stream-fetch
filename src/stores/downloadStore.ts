import { create } from 'zustand'
import { DownloadTask, VideoInfo } from '../types'

interface DownloadStore {
  tasks: DownloadTask[]
  addTask: (videoInfo: VideoInfo, quality: string) => void
  updateTask: (id: string, updates: Partial<DownloadTask>) => void
  removeTask: (id: string) => void
  pauseTask: (id: string) => void
  resumeTask: (id: string) => void
  clearCompleted: () => void
}

export const useDownloadStore = create<DownloadStore>((set) => ({
  tasks: [],
  addTask: (videoInfo, quality) =>
    set((state) => ({
      tasks: [
        ...state.tasks,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          videoInfo,
          quality,
          status: 'pending',
          progress: 0,
          speed: 0,
          downloaded: 0,
          total: videoInfo.qualities.find((q) => q.value === quality)?.size || 0,
        },
      ],
    })),
  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, ...updates } : task
      ),
    })),
  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    })),
  pauseTask: (id) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, status: 'paused' } : task
      ),
    })),
  resumeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, status: 'downloading' } : task
      ),
    })),
  clearCompleted: () =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.status !== 'completed'),
    })),
}))