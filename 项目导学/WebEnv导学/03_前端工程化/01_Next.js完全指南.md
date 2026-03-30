# Next.js 完全指南

## 目录

1. [Next.js 是什么？有什么优势？](#1-nextjs-是什么有什么优势)
2. [App Router vs Pages Router](#2-app-router-vs-pages-router)
3. [目录结构和路由系统](#3-目录结构和路由系统)
4. [布局 (Layout)](#4-布局-layout)
5. [路由参数和动态路由](#5-路由参数和动态路由)
6. [Server Components vs Client Components](#6-server-components-vs-client-components)
7. [数据获取 (Server Actions, fetch)](#7-数据获取-server-actions-fetch)
8. [API Routes](#8-api-routes)
9. [样式方案](#9-样式方案)
10. [性能优化](#10-性能优化)

---

## 1. Next.js 是什么？有什么优势？

### 1.1 什么是 Next.js？

Next.js 是一个 **React 框架**，由 Vercel 公司开发和维护。它为 React 应用提供了完整的解决方案，包括：

- **服务端渲染 (SSR)** - 在服务器上生成 HTML
- **静态站点生成 (SSG)** - 预渲染静态页面
- **客户端水合 (Client-side Hydration)** - 将 React 应用挂载到 DOM
- **文件系统路由** - 基于文件结构自动创建路由
- **API 路由** - 轻松创建后端 API
- **自动代码分割** - 只加载需要的代码
- **图片优化** - 自动优化图片加载

### 1.2 为什么选择 Next.js？

```
传统 React 应用                    Next.js 应用
┌─────────────────────┐          ┌─────────────────────┐
│  用户请求            │          │  用户请求            │
└─────────┬───────────┘          └─────────┬───────────┘
          │                                    │
          ▼                                    ▼
┌─────────────────────┐          ┌─────────────────────┐
│ 返回空白 HTML       │          │ 返回完整 HTML       │
│ (需要等待 JS 下载)  │          │ (首屏快速显示)       │
└─────────┬───────────┘          └─────────┬───────────┘
          │                                    │
          ▼                                    ▼
┌─────────────────────┐          ┌─────────────────────┐
│ 下载 React + 组件  │          │ 水合 (Hydration)    │
│ (首屏慢，SEO 差)    │          │ (体验好，SEO 友好)   │
└─────────────────────┘          └─────────────────────┘
```

### 1.3 Next.js 的核心优势

| 特性 | 说明 | 优势 |
|------|------|------|
| **Server-Side Rendering (SSR)** | 服务端渲染 | 首屏加载快、SEO 友好 |
| **Static Site Generation (SSG)** | 静态站点生成 | 极快的加载速度、CDN 部署 |
| **Incremental Static Regeneration (ISR)** | 增量静态再生成 | 静态性能 + 动态更新 |
| **Automatic Code Splitting** | 自动代码分割 | 按需加载、优化 bundle 大小 |
| **Image Optimization** | 图片优化 | 自动压缩、格式转换、响应式 |
| **File-System Routing** | 文件系统路由 | 简单直观、无需额外配置 |
| **API Routes** | API 路由 | 前后端一体化开发 |
| **Fast Refresh** | 快速刷新 | 开发体验好、修改即时生效 |

### 1.4 项目中的实际使用

本项目使用 Next.js 16.1.6，配置如下：

```json
// apps/web/package.json
{
  "dependencies": {
    "next": "^16.1.6",
    "react": "^19.2.4",
    "react-dom": "^19.2.4"
  }
}
```

```javascript
// apps/web/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,      // 启用 React 严格模式
  transpilePackages: ['antd'], // 转译 antd
}

module.exports = nextConfig
```

---

## 2. App Router vs Pages Router

### 2.1 两种路由模式的区别

Next.js 提供了两种路由系统：

| 特性 | Pages Router | App Router |
|------|--------------|-------------|
| 目录结构 | `pages/` | `app/` |
| 路由方式 | 基于文件 | 基于文件夹 |
| 渲染方式 | SSR/SSG/CSR | Server Components 默认 |
| 数据获取 | `getServerSideProps` | `async` 组件 |
| 布局 | `pages/_app.js` | `layout.tsx` |
| 状态管理 | Context API | Server Components |
| API 路由 | `pages/api/` | `app/api/` |
| 推荐程度 | 兼容旧项目 | 新项目首选 |

### 2.2 Pages Router 模式

```
pages/
├── _app.tsx          # 全局应用入口
├── _document.tsx    # HTML 文档结构
├── index.tsx        # 首页 /
├── about.tsx        # /about
├── users/
│   ├── index.tsx    # /users
│   └── [id].tsx     # /users/:id (动态路由)
└── api/
    └── users/
        └── [id].ts  # /api/users/:id
```

**特点**：
- 使用 `getServerSideProps` 进行服务端数据获取
- 使用 `getStaticProps` 进行静态生成
- 使用 `getStaticPaths` 处理动态路由

### 2.3 App Router 模式（推荐）

```
app/
├── layout.tsx       # 根布局
├── page.tsx         # 首页 /
├── globals.css      # 全局样式
├── about/
│   └── page.tsx     # /about
├── users/
│   ├── page.tsx     # /users
│   └── [id]/
│       └── page.tsx # /users/:id
└── api/
    └── users/
        └── [id]/
            └── route.ts # /api/users/:id
```

**特点**：
- 使用 React Server Components (默认)
- 支持流式渲染和 Suspense
- 布局系统更强大
- Server Actions 支持

### 2.4 本项目使用 App Router

```typescript
// apps/web/src/app/layout.tsx
// 根布局 - 所有页面共享
export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
```

```typescript
// apps/web/src/app/page.tsx
// 首页 - 使用 'use client' 声明客户端组件
'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  // 组件逻辑
  return <div>欢迎来到首页</div>
}
```

---

## 3. 目录结构和路由系统

### 3.1 App Router 目录结构

```
app/
├── (marketing)/           # 路由组 - 不影响 URL
│   ├── page.tsx          # /(marketing)
│   └── about/
│       └── page.tsx      # /about
├── (shop)/               # 另一个路由组
│   ├── products/
│   │   └── [category]/
│   │       └── page.tsx  # /products/:category
│   └── layout.tsx        # shop 专属布局
├── @modal/               # 并行路由
│   └── photo/
│       └── [id]/
│           └── page.tsx
├── @sidebar/             # 捕获路由
├── layout.tsx           # 根布局 (必需)
├── page.tsx             # 根页面 / (必需)
├── not-found.tsx        # 404 页面
├── loading.tsx          # 加载 UI
├── error.tsx            # 错误 UI
└── global-error.tsx     # 全局错误 UI
```

### 3.2 路由约定

| 文件/文件夹 | 作用 | URL |
|-------------|------|-----|
| `page.tsx` | 页面组件 | 对应路径 |
| `layout.tsx` | 布局组件 | 对应路径 |
| `loading.tsx` | 加载状态 | - |
| `error.tsx` | 错误边界 | - |
| `not-found.tsx` | 404 页面 | - |
| `route.ts` | API 端点 | `/api/*` |
| `layout.tsx` | 中间件 | - |

### 3.3 路由组和并行路由

**路由组** - 用圆括号包裹，不影响 URL：

```
app/
├── (marketing)/          # 路由组
│   ├── page.tsx         # /
│   └── about/
│       └── page.tsx     # /about
└── (shop)/              # 另一个路由组
    └── products/
        └── page.tsx     # /products
```

**并行路由** - 用 @ 开头：

```
app/
├── @modal/
│   └── photo/
│       └── [id]/
│           └── page.tsx
├── @sidebar/
│   └── page.tsx
├── layout.tsx           # 接收 modal 和 sidebar
└── page.tsx
```

### 3.4 本项目的目录结构

```typescript
// apps/web/src/app 目录结构
app/
├── layout.tsx           // 根布局 (客户端组件 - 'use client')
├── page.tsx            // 首页
├── api/
│   └── md/
│       └── [slug]/
│           └── route.ts // API 路由
└── globals.css         // 全局样式

// 组件目录
src/
├── components/
│   ├── WebGLBackground.tsx
│   └── PlantUML.tsx
└── store/
    └── index.ts        // Zustand 状态管理
```

---

## 4. 布局 (Layout)

### 4.1 什么是布局？

布局是 Next.js App Router 的核心概念。它允许你：

- **嵌套布局** - 每个路由可以有专属布局
- **持久化** - 布局不重新渲染，保持状态
- **共享 UI** - 导航栏、侧边栏等

```
根布局 (layout.tsx)
    │
    ├── 导航栏 (Navbar)
    │
    ├── 页面 A 布局 (group/layout.tsx)
    │       │
    │       └── 页面 A (page.tsx)
    │
    └── 页面 B 布局 (group2/layout.tsx)
            │
            └── 页面 B (page.tsx)
```

### 4.2 根布局

每个 Next.js 应用必须有一个根布局：

```typescript
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <title>我的 Next.js 应用</title>
        <meta name="description" content="这是一个 Next.js 应用" />
      </head>
      <body>
        {/* 全局 UI，如导航栏 */}
        <nav>...</nav>

        {/* 页面内容 */}
        <main>{children}</main>

        {/* 全局脚本 */}
        <script src="..." />
      </body>
    </html>
  )
}
```

### 4.3 嵌套布局

```typescript
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="dashboard">
      <aside>
        {/* 侧边栏 */}
        <Sidebar />
      </aside>
      <div className="content">
        {/* 子页面 */}
        {children}
      </div>
    </div>
  )
}
```

```typescript
// app/dashboard/page.tsx
export default function DashboardPage() {
  return <h1>仪表盘</h1>
}
```

### 4.4 本项目的布局实践

```typescript
// apps/web/src/app/layout.tsx
'use client'

import { useState, useEffect } from 'react'
import { Layout, Menu, theme, ConfigProvider, Spin, Input, Button, Tooltip, Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import { useStore } from '@/store'
// ... 其他导入

const { Sider, Content } = Layout

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  // ... 状态定义

  const {
    activeMenu,
    setActiveMenu,
    isDarkMode,
    toggleDarkMode,
    // ... 其他状态
  } = useStore()

  return (
    <html lang="zh-CN" data-theme={isDarkMode ? 'dark' : 'light'}>
      <head>
        {/* 字体预加载 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
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
          <Layout style={{ minHeight: '100vh' }}>
            <Sider collapsible collapsed={collapsed} ...>
              {/* 侧边栏内容 */}
            </Sider>
            <Layout style={{ marginLeft: collapsed ? 100 : 292 }}>
              <Content>
                {children}
              </Content>
            </Layout>
          </Layout>
        </ConfigProvider>
      </body>
    </html>
  )
}
```

---

## 5. 路由参数和动态路由

### 5.1 动态路由

使用方括号 `[]` 定义动态路由参数：

```
app/
├── users/
│   ├── page.tsx              # /users
│   └── [userId]/
│       └── page.tsx          # /users/:userId
├── products/
│   ├── page.tsx              # /products
│   └── [category]/
│       └── [productId]/
│           └── page.tsx      # /products/:category/:productId
└── blog/
    └── [...slug]/
        └── page.tsx          # /blog/* (捕获所有)
```

### 5.2 获取路由参数

在 App Router 中，通过 `params` 获取路由参数：

```typescript
// app/users/[userId]/page.tsx
interface PageProps {
  params: Promise<{ userId: string }>
}

export default async function UserPage({ params }: PageProps) {
  // Next.js 15+ 需要 await params
  const { userId } = await params

  // 获取用户数据
  const user = await fetchUser(userId)

  return (
    <div>
      <h1>用户: {user.name}</h1>
      <p>ID: {userId}</p>
    </div>
  )
}
```

### 5.3 捕获所有路由

使用 `[...slug]` 捕获所有路径段：

```typescript
// app/blog/[...slug]/page.tsx
interface PageProps {
  params: Promise<{ slug: string[] }>
}

export default async function BlogPage({ params }: PageProps) {
  const { slug } = await params
  // /blog/a/b/c -> slug = ['a', 'b', 'c']

  return <div>博客文章: {slug.join(' / ')}</div>
}
```

### 5.4 可选参数

使用 `[[...slug]]` 定义可选参数：

```typescript
// app/blog/[[...slug]]/page.tsx
// 匹配: /blog 和 /blog/a/b/c
```

### 5.5 本项目的动态路由示例

```typescript
// apps/web/src/app/api/md/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// 定义 slug 的类型
interface RouteParams {
  params: Promise<{ slug: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { slug } = await params

  // 解码 slug (URL 编码的中文)
  const decodedSlug = decodeURIComponent(slug)

  // 构建文件路径
  const docsDir = path.join(process.cwd(), '../../docs')
  const filePath = path.join(docsDir, decodedSlug)

  // 读取文件
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8')
    return NextResponse.json({ content })
  }

  return NextResponse.json({ error: 'File not found' }, { status: 404 })
}
```

---

## 6. Server Components vs Client Components

### 6.1 概念对比

| 特性 | Server Component | Client Component |
|------|------------------|------------------|
| 执行环境 | 服务器 | 浏览器 |
| 渲染结果 | HTML | HTML + JS |
| 打包大小 | 不包含在 bundle 中 | 包含在 bundle 中 |
| 交互能力 | 无 (无 state/Effect) | 有 |
| 数据获取 | 直接访问数据库/文件系统 | 通过 API |
| 访问 API | - | fetch, localStorage 等 |
| 渲染时机 | 构建时 + 请求时 | 客户端渲染 |
| 首屏性能 | 更优 | 需等待 JS |

### 6.2 如何选择？

```
┌─────────────────────────────────────────────────────────────┐
│                     需要选择组件类型？                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │ 需要使用        │
                   │ 交互/状态/Effect│
                   └────────┬────────┘
                      │
          ┌──────────┴──────────┐
          │ Yes                 │ No
          ▼                     ▼
   ┌───────────────┐    ┌─────────────────┐
   │ Client        │    │ Server          │
   │ Component     │    │ Component       │
   │               │    │                 │
   │ • useState   │    │ • 纯展示       │
   │ • useEffect │    │ • 数据获取      │
   │ • 事件处理   │    │ • 访问后端     │
   │ • 第三方库  │    │ • 大组件       │
   └───────────────┘    │ • 减少 JS     │
                        └─────────────────┘
```

### 6.3 Server Component (默认)

```typescript
// app/users/page.tsx (Server Component - 默认)
// 不需要 'use client' 声明

// 直接在服务器上获取数据
async function getUsers() {
  const res = await fetch('https://api.example.com/users')
  if (!res.ok) {
    throw new Error('Failed to fetch users')
  }
  return res.json()
}

export default async function UsersPage() {
  // 直接调用数据获取函数
  const users = await getUsers()

  return (
    <div>
      <h1>用户列表</h1>
      <ul>
        {users.map((user: any) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  )
}
```

### 6.4 Client Component

使用 `'use client'` 声明客户端组件：

```typescript
// app/counter/page.tsx
'use client'

import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>计数: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        增加
      </button>
    </div>
  )
}
```

### 6.5 混合使用模式

**模式 1: 父组件是 Server，传递数据给 Client**

```typescript
// app/page.tsx (Server Component)
import ClientComponent from './ClientComponent'

export default async function Page() {
  const data = await fetchData() // 服务端获取

  return <ClientComponent initialData={data} />
}

// app/ClientComponent.tsx (Client Component)
'use client'

export default function ClientComponent({ initialData }: { initialData: any }) {
  // 使用服务端传来的数据
  return <div>{initialData.title}</div>
}
```

**模式 2: 客户端组件中导入服务端数据**

```typescript
// app/ClientComponent.tsx
'use client'

import { use } from 'react'

function getData() {
  return fetch('/api/data').then(res => res.json())
}

export default function ClientComponent() {
  // 使用 React.use() 处理 Promise
  const data = use(getData())

  return <div>{data.title}</div>
}
```

### 6.6 本项目的组件类型示例

**Server Component**: API 路由、服务端数据处理

```typescript
// apps/web/src/app/api/md/[slug]/route.ts
// 这是 Server-side API Route
export async function GET(...) {
  // 服务端处理
  const content = fs.readFileSync(filePath, 'utf-8')
  return NextResponse.json({ content })
}
```

**Client Component**: 页面组件、UI 组件

```typescript
// apps/web/src/app/page.tsx
'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
// 客户端状态和交互

export default function Home() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // 客户端副作用
    fetch('http://localhost:42123/api/docs')
      .then(res => res.json())
      .then(data => setCategories(data))
  }, [])

  return <div>...</div>
}
```

---

## 7. 数据获取 (Server Actions, fetch)

### 7.1 Server Actions 基础

Server Actions 允许你在服务器上执行函数，就像调用普通函数一样：

```typescript
// app/actions.ts
'use server'

export async function createPost(formData: FormData) {
  const title = formData.get('title')
  const content = formData.get('content')

  // 直接在服务器上操作数据库
  await db.post.create({
    title: title as string,
    content: content as string
  })

  return { success: true }
}
```

```typescript
// app/create-post/page.tsx
'use client'

import { createPost } from '../actions'

export default function CreatePost() {
  async function handleSubmit(formData: FormData) {
    'use server'
    await createPost(formData)
  }

  return (
    <form action={handleSubmit}>
      <input name="title" type="text" />
      <textarea name="content" />
      <button type="submit">提交</button>
    </form>
  )
}
```

### 7.2 fetch 缓存行为

Next.js 扩展了原生 fetch，添加了缓存控制：

```typescript
// 默认: 缓存 (static)
fetch('https://api.example.com/data')
// 等同于 fetch(..., { cache: 'force-cache' })

// 每请求重新获取
fetch('https://api.example.com/data', { cache: 'no-store' })

// 定时重新验证 (ISR)
fetch('https://api.example.com/data', {
  next: { revalidate: 3600 } // 1 小时
})
```

### 7.3 路由级缓存配置

```typescript
// app/page.tsx
export const dynamic = 'force-dynamic'    // 动态渲染
export const revalidate = 60             // 60 秒重新验证
export const fetchCache = 'default-cache' // 默认缓存策略
```

### 7.4 数据预获取

```typescript
// Link 组件自动预获取
import Link from 'next/link'

export default function Page() {
  return (
    <Link href="/dashboard">
      仪表盘
    </Link>
  )
}
```

### 7.5 本项目的数据获取方式

```typescript
// apps/web/src/app/page.tsx 中的数据获取
'use client'

import { useState, useEffect, useMemo } from 'react'

export default function Home() {
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
          const parsedContent = marked.parse(data.content) as string
          setContent(parsedContent)
        }
        setLoading(false)
      })
      .catch(() => {
        setContent('<p>Load failed</p>')
        setLoading(false)
      })
  }, [activeMenu])

  return <div>...</div>
}
```

---

## 8. API Routes

### 8.1 创建 API 路由

在 `app` 目录下创建 API 端点：

```
app/
├── api/
│   └── users/
│       ├── route.ts         # GET /api/users
│       └── [id]/
│           └── route.ts     # GET/POST/PUT/DELETE /api/users/:id
```

### 8.2 Handler 函数

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server'

// GET /api/users
export async function GET(request: NextRequest) {
  const users = await db.user.findMany()
  return NextResponse.json(users)
}

// POST /api/users
export async function POST(request: NextRequest) {
  const body = await request.json()
  const user = await db.user.create({ data: body })
  return NextResponse.json(user, { status: 201 })
}
```

```typescript
// app/api/users/[id]/route.ts
interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params
  const user = await db.user.findUnique({ where: { id } })

  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(user)
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params
  const body = await request.json()
  const user = await db.user.update({
    where: { id },
    data: body
  })
  return NextResponse.json(user)
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params
  await db.user.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
```

### 8.3 查询参数处理

```typescript
// app/api/users/route.ts
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = searchParams.get('page') || '1'
  const limit = searchParams.get('limit') || '10'
  const search = searchParams.get('search') || ''

  const users = await db.user.findMany({
    where: {
      name: { contains: search }
    },
    skip: (parseInt(page) - 1) * parseInt(limit),
    take: parseInt(limit)
  })

  return NextResponse.json(users)
}
```

### 8.4 本项目的 API 路由

```typescript
// apps/web/src/app/api/md/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface RouteParams {
  params: Promise<{ slug: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { slug } = await params
    const decodedSlug = decodeURIComponent(slug)

    const docsDir = path.join(process.cwd(), '../../docs')
    const filePath = path.join(docsDir, decodedSlug)

    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8')
      return NextResponse.json({ content })
    }

    return NextResponse.json(
      { error: 'File not found' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Error reading file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## 9. 样式方案

### 9.1 本项目使用的样式方案

本项目使用 **Tailwind CSS** 作为样式方案，这是现代 React 项目中最流行的 CSS 框架之一。

**配置**：

```javascript
// apps/web/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

```javascript
// apps/web/postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### 9.2 Tailwind CSS 使用示例

```typescript
// 使用 Tailwind 类名
export default function Button({ children, variant = 'primary' }) {
  const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-colors'
  const variants = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-500 text-white hover:bg-red-600'
  }

  return (
    <button className={`${baseStyles} ${variants[variant]}`}>
      {children}
    </button>
  )
}
```

### 9.3 Tailwind CSS 详细教程

关于 Tailwind CSS 的详细使用，请参考 **[03_Tailwind_CSS实战.md](./03_Tailwind_CSS实战.md)** 文档。

---

## 10. 性能优化

### 10.1 图片优化

使用 `next/image` 自动优化图片：

```typescript
import Image from 'next/image'

export default function Page() {
  return (
    <Image
      src="/hero.jpg"
      alt="Hero"
      width={1200}
      height={600}
      priority          // 优先加载
      placeholder="blur"
      blurDataURL="..." // 模糊占位图
    />
  )
}
```

### 10.2 动态导入

使用 `next/dynamic` 懒加载组件：

```typescript
import dynamic from 'next/dynamic'

// 动态加载，禁用 SSR
const HeavyComponent = dynamic(
  () => import('./HeavyComponent'),
  {
    ssr: false,
    loading: () => <p>Loading...</p>
  }
)

// 动态加载第三方库
const ReactECharts = dynamic(
  () => import('echarts-for-react'),
  { ssr: false }
)
```

**本项目的实际使用**：

```typescript
// apps/web/src/app/page.tsx
import dynamic from 'next/dynamic'

// 动态加载 ECharts 组件 - 禁用 SSR
const ReactECharts = dynamic(
  () => import('echarts-for-react'),
  { ssr: false }
)

// 使用
{typeof window !== 'undefined' && (
  <ReactECharts
    option={chartOption}
    style={{ height: 300 }}
  />
)}
```

### 10.3 字体优化

使用 `next/font` 自动优化字体加载：

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin', 'chinese'],
  display: 'swap',
})

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" className={inter.className}>
      <body>{children}</body>
    </html>
  )
}
```

### 10.4 脚本优化

使用 `next/script` 优化第三方脚本：

```typescript
import Script from 'next/script'

export default function Page() {
  return (
    <>
      <Script
        src="https://analytics.com/script.js"
        strategy="lazyOnload"    // 空闲时加载
        onLoad={() => {
          console.log('脚本加载完成')
        }}
      />
    </>
  )
}
```

### 10.5 代码分割

Next.js 自动进行代码分割，每个路由只加载必要的代码：

```typescript
// app/page.tsx
// 只有这个页面需要的代码会被打包
import { HeavyLibrary } from 'heavy-library'

export default function Page() {
  return <HeavyLibrary />
}
```

### 10.6 路由预加载

```typescript
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Page() {
  const router = useRouter()

  return (
    <>
      {/* Link 组件会自动预加载 */}
      <Link href="/dashboard">仪表盘</Link>

      {/* 编程式导航时预加载 */}
      <button onClick={() => router.prefetch('/checkout')}>
        结账
      </button>
    </>
  )
}
```

### 10.7 构建优化配置

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['antd'],  // 转译 antd

  // 压缩输出
  compress: true,

  // 图片优化配置
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },

  // 实验性功能
  experimental: {
    optimizePackageImports: ['antd'],
  },
}

module.exports = nextConfig
```

---

## 常见错误和调试技巧

### 错误 1: "async/await in Client Component"

```typescript
// ❌ 错误: 在 useEffect 中直接使用 async/await
useEffect(async () => {
  const data = await fetchData()
}, [])

// ✅ 正确: 在 useEffect 内部定义异步函数
useEffect(() => {
  async function loadData() {
    const data = await fetchData()
  }
  loadData()
}, [])
```

### 错误 2: "params is not resolved"

```typescript
// Next.js 15+ 需要 await params
// ❌ 错误
export default function Page({ params }: { params: { id: string } }) {
  const { id } = params  // 可能还未 resolved
}

// ✅ 正确
interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: PageProps) {
  const { id } = await params
}
```

### 错误 3: "useState used in Server Component"

```typescript
// ❌ 错误: Server Component 不能使用 useState
export default function Page() {
  const [count, setCount] = useState(0) // 错误!
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}

// ✅ 正确: 添加 'use client'
'use client'

export default function Page() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

---

## 总结

Next.js 是一个功能强大的 React 框架，提供了：

1. **App Router** - 现代路由系统，支持 Server Components
2. **Server Components** - 默认在服务端渲染，优化首屏性能
3. **布局系统** - 嵌套布局，状态持久化
4. **数据获取** - Server Actions 和扩展的 fetch API
5. **API Routes** - 前后端一体化开发
6. **性能优化** - 图片优化、代码分割、字体优化等

掌握这些概念，你将能够构建高性能、SEO 友好的现代 Web 应用。
