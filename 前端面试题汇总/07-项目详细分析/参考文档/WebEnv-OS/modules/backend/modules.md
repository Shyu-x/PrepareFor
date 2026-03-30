# 后端服务模块详解

本文档详细说明 webEnvOS 后端（基于 NestJS 11）的核心服务、控制器及其底层逻辑。

## 1. ContainersModule (容器编排)

### 1.1 ContainersService
- **核心依赖**: `Dockerode`。
- **职责**:
    - **生命周期控制**: `startContainer`, `stopContainer`, `deleteContainer`。这些操作直接映射到 Docker Remote API。
    - **状态追踪**: 定期通过 `docker.inspect` 同步容器健康状态（Running, Exited 等）。
    - **部署管理**: (规划中) 管理 Kubernetes 资源定义及副本数。
- **关键逻辑**:
    - 创建容器时，自动配置 `Binds`，将宿主机的 `./workspace/:userId` 目录映射至容器内的 `/home/webenv`。

## 2. TerminalModule (终端中继)

### 2.1 TerminalGateway
- **类型**: `WebSocketGateway` (Socket.io)。
- **事件模型**:
    - `session:start`: 根据 `workspaceId` 查找或初始化容器，并执行 `docker exec -it /bin/bash`。
    - `terminal:input`: 接收前端发送的 Base64 或纯文本字符，写入 `exec.stream`。
    - `terminal:resize`: 动态调整虚拟终端的 `cols` 与 `rows` (TTY Tsize)。
- **并发控制**: 为每个 `socket.id` 绑定一个独立的 `execSessionId`，确保多窗口终端互不干扰。

## 3. WorkspacesModule (工作区元数据)

### 3.1 WorkspacesService
- **核心依赖**: `TypeORM` + `PostgreSQL`。
- **职责**:
    - 持久化存储工作区的配置信息（主题偏好、最后打开的文件、窗口布局）。
    - 维护“系统默认工作区” (ID: `0000...0000`) 的初始结构。
- **数据结构**: `WorkspaceConfig` 接口定义了前端还原桌面环境所需的全部上下文。

## 4. FilesModule (虚拟文件桥接)

### 4.1 FilesService
- **逻辑**: 提供了一层抽象的文件操作 API。
- **双模支持**:
    - **数据库模式**: 文件作为记录存在 `File` 表中，用于协作。
    - **宿主机模式**: 直接操作 Docker 挂载的物理磁盘。
- **文件树构建**: 采用递归算法将扁平的路径记录转换为 JSON 树状结构，优化了前端渲染。

## 5. 通信与安全

### 5.1 API 路由 (Controllers)
- 遵循 RESTful 规范：`GET /api/files`, `POST /api/workspaces` 等。
- **Swagger**: 所有控制器均标注了 `@ApiProperty`，可通过 `/api/docs` 查看实时接口定义。

### 5.2 隔离机制
- 容器启动参数强制限制内存 (`MemoryLimit`) 与 CPU (`NanoCpus`)，防止用户代码耗尽服务器资源。
- 网络层面：工作区容器默认加入内联网桥，不可直接访问宿主机所在的局域网其他设备。
