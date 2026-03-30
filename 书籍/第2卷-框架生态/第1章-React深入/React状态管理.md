# 第2卷-框架生态

---

## 第1章 React深入

---

### 3.1 React状态管理

#### 3.1.1 Redux核心原理

**参考答案：**

Redux 是 JavaScript 状态容器，提供可预测的状态管理。

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ 
┃                        Redux 工作流程                            ┃
┃                                                                  ┃
┃   ┏━━━━━━━━━┓     ┏━━━━━━━━━━┓     ┏━━━━━━━━━━━━┓     ┏━━━━━┓ ┃   
┃   ┃ Action  ┃━━━━▶┃ Dispatch ┃━━━━▶┃   Store    ┃━━━━▶┃View ┃ ┃   
┃   ┗━━━━━━━━━┛     ┗━━━━━━━━━━┛     ┗━━━━━┳━━━━━━┛     ┗━━━━━┛ ┃   
┃                                          ┃                     ┃  
┃                                          ▼                     ┃  
┃                                   ┏━━━━━━━━━━━━┓              ┃   
┃                                   ┃  Reducer   ┃              ┃   
┃                                   ┗━━━━━┳━━━━━━┛              ┃   
┃                                         ┃                     ┃   
┃                                         ▼                     ┃   
┃                                   ┏━━━━━━━━━━━━┓              ┃   
┃                                   ┃   State    ┃              ┃   
┃                                   ┗━━━━━━━━━━━━┛              ┃   
┃                                                                  ┃
┃  核心原则：                                                      ┃
┃  1. 单一数据源 - 整个应用的状态存储在单一 store 中               ┃
┃  2. 状态只读 - 只能通过 dispatch action 来修改状态              ┃ 
┃  3. 纯函数修改 - reducer 必须是纯函数                           ┃ 
┃                                                                  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ 

```

```javascript
// Redux 核心概念

// 1. Action - 描述事件的对象
const incrementAction = {
  type: 'INCREMENT',
  payload: 1
};

const setUserAction = {
  type: 'SET_USER',
  payload: { id: 1, name: 'John' }
};

// Action Creator - 创建 Action 的函数
const increment = () => ({
  type: 'INCREMENT',
  payload: 1
});

const setUser = (user) => ({
  type: 'SET_USER',
  payload: user
});

// 2. Reducer - 处理状态更新
// 必须是纯函数
const counterReducer = (state = 0, action) => {
  switch (action.type) {
    case 'INCREMENT':
      return state + action.payload;
    case 'DECREMENT':
      return state - action.payload;
    case 'RESET':
      return 0;
    default:
      return state;
  }
};

const userReducer = (state = null, action) => {
  switch (action.type) {
    case 'SET_USER':
      return action.payload;
    case 'LOGOUT':
      return null;
    default:
      return state;
  }
};

// 3. Store - 存储状态
import { createStore } from 'redux';

// 组合多个 reducer
const rootReducer = combineReducers({
  counter: counterReducer,
  user: userReducer
});

const store = createStore(rootReducer);

// 4. Store 的方法
// dispatch - 分发 action
store.dispatch(increment());
store.dispatch(increment());
store.dispatch(setUser({ id: 1, name: 'John' }));

// getState - 获取状态
console.log(store.getState());
// { counter: 2, user: { id: 1, name: 'John' } }

// subscribe - 订阅状态变化
const unsubscribe = store.subscribe(() => {
  console.log('State changed:', store.getState());
});

// unsubscribe 取消订阅
unsubscribe();
```

#### 3.1.2 Redux中间件

**参考答案：**

```javascript
// Redux 中间件

// 中间件的基本结构
const loggerMiddleware = store => next => action => {
  console.log('Dispatching:', action);
  const result = next(action);
  console.log('Next state:', store.getState());
  return result;
};

// 中间件示例 1：异步 Action
const asyncMiddleware = store => next => action => {
  if (typeof action === 'function') {
    return action(store.dispatch, store.getState);
  }
  return next(action);
};

// 使用 thunk 处理异步
const thunkMiddleware = store => next => action => {
  if (typeof action === 'function') {
    return action(store.dispatch, store.getState);
  }
  return next(action);
};

// 异步 Action Creator
const fetchUser = (userId) => {
  return (dispatch, getState) => {
    dispatch({ type: 'FETCH_USER_REQUEST' });

    fetch(`/api/users/${userId}`)
      .then(response => response.json())
      .then(user => {
        dispatch({ type: 'FETCH_USER_SUCCESS', payload: user });
      })
      .catch(error => {
        dispatch({ type: 'FETCH_USER_ERROR', payload: error });
      });
  };
};

// 应用中间件
import { applyMiddleware, compose } from 'redux';

const store = createStore(
  rootReducer,
  applyMiddleware(loggerMiddleware, thunkMiddleware)
);

// 中间件示例 2：Redux Persist
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'] // 只持久化 auth reducer
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = createStore(persistedReducer);
const persistor = persistStore(store);

// 中间件示例 3：自定义中间件 - 错误处理
const errorMiddleware = store => next => action => {
  try {
    return next(action);
  } catch (error) {
    console.error('Redux Error:', error);
    return error;
  }
};
```

#### 3.1.3 ReduxToolkit

**参考答案：**

```javascript
// Redux Toolkit 简化 Redux 开发
import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// createSlice - 自动生成 action creator 和 reducer
const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => {
      // 直接修改 state（Immer 内部处理）
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

// createAsyncThunk - 处理异步逻辑
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
    data: null,
    loading: false,
    error: null
  },
  reducers: {
    clearUser: (state) => {
      state.data = null;
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
        state.data = action.payload;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// configureStore - 创建 store
const store = configureStore({
  reducer: {
    counter: counterSlice.reducer,
    user: userSlice.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    }),
  devTools: process.env.NODE_ENV !== 'production'
});

// 创建选择器
const selectCounterValue = (state) => state.counter.value;
const selectUserData = (state) => state.user.data;
const selectUserLoading = (state) => state.user.loading;

// 使用
function Counter() {
  const count = useSelector(selectCounterValue);
  const dispatch = useDispatch();

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => dispatch(increment())}>+</button>
      <button onClick={() => dispatch(decrement())}>-</button>
      <button onClick={() => dispatch(incrementByAmount(5))}>+5</button>
    </div>
  );
}
```

---

### 3.2 ReactContext

#### 3.2.1 Context基本用法

**参考答案：**

```javascript
// Context 基本用法

// 1. 创建 Context
import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

// 2. 提供 Context
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    setTheme(t => t === 'light' ? 'dark' : 'light');
  };

  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// 3. 消费 Context
function ThemeButton() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <button
      onClick={toggleTheme}
      style={{
        backgroundColor: theme === 'dark' ? '#333' : '#fff',
        color: theme === 'dark' ? '#fff' : '#333'
      }}
    >
      Current: {theme}
    </button>
  );
}

// 4. 使用 Provider
function App() {
  return (
    <ThemeProvider>
      <ThemeButton />
    </ThemeProvider>
  );
}

// Context 配合 useReducer
const initialState = { count: 0 };

function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 };
    case 'decrement':
      return { count: state.count - 1 };
    default:
      return state;
  }
}

const DispatchContext = createContext();
const StateContext = createContext();

function CounterProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

function Counter() {
  const state = useContext(StateContext);
  const dispatch = useContext(DispatchContext);

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
    </div>
  );
}
```

#### 3.2.2 Context性能优化

**参考答案：**

```javascript
// Context 性能问题与优化

// 问题：Context 值变化导致所有消费者重渲染
function ProblematicContext() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('John');

  // 问题：每次 count 变化，所有消费者都会重渲染
  const value = { count, name };

  return (
    <MyContext.Provider value={value}>
      <Child />
    </MyContext.Provider>
  );
}

// 优化 1：拆分 Context
function OptimizedContext() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('John');

  // 拆分：只订阅需要的内容
  const countValue = useMemo(() => count, [count]);
  const nameValue = useMemo(() => name, [name]);

  return (
    <CountContext.Provider value={countValue}>
      <NameContext.Provider value={nameValue}>
        <Child />
      </NameContext.Provider>
    </CountContext.Provider>
  );
}

function Child() {
  // 只订阅需要的 Context
  const count = useContext(CountContext);
  const name = useContext(NameContext);

  return <div>{count} - {name}</div>;
}

// 优化 2：使用 useMemo 稳定 Context 值
function MemoizedContext() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('John');

  const value = useMemo(() => ({
    count,
    name,
    setCount,
    setName
  }), [count, name]);

  return (
    <MyContext.Provider value={value}>
      <Child />
    </MyContext.Provider>
  );
}

// 优化 3：使用 useReducer 减少状态更新
function ReducerContext() {
  const [state, dispatch] = useReducer(counterReducer, initialState);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <Context.Provider value={value}>
      <Child />
    </Context.Provider>
  );
}

function Child() {
  const { state, dispatch } = useContext(Context);

  return (
    <button onClick={() => dispatch({ type: 'increment' })}>
      {state.count}
    </button>
  );
}

// 优化 4：使用 React.memo 阻止不必要的重渲染
const ExpensiveChild = React.memo(({ name }) => {
  console.log('Child rendered');
  return <div>{name}</div>;
});

// 配合 useMemo 传递 props
function Parent() {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []);

  const memoizedProps = useMemo(() => ({
    onClick: handleClick,
    label: 'Click me'
  }), [handleClick]);

  return <ExpensiveChild {...memoizedProps} />;
}
```

---

### 3.3 Zustand状态管理

#### 3.3.1 Zustand基本用法

**参考答案：**

```javascript
// Zustand - 轻量级状态管理库
import { create } from 'zustand';

// 基础 Store
const useStore = create((set, get) => ({
  // 状态
  bears: 0,

  // 同步 actions
  increasePopulation: () => set(state => ({
    bears: state.bears + 1
  })),

  removeAllBears: () => set({ bears: 0 }),

  // 带参数
  updateBears: (count) => set({ bears: count }),

  // 获取当前状态
  getBears: () => get().bears
}));

// 使用
function BearCounter() {
  const bears = useStore(state => state.bears);
  const increasePopulation = useStore(state => state.increasePopulation);

  return (
    <div>
      <h1>{bears} bears</h1>
      <button onClick={increasePopulation}>Add bear</button>
    </div>
  );
}

// 选择器优化 - 只订阅需要的状态
function OptimizedBearCounter() {
  // 只订阅 bears 状态，不触发其他状态变化时的重渲染
  const bears = useStore(state => state.bears);
  // 或者使用字符串选择器
  const increasePopulation = useStore('increasePopulation');

  return (
    <div>
      <h1>{bears} bears</h1>
      <button onClick={increasePopulation}>Add bear</button>
    </div>
  );
}

// 异步 Actions
const useAsyncStore = create((set, get) => ({
  users: [],
  loading: false,
  error: null,

  fetchUsers: async () => {
    set({ loading: true, error: null });

    try {
      const response = await fetch('/api/users');
      const users = await response.json();
      set({ users, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  addUser: async (user) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(user)
    });
    const newUser = await response.json();
    set(state => ({ users: [...state.users, newUser] }));
  }
}));

// 计算属性（Getter）
const useStoreWithGetters = create((set, get) => ({
  bears: 0,
  ninjas: 0,

  // 计算属性
  getTotalAnimals: () => get().bears + get().ninjas,
  getBearsSquared: () => get().bears ** 2,

  increaseBears: () => set(state => ({ bears: state.bears + 1 })),
  increaseNinjas: () => set(state => ({ ninjas: state.ninjas + 1 }))
}));

function AnimalCounter() {
  const bears = useStore(state => state.bears);
  const ninjas = useStore(state => state.ninjas);
  const getTotalAnimals = useStore(state => state.getTotalAnimals);

  return (
    <div>
      <p>Bears: {bears}</p>
      <p>Ninjas: {ninjas}</p>
      <p>Total: {getTotalAnimals()}</p>
    </div>
  );
}

// 持久化
import { persist, createJSONStorage } from 'zustand/middleware';

const usePersistentStore = create(
  persist(
    (set) => ({
      bears: 0,
      increaseBears: () => set(state => ({ bears: state.bears + 1 }))
    }),
    {
      name: 'bear-storage', // localStorage key
      storage: createJSONStorage(() => localStorage)
    }
  )
);

// 中间件
const useStoreWithMiddleware = create(
  (set, get) => ({
    bears: 0,
    increaseBears: () => set(state => ({ bears: state.bears + 1 }))
  }),
  // 中间件
  (f) => (config) => {
    const store = f(config);

    return {
      ...store,
      // 扩展功能
      reset: () => config.set({ bears: 0 })
    };
  }
);
```

---

### 3.4 状态管理对比

#### 3.4.1 各状态管理方案对比

**参考答案：**

```javascript
// 状态管理方案对比

// 1. useState - 适合简单局部状态
function UseStateExample() {
  const [count, setCount] = useState(0);
  // 优点：简单，无需额外学习成本
  // 缺点：状态共享困难，props 穿透繁琐

  return <div>{count}</div>;
}

// 2. Context - 适合全局配置、低频更新
function ContextExample() {
  // 适合：主题、语言、全局配置
  // 优点：无需 props 穿透
  // 缺点：频繁更新会导致重渲染

  return <ThemeContext.Provider value={theme}>...</ThemeContext.Provider>;
}

// 3. Redux - 适合大型复杂应用
function ReduxExample() {
  const dispatch = useDispatch();
  const state = useSelector(state => state.counter);

  // 优点：强大的 DevTools，中间件支持，时间旅行
  // 缺点：样板代码多，学习曲线陡峭

  return <div>{state.value}</div>;
}

// 4. Zustand - 适合中小型应用
function ZustandExample() {
  const { bears, increase } = useStore();

  // 优点：简洁，灵活，无需 Provider
  // 缺点：社区相对较小

  return <div>{bears}</div>;
}

// 5. React Query / SWR - 适合服务端状态
function ReactQueryExample() {
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers
  });

  // 优点：自动缓存、轮询、deduping
  // 缺点：仅适用于异步数据

  return <div>{data}</div>;
}

// 选择建议：
// - 简单组件：useState
// - 全局配置：Context
// - 大型项目：Redux Toolkit
// - 中小型项目：Zustand
// - 服务端数据：React Query / SWR
```

---

