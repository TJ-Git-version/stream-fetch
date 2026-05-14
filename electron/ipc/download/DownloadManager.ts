// electron/ipc/download/DownloadManager.ts
import { ChildProcess } from 'child_process'
import { YtDlpRunner, DownloadProgress } from './YtDlpRunner'

export interface DownloadTaskConfig {
  id: string
  url: string
  outputPath: string
  quality: string
  format: 'mp4' | 'mp3'
}

export type TaskStatus = 'pending' | 'downloading' | 'paused' | 'completed' | 'failed'

export interface TaskState {
  id: string
  status: TaskStatus
  progress: number
  speed: number
  downloaded: number
  total: number
  error?: string
}

export type ProgressCallback = (taskId: string, state: TaskState) => void
export type CompletionCallback = (taskId: string, outputPath: string) => void
export type ErrorCallback = (taskId: string, error: string) => void

export class DownloadManager {
  private tasks: Map<string, TaskState> = new Map()
  private processes: Map<string, ChildProcess> = new Map()
  private maxConcurrent: number = 3
  private progressCallbacks: Set<ProgressCallback> = new Set()
  private completionCallbacks: Set<CompletionCallback> = new Set()
  private errorCallbacks: Set<ErrorCallback> = new Set()
  private pausedTasks: Map<string, { url: string; outputPath: string; quality: string; format: 'mp4' | 'mp3' }> = new Map()

  constructor(maxConcurrent: number = 3) {
    this.maxConcurrent = maxConcurrent
  }

  onProgress(callback: ProgressCallback): void {
    this.progressCallbacks.add(callback)
  }

  onComplete(callback: CompletionCallback): void {
    this.completionCallbacks.add(callback)
  }

  onError(callback: ErrorCallback): void {
    this.errorCallbacks.add(callback)
  }

  async startDownload(config: DownloadTaskConfig): Promise<void> {
    const { id, url, outputPath, quality, format } = config

    this.tasks.set(id, {
      id,
      status: 'downloading',
      progress: 0,
      speed: 0,
      downloaded: 0,
      total: 0
    })

    try {
      // Note: YtDlpRunner.download doesn't return the process, so we track it internally
      // The actual download is fire-and-forget from DownloadManager's perspective
      const output = await YtDlpRunner.download(
        { url, outputPath, quality, format },
        (progress: DownloadProgress) => {
          const state = this.tasks.get(id)
          if (state && state.status === 'downloading') {
            state.downloaded = progress.downloaded
            state.speed = progress.speed
            state.progress = progress.percent
            this.notifyProgress(id, state)
          }
        }
      )

      this.tasks.set(id, { ...this.tasks.get(id)!, status: 'completed', progress: 100 })
      this.notifyComplete(id, output)
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error)
      this.tasks.set(id, { ...this.tasks.get(id)!, status: 'failed', error: errMsg })
      this.notifyError(id, errMsg)
    }
  }

  pauseTask(taskId: string): void {
    const state = this.tasks.get(taskId)
    if (state && state.status === 'downloading') {
      const proc = this.processes.get(taskId)
      if (proc) {
        proc.kill('SIGSTOP')
        state.status = 'paused'
        this.notifyProgress(taskId, state)
      } else {
        // Can't pause - no process reference
        // For yt-dlp, we'd need to implement this differently
        state.status = 'paused'
        this.notifyProgress(taskId, state)
      }
    }
  }

  resumeTask(taskId: string): void {
    const state = this.tasks.get(taskId)
    if (state && state.status === 'paused') {
      // Check if we have saved task config for restart
      const savedConfig = this.pausedTasks.get(taskId)
      if (savedConfig) {
        // For paused tasks, we need to restart from beginning since yt-dlp doesn't support resume
        state.status = 'downloading'
        this.notifyProgress(taskId, state)
        // Restart download
        this.startDownload({ id: taskId, ...savedConfig })
      } else {
        const proc = this.processes.get(taskId)
        if (proc) {
          proc.kill('SIGCONT')
          state.status = 'downloading'
          this.notifyProgress(taskId, state)
        }
      }
    }
  }

  cancelTask(taskId: string): void {
    const proc = this.processes.get(taskId)
    if (proc) {
      proc.kill('SIGTERM')
      this.processes.delete(taskId)
    }
    this.pausedTasks.delete(taskId)
    this.tasks.delete(taskId)
  }

  getTaskState(taskId: string): TaskState | undefined {
    return this.tasks.get(taskId)
  }

  private notifyProgress(taskId: string, state: TaskState): void {
    this.progressCallbacks.forEach(cb => cb(taskId, state))
  }

  private notifyComplete(taskId: string, outputPath: string): void {
    this.completionCallbacks.forEach(cb => cb(taskId, outputPath))
  }

  private notifyError(taskId: string, error: string): void {
    this.errorCallbacks.forEach(cb => cb(taskId, error))
  }
}