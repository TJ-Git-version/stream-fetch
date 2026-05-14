# 模块1：脚手架 - 项目初始化实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立完整的 Electron + React + Vite + TypeScript 项目脚手架，能够通过 `npm run dev` 启动开发服务器，Electron 窗口正常显示 React 页面。

**Architecture:** 采用 Electron 主进程 + React 渲染进程的经典架构。主进程负责窗口管理和系统交互，渲染进程使用 Vite 开发服务器实现快速热更新。preload 脚本提供安全的 IPC 桥接，避免直接暴露 Node.js API 到渲染进程。

**Tech Stack:** Electron 28+, React 18+, Vite 5+, TypeScript 5+, electron-builder

---

## 文件结构

```
stream-fetch/
├── electron/                    # Electron 主进程
│   ├── main.ts                  # 入口，窗口管理生命周期
│   ├── preload.ts               # 预加载脚本，安全 IPC 桥接
│   └── ipc/                     # IPC 处理模块
│       └── handlers.ts          # IPC 处理器注册
├── src/                         # React 渲染进程
│   ├── App.tsx                  # 根组件
│   ├── main.tsx                 # 入口
│   └── components/              # 组件目录（空，后续模块填充）
├── resources/                   # 外部资源
│   ├── yt-dlp/                  # yt-dlp 可执行文件
│   └── ffmpeg/                   # ffmpeg 可执行文件
├── package.json
├── electron-builder.json
├── tsconfig.json
└── vite.config.ts
```

---

## Task 1: 项目初始化

**Files:**
- Create: `package.json`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "stream-fetch",
  "version": "0.1.0",
  "description": "跨平台视频下载工具",
  "main": "dist-electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build && electron-builder",
    "preview": "vite preview",
    "electron:dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && electron .\"",
    "typecheck": "tsc --noEmit"
  },
  "keywords": ["video", "downloader", "electron"],
  "author": "",
  "license": "MIT"
}
```

- [ ] **Step 2: 安装项目依赖**

Run: `cd "d:/myCode/stream-fetch/跨平台视频下载工具" && npm init -y`
Expected: package.json 已创建，version 为 0.1.0

- [ ] **Step 3: 安装 Electron 和 electron-builder**

Run: `cd "d:/myCode/stream-fetch/跨平台视频下载工具" && npm install --save-dev electron electron-builder`
Expected: dependencies 中包含 electron 和 electron-builder

- [ ] **Step 4: 安装 React + Vite + TypeScript**

Run: `cd "d:/myCode/stream-fetch/跨平台视频下载工具" && npm install --save react react-dom && npm install --save-dev @types/react @types/react-dom typescript vite @vitejs/plugin-react`
Expected: dependencies 中包含 react react-dom，devDependencies 中包含 typescript vite @vitejs/plugin-react

- [ ] **Step 5: 安装开发工具依赖**

Run: `cd "d:/myCode/stream-fetch/跨平台视频下载工具" && npm install --save-dev concurrently wait-on`
Expected: devDependencies 中包含 concurrently wait-on

- [ ] **Step 6: 提交**

```bash
cd "d:/myCode/stream-fetch/跨平台视频下载工具"
git init
git add package.json
git commit -m "初始化 Electron + React + Vite + TypeScript 项目"
```

---

## Task 2: TypeScript 配置

**Files:**
- Create: `tsconfig.json`

- [ ] **Step 1: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 2: 创建 tsconfig.node.json（用于 Vite 配置文件）**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts", "electron/**/*.ts"]
}
```

- [ ] **Step 3: 提交**

```bash
cd "d:/myCode/stream-fetch/跨平台视频下载工具"
git add tsconfig.json tsconfig.node.json
git commit -m "添加 TypeScript 配置文件"
```

---

## Task 3: Vite 配置

**Files:**
- Create: `vite.config.ts`

- [ ] **Step 1: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    strictPort: true
  }
})
```

- [ ] **Step 2: 验证 Vite 配置**

Run: `cd "d:/myCode/stream-fetch/跨平台视频下载工具" && npx tsc --noEmit vite.config.ts`
Expected: 无编译错误（允许 "cannot find module" 警告，bundler 会处理）

- [ ] **Step 3: 提交**

```bash
cd "d:/myCode/stream-fetch/跨平台视频下载工具"
git add vite.config.ts
git commit -m "添加 Vite 配置，包含 React 插件和路径别名"
```

---

## Task 4: Electron 主进程

**Files:**
- Create: `electron/main.ts`
- Create: `electron/preload.ts`
- Create: `electron/ipc/handlers.ts`

- [ ] **Step 1: 创建 electron/main.ts**

```typescript
import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'

// 保持窗口引用的全局变量
let mainWindow: BrowserWindow | null = null

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    },
    show: false
  })

  // 窗口准备好显示时再显示，避免白屏闪烁
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // 加载页面
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // 窗口关闭时清空引用
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// 应用准备就绪时创建窗口
app.whenReady().then(() => {
  createWindow()

  // macOS 特性：点击 dock 图标时如果没有窗口则创建一个
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// 所有窗口关闭时退出（macOS 除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC 处理器
import './ipc/handlers'
```

- [ ] **Step 2: 创建 electron/preload.ts**

```typescript
import { contextBridge, ipcRenderer } from 'electron'

// 定义暴露给渲染进程的 API 类型
export interface ElectronAPI {
  platform: string
  versions: {
    node: string
    chrome: string
    electron: string
  }
}

// 暴露安全的 API 到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
} as ElectronAPI)
```

- [ ] **Step 3: 创建 electron/ipc/handlers.ts**

```typescript
import { ipcMain } from 'electron'

// 注册基础 IPC 处理器
ipcMain.handle('get-app-version', () => {
  const { app } = require('electron')
  return app.getVersion()
})
```

- [ ] **Step 4: 更新 tsconfig.node.json 以包含 electron 目录**

编辑 `tsconfig.node.json`，将 `electron/**/*.ts` 添加到 include 数组中。

- [ ] **Step 5: 提交**

```bash
cd "d:/myCode/stream-fetch/跨平台视频下载工具"
git add electron/main.ts electron/preload.ts electron/ipc/handlers.ts tsconfig.node.json
git commit -m "添加 Electron 主进程，包含窗口管理和 IPC 桥接"
```

---

## Task 5: React 渲染进程

**Files:**
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/vite-env.d.ts`
- Create: `index.html`

- [ ] **Step 1: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' http://localhost:*">
    <title>Stream Fetch - 视频下载工具</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: 创建 src/vite-env.d.ts**

```typescript
/// <reference types="vite/client" />

interface ElectronAPI {
  platform: string
  versions: {
    node: string
    chrome: string
    electron: string
  }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
```

- [ ] **Step 3: 创建 src/main.tsx**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 4: 创建 src/App.tsx**

```tsx
import React from 'react'

function App(): JSX.Element {
  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Stream Fetch</h1>
      <p>视频下载工具</p>
      <div id="app-info">
        <p>Platform: {window.electronAPI?.platform || 'Web'}</p>
        <p>Electron: {window.electronAPI?.versions?.electron || 'N/A'}</p>
        <p>Node: {window.electronAPI?.versions?.node || 'N/A'}</p>
      </div>
    </div>
  )
}

export default App
```

- [ ] **Step 5: 验证 React 页面编译**

Run: `cd "d:/myCode/stream-fetch/跨平台视频下载工具" && npx tsc --noEmit`
Expected: 无 TypeScript 错误

- [ ] **Step 6: 提交**

```bash
cd "d:/myCode/stream-fetch/跨平台视频下载工具"
git add index.html src/main.tsx src/App.tsx src/vite-env.d.ts
git commit -m "添加 React 入口文件和 App 组件"
```

---

## Task 6: 外部资源目录结构

**Files:**
- Create: `resources/yt-dlp/.gitkeep`
- Create: `resources/ffmpeg/.gitkeep`

- [ ] **Step 1: 创建 resources 目录结构**

```bash
mkdir -p "d:/myCode/stream-fetch/跨平台视频下载工具/resources/yt-dlp"
mkdir -p "d:/myCode/stream-fetch/跨平台视频下载工具/resources/ffmpeg"
touch "d:/myCode/stream-fetch/跨平台视频下载工具/resources/yt-dlp/.gitkeep"
touch "d:/myCode/stream-fetch/跨平台视频下载工具/resources/ffmpeg/.gitkeep"
```

- [ ] **Step 2: 创建 resources/README.md**

```markdown
# 外部资源

本目录存放项目依赖的外部可执行文件。

## yt-dlp

用于下载视频内容。将 `yt-dlp.exe`（Windows）或 `yt-dlp`（macOS/Linux）放置于此目录。

## ffmpeg

用于处理视频格式。将 `ffmpeg.exe`（Windows）或 `ffmpeg`（macOS/Linux）放置于此目录。

## 下载地址

- yt-dlp: https://github.com/yt-dlp/yt-dlp/releases
- ffmpeg: https://ffmpeg.org/download.html
```

- [ ] **Step 3: 提交**

```bash
cd "d:/myCode/stream-fetch/跨平台视频下载工具"
git add resources/
git commit -m "添加 yt-dlp 和 ffmpeg 资源目录结构"
```

---

## Task 7: electron-builder 配置

**Files:**
- Create: `electron-builder.json`

- [ ] **Step 1: 创建 electron-builder.json**

```json
{
  "appId": "com.streamfetch.app",
  "productName": "Stream Fetch",
  "directories": {
    "output": "release"
  },
  "files": [
    "dist/**/*",
    "dist-electron/**/*",
    "resources/**/*"
  ],
  "extraResources": [
    {
      "from": "resources",
      "to": "resources"
    }
  ],
  "win": {
    "target": [
      {
        "target": "nsis",
        "arch": ["x64"]
      }
    ],
    "artifactName": "${productName}-${version}-win-${arch}.${ext}"
  },
  "mac": {
    "target": ["dmg"],
    "artifactName": "${productName}-${version}-mac.${ext}"
  },
  "linux": {
    "target": ["AppImage"],
    "artifactName": "${productName}-${version}-linux.${ext}"
  }
}
```

- [ ] **Step 2: 更新 package.json 添加 electron 相关配置**

编辑 `package.json`，添加/更新以下字段：

```json
{
  "main": "dist-electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build && electron-builder",
    "preview": "vite preview",
    "electron:dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && electron .\"",
    "typecheck": "tsc --noEmit",
    "electron:build": "npm run build && electron-builder"
  }
}
```

- [ ] **Step 3: 添加构建输出目录到 .gitignore**

创建 `.gitignore` 文件：

```
node_modules/
dist/
dist-electron/
release/
*.log
.DS_Store
```

- [ ] **Step 4: 提交**

```bash
cd "d:/myCode/stream-fetch/跨平台视频下载工具"
git add electron-builder.json .gitignore
git commit -m "添加 electron-builder 跨平台构建配置"
```

---

## Task 8: 验证构建

- [ ] **Step 1: 安装依赖**

Run: `cd "d:/myCode/stream-fetch/跨平台视频下载工具" && npm install`
Expected: node_modules 目录已创建，所有依赖安装完成

- [ ] **Step 2: 类型检查**

Run: `cd "d:/myCode/stream-fetch/跨平台视频下载工具" && npm run typecheck`
Expected: 无 TypeScript 错误输出

- [ ] **Step 3: 启动开发服务器（后台运行）**

Run: `cd "d:/myCode/stream-fetch/跨平台视频下载工具" && npm run dev`
Expected: 输出包含 "Local: http://localhost:5173"

- [ ] **Step 4: 验证页面可访问**

在浏览器访问 http://localhost:5173，应能看到 "Stream Fetch" 标题

- [ ] **Step 5: 停止开发服务器**

按 Ctrl+C 停止 Vite 开发服务器

- [ ] **Step 6: 提交验证完成**

```bash
cd "d:/myCode/stream-fetch/跨平台视频下载工具"
git add -A
git commit -m "验证脚手架构建和开发服务器"
```

---

## 验收标准检查清单

- [ ] `npm run dev` 启动开发服务器成功
- [ ] Electron 窗口正常打开
- [ ] React 页面在 Electron 中正确显示
- [ ] 目录结构符合设计（electron/, src/, resources/）
- [ ] TypeScript 类型检查通过
- [ ] Git 提交记录完整

---

## 注意事项

1. **Node.js 版本**：确保 Node.js >= 18
2. **Electron 版本**：Electron 28+ 与 Node 18+ 兼容
3. **preload 安全**：contextIsolation 必须为 true，nodeIntegration 必须为 false
4. **跨平台路径**：使用 path.join 处理文件路径，避免硬编码斜杠