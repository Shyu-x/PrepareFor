# 第2卷-框架生态

---

## 第1章 React深入

---

### 4.1 React性能优化

#### 4.1.1 渲染优化

#### 4.1.2 Reactmemo优化

**参考答案：**

```javascript
// React.memo - 记忆化组件
import { memo } from 'react';

// 基本用法
const MyComponent = memo(function MyComponent({ name, onClick }) {
  console.log('Rendering:', name);
  return <button onClick={onClick}>{name}</button>;
});

// 等价于
const MyComponent = React.memo(({ name, onClick }) => {
  return <button onClick={onClick}>{name}</button>;
});

// 自定义比较函数
const MyComponentWithCustomCompare = memo(
  function MyComponent({ name, onClick }) {
    return <button onClick={onClick}>{name}</button>;
  },
  (prevProps, nextProps) => {
    // 返回 true 表示不需要重渲染
    return prevProps.name === nextProps.name;
  }
);

// 场景 1：防止父组件重渲染导致子组件不必要渲染
function Parent() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('John');

  // 问题：count 变化会导致 Child 重渲染
  // 解决：使用 React.memo
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
      <Child name={name} />
    </div>
  );
}

const Child = memo(function Child({ name }) {
  console.log('Child rendered');
  return <div>{name}</div>;
});

// 场景 2：配合 useMemo/useCallback
function ParentOptimized() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('John');

  // 稳定函数引用
  const handleClick = useCallback(() => {
    console.log('Clicked');
  }, []);

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
      <ChildOptimized name={name} onClick={handleClick} />
    </div>
  );
}

const ChildOptimized = memo(function ChildOptimized({ name, onClick }) {
  console.log('ChildOptimized rendered');
  return <button onClick={onClick}>{name}</button>;
});
```

#### 4.1.2 useMemo与useCallback优化策略

**参考答案：**

```javascript
// useMemo 和 useCallback 的最佳实践

// 何时使用 useMemo
function WhenUseMemo() {
  const [items, setItems] = useState([]);

  // 应该使用：复杂计算
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  // 应该使用：派生状态
  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price, 0);
  }, [items]);

  // 应该使用：避免对象引用变化
  const config = useMemo(() => ({
    theme: 'dark',
    maxItems: 10
  }), []);

  // 不需要使用：简单计算
  const doubled = useMemo(() => count * 2, [count]); // count * 2 很简单，不需要 memo

  return <div>{sortedItems}</div>;
}

// 何时使用 useCallback
function WhenUseCallback() {
  const [count, setCount] = useState(0);

  // 应该使用：传递给 memo 组件的回调
  const handleClick = useCallback(() => {
    console.log('Clicked');
  }, []);

  return <MemoChild onClick={handleClick} />;
}

const MemoChild = memo(({ onClick }) => {
  return <button onClick={onClick}>Click</button>;
});

// 配合 useRef 解决闭包问题
function UseRefSolution() {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);

  // 保持 ref 同步
  useEffect(() => {
    countRef.current = count;
  }, [count]);

  // 使用 ref 获取最新值
  const handleClick = useCallback(() => {
    console.log('Current count:', countRef.current);
  }, []);

  return <button onClick={handleClick}>{count}</button>;
}

// 过度使用的反模式
function OveruseAntiPattern() {
  const [count, setCount] = useState(0);

  // 过度使用：每个值都用 useMemo
  const memoizedCount = useMemo(() => count, [count]);

  // 过度使用：每个函数都用 useCallback
  const increment = useCallback(() => setCount(c => c + 1), []);

  return (
    <div>
      <p>{memoizedCount}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}
```

#### 4.1.3 虚拟列表优化

**参考答案：**

```javascript
// 虚拟列表实现
import { useState, useCallback, memo } from 'react';

// 简单虚拟列表
function VirtualList({ items, itemHeight = 50 }) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerHeight = 500;

  // 计算可见范围
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight)
  );

  // 渲染可见项
  const visibleItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    visibleItems.push(
      <div
        key={items[i].id}
        style={{
          position: 'absolute',
          top: i * itemHeight,
          height: itemHeight,
          width: '100%'
        }}
      >
        {items[i].content}
      </div>
    );
  }

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return (
    <div
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItems}
      </div>
    </div>
  );
}

// 使用 react-window
import { FixedSizeList, VariableSizeList } from 'react-window';

// 固定高度列表
function FixedHeightList({ items }) {
  const Row = useCallback(({ index, style }) => {
    return (
      <div style={style}>
        {items[index].name}
      </div>
    );
  }, [items]);

  return (
    <FixedSizeList
      height={500}
      width={300}
      itemCount={items.length}
      itemSize={50}
    >
      {Row}
    </FixedSizeList>
  );
}

// 可变高度列表
function VariableHeightList({ items }) {
  const getItemSize = useCallback((index) => {
    return items[index].size || 50;
  }, [items]);

  const Row = useCallback(({ index, style }) => {
    return (
      <div style={style}>
        {items[index].content}
      </div>
    );
  }, [items]);

  return (
    <VariableSizeList
      height={500}
      width={300}
      itemCount={items.length}
      itemSize={getItemSize}
    >
      {Row}
    </VariableSizeList>
  );
}

// react-virtualized
import { List, AutoSizer } from 'react-virtualized';

function VirtualizedList({ items }) {
  return (
    <AutoSizer>
      {({ height, width }) => (
        <List
          height={height}
          width={width}
          rowCount={items.length}
          rowHeight={50}
          rowRenderer={({ index, key, style }) => (
            <div key={key} style={style}>
              {items[index].name}
            </div>
          )}
        />
      )}
    </AutoSizer>
  );
}
```

---

#### 4.2.1 代码分割

#### 4.2.1 Reactlazy与Suspense

**参考答案：**

```javascript
// React.lazy 和 Suspense 实现代码分割
import { lazy, Suspense } from 'react';

// 懒加载组件
const LazyComponent = lazy(() => import('./HeavyComponent'));

// 带命名的导出
const LazyNamedExport = lazy(() =>
  import('./HeavyComponent').then(module => ({ default: module.HeavyComponent }))
);

// 使用 Suspense
function App() {
  return (
    <Suspense fallback={<Loading />}>
      <LazyComponent />
    </Suspense>
  );
}

function Loading() {
  return <div>Loading...</div>;
}

// Suspense 多个懒加载组件
function MultiLazy() {
  return (
    <div>
      <Suspense fallback={<Loading />}>
        <LazyComponent1 />
        <LazyComponent2 />
      </Suspense>
    </div>
  );
}

// Suspense 边界
function SuspenseBoundary() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>
        <LazyComponent />
      </Suspense>
    </ErrorBoundary>
  );
}

// Error Boundary
import { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong</div>;
    }

    return this.props.children;
  }
}

// 路由级别的代码分割
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
```

#### 4.2.2 预加载和预获取

**参考答案：**

```javascript
// 预加载组件
function PreloadExample() {
  const [show, setShow] = useState(false);

  // 预加载函数
  const preload = () => {
    import('./HeavyComponent');
  };

  return (
    <div>
      <button onClick={preload}>Preload</button>
      <button onClick={() => setShow(true)}>Show</button>
      {show && (
        <Suspense fallback={<Loading />}>
          <HeavyComponent />
        </Suspense>
      )}
    </div>
  );
}

// 鼠标悬停预加载
function HoverPreload() {
  return (
    <a
      href="/dashboard"
      onMouseEnter={() => {
        import('./pages/Dashboard');
      }}
    >
      Dashboard
    </a>
  );
}

// 基于路由的预加载
import { useNavigate } from 'react-router-dom';

function NavigationPreload() {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    // 预加载目标页面
    import(`./pages/${path}`);
    // 导航
    navigate(path);
  };

  return (
    <button onClick={() => handleNavigation('Dashboard')}>
      Go to Dashboard
    </button>
  );
}

// 基于可见性的预加载
import { useInView } from 'react-intersection-observer';

function VisiblePreload() {
  const { ref, inView } = useInView({
    threshold: 0
  });

  // 当元素可见时加载
  const LazyComponent = useMemo(() => {
    if (inView) {
      return lazy(() => import('./HeavyComponent'));
    }
    return null;
  }, [inView]);

  return (
    <div ref={ref}>
      <Suspense fallback={<Loading />}>
        {LazyComponent && <LazyComponent />}
      </Suspense>
    </div>
  );
}
```

---

### 4.3 其他性能优化技巧

#### 4.3.1 避免不必要的渲染

**参考答案：**

```javascript
// 避免不必要的渲染

// 1. 合理拆分组件
function BadExample() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');

  // 问题：name 输入会导致整个组件重渲染
  // 包括 count 相关的 UI
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <ExpensivePart />
    </div>
  );
}

// 优化：拆分组件
function GoodExample() {
  return (
    <div>
      <Counter />
      <NameInput />
      <ExpensivePart />
    </div>
  );
}

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  );
}

function NameInput() {
  const [name, setName] = useState('');
  return (
    <input value={name} onChange={e => setName(e.target.value)} />
  );
}

// 2. 使用 CSS 动画替代 JS 动画
function CSSAnimation() {
  return (
    <div className="fade-in">
      Content
    </div>
  );
}

// 3. 避免在渲染中创建新对象
function AvoidNewObjects() {
  const [query, setQuery] = useState('');

  // 问题：每次渲染都创建新对象
  const options = {
    threshold: 0.5,
    rootMargin: '0px'
  };

  // 解决：使用 useMemo
  const optionsMemo = useMemo(() => ({
    threshold: 0.5,
    rootMargin: '0px'
  }), []);

  // 4. 列表渲染优化
  function ListOptimization() {
    const [items, setItems] = useState([]);

    // 在 render 中直接 map
    return (
      <ul>
        {items.map(item => (
          <ListItem key={item.id} item={item} />
        ))}
      </ul>
    );
  }

  const ListItem = memo(function ListItem({ item }) {
    return <li>{item.name}</li>;
  });
}
```

#### 4.3.2 Web Vitals 优化

**参考答案：**

```javascript
// Web Vitals 优化

// LCP (Largest Contentful Paint) 优化
function LCPOptimization() {
  // 1. 使用 content-visibility
  // CSS: content-visibility: auto;

  // 2. 优化图片
  // <img loading="eager" fetchpriority="high" />

  // 3. 预加载关键资源
  // <link rel="preload" as="image" href="hero.jpg" />

  // 4. 使用 CDN
}

// FID (First Input Delay) / INP (Interaction to Next Paint) 优化
function FIDOptimization() {
  // 1. 减少 JS 执行时间
  // - 代码分割
  // - 延迟加载非关键代码

  // 2. 分解长任务
  function splitTask() {
    // 原始
    longTask();

    // 优化后
    function* taskGenerator() {
      for (const item of items) {
        yield processItem(item);
      }
    }

    runGenerator(taskGenerator());
  }

  // 3. 使用 requestIdleCallback
  function idleTask() {
    requestIdleCallback(() => {
      // 不紧急的任务
    });
  }
}

// CLS (Cumulative Layout Shift) 优化
function CLSOptimization() {
  // 1. 为图片和视频指定尺寸
  // <img src="img.jpg" width="800" height="600" />

  // 2. 预留广告位
  // <div style="min-height: 250px;"></div>

  // 3. 使用 font-display: optional 或 preload 字体
  // @font-face {
  //   font-display: optional;
  // }

  // 4. 避免动态插入内容
  // 不推荐
  document.body.insertBefore(newDiv, existingDiv);

  // 推荐：使用固定高度的容器
  return (
    <div style={{ minHeight: '100px' }}>
      {showContent && <Content />}
    </div>
  );
}
```

---

