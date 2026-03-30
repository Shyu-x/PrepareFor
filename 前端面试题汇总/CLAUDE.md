# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个**前端面试题汇总知识库**，包含完整的前端开发面试知识体系文档，涵盖基础、框架、工程化、算法、项目经验等多个维度。

## 项目结构

```
前端面试题汇总/
├── 00-算法与编码/          # LeetCode 解题思路与最优解
├── 07-项目详细分析/        # 项目面试专题（WebEnv-OS、FastDocument、UnoThree）
├── 01-基础核心/           # HTML/CSS、JavaScript、TypeScript、计算机网络、算法
├── 02-框架生态/           # React、Vue、Node.js、WebGL
├── 03-工程实战/           # 前端工程化、构建工具、AI应用
├── 04-大厂专项/           # 拓竹科技、腾讯WXG、蚂蚁集团、迅雷等大厂面经
├── 05-面试技巧与总结/     # 手写代码、简历分析、面试软技能
├── 06-面经专题/           # 真实面经汇总
├── README.md              # 项目导航入口
├── build.js               # 构建脚本（生成静态 HTML）
└── index.html             # 生成的静态网站
```

## 三个源项目技术栈（已验证，2026年3月）

### FastDocument（现代文档协作平台）
- **前端框架**: Next.js 16.1.6, React 19.2.3
- **状态管理**: Zustand 5.0.11
- **样式方案**: Tailwind CSS v4, Ant Design 6.3.0
- **实时协作**: yjs 13.6.29, Socket.io 4.8.3, y-prosemirror, y-websocket, y-indexeddb
- **3D渲染**: Three.js 0.183.1, React Three Fiber 9.5.0
- **后端**: NestJS 11.x, PostgreSQL, Redis (ioredis), TypeORM
- **音视频**: LiveKit 2.17.2
- **测试**: Vitest 4.0.18, Playwright 1.58.2

### UnoThree（3D游戏）
- **前端框架**: Next.js 16.1.6, React 19.2.3
- **状态管理**: Zustand 5.0.11
- **样式方案**: Tailwind CSS v4, Ant Design 6.3.0
- **3D渲染**: Three.js 0.182.0, React Three Fiber 9.5.0, @react-three/drei 10.7.7
- **动画**: Framer Motion 12.x（现改名为 motion）
- **后端**: NestJS 11.x, Socket.io 4.8.3

### WebEnv-OS（类桌面开发环境）
- **前端框架**: Next.js 16.1.6, React 19.2.3
- **状态管理**: Zustand 5.0.11
- **样式方案**: Tailwind CSS v4, Ant Design 6.3.0
- **核心功能**:
  - Monaco Editor（代码编辑器）
  - xterm.js（终端模拟器，注意：新版包名为 @xterm/xterm）
- **后端**: NestJS 11.x, PostgreSQL, Redis, Docker (Dockerode)

## 技术趋势速览（2026年3月）

| 技术 | 版本 | 备注 |
|------|------|------|
| Next.js | 16.x | 16.0已发布，Turbopack作为默认构建工具 |
| React | 19.x | React 20开发中，Compiler 1.0已正式发布 |
| TypeScript | 5.x | 5.9已发布，6.0测试中 |
| Tailwind CSS | v4 | v4.0于2025年1月发布，v4.1最新 |
| Ant Design | 6.x | v6.0于2025年11月发布，v6.3最新 |
| NestJS | 11.x | v11于2025年1月发布 |
| Vite | 6.x | 新域名vite.dev，Environment API |
| Framer Motion | 12.x | 已改名为 motion |
| Three.js | 0.183.x | 当前最新版本 |
| React Three Fiber | 9.x | 当前最新版本 |
| Socket.io | 4.8.x | 当前最新版本 4.8.3 |
| LiveKit | 2.x | 当前最新版本 2.17.x |
| Yjs | 13.x | CRDT实时协作库 |

## 常用命令

### 构建静态网站
```bash
node build.js
```
将所有 Markdown 文档整合生成 `index.html` 静态网站文件。

### 查看文档
直接在浏览器中打开 `index.html` 即可查看面试题库。

## 内容分类

| 分类 | 核心考点 |
|------|----------|
| 核心基础 | 原型链、闭包、事件循环、盒子模型、BFC、Flex/Grid |
| 框架技术 | React Hooks、Vue3 响应式、TypeScript 类型系统 |
| 工程能力 | Webpack、Vite、构建优化、CI/CD |
| 项目经验 | WebEnv-OS、FastDocument、UnoThree 三个项目的深度分析 |
| 大厂专项 | 拓竹(MakerWorld)、腾讯WXG、蚂蚁qiankun、迅雷等 |

## 关键文档

- **BOOK-前端开发面试知识大全.md** - 完整的书籍级整合文档（50万+字）
- **面试专题** - 位于 `07-项目详细分析/` 下的各项目中，包含基于真实项目的深度面试问题

## 工作指南

1. 文档编辑使用 Markdown 格式
2. 代码示例使用中文注释
3. 保持术语统一
4. 按照项目现有目录结构组织内容
