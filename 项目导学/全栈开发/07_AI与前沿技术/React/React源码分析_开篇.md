# React 源码分析：开篇

## 一、React 源码概述

React 是 Facebook（现 Meta）开源的前端 UI 库，其源码以其优雅的设计和精湛的技术实现而闻名。理解 React 源码不仅能帮助我们深入理解 React 的运行机制，还能提升整体的架构设计能力。

React 源码采用 monorepo 结构，所有核心包都集中在一个仓库中管理。这种结构使得各包之间的依赖关系清晰，便于协调开发和版本管理。

## 二、源码目录结构详解

### 2.1 整体目录架构

React 18.3.1 版本的源码目录结构如下：

```
react/
├── packages/
│   ├── react/                    # React 核心 API（createElement, Component, Hooks）
│   ├── react-dom/                # DOM 相关渲染（react-dom/client, react-dom/server）
│   ├── react-reconciler/         # 核心调和器（Fiber 架构实现）
│   ├── scheduler/                # 调度器（优先级、时间切片）
│   ├── events/                   # 事件系统（合成事件、插件系统）
│   ├── legacy/                    # 遗留代码（Fiber 之前的实现）
│   ├── shared/                    # 共享工具和常量
│   ├── use-subscription/          # useSubscription Hook
│   └── stable-stream/             # 流相关功能
├── scripts/                      # 构建脚本（Babel、Rollup）
├── fixtures/                      # 测试用例和示例
└── .gitignore, package.json, yarn.lock
```

### 2.2 核心包详解

#### react 包

**功能定位**：React 库的核心导出，包含所有公开 API。

**目录结构**：
```
packages/react/src/
├── React.ts                      # 主要导出
├── ReactBaseClasses.ts           # Component、PureComponent
├── ReactHooks.ts                 # Hooks API（useState、useEffect 等）
├── ReactCreateElement.js         # createElement 实现
├── ReactForwardRef.js            # forwardRef 实现
├── ReactContext.js               # Context API（createContext）
├── ReactLazy.js                  # lazy 和 Suspense
├── ReactMemo.js                  # memo、HOC
├── ReactTypes.ts                 # TypeScript 类型定义
└── __tests__/                    # 单元测试
```

**核心文件分析**：

1. **React.ts** - 主入口文件，导出所有公共 API：
```typescript
// 导出核心类型
export type { ElementType, ElementProps, ReactElement } from 'ReactTypes';

// 导出创建元素
export { createElement, jsx, jsxDEV, isValidElement } from './ReactCreateElement';

// 导出组件类型
export { Component, PureComponent } from './ReactBaseClasses';
export { Fragment, StrictMode } from './ReactFragment';

// 导出 Hooks
export {
  useState,
  useReducer,
  useEffect,
  useLayoutEffect,
  useRef,
  useImperativeHandle,
  useMemo,
  useCallback,
  useContext,
  useId,
  // ...
} from './ReactHooks';
```

2. **ReactHooks.ts** - Hooks 系统的入口文件：
```typescript
// 不同环境下使用不同的 dispatcher
export function useState<S>(initialState: (() => S) | S) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState);
}

export function useEffect(create: () => (() => void) | void, deps?: Array<mixed>) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useEffect(create, deps);
}

// 其他 Hooks 类似...
```

#### react-dom 包

**功能定位**：DOM 渲染相关功能，包括服务端渲染和客户端渲染。

**目录结构**：
```
packages/react-dom/
├── src/
│   ├── client/                   # 客户端渲染（ReactDOM.createRoot）
│   ├── server/                   # 服务端渲染（ReactDOM.renderToString）
│   ├── events/                   # DOM 事件相关
│   ├── ReactDOMComponentTree.js  # DOM 树操作
│   ├── ReactDOMFiberComponent.js # Fiber 模式的 DOM 操作
│   ├── ReactDOMRoot.js           # Root 入口
│   └── ReactDOMSharedInternals.js # 共享内部对象
└── package.json
```

**核心文件分析**：

1. **client/ReactDOMRoot.js** - Root 创建入口：
```typescript
export function createRoot(container: Element, options?: RootOptions) {
  // 创建 FiberRoot
  const root = createContainer(container, ConcurrentRoot);
  // 返回 Root 对象
  return new ReactDOMRoot(root);
}

ReactDOMRoot.prototype.render = function(children) {
  // 更新操作
  updateContainer(children, root, null, null);
};
```

2. **server/ReactDOMFizzServer.js** - 服务端渲染：
```typescript
// 流的式渲染
export function renderToReadableStream(children, options) {
  return new ReadableStream({
    start(controller) {
      // 创建流式渲染器
    },
    pull(controller) {
      // 继续渲染
    },
    cancel() {
      // 取消渲染
    }
  });
}
```

#### react-reconciler 包

**功能定位**：React 的核心调和器，负责协调组件树和维护 Fiber 架构。

**目录结构**：
```
packages/react-reconciler/
├── src/
│   ├── ReactFiber.new.js         # Fiber 创建（新版）
│   ├── ReactFiber.old.js         # Fiber 创建（旧版）
│   ├── ReactFiberBeginWork.js    # 阶段一：开始工作
│   ├── ReactFiberCompleteWork.js # 阶段二：完成工作
│   ├── ReactFiberCommitWork.js   # 阶段三：提交工作
│   ├── ReactFiberWorkLoop.js     # 工作循环
│   ├── ReactFiberExpiration.js   # 过期时间
│   ├── ReactUpdateQueue.js       # 更新队列
│   ├── ReactFiberHooks.js        # Hooks 实现
│   ├── ReactChildFiber.js        # 子节点调和
│   ├── ReactCoroutine.js         # 协程（Suspense）
│   └── ReactSuspense.js          # Suspense 实现
```

**核心文件分析**：

1. **ReactFiberWorkLoop.js** - 工作循环（核心中的核心）：
```typescript
// 工作循环函数
function workLoop() {
  // 循环直到没有待完成的工作
  while (workInProgress !== null) {
    workInProgress = performUnitOfWork(workInProgress);
  }
}

// 执行单个工作单元
function performUnitOfWork(fiber: Fiber): Fiber | null {
  // 保存当前 fiber
  const current = fiber.alternate;

  // 开始处理当前 fiber
  let next = beginWork(current, fiber, renderExpirationTime);

  // 如果没有更多子节点，完成当前 fiber
  if (next === null) {
    next = completeUnitOfWork(fiber);
  }

  return next;
}
```

2. **ReactFiberHooks.js** - Hooks 实现（后续章节详解）

#### scheduler 包

**功能定位**：任务调度器，负责优先级管理和时间切片。

**目录结构**：
```
packages/scheduler/
├── src/
│   ├── Scheduler.js              # 主调度器
│   ├── SchedulerMinMax.js       # 最小堆实现
│   ├── SchedulerHostConfig.js   # 环境配置
│   ├── requestHostCallback.js    # 回调请求
│   └── forks/                    # 平台特定实现
```

## 三、构建流程深度解析

### 3.1 构建工具链

React 使用以下工具进行构建：

| 工具 | 用途 | 配置位置 |
|------|------|----------|
| **Babel** | JS/JSX 转译 | scripts/rollup/ |
| **Rollup** | 打包生成最终产物 | rollup.config.js |
| **Prettier** | 代码格式化 | .prettierrc |
| **ESLint** | 代码检查 | .eslintrc.js |
| **Flow** | 静态类型检查（部分代码） | .flowconfig |

### 3.2 Rollup 构建配置

React 的 Rollup 配置文件位于 `scripts/rollup/` 目录：

**构建脚本结构**：
```javascript
// scripts/rollup/build.js
import { rollup } from 'rollup';
import { babel } from '@rollup/plugin-babel';
import replace from '@rollup/plugin-replace';

// 根据环境变量确定构建配置
const env = process.env.NODE_ENV;

// 导出不同环境的构建配置
export default [
  // 开发环境
  {
    input: 'packages/react-dom/src/client/ReactDOMRoot.js',
    output: {
      file: 'build/react-dom.development.js',
      format: 'umd',
    },
    plugins: [
      replace({ 'process.env.NODE_ENV': '"development"' }),
      babel({ /* babel 配置 */ }),
    ],
  },

  // 生产环境
  {
    input: 'packages/react-dom/src/client/ReactDOMRoot.js',
    output: {
      file: 'build/react-dom.production.min.js',
      format: 'umd',
    },
    plugins: [
      replace({ 'process.env.NODE_ENV': '"production"' }),
      babel({ /* babel 配置 */ }),
      terser(), // 压缩
    ],
  },
];
```

### 3.3 Babel 插件配置

React 使用自定义 Babel 插件进行代码转换：

**关键 Babel 插件**：

1. **@babel/plugin-transform-react-jsx** - JSX 转换：
```javascript
// 将 JSX 转换为 React.createElement
// <div className="container">Hello</div>
// 转换为
// React.createElement('div', { className: 'container' }, 'Hello')
```

2. **@babel/plugin-proposal-class-properties** - 类属性转换：
```javascript
// 类属性语法支持
class Counter extends React.Component {
  state = { count: 0 };  // 转换为构造函数中的赋值
}
```

3. **rollup-plugin-flow** - Flow 类型 stripping：
```javascript
// 移除 Flow 类型注解
// const x: number = 5; -> const x = 5;
```

### 3.4 构建产物分析

构建完成后，会生成针对不同环境的产物：

```
build/
├── react.development.js          # 开发版 React（未压缩）
├── react.production.min.js       # 生产版 React（压缩）
├── react-dom.development.js      # 开发版 React DOM
├── react-dom.production.min.js   # 生产版 React DOM
├── react-test-renderer.js        # 测试渲染器
├── scheduler.development.js      # 开发版调度器
└── scheduler.production.min.js   # 生产版调度器
```

## 四、核心包依赖关系

### 4.1 包之间的依赖图

```
┌─────────────────────────────────────────────────────────────────┐
│                         react                                   │
│  (createElement, Component, Hooks API)                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
┌─────────────────┐ ┌───────────────┐ ┌─────────────────────┐
│   react-dom     │ │ react-reconciler│ │     events         │
│                 │ │                 │ │                     │
│ - 渲染器        │ │ - Fiber 架构    │ │ - 合成事件          │
│ - DOM 操作      │ │ - 调和算法      │ │ - 事件委托          │
│ - 事件绑定      │ │ - Hooks 实现    │ │ - 批处理            │
└────────┬────────┘ └───────┬────────┘ └──────────┬──────────┘
         │                   │                     │
         │                   ▼                     │
         │          ┌─────────────────┐            │
         │          │    scheduler    │            │
         │          │                 │            │
         │          │ - 任务队列       │            │
         │          │ - 优先级管理     │            │
         │          │ - 时间切片       │            │
         │          └─────────────────┘            │
         │                                         │
         └─────────────────┬───────────────────────┘
                           │
                           ▼
                   ┌───────────────┐
                   │  shared        │
                   │                │
                   │ - 工具函数     │
                   │ - 常量定义     │
                   │ - ReactTypes   │
                   └───────────────┘
```

### 4.2 依赖传递关系

1. **react-dom 依赖 react-reconciler**
   ```javascript
   // react-dom/package.json
   {
     "dependencies": {
       "react": "18.3.1",
       "react-reconciler": "0.29.2"
     }
   }
   ```

2. **react-reconciler 依赖 scheduler**
   ```javascript
   // react-reconciler/package.json
   {
     "dependencies": {
       "scheduler": "0.23.2"
     }
   }
   ```

3. **react-dom 依赖 react**
   ```javascript
   // react/package.json
   {
     "name": "react",
     "version": "18.3.1"
   }
   ```

## 五、源码阅读路线图

### 5.1 推荐阅读顺序

基于依赖关系和复杂度，推荐以下阅读顺序：

```
第一阶段：基础概念（1-2天）
    │
    ├─ 1.1 了解 React 源码目录结构
    │      → 阅读本章节
    │      → 对整体架构有宏观认识
    │
    └─ 1.2 理解 JSX 转换原理
           → Babel 插件解析
           → createElement 流程

第二阶段：核心概念（3-5天）
    │
    ├─ 2.1 Fiber 架构（本系列第二篇）
    │      → Fiber 链表结构
    │      → WorkTag 定义
    │      → Fiber 与 Vue/Angular 对比
    │
    ├─ 2.2 调和算法（本系列第三篇）
    │      → Render 阶段
    │      → Commit 阶段
    │      → Diff 策略
    │
    └─ 2.3 Hooks 实现（本系列第四篇）
           → useState 原理
           → useEffect 原理
           → Hooks 规则

第三阶段：高级特性（2-3天）
    │
    ├─ 3.1 事件系统（本系列第五篇）
    │      → 合成事件
    │      → 事件委托
    │      → 批处理
    │
    ├─ 3.2 调度系统（本系列第六篇）
    │      → Scheduler 原理
    │      → lanes 模型
    │      → 时间切片
    │
    └─ 3.3 服务端组件（本系列第七篇）
           → RSC 原理
           → App Router
           → Streaming
```

### 5.2 各章节核心问题

| 章节 | 核心问题 | 关键源码文件 |
|------|----------|-------------|
| **开篇** | React 是如何组织的？ | React.ts, ReactDOMRoot.js |
| **Fiber 架构** | Fiber 是什么？如何工作？ | ReactFiber.js, ReactFiberWorkLoop.js |
| **调和算法** | React 如何更新 UI？ | ReactFiberBeginWork.js, ReactChildFiber.js |
| **Hooks 实现** | Hooks 如何记住状态？ | ReactFiberHooks.js |
| **事件系统** | 事件如何处理的？ | SyntheticEvent.js, EventPluginHub.js |
| **调度系统** | 更新如何排序？ | Scheduler.js, ReactFiberLane.js |
| **服务端组件** | RSC 如何工作？ | ReactServerContext.js, NextServer.js |

### 5.3 源码阅读技巧

#### 1. 使用 Git 标签切换版本

```bash
# 克隆 React 仓库
git clone https://github.com/facebook/react.git
cd react

# 切换到指定版本
git checkout tags/v18.3.1

# 查看历史
git log --oneline -20
```

#### 2. 使用 IDE 导航

推荐使用 VSCode 或 WebStorm，通过符号搜索（Symbol Search）快速定位函数定义。

#### 3. 调试技巧

在开发版本中添加断点：

```javascript
// 在 ReactFiberWorkLoop.js 中
function performUnitOfWork(fiber) {
  debugger;  // 添加断点
  // ...
}
```

#### 4. 打印 Fiber 结构

```javascript
// 在组件中添加
console.log(JSON.stringify(fiber, null, 2));
```

### 5.4 关键文件速查表

| 功能 | 文件路径 | 行数（估算） |
|------|----------|-------------|
| **入口导出** | packages/react/src/React.js | ~200 |
| **createElement** | packages/react/src/ReactCreateElement.js | ~150 |
| **Hooks 入口** | packages/react/src/ReactHooks.js | ~100 |
| **useState** | packages/react-reconciler/src/ReactFiberHooks.js | ~300 |
| **useEffect** | packages/react-reconciler/src/ReactFiberHooks.js | ~400 |
| **Fiber 创建** | packages/react-reconciler/src/ReactFiber.new.js | ~500 |
| **工作循环** | packages/react-reconciler/src/ReactFiberWorkLoop.js | ~800 |
| **beginWork** | packages/react-reconciler/src/ReactFiberBeginWork.js | ~1000 |
| **completeWork** | packages/react-reconciler/src/ReactFiberCompleteWork.js | ~700 |
| **commitWork** | packages/react-reconciler/src/ReactFiberCommitWork.js | ~800 |
| **Scheduler** | packages/scheduler/src/Scheduler.js | ~400 |
| **合成事件** | packages/events/src/SyntheticEvent.js | ~200 |
| **事件插件** | packages/events/src/EventPluginHub.js | ~150 |

## 六、总结

### 6.1 本章要点

1. **目录结构**：React 采用 monorepo 结构，核心包包括 react、react-dom、react-reconciler、scheduler
2. **构建工具**：使用 Babel + Rollup 进行代码转译和打包
3. **依赖关系**：react-reconciler 是核心，依赖 scheduler；react-dom 依赖 react-reconciler
4. **阅读路线**：从入口文件开始，沿着依赖关系逐步深入

### 6.2 下章预告

下一章我们将深入探讨 **React Fiber 架构**，包括：

- Fiber 链表结构设计
- 各种 WorkTag 的含义
- Scheduler 调度机制
- 帧调度与时间切片原理

---

**相关链接**：

- React 官方仓库：https://github.com/facebook/react
- React 18 源码：https://github.com/facebook/react/tree/v18.3.1
- Fiber 架构文档：https://github.com/acdlite/react-fiber-architecture
