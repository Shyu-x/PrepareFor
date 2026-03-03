# PrepareFor 前端面试题库系统

> 作者: Shyu

## 项目介绍

这是一个功能完善的前端面试题库系统，采用前后端分离架构设计。系统提供文档管理、内容搜索、主题切换等丰富的功能，帮助前端开发者高效准备技术面试。

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端 | Next.js 16, React 19, Ant Design 5 | - |
| 后端 | NestJS 10 | - |
| 状态管理 | Zustand 5 | - |
| 可视化 | ECharts 5 | - |
| Markdown | marked 15, highlight.js 11 | - |

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- Yarn >= 1.22.0

### 安装依赖

```bash
yarn install
```

### 启动开发服务器

```bash
# 同时启动前端和后端
yarn dev

# 或分别启动
yarn dev:web   # 前端: http://localhost:33980
yarn dev:api   # 后端: http://localhost:42123
```

### 构建生产版本

```bash
yarn build
```

## 项目结构

```
prepare-for/
├── apps/
│   ├── web/          # Next.js 前端应用
│   │   └── src/
│   │       ├── app/            # App Router 页面
│   │       ├── components/      # React 组件
│   │       └── store/          # Zustand 状态管理
│   └── api/           # NestJS 后端服务
│       └── src/
│           ├── app.controller.ts
│           ├── app.service.ts
│           └── app.module.ts
├── docs/              # 系统文档
├── scripts/           # 工具脚本
├── 前端面试题汇总/    # 面试题文档
└── package.json
```

## 功能特性

- 文档目录树展示
- Markdown 内容渲染
- 代码高亮
- 全局搜索
- 目录自动生成 (TOC)
- 暗色/亮色主题切换
- 打印/导出 PDF
- ECharts 数据可视化
- 收藏/书签功能

## 端口说明

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 | 33980 | Next.js 开发服务器 |
| 后端 | 42123 | NestJS API 服务器 |

## 版本信息

当前版本: **1.0.0**

详见 [VERSION.md](VERSION.md)

## 许可证

MIT License - 作者: Shyu
