# 第2卷-框架生态

## 第6章 Next.js框架

### 6.3 Server与Client组件

---

## 6.3 Server与Client组件

### 6.3.1 Server Components（服务器组件）

**参考答案：**

Server Components 是 Next.js App Router 的默认渲染方式，它们只在服务器上运行，不会向客户端发送 JavaScript。

**Server Components 的优势：**

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  
┃                  Server Components 优势                           ┃
┃                                                                  ┃ 
┃  1. 零客户端 JavaScript                                           ┃
┃     ┣━━ 减少 bundle 大小                                          ┃
┃     ┗━━ 加快首屏渲染                                              ┃
┃                                                                  ┃ 
┃  2. 直接访问后端资源                                              ┃
┃     ┣━━ 直接查询数据库                                            ┃
┃     ┣━━ 读取文件系统                                              ┃
┃     ┗━━ 调用内部 API                                              ┃
┃                                                                  ┃ 
┃  3. 自动代码分割                                                  ┃
┃     ┣━━ 每个组件独立打包                                          ┃
┃     ┗━━ 按需加载                                                  ┃
┃                                                                  ┃ 
┃  4. 更好的 SEO                                                   ┃ 
┃     ┣━━ 完整 HTML 内容                                            ┃
┃     ┗━━ 搜索引擎爬虫直接读取                                      ┃
┃                                                                  ┃ 
┃  5. 增强安全性                                                   ┃ 
┃     ┣━━ 敏感代码不泄露                                            ┃
┃     ┗━━ API 密钥安全                                              ┃
┃                                                                  ┃ 
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  

```

**基础示例：**

```tsx
// src/app/posts/page.tsx (Server Component - 默认)
import { db } from '@/lib/db'

async function getPosts() {
  return await db.post.findMany({
    orderBy: { createdAt: 'desc' }
  })
}

export default async function PostsPage() {
  const posts = await getPosts()

  return (
    <main>
      <h1>博客文章</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <h2>{post.title}</h2>
            <p>{post.excerpt}</p>
          </li>
        ))}
      </ul>
    </main>
  )
}
```

**Server Component 中使用数据库：**

```tsx
// src/lib/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

```tsx
// src/app/users/page.tsx
import { prisma } from '@/lib/db'

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
    }
  })

  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Email</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td>{user.id}</td>
            <td>{user.name}</td>
            <td>{user.email}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

---

### 6.3.2 Client Components（客户端组件）

**参考答案：**

当组件需要以下能力时，必须使用 Client Components：
- 使用 useState、useReducer
- 使用 useEffect
- 使用浏览器 API（window、document）
- 使用自定义 hooks 依赖客户端状态
- 事件处理（onClick、onChange）

**使用 'use client' 指令：**

```tsx
// src/components/Counter.tsx
'use client'  // 必须放在文件顶部

import { useState } from 'react'

export function Counter() {
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

**在 Server Component 中使用 Client Component：**

```tsx
// src/app/page.tsx (Server Component)
import { Counter } from '@/components/Counter'  // 导入 Client Component
import { getData } from '@/lib/data'

export default async function Page() {
  const data = await getData()  // 服务器端获取数据

  return (
    <main>
      <h1>{data.title}</h1>
      <Counter />  {/* Client Component 嵌入 */}
    </main>
  )
}
```

**渐进式迁移策略：**

```tsx
// 方式1: 创建分离的 Client Component
// src/components/Counter.tsx
'use client'

import { useState } from 'react'

export function Counter({ initialCount = 0 }) {
  const [count, setCount] = useState(initialCount)

  return (
    <button onClick={() => setCount(count + 1)}>
      {count}
    </button>
  )
}

// src/app/page.tsx
import { Counter } from '@/components/Counter'

export default function Page() {
  return <Counter initialCount={10} />
}
```

---

### 6.3.3 组件树与渲染流程

**参考答案：**

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   
┃                    Next.js 组件渲染流程                           ┃ 
┃                                                                  ┃  
┃  请求 → Server Components 渲染 →                                  ┃ 
┃       ┣━━ 静态内容 → HTML                                          ┃
┃       ┗━━ 动态内容 → RSC Payload → Client Components              ┃ 
┃                                                                  ┃  
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    ┃   
┃  ┃  app/                                                    ┃    ┃  
┃  ┃  ┣━━ layout.tsx (Server) ━━→ HTML                      ┃    ┃    
┃  ┃  ┃   ┗━━ page.tsx (Server) ━━→ HTML                    ┃    ┃    
┃  ┃  ┃       ┗━━ Counter.tsx ('use client')                 ┃    ┃   
┃  ┃  ┃           ┗━━ 客户端 hydration                        ┃    ┃  
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    ┃   
┃                                                                  ┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   

```

**混合渲染模式：**

```tsx
// src/app/page.tsx (Server Component)
import { Header } from '@/components/Header'
import { PostList } from '@/components/PostList'
import { UserCard } from '@/components/UserCard'

export default async function Page() {
  // 并行获取数据
  const [posts, user] = await Promise.all([
    getPosts(),
    getCurrentUser()
  ])

  return (
    <div>
      <Header user={user} /> {/* Client Component */}
      <main>
        <PostList posts={posts} /> {/* Client Component */}
        <UserCard user={user} />  {/* Client Component */}
      </main>
    </div>
  )
}
```

---

### 6.3.4 数据获取最佳实践

**参考答案：**

**在 Server Component 中直接获取数据：**

```tsx
// src/app/blog/page.tsx
async function getPosts() {
  const res = await fetch('https://api.example.com/posts', {
    // 缓存策略
    cache: 'force-cache',  // 默认，静态缓存
    // next: { revalidate: 60 }  // ISR
  })

  if (!res.ok) {
    throw new Error('Failed to fetch posts')
  }

  return res.json()
}

export default async function BlogPage() {
  const posts = await getPosts()

  return (
    <div>
      {posts.map((post) => (
        <article key={post.id}>{post.title}</article>
      ))}
    </div>
  )
}
```

**使用 React.cache 缓存数据请求：**

```tsx
// src/lib/data.ts
import { cache } from 'react'

export const getPost = cache(async (slug: string) => {
  const res = await fetch(`https://api.example.com/posts/${slug}`)
  return res.json()
})

export const getPosts = cache(async () => {
  const res = await fetch('https://api.example.com/posts')
  return res.json()
})
```

```tsx
// src/app/blog/[slug]/page.tsx
import { getPost, getPosts } from '@/lib/data'

// 同时在 generateMetadata 和页面中使用，不会重复请求
export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug)  // 不会重复请求

  return { title: post.title }
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug)  // 不会重复请求

  return <article>{post.content}</article>
}
```

---

### 6.3.5 Streaming 与 Suspense

**参考答案：**

**Suspense 边界：**

```tsx
// src/app/page.tsx
import { Suspense } from 'react'
import { PostFeed, Weather, RecommendedPosts } from '@/components'

export default function Page() {
  return (
    <div>
      <Suspense fallback={<p>加载动态内容...</p>}>
        <Weather />
      </Suspense>

      <Suspense fallback={<PostSkeleton />}>
        <PostFeed />
      </Suspense>

      <Suspense fallback={<RecommendedSkeleton />}>
        <RecommendedPosts />
      </Suspense>
    </div>
  )
}
```

**loading.tsx 简化加载状态：**

```tsx
// src/app/dashboard/loading.tsx
export default function Loading() {
  return (
    <div className="loading-skeleton">
      <div className="skeleton-header" />
      <div className="skeleton-content">
        <div className="skeleton-line" />
        <div className="skeleton-line" />
        <div className="skeleton-line" />
      </div>
    </div>
  )
}
```

**流式数据获取：**

```tsx
// src/app/blog/page.tsx
import { Suspense } from 'react'
import { PostList } from '@/components/PostList'
import { PostListSkeleton } from '@/components/skeletons'

export default function BlogPage() {
  return (
    <div>
      <h1>Blog</h1>
      <Suspense fallback={<PostListSkeleton />}>
        <PostList />
      </Suspense>
    </div>
  )
}
```

```tsx
// src/components/PostList.tsx (异步组件)
import { getPosts } from '@/lib/posts'

export async function PostList() {
  const posts = await getPosts()

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

---

### 6.3.6 Server Actions

**参考答案：**

Server Actions 允许在服务器上执行函数。

**基础用法：**

```tsx
// src/app/actions.ts
'use server'

export async function createPost(formData: FormData) {
  const title = formData.get('title')
  const content = formData.get('content')

  await db.post.create({
    data: { title, content }
  })

  revalidatePath('/posts')
}
```

**在表单中使用：**

```tsx
// src/app/posts/page.tsx
'use client'

import { createPost } from '@/app/actions'

export function PostForm() {
  return (
    <form action={createPost}>
      <input type="text" name="title" required />
      <textarea name="content" required />
      <button type="submit">创建</button>
    </form>
  )
}
```

**带状态处理的表单：**

```tsx
// src/components/CreatePost.tsx
'use client'

import { useState, useTransition } from 'react'
import { createPost } from '@/app/actions'

export function CreatePost() {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState('')

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        await createPost(formData)
        setMessage('创建成功！')
      } catch (error) {
        setMessage('创建失败')
      }
    })
  }

  return (
    <form action={handleSubmit}>
      <input type="text" name="title" required />
      <textarea name="content" required />
      <button type="submit" disabled={isPending}>
        {isPending ? '提交中...' : '创建'}
      </button>
      {message && <p>{message}</p>}
    </form>
  )
}
```

**类型安全的 Server Actions：**

```tsx
// src/types/actions.ts
'use server'

import { z } from 'zod'

const PostSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(10),
})

export async function createPost(prevState: any, formData: FormData) {
  const validatedFields = PostSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  await db.post.create({
    data: validatedFields.data,
  })

  return { message: '创建成功' }
}
```

---

### 6.3.7 面试常见问题

**Q1: Server Components 和 Client Components 如何选择？**

| 场景 | 推荐 |
|:---|:---|
| 数据获取 | Server Components |
| 直接访问数据库/文件系统 | Server Components |
| SEO 优化 | Server Components |
| 交互（点击、输入） | Client Components |
| 使用 hooks | Client Components |
| 浏览器 API | Client Components |
| 第三方组件 | Client Components |

**Q2: 'use client' 的作用是什么？**

- 将组件标记为客户端组件
- 组件会在客户端执行 hydration
- 组件的 JavaScript 会发送到客户端
- 嵌套在 Server Component 中的 Client Component 仍然可以正常工作

**Q3: 什么是 React Server Components？**

Server Components 是 React 18/19 引入的新特性：
- 只在服务器渲染
- 不发送 JavaScript 到客户端
- 可以直接使用异步/await
- 自动缓存数据请求

**Q4: Next.js 15 缓存行为有什么变化？**

Next.js 15 中：
- fetch 请求默认不缓存
- 需要显式设置缓存策略
- use() API 可用于读取 Promise

---

> **面试提示**：Server/Client Components 是 Next.js 最核心的概念，也是大厂面试的重点。要深入理解渲染边界和数据流。
