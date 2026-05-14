import React from 'react'
import { Layout, Menu } from 'antd'
import { HomeOutlined, DownloadOutlined, SettingOutlined, VideoCameraOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'

const { Sider } = Layout

interface SidebarProps {
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
}

export const AppSidebar: React.FC<SidebarProps> = ({ collapsed, onCollapse }) => {
  const navigate = useNavigate()
  const location = useLocation()

  const getSelectedKey = () => {
    const path = location.pathname
    if (path === '/') return 'home'
    if (path === '/downloads') return 'downloads'
    if (path === '/settings') return 'settings'
    return 'home'
  }

  const items = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: 'downloads',
      icon: <DownloadOutlined />,
      label: '下载列表',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
  ]

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={220}
      collapsedWidth={80}
      style={{
        background: 'linear-gradient(180deg, #001529 0%, #000c17 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        overflow: 'auto',
        height: 'calc(100vh - 64px)',
        position: 'sticky',
        top: 64,
        left: 0,
      }}
      trigger={null}
    >
      {/* Logo 区域 */}
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? 0 : '0 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <VideoCameraOutlined style={{ fontSize: 20, color: '#1890ff' }} />
        {!collapsed && (
          <span
            style={{
              marginLeft: 12,
              color: '#fff',
              fontSize: 16,
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            Stream Fetch
          </span>
        )}
      </div>

      {/* 导航菜单 */}
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        onClick={({ key }) => {
          if (key === 'home') navigate('/')
          if (key === 'downloads') navigate('/downloads')
          if (key === 'settings') navigate('/settings')
        }}
        items={items}
        style={{
          background: 'transparent',
          border: 'none',
          marginTop: 8,
        }}
      />

      {/* 折叠触发器 */}
      <div
        onClick={() => onCollapse(!collapsed)}
        style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#fff',
          fontSize: 12,
          transition: 'all 0.3s ease',
        }}
      >
        {collapsed ? '›' : '‹'}
      </div>
    </Sider>
  )
}