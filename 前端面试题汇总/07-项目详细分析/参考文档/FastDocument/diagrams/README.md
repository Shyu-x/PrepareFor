# FastDocument 架构图索引

本目录包含 FastDocument 项目的系统架构文档，包括 PlantUML 图表和 ASCII 图表。

## 文件列表

### 1. 系统整体架构图

| 文件 | 说明 |
|------|------|
| `system-architecture.puml` | PlantUML 格式的系统整体架构图 |
| `system-architecture.ascii` | ASCII 格式的系统整体架构图 |

### 2. 前端架构图

| 文件 | 说明 |
|------|------|
| `frontend-architecture.puml` | PlantUML 格式的前端架构图 |
| `frontend-architecture.ascii` | ASCII 格式的前端架构图 |

### 3. 后端架构图

| 文件 | 说明 |
|------|------|
| `backend-architecture.puml` | PlantUML 格式的后端架构图 |
| `backend-architecture.ascii` | ASCII 格式的后端架构图 |

### 4. 部署架构图

| 文件 | 说明 |
|------|------|
| `deployment-architecture.puml` | PlantUML 格式的部署架构图 |
| `deployment-architecture.ascii` | ASCII 格式的部署架构图 |

## 查看图表

### PlantUML 图表

可以使用以下工具查看 PlantUML 图表：

1. **VS Code 插件**: 安装 `PlantUML` 扩展
2. **在线查看**: 访问 [PlantUML Online Server](https://www.plantuml.com/plantuml/)
3. **本地渲染**: 使用 `plantuml` 命令行工具

### ASCII 图表

ASCII 图表可以直接在文本编辑器中查看，也可以使用：

- VS Code 的 `ASCII Table` 插件
- 在线工具如 [ASCIIFlow](https://asciiflow.com/)

## 图表内容概述

### 系统整体架构

展示从用户浏览器到后端服务再到数据库的整体数据流：

- 前端层: Next.js 16, React 19, Tailwind CSS, Ant Design, Zustand
- API 网关层: Nginx 反向代理, Socket.io WebSocket
- 业务服务层: NestJS 后端各模块
- 数据层: PostgreSQL, Redis, LiveKit
- 基础设施层: Docker, PM2

### 前端架构

展示 Next.js 应用的结构：

- App Router 页面结构
- React 组件层级
- Zustand 状态管理
- 第三方库依赖

### 后端架构

展示 NestJS 后端的模块化设计：

- NestJS 核心模块
- 各业务模块 (Documents, Comments, Projects, Knowledge, Meetings, Auth, Share, Notifications)
- Common 公共模块
- 数据库实体关系

### 部署架构

展示 Docker 容器化部署：

- Docker 网络拓扑
- 服务通信流程
- 负载均衡策略
- 存储卷配置

## 更新日志

- 2026-03-08: 初始创建架构文档
