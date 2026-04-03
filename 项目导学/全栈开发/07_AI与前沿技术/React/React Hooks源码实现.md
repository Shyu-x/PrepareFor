# React Hooks 源码实现

## 一、Hooks 概述

### 1.1 Hooks 解决的问题

在 Hooks 出现之前，React 有几大难题：

| 问题 | 描述 | 解决方案 |
|------|------|----------|
| **状态逻辑复用** | 高阶组件导致嵌套地狱 | 自定义 Hooks |
| **复杂组件难维护** | componentDidMount 等分散 | useEffect 集中管理 |
| **类组件的 this** | this 指向问题 | 函数组件无 this |
| **难以优化** | 类组件不能很好配合 memo | 函数组件 + useMemo |

### 1.2 Hooks 的基本规则

1. **只在顶层调用 Hooks**：不要在循环、条件语句、嵌套函数中调用
2. **只在 React 函数中调用**：函数组件或自定义 Hooks 中

**规则背后的原因**：

```typescript
// Hooks 通过链表存储状态
// 每个 Hook 的位置决定了它的身份
const hooks = [useState(0), useState(1), useState(2)];
//        ↑      ↑        ↑
//       idx0   idx1     idx2
// 如果在条件语句中调用，位置会错乱
```

## 二、useState 实现

### 2.1 Hooks 数据结构

```typescript
// packages/react-reconciler/src/ReactFiberHooks.new.js

// Hook 对象结构
type Hook = {
  baseQueue: Queue | null,  // 基础队列
  queue: Queue | null,       // 待处理的队列
  baseUpdate: Update | null, // 基础更新
  next: Hook | null,         // 下一个 Hook
  memoizedState: any,        // 记忆的状态值
};

// Update 对象结构
type Update<S> = {
  expirationTime: ExpirationTime,  // 过期时间
  action: (S => S) | S,          // 更新动作
  next: Update<S> | null,         // 下一个更新
  priority?: ReactPriorityLevel,  // 优先级
};
```

### 2.2 Dispatcher 机制

React 通过 Dispatcher 将不同的 Hook 实现分发给不同的环境：

```typescript
// packages/react/src/ReactHooks.js

// 1. 入口函数
export function useState<S>(initialState: (() => S) | S): [S, Dispatch<BasicStateAction<S>>] {
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState);
}

// 2. 解析当前环境的 dispatcher
function resolveDispatcher() {
  // 根据当前环境返回不同的 dispatcher
  // 开发环境返回开发版，生产环境返回生产版
  if (__DEV__) {
    return ReactCurrentDispatcher.current;
  }
  // ...
}

// 3. 不同的 dispatcher 实现
const HooksDispatcher: Dispatcher = {
  useState: function(initialState) {
    return mountState(initialState);
  },
};

const UrgentDispatcher: Dispatcher = {
  useState: function(initialState) {
    return updateState(initialState);
  },
};
```

### 2.3 mountState 实现

首次渲染时调用 `mountState`：

```typescript
// packages/react-reconciler/src/ReactFiberHooks.new.js

function mountState<S>(
  initialState: (() => S) | S
): [S, Dispatch<BasicStateAction<S>>] {
  // 1. 创建 hook 对象
  const hook = mountWorkInProgressHook();

  // 2. 处理初始值
  if (typeof initialState === 'function') {
    initialState = initialState();
  }

  // 3. 设置初始状态
  hook.memoizedState = initialState;

  // 4. 创建 queue
  const queue = hook.queue = {
    pending: null,           // 待处理的更新
    dispatch: null,          // dispatch 函数
    lastRenderedReducer: basicStateReducer,  // 上一次使用的 reducer
    lastRenderedState: initialState,        // 上一次渲染的状态
  };

  // 5. 创建 dispatch 函数
  const dispatch = queue.dispatch = dispatchAction.bind(
    null,
    currentlyRenderingFiber,  // 绑定 fiber
    queue                    // 绑定 queue
  );

  return [hook.memoizedState, dispatch];
}

// 创建 workInProgress hook
function mountWorkInProgressHook(): Hook {
  const hook = {
    memoizedState: null,
    baseQueue: null,
    queue: null,
    baseUpdate: null,
    next: null,
  };

  // 将 hook 添加到链表末尾
  if (workInProgressHook === null) {
    // 第一个 hook
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    // 后续 hook
    workInProgressHook = workInProgressHook.next = hook;
  }

  return hook;
}
```

### 2.4 dispatchAction 实现

点击按钮触发状态更新时调用 `dispatchAction`：

```typescript
// packages/react-reconciler/src/ReactFiberHooks.new.js

function dispatchAction<S>(
  fiber: Fiber,
  queue: UpdateQueue<S>,
  action: (S => S) | S
) {
  // 1. 获取当前时间
  const currentTime = requestCurrentTime();

  // 2. 获取优先级
  const lane = requestUpdateLane();

  // 3. 创建 update 对象
  const update: Update<S> = {
    expirationTime: currentTime,
    action,
    next: null,
    priority: lane,
  };

  // 4. 将 update 加入队列
  const pending = queue.pending;
  if (pending === null) {
    // 队列为空，创建循环链表
    update.next = update;
  } else {
    // 连接到队列末尾
    update.next = pending.next;
    pending.next = update;
  }
  queue.pending = update;

  // 5. 调度更新
  scheduleUpdateOnFiber(fiber, lane);
}
```

### 2.5 updateState 实现

更新渲染时调用 `updateState`：

```typescript
// packages/react-reconciler/src/ReactFiberHooks.new.js

function updateState<S>(
  initialState: (() => S) | S
): [S, Dispatch<BasicStateAction<S>>] {
  // 1. 获取当前的 hook
  const hook = updateWorkInProgressHook();

  // 2. 获取更新队列
  const queue = hook.queue;

  // 3. 获取上次渲染的状态
  const lastRenderedReducer = queue.lastRenderedReducer;
  const lastRenderedState = queue.lastRenderedState;

  // 4. 处理队列中的更新
  const queueContext = queue.lastRenderedState;
  let baseState = hook.baseState;

  // 5. 遍历更新队列
  let update = hook.baseQueue;
  while (update !== null) {
    const action = update.action;

    // 使用 reducer 计算新状态
    baseState = lastRenderedReducer(baseState, action);

    update = update.next;
  }

  // 6. 更新记忆的状态
  hook.memoizedState = baseState;

  return [baseState, queue.dispatch];
}

// 获取 workInProgress 的 hook
function updateWorkInProgressHook(): Hook {
  // 如果有 current hook，复用其位置
  if (currentHook !== null) {
    const current = currentHook.alternate;
    if (current === null) {
      // 首次渲染
      const hook = cloneHook(currentHook);
      // ...
    } else {
      // 更新，复用 current
      workInProgressHook = currentHook;
      currentHook = currentHook.next;
      return workInProgressHook;
    }
  }

  // 新建 hook
  const hook = mountWorkInProgressHook();
  return hook;
}
```

## 三、useEffect 实现

### 3.1 Effect 对象结构

```typescript
// packages/react-reconciler/src/ReactFiberHooks.new.js

// Effect 对象结构
type Effect = {
  tag: EffectTags,           // Effect 类型标签
  create: () => (() => void) | void,  // 回调函数
  destroy: (() => void) | null,  // cleanup 函数
  deps: Array<mixed> | null,   // 依赖数组
  next: Effect,               // 下一个 effect（链表）
};

// Effect 标签
const EffectTags = {
  Passive: 0b0001,           // useEffect
  Layout: 0b0010,            // useLayoutEffect
  Update: 0b0100,            // 更新时执行
  Insertion: 0b1000,         // 插入时执行
};
```

### 3.2 mountEffect 实现

首次渲染时调用 `mountEffect`：

```typescript
// packages/react-reconciler/src/ReactFiberHooks.new.js

function mountEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | null
): void {
  // 获取当前 fiber 的 updateQueue
  const updateQueue = currentlyRenderingFiber.updateQueue;

  // 创建 effect 对象
  const effect = {
    tag: Passive,           // useEffect 的标签
    create,                 // 回调函数
    destroy: null,          // 初始为 null
    deps,                   // 依赖数组
    next: null,             // 链表指针
  };

  // 将 effect 加入链表
  let lastEffect = updateQueue.lastEffect;
  if (lastEffect === null) {
    // 第一个 effect
    updateQueue.lastEffect = effect.next = effect;
  } else {
    // 追加到链表末尾
    effect.next = lastEffect.next;
    lastEffect.next = effect;
    updateQueue.lastEffect = effect;
  }

  // 标记 fiber 包含 passive effect
  currentlyRenderingFiber.effectTag |= Update | Passive;
}
```

### 3.3 updateEffect 实现

更新渲染时调用 `updateEffect`：

```typescript
// packages/react-reconciler/src/ReactFiberHooks.new.js

function updateEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | null
): void {
  // 1. 获取当前的 effect
  const effect = updateWorkInProgressHook();

  // 2. 比较依赖是否变化
  if (areHookInputsEqual(effect.deps, deps)) {
    // 依赖没变，跳过
    return;
  }

  // 3. 依赖变了，执行 cleanup 并重新创建
  const oldDestroy = effect.destroy;
  if (oldDestroy !== null) {
    oldDestroy();  // 调用上一次的 cleanup
  }

  // 4. 创建新 effect
  effect.create = create;
  effect.deps = deps;

  // 5. 标记需要执行
  currentlyRenderingFiber.effectTag |= Update | Passive;
}

// 比较依赖是否相等
function areHookInputsEqual(
  nextDeps: Array<mixed> | null,
  prevDeps: Array<mixed> | null
): boolean {
  // 情况1：都没有依赖
  if (nextDeps === null && prevDeps === null) {
    return true;
  }

  // 情况2：只有一个有依赖
  if (nextDeps === null || prevDeps === null) {
    return false;
  }

  // 情况3：都有依赖，比较每一项
  for (let i = 0; i < nextDeps.length; i++) {
    if (!Object.is(nextDeps[i], prevDeps[i])) {
      return false;
    }
  }

  return true;
}
```

### 3.4 useEffect 执行时机

useEffect 的执行在 Commit 阶段的 Layout 阶段之后：

```typescript
// packages/react-reconciler/src/ReactFiberWorkLoop.new.js

// 调度 effect
function commitRootImpl(finishedWork) {
  // 阶段一：BeforeMutation
  commitBeforeMutationEffects(finishedWork);

  // 阶段二：Mutation
  commitMutationEffects(finishedWork);

  // 阶段三：Layout（这里执行 useLayoutEffect）
  commitLayoutEffects(finishedWork);

  // 阶段四：Passive（这里执行 useEffect）
  // 使用 scheduler 调度，在浏览器空闲时执行
  scheduleCallback(NormalPriority, () => {
    flushPassiveEffects();
  });

  return null;
}

// 执行 passive effects
function flushPassiveEffects(): boolean {
  // 1. 遍历所有 fiber
  // 2. 执行 useEffect 的 create 回调
  // 3. 保存返回的 cleanup 函数

  let effect = rootWithPendingPassiveEffects;

  while (effect !== null) {
    const create = effect.create;
    const destroy = effect.destroy;

    // 执行 create，获取 cleanup
    const cleanup = create();

    // 保存 cleanup 到 effect.destroy
    effect.destroy = cleanup;

    effect = effect.next;
  }

  return true;
}
```

### 3.5 useEffect Cleanup 原理

```typescript
// 组件卸载时的 cleanup 流程
function commitUnmount-effects(finishedWork) {
  const fiber = finishedWork;

  // 遍历所有 effect
  let effect = fiber.updateQueue?.lastEffect;

  while (effect !== null) {
    const destroy = effect.destroy;

    if (destroy !== null) {
      // 调用 cleanup 函数
      destroy();
    }

    effect = effect.next;
  }
}
```

## 四、useRef 实现

### 4.1 mountRef 实现

```typescript
// packages/react-reconciler/src/ReactFiberHooks.new.js

function mountRef<T>(initialValue: T): { current: T } {
  // 创建 hook
  const hook = mountWorkInProgressHook();

  // 创建 ref 对象
  const ref = { current: initialValue };

  // 存储到 memoizedState
  hook.memoizedState = ref;

  return ref;
}
```

### 4.2 updateRef 实现

```typescript
// packages/react-reconciler/src/ReactFiberHooks.new.js

function updateRef<T>(initialValue: T): { current: T } {
  // 获取当前的 hook
  const hook = updateWorkInProgressHook();

  // 直接返回存储的 ref
  return hook.memoizedState;
}
```

### 4.3 ref 的工作流程

```typescript
// ref 的赋值发生在 commitMutationEffects
function commitAttachRef(finishedWork: Fiber) {
  const ref = finishedWork.ref;

  if (ref !== null) {
    const instance = finishedWork.stateNode;

    // 获取 DOM 节点或组件实例
    let instanceToUse;

    switch (finishedWork.tag) {
      case HostComponent:
        instanceToUse = getPublicInstance(instance);
        break;
      default:
        instanceToUse = instance;
    }

    // 设置 ref
    if (typeof ref === 'function') {
      ref(instanceToUse);
    } else {
      ref.current = instanceToUse;
    }
  }
}
```

## 五、useCallback 和 useMemo 实现

### 5.1 mountCallback 实现

```typescript
// packages/react-reconciler/src/ReactFiberHooks.new.js

function mountCallback<T>(callback: T, deps: Array<mixed> | null): T {
  // 创建 hook
  const hook = mountWorkInProgressHook();

  // 将回调函数和依赖存储到 memoizedState
  hook.memoizedState = [callback, deps];

  return callback;
}
```

### 5.2 updateCallback 实现

```typescript
// packages/react-reconciler/src/ReactFiberHooks.new.js

function updateCallback<T>(callback: T, deps: Array<mixed> | null): T {
  // 获取当前的 hook
  const hook = updateWorkInProgressHook();

  // 获取上一次的依赖
  const prevDeps = hook.memoizedState[1];

  // 比较依赖
  if (areHookInputsEqual(deps, prevDeps)) {
    // 依赖没变，返回上一次的回调（稳定引用）
    return hook.memoizedState[0];
  }

  // 依赖变了，返回新的回调
  hook.memoizedState = [callback, deps];
  return callback;
}
```

### 5.3 mountMemo 实现

```typescript
// packages/react-reconciler/src/ReactFiberHooks.new.js

function mountMemo<T>(
  nextCreate: () => T,
  deps: Array<mixed> | null
): T {
  // 创建 hook
  const hook = mountWorkInProgressHook();

  // 计算值
  const value = nextCreate();

  // 存储 [值, 依赖]
  hook.memoizedState = [value, deps];

  return value;
}
```

### 5.4 updateMemo 实现

```typescript
// packages/react-reconciler/src/ReactFiberHooks.new.js

function updateMemo<T>(
  nextCreate: () => T,
  deps: Array<mixed> | null
): T {
  // 获取当前的 hook
  const hook = updateWorkInProgressHook();

  // 获取上一次的依赖
  const prevDeps = hook.memoizedState[1];

  // 比较依赖
  if (areHookInputsEqual(deps, prevDeps)) {
    // 依赖没变，返回缓存的值
    return hook.memoizedState[0];
  }

  // 依赖变了，重新计算
  const value = nextCreate();
  hook.memoizedState = [value, deps];

  return value;
}
```

## 六、Hooks 规则原理

### 6.1 为什么要限制在顶层

```typescript
// 错误示例：条件语句中调用 Hook
function Component({ show }) {
  // 每次渲染时，如果 show 不同，hooks 数量就不同
  if (show) {
    const [state, setState] = useState(0);  // 可能不执行
  }
  const [value, setValue] = useState(1);    // 可能位置错乱
}

// React 内部链表结构
// 第一次渲染: hooks = [hook0, hook1]
// 第二次渲染 (show=false): hooks = [hook0]  // hook1 被跳过！
// 第三次渲染 (show=true): hooks = [hook0, hook1]  // 但 hook1 是新的！
```

### 6.2 React 如何检测规则违反

```typescript
// packages/react/src/ReactHooks.js

// 开发环境下检查 Hooks 调用顺序
let hooksDidCheckHe准确性 = false;

function renderWithHooks<Props, T>(
  component: (Props) => T,
  props: Props,
  secondArg: secondArg,
): T {
  // 重置 Hooks 链表
  currentlyRenderingFiber.memoizedState = null;
  hooksDidCheckHe准确性 = false;

  // 执行组件
  const children = component(props, secondArg);

  // 检查是否所有 hooks 都被检查
  if (!hooksDidCheckHe准确性) {
    console.error('Hooks 规则被违反');
  }

  return children;
}
```

### 6.3 Fiber 上的 hooks 存储

```typescript
// Fiber 节点结构
type Fiber = {
  // ... 其他属性

  // Hooks 相关
  memoizedState: Hook | null,   // 第一个 Hook
  updateQueue: UpdateQueue | null, // 更新队列

  // ...
};
```

## 七、自定义 Hooks

### 7.1 自定义 Hook 的原理

自定义 Hook 本质上就是使用 Hooks 的函数：

```typescript
// 自定义 Hook 示例
function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

// 使用
function App() {
  const { width, height } = useWindowSize();
  return <div>{width}x{height}</div>;
}
```

### 7.2 多个自定义 Hook 共享状态

```typescript
// 共享的 store
function useCounter() {
  const [count, setCount] = useState(0);

  const increment = useCallback(() => {
    setCount(c => c + 1);
  }, []);

  const decrement = useCallback(() => {
    setCount(c => c - 1);
  }, []);

  return { count, increment, decrement };
}

// 组件中使用
function App() {
  const { count, increment, decrement } = useCounter();

  return (
    <div>
      <span>{count}</span>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  );
}
```

## 八、Hooks 与类组件对比

### 8.1 生命周期对比

| 类组件方法 | Hook 等价 |
|-----------|-----------|
| componentDidMount | useEffect(() => {}, []) |
| componentDidUpdate | useEffect(() => {}, [deps]) |
| componentWillUnmount | useEffect 返回的 cleanup |
| shouldComponentUpdate | React.memo / useMemo |
| componentDidCatch | ErrorBoundary（不支持） |

### 8.2 状态管理对比

```typescript
// 类组件
class Counter extends React.Component {
  state = { count: 0 };

  increment = () => {
    this.setState({ count: this.state.count + 1 });
  };
}

// 函数组件 + Hooks
function Counter() {
  const [count, setCount] = useState(0);

  const increment = useCallback(() => {
    setCount(c => c + 1);
  }, []);

  return (
    <div>
      <span>{count}</span>
      <button onClick={increment}>+</button>
    </div>
  );
}
```

## 九、总结

### 9.1 核心要点

1. **Dispatcher 机制**：React 通过 Dispatcher 分发不同的 Hook 实现
2. **链表存储**：Hooks 通过链表存储在 fiber.memoizedState 上
3. **updateQueue**：状态更新通过环形链表管理
4. **Effect 链表**：useEffect 通过 Effect 链表在 Commit 阶段执行
5. **依赖比较**：useEffect/useMemo/useCallback 通过 `Object.is` 比较依赖

### 9.2 后续章节预告

- **事件系统**：理解合成事件的创建和分发机制
- **Scheduler 调度机制**：深入理解 lanes 模型和时间切片
- **React Server Components**：服务端组件的实现原理
