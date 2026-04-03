# React Hook 设计模式完全指南

## 概述

React Hooks 是 React 16.8 引入的重大特性，它让我们能够在函数组件中使用状态和生命周期特性。随着 React 19 的发布，Hook 系统又新增了多个强大的新特性。本指南将深入探讨自定义 Hook 的设计原则、常见模式以及最佳实践，帮助你构建可复用、可测试、可维护的 Hook 逻辑。

## 一、自定义 Hooks 设计原则

### 1.1 单一职责原则

每个自定义 Hook 应该专注于完成一个特定的功能。这种设计使得 Hook 更容易测试、理解和维护。

```typescript
// ✅ 好的设计：单一职责
function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // 初始化

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

// ❌ 糟糕的设计：职责过多
function useWindowAndAuth() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  // ... 太多不相关的职责
}
```

**为什么单一职责重要？**

1. **可测试性**：每个 Hook 可以独立测试
2. **可组合性**：多个单一职责的 Hook 可以组合成复杂功能
3. **可读性**：名称清晰表达功能，易于理解
4. **可维护性**：修改一个功能不影响其他功能

### 1.2 可复用性设计

好的自定义 Hook 应该是通用的，不依赖特定的业务逻辑。通过参数化和配置化实现最大程度的复用。

```typescript
// ✅ 通用设计：通过参数实现复用
function useLocalStorage<T>(key: string, initialValue: T) {
  // 通用逻辑，适用于任何 localStorage 键值
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);
    window.localStorage.setItem(key, JSON.stringify(valueToStore));
  };

  return [storedValue, setValue] as const;
}

// 使用示例：一个组件存储主题，一个组件存储语言设置
function ThemeComponent() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  // ...
}

function LanguageComponent() {
  const [language, setLanguage] = useLocalStorage('language', 'zh-CN');
  // ...
}
```

### 1.3 组合模式

自定义 Hook 的真正威力在于组合。多个简单的 Hook 可以组合成复杂的业务逻辑。

```typescript
// 基础 Hook：防抖
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// 基础 Hook：媒体查询
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// 基础 Hook：窗口尺寸
function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

// 组合 Hook：响应式搜索（结合防抖、媒体查询、窗口尺寸）
function useResponsiveSearch<T>(
  searchFn: (query: string) => Promise<T[]>,
  debounceMs: number = 300
) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  const isMobile = useMediaQuery('(max-width: 768px)');
  const windowSize = useWindowSize();

  const debouncedQuery = useDebounce(query, debounceMs);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }

    setLoading(true);
    searchFn(debouncedQuery)
      .then(setResults)
      .finally(() => setLoading(false));
  }, [debouncedQuery, searchFn]);

  // 根据设备类型返回不同的 UI 建议
  const suggestionCount = isMobile ? 3 : 8;
  const displayResults = results.slice(0, suggestionCount);

  return {
    query,
    setQuery,
    results: displayResults,
    loading,
    isMobile,
    windowSize,
    totalResults: results.length,
  };
}
```

## 二、常见自定义 Hooks 完整实现

### 2.1 useDebounce - 防抖 Hook

防抖用于限制函数的执行频率，常用于搜索输入等场景。

```typescript
/**
 * 防抖 Hook
 * @description 延迟更新值，只有在停止输入 delay 毫秒后才更新
 * @param value - 需要防抖的值
 * @param delay - 延迟时间（毫秒）
 * @returns 防抖后的值
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // 设置定时器
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // 清理函数：组件卸载或 value/delay 变化时清除定时器
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // 依赖项

  return debouncedValue;
}

// 使用示例
function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    // 只有当用户停止输入 500ms 后才会执行搜索
    if (debouncedSearch) {
      fetchResults(debouncedSearch);
    }
  }, [debouncedSearch]);

  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="搜索..."
    />
  );
}
```

### 2.2 useThrottle - 节流 Hook

节流用于限制函数的执行频率，确保函数在指定时间间隔内最多执行一次。

```typescript
/**
 * 节流 Hook
 * @description 限制函数调用频率，在指定时间间隔内最多执行一次
 * @param callback - 需要节流的回调函数
 * @param delay - 时间间隔（毫秒）
 * @returns 节流后的函数
 */
function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  // 使用 ref 存储上次执行的时间戳
  const lastRun = useRef(Date.now());

  // 使用 useCallback 缓存函数引用
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    // 检查距离上次执行是否超过指定时间
    if (now - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = now;
    }
  }, [callback, delay]) as T;
}

// 使用示例
function ScrollTracker() {
  const [scrollY, setScrollY] = useState(0);

  // 节流滚动处理，每 100ms 最多更新一次
  const handleScroll = useThrottle(() => {
    setScrollY(window.scrollY);
  }, 100);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return <div>滚动位置: {scrollY}</div>;
}
```

### 2.3 useLocalStorage - 本地存储 Hook

持久化状态到 localStorage，支持 SSR 和类型安全。

```typescript
/**
 * 本地存储 Hook
 * @description 将状态持久化到 localStorage，支持 SSR 和函数式更新
 * @param key - localStorage 的键名
 * @param initialValue - 初始值
 * @returns [状态值, 更新函数]
 */
function useLocalStorage<T>(key: string, initialValue: T) {
  // 初始化时从 localStorage 读取值
  const [storedValue, setStoredValue] = useState<T>(() => {
    // SSR 环境下直接返回初始值
    if (typeof window === 'undefined') return initialValue;

    try {
      const item = window.localStorage.getItem(key);
      // 解析存储的值，如果不存在则返回初始值
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // 解析失败时返回初始值
      console.warn(`useLocalStorage: 读取 "${key}" 失败`, error);
      return initialValue;
    }
  });

  // 更新函数
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // 支持函数式更新（如 setState一样）
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      // 序列化并存储
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`useLocalStorage: 存储 "${key}" 失败`, error);
    }
  };

  // 返回元组，使用 as const 确保只读
  return [storedValue, setValue] as const;
}

// 使用示例
function Settings() {
  // 存储用户设置
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  const [username, setUsername] = useLocalStorage('username', '');

  return (
    <div>
      <select value={theme} onChange={(e) => setTheme(e.target.value)}>
        <option value="light">浅色</option>
        <option value="dark">深色</option>
      </select>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="用户名"
      />
    </div>
  );
}
```

### 2.4 useFetch - 数据获取 Hook

封装数据获取逻辑，支持加载状态、错误处理和请求取消。

```typescript
/**
 * 数据获取 Hook
 * @description 封装 fetch 请求，支持加载状态、错误处理、自动清理
 * @param url - 请求 URL
 * @param options - fetch 选项
 * @returns { data, loading, error }
 */
function useFetch<T>(url: string, options?: RequestInit) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // 创建 AbortController 用于取消请求
    const controller = new AbortController();

    setLoading(true);
    setError(null);

    fetch(url, { ...options, signal: controller.signal })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json() as Promise<T>;
      })
      .then(setData)
      .catch((err) => {
        // 区分取消请求和其他错误
        if (err.name !== 'AbortError') {
          setError(err);
        }
      })
      .finally(() => setLoading(false));

    // 组件卸载时取消请求
    return () => controller.abort();
  }, [url]); // url 变化时重新请求

  return { data, loading, error };
}

// 使用示例
function UserProfile({ userId }: { userId: string }) {
  const { data: user, loading, error } = useFetch<User>(
    `/api/users/${userId}`
  );

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;
  if (!data) return <div>用户不存在</div>;

  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.email}</p>
    </div>
  );
}
```

### 2.5 useClickOutside - 点击外部 Hook

检测点击是否发生在指定元素外部，常用于下拉菜单、模态框等。

```typescript
/**
 * 点击外部检测 Hook
 * @description 检测点击是否发生在 ref 指向的元素外部
 * @param ref - 要检测的元素引用
 * @param handler - 点击外部时的回调函数
 */
function useClickOutside(
  ref: RefObject<HTMLElement>,
  handler: () => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      // 如果还没有挂载或者点击在元素内部，则不处理
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };

    // 监听鼠标点击和触摸事件
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]); // 依赖 handler 的引用
}

// 使用示例
function Dropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useClickOutside(dropdownRef, () => setIsOpen(false));

  return (
    <div ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)}>
        菜单
      </button>
      {isOpen && (
        <ul className="dropdown-menu">
          <li>选项 1</li>
          <li>选项 2</li>
        </ul>
      )}
    </div>
  );
}
```

### 2.6 useMediaQuery - 媒体查询 Hook

监听 CSS 媒体查询状态，支持响应式设计。

```typescript
/**
 * 媒体查询 Hook
 * @description 监听 CSS 媒体查询，返回是否匹配
 * @param query - 媒体查询字符串
 * @returns 是否匹配
 */
function useMediaQuery(query: string): boolean {
  // 初始化时获取匹配状态
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    // 处理变化事件
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // 现代浏览器使用 addEventListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      // 旧版浏览器兼容
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, [query]);

  return matches;
}

// 预定义断点 Hook
function useBreakpoint() {
  const isXs = useMediaQuery('(max-width: 575.98px)');
  const isSm = useMediaQuery('(min-width: 576px) and (max-width: 767.98px)');
  const isMd = useMediaQuery('(min-width: 768px) and (max-width: 991.98px)');
  const isLg = useMediaQuery('(min-width: 992px) and (max-width: 1199.98px)');
  const isXl = useMediaQuery('(min-width: 1200px)');

  return { isXs, isSm, isMd, isL, isXl };
}

// 使用示例
function ResponsiveLayout() {
  const { isMobile, isTablet, isDesktop } = {
    isMobile: useMediaQuery('(max-width: 767.98px)'),
    isTablet: useMediaQuery('(min-width: 768px) and (max-width: 1023.98px)'),
    isDesktop: useMediaQuery('(min-width: 1024px)'),
  };

  return (
    <div>
      {isMobile && <MobileLayout />}
      {isTablet && <TabletLayout />}
      {isDesktop && <DesktopLayout />}
    </div>
  );
}
```

### 2.7 useInterval - 定时器 Hook

安全使用 setInterval，解决闭包陷阱问题。

```typescript
/**
 * 定时器 Hook
 * @description 安全使用 setInterval，自动清理，支持动态更新间隔
 * @param callback - 回调函数
 * @param delay - 间隔时间（毫秒），为 null 时暂停
 */
function useInterval(callback: () => void, delay: number | null) {
  // 使用 ref 保存最新的回调函数，避免闭包陷阱
  const savedCallback = useRef(callback);

  // 回调函数变化时更新 ref
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    // delay 为 null 时不启动定时器
    if (delay === null) return;

    // 每次执行时调用最新的回调
    const id = setInterval(() => savedCallback.current(), delay);

    // 组件卸载或 delay 变化时清除
    return () => clearInterval(id);
  }, [delay]);
}

// 使用示例
function CountdownTimer({ initialSeconds }: { initialSeconds: number }) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useInterval(() => {
    setSeconds((s) => {
      if (s <= 1) {
        return 0;
      }
      return s - 1;
    });
  }, seconds > 0 ? 1000 : null); // 计时结束自动停止

  return <div>倒计时: {seconds}秒</div>;
}

// 动态更新间隔的示例
function PollingComponent({ enabled }: { enabled: boolean }) {
  const [interval, setIntervalMs] = useState(5000);

  useInterval(() => {
    fetchData();
  }, enabled ? interval : null);

  return (
    <div>
      <button onClick={() => setIntervalMs(1000)}>快速</button>
      <button onClick={() => setIntervalMs(5000)}>正常</button>
    </div>
  );
}
```

## 三、状态管理 Hooks

### 3.1 useReducer 进阶用法

对于复杂的状态逻辑，useReducer 提供了更好的可预测性和测试性。

```typescript
// 状态类型定义
interface FetchState<T> {
  loading: boolean;
  data: T | null;
  error: Error | null;
}

// Action 类型定义
type FetchAction<T> =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: T }
  | { type: 'FETCH_ERROR'; payload: Error }
  | { type: 'RESET' };

// Reducer 函数
function fetchReducer<T>(state: FetchState<T>, action: FetchAction<T>): FetchState<T> {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { loading: false, data: action.payload, error: null };
    case 'FETCH_ERROR':
      return { loading: false, data: null, error: action.payload };
    case 'RESET':
      return { loading: false, data: null, error: null };
    default:
      return state;
  }
}

/**
 * 数据获取 Hook（基于 useReducer）
 * @description 封装数据获取逻辑，支持加载状态和错误处理
 */
function useFetch<T>(url: string) {
  const [state, dispatch] = useReducer(fetchReducer<T>, {
    loading: true,
    data: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    dispatch({ type: 'FETCH_START' });

    fetch(url)
      .then((res) => res.json())
      .then((data: T) => {
        if (!cancelled) {
          dispatch({ type: 'FETCH_SUCCESS', payload: data });
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          dispatch({ type: 'FETCH_ERROR', payload: error });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  // 提供刷新函数
  const refresh = useCallback(() => {
    dispatch({ type: 'FETCH_START' });
    fetch(url)
      .then((res) => res.json())
      .then((data: T) => dispatch({ type: 'FETCH_SUCCESS', payload: data }))
      .catch((error: Error) => dispatch({ type: 'FETCH_ERROR', payload: error }));
  }, [url]);

  return { ...state, refresh };
}

// 使用示例
function UserList() {
  const { data: users, loading, error, refresh } = useFetch<User[]>(
    '/api/users'
  );

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>刷新</button>
      {users?.map((user) => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

### 3.2 useContext 优化

优化 Context 的性能，避免不必要的重渲染。

```typescript
// 定义 Context 类型
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

// 创建 Context（初始值为 null）
const ThemeContext = createContext<ThemeContextType | null>(null);

/**
 * Theme Provider 组件
 * @description 提供主题上下文，使用 useMemo 优化重渲染
 */
function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // 使用 useCallback 缓存切换函数
  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  }, []);

  // 使用 useMemo 缓存 context 值
  const value = useMemo<ThemeContextType>(
    () => ({ theme, toggleTheme }),
    [theme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/**
 * 主题 Hook
 * @description 消费主题上下文
 */
function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme 必须在 ThemeProvider 内使用');
  }
  return context;
}

// 使用示例
function ThemedButton() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className={theme}
      onClick={toggleTheme}
      style={{
        background: theme === 'light' ? '#fff' : '#333',
        color: theme === 'light' ? '#333' : '#fff',
      }}
    >
      当前主题: {theme}
    </button>
  );
}
```

## 四、复杂 Hooks 组合

### 4.1 useAsync - 异步操作 Hook

封装异步操作，支持竞态条件处理。

```typescript
/**
 * 异步操作 Hook
 * @description 封装异步操作，自动处理加载状态、错误，支持竞态条件处理
 * @param asyncFunction - 异步函数
 * @param deps - 依赖数组
 */
function useAsync<T>(
  asyncFunction: () => Promise<T>,
  deps: any[] = []
) {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: Error | null;
  }>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // 用于处理竞态条件
    let cancelled = false;

    setState({ data: null, loading: true, error: null });

    asyncFunction()
      .then((data) => {
        // 检查是否已被取消
        if (!cancelled) {
          setState({ data, loading: false, error: null });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setState({ data: null, loading: false, error });
        }
      });

    // 清理函数：组件卸载或依赖变化时标记为取消
    return () => {
      cancelled = true;
    };
  }, deps);

  // 提供手动触发函数
  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await asyncFunction();
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      setState({ data: null, loading: false, error: error as Error });
      throw error;
    }
  }, deps);

  return { ...state, execute };
}

// 使用示例
function SearchComponent() {
  const [query, setQuery] = useState('');

  const searchResults = useAsync(
    async () => {
      if (!query) return [];
      const response = await fetch(`/api/search?q=${query}`);
      return response.json();
    },
    [query]
  );

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      {searchResults.loading && <div>搜索中...</div>}
      {searchResults.error && <div>搜索失败</div>}
      {searchResults.data?.map((result) => (
        <div key={result.id}>{result.title}</div>
      ))}
    </div>
  );
}
```

### 4.2 usePagination - 分页 Hook

封装分页逻辑，提供便捷的导航方法。

```typescript
/**
 * 分页 Hook
 * @description 封装分页逻辑，提供导航方法和计算属性
 * @param data - 原始数据数组
 * @param pageSize - 每页大小
 */
function usePagination<T>(data: T[], pageSize: number = 10) {
  const [currentPage, setCurrentPage] = useState(1);

  // 计算总页数
  const totalPages = Math.ceil(data.length / pageSize);

  // 使用 useMemo 缓存当前页数据
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return data.slice(start, end);
  }, [data, currentPage, pageSize]);

  // 跳转到指定页（带边界检查）
  const goToPage = (page: number) => {
    const targetPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(targetPage);
  };

  // 下一页
  const nextPage = () => {
    goToPage(currentPage + 1);
  };

  // 上一页
  const prevPage = () => {
    goToPage(currentPage - 1);
  };

  // 第一页
  const firstPage = () => {
    goToPage(1);
  };

  // 最后一页
  const lastPage = () => {
    goToPage(totalPages);
  };

  // 生成页码数组（用于渲染页码导航）
  const pageNumbers = useMemo(() => {
    const pages: (number | '...')[] = [];
    const showPages = 5; // 最多显示的页码数

    if (totalPages <= showPages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 始终显示第一页
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // 显示当前页附近的页码
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // 始终显示最后一页
      pages.push(totalPages);
    }

    return pages;
  }, [currentPage, totalPages]);

  return {
    // 当前页数据
    data: paginatedData,
    // 当前页码
    currentPage,
    // 总页数
    totalPages,
    // 总数据条数
    totalItems: data.length,
    // 每页条数
    pageSize,
    // 导航方法
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    // 状态
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages,
    // 页码数组
    pageNumbers,
  };
}

// 使用示例
function PaginatedTable() {
  const { data, currentPage, totalPages, pageNumbers, goToPage, hasNextPage, hasPrevPage } =
    usePagination(allUsers, 10);

  return (
    <div>
      <table>
        {data.map((user) => (
          <tr key={user.id}>
            <td>{user.name}</td>
          </tr>
        ))}
      </table>

      <div className="pagination">
        <button onClick={() => goToPage(1)} disabled={!hasPrevPage}>
          首页
        </button>
        <button onClick={() => goToPage(currentPage - 1)} disabled={!hasPrevPage}>
          上一页
        </button>

        {pageNumbers.map((page, index) =>
          page === '...' ? (
            <span key={`ellipsis-${index}`}>...</span>
          ) : (
            <button
              key={page}
              onClick={() => goToPage(page as number)}
              className={currentPage === page ? 'active' : ''}
            >
              {page}
            </button>
          )
        )}

        <button onClick={() => goToPage(currentPage + 1)} disabled={!hasNextPage}>
          下一页
        </button>
        <button onClick={() => goToPage(totalPages)} disabled={!hasNextPage}>
          末页
        </button>
      </div>
    </div>
  );
}
```

## 五、React 19 新 Hooks

### 5.1 use() - 消费 Promise

React 19 引入了全新的 `use()` Hook，它允许在组件中直接消费 Promise 和 Context，打破了 Hook 不能在条件语句中调用的限制。

```typescript
/**
 * use() - 消费 Promise
 * @description 在组件中消费 Promise，可以在条件语句中使用
 */

// 场景1：消费 Promise
function UserProfile({ userPromise }) {
  // use() 可以在条件语句中使用
  const user = use(userPromise);

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

// 场景2：消费 Context
function ThemedButton() {
  // 消费 Context，无需 Provider 包装
  const theme = use(ThemeContext);
  return <button className={theme}>点击</button>;
}

// 场景3：错误处理和加载状态
function AsyncUserProfile({ userPromise }) {
  if (!userPromise) {
    return <div>请提供用户数据</div>;
  }

  try {
    const user = use(userPromise);
    return <div>{user.name}</div>;
  } catch (promise) {
    // 如果抛出的是 Promise，显示加载状态
    if (promise instanceof Promise) {
      return <Suspense fallback={<div>加载中...</div>}>
        {/* 重新渲染以触发 Suspense */}
      </Suspense>;
    }
    throw promise;
  }
}
```

### 5.2 useOptimistic - 乐观更新

用于实现乐观更新，UI 先变化，再同步服务端。

```typescript
/**
 * useOptimistic - 乐观更新 Hook
 * @description 立即更新 UI，后台同步服务端，支持回滚
 */
import { useOptimistic, useState } from 'react';

// 定义乐观更新类型
type OptimisticState = {
  id: number;
  text: string;
  completed: boolean;
};

function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);

  // 乐观更新 hook
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    // 更新函数：基于当前状态和新数据生成乐观状态
    (state, newTodo: { id: number; text: string }) => [
      ...state,
      { ...newTodo, completed: false, pending: true } // pending 表示待确认
    ]
  );

  async function handleAddTodo(text: string) {
    const tempId = Date.now(); // 临时 ID
    const newTodo = { id: tempId, text };

    // 立即添加乐观更新
    addOptimisticTodo(newTodo);

    try {
      // 后台请求
      const savedTodo = await fetch('/api/todos', {
        method: 'POST',
        body: JSON.stringify({ text }),
      }).then((r) => r.json());

      // 成功后更新真实状态（替换临时数据）
      setTodos((todos) =>
        todos.map((t) => (t.id === tempId ? savedTodo : t))
      );
    } catch {
      // 失败时回滚（从 todos 中移除临时数据）
      setTodos((todos) => todos.filter((t) => t.id !== tempId));
    }
  }

  return (
    <div>
      {optimisticTodos.map((todo) => (
        <div
          key={todo.id}
          style={{ opacity: todo.pending ? 0.7 : 1 }}
        >
          {todo.text}
        </div>
      ))}
      <button onClick={() => handleAddTodo('新任务')}>添加</button>
    </div>
  );
}
```

### 5.3 useActionState - 表单状态管理

用于管理表单 action 的状态。

```typescript
/**
 * useActionState - 表单 action 状态管理 Hook
 * @description 管理表单提交状态，提供 pending 状态
 */
'use client';

import { useActionState } from 'react';

// 定义 action 函数
async function submitForm(prevState, formData) {
  const name = formData.get('name');
  const email = formData.get('email');

  // 模拟网络请求
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 验证
  if (!name || !email) {
    return { error: '请填写所有字段', success: false };
  }

  // 提交
  await fetch('/api/users', {
    method: 'POST',
    body: JSON.stringify({ name, email }),
  });

  return { error: null, success: true, message: '提交成功！' };
}

function ContactForm() {
  // useActionState 管理表单状态
  const [state, formAction, isPending] = useActionState(submitForm, null);

  if (state?.success) {
    return <div>{state.message}</div>;
  }

  return (
    <form action={formAction}>
      <input name="name" placeholder="姓名" required />
      <input name="email" type="email" placeholder="邮箱" required />

      {state?.error && <div className="error">{state.error}</div>}

      <button type="submit" disabled={isPending}>
        {isPending ? '提交中...' : '提交'}
      </button>
    </form>
  );
}
```

### 5.4 useFormStatus - 表单状态

获取表单提交状态，用于在子组件中显示加载状态。

```typescript
/**
 * useFormStatus - 表单提交状态 Hook
 * @description 在表单子组件中获取表单提交状态
 */
'use client';

import { useFormStatus } from 'react-dom';

// 子组件：提交按钮
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? '提交中...' : '提交'}
    </button>
  );
}

// 父组件：表单
function ContactForm() {
  async function submitAction(formData) {
    // 模拟提交
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log('提交的数据:', formData.get('name'));
  }

  return (
    <form action={submitAction}>
      <input name="name" placeholder="姓名" />
      <input name="email" placeholder="邮箱" />
      {/* 子组件可以使用 useFormStatus */}
      <SubmitButton />
    </form>
  );
}
```

## 六、面试高频问题

### Q1: 自定义 Hook 的设计原则是什么？

**回答要点：**

1. **单一职责**：每个 Hook 只做一件事，名称清晰表达功能
2. **可复用性**：通过参数化实现通用性，不依赖特定业务逻辑
3. **组合性**：多个简单 Hook 可以组合成复杂功能
4. **正确的依赖管理**：合理声明依赖项，避免不必要的重渲染
5. **清理副作用**：在 useEffect 中正确清理定时器、事件监听等
6. **错误处理**：考虑边界情况和错误状态

```typescript
// 示例：好的设计
function useDebounce<T>(value: T, delay: number): T {
  // 单一职责：只做防抖
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler); // 正确清理
  }, [value, delay]);

  return debouncedValue;
}
```

### Q2: 如何避免 Hook 的闭包陷阱？

**回答要点：**

闭包陷阱是指在 useEffect、setTimeout 等回调中访问的是过时的状态值。

**解决方案：**

1. **使用 useRef 保存最新值**

```typescript
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      // ❌ 闭包陷阱：count 永远是 0
      setCount(count + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []); // 空依赖

  // ✅ 解决方案1：使用函数式更新
  useEffect(() => {
    const interval = setInterval(() => {
      setCount(c => c + 1); // 不依赖外部状态
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ✅ 解决方案2：使用 ref 保存最新值
  const countRef = useRef(count);
  useEffect(() => {
    countRef.current = count;
  }, [count]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(countRef.current + 1); // 访问最新值
    }, 1000);
    return () => clearInterval(interval);
  }, []);
}
```

2. **useInterval Hook 自动处理闭包问题**

```typescript
function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  // 始终保持 ref 为最新
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
```

### Q3: useReducer vs useState 何时选择？

**回答要点：**

| 场景 | 推荐 | 原因 |
|------|------|------|
| 简单状态（数字、字符串、布尔） | useState | 直观、简单 |
| 相关状态的集合 | useReducer | 逻辑内聚，易于测试 |
| 复杂状态转换逻辑 | useReducer | 易于追踪变化 |
| 需要深度比较的更新 | useReducer | 可以控制何时更新 |
| 性能敏感的场景 | useReducer | 减少不必要的更新 |

**useReducer 适用场景示例：**

```typescript
// 表单状态 - 使用 useReducer 更合适
function formReducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, fields: { ...state.fields, [action.field]: action.value }, errors: { ...state.errors, [action.field]: null } };
    case 'SET_ERROR':
      return { ...state, errors: { ...state.errors, [action.field]: action.error } };
    case 'SUBMIT':
      return { ...state, submitting: true };
    case 'SUCCESS':
      return { ...state, submitting: false, submitted: true };
    case 'FAILURE':
      return { ...state, submitting: false, error: action.error };
    default:
      return state;
  }
}

function ContactForm() {
  const [state, dispatch] = useReducer(formReducer, {
    fields: { name: '', email: '', message: '' },
    errors: {},
    submitting: false,
    submitted: false,
    error: null,
  });

  // 清晰的 action 分发
  const handleChange = (field, value) => {
    dispatch({ type: 'SET_FIELD', field, value });
  };

  const handleSubmit = async () => {
    dispatch({ type: 'SUBMIT' });
    // ... 提交逻辑
  };
}
```

### Q4: 如何优化自定义 Hook 的性能？

**回答要点：**

1. **使用 useMemo 缓存计算结果**

```typescript
function useExpensiveCalculation(data: any[], computeFn: (data: any[]) => any) {
  return useMemo(() => computeFn(data), [data, computeFn]);
}
```

2. **使用 useCallback 稳定函数引用**

```typescript
function useEventHandler<T extends (...args: any[]) => any>(
  callback: T,
  deps: any[]
) {
  return useCallback(callback, deps);
}
```

3. **使用 ref 避免不必要的状态**

```typescript
function usePrevious<T>(value: T) {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}
```

4. **分离状态和派生数据**

```typescript
// ❌ 不好的设计
function useFilteredList(items: Item[], filter: string) {
  const [filteredItems, setFilteredItems] = useState(items);

  useEffect(() => {
    setFilteredItems(items.filter(i => i.name.includes(filter)));
  }, [items, filter]);

  return filteredItems;
}

// ✅ 好的设计：派生数据用 useMemo
function useFilteredList(items: Item[], filter: string) {
  // 不需要状态，直接用 useMemo
  const filteredItems = useMemo(
    () => items.filter(i => i.name.includes(filter)),
    [items, filter]
  );
  return filteredItems;
}
```

5. **延迟初始化**

```typescript
function useLargeData(key: string) {
  // ❌ 每次渲染都执行
  const [data, setData] = useState(() => JSON.parse(localStorage.getItem(key) || '{}'));

  // ✅ 惰性初始化：只在首次渲染执行
  const [data, setData] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
}
```

## 总结

React Hooks 开启了组件逻辑复用的大门。通过遵循设计原则、掌握常见模式、了解新特性，我们可以构建出：

- **可复用**：一次编写，多处使用
- **可测试**：独立逻辑，轻松单元测试
- **可维护**：单一职责，清晰易懂
- **高性能**：合理优化，避免重渲染

随着 React 19 的发布，Hook 系统变得更加强大，use()、useOptimistic、useActionState 等新特性将进一步简化全栈开发。持续学习和实践是掌握这些工具的关键。

## 延伸阅读

- [React 官方 Hooks 文档](https://react.dev/reference/react)
- [React 19 新特性深度解析](./React19_Hooks深入详解.md)
- [Hooks 最佳实践与面试题](./React_Hooks面试题与最佳实践_2026.md)
