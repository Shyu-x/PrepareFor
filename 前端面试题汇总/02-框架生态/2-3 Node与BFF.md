# Node.js 与 BFF 面试题汇总 (2025 最全版)

> 史上最全 Node.js 与 BFF (Backend For Frontend) 面试题整理，涵盖 Node.js 核心原理 (Event Loop、进程与线程、Buffer和Stream、模块系统、异步编程)、BFF 架构设计、服务端渲染、接口聚合、鉴权方案、NestJS 与 RPC 通信等高频考点，助力各位同学斩获 Node.js 开发岗位 Offer！
> **推荐指数**: 五星好评 | **Node.js + BFF 全栈面试题** | **更新日期**: 2026-02-24

---

## 第一章 BFF 架构基础

### 1.1 什么是 BFF (Backend For Frontend)

**面试常问题目**:
BFF (Backend For Frontend) 是一种架构模式，为每种前端设备（如 Web、移动端桌面端）提供专用的后端服务。BFF 层作为前端与后端微服务之间的桥梁，主要职责是聚合多个后端服务的数据，按前端需求进行裁剪和转换。

**BFF 的核心优势**:
1. **减少前端请求次数**: 传统模式下，前端需要调用多个后端接口才能渲染一个页面。BFF 层可以将多个后端接口聚合成一个接口，大幅减少网络请求次数，提升页面加载速度。
2. **保护前端不受后端变化影响**: 多个前端应用共享后端微服务时，后端 API 的任何变更都需要通知所有前端团队。使用 BFF 后，后端 API 变更只需在 BFF 层处理，前端无感知。
3. **接口定制化**: BFF 可以根据前端的具体需求，返回精简的、符合前端使用习惯的数据结构，避免返回冗余字段。
4. **SSR 服务端渲染支持**: BFF 可以负责服务端渲染，在服务端完成 HTML 生成，首屏加载更快，SEO 更友好。

### 1.2 BFF 架构的技术选型与最佳实践

**面试常问题目**:
在实际项目中，BFF 层应该如何选型和落地，以下是关键考量点：

1. **选择合适的框架**: 推荐使用 Express/Koa（轻量、灵活）或 NestJS（企业级、TypeScript 支持好）。NestJS 提供了依赖注入、模块化等企业级特性。
2. **接口缓存策略**: 使用 Redis 缓存热点接口数据，减少后端压力。同时可以缓存用户接口（如用户信息）到内存或 Redis 中，减少数据库查询。
3. **监控与告警**: 引入 Prometheus/Grafana 监控系统，监控 CPU、内存、请求延迟（P99）等关键指标，设置告警阈值。
4. **服务稳定性保障**: 使用 PM2 管理和监控 Node.js 服务的集群模式，利用 Cluster 自动重启和负载均衡，保证服务高可用。

---

## 第二章 Node.js 核心原理

### 2.1 Node.js 事件循环机制 (Event Loop)

**面试常问题目**:
Node.js 是单线程异步非阻塞 I/O 模型，其核心是 libuv 库实现的事件循环机制。事件循环包含 6 个阶段，按顺序执行：

1. **Timers (定时器阶段)**: 执行 setTimeout 和 setInterval 回调函数。
2. **Pending Callbacks**: 执行被延迟到下一次循环的 I/O 回调。
3. **Idle, Prepare**: 仅 libuv 内部使用。
4. **Poll (轮询阶段)**: 处理 I/O 事件，执行大部分回调。如果 Poll 队列为空且 Check 队列有回调，会等待一段时间后进入 Check 阶段。
5. **Check (检查阶段)**: 执行 setImmediate() 回调函数。
6. **Close Callbacks**: 执行 close 事件回调，如 socket.on('close', ...)。

**特别注意**:
Node.js 中有两个特殊的队列：process.nextTick 队列和 Promise.then 队列，它们的优先级高于其他微任务队列。

```javascript
// 事件循环执行顺序示例
console.log('1. 主线程同步代码');

// 定时器 - 阶段1
setTimeout(() => {
  console.log('2. setTimeout 回调');
}, 0);

// 立即执行 - 阶段5
setImmediate(() => {
  console.log('3. setImmediate 回调');
});

// nextTick - 优先级最高
process.nextTick(() => {
  console.log('4. nextTick 回调');
});

// Promise 微任务
Promise.resolve().then(() => {
  console.log('5. Promise.then 回调');
});

// 同步代码最后执行
console.log('6. 主线程同步代码结束');

// 输出顺序: 1 -> 6 -> 4 -> 5 -> 2 -> 3
// 说明: 同步代码先执行，然后是 nextTick 和 Promise.then 两个微任务队列，
//      最后才是宏任务队列按阶段执行
```

#### 2.1.1 深入理解微任务与宏任务

在 Node.js 中，任务分为微任务（Microtask）和宏任务（Macrotask）：

**微任务**:
- Promise 回调 (Promise.then, Promise.catch, Promise.finally)
- process.nextTick()
- async/await (本质也是 Promise)
- Object.observe, MutationObserver

**宏任务**:
- setTimeout, setInterval
- setImmediate
- I/O 操作
- script 整体代码

```javascript
// 微任务与宏任务执行顺序深度分析
console.log('=== Start ===');

setTimeout(() => {
  console.log('setTimeout');
}, 0);

setImmediate(() => {
  console.log('setImmediate');
});

Promise.resolve().then(() => {
  console.log('Promise 1');
});

process.nextTick(() => {
  console.log('nextTick');
});

Promise.resolve().then(() => {
  console.log('Promise 2');
});

console.log('=== End ===');

// 实际输出:
// === Start ===
// === End ===
// nextTick
// Promise 1
// Promise 2
// setTimeout  (或 setImmediate，取决于 I/O 状态)
```

#### 2.1.2 事件循环在 I/O 操作中的行为

Node.js 的 I/O 操作由 libuv 线程池处理，不阻塞主线程：

```javascript
// I/O 操作不会阻塞事件循环
const fs = require('fs');

console.log('开始读取文件...');

fs.readFile('./large-file.txt', 'utf8', (err, data) => {
  if (err) throw err;
  console.log('文件读取完成，数据长度:', data.length);
});

console.log('文件读取请求已发起，主线程继续执行...');

// 模拟其他同步操作
for (let i = 0; i < 1000000; i++) {
  // 同步循环不会阻塞文件读取
}

console.log('同步循环执行完毕');
// 在文件读取完成后，回调函数才会被执行
```

#### 2.1.3 经典面试题：setTimeout vs setImmediate

```javascript
// 题目1: 在 I/O 循环中两者的执行顺序
const fs = require('fs');

fs.readFile(__filename, () => {
  setTimeout(() => {
    console.log('setTimeout');
  }, 0);

  setImmediate(() => {
    console.log('setImmediate');
  });
});

// 输出: setImmediate -> setTimeout
// 原因: 在 I/O 回调中，Check 阶段在 Timers 阶段之前执行

// 题目2: 嵌套 setTimeout
setTimeout(() => {
  console.log('timeout1');
  setTimeout(() => {
    console.log('timeout1-inner');
  }, 0);
}, 0);

setImmediate(() => {
  console.log('immediate1');
});

// 输出可能是:
// timeout1
// immediate1
// timeout1-inner
// 或:
// immediate1
// timeout1
// timeout1-inner
```

#### 2.1.4 process.nextTick 与 Promise 的执行顺序

```javascript
// process.nextTick 的优先级高于 Promise
process.nextTick(() => {
  console.log('nextTick 1');
});

Promise.resolve().then(() => {
  console.log('promise 1');
});

process.nextTick(() => {
  console.log('nextTick 2');
});

Promise.resolve().then(() => {
  console.log('promise 2');
});

// 输出:
// nextTick 1
// nextTick 2
// promise 1
// promise 2
```

#### 2.1.5 事件循环与 Node.js 14+ 版本的变化

Node.js 14 引入了浏览器兼容的 Promise 微任务实现，但在某些场景下行为有所不同：

```javascript
// Node.js 14+ 的变化
async function foo() {
  await bar();
  console.log('bar after');
}
async function bar() {
  console.log('bar before');
}

foo();

// Node.js 14 之前: bar before -> bar after
// Node.js 14+: bar before -> bar after (行为一致)
// 但如果 bar() 返回 Promise.thenable，行为可能有差异
```

### 2.2 Node.js 进程与线程

**面试常问题目**:
Node.js 是单线程的，但可以通过子进程和 Worker Threads 实现多线程编程。理解进程与线程的区别对于编写高性能 Node.js 应用至关重要。

#### 2.2.1 进程与线程的区别

| 特性 | 进程 | 线程 |
|------|------|------|
| 资源分配 | 独立地址空间 | 共享进程资源 |
| 开销 | 大（需复制内存） | 小（共享内存） |
| 通信 | 复杂（IPC） | 简单（共享内存） |
| 独立性 | 互不影响 | 一个崩溃可能影响其他 |

```javascript
// Node.js 主进程
console.log('主进程 PID:', process.pid);

// 查看系统 CPU 核心数
console.log('CPU 核心数:', require('os').cpus().length);
```

#### 2.2.2 子进程模块 (child_process)

Node.js 提供了四种创建子进程的方式：

```javascript
const { spawn, exec, execFile, fork } = require('child_process');

// 1. spawn: 用于流式处理大量数据
const spawnProcess = spawn('ls', ['-la'], {
  cwd: '/usr/bin',
  env: { ...process.env }
});

spawnProcess.stdout.on('data', (data) => {
  console.log('spawn stdout:', data.toString());
});

spawnProcess.stderr.on('data', (data) => {
  console.log('spawn stderr:', data.toString());
});

spawnProcess.on('close', (code) => {
  console.log('spawn 进程退出码:', code);
});

// 2. exec: 用于执行 shell 命令，返回完整结果
exec('ls -la', (error, stdout, stderr) => {
  if (error) {
    console.error('exec 错误:', error);
    return;
  }
  console.log('exec stdout:', stdout);
  console.log('exec stderr:', stderr);
});

// 3. execFile: 直接执行可执行文件
execFile('node', ['--version'], (error, stdout, stderr) => {
  console.log('execFile:', stdout.trim());
});

// 4. fork: 创建 Node.js 子进程，可进行 IPC 通信
// 子进程文件 child.js
// parent.js
const forked = fork('./child.js');

forked.on('message', (msg) => {
  console.log('收到子进程消息:', msg);
});

forked.send({ type: 'START' });

// child.js
process.on('message', (msg) => {
  if (msg.type === 'START') {
    console.log('子进程收到消息');
    process.send({ type: 'RESPONSE', data: 'Hello from child' });
  }
});
```

#### 2.2.3 进程间通信 (IPC)

```javascript
// IPC 通信示例 - 父进程
const { fork } = require('child_process');

const child = fork('./child-process.js', [], {
  stdio: ['pipe', 'pipe', 'pipe', 'ipc']
});

child.on('message', (payload) => {
  console.log('父进程收到:', payload);
});

// 发送消息给子进程
child.send({ command: 'compute', data: [1, 2, 3, 4, 5] });

// 处理子进程错误
child.on('error', (err) => {
  console.error('子进程错误:', err);
});

// 处理子进程退出
child.on('exit', (code) => {
  console.log('子进程退出，退出码:', code);
});

// child-process.js
process.on('message', (payload) => {
  if (payload.command === 'compute') {
    const sum = payload.data.reduce((a, b) => a + b, 0);
    process.send({ result: sum });
  }
});
```

#### 2.2.4 Cluster 模块实现多进程

```javascript
// cluster 模块实现多进程负载均衡
const cluster = require('cluster');
const os = require('os');

const numCPUs = os.cpus().length;

if (cluster.isMaster) {
  console.log(`主进程 ${process.pid} 正在运行`);

  // 衍生工作进程
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // 监听工作进程退出
  cluster.on('exit', (worker, code, signal) => {
    console.log(`工作进程 ${worker.process.pid} 退出`);
    // 重启工作进程
    console.log('正在重启工作进程...');
    cluster.fork();
  });
} else {
  // 工作进程可以运行任何 Node.js 代码
  const http = require('http');

  const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end(`响应来自进程 ${process.pid}\n`);
  });

  server.listen(8000, () => {
    console.log(`工作进程 ${process.pid} 启动，监听端口 8000`);
  });
}
```

#### 2.2.5 Worker Threads 实现真正的多线程

```javascript
// worker-threads 实现真正的多线程
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (isMainThread) {
  // 主线程代码
  const worker = new Worker(__filename, {
    workerData: { value: 100 }
  });

  worker.on('message', (msg) => {
    console.log('主线程收到结果:', msg);
  });

  worker.on('error', (err) => {
    console.error('Worker 错误:', err);
  });

  worker.on('exit', (code) => {
    if (code !== 0) {
      console.error('Worker 退出，退出码:', code);
    }
  });
} else {
  // Worker 线程代码
  const { workerData } = require('worker_threads');

  // 模拟耗时计算
  let result = 0;
  for (let i = 0; i < workerData.value; i++) {
    result += i;
  }

  // 将结果发送给主线程
  parentPort.postMessage(result);
}
```

#### 2.2.6 进程守护与 PM2 实践

```javascript
// ecosystem.config.js - PM2 配置文件
module.exports = {
  apps: [{
    name: 'my-app',
    script: './app.js',
    instances: 'max', // 使用所有 CPU 核心
    exec_mode: 'cluster', // 集群模式
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    // 日志配置
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    log_file: './logs/combined.log',
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    // 进程守护配置
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    // 健康检查
    wait_ready: true,
    listen_timeout: 3000,
    // 平滑重启
    kill_timeout: 5000
  }]
};

// PM2 常用命令
// pm2 start ecosystem.config.js
// pm2 list
// pm2 logs my-app
// pm2 restart my-app
// pm2 reload my-app (平滑重启)
// pm2 stop my-app
// pm2 delete my-app
// pm2 monit (监控面板)
// pm2 plus (在线监控)
```

#### 2.2.7 经典面试题：Node.js 是单线程的吗？

```javascript
// 常见面试题解答

// Q1: Node.js 是单线程的吗？
// A: Node.js 主线程是单线程的，但 I/O 操作由 libuv 线程池处理，
//    可以理解为"单线程事件循环 + 多线程 I/O"架构。

// Q2: 为什么 Node.js 能处理高并发？
// A: 虽然是单线程，但通过事件循环和非阻塞 I/O，可以高效处理大量并发请求。
//    当进行 I/O 操作时，线程不会被阻塞，可以继续处理其他请求。

// Q3: 单线程的缺点是什么？
// A: 1. 无法利用多核 CPU
//    2. 计算密集型任务会阻塞事件循环
//    3. 一个未处理的异常会导致整个进程崩溃

// Q4: 如何解决单线程问题？
// A: 1. 使用 Cluster 模块利用多核
//    2. 使用 Worker Threads 进行 CPU 密集型计算
//    3. 将计算密集型任务拆分，使用子进程处理
//    4. 合理设计架构，避免阻塞事件循环
```

### 2.3 Buffer 与 Stream

**面试常问题目**:
Node.js 中的 Buffer 和 Stream 是处理二进制数据和流式数据的重要概念。理解它们的工作原理对于编写高效的 Node.js 应用至关重要。

#### 2.3.1 Buffer 核心概念

```javascript
// Buffer 是 Node.js 用于处理二进制数据的类

// 1. 创建 Buffer
const buf1 = Buffer.alloc(10); // 分配 10 字节的初始化内存
const buf2 = Buffer.allocUnsafe(10); // 快速分配，未初始化
const buf3 = Buffer.from('hello'); // 从字符串创建
const buf4 = Buffer.from([1, 2, 3, 4]); // 从数组创建
const buf5 = Buffer.from('5a7f8e', 'hex'); // 从十六进制字符串创建

// 2. Buffer 与字符串转换
const str = '你好 Node.js';
const buf = Buffer.from(str, 'utf8');
console.log('字符串转 Buffer:', buf);
console.log('Buffer 转字符串:', buf.toString('utf8'));
console.log('Buffer 长度:', buf.length);

// 3. Buffer 常用操作
const buffer = Buffer.from('Hello World');

// 访问字节
console.log('第0个字节:', buffer[0]); // 72

// 写入数据
buffer.write('Hi', 0, 2, 'utf8');
console.log('写入后:', buffer.toString());

// 截取子 Buffer
const subBuf = buffer.slice(0, 5);
console.log('截取:', subBuf.toString());

// 复制 Buffer
const copyBuf = Buffer.alloc(5);
buffer.copy(copyBuf, 0, 0, 5);
console.log('复制:', copyBuf.toString());

// 拼接 Buffer
const bufA = Buffer.from('Hello');
const bufB = Buffer.from(' World');
const combined = Buffer.concat([bufA, bufB]);
console.log('拼接:', combined.toString());
```

#### 2.3.2 Stream 核心概念

```javascript
// Stream 有四种类型

// 1. Readable Stream (可读流)
const { Readable } = require('stream');

class MyReadable extends Readable {
  constructor(data) {
    super();
    this.data = data;
    this.index = 0;
  }

  _read() {
    if (this.index < this.data.length) {
      const chunk = this.data[this.index++];
      console.log('推送数据块:', chunk);
      this.push(chunk);
    } else {
      this.push(null); // 表示数据结束
    }
  }
}

const readable = new MyReadable(['a', 'b', 'c', 'd']);

// 消费可读流
readable.on('data', (chunk) => {
  console.log('收到数据:', chunk.toString());
});

readable.on('end', () => {
  console.log('数据读取完成');
});

readable.on('error', (err) => {
  console.error('错误:', err);
});
```

#### 2.3.3 文件流操作

```javascript
const fs = require('fs');
const path = require('path');

// 1. 读取文件流
const readStream = fs.createReadStream(
  path.join(__dirname, 'large-file.txt'),
  {
    encoding: 'utf8',
    highWaterMark: 64 * 1024, // 64KB 缓冲区
    start: 0,
    end: 1000
  }
);

readStream.on('data', (chunk) => {
  console.log('接收到数据块，大小:', chunk.length);
});

readStream.on('end', () => {
  console.log('文件读取完成');
});

readStream.on('error', (err) => {
  console.error('读取错误:', err);
});

// 2. 写入文件流
const writeStream = fs.createWriteStream(
  path.join(__dirname, 'output.txt'),
  {
    flags: 'a', // 追加模式
    encoding: 'utf8',
    highWaterMark: 16 * 1024
  }
);

for (let i = 0; i < 100; i++) {
  const canContinue = writeStream.write(`第 ${i} 行数据\n`);
  if (!canContinue) {
    console.log('缓冲区已满，等待 drain 事件');
    await new Promise(resolve => writeStream.once('drain', resolve));
  }
}

writeStream.end('写入完成');

// 3. 管道流 (pipe)
const zlib = require('zlib');

// 压缩文件示例
fs.createReadStream('./input.txt')
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream('./input.txt.gz'));

// 解压文件示例
fs.createReadStream('./input.txt.gz')
  .pipe(zlib.createGunzip())
  .pipe(fs.createWriteStream('./input-uncompressed.txt'));

// 4. Transform 流 (转换流)
const { Transform } = require('stream');

class UpperCaseTransform extends Transform {
  _transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback();
  }
}

const transform = new UpperCaseTransform();

transform.on('data', (chunk) => {
  console.log('转换后:', chunk.toString());
});

transform.write('hello ');
transform.write('world');
transform.end();
```

#### 2.3.4 Stream 背压问题与解决

```javascript
// Stream 背压问题及解决方案

const fs = require('fs');

// 错误示例：未处理背压
function copyFileWrong(source, dest) {
  const readStream = fs.createReadStream(source);
  const writeStream = fs.createWriteStream(dest);

  readStream.on('data', (chunk) => {
    // 直接写入，不检查返回结果
    const result = writeStream.write(chunk);
    if (!result) {
      // 背压发生，但未处理
      console.log('发生背压！');
    }
  });

  readStream.on('end', () => {
    writeStream.end();
  });
}

// 正确示例：使用 pipe 或手动处理背压
function copyFileCorrect(source, dest) {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(source);
    const writeStream = fs.createWriteStream(dest);

    readStream.on('data', (chunk) => {
      const canContinue = writeStream.write(chunk);
      if (!canContinue) {
        // 暂停读取，等待 drain 事件
        readStream.pause();
        writeStream.once('drain', () => {
          readStream.resume();
        });
      }
    });

    readStream.on('end', () => {
      writeStream.end();
      resolve();
    });

    readStream.on('error', reject);
    writeStream.on('error', reject);
  });
}

// 最简方式：使用 pipe (Node.js 自动处理背压)
function copyFileWithPipe(source, dest) {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(source);
    const writeStream = fs.createWriteStream(dest);

    readStream.pipe(writeStream);

    writeStream.on('finish', resolve);
    readStream.on('error', reject);
    writeStream.on('error', reject);
  });
}
```

#### 2.3.5 经典面试题：Stream 在 BFF 中的应用

```javascript
// 面试题：在 BFF 中如何利用 Stream 处理大文件？

// 场景：后端返回 10GB 的日志文件，前端需要下载
// 方案：使用 Stream 边读边传，避免内存溢出

const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
  const filePath = '/path/to/large-file.log';

  // 设置响应头
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', 'attachment; filename="large-file.log"');

  // 使用 Stream 管道传输
  const readStream = fs.createReadStream(filePath);

  readStream.pipe(res);

  readStream.on('error', (err) => {
    res.statusCode = 500;
    res.end('文件读取错误');
  });

  req.on('close', () => {
    readStream.destroy();
  });
});

server.listen(3000);

// 场景：聚合多个后端接口，使用 Stream 进行流式处理
const axios = require('axios');

async function aggregateWithStream(req, res) {
  // 并行请求多个接口
  const [userRes, orderRes, productRes] = await Promise.all([
    axios.get('http://backend-api/user'),
    axios.get('http://backend-api/orders'),
    axios.get('http://backend-api/products')
  ]);

  // 使用 Stream 返回聚合数据
  res.setHeader('Content-Type', 'application/json');

  res.write('{');
  res.write(`"user":${JSON.stringify(userRes.data)},`);
  res.write(`"orders":${JSON.stringify(orderRes.data)},`);
  res.write(`"products":${JSON.stringify(productRes.data)}`);
  res.write('}');

  res.end();
}
```

### 2.4 Node.js 模块系统

**面试常问题目**:
Node.js 使用 CommonJS 模块系统，每个文件都是一个模块，通过 require 和 module.exports 进行模块导入导出。

#### 2.4.1 模块导出方式

```javascript
// module.js

// 方式1: exports 对象
exports.foo = function() {
  return 'foo';
};

exports.bar = 'bar';

// 方式2: module.exports
module.exports = {
  name: 'module',
  version: '1.0.0',

  // 导出函数
  fn: function() {
    return 'function';
  },

  // 导出类
  class: class MyClass {
    constructor() {
      this.value = 0;
    }
  },

  // 导出箭头函数
  arrowFn: () => 'arrow',

  // 导出异步函数
  asyncFn: async () => {
    return 'async result';
  }
};

// 方式3: 重新赋值 module.exports
module.exports = function() {
  console.log('直接导出函数');
};

// 方式4: 导出单例对象
module.exports = new class Service {
  constructor() {
    this.data = [];
  }

  add(item) {
    this.data.push(item);
  }
}();
```

#### 2.4.2 模块加载机制

```javascript
// require 加载顺序

// 1. 先检查缓存
// const cachedModule = require.cache[modulePath];

// 2. 加载顺序：
//    - 核心模块 (fs, path, http 等) -> 优先
//    - 相对路径模块 (./, ../) -> 次优先
//    - node_modules 模块 -> 最后查找

// 3. 文件扩展名查找顺序：
//    - .js
//    - .json
//    - .node (C++ 扩展)

// 4. 目录作为模块
//    - 查找 package.json 的 main 字段
//    - 查找 index.js

// 模块缓存示例
console.log('模块缓存:', require.cache);

// 清除指定模块缓存
delete require.cache[require.resolve('./myModule')];

// 动态导入模块
async function dynamicImport() {
  const module = await import('./es-module.mjs');
  module.default();
}
```

#### 2.4.3 模块循环引用

```javascript
// a.js
console.log('a.js 开始');
const b = require('./b');
console.log('a.js 结束');

module.exports = {
  name: 'a',
  b: b
};

// b.js
console.log('b.js 开始');
const a = require('./a');
console.log('b.js 结束');

module.exports = {
  name: 'b',
  a: a
};

// 输出:
// a.js 开始
// b.js 开始
// b.js 结束
// a.js 结束

// 原因: Node.js 使用浅拷贝解决循环引用问题，
//       当 a.js require b.js 时，a.js 模块对象已创建（但未完成初始化）
//       此时 b.js 可以获取到 a.js 的导出对象（但其属性可能尚未赋值）
```

#### 2.4.4 ES Modules vs CommonJS

```javascript
// ES Modules (需要设置 "type": "module" 或使用 .mjs 扩展名)

// import.js
import { foo, bar } from './module.js';
import defaultExport from './module.js';
import * as all from './module.js';

// 动态导入
const module = await import('./module.js');

// CommonJS
const { foo, bar } = require('./module.js');
const defaultExport = require('./module.js');

// 混合使用 (Node.js 12+ 支持)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const commonjsModule = require('./commonjs.cjs');
```

### 2.5 异步编程 (Promise、async/await)

**面试常问题目**:
Node.js 的异步编程是核心知识点，需要深入理解 Promise、async/await 的工作原理以及错误处理机制。

#### 2.5.1 Promise 深入理解

```javascript
// Promise 基础
const promise = new Promise((resolve, reject) => {
  // 异步操作
  setTimeout(() => {
    const success = true;
    if (success) {
      resolve('操作成功');
    } else {
      reject(new Error('操作失败'));
    }
  }, 1000);
});

promise
  .then(result => console.log(result))
  .catch(error => console.error(error))
  .finally(() => console.log('操作完成'));

// Promise 链式调用
fetchUser(1)
  .then(user => fetchUserPosts(user.id))
  .then(posts => fetchPostComments(posts[0].id))
  .then(comments => console.log(comments))
  .catch(error => console.error(error));

function fetchUser(id) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ id, name: 'User' + id });
    }, 100);
  });
}

function fetchUserPosts(userId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 1, userId, title: 'Post 1' },
        { id: 2, userId, title: 'Post 2' }
      ]);
    }, 100);
  });
}

function fetchPostComments(postId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 1, postId, text: 'Comment 1' },
        { id: 2, postId, text: 'Comment 2' }
      ]);
    }, 100);
  });
}
```

#### 2.5.2 Promise 并发处理

```javascript
// Promise.all - 所有 Promise 都成功才成功
const promise1 = Promise.resolve(1);
const promise2 = Promise.resolve(2);
const promise3 = Promise.resolve(3);

Promise.all([promise1, promise2, promise3])
  .then(values => console.log(values)); // [1, 2, 3]

// Promise.all - 任意一个失败则失败
const promises = [
  Promise.resolve(1),
  Promise.reject(new Error('error')),
  Promise.resolve(3)
];

Promise.all(promises)
  .then(values => console.log(values))
  .catch(error => console.error(error)); // Error: error

// Promise.allSettled - 等待所有 Promise 结束
Promise.allSettled(promises).then(results => {
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`Promise ${index}: ${result.value}`);
    } else {
      console.log(`Promise ${index}: ${result.reason}`);
    }
  });
});

// Promise.race - 返回最先完成（无论成功或失败）的 Promise
Promise.race([
  new Promise(resolve => setTimeout(() => resolve('fast'), 100)),
  new Promise(resolve => setTimeout(() => resolve('slow'), 200)),
  new Promise((_, reject) => setTimeout(() => reject(new Error('error')), 50))
]).then(value => console.log(value)); // 'error'

// Promise.any - 返回第一个成功的 Promise
Promise.any([
  Promise.reject(new Error('error1')),
  Promise.reject(new Error('error2')),
  Promise.resolve('success')
]).then(value => console.log(value)); // 'success'
```

#### 2.5.3 async/await 深入理解

```javascript
// async/await 是 Promise 的语法糖

// 基本用法
async function fetchData() {
  try {
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('获取数据失败:', error);
    throw error;
  }
}

// 并行执行多个 async 操作
async function fetchMultipleData() {
  // 串行执行 (不推荐)
//   const user = await fetchUser(1);
//   const posts = await fetchUserPosts(1);
//   const products = await fetchProducts();

// 并行执行 (推荐)
  const [user, posts, products] = await Promise.all([
    fetchUser(1),
    fetchUserPosts(1),
    fetchProducts()
  ]);

  return { user, posts, products };
}

// async 函数的返回值
async function asyncReturn() {
  // async 函数总是返回 Promise
  return '直接返回值'; // 等同于 Promise.resolve('直接返回值')
}

async function asyncThrow() {
  throw new Error('async 错误'); // 等同于 Promise.reject(new Error('async 错误'))
}

// await 会等待 Promise resolve，但不会改变其状态
async function awaitPromise() {
  const promise = Promise.resolve('resolved');

  const result = await promise;
  console.log(result); // 'resolved'

  // 如果 Promise 被拒绝，await 会抛出错误
  const rejectedPromise = Promise.reject(new Error('rejected'));

  try {
    await rejectedPromise;
  } catch (error) {
    console.error('捕获到错误:', error.message);
  }
}
```

#### 2.5.4 异步迭代器

```javascript
// for await...of 遍历异步迭代器

async function* asyncGenerator() {
  for (let i = 0; i < 3; i++) {
    await new Promise(resolve => setTimeout(resolve, 100));
    yield i;
  }
}

async function main() {
  for await (const value of asyncGenerator()) {
    console.log(value);
  }
}

main();

// 实际应用：流式处理
async function processStream(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
```

#### 2.5.5 经典面试题：async/await 错误处理

```javascript
// 面试题1: async/await vs Promise.then/catch

// 使用 Promise.then/catch
function fetchWithPromise() {
  return fetchData()
    .then(data => processData(data))
    .then(result => formatResult(result))
    .catch(error => {
      console.error('错误:', error);
      return defaultValue;
    });
}

// 使用 async/await
async function fetchWithAsyncAwait() {
  try {
    const data = await fetchData();
    const result = await processData(data);
    return await formatResult(result);
  } catch (error) {
    console.error('错误:', error);
    return defaultValue;
  }
}

// 面试题2: for...of 循环中的异步操作

// 错误示例：循环中的 await 会串行执行
async function wrongApproach(items) {
  const results = [];
  for (const item of items) {
    const result = await processItem(item); // 串行执行，效率低
    results.push(result);
  }
  return results;
}

// 正确示例：使用 Promise.all 并行执行
async function correctApproach(items) {
  const promises = items.map(item => processItem(item));
  return await Promise.all(promises);
}

// 正确示例：需要串行执行时
async function sequentialApproach(items) {
  const results = [];
  for (const item of items) {
    const result = await processItem(item);
    results.push(result);
  }
  return results;
}

// 面试题3: 立即执行 async 函数
(async () => {
  console.log('立即执行');
})();
```

### 2.6 Node.js 错误处理

**面试常问题目**:
Node.js 的错误处理机制是构建健壮应用的关键，需要理解同步和异步错误处理的差异。

#### 2.6.1 同步错误处理

```javascript
// try...catch 同步错误处理
try {
  const result = JSON.parse('invalid json');
} catch (error) {
  console.error('解析错误:', error.message);
}

// 捕获抛出错误
try {
  throw new Error('同步错误');
} catch (error) {
  console.error('捕获错误:', error.message);
}
```

#### 2.6.2 异步错误处理

```javascript
// 1. 回调函数错误处理
fs.readFile('./file.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('读取文件错误:', err);
    return;
  }
  console.log('文件内容:', data);
});

// 2. Promise 错误处理
fetchData()
  .then(data => console.log(data))
  .catch(error => console.error(error));

// 3. async/await 错误处理
async function handleAsyncError() {
  try {
    const data = await fetchData();
    return data;
  } catch (error) {
    console.error('异步错误:', error);
    throw error;
  }
}

// 4. process 事件监听
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  // 记录错误日志
  // 优雅退出
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
  // 记录错误日志
});
```

#### 2.6.3 域 (Domain) 模块 (已废弃)

```javascript
// Domain 模块在 Node.js 12+ 已废弃，使用 async_hooks 替代

// 旧代码示例 (仅作了解)
const domain = require('domain');

const d = domain.create();

d.on('error', (error) => {
  console.error('Domain 捕获错误:', error.message);
});

d.run(() => {
  // 这里的错误会被 domain 捕获
  throw new Error('Domain 内的错误');
});
```

#### 2.6.4 错误传播与错误类

```javascript
// 自定义错误类
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

// 使用自定义错误
async function fetchUser(id) {
  if (!id) {
    throw new ValidationError('用户ID不能为空');
  }

  const user = await db.users.find(id);
  if (!user) {
    throw new NotFoundError(`用户 ${id} 不存在`);
  }

  return user;
}

// 错误处理中间件
function errorHandler(err, req, res, next) {
  console.error('错误:', err);

  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: err.name,
      message: err.message
    });
  }

  if (err instanceof NotFoundError) {
    return res.status(404).json({
      error: err.name,
      message: err.message
    });
  }

  // 未知错误
  res.status(500).json({
    error: 'InternalServerError',
    message: '服务器内部错误'
  });
}
```

### 2.7 Node.js 性能优化

**面试常问题目**:
Node.js 性能优化涉及多个方面，包括内存管理、CPU 使用、I/O 优化等。

#### 2.7.1 内存管理与垃圾回收

```javascript
// 1. 手动触发垃圾回收 (仅在需要时使用)
if (global.gc) {
  global.gc();
}

// 2. 监控内存使用
function monitorMemory() {
  const used = process.memoryUsage();
  console.log('内存使用情况:');
  console.log(`  heapUsed: ${Math.round(used.heapUsed / 1024 / 1024)} MB`);
  console.log(`  heapTotal: ${Math.round(used.heapTotal / 1024 / 1024)} MB`);
  console.log(`  rss: ${Math.round(used.rss / 1024 / 1024)} MB`);
  console.log(`  external: ${Math.round(used.external / 1024 / 1024)} MB`);
}

// 3. 避免内存泄漏
// 常见内存泄漏场景及解决方案

// 场景1: 全局变量
// 错误
global.someData = [];

// 正确
const someData = [];

// 场景2: 闭包
// 错误 - 闭包引用大对象
function leak() {
  const largeData = new Array(1000000);
  return function() {
    return largeData; // largeData 不会被回收
  };
}

// 正确
function noLeak() {
  const largeData = new Array(1000000);
  return function() {
    return largeData.length; // 只保留需要的属性
  };
}

// 场景3: 事件监听器未移除
const emitter = new EventEmitter();

// 错误 - 重复添加监听器
function addHandler() {
  emitter.on('event', handler); // 每次调用都会添加，导致内存泄漏
}

// 正确 - 移除后再添加
function addHandlerFixed() {
  emitter.removeListener('event', handler); // 先移除
  emitter.on('event', handler); // 再添加
}

// 场景4: 定时器未清理
// 错误
function startTimer() {
  setInterval(() => {
    // 定时任务
  }, 1000);
}

// 正确
const timers = [];
function startTimerFixed() {
  const timer = setInterval(() => {
    // 定时任务
  }, 1000);
  timers.push(timer);
}

function stopAllTimers() {
  timers.forEach(clearInterval);
  timers.length = 0;
}
```

#### 2.7.2 V8 引擎优化技巧

```javascript
// 1. 优化对象结构 - 使用相同形状的对象
// 不好 - 对象形状不一致
const users1 = [
  { name: 'Alice', age: 25 },
  { age: 30, name: 'Bob' }, // 不同顺序
  { name: 'Charlie', age: 35, city: 'NYC' } // 更多属性
];

// 好 - 对象形状一致
const users2 = [
  { name: 'Alice', age: 25, city: '' },
  { name: 'Bob', age: 30, city: '' },
  { name: 'Charlie', age: 35, city: 'NYC' }
];

// 2. 避免数组中混合类型
// 不好
const mixed = [1, 'two', { three: 3 }];

// 好
const numbers = [1, 2, 3];
const strings = ['one', 'two', 'three'];

// 3. 使用构造函数创建对象
// 好 - 使用构造函数
class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

// 不好 - 使用对象字面量每次创建新结构
function createPoint(x, y) {
  return { x, y };
}

// 4. 预分配数组大小
// 好
const arr = new Array(1000);
for (let i = 0; i < 1000; i++) {
  arr[i] = i;
}
```

#### 2.7.3 I/O 优化

```javascript
const fs = require('fs').promises;
const path = require('path');

// 1. 使用流处理大文件
async function processLargeFile(filePath) {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(filePath, {
      highWaterMark: 64 * 1024
    });

    let lineCount = 0;

    readStream.on('data', (chunk) => {
      // 逐块处理
      const lines = chunk.toString().split('\n');
      lineCount += lines.length;
    });

    readStream.on('end', () => resolve(lineCount));
    readStream.on('error', reject);
  });
}

// 2. 批量操作减少 I/O 次数
async function batchWrite() {
  const data = generateData(10000);

  // 不好 - 逐条写入
  // for (const item of data) {
  //   await fs.writeFile(`./data/${item.id}.json', JSON.stringify(item));
  // }

  // 好 - 批量写入
  const batch = data.map(item => ({
    path: path.join(__dirname, 'data', `${item.id}.json`),
    content: JSON.stringify(item)
  }));

  await Promise.all(
    batch.map(b => fs.writeFile(b.path, b.content))
  );

  // 更好 - 写入单个大文件
  const combined = data.map(item => JSON.stringify(item)).join('\n');
  await fs.writeFile('./data/all.json', combined);
}

// 3. 使用缓存减少重复 I/O
const cache = new Map();

async function readWithCache(filePath) {
  const cached = cache.get(filePath);
  if (cached) {
    return cached;
  }

  const data = await fs.readFile(filePath, 'utf8');
  cache.set(filePath, data);
  return data;
}

// 4. 异步 I/O vs 同步 I/O
function ioComparison() {
  // 同步 - 阻塞
  const data1 = fs.readFileSync('./file.txt', 'utf8');

  // 异步 - 非阻塞
  fs.readFile('./file.txt', 'utf8', (err, data2) => {
    console.log(data2);
  });

  // Promise 风格
  fs.readFile('./file.txt', 'utf8')
    .then(data3 => console.log(data3));
}
```

#### 2.7.4 连接池与资源复用

```javascript
// 1. HTTP 连接池
const http = require('http');
const agent = new http.Agent({
  keepAlive: true,
  maxSockets: 10,
  maxFreeSockets: 5,
  timeout: 60000
});

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { agent }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
  });
}

// 2. 数据库连接池
const { Pool } = require('pg');

const pool = new Pool({
  max: 20, // 最大连接数
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

async function queryWithPool(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows;
  } finally {
    client.release(); // 释放连接回池中
  }
}

// 3. Redis 连接池
const Redis = require('ioredis');

const redis = new Redis({
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  lazyConnect: true
});

async function useRedis() {
  await redis.connect();
  // 使用 Redis
}
```

---

## 第三章 BFF 架构深入

### 3.1 BFF 定义与优势详解

**面试常问题目**:
BFF（Backend For Frontend）模式是微服务架构中的一种前端适配层，它为每种前端类型提供定制化的后端服务。

#### 3.1.1 传统架构 vs BFF 架构

```javascript
// 传统架构示例
// 前端需要调用多个后端接口

// 场景：获取用户详情页数据
// 前端代码
async function fetchUserPageData(userId) {
  // 需要调用 5 个接口
  const user = await axios.get(`/api/users/${userId}`);
  const posts = await axios.get(`/api/users/${userId}/posts`);
  const followers = await axios.get(`/api/users/${userId}/followers`);
  const settings = await axios.get(`/api/users/${userId}/settings`);
  const notifications = await axios.get(`/api/notifications?userId=${userId}`);

  // 等待所有请求完成
  const [userRes, postsRes, followersRes, settingsRes, notificationsRes] =
    await Promise.all([
      user, posts, followers, settings, notifications
    ]);

  return {
    user: userRes.data,
    posts: postsRes.data,
    followers: followersRes.data,
    settings: settingsRes.data,
    notifications: notificationsRes.data
  };
}

// BFF 架构示例
// BFF 层聚合所有接口

// BFF 服务端代码
app.get('/api/bff/user-page/:userId', async (req, res) => {
  const { userId } = req.params;

  // 并行调用后端服务
  const [user, posts, followers, settings, notifications] = await Promise.all([
    userService.getUser(userId),
    postService.getUserPosts(userId),
    socialService.getFollowers(userId),
    userService.getSettings(userId),
    notificationService.getUserNotifications(userId)
  ]);

  // 按前端需求聚合数据
  res.json({
    user: {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      bio: user.bio
    },
    posts: posts.map(p => ({
      id: p.id,
      title: p.title,
      preview: p.content.substring(0, 100)
    })),
    followers: {
      count: followers.length,
      avatars: followers.slice(0, 5).map(f => f.avatar)
    },
    settings: settings.theme,
    notifications: {
      unread: notifications.filter(n => !n.read).length,
      latest: notifications.slice(0, 3)
    }
  });
});

// 前端代码 - 简单多了
async function fetchUserPageData(userId) {
  const response = await axios.get(`/api/bff/user-page/${userId}`);
  return response.data;
}
```

#### 3.1.2 BFF 的核心优势详解

```javascript
// 1. 减少网络请求
// 对比分析
const WITHOUT_BFF = {
  requests: 5, // 需要 5 个请求
  latency: 300, // 假设每个请求 300ms，串行需要 1500ms
  bandwidth: '500KB' // 每次传输冗余数据
};

const WITH_BFF = {
  requests: 1, // 只需 1 个请求
  latency: 400, // 聚合请求 400ms
  bandwidth: '80KB' // 只传输需要的数据
};

// 2. 保护前端免受后端变化影响
// 后端 API 变更时，只需修改 BFF 层

// 场景：后端将用户名称字段从 name 改为 fullName
// BFF 层处理
app.get('/api/bff/user/:id', async (req, res) => {
  const user = await userService.getUser(req.params.id);

  // BFF 层统一字段名
  res.json({
    name: user.fullName || user.name, // 兼容新旧字段
    // 其他字段处理...
  });
});

// 前端无感知，继续使用 name 字段

// 3. 接口定制化
// 不同端返回不同数据

// Web 端 - 返回完整数据
app.get('/api/bff/products/web', async (req, res) => {
  const products = await productService.getProducts();

  res.json({
    items: products.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description, // Web 端需要详细描述
      price: p.price,
      images: p.images,
      details: p.details
    }))
  });
});

// Mobile 端 - 返回精简数据
app.get('/api/bff/products/mobile', async (req, res) => {
  const products = await productService.getProducts();

  res.json({
    items: products.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      thumbnail: p.images[0] // Mobile 端只需缩略图
    }))
  });
});

// 4. 服务端渲染支持
// BFF 层可以做 SSR
```

### 3.2 BFF 技术选型

**面试常问题目**:
BFF 层的技术选型需要考虑多个因素，包括团队技术栈、性能要求、可维护性等。

#### 3.2.1 框架选型对比

```javascript
// 1. Express.js
// 优点：轻量、灵活、生态丰富
// 缺点：缺乏结构化、TypeScript 支持一般

const express = require('express');
const app = express();

app.get('/api/bff/user/:id', async (req, res) => {
  const user = await userService.getUser(req.params.id);
  res.json(user);
});

app.listen(3000);

// 2. Koa.js
// 优点：更轻量、async/await 原生支持、中间件机制优雅
// 缺点：需要自行组合中间件

const Koa = require('koa');
const Router = require('@koa/router');

const app = new Koa();
const router = new Router();

router.get('/api/bff/user/:id', async (ctx) => {
  const user = await userService.getUser(ctx.params.id);
  ctx.body = user;
});

app.use(router.routes());
app.listen(3000);

// 3. NestJS
// 优点：企业级、TypeScript、依赖注入、模块化
// 缺点：学习曲线较陡

// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();

// user.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('api/bff/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.userService.getUser(id);
  }
}

// 4. Fastify
// 优点：性能极高、Schema 验证、插件系统
// 缺点：生态相对较小

const fastify = require('fastify')({ logger: true });

fastify.get('/api/bff/user/:id', async (request, reply) => {
  const user = await userService.getUser(request.params.id);
  return user;
});

fastify.listen(3000);
```

#### 3.2.2 TypeScript 在 BFF 中的重要性

```typescript
// TypeScript 类型定义示例

// 1. 接口定义
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Post {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: Date;
}

// 2. BFF 聚合类型
interface BFFUserPageResponse {
  user: {
    id: User['id'];
    name: User['name'];
    avatar: User['avatar'];
  };
  posts: Array<{
    id: Post['id'];
    title: Post['title'];
    preview: string;
  }>;
  totalPosts: number;
}

// 3. 服务层接口
interface UserService {
  getUser(id: string): Promise<User>;
  getUserPosts(userId: string): Promise<Post[]>;
}

// 4. 泛型使用
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

async function fetchUser(id: string): Promise<ApiResponse<User>> {
  try {
    const user = await userService.getUser(id);
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### 3.3 服务端渲染 (SSR)

**面试常问题目**:
服务端渲染是 BFF 层的重要功能之一，可以提升首屏加载速度和 SEO 效果。

#### 3.3.1 Next.js SSR 实现

```javascript
// pages/user/[id].js - 服务端渲染页面
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

export async function getServerSideProps(context) {
  const { id } = context.params;

  // 在服务端获取数据
  const [user, posts] = await Promise.all([
    userService.getUser(id),
    postService.getUserPosts(id)
  ]);

  return {
    props: {
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar
      },
      posts: posts.map(p => ({
        id: p.id,
        title: p.title,
        preview: p.content.substring(0, 100)
      }))
    }
  };
}

export default function UserPage({ user, posts }) {
  return (
    <div>
      <h1>{user.name}</h1>
      <img src={user.avatar} alt={user.name} />
      <ul>
        {posts.map(post => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}

// API 路由 - BFF 接口
// pages/api/bff/user/[id].js
export default async function handler(req, res) {
  const { id } = req.query;

  const [user, posts, followers] = await Promise.all([
    userService.getUser(id),
    postService.getUserPosts(id),
    socialService.getFollowers(id)
  ]);

  res.status(200).json({
    user: {
      id: user.id,
      name: user.name,
      avatar: user.avatar
    },
    posts,
    followers
  });
}
```

#### 3.3.2 自定义 SSR 实现

```javascript
// 自定义 SSR 服务 (使用 Express + React)
const express = require('express');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const App = require('./App').default;

const app = express();

// 服务端渲染路由
app.get('/ssr/user/:id', async (req, res) => {
  const { id } = req.params;

  // 获取数据
  const user = await userService.getUser(id);
  const posts = await postService.getUserPosts(id);

  // 创建初始状态
  const initialState = {
    user,
    posts
  };

  // 服务端渲染 React 组件
  const html = ReactDOMServer.renderToString(
    React.createElement(App, { initialState })
  );

  // 返回完整 HTML
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${user.name} - 用户主页</title>
      <meta name="description" content="${user.bio || ''}">
    </head>
    <body>
      <div id="root">${html}</div>
      <script>
        window.__INITIAL_STATE__ = ${JSON.stringify(initialState)}
      </script>
      <script src="/bundle.js"></script>
    </body>
    </html>
  `);
});

// 静态资源
app.use(express.static('public'));
```

#### 3.3.3 SSR 性能优化

```javascript
// 1. 缓存策略
const cache = new Map();

async function ssrWithCache(req, res, next) {
  const cacheKey = req.originalUrl;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 60000) {
    return res.send(cached.html);
  }

  const html = await renderToString(req, res);

  cache.set(cacheKey, {
    html,
    timestamp: Date.now()
  });

  res.send(html);
}

// 2. 流式渲染
import { renderToPipeableStream } from 'react-dom/server';

app.get('/stream/:id', async (req, res) => {
  res.setHeader('Content-Type', 'text/html');

  const { pipe } = renderToPipeableStream(
    <App userId={req.params.id} />,
    {
      onShellReady() {
        // 流开始可以发送
        res.statusCode = 200;
        pipe(res);
      },
      onShellError() {
        res.statusCode = 500;
        res.end('Error');
      },
      onAllReady() {
        // 所有内容准备完毕
      }
    }
  );
});

// 3. 选择性水合
// 只对关键交互元素进行水合
```

### 3.4 接口聚合

**面试常问题目**:
接口聚合是 BFF 的核心功能之一，需要高效地组合多个后端服务的数据。

#### 3.4.1 基础接口聚合

```javascript
// 1. 简单聚合
app.get('/api/bff/dashboard', async (req, res) => {
  const userId = req.user.id;

  const [user, notifications, stats] = await Promise.all([
    userService.getUser(userId),
    notificationService.getUnread(userId),
    statsService.getUserStats(userId)
  ]);

  res.json({
    user: {
      name: user.name,
      avatar: user.avatar
    },
    notifications: notifications.slice(0, 5),
    stats: {
      posts: stats.postCount,
      followers: stats.followerCount,
      views: stats.totalViews
    }
  });
});

// 2. 条件聚合
app.get('/api/bff/products/:category', async (req, res) => {
  const { category } = req.params;
  const { sort, page, limit } = req.query;

  const [products, categories] = await Promise.all([
    productService.getProducts({ category, sort, page: +page, limit: +limit }),
    categoryService.getCategories()
  ]);

  res.json({
    products: products.items,
    pagination: {
      page: +page,
      limit: +limit,
      total: products.total
    },
    categories
  });
});

// 3. 嵌套依赖聚合
app.get('/api/bff/order/:id', async (req, res) => {
  const { id } = req.params;

  // 先获取订单
  const order = await orderService.getOrder(id);

  // 再根据订单获取详情
  const [items, address, invoice] = await Promise.all([
    orderItemService.getOrderItems(order.id),
    addressService.getAddress(order.addressId),
    invoiceService.getInvoice(order.invoiceId)
  ]);

  res.json({
    order: {
      id: order.id,
      status: order.status,
      total: order.total,
      createdAt: order.createdAt
    },
    items: items.map(item => ({
      productId: item.productId,
      name: item.productName,
      price: item.price,
      quantity: item.quantity
    })),
    address,
    invoice
  });
});
```

#### 3.4.2 错误处理与降级

```javascript
// 接口聚合中的错误处理

app.get('/api/bff/robust-dashboard', async (req, res) => {
  const userId = req.user.id;

  // 使用 Promise.allSettled 处理部分失败
  const results = await Promise.allSettled([
    userService.getUser(userId),
    notificationService.getUnread(userId),
    statsService.getUserStats(userId),
    recommendationService.getRecommendations(userId)
  ]);

  // 提取成功的结果
  const user = results[0].status === 'fulfilled' ? results[0].value : null;
  const notifications = results[1].status === 'fulfilled' ? results[1].value : [];
  const stats = results[2].status === 'fulfilled' ? results[2].value : {};
  const recommendations = results[3].status === 'fulfilled' ? results[3].value : [];

  // 如果关键服务失败，返回错误
  if (!user) {
    return res.status(503).json({
      error: 'Service temporarily unavailable',
      message: '核心服务暂时不可用'
    });
  }

  // 部分数据可以使用缓存或默认值
  res.json({
    user: {
      name: user.name,
      avatar: user.avatar
    },
    notifications: notifications.slice(0, 5),
    stats: {
      posts: stats.postCount || 0,
      followers: stats.followerCount || 0
    },
    recommendations,
    warnings: results
      .filter(r => r.status === 'rejected')
      .map((r, i) => ['通知', '统计', '推荐'][i])
  });
});
```

### 3.5 鉴权方案

**面试常问题目**:
BFF 层的鉴权方案需要考虑安全性、用户体验和后端服务集成。

#### 3.5.1 JWT 鉴权

```javascript
// JWT 生成与验证
const jwt = require('jsonwebtoken');

// 生成 Token
function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
}

// 验证 Token
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// 中间件
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.user = decoded;
  next();
}

// BFF 层使用
app.get('/api/bff/user/profile', authMiddleware, async (req, res) => {
  const user = await userService.getUser(req.user.id);

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar
  });
});
```

#### 3.5.2 Session 鉴权

```javascript
// Session 鉴权
const session = require('express-session');
const RedisStore = require('connect-redis').default;

app.use(session({
  store: new RedisStore({
    client: redisClient
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // HTTPS only
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// 登录
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await authService.verify(email, password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  req.session.userId = user.id;
  req.session.role = user.role;

  res.json({ success: true });
});

// 登出
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// 验证 Session
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}
```

#### 3.5.3 OAuth 2.0 集成

```javascript
// OAuth 2.0 第三方登录

const axios = require('axios');

// 1. 授权码模式
app.get('/auth/github', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = encodeURIComponent(process.env.GITHUB_CALLBACK_URL);

  res.redirect(
    `https://github.com/login/oauth/authorize?` +
    `client_id=${clientId}&` +
    `redirect_uri=${redirectUri}&` +
    `scope=read:user`
  );
});

app.get('/auth/github/callback', async (req, res) => {
  const { code } = req.query;

  // 交换访问令牌
  const tokenResponse = await axios.post(
    'https://github.com/login/oauth/access_token',
    {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code
    },
    { headers: { Accept: 'application/json' } }
  );

  const accessToken = tokenResponse.data.access_token;

  // 获取用户信息
  const userResponse = await axios.get(
    'https://api.github.com/user',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  // 创建或更新用户
  const user = await userService.upsertFromGitHub(userResponse.data);

  // 生成应用 Token
  const token = generateToken(user);

  // 返回给前端
  res.redirect(`/callback?token=${token}`);
});

// 2. BFF 层代理 OAuth
app.post('/api/bff/oauth/token', async (req, res) => {
  const { provider, code } = req.body;

  const tokenData = await oauthService.exchangeCode(provider, code);

  res.json(tokenData);
});
```

---

## 第四章 NestJS 深入

### 4.1 NestJS 核心概念

**面试常问题目**:
NestJS 是一个用于构建高效、可扩展的 Node.js 服务器端应用的框架。

#### 4.1.1 依赖注入

```typescript
// 依赖注入示例

// 1. 服务提供者
// user.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  private users = [];

  findAll() {
    return this.users;
  }

  findOne(id: string) {
    return this.users.find(user => user.id === id);
  }

  create(user: any) {
    this.users.push(user);
    return user;
  }
}

// 2. 控制器
// user.controller.ts
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  // 依赖注入
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Post()
  create(@Body() createUserDto: any) {
    return this.userService.create(createUserDto);
  }
}

// 3. 模块
// user.module.ts
import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule {}

// 4. 根模块
// app.module.ts
import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';

@Module({
  imports: [UserModule]
})
export class AppModule {}
```

#### 4.1.2 装饰器与路由

```typescript
// NestJS 装饰器详解

// 1. 路由装饰器
@Controller('api')
export class AppController {
  @Get('users')           // GET /api/users
  @Post('users')          // POST /api/users
  @Put('users/:id')       // PUT /api/users/:id
  @Delete('users/:id')    // DELETE /api/users/:id
  @Patch('users/:id')     // PATCH /api/users/:id

  @Get('users/:id/posts') // GET /api/users/:id/posts
  getUserPosts(@Param('id') id: string) {}

  // 2. 参数装饰器
  @Get('query')
  getByQuery(
    @Query('id') id: string,
    @Query('name') name: string,
    @Query() query: any
  ) {}

  @Post('body')
  postBody(
    @Body() body: any,
    @Body('id') id: string
  ) {}

  @Get('headers')
  getHeaders(@Headers() headers: any) {}

  // 3. 自定义装饰器
  import { createParamDecorator, ExecutionContext } from '@nestjs/common';

  export const CurrentUser = createParamDecorator(
    (data: string, ctx: ExecutionContext) => {
      const request = ctx.switchToHttp().getRequest();
      const user = request.user;
      return data ? user?.[data] : user;
    }
  );

  @Get('profile')
  getProfile(@CurrentUser() user: any) {}

  @Get('profile/:field')
  getProfileField(@CurrentUser('id') userId: string) {}
}
```

### 4.2 NestJS 中间件与拦截器

```typescript
// 1. 中间件
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, originalUrl } = req;

    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${method} ${originalUrl} - ${res.statusCode} - ${duration}ms`);
    });

    next();
  }
}

// 2. 全局中间件
// main.ts
const app = await NestFactory.create(AppModule);
app.use(LoggerMiddleware);

// 3. 拦截器
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    return next
      .handle()
      .pipe(
        tap(() => {
          const response = context.switchToHttp().getResponse();
          console.log(`${method} ${url} - ${Date.now() - now}ms - ${response.statusCode}`);
        })
      );
  }
}

// 4. 异常过滤器
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message: typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message
    });
  }
}

// 使用拦截器和过滤器
@Controller('users')
@UseInterceptors(LoggingInterceptor)
@UseFilters(HttpExceptionFilter)
export class UserController {
  // ...
}
```

### 4.3 NestJS 与微服务

```typescript
// NestJS 微服务

// 1. TCP 微服务
// main.ts
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        port: 3001,
      },
    },
  );

  await app.listen();
  console.log('TCP Microservice is listening...');
}

// 微服务控制器
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class MathController {
  @MessagePattern('add')
  add(data: number[]): number {
    return data.reduce((a, b) => a + b, 0);
  }

  @MessagePattern('multiply')
  multiply(data: number[]): number {
    return data.reduce((a, b) => a * b, 1);
  }
}

// 2. gRPC 微服务
// main.ts
async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'math',
        protoPath: join(__dirname, 'math.proto'),
      },
    },
  );

  await app.listen();
}
```

---

## 第五章 面试高频问题汇总

### 5.1 Node.js 基础面试题

```javascript
// Q1: Node.js 事件循环的执行顺序是什么？
// A:
// 1. 同步代码执行
// 2. process.nextTick 队列
// 3. Promise.then 队列 (微任务)
// 4. Timers 阶段 (setTimeout, setInterval)
// 5. Pending callbacks
// 6. Idle, Prepare
// 7. Poll 阶段 (I/O 回调)
// 8. Check 阶段 (setImmediate)
// 9. Close callbacks

// Q2: Node.js 是单线程的吗？
// A: Node.js 主线程是单线程的，但 I/O 操作由 libuv 线程池处理。
//    可以使用 Cluster 模块或 Worker Threads 实现多线程。

// Q3: 什么是 Buffer？
// A: Buffer 是 Node.js 用来处理二进制数据的类，类似于整数数组，
//    但对应于 V8 堆内存之外的原始内存分配。

// Q4: 什么是 Stream？
// A: Stream 是 Node.js 处理流式数据的抽象接口，有四种类型：
//    Readable (可读)、Writable (可写)、Duplex (双工)、Transform (转换)

// Q5: 为什么需要 BFF？
// A:
// 1. 减少前端请求次数，聚合后端服务
// 2. 保护前端免受后端 API 变化影响
// 3. 为不同前端提供定制化接口
// 4. 支持服务端渲染

// Q6: Express vs Koa vs NestJS 区别？
// A:
// - Express: 轻量、灵活、生态成熟，但缺乏结构化
// - Koa: 更轻量、async/await 原生支持、中间件机制优雅
// - NestJS: 企业级、TypeScript 支持、依赖注入、模块化

// Q7: Node.js 如何处理高并发？
// A:
// 1. 事件循环 + 非阻塞 I/O
// 2. Cluster 模块利用多核
// 3. 合理使用缓存
// 4. 连接池复用

// Q8: 什么是背压问题？如何解决？
// A: 背压是指数据产生速度大于消费速度导致内存溢出的问题。
//    解决：使用 pipe() 方法或手动 pause/resume 机制。

// Q9: CommonJS vs ES Modules？
// A:
// - CommonJS: require/exports，同步加载
// - ES Modules: import/export，异步加载 (Node.js 12+ 支持混合使用)

// Q10: Promise vs async/await？
// A: async/await 是 Promise 的语法糖，让异步代码看起来像同步代码。
//    本质上都是基于 Promise 实现。
```

### 5.2 场景题与解决方案

```javascript
// 场景题1: 如何实现接口超时控制？

async function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Timeout')), ms);
  });

  return Promise.race([promise, timeout]);
}

// 使用
try {
  const result = await withTimeout(doSomething(), 5000);
} catch (error) {
  console.error('请求超时');
}

// 场景题2: 如何实现接口重试？

async function withRetry(fn, retries = 3, delay = 1000) {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise(r => setTimeout(r, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
}

// 场景题3: 如何实现接口限流？

class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  isAllowed(key) {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // 清理过期请求
    const validRequests = requests.filter(t => now - t < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }
}

// 场景题4: 如何处理循环依赖？

// 方案1: 使用 require 在函数内部
function A() {
  const B = require('./b');
  return B();
}

// 方案2: 延迟赋值
module.exports = {
  name: 'A',
  getB: function() {
    const B = require('./b');
    return B();
  }
};

// 场景题5: 如何优化大文件上传？

const multiparty = require('multiparty');
const fs = require('fs');
const path = require('path');

app.post('/upload', (req, res) => {
  const form = new multiparty.Form({
    uploadDir: '/tmp',
    maxFilesSize: 1024 * 1024 * 1024 // 1GB
  });

  form.on('part', (part) => {
    const filename = path.join('/uploads', part.filename);
    part.pipe(fs.createWriteStream(filename));
  });

  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true });
  });
});
```

### 5.3 手写代码题

```javascript
// 手写题1: 实现 Promise.all

function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(promises)) {
      return reject(new TypeError('参数必须是数组'));
    }

    const results = [];
    let completed = 0;

    if (promises.length === 0) {
      return resolve(results);
    }

    promises.forEach((promise, index) => {
      Promise.resolve(promise)
        .then(value => {
          results[index] = value;
          completed++;

          if (completed === promises.length) {
            resolve(results);
          }
        })
        .catch(reject);
    });
  });
}

// 手写题2: 实现 Promise.race

function promiseRace(promises) {
  return new Promise((resolve, reject) => {
    promises.forEach(promise => {
      Promise.resolve(promise)
        .then(resolve, reject);
    });
  });
}

// 手写题3: 实现深拷贝

function deepClone(obj, hash = new WeakMap()) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (hash.has(obj)) {
    return hash.get(obj);
  }

  const clone = Array.isArray(obj) ? [] : {};
  hash.set(obj, clone);

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clone[key] = deepClone(obj[key], hash);
    }
  }

  return clone;
}

// 手写题4: 实现防抖

function debounce(fn, delay) {
  let timer = null;

  return function(...args) {
    if (timer) clearTimeout(timer);

    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

// 手写题5: 实现节流

function throttle(fn, delay) {
  let lastTime = 0;

  return function(...args) {
    const now = Date.now();

    if (now - lastTime >= delay) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}

// 手写题6: 实现 LRU 缓存

class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return -1;

    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, value);
  }
}

// 手写题7: 实现继承

// 原型链继承
function Parent() {
  this.name = 'parent';
}

function Child() {
  Parent.call(this);
  this.type = 'child';
}

Child.prototype = new Parent();
Child.prototype.constructor = Child;

// ES6 Class 继承
class Parent {
  constructor() {
    this.name = 'parent';
  }
}

class Child extends Parent {
  constructor() {
    super();
    this.type = 'child';
  }
}
```

### 5.4 系统设计题

```javascript
// 场景：设计一个 BFF 服务

// 1. 整体架构
// ┌─────────┐     ┌─────────┐     ┌──────────┐
// │  前端   │────▶│  BFF    │────▶│  微服务  │
// │  移动端 │     │  Web    │     │  用户服务│
// │  小程序 │     │  Mobile │     │  订单服务│
// └─────────┘     │  MiniApp│     │  商品服务│
//                 └─────────┘     └──────────┘
//                      │
//                 ┌─────────┐
//                 │  缓存   │
//                 │  Redis  │
//                 └─────────┘

// 2. 目录结构设计
// src/
// ├── modules/
// │   ├── user/          # 用户模块
// │   │   ├── user.controller.ts
// │   │   ├── user.service.ts
// │   │   ├── user.module.ts
// │   │   └── dto/
// │   ├── order/         # 订单模块
// │   └── product/       # 商品模块
// ├── common/
// │   ├── decorators/    # 自定义装饰器
// │   ├── filters/       # 异常过滤器
// │   ├── interceptors/  # 拦截器
// │   └── middleware/    # 中间件
// ├── config/            # 配置文件
// ├── gateway/          # 网关相关
// └── main.ts

// 3. 关键代码示例

// 3.1 统一响应格式
// common/response.interceptor.ts
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
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

// 3.2 错误处理
// common/exception.filter.ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(status).json({
      code: status,
      message: exception instanceof Error ? exception.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      path: request.url
    });
  }
}

// 3.3 鉴权守卫
// common/auth.guard.ts
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

// 4. 性能优化策略

// 4.1 缓存策略
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(private cacheManager: CacheManager) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const key = request.originalUrl;

    const cached = await this.cacheManager.get(key);

    if (cached) {
      return of(cached);
    }

    return next.handle().pipe(
      tap(response => {
        this.cacheManager.set(key, response, { ttl: 300 });
      })
    );
  }
}

// 4.2 接口超时
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
    rawBody: true
  });

  app.use((req, res, next) => {
    res.setTimeout(10000, () => {
      res.status(408).json({ error: 'Request timeout' });
    });
    next();
  });
}
```

---

## 第六章 最佳实践与性能优化

### 6.1 BFF 项目结构最佳实践

```typescript
// 现代化 BFF 项目结构 (NestJS)

// src/
// ├── main.ts                    # 应用入口
// ├── app.module.ts              # 根模块
// ├── config/                    # 配置
// │   ├── configuration.ts
// │   └── validation.ts
// ├── modules/                   # 业务模块
// │   ├── common/                 # 公共模块
// │   │   ├── dto/               # 数据传输对象
// │   │   ├── entities/          # 实体
// │   │   ├── interfaces/        # 接口定义
// │   │   └── constants.ts
// │   ├── auth/                  # 认证模块
// │   │   ├── auth.controller.ts
// │   │   ├── auth.service.ts
// │   │   ├── auth.module.ts
// │   │   ├── strategies/        # 认证策略
// │   │   └── guards/            # 守卫
// │   ├── user/                  # 用户模块
// │   ├── order/                 # 订单模块
│   │   ├── order.module.ts
│   │   ├── order.service.ts
│   │   ├── order.controller.ts
│   │   ├── dto/
│   │   └── interfaces/
│   ├── product/                 # 商品模块
│   └── bff/                     # BFF 聚合模块
│       ├── bff.controller.ts   # 聚合接口
│       ├── bff.service.ts
│       └── bff.module.ts
// ├── shared/                    # 共享功能
// │   ├── cache/                 # 缓存
// │   ├── http/                  # HTTP 客户端
// │   └── logger/                # 日志
// └── database/                  # 数据库
│   ├── entities/
│   └── migrations/
```

### 6.2 日志与监控

```typescript
// 日志系统实现

// 1. 结构化日志
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  }
});

// 使用日志
logger.info({ userId: '123' }, 'User logged in');
logger.error({ err: error }, 'Request failed');

// 2. 请求日志中间件
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, body } = req;
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;

      logger.info({
        method,
        url: originalUrl,
        body: JSON.stringify(body),
        statusCode,
        duration,
        ip: req.ip,
        userAgent: req.get('user-agent')
      }, 'HTTP Request');
    });

    next();
  }
}

// 3. 统一错误日志
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    logger.error({
      method: request.method,
      url: request.url,
      statusCode: status,
      response: exceptionResponse,
      body: request.body,
      stack: exception.stack
    }, 'HTTP Error');

    response.status(status).json(exceptionResponse);
  }
}

// 4. 监控指标 (Prometheus)
import { Counter, Histogram, Gauge } from 'prom-client';

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'status', 'path']
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'status', 'path'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

// 使用
@Get()
async findAll(@Req() req: Request) {
  const start = Date.now();
  const result = await this.service.findAll();

  httpRequestsTotal.inc({ method: 'GET', status: 200, path: '/items' });
  httpRequestDuration.observe(
    { method: 'GET', status: 200, path: '/items' },
    (Date.now() - start) / 1000
  );

  return result;
}
```

### 6.3 安全最佳实践

```typescript
// 安全最佳实践

// 1. CORS 配置
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization'],
  credentials: true,
  maxAge: 86400
});

// 2. Helmet 安全头
import helmet from 'helmet';
app.use(helmet());

// 3. 请求限流
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      name: 'short',
      ttl: 1000,
      limit: 3
    }, {
      name: 'medium',
      ttl: 10000,
      limit: 20
    }, {
      name: 'long',
      ttl: 60000,
      limit: 100
    }])
  ]
})
export class AppModule {}

// 4. 输入验证
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsOptional()
  name?: string;
}

// 5. 敏感数据处理
// 不在日志中打印敏感信息
logger.info({
  userId: user.id,
  email: user.email, // 危险！
  // 应该只记录非敏感信息
}, 'User action');

// 6. SQL 注入防护 - 使用参数化查询
// 不好
const query = `SELECT * FROM users WHERE id = '${userId}'`;

// 好
const query = 'SELECT * FROM users WHERE id = $1';
const result = await client.query(query, [userId]);

// 7. XSS 防护 - 输出编码
import escapeHtml from 'escape-html';

// 在模板中
res.send(`<div>${escapeHtml(userInput)}</div>`);
```

### 6.4 部署与运维

```yaml
# Docker 配置
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main.js"]

# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://user:pass@db:5432/mydb
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:14
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=mydb

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:

# Kubernetes 配置
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bff-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: bff-service
  template:
    metadata:
      labels:
        app: bff-service
    spec:
      containers:
      - name: bff-service
        image: bff-service:latest
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        env:
        - name: NODE_ENV
          value: "production"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

---

## 总结

本文档全面覆盖了 Node.js 与 BFF 架构的核心知识点，包括：

1. **Node.js 核心原理**: 事件循环、进程与线程、Buffer 和 Stream、模块系统、异步编程、错误处理、性能优化
2. **BFF 架构设计**: BFF 定义与优势、技术选型、服务端渲染、接口聚合、鉴权方案
3. **NestJS 框架**: 依赖注入、装饰器、微服务
4. **面试高频问题**: 基础概念、场景题、手写代码、系统设计

希望这份面试题汇总能帮助你斩获理想的 Offer！

---

> 整理不易，**一键三连**支持一下！如果你有更好的题目或答案，欢迎提交 PR！
> **作者**: 前端面试题整理团队 | **版本**: 2025 最终版 | **License**: MIT
