# WebEnvOS Docker 部署文档

## 概述

WebEnvOS 是一个基于 Docker 的完整开发环境系统，包含前端、后端、数据库、缓存、反向代理和 Debian 开发容器。

## 端口配置

所有服务使用 **2778** 这个冷门端口，避免与常见端口冲突：

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 | 2778 | Next.js 应用 |
| 后端 HTTP | 2778 | Express API |
| 后端 WebSocket | 2779 | WebSocket 服务 |
| Nginx 反向代理 | 2778 | 统一入口 |
| Redis | 6379 | 缓存服务 |
| PostgreSQL | 5432 | 数据库 |
| Debian SSH | 2222 | 容器 SSH 访问 |
| Debian Web | 8080 | 容器 Web 访问 |

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                    WebEnvOS Docker 架构                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Nginx (2778)                      │   │
│  │                 反向代理/统一入口                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│         ┌─────────────────┼─────────────────┐               │
│         │                 │                 │               │
│    ┌────▼────┐      ┌────▼────┐      ┌────▼────┐          │
│    │ 前端    │      │ 后端    │      │ Debian  │          │
│    │ 2778    │      │ 2778    │      │ 22/80   │          │
│    └─────────┘      └─────────┘      └─────────┘          │
│         │                 │                 │               │
│         └─────────────────┼─────────────────┘               │
│                           │                                 │
│                    ┌──────▼──────┐                          │
│                    │  PostgreSQL │                          │
│                    │   5432      │                          │
│                    └─────────────┘                          │
│                           │                                 │
│                    ┌──────▼──────┐                          │
│                    │    Redis    │                          │
│                    │   6379      │                          │
│                    └─────────────┘                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 快速开始

### 前置要求

1. **Docker** - 版本 20.10+
2. **Docker Compose** - 版本 2.0+

### 启动服务

#### Linux/Mac

```bash
cd webenv-os
./start.sh
```

#### Windows

```cmd
cd webenv-os
build.bat
```

### 访问应用

启动成功后，访问以下地址：

- **前端**: http://localhost:2778
- **桌面环境**: http://localhost:2778/desktop
- **IDE**: http://localhost:2778/ide
- **健康检查**: http://localhost:2778/api/health

## 服务详情

### 1. 前端服务 (Frontend)

- **容器名**: webenv-os-frontend
- **端口**: 2778
- **技术栈**: Next.js 16.1.6 + React 19.2.3 + Ant Design 6.3.0 + Tailwind CSS v4
- **功能**:
  - 桌面环境 (Windows 11, GNOME, KDE Plasma, macOS 主题)
  - 文件管理器
  - 终端 (支持 webenvos 和 debian 模式)
  - 3D 可视化 (Three.js)
  - 文本编辑器
  - 图片查看器
  - 计算器
  - 时钟
  - Docker 管理器
  - 应用管理器
  - 任务管理器
  - 剪贴板管理器
  - 通知系统

### 2. 后端服务 (Backend)

- **容器名**: webenv-os-backend
- **端口**: 2778 (HTTP), 2779 (WebSocket)
- **技术栈**: Node.js 18 + Express + PostgreSQL + Redis
- **API 功能**:
  - **认证系统**: 用户注册、登录、JWT 令牌
  - **文件系统操作**: VFS (虚拟文件系统) 管理
  - **Docker API**: 容器管理 (模拟)
  - **缓存操作**: Redis 缓存管理
  - **数据库统计**: 用户、文件、缓存统计
  - **系统信息**: 版本、平台、内存使用
  - **WebSocket**: 实时消息通信

### 3. 数据库服务 (PostgreSQL)

- **容器名**: webenv-os-postgres
- **端口**: 5432
- **数据库**: webenvos
- **用户**: webenvos
- **密码**: webenvos123
- **初始化**: 自动执行 init.sql

### 4. 缓存服务 (Redis)

- **容器名**: webenv-os-redis
- **端口**: 6379
- **数据持久化**: 启用 AOF

### 5. Debian 开发容器

- **容器名**: webenv-os-debian
- **端口**: 2222 (SSH), 8080 (Web)
- **基础镜像**: Debian bookworm-slim
- **开发环境**:
  - **Python**: 3.x + pip + venv
  - **Node.js**: Node.js + npm
  - **C/C++**: gcc, g++, make, cmake
  - **Java**: OpenJDK
  - **Go**: golang-go
  - **Ruby**: ruby-full
  - **PHP**: php, php-cli
  - **Rust**: rustc, cargo
  - **数据库工具**: sqlite3, mysql-client, postgresql-client
  - **网络工具**: net-tools, iputils-ping, telnet, netcat
  - **其他**: git, curl, wget, vim, nano, sudo, htop, tree

### 6. Nginx 反向代理

- **容器名**: webenv-os-nginx
- **端口**: 2778
- **功能**:
  - 统一入口
  - 路由转发
  - WebSocket 支持
  - Gzip 压缩

## 管理命令

### 查看日志

```bash
# Linux/Mac
./logs.sh

# 或者直接使用 docker-compose
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f nginx
docker-compose logs -f debian-system
```

### 停止服务

```bash
# Linux/Mac
./stop.sh

# Windows
stop.bat

# 或者直接使用 docker-compose
docker-compose down
```

### 重启服务

```bash
docker-compose restart
```

### 进入容器

```bash
# 进入前端容器
docker exec -it webenv-os-frontend /bin/sh

# 进入后端容器
docker exec -it webenv-os-backend /bin/sh

# 进入 Debian 容器
docker exec -it webenv-os-debian /bin/bash
```

### 查看容器状态

```bash
docker-compose ps
```

### 清理所有数据

```bash
# 停止并删除所有容器和卷
docker-compose down --volumes

# 停止并删除所有容器、卷和镜像
docker-compose down --volumes --rmi all
```

## 环境变量

### 前端环境变量 (.env)

```env
NODE_ENV=production
PORT=2778
BACKEND_URL=http://backend:2778
```

### 后端环境变量 (docker-compose.yml)

```env
NODE_ENV=production
PORT=2778
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=webenvos
POSTGRES_USER=webenvos
POSTGRES_PASSWORD=webenvos123
REDIS_HOST=redis
REDIS_PORT=6379
JWT_SECRET=webenvos-secret-key-change-in-production
DEBIAN_HOST=debian-system
DEBIAN_PORT=22
```

## 数据持久化

所有数据都持久化存储在 Docker 卷中：

- **redis-data**: Redis 数据
- **postgres-data**: PostgreSQL 数据
- **./backend/data**: 后端数据
- **./data**: 前端数据
- **./debian-data**: Debian 用户数据
- **./debian-projects**: Debian 项目目录
- **./debian-cache**: Debian 缓存目录

## 故障排除

### 端口被占用

如果端口被占用，修改 docker-compose.yml 中的端口映射：

```yaml
ports:
  - "2778:2778"  # 修改为其他端口，如 2780:2778
```

### 容器启动失败

查看日志：

```bash
docker-compose logs -f <service-name>
```

### 数据库连接失败

确保 PostgreSQL 容器已启动：

```bash
docker-compose ps postgres
```

### Redis 连接失败

确保 Redis 容器已启动：

```bash
docker-compose ps redis
```

### Debian 容器无法 SSH

检查 SSH 服务状态：

```bash
docker exec -it webenv-os-debian service ssh status
```

## 开发模式

### 启动开发模式 (不使用 Docker)

```bash
# 前端
cd webenv-os
npm run dev

# 后端
cd backend
npm run dev
```

### 使用 Docker 开发模式

```bash
# 修改 docker-compose.yml 中的环境变量
# NODE_ENV=development

# 重新启动
docker-compose up -d
```

## 安全说明

**注意**: 这是一个开发环境，不适用于生产环境！

- 默认使用弱密码，请在生产环境中修改
- 没有启用 HTTPS
- 没有启用防火墙规则
- 没有启用访问控制

## 性能优化

### 增加内存限制

在 docker-compose.yml 中添加：

```yaml
services:
  frontend:
    deploy:
      resources:
        limits:
          memory: 2G
```

### 使用多阶段构建

Dockerfile 已经使用多阶段构建优化镜像大小。

### 数据库优化

PostgreSQL 配置已优化，支持开发环境使用。

## 更新服务

### 更新所有服务

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 更新单个服务

```bash
docker-compose build <service-name>
docker-compose up -d <service-name>
```

## 备份和恢复

### 备份数据

```bash
# 备份 PostgreSQL
docker exec webenv-os-postgres pg_dump -U webenvos webenvos > backup.sql

# 备份 Redis
docker exec webenv-os-redis redis-cli SAVE
```

### 恢复数据

```bash
# 恢复 PostgreSQL
docker exec -i webenv-os-postgres psql -U webenvos webenvos < backup.sql
```

## 技术栈验证

### ✅ 前端技术栈

- Next.js 16.1.6 (App Router)
- React 19.2.3
- Ant Design 6.3.0
- Tailwind CSS v4
- Three.js 0.183.x
- Zustand 5.0.11
- SWR 2.3.8
- TypeScript 5

### ✅ 后端技术栈

- Node.js 18
- Express 4.18.2
- PostgreSQL 15
- Redis 7
- WebSocket (ws 8.13.0)

### ✅ 基础设施

- Docker Compose 3.8
- Nginx Alpine
- Debian bookworm-slim

## 许可证

MIT License

## 支持

如有问题，请查看日志或提交 Issue。
