import React from 'react'
import { Layout, Typography, Space } from 'antd'
import { GithubOutlined, VideoCameraOutlined } from '@ant-design/icons'

const { Header } = Layout
const { Text } = Typography

export const AppHeader: React.FC = () => {
  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: 64,
        lineHeight: '64px',
        background: 'linear-gradient(180deg, #001529 0%, #001529 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <Space>
        <VideoCameraOutlined style={{ fontSize: 24, color: '#1890ff' }} />
        <Text
          strong
          style={{
            color: '#fff',
            fontSize: 20,
            letterSpacing: 1,
            margin: 0
          }}
        >
          Stream Fetch
        </Text>
      </Space>
      <Space size="large">
        <Text type="secondary" style={{ fontSize: 12 }}>
          视频下载工具
        </Text>
        <a
          href="https://github.com/TJ-Git-version/stream-fetch"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#fff', fontSize: 18, lineHeight: 1 }}
        >
          <GithubOutlined />
        </a>
      </Space>
    </Header>
  )
}