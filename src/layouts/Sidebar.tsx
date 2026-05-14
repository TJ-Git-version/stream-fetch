import React from 'react'
import { Layout, Menu } from 'antd'
import { HomeOutlined, DownloadOutlined, SettingOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

const { Sider } = Layout

interface SidebarProps {
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
}

export const AppSidebar: React.FC<SidebarProps> = ({ collapsed, onCollapse }) => {
  const { t } = useTranslation()
  const items = [
    { key: 'home', icon: <HomeOutlined />, label: t('nav.home') },
    { key: 'downloads', icon: <DownloadOutlined />, label: t('nav.downloads') },
    { key: 'settings', icon: <SettingOutlined />, label: t('nav.settings') },
  ]

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      style={{ background: '#001529' }}
    >
      <Menu
        theme="dark"
        mode="inline"
        defaultSelectedKeys={['home']}
        items={items}
        style={{ marginTop: 8 }}
      />
    </Sider>
  )
}