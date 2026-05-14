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