# Next.js App Router 源码深度分析

> 本文深入解析 Next.js 13+ App Router 的核心架构：app 目录结构、路由匹配与布局、RSC 渲染流程、Server Actions 执行原理。

## 一、App Router 概述

### 1.1 App Router vs Pages Router

| 特性 | App Router | Pages Router |
|------|------------|--------------|
| **路由目录** | `app/` | `pages/` |
| **组件默认渲染** | 服务端 | 客户端（需要 "use client"） |
| **布局系统** | 支持嵌套布局 | 需要手动处理 |
| **流式渲染** | 原生支持 | 需要额外配置 |
| **错误处理** | Error Boundary 内置 | 需要第三方库 |
| **loading.tsx** | 原生支持 | 不支持 |

### 1.2 App 目录结构

```
app/
├── layout.tsx              # 根布局（所有页面共享）
├── page.tsx                # 首页（/）
├── page.module.css         # 首页样式
├── loading.tsx             # 加载状态
├── error.tsx               # 错误边界
├── not-found.tsx           # 404 页面
├── global.css              # 全局样式
│
├── about/                  # /about 路由
│   ├── page.tsx           # /about 页面
│   └── layout.tsx         # /about 专属布局
│
├── blog/                   # /blog 路由组
│   ├── page.tsx           # /blog 页面
│   ├── [slug]/            # 动态路由片段
│   │   ├── page.tsx       # /blog/:slug 页面
│   │   └── loading.tsx    # 博客文章加载状态
│   └── layout.tsx         # 博客专区布局
│
├── dashboard/
│   ├── (auth)/            # 路由组（不影响 URL）
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (protected)/       # 受保护的路由组
│   │   ├── layout.tsx     # 检查登录状态
│   │   └── settings/page.tsx
│   └── page.tsx           # /dashboard
│
└── api/                   # API 路由
    └── users/
        └── route.ts       # /api/users
```

### 1.3 核心文件约定

| 文件 | 作用 | 特殊说明 |
|------|------|----------|
| `layout.tsx` | 布局组件 | 必须是服务端组件 |
| `page.tsx` | 页面组件 | 导出 default 组件 |
| `loading.tsx` | 加载状态 | Suspense 边界 |
| `error.tsx` | 错误边界 | Error Boundary |
| `not-found.tsx` | 404 页面 | notFound() 调用 |
| `route.ts` | API 路由 | 导出 HTTP 方法 |
| `template.tsx` | 每次渲染新实例 | 区别于 layout |

## 二、路由匹配与布局

### 2.1 路由匹配核心流程

```typescript
// packages/next/src/server/request/handler.ts
// 路由匹配的简化流程

/**
 * Next.js App Router 路由匹配过程
 *
 * 1. 接收请求（Request）
 * 2. 解析路径（URL）
 * 3. 遍历 app/ 目录，构建匹配树
 * 4. 找到最佳匹配的 page.tsx
 * 5. 收集所有匹配的 layout.tsx
 * 6. 从外到内执行布局组件
 * 7. 最后执行 page 组件
 */

// 路由匹配数据结构
interface RouteMatch {
  // 路径片段
  pathname: string;

  // 匹配的 page.tsx 位置
  page: string;

  // 匹配的 layout.tsx 数组（从根到叶子）
  layouts: LayoutFile[];

  // 动态参数
  params: Record<string, string>;

  // 搜索参数
  searchParams: Record<string, string>;
}

// 匹配过程伪代码
function matchRoute(pathname: string): RouteMatch {
  // 1. 分割路径
  const segments = pathname.split('/').filter(Boolean);

  // 2. 递归匹配每个片段
  let currentPath = '';
  const layouts = [];

  for (const segment of segments) {
    currentPath += `/${segment}`;

    // 查找是否有对应的 layout
    const layoutPath = findLayout(currentPath);
    if (layoutPath) {
      layouts.push(layoutPath);
    }
  }

  // 3. 查找 page.tsx
  const pagePath = findPage(pathname);

  // 4. 提取动态参数
  const params = extractParams(pathname, pagePath);

  return { pathname, page: pagePath, layouts, params };
}
```

### 2.2 布局系统实现

```typescript
// packages/next/src/server/components/layout.ts
// 布局组件渲染

/**
 * 布局渲染流程
 *
 * 布局结构（从外到内）：
 * Root Layout (app/layout.tsx)
 *   └── Group Layout (app/blog/layout.tsx)
 *       └── Page (app/blog/page.tsx)
 *
 * 每个 layout 接收 children 属性，指向内层组件
 */

// layout.tsx 约定
// 根布局必须包含 <html> 和 <body>
export default function RootLayout({
  children,    // 内层 layout 或 page
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        {/* 导航栏 */}
        <nav>...</nav>

        {/* 子页面 */}
        {children}

        {/* 页脚 */}
        <footer>...</footer>
      </body>
    </html>
  );
}

/**
 * 嵌套布局的执行流程
 */
async function renderLayoutTree(
  pathname: string,
  ctx: RenderContext
): Promise<React.ReactNode> {
  // 1. 获取匹配的 layouts
  const layouts = getMatchedLayouts(pathname);

  // 2. 从根到叶子，依次渲染
  // React.createElement(Layout1, { children:
  //   React.createElement(Layout2, { children:
  //     React.createElement(Page, props)
  //   })
  // })

  let children = await renderPage(pathname, ctx);

  for (const layout of layouts.reverse()) {
    children = await renderLayout(layout, {
      ...ctx,
      children,
    });
  }

  return children;
}
```

### 2.3 动态路由与参数

```typescript
// 动态路由片段
// app/blog/[slug]/page.tsx

interface PageProps {
  params: {
    slug: string;
  };
}

// 静态生成 + 动态参数
export async function generateStaticParams() {
  const posts = await fetchPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// 页面组件接收 params
export default async function Page({ params }: PageProps) {
  const post = await fetchPost(params.slug);
  return <Article post={post} />;
}

// 多层动态路由
// app/[category]/[subcategory]/[item]/page.tsx
interface PageProps {
  params: {
    category: string;
    subcategory: string;
    item: string;
  };
}
```

## 三、RSC 渲染流程

### 3.1 React Server Components 概述

| 概念 | 说明 |
|------|------|
| **Server Components** | 在服务端渲染的组件，不能使用 hooks 或浏览器 API |
| **Client Components** | 客户端组件，使用 "use client" 声明 |
| **Server Actions** | 在服务端执行的异步函数，可从客户端调用 |
| **Streaming** | 流式渲染，逐步发送内容 |

```typescript
// Server Component（默认）
// app/page.tsx
// 无 "use client" 声明，默认在服务端渲染

async function Page() {
  // 可以直接使用 await
  const data = await fetchData();

  return <div>{data.title}</div>;
}

// Client Component
// app/components/Button.tsx
"use client";

import { useState } from 'react';

function Button() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### 3.2 RSC 渲染核心实现

```typescript
// packages/next/src/server/app-render/app-render.tsx
// RSC 渲染核心

/**
 * RSC 渲染流程
 *
 * 1. 编译阶段：JSX -> React Server Component
 * 2. 服务端渲染：RSC Payload
 * 3. 客户端渲染：RSC Payload -> React DOM
 */

/**
 * RSC Payload 格式
 * 这是服务端发送给客户端的数据结构
 */
interface RSCPayload {
  // 服务端渲染的组件树（Flight 格式）
  // 包含组件类型、props、以及 slot
  flights: string[];

  // 样式表
  styles?: SSRManifest['styles'];

  // Head 元素
  head?: string;
}

/**
 * Flight 格式示例
 *
 * 客户端收到类似：
 * ['$', 'div', null, {
 *   'className': 'container',
 *   'children': [
 *     '$', 'h1', null, 'Hello'
 *   ]
 * }]
 *
 * 第一个元素：React 元素标记
 * 第二个元素：组件类型
 * 第三个元素：key
 * 第四个元素：props
 */

// renderToPipeableStream / renderToReadableStream
// 将 React 树渲染为流

import { renderToReadableStream } from 'react-dom/server';

async function renderRSC(
  element: React.ReactElement,
  ctx: RenderContext
): Promise<ReadableStream> {
  // 1. 将 React 元素渲染为 RSC Payload 流
  const stream = await renderToReadableStream(element, {
    // 服务端组件模块引用
    moduleMap: createModuleMap(ctx),
    // 错误处理
    onError: (error) => {
      console.error('RSC Render Error:', error);
    },
  });

  return stream;
}

/**
 * 客户端接收 RSC Payload
 * 使用 React 提供的 Flight Client 解析
 */
import { createFromReadableStream } from 'react-dom/rsc';

function ClientComponent() {
  const [stream, setStream] = useState(null);

  useEffect(() => {
    // 发送请求到服务端
    fetch('/api/render?path=/page')
      .then((res) => res.body)
      .then((body) => {
        if (body) {
          // 使用 Flight 解析流
          const flightStream = createFromReadableStream(body);
          setStream(flightStream);
        }
      });
  }, []);

  return stream;
}
```

### 3.3 服务端组件 vs 客户端组件边界

```typescript
// packages/next/src/server/components/flip-quote.ts
// 组件"翻转"机制

/**
 * Next.js 使用 "flip" 机制处理服务端/客户端组件边界
 *
 * 当遇到客户端组件时：
 * 1. 服务端停止渲染该子树
 * 2. 将该组件序列化为 placeholder
 * 3. 客户端接收后，替换为实际的客户端组件
 */

/**
 * 边界标记
 *
 * 服务端组件被打上 'RSC' 标记
 * 客户端组件被打上 'client' 标记
 */

// 示例：服务端组件中使用客户端组件
// app/page.tsx（服务端组件）
async function Page() {
  return (
    <div>
      {/* 这个组件会在服务端渲染 */}
      <ServerOnlyComponent />

      {/* 这个组件会作为占位符发送给客户端 */}
      {/* 客户端会用实际的 Button 替换它 */}
      <Button />
    </div>
  );
}

// app/components/Button.tsx（客户端组件）
"use client";

function Button() {
  return <button>Click me</button>;
}

// 生成的 RSC Payload 类似：
// [
//   '$', 'div', null, {
//     'children': [
//       ['$', ServerOnlyComponent, null, {}],
//       ['$', 'Button', null, {}]  // 占位符
//     ]
//   }
// ]
```

### 3.4 流式渲染 (Streaming)

```typescript
// packages/next/src/server/app-render/streaming.ts
// Streaming 实现

/**
 * Streaming 渲染流程
 *
 * 1. 服务端开始渲染 HTML
 * 2. 遇到 <Suspense> 边界，发送 Suspense fallback
 * 3. 异步数据加载完成后，串流发送实际内容
 * 4. 客户端渐进式渲染和替换
 */

import { Suspense } from 'react';

// loading.tsx 对应 Suspense 边界
// Next.js 自动将 loading.tsx 内容包裹在 Suspense 中

// app/blog/loading.tsx
export default function Loading() {
  return <div>Loading posts...</div>;
}

// app/blog/page.tsx
async function BlogPage() {
  // 这个异步操作会被 Suspense 包裹
  const posts = await fetchPosts();

  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

// 生成的 HTML 流结构
// <div>Loading posts...</div>  <- 先发送
// <script>...</script>          <- 后续内容通过脚本注入
```

## 四、Server Actions 执行

### 4.1 Server Actions 概述

| 特性 | 说明 |
|------|------|
| **本质** | 在服务端执行的异步函数 |
| **调用方式** | 可从客户端组件直接调用 |
| **自动序列化** | 参数和返回值自动序列化 |
| **重新验证** | 支持 revalidatePath/revalidateTag |
| **乐观更新** | 结合 useOptimistic 实现乐观 UI |

```typescript
// app/actions.ts
// 定义 Server Action

/**
 * Server Action 函数
 * 使用 'use server' 声明
 */
'use server';

import { revalidatePath } from 'next/cache';

// 异步 Server Action
async function createPost(formData: FormData) {
  'use server';

  const title = formData.get('title');
  const content = formData.get('content');

  // 直接访问数据库
  await db.post.create({
    data: { title, content },
  });

  // 重新验证缓存
  revalidatePath('/blog');
}

// 带返回值的 Server Action
async function getPost(id: string) {
  'use server';

  const post = await db.post.findUnique({
    where: { id },
  });

  return post;
}
```

### 4.2 Server Actions 核心实现

```typescript
// packages/next/src/server/app-render/server-actions.ts
// Server Actions 实现

/**
 * Server Actions 执行流程
 *
 * 1. 服务端定义带 'use server' 的函数
 * 2. 编译时：生成唯一的 action ID 和代理函数
 * 3. 客户端调用：使用 action ID 调用 /__nextjs/server-actions
 * 4. 服务端执行：找到对应的函数，执行并返回结果
 */

/**
 * 客户端代理
 * 编译时生成，替代原始的 Server Action
 */

// 客户端调用 Server Action
'use client';

import { createPost } from './actions';

function CreatePostForm() {
  return (
    <form action={createPost}>
      <input name="title" />
      <input name="content" />
      <button type="submit">Create</button>
    </form>
  );
}

// 编译后的客户端代理大致如下：
const createPost = async (...args: Parameters<typeof createPost>) => {
  // 1. 收集参数
  const serializedArgs = serialize(args);

  // 2. 发送 POST 请求
  const response = await fetch('/__nextjs/server-actions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-action-id': 'createPost',  // action 标识
    },
    body: JSON.stringify({
      args: serializedArgs,
      action: 'server',
    }),
  });

  // 3. 解析响应
  const result = await response.json();

  // 4. 返回反序列化结果
  return deserialize(result);
};

/**
 * 服务端处理
 */
async function handleServerAction(request: Request) {
  // 1. 提取 action ID
  const actionId = request.headers.get('x-action-id');

  // 2. 获取 action 函数
  const action = getServerAction(actionId);

  // 3. 解析参数
  const { args } = await request.json();
  const deserializedArgs = deserialize(args);

  // 4. 执行 action
  const result = await action(...deserializedArgs);

  // 5. 重新验证缓存（如果有）
  await processCacheRevalidation();

  // 6. 返回结果
  return Response.json({ result: serialize(result) });
}
```

### 4.3 Server Actions 与表单

```typescript
// packages/next/src/client/components/form.ts
// 表单与 Server Actions 集成

/**
 * 表单提交到 Server Action
 *
 * Next.js 对 <form action> 做了特殊处理：
 * 1. 表单数据自动序列化为 FormData
 * 2. 使用 fetch 发送，而非传统表单提交
 * 3. 支持 pending 状态（useFormStatus）
 */

/**
 * useFormStatus Hook
 * 获取表单提交状态
 */
import { useFormStatus } from 'next/dist/client/form';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Submitting...' : 'Submit'}
    </button>
  );
}

// 表单组件
function ContactForm() {
  async function submitContact(formData: FormData) {
    'use server';

    const name = formData.get('name');
    const email = formData.get('email');

    await db.contact.create({ data: { name, email } });
    revalidatePath('/contact');
  }

  return (
    <form action={submitContact}>
      <input name="name" />
      <input name="email" />
      <SubmitButton />
    </form>
  );
}
```

### 4.4 乐观更新 (Optimistic Updates)

```typescript
// packages/next/src/client/components/transition.ts
// useOptimistic Hook

/**
 * useOptimistic
 * 乐观更新 Hook
 * 先更新 UI，再同步到服务端
 */

'use client';

import { useOptimistic, useState } from 'react';
import { updateItem } from './actions';

function TodoList({ items }: { items: Todo[] }) {
  const [todos, setTodos] = useState(items);

  // useOptimistic 接收当前状态，返回乐观状态更新函数
  const [optimisticTodos, updateOptimisticTodo] = useOptimistic(
    todos,
    // reducer：如何根据 action 更新乐观状态
    (state, { id, newText }) =>
      state.map((todo) =>
        todo.id === id ? { ...todo, text: newText } : todo
      )
  );

  async function handleUpdate(id: string, newText: string) {
    // 1. 立即更新 UI
    updateOptimisticTodo({ id, newText });

    // 2. 发送请求到服务端
    await updateItem(id, newText);
  }

  return (
    <ul>
      {optimisticTodos.map((todo) => (
        <li key={todo.id}>
          {todo.text}
          <button onClick={() => handleUpdate(todo.id, 'new text')}>
            Edit
          </button>
        </li>
      ))}
    </ul>
  );
}
```

## 五、缓存与重新验证

### 5.1 Next.js 缓存策略

```typescript
// 缓存配置示例

// app/page.tsx
// 静态渲染（默认）
export default async function Page() {
  // 首次请求时渲染，然后缓存
  const data = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 },  // 1小时后重新验证
  });
  return <div>{data}</div>;
}

// 动态渲染
export const dynamic = 'force-dynamic';

async function Page() {
  // 每个请求都重新渲染
  const data = await fetch('https://api.example.com/data');
  return <div>{data}</div>;
}

// 静态生成
export const dynamic = 'force-static';
```

### 5.2 revalidatePath 与 revalidateTag

```typescript
// 重新验证缓存

import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * revalidatePath - 清除特定路径的缓存
 */
async function createPost(formData: FormData) {
  'use server';

  await db.post.create({ data: { title: 'New Post' } });

  // 清除 /blog 路径的缓存
  revalidatePath('/blog');

  // 清除所有 blog 相关缓存
  revalidatePath('/blog/*');
}

/**
 * revalidateTag - 清除带特定标签的缓存
 */
async function updateProduct(id: string) {
  'use server';

  await db.product.update({ where: { id } });

  // 清除标记为 'products' 的缓存
  revalidateTag('products');
}

// fetch 时的标签
async function getProducts() {
  const data = await fetch('https://api.example.com/products', {
    next: { tags: ['products'] },  // 添加标签
  });
  return data;
}
```

## 六、App Router 请求流程图

```
┌─────────────────────────────────────────────────────────────────┐
│                      App Router 请求处理流程                      │
└─────────────────────────────────────────────────────────────────┘

1. 接收请求
   Request (/blog/my-post)
          │
          ▼

2. 路由匹配
   matchRoute('/blog/my-post')
          │
          ▼
   ┌─────────────────────────────────┐
   │  layouts: [
   │    app/layout.tsx,             // 根布局
   │    app/blog/layout.tsx         // 博客布局
   │  ],
   │  page: app/blog/[slug]/page.tsx,
   │  params: { slug: 'my-post' }
   └─────────────────────────────────┘
          │
          ▼

3. 服务端组件渲染
   renderRSC(page, ctx)
          │
          ▼
   ┌─────────────────────────────────┐
   │  // 执行 async Server Components │
   │  // 收集数据，获取 HTML/RSC      │
   │  const stream = renderToReadable │
   └─────────────────────────────────┘
          │
          ▼

4. 流式响应
   Response Stream
          │
          ▼
   ┌─────────────────────────────────┐
   │  <script>...</script>           │
   │  <!--boundary-->               │
   │  <div>Loading...</div>         │
   │  <!--boundary-->               │
   │  <!-- RSC Payload -->          │
   │  [...flights...]               │
   └─────────────────────────────────┘
          │
          ▼

5. 客户端渲染
   hydrateRSC(flights)
          │
          ▼
   ┌─────────────────────────────────┐
   │  // 替换占位符为实际组件          │
   │  // 执行客户端组件               │
   │  // 绑定事件处理器               │
   └─────────────────────────────────┘
```

## 七、面试要点

| 问题 | 答案要点 |
|------|----------|
| App Router 和 Pages Router 的核心区别？ | Server Components 默认开启，布局系统更强大 |
| Server Component 和 Client Component 如何选择？ | 无交互用 Server，有交互用 Client |
| RSC Payload 是什么？ | 服务端发送给客户端的组件树序列化格式 |
| Server Actions 如何工作？ | 'use server' 标记，编译生成代理，POST 到服务端执行 |
| Suspense 边界如何工作？ | 异步内容用 fallback 占位，完成后流式替换 |
| 如何实现乐观更新？ | useOptimistic 先更新 UI，后同步服务端 |
| layout 和 template 的区别？ | layout 持久存在，template 每次渲染新建 |
| 路由组的用途？ | 组织代码，不影响 URL 结构 |
