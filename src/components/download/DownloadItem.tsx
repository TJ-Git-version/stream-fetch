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