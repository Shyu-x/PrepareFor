# CI/CD流水线设计完全指南

## 前言：为什么需要CI/CD？

想象一下，你是一个餐厅的厨师长。每天需要准备100道菜给客人。如果每道菜都要你亲自：
1. 去市场买菜
2. 洗菜切菜
3. 烹饪
4. 摆盘
5. 端给客人

你会累死，而且效率极低。

软件交付也是同理。传统方式是：
1. 开发人员手动打包代码
2. 上传到服务器
3. 手动运行测试
4. 手动部署

这套流程不仅繁琐，还容易出错。

**CI/CD就是让这个过程自动化**：
- **CI (Continuous Integration)**：持续集成 - 代码提交后自动构建和测试
- **CD (Continuous Deployment)**：持续部署 - 测试通过后自动发布到环境

就像餐厅引入了流水线系统：厨师只管做菜，洗菜切菜由机器完成，菜品自动传送到客人桌上。

---

## 一、CI/CD核心概念

### 1.1 持续集成（CI）是什么？

持续集成的核心理念是：**频繁地将代码合并到主分支，每次合并都自动验证**。

```
传统开发流程：
开发A ──→ 开发B ──→ 开发C ──→ ... ──→ 最终合并 ──→ 测试
    \         \         \
     └─────────┴─────────┴──────→ 冲突！冲突！冲突！

CI流程：
开发A ──→ 提交 ──→ 自动测试 ──→ 通过 ──→ 合并
开发B ──→ 提交 ──→ 自动测试 ──→ 通过 ──→ 合并
开发C ──→ 提交 ──→ 自动测试 ──→ 通过 ──→ 合并

每次合并都小量，风险可控
```

### 1.2 持续交付 vs 持续部署

| 概念 | 描述 | 自动化程度 |
|------|------|-----------|
| **持续集成** | 代码提交后自动构建和测试 | 构建和测试自动化 |
| **持续交付 (CD)** | 测试通过后自动部署到测试环境 | + 部署测试环境自动化 |
| **持续部署 (CD)** | 测试通过后自动部署到生产环境 | ++ 部署生产环境自动化 |

```
CI/CD流程：

代码提交 → 自动化构建 → 自动化测试 → 持续交付
                                            ↓
                                     部署到测试环境
                                            ↓
                                     人工审核（如需要）
                                            ↓
                                     持续部署
                                            ↓
                                     部署到生产环境
```

### 1.3 CI/CD的三大好处

```
┌─────────────────────────────────────────────────────────────┐
│                    CI/CD 的核心价值                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 1. 快速反馈：问题早发现                             │   │
│  │                                                       │   │
│  │ 传统：上线后才发现bug                                │   │
│  │ CI/CD：提交代码后几分钟内就能发现错误               │   │
│  │                                                       │   │
│  │ 影响：修复成本降低 10-100倍                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 2. 降低风险：小步提交，风险可控                     │   │
│  │                                                       │   │
│  │ 传统：一次性发布大量代码，风险集中                  │   │
│  │ CI/CD：每次只发布一小部分代码，出问题快速回滚       │   │
│  │                                                       │   │
│  │ 影响：生产环境事故减少 80%                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 3. 效率提升：自动化代替人工操作                     │   │
│  │                                                       │   │
│  │ 传统：开发人员需要手动打包、部署、测试              │   │
│  │ CI/CD：一键自动化完成所有繁琐工作                   │   │
│  │                                                       │   │
│  │ 影响：节省 30%+ 的时间用于真正开发                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 二、GitHub Actions

### 2.1 GitHub Actions是什么？

GitHub Actions是GitHub内置的CI/CD工具，它的特点是：
- 与GitHub深度集成
- 丰富的市场Action
- 按使用量收费（免费额度充足）
- YML配置，易于理解

### 2.2 基本概念

```
GitHub Actions 核心概念：

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Workflow（工作流）                                         │
│  ├── 定义在 .github/workflows/*.yml                        │
│  └── 整个CI/CD流程，比如："PR检查"工作流                   │
│                                                             │
│  Job（任务）                                                │
│  ├── 一个workflow包含多个job                                 │
│  └── 比如："构建"、"测试"、"部署"                        │
│                                                             │
│  Step（步骤）                                               │
│  ├── 一个job包含多个step                                    │
│  └── 比如："安装依赖"、"运行构建"、"运行测试"            │
│                                                             │
│  Action（动作）                                             │
│  ├── 可复用的步骤单元                                      │
│  ├── 可以是市场Action或自定义脚本                           │
│  └── 比如：actions/checkout, actions/setup-node            │
│                                                             │
│  Runner（运行器）                                           │
│  ├── 执行workflow的环境                                     │
│  └── GitHub托管的虚拟机或自建服务器                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 基础配置示例

```yaml
# .github/workflows/ci.yml

name: CI Pipeline  # 工作流名称

# 触发条件
on:
  # 当push或pull request到main分支时触发
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

  # 也可以手动触发
  workflow_dispatch:
    inputs:
      environment:
        description: "部署环境"
        required: true
        default: "staging"

# 环境变量
env:
  NODE_VERSION: "20"
  NPM_REGISTRY: "https://registry.npmjs.org/"

# 任务定义
jobs:
  # 构建任务
  build:
    name: Build
    runs-on: ubuntu-latest  # 运行器

    steps:
      # 1. 检出代码
      - name: Checkout code
        uses: actions/checkout@v4

      # 2. 设置Node.js
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          # 启用npm缓存
          cache: "npm"

      # 3. 安装依赖
      - name: Install dependencies
        run: npm ci

      # 4. 运行Lint
      - name: Run lint
        run: npm run lint

      # 5. 运行测试
      - name: Run tests
        run: npm run test:coverage

      # 6. 构建项目
      - name: Build
        run: npm run build

      # 7. 上传构建产物
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build
          path: .next
          retention-days: 7

  # 部署任务（依赖build）
  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    needs: build  # 依赖build任务
    if: github.ref == 'refs/heads/main'  # 只在main分支运行

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      # 下载构建产物
      - name: Download artifacts
        uses: actions/download-artifact@v4
        with:
          name: build
          path: .next

      # 部署到服务器
      - name: Deploy to server
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SERVER_SSH_KEY }}
          SERVER_HOST: ${{ secrets.SERVER_HOST }}
        run: |
          # 部署脚本
          echo "部署到生产服务器..."
          # 这里使用rsync或scp传输文件
```

### 2.4 多环境部署

```yaml
# .github/workflows/deploy.yml

name: Deploy

on:
  push:
    branches:
      - main      # 生产环境
      - develop   # 预发布环境
      - "feature/*"  # 功能分支 - 测试环境

# 环境变量
jobs:
  # 测试环境部署
  deploy-test:
    name: Deploy to Test
    runs-on: ubuntu-latest
    environment: test  # GitHub Environment
    if: startsWith(github.ref, 'refs/heads/feature/')

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install & Build
        run: |
          npm ci
          npm run build

      - name: Deploy to Test Server
        env:
          SERVER_URL: ${{ secrets.TEST_SERVER_URL }}
        run: |
          echo "部署到测试环境: $SERVER_URL"
          # scp传输和远程执行脚本

  # 预发布环境部署
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    environment: staging
    if: github.ref == 'refs/heads/develop'

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install & Build
        run: |
          npm ci
          npm run build

      - name: Deploy to Staging Server
        env:
          SERVER_URL: ${{ secrets.STAGING_SERVER_URL }}
        run: |
          echo "部署到预发布环境: $SERVER_URL"

  # 生产环境部署
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    environment: production  # 需要人工审批
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install & Build
        run: |
          npm ci
          npm run build

      - name: Deploy to Production
        env:
          SERVER_URL: ${{ secrets.PRODUCTION_SERVER_URL }}
        run: |
          echo "部署到生产环境: $SERVER_URL"
```

### 2.5 GitHub Environments

在GitHub仓库的Settings → Environments中可以配置环境：

```yaml
# 环境配置示例
deploy-production:
  environment:
    name: production
    url: https://example.com

    # 环境保护规则
    rules:
      # 必须从哪个分支部署
      - type: branch
        value: main

      # 部署前必须等待审核
      required_reviewers:
        - @tech-lead
        - @security-reviewer

      # 部署超时时间
      wait_timer: 0  # 0表示不需要等待

    # 环境机密变量
    env_vars:
      ENVIRONMENT: production
```

### 2.6 矩阵构建（多版本测试）

```yaml
# .github/workflows/matrix-build.yml

name: Matrix Build

on: [push]

jobs:
  # 矩阵构建 - 测试多个Node版本和操作系统
  test:
    runs-on: ubuntu-latest

    strategy:
      # 是否并行运行矩阵任务
      fail-fast: false

      matrix:
        # Node.js版本
        node-version: [18.x, 20.x, 22.x]
        # 操作系统
        os: [ubuntu-latest, windows-latest, macos-latest]
        # 排除某些组合
        exclude:
          - os: windows-latest
            node-version: 22.x

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }} on ${{ matrix.os }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test
```

### 2.7 缓存优化

```yaml
# 使用缓存加速CI

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      # npm缓存
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"  # 自动启用npm缓存

      # 或者手动配置更细粒度的缓存
      - name: Cache node_modules
        uses: actions/cache@v4
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-node-

      # pip缓存（Python项目）
      - name: Cache pip
        uses: actions/cache@v4
        with:
          path: ~/.cache/pip
          key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements.txt') }}

      # Docker层缓存
      - name: Build image
        uses: docker/build-push-action@v5
        with:
          cache-from: type=registry,ref=user/app:latest
          cache-to: type=inline
```

---

## 三、GitLab CI

### 3.1 GitLab CI核心概念

GitLab CI使用`.gitlab-ci.yml`配置文件：

```
核心概念：

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Pipeline（流水线）                                         │
│  ├── 整个CI/CD流程的定义                                   │
│  └── 包含多个Stage                                         │
│                                                             │
│  Stage（阶段）                                              │
│  ├── 流水线中的一个阶段                                    │
│  ├── 所有Stage的Job并行执行                                 │
│  └── Stage按顺序执行                                       │
│                                                             │
│  Job（任务）                                                │
│  ├── 每个Stage包含多个Job                                   │
│  └── Job定义了具体的CI任务                                 │
│                                                             │
│  Runner（运行器）                                           │
│  ├── 执行Job的环境                                         │
│  └── 可以是GitLab托管或自建                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 GitLab CI配置示例

```yaml
# .gitlab-ci.yml

# 定义流水线 stages
stages:
  - build    # 构建阶段
  - test     # 测试阶段
  - deploy   # 部署阶段

# 全局配置
variables:
  NODE_VERSION: "20"
  NPM_REGISTRY: "https://registry.npmjs.org/"

# 构建任务
build:
  stage: build
  image: node:20
  script:
    - npm ci --registry $NPM_REGISTRY
    - npm run build
  artifacts:
    paths:
      - .next/
    expire_in: 1 week
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/

# 测试任务
test:
  stage: test
  image: node:20
  script:
    - npm ci --registry $NPM_REGISTRY
    - npm run lint
    - npm run test:coverage
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

# 部署任务
deploy-test:
  stage: deploy
  image: ubuntu:latest
  script:
    - apt-get update && apt-get install -y rsync openssh-client
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
    - ssh-keyscan $TEST_SERVER_HOST >> ~/.ssh/known_hosts
    - rsync -avz --delete .next/ $TEST_SERVER_USER@$TEST_SERVER_HOST:/var/www/app/
  environment:
    name: test
    url: https://test.example.com
  only:
    - develop
  when: manual  # 手动触发

deploy-production:
  stage: deploy
  image: ubuntu:latest
  script:
    - apt-get update && apt-get install -y rsync openssh-client
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
    - ssh-keyscan $PRODUCTION_SERVER_HOST >> ~/.ssh/known_hosts
    - rsync -avz --delete .next/ $PRODUCTION_SERVER_USER@$PRODUCTION_SERVER_HOST:/var/www/app/
  environment:
    name: production
    url: https://example.com
  only:
    - main
  when: manual  # 生产环境手动触发
```

### 3.3 GitLab CI高级特性

#### 父子流水线

```yaml
# 父流水线 - 触发多个子流水线
trigger-multi:
  stage: build
  trigger:
    include:
      - local: web.yml
      - local: api.yml
      - local: mobile.yml
    strategy: depend  # 等待所有子流水线完成

# 子流水线 - web.yml
build-web:
  stage: deploy
  script:
    - npm ci
    - npm run build
  trigger:
    include: ci-web.yml
```

#### DAG流水线（有向无环图）

```yaml
# DAG模式：不按stage顺序执行，根据依赖关系自动调度
stages:
  - build
  - test
  - deploy

build-a:
  stage: build
  script: echo "Building A"

build-b:
  stage: build
  script: echo "Building B"

test-a:
  stage: test
  script: echo "Testing A"
  needs: [build-a]  # 只依赖build-a

test-b:
  stage: test
  script: echo "Testing B"
  needs: [build-a, build-b]  # 依赖两个构建任务

deploy:
  stage: deploy
  script: echo "Deploying"
  needs: [test-a, test-b]  # 等待所有测试完成
```

---

## 四、Jenkins

### 4.1 Jenkins核心概念

Jenkins是最老牌的CI/CD工具，它的特点是：
- 完全开源免费
- 插件生态丰富
- 可以完全自建
- 配置灵活

```
Jenkins核心概念：

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Node / Agent（节点）                                       │
│  ├── 执行构建的环境                                         │
│  └── 可以是控制器或代理机                                   │
│                                                             │
│  Job / Project（任务）                                      │
│  ├── 定义具体的构建任务                                    │
│  └── 相当于GitHub Actions的Workflow                        │
│                                                             │
│  Build（构建）                                              │
│  ├── 每次Job执行的实例                                    │
│  └── 有构建编号和状态                                      │
│                                                             │
│  Stage（阶段）                                              │
│  ├── Job内的逻辑分组                                       │
│  └── 可视化展示时用                                        │
│                                                             │
│  Step（步骤）                                               │
│  ├── 具体的构建操作                                        │
│  └── 比如：执行shell命令、发送邮件                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Jenkins Pipeline配置

Jenkins使用Pipeline DSL来定义CI/CD流程：

```groovy
// Jenkinsfile

pipeline {
  // 代理选择
  agent {
    // 在任何可用节点运行
    label 'docker'  // 标签选择器
    // 或者使用docker容器
    docker {
      image 'node:20'
      reuseNode true  // 在容器中复用主节点工作目录
    }
  }

  // 环境变量
  environment {
    NPM_REGISTRY = 'https://registry.npmjs.org/'
    NODE_ENV = 'production'
  }

  // 构建选项
  options {
    // 构建超时
    timeout(time: 30, unit: 'MINUTES')

    // 构建失败重试
    retry(2)

    // 丢弃旧的构建
    buildDiscarder(
      logRotator(
        numToKeepStr: '10',
        daysToKeepStr: '30'
      )
    )
  }

  // 触发条件
  triggers {
    // 定时构建
    cron('H 2 * * *')

    // GitLab webhook触发
    gitlab(
      triggerOnPush: true,
      triggerOnMergeRequest: true,
      branchFilter: 'main|develop',
      secretToken: 'my-secret-token'
    )

    // GitHub webhook触发
    githubPushTrigger()
  }

  // 定义阶段
  stages {
    stage('Checkout') {
      steps {
        echo '检出代码...'
        checkout scm
      }
    }

    stage('Build') {
      steps {
        echo '安装依赖...'
        sh 'npm ci --registry ${NPM_REGISTRY}'

        echo '构建项目...'
        sh 'npm run build'
      }

      post {
        success {
          echo '构建成功！'
          // 归档构建产物
          archiveArtifacts artifacts: '.next/**/*', fingerprint: true
        }
        failure {
          echo '构建失败！'
        }
      }
    }

    stage('Test') {
      steps {
        echo '运行测试...'
        sh 'npm run test:coverage'

        echo '代码检查...'
        sh 'npm run lint'
      }

      post {
        always {
          // 始终发布测试报告
          junit '**/junit.xml'
          cobertura coberturaReportFile: 'coverage/cobertura-coverage.xml'
        }
      }
    }

    stage('Deploy to Test') {
      when {
        branch 'develop'
      }
      steps {
        echo '部署到测试环境...'
        sh '''
          rsync -avz --delete .next/ user@testserver:/var/www/app/
          ssh user@testserver "cd /var/www/app && pm2 restart app"
        '''
      }
    }

    stage('Deploy to Production') {
      when {
        branch 'main'
      }
      steps {
        echo '部署到生产环境...'
        input message: '确认部署到生产环境?', ok: '确认'
        sh '''
          rsync -avz --delete .next/ user@productionserver:/var/www/app/
          ssh user@productionserver "cd /var/www/app && pm2 restart app"
        '''
      }
    }
  }

  // 后置处理
  post {
    always {
      echo '清理工作空间...'
      cleanWs()
    }

    success {
      echo '流水线执行成功！'
      // 发送成功通知
      emailext(
        subject: "构建成功: ${env.JOB_NAME}",
        body: "构建 #${env.BUILD_NUMBER} 成功",
        to: 'team@example.com'
      )
    }

    failure {
      echo '流水线执行失败！'
      emailext(
        subject: "构建失败: ${env.JOB_NAME}",
        body: "构建 #${env.BUILD_NUMBER} 失败\n\n查看日志: ${env.BUILD_URL}",
        to: 'team@example.com'
      )
    }
  }
}
```

### 4.3 Jenkins共享库

创建可复用的Pipeline库：

```groovy
// vars/npmPipeline.groovy

def call(Map config) {
  pipeline {
    agent {
      docker {
        image "node:${config.nodeVersion ?: '20'}"
        reuseNode true
      }
    }

    stages {
      stage('Install') {
        steps {
          sh 'npm ci'
        }
      }

      stage('Lint') {
        steps {
          sh 'npm run lint'
        }
      }

      stage('Test') {
        steps {
          sh 'npm run test:coverage'
        }
        post {
          always {
            junit '**/junit.xml'
          }
        }
      }

      stage('Build') {
        steps {
          sh 'npm run build'
        }
        post {
          success {
            archiveArtifacts artifacts: '.next/**/*'
          }
        }
      }
    }
  }
}

// 使用方式：在Jenkinsfile中
// @Library('shared-pipelines') _
// npmPipeline nodeVersion: '20'
```

---

## 五、多平台构建

### 5.1 Docker多阶段构建

Docker多阶段构建可以大大减小镜像体积：

```dockerfile
# Dockerfile

# 阶段1：构建
FROM node:20-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci --registry https://registry.npmjs.org/

# 复制源代码
COPY . .

# 构建
RUN npm run build

# 阶段2：运行
FROM node:20-alpine AS runner

WORKDIR /app

# 从builder阶段复制构建产物
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./

# 安装生产依赖
RUN npm ci --omit=dev --registry https://registry.npmjs.org/

# 创建非root用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

USER nextjs

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["npm", "start"]
```

### 5.2 Docker构建缓存优化

```dockerfile
# 优化构建缓存的Dockerfile

# 1. 先复制依赖文件（变化少）
COPY package*.json ./

# 2. 安装依赖（变化少）
RUN npm ci --registry https://registry.npmjs.org/

# 3. 复制源代码（变化频繁）
COPY . .

# 4. 构建
RUN npm run build

# 这样的顺序可以充分利用Docker缓存
# 当只有源代码变化时，前两步会被缓存
```

### 5.3 GitHub Actions中的Docker构建

```yaml
# .github/workflows/docker.yml

name: Docker Build

on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    branches: [main]

env:
  IMAGE_NAME: ${{ github.repository }}
  REGISTRY: ghcr.io

jobs:
  # 构建和推送Docker镜像
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix=

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha  # 使用GitHub Actions缓存
          cache-to: type=gha,mode=max

  # 多平台构建
  multi-platform:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        platform: [linux/amd64, linux/arm64]

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up QEMU
        uses: docker/setup-qemu-action@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: ${{ matrix.platform }}
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ matrix.platform }}
```

---

## 六、制品管理

### 6.1 制品的概念

制品（Artifact）是CI/CD流程中产出的文件：
- 编译后的二进制文件
- Docker镜像
- 安装包
- 测试报告
- 覆盖率报告

### 6.2 GitHub Actions制品管理

```yaml
# .github/workflows/ci.yml

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build
        run: npm run build

      # 上传制品
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-files
          path: |
            .next/
            node_modules/.cache/
          retention-days: 30
          compression-level: 9  # 压缩级别 0-9

  test:
    runs-on: ubuntu-latest
    needs: build  # 依赖build任务
    steps:
      # 下载制品
      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-files
          path: .next

      - name: Run tests
        run: npm run test

  deploy:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-files
          path: .next

      - name: Deploy
        run: npm run deploy
```

### 6.3 Docker镜像仓库

```yaml
# GitHub Container Registry (ghcr.io)

jobs:
  build-and-push:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Build image
        run: docker build -t ghcr.io/${{ github.repository }}:${{ github.sha }} .

      - name: Push to GHCR
        run: |
          echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin
          docker push ghcr.io/${{ github.repository }}:${{ github.sha }}

      - name: Tag as latest
        if: github.ref == 'refs/heads/main'
        run: |
          docker tag ghcr.io/${{ github.repository }}:${{ github.sha }} ghcr.io/${{ github.repository }}:latest
          docker push ghcr.io/${{ github.repository }}:latest
```

---

## 七、部署策略

### 7.1 滚动部署（Rolling Deployment）

```
滚动部署：逐个替换旧版本实例

时间1: [v1] [v1] [v1] [v1]
时间2: [v2] [v1] [v1] [v1]  ← 先更新1个
时间3: [v2] [v2] [v1] [v1]  ← 再更新1个
时间4: [v2] [v2] [v2] [v1]  ← 继续...
时间5: [v2] [v2] [v2] [v2]  ← 全部更新完成

优点：不需要双倍资源
缺点：更新过程中新旧版本共存
```

```yaml
# Kubernetes滚动部署配置
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # 最多超出多少个实例
      maxUnavailable: 0  # 更新过程中最少保持多少实例
  template:
    spec:
      containers:
        - name: my-app
          image: my-app:v2
```

### 7.2 蓝绿部署（Blue-Green Deployment）

```
蓝绿部署：准备两套环境，切换流量

[Blue环境 v1] ←←←←← 当前流量
[Green环境 v2]  空闲，准备中

准备就绪后，切换流量：

[Blue环境 v1]  空闲（可回滚）
[Green环境 v2] ←←←←← 当前流量

优点：切换快速，回滚容易
缺点：需要双倍资源
```

```yaml
# 蓝绿部署 - GitHub Actions
deploy-production:
  runs-on: ubuntu-latest
  environment: production

  steps:
    # 部署到Green环境
    - name: Deploy to Green
      run: |
        echo "部署到Green服务器"
        # 部署脚本

    # 切换流量
    - name: Switch traffic
      run: |
        echo "切换负载均衡到Green"
        # 切换脚本

    # 验证
    - name: Verify deployment
      run: |
        echo "验证新版本"
        # 健康检查脚本
```

### 7.3 金丝雀部署（Canary Deployment）

```
金丝雀部署：先让少量用户使用新版本

[生产环境]
  95% 用户 → [v1]
   5% 用户 → [v2]  ← 新版本（金丝雀）

观察没问题后，逐步增加比例：
  90% 用户 → [v1]
  10% 用户 → [v2]

  70% 用户 → [v1]
  30% 用户 → [v2]

  ...
 100% 用户 → [v2]

优点：风险可控，逐步验证
缺点：需要流量管理基础设施
```

### 7.4 回滚策略

```yaml
# 回滚配置示例

deploy-production:
  runs-on: ubuntu-latest

  steps:
    - name: Deploy
      run: |
        # 部署新版本
        ./deploy.sh v2

    - name: Verify
      run: |
        # 健康检查
        curl -f https://api.example.com/health || exit 1

    - name: Rollback on failure
      if: failure()
      run: |
        echo "部署失败，执行回滚..."
        ./rollback.sh v1
```

---

## 八、完整CI/CD流程图

```
┌─────────────────────────────────────────────────────────────┐
│                    完整CI/CD流程图                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  代码提交                                                   │
│     │                                                       │
│     ▼                                                       │
│  ┌──────────────┐                                           │
│  │  代码检查    │ ← ESLint, Prettier                       │
│  └──────┬───────┘                                           │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────┐                                           │
│  │  单元测试    │ ← Jest/Vitest                            │
│  └──────┬───────┘                                           │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────┐                                           │
│  │  构建        │ ← npm run build                           │
│  └──────┬───────┘                                           │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────┐                                           │
│  │  集成测试    │ ← 组件集成测试                           │
│  └──────┬───────┘                                           │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────┐                                           │
│  │  E2E测试     │ ← Playwright/Cypress                     │
│  └──────┬───────┘                                           │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────┐                                           │
│  │  安全扫描    │ ← SonarQube, Snyk                        │
│  └──────┬───────┘                                           │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────┐                                           │
│  │  构建镜像    │ ← Docker Build                          │
│  └──────┬───────┘                                           │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────┐                                           │
│  │  推送镜像    │ ← Docker Push                           │
│  └──────┬───────┘                                           │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────┐                                           │
│  │  部署测试环境│ ← kubectl apply / docker-compose        │
│  └──────┬───────┘                                           │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────┐                                           │
│  │  端到端测试  │ ← 测试环境                                │
│  └──────┬───────┘                                           │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────┐                                           │
│  │  部署预发布  │ ← Staging环境                            │
│  └──────┬───────┘                                           │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────┐                                           │
│  │  人工审批    │ ← 关键变更需审批                         │
│  └──────┬───────┘                                           │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────┐                                           │
│  │  部署生产    │ ← 生产环境                                │
│  └──────┬───────┘                                           │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────┐                                           │
│  │  健康检查    │ ← 监控新版本状态                         │
│  └──────┬───────┘                                           │
│         │                                                   │
│         ▼                                                   │
│      完成！                                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 九、附录：CI/CD工具对比

| 工具 | 类型 | 优点 | 缺点 |
|------|------|------|------|
| **GitHub Actions** | SaaS | 与GitHub深度集成，市场丰富 | 只能用于GitHub |
| **GitLab CI** | 自建/SaaS | 功能完整，YAML配置 | 自建需要运维 |
| **Jenkins** | 自建 | 插件丰富，完全可控 | 配置复杂，需要运维 |
| **CircleCI** | SaaS | 速度快，配置简单 | 价格较高 |
| **Travis CI** | SaaS | 与GitHub集成好 | 速度较慢 |
| **Azure DevOps** | SaaS/自建 | 与微软生态集成 | 学习曲线陡峭 |
| **Tekton** | 自建 | Kubernetes原生 | 配置复杂 |

### 常用Actions推荐

| Action | 用途 | GitHub |
|--------|------|--------|
| actions/checkout | 检出代码 | actions/checkout |
| actions/setup-node | Node.js环境 | actions/setup-node |
| actions/setup-python | Python环境 | actions/setup-python |
| actions/cache | 缓存 | actions/cache |
| actions/upload-artifact | 上传制品 | actions/upload-artifact |
| actions/download-artifact | 下载制品 | actions/download-artifact |
| docker/login-action | Docker登录 | docker/login-action |
| docker/build-push-action | Docker构建推送 | docker/build-push-action |
| codecov/codecov-action | 上报覆盖率 | codecov/codecov-action |
| SonarSource/sonarcloud-github-action | SonarCloud扫描 | SonarSource/sonarcloud-github-action |

---

希望这份指南能帮助你设计出适合自己项目的CI/CD流水线！记住，最好的CI/CD系统是那个能让你的团队高效、安全地交付软件的系统。
