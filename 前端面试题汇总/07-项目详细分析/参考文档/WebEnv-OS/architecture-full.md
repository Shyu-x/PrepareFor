# WebEnv-OS 项目架构详解

> **文档状态**: 2026-02-20 更新
> **项目定位**: 基于 Web 的类桌面开发环境 (Web-based Desktop IDE)

---

## 1. 项目概述

WebEnv-OS (Web Environment Operating System) 是一个运行在浏览器中的类桌面开发环境，模拟传统操作系统的用户体验，同时利用现代 Web 技术提供强大的开发能力。

### 1.1 核心特性

| 特性 | 描述 |
|------|------|
| 桌面环境 | 窗口管理、任务栏、Dock、通知系统 |
| VS Code 风格 IDE | 侧边栏、编辑器、终端面板 |
| 终端模拟器 | 基于 xterm.js + WebGL 高性能渲染 |
| 容器化后端 | 每个工作区运行在独立 Docker 容器中 |
| 实时协作 | 多用户协作编辑 |
| Claude Code 集成 | AI 辅助编程 |

---

## 2. 系统架构总览

### 2.1 整体架构图

```plantuml
@startuml WebEnv-OS Architecture Overview
!theme plain
skinparam componentStyle uml2

skinparam node {
    BackgroundColor #f8f9fa
    BorderColor #343a40
}

skinparam database {
    BackgroundColor #e3f2fd
    BorderColor #1565c0
}

skinparam container {
    BackgroundColor #e8f5e9
    BorderColor #2e7d32
}

package "用户浏览器 (Client)" {
    [WebEnv-OS Frontend\nNext.js 16 + React 19] as Frontend
    [xterm.js Terminal] as Terminal
    [Monaco Editor] as Editor
    [Desktop Components] as Desktop
}

package "Docker Host Environment" {
    [Docker Daemon\n(宿主机)] as DockerDaemon
    database "PostgreSQL\n(15433)" as DB
}

cloud "WebEnv-OS Backend\n(NestJS 1126)" {
    [API Gateway] as APIGateway
    [Terminal Gateway\n(WebSocket)] as TerminalGW
    [Auth Module] as Auth
    [Files Module] as Files
    [Containers Module] as Containers
    [Collaboration Module] as Collab
    [ClaudeCode Module] as ClaudeCode
    [Dockerode Client] as DockerClient
}

node "Docker Container\n(Debian)" {
    [Workspace Container\n/bin/bash] as WorkspaceContainer
    [Workspace Files\n/workspace] as WorkspaceFiles
}

Frontend --> APIGateway : HTTP/REST
Terminal --> TerminalGW : WebSocket
TerminalGW --> DockerClient : Docker API
DockerClient --> DockerDaemon : Unix Socket/npipe
DockerDaemon --> WorkspaceContainer : Create/Exec

APIGateway --> DB : TypeORM
WorkspaceContainer -up-> WorkspaceFiles : Mount

@enduml
```

### 2.2 部署架构图

```plantuml
@startuml Deployment Architecture
!theme plain

skinparam rectangle {
    BackgroundColor #fff3e0
    BorderColor #e65100
}

rectangle "宿主机 (Host Machine)" {
    rectangle "Docker Engine" {
        rectangle "webenv-os 容器" {
            rectangle "Node.js 进程" {
                [前端 (8125)] as Frontend
                [后端 (1126)] as Backend
            }
            [Docker Socket 客户端] as DockerSocket
        }

        database "PostgreSQL 容器\n(15433)" as Postgres
    }

    [Docker Daemon\n/var/run/docker.sock] as DockerDaemon
}

rectangle "工作区容器 (Workspace)" {
    [Debian Container] as Debian
    folder "/workspace" as Workspace
}

Frontend -[dashed]-> Backend : HTTP/WebSocket
Backend -[dashed]-> DockerDaemon : Docker API
DockerSocket .down.> DockerDaemon : 挂载 socket
DockerDaemon .down.> Debian : 管理容器
Debian .down.> Workspace : 挂载目录

@enduml
```

---

## 3. 技术栈详解

### 3.1 前端技术栈 (webenv-os)

```plantuml
@startuml Frontend Technology Stack
!theme plain

component "UI Framework" {
    [Next.js 16.1.6\nApp Router] as NextJS
    [React 19.2.3] as React
}

component "UI Components" {
    [Ant Design 6.3.0] as Antd
    [Tailwind CSS v4] as Tailwind
}

component "State Management" {
    [Zustand 5.0.11] as Zustand
    [SWR 2.3.8] as SWR
}

component "Core Features" {
    [Monaco Editor\n4.7.0] as Monaco
    [@xterm/xterm\n6.0.0] as Xterm
    [Three.js 0.183.x] as ThreeJS
    [@webcontainer/api\n1.6.1] as WebContainer
}

component "Utilities" {
    [Framer Motion] as Framer
    [isomorphic-git] as Git
    [Socket.io Client] as Socket
}

NextJS --> React
React --> Antd
React --> Tailwind
React --> Zustand
Zustand --> SWR
Monaco --> Xterm
ThreeJS --> Framer
WebContainer --> Git
Socket --> Xterm

@enduml
```

### 3.2 后端技术栈 (webenv-backend)

```plantuml
@startuml Backend Technology Stack
!theme plain

component "Framework" {
    [NestJS 11.x] as NestJS
    [TypeScript 5.x] as TS
}

component "Database" {
    [TypeORM 0.3.20] as TypeORM
    [PostgreSQL 15] as Postgres
}

component "Docker Integration" {
    [Dockerode 4.0.4] as Dockerode
}

component "Real-time" {
    [Socket.io] as SocketIO
    [@nestjs/websockets] as NestWS
}

component "Authentication" {
    [Passport JWT] as Passport
    [bcryptjs] as Bcrypt
}

component "API Docs" {
    [@nestjs/swagger] as Swagger
}

NestJS --> TypeORM
TypeORM --> Postgres
NestJS --> Dockerode
NestWS --> SocketIO
NestJS --> Passport
Passport --> Bcrypt
NestJS --> Swagger

@enduml
```

---

## 4. Docker 容器架构

### 4.1 终端服务架构

```plantuml
@startuml Terminal Service Architecture
!theme plain

actor "用户" as User

participant "xterm.js\n(前端终端)" as TerminalFE
participant "TerminalGateway\n(WebSocket)" as TerminalGW
participant "TerminalService\n(业务逻辑)" as TerminalSvc
participant "Dockerode\n(Docker 客户端)" as DockerClient
participant "Docker Daemon" as Dockerd
participant "Workspace Container" as Container

User -> TerminalFE : 输入命令
TerminalFE -> TerminalGW : WebSocket: input data
TerminalGW -> TerminalSvc : handleInput()

TerminalSvc -> DockerClient : exec()

DockerClient -> Dockerd : Docker API\n(exec create/start)

Dockerd -> Container : 创建 Exec
Container -> Container : /bin/bash\n处理命令

Container -> Dockerd : stdout/stderr
Dockerd -> DockerClient : Stream
DockerClient -> TerminalSvc : Stream data

TerminalSvc -> TerminalGW : emit output
TerminalGW -> TerminalFE : WebSocket: output
TerminalFE -> User : 渲染输出

note over Container
  - 镜像: debian:bookworm
  - 工作目录: /workspace
  - 挂载: hostPath -> /workspace
  - 网络: webenv-net-{workspaceId}
end note

@enduml
```

### 4.2 容器生命周期

```plantuml
@startuml Container Lifecycle
!theme plain

state "容器状态" as ContainerState {
    [*] --> Created : createContainer()

    Created --> Running : container.start()
    Running --> Stopped : stop() / timeout(60s)
    Stopped --> Running : start() / new session

    Running --> Executing : exec()
    Executing --> Running : exec end
}

state "会话管理" as SessionState {
    [*] --> NoSession

    NoSession --> Active : openSession()
    Active --> Active : 接收输入
    Active --> Closing : stream.end()
    Closing --> NoSession : closeSession()
}

ContainerState -down-> SessionState : 管理

note right of ContainerState
  生命周期管理:
  1. 按需创建容器
  2. 有会话时保持运行
  3. 无会话 60s 后自动停止
  4. 支持 CPU/内存限制
end note

@enduml
```

---

## 5. 核心模块详解

### 5.1 后端模块结构

```plantuml
@startuml Backend Modules
!theme plain

package "webenv-backend/src" {
    [main.ts] as Main
    [app.module.ts] as AppModule

    package "modules" {
        [auth/] as Auth
        [files/] as Files
        [terminal/] as Terminal
        [containers/] as Containers
        [collaboration/] as Collab
        [claude-code/] as ClaudeCode
        [health/] as Health
    }

    package "database" {
        [database.module.ts] as DBModule
        [*.entity.ts] as Entities
    }

    package "common" {
        [dto/] as DTOs
        [filters/] as Filters
        [middleware/] as Middleware
    }
}

Main --> AppModule
AppModule --> Auth
AppModule --> Files
AppModule --> Terminal
AppModule --> Containers
AppModule --> Collab
AppModule --> ClaudeCode
AppModule --> Health
AppModule --> DBModule
DBModule --> Entities

Terminal --> Containers : 使用

@enduml
```

### 5.2 前端组件结构

```plantuml
@startuml Frontend Components
!theme plain

package "webenv-os/src" {
    [app/] as AppPages
    [apps/] as DesktopApps
    [components/] as Components
    [store/] as Stores
    [lib/] as Libs
    [kernel/] as Kernel
}

package "App Pages" {
    [page.tsx] as Home
    [/desktop/] as Desktop
    [/ide/] as IDE
}

package "Desktop Apps" {
    [terminal/] as TerminalApp
    [file-manager/] as FileManager
    [docker/] as DockerApp
    [claude-code/] as ClaudeApp
    [resource-monitor/] as MonitorApp
}

package "Desktop Components" {
    [Desktop.tsx] as DesktopRoot
    [Window.tsx] as Window
    [WindowManager.tsx] as WM
    [Dock.tsx] as Dock
    [Taskbar.tsx] as Taskbar
}

package "IDE Components" {
    [IDELayout.tsx] as IDELayout
    [Sidebar.tsx] as Sidebar
    [PanelArea.tsx] as Panel
    [ActivityBar.tsx] as ActivityBar
}

AppPages --> DesktopApps
AppPages --> Components
Components --> Stores
Stores --> Libs
Stores --> Kernel

DesktopApps --> DesktopComponents
DesktopApps --> IDEComponents

@enduml
```

---

## 6. 目录结构

### 6.1 项目根目录

```
webEnv/
├── docker/                    # Docker 相关配置
│   ├── nginx.conf            # Nginx 反向代理配置
│   └── nginx-compose.yml     # Nginx 服务编排
├── docker-compose.yml        # 主服务编排
├── Dockerfile                # 应用镜像定义
├── scripts/                  # 启动脚本
│   ├── start.sh              # 容器内启动脚本
│   ├── verify.sh             # 验证脚本
│   └── docker-start.ps1      # PowerShell 启动脚本
├── docs/                     # 项目文档
├── webenv-backend/           # NestJS 后端
└── webenv-os/                # Next.js 前端
```

### 6.2 后端目录结构

```
webenv-backend/
├── src/
│   ├── main.ts              # 应用入口
│   ├── app.module.ts        # 根模块
│   ├── app.controller.ts    # 根控制器
│   ├── app.service.ts       # 根服务
│   ├── common/              # 公共模块
│   │   ├── dto/            # 数据传输对象
│   │   ├── filters/        # 异常过滤器
│   │   └── middleware/     # 中间件
│   ├── database/           # 数据库模块
│   │   ├── database.module.ts
│   │   └── *.entity.ts     # 实体定义
│   └── modules/            # 功能模块
│       ├── auth/           # 认证模块
│       ├── files/          # 文件模块
│       ├── terminal/       # 终端模块 (Docker 集成)
│       ├── containers/     # 容器管理模块
│       ├── collaboration/  # 实时协作模块
│       ├── claude-code/    # Claude Code 集成
│       └── health/         # 健康检查模块
├── package.json
└── tsconfig.json
```

### 6.3 前端目录结构

```
webenv-os/
├── src/
│   ├── app/                 # Next.js 页面
│   │   ├── page.tsx         # 首页
│   │   ├── desktop/         # 桌面环境页面
│   │   └── ide/             # IDE 页面
│   ├── apps/                # 桌面应用程序
│   │   ├── terminal/        # 终端应用
│   │   ├── file-manager/    # 文件管理器
│   │   ├── docker/          # Docker 管理器
│   │   ├── claude-code/     # Claude Code 对话
│   │   └── resource-monitor/# 资源监控
│   ├── components/          # React 组件
│   │   ├── desktop/         # 桌面组件
│   │   ├── ide/             # IDE 组件
│   │   ├── ui/              # 基础 UI 组件
│   │   └── ...              # 其他组件
│   ├── store/               # Zustand 状态管理
│   ├── kernel/              # 内核模块
│   ├── lib/                 # 工具库
│   └── types/               # TypeScript 类型
├── public/                  # 静态资源
│   └── icons/              # SVG 图标
└── package.json
```

---

## 7. API 端口映射

| 服务 | 端口 | 协议 | 说明 |
|------|------|------|------|
| 前端 | 8125 | HTTP | Next.js 开发/生产服务器 |
| 后端 | 1126 | HTTP/WebSocket | NestJS API 服务 |
| 数据库 | 15433 | PostgreSQL | 外部访问端口 |
| Nginx | 80 | HTTP | 反向代理 (可选) |

---

## 8. 关键设计决策

### 8.1 前后端分离但同容器部署

```plantuml
@startuml Deployment Decision
!theme plain

node "Docker Container (Debian)" {
    [Node.js\n前端 + 后端] as NodeApps
}

NodeApps -left-> [Docker Daemon] : Docker API

note right of NodeApps
  优势:
  1. 简化部署流程
  2. 减少服务间网络延迟
  3. 统一环境管理
  4. 便于水平扩展
end note

@enduml
```

### 8.2 Docker in Docker

容器内通过挂载宿主机的 Docker Socket 实现容器管理：

```yaml
# docker-compose.yml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
```

### 8.3 工作区隔离策略

每个工作区拥有：
- 独立的 Docker 容器
- 独立的 Docker 网络 (`webenv-net-{workspaceId}`)
- 挂载的工作区目录 (`/workspace`)

---

## 9. 数据流详解

### 9.1 终端命令执行流程

```plantuml
@startuml Terminal Command Flow
!theme plain

actor User

participant "TerminalApp.tsx\n(xterm.js)" as Terminal
participant "terminal.gateway.ts\n(WebSocket)" as Gateway
participant "terminal.service.ts" as Service
participant "Dockerode" as Dockerode
participant "Docker Container\n(debian)" as Container

User -> Terminal : 输入命令
Terminal -> Gateway : socket.emit('input', data)

Gateway -> Service : handleInput()

Service -> Dockerode : container.exec()
Dockerode -> Container : 创建 Exec 进程

Container -> Dockerode : stdout/stderr Stream
Dockerode -> Service : Stream data

Service -> Gateway : emit('output', data)
Gateway -> Terminal : socket.on('output')

Terminal -> User : 渲染文本

note over Terminal
  WebGL 渲染优化:
  - 自动检测并使用 WebGL
  - 降级到 DOM 渲染
  - 支持硬件加速
end note

@enduml
```

### 9.2 文件操作流程

```plantuml
@startuml File Operation Flow
!theme plain

actor User

participant "FileManagerApp.tsx" as FileMgr
participant "FilesController" as FilesCtrl
participant "FilesService" as FilesSvc
participant "TypeORM" as TypeORM
participant "PostgreSQL" as DB

User -> FileMgr : 打开文件
FileMgr -> FilesCtrl : GET /api/files/:path
FilesCtrl -> FilesSvc : getFile()

FilesSvc -> TypeORM : Query
TypeORM -> DB : SELECT

DB --> TypeORM : File data
TypeORM --> FilesSvc : File entity
FilesSvc --> FilesCtrl : File data
FilesCtrl --> FileMgr : Response

FileMgr -> User : 显示文件

@enduml
```

---

## 10. 依赖版本汇总

### 10.1 前端依赖

| 包名 | 版本 | 用途 |
|------|------|------|
| next | 16.1.4 | Web 框架 |
| react | 19.2.3 | UI 库 |
| antd | 6.2.1 | 组件库 |
| tailwindcss | 4 | 样式 |
| zustand | 5.0.10 | 状态管理 |
| @monaco-editor/react | 4.7.0 | 代码编辑 |
| @xterm/xterm | 6.0.0 | 终端 |
| @xterm/addon-webgl | 0.19.0 | WebGL 渲染 |
| three | 0.160.1 | 3D 渲染 |
| @webcontainer/api | 1.6.1 | 浏览器沙箱 |

### 10.2 后端依赖

| 包名 | 版本 | 用途 |
|------|------|------|
| @nestjs/core | 11.x | Web 框架 |
| @nestjs/typeorm | 11.x | ORM |
| typeorm | 0.3.20 | 数据库 ORM |
| pg | 8.13.1 | PostgreSQL 驱动 |
| dockerode | 4.0.4 | Docker 客户端 |
| @nestjs/websockets | 11.x | WebSocket |
| @nestjs/jwt | 11.x | JWT 认证 |
| passport-jwt | 4.0.1 | JWT 策略 |

---

## 11. 附录

### 11.1 环境变量

```bash
# 后端环境变量
NODE_ENV=production
PORT=1126
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=webenvos
DB_PASSWORD=webenvos
DB_DATABASE=webenvos
DOCKERIZED=true
DOCKER_HOST=unix:///var/run/docker.sock
DOCKER_DEFAULT_IMAGE=debian:bookworm
WORKSPACES_ROOT=/app/data/workspaces
```

### 11.2 启动脚本逻辑

```bash
# start.sh 核心逻辑
1. 设置环境变量 (NODE_ENV, TZ, DOCKERIZED)
2. 创建日志目录 /app/logs
3. 后台启动后端 (npm run start:prod)
4. 前端使用 Turbopack 启动 (NEXT_USE_WEBPACK=0)
5. 循环检查进程状态，异常退出时记录日志
```

---

## 12. 文档修订记录

| 日期 | 版本 | 变更内容 |
|------|------|----------|
| 2026-02-20 | 1.0 | 初始版本，完整架构分析 |
