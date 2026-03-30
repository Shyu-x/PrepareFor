# Node.js并发模式与Go并发对比

## 一、Node.js事件循环原理

### 1.1 事件循环是什么

Node.js事件循环是JavaScript运行时处理异步操作的核心机制。它使得单线程的Node.js能够高效处理大量并发I/O操作，而无需创建大量线程。

```javascript
/**
 * 事件循环基本流程
 *
 * Node.js事件循环遵循以下阶段顺序：
 * 1. timers（定时器阶段）- 执行 setTimeout() 和 setInterval() 回调
 * 2. pending callbacks（待定回调）- 执行延迟到下一循环的I/O回调
 * 3. idle, prepare（空闲准备）- 内部使用
 * 4. poll（轮询）- 获取新的I/O事件，取决于timers和待处理任务
 * 5. check（检查）- 执行 setImmediate() 回调
 * 6. close callbacks（关闭回调）- 执行 close 事件回调
 */

// 示例：观察事件循环的执行顺序
console.log('1 - 主线程同步代码'); // 最先执行

setTimeout(() => {
  console.log('2 - setTimeout 回调（timers阶段）');
}, 0);

setImmediate(() => {
  console.log('3 - setImmediate 回调（check阶段）');
});

process.nextTick(() => {
  console.log('4 - process.nextTick（在任何阶段之前执行）');
});

console.log('5 - 主线程同步代码结束');

// 输出顺序：
// 1 - 主线程同步代码
// 5 - 主线程同步代码结束
// 4 - process.nextTick
// 2 - setTimeout 回调 或 3 - setImmediate 回调（取决于运行环境）
```

### 1.2 事件循环与异步队列

Node.js使用多个队列来管理不同类型的异步任务：

```javascript
/**
 * 异步任务队列分类
 *
 * 1. 微任务队列（Microtask Queue）
 *    - Promise.then/catch/finally
 *    - process.nextTick
 *    - 优先级：process.nextTick > Promise微任务
 *
 * 2. 宏任务队列（Macrotask Queue）
 *    - setTimeout / setInterval
 *    - setImmediate
 *    - I/O操作回调
 *    - UI渲染（浏览器环境）
 */

// 微任务与宏任务的执行顺序
console.log('--- 任务执行顺序演示 ---');

setTimeout(() => console.log('宏任务: setTimeout'), 0);

Promise.resolve()
  .then(() => console.log('微任务: Promise.then'))
  .then(() => console.log('微任务: Promise.then(链式)'));

process.nextTick(() => console.log('微任务: nextTick'));

// 执行顺序：同步代码 → nextTick → Promise.then → setTimeout
```

### 1.3 libuv与事件循环

Node.js底层使用libuv库实现跨平台的异步I/O操作：

```javascript
/**
 * libuv工作线程池
 *
 * libuv维护一个线程池来处理耗时的异步操作：
 * - 文件系统操作
 * - DNS查询
 * - 压缩/解压（zlib）
 * - 加密操作（crypto）
 * - 快照处理
 *
 * 默认线程池大小：4（可配置 UV_THREADPOOL_SIZE 环境变量）
 */

// 观察线程池大小对并发的影响
const crypto = require('crypto');
const { env } = process;

console.log(`当前线程池大小: ${env.UV_THREADPOOL_SIZE || 4}`);

// 模拟大量加密操作，观察线程池竞争
function measureCryptoOperations(count) {
  console.time(`${count}次加密操作`);

  let completed = 0;

  for (let i = 0; i < count; i++) {
    crypto.pbkdf2('password', 'salt', 100000, 64, 'sha512', (err, key) => {
      completed++;
      if (completed === count) {
        console.timeEnd(`${count}次加密操作`);
      }
    });
  }
}

measureCryptoOperations(8); // 观察线程池排队情况
```

## 二、Go goroutine vs Node.js异步

### 2.1 两种并发模型对比

Go和Node.js代表了两种截然不同的并发处理范式：

```javascript
/**
 * Go并发模型：M:N 线程模型
 *
 * - M（Machine）：操作系统线程
 * - P（Processor）：Go调度器分配的上下文
 * - G（ Goroutine ）：轻量级用户态线程
 *
 * 特点：
 * - 数万个goroutine可以同时运行
 * - Go调度器自动在P上调度G
 * - 阻塞调用会被Go运行时自动处理
 */

// Go代码示例（对比参考）
/*
func main() {
    // 创建一个goroutine
    go func() {
        fmt.Println("在goroutine中执行")
    }()

    // 主goroutine等待
    time.Sleep(time.Second)
}
*/

/**
 * Node.js并发模型：单线程事件循环
 *
 * 特点：
 * - 单线程执行JavaScript
 * - 非阻塞I/O通过libuv实现
 * - 适合I/O密集型应用
 * - CPU密集型任务需要使用Worker Threads
 */

// Node.js异步代码示例
function nodejsAsync() {
  // 模拟异步I/O操作
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('Node.js异步结果');
    }, 100);
  });
}

// 使用async/await处理
async function fetchData() {
  console.log('开始请求...');
  const result = await nodejsAsync();
  console.log('结果:', result);
}
```

### 2.2 并发性能对比

```javascript
/**
 * 并发性能场景对比
 *
 * 场景：同时处理10000个请求
 */

// Node.js实现：事件循环 + 异步I/O
const http = require('http');

// Node.js处理高并发的方式
function createNodeServer() {
  let requestCount = 0;

  const server = http.createServer(async (req, res) => {
    requestCount++;

    // 模拟异步数据库查询
    await new Promise(resolve => setTimeout(resolve, 10));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: '处理完成',
      requestId: requestCount
    }));
  });

  return server;
}

// Node.js的优势：单线程就能处理大量并发连接
// 限制：CPU密集型任务会阻塞事件循环
```

### 2.3 适用场景分析

```javascript
/**
 * Node.js最佳场景
 *
 * 1. I/O密集型应用
 *    - API网关
 *    - 实时聊天应用
 *    - 文件服务器
 *
 * 2. 实时应用
 *    - WebSocket服务器
 *    - 直播推流
 *    - 游戏服务器
 *
 * 3. 数据流应用
 *    - 日志处理
 *    - 视频转码
 *    - ETL管道
 */

// 示例：适合Node.js的数据流处理
const { createReadStream } = require('fs');
const { createGzip } = require('zlib');
const path = require('path');

/**
 * 使用流处理大文件 - 高效利用内存
 *
 * Node.js的流API使得处理GB级别的文件成为可能
 * 整个文件不需要全部加载到内存中
 */
function streamProcessLargeFile(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const readStream = createReadStream(inputPath);
    const writeStream = createReadStream(outputPath);
    const gzipStream = createGzip();

    // 使用管道连接流
    readStream
      .pipe(gzipStream)
      .pipe(writeStream)
      .on('finish', resolve)
      .on('error', reject);
  });
}
```

## 三、Singleflight模式Node.js实现

### 3.1 Singleflight模式原理

Singleflight是一种防止缓存击穿的设计模式，当多个请求同时发起时，只让一个请求真正执行，其他请求等待结果：

```javascript
/**
 * Singleflight模式
 *
 * 解决的问题：
 * - 缓存失效时，大量请求同时打到后端
 * - 数据库查询热点数据时的大量重复查询
 * - 外部API调用的并发控制
 *
 * 核心思想：
 * - 使用Map存储正在进行的请求
 * - 相同的key只允许一个请求执行
 * - 其他请求等待该请求完成并共享结果
 */

// Singleflight实现类
class Singleflight {
  constructor() {
    // 存储正在进行的请求，key => { promise, refs }
    this.inFlight = new Map();
  }

  /**
   * 执行单个请求
   * @param {string} key - 请求的唯一标识
   * @param {Function} fn - 实际执行的异步函数
   * @returns {Promise} - 返回请求结果
   */
  async do(key, fn) {
    // 检查是否有正在进行的相同请求
    if (this.inFlight.has(key)) {
      const pending = this.inFlight.get(key);
      pending.refs++;
      console.log(`[Singleflight] 复用已有请求: ${key}, 引用数: ${pending.refs}`);
      return pending.promise;
    }

    // 创建新的请求
    console.log(`[Singleflight] 创建新请求: ${key}`);
    const promise = fn()
      .finally(() => {
        // 清理：所有引用都完成后移除
        pending.refs--;
        if (pending.refs === 0) {
          this.inFlight.delete(key);
          console.log(`[Singleflight] 清理请求: ${key}`);
        }
      });

    const pending = { promise, refs: 1 };
    this.inFlight.set(key, pending);

    return promise;
  }

  /**
   * 忘记指定的key，强制下次创建新请求
   * @param {string} key - 要忘记的key
   */
  forget(key) {
    this.inFlight.delete(key);
  }
}

// 使用示例
const sf = new Singleflight();

// 模拟数据库查询
async function queryUserFromDB(userId) {
  console.log(`[DB] 执行数据库查询: ${userId}`);
  await new Promise(resolve => setTimeout(resolve, 100)); // 模拟查询延迟
  return { id: userId, name: `用户${userId}` };
}

// 测试Singleflight
async function testSingleflight() {
  const userId = 'user_123';

  // 同时发起5个请求
  const promises = Array(5).fill(null).map(() =>
    sf.do(userId, () => queryUserFromDB(userId))
  );

  const results = await Promise.all(promises);
  console.log('所有结果相同:', results.every(r => r.id === userId));
}

testSingleflight();
// 输出：
// [Singleflight] 创建新请求: user_123
// [DB] 执行数据库查询: user_123
// [Singleflight] 复用已有请求: user_123, 引用数: 2
// ...
// 所有结果相同: true
```

### 3.2 Singleflight在缓存场景的应用

```javascript
/**
 * 带缓存的Singleflight实现
 */
class CachedSingleflight {
  constructor() {
    this.cache = new Map(); // 缓存结果 { key => { value, expireAt } }
    this.inFlight = new Map(); // 正在进行的请求
    this.defaultTTL = 5000; // 默认缓存5秒
  }

  /**
   * 执行带缓存的请求
   * @param {string} key - 缓存key
   * @param {Function} fn - 数据获取函数
   * @param {number} ttl - 缓存过期时间（毫秒）
   */
  async do(key, fn, ttl = this.defaultTTL) {
    // 检查缓存是否有效
    const cached = this.cache.get(key);
    if (cached && cached.expireAt > Date.now()) {
      console.log(`[缓存命中] ${key}`);
      return cached.value;
    }

    // 检查是否有正在进行的请求
    if (this.inFlight.has(key)) {
      return this.inFlight.get(key);
    }

    // 创建新请求
    console.log(`[发起请求] ${key}`);
    const promise = fn()
      .then(value => {
        // 存储到缓存
        this.cache.set(key, {
          value,
          expireAt: Date.now() + ttl
        });
        return value;
      })
      .finally(() => {
        this.inFlight.delete(key);
      });

    this.inFlight.set(key, promise);
    return promise;
  }

  /**
   * 清除指定缓存
   */
  invalidate(key) {
    this.cache.delete(key);
    console.log(`[缓存失效] ${key}`);
  }

  /**
   * 清除所有缓存
   */
  clear() {
    this.cache.clear();
    console.log('[缓存已清空]');
  }
}

// 应用示例：用户信息查询
const cachedSF = new CachedSingleflight();

async function getUserProfile(userId) {
  return cachedSF.do(`user:${userId}`, async () => {
    // 模拟API调用
    await new Promise(r => setTimeout(r, 100));
    return {
      id: userId,
      name: `用户${userId}`,
      email: `${userId}@example.com`,
      avatar: `https://avatar.example.com/${userId}.jpg`
    };
  }, 10000); // 缓存10秒
}

// 测试缓存击穿保护
async function testCachedSF() {
  // 首次请求
  const r1 = await getUserProfile('user_001');

  // 100ms内多次请求（应该复用）
  const [r2, r3, r4] = await Promise.all([
    getUserProfile('user_001'),
    getUserProfile('user_001'),
    getUserProfile('user_001')
  ]);

  console.log('所有请求结果一致:',
    r1.id === r2.id && r2.id === r3.id && r3.id === r4.id);
}
```

## 四、协程对比：async/await vs goroutine

### 4.1 async/await的本质

```javascript
/**
 * async/await 协程模型
 *
 * JavaScript的async/await是基于Promise的语法糖，本质是：
 * - async函数会返回Promise
 * - await会暂停当前协程的执行，等待Promise完成
 * - 事件循环继续处理其他任务
 *
 * 特点：
 * - 单线程，无法真正并行执行
 * - 适合I/O等待场景
 * - 代码书写顺序与执行顺序一致
 */

// async/await示例
async function fetchUserData(userId) {
  // await会暂停函数执行，但不会阻塞整个程序
  const user = await fetchUser(userId);
  const posts = await fetchPosts(user.id);
  const stats = await calculateStats(posts);

  return { user, posts, stats };
}

// 编译后的伪代码示意
function fetchUserData(userId) {
  return fetchUser(userId)
    .then(user => fetchPosts(user.id))
    .then(posts => calculateStats(posts))
    .then(stats => ({ user: arguments[0], posts: arguments[1], stats }));
}
```

### 4.2 goroutine的特点

```javascript
/**
 * Go goroutine 模型
 *
 * goroutine是由Go运行时管理的轻量级线程：
 * - 创建成本极低（只需2KB栈空间）
 * - 由Go调度器在操作系统线程上调度
 * - 可以真正并行执行（多核）
 *
 * 关键区别：
 * - Go: 真正的多线程并行
 * - Node.js: 单线程协作式调度
 */

// Go示例对比
/*
package main

import (
    "fmt"
    "time"
)

func main() {
    // 创建goroutine
    go func() {
        fmt.Println("goroutine执行中")
    }()

    // 主goroutine
    fmt.Println("主goroutine")

    // time.Sleep让主goroutine等待
    time.Sleep(time.Second)
}
*/

/**
 * Node.js Worker Threads对比
 *
 * 当需要真正的并行计算时，可以使用Worker Threads
 */
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (isMainThread) {
  // 主线程
  function runInWorker(workerPath, data) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(workerPath, {
        workerData: data
      });

      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0) reject(new Error(`Worker退出码: ${code}`));
      });
    });
  }

  // Worker Threads适合CPU密集型任务
  // 注意：创建成本比goroutine高很多
}
```

### 4.3 性能与适用场景对比

```javascript
/**
 * 并发性能对比总结
 */

// Node.js async/await优势场景
const nodejsAdvantages = {
  场景1: '高并发I/O请求（Web服务器、API网关）',
  场景2: '实时通信（WebSocket、聊天室）',
  场景3: '流式数据处理（文件、视频）',
  场景4: '微服务间通信'
};

// Node.js劣势场景
const nodejsDisadvantages = {
  场景1: 'CPU密集型计算（图像处理、加密）',
  场景2: '需要真正并行计算的任务',
  场景3: '复杂的并发控制逻辑'
};

// 解决方案：Worker Threads
const { Worker } = require('worker_threads');

/**
 * 使用Worker Threads处理CPU密集型任务
 */
class WorkerPool {
  constructor(workerPath, poolSize = 4) {
    this.workerPath = workerPath;
    this.poolSize = poolSize;
    this.workers = [];
    this.queue = [];
    this.init();
  }

  // 初始化线程池
  init() {
    for (let i = 0; i < this.poolSize; i++) {
      this.workers.push(this.createWorker());
    }
  }

  // 创建Worker
  createWorker() {
    const worker = new Worker(this.workerPath);
    return {
      busy: false,
      instance: worker
    };
  }

  // 执行任务
  exec(taskData) {
    return new Promise((resolve, reject) => {
      const available = this.workers.find(w => !w.busy);

      if (available) {
        this.runTask(available, taskData, resolve, reject);
      } else {
        this.queue.push({ taskData, resolve, reject });
      }
    });
  }

  // 在Worker上运行任务
  runTask(worker, taskData, resolve, reject) {
    worker.busy = true;

    worker.instance.once('message', (result) => {
      worker.busy = false;
      resolve(result);
      this.processQueue();
    });

    worker.instance.once('error', (err) => {
      worker.busy = false;
      reject(err);
      this.processQueue();
    });

    worker.instance.postMessage(taskData);
  }

  // 处理等待队列
  processQueue() {
    if (this.queue.length > 0) {
      const { taskData, resolve, reject } = this.queue.shift();
      const available = this.workers.find(w => !w.busy);
      if (available) {
        this.runTask(available, taskData, resolve, reject);
      }
    }
  }

  // 关闭线程池
  async terminate() {
    await Promise.all(
      this.workers.map(w => w.instance.terminate())
    );
    this.workers = [];
    this.queue = [];
  }
}
```

## 五、Goroutine超时处理

### 5.1 context.Context模式

```javascript
/**
 * Go的context.Context在Node.js中的实现
 *
 * Go使用context.Context进行超时控制和取消操作
 * Node.js可以使用类似的模式管理异步操作的生命周期
 */

class Context {
  constructor(timeout = null) {
    this.timeout = timeout;
    this.deadline = timeout ? Date.now() + timeout : null;
    this.cancelled = false;
    this.cancelReason = null;
    this.onCancel = [];
  }

  // 是否已取消
  isCancelled() {
    if (this.cancelled) return true;
    if (this.deadline && Date.now() > this.deadline) {
      this.cancel('超时取消');
    }
    return this.cancelled;
  }

  // 取消原因
  cancelReason() {
    return this.cancelReason;
  }

  // 触发取消
  cancel(reason = '手动取消') {
    if (this.cancelled) return;
    this.cancelled = true;
    this.cancelReason = reason;
    this.onCancel.forEach(fn => fn(reason));
  }

  // 注册取消回调
  onDidCancel(fn) {
    this.onCancel.push(fn);
    return () => {
      this.onCancel = this.onCancel.filter(f => f !== fn);
    };
  }
}

// 带超时的请求函数
async function fetchWithTimeout(url, options = {}) {
  const timeout = options.timeout || 5000;
  const ctx = new Context(timeout);

  const timeoutId = setTimeout(() => {
    ctx.cancel('请求超时');
  }, timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: createAbortSignal(ctx)
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (ctx.isCancelled()) {
      throw new Error(`请求超时: ${timeout}ms`);
    }
    throw error;
  }
}

// 创建AbortSignal
function createAbortSignal(ctx) {
  const controller = new AbortController();

  ctx.onDidCancel(() => {
    controller.abort();
  });

  return controller.signal;
}

// 使用示例
async function testTimeout() {
  const ctx = new Context(1000); // 1秒超时

  ctx.onDidCancel((reason) => {
    console.log('操作已取消:', reason);
  });

  // 这个操作会超时
  try {
    await new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });
    console.log('操作完成');
  } catch (e) {
    if (ctx.isCancelled()) {
      console.log('被中断');
    }
  }
}
```

### 5.2 超时控制的最佳实践

```javascript
/**
 * 超时控制的最佳实践
 */

// 竞态模式：谁先完成用谁的结果
async function raceWithTimeout(promises, timeoutMs) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('所有操作超时')), timeoutMs);
  });

  return Promise.race([
    Promise.all(promises),
    timeoutPromise
  ]);
}

// 带重试的超时请求
async function requestWithRetry(url, options = {}) {
  const {
    retries = 3,
    retryDelay = 1000,
    timeout = 5000,
    ...fetchOptions
  } = options;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, {
        timeout,
        ...fetchOptions
      });
      return response;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      console.log(`请求失败，第${attempt}次重试...`);
      await new Promise(r => setTimeout(r, retryDelay * attempt));
    }
  }
}
```

## 六、并发安全与锁机制

### 6.1 互斥锁实现

```javascript
/**
 * Node.js中的并发安全与锁机制
 *
 * Node.js单线程环境下，主要关注：
 * 1. 异步操作的结果一致性
 * 2. 共享状态的访问控制
 * 3. 并发写入的序列化
 */

// 互斥锁实现
class Mutex {
  constructor() {
    this.locked = false;
    this.queue = [];
  }

  // 获取锁
  async acquire() {
    if (!this.locked) {
      this.locked = true;
      return Promise.resolve();
    }

    // 返回一个新的Promise，加入等待队列
    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }

  // 释放锁
  release() {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next();
    } else {
      this.locked = false;
    }
  }

  // 使用async/await的便捷方法
  async runExclusive(fn) {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

// 使用示例：保护共享资源
class SharedCounter {
  constructor() {
    this.value = 0;
    this.mutex = new Mutex();
  }

  async increment() {
    return this.mutex.runExclusive(async () => {
      this.value++;
      return this.value;
    });
  }

  async getValue() {
    return this.mutex.runExclusive(async () => {
      return this.value;
    });
  }
}

// 测试并发安全
async function testMutex() {
  const counter = new SharedCounter();

  // 并发执行1000次递增
  await Promise.all(
    Array(1000).fill(null).map(() => counter.increment())
  );

  const finalValue = await counter.getValue();
  console.log(`最终值: ${finalValue}, 期望值: 1000`);
  console.log(`线程安全: ${finalValue === 1000 ? '是' : '否'}`);
}
```

### 6.2 读写锁实现

```javascript
/**
 * 读写锁实现
 *
 * 读操作可以并行，写操作需要独占
 * 适用于读多写少的场景
 */

class ReadWriteLock {
  constructor() {
    this.readers = 0;       // 当前读者数量
    this.waitingWriters = 0; // 等待中的写者数量
    this.writing = false;  // 是否有写者
    this.readQueue = [];    // 读者等待队列
    this.writeQueue = [];   // 写者等待队列
  }

  // 获取读锁
  async readLock() {
    // 如果没有写者且没有等待的写者，直接读取
    if (!this.writing && this.waitingWriters === 0) {
      this.readers++;
      return;
    }

    // 否则加入读队列等待
    return new Promise((resolve) => {
      this.readQueue.push(() => {
        this.readers++;
        resolve();
      });
    }).then(() => this.readLock());
  }

  // 释放读锁
  releaseRead() {
    this.readers--;
    if (this.readers === 0 && this.writeQueue.length > 0) {
      // 唤醒一个写者
      const writer = this.writeQueue.shift();
      this.writing = true;
      writer();
    }
  }

  // 获取写锁
  async writeLock() {
    if (!this.writing && this.readers === 0) {
      this.writing = true;
      return;
    }

    this.waitingWriters++;
    return new Promise((resolve) => {
      this.writeQueue.push(() => {
        this.waitingWriters--;
        this.writing = true;
        resolve();
      });
    }).then(() => this.writeLock());
  }

  // 释放写锁
  releaseWrite() {
    this.writing = false;

    // 优先唤醒写者
    if (this.writeQueue.length > 0) {
      const writer = this.writeQueue.shift();
      this.waitingWriters--;
      this.writing = true;
      writer();
    } else if (this.readQueue.length > 0) {
      // 唤醒所有读者
      const waitingReaders = this.readQueue.splice(0);
      waitingReaders.forEach(fn => fn());
    }
  }

  // 便捷方法：读操作
  async read(fn) {
    await this.readLock();
    try {
      return await fn();
    } finally {
      this.releaseRead();
    }
  }

  // 便捷方法：写操作
  async write(fn) {
    await this.writeLock();
    try {
      return await fn();
    } finally {
      this.releaseWrite();
    }
  }
}

// 使用示例
async function testReadWriteLock() {
  const cache = new Map();
  const rwlock = new ReadWriteLock();

  // 读操作可以并行
  const readPromises = Array(10).fill(null).map(async (_, i) => {
    return rwlock.read(() => {
      console.log(`读操作 ${i}`);
      return cache.get('key') || 'default';
    });
  });

  // 写操作独占
  await rwlock.write(() => {
    console.log('写操作开始');
    cache.set('key', 'new value');
    return 'written';
  });

  await Promise.all(readPromises);
}
```

### 6.3 信号量控制并发数

```javascript
/**
 * 信号量（Semaphore）实现
 *
 * 控制同时执行的操作数量
 */

class Semaphore {
  constructor(maxConcurrent) {
    this.maxConcurrent = maxConcurrent;
    this.current = 0;
    this.queue = [];
  }

  // 获取信号量
  async acquire() {
    if (this.current < this.maxConcurrent) {
      this.current++;
      return;
    }

    return new Promise((resolve) => {
      this.queue.push(() => {
        this.current++;
        resolve();
      });
    }).then(() => this.acquire());
  }

  // 释放信号量
  release() {
    this.current--;
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next();
    }
  }

  // 执行带信号量的操作
  async exec(fn) {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

// 使用示例：限制数据库连接池大小
async function testSemaphore() {
  const dbSemaphore = new Semaphore(5); // 最多5个并发连接

  async function query(sql) {
    return dbSemaphore.exec(async () => {
      console.log(`执行查询: ${sql}`);
      await new Promise(r => setTimeout(r, 100)); // 模拟查询
      return { sql, result: 'query result' };
    });
  }

  // 同时发起20个查询，但只有5个会真正并发执行
  const results = await Promise.all(
    Array(20).fill(null).map((_, i) => query(`SELECT ${i}`))
  );

  console.log(`完成 ${results.length} 个查询`);
}
```

## 七、总结与最佳实践

### 7.1 技术选型建议

```javascript
/**
 * Node.js vs Go 选择指南
 */

// 选择Node.js的场景
const chooseNodejs = [
  '实时Web应用（聊天、协作工具）',
  'API网关和微服务',
  '流式数据处理',
  '团队熟悉JavaScript/TypeScript',
  '快速原型开发'
];

// 选择Go的场景
const chooseGo = [
  '高性能网络服务',
  '需要真正并行的计算密集型任务',
  '云原生和容器化应用',
  '需要简洁的错误处理',
  '追求极致性能'
];

/**
 * Node.js并发最佳实践
 */

// 1. I/O密集型：充分利用异步
async function iOOptimized() {
  // 正确：并行发起多个I/O请求
  const [users, posts, comments] = await Promise.all([
    fetchUsers(),
    fetchPosts(),
    fetchComments()
  ]);

  return { users, posts, comments };
}

// 2. CPU密集型：使用Worker Threads
function cpuOptimized() {
  // 将CPU密集型任务放到Worker中执行
  const worker = new Worker('./cpu-task.js');
  return new Promise((resolve) => {
    worker.on('message', resolve);
    worker.postMessage(inputData);
  });
}

// 3. 控制并发：使用信号量
async function controlledConcurrency() {
  const sem = new Semaphore(10); // 限制为10并发

  const tasks = largeTaskList.map(task =>
    sem.exec(() => processTask(task))
  );

  return Promise.all(tasks);
}
```

### 7.2 关键要点

| 方面 | Node.js | Go |
|------|---------|-----|
| 并发模型 | 单线程+事件循环 | M:N线程+goroutine |
| 并行能力 | 需Worker Threads | 原生多核并行 |
| 适用场景 | I/O密集型 | 计算+网络混合 |
| 复杂度 | 低（回调地狱已解决） | 中（goroutine管理） |
| 性能 | I/O优秀，计算需Worker | 全面优秀 |
| 生态 | npm（海量） | go.mod（快速增长） |

**核心原则**：根据业务特点选择合适的技术栈，并在Node.js中善用异步模式、Worker Threads和并发控制工具来应对各种场景。
