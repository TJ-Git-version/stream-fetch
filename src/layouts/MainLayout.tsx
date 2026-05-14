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