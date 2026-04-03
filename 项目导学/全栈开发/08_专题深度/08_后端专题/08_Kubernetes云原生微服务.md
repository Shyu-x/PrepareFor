# Kubernetes云原生微服务

> 如果把微服务比作一支乐队，那么Kubernetes就是那位无所不能的乐队指挥。它不仅知道每个乐手（Pod）什么时候该演奏，还能在某个乐手缺席时自动调度替补，能根据观众多少（负载）调整演奏节奏，能确保每个乐器的声音都能被正确放大（服务发现）。本章将带你掌握K8s的核心概念，让你的微服务在云原生的舞台上完美演出。

## 一、Kubernetes概述

### 1.1 什么是Kubernetes

Kubernetes（简称K8s）是一个开源的容器编排平台，用于自动化部署、扩缩容和管理容器化应用。

**核心能力：**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Kubernetes 核心能力                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🚀 自动化部署与回滚                                             │
│  ├── 根据期望状态自动部署应用                                    │
│  ├── 支持灰度发布、金丝雀发布                                    │
│  └── 一键回滚到历史版本                                         │
│                                                                 │
│  📈 自动扩缩容                                                   │
│  ├── 根据CPU、内存等指标自动扩缩容                               │
│  ├── 支持HPA（水平Pod自动扩缩）                                  │
│  └── 支持VPA（垂直Pod自动扩缩）                                  │
│                                                                 │
│  🔧 自愈能力                                                     │
│  ├── 自动重启失败的容器                                          │
│  ├── 替换不健康的Pod                                            │
│  └── 节点故障时自动重新调度                                      │
│                                                                 │
│  🌐 服务发现与负载均衡                                           │
│  ├── 内部DNS自动分配服务地址                                     │
│  ├── 负载均衡分发流量                                            │
│  └── 滚动更新时保持服务可用                                       │
│                                                                 │
│  📦 存储编排                                                     │
│  ├── 自动挂载存储系统（本地、云存储、NFS）                        │
│  ├── 支持有状态应用的持久化存储                                  │
│  └── 配置管理（ConfigMap、Secret）                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Kubernetes架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    Kubernetes 集群架构                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                         ┌─────────────┐                        │
│                         │   Control   │                        │
│                         │   Plane     │                        │
│                         │  (主节点)    │                        │
│                         └──────┬──────┘                        │
│                                │                               │
│         ┌──────────────────────┼──────────────────────┐        │
│         │                      │                      │        │
│         ▼                      ▼                      ▼        │
│  ┌─────────────┐        ┌─────────────┐        ┌─────────────┐│
│  │ API Server  │        │ Scheduler   │        │ Controller  ││
│  │   (API服务器) │        │  (调度器)    │        │  Manager    ││
│  └─────────────┘        └─────────────┘        └─────────────┘│
│                                                                 │
│  ┌─────────────┐        ┌─────────────┐        ┌─────────────┐│
│  │    etcd     │        │    kubelet   │        │   kube-proxy ││
│  │  (存储集群  │        │  (节点代理)   │        │  (网络代理)  ││
│  │   状态)     │        │             │        │             ││
│  └─────────────┘        └──────┬──────┘        └──────┬──────┘│
│                                │                      │        │
│  ┌─────────────────────────────┴──────────────────────┴──────┐│
│  │                      Worker Nodes                         ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        ││
│  │  │  Node 1      │  │  Node 2      │  │  Node 3      │        ││
│  │  │  ┌─────────┐ │  │  ┌─────────┐ │  │  ┌─────────┐ │        ││
│  │  │  │  Pod A  │ │  │  │  Pod C  │ │  │  │  Pod E  │ │        ││
│  │  │  │  ┌────┐ │ │  │  └─────────┘ │  │  └─────────┘ │        ││
│  │  │  │  │Container│ │              │  │              │        ││
│  │  │  │  └────┘ │ │  │  ┌─────────┐ │  │  ┌─────────┐ │        ││
│  │  │  │  ┌────┐ │ │  │  │  Pod D  │ │  │  │  Pod F  │ │        ││
│  │  │  │  │Container│ │  │  └─────────┘ │  │  └─────────┘ │        ││
│  │  │  │  └────┘ │ │  │              │  │              │        ││
│  │  │  └─────────┘ │  │              │  │              │        ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 二、核心概念详解

### 2.1 Pod - 最小调度单元

**类比：** Pod就像一个共享客厅的容器，容器（Container）是客厅里的各个房间。Pod内的容器共享网络、存储和进程空间。

```
┌─────────────────────────────────────────────────────────────────┐
│                         Pod 结构                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                         Pod                                 ││
│  │                                                          ││
│  │  ┌─────────────────────────────────────────────────────┐ ││
│  │  │                  共享网络空间                         │ ││
│  │  │  ┌───────────┐  ┌───────────┐  ┌───────────┐     │ ││
│  │  │  │ Container │  │ Container │  │ Container │     │ ││
│  │  │  │  (Nginx)  │  │ (App Java) │  │  (Logger)  │     │ ││
│  │  │  │   :80      │  │   :8080    │  │   :9090    │     │ ││
│  │  │  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘     │ ││
│  │  │        └──────────────┼───────────────┘            │ ││
│  │  │                         │                            │ ││
│  │  │              ┌─────────┴─────────┐                  │ ││
│  │  │              │   Pause Container  │                 │ ││
│  │  │              │    (基础设施容器)    │                  │ ││
│  │  │              │   - 网络命名空间    │                  │ ││
│  │  │              │   - IPC 命名空间    │                  │ ││
│  │  │              │   - UTS 命名空间    │                  │ ││
│  │  │              └─────────────────────┘                  │ ││
│  │  └─────────────────────────────────────────────────────┘ ││
│  │                                                          ││
│  │  ┌─────────────────────────────────────────────────────┐ ││
│  │  │                   共享存储卷                           │ ││
│  │  │  ┌───────────┐  ┌───────────┐  ┌───────────┐     │ ││
│  │  │  │   Volume   │  │   Volume   │  │ emptydir │     │ ││
│  │  │  │  (持久存储) │  │ (配置存储)  │  │ (临时存储) │     │ ││
│  │  │  └───────────┘  └───────────┘  └───────────┘     │ ││
│  │  └─────────────────────────────────────────────────────┘ ││
│  │                                                          ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Pod配置文件：**

```yaml
# 用户服务的Pod配置
# Pod是最小调度单元，通常不直接创建，而是通过Deployment管理

apiVersion: v1  # Kubernetes API版本
kind: Pod       # 资源类型
metadata:
  name: user-service-pod  # Pod名称
  labels:                 # 标签，用于选择器和分组
    app: user-service
    version: v1.0.0
    tier: backend
  annotations:            # 注解，存储额外信息
    description: "用户服务主Pod"
    maintainer: "team-backend@example.com"
spec:
  # 重启策略
  # Always: 容器终止后总是重启（默认值）
  # OnFailure: 容器异常退出时重启
  # Never: 从不重启
  restartPolicy: Always

  # 共享网络配置
  # Pod内的容器共享同一个网络命名空间
  # 可以通过localhost互相访问
  shareProcessNamespace: true  # 共享进程命名空间

  # 容器配置列表
  containers:
    # 主应用容器
    - name: user-service
      # 容器镜像
      image: registry.example.com/user-service:v1.0.0
      # 镜像拉取策略
      # Always: 总是拉取镜像
      # IfNotPresent: 本地有则使用本地，没有则拉取
      # Never: 从不拉取
      imagePullPolicy: IfNotPresent

      # 端口配置
      ports:
        # 容器暴露的端口（仅供文档和Service使用）
        - name: http
          containerPort: 8080
          protocol: TCP  # TCP或UDP
        - name: grpc
          containerPort: 9090
          protocol: TCP

      # 环境变量配置
      env:
        # 静态环境变量
        - name: NODE_ENV
          value: production
        - name: LOG_LEVEL
          value: info
        # 从ConfigMap引用
        - name: APP_CONFIG
          valueFrom:
            configMapKeyRef:
              name: user-config      # ConfigMap名称
              key: app.yaml         # 配置键
              optional: true        # 是否可选
        # 从Secret引用
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: password
        # 引用DownwardAPI（Pod信息）
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name  # Pod名称
        - name: POD_IP
          valueFrom:
            fieldRef:
              fieldPath: status.podIP

      # 资源限制
      resources:
        requests:
          # 最小资源需求（调度用）
          memory: "256Mi"    # 256MB内存
          cpu: "250m"        # 0.25核CPU
        limits:
          # 最大资源限制（超过会被kill或throttle）
          memory: "512Mi"    # 512MB内存上限
          cpu: "500m"        # 0.5核CPU上限

      # 健康检查配置
      livenessProbe:
        # HTTP健康检查：/health返回200表示存活
        httpGet:
          path: /health/live
          port: 8080
          httpHeaders:
            - name: X-Custom-Header
              value: "true"
        initialDelaySeconds: 30   # 启动后30秒开始检查
        periodSeconds: 10        # 每10秒检查一次
        timeoutSeconds: 5        # 超时时间5秒
        failureThreshold: 3      # 连续3次失败则重启
        successThreshold: 1      # 成功1次即认为健康

      readinessProbe:
        # 就绪检查：表示Pod可以接收流量
        httpGet:
          path: /health/ready
          port: 8080
        initialDelaySeconds: 5   # 启动后5秒开始检查
        periodSeconds: 5
        timeoutSeconds: 3
        failureThreshold: 3
        successThreshold: 1

      startupProbe:
        # 启动探针：用于慢启动应用
        # 启动期间使用，不同于liveness
        tcpSocket:
          port: 8080
        initialDelaySeconds: 0
        periodSeconds: 5
        timeoutSeconds: 3
        failureThreshold: 30     # 最多等待150秒

      # 挂载配置
      volumeMounts:
        # 挂载配置文件
        - name: config
          mountPath: /app/config
          readOnly: true
        # 挂载日志目录
        - name: logs
          mountPath: /var/log/app
        # 挂载临时存储
        - name: tmp
          mountPath: /tmp

      # 容器安全配置
      securityContext:
        # 运行用户
        runAsUser: 1000
        # 是否以root运行
        runAsNonRoot: true
        # capabilities配置
        capabilities:
          drop:
            - ALL
          add:
            - NET_BIND_SERVICE

      # 容器生命周期钩子
      lifecycle:
        postStart:
          # 容器启动后执行的脚本
          exec:
            command: ["/bin/sh", "-c", "echo 'Container started'"]
        preStop:
          # 容器停止前执行的脚本（优雅关闭）
          exec:
            command: ["/bin/sh", "-c", "sleep 10"]

  # 初始化容器
  # 在主容器启动前运行的容器，常用于初始化工作
  initContainers:
    - name: init-db
      image: busybox:1.36
      command: ['sh', '-c', 'until nslookup db-service; do echo "Waiting for db"; sleep 2; done;']
      resources:
        limits:
          memory: "64Mi"
          cpu: "50m"

  # 存储卷定义
  volumes:
    - name: config
      configMap:
        name: user-config
        items:
          - key: app.yaml
            path: application.yaml
    - name: logs
      emptyDir: {}  # 临时目录，Pod删除后数据丢失
    - name: tmp
      emptyDir:
        medium: Memory  # 内存文件系统，更快但有限制
        sizeLimit: 100Mi

  # 调度配置
  nodeSelector:
    # 调度到特定标签的节点
    disktype: ssd
    region: us-east-1
  nodeName: node-1  # 指定调度到特定节点

  # 容忍度配置
  # 允许调度到带有特定污点的节点
  tolerations:
    - key: "node-role"
      operator: "Equal"
      value: "batch"
      effect: "NoSchedule"
    - key: "dedicated"
      operator: "Exists"
      effect: "NoExecute"
      tolerationSeconds: 300  # 容忍300秒后才会驱逐

  # 优先级类
  priorityClassName: high-priority

  # DNS配置
  dnsPolicy: ClusterFirst  # ClusterFirst使用集群DNS
  dnsConfig:
    nameservers:
      - 8.8.8.8
    searches:
      - default.svc.cluster.local
      - svc.cluster.local
    options:
      - name: ndots
        value: "5"
```

### 2.2 Deployment - 应用部署

**类比：** Deployment就像餐厅的菜品标准手册。它定义了菜品的配方（Pod模板）、分量（副本数），并确保每份菜都符合标准。当某份菜出现问题时，餐厅会重新做一份；当需要增加供应量时，会多做几份。

```
┌─────────────────────────────────────────────────────────────────┐
│                    Deployment 滚动更新流程                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  初始状态：3个旧版本Pod                                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                        │
│  │  Pod v1 │  │  Pod v1 │  │  Pod v1 │                        │
│  └─────────┘  └─────────┘  └─────────┘                        │
│                                                                 │
│  滚动更新开始：逐步替换为新版本                                   │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │  Pod v2 │  │  Pod v1 │  │  Pod v1 │  │  Pod v1 │            │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘            │
│       │                                                        │
│       ▼                                                        │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │  Pod v2 │  │  Pod v2 │  │  Pod v1 │  │  Pod v1 │            │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘            │
│       │                                                        │
│       ▼                                                        │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │  Pod v2 │  │  Pod v2 │  │  Pod v2 │  │  Pod v1 │            │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘            │
│       │                                                        │
│       ▼                                                        │
│  滚动更新完成：全部替换为新版本                                   │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                        │
│  │  Pod v2 │  │  Pod v2 │  │  Pod v2 │                        │
│  └─────────┘  └─────────┘  └─────────┘                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Deployment配置文件：**

```yaml
# 用户服务的Deployment配置
# Deployment管理Pod的部署、扩缩容、滚动更新

apiVersion: apps/v1  # Deployment API版本
kind: Deployment
metadata:
  name: user-service
  labels:
    app: user-service
    version: v1.0.0
spec:
  # 副本数 - 希望运行的Pod实例数量
  replicas: 3

  # 滚动更新策略
  strategy:
    # 更新类型：RollingUpdate或Recreate
    type: RollingUpdate
    rollingUpdate:
      # 最大不可用Pod数（可以是绝对值或百分比）
      # 25%意味着最多有25%的Pod不可用
      maxUnavailable: 1
      # 最大多出的Pod数（超过这个数会暂停更新）
      maxSurge: 1

  # 选择器 - Deployment通过这个找到它管理的Pod
  # 注意：这个标签选择器不能修改，否则会丢失对已有Pod的管理
  selector:
    matchLabels:
      app: user-service

  # Pod模板 - 创建Pod的蓝图
  template:
    metadata:
      labels:
        app: user-service
        version: v1.0.0  # 版本标签用于区分新旧Pod
    spec:
      containers:
        - name: user-service
          image: registry.example.com/user-service:v1.1.0
          imagePullPolicy: IfNotPresent

          ports:
            - name: http
              containerPort: 8080

          env:
            - name: SPRING_PROFILES_ACTIVE
              value: "production"
            - name: DB_HOST
              value: "postgres.database.svc.cluster.local"

          resources:
            requests:
              memory: "256Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"

          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8080
            initialDelaySeconds: 60
            periodSeconds: 10

          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 5

          # 滚动更新时的探针阈值
          # 确保新Pod真正就绪后才继续更新
          minReadySeconds: 30

  # 回滚配置
  revisionHistoryLimit: 10  # 保留的历史版本数

  # 暂停/恢复部署
  # 可以先暂停，然后分批次更新
  paused: false

  # 进度期限
  # 如果更新超过这个时间没有完成，标记为失败
  progressDeadlineSeconds: 600
```

### 2.3 Service - 服务发现

**类比：** Service就像餐厅的前台接待员。无论后厨有多少厨师（Pod）在忙碌，顾客只需要知道前台的电话号码（前Service IP），就能点到菜。接待员会自动分配到空闲的厨师。

```
┌─────────────────────────────────────────────────────────────────┐
│                    Service 类型对比                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ClusterIP（集群内部访问）                                       │
│  ┌──────────────────────────────────────────┐                  │
│  │  Cluster Network                         │                  │
│  │  ┌──────────┐    ┌──────────┐            │                  │
│  │  │ Service  │───►│   Pod   │            │                  │
│  │  │ 10.0.0.1 │    │10.1.0.2 │            │                  │
│  │  └──────────┘    └──────────┘            │                  │
│  │        │                                  │                  │
│  │        ▼                                  │                  │
│  │  ┌──────────┐                            │                  │
│  │  │   Pod   │                            │                  │
│  │  │10.1.0.3 │                            │                  │
│  │  └──────────┘                            │                  │
│  └──────────────────────────────────────────┘                  │
│  集群内部IP，外部无法访问                                        │
│                                                                 │
│  NodePort（节点端口暴露）                                       │
│  ┌──────────────────────────────────────────┐                  │
│  │  Node: 192.168.1.100                     │                  │
│  │  Port: 30080 ────────────────────────────►│                  │
│  │                                          │                  │
│  │  Node: 192.168.1.101                     │                  │
│  │  Port: 30080 ────────────────────────────►│                  │
│  └──────────────────────────────────────────┘                  │
│  通过 <NodeIP>:<NodePort> 访问                                  │
│                                                                 │
│  LoadBalancer（云厂商负载均衡器）                               │
│  ┌──────────────────────────────────────────┐                  │
│  │  Cloud LB                                │                  │
│  │  external-ip:80 ─────────────────────────►│                  │
│  └──────────────────────────────────────────┘                  │
│  使用云厂商的负载均衡器                                          │
│                                                                 │
│  ExternalName（CNAME别名）                                      │
│  ┌──────────────────────────────────────────┐                  │
│  │  user-service.svc.cluster.local          │                  │
│  │           │                              │                  │
│  │           ▼                              │                  │
│  │  my.database.example.com (CNAME)         │                  │
│  └──────────────────────────────────────────┘                  │
│  返回外部服务的CNAME                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Service配置文件：**

```yaml
# 用户服务的Service配置
# Service提供稳定的访问入口，实现负载均衡和服务发现

apiVersion: v1
kind: Service
metadata:
  name: user-service        # Service名称，也是DNS名称
  labels:
    app: user-service
  annotations:
    # 云厂商负载均衡器配置
    # 不同的云厂商有不同的注解
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
    service.beta.kubernetes.io/aws-load-balancer-backend-protocol: "http"
    service.beta.kubernetes.io/aws-load-balancer-ssl-cert: "arn:aws:acm:..."

spec:
  # Service类型
  # ClusterIP - 集群内部IP（默认）
  # NodePort - 节点端口
  # LoadBalancer - 云厂商负载均衡器
  # ExternalName - CNAME
  type: ClusterIP

  # 端口配置
  ports:
    # Service端口（集群内部访问的端口）
    - name: http
      port: 80              # Service端口
      targetPort: 8080      # 转发到容器的端口
      protocol: TCP
    - name: grpc
      port: 90
      targetPort: 9090
      protocol: TCP

  # 标签选择器 - 找到要代理的Pod
  selector:
    app: user-service      # 所有带此标签的Pod都会被代理

  # 会话亲和性配置
  # None: 无亲和（默认，分散负载）
  # ClientIP: 来自同一IP的请求转发到同一Pod
  sessionAffinity: ClientIP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 10800  # 超时时间

  # 外部流量策略
  # Cluster: 允许外部流量转发到集群内任意节点
  # Local: 只转发给本节点的Pod
  externalTrafficPolicy: Cluster

  # 健康检查端口（用于外部负载均衡）
  healthCheckNodePort: 0

# Headless Service
# 不提供负载均衡，返回所有Pod的DNS地址
---
apiVersion: v1
kind: Service
metadata:
  name: user-service-headless
spec:
  type: ClusterIP
  clusterIP: None  # 关键：设置为None会创建Headless Service

  ports:
    - port: 80
      targetPort: 8080

  selector:
    app: user-service
```

### 2.4 Ingress - HTTP路由

```yaml
# Ingress配置
# Ingress提供HTTP/HTTPS路由，是外部访问集群应用的统一入口

apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: microservices-ingress
  labels:
    app: gateway
  annotations:
    # Nginx Ingress Controller配置
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "100m"
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "30"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "60"
    # 速率限制
    nginx.ingress.kubernetes.io/limit-rps: "100"
    nginx.ingress.kubernetes.io/limit-connections: "50"
    # CORS配置
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/cors-allow-origin: "*"
    # WebSocket支持
    nginx.ingress.kubernetes.io/use-regex: "true"
    nginx.ingress.kubernetes.io/upstream-hash-by: "$request_uri"

spec:
  # Ingress类
  ingressClassName: nginx

  # TLS配置
  tls:
    - hosts:
        - api.example.com
        - "*.example.com"
      secretName: tls-secret  # 包含证书的Secret

  # 路由规则
  rules:
    # 默认主机
    - host: api.example.com
      http:
        paths:
          # 用户服务路由
          - path: /api/users
            pathType: Prefix
            backend:
              service:
                name: user-service
                port:
                  number: 80
            # 熔断配置
            metadata:
              nginx.ingress.kubernetes.io/configuration-snippet: |
                proxy_next_upstream error timeout http_502;

          # 订单服务路由
          - path: /api/orders
            pathType: Prefix
            backend:
              service:
                name: order-service
                port:
                  number: 80
            # 重写规则
            metadata:
              nginx.ingress.kubernetes.io/rewrite-target: /api$1

          # 商品服务路由 - 带版本隔离
          - path: /v1/products
            pathType: Prefix
            backend:
              service:
                name: product-service-v1
                port:
                  number: 80

          - path: /v2/products
            pathType: Prefix
            backend:
              service:
                name: product-service-v2
                port:
                  number: 80

          # 静态资源
          - path: /static
            pathType: Prefix
            backend:
              service:
                name: static-service
                port:
                  number: 80

    # 通配符主机（匹配所有未明确指定的主机）
    - host: ""
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: default-backend
                port:
                  number: 80
```

## 三、滚动更新与回滚

### 3.1 滚动更新原理

```bash
# 滚动更新命令
kubectl set image deployment/user-service \
    user-service=registry.example.com/user-service:v1.1.0 \
    --record

# 查看滚动更新状态
kubectl rollout status deployment/user-service

# 查看部署历史
kubectl rollout history deployment/user-service

# 回滚到上一个版本
kubectl rollout undo deployment/user-service

# 回滚到指定版本
kubectl rollout undo deployment/user-service --to-revision=3
```

**滚动更新策略详解：**

```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      # 最大不可用Pod数
      # 例如：replicas=10, maxUnavailable=3
      # 最多同时关闭3个Pod
      maxUnavailable: 3
      # 或使用百分比
      # maxUnavailable: 25%

      # 最大多余的Pod数
      # 例如：replicas=10, maxSurge=2
      # 更新期间最多可以启动12个Pod（10+2）
      maxSurge: 2
```

### 3.2 健康检查配置

```yaml
# 健康检查三种探针对比

spec:
  containers:
    - name: app
      # 存活探针 - 判断容器是否存活
      # 如果失败，Kubernetes会重启容器
      livenessProbe:
        httpGet:
          path: /health/live
          port: 8080
        initialDelaySeconds: 30   # 等待容器启动
        periodSeconds: 10         # 检查频率
        timeoutSeconds: 5         # 超时时间
        failureThreshold: 3       # 失败次数阈值

      # 就绪探针 - 判断容器是否可以接收流量
      # 如果失败，Kubernetes会将其从Service中移除
      readinessProbe:
        httpGet:
          path: /health/ready
          port: 8080
        initialDelaySeconds: 5
        periodSeconds: 5
        timeoutSeconds: 3
        failureThreshold: 3
        successThreshold: 1

      # 启动探针 - 用于慢启动应用
      # 在启动完成前，其他探针不会生效
      startupProbe:
        httpGet:
          path: /health/startup
          port: 8080
        failureThreshold: 30       # 最多等待30个周期
        periodSeconds: 10         # 每10秒检查一次
        # 总启动时间 = 30 * 10 = 300秒
```

## 四、自动扩缩容

### 4.1 HPA（水平Pod自动扩缩容）

```yaml
# HorizontalPodAutoscaler配置
# 根据CPU、内存等指标自动调整Pod副本数

apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: user-service-hpa
  labels:
    app: user-service
spec:
  # 目标 Deployment
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: user-service

  # 副本数范围
  minReplicas: 2
  maxReplicas: 20

  # 扩缩容指标
  metrics:
    # CPU使用率
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          # 平均CPU利用率达到80%时触发扩容
          averageUtilization: 80

    # 内存使用率
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 70

    # 自定义指标 - 需要Prometheus Adapter
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "1000"

    # Object指标
    - type: Object
      object:
        metric:
          name: nginx_connections
        describedObject:
          kind: Service
          name: user-service
        target:
          type: Value
          value: "10000"

  # 扩缩容行为配置
  behavior:
    # 扩容行为
    scaleUp:
      # 稳定窗口：扩容后需要等待的时间
      stabilizationWindowSeconds: 0
      policies:
        # 扩容速率限制
        - type: Percent
          value: 100       # 每次最多增加100%的副本
          periodSeconds: 60
        - type: Pods
          value: 4         # 每次最多增加4个Pod
          periodSeconds: 60
      # 选择最保守的策略
      selectPolicy: Max

    # 缩容行为
    scaleDown:
      # 缩容窗口：缩容前等待的时间
      # 防止抖动
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10        # 每次最多减少10%的副本
          periodSeconds: 60
        - type: Pods
          value: 2         # 每次最少减少2个Pod
          periodSeconds: 60
      selectPolicy: Min
```

### 4.2 VPA（垂直Pod自动扩缩容）

```yaml
# VerticalPodAutoscaler配置
# 自动调整Pod的资源请求（CPU/内存）

apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: user-service-vpa
spec:
  targetRef:
    apiVersion: "apps/v1"
    kind: Deployment
    name: user-service
  # 更新策略
  updatePolicy:
    # Auto: 自动更新Pod
    # Off: 只给出建议，不自动更新
    # Initial: 只在Pod创建时更新
    updateMode: Auto
  # 资源策略
  resourcePolicy:
    containerPolicies:
      - containerName: user-service
        # 最小资源请求
        minAllowed:
          cpu: 100m
          memory: 128Mi
        # 最大资源请求
        maxAllowed:
          cpu: 4
          memory: 8Gi
        # 控制模式
        mode: Auto
```

## 五、ConfigMap与Secret

### 5.1 ConfigMap配置

```yaml
# ConfigMap配置
# 用于存储非敏感配置

apiVersion: v1
kind: ConfigMap
metadata:
  name: user-service-config
  namespace: production
data:
  # 简单键值对
  APP_ENV: "production"
  LOG_LEVEL: "info"

  # 多行字符串配置
  app.yaml: |
    server:
      port: 8080
      tomcat:
        max-threads: 200
        connection-timeout: 20000

    spring:
      datasource:
        url: jdbc:mysql://postgres:5432/users
        hikari:
          maximum-pool-size: 20
          minimum-idle: 5

  # properties格式
  application.properties: |
    spring.application.name=user-service
    management.endpoints.web.exposure.include=health,info,metrics
```

### 5.2 Secret配置

```yaml
# Secret配置
# 用于存储敏感数据（密码、Token、证书等）
# Secret数据是Base64编码的

apiVersion: v1
kind: Secret
metadata:
  name: user-service-secrets
  namespace: production
type: Opaque  # Secret类型
data:
  # 数据库密码（echo -n "password" | base64）
  DB_PASSWORD: cGFzc3dvcmQ=

  # API密钥
  API_KEY: c29tZS1hcGkta2V5LWZyb20tYmFzZTY0

  # TLS证书（使用kubectl创建时自动编码）
  # kubectl create secret tls tls-secret --cert=cert.pem --key=key.pem
type: kubernetes.io/tls
data:
  # TLS证书
  tls.crt: LS0tLS1CRUdJTiBDRVJUSUZ...
  # TLS私钥
  tls.key: LS0tLS1CRUdJTiBQUklWQ...

# 镜像拉取密钥
type: kubernetes.io/dockerconfigjson
data:
  .dockerconfigjson: eyJhdXRocyI6eyJyZWdpc3RyeS5leGFtcGxlLmNvbSI6ImFiY2Rl...

# 使用stringData（明文，自动编码）
stringData:
  # 写入时不需要Base64编码
  # 读取时仍是编码后的值
  api-secret: "this-is-a-secret-key"
```

### 5.3 Pod中使用ConfigMap和Secret

```yaml
spec:
  containers:
    - name: app
      env:
        # 方式1：单个环境变量
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: user-service-secrets
              key: DB_PASSWORD

        # 方式2：所有键作为环境变量
        envFrom:
          - configMapRef:
              name: user-service-config
          - secretRef:
              name: user-service-secrets

      volumeMounts:
        # 方式3：挂载为文件
        - name: config
          mountPath: /app/config
          readOnly: true
        - name: secrets
          mountPath: /app/secrets
          readOnly: true

  volumes:
    - name: config
      configMap:
        name: user-service-config
        items:
          - key: app.yaml
            path: application.yaml

    - name: secrets
      secret:
        secretName: user-service-secrets
        optional: true  # Secret可选，不存在也不报错
```

## 六、实战踩坑经验

### 6.1 调度相关问题

**坑1：Pod无法调度**

```
症状：Pod一直处于Pending状态

常见原因：
1. 资源不足 - 没有足够CPU/内存
2. 节点选择器不匹配 - 没有节点满足条件
3. 亲和性/反亲和性冲突
4. Taint和Toleration不匹配

排查步骤：
kubectl describe pod <pod-name>
kubectl get events --sort-by='.lastTimestamp'

解决方案：
# 1. 减少资源请求
kubectl patch deployment app -p '{"spec":{"template":{"spec":{"containers":[{"name":"app","resources":{"requests":{"memory":"128Mi","cpu":"50m"}}}]}}}}'

# 2. 检查节点标签
kubectl get nodes --show-labels

# 3. 移除节点选择器限制
kubectl patch deployment app -p '{"spec":{"template":{"spec":{"nodeSelector":{}}}}}'
```

**坑2：滚动更新时服务不可用**

```
问题：新Pod还未就绪，滚动更新继续进行，导致部分请求失败

解决方案：
1. 配置合适的探针和阈值
2. 设置minReadySeconds
3. 调整maxUnavailable和maxSurge
4. 使用PodDisruptionBudget保护关键Pod

示例：
spec:
  strategy:
    rollingUpdate:
      maxUnavailable: 0  # 保持全量Pod
      maxSurge: 1        # 最多多1个Pod
  minReadySeconds: 30    # 新Pod就绪后等待30秒再继续
```

### 6.2 健康检查问题

**坑3：探针配置不当导致频繁重启**

```
问题：应用启动时间长，但探针配置太激进

原因：
- initialDelaySeconds设置太短
- failureThreshold设置太少

解决方案：
# 根据应用启动时间调整
livenessProbe:
  httpGet:
    path: /health/live
    port: 8080
  initialDelaySeconds: 60   # 启动60秒后再检查
  periodSeconds: 10
  failureThreshold: 5       # 允许5次失败
```

### 6.3 性能优化建议

**1. 使用Resource Limits防止资源饥饿**

```yaml
resources:
  limits:
    memory: "512Mi"
    cpu: "500m"
  requests:
    memory: "256Mi"
    cpu: "100m"
```

**2. 使用反亲和性分布Pod**

```yaml
spec:
  affinity:
    podAntiAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 100
          podAffinityTerm:
            labelSelector:
              matchExpressions:
                - key: app
                  operator: In
                  values:
                    - user-service
            topologyKey: kubernetes.io/hostname
```

**3. 使用Pod拓扑分布约束**

```yaml
spec:
  topologySpreadConstraints:
    - maxSkew: 1
      topologyKey: topology.kubernetes.io/zone
      whenUnsatisfiable: DoNotSchedule
      labelSelector:
        matchLabels:
          app: user-service
    - maxSkew: 1
      topologyKey: kubernetes.io/hostname
      whenUnsatisfiable: ScheduleAnyway
      labelSelector:
        matchLabels:
          app: user-service
```

## 七、总结

Kubernetes是现代云原生应用的基础设施，它提供了自动化部署、扩缩容、自愈等强大能力。掌握Pod、Deployment、Service、Ingress等核心概念，能够帮助我们更好地构建和管理微服务架构。

**最佳实践清单：**

| 场景 | 建议 |
|------|------|
| Pod配置 | 设置合理的resources、探针、restartPolicy |
| Deployment | 使用RollingUpdate策略，配置revisionHistory |
| Service | 优先使用ClusterIP，配合Ingress暴露 |
| HPA | 配置minReplicas/maxReplicas，设置合理的metrics |
| ConfigMap/Secret | 分离配置和密钥，使用envFrom或volumeMount |

---

*文档版本：v1.0*
*更新日期：2024年*
*适用技术栈：Kubernetes 1.28+ / Helm 3.x / kubectl*
