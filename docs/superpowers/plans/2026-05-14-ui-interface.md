# 模块2：UI - 界面开发实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成 stream-fetch 项目的 React 界面开发，包括布局组件、核心页面、状态管理和 IPC 通信协议定义。

**Architecture:** 采用 Ant Design 5.x 作为 UI 组件库，Zustand 作为状态管理方案。UI 与核心逻辑通过 IPC 解耦，渲染进程负责展示和用户交互，主进程负责下载逻辑。组件采用原子设计原则，从底层组件逐步构建复杂界面。

**Tech Stack:** React 18+, Ant Design 5.x, Zustand, TypeScript 5+

---

## 文件结构

```
src/
├── components/              # 原子组件
│   ├── common/              # 通用组件
│   │   ├── Button.tsx
│   │   └── Input.tsx
│   ├── video/               # 视频相关组件
│   │   ├── VideoCard.tsx
│   │   ├── VideoInfo.tsx
│   │   └── QualitySelect.tsx
│   └── download/            # 下载相关组件
│       ├── ProgressBar.tsx
│       ├── DownloadQueue.tsx
│       └── DownloadItem.tsx
├── pages/                   # 页面组件
│   ├── Home.tsx             # 首页 - 链接输入
│   ├── Downloads.tsx        # 下载列表页
│   └── Settings.tsx          # 设置页
├── layouts/                 # 布局组件
│   ├── MainLayout.tsx        # 主布局
│   ├── Header.tsx            # 顶部导航栏
│   ├── Sidebar.tsx          # 侧边栏
│   └── Footer.tsx           # 底部状态栏
├── stores/                  # Zustand 状态管理
│   ├── downloadStore.ts      # 下载任务状态
│   ├── settingsStore.ts      # 应用设置状态
│   └── uiStore.ts            # UI 状态
├── hooks/                   # 自定义 Hooks
│   └── useIPC.ts             # IPC 通信 Hook
├── i18n/                    # 国际化
│   ├── index.ts
│   ├── zhCN.ts
│   └── enUS.ts
├── types/                   # 类型定义
│   └── index.ts
├── App.tsx                  # 主应用组件（更新）
└── main.tsx                 # 入口文件（更新）
```

---

## Task 1: UI 框架选型与安装

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安装 Ant Design 和 Zustand**

Run: `cd "d:/myCode/stream-fetch/stream-fetch" && npm install antd zustand i18next react-i18next`
Expected: dependencies 中包含 antd, zustand, i18next, react-i18next

- [ ] **Step 2: 提交**

```bash
cd "d:/myCode/stream-fetch/stream-fetch"
git add package.json
git commit -m "添加 Ant Design、Zustand 和 i18next 依赖"
```

---

## Task 2: 类型定义

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: 创建类型定义**

```typescript
// 视频信息
export interface VideoInfo {
  id: string
  title: string
  author: string
  duration: number // 秒
  thumbnail: string
  url: string
  qualities: Quality[]
}

// 清晰度选项
export interface Quality {
  label: string
  value: string
  size?: number // bytes
}

// 下载任务
export interface DownloadTask {
  id: string
  videoInfo: VideoInfo
  quality: string
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'failed'
  progress: number // 0-100
  speed: number // bytes/s
  downloaded: number // bytes
  total: number // bytes
  error?: string
}

// 应用设置
export interface AppSettings {
  downloadPath: string
  maxConcurrent: number
  language: 'zh-CN' | 'en-US'
  theme: 'light' | 'dark' | 'auto'
}

// IPC 通道名称
export const IPC_CHANNELS = {
  // 下载相关
  PARSE_URL: 'parse-url',
  START_DOWNLOAD: 'start-download',
  PAUSE_DOWNLOAD: 'pause-download',
  RESUME_DOWNLOAD: 'resume-download',
  CANCEL_DOWNLOAD: 'cancel-download',
  DOWNLOAD_PROGRESS: 'download-progress',
  DOWNLOAD_COMPLETE: 'download-complete',
  DOWNLOAD_ERROR: 'download-error',
  // 设置相关
  GET_SETTINGS: 'get-settings',
  SAVE_SETTINGS: 'save-settings',
  SELECT_PATH: 'select-path',
  // 应用相关
  GET_APP_VERSION: 'get-app-version',
} as const
```

- [ ] **Step 2: 提交**

```bash
cd "d:/myCode/stream-fetch/stream-fetch"
git add src/types/index.ts
git commit -m "添加 TypeScript 类型定义和 IPC 通道常量"
```

---

## Task 3: Zustand 状态管理

**Files:**
- Create: `src/stores/downloadStore.ts`
- Create: `src/stores/settingsStore.ts`
- Create: `src/stores/uiStore.ts`

- [ ] **Step 1: 创建下载状态管理 store**

```typescript
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
```

- [ ] **Step 2: 创建设置状态管理 store**

```typescript
import { create } from 'zustand'
import { AppSettings } from '../types'

interface SettingsStore {
  settings: AppSettings
  updateSettings: (updates: Partial<AppSettings>) => void
  resetSettings: () => void
}

const defaultSettings: AppSettings = {
  downloadPath: '',
  maxConcurrent: 3,
  language: 'zh-CN',
  theme: 'dark',
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: defaultSettings,
  updateSettings: (updates) =>
    set((state) => ({
      settings: { ...state.settings, ...updates },
    })),
  resetSettings: () => set({ settings: defaultSettings }),
}))
```

- [ ] **Step 3: 创建 UI 状态管理 store**

```typescript
import { create } from 'zustand'

type FilterStatus = 'all' | 'downloading' | 'completed' | 'failed'

interface UIStore {
  sidebarCollapsed: boolean
  activeFilter: FilterStatus
  setSidebarCollapsed: (collapsed: boolean) => void
  setActiveFilter: (filter: FilterStatus) => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarCollapsed: false,
  activeFilter: 'all',
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setActiveFilter: (filter) => set({ activeFilter: filter }),
}))
```

- [ ] **Step 4: 提交**

```bash
cd "d:/myCode/stream-fetch/stream-fetch"
git add src/stores/downloadStore.ts src/stores/settingsStore.ts src/stores/uiStore.ts
git commit -m "添加 Zustand 状态管理 stores"
```

---

## Task 4: 国际化配置

**Files:**
- Create: `src/i18n/index.ts`
- Create: `src/i18n/zhCN.ts`
- Create: `src/i18n/enUS.ts`

- [ ] **Step 1: 创建中文语言包**

```typescript
export const zhCN = {
  common: {
    confirm: '确认',
    cancel: '取消',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    close: '关闭',
    loading: '加载中...',
    error: '错误',
    success: '成功',
  },
  nav: {
    home: '首页',
    downloads: '下载列表',
    settings: '设置',
  },
  home: {
    title: '视频下载',
    placeholder: '请输入视频链接',
    parse: '解析',
    history: '历史记录',
    noHistory: '暂无历史记录',
  },
  download: {
    title: '下载列表',
    all: '全部',
    downloading: '下载中',
    completed: '已完成',
    failed: '失败',
    pending: '等待中',
    paused: '已暂停',
    speed: '速度',
    remaining: '剩余时间',
    pause: '暂停',
    resume: '继续',
    cancel: '取消',
    clearCompleted: '清除已完成',
    pauseAll: '暂停全部',
    resumeAll: '继续全部',
    noDownloads: '暂无下载任务',
    quality: '清晰度',
    startDownload: '开始下载',
  },
  settings: {
    title: '设置',
    downloadPath: '下载目录',
    selectPath: '选择目录',
    maxConcurrent: '最大并发数',
    language: '语言',
    theme: '主题',
    themeLight: '浅色',
    themeDark: '深色',
    themeAuto: '自动',
    about: '关于',
    version: '版本',
  },
  video: {
    author: '作者',
    duration: '时长',
    size: '大小',
  },
}
```

- [ ] **Step 2: 创建英文语言包**

```typescript
export const enUS = {
  common: {
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
  },
  nav: {
    home: 'Home',
    downloads: 'Downloads',
    settings: 'Settings',
  },
  home: {
    title: 'Video Download',
    placeholder: 'Enter video URL',
    parse: 'Parse',
    history: 'History',
    noHistory: 'No history',
  },
  download: {
    title: 'Downloads',
    all: 'All',
    downloading: 'Downloading',
    completed: 'Completed',
    failed: 'Failed',
    pending: 'Pending',
    paused: 'Paused',
    speed: 'Speed',
    remaining: 'Remaining',
    pause: 'Pause',
    resume: 'Resume',
    cancel: 'Cancel',
    clearCompleted: 'Clear Completed',
    pauseAll: 'Pause All',
    resumeAll: 'Resume All',
    noDownloads: 'No downloads',
    quality: 'Quality',
    startDownload: 'Start Download',
  },
  settings: {
    title: 'Settings',
    downloadPath: 'Download Path',
    selectPath: 'Select Path',
    maxConcurrent: 'Max Concurrent',
    language: 'Language',
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeAuto: 'Auto',
    about: 'About',
    version: 'Version',
  },
  video: {
    author: 'Author',
    duration: 'Duration',
    size: 'Size',
  },
}
```

- [ ] **Step 3: 创建 i18n 配置**

```typescript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { zhCN } from './zhCN'
import { enUS } from './enUS'

i18n.use(initReactI18next).init({
  resources: {
    'zh-CN': { translation: zhCN },
    'en-US': { translation: enUS },
  },
  lng: 'zh-CN',
  fallbackLng: 'en-US',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
```

- [ ] **Step 4: 更新 main.tsx 引入 i18n**

编辑 `src/main.tsx`:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import App from './App'
import './i18n'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN}>
      <App />
    </ConfigProvider>
  </React.StrictMode>
)
```

- [ ] **Step 5: 提交**

```bash
cd "d:/myCode/stream-fetch/stream-fetch"
git add src/i18n/index.ts src/i18n/zhCN.ts src/i18n/enUS.ts src/main.tsx
git commit -m "添加国际化配置，支持中英文切换"
```

---

## Task 5: 布局组件

**Files:**
- Create: `src/layouts/MainLayout.tsx`
- Create: `src/layouts/Header.tsx`
- Create: `src/layouts/Sidebar.tsx`
- Create: `src/layouts/Footer.tsx`

- [ ] **Step 1: 创建顶部导航栏**

```typescript
import React from 'react'
import { Layout, Typography, Space } from 'antd'
import { GithubOutlined } from '@ant-design/icons'

const { Header } = Layout
const { Title } = Typography

export const AppHeader: React.FC = () => {
  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#001529',
        padding: '0 24px',
      }}
    >
      <Title level={4} style={{ color: '#fff', margin: 0 }}>
        Stream Fetch
      </Title>
      <Space>
        <GithubOutlined style={{ fontSize: 20, color: '#fff' }} />
      </Space>
    </Header>
  )
}
```

- [ ] **Step 2: 创建侧边栏**

```typescript
import React from 'react'
import { Layout, Menu } from 'antd'
import { HomeOutlined, DownloadOutlined, SettingOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

const { Sider } = Layout

interface SidebarProps {
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
}

export const AppSidebar: React.FC<SidebarProps> = ({ collapsed, onCollapse }) => {
  const { t } = useTranslation()
  const items = [
    { key: 'home', icon: <HomeOutlined />, label: t('nav.home') },
    { key: 'downloads', icon: <DownloadOutlined />, label: t('nav.downloads') },
    { key: 'settings', icon: <SettingOutlined />, label: t('nav.settings') },
  ]

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      style={{ background: '#001529' }}
    >
      <Menu
        theme="dark"
        mode="inline"
        defaultSelectedKeys={['home']}
        items={items}
        style={{ marginTop: 8 }}
      />
    </Sider>
  )
}
```

- [ ] **Step 3: 创建底部状态栏**

```typescript
import React from 'react'
import { Layout, Typography, Space } from 'antd'

const { Footer } = Layout
const { Text } = Typography

export const AppFooter: React.FC = () => {
  return (
    <Footer style={{ padding: '8px 24px', background: '#001529' }}>
      <Space>
        <Text style={{ color: '#fff' }}>Stream Fetch v0.1.0</Text>
      </Space>
    </Footer>
  )
}
```

- [ ] **Step 4: 创建主布局**

```typescript
import React, { useState } from 'react'
import { Layout } from 'antd'
import { Outlet } from 'react-router-dom'
import { AppHeader } from './Header'
import { AppSidebar } from './Sidebar'
import { AppFooter } from './Footer'

export const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppHeader />
      <Layout>
        <AppSidebar collapsed={collapsed} onCollapse={setCollapsed} />
        <Layout.Content style={{ padding: 24, background: '#141414' }}>
          <Outlet />
        </Layout.Content>
      </Layout>
      <AppFooter />
    </Layout>
  )
}
```

- [ ] **Step 5: 提交**

```bash
cd "d:/myCode/stream-fetch/stream-fetch"
git add src/layouts/Header.tsx src/layouts/Sidebar.tsx src/layouts/Footer.tsx src/layouts/MainLayout.tsx
git commit -m "添加布局组件：Header、Sidebar、Footer、MainLayout"
```

---

## Task 6: 首页 - 链接输入

**Files:**
- Create: `src/pages/Home.tsx`

- [ ] **Step 1: 创建首页组件**

```typescript
import React, { useState } from 'react'
import { Card, Input, Button, Space, Typography, message } from 'antd'
import { DownloadOutlined, HistoryOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

const { Title, Text } = Typography

export const Home: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const handleParse = async () => {
    if (!url.trim()) {
      message.warning(t('home.placeholder'))
      return
    }
    setLoading(true)
    try {
      // IPC 调用解析
      const result = await window.electronAPI?.parseUrl?.(url)
      if (result) {
        message.success(t('common.success'))
        navigate('/downloads')
      }
    } catch {
      message.error(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Title level={2}>{t('home.title')}</Title>
          <Input.Search
            size="large"
            placeholder={t('home.placeholder')}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onSearch={handleParse}
            enterButton={
              <Button type="primary" icon={<DownloadOutlined />} loading={loading}>
                {t('home.parse')}
              </Button>
            }
          />
          <Space>
            <HistoryOutlined />
            <Text type="secondary">{t('home.history')}</Text>
          </Space>
        </Space>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: 提交**

```bash
cd "d:/myCode/stream-fetch/stream-fetch"
git add src/pages/Home.tsx
git commit -m "添加首页组件：链接输入和历史记录"
```

---

## Task 7: 下载列表页

**Files:**
- Create: `src/pages/Downloads.tsx`
- Create: `src/components/download/DownloadItem.tsx`
- Create: `src/components/download/DownloadQueue.tsx`

- [ ] **Step 1: 创建下载项组件**

```typescript
import React from 'react'
import { Card, Progress, Space, Button, Typography, Tag } from 'antd'
import { PauseOutlined, PlayOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { DownloadTask } from '../../types'

const { Text } = Typography

interface DownloadItemProps {
  task: DownloadTask
  onPause: (id: string) => void
  onResume: (id: string) => void
  onCancel: (id: string) => void
  onRemove: (id: string) => void
}

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export const DownloadItem: React.FC<DownloadItemProps> = ({
  task,
  onPause,
  onResume,
  onCancel,
  onRemove,
}) => {
  const { t } = useTranslation()
  const remaining = task.speed > 0 ? (task.total - task.downloaded) / task.speed : 0

  const statusColor: Record<string, string> = {
    pending: 'gold',
    downloading: 'blue',
    paused: 'default',
    completed: 'green',
    failed: 'red',
  }

  return (
    <Card size="small" style={{ marginBottom: 8 }}>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text strong style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {task.videoInfo.title}
          </Text>
          <Tag color={statusColor[task.status]}>{t(`download.${task.status}`)}</Tag>
        </Space>
        <Progress
          percent={task.progress}
          status={task.status === 'failed' ? 'exception' : undefined}
          size="small"
        />
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {formatSize(task.speed)}/s | {t('download.remaining')}: {formatTime(remaining)}
          </Text>
          <Space>
            {task.status === 'downloading' && (
              <Button size="small" icon={<PauseOutlined />} onClick={() => onPause(task.id)}>
                {t('download.pause')}
              </Button>
            )}
            {task.status === 'paused' && (
              <Button size="small" icon={<PlayOutlined />} onClick={() => onResume(task.id)}>
                {t('download.resume')}
              </Button>
            )}
            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => onRemove(task.id)}>
              {t('common.delete')}
            </Button>
          </Space>
        </Space>
      </Space>
    </Card>
  )
}
```

- [ ] **Step 2: 创建下载队列组件**

```typescript
import React from 'react'
import { Card, Tabs, Button, Empty } from 'antd'
import { useTranslation } from 'react-i18next'
import { useDownloadStore } from '../../stores/downloadStore'
import { DownloadItem } from './DownloadItem'

export const DownloadQueue: React.FC = () => {
  const { t } = useTranslation()
  const { tasks, pauseTask, resumeTask, removeTask, clearCompleted } = useDownloadStore()

  const handlePause = (id: string) => pauseTask(id)
  const handleResume = (id: string) => resumeTask(id)
  const handleCancel = (id: string) => {
    // IPC 调用取消
    window.electronAPI?.cancelDownload?.(id)
    removeTask(id)
  }
  const handleRemove = (id: string) => removeTask(id)

  const filterTasks = (status?: string) => {
    if (status === 'all') return tasks
    return tasks.filter((task) => task.status === status)
  }

  const tabs = [
    { key: 'all', label: `${t('download.all')} (${tasks.length})` },
    { key: 'downloading', label: `${t('download.downloading')} (${tasks.filter((t) => t.status === 'downloading').length})` },
    { key: 'completed', label: `${t('download.completed')} (${tasks.filter((t) => t.status === 'completed').length})` },
    { key: 'failed', label: `${t('download.failed')} (${tasks.filter((t) => t.status === 'failed').length})` },
  ]

  return (
    <Card
      title={t('download.title')}
      extra={
        <Button onClick={clearCompleted} size="small">
          {t('download.clearCompleted')}
        </Button>
      }
    >
      <Tabs
        defaultActiveKey="all"
        items={tabs.map((tab) => ({
          key: tab.key,
          label: tab.label,
          children: (
            filterTasks(tab.key).length > 0 ? (
              filterTasks(tab.key).map((task) => (
                <DownloadItem
                  key={task.id}
                  task={task}
                  onPause={handlePause}
                  onResume={handleResume}
                  onCancel={handleCancel}
                  onRemove={handleRemove}
                />
              ))
            ) : (
              <Empty description={t('download.noDownloads')} />
            )
          ),
        }))}
      />
    </Card>
  )
}
```

- [ ] **Step 3: 创建下载列表页**

```typescript
import React from 'react'
import { DownloadQueue } from '../components/download/DownloadQueue'

export const Downloads: React.FC = () => {
  return <DownloadQueue />
}
```

- [ ] **Step 4: 提交**

```bash
cd "d:/myCode/stream-fetch/stream-fetch"
git add src/pages/Downloads.tsx src/components/download/DownloadItem.tsx src/components/download/DownloadQueue.tsx
git commit -m "添加下载列表页面和下载队列组件"
```

---

## Task 8: 设置页

**Files:**
- Create: `src/pages/Settings.tsx`

- [ ] **Step 1: 创建设置页组件**

```typescript
import React from 'react'
import { Card, Form, InputNumber, Select, Button, Space, Typography, Divider } from 'antd'
import { FolderOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '../../stores/settingsStore'

const { Title } = Typography
const { Option } = Select

export const Settings: React.FC = () => {
  const { t } = useTranslation()
  const { settings, updateSettings } = useSettingsStore()
  const [form] = Form.useForm()

  const handleSelectPath = async () => {
    const path = await window.electronAPI?.selectPath?.()
    if (path) {
      form.setFieldValue('downloadPath', path)
      updateSettings({ downloadPath: path })
    }
  }

  const handleFinish = (values: Record<string, unknown>) => {
    updateSettings(values)
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <Card>
        <Title level={4}>{t('settings.title')}</Title>
        <Divider />
        <Form
          form={form}
          layout="vertical"
          initialValues={settings}
          onFinish={handleFinish}
        >
          <Form.Item label={t('settings.downloadPath')} name="downloadPath">
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name="downloadPath" noStyle>
                <Input.ReadOnly style={{ width: 'calc(100% - 100px)' }} />
              </Form.Item>
              <Button icon={<FolderOutlined />} onClick={handleSelectPath}>
                {t('settings.selectPath')}
              </Button>
            </Space.Compact>
          </Form.Item>

          <Form.Item label={t('settings.maxConcurrent')} name="maxConcurrent">
            <InputNumber min={1} max={10} style={{ width: 200 }} />
          </Form.Item>

          <Form.Item label={t('settings.language')} name="language">
            <Select style={{ width: 200 }}>
              <Option value="zh-CN">中文</Option>
              <Option value="en-US">English</Option>
            </Select>
          </Form.Item>

          <Form.Item label={t('settings.theme')} name="theme">
            <Select style={{ width: 200 }}>
              <Option value="light">{t('settings.themeLight')}</Option>
              <Option value="dark">{t('settings.themeDark')}</Option>
              <Option value="auto">{t('settings.themeAuto')}</Option>
            </Select>
          </Form.Item>

          <Divider />

          <Space>
            <Button type="primary" htmlType="submit">
              {t('common.save')}
            </Button>
          </Space>
        </Form>

        <Divider />

        <Space direction="vertical">
          <Title level={5}>{t('settings.about')}</Title>
          <Typography.Text type="secondary">
            {t('settings.version')}: 0.1.0
          </Typography.Text>
        </Space>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: 提交**

```bash
cd "d:/myCode/stream-fetch/stream-fetch"
git add src/pages/Settings.tsx
git commit -m "添加设置页面组件"
```

---

## Task 9: 路由配置

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: 更新 App.tsx 添加路由**

```tsx
import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import { Home } from './pages/Home'
import { Downloads } from './pages/Downloads'
import { Settings } from './pages/Settings'

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="downloads" element={<Downloads />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
```

- [ ] **Step 2: 安装 react-router-dom**

Run: `cd "d:/myCode/stream-fetch/stream-fetch" && npm install react-router-dom`
Expected: dependencies 中包含 react-router-dom

- [ ] **Step 3: 提交**

```bash
cd "d:/myCode/stream-fetch/stream-fetch"
git add src/App.tsx package.json
git commit -m "添加 React Router 路由配置"
```

---

## Task 10: IPC 通信 Hook

**Files:**
- Create: `src/hooks/useIPC.ts`

- [ ] **Step 1: 创建 IPC 通信 Hook**

```typescript
import { useEffect, useCallback } from 'react'
import { useDownloadStore } from '../stores/downloadStore'
import { IPC_CHANNELS } from '../types'

export const useIPC = () => {
  const { updateTask } = useDownloadStore()

  // 监听下载进度更新
  useEffect(() => {
    const handleProgress = (_event: unknown, data: { id: string; progress: number; speed: number; downloaded: number }) => {
      updateTask(data.id, {
        progress: data.progress,
        speed: data.speed,
        downloaded: data.downloaded,
        status: 'downloading',
      })
    }

    const handleComplete = (_event: unknown, data: { id: string }) => {
      updateTask(data.id, { status: 'completed', progress: 100 })
    }

    const handleError = (_event: unknown, data: { id: string; error: string }) => {
      updateTask(data.id, { status: 'failed', error: data.error })
    }

    // 注册 IPC 监听
    window.electronAPI?.on?.(IPC_CHANNELS.DOWNLOAD_PROGRESS, handleProgress)
    window.electronAPI?.on?.(IPC_CHANNELS.DOWNLOAD_COMPLETE, handleComplete)
    window.electronAPI?.on?.(IPC_CHANNELS.DOWNLOAD_ERROR, handleError)

    return () => {
      window.electronAPI?.off?.(IPC_CHANNELS.DOWNLOAD_PROGRESS, handleProgress)
      window.electronAPI?.off?.(IPC_CHANNELS.DOWNLOAD_COMPLETE, handleComplete)
      window.electronAPI?.off?.(IPC_CHANNELS.DOWNLOAD_ERROR, handleError)
    }
  }, [updateTask])

  const parseUrl = useCallback(async (url: string) => {
    return window.electronAPI?.invoke?.(IPC_CHANNELS.PARSE_URL, { url })
  }, [])

  const startDownload = useCallback(async (id: string, url: string, quality: string) => {
    return window.electronAPI?.invoke?.(IPC_CHANNELS.START_DOWNLOAD, { id, url, quality })
  }, [])

  const pauseDownload = useCallback(async (id: string) => {
    return window.electronAPI?.invoke?.(IPC_CHANNELS.PAUSE_DOWNLOAD, { id })
  }, [])

  const resumeDownload = useCallback(async (id: string) => {
    return window.electronAPI?.invoke?.(IPC_CHANNELS.RESUME_DOWNLOAD, { id })
  }, [])

  const cancelDownload = useCallback(async (id: string) => {
    return window.electronAPI?.invoke?.(IPC_CHANNELS.CANCEL_DOWNLOAD, { id })
  }, [])

  const selectPath = useCallback(async () => {
    return window.electronAPI?.invoke?.(IPC_CHANNELS.SELECT_PATH)
  }, [])

  return {
    parseUrl,
    startDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    selectPath,
  }
}
```

- [ ] **Step 2: 提交**

```bash
cd "d:/myCode/stream-fetch/stream-fetch"
git add src/hooks/useIPC.ts
git commit -m "添加 IPC 通信 Hook"
```

---

## Task 11: 更新 IPC 类型和验证

**Files:**
- Modify: `src/vite-env.d.ts`
- Modify: `electron/preload.ts`

- [ ] **Step 1: 更新 vite-env.d.ts 添加完整类型**

```typescript
/// <reference types="vite/client" />

interface ElectronAPI {
  platform: string
  versions: {
    node: string
    chrome: string
    electron: string
  }
  invoke: (channel: string, data?: unknown) => Promise<unknown>
  on: (channel: string, callback: (...args: unknown[]) => void) => void
  off: (channel: string, callback: (...args: unknown[]) => void) => void
  parseUrl: (url: string) => Promise<unknown>
  selectPath: () => Promise<string | null>
  startDownload: (id: string, url: string, quality: string) => Promise<void>
  pauseDownload: (id: string) => Promise<void>
  resumeDownload: (id: string) => Promise<void>
  cancelDownload: (id: string) => Promise<void>
  getSettings: () => Promise<unknown>
  saveSettings: (settings: unknown) => Promise<void>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
```

- [ ] **Step 2: 更新 preload.ts 添加 IPC 暴露**

```typescript
import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../types'

export interface ElectronAPI {
  platform: string
  versions: {
    node: string
    chrome: string
    electron: string
  }
  invoke: (channel: string, data?: unknown) => Promise<unknown>
  on: (channel: string, callback: (...args: unknown[]) => void) => void
  off: (channel: string, callback: (...args: unknown[]) => void) => void
}

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
  invoke: (channel: string, data?: unknown) => ipcRenderer.invoke(channel, data),
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args))
  },
  off: (channel: string, callback: (...args: unknown[]) => void) => {
    ipcRenderer.removeListener(channel, callback)
  },
} as ElectronAPI)
```

- [ ] **Step 3: 运行类型检查**

Run: `cd "d:/myCode/stream-fetch/stream-fetch" && npm run typecheck`
Expected: 无 TypeScript 错误

- [ ] **Step 4: 提交**

```bash
cd "d:/myCode/stream-fetch/stream-fetch"
git add src/vite-env.d.ts electron/preload.ts
git commit -m "更新 IPC 类型定义和 preload 暴露"
```

---

## Task 12: 验证 UI 构建

- [ ] **Step 1: 安装 react-router-dom 依赖**

Run: `cd "d:/myCode/stream-fetch/stream-fetch" && npm install react-router-dom`
Expected: react-router-dom 已安装

- [ ] **Step 2: 类型检查**

Run: `cd "d:/myCode/stream-fetch/stream-fetch" && npm run typecheck`
Expected: 无 TypeScript 错误

- [ ] **Step 3: 启动开发服务器**

Run: `cd "d:/myCode/stream-fetch/stream-fetch" && npm run dev`
Expected: Vite 开发服务器正常启动

- [ ] **Step 4: 验证页面可访问**

在浏览器访问 http://localhost:5173，验证：
- 首页显示正常
- 导航切换正常
- 设置页面可访问

- [ ] **Step 5: 停止开发服务器**

- [ ] **Step 6: 提交**

```bash
cd "d:/myCode/stream-fetch/stream-fetch"
git add -A
git commit -m "验证 UI 模块构建和页面访问"
```

---

## 验收标准检查清单

- [ ] Ant Design 组件库已安装并配置
- [ ] Zustand stores 已创建并正常工作
- [ ] 布局组件（Header、Sidebar、Footer、MainLayout）已创建
- [ ] 首页（Home）组件已创建，链接输入功能正常
- [ ] 下载列表页（Downloads）组件已创建
- [ ] 设置页（Settings）组件已创建
- [ ] 路由配置正确，页面切换正常
- [ ] 国际化配置完成（中英文）
- [ ] IPC 类型定义完整
- [ ] TypeScript 类型检查通过

---

## 注意事项

1. **IPC 安全**：preload 只暴露必要的 API，不暴露 Node.js 完整 API
2. **组件复用**：组件设计遵循原子设计原则，便于复用
3. **状态管理**：使用 Zustand 简化状态管理，避免 Redux 过度复杂
4. **路由懒加载**：如页面较多，可考虑使用 React.lazy 进行路由懒加载