# React面试题八股文与最佳实践（2026年最新版）

## 目录

1. [React面试题八股文](#1-react面试题八股文)
2. [React最佳实践](#2-react最佳实践)
3. [React性能优化](#3-react性能优化)
4. [React 19新特性](#4-react-19新特性)
5. [经典面试真题](#5-经典面试真题)

---

## 1. React面试题八股文

### 1.1 Hooks使用规则

**考察频率**：⭐⭐⭐⭐⭐（100%面试必问）

**核心规则**：

```jsx
// 规则1：只在顶层调用Hook
function BadComponent() {
    // ❌ 错误：在条件语句中调用
    if (condition) {
        const [state, setState] = useState(0);
    }

    // ❌ 错误：在循环中调用
    for (let i = 0; i < 3; i++) {
        const [state, setState] = useState(0);
    }

    // ✅ 正确：始终在顶层调用
    const [a, setA] = useState(0);
    const [b, setB] = useState(0);
    const [c, setC] = useState(0);
}

// 规则2：只在React函数中调用Hook
// ✅ 在函数组件中
function Component() {
    const [state, setState] = useState(0);
}

// ✅ 在自定义Hook中
function useCustomHook() {
    const [state, setState] = useState(0);
}

// ❌ 普通函数中不能调用
function regularFunction() {
    const [state, setState] = useState(0); // 错误！
}

// ❌ 类组件中不能使用Hook
class ClassComponent extends React.Component {
    render() {
        // 不能使用useState
        return <div>Class Component</div>;
    }
}
```

**经典面试题**：

```jsx
// 面试题1：为什么Hook不能在条件语句中使用？
function BadComponent({ condition }) {
    if (condition) {
        const [state, setState] = useState(0); // ❌ 错误
    }
    
    // 问题：条件改变时，Hook的顺序会变化，导致状态混乱
}

// 面试题2：Hook的调用顺序为什么重要？
function Component() {
    const [a, setA] = useState(0); // 第1个Hook
    const [b, setB] = useState(0); // 第2个Hook
    
    if (condition) {
        return <div>条件渲染</div>;
    }
    
    const [c, setC] = useState(0); // 第3个Hook
    // 问题：条件渲染时，Hook的顺序会变化
}
```

### 1.2 useState vs useReducer

**考察频率**：⭐⭐⭐⭐⭐（95%面试会问）

**核心区别**：

```jsx
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
| 状态更新 | 直接设置值 | 分发action |
| 逻辑复用 | 需要自定义Hook | reducer可复用 |
| 性能优化 | 需要useCallback | dispatch引用稳定 |
| 调试 | 较难 | 可使用Redux DevTools |

### 1.3 useEffect vs useLayoutEffect

**考察频率**：⭐⭐⭐⭐⭐（90%面试会问）

**核心区别**：

```jsx
// useEffect：异步执行，在浏览器绘制后执行
function useEffectExample() {
    useEffect(() => {
        console.log('useEffect: 绘制后执行');
    }, []);

    return <div>内容</div>;
}

// useLayoutEffect：同步执行，在DOM改变后、浏览器绘制前执行
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
    // 2. useLayoutEffect (同步，DOM改变后立即执行)
    // 1. useEffect (异步，浏览器绘制后执行)
}
```

**执行时机对比**：

| Hook | 执行时机 | 适用场景 |
|------|---------|---------|
| `useEffect` | 浏览器绘制后 | 数据获取、订阅、日志、非紧急DOM操作 |
| `useLayoutEffect` | DOM改变后、绘制前 | 测量DOM、同步更新UI、动画 |

**使用场景**：

```jsx
// useLayoutEffect：测量DOM尺寸
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

### 1.4 useMemo vs useCallback

**考察频率**：⭐⭐⭐⭐⭐（85%面试会问）

**核心区别**：

```jsx
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

// useCallback等价于useMemo
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

### 1.5 Context性能优化

**考察频率**：⭐⭐⭐⭐⭐（80%面试会问）

**核心概念**：

```jsx
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

// ✅ 正确：使用useMemo优化
function GoodProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState(initialState);

    // 只在state变化时创建新对象
    const value = useMemo(() => ({ state, setState }), [state]);

    return (
        <MyContext.Provider value={value}>
            {children}
        </MyContext.Provider>
    );
}

// ✅ 更好的方案：拆分Context
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

// 只使用actions的组件不会因为user变化而重新渲染
function UpdateUserButton() {
    const { updateUser } = useContext(UserActionsContext)!;
    return <button onClick={() => updateUser(newUser)}>更新</button>;
}
```

### 1.6 useRef使用场景

**考察频率**：⭐⭐⭐⭐⭐（75%面试会问）

**核心概念**：

```jsx
// 1. 访问DOM元素
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
```

### 1.7 自定义Hook编写

**考察频率**：⭐⭐⭐⭐⭐（70%面试会问）

**核心概念**：

```jsx
// 自定义Hook基本结构
function useCustomHook() {
    // 1. 声明状态
    const [state, setState] = useState(initialState);
    
    // 2. 处理副作用
    useEffect(() => {
        // 副作用逻辑
        return () => {
            // 清理逻辑
        };
    }, [dependencies]);
    
    // 3. 返回值
    return { state, actions };
}

// 自定义Hook最佳实践
function useFetch<T>(url: string, options?: RequestInit) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let cancelled = false;

        fetch(url, options)
            .then(res => res.json())
            .then(data => {
                if (!cancelled) {
                    setData(data);
                    setError(null);
                }
            })
            .catch(error => {
                if (!cancelled) {
                    setError(error);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [url, options]);

    return { data, loading, error };
}
```

### 1.8 Hooks原理

**考察频率**：⭐⭐⭐⭐（60%面试会问）

**核心概念**：

```jsx
// Hooks本质：链表存储

// useState实现原理
function useState(initialState) {
    const currentHook = ReactCurrentHook.current;
    
    const stateObject = {
        memoizedState: initialState,
        queue: {
            pending: null,
        },
    };
    
    return [stateObject.memoizedState, dispatchAction.bind(null, currentHook.queue)];
}

// useEffect实现原理
function useEffect(callback, dependencies) {
    const currentHook = ReactCurrentHook.current;
    
    const effectObject = {
        callback,
        dependencies,
        next: null,
    };
    
    // 将effect加入组件的effect链表
    currentHook.push(effectObject);
}
```

### 1.9 React性能优化

**考察频率**：⭐⭐⭐⭐⭐（85%面试会问）

**核心概念**：

```jsx
// 1. React DevTools Profiler
<React.Profiler id="Component" onRender={onRenderCallback}>
    <Component />
</React.Profiler>

// 2. useMemo缓存计算结果
const sortedItems = useMemo(() => items.sort(), [items]);

// 3. useCallback缓存函数引用
const handleClick = useCallback(() => console.log(count), [count]);

// 4. React.memo避免不必要的重渲染
const Child = React.memo(({ onClick, data }) => 
    <button onClick={onClick}>{data.label}</button>
);

// 5. 拆分Context避免不必要的渲染
const UserContext = createContext<User | null>(null);
const UserActionsContext = createContext<{ updateUser: (user: User) => void } | null>(null);

// 6. useTransition标记非紧急更新
const [isPending, startTransition] = useTransition();

// 7. useDeferredValue延迟非紧急值
const deferredQuery = useDeferredValue(query);

// 8. useId生成唯一ID
const id = useId();

// 9. useOptimistic乐观更新
const [optimisticTodos, addOptimisticTodo] = useOptimistic(todos, ...);

// 10. useActionState管理表单状态
const [state, formAction, isPending] = useActionState(createPost, null);
```

### 1.10 React 19新特性

**考察频率**：⭐⭐⭐⭐（50%面试会问）

**核心概念**：

```jsx
// 1. useActionState（React 19）
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

// 2. useOptimistic（React 19）
function TodoList({ todos }) {
    const [optimisticTodos, addOptimisticTodo] = useOptimistic(
        todos,
        (state, newTodo) => [...state, { ...newTodo, id: Date.now() }]
    );

    return (
        <div>
            {optimisticTodos.map(todo => (
                <div key={todo.id}>{todo.text}</div>
            ))}
        </div>
    );
}

// 3. useId（React 18）
function Form() {
    const id = useId();

    return (
        <div>
            <label htmlFor={id}>姓名</label>
            <input id={id} type="text" />
        </div>
    );
}

// 4. useTransition（React 18）
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

// 5. useDeferredValue（React 18）
function SearchResults({ query }: { query: string }) {
    const deferredQuery = useDeferredValue(query);

    return <ExpensiveComponent query={deferredQuery} />;
}
```

---

## 2. React最佳实践

### 2.1 组件设计最佳实践

```jsx
// 1. 组件拆分原则
// - 单一职责：每个组件只做一件事
// - 高内聚低耦合：相关逻辑组织在一起
// - 可复用性：组件应该可复用

// 2. 组件命名
// - 使用大驼峰命名法
// - 名称应该描述组件的功能
// - 避免使用React保留字

// 3. 组件结构
function Component({ prop1, prop2 }) {
    // 1. Props解构
    // 2. 状态声明
    // 3. 副作用处理
    // 4. 辅助函数
    // 5. 渲染逻辑
    
    return <div>内容</div>;
}
```

### 2.2 状态管理最佳实践

```jsx
// 1. 选择合适的状态管理方案
// - 简单状态：useState
// - 复杂状态：useReducer
// - 全局状态：Context + useReducer
// - 复杂全局状态：Zustand、Redux Toolkit

// 2. 状态不可变性
function GoodComponent() {
    const [user, setUser] = useState({ name: '', email: '' });

    const updateName = (name: string) => {
        setUser(prev => ({ ...prev, name })); // ✅ 创建新对象
    };

    const addItem = (item: string) => {
        setItems(prev => [...prev, item]); // ✅ 创建新数组
    };
}

// 3. 状态提升
// - 共享状态提升到共同父组件
// - 使用Context传递共享状态
// - 避免过度状态提升
```

### 2.3 性能优化最佳实践

```jsx
// 1. 避免不必要的重渲染
const Child = React.memo(({ data }) => {
    return <div>{data}</div>;
});

// 2. 使用useMemo缓存计算结果
const filteredItems = useMemo(() => {
    return items.filter(item => item.name.includes(filter));
}, [items, filter]);

// 3. 使用useCallback缓存函数
const handleClick = useCallback(() => {
    console.log(count);
}, [count]);

// 4. 虚拟列表
import { FixedSizeList } from 'react-window';

<FixedSizeList
    height={500}
    itemCount={10000}
    itemSize={35}
    width={300}
>
    {Row}
</FixedSizeList>

// 5. 懒加载
const LazyComponent = React.lazy(() => import('./LazyComponent'));

<Suspense fallback={<div>加载中...</div>}>
    <LazyComponent />
</Suspense>
```

### 2.4 Hooks使用最佳实践

```jsx
// 1. 遵循Hooks使用规则
// - 只在顶层调用
// - 只在React函数中调用
// - 使用ESLint插件检查

// 2. 正确使用依赖数组
useEffect(() => {
    fetchUser(userId).then(setUser);
}, [userId]); // ✅ 依赖userId

// 3. 使用函数式更新
setCount(prev => prev + 1); // ✅ 函数式更新

// 4. 清理副作用
useEffect(() => {
    const subscription = chat.subscribe(roomId, onMessage);
    return () => subscription.unsubscribe();
}, [roomId]);

// 5. 自定义Hook命名
// - 使用use前缀
// - 描述功能
// - 遵循Hooks规则
```

### 2.5 代码质量最佳实践

```jsx
// 1. 使用TypeScript
function Component({ data }: { data: DataType }) {
    return <div>{data}</div>;
}

// 2. 添加PropTypes
Component.propTypes = {
    data: PropTypes.object.isRequired,
};

// 3. 错误边界
class ErrorBoundary extends React.Component {
    state = { hasError: false };

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return <h1>出错了</h1>;
        }

        return this.props.children;
    }
}

// 4. 使用StrictMode
<React.StrictMode>
    <App />
</React.StrictMode>

// 5. 使用Fragment
return (
    <>
        <div>内容1</div>
        <div>内容2</div>
    </>
);
```

---

## 3. React性能优化

### 3.1 10种性能优化技巧

```jsx
// 1. React DevTools Profiler
<React.Profiler id="Component" onRender={onRenderCallback}>
    <Component />
</React.Profiler>

// 2. useMemo缓存计算结果
const sortedItems = useMemo(() => items.sort(), [items]);

// 3. useCallback缓存函数引用
const handleClick = useCallback(() => console.log(count), [count]);

// 4. React.memo避免不必要的重渲染
const Child = React.memo(({ onClick, data }) => 
    <button onClick={onClick}>{data.label}</button>
);

// 5. 拆分Context避免不必要的渲染
const UserContext = createContext<User | null>(null);
const UserActionsContext = createContext<{ updateUser: (user: User) => void } | null>(null);

// 6. useTransition标记非紧急更新
const [isPending, startTransition] = useTransition();

// 7. useDeferredValue延迟非紧急值
const deferredQuery = useDeferredValue(query);

// 8. useId生成唯一ID
const id = useId();

// 9. useOptimistic乐观更新
const [optimisticTodos, addOptimisticTodo] = useOptimistic(todos, ...);

// 10. useActionState管理表单状态
const [state, formAction, isPending] = useActionState(createPost, null);
```

### 3.2 虚拟列表

```jsx
import { FixedSizeList } from 'react-window';

function LargeList({ items }) {
    return (
        <FixedSizeList
            height={500}
            itemCount={items.length}
            itemSize={35}
            width={300}
        >
            {Row}
        </FixedSizeList>
    );
}

function Row({ index, style }) {
    return (
        <div style={style}>
            {items[index].name}
        </div>
    );
}
```

### 3.3 懒加载

```jsx
import React, { Suspense, lazy } from 'react';

const LazyComponent = lazy(() => import('./LazyComponent'));

function App() {
    return (
        <Suspense fallback={<div>加载中...</div>}>
            <LazyComponent />
        </Suspense>
    );
}
```

### 3.4 虚拟滚动

```jsx
import { FixedSizeList } from 'react-window';

function VirtualScroll({ items }) {
    return (
        <FixedSizeList
            height={500}
            itemCount={items.length}
            itemSize={50}
            width={600}
        >
            {Row}
        </FixedSizeList>
    );
}

function Row({ index, style }) {
    return (
        <div style={style} className="item">
            {items[index].name}
        </div>
    );
}
```

---

## 4. React 19新特性

### 4.1 useActionState

```jsx
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

### 4.2 useOptimistic

```jsx
function TodoList({ todos }) {
    const [optimisticTodos, addOptimisticTodo] = useOptimistic(
        todos,
        (state, newTodo) => [...state, { ...newTodo, id: Date.now() }]
    );

    const handleAddTodo = (text: string) => {
        addOptimisticTodo({ text, completed: false });
        // 实际添加逻辑
    };

    return (
        <div>
            {optimisticTodos.map(todo => (
                <div key={todo.id}>{todo.text}</div>
            ))}
        </div>
    );
}
```

### 4.3 useId

```jsx
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

### 4.4 useTransition

```jsx
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
```

### 4.5 useDeferredValue

```jsx
function SearchResults({ query }: { query: string }) {
    const deferredQuery = useDeferredValue(query);

    return <ExpensiveComponent query={deferredQuery} />;
}
```

---

## 5. 经典面试真题

### 5.1 基础题

**题目1：Hooks使用规则**

```jsx
// 面试题：为什么Hook不能在条件语句中使用？
function BadComponent({ condition }) {
    if (condition) {
        const [state, setState] = useState(0); // ❌ 错误
    }
    
    // 问题：条件改变时，Hook的顺序会变化，导致状态混乱
}

// 解决方案：始终在顶层调用
function GoodComponent({ condition }) {
    const [state, setState] = useState(0); // ✅ 正确
    
    if (condition) {
        // 使用state
    }
}
```

**题目2：useState vs useReducer**

```jsx
// 面试题：什么时候使用useReducer？
// 答：当状态逻辑复杂、需要多个子值、或状态依赖前一个状态时使用useReducer
```

**题目3：useEffect依赖数组**

```jsx
// 面试题：useEffect依赖数组为空和不写有什么区别？
// 答：空数组只在挂载时执行，不写每次渲染后都执行
```

### 5.2 进阶题

**题目1：Context性能优化**

```jsx
// 面试题：如何优化Context导致的性能问题？
// 答：1. 使用useMemo优化value 2. 拆分Context 3. 使用自定义Hook
```

**题目2：自定义Hook编写**

```jsx
// 面试题：编写一个useFetch自定义Hook
function useFetch<T>(url: string, options?: RequestInit) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let cancelled = false;

        fetch(url, options)
            .then(res => res.json())
            .then(data => {
                if (!cancelled) {
                    setData(data);
                    setError(null);
                }
            })
            .catch(error => {
                if (!cancelled) {
                    setError(error);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [url, options]);

    return { data, loading, error };
}
```

**题目3：性能优化**

```jsx
// 面试题：如何优化React应用的性能？
// 答：1. 使用React.memo 2. useMemo/useCallback 3. 虚拟列表 4. 懒加载 5. 拆分Context
```

### 5.3 复杂题

**题目1：Hooks原理**

```jsx
// 面试题：Hooks的底层实现原理
// 答：Hooks使用链表存储，每个Hook都有对应的节点，通过顺序来匹配状态
```

**题目2：React 19新特性**

```jsx
// 面试题：React 19有哪些新特性？
// 答：useActionState、useOptimistic、Server Actions、Server Components等
```

**题目3：综合应用**

```jsx
// 面试题：如何实现一个高性能的表单？
// 答：1. 使用useReducer管理表单状态 2. 使用useMemo验证 3. 使用useCallback处理提交
```

---

## 总结

本文档涵盖了React面试的核心知识点，包括：

1. **Hooks使用规则**：只在顶层调用、只在React函数中调用
2. **useState vs useReducer**：简单状态使用useState，复杂状态使用useReducer
3. **useEffect vs useLayoutEffect**：useEffect异步执行，useLayoutEffect同步执行
4. **useMemo vs useCallback**：useMemo缓存计算结果，useCallback缓存函数引用
5. **Context性能优化**：使用useMemo优化value、拆分Context、使用自定义Hook
6. **useRef使用场景**：访问DOM、存储可变值、保存上一次值
7. **自定义Hook编写**：遵循Hooks规则、处理副作用、返回值
8. **Hooks原理**：链表存储机制
9. **React性能优化**：10种性能优化技巧
10. **React 19新特性**：useActionState、useOptimistic、useId、useTransition、useDeferredValue

这些内容可以帮助你更好地准备React面试，掌握React的核心知识点和最佳实践。