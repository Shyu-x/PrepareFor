# QWEN.md

本文件为Qwen Code提供项目上下文指导，帮助AI助手更好地理解和操作此项目。

---

## 一、项目概述

这是一个**Web前端开发教学系统**，包含React + Node.js全栈开发学习路线文档。

**文档类型**：纯文档项目（Markdown格式），无需构建、测试、打包等操作

**核心目标**：为准备面试大厂前端/全栈岗位的学生提供系统化的学习资料

**学习路线结构**：

- `01_学习路线概览.md` - 整体学习路径规划
- `前端基础/` - HTML5、CSS3、JavaScript核心知识
- `01_Node.js核心模块/` - Node.js基础与核心模块
- `02_Express_Koa框架/` - Express、Koa、NestJS框架
- `03_数据库/` - MongoDB、PostgreSQL、Redis
- `04_API设计与认证/` - RESTful API与JWT认证
- `05_后端工程化与部署运维/` - 异常处理与日志
- `06_数据结构与算法/` - 基础数据结构与算法
- `React核心/` - React基础、Hooks、状态管理、高级特性
- `TypeScript模块/` - TypeScript基础与进阶
- `前端工程化/` - 构建工具
- `性能优化/` - 加载性能优化

**2026年3月最新进展**：
- ✅ 完成Next.js SSR原理与架构深度解析（1000行）
- ✅ 完成NestJS依赖注入与底层架构深度解析（1269行）
- ✅ 完成Express深入详解（1560行）
- ✅ 完成全栈框架对比与选型指南（1378行）
- ✅ 完成3个全栈项目实战案例（8952行）
- ✅ 完成MDN Web文档整合（6330行）
- ✅ 完成前端安全知识点（XSS、CSRF、Clickjacking、CORS、SSRF）

---

## 二、语言规范（强制要求）

**全程只允许使用中文**，包括：

1. **中文文件名** - 所有Markdown文件使用中文命名（如`01_Node.js基础.md`）
2. **中文目录名** - 所有目录名称使用中文（如`React核心/`、`前端基础/`）
3. **中文内容** - 文档内容必须使用中文编写
4. **中文注释** - 代码示例中的注释必须使用中文

```markdown
<!-- ✅ 正确：使用中文 -->
## Node.js基础
### 异步编程与事件循环
// 创建用户状态管理
const [user, setUser] = useState<User | null>(null);

<!-- ❌ 错误：使用英文 -->
## Node.js Basic
// Create user state management
```

---

## 三、教学文档编写规范

### 3.1 文档结构要求

每个技术文档必须包含：

1. **概述** - 技术的定义和用途
2. **核心概念** - 关键技术点解析
3. **代码示例** - 完整可运行的代码（带中文注释）
4. **实战练习** - 巩固知识的练习题

### 3.2 内容层级

使用Markdown层级结构：

```markdown
# 一级标题 - 技术领域（如：React核心）
## 二级标题 - 具体技术点（如：React Hooks深入）
### 三级标题 - 细分主题（如：useState详解）
#### 四级标题 - 细节内容
```

### 3.3 代码示例规范

```typescript
// ✅ 正确：使用中文注释
// 创建用户状态管理
const [user, setUser] = useState<User | null>(null);

// 处理用户登录
const handleLogin = async (credentials: LoginCredentials) => {
  try {
    const response = await authApi.login(credentials);
    setUser(response.user);
  } catch (error) {
    console.error('登录失败:', error);
  }
};
```

---

## 四、技术栈版本参考

| 技术领域 | 技术名称 | 版本 |
|----------|----------|------|
| 前端框架 | React | 19.x |
| 全栈框架 | Next.js | 16.x |
| 状态管理 | Zustand | 5.x |
| 样式方案 | Tailwind CSS | 4.x |
| 组件库 | Ant Design | 6.x |
| 后端框架 | Express/NestJS | 4.x/11.x |
| 数据库 | PostgreSQL/MongoDB | - |
| 实时通信 | Socket.io | 4.x |
| 类型系统 | TypeScript | 5.x |

---

## 五、目录结构

```
全栈开发/
├── 01_学习路线概览.md           # 整体学习路线
├── React+Node全栈学习路线.md    # 详细学习路线
│
├── 00_全局指南/                  # 全局指南
│   ├── 01_学习路线概览.md
│   ├── React+Node全栈学习路线.md
│   └── 2026全栈架构趋势与技术选型指南.md
│
├── 01_前端底层与基础/            # 前端基础与原理
│   ├── 01_HTML5核心知识.md       # HTML5核心知识
│   ├── 02_CSS3核心知识.md        # CSS3核心知识
│   ├── 03_JavaScript核心知识.md  # JavaScript核心知识
│   ├── 04_Web_API.md             # Web API核心知识
│   ├── MDN_Web文档整合总结.md    # MDN文档整合总结
│   ├── 现代Web_API完全指南_2026.md
│   ├── CSS3现代布局与架构指南_2026.md
│   ├── JavaScript现代标准与2026核心提案深度解析.md
│   └── ...
│
├── 02_前端框架与工程化/          # 前端框架与工程化
│   ├── 2026全栈架构_Signals响应式与原生Action系统深度解析.md
│   ├── Vue3与React19虚拟DOM渲染引擎对比.md
│   ├── React19_Fiber与Hooks底层机制.md
│   ├── React_16-19全史_架构演进与特性深度对比.md
│   ├── React_Compiler_AST级别源码转换深度揭秘.md
│   ├── React19_Zustand_状态管理与中间件架构极客教程.md
│   ├── React19_高级UI组件设计模式_Compound与Headless实战.md
│   ├── React_Hooks依赖比对与闭包陷阱深度剖析.md
│   ├── React_Fiber算法底层_On降维演进史.md
│   ├── React_Fiber底层架构与并发调度机制源码级解析.md
│   ├── Vite与Rspack底层原理深度解析.md
│   ├── Webpack与Vite中AST抽象语法树底层应用.md
│   ├── 微前端Module_Federation_2.0原理解析.md
│   ├── 前端状态管理演进史_从Redux到TC39_Signals.md
│   ├── 前端构建工具演进史_Babel到Rolldown性能革命.md
│   ├── 现代构建工具底层原理与选型指南.md
│   ├── 现代构建工具原理对比_Webpack与Vite底层解密.md
│   └── TypeScript5.8_高级类型与编译器原理.md
│
├── 02_Express_Koa框架/          # 后端框架学习
│   ├── 01_Express深入.md         # Express深入详解
│   ├── 02_Koa框架.md             # Koa框架详解
│   ├── 03_NestJS框架.md          # NestJS框架详解
│   ├── 04_NestJS框架深入.md      # NestJS框架深入
│   ├── 后端框架对比.md            # 后端框架对比
│   ├── 全栈框架对比与选型指南.md  # 全栈框架对比与选型指南
│   └── 全栈框架教学内容整合总结.md # 全栈框架教学内容整合总结
│
├── 03_后端架构与Nodejs引擎/      # 后端架构与Node.js引擎
│   ├── Node.js底层架构与libuv事件循环深度解析.md
│   ├── Nodejs_Stream流式计算与底层背压机制.md
│   ├── Nodejs多进程架构与IPC通信底层原理.md
│   ├── Nodejs原生权限模型与安全策略深度解析.md
│   ├── NestJS依赖注入与底层架构深度解析_2026.md
│   ├── NestJS依赖注入与底层架构深度解析.md
│   ├── 微服务通信演进史_RESTful到gRPC原理解析.md
│   ├── 领域驱动设计(DDD)与复杂业务逻辑架构.md
│   └── 后端调试与生产环境故障排查指南.md
│
├── 03_数据库/                   # 数据库知识
│   ├── 01_MongoDB.md
│   ├── 02_PostgreSQL.md
│   ├── 03_Redis.md
│   └── 数据库技术深度指南.md
│
├── 04_API设计与认证/            # API与认证
│   ├── 01_RESTful_API与认证授权.md
│   ├── 02_CORS跨域资源共享详解.md
│   ├── 02_SSRF服务端请求伪造.md
│   └── ...
│
├── 05_后端工程化与部署运维/      # 工程化与运维
│   └── 01_异常处理与日志系统.md
│
├── 06_数据结构与算法/            # 算法基础
│   └── 01_基础数据结构与算法.md
│
├── React核心/                    # React技术栈
│   ├── React基础/
│   ├── ReactHooks深入/
│   ├── React状态管理/
│   ├── React高级特性/
│   ├── React19.2官方参考文档.md
│   ├── React19完全指南.md
│   ├── Next.js16_App_Router完整教程.md
│   ├── Next.js16_SSR原理与架构深度解析.md
│   ├── 全栈框架原理深度解析整合总结.md
│   └── 状态管理方案对比.md
│
├── TypeScript模块/              # TypeScript学习
│   ├── TypeScript基础/
│   ├── TypeScript进阶/
│   ├── TypeScript工程化/
│   └── TypeScript5.x进阶指南.md
│
├── 前端工程化/                   # 构建工具与工程化
│   ├── 构建工具/
│   └── 前端工程化工具对比.md
│
├── 性能优化/                     # 性能优化专题
│   └── 加载性能/
│
├── 前沿技术/                     # 前沿技术探索
│
├── 实战项目/                     # 全栈项目实战
│   ├── 01_Express电商系统实战项目.md
│   ├── 02_Next.js博客系统实战项目.md
│   └── 03_NestJS任务管理系统实战项目.md
│
└── ...
```

---

## 六、常用操作

由于本项目为纯文档项目，**无需执行以下操作**：

- ❌ `npm install` / `npm run dev`
- ❌ 构建命令
- ❌ 测试命令
- ❌ 部署操作

**仅需执行的操作**：

- ✅ 读取/编写Markdown文档
- ✅ 编辑/创建中文文件名
- ✅ 管理文档目录结构
- ✅ 使用Git进行版本控制

---

## 七、快速索引

| 需求 | 路径 |
|------|------|
| 了解整体学习路线 | `01_学习路线概览.md`、`React+Node全栈学习路线.md` |
| 学习前端基础 | `01_前端底层与基础/` |
| 学习React | `React核心/` |
| 学习TypeScript | `TypeScript模块/` |
| 学习后端 | `02_Express_Koa框架/`、`03_后端架构与Nodejs引擎/` |
| 学习数据库 | `03_数据库/` |
| 学习工程化 | `02_前端框架与工程化/` |
| 学习全栈框架 | `02_Express_Koa框架/`、`React核心/` |
| 学习全栈项目 | `实战项目/` |
| 学习前端安全 | `04_API设计与认证/` |
| 学习原理深度 | `03_后端架构与Nodejs引擎/`、`React核心/` |

---

## 八、注意事项

1. **强制中文** - 所有文件名、目录名、内容必须使用中文
2. **文档格式** - 使用标准Markdown格式编写
3. **版本一致性** - 技术版本号需与文档描述一致
4. **代码注释** - 所有代码示例必须包含中文注释
5. **图片路径** - 如需添加图片，使用相对路径引用
6. **时效性** - 技术内容需定期更新，保持与最新版本同步

---

## 九、无限深度全栈知识探索系统

### 9.1 核心范式

**从"教程生成"到"知识生命体"**：构建自我驱动、无限扩展的知识探索系统。

### 9.2 知识探索法则

| 法则 | 说明 |
|------|------|
| **关联引力定律** | 任何技术点都会自然吸引相关技术 |
| **深度递归定律** | 每个知识点都可以无限拆解为子知识点 |
| **验证必要性定律** | 所有知识必须通过实践验证才有效 |
| **时效衰减定律** | 知识会随时间失效，需要持续更新 |
| **未知边界定律** | 已知范围越大，未知边界越大 |

### 9.3 探索策略

```
# 横向探索（广度）
- 相关技术、竞品、生态工具

# 纵向探索（深度）
- 原理、历史、未来、反模式

# 跨界探索（连接）
- 其他领域解决方案、技术融合

# 验证探索（反证）
- 缺点、失败案例、局限性、反对观点

# 趋势探索（预测）
- 未来方向、替代趋势、颠覆者
```

### 9.4 知识图谱核心节点

| 技术 | 重要性 | 时效性 | 状态 |
|------|--------|--------|------|
| React 19 | 0.95 | 0.9 | 🟢 活跃 |
| Next.js 16 | 0.92 | 0.88 | 🟢 活跃 |
| TypeScript 5.x | 0.88 | 0.85 | 🟢 活跃 |
| NestJS 11.x | 0.85 | 0.82 | 🟢 活跃 |
| PostgreSQL 16 | 0.83 | 0.88 | 🟢 活跃 |
| Vite 6.x | 0.82 | 0.85 | 🟢 活跃 |

### 9.5 教学文档编写清单

- [x] React 19 完全指南 - Server Components、Server Actions、Compiler
- [x] Next.js 16 深度教程 - App Router、Turbopack、缓存策略
- [x] TypeScript 5.x 进阶指南 - 装饰器、高级类型、类型体操
- [x] 状态管理方案对比 - Zustand、Redux Toolkit、Jotai
- [x] 前端工程化工具对比 - Vite、Webpack、Rspack
- [x] 数据库技术深度指南 - PostgreSQL、MongoDB、Redis
- [x] 后端框架对比 - Express、Koa、NestJS
- [x] Next.js SSR原理与架构深度解析 - SSR、Server Components、Turbopack、缓存、流式渲染
- [x] NestJS依赖注入与底层架构深度解析 - DI、装饰器、AOP、模块系统
- [x] Express深入详解 - 中间件、路由、错误处理、安全、测试、部署
- [x] 全栈框架对比与选型指南 - 2026技术栈推荐、选型决策树
- [x] 全栈项目实战案例 - Express电商、Next.js博客、NestJS任务系统
- [x] MDN Web文档整合 - HTML5、CSS3、JavaScript、Web API
- [x] 前端安全知识点 - XSS、CSRF、Clickjacking、CORS、SSRF
- [ ] React Hooks 深入详解
- [ ] CSS3 高级布局实战
- [ ] JavaScript 异步编程完全指南
- [ ] Node.js 核心模块详解
- [ ] RESTful API 设计最佳实践
- [ ] JWT 认证实现详解
- [ ] Docker 容器化部署
- [ ] 性能优化实战

---

## 十、推荐学习资源

| 资源 | 链接 | 说明 |
|------|------|------|
| React官方文档 | https://react.dev/ | React入门指南 |
| Next.js官方文档 | https://nextjs.org/docs | Next.js完整文档 |
| Node.js官方文档 | https://nodejs.org/docs/ | Node.js API |
| MDN Web Docs | https://developer.mozilla.org/ | Web技术权威文档 |
| TypeScript手册 | https://www.typescriptlang.org/docs/ | TypeScript官方文档 |

---

*本文档最后更新于 2026年3月14日*