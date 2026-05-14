import { ipcMain } from 'electron'
import { dialog } from 'electron'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

// 获取应用版本
ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

// 选择下载目录
ipcMain.handle('select-download-path', async () => {
  const result = await dialog.showOpenDialog({
    title: '选择下载目录',
    properties: ['openDirectory', 'createDirectory'],
    defaultPath: app.getPath('downloads')
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  return result.filePaths[0]
})

// 获取设置
ipcMain.handle('get-settings', () => {
  const settingsPath = path.join(app.getPath('userData'), 'settings.json')
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Failed to read settings:', error)
  }
  return {
    downloadPath: app.getPath('downloads'),
    maxConcurrent: 3,
    language: 'zh-CN',
    theme: 'dark'
  }
})

// 保存设置
ipcMain.handle('save-settings', async (_event, settings) => {
  const settingsPath = path.join(app.getPath('userData'), 'settings.json')
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8')
    return true
  } catch (error) {
    console.error('Failed to save settings:', error)
    return false
  }
})

// 初始化下载 IPC 通道
import './channels/downloadChannels'