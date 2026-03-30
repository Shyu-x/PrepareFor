# React Fiber 架构深度解析

## 一、Fiber 的诞生背景

### 1.1 传统递归渲染的问题

在 React 15 及更早版本中，React 使用的是**栈协调器（Stack Reconciler）**：

```javascript
// React 15 渲染流程（伪代码）
function reconcile(element, dom) {
  // 渲染过程是同步且不可中断的
  // 一旦开始执行，就必须等整个组件树渲染完成
  const child = createChild(element);
  const domNode = createDomNode(child);
  dom.appendChild(domNode);
  return child;
}
```

**核心问题：**

| 问题 | 描述 | 影响 |
|------|------|------|
| **同步阻塞** | 渲染过程是同步且不可中断的 | 页面卡顿、动画掉帧 |
| **主线程占用** | 如果组件树非常大，主线程会被长时间占用 | 用户交互无法响应 |
| **无法优先级调度** | 所有更新被视为同等优先级 | 紧急更新无法优先处理 |
| **时间片无法利用** | 无法将工作分散到多个帧 | 页面加载慢 |

### 1.2 Fiber 的诞生

React 团队在 v16 版本重写了协调器，引入了 **Fiber 架构**，经历了约 2 年的开发。

**Fiber 核心目标：**

1. **可中断渲染** - 把可中断的工作拆分成小任务
2. **优先级调度** - 对正在做的工作调整优先次序、重做、复用上次成果
3. **增量渲染** - 在父子任务之间从容切换（yield back and forth）
4. **支持并发** - 为 Suspense、Transition 等特性提供底层支持

### 1.3 Fiber 架构优势

```javascript
// Fiber 架构下的工作流程
function workLoop() {
  // 每次只处理一个 Fiber 节点
  while (nextUnitOfWork) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    // 支持中断和恢复
    if (shouldYield()) {
      break; // 让出主线程
    }
  }
}
```

**关键改进：**

- **小任务单元**：每个 Fiber 节点是一个独立的工作单元
- **可中断**：浏览器可以让出主线程，执行更高优先级任务
- **双缓冲**：实现平滑的更新，避免闪烁

---

## 二、Fiber 链表结构

### 2.1 三指针结构

每个 Fiber 节点通过 **child**、**sibling**、**return** 三个指针形成链表树结构：

```javascript
// packages/react-reconciler/src/ReactFiber.new.js (约 180 行)
function FiberNode(
  tag: WorkTag,
  pendingProps: mixed,
  key: null | string,
  mode: TypeOfMode,
) {
  // === 链表指针 ===
  this.return = null;      // 指向父 Fiber 节点
  this.child = null;       // 指向第一个子节点
  this.sibling = null;    // 指向下一个兄弟节点
  this.index = 0;         // 在父节点children中的索引
}
```

**指针关系图：**

```
┌─────────────────────────────────────────────────────────────────┐
│                         Fiber 树结构                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   App (return: null)                                             │
│   ├── child ──→ <div>                                            │
│   │              │                                               │
│   │              ├── child ──→ <h1> "Title"</h1>                │
│   │              │              │                               │
│   │              │              sibling ──→ <p> "Content"</p>   │
│   │              │                                               │
│   │              └── sibling (null)                              │
│   │                                                               │
│   └── sibling ──→ <Header />  ──→ child ──→ <nav>                │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**遍历规则：**

1. **深度优先**：先遍历 child，再遍历 sibling
2. **子节点优先**：处理完所有子节点后，才返回父节点
3. **循环链表**：子节点处理完后，通过 return 回溯到父节点

### 2.2 WorkTag 类型定义

```javascript
// packages/react-reconciler/src/ReactWorkTags.js
export const FunctionComponent = 0;           // 函数组件
export const ClassComponent = 1;              // 类组件
export const IndeterminateComponent = 2;      // 未知组件（首次渲染时）
export const HostRoot = 3;                    // 根容器
export const HostPortal = 4;                  // Portal
export const HostComponent = 5;               // 原生 DOM 节点（如 <div>）
export const HostText = 6;                    // 纯文本节点
export const Fragment = 7;                     // Fragment
export const Mode = 8;                        // <StrictMode>
export const ContextConsumer = 9;              // Context 消费者
export const ContextProvider = 10;              // Context 提供者
export const ForwardRef = 11;                 // React.forwardRef
export const Profiler = 12;                   // Profiler
export const SuspenseComponent = 13;           // Suspense
export const MemoComponent = 14;               // React.memo 包装的组件
export const SimpleMemoComponent = 15;        // 简单 memo 组件
export const LazyComponent = 16;              // React.lazy
export const IncompleteClassComponent = 17;    // 未完成注册的类组件
export const DehydratedFragment = 18;          // 脱水 Fragment
export const SuspenseListComponent = 19;       // SuspenseList
export const ScopeComponent = 21;             // 作用域组件
export const OffscreenComponent = 22;          // Offscreen 组件
export const LegacyHiddenComponent = 23;       // LegacyHidden
export const CacheComponent = 24;             // Cache 组件
```

### 2.3 Fiber 数据结构详解

```javascript
// packages/react-reconciler/src/ReactInternalTypes.js (约 300 行)
export type Fiber = {
  // === 标识与类型 ===
  tag: WorkTag,                           // Fiber 节点类型
  key: null | string,                     // 列表渲染时的 key
  elementType: any,                       // 元素类型（如组件函数）
  type: any,                              // 同 elementType，用于判断如何创建

  // === 链表指针 ===
  return: Fiber | null,                   // 父 Fiber 节点
  child: Fiber | null,                    // 第一个子节点
  sibling: Fiber | null,                  // 下一个兄弟节点
  index: number,                          // 在 siblings 中的索引

  // === DOM 相关 ===
  stateNode: any,                         // 关联的 DOM 节点或组件实例

  // === 状态与属性 ===
  pendingProps: mixed,                    // 即将应用的 props
  memoizedProps: mixed,                   // 上次渲染使用的 props
  memoizedState: any,                      // 上次渲染的 state

  // === 更新队列 ===
  updateQueue: mixed,                     // 更新队列

  // === 优先级与调度 ===
  lanes: Lanes,                          // 当前节点的优先级车道
  childLanes: Lanes,                     // 子节点的优先级车道
  alternate: Fiber | null,                 // 双缓冲：另一棵树中的对应节点

  // === 副作用 ===
  flags: Flags,                           // 副作用标志
  subtreeFlags: Flags,                     // 子树副作用标志
  deletions: Array<Fiber> | null,          // 待删除的子节点

  // === 引用 ===
  ref: Ref | null,                        // ref 引用

  // === 性能分析 ===
  actualDuration?: number,                // 实际渲染耗时
  actualStartTime?: number,               // 开始时间
  selfBaseDuration?: number,              // 自身渲染耗时
  treeBaseDuration?: number,              // 树渲染耗时
};
```

---

## 三、工作单元（Work Unit）

### 3.1 pendingProps 与 memoizedProps

```javascript
// packages/react-reconciler/src/ReactFiber.new.js (约 350 行)
function FiberNode(
  tag: WorkTag,
  pendingProps: mixed,
  key: null | string,
  mode: TypeOfMode,
) {
  // === 属性状态 ===

  // pendingProps：即将从 React 元素传入的 props（输入）
  // 在 beginWork 阶段从新传入的 props
  this.pendingProps = pendingProps;

  // memoizedProps：上次渲染时使用的 props（输出）
  // 在 completeWork 阶段被设置，用于比较是否有变化
  this.memoizedProps = null;

  // memoizedState：上次渲染后的状态
  this.memoizedState = null;
}
```

**流转过程：**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Props 流转过程                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  JSX 元素          beginWork            completeWork             │
│  <App prop={1}> ───────────→ Fiber.pendingProps ───────────→   │
│                                       Fiber.memoizedProps       │
│                                                                  │
│  【输入阶段】                      【输出阶段】                    │
│  新传入的 props                   上次渲染使用的 props             │
│  用于计算更新                     用于判断是否需要更新              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Props 比较逻辑：**

```javascript
// packages/react-reconciler/src/ReactFiberBeginWork.new.js
function updateClassComponent(current, workInProgress, Component, nextProps) {
  // 获取上次渲染的 props
  const memoizedProps = workInProgress.memoizedProps;

  // 比较新旧 props
  if (shallowEqual(nextProps, memoizedProps)) {
    // props 没变，跳过子节点渲染
    return bailoutOnAlreadyFinishedWork(current, workInProgress);
  }
}
```

### 3.2 stateNode 与 refs

```javascript
// stateNode：关联的 DOM 节点或组件实例
// packages/react-reconciler/src/ReactFiber.new.js (约 200 行)
this.stateNode = null;  // 初始化

// 不同类型 Fiber 的 stateNode：
// - HostComponent (<div>): DOM 节点
// - ClassComponent: 组件实例
// - HostRoot: FiberRootNode
// - FunctionComponent: null
```

**stateNode 使用示例：**

```javascript
// HostComponent 的 stateNode 是 DOM 节点
function updateHostComponent(current, workInProgress) {
  const stateNode = workInProgress.stateNode;
  // stateNode 是真实的 DOM 节点
  const domElement = stateNode;

  // 可以直接操作 DOM
  domElement.setAttribute('class', newProps.className);
}

// ClassComponent 的 stateNode 是组件实例
function finishClassComponent(current, workInProgress) {
  const instance = workInProgress.stateNode;

  // 可以调用实例方法
  instance.render();
}
```

**ref 处理流程：**

```javascript
// packages/react-reconciler/src/ReactFiberRef.js
export const Ref = {
  // 创建 ref
  createRef: function() {
    return { current: null };
  },

  // 附加 ref
  attachRef: function(fiber, ref) {
    if (ref !== null) {
      ref.current = fiber.stateNode;
    }
  },

  // 分离 ref
  detachRef: function(fiber) {
    const ref = fiber.ref;
    if (ref !== null) {
      ref.current = null;
    }
  },
};
```

### 3.3 effectTag 与 flags

```javascript
// packages/react-reconciler/src/ReactFiberFlags.js
export const NoFlags = 0b000000000000;        // 无副作用

//  Placement：插入节点
export const Placement = 0b000000000001;

// Update：更新节点
export const Update = 0b000000000010;

// Deletion：删除节点
export const Deletion = 0b000000000100;

// ContentReset：内容重置
export const ContentReset = 0b000000001000;

// Callback：回调
export const Callback = 0b000000010000;

// DidCapture：捕获错误
export const DidCapture = 0b000000100000;

// RefCleanup：清理 ref
export const RefCleanup = 0b000001000000;

// Visibility：可见性
export const Visibility = 0b000010000000;

// StoreConsistency：存储一致性
export const StoreConsistency = 0b000100000000;
```

**flags 使用示例：**

```javascript
// packages/react-reconciler/src/ReactFiberCompleteWork.new.js (约 500 行)
function completeWork(current, workInProgress) {
  const newProps = workInProgress.pendingProps;

  switch (workInProgress.tag) {
    case HostComponent: {
      if (current && workInProgress.stateNode) {
        // 更新现有 DOM
        updateHostComponent(current, workInProgress);

        // 检查 ref 是否有变化
        if (current.ref !== workInProgress.ref) {
          // 添加 Update 标志
          workInProgress.flags |= Update;
        }
      } else {
        // 首次渲染，创建新 DOM
        const domNode = createInstance(workInProgress.type);
        appendAllChildren(domNode, workInProgress);

        // 添加 Placement 标志
        workInProgress.flags |= Placement;
        workInProgress.stateNode = domNode;
      }
      break;
    }
  }
}
```

**副作用执行顺序：**

```javascript
// packages/react-reconciler/src/ReactFiberWorkLoop.new.js (约 800 行)
function commitRootImpl(root) {
  // 1. 提交所有 deletion（先删除）
  commitDeletion(root);

  // 2. 提交所有 placement（插入）
  commitPlacement();

  // 3. 提交所有 update（更新）
  commitUpdate();

  // 4. 提交所有 ref（引用）
  commitRefs();
}
```

---

## 四、调度机制

### 4.1 Scheduler 与 Lane 模型

React 17+ 引入的 **Lane 模型**（车道模型）用于管理更新优先级：

```javascript
// packages/react-reconciler/src/ReactFiberLane.js
export const TotalLanes = 31;

export const NoLanes: Lanes = 0;
export const NoLane: Lane = 0;

// 同步优先级
export const SyncLane: Lane = 0b0000000000000000000000000000001;
export const InputContinuousLane: Lane = 0b0000000000000000000000000001000;

// 连续优先级（拖拽、动画）
export const DefaultLane: Lane = 0b0000000000000000000000000100000;

// 空闲优先级
export const IdleLane: Lane = 0b0100000000000000000000000000000;

// 过渡优先级
export const TransitionLane1: Lane = 0b0000000000000000010000000000000;
export const TransitionLane2: Lane = 0b0000000000000000100000000000000;
export const TransitionLane3: Lane = 0b0000000000000001000000000000000;
```

**Lane 模型优势：**

1. **位运算高效**：使用单一数字表示多个车道
2. **精确区分**：可以区分不同优先级的更新
3. **批量合并**：多个同优先级更新可以合并

**位运算示例：**

```javascript
// 合并车道
export function mergeLanes(a: Lanes, b: Lanes): Lanes {
  return a | b;
}

// 判断是否包含某车道
export function hasLanes(a: Lanes, b: Lanes): boolean {
  return (a & b) !== NoLanes;
}

// 提取最高优先级车道
export function getHighestPriorityLane(lanes: Lanes): Lane {
  return lanes & -lanes;  // 获取最低位的 1
}
```

### 4.2 优先级与过期时间

```javascript
// packages/react-reconciler/src/ReactFiberLane.js
// 过期时间计算
export function computeExpirationTime(currentTime, lane) {
  // 高优先级：立即过期
  if (lane === SyncLane) {
    return currentTime + 1;
  }

  // 连续优先级：短时间内过期
  if (lane === InputContinuousLane) {
    return currentTime + 250;
  }

  // 默认优先级：较长时间
  if (lane === DefaultLane) {
    return currentTime + 5000;
  }

  // 过渡优先级：更长
  if (lane >= TransitionLane1 && lane <= TransitionLane18) {
    return currentTime + 10000;
  }

  // 空闲优先级：永不超时
  return NoTimestamp;
}
```

**优先级等级（从高到低）：**

```
┌─────────────────────────────────────────────────────────────────┐
│                     Lane 优先级等级                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SyncLane           ████████████████████████████ 最高优先级     │
│  InputContinuous    ████████████████            用户输入/拖拽    │
│  DefaultLane        ████████                     常规更新        │
│  TransitionLane     ████                          过渡/Suspense  │
│  IdleLane          ██                             空闲时执行      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 时间切片原理

```javascript
// packages/scheduler/src/Scheduler.js (约 200 行)
function workLoop() {
  // 每次循环检查是否应该让出主线程
  while (nextUnitOfWork !== null) {
    if (shouldYieldToHost()) {
      // 让出主线程，等待下次调度
      break;
    }
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }
}

// 检查是否应该让出
function shouldYieldToHost() {
  // 使用 MessageChannel 或 setTimeout 实现
  if (
    // 当前时间超过预算
    getCurrentTime() >= deadline ||
    // 有更高优先级任务
    schedulerIsScheduled
  ) {
    return true;
  }
  return false;
}
```

**帧时间预算：**

```javascript
// packages/scheduler/src/Scheduler.js
// 浏览器每帧约 16.67ms（60fps）
// React 使用 5ms 作为时间片预算
const frameInterval = 5; // 毫秒
const frameDeadline = 0;

function requestHostCallback(callback) {
  // 使用 MessageChannel 调度
  channel.port1.onmessage = callback;
  channel.port2.postMessage(null);
}
```

**时间切片流程：**

```
┌─────────────────────────────────────────────────────────────────┐
│                    时间切片执行流程                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  帧 1 (16.67ms)                                                 │
│  ┌──────────────────────────────────────────┐                   │
│  │ [处理 Fiber 1] [处理 Fiber 2] [让出]     │ ← 5ms 预算        │
│  └──────────────────────────────────────────┘                   │
│                                                ↑                │
│                                                │ 恢复继续        │
│  帧 2 (16.67ms)                                 │                 │
│  ┌──────────────────────────────────────────┐ │                 │
│  │ [处理 Fiber 3] [处理 Fiber 4] [让出]     │─┘                 │
│  └──────────────────────────────────────────┘                   │
│                                                                  │
│  高优先级任务可随时抢占                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**调度器主循环：**

```javascript
// packages/scheduler/src/Scheduler.js (约 300 行)
function flushWork() {
  const currentTime = getCurrentTime();

  // 重置帧截止时间
  frameDeadline = currentTime + frameInterval;

  let needsYields = false;

  while (advanceTimers(currentTime)) {
    // 处理定时器
  }

  // 执行工作
  const callback = workQueue.shift();
  if (callback) {
    const continuation = callback.callback();

    if (typeof continuation === 'function') {
      // 任务被暂停，放回队列
      workQueue.push(continuation);
    }

    // 检查是否需要让出
    if (currentTime >= frameDeadline) {
      needsYields = true;
    }
  }

  return needsYields;
}
```

---

## 五、Fiber 树构建

### 5.1 双缓冲技术

**核心概念：**

- **current 树**：当前屏幕上显示的 Fiber 树（已提交）
- **workInProgress 树**：在内存中构建的新 Fiber 树（构建中）

```javascript
// packages/react-reconciler/src/ReactFiberRoot.js (约 100 行)
function createHostRootFiber() {
  return FiberNode({
    tag: HostRoot,
    // ...
  });
}

function FiberRootNode(containerInfo) {
  this.current = createHostRootFiber();  // current 指向根 Fiber
  this.pendingLanes = NoLanes;
  this.finishedWork = null;
  this.timeoutMs = -1;
}
```

**双缓冲切换：**

```javascript
// packages/react-reconciler/src/ReactFiberWorkLoop.new.js (约 1100 行)
function commitRootImpl(root) {
  const finishedWork = root.finishedWork;

  // 1. 双缓冲切换
  root.current = finishedWork;  // workInProgress 变为 current

  // 2. 清空指针
  root.finishedWork = null;
}
```

### 5.2 current 与 workInProgress

```javascript
// Fiber 节点上的 alternate 指针
// packages/react-reconciler/src/ReactFiber.new.js (约 180 行)
function FiberNode() {
  // alternate 指向另一棵树中的对应节点
  this.alternate = null;
}

// 创建 workInProgress
function createWorkInProgress(current, pendingProps) {
  let workInProgress = current.alternate;

  if (workInProgress === null) {
    // 首次创建 workInProgress
    workInProgress = new FiberNode();
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    // 复用现有 workInProgress
    workInProgress.pendingProps = pendingProps;
    workInProgress.flags = NoFlags;
    workInProgress.subtreeFlags = NoFlags;
    workInProgress.deletions = null;
  }

  return workInProgress;
}
```

**双缓冲切换图：**

```
┌─────────────────────────────────────────────────────────────────┐
│                    双缓冲切换过程                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  【渲染前】                                                       │
│                                                                  │
│  current tree                 workInProgress tree                 │
│  ┌─────────┐                ┌─────────┐                        │
│  │ Root    │◄───────────────│ Root    │                        │
│  │ (A)     │   alternate    │ (A')    │                        │
│  └────┬────┘                └────┬────┘                        │
│       │                            │                             │
│       ▼                            ▼                             │
│  ┌─────────┐                ┌─────────┐                        │
│  │ <App/>  │                │ <App/>  │                        │
│  │ (B)     │                │ (B')    │                        │
│  └─────────┘                └─────────┘                        │
│                                                                  │
│  【提交后】                                                       │
│                                                                  │
│  current tree ←─────────────── workInProgress tree              │
│  ┌─────────┐                ┌─────────┐                        │
│  │ Root    │                │ Root    │                        │
│  │ (A')    │◄───────────────│ (A')    │ ← 变成新的 current    │
│  └────┬────┘   交换          └────┬────┘                        │
│       │       alternate            │                             │
│       ▼                            ▼                             │
│  ┌─────────┐                ┌─────────┐                        │
│  │ <App/>  │                │ <App/>  │                        │
│  │ (B')    │                │ (B')    │                        │
│  └─────────┘                └─────────┘                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 完整工作流程图

```
┌─────────────────────────────────────────────────────────────────┐
│                    React Fiber 完整工作流程                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                      阶段 1: 输入                            │ │
│  │  ReactDOM.createRoot() → 创建 FiberRootNode               │ │
│  │  root.render(<App />) → 创建 Update → scheduleUpdateOnFiber │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    阶段 2: 调度                              │ │
│  │  scheduleCallback → requestHostCallback                   │ │
│  │  优先级排序 → 计算过期时间 → 加入调度队列                    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    阶段 3: Render                           │ │
│  │  ┌─────────────────────────────────────────────────────┐   │ │
│  │  │ beginWork: 计算新 props，决定如何更新                 │   │ │
│  │  │   ├── updateFunctionComponent                        │   │ │
│  │  │   ├── updateClassComponent                           │   │ │
│  │  │   └── updateHostComponent                             │   │ │
│  │  └─────────────────────────────────────────────────────┘   │ │
│  │                         │                                   │ │
│  │                         ▼                                   │ │
│  │  ┌─────────────────────────────────────────────────────┐   │ │
│  │  │ completeWork: 创建 DOM，设置 flags                    │   │ │
│  │  │   ├── completeWork                                    │   │ │
│  │  │   └── bubbleProperties                               │   │ │
│  │  └─────────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│         ┌────────────────────┼────────────────────┐              │
│         │                    │                    │              │
│         ▼                    ▼                    ▼              │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │ Placement   │     │ Update      │     │ Deletion    │       │
│  │ 插入        │     │ 更新        │     │ 删除        │       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    阶段 4: Commit                           │ │
│  │  ┌─────────────────────────────────────────────────────┐   │ │
│  │  │ BeforeMutation: 捕获 DOM 前快照                      │   │ │
│  │  │ Mutation:     执行 DOM 操作（插入/更新/删除）         │   │ │
│  │  │ Layout:       布局 effect、ref 赋值                   │   │ │
│  │  └─────────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    双缓冲切换                                │ │
│  │  workInProgress → current (通过 alternate 交换)           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.4 beginWork 与 completeWork

**beginWork 阶段：**

```javascript
// packages/react-reconciler/src/ReactFiberBeginWork.new.js (约 400 行)
function beginWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes
): Fiber | null {

  // 更新过期时间
  workInProgress.lanes = NoLanes;

  // 根据 tag 类型分发到不同的处理函数
  switch (workInProgress.tag) {
    case IndeterminateComponent: {
      // 首次渲染时确定组件类型
      return mountIndeterminateComponent(
        current,
        workInProgress,
        workInProgress.type,
        renderLanes,
      );
    }

    case FunctionComponent: {
      // 函数组件
      return updateFunctionComponent(
        current,
        workInProgress,
        Component,
        nextProps,
        renderLanes
      );
    }

    case ClassComponent: {
      // 类组件
      return updateClassComponent(
        current,
        workInProgress,
        Component,
        nextProps,
        renderLanes
      );
    }

    case HostRoot: {
      // 根节点
      return updateHostRoot(current, workInProgress, renderLanes);
    }

    case HostComponent: {
      // DOM 元素
      return updateHostComponent(current, workInProgress, renderLanes);
    }

    case HostText: {
      // 文本节点
      return updateHostText(current, workInProgress);
    }
    // ... 其他类型
  }
}
```

**completeWork 阶段：**

```javascript
// packages/react-reconciler/src/ReactFiberCompleteWork.new.js (约 600 行)
function completeWork(
  current: Fiber | null,
  workInProgress: Fiber,
): Fiber | null {

  const newProps = workInProgress.pendingProps;

  switch (workInProgress.tag) {
    case HostComponent: {
      const type = workInProgress.type;

      if (current && workInProgress.stateNode) {
        // 更新现有 DOM 节点
        updateHostComponent(
          current,
          workInProgress,
          type,
          newProps,
          current.memoizedProps
        );

        // 处理 ref
        if (current.ref !== workInProgress.ref) {
          workInProgress.flags |= Update;
        }
      } else {
        // 创建新的 DOM 节点
        const domNode = createInstance(
          type,
          newProps,
          workInProgress
        );

        // 将所有子节点添加到 DOM 中
        appendAllChildren(domNode, workInProgress);

        workInProgress.stateNode = domNode;

        // 添加 Placement 标志
        workInProgress.flags |= Placement;
      }
      break;
    }

    case HostText: {
      if (current && workInProgress.stateNode) {
        // 更新文本节点
        const newText = newProps;

        if (current.memoizedProps !== newText) {
          workInProgress.flags |= Update;
        }
      }
      break;
    }
    // ... 其他类型
  }

  return null;
}
```

### 5.5 源码文件索引

| 文件路径 | 功能描述 |
|----------|----------|
| `packages/react-reconciler/src/ReactFiber.js` | Fiber 节点创建与克隆 |
| `packages/react-reconciler/src/ReactFiberRoot.js` | FiberRootNode 与 RootFiber |
| `packages/react-reconciler/src/ReactFiberWorkLoop.js` | 工作循环主流程 |
| `packages/react-reconciler/src/ReactFiberLane.js` | Lane 模型定义 |
| `packages/react-reconciler/src/ReactFiberFlags.js` | Flags 副作用标志 |
| `packages/react-reconciler/src/ReactWorkTags.js` | WorkTag 类型定义 |
| `packages/react-reconciler/src/ReactInternalTypes.js` | Fiber 类型定义 |
| `packages/scheduler/src/Scheduler.js` | 调度器核心 |
| `packages/react-reconciler/src/ReactFiberBeginWork.js` | beginWork 实现 |
| `packages/react-reconciler/src/ReactFiberCompleteWork.js` | completeWork 实现 |
| `packages/react-reconciler/src/ReactFiberCommitWork.js` | commit 阶段实现 |

---

## 六、总结

### 6.1 Fiber 架构核心要点

1. **数据结构**：Fiber 是一个链表节点，包含 child、sibling、return 三个指针
2. **工作单元**：每个 Fiber 节点是一个可中断的工作单元
3. **双缓冲**：current 和 workInProgress 通过 alternate 指针相互引用
4. **优先级**：Lane 模型精确管理不同更新的优先级
5. **时间切片**：利用浏览器空闲时间分片执行渲染任务

### 6.2 性能优化关键

- **可中断渲染**：高优先级任务可随时抢占
- **增量渲染**：任务分散到多帧执行
- **双缓冲切换**：避免页面闪烁，实现平滑更新
- **位运算标记**：高效处理多优先级更新

### 6.3 与 React 19 的关系

React Fiber 是 React 并发模式的基础，React 19 中的：

- **useTransition**：依赖 Fiber 优先级调度
- **useDeferredValue**：利用 Lane 模型实现延迟更新
- **Suspense**：通过 Fiber flags 实现加载状态
- **并发渲染**：Fiber 架构允许可中断的多任务并行

---

**参考版本**：React 19.x
**文档更新**：2026年3月
