# Zustand 源码解析：核心架构

> 本文深入分析 Zustand 5.x 核心架构，解读 create 函数原理、中间件系统、状态存储和 React 绑定机制。

## 一、Zustand 概述

Zustand 是一个轻量级、类型安全的 React 状态管理库，核心设计理念是：

| 特性 | 说明 |
|------|------|
| **极简 API** | 只有 create、getState、setState、subscribe 四个核心函数 |
| **无 Provider** | 无需嵌套 Provider，直接导入使用 |
| **中间件系统** | 支持 persist、devtools、immer 等中间件 |
| **类型安全** | 全程 TypeScript 类型推断 |
| **性能优化** | 基于浅比较的选择器优化 |

```typescript
// Zustand 最简单的使用方式
import { create } from 'zustand';

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

function Counter() {
  const { count, increment } = useStore();
  return <button onClick={increment}>{count}</button>;
}
```

## 二、create 函数原理

### 2.1 create 函数类型签名

```typescript
// zustand/src/vanilla.ts 核心类型定义

// 状态切片类型
type StateCreator<T, Mps extends [any] = [], Mpa extends [any] = []> = (
  setState: SetState<T>,
  getState: GetState<T>,
  api: StoreApi<T>
) => T;

// create 函数的类型定义
function create<T extends StateCreator<any>>(
  creator: T
): <Mps extends [any] = [], Mpa extends [any] = []>(
  ...middlewares: Mpa
) => UseStore<InferFromStateCreator<T>>;
```

### 2.2 create 函数实现流程

```typescript
// zustand/src/react.ts - create 函数的 React 版本

/**
 * 创建 Zustand Store 的入口函数
 * 支持两种调用方式：
 * 1. create((set, get) => ({ ... }))
 * 2. create(creatorFn)(middlewares)
 */
export function create<T>(creator: StateCreator<T>): UseStore<T> {
  // 使用 createStoreImpl 创建底层 store
  const hookName = 'zustand' + Math.random().toString(36).slice(2);
  const api = createStoreImpl(creator as StateCreator<any>);

  // 返回 React Hook
  return function useStore(selector?: any, equalityFn?: any) {
    return useStoreImpl(api, selector, equalityFn, hookName);
  } as UseStore<T>;
}

/**
 * createStoreImpl - 创建 Store 实现
 * 这是 Zustand 的核心，它创建了一个"纯净"的 JavaScript 对象，
 * 完全独立于 React，实现了真正的框架解耦
 */
function createStoreImpl<T extends StateCreator<any>>(
  creator: T
): StoreApi<InferFromStateCreator<T>> {
  // 存储当前状态
  let state: T;

  // 获取器函数
  const getState: GetState<T> = () => state;

  // 设置器函数
  const setState: SetState<T> = (partial, replace) => {
    // ... 状态更新逻辑
  };

  // 订阅函数
  const subscribe: Subscribe<T> = (listener) => {
    // ... 订阅逻辑
  };

  // 销毁函数
  const destroy: Destroy = () => {
    // ... 清理逻辑
  };

  // Store API 对象
  const api: StoreApi<T> = {
    getState,
    setState,
    subscribe,
    destroy,
  };

  // 初始化状态 - 调用 creator 函数
  // 这里传入了 setState、getState 和 api
  state = creator(setState, getState, api);

  return api;
}
```

### 2.3 create 函数执行时序图

```
调用 create(creator)
       │
       ▼
┌─────────────────────────────────────────┐
│  createStoreImpl(creator)               │
│                                         │
│  1. 创建 getState、setState、subscribe  │
│  2. 创建 api 对象 { getState, setState, │
│                    subscribe, destroy }  │
│  3. 调用 creator(setState, getState, api)│
│     获取初始状态                          │
│  4. 返回 api 对象                        │
└─────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  返回 useStore Hook                     │
│  - 接收 selector 和 equalityFn          │
│  - 内部调用 useSyncExternalStore        │
│  - 实现响应式更新                        │
└─────────────────────────────────────────┘
```

## 三、中间件系统架构

### 3.1 中间件类型定义

```typescript
// zustand/src/types.ts

/**
 * Middleware 中间件类型
 * 中间件是一个高阶函数，它接收 get 和 set，
 * 返回一个被增强的 get 和 set
 */
type Middleware = <
  T extends StateCreator<any>,
  Mps extends [any] = [],
  Mpa extends [any] = []
>(
  creator: T,
  muidcs: Mps,
  ms: Mpa
) => T;

/**
 * 展开参数类型
 * 用于从中间件数组中提取参数类型
 */
type ExcludeFromTuple<A, B> = A extends [infer AI, ...infer AR]
  ? B extends [infer BI, ...infer BR]
    ? AI extends BI
      ? ExcludeFromTuple<AR, BR>
      : never
    : never
  : A;
```

### 3.2 中间件执行机制

```typescript
// zustand/src/react.ts - 中间件组合

/**
 * applyMiddleware - 中间件应用函数
 * 将多个中间件按顺序组合，最终返回一个增强版的 creator
 */
function applyMiddleware(
  creator: StateCreator<any>,
  middlewares: Middleware[]
): StateCreator<any> {
  // 从右到左组合中间件
  // 每个中间件包装前一个中间件的结果
  return middlewares.reduceRight<StateCreator<any>>(
    (enhancedCreator, middleware) => {
      // 调用中间件，传入原始 creator
      // 中间件返回一个新的 creator
      return middleware(enhancedCreator);
    },
    creator  // 初始的原始 creator
  );
}

// 示例：withLogger 和 withPersistence 组合
const enhancedCreator = applyMiddleware(creator, [withLogger, withPersistence]);
```

### 3.3 中间件结构解析

```typescript
// 中间件的标准结构
const myMiddleware = (creator) => (set, get, api) => {
  // 1. 在调用原始 creator 之前，可以做一些预处理
  console.log('State is being created');

  // 2. 调用原始 creator，获取原始状态
  const rawState = creator(set, get, api);

  // 3. 在原始状态基础上增强/包装
  return {
    ...rawState,
    // 添加中间件特有的属性或方法
    _timestamp: Date.now(),
    _middleware: 'myMiddleware',
  };
};
```

## 四、状态存储（Vanilla Store）

### 4.1 Vanilla Store 核心实现

```typescript
// zustand/src/vanilla.ts

/**
 * 纯净的 Store 实现，不依赖任何框架
 * 这是 Zustand "vanilla" 版本的核心
 */
export function createStore<T extends StateCreator<any>>(
  creator: T
): StoreApi<InferFromStateCreator<T>> {
  type TState = InferFromStateCreator<T>;

  // 存储所有订阅者
  const listeners: Set<Listener<TState>> = new Set();

  // 状态存储
  let state: TState;

  // 获取当前状态
  const getState: GetState<TState> = () => state;

  // 设置状态 - 核心更新逻辑
  const setState: SetState<TState> = (partial, replace) => {
    // 1. 获取部分状态
    const nextState = typeof partial === 'function'
      ? (partial as Function)(state)
      : partial;

    // 2. 获取更新后的完整状态
    const newState = replace
      ? (nextState as TState)
      : Object.assign({}, state, nextState);

    // 3. 比较状态是否真的变化了
    // 使用 Object.is 进行严格比较，避免不必要的更新
    if (!Object.is(newState, state)) {
      const previousState = state;
      state = Object.freeze(newState);  // 冻结状态，防止意外修改

      // 4. 通知所有订阅者
      listeners.forEach((listener) => {
        listener(state, previousState);
      });
    }
  };

  // 订阅状态变化
  const subscribe: Subscribe<TState> = (listener, selector, equalityFn) => {
    // 如果提供了 selector，进行选择性订阅
    if (selector || equalityFn) {
      return subscribeWithSelector(listeners, listener, selector, equalityFn);
    }

    // 无 selector 的直接订阅
    listeners.add(listener);

    // 返回取消订阅函数
    return () => listeners.delete(listener);
  };

  // 销毁 store
  const destroy: Destroy = () => {
    listeners.clear();
  };

  // 创建 API 对象
  const api: StoreApi<TState> = {
    getState,
    setState,
    subscribe,
    destroy,
  };

  // 初始化状态
  state = creator(setState, getState, api);

  return api;
}

/**
 * subscribeWithSelector - 选择性订阅实现
 * 只有当选择器返回的值变化时，才触发更新
 */
function subscribeWithSelector<TState>(
  listeners: Set<Listener<TState>>,
  listener: Listener<TState>,
  selector?: (state: TState) => any,
  equalityFn?: (a: any, b: any) => boolean
) {
  // 上一次选择器返回的值
  let lastValue = selector ? selector(state) : state;

  // 创建订阅函数
  const subscription = (currentState: TState) => {
    // 使用选择器获取新值
    const selectedValue = selector ? selector(currentState) : currentState;

    // 使用比较函数判断是否真的变化了
    const hasChanged = equalityFn
      ? !equalityFn(lastValue, selectedValue)
      : !Object.is(lastValue, selectedValue);

    if (hasChanged) {
      const previousValue = lastValue;
      lastValue = selectedValue;

      // 调用监听器，传入新值和旧值
      listener(lastValue, previousValue);
    }
  };

  listeners.add(subscription);

  // 返回取消订阅函数
  return () => listeners.delete(subscription);
}
```

### 4.2 状态更新流程图

```
setState(partial)
       │
       ▼
┌─────────────────────────────────────────┐
│  判断 partial 类型                       │
│  - 函数: 调用 partial(state) 获取新状态  │
│  - 对象: 直接使用 partial                │
└─────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  merge 合并状态                         │
│  Object.assign({}, state, nextState)    │
└─────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Object.is 比较新旧状态                 │
│  - 相等: 不更新，不通知                  │
│  - 不等: 冻结新状态，通知订阅者           │
└─────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  遍历 listeners                         │
│  调用每个 listener(state, prevState)   │
└─────────────────────────────────────────┘
```

## 五、React 绑定原理

### 5.1 useSyncExternalStore 集成

```typescript
// zustand/src/react.ts

/**
 * React 18+ 的 useSyncExternalStore 集成
 * 这是 Zustand 实现响应式更新的核心
 */
function useStoreImpl<T>(
  api: StoreApi<T>,
  selector: (state: T) => any,
  equalityFn: ((a: any, b: any) => boolean) | undefined,
  hookName: string
) {
  // 获取初始状态
  const initialState = api.getState();

  // 使用 useSyncExternalStore
  // - subscribe: 订阅 store 变化
  // - getSnapshot: 获取当前状态快照
  // - getServerSnapshot: 服务端渲染时的快照
  const slice = useSyncExternalStore(
    (callback) => api.subscribe(callback, selector, equalityFn),
    () => api.getState(),
    () => initialState
  );

  return selector ? selector(slice) : slice;
}

/**
 * 完整的 useStore Hook
 * selector 用于从状态中提取需要的部分
 * equalityFn 用于比较新旧值，控制是否重新渲染
 */
export function useStore<T>(
  selector: (state: T) => any,
  equalityFn?: (a: any, b: any) => boolean
) {
  const useStoreHook = useRef(create(creator)).current;
  return useStoreHook(selector, equalityFn);
}
```

### 5.2 选择器优化机制

```typescript
// zustand/src/react.ts - 选择器优化

/**
 * 默认的相等性比较函数
 * 浅比较两个对象/数组是否相等
 */
const defaultEqualityFn = <T>(a: T, b: T) =>
  Object.is(a, b) ||
  // 对于复杂对象，进行浅比较
  (typeof a === 'object' &&
    a !== null &&
    b !== null &&
    Object.keys(a).length === Object.keys(b).length &&
    Object.keys(a).every((key) => Object.is((a as any)[key], (b as any)[key])));

/**
 * useShallow - 浅比较选择器
 * 用于复杂对象的选择性订阅
 */
export function useShallow<T extends object>(selector: () => T) {
  return useStore(selector, shallow);
}

// 使用示例
const { name, age } = useStore(
  useShallow((state) => ({ name: state.name, age: state.age }))
);
```

### 5.3 React Hook 执行时序

```
组件首次渲染
       │
       ▼
┌─────────────────────────────────────────┐
│  useStore(selector)                    │
│  1. 调用 useSyncExternalStore           │
│  2. 调用 getSnapshot() 获取初始状态     │
│  3. 执行 selector(state) 提取数据       │
│  4. 组件渲染                            │
└─────────────────────────────────────────┘
       │
       ▼
组件依赖的状态变化
       │
       ▼
┌─────────────────────────────────────────┐
│  setState(newState)                    │
│  1. 更新 vanilla store 中的 state       │
│  2. 遍历 listeners，调用订阅函数         │
│  3. useSyncExternalStore 收到通知       │
│  4. 调用 getSnapshot() 获取新状态        │
│  5. 比较新旧快照（使用 equalityFn）       │
│  6. 如果变化，触发组件重渲染             │
└─────────────────────────────────────────┘
```

## 六、核心文件结构

```
zustand/
├── src/
│   ├── vanilla.ts          # 核心实现（框架无关）
│   ├── react.ts            # React Hook 绑定
│   ├── types.ts            # TypeScript 类型定义
│   ├── index.ts            # 导出入口
│   └── middleware/         # 内置中间件
│       ├── persist.ts      # 持久化中间件
│       ├── devtools.ts     # Redux DevTools
│       └── immer.ts        # Immer 集成
```

## 七、设计思想总结

### 7.1 框架解耦

Zustand 最重要的设计是 **vanilla store**：

```typescript
// 核心是 vanilla store，完全不依赖 React
const store = createStore((set, get) => ({
  count: 0,
  increment: () => set({ count: get().count + 1 }),
}));

// 然后通过 React Hook 连接
const useStore = create(store);
```

### 7.2 订阅模式

```typescript
// 直接订阅
const unsubscribe = store.subscribe((state, prevState) => {
  console.log('State changed:', state);
});

// 选择性订阅（只在 count 变化时触发）
const unsubscribe = store.subscribe(
  (state) => state.count,
  (count, prevCount) => {
    console.log('Count changed:', count);
  },
  (a, b) => Object.is(a, b)  // 比较函数
);
```

### 7.3 中间件组合

```typescript
// 使用多个中间件
const useStore = create(
  persist(
    devtools(
      immer((set, get) => ({
        count: 0,
        increment: () => set((state) => { state.count++ }),
      }))
    )
  )
);
```

## 八、面试要点

| 问题 | 答案要点 |
|------|----------|
| Zustand 如何实现响应式更新？ | 使用 useSyncExternalStore 订阅 store 变化 |
| 为什么不需要 Provider？ | create 返回的就是 Hook，直接调用即可 |
| 中间件系统的核心原理？ | 高阶函数，包装 creator，返回增强版 creator |
| 如何避免不必要的重渲染？ | 使用 selector + equalityFn（如 useShallow） |
| vanilla store 的优势？ | 框架解耦，可在 React 之外使用 |
| Object.freeze 的作用？ | 冻结状态对象，防止意外修改，确保不可变性 |
