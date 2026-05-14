import { ipcMain } from 'electron'

// 注册基础 IPC 处理器
ipcMain.handle('get-app-version', () => {
  const { app } = require('electron')
  return app.getVersion()
})