'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Card, Row, Col, Typography, Tag, Space, Button, Avatar, Divider, Spin, Affix, Timeline, Statistic, Empty } from 'antd'
import { motion } from 'framer-motion'
import {
  ApiOutlined,
  FileTextOutlined,
  StarOutlined,
  StarFilled,
  ReadOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  FireOutlined,
  MenuOutlined,
  ExportOutlined,
} from '@ant-design/icons'
import { useStore } from '@/store'
import WebGLBackground from '@/components/WebGLBackground'
import { marked, Renderer } from 'marked'
import hljs from 'highlight.js'
import dynamic from 'next/dynamic'

// 动态加载 ECharts 组件
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

const { Title, Paragraph, Text } = Typography

// 配置 marked 使用自定义渲染器
const renderer = new Renderer()
renderer.code = function({ text, lang }: { text: string; lang?: string }) {
  const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
  const highlighted = hljs.highlight(text, { language }).value
  return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`
}

marked.setOptions({
  renderer,
  gfm: true,
  breaks: true
})

interface TocItem {
  id: string
  text: string
  level: number
}

// 学习统计图表配置
const getStudyChartOption = (favorites: string[], categories: any[]) => {
  const categoryNames = categories.map(c => c.title)
  const categoryCounts = categories.map(c => c.children?.length || 0)

  return {
    tooltip: { trigger: 'item' },
    legend: { top: '5%', left: 'center' },
    series: [
      {
        name: '文档分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: { show: false },
        data: categories.map((c, i) => ({
          value: c.children?.length || 0,
          name: c.title,
          itemStyle: {
            color: ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96'][i % 7]
          }
        }))
      }
    ]
  }
}

// 进度图表配置
const getProgressChartOption = (favorites: string[], total: number) => {
  const completed = favorites.length
  const remaining = total - completed

  return {
    tooltip: { trigger: 'item' },
    series: [
      {
        name: '学习进度',
        type: 'pie',
        radius: ['50%', '70%'],
        data: [
          { value: completed, name: '已完成', itemStyle: { color: '#52c41a' } },
          { value: remaining, name: '待学习', itemStyle: { color: '#d9d9d9' } }
        ],
        label: {
          formatter: '{b}: {c} ({d}%)'
        }
      }
    ]
  }
}

export default function Home() {
  const { activeMenu, setActiveMenu, isDarkMode, favorites, addFavorite, removeFavorite } = useStore()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [toc, setToc] = useState<TocItem[]>([])
  const [activeTocId, setActiveTocId] = useState<string>('')
  const contentRef = useRef<HTMLDivElement>(null)

  // 获取目录结构
  useEffect(() => {
    fetch('http://localhost:42123/api/docs')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error('Failed to fetch categories:', err))
  }, [])

  // 获取具体内容并解析TOC
  useEffect(() => {
    if (activeMenu === 'index') return

    setLoading(true)
    fetch(`http://localhost:42123/api/doc?filename=${encodeURIComponent(activeMenu)}`)
      .then(res => res.json())
      .then(data => {
        if (data.content) {
          const parsedContent = marked.parse(data.content) as string
          setContent(parsedContent)
          // 解析TOC
          setTimeout(() => {
            const headings = document.querySelectorAll('.markdown-content h1, .markdown-content h2, .markdown-content h3, .markdown-content h4')
            const tocItems: TocItem[] = []
            headings.forEach((heading, index) => {
              const id = `toc-${index}`
              heading.id = id
              const level = parseInt(heading.tagName.replace('H', ''))
              tocItems.push({ id, text: heading.textContent || '', level })
            })
            setToc(tocItems)
          }, 100)
        } else {
          setContent('<p>File not found</p>')
        }
        setLoading(false)
      })
      .catch(() => {
        setContent('<p>Load failed</p>')
        setLoading(false)
      })
  }, [activeMenu])

  // 滚动监听更新TOC高亮
  useEffect(() => {
    const handleScroll = () => {
      const headingElements = document.querySelectorAll('.markdown-content h1, .markdown-content h2, .markdown-content h3')
      let current = ''
      headingElements.forEach((heading) => {
        const rect = heading.getBoundingClientRect()
        if (rect.top <= 100) {
          current = heading.id
        }
      })
      if (current) setActiveTocId(current)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [content])

  const handleMenuClick = (key: string) => {
    setActiveMenu(key)
  }

  const handleTocClick = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (favorites.includes(activeMenu)) {
      removeFavorite(activeMenu)
    } else {
      addFavorite(activeMenu)
    }
  }

  // 导出PDF
  const handleExport = () => {
    window.print()
  }

  // 计算总文档数
  const totalDocs = useMemo(() => {
    let count = 0
    const countDocs = (items: any[]) => {
      items.forEach(item => {
        if (item.type === 'file') count++
        if (item.children) countDocs(item.children)
      })
    }
    countDocs(categories)
    return count
  }, [categories])

  // 首页渲染
  if (activeMenu === 'index') {
    const chartOption = getStudyChartOption(favorites, categories)
    const progressOption = getProgressChartOption(favorites, totalDocs)

    return (
      <>
        <WebGLBackground />
        <div style={{ position: 'relative', zIndex: 1, padding: '0 24px' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <Row justify="center" style={{ marginTop: 40 }}>
              <Col span={24} style={{ textAlign: 'center' }}>
                <Avatar
                  size={100}
                  icon={<ApiOutlined />}
                  style={{
                    background: 'linear-gradient(135deg, #0891B2 0%, #22D3EE 100%)',
                    marginBottom: 24,
                    boxShadow: '0 20px 40px rgba(8, 145, 178, 0.3)'
                  }}
                />
                <Title level={1} style={{ fontSize: 48, fontWeight: 800 }}>
                  Interview Docs
                </Title>
                <Paragraph style={{ fontSize: 18, color: '#475569', margin: '0 auto 24px' }}>
                  Frontend Interview Prep 2026
                </Paragraph>
                <Space size="middle">
                  <Button type="primary" size="large" onClick={() => handleMenuClick('01-基础核心/1-2 JavaScript.md')}>
                    开始学习
                  </Button>
                </Space>
              </Col>
            </Row>
          </motion.div>

          {/* 统计信息 */}
          <Row gutter={[24, 24]} style={{ marginTop: 40 }}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="文档总数"
                  value={totalDocs}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#0891B2' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="已收藏"
                  value={favorites.length}
                  prefix={<StarFilled style={{ color: '#faad14' }} />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="学习进度"
                  value={Math.round((favorites.length / totalDocs) * 100) || 0}
                  suffix="%"
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>

          {/* 图表展示 */}
          {categories.length > 0 && (
            <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
              <Col xs={24} lg={12}>
                <Card title="文档分布">
                  {typeof window !== 'undefined' && (
                    <ReactECharts
                      option={chartOption}
                      style={{ height: 300 }}
                    />
                  )}
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="学习进度">
                  {typeof window !== 'undefined' && (
                    <ReactECharts
                      option={progressOption}
                      style={{ height: 300 }}
                    />
                  )}
                </Card>
              </Col>
            </Row>
          )}

          <Row gutter={[24, 24]} style={{ marginTop: 64 }}>
            {categories.map((cat) => (
              <Col key={cat.key} xs={24} md={12} lg={6}>
                <Card
                  title={cat.title}
                  variant="borderless"
                  style={{
                    borderRadius: 16,
                    background: isDarkMode ? 'rgba(30,30,30,0.8)' : 'rgba(255,255,255,0.5)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  {cat.children?.map((file: any) => (
                    <div
                      key={file.key}
                      onClick={() => handleMenuClick(file.key)}
                      style={{
                        padding: '8px 0',
                        cursor: 'pointer',
                        color: '#0891B2',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span>
                        <FileTextOutlined style={{ marginRight: 8 }} />
                        {file.title}
                      </span>
                      {favorites.includes(file.key) && <StarFilled style={{ color: '#faad14' }} />}
                    </div>
                  ))}
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </>
    )
  }

  // 文档页面渲染
  return (
    <Row gutter={24}>
      {/* 主内容区 */}
      <Col xs={24} lg={toc.length > 0 ? 18 : 24}>
        <div style={{ maxWidth: toc.length > 0 ? '100%' : 1000, margin: '0 auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '40px 60px',
                background: isDarkMode ? 'rgba(30,30,30,0.9)' : 'rgba(255,255,255,0.8)',
                borderRadius: 24,
                backdropFilter: 'blur(20px)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.05)',
                minHeight: '80vh'
              }}
            >
              {/* 文档操作栏 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24,
                paddingBottom: 16,
                borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
              }}>
                <Space>
                  <Button
                    type="text"
                    icon={favorites.includes(activeMenu) ? <StarFilled /> : <StarOutlined />}
                    onClick={toggleFavorite}
                    style={{ color: favorites.includes(activeMenu) ? '#faad14' : undefined }}
                  >
                    {favorites.includes(activeMenu) ? '已收藏' : '收藏'}
                  </Button>
                  <Button
                    type="text"
                    icon={<ExportOutlined />}
                    onClick={handleExport}
                  >
                    导出
                  </Button>
                </Space>
                <Text type="secondary">{activeMenu}</Text>
              </div>

              <div
                ref={contentRef}
                dangerouslySetInnerHTML={{ __html: content }}
                className="markdown-content"
                style={{
                  color: isDarkMode ? '#d9d9d9' : undefined
                }}
              />
            </motion.div>
          )}
        </div>
      </Col>

      {/* TOC目录 */}
      {toc.length > 0 && (
        <Col xs={24} lg={6}>
          <Affix offsetTop={100}>
            <Card
              title={<><MenuOutlined /> 目录</>}
              size="small"
              style={{
                background: isDarkMode ? 'rgba(30,30,30,0.9)' : 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(10px)',
                maxHeight: 'calc(100vh - 150px)',
                overflowY: 'auto'
              }}
            >
              {toc.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleTocClick(item.id)}
                  style={{
                    padding: `${4 + (item.level - 1) * 8}px 8px`,
                    cursor: 'pointer',
                    color: activeTocId === item.id ? '#0891B2' : (isDarkMode ? '#666' : '#999'),
                    fontWeight: activeTocId === item.id ? 600 : 400,
                    borderLeft: activeTocId === item.id ? '2px solid #0891B2' : '2px solid transparent',
                    transition: 'all 0.2s',
                    fontSize: item.level === 1 ? 14 : (item.level === 2 ? 13 : 12),
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {item.text}
                </div>
              ))}
            </Card>
          </Affix>
        </Col>
      )}
    </Row>
  )
}
