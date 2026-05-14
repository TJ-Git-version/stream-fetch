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

  static async cleanupTempFiles(tempDir: string, maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<void> {
    if (!fs.existsSync(tempDir)) return

    const files = fs.readdirSync(tempDir)
    for (const file of files) {
      const filePath = path.join(tempDir, file)
      try {
        const stat = fs.statSync(filePath)
        if (Date.now() - stat.mtimeMs > maxAgeMs) {
          fs.unlinkSync(filePath)
          console.log(`[FileManager] Cleaned up temp file: ${filePath}`)
        }
      } catch (err) {
        console.error(`[FileManager] Failed to clean up ${filePath}:`, err)
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

  static sanitizeFilename(filename: string): string {
    return filename.replace(/[<>:"/\\|?*]/g, '_').slice(0, 100)
  }

  static getFileSize(filePath: string): number {
    try {
      const stat = fs.statSync(filePath)
      return stat.size
    } catch {
      return 0
    }
  }

  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath, fs.constants.F_OK)
      return true
    } catch {
      return false
    }
  }
}