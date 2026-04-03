# libuv线程池与异步IO深度解析

## 概述

libuv是Node.js底层使用的跨平台异步IO库，它封装了不同操作系统的异步机制，提供了一个统一的接口供JavaScript调用。理解libuv线程池对于深入理解Node.js的异步编程模型、性能调优以及解决实际问题至关重要。

本章将深入剖析libuv线程池的工作原理、任务类型、配置方法，并与其他语言的线程池实现进行对比，最后通过实战代码展示如何正确使用线程池。

## 一、libuv线程池原理

### 1.1 线程池架构

libuv的线程池是**提前创建好的工作线程集合**，这些线程等待任务队列中的任务到来。线程池的主要目的是**将可能阻塞主线程的操作卸载到后台线程执行**，避免阻塞事件循环。

```
┌─────────────────────────────────────────────────────────┐
│                    libuv 线程池架构                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   主线程（事件循环）                                       │
│   ┌─────────────┐                                       │
│   │  事件循环    │                                       │
│   │  (Event     │                                       │
│   │   Loop)     │                                       │
│   └──────┬──────┘                                       │
│          │ 提交任务                                      │
│          ▼                                               │
│   ┌─────────────────────────────────┐                   │
│   │         任务队列                 │                   │
│   │  ┌─────┬─────┬─────┬─────┐    │                   │
│   │  │任务1│任务2│任务3│ ... │    │                   │
│   │  └─────┴─────┴─────┴─────┘    │                   │
│   └──────────────┬──────────────────┘                   │
│                  │ 分发任务                               │
│    ┌─────────────┼─────────────┐                       │
│    ▼             ▼             ▼                        │
│  ┌─────┐     ┌─────┐     ┌─────┐                      │
│  │线程1│     │线程2│     │线程3│  ... 线程N           │
│  │工作 │     │工作 │     │工作 │                      │
│  └─────┘     └─────┘     └─────┘                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 1.2 线程池初始化

libuv线程池在首次使用时懒加载初始化。默认情况下，线程池大小为4（旧版本）或128（Node.js 10+）。线程池大小可以通过环境变量`UV_THREADPOOL_SIZE`配置。

```c
// libuv线程池初始化核心逻辑（伪代码）
static void init_threadpool(void) {
    // 线程池互斥锁初始化
    uv_mutex_init(&mutex);

    // 条件变量初始化，用于线程等待
    uv_cond_init(&cond);

    // 读取线程池大小配置，默认128
    nthreads = get_env_max_threads();

    // 预创建所有线程
    threads = malloc(nthreads * sizeof(uv_thread_t));
    for (int i = 0; i < nthreads; i++) {
        uv_thread_create(&threads[i], worker_thread, NULL);
    }
}

// 获取线程池大小
static unsigned int get_env_max_threads(void) {
    // 优先读取UV_THREADPOOL_SIZE环境变量
    const char* val = getenv("UV_THREADPOOL_SIZE");
    if (val != NULL) {
        unsigned int size = atoi(val);
        // 限制范围：1-1024
        return clamp(size, 1, 1024);
    }
    // 默认值：128（Node.js 10+）
    return 128;
}
```

### 1.3 工作线程执行流程

每个工作线程执行相同的工作流程：不断从任务队列中取出任务并执行。

```c
// 工作线程执行流程（伪代码）
static void worker_thread(void* arg) {
    // 无限循环，直到收到退出信号
    while (1) {
        uv_mutex_lock(&mutex);

        // 等待任务到来
        while (queue_is_empty() && !shutdown_flag) {
            uv_cond_wait(&cond, &mutex);
        }

        // 检查是否应该退出
        if (shutdown_flag) {
            uv_mutex_unlock(&mutex);
            break;
        }

        // 从队列取出任务
        uv_work_t* work = queue_pop();

        uv_mutex_unlock(&mutex);

        // 执行任务（调用JavaScript回调）
        if (work->work_cb) {
            work->work_cb(work);  // 在工作线程执行
        }

        // 通知主线程任务完成
        uv_async_send(&work->async);
    }
}
```

### 1.4 任务提交与回调机制

libuv使用`uv_work_t`结构表示一个工作项，包含工作回调和完成回调。

```typescript
// TypeScript中的libuv工作项结构
interface UVWork {
    // 工作线程中执行的回调
    workCallback: (work: UVWork) => void;
    // 主线程中执行的完成回调
    workCompleteCallback: (err: Error | null, work: UVWork) => void;
}

// 提交任务到线程池的流程
function queue_work(work: UVWork): void {
    // 1. 将任务加入队列
    uv_mutex_lock(&mutex);
    queue_push(work);
    uv_cond_signal(&cond);  // 唤醒一个等待中的线程
    uv_mutex_unlock(&mutex);
}

// 任务完成后的处理
function on_work_complete(work: UVWork): void {
    // 将结果从工作线程传递到主线程
    // 安排主线程的回调在事件循环的下一次迭代中执行
    uv_async_send(&work->async);

    // 主线程的事件循环会调用workCompleteCallback
}
```

## 二、线程池任务类型

### 2.1 支持的任务类型一览

libuv线程池处理多种类型的异步操作，这些操作有一个共同特点：**在某些情况下会阻塞或延迟主线程**。

| 任务类型 | libuv函数 | 说明 |
|----------|-----------|------|
| **文件IO操作** | `uv_fs_*` | 文件读写、打开、关闭、同步等 |
| **DNS查询** | `uv_getaddrinfo` | 域名解析（可选） |
| **fsync** | `uv_fs_fsync` | 文件系统同步 |
| **random** | `uv_random` | 密码学安全的随机数生成 |
| **信号处理** | `uv_signal_start` | 部分平台 |
| **编解码** | zlib操作 | gzip压缩等 |

### 2.2 文件IO操作详解

文件IO是线程池最重要的用途。Node.js的`fs`模块底层调用libuv的文件系统函数。

```typescript
// Node.js fs模块与libuv的映射关系
import * as fs from 'fs';

// 以下操作会使用线程池：
// 1. 文件读取
fs.readFile('test.txt', (err, data) => {
    // libuv的uv_fs_read进入线程池
});

// 2. 文件写入
fs.writeFile('output.txt', 'content', (err) => {
    // libuv的uv_fs_write进入线程池
});

// 3. 文件打开
fs.open('test.txt', 'r', (err, fd) => {
    // libuv的uv_fs_open进入线程池
});

// 4. 目录操作
fs.readdir('/path', (err, files) => {
    // libuv的uv_fs_readdir进入线程池
});

// 5. 文件属性
fs.stat('test.txt', (err, stats) => {
    // libuv的uv_fs_stat进入线程池
});

// 6. 文件描述符同步
fs.fsync(fd, (err) => {
    // libuv的uv_fs_fsync进入线程池
});
```

### 2.3 DNS查询任务

Node.js的DNS模块使用libuv的`uv_getaddrinfo`函数。在某些操作系统上，DNS查询会使用线程池。

```typescript
import * as dns from 'dns';

// DNS查询会使用线程池（在不支持异步DNS的平台）
dns.lookup('example.com', (err, address, family) => {
    console.log('IP地址:', address);
});

// DNS服务查询（使用网络，更常走异步）
dns.resolve4('example.com', (err, addresses) => {
    console.log('IPv4地址列表:', addresses);
});
```

### 2.4 密码学随机数

`crypto.randomBytes`和`uv_random`使用线程池生成密码学安全的随机数。

```typescript
import * as crypto from 'crypto';

// 生成随机字节（使用线程池）
crypto.randomBytes(16, (err, buf) => {
    if (err) throw err;
    console.log('随机字节:', buf.toString('hex'));
});

// 生成随机整数
crypto.randomInt(100, (err, n) => {
    if (err) throw err;
    console.log('随机整数:', n);
});
```

### 2.5 不使用线程池的操作

需要特别注意的是，**网络IO操作（TCP/UDP/HTTP等）不使用线程池**，它们直接使用操作系统的异步IO机制（epoll/kqueue/IOCP）。

```typescript
import * as http from 'http';

// 网络请求不走线程池，使用epoll/kqueue等
const req = http.get('http://example.com', (res) => {
    // 直接由事件循环处理，不用线程池
    console.log('状态码:', res.statusCode);
});

// 即使是阻塞操作，网络IO仍然不走线程池
// 这与文件IO形成鲜明对比
```

## 三、线程池调优

### 3.1 配置线程池大小

线程池大小通过环境变量`UV_THREADPOOL_SIZE`配置，**必须在Node.js启动前设置**。

```bash
# 设置线程池大小为256
export UV_THREADPOOL_SIZE=256

# 启动Node.js应用
node app.js

# 或者一行命令
UV_THREADPOOL_SIZE=256 node app.js

# Windows环境
set UV_THREADPOOL_SIZE=256 && node app.js
```

```typescript
// 在代码中检查当前线程池大小
console.log('当前线程池大小:', process.env.UV_THREADPOOL_SIZE || 128);
```

### 3.2 线程池大小选择指南

线程池大小不是越大越好，需要根据实际场景权衡：

| 场景 | 推荐大小 | 理由 |
|------|----------|------|
| CPU密集型任务多 | 2-4 | 避免过多上下文切换 |
| IO密集型任务多 | CPU核心数 * 2 | 充分利用IO等待时间 |
| 混合负载 | CPU核心数 | 平衡CPU和IO |
| 内存受限 | 32-64 | 减少线程内存开销 |
| 高并发文件IO | 128-256 | 文件IO阻塞时间长 |

```typescript
// 根据场景动态计算线程池大小
function calculateThreadPoolSize(): number {
    const cpuCount = require('os').cpus().length;
    const memoryGB = require('os').totalmem() / (1024 ** 3);

    // 基本公式：CPU核心数
    let size = cpuCount;

    // 如果内存充足，可以增加线程数
    if (memoryGB > 16) {
        size = cpuCount * 2;
    }

    // 限制最大最小值
    return Math.max(4, Math.min(256, size));
}

// 应用启动时设置
process.env.UV_THREADPOOL_SIZE = String(calculateThreadPoolSize());
console.log('线程池大小设置为:', process.env.UV_THREADPOOL_SIZE);
```

### 3.3 线程池饱和问题

当线程池任务过多时，会出现**任务积压**现象，导致后续任务延迟。

```typescript
// 模拟线程池饱和场景
import * as fs from 'fs';

class ThreadPoolMonitor {
    private pendingTasks: number = 0;
    private startTime: number = 0;

    // 开始监控
    start(): void {
        this.startTime = Date.now();
    }

    // 记录任务提交
    submitTask(taskName: string): void {
        this.pendingTasks++;
        const waitTime = Date.now() - this.startTime;
        console.log(`[${waitTime}ms] 提交任务: ${taskName}, 队列长度: ${this.pendingTasks}`);
    }

    // 记录任务完成
    completeTask(taskName: string): void {
        this.pendingTasks--;
        const duration = Date.now() - this.startTime;
        console.log(`[${duration}ms] 完成任务: ${taskName}, 剩余: ${this.pendingTasks}`);
    }

    // 获取当前积压数
    getBacklog(): number {
        return this.pendingTasks;
    }
}

const monitor = new ThreadPoolMonitor();
monitor.start();

// 提交大量文件IO任务
for (let i = 0; i < 200; i++) {
    monitor.submitTask(`文件读取-${i}`);
    fs.readFile(`./test-${i}.txt`, (err, data) => {
        monitor.completeTask(`文件读取-${i}`);
        if (monitor.getBacklog() === 0) {
            console.log('所有任务完成！');
        }
    });
}
```

### 3.4 线程池配置最佳实践

```typescript
// 线程池配置管理器
class ThreadPoolConfig {
    // 默认配置
    private static DEFAULT_SIZE = 128;
    private static MAX_SIZE = 1024;
    private static MIN_SIZE = 1;

    // 计算推荐大小
    static calculateOptimalSize(workloadType: 'cpu' | 'io' | 'mixed'): number {
        const cpuCount = require('os').cpus().length;

        switch (workloadType) {
            case 'cpu':
                // CPU密集型：线程数 = CPU核心数
                return cpuCount;

            case 'io':
                // IO密集型：线程数 = CPU核心数 * 2
                return cpuCount * 2;

            case 'mixed':
            default:
                // 混合负载：使用默认值
                return this.DEFAULT_SIZE;
        }
    }

    // 验证配置值
    static validate(size: number): number {
        if (size < this.MIN_SIZE) {
            console.warn(`线程池大小(${size})小于最小值，使用最小值${this.MIN_SIZE}`);
            return this.MIN_SIZE;
        }
        if (size > this.MAX_SIZE) {
            console.warn(`线程池大小(${size})大于最大值，使用最大值${this.MAX_SIZE}`);
            return this.MAX_SIZE;
        }
        return size;
    }

    // 应用配置
    static apply(size: number): void {
        const validatedSize = this.validate(size);
        process.env.UV_THREADPOOL_SIZE = String(validatedSize);
        console.log(`线程池大小已设置为: ${validatedSize}`);
    }
}

// 使用示例
ThreadPoolConfig.apply(
    ThreadPoolConfig.calculateOptimalSize('io')
);
```

## 四、Worker Threads与线程池对比

### 4.1 Node.js的两种并行方案

Node.js提供了两种处理CPU密集型任务的方式：

| 方案 | 线程池 | Worker Threads |
|------|--------|----------------|
| 线程来源 | libuv内置 | 手动创建 |
| 用途 | 系统IO操作 | 自定义任务 |
| 通信方式 | 回调 | MessageChannel |
| 内存共享 | 不支持 | 共享内存(ArrayBuffer) |
| 适用场景 | 文件IO、DNS等 | CPU密集计算 |

### 4.2 Worker Threads线程池实现

```typescript
// 完整的Worker线程池实现
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';

// 工作线程接口定义
interface WorkerTask<T = any, R = any> {
    id: string;
    data: T;
    callback: (error: Error | null, result: R | null) => void;
}

// 线程池类
class WorkerThreadPool<T = any, R = any> {
    private workers: Worker[] = [];
    private taskQueue: WorkerTask<T, R>[] = [];
    private activeWorkers: Set<Worker> = new Set();
    private readonly size: number;

    constructor(size: number) {
        this.size = size;
        this.initialize();
    }

    // 初始化线程池中的工作线程
    private initialize(): void {
        for (let i = 0; i < this.size; i++) {
            const worker = new Worker(__filename, {
                // 传递给工作线程的数据
                workerData: { threadId: i }
            });

            // 处理工作线程的消息
            worker.on('message', (result: { taskId: string; error: any; result: R }) => {
                this.handleWorkerMessage(worker, result);
            });

            // 处理工作线程的错误
            worker.on('error', (error) => {
                console.error('工作线程错误:', error);
                this.restartWorker(worker);
            });

            // 处理工作线程退出
            worker.on('exit', (code) => {
                if (code !== 0) {
                    console.error(`工作线程异常退出，退出码: ${code}`);
                    this.restartWorker(worker);
                }
            });

            this.workers.push(worker);
        }

        console.log(`Worker线程池初始化完成，共${this.size}个工作线程`);
    }

    // 处理工作线程的消息
    private handleWorkerMessage(worker: Worker, result: { taskId: string; error: any; result: R }): void {
        // 找到对应的任务
        const taskIndex = this.taskQueue.findIndex(t => t.id === result.taskId);
        if (taskIndex !== -1) {
            const task = this.taskQueue.splice(taskIndex, 1)[0];
            task.callback(result.error, result.result);
        }

        // 标记该工作线程为空闲
        this.activeWorkers.delete(worker);

        // 处理队列中的下一个任务
        this.processNextTask(worker);
    }

    // 重启崩溃的工作线程
    private restartWorker(worker: Worker): void {
        const index = this.workers.indexOf(worker);
        if (index !== -1) {
            this.workers.splice(index, 1);
            const newWorker = new Worker(__filename, {
                workerData: { threadId: index }
            });

            newWorker.on('message', (result) => this.handleWorkerMessage(newWorker, result));
            newWorker.on('error', (error) => this.restartWorker(newWorker));
            newWorker.on('exit', (code) => {
                if (code !== 0) this.restartWorker(newWorker);
            });

            this.workers.push(newWorker);
        }
    }

    // 从队列中取出下一个任务
    private processNextTask(worker: Worker): void {
        if (this.taskQueue.length > 0) {
            const task = this.taskQueue.shift()!;
            this.activeWorkers.add(worker);
            worker.postMessage({ taskId: task.id, data: task.data });
        }
    }

    // 提交任务到线程池
    execute(taskId: string, data: T): Promise<R> {
        return new Promise((resolve, reject) => {
            const task: WorkerTask<T, R> = {
                id: taskId,
                data: data,
                callback: (error, result) => {
                    if (error) reject(error);
                    else resolve(result as R);
                }
            };

            // 查找空闲的工作线程
            const idleWorker = this.workers.find(w => !this.activeWorkers.has(w));

            if (idleWorker) {
                this.activeWorkers.add(idleWorker);
                idleWorker.postMessage({ taskId: task.id, data: task.data });
            } else {
                // 所有线程都在忙碌，加入队列等待
                this.taskQueue.push(task);
            }
        });
    }

    // 关闭线程池
    async terminate(): Promise<void> {
        await Promise.all(this.workers.map(w => w.terminate()));
        this.workers = [];
        this.activeWorkers.clear();
        this.taskQueue = [];
        console.log('Worker线程池已关闭');
    }

    // 获取线程池状态
    getStatus(): { total: number; active: number; queued: number } {
        return {
            total: this.size,
            active: this.activeWorkers.size,
            queued: this.taskQueue.length
        };
    }
}

// 工作线程主逻辑
if (!isMainThread) {
    // 处理主线程发来的任务
    parentPort?.on('message', async ({ taskId, data }) => {
        try {
            // 模拟CPU密集型计算
            const result = await performHeavyComputation(data);
            parentPort?.postMessage({ taskId, error: null, result });
        } catch (error) {
            parentPort?.postMessage({ taskId, error, result: null });
        }
    });
}

// 模拟CPU密集型计算（斐波那契数列）
async function performHeavyComputation(n: number): Promise<number> {
    function fibonacci(num: number): number {
        if (num <= 1) return num;
        return fibonacci(num - 1) + fibonacci(num - 2);
    }
    return fibonacci(Math.min(n, 40));
}

// 使用示例
if (isMainThread) {
    const pool = new WorkerThreadPool<number, number>(4);

    // 提交多个计算任务
    const tasks = [35, 36, 37, 38, 39, 40];

    console.log('开始提交任务...');
    const startTime = Date.now();

    Promise.all(tasks.map((n, i) =>
        pool.execute(`task-${i}`, n)
            .then(result => console.log(`task-${i} 结果: ${result}`))
    )).then(() => {
        const duration = Date.now() - startTime;
        console.log(`所有任务完成，耗时: ${duration}ms`);
        console.log('线程池状态:', pool.getStatus());
        pool.terminate();
    });
}
```

## 五、与Java线程池对比

### 5.1 Java线程池参数详解

Java的`ThreadPoolExecutor`是功能最完善的线程池实现，其参数设计值得深入学习。

```java
// Java ThreadPoolExecutor参数
public ThreadPoolExecutor(
    int corePoolSize,      // 核心线程数
    int maximumPoolSize,    // 最大线程数
    long keepAliveTime,    // 空闲线程存活时间
    TimeUnit unit,         // 时间单位
    BlockingQueue<Runnable> workQueue,  // 任务队列
    ThreadFactory threadFactory,         // 线程工厂
    RejectedExecutionHandler handler     // 拒绝策略
)
```

| 参数 | 含义 | 说明 |
|------|------|------|
| corePoolSize | 核心线程数 | 始终保持存活的线程数 |
| maximumPoolSize | 最大线程数 | 线程池能容纳的最大线程数 |
| keepAliveTime | 空闲时间 | 超出核心线程数的线程空闲存活时间 |
| workQueue | 任务队列 | 存放等待执行的任务 |
| handler | 拒绝策略 | 任务队列满时的处理策略 |

### 5.2 线程池执行流程对比

```
Java线程池执行流程：
                    ┌─────────────────┐
                    │  提交新任务      │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  线程数 < 核心数? │
                    └────────┬────────┘
                      是 ↙       ↘ 否
                      │            │
                      ▼            ▼
              ┌───────────┐  ┌───────────────┐
              │ 创建新线程 │  │ 队列有空间?    │
              │ 执行任务   │  └───────┬───────┘
              └───────────┘    是 ↙      ↘ 否
                             │            │
                             ▼            ▼
                      ┌───────────┐ ┌─────────────────┐
                      │ 加入队列  │ │ 线程数 < 最大数? │
                      └───────────┘ └───────┬─────────┘
                                       是 ↙     ↘ 否
                                       │          │
                                       ▼          ▼
                               ┌───────────┐ ┌────────────────┐
                               │ 创建新线程│ │ 执行拒绝策略    │
                               │ 执行任务  │ │ (Abort/Discard │
                               └───────────┘ │  CallerRuns等) │
                                              └────────────────┘

libuv线程池执行流程：
                    ┌─────────────────┐
                    │  提交新任务      │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  有空闲线程?     │
                    └────────┬────────┘
                      是 ↙      ↘ 否
                      │            │
                      ▼            ▼
              ┌───────────┐  ┌───────────┐
              │ 空闲线程  │  │  加入队列  │
              │ 执行任务  │  │ 等待执行   │
              └───────────┘  └───────────┘
```

### 5.3 核心区别对比

| 特性 | libuv线程池 | Java线程池 |
|------|-------------|------------|
| **线程数配置** | 静态，环境变量 | 动态，可运行时调整 |
| **队列类型** | 固定容量 | 可选（无界/有界/优先） |
| **拒绝策略** | 无（队列无限大） | 多种策略可选 |
| **核心线程** | 不回收 | 可配置是否回收 |
| **任务类型** | 主要是IO操作 | 任意任务 |
| **调度策略** | FIFO | 可配置 |
| **监控接口** | 有限 | 丰富 |

### 5.4 Java线程池在Node.js中的实现

```typescript
// 用TypeScript实现类似Java ThreadPoolExecutor的行为
class ThreadPoolExecutor {
    private readonly corePoolSize: number;
    private readonly maximumPoolSize: number;
    private readonly keepAliveTime: number;
    private readonly workQueue: Array<() => void>;
    private readonly maxQueueSize: number;
    private workers: Worker[] = [];
    private activeCount: number = 0;

    // 拒绝策略枚举
    enum RejectedExecutionHandler {
        ABORT = 'abort',           // 抛异常
        DISCARD = 'discard',      // 丢弃任务
        DISCARD_OLDEST = 'discard-oldest',  // 丢弃最老的
        CALLER_RUNS = 'caller-runs'  // 由调用线程执行
    }

    constructor(
        corePoolSize: number,
        maximumPoolSize: number,
        keepAliveTime: number,
        maxQueueSize: number,
        private handler: RejectedExecutionHandler = ThreadPoolExecutor.RejectedExecutionHandler.ABORT
    ) {
        this.corePoolSize = corePoolSize;
        this.maximumPoolSize = maximumPoolSize;
        this.keepAliveTime = keepAliveTime;
        this.maxQueueSize = maxQueueSize;
        this.workQueue = [];

        // 预创建核心线程
        for (let i = 0; i < corePoolSize; i++) {
            this.createWorker();
        }
    }

    // 创建工作线程
    private createWorker(): void {
        const worker = new Worker(`
            const { parentPort, workerData } = require('worker_threads');
            parentPort.on('message', (task) => {
                try {
                    // 执行任务（这里简化处理）
                    const result = task.fn();
                    parentPort.postMessage({ taskId: task.id, result, error: null });
                } catch (error) {
                    parentPort.postMessage({ taskId: task.id, result: null, error });
                }
            });
        `);

        worker.on('message', (msg) => {
            this.activeCount--;
            this.processQueue();
            // 处理任务结果...
        });

        this.workers.push(worker);
    }

    // 执行任务
    execute(task: { id: string; fn: () => any }): void {
        // 线程数 < 核心数：创建新线程
        if (this.workers.length < this.corePoolSize) {
            this.createWorker();
        }

        // 有空闲线程：立即执行
        if (this.activeCount < this.workers.length) {
            this.activeCount++;
            this.workers[this.activeCount - 1].postMessage(task);
            return;
        }

        // 队列有空间：加入队列
        if (this.workQueue.length < this.maxQueueSize) {
            this.workQueue.push(() => {
                this.activeCount++;
                const worker = this.workers[0]; // 选择一个工作线程
                worker.postMessage(task);
            });
            return;
        }

        // 队列满了：执行拒绝策略
        this.handleRejection(task);
    }

    // 处理队列中的任务
    private processQueue(): void {
        if (this.workQueue.length > 0) {
            const task = this.workQueue.shift()!;
            task();
        }
    }

    // 拒绝策略处理
    private handleRejection(task: { id: string; fn: () => any }): void {
        switch (this.handler) {
            case ThreadPoolExecutor.RejectedExecutionHandler.ABORT:
                throw new Error(`任务 ${task.id} 被拒绝执行`);

            case ThreadPoolExecutor.RejectedExecutionHandler.DISCARD:
                console.log(`任务 ${task.id} 被丢弃`);
                break;

            case ThreadPoolExecutor.RejectedExecutionHandler.DISCARD_OLDEST:
                const oldest = this.workQueue.shift();
                console.log(`最旧任务被丢弃，尝试执行新任务`);
                this.workQueue.unshift(() => {
                    this.activeCount++;
                    this.workers[0].postMessage(task);
                });
                break;

            case ThreadPoolExecutor.RejectedExecutionHandler.CALLER_RUNS:
                console.log(`由调用线程执行任务 ${task.id}`);
                task.fn();
                break;
        }
    }
}
```

## 六、实战：线程池配置实践

### 6.1 典型配置场景

```typescript
// 不同场景的线程池配置策略

interface ThreadPoolStrategy {
    name: string;
    uvThreadPoolSize: number;
    workerThreads: number;
    description: string;
}

// 预定义策略
const strategies: ThreadPoolStrategy[] = [
    {
        name: '高并发文件处理',
        uvThreadPoolSize: 256,
        workerThreads: 8,
        description: '大量文件IO操作，如日志处理、文件转换'
    },
    {
        name: 'Web API服务',
        uvThreadPoolSize: 128,
        workerThreads: 4,
        description: '典型REST API，主要处理网络IO'
    },
    {
        name: 'CPU密集计算',
        uvThreadPoolSize: 4,
        workerThreads: 16,
        description: '数据处理、图像处理、科学计算'
    },
    {
        name: '混合负载',
        uvThreadPoolSize: 128,
        workerThreads: 8,
        description: 'API + 数据库 + 文件处理'
    }
];

// 应用策略
function applyStrategy(strategy: ThreadPoolStrategy): void {
    process.env.UV_THREADPOOL_SIZE = String(strategy.uvThreadPoolSize);
    console.log(`应用策略: ${strategy.name}`);
    console.log(`  - libuv线程池: ${strategy.uvThreadPoolSize}`);
    console.log(`  - Worker线程: ${strategy.workerThreads}`);
    console.log(`  - 描述: ${strategy.description}`);
}

// 根据环境选择策略
function autoSelectStrategy(): ThreadPoolStrategy {
    const cpuCount = require('os').cpus().length;
    const memoryGB = require('os').totalmem() / (1024 ** 3);
    const isProduction = process.env.NODE_ENV === 'production';

    // 检测是否为IO密集型
    const isIODominant = memoryGB > 4 && !isProduction;

    if (isIODominant) {
        return strategies[0]; // 高并发文件处理
    } else if (isProduction) {
        return strategies[3]; // 混合负载
    } else {
        return strategies[1]; // Web API服务
    }
}
```

### 6.2 线程池监控

```typescript
// 线程池性能监控
import * as fs from 'fs';
import * as v8 from 'v8';

interface ThreadPoolMetrics {
    timestamp: number;
    uvThreadPoolSize: number;
    activeHandles: number;
    activeRequests: number;
    heapUsed: number;
    heapTotal: number;
    externalMemory: number;
}

class ThreadPoolMonitor {
    private metrics: ThreadPoolMetrics[] = [];
    private intervalId: NodeJS.Timeout | null = null;

    // 开始监控
    start(intervalMs: number = 5000): void {
        this.intervalId = setInterval(() => {
            this.collectMetrics();
        }, intervalMs);
        console.log(`线程池监控已启动，间隔: ${intervalMs}ms`);
    }

    // 停止监控
    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        console.log('线程池监控已停止');
    }

    // 收集指标
    private collectMetrics(): void {
        const heapStats = v8.getHeapStatistics();

        const metrics: ThreadPoolMetrics = {
            timestamp: Date.now(),
            uvThreadPoolSize: parseInt(process.env.UV_THREADPOOL_SIZE || '128'),
            activeHandles: (process as any)._getActiveHandles().length,
            activeRequests: (process as any)._getActiveRequests().length,
            heapUsed: heapStats.used_heap_size,
            heapTotal: heapStats.total_heap_size,
            externalMemory: heapStats.external_memory
        };

        this.metrics.push(metrics);
        this.logMetrics(metrics);
    }

    // 记录指标
    private logMetrics(m: ThreadPoolMetrics): void {
        console.log(`[${new Date(m.timestamp).toISOString()}]`);
        console.log(`  UV线程池大小: ${m.uvThreadPoolSize}`);
        console.log(`  活跃Handle: ${m.activeHandles}`);
        console.log(`  活跃Request: ${m.activeRequests}`);
        console.log(`  堆内存使用: ${(m.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    }

    // 获取分析报告
    getReport(): void {
        if (this.metrics.length < 2) {
            console.log('数据不足，无法生成报告');
            return;
        }

        const first = this.metrics[0];
        const last = this.metrics[this.metrics.length - 1];
        const duration = (last.timestamp - first.timestamp) / 1000;

        console.log('\n========== 线程池监控报告 ==========');
        console.log(`监控时长: ${duration.toFixed(1)}秒`);
        console.log(`采样次数: ${this.metrics.length}`);
        console.log(`平均Handle数: ${(this.metrics.reduce((s, m) => s + m.activeHandles, 0) / this.metrics.length).toFixed(0)}`);
        console.log(`最大Handle数: ${Math.max(...this.metrics.map(m => m.activeHandles))}`);
        console.log('===================================\n');
    }
}
```

## 七、常见问题与解决方案

### 7.1 线程池阻塞事件循环

**问题**：大量同步操作仍会阻塞事件循环。

```typescript
// 问题代码：同步读取大文件会阻塞
import * as fs from 'fs';

// ❌ 错误：在主线程同步读取大文件
const data = fs.readFileSync('large-file.bin');  // 阻塞事件循环！

// ✅ 正确：使用异步API
import * as fs from 'fs/promises';

// 使用异步API
const data = await fs.readFile('large-file.bin');
```

### 7.2 线程池饱和导致超时

**问题**：线程池满导致新任务排队超时。

```typescript
// 设置合理的超时机制
async function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    operationName: string
): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
            reject(new Error(`${operationName} 超时 (${timeoutMs}ms)`));
        }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
}

// 使用示例
async function safeReadFile(path: string): Promise<Buffer> {
    return withTimeout(
        fs.promises.readFile(path),
        5000,  // 5秒超时
        `读取文件 ${path}`
    );
}
```

### 7.3 线程安全问题

**问题**：Worker线程间的共享状态可能导致竞态条件。

```typescript
// ❌ 不安全的共享状态
let sharedCounter = 0;

if (!isMainThread) {
    // 工作线程中修改共享变量
    sharedCounter++;  // 竞态条件！
    parentPort?.postMessage({ counter: sharedCounter });
}

// ✅ 使用消息传递或共享内存
if (!isMainThread) {
    // 通过消息传递数据，避免共享状态
    parentPort?.postMessage({
        increment: true,
        workerId: workerData.threadId
    });
}

// 或使用 SharedArrayBuffer
const sharedBuffer = new SharedArrayBuffer(4);
const sharedArray = new Int32Array(sharedBuffer);

if (!isMainThread) {
    // 使用Atomics确保原子操作
    Atomics.add(sharedArray, 0, 1);
    parentPort?.postMessage({ counter: Atomics.load(sharedArray, 0) });
}
```

## 小结

本章深入剖析了libuv线程池的工作原理、任务类型、配置方法和最佳实践：

1. **线程池架构**：libuv使用预创建的线程池处理可能阻塞主线程的IO操作
2. **任务类型**：文件IO、DNS查询、随机数生成等会进入线程池
3. **配置调优**：通过`UV_THREADPOOL_SIZE`环境变量调整大小
4. **Worker Threads**：Node.js提供的原生线程方案，适合CPU密集型任务
5. **对比分析**：与Java线程池相比，libuv线程池更简单但功能也较少

## 思考题

1. 为什么网络IO操作不使用线程池，而文件IO需要？
2. 如果一个应用大量使用`crypto.randomBytes`，应该如何调优？
3. Worker Threads和libuv线程池各有什么优缺点？
4. 如何设计一个监控方案来发现线程池饱和问题？
5. 在什么情况下需要使用多进程而非多线程？

## 相关参考

- libuv官方文档：http://docs.libuv.org/
- Node.js线程池官方文档：https://nodejs.org/api/threadpool.html
- Java ThreadPoolExecutor文档：https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ThreadPoolExecutor.html
