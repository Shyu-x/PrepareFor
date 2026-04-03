# 微前端架构演进：Module Federation 2.0 深度原理解析 (2026版)

## 1. 概述

在现代巨型前端工程（Mega Frontend）中，单体架构（SPA）的构建时间长、团队协同冲突、部署效率低等问题日益凸显。微前端（Micro Frontends）应运而生。

经过 iframe、Single-SPA 等时代的演进，**Webpack Module Federation (模块联邦)** 彻底改变了游戏规则。而在 2026 年，以 Rspack/Webpack 为底座的 **Module Federation 2.0 (MF 2.0)** 带来了运行时插件、动态类型提示等革命性特性。

本指南深入解析 MF 2.0 的底层运行机制，剥开“跨应用共享代码”的技术黑盒。

---

## 2. 模块联邦 (Module Federation) 的核心概念

传统微前端（如 qiankun）通常是在**应用级别**进行组合，即基座加载子应用的 HTML/JS，然后挂载到特定 DOM 上。

**Module Federation 是在“模块级别”的联邦。**
它允许不同的 Webpack/Rspack 构建独立打包，但在**运行时 (Runtime)**，应用 A 可以像本地代码一样，动态 `import()` 应用 B 暴露出来的任何一个组件、函数或库。

### 2.1 三大核心角色
1. **Host (宿主/基座)**：在页面初始加载时被执行的应用。它消费（依赖）远程模块。
2. **Remote (远程/子应用)**：被其他应用消费的应用。它暴露（导出）内部的模块供别人使用。
   *(注：一个应用可以同时既是 Host 也是 Remote，形成网状联邦)*
3. **Shared (共享依赖)**：防止重复打包的核心机制。比如 Host 和 Remote 都依赖 `react@19`。联邦机制会在运行时协商，只加载一份高版本的 React，让双方共享。

---

## 3. MF 2.0 底层运行机制深度拆解

当你在 Host 应用中写下 `const RemoteButton = React.lazy(() => import('app2/Button'));` 时，底层到底发生了什么？

### 3.1 构建时 (Build Time)：生成 Remote Entry
当打包 Remote 应用时，除了生成正常的业务 Chunk，插件还会生成一个特殊的 **`remoteEntry.js`**（通常被称为容器清单文件）。
这个文件包含两个重要部分：
- **模块映射表 (Module Map)**：记录了 `expose` 出去的模块对应的真实 chunk 文件名（含 hash）。
- **共享库映射表 (Shared Scope)**：记录了自己依赖的共享库版本信息。

### 3.2 运行时 (Runtime)：动态加载与协商
当 Host 启动时，它首先加载自己的主逻辑，然后注入 MF Runtime。

1. **加载 Entry**：Host 在用到远程模块前，会先发送 HTTP 请求下载 Remote 的 `remoteEntry.js`。
2. **依赖协商 (Version Negotiation)**：
   - Host 检查 `remoteEntry` 里的 Shared Scope。
   - 比如 Host 使用 `lodash@4.17.20`，Remote 使用 `lodash@4.17.21`。
   - MF Runtime 会比较版本（依据 SemVer 规则），发现版本兼容，于是**决定只加载 Remote 提供的高版本 `lodash`，Host 直接复用它**。
3. **请求 Chunk**：协商完毕后，MF Runtime 根据映射表，发起真正的 HTTP 请求下载 `Button.chunk.js`。
4. **注入执行**：下载完成后，利用 JSONP 机制将代码注入宿主环境执行。

---

## 4. Module Federation 2.0 的革命性升级

MF 1.0 虽然强大，但在复杂企业环境中仍有痛点：缺乏类型提示、环境隔离差、监控困难。MF 2.0 针对这些进行了重构。

### 4.1 抽象出的独立 Runtime
在 1.0 中，联邦的运行逻辑深埋在 Webpack 的内部产物中。
MF 2.0 将联邦逻辑剥离成了一个独立的 `@module-federation/runtime`。这意味着：
- **跨构建工具互通**：你可以用 Rspack 构建 Host，用 Webpack 构建 Remote，甚至未来接入 Vite，只要大家都遵循这套 Runtime 协议。
- **运行时动态加载**：不再需要在配置中硬编码远程应用的 URL。你可以在代码里通过 API 动态注册 Remote：
  ```javascript
  import { init, loadRemote } from '@module-federation/runtime';

  init({
    name: 'hostApp',
    remotes: [{ name: 'app2', entry: 'https://app2.com/remoteEntry.js' }],
  });

  const Button = await loadRemote('app2/Button');
  ```

### 4.2 运行时插件系统 (Runtime Plugins)
2.0 提供了强大的生命周期钩子，允许你在模块加载的各个阶段插入自定义逻辑。
- **场景：身份鉴权**：在请求 remoteEntry 前，通过插件拦截请求，动态附加上用户的 Token Header。
- **场景：降级与容灾**：如果 Remote 应用挂了，通过 `beforeLoadShare` 或 `errorLoadRemote` 钩子，返回一个默认的本地备用组件，防止整个 Host 页面白屏。

### 4.3 动态类型提示 (Dynamic TypeScript)
微前端最大的开发痛点是：你在 Host 里引入 `'app2/Button'`，IDE 根本不知道它有什么 Props，直接推断为 `any`。
MF 2.0 引入了**类型联邦 (Type Federation)**：
在构建 Remote 时，会自动生成 `.d.ts` 类型清单并一同部署。Host 在开发环境下会自动拉取这些远程类型文件，实现**跨应用的完美 TypeScript 智能提示**。

---

## 5. 面试高频问题

**Q1：Module Federation 与 qiankun (基于 Single-SPA) 的本质区别是什么？**
**答：** 
- **qiankun** 是基于**路由分发**和**HTML Entry**的应用级微前端。它注重环境隔离（JS 沙箱、CSS 隔离），适合把不同技术栈（Vue/React/Angular）的老项目硬凑在一起。
- **Module Federation** 是基于**代码拆分 (Code Splitting)** 的模块级微前端。它不需要 iframe 或复杂的沙箱，就像加载本地组件一样无缝。它的核心优势是极致的**依赖共享**和高性能，但前提是微应用间的技术栈相对统一（比如全员 React），否则容易发生样式冲突和全局变量污染。

**Q2：如果 Host 和 Remote 的 React 版本不兼容怎么办？**
**答：** 如果在配置 Shared 时标记了 `singleton: true` 和 `strictVersion: true`，当 MF Runtime 发现 Host 是 React 18，而 Remote 需要 React 19 且不兼容时，它会**直接抛出错误**拒绝加载，以防应用崩溃。如果不开启严格模式，MF 会回退到：为 Host 加载一份 React 18，为 Remote 额外下载一份 React 19（这会损失性能并可能导致 Context 失效，因此强依赖单例的库如 React/Vue 必须强制版本兼容）。

---
*本文档持续更新，最后更新于 2026 年 3 月*