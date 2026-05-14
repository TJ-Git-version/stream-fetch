import React from 'react'
import { Card, Progress, Space, Button, Typography, Tag, Tooltip } from 'antd'
import {
  PauseOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
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
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

const formatSpeed = (bytesPerSecond: number): string => {
  if (bytesPerSecond === 0) return '0 B/s'
  const k = 1024
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s']
  const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k))
  return `${parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

const formatTime = (seconds: number): string => {
  if (seconds === Infinity || isNaN(seconds)) return '--'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}小时${m}分钟`
  if (m > 0) return `${m}分钟${s}秒`
  return `${s}秒`
}

export const DownloadItem: React.FC<DownloadItemProps> = ({
  task,
  onPause,
  onResume,
  onRemove,
}) => {
  const { t } = useTranslation()
  const remaining = task.speed > 0 ? (task.total - task.downloaded) / task.speed : 0

  const statusConfig: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
    pending: { color: 'gold', icon: <ClockCircleOutlined />, text: '等待中' },
    downloading: { color: 'blue', icon: null, text: '下载中' },
    paused: { color: 'default', icon: null, text: '已暂停' },
    completed: { color: 'success', icon: <CheckCircleOutlined />, text: '已完成' },
    failed: { color: 'error', icon: <ExclamationCircleOutlined />, text: '失败' },
  }

  const config = statusConfig[task.status] || statusConfig.pending
  const progressStatus = task.status === 'failed' ? 'exception' : task.status === 'completed' ? 'success' : 'normal'

  return (
    <Card
      size="small"
      style={{
        marginBottom: 12,
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.1)',
        transition: 'all 0.3s ease'
      }}
      bodyStyle={{ padding: 16 }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* 标题行 */}
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Tooltip title={task.videoInfo.title}>
            <Text
              strong
              style={{
                maxWidth: 400,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block'
              }}
            >
              {task.videoInfo.title}
            </Text>
          </Tooltip>
          <Tag
            icon={config.icon}
            color={config.color}
            style={{ borderRadius: 12, padding: '4px 12px' }}
          >
            {config.text}
          </Tag>
        </Space>

        {/* 进度条 */}
        <Progress
          percent={Math.round(task.progress)}
          status={progressStatus}
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#1890ff',
          }}
          trailColor="rgba(255,255,255,0.1)"
          size="small"
          format={(percent) => `${percent}%`}
        />

        {/* 统计信息 */}
        <Space style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Space direction="vertical" size={4}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <Space>
                <span>速度:</span>
                <Text strong style={{ color: '#1890ff' }}>{formatSpeed(task.speed)}</Text>
              </Space>
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <Space>
                <span>剩余:</span>
                <Text strong>{formatTime(remaining)}</Text>
              </Space>
            </Text>
          </Space>
          <Space direction="vertical" size={4} style={{ textAlign: 'right' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {formatSize(task.downloaded)} / {formatSize(task.total)}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {task.videoInfo.author && `作者: ${task.videoInfo.author}`}
            </Text>
          </Space>
        </Space>

        {/* 操作按钮 */}
        <Space style={{ float: 'right' }}>
          {task.status === 'downloading' && (
            <Button
              size="small"
              icon={<PauseOutlined />}
              onClick={() => onPause(task.id)}
            >
              {t('download.pause')}
            </Button>
          )}
          {task.status === 'paused' && (
            <Button
              size="small"
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => onResume(task.id)}
            >
              {t('download.resume')}
            </Button>
          )}
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onRemove(task.id)}
          >
            {t('common.delete')}
          </Button>
        </Space>
      </Space>
    </Card>
  )
}