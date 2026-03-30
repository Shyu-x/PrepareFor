# Docker容器化部署完全指南

## 目录

1. [Docker基础概念](#1-docker基础概念)
2. [Dockerfile编写](#2-dockerfile编写)
3. [Docker Compose](#3-docker-compose)
4. [Node.js应用容器化](#4-nodejs应用容器化)
5. [多阶段构建优化](#5-多阶段构建优化)
6. [Docker最佳实践](#6-docker最佳实践)
7. [面试高频问题](#7-面试高频问题)

---

## 1. Docker基础概念

### 1.1 Docker架构

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker架构图                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    Docker Client                     │   │
│  │                   (docker命令行)                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                   │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Docker Daemon                      │   │
│  │                   (docker守护进程)                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                   │
│         ┌───────────────┼───────────────┐                  │
│         ▼               ▼               ▼                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   Images    │ │ Containers  │ │  Networks   │          │
│  │   (镜像)    │ │  (容器)     │ │  (网络)     │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  Docker Registry                     │   │
│  │              (镜像仓库 Docker Hub等)                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 核心概念

```yaml
# Docker核心概念

镜像 (Image):
  - 只读模板，包含运行应用所需的所有内容
  - 由多层组成，每层代表Dockerfile中的一条指令
  - 通过Dockerfile构建

容器 (Container):
  - 镜像的运行实例
  - 相互隔离的进程
  - 包含自己的文件系统、网络配置

仓库 (Registry):
  - 存储和分发镜像的地方
  - 公共仓库: Docker Hub, GitHub Container Registry
  - 私有仓库: Harbor, AWS ECR, 阿里云ACR

Dockerfile:
  - 构建镜像的脚本文件
  - 定义镜像的构建步骤

Docker Compose:
  - 多容器应用的编排工具
  - 使用YAML文件定义服务
```

### 1.3 常用命令

```bash
# Docker常用命令

# 镜像操作
docker build -t myapp:latest .          # 构建镜像
docker images                            # 查看镜像列表
docker rmi myapp:latest                  # 删除镜像
docker pull node:18-alpine               # 拉取镜像
docker push myrepo/myapp:latest          # 推送镜像

# 容器操作
docker run -d -p 3000:3000 --name myapp myapp:latest  # 运行容器
docker ps                                # 查看运行中的容器
docker ps -a                             # 查看所有容器
docker stop myapp                        # 停止容器
docker start myapp                       # 启动容器
docker rm myapp                          # 删除容器
docker logs myapp                        # 查看日志
docker exec -it myapp sh                 # 进入容器

# 网络操作
docker network create mynetwork          # 创建网络
docker network ls                        # 查看网络
docker network connect mynetwork myapp   # 连接网络

# 卷操作
docker volume create myvolume            # 创建卷
docker volume ls                         # 查看卷

# 清理
docker system prune -a                   # 清理未使用的资源
docker container prune                   # 清理停止的容器
docker image prune -a                    # 清理未使用的镜像
```

---

## 2. Dockerfile编写

### 2.1 Dockerfile指令

```dockerfile
# Dockerfile指令详解

# 基础镜像
FROM node:18-alpine

# 维护者信息
LABEL maintainer="your-email@example.com"

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1

# 运行用户
USER node

# 启动命令
CMD ["node", "dist/main.js"]
```

### 2.2 Dockerfile最佳实践

```dockerfile
# Dockerfile最佳实践示例

# 1. 使用特定版本的基础镜像
# ❌ 错误: 使用latest标签
# FROM node:latest

# ✅ 正确: 使用特定版本
FROM node:18.19.0-alpine3.19

# 2. 使用多阶段构建
# 构建阶段
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 生产阶段
FROM node:18-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/main.js"]

# 3. 优化层缓存
# 先复制package.json，利用缓存
COPY package*.json ./
RUN npm ci --only=production

# 再复制源代码
COPY . .

# 4. 合并RUN指令减少层
# ❌ 错误: 多个RUN指令
# RUN apk add --no-cache git
# RUN apk add --no-cache curl

# ✅ 正确: 合并RUN指令
RUN apk add --no-cache \
    git \
    curl \
    && rm -rf /var/cache/apk/*

# 5. 使用.dockerignore
# .dockerignore文件内容
"""
node_modules
npm-debug.log
Dockerfile
.dockerignore
.git
.gitignore
README.md
.env
coverage
.nyc_output
*.log
"""

# 6. 不以root用户运行
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001
USER nextjs

# 7. 使用CMD和ENTRYPOINT
# CMD: 可被docker run参数覆盖
# ENTRYPOINT: 固定执行命令，CMD作为参数

# 方式1: CMD
CMD ["node", "server.js"]

# 方式2: ENTRYPOINT + CMD
ENTRYPOINT ["node"]
CMD ["server.js"]

# 方式3: Shell脚本入口
COPY docker-entrypoint.sh /usr/local/bin/
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
```

---

## 3. Docker Compose

### 3.1 docker-compose.yml基础

```yaml
# docker-compose.yml基础配置

version: '3.8'

services:
  # 应用服务
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    container_name: myapp
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/mydb
      - REDIS_URL=redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - app-network
    volumes:
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # PostgreSQL数据库
  db:
    image: postgres:16-alpine
    container_name: myapp-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: mydb
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - app-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis缓存
  redis:
    image: redis:7-alpine
    container_name: myapp-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    networks:
      - app-network

  # Nginx反向代理
  nginx:
    image: nginx:alpine
    container_name: myapp-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
```

### 3.2 开发环境配置

```yaml
# docker-compose.dev.yml 开发环境

version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: development
    container_name: myapp-dev
    ports:
      - "3000:3000"
      - "9229:9229"  # Node.js调试端口
    environment:
      - NODE_ENV=development
      - CHOKIDAR_USEPOLLING=true
    volumes:
      - .:/app
      - /app/node_modules  # 匿名卷，防止覆盖
    command: npm run dev
    networks:
      - app-network

  # 开发数据库
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: mydb_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres-dev-data:/var/lib/postgresql/data
    networks:
      - app-network

  # Adminer数据库管理
  adminer:
    image: adminer
    ports:
      - "8080:8080"
    networks:
      - app-network

  # Redis Commander
  redis-commander:
    image: rediscommander/redis-commander:latest
    environment:
      - REDIS_HOSTS=local:redis:6379
    ports:
      - "8081:8081"
    depends_on:
      - redis
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  postgres-dev-data:
```

### 3.3 Docker Compose命令

```bash
# Docker Compose常用命令

# 启动服务
docker-compose up -d                    # 后台启动
docker-compose up -d --build            # 重新构建后启动
docker-compose -f docker-compose.dev.yml up -d  # 指定配置文件

# 停止服务
docker-compose down                     # 停止并移除容器
docker-compose down -v                  # 同时移除卷
docker-compose stop                     # 停止容器
docker-compose start                    # 启动容器

# 查看状态
docker-compose ps                       # 查看容器状态
docker-compose logs -f app              # 查看日志
docker-compose logs --tail=100 app      # 查看最近100行日志

# 执行命令
docker-compose exec app sh              # 进入容器
docker-compose exec app npm test        # 执行测试
docker-compose run --rm app npm install # 运行一次性命令

# 扩展服务
docker-compose up -d --scale app=3      # 启动3个app实例

# 查看资源使用
docker-compose top                      # 查看进程
docker-compose images                   # 查看镜像
```

---

## 4. Node.js应用容器化

### 4.1 Express应用Dockerfile

```dockerfile
# Express应用Dockerfile

# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci

# 复制源代码并构建
COPY . .
RUN npm run build

# 生产阶段
FROM node:18-alpine AS production

# 安装dumb-init（正确处理信号）
RUN apk add --no-cache dumb-init

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# 复制构建产物
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 切换用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# 使用dumb-init启动
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
```

### 4.2 Next.js应用Dockerfile

```dockerfile
# Next.js应用Dockerfile

# 依赖阶段
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# 构建阶段
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 设置构建时环境变量
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

RUN npm run build

# 运行阶段
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# 创建用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制必要文件
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### 4.3 NestJS应用Dockerfile

```dockerfile
# NestJS应用Dockerfile

# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 生产阶段
FROM node:18-alpine AS production

# 安装tini（轻量级init进程）
RUN apk add --no-cache tini

# 创建用户
RUN addgroup -g 1001 -S nestjs && \
    adduser -S nestjs -u 1001 -G nestjs

WORKDIR /app

# 只复制生产依赖
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 复制构建产物
COPY --from=builder /app/dist ./dist

# 设置权限
RUN chown -R nestjs:nestjs /app

USER nestjs

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
```

---

## 5. 多阶段构建优化

### 5.1 多阶段构建详解

```dockerfile
# 多阶段构建详解

# 阶段1: 基础依赖
FROM node:18-alpine AS base
WORKDIR /app
# 安装系统依赖
RUN apk add --no-cache python3 make g++

# 阶段2: 安装依赖
FROM base AS deps
COPY package*.json ./
RUN npm ci

# 阶段3: 开发环境
FROM deps AS development
COPY . .
ENV NODE_ENV=development
CMD ["npm", "run", "dev"]

# 阶段4: 构建生产代码
FROM deps AS builder
COPY . .
RUN npm run build

# 阶段5: 生产环境
FROM node:18-alpine AS production
WORKDIR /app

# 只复制必要文件
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

ENV NODE_ENV=production
CMD ["node", "dist/main.js"]

# 阶段6: 测试
FROM deps AS test
COPY . .
RUN npm run test

# 构建特定阶段
# docker build --target development -t myapp:dev .
# docker build --target production -t myapp:prod .
```

### 5.2 镜像大小优化

```dockerfile
# 镜像大小优化技巧

# 1. 使用Alpine基础镜像
# node:18         ~900MB
# node:18-slim    ~200MB
# node:18-alpine  ~50MB

FROM node:18-alpine

# 2. 清理缓存
RUN npm ci --only=production && \
    npm cache clean --force && \
    rm -rf /tmp/*

# 3. 使用.dockerignore减少构建上下文
# .dockerignore
"""
node_modules
npm-debug.log
Dockerfile
.dockerignore
.git
.gitignore
README.md
.env
coverage
.nyc_output
*.log
dist
build
"""

# 4. 多阶段构建只复制必要文件
FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM node:18-alpine
WORKDIR /app
# 只复制dist目录，不复制源代码
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/main.js"]

# 5. 压缩镜像层
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force
COPY dist ./dist
CMD ["node", "dist/main.js"]

# 6. 使用dive分析镜像
# dive myapp:latest
```

---

## 6. Docker最佳实践

### 6.1 安全最佳实践

```dockerfile
# Docker安全最佳实践

# 1. 使用特定版本的基础镜像
FROM node:18.19.0-alpine3.19

# 2. 不以root用户运行
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup
USER appuser

# 3. 使用COPY而非ADD
# ADD有自动解压功能，可能带来安全风险
COPY app.jar /app/

# 4. 不存储敏感信息
# 使用环境变量或secrets
# ❌ 错误
# ENV DATABASE_PASSWORD=password123

# ✅ 正确: 使用secrets
# docker secret create db_password -
# 或使用环境变量
ENV DATABASE_PASSWORD_FILE=/run/secrets/db_password

# 5. 扫描镜像漏洞
# docker scan myapp:latest
# 或使用Trivy
# trivy image myapp:latest

# 6. 使用只读文件系统
# docker run --read-only myapp

# 7. 限制资源
# docker run --memory="512m" --cpus="1" myapp

# 8. 使用安全选项
# docker run --security-opt=no-new-privileges myapp
```

### 6.2 CI/CD集成

```yaml
# GitHub Actions CI/CD示例

name: Docker Build and Push

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        if: github.event_name != 'pull_request'
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile
          push: ${{ github.event_name != 'pull_request' }}
          tags: |
            ${{ secrets.DOCKERHUB_USERNAME }}/myapp:latest
            ${{ secrets.DOCKERHUB_USERNAME }}/myapp:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Scan image
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ secrets.DOCKERHUB_USERNAME }}/myapp:${{ github.sha }}
          format: 'table'
          exit-code: '1'
          severity: 'CRITICAL,HIGH'
```

---

## 7. 面试高频问题

### 问题1：Docker和虚拟机的区别？

**答案：**
| 方面 | Docker | 虚拟机 |
|------|--------|--------|
| 启动速度 | 秒级 | 分钟级 |
| 资源占用 | 低 | 高 |
| 隔离性 | 进程级 | 系统级 |
| 性能 | 接近原生 | 有损耗 |
| 镜像大小 | MB级 | GB级 |

### 问题2：什么是多阶段构建？

**答案：** 多阶段构建允许在Dockerfile中使用多个FROM语句，每个FROM开始一个新的构建阶段。优点：
1. 减小最终镜像大小
2. 分离构建环境和运行环境
3. 提高安全性

### 问题3：CMD和ENTRYPOINT的区别？

**答案：**
- **CMD**：容器启动时执行的默认命令，可被docker run参数覆盖
- **ENTRYPOINT**：容器启动时执行的命令，docker run参数作为参数传入

### 问题4：如何优化Docker镜像大小？

**答案：**
1. 使用Alpine基础镜像
2. 多阶段构建
3. 合并RUN指令
4. 清理缓存
5. 使用.dockerignore
6. 只复制必要文件

### 问题5：Docker Compose的作用？

**答案：**
1. 定义和运行多容器应用
2. 使用YAML配置服务
3. 简化开发和部署流程
4. 支持服务依赖、网络、卷管理

---

## 8. 最佳实践总结

### 8.1 Dockerfile清单

- [ ] 使用特定版本的基础镜像
- [ ] 使用多阶段构建
- [ ] 不以root用户运行
- [ ] 使用.dockerignore
- [ ] 合并RUN指令
- [ ] 清理缓存
- [ ] 设置健康检查
- [ ] 使用CMD/ENTRYPOINT

### 8.2 部署清单

- [ ] 配置资源限制
- [ ] 设置重启策略
- [ ] 配置日志驱动
- [ ] 使用secrets管理敏感信息
- [ ] 扫描镜像漏洞
- [ ] 配置健康检查
- [ ] 使用反向代理
- [ ] 配置备份策略

---

*本文档最后更新于 2026年3月*