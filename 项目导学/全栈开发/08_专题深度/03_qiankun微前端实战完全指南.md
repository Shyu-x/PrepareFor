# qiankun微前端实战完全指南

## 前言：qiankun是什么？

### 用现实生活的比喻来理解

想象一下，你是一个大酒店的经理。这个酒店很大，有很多不同的部门：

```
传统大酒店（单体应用）：
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                        酒店大堂                                  │
│                          ↓                                      │
│    ┌─────────────────────────────────────────────────────┐     │
│    │                    餐饮部                            │     │
│    │         (中餐 + 西餐 + 酒吧 + 客房服务)                │     │
│    │                                                      │     │
│    │                    前厅部                            │     │
│    │         (前台 + 礼宾 + 客房预订 + 客户关系)            │     │
│    │                                                      │     │
│    │                    客房部                            │     │
│    │         (客房清洁 + 布草管理 + 维修保养)               │     │
│    │                                                      │     │
│    │                    人力资源部                         │     │
│    │         (招聘 + 培训 + 薪酬 + 绩效考核)                │     │
│    └─────────────────────────────────────────────────────┘     │
│                                                                 │
│   问题：任何一个部门出问题，可能影响整个酒店                       │
│   问题：升级一个部门的系统，可能影响其他部门                      │
│   问题：每个部门都要等整个酒店审批，效率低下                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

```
使用qiankun后的酒店（微服务架构）：
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                        酒店管理集团                              │
│                     （主应用 - 统一管理）                         │
│                          ↓                                      │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│    │  餐饮部   │  │  前厅部  │  │  客房部   │  │ 人力资源 │      │
│    │ (独立运营)│  │ (独立运营)│  │ (独立运营)│  │(独立运营) │      │
│    └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
│                                                                 │
│   每个部门：                                                    │
│   ✅ 独立运营，有自己的管理制度                                   │
│   ✅ 独立招聘，自己决定需要什么样的人                              │
│   ✅ 独立考核，自己制定KPI                                       │
│   ✅ 出了问题，只影响自己部门，不影响其他部门                      │
│   ✅ 可以随时升级自己的系统，不用等整个酒店                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**qiankun**就是这样一个"酒店管理集团"，它帮助你把一个巨大的前端应用拆分成多个独立的小应用（叫做"子应用"），每个子应用可以独立开发、独立测试、独立部署，就像酒店的每个部门独立运营一样。

### qiankun的由来

qiankun是蚂蚁金服开源的微前端框架，名字来源于"乾坤"（qián kūn），寓意着"包罗万象、包容一切"。它的前身是`single-spa`，qiankun在single-spa的基础上做了大量优化，让开发者有更好的体验。

---

## 一、qiankun的核心概念

### 1.1 主应用（Container App）

主应用就像是酒店的"管理集团"，负责：

```
主应用的职责：
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   1. 整体布局和导航                                               │
│      ├── 顶部导航栏（所有子应用共享）                              │
│      ├── 侧边栏菜单（所有子应用共享）                              │
│      └── 主内容区（子应用在这里渲染）                              │
│                                                                 │
│   2. 子应用管理                                                   │
│      ├── 注册子应用（告诉主应用有哪些子应用）                      │
│      ├── 加载子应用（按需加载）                                   │
│      ├── 挂载子应用（把子应用渲染到页面）                          │
│      └── 卸载子应用（当用户离开时清理）                            │
│                                                                 │
│   3. 公共资源管理                                                 │
│      ├── 提供共享的CSS（全局样式）                                │
│      ├── 提供共享的JavaScript（工具函数）                          │
│      └── 管理全局状态                                             │
│                                                                 │
│   4. 路由管理                                                     │
│      ├── 根据URL决定加载哪个子应用                                 │
│      └── 处理浏览器的前进/后退                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 子应用（Micro App）

子应用就像是酒店的"各个部门"，负责：

```
子应用的职责：
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   1. 独立运行                                                     │
│      ├── 可以独立启动、单独访问                                   │
│      ├── 有自己的路由系统                                         │
│      └── 有自己的状态管理                                        │
│                                                                 │
│   2. 导出生命周期钩子                                             │
│      ├── bootstrap：初始化                                       │
│      ├── mount：挂载                                             │
│      ├── unmount：卸载                                          │
│      └── update：更新（可选）                                     │
│                                                                 │
│   3. 响应主应用信号                                               │
│      ├── 知道自己什么时候被显示                                   │
│      ├── 知道自己什么时候被隐藏                                   │
│      └── 知道自己什么时候被销毁                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 沙箱隔离（Sandbox）

沙箱是qiankun最核心的功能之一。想象一下：

```
没有沙箱的情况：
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   子应用A：window.userName = '张三'                              │
│   子应用B：window.userName = '李四'                              │
│                                                                 │
│   结果：后定义的覆盖了先定义的，谁覆盖谁完全看加载顺序              │
│                                                                 │
│   子应用A定义了 window.getUser()                                  │
│   子应用B也定义了 window.getUser()                               │
│                                                                 │
│   结果：两个子应用用的是同一个函数，互相影响，bug丛生              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

```
有沙箱的情况：
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    沙箱A（子应用A的运行环境）             │   │
│   │   window.userName = '张三'  ← 仅在沙箱A内有效             │   │
│   │   window.getUser() = fnA   ← 仅在沙箱A内有效             │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    沙箱B（子应用B的运行环境）             │   │
│   │   window.userName = '李四'  ← 仅在沙箱B内有效             │   │
│   │   window.getUser() = fnB   ← 仅在沙箱B内有效             │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   结果：两个子应用完全隔离，互不影响！                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

qiankun通过JavaScript代理技术，为每个子应用创造了一个独立的"沙箱环境"，确保：

- 变量不污染全局
- CSS样式不冲突
- 事件监听器不干扰

---

## 二、qiankun的工作原理

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         qiankun框架                              │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                      主应用                             │   │
│   │  ┌─────────────────────────────────────────────────┐    │   │
│   │  │              import { loadMicroApp } from 'qiankun' │  │
│   │  │                                                 │    │   │
│   │  │  // 加载子应用                                   │    │   │
│   │  │  const app = loadMicroApp({                    │    │   │
│   │  │    name: 'order-app',                         │    │   │
│   │  │    entry: '//localhost:7001',                  │    │   │
│   │  │    container: '#micro-app-container',          │    │   │
│   │  │  });                                           │    │   │
│   │  └─────────────────────────────────────────────────┘    │   │
│   │                         ↓                               │   │
│   │  ┌─────────────────────────────────────────────────┐    │   │
│   │  │                   Sandbox                        │    │   │
│   │  │   ├── JS沙箱（Proxy代理全局变量）                │    │   │
│   │  │   ├── CSS沙箱（scoped CSS隔离）                 │    │   │
│   │  │   └── 快照沙箱（记录全局变量变更）                │    │   │
│   │  └─────────────────────────────────────────────────┘    │   │
│   └─────────────────────────────────────────────────────────┘   │
│                              ↓                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                      子应用                              │   │
│   │                                                         │   │
│   │   export async function bootstrap() { }                │   │
│   │   export async function mount(props) { }                │   │
│   │   export async function unmount() { }                  │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 生命周期管理

qiankun的子应用需要实现四个生命周期钩子（最重要的是前三个）：

```typescript
// 子应用的入口文件
// src/index.ts

/**
 * 应用初始化时调用
 * 只会被调用一次
 * 适合做一些全局的初始化工作
 */
export async function bootstrap() {
  console.log('子应用初始化');

  // 初始化 Redux store
  // 初始化 i18n
  // 加载全局配置
}

/**
 * 子应用被挂载时调用
 * 可能被调用多次（比如用户多次进入/离开）
 * 适合做渲染相关的工作
 */
export async function mount(props) {
  console.log('子应用被挂载', props);

  // props是主应用传递给子应用的数据和方法
  // 比如：主应用传递的共享状态、主应用传递的回调函数

  // 创建React/Vue根实例并渲染
  ReactDOM.render(<App />, document.getElementById('root'));
}

/**
 * 子应用被卸载时调用
 * 清理工作必须在这里完成
 * 否则会造成内存泄漏
 */
export async function unmount() {
  console.log('子应用被卸载');

  // 取消所有定时器
  // 取消所有事件监听
  // 清理DOM
  // 销毁React/Vue实例
  ReactDOM.unmountComponentAtNode(document.getElementById('root'));
}

/**
 * 可选：应用更新时调用
 * 当主应用传递的props变化时触发
 */
export async function update(props) {
  console.log('子应用更新', props);
}
```

---

## 三、主应用配置详解

### 3.1 基础配置

```typescript
// 主应用入口文件
// src/index.ts

import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerMicroApps, start } from 'qiankun';
import App from './App';

// 注册子应用
// registerMicroApps 告诉主应用有哪些子应用，以及它们的加载规则
registerMicroApps([
  {
    // 子应用的名称，唯一标识
    name: 'user-app',

    // 子应用的入口地址
    // 开发环境：//localhost:3001
    // 生产环境：//cdn.example.com/user-app/
    entry: '//localhost:3001',

    // 子应用挂载的DOM节点
    container: '#user-container',

    // 当路由匹配这个规则时，加载对应的子应用
    // activeRule 支持多种匹配方式
    activeRule: '/user',

    // 可选：传递给子应用的props
    props: {
      // 主应用共享的数据
      sharedState: '来自主应用的数据',

      // 主应用提供的回调函数
      onGlobalStateChange: (state) => {
        console.log('子应用状态变更:', state);
      }
    }
  },

  {
    name: 'order-app',
    entry: '//localhost:3002',
    container: '#order-container',
    activeRule: '/order'
  },

  {
    name: 'product-app',
    entry: '//localhost:3003',
    container: '#product-container',
    activeRule: '/product'
  }
]);

// 启动qiankun
// start() 会初始化沙箱、设置全局代理、启动路由监控
start({
  // 是否开启沙箱隔离
  // 默认true，建议保持开启
  sandbox: true,

  // 是否开启预加载
  // 当浏览器空闲时，提前加载子应用
  // 默认true
  prefetch: true,

  // 子应用入口的fetch方式
  // 可用于配置认证信息等
  fetch: (url, { singleton }) => {
    return fetch(url, {
      headers: {
        // 可以添加自定义请求头
        'X-Custom-Header': 'qiankun'
      }
    });
  }
});

// 渲染主应用
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
```

### 3.2 主应用组件结构

```typescript
// 主应用的App组件
// src/App.tsx

import React, { useState } from 'react';
import './App.css';

function App() {
  // 当前激活的子应用
  const [activeApp, setActiveApp] = useState('user-app');

  return (
    <div className="main-app">
      {/* 顶部导航栏 */}
      <header className="main-header">
        <h1>企业管理系统</h1>
        <nav className="main-nav">
          <button
            className={activeApp === 'user-app' ? 'active' : ''}
            onClick={() => setActiveApp('user-app')}
          >
            用户管理
          </button>
          <button
            className={activeApp === 'order-app' ? 'active' : ''}
            onClick={() => setActiveApp('order-app')}
          >
            订单管理
          </button>
          <button
            className={activeApp === 'product-app' ? 'active' : ''}
            onClick={() => setActiveApp('product-app')}
          >
            商品管理
          </button>
        </nav>
      </header>

      {/* 主内容区 */}
      <main className="main-content">
        {/* 用户模块容器 */}
        <div
          id="user-container"
          className="micro-container"
          style={{ display: activeApp === 'user-app' ? 'block' : 'none' }}
        />

        {/* 订单模块容器 */}
        <div
          id="order-container"
          className="micro-container"
          style={{ display: activeApp === 'order-app' ? 'block' : 'none' }}
        />

        {/* 商品模块容器 */}
        <div
          id="product-container"
          className="micro-container"
          style={{ display: activeApp === 'product-app' ? 'block' : 'none' }}
        />
      </main>
    </div>
  );
}

export default App;
```

### 3.3 使用React Router的自动路由

如果你使用React Router，可以更优雅地管理子应用：

```typescript
// 使用React Router进行自动路由管理
// src/index.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation
} from 'react-router-dom';
import { registerMicroApps, start, use/qiankunStateForSlave } from 'qiankun';
import Layout from './Layout';

// 初始化qiankun状态（用于父子应用通信）
// 这个hook让子应用可以访问主应用的状态
const QiankunStateForSlave = use/qiankunStateForSlave;

// 启动qiankun
registerMicroApps([
  {
    name: 'user-app',
    entry: '//localhost:3001',
    container: '#subapp-container',
    // 使用路由前缀作为激活规则
    // 当URL以/user开头时，自动激活user-app
    activeRule: '/user'
  },
  {
    name: 'order-app',
    entry: '//localhost:3002',
    container: '#subapp-container',
    activeRule: '/order'
  }
]);

start();

// 主应用根组件
function Root() {
  return (
    <ConfigProvider>
      <BrowserRouter>
        {/* 主应用布局 */}
        <Layout>
          {/* 子应用容器 */}
          <Routes>
            {/* 所有未匹配的路由都渲染子应用 */}
            <Route path="/*" element={<MicroAppRoute />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ConfigProvider>
  );
}

// 子应用路由组件
function MicroAppRoute() {
  const location = useLocation();
  const navigate = useNavigate();

  // 根据当前路径确定加载哪个子应用
  const activeRule = getActiveRule(location.pathname);

  return (
    <div id="subapp-container">
      {/* 这里qiankun会自动根据activeRule渲染对应的子应用 */}
    </div>
  );
}

// 根据路径获取激活规则
function getActiveRule(pathname) {
  if (pathname.startsWith('/user')) return '/user';
  if (pathname.startsWith('/order')) return '/order';
  if (pathname.startsWith('/product')) return '/product';
  return '/';
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Root />);
```

---

## 四、子应用配置详解

### 4.1 React子应用

```typescript
// React子应用入口文件
// src/index.ts

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * 应用初始化时调用
 * 只会被调用一次
 */
export async function bootstrap() {
  console.log('[user-app] 应用初始化');

  // 可以在这里做一些全局初始化
  // 比如：初始化i18n、加载全局配置等
}

/**
 * 子应用被挂载时调用
 * @param props 主应用传递的数据和方法
 */
export async function mount(props) {
  console.log('[user-app] 应用挂载', props);

  // 创建React根实例并渲染
  const container = document.getElementById('root');
  const root = ReactDOM.createRoot(container);

  // 将主应用传递的props传递给React组件
  root.render(
    <App
      // 从props中解构出主应用传递的数据和方法
      sharedState={props.sharedState}
      onGlobalStateChange={props.onGlobalStateChange}
      setGlobalState={props.setGlobalState}
    />
  );
}

/**
 * 子应用被卸载时调用
 * 必须清理所有资源
 */
export async function unmount() {
  console.log('[user-app] 应用卸载');

  // 获取根节点
  const container = document.getElementById('root');

  // 销毁React应用
  // 重要！不调用这个会造成内存泄漏
  ReactDOM.flushSync(() => {
    ReactDOM.unmountComponentAtNode(container);
  });
}

/**
 * 应用更新时调用（可选）
 */
export async function update(props) {
  console.log('[user-app] 应用更新', props);
}
```

```typescript
// React子应用的根组件
// src/App.tsx

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import UserList from './pages/UserList';
import UserDetail from './pages/UserDetail';
import './App.css';

interface AppProps {
  // 主应用传递的共享状态
  sharedState?: any;
  // 主应用传递的全局状态变更回调
  onGlobalStateChange?: (state: any) => void;
  // 主应用传递的设置全局状态方法
  setGlobalState?: (state: any) => void;
}

function App(props: AppProps) {
  const [users, setUsers] = useState([]);

  // 监听主应用传递的全局状态变化
  useEffect(() => {
    // 如果主应用传递了状态变更回调，订阅它
    if (props.onGlobalStateChange) {
      props.onGlobalStateChange((state) => {
        console.log('收到主应用状态更新:', state);
        // 可以根据需要处理这个状态
      });
    }
  }, []);

  // 通知主应用状态变更
  const notifyMasterApp = (newState) => {
    if (props.setGlobalState) {
      props.setGlobalState(newState);
    }
  };

  return (
    <BrowserRouter basename="/user">
      <div className="user-app">
        <h2>用户管理模块</h2>

        {/* 路由配置 */}
        <nav>
          <Link to="/list">用户列表</Link>
          <Link to="/detail/1">用户详情</Link>
        </nav>

        {/* 路由 */}
        <Routes>
          <Route path="/list" element={<UserList />} />
          <Route path="/detail/:id" element={<UserDetail />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
```

### 4.2 Vue子应用

```typescript
// Vue子应用入口文件
// src/index.js

import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import './styles.css';

let instance = null;

/**
 * Vue子应用的生命周期钩子
 */

/**
 * 应用初始化
 * 创建Vue实例但还不渲染
 */
export async function bootstrap() {
  console.log('[user-app-vue] 应用初始化');

  // 可以在这里做一些全局初始化
}

/**
 * 应用挂载
 * 渲染Vue应用到DOM
 */
export async function mount(props) {
  console.log('[user-app-vue] 应用挂载', props);

  // 创建Vue实例
  instance = new Vue({
    router,
    store,
    render: h => h(App, {
      // 将主应用的props传递给Vue组件
      props: {
        masterProps: props
      }
    })
  });

  // 挂载到指定DOM节点
  instance.$mount('#app');
}

/**
 * 应用卸载
 * 清理Vue实例
 */
export async function unmount() {
  console.log('[user-app-vue] 应用卸载');

  // 销毁Vue实例
  if (instance) {
    instance.$destroy();
    instance.$el.innerHTML = '';
    instance = null;
  }
}
```

```typescript
// Vue子应用的App.vue
// src/App.vue

<template>
  <div class="user-app-vue">
    <h2>用户管理模块（Vue）</h2>

    <!-- 路由视图 -->
    <router-view />

    <!-- 测试父子通信按钮 -->
    <button @click="testCommunication">
      测试与主应用通信
    </button>
  </div>
</template>

<script>
export default {
  name: 'App',

  // 接收主应用传递的props
  props: {
    masterProps: {
      type: Object,
      default: () => ({})
    }
  },

  methods: {
    testCommunication() {
      // 调用主应用传递的方法
      if (this.masterProps.setGlobalState) {
        this.masterProps.setGlobalState({
          from: 'vue-user-app',
          message: '你好，主应用！'
        });
      }
    }
  }
};
</script>
```

### 4.3 Vue3子应用

```typescript
// Vue3子应用入口文件
// src/index.js

import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';

let app = null;
let pinia = null;

/**
 * Vue3子应用生命周期
 */

export async function bootstrap() {
  console.log('[user-app-vue3] 应用初始化');
}

export async function mount(props) {
  console.log('[user-app-vue3] 应用挂载', props);

  // 创建Pinia实例（Vue3的状态管理）
  pinia = createPinia();

  // 创建Vue应用实例
  app = createApp(App);

  // 使用路由和状态管理
  app.use(router);
  app.use(pinia);

  // 挂载到DOM
  app.mount('#app');
}

export async function unmount() {
  console.log('[user-app-vue3] 应用卸载');

  // 卸载Vue应用
  if (app) {
    app.unmount();
    app = null;
  }

  // 清理Pinia
  if (pinia) {
    pinia = null;
  }
}
```

---

## 五、沙箱隔离详解

### 5.1 什么是沙箱？

qiankun的沙箱机制就像给每个子应用提供了一个"独立房间"：

```
┌─────────────────────────────────────────────────────────────────┐
│                         主应用                                   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                     沙箱A                                │   │
│   │                                                         │   │
│   │   子应用A在里面的所有操作都是"房间内"的                   │   │
│   │   window.name = 'A'  ← 不会影响其他房间                 │   │
│   │   window.alert = ... ← 不会影响其他房间                  │   │
│   │                                                         │   │
│   │   样式也是隔离的                                         │   │
│   │   <style> .button { color: red } </style>               │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                     沙箱B                                │   │
│   │                                                         │   │
│   │   子应用B在里面的所有操作都是"房间内"的                   │   │
│   │   window.name = 'B'  ← 不会影响其他房间                 │   │
│   │   window.fetch = ... ← 不会影响其他房间                  │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 JS沙箱的实现原理

qiankun使用JavaScript的`Proxy`代理机制来实现JS沙箱：

```typescript
// qiankun沙箱原理简化实现

/**
 * 创建一个沙箱环境
 * @param extraEl 额外的DOM节点（用于CSS隔离）
 * @returns 沙箱实例
 */
function createSandbox() {
  // 用于存储子应用修改的全局变量
  const modifiedProperties = new Set();

  // 用于存储子应用添加的事件监听器
  const addedEventListeners = new Map();

  // 原始的window对象
  const originalWindow = window;

  // 创建window的代理
  const sandboxProxy = new Proxy(window, {
    // 拦截属性读取
    get(target, property, receiver) {
      // 如果子应用修改过这个属性，返回修改后的值
      if (modifiedProperties.has(property)) {
        return target[property];
      }
      // 否则返回原始值
      return originalWindow[property];
    },

    // 拦截属性设置
    set(target, property, value, receiver) {
      // 记录被修改的属性
      modifiedProperties.add(property);
      // 在子应用的沙箱中设置这个值
      target[property] = value;
      return true;
    },

    // 拦截方法调用
    has(target, property) {
      // 返回属性是否存在
      return property in target || modifiedProperties.has(property);
    }
  });

  return {
    proxy: sandboxProxy,

    // 沙箱启动时的回调
    async start() {
      // 用沙箱代理替换全局window
      // 这样子应用中的代码就会使用代理后的window
      // 注意：这是简化示例，实际实现更复杂
      window = sandboxProxy;
    },

    // 沙箱关闭时的回调
    async stop() {
      // 恢复原始window
      window = originalWindow;

      // 清理子应用修改的全局变量
      modifiedProperties.forEach(prop => {
        delete originalWindow[prop];
      });
      modifiedProperties.clear();

      // 清理事件监听器
      addedEventListeners.forEach((listeners, element) => {
        listeners.forEach(listener => {
          element.removeEventListener('click', listener);
        });
      });
      addedEventListeners.clear();
    }
  };
}
```

### 5.3 CSS沙箱的实现原理

qiankun使用多种策略来隔离CSS：

```typescript
// CSS隔离策略

/**
 * 策略一：CSS Modules（编译时隔离）
 *
 * 在构建时将类名编译成唯一的哈希值
 * .button 编译成 .button_abc123
 * 优点：完全隔离
 * 缺点：需要构建工具支持
 */

/**
 * 策略二：Shadow DOM（运行时隔离）
 *
 * 使用Web Components的Shadow DOM
 * 优点：天然隔离
 * 缺点：有些样式不兼容
 */

/**
 * 策略三：动态样式表（qiankun使用）
 *
 * 为每个子应用的样式添加唯一的命名空间前缀
 * 优点：兼容性好
 * 缺点：需要运行时处理
 */

// qiankun内部实现（简化）
function styleScope(html, appName) {
  // 为所有类名添加前缀
  // 比如：.button 变成 .user-app .button
  const prefix = `.${appName}`;

  // 处理style标签
  const processedHtml = html.replace(
    /<style>([\s\S]*?)<\/style>/g,
    (match, styleContent) => {
      // 在样式内容前添加前缀选择器
      return `<style>${appName} ${styleContent}</style>`;
    }
  );

  return processedHtml;
}
```

### 5.4 沙箱配置选项

```typescript
// start函数的沙箱配置
start({
  // 沙箱配置
  sandbox: {
    // 是否启用沙箱
    // 默认true
    // 如果设为false，子应用会直接运行在全局环境，不推荐
    strictStyleIsolation: true,

    // 实验性特性：使用Shadow DOM进行样式隔离
    // 默认false
    // 设为true时，会将子应用挂载到一个Shadow DOM中
    // 可以实现更彻底的样式隔离
    experimentalStyleIsolation: false,

    // 沙箱的类型
    // 'snapshot' - 快照沙箱（兼容性差，已废弃）
    // 'proxy' - 代理沙箱（推荐，默认值）
    // 'instantSsrExports'
    type: 'proxy'
  }
});
```

---

## 六、通信机制

### 6.1 基于InitGlobalState的全局状态

qiankun提供了内置的全局状态管理方案：

```typescript
// 主应用 - 初始化全局状态
// src/index.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerMicroApps, initGlobalState, start } from 'qiankun';
import App from './App';

// 初始化全局状态
// 这个状态可以在所有子应用之间共享
const globalState = {
  // 当前的登录用户
  user: null,
  // 全局主题
  theme: 'light',
  // 全局语言设置
  locale: 'zh-CN'
};

// 创建全局状态实例
// onGlobalStateChange: 状态变更时的回调
// setGlobalState: 设置全局状态
// getGlobalState: 获取当前全局状态
const { onGlobalStateChange, setGlobalState, getGlobalState } = initGlobalState(globalState);

// 监听全局状态变更
// 这让你可以在主应用中响应子应用的状态变更
onGlobalStateChange((state, prev) => {
  console.log('[主应用] 全局状态变更:', state, '之前的值:', prev);

  // 根据状态变化更新UI
  if (state.theme !== prev.theme) {
    console.log('主题切换了');
  }
});

// 注册子应用
registerMicroApps([
  {
    name: 'user-app',
    entry: '//localhost:3001',
    container: '#container',
    activeRule: '/user'
  }
]);

// 启动应用
start();

// 设置初始状态
setGlobalState({
  user: { id: 1, name: '管理员' }
});
```

```typescript
// 子应用 - 访问全局状态
// 子应用入口文件 src/index.ts

let props = {};

/**
 * 应用挂载时获取props
 */
export async function mount(props) {
  console.log('[子应用] 挂载', props);

  // 保存props，供后续使用
  props = props;

  // 订阅全局状态变更
  // 当全局状态变化时，会自动调用这个回调
  props.onGlobalStateChange?.((state, prev) => {
    console.log('[子应用] 全局状态变更:', state);
    console.log('[子应用] 之前的状态:', prev);

    // 响应状态变化，比如更新本地状态
    if (state.user !== prev.user) {
      console.log('[子应用] 用户信息变更了');
    }
  }, true);  // 第二个参数true表示立即调用一次回调，获取当前状态

  // 设置全局状态
  // 其他子应用和主应用都会收到这个变更
  props.setGlobalState?.({
    user: { id: 2, name: '新用户' }
  });

  // 获取当前全局状态
  const currentState = props.getGlobalState?.();
  console.log('[子应用] 当前全局状态:', currentState);
}

/**
 * 应用卸载时
 */
export async function unmount() {
  // 清理工作
  props = {};
}
```

### 6.2 基于Props的通信

通过props直接传递数据和方法：

```typescript
// 主应用注册子应用时传递props
// src/index.tsx

registerMicroApps([
  {
    name: 'order-app',
    entry: '//localhost:3002',
    container: '#container',
    activeRule: '/order',

    // 传递给子应用的props
    props: {
      // 静态数据
      appName: 'order-app',

      // 共享的函数
      // 子应用调用这个函数，可以通知主应用
      notifyMaster: (data) => {
        console.log('[主应用] 收到来自订单模块的通知:', data);
        // 处理通知
      },

      // 共享的状态
      sharedState: {
        user: currentUser,
        permissions: userPermissions
      }
    }
  }
]);
```

```typescript
// 子应用接收props
// src/index.tsx

export async function mount(props) {
  console.log('[子应用] 收到props:', props);

  // 解构props
  const { appName, notifyMaster, sharedState } = props;

  // 使用appName
  console.log('[子应用] 应用名称:', appName);

  // 使用notifyMaster通知主应用
  function createOrder() {
    // 创建订单逻辑...

    // 通知主应用
    notifyMaster?.({
      type: 'ORDER_CREATED',
      orderId: '123456'
    });
  }

  // 使用共享状态
  console.log('[子应用] 当前用户:', sharedState.user);
  console.log('[子应用] 用户权限:', sharedState.permissions);
}
```

### 6.3 基于自定义事件

使用自定义事件进行更灵活的通信：

```typescript
// 事件总线工具
// shared/eventBus.ts

type EventCallback = (data: any) => void;

// 事件总线类
class EventBus {
  // 存储所有事件监听器
  private listeners: Map<string, EventCallback[]> = new Map();

  // 订阅事件
  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    // 返回取消订阅的函数
    return () => {
      this.off(event, callback);
    };
  }

  // 发布事件
  emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }

  // 取消订阅
  off(event: string, callback: EventCallback): void {
    const callbacks = this.listeners.get(event) || [];
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  // 只订阅一次
  once(event: string, callback: EventCallback): void {
    const wrapper: EventCallback = (data) => {
      callback(data);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }
}

// 导出单例
export const eventBus = new EventBus();
```

```typescript
// 在主应用中初始化事件总线
// src/eventBus.ts

import { eventBus } from 'eventBus';

// 导出给子应用使用
export { eventBus };

// 监听某个事件
eventBus.on('user:login', (data) => {
  console.log('[主应用] 用户登录事件:', data);
});
```

```typescript
// 子应用中使用事件总线
// src/index.ts

import { eventBus } from './eventBus';

export async function mount() {
  // 订阅用户登录事件
  const unsubscribe = eventBus.on('user:login', (data) => {
    console.log('[子应用] 用户登录了:', data);
  });

  // 发布一个事件
  eventBus.emit('order:created', { orderId: '123' });

  // 保存取消订阅的函数
  window.__unmount = () => {
    unsubscribe();
  };
}

export async function unmount() {
  // 清理订阅
  if (window.__unmount) {
    window.__unmount();
  }
}
```

---

## 七、实战配置

### 7.1 完整的主应用配置

```typescript
// 主应用完整配置
// src/index.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  registerMicroApps,
  initGlobalState,
  start,
  use/qiankunStateForSlave,
  QiankunProps
} from 'qiankun';
import App from './App';

// 全局状态管理
interface GlobalState {
  user: { id: number; name: string } | null;
  theme: 'light' | 'dark';
  permissions: string[];
}

const initialState: GlobalState = {
  user: null,
  theme: 'light',
  permissions: []
};

// 初始化全局状态
const { onGlobalStateChange, setGlobalState, getGlobalState } = initGlobalState(initialState);

// 监听全局状态变化
let globalState = initialState;
onGlobalStateChange((state, prev) => {
  console.log('[主应用] 全局状态变化:', state);
  globalState = { ...globalState, ...state };
}, true);

// 注册子应用
registerMicroApps([
  {
    // 用户模块
    name: 'user-app',
    entry: process.env.NODE_ENV === 'production'
      ? 'https://cdn.example.com/user/'
      : '//localhost:3001',
    container: '#user-container',
    activeRule: '/user',
    props: {
      // 传递给子应用的数据
      appName: 'user-app',

      // 全局状态获取方法
      getGlobalState: (): GlobalState => globalState,

      // 设置全局状态方法
      setGlobalState: (state: Partial<GlobalState>) => {
        setGlobalState(state);
      },

      // 全局状态变更订阅
      onGlobalStateChange: (
        callback: (state: GlobalState, prev: GlobalState) => void,
        fireImmediately?: boolean
      ) => {
        onGlobalStateChange(callback, fireImmediately);
      }
    }
  },

  {
    // 订单模块
    name: 'order-app',
    entry: process.env.NODE_ENV === 'production'
      ? 'https://cdn.example.com/order/'
      : '//localhost:3002',
    container: '#order-container',
    activeRule: '/order',
    props: {
      appName: 'order-app',
      getGlobalState: () => globalState,
      setGlobalState: (state) => setGlobalState(state),
      onGlobalStateChange: (callback, fireImmediately) => {
        onGlobalStateChange(callback, fireImmediately);
      }
    }
  },

  {
    // 商品模块
    name: 'product-app',
    entry: process.env.NODE_ENV === 'production'
      ? 'https://cdn.example.com/product/'
      : '//localhost:3003',
    container: '#product-container',
    activeRule: '/product',
    props: {
      appName: 'product-app',
      getGlobalState: () => globalState,
      setGlobalState: (state) => setGlobalState(state),
      onGlobalStateChange: (callback, fireImmediately) => {
        onGlobalStateChange(callback, fireImmediately);
      }
    }
  }
], {
  // 全局生命周期钩子
  beforeLoad: [
    (app: any) => {
      console.log('[全局] beforeLoad', app.name);
      return Promise.resolve();
    }
  ],
  beforeMount: [
    (app: any) => {
      console.log('[全局] beforeMount', app.name);
      return Promise.resolve();
    }
  ],
  afterMount: [
    (app: any) => {
      console.log('[全局] afterMount', app.name);
      return Promise.resolve();
    }
  ],
  beforeUnmount: [
    (app: any) => {
      console.log('[全局] beforeUnmount', app.name);
      return Promise.resolve();
    }
  ],
  afterUnmount: [
    (app: any) => {
      console.log('[全局] afterUnmount', app.name);
      return Promise.resolve();
    }
  ],
  error: (err: any) => {
    console.error('[全局] error', err);
  }
});

// 启动qiankun
start({
  // 是否开启沙箱
  // 默认true，生产环境建议保持开启
  sandbox: true,

  // 是否开启预加载
  // 浏览器空闲时预加载子应用
  prefetch: true,

  // 沙箱配置
  sandbox: {
    // 严格的样式隔离
    strictStyleIsolation: true,

    // 实验性的Shadow DOM隔离
    experimentalStyleIsolation: false
  },

  // fetch配置
  fetch: (url, { appName }) => {
    return fetch(url, {
      headers: {
        'X-App-Name': appName
      },
      credentials: 'include'  // 带上cookies
    });
  }
});

// 渲染主应用
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
```

### 7.2 完整的子应用配置

```typescript
// 子应用完整配置
// React子应用入口 src/index.ts

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 类型定义
interface MasterProps {
  appName: string;
  getGlobalState: () => any;
  setGlobalState: (state: any) => void;
  onGlobalStateChange: (callback: (state: any, prev: any) => void, fireImmediately?: boolean) => void;
}

let root: ReactDOM.Root | null = null;

/**
 * 引导阶段 - 应用初始化
 * 只会被调用一次
 */
export async function bootstrap() {
  console.log('[user-app] 应用初始化 - bootstrap');

  // 全局初始化工作
  // 比如：初始化i18n、加载配置等
  await loadConfigs();
}

/**
 * 挂载阶段 - 应用被渲染到页面
 * 可能会被调用多次（用户多次进入/离开）
 */
export async function mount(props: MasterProps) {
  console.log('[user-app] 应用挂载 - mount', props);

  // 获取根DOM节点
  const container = document.getElementById('root');

  if (!container) {
    console.error('[user-app] 未找到root容器');
    return;
  }

  // 创建React根实例
  root = ReactDOM.createRoot(container);

  // 渲染应用
  root.render(<App {...props} />);
}

/**
 * 卸载阶段 - 应用从页面移除
 * 清理所有资源
 */
export async function unmount() {
  console.log('[user-app] 应用卸载 - unmount');

  if (root) {
    // 同步卸载React应用
    // flushSync确保在卸载完成后再继续
    ReactDOM.flushSync(() => {
      root!.unmount();
    });
    root = null;
  }
}

/**
 * 更新阶段 - 主应用传递的props发生变化
 */
export async function update(props: MasterProps) {
  console.log('[user-app] 应用更新 - update', props);

  // 可以选择重新渲染或部分更新
  if (root) {
    root.render(<App {...props} />);
  }
}

// 辅助函数：加载配置
async function loadConfigs() {
  // 模拟加载配置
  return Promise.resolve({
    apiBaseUrl: '/api',
    features: {
      enableExport: true,
      enableImport: false
    }
  });
}
```

### 7.3 Webpack开发配置

```javascript
// 子应用开发环境webpack配置
// 子应用的webpack.config.js

const path = require('path');
const { name } = require('./package.json');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'source-map',

  entry: './src/index.ts',

  devServer: {
    port: 3001,  // 子应用端口
    hot: true,

    // 重要！允许跨域访问
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    },

    // 配置历史API回退
    // 这样子应用可以独立访问任意路由
    historyApiFallback: true
  },

  output: {
    // 子应用的输出目录
    path: path.resolve(__dirname, 'dist'),
    // 生成的文件名
    filename: '[name].js',
    // 清理输出目录
    clean: true
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      // 必须包含这个meta标签，让qiankun能识别
      meta: {
        'qiankun': 'user-app'  // 子应用名称
      }
    })
  ],

  // .externals配置表示这些模块不从bundle中加载
  // 在qiankun环境中，这些模块由主应用提供
  externals: process.env.NODE_ENV === 'production' ? {
    react: 'React',
    'react-dom': 'ReactDOM'
  } : {}
};
```

---

## 八、踩坑经验总结

### 坑一：子应用样式污染全局

**问题描述**：
子应用定义的CSS类名与主应用或其他子应用冲突，导致样式错乱。

**踩坑经历**：
```
子应用A定义了 .modal { z-index: 9999; }
子应用B也定义了 .modal { z-index: 1; }
结果：后加载的子应用的modal样式覆盖了先加载的
```

**解决方案**：

方案一：使用CSS Modules

```typescript
// 在webpack中配置CSS Modules
// 子应用webpack.config.js

module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              // 开启CSS Modules
              modules: {
                // 类名编译规则
                localIdentName: '[name]__[local]--[hash:base64:5]'
              }
            }
          }
        ]
      }
    ]
  }
};
```

方案二：使用qiankun的样式隔离

```typescript
// 在start配置中启用严格样式隔离
start({
  sandbox: {
    // 为每个子应用的样式添加唯一前缀
    strictStyleIsolation: true
  }
});
```

### 坑二：子应用卸载后内存泄漏

**问题描述**：
子应用卸载后，JavaScript对象、定时器、事件监听器仍然存在。

**踩坑经历**：
```
加载子应用 → 卸载子应用 → 再次加载
内存占用比之前高了100MB！
原因：定时器、事件监听器没有被清理
```

**解决方案**：

```typescript
// 子应用入口文件必须正确实现卸载逻辑
export async function mount() {
  // 设置定时器
  const timer = setInterval(() => {
    console.log('定时任务');
  }, 1000);

  // 添加事件监听
  const handler = () => console.log('点击');
  window.addEventListener('click', handler);

  // 将这些清理函数保存到window上
  window.__UNMOUNT_CLEANUP__ = () => {
    // 清理定时器
    clearInterval(timer);
    // 清理事件监听
    window.removeEventListener('click', handler);
  };
}

export async function unmount() {
  // 调用清理函数
  if (window.__UNMOUNT_CLEANUP__) {
    window.__UNMOUNT_CLEANUP__();
    window.__UNMOUNT_CLEANUP__ = undefined;
  }
}
```

### 坑三：跨域问题

**问题描述**：
子应用部署到不同域名后，无法被主应用加载。

**踩坑经历**：
```
主应用：https://main.example.com
子应用：https://user.example.com

浏览器报错：Blocked by CORS policy
```

**解决方案**：

```javascript
// 子应用服务器必须设置CORS头
// 以Nginx为例

server {
    listen 80;
    server_name user.example.com;

    # 允许主应用跨域访问
    add_header 'Access-Control-Allow-Origin' 'https://main.example.com' always;
    add_header 'Access-Control-Allow-Credentials' 'true';
    add_header 'Access-Control-Allow-Headers' 'Content-Type, qiankun-subapp-name';
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';

    location / {
        root /var/www/user-app;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

### 坑四：公共依赖打包冲突

**问题描述**：
主应用和子应用都打包了同一份公共依赖，导致代码重复或版本冲突。

**解决方案**：

```typescript
// 主应用webpack配置中配置共享依赖
// webpack.config.js

const webpack = require('webpack');

module.exports = {
  plugins: [
    new webpack.container.ModuleFederationPlugin({
      // 共享的依赖
      shared: {
        react: {
          singleton: true,  // 单例模式
          requiredVersion: '^18.0.0'
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^18.0.0'
        }
      }
    })
  ]
};
```

---

## 九、最佳实践

### 实践一：合理的应用划分

```
好的划分：
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   用户模块：用户注册、登录、个人信息、收货地址                     │
│   订单模块：购物车、订单列表、订单详情、订单支付                    │
│   商品模块：商品列表、商品搜索、商品详情、商品评价                   │
│                                                                 │
│   原则：                                                       │
│   1. 模块之间边界清晰，业务不重叠                                │
│   2. 模块可以独立运行，不依赖其他模块                            │
│   3. 模块之间通过接口通信，不直接调用内部方法                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 实践二：统一的开发规范

```typescript
// 子应用必须遵循的接口规范

/**
 * 导出qiankun的生命周期函数
 */
export { bootstrap, mount, unmount, update };

/**
 * 组件必须在指定的容器中渲染
 */
const CONTAINER_ID = 'root';  // 必须是这个ID
```

### 实践三：完善的错误处理

```typescript
// 子应用中添加错误边界
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[user-app] 渲染错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>出错了，请刷新页面重试</div>;
    }
    return this.props.children;
  }
}

export async function mount(props) {
  root.render(
    <ErrorBoundary>
      <App {...props} />
    </ErrorBoundary>
  );
}
```

---

## 十、总结

```
qiankun微前端架构：

┌─────────────────────────────────────────────────────────────────┐
│                         主应用                                  │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  import { registerMicroApps, start } from 'qiankun'     │  │
│   │                                                          │  │
│   │  registerMicroApps([                                    │  │
│   │    { name: 'user-app', entry: '//localhost:3001' },    │  │
│   │    { name: 'order-app', entry: '//localhost:3002' },   │  │
│   │    { name: 'product-app', entry: '//localhost:3003' }  │  │
│   │  ]);                                                    │  │
│   │                                                          │  │
│   │  start({ sandbox: true });                             │  │
│   └─────────────────────────────────────────────────────────┘  │
│                              ↓                                  │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│   │ 用户模块 │  │ 订单模块 │  │ 商品模块 │  │  ...     │     │
│   │          │  │          │  │          │  │          │     │
│   │ bootstrap│  │ bootstrap│  │ bootstrap│  │          │     │
│   │ mount    │  │ mount    │  │ mount    │  │          │     │
│   │ unmount  │  │ unmount  │  │ unmount  │  │          │     │
│   │          │  │          │  │          │  │          │     │
│   │ 独立运行  │  │ 独立运行  │  │ 独立运行  │  │          │     │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
│                              ↓                                  │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                     沙箱隔离                             │  │
│   │   JS沙箱：Proxy代理全局变量                              │  │
│   │   CSS沙箱：样式隔离、前缀隔离                            │  │
│   └─────────────────────────────────────────────────────────┘  │
│                              ↓                                  │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                     通信机制                             │  │
│   │   1. initGlobalState - 全局状态共享                      │  │
│   │   2. props - 父子组件数据传递                            │  │
│   │   3. 自定义事件 - 事件总线通信                           │  │
│   └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

qiankun是国内市场占有率最高的微前端框架，它的优势在于：

1. **开箱即用**：配置简单，上手容易
2. **完善的功能**：沙箱隔离、预加载、样式隔离等开箱即用
3. **良好的兼容性**：支持React、Vue、Angular等主流框架
4. **活跃的社区**：国内使用广泛，问题容易找到解决方案

掌握qiankun，你就能轻松应对企业级微前端架构的挑战。
