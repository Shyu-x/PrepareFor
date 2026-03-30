# DevOps与CI/CD完全指南

## 目录

1. [DevOps基础](#1-devops基础)
2. [CI/CD流水线](#2-cicd流水线)
3. [容器化技术](#3-容器化技术)
4. [Kubernetes集群管理](#4-kubernetes集群管理)
5. [监控与日志](#5-监控与日志)
6. [DevOps最佳实践](#6-devops最佳实践)

---

## 1. DevOps基础

### 1.1 DevOps文化

```
DevOps文化核心要素

1. 协作（Collaboration）
   └── 开发与运维紧密合作

2. 自动化（Automation）
   └── 自动化一切可自动化的流程

3. 持续改进（Continuous Improvement）
   └── 持续优化流程和工具

4. 度量驱动（Metrics-Driven）
   └── 用数据驱动决策

5. 快速反馈（Rapid Feedback）
   └── 快速获取反馈并调整
```

### 1.2 DevOps工具链

| 阶段 | 工具 | 用途 |
|------|------|------|
| **版本控制** | Git | 代码管理 |
| **持续集成** | GitHub Actions, Jenkins, GitLab CI | 自动构建测试 |
| **持续部署** | Ansible, Terraform | 自动部署 |
| **容器化** | Docker, Podman | 容器镜像 |
| **编排** | Kubernetes, Docker Swarm | 容器编排 |
| **监控** | Prometheus, Grafana | 系统监控 |
| **日志** | ELK Stack, Loki | 日志收集分析 |

### 1.3 DevOps实践

```bash
# 1. 基础设施即代码（IaC）
# Terraform配置
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"

  tags = {
    Name = "WebServer"
  }
}

# 2. 配置管理
# Ansible Playbook
---
- name: 配置Web服务器
  hosts: webservers
  become: yes
  tasks:
    - name: 安装Nginx
      apt:
        name: nginx
        state: present

    - name: 启动Nginx服务
      service:
        name: nginx
        state: started

# 3. 自动化部署
# Docker Compose
version: '3.8'
services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
  db:
    image: postgres:13
    environment:
      POSTGRES_PASSWORD: password
```

---

## 2. CI/CD流水线

### 2.1 GitHub Actions配置

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18.x'
  DOCKER_REGISTRY: 'ghcr.io'

jobs:
  # 1. 代码检查
  lint:
    name: 代码检查
    runs-on: ubuntu-latest
    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 安装Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: 安装依赖
        run: npm ci

      - name: 运行ESLint
        run: npm run lint

      - name: 运行TypeScript检查
        run: npm run type-check

  # 2. 单元测试
  test:
    name: 单元测试
    runs-on: ubuntu-latest
    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 安装Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: 安装依赖
        run: npm ci

      - name: 运行测试
        run: npm run test:unit

      - name: 上传测试覆盖率
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  # 3. 构建应用
  build:
    name: 构建应用
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 安装Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: 安装依赖
        run: npm ci

      - name: 构建生产版本
        run: npm run build
        env:
          NODE_ENV: production

      - name: 上传构建产物
        uses: actions/upload-artifact@v3
        with:
          name: build
          path: dist/

  # 4. 构建Docker镜像
  docker-build:
    name: 构建Docker镜像
    runs-on: ubuntu-latest
    needs: [build]
    permissions:
      contents: read
      packages: write
    steps:
      - name: 检出代码
        uses: actions/checkout@v4

      - name: 下载构建产物
        uses: actions/download-artifact@v3
        with:
          name: build
          path: dist/

      - name: 设置Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: 登录到Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.DOCKER_REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: 提取Docker元数据
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.DOCKER_REGISTRY }}/${{ github.repository }}
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix={{branch}}-

      - name: 构建并推送Docker镜像
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # 5. 部署到测试环境
  deploy-staging:
    name: 部署到测试环境
    runs-on: ubuntu-latest
    needs: [docker-build]
    if: github.ref == 'refs/heads/develop'
    environment:
      name: staging
      url: https://staging.example.com
    steps:
      - name: 部署到Kubernetes
        uses: appleboy/kubectl-action@master
        with:
          kubeconfig: ${{ secrets.KUBECONFIG_STAGING }}
          args: rollout restart deployment/my-app -n staging

      - name: 验证部署
        run: |
          kubectl rollout status deployment/my-app -n staging --timeout=5m

  # 6. 部署到生产环境
  deploy-production:
    name: 部署到生产环境
    runs-on: ubuntu-latest
    needs: [docker-build]
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://example.com
    steps:
      - name: 部署到Kubernetes
        uses: appleboy/kubectl-action@master
        with:
          kubeconfig: ${{ secrets.KUBECONFIG_PROD }}
          args: rollout restart deployment/my-app -n production

      - name: 验证部署
        run: |
          kubectl rollout status deployment/my-app -n production --timeout=5m

      - name: 健康检查
        run: |
          curl -f https://example.com/health || exit 1
```

### 2.2 GitLab CI/CD配置

```yaml
# .gitlab-ci.yml
stages:
  - lint
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "18"
  DOCKER_REGISTRY: "registry.example.com"
  DOCKER_IMAGE: "${DOCKER_REGISTRY}/${CI_PROJECT_PATH}"

# 1. 代码检查
lint:
  stage: lint
  image: node:${NODE_VERSION}
  cache:
    paths:
      - node_modules/
  script:
    - npm ci
    - npm run lint
    - npm run type-check

# 2. 单元测试
test:
  stage: test
  image: node:${NODE_VERSION}
  cache:
    paths:
      - node_modules/
  script:
    - npm ci
    - npm run test:unit
    - npm run test:coverage
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

# 3. 构建应用
build:
  stage: build
  image: node:${NODE_VERSION}
  cache:
    paths:
      - node_modules/
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 week

# 4. 构建Docker镜像
docker-build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  needs:
    - build
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $DOCKER_REGISTRY
    - docker build -t $DOCKER_IMAGE:$CI_COMMIT_SHA .
    - docker build -t $DOCKER_IMAGE:$CI_COMMIT_REF_SLUG .
    - docker push $DOCKER_IMAGE:$CI_COMMIT_SHA
    - docker push $DOCKER_IMAGE:$CI_COMMIT_REF_SLUG
  only:
    - main
    - develop

# 5. 部署到测试环境
deploy-staging:
  stage: deploy
  image: bitnami/kubectl:latest
  needs:
    - docker-build
  script:
    - kubectl config use-context staging
    - kubectl set image deployment/my-app my-app=$DOCKER_IMAGE:$CI_COMMIT_SHA -n staging
    - kubectl rollout status deployment/my-app -n staging
  environment:
    name: staging
    url: https://staging.example.com
  only:
    - develop

# 6. 部署到生产环境
deploy-production:
  stage: deploy
  image: bitnami/kubectl:latest
  needs:
    - docker-build
  script:
    - kubectl config use-context production
    - kubectl set image deployment/my-app my-app=$DOCKER_IMAGE:$CI_COMMIT_SHA -n production
    - kubectl rollout status deployment/my-app -n production
  environment:
    name: production
    url: https://example.com
  when: manual
  only:
    - main
```

### 2.3 Jenkins流水线

```groovy
// Jenkinsfile
pipeline {
  agent any

  environment {
    NODE_VERSION = '18'
    DOCKER_REGISTRY = 'registry.example.com'
    DOCKER_IMAGE = "${DOCKER_REGISTRY}/${env.JOB_NAME}"
  }

  stages {
    // 1. 代码检查
    stage('Lint') {
      steps {
        script {
          docker.image("node:${NODE_VERSION}").inside {
            sh 'npm ci'
            sh 'npm run lint'
            sh 'npm run type-check'
          }
        }
      }
    }

    // 2. 单元测试
    stage('Test') {
      steps {
        script {
          docker.image("node:${NODE_VERSION}").inside {
            sh 'npm ci'
            sh 'npm run test:unit'
            sh 'npm run test:coverage'
          }
        }
      }
    }

    // 3. 构建应用
    stage('Build') {
      steps {
        script {
          docker.image("node:${NODE_VERSION}").inside {
            sh 'npm ci'
            sh 'npm run build'
          }
        }
      }
    }

    // 4. 构建Docker镜像
    stage('Docker Build') {
      steps {
        script {
          docker.withRegistry("https://${DOCKER_REGISTRY}", 'docker-registry-credentials') {
            def image = docker.build(DOCKER_IMAGE)
            image.push("${env.BUILD_NUMBER}")
            image.push('latest')
          }
        }
      }
    }

    // 5. 部署到测试环境
    stage('Deploy Staging') {
      when {
        branch 'develop'
      }
      steps {
        script {
          withKubeConfig([credentialsId: 'k8s-config-staging']) {
            sh """
              kubectl set image deployment/my-app my-app=${DOCKER_IMAGE}:${env.BUILD_NUMBER} -n staging
              kubectl rollout status deployment/my-app -n staging
            """
          }
        }
      }
    }

    // 6. 部署到生产环境
    stage('Deploy Production') {
      when {
        branch 'main'
      }
      steps {
        input '确认部署到生产环境？'
        script {
          withKubeConfig([credentialsId: 'k8s-config-production']) {
            sh """
              kubectl set image deployment/my-app my-app=${DOCKER_IMAGE}:${env.BUILD_NUMBER} -n production
              kubectl rollout status deployment/my-app -n production
            """
          }
        }
      }
    }
  }

  post {
    success {
      echo 'Pipeline 成功！'
    }
    failure {
      echo 'Pipeline 失败！'
      emailext (
        subject: "Pipeline 失败: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
        body: """
          构建失败！

          项目: ${env.JOB_NAME}
          构建号: ${env.BUILD_NUMBER}
          分支: ${env.GIT_BRANCH}
          构建URL: ${env.BUILD_URL}
        """,
        to: 'team@example.com'
      )
    }
    always {
      cleanWs()
    }
  }
}
```

---

## 3. 容器化技术

### 3.1 Docker基础

```dockerfile
# 1. 多阶段构建
# 开发阶段
FROM node:18-alpine AS development
WORKDIR /app

# 复制package文件
COPY package*.json ./
RUN npm ci

# 复制源代码
COPY . .

# 启动开发服务器
CMD ["npm", "run", "dev"]

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

# 复制package文件
COPY package*.json ./
RUN npm ci --only=production

# 从构建阶段复制构建产物
COPY --from=builder /app/dist ./dist

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# 启动应用
CMD ["node", "dist/index.js"]

# 2. 优化Docker镜像
# 使用Alpine基础镜像
FROM node:18-alpine

# 合并RUN命令
RUN apk add --no-cache dumb-init && \
    npm install -g pm2 && \
    rm -rf /root/.npm

# 多阶段构建减小镜像体积
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm ci --only=production
CMD ["node", "dist/index.js"]

# 3. .dockerignore
node_modules
npm-debug.log
dist
.git
.gitignore
.env
.env.local
coverage
.vscode
*.md

# 4. Docker Compose配置
version: '3.8'

services:
  # 应用服务
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@db:5432/mydb
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    networks:
      - app-network

  # 数据库服务
  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=mydb
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - app-network

  # Redis服务
  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    restart: unless-stopped
    networks:
      - app-network

  # Nginx反向代理
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - app-network

volumes:
  postgres-data:
  redis-data:

networks:
  app-network:
    driver: bridge
```

### 3.2 Docker最佳实践

```dockerfile
# 1. 选择合适的基础镜像
# ✅ 好的做法：使用官方镜像
FROM node:18-alpine

// ❌ 不好的做法：使用非官方镜像
FROM custom-node-image:latest

# 2. 最小化层数
// ✅ 好的做法：合并RUN命令
RUN apk add --no-cache dumb-init && \
    npm install -g pm2 && \
    rm -rf /root/.npm

// ❌ 不好的做法：多个RUN命令
RUN apk add --no-cache dumb-init
RUN npm install -g pm2
RUN rm -rf /root/.npm

# 3. 利用构建缓存
// ✅ 好的做法：先复制package文件
COPY package*.json ./
RUN npm ci
COPY . .

// ❌ 不好的做法：直接复制所有文件
COPY . .
RUN npm ci

// 4. 使用非root用户
// ✅ 好的做法：创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

// ❌ 不好的做法：使用root用户
RUN echo "Running as root"

// 5. 使用.dockerignore
// ✅ 好的做法：排除不必要的文件
node_modules
dist
.git
.env
*.log

// ❌ 不好的做法：复制所有文件
COPY . .

// 6. 多阶段构建
// ✅ 好的做法：使用多阶段构建
FROM node:18-alpine AS builder
RUN npm run build

FROM node:18-alpine
COPY --from=builder /app/dist ./dist

// ❌ 不好的做法：单阶段构建
FROM node:18-alpine
RUN npm run build
```

---

## 4. Kubernetes集群管理

### 4.1 Kubernetes基础资源

```yaml
# 1. Deployment（部署）
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: production
  labels:
    app: my-app
    environment: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
        environment: production
    spec:
      containers:
        - name: my-app
          image: registry.example.com/my-app:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: "production"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: database-url
            - name: REDIS_URL
              valueFrom:
                configMapKeyRef:
                  name: app-config
                  key: redis-url
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
      imagePullSecrets:
        - name: registry-secret

---
# 2. Service（服务）
apiVersion: v1
kind: Service
metadata:
  name: my-app
  namespace: production
spec:
  selector:
    app: my-app
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: ClusterIP

---
# 3. Ingress（入口）
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app
  namespace: production
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - example.com
      secretName: example-com-tls
  rules:
    - host: example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-app
                port:
                  number: 80

---
# 4. ConfigMap（配置）
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: production
data:
  redis-url: "redis://redis:6379"
  api-url: "https://api.example.com"

---
# 5. Secret（密钥）
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: production
type: Opaque
stringData:
  database-url: "postgresql://user:password@db:5432/mydb"
  api-key: "your-api-key"

---
# 6. HorizontalPodAutoscaler（水平自动扩缩容）
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 3
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
# 7. PodDisruptionBudget（Pod中断预算）
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: my-app-pdb
  namespace: production
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: my-app
```

### 4.2 Helm Chart

```yaml
# Chart.yaml
apiVersion: v2
name: my-app
description: A Helm chart for my application
type: application
version: 0.1.0
appVersion: "1.0.0"

# values.yaml
replicaCount: 3

image:
  repository: registry.example.com/my-app
  pullPolicy: IfNotPresent
  tag: "1.0.0"

imagePullSecrets: []
nameOverride: ""
fullnameOverride: ""

serviceAccount:
  create: true
  annotations: {}
  name: ""

podAnnotations: {}

podSecurityContext: {}
  # fsGroup: 2000

securityContext: {}
  # capabilities:
  #   drop:
  #   - ALL
  # readOnlyRootFilesystem: true
  # runAsNonRoot: true
  # runAsUser: 1000

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  className: "nginx"
  annotations: {}
    # cert-manager.io/cluster-issuer: "letsencrypt-prod"
  hosts:
    - host: example.com
      paths:
        - path: /
          pathType: Prefix
  tls: []
  #  - secretName: example-tls
  #    hosts:
  #      - example.com

resources: {}
  # limits:
  #   cpu: 100m
  #   memory: 128Mi
  # requests:
  #   cpu: 100m
  #   memory: 128Mi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

nodeSelector: {}

tolerations: []

affinity: {}

# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "my-app.fullname" . }}
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "my-app.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "my-app.selectorLabels" . | nindent 8 }}
    spec:
      {{- with .Values.imagePullSecrets }}
      imagePullSecrets:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      serviceAccountName: {{ include "my-app.serviceAccountName" . }}
      securityContext:
        {{- toYaml .Values.podSecurityContext | nindent 8 }}
      containers:
        - name: {{ .Chart.Name }}
          securityContext:
            {{- toYaml .Values.securityContext | nindent 12 }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - name: http
              containerPort: {{ .Values.service.port }}
              protocol: TCP
          livenessProbe:
            httpGet:
              path: /health
              port: http
          readinessProbe:
            httpGet:
              path: /ready
              port: http
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
      {{- with .Values.nodeSelector }}
      nodeSelector:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.affinity }}
      affinity:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.tolerations }}
      tolerations:
        {{- toYaml . | nindent 8 }}
      {{- end }}
```

---

## 5. 监控与日志

### 5.1 Prometheus监控

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

# 告警规则文件
rule_files:
  - 'alerts/*.yml'

# 抓取配置
scrape_configs:
  # Kubernetes API Server
  - job_name: 'kubernetes-apiservers'
    kubernetes_sd_configs:
      - role: endpoints
    scheme: https
    tls_config:
      ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
    relabel_configs:
      - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
        action: keep
        regex: default;kubernetes;https

  # Kubernetes Nodes
  - job_name: 'kubernetes-nodes'
    kubernetes_sd_configs:
      - role: node
    scheme: https
    tls_config:
      ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
    relabel_configs:
      - action: labelmap
        regex: __meta_kubernetes_node_label_(.+)

  # Kubernetes Pods
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - action: labelmap
        regex: __meta_kubernetes_pod_label_(.+)
      - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__
      - action: labelmap
        regex: __meta_kubernetes_pod_annotation_prometheus_io_param_(.+)
        replacement: __param_$1
      - action: labelmap
        regex: __meta_kubernetes_namespace_label_(.+)
      - source_labels: [__meta_kubernetes_pod_name]
        action: replace
        target_label: pod

# Alertmanager配置
alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093
```

### 5.2 Grafana仪表板

```json
{
  "dashboard": {
    "title": "应用监控仪表板",
    "panels": [
      {
        "title": "CPU使用率",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(container_cpu_usage_seconds_total{container!=\"POD\"}[5m]) * 100",
            "legendFormat": "{{pod}}"
          }
        ]
      },
      {
        "title": "内存使用率",
        "type": "graph",
        "targets": [
          {
            "expr": "container_memory_usage_bytes / container_spec_memory_limit_bytes * 100",
            "legendFormat": "{{pod}}"
          }
        ]
      },
      {
        "title": "HTTP请求速率",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{path}}"
          }
        ]
      },
      {
        "title": "HTTP错误率",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m]) / rate(http_requests_total[5m]) * 100",
            "legendFormat": "{{method}} {{path}}"
          }
        ]
      },
      {
        "title": "响应时间",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "P95"
          },
          {
            "expr": "histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "P99"
          }
        ]
      }
    ]
  }
}
```

### 5.3 ELK日志栈

```yaml
# docker-compose.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    networks:
      - elk-network

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5000:5000"
    depends_on:
      - elasticsearch
    networks:
      - elk-network

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch
    networks:
      - elk-network

volumes:
  elasticsearch-data:

networks:
  elk-network:
    driver: bridge

# logstash.conf
input {
  tcp {
    port => 5000
    codec => json_lines
  }
}

filter {
  if [type] == "nginx" {
    grok {
      match => { "message" => "%{COMBINEDAPACHELOG}" }
    }
  }

  if [type] == "application" {
    date {
      match => [ "timestamp", "ISO8601" ]
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "logs-%{+YYYY.MM.dd}"
  }
}
```

---

## 6. DevOps最佳实践

### 6.1 基础设施即代码

```hcl
# Terraform配置

# 1. 网络配置
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "main-vpc"
  }
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet-${count.index}"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "main-igw"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "public-rt"
  }
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# 2. EKS集群
resource "aws_eks_cluster" "main" {
  name     = "main-cluster"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.27"

  vpc_config {
    subnet_ids = aws_subnet.public[*].id
  }

  tags = {
    Name = "main-eks-cluster"
  }
}

resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "main-node-group"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = aws_subnet.public[*].id

  scaling_config {
    desired_size = 3
    max_size     = 5
    min_size     = 1
  }

  instance_types = ["t3.medium"]

  tags = {
    Name = "main-eks-node-group"
  }
}

# 3. RDS数据库
resource "aws_db_instance" "main" {
  allocated_storage    = 20
  storage_type         = "gp2"
  engine               = "postgres"
  engine_version       = "15.3"
  instance_class       = "db.t3.micro"
  db_name              = "mydb"
  username             = "admin"
  password             = var.db_password
  parameter_group_name = "default.postgres15"
  skip_final_snapshot  = true
  publicly_accessible  = false

  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  tags = {
    Name = "main-rds"
  }
}

# 4. S3存储
resource "aws_s3_bucket" "main" {
  bucket = "my-app-storage"

  tags = {
    Name = "main-s3"
  }
}

resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    id      = "log-lifecycle"
    status  = "Enabled"

    expiration {
      days = 30
    }

    noncurrent_version_expiration {
      noncurrent_days = 7
    }
  }
}
```

### 6.2 安全最佳实践

```yaml
# 1. 网络安全策略
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress

---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-app-traffic
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: my-app
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              name: database
      - to:
        - podSelector:
            matchLabels:
              app: redis

# 2. Pod安全策略
apiVersion: v1
kind: Pod
metadata:
  name: secure-pod
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 2000
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: app
      image: registry.example.com/my-app:latest
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop:
            - ALL
      resources:
        requests:
          memory: "256Mi"
          cpu: "250m"
        limits:
          memory: "512Mi"
          cpu: "500m"

# 3. 密钥管理
# 使用Kubernetes Secrets
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: production
type: Opaque
stringData:
  database-url: "postgresql://user:password@db:5432/mydb"
  api-key: "your-api-key"
```

### 6.3 故障排查

```bash
# 1. Pod故障排查
# 查看Pod状态
kubectl get pods -n production

# 查看Pod详情
kubectl describe pod <pod-name> -n production

# 查看Pod日志
kubectl logs <pod-name> -n production

# 进入Pod容器
kubectl exec -it <pod-name> -n production -- /bin/bash

# 2. 服务故障排查
# 查看服务
kubectl get svc -n production

# 查看服务详情
kubectl describe svc <service-name> -n production

# 端口转发
kubectl port-forward svc/<service-name> 8080:80 -n production

# 3. Ingress故障排查
# 查看Ingress
kubectl get ingress -n production

# 查看Ingress详情
kubectl describe ingress <ingress-name> -n production

# 查看Ingress Controller日志
kubectl logs -n ingress-nginx <pod-name>

# 4. 资源问题排查
# 查看资源使用情况
kubectl top pods -n production
kubectl top nodes

# 查看资源配额
kubectl describe quota -n production
```

---

## 参考资源

- [Docker官方文档](https://docs.docker.com/)
- [Kubernetes官方文档](https://kubernetes.io/docs/)
- [Helm文档](https://helm.sh/docs/)
- [Prometheus文档](https://prometheus.io/docs/)
- [Terraform文档](https://developer.hashicorp.com/terraform/docs)

---

*本文档持续更新，最后更新于2026年3月*