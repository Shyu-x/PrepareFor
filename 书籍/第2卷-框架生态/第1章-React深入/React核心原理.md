# 第2卷-框架生态

---

## 第1章 React深入

---

### 1.1 虚拟DOM深度解析

#### 1.1.1 什么是虚拟DOM

**参考答案：**

虚拟 DOM（Virtual DOM）是 React 的核心概念，它是一个 JavaScript 对象树，用于描述真实 DOM 的结构和状态。React 通过在内存中维护一个虚拟 DOM 树来高效地更新真实 DOM。

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ 
┃                         虚拟 DOM 架构                            ┃
┃                                                                  ┃
┃   真实 DOM 结构：                                                ┃
┃   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ┃  
┃   ┃ <div id="root">                                          ┃  ┃ 
┃   ┃   <ul>                                                   ┃  ┃ 
┃   ┃     <li class="item">Item 1</li>                        ┃  ┃  
┃   ┃     <li class="item">Item 2</li>                        ┃  ┃  
┃   ┃   </ul>                                                  ┃  ┃ 
┃   ┃ </div>                                                   ┃  ┃ 
┃   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ┃  
┃                                                                  ┃
┃   虚拟 DOM 结构（JavaScript 对象）：                             ┃
┃   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ┃  
┃   ┃ {                                                         ┃  ┃
┃   ┃   type: 'div',                                           ┃  ┃ 
┃   ┃   props: { id: 'root' },                                 ┃  ┃ 
┃   ┃   children: [                                            ┃  ┃ 
┃   ┃     {                                                     ┃  ┃
┃   ┃       type: 'ul',                                         ┃  ┃
┃   ┃       children: [                                        ┃  ┃ 
┃   ┃         { type: 'li', props: { className: 'item' },     ┃  ┃  
┃   ┃           children: ['Item 1'] },                        ┃  ┃ 
┃   ┃         { type: 'li', props: { className: 'item' },     ┃  ┃  
┃   ┃           children: ['Item 2'] }                         ┃  ┃ 
┃   ┃       ]                                                   ┃  ┃
┃   ┃     }                                                     ┃  ┃
┃   ┃   ]                                                       ┃  ┃
┃   ┃ }                                                         ┃  ┃
┃   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ┃  
┃                                                                  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ 

```

#### 1.1.2 虚拟DOM的优点

**参考答案：**

1. **减少真实 DOM 操作**：直接操作真实 DOM 成本很高，虚拟 DOM 通过 diff 算法最小化操作
2. **跨平台渲染**：虚拟 DOM 可以渲染到不同平台（Web、React Native、React 3D 等）
3. **声明式编程**：开发者只需要描述 UI 的最终状态，React 负责处理具体的 DOM 操作
4. **可预测性**：状态变化有明确的流程，更容易调试和测试
5. **函数式 UI 更新**：符合函数式编程范式，UI = f(state)

```javascript
// 虚拟 DOM 示例
// 这段 JSX 会被编译成虚拟 DOM 对象
const element = (
  <div className="container">
    <h1>Hello</h1>
    <ul>
      <li>Item 1</li>
      <li>Item 2</li>
    </ul>
  </div>
);

// 编译后的虚拟 DOM 结构
{
  type: 'div',
  props: {
    className: 'container',
    children: [
      { type: 'h1', props: { children: 'Hello' } },
      {
        type: 'ul',
        props: {
          children: [
            { type: 'li', props: { children: 'Item 1' } },
            { type: 'li', props: { children: 'Item 2' } }
          ]
        }
      }
    ]
  }
}
```

#### 1.1.3 虚拟DOM的缺点

**参考答案：**

1. **内存开销**：需要额外的内存来存储虚拟 DOM 树
2. **首次渲染可能较慢**：需要先构建虚拟 DOM 树，再渲染真实 DOM
3. **不适用于所有场景**：对于简单的静态页面，直接操作 DOM 可能更高效
4. **学习曲线**：需要理解 React 的工作方式和数据流

```javascript
// 简单场景下，直接操作 DOM 可能更高效
// 例如：只需要更新一个简单的时间显示
function Clock() {
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 这种简单场景下，虚拟 DOM 带来的开销可能不值得
  return <div>{time}</div>;
}
```

#### 1.1.4 虚拟DOM的实现原理

**参考答案：**

React 中的虚拟 DOM 实现主要包含以下几个部分：

1. **React Element**：虚拟 DOM 的基本单元
2. **Fiber 节点**：React 16+ 的内部数据结构
3. **Diff 算法**：比较新旧虚拟 DOM 的差异
4. **Reconciliation**：协调和更新真实 DOM

```javascript
// React Element 的创建过程
// JSX 会被 Babel 转译为 createElement 调用
const element = React.createElement(
  'div',                    // type: 元素类型
  { className: 'wrapper' }, // props: 元素属性
  'Hello World'            // children: 子元素
);

// createElement 的简化实现
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child =>
        typeof child === 'object' ? child : createTextElement(child)
      )
    }
  };
}

function createTextElement(text) {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: []
    }
  };
}
```

---

### 1.2 Fiber架构深度解析

#### 1.2.1 React架构演进

**参考答案：**

React 的架构经历了从 React 15 的 Stack Reconciler 到 React 16+ 的 Fiber Reconciler 的重大变革。

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    
┃                    React 架构演进                                ┃   
┃                                                                  ┃   
┃  React 15 (Stack Reconciler)                                    ┃    
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    ┃    
┃  ┃                                                          ┃    ┃   
┃  ┃   组件A ━━▶ 组件B ━━▶ 组件C ━━▶ ... ━━▶ DOM 更新    ┃    ┃        
┃  ┃                                                          ┃    ┃   
┃  ┃   特点：                                                  ┃    ┃  
┃  ┃   - 同步递归执行                                          ┃    ┃  
┃  ┃   - 无法中断                                              ┃    ┃  
┃  ┃   - 大组件树更新会阻塞 UI                                 ┃    ┃  
┃  ┃   - 无法处理优先级                                        ┃    ┃  
┃  ┃   - 递归调用栈过深会导致性能问题                           ┃    ┃ 
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    ┃    
┃                                                                  ┃   
┃  React 16+ (Fiber Reconciler)                                   ┃    
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    ┃    
┃  ┃                                                          ┃    ┃   
┃  ┃   Work Loop (可中断)                                    ┃    ┃    
┃  ┃                                                          ┃    ┃   
┃  ┃   1. beginWork ━━▶ 2. completeWork ━━▶ 3. commit       ┃    ┃     
┃  ┃        ┃                                                    ┃    ┃
┃  ┃        ▼                                                    ┃    ┃
┃  ┃   可以根据优先级跳过/恢复任务                              ┃    ┃ 
┃  ┃   支持并发渲染                                             ┃    ┃ 
┃  ┃                                                          ┃    ┃   
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    ┃    
┃                                                                  ┃   
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    

```

#### 1.2.2 为什么需要Fiber

**参考答案：**

Fiber 的引入解决了以下问题：

1. **可中断渲染**：长时间运行的渲染任务可以被中断，让出主线程
2. **优先级调度**：根据任务的重要程度分配优先级
3. **增量渲染**：将渲染工作分散到多个帧中
4. **更好的异步支持**：支持 Suspense、Concurrent Mode 等特性

```javascript
// 传统 Stack Reconciler 的问题
function processComponentTree(components) {
  // 这个过程是同步的，无法中断
  // 如果组件树很大，会长时间阻塞主线程
  // 导致页面卡顿、动画不流畅等问题
  components.forEach(component => {
    renderComponent(component);
  });
}

// Fiber 的解决方案
function fiberWorkLoop() {
  // 每次只处理一个 Fiber 节点
  // 处理完成后检查是否需要让出主线程
  while (nextUnitOfWork !== null) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    // 检查是否有更高优先级的任务
    if (priorityLevel > currentPriority) {
      // 让出主线程，处理更高优先级的任务
      yield; // 中断当前工作
    }
  }
}
```

#### 1.2.3 Fiber节点结构

**参考答案：**

Fiber 节点是 React 16+ 的核心数据结构，它是一个链表结构的 JavaScript 对象。

```javascript
// Fiber 节点的完整结构
const fiber = {
  // 组件信息
  type: Component,           // 组件类型（函数组件、类组件或 DOM 标签）
  key: null,                 // key 属性，用于列表diff
  tag: FunctionComponent,   // Fiber 节点类型标签

  // 链表结构 - 这是 Fiber 的核心
  return: fiber,            // 父 Fiber 节点
  child: fiber,             // 第一个子 Fiber 节点
  sibling: fiber,           // 下一个兄弟 Fiber 节点
  index: 0,                 // 在兄弟节点中的索引

  // 状态数据
  stateNode: null,          // DOM 节点或组件实例
  pendingProps: {},        // 新的 props（正在处理中）
  memoizedProps: {},        // 旧的 props（已确认的）
  memoizedState: {},        // 旧的 state（已确认的）
  updateQueue: [],          // 待处理的更新队列

  // 副作用相关
  effectTag: 'UPDATE',     // 副作用类型标签
  nextEffect: fiber,       // 下一个有副作用的 Fiber 节点
  firstEffect: fiber,      // 第一个有副作用的子 Fiber
  lastEffect: fiber,       // 最后一个有副作用的子 Fiber

  // 过期状态（用于并发模式）
  lanes: 0,                // 当前 Fiber 的所有车道
  childLanes: 0,          // 子 Fiber 的车道

  // 调试信息
  alternate: fiber,       // 交替 Fiber（用于双缓冲技术）
  deletions: [],          // 需要删除的子 Fiber
};

// 副作用标签类型
const EffectTags = {
  UPDATE: 'UPDATE',           // 更新 DOM
  PLACEMENT: 'PLACEMENT',    // 新建 DOM 节点
  DELETION: 'DELETION',      // 删除 DOM 节点
  CONTENT_RESET: 'CONTENT_RESET', // 内容重置
  PASSIVE: 'PASSIVE',        // useEffect 副作用
};
```

#### 1.2.4 Fiber树的双缓冲技术

**参考答案：**

React 使用双缓冲技术管理 Fiber 树：维护 current 树（屏幕上显示的）和 workInProgress 树（正在构建的）。

```javascript
// 双缓冲技术示意
// 当前 Fiber 树（显示在屏幕上）
const currentFiberTree = {
  root: {
    child: {
      type: 'App',
      child: {
        type: 'Header',
        sibling: {
          type: 'Content'
        }
      }
    }
  }
};

// Work In Progress Fiber 树（正在构建）
const workInProgressFiberTree = {
  root: {
    child: {
      type: 'App',
      child: {
        type: 'Header',  // 可能被复用或重建
        sibling: {
          type: 'Content' // 可能被复用或重建
        }
      }
    }
  }
};

// 双缓冲切换过程
function commitRoot(root) {
  // 1. 处理所有副作用
  root.finishedWork = root.current.alternate;
  root.current = root.current.alternate;

  // 2. 完成渲染后切换指针
  // workInProgress 变成 current
}
```

#### 1.2.5 Fiber工作循环

**参考答案：**

Fiber 的工作循环是 React 渲染过程的核心，它是一个可中断的循环。

```javascript
// Fiber 工作循环的简化实现
let nextUnitOfWork = null;   // 下一个工作单元
let workInProgress = null;   // 正在工作的 Fiber
let current = null;          // 当前 Fiber 树根节点

// 调度工作循环
function scheduleWork(root) {
  nextUnitOfWork = root;
  requestIdleCallback(performWork);
}

// 执行工作循环
function performWork(deadline) {
  // 循环处理工作单元
  while (nextUnitOfWork && deadline.timeRemaining() > 0) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }

  // 如果还有工作，调度下一帧继续
  if (nextUnitOfWork) {
    requestIdleCallback(performWork);
  } else {
    // 所有工作完成，提交更改
    commitRoot();
  }
}

// 处理单个 Fiber 节点
function performUnitOfWork(fiber) {
  // 1. beginWork - 处理当前节点
  const children = beginWork(fiber);

  // 2. 如果有子节点，返回子节点作为下一个工作单元
  if (fiber.child) {
    return fiber.child;
  }

  // 3. 如果没有子节点，完成当前节点
  let node = fiber;
  while (node) {
    // 4. completeWork - 完成当前节点的处理
    completeWork(node);

    // 5. 处理兄弟节点
    if (node.sibling) {
      return node.sibling;
    }

    // 6. 回溯到父节点
    node = node.return;
  }
}

// beginWork 的简化实现
function beginWork(workInProgress) {
  // 根据组件类型处理
  switch (workInProgress.tag) {
    case HostRoot:
      return updateHostRoot(workInProgress);

    case FunctionComponent:
      return updateFunctionComponent(workInProgress);

    case ClassComponent:
      return updateClassComponent(workInProgress);

    case HostComponent:
      return updateHostComponent(workInProgress);
  }
}

// 提交阶段的简化实现
function commitRoot(root) {
  // 1. 提交所有删除
  commitDeletions(root);

  // 2. 提交所有更新
  commitUpdates(root);

  // 3. 提交所有插入
  commitInserts(root);

  // 4. 重置 Fiber 树
  root.current = root.finishedWork;
}
```

#### 1.2.6 优先级机制详解

**参考答案：**

React 的优先级系统决定了哪些更新应该优先处理。

```javascript
// React 优先级等级
const PriorityLevel = {
  ImmediatePriority: 1,        // 最高优先级 - 立即执行
  UserBlockingPriority: 2,    // 用户阻塞优先级 - 响应用户输入
  NormalPriority: 3,          // 正常优先级 - 默认
  LowPriority: 4,             // 低优先级 - 可以延迟
  IdlePriority: 5             // 空闲优先级 - 空闲时执行
};

// Lane 模型（React 18）
// Lane 比之前的优先级系统更细粒度
const lanes = {
  SyncLane: 0b00001,                    // 同步车道 - 同步更新
  InputContinuousLane: 0b00010,        // 连续输入 - 拖拽、滚动
  DefaultLane: 0b00100,                 // 默认车道 - 常规更新
  TransitionLane: 0b01000,              // 过渡车道 - useTransition
  RetryLane: 0b10000,                   // 重试车道 - Suspense
};

// 优先级使用场景
const PriorityUseCases = {
  [PriorityLevel.ImmediatePriority]: [
    'setState in componentDidMount',
    '原生事件回调',
    '同步渲染'
  ],

  [PriorityLevel.UserBlockingPriority]: [
    'onClick 事件处理',
    '表单输入',
    '动画',
    '拖拽操作'
  ],

  [PriorityLevel.NormalPriority]: [
    '数据获取',
    '路由跳转',
    '列表渲染'
  ],

  [PriorityLevel.LowPriority]: [
    '非关键更新',
    '后台同步'
  ],

  [PriorityLevel.IdlePriority]: [
    '日志上报',
    '延迟加载',
    '预加载'
  ]
};

// 调度优先级
function scheduleTask(priority, callback) {
  if (priority === PriorityLevel.ImmediatePriority) {
    // 立即执行
    callback();
  } else if (priority === PriorityLevel.UserBlockingPriority) {
    // 尽快执行（下一帧）
    requestAnimationFrame(callback);
  } else {
    // 空闲时执行
    requestIdleCallback(callback);
  }
}
```

#### 1.2.7 ConcurrentMode并发模式

**参考答案：**

Concurrent Mode 是 React 18 引入的重要特性，它允许 React 同时准备多个版本的 UI。

```javascript
// 启用并发模式（React 18 自动启用）
import { createRoot } from 'react-dom/client';

const root = createRoot(document.getElementById('root'));
root.render(<App />);

// useTransition - 标记非紧急更新
import { useTransition, useState } from 'react';

function SearchResults() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleChange(e) {
    const value = e.target.value;

    // 紧急更新 - 输入框立即响应
    setQuery(value);

    // 非紧急更新 - 搜索结果可以延迟
    startTransition(() => {
      setSearchResults(value);
    });
  }

  return (
    <div>
      <input value={query} onChange={handleChange} />
      {isPending ? <Spinner /> : <Results />}
    </div>
  );
}

// useDeferredValue - 延迟非关键值
import { useDeferredValue } from 'react';

function SearchResults({ query }) {
  // query 的变化会被延迟处理
  const deferredQuery = useDeferredValue(query);

  return <ExpensiveList query={deferredQuery} />;
}

// 配合 Suspense 使用
import { Suspense, lazy } from 'react';

const AsyncComponent = lazy(() => import('./AsyncComponent'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <AsyncComponent />
    </Suspense>
  );
}
```

---

### 1.3 调和算法深度解析

#### 1.3.1 ReactDiff算法的基本原理

**参考答案：**

React 的 Diff 算法是虚拟 DOM 的核心，它通过比较新旧虚拟 DOM 树来找出最小更新方案。

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  
┃                      React Diff 算法                             ┃ 
┃                                                                  ┃ 
┃  Diff 策略：                                                    ┃  
┃                                                                  ┃ 
┃  1. 元素类型不同                                                ┃  
┃     ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓     ┃  
┃  ┃  <div key="1">A</div> ━━▶ <span key="1">A</span>     ┃     ┃    
┃  ┃  策略：直接销毁重建                                     ┃     ┃ 
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛     ┃     
┃                                                                  ┃ 
┃  2. 元素类型相同（DOM 元素）                                     ┃ 
┃     ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓     ┃  
┃  ┃  <div className="a"> ━━▶ <div className="b">        ┃     ┃     
┃  ┃  策略：只更新属性，不重建 DOM                            ┃     ┃
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛     ┃     
┃                                                                  ┃ 
┃  3. 子元素 Diff（递归处理）                                      ┃ 
┃     ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓     ┃  
┃  ┃  <ul>                                                   ┃     ┃ 
┃  ┃    <li key="a">A</li> ━━▶ <li key="a">A</li>        ┃     ┃     
┃  ┃    <li key="b">B</li> ━━▶ <li key="b">B</li>        ┃     ┃     
┃  ┃  </ul>                                                  ┃     ┃ 
┃  ┃  策略：同 key 复用 DOM                                  ┃     ┃ 
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛     ┃     
┃                                                                  ┃ 
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  

```

#### 1.3.2 Diff算法的复杂度优化

**参考答案：**

React 通过以下策略将 Diff 算法的复杂度从 O(n^3) 降低到 O(n)：

1. **只比较同层节点**：不同层的节点不进行比较
2. **不同类型直接替换**：不同类型的元素直接销毁重建
3. **Key 优化列表渲染**：通过 key 尽量复用节点

```javascript
// Diff 算法的核心实现
function reconcileChildren(current, workInProgress, nextChildren) {
  const oldChildren = current ? current.child : null;
  const result = reconcileChildFibers(workInProgress, oldChildren, nextChildren);
  workInProgress.child = result;
  return result;
}

function reconcileChildFibers(returnFiber, oldChildren, newChildren) {
  // 处理数组类型
  if (isArray(newChildren)) {
    return reconcileChildrenArray(
      returnFiber,
      oldChildren,
      newChildren
    );
  }

  // 处理单个元素
  if (newChildren && newChildren.$$typeof) {
    return reconcileSingleElement(
      returnFiber,
      oldChildren,
      newChildren
    );
  }

  // 处理文本节点
  if (typeof newChildren === 'string' || typeof newChildren === 'number') {
    return reconcileSingleTextNode(
      returnFiber,
      oldChildren,
      newChildren
    );
  }

  // 没有子节点
  if (!newChildren) {
    return null;
  }
}

// 列表 Diff 算法
function reconcileChildrenArray(
  returnFiber,
  oldChildren,
  newChildren
) {
  let oldStartIndex = 0;
  let newStartIndex = 0;
  let oldEndIndex = oldChildren.length - 1;
  let newEndIndex = newChildren.length - 1;

  // 第一轮：尝试复用位置相同的节点
  while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
    const oldFiber = oldChildren[oldStartIndex];
    const newFiber = newChildren[newStartIndex];

    if (oldFiber.key === newFiber.key) {
      // key 相同，尝试复用
      if (canReuse(oldFiber, newFiber)) {
        // 复用并更新
        return placeChild(newFiber, newStartIndex);
      }
      break;
    }

    oldStartIndex++;
    newStartIndex++;
  }

  // 第二轮：处理无法直接复用的情况
  // 使用 Map 优化查找
  const existingChildren = new Map();
  existingChildren.set(oldFiber.key, oldFiber);

  // ... 继续处理剩余节点
}
```

#### 1.3.3 Key的最佳实践

**参考答案：**

Key 在 React Diff 算法中起着关键作用，正确使用 Key 可以显著提升性能。

```javascript
// 最佳实践 1：使用稳定唯一 ID
function TodoList() {
  const todos = [
    { id: 1, text: 'Learn React' },
    { id: 2, text: 'Learn Redux' },
    { id: 3, text: 'Learn TypeScript' }
  ];

  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  );
}

// 最佳实践 2：避免使用索引作为 key
// 错误示例：当列表顺序变化时会有问题
function SortedList() {
  const [items, setItems] = useState(['c', 'a', 'b']);

  function sort() {
    // 排序后，索引对应的元素变了
    // 但 React 认为 key 0, 1, 2 还是相同的元素
    setItems([...items].sort());
  }

  return (
    <ul>
      {items.map((item, index) => (
        // 错误：使用索引作为 key
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

// 正确示例
function SortedListCorrect() {
  const [items, setItems] = useState([
    { id: 'c1', value: 'c' },
    { id: 'a1', value: 'a' },
    { id: 'b1', value: 'b' }
  ]);

  function sort() {
    setItems([...items].sort((a, b) => a.value.localeCompare(b.value)));
  }

  return (
    <ul>
      {items.map(item => (
        // 正确：使用稳定 ID
        <li key={item.id}>{item.value}</li>
      ))}
    </ul>
  );
}

// 最佳实践 3：列表组件的 key
function List({ items }) {
  // key 应该在最外层元素上
  return (
    <ul>
      {items.map(item => (
        <ListItem key={item.id} item={item} />
      ))}
    </ul>
  );
}

// 最佳实践 4：key 的作用域
function Grid({ rows, columns }) {
  // 每个子列表需要独立的 key 作用域
  return (
    <div>
      {rows.map(rowId => (
        <div key={rowId}>
          {columns.map(colId => (
            <Cell key={`${rowId}-${colId}`} />
          ))}
        </div>
      ))}
    </div>
  );
}
```

#### 1.3.4 React的调和过程

**参考答案：**

调和（Reconciliation）是 React 决定如何更新 DOM 的过程。

```javascript
// 调和过程的主要步骤

// 1. 组件类型比较
function reconcileElementType(returnFiber, current, nextElement) {
  // 类型相同，尝试复用
  if (current && current.type === nextElement.type) {
    return updateElement(returnFiber, current, nextElement);
  }

  // 类型不同，删除旧的，创建新的
  return createNewFiber(returnFiber, nextElement);
}

// 2. DOM 元素更新
function updateHostComponent(current, workInProgress) {
  const oldProps = current.memoizedProps;
  const newProps = workInProgress.pendingProps;

  // 标记需要更新的属性
  if (oldProps !== newProps) {
    workInProgress.effectTag = 'UPDATE';
  }

  // 返回子元素进行递归调和
  return reconcileChildren(current, workInProgress, newProps.children);
}

// 3. 组件更新
function updateClassComponent(current, workInProgress, Component) {
  // 创建或获取组件实例
  let instance;
  if (current === null) {
    instance = new Component(workInProgress.props);
    workInProgress.stateNode = instance;
  } else {
    instance = workInProgress.stateNode;
  }

  // 处理 pending props 和 state
  const nextProps = workInProgress.pendingProps;
  const nextState = workInProgress.memoizedState;

  // 调用生命周期或更新逻辑
  if (current === null) {
    // 首次挂载
    componentDidMount();
  } else {
    // 更新
    componentDidUpdate(prevProps, prevState);
  }

  // 渲染并调和子元素
  const nextChildren = instance.render();
  return reconcileChildren(current, workInProgress, nextChildren);
}
```

---

### 1.4 React渲染机制底层原理

#### 1.4.1 React15vs16+架构对比

#### 1.4.1.1 Stack Reconciler

React 15 使用的是 Stack Reconciler（堆栈协调器），它采用同步递归的方式进行虚拟 DOM 树的对比和更新。

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    
┃                    React 15 Stack Reconciler                    ┃    
┃                                                                  ┃   
┃   setState 触发                                                   ┃  
┃        ┃                                                          ┃  
┃        ▼                                                          ┃  
┃   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    ┃   
┃   ┃           Stack Reconciler (同步递归)                    ┃    ┃  
┃   ┃                                                          ┃    ┃  
┃   ┃   Component A                                            ┃    ┃  
┃   ┃      ┣━━━ Component B ━━━ Component D                   ┃    ┃   
┃   ┃      ┃         ┗━━━ Component E                         ┃    ┃   
┃   ┃      ┗━━━ Component C                                   ┃    ┃   
┃   ┃                                                          ┃    ┃  
┃   ┃   特点：                                                  ┃    ┃ 
┃   ┃   - 同步递归遍历整个组件树                                 ┃    ┃
┃   ┃   - 一旦开始无法中断，直到完成                             ┃    ┃
┃   ┃   - 大组件树更新会阻塞主线程                               ┃    ┃
┃   ┃   - 用户交互必须等待更新完成                               ┃    ┃
┃   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    ┃   
┃        ┃                                                          ┃  
┃        ▼                                                          ┃  
┃   DOM 更新                                                        ┃  
┃                                                                  ┃   
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    

```

**缺点：**
- 无法处理优先级，高频更新（如动画）会卡顿
- 递归调用栈过深可能导致性能问题
- 用户输入、动画等高优先级任务被阻塞

#### 1.4.2 FiberReconciler

React 16 引入了 Fiber 架构，将协调过程拆分成可中断的小单元，支持优先级调度和并发渲染。

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   
┃                    React 16+ Fiber Reconciler                   ┃   
┃                                                                  ┃  
┃   setState 触发                                                   ┃ 
┃        ┃                                                          ┃ 
┃        ▼                                                          ┃ 
┃   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    ┃  
┃   ┃              Fiber Work Loop (可中断)                    ┃    ┃ 
┃   ┃                                                          ┃    ┃ 
┃   ┃   优先级队列:                                             ┃    ┃
┃   ┃   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    ┃    ┃ 
┃   ┃   ┃ 同步任务 ┃ 动画 ┃ 用户交互 ┃ 正常 ┃ 低优先级  ┃    ┃    ┃   
┃   ┃   ┃ (最高)  ┃      ┃          ┃      ┃  (最低)   ┃    ┃    ┃    
┃   ┃   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    ┃    ┃ 
┃   ┃                                                          ┃    ┃ 
┃   ┃   Work: beginWork → completeWork → commit             ┃    ┃    
┃   ┃         ┃                                           ┃    ┃      
┃   ┃         ▼                                           ┃    ┃      
┃   ┃   每个 fiber 节点可以中断/恢复                          ┃    ┃  
┃   ┃   高优先级任务可以抢占                                  ┃    ┃  
┃   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    ┃  
┃        ┃                                                          ┃ 
┃        ▼                                                          ┃ 
┃   DOM 更新 (仅在 commit 阶段)                                     ┃ 
┃                                                                  ┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   

```

**优势：**
- 可中断、可恢复
- 支持任务优先级调度
- 并发渲染多个状态更新
- 用户交互不会被长时间阻塞

---

### 1.2 Fiber 架构详细解析

#### 1.5.1 Fiber节点数据结构

Fiber 节点是 React 16+ 的核心数据结构，每个 React 元素对应一个 Fiber 节点。

```javascript
// Fiber 节点核心结构
function FiberNode(tag, pendingProps, key, mode) {
  // 基础属性
  this.tag = tag;                    // 组件类型 (FunctionComponent, ClassComponent 等)
  this.key = key;                    // React Key
  this.type = null;                  // 元素类型 (函数组件/类组件/原生标签)
  this.stateNode = null;             // 对应的真实 DOM 节点或组件实例

  // Fiber 树结构
  this.return = null;                // 父 Fiber 节点
  this.child = null;                 // 第一个子 Fiber 节点
  this.sibling = null;               // 下一个兄弟 Fiber 节点
  this.index = 0;                    // 在兄弟节点中的索引

  // 更新相关
  this.pendingProps = pendingProps;  // 新的 props
  this.memoizedProps = null;         // 上次渲染的 props
  this.memoizedState = null;         // 上次渲染的状态
  this.updateQueue = null;           // 更新队列

  // 副作用
  this.flags = NoFlags;              // 当前节点的副作用类型
  this.subtreeFlags = NoFlags;      // 子树的副作用
  this.deletions = null;            // 需要删除的子节点

  // 调度相关
  this.lanes = NoLanes;            // 优先级 lane
  this.childLanes = NoLanes;       // 子树的 lane

  // 双缓冲技术
  this.alternate = null;            // 指向另一棵树（current 或 workInProgress）
}
```

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   
┃                      Fiber 节点关系图                             ┃ 
┃                                                                  ┃  
┃                    ┏━━━━━━━━━━━━━━┓                              ┃  
┃                    ┃  Parent Fiber ┃                              ┃ 
┃                    ┃    (return)   ┃                              ┃ 
┃                    ┗━━━━━━┳━━━━━━━┛                              ┃  
┃                           ┃                                       ┃ 
┃                           ┃ child                                  ┃
┃                           ▼                                       ┃ 
┃                    ┏━━━━━━━━━━━━━━┓                              ┃  
┃                    ┃  Child Fiber  ┃━━━━━━━ sibling ━━━▶ ...     ┃  
┃                    ┗━━━━━━━━━━━━━━┛                              ┃  
┃                                                                  ┃  
┃   Fiber 节点属性:                                                 ┃ 
┃   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    ┃  
┃   ┃ return    → 父节点                                       ┃    ┃ 
┃   ┃ child     → 第一个子节点                                 ┃    ┃ 
┃   ┃ sibling   → 下一个兄弟节点                               ┃    ┃ 
┃   ┃ alternate → 另一棵树的对应节点                           ┃    ┃ 
┃   ┃ flags     → 副作用标记 (Placement, Update, Deletion)     ┃    ┃ 
┃   ┃ lanes     → 优先级信息                                   ┃    ┃ 
┃   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    ┃  
┃                                                                  ┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   

```

#### 1.2.2 渲染阶段与提交阶段

React 的渲染过程分为两个主要阶段：Render Phase（渲染阶段）和 Commit Phase（提交阶段）。

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   
┃                    React 渲染两个阶段                             ┃ 
┃                                                                  ┃  
┃   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    ┃  
┃   ┃                    1. Render Phase                     ┃    ┃   
┃   ┃                 (可中断、可恢复)                          ┃    ┃
┃   ┃                                                          ┃    ┃ 
┃   ┃   beginWork → completeWork → ...                        ┃    ┃  
┃   ┃      ┃              ┃                                   ┃    ┃  
┃   ┃      ▼              ▼                                   ┃    ┃  
┃   ┃   创建/对比       标记副作用                              ┃    ┃
┃   ┃   Fiber 节点     (Placement, Update, Deletion)          ┃    ┃  
┃   ┃                                                          ┃    ┃ 
┃   ┃   这个阶段可以被打断，浏览器可以处理高优先级任务          ┃    ┃
┃   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    ┃  
┃                           ┃                                       ┃ 
┃                           ▼                                       ┃ 
┃   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    ┃  
┃   ┃                   2. Commit Phase                      ┃    ┃   
┃   ┃                 (同步执行，不可中断)                      ┃    ┃
┃   ┃                                                          ┃    ┃ 
┃   ┃   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ┃    ┃   
┃   ┃   ┃  beforeMutation (DOM 更新前)                     ┃  ┃    ┃  
┃   ┃   ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫  ┃    ┃   
┃   ┃   ┃  mutation (DOM 更新) - 插入/删除/更新            ┃  ┃    ┃  
┃   ┃   ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫  ┃    ┃   
┃   ┃   ┃  layout (DOM 更新后) - 触发 useLayoutEffect       ┃  ┃    ┃ 
┃   ┃   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ┃    ┃   
┃   ┃                                                          ┃    ┃ 
┃   ┃   这个阶段必须同步执行完成，不能中断                      ┃    ┃
┃   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    ┃  
┃                                                                  ┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   

```

**渲染阶段（Render Phase）：**
- 执行 beginWork：创建或对比 Fiber 节点
- 执行 completeWork：完成 Fiber 节点处理，收集副作用
- 可以被中断、恢复、优先级调度
- 不涉及任何 DOM 操作

**提交阶段（Commit Phase）：**
- 同步执行，不能中断
- 执行 DOM 更新（插入、删除、更新）
- 触发 useLayoutEffect 回调
- 触发 useEffect 回调（异步）

#### 1.2.3 workInProgress 树

React 使用双缓冲技术（Double Buffering），维护两棵 Fiber 树：current 树和 workInProgress 树。

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  
┃                    Fiber 双缓冲技术                               ┃
┃                                                                  ┃ 
┃   Current Tree (当前显示的 UI)                                    ┃
┃   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    ┃ 
┃   ┃                                                         ┃    ┃ 
┃   ┃      Root                                              ┃    ┃  
┃   ┃       /  \                                             ┃    ┃  
┃   ┃      A    B                                            ┃    ┃  
┃   ┃     / \   |                                            ┃    ┃  
┃   ┃    C   D  E                                            ┃    ┃  
┃   ┃                                                         ┃    ┃ 
┃   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    ┃ 
┃                           ┃                                       ┃
┃                  current.alternate                               ┃ 
┃                           ┃ (指向 workInProgress)                 ┃
┃                           ▼                                       ┃
┃   workInProgress Tree (正在构建的)                               ┃ 
┃   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    ┃ 
┃   ┃                                                         ┃    ┃ 
┃   ┃      Root*                                             ┃    ┃  
┃   ┃       /  \                                             ┃    ┃  
┃   ┃      A*   B*                                           ┃    ┃  
┃   ┃     / \   |                                            ┃    ┃  
┃   ┃    C*  D  E*                                           ┃    ┃  
┃   ┃                                                         ┃    ┃ 
┃   ┃   * 表示已更新或新建的节点                               ┃    ┃
┃   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    ┃ 
┃                                                                  ┃ 
┃   更新完成后：                                                    ┃
┃   workInProgress 树的根节点 alternate 指向 current 树的根节点   ┃  
┃   树切换：current = workInProgress                               ┃ 
┃                                                                  ┃ 
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  

```

**双缓冲工作流程：**

```javascript
// 1. 更新触发时
function scheduleUpdateOnFiber(fiber) {
  // 2. 创建 workInProgress 树
  // 如果 alternate 存在，克隆它；否则创建新节点
  const workInProgress = fiber.alternate || createFiber(fiber);

  // 3. 在 workInProgress 上进行所有更新
  workInProgress.pendingProps = fiber.memoizedProps;

  // 4. 完成渲染后，切换指针
  // current.alternate 指向新的 workInProgress
  fiber.alternate = workInProgress;
  workInProgress.alternate = fiber;

  // 5. commit 阶段完成后，切换引用
  root.current = workInProgress;
}
```

---

### 1.3 Concurrent Mode 原理

#### 1.3.1 任务优先级

React 的并发模式使用 Lane（赛道）模型来管理任务优先级。

```javascript
// React 18 优先级/Lane 定义
const lanes = {
  // 同步优先级
  SyncLane: 0b00001,           // 最高优先级 - 同步更新
  InputContinuousLane: 0b00010, // 连续输入（拖拽、滚动）

  // 异步优先级
  DefaultLane: 0b00100,        // 默认优先级
  TransitionLane: 0b01000,     // 过渡更新 (useTransition)
  SuspenseLane: 0b10000,       // Suspense 优先级

  // 最低优先级
  IdleLane: 0b100000           // 空闲时执行
};

// 优先级比较
function getHighestPriorityLane(lanes) {
  if (lanes & SyncLane) return SyncLane;
  if (lanes & InputContinuousLane) return InputContinuousLane;
  if (lanes & DefaultLane) return DefaultLane;
  // ...
}
```

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  
┃                      优先级层级图                                 ┃
┃                                                                  ┃ 
┃   优先级从高到低:                                                 ┃
┃                                                                  ┃ 
┃   ┏━━━━━━━━━━━━┓                                               ┃   
┃   ┃  SyncLane  ┃ ← setState, 事件处理 (最高)                  ┃    
┃   ┗━━━━━━━━━━━━┛                                               ┃   
┃        ┃                                                        ┃  
┃        ▼                                                        ┃  
┃   ┏━━━━━━━━━━━━━━━━━┓                                           ┃  
┃   ┃InputContinuous ┃ ← 拖拽、滚动、动画                       ┃    
┃   ┃      Lane       ┃                                           ┃  
┃   ┗━━━━━━━━━━━━━━━━━┛                                           ┃  
┃        ┃                                                        ┃  
┃        ▼                                                        ┃  
┃   ┏━━━━━━━━━━━━┓                                               ┃   
┃   ┃ DefaultLane ┃ ← 普通数据获取、状态更新                     ┃   
┃   ┗━━━━━━━━━━━━┛                                               ┃   
┃        ┃                                                        ┃  
┃        ▼                                                        ┃  
┃   ┏━━━━━━━━━━━━━┓                                               ┃  
┃   ┃Transition   ┃ ← useTransition 标记的更新                  ┃    
┃   ┃    Lane     ┃                                               ┃  
┃   ┗━━━━━━━━━━━━━┛                                               ┃  
┃        ┃                                                        ┃  
┃        ▼                                                        ┃  
┃   ┏━━━━━━━━━━━━┓                                               ┃   
┃   ┃  IdleLane  ┃ ← 低优先级任务、预加载                        ┃   
┃   ┗━━━━━━━━━━━━┛                                               ┃   
┃                                                                  ┃ 
┃   调度规则:                                                      ┃ 
┃   - 高优先级任务可以中断低优先级任务                              ┃
┃   - 被中断的任务可以恢复执行                                      ┃
┃   - 同优先级的任务一起批量执行                                    ┃
┃                                                                  ┃ 
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  

```

#### 1.3.2 抢占式调度

React 的调度器基于浏览器原生的 requestIdleCallback 和 setTimeout 实现抢占式调度。

```javascript
// 简化的调度逻辑
function scheduleTask(priority, callback) {
  if (priority === SyncPriority) {
    // 同步任务立即执行
    callback();
  } else if (priority === UserBlockingPriority) {
    // 用户交互优先级，使用 setTimeout 短延迟
    setTimeout(callback, 0);
  } else {
    // 低优先级，使用 requestIdleCallback
    requestIdleCallback(callback, { timeout: 200 });
  }
}

// Fiber Work Loop 中的抢占逻辑
function workLoop() {
  while (workInProgress !== null) {
    // 检查是否有更高优先级的任务
    if (shouldYield()) {
      // 让出主线程，检查是否有更高优先级任务
      if (hasHigherPriorityWork()) {
        // 中断当前任务，处理高优先级任务
        return;
      }
      // 恢复执行
    }

    // 执行当前 Fiber 节点的工作
    workInProgress = performUnitOfWork(workInProgress);
  }
}
```

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ 
┃                    抢占式调度示例                                ┃
┃                                                                  ┃
┃   时间线:                                                        ┃
┃                                                                  ┃
┃   0ms    ┃ setState(A) 触发                                    ┃  
┃          ┃ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓            ┃  
┃          ┃ ┃ 开始渲染组件 A (低优先级)              ┃            ┃
┃          ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛            ┃  
┃          ┃           ┃                                           ┃
┃   50ms   ┃ 用户点击 → setState(B) 触发 (高优先级)              ┃  
┃          ┃           ┃                                           ┃
┃          ┃           ▼                                           ┃
┃          ┃ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓            ┃  
┃          ┃ ┃ A 被中断，B 开始渲染                  ┃            ┃ 
┃          ┃ ┃ (高优先级抢占低优先级)                 ┃            ┃
┃          ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛            ┃  
┃          ┃           ┃                                           ┃
┃   100ms  ┃           ┃ 完成 B 渲染                               ┃
┃          ┃           ┃                                           ┃
┃          ┃           ▼                                           ┃
┃          ┃ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓            ┃  
┃          ┃ ┃ 恢复 A 的渲染 (从中断点继续)           ┃            ┃
┃          ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛            ┃  
┃          ┃           ┃                                           ┃
┃   150ms  ┃           ┃ A 渲染完成                                ┃
┃                                                                  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ 

```

**useTransition 示例：**

```javascript
function App() {
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState('');

  function handleChange(e) {
    // 紧急：立即更新输入框
    setQuery(e.target.value);

    // 非紧急：延迟更新搜索结果
    startTransition(() => {
      // 搜索逻辑 - 可以被中断
      fetchResults(e.target.value);
    });
  }

  return (
    <div>
      <input value={query} onChange={handleChange} />
      {isPending ? <Spinner /> : <Results />}
    </div>
  );
}
```

---

### 1.5 ReactDiff算法深入

### 2.1 React 17+ Diff 策略

#### 2.1.1 元素类型比较

React Diff 算法的核心策略是基于元素类型进行不同处理。

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   
┃                    React Diff 元素类型比较                       ┃  
┃                                                                  ┃  
┃  1. 不同类型元素 → 销毁重建                                       ┃ 
┃     ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓     ┃   
┃  ┃  <div key="1">A</div> ━━▶ <span key="1">A</span>   ┃     ┃       
┃  ┃                                                          ┃     ┃ 
┃  ┃  策略：直接销毁 div，新建 span                           ┃     ┃ 
┃  ┃  div 及其子节点会被完全移除                              ┃     ┃ 
┃  ┃  span 作为新节点被创建                                   ┃     ┃ 
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛     ┃      
┃                                                                  ┃  
┃  2. 同类型 DOM 元素 → 只更新属性                                  ┃ 
┃     ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓     ┃   
┃  ┃  <div className="old"> ━━▶ <div className="new">   ┃     ┃       
┃  ┃                                                          ┃     ┃ 
┃  ┃  策略：保留 DOM 节点，只更新变化的属性                    ┃     ┃
┃  ┃  className: "old" → "new"                              ┃     ┃   
┃  ┃  不重新创建 DOM 节点                                     ┃     ┃ 
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛     ┃      
┃                                                                  ┃  
┃  3. 同类型组件 → 调用组件更新                                     ┃ 
┃     ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓     ┃   
┃  ┃  <MyComponent prop={old} ━━▶ <MyComponent prop={new}┃     ┃      
┃  ┃                                                          ┃     ┃ 
┃  ┃  策略：保留组件实例，更新 props                          ┃     ┃ 
┃  ┃  调用 componentWillReceiveProps (如存在)               ┃     ┃   
┃  ┃  调用 render() 获取新结果                                 ┃     ┃
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛     ┃      
┃                                                                  ┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   

```

**源码层面：**

```javascript
// React Diff 核心逻辑（简化）
function reconcileChildFibers(returnFiber, newChild, lanes) {
  // 判断元素类型
  const isObject = typeof newChild === 'object' && newChild !== null;

  if (isObject) {
    switch (newChild.$$typeof) {
      case REACT_ELEMENT_TYPE:
        // 首次渲染或更新
        return placeChildFiber(reconcileSingleElement(...));
      case REACT_PORTAL_TYPE:
        return reconcileChildFibers(...);
    }
  }

  // 处理数组（多个子元素）
  if (Array.isArray(newChild)) {
    return reconcileChildrenArray(...);
  }

  // 处理字符串/数字
  return deleteRemainingChildren(...);
}
```

#### 2.1.2 Key 的作用

Key 帮助 React 识别哪些元素发生了变化，是列表渲染优化的关键。

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  
┃                         Key 的作用                               ┃ 
┃                                                                  ┃ 
┃  没有 key (不推荐):                                               ┃
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    ┃  
┃  ┃  <ul>                                                    ┃    ┃ 
┃  ┃    <li>A</li> ━━▶ <li>A</li>  ← 相同位置，保留          ┃    ┃  
┃  ┃    <li>B</li> ━━▶ <li>B</li>  ← 相同位置，保留          ┃    ┃  
┃  ┃    <li>C</li> ━━▶ <li>C</li>  ← 相同位置，保留          ┃    ┃  
┃  ┃  </ul>                                                   ┃    ┃ 
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    ┃  
┃                                                                  ┃ 
┃  有 key (推荐):                                                  ┃ 
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    ┃  
┃  ┃  <ul>                                                    ┃    ┃ 
┃  ┃    <li key="a">A</li> ━━▶ <li key="a">A</li>         ┃    ┃     
┃  ┃    <li key="b">B</li> ━━▶ <li key="b">B</li>         ┃    ┃     
┃  ┃    <li key="c">C</li> ━━▶ <li key="c">C</li>         ┃    ┃     
┃  ┃  </ul>                                                   ┃    ┃ 
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    ┃  
┃                                                                  ┃ 
┃  列表重排场景:                                                    ┃
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    ┃  
┃  ┃  初始:                                                   ┃    ┃ 
┃  ┃  [A, B, C]                                               ┃    ┃ 
┃  ┃   ↓ insert at beginning                                  ┃    ┃ 
┃  ┃  [D, A, B, C]                                            ┃    ┃ 
┃  ┃                                                          ┃    ┃ 
┃  ┃  无 key (错误做法):                                      ┃    ┃ 
┃  ┃  A→D, B→A, C→B, 新建 C  ← 3 个更新 + 1 个新建           ┃    ┃  
┃  ┃                                                          ┃    ┃ 
┃  ┃  有 key (正确做法):                                      ┃    ┃ 
┃  ┃  新建 D, A→A, B→B, C→C  ← 1 个新建 + 3 个复用           ┃    ┃  
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    ┃  
┃                                                                  ┃ 
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  

```

**Key 使用原则：**

```javascript
// ✅ 正确：使用稳定且唯一的 ID
items.map(item => (
  <li key={item.id}>{item.name}</li>
));

// ✅ 正确：使用索引（仅当列表项顺序不变时）
items.map((item, index) => (
  <li key={index}>{item.name}</li>
));

// ❌ 错误：使用随机数或索引作为 key
items.map((item, index) => (
  <li key={Math.random()}>{item.name}</li>  // 每次渲染都是新 key
));

// ❌ 错误：在兄弟节点中使用重复的 key
items.map(item => (
  // 错误：多个 item 可能有相同的 name
  <li key={item.name}>{item.name}</li>
));
```

---

### 2.2 调和 (Reconciliation) 过程

#### 2.2.1 深度优先遍历

React 的调和过程采用深度优先遍历（DFS）算法处理 Fiber 树。

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   
┃                  React 深度优先遍历示例                           ┃ 
┃                                                                  ┃  
┃   组件树结构:                                                    ┃  
┃                                                                  ┃  
┃        A                                                       ┃    
┃       / \                                                      ┃    
┃      B   C                                                     ┃    
┃     / \   \                                                    ┃    
┃    D   E   F                                                   ┃    
┃                                                                  ┃  
┃   遍历顺序: A → B → D → E → C → F                              ┃    
┃                                                                  ┃  
┃   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    ┃  
┃   ┃                                                          ┃    ┃ 
┃   ┃   beginWork(A)                                           ┃    ┃ 
┃   ┃      ┃                                                   ┃    ┃ 
┃   ┃      ▼                                                   ┃    ┃ 
┃   ┃   beginWork(B)                                           ┃    ┃ 
┃   ┃      ┃                                                   ┃    ┃ 
┃   ┃      ▼                                                   ┃    ┃ 
┃   ┃   beginWork(D) ━━▶ completeWork(D) ━━▶ 向上             ┃    ┃  
┃   ┃      ┃                                                   ┃    ┃ 
┃   ┃      ▼                                                   ┃    ┃ 
┃   ┃   beginWork(E) ━━▶ completeWork(E) ━━▶ 向上              ┃    ┃ 
┃   ┃      ┃                                                   ┃    ┃ 
┃   ┃      ▼                                                   ┃    ┃ 
┃   ┃   completeWork(B) ━━▶ 向上                               ┃    ┃ 
┃   ┃      ┃                                                   ┃    ┃ 
┃   ┃      ▼                                                   ┃    ┃ 
┃   ┃   beginWork(C)                                           ┃    ┃ 
┃   ┃      ┃                                                   ┃    ┃ 
┃   ┃      ▼                                                   ┃    ┃ 
┃   ┃   beginWork(F) ━━▶ completeWork(F) ━━▶ 向上              ┃    ┃ 
┃   ┃      ┃                                                   ┃    ┃ 
┃   ┃      ▼                                                   ┃    ┃ 
┃   ┃   completeWork(C) ━━▶ 向上                               ┃    ┃ 
┃   ┃      ┃                                                   ┃    ┃ 
┃   ┃      ▼                                                   ┃    ┃ 
┃   ┃   completeWork(A)                                         ┃    ┃
┃   ┃                                                          ┃    ┃ 
┃   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    ┃  
┃                                                                  ┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   

```

**遍历过程源码逻辑：**

```javascript
// 简化的深度优先遍历逻辑
function performUnitOfWork(fiber) {
  // 1. 处理当前节点 (beginWork)
  const next = beginWork(fiber);

  if (next === null) {
    // 2. 没有子节点，开始回溯 (completeWork)
    let sibling = fiber.sibling;
    while (sibling) {
      completeUnitOfWork(sibling);
      sibling = sibling.sibling;
    }
    // 向上回溯到父节点
    return fiber.return;
  } else {
    // 3. 有子节点，继续向下遍历
    return next;
  }
}

function beginWork(fiber) {
  // 对比新旧 props
  // 确定是否需要更新
  // 协调子组件
  // 返回第一个子 Fiber 或 null
}

function completeWork(fiber) {
  // 处理 DOM 节点更新
  // 收集副作用
  // 标记 Placement/Update/Deletion
}
```

#### 2.2.2 状态更新批处理

React 18 引入了自动批处理（Automatic Batching），将多个状态更新合并为一次渲染。

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  
┃                    状态更新批处理机制                             ┃
┃                                                                  ┃ 
┃  React 18 之前 (手动批处理):                                     ┃ 
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    ┃  
┃  ┃                                                          ┃    ┃ 
┃  ┃  setCount(c => c + 1);  // 触发一次渲染                 ┃    ┃  
┃  ┃  setFlag(true);          // 触发第二次渲染               ┃    ┃ 
┃  ┃                                                          ┃    ┃ 
┃  ┃  结果：2 次渲染                                          ┃    ┃ 
┃  ┃                                                          ┃    ┃ 
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    ┃  
┃                                                                  ┃ 
┃  React 18+ (自动批处理):                                         ┃ 
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    ┃  
┃  ┃                                                          ┃    ┃ 
┃  ┃  setCount(c => c + 1);  // 加入更新队列                 ┃    ┃  
┃  ┃  setFlag(true);          // 加入更新队列                 ┃    ┃ 
┃  ┃  // 批量执行 → 1 次渲染                                 ┃    ┃  
┃  ┃                                                          ┃    ┃ 
┃  ┃  结果：1 次渲染                                          ┃    ┃ 
┃  ┃                                                          ┃    ┃ 
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    ┃  
┃                                                                  ┃ 
┃  批处理规则:                                                     ┃ 
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    ┃  
┃  ┃                                                          ┃    ┃ 
┃  ┃  在 React 事件处理器中：自动批处理                        ┃    ┃
┃  ┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ┃    ┃    
┃  ┃  ┃  function handleClick() {                        ┃  ┃    ┃   
┃  ┃  ┃    setCount(c => c + 1);                         ┃  ┃    ┃   
┃  ┃  ┃    setFlag(true);                               ┃  ┃    ┃    
┃  ┃  ┃    setName('John');                             ┃  ┃    ┃    
┃  ┃  ┃    // 批处理：只触发一次重渲染                     ┃  ┃    ┃ 
┃  ┃  ┃  }                                              ┃  ┃    ┃    
┃  ┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ┃    ┃    
┃  ┃                                                          ┃    ┃ 
┃  ┃  在 Promise/setTimeout 中：不再自动批处理 (React 18)    ┃    ┃  
┃  ┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ┃    ┃    
┃  ┃  ┃  Promise.resolve().then(() => {                 ┃  ┃    ┃    
┃  ┃  ┃    setCount(c => c + 1);  // 单独渲染             ┃  ┃    ┃  
┃  ┃  ┃    setFlag(true);        // 单独渲染               ┃  ┃    ┃ 
┃  ┃  ┃  });                                             ┃  ┃    ┃   
┃  ┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ┃    ┃    
┃  ┃                                                          ┃    ┃ 
┃  ┃  使用 flushSync 强制同步:                                ┃    ┃ 
┃  ┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ┃    ┃    
┃  ┃  ┃  import { flushSync } from 'react-dom';          ┃  ┃    ┃   
┃  ┃  ┃                                                    ┃  ┃    ┃ 
┃  ┃  ┃  flushSync(() => {                               ┃  ┃    ┃   
┃  ┃  ┃    setCount(c => c + 1);  // 同步执行             ┃  ┃    ┃  
┃  ┃  ┃  });                                              ┃  ┃    ┃  
┃  ┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ┃    ┃    
┃  ┃                                                          ┃    ┃ 
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    ┃  
┃                                                                  ┃ 
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  

```

**批处理流程图：**

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   
┃                    批处理工作流程                                 ┃ 
┃                                                                  ┃  
┃   用户交互/事件触发                                               ┃ 
┃        ┃                                                          ┃ 
┃        ▼                                                          ┃ 
┃   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    ┃  
┃   ┃              批量更新队列 (Update Queue)                  ┃    ┃
┃   ┃                                                          ┃    ┃ 
┃   ┃   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ┃    ┃   
┃   ┃   ┃  Update 1: setCount(c => c + 1)                 ┃  ┃    ┃   
┃   ┃   ┃  Update 2: setFlag(true)                        ┃  ┃    ┃   
┃   ┃   ┃  Update 3: setName('John')                      ┃  ┃    ┃   
┃   ┃   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ┃    ┃   
┃   ┃                                                          ┃    ┃ 
┃   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    ┃  
┃        ┃                                                          ┃ 
┃        ▼                                                          ┃ 
┃   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    ┃  
┃   ┃              调度阶段 (Scheduler)                        ┃    ┃ 
┃   ┃                                                          ┃    ┃ 
┃   ┃   根据优先级安排渲染任务                                  ┃    ┃
┃   ┃   (可中断、可恢复)                                        ┃    ┃
┃   ┃                                                          ┃    ┃ 
┃   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    ┃  
┃        ┃                                                          ┃ 
┃        ▼                                                          ┃ 
┃   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    ┃  
┃   ┃              渲染阶段 (Render Phase)                     ┃    ┃ 
┃   ┃                                                          ┃    ┃ 
┃   ┃   遍历更新队列，计算最终状态                              ┃    ┃
┃   ┃   count: 0 + 1 = 1                                       ┃    ┃ 
┃   ┃   flag: undefined → true                                ┃    ┃  
┃   ┃   name: '' → 'John'                                      ┃    ┃ 
┃   ┃                                                          ┃    ┃ 
┃   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    ┃  
┃        ┃                                                          ┃ 
┃        ▼                                                          ┃ 
┃   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    ┃  
┃   ┃              提交阶段 (Commit Phase)                     ┃    ┃ 
┃   ┃                                                          ┃    ┃ 
┃   ┃   DOM 更新 (只执行一次)                                  ┃    ┃ 
┃   ┃                                                          ┃    ┃ 
┃   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    ┃  
┃        ┃                                                          ┃ 
┃        ▼                                                          ┃ 
┃   一次重渲染完成                                                   ┃
┃                                                                  ┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   

```

---

