# Node.js 后端面试题完全指南

本文档汇总了30+道Node.js后端高频面试题，涵盖Node.js基础、主流框架、数据库、缓存、安全及微服务等核心知识领域。每道题都配有详细解答、代码示例和最佳实践建议，帮助开发者全面备战后端技术面试。

---

## 一、Node.js 基础

### 1.1 事件循环机制

#### 面试题1：请详细描述Node.js事件循环的工作原理

**参考答案**

Node.js的事件循环是其高性能的核心所在，它基于libuv库实现，负责处理所有异步I/O操作。事件循环分为多个阶段，每个阶段都有特定的任务队列。

**事件循环的六个阶段：**

```
   ┌─────────────────────────────┐
   │         timers（定时器）       │  执行 setTimeout() 和 setInterval() 的回调
   └─────────────────────────────┘
   ┌─────────────────────────────┐
   │    pending callbacks（待定   │  执行上一轮循环中未执行的I/O回调
   │         回调）               │
   └─────────────────────────────┘
   ┌─────────────────────────────┐
   │     idle, prepare（准备）     │  内部使用
   └─────────────────────────────┘
   ┌─────────────────────────────┐
   │         poll（轮询）          │  获取新的I/O事件，node在此暂停
   └─────────────────────────────┘
   ┌─────────────────────────────┐
   │         check（检查）         │  执行 setImmediate() 的回调
   └─────────────────────────────┘
   ┌─────────────────────────────┐
   │   close callbacks（关闭）    │  执行 close 事件回调，如 socket.on('close')
   └─────────────────────────────┘
```

**代码示例：**

```javascript
// 事件循环顺序示例
console.log('1 - 同步代码');  // 第一步：同步执行

setTimeout(() => {
  console.log('2 - setTimeout (timer)');  // 第四步：timers阶段
}, 0);

setImmediate(() => {
  console.log('3 - setImmediate (check)');  // 第三步：check阶段（与setTimeout取决于poll阶段）
});

process.nextTick(() => {
  console.log('4 - process.nextTick (优先级最高)');  // 第二步：在每个阶段之前执行
});

console.log('5 - 同步代码结束');  // 第一步：同步执行

// 输出顺序：
// 1 - 同步代码
// 5 - 同步代码结束
// 4 - process.nextTick (优先级最高)
// 2 - setTimeout (timer) 或 3 - setImmediate (check)（取决于系统资源）
```

**最佳实践：**

```javascript
// 1. 避免在setTimeout中执行重操作，会阻塞事件循环
// 错误示例
setTimeout(() => {
  // 复杂的同步计算
  for (let i = 0; i < 1000000000; i++) {
    result += Math.sqrt(i);
  }
}, 0);

// 正确做法：使用Worker Threads处理CPU密集型任务
const { Worker } = require('worker_threads');

function runWorker(workerData) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./heavy-task.js', { workerData });
    worker.on('message', resolve);
    worker.on('error', reject);
  });
}

// 2. 使用process.nextTick()在事件循环之前执行紧急任务
// 但不要滥用，会推迟I/O执行
database.connect()
  .then(() => {
    process.nextTick(() => {
      console.log('数据库已准备好接受查询');
    });
  });
```

---

#### 面试题2：setTimeout/setImmediate/process.nextTick的区别是什么？

**参考答案**

这三者虽然都是异步执行，但执行时机完全不同：

| 函数 | 执行时机 | 使用场景 |
|------|----------|----------|
| setTimeout | timers阶段（事件循环后期） | 延迟执行、周期执行 |
| setImmediate | check阶段（事件循环末期） | 立即执行，但晚于I/O回调 |
| process.nextTick | 每个阶段之前 | 紧急任务、异常处理 |

**代码示例：**

```javascript
// 1. setTimeout vs setImmediate
// 在I/O事件回调中，两者执行顺序固定
const fs = require('fs');

fs.readFile(__filename, () => {
  console.log('readFile callback');
  setTimeout(() => console.log('setTimeout'), 0);
  setImmediate(() => console.log('setImmediate'));
});
// 输出顺序：
// readFile callback
// setImmediate
// setTimeout

// 2. process.nextTick的优先级
Promise.resolve()
  .then(() => console.log('Promise.then'))
  .catch(() => console.log('Promise.catch'));

process.nextTick(() => console.log('nextTick'));
// 输出：
// nextTick
// Promise.then
// 原因：nextTick在每个阶段前立即执行，Promise.then在微任务队列中
```

**最佳实践：**

```javascript
// 最佳实践1：process.nextTick用于在同步代码完成但事件循环之前执行
class DatabaseConnection {
  constructor() {
    this.connected = false;
    process.nextTick(() => this.connect());
  }

  connect() {
    this.connected = true;
    console.log('数据库连接已建立');
  }
}

// 最佳实践2：使用setImmediate分离大量同步操作，避免阻塞
async function processLargeArray(items) {
  const batchSize = 1000;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    processBatch(batch);

    // 让出事件循环，下一轮再处理
    await new Promise(resolve => setImmediate(resolve));
  }
}
```

---

### 1.2 异步编程

#### 面试题3：Promise、async/await与回调函数有什么区别？如何避免回调地狱？

**参考答案**

回调函数是Node.js最早的异步处理方式，但容易形成"回调地狱"（Callback Hell）。Promise是ES6引入的异步编程解决方案，async/await则是Promise的语法糖，让异步代码看起来像同步代码。

**回调地狱示例：**

```javascript
// 回调地狱：多层嵌套，难以阅读和维护
fs.readFile('file1.txt', (err, data1) => {
  if (err) throw err;
  fs.readFile('file2.txt', (err, data2) => {
    if (err) throw err;
    fs.readFile('file3.txt', (err, data3) => {
      if (err) throw err;
      fs.writeFile('output.txt', data1 + data2 + data3, (err) => {
        if (err) throw err;
        console.log('完成');
      });
    });
  });
});
```

**Promise链式调用：**

```javascript
// Promise链式调用：更清晰，但错误处理需要小心
function readFilePromise(filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

readFilePromise('file1.txt')
  .then(data1 => readFilePromise('file2.txt').then(data2 => ({ data1, data2 })))
  .then(({ data1, data2 }) => readFilePromise('file3.txt'))
  .then(data3 => writeFilePromise('output.txt', data1 + data2 + data3))
  .then(() => console.log('完成'))
  .catch(err => console.error('发生错误:', err));
```

**async/await最佳方案：**

```javascript
// async/await：最清晰的异步处理方式
const fs = require('fs').promises;

async function processFiles() {
  try {
    const data1 = await fs.readFile('file1.txt');
    const data2 = await fs.readFile('file2.txt');
    const data3 = await fs.readFile('file3.txt');

    await fs.writeFile('output.txt', data1 + data2 + data3);
    console.log('完成');
  } catch (err) {
    console.error('发生错误:', err);
    throw err;
  }
}

// 并行执行优化
async function processFilesParallel() {
  try {
    // 同时发起三个读取操作
    const [data1, data2, data3] = await Promise.all([
      fs.readFile('file1.txt'),
      fs.readFile('file2.txt'),
      fs.readFile('file3.txt')
    ]);

    await fs.writeFile('output.txt', data1 + data2 + data3);
    console.log('完成');
  } catch (err) {
    console.error('发生错误:', err);
  }
}
```

**最佳实践：**

```javascript
// 1. 始终使用async/await，配合try-catch进行错误处理
async function fetchUserData(userId) {
  try {
    const user = await User.findById(userId);
    const posts = await Post.find({ author: userId });
    return { user, posts };
  } catch (error) {
    // 区分不同类型的错误
    if (error instanceof NotFoundError) {
      throw new UserNotFoundError(userId);
    }
    logger.error('获取用户数据失败', { userId, error });
    throw error;
  }
}

// 2. 使用Promise.all进行并行处理，提高性能
async function aggregateDashboard(userId) {
  const [user, stats, notifications, recommendations] = await Promise.all([
    getUser(userId),
    getUserStats(userId),
    getNotifications(userId),
    getRecommendations(userId)
  ]);

  return { user, stats, notifications, recommendations };
}

// 3. 谨慎使用Promise.allSettled，当部分失败不影响整体结果时
const results = await Promise.allSettled([
  fetchUser(1),
  fetchUser(2),
  fetchNonExistent(999)  // 这个会失败
]);

results.forEach((result, index) => {
  if (result.status === 'fulfilled') {
    console.log(`用户${index + 1}:`, result.value);
  } else {
    console.log(`用户${index + 1}失败:`, result.reason.message);
  }
});
```

---

#### 面试题4：Node.js中如何处理CPU密集型任务？

**参考答案**

Node.js擅长I/O密集型任务，但处理CPU密集型任务时需要特别处理，因为事件循环会被阻塞。解决方案包括：Worker Threads、Child Process、Cluster模式。

**Worker Threads方案：**

```javascript
// worker.js - Worker线程文件
const { parentPort, workerData } = require('worker_threads');

// 处理CPU密集型计算
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

function matrixMultiply(a, b) {
  const result = [];
  for (let i = 0; i < a.length; i++) {
    result[i] = [];
    for (let j = 0; j < b[0].length; j++) {
      let sum = 0;
      for (let k = 0; k < a[0].length; k++) {
        sum += a[i][k] * b[k][j];
      }
      result[i][j] = sum;
    }
  }
  return result;
}

// 主线程使用Worker
const { Worker } = require('worker_threads');

function runInWorker(workerPath, data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerPath, {
      workerData: data
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

// 计算质数示例
async function findPrimesInRange(start, end) {
  const worker = new Worker(`
    const { workerData, parentPort } = require('worker_threads');

    function isPrime(n) {
      if (n < 2) return false;
      for (let i = 2; i <= Math.sqrt(n); i++) {
        if (n % i === 0) return false;
      }
      return true;
    }

    const primes = [];
    for (let i = workerData.start; i <= workerData.end; i++) {
      if (isPrime(i)) primes.push(i);
    }

    parentPort.postMessage(primes);
  `, { workerData: { start, end } });

  return new Promise((resolve, reject) => {
    worker.on('message', resolve);
    worker.on('error', reject);
  });
}
```

**Child Process方案：**

```javascript
// 使用child_process执行系统命令
const { spawn } = require('child_process');

// 执行Python脚本（适合CPU密集型任务）
function runPythonScript(scriptPath, args) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [scriptPath, ...args]);

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Python script failed: ${errorOutput}`));
      }
    });
  });
}

// 使用cluster模块利用多核
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  const numCPUs = os.cpus().length;
  console.log(`启动 ${numCPUs} 个工作进程`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`工作进程 ${worker.process.pid} 退出`);
    // 重新启动崩溃的进程
    cluster.fork();
  });
} else {
  // 工作进程运行HTTP服务器
  const express = require('express');
  const app = express();

  app.get('/heavy', (req, res) => {
    // CPU密集型任务
    const result = computeHeavyTask();
    res.json({ result, worker: process.pid });
  });

  function computeHeavyTask() {
    let sum = 0;
    for (let i = 0; i < 1000000000; i++) {
      sum += Math.sqrt(i);
    }
    return sum;
  }

  app.listen(3000);
}
```

**最佳实践：**

```javascript
// 1. 根据任务类型选择方案
// CPU密集型：Worker Threads
// I/O密集型：普通async/await
// 系统级：Child Process

// 2. Worker线程池管理
class WorkerPool {
  constructor(workerPath, poolSize) {
    this.workers = [];
    this.tasks = [];
    this.workerPath = workerPath;
    this.poolSize = poolSize;
  }

  async init() {
    for (let i = 0; i < this.poolSize; i++) {
      this.workers.push(this.createWorker());
    }
  }

  createWorker() {
    return {
      worker: new Worker(this.workerPath),
      busy: false
    };
  }

  async executeTask(data) {
    return new Promise((resolve, reject) => {
      const task = { data, resolve, reject };

      const availableWorker = this.workers.find(w => !w.busy);
      if (availableWorker) {
        this.runTask(availableWorker, task);
      } else {
        this.tasks.push(task);
      }
    });
  }

  runTask(worker, task) {
    worker.busy = true;
    worker.worker.postMessage(task.data);

    const handler = (result) => {
      worker.worker.removeListener('message', handler);
      worker.busy = false;
      task.resolve(result);

      // 处理队列中的下一个任务
      if (this.tasks.length > 0) {
        const nextTask = this.tasks.shift();
        this.runTask(worker, nextTask);
      }
    };

    worker.worker.on('message', handler);
  }
}
```

---

### 1.3 模块系统

#### 面试题5：Node.js的模块加载机制是怎样的？require与import有什么区别？

**参考答案**

Node.js使用CommonJS模块系统，每个文件都是一个独立的作用域。require是同步加载，import是ES6的异步加载方式。Node.js对import有实验性支持，但推荐在生产环境中使用require或配置打包工具。

**模块加载机制：**

```javascript
// 模块加载流程
// 1. 解析模块路径
// 2. 判断模块类型（核心模块、文件模块、第三方模块）
// 3. 加载模块内容
// 4. 缓存模块
// 5. 返回导出对象

// 加载顺序：核心模块 > 第三方模块 > 文件模块

// 核心模块（Node.js内置）
const fs = require('fs');
const path = require('path');
const http = require('http');

// 第三方模块（node_modules）
const express = require('express');
const mongoose = require('mongoose');

// 文件模块（相对/绝对路径）
const myModule = require('./myModule');
const utils = require('../utils/helper');

// 模块解析路径
console.log(require.resolve('express'));
// 输出：/path/to/node_modules/express/index.js

// 模块路径查找
// 1. 检查是否为内置模块
// 2. 检查node_modules目录
// 3. 逐级向上查找
// 4. 抛出MODULE_NOT_FOUND错误
```

**require vs import：**

```javascript
// ============ require（CommonJS）============

// 基本导出
const fs = require('fs');

// 导出多个值
const { readFile, writeFile } = require('fs');

// 条件导出（运行时）
const isDev = process.env.NODE_ENV === 'development';
const logger = isDev ? require('./devLogger') : require('./prodLogger');

// 动态导入
async function loadModule() {
  const module = await import('./dynamicModule.js');
  module.default();
}

// ============ import（ES Module）============

// 默认导入
import fs from 'fs';

// 命名导入
import { readFile, writeFile } from 'fs';

// 导入所有
import * as fs from 'fs';

// 默认导出配合命名导出
import express, { Router } from 'express';

// 动态导入（返回Promise）
const module = await import('./module.js');

// ============ 混用注意事项 ============

// 在ESM中使用require
// 需要通过createRequire创建
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const myModule = require('./myModule.cjs');

// package.json中配置type字段
// "type": "module" - 所有.js文件作为ESM
// 无此字段或"type": "commonjs" - 作为CommonJS
```

**最佳实践：**

```javascript
// 1. 循环依赖处理
// a.js
exports.done = false;
const b = require('./b');
console.log('a.js中，b.done =', b.done);
exports.done = true;
console.log('a.js执行完毕');

// b.js
exports.done = false;
const a = require('./a');
console.log('b.js中，a.done =', a.done);
exports.done = true;
console.log('b.js执行完毕');

// main.js
const a = require('./a');
const b = require('./b');
console.log('main.js中，a.done =', a.done, 'b.done =', b.done);

// 输出：
// b.js中，a.done = false（a.js的exports.done尚未完成）
// b.js执行完毕
// a.js中，b.done = true
// a.js执行完毕
// main.js中，a.done = true, b.done = true
// 教训：循环依赖时，被依赖模块只能获取到部分导出

// 2. 合理的模块组织
// utils/logger.js
class Logger {
  constructor(level) {
    this.level = level;
  }

  log(message) { /* ... */ }
  error(message) { /* ... */ }
}

// 导出单个实例
module.exports = new Logger(process.env.LOG_LEVEL || 'info');

// 导出类（需要自己实例化）
module.exports.Logger = Logger;

// utils/index.js - 统一导出
const logger = require('./logger');
const config = require('./config');
const helpers = require('./helpers');

module.exports = {
  logger,
  config,
  ...helpers
};
```

---

## 二、Express 框架

### 2.1 核心概念

#### 面试题6：Express中间件的原理是什么？如何实现一个中间件？

**参考答案**

Express中间件是一种函数，位于请求-响应周期中间，可以访问请求对象(req)、响应对象(res)和下一个中间件函数(next)。中间件按照定义顺序执行，形成一个处理链。

**中间件的执行流程：**

```
请求 → [Middleware1] → [Middleware2] → [Route Handler] → 响应
              ↓              ↓              ↓
            next()         next()         (结束)
```

**中间件类型：**

```javascript
const express = require('express');
const app = express();

// 1. 应用级中间件（绑定到app对象）
app.use((req, res, next) => {
  console.log('时间:', Date.now());
  next();  // 必须调用next()将控制权传递给下一个中间件
});

// 2. 路由级中间件（绑定到express.Router()）
const router = express.Router();
router.use(authMiddleware);  // 该路由组的所有请求都会先经过authMiddleware
router.get('/users', handleGetUsers);

// 3. 错误处理中间件（4个参数）
app.use((err, req, res, next) => {
  console.error('错误:', err.message);
  res.status(err.status || 500).json({
    error: err.message || '服务器内部错误'
  });
});

// 4. 内置中间件
app.use(express.json());      // 解析JSON请求体
app.use(express.urlencoded({ extended: true }));  // 解析URL编码
app.use(express.static('public'));  // 静态文件服务

// 5. 第三方中间件
const morgan = require('morgan');  // HTTP日志
const helmet = require('helmet');  // 安全头
const cors = require('cors');      // 跨域资源共享

app.use(morgan('combined'));
app.use(helmet());
app.use(cors());
```

**自定义中间件实现：**

```javascript
// 1. 请求日志中间件
function requestLogger(req, res, next) {
  const start = Date.now();

  // 请求完成时的回调
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });

  next();
}

// 2. 认证中间件
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  // 将用户信息附加到请求对象
    next();
  } catch (err) {
    return res.status(401).json({ error: '无效的认证令牌' });
  }
}

// 3. 参数验证中间件工厂
function validateBody(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({
        error: '参数验证失败',
        details: error.details.map(d => d.message)
      });
    }

    next();
  };
}

// 使用示例
const Joi = require('joi');

const userSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

app.post('/users',
  validateBody(userSchema),
  async (req, res) => {
    // 这里可以安全地使用req.body
    const { username, email, password } = req.body;
    // 创建用户逻辑
    res.status(201).json({ username, email });
  }
);

// 4. 缓存中间件
function cacheMiddleware(duration) {
  const cache = new Map();

  return (req, res, next) => {
    const key = req.originalUrl;
    const cached = cache.get(key);

    if (cached && (Date.now() - cached.timestamp) < duration) {
      return res.json(cached.data);
    }

    // 拦截res.json方法
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      cache.set(key, { data, timestamp: Date.now() });
      return originalJson(data);
    };

    next();
  };
}
```

**最佳实践：**

```javascript
// 1. 中间件顺序很重要
app.use(helmet());                    // 安全头（最先）
app.use(cors());                      // 跨域
app.use(morgan('combined'));          // 日志
app.use(express.json());             // 请求体解析
app.use(authenticate);              // 认证
app.use('/api', apiRoutes);          // 路由

// 2. 错误处理中间件要放在所有路由之后
app.use((err, req, res, next) => {
  // 日志记录
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });

  // 区分开发环境和生产环境
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ error: '服务器内部错误' });
  } else {
    res.status(500).json({
      error: err.message,
      stack: err.stack
    });
  }
});

// 3. 使用next()或res.end()结束请求
// 避免双重响应
function ensureSingleResponse(req, res, next) {
  let responded = false;
  const originalJson = res.json.bind(res);

  res.json = (data) => {
    if (responded) {
      console.warn('尝试发送多个响应');
      return;
    }
    responded = true;
    return originalJson(data);
  };

  next();
}
```

---

### 2.2 路由与参数处理

#### 面试题7：Express中如何处理路由参数和查询字符串？

**参考答案**

Express提供多种方式获取客户端数据：路由参数（/:id）、查询字符串（?name=value）、请求体（POST/PUT）。每种方式都有不同的获取方法和适用场景。

**路由参数处理：**

```javascript
const express = require('express');
const app = express();

// 1. 路由参数（路径参数）
// GET /users/123
app.get('/users/:userId', (req, res) => {
  console.log(req.params.userId);  // "123"
  res.json({ userId: req.params.userId });
});

// 2. 多个路由参数
// GET /users/123/posts/456
app.get('/users/:userId/posts/:postId', (req, res) => {
  const { userId, postId } = req.params;
  res.json({ userId, postId });
});

// 3. 可选路由参数
// GET /users 或 GET /users/123
app.get('/users/:userId?', (req, res) => {
  if (req.params.userId) {
    res.json({ userId: req.params.userId });
  } else {
    res.json({ users: [] });
  }
});

// 4. 正则路由参数
// GET /flights/LAX-SFO
app.get('/flights/:from-:to', (req, res) => {
  console.log(req.params.from, req.params.to);  // "LAX" "SFO"
});

// 5. 路由参数验证中间件
function validateRouteParams(schema) {
  return (req, res, next) => {
    const errors = [];

    for (const [key, validator] of Object.entries(schema)) {
      const value = req.params[key];
      if (!validator(value)) {
        errors.push(`参数${key}无效: ${value}`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    next();
  };
}

const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

app.get('/users/:userId/posts/:postId',
  validateRouteParams({
    userId: (v) => ObjectId.isValid(v),
    postId: (v) => ObjectId.isValid(v)
  }),
  async (req, res) => {
    // 安全地使用params
  }
);
```

**查询字符串处理：**

```javascript
// GET /search?q=keyword&page=1&limit=10

// 1. 基本查询参数
app.get('/search', (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;

  console.log('搜索词:', q);
  console.log('页码:', page);
  console.log('每页数量:', limit);

  res.json({ q, page: Number(page), limit: Number(limit) });
});

// 2. 数组参数
// GET /items?tags=javascript&tags=node&tags=express
app.get('/items', (req, res) => {
  let { tags } = req.query;

  // 始终返回数组
  if (!tags) tags = [];
  else if (!Array.isArray(tags)) tags = [tags];

  console.log('标签:', tags);
  res.json({ tags });
});

// 3. 带结构的查询参数
// GET /users?filter[name]=john&filter[email]=gmail&sort=name&order=asc
app.get('/users', (req, res) => {
  const { filter = {}, sort, order = 'asc' } = req.query;

  // filter是字符串，需要解析
  let filterObj = {};
  if (filter) {
    filterObj = JSON.parse(filter);
  }

  res.json({ filterObj, sort, order });
});

// 更好的方式：使用第三方库解析复杂查询
const queryString = require('qs');

app.get('/users', (req, res) => {
  const { filter, sort, order } = queryString.parse(req.query, {
    ignoreQueryPrefix: true
  });

  res.json({ filter, sort, order });
});
```

**请求体处理：**

```javascript
// 需要中间件：app.use(express.json())

// POST /users 请求体: { "name": "张三", "email": "zhangsan@example.com" }
app.post('/users', (req, res) => {
  // 获取JSON请求体
  const { name, email } = req.body;

  // 验证必填字段
  if (!name || !email) {
    return res.status(400).json({
      error: '姓名和邮箱为必填项'
    });
  }

  res.status(201).json({ name, email });
});

// 文件上传（需要multer或其他中间件）
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// 单文件上传
app.post('/upload', upload.single('file'), (req, res) => {
  console.log(req.file);  // 文件信息
  console.log(req.body);  // 其他字段
  res.json({ filename: req.file.filename });
});

// 多文件上传
app.post('/uploads', upload.array('files', 5), (req, res) => {
  console.log(req.files);  // 文件数组
  res.json({ count: req.files.length });
});
```

**最佳实践：**

```javascript
// 1. 统一的参数获取中间件
function parseQueryParams(req, res, next) {
  // 将查询参数转换为适当的类型
  req.parsedQuery = {
    page: parseInt(req.query.page) || 1,
    limit: Math.min(parseInt(req.query.limit) || 20, 100),
    sort: req.query.sort || 'createdAt',
    order: ['asc', 'desc'].includes(req.query.order) ? req.query.order : 'desc'
  };
  next();
}

app.get('/users', parseQueryParams, async (req, res) => {
  const { page, limit, sort, order } = req.parsedQuery;
  // 使用参数进行数据库查询
});

// 2. RESTful路由设计
// 资源：users
// GET     /users          - 获取用户列表
// GET     /users/:id       - 获取单个用户
// POST    /users          - 创建用户
// PUT     /users/:id       - 更新用户（完整）
// PATCH   /users/:id       - 更新用户（部分）
// DELETE  /users/:id       - 删除用户

// 3. 版本化API路由
const v1 = express.Router();
const v2 = express.Router();

v1.get('/users', (req, res) => {
  res.json({ version: 'v1', users: [] });
});

v2.get('/users', (req, res) => {
  res.json({ version: 'v2', users: [], meta: {} });
});

app.use('/api/v1', v1);
app.use('/api/v2', v2);
```

---

## 三、Koa 框架

### 3.1 核心概念

#### 面试题8：Koa与Express相比有哪些优势和劣势？

**参考答案**

Koa是由Express团队打造的下一代Web框架，核心更小、更优雅。Koa使用async/await语法、级联式中间件（洋葱模型），而Express使用回调函数、线性中间件。

**核心区别对比：**

```javascript
// ============ Express vs Koa 语法对比 ============

// Express
const express = require('express');
const app = express();

app.get('/user/:id', (req, res) => {
  // 线性中间件，需要手动调用next()
  const id = req.params.id;

  User.findById(id)
    .then(user => {
      if (!user) {
        return res.status(404).json({ error: '用户不存在' });
      }
      res.json(user);
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
});

// Koa - 更简洁的async/await
const Koa = require('koa');
const Router = require('@koa/router');
const app = new Koa();
const router = new Router();

router.get('/user/:id', async (ctx) => {
  const user = await User.findById(ctx.params.id);

  if (!user) {
    ctx.throw(404, '用户不存在');
  }

  ctx.body = user;
});

app.use(router.routes());
```

**Koa洋葱模型：**

```javascript
// Koa中间件的洋葱模型
const Koa = require('koa');
const app = new Koa();

// 中间件1
app.use(async (ctx, next) => {
  console.log('1 - 请求前');
  await next();  // 等待下游中间件执行
  console.log('1 - 响应后');
});

// 中间件2
app.use(async (ctx, next) => {
  console.log('2 - 请求前');
  await next();
  console.log('2 - 响应后');
});

// 中间件3
app.use(async (ctx, next) => {
  console.log('3 - 请求前');
  ctx.body = 'Hello';
  // 没有调用next()，这里就是终点
  console.log('3 - 响应后');
});

// 执行顺序：
// 1 - 请求前
// 2 - 请求前
// 3 - 请求前
// 3 - 响应后
// 2 - 响应后
// 1 - 响应后
```

**错误处理对比：**

```javascript
// Express错误处理
app.get('/', (req, res, next) => {
  next(new Error('出错了');
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message
  });
});

// Koa错误处理
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = {
      message: err.message
    };
    ctx.app.emit('error', err, ctx);  // 触发app的error事件
  }
});

app.on('error', (err, ctx) => {
  // 集中处理错误，如日志记录
  logger.error('服务器错误', { err, path: ctx.path });
});
```

**Koa优势与劣势：**

```javascript
// ============ Koa 优势 ============

// 1. 更轻量，核心只有约1500行代码
// 2. 真正的async/await支持，无回调地狱
// 3. 洋葱模型便于统一处理请求和响应
// 4. ctx对象统一了request和response
// 5. 错误处理更优雅

// ============ Koa 劣势 ============

// 1. 生态不如Express丰富，需要手动配置很多中间件
// 2. 不支持ES5，需要Node.js 8+
// 3. 第三方中间件质量参差不齐
// 4. 学习曲线比Express陡峭

// ============ 选型建议 ============

// 使用Koa：需要高度定制、轻量级项目、团队技术栈较新
// 使用Express：需要稳定生态、快速开发、老项目维护
```

**最佳实践：**

```javascript
// Koa项目结构
const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const helmet = require('koa-helmet');
const logger = require('koa-logger');

const app = new Koa();

// 安全中间件
app.use(helmet());

// 日志中间件
app.use(logger());

// CORS中间件
app.use(cors());

// 请求体解析
app.use(bodyParser());

// 错误处理
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = {
      code: err.code || 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? '服务器内部错误'
        : err.message
    };

    // 触发错误日志
    ctx.app.emit('error', err, ctx);
  }
});

// 路由
const userRouter = new Router({ prefix: '/api/users' });
userRouter.get('/', listUsers);
userRouter.get('/:id', getUser);
userRouter.post('/', createUser);
userRouter.put('/:id', updateUser);
userRouter.delete('/:id', deleteUser);

app.use(userRouter.routes());
app.use(userRouter.allowedMethods());

// 404处理
app.use(async (ctx) => {
  ctx.status = 404;
  ctx.body = { message: '资源未找到' };
});

// 错误监听
app.on('error', (err, ctx) => {
  console.error('服务器错误:', err);
});

app.listen(3000);
```

---

## 四、NestJS 框架

### 4.1 核心概念

#### 面试题9：NestJS的依赖注入原理是什么？如何实现一个自定义Provider？

**参考答案**

NestJS使用依赖注入（DI）来管理组件间的依赖关系，通过IoC容器实现。依赖注入使代码更易测试、更松耦合。Provider是NestJS中最基本的概念，通过@Injectable()装饰器声明。

**依赖注入原理：**

```typescript
// ============ 基础依赖注入示例 ============

// user.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()  // 声明为可注入的服务
export class UserService {
  private users: User[] = [];

  async findAll(): Promise<User[]> {
    return this.users;
  }

  async findById(id: string): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async create(data: CreateUserDto): Promise<User> {
    const user: User = { id: Date.now().toString(), ...data };
    this.users.push(user);
    return user;
  }
}

// user.controller.ts
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  // 依赖注入：NestJS自动实例化UserService并注入
  constructor(private readonly userService: UserService) {}

  @Get()
  async getUsers() {
    return this.userService.findAll();
  }

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.userService.findById(id);
  }
}

// user.module.ts
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [UserService],  // 声明为Provider
  exports: [UserService]      // 导出供其他模块使用
})
export class UserModule {}
```

**自定义Provider：**

```typescript
// ============ 多种Provider类型 ============

// 1. 类Provider（最常用）
@Module({
  providers: [UserService]
})

// 2. 值Provider（注入常量）
const CONFIG = {
  apiKey: 'xxx',
  apiUrl: 'https://api.example.com'
};

@Module({
  providers: [
    {
      provide: 'CONFIG',
      useValue: CONFIG
    }
  ]
})

// 使用
constructor(
  @Inject('CONFIG') private config: typeof CONFIG
) {}

// 3. 工厂Provider（注入动态计算的值）
@Module({
  providers: [
    {
      provide: 'DATABASE_CONNECTION',
      inject: [DatabaseService],
      useFactory: async (db: DatabaseService) => {
        const connection = await db.connect();
        return connection;
      }
    }
  ]
})

// 4. 别名Provider
@Module({
  providers: [
    UserService,
    {
      provide: 'AliasedUserService',
      useExisting: UserService  // 引用同一个实例
    }
  ]
})

// 5. 类Provider（useClass）
// 相当于 providers: [UserService]
{
  provide: UserService,
  useClass: UserService
}

// 6. 非类Provider标记
{
  provide: 'USER_REPOSITORY',
  useClass: TypeOrmUserRepository
}
```

**高级用法：**

```typescript
// ============ 可选依赖 ============

import { Optional } from '@nestjs/common';

constructor(
  @Optional() @Inject('CACHE') private cacheService: CacheService
) {
  // cacheService可能为undefined
}

// ============ 属性注入（不推荐） ============
// 某些情况下无法使用构造器注入时使用

@Injectable()
export class UserService {
  @Inject('CONFIG') private config;
}

// ============ 自定义装饰器获取Provider ============

import { createParamDecorator } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);

// 使用
@Get('/profile')
getProfile(@CurrentUser() user: User) {
  return user;
}
```

**最佳实践：**

```typescript
// 1. 模块化设计
// user.module.ts
@Module({
  imports: [DatabaseModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule {}

// app.module.ts
@Module({
  imports: [UserModule, AuthModule, ProductModule]
})
export class AppModule {}

// 2. 全局模块（在整个应用中共享）
@Module({
  providers: [ConfigService],
  exports: [ConfigService]
})
export class ConfigModule {}

// app.module.ts
@Module({
  imports: [ConfigModule]
})
export class AppModule {}

// 或者直接全局
@Module({
  providers: [ConfigService],
  exports: [ConfigService]
})
export class ConfigModule {
  constructor() {}
}

// 在需要的地方直接注入

// 3. 动态模块（可配置的模块）
@Module({})
export class DatabaseModule {
  static forRoot(options: DatabaseOptions): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        {
          provide: 'DATABASE_OPTIONS',
          useValue: options
        },
        DatabaseService
      ],
      exports: [DatabaseService]
    };
  }
}

// 使用
@Module({
  imports: [DatabaseModule.forRoot({ host: 'localhost', port: 5432 })]
})
export class AppModule {}
```

---

### 4.2 装饰器与拦截器

#### 面试题10：NestJS中有哪些常用装饰器？拦截器、守卫、管道的作用是什么？

**参考答案**

NestJS基于装饰器和元编程，提供了丰富的装饰器来实现各种功能。拦截器用于处理响应，守卫用于权限验证，管道用于数据验证和转换。

**常用装饰器：**

```typescript
// ============ 类装饰器 ============

@Controller('users')           // 定义控制器
@Injectable()                  // 定义为可注入服务
@Module({})                    // 定义模块
@Catch()                       // 定义异常过滤器

// ============ 方法装饰器 ============

@Get(':id')                    // HTTP方法装饰器
@Post()
@Put()
@Delete()
@Patch()
@Options()
@Head()

@All()                         // 处理所有HTTP方法

@HttpCode(HttpStatus.OK)       // 自定义响应码
@Header('Cache-Control', 'none') // 自定义响应头
@Redirect('https://google.com', 301) // 重定向
@SetMetadata('roles', ['admin'])   // 设置元数据

// ============ 参数装饰器 ============

@Param(param?: string)         // 路由参数
@Query(param?: string)         // 查询参数
@Body(param?: string)          // 请求体
@Headers(param?: string)       // 请求头
@Cookie(name?: string)         // Cookie

@Req()                         // 请求对象
@Res()                         // 响应对象
@Next()                        // next函数

@Principal()                   // 用户主体（通常配合认证使用）
@Principal(IsAdmin)            // 带验证的主体

// ============ 自定义装饰器 ============

// 提取请求中的用户信息
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  }
);

// 使用
@Get('/profile')
getProfile(@CurrentUser() user: User) {}

// 获取特定字段
@Get('/profile')
getProfile(@CurrentUser('id') userId: string) {}

// ============ 组合装饰器 ============

// 认证装饰器
export const Authenticated = () => applyDecorators(
  UseGuards(AuthGuard),
  SetMetadata('isPublic', false)
);

// 使用
@Get('/protected')
@Authenticated()
getProtectedData() {}
```

**守卫（Guard）：**

```typescript
// ============ 守卫用于权限验证 ============

// roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    return requiredRoles.some(role => user.roles.includes(role));
  }
}

// roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// 使用
@Get(':id')
@Roles('admin', 'moderator')
async getUser(@Param('id') id: string) {}

// 在模块中注册
@Module({
  providers: [RolesGuard]
})
export class AppModule {}
```

**拦截器（Interceptor）：**

```typescript
// ============ 拦截器用于统一处理响应 ============

// logging.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const now = Date.now();

    return next
      .handle()
      .pipe(
        tap(() => {
          const response = context.switchToHttp().getResponse();
          console.log(`${method} ${url} ${response.statusCode} - ${Date.now() - now}ms`);
        })
      );
  }
}

// transform.interceptor.ts - 统一响应格式
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => ({
        code: 0,
        message: 'success',
        data
      }))
    );
  }
}

// cache.interceptor.ts - 缓存拦截器
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private cache = new Map();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const key = request.originalUrl;

    if (this.cache.has(key)) {
      return of(this.cache.get(key));
    }

    return next.handle().pipe(
      tap(data => {
        this.cache.set(key, data);
      })
    );
  }
}

// 使用拦截器
@UseInterceptors(LoggingInterceptor)
export class UserController {}
```

**管道（Pipe）：**

```typescript
// ============ 管道用于数据验证和转换 ============

// validation.pipe.ts
import { Injectable, PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ObjectSchema } from 'joi';

@Injectable()
export class JoiValidationPipe implements PipeTransform {
  constructor(private schema: ObjectSchema) {}

  transform(value: any, metadata: ArgumentMetadata) {
    const { error } = this.schema.validate(value);

    if (error) {
      throw new BadRequestException(error.details[0].message);
    }

    return value;
  }
}

// parse-int.pipe.ts - 类型转换
@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {
    const val = parseInt(value, 10);

    if (isNaN(val)) {
      throw new BadRequestException('参数必须是有效的整数');
    }

    return val;
  }
}

// 使用
@Get(':id')
async getUser(@Param('id', new ParseIntPipe()) id: number) {
  return this.userService.findById(id);
}

// 内置管道
import { ValidationPipe, ParseUUIDPipe, DefaultValuePipe } from '@nestjs/common';

@Post()
async createUser(
  @Body(new ValidationPipe({ transform: true })) createUserDto: CreateUserDto
) {}

// 带默认值的查询参数
@Get()
async getUsers(
  @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number
) {}
```

**最佳实践：**

```typescript
// 1. 全局拦截器和管道
// main.ts
app.useGlobalInterceptors(new LoggingInterceptor());
app.useGlobalInterceptors(new TransformInterceptor());
app.useGlobalPipes(new ValidationPipe({ transform: true }));

// 2. 异常过滤器处理不同错误
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();

    response.status(status).json({
      code: status,
      message: exception.message
    });
  }
}

// 3. 使用class-validator进行声明式验证
import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';

class CreateUserDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  bio?: string;
}
```

---

## 五、数据库

### 5.1 索引与查询优化

#### 面试题11：如何优化SQL查询性能？索引的原理是什么？

**参考答案**

数据库索引是帮助高效获取数据的数据结构，类似于书的目录。常见的索引类型包括B-Tree索引（默认）、Hash索引、全文索引等。合理的索引可以大幅提升查询性能，但过多索引会增加写操作开销。

**索引原理：**

```sql
-- B-Tree索引结构（平衡多叉树）
-- 适合范围查询、排序查询

-- 创建单列索引
CREATE INDEX idx_user_email ON users(email);

-- 创建复合索引（最左前缀原则）
CREATE INDEX idx_user_name_age ON users(name, age);

-- 创建唯一索引
CREATE UNIQUE INDEX idx_user_phone ON users(phone);

-- 创建全文索引
CREATE FULLTEXT INDEX idx_article_content ON articles(content);

-- 索引使用示例
-- 查询会使用索引
SELECT * FROM users WHERE name = '张三';           -- 使用idx_user_name_age
SELECT * FROM users WHERE name = '张三' AND age = 25;  -- 使用idx_user_name_age

-- 查询不会使用索引（违反最左前缀）
SELECT * FROM users WHERE age = 25;  -- 不使用idx_user_name_age
SELECT * FROM users WHERE age = 25 AND name = '张三';  -- 不使用idx_user_name_age
```

**查询优化技巧：**

```sql
-- 1. 使用EXPLAIN分析查询
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';

-- 2. 避免SELECT *
SELECT id, name, email FROM users WHERE id = 1;

-- 3. 使用JOIN代替子查询
-- 低效
SELECT * FROM orders WHERE user_id IN (
  SELECT id FROM users WHERE created_at > '2024-01-01'
);

-- 高效
SELECT o.* FROM orders o
INNER JOIN users u ON o.user_id = u.id
WHERE u.created_at > '2024-01-01';

-- 4. 使用LIMIT限制结果集
SELECT id, name FROM users LIMIT 100;

-- 5. 分页优化
-- 低效：OFFSET过大时性能差
SELECT * FROM users ORDER BY id LIMIT 1000000, 10;

-- 高效：使用游标分页
SELECT * FROM users WHERE id > 1000000 ORDER BY id LIMIT 10;

-- 6. 避免LIKE以%开头
-- 低效
SELECT * FROM users WHERE name LIKE '%三%';

-- 高效
SELECT * FROM users WHERE name LIKE '张三%';
```

**Node.js中的数据库优化：**

```javascript
// 使用连接池
const { Pool } = require('pg');

const pool = new Pool({
  max: 20,           // 最大连接数
  idleTimeoutMillis: 30000,  // 空闲超时
  connectionTimeoutMillis: 2000,  // 连接超时
});

// 查询
async function getUserByEmail(email) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  } finally {
    client.release();  // 重要：释放连接回池
  }
}

// 使用 prepared statements
const query = {
  name: 'get-user-by-email',
  text: 'SELECT * FROM users WHERE email = $1',
  values: ['test@example.com']
};

const result = await pool.query(query);

// ORM中的索引使用
// Sequelize
const User = sequelize.define('user', {
  name: Sequelize.STRING,
  email: { type: Sequelize.STRING, unique: true }
}, {
  indexes: [
    { fields: ['name', 'age'] },  // 复合索引
    { fields: ['created_at'] }     // 时间排序索引
  ]
});

// TypeORM
@Entity('users')
@Index(['name', 'age'])      // 复合索引
@Index(['email'], { unique: true })  // 唯一索引
export class User {
  @Column()
  name: string;

  @Column({ unique: true })
  email: string;
}
```

**最佳实践：**

```sql
-- 1. 定期分析表
ANALYZE TABLE users;

-- 2. 使用慢查询日志找出问题查询
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- 3. 避免过多索引
-- 每个索引都会增加写操作的开销
-- 定期清理无用索引
SELECT * FROM mysql.innodb_index_stats WHERE stat_value = 0;

-- 4. 覆盖索引（Using index）
-- 查询只需要索引中的数据，不需要回表
CREATE INDEX idx_user_name ON users(name);
SELECT name FROM users WHERE name LIKE '张%';  -- Using index
```

---

### 5.2 事务处理

#### 面试题12：什么是数据库事务？ACID特性是什么？如何处理嵌套事务？

**参考答案**

事务是数据库管理系统执行过程中的一个逻辑单位，由一系列操作组成。ACID是事务的四个基本特性：原子性（Atomicity）、一致性（Consistency）、隔离性（Isolation）、持久性（Durability）。

**ACID特性详解：**

```sql
-- 事务示例：转账
START TRANSACTION;

UPDATE accounts SET balance = balance - 1000 WHERE id = 1;
UPDATE accounts SET balance = balance + 1000 WHERE id = 2;

-- 如果出错回滚
-- ROLLBACK;

-- 成功提交
COMMIT;
```

**事务隔离级别：**

```sql
-- 查看当前隔离级别
SELECT @@tx_isolation;

-- 设置隔离级别
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- 隔离级别（从低到高）：
-- 1. READ UNCOMMITTED - 最低，可能产生脏读
-- 2. READ COMMITTED - 只能读取已提交的数据
-- 3. REPEATABLE READ - 同一事务中多次读取结果一致（默认）
-- 4. SERIALIZABLE - 最高，完全串行执行
```

**Node.js中的事务处理：**

```javascript
// PostgreSQL事务
const { Pool } = require('pg');
const pool = new Pool();

// 自动提交事务
async function transfer(fromId, toId, amount) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');  // 开始事务

    // 扣款
    await client.query(
      'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
      [amount, fromId]
    );

    // 检查余额
    const result = await client.query(
      'SELECT balance FROM accounts WHERE id = $1',
      [fromId]
    );

    if (result.rows[0].balance < 0) {
      throw new Error('余额不足');
    }

    // 加款
    await client.query(
      'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
      [amount, toId]
    );

    await client.query('COMMIT');  // 提交事务
  } catch (err) {
    await client.query('ROLLBACK');  // 回滚
    throw err;
  } finally {
    client.release();  // 释放连接
  }
}

// Savepoint（保存点）处理嵌套事务
async function complexOperation() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 操作1
    await client.query('INSERT INTO orders ...');

    // 设置保存点
    await client.query('SAVEPOINT sp1');

    try {
      // 操作2（可能失败）
      await client.query('INSERT INTO order_items ...');
    } catch (err) {
      // 回滚到保存点
      await client.query('ROLLBACK TO SAVEPOINT sp1');
      console.log('操作2失败，已回滚到保存点');
    }

    // 操作3（继续执行）
    await client.query('UPDATE orders SET status ...');

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
```

**ORM中的事务处理：**

```javascript
// Sequelize事务
const { sequelize, User, Account } = require('./models');

async function transfer(fromId, toId, amount) {
  return sequelize.transaction(async (t) => {
    const fromAccount = await Account.findByPk(fromId, { transaction: t });
    fromAccount.balance -= amount;
    await fromAccount.save({ transaction: t });

    const toAccount = await Account.findByPk(toId, { transaction: t });
    toAccount.balance += amount;
    await toAccount.save({ transaction: t });

    // 事务会自动提交，失败自动回滚
  });
}

// TypeORM事务
import { getConnection } from 'typeorm';

async function transfer(fromId: string, toId: string, amount: number) {
  await getConnection().transaction(async manager => {
    await manager.query(`
      UPDATE account SET balance = balance - $1 WHERE id = $2
    `, [amount, fromId]);

    await manager.query(`
      UPDATE account SET balance = balance + $1 WHERE id = $2
    `, [amount, toId]);
  });
}

// NestJS中配合事务装饰器
@Injectable()
export class TransferService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @InjectDataSource()
    private dataSource: DataSource
  ) {}

  @Transaction()
  async transfer(fromId: string, toId: string, amount: number) {
    await this.accountRepository.decrement({ id: fromId }, 'balance', amount);
    await this.accountRepository.increment({ id: toId }, 'balance', amount);
  }
}
```

**最佳实践：**

```javascript
// 1. 事务尽量简短，减少锁竞争
// 不好：事务中包含网络请求
async function badExample() {
  await query('BEGIN');
  await query('UPDATE accounts...');
  const user = await fetchUserFromExternalAPI();  // 慢！
  await query('UPDATE users...');
  await query('COMMIT');
}

// 好：将外部请求放在事务外
async function goodExample() {
  const externalData = await fetchUserFromExternalAPI();

  await query('BEGIN');
  await query('UPDATE accounts...');
  await query('UPDATE users...', [externalData]);
  await query('COMMIT');
}

// 2. 捕获特定错误进行回滚
async function withRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (err.code === '40001' && i < maxRetries - 1) {
        // 死锁错误，重试
        await sleep(100 * Math.pow(2, i));
        continue;
      }
      throw err;
    }
  }
}
```

---

## 六、Redis 缓存

### 6.1 数据结构与应用

#### 面试题13：Redis有哪些数据结构？分别在什么场景下使用？

**参考答案**

Redis提供了五种基本数据结构：String（字符串）、Hash（哈希）、List（列表）、Set（集合）、Zset（有序集合），以及四种高级数据结构：HyperLogLog、Bitmap、Geospatial、GEO。

**基本数据结构：**

```javascript
const redis = require('redis');
const client = redis.createClient();

async function demo() {
  // ============ String（字符串） ============
  // 场景：缓存、计数器、分布式锁

  await client.set('user:1', JSON.stringify({ name: '张三', age: 25 }));
  const user = JSON.parse(await client.get('user:1'));

  // 计数器
  await client.set('page:views:1', 0);
  await client.incr('page:views:1');  // 原子递增
  await client.incrby('page:views:1', 10);  // 递增指定值
  const views = await client.get('page:views:1');

  // 设置过期时间
  await client.set('token:123', 'abc', 'EX', 3600);  // 1小时后过期
  await client.setex('temp:data', 300, 'value');  // 5分钟后过期

  // ============ Hash（哈希） ============
  // 场景：存储对象、购物车

  await client.hset('user:2', 'name', '李四', 'email', 'li@example.com', 'age', '30');
  const user2 = await client.hgetall('user:2');
  // { name: '李四', email: 'li@example.com', age: '30' }

  await client.hincrby('user:2', 'age', 1);  // 年龄加1
  const age = await client.hget('user:2', 'age');

  // ============ List（列表） ============
  // 场景：消息队列、最新消息列表、任务队列

  await client.lpush('notifications', JSON.stringify({ type: 'like', id: 1 }));
  await client.lpush('notifications', JSON.stringify({ type: 'comment', id: 2 }));
  await client.lpush('notifications', JSON.stringify({ type: 'share', id: 3 }));

  const notifications = await client.lrange('notifications', 0, 9);  // 获取前10条

  // 实现队列
  await client.rpop('notifications');  // 取出最后一条

  // ============ Set（集合） ============
  // 场景：标签、关注关系、去重

  await client.sadd('tags:javascript', 'async', 'promise', 'nodejs');
  await client.sadd('tags:nodejs', 'express', 'koa', 'async');

  const allTags = await client.smembers('tags:javascript');
  const commonTags = await client.sinter('tags:javascript', 'tags:nodejs');  // 交集

  await client.sadd('user:1:followers', '2', '3', '4');
  const isFollowing = await client.sismember('user:1:followers', '2');  // 是否关注

  // ============ Zset（有序集合） ============
  // 场景：排行榜、权重排序、延迟队列

  await client.zadd('leaderboard', 100, 'player:1', 200, 'player:2', 150, 'player:3');

  const top3 = await client.zrevrange('leaderboard', 0, 2, 'WITHSCORES');
  // ['player:2', '200', 'player:3', '150', 'player:1', '100']

  await client.zincrby('leaderboard', 50, 'player:1');  // 增加分数

  // 获取排名
  const rank = await client.zrevrank('leaderboard', 'player:1');  // 0是最前面
}
```

**高级数据结构：**

```javascript
// ============ HyperLogLog（基数统计） ============
// 场景：UV统计、独立用户数

await client.pfadd('page:uv:2024-01-01', 'user:1', 'user:2', 'user:3');
await client.pfadd('page:uv:2024-01-01', 'user:1', 'user:4');  // user:1重复
const uv = await client.pfcount('page:uv:2024-01-01');  // 4

// 合并多天数据
await client.pfmerge('page:uv:week', 'page:uv:2024-01-01', 'page:uv:2024-01-02');

// ============ Bitmap（位图） ============
// 场景：签到、状态标记

// 用户1在2024年1月的签到情况
await client.setbit('sign:user:1:2024-01', 0, 1);  // 1号签到
await client.setbit('sign:user:1:2024-01', 5, 1);  // 6号签到

// 检查某天是否签到
const signed = await client.getbit('sign:user:1:2024-01', 0);

// 统计签到天数
await client.bitcount('sign:user:1:2024-01');

// ============ Geospatial（地理位置） ============
// 场景：附近的人、距离计算

await client.geoadd('stores', 116.404, 39.915, 'store:1');
await client.geoadd('stores', 116.416, 39.914, 'store:2');

const distance = await client.geodist('stores', 'store:1', 'store:2', 'km');
const nearby = await client.georadius('stores', 116.41, 39.91, 5, 'km', 'WITHDIST');
```

**最佳实践：**

```javascript
// 1. 合理设计Key
// 格式：业务:类型:id:属性
// 示例
'user:profile:123'
'product:stock:456'
'session:token:abc'

// 2. 使用scan代替keys
// keys会阻塞，不宜在生产使用
const stream = client.scanStream({
  pattern: 'user:*',
  count: 100
});

for await (const key of stream) {
  console.log(key);
}

// 3. Pipeline减少网络往返
const pipeline = client.multi();
for (let i = 0; i < 1000; i++) {
  pipeline.incr('counter:' + i);
}
await pipeline.exec();

// 4. Redis分布式锁
async function acquireLock(key, ttlMs = 10000) {
  const token = Math.random().toString(36).substr(2);
  const acquired = await client.set(key, token, 'NX', 'PX', ttlMs);
  return acquired ? token : null;
}

async function releaseLock(key, token) {
  // Lua脚本保证原子性
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;
  await client.eval(script, 1, key, token);
}

// 5. 缓存模式
// Cache-Aside（旁路缓存）
async function getUser(id) {
  const cacheKey = 'user:' + id;
  let user = await client.get(cacheKey);

  if (user) {
    return JSON.parse(user);
  }

  user = await db.query('SELECT * FROM users WHERE id = ?', [id]);

  if (user) {
    await client.setex(cacheKey, 3600, JSON.stringify(user));
  }

  return user;
}
```

---

### 6.2 缓存策略

#### 面试题14：如何设计缓存策略？缓存穿透、缓存击穿、缓存雪崩是什么？如何解决？

**参考答案**

缓存策略设计是后端开发中的核心问题。常见的缓存问题包括：缓存穿透（查询不存在的数据）、缓存击穿（热点key过期）、缓存雪崩（大量缓存同时过期）。

**三大缓存问题详解：**

```javascript
// ============ 缓存穿透 ============
// 问题：大量请求查询不存在的数据，直接打到数据库
// 解决：布隆过滤器、缓存空值

const bloomFilter = require('bloom-filters').BloomFilter;
const filter = bloomFilter.create(10000, 0.01);

// 添加存在的用户ID
filter.add('1', '2', '3');

async function getUser(id) {
  // 布隆过滤器检查
  if (!filter.has(id)) {
    return null;  // 一定不存在
  }

  // 缓存空值，防止缓存穿透
  const cacheKey = 'user:' + id;
  let user = await client.get(cacheKey);

  if (user === 'NULL') {
    return null;
  }

  if (user) {
    return JSON.parse(user);
  }

  user = await db.query('SELECT * FROM users WHERE id = ?', [id]);

  if (user) {
    await client.setex(cacheKey, 3600, JSON.stringify(user));
  } else {
    // 缓存空值，短过期时间
    await client.setex(cacheKey, 60, 'NULL');
  }

  return user;
}

// ============ 缓存击穿 ============
// 问题：热点key过期，瞬间大量请求打到数据库
// 解决：互斥锁、热点数据永不过期

// 方案1：互斥锁
const mutex = require('async-mutex').Mutex;
const mutexMap = new Map();

async function getUserWithLock(id) {
  const cacheKey = 'user:' + id;
  let user = await client.get(cacheKey);

  if (user) {
    return JSON.parse(user);
  }

  // 获取锁
  if (!mutexMap.has(id)) {
    mutexMap.set(id, new mutex());
  }
  const release = await mutexMap.get(id).acquire();

  try {
    // 再次检查缓存
    user = await client.get(cacheKey);
    if (user) {
      return JSON.parse(user);
    }

    // 从数据库加载
    user = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    await client.setex(cacheKey, 3600, JSON.stringify(user));

    return user;
  } finally {
    release();
  }
}

// 方案2：热点数据永不过期 + 异步更新
async function getUserNeverExpire(id) {
  const cacheKey = 'user:' + id;
  let user = await client.get(cacheKey);

  if (user) {
    user = JSON.parse(user);

    // 检查是否即将过期
    const ttl = await client.ttl(cacheKey);
    if (ttl < 300) {  // 小于5分钟，异步更新
      updateUserCache(id);  // 异步执行，不阻塞
    }

    return user;
  }

  return await updateUserCache(id);
}

async function updateUserCache(id) {
  const user = await db.query('SELECT * FROM users WHERE id = ?', [id]);
  if (user) {
    await client.set('user:' + id, JSON.stringify(user));  // 不设置过期时间
  }
  return user;
}

// ============ 缓存雪崩 ============
// 问题：大量缓存同时过期，请求打到数据库
// 解决：随机过期时间、均匀过期、双层缓存

// 方案1：随机过期时间
async function getUserWithJitter(id) {
  const cacheKey = 'user:' + id;
  let user = await client.get(cacheKey);

  if (user) {
    return JSON.parse(user);
  }

  user = await db.query('SELECT * FROM users WHERE id = ?', [id]);

  if (user) {
    // 添加随机过期时间（1小时 ± 10分钟）
    const jitter = Math.floor(Math.random() * 600) - 300;
    const ttl = 3600 + jitter;
    await client.setex(cacheKey, ttl, JSON.stringify(user));
  }

  return user;
}

// 方案2：双层缓存
const L1Cache = new Map();  // 本地缓存
const L1_TTL = 60000;  // 1分钟

async function getUserWithL1Cache(id) {
  // L1缓存检查
  let user = L1Cache.get(id);
  if (user) {
    return user;
  }

  // L2缓存检查
  const cacheKey = 'user:' + id;
  user = await client.get(cacheKey);

  if (user) {
    user = JSON.parse(user);
    L1Cache.set(id, user);  // 存入L1
    setTimeout(() => L1Cache.delete(id), L1_TTL);  // L1过期
    return user;
  }

  // 从数据库加载
  user = await db.query('SELECT * FROM users WHERE id = ?', [id]);

  if (user) {
    await client.setex(cacheKey, 3600, JSON.stringify(user));
    L1Cache.set(id, user);
  }

  return user;
}
```

**缓存更新策略：**

```javascript
// 1. Cache-Aside（最常用）
// 读：先读缓存，缓存miss则读数据库并更新缓存
// 写：先写数据库，再删除缓存

async function readUser(id) {
  const user = await redis.get('user:' + id);
  if (user) return JSON.parse(user);

  const dbUser = await db.query('SELECT * FROM users WHERE id = ?', [id]);
  if (dbUser) {
    await redis.setex('user:' + id, 3600, JSON.stringify(dbUser));
  }
  return dbUser;
}

async function updateUser(id, data) {
  await db.query('UPDATE users SET ? WHERE id = ?', [data, id]);
  await redis.del('user:' + id);  // 删除缓存，而不是更新
}

// 2. Write-Through（写穿透）
// 写：同时写缓存和数据库

async function updateUserWriteThrough(id, data) {
  await db.query('UPDATE users SET ? WHERE id = ?', [data, id]);
  const user = await db.query('SELECT * FROM users WHERE id = ?', [id]);
  await redis.setex('user:' + id, 3600, JSON.stringify(user));
}

// 3. Read-Through（读穿透）
// 读：缓存miss时，由缓存服务自动加载

class CacheService {
  async get(key, fetcher, ttl = 3600) {
    let data = await redis.get(key);
    if (data) return JSON.parse(data);

    data = await fetcher();
    await redis.setex(key, ttl, JSON.stringify(data));
    return data;
  }
}

const cache = new CacheService();
const user = await cache.get('user:' + id, () => db.query('...'));
```

**最佳实践：**

```javascript
// 1. 缓存键设计
// 格式：版本:业务:实体:id
const CACHE_KEYS = {
  user: (id) => `v1:user:${id}`,
  product: (id) => `v1:product:${id}`,
  list: (type, page) => `v1:list:${type}:${page}`
};

// 2. 缓存监控
async function monitorCache() {
  const info = await redis.info('stats');
  console.log('命中率:', info.keyspace_hits / (info.keyspace_hits + info.keyspace_misses));
}

// 3. 缓存预热
async function preheatCache() {
  const hotProducts = await db.query('SELECT * FROM products ORDER BY views DESC LIMIT 100');

  const pipeline = redis.multi();
  hotProducts.forEach(p => {
    pipeline.setex('product:' + p.id, 3600, JSON.stringify(p));
  });
  await pipeline.exec();
}
```

---

## 七、安全

### 7.1 鉴权与JWT

#### 面试题15：JWT的工作原理是什么？如何实现Refresh Token机制？

**参考答案**

JWT（JSON Web Token）是一种开放标准，用于在各方之间安全地传输信息。JWT由三部分组成：Header（头部）、Payload（负载）、Signature（签名）。Refresh Token用于在Access Token过期后获取新的访问令牌。

**JWT工作原理：**

```javascript
const jwt = require('jsonwebtoken');

// ============ JWT结构 ============
// Header.Payload.Signature
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4iLCJpYXQiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

// ============ 签发Token ============

function generateTokens(user) {
  // Access Token（短期，15分钟）
  const accessToken = jwt.sign(
    {
      sub: user.id,           // 用户ID
      name: user.name,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '15m',
      issuer: 'my-app'
    }
  );

  // Refresh Token（长期，7天）
  const refreshToken = jwt.sign(
    {
      sub: user.id,
      type: 'refresh'         // 标记为refresh token
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: '7d'
    }
  );

  return { accessToken, refreshToken };
}

// ============ 验证Token ============

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new TokenExpiredError();
    }
    throw new InvalidTokenError();
  }
}

// ============ 中间件验证 ============

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      return res.status(401).json({ error: '令牌已过期', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: '无效的令牌' });
  }
};

// ============ Refresh Token机制 ============

// Redis存储Refresh Token
async function refreshTokens(refreshToken) {
  try {
    // 验证Refresh Token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // 检查Redis中是否存在
    const stored = await redis.get('refresh:' + decoded.sub);
    if (stored !== refreshToken) {
      throw new Error('Token has been revoked');
    }

    // 获取用户信息
    const user = await User.findById(decoded.sub);
    if (!user) {
      throw new Error('User not found');
    }

    // 生成新Token
    const tokens = generateTokens(user);

    // 更新Redis中的Refresh Token
    await redis.setex('refresh:' + user.id, 7 * 24 * 3600, tokens.refreshToken);

    return tokens;
  } catch (err) {
    throw new Error('Refresh token invalid');
  }
}

// 登录接口
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !await bcrypt.compare(password, user.passwordHash)) {
    return res.status(401).json({ error: '邮箱或密码错误' });
  }

  const tokens = generateTokens(user);

  // 存储Refresh Token
  await redis.setex('refresh:' + user.id, 7 * 24 * 3600, tokens.refreshToken);

  res.json(tokens);
});

// 刷新Token接口
app.post('/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  try {
    const tokens = await refreshTokens(refreshToken);
    res.json(tokens);
  } catch (err) {
    res.status(401).json({ error: 'Refresh token无效' });
  }
});
```

**最佳实践：**

```javascript
// 1. Token黑名单机制
const blacklist = new Set();

async function logout(accessToken) {
  // 将token加入黑名单
  const decoded = jwt.decode(accessToken);
  const expTime = decoded.exp - Math.floor(Date.now() / 1000);

  if (expTime > 0) {
    await redis.setex('blacklist:' + accessToken, expTime, '1');
  }

  // 删除Refresh Token
  await redis.del('refresh:' + decoded.sub);
}

async function isBlacklisted(token) {
  return await redis.exists('blacklist:' + token);
}

// 2. Token窃取检测
async function detectTokenTheft(oldRefreshToken, newRefreshToken) {
  const decoded = jwt.decode(oldRefreshToken);
  const lastUse = await redis.get('lastUse:' + decoded.sub);

  if (lastUse) {
    // 如果刷新Token的使用间隔太短，可能是被盗
    const lastUseTime = parseInt(lastUse);
    const now = Date.now();
    if (now - lastUseTime < 1000) {
      // 触发安全警报
      await sendSecurityAlert(decoded.sub);
    }
  }

  await redis.set('lastUse:' + decoded.sub, Date.now().toString());
}

// 3. 多种Token方案对比
// JWT：无状态，适合分布式
// Session：服务端存储，适合简单场景
// Opaque Token：随机字符串，可撤销

// 4. 安全的Cookie设置
res.cookie('refreshToken', refreshToken, {
  httpOnly: true,   // 防止XSS
  secure: true,     // 仅HTTPS
  sameSite: 'strict',  // CSRF防护
  maxAge: 7 * 24 * 3600 * 1000
});
```

---

### 7.2 加密与密码安全

#### 面试题16：如何安全地存储密码？ bcrypt的原理是什么？

**参考答案**

密码绝不能明文存储，必须使用不可逆的哈希算法加盐处理。bcrypt是目前最常用的密码哈希算法，它采用自适应哈希函数，可以抵御暴力破解和彩虹表攻击。

**bcrypt原理：**

```javascript
const bcrypt = require('bcrypt');

// ============ 密码哈希 ============

// 哈希密码
async function hashPassword(password) {
  const saltRounds = 12;  // 越高越安全，但越慢

  const hash = await bcrypt.hash(password, saltRounds);
  return hash;
}

// 验证密码
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// ============ 使用示例 ============

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  // 验证密码强度
  if (password.length < 8) {
    return res.status(400).json({ error: '密码长度至少8位' });
  }

  // 哈希密码
  const passwordHash = await hashPassword(password);

  const user = await User.create({
    username,
    email,
    passwordHash
  });

  res.status(201).json({ message: '注册成功' });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ error: '邮箱或密码错误' });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: '邮箱或密码错误' });
  }

  // 登录成功，生成Token
  const tokens = generateTokens(user);
  res.json(tokens);
});
```

**密码安全最佳实践：**

```javascript
// 1. 密码强度验证
function validatePasswordStrength(password) {
  const errors = [];

  if (password.length < 8) {
    errors.push('密码长度至少8位');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含小写字母');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含大写字母');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('密码必须包含数字');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('密码必须包含特殊字符');
  }

  return errors;
}

// 2. 密码过期机制
async function checkPasswordExpiry(user) {
  const maxAge = 90 * 24 * 3600;  // 90天
  const passwordChangedAt = user.passwordChangedAt || user.createdAt;

  const daysSinceChange = (Date.now() - new Date(passwordChangedAt)) / (24 * 3600 * 1000);

  if (daysSinceChange > 90) {
    return { expired: true, daysSinceChange };
  }

  return { expired: false, daysUntilExpiry: 90 - daysSinceChange };
}

// 3. 防止暴力破解：登录限流
const loginAttempts = new Map();

app.post('/login', rateLimit({
  windowMs: 15 * 60 * 1000,  // 15分钟
  max: 5,  // 最多5次
  message: '登录尝试次数过多，请稍后再试'
}), async (req, res) => {
  // 登录逻辑
});

// 4. 密码历史记录（防止重复使用）
async function isPasswordReused(userId, newPassword) {
  const history = await PasswordHistory.find({ userId })
    .sort({ createdAt: -1 })
    .limit(5);

  for (const record of history) {
    if (await bcrypt.compare(newPassword, record.passwordHash)) {
      return true;  // 密码被重复使用
    }
  }

  return false;
}

async function changePassword(userId, newPassword) {
  // 验证新密码未使用过
  if (await isPasswordReused(userId, newPassword)) {
    throw new Error('不能使用最近使用过的密码');
  }

  const hash = await hashPassword(newPassword);

  // 保存到历史记录
  await PasswordHistory.create({
    userId,
    passwordHash: hash
  });

  // 更新当前密码
  await User.update({ id: userId }, { passwordHash: hash });

  // 使所有现有会话失效
  await redis.del('sessions:' + userId);
}
```

**bcrypt vs 其他算法对比：**

| 算法 | 特点 | 适用场景 |
|------|------|----------|
| bcrypt | 自适应、可配置成本因子 | 密码存储（推荐） |
| scrypt | 内存硬哈希 | 高安全需求 |
| Argon2 | 现代算法，memory-hard | 新项目首选 |
| PBKDF2 | NIST推荐 | 兼容性要求高 |

```javascript
// Argon2示例（更现代的选择）
const argon2 = require('argon2');

async function hashPasswordArgon2(password) {
  return await argon2.hash(password, {
    type: argon2.argon2id,  // 推荐类型
    memoryCost: 65536,      // 64MB
    timeCost: 3,            // 迭代次数
    parallelism: 4
  });
}

async function verifyPasswordArgon2(password, hash) {
  return await argon2.verify(hash, password);
}
```

---

## 八、微服务

### 8.1 消息队列

#### 面试题17：消息队列的作用是什么？RabbitMQ和Kafka有什么区别？

**参考答案**

消息队列用于解耦系统组件、实现异步处理、流量削峰。RabbitMQ是功能完善的消息代理，Kafka是高吞吐量分布式流处理平台。

**消息队列核心概念：**

```javascript
// ============ RabbitMQ ============

const amqp = require('amqplib');

async function rabbitMQExample() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();

  // 交换机类型：direct, fanout, topic, headers
  await channel.assertExchange('orders', 'topic', { durable: true });

  // 队列
  await channel.assertQueue('order.created', { durable: true });
  await channel.bindQueue('order.created', 'orders', 'order.created');

  // 生产者
  channel.publish('orders', 'order.created', Buffer.from(JSON.stringify({
    orderId: '123',
    userId: '456',
    total: 99.99
  })));

  // 消费者
  channel.consume('order.created', (msg) => {
    if (msg) {
      const order = JSON.parse(msg.content.toString());
      console.log('收到订单:', order);

      // 处理完成后确认消息
      channel.ack(msg);
    }
  });
}

// ============ Kafka ============

const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'order-service',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'order-group' });

async function kafkaExample() {
  await producer.connect();
  await consumer.connect();

  await producer.send({
    topic: 'orders',
    messages: [
      { key: 'order-123', value: JSON.stringify({ orderId: '123', total: 99.99 }) }
    ]
  });

  await consumer.subscribe({ topic: 'orders', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const order = JSON.parse(message.value.toString());
      console.log('收到订单:', order);
    }
  });
}
```

**RabbitMQ vs Kafka对比：**

```javascript
// ============ 选型对比 ============

// RabbitMQ适用场景
// 1. 复杂的路由逻辑（多种交换机类型）
// 2. 需要消息确认和事务
// 3. 单机或小型集群
// 4. 请求/回复模式

// Kafka适用场景
// 1. 超高吞吐量（日志收集、实时分析）
// 2. 事件溯源
// 3. 需要消息持久化和回溯
// 4. 大数据场景

// ============ 订单处理示例 ============

// RabbitMQ：适合需要可靠投递的场景
async function processOrderWithConfirm(order) {
  const channel = await amqp.connect('amqp://localhost');

  // 发布确认
  await channel.assertExchange('orders', 'direct', { durable: true });

  channel.publish('orders', 'order.created', Buffer.from(JSON.stringify(order)), {
    persistent: true,  // 消息持久化
    confirm: true       // 发布确认
  });

  // 消费者确认模式
  channel.consume('order.created', async (msg) => {
    try {
      await processOrder(order);
      channel.ack(msg);
    } catch (err) {
      channel.nack(msg, false, true);  // 重新入队
    }
  });
}

// Kafka：适合高吞吐量的日志处理
async function processOrderStream(orders) {
  const producer = kafka.producer();
  await producer.connect();

  // 批量发送
  await producer.send({
    topic: 'orders',
    messages: orders.map(order => ({
      key: order.id,
      value: JSON.stringify(order),
      headers: {
        'correlation-id': order.correlationId
      }
    }))
  });

  // 消费者组
  const consumer = kafka.consumer({ groupId: 'order-processor' });
  await consumer.subscribe({ topic: 'orders' });

  await consumer.run({
    eachBatchAutoResolve: false,
    eachBatch: async ({ batch, resolveOffset }) => {
      for (const message of batch.messages) {
        const order = JSON.parse(message.value.toString());
        await processOrder(order);
        resolveOffset(message.offset);
      }
    }
  });
}
```

**最佳实践：**

```javascript
// 1. 消息幂等性处理
async function processOrderIdempotent(orderId, handler) {
  // 使用Redis记录处理中的消息
  const key = 'processing:' + orderId;
  const result = await redis.set(key, '1', 'NX', 'EX', 60);

  if (!result) {
    console.log('订单已在处理中');
    return;
  }

  try {
    await handler(orderId);
  } finally {
    await redis.del(key);
  }
}

// 2. 死信队列处理
await channel.assertQueue('order.created.dlx', { durable: true });
await channel.assertQueue('order.created', {
  durable: true,
  arguments: {
    'x-dead-letter-exchange': 'dlx',
    'x-dead-letter-routing-key': 'order.created.dlx'
  }
});

// 3. 延迟队列（使用延迟插件）
await channel.assertExchange('orders.delayed', 'x-delayed-message', {
  arguments: { 'x-delayed-type': 'direct' }
});
```

---

### 8.2 API 网关

#### 面试题18：什么是API网关？它有什么作用？如何选择API网关方案？

**参考答案**

API网关是系统的单一入口，负责请求路由、负载均衡、认证鉴权、限流熔断等功能。它简化了客户端与微服务的交互，是微服务架构中的关键组件。

**API网关功能：**

```yaml
# ============ Kong网关配置示例 ============

# docker-compose.yml
version: '3'
services:
  kong:
    image: kong:latest
    environment:
      KONG_DATABASE: postgres
      KONG_PG_HOST: postgres
      KONG_DECLARATIVE_CONFIG: /usr/local/kong/kong.yml
    ports:
      - "8000:8000"
      - "8443:8443"
    volumes:
      - ./kong.yml:/usr/local/kong/kong.yml

# kong.yml
_format_version: "3.0"

services:
  - name: user-service
    url: http://user-service:3000
    routes:
      - name: user-route
        paths:
          - /api/users
        strip_path: false

    plugins:
      - name: rate-limiting
        config:
          minute: 100
          policy: redis
          redis_host: redis

  - name: order-service
    url: http://order-service:3001
    routes:
      - name: order-route
        paths:
          - /api/orders

plugins:
  - name: cors
  - name: jwt
  - name: request-transformer
```

**Node.js实现简易网关：**

```javascript
// ============ 简单API网关实现 ============

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

const app = express();

// 限流中间件
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: '请求过于频繁' }
});
app.use(limiter);

// JWT认证中间件
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未授权' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: '无效的令牌' });
  }
}

// 服务配置
const services = {
  '/api/users': 'http://user-service:3000',
  '/api/orders': 'http://order-service:3001',
  '/api/products': 'http://product-service:3002'
};

// 代理中间件
for (const [path, target] of Object.entries(services)) {
  app.use(path, authenticate, createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: {
      [`^${path}`]: '',  // 移除前缀
    },
    onProxyReq: (proxyReq, req) => {
      // 传递用户信息
      proxyReq.setHeader('X-User-Id', req.user.sub);
      proxyReq.setHeader('X-User-Role', req.user.role);
    },
    onError: (err, req, res) => {
      console.error('代理错误:', err);
      res.status(502).json({ error: '服务不可用' });
    }
  }));
}

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(8080);
```

**网关方案对比：**

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| Kong | 功能丰富、生态好 | 配置复杂、资源占用 | 中大型项目 |
| NGINX | 性能极高、稳定 | 配置繁琐、扩展性差 | 高性能需求 |
| Express/Node | 灵活、JS统一 | 性能一般 | 小型项目、快速开发 |
| Traefik | 自动发现、配置简单 | 功能相对较少 | 容器化环境 |

**最佳实践：**

```javascript
// 1. 服务发现
const consul = require('consul');

async function serviceDiscovery(serviceName) {
  const services = await consul.agent.services();
  const instances = Object.values(services)
    .filter(s => s.Service === serviceName);

  if (instances.length === 0) {
    throw new Error(`Service ${serviceName} not found`);
  }

  // 负载均衡：随机
  return instances[Math.floor(Math.random() * instances.length)];
}

// 2. 熔断器实现
class CircuitBreaker {
  constructor() {
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailure = null;
    this.state = 'CLOSED';  // CLOSED, OPEN, HALF_OPEN
  }

  call(service, fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailure > 30000) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.successCount++;
    if (this.state === 'HALF_OPEN' && this.successCount >= 3) {
      this.state = 'CLOSED';
    }
  }

  onFailure() {
    this.failureCount++;
    this.lastFailure = Date.now();
    this.successCount = 0;
    if (this.failureCount >= 5) {
      this.state = 'OPEN';
    }
  }
}

// 3. 统一响应格式
app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    return originalJson({
      code: res.statusCode,
      message: 'success',
      data
    });
  };
  next();
});
```

---

## 九、综合实践

### 9.1 性能优化

#### 面试题19：如何排查和解决Node.js应用性能问题？

**参考答案**

Node.js性能问题通常来源于：CPU密集型任务阻塞事件循环、内存泄漏、I/O瓶颈、数据库查询慢。排查需要借助专业工具，如clinic.js、node --prof、heapdump。

**性能分析工具：**

```javascript
// ============ 1. 使用clinic.js进行性能分析 ============
/*
安装：npm i -g clinic
使用：
  clinic doctor    - 快速诊断
  clinic flame     - 生成火焰图
  clinic bubbleprof - 气泡图分析
*/

// 命令行
// clinic doctor -- node server.js

// ============ 2. 内置性能分析 ============
// 启动时启用分析
// node --prof server.js
// 运行后生成 isolate-*.log
// node --prof-process isolate-*.log > profile.txt

// ============ 3. 内存泄漏排查 ============
const heapdump = require('heapdump');

// 定期保存堆快照
setInterval(() => {
  heapdump.writeSnapshot('./heapsnapshot-' + Date.now() + '.heapsnapshot');
}, 60000);

// 在Chrome DevTools中分析
// 打开 chrome://inspect -> Memory -> Load Snapshot

// ============ 4. 异步追踪 ============
const async_hooks = require('async_hooks');

const hook = async_hooks.createHook({
  init(asyncId, type, triggerAsyncId) {
    console.log(`Async init: ${type} [${asyncId}] trigger: ${triggerAsyncId}`);
  },
  before(asyncId) {
    console.log(`Async before: [${asyncId}]`);
  },
  after(asyncId) {
    console.log(`Async after: [${asyncId}]`);
  },
  destroy(asyncId) {
    console.log(`Async destroy: [${asyncId}]`);
  }
});

hook.enable();
```

**常见性能问题与解决方案：**

```javascript
// ============ 问题1：事件循环阻塞 ============

// 症状：请求响应时间随负载增加而急剧上升

// 诊断：使用perf_hooks
const { PerformanceObserver, performance } = require('perf_hooks');

const obs = new PerformanceObserver((items) => {
  items.getEntries().forEach((entry) => {
    console.log(`${entry.name}: ${entry.duration}ms`);
  });
  performance.clearMarks();
});

obs.observe({ entryTypes: ['measure'] });

// 解决方案：Worker Threads
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (!isMainThread) {
  // Worker线程中执行CPU密集型任务
  const result = heavyComputation(workerData);
  parentPort.postMessage(result);
}

function heavyComputation(data) {
  // CPU密集型计算
}

// ============ 问题2：内存泄漏 ============

// 症状：进程内存持续增长

// 常见原因1：全局变量累积
// 不好
const cache = {};
function addToCache(key, value) {
  global.cache[key] = value;  // 不断累积
}

// 好：设置缓存上限
const LRU = require('lru-cache');
const cache = new LRU({ max: 1000 });

// 常见原因2：事件监听器未清理
// 不好
server.on('connection', (conn) => {
  conn.on('data', handleData);
  // conn关闭时未清理监听器
});

// 好：使用once或手动清理
server.on('connection', (conn) => {
  conn.once('data', handleData);
});

// ============ 问题3：数据库连接池配置不当 ============

const { Pool } = require('pg');

// 不好：默认配置
const pool = new Pool();

// 好：根据负载调整
const pool = new Pool({
  max: 20,              // 最大连接数
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // 预估：每个请求平均等待100ms，QPS=100
  // 需要的连接数 = 100 * 0.1 = 10，加上余量 = 20
});

// ============ 问题4：频繁的GC ============

// 诊断：添加GC日志
// node --expose-gc --trace-gc app.js

// 解决：减少对象创建
// 不好：每次请求创建新对象
app.get('/users', async (req, res) => {
  const users = await db.query('SELECT * FROM users');
  const result = users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email
  }));
  res.json(result);
});

// 好：复用对象池或流式处理
```

**性能优化清单：**

```javascript
// ============ 常见优化项 ============

// 1. 压缩响应
const compression = require('compression');
app.use(compression());

// 2. 静态文件缓存
app.use(express.static('public', {
  maxAge: '1d',
  etag: true
}));

// 3. 连接复用
const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 50
});

// 4. 批量操作
// 不好：循环中单条插入
for (const item of items) {
  await db.query('INSERT INTO logs VALUES ?', [item]);
}

// 好：批量插入
await db.query('INSERT INTO logs VALUES ?', [items]);

// 5. 索引优化
await db.query('CREATE INDEX idx_user_id ON orders(user_id, created_at)');

// 6. 使用 streams 处理大文件
const fs = require('fs');
const { pipeline } = require('stream/promises');

async function processLargeFile(input, output) {
  const readStream = fs.createReadStream(input);
  const transformStream = transformData();
  const writeStream = fs.createWriteStream(output);

  await pipeline(readStream, transformStream, writeStream);
}
```

---

### 9.2 错误处理与日志

#### 面试题20：如何设计健壮的错误处理系统？Node.js中的错误分类有哪些？

**参考答案**

Node.js错误分为系统错误（System Errors）、用户错误（User Errors）、编程错误（Assertion Errors）。健壮的错误处理系统应该统一错误格式、区分错误类型、记录详细日志。

**错误分类：**

```javascript
// ============ Node.js错误类型 ============

// 1. 系统错误（System Errors）
// 由操作系统或底层库触发
try {
  fs.readFileSync('/nonexistent/file');
} catch (err) {
  console.log(err.code);      // 'ENOENT'
  console.log(err.syscall);   // 'open'
  console.log(err.path);      // '/nonexistent/file'
}

// 常见系统错误码
// ENOENT: 文件不存在
// EACCES: 权限不足
// ECONNREFUSED: 连接被拒绝
// ETIMEDOUT: 连接超时
// ENOTFOUND: DNS解析失败

// 2. 用户错误（User Errors）
// 由应用程序的业务逻辑触发
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.field = field;
  }
}

class NotFoundError extends Error {
  constructor(resource, id) {
    super(`${resource} with id ${id} not found`);
    this.name = 'NotFoundError';
    this.statusCode = 404;
    this.resource = resource;
    this.id = id;
  }
}

class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
  }
}

// 3. 编程错误（Assertion Errors）
// 代码bug导致，不应捕获
const assert = require('assert');

// ============ 统一错误处理 ============

class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;  // 运营错误，可预见的

    Error.captureStackTrace(this, this.constructor);
  }
}

// 错误工厂函数
const ErrorFactory = {
  badRequest(message) {
    return new AppError(message, 400, 'BAD_REQUEST');
  },

  unauthorized(message = '未授权') {
    return new AppError(message, 401, 'UNAUTHORIZED');
  },

  forbidden(message = '禁止访问') {
    return new AppError(message, 403, 'FORBIDDEN');
  },

  notFound(resource = '资源') {
    return new AppError(`${resource}不存在`, 404, 'NOT_FOUND');
  },

  conflict(message) {
    return new AppError(message, 409, 'CONFLICT');
  },

  internal(message = '服务器内部错误') {
    return new AppError(message, 500, 'INTERNAL_ERROR');
  }
};

// ============ Express错误处理 ============

// 错误处理中间件
app.use((err, req, res, next) => {
  // 区分运营错误和编程错误
  if (err.isOperational) {
    // 运营错误：记录日志，返回友好消息
    logger.warn({
      message: err.message,
      code: err.code,
      path: req.path,
      method: req.method
    });

    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
      }
    });
  } else {
    // 编程错误：记录完整错误，关闭进程
    logger.error({
      message: err.message,
      stack: err.stack,
      path: req.path
    });

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: '服务器内部错误'
      }
    });

    // 生产环境应该让进程退出并由supervisor重启
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
});

// 使用示例
app.get('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      throw ErrorFactory.notFound('用户');
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
});
```

**日志系统设计：**

```javascript
// ============ 分级日志 ============

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

// 日志格式
function formatLog(level, message, meta = {}) {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
    pid: process.pid,
    env: process.env.NODE_ENV
  };
}

// 简单日志实现
class Logger {
  constructor(level = 'info') {
    this.level = LOG_LEVELS[level] ?? LOG_LEVELS.info;
  }

  log(level, message, meta) {
    if (LOG_LEVELS[level] <= this.level) {
      const entry = formatLog(level, message, meta);
      console.log(JSON.stringify(entry));
    }
  }

  error(message, meta) { this.log('error', message, meta); }
  warn(message, meta) { this.log('warn', message, meta); }
  info(message, meta) { this.log('info', message, meta); }
  debug(message, meta) { this.log('debug', message, meta); }
}

const logger = new Logger(process.env.LOG_LEVEL || 'info');

// ============ 结构化日志 ============

// 使用pino（高性能日志库）
const pino = require('pino');

const log = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label })
  },
  timestamp: pino.stdTimeFunctions.isoDate,
  base: {
    service: 'user-service',
    pid: process.pid
  }
});

// 请求日志中间件
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    log.info({
      req: {
        method: req.method,
        url: req.originalUrl,
        headers: { ...req.headers, authorization: '[REDACTED]' }
      },
      res: {
        statusCode: res.statusCode
      },
      duration
    }, `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });

  next();
});

// 错误日志
app.use((err, req, res, next) => {
  log.error({
    err: {
      message: err.message,
      stack: err.stack,
      code: err.code
    },
    req: {
      method: req.method,
      url: req.originalUrl
    }
  }, 'Request error');

  next(err);
});

// ============ 日志轮转 ============

const rotatingFileStream = require('rotating-file-stream');
const path = require('path');

const accessLogStream = rotatingFileStream('access.log', {
  interval: '1d',           // 每天一个新文件
  maxFiles: 30,            // 保留30天
  path: path.join(__dirname, 'logs')
});
```

**最佳实践：**

```javascript
// 1. 区分错误类型并正确处理
try {
  await riskyOperation();
} catch (err) {
  if (err.code === 'ENOENT') {
    // 处理文件不存在
  } else if (err.code === 'EACCES') {
    // 处理权限错误
  } else {
    // 未知错误，重新抛出
    throw err;
  }
}

// 2. 异步错误处理
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason }, 'Unhandled Promise Rejection');
});

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught Exception');
  process.exit(1);
});

// 3. 健康检查中的错误监控
app.get('/health', async (req, res) => {
  const checks = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: await checkDatabase(),
    redis: await checkRedis()
  };

  const isHealthy = Object.values(checks).every(
    c => typeof c !== 'object' || c.healthy
  );

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    checks
  });
});
```

---

## 十、面试技巧与总结

### 10.1 技术表达

#### 面试题21：在技术面试中如何清晰地表达技术方案？

**参考答案**

技术表达需要结构化：先说结论，再用STAR法则（情境、任务、行动、结果）展开。重点展示问题分析能力、方案权衡思维、实际经验。

**回答模板：**

```javascript
// ============ 项目经历描述 ============

// STAR法则模板
// 情境（Situation）：项目背景是什么？
// 任务（Task）：你负责什么？
// 行动（Action）：你做了什么？
// 结果（Result）：结果如何？

// 示例回答：
/*
在之前的电商项目中，我们遇到了秒杀系统在高并发下数据库扛不住的问题。
（情境）

我负责设计秒杀服务的整体架构，重点是库存扣减和订单创建的准确性。
（任务）

我采用了多层缓存方案：
1. 使用Redis缓存秒杀商品信息，预热到内存
2. 使用Lua脚本保证库存扣减的原子性
3. 消息队列异步创建订单，削峰填谷
4. 限流保护，防止瞬时流量压垮系统

最终实现了支持10万QPS的秒杀能力，订单创建成功率99.9%，零超卖。
（结果）
*/

// ============ 问题分析框架 ============

// 1. 明确问题边界
// "你说的高并发具体是多高？QPS多少？瓶颈在哪？"

// 2. 方案对比
// "有几种方案可以考虑：方案A优点是...缺点是...；方案B优点是...缺点是..."
// "综合考虑，我们选择了方案B，因为..."

// 3. 权衡取舍
// "我们在性能和复杂度之间做了权衡，选择了..."
// "这里用空间换时间，因为..."

// ============ 开放性问题回答 ============

// 问题：如何设计一个短链接系统？

/*
核心问题拆解：
1. 存储：需要多少数据？如何选型？
2. 生成：如何生成短码？冲突怎么办？
3. 跳转：如何实现302重定向？
4. 扩展：如何支持自定义码？统计分析？

技术选型：
- 存储：Redis（高性能）或 MySQL（持久化）+ Redis缓存
- 短码生成：62进制自增ID或哈希
- 布隆过滤器：判断短码是否存在

关键点：
- 短码长度：6位62进制 = 568亿容量
- 唯一性：分布式ID生成器或哈希
- 301 vs 302：SEO用301，分析用302
*/
```

**常见问题应对：**

```javascript
// 1. 你最大的技术挑战是什么？

/*
回答要点：
- 具体描述挑战是什么
- 你如何分析和尝试
- 最终解决方案
- 学到了什么

示例：
"最大的挑战是优化一个慢查询，从30秒降到200毫秒。
我通过EXPLAIN分析发现是缺少索引，加上ORDER BY导致全表扫描。
加索引后效果不明显，进一步分析发现是数据量太大。
最后采用了分页+游标方案，利用主键排序特性，
配合复合索引，大幅减少了扫描范围。"
*/

// 2. 你遇到过最难解决的bug是什么？

/*
回答要点：
- bug的表象是什么
- 如何定位的
- 为什么难
- 最终解决方案
- 经验总结

示例：
"是一个偶发的内存泄漏问题，只在线上环境出现。
通过添加详细日志和使用heapdump分析，
发现是一个事件监听器未清理的问题。
某个HTTP请求会在特定条件下创建新的事件监听器，
但连接关闭时没有正确移除，导致内存持续增长。
教训是要特别注意事件监听器的生命周期管理。"
*/

// 3. 你如何保证代码质量？

/*
回答要点：
- 代码规范
- 测试策略
- Code Review
- 自动化工具

示例：
"我们团队有以下实践：
1. ESLint + Prettier 统一代码风格
2. Jest 单元测试覆盖率 > 80%
3. 核心模块有集成测试
4. PR必须通过CI才能合并
5. 定期Code Review，重点看边界情况
6. 监控和告警，发现问题及时响应
"
*/
```

### 10.2 知识体系总结

#### 面试题22：Node.js后端开发需要掌握的核心知识点有哪些？

**参考答案**

Node.js后端开发的核心知识体系可分为基础、进阶、高级三个层次。掌握这些知识点，能够应对大多数后端开发场景和面试挑战。

**核心知识图谱：**

```
Node.js后端知识体系
├── 基础（必须掌握）
│   ├── JavaScript/TypeScript基础
│   ├── Node.js核心（事件循环、模块系统、异步编程）
│   ├── Express/Koa基础
│   ├── 数据库基础（SQL、索引、事务）
│   ├── Redis基础（数据结构、缓存）
│   └── HTTP协议、网络基础
│
├── 进阶（核心竞争力）
│   ├── NestJS/Express/Koa深入
│   ├── 数据库优化（慢查询、连接池、分库分表）
│   ├── Redis高级（集群、分布式锁、消息队列）
│   ├── 认证鉴权（JWT、OAuth、Session）
│   ├── 微服务（消息队列、API网关、服务发现）
│   └── 容器与DevOps（Docker、K8s、CI/CD）
│
└── 高级（架构能力）
    ├── 系统设计（高可用、高并发、可扩展）
    ├── 性能优化（Profiler、缓存、异步化）
    ├── 安全加固（渗透测试、安全加固）
    ├── 架构模式（CQRS、Event Sourcing）
    └── 团队协作（代码规范、技术债务）
```

**快速检查清单：**

```javascript
// ============ 自检清单 ============

const checklist = {
  // Node.js基础
  nodejs: [
    '事件循环原理（6个阶段）',
    'setTimeout/setImmediate/process.nextTick区别',
    '模块加载机制（require vs import）',
    'Stream流处理',
    'Buffer和TypedArray',
    'EventEmitter事件发布订阅'
  ],

  // 异步编程
  async: [
    'Promise/async-await用法',
    '错误处理（try-catch vs .catch）',
    'Promise.all/race/allSettled',
    '并发控制（避免地狱天使）',
    'Event Loop与宏任务/微任务'
  ],

  // Web框架
  framework: [
    'Express中间件原理（洋葱模型）',
    'Koa vs Express区别',
    'NestJS依赖注入',
    '路由设计（RESTful）',
    '参数验证（ Joi/class-validator）'
  ],

  // 数据库
  database: [
    'SQL基础（SELECT/INSERT/UPDATE/DELETE）',
    '索引原理（B-Tree）',
    '事务ACID特性',
    '连接池配置',
    'ORM使用（Sequelize/TypeORM）'
  ],

  // Redis
  redis: [
    '5种基本数据结构',
    'String/Hash/Set/Zset用法',
    '缓存策略（Cache-Aside等）',
    '缓存问题（穿透/击穿/雪崩）',
    'Redis分布式锁'
  ],

  // 安全
  security: [
    'JWT工作原理',
    'Refresh Token机制',
    '密码存储（bcrypt）',
    'XSS/CSRF防护',
    'SQL注入防护'
  ],

  // 微服务
  microservices: [
    '消息队列（RabbitMQ/Kafka）',
    'API网关',
    '服务发现',
    '熔断器模式',
    '链路追踪'
  ],

  // 工程化
  devops: [
    'Docker基础',
    'PM2进程管理',
    'Nginx配置',
    'CI/CD基础',
    '监控告警'
  ]
};

console.log('Node.js后端核心知识体系');
console.log('=' .repeat(50));
for (const [category, items] of Object.entries(checklist)) {
  console.log(`\n${category.toUpperCase()} (${items.length}项)`);
  items.forEach(item => console.log(`  ✓ ${item}`));
}
```

---

## 附录：面试题速查

### 快速索引表

| 类别 | 题目 | 难度 |
|------|------|------|
| **Node.js基础** | 事件循环原理 | ⭐⭐⭐ |
| **Node.js基础** | setTimeout/setImmediate/process.nextTick | ⭐⭐ |
| **异步编程** | Promise/async-await vs 回调 | ⭐⭐⭐ |
| **异步编程** | CPU密集型任务处理 | ⭐⭐⭐ |
| **模块系统** | require vs import | ⭐⭐ |
| **Express** | 中间件原理 | ⭐⭐⭐ |
| **Express** | 路由和参数处理 | ⭐⭐ |
| **Koa** | Koa vs Express | ⭐⭐ |
| **NestJS** | 依赖注入原理 | ⭐⭐⭐ |
| **NestJS** | 装饰器与拦截器 | ⭐⭐⭐ |
| **数据库** | 索引与查询优化 | ⭐⭐⭐ |
| **数据库** | 事务与ACID | ⭐⭐⭐ |
| **Redis** | 数据结构与应用 | ⭐⭐ |
| **Redis** | 缓存穿透/击穿/雪崩 | ⭐⭐⭐ |
| **安全** | JWT工作原理 | ⭐⭐⭐ |
| **安全** | 密码存储bcrypt | ⭐⭐ |
| **微服务** | RabbitMQ vs Kafka | ⭐⭐⭐ |
| **微服务** | API网关设计 | ⭐⭐⭐ |
| **性能** | 性能问题排查 | ⭐⭐⭐ |
| **错误处理** | 错误分类与处理 | ⭐⭐⭐ |

---

**文档版本**：v1.0
**更新日期**：2024年
**字数**：约12000字
