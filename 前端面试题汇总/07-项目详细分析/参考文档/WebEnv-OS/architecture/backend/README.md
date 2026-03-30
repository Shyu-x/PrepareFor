# WebEnv-OS 后端架构文档

## 概述

本文档详细描述了 WebEnv-OS 后端系统的架构设计，该系统基于 NestJS 框架构建，提供完整的 Web IDE 后端服务，包括终端管理、工作区管理、Docker 容器控制、实时协作等功能。

---

## 1. NestJS 核心架构

### 1.1 模块结构

WebEnv-OS 后端采用典型的 NestJS 模块化架构，所有功能模块都注册在主模块 `AppModule` 中。

```
AppModule (应用根模块)
├── ConfigModule (配置模块 - 全局)
├── DatabaseModule (数据库模块)
│   └── TypeORM (PostgreSQL)
├── AuthModule (认证模块)
│   ├── AuthService
│   ├── AuthController
│   └── JwtStrategy
├── FilesModule (文件管理模块)
│   ├── FilesService
│   ├── FileSyncService
│   ├── FileWatcherService
│   └── FilesController
├── WorkspacesModule (工作区管理模块)
│   ├── WorkspacesService
│   ├── WorkspacesController
│   └── Workspace Entity
├── CollaborationModule (协作模块)
│   ├── CollaborationService
│   ├── CollaborationGateway (WebSocket)
│   └── CollaborationController
├── ContainersModule (容器管理模块)
│   ├── ContainersService
│   └── ContainersController
├── TerminalModule (终端模块)
│   ├── TerminalService
│   ├── TerminalGateway (WebSocket)
│   ├── ClaudeGateway (WebSocket)
│   └── TerminalController
├── ClaudeCodeModule (Claude Code 集成模块)
├── SystemModule (系统监控模块)
├── HealthModule (健康检查模块)
├── GitModule (Git 版本控制模块)
├── ProxyModule (代理模块)
├── DocumentsModule (文档模块)
├── LspModule (语言服务器协议模块)
├── DevServerModule (开发服务器模块)
└── SshModule (SSH/SFTP 模块)
```

### 1.2 依赖注入

NestJS 的依赖注入容器是整个框架的核心，后端充分利用了这一特性。每个模块都通过构造函数注入依赖的服务：

```typescript
// 典型依赖注入示例
constructor(
  private readonly terminalService: TerminalService,
  private readonly fileWatcherService: FileWatcherService,
) { }
```

**关键依赖关系：**

- `TerminalModule` 依赖 `FilesModule` - 终端需要文件系统支持
- `WorkspacesModule` 依赖 `Workspace` 实体 - 工作区数据持久化
- `FilesModule` 依赖 `Workspace` 实体 - 文件与工作区关联
- 所有需要认证的模块依赖 `AuthModule`

### 1.3 中间件

系统实现了以下中间件：

#### 日志中间件 (LoggingMiddleware)

位于 `src/common/logging.middleware.ts`，实现请求日志记录功能：

```typescript
@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  use = (request: Request, response: Response, next: NextFunction): void => {
    const { method, originalUrl, ip } = request;
    const userAgent = request.get('User-Agent') || '';
    const startTime = Date.now();

    response.on('finish', () => {
      const { statusCode } = response;
      const contentLength = response.get('Content-Length') || '0';
      const duration = Date.now() - startTime;

      logger.log(
        `${method} ${originalUrl} ${statusCode} ${contentLength} - ${userAgent} ${ip} - ${duration}ms`,
      );
    });

    next();
  };
}
```

**功能特性：**
- 记录 HTTP 方法、URL、状态码
- 记录响应时间
- 记录客户端 IP 和 User-Agent
- 记录响应内容大小

#### 代理中间件 (ProxyMiddleware)

位于 `src/modules/proxy/proxy.middleware.ts`，用于处理开发服务器的代理请求。

### 1.4 异常过滤器

全局异常过滤器 `GlobalExceptionFilter` 位于 `src/common/global-exception.filter.ts`：

```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    // 处理 HttpException
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      // 提取错误消息
    }
    // 处理普通 Error
    else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    // 记录错误日志
    this.logger.error(`HTTP ${status} Error: ${message}`, logData);

    // 返回标准化错误响应
    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

**功能特性：**
- 统一处理所有异常类型
- 标准化错误响应格式
- 详细错误日志记录
- 包含请求上下文信息

---

## 2. 核心模块详解

### 2.1 Terminal 模块（终端管理）

Terminal 模块是后端最核心的模块之一，负责管理 Docker 容器中的终端会话。

#### 模块结构

```
TerminalModule
├── TerminalService (核心服务)
├── TerminalGateway (WebSocket 网关)
├── ClaudeGateway (Claude Code 集成)
└── TerminalController (REST API)
```

#### 核心功能

**1. 容器生命周期管理**

| 方法 | 描述 |
|------|------|
| `ensureWorkspaceContainer()` | 创建或获取工作区容器 |
| `startWorkspace()` | 启动工作区容器 |
| `stopWorkspace()` | 停止工作区容器 |
| `switchWorkspaceImage()` | 切换容器镜像 |

**2. 终端会话管理**

| 方法 | 描述 |
|------|------|
| `openSession()` | 创建新的终端会话 |
| `openContainerSession()` | 连接到现有容器 |
| `resizeSession()` | 调整终端尺寸 |
| `writeToSession()` | 写入数据到终端 |
| `closeSession()` | 关闭终端会话 |

**3. 容器操作**

| 方法 | 描述 |
|------|------|
| `runAction()` | 在容器中执行命令 |
| `getStatus()` | 获取容器状态和资源使用 |
| `getLogs()` | 获取容器日志 |
| `getContainerPorts()` | 获取容器监听的端口 |

#### 开发环境模板

系统预置了 8 种开发环境模板：

```typescript
export const DEV_ENVIRONMENTS = {
  node: { image: 'node:20-bookworm', ports: [3000, 3001, 8080] },
  python: { image: 'python:3.12-bookworm', ports: [8000, 5000, 8888] },
  rust: { image: 'rust:1.75-bookworm', ports: [8000, 8080] },
  go: { image: 'golang:1.21-bookworm', ports: [8080, 3000] },
  java: { image: 'eclipse-temurin:21-jdk-bookworm', ports: [8080, 9090] },
  cpp: { image: 'gcc:13-bookworm', ports: [8080] },
  web: { image: 'node:20-bookworm', ports: [3000, 5173, 8080] },
  general: { image: 'debian:bookworm', ports: [8080] },
};
```

#### WebSocket 事件

TerminalGateway 暴露以下 WebSocket 事件：

| 事件 | 方向 | 描述 |
|------|------|------|
| `session:start` | 客户端 → 服务器 | 启动终端会话 |
| `session:ready` | 服务器 → 客户端 | 会话就绪 |
| `terminal:input` | 客户端 → 服务器 | 终端输入 |
| `terminal:output` | 服务器 → 客户端 | 终端输出 |
| `terminal:resize` | 客户端 → 服务器 | 调整终端尺寸 |
| `session:close` | 客户端 → 服务器 | 关闭会话 |
| `file:changed` | 服务器 → 客户端 | 文件变更通知 |

#### STAR 法则描述

** Situation (情境) **
WebEnv-OS 需要为用户提供基于 Web 的开发环境，用户需要在浏览器中运行终端命令，与 Docker 容器进行交互。

** Task (任务) **
构建一个支持多用户、多工作区的终端管理系统，实现终端会话的创建、管理、实时通信功能。

** Action (行动) **
- 设计基于 Dockerode 的容器管理服务
- 实现 WebSocket 实时终端通信
- 使用 Docker exec 创建交互式 shell 会话
- 实现终端会话的自动清理和资源回收

** Result (结果) **
- 用户可以通过 WebSocket 实时连接到 Docker 容器
- 支持终端尺寸调整、多会话管理
- 60 秒无活动自动停止容器以释放资源
- 支持 8 种预置开发环境一键启动

---

### 2.2 Workspaces 模块（工作区管理）

Workspaces 模块负责管理工作区配置，包括工作区的创建、修改、删除、导入导出等功能。

#### 模块结构

```
WorkspacesModule
├── WorkspacesService
└── WorkspacesController
```

#### 实体定义

```typescript
@Entity('workspaces')
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ length: 50, default: 'windows' })
  theme!: string;

  @Column({ type: 'json', nullable: true })
  windows!: WindowConfig[] | null;

  @Column({ type: 'json', nullable: true })
  fileTree!: any[] | null;

  @Column({ type: 'simple-array', nullable: true })
  openFiles!: string[] | null;

  @Column({ type: 'json' })
  settings!: WorkspaceSettings;

  @Column({ length: 255, default: 'debian:bookworm' })
  dockerImage!: string;

  @Column({ length: 50, default: 'general' })
  environmentType!: string;

  @OneToMany(() => File, (file: File) => file.workspace, { cascade: true })
  files!: File[];
}
```

#### API 端点

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/workspaces` | 获取所有工作区 |
| GET | `/api/workspaces/stats` | 获取工作区统计 |
| GET | `/api/workspaces/:id` | 获取工作区详情 |
| POST | `/api/workspaces` | 创建工作区 |
| PUT | `/api/workspaces/:id` | 更新工作区 |
| DELETE | `/api/workspaces/:id` | 删除工作区 |
| GET | `/api/workspaces/:id/export` | 导出工作区 |
| POST | `/api/workspaces/import` | 导入工作区 |
| POST | `/api/workspaces/:id/duplicate` | 复制工作区 |

---

### 2.3 Containers 模块（Docker 容器）

Containers 模块提供 Docker 容器、镜像、网络、卷的完整管理功能。

#### 模块结构

```
ContainersModule
├── ContainersService
└── ContainersController
```

#### 核心功能

**1. 镜像管理**

| 方法 | 描述 |
|------|------|
| `searchImages()` | 搜索 Docker 镜像 |
| `pullImage()` | 拉取镜像 |
| `getImages()` | 获取镜像列表 |
| `deleteImage()` | 删除镜像 |

**2. 容器管理**

| 方法 | 描述 |
|------|------|
| `getContainers()` | 获取所有容器 |
| `getContainer()` | 获取容器详情 |
| `createDevEnvironment()` | 创建开发环境容器 |
| `startContainer()` | 启动容器 |
| `stopContainer()` | 停止容器 |
| `deleteContainer()` | 删除容器 |
| `getLogs()` | 获取容器日志 |
| `execInContainer()` | 在容器中执行命令 |

**3. 网络管理**

| 方法 | 描述 |
|------|------|
| `getNetworks()` | 获取网络列表 |
| `deleteNetwork()` | 删除网络 |

**4. 卷管理**

| 方法 | 描述 |
|------|------|
| `getVolumes()` | 获取卷列表 |
| `deleteVolume()` | 删除卷 |

---

### 2.4 Collaboration 模块（实时协作）

Collaboration 模块实现多用户实时协作编辑功能，基于 Socket.IO 构建。

#### 模块结构

```
CollaborationModule
├── CollaborationService
├── CollaborationGateway (WebSocket)
└── CollaborationController
```

#### WebSocket 事件

| 事件 | 方向 | 描述 |
|------|------|------|
| `joinRoom` | 客户端 → 服务器 | 加入协作房间 |
| `leaveRoom` | 客户端 → 服务器 | 离开协作房间 |
| `cursor` | 客户端 ↔ 服务器 | 光标位置同步 |
| `selection` | 客户端 ↔ 服务器 | 选区同步 |
| `edit` | 客户端 ↔ 服务器 | 编辑操作同步 |
| `fileChange` | 客户端 ↔ 服务器 | 文件变更通知 |
| `createRoom` | 客户端 → 服务器 | 创建协作房间 |
| `getRoomList` | 客户端 → 服务器 | 获取房间列表 |

#### 协作者数据结构

```typescript
export interface Collaborator {
  id: string;
  name: string;
  color: string;           // 用户颜色标识
  status: 'online' | 'offline' | 'away';
  lastSeen: string;
  cursor?: {              // 光标位置
    x: number;
    y: number;
    line: number;
    column: number;
  };
  selection?: {          // 选区
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}
```

---

### 2.5 Auth 模块（认证授权）

Auth 模块提供基于 JWT 的用户认证功能。

#### 模块结构

```
AuthModule
├── AuthService
├── AuthController
├── JwtStrategy
├── PassportModule
└── JwtModule
```

#### 认证流程

```
1. 用户提交用户名密码
2. AuthService.validateUser() 验证凭证
3. 生成 JWT Token (有效期 24 小时)
4. 后续请求通过 JwtStrategy 验证 Token
```

#### 预置用户

系统默认创建以下测试用户：

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | admin |
| user | user123 | user |
| xu | 123456 | admin |

#### API 端点

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/register` | 用户注册 |
| GET | `/api/auth/profile` | 获取用户信息 |
| POST | `/api/auth/profile` | 更新用户信息 |

---

## 3. API 设计

### 3.1 RESTful API 规范

系统采用 RESTful API 设计风格，所有 API 统一使用 `/api` 前缀：

```
http://localhost:1126/api/
```

#### 主要 API 分组

| 前缀 | 模块 | 功能 |
|------|------|------|
| `/api/auth` | 认证 | 登录、注册、个人信息 |
| `/api/workspaces` | 工作区 | CRUD、导入导出 |
| `/api/files` | 文件 | 文件树、内容、操作 |
| `/api/terminal` | 终端 | 容器管理、命令执行 |
| `/api/containers` | 容器 | Docker 资源管理 |
| `/api/collaboration` | 协作 | 房间管理 |
| `/api/health` | 健康 | 服务状态检查 |
| `/api/git` | Git | 版本控制操作 |
| `/api/system` | 系统 | 资源监控 |
| `/api/documents` | 文档 | 文档服务 |
| `/api/lsp` | LSP | 语言服务器 |
| `/api/dev-server` | 开发服务器 | 开发服务器管理 |
| `/api/proxy` | 代理 | 请求代理 |

### 3.2 Swagger 文档

系统集成了 Swagger UI，可通过以下地址访问：

```
http://localhost:1126/api/docs
```

#### Swagger 配置

```typescript
const config = new DocumentBuilder()
  .setTitle('webEnvOS API')
  .setDescription('Web-based Development Environment API')
  .setVersion('1.0')
  .addBearerAuth()
  .build();
```

### 3.3 WebSocket 网关

系统实现了多个 WebSocket 网关：

| 网关 | 命名空间 | 功能 |
|------|----------|------|
| TerminalGateway | `/terminal` | 终端会话管理 |
| CollaborationGateway | `/collaboration` | 实时协作 |
| ClaudeGateway | - | Claude Code 集成 |
| LspGateway | - | 语言服务器通信 |
| SshGateway | - | SSH 会话管理 |

### 3.4 数据传输对象 (DTO)

#### Workspace DTO

```typescript
export class CreateWorkspaceDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsString()
  environmentType?: string;

  @IsOptional()
  @IsString()
  dockerImage?: string;
}

export class UpdateWorkspaceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  windows?: WindowConfig[];

  @IsOptional()
  @IsArray()
  fileTree?: any[];

  @IsOptional()
  @IsArray()
  openFiles?: string[];

  @IsOptional()
  @IsObject()
  settings?: WorkspaceSettings;
}
```

#### Terminal DTO

```typescript
class ActionRequestDto {
  @IsString()
  @IsIn(['run', 'build', 'debug', 'custom'])
  action!: string;

  @IsString()
  @IsOptional()
  command?: string;
}

class WorkspaceOptionsDto {
  @IsString()
  @IsOptional()
  image?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  cpuShares?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  memoryMb?: number;
}
```

---

## 4. 数据库设计

### 4.1 技术栈

- **数据库**: PostgreSQL
- **ORM**: TypeORM
- **连接配置**:
  - 主机: localhost
  - 端口: 15433
  - 数据库名: webenvos
  - 用户名: webenvos

### 4.2 实体关系图

```
┌─────────────────────────────────────────────────────────────────────┐
│                           workspaces                                  │
├─────────────────────────────────────────────────────────────────────┤
│  id (UUID, PK)                                                      │
│  name (VARCHAR)                                                     │
│  description (TEXT)                                                 │
│  theme (VARCHAR)                                                    │
│  windows (JSON)                                                     │
│  fileTree (JSON)                                                    │
│  openFiles (SIMPLE_ARRAY)                                           │
│  settings (JSON)                                                    │
│  dockerImage (VARCHAR)                                              │
│  environmentType (VARCHAR)                                           │
│  createdBy (VARCHAR)                                                │
│  createdAt (TIMESTAMP)                                              │
│  updatedAt (TIMESTAMP)                                              │
└──────────────────────┬──────────────────────────────────────────────┘
                       │ 1:N
                       │
                       │ ┌──────────────────────────────────────────────┐
                       │ │                   files                     │
                       ├─┤ id (UUID, PK)                               │
                       │ │ name (VARCHAR)                               │
                       │ │ type (ENUM: file/folder)                    │
                       │ │ path (VARCHAR)                               │
                       │ │ content (TEXT)                              │
                       │ │ language (VARCHAR)                          │
                       │ │ size (BIGINT)                               │
                       │ │ permissions (SIMPLE_ARRAY)                  │
                       │ │ workspaceId (UUID, FK)                      │
                       │ │ createdAt (TIMESTAMP)                      │
                       │ │ updatedAt (TIMESTAMP)                      │
                       │ └──────────────────────────────────────────────┘
                       │
                       │ ┌──────────────────────────────────────────────┐
                       │ │              git_repositories              │
                       ├─┤ id (UUID, PK)                               │
                       │ │ name (VARCHAR)                               │
                       │ │ path (VARCHAR)                               │
                       │ │ description (TEXT)                          │
                       │ │ workspaceId (UUID, FK)                      │
                       │ │ createdAt (TIMESTAMP)                       │
                       │ │ updatedAt (TIMESTAMP)                      │
                       │ └──────────────────────────────────────────────┘
                       │
                       └──────────────────────────────────────────────┘
```

### 4.3 实体定义

#### Workspace 实体

```typescript
@Entity('workspaces')
@Index(['createdBy', 'name'], { unique: true })
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ length: 50, default: 'windows' })
  theme!: string;

  @Column({ type: 'json', nullable: true })
  windows!: WindowConfig[] | null;

  @Column({ type: 'json', nullable: true })
  fileTree!: any[] | null;

  @Column({ type: 'simple-array', nullable: true })
  openFiles!: string[] | null;

  @Column({ type: 'json' })
  settings!: WorkspaceSettings;

  @Column({ length: 255, default: 'debian:bookworm' })
  dockerImage!: string;

  @Column({ length: 50, default: 'general' })
  environmentType!: string;

  @Column({ length: 50 })
  createdBy!: string;

  @OneToMany(() => File, (file: File) => file.workspace, { cascade: true })
  files!: File[];
}
```

#### File 实体

```typescript
@Entity('files')
@Index(['workspaceId', 'path'], { unique: true })
export class File {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name: string = '';

  @Column({ type: 'enum', enum: FileType, default: FileType.FILE })
  type: FileType = FileType.FILE;

  @Column({ type: 'varchar', length: 1000 })
  path: string = '';

  @Column({ type: 'text', nullable: true })
  content: string | null = null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  language: string | null = null;

  @Column({ type: 'bigint', default: 0 })
  size: number = 0;

  @Column({ type: 'simple-array', nullable: true })
  permissions: FilePermission[] | null = null;

  @Column({ type: 'uuid' })
  workspaceId!: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspaceId' })
  workspace!: Workspace;
}
```

#### GitRepository 实体

```typescript
@Entity('git_repositories')
@Index(['workspaceId', 'name'], { unique: true })
export class GitRepository {
  @PrimaryGeneratedColumn('uuid')
  id: string = '';

  @Column({ type: 'varchar', length: 255 })
  name: string = '';

  @Column({ type: 'varchar', length: 1000 })
  path: string = '';

  @Column({ type: 'text', nullable: true })
  description: string | null = null;

  @Column({ type: 'uuid' })
  workspaceId: string = '';

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspaceId' })
  workspace!: Workspace;
}
```

### 4.4 关系映射

| 关系类型 | 源实体 | 目标实体 | 描述 |
|----------|--------|----------|------|
| OneToMany | Workspace | File | 一个工作区包含多个文件 |
| ManyToOne | File | Workspace | 一个文件属于一个工作区 |
| OneToMany | Workspace | GitRepository | 一个工作区包含多个 Git 仓库 |
| ManyToOne | GitRepository | Workspace | 一个 Git 仓库属于一个工作区 |

---

## 5. 技术栈总结

### 5.1 核心依赖

| 依赖包 | 版本 | 用途 |
|--------|------|------|
| @nestjs/core | ^11.1.14 | NestJS 核心框架 |
| @nestjs/common | ^11.1.14 | 通用模块 |
| @nestjs/platform-express | ^11.0.1 | Express 适配器 |
| @nestjs/platform-socket.io | ^11.1.12 | Socket.IO 适配器 |
| @nestjs/websockets | ^11.1.12 | WebSocket 支持 |
| @nestjs/typeorm | ^11.0.0 | TypeORM 集成 |
| @nestjs/jwt | ^11.0.2 | JWT 认证 |
| @nestjs/passport | ^11.0.5 | Passport 集成 |
| typeorm | ^0.3.20 | ORM 框架 |
| pg | ^8.13.1 | PostgreSQL 驱动 |
| dockerode | ^4.0.9 | Docker API 客户端 |
| bcryptjs | ^3.0.2 | 密码加密 |
| socket.io | - | 实时通信 |
| class-validator | ^0.14.3 | DTO 验证 |
| swagger-ui-express | - | API 文档 |

### 5.2 服务配置

- **服务器端口**: 1126
- **数据库端口**: 15433
- **API 文档**: `/api/docs`
- **全局前缀**: `/api`

### 5.3 CORS 配置

系统允许以下源地址跨域访问：

```
http://localhost:8081
http://localhost:2778
http://localhost:3000
http://localhost:3001
http://localhost:3002
http://localhost:8125
http://localhost:9125
http://localhost:11451
http://127.0.0.1:*
http://198.18.0.1:*
http://0.0.0.0:*
```

---

## 6. 架构图

### 6.1 系统架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              客户端 (浏览器)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  Web IDE (Next.js)     │    桌面应用 (Electron)    │    移动端              │
│  - Monaco Editor       │    - 窗口管理              │                        │
│  - xterm.js            │    - 桌面组件              │                        │
│  - React               │    - 系统托盘              │                        │
└─────────────┬──────────┴──────────────┬───────────┴────────────────────────┘
              │                          │
              │ HTTP/WebSocket           │ HTTP/WebSocket
              │                          │
┌─────────────▼──────────────────────────────────────────────────────────────┐
│                           Nginx 反向代理                                      │
│                     (生产环境负载均衡)                                         │
└─────────────────────────────┬───────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────────────────┐
│                        NestJS 后端服务 (端口 1126)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │  AuthModule │  │  FilesModule│  │ Workspaces  │  │  Terminal   │       │
│  │  (JWT认证)  │  │  (文件管理)  │  │  Module     │  │   Module    │       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ Containers  │  │Collaboration │  │ ClaudeCode  │  │   System    │       │
│  │   Module    │  │   Module    │  │   Module    │  │   Module    │       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    中间件与过滤器                                     │    │
│  │  - LoggingMiddleware (日志)                                        │    │
│  │  - GlobalExceptionFilter (异常处理)                                 │    │
│  │  - ValidationPipe (数据验证)                                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────┬───────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ PostgreSQL    │    │    Docker     │    │    文件系统   │
│ (端口 15433)  │    │  (容器管理)   │    │   (工作区)    │
└───────────────┘    └───────────────┘    └───────────────┘
```

### 6.2 请求处理流程

```
客户端请求
    │
    ▼
Nginx (反向代理)
    │
    ▼
NestJS 应用入口 (main.ts)
    │
    ├──▶ 全局中间件 (LoggingMiddleware)
    │
    ├──▶ 路由匹配
    │
    ├──▶ 守卫 (AuthGuard)
    │
    ├──▶ 控制器 (Controller)
    │    │
    │    ▼
    │  服务层 (Service)
    │    │
    │    ▼
    │  数据库/Docker/文件系统
    │
    ├──▶ 异常过滤器 (GlobalExceptionFilter)
    │
    ▼
响应返回
```

---

## 7. 总结

WebEnv-OS 后端采用现代化的 NestJS 框架构建，具有以下特点：

1. **模块化设计**: 15+ 功能模块，职责清晰，易于维护和扩展
2. **双协议支持**: 同时支持 RESTful API 和 WebSocket 实时通信
3. **容器化集成**: 深度集成 Docker，提供完整的容器管理能力
4. **实时协作**: 基于 Socket.IO 实现多人实时编辑功能
5. **认证安全**: 基于 JWT 的完整认证授权体系
6. **数据库持久化**: 使用 TypeORM + PostgreSQL 进行数据管理
7. **API 文档**: 集成 Swagger 提供完整的 API 文档

该架构能够支持大规模 Web IDE 的后端需求，具有良好的可扩展性和可维护性。
