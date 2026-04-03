# Docker容器化部署实战

> Docker就像是物流行业的集装箱。以前的货物运输，形状、大小、重量都不统一，装卸麻烦，运输效率低。集装箱出现之后，所有货物都装进标准化的箱子里，轮船、火车、卡车都能直接运输，大大提高了效率。Docker就是这个概念，它把应用程序及其依赖打包成一个标准化的"集装箱"，在任何服务器上都能一致地运行。

## 一、理解Docker的核心概念

### 1.1 什么是Docker？（用集装箱理解）

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Docker = 应用程序的集装箱                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  传统运输方式                    Docker集装箱运输                      │
│  =====================           =====================                │
│                                                                     │
│  货物乱七八糟堆放      ──►      货物装进标准集装箱                    │
│  形状大小不一                   统一的尺寸标准                        │
│  装卸耗时费力                   吊车直接装卸                          │
│  船/火车/卡车要不同处理          同一套装卸设备                       │
│                                                                     │
│  传统部署方式                    Docker容器部署                      │
│  =====================           =====================                │
│                                                                     │
│  应用+库+配置散落各处  ──►      应用+依赖+配置打包在一起              │
│  依赖版本冲突                    隔离的依赖环境                       │
│  在我电脑能跑！                  到处都能跑                           │
│  环境配置繁琐                    环境即代码                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Docker的三大核心概念

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Docker三大核心概念                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. 镜像（Image）= 集装箱的设计图纸                                   │
│     ├── 只读的模板                           │
│     ├── 包含应用程序和所有依赖                               │
│     ├── 可以理解为"凝固的软件版本"                           │
│     └── 用来创建容器                                     │
│                                                                     │
│  2. 容器（Container）= 根据图纸建成的实际集装箱                      │
│     ├── 镜像的运行实例                           │
│     ├── 相互隔离，互不影响                         │
│     ├── 轻量级，启动快速                         │
│     └── 可以创建、启动、停止、删除                        │
│                                                                     │
│  3. 仓库（Registry）= 存放集装箱图纸的仓库                            │
│     ├── Docker Hub = 公共仓库（GitHub）                  │
│     ├── 私有仓库 = 公司内部仓库                           │
│     └── 存放和分发镜像                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.3 镜像、容器、仓库的关系

```
                    ┌─────────────┐
                    │   仓库       │  ← Docker Hub / 私有仓库
                    │  (Registry)  │
                    └──────┬──────┘
                           │ push / pull
                    ┌──────▼──────┐
                    │    镜像      │  ← Image (只读模板)
                    │   (Image)   │
                    └──────┬──────┘
                           │ docker run
                    ┌──────▼──────┐
                    │    容器      │  ← Container (运行实例)
                    │ (Container) │
                    └─────────────┘

   关系比喻：
   镜像   = 菜谱（食谱）
   容器   = 用菜谱做出来的菜
   仓库   = 菜谱书（存放很多菜谱的地方）
```

## 二、Docker安装与基础配置

### 2.1 Windows上的Docker安装

```bash
# ============================================
# Windows上安装Docker（Windows 10/11 专业版）
# ============================================

# 前提条件：
# 1. Windows 10/11 专业版或企业版（需要Hyper-V支持）
# 2. 至少4GB内存
# 3. 64位处理器
# 4. 开启BIOS虚拟化

# 安装步骤：

# 1. 下载Docker Desktop
# 访问：https://www.docker.com/products/docker-desktop

# 2. 运行安装程序，双击 Docker Desktop Installer.exe

# 3. 安装完成后，启动Docker Desktop

# 4. 验证安装
docker --version
docker-compose --version
docker ps  # 查看运行的容器

# 5. 配置镜像加速（国内必做！）
# 在Docker Desktop设置中添加镜像源

# ============================================
# WSL2安装（Windows 11或Windows 10新版本）
# ============================================

# 如果使用WSL2后端，运行以下命令

# 打开PowerShell（管理员），安装WSL2
wsl --install -d Ubuntu-22.04

# 重启后，在Ubuntu中运行
wsl -d Ubuntu-22.04

# 设置默认用户
ubuntu config --default-user your_username

# 在Ubuntu中安装Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# ============================================
# Docker Desktop配置（国内加速）
# ============================================

# 创建或编辑 ~/.docker/daemon.json
cat > ~/.docker/daemon.json << 'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ],
  "builder": {
    "gc": {
      "enabled": true,
      "defaultKeepStorage": "20GB"
    }
  },
  "features": {
    "buildkit": true
  }
}
EOF

# 重启Docker Desktop使配置生效
# 右键点击Docker图标 -> Restart
```

### 2.2 Linux上的Docker安装（Ubuntu/CentOS）

```bash
# ============================================
# Ubuntu安装Docker
# ============================================

# 1. 更新apt源
sudo apt update
sudo apt upgrade -y

# 2. 安装依赖
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common gnupg lsb-release

# 3. 添加Docker官方GPG密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 4. 添加Docker仓库
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 5. 安装Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 6. 启动Docker
sudo systemctl start docker
sudo systemctl enable docker

# 7. 把当前用户加入docker组（免sudo）
sudo usermod -aG docker $USER
newgrp docker

# 8. 验证安装
docker --version
docker ps

# ============================================
# CentOS/RHEL安装Docker
# ============================================

# 1. 卸载旧版本（如果有）
sudo yum remove docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine

# 2. 安装依赖
sudo yum install -y yum-utils device-mapper-persistent-data lvm2

# 3. 添加Docker仓库
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 4. 安装Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 5. 启动Docker
sudo systemctl start docker
sudo systemctl enable docker

# 6. 验证安装
docker --version
sudo docker run hello-world
```

### 2.3 Docker基础命令

```bash
# ============================================
# Docker基础命令速查
# ============================================

# ===== 镜像操作 =====

# 查看本地镜像列表
docker images
docker image ls

# 拉取镜像（从仓库下载到本地）
docker pull ubuntu:22.04
docker pull node:20-alpine
docker pull postgres:15

# 构建镜像（根据Dockerfile）
docker build -t myapp:1.0.0 .

# 给镜像打标签
docker tag myapp:1.0.0 registry.example.com/myapp:1.0.0

# 推送镜像到仓库
docker push registry.example.com/myapp:1.0.0

# 删除镜像
docker rmi myapp:1.0.0

# 清理无用镜像
docker image prune -a

# ===== 容器操作 =====

# 创建并启动容器
docker run -d --name mycontainer nginx:alpine
# 参数说明：
# -d: 后台运行（detached）
# --name: 给容器起个名字
# -p 8080:80: 把容器的80端口映射到宿主机的8080端口

# 查看运行中的容器
docker ps

# 查看所有容器（包括已停止的）
docker ps -a

# 启动已停止的容器
docker start mycontainer

# 停止容器
docker stop mycontainer

# 重启容器
docker restart mycontainer

# 删除容器（必须先停止）
docker rm mycontainer

# 强制删除运行中的容器
docker rm -f mycontainer

# 进入容器内部（类似ssh）
docker exec -it mycontainer /bin/sh
docker exec -it mycontainer bash  # 如果有bash

# 查看容器日志
docker logs -f mycontainer
docker logs --tail 100 mycontainer  # 只看最后100行

# 查看容器详细信息
docker inspect mycontainer

# 查看容器资源使用
docker stats mycontainer

# ===== 常用组合 =====

# 一条龙：构建、标记、推送
docker build -t myapp:latest . && \
docker tag myapp:latest registry.example.com/myapp:latest && \
docker push registry.example.com/myapp:latest

# 批量清理
docker stop $(docker ps -aq)  # 停止所有容器
docker rm $(docker ps -aq)    # 删除所有容器
docker image prune -a          # 清理未使用的镜像
```

## 三、Dockerfile编写详解

### 3.1 Dockerfile基础语法

Dockerfile就是用来说明"如何构建这个镜像"的配置文件：

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Dockerfile基础结构                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  FROM        ─ 指定基础镜像                                         │
│  LABEL       ─ 添加元数据（作者、版本等）                            │
│  ENV         ─ 设置环境变量                                          │
│  WORKDIR     ─ 设置工作目录                                          │
│  COPY        ─ 复制文件到镜像中                                      │
│  ADD         ─ 复制文件（比COPY功能更多，但不推荐）                   │
│  RUN         ─ 执行命令（构建镜像时运行）                            │
│  EXPOSE      ─ 声明端口                                              │
│  USER        ─ 设置用户                                              │
│  CMD         ─ 容器启动时执行的命令（会被覆盖）                       │
│  ENTRYPOINT  ─ 容器启动时执行的命令（不会被覆盖）                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Node.js应用的Dockerfile

```dockerfile
# ============================================
# Node.js应用的标准Dockerfile
# ============================================

# 选择Node.js基础镜像（使用alpine版本更轻量）
# FROM node:20-alpine
# FROM node:20  # 普通版本

# 推荐：使用具有构建缓存的分阶段构建
# 第一阶段：构建
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 先复制package文件（利用Docker构建缓存）
# 只有package文件变化时才重新安装依赖
COPY package*.json ./

# 安装依赖（使用npm ci比npm install更可靠）
RUN npm ci

# 复制源代码
COPY . .

# 构建生产版本
RUN npm run build

# ============================================
# 第二阶段：生产镜像
# ============================================
FROM node:20-alpine AS production

# 设置NODE_ENV为production（Node.js应用的最佳实践）
ENV NODE_ENV=production

# 创建非root用户（安全最佳实践）
# 容器内用root运行应用有安全风险
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 设置工作目录
WORKDIR /app

# 先复制package文件
COPY package*.json ./

# 只安装生产依赖（--production=true）
RUN npm ci --production && npm cache clean --force

# 复制构建产物（从builder阶段）
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./

# 设置文件权限
RUN mkdir -p .next/cache && chown -R nextjs:nodejs .

# 切换到非root用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 使用健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# 启动命令（使用exec形式，避免信号处理问题）
CMD ["node_modules/.bin/next", "start"]

# ============================================
# 完整示例：NestJS后端应用的Dockerfile
# ============================================

# syntax=docker/dockerfile:1

# 使用多阶段构建
FROM node:20-alpine AS dependencies

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装所有依赖（包括devDependencies，因为后面阶段需要）
RUN npm ci

# ===== 构建阶段 =====
FROM node:20-alpine AS builder

WORKDIR /app

# 从上一个阶段复制node_modules
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# 生成Prisma客户端（如果使用TypeORM或其他ORM）
RUN npx prisma generate

# 构建应用
RUN npm run build

# ===== 生产阶段 =====
FROM node:20-alpine AS production

# 安装生产依赖和健康检查工具
RUN apk add --no-cache dumb-init wget

WORKDIR /app

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# 复制package.json和package-lock.json
COPY package*.json ./

# 只安装生产依赖
RUN npm ci --only=production && npm cache clean --force

# 复制构建产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# 设置权限
RUN chown -R nestjs:nodejs /app

# 切换用户
USER nestjs

# 使用dumb-init作为PID 1（正确处理信号）
ENTRYPOINT ["dumb-init", "--"]

# 启动命令
CMD ["node", "dist/main.js"]
```

### 3.3 多阶段构建详解

多阶段构建是Docker生产环境的最佳实践，它可以显著减小镜像体积：

```
┌─────────────────────────────────────────────────────────────────────┐
│                       多阶段构建原理                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  阶段1: builder（构建环境）                                          │
│  ├── 安装Node.js编译工具链                                          │
│  ├── 安装构建依赖（如python、make、g++）                            │
│  ├── 复制源代码                                                     │
│  ├── 运行 npm run build                                            │
│  └── 产物：编译好的二进制文件 + node_modules                        │
│                                                                     │
│                              │                                      │
│                              │ COPY --from=builder                 │
│                              ▼                                      │
│                                                                     │
│  阶段2: production（运行环境）                                       │
│  ├── 使用轻量的alpine镜像                                          │
│  ├── 只复制需要的文件（编译产物）                                    │
│  ├── 不包含源代码、编译器、构建工具                                  │
│  └── 最终镜像体积大大减小                                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

```dockerfile
# ============================================
# 多阶段构建示例对比
# ============================================

# ❌ 错误写法：单阶段构建，镜像体积大（可能1-2GB）
FROM node:20
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
CMD ["npm", "start"]

# 问题：
# 1. 包含编译器、构建工具等无用文件
# 2. 包含源代码（不应该在生产镜像中）
# 3. 镜像体积巨大

# ============================================

# ✅ 正确写法：多阶段构建，镜像体积小（可能100-200MB）
# 阶段1：构建
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 阶段2：运行
FROM node:20-alpine
WORKDIR /app
# 只复制构建产物，不复制源代码
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package*.json ./
RUN npm ci --production
USER node
CMD ["npm", "start"]
```

### 3.4 .dockerignore文件

.dockerignore的作用类似于.gitignore，用来排除不需要复制到镜像中的文件：

```bash
# ============================================
# .dockerignore示例
# ============================================

# 版本控制系统
.git
.gitignore
.vscode
.idea

# 文档
*.md
docs/

# 测试文件
coverage/
*.test.ts
*.spec.ts
__tests__/

# 开发配置文件
.env.local
.env.development
docker-compose*.yml

# 依赖（重新安装，不复制）
node_modules/

# 构建产物（重新构建）
.next/
dist/
build/

# 日志
logs/
*.log
npm-debug.log*

# 临时文件
tmp/
temp/
.DS_Store

# 其他
*.config.js
webpack.config.js
```

### 3.5 Nginx应用的Dockerfile

```dockerfile
# ============================================
# 静态网站/Next.js前端的Dockerfile
# ============================================

# syntax=docker/dockerfile:1

# 第一阶段：构建
FROM node:20-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci

# 复制源代码
COPY . .

# 设置环境变量
ENV NEXT_TELEMETRY_DISABLED=1

# 构建生产版本
RUN npm run build

# ============================================
# 第二阶段：Nginx运行
# ============================================
FROM nginx:alpine AS production

# 复制自定义nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

# 从builder阶段复制Next.js构建产物到nginx目录
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static .next/static
COPY --from=builder /app/public ./public

# 创建必要的目录
RUN mkdir -p /var/log/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

# 暴露端口
EXPOSE 80

# 启动nginx（使用前台运行，容器才能正确停止）
CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# nginx.conf
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    # 性能优化
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    # 静态资源缓存
    server {
        listen 80;
        server_name localhost;
        root /var/www/html;
        index index.html;

        # Next.js静态文件
        location /_next/static/ {
            alias /app/.next/static/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # 静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }

        # API代理
        location /api/ {
            proxy_pass http://backend:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # 健康检查
        location /health {
            return 200 'OK';
            add_header Content-Type text/plain;
        }
    }
}
```

## 四、Docker Compose实战

### 4.1 Docker Compose概念

Docker Compose就像是一个"乐队指挥"，它可以同时管理多个容器（服务），让它们互相配合工作：

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Docker Compose = 乐队指挥                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  想象你在管理一个餐厅：                                              │
│                                                                     │
│  单个Docker容器 = 餐厅里的一个员工                                    │
│  ├── 厨师（应用容器）                                               │
│  ├── 收银员（API容器）                                              │
│  ├── 仓库管理员（数据库容器）                                        │
│  └── 清洁工（缓存容器）                                              │
│                                                                     │
│  Docker Compose = 餐厅经理                                          │
│  ├── 协调所有员工的工作                                            │
│  ├── 确保他们互相配合                                               │
│  ├── 统一管理（启动/停止/重启）                                      │
│  └── 解决他们之间的沟通（网络/卷）                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Docker Compose文件格式

```yaml
# ============================================
# docker-compose.yml 完整示例
# ============================================

# 使用版本3或3.8（最常用）
version: '3.8'

# 定义服务（可以理解为"启动哪些容器"）
services:
  # ===== 数据库服务 =====
  postgres:
    image: postgres:15-alpine
    container_name: myapp_postgres
    restart: unless-stopped  # 容器退出时自动重启
    environment:
      # 使用环境变量（或从.env文件读取）
      POSTGRES_DB: ${DB_NAME:-myapp}
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-secretpassword}
      # 时区设置
      TZ: Asia/Shanghai
      PGTZ: Asia/Shanghai
    volumes:
      # 持久化数据（宿主机目录:容器目录）
      - postgres_data:/var/lib/postgresql/data
      # 可选：初始化脚本（容器首次启动时执行）
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    ports:
      # 暴露端口（宿主机:容器）
      - "5432:5432"
    networks:
      - backend
    healthcheck:
      # 健康检查配置
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ===== Redis缓存服务 =====
  redis:
    image: redis:7-alpine
    container_name: myapp_redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD:-redispass}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - backend
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ===== 后端API服务 =====
  backend:
    build:
      # 构建上下文（从哪里找Dockerfile）
      context: ./backend
      dockerfile: Dockerfile
      # 构建参数
      args:
        NODE_ENV: production
    container_name: myapp_backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      # 数据库连接（使用服务名作为hostname）
      DATABASE_URL: postgresql://${DB_USER:-postgres}:${DB_PASSWORD:-secretpassword}@postgres:5432/${DB_NAME:-myapp}
      REDIS_URL: redis://:${REDIS_PASSWORD:-redispass}@redis:6379
      # JWT配置
      JWT_SECRET: ${JWT_SECRET:-your-secret-key-change-me}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-7d}
    # 依赖关系（等待这些服务启动后再启动本服务）
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - backend
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ===== 前端Web服务 =====
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: myapp_frontend
    restart: unless-stopped
    environment:
      NEXT_PUBLIC_API_URL: https://api.example.com
      NEXT_PUBLIC_WS_URL: wss://api.example.com
    depends_on:
      - backend
    networks:
      - backend
    ports:
      - "3000:3000"

  # ===== Nginx反向代理 =====
  nginx:
    image: nginx:alpine
    container_name: myapp_nginx
    restart: unless-stopped
    volumes:
      # 配置文件
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      # SSL证书
      - ./nginx/ssl:/etc/ssl/certs:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - frontend
      - backend
    networks:
      - backend

# ===== 网络定义 =====
networks:
  backend:
    driver: bridge
    # 可选：设置IP段
    ipam:
      config:
        - subnet: 172.28.0.0/16

# ===== 数据卷定义 =====
volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
```

### 4.3 .env环境变量文件

```bash
# ============================================
# .env 文件示例
# ============================================

# 数据库配置
DB_NAME=myapp_production
DB_USER=myapp_user
DB_PASSWORD=your-secure-password-here

# Redis配置
REDIS_PASSWORD=redis-secure-password

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-at-least-32-chars
JWT_EXPIRES_IN=7d

# API配置
API_URL=https://api.example.com
WS_URL=wss://api.example.com

# 可选：开发环境覆盖
# NODE_ENV=development
```

### 4.4 Docker Compose常用命令

```bash
# ============================================
# Docker Compose常用命令
# ============================================

# 启动所有服务（-d后台运行）
docker-compose up -d

# 指定compose文件（默认使用docker-compose.yml）
docker-compose -f docker-compose.yml up -d

# 使用生产配置文件
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 构建镜像后再启动
docker-compose up --build -d

# 停止所有服务
docker-compose down

# 停止并删除数据卷（清理数据）
docker-compose down -v

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
docker-compose logs -f backend  # 只看backend服务的日志

# 重启服务
docker-compose restart backend

# 进入容器内部
docker-compose exec backend sh
docker-compose exec postgres psql -U postgres  # 直接执行psql

# 查看资源使用
docker-compose top

# 扩展服务（运行多个实例）
docker-compose up -d --scale backend=3

# 一键清理（停止+删除+清理镜像）
docker-compose down --rmi all
```

### 4.5 生产环境vs开发环境配置

```yaml
# ============================================
# docker-compose.yml（基础配置）
# ============================================
version: '3.8'

services:
  app:
    build: .
    # 环境变量文件
    env_file:
      - .env
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

```yaml
# ============================================
# docker-compose.dev.yml（开发环境覆盖）
# ============================================
version: '3.8'

# 扩展基础配置
services:
  app:
    # 开发环境使用源代码目录挂载（热更新）
    volumes:
      - ./src:/app/src
    # 开发环境打开端口
    ports:
      - "3000:3000"
    # 开发环境使用debug模式
    environment:
      NODE_ENV: development
      DEBUG: "true"
    # 开发环境不用重启策略（方便调试）
    restart: "no"
    # 开发环境添加debug工具
    command: npm run dev:debug
```

```yaml
# ============================================
# docker-compose.prod.yml（生产环境覆盖）
# ============================================
version: '3.8'

services:
  app:
    # 生产环境不挂载源代码
    volumes: []
    # 生产环境端口内部即可
    ports: []
    # 生产环境性能优化
    environment:
      NODE_ENV: production
    # 生产环境必须自动重启
    restart: unless-stopped
    # 生产环境使用独立网络
    networks:
      - app-network-prod
    # 添加资源限制
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

networks:
  app-network-prod:
    driver: bridge
    ipam:
      config:
        - subnet: 172.30.0.0/16
```

```bash
# ============================================
# 使用示例
# ============================================

# 开发环境
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 生产环境
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 五、Kubernetes（K8s）部署入门

### 5.1 Kubernetes是什么？

如果Docker是集装箱，那么Kubernetes就是管理集装箱的自动化系统：

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Docker vs Kubernetes                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Docker（单机）= 一个人手动管理集装箱                                 │
│  ├── 启动一个容器        docker run                                 │
│  ├── 停止一个容器        docker stop                                │
│  ├── 查看容器状态        docker ps                                 │
│  └── 适合：开发、测试、小规模部署                                    │
│                                                                     │
│  Kubernetes（集群）= 全自动集装箱调度系统                            │
│  ├── 自动调度容器到合适节点                                         │
│  ├── 自动重启失败的容器                                             │
│  ├── 自动扩展/缩容容器数量                                          │
│  ├── 服务发现和负载均衡                                             │
│  ├── 滚动更新和回滚                                                 │
│  └── 适合：生产环境大规模部署                                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Kubernetes核心概念

```
┌─────────────────────────────────────────────────────────────────────┐
│                       Kubernetes核心概念                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Pod（豆荚）= 最小调度单位                                          │
│  ├── 一个Pod包含一个或多个容器                                      │
│  ├── 同一个Pod内的容器共享网络和存储                                │
│  └── 一般一个Pod只运行一个应用容器                                  │
│                                                                     │
│  ReplicaSet（副本集）= 确保Pod数量                                  │
│  ├── 确保指定数量的Pod始终运行                                      │
│  ├── 容器挂了会自动重新创建                                        │
│  └── 一般不单独使用，被Deployment调用                               │
│                                                                     │
│  Deployment（部署）= 应用部署管理器                                 │
│  ├── 管理ReplicaSet                                                │
│  ├── 支持滚动更新和回滚                                            │
│  ├── 定义应用的期望状态                                            │
│  └── 最常用的 workloads 资源                                       │
│                                                                     │
│  Service（服务）= 服务发现和负载均衡                                 │
│  ├── 为一组Pod提供稳定的访问入口                                    │
│  ├── 自动负载均衡                                                  │
│  └── ClusterIP / NodePort / LoadBalancer                          │
│                                                                     │
│  Ingress（入口）= HTTP/HTTPS路由                                   │
│  ├── 根据URL路径分发到不同Service                                   │
│  ├── 配置HTTPS                                                     │
│  └── 相当于Nginx反向代理                                           │
│                                                                     │
│  ConfigMap（配置映射）= 非敏感配置                                   │
│  ├── 存储应用配置                                                  │
│  ├── 环境变量或配置文件                                             │
│  └── 可以动态更新                                                  │
│                                                                     │
│  Secret（密钥）= 敏感配置                                           │
│  ├── 存储密码、token等敏感信息                                      │
│  └── Base64编码（生产环境建议配合加密插件）                         │
│                                                                     │
│  PersistentVolume（持久卷）= 持久化存储                             │
│  ├── Pod重启后数据不丢失                                            │
│  └── NFS、云盘等多种类型                                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.3 Kubernetes部署示例

```yaml
# ============================================
# Kubernetes部署配置（k8s-app.yaml）
# ============================================

# API版本
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-backend
  labels:
    app: myapp-backend
spec:
  # 副本数（生产环境建议至少2个）
  replicas: 3
  # 选择器
  selector:
    matchLabels:
      app: myapp-backend
  # 滚动更新策略
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  # Pod模板
  template:
    metadata:
      labels:
        app: myapp-backend
    spec:
      # 容器配置
      containers:
        - name: backend
          # 镜像（使用tag，不是latest）
          image: registry.example.com/myapp-backend:v1.0.0
          imagePullPolicy: Always
          ports:
            - containerPort: 3000
              name: http
          # 环境变量
          env:
            - name: NODE_ENV
              value: "production"
            - name: PORT
              value: "3000"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: myapp-secrets
                  key: database-url
          # 资源配置
          resources:
            requests:
              memory: "256Mi"
              cpu: "100m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          # 健康检查
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
      # 使用非root用户运行
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
      # 亲和性配置（分散Pod到不同节点）
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: myapp-backend
                topologyKey: kubernetes.io/hostname

---
# Service配置
apiVersion: v1
kind: Service
metadata:
  name: myapp-backend-service
spec:
  # Service类型
  type: ClusterIP
  selector:
    app: myapp-backend
  ports:
    - port: 80
      targetPort: 3000
      name: http

---
# Ingress配置
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-ingress
  annotations:
    # Nginx Ingress Controller配置
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  # TLS配置
  tls:
    - hosts:
        - api.example.com
      secretName: myapp-tls-secret
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: myapp-backend-service
                port:
                  number: 80

---
# Secret配置（存放敏感信息）
apiVersion: v1
kind: Secret
metadata:
  name: myapp-secrets
type: Opaque
stringData:
  database-url: "postgresql://user:password@postgres:5432/myapp"
  redis-password: "your-redis-password"
  jwt-secret: "your-jwt-secret-at-least-32-characters"

---
# ConfigMap配置（存放非敏感配置）
apiVersion: v1
kind: ConfigMap
metadata:
  name: myapp-config
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  CACHE_TTL: "300"
```

```bash
# ============================================
# Kubernetes常用命令
# ============================================

# 应用部署
kubectl apply -f k8s-app.yaml

# 查看部署状态
kubectl get deployments
kubectl get pods

# 查看日志
kubectl logs -f deployment/myapp-backend
kubectl logs -f pod/myapp-backend-xxx

# 进入容器调试
kubectl exec -it pod/myapp-backend-xxx -- sh

# 滚动更新
kubectl set image deployment/myapp-backend backend=registry.example.com/myapp-backend:v1.1.0

# 回滚
kubectl rollout undo deployment/myapp-backend

# 查看滚动历史
kubectl rollout history deployment/myapp-backend

# 扩缩容
kubectl scale deployment/myapp-backend --replicas=5

# 删除部署
kubectl delete -f k8s-app.yaml

# 查看资源使用
kubectl top pods
kubectl top nodes
```

## 六、Docker实战踩坑经验

### 6.1 常见问题与解决方案

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Docker实战踩坑笔记                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  坑1：镜像体积太大                                                   │
│  ═══════════════════════════                                        │
│  原因：包含太多不需要的文件                                          │
│  解决：                                                             │
│  ├── 使用多阶段构建                                                 │
│  ├── 使用 alpine 基础镜像                                          │
│  ├── 添加 .dockerignore                                           │
│  └── 清理不必要的文件（npm cache等）                                 │
│                                                                     │
│  坑2：构建缓存失效                                                  │
│  ═══════════════════════════                                        │
│  原因：每次构建都重新安装依赖                                        │
│  解决：                                                             │
│  ├── 先复制 package*.json，再运行 npm ci                           │
│  ├── 源代码放后面复制                                               │
│  └── 使用 --mount=type=cache 缓存npm                               │
│                                                                     │
│  坑3：容器启动失败                                                  │
│  ═══════════════════════════                                        │
│  原因：可能是健康检查失败、依赖服务未就绪                             │
│  解决：                                                             │
│  ├── docker logs <container> 查看日志                              │
│  ├── docker exec <container> ls 检查文件系统                       │
│  └── 检查 depends_on 和 healthcheck                                │
│                                                                     │
│  坑4：Windows路径问题                                               │
│  ═══════════════════════════                                        │
│  原因：Windows和Linux路径分隔符不同                                 │
│  解决：                                                             │
│  ├── 在docker-compose.yml使用正确路径                              │
│  └── 使用相对路径而非绝对路径                                       │
│                                                                     │
│  坑5：端口冲突                                                      │
│  ═══════════════════════════                                        │
│  原因：宿主机端口已被占用                                            │
│  解决：                                                             │
│  ├── docker ps 查看占用端口                                         │
│  ├── 修改端口映射 8080:80                                          │
│  └── 或停止占用端口的其他服务                                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 性能优化技巧

```dockerfile
# ============================================
# Docker构建优化技巧
# ============================================

# 1. 利用构建缓存
# 把不常变化的操作放前面

# ❌ 错误：每次都重新安装依赖
COPY . .
RUN npm ci

# ✅ 正确：先复制package.json，利用缓存
COPY package*.json ./
RUN npm ci
COPY . .

# ============================================

# 2. 使用npm缓存
# 在构建时缓存node_modules

RUN --mount=type=cache,target=/root/.npm \
    npm ci

# 这样第二次构建会快很多

# ============================================

# 3. 合并RUN指令减少层数

# ❌ 错误：多个RUN指令产生多个层
RUN apt-get update
RUN apt-get install -y nginx
RUN apt-get clean

# ✅ 正确：合并成一个RUN
RUN apt-get update && \
    apt-get install -y nginx && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# ============================================

# 4. 使用更小的基础镜像

# ❌ 大镜像（900MB+）
FROM node:20

# ✅ alpine镜像（200MB左右）
FROM node:20-alpine

# ✅ 更小的镜像（10MB，只包含node运行时）
FROM gcr.io/distroless/nodejs18-debian11

# ============================================

# 5. 清理不必要的文件

RUN apt-get update && \
    apt-get install -y something && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN npm ci && \
    npm cache clean --force

# ============================================

# 6. 使用.dockerignore排除文件

# .dockerignore
node_modules
.git
*.md
.env*
coverage
__tests__
```

### 6.3 安全最佳实践

```dockerfile
# ============================================
# Docker安全最佳实践
# ============================================

# 1. 使用非root用户运行

# 创建用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeapp -u 1001

# 复制文件并设置权限
COPY --chown=nodeapp:nodejs . .

# 切换用户
USER nodeapp

# ============================================

# 2. 使用特定版本而非latest

# ❌ latest标签会变化，不确定性
FROM node:latest
FROM nginx:latest

# ✅ 固定版本，稳定性好
FROM node:20.10.0-alpine3.18
FROM nginx:1.25.3-alpine

# ============================================

# 3. 扫描镜像漏洞

# 安装docker scan
docker scan myapp:latest

# 使用Snyk扫描
docker scan --synk myapp:latest

# 在CI/CD中集成漏洞扫描
# .github/workflows/security.yml
- name: Scan image for vulnerabilities
  run: |
    docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
      aquasec/trivy:latest image --exit-code 1 \
      --severity HIGH,CRITICAL \
      myapp:latest

# ============================================

# 4. 敏感信息处理

# ❌ 绝对不能在镜像中存储密码
ENV DB_PASSWORD=secret123

# ✅ 使用Secret或环境变量
ENV DB_PASSWORD_FILE=/run/secrets/db_password
# 或运行时注入
docker run -e DB_PASSWORD=secret myapp

# ============================================

# 5. 只复制需要的文件

# 使用.dockerignore排除
node_modules
.git
*.log
.env*
```

## 七、完整项目示例

### 7.1 典型的Web项目Docker结构

```
myapp/
├── frontend/                 # Next.js前端
│   ├── Dockerfile
│   ├── .dockerignore
│   └── ...
├── backend/                  # NestJS后端
│   ├── Dockerfile
│   ├── .dockerignore
│   └── ...
├── nginx/                    # Nginx配置
│   ├── nginx.conf
│   └── ssl/                  # SSL证书
├── docker-compose.yml        # 基础配置
├── docker-compose.dev.yml    # 开发环境
├── docker-compose.prod.yml   # 生产环境
├── .env.example              # 环境变量示例
└── .dockerignore
```

### 7.2 一键部署脚本

```bash
#!/bin/bash
# ============================================
# 一键部署脚本
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 变量配置
APP_NAME="myapp"
COMPOSE_FILE="docker-compose.yml"
COMPOSE_PROD_FILE="docker-compose.prod.yml"
IMAGE_TAG=${1:-latest}

# ============================================
# 部署前检查
# ============================================
log_info "========== 部署前检查 =========="

# 检查.env文件是否存在
if [ ! -f .env ]; then
  log_error ".env文件不存在！请先创建"
  log_info "参考 .env.example 创建 .env 文件"
  exit 1
fi

# 检查docker是否运行
if ! docker info > /dev/null 2>&1; then
  log_error "Docker未运行！请先启动Docker"
  exit 1
fi

# 检查docker-compose是否安装
if ! command -v docker-compose > /dev/null 2>&1; then
  log_error "docker-compose未安装！"
  exit 1
fi

log_info "检查通过"

# ============================================
# 构建镜像
# ============================================
log_info "========== 构建镜像 =========="

# 构建所有服务的镜像
docker-compose -f $COMPOSE_FILE -f $COMPOSE_PROD_FILE build --no-cache

log_info "镜像构建完成"

# ============================================
# 部署服务
# ============================================
log_info "========== 部署服务 =========="

# 停止旧容器并启动新容器
docker-compose -f $COMPOSE_FILE -f $COMPOSE_PROD_FILE \
  up -d \
  --remove-orphans

log_info "服务启动完成"

# ============================================
# 健康检查
# ============================================
log_info "========== 健康检查 =========="

# 等待服务启动
sleep 10

# 检查各服务状态
for service in backend frontend nginx; do
  if docker-compose -f $COMPOSE_FILE ps $service | grep -q "Up"; then
    log_info "✅ $service 服务正常"
  else
    log_error "❌ $service 服务异常"
    docker-compose -f $COMPOSE_FILE logs $service
    exit 1
  fi
done

# 检查健康端点
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  log_info "✅ 健康检查通过"
else
  log_warn "⚠️ 健康检查返回状态码：$HTTP_CODE"
fi

# ============================================
# 清理
# ============================================
log_info "========== 清理 =========="

# 删除旧的悬空镜像
docker image prune -f

log_info "清理完成"

# ============================================
# 完成
# ============================================
echo ""
log_info "=========================================="
log_info "       🎉 部署成功！"
log_info "=========================================="
log_info "服务地址："
log_info "  前端：http://localhost"
log_info "  API：http://localhost/api"
log_info "  健康检查：http://localhost/api/health"
echo ""
log_info "查看日志：docker-compose -f $COMPOSE_FILE logs -f"
log_info "停止服务：docker-compose -f $COMPOSE_FILE down"
echo ""
```

## 八、总结

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Docker部署核心要点                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. 理解核心概念                                                     │
│     ├── 镜像 = 菜谱（只读模板）                                       │
│     ├── 容器 = 做出来的菜（运行实例）                                 │
│     └── 仓库 = 菜谱书（存放镜像的地方）                               │
│                                                                     │
│  2. Dockerfile编写                                                  │
│     ├── 使用多阶段构建减小体积                                       │
│     ├── 利用构建缓存加速                                             │
│     ├── 使用非root用户运行                                          │
│     └── 添加.dockerignore                                          │
│                                                                     │
│  3. Docker Compose使用                                             │
│     ├── 定义多服务协作                                              │
│     ├── 环境变量配置敏感信息                                        │
│     └── 分离开发和生产配置                                          │
│                                                                     │
│  4. 生产环境要点                                                     │
│     ├── 资源限制（CPU/内存）                                        │
│     ├── 健康检查                                                    │
│     ├── 自动重启                                                    │
│     └── 日志管理                                                    │
│                                                                     │
│  5. 安全注意事项                                                     │
│     ├── 定期扫描漏洞                                                │
│     ├── 不在镜像中存密码                                            │
│     └── 使用最小权限原则                                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

**下一篇预告**：《Nginx生产配置完全指南》将详细介绍如何配置Nginx实现反向代理、HTTPS、负载均衡等功能。