# Code Sandbox 安全执行

## 一、概述：代码执行的安全挑战

在 AI Agent 架构中，代码执行是实现工具调用（Tool Use）的核心技术。无论是执行用户提交的代码片段、运行系统命令，还是调用外部 API，代码执行都面临以下几个核心安全挑战：

| 安全挑战 | 描述 | 潜在风险 |
|----------|------|----------|
| **恶意代码执行** | 攻击者可能提交包含恶意操作的代码 | 系统文件被篡改、数据泄露、权限提升 |
| **资源耗尽攻击** | 无限循环、无限内存申请 | CPU/内存耗尽、服务崩溃 |
| **横向移动攻击** | 通过容器逃逸访问宿主机资源 | 突破隔离边界、访问其他用户数据 |
| **依赖供应链攻击** | 引入含有恶意依赖的第三方包 | 后门植入、供应链污染 |
| **信息泄露** | 代码执行过程中暴露敏感信息 | 密钥泄露、环境变量暴露 |

**核心防御原则**：在 AI Agent 架构中，必须将"永远不要信任外部输入"作为铁律。代码执行层是攻击面的最前沿，任何绕过都会导致整个系统沦陷。

### 1.1 AI Agent 代码执行的新挑战

根据 NVIDIA 2024年12月发布的技术博客《Sandboxing Agentic AI Workflows with WebAssembly》，当前 AI Agent 工作流中的代码执行面临独特的挑战：

> **核心问题**：在 Agentic AI 工作流中，大语言模型（LLM）生成的代码执行存在安全风险，包括提示注入（Prompt Injection）和代码错误。这些风险可以通过使用 WebAssembly（Wasm）在用户浏览器中沙箱化代码执行来缓解。

这意味着代码执行安全的边界正在从服务端扩展到客户端，这是一个重要的架构趋势。

---

## 二、Docker 容器隔离

### 2.1 容器隔离原理

Docker 是目前最流行的代码执行沙箱方案。其隔离机制基于 Linux 内核的命名空间（Namespace）和控制组（Cgroup）技术：

```dockerfile
# 示例：安全的代码执行容器镜像
FROM python:3.11-slim

# 使用非 root 用户运行，将 rootfs 设为只读
USER nobody

# 限制资源使用：CPU、内存、进程数
# cgroup v2 资源限制
WORKDIR /app

# 只读文件系统，防止写入系统目录
# 通过 docker run --read-only 启用

# 网络隔离：不允许访问内网
# 通过 docker run --network none 禁用网络

# 文件系统限制：临时目录独立
VOLUME ["/tmp"]
```

### 2.2 Docker 安全配置详解

```typescript
// TypeScript：Docker 容器配置接口定义
interface ContainerConfig {
  // 容器镜像名称
  image: string;

  // 资源限制配置
  resources: {
    // 内存限制（字节），防止内存耗尽攻击
    memoryLimit: number;      // 例如：512 * 1024 * 1024 = 512MB
    // CPU 时间片限制（相对权重）
    cpuShares: number;        // 例如：256 表示低优先级
    // 进程数限制
    pidsLimit: number;       // 例如：64，防止 PID 耗尽
    // 存储 IO 限制（字节/秒）
    storageIoLimit?: number;
  };

  // 安全策略配置
  security: {
    // 禁用特权模式
    noPrivileged: boolean;    // 必须为 true
    // 禁用网络访问
    networkMode: 'none' | 'bridge' | 'host';
    // 只读根文件系统
    readOnlyRootFilesystem: boolean;  // 必须为 true
    // 禁用新增设备
    disableDevices: boolean;
    // Seccomp 配置文件
    seccompProfile?: 'unconfined' | 'docker/default' | 'default';
    // AppArmor/SELinux 配置文件
    apparmorProfile?: string;
    // 用户 ID 范围映射（将容器内 root 映射为宿主机非特权用户）
    userNamespaceMode?: 'host' | 'private';
  };

  // 超时配置
  timeout: {
    // 容器最大执行时间（毫秒）
    maxExecutionTime: number;  // 例如：30000 = 30秒
    // 启动超时（毫秒）
    startupTimeout: number;    // 例如：10000 = 10秒
  };
}

// Docker 容器安全配置的默认最佳实践
const SAFE_CONTAINER_CONFIG: ContainerConfig = {
  image: 'secure-code-runner:latest',
  resources: {
    memoryLimit: 512 * 1024 * 1024,  // 512MB，防止内存耗尽
    cpuShares: 256,                     // 限制 CPU 权重
    pidsLimit: 64,                      // 限制最大进程数
  },
  security: {
    noPrivileged: true,                 // 禁止特权模式
    networkMode: 'none',               // 禁用网络（最安全）
    readOnlyRootFilesystem: true,       // 根文件系统只读
    disableDevices: true,              // 禁止访问设备
    seccompProfile: 'docker/default',   // 使用 Docker 默认 seccomp
  },
  timeout: {
    maxExecutionTime: 30000,           // 30 秒超时
    startupTimeout: 10000,             // 10 秒启动超时
  },
};
```

### 2.3 容器执行管理器实现

```typescript
// Docker 代码执行沙箱管理器
class DockerSandbox {
  // Docker 客户端实例
  private docker: Dockerode;

  // 构造函数：注入 Dockerode 客户端
  constructor() {
    this.docker = new Dockerode();
  }

  /**
   * 在隔离容器中执行代码
   * @param code 要执行的代码
   * @param language 执行语言（python/node/bash）
   * @returns 执行结果或错误信息
   */
  async execute(
    code: string,
    language: 'python' | 'node' | 'bash'
  ): Promise<ExecutionResult> {
    // 第一步：创建临时代码文件（写入临时卷）
    const containerId = await this.createContainer(language);

    try {
      // 第二步：上传代码到容器
      await this.uploadCode(containerId, code, language);

      // 第三步：执行代码（带超时控制）
      const result = await this.runWithTimeout(
        this.executeInContainer(containerId, language),
        30000  // 30 秒超时
      );

      return {
        success: true,
        output: result.stdout,
        error: result.stderr,
        exitCode: result.exitCode,
        executionTime: result.duration,
      };
    } catch (error) {
      // 第四步：处理错误（超时、内存超限、运行时错误）
      return this.handleExecutionError(error);
    } finally {
      // 第五步：无论成功失败，必须清理容器
      await this.cleanupContainer(containerId);
    }
  }

  /**
   * 创建安全配置的容器
   */
  private async createContainer(language: string): Promise<string> {
    const container = await this.docker.createContainer({
      // 使用轻量级安全镜像
      Image: `secure-runner-${language}:latest`,

      // 以非特权用户运行（关键安全措施）
      User: '65534:65534',  // nobody 用户的 UID:GID

      // 资源限制
      HostConfig: {
        // 内存限制
        Memory: 512 * 1024 * 1024,
        // CPU 权重限制
        CpuShares: 256,
        // PID 数量限制（防止 Fork 炸弹）
        PidsLimit: 64,
        // 禁用网络（完全隔离）
        NetworkMode: 'none',
        // 只读文件系统
        ReadonlyRootfs: true,
        // 自动删除容器（退出后自动清理）
        AutoRemove: false,  // 我们手动清理，保证可追溯
        // 绑定临时目录为读写，其他只读
        Binds: [
          '/tmp/code-exec-XXXX:/tmp:rw',  // 临时工作目录
        ],
        // 安全加固：禁用特权、capabilities 降级
        Privileged: false,
        CapDrop: ['ALL'],         // 丢弃所有 Linux capabilities
        SecurityOpt: [
          'no-new-privileges:true',  // 禁止获取新权限
        ],
        // 日志配置：限制日志大小，防止日志注入
        LogConfig: {
          Type: 'json-file',
          Config: {
            'max-size': '10m',
            'max-file': '3',
          },
        },
      },

      // 环境变量：限制语言环境，减少攻击面
      Env: [
        'LANG=C.UTF-8',
        'LC_ALL=C.UTF-8',
        'PYTHONDONTWRITEBYTECODE=1',  // Python: 禁止写入 .pyc 文件
        'NODE_ENV=production',
        'PATH=/usr/local/bin:/usr/bin:/bin',  // 限制 PATH
      ],

      // 网络禁用（与 HostConfig.NetworkMode='none' 等效）
      NetworkingConfig: {
        EndpointsConfig: {},
      },

      // 工作目录设置为临时目录
      WorkingDir: '/tmp/work',
    });

    return container.id;
  }

  /**
   * 在带超时的 Promise 中包装执行逻辑
   * 这是防止代码无限期运行的关键机制
   */
  private async runWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    // 使用 Promise.race 实现超时控制
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new ExecutionTimeoutError(
          `代码执行超时（${timeoutMs}ms）`
        ));
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * 处理执行过程中的各类错误
   */
  private handleExecutionError(error: unknown): ExecutionResult {
    if (error instanceof ExecutionTimeoutError) {
      return {
        success: false,
        output: '',
        error: `执行超时：${error.message}`,
        exitCode: -1,
        executionTime: -1,
        errorType: 'TIMEOUT',
      };
    }

    if (error instanceof OutOfMemoryError) {
      return {
        success: false,
        output: '',
        error: '内存超限：代码使用了超过允许范围的内存',
        exitCode: -1,
        executionTime: -1,
        errorType: 'OOM',
      };
    }

    if (error instanceof ProcessKilledError) {
      return {
        success: false,
        output: '',
        error: '进程被强制终止（可能检测到恶意行为）',
        exitCode: -1,
        executionTime: -1,
        errorType: 'KILLED',
      };
    }

    // 其他未知错误
    return {
      success: false,
      output: '',
      error: `执行错误：${error instanceof Error ? error.message : '未知错误'}`,
      exitCode: -1,
      executionTime: -1,
      errorType: 'UNKNOWN',
    };
  }
}
```

### 2.4 容器逃逸防护

容器逃逸（Container Escape）是 Docker 隔离最大的安全威胁。以下是关键防护措施：

```typescript
// 容器逃逸防护检查清单
const CONTAINER_ESCAPE_CHECKLIST = {
  // 1. 禁止特权模式（必须）
  // Privileged: false  ← 必须在配置中明确禁用

  // 2. 丢弃所有 capabilities（关键）
  // CapDrop: ['ALL']  ← 防止通过 capabilities 提权

  // 3. 禁止新增权限
  // SecurityOpt: ['no-new-privileges:true']  ← 防止 SUID 提权

  // 4. 用户命名空间映射（高级）
  // UsernsMode: 'host' 配合 LXC 配置文件
  // 将容器内 UID 0 映射为宿主机非特权 UID

  // 5. seccomp 白名单
  seccomp: {
    // 允许的系统调用白名单（最小化原则）
    allowlist: [
      'read', 'write', 'open', 'close',
      'brk', 'mmap', 'mprotect', 'munmap',
      'sigaltstack', 'rt_sigaction', 'rt_sigprocmask',
      'ioctl', 'access', 'pipe', 'pipe2',
      'sched_yield', 'madvise', 'dup', 'dup2',
      'pause', 'nanosleep', 'getitimer', 'alarm',
      'setitimer', 'getpid', 'sendfile', 'socket',
      'connect', 'accept', 'sendto', 'recvfrom',
      'sendmsg', 'recvmsg', 'shutdown', 'bind', 'listen',
      'getsockname', 'getpeername', 'socketpair',
      'setsockopt', 'getsockopt', 'clone', 'fork', 'vfork',
      'execve', 'exit', 'wait4', 'kill', 'uname',
      'getrlimit', 'getrusage', 'sysinfo', 'times',
      'getuid', 'syslog', 'getgid', 'setuid', 'setgid',
      'geteuid', 'getegid', 'setpgid', 'getppid', 'getpgrp',
      'setsid', 'setreuid', 'setregid', 'getgroups', 'setgroups',
      'setresuid', 'getresuid', 'setresgid', 'getresgid',
      'getpgid', 'setfsuid', 'setfsgid', 'getsid', 'capget',
      'capset', 'rt_sigpending', 'rt_sigtimedwait',
      'rt_sigqueueinfo', 'rt_sigsuspend', 'sigaltstack',
      'utime', 'mknod', 'personality', 'ustat', 'statfs',
      'fstatfs', 'sysfs', 'getpriority', 'setpriority',
      'sched_setparam', 'sched_getparam', 'sched_setscheduler',
      'sched_getscheduler', 'sched_get_priority_max',
      'sched_get_priority_min', 'sched_rr_get_interval',
      'mlock', 'munlock', 'mlockall', 'munlockall',
      'vhangup', 'pivot_root', '_sysctl',
      'prctl', 'arch_prctl', 'adjtimex', 'setrlimit',
      'chroot', 'sync', 'acct', 'settimeofday', 'mount',
      'umount2', 'swapon', 'swapoff', 'reboot', 'sethostname',
      'setdomainname', 'iopl', 'ioperm', 'init_module',
      'delete_module', 'quotactl', 'gettid', 'readahead',
      'setxattr', 'lsetxattr', 'fsetxattr', 'getxattr',
      'lgetxattr', 'fgetxattr', 'listxattr', 'llistxattr',
      'flistxattr', 'removexattr', 'lremovexattr', 'fremovexattr',
      'tkill', 'time', 'futex', 'sched_setaffinity',
      'sched_getaffinity', 'io_setup', 'io_destroy',
      'io_getevents', 'io_submit', 'io_cancel', 'lookup_dcookie',
      'epoll_create', 'remap_file_pages', 'set_tid_address',
      'timer_create', 'timer_settime', 'timer_gettime',
      'timer_getoverrun', 'timer_delete', 'clock_settime',
      'clock_gettime', 'clock_getres', 'clock_nanosleep',
      'exit_group', 'epoll_wait', 'epoll_ctl', 'tgkill',
      'utimes', 'mbind', 'set_mempolicy', 'get_mempolicy',
      'mq_open', 'mq_unlink', 'mq_timedsend', 'mq_timedreceive',
      'mq_notify', 'mq_getsetattr', 'kexec_load', 'waitid',
      'add_key', 'request_key', 'keyctl', 'ioprio_set',
      'ioprio_get', 'inotify_init', 'inotify_add_watch',
      'inotify_rm_watch', 'migrate_pages', 'openat', 'mkdirat',
      'mknodat', 'fchownat', 'futimesat', 'newfstatat',
      'unlinkat', 'renameat', 'linkat', 'symlinkat', 'readlinkat',
      'fchmodat', 'faccessat', 'pselect6', 'ppoll', 'signalfd',
      'timerfd_create', 'eventfd', 'tfork', 'timerfd_settime',
      'timerfd_gettime', 'accept4', 'signalfd4', 'eventfd2',
      'epoll_create1', 'dup3', 'pipe2', 'inotify_init1',
      'preadv', 'pwritev', 'rt_tgsigqueueinfo', 'perf_event_open',
      'recvmmsg', 'fanotify_init', 'fanotify_mark',
      'prlimit68', 'name_to_handle_at', 'open_by_handle_at',
      'clock_adjtime', 'syncfs', 'sendmmsg', 'setns', 'getcpu',
      'process_vm_readv', 'process_vm_writev', 'setsid',
    ],
  },
};
```

### 2.5 Docker Sandboxes（2026年新特性）

根据 Docker 官方文档（2026年3月），Docker Desktop 4.58+ 引入了 **Docker Sandboxes** 实验性功能，专门用于在隔离环境中运行 AI 编码代理：

> Docker Sandboxes lets you run AI coding agents in isolated environments on your machine. Sandboxes provides a secure way to give AI agents access to tools and resources without compromising the security of your host system.

这一新特性表明容器化隔离技术正在与 AI Agent 深度整合，成为企业级 AI 编码助手的标准安全方案。

---

## 三、WebAssembly 沙箱

### 3.1 WebAssembly 沙箱原理

WebAssembly（WASM）是一种二进制指令格式，可以在浏览器和服务器环境中提供接近原生的执行速度，同时提供强大的沙箱隔离能力。与 Docker 相比，WASM 的优势在于：

| 特性 | Docker 容器 | WebAssembly 沙箱 |
|------|------------|-----------------|
| 启动时间 | 数百毫秒~秒级 | 亚毫秒级 |
| 内存开销 | 数十MB | 数百KB~数MB |
| 隔离粒度 | 进程级 | 指令级 |
| 跨平台 | 依赖内核 | 真正跨平台 |
| 冷启动 | 慢 | 极快 |
| 网络访问 | 可控 | 需显式授权 |

### 3.2 Pyodide：浏览器端 Python 执行

根据 NVIDIA 的技术博客，使用 Pyodide（CPython 到 WebAssembly 的移植版本）可以在用户浏览器中执行 Python 代码，实现以下安全优势：

> 通过使用 Pyodide 将 LLM 生成的 Python 代码执行转移到用户浏览器，应用开发者可以提高安全控制能力，减少对应用资源和相邻用户的风险。

```typescript
// Pyodide 浏览器端 Python 执行
class PyodideSandbox {
  private pyodide: any;
  private isInitialized: boolean = false;

  /**
   * 初始化 Pyodide 环境
   * 加载 WASM 版本的 Python 解释器
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // 加载 Pyodide WASM 模块
    const pyodideModule = await loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
    });

    this.pyodide = pyodideModule;
    this.isInitialized = true;

    // 设置安全限制：禁用危险模块
    await this.pyodide.runPythonAsync(`
      import sys
      import importlib

      # 移除危险模块
      dangerous_modules = ['os', 'subprocess', 'socket', 'ctypes', 'resource']
      for mod in dangerous_modules:
          if mod in sys.modules:
              del sys.modules[mod]

      # 阻止动态导入危险模块
      original_import = __builtins__.__import__

      def safe_import(name, *args, **kwargs):
          if name in dangerous_modules:
              raise ImportError(f"Module '{name}' is not allowed in sandbox")
          return original_import(name, *args, **kwargs)

      __builtins__.__import__ = safe_import
    `);
  }

  /**
   * 在浏览器中安全执行 Python 代码
   */
  async execute(code: string): Promise<ExecutionResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // 执行用户代码
      const result = await this.pyodide.runPythonAsync(code);

      return {
        success: true,
        output: String(result),
        error: '',
        executionTime: 0,
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error),
        executionTime: 0,
        errorType: 'RUNTIME_ERROR',
      };
    }
  }
}
```

### 3.3 WASM 安全执行环境封装

```typescript
// WebAssembly 安全执行环境封装
import wasmedge from 'wasmedge';
import { WASI } from 'node:wasi';

// WASM 执行结果接口
interface WasmExecutionResult {
  success: boolean;
  output: string;
  error: string;
  exitCode: number;
  memoryUsed: number;     // 内存使用量（字节）
  instructionsExecuted: number;  // 执行的指令数
}

// WASM 沙箱配置
interface WasmSandboxConfig {
  // 内存限制（字节）
  maxMemory: number;          // 例如：64 * 1024 * 1024 = 64MB
  // 指令数限制（防止无限循环）
  maxInstructions: number;    // 例如：100_000_000（1亿条）
  // 允许导入的系统函数白名单
  allowedImports: string[];   // 例如：['wasi_snapshot_preview1']
  // 超时时间（毫秒）
  timeout: number;
  // 是否允许访问网络
  networkEnabled: boolean;
  // 是否允许访问文件系统
  fsEnabled: boolean;
  // 允许访问的目录（仅当 fsEnabled=true 时）
  allowedPaths: string[];
}

class WasmSandbox {
  private config: WasmSandboxConfig;

  constructor(config: WasmSandboxConfig) {
    this.config = {
      maxMemory: 64 * 1024 * 1024,    // 默认 64MB
      maxInstructions: 100_000_000,    // 默认 1亿条指令
      allowedImports: ['wasi_snapshot_preview1'],
      timeout: 30_000,                  // 默认 30 秒
      networkEnabled: false,
      fsEnabled: false,
      allowedPaths: [],
      ...config,
    };
  }

  /**
   * 执行 WASM 模块（安全隔离）
   * 适用于执行不可信的第三方代码或插件
   */
  async executeWasm(
    wasmBytes: Uint8Array,
    args: string[]
  ): Promise<WasmExecutionResult> {
    // 第一步：验证 WASM 模块的合法性
    const validation = this.validateWasmModule(wasmBytes);
    if (!validation.valid) {
      return {
        success: false,
        output: '',
        error: `WASM 模块验证失败：${validation.reason}`,
        exitCode: 1,
        memoryUsed: 0,
        instructionsExecuted: 0,
      };
    }

    // 第二步：创建 WASM 虚拟机实例
    const vm = new wasmedge.VM();

    // 第三步：配置内存限制
    // 将内存限制写入 WASM 线性内存区域
    vm.setMemoryLimit(this.config.maxMemory);

    // 第四步：配置 WASI 环境
    const wasi = new WASI({
      // 只允许特定的系统调用
      args: args,
      // 预打开目录（仅允许访问特定目录）
      preopens: this.config.allowedPaths.join(','),
      // 绑定标准流
      bindStdout: true,
      bindStderr: true,
    });

    // 第五步：注册 WASI（受限的系统接口）
    vm.registerWASI(wasi);

    // 第六步：执行并监控
    const startTime = Date.now();
    try {
      const result = await this.executeWithMonitoring(vm, wasmBytes);
      const endTime = Date.now();

      return {
        success: result.exitCode === 0,
        output: result.stdout,
        error: result.stderr,
        exitCode: result.exitCode,
        memoryUsed: vm.getMemoryUsage(),
        instructionsExecuted: vm.getInstructionCount(),
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: `WASM 执行异常：${error instanceof Error ? error.message : '未知错误'}`,
        exitCode: -1,
        memoryUsed: 0,
        instructionsExecuted: 0,
      };
    }
  }

  /**
   * 验证 WASM 模块（防止恶意模块）
   */
  private validateWasmModule(bytes: Uint8Array): { valid: boolean; reason?: string } {
    // 1. 检查 WASM 魔数（0x6d736100 = '\0asm'）
    const magic = [0x00, 0x61, 0x73, 0x6d];
    for (let i = 0; i < 4; i++) {
      if (bytes[i] !== magic[i]) {
        return { valid: false, reason: '无效的 WASM 文件头' };
      }
    }

    // 2. 检查版本号（当前为 1）
    const version = bytes[4] | (bytes[5] << 8) | (bytes[6] << 16) | (bytes[7] << 24);
    if (version !== 1 && version !== 0x0d) {  // 0x0d = MVP + reference types
      return { valid: false, reason: '不支持的 WASM 版本' };
    }

    // 3. 检查导入函数（只允许白名单内的导入）
    // 解析 WASM 二进制格式，提取导入段
    const imports = this.extractImports(bytes);
    const disallowed = imports.filter(
      imp => !this.config.allowedImports.includes(imp.module)
    );
    if (disallowed.length > 0) {
      return {
        valid: false,
        reason: `禁止的导入模块：${disallowed.join(', ')}`,
      };
    }

    // 4. 检查模块大小（防止大型恶意模块）
    if (bytes.length > 10 * 1024 * 1024) {  // 10MB 上限
      return { valid: false, reason: 'WASM 模块过大' };
    }

    return { valid: true };
  }

  /**
   * 带监控的执行（防止无限循环）
   */
  private async executeWithMonitoring(
    vm: wasmedge.VM,
    wasmBytes: Uint8Array
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    // 设置定期检查点（每 N 条指令）
    const checkInterval = 1_000_000;  // 每 100 万条指令检查一次
    let instructionCount = 0;

    // 使用计数器中间件监控指令执行
    vm.setInstructionCounter((count: number) => {
      instructionCount += count;
      if (instructionCount >= this.config.maxInstructions) {
        throw new Error(
          `指令数超限（${instructionCount} > ${this.config.maxInstructions}）`
        );
      }
    });

    // 设置超时监控
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('WASM 执行超时'));
      }, this.config.timeout);
    });

    const executePromise = new Promise<{ stdout: string; stderr: string; exitCode: number }>(
      (resolve, reject) => {
        try {
          const result = vm.runBuffer(wasmBytes);
          resolve({
            stdout: result?.stdout || '',
            stderr: result?.stderr || '',
            exitCode: result?.exitCode || 0,
          });
        } catch (err) {
          reject(err);
        }
      }
    );

    return Promise.race([executePromise, timeoutPromise]);
  }

  /**
   * 从 WASM 二进制中提取导入函数列表
   * 简化实现：实际需要完整解析 WASM 二进制格式
   */
  private extractImports(bytes: Uint8Array): { module: string; name: string }[] {
    const imports: { module: string; name: string }[] = [];
    // 实际实现需要完整解析 WASM binary format section
    // 此处为简化版本
    return imports;
  }
}

// 使用示例：安全执行不受信任的 WASM 代码
async function main() {
  const sandbox = new WasmSandbox({
    maxMemory: 64 * 1024 * 1024,   // 64MB
    maxInstructions: 100_000_000,   // 1亿条指令
    timeout: 30_000,                // 30 秒
    allowedImports: ['wasi_snapshot_preview1'],  // 仅允许 WASI 标准接口
    fsEnabled: false,               // 禁用文件系统
    networkEnabled: false,          // 禁用网络
  });

  // 加载用户提供的 WASM 代码
  const wasmCode = loadUserWasmCode();

  const result = await sandbox.executeWasm(wasmCode, ['arg1', 'arg2']);

  if (result.success) {
    console.log(`执行成功，输出：${result.output}`);
    console.log(`内存使用：${result.memoryUsed} 字节`);
    console.log(`执行指令数：${result.instructionsExecuted}`);
  } else {
    console.error(`执行失败：${result.error}`);
  }
}
```

### 3.4 WASM 与 Docker 的适用场景对比

```
代码执行场景选型决策树：

代码来源是否完全可信？
├─ 是（内部代码、已审核代码）
│   └─ → 使用 Docker 容器（有完整操作系统能力）
│       ├─ 需要完整系统调用 → Docker
│       └─ 需要高性能计算 → Docker + GPU 支持
│
└─ 否（用户提交代码、第三方插件）
    ├─ 需要高安全隔离 → WASM 沙箱
    │   ├─ 需要文件系统 → WASM + WASI（受限）
    │   └─ 纯计算任务 → WASM（最强隔离）
    │
    └─ 需要毫秒级冷启动 → WASM
        └─ 需要纳秒级执行 → 原生编译（危险，仅绝对可信代码）
```

---

## 四、gVisor 与 Kata Containers 对比

### 4.1 隔离技术对比

在容器隔离领域，gVisor 和 Kata Containers 代表了两种不同的安全增强路线：

| 对比维度 | gVisor（runsc） | Kata Containers |
|----------|----------------|----------------|
| **隔离原理** | 用户态内核拦截（用户空间内核） | 轻量级虚拟机（硬件虚拟化） |
| **启动速度** | 约 125ms | 约 1-2 秒 |
| **内存开销** | 约 10-20MB | 约 50-200MB |
| **安全性** | 内核系统调用拦截 | 硬件级虚拟化隔离 |
| **兼容性** | 支持大部分 Linux 系统调用 | 接近完整虚拟机兼容性 |
| **性能损耗** | 约 5-10% | 约 2-5% |
| **适用场景** | 高并发、多租户环境 | 高安全要求、严格隔离 |

### 4.2 gVisor 工作原理

gVisor 通过截获应用程序的系统调用，在用户空间实现了一个轻量级内核（Sentry），无需依赖宿主机内核：

```
应用程序
    ↓ 系统调用
┌─────────────────────────────────┐
│         Sentry 进程              │  ← 用户空间运行的内核
│  ┌───────────────────────────┐  │
│  │    系统调用处理             │  │
│  │  （截获并处理所有 syscall）  │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │    文件系统（gVisor FS）   │  │
│  │  （受限的文件系统实现）      │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │    网络栈（用户态网络）      │  │
│  │  （受限的网络接口）          │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
    ↓
宿主机内核（仅接收 Sentry 授权的系统调用）
```

### 4.3 Kata Containers 工作原理

Kata Containers 使用轻量级虚拟机运行容器，每个容器运行在独立的微型虚拟机中，提供接近硬件级的隔离：

```
┌──────────────────────────────────────────────────┐
│               宿主机（Hypervisor）                  │
│  ┌─────────────────┐  ┌─────────────────┐        │
│  │   微型 VM 1     │  │   微型 VM 2     │        │
│  │  ┌───────────┐ │  │  ┌───────────┐ │        │
│  │  │  Guest    │ │  │  │  Guest    │ │        │
│  │  │  Kernel   │ │  │  │  Kernel   │ │        │
│  │  └───────────┘ │  │  └───────────┘ │        │
│  │  ┌───────────┐ │  │  ┌───────────┐ │        │
│  │  │  容器 1   │ │  │  │  容器 2   │ │        │
│  │  │ (containerd-shim) │ │ (containerd-shim) │  │
│  │  └───────────┘ │  │  └───────────┘ │        │
│  └─────────────────┘  └─────────────────┘        │
└──────────────────────────────────────────────────┘
```

### 4.4 选型决策指南

```typescript
// 根据场景选择合适的隔离技术
interface IsolationDecision {
  // 隔离技术类型
  technology: 'docker' | 'gvisor' | 'kata' | 'wasm';

  // 决策理由
  reason: string;

  // 配置建议
  config: Record<string, unknown>;
}

/**
 * 根据代码来源和安全要求选择合适的隔离方案
 * @param codeSource 代码来源（完全可信/部分可信/不可信）
 * @param securityLevel 安全级别要求（标准/高/最高）
 * @param performanceRequirement 性能要求（最佳/均衡/优先安全）
 */
function selectIsolationStrategy(
  codeSource: 'internal' | 'partner' | 'external',
  securityLevel: 'standard' | 'high' | 'critical',
  performanceRequirement: 'performance' | 'balanced' | 'security'
): IsolationDecision {
  // 最高安全级别：使用 Kata Containers
  if (securityLevel === 'critical') {
    return {
      technology: 'kata',
      reason: '最高安全级别要求使用硬件虚拟化隔离',
      config: {
        // Kata 配置：使用 QEMU + Firecracker
        hypervisor: 'qemu',
        // 启用安全启动
        security: {
          secureBoot: true,
          staticSandbox: true,
          // 禁用共享内存（防止侧信道攻击）
          disableSharedMemory: true,
        },
        // 资源限制
        resources: {
          memory: '512m',
          cpu: '1',
        },
      },
    };
  }

  // 高安全级别：使用 gVisor
  if (securityLevel === 'high' || codeSource === 'external') {
    return {
      technology: 'gvisor',
      reason: '外部代码使用 gVisor 提供强隔离',
      config: {
        // gVisor 配置
        runtime: 'runsc',
        // 禁止特定的危险系统调用
        disallowedSyscalls: [
          'ptrace',    // 禁止进程调试（防止注入）
          'syslog',   // 禁止系统日志访问
          'perf_event_open',  // 禁止性能分析（防止侧信道）
          'init_module',     // 禁止加载内核模块
          'finit_module',    // 禁止加载内核模块
          'delete_module',   // 禁止卸载内核模块
        ],
        // 启用用户命名空间
        userNS: true,
        // 禁止文件描述符传递
        disableFDSharing: true,
      },
    };
  }

  // 标准安全级别：使用加固的 Docker
  return {
    technology: 'docker',
    reason: '内部代码使用标准 Docker 隔离',
    config: {
      // Docker 安全配置
      runtime: 'runc',
      security: {
        noPrivileged: true,
        networkMode: 'none',
        readOnlyRootfs: true,
        CapDrop: ['ALL'],
        SecurityOpt: ['no-new-privileges:true'],
      },
      resources: {
        memory: '512m',
        cpuShares: 256,
        pidsLimit: 64,
      },
    },
  };
}
```

---

## 五、错误处理与重试策略

### 5.1 代码执行错误的分类体系

```typescript
// 代码执行错误的分类枚举
enum ExecutionErrorType {
  // 超时错误：代码运行时间超过限制
  TIMEOUT = 'TIMEOUT',

  // 内存超限：代码申请内存超过限制
  OUT_OF_MEMORY = 'OUT_OF_MEMORY',

  // 进程崩溃：代码执行过程中进程异常退出
  PROCESS_CRASHED = 'PROCESS_CRASHED',

  // 语法错误：代码本身有语法问题
  SYNTAX_ERROR = 'SYNTAX_ERROR',

  // 运行时错误：代码逻辑执行时的错误
  RUNTIME_ERROR = 'RUNTIME_ERROR',

  // 资源耗尽：CPU、文件描述符等资源耗尽
  RESOURCE_EXHAUSTED = 'RESOURCE_EXHAUSTED',

  // 安全拦截：安全系统检测到恶意行为
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',

  // 依赖错误：缺少必要的依赖包
  MISSING_DEPENDENCY = 'MISSING_DEPENDENCY',

  // 权限错误：操作超出允许权限范围
  PERMISSION_DENIED = 'PERMISSION_DENIED',

  // 网络错误：需要网络但网络不可用或被禁用
  NETWORK_ERROR = 'NETWORK_ERROR',

  // 未知错误：无法分类的错误
  UNKNOWN = 'UNKNOWN',
}

// 错误分类接口
interface ExecutionError {
  // 错误类型
  type: ExecutionErrorType;

  // 错误消息（用户可读）
  message: string;

  // 原始错误详情（用于调试）
  details: string;

  // 是否可重试
  retryable: boolean;

  // 重试建议
  retryAdvice?: string;

  // 错误时间戳
  timestamp: number;

  // 关联的容器 ID（用于调试）
  containerId?: string;
}

/**
 * 错误分类器：根据原始错误信息判断错误类型
 */
class ErrorClassifier {
  /**
   * 对错误进行分类，判断是否可重试
   */
  classify(error: unknown, context: ExecutionContext): ExecutionError {
    const timestamp = Date.now();
    const errorMessage = error instanceof Error ? error.message : String(error);

    // 1. 超时错误（可重试，但建议优化代码）
    if (errorMessage.includes('timeout') || errorMessage.includes('TIMEOUT')) {
      return {
        type: ExecutionErrorType.TIMEOUT,
        message: `代码执行超时（限制：${context.timeoutMs}ms）`,
        details: errorMessage,
        retryable: true,
        retryAdvice: '建议优化算法复杂度或减少计算量',
        timestamp,
        containerId: context.containerId,
      };
    }

    // 2. 内存超限（不可重试，需修改代码）
    if (
      errorMessage.includes('OOM') ||
      errorMessage.includes('out of memory') ||
      errorMessage.includes('Memory limit')
    ) {
      return {
        type: ExecutionErrorType.OUT_OF_MEMORY,
        message: '代码使用的内存超过限制',
        details: errorMessage,
        retryable: false,
        retryAdvice: '需要优化内存使用：减少数据结构大小、使用流式处理、释放不需要的对象',
        timestamp,
        containerId: context.containerId,
      };
    }

    // 3. 语法错误（不可重试，代码本身有问题）
    if (
      errorMessage.includes('SyntaxError') ||
      errorMessage.includes('syntax error') ||
      errorMessage.includes('ParseError')
    ) {
      return {
        type: ExecutionErrorType.SYNTAX_ERROR,
        message: '代码存在语法错误',
        details: errorMessage,
        retryable: false,
        retryAdvice: '请检查代码语法是否正确',
        timestamp,
        containerId: context.containerId,
      };
    }

    // 4. 运行时错误（部分可重试）
    if (
      errorMessage.includes('RuntimeError') ||
      errorMessage.includes('ReferenceError') ||
      errorMessage.includes('TypeError') ||
      errorMessage.includes('undefined is not')
    ) {
      return {
        type: ExecutionErrorType.RUNTIME_ERROR,
        message: '代码运行时发生错误',
        details: errorMessage,
        retryable: true,  // 某些运行时错误可能是暂时的（如资源竞争）
        retryAdvice: '检查代码逻辑是否正确，可能存在空指针或类型错误',
        timestamp,
        containerId: context.containerId,
      };
    }

    // 5. 资源耗尽（不可重试，需修改代码）
    if (
      errorMessage.includes('EMFILE') ||        // 文件描述符耗尽
      errorMessage.includes('EADDRINUSE') ||     // 端口耗尽
      errorMessage.includes('max user processes') // PID 耗尽
    ) {
      return {
        type: ExecutionErrorType.RESOURCE_EXHAUSTED,
        message: '系统资源耗尽',
        details: errorMessage,
        retryable: false,
        retryAdvice: '代码可能存在资源泄漏或无限循环创建进程/文件',
        timestamp,
        containerId: context.containerId,
      };
    }

    // 6. 安全拦截（绝对不可重试）
    if (
      errorMessage.includes('security') ||
      errorMessage.includes('denied') ||
      errorMessage.includes('permission') ||
      errorMessage.includes('blocked')
    ) {
      return {
        type: ExecutionErrorType.SECURITY_VIOLATION,
        message: '代码被安全系统拦截',
        details: errorMessage,
        retryable: false,
        retryAdvice: '代码可能包含不安全操作，请检查代码内容',
        timestamp,
        containerId: context.containerId,
      };
    }

    // 7. 依赖缺失（可重试，可能临时网络问题）
    if (
      errorMessage.includes('Module not found') ||
      errorMessage.includes('import error') ||
      errorMessage.includes('ENOENT')
    ) {
      return {
        type: ExecutionErrorType.MISSING_DEPENDENCY,
        message: '缺少必要的依赖',
        details: errorMessage,
        retryable: true,
        retryAdvice: '检查依赖是否正确配置，如果是网络问题可以重试',
        timestamp,
        containerId: context.containerId,
      };
    }

    // 8. 默认：未知错误
    return {
      type: ExecutionErrorType.UNKNOWN,
      message: '发生了未知错误',
      details: errorMessage,
      retryable: false,
      retryAdvice: '无法确定错误原因，请查看详细信息',
      timestamp,
      containerId: context.containerId,
    };
  }
}

// 执行上下文（包含环境信息）
interface ExecutionContext {
  timeoutMs: number;
  containerId?: string;
  language: string;
  memoryLimit?: number;
}
```

---

## 六、重试策略：Tool 内重试 vs Agent 多次调用

### 6.1 两种重试策略的对比

在 AI Agent 架构中，重试策略有两种实现方式，各有优劣：

| 维度 | Tool 内重试 | Agent 多次调用重试 |
|------|------------|------------------|
| **重试粒度** | 工具内部自动处理 | Agent 感知失败后主动决策 |
| **适用错误类型** | 暂时性错误（网络、资源竞争） | 所有可恢复错误 |
| **灵活性** | 低（固定重试逻辑） | 高（可动态决策） |
| **Agent 控制力** | 无（Tool 自主决策） | 完全控制 |
| **开销** | 低（内部重试，无额外 LLM 调用） | 高（每次重试都是一次 LLM 调用） |
| **可观测性** | 内部黑盒 | 显式决策，可追踪 |
| **错误利用** | 无法利用错误信息优化 | 可分析错误后提供更优指令 |

### 6.2 Tool 内重试策略实现

```typescript
// 带重试机制的代码执行工具
class RetryableCodeExecutor {
  private executor: DockerSandbox;
  private maxRetries: number;        // 最大重试次数
  private baseDelayMs: number;      // 基础延迟时间
  private maxDelayMs: number;        // 最大延迟时间
  private jitter: boolean;           // 是否添加随机抖动

  constructor(options: {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    jitter?: boolean;
  } = {}) {
    this.executor = new DockerSandbox();
    this.maxRetries = options.maxRetries ?? 3;
    this.baseDelayMs = options.baseDelayMs ?? 1000;   // 默认 1 秒
    this.maxDelayMs = options.maxDelayMs ?? 10000;     // 默认 10 秒
    this.jitter = options.jitter ?? true;
  }

  /**
   * 带指数退避的重试执行
   * 适用于暂时性错误（如网络抖动、资源竞争）
   */
  async executeWithRetry(
    code: string,
    language: 'python' | 'node' | 'bash',
    onRetry?: (attempt: number, error: ExecutionError) => void
  ): Promise<ExecutionResult> {
    let lastError: ExecutionError | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      // 执行代码
      const rawResult = await this.executor.execute(code, language);

      if (rawResult.success) {
        return rawResult;
      }

      // 分类错误
      const classifier = new ErrorClassifier();
      const error = classifier.classify(rawResult.error, {
        timeoutMs: 30000,
        language,
      });

      // 如果错误不可重试，直接返回
      if (!error.retryable) {
        return rawResult;
      }

      // 如果已达到最大重试次数，返回最后一次结果
      if (attempt === this.maxRetries) {
        return rawResult;
      }

      // 记录重试信息
      lastError = error;
      if (onRetry) {
        onRetry(attempt + 1, error);
      }

      // 计算延迟时间（指数退避 + 抖动）
      const delay = this.calculateBackoffDelay(attempt);

      // 等待后重试
      await this.sleep(delay);
    }

    // 返回最后一次错误
    return {
      success: false,
      output: '',
      error: lastError?.message ?? '未知错误',
      exitCode: -1,
      executionTime: -1,
      errorType: lastError?.type ?? ExecutionErrorType.UNKNOWN,
      retryAttempted: true,
      totalAttempts: this.maxRetries + 1,
    };
  }

  /**
   * 计算指数退避延迟时间
   * 公式：min(baseDelay * 2^attempt + jitter, maxDelay)
   */
  private calculateBackoffDelay(attempt: number): number {
    // 基础延迟 × 2^attempt（指数增长）
    const exponentialDelay = this.baseDelayMs * Math.pow(2, attempt);

    // 添加随机抖动（防止多实例同时重试造成惊群效应）
    const jitterAmount = this.jitter
      ? Math.random() * exponentialDelay * 0.1  // ±10% 抖动
      : 0;

    // 最终延迟 = 指数延迟 + 抖动，上限为 maxDelayMs
    return Math.min(exponentialDelay + jitterAmount, this.maxDelayMs);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 指数退避可视化
// attempt=0: delay = 1000 * 2^0 + jitter ≈ 1000ms
// attempt=1: delay = 1000 * 2^1 + jitter ≈ 2000ms
// attempt=2: delay = 1000 * 2^2 + jitter ≈ 4000ms
// attempt=3: delay = 1000 * 2^3 + jitter ≈ 8000ms
// attempt=4: delay = min(16000, 10000) = 10000ms (达到上限)
```

### 6.3 Agent 多次调用重试策略

```typescript
// Agent 驱动的重试策略（更高灵活性）
class AgentDrivenRetryExecutor {
  private llm: LLMClient;
  private sandbox: DockerSandbox;
  private maxAgentRetries: number;

  constructor(llm: LLMClient, maxAgentRetries: number = 3) {
    this.llm = llm;
    this.sandbox = new DockerSandbox();
    this.maxAgentRetries = maxAgentRetries;
  }

  /**
   * Agent 驱动的代码执行循环
   * Agent 可以分析错误并生成修复代码
   */
  async executeWithAgentRetry(
    initialCode: string,
    language: 'python' | 'node' | 'bash',
    maxExecutionTime: number = 60000
  ): Promise<AgentExecutionResult> {
    let currentCode = initialCode;
    let attempts: AttemptRecord[] = [];
    const startTime = Date.now();

    for (let attempt = 0; attempt <= this.maxAgentRetries; attempt++) {
      const attemptStartTime = Date.now();

      // 执行当前代码
      const executionResult = await this.sandbox.execute(currentCode, language);

      const attemptRecord: AttemptRecord = {
        attemptNumber: attempt + 1,
        code: currentCode,
        result: executionResult,
        duration: Date.now() - attemptStartTime,
        timestamp: new Date(),
      };
      attempts.push(attemptRecord);

      // 如果成功，返回结果
      if (executionResult.success) {
        return {
          success: true,
          finalCode: currentCode,
          attempts,
          totalDuration: Date.now() - startTime,
          output: executionResult.output,
        };
      }

      // 如果总执行时间超限，停止重试
      if (Date.now() - startTime > maxExecutionTime) {
        return {
          success: false,
          finalCode: currentCode,
          attempts,
          totalDuration: Date.now() - startTime,
          error: '总执行时间超限',
          errorType: 'TIMEOUT',
        };
      }

      // 如果还有重试机会，让 Agent 分析错误并生成修复代码
      if (attempt < this.maxAgentRetries) {
        const analysis = await this.analyzeErrorAndFix(
          currentCode,
          executionResult.error,
          language,
          attempt + 1
        );

        if (!analysis.shouldRetry) {
          // Agent 判断不可修复
          return {
            success: false,
            finalCode: currentCode,
            attempts,
            totalDuration: Date.now() - startTime,
            error: executionResult.error,
            agentAnalysis: analysis,
            errorType: 'UNRECOVERABLE',
          };
        }

        // Agent 生成了修复代码
        currentCode = analysis.fixedCode;
      }
    }

    // 达到最大重试次数
    return {
      success: false,
      finalCode: currentCode,
      attempts,
      totalDuration: Date.now() - startTime,
      error: '达到最大重试次数',
      errorType: 'MAX_RETRIES_EXCEEDED',
    };
  }

  /**
   * 让 Agent 分析错误并尝试修复代码
   */
  private async analyzeErrorAndFix(
    failedCode: string,
    errorMessage: string,
    language: string,
    attemptNumber: number
  ): Promise<ErrorAnalysis> {
    // 构建提示词，让 Agent 分析错误
    const prompt = `
你是一个专业的代码调试专家。用户提交的 ${language} 代码执行失败：

错误信息：
${errorMessage}

失败的代码：
\`\`\`${language}
${failedCode}
\`\`\`

这是第 ${attemptNumber} 次尝试（最多 ${this.maxAgentRetries} 次）。

请分析：
1. 错误的原因是什么？
2. 这个错误是否可以通过修改代码来修复？
3. 如果可以，请提供修复后的代码（只返回代码，不要解释）。
4. 如果不能修复，请说明原因。

请按以下 JSON 格式回答：
{
  "reason": "错误原因分析",
  "shouldRetry": true/false,
  "fixedCode": "修复后的代码（仅当 shouldRetry 为 true 时）",
  "fixExplanation": "修复说明"
}
`;

    const response = await this.llm.complete(prompt);
    const analysis = JSON.parse(response.content);

    return {
      reason: analysis.reason,
      shouldRetry: analysis.shouldRetry,
      fixedCode: analysis.fixedCode ?? failedCode,
      fixExplanation: analysis.fixExplanation ?? '',
    };
  }
}

// 辅助类型定义
interface ExecutionResult {
  success: boolean;
  output: string;
  error: string;
  exitCode: number;
  executionTime: number;
  errorType?: ExecutionErrorType;
  retryAttempted?: boolean;
  totalAttempts?: number;
}

interface AttemptRecord {
  attemptNumber: number;
  code: string;
  result: ExecutionResult;
  duration: number;
  timestamp: Date;
}

interface AgentExecutionResult {
  success: boolean;
  finalCode: string;
  attempts: AttemptRecord[];
  totalDuration: number;
  output?: string;
  error?: string;
  errorType?: string;
  agentAnalysis?: ErrorAnalysis;
}

interface ErrorAnalysis {
  reason: string;
  shouldRetry: boolean;
  fixedCode: string;
  fixExplanation: string;
}
```

### 6.4 两种策略的融合：智能重试决策树

```typescript
/**
 * 智能重试决策器：根据错误类型决定重试策略
 *
 * 决策逻辑：
 * 1. 暂时性错误（如网络、资源竞争）→ Tool 内自动重试
 * 2. 逻辑错误（如死循环、算法问题）→ Agent 分析并修复
 * 3. 安全错误 → 立即终止，不重试
 * 4. 未知错误 → Agent 判断是否可重试
 */
class SmartRetryCoordinator {
  private toolRetryExecutor: RetryableCodeExecutor;
  private agentRetryExecutor: AgentDrivenRetryExecutor;

  /**
   * 智能执行：根据错误类型选择最优重试策略
   */
  async smartExecute(
    code: string,
    language: 'python' | 'node' | 'bash'
  ): Promise<ExecutionResult> {
    // 阶段1：使用 Tool 内重试处理暂时性错误
    // 暂时性错误通常会在短时间内自动恢复
    const toolResult = await this.toolRetryExecutor.executeWithRetry(
      code,
      language,
      (attempt, error) => {
        console.log(`Tool 重试 #${attempt}，原因：${error.message}`);
      }
    );

    // 如果 Tool 重试成功，直接返回
    if (toolResult.success) {
      return toolResult;
    }

    // 阶段2：Tool 重试失败，分类错误
    const classifier = new ErrorClassifier();
    const error = classifier.classify(toolResult.error, {
      timeoutMs: 30000,
      language,
    });

    // 决策分支
    switch (error.type) {
      // 安全错误：立即终止，绝不重试
      case ExecutionErrorType.SECURITY_VIOLATION:
        return {
          ...toolResult,
          error: `安全拦截（不重试）：${error.message}`,
        };

      // 语法错误：无需重试，需修改代码
      case ExecutionErrorType.SYNTAX_ERROR:
        return {
          ...toolResult,
          error: `语法错误（不重试）：${error.message}`,
        };

      // 资源耗尽：优化代码后可重试
      case ExecutionErrorType.RESOURCE_EXHAUSTED:
        return {
          ...toolResult,
          error: `资源耗尽（需优化代码）：${error.message}`,
        };

      // 逻辑/运行时错误：让 Agent 尝试修复
      case ExecutionErrorType.RUNTIME_ERROR:
      case ExecutionErrorType.TIMEOUT:
      case ExecutionErrorType.MISSING_DEPENDENCY:
        // 阶段3：Agent 驱动的修复尝试
        const agentResult = await this.agentRetryExecutor.executeWithAgentRetry(
          code,
          language
        );

        if (agentResult.success) {
          return {
            success: true,
            output: agentResult.output ?? '',
            error: '',
            exitCode: 0,
            executionTime: agentResult.totalDuration,
            agentFixed: true,
            attempts: agentResult.attempts.length,
          };
        }

        return {
          success: false,
          output: '',
          error: agentResult.error ?? 'Agent 修复失败',
          exitCode: -1,
          executionTime: agentResult.totalDuration,
          errorType: error.type,
        };

      // 未知错误：交给 Agent 判断
      default:
        const agentResult = await this.agentRetryExecutor.executeWithAgentRetry(
          code,
          language,
          1  // 未知错误只给一次 Agent 修复机会
        );

        return {
          success: agentResult.success,
          output: agentResult.output ?? '',
          error: agentResult.error ?? '',
          exitCode: agentResult.success ? 0 : -1,
          executionTime: agentResult.totalDuration,
          agentFixed: agentResult.success,
        };
    }
  }
}
```

---

## 七、结果截断与流式处理

### 7.1 大输出截断策略

代码执行可能产生大量输出，需要实施截断策略防止资源耗尽和信息过载：

```typescript
// 输出截断配置接口
interface TruncationConfig {
  // 最大输出字符数
  maxOutputChars: number;     // 默认：100_000（10万字符）
  // 最大错误输出字符数
  maxErrorChars: number;      // 默认：10_000（1万字符）
  // 最大行数
  maxOutputLines: number;     // 默认：10_000行
  // 是否显示截断提示
  showTruncationNotice: boolean;
  // 截断提示模板
  truncationNoticeTemplate: string;
}

// 截断结果接口
interface TruncatedOutput {
  // 原始输出
  originalOutput: string;
  // 截断后输出
  truncatedOutput: string;
  // 是否被截断
  wasTruncated: boolean;
  // 截断统计
  stats: {
    originalLength: number;
    truncatedLength: number;
    originalLines: number;
    truncatedLines: number;
    charactersRemoved: number;
  };
}

/**
 * 输出截断器：防止大输出耗尽资源
 */
class OutputTruncator {
  private config: TruncationConfig;

  constructor(config: Partial<TruncationConfig> = {}) {
    this.config = {
      maxOutputChars: config.maxOutputChars ?? 100_000,
      maxErrorChars: config.maxErrorChars ?? 10_000,
      maxOutputLines: config.maxOutputLines ?? 10_000,
      showTruncationNotice: config.showTruncationNotice ?? true,
      truncationNoticeTemplate: config.truncationNoticeTemplate ??
        '\n[输出已截断：原始 {originalLines} 行，保留最后 {truncatedLines} 行，共移除 {charactersRemoved} 字符]',
    };
  }

  /**
   * 截断正常输出
   */
  truncateOutput(output: string): TruncatedOutput {
    const originalLength = output.length;
    const originalLines = output.split('\n').length;

    // 检查是否需要截断
    const needsCharTruncation = originalLength > this.config.maxOutputChars;
    const needsLineTruncation = originalLines > this.config.maxOutputLines;

    if (!needsCharTruncation && !needsLineTruncation) {
      return {
        originalOutput: output,
        truncatedOutput: output,
        wasTruncated: false,
        stats: {
          originalLength,
          truncatedLength: originalLength,
          originalLines,
          truncatedLines: originalLines,
          charactersRemoved: 0,
        },
      };
    }

    // 执行截断
    let truncatedOutput = output;
    let truncatedLines = originalLines;

    // 1. 先按行数截断（保留最后 N 行）
    if (needsLineTruncation) {
      const lines = output.split('\n');
      const keptLines = lines.slice(-this.config.maxOutputLines);
      truncatedOutput = keptLines.join('\n');
      truncatedLines = keptLines.length;
    }

    // 2. 再按字符数截断（从末尾保留）
    if (truncatedOutput.length > this.config.maxOutputChars) {
      truncatedOutput = truncatedOutput.slice(-this.config.maxOutputChars);
    }

    // 3. 添加截断提示
    if (this.config.showTruncationNotice) {
      const notice = this.config.truncationNoticeTemplate
        .replace('{originalLines}', String(originalLines))
        .replace('{truncatedLines}', String(truncatedLines))
        .replace('{charactersRemoved}', String(originalLength - truncatedOutput.length));

      truncatedOutput += notice;
    }

    return {
      originalOutput: output,
      truncatedOutput,
      wasTruncated: true,
      stats: {
        originalLength,
        truncatedLength: truncatedOutput.length,
        originalLines,
        truncatedLines,
        charactersRemoved: originalLength - truncatedOutput.length,
      },
    };
  }

  /**
   * 截断错误输出（更严格的限制）
   */
  truncateError(error: string): TruncatedOutput {
    const originalLength = error.length;
    const originalLines = error.split('\n').length;

    // 错误输出使用更严格的限制
    if (originalLength <= this.config.maxErrorChars) {
      return {
        originalOutput: error,
        truncatedOutput: error,
        wasTruncated: false,
        stats: {
          originalLength,
          truncatedLength: originalLength,
          originalLines,
          truncatedLines: originalLines,
          charactersRemoved: 0,
        },
      };
    }

    // 从开头截断错误（通常堆栈信息在开头）
    const truncatedOutput = error.slice(0, this.config.maxErrorChars);

    return {
      originalOutput: error,
      truncatedOutput: truncatedOutput + '\n[错误输出已截断]',
      wasTruncated: true,
      stats: {
        originalLength,
        truncatedLength: truncatedOutput.length,
        originalLines,
        truncatedLines: Math.min(originalLines, this.config.maxErrorChars / 50),
        charactersRemoved: originalLength - truncatedOutput.length,
      },
    };
  }
}
```

### 7.2 流式输出处理

对于长时间运行的代码，流式输出可以提供更好的用户体验：

```typescript
// 流式输出处理器
class StreamingOutputHandler {
  private encoder: TextEncoder;
  private outputBuffer: string[];
  private maxBufferSize: number;

  constructor(maxBufferSize: number = 1000) {
    this.encoder = new TextEncoder();
    this.outputBuffer = [];
    this.maxBufferSize = maxBufferSize;
  }

  /**
   * 处理流式输出块
   */
  processChunk(chunk: string): string {
    // 添加到缓冲区
    this.outputBuffer.push(chunk);

    // 如果缓冲区过大，移除最早的块
    while (this.outputBuffer.length > this.maxBufferSize) {
      this.outputBuffer.shift();
    }

    return chunk;
  }

  /**
   * 获取当前缓冲的完整输出
   */
  getBufferedOutput(): string {
    return this.outputBuffer.join('');
  }

  /**
   * 将缓冲区转换为流式响应
   * 适用于 Server-Sent Events (SSE) 或 WebSocket
   */
  createStream(): ReadableStream<Uint8Array> {
    const buffer = [...this.outputBuffer];

    return new ReadableStream({
      pull(controller) {
        if (buffer.length === 0) {
          controller.close();
          return;
        }

        const chunk = buffer.shift()!;
        controller.enqueue(new TextEncoder().encode(chunk));
      },
    });
  }

  /**
   * 创建 SSE 格式的流
   */
  createSSEStream(): ReadableStream<Uint8Array> {
    const buffer = [...this.outputBuffer];
    let bufferIndex = 0;

    return new ReadableStream({
      pull(controller) {
        if (bufferIndex >= buffer.length) {
          // 发送心跳，保持连接
          controller.enqueue(new TextEncoder().encode(': heartbeat\n\n'));
          return;
        }

        const chunk = buffer[bufferIndex++];
        const sseData = `data: ${JSON.stringify({ output: chunk, timestamp: Date.now() })}\n\n`;
        controller.enqueue(new TextEncoder().encode(sseData));
      },
    });
  }
}

// 使用示例：带流式输出的代码执行
async function executeWithStreaming(
  code: string,
  language: string,
  onChunk: (chunk: string) => void
): Promise<ExecutionResult> {
  const handler = new StreamingOutputHandler();

  // 创建流式响应
  const stream = handler.createSSEStream();

  // 在后台执行代码
  const executor = new DockerSandbox();

  // 订阅输出流
  const reader = stream.getReader();

  // 并行执行和流式处理
  const executionPromise = executor.execute(code, language);

  // 处理流式输出
  (async () => {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const data = new TextDecoder().decode(value);
      // 解析 SSE 数据
      if (data.startsWith('data: ')) {
        const payload = JSON.parse(data.slice(6));
        onChunk(payload.output);
      }
    }
  })();

  return executionPromise;
}
```

---

## 八、商业产品案例分析

### 8.1 E2B：企业级 AI Agent 云沙箱

E2B 是一个专注于 AI Agent 代码执行的云沙箱平台，根据其官网（e2b.dev）信息：

> **E2B 是企业级 AI Agent 云平台**，提供安全的云沙箱环境，为企业级 Agent 提供真实世界工具。

**核心特性：**

| 特性 | 说明 |
|------|------|
| **AI Sandboxes** | 为开源和安全的 AI Agent 提供真实世界工具的企业级环境 |
| **深度研究 Agent** | 支持复杂研究任务的长时间运行沙箱 |
| **计算机使用 Agent** | 支持 AI Agent 操作虚拟计算机 |
| **自动化 Agent** | 支持业务流程自动化 |
| **后台 Agent** | 支持长时间后台任务 |
| **强化学习 Agent** | 支持 RL 训练环境 |

**客户案例：**

- **Perplexity**：为 Pro 用户实现高级数据分析功能（1周内完成）
- **Hugging Face**：使用 E2B 复现 DeepSeek-R1
- **Manus**：使用 E2B 为 Agent 提供虚拟计算机能力
- **Groq**：通过 E2B 构建复合 AI 系统
- **Lindy**：使用 E2B 驱动 AI 工作流

### 8.2 Replit Agent 代码执行架构

根据 Replit 博客（2024年2月），其代码执行 API 设计原则：

> **核心挑战**：当前一代的 LLM 仍然有局限性：它们无法动态响应训练截止日期后的最新知识。为了克服这些限制，需要构建围绕 LLM 的系统来增强其能力。

**Replit 的解决方案：**

1. **代码执行 API**：提供安全的代码执行环境
2. **持久化工作空间**：维护代码状态
3. **多语言支持**：Python、JavaScript、Go、Rust 等
4. **实时反馈**：流式输出和错误信息

### 8.3 Claude Code 本地执行模式

Claude Code 通过 CLI 在本地机器上运行，具有以下安全特点：

- **本地执行**：代码在用户本地环境执行，无需上传到云端
- **权限控制**：需要用户明确授权才能执行操作
- **文件系统访问**：默认在项目目录内操作
- **`--dangerously-skip-permissions` 选项**：跳过权限确认（危险，仅受信任环境使用）

### 8.4 GitHub Copilot 代码执行

GitHub Copilot 主要采用以下代码执行策略：

| 模式 | 说明 | 安全级别 |
|------|------|----------|
| **代码补全** | 直接在 IDE 中插入代码，不执行 | 最安全 |
| **Copilot Chat** | 回答问题，偶尔执行命令 | 高 |
| **Copilot Workspace** | 完整开发环境，支持代码执行 | 中 |
| **Copilot Agents** | AI Agent 自主执行复杂任务 | 需要沙箱 |

---

## 九、沙箱逃逸防护深度分析

### 9.1 常见沙箱逃逸技术

根据 GitHub 安全公告和 CVVE 漏洞数据库，以下是已知的沙箱逃逸技术：

| 逃逸技术 | 描述 | 防护措施 |
|----------|------|----------|
| **特权升级** | 通过 SUID/SGID 程序提升权限 | no-new-privileges、CapDrop ALL |
| **命名空间逃逸** | 利用 /proc 或 mount 命名空间漏洞 | 用户命名空间隔离 |
| **Syscall 逃逸** | 利用未过滤的系统调用 | seccomp 白名单 |
| **资源共享攻击** | 通过共享内存或文件描述符攻击 | disableFDSharing |
| **内核漏洞利用** | 利用容器运行时的内核漏洞 | 定期内核更新、Kata Containers |
| **符号链接攻击** | 通过符号链接访问敏感文件 | 只读文件系统 |
| **符号链接攻击** | 通过符号链接访问敏感文件 | 只读根文件系统 |

### 9.2 VM2 沙箱逃逸案例分析

根据 GitHub 安全公告（GHSL-SEC-2024:GHzSA-99p7-6v5w-7xg8），VM2 Node.js 沙箱存在逃逸漏洞：

```typescript
// 漏洞利用示例（来自安全公告）
const { VM } = require('vm2');

const code = `
  const error = new Error();
  error.name = Symbol();
  const f = async () => error.stack;
  const promise = f();
  promise.catch(e => {
    const Error = e.constructor;
    const Function = Error.constructor;
    const f = new Function(
      "process.mainModule.require('child_process').execSync('echo HELLO WORLD!', { stdio: 'inherit' })"
    );
    f();
  });
`;

new VM().run(code);
```

**漏洞原理**：`Promise.prototype.catch` 回调的清理不完整，允许攻击者通过 `Error` 构造函数逃逸沙箱。

**防护措施**：

1. 使用更新的沙箱库或迁移到 Docker/Kata Containers
2. 定期更新依赖包
3. 使用容器隔离替代进程级沙箱

### 9.3 防御深度（Defense in Depth）

```typescript
// 多层防御策略
class DefenseInDepthSandbox {
  private layers: SandboxLayer[];

  constructor() {
    this.layers = [
      // 第一层：输入验证
      new InputValidationLayer(),

      // 第二层：语言级沙箱
      new LanguageSandboxLayer(),

      // 第三层：容器隔离
      new ContainerIsolationLayer(),

      // 第四层：系统级隔离（可选）
      new VMIsolationLayer(),
    ];
  }

  /**
   * 执行代码：每层都进行验证和限制
   */
  async execute(code: string, language: string): Promise<ExecutionResult> {
    let result: ExecutionResult;

    for (const layer of this.layers) {
      // 每层都验证输入
      const validation = layer.validate(code);
      if (!validation.valid) {
        return {
          success: false,
          error: `第 ${layer.name} 层验证失败：${validation.reason}`,
          exitCode: -1,
          executionTime: 0,
        };
      }

      // 在当前层执行
      try {
        result = await layer.execute(code, language);

        // 如果成功且该层已足够安全，停止
        if (result.success && layer.isSecureEnough) {
          break;
        }
      } catch (error) {
        // 如果任何一层失败，停止
        return {
          success: false,
          error: `第 ${layer.name} 层执行失败：${error}`,
          exitCode: -1,
          executionTime: 0,
        };
      }
    }

    return result ?? {
      success: false,
      error: '所有层执行失败',
      exitCode: -1,
      executionTime: 0,
    };
  }
}

// 沙箱层接口
interface SandboxLayer {
  name: string;
  isSecureEnough: boolean;

  validate(code: string): { valid: boolean; reason?: string };
  execute(code: string, language: string): Promise<ExecutionResult>;
}

// 输入验证层
class InputValidationLayer implements SandboxLayer {
  name = '输入验证';
  isSecureEnough = false;

  validate(code: string): { valid: boolean; reason?: string } {
    // 检查危险模式
    const dangerousPatterns = [
      /require\s*\(\s*['"]child_process['"]\s*\)/i,
      /import\s+.*from\s+['"]child_process['"]/i,
      /__import__\s*\(\s*['"]subprocess['"]\s*\)/i,
      /exec\s*\(/i,
      /eval\s*\(/i,
      /compile\s*\(/i,
      /open\s*\(\s*['"]\/etc\/passwd/i,
      // 添加更多危险模式...
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        return {
          valid: false,
          reason: `检测到危险模式：${pattern.toString()}`,
        };
      }
    }

    return { valid: true };
  }

  async execute(code: string, language: string): Promise<ExecutionResult> {
    // 输入验证层不执行代码，只是验证
    throw new Error('输入验证层不执行代码');
  }
}
```

---

## 十、总结

代码执行安全是 AI Agent 架构中最关键的基础设施层。本文档系统介绍了四种隔离技术和两种重试策略：

**隔离技术选型指南：**

| 场景 | 推荐方案 | 理由 |
|------|----------|------|
| 高并发、多租户、需快速冷启动 | gVisor | 125ms 启动、用户态内核拦截 |
| 最高安全要求、政府金融场景 | Kata Containers | 硬件虚拟化、接近物理隔离 |
| 通用安全容器 | 加固 Docker | 成熟方案、配置灵活 |
| 第三方插件、极致隔离 | WebAssembly | 指令级隔离、亚毫秒启动 |
| 绝对不可信代码 | WASM + gVisor 双层隔离 | 最强安全保障 |
| 浏览器端 AI Agent | Pyodide (WASM) | 客户端执行，无服务端风险 |

**重试策略选型指南：**

| 场景 | 推荐策略 | 理由 |
|------|----------|------|
| 暂时性错误（网络、资源竞争） | Tool 内重试 | 低开销、快速恢复 |
| 逻辑/算法错误（死循环、复杂度问题） | Agent 多次调用 | 利用 LLM 智能修复 |
| 混合场景 | 智能重试协调器 | 根据错误类型动态选择 |

**商业产品选型：**

| 产品 | 适用场景 | 特点 |
|------|----------|------|
| E2B | 企业级 AI Agent | 云沙箱、多种 Agent 类型支持 |
| Replit | 快速原型开发 | 代码执行 API、流式输出 |
| Claude Code | 本地开发 | 本地执行、权限控制 |
| GitHub Copilot | IDE 集成 | 代码补全、聊天辅助 |

核心原则：**永远假设代码是恶意的，永远限制资源使用，永远监控执行行为，永远为失败做准备。**

---

## 参考来源

1. NVIDIA Technical Blog: "Sandboxing Agentic AI Workflows with WebAssembly" (2024-12-16)
2. Docker Official Docs: "Docker Sandboxes" (2026-03)
3. E2B Official Website: https://www.e2b.dev/
4. Replit Blog: "AI Agent Code Execution API" (2024-02-26)
5. GitHub Security: VM2 Sandbox Escape Advisory (GHSL-SEC-2024)
6. Google Open Source: gVisor Project Documentation
7. Kata Containers Official Documentation
8. Claude Code Documentation (docs.anthropic.com)
9. GitHub Copilot Documentation (docs.github.com)
