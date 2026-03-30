# CI/CD持续集成与持续部署

## 目录

1. [CI/CD概述](#1-cicd概述)
2. [GitHub Actions实战](#2-github-actions实战)
3. [Docker容器化部署](#3-docker容器化部署)
4. [自动化测试集成](#4-自动化测试集成)
5. [部署策略](#5-部署策略)
6. [面试高频问题](#6-面试高频问题)

---

## 1. CI/CD概述

### 1.1 什么是CI/CD？

```
┌─────────────────────────────────────────────────────────────┐
│                    CI/CD流程图                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  代码提交                                                   │
│     │                                                       │
│     ▼                                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              CI 持续集成 (Continuous Integration)    │   │
│  │                                                     │   │
│  │  1. 代码检查 (Lint)                                 │   │
│  │  2. 单元测试 (Unit Test)                            │   │
│  │  3. 集成测试 (Integration Test)                     │   │
│  │  4. 构建应用 (Build)                                │   │
│  │  5. 生成制品 (Artifact)                             │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│     │                                                       │
│     ▼                                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              CD 持续部署 (Continuous Deployment)     │   │
│  │                                                     │   │
│  │  1. 部署到测试环境                                   │   │
│  │  2. 自动化测试                                       │   │
│  │  3. 部署到生产环境                                   │   │
│  │  4. 监控和告警                                       │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 CI/CD工具对比

| 工具 | 类型 | 特点 | 适用场景 |
|------|------|------|----------|
| GitHub Actions | 云托管 | GitHub原生、配置简单 | GitHub项目 |
| GitLab CI | 云/自托管 | GitLab集成、功能全面 | GitLab项目 |
| Jenkins | 自托管 | 插件丰富、高度可定制 | 企业级项目 |
| CircleCI | 云托管 | 快速、并行执行 | 中小团队 |
| Travis CI | 云托管 | 开源友好 | 开源项目 |

---

## 2. GitHub Actions实战

### 2.1 基础工作流

```yaml
# .github/workflows/ci.yml

name: CI Pipeline

# 触发条件
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

# 环境变量
env:
  NODE_VERSION: '18'
  PNPM_VERSION: '8'

# 任务
jobs:
  # 代码检查和测试
  lint-and-test:
    runs-on: ubuntu-latest

    steps:
      # 1. 检出代码
      - name: Checkout code
        uses: actions/checkout@v4

      # 2. 设置Node.js
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      # 3. 安装pnpm
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      # 4. 缓存依赖
      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: ~/.pnpm-store
          key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-

      # 5. 安装依赖
      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      # 6. 代码检查
      - name: Lint
        run: pnpm lint

      # 7. 类型检查
      - name: Type check
        run: pnpm type-check

      # 8. 单元测试
      - name: Run tests
        run: pnpm test:coverage

      # 9. 上传覆盖率
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true

  # 构建应用
  build:
    runs-on: ubuntu-latest
    needs: lint-and-test

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      # 上传构建产物
      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: build
          path: dist/
          retention-days: 7
```

### 2.2 完整部署工作流

```yaml
# .github/workflows/deploy.yml

name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        description: '部署环境'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # 构建Docker镜像
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
      image-digest: ${{ steps.build.outputs.digest }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      # 设置Docker Buildx
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      # 登录GitHub Container Registry
      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      # 提取Docker元数据
      - name: Extract Docker metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=sha,prefix=
            type=raw,value=latest,enable=${{ github.ref == 'refs/heads/main' }}

      # 构建并推送镜像
      - name: Build and push Docker image
        id: build
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            NODE_ENV=production

  # 部署到Staging
  deploy-staging:
    runs-on: ubuntu-latest
    needs: build-and-push
    if: github.event.inputs.environment == 'staging' || github.ref == 'refs/heads/main'
    environment:
      name: staging
      url: https://staging.example.com

    steps:
      - name: Deploy to staging
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.STAGING_USER }}
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            cd /app
            docker-compose pull
            docker-compose up -d
            docker image prune -f

  # 部署到Production
  deploy-production:
    runs-on: ubuntu-latest
    needs: build-and-push
    if: github.event.inputs.environment == 'production'
    environment:
      name: production
      url: https://example.com

    steps:
      - name: Deploy to production
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.PRODUCTION_HOST }}
          username: ${{ secrets.PRODUCTION_USER }}
          key: ${{ secrets.PRODUCTION_SSH_KEY }}
          script: |
            cd /app
            docker-compose pull
            docker-compose up -d --no-deps --build app
            docker image prune -f

      # 健康检查
      - name: Health check
        run: |
          curl --fail https://example.com/health || exit 1

      # 发送通知
      - name: Send notification
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: '部署到生产环境完成'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
        if: always()
```

### 2.3 发布工作流

```yaml
# .github/workflows/release.yml

name: Release

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write

jobs:
  # 创建GitHub Release
  release:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Run tests
        run: npm test

      # 发布到npm
      - name: Publish to npm
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      # 创建GitHub Release
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          generate_release_notes: true
          files: |
            dist/*.js
            dist/*.d.ts
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  # 发布Docker镜像
  docker:
    runs-on: ubuntu-latest
    needs: release

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Get version
        id: version
        run: echo "VERSION=${GITHUB_REF#refs/tags/}" >> $GITHUB_OUTPUT

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ${{ secrets.DOCKERHUB_USERNAME }}/myapp:latest
            ${{ secrets.DOCKERHUB_USERNAME }}/myapp:${{ steps.version.outputs.VERSION }}
```

---

## 3. Docker容器化部署

### 3.1 多环境Docker Compose

```yaml
# docker-compose.yml (基础配置)
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    networks:
      - app-network
    depends_on:
      - db
      - redis

  db:
    image: postgres:16-alpine
    restart: unless-stopped
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis-data:/data
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
```

```yaml
# docker-compose.prod.yml (生产环境覆盖)
version: '3.8'

services:
  app:
    image: ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
    environment:
      - NODE_ENV=production
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  nginx:
    image: nginx:alpine
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

  db:
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres-prod-data:/var/lib/postgresql/data

volumes:
  postgres-prod-data:
```

```bash
# 部署命令

# 开发环境
docker-compose up -d

# 生产环境
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 3.2 部署脚本

```bash
#!/bin/bash
# deploy.sh - 部署脚本

set -e

# 配置
APP_NAME="myapp"
REGISTRY="ghcr.io"
IMAGE_NAME="$REGISTRY/myorg/$APP_NAME"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# 健康检查
health_check() {
  local url=$1
  local max_retries=30
  local retry=0

  while [ $retry -lt $max_retries ]; do
    if curl -sf "$url" > /dev/null; then
      return 0
    fi
    retry=$((retry + 1))
    sleep 2
  done

  return 1
}

# 回滚
rollback() {
  log_warn "开始回滚..."
  docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
  docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-deps app
  log_info "回滚完成"
}

# 主部署流程
main() {
  local version=$1
  local environment=${2:-staging}

  log_info "开始部署 $APP_NAME:$version 到 $environment"

  # 拉取最新镜像
  log_info "拉取镜像..."
  docker pull "$IMAGE_NAME:$version"

  # 备份当前版本
  log_info "备份当前版本..."
  CURRENT_IMAGE=$(docker inspect --format='{{.Config.Image}}' "${APP_NAME}_app_1" 2>/dev/null || echo "")

  # 更新服务
  log_info "更新服务..."
  export IMAGE_TAG=$version
  docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-deps app

  # 健康检查
  log_info "健康检查..."
  if ! health_check "http://localhost:3000/health"; then
    log_error "健康检查失败"
    if [ -n "$CURRENT_IMAGE" ]; then
      rollback
    fi
    exit 1
  fi

  # 清理旧镜像
  log_info "清理旧镜像..."
  docker image prune -f

  log_info "部署完成!"
}

# 执行
main "$@"
```

---

## 4. 自动化测试集成

### 4.1 测试工作流

```yaml
# .github/workflows/test.yml

name: Test

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  # 单元测试
  unit-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/unit/lcov.info
          flags: unit

  # 集成测试
  integration-test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    env:
      DATABASE_URL: postgresql://test:test@localhost:5432/test
      REDIS_URL: redis://localhost:6379

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run migrations
        run: npm run db:migrate

      - name: Run integration tests
        run: npm run test:integration

  # E2E测试
  e2e-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Run E2E tests
        uses: cypress-io/github-action@v6
        with:
          start: npm start
          wait-on: 'http://localhost:3000'
          wait-on-timeout: 120

      - name: Upload screenshots
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: cypress-screenshots
          path: cypress/screenshots

  # 可视化回归测试
  visual-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run visual tests
        run: npm run test:visual

      - name: Upload visual diff
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: visual-diff
          path: .loki
```

---

## 5. 部署策略

### 5.1 蓝绿部署

```yaml
# 蓝绿部署配置

# docker-compose.blue.yml
version: '3.8'
services:
  app-blue:
    image: myapp:latest
    environment:
      - INSTANCE=blue
    ports:
      - "3001:3000"
    networks:
      - app-network

# docker-compose.green.yml
version: '3.8'
services:
  app-green:
    image: myapp:latest
    environment:
      - INSTANCE=green
    ports:
      - "3002:3000"
    networks:
      - app-network
```

```bash
#!/bin/bash
# blue-green-deploy.sh

set -e

# 检测当前活跃环境
get_active() {
  if docker ps | grep -q "app-blue"; then
    echo "blue"
  else
    echo "green"
  fi
}

# 部署到非活跃环境
deploy() {
  local active=$(get_active)
  local target="green"

  if [ "$active" == "green" ]; then
    target="blue"
  fi

  echo "部署到 $target 环境..."

  # 启动新版本
  docker-compose -f "docker-compose.$target.yml" up -d

  # 等待健康检查
  sleep 10

  # 切换流量
  if [ "$target" == "blue" ]; then
    sed -i 's/server app-green/server app-blue/' nginx.conf
  else
    sed -i 's/server app-blue/server app-green/' nginx.conf
  fi

  # 重载Nginx
  docker exec nginx nginx -s reload

  # 停止旧版本
  docker-compose -f "docker-compose.$active.yml" down

  echo "部署完成，当前活跃环境: $target"
}

deploy
```

### 5.2 金丝雀发布

```yaml
# 金丝雀发布配置 (Kubernetes)

# canary-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-canary
spec:
  replicas: 1  # 金丝雀副本数
  selector:
    matchLabels:
      app: myapp
      track: canary
  template:
    metadata:
      labels:
        app: myapp
        track: canary
    spec:
      containers:
        - name: myapp
          image: myapp:v2
          ports:
            - containerPort: 3000
---
apiVersion: v1
kind: Service
metadata:
  name: myapp
spec:
  selector:
    app: myapp
  ports:
    - port: 80
      targetPort: 3000
```

```yaml
# Istio流量切分
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: myapp
spec:
  hosts:
    - myapp
  http:
    - route:
        - destination:
            host: myapp
            subset: stable
          weight: 90
        - destination:
            host: myapp
            subset: canary
          weight: 10
```

---

## 6. 面试高频问题

### 问题1：什么是CI/CD？

**答案：**
- **CI（持续集成）**：频繁将代码集成到主干，自动运行测试
- **CD（持续部署/交付）**：自动化部署到各种环境

### 问题2：蓝绿部署和金丝雀发布的区别？

**答案：**
| 方面 | 蓝绿部署 | 金丝雀发布 |
|------|----------|------------|
| 流量切换 | 全量切换 | 渐进切换 |
| 回滚速度 | 快 | 较慢 |
| 风险 | 低 | 中 |
| 资源占用 | 高（双倍） | 低 |

### 问题3：如何保证部署安全？

**答案：**
1. 自动化测试覆盖
2. 代码审查
3. 分阶段部署
4. 健康检查
5. 快速回滚机制
6. 监控告警

### 问题4：GitHub Actions的核心概念？

**答案：**
- **Workflow**：工作流，定义在YAML文件中
- **Job**：任务，包含多个Step
- **Step**：步骤，执行具体操作
- **Action**：可复用的操作单元
- **Runner**：执行任务的虚拟机

### 问题5：如何优化CI/CD流水线？

**答案：**
1. 缓存依赖
2. 并行执行任务
3. 增量构建
4. 条件触发
5. 使用矩阵构建

---

## 8. Kubernetes容器编排

### 8.1 Kubernetes核心概念

```yaml
# Kubernetes核心资源定义

# Deployment - 应用部署
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  labels:
    app: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
        - name: myapp
          image: myapp:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: production
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: myapp-secrets
                  key: database-url
          resources:
            requests:
              memory: "128Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health/live
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
          lifecycle:
            preStop:
              exec:
                command: ["/bin/sh", "-c", "sleep 10"]

---
# Service - 服务发现
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
spec:
  selector:
    app: myapp
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: ClusterIP

---
# ConfigMap - 配置管理
apiVersion: v1
kind: ConfigMap
metadata:
  name: myapp-config
data:
  app.conf: |
    LOG_LEVEL=info
    MAX_CONNECTIONS=100
  redis.conf: |
    maxmemory=256mb
    maxmemory-policy=allkeys-lru

---
# Secret - 敏感数据
apiVersion: v1
kind: Secret
metadata:
  name: myapp-secrets
type: Opaque
stringData:
  database-url: "postgresql://user:pass@postgres:5432/mydb"
  jwt-secret: "your-jwt-secret-key"

---
# HorizontalPodAutoscaler - 自动扩缩容
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80

---
# Ingress - HTTP路由
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-ingress
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/limit-rps: "100"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - myapp.example.com
      secretName: myapp-tls
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: myapp-service
                port:
                  number: 80
```

### 8.2 Helm Chart模板

```yaml
# Chart.yaml
apiVersion: v2
name: myapp
description: A Helm chart for my application
version: 1.0.0
appVersion: "1.0.0"

---
# values.yaml
replicaCount: 3

image:
  repository: myregistry/myapp
  pullPolicy: IfNotPresent
  tag: latest

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  className: nginx
  host: myapp.example.com
  tls:
    enabled: true
    secretName: myapp-tls

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 250m
    memory: 128Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

env:
  NODE_ENV: production
  LOG_LEVEL: info

secretNames:
  database: myapp-db-secret
  jwt: myapp-jwt-secret
```

---

## 9. 最佳实践总结

### 7.1 CI/CD清单

- [ ] 自动化测试覆盖
- [ ] 代码质量检查
- [ ] 安全扫描
- [ ] 构建缓存优化
- [ ] 多环境部署
- [ ] 健康检查
- [ ] 回滚机制
- [ ] 监控告警
- [ ] 部署通知

### 7.2 常见问题解决

| 问题 | 解决方案 |
|------|----------|
| 构建慢 | 缓存、并行、增量 |
| 部署失败 | 健康检查、回滚 |
| 环境不一致 | 容器化、IaC |
| 测试不稳定 | Mock、隔离 |

---

*本文档最后更新于 2026年3月*