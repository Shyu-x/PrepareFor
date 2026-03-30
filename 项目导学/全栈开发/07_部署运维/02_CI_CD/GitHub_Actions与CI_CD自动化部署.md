# GitHub Actions与CI/CD自动化部署完全指南

> 本文档深入解析2026年GitHub Actions的完整配置、多环境部署策略、自动化测试集成及安全最佳实践。

---

## 一、GitHub Actions核心概念

### 1.1 工作流架构

#### 基本概念

```
GitHub Actions 工作流架构：

┌─────────────────────────────────────────────────────────┐
│                    Repository                            │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Workflow File (.yml)                  │  │
│  │  ┌────────────────────────────────────────────┐   │  │
│  │  │  trigger: push, pull_request, schedule    │   │  │
│  │  └────────────────────────────────────────────┘   │  │
│  │                                                      │  │
│  │  ┌────────────────────────────────────────────┐   │  │
│  │  │              Job 1                          │   │  │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │  │
│  │  │  │  Step 1  │→│  Step 2  │→│  Step 3  │  │   │  │
│  │  │  └──────────┘ └──────────┘ └──────────┘  │   │  │
│  │  └────────────────────────────────────────────┘   │  │
│  │                         ↓                          │  │
│  │  ┌────────────────────────────────────────────┐   │  │
│  │  │              Job 2 (dependsOn Job 1)       │   │  │
│  │  │  ┌──────────┐ ┌──────────┐                │   │  │
│  │  │  │  Step 1  │→│  Step 2  │                │   │  │
│  │  │  └──────────┘ └──────────┘                │   │  │
│  │  └────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │                    Runner                          │  │
│  │  ┌──────────────────────────────────────────┐    │  │
│  │  │  GitHub-hosted / Self-hosted              │    │  │
│  │  │  • ubuntu-latest                         │    │  │
│  │  │  • windows-latest                         │    │  │
│  │  │  • macos-latest                          │    │  │
│  │  │  • self-hosted                           │    │  │
│  │  └──────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

#### 触发条件

```yaml
name: 工作流名称

on:
  # 推送触发
  push:
    branches: [main, develop]
    tags: ['v*']  # 标签推送
    paths: ['src/**', 'package.json']  # 路径过滤

  # PR触发
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened]

  # 定时触发
  schedule:
    - cron: '0 2 * * *'  # 每天凌晨2点

  # 手动触发
  workflow_dispatch:
    inputs:
      environment:
        description: '部署环境'
        required: true
        type: choice
        options: [dev, staging, prod]

  # API触发
  repository_dispatch:
    types: [deploy]
```

### 1.2 Runner类型对比

| 特性 | GitHub-hosted | Self-hosted |
|------|---------------|-------------|
| 维护 | GitHub管理 | 自维护 |
| 启动时间 | 几秒 | 几秒到几分钟 |
| 灵活性 | 固定配置 | 完全自定义 |
| 成本 | 免费额度/分钟 | 服务器成本 |
| 网络 | GitHub网络 | 自定义网络 |
| 适用场景 | 通用构建 | 企业内网/特殊需求 |

---

## 二、完整CI/CD流水线配置

### 2.1 基础工作流

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'
  PNPM_VERSION: '8'

jobs:
  # 第一阶段：代码检查
  lint:
    name: Code Quality
    runs-on: ubuntu-latest
    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 设置Node.js环境
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: 安装pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: 获取依赖
        run: pnpm install --frozen-lockfile

      - name: ESLint检查
        run: pnpm lint

      - name: Prettier格式检查
        run: pnpm format:check

      - name: TypeScript类型检查
        run: pnpm type-check

  # 第二阶段：测试
  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 设置Node.js环境
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: 安装pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: 获取依赖
        run: pnpm install --frozen-lockfile

      - name: 运行测试
        run: pnpm test --coverage

      - name: 上传覆盖率报告
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: false

  # 第三阶段：构建
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: test
    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 设置Node.js环境
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: 安装pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: 获取依赖
        run: pnpm install --frozen-lockfile

      - name: 构建应用
        run: pnpm build
        env:
          NEXT_PUBLIC_API_URL: ${{ vars.NEXT_PUBLIC_API_URL }}
          NEXT_PUBLIC_ANALYTICS_ID: ${{ secrets.ANALYTICS_ID }}

      - name: 上传构建产物
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: |
            .next/
            standalone/
          retention-days: 7

  # 第四阶段：E2E测试
  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'pull_request'
    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 设置Node.js环境
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: 安装Playwright浏览器
        uses: microsoft/playwright-github-action@v1

      - name: 获取依赖
        run: pnpm install --frozen-lockfile

      - name: 下载构建产物
        uses: actions/download-artifact@v4
        with:
          name: dist
          path: .next

      - name: 启动预览服务器
        run: pnpm start &
        shell: bash

      - name: 等待服务就绪
        run: npx wait-on http://localhost:3000 --timeout 120000

      - name: 运行Playwright测试
        run: pnpm test:e2e
        continue-on-error: true

      - name: 上传测试报告
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

      - name: 上传测试截图
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: screenshots
          path: test-results/**/screenshot-*.png
```

### 2.2 多环境部署配置

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  workflow_dispatch:
    inputs:
      environment:
        description: '选择部署环境'
        required: true
        type: choice
        options:
          - development
          - staging
          - production

  push:
    branches: [main]

env:
  NODE_VERSION: '20'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # 构建Docker镜像
  build-image:
    name: Build Docker Image
    runs-on: ubuntu-latest
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
      sha-tag: ${{ env.SHA_TAG }}
    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 设置QEMU
        uses: docker/setup-qemu-action@v3

      - name: 设置Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: 登录到GitHub容器注册表
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: 提取元数据
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=sha,prefix=

      - name: 构建并推送
        uses: docker/build-push-action@v5
        with:
          context: .
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # 部署到开发环境
  deploy-dev:
    name: Deploy to Development
    runs-on: ubuntu-latest
    needs: build-image
    if: github.event_name == 'workflow_dispatch' && github.event.inputs.environment == 'development'
    environment:
      name: development
      url: https://dev.example.com
    steps:
      - name: 部署到开发服务器
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.DEV_HOST }}
          username: ${{ secrets.DEV_USER }}
          key: ${{ secrets.DEV_SSH_KEY }}
          script: |
            docker pull ${{ needs.build-image.outputs.image-tag }}
            docker stop app || true
            docker rm app || true
            docker run -d \
              --name app \
              -p 3000:3000 \
              -e NODE_ENV=development \
              -e API_URL=${{ vars.DEV_API_URL }} \
              ${{ needs.build-image.outputs.image-tag }}

  # 部署到预发环境
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build-image
    if: github.event_name == 'workflow_dispatch' && github.event.inputs.environment == 'staging'
    environment:
      name: staging
      url: https://staging.example.com
    steps:
      - name: 部署到预发服务器
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.STAGING_USER }}
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            docker-compose -f docker-compose.staging.yml pull
            docker-compose -f docker-compose.staging.yml up -d

  # 部署到生产环境
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build-image
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://example.com
    steps:
      - name: 部署到生产环境（蓝绿部署）
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            # 部署到blue版本
            docker-compose -f docker-compose.prod.yml pull
            docker-compose -f docker-compose.prod.yml up -d --scale app=2

            # 等待健康检查
            sleep 30

            # 检查健康状态
            HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://example.com/health)
            if [ "$HEALTH" != "200" ]; then
              echo "健康检查失败，执行回滚"
              docker-compose -f docker-compose.prod.yml down
              exit 1
            fi

            # 发送通知
            curl -X POST "${{ secrets.SLACK_WEBHOOK }}" \
              -H 'Content-Type: application/json' \
              -d '{"text":"🚀 生产环境部署成功！\n版本：${{ needs.build-image.outputs.sha-tag }}"}'
```

### 2.3 Monorepo构建优化

```yaml
# .github/workflows/monorepo-ci.yml
name: Monorepo CI

on:
  push:
    branches: [main]
  pull_request:

env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}

jobs:
  # affected命令：只构建受影响的包
  build-affected:
    name: Build Affected
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - name: 检出代码
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # 需要完整历史来比较变更

      - name: 设置Node.js环境
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: 安装pnpm
        uses: pnpm/action-setup@v2
        with:
          version: '8'

      - name: 获取依赖
        run: pnpm install --frozen-lockfile

      - name: 安装Turborepo
        run: pnpm add -Dw turbo

      - name: 构建受影响的包
        run: pnpm turbo build --filter=...[HEAD^1]

      - name: 上传构建产物
        uses: actions/upload-artifact@v4
        with:
          name: build-artifacts
          path: |
            apps/*/dist/
            packages/*/dist/
          retention-days: 3

  # 全量构建（主分支）
  build-all:
    name: Build All
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 设置Node.js环境
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: 安装pnpm
        uses: pnpm/action-setup@v2
        with:
          version: '8'

      - name: 获取依赖
        run: pnpm install --frozen-lockfile

      - name: 安装Turborepo
        run: pnpm add -Dw turbo

      - name: 全量构建
        run: pnpm turbo build

      - name: 推送构建产物到缓存
        uses: actions/upload-artifact@v4
        with:
          name: build-artifacts-full
          path: |
            apps/*/dist/
            packages/*/dist/
```

---

## 三、自托管Runner深度配置

### 3.1 Runner部署

#### Linux Runner配置

```bash
#!/bin/bash
# install-runner.sh

set -e

RUNNER_VERSION="2.317.0"
RUNNER_USER="github-runner"
RUNNER_DIR="/opt/actions-runner"
REPO_URL="https://github.com/your-org/your-repo"
TOKEN="YOUR-REGISTRATION-TOKEN"

# 创建专用用户
useradd -m -s /bin/bash $RUNNER_USER

# 创建目录
mkdir -p $RUNNER_DIR
cd $RUNNER_DIR

# 下载Runner
curl -o actions-runner.tar.gz -L \
  "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"

# 解压
tar xzf actions-runner.tar.gz
rm actions-runner.tar.gz

# 设置权限
chown -R $RUNNER_USER:$RUNNER_USER $RUNNER_DIR

# 配置Runner
cd $RUNNER_DIR
su - $RUNNER_USER -c "./config.sh --url $REPO_URL --token $TOKEN --runnergroup Default --labels self-hosted,linux --work _work"

# 安装为服务
./svc.sh install $RUNNER_USER
./svc.sh start

# 验证状态
./svc.sh status
```

#### Docker Runner配置

```dockerfile
# Dockerfile.actions-runner
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV RUNNER_VERSION="2.317.0"
ENV RUNNER_DIR="/actions-runner"

# 安装基础工具
RUN apt-get update && apt-get install -y \
    curl \
    git \
    docker.io \
    && rm -rf /var/lib/apt/lists/*

# 创建用户
RUN useradd -m -s /bin/bash runner

# 下载Runner
RUN curl -o /tmp/actions-runner.tar.gz -L \
    "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz" \
    && tar xzf /tmp/actions-runner.tar.gz -C /opt \
    && rm /tmp/actions-runner.tar.gz \
    && mkdir -p $RUNNER_DIR

WORKDIR $RUNNER_DIR

# 复制入口脚本
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# 切换用户
USER runner

ENTRYPOINT ["/entrypoint.sh"]
```

```bash
# docker-compose.yml
version: '3.8'

services:
  actions-runner:
    build: .
    container_name: github-actions-runner
    environment:
      - REPO_URL=${REPO_URL}
      - RUNNER_TOKEN=${RUNNER_TOKEN}
      - RUNNER_LABELS=${RUNNER_LABELS:-self-hosted}
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - runner-data:/actions-runner
    restart: unless-stopped

volumes:
  runner-data:
```

### 3.2 Runner安全配置

```yaml
# workflow使用标签选择Runner
jobs:
  secure-build:
    name: Secure Build
    runs-on: [self-hosted, linux, x64, production]
    # 仅使用生产环境的Runner

    # 限制工作目录
    defaults:
      run:
        working-directory: /home/runner/_work

    # 环境变量限制
    env:
      ACTIONS_RUNTIME_URL: ${{ github.server_url }}/_apis/runtime
      GITHUB_ACTIONS: true

    steps:
      - name: 验证环境
        run: |
          # 验证工作目录
          if [ "$PWD" != "/home/runner/_work" ]; then
            echo "错误：不在允许的工作目录"
            exit 1
          fi

          # 验证用户
          whoami
          # 应该输出：runner

      - name: 检出代码
        uses: actions/checkout@v4
        with:
          persist-credentials: false

      - name: 构建
        run: |
          # 构建操作
          pnpm install
          pnpm build
```

---

## 四、CI/CD安全最佳实践

### 4.1 敏感信息管理

#### GitHub Secrets

```yaml
# 使用Secrets存储敏感信息
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production  # 需要在GitHub中配置环境
    steps:
      - name: 部署
        env:
          # 直接注入Secrets
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          API_KEY: ${{ secrets.API_KEY }}
        run: |
          aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID
          aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
          ./deploy.sh
```

#### 敏感信息检查

```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  push:
    branches: [main]
  pull_request:

jobs:
  secrets-scan:
    name: Secret Scanning
    runs-on: ubuntu-latest
    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 运行Trufflehog扫描
        uses: aquasecurity/trufflehog-action@main
        with:
          path: ./
          base_depth: 2
          max_depth: 5
          no-verification: false

  dependency-scan:
    name: Dependency Audit
    runs-on: ubuntu-latest
    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 设置Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: 安装pnpm
        uses: pnpm/action-setup@v2

      - name: 依赖审计
        run: pnpm audit

      - name: 许可检查
        run: pnpm dlx license-check-and-add-plugin check -a

  code-scan:
    name: Code Security Scan
    runs-on: ubuntu-latest
    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 运行Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >
            p/owasp-top-ten
            p/nodejs
            p/react
```

### 4.2 pull_request_target安全

**警告**：`pull_request_target`存在安全风险，谨慎使用！

```yaml
# ❌ 危险配置
jobs:
  dangerous:
    runs-on: ubuntu-latest
    # 如果代码来自fork仓库，这会在主分支上下文运行
    # 可能导致恶意代码访问Secrets
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
        with:
          # 这会检出PR分支的代码
          ref: ${{ github.event.pull_request.head.ref }}
          # 这会在主分支上下文运行（危险！）
          repository: ${{ github.event.pull_request.head.repo.full_name }}
```

```yaml
# ✅ 安全配置
jobs:
  safe:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
        with:
          # 只在PR发起者的分支上下文运行
          ref: ${{ github.event.pull_request.head.ref }}
          # 如果是fork，会在只读模式下检出
          # 无法访问Secrets
          persist-credentials: false

      - name: 安全分析
        run: |
          # 只进行只读操作
          # 不能访问Secrets
          # 不能推送代码
          echo "只读分析"
```

---

## 五、面试核心问题

### 问题一：GitHub Actions的trigger类型有哪些？

**参考答案**：

1. **push**：代码推送触发
   - branches: 分支过滤
   - paths: 路径过滤
   - tags: 标签过滤

2. **pull_request**：PR事件触发
   - types: opened, closed, synchronize等

3. **schedule**：定时触发
   - 使用cron表达式

4. **workflow_dispatch**：手动触发
   - 支持输入参数

5. **repository_dispatch**：API触发
   - 自定义事件类型

6. **issue_comment**：Issue评论触发

### 问题二：如何优化GitHub Actions的执行效率？

**参考答案**：

1. **并行执行**：
   ```yaml
   jobs:
     job1: ...
     job2: ...  # 并行执行
   ```

2. **缓存依赖**：
   ```yaml
   - uses: actions/cache@v4
     with:
       path: node_modules
       key: ${{ runner.os }}-pnpm-${{ hashFiles('pnpm-lock.yaml') }}
   ```

3. **跳过不必要的运行**：
   ```yaml
   if: contains(github.event.head_commit.message, '[skip ci]') == false
   ```

4. **使用affected命令**：
   ```yaml
   - run: pnpm turbo build --filter=...[HEAD^1]
   ```

### 问题三：如何处理CI/CD中的Secrets安全？

**参考答案**：

1. **绝不将Secrets硬编码**
2. **使用GitHub Secrets存储**
3. **限制Secrets访问范围**（environment）
4. **使用只读token**
5. **避免使用pull_request_target**
6. **定期轮换Secrets**
7. **启用审计日志**
