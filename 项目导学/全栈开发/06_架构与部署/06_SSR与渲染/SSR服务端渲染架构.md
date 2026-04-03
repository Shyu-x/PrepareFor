# SSR服务端渲染架构

## 目录

1. [SSR核心概念](#1-ssr核心概念)
2. [SSR原理深度解析](#2-ssr原理深度解析)
3. [Next.js SSR实现](#3-nextjs-ssr实现)
4. [流式渲染](#4-流式渲染)
5. [水合优化](#5-水合优化)
6. [性能优化](#6-性能优化)
7. [面试高频问题](#7-面试高频问题)

---

## 1. SSR核心概念

### 1.1 什么是服务端渲染？

服务端渲染（Server-Side Rendering，SSR）是指在服务器端将React组件渲染成HTML字符串，然后发送给客户端。客户端接收到完整的HTML后，可以直接显示内容，然后再加载JavaScript进行水合（Hydration）。

### 1.2 SSR vs CSR 对比

| 特性 | SSR | CSR |
|------|-----|-----|
| 首屏时间 | 快 | 慢 |
| SEO | 友好 | 不友好 |
| 服务器负载 | 高 | 低 |
| 开发复杂度 | 高 | 低 |
| TTFB | 较慢 | 快 |
| 交互时间 | 较慢 | 快 |

### 1.3 SSR的优势

```typescript
// SSR 的主要优势

// 1. 更好的SEO
// 搜索引擎爬虫可以直接获取完整的HTML内容

// 2. 更快的首屏渲染
// 用户可以更快看到页面内容

// 3. 更好的社交媒体分享
// Open Graph和Twitter Card可以正确显示

// 4. 更好的可访问性
// 即使JavaScript禁用也能显示基本内容
```

---

## 2. SSR原理深度解析

### 2.1 SSR工作流程

```
┌─────────────────────────────────────────────────────────────┐
│                        SSR 工作流程                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  客户端请求                                                  │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────┐                                            │
│  │   服务器    │                                            │
│  │             │                                            │
│  │ 1. 路由匹配 │                                            │
│  │ 2. 数据获取 │                                            │
│  │ 3. 组件渲染 │                                            │
│  │ 4. HTML生成 │                                            │
│  │             │                                            │
│  └─────────────┘                                            │
│       │                                                     │
│       ▼                                                     │
│  返回完整HTML                                                │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────┐                                            │
│  │   客户端    │                                            │
│  │             │                                            │
│  │ 1. 解析HTML │                                            │
│  │ 2. 显示内容 │                                            │
│  │ 3. 加载JS   │                                            │
│  │ 4. 水合     │                                            │
│  │             │                                            │
│  └─────────────┘                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 React SSR API

```typescript
// React 服务端渲染 API

import { renderToString, renderToStaticMarkup, renderToPipeableStream } from 'react-dom/server';
import { App } from './App';

// 1. renderToString - 基础渲染
// 将React组件渲染为HTML字符串
app.get('*', (req, res) => {
  const html = renderToString(<App />);

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>SSR App</title>
      </head>
      <body>
        <div id="root">${html}</div>
        <script src="/client.js"></script>
      </body>
    </html>
  `);
});

// 2. renderToStaticMarkup - 静态渲染
// 不包含data-reactid属性，适用于静态页面
const staticHtml = renderToStaticMarkup(<StaticPage />);

// 3. renderToPipeableStream - 流式渲染（React 18+）
// 支持流式传输和Suspense
app.get('*', (req, res) => {
  const { pipe } = renderToPipeableStream(<App />, {
    // 所有内容加载完成时调用
    onAllReady() {
      res.setHeader('Content-Type', 'text/html');
      pipe(res);
    },
    // 发生错误时调用
    onError(error) {
      console.error('SSR错误:', error);
      res.status(500).send('服务器错误');
    },
  });
});
```

### 2.3 数据获取策略

```typescript
// SSR 数据获取策略

// 1. 服务端数据获取
// 在服务端获取数据并注入到HTML中

interface RouteConfig {
  path: string;
  component: React.ComponentType;
  loadData?: (context: any) => Promise<any>;
}

const routes: RouteConfig[] = [
  {
    path: '/users',
    component: UsersPage,
    loadData: async () => {
      const response = await fetch('/api/users');
      return response.json();
    },
  },
  {
    path: '/posts/:id',
    component: PostPage,
    loadData: async (context) => {
      const response = await fetch(`/api/posts/${context.params.id}`);
      return response.json();
    },
  },
];

// 服务端路由匹配和数据获取
async function handleRequest(req: Request, res: Response) {
  // 1. 匹配路由
  const match = matchPath(req.path, routes);

  if (!match) {
    return res.status(404).send('Not Found');
  }

  // 2. 获取数据
  let initialData = null;
  if (match.route.loadData) {
    initialData = await match.route.loadData({
      params: match.params,
      query: req.query,
    });
  }

  // 3. 渲染组件
  const html = renderToString(
    <StaticRouter location={req.url}>
      <App initialData={initialData} />
    </StaticRouter>
  );

  // 4. 返回HTML
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>SSR App</title>
      </head>
      <body>
        <div id="root">${html}</div>
        <script>
          window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};
        </script>
        <script src="/client.js"></script>
      </body>
    </html>
  `);
}

// 2. 客户端数据水合
function App({ initialData }: { initialData?: any }) {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    // 如果没有初始数据，客户端获取
    if (!initialData) {
      fetchData().then(setData);
    }
  }, []);

  return <div>{/* 渲染内容 */}</div>;
}

// 客户端入口文件
hydrateRoot(
  document.getElementById('root')!,
  <BrowserRouter>
    <App initialData={window.__INITIAL_DATA__} />
  </BrowserRouter>
);
```

---

## 3. Next.js SSR实现

### 3.1 Next.js App Router SSR

```typescript
// app/page.tsx - 服务端组件（默认）

// 这是一个服务端组件，在服务器上渲染
// 可以直接访问数据库、文件系统等

async function HomePage() {
  // 直接获取数据（服务端执行）
  const posts = await fetchPosts();

  return (
    <div>
      <h1>博客文章</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={`/posts/${post.id}`}>
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// app/posts/[id]/page.tsx - 动态路由SSR

interface PageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

async function PostPage({ params, searchParams }: PageProps) {
  // 获取文章数据
  const post = await fetchPost(params.id);

  if (!post) {
    notFound(); // 触发404页面
  }

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}

// 生成动态元数据
export async function generateMetadata({ params }: PageProps) {
  const post = await fetchPost(params.id);

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  };
}
```

### 3.2 强制动态渲染

```typescript
// app/dashboard/page.tsx

// 方式1：使用 dynamic = 'force-dynamic'
export const dynamic = 'force-dynamic';

// 方式2：使用 no-store
async function DashboardPage() {
  const data = await fetch('/api/dashboard', {
    cache: 'no-store', // 不缓存，每次请求都重新获取
  });

  return <Dashboard data={data} />;
}

// 方式3：使用 revalidate = 0
export const revalidate = 0;

// 方式4：使用 cookies() 或 headers()
import { cookies, headers } from 'next/headers';

async function DashboardPage() {
  const cookieStore = cookies();
  const headersList = headers();

  // 使用了动态函数，自动变为动态渲染
  const userId = cookieStore.get('userId');

  return <Dashboard userId={userId} />;
}
```

### 3.3 混合渲染

```typescript
// app/layout.tsx - 静态布局
// 布局默认是静态的

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <Header /> {/* 静态 */}
        <main>{children}</main> {/* 动态 */}
        <Footer /> {/* 静态 */}
      </body>
    </html>
  );
}

// app/page.tsx - 动态页面
async function HomePage() {
  const data = await fetchDynamicData();
  return <Home data={data} />;
}

// 使用 Suspense 实现流式渲染
import { Suspense } from 'react';

function HomePage() {
  return (
    <div>
      <h1>首页</h1>
      
      {/* 快速显示的部分 */}
      <StaticSection />
      
      {/* 慢速加载的部分 */}
      <Suspense fallback={<Skeleton />}>
        <SlowComponent />
      </Suspense>
    </div>
  );
}

// 慢组件
async function SlowComponent() {
  const data = await fetchSlowData(); // 耗时操作
  return <div>{data}</div>;
}
```

---

## 4. 流式渲染

### 4.1 流式渲染原理

```typescript
// 流式渲染（Streaming SSR）原理

// 传统SSR：等待所有数据加载完成后再返回HTML
// 流式SSR：逐步返回HTML，用户可以更快看到内容

/*
传统SSR时间线：
├─────────────────────────────────────────┤
│ 等待数据 │ 渲染HTML │ 返回完整HTML │ 水合 │
└─────────────────────────────────────────┘

流式SSR时间线：
├──────────┤
│ 返回头部 │
├──────────┤
│ 返回主体 │
├──────────┤
│ 返回底部 │
├──────────┤
│ 水合     │
└──────────┘
*/
```

### 4.2 React 18 流式渲染

```typescript
// 使用 renderToPipeableStream 实现流式渲染

import { renderToPipeableStream } from 'react-dom/server';
import { Suspense } from 'react';

// 服务端代码
app.get('*', (req, res) => {
  let didError = false;

  const stream = renderToPipeableStream(
    <App />,
    {
      // Bootstrap脚本插入位置
      bootstrapModules: ['/client.js'],
      
      // 流式传输开始时调用
      onShellReady() {
        // 内容已经准备好，可以开始流式传输
        res.statusCode = didError ? 500 : 200;
        res.setHeader('Content-Type', 'text/html');
        stream.pipe(res);
      },
      
      // 所有内容加载完成时调用
      onAllReady() {
        // 适用于爬虫或静态生成
      },
      
      // Shell渲染错误时调用
      onShellError(error) {
        console.error('Shell错误:', error);
        res.status(500).send('<!DOCTYPE html><html><body>加载失败</body></html>');
      },
      
      // 其他错误
      onError(error) {
        didError = true;
        console.error('渲染错误:', error);
      },
    }
  );
});

// 组件中使用 Suspense
function App() {
  return (
    <html>
      <head>
        <title>流式渲染示例</title>
      </head>
      <body>
        {/* 快速显示的内容 */}
        <Header />
        
        {/* 慢速加载的内容 */}
        <Suspense fallback={<ArticleSkeleton />}>
          <Article />
        </Suspense>
        
        {/* 快速显示的内容 */}
        <Footer />
      </body>
    </html>
  );
}

// 慢速组件
async function Article() {
  // 模拟慢速数据获取
  const article = await fetchArticle();
  
  return (
    <article>
      <h1>{article.title}</h1>
      <p>{article.content}</p>
    </article>
  );
}

// 骨架屏
function ArticleSkeleton() {
  return (
    <div className="skeleton">
      <div className="skeleton-title" />
      <div className="skeleton-text" />
      <div className="skeleton-text" />
    </div>
  );
}
```

### 4.3 Next.js 流式渲染

```typescript
// app/page.tsx - Next.js App Router 流式渲染

import { Suspense } from 'react';

export default function Page() {
  return (
    <div>
      {/* 立即显示 */}
      <h1>文章列表</h1>
      
      {/* 流式加载 */}
      <Suspense fallback={<PostsSkeleton />}>
        <Posts />
      </Suspense>
      
      {/* 流式加载 */}
      <Suspense fallback={<CommentsSkeleton />}>
        <Comments />
      </Suspense>
    </div>
  );
}

// 慢速组件 - 自动流式传输
async function Posts() {
  const posts = await fetch('/api/posts');
  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}

// 加载组件
function PostsSkeleton() {
  return (
    <ul>
      {[1, 2, 3].map(i => (
        <li key={i} className="skeleton">加载中...</li>
      ))}
    </ul>
  );
}

// app/loading.tsx - 自动Suspense边界
// Next.js 自动在页面外层包裹 Suspense
export default function Loading() {
  return <div>加载中...</div>;
}
```

---

## 5. 水合优化

### 5.1 水合原理

```typescript
// 水合（Hydration）原理

// 1. 服务端渲染HTML
// <div id="root"><button>点击我</button></div>

// 2. 客户端加载JavaScript后进行水合
// 将事件处理器附加到已有的DOM节点上

// 3. 水合过程
// - React遍历服务端渲染的DOM
// - 构建虚拟DOM树
// - 将事件处理器附加到DOM节点
// - 不重新渲染DOM（除非不匹配）

// React 18 水合API
import { hydrateRoot } from 'react-dom/client';

hydrateRoot(
  document.getElementById('root')!,
  <App />
);

// React 17 水合API（已废弃）
import { hydrate } from 'react-dom';

hydrate(
  <App />,
  document.getElementById('root')
);
```

### 5.2 水合不匹配问题

```typescript
// 水合不匹配（Hydration Mismatch）常见原因

// ❌ 错误1：服务端和客户端渲染内容不一致
function BadComponent() {
  // 服务端：new Date() 返回服务器时间
  // 客户端：new Date() 返回客户端时间
  return <div>{new Date().toLocaleString()}</div>;
}

// ✅ 正确：使用 useEffect 只在客户端渲染
function GoodComponent() {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    setTime(new Date().toLocaleString());
  }, []);

  return <div>{time || '加载中...'}</div>;
}

// ❌ 错误2：使用浏览器API
function BadComponent() {
  // 服务端：window 不存在
  return <div>窗口宽度: {window.innerWidth}</div>;
}

// ✅ 正确：检查环境
function GoodComponent() {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    setWidth(window.innerWidth);
  }, []);

  return <div>窗口宽度: {width || '未知'}</div>;
}

// ❌ 错误3：随机数
function BadComponent() {
  return <div>随机数: {Math.random()}</div>;
}

// ✅ 正确：使用固定种子或客户端生成
function GoodComponent() {
  const [random, setRandom] = useState(0);

  useEffect(() => {
    setRandom(Math.random());
  }, []);

  return <div>随机数: {random}</div>;
}

// ❌ 错误4：条件渲染依赖浏览器特性
function BadComponent() {
  const isMobile = window.innerWidth < 768; // 服务端报错
  return <div>{isMobile ? '移动端' : '桌面端'}</div>;
}

// ✅ 正确：使用 User-Agent 或客户端检测
function GoodComponent() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  return <div>{isMobile ? '移动端' : '桌面端'}</div>;
}
```

### 5.3 渐进式水合

```typescript
// 渐进式水合（Progressive Hydration）

import { useState, useEffect, useRef, Suspense } from 'react';

// 自定义Hook：延迟水合
function useLazyHydration(delay = 0) {
  const [shouldHydrate, setShouldHydrate] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 使用 IntersectionObserver 检测元素是否可见
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setTimeout(() => setShouldHydrate(true), delay);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  return { ref, shouldHydrate };
}

// 延迟水合组件
function LazyHydrate({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { ref, shouldHydrate } = useLazyHydration();

  return (
    <div ref={ref}>
      {shouldHydrate ? children : fallback}
    </div>
  );
}

// 使用
function Page() {
  return (
    <div>
      {/* 立即水合 */}
      <Header />
      
      {/* 延迟水合 */}
      <LazyHydrate fallback={<CommentsSkeleton />}>
        <Comments />
      </LazyHydrate>
    </div>
  );
}
```

### 5.4 选择性水合

```typescript
// React 18 选择性水合（Selective Hydration）

import { Suspense, useState } from 'react';

// React 18 自动实现选择性水合
// 当用户与某个Suspense边界交互时，该边界会优先水合

function App() {
  return (
    <div>
      {/* 这个Suspense边界会独立水合 */}
      <Suspense fallback={<Skeleton />}>
        <SlowComponent />
      </Suspense>

      {/* 这个Suspense边界会独立水合 */}
      <Suspense fallback={<Skeleton />}>
        <AnotherSlowComponent />
      </Suspense>
    </div>
  );
}

// 用户点击某个组件时，React会优先水合该组件
function InteractiveComponent() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(c => c + 1)}>
      点击次数: {count}
    </button>
  );
}
```

---

## 6. 性能优化

### 6.1 缓存策略

```typescript
// SSR 缓存策略

// 1. 页面级缓存
const pageCache = new Map<string, { html: string; timestamp: number }>();

async function renderPageWithCache(url: string) {
  const cacheKey = url;
  const cached = pageCache.get(cacheKey);

  // 缓存有效期5分钟
  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
    return cached.html;
  }

  // 渲染页面
  const html = await renderPage(url);

  // 存入缓存
  pageCache.set(cacheKey, { html, timestamp: Date.now() });

  return html;
}

// 2. 组件级缓存
const componentCache = new Map<string, any>();

async function renderCachedComponent(
  key: string,
  renderFn: () => Promise<string>
) {
  if (componentCache.has(key)) {
    return componentCache.get(key);
  }

  const html = await renderFn();
  componentCache.set(key, html);
  return html;
}

// 3. 数据缓存
const dataCache = new Map<string, { data: any; timestamp: number }>();

async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 60 * 1000
): Promise<T> {
  const cached = dataCache.get(key);

  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }

  const data = await fetcher();
  dataCache.set(key, { data, timestamp: Date.now() });

  return data;
}

// 4. Redis 缓存（生产环境）
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function getCachedPage(url: string): Promise<string | null> {
  return redis.get(`page:${url}`);
}

async function setCachedPage(url: string, html: string, ttl: number = 300): Promise<void> {
  await redis.setex(`page:${url}`, ttl, html);
}

// 使用
async function handleRequest(req: Request, res: Response) {
  const cachedHtml = await getCachedPage(req.url);

  if (cachedHtml) {
    return res.send(cachedHtml);
  }

  const html = await renderPage(req.url);
  await setCachedPage(req.url, html);

  res.send(html);
}
```

### 6.2 代码分割优化

```typescript
// SSR 代码分割优化

import { lazy, Suspense } from 'react';

// 1. 路由级代码分割
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}

// 2. 组件级代码分割
const HeavyChart = lazy(() => import('./components/HeavyChart'));

function Dashboard() {
  return (
    <div>
      <h1>仪表盘</h1>
      <Suspense fallback={<ChartSkeleton />}>
        <HeavyChart />
      </Suspense>
    </div>
  );
}

// 3. 预加载关键组件
function Link({ to, children, ...props }) {
  const preload = useCallback(() => {
    // 鼠标悬停时预加载
    import(`./pages/${to}`);
  }, [to]);

  return (
    <a href={to} onMouseEnter={preload} {...props}>
      {children}
    </a>
  );
}
```

### 6.3 内存优化

```typescript
// SSR 内存优化

// 1. 避免内存泄漏
// 确保在请求完成后清理资源

async function renderPage(url: string) {
  // 创建请求上下文
  const context = {
    requests: [],
    timers: [],
  };

  try {
    const html = await renderToString(
      <RequestContext.Provider value={context}>
        <App url={url} />
      </RequestContext.Provider>
    );

    return html;
  } finally {
    // 清理资源
    context.requests.forEach(req => req.abort());
    context.timers.forEach(timer => clearTimeout(timer));
  }
}

// 2. 限制并发请求
import { default as pLimit } from 'p-limit';

const limit = pLimit(10); // 最多10个并发

async function fetchAllData(urls: string[]) {
  return Promise.all(
    urls.map(url => limit(() => fetch(url)))
  );
}

// 3. 流式响应减少内存占用
app.get('*', (req, res) => {
  const { pipe } = renderToPipeableStream(<App />);

  // 流式传输，不需要在内存中保存完整HTML
  pipe(res);
});
```

---

## 7. 面试高频问题

### 问题1：SSR和CSR的区别？

**答案：**
| 方面 | SSR | CSR |
|------|-----|-----|
| 渲染位置 | 服务器 | 浏览器 |
| 首屏时间 | 快 | 慢 |
| SEO | 友好 | 不友好 |
| 服务器负载 | 高 | 低 |
| 开发复杂度 | 高 | 低 |
| TTFB | 慢 | 快 |

### 问题2：什么是水合？

**答案：** 水合是客户端JavaScript接管服务端渲染的HTML的过程。React会：
1. 遍历已有的DOM结构
2. 构建虚拟DOM树
3. 将事件处理器附加到DOM节点
4. 不重新渲染DOM（除非不匹配）

### 问题3：如何解决水合不匹配问题？

**答案：**
1. 确保服务端和客户端渲染一致
2. 使用 useEffect 处理客户端特定逻辑
3. 避免在渲染期间使用浏览器API
4. 使用 suppressHydrationWarning 抑制警告

### 问题4：什么是流式渲染？

**答案：** 流式渲染允许服务器逐步发送HTML，而不是等待所有内容加载完成。优点：
1. 用户更快看到内容
2. 减少TTFB
3. 更好的用户体验
4. 支持Suspense

### 问题5：SSR适合什么场景？

**答案：**
- 需要SEO的页面（博客、电商）
- 首屏性能要求高的应用
- 社交媒体分享优化
- 内容为主的网站

不适合：
- 需要登录的仪表盘
- 实时协作应用
- 高度交互的应用

---

## 8. 最佳实践总结

### 8.1 SSR清单

- [ ] 合理使用SSR，不是所有页面都需要
- [ ] 实现数据预取策略
- [ ] 处理水合不匹配问题
- [ ] 使用流式渲染提升体验
- [ ] 实现缓存策略
- [ ] 监控服务器性能
- [ ] 处理错误边界

### 8.2 性能优化清单

- [ ] 使用代码分割
- [ ] 实现组件级缓存
- [ ] 使用流式渲染
- [ ] 优化数据获取
- [ ] 减少水合负担
- [ ] 使用CDN缓存

---

*本文档最后更新于 2026年3月*