# Module Federation深度完全指南

## 前言：Module Federation是什么？

### 用拼图来理解Module Federation

想象一下，你和你的朋友们在拼一个巨大的拼图。这个拼图太大了，一个人根本拼不完，于是你们决定分工合作：

```
拼图分工：
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│     你的区域         小明的区域        小红的区域            │
│    ┌─────────┐     ┌─────────┐     ┌─────────┐             │
│    │ ▓▓▓▓▓▓▓ │     │ ▓▓▓▓▓▓▓ │     │ ▓▓▓▓▓▓▓ │             │
│    │ ▓▓▓▓▓▓▓ │     │ ▓▓▓▓▓▓▓ │     │ ▓▓▓▓▓▓▓ │             │
│    │ ▓▓▓▓▓▓▓ │     │ ▓▓▓▓▓▓▓ │     │ ▓▓▓▓▓▓▓ │             │
│    └─────────┘     └─────────┘     └─────────┘             │
│         ↓                ↓                ↓                │
│    你负责的部分    小明负责的部分    小红负责的部分          │
│                                                             │
│    你需要小明的那块拼图吗？只需要借过来就行！                  │
│    小红需要你的那块拼图吗？只需要拿过去就行！                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Module Federation**就是Webpack 5提供的这种"拼图共享"能力。它允许不同的Webpack构建产物（就像不同的拼图区域）互相"借"模块，而不需要把这些模块重复打包进每个应用中。

### 为什么是" Federation"（联邦）？

Federation这个词在中文里翻译成"联邦"或者"联盟"。想象一下：

```
联邦制国家：
┌─────────────────────────────────────────────────────────────┐
│                         联邦政府                             │
│                    （共同的宪法、法律）                        │
│                            ↓                                │
│    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│    │   州政府A     │  │   州政府B     │  │   州政府C     │   │
│    │  (独立运作)   │  │  (独立运作)   │  │  (独立运作)   │   │
│    │  自己的法律   │  │  自己的法律   │  │  自己的法律   │   │
│    └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                             │
│    每个州都是独立的，可以有自己的法律和文化                    │
│    但大家都遵守联邦宪法，在需要的时刻可以互相协作              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Module Federation中的每个应用（就像每个州）都是独立的Webpack构建产物，它们：
- 可以独立运行
- 可以独立部署
- 有自己的依赖和代码
- 但在需要的时候，可以"借用"其他应用的模块

这就是"Federation"的含义——**独立但协作，联邦式共享**。

---

## 一、Module Federation的核心概念

### 1.1 Host（主机应用）和 Remote（远程应用）

在Module Federation的世界里，应用分为两种角色：

**Host（主机应用）**：
- 就像是拼图游戏中的"组织者"
- 负责加载和组织所有的Remote应用
- 通常是用户首先访问的应用（入口应用）
- 负责整体页面的布局和导航

**Remote（远程应用）**：
- 就像是拼图游戏中的"参与者"
- 被Host应用加载
- 可以暴露自己的模块给其他应用使用
- 可以独立运行，也可以被其他应用加载

```
┌─────────────────────────────────────────────────────────────────┐
│                     Host（主机应用）                             │
│                        拼图组织者                                │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐ │
│   │  整体布局：导航栏 + 侧边栏 + 主内容区                      │ │
│   │                                                          │ │
│   │  ┌─────────────────┐  ┌─────────────────┐               │ │
│   │  │   Remote A      │  │   Remote B      │               │ │
│   │  │   (用户模块)     │  │   (订单模块)     │               │ │
│   │  │                  │  │                  │               │ │
│   │  │   借来的模块      │  │   借来的模块      │               │ │
│   │  └─────────────────┘  └─────────────────┘               │ │
│   │                                                          │ │
│   └─────────────────────────────────────────────────────────┘ │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐ │
│   │  Remote C（支付模块）                                    │ │
│   │  也是一个Remote，但被Host加载到这里                        │ │
│   └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

一个应用可以同时是Host和Remote吗？当然可以！
比如Remote A可以被Host加载，但同时它也可以加载Remote B。
这叫做"嵌套Federation"。
```

### 1.2 Exposes（暴露模块）

"Exposes"就像是拼图游戏中的"我这块区域拼好了，谁需要可以来借"。

```typescript
// Remote应用（订单模块）的webpack配置
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      // 暴露给其他应用使用的模块
      // 格式：'要暴露的模块路径': '实际的文件路径'
      exposes: {
        // 其他应用可以通过 import('order/OrderList') 来使用这个组件
        './OrderList': './src/components/OrderList.tsx',

        // 其他应用可以通过 import('order/OrderDetail') 来使用这个组件
        './OrderDetail': './src/components/OrderDetail.tsx',

        // 甚至可以暴露整个模块
        './Module': './src/index.ts'
      }
    })
  ]
};
```

### 1.3 Shared（共享依赖）

"Shared"就像是拼图游戏中的"这些颜料是我们共用的，大家都可以用，但只需要一份"。

```typescript
// 在Module Federation配置中声明共享依赖
new ModuleFederationPlugin({
  // 共享的模块，其他应用可以用，但不会重复打包
  shared: {
    // React只需要打包一份，所有需要React的应用都共用这一份
    react: {
      singleton: true,           // 单例模式：整个应用只允许一个React实例
      requiredVersion: '^18.0.0', // 期望的版本
      eager: false               // 是否立即加载，false表示懒加载
    },

    'react-dom': {
      singleton: true,
      requiredVersion: '^18.0.0'
    },

    // Vue也可以作为共享依赖
    vue: {
      singleton: true,
      requiredVersion: '^3.0.0'
    }
  }
});
```

### 1.4 异步加载 vs 同步加载

Module Federation支持两种加载方式：

**异步加载（Lazy Load）**：
- 就像是点外卖，你需要的时候才下单，下单后才开始制作
- 模块在需要时才从Remote加载
- 可以显著减少首屏加载时间

```typescript
// 异步加载Remote模块
// 这行代码会在执行到这时才去加载Remote应用的代码
const OrderList = await import('order/OrderList');
```

**同步加载（Eager Load）**：
- 就像是去餐厅吃饭，菜已经做好了，你来了就能吃
- 模块在应用启动时就立即加载
- 会增加首屏加载时间，但用户体验更流畅

```typescript
// 同步加载，需要在配置中设置 eager: true
shared: {
  react: {
    singleton: true,
    eager: true  // 立即加载，不等待
  }
}
```

---

## 二、为什么需要Module Federation？

### 2.1 传统前端架构的问题

想象一下，你要开发一个大型电商平台：

```
传统架构的问题：

┌─────────────────────────────────────────────────────────────────┐
│                        单体前端应用                              │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  所有代码打包成一个巨大的bundle.js                        │  │
│   │                                                          │  │
│   │   bundle.js = 用户模块 + 订单模块 + 支付模块 + 商品模块     │  │
│   │             = 10MB                                       │  │
│   │                                                          │  │
│   │   用户打开页面：                                          │  │
│   │   等待下载10MB → 等待解析10MB → 终于看到页面              │  │
│   │                                                          │  │
│   │   问题：用户只是想看商品列表，为什么要下载支付模块的代码？   │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**问题一：代码重复打包**

```
场景：主应用、用户模块、订单模块、支付模块都用React

传统模式：
┌─────────────────────────────────────────────────────────────────┐
│   主应用 bundle → 包含 react (100KB)                           │
│   用户模块 bundle → 包含 react (100KB)                         │
│   订单模块 bundle → 包含 react (100KB)                         │
│   支付模块 bundle → 包含 react (100KB)                         │
│                                                                 │
│   总计：400KB的react代码在用户浏览器中重复存在！                  │
│                                                                 │
│   这就像：每个房间都买了一个微波炉，明明可以共用一个              │
└─────────────────────────────────────────────────────────────────┘
```

**问题二：部署耦合**

```
传统模式：
┌─────────────────────────────────────────────────────────────────┐
│   产品经理：我想改一下登录页面的按钮颜色                          │
│                                                                 │
│   开发者：好的，我改一下                                        │
│                                                                 │
│   构建：整个应用重新构建（45分钟）                               │
│   测试：整个应用重新测试（3小时）                                │
│   部署：整个应用重新部署（1小时）                                 │
│                                                                 │
│   风险：如果这个改动不小心影响了支付模块怎么办？                   │
│                                                                 │
│   结果：为了改一个按钮颜色，需要发布整个应用                       │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Module Federation如何解决

```
Module Federation模式：

┌─────────────────────────────────────────────────────────────────┐
│   Host（主应用）                                                 │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  整体布局 + 导航                                          │  │
│   │                                                          │  │
│   │  按需加载Remote：                                         │  │
│   │  用户访问 /user/* → 加载用户Remote                        │  │
│   │  用户访问 /order/* → 加载订单Remote                       │  │
│   │  用户访问 /pay/* → 加载支付Remote                         │  │
│   │                                                          │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   共用一份React（通过Shared）                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**优势一：按需加载，减少初始包体积**

```typescript
// 用户首次访问，只加载主应用
// 主应用的bundle可能只有200KB
const MainApp = import('./MainApp');

// 当用户访问商品列表时，才加载商品模块
if (route === '/products') {
  // 动态加载商品Remote
  const ProductModule = await import('product/ProductList');
}
```

**优势二：共享依赖，不重复打包**

```
Module Federation模式下的依赖共享：

┌─────────────────────────────────────────────────────────────────┐
│   Host bundle → 不包含 react（通过Shared使用Remote的react）     │
│   用户模块 bundle → 包含 react                                 │
│   订单模块 bundle → 不包含 react（共享Host的react）             │
│   支付模块 bundle → 不包含 react（共享Host的react）             │
│                                                                 │
│   结果：react只在浏览器中存在一份，大幅减少总下载量               │
└─────────────────────────────────────────────────────────────────┘
```

**优势三：独立部署，快速发布**

```
Module Federation模式下的发布流程：

产品经理：我想改一下登录页面的按钮颜色

开发者：好的，我改一下用户模块

构建：只构建用户模块（3分钟）
测试：只测试用户模块（15分钟）
部署：只部署用户模块（1分钟）

结果：只发布了用户模块，其他模块完全不受影响
```

---

## 三、搭建Module Federation项目

### 3.1 项目结构设计

```
项目结构：
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   my-federated-app/                                             │
│   │                                                              │
│   ├── host-app/                    # 主机应用（入口应用）         │
│   │   ├── src/                                                    │
│   │   │   ├── index.ts                                             │
│   │   │   ├── App.tsx                                             │
│   │   │   └── bootstrap.tsx                                       │
│   │   ├── webpack.config.js                                      │
│   │   └── package.json                                            │
│   │                                                              │
│   ├── remote-user/                 # 远程用户模块                 │
│   │   ├── src/                                                    │
│   │   │   ├── components/                                         │
│   │   │   │   ├── UserProfile.tsx                                  │
│   │   │   │   └── UserList.tsx                                    │
│   │   │   └── index.ts                                             │
│   │   ├── webpack.config.js                                      │
│   │   └── package.json                                            │
│   │                                                              │
│   ├── remote-order/                # 远程订单模块                 │
│   │   ├── src/                                                    │
│   │   │   ├── components/                                         │
│   │   │   │   ├── OrderList.tsx                                    │
│   │   │   │   └── OrderDetail.tsx                                  │
│   │   │   └── index.ts                                             │
│   │   ├── webpack.config.js                                      │
│   │   └── package.json                                            │
│   │                                                              │
│   └── shared/                       # 共享的工具和类型           │
│       ├── src/                                                    │
│       │   ├── types/                                              │
│       │   └── utils/                                              │
│       └── package.json                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 基础配置详解

#### 第一步：安装Webpack 5和相关依赖

```bash
# 在每个应用中都需要安装
npm install webpack webpack-cli webpack-dev-server html-webpack-plugin
npm install @module-federation/vite  # 如果使用Vite
npm install @module-federation/typescript  # TypeScript支持
```

#### 第二步：配置主应用（Host）

```javascript
// host-app/webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// 引入Module Federation插件
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');
const deps = require('./package.json').dependencies;

module.exports = {
  mode: 'development',
  // 入口文件
  entry: './src/index.ts',
  // 开发服务器配置
  devServer: {
    port: 3000,  // 主应用运行在3000端口
    // 确保主应用能够代理Remote应用的请求
    proxy: {
      '/remote-user': {
        target: 'http://localhost:3001',  // 用户模块的地址
        changeOrigin: true
      },
      '/remote-order': {
        target: 'http://localhost:3002',  // 订单模块的地址
        changeOrigin: true
      }
    }
  },
  // 输出配置
  output: {
    // 清理输出目录
    clean: true,
    // 公共路径，Module Federation需要设置
    publicPath: 'auto'
  },
  // 模块配置
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        // CSS配置
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  // 解析配置
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx']
  },
  // 插件配置
  plugins: [
    // HTML模板插件
    new HtmlWebpackPlugin({
      template: './public/index.html'
    }),

    // Module Federation核心配置
    new ModuleFederationPlugin({
      // 当前应用的名称，其他应用可以通过这个名字引用
      name: 'host_app',

      // 共享的依赖模块
      // 这些模块会被"共享"，不会重复打包
      shared: {
        // 共享React及其相关库
        // singleton: true 表示整个应用只允许存在一个实例
        // 这样可以避免多个React实例导致的state同步问题
        react: {
          singleton: true,              // 单例模式
          requiredVersion: deps.react,  // 需要的版本
          eager: false                  // 懒加载模式
        },
        'react-dom': {
          singleton: true,
          requiredVersion: deps['react-dom']
        }
      }
    })
  ]
};
```

#### 第三步：配置子应用（Remote）

```javascript
// remote-user/webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');
const deps = require('./package.json').dependencies;

module.exports = {
  mode: 'development',
  entry: './src/index.ts',
  devServer: {
    port: 3001,  // 用户模块运行在3001端口
    // 这个很重要！允许外部访问
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  },
  output: {
    clean: true,
    // 必须设置为 'auto'，让Webpack自动决定publicPath
    publicPath: 'auto'
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
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx']
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html'
    }),

    new ModuleFederationPlugin({
      // 当前应用的名称
      name: 'remote_user',

      // 暴露给其他应用使用的模块
      // 格式：'在Host中引用的名称': '实际的文件路径'
      exposes: {
        // Host中可以通过 import('remote_user/UserList') 来使用
        './UserList': './src/components/UserList.tsx',
        // Host中可以通过 import('remote_user/UserProfile') 来使用
        './UserProfile': './src/components/UserProfile.tsx',
        // 甚至可以暴露整个用户模块
        './Module': './src/index.ts'
      },

      // 共享依赖配置
      shared: {
        react: {
          singleton: true,
          requiredVersion: deps.react
        },
        'react-dom': {
          singleton: true,
          requiredVersion: deps['react-dom']
        }
      }
    })
  ]
};
```

### 3.3 代码实现

#### 主应用代码

```typescript
// host-app/src/index.ts
// 异步启动函数，用于动态加载其他模块
async function bootstrap() {
  // React和ReactDOM的动态导入（确保Shared生效）
  const [react, reactDom] = await Promise.all([
    import('react'),
    import('react-dom')
  ]);

  // 动态导入Remote模块
  // 这行代码会在运行时从Remote应用加载模块
  const { UserList } = await import('remote_user/UserList');
  const { OrderList } = await import('remote_order/OrderList');

  console.log('主应用启动完成');
  console.log('已加载用户列表模块:', UserList);
  console.log('已加载订单列表模块:', OrderList);
}

// 启动应用
bootstrap();
```

```typescript
// host-app/src/bootstrap.tsx
// 应用的主入口文件
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  // 存储当前路由
  const [currentRoute, setCurrentRoute] = useState('/');
  // 存储加载的模块
  const [UserModule, setUserModule] = useState(null);
  const [OrderModule, setOrderModule] = useState(null);

  // 根据路由动态加载对应的Remote模块
  useEffect(() => {
    // 动态导入Remote模块
    // 这使用了Webpack的异步import，会在运行时从网络加载
    const loadModules = async () => {
      if (currentRoute.startsWith('/user')) {
        // 当路由是/user开头时，加载用户模块
        const module = await import('remote_user/Module');
        setUserModule(module);
      }

      if (currentRoute.startsWith('/order')) {
        // 当路由是/order开头时，加载订单模块
        const module = await import('remote_order/Module');
        setOrderModule(module);
      }
    };

    loadModules();
  }, [currentRoute]);

  return (
    <div className="host-app">
      {/* 导航栏 */}
      <nav className="navbar">
        <button onClick={() => setCurrentRoute('/user/list')}>
          用户列表
        </button>
        <button onClick={() => setCurrentRoute('/order/list')}>
          订单列表
        </button>
      </nav>

      {/* 主内容区 */}
      <main className="main-content">
        {currentRoute.startsWith('/user') && UserModule && (
          // 渲染用户模块的组件
          // UserModule是一个对象，里面有UserList等组件
          <UserModule.UserList />
        )}

        {currentRoute.startsWith('/order') && OrderModule && (
          // 渲染订单模块的组件
          <OrderModule.OrderList />
        )}
      </main>
    </div>
  );
}

// 挂载应用
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
```

#### 子应用代码

```typescript
// remote-user/src/index.ts
// 用户模块的入口文件
// 导出这个模块的主要组件和功能

// 导出用户列表组件
export { default as UserList } from './components/UserList';

// 导出用户详情组件
export { default as UserProfile } from './components/UserProfile';

// 导出用户模块的初始化函数
export async function initUserModule() {
  console.log('用户模块初始化');
  // 初始化操作，比如加载用户相关的配置
}
```

```typescript
// remote-user/src/components/UserList.tsx
// 用户列表组件
import React, { useState, useEffect } from 'react';

// 定义用户类型
interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
}

// 用户列表组件
const UserList: React.FC = () => {
  // 状态：用户列表数据
  const [users, setUsers] = useState<User[]>([]);
  // 状态：加载状态
  const [loading, setLoading] = useState(true);

  // 组件挂载时获取用户列表
  useEffect(() => {
    // 模拟API调用获取用户数据
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('获取用户列表失败:', err);
        setLoading(false);
      });
  }, []); // 空依赖数组，表示只在组件挂载时执行一次

  // 渲染加载状态
  if (loading) {
    return <div className="user-list-loading">加载中...</div>;
  }

  // 渲染用户列表
  return (
    <div className="user-list">
      <h2>用户列表</h2>
      <ul>
        {users.map(user => (
          <li key={user.id} className="user-item">
            {/* 用户头像 */}
            <img
              src={user.avatar}
              alt={user.name}
              className="user-avatar"
            />
            {/* 用户信息 */}
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-email">{user.email}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

// 默认导出用户列表组件
export default UserList;
```

### 3.4 启动项目

```bash
# 1. 先启动Remote应用（子应用）
cd remote-user
npm install
npm start
# 访问 http://localhost:3001，应该能看到用户模块独立运行

cd remote-order
npm install
npm start
# 访问 http://localhost:3002，应该能看到订单模块独立运行

# 2. 再启动Host应用（主应用）
cd host-app
npm install
npm start
# 访问 http://localhost:3000
```

---

## 四、进阶配置

### 4.1 共享多个依赖

在实际项目中，通常需要共享多个依赖：

```javascript
// 更完整的共享配置
new ModuleFederationPlugin({
  name: 'my_app',

  shared: {
    // React全家桶
    react: {
      singleton: true,
      requiredVersion: '^18.0.0',
      eager: false
    },
    'react-dom': {
      singleton: true,
      requiredVersion: '^18.0.0'
    },

    // 状态管理库
    'react-redux': {
      // 非单例模式，允许每个模块有自己的实例
      // 但会共享store
      singleton: false,
      // 严格版本匹配
      strictVersion: true,
      requiredVersion: '^8.0.0'
    },
    '@reduxjs/toolkit': {
      singleton: true
    },

    // UI组件库
    antd: {
      // 非单例模式
      singleton: false,
      // 允许不同版本共存
      strictVersion: false,
      requiredVersion: '^5.0.0'
    },

    // 工具库
    lodash: {
      // 共享整个lodash
      singleton: true,
      // 也可以只共享特定方法
      // importStrategies: {
      //   'isNil': 'pkg',
      //   'debounce': 'pkg'
      // }
    },

    // 样式
    'styled-components': {
      singleton: true
    }
  }
})
```

### 4.2 版本管理策略

当不同应用使用不同版本的同一依赖时，Module Federation会如何处理？

```javascript
// Host应用使用 React 18.2.0
shared: {
  react: {
    singleton: true,
    requiredVersion: '^18.0.0'
  }
}

// Remote应用A使用 React 18.2.0（兼容）
shared: {
  react: {
    singleton: true,
    requiredVersion: '^18.0.0'
  }
}

// Remote应用B使用 React 17.0.2（不兼容！）
shared: {
  react: {
    singleton: true,
    requiredVersion: '^17.0.0'
  }
}
```

**Module Federation的版本协商规则**：

1. **singleton: true + 版本兼容**：使用Host的版本
2. **singleton: true + 版本不兼容**：报错，无法加载
3. **singleton: false**：允许不同版本共存

```javascript
// 最佳实践：使用SemVer兼容范围
// 建议：所有应用使用相同的major版本

// Host
shared: {
  react: {
    singleton: true,
    // 使用 ^ 表示兼容所有18.x.x版本
    requiredVersion: '^18.0.0'
  }
}

// Remote A
shared: {
  react: {
    singleton: true,
    requiredVersion: '^18.0.0'
  }
}

// Remote B
shared: {
  react: {
    singleton: true,
    requiredVersion: '^18.2.0'  // 更具体的版本，也是兼容的
  }
}
```

### 4.3 异步加载优化

```typescript
// 使用React.lazy进行代码分割
import React, { Suspense, lazy } from 'react';

// 懒加载Remote模块
// 只有当Component真正需要渲染时，才会去加载代码
const UserList = lazy(() => import('remote_user/UserList'));
const OrderList = lazy(() => import('remote_order/OrderList'));

// 应用组件
function App() {
  const [activeTab, setActiveTab] = useState('user');

  return (
    <div className="app">
      {/* Tab切换 */}
      <div className="tabs">
        <button
          className={activeTab === 'user' ? 'active' : ''}
          onClick={() => setActiveTab('user')}
        >
          用户模块
        </button>
        <button
          className={activeTab === 'order' ? 'active' : ''}
          onClick={() => setActiveTab('order')}
        >
          订单模块
        </button>
      </div>

      {/* 内容区 - 使用Suspense处理加载状态 */}
      <Suspense fallback={<div>加载中...</div>}>
        {activeTab === 'user' && <UserList />}
        {activeTab === 'order' && <OrderList />}
      </Suspense>
    </div>
  );
}
```

### 4.4 动态Remote配置

有时候你需要根据环境动态决定加载哪个Remote：

```typescript
// 动态加载Remote
async function loadRemote(remoteName: string) {
  // 根据remote名称获取配置
  const remoteConfig = getRemoteConfig(remoteName);

  // 动态加载Remote模块
  // 这行代码做了很多事情：
  // 1. 从remoteConfig.entry指定的地址加载Remote的webpack运行时
  // 2. 初始化Remote模块
  // 3. 解析出要导入的模块
  const module = await import(/* @webpack-ignore */ `${remoteConfig.entry}/remoteEntry.js`);

  return module;
}

// Remote配置
function getRemoteConfig(name: string) {
  const configs = {
    user: {
      // 生产环境和开发环境使用不同的地址
      entry: process.env.NODE_ENV === 'production'
        ? 'https://cdn.example.com/user'
        : 'http://localhost:3001'
    },
    order: {
      entry: process.env.NODE_ENV === 'production'
        ? 'https://cdn.example.com/order'
        : 'http://localhost:3002'
    }
  };

  return configs[name];
}
```

---

## 五、通信机制

### 5.1 基于Props的通信

最简单直接的方式，通过函数参数传递数据：

```typescript
// Host应用
function App() {
  // 共享状态
  const [sharedState, setSharedState] = useState({ count: 0 });

  // 共享的更新函数
  const updateSharedState = (newState) => {
    setSharedState(prev => ({ ...prev, ...newState }));
  };

  return (
    <>
      {/* 传递给用户模块 */}
      <UserModule
        sharedState={sharedState}
        onUpdateShared={updateSharedState}
      />

      {/* 传递给订单模块 */}
      <OrderModule
        sharedState={sharedState}
        onUpdateShared={updateSharedState}
      />
    </>
  );
}
```

### 5.2 基于事件的通信

使用自定义事件进行跨模块通信：

```typescript
// 事件总线工具类
// 用于模块之间的解耦通信
class EventBus {
  // 存储所有的事件监听器
  // key是事件名，value是回调函数数组
  private listeners: Map<string, Function[]> = new Map();

  // 订阅事件
  // eventName: 事件名称
  // callback: 事件触发时的回调函数
  on(eventName: string, callback: Function) {
    // 如果这个事件还没有监听器，创建空数组
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    // 添加回调函数
    this.listeners.get(eventName)!.push(callback);

    // 返回一个取消订阅的函数
    return () => {
      this.off(eventName, callback);
    };
  }

  // 发布事件
  // eventName: 事件名称
  // data: 传递给回调函数的数据
  emit(eventName: string, data?: any) {
    // 获取所有监听器
    const callbacks = this.listeners.get(eventName) || [];
    // 依次调用每个回调函数
    callbacks.forEach(callback => callback(data));
  }

  // 取消订阅
  off(eventName: string, callback: Function) {
    const callbacks = this.listeners.get(eventName) || [];
    // 过滤掉要取消的回调
    const filtered = callbacks.filter(cb => cb !== callback);
    this.listeners.set(eventName, filtered);
  }
}

// 创建全局事件总线实例
export const eventBus = new EventBus();
```

```typescript
// 用户模块 - 发布事件
// 用户模块不需要知道谁在监听它，只需要发出事件即可
import { eventBus } from './eventBus';

function UserProfile() {
  const handleLogin = (user) => {
    // 用户登录后，发布登录事件
    // 谁想监听这个事件都可以
    eventBus.emit('user:login', {
      userId: user.id,
      userName: user.name,
      timestamp: Date.now()
    });
  };

  return <button onClick={() => handleLogin({ id: 1, name: '张三' })}>
    登录
  </button>;
}
```

```typescript
// 订单模块 - 订阅事件
// 订单模块监听用户登录事件，当用户登录时，刷新订单列表
import { eventBus } from './eventBus';

function OrderList() {
  useEffect(() => {
    // 订阅用户登录事件
    const unsubscribe = eventBus.on('user:login', (data) => {
      console.log('收到用户登录事件:', data);
      // 刷新当前用户的订单列表
      refreshOrders(data.userId);
    });

    // 组件卸载时取消订阅
    // 这是非常重要的！防止内存泄漏
    return () => {
      unsubscribe();
    };
  }, []);

  return <div>订单列表</div>;
}
```

### 5.3 基于SharedState的通信

对于需要共享状态的场景，可以使用一个共享的Store：

```typescript
// shared/store.ts
// 创建一个可以被所有模块共享的状态管理
import { create } from 'zustand';

// 定义共享状态的类型
interface SharedState {
  // 登录用户信息
  currentUser: User | null;
  // 购物车内容
  cart: CartItem[];
  // 全局主题
  theme: 'light' | 'dark';
}

// 定义共享状态的操作
interface SharedActions {
  // 设置当前用户
  setCurrentUser: (user: User | null) => void;
  // 添加到购物车
  addToCart: (item: CartItem) => void;
  // 从购物车移除
  removeFromCart: (itemId: string) => void;
  // 切换主题
  toggleTheme: () => void;
}

// 创建Store
// 这个Store可以被Host和所有Remote共享
export const useSharedStore = create<SharedState & SharedActions>((set) => ({
  // 初始状态
  currentUser: null,
  cart: [],
  theme: 'light',

  // 操作实现
  setCurrentUser: (user) => set({ currentUser: user }),

  addToCart: (item) => set((state) => ({
    cart: [...state.cart, item]
  })),

  removeFromCart: (itemId) => set((state) => ({
    cart: state.cart.filter(item => item.id !== itemId)
  })),

  toggleTheme: () => set((state) => ({
    theme: state.theme === 'light' ? 'dark' : 'light'
  }))
}));
```

```typescript
// 在任意模块中使用
import { useSharedStore } from 'shared/store';

function UserProfile() {
  // 获取共享状态
  const { currentUser, setCurrentUser, theme, toggleTheme } = useSharedStore();

  return (
    <div className={`user-profile theme-${theme}`}>
      {/* 使用共享的用户信息 */}
      {currentUser ? (
        <span>欢迎，{currentUser.name}</span>
      ) : (
        <button onClick={() => setCurrentUser({ id: 1, name: '张三' })}>
          登录
        </button>
      )}

      {/* 使用共享的主题切换 */}
      <button onClick={toggleTheme}>
        切换主题
      </button>
    </div>
  );
}
```

---

## 六、实战踩坑经验

### 坑一：异步加载时模块未定义

**问题描述**：
在异步加载Remote模块时，有时候会出现"module is not defined"或"Cannot find module"的错误。

**踩坑经历**：
```typescript
// 我的错误代码
// 错误：同步地导入Remote模块
import { UserList } from 'remote_user/UserList';  // ❌ 可能失败

// 正确做法：使用异步import
const UserList = await import('remote_user/UserList');  // ✅ 正确
```

**解决方案**：
```typescript
// 确保使用动态import
// 并且在Remote模块加载完成后再使用
async function loadUserModule() {
  try {
    // 异步导入
    const module = await import('remote_user/UserList');
    // 等待模块加载完成
    return module.default;
  } catch (error) {
    console.error('加载用户模块失败:', error);
    return null;
  }
}
```

### 坑二：CSS样式冲突

**问题描述**：
当多个Remote模块都定义了相同类名的CSS时，样式会互相覆盖。

**踩坑经历**：
```
Remote A 定义了 .button { background: blue; }
Remote B 也定义了 .button { background: red; }
最后页面上所有的按钮都是红色，不管在哪个模块
```

**解决方案**：

方案一：CSS Modules

```css
/* UserList.module.css */
/* 编译后类名会变成唯一的哈希值 */
.button {
  background: blue;
}
```

```typescript
// 组件中使用
import styles from './UserList.module.css';

// JSX中使用编译后的类名
return <button className={styles.button}>用户按钮</button>;
```

方案二：命名空间

```typescript
// 每个Remote使用不同的前缀
// Remote A: user-button, user-container
// Remote B: order-button, order-container
```

### 坑三：Shared依赖版本冲突

**问题描述**：
Host和Remote的同一依赖版本不兼容，导致运行时报错。

**踩坑经历**：
```
Host用React 18，Remote用React 17
结果：点击子应用中的按钮，父应用没反应
原因：React 17和18的事件系统有差异
```

**解决方案**：

```javascript
// 统一所有应用的依赖版本
// 在package.json中使用精确的版本号
{
  "dependencies": {
    "react": "18.2.0",
    "react-dom": "18.2.0"
  }
}

// 在Module Federation配置中使用严格的版本要求
shared: {
  react: {
    singleton: true,
    // 必须完全匹配这个版本
    requiredVersion: '18.2.0',
    // 如果版本不匹配，拒绝加载
    strictVersion: true
  }
}
```

### 坑四：热更新失效

**问题描述**：
在开发模式下，修改Remote模块的代码后，Host不会自动更新。

**解决方案**：

```typescript
// Remote应用的入口文件
// 需要正确实现HMR（热模块替换）的接口
if (module.hot) {
  // 接受模块自身的热更新
  module.hot.accept();

  // 当这个模块被替换时，执行回调
  module.hot.dispose(() => {
    // 清理工作，比如取消事件监听、清理状态
    console.log('Remote模块即将被重新加载');
  });
}
```

```javascript
// Remote的webpack配置
devServer: {
  port: 3001,
  // 启用热更新
  hot: true,
  // 允许iframe访问
  headers: {
    'Access-Control-Allow-Origin': '*'
  }
}
```

---

## 七、Module Federation vs 其他方案对比

### 对比表

```
┌────────────────┬────────────────┬────────────────┬────────────────┐
│     特性       │ Module         │    qiankun     │   iframe        │
│                │ Federation     │                │                │
├────────────────┼────────────────┼────────────────┼────────────────┤
│  实现复杂度    │     中等        │     中等        │      低         │
├────────────────┼────────────────┼────────────────┼────────────────┤
│  性能          │     高         │     中等        │      低         │
├────────────────┼────────────────┼────────────────┼────────────────┤
│  开发体验      │     好         │     好         │      差         │
├────────────────┼────────────────┼────────────────┼────────────────┤
│  CSS隔离       │   需手动处理    │   自动处理      │    自动处理     │
├────────────────┼────────────────┼────────────────┼────────────────┤
│  JS隔离        │   需借助沙箱    │   沙箱隔离      │    iframe天然隔离│
├────────────────┼────────────────┼────────────────┼────────────────┤
│  状态共享      │     容易        │     容易        │      难         │
├────────────────┼────────────────┼────────────────┼────────────────┤
│  路由管理      │  自己实现/React │    qiankun提供  │   iframe自带    │
│                │    Router      │                 │                 │
├────────────────┼────────────────┼────────────────┼────────────────┤
│  适用场景      │ Webpack 5      │ Vue/React       │   简单隔离场景   │
│                │ 多应用协作     │ 通用场景         │                 │
└────────────────┴────────────────┴────────────────┴────────────────┘
```

### 什么时候用Module Federation？

**适合使用Module Federation**：
- ✅ 使用Webpack 5作为打包工具
- ✅ 多个团队协作开发同一个大型应用
- ✅ 需要高度定制的微前端方案
- ✅ 对性能要求较高，需要精细控制加载策略
- ✅ 需要在多个应用间共享大量依赖

**不适合使用Module Federation**：
- ❌ 使用Vite作为打包工具（可以使用Vite的Module Federation插件）
- ❌ 项目规模较小，3-5人团队
- ❌ 需要支持IE浏览器（Webpack 5不支持IE）
- ❌ 追求简单，不想处理复杂的配置

---

## 八、最佳实践总结

### 实践一：清晰的边界划分

```
好的模块边界：
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   User Module          Order Module         Product Module      │
│   ┌───────────┐       ┌───────────┐       ┌───────────┐        │
│   │ 用户注册   │       │ 订单创建   │       │ 商品展示   │        │
│   │ 用户登录   │       │ 订单查询   │       │ 商品搜索   │        │
│   │ 用户信息   │       │ 订单支付   │       │ 商品分类   │        │
│   └───────────┘       └───────────┘       └───────────┘        │
│                                                                 │
│   原则：                                                       │
│   1. 每个模块只负责自己的业务逻辑                               │
│   2. 模块之间通过接口通信，不直接调用对方的内部方法              │
│   3. 模块之间的共享数据通过全局Store                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 实践二：统一的构建配置

```javascript
// 创建一个共享的webpack配置基础
// build/webpack.common.js

// 共享的Module Federation配置
const createMFConfig = (appName, exposes = {}, shared = {}) => ({
  name: appName,
  filename: 'remoteEntry.js',  // 固定的文件名
  exposes,
  shared: {
    // 默认的共享依赖
    react: {
      singleton: true,
      requiredVersion: '^18.0.0'
    },
    'react-dom': {
      singleton: true,
      requiredVersion: '^18.0.0'
    },
    // 合并额外的共享依赖
    ...shared
  }
});

module.exports = { createMFConfig };
```

```javascript
// Remote应用使用
// remote-user/webpack.config.js
const { create } = require('webpack-merge');
const { createMFConfig } = require('../../build/webpack.common');

module.exports = create({
  // 基础配置...
}, createMFConfig('remote_user', {
  // 暴露的模块
  './UserList': './src/components/UserList.tsx',
  './UserProfile': './src/components/UserProfile.tsx'
}));
```

### 实践三：完善的错误处理

```typescript
// Remote加载错误处理
async function safeImport<T>(factory: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await factory();
  } catch (error) {
    console.error('模块加载失败:', error);
    // 返回降级方案
    return fallback;
  }
}

// 使用示例
const UserList = await safeImport(
  () => import('remote_user/UserList'),
  // 降级方案：使用本地组件代替
  { default: LocalUserList }
);
```

### 实践四：性能监控

```typescript
// 添加加载性能监控
async function importWithMonitoring<T>(factory: () => Promise<T>, moduleName: string): Promise<T> {
  const startTime = performance.now();

  try {
    const module = await factory();
    const loadTime = performance.now() - startTime;

    // 上报加载时间
    console.log(`[Module Federation] ${moduleName} 加载耗时: ${loadTime.toFixed(2)}ms`);

    // 可以在这里上报到监控服务
    if (loadTime > 3000) {
      console.warn(`[Module Federation] ${moduleName} 加载过慢！`);
    }

    return module;
  } catch (error) {
    console.error(`[Module Federation] ${moduleName} 加载失败:`, error);
    throw error;
  }
}
```

---

## 九、总结

### Module Federation核心要点

```
┌─────────────────────────────────────────────────────────────────┐
│                     Module Federation                            │
│                        拼图式联邦                                 │
│                                                                 │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│   │  Host应用   │←──→│ Remote应用A │←──→│ Remote应用B │         │
│   │ (组织者)    │    │  (参与者)   │    │  (参与者)   │         │
│   └─────────────┘    └─────────────┘    └─────────────┘         │
│          │                  ↑                   ↑                │
│          │                  │                   │                │
│          ↓                  │                   │                │
│   ┌─────────────────────────────────────────────────┐           │
│   │                   Shared                         │           │
│   │              (共享的React/Vue等)                  │           │
│   │           每个依赖只加载一次，全局共用            │           │
│   └─────────────────────────────────────────────────┘           │
│                                                                 │
│   关键特性：                                                    │
│   1. Exposes - 暴露自己的模块供他人使用                           │
│   2. Shared - 共用依赖，不重复打包                              │
│   3. 异步加载 - 按需加载，提升性能                               │
│   4. 版本协商 - 自动处理模块版本冲突                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Module Federation工作流程

```
┌─────────────────────────────────────────────────────────────────┐
│                         工作流程                                 │
│                                                                 │
│   1. 开发阶段                                                    │
│      Host和每个Remote都是独立的项目，可以独立开发和测试            │
│                                                                 │
│   2. 构建阶段                                                    │
│      每个应用独立构建，生成自己的bundle                           │
│      Remote应用会生成 remoteEntry.js（模块清单）                  │
│                                                                 │
│   3. 加载阶段                                                    │
│      Host通过动态import加载Remote的remoteEntry.js                │
│      根据清单按需加载具体模块                                    │
│                                                                 │
│   4. 运行阶段                                                    │
│      Host和Remote共用Shared中的依赖（单例）                       │
│      模块之间通过事件总线或Props进行通信                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

Module Federation是Webpack 5最强大的特性之一，它为微前端架构提供了一种优雅的解决方案。掌握它，你就掌握了现代前端架构的重要一环。
