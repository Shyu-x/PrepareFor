# 第2卷-框架生态

## 第6章 Next.js框架

### 6.1 Next.js入门与安装

---

## 6.1 Next.js入门与安装

### 6.1.1 Next.js简介

**参考答案：**

Next.js 是由 Vercel 创建的 React 框架，用于构建全栈 Web 应用程序。它扩展了最新的 React 功能，并集成了强大的基于 Rust 的 JavaScript 工具（TurboPack），以实现最快的构建速度。

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  
┃                        Next.js 核心特性                           ┃
┃                                                                  ┃ 
┃  ┏━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━┓           ┃     
┃  ┃   App Router ┃  ┃ Server       ┃  ┃  Turbopack  ┃           ┃   
┃  ┃  (文件路由)   ┃  ┃ Components   ┃  ┃  (极速构建)  ┃           ┃ 
┃  ┗━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━┛           ┃     
┃                                                                  ┃ 
┃  ┏━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━┓           ┃     
┃  ┃   图像优化   ┃  ┃   字体优化   ┃  ┃   API路由   ┃           ┃   
┃  ┗━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━┛           ┃     
┃                                                                  ┃ 
┃  ┏━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━┓           ┃     
┃  ┃    ISR      ┃  ┃   Middleware ┃  ┃   部署平台  ┃           ┃    
┃  ┃ (增量静态)   ┃  ┃   (中间件)   ┃  ┃   (Vercel)  ┃           ┃   
┃  ┗━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━┛           ┃     
┃                                                                  ┃ 
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  

```

**Next.js vs 其他框架对比：**

| 特性 | Next.js | Gatsby | Remix | Create React App |
|:---|:---|:---|:---|:---|
| 路由方式 | 文件系统 | 文件系统 | 文件系统 | 客户端路由 |
| 渲染模式 | 多模式 | SSG为主 | 多模式 | CSR |
| 构建工具 | TurboPack/Webpack | Webpack | Vite | Webpack |
| 数据获取 | fetch API | GraphQL | loaders/actions | useEffect |
| 部署 | Vercel/Node.js | 静态/云 | 边缘 | 静态/Node |

---

### 6.1.2 环境要求与安装

**参考答案：**

**环境要求：**

```
| 要求 | 最低版本 |
|:---|:---|
| Node.js | 18.17.0+ |
| npm | 9.0.0+ |
| yarn | 1.22.0+ |
| pnpm | 8.0.0+ |
```

**安装方式：**

```bash
# 方式1: 使用 create-next-app（推荐）
npx create-next-app@latest my-app

# 方式2: 指定选项安装
npx create-next-app@latest my-app \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-npm

# 方式3: 使用 yarn
yarn create next-app my-app

# 方式4: 使用 pnpm
pnpm create next-app my-app
```

**create-next-app 选项说明：**

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  
┃                   create-next-app 选项                            ┃
┃                                                                  ┃ 
┃  TypeScript:        ✓  使用 TypeScript                          ┃  
┃  ESLint:            ✓  使用 ESLint 代码检查                     ┃  
┃  Tailwind CSS:      ✓  使用 Tailwind CSS 样式                  ┃   
┃  `src/` directory:  ✓  使用 src 目录                           ┃   
┃  App Router:        ✓  使用 App Router (新)                     ┃  
┃  Customize default:    自定义导入别名                            ┃ 
┃  Import alias:      @/*  导入别名                               ┃  
┃                                                                  ┃ 
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  

```

---

### 6.1.3 项目结构详解

**参考答案：**

```
next-app/
┣━━ .next/                  # 构建输出（构建后生成）
┃   ┣━━ app/               # App Router 构建输出
┃   ┣━━ cache/             # 缓存文件
┃   ┣━━ static/            # 静态资源
┃   ┗━━ server/            # 服务器构建输出
┃
┣━━ public/                 # 静态资源目录
┃   ┣━━ favicon.ico       # 网站图标
┃   ┣━━ og-image.png      # 社交分享图
┃   ┗━━ locales/          # 国际化静态文件
┃
┣━━ src/
┃   ┣━━ app/              # App Router（推荐）
┃   ┃   ┣━━ page.tsx     # 页面组件 (/)
┃   ┃   ┣━━ layout.tsx   # 布局组件
┃   ┃   ┣━━ loading.tsx  # 加载组件
┃   ┃   ┣━━ error.tsx   # 错误边界
┃   ┃   ┣━━ not-found.tsx # 404页面
┃   ┃   ┣━━ api/         # API 路由
┃   ┃   ┃   ┗━━ hello/
┃   ┃   ┃       ┗━━ route.ts
┃   ┃   ┣━━ (group)/    # 路由组
┃   ┃   ┃   ┗━━ page.tsx
┃   ┃   ┗━━ [slug]/    # 动态路由
┃   ┃       ┗━━ page.tsx
┃   ┃
┃   ┣━━ pages/           # Pages Router（旧版）
┃   ┃   ┣━━ _app.tsx    # 应用入口
┃   ┃   ┣━━ _document.tsx # 文档结构
┃   ┃   ┣━━ index.tsx   # 首页
┃   ┃   ┗━━ api/        # API 路由
┃   ┃
┃   ┣━━ components/      # 组件目录
┃   ┃   ┣━━ ui/         # UI 组件
┃   ┃   ┗━━ features/   # 功能组件
┃   ┃
┃   ┣━━ lib/            # 工具函数
┃   ┃   ┣━━ db.ts       # 数据库
┃   ┃   ┣━━ utils.ts   # 工具函数
┃   ┃   ┗━━ auth.ts    # 认证
┃   ┃
┃   ┣━━ hooks/          # 自定义Hooks
┃   ┃
┃   ┣━━ styles/         # 样式文件
┃   ┃   ┗━━ globals.css
┃   ┃
┃   ┗━━ types/          # TypeScript 类型
┃
┣━━ .eslintrc.json      # ESLint 配置
┣━━ .gitignore          # Git 忽略配置
┣━━ next.config.js      # Next.js 配置
┣━━ next-env.d.ts       # TypeScript 声明
┣━━ package.json        # 依赖配置
┣━━ postcss.config.js   # PostCSS 配置
┣━━ tailwind.config.ts  # Tailwind 配置
┗━━ tsconfig.json       # TypeScript 配置
```

**App Router vs Pages Router 结构对比：**

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  
┃                    App Router vs Pages Router                     ┃
┃                                                                  ┃ 
┃  App Router (新 - 推荐)                                          ┃ 
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ┃   
┃  ┃  app/                                                     ┃  ┃  
┃  ┃  ┣━━ page.tsx            →  /                            ┃  ┃   
┃  ┃  ┣━━ about/page.tsx      →  /about                       ┃  ┃   
┃  ┃  ┣━━ blog/[slug]/page.tsx →  /blog/:slug                ┃  ┃    
┃  ┃  ┗━━ api/posts/route.ts  →  /api/posts                  ┃  ┃    
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ┃   
┃                                                                  ┃ 
┃  Pages Router (旧)                                               ┃ 
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ┃   
┃  ┃  pages/                                                    ┃  ┃ 
┃  ┃  ┣━━ index.tsx           →  /                            ┃  ┃   
┃  ┃  ┣━━ about.tsx           →  /about                       ┃  ┃   
┃  ┃  ┣━━ blog/[slug].tsx     →  /blog/:slug                  ┃  ┃   
┃  ┃  ┗━━ api/posts/index.ts  →  /api/posts                    ┃  ┃  
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ┃   
┃                                                                  ┃ 
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  

```

---

### 6.1.4 快速入门示例

**参考答案：**

**创建第一个页面：**

```tsx
// src/app/page.tsx
import Link from 'next/link'

export default function HomePage() {
  return (
    <main>
      <h1>欢迎使用 Next.js</h1>
      <p>开始构建你的应用</p>
      <Link href="/about">关于页面</Link>
    </main>
  )
}
```

**创建布局：**

```tsx
// src/app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '我的Next.js应用',
  description: '一个使用Next.js构建的应用',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        <nav>
          <Link href="/">首页</Link>
          <Link href="/about">关于</Link>
          <Link href="/blog">博客</Link>
        </nav>
        {children}
      </body>
    </html>
  )
}
```

**创建动态路由：**

```tsx
// src/app/blog/[slug]/page.tsx
interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const posts = ['hello', 'world', 'nextjs']
  return posts.map((slug) => ({ slug }))
}

export default async function BlogPost({ params }: PageProps) {
  const { slug } = await params

  return (
    <article>
      <h1>博客文章: {slug}</h1>
      <p>这是关于 {slug} 的内容</p>
    </article>
  )
}
```

**创建API路由：**

```tsx
// src/app/api/hello/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'Hello, Next.js!',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: Request) {
  const body = await request.json()

  return NextResponse.json({
    received: body,
    message: '数据已接收'
  })
}
```

---

### 6.1.5 面试常见问题

**Q1: Next.js 16有哪些新特性？**

| 特性 | 说明 |
|:---|:---|
| **Cache Components** | 显式缓存机制，使用 `use cache` 指令声明式缓存组件和函数 |
| **Turbopack 稳定版** | 成为默认构建工具，构建速度大幅提升 |
| **布局去重** | Layout Deduplication 自动消除重复布局渲染 |
| **增量预取** | Incremental Prefetching 加快页面跳转速度 |
| **AI 调试集成** | 通过 Model Context Protocol 支持 AI 辅助调试 |
| **DevTools 增强** | 更完善的路由信息和组件检查工具 |

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   
┃                    Next.js 16 核心架构                             ┃
┃                                                                  ┃  
┃   ┏━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━┓           ┃     
┃   ┃    Cache    ┃  ┃  Turbopack  ┃  ┃   Layout    ┃           ┃     
┃   ┃ Components  ┃  ┃   (稳定)     ┃  ┃ Dedup       ┃           ┃    
┃   ┃ (显式缓存)   ┃  ┃  (默认构建)  ┃  ┃ (去重渲染)  ┃           ┃   
┃   ┗━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━┛           ┃     
┃                                                                  ┃  
┃   ┏━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━┓  ┏━━━━━━━━━━━━━┓           ┃     
┃   ┃  Increm-    ┃  ┃    AI       ┃  ┃  DevTools   ┃           ┃     
┃   ┃  ental      ┃  ┃  Debugging  ┃  ┃  Enhanced   ┃           ┃     
┃   ┃  Prefetch   ┃  ┃  (MCP集成)  ┃  ┃   (增强)    ┃           ┃     
┃   ┗━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━┛  ┗━━━━━━━━━━━━━┛           ┃     
┃                                                                  ┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   

```

**Q2: Next.js 16 vs 15 对比**

| 特性 | Next.js 15 | Next.js 16 |
|:---|:---|:---|
| 缓存机制 | 隐式缓存 | 显式缓存 (use cache) |
| 构建工具 | Turbopack Beta | Turbopack 稳定 (默认) |
| 布局渲染 | 每次重新渲染 | 自动去重 |
| 预取策略 | 基础预取 | 增量预取 |
| 调试工具 | 基础 | AI 集成 |

**Q3: 如何选择 App Router 还是 Pages Router？**

| 场景 | 推荐 |
|:---|:---|
| 新项目 | App Router |
| 需要 Server Components | App Router |
| 需要渐进式迁移 | Pages Router |
| 旧项目维护 | Pages Router |

**Q3: create-next-app 的 --src-dir 选项是什么意思？**

指定将应用代码放在 `src/` 目录下，这是 Next.js 官方推荐的项目结构，可以更好地分离源代码和配置文件。

---

> **面试提示**：Next.js 入门问题是面试热身题的常见内容，要熟悉 create-next-app 的各种选项和项目结构。
