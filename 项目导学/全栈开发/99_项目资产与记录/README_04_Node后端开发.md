# 全栈开发教学系统

> 为准备面试大厂前端/全栈岗位的学生提供系统化的学习资料

## 📚 项目概述

这是一个**Web前端开发教学系统**，包含React + Node.js全栈开发学习路线文档。

**文档类型**：纯文档项目（Markdown格式），无需构建、测试、打包等操作

**核心目标**：为准备面试大厂前端/全栈岗位的学生提供系统化的学习资料

## 📖 目录结构

```
全栈开发/
├── 00_全局指南/           # 全局指南和学习路线
├── 01_前端底层与基础/     # 前端底层原理和基础
├── 01_Node.js核心模块/    # Node.js基础与核心模块
├── 02_前端框架与工程化/   # 前端框架和工程化
├── 02_Express_Koa框架/    # Express、Koa、NestJS框架
├── 03_后端架构与Nodejs引擎/ # 后端架构和Node.js引擎
├── 03_数据库/            # MongoDB、PostgreSQL、Redis
├── 04_全栈框架与服务端渲染/ # 全栈框架和SSR
├── 04_API设计与认证/     # RESTful API与JWT认证
├── 05_后端工程化与部署运维/ # 异常处理与日志
├── 05_数据库引擎与原理/   # 数据库引擎原理
├── 06_数据结构与算法/     # 基础数据结构与算法
├── React核心/            # React技术栈
├── TypeScript模块/        # TypeScript学习
├── 前端工程化/            # 构建工具
├── 性能优化/             # 加载性能优化
├── 前沿技术/             # 前沿技术探索
├── Docker容器化部署.md    # Docker容器化部署
├── README_OUTLINE.md      # 知识库大纲
├── generate-outline.js    # 大纲生成脚本
├── QWEN.md               # Qwen Code项目指导
├── CLAUDE.md             # Claude项目指导
├── GEMINI.md             # Gemini项目指导
└── outline_20260314.md   # 2026年3月大纲
```

## 🚀 快速开始

### 1. 了解整体学习路线

查看 [00_全局指南/01_学习路线概览.md](./00_全局指南/01_学习路线概览.md) 了解整体学习路径规划。

### 2. 学习前端基础

查看 [01_前端底层与基础/](./01_前端底层与基础/) 目录下的文档，学习HTML5、CSS3、JavaScript核心知识。

### 3. 学习React

查看 [React核心/](./React核心/) 目录下的文档，学习React基础、Hooks、状态管理、高级特性。

### 4. 学习TypeScript

查看 [TypeScript模块/](./TypeScript模块/) 目录下的文档，学习TypeScript基础与进阶。

### 5. 学习后端

查看 [01_Node.js核心模块/](./01_Node.js核心模块/)、[02_Express_Koa框架/](./02_Express_Koa框架/) 目录下的文档。

### 6. 学习数据库

查看 [03_数据库/](./03_数据库/) 目录下的文档，学习MongoDB、PostgreSQL、Redis。

### 7. 学习工程化

查看 [前端工程化/](./前端工程化/)、[05_后端工程化与部署运维/](./05_后端工程化与部署运维/) 目录下的文档。

## 📊 知识库大纲

完整的知识库大纲请查看 [README_OUTLINE.md](./README_OUTLINE.md)

### 统计信息

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

## 📚 技术栈版本参考

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

## 🎯 学习路径建议

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

## 📖 文档规范

### 语言规范

**全程只允许使用中文**，包括：

1. **中文文件名** - 所有Markdown文件使用中文命名
2. **中文目录名** - 所有目录名称使用中文
3. **中文内容** - 文档内容必须使用中文编写
4. **中文注释** - 代码示例中的注释必须使用中文

### 文档结构

每个技术文档必须包含：

1. **概述** - 技术的定义和用途
2. **核心概念** - 关键技术点解析
3. **代码示例** - 完整可运行的代码（带中文注释）
4. **实战练习** - 巩固知识的练习题

### 代码示例规范

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

## 📚 推荐学习资源

| 资源 | 链接 | 说明 |
|------|------|------|
| React官方文档 | https://react.dev/ | React入门指南 |
| Next.js官方文档 | https://nextjs.org/docs | Next.js完整文档 |
| Node.js官方文档 | https://nodejs.org/docs/ | Node.js API |
| MDN Web Docs | https://developer.mozilla.org/ | Web技术权威文档 |
| TypeScript手册 | https://www.typescriptlang.org/docs/ | TypeScript官方文档 |

## 📝 更新日志

### 2026-03-14

- ✅ 创建React 19相关文档
- ✅ 创建简化版树形结构规划
- ✅ 创建简化版迁移脚本
- ✅ 创建大纲生成脚本
- ✅ 生成完整知识库大纲
- ✅ 创建README_OUTLINE.md

### 2026-03-13

- ✅ 创建React 19完全指南
- ✅ 创建React Hooks深入详解
- ✅ 创建组件设计模式深度指南
- ✅ 创建React 19.2官方参考文档

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

### 开发流程

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📞 联系方式

如有问题，请联系项目维护者。

## 📄 许可证

MIT License

---

*本文档由 Qwen Code 维护，最后更新于 2026年3月14日*
