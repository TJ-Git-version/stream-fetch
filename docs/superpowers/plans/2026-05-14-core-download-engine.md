# 模块3：核心能力 - 下载引擎实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 yt-dlp/FFmpeg 集成、下载管理、进度监听、文件处理的完整下载引擎，能够通过 IPC 与渲染进程通信，支持队列管理、断点续传和进度实时推送。

**Architecture:** 主进程通过 child_process spawn 管理 yt-dlp 和 FFmpeg 子进程，使用事件流解析进度输出并通过 IPC 推送至渲染进程。下载管理采用 Zustand store + 内存队列的架构，支持暂停/继续/取消和并发控制。

**Tech Stack:** Node.js child_process, yt-dlp, FFmpeg, TypeScript, Zustand

---

## 文件结构

```
stream-fetch/
├── electron/
│   ├── main.ts                              # 窗口管理（已有）
│   ├── preload.ts                           # IPC 桥接（已有）
│   └── ipc/
│       ├── handlers.ts                      # IPC 处理器注册（已有）
│       ├── download/
│       │   ├── YtDlpRunner.ts              # yt-dlp 进程管理
│       │   ├── FFmpegRunner.ts             # FFmpeg 进程管理
│       │   ├── ProgressParser.ts           # 进度解析器
│       │   ├── DownloadManager.ts          # 下载管理器
│       │   └── FileManager.ts             # 文件管理
│       └── channels/
│           └── downloadChannels.ts         # 下载相关 IPC 通道
├── src/
│   ├── stores/
│   │   └── downloadStore.ts                # 下载状态管理（已有，需更新）
│   ├── api/
│   │   └── downloadApi.ts                  # 渲染进程 IPC 封装
│   └── types/
│       └── index.ts                        # 类型定义（已有）
└── resources/
    ├── yt-dlp/                             # yt-dlp 可执行文件
    └── ffmpeg/                             # ffmpeg 可执行文件
```

---

## Task 1: yt-dlp 基础调用

**Files:**
- Create: `electron/ipc/download/YtDlpRunner.ts`
- Modify: `electron/ipc/handlers.ts` - 添加 yt-dlp 调用

- [ ] **Step 1: 创建 YtDlpRunner 类骨架**

```typescript
// electron/ipc/download/YtDlpRunner.ts
import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import { app } from 'electron'

export interface YtDlpOptions {
  url: string
  outputPath: string
  quality?: string
  format?: 'mp4' | 'mp3'
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

export class YtDlpRunner {
  private static getExecutablePath(): string {
    const basePath = app.isPackaged
      ? path.join(process.resourcesPath, 'resources', 'yt-dlp')
      : path.join(__dirname, '../../resources/yt-dlp')
    return process.platform === 'win32'
      ? path.join(basePath, 'yt-dlp.exe')
      : path.join(basePath, 'yt-dlp')
  }

  static async parseUrl(url: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const args = ['--dump-json', '--no-warnings', url]
      const proc = spawn(this.getExecutablePath(), args)

      let stdout = ''
      let stderr = ''

      proc.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      proc.stderr?.on('data', (data) => {
        stderr += data.toString()
      })

      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`yt-dlp parse failed: ${stderr}`))
          return
        }
        try {
          const info = JSON.parse(stdout)
          resolve({
            id: info.id || '',
            title: info.title || '',
            author: info.uploader || info.channel || '',
            duration: info.duration || 0,
            thumbnail: info.thumbnail || '',
            url: url,
            qualities: this.extractQualities(info)
          })
        } catch (e) {
          reject(new Error(`Failed to parse video info: ${e}`))
        }
      })

      proc.on('error', reject)
    })
  }

  private static extractQualities(info: any): Array<{ label: string; value: string; size?: number }> {
    const formats = info.formats || []
    const qualityMap = new Map<string, { label: string; value: string; size?: number }>()

    formats.forEach((f: any) => {
      const height = f.height
      if (height && !qualityMap.has(`${height}p`)) {
        qualityMap.set(`${height}p`, {
          label: `${height}p`,
          value: `${height}p`,
          size: f.filesize
        })
      }
    })

    return Array.from(qualityMap.values()).sort((a, b) => {
      const aHeight = parseInt(a.label)
      const bHeight = parseInt(b.label)
      return bHeight - aHeight
    })
  }
}
```

- [ ] **Step 2: 运行类型检查验证**

Run: `cd "d:/myCode/stream-fetch/stream-fetch" && npx tsc --noEmit electron/ipc/download/YtDlpRunner.ts`
Expected: 无 TypeScript 错误

- [ ] **Step 3: 提交**

```bash
cd "d:/myCode/stream-fetch/stream-fetch"
git add electron/ipc/download/YtDlpRunner.ts
git commit -m "feat: add YtDlpRunner class with parseUrl method"
```

---

## Task 2: yt-dlp 下载调用

**Files:**
- Modify: `electron/ipc/download/YtDlpRunner.ts` - 添加 download 方法

- [ ] **Step 1: 添加 download 静态方法到 YtDlpRunner**

编辑 `electron/ipc/download/YtDlpRunner.ts`，在类末尾添加：

```typescript
static async download(
  options: YtDlpOptions,
  onProgress: (progress: DownloadProgress) => void
): Promise<string> {
  const { url, outputPath, quality = 'best', format = 'mp4' } = options

  const formatArg = format === 'mp3'
    ? 'bestaudio'
    : quality === 'best'
      ? 'bestvideo+bestaudio'
      : `bestvideo[height<=${quality}]+bestaudio`

  const outputTemplate = path.join(outputPath, '%(title)s-%(id)s.%(ext)s')

  const args = [
    '-f', formatArg,
    '--output', outputTemplate,
    '--newline',
    '--progress-template', '%(progress.downloaded_bytes)s %(progress.speed)s %(progress.eta)s',
    url
  ]

  return new Promise((resolve, reject) => {
    const proc = spawn(this.getExecutablePath(), args)

    proc.stdout?.on('data', (data) => {
      const line = data.toString().trim()
      if (line) {
        const progress = this.parseProgressLine(line)
        if (progress) {
          onProgress(progress)
        }
      }
    })

    proc.stderr?.on('data', (data) => {
      console.error('yt-dlp stderr:', data.toString())
    })

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(outputTemplate.replace('%(title)s-%(id)s.%(ext)s', ''))
      } else {
        reject(new Error(`yt-dlp download failed with code ${code}`))
      }
    })

    proc.on('error', reject)
  })
}

private static parseProgressLine(line: string): DownloadProgress | null {
  const parts = line.split(' ')
  if (parts.length < 3) return null

  const downloaded = parseInt(parts[0]) || 0
  const speed = this.parseSpeed(parts[1])
  const eta = parts[2]

  return { downloaded, speed, eta, percent: 0 }
}

private static parseSpeed(speedStr: string): number {
  const match = speedStr.match(/(\d+(?:\.\d+)?)\s*([KMG]?B\/s)?/i)
  if (!match) return 0

  const value = parseFloat(match[1])
  const unit = (match[2] || 'B/s').toUpperCase()

  const multipliers: Record<string, number> = {
    'KB/S': 1024,
    'MB/S': 1024 * 1024,
    'GB/S': 1024 * 1024 * 1024,
    'B/S': 1
  }

  return value * (multipliers[unit] || 1)
}
```

在文件顶部添加 `DownloadProgress` 接口（在 `YtDlpOptions` 之前）：

```typescript
export interface DownloadProgress {
  downloaded: number // bytes
  speed: number // bytes/s
  eta: string // HH:MM:SS format
  percent: number
}
```

- [ ] **Step 2: 类型检查**

Run: `cd "d:/myCode/stream-fetch/stream-fetch" && npx tsc --noEmit`
Expected: 无 TypeScript 错误

- [ ] **Step 3: 提交**

```bash
cd "d:/myCode/stream-fetch/stream-fetch"
git add electron/ipc/download/YtDlpRunner.ts
git commit -m "feat: add download method to YtDlpRunner with progress parsing"
```

---

## Task 3: FFmpeg 集成 - 音视频合并

**Files:**
- Create: `electron/ipc/download/FFmpegRunner.ts`

- [ ] **Step 1: 创建 FFmpegRunner 类**

```typescript
// electron/ipc/download/FFmpegRunner.ts
import { spawn } from 'child_process'
import path from 'path'
import { app } from 'electron'

export class FFmpegRunner {
  private static getExecutablePath(): string {
    const basePath = app.isPackaged
      ? path.join(process.resourcesPath, 'resources', 'ffmpeg')
      : path.join(__dirname, '../../resources/ffmpeg')
    return process.platform === 'win32'
      ? path.join(basePath, 'ffmpeg.exe')
      : path.join(basePath, 'ffmpeg')
  }

  static async mergeAudioVideo(
    videoPath: string,
    audioPath: string,
    outputPath: string,
    onProgress?: (percent: number) => void
  ): Promise<void> {
    const args = [
      '-i', videoPath,
      '-i', audioPath,
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-y',
      outputPath
    ]

    return new Promise((resolve, reject) => {
      const proc = spawn(this.getExecutablePath(), args)

      let duration = 0

      proc.stderr?.on('data', (data) => {
        const str = data.toString()
        // 解析 Duration
        const durationMatch = str.match(/Duration:\s*(\d+):(\d+):(\d+)/)
        if (durationMatch && !duration) {
          duration = parseInt(durationMatch[1]) * 3600 +
                     parseInt(durationMatch[2]) * 60 +
                     parseInt(durationMatch[3])
        }

        // 解析进度
        if (onProgress && duration > 0) {
          const timeMatch = str.match(/time=(\d+):(\d+):(\d+)/)
          if (timeMatch) {
            const current = parseInt(timeMatch[1]) * 3600 +
                           parseInt(timeMatch[2]) * 60 +
                           parseInt(timeMatch[3])
            onProgress(Math.round((current / duration) * 100))
          }
        }
      })

      proc.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`FFmpeg merge failed with code ${code}`))
        }
      })

      proc.on('error', reject)
    })
  }

  static async convertToMp3(
    inputPath: string,
    outputPath: string,
    onProgress?: (percent: number) => void
  ): Promise<void> {
    const args = [
      '-i', inputPath,
      '-vn',
      '-c:a', 'libmp3lame',
      '-q:a', '2',
      '-y',
      outputPath
    ]

    return new Promise((resolve, reject) => {
      const proc = spawn(this.getExecutablePath(), args)

      let duration = 0

      proc.stderr?.on('data', (data) => {
        const str = data.toString()
        const durationMatch = str.match(/Duration:\s*(\d+):(\d+):(\d+)/)
        if (durationMatch && !duration) {
          duration = parseInt(durationMatch[1]) * 3600 +
                     parseInt(durationMatch[2]) * 60 +
                     parseInt(durationMatch[3])
        }

        if (onProgress && duration > 0) {
          const timeMatch = str.match(/time=(\d+):(\d+):(\d+)/)
          if (timeMatch) {
            const current = parseInt(timeMatch[1]) * 3600 +
                           parseInt(timeMatch[2]) * 60 +
                           parseInt(timeMatch[3])
            onProgress(Math.round((current / duration) * 100))
          }
        }
      })

      proc.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`FFmpeg conversion failed with code ${code}`))
        }
      })

      proc.on('error', reject)
    })
  }
}
```

- [ ] **Step 2: 类型检查**

Run: `cd "d:/myCode/stream-fetch/stream-fetch" && npx tsc --noEmit electron/ipc/download/FFmpegRunner.ts`
Expected: 无 TypeScript 错误

- [ ] **Step 3: 提交**

```bash
cd "d:/myCode/stream-fetch/stream-fetch"
git add electron/ipc/download/FFmpegRunner.ts
git commit -m "feat: add FFmpegRunner for audio/video merging and MP3 conversion"
```

---

## Task 4: 进度解析器

**Files:**
- Create: `electron/ipc/download/ProgressParser.ts`

- [ ] **Step 1: 创建 ProgressParser 工具类**

```typescript
// electron/ipc/download/ProgressParser.ts

export interface ParsedProgress {
  percent: number
  speed: number // bytes per second
  eta: number // seconds
  downloaded: number // bytes
  total?: number // bytes
}

export class ProgressParser {
  // 匹配 yt-dlp 的进度输出格式: [download]   0.0% of   10.00MiB at   10.00MiB/s ETA 00:00:05
  private static YTDLP_PROGRESS_REGEX = /\[download\]\s+(\d+(?:\.\d+)?)%\s+of\s+(\d+(?:\.\d+)?)([KMGT]iB)?\s+at\s+(\d+(?:\.\d+)?)([KMGT]?iB)?\/s\s+ETA\s+(\d+):(\d+):(\d+)/

  // 备用格式: 1234567 bytes 10.5M/s 00:05
  private static ALT_PROGRESS_REGEX = /^(\d+)\s+bytes\s+([\d.]+)([KMGT])?\/s\s+(\d+):(\d+)$/

  static parseYtDlpLine(line: string): ParsedProgress | null {
    const match = line.match(this.YTDLP_PROGRESS_REGEX)
    if (!match) return null

    const percent = parseFloat(match[1])
    const downloaded = this.parseSize(match[2], match[3])
    const speed = this.parseSize(match[4], match[5])
    const etaSeconds = parseInt(match[6]) * 3600 + parseInt(match[7]) * 60 + parseInt(match[8])

    return { percent, speed, eta: etaSeconds, downloaded }
  }

  static parseAltFormat(line: string): ParsedProgress | null {
    const match = line.match(this.ALT_PROGRESS_REGEX)
    if (!match) return null

    const downloaded = parseInt(match[1])
    const speed = this.parseSpeedStr(match[2], match[3])
    const etaSeconds = parseInt(match[4]) * 60 + parseInt(match[5])

    return { percent: 0, speed, eta: etaSeconds, downloaded }
  }

  private static parseSize(value: string, unit?: string): number {
    const num = parseFloat(value)
    if (!unit) return num

    const multipliers: Record<string, number> = {
      'KiB': 1024,
      'MiB': 1024 * 1024,
      'GiB': 1024 * 1024 * 1024,
      'TiB': 1024 * 1024 * 1024 * 1024,
      'KB': 1000,
      'MB': 1000 * 1000,
      'GB': 1000 * 1000 * 1000,
      'TB': 1000 * 1000 * 1000 * 1000
    }

    return num * (multipliers[unit] || 1)
  }

  private static parseSpeedStr(value: string, unit?: string): number {
    const num = parseFloat(value)
    const multipliers: Record<string, number> = {
      'K': 1000,
      'M': 1000 * 1000,
      'G': 1000 * 1000 * 1000
    }

    return num * (unit ? (multipliers[unit[0]] || 1) : 1)
  }

  static formatSpeed(bytesPerSecond: number): string {
    if (bytesPerSecond >= 1e9) {
      return `${(bytesPerSecond / 1e9).toFixed(2)} GB/s`
    } else if (bytesPerSecond >= 1e6) {
      return `${(bytesPerSecond / 1e6).toFixed(2)} MB/s`
    } else if (bytesPerSecond >= 1e3) {
      return `${(bytesPerSecond / 1e3).toFixed(2)} KB/s`
    }
    return `${bytesPerSecond.toFixed(0)} B/s`
  }

  static formatEta(seconds: number): string {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
}
```

- [ ] **Step 2: 类型检查**

Run: `cd "d:/myCode/stream-fetch/stream-fetch" && npx tsc --noEmit electron/ipc/download/ProgressParser.ts`
Expected: 无 TypeScript 错误

- [ ] **Step 3: 提交**

```bash
cd "d:/myCode/stream-fetch/stream-fetch"
git add electron/ipc/download/ProgressParser.ts
git commit -m "feat: add ProgressParser for yt-dlp output parsing"
```

---

## Task 5: 下载管理器

**Files:**
- Create: `electron/ipc/download/DownloadManager.ts`

- [ ] **Step 1: 创建 DownloadManager 类**

```typescript
// electron/ipc/download/DownloadManager.ts
import { YtDlpRunner, YtDlpOptions, VideoMetadata } from './YtDlpRunner'
import { FFmpegRunner } from './FFmpegRunner'
import { ProgressParser, ParsedProgress } from './ProgressParser'

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
  private processes: Map<string, any> = new Map()
  private maxConcurrent: number = 3
  private progressCallbacks: Set<ProgressCallback> = new Set()
  private completionCallbacks: Set<CompletionCallback> = new Set()
  private errorCallbacks: Set<ErrorCallback> = new Set()

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
      const output = await YtDlpRunner.download(
        { url, outputPath, quality, format },
        (progress) => {
          const state = this.tasks.get(id)
          if (state && state.status === 'downloading') {
            state.downloaded = progress.downloaded
            state.speed = progress.speed
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
      }
    }
  }

  resumeTask(taskId: string): void {
    const state = this.tasks.get(taskId)
    if (state && state.status === 'paused') {
      const proc = this.processes.get(taskId)
      if (proc) {
        proc.kill('SIGCONT')
        state.status = 'downloading'
        this.notifyProgress(taskId, state)
      }
    }
  }

  cancelTask(taskId: string): void {
    const proc = this.processes.get(taskId)
    if (proc) {
      proc.kill('SIGTERM')
      this.processes.delete(taskId)
    }
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
```

- [ ] **Step 2: 类型检查**

Run: `cd "d:/myCode/stream-fetch/stream-fetch" && npx tsc --noEmit electron/ipc/download/DownloadManager.ts`
Expected: 无 TypeScript 错误

- [ ] **Step 3: 提交**

```bash
cd "d:/myCode/stream-fetch/stream-fetch"
git add electron/ipc/download/DownloadManager.ts
git commit -m "feat: add DownloadManager for queue management and task lifecycle"
```

---

## Task 6: IPC 通道定义和处理器

**Files:**
- Create: `electron/ipc/channels/downloadChannels.ts`
- Modify: `electron/ipc/handlers.ts` - 添加下载 IPC 处理

- [ ] **Step 1: 创建 downloadChannels.ts**

```typescript
// electron/ipc/channels/downloadChannels.ts
import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { YtDlpRunner, VideoMetadata } from '../download/YtDlpRunner'
import { DownloadManager, DownloadTaskConfig } from '../download/DownloadManager'

let downloadManager: DownloadManager | null = null

export function initializeDownloadChannels(): void {
  downloadManager = new DownloadManager(3)

  // 进度回调 - 推送至渲染进程
  downloadManager.onProgress((taskId, state) => {
    const { BrowserWindow } = require('electron')
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('download:progress', { taskId, ...state })
    })
  })

  // 完成回调
  downloadManager.onComplete((taskId, outputPath) => {
    const { BrowserWindow } = require('electron')
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('download:complete', { taskId, outputPath })
    })
  })

  // 错误回调
  downloadManager.onError((taskId, error) => {
    const { BrowserWindow } = require('electron')
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('download:error', { taskId, error })
    })
  })

  // 解析 URL
  ipcMain.handle('download:parse-url', async (_event: IpcMainInvokeEvent, url: string): Promise<VideoMetadata> => {
    return YtDlpRunner.parseUrl(url)
  })

  // 开始下载
  ipcMain.handle('download:start', async (_event: IpcMainInvokeEvent, config: DownloadTaskConfig): Promise<void> => {
    if (downloadManager) {
      downloadManager.startDownload(config)
    }
  })

  // 暂停下载
  ipcMain.handle('download:pause', async (_event: IpcMainInvokeEvent, taskId: string): Promise<void> => {
    downloadManager?.pauseTask(taskId)
  })

  // 继续下载
  ipcMain.handle('download:resume', async (_event: IpcMainInvokeEvent, taskId: string): Promise<void> => {
    downloadManager?.resumeTask(taskId)
  })

  // 取消下载
  ipcMain.handle('download:cancel', async (_event: IpcMainInvokeEvent, taskId: string): Promise<void> => {
    downloadManager?.cancelTask(taskId)
  })

  // 获取任务状态
  ipcMain.handle('download:status', async (_event: IpcMainInvokeEvent, taskId: string) => {
    return downloadManager?.getTaskState(taskId)
  })
}
```

- [ ] **Step 2: 更新 handlers.ts 导入并初始化通道**

编辑 `electron/ipc/handlers.ts`，在文件末尾添加：

```typescript
import '../download/YtDlpRunner'
import '../download/FFmpegRunner'
import '../download/DownloadManager'
import { initializeDownloadChannels } from './channels/downloadChannels'

// 初始化下载 IPC 通道
initializeDownloadChannels()
```

- [ ] **Step 3: 类型检查**

Run: `cd "d:/myCode/stream-fetch/stream-fetch" && npx tsc --noEmit`
Expected: 无 TypeScript 错误

- [ ] **Step 4: 提交**

```bash
cd "d:/myCode/stream-fetch/stream-fetch"
git add electron/ipc/channels/downloadChannels.ts electron/ipc/handlers.ts
git commit -m "feat: add download IPC channels and handlers"
```

---

## Task 7: 渲染进程 IPC 封装

**Files:**
- Create: `src/api/downloadApi.ts` - 渲染进程调用下载的 API 封装

- [ ] **Step 1: 创建 downloadApi.ts**

```typescript
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

const api = window.electronAPI

export const downloadApi = {
  parseUrl: (url: string): Promise<VideoMetadata> => {
    return new Promise((resolve, reject) => {
      // 通过 IPC 调用主进程
      const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null }
      if (ipcRenderer) {
        ipcRenderer.invoke('download:parse-url', url)
          .then(resolve)
          .catch(reject)
      } else {
        reject(new Error('Electron API not available'))
      }
    })
  },

  startDownload: (config: DownloadTaskConfig): Promise<void> => {
    const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null }
    if (ipcRenderer) {
      return ipcRenderer.invoke('download:start', config)
    }
    return Promise.reject(new Error('Electron API not available'))
  },

  pauseDownload: (taskId: string): Promise<void> => {
    const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null }
    if (ipcRenderer) {
      return ipcRenderer.invoke('download:pause', taskId)
    }
    return Promise.reject(new Error('Electron API not available'))
  },

  resumeDownload: (taskId: string): Promise<void> => {
    const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null }
    if (ipcRenderer) {
      return ipcRenderer.invoke('download:resume', taskId)
    }
    return Promise.reject(new Error('Electron API not available'))
  },

  cancelDownload: (taskId: string): Promise<void> => {
    const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null }
    if (ipcRenderer) {
      return ipcRenderer.invoke('download:cancel', taskId)
    }
    return Promise.reject(new Error('Electron API not available'))
  },

  onProgress: (callback: (progress: DownloadProgress) => void) => {
    const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null }
    if (ipcRenderer) {
      ipcRenderer.on('download:progress', (_event: any, data: DownloadProgress) => {
        callback(data)
      })
    }
  },

  onComplete: (callback: (taskId: string, outputPath: string) => void) => {
    const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null }
    if (ipcRenderer) {
      ipcRenderer.on('download:complete', (_event: any, data: { taskId: string; outputPath: string }) => {
        callback(data.taskId, data.outputPath)
      })
    }
  },

  onError: (callback: (taskId: string, error: string) => void) => {
    const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null }
    if (ipcRenderer) {
      ipcRenderer.on('download:error', (_event: any, data: { taskId: string; error: string }) => {
        callback(data.taskId, data.error)
      })
    }
  }
}
```

- [ ] **Step 2: 类型检查**

Run: `cd "d:/myCode/stream-fetch/stream-fetch" && npx tsc --noEmit src/api/downloadApi.ts`
Expected: 无 TypeScript 错误

- [ ] **Step 3: 提交**

```bash
cd "d:/myCode/stream-fetch/stream-fetch"
git add src/api/downloadApi.ts
git commit -m "feat: add download API wrapper for renderer process"
```

---

## Task 8: 更新 downloadStore 集成 IPC

**Files:**
- Modify: `src/stores/downloadStore.ts` - 添加 IPC 监听集成

- [ ] **Step 1: 更新 downloadStore.ts**

编辑 `src/stores/downloadStore.ts`，替换为完整实现：

```typescript
import { create } from 'zustand'
import { DownloadTask, VideoInfo } from '../types'
import { downloadApi, DownloadProgress } from '../api/downloadApi'

interface DownloadStore {
  tasks: DownloadTask[]
  isLoading: boolean
  error: string | null
  addTask: (videoInfo: VideoInfo, quality: string, format?: 'mp4' | 'mp3') => void
  updateTask: (id: string, updates: Partial<DownloadTask>) => void
  removeTask: (id: string) => void
  pauseTask: (id: string) => void
  resumeTask: (id: string) => void
  clearCompleted: () => void
  startDownload: (id: string) => Promise<void>
  cancelDownload: (id: string) => Promise<void>
  initIPCListeners: () => void
}

export const useDownloadStore = create<DownloadStore>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  initIPCListeners: () => {
    downloadApi.onProgress((progress: DownloadProgress) => {
      const { tasks } = get()
      const taskIndex = tasks.findIndex(t => t.id === progress.taskId)
      if (taskIndex !== -1) {
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
      }
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

  startDownload: async (id) => {
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
        outputPath: '', // 从设置中获取
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
```

- [ ] **Step 2: 更新 types/index.ts 添加 format 字段**

编辑 `src/types/index.ts`，在 `DownloadTask` 接口中添加 `format` 字段：

```typescript
// 下载任务
export interface DownloadTask {
  id: string
  videoInfo: VideoInfo
  quality: string
  format?: 'mp4' | 'mp3'  // 添加此行
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'failed'
  progress: number // 0-100
  speed: number // bytes/s
  downloaded: number // bytes
  total: number // bytes
  error?: string
}
```

- [ ] **Step 3: 类型检查**

Run: `cd "d:/myCode/stream-fetch/stream-fetch" && npx tsc --noEmit`
Expected: 无 TypeScript 错误

- [ ] **Step 4: 提交**

```bash
cd "d:/myCode/stream-fetch/stream-fetch"
git add src/stores/downloadStore.ts src/types/index.ts
git commit -m "feat: integrate downloadStore with IPC listeners"
```

---

## Task 9: 文件管理 - 保存策略

**Files:**
- Create: `electron/ipc/download/FileManager.ts`

- [ ] **Step 1: 创建 FileManager 类**

```typescript
// electron/ipc/download/FileManager.ts
import fs from 'fs'
import path from 'path'

export class FileManager {
  static async ensureDirectory(dirPath: string): Promise<void> {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
  }

  static async getUniqueFilename(dirPath: string, baseName: string, ext: string): Promise<string> {
    let filename = `${baseName}.${ext}`
    let counter = 1

    while (fs.existsSync(path.join(dirPath, filename))) {
      filename = `${baseName}_${counter}.${ext}`
      counter++
    }

    return path.join(dirPath, filename)
  }

  static async cleanupTempFiles(tempDir: string): Promise<void> {
    if (!fs.existsSync(tempDir)) return

    const files = fs.readdirSync(tempDir)
    for (const file of files) {
      const filePath = path.join(tempDir, file)
      const stat = fs.statSync(filePath)
      // 删除超过 24 小时的临时文件
      if (Date.now() - stat.mtimeMs > 24 * 60 * 60 * 1000) {
        fs.unlinkSync(filePath)
      }
    }
  }

  static getOutputPath(
    downloadPath: string,
    platform: string,
    title: string
  ): string {
    const date = new Date().toISOString().split('T')[0]
    const subDir = path.join(platform, date)
    const fullPath = path.join(downloadPath, subDir)

    // 清理文件名中的非法字符
    const cleanTitle = title.replace(/[<>:"/\\|?*]/g, '_').slice(0, 100)

    return path.join(fullPath, cleanTitle)
  }
}
```

- [ ] **Step 2: 类型检查**

Run: `cd "d:/myCode/stream-fetch/stream-fetch" && npx tsc --noEmit electron/ipc/download/FileManager.ts`
Expected: 无 TypeScript 错误

- [ ] **Step 3: 提交**

```bash
cd "d:/myCode/stream-fetch/stream-fetch"
git add electron/ipc/download/FileManager.ts
git commit -m "feat: add FileManager for path handling and cleanup"
```

---

## Task 10: 集成测试

- [ ] **Step 1: 验证所有文件存在**

Run:
```bash
cd "d:/myCode/stream-fetch/stream-fetch"
ls electron/ipc/download/
ls electron/ipc/channels/
ls src/api/
```

Expected: 所有新创建的文件都存在

- [ ] **Step 2: 类型检查完整项目**

Run: `cd "d:/myCode/stream-fetch/stream-fetch" && npx tsc --noEmit`
Expected: 无 TypeScript 错误

- [ ] **Step 3: 提交最终验证**

```bash
cd "d:/myCode/stream-fetch/stream-fetch"
git add -A
git commit -m "feat: module 3 core download engine complete"
```

---

## 验收标准检查清单

- [ ] `electron/ipc/download/YtDlpRunner.ts` - yt-dlp 进程管理，parseUrl 和 download 方法
- [ ] `electron/ipc/download/FFmpegRunner.ts` - FFmpeg 音视频合并和 MP3 转换
- [ ] `electron/ipc/download/ProgressParser.ts` - yt-dlp 输出进度解析
- [ ] `electron/ipc/download/DownloadManager.ts` - 下载队列管理，暂停/继续/取消
- [ ] `electron/ipc/download/FileManager.ts` - 文件路径处理和临时文件清理
- [ ] `electron/ipc/channels/downloadChannels.ts` - IPC 通道定义和处理器
- [ ] `src/api/downloadApi.ts` - 渲染进程 IPC 封装
- [ ] `src/stores/downloadStore.ts` - 集成 IPC 监听的下载状态管理
- [ ] 所有 TypeScript 类型检查通过
- [ ] Git 提交记录完整

---

## 注意事项

1. **yt-dlp 和 FFmpeg 路径**: 在开发环境使用 `resources/` 目录，打包后使用 `process.resourcesPath`
2. **进度解析**: yt-dlp 输出格式可能变化，需要处理多种异常情况
3. **进程清理**: 必须正确处理子进程退出，避免僵尸进程
4. **IPC 通信**: 使用 `ipcMain.handle` 和 `ipcRenderer.invoke` 配对
5. **并发控制**: 默认 3 个并发下载任务