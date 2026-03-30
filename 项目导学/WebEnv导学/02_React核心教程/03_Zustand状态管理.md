# Zustand 状态管理

## 目录
- [什么是状态管理？](#1-什么是状态管理)
- [Zustand 基础使用](#2-zustand-基础使用)
- [创建 Store 的各种方式](#3-创建-store-的各种方式)
- [状态切片模式](#4-状态切片模式)
- [中间件使用](#5-中间件使用)
- [与 React 的集成](#6-与-react-的集成)

---

## 1. 什么是状态管理？

### 1.1 为什么需要状态管理？

在 React 中，我们已经学习了使用 `useState` 管理组件内部状态，使用 `props` 在组件间传递数据。但是当应用变得复杂时，会遇到以下问题：

```
┌─────────────────────────────────────────────────────────────┐
│                    状态管理的问题                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Props 逐层传递（Props Drilling）                          │
│                                                             │
│   ┌─────────────────────────────────────────┐              │
│   │  App                                    │              │
│   │    │                                    │              │
│   │    ▼                                    │              │
│   │  Header → Nav → UserMenu → Avatar      │              │
│   │    │                                    │              │
│   │  每一层都要传递 user 数据               │              │
│   └─────────────────────────────────────────┘              │
│                                                             │
│   问题：                                                    │
│   - 中间组件不需要 user，但必须透传                         │
│   - 代码冗余，可维护性差                                   │
│   - 状态分散，难以追踪                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 状态管理解决方案

常见的 React 状态管理方案：

| 方案 | 特点 | 适用场景 |
|------|------|----------|
| useState | 简单，组件私有 | 简单应用 |
| useContext | 避免 props 传递 | 少量全局状态 |
| Redux | 功能强大，生态丰富 | 大型复杂应用 |
| **Zustand** | 轻量、简单、现代化 | 中大型应用 |

### 1.3 Zustand 简介

**Zustand** 是一个轻量级的状态管理库，由 React 开发社区创建，特点是：

- 极简 API
- 无需 Provider 包裹
- 灵活的状态更新
- 内置中间件支持
- TypeScript 支持良好

---

## 2. Zustand 基础使用

### 2.1 安装

```bash
npm install zustand
# 或
yarn add zustand
```

### 2.2 创建第一个 Store

```jsx
import { create } from 'zustand';

// 创建 store
const useStore = create((set) => ({
  // 状态
  count: 0,
  user: null,

  // 方法
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  setUser: (user) => set({ user }),
  reset: () => set({ count: 0, user: null })
}));

export default useStore;
```

### 2.3 在组件中使用

```jsx
import useStore from './store';

function Counter() {
  // 选择需要的状态和方法
  const { count, increment, decrement, reset } = useStore();

  return (
    <div>
      <p>计数：{count}</p>
      <button onClick={increment}>+1</button>
      <button onClick={decrement}>-1</button>
      <button onClick={reset}>重置</button>
    </div>
  );
}
```

### 2.4 Zustand 工作原理

```
┌─────────────────────────────────────────────────────────────┐
│                    Zustand 工作原理                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   创建 Store：                                              │
│   ┌─────────────────────────────────────────────┐           │
│   │  const useStore = create((set) => ({        │           │
│   │    count: 0,                                │           │
│   │    increment: () => set(s => ({...}))       │           │
│   │  }))                                        │           │
│   └─────────────────────────────────────────────┘           │
│                         │                                    │
│                         ▼                                    │
│   组件使用：                                                │
│   ┌─────────────────────────────────────────────┐           │
│   │  const { count, increment } = useStore()   │           │
│   │                                           │           │
│   │  读取状态                                  │           │
│   │  调用方法 → set() → 触发重新渲染           │           │
│   └─────────────────────────────────────────────┘           │
│                                                             │
│   特点：                                                    │
│   - 无需 Provider                                           │
│   - 状态全局共享                                            │
│   - 只订阅使用的状态                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 创建 Store 的各种方式

### 3.1 基础 Store

```jsx
import { create } from 'zustand';

const useBasicStore = create((set) => ({
  // 初始状态
  name: '张三',
  age: 25,

  // 方法
  setName: (name) => set({ name }),
  setAge: (age) => set({ age }),
  incrementAge: () => set((state) => ({ age: state.age + 1 }))
}));
```

### 3.2 Store 中使用 async/await

```jsx
import { create } from 'zustand';

const useAsyncStore = create((set, get) => ({
  users: [],
  loading: false,
  error: null,

  // 异步方法
  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      set({ users: data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // 也可以在方法中调用其他方法
  fetchAndProcess: async () => {
    await get().fetchUsers();
    const { users } = get();
    console.log(`获取到 ${users.length} 个用户`);
  }
}));
```

### 3.3 带有 TypeScript 的 Store

```tsx
import { create } from 'zustand';

interface User {
  id: number;
  name: string;
  email: string;
}

interface UserStore {
  users: User[];
  selectedUser: User | null;
  loading: boolean;
  fetchUsers: () => Promise<void>;
  selectUser: (user: User) => void;
}

const useUserStore = create<UserStore>((set, get) => ({
  users: [],
  selectedUser: null,
  loading: false,

  fetchUsers: async () => {
    set({ loading: true });
    const response = await fetch('/api/users');
    const users = await response.json();
    set({ users, loading: false });
  },

  selectUser: (user) => set({ selectedUser: user })
}));
```

### 3.4 派生状态（计算属性）

Zustand 没有内置的 selector，但可以自己实现：

```jsx
import { create } from 'zustand';

const useStore = create((set, get) => ({
  items: [
    { id: 1, name: '苹果', price: 5, quantity: 2 },
    { id: 2, name: '香蕉', price: 3, quantity: 3 },
    { id: 3, name: '橙子', price: 4, quantity: 1 }
  ],

  // 方法
  addItem: (item) => set((state) => ({
    items: [...state.items, item]
  })),

  // 派生状态：在组件中计算
  // const total = useStore(state =>
  //   state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  // )
}));
```

### 3.5 完整示例：待办事项 Store

```tsx
import { create } from 'zustand';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

interface TodoStore {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed';
  addTodo: (text: string) => void;
  toggleTodo: (id: number) => void;
  deleteTodo: (id: number) => void;
  setFilter: (filter: 'all' | 'active' | 'completed') => void;
  clearCompleted: () => void;
}

const useTodoStore = create<TodoStore>((set) => ({
  todos: [],
  filter: 'all',

  addTodo: (text) => set((state) => ({
    todos: [
      ...state.todos,
      { id: Date.now(), text, completed: false }
    ]
  })),

  toggleTodo: (id) => set((state) => ({
    todos: state.todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    )
  })),

  deleteTodo: (id) => set((state) => ({
    todos: state.todos.filter((todo) => todo.id !== id)
  })),

  setFilter: (filter) => set({ filter }),

  clearCompleted: () => set((state) => ({
    todos: state.todos.filter((todo) => !todo.completed)
  }))
}));

export default useTodoStore;
```

---

## 4. 状态切片模式

### 4.1 什么是状态切片？

当应用变得复杂时，可以将 store 拆分成多个小的切片（slices），然后合并在一起。

```
┌─────────────────────────────────────────────────────────────┐
│                    状态切片模式                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   原始方式（一个大的 store）：                                │
│   ┌─────────────────────────────┐                          │
│   │  useStore                   │                          │
│   │  - user                     │                          │
│   │  - cart                     │                          │
│   │  - products                 │                          │
│   │  - orders                   │                          │
│   │  - ...                      │                          │
│   └─────────────────────────────┘                          │
│                                                             │
│   切片模式（多个小 store）：                                 │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│   │ userSlice│ │cartSlice │ │productSlice│                  │
│   └────┬─────┘ └────┬─────┘ └────┬─────┘                   │
│        │            │            │                          │
│        └────────────┼────────────┘                          │
│                     ▼                                       │
│              ┌────────────┐                                  │
│              │  合并后    │                                  │
│              │  useStore  │                                  │
│              └────────────┘                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 创建切片

```jsx
// slices/userSlice.js
const createUserSlice = (set) => ({
  user: null,
  isAuthenticated: false,
  login: (userData) => set({ user: userData, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false })
});

// slices/cartSlice.js
const createCartSlice = (set) => ({
  items: [],
  addItem: (item) => set((state) => ({
    items: [...state.items, item]
  })),
  removeItem: (id) => set((state) => ({
    items: state.items.filter((item) => item.id !== id)
  })),
  clearCart: () => set({ items: [] })
});

// slices/uiSlice.js
const createUISlice = (set) => ({
  sidebarOpen: false,
  theme: 'light',
  toggleSidebar: () => set((state) => ({
    sidebarOpen: !state.sidebarOpen
  })),
  setTheme: (theme) => set({ theme })
});
```

### 4.3 合并切片

```jsx
import { create } from 'zustand';
import { createUserSlice } from './slices/userSlice';
import { createCartSlice } from './slices/cartSlice';
import { createUISlice } from './slices/uiSlice';

// 方式一：手动合并
const useStore = create((...args) => ({
  ...createUserSlice(...args),
  ...createCartSlice(...args),
  ...createUISlice(...args)
}));

// 方式二：使用 combine（Zustand 提供的工具）
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

const useStore = create(
  combine(
    // 初始状态
    {
      user: null,
      items: [],
      sidebarOpen: false
    },
    // 方法
    (set) => ({
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen }))
    })
  )
);
```

### 4.4 在组件中使用切片

```jsx
function UserProfile() {
  // 只订阅 user 相关状态
  const user = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);

  if (!user) return <p>请登录</p>;

  return (
    <div>
      <h2>欢迎, {user.name}</h2>
      <button onClick={logout}>退出</button>
    </div>
  );
}

function CartIcon() {
  // 只订阅 items 长度
  const itemCount = useStore((state) => state.items.length);

  return <span>购物车 ({itemCount})</span>;
}

function Sidebar() {
  const isOpen = useStore((state) => state.sidebarOpen);
  const toggle = useStore((state) => state.toggleSidebar);

  return isOpen ? <div>侧边栏内容 <button onClick={toggle}>关闭</button></div> : null;
}
```

---

## 5. 中间件使用

### 5.1 什么是中间件？

中间件是在状态更新前后执行额外逻辑的函数。

```
┌─────────────────────────────────────────────────────────────┐
│                      Zustand 中间件                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐                                          │
│   │   组件     │                                          │
│   │ set({x:1}) │                                          │
│   └──────┬──────┘                                          │
│          │                                                  │
│          ▼                                                  │
│   ┌─────────────┐                                          │
│   │  Middleware │ ← 拦截器                                  │
│   │ (日志/持久化│                                          │
│   │  等)        │                                          │
│   └──────┬──────┘                                          │
│          │                                                  │
│          ▼                                                  │
│   ┌─────────────┐                                          │
│   │    Store    │                                          │
│   └─────────────┘                                          │
│                                                             │
│   常用中间件：                                              │
│   - persist: 持久化到 localStorage                         │
│   - devtools: 开发工具支持                                  │
│   - subscribeWithSelector: 订阅选择器                      │
│   - combine: 合并切片                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 persist 中间件 - 数据持久化

```jsx
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set) => ({
      name: '张三',
      age: 25,
      setName: (name) => set({ name }),
      setAge: (age) => set({ age })
    }),
    {
      name: 'my-store', // localStorage 中的键名
      // 可选配置
      partialize: (state) => ({ name: state.name }), // 只持久化部分状态
      storage: {
        getItem: (name) => {
          const value = localStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => localStorage.removeItem(name)
      }
    }
  )
);

// 使用 - 数据会自动保存到 localStorage
function App() {
  const { name, setName } = useStore();

  return (
    <input value={name} onChange={(e) => setName(e.target.value)} />
  );
}
```

### 5.3 devtools 中间件 - Redux DevTools

```jsx
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const useStore = create(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
      decrement: () => set((state) => ({ count: state.count - 1 }))
    }),
    {
      name: 'my-store', // DevTools 中的名称
      enabled: process.env.NODE_ENV === 'development' // 只在开发环境启用
    }
  )
);
```

### 5.4 combine 中间件 - 组合切片

```jsx
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

const useStore = create(
  combine(
    // 初始状态
    { count: 0, user: null },
    // 方法
    (set) => ({
      increment: () => set((state) => ({ count: state.count + 1 })),
      setUser: (user) => set({ user })
    })
  )
);
```

### 5.5 subscribeWithSelector 中间件 - 订阅选择器

```jsx
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

const useStore = create(
  subscribeWithSelector((set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 }))
  }))
);

// 组件外订阅
const unsubscribe = useStore.subscribe(
  (state) => state.count,
  (count) => console.log('计数变化:', count)
);

// 组件内也可以使用选择器订阅
function Component() {
  useStore.subscribe(
    (state) => state.count,
    (count) => console.log('计数:', count)
  );

  return null;
}
```

### 5.6 自定义中间件

```jsx
// 日志中间件
const loggerMiddleware = (config) => (set, get, api) => {
  // 原始的 set 函数
  const originalSet = set;

  // 重写 set
  set = (...args) => {
    console.log('状态更新前:', get());
    originalSet(...args);
    console.log('状态更新后:', get());
  };

  // 返回配置
  return config(set, get, api);
};

// 使用中间件
const useStore = create(
  loggerMiddleware((set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 }))
  }))
);
```

### 5.7 完整示例：带持久化和日志的 Store

```tsx
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

const useUserStore = create(
  devtools(
    persist(
      (set) => ({
        user: null,
        theme: 'light',
        isAuthenticated: false,

        login: (userData) => set({
          user: userData,
          isAuthenticated: true
        }),

        logout: () => set({
          user: null,
          isAuthenticated: false
        }),

        setTheme: (theme) => set({ theme })
      }),
      {
        name: 'user-storage',
        partialize: (state) => ({ theme: state.theme }) // 只持久化主题
      }
    ),
    { name: 'UserStore' }
  )
);

export default useUserStore;
```

---

## 6. 与 React 的集成

### 6.1 基础集成

```jsx
import { create } from 'zustand';
import { useState, useEffect } from 'react';

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 }))
}));

function Counter() {
  const count = useStore((state) => state.count);
  const increment = useStore((state) => state.increment);

  return (
    <div>
      <p>计数: {count}</p>
      <button onClick={increment}>+1</button>
    </div>
  );
}
```

### 6.2 选择性订阅

```jsx
function MyComponent() {
  // 只订阅 count，不订阅其他状态
  const count = useStore((state) => state.count);

  // 这样其他状态变化时，组件不会重新渲染
  // ...

  return <div>{count}</div>;
}
```

### 6.3 shallow 比较

```jsx
import { create } from 'zustand';
import { useStore } from 'zustand';

const useStore = create((set) => ({
  user: { name: '张三', age: 25 },
  updateUser: (user) => set({ user })
}));

function UserProfile() {
  // ❌ 问题：user 对象每次都是新引用
  const user = useStore((state) => state.user);

  // ✅ 解决：使用 shallow 比较
  const user = useStore(
    (state) => state.user,
    (prev, next) => prev.name === next.name && prev.age === next.age
  );

  // 或者使用 zustand/shallow
  import { shallow } from 'zustand/shallow';
  const user = useStore(
    (state) => state.user,
    shallow
  );

  return <div>{user.name}</div>;
}
```

### 6.4 在组件外使用

```jsx
import { create } from 'zustand';

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 }))
}));

// 组件外使用
function logCount() {
  const count = useStore.getState().count;
  console.log('当前计数:', count);
}

// 订阅变化
const unsubscribe = useStore.subscribe((state) => {
  console.log('计数变化:', state.count);
});

// 手动触发更新（慎用）
useStore.setState((state) => ({ count: state.count + 1 }));
```

### 6.5 完整示例：用户认证流程

```tsx
// store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });

          if (!response.ok) {
            throw new Error('登录失败');
          }

          const data = await response.json();
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error) {
          set({
            error: error.message,
            isLoading: false
          });
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        });
      },

      register: async (email, password, name) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name })
          });

          if (!response.ok) {
            throw new Error('注册失败');
          }

          const data = await response.json();
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error) {
          set({
            error: error.message,
            isLoading: false
          });
        }
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

// components/LoginForm.tsx
import { useAuthStore } from '../store/authStore';

function LoginForm() {
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="error">
          {error}
          <button onClick={clearError}>关闭</button>
        </div>
      )}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="邮箱"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="密码"
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? '登录中...' : '登录'}
      </button>
    </form>
  );
}

// components/UserMenu.tsx
import { useAuthStore } from '../store/authStore';

function UserMenu() {
  const { user, logout, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Link to="/login">登录</Link>;
  }

  return (
    <div>
      <span>欢迎, {user?.name}</span>
      <button onClick={logout}>退出</button>
    </div>
  );
}
```

### 6.6 与 SWR 集成

```tsx
import { create } from 'zustand';
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((res) => res.json());

// 方式一：在 Store 中使用 SWR
const useStore = create((set) => ({
  data: null,
  error: null,
  mutate: () => {
    // 可以触发 SWR 重新获取
  }
}));

// 方式二：组件中直接组合使用
function UserList() {
  const { data, error, mutate } = useSWR('/api/users', fetcher);
  const addUser = useStore((state) => state.addUser);

  const handleAddUser = async (userData) => {
    await addUser(userData);
    mutate(); // 重新获取数据
  };

  if (error) return <div>加载失败</div>;
  if (!data) return <div>加载中...</div>;

  return <div>用户列表：{data.length}</div>;
}
```

### 6.7 项目实际使用示例

在本项目（WebEnv导学）中，Zustand 的典型使用方式：

```tsx
// stores/useEditorStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface EditorState {
  content: string;
  language: string;
  theme: string;
  fontSize: number;
  setContent: (content: string) => void;
  setLanguage: (language: string) => void;
  setTheme: (theme: string) => void;
  setFontSize: (fontSize: number) => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      content: '',
      language: 'javascript',
      theme: 'vs-dark',
      fontSize: 14,

      setContent: (content) => set({ content }),
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize })
    }),
    {
      name: 'editor-storage'
    }
  )
);
```

---

## 7. Zustand 源码实现深度解析

Zustand 之所以如此轻量且高效，得益于其简洁而巧妙的实现。本节将深入分析 Zustand 的核心源码实现，帮助你理解其工作原理。

### 7.1 核心数据结构

Zustand 的核心类型定义位于 `src/vanilla.ts` 中：

```typescript
// 状态类型
export type State = Record<string, any>;

// 创建状态函数的类型
export type CreateState<T extends State> = (
  set: SetState<T>,
  get: GetState<T>,
  api: StoreApi<T>
) => T;

// Store API 接口 - 包含四个核心方法
export type StoreApi<T extends State> = {
  setState: SetState<T>;
  getState: GetState<T>;
  subscribe: Subscribe<T>;
  destroy: Destroy;
};

// 设置状态的类型 - 支持函数或对象两种形式
export type SetState<T extends State> = (
  partial: Partial<T> | ((state: T) => Partial<T>),
  replace?: boolean
) => void;

// 获取状态的类型
export type GetState<T extends State> = () => T;

// 订阅状态变化的类型
export type Subscribe<T extends State> = (
  listener: StateListener<T>
) => () => void;

// 状态监听器类型
export type StateListener<T> = (state: T, prevState: T) => void;

// 销毁函数类型
export type Destroy = () => void;
```

### 7.2 createStore 函数实现

`createStore` 是 Zustand 最核心的函数，负责创建 Vanilla 版本的 Store：

```typescript
// 简化版的 createStore 实现
function createStore<T extends State>(createState: CreateState<T>): StoreApi<T> {
  // 1. 状态存储
  let state: T;

  // 2. 监听器集合 - 使用 Set 存储，支持自动去重
  const listeners: Set<StateListener<T>> = new Set();

  // 3. 获取状态 - 直接返回当前状态
  const getState: GetState<T> = () => state;

  // 4. 设置状态 - 核心实现
  const setState: SetState<T> = (partial, replace) => {
    // 支持函数形式（如 set(state => ({ count: state.count + 1 })））
    const nextState = typeof partial === 'function'
      ? partial(state)
      : partial;

    // 使用 Object.is 比较，只有状态真正变化时才触发更新
    if (nextState !== state) {
      const previousState = state;

      // replace 参数控制是否完全替换状态
      state = replace
        ? (nextState as T)
        : Object.assign({}, state, nextState);

      // 通知所有监听器
      listeners.forEach((listener) => listener(state, previousState));
    }
  };

  // 5. 订阅状态变化
  const subscribe: Subscribe<T> = (listener) => {
    listeners.add(listener);
    // 返回取消订阅函数
    return () => listeners.delete(listener);
  };

  // 6. 销毁函数 - 清理所有监听器
  const destroy: Destroy = () => {
    listeners.clear();
  };

  // 7. 创建 API 对象
  const api: StoreApi<T> = {
    setState,
    getState,
    subscribe,
    destroy
  };

  // 8. 调用用户传入的 createState 函数，初始化状态
  state = createState(setState, getState, api);

  return api;
}
```

### 7.3 状态更新流程图

```
┌─────────────────────────────────────────────────────────────────┐
│                    Zustand 状态更新流程                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   组件调用 set：                                                │
│   ┌─────────────────────────────────────────┐                 │
│   │  store.setState(state => ({              │                 │
│   │    count: state.count + 1                │                 │
│   │  }))                                     │                 │
│   └─────────────────┬───────────────────────┘                 │
│                     │                                            │
│                     ▼                                            │
│   ┌─────────────────────────────────────────┐                 │
│   │  判断 partial 是函数还是对象              │                 │
│   │  如果是函数，执行得到新状态               │                 │
│   └─────────────────┬───────────────────────┘                 │
│                     │                                            │
│                     ▼                                            │
│   ┌─────────────────────────────────────────┐                 │
│   │  Object.is(nextState, state)            │                 │
│   │  比较新旧状态是否相同                     │                 │
│   └─────────────────┬───────────────────────┘                 │
│                     │                                            │
│           ┌────────┴────────┐                                   │
│           │ 相同            │ 不同                               │
│           ▼                ▼                                    │
│   ┌──────────────┐  ┌──────────────────────┐                  │
│   │ 不做任何处理  │  │ 更新 state 引用      │                  │
│   └──────────────┘  └──────────┬───────────┘                  │
│                                │                               │
│                                ▼                               │
│                    ┌──────────────────────┐                   │
│                    │ 遍历所有监听器        │                   │
│                    │ listener(state, prev)│                   │
│                    └──────────────────────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.4 React 集成实现

Zustand 的 React Hook 实现位于 `src/react.ts` 中：

```typescript
// 简化版的 useStore 实现
function useStore<T extends State, S>(
  selector: (state: T) => S,
  equalityFn?: (a: S, b: S) => boolean
): S {
  // 1. 使用 useReducer 创建 forceUpdate，用于触发组件重渲染
  const [, forceUpdate] = useReducer((c) => c + 1, 0);

  // 2. 获取 store API
  const api = useStoreRef.current; // 存储 api 引用的 ref

  // 3. 使用 ref 存储当前选中的状态切片
  const stateSliceRef = useRef<S>(selector(api.getState()));

  // 4. 核心订阅逻辑
  useIsomorphicLayoutEffect(() => {
    // 创建监听器函数
    const listener = () => {
      try {
        // 获取最新状态
        const nextState = api.getState();
        // 使用 selector 获取状态切片
        const nextStateSlice = selector(nextState);

        // 使用 equalityFn 比较新旧状态切片
        if (!equalityFn(stateSliceRef.current, nextStateSlice)) {
          // 更新 ref 存储的值
          stateSliceRef.current = nextStateSlice;
          // 触发组件重渲染
          forceUpdate();
        }
      } catch (error) {
        // 如果 selector 抛出错误，也触发重渲染
        forceUpdate();
      }
    };

    // 订阅状态变化
    const unsubscribe = api.subscribe(listener);

    // 组件卸载时取消订阅
    return unsubscribe;
  }, [api, selector, equalityFn]);

  // 5. 返回选中的状态切片
  return stateSliceRef.current;
}
```

### 7.5 中间件实现原理

Zustand 的中间件本质上是一个高阶函数，它接收原始的 `createState` 函数，返回一个新的 `createState` 函数：

```typescript
// 中间件的基本结构
type Middleware = <T extends State>(
  config: CreateState<T>
) => CreateState<T>;

// 示例：日志中间件实现
const loggerMiddleware: Middleware = (createState) => (set, get, api) => {
  // 保存原始的 set 函数
  const originalSet = set;

  // 重写 set 函数，添加日志功能
  set = (...args: Parameters<typeof originalSet>) => {
    console.log('【Zustand】状态更新前:', get());
    originalSet(...args);
    console.log('【Zustand】状态更新后:', get());
  };

  // 调用原始 createState，返回新的状态
  return createState(set, get, api);
};

// 使用中间件
const useStore = create(
  loggerMiddleware((set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 }))
  }))
);
```

### 7.6 persist 中间件源码解析

persist 中间件是 Zustand 最常用的中间件之一，它实现了状态持久化：

```typescript
// persist 中间件简化实现
const persistMiddleware = <T extends State>(
  config: CreateState<T>,
  options: {
    name: string; // localStorage 键名
    storage?: Storage; // 存储引擎
    partialize?: (state: T) => Partial<T>; // 过滤要持久化的状态
  }
): CreateState<T> => {
  const { name, storage, partialize } = options;

  // 从存储中获取初始状态
  const getStoredState = () => {
    try {
      const stored = storage?.getItem(name);
      return stored ? JSON.parse(stored) : undefined;
    } catch (e) {
      console.warn('Failed to parse stored state:', e);
      return undefined;
    }
  };

  // 返回包装后的 createState
  return (set, get, api) => {
    // 1. 获取存储的初始状态
    const storedState = getStoredState();

    // 2. 创建原始 store
    const state = config(
      // 重写 set 函数，在状态更新后自动保存
      (partial, replace) => {
        set(partial, replace);

        // 获取更新后的完整状态
        const currentState = get();

        // 根据 partialize 过滤要保存的状态
        const stateToSave = partialize
          ? partialize(currentState)
          : currentState;

        // 保存到存储
        try {
          storage?.setItem(name, JSON.stringify(stateToSave));
        } catch (e) {
          console.warn('Failed to persist state:', e);
        }
      },
      get,
      api
    );

    // 3. 合并存储的初始状态
    return storedState ? { ...state, ...storedState } : state;
  };
};
```

### 7.7 性能优化技巧

基于对源码的理解，以下是 Zustand 的性能优化最佳实践：

```typescript
// 1. 使用 selector 精确订阅 - 避免不必要的重渲染
function UserProfile() {
  // ✅ 正确 - 只订阅需要的字段
  const userName = useStore((state) => state.user?.name);

  // ❌ 错误 - 订阅整个 user 对象，任何变化都会触发重渲染
  const user = useStore((state) => state.user);
}

// 2. 使用 shallow 比较数组/对象
import { shallow } from 'zustand/shallow';

function UserList() {
  // ✅ 正确 - 使用 shallow 比较
  const users = useStore(
    (state) => state.users,
    shallow
  );
}

// 3. 避免在 selector 中创建新对象
function UserList() {
  // ❌ 错误 - 每次都返回新对象
  const userData = useStore((state) => ({
    name: state.name,
    count: state.count
  }));

  // ✅ 正确 - 只返回原始值
  const name = useStore((state) => state.name);
  const count = useStore((state) => state.count);
}

// 4. 静态定义 actions
const useStore = create((set) => ({
  count: 0,
  // ✅ 正确 - action 定义在 store 外部
  increment: () => set((state) => ({ count: state.count + 1 }))
}));

// 5. 使用 useShallow 处理复杂对象
import { useShallow } from 'zustand/react/shallow';

function UserProfile() {
  // 只在 name 或 age 变化时重渲染
  const { name, age } = useStore(
    useShallow((state) => ({
      name: state.name,
      age: state.age
    }))
  );
}
```

### 7.8 与其他状态管理库的对比

```typescript
// Zustand vs Redux vs Context 对比

// Redux - 需要 Provider、actions、reducers
import { Provider, useSelector, useDispatch } from 'react-redux';

const store = createStore(reducer);
<Provider store={store}>
  <App />
</Provider>;

function Counter() {
  const count = useSelector((state) => state.counter.count);
  const dispatch = useDispatch();
  return <button onClick={() => dispatch({ type: 'INC' })}>{count}</button>;
}

// Context - 每次更新都会导致所有消费者重渲染
const ThemeContext = createContext();
<ThemeContext.Provider value={theme}>
  <App />
</ThemeContext>;

function Header() {
  const theme = useContext(ThemeContext); // 任何 Context 变化都会触发重渲染
  return <div className={theme}>...</div>;
}

// Zustand - 无需 Provider，按需订阅
const useStore = create((set) => ({ count: 0, inc: () => set(s => ({ count: s.count + 1 })) }));

function Counter() {
  const count = useStore((s) => s.count); // 只订阅 count
  return <button onClick={useStore.getState().inc}>{count}</button>;
}
```

---

## 8. 总结

本教程详细介绍了 Zustand 状态管理：

| 主题 | 关键点 |
|------|--------|
| 基础使用 | create() 创建 store，set() 更新状态 |
| 创建方式 | 支持 async/await、TypeScript、派生状态 |
| 状态切片 | 将大 store 拆分为多个小切片 |
| 中间件 | persist（持久化）、devtools（调试） |
| React 集成 | 选择性订阅、shallow 比较 |
| 源码实现 | createStore、setState、subscribe、中间件原理 |
| 性能优化 | 精确订阅、shallow 比较、避免在 selector 中创建新对象 |

Zustand 的优势：
- API 简洁，学习成本低
- 无需 Provider
- 灵活的状态管理
- 良好的 TypeScript 支持
- 丰富的中间件
- 源码简洁，易于理解和扩展

Zustand 的核心设计理念：
- 极简主义 - 只有四个核心 API：setState、getState、subscribe、destroy
- 外部状态管理 - 状态独立于 React 组件树
- 按需订阅 - 组件只订阅需要的状态片段
- 中间件化 - 通过高阶函数扩展功能

---

## 9. 项目实际源码深度分析: useStore

### 9.1 完整项目源码

```typescript
// ===== 项目源码路径: apps/web/src/store/index.ts =====

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  // 菜单相关
  activeMenu: string
  setActiveMenu: (menu: string) => void

  // 搜索相关
  searchQuery: string
  setSearchQuery: (query: string) => void
  isSearching: boolean
  setIsSearching: (searching: boolean) => void

  // 主题相关
  isDarkMode: boolean
  setIsDarkMode: (dark: boolean) => void
  toggleDarkMode: () => void

  // 收藏相关
  favorites: string[]
  addFavorite: (menu: string) => void
  removeFavorite: (menu: string) => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ===== 初始状态 =====
      activeMenu: 'index',
      setActiveMenu: (menu) => set({ activeMenu: menu }),

      // 搜索相关
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      isSearching: false,
      setIsSearching: (searching) => set({ isSearching: searching }),

      // 主题相关
      isDarkMode: false,
      setIsDarkMode: (dark) => set({ isDarkMode: dark }),
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

      // 收藏相关
      favorites: [],
      addFavorite: (menu) => set((state) => ({
        favorites: state.favorites.includes(menu)
          ? state.favorites
          : [...state.favorites, menu]
      })),
      removeFavorite: (menu) => set((state) => ({
        favorites: state.favorites.filter(f => f !== menu)
      })),
    }),
    {
      name: 'prepare-for-storage',
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        favorites: state.favorites,
      }),
    }
  )
)
```

### 9.2 逐行源码深度解析

```typescript
// ===== 第 1-2 行: 导入语句 =====
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// create: Zustand 核心 API，用于创建 store
// persist: 中间件，用于持久化状态到 localStorage

// ===== 第 4-20 行: TypeScript 接口定义 =====
interface AppState {
  // 菜单相关: 控制当前激活的菜单项
  activeMenu: string                              // 当前激活的菜单名称
  setActiveMenu: (menu: string) => void         // 设置激活菜单的方法

  // 搜索相关: 搜索功能和状态
  searchQuery: string                           // 搜索关键词
  setSearchQuery: (query: string) => void       // 设置搜索关键词
  isSearching: boolean                          // 是否正在搜索
  setIsSearching: (searching: boolean) => void  // 设置搜索状态

  // 主题相关: 明暗主题切换
  isDarkMode: boolean                           // 是否暗色模式
  setIsDarkMode: (dark: boolean) => void       // 设置主题模式
  toggleDarkMode: () => void                    // 切换主题模式

  // 收藏相关: 用户收藏的菜单项
  favorites: string[]                          // 收藏的菜单列表
  addFavorite: (menu: string) => void          // 添加收藏
  removeFavorite: (menu: string) => void       // 移除收藏
}

// ===== 第 22 行: 创建 Store =====
export const useStore = create<AppState>()(
//             ^^^^^^^^^^^^^^^^
// create<T>() 是泛型函数，接收状态接口作为类型参数
// 这确保 TypeScript 能够推断所有状态和方法的类型

  persist(  // ===== persist 中间件包装 =====
//   ↓ 包装器，用于状态持久化

    (set, get) => ({  // ===== Store 定义函数 =====
//              ^^^ ^^^
//              |   |
//              |   └─ get: 获取当前状态的函数
//              └─ set: 更新状态的函数

      // ===== 初始状态和方法 =====

      // ===== 菜单管理 =====
      activeMenu: 'index',  // 默认显示首页
      setActiveMenu: (menu) => set({ activeMenu: menu }),
      //                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      //                 简单的 set 调用，直接设置新值
      //                 等价于: set({ activeMenu: menu })

      // ===== 搜索管理 =====
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),

      isSearching: false,
      setIsSearching: (searching) => set({ isSearching: searching }),

      // ===== 主题管理 =====
      isDarkMode: false,
      setIsDarkMode: (dark) => set({ isDarkMode: dark }),

      // 使用 get() 函数获取当前状态
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
//                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//                                         函数形式的 set，接收当前 state 作为参数
//                                         这样可以基于当前状态计算新状态

      // ===== 收藏管理 =====
      favorites: [],  // 初始为空数组

      // 添加收藏 (带去重检查)
      addFavorite: (menu) => set((state) => ({
        favorites: state.favorites.includes(menu)  // 检查是否已存在
          ? state.favorites                           // 已存在: 不修改
          : [...state.favorites, menu]               // 不存在: 添加到末尾
          // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
          // 展开运算符 + 新元素 = 新数组 (不可变更新)
      })),

      // 移除收藏
      removeFavorite: (menu) => set((state) => ({
        favorites: state.favorites.filter(f => f !== menu)
        //                                    ^^^^^^^^^^^^^^^
        //                                    过滤掉指定元素，返回新数组
      })),
    }),

    // ===== persist 中间件配置 =====
    {
      name: 'prepare-for-storage',  // localStorage 中的键名

      // partialize: 选择要持久化的状态
      partialize: (state) => ({
        //         ^^^^^^^^^^^^^^^^^^^
        //         这个函数决定哪些状态需要持久化
        //         返回的对象会被保存到 localStorage

        isDarkMode: state.isDarkMode,  // ✅ 持久化主题设置
        favorites: state.favorites,    // ✅ 持久化收藏列表

        // ❌ 不持久化的状态:
        // - activeMenu: 用户每次打开页面可能想看不同的菜单
        // - searchQuery: 搜索查询通常不需要保存
        // - isSearching: 搜索状态不应该保存
      }),
    }
  )
);
```

### 9.3 在组件中使用 Store

```tsx
// ===== 示例 1: 基础使用 =====
import { useStore } from '@/store';

function MenuBar() {
  const activeMenu = useStore((state) => state.activeMenu);
  const setActiveMenu = useStore((state) => state.setActiveMenu);

  return (
    <nav>
      <button onClick={() => setActiveMenu('index')}>首页</button>
      <button onClick={() => setActiveMenu('about')}>关于</button>
      <div>当前: {activeMenu}</div>
    </nav>
  );
}

// ===== 示例 2: 搜索组件 =====
function SearchBar() {
  const searchQuery = useStore((state) => state.searchQuery);
  const setSearchQuery = useStore((state) => state.setSearchQuery);

  return (
    <input
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="搜索..."
    />
  );
}

// ===== 示例 3: 主题切换 =====
function ThemeToggle() {
  const isDarkMode = useStore((state) => state.isDarkMode);
  const toggleDarkMode = useStore((state) => state.toggleDarkMode);

  return (
    <button onClick={toggleDarkMode}>
      {isDarkMode ? '亮色模式' : '暗色模式'}
    </button>
  );
}
```

---

## 下一步学习

- [04_SWR数据获取](./04_SWR数据获取.md) - 学习数据获取
