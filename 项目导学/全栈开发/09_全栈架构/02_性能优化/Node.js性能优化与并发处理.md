# Node.js性能优化与并发处理

## 目录

1. [事件循环深度解析](#1-事件循环深度解析)
2. [内存泄漏排查与处理](#2-内存泄漏排查与处理)
3. [CPU密集型处理](#3-cpu密集型处理)
4. [连接池管理](#4-连接池管理)
5. [限流与熔断机制](#5-限流与熔断机制)
6. [进程与集群管理](#6-进程与集群管理)
7. [实战面试题](#7-实战面试题)

---

## 1. 事件循环深度解析

### 1.1 事件循环工作原理

Node.js的事件循环是其高性能异步I/O的核心，理解事件循环对于性能优化至关重要。

```javascript
/**
 * 事件循环各阶段执行顺序详解
 * 这是理解Node.js异步编程的关键
 */

// timers阶段：执行setTimeout和setInterval回调
// 以下代码的输出顺序展示了事件循环的执行机制
console.log('1 - 同步代码开始');

// setTimeout在timers阶段执行
setTimeout(() => {
  console.log('4 - setTimeout 0ms'); // 0ms也会等到下一轮事件循环
}, 0);

// setImmediate在check阶段执行
setImmediate(() => {
  console.log('3 - setImmediate'); // check阶段，优先于timers
});

// process.nextTick在当前阶段后立即执行
process.nextTick(() => {
  console.log('2 - nextTick'); // 最高优先级，在各阶段之间执行
});

console.log('1 - 同步代码结束');
// 输出顺序: 1-同步 → 2-nextTick → 3-setImmediate → 4-setTimeout
```

### 1.2 事件循环调优策略

```javascript
/**
 * 事件循环调优核心策略
 * 目标：保持事件循环不被阻塞，确保高并发处理能力
 */

// 策略1：避免在事件循环中执行CPU密集型任务
// 错误示例：阻塞事件循环
function badBlockingOperation() {
  let result = 0;
  for (let i = 0; i < 1000000000; i++) {
    result += i; // 这会完全阻塞事件循环
  }
  return result;
}

// 正确示例：使用Worker Threads处理CPU密集型任务
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

// 主线程：创建Worker处理CPU密集型任务
function runInWorker(script, data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(script, {
      workerData: data
    });

    worker.on('message', resolve);     // 接收Worker的计算结果
    worker.on('error', reject);       // 处理Worker错误
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}

// 策略2：分批处理大数组，避免单次循环阻塞
function batchProcess(items, batchSize, processFn) {
  // 将大数组分割成小批次
  // 每批次处理后让出事件循环
  const batches = [];

  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  let index = 0;

  // 使用setImmediate分批执行，让出事件循环
  return new Promise((resolve) => {
    function processBatch() {
      if (index >= batches.length) {
        resolve();
        return;
      }

      // 处理当前批次
      const batch = batches[index++];
      batch.forEach(processFn);

      // 让出事件循环，处理下一批
      setImmediate(processBatch);
    }

    processBatch();
  });
}

// 策略3：使用requestIdleCallback调度非紧急任务
// Node.js 12+ 支持
function scheduleIdleTask(task, options = {}) {
  const start = Date.now();
  const deadline = options.timeout || 50; // 每批最多50ms

  function runTask() {
    if (task()) {
      const elapsed = Date.now() - start;
      if (elapsed < deadline) {
        setImmediate(runTask);
      } else {
        // 任务已完成或超时，下次事件循环继续
        setImmediate(runTask);
      }
    }
  }

  setImmediate(runTask);
}
```

### 1.3 微任务调度优化

```javascript
/**
 * 微任务队列对事件循环的影响
 * 微任务（Promise/nextTick）会在当前阶段结束后立即执行
 */

// process.nextTick的优先级高于Promise微任务
console.log('同步开始');

Promise.resolve().then(() => {
  console.log('Promise微任务');
});

process.nextTick(() => {
  console.log('nextTick任务'); // 优先执行
});

console.log('同步结束');
// 输出: 同步开始 → 同步结束 → nextTick任务 → Promise微任务

// 大量nextTick可能导致问题
function badPattern() {
  // 永远不要在nextTick中递归调用自己
  let count = 0;
  function recursiveTask() {
    count++;
    if (count < 1000000) {
      process.nextTick(recursiveTask); // 危险：可能耗尽调用栈
    }
  }
  recursiveTask();
}

// 正确做法：使用setImmediate进行分片
function goodPattern() {
  let count = 0;

  function recursiveTask() {
    count++;
    if (count < 1000000) {
      setImmediate(recursiveTask); // 让出事件循环
    }
  }

  recursiveTask();
}
```

---

## 2. 内存泄漏排查与处理

### 2.1 常见内存泄漏场景

```javascript
/**
 * Node.js常见内存泄漏场景及解决方案
 */

// 泄漏场景1：全局变量累积
const cache = new Map(); // 全局缓存无限增长

function badCache(key, value) {
  // 永远不会清理的缓存
  cache.set(key, value);
}

// 正确做法：设置缓存上限和过期机制
class LRUCache {
  constructor(maxSize = 1000, ttl = 3600000) {
    this.maxSize = maxSize; // 缓存最大数量
    this.ttl = ttl;          // 过期时间（毫秒）
    this.cache = new Map();
    this.timers = new Map();
  }

  set(key, value) {
    // 清理旧数据
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.delete(firstKey);
    }

    this.cache.set(key, value);

    // 设置过期定时器
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    this.timers.set(key, setTimeout(() => {
      this.delete(key);
    }, this.ttl));
  }

  get(key) {
    const value = this.cache.get(key);
    if (value === undefined) return null;

    // 更新访问顺序（LRU）
    this.cache.delete(key);
    this.cache.set(key, value);

    return value;
  }

  delete(key) {
    this.cache.delete(key);
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
  }
}

// 泄漏场景2：事件监听器未清理
const EventEmitter = require('events');

class DataProcessor extends EventEmitter {
  constructor() {
    super();
    this.data = [];
  }

  process(data) {
    this.data.push(data);
    this.emit('processed', data);
  }
}

// 泄漏：每次创建新处理器都添加监听器
function badEventHandler() {
  const processor = new DataProcessor();

  // 每次调用都添加新的监听器，永远不移除
  processor.on('processed', (data) => {
    console.log('处理数据:', data);
  });

  processor.process(Math.random());
}

// 正确做法：使用once或手动移除监听器
function goodEventHandler() {
  const processor = new DataProcessor();

  // 使用once：自动在触发后移除监听器
  processor.once('processed', (data) => {
    console.log('处理数据:', data);
  });

  processor.process(Math.random());
}

// 泄漏场景3：闭包引用外部变量
function createLeakyClosure() {
  const largeData = Buffer.alloc(1024 * 1024 * 10); // 10MB数据

  return function leakyCallback() {
    // 闭包持有largeData的引用，即使回调不再需要
    return largeData.length;
  };
}

// 正确做法：及时释放大对象引用
function createGoodClosure() {
  const largeData = Buffer.alloc(1024 * 1024 * 10);
  const size = largeData.length; // 只保存需要的数据

  // 让大对象可以被垃圾回收
  largeData = null;

  return function goodCallback() {
    return size; // 只引用必要的数据
  };
}
```

### 2.2 内存泄漏排查工具

```javascript
/**
 * 使用Node.js内置工具排查内存泄漏
 */

// 方法1：使用--inspect启动检查
// node --inspect server.js
// 然后在Chrome DevTools中连接进行内存分析

// 方法2：生成堆快照
const v8 = require('v8');
const fs = require('fs');

function takeHeapSnapshot(filename = 'heap-snapshot.heapsnapshot') {
  const snapshot = v8.writeHeapSnapshot();
  console.log(`堆快照已保存到: ${snapshot}`);
}

// 方法3：使用process.memoryUsage()监控内存
function monitorMemory(intervalMs = 5000) {
  const interval = setInterval(() => {
    const usage = process.memoryUsage();

    console.log('内存使用情况:');
    console.log(`  RSS (常驻内存): ${formatBytes(usage.rss)}`);
    console.log(`  堆内存总量: ${formatBytes(usage.heapTotal)}`);
    console.log(`  堆内存使用: ${formatBytes(usage.heapUsed)}`);
    console.log(`  外部内存: ${formatBytes(usage.external)}`);
    console.log('');

    // 检测内存增长趋势
    if (usage.heapUsed > 500 * 1024 * 1024) { // 超过500MB
      console.warn('警告: 堆内存使用超过500MB，可能存在内存泄漏');
    }
  }, intervalMs);

  return () => clearInterval(interval);
}

function formatBytes(bytes) {
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

// 方法4：强制GC后检查内存（需要--expose-gc启动）
let forceGC;
if (global.gc) {
  forceGC = global.gc;
} else {
  console.log('使用 --expose-gc 启动以启用手动垃圾回收');
}

// 示例：检测循环引用导致的内存泄漏
class Node {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}

class LinkedList {
  constructor() {
    this.head = null;
  }

  add(value) {
    const node = new Node(value);
    node.next = this.head;
    this.head = node;
  }

  // 内存泄漏：没有clear方法，旧节点无法被GC
}

// 正确做法：提供清理方法
class LinkedListFixed {
  constructor() {
    this.head = null;
  }

  add(value) {
    const node = new Node(value);
    node.next = this.head;
    this.head = node;
  }

  clear() {
    // 断开所有引用，允许GC回收
    let current = this.head;
    while (current) {
      const next = current.next;
      current.next = null;
      current = next;
    }
    this.head = null;
  }
}
```

---

## 3. CPU密集型处理

### 3.1 Worker Threads基础

```javascript
/**
 * Worker Threads实现真正的并行处理
 * 适用于：数据加密、图像处理、大数据计算
 */

// worker.js - Worker线程执行脚本
const { parentPort, workerData } = require('worker_threads');

// 接收主线程传来的数据
parentPort.on('message', (task) => {
  const result = processHeavyTask(task.data);

  // 将结果返回主线程
  parentPort.postMessage({ id: task.id, result });
});

/**
 * CPU密集型计算任务
 * @param {number} data - 输入数据
 * @returns {number} 计算结果
 */
function processHeavyTask(data) {
  // 示例：计算斐波那契数列（CPU密集）
  function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
  }

  return fibonacci(data);
}

// main.js - 主线程
const { Worker } = require('worker_threads');
const os = require('os');

// 创建Worker线程池
class WorkerPool {
  constructor(workerScript, poolSize = os.cpus().length) {
    this.workerScript = workerScript;
    this.poolSize = poolSize;
    this.workers = [];
    this.taskQueue = [];
    this.activeWorkers = 0;

    this.init();
  }

  init() {
    // 预创建Worker线程
    for (let i = 0; i < this.poolSize; i++) {
      this.workers.push(this.createWorker());
    }
  }

  createWorker() {
    const worker = new Worker(this.workerScript);
    let currentTask = null;

    worker.on('message', (result) => {
      if (currentTask) {
        currentTask.resolve(result.result);
        currentTask = null;
      }
      this.activeWorkers--;
      this.processNextTask();
    });

    worker.on('error', (err) => {
      if (currentTask) {
        currentTask.reject(err);
        currentTask = null;
      }
      this.activeWorkers--;
    });

    return { worker, busy: false };
  }

  processNextTask() {
    if (this.taskQueue.length === 0) return;

    // 找一个空闲的Worker
    const workerInfo = this.workers.find(w => !w.busy);
    if (!workerInfo) return;

    const task = this.taskQueue.shift();
    workerInfo.busy = true;
    this.activeWorkers++;
    workerInfo.worker.postMessage(task);
  }

  runTask(data) {
    return new Promise((resolve, reject) => {
      const task = {
        id: Date.now() + Math.random(),
        data
      };

      // 如果有空闲Worker，立即执行
      const workerInfo = this.workers.find(w => !w.busy);
      if (workerInfo) {
        workerInfo.busy = true;
        this.activeWorkers++;
        workerInfo.worker.postMessage(task);
        task.resolve = resolve;
        task.reject = reject;
      } else {
        // 否则加入队列
        task.resolve = resolve;
        task.reject = reject;
        this.taskQueue.push(task);
      }
    });
  }

  destroy() {
    this.workers.forEach(w => w.worker.terminate());
    this.workers = [];
    this.taskQueue = [];
  }
}

// 使用示例
async function main() {
  const pool = new WorkerPool('./worker.js');

  try {
    // 并行执行多个CPU密集型任务
    const results = await Promise.all([
      pool.runTask(40),
      pool.runTask(38),
      pool.runTask(42),
      pool.runTask(36)
    ]);

    console.log('计算结果:', results);
  } finally {
    pool.destroy();
  }
}
```

### 3.2 集群模式与负载均衡

```javascript
/**
 * Node.js集群模式实现高可用和负载均衡
 */

const cluster = require('cluster');
const http = require('http');
const os = require('os');

// 获取CPU核心数
const numCPUs = os.cpus().length;

if (cluster.isMaster) {
  console.log(`主进程 PID: ${process.pid}`);
  console.log(`将启动 ${numCPUs} 个工作进程`);

  // 监听每个工作进程的退出事件
  cluster.on('exit', (worker, code, signal) => {
    console.log(`工作进程 ${worker.process.pid} 退出`);
    // 异常退出时重启工作进程
    if (code !== 0 && !worker.exitedAfterDisconnect) {
      console.log('异常退出，重启工作进程...');
      cluster.fork();
    }
  });

  // 启动工作进程
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // 优雅关闭
  process.on('SIGTERM', () => {
    console.log('收到SIGTERM信号，开始优雅关闭...');

    cluster.disconnect(() => {
      console.log('所有工作进程已关闭');
      process.exit(0);
    });
  });

} else {
  // 工作进程：运行HTTP服务器
  const server = http.createServer((req, res) => {
    // 模拟请求处理
    if (req.url === '/health') {
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'ok', pid: process.pid }));
      return;
    }

    // CPU密集型处理
    const result = computeHeavyTask();

    res.writeHead(200);
    res.end(`处理进程: ${process.pid}, 结果: ${result}`);
  });

  server.listen(3000, () => {
    console.log(`工作进程 ${process.pid} 监听3000端口`);
  });
}

/**
 * CPU密集型计算任务
 */
function computeHeavyTask() {
  let result = 0;
  for (let i = 0; i < 100000000; i++) {
    result += Math.sqrt(i);
  }
  return result;
}
```

---

## 4. 连接池管理

### 4.1 数据库连接池

```javascript
/**
 * 数据库连接池管理 - 平衡连接数和性能
 */

// 使用generic-pool管理通用连接池
const genericPool = require('generic-pool');
const { Pool } = require('pg');

/**
 * PostgreSQL连接池管理器
 * 特性：
 * - 最小/最大连接数控制
 * - 连接获取/释放策略
 * - 空闲连接超时处理
 * - 连接获取/释放事件监听
 */
class DatabasePool {
  constructor(config) {
    this.config = {
      min: 2,                    // 最小连接数
      max: 20,                   // 最大连接数
      acquireTimeoutMillis: 30000, // 获取连接超时
      idleTimeoutMillis: 30000,    // 空闲超时
      ...config
    };

    // 创建底层数据库连接池
    this.pgPool = new Pool({
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.user,
      password: this.config.password,
      max: this.config.max
    });

    // 创建通用连接池
    this.pool = genericPool.createPool({
      create: async () => {
        // 创建新连接
        const client = await this.pgPool.connect();
        console.log(`连接池: 创建新连接`);
        return client;
      },
      destroy: async (client) => {
        // 释放连接
        client.release();
        console.log(`连接池: 释放连接`);
      },
      validate: async (client) => {
        // 验证连接是否有效
        try {
          await client.query('SELECT 1');
          return true;
        } catch {
          return false;
        }
      }
    }, {
      min: this.config.min,
      max: this.config.max,
      acquireTimeoutMillis: this.config.acquireTimeoutMillis,
      idleTimeoutMillis: this.config.idleTimeoutMillis
    });

    // 监听连接池事件
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.pool.on('factoryCreateSuccess', () => {
      console.log('连接池: 创建新连接成功');
    });

    this.pool.on('factoryCreateError', (err) => {
      console.error('连接池: 创建连接失败', err);
    });

    this.pool.on('factoryDestroySuccess', () => {
      console.log('连接池: 销毁连接成功');
    });
  }

  /**
   * 从连接池获取连接
   * @returns {Promise<PGClient>}
   */
  async acquire() {
    const start = Date.now();
    const client = await this.pool.acquire();
    const elapsed = Date.now() - start;

    if (elapsed > 1000) {
      console.warn(`警告: 获取连接耗时 ${elapsed}ms`);
    }

    return client;
  }

  /**
   * 释放连接回连接池
   * @param {PGClient} client
   */
  release(client) {
    this.pool.release(client);
  }

  /**
   * 执行查询（自动获取和释放连接）
   * @param {string} sql
   * @param {Array} params
   * @returns {Promise<QueryResult>}
   */
  async query(sql, params = []) {
    const client = await this.acquire();
    try {
      const result = await client.query(sql, params);
      return result;
    } finally {
      this.release(client);
    }
  }

  /**
   * 执行事务
   * @param {Function} callback - 事务回调函数
   * @returns {Promise<any>}
   */
  async transaction(callback) {
    const client = await this.acquire();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      this.release(client);
    }
  }

  /**
   * 获取连接池状态
   */
  getStatus() {
    return {
      size: this.pool.size,
      available: this.pool.available,
      borrowed: this.pool.borrowed,
      pending: this.pool.pending
    };
  }

  /**
   * 关闭连接池
   */
  async close() {
    await this.pool.drain();
    await this.pool.clear();
    await this.pgPool.end();
    console.log('连接池已关闭');
  }
}

// 使用示例
async function useDatabasePool() {
  const db = new DatabasePool({
    host: 'localhost',
    port: 5432,
    database: 'mydb',
    user: 'user',
    password: 'password'
  });

  try {
    // 查询
    const result = await db.query('SELECT * FROM users WHERE id = $1', [1]);
    console.log('查询结果:', result.rows);

    // 事务
    await db.transaction(async (client) => {
      await client.query(
        'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
        [100, 1]
      );
      await client.query(
        'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
        [100, 2]
      );
    });

    // 获取状态
    console.log('连接池状态:', db.getStatus());
  } finally {
    await db.close();
  }
}
```

---

## 5. 限流与熔断机制

### 5.1 请求限流

```javascript
/**
 * 限流器实现 - 保护系统不被过载
 */

/**
 * 滑动窗口限流器
 * 原理：在固定时间窗口内限制请求数量
 */
class SlidingWindowRateLimiter {
  /**
   * @param {number} maxRequests - 时间窗口内最大请求数
   * @param {number} windowMs - 时间窗口大小（毫秒）
   */
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map(); // 存储每个key的请求时间戳
  }

  /**
   * 检查是否允许请求
   * @param {string} key - 限流key（如用户ID、IP地址）
   * @returns {boolean}
   */
  isAllowed(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // 获取该key的请求历史
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const timestamps = this.requests.get(key);

    // 移除窗口外的旧请求
    const validTimestamps = timestamps.filter(t => t > windowStart);

    if (validTimestamps.length >= this.maxRequests) {
      return false; // 超过限制
    }

    // 记录新请求
    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);

    return true;
  }

  /**
   * 获取剩余请求数
   */
  getRemaining(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const timestamps = this.requests.get(key) || [];
    const validCount = timestamps.filter(t => t > windowStart).length;
    return Math.max(0, this.maxRequests - validCount);
  }
}

/**
 * 令牌桶限流器
 * 优点：允许一定程度的突发流量
 */
class TokenBucketRateLimiter {
  /**
   * @param {number} capacity - 桶的容量
   * @param {number} refillRate - 每秒补充的令牌数
   */
  constructor(capacity, refillRate) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.buckets = new Map(); // 存储每个key的桶状态
  }

  /**
   * 获取桶状态
   */
  getBucket(key) {
    if (!this.buckets.has(key)) {
      this.buckets.set(key, {
        tokens: this.capacity,
        lastRefill: Date.now()
      });
    }
    return this.buckets.get(key);
  }

  /**
   * 补充令牌
   */
  refillBucket(bucket) {
    const now = Date.now();
    const elapsed = (now - bucket.lastRefill) / 1000; // 秒
    const tokensToAdd = elapsed * this.refillRate;

    bucket.tokens = Math.min(this.capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  /**
   * 尝试消耗令牌
   * @param {string} key
   * @param {number} cost - 消耗的令牌数
   * @returns {boolean}
   */
  tryConsume(key, cost = 1) {
    const bucket = this.getBucket(key);
    this.refillBucket(bucket);

    if (bucket.tokens >= cost) {
      bucket.tokens -= cost;
      return true;
    }

    return false;
  }

  /**
   * 获取剩余令牌数
   */
  getRemaining(key) {
    const bucket = this.getBucket(key);
    this.refillBucket(bucket);
    return Math.floor(bucket.tokens);
  }
}

// Express中间件集成
function createRateLimitMiddleware(limiter, keyGenerator = (req) => req.ip) {
  return (req, res, next) => {
    const key = keyGenerator(req);

    if (!limiter.isAllowed(key)) {
      return res.status(429).json({
        error: '请求过于频繁，请稍后再试',
        retryAfter: Math.ceil(limiter.windowMs / 1000)
      });
    }

    // 设置响应头
    res.setHeader('X-RateLimit-Remaining', limiter.getRemaining(key));
    next();
  };
}
```

### 5.2 熔断器模式

```javascript
/**
 * 熔断器模式 - 防止级联故障
 *
 * 状态转换：
 * CLOSED（正常）→ 失败率超过阈值 → OPEN（熔断）
 * OPEN（熔断）→ 等待时间结束 → HALF_OPEN（尝试）
 * HALF_OPEN（尝试）→ 成功 → CLOSED
 * HALF_OPEN（尝试）→ 失败 → OPEN
 */

const EventEmitter = require('events');

class CircuitBreaker extends EventEmitter {
  constructor(options = {}) {
    super();

    this.failureThreshold = options.failureThreshold || 5;  // 失败次数阈值
    this.successThreshold = options.successThreshold || 2;  // 成功次数阈值（从熔断恢复）
    this.timeout = options.timeout || 60000;               // 熔断持续时间
    this.halfOpenMaxCalls = options.halfOpenMaxCalls || 3; // 半开状态最大尝试数

    this.state = 'CLOSED';  // CLOSED, OPEN, HALF_OPEN
    this.failures = 0;
    this.successes = 0;
    this.nextAttempt = Date.now();
    this.halfOpenCalls = 0;
  }

  /**
   * 执行受保护的操作
   * @param {Function} operation - 要执行的操作
   * @returns {Promise<any>}
   */
  async execute(operation) {
    // 检查是否可以执行
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('熔断器已打开，拒绝请求');
      }
      // 等待时间结束，切换到半开状态
      this.toHalfOpen();
    }

    if (this.state === 'HALF_OPEN' && this.halfOpenCalls >= this.halfOpenMaxCalls) {
      throw new Error('熔断器半开状态尝试次数已满');
    }

    try {
      if (this.state === 'HALF_OPEN') {
        this.halfOpenCalls++;
      }

      const result = await operation();
      this.onSuccess();
      return result;

    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * 记录成功
   */
  onSuccess() {
    this.failures = 0;

    if (this.state === 'HALF_OPEN') {
      this.successes++;
      if (this.successes >= this.successThreshold) {
        this.toClosed();
      }
    }

    this.emit('success', { state: this.state });
  }

  /**
   * 记录失败
   */
  onFailure() {
    this.failures++;
    this.successes = 0;

    if (this.state === 'CLOSED') {
      if (this.failures >= this.failureThreshold) {
        this.toOpen();
      }
    } else if (this.state === 'HALF_OPEN') {
      this.toOpen();
    }

    this.emit('failure', { state: this.state, failures: this.failures });
  }

  /**
   * 切换到熔断状态
   */
  toOpen() {
    this.state = 'OPEN';
    this.nextAttempt = Date.now() + this.timeout;
    this.emit('open');
  }

  /**
   * 切换到半开状态
   */
  toHalfOpen() {
    this.state = 'HALF_OPEN';
    this.successes = 0;
    this.halfOpenCalls = 0;
    this.emit('halfOpen');
  }

  /**
   * 切换到正常状态
   */
  toClosed() {
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.halfOpenCalls = 0;
    this.emit('closed');
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      nextAttempt: this.state === 'OPEN' ? this.nextAttempt : null
    };
  }
}

// 使用示例
async function useCircuitBreaker() {
  const breaker = new CircuitBreaker({
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 30000
  });

  // 监听状态变化
  breaker.on('open', () => console.log('熔断器打开'));
  breaker.on('halfOpen', () => console.log('熔断器进入半开状态'));
  breaker.on('closed', () => console.log('熔断器关闭'));

  // 模拟外部服务调用
  let callCount = 0;
  async function unreliableService() {
    callCount++;
    if (callCount % 3 === 0) {
      throw new Error('服务暂时不可用');
    }
    return '操作成功';
  }

  // 使用熔断器执行
  for (let i = 0; i < 10; i++) {
    try {
      const result = await breaker.execute(unreliableService);
      console.log(`第${i + 1}次: ${result}`);
    } catch (err) {
      console.log(`第${i + 1}次: 失败 - ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('最终状态:', breaker.getStatus());
}
```

---

## 6. 进程与集群管理

### 6.1 PM2进程管理器

```javascript
/**
 * PM2进程管理最佳实践
 * PM2是Node.js生产环境的首选进程管理器
 */

// ecosystem.config.js - PM2配置文件
module.exports = {
  apps: [{
    name: 'my-app',                    // 应用名称
    script: './dist/server.js',        // 入口脚本
    instances: 'max',                  // 实例数量 ('max' = CPU核心数)
    exec_mode: 'cluster',              // 集群模式
    watch: false,                      // 开发环境开启
    ignore_watch: ['node_modules', 'logs'],
    max_memory_restart: '1G',         // 内存超过1G时重启
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    error_file: './logs/error.log',    // 错误日志
    out_file: './logs/out.log',        // 输出日志
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,                  // 多实例合并日志
    autorestart: true,                 // 自动重启
    max_restarts: 10,                  // 最大重启次数
    min_uptime: '10s',                // 最小运行时间才认为成功
    listen_timeout: 8000,              // 启动超时
    shutdown_with_message: true,       // 使用SIGTERM而非SIGKILL
    // 健康检查
    health_check_grace_period: 3000,
    // 重启策略
    restart_delay: 4000,               // 重启延迟
    exp_backoff_restart_delay: 100,   // 指数退避重启延迟
  }, {
    // 第二个应用示例（后台任务）
    name: 'my-worker',
    script: './workers/processor.js',
    instances: 2,
    exec_mode: 'fork',
    cron_restart: '0 3 * * *',       // 每天凌晨3点重启
    schedule_restart: true
  }]
};

// 启动命令
// pm2 start ecosystem.config.js
// pm2 start ecosystem.config.js --env production

// 常用PM2命令
// pm2 list                 - 列出所有进程
// pm2 monit                - 监控面板
// pm2 logs                 - 查看日志
// pm2 restart all          - 重启所有进程
// pm2 reload all           - 0秒重启（集群模式）
// pm2 stop all             - 停止所有进程
// pm2 delete all           - 删除所有进程
// pm2 save                 - 保存当前进程列表
// pm2 resurrect            - 从保存的列表恢复进程
// pm2 startup              - 生成启动脚本（系统启动时自动运行）
```

### 6.2 零重启部署

```javascript
/**
 * 使用PM2实现零重启部署（graceful reload）
 */

// 优雅关闭服务器
const http = require('http');

let isShuttingDown = false;

const server = http.createServer((req, res) => {
  if (isShuttingDown) {
    res.writeHead(503, { 'Content-Type': 'text/plain' });
    res.end('服务正在重启，请稍后重试');
    return;
  }

  // 正常处理请求
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', pid: process.pid }));
});

/**
 * 优雅关闭函数
 * 确保所有请求处理完毕后再退出
 */
async function gracefulShutdown(signal) {
  console.log(`收到 ${signal} 信号，开始优雅关闭...`);
  isShuttingDown = true;

  // 设置关闭超时
  const forceExitTimeout = setTimeout(() => {
    console.error('优雅关闭超时，强制退出');
    process.exit(1);
  }, 30000);

  try {
    // 1. 停止接收新连接
    await new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('HTTP服务器已关闭');

    // 2. 关闭数据库连接
    // await db.close();
    console.log('数据库连接已关闭');

    // 3. 关闭Redis连接
    // await redis.quit();
    console.log('Redis连接已关闭');

    // 4. 保存关键状态
    // await saveState();
    console.log('状态已保存');

    // 5. 关闭日志
    // await logger.close();
    console.log('日志已刷新');

    clearTimeout(forceExitTimeout);
    console.log('优雅关闭完成');
    process.exit(0);

  } catch (err) {
    console.error('优雅关闭失败:', err);
    clearTimeout(forceExitTimeout);
    process.exit(1);
  }
}

// 注册信号处理器
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 捕获未处理异常
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});

server.listen(3000, () => {
  console.log(`服务器运行中，PID: ${process.pid}`);
});
```

---

## 7. 实战面试题

### 面试题1：事件循环执行顺序

```javascript
// 面试题：预测以下代码的输出顺序
console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve().then(() => {
  console.log('3');
  Promise.resolve().then(() => console.log('4'));
});

process.nextTick(() => console.log('5'));

setImmediate(() => console.log('6'));

console.log('7');

// 答案：1 → 7 → 5 → 3 → 4 → 6 → 2
// 解析：
// 1. 同步代码：1, 7
// 2. nextTick：5
// 3. Promise微任务：3, 4（3执行后产生新微任务4）
// 4. setImmediate：6（check阶段）
// 5. setTimeout：2（timers阶段）
```

### 面试题2：内存泄漏诊断

```javascript
// 面试题：以下代码存在什么问题？如何修复？

function createCache() {
  const cache = {};

  return {
    set: (key, value) => { cache[key] = value; },
    get: (key) => cache[key],
    clear: () => { cache = {}; } // 错误：无法重新赋值const变量
  };
}

// 修复方案
function createFixedCache() {
  const cache = new Map(); // 使用Map替代对象

  return {
    set: (key, value) => { cache.set(key, value); },
    get: (key) => cache.get(key),
    clear: () => { cache.clear(); }, // 正确：调用clear方法
    delete: (key) => { cache.delete(key); }
  };
}
```

### 面试题3：Worker Threads应用场景

```javascript
// 面试题：什么场景下应该使用Worker Threads？什么场景不应该使用？

// 应该使用Worker Threads的场景：
// 1. CPU密集型计算（加密、压缩、图像处理）
// 2. 大数据处理（数据分析、批处理）
// 3. 需要保持主线程响应性的操作

// 不应该使用Worker Threads的场景：
// 1. I/O密集型任务（网络请求、文件读写）- 已有异步API
// 2. 轻量级任务（创建Worker的开销可能大于任务本身）
// 3. 需要大量共享数据的任务（Worker间通信开销大）
// 4. 频繁的小任务（上下文切换开销）

// 示例：判断是否值得使用Worker
function shouldUseWorker(computationTimeMs, transferTimeMs) {
  const workerStartupTime = 50; // Worker启动开销约50ms
  const overheadEstimate = workerStartupTime + transferTimeMs;

  return computationTimeMs > overheadEstimate;
}
```

---

## 总结

Node.js性能优化与并发处理的核心要点：

1. **事件循环优化**：避免阻塞、正确使用微任务、合理分片
2. **内存管理**：识别泄漏场景、使用工具监控、及时清理
3. **CPU密集型**：Worker Threads、集群模式、任务分片
4. **连接池**：合理配置池大小、超时处理、连接复用
5. **限流熔断**：保护系统、防止级联故障、自动恢复
6. **进程管理**：PM2、优雅关闭、零重启部署

掌握这些技术，能够构建高性能、高可用的Node.js服务。
