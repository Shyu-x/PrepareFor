# React 19 Fiber 架构深度解析完全指南

> **文档目标**：深入揭示 React 16 引入的 Fiber 架构，理解其如何将"递归式同步渲染"转变为"可中断的迭代渲染"，掌握 React 19 的并发特性与底层调度机制。
>
> **前置知识**：熟悉 React 组件生命周期、Hooks 基本用法、了解浏览器事件循环机制。
>
> **适合人群**：希望深入理解 React 底层原理的中高级前端工程师、准备 React 架构方向面试的开发者。

---

## 一、React 架构演进：从 Stack Reconciler 到 Fiber

### 1.1 浏览器帧率与 16.67ms 的生死线

在现代显示器（60Hz 刷新率）下，每一帧的完整生命周期仅有 **16.67 毫秒**。这短暂的时间窗口必须容纳以下所有任务：

```
┌─────────────────────────────────────────────────────────────────┐
│                     浏览器单帧时间预算 (16.67ms)                   │
├─────────────────────────────────────────────────────────────────┤
│  JS执行  │  样式计算  │   布局   │   绘制   │   合成   │  空闲   │
│ ~4-5ms  │  ~2-3ms   │ ~2-3ms  │ ~2-3ms  │ ~1-2ms  │  剩余   │
└─────────────────────────────────────────────────────────────────┘
```

如果 JavaScript 执行超过 16.67ms，就会导致掉帧，用户会感受到界面卡顿。这就是 React 15 时代面临的根本问题。

### 1.2 React 15：Stack Reconciler 的同步噩梦

React 15 采用的是**栈调和器（Stack Reconciler）**，其核心是一个递归调用栈：

```javascript
// React 15 调和器的伪代码逻辑
function reconcileChildren(children) {
  children.forEach((child, index) => {
    // 递归调用自身 —— 这是一个同步的深度优先遍历
    const newChild = reconcile(child);
    // 如果子节点还有子节点，继续递归...
    if (child.children) {
      reconcileChildren(child.children);
    }
  });
}
```

**致命问题**：
- 递归一旦开始，**无法中断**
- 如果组件树有 1000 个节点，每个节点处理耗时 0.1ms，总耗时就达到 100ms
- 这 100ms 内，主线程被完全阻塞，浏览器无法响应任何用户交互
- 结果就是用户点击按钮时，界面要等"渲染完成"才能响应

### 1.3 React 16：Fiber 的破局之道

Facebook 团队在 2017 年开始了 React 16 的开发，决定从底层重写调和器。Fiber 的核心思想是：

> **将递归调用栈转化为链表结构，实现"暂停-恢复"机制**

```
Stack Reconciler (React 15):        Fiber Reconciler (React 16+):
┌─────────────────────┐              ┌─────────────────────┐
│ 递归调用栈           │              │ 可中断的工作循环     │
├─────────────────────┤              ├─────────────────────┤
│                     │              │                     │
│  ┌───┐              │              │  while (work) {     │
│  │ A │ ← 递归调用    │              │    node = doWork()  │
│  └───┘              │              │    if (shouldYield) │ ← 可中断
│    └───┬───┐        │              │      yield;         │
│        │ B │        │              │  }                  │
│        └───┘        │              │                     │
│          └───┬───┐   │              │  链表结构:          │
│              │ C │  │              │  A → B → C → ...   │
│              └───┘  │              │                     │
└─────────────────────┘              └─────────────────────┘
```

### 1.4 React 17：Concurrent Mode 的奠基

React 17 并没有带来太多新特性，但它完成了以下关键任务：

1. **Fragment 的改进**：支持 `return <><Component /></>` 语法
2. **Effect Cleanup 的延期**：将 cleanup 执行从同步改为异步
3. **Suspense 的完善**：为 Concurrent Mode 铺路
4. **新的 JSX Transform**：不再需要 React 在作用域内

React 17 的真正意义在于它是**第一个支持渐进式升级的版本**，用户可以部分使用 Concurrent Mode 特性。

### 1.5 React 18：并发渲染的真正降临

React 18 引入了完整的 **Concurrent Rendering（并发渲染）** 能力：

| 特性 | 说明 | 底层支持 |
|------|------|----------|
| **Automatic Batching** | 自动批量更新，无需手动 `flushSync` | 微任务批处理增强 |
| **useTransition** | 标记非紧急更新 | Lane 优先级调度 |
| **useDeferredValue** | 延迟值更新 | Time Slicing |
| **Suspense on Server** | 服务端 Suspense | 流式 SSR |
| **Offscreen API (Activity)** | 后台保持组件状态 | IdleLane |

### 1.6 React 19：Compiler 与新时代

React 19 带来了革命性的 **React Compiler**（代号 Forget）：

- **静态分析**：编译器自动分析组件的纯度
- **自动优化**：自动插入 `useMemo`、`useCallback`
- **Bailout 自动化**：组件更新判断由编译器完成

同时，React 19 引入了 `use()`、`useOptimistic`、`useActionState` 等新的 Hook，进一步简化了状态管理。

---

## 二、Fiber 架构核心：虚拟栈帧的设计

### 2.1 Fiber 的本质：重新定义"调用栈"

Fiber 的设计受到**协程（Coroutine）和生成器（Generator）**的启发，但实现更为精妙。

在传统的函数调用中，每次调用都会创建一个**栈帧（Stack Frame）**，包含：
- 函数的局部变量
- 返回地址
- 保存的寄存器状态

Fiber 则是**在堆（Heap）上手动模拟栈帧的行为**，允许：
- 手动控制执行顺序
- 在任意点暂停
- 恢复时从暂停点继续

### 2.2 Fiber 节点的完整数据结构

以下是 React 19 中 Fiber 节点的 TypeScript 类型定义（来自 react-reconciler 包的核心类型）：

```typescript
/**
 * Fiber 节点 - React 内部用于追踪组件状态的核心数据结构
 *
 * 设计思想：
 * 1. 静态结构：保存组件信息
 * 2. 动态工作：记录待执行的任务
 * 3. 链表结构：实现可中断遍历
 */
interface Fiber {
  // ============================================
  // 第一部分：标识与类型信息
  // ============================================
  tag: WorkTag;                    // 组件类型标签
  key: null | string;              // 列表中元素的唯一标识（用于 diff）
  elementType: any;                // 元素的类型（如 'div'、Component 函数）
  type: any;                       // 组件类型（函数组件本身、类组件类）

  // ============================================
  // 第二部分：链表结构（Fiber 架构的核心）
  // ============================================
  // 这三个指针形成了"深度优先遍历"的路径图
  return: Fiber | null;            // 父节点 - 完成工作后返回的地址
  child: Fiber | null;             // 第一个子节点 - 向下遍历的入口
  sibling: Fiber | null;           // 下一个兄弟节点 - 横向扩展
  index: number;                   // 在父节点 children 中的索引

  // ============================================
  // 第三部分：Props 与状态
  // ============================================
  pendingProps: any;               // 新的 props（即将应用的）
  memoizedProps: any;              // 上一次渲染使用的 props
  memoizedState: any;              // 上一次渲染的状态（Hook 链表存储于此）

  // ============================================
  // 第四部分：更新队列
  // ============================================
  updateQueue: UpdateQueue<any> | null;  // 该 Fiber 的更新队列

  // ============================================
  // 第五部分：副作用（Effect）标记
  // ============================================
  // flags 记录了该节点需要执行的操作类型
  flags: Flags;                    // 当前节点的副作用
  subtreeFlags: Flags;             // 子树所有副作用的汇总（用于优化）
  deletions: Array<Fiber> | null;   // 需要删除的子节点列表

  // ============================================
  // 第六部分：优先级与调度
  // ============================================
  lanes: Lanes;                    // 当前 Fiber 的优先级位图
  childLanes: Lanes;              // 子树的优先级位图
  alternate: Fiber | null;         // 双缓存：指向另一棵树中的对应节点

  // ============================================
  // 第七部分：调试信息
  // ============================================
  _debugSource?: {                 // 源码位置信息
    fileName: string;
    lineNumber: number;
    columnNumber: number;
  };
  _debugOwner?: Fiber;             // 指向创建该 Fiber 的组件
  _debugID?: number;                // 调试用 ID
}
```

### 2.3 链表结构的精妙设计

Fiber 节点的三个指针（`child`、`sibling`、`return`）形成了一个高效的遍历结构：

```
遍历顺序演示：

<div> {/* HostRoot */}
  <header> {/* child: Header */}
    <h1>Title</h1>    {/* sibling */}
    <nav>Links</nav>   {/* sibling */}
  </header>
  <main> {/* sibling */}
    <article>Content</article>  {/* child */}
  </main>
</div>

遍历顺序: Root → Header → h1 → nav → main → article

链表结构关系:
┌──────────┐      child      ┌──────────┐
│   Root   │ ──────────────→ │  Header   │
└──────────┘                 └──────────┘
     │                            │
     │ sibling                    │ sibling
     ▼                            ▼
   null                    ┌──────────┐
                           │    h1    │
                           └──────────┘
                                │
                                │ sibling
                                ▼
                           ┌──────────┐
                           │   nav    │
                           └──────────┘
                                │
     return                     │ sibling
     ┌────────┐                 ▼
     │   ↓    │            ┌──────────┐
     │  Root  │ ←───────── │   main   │
     └────────┘   return   └──────────┘
                            │
                            │ child
                            ▼
                       ┌──────────┐
                       │  article │
                       └──────────┘
```

**为什么这样设计？**

1. **child**：向下遍历的入口，每次只指向第一个子节点
2. **sibling**：实现兄弟节点之间的连接，避免树的深度过深
3. **return**：完成当前节点后，指向父节点，用于回溯

### 2.4 双缓存技术：current vs workInProgress

React 在内存中同时维护**两棵 Fiber 树**：

```
┌─────────────────────────────────────────────────────────────┐
│                    React 双缓存架构                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│    ┌─────────────────┐         ┌─────────────────┐         │
│    │   Current Tree  │         │  WorkInProgress │         │
│    │   (屏幕上显示)   │         │   (正在构建)     │         │
│    └────────┬────────┘         └────────┬────────┘         │
│             │                           │                   │
│             │  alternate               │  alternate        │
│             │ ════════════════════════│                   │
│             │                           │                   │
│             ▼                           ▼                   │
│    ┌─────────────────┐         ┌─────────────────┐         │
│    │   Fiber A      │◄───────►│   Fiber A (WIP)  │         │
│    │   (已提交)      │         │   (构建中)       │         │
│    └────────┬────────┘         └────────┬────────┘         │
│             │                           │                   │
│             │ child                     │ child             │
│             ▼                           ▼                   │
│    ┌─────────────────┐         ┌─────────────────┐         │
│    │   Fiber B      │◄───────►│   Fiber B (WIP)  │         │
│    │   (已提交)      │         │   (构建中)       │         │
│    └─────────────────┘         └─────────────────┘         │
│                                                             │
│    【切换时机】                                              │
│    当 WIP 树完成构建后，React 会：                          │
│    1. 将 root.current 指向 WIP 树                          │
│    2. 原 current 树成为新的 WIP 树                          │
│    3. 交换 alternate 指针                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**双缓存的优势**：

1. **原子更新**：构建和显示可以分离，保证 UI 不会显示"半成品"
2. **快速回滚**：如果渲染被中断，原 current 树保持完整
3. **复用节点**：新旧 Fiber 通过 `alternate` 指针关联，减少内存分配

### 2.5 alternate 指针的精妙之处

```typescript
// 创建 workInProgress Fiber 的核心逻辑
function createWorkInProgress(current: Fiber, pendingProps: any): Fiber {
  // 尝试复用已有的 alternate
  let workInProgress = current.alternate;

  if (workInProgress === null) {
    // 首次创建：创建新的 Fiber 节点
    workInProgress = createFiber(
      current.tag,      // 使用相同类型
      pendingProps,
      current.key,
      current.mode
    );
    // 建立双向链接
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    // 复用：更新属性
    workInProgress.pendingProps = pendingProps;
    workInProgress.type = current.type;
    // 重置副作用标记
    workInProgress.flags = NoFlags;
    workInProgress.subtreeFlags = NoFlags;
    workInProgress.deletions = null;
  }

  return workInProgress;
}
```

---

## 三、Fiber 渲染流程：两阶段模型的奥秘

### 3.1 阶段划分总览

React 的渲染流程严格分为两个阶段：

```
┌─────────────────────────────────────────────────────────────────┐
│                    React 渲染两阶段模型                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Phase 1: Render (调和阶段)                 │    │
│  │                                                         │    │
│  │  ★ 可中断 ★ 异步 ★ 不产生副作用                          │    │
│  │                                                         │    │
│  │  beginWork → completeWork → ...                         │    │
│  │     ↓            ↓                                      │    │
│  │  创建子Fiber   收集Effect                               │    │
│  │                                                         │    │
│  │  【目的】：计算 UI 差异，决定需要做什么更新               │    │
│  │  【结果】：生成 workInProgress 树，标记 flags            │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           │                                     │
│                           │ render 完成                         │
│                           ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Phase 2: Commit (提交阶段)                  │    │
│  │                                                         │    │
│  │  ✗ 不可中断 ✗ 同步 ✗ 产生真实副作用                       │    │
│  │                                                         │    │
│  │  BeforeMutation → Mutation → Layout                     │    │
│  │                                                         │    │
│  │  【目的】：执行真实的 DOM 操作                           │    │
│  │  【结果】：DOM 更新，触发 useEffect/useLayoutEffect     │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Render 阶段深度解析

#### 3.2.1 beginWork 函数族

`beginWork` 是处理每个 Fiber 节点"开始工作"的入口函数，它根据组件类型分发到不同的处理函数：

```typescript
/**
 * beginWork - 深度优先遍历的开始
 *
 * @param current - 当前屏幕显示的 Fiber（来自 current 树）
 * @param workInProgress - 正在构建的 Fiber（来自 WIP 树）
 * @param renderLanes - 本次渲染的优先级车道
 * @returns - 下一个待处理的 Fiber 节点
 */
function beginWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes
): Fiber | null {
  // 1. 更新子树的优先级位图
  workInProgress.lanes = renderLanes;

  // 2. 根据组件类型分发处理
  switch (workInProgress.tag) {
    case IndeterminateComponent:
      // 初始渲染时不确定是函数组件还是类组件
      return mountIndeterminateComponent(
        current, workInProgress, workInProgress.type, renderLanes
      );

    case FunctionComponent:
      // 函数组件
      return updateFunctionComponent(current, workInProgress, renderLanes);

    case ClassComponent:
      // 类组件
      return updateClassComponent(current, workInProgress, renderLanes);

    case HostRoot:
      // 根节点
      return updateHostRoot(current, workInProgress, renderLanes);

    case HostComponent:
      // DOM 元素（如 <div>、<span>）
      return updateHostComponent(current, workInProgress, renderLanes);

    case HostText:
      // 文本节点
      return updateHostText(current, workInProgress);

    // ... 其他类型
  }
}
```

#### 3.2.2 reconcileChildren 调和算法

对于需要更新的子节点，React 调用 `reconcileChildren` 来创建或复用 Fiber：

```typescript
/**
 * reconcileChildren - 调和子节点的核心算法
 *
 * @param current - 当前子 Fiber
 * @param workInProgress - 父级 WIP Fiber
 * @param nextChildren - 新的子 React Elements
 */
function reconcileChildren(
  current: Fiber | null,
  workInProgress: Fiber,
  nextChildren: any
) {
  // 如果没有 current（首次渲染），创建新的子 Fiber
  if (current === null) {
    workInProgress.child = mountChildFibers(
      workInProgress,  // 父节点
      null,           // 没有旧 Fiber 可复用
      nextChildren    // 新创建的 React Elements
    );
  } else {
    // 存在 current（更新渲染），进行 diff
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,   // 旧的子 Fiber
      nextChildren     // 新的 React Elements
    );
  }
}
```

#### 3.2.3 diff 算法详解：Key 的力量

React 的 diff 算法遵循三个原则：

1. **类型不同的节点**：直接卸载重建
2. **类型相同的节点**：复用现有 Fiber（通过 `alternate`）
3. **列表节点**：通过 `key` 进行匹配

```typescript
/**
 * reconcileChildFibers - diff 算法的核心实现
 *
 * @param returnFiber - 父级 Fiber
 * @param currentFirstChild - 旧树中的第一个子 Fiber
 * @param newChild - 新树中的 React Element
 * @returns - 新树中的第一个子 Fiber
 */
function reconcileChildFibers(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChild: any
): Fiber | null {
  // 1. 处理单个子节点
  if (!isArray(newChild)) {
    return placeSingleChild(
      returnFiber,
      reconcileSingleChild(returnFiber, currentFirstChild, newChild)
    );
  }

  // 2. 处理数组（列表）
  // 这是 key 发挥作用的地方
  if (newChild.$$typeof === REACT_ELEMENT_ARRAY_TYPE) {
    return reconcileChildArray(
      returnFiber,
      currentFirstChild,
      newChild
    );
  }
}

/**
 * reconcileChildArray - 列表 diff 的核心算法
 *
 * 算法思路：O(n) 时间复杂度
 * 1. 优先处理有 key 的节点
 * 2. 使用"最后位置原则"优化移动
 */
function reconcileChildArray(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChildren: Array<any>
): Fiber | null {
  let resultingFirstChild: Fiber | null = null;  // 结果链表的头
  let previousNewFiber: Fiber | null = null;       // 已处理的新 Fiber

  let oldFiber = currentFirstChild;    // 旧 Fiber 指针
  let lastPlacedIndex = 0;             // 上次放置的位置
  let newIdx = 0;                      // 新数组索引
  let nextOldFiber = null;

  // 第一轮：遍历新数组，与旧 Fiber 进行匹配
  for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
    // 1. 获取新元素的 key
    const newChild = newChildren[newIdx];
    const key = newChild.key || String(newIdx);

    // 2. 尝试通过 key 匹配旧 Fiber
    if (oldFiber.key === key) {
      // key 相同，进一步比较 type
      if (oldFiber.type === newChild.type) {
        // 类型相同 → 复用 Fiber
        const existing = useFiber(oldFiber, newChild.props);
        existing.return = returnFiber;
        oldFiber = oldFiber.sibling;  // 移动到下一个旧 Fiber
        continue;
      } else {
        // key 相同但 type 不同 → 标记删除
        deleteChild(returnFiber, oldFiber);
        oldFiber = oldFiber.sibling;
        continue;
      }
    } else {
      // key 不同 → 标记删除，尝试下一个旧 Fiber
      deleteChild(returnFiber, oldFiber);
      oldFiber = oldFiber.sibling;
      newIdx--;  // 新数组索引回退，重新匹配
    }
  }

  // 第二轮：新数组已遍历完，删除剩余的旧 Fiber
  if (newIdx === newChildren.length) {
    deleteRemainingChildren(returnFiber, oldFiber);
    return resultingFirstChild;
  }

  // 第三轮：旧 Fiber 已耗尽，创建剩余的新 Fiber
  if (oldFiber === null) {
    for (; newIdx < newChildren.length; newIdx++) {
      const newFiber = createChild(returnFiber, newChildren[newIdx]);
      // ... 插入链表
    }
  }

  return resultingFirstChild;
}
```

### 3.3 Commit 阶段深度解析

#### 3.3.1 三个子阶段

```typescript
/**
 * commitRoot - 提交阶段的入口函数
 *
 * 严格分为三个子阶段：
 * 1. beforeMutation - DOM 变更前的快照
 * 2. mutation - 真实的 DOM 操作
 * 3. layout - DOM 变更后的布局 effect
 */
function commitRoot(root: FiberRootNode) {
  const finishedWork = root.finishedWork;

  // 重置更新优先级
  root.callbackNode = null;
  root.callbackId = NoLanes;

  // 获取有副作用的 Fiber 列表
  const subtreeHasEffects = (finishedWork.subtreeFlags & MutationMask) !== NoFlags;
  const rootHasEffects = (finishedWork.flags & MutationMask) !== NoFlags;

  if (subtreeHasEffects || rootHasEffects) {
    // ========== Phase 1: BeforeMutation ==========
    // 执行 getSnapshotBeforeUpdate
    commitBeforeMutationEffects(root, finishedWork);

    // ========== Phase 2: Mutation ==========
    // 执行真实的 DOM 操作
    commitMutationEffects(root, finishedWork, committedLanes);

    // ========== Phase 3: Layout ==========
    // 执行 useLayoutEffect 和 React DOM 绑定
    root.current = finishedWork;  // 切换 current 指针
    commitLayoutEffects(root, finishedWork);

  } else {
    // 没有副作用，直接切换指针
    root.current = finishedWork;
  }
}
```

#### 3.3.2 Mutation 阶段的 DOM 操作

```typescript
/**
 * commitMutationEffects - Mutation 阶段的核心
 *
 * 根据 fiber.flags 执行不同的 DOM 操作：
 * - Placement: 插入新节点
 * - Update: 更新现有节点
 * - Deletion: 删除节点
 */
function commitMutationEffects(
  root: FiberRootNode,
  finishedWork: Fiber,
  renderPriorityLevel: ReactPriorityLevel
) {
  let flags = finishedWork.flags;

  // 1. 处理自身节点的 Placement
  if (flags & Placement) {
    commitPlacement(finishedWork);
    // 移除 Placement 标志，避免重复执行
    finishedWork.flags &= ~Placement;
  }

  // 2. 处理 Update
  if (flags & Update) {
    commitUpdate(finishedWork);
    finishedWork.flags &= ~Update;
  }

  // 3. 处理 Deletion（需要递归处理子树）
  if (flags & Deletion) {
    commitDeletion(finishedWork);
  }

  // 4. 递归处理子树的副作用
  if (finishedWork.subtreeFlags & MutationMask) {
    commitMutationEffectsOnFiber(finishedWork);
  }
}

/**
 * commitPlacement - 将 DOM 节点插入到容器中
 */
function commitPlacement(finishedWork: Fiber): void {
  const parent = finishedWork.return?.stateNode;
  const before = getHostSibling(finishedWork.sibling);

  if (parent) {
    // 获取真实的 DOM 节点
    const domNode = finishedWork.stateNode;

    if (before) {
      // 插入到某个兄弟节点之前
      insertChild(parent, domNode, before);
    } else {
      // 追加到父节点末尾
      appendChild(parent, domNode);
    }
  }
}
```

---

## 四、Fiber 调度器：lanes 模型与优先级

### 4.1 从简单优先级到 Lane 模型

React 早期版本使用简单的数字优先级：

```typescript
// React 早期版本的优先级（已废弃）
const Priority = {
  ImmediatePriority: 1,      // 最高优先级（同步）
  UserBlockingPriority: 2,   // 用户阻塞优先级
  NormalPriority: 3,        // 正常优先级
  LowPriority: 4,            // 低优先级
  IdlePriority: 5,            // 空闲优先级
};
```

但这种方式存在问题：**无法同时处理多个同优先级的任务**。

React 16 引入了 **Lane 模型（车道模型）**，使用 **31 位二进制位** 表示优先级：

```
lane 模型示意图：

二进制位:  31  30  29  ...  3   2   1   0
           │   │   │       │   │   │   │
           ▼   ▼   ▼       ▼   ▼   ▼   ▼
          ┌───┬───┬───┬───┬───┬───┬───┬───┐
          │   │   │   │   │   │   │   │   │
          └───┴───┴───┴───┴───┴───┴───┴───┘
            │                           │
            └── 优先级位图 (Lanes) ──────┘

每一位代表一个独立的"车道"，可以同时存在多个车道！

实际定义（react-reconciler）：
const SyncLane: Lanes = 0b0000000000000000000000000000001;  // 第0位
const InputContinuousLane: Lanes = 0b0000000000000000000000000001000;  // 第3位
const DefaultLane: Lanes = 0b0000000000000000000000000010000;  // 第4位
const TransitionLane1: Lanes = 0b0000000000000000010000000000000;  // 第10位
const IdleLane: Lanes = 0b0100000000000000000000000000000;  // 第30位
```

### 4.2 优先级的层级定义

```typescript
/**
 * React 19 的 Lane/Priority 层级定义
 */
export const Lanes = {
  // 同步优先级 - 立即执行
  // 触发场景：onClick、onChange、useState 的第一个参数
  SyncLane: 1 << 0,  // 0b00001

  // 连续输入优先级 - 高频交互
  // 触发场景：scroll 拖拽、animation
  InputContinuousLane: 1 << 3,  // 0b01000

  // 默认优先级 - 常规更新
  // 触发场景：useEffect、useTransition、useDeferredValue
  DefaultLane: 1 << 4,  // 0b10000

  // Transition 优先级 - 可中断更新
  // 触发场景：React 18 useTransition、React 19 useOptimistic
  TransitionLane: 1 << 10,  // 0b100000000000

  // 挂起优先级 - Suspense
  SuspenseLane: 1 << 12,

  // 空闲优先级 - 最低优先级
  // 触发场景：日志上报、预加载
  IdleLane: 1 << 30,  // 0b0100000000000000000000000000000
};

// Lane 之间的包含关系
export function includesLane(lanes: Lanes, lane: Lanes): boolean {
  return (lanes & lane) !== 0;
}

// 获取最高优先级
export function getHighestPriorityLane(lanes: Lanes): Lanes {
  return lanes & -lanes;  // 取最低位的 1
}
```

### 4.3 时间切片机制

React 使用**时间切片（Time Slicing）**来保证渲染不会阻塞主线程：

```typescript
/**
 * Scheduler 的核心工作循环
 *
 * 策略：使用 MessageChannel 在每一帧的末尾执行任务
 * 这样可以确保 React 任务不会影响浏览器的渲染和交互
 */
let taskQueue: Array<Task> = [];
let deadline: IdleDeadline = null;

// 1. 向调度器添加任务
function scheduleCallback(priorityLevel: PriorityLevel, callback: () => void) {
  const task = {
    id: ++taskIdCounter,
    callback,
    priorityLevel,
    startTime: getCurrentTime(),
    expirationTime: startTime + timeoutForPriorityLevel(priorityLevel),
  };

  taskQueue.push(task);
  taskQueue.sort((a, b) => a.expirationTime - b.expirationTime);

  // 请求下一帧
  requestHostCallback(flushWork);
}

// 2. 工作循环 - 每次执行一小块
function flushWork(deadline: IdleDeadline) {
  // 优化：尽量多执行任务，但不要超过 5ms
  while (taskQueue.length > 0) {
    const now = getCurrentTime();

    // 检查是否还有剩余时间
    if (deadline.timeRemaining() > 1 && now < taskQueue[0].expirationTime) {
      const task = taskQueue.pop();
      const callback = task.callback;

      // 执行任务
      const didMoreWork = callback(deadline);

      if (!didMoreWork) {
        // 任务完成或被高优先级打断
        break;
      }
    } else {
      // 时间耗尽，让出主线程
      requestHostCallback(flushWork);
      break;
    }
  }
}

// 3. React 内部的 Fiber 工作循环
function workLoopConcurrent() {
  // 在有可用时间时执行工作
  while (workInProgress !== null && !shouldYield()) {
    workInProgress = performUnitOfWork(workInProgress);
  }
}

/**
 * shouldYield - 判断是否应该让出主线程
 *
 * 实现原理：
 * 1. 首先检查是否有更高优先级的 Lane 等待处理
 * 2. 如果有，直接让出
 * 3. 如果没有，检查当前帧的剩余时间
 */
function shouldYield(): boolean {
  // 优先级更高的 Lane 正在等待
  if (highestPriorityLane !== currentLane) {
    return true;
  }

  // 当前帧时间耗尽
  if (getCurrentTime() >= deadline) {
    return true;
  }

  return false;
}
```

### 4.4 饥饿问题与解决策略

**饥饿问题（Starvation）**：低优先级的任务可能永远无法执行，因为不断被高优先级任务打断。

```
饥饿问题演示：

时间 →→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→
        │
        ├── 高优先级任务不断插入 ──┤
        │
        ▼
低优先级任务 ── NEVER EXECUTES ──▶

解决方案：React 使用"优先级提升"策略
- 如果低优先级任务等待太久
- React 会将其优先级临时提升
- 确保所有任务都有机会执行
```

React 的解决策略：

```typescript
/**
 * 防止饥饿：调度器会定期检查低优先级任务
 * 如果等待时间超过阈值，自动提升其优先级
 */
function scheduleCallbackWithExpirationTime(
  fiber: Fiber,
  expirationTime: ExpirationTime
) {
  // 记录任务开始时间
  const startTime = getCurrentTime();

  // 如果任务等待时间超过 500ms，提升其优先级
  if (startTime - fiber.lastRenderTime > 500) {
    // 将任务添加到更高优先级的队列
    requestTaskForFiber(fiber, getHighPriorityQueue());
  }
}
```

### 4.5 批量更新机制

**批量更新（Batching）**：将多个状态更新合并为一次渲染。

```
批量更新示意：

场景：用户在一次点击中调用了三次 setState

without batching (React ≤ 17):      with batching (React 18+):
┌────────────────────┐            ┌────────────────────┐
│ setState(1)         │            │ setState(1)        │
│ → render           │            │ → 放入更新队列      │
├────────────────────┤            ├────────────────────┤
│ setState(2)         │            │ setState(2)         │
│ → render           │            │ → 放入更新队列      │
├────────────────────┤            ├────────────────────�parameter
│ setState(3)         │            │ setState(3)         │
│ → render           │            │ → 放入更新队列      │
└────────────────────┘            ├────────────────────┤
        │                          │ (点击事件结束)      │
        ▼                          │ → 批量执行一次render│
   3 次 render                      └────────────────────┘
                                              │
                                              ▼
                                        1 次 render
```

React 18 之前，批量更新只限于 React 事件处理器。
React 18 之后，**自动批量更新（Automatic Batching）**扩展到了所有场景：

```typescript
// React 18 之前
button.onclick = () => {
  setCount(1);  // render
  setName('a'); // render - 不同步！
};

// React 18 之后
button.onclick = () => {
  setCount(1);  // 放入队列
  setName('a'); // 放入队列
  // 在事件结束时批量执行
};

// Promise、setTimeout 中的批量更新
// React 18 之前：不批量
// React 18 之后：自动批量
useEffect(() => {
  fetch('/api').then(() => {
    setData(data);  // 也会被批量！
  });
}, []);

// 强制同步：flushSync
import { flushSync } from 'react-dom';
flushSync(() => {
  setCount(1);  // 立即渲染
});
```

---

## 五、状态更新流程：setState 到 render 的完整旅程

### 5.1 setState 触发更新的完整链路

```
setState 完整流程图：

┌─────────────────────────────────────────────────────────────────┐
│                    setState 完整流程                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  用户点击 → setState('new value')                               │
│      │                                                         │
│      ▼                                                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 1. 创建 Update 对象                                      │    │
│  │                                                         │    │
│  │ const update = {                                        │    │
│  │   lane: SyncLane,      // 优先级                        │    │
│  │   action: 'new value', // 新的值                        │    │
│  │   eagerReducer: null,  // 提前执行的 reducer            │    │
│  │ };                                                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│      │                                                         │
│      ▼                                                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 2. 入队到 updateQueue                                   │    │
│  │                                                         │    │
│  │ updateQueue = {                                        │    │
│  │   baseState: {count: 0},                              │    │
│  │   firstUpdate: update1,                               │    │
│  │   lastUpdate: update2,                                 │    │
│  │   shared: {pending: update3},                         │    │
│  │ };                                                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│      │                                                         │
│      ▼                                                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 3. 调度优先级（scheduleUpdateOnFiber）                   │    │
│  │                                                         │    │
│  │ - 检查当前是否有正在执行的任务                            │    │
│  │ - 如果有，判断新更新的优先级                              │    │
│  │ - 如果新更新优先级更高，中断当前任务                      │    │
│  │ - 将任务添加到 scheduler 的 taskQueue                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│      │                                                         │
│      ▼                                                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 4. Render 阶段（performSyncWorkOnRoot /                  │    │
│  │                    performConcurrentWorkOnRoot）         │    │
│  │                                                         │    │
│  │ - 深度优先遍历 WIP 树                                    │    │
│  │ - beginWork: 创建/复用 Fiber                             │    │
│  │ - completeWork: 收集 DOM 更新                            │    │
│  │ - 计算新的 state（processUpdateQueue）                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│      │                                                         │
│      ▼                                                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 5. Commit 阶段                                           │    │
│  │                                                         │    │
│  │ BeforeMutation → Mutation → Layout                      │    │
│  │ - 执行真实的 DOM 操作                                    │    │
│  │ - 调用 useLayoutEffect                                   │    │
│  │ - 调用 useEffect                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│      │                                                         │
│      ▼                                                         │
│  屏幕更新 ✓                                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Update 对象的创建

```typescript
/**
 * 创建 Update 对象的核心逻辑
 * 位于 react-reconciler/src/ReactUpdateQueue.new.js
 */
export function createUpdate(eventTime: number, lane: Lane): Update<any, any> {
  return {
    // 优先级车道
    lane: lane,

    // 更新类型
    tag: UpdateState,

    // 新的值或 reducer
    payload: null,
    callback: null,

    // 用于链表遍历
    next: null,

    // 时间（用于饥饿检测）
    eventTime: eventTime,
  };
}

/**
 * enqueueUpdate - 将 Update 添加到队列
 */
function enqueueUpdate<State>(
  fiber: Fiber,
  update: Update<State, any>
) {
  const updateQueue = fiber.updateQueue;
  if (updateQueue === null) {
    return;
  }

  const sharedQueue = updateQueue.shared;

  // 环形链表的尾插法
  if (sharedQueue.pending === null) {
    // 只有一个更新时，指向自己
    update.next = update;
  } else {
    // 多个更新时，插入到 pending 之后
    update.next = sharedQueue.pending.next;
    sharedQueue.pending.next = update;
  }

  sharedQueue.pending = update;
}

/**
 * processUpdateQueue - 计算新的 state
 *
 * 这是 useState 和 useReducer 共享的 state 计算逻辑
 */
function processUpdateQueue<State>(
  workInProgress: Fiber,
  queue: UpdateQueue<State>,
  renderLanes: Lanes
): { memoizedState: State, baseState: State } {
  let pendingUpdates = queue.pending;

  // 遍历环形链表
  let newState = queue.baseState;
  let newBaseState = null;
  let newBaseQueue: Update<any, any> | null = null;

  while (pendingUpdates !== null) {
    const update = pendingUpdates;
    const updateLane = update.lane;

    if (updateLane === renderLanes) {
      // 同优先级，直接应用
      newState = reducer(newState, update.action);
    } else {
      // 不同优先级，添加到 baseQueue 稍后处理
      if (newBaseQueue === null) {
        newBaseQueue = update;
        newBaseState = newState;
      } else {
        // 链接到 baseQueue
        update.next = newBaseQueue;
        newBaseQueue = update;
      }
    }

    pendingUpdates = pendingUpdates.next;
  }

  return { memoizedState: newState, baseState: newBaseState };
}
```

### 5.3 优先级调度详解

```typescript
/**
 * scheduleUpdateOnFiber - 调度更新的核心函数
 *
 * 关键逻辑：
 * 1. 如果正在 render 阶段，检查是否可以打断
 * 2. 如果正在 commit 阶段，直接完成
 * 3. 否则，添加到调度队列
 */
function scheduleUpdateOnFiber(
  fiber: Fiber,
  lane: Lane,
  eventTime: number
) {
  // 1. 从当前 Fiber 向上冒泡到根节点
  // 同时合并子树的 lanes
  let root = markUpdateLaneFromFiberToRoot(fiber, lane, eventTime);

  if (root === null) {
    // 没有任何更新
    return;
  }

  // 2. 检查是否需要打断当前的 render
  if (workInProgressRoot !== null) {
    const workInProgressRootRenderLanes = workInProgressRootRenderLanes;

    // 如果当前渲染的优先级不包含新更新的优先级
    if (!includesLane(workInProgressRootRenderLanes, lane)) {
      // 打断当前渲染
      root.callbackNode = null;
      root.callbackId = NoLanes;

      // 取消当前的 render
      cancelConcurrentRender();

      // 调度新的 render
      requestUpdateOnRoot(root, lane, eventTime);
    }
  }

  // 3. 尝试将更新合并到当前正在进行的 render 中
  if (root === workInProgressRoot) {
    // 正在 render 当前根
    if (deferRenderPhaseUpdateToNextBatch) {
      // 延迟到下一批次
      return;
    }
  }

  // 4. 调度新的 render
  ensureRootIsScheduled(root, eventTime);
}

/**
 * ensureRootIsScheduled - 确保根节点被调度
 *
 * 核心逻辑：
 * 1. 如果有正在调度的任务，更新其优先级
 * 2. 如果没有，创建一个新的调度任务
 */
function ensureRootIsScheduled(root: FiberRootNode, eventTime: number) {
  const existingCallback = root.callbackNode;

  // 1. 获取最高优先级的 lane
  const nextLanes = getNextLanes(
    root,
    root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes
  );

  // 2. 如果没有待处理的更新，取消调度
  if (nextLanes === NoLanes) {
    if (existingCallback !== null) {
      cancelCallback(existingCallback);
    }
    root.callbackNode = null;
    root.callbackId = NoLanes;
    return;
  }

  // 3. 计算截止时间
  const expirationTime = getEarliestExpirationTime(nextLanes);

  // 4. 如果有现成的调度，更新优先级
  if (existingCallback !== null) {
    const existingPriority = root.callbackPriority;
    const newPriority = getCurrentPriorityLevel();

    if (existingPriority === newPriority) {
      // 优先级相同，复用现有调度
      return;
    }

    // 优先级不同，取消现有调度
    cancelCallback(existingCallback);
  }

  // 5. 创建新的调度
  const newCallback = scheduleSyncCallback(
    performSyncOnRoot.bind(null, root)
  );

  root.callbackNode = newCallback;
  root.callbackId = root.nextCallbackId++;
}
```

---

## 六、Hook 数据结构：链表与状态管理

### 6.1 Fiber 上的 Hook 存储

函数组件的 `memoizedState` 属性存储着一个 **Hook 链表**：

```typescript
/**
 * Hook 的数据结构
 */
interface Hook {
  memoizedState: any;        // 存储的具体值（state、reducer 结果）
  baseState: any;            // 基础状态（处理中断后恢复）
  baseQueue: Update<any, any> | null;  // 未处理的更新队列
  queue: UpdateQueue<any, any> | null;  // 待处理的更新队列

  next: Hook | null;         // 指向下一个 Hook
}

/**
 * Fiber 上的 Hook 链表结构
 *
 * memoizedState 指向第一个 Hook
 * 每个 Hook 的 next 指向下一个 Hook
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    Fiber.memoizedState                       │
 * │                           │                                 │
 * │                           ▼                                 │
 * │  ┌──────────┐    next     ┌──────────┐    next     ┌──────────┐
 * │  │ useState │ ──────────→  │ useState │ ──────────→ │  useEffect│
 * │  │    0     │             │    1     │             │    2     │
 * │  └──────────┘             └──────────┘             └──────────┘
 * │       │                                                 │
 * │       ▼                                                 ▼
 * │   状态值 0                                          Effect链表
 * │                                                         │
 * └─────────────────────────────────────────────────────────┘
 */
```

### 6.2 useState 的底层实现

```typescript
/**
 * useState 的实现（简化版）
 *
 * 核心流程：
 * 1. 获取当前 Fiber 的 hook
 * 2. 如果是首次渲染，创建新的 Hook
 * 3. 如果是更新，复用现有 Hook 并处理更新队列
 */
function useState<State>(
  initialState: (() => State) | State
): [State, (Action: State | ((prev: State) => State)) => void] {
  // 1. 获取当前的 dispatcher
  const dispatcher = currentDispatcher.current;

  // 2. 根据是否首次渲染，调用不同的函数
  return dispatcher.useState(initialState);
}

/**
 * 首次渲染时的 useState
 */
function mountState<State>(
  initialState: (() => State) | State
): [State, Dispatch<State>] {
  // 1. 创建新的 Hook
  const hook = mountWorkInProgressHook();

  // 2. 计算初始状态
  if (typeof initialState === 'function') {
    hook.memoizedState = initialState();
  } else {
    hook.memoizedState = initialState;
  }

  // 3. 创建 queue 和 dispatch
  const queue: UpdateQueue<State> = {
    shared: { pending: null },
    interleaved: null,
    lanes: NoLanes,
  };
  hook.queue = queue;

  // 4. 创建 dispatch 函数
  const dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue);

  // 5. 返回
  return [hook.memoizedState, dispatch];
}

/**
 * 更新时的 useState
 */
function updateState<State>(
  initialState: (() => State) | State
): [State, Dispatch<State>] {
  // 1. 获取当前的 Hook
  const hook = updateWorkInProgressHook();

  // 2. 处理更新队列
  const queue = hook.queue;

  if (queue.shared.pending !== null) {
    // 有待处理的更新
    const pending = queue.shared.pending;

    // 遍历更新队列
    let newState = hook.baseState;
    let update = pending;

    do {
      const action = update.action;

      if (typeof action === 'function') {
        // 如果是函数，执行 reducer
        newState = action(newState);
      } else {
        // 直接赋值
        newState = action;
      }

      update = update.next;
    } while (update !== null);

    // 清空队列
    queue.shared.pending = null;

    // 更新 hook 状态
    hook.memoizedState = newState;
  }

  return [hook.memoizedState, hook.queue.interleaved];
}

/**
 * dispatchSetState - 触发更新的核心函数
 */
function dispatchSetState<State>(
  fiber: Fiber,
  queue: UpdateQueue<State>,
  action: State | ((prev: State) => State)
) {
  // 1. 获取当前时间
  const lane = requestUpdateLane();
  const eventTime = getCurrentTime();

  // 2. 创建 Update
  const update: Update<State, any> = {
    lane: lane,
    action: action,
    eagerReducer: null,
    eagerState: null,
    next: null,
  };

  // 3. 添加到队列
  enqueueUpdate(fiber, update, lane);

  // 4. 调度更新
  scheduleUpdateOnFiber(fiber, lane, eventTime);
}
```

### 6.3 useReducer 的实现

```typescript
/**
 * useReducer 的实现
 *
 * 与 useState 的区别：
 * - useState 是 useReducer 的特例（reducer = (state, action) => action）
 * - useReducer 允许传入自定义的 reducer 函数
 */
function useReducer<S, A>(
  reducer: (S, A) => S,
  initial: S | (() => S)
): [S, Dispatch<A>] {
  const dispatcher = currentDispatcher.current;
  return dispatcher.useReducer(reducer, initial);
}

function mountReducer<S, A>(
  reducer: (S, A) => S,
  initialArg: S
): [S, Dispatch<A>] {
  // 1. 创建 Hook
  const hook = mountWorkInProgressHook();

  // 2. 计算初始状态
  hook.memoizedState = initialArg;

  // 3. 创建队列
  const queue: UpdateQueue<S> = {
    shared: { pending: null },
    interleaved: null,
    lanes: NoLanes,
  };
  hook.queue = queue;

  // 4. 创建 dispatch
  const dispatch = dispatchAction.bind(null, currentlyRenderingFiber, queue, reducer);

  return [hook.memoizedState, dispatch];
}

function updateReducer<S, A>(
  reducer: (S, A) => S,
  initialArg: S
): [S, Dispatch<A>] {
  // 1. 获取 Hook
  const hook = updateWorkInProgressHook();

  // 2. 处理更新队列
  const queue = hook.queue;
  let lastRenderReducer = reducer;
  let lastRenderState = hook.memoizedState;

  if (queue.lastRenderedReducer !== reducer) {
    // reducer 改变，记录新的 reducer
    lastRenderReducer = queue.lastRenderReducer;
  }

  // 3. 处理 pending updates
  if (queue.shared.pending !== null) {
    const pending = queue.shared.pending;
    let newState = hook.baseState;
    let newBaseState = null;
    let newBaseQueue: Update<any, any> | null = null;

    do {
      const update = pending;
      const action = update.action;

      // 使用传入的 reducer 计算新状态
      newState = lastRenderReducer(newState, action);

      pending = pending.next;
    } while (pending !== null);

    queue.shared.pending = null;
    hook.memoizedState = newState;
  }

  return [hook.memoizedState, dispatch];
}
```

### 6.4 Hooks 顺序的重要性

React Hooks 必须保持调用顺序的原因：

```
为什么 Hooks 不能在条件语句中使用？

❌ 错误示例：
function Component({ show }) {
  const [name, setName] = useState('init');

  if (show) {
    const [age, setAge] = useState(18);  // 可能不执行！
  }

  const [address, setAddress] = useState('Beijing'); // 可能取到错误的 Hook

  // 当 show=false 时：
  // 第一次渲染：useState('init'), useState('Beijing')
  // 第二次渲染：useState('init'), useState('age 的残留值') ❌
}

✅ 正确示例：
function Component({ show }) {
  const [name, setName] = useState('init');
  const [age, setAge] = useState(18);  // 始终执行
  const [address, setAddress] = useState('Beijing');

  // 条件逻辑放在 Hook 内部
  useEffect(() => {
    if (show) {
      // 条件逻辑
    }
  }, [show]);
}

React 内部机制：
┌─────────────────────────────────────────────────────────────┐
│  currentlyRenderingFiber.memoizedState                     │
│                           │                                 │
│                           ▼                                 │
│  Hooks 链表按照"调用顺序"排列：                              │
│                                                             │
│  第1次渲染：                                                │
│  ┌────────┐    ┌────────┐    ┌────────┐                   │
│  │ Hook 0 │ →  │ Hook 1 │ →  │ Hook 2 │                   │
│  │ (name) │    │ (age)  │    │(address)│                   │
│  └────────┘    └────────┘    └────────┘                   │
│                                                             │
│  第2次渲染（show=false，跳过 age 的 setState）：             │
│  ┌────────┐    ┌────────┐    ┌────────┐                   │
│  │ Hook 0 │ →  │ Hook 1 │ →  │ Hook 2 │                   │
│  │ (name) │    │(address)│ ←─ 错误！期望 age，得到 address │
│  └────────┘    └────────┘    └────────┘                   │
│                                                             │
│  React 无法"跳过"一个 Hook，因为它依赖顺序来匹配             │
└─────────────────────────────────────────────────────────────┘
```

### 6.5 useEffect 的数据结构

```typescript
/**
 * Effect 的数据结构
 * 与普通 Hook 不同，Effect 存储在 Fiber 的 updateQueue 中
 */
interface Effect {
  tag: EffectTags;           // 副作用类型
  create: () => (() => void) | void;  // 回调函数
  destroy: (() => void) | void;       // 清理函数
  deps: Array<mixed> | null;            // 依赖数组
  next: Effect | null;                 // 链表下一个
}

/**
 * Effect 链表挂在 Fiber 的 updateQueue 上
 */
interface UpdateQueue<State> {
  // ...
  circles: Array<Update<State, any>> | null;  // 可能的循环更新
}

// Effect 的执行在 commit 阶段的 Layout 子阶段
function commitLayoutEffects(
  root: FiberRootNode,
  finishedWork: Fiber
) {
  // 递归处理所有有 Layout effect 的节点
  while (nextEffect !== null) {
    const effect = nextEffect;

    if (effect.tag & LayoutMask) {
      // 执行 useLayoutEffect
      commitLayoutEffectOnFiber(root, finishedWork, effect);
    }

    nextEffect = effect.nextEffect;
  }
}
```

---

## 七、React 19 新特性：超越 Hooks 的新时代

### 7.1 use()：超越 Hooks 限制

`use()` 是 React 19 引入的新 API，它可以**在组件内部消费 Promise 或 Context**，打破了 Hooks 必须在组件顶层调用的限制。

```typescript
/**
 * use() 的基本用法
 */

// 消费 Promise
function UserProfile({ userPromise }) {
  // use() 直接消费 Promise，不需要 useEffect + useState
  const user = use(userPromise);

  return <div>{user.name}</div>;
}

// 消费 Context（不需要 Provider）
function ThemedButton() {
  const theme = use(ThemeContext);
  return <button style={{ background: theme }}>Click</button>;
}

/**
 * use() 的实现原理（伪代码）
 */
function use<T>(usable: Usable<T>): T {
  // 1. 如果是 Promise，尝试读取已解析的值
  if (usable instanceof Promise) {
    // 检查缓存
    if (usable._reactCache) {
      const cachedResult = usable._reactCache.get(usable);
      if (cachedResult !== undefined) {
        return cachedResult;
      }
    }

    // 如果 Promise 还在 pending，抛出让 React 处理
    if (usable.status === 'pending') {
      throw usable;  // React 会等待 Promise，然后重新渲染
    }

    // Promise 已 resolve，返回值
    if (usable.status === 'fulfilled') {
      return usable._reactResult;
    }

    if (usable.status === 'rejected') {
      throw usable._reactError;
    }
  }

  // 2. 如果是 Context，返回当前值
  if (usable.$$typeof === REACT_CONTEXT_T) {
    return readContext(usable);
  }

  // 3. 其他类型，抛出错误
  throw new Error('Invalid argument to use()');
}
```

### 7.2 useOptimistic：乐观更新

`useOptimistic` 允许 UI 先显示"乐观"的状态，然后在使用真实数据更新。

```typescript
/**
 * useOptimistic 的典型用法
 */
import { useOptimistic, useState } from 'react';
import { sendMessage } from './api';

function ChatRoom({ messages }) {
  const [text, setText] = useState('');
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,  // 当前消息列表
    (state, newMessage) => [
      ...state,
      {
        id: Date.now(),
        text: newMessage,
        pending: true  // 标记为"待确认"
      }
    ]
  );

  async function handleSend(e) {
    e.preventDefault();

    // 立即添加乐观消息
    addOptimisticMessage(text);

    // 清空输入
    setText('');

    try {
      // 发送真实请求
      await sendMessage(text);
      // 成功：React 会用服务器返回的真实消息替换乐观消息
    } catch (e) {
      // 失败：需要回滚乐观消息
      // React 19 会自动处理回滚逻辑
    }
  }

  return (
    <div>
      {optimisticMessages.map(msg => (
        <div key={msg.id} style={{ opacity: msg.pending ? 0.7 : 1 }}>
          {msg.text}
        </div>
      ))}
      <form onSubmit={handleSend}>
        <input value={text} onChange={e => setText(e.target.value)} />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

/**
 * useOptimistic 的 Fiber 层面实现
 *
 * 底层机制：
 * 1. 创建两个并行的状态：optimistic state 和 real state
 * 2. optimistic state 有更高的优先级（SyncLane）
 * 3. 当 real state 更新完成时，合并两个状态
 * 4. 如果 real state 更新失败，回滚到 real state
 */
```

### 7.3 useActionState：表单状态管理

`useActionState`（原 `useFormState`）简化了表单提交的状态管理：

```typescript
/**
 * useActionState 的用法
 */
import { useActionState } from 'react';
import { submitForm } from './actions';

function MyForm() {
  const [state, formAction, isPending] = useActionState(
    async (previousState, formData) => {
      const name = formData.get('name');
      const result = await fetch('/api/submit', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      return result.ok
        ? { success: true, name }
        : { error: 'Failed to submit' };
    },
    null  // 初始状态
  );

  return (
    <form action={formAction}>
      <input name="name" type="text" />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Submitting...' : 'Submit'}
      </button>
      {state?.error && <p>{state.error}</p>}
      {state?.success && <p>Success!</p>}
    </form>
  );
}

/**
 * useActionState 的状态机
 *
 * 状态转换：
 * idle → pending → success
 *                    ↘ error
 */
```

### 7.4 Server Components 架构

React Server Components（RSC）是 React 19 的重大革新，它允许组件在**服务端渲染**：

```
┌─────────────────────────────────────────────────────────────────┐
│                  React Server Components 架构                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Server（Node.js / Edge）          Client（Browser）           │
│   ┌─────────────────────┐          ┌─────────────────────┐    │
│   │                     │          │                     │    │
│   │  Server Components  │  JSON    │   Client Components  │    │
│   │  (只在服务器执行)     │ ──────→  │   (水合后交互)        │    │
│   │                     │          │                     │    │
│   │  - 直接访问 DB       │          │  - useState          │    │
│   │  - 直接访问文件系统    │          │  - useEffect          │    │
│   │  - 无需 bundle       │          │  - 事件处理            │    │
│   │                     │          │                     │    │
│   └─────────────────────┘          └─────────────────────┘    │
│                                                                 │
│   【优势】                                                       │
│   - 减少客户端 JS bundle                                        │
│   - 直接使用服务端能力（数据库、文件系统）                        │
│   - 流式渲染，首屏更快                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

```typescript
/**
 * Server Component 示例
 */
// app/page.tsx（Server Component）
import { db } from './database';
import { ClientInteractiveButton } from './ClientButton';

export default async function Page() {
  // 直接在服务端查询数据库
  const user = await db.query('SELECT * FROM users WHERE id = 1');

  return (
    <div>
      <h1>Hello, {user.name}</h1>

      {/* 这是客户端组件，可以有交互 */}
      <ClientInteractiveButton />
    </div>
  );
}

/**
 * Client Component 示例
 */
// ClientButton.tsx
'use client';  // 标记为客户端组件

import { useState } from 'react';

export function ClientInteractiveButton() {
  const [clicked, setClicked] = useState(false);

  return (
    <button onClick={() => setClicked(true)}>
      {clicked ? 'Clicked!' : 'Click me'}
    </button>
  );
}
```

---

## 八、源码解读：手写简化版 Fiber

### 8.1 React-reconciler 源码结构

```
react-reconciler/src/
├── ReactFiber.ts                    # Fiber 创建和克隆
├── ReactFiber.beginWork.ts          # beginWork 实现
├── ReactFiber.completeWork.ts       # completeWork 实现
├── ReactFiberWorkLoop.ts            # 工作循环（核心）
├── ReactUpdateQueue.ts              # 更新队列实现
├── ReactFiberLane.ts                # Lane/优先级实现
├── ReactFiberHooks.ts               # Hooks 实现
├── ReactFiberSuspense.ts            # Suspense 实现
├── ReactFiberOffscreen.ts           # Offscreen/Activity
└── ReactFiberConfig.ts              # 平台特定配置（DOM/Native）
```

### 8.2 关键函数解析

#### 8.2.1 beginWork 的核心逻辑

```typescript
/**
 * beginWork - 每个 Fiber 节点开始处理的入口
 *
 * 核心职责：
 * 1. 检查是否需要更新（props 变化、state 变化）
 * 2. 根据组件类型创建/复用子 Fiber
 * 3. 返回下一个待处理的 Fiber
 */
function beginWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes
): Fiber | null {
  // 1. 更新当前 Fiber 的 lanes
  workInProgress.lanes = renderLanes;

  // 2. 根据组件类型分发
  switch (workInProgress.tag) {
    case FunctionComponent:
      return updateFunctionComponent(current, workInProgress, renderLanes);

    case ClassComponent:
      return updateClassComponent(current, workInProgress, renderLances);

    case HostRoot:
      return updateHostRoot(current, workInProgress, renderLanes);

    case HostComponent:
      return updateHostComponent(current, workInProgress, renderLanes);

    // ...
  }
}

/**
 * updateFunctionComponent - 更新函数组件
 */
function updateFunctionComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes
) {
  // 1. 渲染组件，获取新的 children
  const Component = workInProgress.type;
  const resolvedProps = workInProgress.pendingProps;

  let children = Component(resolvedProps);

  // 2. 调和子节点
  reconcileChildren(current, workInProgress, children, renderLanes);

  // 3. 返回第一个子节点（如果有）
  return workInProgress.child;
}
```

#### 8.2.2 completeWork 的核心逻辑

```typescript
/**
 * completeWork - 完成当前 Fiber 节点的处理
 *
 * 核心职责：
 * 1. 创建或更新 DOM 节点
 * 2. 处理 props（style、className、event handlers）
 * 3. 收集副作用（flags）
 * 4. 向上冒泡 subtreeFlags
 */
function completeWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes
): Fiber | null {
  const newProps = workInProgress.pendingProps;

  switch (workInProgress.tag) {
    case HostComponent:
      // 处理 DOM 元素
      if (current !== null && workInProgress.stateNode !== null) {
        // 更新现有 DOM 节点
        updateHostComponent(current, workInProgress);
      } else {
        // 创建新的 DOM 节点
        const instance = createInstance(workInProgress.type, newProps);
        appendAllChildren(instance, workInProgress);
        workInProgress.stateNode = instance;
      }
      break;

    case HostText:
      // 处理文本节点
      if (current !== null && workInProgress.stateNode !== null) {
        updateHostText(current, workInProgress);
      } else {
        workInProgress.stateNode = createTextInstance(newProps);
      }
      break;
  }

  // 冒泡 subtreeFlags 到父节点
  bubbleProperties(workInProgress);

  return null;  // completeWork 不返回子节点，由 workLoop 处理
}
```

### 8.3 Scheduler：时间片调度

```typescript
/**
 * Scheduler 模块的核心类型
 */
interface Task {
  id: number;
  callback: () => boolean | void;  // 返回 true 表示还有更多工作
  priorityLevel: PriorityLevel;
  startTime: number;
  expirationTime: number;
}

/**
 * Scheduler 的工作循环
 *
 * 关键设计：
 * 1. 使用最小堆（Min Heap）管理任务优先级
 * 2. 在每一帧的"空闲时间"执行任务
 * 3. 通过 MessageChannel 在帧末让出主线程
 */
class Scheduler {
  private taskQueue: Heap<Task> = new Heap();
  private timerQueue: Heap<Task> = new Heap();
  private currentTask: Task | null = null;
  private deadline: number = 0;

  /**
   * scheduleCallback - 添加新任务
   */
  scheduleCallback(
    priorityLevel: PriorityLevel,
    callback: () => void
  ): Task {
    const currentTime = getCurrentTime();
    const startTime = currentTime;
    const expirationTime = startTime + timeoutForPriority(priorityLevel);

    const task: Task = {
      id: ++taskIdCounter,
      callback,
      priorityLevel,
      startTime,
      expirationTime,
    };

    // 添加到堆中
    this.taskQueue.push(task);

    // 如果是最高优先级，立即调度
    if (priorityLevel === ImmediatePriority) {
      requestHostCallback(this.flushWork);
    }

    return task;
  }

  /**
   * flushWork - 执行任务直到时间耗尽
   */
  flushWork(hasTimeRemaining: boolean, initialTime: number): boolean {
    this.deadline = initialTime + 5;  // 5ms 时间片

    try {
      while (this.taskQueue.length > 0) {
        // 检查时间
        if (!hasTimeRemaining && getCurrentTime() >= this.deadline) {
          break;  // 时间耗尽，停止
        }

        // 取出最高优先级任务
        const task = this.taskQueue.pop();

        if (task && task.callback) {
          const didMoreWork = task.callback();

          if (didMoreWork) {
            // 任务还有更多工作，重新放回队列
            this.taskQueue.push(task);
          }
        }
      }
    } catch (error) {
      // 处理错误...
    }

    // 如果还有任务，让出主线程
    if (this.taskQueue.length > 0) {
      requestHostCallback(this.flushWork);
      return true;
    }

    return false;
  }
}
```

### 8.4 手写简化版 Fiber 架构

以下是一个简化版的 Fiber 实现，帮助理解核心原理：

```typescript
/**
 * 简化版 Fiber 架构实现
 *
 * 这个实现展示了 Fiber 的核心概念：
 * 1. 链表结构
 * 2. 可中断的工作循环
 * 3. 双缓冲切换
 */

// ============================================
// 第一部分：类型定义
// ============================================

type WorkTag =
  | 'FunctionComponent'
  | 'HostRoot'
  | 'HostComponent'
  | 'HostText';

interface Fiber {
  // 标识
  tag: WorkTag;
  type: any;                    // 组件类型或 DOM 标签
  key: string | null;           // 列表 key

  // 链表结构
  child: Fiber | null;          // 第一个子节点
  sibling: Fiber | null;       // 下一个兄弟
  return: Fiber | null;         // 父节点

  // DOM 相关
  dom: HTMLElement | Text | null;
  stateNode: any;                // 关联的 DOM 节点

  // 更新相关
  props: any;                    // 新的 props
  alternate: Fiber | null;     // 双缓存指针
  flags: number;                // 副作用标记
}

// 副作用标记
const PLACEMENT = 1;            // 插入节点
const UPDATE = 2;                // 更新节点
const DELETION = 4;             // 删除节点

// ============================================
// 第二部分：创建 Fiber
// ============================================

let workInProgressRoot: FiberRoot | null = null;
let nextUnitOfWork: Fiber | null = null;

/**
 * 创建 Fiber 节点
 */
function createFiber(
  tag: WorkTag,
  key: string | null,
  props: any
): Fiber {
  return {
    tag,
    key,
    type: null,
    child: null,
    sibling: null,
    return: null,
    dom: null,
    stateNode: null,
    props,
    alternate: null,
    flags: 0,
  };
}

/**
 * 创建 workInProgress Fiber
 */
function createWorkInProgress(current: Fiber, props: any): Fiber {
  const workInProgress = current.alternate || createFiber(
    current.tag,
    current.key,
    props
  );

  workInProgress.type = current.type;
  workInProgress.return = current.return;
  workInProgress.flags = 0;

  return workInProgress;
}

// ============================================
// 第三部分：render 阶段
// ============================================

/**
 * render 阶段的入口
 */
function render(element: ReactElement, container: HTMLElement) {
  // 1. 创建根 Fiber
  const rootFiber = createFiber('HostRoot', null, null);
  rootFiber.dom = container;

  // 2. 创建 workInProgress 根
  workInProgressRoot = {
    current: rootFiber,
    pendingProps: element,
    finishedWork: null,
  };

  // 3. 开始工作循环
  nextUnitOfWork = workInProgressRoot.current;
  requestIdleCallback(workLoop);
}

/**
 * 工作循环 - 可中断的遍历
 */
function workLoop(deadline: IdleDeadline) {
  let shouldYield = false;

  while (nextUnitOfWork && !shouldYield) {
    // 执行当前工作单元
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);

    // 检查是否应该让出主线程
    shouldYield = deadline.timeRemaining() < 1;
  }

  // 如果还有工作，下一帧继续
  if (nextUnitOfWork) {
    requestIdleCallback(workLoop);
  } else {
    // render 阶段完成，进入 commit 阶段
    commitRoot();
  }
}

/**
 * 执行单个 Fiber 节点的工作
 */
function performUnitOfWork(fiber: Fiber): Fiber | null {
  // 1. 开始处理
  beginWork(fiber);

  // 2. 如果有子节点，返回子节点
  if (fiber.child) {
    return fiber.child;
  }

  // 3. 如果没有子节点，完成当前节点，返回 sibling
  let current = fiber;
  while (current) {
    completeWork(current);

    if (current.sibling) {
      return current.sibling;
    }

    current = current.return;
  }

  return null;
}

/**
 * beginWork - 创建子 Fiber
 */
function beginWork(fiber: Fiber) {
  if (fiber.tag === 'FunctionComponent') {
    // 处理函数组件
    const Component = fiber.type;
    const newChildren = Component(fiber.props);

    reconcileChildren(fiber, newChildren);
  } else if (fiber.tag === 'HostComponent') {
    // 处理 DOM 标签
    if (!fiber.dom) {
      fiber.dom = createDOMElement(fiber.type);
    }

    const newChildren = fiber.props.children;
    reconcileChildren(fiber, newChildren);
  } else if (fiber.tag === 'HostText') {
    // 处理文本
    if (!fiber.dom) {
      fiber.dom = document.createTextNode(fiber.props);
    }
  }
}

/**
 * reconcileChildren - 调和子节点
 */
function reconcileChildren(fiber: Fiber, children: any) {
  let prevSibling: Fiber | null = null;
  let firstChild: Fiber | null = null;

  const childrenArray = Array.isArray(children) ? children : [children];

  for (let i = 0; i < childrenArray.length; i++) {
    const child = childrenArray[i];

    if (!child) continue;

    const newFiber = createFiber(
      typeof child === 'string' || typeof child === 'number'
        ? 'HostText'
        : 'FunctionComponent',
      child.key || null,
      child.props
    );

    newFiber.return = fiber;

    if (i === 0) {
      firstChild = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
  }

  fiber.child = firstChild;
}

/**
 * completeWork - 完成 Fiber
 */
function completeWork(fiber: Fiber) {
  // 1. 如果有 DOM 节点，添加到父节点
  if (fiber.dom && fiber.return) {
    const parentDOM = fiber.return.dom;
    if (parentDOM && fiber.flags & PLACEMENT) {
      parentDOM.appendChild(fiber.dom);
    }
  }
}

// ============================================
// 第四部分：commit 阶段
// ============================================

/**
 * commitRoot - 提交阶段的入口
 */
function commitRoot() {
  const finishedWork = workInProgressRoot.current;

  // 递归处理所有有 flags 的节点
  commitWorker(finishedWork);

  // 交换 current 和 workInProgress
  finishedWork.alternate = finishedWork;
}

// ============================================
// 第五部分：调度更新
// ============================================

/**
 * setState 的简化实现
 */
function setState(fiber: Fiber, newProps: any) {
  // 1. 创建 update
  const update = {
    props: newProps,
    next: null,
  };

  // 2. 添加到更新队列（简化版）

  // 3. 调度 render
  scheduleUpdateOnFiber(fiber);
}

function scheduleUpdateOnFiber(fiber: Fiber) {
  // 获取根节点
  let root = fiber;
  while (root.return) {
    root = root.return;
  }

  // 调度
  nextUnitOfWork = root;
  requestIdleCallback(workLoop);
}
```

---

## 九、面试高频问题与深度解答

### 9.1 Fiber 为什么采用链表结构而不是树的递归？

**问题分析**：这是考察候选人对 Fiber 架构设计思想的理解程度。

**标准答案**：

1. **可中断性**：递归的调用栈由 JavaScript 引擎自动管理，一旦进入递归，必须等待所有子节点处理完成才能返回。而链表的当前节点指针由 React 显式控制，可以在任意点"暂停"，保存当前进度，然后在下一次空闲时间"恢复"。

2. **状态保存**：递归无法保存中间状态，每一次递归调用都会占用新的栈帧。而链表只需要保存 `workInProgress` 指针，就可以随时恢复执行。

3. **优先级调度**：链表结构让 React 可以选择下一个要处理的工作单元（不一定是深度优先），而递归只能按固定顺序处理。

```typescript
// 递归无法中断
function reconcileRecursive(element) {
  // 这段代码必须一次性执行完
  element.children.forEach(child => {
    reconcileRecursive(child);  // 递归调用
  });
}

// 链表可以中断
function workLoop() {
  while (workInProgress !== null) {
    workInProgress = performUnitOfWork(workInProgress);
    // 每处理一个节点后，可以检查是否需要让出主线程
    if (shouldYield()) {
      return;  // 中断！下次继续
    }
  }
}
```

### 9.2 diff 算法在 Fiber 中是如何体现的？

**问题分析**：考察候选人对 React diff 算法的理解。

**标准答案**：

React 的 diff 算法发生在 `beginWork` 阶段，通过对比 `current` 树（旧 Fiber）和 `workInProgress` 树（新 Fiber）来实现：

1. **Element 类型不同**：卸载旧节点，挂载新节点（标记 `Deletion`）

2. **Element 类型相同**：复用现有 Fiber 节点（标记 `Update`），只更新 props

3. **列表节点的 key 匹配**：
   - 有 key：尝试通过 key 匹配
   - 无 key：按索引匹配，可能导致不必要的移动

```typescript
// reconcileChildFibers 中的核心逻辑
if (oldFiber.key === newChild.key) {
  // key 相同，比较 type
  if (oldFiber.type === newChild.type) {
    // 复用 Fiber
    const clonedFiber = useFiber(oldFiber, newChild.props);
    clonedFiber.return = returnFiber;
    return clonedFiber;
  }
  // key 相同但 type 不同，删除旧的
  deleteChild(returnFiber, oldFiber);
} else {
  // key 不同，直接删除旧的
  deleteChild(returnFiber, oldFiber);
}
```

### 9.3 为什么 useEffect 的回调函数不能是 async 的？

**问题分析**：考察候选人对 useEffect 设计和 Promise/Async 机制的理解。

**标准答案**：

1. **useEffect 的返回值的期望**：React 期望 `useEffect` 的返回值是一个清理函数（`() => void`），用于在下一次 effect 执行前清理。如果 effect 是 async 函数，它会返回一个 `Promise`，这不符合 React 的预期。

2. **异步清理的复杂性**：如果 effect 可以是 async 的，那么 React 需要等待 Promise resolve 才能执行下一次 effect 或组件卸载清理，这会增加复杂性且可能导致内存泄漏。

3. **技术方案**：如果需要在 effect 中使用 async，可以使用 IIFE（立即调用函数表达式）或在内部定义 async 函数然后立即调用：

```typescript
// ❌ 错误
useEffect(async () => {
  const data = await fetch('/api/data');
  setData(data);
}, []);

// ✅ 正确
useEffect(() => {
  async function fetchData() {
    const data = await fetch('/api/data');
    setData(data);
  }

  fetchData();

  // 或者使用 IIFE
  (async () => {
    const data = await fetch('/api/data');
    setData(data);
  })();
}, []);

// ✅ 或者返回 cleanup
useEffect(() => {
  let cancelled = false;

  async function fetchData() {
    const data = await fetch('/api/data');
    if (!cancelled) {
      setData(data);
    }
  }

  fetchData();

  return () => {
    cancelled = true;  // 清理函数
  };
}, []);
```

### 9.4 React 18 的 Automatic Batching 解决了什么问题？

**问题分析**：考察候选人对 React 18 并发特性背后原理的理解。

**标准答案**：

**问题**：在 React 18 之前，只有在 React 事件处理函数中的 setState 才会被批量处理。在 Promise、setTimeout、原生事件中的 setState 不会被批量处理，导致不必要的重复渲染。

```typescript
// React 17 及之前
button.onClick = () => {
  setCount(1);  // 不批量
  setName('a'); // 不批量
  // 触发 2 次 render
};

// React 18 之后
button.onClick = () => {
  setCount(1);  // 批量
  setName('a'); // 批量
  // 触发 1 次 render
};

// Promise 中的行为变化
// React 17
fetch('/api').then(() => {
  setData(x);  // 触发 render
  setUser(y);  // 触发另一次 render ❌
});

// React 18
fetch('/api').then(() => {
  setData(x);  // 批量
  setUser(y);  // 批量
  // 触发 1 次 render ✅
});
```

**底层原理**：React 18 通过在 scheduler 中引入微任务批处理机制，当更新进入 scheduler 时，会检查是否可以在当前批次中合并，而不是立即调度。

### 9.5 React 19 的 useOptimistic 和 useTransition 有什么区别？

**问题分析**：考察候选人对 React 19 新特性和并发编程模型的理解。

**标准答案**：

1. **useTransition**：标记从当前状态到新状态的转换为"过渡"状态，过渡期间旧的 DOM 保持可见：

```typescript
const [isPending, startTransition] = useTransition();

startTransition(() => {
  setState(newState);  // 低优先级
});
```

2. **useOptimistic**：直接显示一个"乐观"的状态，等真实请求成功后再替换：

```typescript
const [optimisticState, addOptimistic] = useOptimistic(
  realState,
  (state, newValue) => ({ ...state, value: newValue, pending: true })
);

addOptimistic(newValue);  // 立即显示

// 真实请求成功后，realState 更新，React 自动替换乐观状态
```

3. **适用场景**：
   - `useTransition`：UI 需要保持响应，但不需要显示"pending"状态（如标签页切换）
   - `useOptimistic`：用户操作需要立即反馈（如聊天消息发送、点赞）

---

## 十、调试 React Fiber：工具与方法论

### 10.1 React DevTools 查看 Fiber

在 Chrome DevTools 中，选择一个 React 组件对应的 DOM 节点，然后使用以下代码获取其 Fiber：

```javascript
// 方法 1：使用 React DevTools 内部属性
const fiber = $0._reactRootContainer._internalRoot.current;

// 方法 2：通过 DOM 节点上的 internal prop 查找
const fiberKey = Object.keys($0).find(key => key.startsWith('__reactFiber$'));
const fiber = $0[fiberKey];

// 查看 Fiber 的关键属性
console.log('Type:', fiber.type);
console.log('Key:', fiber.key);
console.log('Props:', fiber.memoizedProps);
console.log('State:', fiber.memoizedState);
console.log('Flags:', fiber.flags);
console.log('Lanes:', fiber.lanes);
console.log('Alternate:', fiber.alternate);
```

### 10.2 使用 Profiler 分析渲染性能

React DevTools Profiler 可以记录每次渲染的"原因"：

```javascript
// 开启 Profiler 录制后，可以查看：
// 1. 哪些组件发生了渲染
// 2. 渲染的"原因"（click、props change、state change）
// 3. 渲染的耗时
// 4. 组件树的大小和渲染时间
```

### 10.3 常见问题的调试策略

| 问题 | 调试方法 |
|------|----------|
| 组件意外重新渲染 | 使用 Profiler 查看 render 原因 |
| setState 后没有更新 | 检查 updateQueue 是否正确入队 |
| Hooks 顺序错乱 | 检查是否在条件语句中调用了 Hook |
| useEffect 不执行 | 检查依赖数组是否正确 |
| 优先级问题 | 使用 `__reactFiber$fiber.lanes` 查看 |

---

## 十一、总结与展望

### 11.1 Fiber 架构的核心价值

Fiber 架构是 React 从"UI 库"进化为"响应式系统"的关键转折点：

1. **可中断渲染**：让 UI 保持响应，即使在复杂的更新任务中
2. **时间切片**：合理分配主线程时间，保证帧率稳定
3. **优先级调度**：确保高优操作（用户输入）优先处理
4. **双缓冲**：实现原子性更新，避免界面"撕裂"

### 11.2 React 19 的演进方向

React 19 延续了 Fiber 的设计理念，带来了更多优化：

1. **Compiler 自动优化**：减少人工优化的工作量
2. **Server Components**：将渲染责任合理分配到服务端和客户端
3. **新的 Hook 原语**：更声明式地处理异步和状态

### 11.3 未来展望

React 的未来发展方向包括：

1. **Activity API（Offscreen）**：后台保持组件状态，实现瞬间切换
2. **Preload API**：预测用户行为，预先加载资源
3. **更好的并发原语**：让复杂场景下的状态管理更简单

---

**参考资源**

- [React 官方文档 - Reconciliation](https://react.dev/learn/preserving-and-resetting-state)
- [React 官方文档 - Fiber Architecture](https://github.com/acdlite/react-fiber-architecture)
- [React 源码仓库 - react-reconciler](https://github.com/facebook/react/tree/main/packages/react-reconciler)
- [React 官方博客 - Inside Fiber](https://react.dev/blog/2016/09/28/our-first-55-minute-code-split)
- [React 19 Beta 文档](https://react.dev/blog)

---

*本文档为 React Fiber 架构的深度解析教程，适合希望深入理解 React 底层原理的开发者。*
*文档版本：React 19.2 | 最后更新：2026年4月*
