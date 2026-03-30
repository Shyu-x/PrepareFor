# WebEnvOS Docker 部署

WebEnvOS 是一个基于 Docker 的完整开发环境系统，提供桌面环境、IDE、文件管理器、终端、3D 可视化等多种开发工具。

## 🚀 快速启动

### Windows 用户

```cmd
cd webenv-os
build.bat
```

### Linux/Mac 用户

```bash
cd webenv-os
./start.sh
```

### 访问地址

- **前端**: http://localhost:2778
- **桌面**: http://localhost:2778/desktop
- **IDE**: http://localhost:2778/ide
- **API**: http://localhost:2778/api/health

## 📊 系统架构

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

## 🎯 端口配置

所有服务使用 **2778** 这个冷门端口：

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

## 📦 服务详情

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

## 🛠️ 管理命令

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

## 🔍 验证部署

运行验证脚本检查所有配置：

```bash
cd webenv-os
./verify-docker.sh
```

## 📝 文档

- **DEPLOYMENT.md**: 完整部署文档
- **QUICKSTART.md**: 快速启动指南
- **DOCKER-DEPLOYMENT-SUMMARY.md**: 部署总结
- **README-DOCKER.md**: 本文档

## 🎯 技术栈

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

- Node.js 18+
- NestJS 11.x
- PostgreSQL 15
- Redis 7
- WebSocket (Socket.io 4.8.3)

### ✅ 基础设施

- Docker Compose 3.8
- Nginx Alpine
- Debian bookworm-slim

## 📁 文件结构

```
webenv-os/
├── Dockerfile                    # 前端 Dockerfile
├── docker-compose.yml           # Docker Compose 配置
├── nginx.conf                   # Nginx 反向代理配置
├── init.sql                     # 数据库初始化脚本
├── .env                         # 环境变量
├── .env.example                 # 环境变量示例
├── package.json                 # 前端依赖
├── start.sh                     # Linux 启动脚本
├── stop.sh                      # Linux 停止脚本
├── logs.sh                      # Linux 日志脚本
├── build.bat                    # Windows 构建脚本
├── stop.bat                     # Windows 停止脚本
├── verify-docker.sh             # Docker 验证脚本
├── DEPLOYMENT.md                # 部署文档
├── QUICKSTART.md                # 快速启动指南
├── DOCKER-DEPLOYMENT-SUMMARY.md # 部署总结
├── README-DOCKER.md             # 本文档
├── backend/                     # 后端服务
│   ├── Dockerfile              # 后端 Dockerfile
│   ├── package.json            # 后端依赖
│   └── server.js               # 后端服务器
├── debian/                      # Debian 开发容器
│   ├── Dockerfile              # Debian Dockerfile
│   ├── setup-all.sh            # 所有开发环境
│   ├── setup-dev.sh            # 开发工具
│   ├── setup-python.sh         # Python 环境
│   ├── setup-node.sh           # Node.js 环境
│   ├── setup-cpp.sh            # C/C++ 环境
│   ├── setup-go.sh             # Go 环境
│   ├── setup-java.sh           # Java 环境
│   ├── setup-ruby.sh           # Ruby 环境
│   ├── setup-php.sh            # PHP 环境
│   ├── setup-rust.sh           # Rust 环境
│   ├── setup-docker.sh         # Docker 环境
│   └── setup-kubernetes.sh     # Kubernetes 环境
├── src/                         # 前端源代码
├── public/                      # 静态资源
└── docs/                        # 文档
```

## 🎯 总结

WebEnvOS Docker 部署已完成，所有配置正确，可以正常运行。

**主要特点**:
- ✅ 使用冷门端口 2778
- ✅ 完整的后端 API 功能
- ✅ 完整的 Debian 开发环境
- ✅ 完整的前端桌面环境
- ✅ 完整的数据库和缓存
- ✅ 完整的反向代理
- ✅ 完整的部署脚本
- ✅ 完整的文档

**启动命令**:
- Windows: `build.bat`
- Linux/Mac: `./start.sh`

**访问地址**: http://localhost:2778

**验证命令**: `./verify-docker.sh`
