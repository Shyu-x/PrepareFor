# WebEnv-OS Docker 部署架构

## 概述

本文档详细描述 WebEnv-OS 项目的 Docker 部署架构，涵盖镜像结构、容器编排、工作区容器管理和服务配置等核心内容。

## 目录

1. [Docker 镜像结构](#1-docker-镜像结构)
2. [容器编排配置](#2-容器编排配置)
3. [工作区 Docker 环境](#3-工作区-docker-环境)
4. [端口和服务配置](#4-端口和服务配置)
5. [网络架构](#5-网络架构)
6. [健康检查配置](#6-健康检查配置)
7. [部署流程](#7-部署流程)

---

## 1. Docker 镜像结构

WebEnv-OS 项目包含三种核心 Docker 镜像，分别用于不同的部署场景。

### 1.1 前端镜像 (Next.js)

**文件位置**: `webenv-os/Dockerfile`

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production --ignore-scripts

COPY . .
RUN npm run build

EXPOSE 2778

CMD ["npm", "start", "--", "-p", "2778"]
```

**镜像特点**:
- 基于轻量级 Alpine 镜像，减小镜像体积
- 使用多阶段构建优化（生产环境）
- 仅安装生产依赖，跳过可选依赖
- 暴露端口 2778

### 1.2 后端镜像 (NestJS)

**文件位置**: `webenv-os/backend/Dockerfile`

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production --ignore-scripts

COPY . .

EXPOSE 2778 2779

CMD ["npm", "start"]
```

**镜像特点**:
- 与前端镜像基于相同基础镜像
- 暴露两个端口：2778（主服务）、2779（WebSocket）
- 支持热重载的开发模式和生产模式

### 1.3 Debian 开发环境镜像

**文件位置**: `webenv-os/debian/Dockerfile`

```dockerfile
FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/Shanghai

RUN apt-get update && apt-get install -y \
    git curl wget vim nano \
    python3 python3-pip python3-venv \
    nodejs npm \
    gcc g++ make \
    default-jdk \
    golang-go \
    ruby-full \
    rustc cargo \
    sqlite3 mysql-client postgresql-client \
    openssh-server \
    ...

RUN useradd -m -s /bin/bash webenv && \
    echo "webenv:webenv" | chpasswd

RUN mkdir -p /var/run/sshd && \
    sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config

WORKDIR /home/webenv

EXPOSE 22 80

CMD ["/usr/sbin/sshd", "-D"]
```

**镜像特点**:
- 基于 Debian Bookworm Slim
- 预装多种开发语言环境（Node.js、Python、Go、Rust、Java、C++等）
- 配置 SSH 服务，支持远程登录
- 创建专用用户 `webenv`，密码为 `webenv`
- 暴露端口 22（SSH）和 80（HTTP）

### 1.4 主项目 Dockerfile（单体开发环境）

**文件位置**: `Dockerfile`

```dockerfile
FROM debian:12

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/Shanghai

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    build-essential curl wget git vim nano htop tree jq unzip xz-utils zip ...

# 安装 Node.js 22
RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && apt-get update && apt-get install -y nodejs

# 安装 Docker CLI
RUN apt-get install -y docker.io docker-compose

# 安装 Python 包
RUN pip3 install --no-cache-dir --break-system-packages -i https://pypi.tuna.tsinghua.edu.cn/simple \
    ipython black flake8 mypy pytest

WORKDIR /workspace

# 安装依赖
COPY webenv-backend/package*.json ./webenv-backend/
COPY webenv-os/package*.json ./webenv-os/
WORKDIR /workspace/webenv-backend && npm install
WORKDIR /workspace/webenv-os && npm install

COPY webenv-backend ./webenv-backend/
COPY webenv-os ./webenv-os/

WORKDIR /workspace/webenv-backend
RUN npx tsc --skipLibCheck --noEmitOnError false || true

EXPOSE 8125 1126

COPY docker/entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
```

---

## 2. 容器编排配置

WebEnv-OS 项目提供多套 docker-compose 配置以适应不同部署场景。

### 2.1 开发环境 (docker-compose.yml)

**文件位置**: `docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: webenv-db-dev
    environment:
      POSTGRES_USER: webenvos
      POSTGRES_PASSWORD: webenvos
      POSTGRES_DB: webenvos
    ports:
      - "15433:5432"
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    networks:
      - webenv-network-dev
    restart: unless-stopped

  webenv:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: webenv-os-dev
    ports:
      - "9125:8125"
      - "18888:1126"
    volumes:
      - ./:/workspace
      - /workspace/webenv-backend/node_modules
      - /workspace/webenv-os/node_modules
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      NODE_ENV: development
      TZ: Asia/Shanghai
      DOCKERIZED: true
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USERNAME: webenvos
      DB_PASSWORD: webenvos
      DB_DATABASE: webenvos
    depends_on:
      - postgres
    entrypoint: ["/bin/bash", "/workspace/docker/entrypoint.dev.sh"]
    stdin_open: true
    tty: true
    networks:
      - webenv-network-dev

networks:
  webenv-network-dev:
    name: webenv-network-dev
    driver: bridge
```

### 2.2 生产环境 (docker-compose.prod.yml)

**文件位置**: `docker-compose.prod.yml`

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: webenv-nginx
    restart: unless-stopped
    ports:
      - "${NGINX_PORT:-80}:80"
    volumes:
      - ./docker/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      frontend:
        condition: service_healthy
      backend:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost/nginx-health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M

  postgres:
    image: postgres:15-alpine
    container_name: webenv-postgres
    environment:
      POSTGRES_USER: ${DB_USERNAME:-webenvos}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-webenvos}
      POSTGRES_DB: ${DB_NAME:-webenvos}
      TZ: ${TZ:-Asia/Shanghai}
    ports:
      - "${DB_PORT:-15433}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME:-webenvos} -d ${DB_NAME:-webenvos}"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G

  backend:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    container_name: webenv-backend
    environment:
      NODE_ENV: production
      PORT: ${API_INTERNAL_PORT:-1126}
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USERNAME: ${DB_USERNAME:-webenvos}
      DB_PASSWORD: ${DB_PASSWORD:-webenvos}
      DB_DATABASE: ${DB_NAME:-webenvos}
      JWT_SECRET: ${JWT_SECRET:-your-secret-key-change-in-production}
      CORS_ORIGIN: ${CORS_ORIGIN:-*}
    ports:
      - "${API_PORT:-18888}:${API_INTERNAL_PORT:-1126}"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - workspace_data:/workspace
      - logs:/app/logs
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:${API_INTERNAL_PORT:-1126}/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G

  frontend:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    container_name: webenv-frontend
    environment:
      NODE_ENV: production
      PORT: ${FRONTEND_INTERNAL_PORT:-8125}
      NEXT_PUBLIC_API_URL: http://backend:${API_INTERNAL_PORT:-1126}
      NEXT_PUBLIC_WS_URL: ws://backend:${API_INTERNAL_PORT:-1126}
    ports:
      - "${PORT:-11451}:${FRONTEND_INTERNAL_PORT:-8125}"
    depends_on:
      backend:
        condition: service_healthy
    volumes:
      - workspace_data:/workspace
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:${FRONTEND_INTERNAL_PORT:-8125}"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G

networks:
  webenv-network:
    driver: bridge

volumes:
  postgres_data:
    name: webenv-postgres-data
  workspace_data:
    name: webenv-workspace-data
  logs:
    name: webenv-logs
```

### 2.3 开发专用环境 (docker-compose.dev.yml)

**文件位置**: `docker-compose.dev.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: webenv-db
    environment:
      POSTGRES_USER: webenvos
      POSTGRES_PASSWORD: webenvos
      POSTGRES_DB: webenvos
    ports:
      - "15433:5432"
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    networks:
      - webenv-network
    restart: unless-stopped

  webenv:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: webenv-os
    ports:
      - "9125:8125"
      - "3002:1126"
    volumes:
      - webenv-data:/workspace/data
      - webenv-git:/workspace/git
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      NODE_ENV: production
      TZ: Asia/Shanghai
      DOCKERIZED: true
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USERNAME: webenvos
      DB_PASSWORD: webenvos
      DB_DATABASE: webenvos
    depends_on:
      - postgres
    restart: unless-stopped
    stdin_open: true
    tty: true
    networks:
      - webenv-network

networks:
  webenv-network:
    name: webenv-network
    driver: bridge

volumes:
  webenv-data:
  webenv-git:
```

---

## 3. 工作区 Docker 环境

WebEnv-OS 支持为每个工作区创建独立的 Docker 容器，实现环境隔离。

### 3.1 工作区容器架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      WebEnv-OS 主容器                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │   Next.js 前端   │  │   NestJS 后端    │  │  PostgreSQL    │  │
│  │   端口: 8125    │  │   端口: 1126     │  │   端口: 5432   │  │
│  └────────┬────────┘  └────────┬────────┘  └───────┬────────┘  │
│           │                   │                    │           │
│           └───────────────────┼────────────────────┘           │
│                               │                                │
│                    ┌──────────▼──────────┐                     │
│                    │  Docker Socket     │                     │
│                    │  (/var/run/docker  │                     │
│                    │   .sock)           │                     │
│                    └──────────┬──────────┘                     │
└───────────────────────────────┼────────────────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
          ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  工作区容器 1    │  │  工作区容器 2    │  │  工作区容器 N    │
│  (Node.js)      │  │  (Python)       │  │  (Rust)         │
│  网络: ws-1     │  │  网络: ws-2     │  │  网络: ws-n     │
│  IP: 172.x.x.x │  │  IP: 172.x.x.x  │  │  IP: 172.x.x.x │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 3.2 环境模板

**定义位置**: `webenv-backend/src/modules/terminal/terminal.service.ts`

```typescript
export const DEV_ENVIRONMENTS: Record<string, {
  name: string;
  image: string;
  description: string;
  ports: number[];
  command: string;
}> = {
  node: {
    name: 'Node.js',
    image: 'node:20-bookworm',
    description: 'Node.js 20 开发环境',
    ports: [3000, 3001, 8080],
    command: 'bash',
  },
  python: {
    name: 'Python',
    image: 'python:3.12-bookworm',
    description: 'Python 3.12 开发环境',
    ports: [8000, 5000, 8888],
    command: 'bash',
  },
  rust: {
    name: 'Rust',
    image: 'rust:1.75-bookworm',
    description: 'Rust 开发环境',
    ports: [8000, 8080],
    command: 'bash',
  },
  go: {
    name: 'Go',
    image: 'golang:1.21-bookworm',
    description: 'Go 1.21 开发环境',
    ports: [8080, 3000],
    command: 'bash',
  },
  java: {
    name: 'Java',
    image: 'eclipse-temurin:21-jdk-bookworm',
    description: 'Java 21 开发环境',
    ports: [8080, 9090],
    command: 'bash',
  },
  cpp: {
    name: 'C++',
    image: 'gcc:13-bookworm',
    description: 'C++ (GCC 13) 开发环境',
    ports: [8080],
    command: 'bash',
  },
  web: {
    name: 'Web 全栈',
    image: 'node:20-bookworm',
    description: 'Node.js + 前端开发环境',
    ports: [3000, 3001, 5173, 8080],
    command: 'bash',
  },
  debian: {
    name: 'Debian 系统',
    image: 'debian:bookworm',
    description: 'Debian Bookworm 基础环境',
    ports: [],
    command: 'bash',
  },
};
```

### 3.3 容器创建流程

```typescript
async ensureWorkspaceContainer(
  workspaceId: string,
  options?: { image?: string; cpuShares?: number; memoryMb?: number }
): Promise<WorkspaceContainerInfo> {
  // 1. 确定使用的镜像
  const image = options?.image ||
    await this.getWorkspaceImage(workspaceId) ||
    'debian:bookworm';

  // 2. 确保镜像存在，不存在则拉取
  await this.ensureImage(image);

  // 3. 创建/确保工作区目录存在
  const hostWorkspacePath = await this.ensureWorkspaceDirectory(workspaceId);

  // 4. 确保 Docker 网络存在
  await this.ensureNetwork(workspaceId);

  // 5. 查找已存在的容器或创建新容器
  const existingContainer = await this.findExistingContainer(workspaceId);
  let container: IDockerContainer;

  if (existingContainer) {
    container = existingContainer;
  } else {
    container = await this.docker.createContainer({
      name: this.getContainerName(workspaceId),
      Image: image,
      Tty: true,
      OpenStdin: true,
      WorkingDir: '/workspace',
      Labels: {
        'webenv.workspaceId': workspaceId,
        'webenv.type': 'workspace-container',
      },
      HostConfig: {
        Binds: [`${dockerBindPath}:/workspace`],
        NetworkMode: this.getNetworkName(workspaceId),
        CpuShares: options?.cpuShares,
        Memory: options?.memoryMb ? options.memoryMb * 1024 * 1024 : undefined,
        AutoRemove: false,
      },
    });
  }

  // 6. 启动容器（如果未运行）
  if (!inspectBefore.State?.Running) {
    await container.start();
  }

  // 7. 返回容器信息
  return {
    workspaceId,
    containerId: inspect.Id,
    name: inspect.Name.replace('/', ''),
    image: inspect.Config.Image,
    status: inspect.State?.Running ? 'running' : 'stopped',
    createdAt: new Date(inspect.Created ?? Date.now()).toISOString(),
    lastActiveAt: new Date().toISOString(),
    networkName: this.getNetworkName(workspaceId),
    hostWorkspacePath,
  };
}
```

### 3.4 容器生命周期管理

**容器状态流转**:

```
┌──────────┐     start()      ┌─────────┐
│  created │ ───────────────► │ running │
└──────────┘                  └────┬────┘
      ▲                            │
      │ stop()                     │ exec()
      │                            ▼
      │                       ┌─────────┐
      └────────────────────── │ running │ (有活跃会话)
         (无活跃会话)          └────┬────┘
                                    │
                               session.close()
                                    │
                              ┌──────▼──────┐
                              │ idle (运行) │
                              └──────┬──────┘
                                     │
                        自动停止计时器 (默认 30 分钟)
                                     │
                              ┌──────▼──────┐
                              │   stopped    │
                              └─────────────┘
```

**自动停止机制**:
- 工作区容器创建后会启动idle计时器
- 当所有会话关闭后，开始倒计时
- 默认 30 分钟后自动停止容器
- 新的终端会话会重置计时器

---

## 4. 端口和服务配置

### 4.1 端口映射总览

| 服务 | 内部端口 | 外部端口 | 协议 | 说明 |
|------|----------|----------|------|------|
| 前端 (Next.js) | 8125 | 11451 | HTTP | Web IDE 主界面 |
| 后端 (NestJS) | 1126 | 18888 | HTTP/WebSocket | API 和实时通信 |
| PostgreSQL | 5432 | 15433 | TCP | 数据库服务 |
| Nginx | 80 | 80/443 | HTTP | 反向代理（生产） |
| Debian 系统 | 22 | 2222 | SSH | 远程开发环境 |
| 独立开发 | 22 | - | SSH | 工作区容器 SSH |

### 4.2 生产环境端口配置

```yaml
# docker-compose.prod.yml 环境变量
frontend:
  environment:
    PORT: ${FRONTEND_INTERNAL_PORT:-8125}
  ports:
    - "${PORT:-11451}:${FRONTEND_INTERNAL_PORT:-8125}"

backend:
  environment:
    PORT: ${API_INTERNAL_PORT:-1126}
  ports:
    - "${API_PORT:-18888}:${API_INTERNAL_PORT:-1126}"

postgres:
  environment:
    PGDATA: /var/lib/postgresql/data/pgdata
  ports:
    - "${DB_PORT:-15433}:5432"
```

### 4.3 Nginx 反向代理配置

**文件位置**: `docker/nginx.conf`

```nginx
upstream frontend {
    server frontend:8125;
}

upstream backend {
    server backend:1126;
}

server {
    listen 80;
    server_name _;
    client_max_body_size 100M;

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # 前端应用路由
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
    }

    # API 路径代理
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 90s;
    }

    # WebSocket 代理
    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 300s;
    }

    # 健康检查
    location = /nginx-health {
        return 200 "nginx healthy\n";
    }
}
```

---

## 5. 网络架构

### 5.1 Docker 网络拓扑

```
┌──────────────────────────────────────────────────────────────────┐
│                     webenv-network (bridge)                      │
│                                                                   │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │  frontend   │    │   backend   │    │  postgres   │          │
│  │  172.x.0.2 │    │  172.x.0.3  │    │  172.x.0.4 │          │
│  └──────┬──────┘    └──────┬──────┘    └─────────────┘          │
│         │                  │                                    │
│         │      ┌───────────┴───────────┐                       │
│         │      │                       │                        │
│         │      ▼                       ▼                        │
│         │   ┌─────────┐           ┌─────────┐                   │
│         └───►│  nginx  │◄─────────│  外部   │                   │
│              └─────────┘           │  网络   │                   │
│                                    └─────────┘                   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│               ws-{workspaceId} (独立网络)                        │
│                                                                   │
│  ┌─────────────┐                                                │
│  │ workspace-  │◄────── 工作区容器                               │
│  │ container   │       172.y.0.2                                 │
│  └─────────────┘                                                │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 网络配置

**开发环境网络**:
```yaml
networks:
  webenv-network-dev:
    name: webenv-network-dev
    driver: bridge
```

**生产环境网络**:
```yaml
networks:
  webenv-network:
    driver: bridge
    name: webenv-network
```

### 5.3 工作区独立网络

每个工作区容器创建独立的 Docker 网络：

```typescript
private async ensureNetwork(workspaceId: string): Promise<void> {
  const networkName = this.getNetworkName(workspaceId);
  const networks = await this.docker.listNetworks();
  const exists = networks.some(n => n.Name === networkName);

  if (!exists) {
    await this.docker.createNetwork({
      Name: networkName,
      Driver: 'bridge',
      Labels: {
        'webenv.workspaceId': workspaceId,
        'webenv.type': 'workspace-network',
      },
    });
  }
}
```

---

## 6. 健康检查配置

### 6.1 各服务健康检查

```yaml
services:
  nginx:
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost/nginx-health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

  postgres:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME:-webenvos} -d ${DB_NAME:-webenvos}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  backend:
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:1126/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:8125"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
```

### 6.2 启动顺序控制

```yaml
nginx:
  depends_on:
    frontend:
      condition: service_healthy
    backend:
      condition: service_healthy

frontend:
  depends_on:
    backend:
      condition: service_healthy

backend:
  depends_on:
    postgres:
      condition: service_healthy
```

---

## 7. 部署流程

### 7.1 开发环境部署

```bash
# 1. 启动开发环境
docker-compose up -d

# 2. 查看日志
docker-compose logs -f

# 3. 访问服务
# 前端: http://localhost:9125
# 后端: http://localhost:18888
# API 文档: http://localhost:18888/api/docs
```

### 7.2 生产环境部署

```bash
# 1. 构建镜像
docker-compose -f docker-compose.prod.yml build

# 2. 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 3. 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 4. 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 5. 访问服务
# 前端: http://localhost:11451
# 后端: http://localhost:18888
# Nginx: http://localhost:80
```

### 7.3 入口脚本分析

**开发环境入口脚本**: `docker/entrypoint.dev.sh`

```bash
#!/bin/bash

# 1. 等待数据库就绪
for i in {1..30}; do
    if PGPASSWORD=webenvos psql -h postgres -U webenvos -d webenvos -c '\q' 2>/dev/null; then
        echo "数据库已就绪"
        break
    fi
    echo "等待数据库启动... ($i/30)"
    sleep 2
done

# 2. 检查 Docker socket
if [ -S /var/run/docker.sock ]; then
    chmod 666 /var/run/docker.sock
fi

# 3. 启动后端服务 (Watch 模式)
cd /workspace/webenv-backend
npm run start:dev &

# 4. 启动前端服务 (Watch 模式)
cd /workspace/webenv-os
npm run dev -- -p 8125 -H 0.0.0.0 &

# 5. 保持容器运行
wait
```

**生产环境入口脚本**: `docker/entrypoint.sh`

```bash
#!/bin/bash
set -e

# 1. 环境变量验证
# 2. 数据库初始化和连接验证
# 3. 数据库迁移
# 4. Docker 守护进程检查
# 5. 启动后端和前端服务
# 6. 优雅关闭处理
trap cleanup SIGTERM SIGINT

cleanup() {
    kill -TERM $FRONTEND_PID 2>/dev/null || true
    kill -TERM $BACKEND_PID 2>/dev/null || true
}

trap cleanup SIGTERM SIGINT
wait $BACKEND_PID $FRONTEND_PID
```

---

## 附录

### A. 环境变量参考

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| NODE_ENV | development | 运行环境 |
| PORT | 11451 | 前端端口 |
| API_PORT | 18888 | 后端端口 |
| API_INTERNAL_PORT | 1126 | 后端内部端口 |
| FRONTEND_INTERNAL_PORT | 8125 | 前端内部端口 |
| DB_PORT | 15433 | 数据库端口 |
| DB_USERNAME | webenvos | 数据库用户名 |
| DB_PASSWORD | webenvos | 数据库密码 |
| DB_NAME | webenvos | 数据库名称 |
| JWT_SECRET | - | JWT 密钥 |
| TZ | Asia/Shanghai | 时区 |
| NGINX_PORT | 80 | Nginx 端口 |

### B. 资源限制（生产环境）

| 服务 | CPU 限制 | 内存限制 |
|------|----------|----------|
| Nginx | 0.5 核 | 256MB |
| PostgreSQL | 1 核 | 1GB |
| Backend | 2 核 | 2GB |
| Frontend | 1 核 | 1GB |

### C. 日志配置

所有服务使用统一的 JSON 日志格式：

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

---

*文档生成时间: 2026-03-08*
*项目版本: WebEnv-OS v1.0*
