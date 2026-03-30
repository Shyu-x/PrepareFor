# React Scheduler 调度机制

## 一、Scheduler 概述

### 1.1 Scheduler 的定位

Scheduler 是 React 的任务调度器，独立于 React 核心包：

```typescript
// packages/scheduler/src/Scheduler.js

// Scheduler 的职责：
// 1. 管理任务优先级
// 2. 实现时间切片
// 3. 调度任务执行
```

**与 React 的关系**：

```
┌─────────────────────────────────────────────────────────────────┐
│                         React                                   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              react-reconciler                            │   │
│  │  - Fiber 树构建                                          │   │
│  │  - beginWork / completeWork                              │   │
│  │  - commitWork                                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              │ 调用 scheduleCallback             │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    scheduler                              │   │
│  │  - 任务队列管理                                           │   │
│  │  - 优先级排序                                             │   │
│  │  - 时间切片                                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              │ 调用 requestHostCallback          │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    浏览器                                  │   │
│  │  - setTimeout / MessageChannel                            │   │
│  │  - requestAnimationFrame                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Scheduler 的独立性

Scheduler 包可以独立使用：

```typescript
// 单独使用 Scheduler
import { scheduleCallback, runPriority, ImmediatePriority } from 'scheduler';

scheduleCallback(ImmediatePriority, () => {
  console.log('立即执行');
});
```

## 二、调度器原理

### 2.1 核心数据结构：最小堆

Scheduler 使用**最小堆**（Min Heap）作为任务队列：

```typescript
// packages/scheduler/src/SchedulerMinHeap.js

// 最小堆操作
function push(heap, node) {
  const index = heap.length;
  heap.push(node);
  siftUp(heap, index);
}

function peek(heap) {
  return heap.length === 0 ? null : heap[0];
}

function pop(heap) {
  if (heap.length === 0) {
    return null;
  }

  const first = heap[0];
  const last = heap.pop();

  if (first !== last) {
    heap[0] = last;
    siftDown(heap, 0);
  }

  return first;
}

// 上浮操作
function siftUp(heap, index) {
  while (index > 0) {
    const parentIndex = Math.floor((index - 1) / 2);
    if (heap[parentIndex].sortIndex < heap[index].sortIndex) {
      [heap[parentIndex], heap[index]] = [heap[index], heap[parentIndex]];
      index = parentIndex;
    } else {
      break;
    }
  }
}

// 下沉操作
function siftDown(heap, index) {
  const length = heap.length;

  while (true) {
    const leftChildIndex = 2 * index + 1;
    const rightChildIndex = 2 * index + 2;
    let smallest = index;

    if (leftChildIndex < length &&
        heap[leftChildIndex].sortIndex < heap[smallest].sortIndex) {
      smallest = leftChildIndex;
    }

    if (rightChildIndex < length &&
        heap[rightChildIndex].sortIndex < heap[smallest].sortIndex) {
      smallest = rightChildIndex;
    }

    if (smallest !== index) {
      [heap[index], heap[smallest]] = [heap[smallest], heap[index]];
      index = smallest;
    } else {
      break;
    }
  }
}
```

### 2.2 任务对象结构

```typescript
// packages/scheduler/src/Scheduler.js

type PriorityLevel = 0 | 1 | 2 | 3 | 4 | 5;

// 任务结构
type Task = {
  id: number,                    // 任务 ID
  callback: (() => boolean) | null,  // 回调函数，返回是否需要继续
  priorityLevel: PriorityLevel,  // 优先级
  sortIndex: number,            // 在堆中的排序依据（过期时间）
  expirationTime: number,        // 过期时间
  next: Task | null,             // 链表指针
  previous: Task | null,         // 链表指针
};
```

### 2.3 调度流程

```typescript
// packages/scheduler/src/Scheduler.js

// 调度任务
function scheduleCallback(
  priorityLevel: PriorityLevel,
  callback: () => void
) {
  const currentTime = getCurrentTime();

  // 计算过期时间
  const expirationTime = currentTime + timeoutByPriorityLevel[priorityLevel];

  // 创建任务
  const newTask = {
    id: nextTaskId++,
    callback,
    priorityLevel,
    sortIndex: expirationTime,  // 过期时间作为排序依据
    expirationTime,
    next: null,
    previous: null,
  };

  // 加入任务队列
  push(taskQueue, newTask);

  // 调度执行
  requestHostCallback(flushWork);

  return newTask;
}

// 执行工作循环
function flushWork() {
  const currentTime = getCurrentTime();

  // 推进定时器
  advanceTimers(currentTime);

  // 从队列中取出任务
  let task = peek(taskQueue);

  while (task !== null) {
    const callback = task.callback;

    // 执行任务
    const didUserCallbackTimeout = currentTime >= task.expirationTime;

    if (didUserCallbackTimeout) {
      // 任务已过期，立即执行
      const continuation = callback(didUserCallbackTimeout);

      if (typeof continuation === 'function') {
        // 任务需要继续，保存继续函数
        task.callback = continuation;
      } else {
        // 任务完成，移除
        pop(taskQueue);
      }
    } else {
      // 检查是否应该让出
      if (!shouldYieldToHost()) {
        // 继续执行
        const continuation = callback(didUserCallbackTimeout);

        if (typeof continuation === 'function') {
          task.callback = continuation;
        } else {
          pop(taskQueue);
        }
      } else {
        // 让出主线程
        break;
      }
    }

    // 获取下一个任务
    task = peek(taskQueue);
  }

  // 返回是否还有待执行的任务
  return task !== null;
}
```

## 三、优先级 lanes 模型

### 3.1 Lane 模型定义

React 17+ 使用 Lane（车道）模型管理优先级：

```typescript
// packages/react-reconciler/src/ReactFiberLane.js

// 车道数量
export const TotalLanes = 31;

// 各种车道定义
export const NoLane: Lane = 0b0000000000000000000000000000000;
export const SyncLane: Lane = 0b0000000000000000000000000000001;
export const InputContinuousLane: Lane = 0b0000000000000000000000000001000;
export const DefaultLane: Lane = 0b0000000000000000000000000100000;
export const TransitionLane1: Lane = 0b0000000000000000010000000000000;
export const TransitionLane2: Lane = 0b0000000000000000100000000000000;
export const IdleLane: Lane = 0b0100000000000000000000000000000;
```

### 3.2 车道优先级映射

```typescript
// 优先级与车道的映射

// 同步更新（如点击事件）
SyncLane → ImmediatePriority

// 用户交互（如拖拽、输入）
InputContinuousLane → UserBlockingPriority

// 普通更新（如数据加载）
DefaultLane → NormalPriority

// 过渡更新（如 Suspense）
TransitionLane → NormalPriority

// 空闲更新（如预加载）
IdleLane → IdlePriority
```

### 3.3 车道操作

```typescript
// packages/react-reconciler/src/ReactFiberLane.js

// 合并车道
export function mergeLanes(a: Lanes, b: Lanes): Lanes {
  return a | b;
}

// 判断是否包含某车道
export function hasLanes(a: Lanes, b: Lanes): boolean {
  return (a & b) !== NoLane;
}

// 获取最高优先级车道
export function getHighestPriorityLane(lanes: Lanes): Lane {
  return lanes & -lanes;  // 取最低位的 1
}

// 从车道获取优先级
export function laneToPriority(lane: Lane): ReactPriorityLevel {
  if (lane === SyncLane) {
    return ImmediatePriority;
  }
  if (lane === InputContinuousLane) {
    return UserBlockingPriority;
  }
  if (lane === DefaultLane) {
    return NormalPriority;
  }
  if (lane >= TransitionLane1 && lane <= TransitionLane18) {
    return NormalPriority;
  }
  if (lane === IdleLane) {
    return IdlePriority;
  }
  return NoPriority;
}
```

## 四、时间切片（Time Slicing）

### 4.1 时间片预算

```typescript
// packages/scheduler/src/Scheduler.js

// 每帧约 16.67ms（60fps）
// React 只使用其中一部分时间
const frameInterval = 5; // 毫秒
let frameDeadline = 0;

// 检查是否应该让出
function shouldYieldToHost(): boolean {
  if (
    // 当前时间超过预算
    getCurrentTime() >= frameDeadline ||
    // 有更高优先级任务等待
    schedulerIsScheduled
  ) {
    return true;
  }
  return false;
}

// 更新帧截止时间
function startFrameCalculation() {
  frameDeadline = getCurrentTime() + frameInterval;
}
```

### 4.2 让出机制实现

```typescript
// packages/scheduler/src/requestHostCallback.js

let scheduledHostCallback: ((boolean) => boolean) | null = null;
let isMessageLoopRunning = false;

// 请求调度回调
function requestHostCallback(callback) {
  scheduledHostCallback = callback;

  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true;
    schedulePerformWorkUntilHost();
  }
}

// 使用 MessageChannel 调度
const channel = new MessageChannel();
const port = channel.port1;

function schedulePerformWorkUntilHost() {
  channel.port2.postMessage(null);
}

port.onmessage = function(event) {
  const callback = scheduledHostCallback;

  if (callback !== null) {
    scheduledHostCallback = null;

    // 计算当前帧截止时间
    frameDeadline = getCurrentTime() + frameInterval;

    // 执行任务
    const needsReschedule = callback(shouldYieldToHost);

    if (needsReschedule) {
      // 继续调度
      schedulePerformWorkUntilHost();
    } else {
      isMessageLoopRunning = false;
    }
  }
};
```

### 4.3 工作单元执行

```
┌─────────────────────────────────────────────────────────────────┐
│                    时间切片执行示意                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  帧 1 (16.67ms)                                                  │
│  ┌──────────────────────────────────────────────────────┐       │
│  │  [Fiber A] [Fiber B] [Fiber C] [Fiber D] [让出]      │       │
│  │  ─────────────────── 5ms 预算 ────────────────────   │       │
│  └──────────────────────────────────────────────────────┘       │
│       │                                                          │
│       │ 高优先级任务插入（点击事件）                               │
│       ▼                                                          │
│  帧 2 (16.67ms)                                                  │
│  ┌──────────────────────────────────────────────────────┐       │
│  │  [处理点击] [Fiber C] [Fiber D] [Fiber E] [让出]     │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 五、任务调度队列

### 5.1 调度队列结构

```typescript
// Scheduler 中的任务队列实际上是两个堆的组合

// taskQueue - 到期任务队列
let taskQueue: Heap = [];

// timerQueue - 定时器队列（未到期）
let timerQueue: Heap = [];
```

### 5.2 定时器队列

```typescript
// packages/scheduler/src/Scheduler.js

// 推进定时器，将到期的任务移到 taskQueue
function advanceTimers(currentTime: number) {
  let timer = peek(timerQueue);

  while (timer !== null) {
    if (timer.callback === null) {
      // 任务被取消
      pop(timerQueue);
    } else if (timer.startTime > currentTime) {
      // 任务还未到期
      break;
    } else {
      // 任务到期，移到 taskQueue
      pop(timerQueue);
      timer.sortIndex = timer.expirationTime;
      push(taskQueue, timer);
    }

    timer = peek(timerQueue);
  }
}

// 调度带延迟的任务
function scheduleCallbackWithDelay(
  priorityLevel,
  callback,
  msDelay
) {
  const currentTime = getCurrentTime();
  const startTime = currentTime + msDelay;

  // 创建任务
  const newTask = {
    id: nextTaskId++,
    callback,
    priorityLevel,
    sortIndex: startTime,  // 按开始时间排序
    expirationTime: startTime + timeoutByPriorityLevel[priorityLevel],
  };

  // 加入 timerQueue
  push(timerQueue, newTask);

  return newTask;
}
```

### 5.3 任务取消

```typescript
// packages/scheduler/src/Scheduler.js

// 取消任务
function cancelCallback(task) {
  // 将 callback 置为 null，表示已取消
  task.callback = null;
}

// 在 flushWork 中检查
function flushWork() {
  let task = peek(taskQueue);

  while (task !== null) {
    if (task.callback === null) {
      // 任务被取消，移除
      pop(taskQueue);
    } else {
      // 执行任务
      const continuation = task.callback();

      if (typeof continuation === 'function') {
        task.callback = continuation;
      } else {
        pop(taskQueue);
      }
    }

    task = peek(taskQueue);
  }
}
```

## 六、优先级调度示例

### 6.1 不同优先级的任务

```typescript
// React 18 中的优先级示例

import { useState, useTransition } from 'react';
import { startTransition } from 'react';

// 场景 1：同步更新（最高优先级）
function handleClick() {
  setCount(c => c + 1);  // SyncLane
}

// 场景 2：用户阻塞更新（高优先级）
function handleDrag(deltaX) {
  setPosition(prev => ({
    ...prev,
    x: prev.x + deltaX
  }));  // InputContinuousLane
}

// 场景 3：普通更新（正常优先级）
function handleSearch(query) {
  fetch(`/api/search?q=${query}`)
    .then(r => r.json())
    .then(data => setResults(data));
}

// 场景 4：过渡更新（低优先级）
function Tab({ id }) {
  startTransition(() => {
    setActiveTab(id);  // TransitionLane
  });
}

// 场景 5：空闲更新（最低优先级）
function preloadData() {
  // 在浏览器空闲时预加载
  requestIdleCallback(() => {
    preloadLargeImage();
  });
}
```

### 6.2 useTransition 与优先级

```typescript
// useTransition 返回一个过渡任务
function useTransition(): [isPending: boolean, startTransition: (callback: () => void) => void] {
  // 获取当前 dispatcher
  const dispatcher = resolveDispatcher();

  // 调用 dispatcher 的 useTransition
  return dispatcher.useTransition();
}

// startTransition 的实现
function startTransitionImpl(callback, name) {
  const prevPriority = getCurrentPriorityLevel();

  // 将当前优先级降低
  setCurrentPriorityLevel(NormalPriority);

  try {
    callback();
  } finally {
    setCurrentPriorityLevel(prevPriority);
  }
}
```

### 6.3 useDeferredValue 与优先级

```typescript
// useDeferredValue 实现
function useDeferredValue<T>(
  value: T,
  config?: { timeoutMs?: number }
): T {
  const dispatcher = resolveDispatcher();

  return dispatcher.useDeferredValue(value, config);
}

// useDeferredValue 本质上是
// 使用 IdleLane 或 TransitionLane 进行更新
function updateDeferredValue<T>(currentValue, value, timeoutMs) {
  const lane = requestUpdateLane();

  // 创建延迟更新
  scheduleUpdateOnFiber(fiber, lane);

  return value; // 返回新值，旧的会被复用
}
```

## 七、调度与 Fiber 工作循环

### 7.1 调度触发工作循环

```typescript
// packages/react-reconciler/src/ReactFiberWorkLoop.new.js

// 调度更新
function scheduleUpdateOnFiber(fiber, lane) {
  // 标记 fiber 的优先级
  fiber.lanes = mergeLanes(fiber.lanes, lane);

  // 向上冒泡到 root
  let node = fiber;
  while (node !== null) {
    node.childLanes = mergeLanes(node.childLanes, lane);
    node = node.return;
  }

  // 获取 root
  const root = getRootFromFiber(fiber);

  // 将 lane 加入 root 的 pendingLanes
  root.pendingLanes = mergeLanes(root.pendingLanes, lane);

  // 如果不是同步更新，调度任务
  if (lane !== SyncLane) {
    scheduleCallback(priorityLevel, performConcurrentWork);
  } else {
    // 同步更新，直接执行
    flushSyncCallbackQueue();
  }
}
```

### 7.2 performConcurrentWork

```typescript
// packages/react-reconciler/src/ReactFiberWorkLoop.new.js

function performConcurrentWork(root) {
  // 从 root 的 pendingLanes 中获取最高优先级
  const lanes = getHighestPriorityLane(root.pendingLanes);

  // 开始渲染
  const didFlush = renderRootConcurrent(root, lanes);

  if (didFlush) {
    // 渲染被刷新，检查是否还有工作
    if (root.pendingLanes !== NoLanes) {
      // 还有工作，继续调度
      return performConcurrentWork;
    }
  }

  return null;
}
```

### 7.3 renderRootConcurrent

```typescript
// packages/react-reconciler/src/ReactFiberWorkLoop.new.js

function renderRootConcurrent(root, lanes) {
  // 重置工作状态
  resetWorkInProgressTrees();

  // 开始工作循环
  do {
    workLoop();

    // 检查是否让出
    if (shouldYieldToHost()) {
      // 让出主线程
      return true;  // 表示工作未完成
    }
  } while (workInProgress !== null);

  return false;  // 工作完成
}
```

## 八、调度优化策略

### 8.1 批量更新合并

```typescript
// 同一时间内多次 setState 会被合并
function handleClick() {
  setCount(1);  // 第一次
  setCount(2);  // 第二次
  setCount(3);  // 第三次

  // 最终只会渲染一次，count = 3
}
```

### 8.2 任务中断与恢复

```typescript
// Scheduler 支持任务中断和恢复
function performUnitOfWork(fiber) {
  // 开始处理
  beginWork(fiber);

  // 如果需要中断，返回下一个工作单元
  if (shouldYieldToHost()) {
    return fiber.sibling;  // 返回但不完全完成
  }

  // 完成当前，继续下一个
  return completeUnitOfWork(fiber);
}
```

### 8.3 饥饿问题解决

低优先级任务可能永远得不到执行：

```typescript
// React 通过过期时间解决饥饿问题
function flushWork() {
  let task = peek(taskQueue);

  while (task !== null) {
    const callback = task.callback;
    const didUserCallbackTimeout = getCurrentTime() >= task.expirationTime;

    if (didUserCallbackTimeout) {
      // 即使应该让出，也要执行过期任务
      const continuation = callback(true);  // 传入 true 表示强制执行

      if (typeof continuation === 'function') {
        task.callback = continuation;
      } else {
        pop(taskQueue);
      }
    } else {
      // 正常检查是否让出
      if (shouldYieldToHost()) {
        break;
      }

      const continuation = callback(false);

      if (typeof continuation === 'function') {
        task.callback = continuation;
      } else {
        pop(taskQueue);
      }
    }

    task = peek(taskQueue);
  }
}
```

## 九、总结

### 9.1 核心要点

1. **最小堆队列**：使用最小堆管理任务，按过期时间排序
2. **Lane 模型**：位运算精确管理多优先级更新
3. **时间切片**：通过 MessageChannel 实现帧预算控制
4. **任务中断**：callback 返回继续函数实现中断恢复
5. **过期机制**：过期任务会被强制执行，避免饥饿

### 9.2 相关文件索引

| 文件 | 功能 |
|------|------|
| `packages/scheduler/src/Scheduler.js` | 核心调度逻辑 |
| `packages/scheduler/src/SchedulerMinHeap.js` | 最小堆实现 |
| `packages/scheduler/src/requestHostCallback.js` | 主机回调调度 |
| `packages/react-reconciler/src/ReactFiberLane.js` | Lane 模型定义 |
| `packages/react-reconciler/src/ReactFiberWorkLoop.js` | Fiber 工作循环 |

### 9.3 后续章节预告

- **React Server Components**：服务端组件的实现原理
