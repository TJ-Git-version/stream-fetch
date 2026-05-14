import React, { useState } from 'react'
import { Card, Input, Button, Space, Typography, message, Empty, List, Avatar } from 'antd'
import { VideoCameraOutlined, HistoryOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

const { Title, Text } = Typography

// 模拟历史记录数据
const mockHistory = [
  { id: '1', title: 'B站视频示例', url: 'https://bilibili.com/video/xxx', time: '2024-01-15' },
  { id: '2', title: 'YouTube 教程', url: 'https://youtube.com/video/yyy', time: '2024-01-14' },
]

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
      const result = await window.electronAPI?.parseUrl?.(url)
      if (result) {
        message.success('解析成功')
        navigate('/downloads')
      }
    } catch {
      message.error('解析失败，请检查链接是否有效')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 0' }}>
      {/* 标题区 */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <Title level={1} style={{ marginBottom: 8 }}>
          <VideoCameraOutlined style={{ marginRight: 12, color: '#1890ff' }} />
          {t('home.title')}
        </Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          支持 B站、YouTube、抖音等多个平台视频下载
        </Text>
      </div>

      {/* 输入卡片 */}
      <Card
        style={{
          borderRadius: 16,
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          border: 'none'
        }}
        bodyStyle={{ padding: 32 }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Input.Search
            size="large"
            placeholder={t('home.placeholder')}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onSearch={handleParse}
            loading={loading}
            enterButton={
              <Button
                type="primary"
                size="large"
                icon={<VideoCameraOutlined />}
                style={{ height: 48, paddingLeft: 24, paddingRight: 24 }}
              >
                {t('home.parse')}
              </Button>
            }
            style={{ height: 48 }}
          />
          <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
            粘贴视频链接后点击解析按钮获取视频信息
          </Text>
        </Space>
      </Card>

      {/* 历史记录 */}
      <Card
        title={
          <Space>
            <HistoryOutlined />
            <span>{t('home.history')}</span>
          </Space>
        }
        style={{ marginTop: 24, borderRadius: 16 }}
        bodyStyle={{ padding: 0 }}
      >
        {mockHistory.length > 0 ? (
          <List
            dataSource={mockHistory}
            renderItem={(item) => (
              <List.Item
                style={{ padding: '16px 24px', cursor: 'pointer' }}
                onClick={() => setUrl(item.url)}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<VideoCameraOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                  title={item.title}
                  description={
                    <Space>
                      <ClockCircleOutlined />
                      <span>{item.time}</span>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty
            description={t('home.noHistory')}
            style={{ padding: 48 }}
          />
        )}
      </Card>
    </div>
  )
}