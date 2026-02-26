'use client'

import { useState, useEffect } from 'react'
import { Card, Row, Col, Typography, Tag, Space, Button, Avatar, Divider, Spin } from 'antd'
import { motion } from 'framer-motion'
import {
  ApiOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import { useStore } from '@/store'
import WebGLBackground from '@/components/WebGLBackground'
import { marked } from 'marked'
import hljs from 'highlight.js'

const { Title, Paragraph } = Typography

// 配置 marked
marked.setOptions({
  highlight: function(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext'
    return hljs.highlight(code, { language }).value
  },
  langPrefix: 'hljs language-'
})

export default function Home() {
  const { activeMenu, setActiveMenu } = useStore()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])

  // 获取目录结构
  useEffect(() => {
    fetch('http://localhost:42123/api/docs')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error('Failed to fetch categories:', err))
  }, [])

  // 获取具体内容
  useEffect(() => {
    if (activeMenu === 'index') return

    setLoading(true)
    fetch(`http://localhost:42123/api/doc?filename=${encodeURIComponent(activeMenu)}`)
      .then(res => res.json())
      .then(data => {
        if (data.content) {
          setContent(marked.parse(data.content) as string)
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

  const handleMenuClick = (key: string) => {
    setActiveMenu(key)
  }

  // 首页渲染
  if (activeMenu === 'index') {
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
                  Frontend Interview Prep 2025
                </Paragraph>
                <Space size="middle">
                  <Button type="primary" size="large" onClick={() => handleMenuClick('01-基础核心/1-2 JavaScript.md')}>
                    开始学习
                  </Button>
                </Space>
              </Col>
            </Row>
          </motion.div>

          <Row gutter={[24, 24]} style={{ marginTop: 64 }}>
            {categories.map((cat) => (
              <Col key={cat.key} xs={24} md={12} lg={6}>
                <Card title={cat.title} variant="borderless" style={{ borderRadius: 16, background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(10px)' }}>
                  {cat.children?.map((file: any) => (
                    <div 
                      key={file.key} 
                      onClick={() => handleMenuClick(file.key)}
                      style={{ padding: '8px 0', cursor: 'pointer', color: '#0891B2' }}
                    >
                      <FileTextOutlined style={{ marginRight: 8 }} />
                      {file.title}
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

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '40px 60px',
            background: 'rgba(255,255,255,0.8)',
            borderRadius: 24,
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.05)',
            minHeight: '80vh'
          }}
        >
          <div dangerouslySetInnerHTML={{ __html: content }} className="markdown-content" />
        </motion.div>
      )}
    </div>
  )
}
