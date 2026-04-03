# GitOps与自动化部署完全指南

## 前言：什么是GitOps？

想象一下，你经营一家餐厅。以前每次有新菜品，你需要亲自去厨房告诉厨师怎么做。但现在，你只需要把菜谱（Recipe）放在一个公开的地方，厨师会根据菜谱自动准备好菜品。这就是GitOps的核心思想——**用Git仓库作为唯一的真相来源（Single Source of Truth），让部署过程像"照着菜谱做菜"一样自动化**。

在软件开发中，这意味着：
- 代码仓库不仅存储代码，还存储了"如何部署"的声明
- 每次代码变更都会自动触发部署流程
- 部署历史可以被审计和回滚
- 你可以像管理代码一样管理基础设施

## 一、Git工作流详解

### 1.1 为什么需要Git工作流？

想象一个篮球队没有战术配合，每个人拿到球就自己投。结果会怎样？混乱、冲突、效率低下。Git工作流就是球队的战术手册，确保团队成员有序地"传球"（代码合并），避免"打架"（合并冲突）。

### 1.2 主流Git工作流对比

| 工作流 | 适用场景 | 复杂度 | 团队规模 |
|--------|----------|--------|----------|
| **Git Flow** | 有明确发版周期的项目 | 高 | 中大型团队 |
| **GitHub Flow** | 持续交付的Web应用 | 低 | 小团队 |
| ** trunk-based** | 追求高速迭代的团队 | 中 | 大型团队 |
| **One Flow** | 简化版的Git Flow | 中 | 中型团队 |

### 1.3 Git Flow实战详解

#### 核心分支结构

```
                                    发布分支 (release/1.0.0)
                                   /
                                  /
主分支 (master/main) ─────────────────────────► 发布合并
                                  \            /
                                   \          /
                                    \        /
开发分支 (develop) ◄────────────────────────┘
     │
     ├─── 功能分支 (feature/user-login)
     ├─── 功能分支 (feature/payment)
     └─── 功能分支 (feature/notification)
```

#### 各分支职责

```bash
# 主分支 (master/main)：永远是生产环境可部署状态
# 规则：永远不从功能分支直接合并，只有发布分支和hotfix可以合并

# 开发分支 (develop)：集成了所有已完成的特性
# 规则：所有功能分支都从这里创建，也合并回这里

# 功能分支 (feature/*)：开发新特性
# 规则：从develop创建，完成后合并回develop

# 发布分支 (release/*)：准备发布的版本
# 规则：从develop创建，用于最后的bug修复和版本号调整

# 热修复分支 (hotfix/*)：紧急修复生产问题
# 规则：从master创建，完成后同时合并到master和develop
```

#### 实际操作演示

```bash
# ========== 场景1：从零开始开发新功能 ==========

# 1. 首先确保开发分支是最新的
git checkout develop
git pull origin develop

# 2. 创建功能分支（基于最新的develop）
git checkout -b feature/user-login

# 3. 开始开发...（写代码过程）
# ... 修改文件，提交代码 ...

# 提交规范：使用Conventional Commits
git commit -m "feat: 添加用户登录功能"
git commit -m "feat: 实现记住密码功能"
git commit -m "fix: 修复登录超时问题"

# 4. 功能开发完成，同步最新的develop（变基操作）
git fetch origin
git rebase origin/develop

# 5. 合并到develop（推荐使用--no-ff，保留分支历史）
git checkout develop
git merge --no-ff feature/user-login

# 6. 删除功能分支
git branch -d feature/user-login
git push origin --delete feature/user-login

# ========== 场景2：准备发布版本 ==========

# 1. 从develop创建发布分支
git checkout develop
git pull origin develop
git checkout -b release/1.0.0

# 2. 在发布分支进行最后的调整
# 修改版本号、更新CHANGELOG、修复小bug
git commit -m "chore: 更新版本号为1.0.0"
git commit -m "fix: 修复文档中的拼写错误"

# 3. 测试完成后，合并到master
git checkout master
git merge --no-ff release/1.0.0 --no-edit

# 4. 给发布打标签（重要！）
git tag -a v1.0.0 -m "发布版本1.0.0，包含用户登录、记住密码功能"

# 5. 合并回develop（保持develop同步）
git checkout develop
git merge --no-ff release/1.0.0 --no-edit

# 6. 删除发布分支
git branch -d release/1.0.0

# ========== 场景3：紧急修复生产Bug ==========

# 1. 从master创建hotfix分支
git checkout master
git pull origin master
git checkout -b hotfix/login-crash

# 2. 紧急修复...
git commit -m "fix: 修复登录页面崩溃问题"

# 3. 同时合并到master和develop
git checkout master
git merge --no-ff hotfix/login-crash --no-edit
git tag -a v1.0.1 -m "紧急修复登录崩溃问题"

git checkout develop
git merge --no-ff hotfix/login-crash --no-edit

# 4. 删除hotfix分支
git branch -d hotfix/login-crash
```

### 1.4 GitHub Flow详解

GitHub Flow是更轻量的选择，适合持续部署的Web应用。它的核心思想是：**任何分支都可以随时部署**。

```bash
# ========== GitHub Flow 工作流程 ==========

# 1. 创建分支（永远是针对master/main创建）
git checkout main
git pull origin main
git checkout -b feature/amazing-feature

# 2. 开发并提交
git commit -m "feat: 添加酷炫功能"

# 3. 推送分支
git push origin feature/amazing-feature

# 4. 创建Pull Request（PR）
# 在GitHub/GitLab上操作：
# - 描述改动内容
# - 指定reviewer
# - 关联相关Issue

# 5. 代码审查
# - reviewer提出建议
# - 开发者根据建议修改
# - 再次提交（自动追加到同一个PR）

# 6. 合并删除分支
# - 点击"Merge"按钮
# - 自动删除源分支
```

### 1.5 Commit Message 规范

好的提交信息就像好的日记，让未来的你和他人都能理解当时的决策。

```bash
# ========== Conventional Commits 规范 ==========

# 格式：<type>(<scope>): <subject>
#        ↑类型   ↑范围    ↑描述

# type 类型说明：
# feat:     新功能
# fix:      修复bug
# docs:     文档变更
# style:    代码格式（不影响功能）
# refactor: 重构（不是新功能也不是修复）
# perf:     性能优化
# test:     测试相关
# chore:    构建/工具相关

# ========== 实战示例 ==========

# ✅ 正确示例
git commit -m "feat(auth): 添加微信扫码登录功能"
git commit -m "fix(dashboard): 修复图表数据刷新不及时的问题"
git commit -m "docs: 更新API接口文档"
git commit -m "refactor(utils): 简化日期格式化函数"

# ❌ 错误示例
git commit -m "更新代码"
git commit -m "fix bug"
git commit -m "WIP"
git commit -m "asdfghjkl"
```

## 二、自动化构建

### 2.1 什么是自动化构建？

把自动化构建想象成**流水线的机器人**。没有自动化时：
- 程序员手动打包 → 手动上传服务器 → 手动重启服务
- 半夜发布？程序员得守着
- 发布错了？人肉回滚

有了自动化构建：
- 代码提交 → 机器人自动完成所有构建部署步骤
- 发布变成了一键操作（或者自动触发）
- 任何时候都可以安全、快速地发布

### 2.2 前端构建流程

```yaml
# .github/workflows/frontend-build.yml
# GitHub Actions 配置示例

name: 前端构建流水线

on:
  # 当develop分支有push时触发
  push:
    branches: [develop]
  # 当有新的PR时触发
  pull_request:
    branches: [main, develop]

env:
  # 环境变量（敏感信息用Secrets）
  NODE_VERSION: '20.14.0'
  REGISTRY: ghcr.io

jobs:
  # ========== Job 1: 代码质量检查 ==========
  lint:
    name: 代码质量检查
    runs-on: ubuntu-latest

    steps:
      # 1. 拉取代码
      - name: 拉取代码
        uses: actions/checkout@v4

      # 2. 设置Node环境
      - name: 设置Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'  # 缓存依赖加速

      # 3. 安装依赖
      - name: 安装依赖
        run: npm ci  # 使用package-lock.json确保一致性

      # 4. 执行ESLint检查
      - name: 执行代码检查
        run: npm run lint

      # 5. 执行TypeScript类型检查
      - name: 类型检查
        run: npm run type-check

  # ========== Job 2: 单元测试 ==========
  test:
    name: 单元测试
    runs-on: ubuntu-latest
    needs: lint  # 依赖lint job

    steps:
      - name: 拉取代码
        uses: actions/checkout@v4

      - name: 设置Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: 安装依赖
        run: npm ci

      # 执行Vitest单元测试
      - name: 运行单元测试
        run: npm run test:unit

      # 上传测试覆盖率报告
      - name: 上传覆盖率报告
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          flags: unittests

  # ========== Job 3: 构建Docker镜像 ==========
  build:
    name: 构建Docker镜像
    runs-on: ubuntu-latest
    needs: test  # 依赖test job
    if: github.event_name == 'push' && github.ref == 'refs/heads/develop'

    steps:
      - name: 拉取代码
        uses: actions/checkout@v4

      # 1. 登录容器仓库
      - name: 登录到容器仓库
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      # 2. 设置Docker构建参数
      - name: 设置构建参数
        id: meta
        run: |
          # 获取短commit SHA作为镜像标签
          IMAGE_TAG=$(echo "${{ github.sha }}" | cut -c1-7)
          echo "image_tag=$IMAGE_TAG" >> $GITHUB_OUTPUT
          echo "image_repo=${{ env.REGISTRY }}/${{ github.repository }}/frontend" >> $GITHUB_OUTPUT

      # 3. 构建并推送镜像
      - name: 构建镜像
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: true
          tags: |
            ${{ steps.meta.outputs.image_repo }}:latest
            ${{ steps.meta.outputs.image_repo }}:${{ steps.meta.outputs.image_tag }}
          cache-from: type=gha  # 使用GitHub Actions缓存
          cache-to: type=gha,mode=max

  # ========== Job 4: 部署到测试环境 ==========
  deploy-staging:
    name: 部署到测试环境
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/develop'

    environment:
      name: staging
      url: https://staging.example.com

    steps:
      - name: 部署到测试环境
        run: |
          # 调用部署脚本
          ./scripts/deploy.sh staging ${{ needs.build.outputs.image_tag }}

        env:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          DEPLOY_HOST: ${{ secrets.STAGING_HOST }}

# ========== 触发条件说明 ==========
# on.push.branches: 只有指定分支有push时触发
# on.pull_request: PR创建或更新时触发
# needs: xxx: 设置job依赖，确保顺序执行
# if: condition: 条件触发，比如只在特定分支触发
```

### 2.3 后端构建流程

```yaml
# .github/workflows/backend-deploy.yml

name: 后端构建部署

on:
  push:
    branches: [main, develop]
  release:
    types: [published]  # 当GitHub Release发布时触发

env:
  NODE_VERSION: '20.14.0'
  REGISTRY: ghcr.io

jobs:
  # ========== Job 1: 代码检查 ==========
  quality:
    name: 代码质量
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: 使用Docker运行ESLint
        run: |
          docker run --rm \
            -v ${{ github.workspace }}:/app \
            -w /app \
            node:${NODE_VERSION}-alpine \
            npm run lint

  # ========== Job 2: 构建镜像并推送到仓库 ==========
  build-and-push:
    name: 构建镜像
    runs-on: ubuntu-latest
    needs: quality

    steps:
      - name: 拉取代码
        uses: actions/checkout@v4

      # 构建并推送后端NestJS镜像
      - name: 构建镜像
        run: |
          docker build \
            --tag ${{ env.REGISTRY }}/${{ github.repository }}/backend:${{ github.sha }} \
            --tag ${{ env.REGISTRY }}/${{ github.repository }}/backend:latest \
            ./backend

      - name: 推送镜像
        run: |
          echo "${{ secrets.GITHUB_TOKEN }}" | docker login ${{ env.REGISTRY }} -u "${{ github.actor }}" --password-stdin
          docker push --all-tags ${{ env.REGISTRY }}/${{ github.repository }}/backend

  # ========== Job 3: 部署到生产环境 ==========
  deploy-production:
    name: 部署生产环境
    runs-on: ubuntu-latest
    needs: build-and-push
    if: github.ref == 'refs/heads/main'

    environment:
      name: production
      url: https://api.example.com

    steps:
      - name: 执行部署
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.PROD_HOST }}
          username: deploy
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            # 登录镜像仓库
            docker login ${{ env.REGISTRY }} -u "${{ github.actor }}" -p "${{ secrets.GITHUB_TOKEN }}"

            # 拉取最新镜像
            docker pull ${{ env.REGISTRY }}/${{ github.repository }}/backend:latest

            # 停止旧容器
            docker-compose -f /opt/app/docker-compose.yml down

            # 启动新容器
            docker-compose -f /opt/app/docker-compose.yml up -d

            # 清理旧镜像
            docker image prune -f

# ========== docker-compose 生产配置 ==========
# docker-compose.prod.yml

version: '3.8'

services:
  backend:
    image: ${REGISTRY}/example/backend:latest
    container_name: nestjs-backend
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./logs:/app/logs
      - /etc/localtime:/etc/localtime:ro
    networks:
      - backend-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    container_name: nginx-proxy
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
    networks:
      - backend-network

networks:
  backend-network:
    driver: bridge
```

## 三、部署流水线

### 3.1 流水线的核心概念

把部署流水线想象成**汽车生产线**：
- 每一道工序（Stage）都是标准化的
- 每辆车（应用）都要经过相同的工序
- 发现问题可以及时回退到上一步
- 最终输出的是检验合格的"整车"（可部署的应用）

```
代码提交 → 自动化检查 → 构建镜像 → 部署测试 → 部署预发 → 部署生产
   │            │            │           │          │          │
   ▼            ▼            ▼           ▼          ▼          ▼
 触发源      质量门禁      产物生成     验证通过   最终检验   用户可用
```

### 3.2 多环境部署策略

```bash
# ========== 环境划分 ==========
#
# 开发环境 (dev):     开发人员日常测试，频繁部署
# 测试环境 (test):     QA团队进行系统测试
# 预发布环境 (staging): 生产环境的镜像，发布前最后验证
# 生产环境 (prod):     真实用户使用的环境，最谨慎的部署

# ========== 环境配置管理 ==========

# 1. 环境变量文件模板（.env.example）
# 团队成员复制这份文件，填入自己的本地值

# 应用配置
NODE_ENV=development
PORT=3000
API_BASE_URL=http://localhost:8080

# 数据库配置
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=myapp_dev
DATABASE_USER=dev_user
DATABASE_PASSWORD=  # 留空，本地填写

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379

# 第三方服务（测试key）
STRIPE_TEST_KEY=sk_test_xxxxx
SENDGRID_API_KEY=SG.xxxxx

# ========== 敏感信息处理 ==========

# 绝对不提交到Git的内容：
# 1. .env 文件（包含真实密钥）
# 2. *.pem, *.key 文件（证书私钥）
# 3. credentials.json（云服务账号）
# 4. node_modules/（依赖包太大）
# 5. .next/, dist/（构建产物）

# 正确做法：
# 1. .env 文件加入 .gitignore
# 2. 使用1Password/HashiCorp Vault管理密钥
# 3. CI/CD配置中使用Secrets
```

### 3.3 蓝绿部署

蓝绿部署就像**切换电灯开关**——新旧版本同时存在，通过切换流量实现无缝过渡。

```bash
# ========== 蓝绿部署架构 ==========
#
#                    ┌─ 绿色服务 (v1.0.0) ─┐
# 负载均衡器 ─────────│                      │──► 用户请求
#                    └─ 蓝色服务 (v1.1.0) ─┘
#                           ↑
#                       新版本在此部署
#
# 切换时：负载均衡器指向蓝色
# 回滚时：负载均衡器指向绿色

# ========== Kubernetes 蓝绿部署配置 ==========

# blue-green-deploy.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-blue
  labels:
    app: myapp
    color: blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
      color: blue
  template:
    metadata:
      labels:
        app: myapp
        color: blue
    spec:
      containers:
      - name: myapp
        image: myapp:1.0.0  # 旧版本
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-green
  labels:
    app: myapp
    color: green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
      color: green
  template:
    metadata:
      labels:
        app: myapp
        color: green
    spec:
      containers:
      - name: myapp
        image: myapp:1.1.0  # 新版本
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"

---
# Service保持不变，永远指向带有特定标签的Pod
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
spec:
  selector:
    app: myapp
    # 切换 color 标签即可切换版本
    color: blue
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: LoadBalancer

# ========== 蓝绿切换脚本 ==========
# switch-blue-green.sh

#!/bin/bash
# 蓝绿部署切换脚本

set -e

COLOR=${1:-green}  # 默认为切换到绿色（新版本）
NAMESPACE=${2:-default}

echo "正在切换到 $COLOR 版本..."

# 切换Service的selector
kubectl patch service myapp-service \
  -n $NAMESPACE \
  --type='json' \
  -p="[{'op': 'replace', 'path': '/spec/selector/color', 'value': '$COLOR'}]"

# 等待切换完成
echo "等待服务就绪..."
kubectl rollout status deployment/myapp-$COLOR -n $NAMESPACE

# 验证服务
echo "验证服务健康状态..."
sleep 5
curl -f http://myapp-service/health || exit 1

echo "✅ 切换成功！现在流量指向 $COLOR 版本"

# 如果需要回滚，执行：
# ./switch-blue-green.sh blue
```

### 3.4 金丝雀发布

金丝雀发布就像**先放一只金丝雀去煤矿探路**——先让小部分用户使用新版本，观察没有问题后再全面推广。

```bash
# ========== 金丝雀发布策略 ==========
#
# 初始状态：100% 流量 → v1.0.0
#
# 第一阶段：10% 流量 → v1.1.0 (金丝雀)
#                    90% 流量 → v1.0.0
#
# 第二阶段：50% 流量 → v1.1.0
#                    50% 流量 → v1.1.0
#
# 第三阶段：100% 流量 → v1.1.0
# 旧版本下线

# ========== Kubernetes 金丝雀配置 ==========

# canary-deploy.yaml

apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-ingress
  annotations:
    # Nginx Ingress Controller的金丝雀注解
    nginx.ingress.kubernetes.io/canary: "true"
    # 流量权重分配（10%到新版本）
    nginx.ingress.kubernetes.io/canary-weight: "10"
    # 基于Header的流量分配（用于测试）
    # nginx.ingress.kubernetes.io/canary-by-header: "X-Canary"
spec:
  ingressClassName: nginx
  rules:
  - host: myapp.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: myapp-canary
            port:
              number: 80

---
# 主版本 Service
apiVersion: v1
kind: Service
metadata:
  name: myapp-stable
spec:
  selector:
    app: myapp
    version: stable  # 稳定版本标签
  ports:
  - port: 80
    targetPort: 8080

---
# 金丝雀版本 Service
apiVersion: v1
kind: Service
metadata:
  name: myapp-canary
spec:
  selector:
    app: myapp
    version: canary  # 金丝雀版本标签
  ports:
  - port: 80
    targetPort: 8080

# ========== 金丝雀自动化脚本 ==========
# canary-release.sh

#!/bin/bash
# 自动化金丝雀发布脚本

set -e

NEW_VERSION=${1:-1.1.0}
NAMESPACE=${2:-default}
AUTO_PROMOTE=${3:-false}  # 自动升级标志

# 部署金丝雀版本
echo "🚀 部署金丝雀版本 $NEW_VERSION..."
kubectl set image deployment/myapp canary=myapp:$NEW_VERSION -n $NAMESPACE

# 等待金丝雀就绪
kubectl rollout status deployment/myapp -n $NAMESPACE -w --timeout=120s

# 设置初始权重为10%
echo "⚖️  设置金丝雀权重为10%..."
kubectl annotate ingress myapp-ingress -n $NAMESPACE \
  nginx.ingress.kubernetes.io/canary-weight="10"

# 等待观察（默认5分钟）
echo "⏳ 观察金丝雀表现..."
sleep 300

# 检查金丝雀的错误率
ERROR_RATE=$(curl -s http://myapp-canary.$NAMESPACE/health | jq '.errorRate // 0')
if (( $(echo "$ERROR_RATE < 0.01" | bc -l) )); then
    echo "✅ 金丝雀表现良好，错误率: $ERROR_RATE"
else
    echo "❌ 金丝雀错误率过高: $ERROR_RATE"
    echo "🔄 自动回滚..."
    kubectl rollout undo deployment/myapp -n $NAMESPACE
    exit 1
fi

# 如果启用了自动升级
if [ "$AUTO_PROMOTE" = "true" ]; then
    echo "🔼 提升金丝雀为稳定版本..."

    # 逐步增加权重
    for WEIGHT in 30 50 70 100; do
        echo "⚖️  设置权重为 $WEIGHT%..."
        kubectl annotate ingress myapp-ingress -n $NAMESPACE \
          nginx.ingress.kubernetes.io/canary-weight="$WEIGHT"
        sleep 60
    done

    # 最终切换：更新所有Pod为新版本
    kubectl set image deployment/myapp canary=myapp:$NEW_VERSION -n $NAMESPACE
    kubectl rollout status deployment/myapp -n $NAMESPACE

    echo "✅ 金丝雀发布完成！"
else
    echo "📊 金丝雀版本运行中，手动确认后可继续升级"
fi
```

### 3.5 滚动更新

滚动更新是Kubernetes的默认部署策略，类似于**逐步替换队列**——新Pod慢慢增加，旧Pod慢慢减少。

```bash
# ========== 滚动更新配置 ==========
# 在Deployment中配置滚动更新策略

apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 6  # 期望6个Pod
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2        # 最多超出期望值2个Pod（即最多8个同时存在）
      maxUnavailable: 0 # 不能少于期望值（始终保持6个可用）

  # 滚动更新的工作原理：
  # 1. 先创建2个新Pod（maxSurge=2）
  # 2. 等待新Pod就绪
  # 3. 再创建2个新Pod
  # 4. 同时终止2个旧Pod（保持总数6个）
  # 5. 重复直到全部更新

  minReadySeconds: 30  # 新Pod至少运行30秒才认为就绪
```

## 四、环境变量管理

### 4.1 环境变量的重要性

环境变量就像应用程序的"**生命体征**"——它们决定了程序在什么环境下运行、连接什么外部服务、使用什么配置。管理好环境变量，就相当于管理好了应用程序的生命线。

### 4.2 多环境环境变量配置

```bash
# ========== 目录结构 ==========
#
# project/
# ├── .env                 # 本地开发默认值（提交到Git）
# ├── .env.local          # 本地覆盖值（不提交）
# ├── .env.development    # 开发环境覆盖
# ├── .env.test           # 测试环境覆盖
# ├── .env.staging        # 预发布环境覆盖
# ├── .env.production     # 生产环境覆盖
# └── .env.production.local # 生产环境本地覆盖（不提交）
#
# 加载优先级（后面的覆盖前面的）：
# .env < .env.local < 环境特定文件 < .env.{NODE_ENV}.local

# ========== .env 文件示例 ==========
# 基础配置（所有环境通用）

# 应用配置
NEXT_PUBLIC_APP_NAME=FastDocument
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_WS_URL=/ws

# 功能开关
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_DEBUG=false

# ========== .env.development 开发环境 ==========
# 开发环境特定配置

NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
NEXT_PUBLIC_ENABLE_DEBUG=true

# 开发数据库
DATABASE_URL=postgresql://dev:dev123@localhost:5432/fastdoc_dev

# 开发用的第三方服务（测试key）
STRIPE_TEST_KEY=sk_test_xxxxx
SENDGRID_API_KEY=SG.xxxxx

# ========== .env.production 生产环境 ==========
# 生产环境特定配置（实际密钥在CI/CD或Secret中注入）

NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.fastdoc.com/api
NEXT_PUBLIC_WS_URL=wss://api.fastdoc.com/ws
NEXT_PUBLIC_ENABLE_DEBUG=false

# 生产数据库（实际值在CI/CD Secrets中）
# DATABASE_URL 在部署时由CI/CD注入

# 功能开关
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# ========== 实战：在Next.js中使用环境变量 ==========

# 环境变量命名规范：
# NEXT_PUBLIC_ 前缀的变量会暴露给浏览器
# 没有前缀的变量只存在于服务端

# 1. 创建环境变量文件
# .env.local
DATABASE_URL=postgresql://user:pass@db:5432/myapp
JWT_SECRET=your-super-secret-jwt-key
API_KEY=sk_live_xxxxxxxxxxxxx

# 2. 在代码中使用
# lib/config.ts

// 获取环境变量，带类型检查
const config = {
  // 服务端配置（Node.js环境）
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  apiKey: process.env.API_KEY,

  // 客户端配置（暴露给浏览器）
  appName: process.env.NEXT_PUBLIC_APP_NAME,
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  wsUrl: process.env.NEXT_PUBLIC_WS_URL,
} as const;

// 验证必需的配置
export function validateConfig() {
  const required: (keyof typeof config)[] = [
    'databaseUrl',
    'jwtSecret',
    'appName',
    'apiUrl'
  ];

  for (const key of required) {
    if (!config[key]) {
      throw new Error(`缺少必需的环境变量: ${key}`);
    }
  }

  return config;
}

// 3. 在组件中使用
// components/ApiClient.tsx

"use client";

import { config } from '@/lib/config';

export function ApiClient() {
  // ✅ 正确：使用 NEXT_PUBLIC_ 前缀的变量
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // ❌ 错误：无法访问非 NEXT_PUBLIC_ 的变量
  // const dbUrl = process.env.DATABASE_URL; // undefined

  return <div>API: {apiUrl}</div>;
}
```

### 4.3 Docker环境变量管理

```bash
# ========== Docker 环境变量最佳实践 ==========

# 1. 使用docker-compose管理环境变量
# docker-compose.yml

version: '3.8'

services:
  app:
    image: myapp:latest
    environment:
      # 方式1：直接写死（非敏感配置）
      - NODE_ENV=production
      - PORT=3000
      - LOG_LEVEL=info

      # 方式2：从.env文件加载
      env_file:
        - .env.production

      # 方式3：引用系统环境变量（CI/CD注入）
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}

# 2. .env.production 文件（不上传到代码仓库）
# 这个文件应该通过安全渠道分发（如1Password、Vault）
NODE_ENV=production
DATABASE_URL=postgresql://prod_user:xxxxx@db.production:5432/myapp
REDIS_URL=redis://redis.production:6379
JWT_SECRET=production-secret-key-change-this

# 3. 生产环境启动脚本
# start.sh

#!/bin/bash

# 从AWS Secrets Manager获取密钥（示例）
# 实际项目中可使用HashiCorp Vault、Azure Key Vault等
AWS_REGION="us-east-1"
SECRET_NAME="myapp/production"

# 获取密钥
SECRETS=$(aws secretsmanager get-secret-value \
  --secret-id $SECRET_NAME \
  --region $AWS_REGION \
  --query 'SecretString' \
  --output text)

# 提取各个值
export DATABASE_URL=$(echo $SECRETS | jq -r '.DATABASE_URL')
export REDIS_URL=$(echo $SECRETS | jq -r '.REDIS_URL')
export JWT_SECRET=$(echo $SECRETS | jq -r '.JWT_SECRET')

# 启动应用
exec node /app/server.js
```

## 五、实战踩坑经验

### 5.1 Git Flow踩坑记录

```bash
# ========== 踩坑1：合并冲突处理不当 ==========
# 错误做法：直接用master分支强制覆盖develop

git checkout develop
git merge -X theirs master  # ❌ 这会丢失develop的改动

# 正确做法：先变基，再合并

git checkout develop
git rebase origin/develop  # 先同步最新的develop
git checkout feature/xxx
git rebase develop         # 把功能分支变基到最新develop

# 如果有冲突，逐个解决：
git add <resolved-file>
git rebase --continue

# ========== 踩坑2：Hotfix没有同步到develop ==========
# 问题：只在master合并了hotfix，develop还是旧代码

# 正确做法：hotfix要同时合并到master和develop

git checkout master
git merge --no-ff hotfix/xxx
git tag -a v1.0.1 -m "Hotfix: 修复严重bug"

git checkout develop
git merge --no-ff hotfix/xxx  # 关键：也要合并到develop

# ========== 踩坑3：发布分支删除了，但还需要紧急修复 ==========
# 解决：可以从tag重新创建hotfix分支

git checkout v1.0.0
git checkout -b hotfix/fix-release-issue
# 修复后合并到master和develop
```

### 5.2 CI/CD踩坑记录

```yaml
# ========== 踩坑1：缓存导致构建问题 ==========
# 问题：依赖更新了但缓存没更新，导致构建失败

# 解决：正确配置缓存策略

- name: 安装依赖
  uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      .next/cache
    key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-npm-
      ${{ runner.os }}-

# 关键：改变代码结构后要清除缓存
# 在PR中添加 comment 或手动触发清除

# ========== 踩坑2：环境变量在构建时访问不到 ==========
# 问题：NEXT_PUBLIC_变量在运行时才生效，但构建时就需要知道值

# 解决：在构建时传入环境变量

- name: 构建
  run: |
    NEXT_PUBLIC_API_URL=${{ secrets.STAGING_API_URL }} \
    npm run build

# 注意：.env.production文件不会在CI/CD中自动加载
# 必须显式传入

# ========== 踩坑3：生产部署时数据库迁移失败 ==========
# 问题：新版本需要数据库迁移，但容器已经启动

# 解决：使用init容器执行迁移

initContainers:
  - name: db-migrate
    image: myapp:latest
    command: ['npx', 'prisma', 'migrate', 'deploy']
    env:
      - name: DATABASE_URL
        valueFrom:
          secretKeyRef:
            name: db-credentials
            key: url

# 或者使用Kubernetes Job在部署前执行迁移
```

### 5.3 环境变量踩坑记录

```bash
# ========== 踩坑1：.env文件被提交到Git ==========
# 解决：确保.gitignore正确配置

# .gitignore
.env
.env.local
.env.*.local
!.env.example  # 但保留示例文件

# 已经提交了？紧急删除：
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all
git push origin --force --all

# ========== 踩坑2：Windows和Unix换行符不一致 ==========
# 问题：.env文件在Windows创建时有\r\n，导致读取异常

# 解决：
# 1. 设置git自动转换
git config core.autocrlf true

# 2. 或者在Docker中处理
RUN apt-get update && apt-get install -y dos2unix
RUN dos2unix /app/.env

# ========== 踩坑3：变量值包含特殊字符 ==========
# 问题：密码包含#或$等特殊字符，被shell解释

# 解决：使用引号并转义

# .env文件
DATABASE_PASSWORD="p@ss#word\$123"

# docker-compose.yml
environment:
  - DATABASE_PASSWORD=p@ss#word\$123  # 需要转义
# 或者
env_file:
  - .env  # 从文件读取则不需要转义
```

## 六、完整自动化部署实战

### 6.1 项目结构

```
myproject/
├── .github/
│   └── workflows/
│       ├── ci.yml          # 持续集成流水线
│       └── deploy.yml       # 部署流水线
├── scripts/
│   ├── deploy.sh            # 部署脚本
│   ├── rollback.sh          # 回滚脚本
│   └── health-check.sh      # 健康检查
├── docker/
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
├── docker-compose.prod.yml
└── .env.example
```

### 6.2 完整部署脚本

```bash
#!/bin/bash
# deploy.sh - 自动化部署脚本

set -e  # 任何命令失败就退出

# ========== 配置 ==========
APP_NAME="myapp"
REGISTRY="ghcr.io/example"
NAMESPACE="production"
DEPLOY_TIME=$(date +%Y%m%d_%H%M%S)

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ========== 参数解析 ==========
if [ $# -lt 1 ]; then
    echo "用法: $0 <版本号> [--rollback]"
    echo "示例: $0 v1.0.0"
    exit 1
fi

VERSION=$1
ROLLBACK=false
if [ "$2" = "--rollback" ]; then
    ROLLBACK=true
    log_warn "执行回滚操作..."
fi

# ========== 前置检查 ==========
log_info "执行前置检查..."

# 检查必要的命令
for cmd in kubectl docker helm; do
    if ! command -v $cmd &> /dev/null; then
        log_error "$cmd 命令未找到，请安装"
        exit 1
    fi
done

# 检查kubectl连接
if ! kubectl get nodes &> /dev/null; then
    log_error "无法连接到Kubernetes集群"
    exit 1
fi

# ========== 执行部署 ==========
log_info "开始部署 $APP_NAME:$VERSION 到 $NAMESPACE 环境"

# 1. 拉取最新镜像
log_info "拉取镜像..."
docker pull $REGISTRY/$APP_NAME:$VERSION

# 2. 更新Kubernetes Deployment
log_info "更新Deployment..."
kubectl set image deployment/$APP_NAME \
    $APP_NAME=$REGISTRY/$APP_NAME:$VERSION \
    -n $NAMESPACE

# 3. 等待滚动更新完成
log_info "等待Pod就绪（最多10分钟）..."
kubectl rollout status deployment/$APP_NAME \
    -n $NAMESPACE \
    --timeout=600s

# 4. 执行健康检查
log_info "执行健康检查..."
./scripts/health-check.sh $NAMESPACE

# 5. 记录部署历史
log_info "记录部署历史..."
echo "$DEPLOY_TIME $VERSION $NAMESPACE" >> /var/log/deploy.log

# ========== 完成 ==========
log_info "✅ 部署完成！"
log_info "版本: $VERSION"
log_info "环境: $NAMESPACE"
log_info "时间: $DEPLOY_TIME"
```

### 6.3 健康检查脚本

```bash
#!/bin/bash
# health-check.sh - 应用健康检查脚本

set -e

NAMESPACE=${1:-default}
APP_NAME="myapp"
MAX_RETRIES=30
RETRY_INTERVAL=10

# 等待服务就绪
log_info "等待服务就绪..."

for i in $(seq 1 $MAX_RETRIES); do
    # 检查Pod是否running
    RUNNING=$(kubectl get pods -n $NAMESPACE \
        -l app=$APP_NAME \
        -o jsonpath='{.items[*].status.phase}' \
        | grep -c "Running" || true)

    if [ "$RUNNING" -gt 0 ]; then
        log_info "✅ Pod已运行"
        break
    fi

    if [ $i -eq $MAX_RETRIES ]; then
        log_error "❌ Pod启动超时"
        kubectl describe pods -n $NAMESPACE -l app=$APP_NAME
        exit 1
    fi

    log_info "等待中... ($i/$MAX_RETRIES)"
    sleep $RETRY_INTERVAL
done

# 检查健康端点
log_info "检查健康端点..."

SERVICE_IP=$(kubectl get svc $APP_NAME -n $NAMESPACE \
    -o jsonpath='{.spec.clusterIP}')

for i in $(seq 1 $MAX_RETRIES); do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        http://$SERVICE_IP:3000/health || echo "000")

    if [ "$HTTP_CODE" = "200" ]; then
        log_info "✅ 健康检查通过"
        exit 0
    fi

    if [ $i -eq $MAX_RETRIES ]; then
        log_error "❌ 健康检查失败 (HTTP $HTTP_CODE)"
        exit 1
    fi

    log_info "重试中... ($i/$MAX_RETRIES)"
    sleep $RETRY_INTERVAL
done
```

## 七、总结与最佳实践

### 7.1 GitOps核心原则

1. **单一真相来源**：Git仓库是代码、环境配置、部署配置的唯一真相来源
2. **声明式部署**：描述"想要什么状态"，而不是"如何执行步骤"
3. **自动化一切**：减少人工干预，降低人为错误
4. **可审计性**：所有变更都有记录，可追溯
5. **快速回滚**：出现问题能快速恢复到上一个稳定状态

### 7.2 部署策略选择指南

| 场景 | 推荐策略 | 原因 |
|------|----------|------|
| 核心业务系统 | 蓝绿部署 | 切换快，回滚快，无停机 |
| 新功能灰度测试 | 金丝雀发布 | 可控的流量分配，快速验证 |
| 无状态微服务 | 滚动更新 | 资源利用率高，自动化程度高 |
| 数据库密集型应用 | 手动部署 | 需要更多控制 |

### 7.3 关键检查清单

```
部署前检查：
[ ] 代码已经过代码审查
[ ] 所有测试通过
[ ] 文档已更新（如需要）
[ ] 数据库迁移脚本准备（如需要）
[ ] 回滚计划已准备
[ ] 监控告警已配置
[ ] 相关人员已通知

部署后检查：
[ ] 健康检查通过
[ ] 基础功能正常
[ ] 错误率未上升
[ ] 响应时间未明显变慢
[ ] 日志无异常
[ ] 监控仪表盘正常
```

记住：**部署不仅是技术工作，更是流程和沟通的工作**。好的GitOps实践让部署变得可预测、可控制、可重复。
