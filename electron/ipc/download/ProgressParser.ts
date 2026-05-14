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
  private static readonly YTDLP_PROGRESS_REGEX =
    /\[download\]\s+(\d+(?:\.\d+)?)%\s+of\s+(\d+(?:\.\d+)?)([KMGT]iB)?\s+at\s+(\d+(?:\.\d+)?)([KMGT]?iB)?\/s\s+ETA\s+(\d+):(\d+):(\d+)/

  // 备用格式: 1234567 bytes 10.5M/s 00:05
  private static readonly ALT_PROGRESS_REGEX =
    /^(\d+)\s+bytes\s+([\d.]+)([KMGT])?\/s\s+(\d+):(\d+)$/

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

  static parseLine(line: string): ParsedProgress | null {
    return this.parseYtDlpLine(line) || this.parseAltFormat(line)
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
      'G': 1000 * 1000 * 1000,
      'T': 1000 * 1000 * 1000 * 1000
    }

    return num * (unit ? (multipliers[unit[0].toUpperCase()] || 1) : 1)
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