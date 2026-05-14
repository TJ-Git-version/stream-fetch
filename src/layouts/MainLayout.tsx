import React, { useState } from 'react'
import { Layout } from 'antd'
import { Outlet } from 'react-router-dom'
import { AppHeader } from './Header'
import { AppSidebar } from './Sidebar'
import { AppFooter } from './Footer'

export const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <Layout style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <AppHeader />
      <Layout hasSider style={{ background: '#0a0a0a' }}>
        <AppSidebar collapsed={collapsed} onCollapse={setCollapsed} />
        <Layout.Content
          style={{
            padding: 24,
            background: 'linear-gradient(180deg, #141414 0%, #0a0a0a 100%)',
            minHeight: 'calc(100vh - 64px)',
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Layout.Content>
      </Layout>
      <AppFooter />
    </Layout>
  )
}