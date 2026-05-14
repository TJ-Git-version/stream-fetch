import React from 'react'
import { Card, Form, Input, InputNumber, Select, Button, Space, Typography, Divider, message } from 'antd'
import { FolderOutlined, SaveOutlined, GlobalOutlined, BulbOutlined, DownloadOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '../stores/settingsStore'

const { Title, Text } = Typography
const { Option } = Select

export const Settings: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { settings, updateSettings } = useSettingsStore()
  const [form] = Form.useForm()

  const handleSelectPath = async () => {
    const path = await window.electronAPI?.invoke?.('select-download-path')
    if (path) {
      form.setFieldValue('downloadPath', path)
      updateSettings({ downloadPath: path as string })
      message.success('下载目录已更新')
    }
  }

  const handleFinish = (values: Record<string, unknown>) => {
    updateSettings(values)
    if (values.language) {
      i18n.changeLanguage(values.language as string)
    }
    message.success('设置已保存')
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 0' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ marginBottom: 8 }}>
          <InfoCircleOutlined style={{ marginRight: 12, color: '#1890ff' }} />
          {t('settings.title')}
        </Title>
        <Text type="secondary">配置您的下载偏好和应用程序设置</Text>
      </div>

      <Card
        style={{ borderRadius: 16 }}
        bodyStyle={{ padding: 32 }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={settings}
          onFinish={handleFinish}
          requiredMark="optional"
        >
          {/* 下载目录 */}
          <Form.Item
            label={
              <Space>
                <FolderOutlined />
                <span>{t('settings.downloadPath')}</span>
              </Space>
            }
            name="downloadPath"
            rules={[{ required: true, message: '请选择下载目录' }]}
          >
            <Input
              readOnly
              placeholder="点击右侧按钮选择下载目录"
              prefix={<FolderOutlined style={{ color: '#bfbfbf' }} />}
              suffix={
                <Button
                  type="link"
                  icon={<FolderOutlined />}
                  onClick={handleSelectPath}
                >
                  {t('settings.selectPath')}
                </Button>
              }
              style={{ cursor: 'pointer' }}
            />
          </Form.Item>

          {/* 最大并发数 */}
          <Form.Item
            label={
              <Space>
                <DownloadOutlined />
                <span>{t('settings.maxConcurrent')}</span>
              </Space>
            }
            name="maxConcurrent"
            tooltip="同时进行的最大下载任务数"
          >
            <InputNumber
              min={1}
              max={10}
              style={{ width: '100%' }}
              addonAfter="个任务"
            />
          </Form.Item>

          <Divider style={{ margin: '24px 0' }} />

          {/* 语言设置 */}
          <Form.Item
            label={
              <Space>
                <GlobalOutlined />
                <span>{t('settings.language')}</span>
              </Space>
            }
            name="language"
          >
            <Select
              placeholder="选择语言"
              style={{ width: '100%' }}
            >
              <Option value="zh-CN">
                <Space>
                  <span>🇨🇳</span>
                  <span>简体中文</span>
                </Space>
              </Option>
              <Option value="en-US">
                <Space>
                  <span>🇺🇸</span>
                  <span>English</span>
                </Space>
              </Option>
            </Select>
          </Form.Item>

          {/* 主题设置 */}
          <Form.Item
            label={
              <Space>
                <BulbOutlined />
                <span>{t('settings.theme')}</span>
              </Space>
            }
            name="theme"
          >
            <Select placeholder="选择主题" style={{ width: '100%' }}>
              <Option value="light">
                <Space>
                  <span>☀️</span>
                  <span>{t('settings.themeLight')}</span>
                </Space>
              </Option>
              <Option value="dark">
                <Space>
                  <span>🌙</span>
                  <span>{t('settings.themeDark')}</span>
                </Space>
              </Option>
              <Option value="auto">
                <Space>
                  <span>⚙️</span>
                  <span>{t('settings.themeAuto')}</span>
                </Space>
              </Option>
            </Select>
          </Form.Item>

          <Divider style={{ margin: '24px 0' }} />

          {/* 保存按钮 */}
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              size="large"
              block
            >
              {t('common.save')}
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 关于信息 */}
      <Card
        title={
          <Space>
            <InfoCircleOutlined />
            <span>{t('settings.about')}</span>
          </Space>
        }
        style={{ marginTop: 24, borderRadius: 16 }}
        bodyStyle={{ padding: '16px 24px' }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong style={{ fontSize: 18 }}>Stream Fetch</Text>
            <Text type="secondary" style={{ marginLeft: 12 }}>
              v0.1.0
            </Text>
          </div>
          <Text type="secondary">
            跨平台视频下载工具，支持 B站、YouTube、抖音等多个平台
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            基于 Electron + React + TypeScript 构建
          </Text>
        </Space>
      </Card>
    </div>
  )
}