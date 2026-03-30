# React 18服务端渲染新特性完全指南

## 概述

React 18是React历史上最重要的版本之一，它引入了**并发渲染（Concurrent Rendering）**这一革命性特性，彻底改变了React的渲染机制。本文档将深入探讨React 18在服务端渲染方面的重大改进，包括流式SSR、选择性水合、自动批处理等核心特性，以及新增的并发Hook（useTransition、useDeferredValue、useSyncExternalStore）。

React 18的核心理念是：**让React能够同时准备多个版本的UI**，这意味着React可以在不阻塞主线程的情况下中断、恢复或放弃渲染工作。这种能力为SSR带来了前所未有的性能提升和用户体验优化。

---

## 一、React 18服务端渲染革新

### 1.1 流式SSR（Streaming SSR）

#### 1.1.1 从renderToNodeStream到renderToPipeableStream的演进

在React 17及之前，服务端渲染使用`renderToString`或`renderToNodeStream`方法。这些方法存在以下问题：

- **`renderToString`**：同步渲染整个组件树，返回完整HTML。无法处理异步操作，会阻塞服务器响应。
- **`renderToNodeStream`**：返回可读流，但不支持React 18的Suspense边界。

React 18引入了`renderToPipeableStream`，它支持流式渲染并原生集成Suspense：

```tsx
// React 18 服务端渲染示例
import { renderToPipeableStream } from 'react-dom/server';
import { Readable } from 'stream';

// 定义完整的HTML外壳
const shellHtml = `<!DOCTYPE html>
<html>
<head>
  <title>React 18 SSR</title>
  <script src="/static/react-client.js"></script>
</head>
<body>
  <div id="root">`;

// 定义脚本注入函数
function injectScripts(html) {
  return `
    </div>
    <script>
      // 立即执行脚本，确保尽早建立连接
      window.__INSERT_SCRIPTS_HERE__
    </script>
  </body>
</html>`;
}

// 服务端渲染处理函数
export async function handleRequest(req, res) {
  // 设置响应头
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Transfer-Encoding', 'chunked');

  // 创建管道流
  const { pipe } = renderToPipeableStream(<App />, {
    // shell是立即可渲染的部分
    // 即使有Suspense边界，shell也必须完全渲染
    shellHtml: shellHtml,

    // 处理shell渲染完成
    onShellReady() {
      // shell渲染完成后开始流式传输
      // 此时用户可以看到首屏内容，但可能还在加载中
      pipe(res);
    },

    // 处理shell错误（如Suspense fallback未定义）
    onShellError(error) {
      console.error('Shell渲染错误:', error);
      res.statusCode = 500;
      res.end('服务器内部错误');
    },

    // 处理所有渲染完成（包括异步数据加载）
    onAllReady() {
      // 所有内容都渲染完成后调用
      // 对于不需要流式更新的场景很有用
      console.log('所有内容渲染完成');
    },

    // 处理渲染错误
    onError(error) {
      console.error('渲染错误:', error);
    }
  });
}
```

#### 1.1.2 Suspense边界的流式处理

React 18的流式SSR核心是**Suspense边界**。当组件触发Suspense时，React会：

1. 先发送shell HTML（包括Suspense的fallback）
2. 异步加载数据完成后，**流式推送**实际的组件HTML
3. 最后注入脚本来激活客户端水合

```tsx
// 完整的流式SSR示例
import { renderToPipeableStream } from 'react-dom/server';
import { Suspense } from 'react';

// 模拟异步数据获取
async function fetchUserData(userId) {
  const response = await fetch(`https://api.example.com/users/${userId}`);
  return response.json();
}

// 用户资料组件 - 使用use实现数据获取
function UserProfile({ userId }) {
  // React 18.3+的use API
  const user = use(fetchUserData(userId));

  return (
    <div className="user-profile">
      <img src={user.avatar} alt={user.name} />
      <h1>{user.name}</h1>
      <p>{user.bio}</p>
    </div>
  );
}

// 用户资料加载中组件
function UserProfileSkeleton() {
  return (
    <div className="user-profile skeleton">
      <div className="avatar-placeholder" />
      <div className="name-placeholder" />
      <div className="bio-placeholder" />
    </div>
  );
}

// 主应用组件
function App() {
  return (
    <html>
      <head>
        <title>React 18 流式SSR演示</title>
        <style>{`
          .skeleton {
            animation: pulse 1.5s ease-in-out infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </head>
      <body>
        <nav>
          <a href="/">首页</a>
          <a href="/profile">用户资料</a>
        </nav>

        <main>
          {/*
            Suspense边界会：
            1. 先渲染fallback（UserProfileSkeleton）
            2. 数据加载完成后，流式替换为实际内容
          */}
          <Suspense fallback={<UserProfileSkeleton />}>
            <UserProfile userId="123" />
          </Suspense>
        </main>
      </body>
    </html>
  );
}

// 服务端渲染配置
const config = {
  // shellHtml必须包含所有非Suspense内容
  shellHtml: `<!DOCTYPE html>
<html>
<head><title>加载中...</title></head>
<body><div id="root"></div></body>
</html>`,

  onShellReady() {
    // 开始流式输出
  },

  // .bootstrapScriptContent在所有流式内容发送后执行
  bootstrapScriptContent: `
    // 初始化客户端React
    hydrateRoot(document.getElementById('root'), <App />);
  `
};
```

#### 1.1.3 插入脚本标签的策略

React 18提供了多种脚本注入策略，优化加载顺序和执行时机：

```tsx
// 脚本注入策略详解
const config = {
  // 策略1：单个引导脚本（最简单）
  bootstrapScripts: ['/static/main.js'],

  // 策略2：带自定义内容的引导脚本
  bootstrapScriptContent: `
    // 在脚本中直接写代码
    console.log('React 18 SSR初始化');
    hydrateRoot(document.getElementById('root'), <App />);
  `,

  // 策略3：模块脚本（ES6模块）
  // 注意：模块脚本默认defer，需要使用crossOrigin属性
  bootstrapModules: [
    {
      // React 19引入的预加载API
      // 服务端可预加载资源，客户端直接使用
      src: '/static/module.js',
      type: 'module'
    }
  ],

  // 策略4：内联脚本（立即执行）
  onShellReady() {
    res.write(`
      <script>
        // 这段脚本在shellReady时执行
        // 此时HTML已发送，但Suspense内容可能还在加载
        document.body.classList.add('shell-ready');
      </script>
    `);
  },

  // 策略5：流完成后注入脚本
  onAllReady() {
    res.write(`
      <script>
        // 所有流式内容发送完成后执行
        window.__SSR_COMPLETE__ = true;
      </script>
    `);
  }
};
```

### 1.2 选择性水合（Selective Hydration）

#### 1.2.1 传统水合的问题

在React 17及之前，客户端水合存在以下问题：

- **全局水合**：整个应用必须同时水合完成
- **阻塞主线程**：大型应用的初始水合会阻塞主线程
- **用户体验差**：用户必须等待整个应用加载完成才能交互

```tsx
// React 17的水合方式
import { hydrateRoot } from 'react-dom/client';
import App from './App';

// 问题：整个App必须同时水合
hydrateRoot(document.getElementById('root'), <App />);
```

#### 1.2.2 选择性水合的实现

React 18的选择性水合让**Suspense边界成为水合的边界**：

```tsx
import { hydrateRoot } from 'react-dom/client';
import { Suspense } from 'react';

// 组件树中的Suspense边界会成为水合的独立单元
function App() {
  return (
    <div>
      {/* Header - 立即水合，优先级最高 */}
      <Header />

      {/* Sidebar - 第二优先级 */}
      <Suspense fallback={<SidebarSkeleton />}>
        <Sidebar />
      </Suspense>

      {/* MainContent - 可以稍后水合 */}
      <Suspense fallback={<ContentSkeleton />}>
        <MainContent />
      </Suspense>

      {/* Comments - 懒加载，最后水合 */}
      <Suspense fallback={<CommentsSkeleton />}>
        <Comments />
      </Suspense>
    </div>
  );
}

// 客户端入口
hydrateRoot(document.getElementById('root'), <App />);
```

#### 1.2.3 优先交互区域的水合

React 18会**优先水合用户可能交互的区域**：

```tsx
// 优先水合用户焦点区域
function App() {
  return (
    <Layout>
      {/*
        优先级1：导航和搜索框
        用户最可能首先与之交互
      */}
      <header>
        <SearchBox autoFocus /> {/* 立即水合，支持键盘输入 */}
        <Navigation />
      </header>

      {/*
        优先级2：主要内容区
        视口内的内容优先
      */}
      <Suspense fallback={<ContentSkeleton />}>
        <MainContent />
      </Suspense>

      {/*
        优先级3：侧边栏
        视口外内容延迟
      */}
      <Suspense fallback={<SidebarSkeleton />}>
        <Sidebar />
      </Suspense>

      {/*
        优先级4：页脚评论
        用户滚动到底部才会看到
      */}
      <Suspense fallback={<CommentsSkeleton />}>
        <Comments />
      </Suspense>
    </Layout>
  );
}
```

#### 1.2.4 并行水合与事件处理

React 18支持**并行水合**，多个Suspense边界可以同时水合：

```tsx
// 并行水合示例
function Dashboard() {
  return (
    <>
      {/* 这些Suspense边界会并行水合 */}
      <Suspense fallback={<ChartSkeleton />}>
        <Chart data={chartData} />
      </Suspense>

      <Suspense fallback={<MetricsSkeleton />}>
        <Metrics data={metricsData} />
      </Suspense>

      <Suspense fallback={<ActivitySkeleton />}>
        <Activity data={activityData} />
      </Suspense>
    </>
  );
}

// 如果用户在某个区域点击
// React会立即水合该区域，即使其他区域还在加载
function handleUserClick(event) {
  // React会自动提升该区域的优先级
  // 并行水合确保用户交互区域立即可用
}
```

### 1.3 自动批处理（Automatic Batching）

#### 1.3.1 什么是批处理

批处理（Batch）是指**React将多个状态更新合并为一次渲染**。在React 18之前，只有事件处理器中的setState会自动批处理。

```tsx
// React 17及之前的批处理行为
function Counter() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);

  function handleClick() {
    // 手动批处理：在React事件中自动合并
    setCount(c => c + 1); // 被批处理
    setFlag(f => !f);      // 被批处理
    // 只触发一次渲染
  }

  useEffect(() => {
    // 问题：在useEffect中，setState不会自动批处理
    setCount(c => c + 1); // 触发渲染1
    setFlag(f => !f);      // 触发渲染2
    // 两次独立的渲染！
  }, []);

  return <div>{count} - {flag ? 'true' : 'false'}</div>;
}
```

#### 1.3.2 React 18的自动批处理改进

React 18将**自动批处理扩展到所有场景**，包括setTimeout、Promise、fetch回调等：

```tsx
// React 18的自动批处理
function Counter() {
  const [count, setCount] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // 场景1：setTimeout中的批处理
  function handleAsyncClick() {
    setCount(c => c + 1); // 排队
    setLoading(true);      // 排队

    // 异步操作
    setTimeout(() => {
      // 在React 18中，这里所有的setState都会被批处理
      // 只触发一次渲染！
      setCount(c => c + 1); // 被批处理
      setLoading(false);     // 被批处理
      setData({ loaded: true }); // 被批处理
    }, 1000);
  }

  // 场景2：Promise中的批处理
  async function handleFetch() {
    setLoading(true);  // 排队

    try {
      const response = await fetch('/api/data');
      const json = await response.json();

      // fetch回调中的setState都会被批处理
      setData(json);       // 被批处理
      setLoading(false);   // 被批处理
      setCount(c => c+1);  // 被批处理
      // 只触发一次渲染！
    } catch (error) {
      setLoading(false);
      setData({ error: true });
    }
  }

  // 场景3：原生事件中的批处理
  useEffect(() => {
    // React 18中，原生事件也会自动批处理
    const handler = () => {
      setCount(c => c + 1);
      setData({ event: true });
      // 只触发一次渲染
    };

    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <div>
      <p>Count: {count}</p>
      <p>{loading ? '加载中...' : '完成'}</p>
      <button onClick={handleAsyncClick}>异步更新</button>
      <button onClick={handleFetch}>获取数据</button>
    </div>
  );
}
```

#### 1.3.3 批处理的性能优势

自动批处理带来的性能提升：

```tsx
// 批处理前：多次渲染
// setTimeout回调中每次setState触发一次渲染
// 1000ms内可能触发3次渲染

// 批处理后：合并渲染
// 所有setState合并为一次渲染
// 性能提升约300%

// 实际测试示例
function PerformanceDemo() {
  const [state, setState] = useState({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    console.time('批量更新');

    // React 18会将这些合并为一次渲染
    setState(s => ({ ...s, x: 1 }));
    setState(s => ({ ...s, y: 2 }));
    setState(s => ({ ...s, z: 3 }));

    // 即使在setTimeout中，也不会触发多次渲染
    setTimeout(() => {
      setState(s => ({ ...s, x: 10 }));
      setState(s => ({ ...s, y: 20 }));
    }, 100);

    console.timeEnd('批量更新'); // 输出更短的时间
  }, []);

  return <div>{state.x}, {state.y}, {state.z}</div>;
}
```

---

## 二、并发特性（Concurrent Features）

### 2.1 useTransition

#### 2.1.1 紧急更新与非紧急更新

useTransition是React 18引入的核心Hook，用于**区分紧急更新和非紧急更新**：

- **紧急更新**：用户输入、点击、按键 - 需要立即响应
- **非紧急更新**：数据列表过滤、大量内容渲染 - 可以延迟

```tsx
import { useState, useTransition } from 'react';

function SearchableList({ items }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('');

  // useTransition返回一个数组
  // [isPending: boolean, startTransition: function]
  const [isPending, startTransition] = useTransition();

  function handleQueryChange(e) {
    // 这是紧急更新 - 用户正在输入，需要立即响应
    setQuery(e.target.value);
  }

  function handleFilterChange(e) {
    // 这是非紧急更新 - 过滤大量数据可以延迟
    // 使用startTransition包裹状态更新
    startTransition(() => {
      setFilter(e.target.value);
    });
  }

  // 过滤逻辑（非紧急，可以被打断）
  const filteredItems = items.filter(item => {
    const matchesQuery = item.name.includes(query);
    const matchesFilter = filter === '' || item.category === filter;
    return matchesQuery && matchesFilter;
  });

  return (
    <div>
      <input
        value={query}
        onChange={handleQueryChange}
        placeholder="搜索..."
      />

      <select
        value={filter}
        onChange={handleFilterChange}
        disabled={isPending}
      >
        <option value="">全部分类</option>
        <option value="electronics">电子产品</option>
        <option value="clothing">服装</option>
      </select>

      {/* 过滤时显示加载状态 */}
      {isPending && <div className="loading">过滤中...</div>}

      <ul>
        {filteredItems.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

#### 2.1.2 startTransition的工作原理

```tsx
import { useTransition, useState } from 'react';

function Demo() {
  const [count, setCount] = useState(0);
  const [isPending, startTransition] = useTransition();

  // 紧急更新：立即响应
  function handleClick() {
    setCount(c => c + 1);
  }

  // 非紧急更新：可能被中断
  function handleExpensiveUpdate() {
    startTransition(() => {
      // 这些更新是非紧急的
      // 如果用户继续点击，会被中断
      setCount(c => c + 1000);
      setComplexState(complexCalculation());
    });
  }

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={handleClick}>+1（紧急）</button>
      <button onClick={handleExpensiveUpdate} disabled={isPending}>
        {isPending ? '计算中...' : '+1000（非紧急）'}
      </button>
    </div>
  );
}
```

#### 2.1.3 isPending状态的应用

isPending在Transition进行时为true，可用于：

```tsx
function SearchableProducts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [isPending, startTransition] = useTransition();

  function handleSearch(e) {
    setSearchTerm(e.target.value);

    // 搜索是非紧急更新
    startTransition(async () => {
      const results = await searchProducts(e.target.value);
      setProducts(results);
    });
  }

  return (
    <div>
      <input
        value={searchTerm}
        onChange={handleSearch}
        className={isPending ? 'searching' : ''}
      />

      {/* 搜索时显示加载指示器 */}
      <div className={isPending ? 'spinner' : 'results'}>
        {isPending ? <LoadingSpinner /> : <ProductList products={products} />}
      </div>

      {/* 搜索期间禁用某些操作 */}
      <button disabled={isPending}>
        添加到购物车
      </button>
    </div>
  );
}
```

### 2.2 useDeferredValue

#### 2.2.1 延迟值的概念

useDeferredValue用于**延迟更新某个值**，让UI保持响应：

```tsx
import { useState, useDeferredValue } from 'react';

function SearchResults({ query }) {
  // useDeferredValue返回一个延迟版本的值
  // 当query快速变化时，deferredQuery会稍后更新
  const deferredQuery = useDeferredValue(query);

  // 使用延迟值进行搜索
  // 这样用户输入不会卡顿
  const results = useMemo(() => {
    return searchWithQuery(deferredQuery);
  }, [deferredQuery]);

  // 判断是否在延迟更新中
  const isStale = query !== deferredQuery;

  return (
    <div>
      <div className={isStale ? 'stale' : 'fresh'}>
        {results.map(result => (
          <SearchResult key={result.id} result={result} />
        ))}
      </div>
      {isStale && <div className="loading-indicator">加载中...</div>}
    </div>
  );
}
```

#### 2.2.2 useDeferredValue与useTransition的对比

```tsx
import { useState, useTransition, useDeferredValue } from 'react';

// 方式1：useTransition - 用于函数更新
function WithUseTransition() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();

  function handleChange(e) {
    setQuery(e.target.value);

    startTransition(() => {
      setResults(search(e.target.value));
    });
  }

  return (
    <div>
      <input value={query} onChange={handleChange} />
      {isPending ? <Loading /> : <Results data={results} />}
    </div>
  );
}

// 方式2：useDeferredValue - 用于值延迟
function WithUseDeferredValue() {
  const [query, setQuery] = useState('');
  // 直接对值进行延迟
  const deferredQuery = useDeferredValue(query);

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      {/* 渲染使用延迟值 */}
      <SlowList searchTerm={deferredQuery} />
    </div>
  );
}

// 选择指南：
// - 如果你需要更新状态 → useTransition
// - 如果你只需要延迟一个值 → useDeferredValue
// - useDeferredValue是useTransition的"值版本"
```

#### 2.2.3 实际应用场景

```tsx
import { useState, useDeferredValue, useMemo } from 'react';

function AutoComplete() {
  const [text, setText] = useState('');
  // 延迟版本 - 用于昂贵的搜索计算
  const deferredText = useDeferredValue(text);

  // 使用useMemo缓存搜索结果
  const suggestions = useMemo(() => {
    return getSuggestions(deferredText);
  }, [deferredText]);

  return (
    <div className="autocomplete">
      {/* 实时更新输入框 */}
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="输入搜索..."
        className="search-input"
      />

      {/* 使用延迟值显示建议 - 不会阻塞输入 */}
      <div className="suggestions">
        {suggestions.map(suggestion => (
          <SuggestionItem key={suggestion.id} suggestion={suggestion} />
        ))}
      </div>

      {/* 显示是否在延迟中 */}
      {text !== deferredText && (
        <div className="deferred-indicator">
          正在搜索: {deferredText}
        </div>
      )}
    </div>
  );
}
```

### 2.3 useSyncExternalStore

#### 2.3.1 外部状态订阅

useSyncExternalStore是React 18为**订阅外部数据源**而设计的Hook：

```tsx
import { useSyncExternalStore } from 'react';

// 外部状态存储（如Redux、Zustand、或其他全局状态）
const globalStore = {
  state: { count: 0, user: null },
  listeners: new Set(),

  getState() {
    return this.state;
  },

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  },

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.listeners.forEach(callback => callback());
  }
};

// 使用useSyncExternalStore订阅
function useStore(selector) {
  // selector: 可选，用于选择需要的状态片段
  const state = useSyncExternalStore(
    globalStore.subscribe.bind(globalStore),  // 订阅函数
    globalStore.getState.bind(globalStore),   // 服务端获取状态
    globalStore.getState.bind(globalStore)    // 客户端获取状态
  );

  // 如果提供了selector，只返回选择的部分
  return selector ? selector(state) : state;
}

// 组件中使用
function Counter() {
  const count = useStore(state => state.count);

  return (
    <div>
      <p>计数: {count}</p>
      <button onClick={() => globalStore.setState({ count: count + 1 })}>
        +1
      </button>
    </div>
  );
}
```

#### 2.3.2 SSR支持

useSyncExternalStore的第三个参数用于**服务端渲染**：

```tsx
import { useSyncExternalStore } from 'react';

// 外部状态
const store = {
  data: null,
  subscribe: (callback) => { /* ... */ },
  getSnapshot: () => store.data
};

function DataComponent() {
  const data = useSyncExternalStore(
    store.subscribe,
    // 客户端：返回当前状态
    () => store.getSnapshot(),
    // 服务端：返回初始状态（避免水合不匹配）
    () => null // 服务端始终返回null
  );

  if (data === null) {
    return <div>加载中...</div>;
  }

  return <div>{data.content}</div>;
}
```

#### 2.3.3 完整的SSR水合示例

```tsx
import { useSyncExternalStore } from 'react';

// 创建外部Store
function createStore(initialState) {
  let state = initialState;
  const listeners = new Set();

  return {
    getSnapshot() {
      return state;
    },
    subscribe(callback) {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    setState(newState) {
      state = { ...state, ...newState };
      listeners.forEach(l => l());
    }
  };
}

const store = createStore({ theme: 'light', user: null });

// 自定义Hook封装
function useStore(selector) {
  const state = useSyncExternalStore(
    store.subscribe,
    () => selector(store.getSnapshot()),
    () => selector({ theme: 'light', user: null }) // SSR初始值
  );
  return state;
}

// 使用组件
function ThemeToggle() {
  const theme = useStore(s => s.theme);

  return (
    <button
      onClick={() => store.setState({
        theme: theme === 'light' ? 'dark' : 'light'
      })}
    >
      当前主题: {theme}
    </button>
  );
}
```

---

## 三、Suspense增强

### 3.1 服务端Suspense

#### 3.1.1 Streaming HTML机制

React 18的Suspense在服务端实现了真正的流式渲染：

```tsx
// 服务端 - 流式HTML生成
import { renderToPipeableStream } from 'react-dom/server';
import { Suspense } from 'react';

// 加载组件
function Comments() {
  // use() 是React 18.3+的API
  // 用于在组件内await数据
  const comments = use(fetchComments());

  return (
    <div className="comments">
      {comments.map(c => (
        <div key={c.id} className="comment">
          <strong>{c.author}</strong>
          <p>{c.content}</p>
        </div>
      ))}
    </div>
  );
}

// 加载中组件
function CommentsLoading() {
  return <div className="loading">加载评论中...</div>;
}

// 服务端渲染
function handleRequest(req, res) {
  const stream = renderToPipeableStream(<App />, {
    // Shell必须完全渲染
    shellHtml: '<!DOCTYPE html><html><head></head><body><div id="root">',

    onShellReady() {
      // Shell准备好后开始流式传输
      stream.pipe(res);
    },

    onError(error) {
      console.error('渲染错误:', error);
    }
  });
}
```

#### 3.1.2 加载UI策略

```tsx
function App() {
  return (
    <html>
      <head>
        <title>React 18 流式SSR</title>
        {/* 关键CSS内联，避免FOUC */}
        <style>{`
          body { font-family: system-ui, sans-serif; }
          .loading {
            padding: 1rem;
            background: #f0f0f0;
            animation: pulse 1.5s infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </head>
      <body>
        <div id="root">
          {/*
            Suspense会先渲染fallback
            数据加载后流式替换
          */}
          <Suspense fallback={
            <div className="loading">加载中...</div>
          }>
            <MainContent />
          </Suspense>
        </div>

        {/*
          脚本注入
          在所有流式内容完成后执行
        */}
        <script src="/client.js"></script>
      </body>
    </html>
  );
}
```

### 3.2 客户端Suspense

#### 3.2.1 React.lazy与Suspense

```tsx
import { Suspense, lazy } from 'react';

// React.lazy用于代码分割
// 只有在实际需要时才加载组件
const Dashboard = lazy(() => import('./Dashboard'));
const Settings = lazy(() => import('./Settings'));
const Profile = lazy(() => import('./Profile'));

function App() {
  const [route, setRoute] = useState('dashboard');

  return (
    <div>
      <nav>
        <button onClick={() => setRoute('dashboard')}>仪表盘</button>
        <button onClick={() => setRoute('settings')}>设置</button>
        <button onClick={() => setRoute('profile')}>个人资料</button>
      </nav>

      {/*
        Suspense包裹懒加载组件
        fallback显示加载状态
      */}
      <Suspense fallback={<LoadingSpinner />}>
        {route === 'dashboard' && <Dashboard />}
        {route === 'settings' && <Settings />}
        {route === 'profile' && <Profile />}
      </Suspense>
    </div>
  );
}

// 自定义加载组件
function LoadingSpinner() {
  return (
    <div className="loading-container">
      <div className="spinner" />
      <p>加载中，请稍候...</p>
    </div>
  );
}
```

#### 3.2.2 多个Suspense边界

```tsx
function ComplexApp() {
  return (
    <>
      {/* 导航栏 - 不需要懒加载，优先级最高 */}
      <Navigation />

      {/* 主内容区 - 可以懒加载 */}
      <Suspense fallback={<ContentSkeleton />}>
        <MainContent />
      </Suspense>

      {/* 侧边栏 - 懒加载 */}
      <Suspense fallback={<SidebarSkeleton />}>
        <Sidebar />
      </Suspense>

      {/* 推荐内容 - 最后加载 */}
      <Suspense fallback={<RecommendationsSkeleton />}>
        <Recommendations />
      </Suspense>
    </>
  );
}
```

#### 3.2.3 错误边界

Suspense的Error Handling需要配合Error Boundary：

```tsx
import { Suspense } from 'react';
import ErrorBoundary from './ErrorBoundary';

function App() {
  return (
    <ErrorBoundary fallback={<ErrorMessage />}>
      <Suspense fallback={<PageLoading />}>
        <MainContent />
      </Suspense>
    </ErrorBoundary>
  );
}

// 自定义错误组件
function ErrorMessage() {
  return (
    <div className="error-container">
      <h2>出错了</h2>
      <p>加载内容时发生错误</p>
      <button onClick={() => window.location.reload()}>
        重新加载
      </button>
    </div>
  );
}
```

---

## 四、迁移指南

### 4.1 Hydration变化

#### 4.1.1 水合不匹配警告变化

React 18修复了多个水合相关问题：

```tsx
// React 17：文本内容不匹配会导致整个树错误
// React 18：只警告不匹配的部分

// 常见场景：日期格式化
function DateDisplay() {
  const date = new Date();

  return (
    <div>
      {/* 服务端和客户端可能因为时区不同而产生不同结果 */}
      <span>{date.toLocaleDateString()}</span>
    </div>
  );
}

// React 18解决方案：使用suppressHydrationWarning
function DateDisplayFixed() {
  const [date, setDate] = useState(() => new Date());

  return (
    <div>
      <span suppressHydrationWarning>
        {date.toLocaleDateString()}
      </span>
    </div>
  );
}
```

#### 4.1.2 新的水合API

```tsx
// React 17
import { hydrate } from 'react-dom';
hydrate(<App />, document.getElementById('root'));

// React 18 - 使用hydrateRoot
import { hydrateRoot } from 'react-dom/client';
hydrateRoot(document.getElementById('root'), <App />);

// React 18支持并发渲染
// hydrateRoot会自动选择最优的水合策略
```

### 4.2 Strict Mode变化

React 18的Strict Mode会**双重调用渲染**用于检测副作用：

```tsx
// React 18 Strict Mode行为
import { StrictMode } from 'react';

function App() {
  return (
    <StrictMode>
      {/*
        StrictMode会：
        1. 挂载组件
        2. 卸载组件
        3. 重新挂载组件

        用于检测：
        - 副作用清理问题
        - 过时的ref使用
        - 缺少cleanup的effect
      */}
      <Dashboard />
    </StrictMode>
  );
}

// 开发环境会看到组件渲染两次
// 生产环境不受影响
```

### 4.3 Props变化

#### 4.3.1 新增Props

```tsx
// onScroll事件现在可以在scrollable div上使用
function ScrollableList() {
  return (
    <div
      onScroll={(e) => {
        // React 18支持在div上使用onScroll
        console.log('滚动位置:', e.currentTarget.scrollTop);
      }}
    >
      {/* 内容 */}
    </div>
  );
}
```

#### 4.3.2 弃用的API

```tsx
// 以下API在React 18中仍然可用，但已弃用：
// - ReactDOM.render
// - ReactDOM.findDOMNode
// - ReactDOM.unmountComponentAtNode

// 迁移到React 18 API：
// render → hydrateRoot
// findDOMNode → ref
// unmountComponentAtNode → root.unmount()
```

### 4.4 迁移检查清单

```tsx
// 迁移检查清单
const migrationChecklist = {
  // 1. 更新React和ReactDOM
  'package.json': {
    react: '^18.0.0',
    'react-dom': '^18.0.0'
  },

  // 2. 替换hydrate为hydrateRoot
  before: "import { hydrate } from 'react-dom';",
  after: "import { hydrateRoot } from 'react-dom/client';",

  // 3. 检查Suspense边界
  checkPoints: [
    '所有异步数据加载是否被Suspense包裹',
    'fallback组件是否正确定义',
    '是否有缺失的Suspense边界导致的问题'
  ],

  // 4. 检查setTimeout中的setState
  // React 18会自动批处理，检查是否有预期外的行为变化

  // 5. 更新第三方库
  // 确保库支持React 18
};
```

---

## 五、面试高频问题

### Q1: React 18对SSR做了哪些改进？

**参考答案**：

React 18对SSR进行了革命性的改进，主要包括三个方面：

**1. 流式SSR（Streaming SSR）**

React 18使用`renderToPipeableStream`替代了`renderToNodeStream`，支持真正的流式渲染。传统SSR必须在所有数据加载完成后才能返回HTML，而流式SSR可以先返回shell HTML，然后异步加载数据，加载完成后再流式推送实际内容。这大大减少了TTFB（Time To First Byte）。

**2. 选择性水合（Selective Hydration）**

React 18将水合过程与Suspense边界对齐，实现了选择性水合。传统水合必须等整个应用加载完成才能交互，而选择性水合让用户可以立即与部分内容交互，即使其他区域还在加载。这显著提升了首屏可交互时间（TTI）。

**3. 并行水合**

React 18支持并行水合多个Suspense边界，并且会根据用户交互优先级调整水合顺序。用户点击的区域会优先完成水合，确保即时响应。

```tsx
// 流式SSR示例
renderToPipeableStream(<App />, {
  onShellReady() {
    // shell准备好后立即开始流式传输
    pipe(res);
  }
});
```

### Q2: 什么是自动批处理？解决了什么问题？

**参考答案**：

自动批处理（Automatic Batching）是React 18的核心特性，它将多个状态更新**合并为一次渲染**，从而提升性能。

**解决的问题**：

在React 17及之前，只有React事件处理函数中的setState会自动批处理。在setTimeout、Promise、fetch回调等异步操作中的setState会**各自触发一次独立的渲染**。

```tsx
// React 17的问题
useEffect(() => {
  fetchData().then(data => {
    setData(data);      // 渲染1
    setLoading(false);  // 渲染2
    setError(null);      // 渲染3
    // 触发了3次独立的渲染！
  });
}, []);

// React 18的解决
useEffect(() => {
  fetchData().then(data => {
    setData(data);      // 被批处理
    setLoading(false);  // 被批处理
    setError(null);      // 被批处理
    // 只触发1次渲染！
  });
}, []);
```

**性能提升**：

- 减少不必要的渲染次数
- 降低CPU负担
- 提升动画和交互的流畅度
- 特别是处理多个数据源的更新时效果显著

### Q3: useTransition和useDeferredValue有什么区别？

**参考答案**：

两者都是用于处理非紧急更新的并发特性，但使用场景不同：

**useTransition**：用于**状态更新函数**

```tsx
const [isPending, startTransition] = useTransition();

function handleFilterChange(value) {
  // 状态更新本身在transition中
  startTransition(() => {
    setFilter(value);  // 非紧急
    setResults(filterData(value));  // 非紧急
  });
}
```

**useDeferredValue**：用于**延迟某个值**

```tsx
const [query, setQuery] = useState('');
const deferredQuery = useDeferredValue(query);

// 搜索使用延迟值，不会阻塞输入
const results = useMemo(() => search(deferredQuery), [deferredQuery]);
```

**选择指南**：

| 场景 | 推荐API |
|------|---------|
| 更新多个状态 | useTransition |
| 延迟某个派生值 | useDeferredValue |
| 需要isPending状态 | useTransition |
| 不想改变组件签名 | useDeferredValue |
| 处理异步操作 | useTransition |

**共同点**：

- 都是非紧急更新
- 都可以被打断
- 都使用并发渲染机制

### Q4: Suspense在服务端和客户端有什么区别？

**参考答案**：

Suspense在服务端和客户端有本质的不同：

**服务端Suspense - 流式HTML**

```tsx
// 服务端：生成流式HTML
renderToPipeableStream(<App />, {
  onShellReady() {
    // 1. 先发送shell HTML（Suspense显示fallback）
    // 2. 异步加载数据
    // 3. 流式发送实际内容（替换fallback）
    // 4. 注入脚本激活组件
  }
});
```

**客户端Suspense - 代码分割和懒加载**

```tsx
// 客户端：懒加载组件
const Component = lazy(() => import('./Component'));

<Suspense fallback={<Loading />}>
  <Component />
</Suspense>

// 行为：
// 1. 组件代码未加载时显示fallback
// 2. 加载完成后替换为实际组件
// 3. 没有流式传输，是整块替换
```

**核心区别**：

| 方面 | 服务端Suspense | 客户端Suspense |
|------|---------------|----------------|
| **目的** | 流式传输HTML | 代码分割懒加载 |
| **时机** | 服务端渲染时 | 运行时 |
| **内容** | 实际组件替换fallback | 懒加载模块替换 |
| **优化** | 减少TTFB | 减少初始包体积 |
| **数据** | async data fetch | dynamic import |

**实际应用**：

```tsx
// 服务端和客户端Suspense可以配合使用
function App() {
  return (
    // 服务端：流式渲染
    <Suspense fallback={<PageSkeleton />}>
      {/* 客户端：懒加载 */}
      <Suspense fallback={<SectionLoading />}>
        <LazyComponent />
      </Suspense>
    </Suspense>
  );
}
```

---

## 总结

React 18的SSR新特性代表了React在服务端渲染领域的重大突破：

1. **流式SSR** 让首屏渲染更快，无需等待所有数据加载完成
2. **选择性水合** 让用户可以更早与页面交互
3. **自动批处理** 减少了不必要的渲染，提升整体性能
4. **并发特性**（useTransition、useDeferredValue、useSyncExternalStore）为开发者提供了精细控制渲染优先级的工具

这些特性共同构成了React 18的并发渲染架构，为构建高性能Web应用奠定了坚实基础。
