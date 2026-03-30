# React 流式渲染底层实现：renderToPipeableStream 与 Insertable Streams

## 一、流式渲染的核心概念

### 1.1 为什么需要流式渲染？

**传统 SSR 的问题：**

```
用户 → 请求 → [等待整个页面渲染完成] → 收到完整HTML → 看到页面
                        ↑
                    可能需要500ms-2000ms
```

**流式渲染的优势：**

```
用户 → 请求 → [外壳立即可用] → 用户看到页面框架
                ↓
        [流式发送剩余内容] → 页面逐渐完整
                ↓
        [水合完成] → 完全可交互
```

### 1.2 流式渲染的工作原理

React 18 引入了流式 SSR，核心是 `renderToPipeableStream` API：

```javascript
import { renderToPipeableStream } from 'react-dom/server';
import { Transform } from 'stream';

function handleRequest(req, res) {
  // 1. 创建可写流
  const { pipe } = renderToPipeableStream(<App />, {
    // 2. 标记bootstrap脚本（客户端需要下载的JS）
    bootstrapScripts: ['/main.js'],

    // 3. 当外壳准备好时开始流式传输
    onShellReady() {
      res.setHeader('Content-Type', 'text/html');
      pipe(res); // 开始流式传输HTML
    },

    // 4. 处理错误
    onError(error) {
      console.error('渲染错误:', error);
    }
  });
}
```

---

## 二、renderToPipeableStream 深度解析

### 2.1 核心参数详解

```javascript
const { pipe, abort } = renderToPipeableStream(element, options);
```

**options 参数完整解析：**

```typescript
interface RenderToPipeableStreamOptions {
  // Bootstrap脚本路径 - 必须在水合前加载
  bootstrapScripts: string[];

  // Bootstrap脚本内容（可选）- 直接内联JS
  bootstrapScriptContent?: string;

  // 仅脚本路径（不执行）
  bootstrapModules?: string[];

  // 服务端水合的脚本（可选）
  // 用于流式HTML中的内联脚本
  onAllReady?: () => void;
  // 当所有流式内容准备就绪时调用

  // 外壳准备好时调用
  onShellReady?: () => void;
  // 当初始HTML外壳（不含Suspense内容）准备就绪时调用

  // 每次有内容输出时调用
  onShellError?: (error: Error) => void;
  // 当外壳渲染失败时调用

  // 错误处理
  onError?: (error: Error) => void;
  // 当任何渲染错误发生时调用

  // 识别符函数（可选）
  identifierPrefix?: string;
  // 用于在服务端和客户端生成相同ID的前缀

  // 命名空间URI（可选）
  namespaceURI?: string;
  // 默认是 'http://www.w3.org/1998/Math/MathML'

  // 渐进式bootstrap（可选）
  progressiveChunkSize?: number;
  // 控制分块大小的参数
}
```

### 2.2 完整实现示例

```javascript
// server.js - 使用 renderToPipeableStream 实现流式SSR
import express from 'express';
import { renderToPipeableStream } from 'react-dom/server';
import App from './App';

const app = express();

// 禁用缓存，确保每次请求都重新渲染
app.set('etag', false);
app.set('view cache', false);

app.get('*', (req, res) => {
  // 设置响应头
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // 开始流式渲染
  const { pipe, abort } = renderToPipeableStream(
    <App url={req.url} />,
    {
      // Bootstrap脚本
      bootstrapScripts: ['/main.js'],

      // 当外壳（shell）准备好时开始流
      onShellReady() {
        console.log('Shell ready, starting stream...');
        pipe(res);
      },

      // 处理外壳错误
      onShellError(error) {
        console.error('Shell error:', error);
        res.statusCode = 500;
        res.end('<h1>500 - Server Error</h1>');
      },

      // 处理渲染错误
      onError(error) {
        console.error('Render error:', error);
      },

      // 所有内容准备就绪（用于调试）
      onAllReady() {
        console.log('All content ready');
      }
    }
  );

  // 超时处理
  setTimeout(() => {
    abort();
    console.log('Request timed out');
  }, 10000);
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

---

## 三、Insertable Streams 深度解析

### 3.1 什么是 Insertable Streams？

Insertable Streams 是 Web Streams API 的扩展，允许我们在流式传输过程中**插入自定义内容**。这对于以下场景特别有用：

- 注入额外的脚本
- 添加样式
- 修改HTML片段
- 插入SEO元数据

### 3.2 TransformStream 实现

```javascript
// 创建自定义转换流
const { writable, readable } = new TransformStream({
  start(controller) {
    // 初始化转换控制器
    console.log('Transform stream started');
  },

  transform(chunk, controller) {
    // 转换每个数据块
    // chunk: Uint8Array 类型的HTML片段
    const text = new TextDecoder().decode(chunk);

    // 可以在这里修改HTML
    const modified = text.replace(
      '<head>',
      '<head><link rel="stylesheet" href="/custom.css">'
    );

    controller.enqueue(new TextEncoder().encode(modified));
  },

  flush(controller) {
    // 流结束时调用
    console.log('Transform stream completed');
    controller.terminate();
  }
});
```

### 3.3 在 renderToPipeableStream 中使用

```javascript
// server.js - 使用 Insertable Streams 修改流式HTML
app.get('*', (req, res) => {
  // 创建自定义转换流
  const htmlTransformer = new TransformStream({
    transform(chunk, controller) {
      const text = new TextDecoder().decode(chunk);

      // 示例1：添加全局脚本
      let modified = text.replace(
        '</body>',
        '<script src="/analytics.js"></script></body>'
      );

      // 示例2：添加SEO meta标签
      modified = modified.replace(
        '<head>',
        '<head><meta name="robots" content="index, follow">'
      );

      // 示例3：添加性能监控
      if (text.includes('bootstrap')) {
        modified = modified.replace(
          '</body>',
          `<script>
            // 性能监控
            window.addEventListener('load', () => {
              performance.mark('hydration-complete');
            });
          </script></body>`
        );
      }

      controller.enqueue(new TextEncoder().encode(modified));
    }
  });

  const { pipe } = renderToPipeableStream(<App />, {
    bootstrapScripts: ['/main.js'],
    onShellReady() {
      // 将转换流连接到响应流
      pipe(res)
        .pipeThrough(htmlTransformer); // 使用 Insertable Streams
    }
  });
});
```

### 3.4 实际应用场景

**场景1：注入关键CSS**

```javascript
const criticalCssStream = new TransformStream({
  transform(chunk, controller) {
    const text = new TextDecoder().decode(chunk);

    // 在head标签后插入关键CSS
    const criticalCss = `
      <style>
        body { margin: 0; font-family: system-ui; }
        .header { background: #333; color: white; padding: 1rem; }
        .content { padding: 1rem; }
      </style>
    `;

    const modified = text.replace('<head>', `<head>${criticalCss}`);

    controller.enqueue(new TextEncoder().encode(modified));
  }
});
```

**场景2：注入用户个性化内容**

```javascript
const personalizationStream = new TransformStream({
  async transform(chunk, controller) {
    const text = new TextDecoder().decode(chunk);

    // 注入用户特定的脚本
    const userId = getUserIdFromCookie(req.headers.cookie);
    const personalizationScript = userId
      ? `<script>window.__USER_ID__ = '${userId}';</script>`
      : '<script>window.__USER_ID__ = null;</script>';

    const modified = text.replace('</head>', `${personalizationScript}</head>`);

    controller.enqueue(new TextEncoder().encode(modified));
  }
});
```

---

## 四、FlushSync 与流控制

### 4.1 什么是 FlushSync？

`flushSync` 是 React 18 引入的 API，用于**同步刷新**更新队列到DOM。在流式渲染中，它用于控制何时将内容"冲刷"到响应流：

```javascript
import { flushSync } from 'react-dom';

function handleClick() {
  // 同步刷新状态更新
  flushSync(() => {
    setCount(count + 1);
  });

  // 此时DOM已经更新完成
  console.log('DOM已同步更新');
}
```

### 4.2 在流式渲染中的作用

虽然 `flushSync` 主要用于客户端，但在服务端渲染中也有特殊用途：

```javascript
// 服务端：确保按特定顺序刷新内容
import { renderToString, flushSync } from 'react-dom/server';

// 注意：在 renderToPipeableStream 中，flushSync 用于控制分块
const { pipe } = renderToPipeableStream(<App />, {
  onShellReady() {
    // 手动控制何时发送内容
    pipe(res);
  }
});
```

### 4.3 流控制策略

**策略1：基于 Suspense 的自动流控制**

```javascript
// React 自动管理 Suspense boundary 的流式传输
function Page() {
  return (
    <div>
      {/* 这个立即渲染 */}
      <Header />

      {/* 这个数据慢，可能后渲染 */}
      <Suspense fallback={<ProductSkeleton />}>
        <ProductList /> {/* 异步数据 */}
      </Suspense>

      {/* 这个也异步 */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <Reviews /> {/* 异步数据 */}
      </Suspense>
    </div>
  );
}

// 服务器按以下顺序流式发送：
// 1. Header HTML
// 2. Suspense fallback（立即）
// 3. ProductList（数据准备好后）
// 4. Reviews（数据准备好后）
```

**策略2：手动流控制**

```javascript
// 使用 useDeferredValue 和 useTransition 控制渲染优先级
'use client';

function SearchResults({ query }) {
  const [isPending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);

  const results = useMemo(() => {
    return search(deferredQuery);
  }, [deferredQuery]);

  return (
    <div>
      {/* 低优先级更新 */}
      <Suspense fallback={<div>搜索中...</div>}>
        <Results results={results} />
      </Suspense>

      {/* 显示加载状态 */}
      {isPending && <LoadingSpinner />}
    </div>
  );
}
```

**策略3：使用 flushSync 确保同步刷新**

```javascript
// 客户端：在关键操作后同步刷新DOM
'use client';

function CheckoutButton({ onCheckout }) {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);

    // 确保按钮状态立即更新
    flushSync(() => {
      setLoading(true);
    });

    // 然后执行异步操作
    onCheckout().finally(() => {
      setLoading(false);
    });
  };

  return (
    <button onClick={handleClick} disabled={loading}>
      {loading ? '处理中...' : '结算'}
    </button>
  );
}
```

---

## 五、综合实战：完整的流式渲染服务器

### 5.1 项目结构

```
project/
├── server/
│   └── index.js          # 流式渲染服务器
├── src/
│   ├── App.tsx           # 主应用组件
│   └── components/       # 业务组件
├── public/
│   └── main.js           # 客户端bundle
└── package.json
```

### 5.2 完整服务器实现

```javascript
// server/index.js
import express from 'express';
import { renderToPipeableStream } from 'react-dom/server';
import { Transform } from 'stream';
import App from '../src/App';

const app = express();
app.use(express.static('public'));

// 内容转换流：添加性能监控和SEO
function createHtmlTransformer(req) {
  return new Transform({
    transform(chunk, controller) {
      const html = chunk.toString();

      // 1. 添加SEO meta标签
      let modified = html.replace(
        '<head>',
        `<head>
          <meta name="description" content="高性能React应用">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <link rel="canonical" href="${req.originalUrl}">
        `
      );

      // 2. 添加性能监控脚本
      modified = modified.replace(
        '</body>',
        `<script>
          // Core Web Vitals 监控
          new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
              if (entry.entryType === 'navigation') {
                console.log('LCP:', entry.loadEventEnd - entry.startTime);
              }
            });
          }).observe({ type: 'navigation', buffered: true });
        </script>
        </body>`
      );

      // 3. 添加用户追踪（示例）
      const userId = req.cookies?.userId || 'anonymous';
      modified = modified.replace(
        '</body>',
        `<script>window.__USER_ID__ = '${userId}';</script></body>`
      );

      controller.enqueue(Buffer.from(modified));
    }
  });
}

// 流式渲染路由
app.get('*', (req, res) => {
  const htmlTransformer = createHtmlTransformer(req);

  // 设置响应头
  res.writeHead(200, {
    'Content-Type': 'text/html',
    'Transfer-Encoding': 'chunked',
    'Cache-Control': 'no-cache',
  });

  // 创建渲染流
  const { pipe, abort } = renderToPipeableStream(<App url={req.url} />, {
    bootstrapScripts: ['/main.js'],
    bootstrapScriptContent: `
      // 内联引导脚本
      window.__INITIAL_DATA__ = {
        timestamp: Date.now(),
        url: window.location.href,
      };
    `,

    // 外壳准备好后开始流
    onShellReady() {
      console.log(`[${new Date().toISOString()}] Shell ready for ${req.path}`);
      pipe(res).pipeThrough(htmlTransformer);
    },

    // 外壳错误处理
    onShellError(error) {
      console.error('Shell error:', error);
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body>
            <h1>500 - 服务器渲染错误</h1>
            <p>请稍后再试</p>
          </body>
        </html>
      `);
    },

    // 全局错误处理
    onError(error) {
      console.error('Render error:', error);
    },

    // 渐进式分块大小
    progressiveChunkSize: 1024 * 10, // 10KB per chunk
  });

  // 超时处理
  const timeout = setTimeout(() => {
    console.log(`[${new Date().toISOString()}] Request timeout: ${req.path}`);
    abort();
    res.end('Request timeout');
  }, 30000);

  // 请求结束时清理
  res.on('close', () => {
    clearTimeout(timeout);
    abort();
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════╗
  ║                                                   ║
  ║   🚀 流式渲染服务器已启动                          ║
  ║                                                   ║
  ║   📍 地址: http://localhost:${PORT}                  ║
  ║   ⚡ 功能: renderToPipeableStream + Insertable     ║
  ║   📊 特性: 流式传输、性能监控、SEO注入              ║
  ║                                                   ║
  ╚═══════════════════════════════════════════════════╝
  `);
});
```

### 5.3 React 应用组件

```tsx
// src/App.tsx
import { Suspense } from 'react';

// 模拟慢数据加载
async function ProductList() {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 1000));
  const products = [
    { id: 1, name: '产品A', price: 99 },
    { id: 2, name: '产品B', price: 199 },
    { id: 3, name: '产品C', price: 299 },
  ];

  return (
    <ul>
      {products.map(p => (
        <li key={p.id}>{p.name} - ¥{p.price}</li>
      ))}
    </ul>
  );
}

async function UserReviews() {
  await new Promise(resolve => setTimeout(resolve, 2000));
  return (
    <div>
      <h3>用户评价</h3>
      <p>⭐⭐⭐⭐⭐ 非常好的产品！</p>
      <p>⭐⭐⭐⭐ 值得购买</p>
    </div>
  );
}

function Skeleton() {
  return <div style={{ background: '#eee', padding: '20px' }}>加载中...</div>;
}

export default function App() {
  return (
    <html lang="zh-CN">
      <head>
        <title>流式渲染示例</title>
      </head>
      <body>
        <header>
          <h1>🎉 欢迎访问</h1>
        </header>

        <main>
          {/* 外壳立即渲染 */}
          <p>页面已加载，请稍候...</p>

          {/* 流式内容1 */}
          <Suspense fallback={<Skeleton />}>
            <ProductList />
          </Suspense>

          {/* 流式内容2 */}
          <Suspense fallback={<Skeleton />}>
            <UserReviews />
          </Suspense>
        </main>
      </body>
    </html>
  );
}
```

---

## 六、性能优化与最佳实践

### 6.1 分块大小调优

```javascript
// 较大的分块减少系统调用
// 较小的分块加快首字节时间(TTFB)

const { pipe } = renderToPipeableStream(<App />, {
  // 根据内容调整分块大小
  progressiveChunkSize: 1024 * 50, // 50KB，适合内容丰富的页面

  // 或者使用默认值，让React自动优化
  // progressiveChunkSize: undefined,
});
```

### 6.2 错误边界与降级

```javascript
// 使用 Error Boundary 处理渲染错误
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return <div>出错了</div>;
    }
    return this.props.children;
  }
}
```

### 6.3 监控与调试

```javascript
const { pipe } = renderToPipeableStream(<App />, {
  onShellReady() {
    const ttfb = performance.now();
    console.log(`首字节时间: ${ttfb.toFixed(2)}ms`);
  },

  onAllReady() {
    const complete = performance.now();
    console.log(`所有内容准备就绪: ${complete.toFixed(2)}ms`);
  },

  onError(error, errorInfo) {
    console.error('渲染错误:', error);
    console.error('组件栈:', errorInfo.componentStack);
  },
});
```

---

## 七、面试高频问题

**Q1：renderToPipeableStream 和 renderToString 的区别是什么？**

A：`renderToString` 是同步的，必须等整个组件树渲染完成才能返回HTML，适合简单页面或Serverless。`renderToPipeableStream` 是基于流的，可以边渲染边发送HTML，提升首屏速度，适合复杂应用。

**Q2：Insertable Streams 在 SSR 中有什么用？**

A：它允许我们在HTML流式传输过程中动态修改内容，比如注入CSS、添加脚本、插入个性化内容等，而不需要等待完整的HTML生成。

**Q3：flushSync 在流式渲染中的作用是什么？**

A：`flushSync` 主要用于客户端同步刷新DOM状态更新。在服务端，它用于控制何时将渲染内容"冲刷"到响应流，确保关键内容优先发送。

**Q4：如何优化流式渲染的首屏性能？**

A：1）使用 `onShellReady` 尽早发送外壳HTML；2）将关键CSS内联到HTML中；3）使用 Suspense boundary 分解内容；4）配置合适的 `progressiveChunkSize`。

---

*本文档持续更新，最后更新于 2026 年 3 月*
