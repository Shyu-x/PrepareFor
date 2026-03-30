# React Hooks 完全指南

## 目录
- [初识 Hooks](#1-初识-hooks)
- [useState 的使用和原理](#2-usestate-的使用和原理)
- [useEffect 的使用和原理](#3-useeffect-的使用和原理)
- [useContext 的使用](#4-usecontext-的使用)
- [useReducer 的使用](#5-usereducer-的使用)
- [useMemo 和 useCallback 的性能优化](#6-usememo-和-usecallback-的性能优化)
- [useRef 的使用](#7-useref-的使用)
- [自定义 Hooks 的创建](#8-自定义-hooks-的创建)
- [Hooks 的规则](#9-hooks-的规则)

---

## 10. React 源码实现深度解析

### 10.1 React Fiber 架构概览

React 使用 Fiber 架构作为协调渲染引擎，它管理组件树、状态更新、副作用执行等核心功能。

```
┌─────────────────────────────────────────────────────────────────┐
│                   React Fiber 核心架构                          │
├─────────────────────────────────────────────────────────────────┤
│                                                          │
│   ┌────────────┐         ┌────────────┬�          │
│ │  主线程            │   React API / 入口             │
│ │                      │  │                             │
│ │                      ▼ │    调         │     │
│ │                      │    ▼    │     │          │
│ │            ┌─────┴────┴──┐ ┌──────────┤─────┘ │
│ │            │       │         │       │         │       │
│ │            │       │         │       │         │       │
│ │            │       │         │       │         │       │
│ │ ┌─────────────────────────────────────────────────────────────────┤ │
│ │                    │                │                │                │
│ │         调度调度器   │    Scheduler         │                │
│ │                    │ 10      │                │                │          │
│ │                    │ 11      │                │                │          │
│ │                    │ 12      │                │                │          │
│ │   ┌─────────────────────────────────────────────────────────────────┤ │
```

### 10.2 FiberNode 数据结构

```typescript
// React 内部的 Fiber 节点结构
interface FiberNode {
  tag: WorkTag;              // 标识当前组件类型
  key: string | null;           // 唯一标识（用于 reconciliation）
  elementType: string | null;  // 元素类型（div、span 等）
  type: TypeofMode;           // 渲染模式（DOM、文本等）
  props: any;                  // 组件 props
  ref: any | null;               // ref 值值
  stateNode: FiberNode | null;     // 状态节点

  // Fiber 链�
  return: FiberNode | null;
  siblingIndex: number;
  index: number;
  lanes: any[];
  firstEffect: any | null;
  nextEffect: any | null;
  memoizedProps: any | null;
  memoizedState: any | null;
  alternate: FiberNode | null;
  flags: UpdateFlags;

  // 副接
  return: FiberNode | null;
}

// Hook 相关结构
type Hook = {
  memoizedState: any;      // 上一次的 state（用于比较）
  baseState: any;         // 初始 state
  baseQueue: any;        // 上一次的更新队列
  queue: any;            // 当前更新队列
  next: Hook | null;       // 指向下一个 Hook
}

// 调度优先级
const LanePriority = {
  NoLane: 0,              // 同步优先级最低
  InputContinuousLane: 1,  // 用户输入事件优先级最高
  DefaultLane: 2,          // 默认优先级
  TransitionLane: 3,      // 过渡动画优先级
  RetryLane: 4,             // 失试错误优先级
  SelectiveHydrationLane: 5, // 选择性水合优先级
  IdleLane: 6,             // 空后优先级最低
}
```

### 10.3 Hooks 在 Fiber 中的实现

React Hooks 本质上是 Fiber 节点上注册的特殊函数：

```typescript
// useState 在 Fiber 中的简化实现
type UseStateAction<S> = {
  (prevState: S) => Partial<S>
} | S;

function useState<S>(initialState: S | (() => S)) {
  // 1. 获取当前 Fiber 节点
  const currentlyRenderingFiber = getCurrentFiber();

  // 2. 创建或获取 Hook
  let hook = currentlyRenderingFiber.memoizedState;

  // 3. 如果没有 Hook，创建新的
  if (!hook) {
    hook = {
      memoizedState: null,
      baseState: initialState,
      baseQueue: null,
      queue: null,
      next: null
    };

    // 4. 将 Hook 挂�到 Fiber 节点
    currentlyRenderingFiber.memoizedState = hook;
  }

  // 5. 定义更新函数
  const setState: (action: UseStateAction<S>) => {
    // 6. 创建更新对象
    const update = {
      lane: LanePriority.DefaultLane,
      action
    };

    // 7. 调度更新
    scheduleUpdateOnFiber(currentlyRenderingFiber.root, update);
  };

  // 6. 返回 [state, setState] 数组
  return [hook.memoizedState, setState];
}

  // 7. 处理初始状态
  if (typeof initialState !== 'function') {
    hook.memoizedState = initialState;
  }

  return hook.memoizedState, setState;
}

// useEffect 在 Fiber 中的实现
type EffectCallback = () => (() => void) | void;

function useEffect(callback: EffectCallback, deps: DependencyList) {
  const currentlyRenderingFiber = getCurrentFiber();

  // 创建 effect Hook
  const effect = {
    tag: 'Effect',
    create: callback,
    deps: deps,
    destroy: callback,  // cleanup 函数
    next: null
  };

  // 将 effect 添加到副作用链表
  pushEffect(currentlyRenderingFiber, effect);
}

  return () => {
    // 清理函数
    effect.destroy = callback;
    pushEffect(currentlyRenderingFiber, { ...effect, destroy: callback });
  };
}
```

### 10.4 调度更新机制

React 使用优先级调度器来优化渲染性能：

```
┌─────────────────────────────────────────────────────────────────┐
│                React 调度更新流程                              │
├─────────────────────────────────────────────────────────────────┤
│                                                             │
│   用户调用 setState                                          │
│         │                                                     │
│              │                                                    │
│              ▼                                                    │
│              ▼                                                    │
│              ▼                                                    ▼
│              ▼                                                    ▼
│              ▼                                                    │
│              ▼                                                    │
│              ▼                                                    │
│              ▼                                                    │
│              ▼                                                    │
│              ▼                                                    │
│              ▼                                                    │
│              ▼                                                    ▼ ▼
│              ▼                                                    │
│              ▼                                                    │
│              ▼                                                    │
│              ▼                                                    │
│              ▼                                                    ▼ │
│              │                                                    ▼                                                    │
│              ▼                                                    │
│              ▼        ↓                                           │
│              │                                                    │
│         创建 Update 对象                                      │
│         ──────────────────────────────────────────────┐              │
│         │                                                     │
│         │  lane: DefaultLane                               │        │
│         │  │  action: newState                         │        │
│         │  └────────────────────────────────────────────┘              │
│              │                                                    │ │
│              │        ↓                                           │
│              │                                                    │ │
│              │     scheduleUpdateOnFiber(root, update)                  │   │
│         │                                                   │ │
│         │              │                                                    │ │
│              │        ↓                                           │
│              │     进入工作循环                              │ │ │
│         │     - 遍历 Fiber 树                              │ │ │
│ │     - 遟度执行                                    │ │ │
│ │     - 执行 setState                                 │ │ │ │
│ │     - 执行副作用                                     │ │ │ │
│ │     - 提交协调渲染                                    │ │ │ │
│     - 调度 commitRoot                                 │ │ │ │
│ │     - 更新 DOM                                       │ │ │ │
│ │              │        ↓                                           │
│              │                                                    │ │
│              │     穮           完成                             │
│              │                                                    │ │
│              │                                                    │ │
└─────────────────────────────────────────────────────────────────────────┘
```

**关键调度特性**：
- **异步不可中断**：默认优先级的更新不会被中断
- **并发控制**：通过 lanes 机制避免竞态
- **批量处理**：bailing 更新会合并处理
- **优先级管理**：过渡动画等高优先级任务优先执行

### 10.5 Hook 链表结构

每个组件的 Hook 通过链表链接在一起：

```typescript
// Hook 链表示例
interface Hook {
  memoizedState: any;
  baseState: any;
  baseQueue: any;
  queue: any;
  next: Hook | null;
}

// 偌示：组件使用 3 个 Hook
function Component() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');
  const [user, setUser] = useState(null);

  // Fiber 节点上的 Hook 链表
  // ComponentHook0
  const hook0 = getHook(0);

  // useState(count, setCount)  → Hook1
  // useEffect(...) → Hook2
  // useState(name, setName) → Hook3
  // useEffect(...) → Hook4
  // useState(user, setUser) → Hook5

  // Hook 链表结构（简化）
  hook0.next = hook1;
  hook1.next = hook2;
  hook2.next = hook3;
  hook3.next = hook4;
  hook4.next = hook5;
}

// Hook 之间的联系
hook0.queue = hook1;
hook1.queue = hook2;
// ...
```

### 10.6 性能优化原理

React 19 引入了 Fiber 后，渲染性能得到显著提升，核心优化包括：

```typescript
// 1. Key 挾复用
// 只在 key 发生变化时重新渲染
function Component({ id }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData(id).then(setData);
  }, [id]); // 依赖 key

  // id 相同时，即使 props 变化也不重新渲染
  return <div>{data}</div>;
}

// 2. 调度批处理
// React 18+ 自动批处理 setState 更新
function Counter() {
  const [count, setCount] = useState(0);

  // 连续更新会被合并为一次渲染
  const handleClick = () => {
    setCount(1);
    setCount(2); // 不会触发两次渲染
    setCount(3);
  };

  return <div onClick={handleClick}>{count}</div>;
}

// 3. 优先级调度
// 过渡动画使用更高优先级
function AnimatedBox() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  // 使用 requestAnimationFrame 的更新会获得高优先级
}
```

### 10.7 双缓冲队列

React 使用双缓冲队列来协调新旧状态的渲染：

```
┌─────────────────────────────────────────────────────────┐
│                  双缓冲队列机制                              │
├─────────────────────────────────────────────────────────┤
│                                                             │
│   当前渲染         │ 下一帧                               │           │
│   ┌─────────────────┐ ┌───────────────────┐           │
│   │   │                                              │  │
│   │  │   当前状态               │  │ 下一状态             │ │
│ │  │  ─────────────────────┐──────────────────────┐  │ ┌─────────────────────┐
│   │   │  ↑      │  │  │  │  ↑                   │  │
│ │  │  │        │  │  │  │  │                  │  │  │  │
│ │  │  │        ↓      │  │  │  │  │  │  ↑                  │ │  │  │  ↑     │
│ └─────────────────────────┘    └──────────────────────┘   └────────────┘
│                                                             │
│                                                             │
│  双缓冲队列                  │           │
│   ┌─────────────────────────────────────────────────────────┘
```

**工作流程**：
1. 请求更新时，创建新的 Fiber 树
2. 将新 Fiber 加入 workInProgress �列
3. 执行所有 workInProgress 中的更新
4. 提交变更，刷新到双缓冲区
5. 遃度切换时，清空旧的队列，显示新内容

这确保了：
- 用户始终看到最新的或之前版本
- 渲染不会中断用户交互
- 避度平滑的过渡效果
```

### 10.8 源码中的关键模式

```typescript
// 1. reconciliation 模式
// React 比较新旧 Fiber 树，只更新变化的部分
function reconcileChildren(currentFiber, nextFiber) {
  // 遍历当前节点
  while (currentFiber) {
    const nextFiber = currentFiber.sibling;

    // 比较类型和 key
    if (currentFiber.type === nextFiber.type &&
        currentFiber.key === nextFiber.key) {
      // 复用节点，只更新属性
      updateFiberProps(currentFiber, nextFiber);
      continue;
    }

    // 类型或 key 不同，需要重建节点
    reconcile(currentFiber, nextFiber);
    currentFiber = currentFiber.sibling;
  }
}

// 2. 副式更新
// 使用 commitRoot 触发完成所有更新
function commitRoot(root) {
  // 标记需要提交的更新
  // 执行所有 reconciliation
  // 应用 DOM 变更
  // 清空脏标记
}

// 3. 并发模式
// 对于大型列表，使用并发 reconciliation
function reconcileConcurrentFiber, nextFiber) {
  // 并发处理子节点
  const [child1, child2] = [nextFiber.child, nextFiber.child.sibling];

  Promise.all([
    reconcile(child1),
    reconcile(child2)
  ]);
}
```

---

### 1.1 什么是 Hooks？

**Hooks** 是 React 16.8 引入的新特性，它让你在函数组件中使用 state 和其他 React 特性，而不需要编写类组件。

```
┌─────────────────────────────────────────────────────────────┐
│                     Hooks 简介                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   useState      → 管理组件内部状态                           │
│   useEffect     → 处理副作用（数据获取、订阅等）             │
│   useContext    → 读取 Context 值                          │
│   useReducer    → 复杂状态管理                              │
│   useMemo       → 缓存计算结果                              │
│   useCallback   → 缓存函数                                  │
│   useRef        → 访问 DOM 元素/存储可变值                  │
│                                                             │
│   自定义 Hooks  → 复用状态逻辑                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 为什么需要 Hooks？

在 Hooks 出现之前，我们需要使用类组件来管理状态：

```jsx
// 类组件写法（传统）
class Counter extends React.Component {
  constructor(props) {
    super(props);
    this.state = { count: 0 };
  }

  render() {
    return (
      <div>
        <p>计数：{this.state.count}</p>
        <button onClick={() => this.setState({ count: this.state.count + 1 })}>
          +1
        </button>
      </div>
    );
  }
}
```

使用 Hooks 后的函数组件写法：

```jsx
// 函数组件 + Hooks（现代）
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>计数：{count}</p>
      <button onClick={() => setCount(count + 1)}>
        +1
      </button>
    </div>
  );
}
```

### 1.3 Hooks 的优势

| 优势 | 说明 |
|------|------|
| 更简洁 | 代码量更少，更易读 |
| 更灵活 | 逻辑复用更简单 |
| 更易测试 | 函数组件更容易测试 |
| 无需 this | 不需要处理 this 绑定问题 |
| 更优性能 | 函数组件更轻量 |

---

## 2. useState 的使用和原理

### 2.1 基本用法

```jsx
import { useState } from 'react';

function Counter() {
  // useState 返回一个数组：
  // - 第一个元素：当前状态值
  // - 第二个元素：更新状态的函数
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>计数：{count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => setCount(count - 1)}>-1</button>
    </div>
  );
}
```

### 2.2 useState 详解

```jsx
// 语法
const [state, setState] = useState(initialValue);

// initialValue 可以是任意类型
const [name, setName] = useState('张三');
const [age, setAge] = useState(25);
const [isStudent, setIsStudent] = useState(true);
const [user, setUser] = useState({ name: '张三', age: 25 });
const [items, setItems] = useState([]);
```

### 2.3 函数式更新

当新状态依赖旧状态时，使用函数形式可以避免闭包问题：

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  // ❌ 错误：依赖外部的 count
  const increment = () => {
    setCount(count + 1);  // 可能产生 bug
  };

  // ✅ 正确：使用函数式更新
  const increment = () => {
    setCount(prevCount => prevCount + 1);
  };

  // 连续更新多次
  const incrementByThree = () => {
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);
    setCount(prev => prev + 1);
  };

  return (
    <div>
      <p>计数：{count}</p>
      <button onClick={increment}>+1</button>
      <button onClick={incrementByThree}>+3</button>
    </div>
  );
}
```

### 2.4 多个状态

```jsx
function UserForm() {
  const [name, setName] = useState('');
  const [age, setAge] = useState(0);
  const [email, setEmail] = useState('');

  // 或者使用对象
  const [formData, setFormData] = useState({
    name: '',
    age: 0,
    email: ''
  });

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form>
      <input
        value={formData.name}
        onChange={(e) => updateFormData('name', e.target.value)}
      />
      <input
        value={formData.age}
        onChange={(e) => updateFormData('age', e.target.value)}
      />
    </form>
  );
}
```

### 2.5 状态初始化函数

如果初始状态计算复杂，可以传入函数：

```jsx
// ❌ 不推荐：每次渲染都会执行
const [data, setData] = useState(expensiveComputation());

// ✅ 推荐：只会在首次渲染时执行
const [data, setData] = useState(() => expensiveComputation());

// expensiveComputation 函数
function expensiveComputation() {
  // 只有首次渲染时执行
  return fetchDataFromAPI();
}
```

### 2.6 useState 原理简述

```
┌─────────────────────────────────────────────────────────────┐
│                    useState 工作原理                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   首次渲染：                                                │
│   1. React 创建组件实例                                     │
│   2. useState(initial) → 返回 [value, setValue]           │
│   3. value 存储初始值                                       │
│   4. 将 setValue 加入更新队列                               │
│                                                             │
│   状态更新：                                                │
│   1. 调用 setValue(newValue)                               │
│   2. 将组件标记为"需要重新渲染"                             │
│   3. 下次渲染时，使用 newValue 作为 value                   │
│                                                             │
│   关键点：                                                  │
│   - 每次渲染都有独立的 state 值                             │
│   - setValue 是稳定的，多次调用不会变                        │
│   - 异步更新，批量处理                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.7 useState 源码实现深入分析

根据 React 源码分析，useState 的内部实现包含以下核心数据结构：

**Hook 的结构**：
```typescript
// Hook 是挂载在组件 Fiber 结点上的 memoizedState
export type Hook = {
  memoizedState: any,      // 上一次的 state
  baseState: any,         // 当前 state
  baseUpdate: Update<any, any> | null,  // update 函数
  queue: UpdateQueue<any, any> | null,   // 用于缓存多次 action
  next: Hook | null,       // 链表，指向下一个 Hook
};
```

**核心函数实现**：

1. **mountState** - 首次渲染时调用：
```javascript
function mountState(initialState) {
  // 创建并获取当前 Hook
  const hook = mountWorkInProgressHook();

  // 如果初始值是函数，执行它（惰性初始化）
  if (typeof initialState === 'function') {
    initialState = initialState();
  }

  // 设置初始状态
  hook.memoizedState = hook.baseState = initialState;

  // 创建 queue 用于存储更新
  const queue = (hook.queue = {
    pending: null,
    dispatch: dispatchAction.bind(null, hook),
    ...
  });

  // 返回状态和 dispatch 函数
  return [hook.memoizedState, queue.dispatch];
}
```

2. **dispatchAction** - 更新状态时调用：
```javascript
function dispatchAction(fiber, queue, action) {
  // 创建更新对象
  const update = {
    action,           // 新的状态值或更新函数
    next: null,      // 指向下一个更新
    ...
  };

  // 将更新添加到队列
  const last = queue.pending;
  if (last === null) {
    update.next = update;
  } else {
    update.next = last.next;
    last.next = update;
  }

  // 标记组件需要更新
  fiber.lanes = mergeLanes(fiber.lanes, renderLanes);

  // 调度重新渲染
  scheduleUpdateOnFiber(fiber);
}
```

3. **updateState** - 重新渲染时调用：
```javascript
function updateState(initialState) {
  const hook = updateWorkInProgressHook();

  // 合并所有挂起的更新
  const queue = hook.queue;
  const pending = queue.pending;

  if (pending !== null) {
    let first = pending.next;
    let newState = hook.baseState;

    do {
      const action = first.action;
      // 如果 action 是函数，执行它；否则直接使用
      newState = typeof action === 'function'
        ? action(newState)
        : action;
      first = first.next;
    } while (first !== pending);

    // 更新状态
    hook.memoizedState = hook.baseState = newState;
  }

  return [hook.memoizedState, queue.dispatch];
}
```

**关键特性说明**：

1. **链表结构**：每个组件的 Hook 以链表形式存储在 Fiber 节点的 memoizedState 属性上，这保证了 Hook 调用顺序的一致性。

2. **批量更新**：React 18+ 支持自动批处理，多个 setState 会合并为一次重新渲染。

3. **函数式更新原理**：当传入函数时，React 会将当前的 state 作为参数传入，允许基于旧状态计算新状态。

4. **Object.is 算法**：React 使用 Object.is 进行状态比较，决定是否需要重新渲染。

```
┌─────────────────────────────────────────────────────────────┐
│              useState 更新流程图解                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   用户点击 ──▶ setState(newValue)                           │
│                    │                                        │
│                    ▼                                        │
│   创建 Update 对象 ──▶ 加入 update queue                  │
│                    │                                        │
│                    ▼                                        │
│   标记 Fiber 为 Dirty ──▶ 请求调度更新                     │
│                    │                                        │
│                    ▼                                        │
│   React 遍历 queue ──▶ 计算新 state                       │
│                    │                                        │
│                    ▼                                        │
│   hook.memoizedState = newState                           │
│                    │                                        │
│                    ▼                                        │
│   组件重新渲染 ──▶ 返回最新状态                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.7 常见错误

```jsx
function Mistakes() {
  const [count, setCount] = useState(0);

  // ❌ 错误：直接在渲染中修改 state
  // count = count + 1;  // 绝对不要这样做！

  // ❌ 错误：忘记使用 setState
  // const handleClick = () => {
  //   console.log(count + 1);  // 这不会更新 UI
  // };

  // ✅ 正确
  const handleClick = () => {
    setCount(count + 1);
  };

  return <button onClick={handleClick}>{count}</button>;
}
```

---

## 3. useEffect 的使用和原理

### 3.1 什么是副作用？

**副作用**是指那些影响组件外部世界的操作，比如：
- 数据获取（API 调用）
- 订阅（WebSocket、事件监听）
- 修改 DOM
- 设置定时器
- 记录日志

### 3.2 基本用法

```jsx
import { useEffect, useState } from 'react';

function DataFetcher() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 这个函数会在组件挂载后执行
    fetch('https://api.example.com/data')
      .then(res => res.json())
      .then(result => {
        setData(result);
        setLoading(false);
      });
  }, []);  // 空数组表示只执行一次

  if (loading) return <p>加载中...</p>;

  return <div>{data}</div>;
}
```

### 3.3 useEffect 的参数

```jsx
useEffect(() => {
  // 副作用逻辑
  return () => {
    // 清理函数（可选）
  };
}, [dependencies]);  // 依赖数组
```

#### 3.3.1 不设置依赖数组

```jsx
useEffect(() => {
  // 每次渲染后都会执行
  console.log('组件渲染了');
});
```

#### 3.3.2 空依赖数组

```jsx
useEffect(() => {
  // 只在组件挂载时执行一次
  console.log('组件挂载了');

  // 组件卸载时执行清理
  return () => {
    console.log('组件卸载了');
  };
}, []);  // 空数组
```

#### 3.3.3 有依赖项

```jsx
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 当 userId 变化时执行
    fetchUser(userId).then(setUser);
  }, [userId]);  // 依赖 userId
}
```

### 3.4 清理函数

```jsx
function Timer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);

    // 清理函数：组件卸载时清除定时器
    return () => {
      clearInterval(interval);
    };
  }, []);  // 空依赖，只设置一次

  return <p>已运行 {seconds} 秒</p>;
}
```

### 3.5 数据获取示例

```jsx
import { useState, useEffect } from 'react';

function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const response = await fetch('https://jsonplaceholder.typicode.com/users');
        if (!response.ok) throw new Error('获取失败');
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);  // 只获取一次

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误：{error}</div>;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### 3.6 订阅示例

```jsx
import { useState, useEffect } from 'react';

function OnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // 订阅在线状态
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 清理：取消订阅
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);  // 只订阅一次

  return (
    <div>
      状态：{isOnline ? '在线' : '离线'}
    </div>
  );
}
```

### 3.7 useEffect 原理简述

```
┌─────────────────────────────────────────────────────────────┐
│                    useEffect 工作原理                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   渲染流程：                                                │
│   1. 组件渲染 → 生成 UI                                     │
│   2. DOM 更新完成                                           │
│   3. 执行 useEffect（异步，不会阻塞 UI）                     │
│                                                             │
│   依赖变化时：                                              │
│   1. 先执行上次的清理函数                                    │
│   2. 执行新的 effect                                        │
│                                                             │
│   组件卸载时：                                              │
│   1. 执行清理函数                                           │
│   2. 清理订阅/定时器/取消请求                               │
│                                                             │
│   性能优化：                                                │
│   - 异步执行，不阻塞渲染                                     │
│   - 正确设置依赖，避免无限循环                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.8 常见错误和陷阱

```jsx
function CommonMistakes() {
  const [count, setCount] = useState(0);

  // ❌ 错误1：依赖数组错误，导致无限循环
  // useEffect(() => {
  //   setCount(count + 1);
  // }, [count]);  // count 变化又触发 effect

  // ✅ 正确1：使用函数式更新
  useEffect(() => {
    // 只在首次渲染时执行
    console.log('只执行一次');
  }, []);

  // ❌ 错误2：在 effect 中使用过时的 state
  // useEffect(() => {
  //   setTimeout(() => {
  //     console.log(count);  // 可能是旧值
  //   }, 1000);
  // }, []);  // 空依赖

  // ✅ 正确2：使用 ref 存储最新值
  const countRef = useRef(count);
  useEffect(() => {
    countRef.current = count;
  }, [count]);

  useEffect(() => {
    setTimeout(() => {
      console.log(countRef.current);  // 总是最新值
    }, 1000);
  }, []);

  return <div>{count}</div>;
}
```

---

## 4. useContext 的使用

### 4.1 什么是 Context？

**Context** 提供了一种在组件树中传递数据的方式，避免一层层手动传递 props。

```
┌─────────────────────────────────────────────────────────────┐
│                      Context 数据流                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    ┌─────────┐                              │
│                    │ Provider │                             │
│                    │  Theme   │                             │
│                    │  "dark"  │                             │
│                    └────┬────┘                              │
│                         │                                    │
│         ┌───────────────┼───────────────┐                   │
│         ▼               ▼               ▼                   │
│    ┌─────────┐    ┌─────────┐    ┌─────────┐              │
│    │ 组件 A   │    │  组件 B   │    │  组件 C   │              │
│    │         │    │         │    │         │              │
│    │ useTheme│    │ useTheme│    │ useTheme│              │
│    │ "dark"  │    │ "dark"  │    │ "dark"  │              │
│    └─────────┘    └─────────┘    └─────────┘              │
│                                                             │
│    数据从 Provider 流向所有消费 Context 的组件               │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 创建 Context

```jsx
// ThemeContext.js
import { createContext } from 'react';

// 创建 Context，默认为 'light'
const ThemeContext = createContext('light');

export default ThemeContext;
```

### 4.3 使用 Provider 提供值

```jsx
import ThemeContext from './ThemeContext';

function App() {
  const [theme, setTheme] = useState('dark');

  return (
    // 使用 Provider 提供值
    <ThemeContext.Provider value={theme}>
      <Header />
      <Main />
      <Footer />
    </ThemeContext.Provider>
  );
}
```

### 4.4 使用 useContext 消费值

```jsx
import { useContext } from 'react';
import ThemeContext from './ThemeContext';

function ThemedButton() {
  const theme = useContext(ThemeContext);

  return (
    <button className={`btn btn-${theme}`}>
      主题按钮
    </button>
  );
}
```

### 4.5 完整示例：主题切换

```jsx
import { createContext, useContext, useState } from 'react';

// 1. 创建 Context
const ThemeContext = createContext();

// 2. 创建 Provider 组件
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

// 3. 自定义 Hook（可选，更方便）
function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme 必须在 ThemeProvider 内使用');
  }
  return context;
}

// 4. 使用组件
function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className={theme}>
      <h1>我的网站</h1>
      <button onClick={toggleTheme}>
        切换主题
      </button>
    </header>
  );
}

function Content() {
  const { theme } = useTheme();

  return (
    <main className={theme}>
      <p>当前主题：{theme}</p>
    </main>
  );
}

// 5. 组合
function App() {
  return (
    <ThemeProvider>
      <Header />
      <Content />
    </ThemeProvider>
  );
}
```

### 4.6 多个 Context

```jsx
import { createContext, useContext, useState } from 'react';

// 创建多个 Context
const ThemeContext = createContext();
const UserContext = createContext();

function App() {
  const [theme, setTheme] = useState('light');
  const [user, setUser] = useState({ name: '张三', role: 'admin' });

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <UserContext.Provider value={user}>
        <Dashboard />
      </UserContext.Provider>
    </ThemeContext.Provider>
  );
}

function Dashboard() {
  const { theme } = useContext(ThemeContext);
  const user = useContext(UserContext);

  return (
    <div className={theme}>
      <p>欢迎，{user.name}</p>
    </div>
  );
}
```

### 4.7 Context 性能优化

```jsx
// ❌ 问题：每次 theme 变化，所有消费 ThemeContext 的组件都会重新渲染
const ThemeContext = createContext();

// ✅ 优化1：使用 memo
const ThemedButton = memo(function ThemedButton() {
  const { theme } = useContext(ThemeContext);
  return <button className={theme}>按钮</button>;
});

// ✅ 优化2：分离 Context
// 将经常变化的和不经常变化的分开
const ThemeContext = createContext();
const UserContext = createContext();
```

---

## 5. useReducer 的使用

### 5.1 什么是 Reducer？

**Reducer** 是一个函数，接收当前状态和一个 action，返回新状态。

```
┌─────────────────────────────────────────────────────────────┐
│                      Reducer 工作流程                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────────┐     ┌──────────────┐     ┌───────────┐  │
│   │   旧状态     │────▶│   Reducer    │────▶│   新状态  │  │
│   │  {count: 0}  │     │   (纯函数)   │     │ {count: 1}│  │
│   └──────────────┘     └──────────────┘     └───────────┘  │
│                                │                           │
│                                ▼                           │
│                         ┌──────────────┐                    │
│                         │    Action    │                    │
│                         │ {type: 'INC'}│                    │
│                         └──────────────┘                    │
│                                                             │
│   Reducer 规则：                                            │
│   - 必须返回新状态，不能修改原状态                          │
│   - 必须是纯函数（相同的输入，相同的输出）                   │
│   - 必须是同步的                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 基本用法

```jsx
import { useReducer } from 'react';

// 定义 reducer 函数
function counterReducer(state, action) {
  switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + 1 };
    case 'DECREMENT':
      return { count: state.count - 1 };
    case 'RESET':
      return { count: 0 };
    default:
      return state;
  }
}

function Counter() {
  const [state, dispatch] = useReducer(counterReducer, { count: 0 });

  return (
    <div>
      <p>计数：{state.count}</p>
      <button onClick={() => dispatch({ type: 'INCREMENT' })}>+1</button>
      <button onClick={() => dispatch({ type: 'DECREMENT' })}>-1</button>
      <button onClick={() => dispatch({ type: 'RESET' })}>重置</button>
    </div>
  );
}
```

### 5.3 useState vs useReducer

```jsx
// 使用 useState
function CounterWithState() {
  const [count, setCount] = useState(0);

  const increment = () => setCount(c => c + 1);
  const decrement = () => setCount(c => c - 1);

  return <div>{count}</div>;
}

// 使用 useReducer
function CounterWithReducer() {
  const [state, dispatch] = useReducer(
    (state, action) => {
      switch (action.type) {
        case 'inc': return { count: state.count + 1 };
        case 'dec': return { count: state.count - 1 };
        default: return state;
      }
    },
    { count: 0 }
  );

  return (
    <div>
      {state.count}
      <button onClick={() => dispatch({ type: 'inc' })}>+</button>
      <button onClick={() => dispatch({ type: 'dec' })}>-</button>
    </div>
  );
}
```

### 5.4 复杂表单示例

```jsx
import { useReducer } from 'react';

// 初始状态
const initialState = {
  username: '',
  email: '',
  password: '',
  errors: {},
  isSubmitting: false
};

// Reducer
function formReducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        [action.field]: action.value,
        errors: { ...state.errors, [action.field]: null }
      };
    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, ...action.errors }
      };
    case 'SET_SUBMITTING':
      return {
        ...state,
        isSubmitting: action.value
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

function RegisterForm() {
  const [state, dispatch] = useReducer(formReducer, initialState);

  const handleChange = (e) => {
    const { name, value } = e.target;
    dispatch({ type: 'SET_FIELD', field: name, value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch({ type: 'SET_SUBMITTING', value: true });

    // 模拟提交
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 验证
    const errors = {};
    if (!state.username) errors.username = '用户名不能为空';
    if (!state.email) errors.email = '邮箱不能为空';

    if (Object.keys(errors).length > 0) {
      dispatch({ type: 'SET_ERROR', errors });
      dispatch({ type: 'SET_SUBMITTING', value: false });
      return;
    }

    alert('提交成功！');
    dispatch({ type: 'SET_SUBMITTING', value: false });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          name="username"
          value={state.username}
          onChange={handleChange}
          placeholder="用户名"
        />
        {state.errors.username && <span>{state.errors.username}</span>}
      </div>
      <div>
        <input
          name="email"
          value={state.email}
          onChange={handleChange}
          placeholder="邮箱"
        />
        {state.errors.email && <span>{state.errors.email}</span>}
      </div>
      <div>
        <input
          name="password"
          type="password"
          value={state.password}
          onChange={handleChange}
          placeholder="密码"
        />
      </div>
      <button type="submit" disabled={state.isSubmitting}>
        {state.isSubmitting ? '提交中...' : '注册'}
      </button>
    </form>
  );
}
```

### 5.5 useReducer + Context（替代 Redux）

```jsx
import { createContext, useContext, useReducer } from 'react';

// 创建 Context
const StoreContext = createContext();

// Provider 组件
function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
}

// 自定义 Hook
function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore 必须在 StoreProvider 内使用');
  }
  return context;
}

// 使用
function Counter() {
  const { state, dispatch } = useStore();

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: 'INC' })}>+</button>
    </div>
  );
}
```

---

## 6. useMemo 和 useCallback 的性能优化

### 6.1 为什么要优化？

在 React 中，父组件重新渲染时，子组件默认也会重新渲染。

```
┌─────────────────────────────────────────────────────────────┐
│                    组件重新渲染问题                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   父组件渲染                                                │
│        │                                                    │
│        ▼                                                    │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐                     │
│   │ 子组件1 │  │ 子组件2 │  │ 子组件3 │                     │
│   │ (需要)  │  │ (不需要)│  │ (需要)  │                     │
│   └─────────┘  └─────────┘  └─────────┘                     │
│                                                             │
│   问题：不必要的重新渲染会降低性能                           │
│   解决：useMemo 和 useCallback                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 useMemo - 缓存计算结果

```jsx
import { useMemo } from 'react';

function ExpensiveComponent({ list, filter }) {
  // ❌ 每次渲染都会重新计算
  const filteredList = list.filter(item =>
    item.name.includes(filter)
  );

  // ✅ 只有 list 或 filter 变化时才重新计算
  const filteredList = useMemo(() => {
    console.log('计算中...');  // 只在依赖变化时执行
    return list.filter(item =>
      item.name.includes(filter)
    );
  }, [list, filter]);

  return (
    <ul>
      {filteredList.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

### 6.3 useCallback - 缓存函数

```jsx
import { useCallback } from 'react';

function Parent() {
  const [count, setCount] = useState(0);

  // ❌ 每次渲染都会创建新函数
  const handleClick = () => {
    console.log('clicked');
  };

  // ✅ 只有依赖变化时才创建新函数
  const handleClick = useCallback(() => {
    console.log('clicked', count);
  }, [count]);

  return <Child onClick={handleClick} />;
}

function Child({ onClick }) {
  return <button onClick={onClick}>点击</button>;
}
```

### 6.4 使用场景

#### 6.4.1 场景1：传递给子组件的函数

```jsx
function Parent() {
  const [query, setQuery] = useState('');

  // ❌ 问题：每次 query 变化，handleSearch 都是新函数
  // 导致 SearchResults 不必要地重新渲染
  const handleSearch = () => {
    console.log('搜索:', query);
  };

  // ✅ 解决：使用 useCallback
  const handleSearch = useCallback(() => {
    console.log('搜索:', query);
  }, [query]);

  return (
    <div>
      <SearchBox onSearch={handleSearch} />
    </div>
  );
}
```

#### 6.4.2 场景2：依赖对象/数组

```jsx
function Component({ items }) {
  const [filter, setFilter] = useState('');

  // ❌ 每次渲染 options 都是新对象
  const options = {
    threshold: 0.5,
    rootMargin: '10px'
  };

  // ✅ 使用 useMemo 缓存
  const options = useMemo(() => ({
    threshold: 0.5,
    rootMargin: '10px'
  }), []);  // 空依赖，不会变化
}
```

#### 6.4.3 场景3：复杂计算

```jsx
function SearchResults({ products, category }) {
  // 昂贵计算
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => p.category === category)
      .sort((a, b) => b.price - a.price)
      .map(p => ({
        ...p,
        discountPrice: p.price * 0.9
      }));
  }, [products, category]);

  return (
    <ul>
      {filteredProducts.map(p => (
        <li key={p.id}>{p.name} - ¥{p.discountPrice}</li>
      ))}
    </ul>
  );
}
```

### 6.5 不要过度优化

```jsx
function Component({ a, b }) {
  // ❌ 过度优化：简单的计算不需要 useMemo
  // useMemo 的记忆本身也有开销
  const sum = useMemo(() => a + b, [a, b]);

  // ✅ 只有复杂计算才需要 useMemo
  const expensive = useMemo(() => computeExpensive(a, b), [a, b]);

  // ❌ 过度优化：简单函数不需要 useCallback
  const handleClick = useCallback(() => console.log('x'), []);

  // ✅ 传递给子组件的函数需要 useCallback
  const handleCallback = useCallback(() => {
    doSomething(a);
  }, [a]);
}
```

---

## 7. useRef 的使用

### 7.1 什么是 Ref？

**Ref** 是 React 提供的一种访问 DOM 元素或存储可变值的方式。

```
┌─────────────────────────────────────────────────────────────┐
│                       useRef 用途                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   1. 访问 DOM 元素                                          │
│      - 获取 input 的焦点                                    │
│      - 获取元素尺寸/位置                                    │
│      - 调用元素方法                                         │
│                                                             │
│   2. 存储可变值                                             │
│      - 不触发重新渲染的值                                   │
│      - 跨渲染存储数据                                       │
│      - 保存定时器 ID                                        │
│                                                             │
│   特性：                                                    │
│   - 修改 ref.current 不会触发重新渲染                       │
│   - ref 对象在每次渲染时保持不变                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 访问 DOM 元素

```jsx
import { useRef } from 'react';

function FocusInput() {
  const inputRef = useRef(null);

  const handleFocus = () => {
    // 访问 DOM 元素
    inputRef.current.focus();
  };

  return (
    <div>
      <input ref={inputRef} type="text" />
      <button onClick={handleFocus}>聚焦输入框</button>
    </div>
  );
}
```

### 7.3 完整示例：视频播放器

```jsx
import { useRef, useState } from 'react';

function VideoPlayer() {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (e) => {
    if (videoRef.current) {
      videoRef.current.volume = e.target.value;
    }
  };

  return (
    <div>
      <video
        ref={videoRef}
        src="https://www.w3schools.com/html/mov_bbb.mp4"
        width="400"
      />
      <div>
        <button onClick={togglePlay}>
          {isPlaying ? '暂停' : '播放'}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          onChange={handleVolumeChange}
        />
      </div>
    </div>
  );
}
```

### 7.4 存储可变值

```jsx
import { useRef, useEffect } from 'react';

function Timer() {
  const countRef = useRef(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      countRef.current += 1;
      setDisplay(countRef.current);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // countRef.current 的变化不会触发重新渲染
  // 只有 setDisplay 会触发
  return <div>计数：{display}</div>;
}
```

### 7.5 记录上一次的值

```jsx
import { useRef, useEffect } from 'react';

function PreviousValue() {
  const [count, setCount] = useState(0);
  const prevCountRef = useRef();

  useEffect(() => {
    // 每次渲染后，将当前值保存为"上一次"的值
    prevCountRef.current = count;
  }, [count]);

  const prevCount = prevCountRef.current;

  return (
    <div>
      <p>当前值：{count}</p>
      <p>上一次的值：{prevCount}</p>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
    </div>
  );
}
```

### 7.6 避免闭包问题

```jsx
import { useRef, useState, useEffect } from 'react';

function DelayedMessage() {
  const [message, setMessage] = useState('');
  const messageRef = useRef(message);

  // 保持 ref 与 state 同步
  useEffect(() => {
    messageRef.current = message;
  }, [message]);

  useEffect(() => {
    const timer = setTimeout(() => {
      // 使用 ref 获取最新值，避免闭包问题
      console.log('消息:', messageRef.current);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
    </div>
  );
}
```

### 7.7 ref 回调

```jsx
function CallbackRef() {
  const elementRef = useRef(null);

  const callbackRef = (node) => {
    if (node) {
      // 节点挂载后
      node.style.backgroundColor = 'blue';
    }
  };

  return <div ref={callbackRef}>内容</div>;
}
```

---

## 8. 自定义 Hooks 的创建

### 8.1 什么是自定义 Hooks？

**自定义 Hooks** 是一个函数，使用 React Hooks 构建，用于复用状态逻辑。

```
┌─────────────────────────────────────────────────────────────┐
│                    自定义 Hooks 简介                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   规则：                                                    │
│   - 函数名以 "use" 开头                                    │
│   - 内部可以使用其他 Hooks                                 │
│   - 返回值可以是任意类型                                    │
│                                                             │
│   优势：                                                    │
│   - 复用状态逻辑                                            │
│   - 代码组织更清晰                                          │
│   - 易于测试                                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 示例：useLocalStorage

```jsx
import { useState, useEffect } from 'react';

// 自定义 Hook：监听 localStorage
function useLocalStorage(key, initialValue) {
  // 从 localStorage 读取值
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  // 监听变化，保存到 localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

// 使用
function App() {
  const [name, setName] = useLocalStorage('name', '张三');

  return (
    <input
      value={name}
      onChange={(e) => setName(e.target.value)}
    />
  );
}
```

### 8.3 示例：useFetch

```jsx
import { useState, useEffect } from 'react';

// 自定义 Hook：数据获取
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('网络错误');
        }

        const json = await response.json();

        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    // 清理函数
    return () => {
      cancelled = true;
    };
  }, [url]);

  return { data, loading, error };
}

// 使用
function UserList() {
  const { data, loading, error } = useFetch(
    'https://jsonplaceholder.typicode.com/users'
  );

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误：{error}</div>;

  return (
    <ul>
      {data?.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### 8.4 示例：useDebounce

```jsx
import { useState, useEffect } from 'react';

// 自定义 Hook：防抖
function useDebounce(value, delay = 500) {
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

// 使用
function SearchBox() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    // 这里使用 debouncedQuery 搜索
    console.log('搜索:', debouncedQuery);
  }, [debouncedQuery]);

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="搜索..."
    />
  );
}
```

### 8.5 示例：useOnClickOutside

```jsx
import { useEffect, useRef } from 'react';

// 自定义 Hook：点击外部关闭
function useOnClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      // 如果点击在 ref 内部，不处理
      if (!ref.current || ref.current.contains(event.target)) {
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
function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef(null);

  useOnClickOutside(modalRef, onClose);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div ref={modalRef} className="modal-content">
        {children}
      </div>
    </div>
  );
}
```

### 8.6 示例：useToggle

```jsx
import { useState, useCallback } from 'react';

// 自定义 Hook：切换布尔值
function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue(v => !v);
  }, []);

  return [value, toggle, setValue];
}

// 使用
function App() {
  const [isOn, toggleIsOn, setIsOn] = useToggle();

  return (
    <div>
      <p>状态：{isOn ? '开' : '关'}</p>
      <button onClick={toggleIsOn}>切换</button>
      <button onClick={() => setIsOn(true)}>打开</button>
      <button onClick={() => setIsOn(false)}>关闭</button>
    </div>
  );
}
```

---

## 9. Hooks 的规则

### 9.1 规则一：只在顶层调用 Hooks

```jsx
// ❌ 错误：在条件语句中调用 Hook
function ConditionalHook() {
  const [name, setName] = useState('张三');

  if (condition) {
    const [age, setAge] = useState(25);  // 错误！
  }

  // ...
}

// ✅ 正确：始终在顶层调用
function CorrectHook() {
  const [name, setName] = useState('张三');
  const [age, setAge] = useState(25);  // 始终在顶层

  if (condition) {
    // 可以在条件语句中使用 Hook 的值
    // 但不能调用 Hook
  }

  // ...
}
```

### 9.2 规则二：只在 React 函数中调用 Hooks

```jsx
// ❌ 错误：在普通函数中调用
function normalFunction() {
  const [count, setCount] = useState(0);  // 错误！
}

// ❌ 错误：在类组件中调用
class MyComponent extends React.Component {
  render() {
    const [count, setCount] = useState(0);  // 错误！
    return <div>{count}</div>;
  }
}

// ✅ 正确：在函数组件中调用
function MyComponent() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}

// ✅ 正确：在自定义 Hooks 中调用
function useMyHook() {
  const [count, setCount] = useState(0);
  return [count, setCount];
}
```

### 9.3 ESLint 插件

项目通常使用 eslint-plugin-react-hooks 来强制执行这些规则：

```bash
npm install eslint-plugin-react-hooks --save-dev
```

```javascript
// .eslintrc.js
module.exports = {
  plugins: ['react-hooks'],
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn'
  }
};
```

### 9.4 exhaustive-deps 规则

这个规则帮助确保 useEffect 的依赖数组是完整的：

```jsx
function Component() {
  const [count, setCount] = useState(0);

  // ❌ 警告：使用了 count 但没有在依赖数组中
  useEffect(() => {
    console.log(count);
  }, []);  // 应该包含 count

  // ✅ 正确
  useEffect(() => {
    console.log(count);
  }, [count]);

  // ✅ 也正确：如果不需要依赖
  useEffect(() => {
    console.log('只执行一次');
  }, []);
}
```

### 9.5 Hooks 调用顺序的重要性

```
┌─────────────────────────────────────────────────────────────┐
│                    Hooks 调用顺序                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   首次渲染：                                                │
│   useState(0)  → state[0]                                  │
│   useState(1)  → state[1]                                  │
│   useEffect()  → effect[0]                                 │
│   useEffect()  → effect[1]                                 │
│                                                             │
│   第二次渲染：                                              │
│   useState(0)  → state[0]  ← 必须对应之前的顺序！          │
│   useState(1)  → state[1]                                  │
│   useEffect()  → effect[0]                                 │
│   useEffect()  → effect[1]                                 │
│                                                             │
│   如果 Hooks 顺序改变，React 会混淆！                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 总结

本教程详细介绍了 React Hooks 的核心内容：

| Hook | 用途 | 关键点 |
|------|------|--------|
| useState | 管理组件状态 | 函数式更新、初始值延迟计算 |
| useEffect | 处理副作用 | 依赖数组、清理函数 |
| useContext | 读取 Context | 避免不必要的重新渲染 |
| useReducer | 复杂状态管理 | 纯函数、action |
| useMemo | 缓存计算结果 | 依赖变化才重新计算 |
| useCallback | 缓存函数 | 传递给子组件时使用 |
| useRef | 访问 DOM/存储值 | 不触发重新渲染 |
| 自定义 Hooks | 复用逻辑 | 以 use 开头 |

Hooks 是现代 React 开发的核心，熟练掌握它们对于成为 React 开发者至关重要！

---

## 下一步学习

- [03_Zustand状态管理](./03_Zustand状态管理.md) - 学习状态管理
- [04_SWR数据获取](./04_SWR数据获取.md) - 学习数据获取
