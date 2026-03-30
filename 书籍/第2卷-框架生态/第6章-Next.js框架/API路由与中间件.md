# 第2卷-框架生态

## 第6章 Next.js框架

### 6.8 API路由与中间件

---

## 6.8 API路由与中间件

### 6.8.1 Route Handlers（路由处理）

**参考答案：**

Route Handlers 允许创建 API 端点。

**基础用法：**

```tsx
// src/app/api/hello/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'Hello, World!',
    timestamp: new Date().toISOString(),
  })
}
```

**处理不同 HTTP 方法：**

```tsx
// src/app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server'

// GET 获取列表
export async function GET(request: NextRequest) {
  const posts = await getPosts()

  return NextResponse.json(posts)
}

// POST 创建
export async function POST(request: NextRequest) {
  const body = await request.json()

  const post = await createPost(body)

  return NextResponse.json(post, { status: 201 })
}

// PUT 更新
export async function PUT(request: NextRequest) {
  const body = await request.json()

  const post = await updatePost(body)

  return NextResponse.json(post)
}

// DELETE 删除
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  await deletePost(id!)

  return NextResponse.json({ success: true })
}
```

---

### 6.8.2 动态路由参数

**参考答案：**

```tsx
// src/app/api/posts/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server'

interface Props {
  params: Promise<{ slug: string }>
}

export async function GET(request: NextRequest, { params }: Props) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(post)
}

export async function PUT(request: NextRequest, { params }: Props) {
  const { slug } = await params
  const body = await request.json()

  const post = await updatePost(slug, body)

  return NextResponse.json(post)
}

export async function DELETE(request: NextRequest, { params }: Props) {
  const { slug } = await params

  await deletePost(slug)

  return NextResponse.json({ success: true })
}
```

---

### 6.8.3 查询参数处理

**参考答案：**

```tsx
// src/app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const query = searchParams.get('q')
  const page = searchParams.get('page') || '1'
  const limit = searchParams.get('limit') || '10'

  const results = await searchPosts({
    query,
    page: parseInt(page),
    limit: parseInt(limit),
  })

  return NextResponse.json(results)
}
```

---

### 6.8.4 请求体处理

**参考答案：**

**JSON：**

```tsx
export async function POST(request: NextRequest) {
  const body = await request.json()

  return NextResponse.json({ received: body })
}
```

**FormData：**

```tsx
export async function POST(request: NextRequest) {
  const formData = await request.formData()

  const name = formData.get('name')
  const file = formData.get('file') as File

  return NextResponse.json({
    name,
    fileSize: file.size,
  })
}
```

**文本：**

```tsx
export async function POST(request: NextRequest) {
  const text = await request.text()

  return NextResponse.json({ text })
}
```

---

### 6.8.5 中间件（Middleware）

**参考答案：**

**基础用法：**

```tsx
// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 获取请求路径
  const path = request.nextUrl.pathname

  // 公共路径
  const isPublicPath = path === '/' || path === '/about'

  // 获取 token
  const token = request.cookies.get('token')?.value

  // 未登录且访问受保护路径
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 已登录且访问登录页
  if (isPublicPath && token && path === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

// 配置匹配规则
export const config = {
  matcher: [
    /*
     * 匹配所有路径除了:
     * - api 路由
     * - _next/static
     * - _next/image
     * - favicon.ico
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

---

### 6.8.6 中间件进阶

**参考答案：**

**A/B 测试：**

```tsx
// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // 检查是否有 bucket cookie
  let bucket = request.cookies.get('ab-bucket')?.value

  // 如果没有，随机分配
  if (!bucket) {
    bucket = Math.random() < 0.5 ? 'a' : 'b'
    response.cookies.set('ab-bucket', bucket)
  }

  // 添加 header 供后端使用
  response.headers.set('x-ab-bucket', bucket)

  return response
}

export const config = {
  matcher: '/:path*',
}
```

**速率限制：**

```tsx
// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 简单速率限制（生产环境建议使用 Redis）
const rateLimit = new Map<string, { count: number; timestamp: number }>()

export async function middleware(request: NextRequest) {
  const ip = request.ip || 'unknown'
  const now = Date.now()
  const windowMs = 60 * 1000 // 1分钟
  const maxRequests = 100

  const record = rateLimit.get(ip)

  if (record && now - record.timestamp < windowMs) {
    if (record.count >= maxRequests) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }
    record.count++
  } else {
    rateLimit.set(ip, { count: 1, timestamp: now })
  }

  return NextResponse.next()
}
```

---

### 6.8.7 代理（Proxy）

**参考答案：**

```tsx
// src/app/api/proxy/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const targetUrl = `https://api.example.com/${path.join('/')}`

  const response = await fetch(targetUrl, {
    headers: {
      'Authorization': request.headers.get('Authorization') || '',
    },
  })

  const data = await response.json()

  return NextResponse.json(data)
}
```

---

### 6.8.8 面试常见问题

**Q1: Route Handlers 和 API Routes 有什么区别？**

- Route Handlers: App Router 的 API 路由，使用 route.ts 文件
- API Routes: Pages Router 的 API 路由，使用 pages/api/*.ts

**Q2: Middleware 的执行顺序？**

1. Middleware
2. Route Handlers / Pages
3. getStaticProps / Server Components

**Q3: Middleware 可以做哪些事？**

- 认证/授权
- 重定向/重写
- A/B 测试
- 日志记录
- 速率限制
- 请求头修改

---

> **面试提示**：API 路由和中间件是企业级应用的核心部分，需要深入理解请求处理流程和中间件的执行机制。
