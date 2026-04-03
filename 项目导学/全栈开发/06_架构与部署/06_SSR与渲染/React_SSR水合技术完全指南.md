# React SSR 水合技术完全指南

> 本文深入解析 React/Next.js 中的服务端渲染（SSR）与水合（Hydration）技术，涵盖核心原理、常见问题、进阶方案及面试高频考点。

---

## 一、水合核心原理

### 1.1 什么是水合（Hydration）

**水合（Hydration）** 是客户端 JavaScript 接管服务端渲染 HTML 的过程。在服务端渲染（SSR）中，服务器生成静态 HTML 发送给浏览器，浏览器快速显示首屏内容。随后客户端 JavaScript 加载完成，React 需要"水合"这个 HTML，将事件监听器和交互能力绑定到现有的 DOM 上，使页面变得可交互。

```javascript
// 服务端：生成 HTML 字符串
const html = ReactDOMServer.renderToString(<App />);

// 客户端：接管并绑定事件
ReactDOM.hydrateRoot(container, <App />);
```

**为什么需要水合？**

| 需求 | SSR 提供 | CSR 提供 |
|------|----------|----------|
| 首屏速度 | ✅ 立即显示 HTML | ❌ 等待 JS 下载执行 |
| SEO 优化 | ✅ 搜索引擎可抓取 | ❌ 需要额外处理 |
| 交互能力 | ❌ 需要水合 | ✅ 原生支持 |
| 服务器负载 | ❌ 每次请求渲染 | ✅ 仅客户端执行 |

### 1.2 SSR vs CSR vs SSG 深度对比

**三种渲染模式对比：**

```javascript
// ============ SSR: 服务端渲染 ============
// 每次请求时在服务器渲染
// 优点：首屏快、SEO友好
// 缺点：服务器负载高、TTI慢

// ============ CSR: 客户端渲染 ============
// 浏览器执行JavaScript渲染
// 优点：交互快、服务器负载低
// 缺点：首屏慢、白屏时间长

// ============ SSG: 静态生成 ============
// 构建时生成HTML，后续直接使用
// 优点：最快速度、极低服务器负载
// 缺点：不适合个性化内容
```

**详细对比表格：**

| 指标 | SSR | CSR | SSG | ISR |
|------|-----|-----|-----|-----|
| **首屏速度** | 快 | 慢 | 最快 | 快 |
| **SEO** | 完美 | 需处理 | 完美 | 完美 |
| **交互性** | 水合后 | 即时 | 水合后 | 水合后 |
| **服务器负载** | 高 | 低 | 极低 | 低 |
| **实时数据** | 支持 | 支持 | 不支持 | 支持 |
| **构建时间** | 短 | 短 | 长 | 中 |
| **缓存策略** | 短缓存 | 长缓存 | 长期缓存 | 定时失效 |

**适用场景分析：**

```javascript
// SSG - 适合静态内容
const StaticPage = () => <Article content={markdown} />;
// 场景：文档、博客、营销页

// SSR - 适合动态个性化内容
const ProfilePage = ({ userId }) => {
  const { data } = useSWR(`/api/users/${userId}`);
  return <Profile user={data} />;
};
// 场景：用户中心、电商详情

// CSR - 适合高度交互的纯前端应用
const Dashboard = () => {
  const [data, setData] = useState([]);
  // 图表、表单等纯交互组件
};
// 场景：管理后台、图表可视化

// ISR - 适合内容频繁变化的静态页面
const NewsPage = () => <NewsList articles={articles} />;
// 场景：新闻列表、电商列表
```

### 1.3 水合执行时机

水合发生在以下三个阶段之后：

```
┌─────────────────────────────────────────────────────────────────┐
│                        水合执行时机                              │
├─────────────────────────────────────────────────────────────────┤
│  1. HTML解析完成    →  浏览器解析服务端返回的HTML               │
│           ↓                                                       │
│  2. JavaScript加载完成  →  浏览器下载并解析bundle.js            │
│           ↓                                                       │
│  3. React初始化      →  React创建Fiber树，开始水合             │
│           ↓                                                       │
│  4. 水合完成         →  页面可交互，用户可点击、输入           │
└─────────────────────────────────────────────────────────────────┘
```

```javascript
// React 18 hydrateRoot 的完整流程
const container = document.getElementById('root');

// 1. HTML已解析，DOM已存在
// 2. React检测已有DOM
// 3. 尝试复用现有DOM节点
// 4. 绑定事件处理器
hydrateRoot(container, <App />);

// 如果水合中出现问题，React会尝试恢复
hydrateRoot(container, <App />, {
  onRecoverableError: (error) => {
    console.error('水合恢复:', error);
  }
});
```

---

## 二、水合工作原理

### 2.1 renderToString vs renderToPipeableStream

**renderToString - 同步字符串渲染：**

```javascript
// 服务端渲染（Node.js）
import ReactDOMServer from 'react-dom/server';

// 同步渲染，等待完整HTML生成
const html = ReactDOMServer.renderToString(
  <html>
    <body>
      <div id="root">
        <App />
      </div>
    </body>
  </html>
);

// Express响应
app.get('/', (req, res) => {
  const html = ReactDOMServer.renderToString(<App />);
  res.send(`<!DOCTYPE html>${html}`);
});
```

**renderToPipeableStream - 流式渲染（推荐）：**

```javascript
import { renderToPipeableStream } from 'react-dom/server';
import { pipe } from 'stream';

// 流式渲染，边渲染边发送
app.get('/', (req, res) => {
  const { pipe } = renderToPipeableStream(<App />, {
    // 服务端组件完成时调用
    onShellReady() {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
      pipe(res);
    },
    // 发生错误时调用
    onError(error) {
      console.error('渲染错误:', error);
      res.statusCode = 500;
      res.end('服务器错误');
    }
  });
});
```

**两种方案对比：**

| 特性 | renderToString | renderToPipeableStream |
|------|----------------|------------------------|
| 渲染方式 | 同步，等待完成 | 流式，边渲染边发送 |
| 首字节时间 | 慢 | 快 |
| 内存占用 | 高（完整HTML） | 低（分块发送） |
| 支持 Suspense | 否 | 是 |
| 支持流式插入 | 否 | 是 |
| 适用场景 | 简单SSR | 复杂应用 |

### 2.2 hydrateRoot vs hydrate

**React 18 推荐使用 hydrateRoot：**

```javascript
// ✅ React 18 推荐方式
import { hydrateRoot } from 'react-dom/client';

const container = document.getElementById('root');
hydrateRoot(container, <App />);
```

**React 17 及以下使用 hydrate：**

```javascript
// ⚠️ React 17 及以下的方式（已废弃）
import ReactDOM from 'react-dom';

const container = document.getElementById('root');
ReactDOM.hydrate(<App />, container);
```

**核心区别：**

```javascript
// hydrateRoot 的改进：
// 1. 并行处理多个root
// 2. 自动复用已有DOM节点
// 3. 支持 onRecoverableError
// 4. 支持 hydrateRoot.createRoot 风格API

// 使用hydrateRoot创建多个独立的root
const root1 = hydrateRoot(container1, <App1 />);
const root2 = hydrateRoot(container2, <App2 />);

// hydrateRoot 支持的配置选项
hydrateRoot(container, <App />, {
  // 水合恢复时的回调
  onRecoverableError: (error) => {
    console.log('自动恢复:', error.message);
  },
  // 初始状态
  initialState: initialStoreState,
  // 服务端渲染的HTML
  identifierPrefix: 'app-'
});
```

### 2.3 水合完整流程图解

```
┌────────────────────────────────────────────────────────────────────────┐
│                           SSR + 水合 完整流程                           │
└────────────────────────────────────────────────────────────────────────┘

【服务端】
     │
     ▼
┌─────────────────────────────────┐
│     <App /> 组件树              │
│     (包含useState, useEffect,   │
│      API调用, 数据库查询等)      │
└─────────────────────────────────┘
     │
     ▼ renderToPipeableStream
┌─────────────────────────────────┐
│     HTML 字符串/流              │
│     <div id="root">            │
│       <div data-reactroot>      │
│         <p>当前时间: 2026-03-18</p>  │
│       </div>                    │
│     </div>                      │
└─────────────────────────────────┘
     │
     ▼ HTTP响应
─────────────────────────────────────────► 浏览器

【客户端】
     │
     ▼ 接收HTML，立即显示（首屏）
┌─────────────────────────────────┐
│     用户看到内容                 │
│     (但无法点击、输入)          │
└─────────────────────────────────┘
     │
     ▼ 下载JavaScript Bundle
┌─────────────────────────────────┐
│     React 检测到已有DOM         │
│     (data-reactroot 标记)       │
└─────────────────────────────────┘
     │
     ▼ hydrateRoot()
┌─────────────────────────────────┐
│     创建虚拟DOM树（Fiber）      │
│     与现有DOM对比               │
│     (复用已有节点)              │
└─────────────────────────────────┘
     │
     ▼ 绑定事件监听器
┌─────────────────────────────────┐
│     组件可交互                  │
│     (水合完成，TTI)             │
└─────────────────────────────────┘
```

---

## 三、水合不匹配问题（面试重点！）

### 3.1 常见不匹配原因

水合不匹配（Hydration Mismatch）发生在服务端渲染的 HTML 与客户端渲染的结果不一致时。

**不匹配原因分类：**

| 类别 | 示例 | 严重程度 |
|------|------|----------|
| 时间相关 | `new Date()`, `Date.now()` | 高 |
| 随机数 | `Math.random()`, `crypto.getRandomValues()` | 高 |
| 浏览器API | `window`, `document`, `localStorage` | 高 |
| 随机ID | `nanoid()`, `uuid()` | 高 |
| 用户状态 | Cookie, 认证信息 | 中 |
| 条件渲染 | `if (isClient)` | 高 |
| 第三方库 | moment.js, date-fns 时区 | 中 |

### 3.2 情景面试题1：时间戳不匹配

**问题代码：**

```jsx
// ❌ 错误：服务端和客户端渲染结果不同
function Component() {
  return (
    <div>
      <p>当前时间: {new Date().toLocaleString()}</p>
      <p>Unix时间戳: {Date.now()}</p>
    </div>
  );
}
```

**原因分析：**

```
服务端渲染时间: 2026-03-18 10:00:00
客户端渲染时间: 2026-03-18 10:00:01
           ↓
       HTML 不匹配！
       React 报错：Hydration failed
```

**解决方案1：使用 useEffect 延迟设置：**

```jsx
// ✅ 方案1：延迟到客户端设置
function Component() {
  // 初始值，确保服务端渲染时也有内容
  const [time, setTime] = useState('加载中...');

  // useEffect只在客户端执行
  useEffect(() => {
    setTime(new Date().toLocaleString());
  }, []);

  return <p>当前时间: {time}</p>;
}
```

**解决方案2：使用 suppressHydrationWarning：**

```jsx
// ✅ 方案2：抑制警告（仅用于不重要的时间显示）
function Component() {
  return (
    <p suppressHydrationWarning>
      当前时间: {new Date().toLocaleString()}
    </p>
  );
}
```

**解决方案3：Next.js 的 useServerTime 模式：**

```typescript
// ✅ 方案3：服务端时间通过props传入
async function ServerComponent() {
  const serverTime = await getServerTime(); // 服务端获取
  return <ClientComponent serverTime={serverTime} />;
}

function ClientComponent({ serverTime }) {
  const [time, setTime] = useState(serverTime);

  useEffect(() => {
    // 仅用于更新，不影响初始显示
    const interval = setInterval(() => {
      setTime(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return <p>当前时间: {time}</p>;
}
```

### 3.3 情景面试题2：随机ID问题

**问题代码：**

```jsx
// ❌ 错误：每次渲染生成不同的ID
function FormComponent() {
  const id = Math.random().toString(36).substring(7);

  return (
    <div>
      <label htmlFor={id}>用户名</label>
      <input id={id} type="text" />
    </div>
  );
}
```

**React 18+ 解决方案：使用 useId：**

```jsx
// ✅ React 18+ 推荐：useId 生成稳定ID
import { useId } from 'react';

function FormComponent() {
  // 服务端和客户端生成相同的ID
  const id = useId();

  return (
    <div>
      <label htmlFor={id}>用户名</label>
      <input id={id} type="text" />
    </div>
  );
}
```

**多个ID的场景：**

```jsx
// ✅ 为多个表单字段生成独立ID
function MultiFieldForm() {
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();

  return (
    <form>
      <div>
        <label htmlFor={nameId}>姓名</label>
        <input id={nameId} type="text" />
      </div>
      <div>
        <label htmlFor={emailId}>邮箱</label>
        <input id={emailId} type="email" />
      </div>
      <div>
        <label htmlFor={passwordId}>密码</label>
        <input id={passwordId} type="password" />
      </div>
    </form>
  );
}
```

**自定义ID生成器（兼容React 17）：**

```jsx
// ✅ React 17兼容的ID生成方案
let idCounter = 0;
function generateId(prefix = 'field') {
  return `${prefix}-${++idCounter}`;
}

// 使用
function FormComponent() {
  const nameId = useMemo(() => generateId('name'), []);
  const emailId = useMemo(() => generateId('email'), []);

  return (
    <div>
      <label htmlFor={nameId}>姓名</label>
      <input id={nameId} type="text" />
      <label htmlFor={emailId}>邮箱</label>
      <input id={emailId} type="email" />
    </div>
  );
}
```

### 3.4 情景面试题3：窗口宽度问题

**问题代码：**

```jsx
// ❌ 错误：服务端无法访问window
function ResponsiveComponent() {
  const width = window.innerWidth; // ReferenceError!

  return (
    <div>
      <p>窗口宽度: {width}px</p>
      {width < 768 ? <MobileNav /> : <DesktopNav />}
    </div>
  );
}
```

**正确解决方案：**

```jsx
// ✅ 方案1：useState + useEffect
function ResponsiveComponent() {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    // 仅在客户端执行
    const handleResize = () => setWidth(window.innerWidth);
    handleResize(); // 初始化

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <p>窗口宽度: {width}px</p>;
}
```

**进阶方案：自定义 Hook：**

```jsx
// ✅ 封装为可复用的Hooks
function useWindowSize() {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  useEffect(() => {
    function handleResize() {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

// 使用
function ResponsiveComponent() {
  const { width } = useWindowSize();

  return (
    <div>
      <p>窗口宽度: {width}px</p>
      {width > 0 && (width < 768 ? <MobileNav /> : <DesktopNav />)}
    </div>
  );
}
```

### 3.5 情景面试题4：第三方库 hydration mismatch

**moment.js 时区问题：**

```jsx
// ❌ 问题：moment默认使用本地时区
import moment from 'moment';
import 'moment/locale/zh-cn';

function DateComponent({ date }) {
  moment.locale('zh-cn'); // 这会导致水合不匹配

  return (
    <span>
      {moment(date).format('LLLL')}
    </span>
  );
}
```

**解决方案1：使用 dynamic import：**

```jsx
// ✅ 方案1：禁用服务端渲染
import dynamic from 'next/dynamic';

const MomentComponent = dynamic(
  () => import('./MomentComponent'),
  { ssr: false }  // 关键：禁用SSR
);

function DateDisplay({ date }) {
  return (
    <div>
      <MomentComponent date={date} />
    </div>
  );
}

// MomentComponent.jsx
import moment from 'moment';
import 'moment/locale/zh-cn';

export default function MomentComponent({ date }) {
  return <span>{moment(date).format('LLLL')}</span>;
}
```

**解决方案2：使用 date-fns（推荐）：**

```jsx
// ✅ 方案2：使用date-fns，它不会有时区问题
import { format, formatDistance } from 'date-fns';
import { zhCN } from 'date-fns/locale';

function DateComponent({ date }) {
  return (
    <div>
      <p>{format(new Date(date), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}</p>
      <p>{formatDistance(new Date(date), new Date(), { locale: zhCN })}</p>
    </div>
  );
}
```

**Next.js 13+ App Router 特殊处理：**

```tsx
// app/page.tsx - 服务端组件
import DateClientWrapper from './DateClientWrapper';

export default async function Page() {
  // 服务端获取数据
  const data = await fetchData();

  return (
    <div>
      <h1>{data.title}</h1>
      {/* 客户端时间显示组件 */}
      <DateClientWrapper date={data.createdAt} />
    </div>
  );
}

// components/DateClientWrapper.tsx
'use client';

import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function DateClientWrapper({ date }) {
  return (
    <time dateTime={date}>
      {format(new Date(date), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
    </time>
  );
}
```

---

## 四、进阶水合技术

### 4.1 选择性水合（Selective Hydration）

选择性水合允许React优先水合用户立即需要交互的部分。

```jsx
import { Suspense } from 'react';

// ✅ 选择性水合：优先水合用户可能点击的按钮
function SelectiveHydration() {
  return (
    <div>
      {/* 重内容，延后水合 */}
      <article>
        <h1>文章标题</h1>
        <p>长文章内容...</p>
      </article>

      {/* 交互组件，优先水合 */}
      <Suspense fallback={<ButtonSkeleton />}>
        <LikeButton />
      </Suspense>
    </div>
  );
}
```

**优先级策略：**

```jsx
// 用户可视区域内的组件优先水合
function PriorityHydration() {
  return (
    <div>
      {/* 高优先级：立即交互 */}
      <header>
        <nav>
          <Button priority="high">首页</Button>
          <Button priority="high">关于</Button>
        </nav>
      </header>

      {/* 低优先级：懒加载 */}
      <main>
        <Article />
      </main>

      {/* 中优先级：滚动到视口时水合 */}
      <aside>
        <RelatedArticles />
      </aside>
    </div>
  );
}
```

### 4.2 渐进式水合（Progressive Hydration）

按需水合，只在需要时加载和激活组件。

```jsx
// 使用 React.lazy 实现渐进式水合
import { lazy, Suspense } from 'react';

const HeavyChart = lazy(() => import('./HeavyChart'));
const ImageGallery = lazy(() => import('./ImageGallery'));
const CommentSection = lazy(() => import('./CommentSection'));

function ProgressivePage() {
  return (
    <div>
      {/* 首屏必需，立即水合 */}
      <Header />
      <Hero />

      {/* 渐进加载，延后水合 */}
      <Suspense fallback={<ChartSkeleton />}>
        <HeavyChart data={chartData} />
      </Suspense>

      <Suspense fallback={<GallerySkeleton />}>
        <ImageGallery images={images} />
      </Suspense>

      <Suspense fallback={<CommentSkeleton />}>
        <CommentSection />
      </Suspense>
    </div>
  );
}
```

**IntersectionObserver 触发水合：**

```jsx
import { useEffect, useState, useRef } from 'react';

function LazyHydrate({ children, onVisible }) {
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onVisible?.();
          observer.disconnect();
        }
      },
      { rootMargin: '100px' } // 提前100px开始加载
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [onVisible]);

  return <div ref={ref}>{children}</div>;
}

// 使用
function Page() {
  return (
    <div>
      <Header /> {/* 立即水合 */}

      <LazyHydrate onVisible={() => {}}>
        <HeavyComponent /> {/* 进入视口时水合 */}
      </LazyHydrate>
    </div>
  );
}
```

### 4.3 流式 SSR（Streaming SSR）

流式渲染允许分块发送HTML，首屏更快。

```javascript
// Next.js App Router 自动支持流式渲染
// app/page.tsx

import { Suspense } from 'react';

async function Page() {
  // 立即获取基础数据
  const basicData = await getBasicData();

  return (
    <html>
      <body>
        {/* 立即显示 */}
        <h1>{basicData.title}</h1>

        {/* 流式加载 */}
        <Suspense fallback={<CommentsSkeleton />}>
          <Comments />
        </Suspense>

        <Suspense fallback={<RecommendationsSkeleton />}>
          <Recommendations />
        </Suspense>
      </body>
    </html>
  );
}
```

**Node.js 原生流式渲染：**

```javascript
import { renderToPipeableStream } from 'react-dom/server';

app.get('/', (req, res) => {
  const stream = renderToPipeableStream(<App />, {
    bootstrapScripts: ['/main.js'],
    onShellReady() {
      // HTML外壳准备完毕，开始发送
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
      stream.pipe(res);
    },
    onShellError(error) {
      // 外壳渲染失败
      res.statusCode = 500;
      stream.destroy();
    },
    onError(error) {
      // 记录错误但不中断
      console.error(error);
    }
  });
});
```

### 4.4 React 18 Suspense 水合

```jsx
import { Suspense } from 'react';

// ✅ 服务端
async function ServerComponent() {
  return (
    <div>
      <h1>标题</h1>

      <Suspense fallback={<CommentsSkeleton />}>
        <Comments />
      </Suspense>
    </div>
  );
}

// ✅ 客户端水合，Suspense自动处理
function Comments() {
  // 这个组件可以挂起，Suspense会显示fallback
  const comments = useComments();

  return (
    <div>
      {comments.map(c => (
        <Comment key={c.id} data={c} />
      ))}
    </div>
  );
}
```

---

## 五、性能优化

### 5.1 减少水合体量

**代码分割：**

```jsx
// ❌ 整包加载
import React from 'react';
import App from './App';

hydrateRoot(document.getElementById('root'), <App />);

// ✅ 分割后
import('./bootstrap').then(({ hydrateRoot, App }) => {
  hydrateRoot(document.getElementById('root'), <App />);
});
```

**路由级分割：**

```tsx
// Next.js App Router 自动代码分割
// app/about/page.tsx
export default function AboutPage() {
  return <h1>关于我们</h1>;
}
// 这个页面会独立打包
```

### 5.2 预加载关键资源

```html
<!-- HTML预加载关键资源 -->
<head>
  <!-- 预加载关键JavaScript -->
  <link rel="preload" href="/main.js" as="script">

  <!-- 预加载关键CSS -->
  <link rel="preload" href="/styles.css" as="style">

  <!-- 预连接第三方域名 -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="dns-prefetch" href="https://api.example.com">
</head>
```

### 5.3 延迟水合

```jsx
// 使用requestIdleCallback延迟非关键水合
function useIdleCallback(callback) {
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(callback);
      return () => cancelIdleCallback(id);
    } else {
      // 降级：使用setTimeout
      const id = setTimeout(callback, 100);
      return () => clearTimeout(id);
    }
  }, [callback]);
}

// 延迟水合非关键组件
function LazyHydratedComponent() {
  const [hydrated, setHydrated] = useState(false);

  useIdleCallback(() => {
    setHydrated(true);
  });

  if (!hydrated) {
    return <div className="skeleton" />;
  }

  return <HeavyInteractiveComponent />;
}
```

### 5.4 onRecoverableError 处理

```jsx
// React 18 的自动恢复机制
hydrateRoot(container, <App />, {
  onRecoverableError(error) {
    // 记录可恢复的错误
    console.log('水合自动恢复:', error.message);

    // 上报到监控系统
    if (window.Sentry) {
      Sentry.captureException(error, {
        tags: { type: 'hydration' }
      });
    }
  }
});
```

---

## 六、Next.js 水合实战

### 6.1 App Router 水合

```tsx
// app/layout.tsx - 自动SSR + 水合
import './globals.css';

export const metadata = {
  title: '我的应用',
  description: 'Next.js App Router 示例',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
```

### 6.2 Pages Router 水合

```tsx
// pages/_app.tsx - 自定义水合行为
import type { AppProps } from 'next/app';
import { useState } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // 水合完成前显示loading
  if (!hydrated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>加载中...</div>
      </div>
    );
  }

  return <Component {...pageProps} />;
}
```

### 6.3 useHydrated Hook

```tsx
// hooks/useHydrated.ts
import { useState, useEffect } from 'react';

/**
 * 检测组件是否已完成水合
 * @returns boolean - 是否已完成水合
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}

// 使用示例
function DateDisplay({ date }) {
  const hydrated = useHydrated();

  if (!hydrated) {
    return <span>--</span>;
  }

  return <span>{new Date(date).toLocaleDateString()}</span>;
}
```

### 6.4 HydrationProvider

```tsx
// components/HydrationProvider.tsx
'use client';

import { useState, createContext, useContext } from 'react';

interface HydrationContextValue {
  hydrated: boolean;
}

const HydrationContext = createContext<HydrationContextValue>({ hydrated: false });

export function HydrationProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useState(() => {
    setHydrated(true);
  });

  return (
    <HydrationContext.Provider value={{ hydrated }}>
      {children}
    </HydrationContext.Provider>
  );
}

export const useHydration = () => useContext(HydrationContext);

// 必须在 layout 中包裹
// app/layout.tsx
import { HydrationProvider } from '@/components/HydrationProvider';

export default function Layout({ children }) {
  return (
    <html>
      <body>
        <HydrationProvider>
          {children}
        </HydrationProvider>
      </body>
    </html>
  );
}
```

---

## 七、面试高频问题（详细解答）

### Q1: 什么情况下会发生 hydration mismatch？如何解决？

**答：**

**发生场景：**
服务端渲染的HTML与客户端渲染的结果不一致。

**常见原因：**
1. 时间相关代码（`new Date()`、`Date.now()`）
2. 随机数（`Math.random()`、`uuid()`）
3. 浏览器API（`window`、`document`、`localStorage`）
4. 条件渲染判断客户端特有状态

**解决方案：**
1. 使用 `useEffect` 延迟客户端特有逻辑
2. 使用 React 18 的 `useId` 生成稳定ID
3. 使用 `suppressHydrationWarning` 抑制警告
4. 使用 `dynamic` 禁用第三方库的服务端渲染
5. 使用 `useHydrated` Hook 判断水合状态

```jsx
// 完整解决方案示例
function Component() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div>
      {/* 服务端和客户端一致 */}
      <StaticContent />

      {/* 仅客户端渲染 */}
      {mounted && <ClientOnlyContent />}
    </div>
  );
}
```

### Q2: 为什么 useEffect 里的代码不会导致水合不匹配？

**答：**

`useEffect` 的执行时机决定了它不会导致水合不匹配：

```
1. 服务端：renderToString → 生成HTML → 不执行useEffect
2. 客户端：生成HTML → hydrate → useEffect（在水合完成后）
```

```javascript
// 执行顺序
服务端: render() → 输出HTML（无useEffect）
          ↓
客户端: render() → hydrate() → useEffect()
          ↓
         DOM已存在，useEffect只做副作用
```

**useEffect 的特点：**
- 不参与渲染计算
- 在水合完成后执行
- 不会影响DOM初始结构
- 适合处理第三方库初始化、事件绑定等

**useLayoutEffect 会阻塞水合：**
```jsx
// ⚠️ useLayoutEffect 在水合前执行，可能导致问题
useLayoutEffect(() => {
  // 这个会在水合前执行
}, []);
```

### Q3: hydrateRoot 和 renderRoot 有什么区别？

**答：**

**renderRoot（内部实现）：**
- React内部使用的渲染器
- 不直接对外暴露
- 负责创建Fiber树和协调

**hydrateRoot（公开API）：**
- React 18 引入的新API
- 用于水合已存在的服务端渲染HTML
- 自动复用现有DOM节点
- 支持 `onRecoverableError` 回调
- 支持多个独立root

```javascript
// hydrateRoot vs createRoot
import { hydrateRoot, createRoot } from 'react-dom/client';

// hydrateRoot：水合现有HTML
hydrateRoot(container, <App />);

// createRoot：创建新的root（CSR模式）
createRoot(container).render(<App />);
```

### Q4: 如何优化大量组件的水合性能？

**答：**

**策略1：代码分割**
```jsx
// 按需加载非关键组件
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

**策略2：渐进式水合**
```jsx
// 优先水合可视区域内的组件
function LazySection({ children }) {
  const [visible, setVisible] = useState(false);

  return (
    <div ref={(el) => {
      if (el && !visible) {
        const observer = new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
        observer.observe(el);
      }
    }}>
      {visible ? children : <Skeleton />}
    </div>
  );
}
```

**策略3：减少水合组件数量**
```jsx
// 使用服务端组件，减少客户端组件
// app/page.tsx (服务端组件)
export default async function Page() {
  const data = await fetchData();

  // 数据处理在服务端完成
  const processedData = processData(data);

  // 只传递最终结果给客户端
  return <ClientComponent data={processedData} />;
}

// ClientComponent.tsx ('use client')
function ClientComponent({ data }) {
  // 这个组件很简单，水合很快
  return <div>{data.name}</div>;
}
```

**策略4：预加载资源**
```html
<!-- 在head中预加载关键JS -->
<link rel="preload" href="/main.js" as="script">
<link rel="modulepreload" href="/chunk.js">
```

### Q5: SSG 和 SSR 在水合过程有什么区别？

**答：**

**SSG（静态生成）的水合：**
```javascript
// 构建时生成静态HTML
// 特点：
// 1. HTML完全静态，可CDN缓存
// 2. 水合时DOM已稳定
// 3. 无服务端计算开销
// 4. 适合内容不变的页面

// 流程：
构建时: generateStaticHTML() → index.html
请求时: index.html → hydrateRoot()
```

**SSR（服务端渲染）的水合：**
```javascript
// 每次请求时动态生成HTML
// 特点：
// 1. HTML个性化，每次可能不同
// 2. 需要服务端计算
// 3. 缓存策略更复杂
// 4. 适合需要实时数据的页面

// 流程：
请求时: renderToPipeableStream() → HTML → hydrateRoot()
```

**对比表格：**

| 方面 | SSG | SSR |
|------|-----|-----|
| HTML生成时机 | 构建时 | 请求时 |
| 水合DOM状态 | 完全稳定 | 可能变化 |
| 水合成功率 | 高 | 取决于服务端数据 |
| 服务端负载 | 无 | 每次请求 |
| 缓存 | 长期CDN | 短期或无 |

---

## 总结

水合技术是 React SSR 的核心机制，理解其原理对于构建高性能全栈应用至关重要。面试中常考察的要点包括：

1. **水合原理**：理解服务端渲染HTML与客户端接管的完整流程
2. **不匹配处理**：熟练处理各类 hydration mismatch 场景
3. **性能优化**：掌握选择性水合、渐进式水合等高级技术
4. **Next.js集成**：理解 App Router 和 Pages Router 的水合差异

掌握这些知识，你就能在面试中自信地回答任何关于 SSR 水合的问题。

---

*本文档由 AI 生成，内容基于 React 18/19 和 Next.js 16 最新特性*
