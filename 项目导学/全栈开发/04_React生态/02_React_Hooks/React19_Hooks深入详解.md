# React 19 Hooks 深入详解：从原理到实战

## 1. 概述：React Hooks 的演进与原理

React Hooks 自 2018 年发布以来，彻底改变了 React 的开发方式。在 React 19 中，Hooks 已经成为**状态管理、副作用处理、性能优化**的核心工具。本指南深入解析 React 19 中所有 Hooks 的底层原理、最佳实践和常见陷阱。

### 1.1 Hooks 的设计哲学

React Hooks 遵循三个核心原则：

1. **单一职责**：每个 Hook 只负责一个功能
2. **可组合性**：多个 Hook 可以自由组合
3. **可测试性**：Hook 逻辑可以独立测试

### 1.2 Hooks 使用规则（必须遵守）

```typescript
// 规则 1：只在顶层调用 Hook
function BadComponent() {
  if (condition) {
    const [state, setState] = useState(0); // ❌ 错误！
  }
}

function GoodComponent() {
  const [state, setState] = useState(0); // ✅ 正确
  if (condition) {
    // 使用 state
  }
}

// 规则 2：只在 React 函数中调用 Hook
function Component() {
  const [state, setState] = useState(0); // ✅ 正确
}

function regularFunction() {
  const [state, setState] = useState(0); // ❌ 错误！
}
```

---

## 2. 基础 Hooks 深入解析

### 2.1 useState：状态管理的核心

#### 2.1.1 基础用法与原理

```typescript
// useState 的本质：调度器 + 状态存储
function Counter() {
  const [count, setCount] = useState(0);

  // 等价于
  const [count, setCount] = useState(() => 0); // 惰性初始化
}
```

#### 2.1.2 函数式更新（关键）

```typescript
// ❌ 错误：直接使用状态值
function BadCounter() {
  const [count, setCount] = useState(0);

  const increment = () => {
    setCount(count + 1); // ❌ 可能导致状态不一致
    setCount(count + 1); // ❌ 两次更新可能合并
    setCount(count + 1);
  };

  // 问题：count 在闭包中是固定的，不会更新
}

// ✅ 正确：使用函数式更新
function GoodCounter() {
  const [count, setCount] = useState(0);

  const increment = () => {
    setCount(prev => prev + 1); // ✅ 使用前一个状态
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);
    // 最终 count 增加 3
  };

  // 批量更新：React 18+ 自动批处理
  const incrementThree = () => {
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);
    // 只触发一次重渲染
  };
}
```

#### 2.1.3 对象状态更新

```typescript
// ❌ 错误：直接修改对象
function BadProfile() {
  const [user, setUser] = useState({ name: '', email: '' });

  const updateName = (name: string) => {
    user.name = name; // ❌ 直接修改
    setUser(user);    // ❌ 引用相同，不会触发重渲染
  };
}

// ✅ 正确：创建新对象
function GoodProfile() {
  const [user, setUser] = useState({ name: '', email: '' });

  const updateName = (name: string) => {
    setUser(prev => ({ ...prev, name })); // ✅ 创建新对象
  };

  // 使用 useImmer 简化（推荐）
  import { useImmer } from 'use-immer';

  const [user, updateUser] = useImmer({ name: '', email: '' });

  const updateName = (name: string) => {
    updateUser(draft => {
      draft.name = name; // 直接修改，useImmer 处理不可变
    });
  };
}
```

#### 2.1.4 数组状态更新

```typescript
function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);

  // 添加
  const addTodo = (text: string) => {
    setTodos(prev => [...prev, { id: Date.now(), text, completed: false }]);
  };

  // 删除
  const removeTodo = (id: number) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  // 更新
  const updateTodo = (id: number, updates: Partial<Todo>) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, ...updates } : todo
      )
    );
  };

  // 切换完成状态
  const toggleTodo = (id: number) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };
}
```

#### 2.1.5 useReducer vs useState

```typescript
// 简单状态：使用 useState
function Counter() {
  const [count, setCount] = useState(0);
  const increment = () => setCount(prev => prev + 1);
}

// 复杂状态：使用 useReducer
interface TodoState {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed';
}

type TodoAction =
  | { type: 'ADD_TODO'; payload: string }
  | { type: 'TOGGLE_TODO'; payload: number }
  | { type: 'SET_FILTER'; payload: 'all' | 'active' | 'completed' };

function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case 'ADD_TODO':
      return {
        ...state,
        todos: [
          ...state.todos,
          { id: Date.now(), text: action.payload, completed: false },
        ],
      };
    case 'TOGGLE_TODO':
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === action.payload
            ? { ...todo, completed: !todo.completed }
            : todo
        ),
      };
    case 'SET_FILTER':
      return { ...state, filter: action.payload };
    default:
      return state;
  }
}

function TodoApp() {
  const [state, dispatch] = useReducer(todoReducer, {
    todos: [],
    filter: 'all',
  });

  return (
    <div>
      <button onClick={() => dispatch({ type: 'SET_FILTER', payload: 'active' })}>
        活动任务
      </button>
    </div>
  );
}
```

### 2.2 useEffect：副作用处理

#### 2.2.1 基础用法与依赖数组

```typescript
// ❌ 错误：忘记依赖
function BadComponent({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, []); // ❌ userId 应该在依赖数组中
}

// ✅ 正确：正确的依赖数组
function GoodComponent({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]); // ✅ 依赖 userId
}

// 空依赖数组：只在挂载时执行
function DidMountExample() {
  useEffect(() => {
    console.log('组件挂载');
    // 适合：数据获取、订阅、添加事件监听器
  }, []);

  return <div>内容</div>;
}

// 无依赖数组：每次渲染后执行
function AlwaysRenderExample() {
  useEffect(() => {
    console.log('每次渲染后执行');
  });

  return <div>内容</div>;
}
```

#### 2.2.2 清理函数

```typescript
// 订阅事件
function ChatRoom({ roomId }) {
  useEffect(() => {
    const subscription = chat.subscribe(roomId, onMessage);

    // 清理函数：组件卸载或下次 effect 执行前调用
    return () => {
      subscription.unsubscribe();
    };
  }, [roomId]);

  return <div>聊天室</div>;
}

// 定时器
function Timer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return <div>{seconds} 秒</div>;
}

// 监听窗口大小
function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    function handleResize() {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}
```

#### 2.2.3 数据获取

```typescript
// ❌ 错误：直接在 useEffect 中使用 async
function BadDataFetching() {
  useEffect(async () => {
    // ❌ async 函数返回 Promise，不是清理函数
    const data = await fetchData();
  }, []);
}

// ✅ 正确：在 useEffect 中调用 async 函数
function GoodDataFetching() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        const result = await fetch('/api/data');
        const json = await result.json();

        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  return <div>{JSON.stringify(data)}</div>;
}

// 使用 AbortController
function DataFetchingWithAbort() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/data', { signal: controller.signal })
      .then(res => res.json())
      .then(setData)
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error(err);
        }
      });

    return () => {
      controller.abort();
    };
  }, []);

  return <div>{JSON.stringify(data)}</div>;
}
```

#### 2.2.4 useLayoutEffect vs useEffect

```typescript
// useLayoutEffect：同步执行，在 DOM 改变后、浏览器绘制前
function useMeasure() {
  const [rect, setRect] = useState({ width: 0, height: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (ref.current) {
      const { width, height } = ref.current.getBoundingClientRect();
      setRect({ width, height });
    }
  }, []);

  return { ref, rect };
}

// useEffect：异步执行，在浏览器绘制后
function useEffectExample() {
  useEffect(() => {
    console.log('绘制后执行');
  }, []);

  return <div>内容</div>;
}
```

### 2.3 useContext：跨组件状态共享

#### 2.3.1 基础用法

```typescript
// 创建 Context
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 提供 Context
function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 使用 Context
function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme 必须在 ThemeProvider 内使用');
  }
  return context;
}

function ThemedButton() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      style={{ background: theme === 'light' ? '#fff' : '#333' }}
    >
      切换主题
    </button>
  );
}
```

#### 2.3.2 Context 性能优化

```typescript
// ❌ 错误：每次渲染都创建新对象
function BadProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialState);

  // 每次渲染都创建新对象，导致所有订阅组件重新渲染
  const value = { state, setState };

  return (
    <MyContext.Provider value={value}>
      {children}
    </MyContext.Provider>
  );
}

// ✅ 正确：使用 useMemo 优化
function GoodProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialState);

  // 只在 state 变化时创建新对象
  const value = useMemo(() => ({ state, setState }), [state]);

  return (
    <MyContext.Provider value={value}>
      {children}
    </MyContext.Provider>
  );
}

// ✅ 更好的方案：拆分 Context
const UserContext = createContext<User | null>(null);
const UserActionsContext = createContext<{
  updateUser: (user: User) => void;
} | null>(null);

function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const actions = useMemo(() => ({
    updateUser: setUser,
  }), []);

  return (
    <UserContext.Provider value={user}>
      <UserActionsContext.Provider value={actions}>
        {children}
      </UserActionsContext.Provider>
    </UserContext.Provider>
  );
}

// 只使用 actions 的组件不会因为 user 变化而重新渲染
function UpdateUserButton() {
  const { updateUser } = useContext(UserActionsContext)!;
  return <button onClick={() => updateUser(newUser)}>更新</button>;
}
```

#### 2.3.3 组合多个 Context

```typescript
function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// 使用
function App() {
  return (
    <AppProviders>
      <Main />
    </AppProviders>
  );
}
```

### 2.4 useMemo 与 useCallback

#### 2.4.1 useMemo：缓存计算结果

```typescript
// ❌ 错误：不必要地使用 useMemo
function BadComponent({ name }) {
  // 简单计算不需要 useMemo
  const upperName = useMemo(() => name.toUpperCase(), [name]);
}

// ✅ 正确：复杂计算使用 useMemo
function GoodComponent({ items, filter }) {
  // 复杂计算使用 useMemo
  const filteredItems = useMemo(() => {
    return items
      .filter(item => item.name.length > 0)
      .map(item => ({ ...item, processed: true }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items, filter]);

  // 复杂对象使用 useMemo
  const config = useMemo(() => ({
    timeout: 5000,
    retry: 3,
    headers: { 'Content-Type': 'application/json' },
  }), []);

  return <div>{filteredItems.length}</div>;
}
```

#### 2.4.2 useCallback：缓存函数引用

```typescript
// ❌ 错误：不必要地使用 useCallback
function BadComponent() {
  const handleClick = useCallback(() => {
    console.log('click');
  }, []); // 简单函数不需要 useCallback
}

// ✅ 正确：传递给 memo 组件的函数使用 useCallback
interface Item {
  id: string;
  name: string;
}

const ItemComponent = memo(({ item, onClick }: { item: Item; onClick: (id: string) => void }) => {
  console.log('渲染:', item.name);
  return <div onClick={() => onClick(item.id)}>{item.name}</div>;
});

function ParentComponent() {
  const [items, setItems] = useState<Item[]>([
    { id: '1', name: '项目1' },
    { id: '2', name: '项目2' },
  ]);

  // 传递给 memo 组件的函数使用 useCallback
  const handleClick = useCallback((id: string) => {
    console.log('点击:', id);
  }, []);

  // 依赖其他 state 的回调使用 useCallback
  const handleDelete = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  return (
    <div>
      {items.map(item => (
        <ItemComponent key={item.id} item={item} onClick={handleClick} />
      ))}
    </div>
  );
}
```

#### 2.4.3 useMemo vs useCallback 选择

```typescript
// 经验法则：
// - 函数传给子组件 -> useCallback
// - 计算结果传给子组件 -> useMemo
// - 简单计算不需要 useMemo（可能更慢）

function Example() {
  const [count, setCount] = useState(0);

  // 传给子组件的函数
  const handleSubmit = useCallback((data: any) => {
    console.log('提交', data);
  }, []);

  // 传给子组件的对象
  const config = useMemo(() => ({
    timeout: 5000,
    retry: 3
  }), []);

  // 简单值不需要 useMemo
  const upperName = name.toUpperCase(); // 直接执行

  return <Form onSubmit={handleSubmit} config={config} />;
}
```

### 2.5 useRef：访问 DOM 和存储可变值

#### 2.5.1 访问 DOM 元素

```typescript
function TextInputWithFocus() {
  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <div>
      <input ref={inputRef} type="text" />
      <button onClick={focusInput}>聚焦输入框</button>
    </div>
  );
}
```

#### 2.5.2 存储任意可变值

```typescript
function Timer() {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(intervalRef.current!);
    };
  }, []);

  return <div>{seconds} 秒</div>;
}

// 保存上一次的值
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

function Counter() {
  const [count, setCount] = useState(0);
  const previousCount = usePrevious(count);

  return (
    <div>
      <p>当前: {count}</p>
      <p>上次: {previousCount}</p>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
    </div>
  );
}
```

#### 2.5.3 useImperativeHandle

```typescript
import { forwardRef, useImperativeHandle, useRef } from 'react';

const Child = forwardRef((props, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
    getValue: () => {
      return inputRef.current?.value;
    },
    clear: () => {
      inputRef.current!.value = '';
    }
  }));

  return <input ref={inputRef} />;
});

function Parent() {
  const childRef = useRef<{ focus: () => void; getValue: () => string; clear: () => void }>(null);

  const handleClick = () => {
    childRef.current?.focus();
    console.log(childRef.current?.getValue());
  };

  return (
    <div>
      <Child ref={childRef} />
      <button onClick={handleClick}>操作子组件</button>
    </div>
  );
}
```

---

## 3. 进阶 Hooks

### 3.1 useTransition 与 useDeferredValue

```typescript
function SearchResults() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 标记为非紧急更新
    startTransition(() => {
      setQuery(e.target.value);
    });
  };

  return (
    <div>
      <input onChange={handleChange} />
      {isPending && <div>加载中...</div>}
      <Results query={query} />
    </div>
  );
}

// useDeferredValue：延迟非紧急值
function SearchResults({ query }: { query: string }) {
  // query 变化时会延迟处理
  const deferredQuery = useDeferredValue(query);

  return <ExpensiveComponent query={deferredQuery} />;
}
```

### 3.2 useId：生成唯一 ID

```typescript
function Form() {
  const id = useId();

  return (
    <div>
      <label htmlFor={id}>姓名</label>
      <input id={id} type="text" />
    </div>
  );
}
```

### 3.3 useActionState（React 19 新特性）

```typescript
// React 19 新特性：useActionState
function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    async (previousState: { error?: string }, formData: FormData) => {
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      try {
        await login(email, password);
        return { success: true };
      } catch (error) {
        return { error: '登录失败' };
      }
    },
    { error: undefined }
  );

  return (
    <form action={formAction}>
      {state.error && <p>{state.error}</p>}
      <input name="email" type="email" />
      <input name="password" type="password" />
      <button type="submit" disabled={isPending}>
        {isPending ? '登录中...' : '登录'}
      </button>
    </form>
  );
}
```

---

## 4. 自定义 Hook 模式

### 4.1 useFetch：数据获取

```typescript
interface UseFetchReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

function useFetch<T>(url: string, options?: RequestInit): UseFetchReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);

    fetch(url, options)
      .then(res => {
        if (!res.ok) {
          throw new Error('请求失败');
        }
        return res.json();
      })
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url, options]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

// 使用
function UserList() {
  const { data, loading, error } = useFetch<User[]>('/api/users');

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <ul>
      {data?.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### 4.2 useDebounce：防抖

```typescript
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// 使用
function SearchBox() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) {
      // 执行搜索
      console.log('搜索:', debouncedQuery);
    }
  }, [debouncedQuery]);

  return (
    <input
      type="text"
      value={query}
      onChange={e => setQuery(e.target.value)}
      placeholder="搜索..."
    />
  );
}
```

### 4.3 useClickOutside：点击外部关闭

```typescript
function useClickOutside(
  ref: RefObject<HTMLElement>,
  handler: (event: MouseEvent | TouchEvent) => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

// 使用
function Dropdown() {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useClickOutside(dropdownRef, () => setIsOpen(false));

  return (
    <div ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)}>菜单</button>
      {isOpen && <div className="dropdown">菜单内容</div>}
    </div>
  );
}
```

---

## 5. Hooks 最佳实践

### 5.1 性能优化

```typescript
// 1. 使用 React.memo 避免不必要的重渲染
const MemoizedComponent = React.memo(function MyComponent({ data }) {
  return <div>{data}</div>;
});

// 2. 使用 useMemo 缓存计算结果
const result = useMemo(() => computeExpensiveValue(a, b), [a, b]);

// 3. 使用 useCallback 缓存函数
const handleClick = useCallback(() => {
  console.log('click');
}, []);

// 4. 使用选择器优化 Context 订阅
const userName = useStore((state) => state.user?.name);

// 5. 使用 useTransition 标记非紧急更新
startTransition(() => {
  setQuery(e.target.value);
});
```

### 5.2 错误处理

```typescript
// 使用 Error Boundary 捕获错误
class ErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 rounded-lg dark:bg-red-900/20">
          <h2 className="text-red-600 dark:text-red-400">出错了</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {this.state.error?.message}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// 使用
<ErrorBoundary>
  <UserProfile userId="123" />
</ErrorBoundary>;
```

### 5.3 类型安全

```typescript
// 使用 TypeScript 泛型
interface User {
  id: string;
  name: string;
  email: string;
}

function useUser(id: string): UseFetchReturn<User> {
  return useFetch<User>(`/api/users/${id}`);
}

// 使用类型守卫
function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    'email' in data
  );
}

function Component({ data }: { data: unknown }) {
  if (isUser(data)) {
    // data 被缩小为 User 类型
    console.log(data.name);
  }
}
```

---

## 6. 常见陷阱与解决方案

### 6.1 闭包陷阱

```typescript
// ❌ 错误：闭包中的旧值
function BadComponent() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      console.log(count); // ❌ 总是 0
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return <button onClick={() => setCount(c => c + 1)}>+1</button>;
}

// ✅ 正确：使用函数式更新
function GoodComponent() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount(c => c + 1); // ✅ 使用函数式更新
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return <div>{count}</div>;
}
```

### 6.2 依赖数组陷阱

```typescript
// ❌ 错误：依赖数组过大
function BadComponent() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');

  useEffect(() => {
    console.log(count);
  }, [count, name]); // ❌ name 不应该在依赖数组中
}

// ✅ 正确：只包含必要的依赖
function GoodComponent() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');

  useEffect(() => {
    console.log(count);
  }, [count]); // ✅ 只包含 count
}
```

### 6.3 性能陷阱

```typescript
// ❌ 错误：每次渲染都创建新对象
function BadComponent() {
  const [items, setItems] = useState<Item[]>([]);

  // 每次渲染都创建新函数，导致子组件重新渲染
  const handleClick = (id: string) => {
    console.log(id);
  };

  return items.map(item => (
    <Child key={item.id} item={item} onClick={handleClick} />
  ));
}

// ✅ 正确：使用 useCallback 优化
function GoodComponent() {
  const [items, setItems] = useState<Item[]>([]);

  const handleClick = useCallback((id: string) => {
    console.log(id);
  }, []);

  return items.map(item => (
    <Child key={item.id} item={item} onClick={handleClick} />
  ));
}
```

---

## 7. 总结：React 19 Hooks 最佳实践

| 场景 | 推荐 Hook | 说明 |
|------|-----------|------|
| **简单状态** | useState | 计数器、表单等 |
| **复杂状态** | useReducer | 多子值、状态转换逻辑复杂 |
| **副作用处理** | useEffect | 数据获取、订阅、事件监听 |
| **跨组件共享** | useContext | 主题、用户认证等 |
| **性能优化** | useMemo / useCallback | 缓存计算结果和函数 |
| **DOM 访问** | useRef | 访问 DOM 元素、存储可变值 |
| **非紧急更新** | useTransition | 搜索、过滤等 |
| **数据获取** | 自定义 Hook | useFetch、useSWR 等 |

**最佳实践**：
1. 优先使用函数式更新（`prev => prev + 1`）
2. 正确使用依赖数组（只包含必要的依赖）
3. 使用 useMemo useCallback 优化性能
4. 使用自定义 Hook 抽取业务逻辑
5. 使用 Error Boundary 捕获错误
6. 使用 TypeScript 泛型保证类型安全

---
*本文档持续更新，最后更新于 2026 年 3 月*
