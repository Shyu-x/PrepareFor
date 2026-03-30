# React Fiber 底层架构与并发调度机制源码级解析

## 一、 概述：React 为什么要重写核心？

在 React 16 之前，渲染过程是**不可中断的同步过程（Stack Reconciler）**。如果组件树过于庞大，JS 主线程会长时间被占用，导致浏览器无法处理高优的用户输入（点击、输入），产生明显的卡顿感。

**Fiber 的使命**: 改变渲染引擎的底层逻辑，将“递归渲染”改为“可中断的迭代渲染”，实现**并发（Concurrency）**能力。

本文将深入 Fiber 树的构建过程、双缓存技术（Double Buffering）、时间切片（Time Slicing）以及 Lane 优先级模型。

## 二、 核心概念：Fiber 到底是什么？

### 2.1 作为静态数据结构
每个 React 元素对应一个 **Fiber 节点**，它保存了组件的类型、对应的 DOM 节点、Hooks 链表等信息。
```typescript
interface Fiber {
  tag: WorkTag;        // 标记组件类型 (Function, Class, HostRoot...)
  key: string | null;
  stateNode: any;      // 对应的真实 DOM 节点
  return: Fiber | null; // 指向父节点
  child: Fiber | null;  // 指向第一个子节点
  sibling: Fiber | null; // 指向下一个兄弟节点
  alternate: Fiber | null; // 指向“双缓存”中的另一个副本
}
```

### 2.2 作为动态工作单元
Fiber 节点记录了组件的状态变更和待执行的任务（Effect），是调度系统操作的基本单元。

## 三、 深度解析：Fiber 的三大支柱

### 3.1 双缓存技术 (Double Buffering)
React 在内存中同时维护两棵 Fiber 树：
1.  **current 树**: 对应当前屏幕上显示的内容。
2.  **workInProgress (WIP) 树**: 正在后台构建的新树。

**优势**: 当构建完成后，只需将 `root.current` 指针指向 WIP 树，即可完成 UI 刷新。如果渲染中途被中断，current 树依然完整。

### 3.2 时间切片 (Time Slicing)
React 利用 `requestIdleCallback` 的类似机制（底层由 `MessageChannel` 实现），在浏览器空闲时间内执行 Fiber 任务。
*   每执行一个 Fiber 节点的工作，都会检查是否还有剩余时间（通常为 5ms）。
*   若时间用尽，则将控制权交还给浏览器，并在下一帧继续。

### 3.3 Lane 优先级模型
React 不再使用简单的“数字优先级”，而是使用 **31 位二进制位（Lane）**。
*   **同步优先级 (SyncLane)**: 用户点击、输入等。
*   **连续交互优先级 (InputContinuousLane)**: 滚动、拖拽等。
*   **默认优先级 (DefaultLane)**: 网络请求、数据处理。
*   **空闲优先级 (IdleLane)**: 埋点上报。

**面试深度题**: 如何实现“高优任务插队”？
当高优任务（如点击）进入调度系统时，React 会通过位运算对比当前任务的 Lane。如果新任务优先级更高，React 会中止当前的 WIP 构建，优先处理高优任务。

## 四、 Fiber 的生命周期：两阶段模式

### 4.1 渲染阶段 (Render Phase)
*   **特点**: 异步、可中断、不产生副作用。
*   **过程**: 深度优先遍历 WIP 树，执行 `beginWork`（创建子节点）和 `completeWork`（收集 Effect）。

### 4.2 提交阶段 (Commit Phase)
*   **特点**: 同步、不可中断。
*   **过程**: 遍历 Effect 链表，执行真正的 DOM 操作，触发 `useEffect` 的清理与执行。

## 五、 实战练习：手写一个微缩版 Fiber 架构

**核心逻辑**: 实现一个基于 `requestIdleCallback` 的可中断循环。

```javascript
let nextUnitOfWork = null;

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    // 1. 执行当前 Fiber 节点的工作并返回下一个节点
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    // 2. 检查浏览器剩余时间
    shouldYield = deadline.timeRemaining() < 1;
  }
  requestIdleCallback(workLoop);
}

function performUnitOfWork(fiber) {
  // 模拟构建逻辑...
  console.log(`正在处理节点: ${fiber.name}`);
  // 返回 child 或 sibling...
}
```

## 六、 面试高频问题

1.  **Fiber 为什么采用链表结构而不是树的递归？**
    *   *答案*: 递归无法中断，必须一次性完成。链表结构可以通过保存当前节点的指针，实现“暂停-恢复”的迭代逻辑。
2.  **diff 算法在 Fiber 中是如何体现的？**
    *   *答案*: diff 发生在 `beginWork` 阶段。通过对比新旧 Fiber 节点（alternate），复用旧节点并标记 `Placement`、`Update` 或 `Deletion`。
3.  **为什么 React 18 的 Concurrent Mode 被称为“无感知升级”？**
    *   *答案*: 因为它保留了渲染语义，仅在调度层面通过 Lanes 模型实现了任务的非阻塞并发，开发者只需关注 `useTransition` 等声明式 API。

---
*本文由 Gemini CLI 撰写，深度解构 React 核心架构，直击大厂面试要害。*
