# WebEnv-OS 架构文档

## 文档概述

本文档详细描述了 WebEnv-OS 项目的技术架构，从前端到后端、从桌面环境到 Docker 部署，全面展示系统的设计原理和实现细节。

## 文档结构

```
docs/architecture/
├── SPECIFICATION.md          # 文档规范
├── README.md                 # 本索引文件
│
├── frontend/                 # 前端架构
│   └── README.md            # React + Next.js 核心架构
│
├── components/              # 组件文档
│   └── IDE-CORE-COMPONENTS.md  # IDE 核心组件分析
│
├── backend/                 # 后端架构
│   └── README.md           # NestJS + TypeORM 架构
│
├── desktop/                 # 桌面环境
│   └── DESKTOP-COMPONENTS.md  # 桌面组件分析
│
└── docker/                  # Docker 部署
    └── DEPLOYMENT.md        # 容器化部署架构
```

## 快速导航

### 前端架构
- **技术栈**: Next.js 16, React 18, TypeScript, Zustand, Ant Design, Tailwind CSS 4
- **核心组件**: CodeEditor (Monaco), Terminal (xterm.js), Sidebar, PanelArea
- **文档位置**: `frontend/README.md`

### 后端架构
- **技术栈**: NestJS, TypeORM, PostgreSQL, Socket.IO
- **核心模块**: Terminal, Workspaces, Containers, Collaboration, Auth
- **文档位置**: `backend/README.md`

### 桌面环境
- **核心组件**: Window, WindowManager, Dock, Taskbar
- **桌面应用**: 文件管理器, 终端, 计算器, 时钟, Docker管理
- **文档位置**: `desktop/DESKTOP-COMPONENTS.md`

### Docker 部署
- **镜像**: Next.js 前端, NestJS 后端, Debian 开发环境
- **编排**: docker-compose 开发/生产环境
- **文档位置**: `docker/DEPLOYMENT.md`

## 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        客户端 (Browser)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  IDE     │  │ 桌面环境  │  │ 终端    │  │ 协作    │    │
│  │  (Monaco)│  │ (Window)  │  │(xterm.js)│  │(Socket.IO│    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │             │             │             │             │
│       └─────────────┴─────────────┴─────────────┘             │
│                         │                                      │
│                    Zustand Store                               │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTP / WebSocket
┌─────────────────────────┴───────────────────────────────────────┐
│                      Nginx 反向代理                              │
│                    (端口: 11451 / 18888)                         │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────────┐
│                     NestJS 后端                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Terminal │  │Workspace │  │ Container│  │Collabora.│    │
│  │ Gateway │  │ Service  │  │ Service  │  │ Gateway  │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │             │             │             │             │
│       └─────────────┴─────────────┴─────────────┘             │
│                         │                                      │
│              ┌──────────┴──────────┐                          │
│              │    PostgreSQL       │                          │
│              │    (端口: 15433)    │                          │
│              └─────────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────────┐
│                   Docker 容器池 (DinD)                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │Workspace │  │Workspace │  │Workspace │  │Workspace │    │
│  │  Node.js │  │  Python  │  │    Go    │  │   Java   │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## 核心特性

| 特性 | 实现技术 | 文档位置 |
|------|----------|----------|
| 代码编辑 | Monaco Editor + LSP | frontend/README.md |
| 终端模拟 | xterm.js + WebSocket | components/IDE-CORE-COMPONENTS.md |
| 多人协作 | Socket.IO + Yjs | backend/README.md |
| 容器管理 | Docker API + NestJS | docker/DEPLOYMENT.md |
| 状态管理 | Zustand | frontend/README.md |
| 主题系统 | CSS Variables | desktop/DESKTOP-COMPONENTS.md |

## 开发指南

### 添加新组件
1. 在对应模块目录创建组件文件
2. 使用 React + TypeScript 编写
3. 遵循组件命名规范
4. 添加组件文档

### 添加新 API
1. 在对应模块创建 Controller
2. 定义 DTO 和 Entity
3. 添加 Swagger 文档注释
4. 更新本文档

## 参与贡献

- 遵循本文档的规范
- 使用 STAR 法则描述功能
- 添加清晰的架构图
- 确保文档与代码同步更新

---

**最后更新**: 2026-03-08
**维护人**: Shyu-x
**版本**: 1.0.0
