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