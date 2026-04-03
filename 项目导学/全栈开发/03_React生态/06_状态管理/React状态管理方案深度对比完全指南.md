# React 状态管理方案深度对比完全指南

> 本文档深入对比 React 生态中主流的状态管理方案，从设计哲学、核心原理、性能特征到实战应用，帮助开发者在不同场景下做出合理的技术选型决策。

---

## 一、状态管理全景图

### 1.1 状态管理的本质

状态管理是前端应用开发中最核心的问题之一。在 React 应用中，状态决定了 UI 将如何渲染。当应用简单时，我们可以通过组件本地的 `useState` 和 `useReducer` 来管理状态。但随着应用规模增长，状态需要跨越组件层级进行共享，同步到服务端，或者在多个不相关的组件之间保持一致。这时，我们就需要更强大的状态管理方案。

理解状态管理的第一步是认识到：**状态是分层的，不同类型的状态应该使用不同的管理策略**。

### 1.2 状态分类体系

我们可以将 React 应用中的状态按照作用域和生命周期分为四个层次：

```
┌─────────────────────────────────────────────────────────────┐
│                      状态分层金字塔                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    ┌─────────────────┐                       │
│                    │   服务端状态    │  ← React Query/SWR   │
│                    │  (Server State) │                       │
│                    └────────┬────────┘                       │
│                             │                                │
│                    ┌────────┴────────┐                       │
│                    │   全局应用状态   │  ← Zustand/Redux     │
│                    │  (Global State) │                       │
│                    └────────┬────────┘                       │
│                             │                                │
│                    ┌────────┴────────┐                       │
│                    │   跨组件状态      │  ← Context           │
│                    │ (Cross-Component) │                      │
│                    └────────┬────────┘                       │
│                             │                                │
│                    ┌────────┴────────┐                       │
│                    │   组件本地状态    │  ← useState         │
│                    │   (Local State)  │                       │
│                    └─────────────────┘                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 各层状态详细解析

#### 1.3.1 组件本地状态 (Local State)

组件本地状态是最基础的状态类型，它仅属于单个组件，不会与其他组件共享。这类状态使用 `useState` 或 `useReducer` 来管理。

**典型使用场景：**

- 表单输入框的值
- 模态框的打开/关闭状态
- 下拉菜单的展开/折叠
- 按钮的加载状态
- 动画状态

**代码示例：**

```tsx
// 本地状态：计数器
function Counter() {
  // count 是本地状态，setCount 是更新函数
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(c => c + 1)}>
      点击次数：{count}
    </button>
  );
}

// 本地状态：表单输入
function FormInput() {
  const [value, setValue] = useState('');
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);

    // 输入验证
    if (newValue.length < 2) {
      setError('输入至少需要2个字符');
    } else {
      setError(null);
    }
  };

  return (
    <div>
      <input value={value} onChange={handleChange} />
      {error && <span style={{ color: 'red' }}>{error}</span>}
    </div>
  );
}
```

**设计原则：** 能用本地状态解决的问题，不要提升到全局。过度使用全局状态会导致应用逻辑分散，增加调试难度。

#### 1.3.2 跨组件状态 (Cross-Component State)

当状态需要在兄弟组件之间共享，或者需要传递给子组件时，我们可以使用 Context 或者将状态提升到共同的父组件。

**典型使用场景：**

- 主题切换（深色/浅色模式）
- 用户登录状态
- 语言/国际化设置
- 购物车（在电商应用中）

**代码示例：**

```tsx
// 主题 Context 示例
import { createContext, useContext, useState } from 'react';

// 创建 Context
const ThemeContext = createContext(null);

// Theme Provider 组件
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 消费 Context 的组件
function ThemedButton() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <button
      onClick={toggleTheme}
      style={{
        background: theme === 'dark' ? '#333' : '#fff',
        color: theme === 'dark' ? '#fff' : '#333'
      }}
    >
      当前主题：{theme}
    </button>
  );
}
```

**Context 的内部原理：**

Context 是 React 16.3 引入的新特性，它的实现基于 **订阅-发布模式**。当 Provider 的 value 发生变化时，所有消费该 Context 的组件都会重新渲染。但这里有一个重要的优化点：**只有真正使用到变化值的组件才会重新渲染**。

React 通过比较新旧 value 的引用来判断是否需要触发更新。如果 value 是一个对象，确保使用 `useMemo` 包裹可以避免不必要的更新：

```tsx
// ❌ 错误：每次渲染都创建新对象
<ThemeContext.Provider value={{ theme, toggleTheme }}>

// ✅ 正确：使用 useMemo 缓存 value
<ThemeContext.Provider value={useMemo(() => ({
  theme,
  toggleTheme
}), [theme])}>
```

#### 1.3.3 全局应用状态 (Global State)

当状态需要在应用的任何位置访问时，我们需要全局状态管理器。React 生态中有多种全局状态管理方案，它们各有特点和适用场景。

**主流全局状态管理方案：**

| 方案 | 设计哲学 | 核心概念 | 学习曲线 |
|------|----------|----------|----------|
| Redux | 可预测性、单一数据源 | Store + Reducer + Action | 较陡 |
| Zustand | 极简主义、Hooks 优先 | Store + Actions | 平缓 |
| Jotai | 原子化状态 | Atoms | 平缓 |
| Recoil | 原子化状态、React 原生 | Atoms + Selectors | 中等 |
| Valtio | 代理响应式 | Proxy | 平缓 |

** Zustand 核心用法示例：**

```tsx
import { create } from 'zustand';

// 定义 Store 类型
interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

// 创建 Store
const useCounterStore = create<CounterState>((set) => ({
  count: 0,

  // actions 是纯函数，通过 set 更新状态
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));

// 使用 Store
function Counter() {
  // 直接解构获取状态和方法
  const { count, increment, decrement, reset } = useCounterStore();

  return (
    <div>
      <h1>计数：{count}</h1>
      <button onClick={increment}>+1</button>
      <button onClick={decrement}>-1</button>
      <button onClick={reset}>重置</button>
    </div>
  );
}
```

#### 1.3.4 服务端状态 (Server State)

服务端状态是指来自远程服务器的数据，如 API 返回的用户信息、文档内容、商品列表等。与本地状态不同，服务端状态具有以下特征：

- **异步性**：数据需要通过网络请求获取，存在加载时间
- **可变性**：服务端数据可能随时变化
- **共享性**：多个组件可能需要同一份服务端数据
- **缓存需求**：需要避免重复请求，提升性能

**主流服务端状态管理方案：**

| 方案 | 缓存策略 | 特性 | GitHub Stars |
|------|----------|------|--------------|
| React Query | stale-while-revalidate | 全功能、自动缓存 | 35k+ |
| SWR | stale-while-revalidate | 轻量、实时性支持 | 28k+ |
| RTK Query | stale-while-revalidate | 内置于 Redux | 12k+ |

**React Query 核心用法示例：**

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// 获取数据
function UserProfile({ userId }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetch(`/api/users/${userId}`).then(res => res.json()),
    staleTime: 5 * 60 * 1000, // 5分钟内不重新获取
  });

  if (isLoading) return <div>加载中...</div>;
  if (error) return <div>错误：{error.message}</div>;

  return <div>用户名：{data.name}</div>;
}

// 修改数据
function UpdateUser() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newName) =>
      fetch('/api/users/1', {
        method: 'PATCH',
        body: JSON.stringify({ name: newName }),
      }).then(res => res.json()),

    // 成功后使缓存失效，触发重新获取
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 1] });
    },
  });

  return (
    <button
      onClick={() => mutation.mutate('新用户名')}
      disabled={mutation.isPending}
    >
      {mutation.isPending ? '更新中...' : '更新用户名'}
    </button>
  );
}
```

### 1.4 我的思考：分层管理的艺术

状态管理方案的选择不应该盲目追新，而应该基于实际需求。我认为合理的状态分层应该遵循以下原则：

**第一原则：本地优先。** 只有当状态确实需要在多个组件之间共享时，才考虑使用 Context 或全局状态管理。过度工程化是很多项目的通病。

**第二原则：按需升级。** 当发现 Context 导致的性能问题，当 Redux 显得过于繁琐时，可以考虑引入专门的全局状态管理方案。Zustand 和 Jotai 这样的轻量方案是很好的过渡选择。

**第三原则：服务端状态独立。** 服务端状态管理是一个独立的问题域，React Query 和 SWR 提供了完美的解决方案。它们处理了缓存、乐观更新、后台刷新等复杂逻辑，让开发者专注于业务逻辑。

**第四原则：混合使用是常态。** 在实际项目中，混合使用多种状态管理方案是完全正常的。一个典型的中大型 React 应用可能同时使用：本地状态管理表单、用 Context 处理主题、用 Zustand 管理用户会话、用 React Query 获取 API 数据。

---

## 二、Context vs Redux

### 2.1 Context 的实现原理

理解 Context 的原理对于做出正确的技术选型至关重要。Context 不是魔法，它的实现基于 React 的核心渲染机制。

#### 2.1.1 Context 的数据结构

每个 Context 对象内部包含两个关键组件：

```tsx
// Context 的简化内部结构
interface Context<T> {
  Provider: ProviderComponent<T>;
  Consumer: ConsumerComponent<T>;
  displayName: string;
}

// Provider 组件的内部结构
interface ProviderProps<T> {
  value: T;
  children: ReactNode;
}
```

#### 2.1.2 Context 传播机制

当 React 渲染一个 Provider 时，它会将 value 存储在内部的 Fiber 节点中。当子组件读取 Context 值时，React 会沿着 Fiber 树向上查找最近的 Provider。

```tsx
// 伪代码：Context 值的读取过程
function readContext(Context) {
  const currentValue = queue.peek();

  // 如果没有 Provider，使用 defaultValue
  if (currentValue === undefined) {
    return Context._defaultValue;
  }

  return currentValue;
}
```

#### 2.1.3 Context 更新的实现

Context 的更新机制基于 **comparing references**（引用比较）。当 Provider 的 value 变化时，React 会标记所有消费该 Context 的子组件为"需要重新渲染"。

```tsx
// Context 更新的关键逻辑
function updateContextConsumers(Context, changedBits) {
  // 遍历所有消费该 Context 的组件
  // 逐个比较它们的 value 是否变化
  // 如果变化，标记为需要更新
}
```

**重要发现：** Context 的更新粒度是**整个 Context**，而不是单个值。这意味着如果一个 Context 包含多个值，任何一个值变化都会导致所有消费该 Context 的组件重新渲染。

### 2.2 Redux 的架构设计

Redux 是目前最成熟的全功能状态管理方案，它的设计理念是**可预测性**和**单一数据源**。

#### 2.2.1 Redux 核心概念

```
┌─────────────────────────────────────────────────────────────┐
│                        Redux 数据流                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────┐    dispatch     ┌──────────┐    subscribe    │
│   │   UI     │ ──────────────→ │   Store   │ ←────────────── │
│   │(Component)│                 │ (单一数据源) │                │
│   └──────────┘                 └─────┬────┘                │
│        ↑                              │                      │
│        │         update               │ notify              │
│        └──────────────────────────────┘                      │
│                                                             │
│   Action ─────────────────────────────────────────────────→│
│     │                                                         │
│     ↓                                                         │
│   Reducer ─────────────────────────────────────────────────→│
│     │                                                         │
│     ↓                                                         │
│   New State                                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 2.2.2 Redux 的三大原则

**原则一：单一数据源**

整个应用的 state 被存储在一棵唯一的对象树中，位于唯一的 Store。这使得状态可追溯、易于调试。

```tsx
// 单一数据源示例
const store = createStore(rootReducer);

console.log(store.getState());
// {
//   users: { list: [], currentUser: null },
//   posts: { list: [], loading: false },
//   comments: { byPostId: {} }
// }
```

**原则二：State 是只读的**

唯一改变 state 的方式是触发 action。action 是描述"发生了什么"的普通对象。

```tsx
// Action 是普通对象
const addTodo = {
  type: 'ADD_TODO',
  payload: { id: 1, text: '学习 Redux' }
};

store.dispatch(addTodo);
```

**原则三：使用纯函数描述状态变化**

Reducers 是纯函数，接收先前的 state 和 action，返回新的 state。

```tsx
// Reducer 是纯函数
function counterReducer(state = 0, action) {
  switch (action.type) {
    case 'INCREMENT':
      return state + 1;
    case 'DECREMENT':
      return state - 1;
    default:
      return state;
  }
}
```

### 2.3 性能对比：Context vs Redux

#### 2.3.1 更新机制对比

| 维度 | Context | Redux |
|------|---------|-------|
| 更新触发 | Provider value 变化 | dispatch action |
| 更新范围 | 整个 Context 树 | 依赖选择器 |
| 优化方式 | React.memo + useMemo | Reselect 选择器 |
| 重渲染控制 | 困难 | 精细 |

**Context 的性能问题：**

```tsx
// Context 性能陷阱
const AppContext = createContext({
  user: null,
  theme: 'light',
  language: 'zh-CN',
  notifications: [],
  // ... 更多状态
});

// 问题：任何状态变化都会导致所有消费者重新渲染
function App() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('zh-CN');
  const [notifications, setNotifications] = useState([]);

  return (
    <AppContext.Provider value={{
      user, setUser,
      theme, setTheme,
      language, setLanguage,
      notifications, setNotifications,
    }}>
      <App />
    </AppContext.Provider>
  );
}
```

**Redux 的性能优势：**

```tsx
// Redux 精细的重渲染控制
function UserProfile() {
  // 只有 user 变化时才重新渲染
  const user = useSelector(state => state.user.currentUser);

  // 只有 theme 变化时才重新渲染
  const theme = useSelector(state => state.ui.theme);
}

// 配合 React.memo 进一步优化
const UserAvatar = React.memo(({ user }) => {
  return <img src={user.avatar} alt={user.name} />;
});
```

#### 2.3.2 实战性能测试

以下是一个对比测试，展示 Context 和 Redux 在高频更新场景下的性能差异：

```tsx
// 测试场景：每秒更新 100 次的计数器

// Context 实现
function ContextCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(c => c + 1);
    }, 10);
    return () => clearInterval(interval);
  }, []);

  return <span>{count}</span>;
}

// 问题：每次更新都会触发所有 Context 消费者的重渲染
```

**结论：**

- **Context 适合低频更新**（主题、语言设置、用户登录状态）
- **Redux 适合高频更新**（表单数据、实时数据、多组件同步）
- **Zustand/Jotai 是折中方案**（比 Context 更好的性能，比 Redux 更低的复杂度）

### 2.4 使用场景对比

#### 2.4.1 Context 的最佳适用场景

1. **主题系统**
   - 变化频率低
   - 需要全局访问
   - 通常只有少数几个属性

2. **国际化/多语言**
   - 应用启动时加载
   - 变化频率极低
   - 所有 UI 都需要访问

3. **认证状态**
   - 登录/登出操作
   - 用户信息需要全局访问
   - 变化频率中等

4. **简单配置**
   - 功能开关
   - API 配置
   - 环境变量

#### 2.4.2 Redux 的最佳适用场景

1. **复杂的状态逻辑**
   - 多个状态相互关联
   - 需要 undo/redo 功能
   - 状态变化需要追踪和回放

2. **大规模应用**
   - 多个团队协作开发
   - 需要统一的状态管理规范
   - 需要完善的调试工具

3. **实时协作应用**
   - 多个用户同时编辑
   - 需要 optimistic update
   - 需要冲突解决

4. **复杂的数据处理**
   - 大量数据的筛选、排序
   - 分页、无限滚动
   - 缓存和失效策略

### 2.5 实战：状态迁移策略

当你需要将 Context 迁移到 Redux（或 Zustand）时，以下策略可以降低风险：

#### 2.5.1 渐进式迁移

```tsx
// 第一步：创建 Redux Store（与原有 Context 并存）
const newStore = create<State>()((set) => ({
  user: null,
  theme: 'light',
}));

// 第二步：逐个功能迁移
function UserProfile() {
  // 暂时还在用 Context
  const { user } = useContext(UserContext);

  // 新的数据来源
  const reduxUser = useSelector(state => state.user.currentUser);

  // 优先使用 Redux 版本
  const displayUser = reduxUser || user;

  return <div>{displayUser?.name}</div>;
}

// 第三步：完全移除 Context
```

#### 2.5.2 同步策略

```tsx
// 保持 Context 和 Redux 同步
function DualProvider({ children }) {
  const dispatch = useDispatch();

  // 监听 Context 变化，同步到 Redux
  const contextUser = useContext(UserContext);

  useEffect(() => {
    if (contextUser) {
      dispatch(setUser(contextUser));
    }
  }, [contextUser, dispatch]);

  return <ReduxProvider>{children}</ReduxProvider>;
}
```

---

## 三、Redux 深度解析

### 3.1 Redux 架构：Store-Reducer-Action

Redux 的架构是其可预测性的基础。理解这三个核心概念及其关系，是掌握 Redux 的关键。

#### 3.1.1 Store 的职责

Store 是 Redux 应用的核心，它负责：

1. **存储状态** - 维护应用的唯一数据源
2. **分发 Action** - 提供 `dispatch` 方法触发状态变化
3. **订阅变更** - 提供 `subscribe` 方法监听状态变化
4. **返回状态** - 提供 `getState` 方法获取当前状态

```tsx
import { createStore } from 'redux';

// 创建 Store
const store = createStore(rootReducer);

// Store 的核心 API
store.getState();     // 获取当前状态
store.dispatch({});  // 分发 action
store.subscribe(() => {}); // 订阅变化
```

#### 3.1.2 Reducer 的纯函数设计

Reducer 是 Redux 中最核心的概念之一。它是一个纯函数，接收先前的状态和 action，返回新的状态。

```tsx
// Reducer 的签名
type Reducer<S, A> = (state: S, action: A) => S;

// 示例：todo reducer
interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

type TodoAction =
  | { type: 'ADD_TODO'; payload: { text: string } }
  | { type: 'TOGGLE_TODO'; payload: { id: string } }
  | { type: 'DELETE_TODO'; payload: { id: string } };

function todoReducer(state: Todo[] = [], action: TodoAction): Todo[] {
  switch (action.type) {
    case 'ADD_TODO':
      return [
        ...state,
        {
          id: crypto.randomUUID(),
          text: action.payload.text,
          completed: false,
        },
      ];

    case 'TOGGLE_TODO':
      return state.map((todo) =>
        todo.id === action.payload.id
          ? { ...todo, completed: !todo.completed }
          : todo
      );

    case 'DELETE_TODO':
      return state.filter((todo) => todo.id !== action.payload.id);

    default:
      return state;
  }
}
```

**纯函数的核心要求：**

1. **不修改输入参数** - 始终返回新对象/新数组
2. **不产生副作用** - 不进行 API 调用、不修改外部变量
3. **相同输入相同输出** - 相同的 state 和 action 必须返回相同的结果

```tsx
// ❌ 错误：修改了原始 state
function todoReducer(state, action) {
  state.push({ id: 1, text: 'new' }); // 违法！
  return state;
}

// ✅ 正确：返回新数组
function todoReducer(state, action) {
  return [...state, { id: 1, text: 'new' }];
}
```

#### 3.1.3 Action 的设计模式

Action 是描述"发生了什么"的普通对象。良好的 Action 设计可以提高应用的可维护性。

```tsx
// 简单 Action
const addTodo = {
  type: 'ADD_TODO',
  payload: { text: '学习 Redux' },
};

// Action Creator（推荐）
function addTodo(text: string) {
  return {
    type: 'ADD_TODO',
    payload: { id: crypto.randomUUID(), text, completed: false },
  };
}

// 使用
store.dispatch(addTodo('学习 Redux'));

// 异步 Action（使用 thunk）
function fetchUser(id: string) {
  return async (dispatch) => {
    dispatch({ type: 'FETCH_USER_START' });

    try {
      const response = await fetch(`/api/users/${id}`);
      const user = await response.json();

      dispatch({ type: 'FETCH_USER_SUCCESS', payload: user });
    } catch (error) {
      dispatch({ type: 'FETCH_USER_ERROR', payload: error.message });
    }
  };
}
```

### 3.2 中间件机制：applyMiddleware

中间件是 Redux 强大的扩展机制，它允许我们在 action 被 dispatch 到 reducer 之间插入自定义逻辑。

#### 3.2.1 中间件的工作原理

中间件基于**函数式编程**的 decorator 模式。其基本结构是：

```tsx
// 中间件签名
type Middleware<DispatchExt = {}> = (
  store: MiddlewareAPI
) => (
  next: Dispatch
) => (
  action: unknown
) => unknown;

// 日志中间件示例
function loggerMiddleware(store) {
  return function(next) {
    return function(action) {
      console.log('dispatching:', action);
      console.log('state before:', store.getState());

      const result = next(action);

      console.log('state after:', store.getState());

      return result;
    };
  };
}
```

使用 ES6 箭头函数的简化版本：

```tsx
const loggerMiddleware = (store) => (next) => (action) => {
  console.log('dispatching:', action);
  const result = next(action);
  console.log('next state:', store.getState());
  return result;
};
```

#### 3.2.2 常见中间件

**redux-thunk：处理异步逻辑**

```tsx
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';

// thunk 允许 action creator 返回函数而不是对象
const fetchUser = (userId) => async (dispatch) => {
  dispatch({ type: 'FETCH_USER_REQUEST' });

  try {
    const response = await fetch(`/api/users/${userId}`);
    const user = await response.json();

    dispatch({ type: 'FETCH_USER_SUCCESS', payload: user });
  } catch (error) {
    dispatch({ type: 'FETCH_USER_FAILURE', payload: error });
  }
};

// 使用
store.dispatch(fetchUser(123));
```

**redux-saga：处理复杂异步流程**

```tsx
import { call, put, takeEvery } from 'redux-saga/effects';

function* fetchUserSaga(action) {
  try {
    const user = yield call(fetchApi, `/users/${action.payload}`);
    yield put({ type: 'FETCH_USER_SUCCESS', payload: user });
  } catch (error) {
    yield put({ type: 'FETCH_USER_ERROR', payload: error });
  }
}

function* watchFetchUser() {
  yield takeEvery('FETCH_USER_REQUEST', fetchUserSaga);
}
```

**redux-logger：开发环境日志**

```tsx
import { createLogger } from 'redux-logger';

const logger = createLogger({
  // 可配置选项
  collapsed: true,
  diff: true,
  duration: true,
});

// 应用中间件
const store = createStore(
  reducer,
  applyMiddleware(thunk, logger)
);
```

#### 3.2.3 自定义中间件

```tsx
// 异步状态管理中间件
const asyncStatusMiddleware = (store) => (next) => (action) => {
  if (!action.async) {
    return next(action);
  }

  const { types, promise } = action;

  // 触发请求开始
  store.dispatch({
    type: types.request,
    payload: action.payload,
  });

  return promise
    .then((result) => {
      store.dispatch({
        type: types.success,
        payload: result,
      });
    })
    .catch((error) => {
      store.dispatch({
        type: types.failure,
        payload: error,
      });
    });
};

// 使用自定义中间件
const apiAction = {
  async: true,
  types: ['FETCH_REQUEST', 'FETCH_SUCCESS', 'FETCH_FAILURE'],
  promise: () => fetch('/api/data').then(r => r.json()),
};
```

### 3.3 Reselect：选择器优化

Reselect 是 Redux 官方推荐的选择器库，它的核心特性是**记忆化**（memoization），可以避免不必要的计算和重渲染。

#### 3.3.1 为什么需要 Reselect

```tsx
// 问题：不使用 Reselect
function TodoList({ todos, filter }) {
  // 每次组件渲染都会重新计算，即使 todos 没变
  const filteredTodos = todos.filter(todo => {
    if (filter === 'all') return true;
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
  });

  return (
    <ul>
      {filteredTodos.map(todo => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}

// 配合 useSelector
function ConnectedTodoList() {
  // ❌ 问题：每次 dispatch 都会重新执行这段逻辑
  const todos = useSelector(state => state.todos);
  const filter = useSelector(state => state.filter);

  return <TodoList todos={todos} filter={filter} />;
}
```

#### 3.3.2 Reselect 的记忆化

```tsx
import { createSelector } from 'reselect';

// 输入选择器：直接从 state 提取数据（不做计算）
const selectTodos = (state) => state.todos;
const selectFilter = (state) => state.filter;

// 创建记忆化选择器
const selectFilteredTodos = createSelector(
  [selectTodos, selectFilter],  // 输入选择器数组
  (todos, filter) => {          // 输出函数
    console.log('计算 filtered todos...'); // 调试用

    return todos.filter(todo => {
      if (filter === 'all') return true;
      if (filter === 'active') return !todo.completed;
      if (filter === 'completed') return todo.completed;
    });
  }
);

// 使用
function TodoList() {
  // ✅ 只有当 todos 或 filter 变化时，才会重新计算
  const filteredTodos = useSelector(selectFilteredTodos);

  return (
    <ul>
      {filteredTodos.map(todo => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}
```

#### 3.3.3 Reselect 的工作原理

Reselect 使用 JavaScript 的 Map 来缓存计算结果。当输入选择器返回的值与上次相同时，直接返回缓存的结果，不会执行输出函数。

```tsx
// Reselect 内部简化逻辑
function createSelector(inputSelectors, outputSelector) {
  // 缓存结构
  let lastInputs = null;
  let lastResult = null;

  return function selector(state) {
    const inputs = inputSelectors.map(fn => fn(state));

    // 检查输入是否变化
    if (lastInputs !== null && inputs.every((val, i) => val === lastInputs[i])) {
      return lastResult; // 返回缓存
    }

    // 计算新结果并缓存
    const newResult = outputSelector(...inputs);
    lastInputs = inputs;
    lastResult = newResult;

    return newResult;
  };
}
```

**重要特性：**

- **引用相等性检查**：默认使用 `===` 比较输入
- **引用稳定性**：确保返回的对象/数组引用稳定
- **组合性**：选择器可以组合成复杂的数据管道

#### 3.3.4 复杂选择器示例

```tsx
import { createSelector } from 'reselect';

// 基础选择器
const selectUser = (state) => state.user;
const selectPosts = (state) => state.posts;
const selectComments = (state) => state.comments;
const selectCurrentUserId = (state) => state.user.currentId;

// 记忆化选择器
const selectCurrentUser = createSelector(
  [selectUser, selectCurrentUserId],
  (user, currentId) => user.byId[currentId]
);

const selectUserPosts = createSelector(
  [selectPosts, selectCurrentUserId],
  (posts, userId) => posts.filter(post => post.authorId === userId)
);

const selectPostsWithComments = createSelector(
  [selectUserPosts, selectComments],
  (posts, comments) => {
    return posts.map(post => ({
      ...post,
      commentCount: comments.filter(c => c.postId === post.id).length,
    }));
  }
);

const selectSortedPosts = createSelector(
  [selectPostsWithComments],
  (posts) => [...posts].sort((a, b) => b.createdAt - a.createdAt)
);

// 最终选择器：获取前10篇
const selectRecentPosts = createSelector(
  [selectSortedPosts],
  (posts) => posts.slice(0, 10)
);
```

### 3.4 Redux Toolkit：现代化 Redux

Redux Toolkit（RTK）是 Redux 官方的工具集，它大幅简化了 Redux 的使用，同时保持了 Redux 的核心优势。

#### 3.4.1 Redux Toolkit 的核心理念

Redux Toolkit 的设计目标是：

1. **简化 Redux 应用开发** - 减少样板代码
2. **封装最佳实践** - 内置常见模式
3. **优化性能** - 自动处理选择器优化
4. **支持 TypeScript** - 完整的类型推导

#### 3.4.2 createSlice：简化 Reducer

```tsx
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

interface TodoState {
  items: Todo[];
  filter: 'all' | 'active' | 'completed';
  loading: boolean;
}

const initialState: TodoState = {
  items: [],
  filter: 'all',
  loading: false,
};

// createSlice 自动生成 action creators 和 action types
const todoSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    addTodo: (state, action: PayloadAction<string>) => {
      // Redux Toolkit 允许"可变"操作
      // 底层会自动转换为不可变操作
      state.items.push({
        id: crypto.randomUUID(),
        text: action.payload,
        completed: false,
      });
    },

    toggleTodo: (state, action: PayloadAction<string>) => {
      const todo = state.items.find(t => t.id === action.payload);
      if (todo) {
        todo.completed = !todo.completed;
      }
    },

    deleteTodo: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(t => t.id !== action.payload);
    },

    setFilter: (state, action: PayloadAction<TodoState['filter']>) => {
      state.filter = action.payload;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

// 自动生成的导出
export const { addTodo, toggleTodo, deleteTodo, setFilter, setLoading } =
  todoSlice.actions;

// Reducer 自动生成
export default todoSlice.reducer;
```

**关键优势：**

1. **自动生成 Action Types** - `${sliceName}/${actionName}`
2. **Immer.js 支持** - 可以使用"可变"语法编写不可变逻辑
3. **类型安全** - PayloadAction 提供类型检查

#### 3.4.3 createAsyncThunk：处理异步

```tsx
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  name: string;
  email: string;
}

// 异步 thunk
export const fetchUser = createAsyncThunk(
  'user/fetch',
  async (userId: string, { rejectWithValue }) => {
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

interface UserState {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  currentUser: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});
```

#### 3.4.4 configureStore：简化 Store 配置

```tsx
import { configureStore } from '@reduxjs/toolkit';
import todoReducer from './slices/todoSlice';
import userReducer from './slices/userSlice';
import { api } from './api';

// configureStore 自动：
// 1. 组合 reducers
// 2. 添加默认中间件
// 3. 设置 Redux DevTools
// 4. 添加类型检查

export const store = configureStore({
  reducer: {
    todos: todoReducer,
    user: userReducer,
    [api.reducerPath]: api.reducer, // RTK Query
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(api.middleware) // RTK Query
      .concat(logger),
});

// 类型导出
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### 3.5 实战：Redux 最佳实践

#### 3.5.1 状态结构设计

良好的状态结构是应用可维护性的关键：

```tsx
// ❌ 不推荐：嵌套过深
interface BadState {
  user: {
    profile: {
      personal: {
        name: string;
        age: number;
      };
    };
  };
}

// ✅ 推荐：扁平化/范式化
interface GoodState {
  user: {
    currentId: string | null;
    byId: Record<string, User>;
    loading: boolean;
    error: string | null;
  };
}
```

**范式化原则：**

1. **ID 引用** - 使用 ID 而不是嵌套对象
2. **实体表** - 相同类型的实体存储在对象中
3. **分离状态** - 将 UI 状态与数据状态分离

```tsx
interface NormalizedState {
  // 用户实体表
  users: {
    ids: string[];
    byId: Record<string, User>;
    currentUserId: string | null;
  };

  // 文章实体表
  posts: {
    ids: string[];
    byId: Record<string, Post>;
    allIds: string[]; // 用于排序
  };

  // 关系表
  userPosts: {
    // userId -> postIds
    byUser: Record<string, string[]>;
  };
}
```

#### 3.5.2 选择器模式

```tsx
// 在 slice 文件中定义选择器
export const selectTodos = (state: RootState) => state.todos.items;

export const selectFilter = (state: RootState) => state.todos.filter;

export const selectFilteredTodos = createSelector(
  [selectTodos, selectFilter],
  (todos, filter) => {
    switch (filter) {
      case 'all':
        return todos;
      case 'active':
        return todos.filter(t => !t.completed);
      case 'completed':
        return todos.filter(t => t.completed);
    }
  }
);

// 使用类型化的 hooks
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// 组件中使用
function TodoList() {
  const todos = useAppSelector(selectFilteredTodos);
  const loading = useAppSelector(state => state.todos.loading);

  // ...
}
```

---

## 四、Zustand 深度解析

### 4.1 极简 API 设计

Zustand 是一个极简的状态管理库，它的核心设计哲学是**"Hooks 优先"**和**"去中心化"**。

#### 4.1.1 Zustand vs Redux 对比

| 维度 | Redux | Zustand |
|------|-------|---------|
| 核心概念 | Store + Reducer + Action | Store + Actions |
| 样板代码 | 较多 | 极少 |
| 学习曲线 | 较陡 | 平缓 |
| TypeScript | 需要额外配置 | 自动推导 |
| 中间件 | 需要手动配置 | 极简 |
| DevTools | 需要额外安装 | 内置 |
| 包大小 | ~7KB | ~1.5KB |

#### 4.1.2 Zustand 基础用法

```tsx
import { create } from 'zustand';

// 简洁的 Store 定义
interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

const useCounterStore = create<CounterState>((set) => ({
  count: 0,

  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));

// 使用 - 可以在任何组件中使用
function Counter() {
  // 自动订阅，只在 count 变化时重渲染
  const { count, increment, decrement, reset } = useCounterStore();

  return (
    <div>
      <span>{count}</span>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
      <button onClick={reset}>重置</button>
    </div>
  );
}
```

#### 4.1.3 状态和动作的分离与合并

Zustand 允许你以多种方式组织状态和动作：

```tsx
// 方式一：状态和动作分离
const useStore = create<{
  count: number;
  increment: () => void;
}>((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
}));

// 方式二：使用箭头函数
const useStore2 = create((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
}));

// 方式三：合并到类型定义中
interface StoreState {
  count: number;
}

interface StoreActions {
  increment: () => void;
}

type Store = StoreState & StoreActions;

const useStore3 = create<Store>((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
}));
```

### 4.2 中间件机制

Zustand 的中间件机制比 Redux 更加简洁和函数式。

#### 4.2.1 内置中间件

```tsx
import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';

// devtools -  Redux DevTools 集成
const useDevtoolsStore = create(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }),
    { name: 'Counter Store' } // DevTools 中的名称
  )
);

// persist - 状态持久化
const usePersistedStore = create(
  persist(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }),
    {
      name: 'counter-storage', // localStorage key
      storage: {
        // 自定义存储引擎
        getItem: (name) => {
          const value = localStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
      // 部分持久化
      partialize: (state) => ({
        count: state.count,
        // 不持久化其他字段
      }),
    }
  )
);

// subscribeWithSelector - 选择器订阅
const useSelectorStore = create(
  subscribeWithSelector(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }),
  )
);

// 订阅特定状态变化
useSelectorStore.subscribe(
  (state) => state.count,
  (count, prevCount) => {
    console.log(`count 变化: ${prevCount} -> ${count}`);

    if (count > 10) {
      alert('计数超过 10！');
    }
  }
);
```

#### 4.2.2 自定义中间件

```tsx
import { create, StateCreator } from 'zustand';

// 日志中间件
const loggerMiddleware = (
  config: StateCreator<CounterState>
): StateCreator<CounterState> => {
  return (set, get, api) => {
    console.log('Store 初始化');

    return config(
      (args) => {
        console.log('状态更新前:', get());
        console.log('状态更新:', args);
        set(args);
        console.log('状态更新后:', get());
      },
      get,
      api
    );
  };
};

// 使用自定义中间件
const useLoggedStore = create(loggerMiddleware((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
})));

// 异步中间件
const asyncMiddleware = (
  config: StateCreator<StoreState>
): StateCreator<StoreState & StoreActions> => {
  return (set, get, api) => {
    const actions = config(
      (args) => set(args),
      get,
      api
    );

    return {
      ...actions,
      // 为每个异步函数添加 loading 状态
      fetchUser: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const user = await fetch(`/api/users/${id}`).then(r => r.json());
          set({ currentUser: user, loading: false });
        } catch (error) {
          set({ error: error.message, loading: false });
        }
      },
    };
  };
};
```

#### 4.2.3 第三方中间件生态

```tsx
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { temporal } from 'zustand-temporal';

// Immer 中间件 - 支持"可变"语法
const useImmerStore = create<CounterState>()(
  immer((set) => ({
    count: 0,
    increment: () =>
      set((state) => {
        state.count += 1;
      }),
  }))
);

// Temporal 中间件 - undo/redo
const useTemporalStore = create<CounterState>()(
  temporal(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }),
    {
      limit: 50, // 最多保存50个历史状态
    }
  )
);

// 使用 undo/redo
function UndoCounter() {
  const { count, increment, undo, redo, canUndo, canRedo } =
    useTemporalStore();

  return (
    <div>
      <span>{count}</span>
      <button onClick={increment}>+</button>
      <button onClick={undo} disabled={!canUndo}>
        撤销
      </button>
      <button onClick={redo} disabled={!canRedo}>
        重做
      </button>
    </div>
  );
}
```

### 4.3 persist 持久化详解

persist 中间件是 Zustand 最受欢迎的功能之一，它可以将状态持久化到各种存储引擎。

#### 4.3.1 基本用法

```tsx
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'user-storage', // localStorage key
    }
  )
);
```

#### 4.3.2 高级配置

```tsx
const useAdvancedStore = create<AdvancedState>()(
  persist(
    (set) => ({
      // 状态定义
      count: 0,
      user: null,
      preferences: {
        theme: 'light',
        language: 'zh-CN',
      },

      increment: () => set((state) => ({ count: state.count + 1 })),
      setUser: (user) => set({ user }),
      updatePreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),
    }),
    {
      // 存储名称
      name: 'advanced-storage',

      // 存储引擎（默认是 localStorage）
      storage: createJSONStorage(() => sessionStorage), // 可切换到 sessionStorage

      // 部分持久化
      partialize: (state) => ({
        count: state.count,
        preferences: state.preferences,
        // 不持久化 user（敏感信息）
      }),

      // 自定义合并策略
      merge: (persisted, current) => {
        // 自定义合并逻辑
        return {
          ...current,
          ...persisted,
          // 确保敏感字段不被覆盖
        };
      },

      // 版本控制，用于数据迁移
      version: 1,

      // 迁移函数
      migrate: (persistedState, version) => {
        if (version === 0) {
          // 从 v0 迁移到 v1
          const state = persistedState as PersistedStateV0;
          return {
            ...state,
            preferences: {
              ...state.preferences,
              // 新增字段
              newField: 'default',
            },
          };
        }
        return persistedState;
      },
    }
  )
);
```

#### 4.3.3 存储引擎适配

```tsx
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// IndexedDB 存储引擎
const indexedDBStorage = {
  getItem: async (name: string) => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('zustand', 1);

      request.onerror = () => reject(request.error);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('store')) {
          db.createObjectStore('store');
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction('store', 'readonly');
        const store = transaction.objectStore('store');
        const result = store.get(name);

        result.onsuccess = () => resolve(result.result);
        result.onerror = () => reject(result.error);
      };
    });
  },

  setItem: async (name: string, value: any) => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('zustand', 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction('store', 'readwrite');
        const store = transaction.objectStore('store');
        store.put(value, name);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
    });
  },

  removeItem: async (name: string) => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('zustand', 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction('store', 'readwrite');
        const store = transaction.objectStore('store');
        store.delete(name);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
    });
  },
};

// 使用自定义存储引擎
const useDBStore = create<DBState>()(
  persist(
    (set) => ({
      data: null,
      setData: (data) => set({ data }),
    }),
    {
      name: 'db-storage',
      storage: createJSONStorage(() => indexedDBStorage),
    }
  )
);
```

### 4.4 Zustand vs Redux 深度对比

#### 4.4.1 核心概念对比

| 概念 | Redux | Zustand |
|------|-------|---------|
| 数据源 | 单一 Store | 多个独立 Store |
| 状态更新 | Reducer 函数 | 直接 set |
| Action | 必须使用 Action 对象 | 函数直接调用 |
| 中间件 | applyMiddleware | 函数式组合 |
| 类型推导 | 手动配置 | 自动推导 |
| DevTools | 插件 | 内置 |

#### 4.4.2 代码量对比

```tsx
// Redux 实现计数器（完整代码）
// actions.ts
const INCREMENT = 'counter/increment';
const increment = () => ({ type: INCREMENT });

// reducer.ts
const initialState = { count: 0 };
function counterReducer(state = initialState, action) {
  switch (action.type) {
    case INCREMENT:
      return { count: state.count + 1 };
    default:
      return state;
  }
}

// store.ts
const store = createStore(counterReducer);

// Component.tsx
function Counter() {
  const count = useSelector(state => state.count);
  const dispatch = useDispatch();

  return (
    <button onClick={() => dispatch(increment())}>
      {count}
    </button>
  );
}

// ---- vs ----

// Zustand 实现计数器（完整代码）
const useCounterStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

function Counter() {
  const { count, increment } = useCounterStore();
  return <button onClick={increment}>{count}</button>;
}
```

#### 4.4.3 适用场景对比

| 场景 | 推荐方案 | 原因 |
|------|----------|------|
| 小型项目/原型 | Zustand | 快速上手，代码量少 |
| 中型项目 | Zustand / Redux | 取决于团队偏好 |
| 大型项目 | Redux Toolkit | 成熟的生态和调试工具 |
| 复杂异步逻辑 | Redux Toolkit | thunk/saga 支持完善 |
| 简单状态共享 | Context + Zustand | 去中心化，灵活 |
| undo/redo 需求 | Zustand + temporal | 集成简单 |
| 状态持久化 | Zustand + persist | 配置简单 |

### 4.5 实战：Zustand 实战技巧

#### 4.5.1 切片模式 (Slice Pattern)

```tsx
import { create } from 'zustand';

// 定义每个切片
interface CounterSlice {
  count: number;
  increment: () => void;
  decrement: () => void;
}

interface UserSlice {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

interface UISlice {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

// 创建各个切片
const createCounterSlice = (set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
});

const createUserSlice = (set) => ({
  user: null,
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
});

const createUISlice = (set) => ({
  theme: 'light',
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'light' ? 'dark' : 'light',
    })),
});

// 组合切片
type StoreState = CounterSlice & UserSlice & UISlice;

const useStore = create<StoreState>((set) => ({
  ...createCounterSlice(set),
  ...createUserSlice(set),
  ...createUISlice(set),
}));

// 使用
function App() {
  const { count, increment, user, login, theme, toggleTheme } = useStore();

  return (
    <div className={theme}>
      <span>{count}</span>
      <button onClick={increment}>+</button>
      {user ? <span>{user.name}</span> : <span>未登录</span>}
      <button onClick={toggleTheme}>切换主题</button>
    </div>
  );
}
```

#### 4.5.2 订阅模式的精细化

```tsx
const useStore = create((set) => ({
  count: 0,
  user: null,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// 只订阅 count 变化
function CounterDisplay() {
  const count = useStore((state) => state.count);
  return <div>计数：{count}</div>;
}

// 只订阅 user 变化
function UserDisplay() {
  const user = useStore((state) => state.user);
  return user ? <div>{user.name}</div> : <div>未登录</div>;
}

// 订阅多个相关状态
function Dashboard() {
  const { count, user } = useStore((state) => ({
    count: state.count,
    user: state.user,
  }));

  // 这种写法会导致任何状态变化都重渲染
  // 建议使用 shallow 比较
  return <div>{/* ... */}</div>;
}

// 使用 shallow 比较
import { useShallow } from 'zustand/shallow';

function DashboardBetter() {
  const { count, user } = useStore(
    useShallow((state) => ({
      count: state.count,
      user: state.user,
    }))
  );

  return <div>{/* ... */}</div>;
}
```

---

## 五、Jotai 深度解析

### 5.1 原子化状态设计

Jotai 的核心概念是**原子**（Atom）。原子是最小的状态单元，组件可以直接订阅原子，而不需要通过 props 传递。

#### 5.1.1 原子基础

```tsx
import { atom } from 'jotai';

// 基本原子
const countAtom = atom(0);

// 派生原子（读取其他原子）
const doubledCountAtom = atom((get) => get(countAtom) * 2);

// 写入原子
const incrementAtom = atom(
  (get) => get(countAtom),
  (set, newValue) => {
    set(countAtom, newValue);
  }
);

// 使用
function Counter() {
  // 读取 countAtom
  const count = useAtomValue(countAtom);

  // 读取和写入
  const [count, setCount] = useAtom(countAtom);

  return (
    <div>
      <span>{count}</span>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  );
}
```

#### 5.1.2 原子的类型系统

```tsx
import { atom } from 'jotai';

// 基础类型
const nameAtom = atom<string>('张三');
const ageAtom = atom<number>(25);
const isLoadingAtom = atom<boolean>(false);

// 对象类型
interface User {
  id: string;
  name: string;
  email: string;
}

const userAtom = atom<User>({
  id: '1',
  name: '张三',
  email: 'zhangsan@example.com',
});

// 数组类型
const tagsAtom = atom<string[]>(['react', 'typescript']);

// 只读原子（通过派生计算）
const upperNameAtom = atom((get) => {
  const name = get(nameAtom);
  return name.toUpperCase();
});

// 只写原子（用于副作用）
const fetchUserAtom = atom(
  null, // 只写，不需要读取值
  async (get, set, userId: string) => {
    const response = await fetch(`/api/users/${userId}`);
    const user = await response.json();
    set(userAtom, user);
  }
);
```

### 5.2 Derived Atoms：派生状态

派生状态是 Jotai 最强大的特性之一。通过派生，组件可以自动订阅依赖的状态，而不需要手动处理订阅和取消订阅。

#### 5.2.1 简单派生

```tsx
const priceAtom = atom(100);
const quantityAtom = atom(2);

// 计算总价
const totalAtom = atom((get) => {
  const price = get(priceAtom);
  const quantity = get(quantityAtom);
  return price * quantity;
});

// 计算折扣价（9折）
const discountedAtom = atom((get) => {
  const total = get(totalAtom);
  return total * 0.9;
});

function OrderSummary() {
  const total = useAtomValue(totalAtom);
  const discounted = useAtomValue(discountedAtom);

  return (
    <div>
      <div>总价：{total}</div>
      <div>折后价：{discounted}</div>
    </div>
  );
}
```

#### 5.2.2 条件派生

```tsx
const userAtom = atom<User | null>(null);
const isLoggedInAtom = atom((get) => get(userAtom) !== null);
const userNameAtom = atom((get) => get(userAtom)?.name ?? 'Guest');

// 根据条件返回不同原子
const statusMessageAtom = atom((get) => {
  const user = get(userAtom);
  const total = get(totalAtom);

  if (!user) return '请登录';
  if (total > 1000) return `${user.name}，您是VIP客户`;
  return `${user.name}，消费满1000升级为VIP`;
});
```

#### 5.2.3 异步派生

```tsx
const userIdAtom = atom('1');

const userDataAtom = atom(async (get) => {
  const userId = get(userIdAtom);
  const response = await fetch(`/api/users/${userId}`);
  return response.json();
});

// 消费异步原子
function UserProfile() {
  const [user, { isLoading, error }] = useAtom(userDataAtom);

  if (isLoading) return <div>加载中...</div>;
  if (error) return <div>错误：{error.message}</div>;

  return <div>{user.name}</div>;
}
```

### 5.3 Jotai vs Zustand 对比

#### 5.3.1 核心差异

| 维度 | Jotai | Zustand |
|------|-------|---------|
| 状态模型 | 原子化 | 单一 Store |
| 派生方式 | Atoms + Selectors | 内置 Selector |
| 重渲染控制 | 自动追踪依赖 | 手动选择 |
| 学习曲线 | 中等 | 平缓 |
| 组合性 | 原子可组合 | Store 合并 |
| TypeScript | 原生支持 | 原生支持 |
| 包大小 | ~3KB | ~1.5KB |

#### 5.3.2 代码风格对比

```tsx
// Jotai 方式 - 原子化
const priceAtom = atom(100);
const quantityAtom = atom(2);
const totalAtom = atom((get) => get(priceAtom) * get(quantityAtom));

function Total() {
  // 自动订阅 priceAtom 和 quantityAtom
  const total = useAtomValue(totalAtom);
  return <div>总价：{total}</div>;
}

// Zustand 方式 - Store 集中
const useStore = create((set) => ({
  price: 100,
  quantity: 2,
  setPrice: (price) => set({ price }),
  setQuantity: (quantity) => set({ quantity }),
}));

function Total() {
  const { price, quantity } = useStore();
  const total = price * quantity;
  return <div>总价：{total}</div>;
}
```

#### 5.3.3 依赖追踪对比

```tsx
// Jotai - 自动依赖追踪
const aAtom = atom(1);
const bAtom = atom(2);
const conditionalAtom = atom((get) => {
  // Jotai 自动追踪依赖
  if (get(aAtom) > 0) {
    return get(aAtom) + get(bAtom);
  }
  return 0;
});

// Zustand - 手动选择
const useStore = create((set, get) => ({
  a: 1,
  b: 2,
}));

// 组件中
function Component() {
  // 每次 a 或 b 变化都会触发重渲染
  const { a, b } = useStore();

  // 或者精确订阅
  const a = useStore((s) => s.a);
}
```

### 5.4 Jotai 适用场景分析

#### 5.4.1 最佳场景

1. **复杂表单**
   - 每个字段独立原子
   - 自动计算表单状态
   - 字段间条件逻辑

```tsx
const formAtom = atom({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
});

const isValidAtom = atom((get) => {
  const form = get(formAtom);
  return (
    form.firstName.length > 0 &&
    form.email.includes('@') &&
    form.password.length >= 8
  );
});

const fullNameAtom = atom((get) => {
  const form = get(formAtom);
  return `${form.firstName} ${form.lastName}`;
});
```

2. **树状/列表数据**
   - 每个节点独立原子
   - 父节点自动汇总子节点

```tsx
const nodesAtom = atom<Node[]>([]);

const nodeByIdAtom = atom((get) => {
  const nodes = get(nodesAtom);
  return (id: string) => nodes.find((n) => n.id === id);
});

const rootNodesAtom = atom((get) => {
  const nodes = get(nodesAtom);
  return nodes.filter((n) => n.parentId === null);
});

const childrenCountAtom = atom((get) => {
  const nodes = get(nodesAtom);
  return (parentId: string) =>
    nodes.filter((n) => n.parentId === parentId).length;
});
```

3. **计算密集型 UI**
   - 派生值缓存
   - 按需计算

#### 5.4.2 不适合场景

1. **简单计数器/开关**
   - 过度设计
   - Zustand 更加简洁

2. **全局单一状态**
   - Redux 更成熟
   - 调试工具更完善

---

## 六、React Query vs SWR

### 6.1 缓存策略对比

React Query 和 SWR 都采用 **stale-while-revalidate** 策略，这是它们性能优异的关键。

#### 6.1.1 stale-while-revalidate 原理

```
时间轴 ──────────────────────────────────────────────────────────────→

     │                    │                              │
     ↓                    ↓                              ↓
  首次请求            后台重新验证                      返回新数据

     │                    │                              │
     ├────────────────────┤                              │
     │                    │                              │
  返回缓存          立即返回旧数据                   用新数据更新缓存
  (可能过期)        (用户体验好)                      (下次使用生效)
```

**核心思想：**

1. **立即返回**：先返回缓存数据（即使可能过期），让用户快速看到内容
2. **后台验证**：在后台发送请求验证数据是否新鲜
3. **按需更新**：如果数据确实过期了，再用新数据更新缓存

#### 6.1.2 React Query 缓存配置

```tsx
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 全局默认配置
      staleTime: 5 * 60 * 1000, // 5分钟内不重新获取
      gcTime: 10 * 60 * 1000,  // 10分钟内没有使用则垃圾回收
      refetchOnWindowFocus: true, // 窗口聚焦时重新获取
      retry: 3, // 失败重试次数
    },
  },
});

function UserProfile({ userId }) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetch(`/api/users/${userId}`).then(r => r.json()),
    staleTime: 60 * 1000, // 单独配置：1分钟
    enabled: !!userId, // 条件执行
  });

  if (isLoading) return <div>加载中...</div>;
  if (isError) return <div>错误：{error.message}</div>;

  return (
    <div>
      <h1>{data.name}</h1>
      <button onClick={() => refetch()}>刷新</button>
    </div>
  );
}
```

#### 6.1.3 SWR 缓存配置

```tsx
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then(r => r.json());

function UserProfile({ userId }) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/users/${userId}`,
    fetcher,
    {
      refreshInterval: 0,           // 关闭轮询
      revalidateOnFocus: true,       // 窗口聚焦时重新验证
      revalidateOnReconnect: true,   // 网络重连时重新验证
      dedupingInterval: 2000,        // 2秒内重复请求去重
      keepPreviousData: true,        // 保留之前的数据
    }
  );

  if (isLoading) return <div>加载中...</div>;
  if (error) return <div>加载失败</div>;

  return (
    <div>
      <h1>{data.name}</h1>
      <button onClick={() => mutate()}>刷新</button>
    </div>
  );
}
```

### 6.2 详细功能对比

| 功能 | React Query | SWR |
|------|-------------|-----|
| 缓存策略 | stale-while-revalidate | stale-while-revalidate |
| 内存管理 | 自动 GC | 自动 GC |
| 乐观更新 | 支持 | 支持 |
| 窗口聚焦重新获取 | 支持 | 支持 |
| 轮询/实时 | 支持 | 需额外配置 |
| 分页/无限滚动 | 专用 hooks | keepPreviousData |
| SSR 支持 | hydration | getStaticProps |
| DevTools | 官方提供 | 社区提供 |
| 缓存更新 | invalidateQueries | mutate |
| 类型推导 | 优秀 | 良好 |

### 6.3 乐观更新实战

乐观更新是用户体验优化的重要手段。它允许 UI 在请求完成前就显示变化，让应用感觉更快。

#### 6.3.1 React Query 乐观更新

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

function UpdateUsername() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newName) =>
      fetch('/api/user', {
        method: 'PATCH',
        body: JSON.stringify({ name: newName }),
      }).then(r => r.json()),

    // 乐观更新前的处理
    onMutate: async (newName) => {
      // 取消所有正在进行的请求，防止与乐观更新冲突
      await queryClient.cancelQueries({ queryKey: ['user'] });

      // 保存之前的数据，用于回滚
      const previousUser = queryClient.getQueryData(['user']);

      // 立即更新缓存
      queryClient.setQueryData(['user'], (old) => ({
        ...old,
        name: newName,
      }));

      // 返回之前的数据，用于 onError 回滚
      return { previousUser };
    },

    // 失败时的回滚
    onError: (err, newName, context) => {
      // 回滚到之前的数据
      queryClient.setQueryData(['user'], context.previousUser);
      alert('更新失败');
    },

    // 无论成功失败都执行
    onSettled: () => {
      // 使缓存失效，触发重新获取，确保数据一致
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  return (
    <input
      value={mutation.variables}
      onChange={(e) => mutation.mutate(e.target.value)}
      disabled={mutation.isPending}
    />
  );
}
```

#### 6.3.2 SWR 乐观更新

```tsx
import useSWR, { mutate } from 'swr';

function UpdateUsername() {
  const { data } = useSWR('/api/user', fetcher);

  const handleUpdate = async (newName) => {
    // 保存当前数据
    const previousData = data;

    // 立即更新 UI
    mutate(
      '/api/user',
      { ...data, name: newName },
      false // 不立即重新验证
    );

    try {
      // 发送请求
      await fetch('/api/user', {
        method: 'PATCH',
        body: JSON.stringify({ name: newName }),
      });

      // 重新验证
      mutate('/api/user');
    } catch {
      // 失败，回滚
      mutate('/api/user', previousData, false);
      alert('更新失败');
    }
  };

  return (
    <input
      value={data?.name}
      onChange={(e) => handleUpdate(e.target.value)}
    />
  );
}
```

### 6.4 数据获取方案选型

#### 6.4.1 什么时候选择 React Query

1. **复杂的数据依赖关系**
   - 多个查询之间的依赖
   - 嵌套的数据获取

2. **大量 CRUD 操作**
   - 完善的缓存失效策略
   - 自动后台刷新

3. **需要完整的类型安全**
   - 优秀的 TypeScript 支持
   - 类型推导

4. **服务端渲染 (SSR)**
   - 更好的 hydration 支持
   - Prefetch 机制

```tsx
// React Query 的优势：依赖查询
function PostList() {
  // 获取所有帖子
  const { data: posts } = useQuery({
    queryKey: ['posts'],
    queryFn: () => fetch('/api/posts').then(r => r.json()),
  });

  // 获取当前用户
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => fetch('/api/user').then(r => r.json()),
  });

  // 获取未读消息数（依赖用户）
  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => fetch('/api/notifications/unread').then(r => r.json()),
    enabled: !!user, // 只有 user 加载完成后才执行
  });

  return (
    <div>
      <span>未读消息：{unreadCount}</span>
      {posts?.map(post => (
        <PostItem key={post.id} post={post} />
      ))}
    </div>
  );
}
```

#### 6.4.2 什么时候选择 SWR

1. **简单场景**
   - 数据获取简单
   - 需要快速上手

2. **注重轻量**
   - 包大小敏感
   - 不想引入重型库

3. **实时性要求高**
   - 需要数据变化通知
   - 轮询场景

```tsx
// SWR 的优势：实时数据
function StockPrice({ symbol }) {
  const { data } = useSWR(
    `/api/stock/${symbol}`,
    fetcher,
    {
      refreshInterval: 1000, // 每秒轮询
      keepPreviousData: true,
    }
  );

  return (
    <div>
      <span>{symbol}</span>
      <span style={{ color: data?.change > 0 ? 'green' : 'red' }}>
        {data?.price}
      </span>
    </div>
  );
}
```

---

## 七、Valtio vs Recoil

### 7.1 代理状态模式

Valtio 和 Recoil 都采用了不同于 Redux 的状态管理理念，它们更接近响应式编程。

#### 7.1.1 Valtio 代理机制

Valtio 使用 JavaScript 的 Proxy 来实现响应式状态。当状态变化时，Proxy 自动追踪访问路径，只更新使用到变化数据的组件。

```tsx
import { proxy, useSnapshot } from 'valtio';

// 创建响应式代理
const state = proxy({
  count: 0,
  user: {
    name: '张三',
    age: 25,
  },
  tags: ['react', 'typescript'],
});

// 读取状态（在组件外）
console.log(state.count);

// 更新状态
state.count += 1;
state.user.name = '李四';

// 组件中使用
function Counter() {
  // useSnapshot 创建局部快照，只订阅使用的属性
  const snapshot = useSnapshot(state);

  return (
    <div>
      {/* 只有 count 变化时重新渲染 */}
      <span>{snapshot.count}</span>
      {/* 只有 user.name 变化时重新渲染 */}
      <span>{snapshot.user.name}</span>
    </div>
  );
}
```

#### 7.1.2 Valtio 原理简化实现

```tsx
// 简化版的响应式实现
function createReactiveProxy<T extends object>(target: T): T {
  return new Proxy(target, {
    get(obj, key) {
      // 追踪当前访问的路径
      track(window.activeEffect, key as string);
      return Reflect.get(obj, key);
    },

    set(obj, key, value) {
      const oldValue = obj[key as keyof T];
      const result = Reflect.set(obj, key, value);

      // 值确实变化了，触发更新
      if (oldValue !== value) {
        // 通知所有依赖该路径的 effect
        trigger(key as string);
      }

      return result;
    },
  });
}
```

### 7.2 Recoil Atom 模型

Recoil 是 Facebook（Meta）开发的实验性状态管理库，它引入了 Atom 的概念来管理状态。

#### 7.2.1 Recoil 核心概念

```tsx
import { atom, selector, useRecoilState, useRecoilValue } from 'recoil';

// 定义 Atom（状态单元）
const countAtom = atom({
  key: 'countAtom',
  default: 0,
});

const userAtom = atom({
  key: 'userAtom',
  default: {
    name: '',
    email: '',
  },
});

// 定义 Selector（派生状态）
const doubledCountSelector = selector({
  key: 'doubledCountSelector',
  get: ({ get }) => {
    const count = get(countAtom);
    return count * 2;
  },
});

const filteredUserSelector = selector({
  key: 'filteredUserSelector',
  get: ({ get }) => {
    const user = get(userAtom);
    return {
      name: user.name.toUpperCase(),
      email: user.email.toLowerCase(),
    };
  },
});

// 组件中使用
function Counter() {
  const [count, setCount] = useRecoilState(countAtom);
  const doubled = useRecoilValue(doubledCountSelector);

  return (
    <div>
      <span>{count}</span>
      <span>双倍：{doubled}</span>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  );
}
```

#### 7.2.2 Recoil vs 其他方案

| 特性 | Recoil | Zustand | Jotai |
|------|--------|---------|-------|
| 状态模型 | Atom + Selector | 单一 Store | Atom |
| React 集成 | 原生 | Hooks | Hooks |
| 并发模式 | 支持 | 部分支持 | 支持 |
| 调试工具 | 官方 DevTools | 社区 | 社区 |
| 稳定性 | 实验性 | 稳定 | 稳定 |
| 活跃度 | 较低 | 高 | 高 |

### 7.3 性能对比

#### 7.3.1 重渲染优化对比

```tsx
// Valtio - 代理追踪
const state = proxy({
  a: { b: { c: 1 } },
  x: { y: { z: 2 } },
});

function ComponentA() {
  // 只订阅 a.b.c 路径
  const snap = useSnapshot(state, { sync: true });

  return <div>{snap.a.b.c}</div>;
}

function ComponentX() {
  // 只订阅 x.y.z 路径
  const snap = useSnapshot(state, { sync: true });

  return <div>{snap.x.y.z}</div>;
}

// state.x.y.z = 3 只会导致 ComponentX 重渲染
// ComponentA 不会重渲染
```

```tsx
// Recoil - Atom 隔离
const aAtom = atom({ key: 'a', default: { b: { c: 1 } } });
const xAtom = atom({ key: 'x', default: { y: { z: 2 } } });

function ComponentA() {
  const a = useRecoilValue(aAtom);
  return <div>{a.b.c}</div>; // 只订阅 aAtom
}

function ComponentX() {
  const x = useRecoilValue(xAtom);
  return <div>{x.y.z}</div>; // 只订阅 xAtom
}
```

### 7.4 我的思考：状态管理百家争鸣

#### 7.4.1 为什么需要这么多方案？

状态管理是 React 生态中最活跃的领域之一，这反映了前端应用日益复杂的趋势。每种方案都有其设计哲学和适用场景：

- **Redux** 适合需要严格架构的大型团队项目
- **Zustand** 适合追求简洁和性能的中型项目
- **Jotai** 适合需要灵活派生状态的项目
- **Valtio** 适合喜欢响应式编程的开发者
- **Recoil** 适合需要与 React 深度集成的场景

#### 7.4.2 选型建议

```
项目规模
    │
    │     ┌─────────────────┐
    │     │  小型项目/原型   │
    │     │  Context + 本地 │
    │     └────────┬────────┘
    │              │
    │     ┌────────┴────────┐
    │     │   中型项目      │
    │     │   Zustand       │
    │     └────────┬────────┘
    │              │
    │     ┌────────┴────────┐
    │     │   大型项目       │
    │     │   Redux Toolkit │
    │     └─────────────────┘
    │
    └────────────────────────────→ 团队经验
```

---

## 八、状态管理选型指南

### 8.1 项目规模与方案匹配

#### 8.1.1 小型项目 (组件 < 20)

**推荐方案：本地状态 + Context**

```tsx
// 小型项目典型结构
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Home />
          <About />
          <Contact />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

// 本地状态管理表单
function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // 处理提交
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={e => setName(e.target.value)} />
      <input value={email} onChange={e => setEmail(e.target.value)} />
      <button type="submit">提交</button>
    </form>
  );
}
```

#### 8.1.2 中型项目 (20 < 组件 < 100)

**推荐方案：Zustand + React Query**

```tsx
// 中型项目典型结构
const useStore = create((set) => ({
  // UI 状态
  theme: 'light',
  sidebarOpen: false,

  // 用户状态
  user: null,
  setUser: (user) => set({ user }),

  // 业务状态
  cart: [],
  addToCart: (item) => set((s) => ({ cart: [...s.cart, item] })),
}));

// API 状态交给 React Query
function ProductList() {
  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => fetch('/api/products').then(r => r.json()),
  });

  return <div>{/* 渲染产品列表 */}</div>;
}
```

#### 8.1.3 大型项目 (组件 > 100)

**推荐方案：Redux Toolkit + React Query**

```tsx
// 大型项目典型结构
// store/index.ts
export const store = configureStore({
  reducer: {
    // 命名空间隔离
    user: userSlice.reducer,
    products: productsSlice.reducer,
    orders: ordersSlice.reducer,
    ui: uiSlice.reducer,
    // RTK Query
    [api.reducerPath]: api.reducer,
  },
  middleware: (get) =>
    get().concat(api.middleware).concat(logger),
});

// 组件中使用
function UserProfile() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);

  // 使用 RTK Query 获取数据
  const { data: orders } = useGetUserOrdersQuery(user.id);

  return <div>{/* 渲染 */}</div>;
}
```

### 8.2 团队因素考量

| 因素 | 建议方案 | 原因 |
|------|----------|------|
| Redux 经验 | Redux Toolkit | 降低学习成本 |
| 新团队 | Zustand | 快速上手 |
| 严格流程 | Redux | 架构约束强 |
| 快速迭代 | Zustand/Jotai | 灵活多变 |
| 调试要求高 | Redux + DevTools | 完善的日志和回放 |

### 8.3 我的思考：选型要务实

**避免过度工程化**

很多项目失败不是因为技术选型错误，而是因为过度工程化。一个简单的 todo list 不需要 Redux，一个原型不需要 React Query。

**渐进式演进**

从小处着手，当确实遇到问题时再考虑升级：

1. 先用 Context 解决问题
2. 发现性能问题，引入 Zustand
3. 数据获取复杂，引入 React Query
4. 架构需要约束，迁移到 Redux Toolkit

**团队是最重要的因素**

无论多么"先进"的技术，如果团队无法掌握，就不要采用。技术选型的目的是解决问题，而不是展示技术储备。

---

## 九、状态规范化设计

### 9.1 状态设计原则

#### 9.1.1 单一数据源原则

```tsx
// ❌ 分散的状态
function BadExample() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  // 状态分散，难以追踪
}

// ✅ 单一数据源
const store = create((set) => ({
  user: null,
  products: [],
  orders: [],
}));

function GoodExample() {
  const { user, products, orders } = useStore();
  // 状态集中，易于管理
}
```

#### 9.1.2 状态分离原则

将不同类型的状态分离：

1. **UI 状态** - 模态框、展开/折叠、加载状态
2. **业务数据** - 用户信息、订单、产品
3. **服务端缓存** - API 响应数据

```tsx
// 分离设计
interface StoreState {
  // UI 状态
  ui: {
    isModalOpen: boolean;
    selectedId: string | null;
    loading: boolean;
  };

  // 业务数据
  data: {
    user: User | null;
    products: Product[];
    orders: Order[];
  };
}
```

### 9.2 不可变性原则

#### 9.2.1 为什么需要不可变性

不可变性是响应式编程的基础。状态管理器需要能够追踪"变化"，而这只有在状态是不可变的情况下才能实现。

```tsx
// ❌ 可变更新 - 违反不可变性
function addTodo(todos, newTodo) {
  todos.push(newTodo); // 直接修改原数组
  return todos;
}

// ✅ 不可变更新 - 返回新数组
function addTodo(todos, newTodo) {
  return [...todos, newTodo]; // 创建新数组
}
```

#### 9.2.2 不可变操作工具

```tsx
// Immer - 用可变语法写不可变逻辑
import { produce } from 'immer';

const initialState = {
  user: {
    name: '张三',
    address: {
      city: '北京',
      street: '朝阳区'
    }
  }
};

// 使用 Immer
const newState = produce(initialState, draft => {
  draft.user.name = '李四';
  draft.user.address.city = '上海';
});

// Immer 会自动处理不可变性
// draft 是代理对象，实际上会产生新的不可变对象
```

### 9.3 范式化 vs 反范式化

#### 9.3.1 范式化存储

```tsx
// 范式化：将实体拆分，用 ID 引用
interface NormalizedState {
  users: {
    byId: Record<string, User>;
    allIds: string[];
  };

  posts: {
    byId: Record<string, Post>;
    allIds: string[];
    byAuthor: Record<string, string[]>; // authorId -> postIds
  };
}

// 优点：
// - 避免数据冗余
// - 更新简单（只需更新一处）
// - 查询灵活

// 缺点：
// - 需要维护 ID 引用关系
// - 获取完整数据需要组合
```

#### 9.3.2 反范式化存储

```tsx
// 反范式化：将相关数据嵌入
interface DenormalizedState {
  posts: {
    byId: Record<string, Post & { author: User }>;
  };
}

// 优点：
// - 获取数据简单
// - 渲染快

// 缺点：
// - 数据冗余
// - 更新复杂（需要更新多处）
```

#### 9.3.3 实践建议

对于大多数应用，推荐**半范式化**设计：

```tsx
// 推荐：适度范式化
interface StoreState {
  // 实体表 - 范式化
  entities: {
    users: Record<string, User>;
    posts: Record<string, Post>;
  };

  // UI 状态 - 反范式化，方便渲染
  ui: {
    currentUserId: string | null;
    currentPostId: string | null;
    feed: string[]; // 当前 feed 的 postIds 列表
  };
}

// 获取数据时组合
function getCurrentUser(state: StoreState) {
  const { currentUserId } = state.ui;
  return currentUserId ? state.entities.users[currentUserId] : null;
}
```

### 9.4 实战：状态架构设计

#### 9.4.1 完整示例：电商应用状态设计

```tsx
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 实体类型
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
}

interface CartItem {
  productId: string;
  quantity: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  addresses: Address[];
}

// Store 状态类型
interface StoreState {
  // 实体数据
  entities: {
    products: Record<string, Product>;
    users: Record<string, User>;
  };

  // UI 状态
  ui: {
    selectedCategory: string | null;
    searchQuery: string;
    cartOpen: boolean;
    loading: Record<string, boolean>;
  };

  // 业务数据
  cart: CartItem[];
  currentUserId: string | null;
}

// Actions 类型
interface StoreActions {
  // 实体操作
  setProducts: (products: Product[]) => void;
  setUsers: (users: User[]) => void;

  // 购物车操作
  addToCart: (productId: string, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  // UI 操作
  setSelectedCategory: (category: string | null) => void;
  setSearchQuery: (query: string) => void;
  toggleCart: () => void;
  setLoading: (key: string, loading: boolean) => void;

  // 用户操作
  setCurrentUser: (userId: string | null) => void;
}

type Store = StoreState & StoreActions;

// 创建 Store
export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      // 初始状态
      entities: {
        products: {},
        users: {},
      },

      ui: {
        selectedCategory: null,
        searchQuery: '',
        cartOpen: false,
        loading: {},
      },

      cart: [],
      currentUserId: null,

      // 实体操作
      setProducts: (products) =>
        set((state) => ({
          entities: {
            ...state.entities,
            products: Object.fromEntries(products.map((p) => [p.id, p])),
          },
        })),

      setUsers: (users) =>
        set((state) => ({
          entities: {
            ...state.entities,
            users: Object.fromEntries(users.map((u) => [u.id, u])),
          },
        })),

      // 购物车操作
      addToCart: (productId, quantity = 1) =>
        set((state) => {
          const existing = state.cart.find((item) => item.productId === productId);

          if (existing) {
            return {
              cart: state.cart.map((item) =>
                item.productId === productId
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }

          return {
            cart: [...state.cart, { productId, quantity }],
          };
        }),

      removeFromCart: (productId) =>
        set((state) => ({
          cart: state.cart.filter((item) => item.productId !== productId),
        })),

      updateCartQuantity: (productId, quantity) =>
        set((state) => ({
          cart:
            quantity <= 0
              ? state.cart.filter((item) => item.productId !== productId)
              : state.cart.map((item) =>
                  item.productId === productId ? { ...item, quantity } : item
                ),
        })),

      clearCart: () => set({ cart: [] }),

      // UI 操作
      setSelectedCategory: (category) =>
        set((state) => ({
          ui: { ...state.ui, selectedCategory: category },
        })),

      setSearchQuery: (query) =>
        set((state) => ({
          ui: { ...state.ui, searchQuery: query },
        })),

      toggleCart: () =>
        set((state) => ({
          ui: { ...state.ui, cartOpen: !state.ui.cartOpen },
        })),

      setLoading: (key, loading) =>
        set((state) => ({
          ui: {
            ...state.ui,
            loading: {
              ...state.ui.loading,
              [key]: loading,
            },
          },
        })),

      // 用户操作
      setCurrentUser: (userId) => set({ currentUserId: userId }),
    }),
    {
      name: 'ecommerce-store',
      partialize: (state) => ({
        cart: state.cart,
        currentUserId: state.currentUserId,
        entities: {
          products: state.entities.products, // 持久化产品缓存
        },
      }),
    }
  )
);

// 选择器
export const selectCartItems = (state: Store) =>
  state.cart.map((item) => ({
    ...item,
    product: state.entities.products[item.productId],
  }));

export const selectCartTotal = (state: Store) =>
  state.cart.reduce((total, item) => {
    const product = state.entities.products[item.productId];
    return total + (product?.price ?? 0) * item.quantity;
  }, 0);

export const selectFilteredProducts = (state: Store) => {
  let products = Object.values(state.entities.products);

  if (state.ui.selectedCategory) {
    products = products.filter(
      (p) => p.category === state.ui.selectedCategory
    );
  }

  if (state.ui.searchQuery) {
    const query = state.ui.searchQuery.toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    );
  }

  return products;
};
```

---

## 十、性能优化深度指南

### 10.1 避免不必要的渲染

#### 10.1.1 React.memo 优化

```tsx
import { memo, useState } from 'react';

// 使用 React.memo 包装组件
const ExpensiveTree = memo(({ data, onUpdate }) => {
  // 只有 data 或 onUpdate 变化时才重新渲染
  return <div>{/* 复杂渲染逻辑 */}</div>;
});

// 自定义比较函数
const OptimizedList = memo(
  ({ items }) => {
    return (
      <ul>
        {items.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    );
  },
  (prevProps, nextProps) => {
    // 自定义比较逻辑
    // 返回 true 表示不需要更新
    return prevProps.items.length === nextProps.items.length;
  }
);
```

#### 10.1.2 useCallback 优化回调

```tsx
import { useCallback, useState } from 'react';

function Parent() {
  const [count, setCount] = useState(0);

  // ❌ 每次渲染都创建新函数
  const handleClick = () => {
    console.log(count);
  };

  // ✅ 使用 useCallback 缓存函数
  const handleClickMemoized = useCallback(() => {
    console.log(count);
  }, [count]); // count 变化时才创建新函数

  return (
    <>
      <Child onClick={handleClick} />
      <MemoizedChild onClick={handleClickMemoized} />
    </>
  );
}
```

### 10.2 状态选择优化

#### 10.2.1 Zustand 精细订阅

```tsx
const useStore = create((set) => ({
  user: { name: '张三', age: 25, email: 'zhangsan@example.com' },
  posts: [],
  ui: { theme: 'light', sidebar: false },
}));

// ❌ 订阅整个 Store，任何状态变化都重渲染
function BadComponent() {
  const { user, posts, ui } = useStore();
  return <div>{user.name}</div>;
}

// ✅ 精确订阅需要的字段
function GoodComponent() {
  const userName = useStore((state) => state.user.name);
  return <div>{userName}</div>;
}

// ✅ 使用 shallow 比较多个字段
import { useShallow } from 'zustand/shallow';

function MultiSelectComponent() {
  const { userName, theme } = useStore(
    useShallow((state) => ({
      userName: state.user.name,
      theme: state.ui.theme,
    }))
  );

  return (
    <div className={theme}>
      <span>{userName}</span>
    </div>
  );
}
```

#### 10.2.2 Redux 选择器优化

```tsx
import { createSelector } from '@reduxjs/toolkit';

// 创建记忆化选择器
const selectUser = (state) => state.user.currentUser;
const selectUserSettings = (state) => state.user.settings;

const selectUserDisplay = createSelector(
  [selectUser, selectUserSettings],
  (user, settings) => ({
    name: user?.name ?? 'Guest',
    avatar: user?.avatar ?? '/default-avatar.png',
    theme: settings?.theme ?? 'light',
  })
);

function UserDisplay() {
  // ✅ 只有 user 或 settings 变化时才重新计算
  const display = useAppSelector(selectUserDisplay);

  return <div>{display.name}</div>;
}
```

### 10.3 记忆化策略

#### 10.3.1 useMemo 的正确使用

```tsx
import { useMemo } from 'react';

function DataTable({ data, filter, sortKey }) {
  // ✅ 复杂计算使用 useMemo
  const filteredData = useMemo(() => {
    return data.filter((item) =>
      item.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [data, filter]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name);
      if (sortKey === 'date') return b.date - a.date;
      return 0;
    });
  }, [filteredData, sortKey]);

  // ❌ 简单计算不需要 useMemo
  const count = filteredData.length;

  return (
    <div>
      <span>共 {count} 条记录</span>
      {sortedData.map((item) => (
        <DataRow key={item.id} item={item} />
      ))}
    </div>
  );
}
```

#### 10.3.2 useMemo 依赖管理

```tsx
// ❌ 依赖过多或过少都是问题
const wrongMemo = useMemo(() => {
  return computeExpensive(a, b);
}, []); // ❌ 缺少依赖，可能使用过期数据

const alsoWrongMemo = useMemo(() => {
  return computeExpensive(a, b);
}, [a, b, c, d, e, f]); // ❌ 依赖过多，几乎每次都重新计算

// ✅ 正确的依赖
const correctMemo = useMemo(() => {
  return computeExpensive(a, b);
}, [a, b]); // 只依赖真正影响计算结果的值
```

### 10.4 我的思考：优化要有针对性

#### 10.4.1 避免过早优化

> "过早优化是万恶之源" — Donald Knuth

优化应该基于**性能测试**和**实际瓶颈**，而不是猜测：

1. **Profiling first** - 使用 React DevTools Profiler 找到真正的瓶颈
2. **Measure** - 使用 Performance API 量化改进前后
3. **Optimize** - 针对瓶颈进行优化
4. **Verify** - 确认优化有效

#### 10.4.2 常见性能陷阱

```tsx
// 陷阱 1：内联对象字面量
function Component() {
  return (
    <Child
      style={{ color: 'red' }} // ❌ 每次渲染创建新对象
      onClick={() => doSomething()} // ❌ 每次渲染创建新函数
    />
  );
}

// 陷阱 2：在渲染中创建新数组
function Component({ items }) {
  const processed = items.map(/* ... */); // ❌ 每次渲染创建新数组

  return processed.map(item => <Item key={item.id} {...item} />);
}

// 陷阱 3：数组索引作为 key
function Component({ items }) {
  return items.map((item, index) => (
    <Item key={index} {...item} /> // ❌ 如果列表会变化，会有问题
  ));
}
```

#### 10.4.3 优化优先级

```
优先级排序：
1. 减少不必要的渲染 (React.memo, useCallback)
2. 优化状态选择 (选择器, shallow)
3. 虚拟化长列表 (react-window, react-virtual)
4. 延迟加载 (React.lazy, code splitting)
5. 缓存计算结果 (useMemo)
```

---

## 附录：核心对比表格汇总

### A.1 状态管理方案综合对比

| 方案 | 包大小 | 学习曲线 | 调试支持 | 适用场景 | 状态模型 | 中间件 |
|------|--------|----------|----------|----------|----------|--------|
| useState | 0KB | 最低 | 一般 | 组件本地 | 本地 | 无 |
| Context | 0KB | 低 | 一般 | 跨组件 | 层级 | 无 |
| Redux | ~7KB | 较陡 | 优秀 | 大型企业 | 单一 Store | 丰富 |
| Redux Toolkit | ~15KB | 中等 | 优秀 | 大型企业 | 单一 Store | 丰富 |
| Zustand | ~1.5KB | 平缓 | 良好 | 中小型 | 分散 Store | 简洁 |
| Jotai | ~3KB | 平缓 | 良好 | 原子化需求 | Atom | 简洁 |
| Recoil | ~4KB | 中等 | 一般 | 实验性 | Atom | 一般 |
| Valtio | ~3KB | 平缓 | 一般 | 响应式 | Proxy | 无 |

### A.2 服务端状态管理对比

| 方案 | 包大小 | 缓存策略 | 乐观更新 | 轮询 | SSR |
|------|--------|----------|----------|------|-----|
| React Query | ~13KB | SWR | 原生支持 | 支持 | 完善 |
| SWR | ~5KB | SWR | 支持 | 支持 | 基本 |
| RTK Query | ~10KB | SWR | 原生支持 | 支持 | 完善 |

### A.3 性能优化对比

| 方案 | 重渲染控制 | 选择器优化 | 记忆化 | 虚拟化支持 |
|------|------------|------------|--------|------------|
| Redux | Reducer 级别 | Reselect | 手动 | 需配合 |
| Zustand | 订阅级别 | 手动/shallow | 手动 | 需配合 |
| Jotai | 自动追踪 | 内置 | 自动 | 需配合 |
| React Query | 自动 | 自动 | 自动 | 需配合 |

### A.4 状态持久化对比

| 方案 | localStorage | sessionStorage | IndexedDB | 自定义引擎 |
|------|--------------|----------------|-----------|------------|
| Redux Persist | 支持 | 支持 | 需自定义 | 需自定义 |
| Zustand persist | 支持 | 支持 | 需自定义 | 支持 |
| Context | 需手动 | 需手动 | 需手动 | 需手动 |

---

## 总结

React 状态管理是一个需要深入理解的领域。本文从全景图出发，系统性地对比了从本地状态到服务端状态的各类方案：

1. **本地状态** (`useState`/`useReducer`) 是基础，适合组件私有状态
2. **Context** 适合低频变化的跨组件共享
3. **Zustand** 是中小型项目的最佳选择，API 简洁，性能优秀
4. **Redux Toolkit** 是大型项目的可靠方案，生态成熟，调试方便
5. **Jotai** 适合需要灵活派生状态的场景
6. **React Query/SWR** 是服务端状态管理的标准方案

**核心选型原则：**

1. **从小处着手** - 先用简单的方案，问题来了再升级
2. **按需选择** - 根据团队能力和项目需求选型
3. **混合使用** - 不同类型状态使用不同方案是完全正常的
4. **持续演进** - 技术栈应该随着项目发展而调整

记住：**没有最好的方案，只有最适合当前场景的方案**。