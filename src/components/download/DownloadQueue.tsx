import React from 'react'
import { Card, Tabs, Button, Empty, Badge, Typography, Space } from 'antd'
import { DeleteOutlined, CheckCircleOutlined, DownloadOutlined, ExclamationCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useDownloadStore } from '../../stores/downloadStore'
import { DownloadItem } from './DownloadItem'

const { Text } = Typography

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

  const getBadgeCount = (status: string) => {
    const filtered = filterTasks(status)
    return filtered.length
  }

  const tabs = [
    {
      key: 'all',
      label: (
        <Space>
          <span>全部</span>
          <Badge count={tasks.length} style={{ backgroundColor: '#1890ff' }} />
        </Space>
      ),
      icon: <DownloadOutlined />
    },
    {
      key: 'downloading',
      label: (
        <Space>
          <span>下载中</span>
          <Badge count={getBadgeCount('downloading')} style={{ backgroundColor: '#1890ff' }} />
        </Space>
      ),
      icon: <ClockCircleOutlined />
    },
    {
      key: 'completed',
      label: (
        <Space>
          <span>已完成</span>
          <Badge count={getBadgeCount('completed')} style={{ backgroundColor: '#52c41a' }} />
        </Space>
      ),
      icon: <CheckCircleOutlined />
    },
    {
      key: 'failed',
      label: (
        <Space>
          <span>失败</span>
          <Badge count={getBadgeCount('failed')} style={{ backgroundColor: '#ff4d4f' }} />
        </Space>
      ),
      icon: <ExclamationCircleOutlined />
    },
  ]

  return (
    <Card
      title={
        <Space>
          <DownloadOutlined style={{ color: '#1890ff' }} />
          <span>{t('download.title')}</span>
        </Space>
      }
      extra={
        <Button
          onClick={clearCompleted}
          icon={<DeleteOutlined />}
          danger
        >
          {t('download.clearCompleted')}
        </Button>
      }
      style={{
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.1)'
      }}
      bodyStyle={{ padding: 0 }}
    >
      <Tabs
        defaultActiveKey="all"
        tabBarStyle={{ paddingLeft: 16 }}
        items={tabs.map((tab) => ({
          key: tab.key,
          label: tab.label,
          children: (
            <div style={{ padding: '16px 24px', minHeight: 200 }}>
              {filterTasks(tab.key).length > 0 ? (
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
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <Text type="secondary">
                      {tab.key === 'all' ? '暂无下载任务' :
                       tab.key === 'downloading' ? '暂无下载中的任务' :
                       tab.key === 'completed' ? '暂无已完成的任务' :
                       '暂无失败的任务'}
                    </Text>
                  }
                />
              )}
            </div>
          ),
        }))}
      />
    </Card>
  )
}