# Kubernetes 进阶：从 Pod 调度到生产级高可用架构 (2026版)

## 1. 概述：K8s 不只是容器编排

在 2026 年的云原生时代，Kubernetes 已经成为事实上的分布式操作系统。但大多数开发者只会写 `kubectl apply`，对 Pod 的生命周期管理、资源调度、扩缩容策略一无所知。

本指南深入 K8s 的核心设计，带你从"会用"跨越到"精通"。

---

## 2. Pod 深度解析：容器的壳与魂

### 2.1 Pod 的本质

Pod 是 K8s 的最小调度单元，它不是一个容器，而是一个或多个**共享网络和存储**的容器组。

```yaml
# 典型的多容器 Pod 配置
apiVersion: v1
kind: Pod
metadata:
  name: my-app-pod
  labels:
    app: my-app
spec:
  # 共享网络命名空间（同一个 Pod 内的容器 localhost 互通）
  shareProcessNamespace: true

  containers:
    # 主应用容器
    - name: main-app
      image: my-app:1.0
      ports:
        - containerPort: 8080
      # 资源限制（防止贪婪邻居）
      resources:
        requests:
          memory: "128Mi"
          cpu: "250m"
        limits:
          memory: "256Mi"
          cpu: "500m"
      # 健康检查
      livenessProbe:
        httpGet:
          path: /health
          port: 8080
        initialDelaySeconds: 10
        periodSeconds: 15
      readinessProbe:
        httpGet:
          path: /ready
          port: 8080
        initialDelaySeconds: 5
        periodSeconds: 10

    # Sidecar 容器（日志收集）
    - name: log-collector
      image: fluentd:1.16
      volumeMounts:
        - name: shared-logs
          mountPath: /var/log/app
```

### 2.2 Init 容器 vs Sidecar

**Init 容器**：在主容器启动前运行，用于初始化任务。
```yaml
spec:
  initContainers:
    # 确保数据库就绪后再启动应用
    - name: wait-for-db
      image: postgres:16-alpine
      command: ['sh', '-c',
        'until pg_isready -h db-service; do sleep 2; done']
    # 初始化配置
    - name: setup
      image: busybox:1.36
      command: ['sh', '-c', 'wget -O /app/config.yaml http://config-server/config']
      volumeMounts:
        - name: config
          mountPath: /app
```

### 2.3 Pod 的生命周期状态机

```
Pending → Running → Succeeded/Failed
         ↓
       Unknown (网络分区)
         ↓
       ContainerCreating (镜像拉取中)
         ↓
       CrashLoopBackOff (启动失败重试)
```

---

## 3. Deployment：声明式更新的艺术

### 3.1 滚动更新策略

```yaml
spec:
  replicas: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # 最多超出期望副本数 1 个
      maxUnavailable: 0   # 不可用的 Pod 数量（保证全量服务）
```

**滚动更新流程**：
1. 创建 1 个新 Pod（maxSurge）
2. 新 Pod Ready 后，终止 1 个旧 Pod
3. 重复直到全部更新完成

### 3.2 回滚策略

```bash
# 查看部署历史
kubectl rollout history deployment/my-app

# 回滚到上一个版本
kubectl rollout undo deployment/my-app

# 回滚到指定版本
kubectl rollout undo deployment/my-app --to-revision=3
```

### 3.3 金丝雀发布 (Canary Deployment)

```yaml
# 流量分割：10% 流量到新版本
apiVersion: v1
kind: Service
metadata:
  name: my-app-canary
spec:
  selector:
    app: my-app
    version: canary
  ports:
    - port: 80
---
# Canary Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app-canary
spec:
  replicas: 1  # 只占 10% 流量
  selector:
    matchLabels:
      app: my-app
      version: canary
  template:
    spec:
      containers:
        - name: my-app
          image: my-app:2.0  # 新版本
```

---

## 4. Service：服务发现与负载均衡

### 4.1 Service 类型对比

| 类型 | 适用场景 | 外部访问 |
|------|----------|----------|
| **ClusterIP** | 集群内部通信 | 仅集群内 |
| **NodePort** | 开发/测试 | `节点IP:NodePort` |
| **LoadBalancer** | 云厂商托管 | 云 LB 自动分配 |
| **ExternalName** | CNAME 映射 | 外部服务别名 |

### 4.2 Headless Service（无头服务）

用于有状态服务（如数据库），直接返回 Pod IP：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: mongodb-headless
spec:
  clusterIP: None  # 关键：Headless
  selector:
    app: mongodb
  ports:
    - port: 27017
```

### 4.3 Ingress：七层负载均衡

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app-ingress
  annotations:
    # HTTPS 重定向
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    # 速率限制
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
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api-service
                port:
                  number: 8080
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-service
                port:
                  number: 3000
```

---

## 5. ConfigMap 与 Secret：配置管理

### 5.1 ConfigMap 多种创建方式

```bash
# 从环境变量
kubectl create configmap app-config \
  --from-literal=DB_HOST=localhost \
  --from-literal=LOG_LEVEL=info

# 从文件
kubectl create configmap nginx-config \
  --from-file=nginx.conf

# 从目录
kubectl create configmap app-assets \
  --from-file=./static/
```

### 5.2 Secret 类型与安全实践

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque  # 通用类型（Base64 编码，不加密！）
---
# Kubernetes 1.24+ 推荐：TLS Secret
apiVersion: v1
kind: Secret
metadata:
  name: tls-secret
type: kubernetes.io/tls
data:
  # 必须先 Base64 编码
  tls.crt: LS0tLS1...
  tls.key: LS0tLS1...
```

**2026 安全实践**：
- 使用 **External Secrets Operator** 从 AWS Secrets Manager / Vault 同步
- 永远不要把 Secret 提交到 Git
- 启用 K8s 的 **Encryption at Rest**

```yaml
# 静态加密 Secret
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
  - resources:
      - secrets
    providers:
      - aescbc:
          keys:
            - name: key1
              secret: <base64-encoded-key>
      - identity: {}  # 回退到明文（仅用于迁移）
```

---

## 6. HPA：自动扩缩容深度配置

### 6.1 基于 CPU 和内存的扩缩容

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 3
  maxReplicas: 100
  metrics:
    # CPU 使用率超过 70% 时扩容
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    # 内存使用率超过 80% 时扩容
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  # 扩容冷却时间（防止抖动）
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Percent
          value: 100      # 每次最多翻倍
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300  # 5分钟冷却
      policies:
        - type: Percent
          value: 10       # 每次最多缩容 10%
          periodSeconds: 60
```

### 6.2 基于自定义指标的扩缩容

```yaml
# 使用 Prometheus 指标
metrics:
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"  # 每秒 1000 请求时扩容
```

---

## 7. 调度器进阶：高级亲和性与污点

### 7.1 Pod 亲和性与反亲和性

```yaml
spec:
  affinity:
    # 强制：将 Pod 分散到不同可用区
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        - labelSelector:
            matchExpressions:
              - key: app
                operator: In
                values:
                  - my-app
          topologyKey: topology.kubernetes.io/zone  # AZ 级别分散
    # 倾向：将 Web 服务器和缓存放一起
    podAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 80
          podAffinityTerm:
            labelSelector:
              matchExpressions:
                - key: app
                  operator: In
                  values:
                    - redis
            topologyKey: kubernetes.io/hostname
```

### 7.2 节点亲和性

```yaml
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
          - matchExpressions:
              - key: topology.kubernetes.io/zone
                operator: In
                values:
                  - us-east-1a
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 100
          preference:
            matchExpressions:
              - key: node.kubernetes.io/instance-type
                operator: In
                values:
                  - t3.medium
                  - t3.large
```

### 7.3 污点与容忍度

```bash
# 为专用节点打污点（如 GPU 节点）
kubectl taint nodes gpu-node gpu=true:NoSchedule

# 为需要 GPU 的 Pod 添加容忍度
kubectl taint nodes gpu-node ssd=true:NoExecute

# Pod 配置容忍度
spec:
  tolerations:
    # 容忍污点，可以调度到 GPU 节点
    - key: "gpu"
      operator: "Equal"
      value: "true"
      effect: "NoSchedule"
    #容忍短期驱逐（如节点维护）
    - key: "ssd"
      operator: "Exists"
      effect: "NoExecute"
      tolerationSeconds: 300  # 等待 5 分钟再驱逐
```

---

## 8. 存储：持久化与存储类

### 8.1 PersistentVolume 与 PersistentVolumeClaim

```yaml
# 创建 PV
apiVersion: v1
kind: PersistentVolume
metadata:
  name: mysql-pv
spec:
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteOnce  # 单节点读写
    # - ReadOnlyMany   # 多节点只读
    # - ReadWriteMany  # 多节点读写（如 NFS）
  persistentVolumeReclaimPolicy: Retain  # 删除 PVC 时保留数据
  storageClassName: fast-ssd
  csi:
    driver: ebs.csi.aws.com
    volumeHandle: vol-0a1b2c3d4e5f
---
# Pod 申请 PVC
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mysql-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: fast-ssd
  selector:
    matchLabels:
      type: database
```

### 8.2 存储类动态供给

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  iops: "6000"
  throughput: "250"
  encrypted: "true"
reclaimPolicy: Delete  # 测试环境自动删除，生产用 Retain
volumeBindingMode: WaitForFirstConsumer  # 等待 Pod 调度后再创建卷
allowVolumeExpansion: true  # 支持在线扩容
```

---

## 9. 生产级高可用架构

### 9.1 多区域多活部署

```yaml
# 使用 Pod 反亲和性确保高可用
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 6
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: my-app
  template:
    spec:
      affinity:
        # 强制分散到 3 个可用区
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchExpressions:
                  - key: app
                    operator: In
                    values:
                      - my-app
              topologyKey: topology.kubernetes.io/zone
      containers:
        - name: my-app
          image: my-app:1.0
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
```

### 9.2 Pod 中断预算 (PDB)

确保更新/维护时仍有最小可用 Pod：

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: my-app-pdb
spec:
  # 最少保持 4 个 Pod 可用
  minAvailable: 4
  selector:
    matchLabels:
      app: my-app
---
# 或使用百分比
spec:
  maxUnavailable: 1  # 最多同时不可用 1 个
```

---

## 10. 面试高频问题

**Q1：Pod 为什么设计为可以包含多个容器？**
**答：** 这是 K8s 的核心设计哲学——**边车模式 (Sidecar)**。主容器专注业务逻辑，日志收集、监控代理、配置同步等横切关注点放入 Sidecar 容器。它们共享网络（localhost 互通）和存储卷，避免了复杂的 C NI 配置，同时实现了关注点分离。

**Q2：Service 如何实现负载均衡？**
**答：** Kube-proxy 有三种模式：
1. **Userspace**：最古老，代理效率低。
2. **Iptables**：默认模式，利用 iptables 规则随机转发。缺点是随着 Service 增多，规则链表变长，查找变慢。
3. **IPVS**：2026 年推荐模式。基于内核的 IPVS 负载均衡，提供 $O(1)$ 查找性能，支持多种均衡算法（rr, wrr, lc 等）。

**Q3：如何保证 K8s 集群的生产级可用？**
**答：** 多层保障：
1. **控制平面**：etcd 集群 3+ 节点，使用 Raft 共识。
2. **工作节点**：至少 3 节点，配置 Pod 反亲和性分散到不同 AZ。
3. **高可用 Service**：使用 LoadBalancer + 多副本 Deployment。
4. ** PDB**：配置 Pod 中断预算，防止一次性关闭过多 Pod。
5. **HPA**：配置自动扩缩容应对流量峰值。

---

*本文档持续更新，最后更新于 2026 年 3 月*
