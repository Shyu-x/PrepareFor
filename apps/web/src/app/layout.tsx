'use client'

import { useState, useEffect } from 'react'
import { Layout, Menu, theme, ConfigProvider, Spin } from 'antd'
import type { MenuProps } from 'antd'
import { useStore } from '@/store'
import {
  HomeOutlined,
  FolderOpenOutlined,
  FileOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined
} from '@ant-design/icons'
import 'highlight.js/styles/atom-one-dark.css'
import './globals.css'

const { Sider, Content } = Layout

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { activeMenu, setActiveMenu } = useStore()

  useEffect(() => {
    fetch('http://localhost:42123/api/docs')
      .then(res => res.json())
      .then(data => {
        const transform = (items: any[]) => {
          return items.map(item => ({
            key: item.key,
            label: item.title,
            icon: item.type === 'directory' ? <FolderOpenOutlined /> : <FileOutlined />,
            children: item.children ? transform(item.children) : undefined,
          }))
        }
        setMenuItems([
          { key: 'index', label: '首页', icon: <HomeOutlined /> },
          { type: 'divider' },
          ...transform(data)
        ])
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load menu:', err)
        setLoading(false)
      })
  }, [])

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    setActiveMenu(e.key)
  }

  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#0891B2',
              borderRadius: 12,
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            },
          }}
        >
          <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
            <Sider
              collapsible
              collapsed={collapsed}
              onCollapse={(value) => setCollapsed(value)}
              style={{
                background: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                borderRight: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 0 40px rgba(0,0,0,0.03)',
                position: 'fixed',
                height: 'calc(100vh - 32px)',
                left: 16,
                top: 16,
                bottom: 16,
                zIndex: 100,
                borderRadius: 20,
                overflow: 'hidden',
              }}
              width={260}
              theme="light"
            >
              <div style={{
                height: 64,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: `1px solid rgba(0,0,0,0.05)`,
                background: 'linear-gradient(135deg, #0891B2 0%, #22D3EE 100%)',
              }}>
                {!collapsed && (
                  <h2 style={{ color: '#fff', margin: 0, fontSize: 16, fontWeight: 600 }}>
                    前端面试题库
                  </h2>
                )}
              </div>
              {loading ? (
                <div style={{ textAlign: 'center', marginTop: 40 }}><Spin /></div>
              ) : (
                <Menu
                  mode="inline"
                  selectedKeys={[activeMenu]}
                  onClick={handleMenuClick}
                  items={menuItems}
                  style={{
                    borderRight: 0,
                    background: 'transparent',
                    padding: '8px',
                    height: 'calc(100vh - 160px)',
                    overflowY: 'auto'
                  }}
                  inlineIndent={12}
                />
              )}
            </Sider>
            <Layout style={{
              marginLeft: collapsed ? 100 : 292,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              background: 'transparent',
            }}>
              <Content style={{ padding: 24, minHeight: 'calc(100vh - 32px)' }}>
                {children}
              </Content>
            </Layout>
          </Layout>
        </ConfigProvider>
      </body>
    </html>
  )
}
