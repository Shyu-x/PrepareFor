# Node.js性能优化与调优

## 目录

1. [Node.js性能概述](#1-nodejs性能概述)
2. [内存管理与优化](#2-内存管理与优化)
3. [CPU性能优化](#3-cpu性能优化)
4. [I/O性能优化](#4-io性能优化)
5. [进程管理与集群](#5-进程管理与集群)
6. [性能监控与诊断](#6-性能监控与诊断)
7. [面试高频问题](#7-面试高频问题)

---

## 1. Node.js性能概述

### 1.1 Node.js架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Node.js架构图                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Node.js 应用                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                   │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Node.js Bindings                   │   │
│  │              (C++绑定层，连接JS和底层)               │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                   │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                     V8 引擎                          │   │
│  │          (JavaScript执行引擎，JIT编译)               │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                   │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    libuv                             │   │
│  │        (跨平台异步I/O库，事件循环实现)               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 事件循环机制

```javascript
// Node.js事件循环阶段

/*
┌─────────────────────────────────────────────────────────────┐
│                     事件循环阶段                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│    ┌───────────────────────┐                               │
│   ┌>│        timers         │<─────────────────────┐       │
│   │ └───────────┬───────────┘                      │       │
│   │             │                                  │       │
│   │             ▼                                  │       │
│   │  ┌───────────────────────┐                     │       │
│   │  │   pending callbacks   │                     │       │
│   │  └───────────┬───────────┘                     │       │
│   │             │                                  │       │
│   │             ▼                                  │       │
│   │  ┌───────────────────────┐                     │       │
│   │  │       idle, prepare   │                     │       │
│   │  └───────────┬───────────┘                     │       │
│   │             │                                  │       │
│   │             ▼                                  │       │
│   │  ┌───────────────────────┐                     │       │
│   │  │         poll          │<─────┐              │       │
│   │  └───────────┬───────────┘      │              │       │
│   │             │                   │              │       │
│   │             ▼                   │              │       │
│   │  ┌───────────────────────┐      │              │       │
│   │  │        check          │──────┘              │       │
│   │  └───────────┬───────────┘                     │       │
│   │             │                                  │       │
│   │             ▼                                  │       │
│   │  ┌───────────────────────┐                     │       │
│   └──│    close callbacks    │                     │       │
│      └───────────────────────┘                     │       │
│                                                    │       │
└─────────────────────────────────────────────────────────────┘
*/

// 事件循环示例
const fs = require('fs');

// timers阶段
setTimeout(() => {
  console.log('setTimeout');
}, 0);

// poll阶段 - I/O回调
fs.readFile(__filename, () => {
  console.log('readFile');

  // check阶段
  setImmediate(() => {
    console.log('setImmediate');
  });
});

// 微任务（每个阶段后执行）
Promise.resolve().then(() => {
  console.log('Promise');
});

// process.nextTick（微任务之前）
process.nextTick(() => {
  console.log('nextTick');
});

// 输出顺序: nextTick -> Promise -> setTimeout -> readFile -> setImmediate
```

---

## 2. 内存管理与优化

### 2.1 V8内存管理

```javascript
// V8内存结构

/*
┌─────────────────────────────────────────────────────────────┐
│                     V8内存结构                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   新生代 (New Space)                 │   │
│  │                    ~32MB (64位系统)                  │   │
│  │  ┌─────────────┐    ┌─────────────┐                 │   │
│  │  │  From Space │◄──►│  To Space   │                 │   │
│  │  │  (活动对象) │    │  (空闲空间) │                 │   │
│  │  └─────────────┘    └─────────────┘                 │   │
│  │           Scavenge算法 (复制算法)                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   老生代 (Old Space)                 │   │
│  │                   ~1.4GB (64位系统)                  │   │
│  │                                                     │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │              晋升的对象                      │   │   │
│  │  │     标记-清除-整理 (Mark-Sweep-Compact)     │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 大对象空间 (Large Object Space)      │   │
│  │              存放超过256KB的对象                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
*/

// 查看内存使用
console.log('内存使用:', process.memoryUsage());
/*
{
  rss: 35536896,        // 常驻内存
  heapTotal: 7159808,   // V8分配的堆内存总量
  heapUsed: 4435600,    // V8堆内存使用量
  external: 825192,     // C++对象占用的内存
  arrayBuffers: 9386    // ArrayBuffer和SharedArrayBuffer
}
*/

// 设置内存限制
// 默认: 64位系统约1.4GB，32位系统约700MB
// 可以通过启动参数调整: --max-old-space-size=4096

// 手动触发GC（仅调试用）
if (global.gc) {
  global.gc();
}
```

### 2.2 内存泄漏检测

```javascript
// 内存泄漏常见场景与检测

// 1. 全局变量泄漏
// ❌ 错误：意外创建全局变量
function leak() {
  bar = 'I am a global variable'; // 忘记var/let/const
}

// ✅ 正确：使用严格模式
'use strict';
function noLeak() {
  const bar = 'I am a local variable';
}

// 2. 闭包泄漏
// ❌ 错误：闭包持有大对象引用
function createClosure() {
  const largeData = new Array(1000000).fill('x');

  return function() {
    // 闭包持有largeData引用，导致无法释放
    return largeData.length;
  };
}

// ✅ 正确：只保留需要的数据
function createClosureFixed() {
  const largeData = new Array(1000000).fill('x');
  const length = largeData.length; // 只保存需要的值

  return function() {
    return length;
  };
}

// 3. 事件监听器泄漏
// ❌ 错误：重复添加监听器
class EventEmitter {
  constructor() {
    this.listeners = {};
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    this.listeners[event]?.forEach(cb => cb(data));
  }
}

// ✅ 正确：提供移除方法
class EventEmitterFixed {
  constructor() {
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    this.listeners.get(event)?.delete(callback);
  }

  removeAllListeners(event) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

// 4. 使用heapdump检测内存泄漏
const heapdump = require('heapdump');

// 生成堆快照
heapdump.writeSnapshot('/tmp/' + Date.now() + '.heapsnapshot', (err, filename) => {
  console.log('堆快照已保存:', filename);
});

// 5. 使用clinic.js诊断
// npm install -g clinic
// clinic doctor -- node app.js
// clinic heapprofiler -- node app.js
```

### 2.3 内存优化实践

```javascript
// 内存优化实践

// 1. 使用Buffer池
// ❌ 错误：频繁创建Buffer
function processBuffers() {
  const buffers = [];
  for (let i = 0; i < 10000; i++) {
    buffers.push(Buffer.alloc(1024)); // 每次分配新内存
  }
  return buffers;
}

// ✅ 正确：复用Buffer
function processBuffersOptimized() {
  const poolSize = 1024 * 10000;
  const pool = Buffer.allocUnsafe(poolSize);
  let offset = 0;

  return {
    getBuffer(size) {
      if (offset + size > poolSize) {
        offset = 0;
      }
      const buf = pool.slice(offset, offset + size);
      offset += size;
      return buf;
    }
  };
}

// 2. 对象池模式
class ObjectPool {
  constructor(factory, initialSize = 10) {
    this.factory = factory;
    this.pool = [];

    // 预创建对象
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  acquire() {
    return this.pool.pop() || this.factory();
  }

  release(obj) {
    // 重置对象状态
    if (typeof obj.reset === 'function') {
      obj.reset();
    }
    this.pool.push(obj);
  }
}

// 使用对象池
const connectionPool = new ObjectPool(() => ({
  socket: null,
  connected: false,
  reset() {
    this.socket = null;
    this.connected = false;
  }
}));

// 3. 流式处理大数据
const fs = require('fs');
const readline = require('readline');

// ❌ 错误：一次性读取大文件
async function processLargeFileWrong() {
  const data = await fs.promises.readFile('large.json', 'utf8');
  const json = JSON.parse(data); // 可能内存溢出
  return json;
}

// ✅ 正确：流式处理
async function processLargeFileCorrect() {
  const fileStream = fs.createReadStream('large.json');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    // 逐行处理，内存占用小
    processLine(line);
  }
}

// 4. 使用WeakMap避免内存泄漏
const privateData = new WeakMap();

class MyClass {
  constructor() {
    privateData.set(this, {
      secret: 'hidden data'
    });
  }

  getSecret() {
    return privateData.get(this).secret;
  }
}

// 当MyClass实例被垃圾回收时，WeakMap中的数据也会自动释放
```

---

## 3. CPU性能优化

### 3.1 避免阻塞事件循环

```javascript
// 避免阻塞事件循环

// 1. 同步操作阻塞
// ❌ 错误：同步读取文件
function readFileSync() {
  const data = fs.readFileSync('large.json', 'utf8');
  return JSON.parse(data);
}

// ✅ 正确：异步读取
async function readFileAsync() {
  const data = await fs.promises.readFile('large.json', 'utf8');
  return JSON.parse(data);
}

// 2. CPU密集型任务阻塞
// ❌ 错误：主线程执行CPU密集任务
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// 阻塞主线程
const result = fibonacci(45); // 可能阻塞数秒

// ✅ 正确：使用Worker Threads
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (isMainThread) {
  // 主线程
  function runFibonacci(n) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename, {
        workerData: n
      });

      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  }

  // 不阻塞主线程
  runFibonacci(45).then(console.log);
} else {
  // Worker线程
  const result = fibonacci(workerData);
  parentPort.postMessage(result);
}

// 3. 分片处理大任务
async function processLargeArray(array) {
  const CHUNK_SIZE = 1000;

  for (let i = 0; i < array.length; i += CHUNK_SIZE) {
    const chunk = array.slice(i, i + CHUNK_SIZE);

    // 处理分片
    processChunk(chunk);

    // 让出事件循环
    await new Promise(resolve => setImmediate(resolve));
  }
}

// 4. 使用setImmediate替代setTimeout(fn, 0)
// setImmediate在I/O事件之后执行，setTimeout在定时器阶段执行
setImmediate(() => {
  console.log('setImmediate');
});

setTimeout(() => {
  console.log('setTimeout');
}, 0);
```

### 3.2 代码优化技巧

```javascript
// 代码优化技巧

// 1. 优化循环
// ❌ 错误：每次循环都计算length
const arr = new Array(10000);
for (let i = 0; i < arr.length; i++) {
  // arr.length每次都要计算
}

// ✅ 正确：缓存length
for (let i = 0, len = arr.length; i < len; i++) {
  // len只计算一次
}

// ✅ 更好：使用for...of
for (const item of arr) {
  // 更简洁
}

// 2. 优化对象属性访问
// ❌ 错误：深层嵌套访问
function getNestedValue(obj) {
  return obj && obj.a && obj.a.b && obj.a.b.c;
}

// ✅ 正确：使用可选链
function getNestedValueOptimized(obj) {
  return obj?.a?.b?.c;
}

// 3. 优化JSON处理
// ❌ 错误：重复解析JSON
function processJson(jsonString) {
  const data = JSON.parse(jsonString);
  const data2 = JSON.parse(jsonString); // 重复解析
  return { ...data, ...data2 };
}

// ✅ 正确：只解析一次
function processJsonOptimized(jsonString) {
  const data = JSON.parse(jsonString);
  return { ...data, ...data }; // 复用解析结果
}

// 4. 使用Map代替Object（大量键值对时）
const obj = {};
const map = new Map();

// 添加100万个键值对
console.time('Object');
for (let i = 0; i < 1000000; i++) {
  obj['key' + i] = i;
}
console.timeEnd('Object');

console.time('Map');
for (let i = 0; i < 1000000; i++) {
  map.set('key' + i, i);
}
console.timeEnd('Map');

// Map通常更快，特别是频繁增删时

// 5. 使用Proxy进行惰性加载
function createLazyObject(loader) {
  return new Proxy({}, {
    get(target, prop) {
      if (!(prop in target)) {
        Object.assign(target, loader());
      }
      return target[prop];
    }
  });
}

// 只在访问属性时才加载数据
const lazyConfig = createLazyObject(() => {
  console.log('Loading config...');
  return {
    apiUrl: 'https://api.example.com',
    timeout: 5000
  };
});

console.log(lazyConfig.apiUrl); // 此时才加载
```

---

## 4. I/O性能优化

### 4.1 文件系统优化

```javascript
// 文件系统优化

const fs = require('fs');
const path = require('path');

// 1. 使用流处理大文件
// ❌ 错误：一次性读取
function copyFileWrong(src, dest) {
  const data = fs.readFileSync(src);
  fs.writeFileSync(dest, data);
}

// ✅ 正确：使用流
function copyFileCorrect(src, dest) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(src)
      .pipe(fs.createWriteStream(dest))
      .on('finish', resolve)
      .on('error', reject);
  });
}

// 2. 并行文件操作
async function readMultipleFiles(files) {
  // ❌ 错误：串行读取
  // const results = [];
  // for (const file of files) {
  //   results.push(await fs.promises.readFile(file, 'utf8'));
  // }

  // ✅ 正确：并行读取
  const promises = files.map(file =>
    fs.promises.readFile(file, 'utf8')
  );
  return Promise.all(promises);
}

// 3. 使用文件系统缓存
class FileCache {
  constructor(ttl = 60000) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  async read(filePath) {
    const cached = this.cache.get(filePath);

    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }

    const data = await fs.promises.readFile(filePath, 'utf8');
    this.cache.set(filePath, {
      data,
      timestamp: Date.now()
    });

    return data;
  }

  invalidate(filePath) {
    this.cache.delete(filePath);
  }
}

// 4. 批量写入优化
class BatchWriter {
  constructor(filePath, batchSize = 100, flushInterval = 1000) {
    this.filePath = filePath;
    this.batchSize = batchSize;
    this.flushInterval = flushInterval;
    this.buffer = [];
    this.timer = null;

    this.stream = fs.createWriteStream(filePath, { flags: 'a' });
    this.startTimer();
  }

  write(data) {
    this.buffer.push(data);

    if (this.buffer.length >= this.batchSize) {
      this.flush();
    }
  }

  flush() {
    if (this.buffer.length === 0) return;

    const data = this.buffer.join('\n') + '\n';
    this.stream.write(data);
    this.buffer = [];
  }

  startTimer() {
    this.timer = setInterval(() => this.flush(), this.flushInterval);
  }

  close() {
    clearInterval(this.timer);
    this.flush();
    this.stream.end();
  }
}
```

### 4.2 网络优化

```javascript
// 网络优化

const http = require('http');
const https = require('https');
const { Agent } = http;

// 1. 连接池复用
// 默认每个域名最多5个连接
const httpAgent = new Agent({
  keepAlive: true,        // 保持连接
  keepAliveMsecs: 30000,  // 保持时间
  maxSockets: 50,         // 最大连接数
  maxFreeSockets: 10      // 最大空闲连接数
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50
});

// 使用Agent
const axios = require('axios');
const apiClient = axios.create({
  httpAgent,
  httpsAgent
});

// 2. 请求合并
class RequestBatcher {
  constructor(requestFn, delay = 100) {
    this.requestFn = requestFn;
    this.delay = delay;
    this.queue = [];
    this.timer = null;
  }

  add(params) {
    return new Promise((resolve, reject) => {
      this.queue.push({ params, resolve, reject });

      if (!this.timer) {
        this.timer = setTimeout(() => this.flush(), this.delay);
      }
    });
  }

  async flush() {
    const batch = this.queue;
    this.queue = [];
    this.timer = null;

    if (batch.length === 0) return;

    try {
      const params = batch.map(item => item.params);
      const results = await this.requestFn(params);

      batch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      batch.forEach(item => item.reject(error));
    }
  }
}

// 3. 响应缓存
class ResponseCache {
  constructor(ttl = 60000) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  async get(key, fetcher) {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    return data;
  }
}

// 4. 请求超时和重试
async function fetchWithRetry(url, options = {}, retries = 3) {
  const { timeout = 5000, ...fetchOptions } = options;

  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response;
    } catch (error) {
      if (i === retries - 1) throw error;

      // 指数退避
      await new Promise(resolve =>
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
}
```

---

## 5. 进程管理与集群

### 5.1 Cluster模块

```javascript
// Cluster集群模式

const cluster = require('cluster');
const os = require('os');

if (cluster.isPrimary) {
  // 主进程
  const cpuCount = os.cpus().length;

  console.log(`主进程 ${process.pid} 启动`);
  console.log(`CPU核心数: ${cpuCount}`);

  // 根据CPU核心数创建工作进程
  for (let i = 0; i < cpuCount; i++) {
    cluster.fork();
  }

  // 工作进程退出时重启
  cluster.on('exit', (worker, code, signal) => {
    console.log(`工作进程 ${worker.process.pid} 退出: ${code} ${signal}`);
    console.log('启动新的工作进程...');
    cluster.fork();
  });

  // 工作进程上线
  cluster.on('online', (worker) => {
    console.log(`工作进程 ${worker.process.pid} 上线`);
  });

} else {
  // 工作进程
  const express = require('express');
  const app = express();

  app.get('/', (req, res) => {
    res.send(`工作进程 ${process.pid} 处理请求`);
  });

  app.listen(3000, () => {
    console.log(`工作进程 ${process.pid} 监听端口 3000`);
  });
}
```

### 5.2 PM2进程管理

```javascript
// PM2配置文件 ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'my-app',
      script: './app.js',

      // 实例数量
      instances: 'max', // 或具体数字
      exec_mode: 'cluster', // 集群模式

      // 自动重启
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      max_memory_restart: '1G',

      // 环境变量
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 80
      },

      // 日志配置
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',

      // 重启策略
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 1000,

      // 健康检查
      instance_var: 'NODE_APP_INSTANCE',
      kill_timeout: 5000,
      listen_timeout: 3000,
      wait_ready: false
    }
  ],

  // 部署配置
  deploy: {
    production: {
      user: 'deploy',
      host: ['server1.example.com', 'server2.example.com'],
      ref: 'origin/main',
      repo: 'git@github.com:user/repo.git',
      path: '/var/www/my-app',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt-get install git -y'
    }
  }
};

// PM2常用命令
/*
# 启动应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 监控
pm2 monit

# 重载（零停机）
pm2 reload all

# 重启
pm2 restart all

# 停止
pm2 stop all

# 删除
pm2 delete all

# 保存进程列表
pm2 save

# 生成启动脚本
pm2 startup
*/
```

---

## 6. 性能监控与诊断

### 6.1 内置诊断工具

```javascript
// Node.js内置诊断工具

// 1. process.hrtime() 精确计时
const start = process.hrtime.bigint();

// 执行操作
doSomething();

const end = process.hrtime.bigint();
console.log(`耗时: ${Number(end - start) / 1e6} ms`);

// 2. performance API
const { performance, PerformanceObserver } = require('perf_hooks');

// 性能标记
performance.mark('start');

doSomething();

performance.mark('end');
performance.measure('操作耗时', 'start', 'end');

// 获取测量结果
const measure = performance.getEntriesByName('操作耗时')[0];
console.log(`耗时: ${measure.duration} ms`);

// 3. 性能观察者
const obs = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach((entry) => {
    console.log(`${entry.name}: ${entry.duration} ms`);
  });
});
obs.observe({ entryTypes: ['measure'] });

// 4. V8性能分析
// 启动时添加参数: node --prof app.js
// 处理结果: node --prof-process isolate-*.log > processed.txt

// 5. 内存快照
// 启动时添加参数: node --inspect app.js
// Chrome DevTools -> Memory -> Take heap snapshot

// 6. CPU分析
// 启动时添加参数: node --prof app.js
// 或使用 inspector
const inspector = require('inspector');
const fs = require('fs');

const session = new inspector.Session();
session.connect();

session.post('Profiler.enable', () => {
  session.post('Profiler.start', () => {
    // 执行需要分析的代码
    doSomething();

    session.post('Profiler.stop', (err, { profile }) => {
      if (!err) {
        fs.writeFileSync('./profile.cpuprofile', JSON.stringify(profile));
      }
    });
  });
});
```

### 6.2 APM监控

```javascript
// APM监控集成

// 1. 使用New Relic
// npm install newrelic
// 在入口文件最前面引入
require('newrelic');

// 2. 使用Prometheus + Grafana
const client = require('prom-client');

// 创建Registry
const register = new client.Registry();

// 默认指标
client.collectDefaultMetrics({ register });

// 自定义指标
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP请求耗时',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register]
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'HTTP请求总数',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// Express中间件
function metricsMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration.labels(req.method, route, res.statusCode).observe(duration);
    httpRequestsTotal.labels(req.method, route, res.statusCode).inc();
  });

  next();
}

// 暴露指标端点
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// 3. 健康检查端点
app.get('/health', (req, res) => {
  const memoryUsage = process.memoryUsage();
  const health = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    memory: {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
      rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB'
    }
  };

  // 检查内存是否过高
  if (memoryUsage.heapUsed > 500 * 1024 * 1024) {
    health.status = 'warning';
    health.message = '内存使用过高';
  }

  res.json(health);
});

// 4. 就绪检查
app.get('/ready', async (req, res) => {
  try {
    // 检查数据库连接
    await checkDatabaseConnection();

    // 检查Redis连接
    await checkRedisConnection();

    res.json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});
```

---

## 7. 面试高频问题

### 问题1：Node.js为什么适合I/O密集型应用？

**答案：**
1. 单线程事件循环，避免线程切换开销
2. 非阻塞I/O，高效处理并发请求
3. libuv提供跨平台异步I/O
4. V8引擎高性能JavaScript执行

### 问题2：如何处理CPU密集型任务？

**答案：**
1. 使用Worker Threads
2. 使用child_process
3. 拆分任务，分片执行
4. 使用消息队列异步处理

### 问题3：什么是内存泄漏？如何检测？

**答案：**
内存泄漏是指程序未能释放不再使用的内存。

检测方法：
1. 使用heapdump生成堆快照
2. 使用Chrome DevTools分析
3. 使用clinic.js诊断
4. 监控process.memoryUsage()

### 问题4：如何优化Node.js性能？

**答案：**
1. 避免阻塞事件循环
2. 使用流处理大数据
3. 实现缓存策略
4. 使用集群模式
5. 优化数据库查询
6. 使用连接池

### 问题5：Cluster和Worker Threads的区别？

**答案：**
| 方面 | Cluster | Worker Threads |
|------|---------|----------------|
| 进程 | 多进程 | 单进程多线程 |
| 内存 | 不共享 | 共享 |
| 通信 | IPC | 共享内存 |
| 启动成本 | 高 | 低 |
| 适用场景 | Web服务 | CPU密集任务 |

---

## 8. 最佳实践总结

### 8.1 性能优化清单

- [ ] 避免阻塞事件循环
- [ ] 使用异步I/O
- [ ] 实现缓存策略
- [ ] 使用连接池
- [ ] 流式处理大数据
- [ ] 使用集群模式
- [ ] 监控内存使用
- [ ] 定期性能分析

### 8.2 监控指标

| 指标 | 说明 | 阈值 |
|------|------|------|
| CPU使用率 | 进程CPU占用 | < 70% |
| 内存使用 | 堆内存使用量 | < 80% |
| 事件循环延迟 | 事件循环阻塞时间 | < 100ms |
| 请求响应时间 | HTTP请求耗时 | < 200ms |
| 错误率 | 请求失败比例 | < 1% |

---

*本文档最后更新于 2026年3月*