// electron/ipc/download/FFmpegRunner.ts
import { spawn } from 'child_process'
import path from 'path'
import { app } from 'electron'

export class FFmpegRunner {
  private static getExecutablePath(): string {
    const isDev = !app.isPackaged
    const basePath = isDev
      ? path.join(__dirname, '../../../resources/ffmpeg')
      : path.join(process.resourcesPath!, 'resources/ffmpeg')

    const exeName = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
    return path.join(basePath, exeName)
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
      const exePath = this.getExecutablePath()
      console.log('[FFmpegRunner] Merging audio/video:', exePath, args)

      const proc = spawn(exePath, args)

      let duration = 0

      proc.stderr?.on('data', (data) => {
        const str = data.toString()
        // 解析 Duration: 00:00:30.00
        const durationMatch = str.match(/Duration:\s*(\d+):(\d+):(\d+)/)
        if (durationMatch && !duration) {
          duration = parseInt(durationMatch[1]) * 3600 +
                     parseInt(durationMatch[2]) * 60 +
                     parseInt(durationMatch[3])
        }

        // 解析进度 time=00:00:10.00
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
      const exePath = this.getExecutablePath()
      console.log('[FFmpegRunner] Converting to MP3:', exePath, args)

      const proc = spawn(exePath, args)

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