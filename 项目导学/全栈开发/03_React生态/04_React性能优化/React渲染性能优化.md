# React渲染性能优化

## 目录

1. [React渲染机制](#1-react渲染机制)
2. [组件优化](#2-组件优化)
3. [列表优化](#3-列表优化)
4. [状态管理优化](#4-状态管理优化)
5. [性能监控](#5-性能监控)
6. [高级优化技巧](#6-高级优化技巧)
7. [面试高频问题](#7-面试高频问题)

---

## 1. React渲染机制

### 1.1 React渲染流程

React的渲染流程是一个复杂但高效的过程：

```
┌─────────────────────────────────────────────────────────────────────┐
│                       React渲染流程                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. 状态变化                                                       │
│     this.setState() / useState() / props变化                         │
│                                                                     │
│  2. 组件重新渲染                                                   │
│     render() / 函数组件执行                                         │
│                                                                     │
│  3. 虚拟DOM对比（Reconciliation）                                    │
│     ┌──────────────────────────────────────────────────────┐       │
│     │                                                       │       │
│     │   旧虚拟DOM          VS         新虚拟DOM             │       │
│     │   <div>                →         <div>               │       │
│     │     <p>                           <p>               │       │
│     │       "Hello"                      "Hello World"    │       │
│     │     </p>                          </p>              │       │
│     │   </div>                                       </div> │       │
│     │                                                       │       │
│     └──────────────────────────────────────────────────────┘       │
│                                                                     │
│  4. 差异计算（Diffing）                                            │
│     - Key对比：识别列表项                                           │
│     - 类型对比：检测组件类型变化                                      │
│     - 属性对比：检测属性变化                                        │
│                                                                     │
│  5. 更新真实DOM                                                    │
│     只更新变化的节点                                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 React 18并发渲染

React 18引入了并发模式，提供了更好的用户体验：

```javascript
// React 18并发特性

// 1. 自动批处理
// React 18自动批处理所有状态更新，包括Promise、setTimeout等
function AutomaticBatching() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);

  const handleClick = () => {
    // 在React 18中，这些更新会被批量处理
    fetch('/api/data')
      .then(res => res.json())
      .then(data => {
        setCount(data.count);  // 批处理
        setFlag(data.flag);     // 批处理
      });
  };

  return <button onClick={handleClick}>更新</button>;
}

// 2. useTransition
// 标记非紧急更新
import { useState, useTransition } from 'react';

function SearchWithTransition() {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleChange = (e) => {
    const value = e.target.value;
    setInput(value);

    // startTransition内的更新被标记为非紧急
    startTransition(() => {
      setQuery(value);
    });
  };

  return (
    <div>
      <input value={input} onChange={handleChange} />
      {isPending ? <Spinner /> : <Results query={query} />}
    </div>
  );
}

// 3. useDeferredValue
// 延迟更新非关键值
import { useState, useDeferredValue } from 'react';

function SearchWithDeferred() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  const isStale = query !== deferredQuery;

  return (
    <div style={{ opacity: isStale ? 0.5 : 1 }}>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <HeavyList query={deferredQuery} />
    </div>
  );
}

// 4. Suspense
// 流式SSR支持
import { Suspense } from 'react';

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <AsyncContent />
    </Suspense>
  );
}
```

---

## 2. 组件优化

### 2.1 React.memo深度使用

React.memo是防止不必要的重渲染的第一道防线：

```javascript
import { memo, useMemo, useCallback } from 'react';

// 1. 基础React.memo
const MemoizedComponent = memo(function MyComponent({ title, content }) {
  // 只有title或content变化时才会重新渲染
  return (
    <div>
      <h1>{title}</h1>
      <p>{content}</p>
    </div>
  );
});

// 2. 自定义比较函数
const OptimizedComponent = memo(
  function MyComponent({ user, posts, onClick }) {
    return (
      <div>
        <h2>{user.name}</h2>
        <ul>
          {posts.map(post => (
            <li key={post.id} onClick={() => onClick(post.id)}>
              {post.title}
            </li>
          ))}
        </ul>
      </div>
    );
  },
  // 自定义比较逻辑
  (prevProps, nextProps) => {
    // 返回true表示不需要重新渲染
    return (
      prevProps.user.id === nextProps.user.id &&
      prevProps.posts.length === nextProps.posts.length &&
      prevProps.onClick === nextProps.onClick
    );
  }
);

// 3. 常见问题与解决
function CommonPitfalls() {
  const [count, setCount] = useState(0);

  // 问题1：每次渲染都创建新对象/数组
  const BadComponent = memo(({ data }) => {
    // data是每次渲染的新引用，会导致重渲染
    return <div>{data.map(d => d.name).join(',')}</div>;
  });

  // 解决：使用useMemo缓存数据
  const GoodComponent = memo(({ data }) => {
    const processedData = useMemo(() => {
      return data.map(d => d.name).join(',');
    }, [data]);

    return <div>{processedData}</div>;
  });

  // 问题2：内联函数作为props
  const BadParent = () => (
    <MemoizedComponent
      onClick={() => handleClick()} // 每次渲染都是新函数
    />
  );

  // 解决：使用useCallback
  const GoodParent = () => {
    const handleClick = useCallback(() => {
      // 处理点击
    }, []);

    return <MemoizedComponent onClick={handleClick} />;
  };

  return <BadParent />;
}
```

### 2.2 useMemo与useCallback

这两个Hook是React性能优化的核心工具：

```javascript
import { useMemo, useCallback, useState } from 'react';

// 1. useMemo缓存计算结果
function UseMemoExamples() {
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState('');

  // 缓存过滤后的列表
  const filteredList = useMemo(() => {
    console.log('计算过滤列表'); // 观察是否重新计算
    return list.filter(item =>
      item.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [list, filter]);

  // 缓存排序后的列表
  const sortedList = useMemo(() => {
    return [...filteredList].sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredList]);

  // 缓存派生状态
  const stats = useMemo(() => ({
    count: filteredList.length,
    first: filteredList[0]?.name,
    last: filteredList[filteredList.length - 1]?.name,
  }), [filteredList]);

  // 缓存复杂配置
  const config = useMemo(() => ({
    pageSize: 20,
    maxItems: 100,
    timeout: 5000,
    retryCount: 3,
  }), []);

  return (
    <div>
      <List items={sortedList} config={config} stats={stats} />
    </div>
  );
}

// 2. useCallback缓存函数引用
function UseCallbackExamples() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);

  // 基础用法
  const increment = useCallback(() => {
    setCount(c => c + 1);
  }, []);

  // 带依赖的回调
  const addItem = useCallback((newItem) => {
    setItems(prev => [...prev, newItem]);
  }, []);

  // 回调中使用多个状态
  const handleSubmit = useCallback((formData) => {
    console.log('Submit:', formData, count);
    addItem({ ...formData, count });
  }, [count, addItem]);

  // 在useEffect中使用回调
  useEffect(() => {
    const timer = setInterval(() => {
      console.log('Timer:', count);
    }, 1000);

    return () => clearInterval(timer);
  }, [count]); // count变化时重新设置定时器

  return (
    <div>
      <button onClick={increment}>Count: {count}</button>
      <button onClick={() => addItem({ name: 'New' })}>Add Item</button>
      <Form onSubmit={handleSubmit} />
    </div>
  );
}

// 3. 避免过度使用
function AvoidOveruse() {
  const [count, setCount] = useState(0);

  // ❌ 过度使用：简单计算不需要useMemo
  const doubled = useMemo(() => count * 2, [count]);
  // ✅ 直接计算即可
  const tripled = count * 3;

  // ❌ 过度使用：不会传递给子组件的回调不需要useCallback
  const handleClick1 = useCallback(() => {
    console.log('clicked');
  }, []);
  // ✅ 直接定义
  const handleClick2 = () => {
    console.log('clicked');
  };

  // ✅ 正确使用场景
  const MemoizedChild = memo(({ onClick }) => (
    <button onClick={onClick}>点击</button>
  ));

  const handleClick3 = useCallback(() => {
    console.log('child clicked');
  }, []);

  return (
    <div>
      <MemoizedChild onClick={handleClick3} />
      <button onClick={handleClick2}>简单点击</button>
    </div>
  );
}
```

### 2.3 组件拆分策略

合理的组件拆分可以显著提升性能：

```javascript
import { memo, useState } from 'react';

// 1. 分离静态和动态部分
function SplitStaticAndDynamic() {
  // ❌ 混合在一起，任何状态变化都会导致整个组件重渲染
  const BadComponent = ({ title, data }) => {
    const [filter, setFilter] = useState('');

    return (
      <div>
        <h1>{title}</h1> {/* 静态 */}
        <ExpensiveTree data={data} /> {/* 静态 */}
        <FilterInput value={filter} onChange={setFilter} /> {/* 动态 */}
      </div>
    );
  };

  // ✅ 分离静态和动态
  const StaticPart = memo(({ title, data }) => (
    <div>
      <h1>{title}</h1>
      <ExpensiveTree data={data} />
    </div>
  ));

  const DynamicPart = memo(({ filter, onFilterChange }) => (
    <FilterInput value={filter} onChange={onFilterChange} />
  ));

  const GoodComponent = ({ title, data }) => {
    const [filter, setFilter] = useState('');

    return (
      <div>
        <StaticPart title={title} data={data} />
        <DynamicPart filter={filter} onFilterChange={setFilter} />
      </div>
    );
  };
}

// 2. 提取纯渲染组件
function ExtractPureComponents() {
  // ❌ 大型组件
  const LargeComponent = ({ user, posts, settings, theme, onAction }) => {
    return (
      <div className={theme}>
        <header>
          <h1>{user.name}</h1>
          <Avatar src={user.avatar} />
        </header>

        <nav>
          {settings.map(s => (
            <NavItem key={s.id} {...s} />
          ))}
        </nav>

        <main>
          {posts.map(post => (
            <PostItem key={post.id} post={post} onAction={onAction} />
          ))}
        </main>
      </div>
    );
  };

  // ✅ 提取纯组件
  const Header = memo(({ name, avatar }) => (
    <header>
      <h1>{name}</h1>
      <Avatar src={avatar} />
    </header>
  ));

  const Nav = memo(({ items }) => (
    <nav>
      {items.map(item => (
        <NavItem key={item.id} {...item} />
      ))}
    </nav>
  ));

  const PostList = memo(({ posts, onAction }) => (
    <main>
      {posts.map(post => (
        <PostItem key={post.id} post={post} onAction={onAction} />
      ))}
    </main>
  ));

  const OptimizedComponent = ({ user, posts, settings, theme, onAction }) => (
    <div className={theme}>
      <Header name={user.name} avatar={user.avatar} />
      <Nav items={settings} />
      <PostList posts={posts} onAction={onAction} />
    </div>
  );
}

// 3. 使用children隔离
function UseChildrenIsolation() {
  const Header = memo(({ children }) => (
    <header className="header">
      {children}
    </header>
  ));

  const Content = memo(({ children }) => (
    <main className="content">
      {children}
    </main>
  ));

  // Header和Content不会因为Footer的状态变化而重渲染
  const PageLayout = ({ header, content, footer }) => (
    <div>
      <Header>{header}</Header>
      <Content>{content}</Content>
      {footer}
    </div>
  );
}
```

---

## 3. 列表优化

### 3.1 虚拟列表

对于大量数据的列表，虚拟列表是性能优化的关键：

```javascript
import { memo, useState, useCallback, useRef, useEffect } from 'react';

// 1. 基础虚拟列表实现
function BasicVirtualList({ items, itemHeight, height }) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // 计算可见范围
  const visibleCount = Math.ceil(height / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 2, items.length);

  // 可见项
  const visibleItems = items.slice(startIndex, endIndex);

  // 滚动处理
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  // 滚动到指定索引
  const scrollToIndex = useCallback((index) => {
    if (containerRef.current) {
      containerRef.current.scrollTop = index * itemHeight;
    }
  }, [itemHeight]);

  return (
    <div
      ref={containerRef}
      style={{ height, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div style={{
          position: 'absolute',
          top: startIndex * itemHeight,
          left: 0,
          right: 0,
        }}>
          {visibleItems.map((item, index) => (
            <div
              key={item.id}
              style={{ height: itemHeight }}
            >
              {/* 列表项内容 */}
              <ListItem item={item} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 2. 优化的虚拟列表（带自动测量）
function DynamicHeightVirtualList({ items }) {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const containerRef = useRef(null);
  const itemHeights = useRef(new Map());

  // 测量项高度
  const measureItem = useCallback((index, element) => {
    if (element) {
      itemHeights.current.set(index, element.getBoundingClientRect().height);
    }
  }, []);

  // 计算滚动位置
  const getItemOffset = useCallback((index) => {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += itemHeights.current.get(i) || 50; // 默认高度
    }
    return offset;
  }, []);

  // 滚动处理
  const handleScroll = useCallback(() => {
    const scrollTop = containerRef.current?.scrollTop || 0;
    const containerHeight = containerRef.current?.clientHeight || 0;

    let currentOffset = 0;
    let start = 0;
    let end = items.length;

    for (let i = 0; i < items.length; i++) {
      const height = itemHeights.current.get(i) || 50;
      if (currentOffset + height > scrollTop) {
        start = Math.max(0, i - 5);
        break;
      }
      currentOffset += height;
    }

    currentOffset = getItemOffset(start);
    for (let i = start; i < items.length; i++) {
      const height = itemHeights.current.get(i) || 50;
      if (currentOffset > scrollTop + containerHeight) {
        end = Math.min(items.length, i + 5);
        break;
      }
      currentOffset += height;
    }

    setVisibleRange({ start, end });
  }, [items.length, getItemOffset]);

  return (
    <div
      ref={containerRef}
      style={{ height: 400, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: getItemOffset(items.length) }}>
        {items.slice(visibleRange.start, visibleRange.end).map((item, index) => (
          <div
            key={item.id}
            ref={(el) => measureItem(visibleRange.start + index, el)}
          >
            <ListItem item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}

// 3. 使用react-window
// npm install react-window
import { FixedSizeList, VariableSizeList } from 'react-window';

function VirtualizedWithLibrary() {
  // 固定高度列表
  const Row = memo(({ index, style }) => (
    <div style={style}>
      <ListItem item={items[index]} />
    </div>
  ));

  return (
    <FixedSizeList
      height={400}
      width={300}
      itemCount={items.length}
      itemSize={50}
      itemData={items}
    >
      {Row}
    </FixedSizeList>
  );
}
```

### 3.2 列表键和比较

列表优化的关键在于正确使用key和高效的比较：

```javascript
// 1. 正确使用Key
function CorrectKeyUsage() {
  const items = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' },
  ];

  // ✅ 好：使用唯一ID作为key
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );

  // ❌ 差：使用index作为key
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{item.name}</li> // index在数据变化时会改变
      ))}
    </ul>
  );
}

// 2. Key应该稳定且唯一
function StableKeyExample() {
  // ❌ 差：使用可能变化的字段
  const BadKey = ({ user }) => (
    <div key={user.email}>{user.name}</div> // email变化时key会变
  );

  // ✅ 好：使用稳定的唯一ID
  const GoodKey = ({ user }) => (
    <div key={user.id}>{user.name}</div> // ID是稳定的
  );
}

// 3. 列表操作优化
function ListOperations() {
  const [items, setItems] = useState([]);

  // 添加到列表开头 - 会导致所有项重渲染
  const addToStart = (item) => {
    setItems([item, ...items]);
  };

  // 添加到列表末尾 - 只渲染新项
  const addToEnd = (item) => {
    setItems([...items, item]);
  };

  // 删除项 - 只影响被删除项周围
  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  // 移动项 - 只影响移动的项
  const moveItem = (fromIndex, toIndex) => {
    const newItems = [...items];
    const [moved] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, moved);
    setItems(newItems);
  };

  // 更新项 - 只重渲染被更新的项
  const updateItem = (id, updates) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  };
}
```

---

## 4. 状态管理优化

### 4.1 状态结构优化

良好的状态结构可以减少不必要的重渲染：

```javascript
// 1. 状态分离
function StateSeparation() {
  // ❌ 差：所有状态放在一起
  const [state, setState] = useState({
    user: null,
    posts: [],
    comments: [],
    loading: false,
    error: null,
  });

  // ✅ 好：相关状态分离
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);

  // 或者使用useReducer管理复杂状态
  const reducer = (state, action) => {
    switch (action.type) {
      case 'SET_USER':
        return { ...state, user: action.payload };
      case 'SET_POSTS':
        return { ...state, posts: action.payload };
      case 'SET_LOADING':
        return { ...state, loading: action.payload };
      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(reducer, {
    user: null,
    posts: [],
    loading: false,
  });
}

// 2. 派生状态
function DerivedState() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('');

  // ❌ 差：存储派生状态
  const [filteredItems, setFilteredItems] = useState([]);

  useEffect(() => {
    setFilteredItems(items.filter(i => i.name.includes(filter)));
  }, [items, filter]);

  // ✅ 好：直接计算派生状态
  const filteredItems = useMemo(() => {
    return items.filter(item => item.name.includes(filter));
  }, [items, filter]);
}

// 3. 状态位置
function StateLocation() {
  // 问题：状态在父组件，但只有部分子组件需要
  const Parent = () => {
    const [state, setState] = useState('');

    return (
      <>
        <SiblingA /> {/* 不需要state */}
        <SiblingB state={state} onChange={setState} /> {/* 需要state */}
      </>
    );
  };

  // 解决：将状态移到真正需要的组件
  const Parent = () => (
    <>
      <SiblingA />
      <SiblingBWrapper />
    </>
  );

  const SiblingBWrapper = () => {
    const [state, setState] = useState('');
    return <SiblingB state={state} onChange={setState} />;
  };
}
```

### 4.2 Context优化

Context是React内置的状态共享方案，但需要谨慎使用：

```javascript
import { createContext, useContext, useState, useMemo, memo } from 'react';

// 1. 分离Context
// ❌ 差：一个Context包含太多东西
const AppContext = createContext();

const BadProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  const [notifications, setNotifications] = useState([]);

  const value = { user, setUser, theme, setTheme, notifications, setNotifications };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// ✅ 好：多个小Context
const UserContext = createContext();
const ThemeContext = createContext();
const NotificationsContext = createContext();

// 2. 使用useMemo优化Context值
const OptimizedProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');

  const userValue = useMemo(() => ({ user, setUser }), [user]);
  const themeValue = useMemo(() => ({ theme, setTheme }), [theme]);

  return (
    <UserContext.Provider value={userValue}>
      <ThemeContext.Provider value={themeValue}>
        {children}
      </ThemeContext.Provider>
    </UserContext.Provider>
  );
};

// 3. 使用useContextSelector
// npm install use-context-selector
import { useContextSelector } from 'use-context-selector';

const Component = () => {
  // 只订阅需要的状态
  const user = useContextSelector(UserContext, (value) => value.user);
  const setUser = useContextSelector(UserContext, (value) => value.setUser);

  // 或者使用解构（但会订阅整个Context）
  // const { user, setUser } = useContext(UserContext);

  return <div>{user?.name}</div>;
};
```

---

## 5. 性能监控

### 5.1 React Profiler

React DevTools Profiler是监控React性能的最佳工具：

```javascript
import { Profiler } from 'react';

// Profiler使用示例
function ProfilerExample() {
  const onRender = (
    id, // 组件ID
    phase, // 'mount' | 'update'
    actualDuration, // 实际渲染时间
    baseDuration, // 估计渲染时间
    startTime, // 开始时间
    commitTime, // 提交时间
    interactions // 交互集合
  ) => {
    // 上报到分析服务
    if (actualDuration > baseDuration) {
      console.warn(`${id} 渲染缓慢:`, {
        actualDuration: actualDuration.toFixed(2) + 'ms',
        baseDuration: baseDuration.toFixed(2) + 'ms',
        phase,
      });
    }
  };

  return (
    <Profiler id="App" onRender={onRender}>
      <App />
    </Profiler>
  );
}

// 完整性能监控组件
const PerformanceMonitor = ({ children }) => {
  const [metrics, setMetrics] = useState([]);

  const onRender = useCallback((id, phase, actualDuration, baseDuration) => {
    setMetrics(prev => [
      ...prev.slice(-99), // 保留最近100条记录
      {
        id,
        phase,
        actualDuration,
        baseDuration,
        overhead: actualDuration - baseDuration,
        timestamp: Date.now(),
      }
    ]);
  }, []);

  return (
    <>
      <Profiler id="App" onRender={onRender}>
        {children}
      </Profiler>
      {process.env.NODE_ENV === 'development' && (
        <DevTools metrics={metrics} />
      )}
    </>
  );
};
```

### 5.2 自定义性能Hook

```javascript
import { useRef, useEffect } from 'react';

// 1. 渲染时间监控
function useRenderTime(componentName) {
  const lastRenderTime = useRef(null);

  useEffect(() => {
    const now = performance.now();
    if (lastRenderTime.current !== null) {
      const duration = now - lastRenderTime.current;
      console.log(`${componentName} 渲染时间: ${duration.toFixed(2)}ms`);

      if (duration > 16) {
        console.warn(`${componentName} 渲染时间过长（>16ms）`);
      }
    }
    lastRenderTime.current = now;
  });
}

// 2. 更新追踪
function useUpdateTracking(componentName) {
  const updateCount = useRef(0);
  const lastUpdate = useRef(null);

  useEffect(() => {
    updateCount.current++;
    const now = new Date().toLocaleTimeString();
    console.log(`${componentName} 更新 #${updateCount.current} at ${now}`);

    if (lastUpdate.current) {
      const interval = performance.now() - lastUpdate.current;
      console.log(`  距上次更新: ${interval.toFixed(0)}ms`);
    }
    lastUpdate.current = performance.now();
  });
}

// 3. Props变化追踪
function usePropsTracking(componentName) {
  const prevPropsRef = useRef({});

  useEffect(() => {
    const prevProps = prevPropsRef.current;

    Object.keys({ ...prevProps }).forEach(key => {
      if (prevProps[key] !== componentName[key]) {
        console.log(`${componentName} props.${key} 变化:`, {
          from: prevProps[key],
          to: componentName[key],
        });
      }
    });

    prevPropsRef.current = { ...componentName };
  });
}
```

---

## 6. 高级优化技巧

### 6.1 代码分割

代码分割可以显著减少首屏加载时间：

```javascript
import { lazy, Suspense } from 'react';

// 1. 路由级代码分割
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
        <Route path="/settings/*" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}

// 2. 组件级代码分割
const HeavyChart = lazy(() => import('./components/HeavyChart'));
const RichTextEditor = lazy(() => import('./components/RichTextEditor'));

function Dashboard() {
  const [showChart, setShowChart] = useState(false);

  return (
    <div>
      <button onClick={() => setShowChart(true)}>显示图表</button>
      {showChart && (
        <Suspense fallback={<ChartSkeleton />}>
          <HeavyChart />
        </Suspense>
      )}
    </div>
  );
}

// 3. 条件代码分割
function ConditionalCodeSplit() {
  const [isAdmin, setIsAdmin] = useState(false);

  // ❌ 差：所有用户都加载AdminPanel
  // import AdminPanel from './AdminPanel';

  // ✅ 好：只加载AdminPanel给管理员
  const AdminPanel = lazy(() => import('./AdminPanel'));

  return (
    <div>
      {isAdmin && (
        <Suspense fallback={<Loading />}>
          <AdminPanel />
        </Suspense>
      )}
    </div>
  );
}
```

### 6.2 Web Worker

将耗时计算移到Web Worker：

```javascript
// worker.js
self.onmessage = function(e) {
  const { type, data } = e.data;

  switch (type) {
    case 'SORT':
      const sorted = performSort(data);
      self.postMessage({ type: 'SORT_RESULT', result: sorted });
      break;

    case 'FILTER':
      const filtered = performFilter(data);
      self.postMessage({ type: 'FILTER_RESULT', result: filtered });
      break;

    case 'PROCESS_LARGE_DATA':
      const processed = processInChunks(data);
      self.postMessage({ type: 'PROCESS_RESULT', result: processed });
      break;
  }
};

// 使用Worker的Hook
import { useState, useEffect, useRef } from 'react';

function useWebWorker() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const workerRef = useRef(null);

  useEffect(() => {
    workerRef.current = new Worker('./worker.js');

    workerRef.current.onmessage = (e) => {
      setLoading(false);
      setResult(e.data.result);
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const postMessage = (type, data) => {
    setLoading(true);
    workerRef.current?.postMessage({ type, data });
  };

  return { result, loading, postMessage };
}

// 使用示例
function DataProcessing() {
  const { result, loading, postMessage } = useWebWorker();

  const handleSort = (data) => {
    postMessage('SORT', data);
  };

  const handleFilter = (data) => {
    postMessage('FILTER', data);
  };

  return (
    <div>
      {loading && <LoadingSpinner />}
      {result && <ResultDisplay data={result} />}
    </div>
  );
}
```

---

## 7. 面试高频问题

### 问题1：React中的性能优化方法有哪些？

**答案：**

1. **组件层面**
   - 使用React.memo包装纯组件
   - 使用useMemo缓存计算结果
   - 使用useCallback缓存回调函数
   - 合理拆分组件

2. **列表优化**
   - 使用虚拟列表（react-window）
   - 正确使用key
   - 列表操作优化

3. **状态管理**
   - 状态结构优化
   - 派生状态使用useMemo
   - Context分离

4. **代码分割**
   - 路由级分割
   - 组件级分割
   - 动态import

5. **其他**
   - Web Worker处理耗时计算
   - 使用React Profiler分析
   - 升级到React 18并发特性

### 问题2：useMemo和useCallback的区别？

**答案：**

| Hook | 用途 | 缓存内容 |
|------|------|----------|
| useMemo | 缓存计算结果 | 任何值（对象、数组、基本类型） |
| useCallback | 缓存函数引用 | 函数 |

```javascript
// useMemo缓存值
const memoizedValue = useMemo(() => computeExpensive(a, b), [a, b]);

// useCallback缓存函数
const memoizedCallback = useCallback(() => doSomething(a, b), [a, b]);

// useCallback等价于
const memoizedCallback = useMemo(() => () => doSomething(a, b), [a, b]);
```

### 问题3：React.memo和PureComponent的区别？

**答案：**

| 特性 | React.memo | PureComponent |
|------|-------------|---------------|
| 适用组件 | 函数组件 | 类组件 |
| 比较方式 | 默认浅比较，可自定义 | 浅比较 |
| 使用方式 | `memo(Component)` | 继承`PureComponent` |

```javascript
// React.memo
const Memoized = memo(Component);
const MemoizedWithCompare = memo(Component, (prev, next) => {
  return prev.id === next.id;
});

// PureComponent
class Pure extends PureComponent {
  render() {
    return <div>{this.props.name}</div>;
  }
}
```

### 问题4：如何避免不必要的重渲染？

**答案：**

1. **检查props变化**
   - 避免传递新对象/数组
   - 避免传递新函数
   - 使用useMemo/useCallback

2. **组件拆分**
   - 将静态和动态部分分离
   - 提取纯渲染组件
   - 使用children隔离

3. **状态管理**
   - 状态位置就近
   - 派生状态使用useMemo
   - Context分离

4. **使用优化工具**
   - React DevTools Profiler
   - why-did-you-render库

### 问题5：虚拟列表的原理是什么？

**答案：**

1. **只渲染可见区域**
   - 计算可见项的索引范围
   - 只渲染范围内的项

2. **使用绝对定位**
   - 容器设置固定高度
   - 内容使用transform定位

3. **滚动事件处理**
   - 监听滚动事件
   - 根据滚动位置计算可见范围
   - 更新渲染

4. **动态高度处理**
   - 测量每项高度
   - 缓存高度信息
   - 动态计算位置

---

## 最佳实践总结

### React性能优化清单

- [ ] 使用React.memo包装纯组件
- [ ] 使用useMemo缓存派生值
- [ ] 使用useCallback缓存回调
- [ ] 正确使用列表key
- [ ] 虚拟列表处理大量数据
- [ ] 合理拆分组件
- [ ] 优化Context使用
- [ ] 实施代码分割
- [ ] 使用React Profiler分析
- [ ] 升级React 18利用并发特性

---

*本文档最后更新于 2026年3月*
