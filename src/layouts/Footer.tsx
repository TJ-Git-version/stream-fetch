import React from 'react'
import { Layout, Typography } from 'antd'

const { Footer } = Layout
const { Text } = Typography

export const AppFooter: React.FC = () => {
  return (
    <Footer style={{ padding: '8px 24px', background: '#001529' }}>
      <Text style={{ color: '#fff' }}>Stream Fetch v0.1.0</Text>
    </Footer>
  )
}