# React 调和算法与 Diff 策略

## 一、调和（Reconciliation）概述

### 1.1 什么是调和

调和是 React 用来 diff 两棵树，找出最小变更的算法。调和器（Reconciler）是 React 的核心系统，负责决定需要更新哪些 DOM 元素。

**调和 vs 渲染**：

| 概念 | 说明 |
|------|------|
| **调和（Reconciliation）** | 决定哪些部分需要更新 |
| **渲染（Rendering）** | 实际更新 DOM 的过程 |

### 1.2 React 16 前后对比

**React 15：栈调和器（Stack Reconciler）**
- 递归同步执行
- 无法中断
- 简单但性能受限

**React 16+：Fiber 调和器（Fiber Reconciler）**
- 可中断的工作循环
- 支持优先级调度
- 增量渲染

## 二、Render 阶段与 Commit 阶段

React 的工作流程分为两个主要阶段：

### 2.1 两阶段模型

```
┌─────────────────────────────────────────────────────────────────┐
│                        Render 阶段                               │
│  (可中断、异步、寻找变更)                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐                   │
│  │beginWork│────→│complete │────→│  next   │                   │
│  │         │     │  Work   │     │ unit of │                   │
│  └─────────┘     └─────────┘     │  work   │                   │
│       │                │           └────▲────┘                   │
│       │                │                │                       │
│       ▼                ▼                │                       │
│  [标记副作用]    [创建 DOM 节点]    [循环直到]                   │
│                                    [无工作]                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Commit 阶段                               │
│  (不可中断、同步、执行副作用)                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ BeforeMutation│→│ Mutation     │→│ LayoutEffects│        │
│  │   阶段        │  │   阶段        │  │   阶段        │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                  │
│  • 执行 DOM 操作                                                 │
│  • 调用 componentDidMount/Update                                │
│  • 清理副作用（useEffect cleanup）                              │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Render 阶段详解

Render 阶段可以被打断，通过 `workLoop` 实现：

```typescript
// packages/react-reconciler/src/ReactFiberWorkLoop.new.js

// 工作循环 - 可中断
function workLoop() {
  // 循环直到没有 workInProgress
  while (workInProgress !== null) {
    workInProgress = performUnitOfWork(workInProgress);
  }
}

// 执行单个工作单元
function performUnitOfWork(fiber) {
  // 1. beginWork: 开始处理这个 fiber
  const next = beginWork(fiber);

  // 2. 如果没有子节点，进入 completeWork
  if (next === null) {
    next = completeUnitOfWork(fiber);
  }

  return next;
}
```

**beginWork 的职责**：

```typescript
// packages/react-reconciler/src/ReactFiberBeginWork.new.js

function beginWork(current, workInProgress, renderLanes) {
  // 1. 更新过期时间
  workInProgress.lanes = NoLanes;

  // 2. 根据 tag 调用不同的更新函数
  switch (workInProgress.tag) {
    case HostRoot:
      return updateHostRoot(current, workInProgress, renderLanes);

    case FunctionComponent:
      return updateFunctionComponent(current, workInProgress, renderLanes);

    case ClassComponent:
      return updateClassComponent(current, workInProgress, renderLanes);

    case HostComponent:
      return updateHostComponent(current, workInProgress, renderLanes);

    // ...
  }
}
```

**completeWork 的职责**：

```typescript
// packages/react-reconciler/src/ReactFiberCompleteWork.new.js

function completeWork(fiber) {
  const current = fiber.alternate;

  switch (fiber.tag) {
    case HostComponent:
      // DOM 元素处理
      if (fiber.stateNode !== null) {
        // 更新现有 DOM 节点属性
        updateHostComponent(current, fiber);
      }
      return null;

    case HostText:
      // 文本节点处理
      if (current && fiber.stateNode !== null) {
        // 更新文本内容
        updateHostText(current, fiber);
      }
      return null;

    case SuspenseComponent:
      // Suspense 处理
      return null;

    // ...
  }
}
```

### 2.3 Commit 阶段详解

Commit 阶段不可中断，必须同步执行：

```typescript
// packages/react-reconciler/src/ReactFiberWorkLoop.new.js

// 提交根节点
function commitRoot(root) {
  // 1. 获取待提交的变更
  const finishedWork = root.finishedWork;

  // 2. 重置工作状态
  root.finishedWork = null;

  // 3. 执行提交
  commitRootImpl(finishedWork);

  // 4. 开始新的一轮调度
  return null;
}

// 实际的提交实现
function commitRootImpl(finishedWork) {
  // 阶段一：BeforeMutation
  // DOM 变更前的操作
  commitBeforeMutationEffects(finishedWork);

  // 阶段二：Mutation
  // DOM 实际变更
  commitMutationEffects(finishedWork);

  // 阶段三：Layout
  // 调用 layout effects
  commitLayoutEffects(finishedWork);
}
```

**三个子阶段详解**：

```typescript
// 阶段一：BeforeMutation（DOM 变更前）
function commitBeforeMutationEffects() {
  // 1. 处理 useEffect 的初始赋值
  // 2. 读取 DOM 状态（如滚动位置）
  // 3. 调度 useEffect cleanup
}

// 阶段二：Mutation（DOM 变更）
function commitMutationEffects() {
  // 1. 插入 DOM 节点
  // 2. 删除 DOM 节点
  // 3. 更新 DOM 节点属性
  // 4. 调用 componentWillUnmount
}

// 阶段三：Layout（布局后）
function commitLayoutEffects() {
  // 1. 调用 componentDidMount
  // 2. 调用 componentDidUpdate
  // 3. 读取 DOM 布局信息
  // 4. 触发 useEffect
}
```

## 三、Fiber 树构建

### 3.1 两棵树理论

在任意时刻，React 维护两棵 Fiber 树：

| 树 | 变量 | 说明 |
|---|------|------|
| **Current 树** | `root.current` | 当前屏幕上渲染的树 |
| **WorkInProgress 树** | `workInProgress` | 正在构建的新树 |

### 3.2 树的构建过程

**首次渲染**：

```typescript
// 创建 FiberRoot
const root = createFiberRoot(container, ConcurrentRoot);

// 创建第一个 workInProgress
const workInProgress = createHostRootFiber();

// 开始工作循环
workLoop();
```

**更新渲染**：

```typescript
// 状态更新触发
function setState() {
  // 1. 创建更新对象
  const update = createUpdate();

  // 2. 加入更新队列
  enqueueUpdate(fiber.updateQueue, update);

  // 3. 调度工作
  scheduleUpdateOnFiber(fiber);
}
```

### 3.3 completeUnitOfWork 工作流程

```typescript
// packages/react-reconciler/src/ReactFiberWorkLoop.new.js

function completeUnitOfWork(fiber) {
  // 循环向上遍历
  while (true) {
    const current = fiber.alternate;

    // 1. 尝试完成当前节点
    const returnFiber = fiber.return;

    // 2. 调用 completeWork
    completeWork(current, fiber);

    // 3. 处理副作用
    if (fiber.effectTag !== NoEffect) {
      // 记录副作用到父节点
      if (returnFiber !== null) {
        returnFiber.effectTag = Placement;
      }
    }

    // 4. 如果有兄弟节点，处理兄弟节点
    if (fiber.sibling !== null) {
      return fiber.sibling;
    }

    // 5. 回到父节点
    if (returnFiber !== null) {
      fiber = returnFiber;
      continue;
    }

    // 6. 到达根节点
    return null;
  }
}
```

## 四、Diff 算法策略

### 4.1 Diff 算法的约束

React 的 Diff 算法基于两个假设：

1. **不同类型的元素产生不同的树**
2. **开发者可以通过 key 暗示哪些子元素稳定**

### 4.2 三种 Diff 策略

React 根据元素的类型采用不同的 Diff 策略：

#### 策略一：不同类型元素（Tree Diff）

```typescript
// 当根元素类型不同时，完全替换
// 之前
<div>
  <Component />
</div>

// 之后
<span>
  <Component />
</span>

// React 方案：销毁旧树，创建新树
```

#### 策略二：同类型 DOM 元素（Element Diff）

```typescript
// 同类型的 DOM 元素，保留 DOM 节点，只更新属性
// 之前
<div className="before" style={{color: 'red'}} />

// 之后
<div className="after" style={{color: 'blue'}} />

// React 方案：只更新变化的属性
```

#### 策略三：同类型组件元素（Component Diff）

```typescript
// 同类型组件，不替换实例，只更新 props
// 之前
<ClassComponent title="before" />

// 之后
<ClassComponent title="after" />

// React 方案：调用 componentWillReceiveProps 和 componentDidUpdate
```

### 4.3 列表 Diff（Key 的作用）

对于列表元素，React 使用 key 来识别元素：

```typescript
// 无 key 的列表 - 可能导致性能问题
// 之前
[A, B, C]
// 之后
[A, B, C, D]

// diff 结果：
// A -> A (key 相同，保留)
// B -> B (key 相同，保留)
// C -> C (key 相同，保留)
// D -> D (新增)

// 有 key 的列表
// 之前
<div key="1">A</div>
<div key="2">B</div>
<div key="3">C</div>

// 之后（移动位置）
<div key="1">A</div>
<div key="3">C</div>  // 移动
<div key="2">B</div>  // 移动

// diff 结果：
// A -> A (key 相同，保留)
// C -> C (移动)
// B -> B (移动)
```

### 4.4 reconcileChildren 实现

```typescript
// packages/react-reconciler/src/ReactChildFiber.new.js

function reconcileChildren(current, workInProgress, nextChildren) {
  const newChildren = [];

  // 1. 遍历新 children
  for (let i = 0; i < nextChildren.length; i++) {
    const child = nextChildren[i];

    // 2. 为每个子节点创建或复用 Fiber
    const newFiber = updateSlot(current, workInProgress, child, i);

    // 3. 收集到新 children 数组
    if (newFiber !== null) {
      newChildren.push(newFiber);
    }
  }

  // 4. 设置链表结构
  workInProgress.child = linkNewChildren(newChildren);

  return workInProgress.child;
}

// 更新或创建单个 slot
function updateSlot(current, workInProgress, newChild, index) {
  const keyToUse = newChild.key !== null ? newChild.key : index;

  // 1. 获取旧的 child
  const oldFiber = workInProgress.child;

  // 2. 如果没有旧 Fiber，创建新的
  if (oldFiber === null) {
    return createChildFiber(newChild);
  }

  // 3. 比较 key
  if (oldFiber.key === keyToUse) {
    // key 相同，比较类型
    if (oldFiber.type === newChild.type) {
      // 类型相同，复用
      return cloneFiber(oldFiber, newChild.props);
    }
    // 类型不同，替换
    return createChildFiber(newChild);
  }

  // 4. key 不同，标记删除
  deleteChild(workInProgress, oldFiber);
  return createChildFiber(newChild);
}
```

### 4.5 调和算法源码解析

**updateSlot（单节点 Diff）**：

```typescript
// packages/react-reconciler/src/ReactChildFiber.new.js

function updateSlot(current, workInProgress, newChild, index) {
  const keyToUse = newChild !== null ? newChild.key : index;

  // 情况1：没有旧 fiber，必须新建
  if (current === null) {
    if (newChild === null) {
      return null;
    }
    return createFiberFromElement(newChild);
  }

  // 情况2：只有 key，新旧 key 不同，替换
  if (keyToUse !== current.key) {
    return deleteSlot(current, workInProgress);
  }

  // 情况3：key 相同，比较 type
  if (sameOrStringifiable(current.type, newChild.type)) {
    // type 相同，复用 oldFiber
    const existingFiber = useFiber(current, newChild.props);
    existingFiber.return = workInProgress;
    return existingFiber;
  }

  // 情况4：type 不同，删除旧的，创建新的
  deleteSlot(current, workInProgress);
  return createFiberFromElement(newChild);
}
```

**reconcileChildrenArray（数组 Diff）**：

```typescript
// packages/react-reconciler/src/ReactChildFiber.new.js

function reconcileChildrenArray(current, workInProgress, newChildren) {
  let resultingFirstChild = null;
  let previousNewChild = null;
  let oldChild = current?.child;
  let newIdx = 0;

  // 1. 第一次遍历：处理可以复用的节点
  while (newIdx < newChildren.length && oldChild !== null) {
    const newChild = newChildren[newIdx];

    // 尝试复用
    if (!canReuseKey(oldChild, newChild)) {
      break;
    }

    // 复用成功，移动指针
    const newFiber = useFiber(oldChild, newChild.props);
    newFiber.return = workInProgress;
    previousNewChild = newFiber;
    resultingFirstChild = newFiber;

    oldChild = oldChild.sibling;
    newIdx++;
  }

  // 2. 第二次遍历：处理新增的节点
  while (newIdx < newChildren.length) {
    const newChild = newChildren[newIdx];

    // 创建新 fiber
    const newFiber = createFiberFromElement(newChild);
    newFiber.return = workInProgress;
    previousNewChild = newFiber;

    newIdx++;
  }

  // 3. 第三次遍历：处理删除的节点
  while (oldChild !== null) {
    deleteChild(workInProgress, oldChild);
    oldChild = oldChild.sibling;
  }

  return resultingFirstChild;
}
```

## 五、协调（Reconciliation）过程

### 5.1 协调器入口

ReactDOM 渲染入口：

```typescript
// packages/react-dom/src/client/ReactDOMRoot.js

function updateContainer(element, container, parentComponent, callback) {
  // 1. 获取根 fiber
  const root = container._reactRootContainer;

  // 2. 创建更新
  const update = createUpdate(PlusPriority);

  // 3. 设置 payload
  update.payload = { element };

  // 4. 加入队列
  enqueueUpdate(root.current.updateQueue, update);

  // 5. 调度更新
  scheduleUpdateOnFiber(root.current, SyncLane, NoLane);
}
```

### 5.2 setState 触发流程

```typescript
// 1. 组件调用 setState
this.setState({ count: this.state.count + 1 });

// 2. 创建更新对象
function createUpdate(priority) {
  return {
    expirationTime: priority,
    tag: UpdateState,
    payload: null,
    callback: null,
    next: null,
    nextEffect: null,
  };
}

// 3. 加入 fiber.updateQueue
function enqueueUpdate(queue, update) {
  const pending = queue.pending;
  if (pending === null) {
    update.next = update;
    queue.pending = update;
  } else {
    update.next = pending.next;
    pending.next = update;
  }
}

// 4. 调度工作
function scheduleUpdateOnFiber(fiber, lane) {
  // 标记需要更新
  fiber.lanes = mergeLanes(fiber.lanes, lane);

  // 向上冒泡到 root
  let node = fiber;
  while (node !== null) {
    node.childLanes = mergeLanes(node.childLanes, lane);
    node = node.return;
  }

  // 调度
  requestUpdateLane(fiber);
}
```

### 5.3 更新优先级判断

```typescript
// packages/react-reconciler/src/ReactFiberLane.new.js

// 获取本次更新的优先级
function requestUpdateLane(fiber) {
  const current = fiber.alternate;

  // 1. 如果是同步组件
  if (fiber.tag === FunctionComponent) {
    // 检查是否有 useTransition
    if (isCurrentActionUsingTransition()) {
      return TransitionLane;
    }
  }

  // 2. 普通更新
  return findUpdateLane();
}

// 查找可用的车道
function findUpdateLane() {
  // 从高到低尝试
  if (SyncLane !== NoLane) {
    return SyncLane;
  }
  return InputContinuousLane;
}
```

## 六、Diff 策略性能优化

### 6.1 Key 的最佳实践

**推荐使用稳定唯一 ID**：

```jsx
// 推荐：使用稳定的 ID
{items.map(item => (
  <div key={item.id}>{item.name}</div>
))}

// 推荐：使用索引作为最后手段
{items.map((item, index) => (
  <div key={index}>{item.name}</div>
))}

// 不推荐：使用随机 ID
{items.map(item => (
  <div key={Math.random()}>{item.name}</div>
))}
```

### 6.2 避免这些模式

```jsx
// 反模式 1：在渲染中生成 key
{items.map(item => (
  <Component key={generateKey()} />  // 每次渲染都生成新 key
))}

// 反模式 2：将 index 作为 key 且列表会变化
// [A, B, C] -> [A, B, C, D] 时还好
// [A, B, C] -> [B, A, C] 时会导致错误的复用
```

### 6.3 memo 和 useMemo 优化

```typescript
// 使用 React.memo 避免不必要的重渲染
const MemoizedComponent = React.memo(function MyComponent({ data }) {
  return <div>{data}</div>;
});

// 使用 useMemo 缓存计算结果
function ParentComponent({ items }) {
  const sortedItems = useMemo(() => {
    return items.sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  return <List items={sortedItems} />;
}
```

## 七、总结

### 7.1 核心要点

1. **Render 阶段可中断**：通过 workLoop 实现增量渲染
2. **Commit 阶段不可中断**：DOM 更新必须同步完成
3. **Diff 三大策略**：Tree Diff、Element Diff、Component Diff
4. **Key 的作用**：帮助 React 识别哪些元素是稳定的
5. **双缓存树**：current 和 workInProgress 实现无扰动更新

### 7.2 后续章节预告

- **Hooks 源码实现**：深入理解 useState、useEffect 的工作原理
- **事件系统**：理解合成事件的创建和分发机制
- **Scheduler 调度机制**：深入理解 lanes 模型和时间切片
