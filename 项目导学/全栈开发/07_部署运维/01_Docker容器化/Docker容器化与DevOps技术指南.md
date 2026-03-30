# Docker容器化与DevOps技术指南

## 目录

1. [Docker基础](#1-docker基础)
2. [Docker镜像](#2-docker镜像)
3. [Docker容器管理](#3-docker容器管理)
4. [Docker网络与存储](#4-docker网络与存储)
5. [Docker Compose](#5-docker-compose)
6. [CI/CD持续集成](#6-cicd持续集成)
7. [Kubernetes入门](#7-kubernetes入门)

---

## 1. Docker基础

### 1.1 什么是Docker

Docker是一个开源的容器化平台，让开发者可以打包应用程序及其依赖到一个可移植的容器中，然后在任何支持Docker的系统上运行。

```
传统部署 vs Docker部署：

传统部署：
┌──────────────┐
│   应用代码    │
├──────────────┤
│   运行环境    │  ← 需要在每台服务器配置
├──────────────┤
│   系统依赖    │
├──────────────┤
│   物理服务器  │
└──────────────┘

Docker部署：
┌──────────────┐
│  ┌────────┐  │
│  │  应用   │  │
│  │  容器   │  │  ← 自包含、可移植
│  └────────┘  │
└──────────────┘
       ↓
   任何服务器
```

### 1.2 核心概念

| 概念 | 说明 |
|------|------|
| **镜像（Image）** | 应用程序及其依赖的模板，只读 |
| **容器（Container）** | 镜像的运行实例，可读写 |
| **仓库（Registry）** | 存储和分享镜像的地方 |
| **Dockerfile** | 定义镜像构建步骤的配置文件 |

### 1.3 安装与配置

```bash
# Linux安装（Ubuntu）
# 1. 更新包索引
sudo apt update

# 2. 安装依赖
sudo apt install apt-transport-https ca-certificates curl gnupg lsb-release

# 3. 添加Docker官方GPG密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 4. 添加Docker仓库
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 5. 安装Docker
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io

# 6. 启动Docker
sudo systemctl start docker
sudo systemctl enable docker

# 7. 验证安装
docker --version
docker run hello-world

# 8. 添加当前用户到docker组（避免每次使用sudo）
sudo usermod -aG docker $USER
```

### 1.4 Docker常用命令

```bash
# 镜像操作
docker pull nginx:latest          # 拉取镜像
docker images                    # 列出本地镜像
docker rmi nginx                 # 删除镜像
docker rmi $(docker images -q)   # 删除所有镜像
docker build -t myapp:1.0 .      # 构建镜像
docker tag myapp:1.0 myrepo/myapp:latest  # 打标签
docker push myrepo/myapp:latest  # 推送到仓库

# 容器操作
docker run -d nginx              # 后台运行容器
docker run -it ubuntu bash       # 交互式运行
docker run -p 8080:80 nginx     # 端口映射
docker run -v /data:/data nginx  # 目录挂载
docker run --name mynginx nginx  # 指定容器名称
docker ps                        # 列出运行中的容器
docker ps -a                     # 列出所有容器
docker stop mynginx              # 停止容器
docker start mynginx             # 启动容器
docker restart mynginx           # 重启容器
docker rm mynginx                # 删除容器
docker rm $(docker ps -aq)       # 删除所有容器
docker exec -it mynginx bash     # 进入容器
docker logs -f mynginx           # 查看日志
docker inspect mynginx           # 查看容器详情
docker stats mynginx             # 查看资源使用
```

---

## 2. Docker镜像

### 2.1 Dockerfile基础

```dockerfile
# 基础镜像
FROM node:20-alpine

# 维护者信息
LABEL maintainer="example@example.com"

# 设置工作目录
WORKDIR /app

# 复制文件
COPY package*.json ./
COPY . .

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 安装依赖
RUN npm ci --only=production

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "server.js"]

# 或者使用ENTRYPOINT
# ENTRYPOINT ["node", "server.js"]
```

### 2.2 Dockerfile指令详解

| 指令 | 说明 | 示例 |
|------|------|------|
| **FROM** | 指定基础镜像 | FROM node:20 |
| **RUN** | 执行命令 | RUN npm install |
| **COPY** | 复制文件 | COPY . /app |
| **ADD** | 复制（支持URL/解压） | ADD files.tar.gz / |
| **WORKDIR** | 设置工作目录 | WORKDIR /app |
| **ENV** | 环境变量 | ENV NODE_ENV=prod |
| **EXPOSE** | 声明端口 | EXPOSE 3000 |
| **CMD** | 启动命令 | CMD ["npm", "start"] |
| **ENTRYPOINT** | 入口点 | ENTRYPOINT ["node"] |
| **LABEL** | 元数据 | LABEL version="1.0" |
| **ARG** | 构建参数 | ARG NODE_VERSION |
| **VOLUME** | 数据卷 | VOLUME /data |

### 2.3 多阶段构建

```dockerfile
# 第一阶段：构建
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 第二阶段：运行
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### 2.4 .dockerignore

```
# 忽略文件
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.env.local
dist
coverage
*.log
.DS_Store
.vscode
.idea
```

### 2.5 镜像优化技巧

```dockerfile
# 1. 使用合适的基础镜像（alpine最小化）
FROM node:20-alpine

# 2. 减少层数，合并RUN指令
RUN apt-get update && apt-get install -y \
    package1 \
    package2 \
    && rm -rf /var/lib/apt/lists/*

# 3. 利用构建缓存，将不常变化的文件放前面
COPY package*.json ./
RUN npm ci
COPY . .

# 4. 使用.dockerignore排除不需要的文件

# 5. 多阶段构建减小镜像体积

# 6. 清理不必要的文件
RUN apt-get clean && rm -rf /var/lib/apt/lists/*
```

---

## 3. Docker容器管理

### 3.1 容器生命周期

```
容器生命周期：

    ┌──────────┐
    │  Created │  创建（未运行）
    └────┬─────┘
         │ docker create
         ▼
    ┌──────────┐
    │ Running  │──────┐
    └────┬─────┘      │
         │            │ docker stop
         │ docker     │ docker kill
         │ start      ▼
         │       ┌──────────┐
         │       │  Stopped │──────┐
         └──────►└────┬─────┘      │
                docker       │ docker
                rm          │ start
                           ▼
                      ┌──────────┐
                      │  Deleted │
                      └──────────┘
```

### 3.2 容器操作进阶

```bash
# 后台运行容器
docker run -d --name myapp myapp:latest

# 交互式容器
docker run -it --name myterm ubuntu:latest /bin/bash

# 自动重启容器
docker run -d --restart=always myapp:latest
# 重启策略：no, on-failure, always, unless-stopped

# 查看容器日志
docker logs myapp
docker logs -f myapp          # 实时跟踪
docker logs --tail 100 myapp # 最后100行
docker logs --since 1h myapp # 最近1小时

# 查看容器进程
docker top myapp
docker exec myapp ps aux      # 在容器内执行命令

# 查看资源使用
docker stats myapp
docker stats --no-stream      # 只显示一次

# 复制文件
docker cp myapp:/app/logs ./logs
docker cp ./config myapp:/app/config

# 查看变更
docker diff myapp

# 导出/导入容器
docker export myapp > myapp.tar
docker import myapp.tar myapp:imported
```

### 3.3 资源限制

```bash
# 内存限制
docker run -m 512m --memory-swap 1g myapp

# CPU限制
docker run --cpus=1.5 myapp          # 限制到1.5核
docker run --cpuset-cpus=0,2 myapp   # 指定CPU核心

# 限制I/O
docker run --device-read-bps /dev/sda:1mb myapp
docker run --device-write-iops /dev/sda:100 myapp

# 资源限制示例
docker run -d \
    --name production-app \
    --memory=1g \
    --memory-swap=1.5g \
    --cpus=2 \
    --restart=always \
    -p 3000:3000 \
    myapp:latest
```

---

## 4. Docker网络与存储

### 4.1 Docker网络

```bash
# 网络模式
docker run --network host myapp      # 主机网络
docker run --network bridge myapp   # 桥接网络（默认）
docker run --network none myapp     # 无网络

# 创建自定义网络
docker network create mynetwork
docker network ls

# 容器间通信
# 同一网络下的容器可以通过容器名互相访问
docker network create app-network
docker run -d --name api --network app-network myapi
docker run -d --name web --network app-network myweb
# 在web容器中可以通过 http://api:port 访问api容器

# 查看网络详情
docker network inspect mynetwork
```

### 4.2 端口映射

```bash
# 基础端口映射
docker run -p 8080:80 nginx    # 主机8080 -> 容器80
docker run -p 127.0.0.1:8080:80 nginx  # 只绑定本地
docker run -p 8080-8090:80-81 nginx     # 端口范围

# 查看端口映射
docker port myapp
```

### 4.3 Docker存储

```bash
# 匿名卷
docker run -v /data myapp        # 自动创建匿名卷

# 命名卷
docker volume create mydata
docker run -v mydata:/app/data myapp

# 绑定挂载（主机目录）
docker run -v /host/path:/container/path myapp

# 只读挂载
docker run -v /data:/app/data:ro myapp

# 查看卷
docker volume ls
docker volume inspect mydata

# 删除未使用的卷
docker volume prune
```

### 4.4 数据卷容器

```bash
# 创建数据卷容器
docker create -v /data --name data-container busybox

# 其他容器使用数据卷容器
docker run --volumes-from data-container myapp
```

---

## 5. Docker Compose

### 5.1 docker-compose.yml基础

```yaml
version: '3.8'

services:
  # 应用服务
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://user:pass@db:5432/myapp
    depends_on:
      - db
      - redis
    volumes:
      - ./data:/app/data
    networks:
      - app-network

  # PostgreSQL数据库
  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=myapp
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - app-network

  # Redis缓存
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass mypassword
    networks:
      - app-network

  # Nginx反向代理
  nginx:
    image: nginx:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - app
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  postgres-data:
```

### 5.2 Compose常用命令

```bash
# 启动所有服务
docker-compose up
docker-compose up -d              # 后台运行

# 停止所有服务
docker-compose down
docker-compose down -v            # 同时删除卷

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
docker-compose logs -f app        # 只看app服务

# 重新构建服务
docker-compose build
docker-compose build --no-cache

# 启动指定服务
docker-compose up -d app

# 扩缩容
docker-compose up -d --scale app=3

# 执行命令
docker-compose exec app npm test

# 进入容器
docker-compose exec app bash
```

### 5.3 Compose高级特性

```yaml
version: '3.8'

services:
  app:
    # 健康检查
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

    # 重启策略
    restart: unless-stopped

    # 资源限制
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

    # 日志配置
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # 使用已有网络
  app:
    networks:
      - existing-network
      - new-network

networks:
  existing-network:
    external: true
  new-network:
```

---

## 6. CI/CD持续集成

### 6.1 GitHub Actions基础

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 设置Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: 安装依赖
        run: npm ci

      - name: 运行测试
        run: npm test

      - name: 代码检查
        run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest

    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 设置Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: 构建镜像
        run: docker build -t myapp:${{ github.sha }} .

      - name: 登录Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: 推送镜像
        run: |
          docker tag myapp:${{ github.sha }} myuser/myapp:latest
          docker push myuser/myapp:latest
```

### 6.2 CD部署流程

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 部署到服务器
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /app
            docker-compose pull
            docker-compose up -d
            docker-compose exec -T app npm migrate
```

---

## 7. Kubernetes入门

### 7.1 Kubernetes核心概念

```
Kubernetes架构：

┌─────────────────────────────────────────────────────────────┐
│                      Master Node                           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│  │ API     │  │Scheduler│  │ Controller│ │ etcd   │     │
│  │ Server  │  │         │  │ Manager  │  │         │     │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘     │
└─────────────────────────────────────────────────────────────┘
          ▲
          │ kubectl
          ▼
┌─────────────────────────────────────────────────────────────┐
│                      Worker Nodes                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                   │
│  │  Node1  │  │  Node2  │  │  Node3  │                   │
│  │ ┌─────┐ │  │ ┌─────┐ │  │ ┌─────┐ │                   │
│  │ │ Pod │ │  │ │ Pod │ │  │ │ Pod │ │                   │
│  │ └─────┘ │  │ └─────┘ │  │ └─────┘ │                   │
│  └─────────┘  └─────────┘  └─────────┘                   │
└─────────────────────────────────────────────────────────────┘

核心概念：
- Pod: 最小部署单元，一个或多个容器
- Service: 服务发现和负载均衡
- Deployment: 声明式更新
- ReplicaSet: 副本控制器
- StatefulSet: 有状态应用
- DaemonSet: 每个节点运行的守护进程
- ConfigMap: 配置管理
- Secret: 敏感信息
- Ingress: HTTP路由
```

### 7.2 基本操作

```bash
# 部署应用
kubectl create deployment myapp --image=myapp:latest

# 查看部署
kubectl get deployments
kubectl get pods

# 扩缩容
kubectl scale deployment myapp --replicas=3

# 更新镜像
kubectl set image deployment/myapp myapp=new-image:tag

# 回滚
kubectl rollout undo deployment/myapp

# 删除
kubectl delete deployment myapp
```

---

## 参考资源

- [Docker官方文档](https://docs.docker.com/)
- [Docker Compose文档](https://docs.docker.com/compose/)
- [Kubernetes文档](https://kubernetes.io/docs/)
- [GitHub Actions文档](https://docs.github.com/en/actions)

---

*本文档持续更新，最后更新于2026年3月*
