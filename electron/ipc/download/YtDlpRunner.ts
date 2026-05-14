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

export interface DownloadProgress {
  downloaded: number // bytes
  speed: number // bytes/s
  eta: string // HH:MM:SS format
  percent: number
}

export class YtDlpRunner {
  private static getExecutablePath(): string {
    const isDev = !app.isPackaged
    const basePath = isDev
      ? path.join(__dirname, '../../../resources/yt-dlp')
      : path.join(process.resourcesPath!, 'resources/yt-dlp')

    const exeName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp'
    return path.join(basePath, exeName)
  }

  static async parseUrl(url: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const exePath = this.getExecutablePath()
      const args = ['--dump-json', '--no-warnings', url]

      console.log('[YtDlpRunner] Executable path:', exePath)
      console.log('[YtDlpRunner] Parsing URL:', url)

      const proc = spawn(exePath, args)

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
          console.error('[YtDlpRunner] Parse failed, stderr:', stderr)
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

      proc.on('error', (err) => {
        console.error('[YtDlpRunner] Spawn error:', err)
        reject(err)
      })
    })
  }

  static async download(
    options: YtDlpOptions,
    onProgress: (progress: DownloadProgress) => void
  ): Promise<string> {
    const { url, outputPath, quality = 'best', format = 'mp4' } = options

    const formatArg = format === 'mp3'
      ? 'bestaudio'
      : quality === 'best'
        ? 'bestvideo+bestaudio'
        : `bestvideo[height<=${quality.replace('p', '')}]+bestaudio`

    const outputTemplate = path.join(outputPath, '%(title)s-%(id)s.%(ext)s')

    const args = [
      '-f', formatArg,
      '--output', outputTemplate,
      '--newline',
      url
    ]

    return new Promise((resolve, reject) => {
      const exePath = this.getExecutablePath()
      console.log('[YtDlpRunner] Starting download with:', exePath, args)

      const proc = spawn(exePath, args)
      let lastProgress = 0

      proc.stdout?.on('data', (data) => {
        const line = data.toString().trim()
        if (line) {
          const progress = this.parseProgressLine(line)
          if (progress) {
            lastProgress = progress.downloaded
            onProgress(progress)
          }
        }
      })

      proc.stderr?.on('data', (data) => {
        console.error('[YtDlpRunner] stderr:', data.toString())
      })

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(outputPath)
        } else {
          reject(new Error(`yt-dlp download failed with code ${code}`))
        }
      })

      proc.on('error', reject)
    })
  }

  private static parseProgressLine(line: string): DownloadProgress | null {
    // 匹配格式: 1234567 bytes 10.5M/s 00:05 或 [download] 0.0% of 10.00MiB at 10.00MiB/s ETA 00:00:05
    const altMatch = line.match(/^(\d+)\s+bytes\s+([\d.]+)([KMGT])?\/s\s+(\d+):(\d+)/)
    if (altMatch) {
      return {
        downloaded: parseInt(altMatch[1]) || 0,
        speed: this.parseSpeed(altMatch[2], altMatch[3]),
        eta: `${altMatch[4]}:${altMatch[5]}:00`,
        percent: 0
      }
    }

    const ytdlpMatch = line.match(/\[download\]\s+(\d+(?:\.\d+)?)%\s+of\s+(\d+(?:\.\d+)?)([KMGT]iB)?\s+at\s+(\d+(?:\.\d+)?)([KMGT]?iB)?\/s\s+ETA\s+(\d+):(\d+):(\d+)/)
    if (ytdlpMatch) {
      return {
        downloaded: 0,
        speed: this.parseSize(ytdlpMatch[4], ytdlpMatch[5]),
        eta: `${ytdlpMatch[6]}:${ytdlpMatch[7]}:${ytdlpMatch[8]}`,
        percent: parseFloat(ytdlpMatch[1])
      }
    }

    return null
  }

  private static parseSpeed(value: string, unit?: string): number {
    const num = parseFloat(value)
    const multipliers: Record<string, number> = {
      'K': 1000,
      'M': 1000 * 1000,
      'G': 1000 * 1000 * 1000,
      'T': 1000 * 1000 * 1000 * 1000
    }
    return num * (unit ? (multipliers[unit[0].toUpperCase()] || 1) : 1)
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