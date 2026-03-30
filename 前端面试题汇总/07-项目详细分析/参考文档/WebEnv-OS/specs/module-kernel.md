# 内核模块规范 (Kernel Module Specification)

> **模块**: `src/kernel`
> **职责**: 提供操作系统核心服务，屏蔽底层浏览器 API 差异。

## 1. 目录结构详解

```typescript
src/kernel/
├── core/                   // 内核基础
│   ├── Kernel.ts           // [Singleton] 内核主类，负责组装各子系统
│   ├── EventBus.ts         // 系统级事件总线 (emit 'process:created', 'fs:change')
│   └── Logger.ts           // 统一日志服务
│
├── fs/                     // 文件系统 (Filesystem Subsystem)
│   ├── VFS.ts              // 虚拟文件系统门面 (Facade)
│   ├── adapters/           // 适配器
│   │   ├── ZenFSAdapter.ts // 适配 ZenFS
│   │   └── NodeFSAdapter.ts// (Optional) 适配 Node.js fs (for testing)
│   └── utils/              // 路径处理工具 (path.join, path.resolve)
│
├── process/                // 进程管理 (Process Subsystem)
│   ├── ProcessTable.ts     // 进程表 (PID -> Process Instance)
│   ├── Scheduler.ts        // (Future) 简单的调度器
│   └── workers/            // 内核级 Worker 脚本
│       └── git.worker.ts   // Git 操作专用 Worker
│
├── runtime/                // 运行时环境 (Execution Environment)
│   ├── WebContainer.ts     // WebContainers 包装器
│   └── NodeRuntime.ts      // 统一运行时接口
│
└── shell/                  // Shell 解释器 (Fallback)
    ├── JShell.ts           // 纯 JS 实现的简易 Shell (当 WebContainer 不可用时)
    └── commands/           // 内置命令 (ls, cd, cat, echo)
```

## 2. 核心类定义 (Core Class Definitions)

### 2.1 `Kernel` (Singleton)

```typescript
// src/kernel/core/Kernel.ts
import { VFS } from '../fs/VFS';
import { ProcessManager } from '../process/ProcessManager';

export class Kernel {
  private static instance: Kernel;
  
  public fs: VFS;
  public process: ProcessManager;
  public initialized: boolean = false;

  private constructor() {
    this.fs = new VFS();
    this.process = new ProcessManager(this);
  }

  static getInstance(): Kernel {
    if (!Kernel.instance) {
      Kernel.instance = new Kernel();
    }
    return Kernel.instance;
  }

  async boot() {
    console.info('[Kernel] Booting...');
    await this.fs.mountRoot();
    await this.process.init();
    this.initialized = true;
    console.info('[Kernel] Ready.');
  }
}
```

### 2.2 `VFS` (Virtual File System)

```typescript
// src/kernel/fs/VFS.ts
import { fs } from '@zenfs/core';

export class VFS {
  async mountRoot() {
    // 配置 IndexedDB 后端
    // mount('/', new IndexedDBBackend());
  }

  async readFile(path: string): Promise<Uint8Array> {
    return fs.promises.readFile(path);
  }
  
  // ... 更多 POSIX 接口封装
}
```

## 3. 使用规范

### 3.1 UI 组件调用内核

UI 组件**决不允许**直接实例化内核类，必须通过 React Context 或 Hooks。

✅ **正确做法**:
```typescript
// Component.tsx
const { fs } = useKernel();
useEffect(() => {
  fs.readFile('/readme.md').then(setContent);
}, []);
```

❌ **错误做法**:
```typescript
// Component.tsx
import { Kernel } from '@/kernel/core/Kernel'; // 禁止直接导入类
Kernel.getInstance().fs.readFile(...); // 耦合度过高
```

### 3.2 错误处理

内核抛出的所有错误必须标准化为 `KernelError`。

```typescript
export class KernelError extends Error {
  constructor(public code: string, message: string) {
    super(`[${code}] ${message}`);
  }
}
```

## 4. 依赖管理

内核模块**严禁**依赖以下内容：
1.  React / Vue 等 UI 框架。
2.  DOM API (如 `document.getElementById`) —— 必须通过抽象层或仅在特定 Driver 中使用。
3.  Next.js 特定 API (如 `next/navigation`)。

内核必须保持**环境无关性 (Environment Agnostic)**，以便未来移植到 Electron 或纯 Web Worker 环境中。
