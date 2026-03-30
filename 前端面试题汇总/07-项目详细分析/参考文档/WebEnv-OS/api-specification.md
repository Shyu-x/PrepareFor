# webEnvOS API 规范文档

本文档定义了 webEnvOS 中不同层级之间的 API 接口规范，包括前端应用与内核的交互接口（Kernel API），以及前端与后端服务的通信接口（Backend API）。

## 1. Kernel API (前端内核接口)

内核 API 供 `src/apps/*` 下的应用程序使用，通过 `src/kernel` 暴露的单例或 Hooks 进行调用。

### 1.1 文件系统 (FileSystem)
**访问方式**: `useFileSystem(rootPath)` Hook 或 `Kernel.fs.promises`

*   `readFile(path: string, encoding?: string): Promise<string | Uint8Array>`
*   `writeFile(path: string, content: string | Uint8Array): Promise<void>`
*   `readdir(path: string): Promise<string[] | Dirent[]>`
*   `stat(path: string): Promise<Stats>`
*   `mkdir(path: string): Promise<void>`
*   `rm(path: string, options?: { recursive: boolean }): Promise<void>`
*   `mountLocal(handle: FileSystemHandle): Promise<void>` - 挂载本地目录

### 1.2 进程管理 (ProcessManager)
**访问方式**: `Kernel.process`

*   `spawnWorker<T>(name: string, scriptUrl: string): WorkerProcess<T>` - 启动 Web Worker 进程
*   `kill(pid: number): boolean` - 终止进程
*   `ps(): ProcessInfo[]` - 获取进程列表
*   `getProcess(pid: number): SystemProcess | undefined` - 获取进程实例

### 1.3 运行时 (Runtime / WebContainer)
**访问方式**: `Kernel.runtime`

*   `init(): Promise<void>` - 初始化 WebContainer
*   `spawn(command: string, args: string[], options?: SpawnOptions): Promise<WebContainerProcess>` - 执行 Shell 命令
*   `onServerReady(callback: (port: number, url: string) => void): () => void` - 监听端口服务启动

### 1.4 应用注册表 (AppRegistry)
**访问方式**: `Kernel.registry`

*   `getAllApps(): AppManifest[]` - 获取所有已安装应用
*   `getApp(id: string): AppManifest | undefined` - 获取应用详情
*   `register(manifest: AppManifest): void` - 注册新应用

### 1.5 系统监控 (SystemMonitor) [待实现]
**访问方式**: `Kernel.monitor` (计划中)

*   `getSystemMetrics(): Promise<SystemMetrics>` - 获取 CPU/内存/网络 (虚拟) 指标
*   `subscribeMetrics(callback: (metrics: SystemMetrics) => void): () => void` - 订阅实时指标

---

## 2. Backend API (后端服务接口)

后端 API 由 `webenv-backend` (NestJS) 提供，前端通过 HTTP/WebSocket 调用。主要用于持久化配置、Docker 管理（宿主机级别）和协作功能。

**Base URL**: `/api`

### 2.1 Docker 管理 (DockerService)
用于管理宿主机或远程服务器上的 Docker 容器。

*   `GET /docker/containers` - 列出所有容器
    *   Query: `all=true` (包括停止的)
*   `GET /docker/containers/:id` - 获取容器详情
*   `POST /docker/containers/:id/start` - 启动容器
*   `POST /docker/containers/:id/stop` - 停止容器
*   `POST /docker/containers/:id/restart` - 重启容器
*   `DELETE /docker/containers/:id` - 删除容器
*   `GET /docker/containers/:id/logs` - 获取容器日志
*   `GET /docker/images` - 列出镜像
*   `POST /docker/images/pull` - 拉取镜像
    *   Body: `{ image: string }`

### 2.2 系统资源 (SystemResource)
用于 3D 资源监视器展示宿主机状态。

*   `GET /system/metrics` - 获取宿主机 CPU/内存/磁盘 实时数据
*   `WS /system/stream` - WebSocket 流式推送系统指标

### 2.3 工作区持久化 (Workspace)
*   `POST /workspaces/sync` - 同步本地 IndexedDB 数据到云端 (备份)
*   `GET /workspaces/restore` - 从云端恢复数据

---

## 3. 数据类型定义

### SystemMetrics
```typescript
interface SystemMetrics {
  cpu: {
    usage: number; // 0-100
    cores: number;
  };
  memory: {
    total: number; // bytes
    used: number; // bytes
    free: number; // bytes
  };
  network: {
    rx_sec: number; // bytes per second
    tx_sec: number;
  };
  uptime: number; // seconds
}
```

### DockerContainer
```typescript
interface DockerContainerInfo {
  Id: string;
  Names: string[];
  Image: string;
  State: string; // "running", "exited", etc.
  Status: string; // "Up 2 hours"
  Ports: Array<{ IP: string; PrivatePort: number; PublicPort: number; Type: string }>;
}
```