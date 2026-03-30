# 技术规格说明书：进程管理与 IPC (Process Manager)

> **版本**: 1.0
> **状态**: 待实现 (Draft)
> **目标**: 实现基于 Web Worker 的进程隔离模型，确保 IDE 核心稳定性，并提供应用间通信能力。

## 1. 背景与动机

当前 webEnvOS 的所有应用（编辑器、终端、设置）均作为 React 组件运行在主线程 (UI Thread) 中。
*   **风险**: 任意一个应用的计算密集型任务（如大文件语法高亮）都会阻塞 UI 渲染，导致界面卡顿。
*   **缺陷**: 缺乏应用间的标准通信机制，无法实现“在终端中打开文件”等跨应用操作。

## 2. 架构设计

### 2.1 进程模型 (Process Model)

引入 **SystemProcess** 概念，将应用分为两类：

1.  **UI 进程 (Renderer Process)**:
    *   运行在主线程 (或独立的 Iframe)。
    *   负责界面渲染、用户交互。
    *   通过 IPC 向内核发送指令。

2.  **后台进程 (Worker Process)**:
    *   运行在 Web Worker 中。
    *   负责核心逻辑、数据处理、文件读写、编译任务。
    *   **示例**: Language Server, Git Worker, File Search Indexer。

### 2.2 进程管理器 (Kernel/ProcessManager)

全局单例服务，负责：
*   **PID 分配**: 为每个启动的应用分配唯一 ID。
*   **生命周期管理**: `spawn()`, `kill()`, `suspend()`, `resume()`。
*   **资源监控**: (可选) 监控 Worker 的内存占用。

### 2.3 通信机制 (IPC Bus)

采用 **Comlink** 库简化主线程与 Worker 之间的 RPC 调用。

```typescript
// IPC 接口定义
interface ISystemAPI {
  fs: IFileSystemAPI; // 文件系统访问
  shell: ITerminalAPI; // 终端控制
  window: IWindowAPI; // 窗口管理 (打开/关闭窗口)
}
```

## 3. 详细实施步骤

### 3.1 引入 Comlink
```bash
npm install comlink
```

### 3.2 定义系统 API (`src/kernel/api.ts`)
定义 Worker 可调用的内核方法白名单。

```typescript
export interface KernelMethods {
  openWindow(appId: string, context?: any): void;
  notify(message: string): void;
  readFile(path: string): Promise<string>;
}
```

### 3.3 实现进程类 (`src/kernel/process/Process.ts`)

```typescript
import * as Comlink from 'comlink';

export class Process {
  pid: number;
  worker: Worker;
  api: Comlink.Remote<any>;

  constructor(scriptUrl: string) {
    this.pid = generatePid();
    this.worker = new Worker(scriptUrl);
    this.api = Comlink.wrap(this.worker);
  }

  terminate() {
    this.worker.terminate();
  }
}
```

### 3.4 改造应用架构

以 **Git 服务** 为例进行改造：
1.  将 `GitService.ts` 逻辑移入 `git.worker.ts`。
2.  在 Worker 中通过 Comlink 暴露 `status()`, `commit()`, `log()` 等方法。
3.  主线程 `GitPanel` 组件不再直接 import `git` 库，而是通过 `kernel.getProcess('git').api.status()` 调用。

## 4. 接口定义 (API Specification)

```typescript
interface IProcessManager {
  // 启动一个后台任务
  spawn(name: string, workerUrl: string): Promise<number>;
  
  // 获取运行中的服务代理
  getService<T>(name: string): Comlink.Remote<T>;
  
  // 终止进程
  kill(pid: number): void;
  
  // 列出所有进程
  ps(): ProcessInfo[];
}
```

## 5. 风险评估

*   **传输开销**: `postMessage` 需要序列化/反序列化数据。对于大文件传输，需利用 `Transferable Objects` (如 `ArrayBuffer`) 优化。
*   **调试难度**: Worker 中的错误调试比主线程复杂。需完善错误捕获与日志回传机制。

## 6. 下一步
在文件系统重构 (Phase 1) 完成后，优先将 Git 服务和文件搜索服务迁移至 Worker 进程。
