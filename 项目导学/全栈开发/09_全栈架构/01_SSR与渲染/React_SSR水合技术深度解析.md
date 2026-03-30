# React SSR水合技术深度解析

> 本文档深入剖析React服务端渲染中的水合（Hydration）机制，从基础概念到进阶优化策略，帮助开发者理解并解决SSR应用中的核心挑战。

---

## 一、水合基础概念

### 1.1 什么是Hydration（水合）

**Hydration（水合）**是React在服务端渲染（SSR）应用中的核心技术概念。当服务器使用`renderToString`或`renderToPipeableStream`将React组件树渲染为HTML字符串后，浏览器会接收到这段静态HTML。此时的HTML只是静态内容——没有任何事件绑定、没有React的虚拟DOM、没有状态管理。

**水合的作用**：将这段静态HTML"激活"为完整的React应用，建立起虚拟DOM与真实DOM之间的关联，让JavaScript能够接管这些HTML元素，赋予它们交互能力。这个"激活"过程就是水合。

```typescript
// 服务端：生成HTML字符串
const html = ReactDOMServer.renderToString(<App />);

// 浏览器：接收HTML后，通过水合激活
ReactDOM.hydrateRoot(container, <App />);
```

**关键理解**：水合不是重新渲染，而是将已存在的DOM"attach"到React的虚拟DOM树上。React会假设服务端和客户端生成的DOM结构完全一致，然后只绑定事件处理器。

### 1.2 SSR vs CSR vs SSG 区别对比

| 特性 | CSR（客户端渲染） | SSR（服务端渲染） | SSG（静态站点生成） |
|------|------------------|-----------------|-------------------|
| **首屏渲染** | 等待JS下载执行 | 立即显示HTML | 立即显示HTML |
| **SEO支持** | 需额外配置 | 原生支持 | 原生支持 |
| **首屏时间** | 较慢（白屏等待） | 较快（HTML直出） | 最快（预构建） |
| **服务端负载** | 无 | 高（每次请求渲染） | 极低（仅首次构建） |
| **动态内容** | 原生支持 | 支持（需注意水合） | 需配合ISR/SSG |
| **交互响应** | 即时 | 水合完成前无交互 | 水合完成前无交互 |
| **适用场景** | 后台系统、SPA | 电商、新闻、内容平台 | 文档、博客、营销页 |

**核心差异**：

- **CSR**：浏览器下载JS → 执行JS → 生成DOM → 用户看到内容
- **SSR**：服务端生成HTML → 浏览器直接显示 → 下载JS → 水合 → 可交互
- **SSG**：构建时生成HTML → 浏览器直接显示 → 水合 → 可交互

### 1.3 水合的必要性

水合之所以必要，源于以下几个核心原因：

**1. 交互能力恢复**：服务端只能生成静态HTML，无法绑定事件监听器。水合后，React将事件处理器附加到DOM元素上，应用才真正可交互。

**2. 状态初始化**：客户端需要"接管"应用状态。服务端渲染的初始状态（如从数据库获取的数据）需要在客户端保持一致，React通过`hydrateRoot`的第二个参数或`ServerContext`传递初始状态。

**3. 虚拟DOM与真实DOM同步**：React需要建立虚拟DOM树与已存在DOM之间的关系。如果两者不匹配，React会尝试"调和"（reconcile），这可能导致性能问题或视觉闪烁。

```typescript
// 客户端需要与服务端相同的初始状态
const initialState = window.__INITIAL_STATE__;

hydrateRoot(
  document.getElementById('root'),
  <App initialState={initialState} />
);
```

---

## 二、水合工作原理

### 2.1 renderToString vs renderToPipeableStream

React提供了两组服务端渲染API，它们在水合场景中有不同的特性和适用场景。

#### renderToString（同步渲染）

```typescript
import ReactDOMServer from 'react-dom/server';

// 同步渲染，一次性生成完整HTML
function renderApp() {
  // renderToString是同步阻塞的，返回完整HTML字符串
  // 特点：简单直接，适合小型应用或Serverless函数
  const html = ReactDOMServer.renderToString(<App />);
  return html;
}
```

**特点**：
- 同步阻塞，生成完整HTML后才返回
- 内存占用较低，适合小型应用
- 无法实现流式传输
- 不支持Suspense边界

**适用场景**：简单SSR场景、小型应用、Lambda函数

#### renderToPipeableStream（流式渲染）

```typescript
import ReactDOMServer from 'react-dom/server';

function renderApp(url: string, res: Response) {
  // 流式渲染，支持分块发送HTML（React 18+特性）
  const { pipe, abort } = ReactDOMServer.renderToPipeableStream(
    <App url={url} />,
    {
      // 当整个shell（Suspense fallback之外的内容）准备好时开始流式传输
      // 这是"外壳优先"策略的核心：先发送首屏，后发送懒加载内容
      onShellReady() {
        res.setHeader('content-type', 'text/html');
        pipe(res);
      },
      // shell渲染失败时发送备用HTML（如所有Suspense都显示fallback）
      onShellError(error: Error) {
        console.error('Shell渲染失败:', error);
        // 可以发送静态错误页面
      },
      // 所有内容（包括Suspense边界内的内容）都准备好后触发
      onAllReady() {
        console.log('流式传输完成');
      },
      // 渲染过程中的错误回调
      onError(error: Error) {
        console.error('渲染错误:', error);
      }
    }
  );

  // 超时控制：5秒后自动中止渲染
  setTimeout(() => abort(), 5000);
}
```

**特点**：
- 流式输出，HTML分块传输
- 支持Suspense边界
- 可以实现"shell first"策略（先发送首屏，后发送懒加载内容）
- 更高的Time to First Byte（TTFB）

**适用场景**：大型应用、需要良好首屏性能的应用、React 18+

### 2.2 hydrateRoot vs hydrate（Legacy）

React 18引入了新的水合API，它们之间有显著区别：

#### Legacy hydrate（React 17及之前）

```typescript
import ReactDOM from 'react-dom';

// React 17的legacy API（已废弃）
// 缺点：整个应用必须一起水合，无法部分水合
ReactDOM.hydrate(<App />, document.getElementById('root'));
```

**问题**：
- 整个应用必须一起水合，无法部分水合
- 性能较差，尤其在大型应用中
- 缺乏错误恢复机制

#### hydrateRoot（React 18+）

```typescript
import ReactDOM from 'react-dom/client';

// React 18的新API，推荐使用
const root = ReactDOM.hydrateRoot(
  document.getElementById('root'),
  <App />
);

// 支持后续更新（与createRoot API一致）
root.render(<NewContent />);
```

**优势**：
- 独立的根节点管理
- 支持并发渲染
- 更好的错误边界
- 与`createRoot` API一致

### 2.3 水合流程图解

```
┌─────────────────────────────────────────────────────────────┐
│                      服务端渲染流程                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────┐     ┌─────────────┐     ┌──────────────┐   │
│   │ 组件树  │ ──▶ │ renderToXXX  │ ──▶ │ HTML字符串    │   │
│   │ <App/> │     │             │     │ (含data-hash) │   │
│   └─────────┘     └─────────────┘     └───────┬───────┘   │
│                                                │            │
│                                                ▼            │
│                                         ┌──────────────┐   │
│                                         │  发送HTML    │   │
│                                         │  到浏览器    │   │
│                                         └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      浏览器水合流程                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────────┐     ┌─────────────┐     ┌────────────┐  │
│   │ 下载HTML/CSS │ ──▶ │ 显示首屏内容 │ ──▶ │ 下载JS     │  │
│   │ (立即渲染)   │     │ (可阅读)    │     │ 执行React │  │
│   └──────────────┘     └─────────────┘     └─────┬──────┘  │
│                                                   │         │
│                                                   ▼         │
│   ┌──────────────────────────────────────────────────────┐  │
│   │                     水合阶段                         │  │
│   │  1. 创建虚拟DOM树                                   │  │
│   │  2. 与现有DOM比对（data-hash校验）                  │  │
│   │  3. 绑定事件处理器                                  │  │
│   │  4. 初始化Hooks状态                                │  │
│   │  5. 应用变为可交互                                  │  │
│   └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 三、水合不匹配问题

### 3.1 常见不匹配原因

水合过程中最常见的问题是**服务端与客户端渲染结果不一致**，React会发出警告：

```
Warning: Text content did not match. Server: "foo" Client: "bar"
Warning: Expected server HTML to contain a matching <div> in <main>
```

**主要原因**：

| 原因类别 | 具体场景 | 示例 |
|---------|---------|------|
| 时间相关 | `Date.now()`、`new Date()`、`Math.random()` | 服务端渲染时获取时间，客户端水合时时间已变 |
| 浏览器API | `window`、`document`、`localStorage` | 直接访问`window.innerWidth` |
| 随机数 | `Math.random()`、`crypto.randomUUID()` | 服务端生成的ID与客户端不同 |
| 用户特定 | Cookie、UA、地理位置 | 基于用户IP的服务端渲染结果 |
| 条件渲染 | `typeof window !== 'undefined'` | 服务端和客户端条件不同 |

### 3.2 时间相关代码问题

```typescript
// ❌ 错误：每次渲染产生不同结果
function TimeDisplay() {
  // 服务端渲染时获取时间，客户端水合时时间可能已变化
  // 导致水合警告：Text content did not match
  return <span>当前时间：{new Date().toLocaleString()}</span>;
}

// ✅ 正确：仅在客户端渲染
function TimeDisplay() {
  const [time, setTime] = useState<string | null>(null);

  // useEffect只在客户端执行，完美解决时间不匹配问题
  useEffect(() => {
    setTime(new Date().toLocaleString());
  }, []);

  return <span>当前时间：{time || '加载中...'}</span>;
}
```

### 3.3 浏览器API问题

```typescript
// ❌ 错误：服务端没有window对象，会导致ReferenceError
function WindowSize() {
  // 服务端渲染时window是undefined，直接访问会报错
  return <div>窗口宽度：{window.innerWidth}px</div>;
}

// ✅ 正确：安全地访问浏览器API
function WindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // 定义更新尺寸的处理函数
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    // 初始化时立即执行一次
    handleResize();
    // 监听窗口大小变化事件
    window.addEventListener('resize', handleResize);

    // 清理函数：组件卸载时移除事件监听
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <div>窗口宽度：{size.width}px</div>;
}
```

### 3.4 解决方案

#### 使用useEffect延迟客户端渲染

```typescript
// 通用客户端渲染组件：只在客户端挂载后才显示children
function ClientOnly({ children, fallback = null }) {
  const [mounted, setMounted] = useState(false);

  // useEffect在SSR和客户端首次渲染时都不执行
  // 只在JavaScript执行并组件挂载后执行
  useEffect(() => {
    setMounted(true);
  }, []);

  // 服务端渲染和客户端水合期间都显示fallback
  // 只有真正挂载后才显示children
  return mounted ? children : fallback;
}

// 使用示例
function App() {
  return (
    <div>
      <h1>服务端渲染的内容</h1>
      <ClientOnly fallback={<LoadingSkeleton />}>
        <BrowserOnlyComponent />
      </ClientOnly>
    </div>
  );
}
```

#### 使用动态导入

```typescript
import dynamic from 'next/dynamic';

// Next.js的dynamic导入自动处理水合问题
// ssr: false 完全跳过服务端渲染，避免水合不匹配
const HeavyChart = dynamic(() => import('./Chart'), {
  ssr: false,          // 完全跳过服务端渲染
  loading: () => <Skeleton />  // 加载中显示骨架屏
});

function App() {
  return (
    <div>
      <h1>数据可视化</h1>
      <HeavyChart data={data} />
    </div>
  );
}
```

#### useState的lazy初始化

```typescript
// ❌ 可能导致不匹配：计算函数每次渲染都执行
function ExpensiveValue() {
  const [value, setValue] = useState(computeExpensiveValue());
  // 初始化时computeExpensiveValue()会执行
  return <div>{value}</div>;
}

// ✅ 使用lazy initializer：只在首次渲染时执行
function ExpensiveValue() {
  const [value, setValue] = useState(() => computeExpensiveValue());
  // useState的函数参数只在初始化时执行一次
  return <div>{value}</div>;
}
```

---

## 四、进阶水合技术

### 4.1 选择性水合（Selective Hydration）

React 18之前，整个应用必须作为一个整体进行水合。React 18引入了**选择性水合**，允许 Suspense 边界内的内容独立水合。

```typescript
function App() {
  return (
    <div>
      {/* 非Suspense区域先水合（主线程优先） */}
      <Header />
      <Navigation />

      {/* Suspense区域可以独立水合，互不影响 */}
      {/* 即使HeavyComponent水合失败，AnotherHeavyComponent仍可正常交互 */}
      <Suspense fallback={<PostSkeleton />}>
        <HeavyComponent />
      </Suspense>

      <Suspense fallback={<PostSkeleton />}>
        <AnotherHeavyComponent />
      </Suspense>
    </div>
  );
}
```

**优势**：即使某个懒加载组件还在加载中，其他已完成的部分也可以开始水合，提升首屏可交互时间（TTI）。

### 4.2 渐进式水合（Progressive Hydration）

渐进式水合是将水合过程分散到多个帧中执行，避免长时间的阻塞：

```typescript
import { startTransition, useDeferredValue } from 'react';

// 使用startTransition标记非紧急更新
// 这些更新可以被中断，不会阻塞主线程
function SearchResults({ query }: { query: string }) {
  const [deferredQuery, setDeferredQuery] = useState(query);

  // startTransition内的更新被视为非紧急更新
  // 即使处理慢，用户仍能保持可交互
  startTransition(() => {
    setDeferredQuery(query);
  });

  return <Results query={deferredQuery} />;
}
```

### 4.3 流式SSR（Streaming SSR）

流式SSR允许服务端分块发送HTML，浏览器逐步接收和渲染：

```typescript
// Next.js App Router默认使用流式SSR
// app/page.tsx
import { Suspense } from 'react';

async function Page() {
  return (
    <div>
      {/* 立即渲染：用户立即看到这些内容 */}
      <h1>我的博客</h1>

      {/* 流式渲染：独立流式传输，互不阻塞 */}
      <Suspense fallback={<PostSkeleton />}>
        <RecentPosts />
      </Suspense>

      <Suspense fallback={<PostSkeleton />}>
        <PopularPosts />
      </Suspense>
    </div>
  );
}

// app/components/RecentPosts.tsx
// async组件自动支持Suspense和流式渲染
async function RecentPosts() {
  // 异步获取数据，数据准备好后自动流式发送
  const posts = await fetchPosts();
  return <PostList posts={posts} />;
}
```

### 4.4 React 18 Suspense与水合

React 18的Suspense在水合中有特殊行为——**服务端渲染的fallback不会参与水合**：

```typescript
function App() {
  return (
    <div>
      {/* 服务端fallback：水合时会被立即替换 */}
      <Suspense fallback={<div className="skeleton">加载中...</div>}>
        <AsyncComponent />
      </Suspense>
    </div>
  );
}
```

**水合过程**：
1. 服务端发送带有fallback的HTML
2. 浏览器显示fallback内容（用户立即看到）
3. JS下载完成后，React立即水合整个区域
4. 发起数据请求
5. 数据返回后，用实际内容替换fallback（无闪烁）

---

## 五、性能优化

### 5.1 减少水合体量

**代码分割**：将应用拆分为多个chunk，只水合必要的部分：

```typescript
import dynamic from 'next/dynamic';

// 管理面板只在需要时加载，减小初始水合体积
const AdminPanel = dynamic(() => import('./AdminPanel'), {
  loading: () => <AdminSkeleton />  // 加载中显示骨架屏
});

function App() {
  return (
    <div>
      <MainContent />
      {/* 条件加载：不需要时不加载，不水合 */}
      {isAdmin && <AdminPanel />}
    </div>
  );
}
```

**组件级水合控制**：使用`suppressHydrationWarning`属性抑制特定警告：

```typescript
function DateDisplay({ date }: { date: Date }) {
  return (
    <time
      dateTime={date.toISOString()}
      suppressHydrationWarning
      // 只抑制当前元素的不匹配警告，不影响子元素
    >
      {date.toLocaleDateString()}
    </time>
  );
}
```

### 5.2 预水合（Preloading）

在HTML的`<head>`中预加载关键资源，减少水合等待时间：

```html
<!DOCTYPE html>
<html>
<head>
  <!-- 预加载关键JavaScript：浏览器提前开始下载 -->
  <link rel="preload" href="/main.js" as="script">

  <!-- 预连接关键域名：提前建立TCP连接 -->
  <link rel="preconnect" href="https://api.example.com">

  <!-- DNS预解析：提前解析域名 -->
  <link rel="dns-prefetch" href="https://cdn.example.com">
</head>
<body>
  <!-- 服务端渲染的HTML -->
  <div id="root"><!-- SSR内容 --></div>

  <!-- 服务端直接内联关键CSS，避免FOUC -->
  <style>/* 关键渲染路径CSS */</style>

  <script src="/main.js"></script>
</body>
</html>
```

### 5.3 延迟水合

对于非首屏必要的内容，可以延迟水合：

```typescript
// 当可见时水合：IntersectionObserver检测元素进入视口
function LazyHydrateOnVisible({ children }) {
  const [shouldRender, setShouldRender] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }  // 提前100px开始水合
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {shouldRender ? children : null}
    </div>
  );
}

// 空闲时水合：使用requestIdleCallback
function LazyHydrateOnIdle({ children }) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // 浏览器空闲时执行水合
    const id = requestIdleCallback(() => {
      setShouldRender(true);
    });

    return () => cancelIdleCallback(id);
  }, []);

  return shouldRender ? children : <Placeholder />;
}
```

### 5.4 onRecoverableError处理

React 18的`hydrateRoot`支持`onRecoverableError`回调，用于处理可恢复的错误：

```typescript
const root = ReactDOM.hydrateRoot(
  document.getElementById('root'),
  <App />,
  {
    // 当发生可恢复的水合错误时调用
    // 例如：服务端HTML和客户端HTML略有不同，但可以恢复
    onRecoverableError((error: Error) => {
      // 记录可恢复错误（通常是轻微的DOM不匹配）
      console.error('可恢复的水合错误:', error.message);

      // 上报到监控服务
      reportError({
        type: 'hydration',
        message: error.message,
        // error.digest格式：'Hydration failed:...'
        boundary: error.digest?.split(':')[1]
      });
    })
  }
);
```

---

## 六、Next.js水合实战

### 6.1 getServerSideProps（Pages Router）

```typescript
// pages/dashboard.tsx
import { GetServerSideProps } from 'next';
import { cookies } from 'next/headers';

interface Props {
  user: User;
  dashboardData: DashboardData;
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  // 从cookie获取用户session
  const sessionToken = cookies().get('session_token');

  if (!sessionToken) {
    // 未登录，重定向到登录页
    return {
      redirect: { destination: '/login', permanent: false },
    };
  }

  // 并行获取多个数据源，提升性能
  const [user, dashboardData] = await Promise.all([
    fetchUser(sessionToken.value),
    fetchDashboardData(sessionToken.value),
  ]);

  // 返回的props会传递给组件进行服务端渲染
  return {
    props: { user, dashboardData },
  };
};

export default function Dashboard({ user, dashboardData }: Props) {
  return (
    <div>
      <h1>欢迎，{user.name}</h1>
      <DashboardContent data={dashboardData} />
    </div>
  );
}
```

### 6.2 HydrationProvider（Next.js 13+ App Router）

App Router中，React的状态和上下文可以在服务端和客户端之间正确传递：

```typescript
// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';

// App Router默认进行流式SSR
export const metadata: Metadata = {
  title: '我的应用',
  description: '使用App Router的SSR应用',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        {/* 服务端和客户端共享布局 */}
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
```

### 6.3 useHydrated自定义Hook

创建`useHydrated`Hook来判断组件是否已完成水合：

```typescript
// hooks/useHydrated.ts
import { useState, useEffect } from 'react';

/**
 * 判断组件是否已完成水合
 * 用于在SSR场景下控制客户端特定内容的显示
 *
 * @returns boolean - true表示已水合，false表示还在水合中
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // useEffect只在客户端执行，设置hydrated为true
    setHydrated(true);
  }, []);

  return hydrated;
}

// 使用示例：客户端独占内容
function ClientOnlyContent() {
  const isHydrated = useHydrated();

  if (!isHydrated) {
    // 水合完成前显示骨架屏或null
    return <div className="skeleton">加载中...</div>;
  }

  return <InteractiveComponent />;
}

// 使用示例：客户端状态初始化
function UserSpecificContent() {
  const isHydrated = useHydrated();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // 只有客户端才能访问localStorage
    const stored = localStorage.getItem('user_data');
    if (stored) {
      setUserData(JSON.parse(stored));
    }
  }, []);

  if (!isHydrated) {
    return null; // 服务端和初始水合期间不渲染
  }

  return <Content data={userData} />;
}
```

### 6.4 完整水合优化示例

```typescript
// components/ClientChart.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';

// 动态导入图表组件（完全客户端渲染）
// ssr: false避免服务端渲染和水合不匹配
const Chart = dynamic(() => import('./Chart'), {
  ssr: false,
  loading: () => <ChartSkeleton />
});

interface DataPoint {
  date: string;
  value: number;
}

interface ClientChartProps {
  // 服务端传入的初始数据
  initialData: DataPoint[];
  title: string;
}

export function ClientChart({ initialData, title }: ClientChartProps) {
  // 使用lazy初始化避免水合不匹配
  const [data, setData] = useState<DataPoint[]>(() => initialData);
  const [tooltip, setTooltip] = useState<string | null>(null);

  // 仅在客户端计算派生数据
  const processedData = useMemo(() => {
    // 客户端特有处理逻辑（如屏幕适配、平台检测等）
    return data.map(d => ({
      ...d,
      // 客户端特有的数据转换
      displayValue: d.value * (window.devicePixelRatio || 1)
    }));
  }, [data]);

  return (
    <div className="chart-container">
      <h3>{title}</h3>
      <Chart data={processedData} />
      {tooltip && <Tooltip content={tooltip} />}
    </div>
  );
}
```

---

## 七、面试高频问题

**Q1：为什么 hydration 会有性能问题？**

A：传统SSR需要等待整个JavaScript Bundle下载完成才能开始水合。如果Bundle很大，用户会看到页面但无法交互（TTI时间很长）。此外，水合过程会阻塞主线程，大型应用的水合时间可能长达数秒。解决方案包括：代码分割、渐进式水合、流式渲染等。

**Q2：如何避免 hydration mismatch？**

A：遵循以下原则：
- 使用 `useId` 而非手动生成ID，确保服务端和客户端ID一致
- 将所有浏览器API访问放在 `useEffect` 中，确保只在客户端执行
- 使用 `suppressHydrationWarning` 处理不可避免的不匹配（如时区差异）
- 避免在组件顶层执行会产生不同结果的条件逻辑

**Q3：React 18 的选择性水合解决了什么问题？**

A：在React 17中，如果某个大组件树水合失败，整个应用都会崩溃。React 18的选择性水合允许Suspense boundary独立水合，一个Suspense边界内的组件水合失败不会影响其他部分。同时，流式渲染允许先水合已经下载完成的区块，不必等待整个应用。

**Q4：流式渲染和传统SSR的区别是什么？**

A：传统SSR必须等整个页面渲染完成（包括所有数据获取）才能发送HTML。流式SSR可以边渲染边发送HTML，用户能更早看到内容。Next.js的App Router默认使用流式渲染，通过Suspense边界实现部分内容优先显示。

---

*本文档持续更新，最后更新于 2026 年 3 月*
