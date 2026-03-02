'use client'

import { useState, useEffect, useMemo } from 'react'
import { Layout, Menu, theme, ConfigProvider, Spin, Input, Button, Tooltip, Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import { useStore } from '@/store'
import {
  HomeOutlined,
  FolderOpenOutlined,
  FileOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  SearchOutlined,
  SunOutlined,
  MoonOutlined,
  StarOutlined,
  StarFilled,
  PrinterOutlined,
  BookOutlined,
} from '@ant-design/icons'
import 'highlight.js/styles/atom-one-dark.css'
import './globals.css'

const { Sider, Content } = Layout

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [allDocs, setAllDocs] = useState<any[]>([])
  const { activeMenu, setActiveMenu, isDarkMode, toggleDarkMode, searchQuery, setSearchQuery, favorites, addFavorite, removeFavorite } = useStore()

  // 搜索相关
  const [searchVisible, setSearchVisible] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])

  // 获取文档列表
  useEffect(() => {
    fetch('http://localhost:42123/api/docs')
      .then(res => res.json())
      .then(data => {
        setAllDocs(data)
        const transform = (items: any[]): any[] => {
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

  // 扁平化所有文档用于搜索
  const flattenDocs = (items: any[]): any[] => {
    const result: any[] = []
    items.forEach(item => {
      if (item.type === 'file') {
        result.push(item)
      }
      if (item.children) {
        result.push(...flattenDocs(item.children))
      }
    })
    return result
  }

  // 搜索功能
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const query = searchQuery.toLowerCase()
    const flatDocs = flattenDocs(allDocs)
    const results = flatDocs
      .filter(doc => doc.title && doc.title.toLowerCase().includes(query))
      .slice(0, 10)
    setSearchResults(results)
  }, [searchQuery, allDocs])

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    setActiveMenu(e.key)
    setSearchVisible(false)
    setSearchQuery('')
  }

  const handleSearchSelect = (key: string) => {
    setActiveMenu(key)
    setSearchVisible(false)
    setSearchQuery('')
  }

  // 打印功能
  const handlePrint = () => {
    window.print()
  }

  // 收藏菜单
  const favoriteItems: MenuProps['items'] = favorites.map(fav => {
    const findTitle = (items: any[]): string | null => {
      for (const item of items) {
        if (item.key === fav) return item.title
        if (item.children) {
          const found = findTitle(item.children)
          if (found) return found
        }
      }
      return null
    }
    const title = findTitle(allDocs) || fav
    return { key: fav, label: title, icon: <FileOutlined /> }
  })

  return (
    <html lang="zh-CN" data-theme={isDarkMode ? 'dark' : 'light'}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ConfigProvider
          theme={{
            algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
            token: {
              colorPrimary: '#0891B2',
              borderRadius: 12,
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            },
          }}
        >
          <Layout style={{ minHeight: '100vh', background: isDarkMode ? '#141414' : 'transparent' }}>
            <Sider
              collapsible
              collapsed={collapsed}
              onCollapse={(value) => setCollapsed(value)}
              style={{
                background: isDarkMode ? 'rgba(30,30,30,0.9)' : 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                borderRight: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)'}`,
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
              theme={isDarkMode ? 'dark' : 'light'}
            >
              <div style={{
                height: 64,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                background: 'linear-gradient(135deg, #0891B2 0%, #22D3EE 100%)',
              }}>
                {!collapsed && (
                  <h2 style={{ color: '#fff', margin: 0, fontSize: 16, fontWeight: 600 }}>
                    前端面试题库
                  </h2>
                )}
              </div>

              {/* 工具栏 */}
              <div style={{
                padding: '8px 12px',
                display: 'flex',
                gap: 8,
                borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
              }}>
                <Tooltip title="搜索文档">
                  <Button
                    type="text"
                    icon={<SearchOutlined />}
                    onClick={() => setSearchVisible(!searchVisible)}
                    style={{ flex: 1 }}
                  />
                </Tooltip>
                <Tooltip title={isDarkMode ? '切换亮色模式' : '切换暗色模式'}>
                  <Button
                    type="text"
                    icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />}
                    onClick={toggleDarkMode}
                    style={{ flex: 1 }}
                  />
                </Tooltip>
                <Tooltip title="打印">
                  <Button
                    type="text"
                    icon={<PrinterOutlined />}
                    onClick={handlePrint}
                    style={{ flex: 1 }}
                  />
                </Tooltip>
                <Tooltip title="收藏">
                  <Dropdown
                    menu={{ items: favoriteItems, onClick: ({ key }) => handleMenuClick({ key } as any) }}
                    trigger={['click']}
                  >
                    <Button
                      type="text"
                      icon={<StarOutlined />}
                      style={{ flex: 1 }}
                    />
                  </Dropdown>
                </Tooltip>
              </div>

              {/* 搜索框 */}
              {searchVisible && (
                <div style={{ padding: '8px 12px', borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}` }}>
                  <Input
                    placeholder="搜索文档..."
                    prefix={<SearchOutlined />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    allowClear
                  />
                  {searchResults.length > 0 && (
                    <div style={{
                      marginTop: 8,
                      maxHeight: 200,
                      overflowY: 'auto',
                      background: isDarkMode ? '#1f1f1f' : '#fff',
                      borderRadius: 8,
                      border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    }}>
                      {searchResults.map((result) => (
                        <div
                          key={result.key}
                          onClick={() => handleSearchSelect(result.key)}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                          }}
                        >
                          <FileOutlined style={{ marginRight: 8 }} />
                          {result.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

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
                    height: 'calc(100vh - 220px)',
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
