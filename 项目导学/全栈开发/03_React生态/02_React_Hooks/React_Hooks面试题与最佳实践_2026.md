# React Hooks 面试题与最佳实践（2024-2026年）

## 目录

1. [React Hooks基础面试题](#1-react-hooks基础面试题)
2. [React Hooks原理深度解析](#2-react-hooks原理深度解析)
3. [自定义Hook面试题](#3-自定义hook面试题)
4. [React Hooks性能优化](#4-react-hooks性能优化)
5. [React Hooks最佳实践](#5-react-hooks最佳实践)
6. [经典面试题汇总](#6-经典面试题汇总)

---

## 1. React Hooks基础面试题

### 1.1 useState 原理与使用

#### 面试题1：useState 的工作原理是什么？

**考察频率**：⭐⭐⭐⭐⭐（必考）

**参考答案**：

```typescript
// useState 的本质：调度器 + 状态存储

// 1. useState 是一个 Hook，用于在函数组件中添加状态
const [state, setState] = useState(initialState);

// 2. useState 的内部实现（简化版）
function useState(initialState) {
  // React 内部维护一个状态队列
  const currentHook = ReactCurrentHook.current;
  
  // 创建状态对象
  const stateObject = {
    memoizedState: initialState,
    queue: {
      pending: null,
    },
  };
  
  // 返回状态和更新函数
  return [stateObject.memoizedState, dispatchAction.bind(null, currentHook.queue)];
}

// 3. 状态更新机制
function dispatchAction(queue, action) {
  // 创建更新对象
  const update = {
    action,
    next: null,
  };
  
  // 将更新加入队列
  queue.pending = update;
  
  // 触发调度
  scheduleUpdateOnFiber();
}
```

**关键点**：
- useState 使用**单向链表**存储更新队列
- 每次调用 useState 都会创建独立的状态对象
- 状态更新是**异步批量**处理的（React 18+）

---

#### 面试题2：useState 的函数式更新是什么？为什么需要使用它？

**考察频率**：⭐⭐⭐⭐⭐（高频）

**参考答案**：

```typescript
// ❌ 错误：直接使用状态值
function BadCounter() {
  const [count, setCount] = useState(0);

  const increment = () => {
    setCount(count + 1); // ❌ 闭包中的 count 是固定的
    setCount(count + 1); // ❌ 两次更新可能合并
    setCount(count + 1); // ❌ 最终只增加 1，而不是 3
  };
}

// ✅ 正确：使用函数式更新
function GoodCounter() {
  const [count, setCount] = useState(0);

  const increment = () => {
    setCount(prev => prev + 1); // ✅ 使用前一个状态
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);
    // ✅ 最终 count 增加 3
  };
}

// 批量更新示例
function BatchUpdate() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(count + 1);      // ❌ 闭包中的 count 是 0
    setCount(count + 1);      // ❌ 闭包中的 count 仍然是 0
    setCount(count + 1);      // ❌ 闭包中的 count 仍然是 0
    // 最终 count = 1，而不是 3
  };

  const handleClickCorrect = () => {
    setCount(prev => prev + 1);  // ✅ 使用前一个状态
    setCount(prev => prev + 1);  // ✅ 使用前一个状态
    setCount(prev => prev + 1);  // ✅ 使用前一个状态
    // ✅ 最终 count = 3
  };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={handleClick}>错误更新</button>
      <button onClick={handleClickCorrect}>正确更新</button>
    </div>
  );
}
```

**关键点**：
- 函数式更新使用**前一个状态**计算新状态
- 避免闭包陷阱，确保获取最新的状态值
- React 18+ 的批量更新中，函数式更新更加可靠

---

#### 面试题3：useState 如何处理对象和数组状态？

**考察频率**：⭐⭐⭐⭐（高频）

**参考答案**：

```typescript
// ❌ 错误：直接修改对象/数组
function BadComponent() {
  const [user, setUser] = useState({ name: '', email: '' });
  const [items, setItems] = useState<string[]>([]);

  const updateName = (name: string) => {
    user.name = name; // ❌ 直接修改对象
    setUser(user);    // ❌ 引用相同，不会触发重渲染
  };

  const addItem = (item: string) => {
    items.push(item); // ❌ 直接修改数组
    setItems(items);  // ❌ 引用相同，不会触发重渲染
  };
}

// ✅ 正确：创建新对象/数组
function GoodComponent() {
  const [user, setUser] = useState({ name: '', email: '' });
  const [items, setItems] = useState<string[]>([]);

  const updateName = (name: string) => {
    setUser(prev => ({ ...prev, name })); // ✅ 创建新对象
  };

  const addItem = (item: string) => {
    setItems(prev => [...prev, item]); // ✅ 创建新数组
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index)); // ✅ 过滤创建新数组
  };

  const updateItem = (index: number, newItem: string) => {
    setItems(prev =>
      prev.map((item, i) => (i === index ? newItem : item))
    ); // ✅ map 创建新数组
  };
}

// 使用 useImmer 简化（推荐）
import { useImmer } from 'use-immer';

function ComponentWithImmer() {
  const [user, updateUser] = useImmer({ name: '', email: '' });

  const updateName = (name: string) => {
    updateUser(draft => {
      draft.name = name; // 直接修改，useImmer 处理不可变
    });
  };

  return <input value={user.name} onChange={e => updateName(e.target.value)} />;
}
```

**关键点**：
- useState 不会自动合并对象/数组（与 class 组件的 setState 不同）
- 必须创建新的引用才能触发重渲染
- 使用 `useImmer` 可以简化不可变更新

---

### 1.2 useEffect 原理与使用

#### 面试题4：useEffect 和 useLayoutEffect 有什么区别？

**考察频率**：⭐⭐⭐⭐⭐（必考）

**参考答案**：

```typescript
// useEffect：异步执行，在浏览器绘制后执行
function useEffectExample() {
  useEffect(() => {
    console.log('useEffect: 绘制后执行');
  }, []);

  return <div>内容</div>;
}

// useLayoutEffect：同步执行，在 DOM 改变后、浏览器绘制前执行
function useLayoutExample() {
  useLayoutEffect(() => {
    console.log('useLayoutEffect: 绘制前执行');
  }, []);

  return <div>内容</div>;
}

// 执行顺序
function Component() {
  useEffect(() => {
    console.log('1. useEffect');
  }, []);

  useLayoutEffect(() => {
    console.log('2. useLayoutEffect');
  }, []);

  // 输出顺序：
  // 2. useLayoutEffect (同步，DOM 改变后立即执行)
  // 1. useEffect (异步，浏览器绘制后执行)
}
```

**执行时机对比**：

| Hook | 执行时机 | 适用场景 |
|------|---------|---------|
| `useEffect` | 浏览器绘制后 | 数据获取、订阅、日志、非紧急 DOM 操作 |
| `useLayoutEffect` | DOM 改变后、绘制前 | 测量 DOM、同步更新 UI、动画 |

**使用场景**：

```typescript
// useLayoutEffect：测量 DOM 尺寸
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

// useEffect：数据获取
function DataFetching() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData);
  }, []);

  return <div>{JSON.stringify(data)}</div>;
}
```

**关键点**：
- useLayoutEffect 是**同步**执行，会影响性能
- 尽量使用 useEffect，只有在需要立即读取/修改 DOM 时才使用 useLayoutEffect
- useLayoutEffect 会阻塞浏览器绘制

---

#### 面试题5：useEffect 的依赖数组如何正确使用？

**考察频率**：⭐⭐⭐⭐⭐（高频）

**参考答案**：

```typescript
// ❌ 错误：依赖数组为空，但使用了外部变量
function BadComponent({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser(userId).then(setUser); // ❌ userId 应该在依赖数组中
  }, []); // ❌ 依赖数组为空
}

// ✅ 正确：正确的依赖数组
function GoodComponent({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]); // ✅ 依赖 userId
}

// ❌ 错误：依赖对象引用
function BadObjectDependency() {
  const [count, setCount] = useState(0);
  const options = { a: 1 }; // 每次渲染创建新对象

  useEffect(() => {
    console.log(options);
  }, [options]); // ❌ 每次渲染都执行

  // ✅ 正确：使用 useMemo
  const memoizedOptions = useMemo(() => ({ a: 1 }), []);
  useEffect(() => {
    console.log(memoizedOptions);
  }, [memoizedOptions]);
}

// ❌ 错误：依赖函数引用
function BadFunctionDependency() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    console.log(count);
  };

  useEffect(() => {
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [handleClick]); // ❌ 每次渲染都创建新函数

  // ✅ 正确：使用 useCallback
  const handleClickCallback = useCallback(() => {
    console.log(count);
  }, [count]);

  useEffect(() => {
    window.addEventListener('click', handleClickCallback);
    return () => window.removeEventListener('click', handleClickCallback);
  }, [handleClickCallback]);
}

// ✅ 正确：空依赖数组（只在挂载时执行）
function DidMountExample() {
  useEffect(() => {
    console.log('组件挂载');
    // 适合：数据获取、订阅、添加事件监听器
  }, []);

  return <div>内容</div>;
}

// ✅ 正确：无依赖数组（每次渲染后执行）
function AlwaysRenderExample() {
  useEffect(() => {
    console.log('每次渲染后执行');
  });

  return <div>内容</div>;
}
```

**依赖数组规则**：

| 场景 | 依赖数组 | 说明 |
|------|---------|------|
| 只在挂载时执行 | `[]` | 数据获取、订阅、添加事件监听器 |
| 依赖特定变量 | `[variable]` | 变量变化时重新执行 |
| 依赖多个变量 | `[var1, var2]` | 任意变量变化时重新执行 |
| 每次渲染后执行 | `[]` 不写 | 不推荐，可能导致性能问题 |

**关键点**：
- 依赖数组必须包含所有在 effect 中使用的外部变量
- 使用 ESLint 插件 `eslint-plugin-react-hooks` 自动检查
- 空依赖数组不等于"只在挂载时执行"，而是"只在首次渲染时执行"

---

#### 面试题6：useEffect 的清理函数什么时候执行？

**考察频率**：⭐⭐⭐⭐（高频）

**参考答案**：

```typescript
// 清理函数在以下情况执行：
// 1. 组件卸载时
// 2. 下次 effect 执行前（依赖变化时）

function CleanupExample() {
  useEffect(() => {
    console.log('effect 执行');

    // 清理函数
    return () => {
      console.log('清理函数执行');
    };
  }, []); // 空依赖数组

  // 执行顺序：
  // 1. 首次渲染：effect 执行 -> 清理函数不执行
  // 2. 组件卸载：清理函数执行

  return <div>内容</div>;
}

function DependencyCleanupExample({ userId }) {
  useEffect(() => {
    console.log('effect 执行，userId:', userId);

    return () => {
      console.log('清理函数执行，userId:', userId);
    };
  }, [userId]);

  // 执行顺序：
  // 1. 首次渲染：effect 执行 -> 清理函数不执行
  // 2. userId 变化：清理函数执行 -> effect 执行
  // 3. 组件卸载：清理函数执行
}
```

**典型使用场景**：

```typescript
// 1. 订阅事件
function ChatRoom({ roomId }) {
  useEffect(() => {
    const subscription = chat.subscribe(roomId, onMessage);

    return () => {
      subscription.unsubscribe(); // 清理订阅
    };
  }, [roomId]);
}

// 2. 定时器
function Timer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval); // 清理定时器
  }, []);
}

// 3. 事件监听
function WindowSize() {
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

    return () => window.removeEventListener('resize', handleResize); // 清理事件监听
  }, []);
}

// 4. 数据获取（取消请求）
function DataFetching() {
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
      controller.abort(); // 取消请求
    };
  }, []);
}
```

**关键点**：
- 清理函数确保资源正确释放，避免内存泄漏
- 在清理函数中取消订阅、定时器、事件监听器、请求等
- 清理函数在组件卸载和依赖变化时都会执行

---

### 1.3 useContext 原理与使用

#### 面试题7：useContext 的工作原理是什么？

**考察频率**：⭐⭐⭐⭐（高频）

**参考答案**：

```typescript
// useContext 的本质：订阅 Context

// 1. 创建 Context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 2. 提供 Context
function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const value = useMemo(() => ({ theme, toggleTheme }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// 3. 使用 Context
function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme 必须在 ThemeProvider 内使用');
  }
  return context;
}

// useContext 的简化实现
function useContext(Context) {
  const dispatcher = ReactCurrentDispatcher.current;
  return dispatcher.readContext(Context);
}

// React 内部维护一个 Context 队列
// 当 Context.Provider 的 value 变化时，所有订阅的组件都会重新渲染
```

**关键点**：
- useContext 订阅 Context 的 value
- 当 Provider 的 value 变化时，所有订阅的组件都会重新渲染
- 使用 useMemo 优化 Provider 的 value，避免不必要的渲染

---

#### 面试题8：Context 性能优化有哪些方法？

**考察频率**：⭐⭐⭐⭐⭐（高频）

**参考答案**：

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

// ✅ 使用自定义 Hook 封装
function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser 必须在 UserProvider 内使用');
  }
  return context;
}

function useUserActions() {
  const context = useContext(UserActionsContext);
  if (!context) {
    throw new Error('useUserActions 必须在 UserProvider 内使用');
  }
  return context;
}
```

**性能优化策略**：

| 策略 | 说明 | 适用场景 |
|------|------|---------|
| useMemo 优化 value | 只在依赖变化时创建新对象 | 简单 Context |
| 拆分 Context | 将状态和操作分离 | 复杂 Context |
| 使用自定义 Hook | 封装 Context 逻辑 | 多处使用 Context |
| 条件渲染 Provider | 只在需要时渲染 Provider | 条件 Context |

**关键点**：
- Context 的 value 必须使用 useMemo 优化
- 复杂 Context 应该拆分成多个小 Context
- 使用自定义 Hook 封装 Context 逻辑

---

### 1.4 useReducer 原理与使用

#### 面试题9：useReducer 和 useState 有什么区别？

**考察频率**：⭐⭐⭐⭐（高频）

**参考答案**：

```typescript
// useState：适合简单状态
function Counter() {
  const [count, setCount] = useState(0);
  const increment = () => setCount(prev => prev + 1);
}

// useReducer：适合复杂状态
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

**对比表格**：

| 特性 | useState | useReducer |
|------|---------|-----------|
| 适用场景 | 简单状态 | 复杂状态 |
| 状态更新 | 直接设置值 | 分发 action |
| 逻辑复用 | 需要自定义 Hook | reducer 可复用 |
| 性能优化 | 需要 useCallback | dispatch 引用稳定 |
| 调试 | 较难 | 可使用 Redux DevTools |

**关键点**：
- useState 适合简单状态，useReducer 适合复杂状态
- useReducer 的 reducer 可以复用，便于测试
- useReducer 的 dispatch 引用稳定，不需要 useCallback

---

### 1.5 useMemo 与 useCallback

#### 面试题10：useMemo 和 useCallback 有什么区别？

**考察频率**：⭐⭐⭐⭐⭐（必考）

**参考答案**：

```typescript
// useMemo：缓存计算结果
function ExpensiveComponent({ items }: { items: number[] }) {
  // 缓存计算结果
  const sortedItems = useMemo(() => {
    console.log('重新排序');
    return [...items].sort((a, b) => a - b);
  }, [items]);

  return <div>{sortedItems.map(item => item)}</div>;
}

// useCallback：缓存函数引用
function ParentComponent() {
  const [count, setCount] = useState(0);

  // 缓存函数引用
  const handleClick = useCallback(() => {
    console.log(count);
  }, [count]);

  return (
    <div>
      <Child onClick={handleClick} />
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
    </div>
  );
}

// useCallback 等价于 useMemo
const handleClick = useCallback(() => {
  console.log(count);
}, [count]);

// 等价于
const handleClick = useMemo(() => {
  return () => console.log(count);
}, [count]);
```

**对比表格**：

| Hook | 缓存内容 | 适用场景 |
|------|---------|---------|
| useMemo | 计算结果 | 复杂计算、对象、数组 |
| useCallback | 函数引用 | 传递给子组件的函数 |

**经验法则**：

```typescript
// ✅ 正确使用场景
function App() {
  const [count, setCount] = useState(0);

  // 传给子组件的函数 -> useCallback
  const handleSubmit = useCallback((data: any) => {
    console.log('提交', data);
  }, []);

  // 传给子组件的对象 -> useMemo
  const config = useMemo(() => ({
    timeout: 5000,
    retry: 3
  }), []);

  // 简单值不需要 useMemo
  const upperName = name.toUpperCase(); // 直接执行

  return <Form onSubmit={handleSubmit} config={config} />;
}

// ❌ 不必要的优化
function OverOptimization() {
  const [name, setName] = useState('');

  // ❌ 简单计算不需要 useMemo
  const upperName = useMemo(() => name.toUpperCase(), [name]);

  // ❌ 没有传递给子组件的函数不需要 useCallback
  const handleChange = useCallback((e) => {
    setName(e.target.value);
  }, []);

  // ✅ 简单计算直接执行
  const upperNameCorrect = name.toUpperCase();

  // ✅ 直接定义
  const handleChangeCorrect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };
}
```

**关键点**：
- useMemo 缓存计算结果，useCallback 缓存函数引用
- useCallback(fn, deps) 等价于 useMemo(() => fn, deps)
- 不要过度优化，简单计算不需要 useMemo/useCallback

---

#### 面试题11：useMemo 和 useCallback 的性能优化陷阱

**考察频率**：⭐⭐⭐⭐（高频）

**参考答案**：

```typescript
// ❌ 陷阱1：不必要地使用 useMemo/useCallback
function OverOptimization() {
  const [name, setName] = useState('');

  // ❌ 简单计算不需要 useMemo
  const upperName = useMemo(() => name.toUpperCase(), [name]);

  // ❌ 简单函数不需要 useCallback
  const handleChange = useCallback((e) => {
    setName(e.target.value);
  }, []);

  // ✅ 简单计算直接执行
  const upperNameCorrect = name.toUpperCase();

  // ✅ 简单函数直接定义
  const handleChangeCorrect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };
}

// ❌ 陷阱2：依赖数组过大
function LargeDependency() {
  const [state1, setState1] = useState(0);
  const [state2, setState2] = useState(0);
  const [state3, setState3] = useState(0);

  // ❌ 依赖数组过大，容易触发重新计算
  const expensiveValue = useMemo(() => {
    return computeExpensiveValue(state1, state2, state3);
  }, [state1, state2, state3]);

  // ✅ 只依赖必要的状态
  const expensiveValueCorrect = useMemo(() => {
    return computeExpensiveValue(state1);
  }, [state1]);

  // ✅ 使用 useReducer 管理多个状态
  const [state, dispatch] = useReducer(reducer, initialState);
  const expensiveValueReducer = useMemo(() => {
    return computeExpensiveValue(state.mainState);
  }, [state.mainState]);
}

// ❌ 陷阱3：依赖对象引用
function ObjectDependency() {
  const [options, setOptions] = useState({ a: 1, b: 2 });

  // ❌ 每次渲染都创建新对象
  useEffect(() => {
    console.log(options);
  }, [options]); // 每次渲染都执行

  // ✅ 使用 useMemo 优化
  const memoizedOptions = useMemo(() => ({ a: 1, b: 2 }), []);
  useEffect(() => {
    console.log(memoizedOptions);
  }, [memoizedOptions]);
}

// ❌ 陷阱4：依赖函数引用
function FunctionDependency() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    console.log(count);
  };

  useEffect(() => {
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [handleClick]); // ❌ 每次渲染都创建新函数

  // ✅ 使用 useCallback 优化
  const handleClickCallback = useCallback(() => {
    console.log(count);
  }, [count]);

  useEffect(() => {
    window.addEventListener('click', handleClickCallback);
    return () => window.removeEventListener('click', handleClickCallback);
  }, [handleClickCallback]);
}
```

**性能优化建议**：

| 优化策略 | 说明 | 适用场景 |
|---------|------|---------|
| 避免过度优化 | 简单计算不需要 useMemo/useCallback | 简单逻辑 |
| 优化依赖数组 | 只依赖必要的变量 | 复杂依赖 |
| 使用 useMemo 优化对象 | 避免每次渲染创建新对象 | 对象、数组 |
| 使用 useCallback 优化函数 | 避免每次渲染创建新函数 | 传递给子组件的函数 |

**关键点**：
- 不要过度优化，简单逻辑不需要 useMemo/useCallback
- 依赖数组要精简，只依赖必要的变量
- 对象和函数使用 useMemo/useCallback 优化

---

### 1.6 useRef

#### 面试题12：useRef 的使用场景有哪些？

**考察频率**：⭐⭐⭐⭐⭐（必考）

**参考答案**：

```typescript
// 1. 访问 DOM 元素
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

// 2. 存储任意可变值（不触发重新渲染）
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

// 3. 保存上一次的值
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

// 4. 存储 mutable 值（跨渲染保持引用）
function Component() {
  const countRef = useRef(0);

  const increment = () => {
    countRef.current++; // 不触发重新渲染
    console.log(countRef.current);
  };

  return <button onClick={increment}>点击</button>;
}

// 5. 存储上一次的 props
function usePreviousProps<T>(value: T): T {
  const ref = useRef<T>(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

function ComponentWithProps({ count }: { count: number }) {
  const previousCount = usePreviousProps(count);

  return (
    <div>
      <p>当前: {count}</p>
      <p>上次: {previousCount}</p>
    </div>
  );
}
```

**useRef vs useState**：

| 特性 | useRef | useState |
|------|-------|---------|
| 触发重渲染 | ❌ 不触发 | ✅ 触发 |
| 初始值惰性初始化 | ❌ 不支持 | ✅ 支持 |
| 适用场景 | DOM、可变值 | 状态管理 |
| 类型安全 | ⚠️ 需要断言 | ✅ 类型安全 |

**关键点**：
- useRef 不触发重新渲染，适合存储可变值
- useRef 可以用于保存上一次的值
- useRef 适合存储 DOM 引用、定时器 ID 等

---

#### 面试题13：useImperativeHandle 的作用是什么？

**考察频率**：⭐⭐⭐⭐（高频）

**参考答案**：

```typescript
// useImperativeHandle：自定义暴露给父组件的实例值

// ❌ 不使用 useImperativeHandle
const Child = forwardRef((props, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // ref 直接指向 input 元素
  return <input ref={ref} />;
});

function Parent() {
  const ref = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    ref.current?.focus(); // 直接操作 input
  };

  return (
    <div>
      <Child ref={ref} />
      <button onClick={handleClick}>聚焦</button>
    </div>
  );
}

// ✅ 使用 useImperativeHandle
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
  const ref = useRef<{
    focus: () => void;
    getValue: () => string;
    clear: () => void;
  }>(null);

  const handleClick = () => {
    ref.current?.focus();
    console.log(ref.current?.getValue());
  };

  return (
    <div>
      <Child ref={ref} />
      <button onClick={handleClick}>操作子组件</button>
    </div>
  );
}
```

**使用场景**：

```typescript
// 场景1：自定义 API
const Modal = forwardRef((props, ref) => {
  const [isOpen, setIsOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev)
  }));

  return (
    <div className={isOpen ? 'modal open' : 'modal'}>
      {props.children}
    </div>
  );
});

// 父组件使用
function Parent() {
  const modalRef = useRef<{ open: () => void; close: () => void }>(null);

  return (
    <div>
      <Modal ref={modalRef}>内容</Modal>
      <button onClick={() => modalRef.current?.open()}>打开</button>
      <button onClick={() => modalRef.current?.close()}>关闭</button>
    </div>
  );
}

// 场景2：表单 API
const Form = forwardRef((props, ref) => {
  const formRef = useRef<HTMLFormElement>(null);

  useImperativeHandle(ref, () => ({
    submit: () => {
      formRef.current?.requestSubmit();
    },
    reset: () => {
      formRef.current?.reset();
    },
    validate: (): boolean => {
      return formRef.current?.checkValidity() ?? false;
    }
  }));

  return <form ref={formRef}>{props.children}</form>;
});

// 父组件使用
function Parent() {
  const formRef = useRef<{
    submit: () => void;
    reset: () => void;
    validate: () => boolean;
  }>(null);

  return (
    <div>
      <Form ref={formRef}>
        <input name="email" type="email" required />
        <button type="submit">提交</button>
      </Form>
      <button onClick={() => formRef.current?.submit()}>提交表单</button>
      <button onClick={() => formRef.current?.reset()}>重置表单</button>
    </div>
  );
}
```

**关键点**：
- useImperativeHandle 自定义暴露给父组件的实例值
- 与 forwardRef 配合使用
- 避免暴露不必要的 DOM API

---

### 1.7 useTransition 与 useDeferredValue

#### 面试题14：useTransition 和 useDeferredValue 的作用是什么？

**考察频率**：⭐⭐⭐⭐（高频）

**参考答案**：

```typescript
// useTransition：标记非紧急更新

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

// 完整示例
function SearchApp() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    startTransition(() => {
      setQuery(e.target.value);
    });
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="搜索..."
      />

      {isPending && <div>搜索中...</div>}

      <SearchResults query={query} />
    </div>
  );
}

function SearchResults({ query }: { query: string }) {
  const deferredQuery = useDeferredValue(query);

  // 模拟 expensive 组件
  const results = useMemo(() => {
    console.log('计算搜索结果');
    return simulateExpensiveSearch(deferredQuery);
  }, [deferredQuery]);

  return (
    <ul>
      {results.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}

function simulateExpensiveSearch(query: string) {
  // 模拟 expensive 计算
  const start = performance.now();
  while (performance.now() - start < 100) {
    // 空循环模拟计算
  }

  if (!query) return [];

  return [
    { id: 1, name: `结果1 - ${query}` },
    { id: 2, name: `结果2 - ${query}` },
    { id: 3, name: `结果3 - ${query}` },
  ];
}
```

**使用场景**：

| Hook | 适用场景 |
|------|---------|
| useTransition | 标记非紧急更新，如搜索输入 |
| useDeferredValue | 延迟非紧急值，如 expensive 组件的 props |

**关键点**：
- useTransition 标记更新为非紧急，允许 UI 优先响应用户交互
- useDeferredValue 延迟值的更新，用于 expensive 组件
- 两者配合使用，提升用户体验

---

## 2. React Hooks原理深度解析

### 2.1 Hooks 调用机制

#### 面试题15：React Hooks 的调用机制是什么？

**考察频率**：⭐⭐⭐⭐⭐（必考）

**参考答案**：

```typescript
// React Hooks 使用链表存储状态

// 1. 每个组件有一个 memoizedState 链表
// 2. 每次调用 Hook 都会创建一个节点
// 3. Hook 调用顺序必须固定

function Component() {
  const [a, setA] = useState(0); // 节点1
  const [b, setB] = useState(1); // 节点2
  const [c, setC] = useState(2); // 节点3

  // 链表结构：
  // memoizedState: { memoizedState: 0, next: { memoizedState: 1, next: { memoizedState: 2, next: null } } }
}

// ❌ 错误：Hook 调用顺序不固定
function BadComponent({ condition }) {
  if (condition) {
    const [a, setA] = useState(0); // 条件调用
  }

  const [b, setB] = useState(1); // 顺序不固定
}

// ✅ 正确：Hook 调用顺序固定
function GoodComponent({ condition }) {
  const [a, setA] = useState(0);
  const [b, setB] = useState(1);

  if (condition) {
    // 使用 state，而不是调用 useState
  }
}

// React 内部实现（简化版）
let workInProgressHook = null;

function useState(initialState) {
  // 获取当前 hook
  const currentHook = currentHookNode;
  
  // 创建新的 hook
  const newHook = {
    memoizedState: initialState,
    queue: {
      pending: null,
    },
    next: null,
  };

  // 将 hook 加入链表
  if (workInProgressHook === null) {
    // 第一个 hook
    workInProgressHook = newHook;
  } else {
    // 后续 hook
    workInProgressHook.next = newHook;
    workInProgressHook = newHook;
  }

  return [newHook.memoizedState, dispatchAction.bind(null, newHook.queue)];
}
```

**关键点**：
- React 使用链表存储 Hook 状态
- Hook 调用顺序必须固定（只在顶层调用）
- Hook 顺序与组件渲染次数无关

---

### 2.2 Hooks 依赖数组原理

#### 面试题16：useEffect 依赖数组的原理是什么？

**考察频率**：⭐⭐⭐⭐⭐（必考）

**参考答案**：

```typescript
// useEffect 依赖数组的原理

function useEffect(callback, deps) {
  // 获取当前 fiber
  const fiber = ReactCurrentFiber.current;

  // 获取当前 hook
  const currentHook = fiber.memoizedState;

  // 比较依赖数组
  if (currentHook) {
    const oldDeps = currentHook.memoizedState;
    if (depsAreEqual(deps, oldDeps)) {
      // 依赖未变化，跳过 effect
      return;
    }
  }

  // 安排 effect
  scheduleEffect(callback, deps);

  // 更新 hook
  updateHook({
    memoizedState: deps,
    next: null,
  });
}

// 依赖比较
function depsAreEqual(nextDeps, prevDeps) {
  if (prevDeps === null) {
    return false;
  }

  if (nextDeps.length !== prevDeps.length) {
    return false;
  }

  for (let i = 0; i < nextDeps.length; i++) {
    if (Object.is(nextDeps[i], prevDeps[i])) {
      continue;
    }
    return false;
  }

  return true;
}
```

**关键点**：
- useEffect 依赖数组使用 `Object.is` 比较
- 依赖数组为 null 时总是执行
- 依赖数组长度不同时总是执行
- 使用 `Object.is` 比较，而不是 `===`

---

### 2.3 Hooks 性能优化原理

#### 面试题17：React Hooks 性能优化的原理是什么？

**考察频率**：⭐⭐⭐⭐（高频）

**参考答案**：

```typescript
// 1. useState 惰性初始化

// ❌ 错误：每次渲染都执行
function BadComponent() {
  const [state, setState] = useState(computeExpensiveValue());
}

// ✅ 正确：只在首次渲染执行
function GoodComponent() {
  const [state, setState] = useState(() => {
    console.log('初始化状态');
    return computeExpensiveValue();
  });
}

// 2. useMemo 缓存计算结果

function ExpensiveComponent({ items }: { items: number[] }) {
  // ❌ 错误：每次渲染都重新计算
  // const sortedItems = items.sort((a, b) => a - b);

  // ✅ 正确：使用 useMemo 缓存
  const sortedItems = useMemo(() => {
    console.log('重新排序');
    return [...items].sort((a, b) => a - b);
  }, [items]);

  return <div>{sortedItems.map(item => item)}</div>;
}

// 3. useCallback 缓存函数引用

function ParentComponent() {
  const [count, setCount] = useState(0);

  // ❌ 错误：每次渲染都创建新函数
  // const handleClick = () => {
  //   console.log(count);
  // };

  // ✅ 正确：使用 useCallback 缓存
  const handleClick = useCallback(() => {
    console.log(count);
  }, [count]);

  return <Child onClick={handleClick} />;
}

// 4. React.memo 避免不必要的重渲染

const Child = React.memo(({ onClick, data }) => {
  console.log('Child 渲染');
  return <button onClick={onClick}>{data.label}</button>;
});

function Parent() {
  const [count, setCount] = useState(0);

  // ❌ 错误：每次渲染都创建新函数
  // const handleClick = () => {
  //   console.log('click');
  // };

  // ✅ 正确：使用 useCallback 保持函数引用不变
  const handleClick = useCallback(() => {
    console.log('click');
  }, []);

  return (
    <div>
      <Child onClick={handleClick} data={{ label: '按钮' }} />
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
    </div>
  );
}

// 5. 拆分 Context 避免不必要的渲染

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

**性能优化策略**：

| 优化策略 | 说明 | 适用场景 |
|---------|------|---------|
| 惰性初始化 | 只在首次渲染执行 | 复杂初始化 |
| useMemo 缓存 | 缓存计算结果 | 复杂计算 |
| useCallback 缓存 | 缓存函数引用 | 传递给子组件的函数 |
| React.memo | 避免不必要的重渲染 | 子组件优化 |
| 拆分 Context | 将状态和操作分离 | 复杂 Context |

**关键点**：
- 惰性初始化避免每次渲染都执行
- useMemo/useCallback 避免不必要的计算和渲染
- React.memo 避免子组件不必要的重渲染
- 拆分 Context 避免不必要的渲染

---

## 3. 自定义Hook面试题

### 3.1 自定义 Hook 基础

#### 面试题18：如何编写自定义 Hook？

**考察频率**：⭐⭐⭐⭐⭐（必考）

**参考答案**：

```typescript
// 自定义 Hook 的基本结构

// 1. 函数名以 "use" 开头
// 2. 可以使用其他 Hook
// 3. 返回值可以是任何类型

// 示例：useWindowSize
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

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return size;
}

// 使用
function Component() {
  const { width, height } = useWindowSize();

  return (
    <div>
      <p>宽度: {width}</p>
      <p>高度: {height}</p>
    </div>
  );
}

// 示例：useDebounce
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

// 示例：useClickOutside
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
      <button onClick={() => setIsOpen(!isOpen)}>下拉菜单</button>
      {isOpen && <div>菜单内容</div>}
    </div>
  );
}
```

**关键点**：
- 自定义 Hook 函数名以 "use" 开头
- 可以使用其他 Hook
- 返回值可以是任何类型
- 遵循 Hooks 使用规则

---

### 3.2 自定义 Hook 高级

#### 面试题19：自定义 Hook 的最佳实践是什么？

**考察频率**：⭐⭐⭐⭐（高频）

**参考答案**：

```typescript
// 1. 使用 TypeScript 类型

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

// 2. 提供默认值

function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      const valueToStore = value instanceof Function
        ? value(storedValue)
        : value;

      setStoredValue(valueToStore);

      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

// 3. 返回稳定的引用

function useCounter(initialCount = 0) {
  const [count, setCount] = useState(initialCount);

  const increment = useCallback(() => {
    setCount(prev => prev + 1);
  }, []);

  const decrement = useCallback(() => {
    setCount(prev => prev - 1);
  }, []);

  const reset = useCallback(() => {
    setCount(initialCount);
  }, [initialCount]);

  return { count, increment, decrement, reset };
}

// 4. 错误处理

function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = true
) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(() => {
    setStatus('pending');
    setData(null);
    setError(null);

    asyncFunction()
      .then((response: T) => {
        setData(response);
        setStatus('success');
      })
      .catch((error: Error) => {
        setError(error);
        setStatus('error');
      });
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { execute, status, data, error };
}

// 使用
function Component() {
  const { execute, status, data, error } = useAsync(() => {
    return fetch('/api/data').then(res => res.json());
  });

  if (status === 'pending') return <div>加载中...</div>;
  if (status === 'error') return <div>错误: {error?.message}</div>;
  if (status === 'success') return <div>{JSON.stringify(data)}</div>;

  return <button onClick={execute}>加载数据</button>;
}

// 5. 自定义 Hook 命名规范

// ✅ 正确：描述功能
function useWindowSize() { ... }
function useDebounce<T>(value: T, delay: number): T { ... }
function useClickOutside(ref, handler) { ... }
function useFetch<T>(url: string): UseFetchReturn<T> { ... }
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] { ... }

// ❌ 错误：不描述功能
function useA() { ... }
function useB() { ... }
function useHandler() { ... }
```

**关键点**：
- 使用 TypeScript 类型
- 提供默认值
- 返回稳定的引用
- 错误处理
- 描述性的命名

---

## 4. React Hooks性能优化

### 4.1 性能优化技巧

#### 面试题20：React Hooks 性能优化有哪些技巧？

**考察频率**：⭐⭐⭐⭐⭐（必考）

**参考答案**：

```typescript
// 1. 使用 React DevTools Profiler

// 在组件上添加 profiler
<React.Profiler id="Component" onRender={onRenderCallback}>
  <Component />
</React.Profiler>

function onRenderCallback(
  id, // 发生提交的 Profiler 树的 "id"
  phase, // "mount" 或 "update"
  actualDuration, // 本次更新实际花费的时间
  baseDuration, // 估算的渲染时间
  startTime, // React 开始渲染的时间
  commitTime, // React 提交渲染的时间
  interactions // 本次更新相关的交互
) {
  console.log(`${id}'s ${phase} phase`);
  console.log(`actualDuration: ${actualDuration}ms`);
  console.log(`baseDuration: ${baseDuration}ms`);
}

// 2. 使用 useMemo 缓存计算结果

function ExpensiveComponent({ items }: { items: number[] }) {
  // ❌ 错误：每次渲染都重新计算
  // const sortedItems = items.sort((a, b) => a - b);

  // ✅ 正确：使用 useMemo 缓存
  const sortedItems = useMemo(() => {
    console.log('重新排序');
    return [...items].sort((a, b) => a - b);
  }, [items]);

  return <div>{sortedItems.map(item => item)}</div>;
}

// 3. 使用 useCallback 缓存函数引用

function ParentComponent() {
  const [count, setCount] = useState(0);

  // ❌ 错误：每次渲染都创建新函数
  // const handleClick = () => {
  //   console.log(count);
  // };

  // ✅ 正确：使用 useCallback 缓存
  const handleClick = useCallback(() => {
    console.log(count);
  }, [count]);

  return <Child onClick={handleClick} />;
}

// 4. 使用 React.memo 避免不必要的重渲染

const Child = React.memo(({ onClick, data }) => {
  console.log('Child 渲染');
  return <button onClick={onClick}>{data.label}</button>;
});

function Parent() {
  const [count, setCount] = useState(0);

  // ❌ 错误：每次渲染都创建新函数
  // const handleClick = () => {
  //   console.log('click');
  // };

  // ✅ 正确：使用 useCallback 保持函数引用不变
  const handleClick = useCallback(() => {
    console.log('click');
  }, []);

  return (
    <div>
      <Child onClick={handleClick} data={{ label: '按钮' }} />
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
    </div>
  );
}

// 5. 拆分 Context 避免不必要的渲染

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

// 6. 使用 useTransition 标记非紧急更新

function SearchResults() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

// 7. 使用 useDeferredValue 延迟非紧急值

function SearchResults({ query }: { query: string }) {
  const deferredQuery = useDeferredValue(query);

  return <ExpensiveComponent query={deferredQuery} />;
}

// 8. 使用 useId 生成唯一 ID

function Form() {
  const id = useId();

  return (
    <div>
      <label htmlFor={id}>姓名</label>
      <input id={id} type="text" />
    </div>
  );
}

// 9. 使用 useOptimistic 乐观更新

function TodoList({ todos, addTodo }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo) => [
      ...state,
      { ...newTodo, id: 'temp-' + Date.now(), pending: true }
    ]
  );

  async function handleSubmit(formData) {
    const title = formData.get('title');

    addOptimisticTodo({ title, completed: false });

    await addTodo(title);
  }

  return (
    <div>
      <ul>
        {optimisticTodos.map(todo => (
          <li key={todo.id}>
            {todo.title}
            {todo.pending && <span> (保存中...)</span>}
          </li>
        ))}
      </ul>

      <form action={handleSubmit}>
        <input name="title" placeholder="添加待办事项" />
        <button type="submit">添加</button>
      </form>
    </div>
  );
}

// 10. 使用 useActionState 管理表单状态

async function createPost(prevState, formData) {
  'use server';

  const title = formData.get('title');
  const content = formData.get('content');

  if (!title || title.length < 3) {
    return { error: '标题至少需要3个字符' };
  }

  if (!content) {
    return { error: '内容不能为空' };
  }

  try {
    await db.posts.create({ data: { title, content } });
    return { success: true, message: '文章创建成功' };
  } catch (error) {
    return { error: '创建失败，请重试' };
  }
}

function CreatePostForm() {
  const [state, formAction, isPending] = useActionState(createPost, null);

  return (
    <form action={formAction}>
      <input name="title" />
      <textarea name="content" />
      <button type="submit" disabled={isPending}>
        {isPending ? '创建中...' : '创建文章'}
      </button>

      {state?.error && <p className="error">{state.error}</p>}
      {state?.success && <p className="success">{state.message}</p>}
    </form>
  );
}
```

**性能优化策略**：

| 优化策略 | 说明 | 适用场景 |
|---------|------|---------|
| React DevTools Profiler | 分析性能瓶颈 | 性能调试 |
| useMemo 缓存 | 缓存计算结果 | 复杂计算 |
| useCallback 缓存 | 缓存函数引用 | 传递给子组件的函数 |
| React.memo | 避免不必要的重渲染 | 子组件优化 |
| 拆分 Context | 将状态和操作分离 | 复杂 Context |
| useTransition | 标记非紧急更新 | 搜索输入 |
| useDeferredValue | 延迟非紧急值 | expensive 组件 |
| useId | 生成唯一 ID | 表单 label |
| useOptimistic | 乐观更新 | 表单提交 |
| useActionState | 表单状态管理 | 表单处理 |

**关键点**：
- 使用 React DevTools Profiler 分析性能瓶颈
- useMemo/useCallback 避免不必要的计算和渲染
- React.memo 避免子组件不必要的重渲染
- 拆分 Context 避免不必要的渲染
- useTransition/useDeferredValue 提升用户体验

---

## 5. React Hooks最佳实践

### 5.1 最佳实践

#### 面试题21：React Hooks 最佳实践有哪些？

**考察频率**：⭐⭐⭐⭐⭐（必考）

**参考答案**：

```typescript
// 1. 遵循 Hooks 使用规则

// ✅ 正确：只在顶层调用 Hook
function GoodComponent() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);

  if (condition) {
    // 使用 state，而不是调用 useState
  }
}

// ❌ 错误：在条件或循环中调用 Hook
function BadComponent() {
  if (condition) {
    const [a, setA] = useState(0); // ❌ 错误
  }

  for (let i = 0; i < 10; i++) {
    const [b, setB] = useState(i); // ❌ 错误
  }
}

// 2. 使用 ESLint 插件

// .eslintrc.js
module.exports = {
  plugins: ['react-hooks'],
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
};

// 3. 使用函数式更新

// ✅ 正确：使用函数式更新
function Counter() {
  const [count, setCount] = useState(0);

  const increment = () => {
    setCount(prev => prev + 1);
  };
}

// ❌ 错误：直接使用状态值
function BadCounter() {
  const [count, setCount] = useState(0);

  const increment = () => {
    setCount(count + 1); // ❌ 闭包中的 count 是固定的
  };
}

// 4. 使用 useMemo 优化对象和数组

// ✅ 正确：使用 useMemo 优化
function Component({ items }) {
  const config = useMemo(() => ({
    timeout: 5000,
    retry: 3,
  }), []);

  const filteredItems = useMemo(() => {
    return items.filter(item => item.name.length > 0);
  }, [items]);
}

// ❌ 错误：每次渲染都创建新对象
function BadComponent({ items }) {
  const config = { timeout: 5000, retry: 3 }; // ❌ 每次渲染都创建新对象

  const filteredItems = items.filter(item => item.name.length > 0); // ❌ 每次渲染都创建新数组
}

// 5. 使用 useCallback 优化函数

// ✅ 正确：使用 useCallback 优化
function ParentComponent() {
  const handleClick = useCallback(() => {
    console.log('click');
  }, []);

  return <Child onClick={handleClick} />;
}

// ❌ 错误：每次渲染都创建新函数
function BadComponent() {
  const handleClick = () => {
    console.log('click');
  }; // ❌ 每次渲染都创建新函数

  return <Child onClick={handleClick} />;
}

// 6. 使用 useImmer 简化不可变更新

import { useImmer } from 'use-immer';

function Component() {
  const [user, updateUser] = useImmer({ name: '', email: '' });

  const updateName = (name: string) => {
    updateUser(draft => {
      draft.name = name; // 直接修改
    });
  };
}

// 7. 使用自定义 Hook 封装逻辑

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

// 8. 使用 Context API 管理全局状态

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const value = useMemo(() => ({ theme, toggleTheme }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme 必须在 ThemeProvider 内使用');
  }
  return context;
}

// 9. 使用 useTransition 和 useDeferredValue 提升用户体验

function SearchResults() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

// 10. 使用 useId 生成唯一 ID

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

**最佳实践总结**：

| 最佳实践 | 说明 |
|---------|------|
| 遵循 Hooks 使用规则 | 只在顶层调用 Hook |
| 使用 ESLint 插件 | 自动检查 Hooks 规则 |
| 使用函数式更新 | 避免闭包陷阱 |
| 使用 useMemo 优化 | 缓存计算结果 |
| 使用 useCallback 优化 | 缓存函数引用 |
| 使用 useImmer | 简化不可变更新 |
| 使用自定义 Hook | 封装逻辑 |
| 使用 Context API | 管理全局状态 |
| 使用 useTransition | 提升用户体验 |
| 使用 useId | 生成唯一 ID |

**关键点**：
- 遵循 Hooks 使用规则
- 使用 ESLint 插件自动检查
- 使用函数式更新避免闭包陷阱
- 使用 useMemo/useCallback 优化性能
- 使用自定义 Hook 封装逻辑

---

## 6. 经典面试题汇总

### 6.1 基础面试题

#### 面试题22：React Hooks 有哪些规则？

**参考答案**：

```typescript
// 1. 只在最顶层使用 Hook
// ❌ 错误：在循环、条件或嵌套函数中调用
function BadComponent() {
  if (condition) {
    const [value, setValue] = useState(0); // 错误！
  }

  for (let i = 0; i < 10; i++) {
    const [item, setItem] = useState(i); // 错误！
  }
}

// ✅ 正确：在组件顶层调用
function GoodComponent() {
  const [value, setValue] = useState(0);
  const [items, setItems] = useState([]);

  if (condition) {
    // 使用Hook返回的值
  }
}

// 2. 只在React函数中调用Hook
// ✅ 正确：在函数组件中
function Component() {
  const [state, setState] = useState(0);
}

// ✅ 正确：在自定义Hook中
function useCustomHook() {
  const [state, setState] = useState(0);
  return state;
}

// ❌ 错误：在普通函数中
function regularFunction() {
  const [state, setState] = useState(0); // 错误！
}

// 使用ESLint插件强制规则
// npm install eslint-plugin-react-hooks --save-dev
// .eslintrc.js
module.exports = {
  plugins: ['react-hooks'],
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
};
```

**关键点**：
- 只在顶层调用 Hook
- 只在 React 函数中调用 Hook
- 使用 ESLint 插件自动检查

---

#### 面试题23：useState 和 useReducer 有什么区别？

**参考答案**：

```typescript
// useState：适合简单状态
function Counter() {
  const [count, setCount] = useState(0);
  const increment = () => setCount(prev => prev + 1);
}

// useReducer：适合复杂状态
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

**对比表格**：

| 特性 | useState | useReducer |
|------|---------|-----------|
| 适用场景 | 简单状态 | 复杂状态 |
| 状态更新 | 直接设置值 | 分发 action |
| 逻辑复用 | 需要自定义 Hook | reducer 可复用 |
| 性能优化 | 需要 useCallback | dispatch 引用稳定 |
| 调试 | 较难 | 可使用 Redux DevTools |

**关键点**：
- useState 适合简单状态，useReducer 适合复杂状态
- useReducer 的 reducer 可以复用，便于测试
- useReducer 的 dispatch 引用稳定，不需要 useCallback

---

#### 面试题24：useEffect 和 useLayoutEffect 有什么区别？

**参考答案**：

```typescript
// useEffect：异步执行，在浏览器绘制后执行
function useEffectExample() {
  useEffect(() => {
    console.log('useEffect: 绘制后执行');
  }, []);

  return <div>内容</div>;
}

// useLayoutEffect：同步执行，在 DOM 改变后、浏览器绘制前执行
function useLayoutExample() {
  useLayoutEffect(() => {
    console.log('useLayoutEffect: 绘制前执行');
  }, []);

  return <div>内容</div>;
}

// 执行顺序
function Component() {
  useEffect(() => {
    console.log('1. useEffect');
  }, []);

  useLayoutEffect(() => {
    console.log('2. useLayoutEffect');
  }, []);

  // 输出顺序：
  // 2. useLayoutEffect (同步，DOM 改变后立即执行)
  // 1. useEffect (异步，浏览器绘制后执行)
}
```

**执行时机对比**：

| Hook | 执行时机 | 适用场景 |
|------|---------|---------|
| `useEffect` | 浏览器绘制后 | 数据获取、订阅、日志、非紧急 DOM 操作 |
| `useLayoutEffect` | DOM 改变后、绘制前 | 测量 DOM、同步更新 UI、动画 |

**关键点**：
- useLayoutEffect 是**同步**执行，会影响性能
- 尽量使用 useEffect，只有在需要立即读取/修改 DOM 时才使用 useLayoutEffect
- useLayoutEffect 会阻塞浏览器绘制

---

### 6.2 进阶面试题

#### 面试题25：React Hooks 的工作原理是什么？

**参考答案**：

```typescript
// React Hooks 使用链表存储状态

// 1. 每个组件有一个 memoizedState 链表
// 2. 每次调用 Hook 都会创建一个节点
// 3. Hook 调用顺序必须固定

function Component() {
  const [a, setA] = useState(0); // 节点1
  const [b, setB] = useState(1); // 节点2
  const [c, setC] = useState(2); // 节点3

  // 链表结构：
  // memoizedState: { memoizedState: 0, next: { memoizedState: 1, next: { memoizedState: 2, next: null } } }
}

// ❌ 错误：Hook 调用顺序不固定
function BadComponent({ condition }) {
  if (condition) {
    const [a, setA] = useState(0); // 条件调用
  }

  const [b, setB] = useState(1); // 顺序不固定
}

// ✅ 正确：Hook 调用顺序固定
function GoodComponent({ condition }) {
  const [a, setA] = useState(0);
  const [b, setB] = useState(1);

  if (condition) {
    // 使用 state，而不是调用 useState
  }
}

// React 内部实现（简化版）
let workInProgressHook = null;

function useState(initialState) {
  // 获取当前 hook
  const currentHook = currentHookNode;
  
  // 创建新的 hook
  const newHook = {
    memoizedState: initialState,
    queue: {
      pending: null,
    },
    next: null,
  };

  // 将 hook 加入链表
  if (workInProgressHook === null) {
    // 第一个 hook
    workInProgressHook = newHook;
  } else {
    // 后续 hook
    workInProgressHook.next = newHook;
    workInProgressHook = newHook;
  }

  return [newHook.memoizedState, dispatchAction.bind(null, newHook.queue)];
}
```

**关键点**：
- React 使用链表存储 Hook 状态
- Hook 调用顺序必须固定（只在顶层调用）
- Hook 顺序与组件渲染次数无关

---

#### 面试题26：useEffect 依赖数组的原理是什么？

**参考答案**：

```typescript
// useEffect 依赖数组的原理

function useEffect(callback, deps) {
  // 获取当前 fiber
  const fiber = ReactCurrentFiber.current;

  // 获取当前 hook
  const currentHook = fiber.memoizedState;

  // 比较依赖数组
  if (currentHook) {
    const oldDeps = currentHook.memoizedState;
    if (depsAreEqual(deps, oldDeps)) {
      // 依赖未变化，跳过 effect
      return;
    }
  }

  // 安排 effect
  scheduleEffect(callback, deps);

  // 更新 hook
  updateHook({
    memoizedState: deps,
    next: null,
  });
}

// 依赖比较
function depsAreEqual(nextDeps, prevDeps) {
  if (prevDeps === null) {
    return false;
  }

  if (nextDeps.length !== prevDeps.length) {
    return false;
  }

  for (let i = 0; i < nextDeps.length; i++) {
    if (Object.is(nextDeps[i], prevDeps[i])) {
      continue;
    }
    return false;
  }

  return true;
}
```

**关键点**：
- useEffect 依赖数组使用 `Object.is` 比较
- 依赖数组为 null 时总是执行
- 依赖数组长度不同时总是执行
- 使用 `Object.is` 比较，而不是 `===`

---

#### 面试题27：React Hooks 性能优化有哪些技巧？

**参考答案**：

```typescript
// 1. 使用 React DevTools Profiler

// 在组件上添加 profiler
<React.Profiler id="Component" onRender={onRenderCallback}>
  <Component />
</React.Profiler>

function onRenderCallback(
  id, // 发生提交的 Profiler 树的 "id"
  phase, // "mount" 或 "update"
  actualDuration, // 本次更新实际花费的时间
  baseDuration, // 估算的渲染时间
  startTime, // React 开始渲染的时间
  commitTime, // React 提交渲染的时间
  interactions // 本次更新相关的交互
) {
  console.log(`${id}'s ${phase} phase`);
  console.log(`actualDuration: ${actualDuration}ms`);
  console.log(`baseDuration: ${baseDuration}ms`);
}

// 2. 使用 useMemo 缓存计算结果

function ExpensiveComponent({ items }: { items: number[] }) {
  // ❌ 错误：每次渲染都重新计算
  // const sortedItems = items.sort((a, b) => a - b);

  // ✅ 正确：使用 useMemo 缓存
  const sortedItems = useMemo(() => {
    console.log('重新排序');
    return [...items].sort((a, b) => a - b);
  }, [items]);

  return <div>{sortedItems.map(item => item)}</div>;
}

// 3. 使用 useCallback 缓存函数引用

function ParentComponent() {
  const [count, setCount] = useState(0);

  // ❌ 错误：每次渲染都创建新函数
  // const handleClick = () => {
  //   console.log(count);
  // };

  // ✅ 正确：使用 useCallback 缓存
  const handleClick = useCallback(() => {
    console.log(count);
  }, [count]);

  return <Child onClick={handleClick} />;
}

// 4. 使用 React.memo 避免不必要的重渲染

const Child = React.memo(({ onClick, data }) => {
  console.log('Child 渲染');
  return <button onClick={onClick}>{data.label}</button>;
});

function Parent() {
  const [count, setCount] = useState(0);

  // ❌ 错误：每次渲染都创建新函数
  // const handleClick = () => {
  //   console.log('click');
  // };

  // ✅ 正确：使用 useCallback 保持函数引用不变
  const handleClick = useCallback(() => {
    console.log('click');
  }, []);

  return (
    <div>
      <Child onClick={handleClick} data={{ label: '按钮' }} />
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
    </div>
  );
}

// 5. 拆分 Context 避免不必要的渲染

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

**性能优化策略**：

| 优化策略 | 说明 | 适用场景 |
|---------|------|---------|
| React DevTools Profiler | 分析性能瓶颈 | 性能调试 |
| useMemo 缓存 | 缓存计算结果 | 复杂计算 |
| useCallback 缓存 | 缓存函数引用 | 传递给子组件的函数 |
| React.memo | 避免不必要的重渲染 | 子组件优化 |
| 拆分 Context | 将状态和操作分离 | 复杂 Context |

**关键点**：
- 使用 React DevTools Profiler 分析性能瓶颈
- useMemo/useCallback 避免不必要的计算和渲染
- React.memo 避免子组件不必要的重渲染
- 拆分 Context 避免不必要的渲染

---

### 6.3 自定义 Hook 面试题

#### 面试题28：如何编写自定义 Hook？

**参考答案**：

```typescript
// 自定义 Hook 的基本结构

// 1. 函数名以 "use" 开头
// 2. 可以使用其他 Hook
// 3. 返回值可以是任何类型

// 示例：useWindowSize
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

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return size;
}

// 使用
function Component() {
  const { width, height } = useWindowSize();

  return (
    <div>
      <p>宽度: {width}</p>
      <p>高度: {height}</p>
    </div>
  );
}

// 示例：useDebounce
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

// 示例：useClickOutside
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
      <button onClick={() => setIsOpen(!isOpen)}>下拉菜单</button>
      {isOpen && <div>菜单内容</div>}
    </div>
  );
}
```

**关键点**：
- 自定义 Hook 函数名以 "use" 开头
- 可以使用其他 Hook
- 返回值可以是任何类型
- 遵循 Hooks 使用规则

---

#### 面试题29：自定义 Hook 的最佳实践是什么？

**参考答案**：

```typescript
// 1. 使用 TypeScript 类型

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

// 2. 提供默认值

function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      const valueToStore = value instanceof Function
        ? value(storedValue)
        : value;

      setStoredValue(valueToStore);

      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

// 3. 返回稳定的引用

function useCounter(initialCount = 0) {
  const [count, setCount] = useState(initialCount);

  const increment = useCallback(() => {
    setCount(prev => prev + 1);
  }, []);

  const decrement = useCallback(() => {
    setCount(prev => prev - 1);
  }, []);

  const reset = useCallback(() => {
    setCount(initialCount);
  }, [initialCount]);

  return { count, increment, decrement, reset };
}

// 4. 错误处理

function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = true
) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(() => {
    setStatus('pending');
    setData(null);
    setError(null);

    asyncFunction()
      .then((response: T) => {
        setData(response);
        setStatus('success');
      })
      .catch((error: Error) => {
        setError(error);
        setStatus('error');
      });
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { execute, status, data, error };
}

// 使用
function Component() {
  const { execute, status, data, error } = useAsync(() => {
    return fetch('/api/data').then(res => res.json());
  });

  if (status === 'pending') return <div>加载中...</div>;
  if (status === 'error') return <div>错误: {error?.message}</div>;
  if (status === 'success') return <div>{JSON.stringify(data)}</div>;

  return <button onClick={execute}>加载数据</button>;
}

// 5. 自定义 Hook 命名规范

// ✅ 正确：描述功能
function useWindowSize() { ... }
function useDebounce<T>(value: T, delay: number): T { ... }
function useClickOutside(ref, handler) { ... }
function useFetch<T>(url: string): UseFetchReturn<T> { ... }
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] { ... }

// ❌ 错误：不描述功能
function useA() { ... }
function useB() { ... }
function useHandler() { ... }
```

**关键点**：
- 使用 TypeScript 类型
- 提供默认值
- 返回稳定的引用
- 错误处理
- 描述性的命名

---

### 6.4 综合面试题

#### 面试题30：React Hooks 与 class 组件对比

**参考答案**：

```typescript
// class 组件
class Counter extends React.Component {
  constructor(props) {
    super(props);
    this.state = { count: 0 };
    this.increment = this.increment.bind(this);
  }

  increment() {
    this.setState(prev => ({ count: prev.count + 1 }));
  }

  componentDidMount() {
    console.log('组件挂载');
  }

  componentDidUpdate(prevProps) {
    if (prevProps.userId !== this.props.userId) {
      this.fetchUser();
    }
  }

  componentWillUnmount() {
    console.log('组件卸载');
  }

  fetchUser() {
    // 获取用户
  }

  render() {
    return (
      <div>
        <p>计数: {this.state.count}</p>
        <button onClick={this.increment}>增加</button>
      </div>
    );
  }
}

// 函数组件 + Hooks
function Counter({ userId }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log('组件挂载');

    return () => {
      console.log('组件卸载');
    };
  }, []);

  useEffect(() => {
    if (userId !== prevUserId) {
      fetchUser();
    }
  }, [userId]);

  const increment = () => {
    setCount(prev => prev.count + 1);
  };

  return (
    <div>
      <p>计数: {count}</p>
      <button onClick={increment}>增加</button>
    </div>
  );
}
```

**对比表格**：

| 特性 | class 组件 | 函数组件 + Hooks |
|------|-----------|-----------------|
| 状态管理 | this.state | useState |
| 副作用处理 | 生命周期方法 | useEffect |
| 逻辑复用 | 高阶组件、渲染属性 | 自定义 Hook |
| this 绑定 | 需要手动绑定 | 无需绑定 |
| 代码量 | 较多 | 较少 |
| 性能 | 较差 | 较好 |
| 类型安全 | ⚠️ 较难 | ✅ 类型安全 |

**关键点**：
- Hooks 解决了 class 组件的 this 绑定问题
- Hooks 使得逻辑复用更加简单
- Hooks 代码更加简洁
- Hooks 性能更好

---

## 7. 面试高频问题总结

### 7.1 必考问题

| 问题 | 考察频率 | 重要性 |
|------|---------|--------|
| useState 原理 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| useEffect 原理 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| useContext 原理 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| useReducer 原理 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| useMemo vs useCallback | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| useRef 使用场景 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| useLayoutEffect vs useEffect | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Hooks 使用规则 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 自定义 Hook 编写 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Hooks 性能优化 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

### 7.2 高频问题

| 问题 | 考察频率 | 重要性 |
|------|---------|--------|
| useState 函数式更新 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| useEffect 依赖数组 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| useEffect 清理函数 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Context 性能优化 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| useMemo/useCallback 区别 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| useRef 存储可变值 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| useImperativeHandle | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| useTransition/useDeferredValue | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 自定义 Hook 最佳实践 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Hooks 与 class 组件对比 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

### 7.3 经典面试题

```typescript
// 面试题1：useState 的函数式更新
function Counter() {
  const [count, setCount] = useState(0);

  const increment = () => {
    setCount(count + 1);      // ❌ 闭包中的 count 是固定的
    setCount(count + 1);      // ❌ 闭包中的 count 仍然是 0
    setCount(count + 1);      // ❌ 闭包中的 count 仍然是 0
    // 最终 count = 1，而不是 3
  };

  const incrementCorrect = () => {
    setCount(prev => prev + 1);  // ✅ 使用前一个状态
    setCount(prev => prev + 1);  // ✅ 使用前一个状态
    setCount(prev => prev + 1);  // ✅ 使用前一个状态
    // ✅ 最终 count = 3
  };
}

// 面试题2：useEffect 依赖数组
function Component({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, []); // ❌ userId 应该在依赖数组中

  // ✅ 正确
  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]); // ✅ 依赖 userId
}

// 面试题3：useMemo vs useCallback
function Component() {
  // ❌ 不必要的优化
  const upperName = useMemo(() => name.toUpperCase(), [name]); // 简单计算不需要 useMemo
  const handleClick = useCallback(() => { console.log(name); }, [name]); // 简单函数不需要 useCallback

  // ✅ 正确使用场景
  const config = useMemo(() => ({ timeout: 5000 }), []); // 对象使用 useMemo
  const handleSubmit = useCallback((data) => { console.log(data); }, []); // 函数使用 useCallback
}

// 面试题4：useRef 使用场景
function Component() {
  // 1. 访问 DOM
  const inputRef = useRef<HTMLInputElement>(null);
  inputRef.current?.focus();

  // 2. 存储可变值
  const countRef = useRef(0);
  countRef.current++; // 不触发重渲染

  // 3. 保存上一次的值
  const previousCount = usePrevious(count);
}

// 面试题5：自定义 Hook
function useFetch<T>(url: string): UseFetchReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);

    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
```

---

## 8. 总结

### 8.1 React Hooks 核心要点

```typescript
// 1. useState：状态管理
const [state, setState] = useState(initialState);

// 2. useEffect：副作用处理
useEffect(() => {
  // 副作用逻辑
  return () => {
    // 清理函数
  };
}, [dependencies]);

// 3. useContext：跨组件状态共享
const value = useContext(Context);

// 4. useReducer：复杂状态管理
const [state, dispatch] = useReducer(reducer, initialState);

// 5. useMemo：缓存计算结果
const memoizedValue = useMemo(() => computeExpensiveValue(), [dependencies]);

// 6. useCallback：缓存函数引用
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);

// 7. useRef：访问 DOM 和存储可变值
const ref = useRef(initialValue);

// 8. useLayoutEffect：同步执行 DOM 操作
useLayoutEffect(() => {
  // DOM 操作
}, [dependencies]);

// 9. useTransition：标记非紧急更新
const [isPending, startTransition] = useTransition();

// 10. useDeferredValue：延迟非紧急值
const deferredValue = useDeferredValue(value);
```

### 8.2 最佳实践

```typescript
// 1. 遵循 Hooks 使用规则
// - 只在顶层调用 Hook
// - 只在 React 函数中调用 Hook

// 2. 使用函数式更新
setCount(prev => prev + 1);

// 3. 使用 useMemo 优化
const config = useMemo(() => ({ timeout: 5000 }), []);

// 4. 使用 useCallback 优化
const handleClick = useCallback(() => {
  console.log(count);
}, [count]);

// 5. 使用自定义 Hook 封装逻辑
function useFetch<T>(url: string): UseFetchReturn<T> { ... }

// 6. 使用 Context API 管理全局状态
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 7. 使用 useTransition 和 useDeferredValue 提升用户体验
const [isPending, startTransition] = useTransition();
const deferredValue = useDeferredValue(value);

// 8. 使用 useId 生成唯一 ID
const id = useId();
```

### 8.3 面试准备

```typescript
// 必考问题
// 1. useState 原理
// 2. useEffect 原理
// 3. useContext 原理
// 4. useReducer 原理
// 5. useMemo vs useCallback
// 6. useRef 使用场景
// 7. useLayoutEffect vs useEffect
// 8. Hooks 使用规则
// 9. 自定义 Hook 编写
// 10. Hooks 性能优化

// 高频问题
// 1. useState 函数式更新
// 2. useEffect 依赖数组
// 3. useEffect 清理函数
// 4. Context 性能优化
// 5. useMemo/useCallback 区别
// 6. useRef 存储可变值
// 7. useImperativeHandle
// 8. useTransition/useDeferredValue
// 9. 自定义 Hook 最佳实践
// 10. Hooks 与 class 组件对比
```

---

**文档更新时间**：2026年3月16日  
**适用版本**：React 18.x - React 19.x  
**面试频率**：⭐⭐⭐⭐⭐（高频）
