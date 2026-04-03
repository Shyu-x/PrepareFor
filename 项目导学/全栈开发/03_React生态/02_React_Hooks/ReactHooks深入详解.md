# React Hooks深入详解

## 目录

1. [Hooks概述](#1-hooks概述)
2. [基础Hooks详解](#2-基础hooks详解)
3. [进阶Hooks详解](#3-进阶hooks详解)
4. [自定义Hooks设计](#4-自定义hooks设计)
5. [Hooks性能优化](#5-hooks性能优化)
6. [面试高频问题](#6-面试高频问题)

---

## 1. Hooks概述

### 1.1 为什么需要Hooks？

```typescript
// React Hooks解决的问题

/*
┌─────────────────────────────────────────────────────────────┐
│                    Hooks解决的问题                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 组件间状态逻辑复用困难                                   │
│     - Class组件：高阶组件、渲染属性模式复杂                  │
│     - Hooks：自定义Hook轻松复用                              │
│                                                             │
│  2. 复杂组件难以理解                                         │
│     - Class组件：生命周期方法中混杂不相关逻辑                │
│     - Hooks：相关逻辑组织在一起                              │
│                                                             │
│  3. Class组件的this困扰                                      │
│     - 需要手动绑定事件处理函数                               │
│     - Hooks：函数组件无this问题                              │
│                                                             │
│  4. 副作用代码分散                                           │
│     - Class组件：componentDidMount、componentDidUpdate等     │
│     - Hooks：useEffect统一处理                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
*/
```

### 1.2 Hooks使用规则

```typescript
// Hooks使用规则

// 规则1：只在最顶层使用Hook
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

// 规则2：只在React函数中调用Hook
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

---

## 2. 基础Hooks详解

### 2.1 useState深入

```typescript
// useState深入解析

import { useState, useCallback, useMemo } from 'react';

// 1. 基础用法
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>计数: {count}</p>
      <button onClick={() => setCount(count + 1)}>增加</button>
    </div>
  );
}

// 2. 函数式更新（基于前一个状态）
function CounterWithFunctionUpdate() {
  const [count, setCount] = useState(0);

  // ✅ 正确：使用函数式更新
  const increment = useCallback(() => {
    setCount(prev => prev + 1);
  }, []);

  // 批量更新
  const incrementThree = useCallback(() => {
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);
    // 最终 count 增加3
  }, []);

  return (
    <div>
      <p>计数: {count}</p>
      <button onClick={increment}>增加</button>
      <button onClick={incrementThree}>增加3</button>
    </div>
  );
}

// 3. 惰性初始化（性能优化）
function ExpensiveInitialization() {
  // ❌ 错误：每次渲染都执行
  // const [state, setState] = useState(computeExpensiveValue());

  // ✅ 正确：只在首次渲染执行
  const [state, setState] = useState(() => {
    console.log('初始化状态');
    return computeExpensiveValue();
  });

  return <div>{state}</div>;
}

// 4. 对象状态更新
function ObjectState() {
  const [user, setUser] = useState({
    name: '',
    email: '',
    age: 0,
  });

  // ❌ 错误：直接修改
  // user.name = '张三';

  // ✅ 正确：创建新对象
  const updateName = (name: string) => {
    setUser(prev => ({ ...prev, name }));
  };

  // 使用useImmer简化
  import { useImmer } from 'use-immer';

  const [userWithImmer, updateUser] = useImmer({
    name: '',
    email: '',
  });

  const updateNameWithImmer = (name: string) => {
    updateUser(draft => {
      draft.name = name; // 直接修改
    });
  };

  return (
    <div>
      <input
        value={user.name}
        onChange={e => updateName(e.target.value)}
      />
    </div>
  );
}

// 5. 数组状态更新
function ArrayState() {
  const [items, setItems] = useState<string[]>([]);

  // 添加元素
  const addItem = (item: string) => {
    setItems(prev => [...prev, item]);
  };

  // 删除元素
  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // 更新元素
  const updateItem = (index: number, newItem: string) => {
    setItems(prev => prev.map((item, i) => (i === index ? newItem : item)));
  };

  // 清空
  const clearItems = () => {
    setItems([]);
  };

  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>
          {item}
          <button onClick={() => removeItem(index)}>删除</button>
        </li>
      ))}
    </ul>
  );
}

// 6. 类型安全的状态
interface User {
  id: string;
  name: string;
  email: string;
}

function TypedState() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  const loadUser = async (id: string) => {
    const data = await fetchUser(id);
    setUser(data);
  };

  return <div>{user?.name}</div>;
}
```

### 2.2 useEffect深入

```typescript
// useEffect深入解析

import { useEffect, useState, useRef } from 'react';

// 1. 基础用法
function BasicEffect() {
  const [count, setCount] = useState(0);

  // 每次渲染后执行
  useEffect(() => {
    console.log('组件渲染完成');
  });

  return <div>{count}</div>;
}

// 2. 依赖数组
function EffectWithDeps() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');

  // 只在count变化时执行
  useEffect(() => {
    console.log('count变化:', count);
  }, [count]);

  // 只在组件挂载时执行一次
  useEffect(() => {
    console.log('组件挂载');
  }, []);

  // 在count或name变化时执行
  useEffect(() => {
    console.log('count或name变化');
  }, [count, name]);
}

// 3. 清理函数
function EffectWithCleanup() {
  useEffect(() => {
    // 订阅事件
    const handleResize = () => {
      console.log('窗口大小变化');
    };
    window.addEventListener('resize', handleResize);

    // 清理函数：组件卸载或下次effect执行前调用
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <div>窗口大小监听</div>;
}

// 4. 数据获取
function DataFetching() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await fetch('/api/data');
        const json = await result.json();

        if (!cancelled) {
          setData(json);
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
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;
  return <div>{JSON.stringify(data)}</div>;
}

// 5. 使用AbortController取消请求
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

// 6. 定时器
function Timer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return <div>已运行 {seconds} 秒</div>;
}

// 7. 监听props变化
interface Props {
  userId: string;
}

function UserProfile({ userId }: Props) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]); // userId变化时重新获取

  return <div>{user?.name}</div>;
}

// 8. useEffect常见陷阱
function EffectPitfalls() {
  const [count, setCount] = useState(0);

  // ❌ 错误：忘记依赖
  useEffect(() => {
    console.log(count); // count应该加入依赖数组
  }, []);

  // ❌ 错误：依赖对象引用
  const options = { a: 1 }; // 每次渲染创建新对象
  useEffect(() => {
    console.log(options);
  }, [options]); // 每次渲染都执行

  // ✅ 正确：使用useMemo
  const memoizedOptions = useMemo(() => ({ a: 1 }), []);
  useEffect(() => {
    console.log(memoizedOptions);
  }, [memoizedOptions]);

  // ❌ 错误：在effect中直接使用async
  // useEffect(async () => {
  //   const data = await fetchData();
  // }, []);

  // ✅ 正确：在effect中调用async函数
  useEffect(() => {
    const loadData = async () => {
      const data = await fetchData();
    };
    loadData();
  }, []);
}
```

### 2.3 useContext深入

```typescript
// useContext深入解析

import { createContext, useContext, useState, ReactNode } from 'react';

// 1. 基础用法
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

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

function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
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

// 2. 用户认证Context
interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    setUser(data.user);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// 3. 组合多个Context
function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}

// 4. Context性能优化
// 使用useMemo避免不必要的渲染
function OptimizedProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialState);

  const value = useMemo(() => ({
    state,
    setState,
  }), [state]);

  return (
    <MyContext.Provider value={value}>
      {children}
    </MyContext.Provider>
  );
}

// 5. 拆分Context避免不必要的渲染
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

---

## 3. 进阶Hooks详解

### 3.1 useReducer深入

```typescript
// useReducer深入解析

import { useReducer, useCallback } from 'react';

// 1. 基础用法
type State = {
  count: number;
};

type Action =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'reset'; payload: number };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 };
    case 'decrement':
      return { count: state.count - 1 };
    case 'reset':
      return { count: action.payload };
    default:
      throw new Error('Unknown action');
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });

  return (
    <div>
      <p>计数: {state.count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
      <button onClick={() => dispatch({ type: 'reset', payload: 0 })}>重置</button>
    </div>
  );
}

// 2. 复杂状态管理
interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

type TodoState = {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed';
};

type TodoAction =
  | { type: 'ADD_TODO'; payload: string }
  | { type: 'TOGGLE_TODO'; payload: string }
  | { type: 'DELETE_TODO'; payload: string }
  | { type: 'SET_FILTER'; payload: 'all' | 'active' | 'completed' };

function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case 'ADD_TODO':
      return {
        ...state,
        todos: [
          ...state.todos,
          {
            id: Date.now().toString(),
            text: action.payload,
            completed: false,
          },
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
    case 'DELETE_TODO':
      return {
        ...state,
        todos: state.todos.filter(todo => todo.id !== action.payload),
      };
    case 'SET_FILTER':
      return {
        ...state,
        filter: action.payload,
      };
    default:
      return state;
  }
}

function TodoApp() {
  const [state, dispatch] = useReducer(todoReducer, {
    todos: [],
    filter: 'all',
  });

  const addTodo = useCallback((text: string) => {
    dispatch({ type: 'ADD_TODO', payload: text });
  }, []);

  const toggleTodo = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_TODO', payload: id });
  }, []);

  const deleteTodo = useCallback((id: string) => {
    dispatch({ type: 'DELETE_TODO', payload: id });
  }, []);

  const filteredTodos = state.todos.filter(todo => {
    if (state.filter === 'active') return !todo.completed;
    if (state.filter === 'completed') return todo.completed;
    return true;
  });

  return (
    <div>
      <TodoInput onAdd={addTodo} />
      <TodoList
        todos={filteredTodos}
        onToggle={toggleTodo}
        onDelete={deleteTodo}
      />
      <FilterButtons
        filter={state.filter}
        onChange={filter => dispatch({ type: 'SET_FILTER', payload: filter })}
      />
    </div>
  );
}

// 3. 惰性初始化
function init(initialCount: number): State {
  return { count: initialCount };
}

function CounterWithInit({ initialCount }: { initialCount: number }) {
  const [state, dispatch] = useReducer(reducer, initialCount, init);

  return (
    <div>
      <p>计数: {state.count}</p>
      <button onClick={() => dispatch({ type: 'reset', payload: initialCount })}>
        重置
      </button>
    </div>
  );
}

// 4. useReducer + Context实现全局状态
const TodoContext = createContext<{
  state: TodoState;
  dispatch: React.Dispatch<TodoAction>;
} | null>(null);

function TodoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(todoReducer, {
    todos: [],
    filter: 'all',
  });

  return (
    <TodoContext.Provider value={{ state, dispatch }}>
      {children}
    </TodoContext.Provider>
  );
}

function useTodo() {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodo must be used within TodoProvider');
  }
  return context;
}
```

### 3.2 useMemo与useCallback

```typescript
// useMemo与useCallback深入解析

import { useState, useMemo, useCallback, memo } from 'react';

// 1. useMemo - 缓存计算结果
function ExpensiveComponent({ items }: { items: number[] }) {
  // ❌ 错误：每次渲染都重新计算
  // const sortedItems = items.sort((a, b) => a - b);

  // ✅ 正确：使用useMemo缓存
  const sortedItems = useMemo(() => {
    console.log('重新排序');
    return [...items].sort((a, b) => a - b);
  }, [items]);

  // 复杂计算
  const statistics = useMemo(() => {
    return {
      sum: items.reduce((a, b) => a + b, 0),
      avg: items.length > 0 ? items.reduce((a, b) => a + b, 0) / items.length : 0,
      max: Math.max(...items),
      min: Math.min(...items),
    };
  }, [items]);

  return (
    <div>
      {sortedItems.map(item => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}

// 2. useCallback - 缓存函数引用
interface Item {
  id: string;
  name: string;
}

const ItemComponent = memo(({ item, onClick }: { item: Item; onClick: (id: string) => void }) => {
  console.log('渲染:', item.name);
  return (
    <div onClick={() => onClick(item.id)}>
      {item.name}
    </div>
  );
});

function ParentComponent() {
  const [items, setItems] = useState<Item[]>([
    { id: '1', name: '项目1' },
    { id: '2', name: '项目2' },
  ]);
  const [count, setCount] = useState(0);

  // ❌ 错误：每次渲染创建新函数，导致ItemComponent重新渲染
  // const handleClick = (id: string) => {
  //   console.log('点击:', id);
  // };

  // ✅ 正确：使用useCallback缓存函数
  const handleClick = useCallback((id: string) => {
    console.log('点击:', id);
  }, []);

  // 带依赖的回调
  const handleDelete = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>计数: {count}</button>
      {items.map(item => (
        <ItemComponent key={item.id} item={item} onClick={handleClick} />
      ))}
    </div>
  );
}

// 3. useMemo vs useCallback
function DifferenceExample() {
  const [count, setCount] = useState(0);

  // useMemo: 缓存任意值
  const memoizedValue = useMemo(() => {
    return { count };
  }, [count]);

  // useCallback: 缓存函数（等价于useMemo缓存函数）
  const memoizedCallback = useCallback(() => {
    console.log(count);
  }, [count]);

  // 等价于
  const memoizedCallback2 = useMemo(() => {
    return () => console.log(count);
  }, [count]);

  return <div>{count}</div>;
}

// 4. 过度优化的陷阱
function OverOptimization() {
  const [name, setName] = useState('');

  // ❌ 不必要的优化：简单计算不需要useMemo
  // const upperName = useMemo(() => name.toUpperCase(), [name]);

  // ✅ 简单计算直接执行
  const upperName = name.toUpperCase();

  // ❌ 不必要的优化：没有传递给子组件的函数
  // const handleChange = useCallback((e) => {
  //   setName(e.target.value);
  // }, []);

  // ✅ 直接定义
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  return <input value={name} onChange={handleChange} />;
}

// 5. 正确使用场景
function CorrectUsage({ data, onItemClick }: { data: Item[]; onItemClick: (id: string) => void }) {
  // ✅ 复杂计算使用useMemo
  const processedData = useMemo(() => {
    return data
      .filter(item => item.name.length > 0)
      .map(item => ({ ...item, processed: true }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  // ✅ 传递给memo组件的函数使用useCallback
  const handleClick = useCallback((id: string) => {
    onItemClick(id);
  }, [onItemClick]);

  // ✅ 依赖其他state的计算使用useMemo
  const [filter, setFilter] = useState('');
  const filteredData = useMemo(() => {
    return processedData.filter(item =>
      item.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [processedData, filter]);

  return (
    <div>
      <input value={filter} onChange={e => setFilter(e.target.value)} />
      {filteredData.map(item => (
        <ItemComponent key={item.id} item={item} onClick={handleClick} />
      ))}
    </div>
  );
}
```

### 3.3 useRef深入

```typescript
// useRef深入解析

import { useRef, useEffect, useState, useCallback } from 'react';

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

  const startTimer = () => {
    if (intervalRef.current) return;
    intervalRef.current = window.setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div>
      <p>秒数: {seconds}</p>
      <button onClick={startTimer}>开始</button>
      <button onClick={stopTimer}>停止</button>
    </div>
  );
}

// 3. 保存前一次的值
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

function CounterWithPrevious() {
  const [count, setCount] = useState(0);
  const prevCount = usePrevious(count);

  return (
    <div>
      <p>当前: {count}</p>
      <p>之前: {prevCount}</p>
      <button onClick={() => setCount(c => c + 1)}>增加</button>
    </div>
  );
}

// 4. 防抖/节流
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    timerRef.current = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

function SearchInput() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    if (debouncedQuery) {
      fetchSearchResults(debouncedQuery);
    }
  }, [debouncedQuery]);

  return (
    <input
      value={query}
      onChange={e => setQuery(e.target.value)}
      placeholder="搜索..."
    />
  );
}

// 5. 点击外部检测
function useClickOutside(
  ref: React.RefObject<HTMLElement>,
  callback: () => void
) {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, [ref, callback]);
}

function Dropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setIsOpen(false));

  return (
    <div ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)}>切换</button>
      {isOpen && <div>下拉内容</div>}
    </div>
  );
}

// 6. useCallback的稳定引用
function useCallbackStable() {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);

  // 保持countRef与count同步
  useEffect(() => {
    countRef.current = count;
  }, [count]);

  // 回调函数始终引用最新的count
  const logCount = useCallback(() => {
    console.log('当前计数:', countRef.current);
  }, []);

  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount(c => c + 1)}>增加</button>
      <button onClick={logCount}>打印计数</button>
    </div>
  );
}
```

---

## 4. 自定义Hooks设计

### 4.1 常用自定义Hooks

```typescript
// 常用自定义Hooks实现

import { useState, useEffect, useCallback, useRef } from 'react';

// 1. useLocalStorage - 持久化状态
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue(prev => {
        const newValue = value instanceof Function ? value(prev) : value;
        localStorage.setItem(key, JSON.stringify(newValue));
        return newValue;
      });
    },
    [key]
  );

  return [storedValue, setValue];
}

// 使用
function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');

  return (
    <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
      当前主题: {theme}
    </button>
  );
}

// 2. useFetch - 数据获取
interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

function useFetch<T>(url: string): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const json = await response.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// 使用
function UserProfile({ userId }: { userId: string }) {
  const { data: user, loading, error } = useFetch<User>(`/api/users/${userId}`);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;
  return <div>{user?.name}</div>;
}

// 3. useToggle - 布尔值切换
function useToggle(initialValue = false): [boolean, () => void] {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue(v => !v), []);
  return [value, toggle];
}

// 使用
function Modal() {
  const [isOpen, toggleOpen] = useToggle(false);

  return (
    <div>
      <button onClick={toggleOpen}>打开</button>
      {isOpen && (
        <div className="modal">
          <button onClick={toggleOpen}>关闭</button>
        </div>
      )}
    </div>
  );
}

// 4. useWindowSize - 窗口大小
interface WindowSize {
  width: number;
  height: number;
}

function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

// 5. useOnlineStatus - 网络状态
function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// 6. useIntersectionObserver - 元素可见性
function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options?: IntersectionObserverInit
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return isIntersecting;
}

// 使用 - 懒加载图片
function LazyImage({ src, alt }: { src: string; alt: string }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const isIntersecting = useIntersectionObserver(imgRef, {
    rootMargin: '100px',
  });

  return (
    <img
      ref={imgRef}
      src={isIntersecting ? src : undefined}
      alt={alt}
      loading="lazy"
    />
  );
}

// 7. useDebounce - 防抖值
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

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

// 8. useThrottle - 节流值
function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastExecuted = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    if (now - lastExecuted.current >= interval) {
      lastExecuted.current = now;
      setThrottledValue(value);
    } else {
      const timer = setTimeout(() => {
        lastExecuted.current = Date.now();
        setThrottledValue(value);
      }, interval - (now - lastExecuted.current));

      return () => clearTimeout(timer);
    }
  }, [value, interval]);

  return throttledValue;
}
```

---

## 5. Hooks性能优化

### 5.1 性能优化策略

```typescript
// Hooks性能优化策略

import { memo, useMemo, useCallback, useState, useEffect } from 'react';

// 1. 使用React.memo避免不必要的渲染
interface ItemProps {
  id: string;
  name: string;
  onClick: (id: string) => void;
}

const Item = memo(({ id, name, onClick }: ItemProps) => {
  console.log('渲染:', name);
  return (
    <div onClick={() => onClick(id)}>
      {name}
    </div>
  );
});

// 2. 合理使用useMemo和useCallback
function OptimizedList({ items }: { items: ItemProps[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 缓存排序结果
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  // 缓存回调函数
  const handleClick = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  return (
    <div>
      {sortedItems.map(item => (
        <Item key={item.id} {...item} onClick={handleClick} />
      ))}
    </div>
  );
}

// 3. 状态下沉 - 减少渲染范围
function ParentComponent() {
  const [parentCount, setParentCount] = useState(0);

  return (
    <div>
      <button onClick={() => setParentCount(c => c + 1)}>
        父组件计数: {parentCount}
      </button>
      {/* 子组件不会因为父组件状态变化而重新渲染 */}
      <StandaloneChild />
    </div>
  );
}

function StandaloneChild() {
  const [childCount, setChildCount] = useState(0);
  return (
    <button onClick={() => setChildCount(c => c + 1)}>
      子组件计数: {childCount}
    </button>
  );
}

// 4. 列表虚拟化
import { FixedSizeList } from 'react-window';

function VirtualizedList({ items }: { items: any[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      {items[index].name}
    </div>
  );

  return (
    <FixedSizeList
      height={400}
      width="100%"
      itemCount={items.length}
      itemSize={50}
    >
      {Row}
    </FixedSizeList>
  );
}

// 5. 懒加载组件
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

function App() {
  const [showHeavy, setShowHeavy] = useState(false);

  return (
    <div>
      <button onClick={() => setShowHeavy(true)}>加载重组件</button>
      {showHeavy && (
        <React.Suspense fallback={<div>加载中...</div>}>
          <HeavyComponent />
        </React.Suspense>
      )}
    </div>
  );
}

// 6. 使用key重置组件状态
function FormWithReset() {
  const [key, setKey] = useState(0);

  const resetForm = () => {
    setKey(k => k + 1);
  };

  return (
    <div>
      <Form key={key} />
      <button onClick={resetForm}>重置表单</button>
    </div>
  );
}
```

---

## 6. 面试高频问题

### 问题1：useState和useReducer的区别？

**答案：**
| 方面 | useState | useReducer |
|------|----------|------------|
| 适用场景 | 简单状态 | 复杂状态逻辑 |
| 更新方式 | 直接设置值 | dispatch action |
| 测试 | 较难测试 | 易于测试 |
| 性能 | 无差异 | 无差异 |

### 问题2：useEffect的依赖数组如何确定？

**答案：**
1. 包含effect中使用的所有外部变量
2. 使用ESLint插件自动检测
3. 函数依赖使用useCallback包装
4. 对象依赖使用useMemo包装

### 问题3：useMemo和useCallback的区别？

**答案：**
- `useMemo`：缓存任意值，返回计算结果
- `useCallback`：缓存函数，返回函数引用
- `useCallback(fn, deps)` 等价于 `useMemo(() => fn, deps)`

### 问题4：如何避免useEffect的无限循环？

**答案：**
1. 正确设置依赖数组
2. 对象/数组使用useMemo
3. 函数使用useCallback
4. 使用函数式更新避免依赖state

### 问题5：自定义Hook的最佳实践？

**答案：**
1. 以use开头命名
2. 返回数组或对象
3. 保持单一职责
4. 提供清晰的API
5. 处理边界情况

---

## 7. 最佳实践总结

### 7.1 Hooks清单

- [ ] 遵守Hooks使用规则
- [ ] 正确设置依赖数组
- [ ] 合理使用useMemo/useCallback
- [ ] 自定义Hook复用逻辑
- [ ] 处理副作用清理
- [ ] 避免过度优化

### 7.2 常见陷阱

| 陷阱 | 解决方案 |
|------|----------|
| 依赖缺失 | 使用ESLint插件 |
| 无限循环 | 检查依赖数组 |
| 闭包陷阱 | 使用useRef或函数式更新 |
| 过度优化 | 只在必要时优化 |

---

*本文档最后更新于 2026年3月*