# 全栈开发知识库大纲

## 📚 大纲说明

本大纲记录了全栈开发知识库的完整结构，包含所有Markdown文档的标题层级。

## 📂 目录结构

```
全栈开发/
├── 00_全局指南/          # 全局指南和学习路线
├── 01_前端底层与基础/    # 前端底层原理和基础
├── 01_Node.js核心模块/   # Node.js核心模块
├── 02_前端框架与工程化/  # 前端框架和工程化
├── 02_Express_Koa框架/   # Express和Koa框架
├── 03_后端架构与Nodejs引擎/ # 后端架构和Node.js引擎
├── 03_数据库/           # 数据库知识
├── 04_全栈框架与服务端渲染/ # 全栈框架和SSR
├── 04_API设计与认证/    # API设计和认证
├── 05_后端工程化与部署运维/ # 后端工程化和运维
├── 05_数据库引擎与原理/  # 数据库引擎原理
├── 06_数据结构与算法/    # 数据结构和算法
├── React核心/           # React技术栈
├── TypeScript模块/       # TypeScript学习
├── 前端工程化/           # 前端工程化
├── 性能优化/            # 性能优化
├── 前沿技术/            # 前沿技术
└── Docker容器化部署.md   # Docker容器化部署
```

## 📖 文档列表

### 00_全局指南

- [01_学习路线概览.md](./00_全局指南/01_学习路线概览.md)
  - React + Node.js 全栈开发学习路线
  - 学习路线的四个阶段
  - 代码示例
  - 实战练习
  - 横向对比
  - 纵向原理
  - 反证分析
  - 学习资源推荐

- [02_全新树形结构规划.md](./00_全局指南/02_全新树形结构规划.md)
  - 新结构设计原则
  - 文件夹结构对比
  - 文件夹详细说明
  - 迁移计划
  - 新结构优势总结
  - 实施建议

- [03_2026全栈学习路线_树形结构版.md](./00_全局指南/03_2026全栈学习路线_树形结构版.md)
  - 学习路线概览
  - 学习时间分配
  - 技术栈版本参考
  - 学习路径图谱

### 01_前端底层与基础

- [01_前端底层与基础\01_HTML5深入学习.md](./01_前端底层与基础/01_HTML5深入学习.md)
  - HTML5语义化标签
  - 表单增强
  - 多媒体支持
  - Web Storage
  - Web Workers
  - Canvas绘图
  - 拖放API
  - 离线应用

- [01_前端底层与基础\02_CSS3深入学习.md](./01_前端底层与基础/02_CSS3深入学习.md)
  - CSS3新特性
  - Flexbox布局
  - Grid布局
  - 动画与过渡
  - 响应式设计
  - 预处理器
  - BEM命名规范
  - CSS模块化

- [01_前端底层与基础\03_JavaScript核心.md](./01_前端底层与基础/03_JavaScript核心.md)
  - ES6+新特性
  - 闭包与作用域
  - 原型链与继承
  - 异步编程
  - 模块化
  - 类型系统
  - 性能优化
  - 设计模式

### 01_Node.js核心模块

- [01_Node.js核心模块\01_Node.js基础.md](./01_Node.js核心模块/01_Node.js基础.md)
  - Node.js概述
  - CommonJS模块系统
  - 全局对象
  - 事件循环
  - 异步编程
  - Buffer缓冲区
  - Stream流
  - 文件系统

- [01_Node.js核心模块\02_核心模块详解.md](./01_Node.js核心模块/02_核心模块详解.md)
  - fs文件系统
  - path路径处理
  - http/http模块
  - os系统信息
  - child_process子进程
  - events事件模块
  - stream流处理
  - buffer缓冲区

- [01_Node.js核心模块\03_Node.js调试.md](./01_Node.js核心模块/03_Node.js调试.md)
  - 调试工具
  - Chrome DevTools
  - VS Code调试
  - 日志调试
  - 性能分析
  - 内存泄漏排查

### 02_前端框架与工程化

- [02_前端框架与工程化\01_React深入.md](./02_前端框架与工程化/01_React深入.md)
  - React核心概念
  - JSX语法
  - 组件通信
  - 状态管理
  - 副作用处理
  - 性能优化
  - Hooks原理
  - Concurrent模式

- [02_前端框架与工程化\02_Vite核心知识点.md](./02_前端框架与工程化/02_Vite核心知识点.md)
  - Vite概述
  - 基础配置
  - 插件系统
  - 优化技巧
  - 与Webpack对比

- [02_前端框架与工程化\03_前端工程化工具对比.md](./02_前端框架与工程化/03_前端工程化工具对比.md)
  - Webpack
  - Vite
  - Rspack
  - Parcel
  - 工具对比

### 02_Express_Koa框架

- [02_Express_Koa框架\01_Express深入.md](./02_Express_Koa框架/01_Express深入.md)
  - Express核心
  - 路由系统
  - 中间件
  - 错误处理
  - API设计
  - 安全性
  - 性能优化

- [02_Express_Koa框架\02_Koa框架.md](./02_Express_Koa框架/02_Koa框架.md)
  - Koa核心
  - 中间件机制
  - Context上下文
  - 错误处理
  - 与Express对比

- [02_Express_Koa框架\03_NestJS框架.md](./02_Express_Koa框架/03_NestJS框架.md)
  - NestJS概述
  - 模块系统
  - 控制器与路由
  - 提供者与依赖注入
  - 守卫与拦截器
  - 微服务支持

### 03_后端架构与Nodejs引擎

- [03_后端架构与Nodejs引擎\01_后端架构设计.md](./03_后端架构与Nodejs引擎/01_后端架构设计.md)
  - 分层架构
  - 微服务架构
  - 服务发现
  - 熔断与降级
  - 分布式事务

- [03_后端架构与Nodejs引擎\02_Node.js引擎原理.md](./03_后端架构与Nodejs引擎/02_Node.js引擎原理.md)
  - V8引擎
  - Libuv事件循环
  - 内存管理
  - 性能优化
  - 垃圾回收

### 03_数据库

- [03_数据库\01_MongoDB.md](./03_数据库/01_MongoDB.md)
  - MongoDB基础
  - 文档模型
  - 聚合管道
  - 索引优化
  - Node.js集成
  - Atlas云服务

- [03_数据库\02_PostgreSQL.md](./03_数据库/02_PostgreSQL.md)
  - PostgreSQL基础
  - JSONB查询
  - 索引类型
  - 事务隔离级别
  - MVCC并发控制
  - 分区表
  - 物化视图

- [03_数据库\03_Redis.md](./03_数据库/03_Redis.md)
  - Redis基础
  - 数据结构
  - 缓存策略
  - 会话存储
  - 消息队列
  - 高级特性
  - 性能优化

- [03_数据库\数据库技术深度指南.md](./03_数据库/数据库技术深度指南.md)
  - 数据库概述
  - PostgreSQL
  - MongoDB
  - Redis
  - 数据库对比

### 04_全栈框架与服务端渲染

- [04_全栈框架与服务端渲染\01_Next.js16深度教程.md](./04_全栈框架与服务端渲染/01_Next.js16深度教程.md)
  - Next.js概述
  - App Router
  - 服务端组件
  - 路由系统
  - 数据获取
  - 缓存策略
  - 性能优化

- [04_全栈框架与服务端渲染\02_Nuxt.js深度教程.md](./04_全栈框架与服务端渲染/02_Nuxt.js深度教程.md)
  - Nuxt.js概述
  - 页面路由
  - 状态管理
  - 中间件
  - 插件系统
  - 静态生成

### 04_API设计与认证

- [04_API设计与认证\01_RESTful_API与认证授权.md](./04_API设计与认证/01_RESTful_API与认证授权.md)
  - RESTful API设计
  - 认证授权
  - 安全性
  - 常见面试问题

- [04_API设计与认证\02_RESTful_API设计最佳实践.md](./04_API设计与认证/02_RESTful_API设计最佳实践.md)
  - RESTful API概述
  - URL设计规范
  - HTTP方法与状态码
  - 请求与响应设计
  - 认证与授权
  - API版本控制
  - 面试高频问题
  - 最佳实践总结

- [04_API设计与认证\03_GraphQL_API设计指南.md](./04_API设计与认证/03_GraphQL_API设计指南.md)
  - GraphQL概述
  - Schema设计
  - Query查询设计
  - Mutation变更设计
  - Apollo Server实战
  - 性能优化
  - 面试高频问题
  - 最佳实践总结

- [04_API设计与认证\04_OAuth2.0认证完全指南.md](./04_API设计与认证/04_OAuth2.0认证完全指南.md)
  - OAuth2.0基础概念
  - 授权流程详解
  - JWT认证实现
  - 第三方登录集成
  - 安全最佳实践
  - 面试高频问题
  - 最佳实践总结

- [04_API设计与认证\JWT认证实现详解.md](./04_API设计与认证/JWT认证实现详解.md)
  - JWT概述
  - JWT实现
  - 认证中间件
  - 认证控制器
  - 令牌黑名单
  - OAuth 2.0集成
  - 安全最佳实践
  - 前端集成
  - 错误处理最佳实践
  - 安全性考虑
  - 性能优化技巧
  - 生产环境部署建议
  - 常见面试问题
  - 实战案例

### 05_后端工程化与部署运维

- [05_后端工程化与部署运维\01_异常处理与日志系统.md](./05_后端工程化与部署运维/01_异常处理与日志系统.md)
  - 异常处理
  - 日志系统
  - 测试
  - Docker
  - CI/CD
  - 云服务
  - 完整CI/CD流程
  - 监控与告警系统
  - 日志分析最佳实践
  - 成本优化建议
  - 面试高频问题
  - 实战项目案例

- [05_后端工程化与部署运维\02_Docker容器化部署.md](./05_后端工程化与部署运维/02_Docker容器化部署.md)
  - Docker基础概念
  - Dockerfile编写
  - Docker Compose
  - Node.js应用容器化
  - 多阶段构建优化
  - Docker最佳实践
  - 面试高频问题
  - 最佳实践总结

- [05_后端工程化与部署运维\03_CI_CD持续集成部署.md](./05_后端工程化与部署运维/03_CI_CD持续集成部署.md)
  - CI/CD概述
  - GitHub Actions实战
  - Docker容器化部署
  - 自动化测试集成
  - 部署策略
  - 面试高频问题
  - 最佳实践总结

- [05_后端工程化与部署运维\Docker容器化部署.md](./05_后端工程化与部署运维/Docker容器化部署.md)
  - Docker概述
  - Dockerfile编写
  - Docker Compose
  - 多阶段构建优化
  - CI/CD集成
  - Kubernetes部署
  - 监控与日志
  - 最佳实践
  - Kubernetes进阶配置
  - 云原生部署方案
  - 监控与告警系统
  - 成本优化建议
  - 面试高频问题
  - 实战项目案例

### 05_数据库引擎与原理

- [05_数据库引擎与原理\01_数据库引擎原理.md](./05_数据库引擎与原理/01_数据库引擎原理.md)
  - B-Tree索引
  - LSM-Tree写入
  - WAL日志
  - MVCC多版本
  - 一致性算法
  - 分布式事务

- [05_数据库引擎与原理\02_存储引擎对比.md](./05_数据库引擎与原理/02_存储引擎对比.md)
  - InnoDB
  - MyISAM
  - RocksDB
  - LevelDB
  - 存储引擎对比

### 06_数据结构与算法

- [06_数据结构与算法\01_基础数据结构与算法.md](./06_数据结构与算法/01_基础数据结构与算法.md)
  - 基础数据结构
  - 算法基础
  - JavaScript算法实现
  - 高级数据结构
  - 算法设计技巧
  - 面试高频问题
  - 最佳实践总结

### React核心

- [React核心\React19完全指南.md](./React核心/React19完全指南.md)
  - React 19概述
  - 核心特性
  - 安装与配置
  - 组件基础
  - JSX语法
  - Props与State
  - 事件处理
  - 条件渲染
  - 列表渲染
  - 表单处理
  - 组件通信
  - 生命周期
  - Hooks基础
  - 性能优化
  - 错误边界
  - Suspense
  - 服务器组件
  - 最佳实践

- [React核心\React19_Hooks深入详解.md](./React核心/React19_Hooks深入详解.md)
  - React Hooks概述
  - 基础Hooks深入解析
  - useEffect详解
  - useContext详解
  - useMemo与useCallback
  - useRef详解
  - useImperativeHandle
  - useLayoutEffect
  - useTransition
  - useDeferredValue
  - useId
  - useActionState
  - useOptimistic
  - useSyncExternalStore
  - 自定义Hook模式
  - 最佳实践

- [React核心\React19组件设计模式深度指南.md](./React核心/React19组件设计模式深度指南.md)
  - 组件设计模式概述
  - Compound Pattern
  - Headless Component
  - Render Props模式
  - Custom Hook模式
  - 最佳实践

- [React核心\React19.2官方参考文档.md](./React核心/React19.2官方参考文档.md)
  - React核心API
  - React DOM API
  - 客户端API
  - 服务端API
  - Static APIs
  - React Compiler
  - React DevTools
  - React Performance tracks
  - eslint-plugin-react-hooks
  - 总结

- [React核心\React19专题文档更新日志.md](./React核心/React19专题文档更新日志.md)
  - 更新日志
  - 新增文档
  - 更新内容
  - 计划文档

- [React核心\React基础\React19完全指南.md](./React核心/React基础/React19完全指南.md)
  - React 19概述
  - 核心特性
  - 安装与配置
  - 组件基础
  - JSX语法
  - Props与State
  - 事件处理
  - 条件渲染
  - 列表渲染
  - 表单处理
  - 组件通信
  - 生命周期
  - Hooks基础
  - 性能优化
  - 错误边界
  - Suspense
  - 服务器组件
  - 最佳实践

- [React核心\ReactHooks深入\React19_Hooks深入详解.md](./React核心/ReactHooks深入/React19_Hooks深入详解.md)
  - React Hooks概述
  - 基础Hooks深入解析
  - useEffect详解
  - useContext详解
  - useMemo与useCallback
  - useRef详解
  - useImperativeHandle
  - useLayoutEffect
  - useTransition
  - useDeferredValue
  - useId
  - useActionState
  - useOptimistic
  - useSyncExternalStore
  - 自定义Hook模式
  - 最佳实践

- [React核心\ReactHooks深入\React19_Hooks深入详解.md](./React核心/ReactHooks深入/React19_Hooks深入详解.md)
  - React Hooks概述
  - 基础Hooks深入解析
  - useEffect详解
  - useContext详解
  - useMemo与useCallback
  - useRef详解
  - useImperativeHandle
  - useLayoutEffect
  - useTransition
  - useDeferredValue
  - useId
  - useActionState
  - useOptimistic
  - useSyncExternalStore
  - 自定义Hook模式
  - 最佳实践

- [React核心\React高级特性\React19_Server_Components与Server_Actions深度指南.md](./React核心/React高级特性/React19_Server_Components与Server_Actions深度指南.md)
  - Server Components概述
  - Server Components详解
  - Server Actions详解
  - 数据获取
  - 表单处理
  - 性能优化
  - 最佳实践

- [React核心\React状态管理\状态管理方案对比.md](./React核心/React状态管理/状态管理方案对比.md)
  - 状态管理概述
  - Context API
  - Redux Toolkit
  - Zustand
  - Jotai
  - Recoil
  - 状态管理对比
  - 最佳实践

- [React核心\React高级特性\Next.js16深度教程.md](./React核心/React高级特性/Next.js16深度教程.md)
  - Next.js概述
  - App Router
  - 服务端组件
  - 路由系统
  - 数据获取
  - 缓存策略
  - 性能优化
  - 最佳实践

### TypeScript模块

- [TypeScript模块\TypeScript基础\01_TypeScript基础.md](./TypeScript模块/TypeScript基础/01_TypeScript基础.md)
  - TypeScript概述
  - 基础类型
  - 接口与类型别名
  - 类与面向对象
  - 泛型
  - 装饰器
  - 模块系统
  - Node.js集成

- [TypeScript模块\TypeScript进阶\02_TypeScript进阶.md](./TypeScript模块/TypeScript进阶/02_TypeScript进阶.md)
  - 高级类型
  - 类型体操
  - 条件类型
  - 映射类型
  - 工具类型
  - 类型守卫
  - 类型推断
  - 类型编程

- [TypeScript模块\TypeScript工程化\03_TypeScript工程化.md](./TypeScript模块/TypeScript工程化/03_TypeScript工程化.md)
  - 项目配置
  - 构建工具集成
  - ESLint配置
  - Prettier配置
  - 代码规范
  - 性能优化
  - 最佳实践

- [TypeScript模块\TypeScript5.x进阶指南.md](./TypeScript模块/TypeScript5.x进阶指南.md)
  - TypeScript 5.x新特性
  - 装饰器
  - 类型体操
  - 高级类型
  - 性能优化
  - 最佳实践

### 前端工程化

- [前端工程化\构建工具\01_Webpack核心知识点.md](./前端工程化/构建工具/01_Webpack核心知识点.md)
  - Webpack概述
  - 基础配置
  - Loader与Plugin
  - 代码分割
  - Tree Shaking
  - 优化技巧
  - 生产环境配置

- [前端工程化\构建工具\02_Vite核心知识点.md](./前端工程化/构建工具/02_Vite核心知识点.md)
  - Vite概述
  - 基础配置
  - 插件系统
  - 优化技巧
  - 与Webpack对比

- [前端工程化\构建工具\03_Rspack核心知识点.md](./前端工程化/构建工具/03_Rspack核心知识点.md)
  - Rspack概述
  - 基础配置
  - 与Webpack兼容
  - 优化技巧
  - 性能对比

- [前端工程化\构建工具\前端工程化工具对比.md](./前端工程化/构建工具/前端工程化工具对比.md)
  - Webpack
  - Vite
  - Rspack
  - Parcel
  - 工具对比

### 性能优化

- [性能优化\加载性能\01_加载性能优化.md](./性能优化/加载性能/01_加载性能优化.md)
  - Web Vitals指标
  - LCP优化
  - FID优化
  - CLS优化
  - 代码分割
  - 懒加载
  - 预加载
  - 图片优化
  - 资源优先级
  - 最佳实践

- [性能优化\渲染性能\02_渲染性能优化.md](./性能优化/渲染性能/02_渲染性能优化.md)
  - 避免不必要的重渲染
  - 虚拟列表
  - 防抖节流
  - 请求合并
  - 数据预取
  - 最佳实践

- [性能优化\网络性能\03_网络性能优化.md](./性能优化/网络性能/03_网络性能优化.md)
  - HTTP/2与HTTP/3
  - 资源压缩
  - CDN优化
  - 缓存策略
  - DNS预解析
  - 连接复用
  - 最佳实践

- [性能优化\性能优化实战.md](./性能优化/性能优化实战.md)
  - 性能预算
  - 性能监控
  - 性能分析
  - 性能优化清单
  - 最佳实践

### 前沿技术

- [前沿技术\WebAssembly.md](./前沿技术/WebAssembly.md)
  - WebAssembly概述
  - 基础语法
  - 与JavaScript交互
  - 性能优化
  - 使用场景
  - 最佳实践

- [前沿技术\WebGPU.md](./前沿技术/WebGPU.md)
  - WebGPU概述
  - 基础语法
  - 3D渲染
  - 计算着色器
  - 性能优化
  - 最佳实践

- [前沿技术\AIGC与前端.md](./前沿技术/AIGC与前端.md)
  - AIGC概述
  - OpenAI API集成
  - 文本生成
  - 图像生成
  - 音频生成
  - 最佳实践

- [前沿技术\端侧AI与前端.md](./前沿技术/端侧AI与前端.md)
  - 端侧AI概述
  - TensorFlow.js
  - ONNX Runtime
  - 模型优化
  - 最佳实践

### Docker容器化部署

- [Docker容器化部署.md](./Docker容器化部署.md)
  - Docker概述
  - Dockerfile编写
  - Docker Compose
  - 多阶段构建优化
  - CI/CD集成
  - Kubernetes部署
  - 监控与日志
  - 最佳实践
  - Kubernetes进阶配置
  - 云原生部署方案
  - 监控与告警系统
  - 成本优化建议
  - 面试高频问题
  - 实战项目案例

## 📊 统计信息

- **总文档数**: 100+
- **总标题数**: 1000+
- **最新更新**: 2026年3月14日

## 🔧 工具使用

### 生成大纲

```bash
# 生成树形结构大纲
node generate-outline.js

# 生成JSON格式大纲
node generate-outline.js --json

# 保存到文件
node generate-outline.js --output outline.md

# 查看帮助
node generate-outline.js --help
```

### 配置选项

在`generate-outline.js`中可以配置：

```javascript
const CONFIG = {
  directories: ['.', 'React核心', '前端基础', ...],
  ignoreFiles: ['node_modules', '.git', ...],
  ignoreDirs: ['node_modules', '.git'],
  maxDepth: 6,
  includeFilePath: true,
  outputFormat: 'tree', // 'tree' 或 'json'
};
```

## 📝 更新日志

- **2026-03-14**: 初始大纲生成，包含100+文档，1000+标题

## 📚 学习路径建议

### 初学者（1-2周）
1. 00_全局指南 - 了解整体学习路线
2. 01_前端底层与基础 - 学习HTML/CSS/JavaScript
3. React核心 - 学习React基础

### 进阶者（2-4周）
1. TypeScript模块 - 学习TypeScript
2. 02_Express_Koa框架 - 学习后端框架
3. 03_数据库 - 学习数据库

### 高级开发者（1个月+）
1. 05_后端工程化与部署运维 - 学习工程化
2. 性能优化 - 学习性能优化
3. 前沿技术 - 学习新技术

## 🎯 面试准备

### 前端面试
1. React核心 - React相关问题
2. TypeScript模块 - TypeScript相关问题
3. 性能优化 - 性能优化问题

### 后端面试
1. 02_Express_Koa框架 - Node.js相关问题
2. 03_数据库 - 数据库相关问题
3. 04_API设计与认证 - API设计问题

### 全栈面试
1. 00_全局指南 - 整体技术栈
2. React核心 - 前端技术
3. 02_Express_Koa框架 - 后端技术
4. 03_数据库 - 数据库技术

## 📞 联系方式

如有问题，请联系项目维护者。

---

*本文档由 Qwen Code 生成，最后更新于 2026年3月14日*
