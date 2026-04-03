# React状态管理

## 目录

1. [Redux完整指南](#1-redux完整指南)
2. [Redux Toolkit现代写法](#2-redux-toolkit现代写法)
3. [Zustand状态管理](#3-zustand状态管理)
4. [React Query/SWR数据获取](#4-react-queryswr数据获取)

---

## 1. Redux完整指南

### 1.1 Redux 基础概念

```javascript
// Redux 核心概念
// Store: 存储状态的容器
// Action: 描述发生的事件
// Reducer: 根据 action 更新状态
// Dispatch: 触发 action 的方法
// Subscribe: 监听状态变化
```

### 1.2 Redux 基础实现

```javascript
import { createStore } from 'redux';

// 定义初始状态
const initialState = {
    count: 0,
    user: null,
    loading: false
};

// 定义 Reducer
function counterReducer(state = initialState, action) {
    switch (action.type) {
        case 'INCREMENT':
            return {
                ...state,
                count: state.count + 1
            };
        case 'DECREMENT':
            return {
                ...state,
                count: state.count - 1
            };
        case 'SET_COUNT':
            return {
                ...state,
                count: action.payload
            };
        default:
            return state;
    }
}

// 创建 Store
const store = createStore(counterReducer);

// 订阅状态变化
store.subscribe(() => {
    console.log('状态变化:', store.getState());
});

// 派发 Action
store.dispatch({ type: 'INCREMENT' });
console.log(store.getState()); // { count: 1, user: null, loading: false }

store.dispatch({ type: 'SET_COUNT', payload: 10 });
console.log(store.getState()); // { count: 10, user: null, loading: false }
```

### 1.3 Action Creators

```javascript
// Action 创建函数
const increment = () => ({
    type: 'INCREMENT'
});

const decrement = () => ({
    type: 'DECREMENT'
});

const setCount = (count) => ({
    type: 'SET_COUNT',
    payload: count
});

const setUser = (user) => ({
    type: 'SET_USER',
    payload: user
});

const setLoading = (loading) => ({
    type: 'SET_LOADING',
    payload: loading
});

// 使用
store.dispatch(increment());
store.dispatch(setCount(5));
store.dispatch(setUser({ name: '张三' }));
```

### 1.4 Middleware

```javascript
import { createStore, applyMiddleware } from 'redux';

// 日志中间件
const loggerMiddleware = (store) => (next) => (action) => {
    console.log('Dispatch:', action);
    const result = next(action);
    console.log('Next State:', store.getState());
    return result;
};

// 异步中间件
const asyncMiddleware = (store) => (next) => (action) => {
    if (typeof action === 'function') {
        return action(store.dispatch, store.getState);
    }
    return next(action);
};

// 使用 thunk（实际项目中推荐使用 redux-thunk）
import thunk from 'redux-thunk';

// 创建带中间件的 Store
const store = createStore(
    counterReducer,
    applyMiddleware(loggerMiddleware, thunk)
);

// 异步 Action
const fetchUser = (userId) => {
    return async (dispatch, getState) => {
        dispatch({ type: 'SET_LOADING', payload: true });

        try {
            const response = await fetch(`/api/users/${userId}`);
            const user = await response.json();

            dispatch({ type: 'SET_USER', payload: user });
            dispatch({ type: 'SET_LOADING', payload: false });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };
};

store.dispatch(fetchUser(1));
```

### 1.5 完整 Redux 示例

```javascript
// store.js
import { createStore, combineReducers } from 'redux';

// 用户 Reducer
function userReducer(state = { currentUser: null, loading: false }, action) {
    switch (action.type) {
        case 'SET_USER':
            return { ...state, currentUser: action.payload };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        default:
            return state;
    }
}

// 计数器 Reducer
function counterReducer(state = { count: 0 }, action) {
    switch (action.type) {
        case 'INCREMENT':
            return { ...state, count: state.count + 1 };
        case 'DECREMENT':
            return { ...state, count: state.count - 1 };
        case 'RESET':
            return { ...state, count: 0 };
        default:
            return state;
    }
}

// 组合 Reducers
const rootReducer = combineReducers({
    user: userReducer,
    counter: counterReducer
});

// 创建 Store
const store = createStore(rootReducer);

// 导出
export default store;

// actions.js
export const increment = () => ({ type: 'INCREMENT' });
export const decrement = () => ({ type: 'DECREMENT' });
export const reset = () => ({ type: 'RESET' });
export const setUser = (user) => ({ type: 'SET_USER', payload: user });

export const fetchUser = (id) => async (dispatch) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const response = await fetch(`/api/users/${id}`);
    const user = await response.json();
    dispatch({ type: 'SET_USER', payload: user });
    dispatch({ type: 'SET_LOADING', payload: false });
};

// components/Counter.jsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { increment, decrement, reset } from '../actions';

function Counter() {
    const count = useSelector((state) => state.counter.count);
    const dispatch = useDispatch();

    return (
        <div>
            <h2>计数器: {count}</h2>
            <button onClick={() => dispatch(increment())}>+</button>
            <button onClick={() => dispatch(decrement())}>-</button>
            <button onClick={() => dispatch(reset())}>重置</button>
        </div>
    );
}

export default Counter;

// App.jsx
import React from 'react';
import { Provider } from 'react-redux';
import store from './store';
import Counter from './components/Counter';
import User from './components/User';

function App() {
    return (
        <Provider store={store}>
            <div>
                <Counter />
                <User />
            </div>
        </Provider>
    );
}

export default App;
```

---

## 2. Redux Toolkit现代写法

### 2.1 createSlice

```javascript
import { createSlice, configureStore } from '@reduxjs/toolkit';

// 使用 createSlice
const counterSlice = createSlice({
    name: 'counter',
    initialState: { value: 0 },
    reducers: {
        increment: (state) => {
            // Redux Toolkit 允许直接修改 state
            state.value += 1;
        },
        decrement: (state) => {
            state.value -= 1;
        },
        incrementByAmount: (state, action) => {
            state.value += action.payload;
        }
    }
});

// 自动生成 action creators
const { increment, decrement, incrementByAmount } = counterSlice.actions;

// 创建 Store
const store = configureStore({
    reducer: {
        counter: counterSlice.reducer
    }
});

// 使用
store.dispatch(increment());
console.log(store.getState().counter); // { value: 1 }

store.dispatch(incrementByAmount(5));
console.log(store.getState().counter); // { value: 6 }
```

### 2.2 createAsyncThunk

```javascript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// 异步 Thunk
export const fetchUser = createAsyncThunk(
    'user/fetchUser',
    async (userId, { rejectWithValue }) => {
        try {
            const response = await fetch(`/api/users/${userId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch user');
            }
            return await response.json();
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const userSlice = createSlice({
    name: 'user',
    initialState: {
        currentUser: null,
        loading: false,
        error: null
    },
    reducers: {
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUser.fulfilled, (state, action) => {
                state.loading = false;
                state.currentUser = action.payload;
            })
            .addCase(fetchUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { clearError } = userSlice.actions;
export default userSlice.reducer;
```

### 2.3 Redux Toolkit 最佳实践

```javascript
import { createSlice, configureStore, createSelector } from '@reduxjs/toolkit';

// 1. 创建多个 Slice
const userSlice = createSlice({
    name: 'user',
    initialState: { name: '', age: 0 },
    reducers: {
        setName: (state, action) => {
            state.name = action.payload;
        },
        setAge: (state, action) => {
            state.age = action.payload;
        }
    }
});

const postsSlice = createSlice({
    name: 'posts',
    initialState: { items: [], filter: 'all' },
    reducers: {
        addPost: (state, action) => {
            state.items.push(action.payload);
        },
        setFilter: (state, action) => {
            state.filter = action.payload;
        }
    }
});

// 2. 配置 Store
const store = configureStore({
    reducer: {
        user: userSlice.reducer,
        posts: postsSlice.reducer
    }
});

// 3. 使用 createSelector 进行记忆化选择
const selectFilteredPosts = createSelector(
    (state) => state.posts.items,
    (state) => state.posts.filter,
    (items, filter) => {
        if (filter === 'all') return items;
        return items.filter(post => post.category === filter);
    }
);

// 4. React 组件中使用
function Posts() {
    const posts = useSelector(selectFilteredPosts);
    const dispatch = useDispatch();

    return (
        <ul>
            {posts.map(post => (
                <li key={post.id}>{post.title}</li>
            ))}
        </ul>
    );
}
```

---

## 3. Zustand状态管理

### 3.1 Zustand 基础

```javascript
import { create } from 'zustand';

// 创建 Store
const useCounterStore = create((set, get) => ({
    count: 0,

    // Actions
    increment: () => set((state) => ({ count: state.count + 1 })),
    decrement: () => set((state) => ({ count: state.count - 1 })),
    reset: () => set({ count: 0 }),

    // 带参数的 Action
    incrementBy: (amount) => set((state) => ({ count: state.count + amount })),

    // 获取当前状态
    getCount: () => get().count
}));

// 在组件中使用
function Counter() {
    const { count, increment, decrement, reset } = useCounterStore();

    return (
        <div>
            <p>计数: {count}</p>
            <button onClick={increment}>+</button>
            <button onClick={decrement}>-</button>
            <button onClick={reset}>重置</button>
        </div>
    );
}
```

### 3.2 Zustand 高级用法

```javascript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// 1. 使用中间件：开发工具
const useStore = create(
    devtools((set) => ({
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 }))
    }))
);

// 2. 使用中间件：持久化
const useStore = create(
    persist(
        (set) => ({
            count: 0,
            increment: () => set((state) => ({ count: state.count + 1 }))
        }),
        {
            name: 'my-storage', // localStorage 键名
            storage: {
                // 自定义存储
                getItem: (name) => {
                    const value = localStorage.getItem(name);
                    return value ? JSON.parse(value) : null;
                },
                setItem: (name, value) => {
                    localStorage.setItem(name, JSON.stringify(value));
                },
                removeItem: (name) => {
                    localStorage.removeItem(name);
                }
            }
        }
    )
);

// 3. 派生状态（使用选择器）
function Component() {
    // 只订阅 count 变化
    const count = useStore((state) => state.count);

    // 使用 shallow 比较对象
    const { name, age } = useStore(
        (state) => ({ name: state.name, age: state.age }),
        (prev, curr) => prev.name === curr.name && prev.age === curr.age
    );

    return <div>{name} - {age}</div>;
}

// 4. 完整示例
const useUserStore = create(
    devtools(
        persist(
            (set, get) => ({
                user: null,
                isAuthenticated: false,
                loading: false,
                error: null,

                login: async (credentials) => {
                    set({ loading: true, error: null });

                    try {
                        const response = await fetch('/api/login', {
                            method: 'POST',
                            body: JSON.stringify(credentials)
                        });

                        if (!response.ok) {
                            throw new Error('登录失败');
                        }

                        const user = await response.json();

                        set({ user, isAuthenticated: true, loading: false });
                    } catch (error) {
                        set({ error: error.message, loading: false });
                    }
                },

                logout: () => {
                    set({ user: null, isAuthenticated: false });
                },

                clearError: () => {
                    set({ error: null });
                }
            }),
            { name: 'user-store' }
        )
    )
);

// 使用
function LoginForm() {
    const { login, loading, error } = useUserStore();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        await login(Object.fromEntries(formData));
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && <p>{error}</p>}
            {loading && <p>登录中...</p>}
            <button type="submit">登录</button>
        </form>
    );
}
```

---

## 4. React Query/SWR数据获取

### 4.1 SWR 基础

```javascript
import useSWR from 'swr';

// 定义 fetcher
const fetcher = (url) => fetch(url).then((res) => res.json());

// 基础用法
function UserProfile({ userId }) {
    const { data, error, isLoading } = useSWR(
        `/api/users/${userId}`,
        fetcher
    );

    if (isLoading) return <div>加载中...</div>;
    if (error) return <div>错误: {error.message}</div>;

    return (
        <div>
            <h2>{data.name}</h2>
            <p>{data.email}</p>
        </div>
    );
}

// 高级配置
function AdvancedUsage() {
    const { data, error, isLoading, mutate } = useSWR(
        '/api/data',
        fetcher,
        {
            // 数据刷新策略
            revalidateOnFocus: true,     // 窗口聚焦时重新验证
            revalidateOnReconnect: true, // 重新连接时重新验证
            refreshInterval: 5000,        // 自动轮询间隔（毫秒）
            refreshWhenHidden: false,    // 窗口隐藏时继续轮询
            refreshWhenOffline: false,    // 离线时继续轮询

            // 缓存策略
            dedupingInterval: 2000,       // 防重复请求间隔
            fallbackData: null,           // 初始数据

            // 错误重试
            shouldRetryOnError: true,
            errorRetryCount: 3,

            // 并行请求
            parallel: false
        }
    );

    // 手动触发重新验证
    const handleRevalidate = () => {
        mutate();
    };

    // 乐观更新
    const handleUpdate = async (newData) => {
        // 立即更新缓存
        mutate(
            '/api/data',
            { ...data, ...newData },
            false
        );

        try {
            await fetch('/api/data', {
                method: 'PUT',
                body: JSON.stringify(newData)
            });
        } catch (error) {
            // 回滚
            mutate('/api/data');
        }
    };

    return <div>{data}</div>;
}
```

### 4.2 React Query 基础

```javascript
import {
    useQuery,
    useMutation,
    useQueryClient,
    QueryClient,
    QueryClientProvider
} from '@tanstack/react-query';

// 创建 QueryClient
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,    // 5 分钟内数据视为新鲜
            gcTime: 1000 * 60 * 10,    // 10 分钟后垃圾回收
            retry: 3,                    // 失败重试次数
            refetchOnWindowFocus: false  // 窗口聚焦时不重新获取
        }
    }
});

// 使用 useQuery
function UserList() {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await fetch('/api/users');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        },
        staleTime: 1000 * 60, // 1 分钟
        enabled: true,         // 条件查询
        placeholderData: []    // 加载中的占位数据
    });

    if (isLoading) return <div>加载中...</div>;
    if (error) return <div>错误: {error.message}</div>;

    return (
        <div>
            <button onClick={() => refetch()}>刷新</button>
            <ul>
                {data.map(user => (
                    <li key={user.id}>{user.name}</li>
                ))}
            </ul>
        </div>
    );
}

// 使用 useMutation
function CreateUser() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (newUser) => {
            const response = await fetch('/api/users', {
                method: 'POST',
                body: JSON.stringify(newUser)
            });
            return response.json();
        },
        onSuccess: () => {
            //  invalidate 并重新获取
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: (error) => {
            console.error('Error:', error);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate({ name: '张三', email: 'zhangsan@example.com' });
    };

    return (
        <form onSubmit={handleSubmit}>
            <button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? '提交中...' : '创建用户'}
            </button>
            {mutation.isError && (
                <p>错误: {mutation.error.message}</p>
            )}
        </form>
    );
}

// 包装应用
function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <UserList />
            <CreateUser />
        </QueryClientProvider>
    );
}
```

### 4.3 常见面试问题

**问题1：Redux 和 Zustand 有什么区别？**

答案：
- Redux：更完整的架构，更适合大型应用，需要更多样板代码
- Zustand：更轻量，更简单，不需要 Provider 包装

**问题2：React Query 和 Redux 有什么区别？**

答案：
- Redux：通用状态管理，适合所有状态
- React Query：专门用于服务器状态（数据获取），自动处理缓存、轮询、乐观更新等

**问题3：SWR 和 React Query 有什么区别？**

答案：
- SWR：更轻量，API 简洁，Vercel 出品
- React Query：功能更完整，文档更详细，社区更大

---

## 5. Jotai 原子化状态管理

### 5.1 Jotai 基础

```typescript
import { atom, useAtom } from 'jotai';

// 创建原子状态
const countAtom = atom(0);
const userAtom = atom({ name: '张三', age: 25 });

// 在组件中使用
function Counter() {
  const [count, setCount] = useAtom(countAtom);

  return (
    <div>
      <p>计数: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>+1</button>
      <button onClick={() => setCount((c) => c - 1)}>-1</button>
    </div>
  );
}

// 派生原子（只读）
const doubleCountAtom = atom((get) => get(countAtom) * 2);

// 读写原子
const incrementAtom = atom(
  (get) => get(countAtom),
  (get, set, amount: number) => set(countAtom, get(countAtom) + amount)
);
```

### 5.2 Jotai 高级用法

```typescript
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { atomWithStorage, atomWithReset, RESET } from 'jotai/utils';

// 1. 持久化原子
const themeAtom = atomWithStorage('theme', 'light');

// 2. 可重置原子
const formAtom = atomWithReset({ name: '', email: '' });

function Form() {
  const [form, setForm] = useAtom(formAtom);

  const handleReset = () => {
    setForm(RESET);
  };

  return (
    <form>
      <input
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <button type="button" onClick={handleReset}>
        重置
      </button>
    </form>
  );
}

// 3. 异步原子
const userAtom = atom(async (get) => {
  const response = await fetch('/api/user');
  return response.json();
});

function UserProfile() {
  const [user] = useAtom(userAtom);

  // 自动处理 loading 和 error
  if (user instanceof Promise) {
    return <div>加载中...</div>;
  }

  return <div>{user.name}</div>;
}

// 4. 原子族（动态创建原子）
const todoAtom = atomFamily((id: string) =>
  atom({ id, text: '', completed: false })
);

function TodoItem({ id }: { id: string }) {
  const [todo, setTodo] = useAtom(todoAtom(id));

  return (
    <div>
      <input
        value={todo.text}
        onChange={(e) => setTodo({ ...todo, text: e.target.value })}
      />
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={(e) => setTodo({ ...todo, completed: e.target.checked })}
      />
    </div>
  );
}

// 5. 选择器优化
import { selectAtom } from 'jotai/utils';

const userAtom = atom({ name: '张三', age: 25, email: 'test@example.com' });
const userNameAtom = selectAtom(userAtom, (user) => user.name);

function UserName() {
  // 只有 name 变化时才重新渲染
  const name = useAtomValue(userNameAtom);
  return <div>{name}</div>;
}
```

### 5.3 Jotai 完整示例

```typescript
// store.ts
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// 基础原子
export const todosAtom = atomWithStorage('todos', []);

// 派生原子
export const completedTodosAtom = atom((get) =>
  get(todosAtom).filter((todo) => todo.completed)
);

export const pendingTodosAtom = atom((get) =>
  get(todosAtom).filter((todo) => !todo.completed)
);

// 操作原子
export const addTodoAtom = atom(null, (get, set, text: string) => {
  const newTodo = {
    id: Date.now().toString(),
    text,
    completed: false,
    createdAt: new Date(),
  };
  set(todosAtom, [...get(todosAtom), newTodo]);
});

export const toggleTodoAtom = atom(null, (get, set, id: string) => {
  set(
    todosAtom,
    get(todosAtom).map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    )
  );
});

export const deleteTodoAtom = atom(null, (get, set, id: string) => {
  set(
    todosAtom,
    get(todosAtom).filter((todo) => todo.id !== id)
  );
});

// components/TodoList.tsx
import { useAtomValue, useSetAtom } from 'jotai';
import {
  todosAtom,
  addTodoAtom,
  toggleTodoAtom,
  deleteTodoAtom,
} from '../store';

function TodoList() {
  const todos = useAtomValue(todosAtom);
  const addTodo = useSetAtom(addTodoAtom);
  const toggleTodo = useSetAtom(toggleTodoAtom);
  const deleteTodo = useSetAtom(deleteTodoAtom);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem('todo') as HTMLInputElement;
    if (input.value.trim()) {
      addTodo(input.value.trim());
      input.value = '';
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input name="todo" placeholder="添加待办事项" />
        <button type="submit">添加</button>
      </form>

      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span
              style={{
                textDecoration: todo.completed ? 'line-through' : 'none',
              }}
            >
              {todo.text}
            </span>
            <button onClick={() => deleteTodo(todo.id)}>删除</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 6. 状态管理选型指南

### 6.1 选型决策树

```
需要状态管理？
├── 仅客户端状态
│   ├── 简单状态（计数、开关）
│   │   └── useState / useReducer
│   ├── 中等复杂度（表单、用户偏好）
│   │   └── Zustand / Jotai
│   └── 复杂状态（多模块、时间旅行）
│       └── Redux Toolkit
│
└── 服务器状态（API 数据）
    ├── 简单数据获取
    │   └── SWR
    └── 复杂数据管理（缓存、同步）
        └── React Query
```

### 6.2 各方案对比

| 特性 | Redux Toolkit | Zustand | Jotai | React Query |
|------|--------------|---------|-------|-------------|
| 学习曲线 | 中等 | 低 | 低 | 中等 |
| 样板代码 | 中等 | 少 | 少 | 少 |
| 调试工具 | 优秀 | 良好 | 良好 | 优秀 |
| TypeScript | 优秀 | 优秀 | 优秀 | 优秀 |
| 适用场景 | 大型应用 | 中小型 | 中小型 | 服务器状态 |
| 性能 | 良好 | 优秀 | 优秀 | 优秀 |
| 生态 | 丰富 | 良好 | 良好 | 丰富 |

### 6.3 最佳实践

```typescript
// 1. 分离客户端状态和服务器状态
// store/uiStore.ts - 客户端状态
import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  theme: 'light',
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
}));

// hooks/useUsers.ts - 服务器状态
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then((res) => res.json()),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (user: CreateUserDTO) =>
      fetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(user),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// 2. 组合使用
function App() {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const { data: users } = useUsers();

  return (
    <div>
      <Sidebar open={sidebarOpen} />
      <UserList users={users} />
    </div>
  );
}
```

---

## 7. 性能优化

### 7.1 选择器优化

```typescript
// Zustand 选择器
function UserCard() {
  // ❌ 不好：订阅整个 user 对象
  const user = useUserStore((state) => state.user);

  // ✅ 好：只订阅需要的字段
  const name = useUserStore((state) => state.user.name);
  const email = useUserStore((state) => state.user.email);

  return (
    <div>
      <span>{name}</span>
      <span>{email}</span>
    </div>
  );
}

// Redux 选择器
import { createSelector } from '@reduxjs/toolkit';

// 记忆化选择器
const selectUserById = createSelector(
  [(state) => state.users.items, (_, userId) => userId],
  (users, userId) => users.find((user) => user.id === userId)
);

function UserDetail({ userId }) {
  const user = useSelector((state) => selectUserById(state, userId));
  return <div>{user?.name}</div>;
}

// React Query 选择器
function UserName() {
  const { data: name } = useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
    select: (user) => user.name, // 只选择需要的字段
  });

  return <div>{name}</div>;
}
```

### 7.2 状态拆分

```typescript
// ❌ 不好：单一巨大状态
const useStore = create((set) => ({
  user: { ... },
  posts: { ... },
  comments: { ... },
  notifications: { ... },
  settings: { ... },
}));

// ✅ 好：按功能拆分
const useUserStore = create((set) => ({ ... }));
const usePostStore = create((set) => ({ ... }));
const useCommentStore = create((set) => ({ ... }));
const useNotificationStore = create((set) => ({ ... }));
const useSettingsStore = create((set) => ({ ... }));
```

### 7.3 懒加载状态

```typescript
// Zustand 懒加载
const useLazyStore = create((set) => ({
  data: null,
  loaded: false,
  loadData: async () => {
    if (useLazyStore.getState().loaded) return;
    const data = await fetchData();
    set({ data, loaded: true });
  },
}));

function Component() {
  const { data, loadData } = useLazyStore();

  useEffect(() => {
    loadData();
  }, []);

  return <div>{data}</div>;
}

// React Query 懒加载
function LazyComponent() {
  const [enabled, setEnabled] = useState(false);

  const { data } = useQuery({
    queryKey: ['lazy-data'],
    queryFn: fetchData,
    enabled, // 条件查询
  });

  return (
    <div>
      <button onClick={() => setEnabled(true)}>加载数据</button>
      {data && <div>{data}</div>}
    </div>
  );
}
```

---

## 8. 测试

### 8.1 Zustand 测试

```typescript
// __tests__/useCounterStore.test.ts
import { act, renderHook } from '@testing-library/react';
import { useCounterStore } from '../store/counterStore';

describe('useCounterStore', () => {
  beforeEach(() => {
    // 重置状态
    useCounterStore.setState({ count: 0 });
  });

  it('应该正确初始化', () => {
    const { result } = renderHook(() => useCounterStore());
    expect(result.current.count).toBe(0);
  });

  it('应该正确增加计数', () => {
    const { result } = renderHook(() => useCounterStore());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('应该正确减少计数', () => {
    const { result } = renderHook(() => useCounterStore());

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(-1);
  });
});
```

### 8.2 React Query 测试

```typescript
// __tests__/useUsers.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUsers } from '../hooks/useUsers';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useUsers', () => {
  it('应该正确获取用户列表', async () => {
    const { result } = renderHook(() => useUsers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(10);
  });
});
```

---

## 9. 面试高频问题

### 问题1：什么时候需要状态管理？

**答案：**
- 多个组件需要共享状态
- 状态需要跨层级传递
- 需要持久化状态
- 需要时间旅行调试
- 复杂的状态逻辑

### 问题2：Redux 的三大原则是什么？

**答案：**
1. **单一数据源**：整个应用的 state 存储在一个 store 中
2. **State 是只读的**：只能通过 dispatch action 修改
3. **使用纯函数修改**：Reducer 是纯函数

### 问题3：Zustand 相比 Redux 有什么优势？

**答案：**
- 更少的样板代码
- 不需要 Provider 包装
- 更直观的 API
- 更小的包体积
- 更好的 TypeScript 支持

### 问题4：React Query 如何处理缓存？

**答案：**
- 使用 queryKey 作为缓存键
- staleTime 控制数据新鲜度
- gcTime 控制垃圾回收时间
- invalidateQueries 手动失效缓存
- 自动后台重新获取

### 问题5：如何选择状态管理方案？

**答案：**
1. 简单状态：useState / useReducer
2. 中等复杂度：Zustand / Jotai
3. 大型应用：Redux Toolkit
4. 服务器状态：React Query / SWR
5. 可以组合使用

---

## 10. 最佳实践总结

### 10.1 状态管理清单

- [ ] 分离客户端状态和服务器状态
- [ ] 按功能模块拆分状态
- [ ] 使用选择器优化性能
- [ ] 合理使用持久化
- [ ] 编写单元测试
- [ ] 使用 TypeScript 类型安全

### 10.2 常见陷阱

| 陷阱 | 解决方案 |
|------|----------|
| 状态过于庞大 | 按功能拆分 |
| 过度订阅 | 使用选择器 |
| 不必要的重渲染 | memo + 选择器 |
| 服务器状态混入 | 使用 React Query |
| 缺少类型定义 | 使用 TypeScript |

---

*本文档最后更新于 2026年3月*
