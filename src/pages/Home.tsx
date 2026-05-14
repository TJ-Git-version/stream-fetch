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