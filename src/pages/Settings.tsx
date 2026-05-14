import React from 'react'
import { Card, Form, Input, InputNumber, Select, Button, Space, Typography, Divider } from 'antd'
import { FolderOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '../stores/settingsStore'

const { Title, Text } = Typography
const { Option } = Select

export const Settings: React.FC = () => {
  const { t } = useTranslation()
  const { settings, updateSettings } = useSettingsStore()
  const [form] = Form.useForm()

  const handleSelectPath = async () => {
    const path = await window.electronAPI?.selectPath?.()
    if (path) {
      form.setFieldValue('downloadPath', path)
      updateSettings({ downloadPath: path })
    }
  }

  const handleFinish = (values: Record<string, unknown>) => {
    updateSettings(values)
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <Card>
        <Title level={4}>{t('settings.title')}</Title>
        <Divider />
        <Form
          form={form}
          layout="vertical"
          initialValues={settings}
          onFinish={handleFinish}
        >
          <Form.Item label={t('settings.downloadPath')} name="downloadPath">
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name="downloadPath" noStyle>
                <Input readOnly style={{ width: 'calc(100% - 100px)' }} />
              </Form.Item>
              <Button icon={<FolderOutlined />} onClick={handleSelectPath}>
                {t('settings.selectPath')}
              </Button>
            </Space.Compact>
          </Form.Item>

          <Form.Item label={t('settings.maxConcurrent')} name="maxConcurrent">
            <InputNumber min={1} max={10} style={{ width: 200 }} />
          </Form.Item>

          <Form.Item label={t('settings.language')} name="language">
            <Select style={{ width: 200 }}>
              <Option value="zh-CN">中文</Option>
              <Option value="en-US">English</Option>
            </Select>
          </Form.Item>

          <Form.Item label={t('settings.theme')} name="theme">
            <Select style={{ width: 200 }}>
              <Option value="light">{t('settings.themeLight')}</Option>
              <Option value="dark">{t('settings.themeDark')}</Option>
              <Option value="auto">{t('settings.themeAuto')}</Option>
            </Select>
          </Form.Item>

          <Divider />

          <Space>
            <Button type="primary" htmlType="submit">
              {t('common.save')}
            </Button>
          </Space>
        </Form>

        <Divider />

        <Space direction="vertical">
          <Title level={5}>{t('settings.about')}</Title>
          <Text type="secondary">
            {t('settings.version')}: 0.1.0
          </Text>
        </Space>
      </Card>
    </div>
  )
}