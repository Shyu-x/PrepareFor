# GEMINI.md - 2026年全栈开发教学系统核心指南

本文件是 Gemini CLI 在本项目（全栈开发教学知识库）中的最高优先级操作指南。它集成了 `CLAUDE.md` 的约束力和 `QWEN.md` 的探索逻辑，旨在确保文档的专业性、时效性与系统性。

## 一、 项目愿景与定位

本项目是一个**以 AI 驱动、面向 2026 年大厂面试与实战**的 Web 全栈开发教学系统。
- **核心理念**: 从“教程生成”转向“知识生命体”。通过关联引力、深度递归和持续验证，构建一个无限扩展的动态知识图谱。
- **项目性质**: **纯文档项目**。所有产出均为高质量的 Markdown 文件，严禁运行 `npm` 或其他构建/安装命令。

## 二、 核心技术栈 (2026年标准)

| 领域 | 推荐技术 | 版本 | 核心关注点 |
| :--- | :--- | :--- | :--- |
| **前端框架** | React | 19.x | Server Components, Compiler, Actions |
| **全栈框架** | Next.js | 16.x | App Router, Turbopack, ISR/SSR 优化 |
| **状态管理** | Zustand / SWR | 5.x | 轻量化、数据获取与缓存一致性 |
| **样式方案** | Tailwind CSS | 4.x | Oxide 引擎、配置简化、高性能编译 |
| **后端框架** | NestJS / Express | 11.x / 4.x | 类型安全、依赖注入、中间件模式 |
| **数据库** | PostgreSQL / MongoDB | 16 / 7 | 关系型设计、向量搜索、JSON 性能 |
| **类型系统** | TypeScript | 5.8+ | 装饰器、类型体操、工程化效率 |

## 三、 强制性协作规范

### 3.1 语言与命名 (严格遵守)
- **文件名 & 目录名**: 必须使用**中文**（例如：`React核心/`、`01_Node.js基础.md`）。
- **文档内容**: 全程使用**中文**编写。
- **代码注释**: 示例代码中的注释必须为**中文**。

### 3.2 教学文档结构要求
每个 Markdown 文件必须遵循以下标准结构：
1. **概述**: 技术的定义、解决了什么痛点及 2026 年的应用背景。
2. **核心概念**: 采用“是什么 -> 为什么 -> 怎么做”的逻辑解析关键点。
3. **代码示例**: 提供完整、可运行的代码片段，体现 2026 年的主流写法。
4. **实战练习**: 1-2 个针对性习题，涵盖面试题或项目场景题。

### 3.3 文档标题层级
- `# 一级标题`: 技术领域（如：`# React核心`）
- `## 二级标题`: 具体技术点（如：`## React Hooks深入`）
- `### 三级标题`: 细分主题（如：`### useState详解`）

## 四、 无限深度知识探索系统 (Agent 执行逻辑)

作为 AI 智能体，你应扮演“全栈技术研究员”，利用以下策略驱动内容生成：

### 4.1 探索策略
- **横向扩展**: 发现竞品与生态。例如在写 React 19 时，对比 Vue 3.5 或 Svelte 5 的类似特性。
- **纵向挖掘**: 追溯底层原理。例如分析 Server Components 的二进制传输协议或 Fiber 架构的演进。
- **反证探索**: 记录缺点与局限性。避免盲目推崇，需指出技术的适用边界。
- **趋势预测**: 预测未来 6 个月的发展。例如边缘计算与 Web 框架的进一步融合。

### 4.2 知识图谱维护
- **关联引力**: 每当新增一个知识点，必须在相关文档中建立超链接。
- **时效监测**: 发现版本过时信息立即标记并修正。

## 五、 目录结构索引 (快速定位)

本项目已重构为全新的 **全栈文章集群 (Article Cluster)** 架构，各模块深入底层引擎与原理：

```text
全栈开发/
├── GEMINI.md                              # AI Agent 协作核心指令与上下文
├── 00_全局指南/
│   ├── 01_学习路线概览.md
│   ├── React+Node全栈学习路线.md
│   ├── 2026全栈架构趋势与技术选型指南.md
│   └── 业务逻辑学习法与2026热门业务场景深度解析.md
├── 01_前端底层与基础/
│   ├── CSS3现代布局与架构指南_2026.md
│   ├── CSS滚动驱动动画与animation-timeline实战指南_2026.md
│   ├── CSS盒模型与现代布局底层解析.md
│   ├── JavaScript异步编程与事件循环机制.md
│   ├── JavaScript内存模型与V8垃圾回收机制.md
│   ├── JavaScript数据类型与内存模型底层解构.md
│   ├── V8引擎JIT编译与去优化深度揭秘.md
│   ├── V8引擎数组底层_ElementsKinds状态转移解密.md
│   ├── V8引擎源码_TimSort算法深度解析.md
│   ├── DOM事件流与React合成事件底层机制.md
│   ├── HTTP3_QUIC网络底层演进史.md
│   ├── 2026浏览器渲染管线与WebGPU加速.md
│   ├── 现代Web_API完全指南.md
│   ├── 浏览器工作原理深入指南.md
│   ├── JavaScript面向对象深度解构_从原型到类.md
│   ├── JavaScript定时器与高精度调度底层原理.md
│   ├── JavaScript垃圾回收机制与内存泄漏深度攻延.md
│   ├── JavaScript数据处理深度解析_克隆与扁平化.md
│   └── HTTP协议深度全解_从语义到缓存.md
├── 02_前端框架与工程化/
│   ├── React_Hooks深度命题与设计哲学.md
│   ├── 大型项目组件管理与工程化质量验证.md
│   ├── 2026全栈架构_基于CRDT与WebSockets的实时协作模式.md
│   ├── 2026全栈架构_InfiniteScroll与大数据分片加载.md
│   ├── 2026全栈架构_Signals响应式与原生Action系统深度解析.md
│   ├── React19_现代化表单架构_Actions与useActionState深度实践.md
│   ├── 现代前端状态管理分层理论_从Zustand到Signals.md
│   ├── Vue3与React19虚拟DOM渲染引擎对比.md
│   ├── React19_Fiber与Hooks底层机制.md
│   ├── React_16-19全史_架构演进与特性深度对比.md
│   ├── React_Compiler_AST级别源码转换深度揭秘.md
│   ├── React19_useState源码级底层解析_Fiber队列与调度.md
│   ├── 前端状态管理演进史_从Redux到TC39_Signals.md
│   ├── 前端构建工具演进史_Babel到Rolldown性能革命.md
│   ├── 现代构建工具底层原理与选型指南.md
│   ├── React19_Svelte5_Vue3.5响应式与全栈架构深度对比.md
│   ├── React19_Zustand_状态管理与中间件架构极客教程.md
│   ├── React19_高级UI组件设计模式_Compound与Headless实战.md
│   ├── React_Hooks依赖比对与闭包陷阱深度剖析.md
│   ├── React_Fiber算法底层_On降维演进史.md
│   ├── Vite与Rspack底层原理深度解析.md
│   ├── Webpack与Vite中AST抽象语法树底层应用.md
│   ├── 现代构建工具专题_Rollup_Vite_Turbopack.md
│   ├── 微前端Module_Federation_2.0原理解析.md
│   └── TypeScript5.8_高级类型与编译器原理.md
├── 03_后端架构与Nodejs引擎/
│   ├── Nodejs原生权限模型与安全策略深度解析.md
│   ├── Node.js底层架构与libuv事件循环深度解析.md
│   ├── Nodejs_Stream流式计算与底层背压机制.md
│   ├── Nodejs多进程架构与IPC通信底层原理.md
│   ├── Nodejs底层C++_Bindings与console_log全链路.md
│   ├── Nodejs底层libuv异步IO之C++源码全链路剖析.md
│   ├── Nodejs_Buffer内存池分配底层机制.md
│   ├── 微服务通信演进史_RESTful到gRPC原理解析.md
│   ├── NestJS依赖注入与底层架构深度解析.md
│   ├── Express深度进阶_中间件底层路由算法与2026实战.md
│   ├── 后端调试与生产环境故障排查指南.md
│   └── 领域驱动设计(DDD)与复杂业务逻辑架构.md
├── 04_全栈框架与服务端渲染/
│   ├── Nextjs16_DynamicIO与PPR全栈架构深度解析.md
│   ├── Web渲染架构百年史_从PHP到RSC与PPR.md
│   ├── Next.js16与React_Server_Components深度解析.md
│   └── Nextjs16_AppRouter_路由与RSC全栈架构极客教程.md
├── 05_数据库引擎与原理/
│   ├── 数据库索引底层原理_PostgreSQL与MongoDB对比.md
│   ├── 高性能存储底层_BTree物理对齐与LSMTree写入放大.md
│   ├── 2026数据库全景图_分布式SQL与AI向量引擎.md
│   ├── 分布式一致性算法与多主冲突解决机制.md
│   ├── Prisma架构演进与Rust查询引擎深度解析.md
│   ├── Prisma与Next.js_Serverless架构高并发连接池调优.md
│   ├── 企业级数据库建表设计与建模方法论.md
│   └── Next.js_Prisma_PostgreSQL高并发调优实战.md
├── 06_Web安全架构/
│   ├── 现代鉴权演进史_从Session到WebAuthn与OAuth2.1.md
│   ├── 现代鉴权之DPoP令牌绑定与安全演进.md
│   ├── 现代Web前端安全防御体系.md
│   ├── 现代后端与API安全防御体系.md
│   ├── 安全底层机制_DNS重定向_JSONP陷阱与SameSite深度约束.md
│   └── CSP_Level3与TrustedTypes底层防线.md
├── 07_前沿技术与性能优化/
│   ├── 2026现代Web图像优化指南_AVIF_JXL_FetchPriority.md
│   ├── 2026浏览器渲染新特性_ViewTransitions与动画编排.md
│   ├── 2026性能架构专题_虚拟列表与大数据量渲染深度解析.md
│   ├── 前端性能调优实战_火焰图与DevTools深度应用.md
│   ├── 前端性能监控_自研Web_Vitals采集SDK底层解析.md
│   ├── WebAssembly内存交互与底层机制.md
│   ├── WebAssembly共享内存与多线程同步机制.md
│   ├── 跨端开发技术栈_ReactNative底层架构深度解构.md
│   └── 全栈系统级性能优化与监控体系.md
├── 08_容器化与云原生架构/
│   ├── Docker底层隔离机制与K8s调度原理.md
│   └── 云原生自动化运维_Terraform哲学与GitHub安全审计.md
├── 09_大厂面试核心陷阱与边缘场景/
│   ├── React渲染陷阱_useEffect依赖与Context穿透.md
│   ├── React生命周期底层_useLayoutEffect与批处理机制.md
│   ├── JS核心陷阱_原型污染与this绑定边界解析.md
│   ├── 异步编程极客题_微任务嵌套与Generator协程机制.md
│   ├── Vue3响应式陷阱_解构失效与调度器执行时机.md
│   └── 工程化边界_循环依赖与CORS预检缓存底层.md
├── 10_AI基础设施与全栈集成/
│   ├── LLM推理架构与Agentic_Workflows深度解析.md
│   └── 前端端侧AI推理_WebGPU与WebNN底层架构.md
├── 11_操作系统与高性能后端/
│   ├── Linux异步IO演进史_epoll与io_uring深度解析.md
│   └── Linux网络内核调度_Socket与epoll红黑树调优.md
├── 12_CSS引擎与样式架构/
│   └── CSS引擎百年史_Houdini与底层渲染钩子.md
├── 13_大厂手写代码巅峰专栏/
│   └── 大厂面试必考手写函数全量CheatSheet.md
├── 14_全栈架构师实战项目与冲刺宝典/
│   ├── 2026大厂电商核心场景_秒杀架构与动态库存优化.md
│   ├── 2026高频AI金融交易终端架构全链路深度解析.md
│   └── 面试最后3小时极限冲刺宝典.md
```

## 六、 待办清单与维护任务 (持续更新)

### 已完成任务 (2026年3月14日)

#### 核心框架文档
- [x] **React 19 & Signals 专题**: 已完成《2026全栈架构_Signals响应式与原生Action系统深度解析.md》。
- [x] **Node.js 权限模型**: 已完成《Nodejs原生权限模型与安全策略深度解析.md》。
- [x] **Next.js 16 性能革命**: 已完成《Nextjs16_DynamicIO与PPR全栈架构深度解析.md》。
- [x] **React 19 组件设计模式**: 已完成《React19组件设计模式深度指南.md》。
- [x] **React 19 Hooks 深入**: 已完成《React19_Hooks深入详解.md》。
- [x] **Server Components 与 Server Actions**: 已完成《React19_Server_Components与Server_Actions深度指南.md》。
- [x] **React 专题文档更新日志**: 已完成《React19_专题文档更新日志.md》。
- [x] **简化版树形结构规划**: 已完成《简化版树形结构规划.md》。
- [x] **简化版迁移脚本**: 已完成《简化版迁移脚本.bat》。

#### 全栈框架原理深度解析
- [x] **Next.js SSR原理与架构深度解析**: 已完成《Next.js16_SSR原理与架构深度解析.md》(1000行)
  - SSR原理、Server Components原理、Turbopack原理
  - 缓存机制原理、流式渲染原理、Hydration原理
  - 性能优化原理、调试原理、部署原理
- [x] **NestJS依赖注入与底层架构深度解析**: 已完成《NestJS依赖注入与底层架构深度解析_2026.md》(1269行)
  - 依赖注入原理、装饰器原理、AOP原理
  - 模块系统原理、请求生命周期、性能优化
  - 测试原理、部署原理

#### 全栈框架详细教学
- [x] **Express深入详解**: 已完成《02_Express_Koa框架/01_Express深入.md》(1560行)
  - 中间件系统、路由机制、请求/响应对象
  - 错误处理、模板引擎、安全最佳实践
  - 文件上传、WebSocket集成、测试、部署
- [x] **全栈框架对比与选型指南**: 已完成《02_Express_Koa框架/全栈框架对比与选型指南.md》(1378行)
  - 2026年技术栈推荐、选型决策树
  - Express、Next.js、NestJS框架详解
  - 实战案例：Todo应用的三种实现

#### 全栈项目实战案例
- [x] **Express电商系统实战项目**: 已完成《实战项目/01_Express电商系统实战项目.md》(2668行)
  - 用户认证模块（JWT、密码加密）
  - 产品管理模块（CRUD、搜索、筛选、分页）
  - 购物车管理、订单管理、文件上传
  - API文档（Swagger）、安全措施、测试
- [x] **Next.js博客系统实战项目**: 已完成《实战项目/02_Next.js博客系统实战项目.md》(3341行)
  - 文章管理模块（CRUD、Markdown渲染）
  - 评论系统、收藏功能、用户系统（NextAuth）
  - SEO优化、响应式设计、类型安全
- [x] **NestJS任务管理系统实战项目**: 已完成《实战项目/03_NestJS任务管理系统实战项目.md》(2943行)
  - 用户管理、认证授权（JWT、角色）
  - 任务管理、通知系统、WebSocket实时更新
  - API文档、错误处理、日志记录

#### MDN Web文档整合
- [x] **HTML5核心知识**: 已完成《01_前端底层与基础/01_HTML5核心知识.md》(1251行)
- [x] **CSS3核心知识**: 已完成《01_前端底层与基础/02_CSS3核心知识.md》(1820行)
- [x] **JavaScript核心知识**: 已完成《01_前端底层与基础/03_JavaScript核心知识.md》(1084行)
- [x] **Web API**: 已完成《01_前端底层与基础/04_Web_API.md》(2175行)
- [x] **MDN Web文档整合总结**: 已完成《01_前端底层与基础/MDN_Web文档整合总结.md》

#### 前端安全知识点
- [x] **XSS攻击完整知识点**: 已完成
- [x] **CSRF攻击完整指南**: 已完成
- [x] **Clickjacking攻击与防御**: 已完成
- [x] **CORS跨域资源共享详解**: 已完成
- [x] **SSRF服务端请求伪造**: 已完成

### 已完成任务 (2026年3月18日)

#### 基础与底层解析
- [x] **CSS 盒模型深度解析**: 已完成《01_前端底层与基础/CSS盒模型与现代布局底层解析.md》。
- [x] **滚动驱动动画专题**: 已完成《01_前端底层与基础/CSS滚动驱动动画与animation-timeline实战指南_2026.md》。
  - `animation-timeline` 原理、`scroll()` 与 `view()` 函数、GPU 加速原理、React 19 集成。

#### 框架与架构进阶
- [x] **React Hooks 设计哲学**: 已完成《02_前端框架与工程化/React_Hooks深度命题与设计哲学.md》。
  - 从 `useWindowSize` 实战演练 `useSyncExternalStore`，深度解析代数效应（Algebraic Effects）与 React 闭包模型。
- [x] **大型项目组件管理**: 已完成《02_前端框架与工程化/大型项目组件管理与工程化质量验证.md》。
  - 特性驱动架构（Feature-based）、垂直切片模式、Compound + Headless 组件设计、Vitest Browser 质量验证体系。
- [x] **无限滚动架构专题**: 已完成《02_前端框架与工程化/2026全栈架构_InfiniteScroll与大数据分片加载.md》。
- [x] **React 19 表单架构专题**: 已完成《02_前端框架与工程化/React19_现代化表单架构_Actions与useActionState深度实践.md》。
- [x] **现代状态管理分层理论**: 已完成《02_前端框架与工程化/现代前端状态管理分层理论_从Zustand到Signals.md》。
- [x] **实时协作架构专题**: 已完成《02_前端框架与工程化/2026全栈架构_基于CRDT与WebSockets的实时协作模式.md》。
  - CRDT (Y.js) 算法原理、Local-first 架构、WebSocket 增量同步、React 19 Optimistic UI 集成。

#### 性能与渲染前沿
- [x] **虚拟列表与大数据渲染**: 已完成《07_前沿技术与性能优化/2026性能架构专题_虚拟列表与大数据量渲染深度解析.md》。
- [x] **浏览器渲染新特性专题**: 已完成《07_前沿技术与性能优化/2026浏览器渲染新特性_ViewTransitions与动画编排.md》。
- [x] **现代图像优化指南**: 已完成《07_前沿技术与性能优化/2026现代Web图像优化指南_AVIF_JXL_FetchPriority.md》。
  - JPEG XL (JXL) 渐进式渲染、AVIF 极致压缩、`fetchpriority` LCP 调优实战。
#### 业务场景实战 (新)
- [x] **电商秒杀与库存一致性**: 已完成《14_全栈架构师实战项目与冲刺宝典/2026大厂电商核心场景_秒杀架构与动态库存优化.md》。
- [x] **智能 Agent 交互架构**: 已完成《10_AI基础设施与全栈集成/2026智能Agent交互架构_流式渲染与工具调用设计.md》。
- [x] **SaaS 高频监控系统**: 已完成《03_后端架构与Nodejs引擎/2026SaaS系统_高频数据实时监控与Signals细粒度更新.md》。
- [x] **金融交易终端实战**: 已完成《14_全栈架构师实战项目与冲刺宝典/2026高频AI金融交易终端架构全链路深度解析.md》。
  - 综合运用 Signals、WASM 多线程、PPR 及 Serverless DB 连接池打造 2026 顶级性能基标。

#### 核心文档深度形象化重构 (2026 深度解析版)
- [x] **状态管理 (Signals)**: 重构《02_前端框架与工程化/前端状态管理演进史_从Redux到TC39_Signals.md》。
  - 引入“现代化工厂智能传感器”比喻，深度解析 O(1) 精准制导原理。
- [x] **渲染架构 (PPR)**: 重构《04_全栈框架与服务端渲染/Nextjs16_DynamicIO与PPR全栈架构深度解析.md》。
  - 引入“高级餐厅自助餐”比喻，解析“单次往返”流式喷射魔法。
- [x] **构建工具 (Rust)**: 重构《02_前端框架与工程化/前端构建工具演进史_Babel到Rolldown性能革命.md》。
  - 引入“手工作坊到全自动工业母机”比喻，揭秘 Rust 零成本抽象与内存池利刃。
- [x] **计算架构 (WASM)**: 重构《07_前沿技术与性能优化/WebAssembly共享内存与多线程同步机制.md》。
  - 引入“超级流水线与交通管制”比喻，演示 8K 视频零拷贝处理实战。
- [x] **数据库调优 (Serverless)**: 重构《05_数据库引擎与原理/Prisma与Next.js_Serverless架构高并发连接池调优.md》。
  - 引入“市政自来水网”比喻，解析 TCP 握手消除与边缘网关降维打击。
- [x] **现代布局 (CSS3)**: 重构《01_前端底层与基础/CSS3现代布局与架构指南_2026.md》。
  - 引入“变色龙衣”比喻容器查询，确立“内在 Web 设计”分层思想。

### 进行中任务
#### 全栈框架与服务端渲染 (深度重构)
- [x] **Next.js 16 性能革命**: 深度重构《04_全栈框架与服务端渲染/Nextjs16_DynamicIO与PPR全栈架构深度解析.md》。
  - 详细解析 PPR 动静结合模型、Dynamic IO 的 `'use cache'` 显式缓存机制，以及应对高并发电商的实战架构。

### 进行中任务

- [ ] **执行文件夹迁移**: 按照简化版迁移脚本.bat执行迁移
- [ ] **更新路径引用**: 更新所有文档中的路径引用
- [ ] **删除旧结构**: 确认无误后删除旧结构

---
*本文档由 Gemini CLI 维护，最后更新于 2026年3月18日*
