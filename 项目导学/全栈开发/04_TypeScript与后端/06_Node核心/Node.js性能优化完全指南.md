# Node.js性能优化完全指南

## 概述

Node.js以其高性能和高并发能力著称，广泛应用于Web后端、API网关、实时通信等场景。然而，要真正发挥Node.js的性能潜力，需要深入理解其底层原理并掌握科学的优化方法。本文档将从事件循环、内存管理、异步编程、流处理、缓存策略、数据库优化等多个维度，系统讲解Node.js性能优化的核心知识点，并提供完整的实战代码示例。

---

## 一、Node.js性能基础

### 1.1 事件循环原理：libuv六个阶段

Node.js的事件循环是建立在libuv库之上的。libuv是一个跨平台的异步IO库，它实现了Node.js的核心事件循环机制。理解事件循环的六个阶段，是掌握Node.js性能优化的基础。

```
┌─────────────────────────────────────────────────────────────┐
│                      事件循环六个阶段                         │
├─────────────────────────────────────────────────────────────┤
│  阶段1: timers (定时器阶段)                                  │
│  ├── 执行 setTimeout() 和 setInterval() 的回调              │
│  └── 超过阈值的定时器会被执行                                 │
│                                                             │
│  阶段2: pending callbacks (待定回调)                         │
│  └── 执行上一轮循环中延迟的I/O回调                           │
│                                                             │
│  阶段3: idle, prepare (空闲准备)                             │
│  └── 内部使用，供libuv内部调度                               │
│                                                             │
│  阶段4: poll (轮询阶段) ★ 核心阶段                            │
│  ├── 检索新的I/O事件                                         │
│  ├── 执行与I/O相关的回调（几乎所有非定时器回调）              │
│  └── 若无回调则在此阶段阻塞                                  │
│                                                             │
│  阶段5: check (检查阶段)                                     │
│  └── 执行 setImmediate() 的回调                            │
│                                                             │
│  阶段6: close callbacks (关闭回调)                           │
│  └── 执行 close 事件的回调，如 socket.on('close')           │
└─────────────────────────────────────────────────────────────┘
```

#### 各阶段详细解析

**timers阶段**：这个阶段执行由`setTimeout()`和`setInterval()`设置的回调函数。定时器指定了阈值阈值，而不是用户希望执行的确切时间。当事件循环到达timers阶段时，它会遍历链表，检查并执行所有已超过阈值的定时器回调。

**pending callbacks阶段**：某些系统操作（如TCP错误）会在上一个循环中被延迟到此阶段执行。这确保了I/O错误能够被正确处理，但不会阻塞事件循环。

**idle, prepare阶段**：这是libuv内部使用的阶段，用于准备和调度工作。在应用程序代码中看不到这些回调的直接执行。

**poll阶段（核心）**：这是最重要也是最复杂的阶段。当有已完成的I/O事件时，事件循环会执行相应的回调。如果没有可执行的I/O回调，事件循环会根据情况等待或直接进入下一阶段。如果存在setImmediate回调，事件循环会立即跳转到check阶段。

**check阶段**：setImmediate()是一个特殊的定时器，它在poll阶段完成后立即执行回调。它使用libuv的检查阶段来执行回调，与setTimeout(fn, 0)不同，setImmediate回调在poll阶段为空时优先执行。

**close callbacks阶段**：所有close事件回调都在这里执行。例如，当一个socket被销毁时，会触发close事件。

#### 代码示例：事件循环阶段观察

```javascript
// 事件循环阶段观察器
const { createRequire } = require('module');
const require = createRequire(import.meta.url);

// 引入内部方法观察事件循环
const { performance, performanceMark, performanceMeasure } = require('perf_hooks');

// 创建自定义性能观察器
const observer = new performance.ObservableReport((entries) => {
  for (const entry of entries) {
    console.log(`[性能观察] ${entry.name}: ${entry.duration}ms`);
  }
});

// 添加观察器监听
performance.addObserver(observer);

// 阶段1: timers - setTimeout
console.log('=== timers阶段测试 ===');
setTimeout(() => {
  console.log('setTimeout 回调执行');
}, 0);

// 阶段5: check - setImmediate
console.log('=== check阶段测试 ===');
setImmediate(() => {
  console.log('setImmediate 回调执行');
});

// I/O回调测试
console.log('=== I/O回调测试 ===');
const fs = require('fs');
fs.readFile(__filename, () => {
  console.log('I/O回调执行 (poll阶段)');
});

// nextTick和setImmediate的执行顺序
console.log('=== nextTick vs setImmediate ===');
process.nextTick(() => {
  console.log('process.nextTick 回调');
});

Promise.resolve().then(() => {
  console.log('Promise.then 微任务');
});

// 执行顺序总结:
// 1. 同步代码优先执行
// 2. process.nextTick 最早执行（每个阶段末尾）
// 3. Promise.then 微任务（每个阶段之后）
// 4. setTimeout(0) 和 setImmediate 的顺序不确定（取决于性能）
```

```
输出示例（顺序可能因运行环境而异）：
=== timers阶段测试 ===
=== check阶段测试 ===
=== I/O回调测试 ===
=== nextTick vs setImmediate ===
process.nextTick 回调
Promise.then 微任务
setTimeout 回调执行
I/O回调执行 (poll阶段)
setImmediate 回调执行
```

#### 我的思考：为什么setTimeout(fn, 0)和setImmediate执行顺序不确定？

在上面的代码中，setTimeout(fn, 0)和setImmediate的执行顺序是不确定的。这是因为它们处于不同的阶段：setTimeout在timers阶段执行，而setImmediate在check阶段执行。当我们同步调用它们时，事件循环的状态决定了哪个先执行。如果当前处于timers阶段之前，setTimeout会在下一次循环的timers阶段执行，而setImmediate会在当前或下一次循环的check阶段执行。

### 1.2 异步IO模型：非阻塞、事件驱动

Node.js的异步IO模型是其高性能的核心。与传统的同步IO模型不同，Node.js在执行IO操作时不会阻塞线程，而是利用操作系统的异步IO能力和线程池来处理耗时操作。

#### 同步IO vs 异步IO

```javascript
// 同步IO模型（阻塞）
// 假设读取文件需要100ms，查询数据库需要50ms
const fileData = fs.readFileSync('/path/to/file'); // 阻塞100ms
const dbData = db.querySync('SELECT * FROM users'); // 阻塞50ms
const result = process(fileData, dbData); // 处理10ms
// 总耗时: 100 + 50 + 10 = 160ms

// 异步IO模型（非阻塞）
// Node.js不会在这里等待，而是继续执行后续代码
fs.readFile('/path/to/file', (err, fileData) => {
  // 这个回调在文件读取完成后（100ms后）执行
  db.query('SELECT * FROM users', (err, dbData) => {
    // 这个回调在数据库查询完成后（50ms后）执行
    const result = process(fileData, dbData); // 处理10ms
    // 总耗时: 100 + 50 + 10 = 160ms（但主线程没有阻塞）
  });
});

// 现代异步写法（async/await）
async function getData() {
  const fileData = await fs.promises.readFile('/path/to/file');
  const dbData = await db.queryAsync('SELECT * FROM users');
  const result = process(fileData, dbData);
  return result;
}
```

#### libuv线程池机制

libuv使用线程池来处理无法使用操作系统异步IO的操作。默认线程池大小为4，但可以通过环境变量`UV_THREADPOOL_SIZE`调整（最大1024）。

```javascript
// 查看当前线程池大小
console.log('默认线程池大小:', process.env.UV_THREADPOOL_SIZE); // undefined，默认4

// 设置线程池大小（必须在Node.js启动前设置）
// 在启动命令中: UV_THREADPOOL_SIZE=8 node app.js
// 或在代码中: process.env.UV_THREADPOOL_SIZE = '8'（必须在第一次使用线程池前）

// 哪些操作会使用线程池？
const fs = require('fs');
const crypto = require('crypto');
const zlib = require('zlib');

// 以下操作会使用线程池（默认）：
// 1. fs异步文件操作（readFile, writeFile等）
// 2. crypto.pbkdf2, crypto.scrypt, crypto.randomBytes等
// 3. zlib.zip等压缩操作

// 测试线程池使用
console.log('=== 线程池测试 ===');
const start = Date.now();

// 顺序执行多个文件操作
for (let i = 0; i < 10; i++) {
  fs.readFile(__filename, () => {
    console.log(`文件${i + 1}读取完成，耗时: ${Date.now() - start}ms`);
  });
}
```

```
输出示例：
文件1读取完成，耗时: 15ms
文件2读取完成，耗时: 18ms
文件3读取完成，耗时: 22ms
文件4读取完成，耗时: 25ms
...（线程池中的4个线程并行处理）
```

#### 事件驱动架构

```javascript
// 事件驱动的简单实现
const EventEmitter = require('events');

class DataProcessor extends EventEmitter {
  constructor() {
    super();
    // 存储待处理数据
    this.dataBuffer = [];
    // 最大缓冲区大小
    this.maxBufferSize = 1000;
    // 处理间隔（ms）
    this.processInterval = 5000;
  }

  // 添加数据到缓冲区
  addData(data) {
    this.dataBuffer.push(data);

    // 缓冲区满时立即处理
    if (this.dataBuffer.length >= this.maxBufferSize) {
      this.processBuffer();
    }

    // 触发事件
    this.emit('data-added', {
      data,
      bufferSize: this.dataBuffer.length
    });
  }

  // 处理缓冲区
  processBuffer() {
    if (this.dataBuffer.length === 0) return;

    const dataToProcess = [...this.dataBuffer];
    this.dataBuffer = [];

    this.emit('processing-start', { count: dataToProcess.length });

    // 模拟异步处理
    setTimeout(() => {
      const result = dataToProcess.map(item => this.transform(item));
      this.emit('processing-complete', { count: result.length });
    }, 100);
  }

  // 数据转换
  transform(item) {
    // 实际应用中这里是复杂的处理逻辑
    return { ...item, processed: true, timestamp: Date.now() };
  }

  // 启动定时处理
  startPeriodicProcessing() {
    setInterval(() => {
      this.processBuffer();
    }, this.processInterval);
  }
}

// 使用事件处理器
const processor = new DataProcessor();

processor.on('data-added', ({ data, bufferSize }) => {
  if (bufferSize % 100 === 0) {
    console.log(`缓冲区大小: ${bufferSize}`);
  }
});

processor.on('processing-start', ({ count }) => {
  console.log(`开始处理 ${count} 条数据`);
});

processor.on('processing-complete', ({ count }) => {
  console.log(`处理完成 ${count} 条数据`);
});

// 添加一些测试数据
for (let i = 0; i < 100; i++) {
  processor.addData({ id: i, value: `data-${i}` });
}
```

### 1.3 单线程的真相：主线程单线程，IO多路复用

Node.js常被称为"单线程"语言，但这并不完全准确。准确地说，Node.js的主线程是单线程的，但它的IO操作是由操作系统和libuv的线程池处理的。

```
┌─────────────────────────────────────────────────────────────┐
│                    Node.js 架构图                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────────────────────────────────────────┐      │
│   │                 JavaScript 主线程                │      │
│   │  ┌─────────────────────────────────────────────┐ │      │
│   │  │              事件循环（libuv）              │ │      │
│   │  │                                             │ │      │
│   │  │   timers → pending → idle → poll → check  │ │      │
│   │  └─────────────────────────────────────────────┘ │      │
│   └─────────────────────────────────────────────────┘      │
│                         ↓                                    │
│   ┌─────────────────────────────────────────────────┐      │
│   │              V8 引擎（编译执行）                 │      │
│   │  ├── 解析 JavaScript                            │      │
│   │  ├── 编译为机器码                                │      │
│   │  └── 垃圾回收                                    │      │
│   └─────────────────────────────────────────────────┘      │
│                                                             │
│   ┌─────────────────────────────────────────────────┐      │
│   │              libuv 线程池（4个线程）             │      │
│   │  ┌────┐ ┌────┐ ┌────┐ ┌────┐                     │      │
│   │  │线程│ │线程│ │线程│ │线程│  ← 处理 fs/crypto  │      │
│   │  └────┘ └────┘ └────┘ └────┘                     │      │
│   └─────────────────────────────────────────────────┘      │
│                         ↓                                    │
│   ┌─────────────────────────────────────────────────┐      │
│   │           操作系统异步IO（epoll/kqueue/IOCP）    │      │
│   │  ┌─────────────────────────────────────────────┐ │      │
│   │  │              IO多路复用                      │ │      │
│   │  │   同时监听多个socket/文件描述符              │ │      │
│   │  └─────────────────────────────────────────────┘ │      │
│   └─────────────────────────────────────────────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### IO多路复用详解

IO多路复用是一种高效的IO处理机制，允许单个线程同时监听多个IO描述符。当其中任何一个IO准备好读写时，操作系统会通知应用程序。

```javascript
// 使用net模块创建TCP服务器，演示IO多路复用
const net = require('net');

const server = net.createServer((socket) => {
  // 每个连接都会触发这个回调
  console.log(`新连接: ${socket.remoteAddress}:${socket.remotePort}`);

  let requestCount = 0;

  // 数据接收事件
  socket.on('data', (data) => {
    requestCount++;
    console.log(`收到数据 (连接${socket.remotePort}):`, data.toString().slice(0, 50));

    // 构造HTTP响应
    const response = [
      'HTTP/1.1 200 OK',
      'Content-Type: application/json',
      'Connection: keep-alive',
      '',
      JSON.stringify({
        message: 'Hello, World!',
        requestCount,
        timestamp: Date.now()
      })
    ].join('\n');

    socket.write(response);
  });

  // 连接关闭事件
  socket.on('close', () => {
    console.log(`连接关闭: ${socket.remotePort}`);
  });

  // 错误处理
  socket.on('error', (err) => {
    console.error(`连接错误: ${err.message}`);
  });
});

server.listen(3000, () => {
  console.log('TCP服务器监听端口 3000');
  console.log('使用IO多路复用（epoll/kqueue）同时处理多个连接');
});

// 模拟客户端测试
setTimeout(() => {
  const client1 = net.connect(3000, () => {
    console.log('客户端1已连接');
    client1.write('Hello from client 1');
  });
  client1.on('data', (data) => {
    console.log('客户端1收到:', data.toString());
    client1.end();
  });

  const client2 = net.connect(3000, () => {
    console.log('客户端2已连接');
    client2.write('Hello from client 2');
  });
  client2.on('data', (data) => {
    console.log('客户端2收到:', data.toString());
    client2.end();
  });
}, 1000);
```

### 1.4 我的思考：Node.js为什么适合IO密集型

Node.js的核心优势在于IO密集型场景，这是因为它的设计哲学与IO操作的特性高度匹配。

**IO操作的特点**：
1. IO操作速度比CPU慢几个数量级
2. IO操作大部分时间在等待数据准备就绪
3. IO操作可以并行进行

**传统同步IO模型的问题**：
```
请求1: |████████ 100ms 等待IO ████| 处理10ms |
请求2: |                             |████████ 100ms 等待IO ████| 处理10ms |
请求3: |                                                     |████████ 100ms 等待IO ████| 处理10ms |

总耗时: 约330ms（串行等待）
```

**Node.js异步IO模型的优势**：
```
请求1: |██ 10ms 处理 ██|........等待IO..........|
请求2: |........|██ 10ms 处理 ██|....等待IO.....|
请求3: |............|██ 10ms 处理 ██|等待IO......|

总耗时: 约120ms（并行IO等待）
```

**Node.js适合的场景**：
- Web服务器和API网关
- 实时通信（WebSocket）
- 文件操作服务
- 数据库访问层
- 日志收集和处理
- 流媒体处理

**Node.js不太适合的场景**：
- CPU密集型计算（如复杂的数学运算、视频编码）
- 大规模数据处理（应该使用流处理或专门的批处理系统）

```javascript
// CPU密集型任务应该使用 Worker Threads
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (isMainThread) {
  // 主线程
  const worker = new Worker(__filename, {
    workerData: { numbers: Array.from({ length: 10000000 }, (_, i) => i) }
  });

  worker.on('message', (result) => {
    console.log('计算结果:', result.sum);
    console.log('总耗时:', result.duration, 'ms');
  });

  worker.on('error', (err) => {
    console.error('Worker错误:', err);
  });

  console.log('在主线程启动Worker处理CPU密集型任务');
} else {
  // Worker线程
  const start = Date.now();
  const { numbers } = workerData;

  // 执行CPU密集型计算
  const sum = numbers.reduce((acc, n) => acc + n, 0);

  parentPort.postMessage({
    sum,
    duration: Date.now() - start
  });
}
```

---

## 二、性能分析工具

### 2.1 内置profiler：--prof

Node.js内置了V8性能分析器，使用`--prof`标志可以生成性能日志文件，包含函数调用频率和耗时信息。

```javascript
// 创建测试应用：模拟API服务器
const http = require('http');

// 模拟各种操作
function syncOperation() {
  let result = 0;
  for (let i = 0; i < 1000000; i++) {
    result += Math.sqrt(i);
  }
  return result;
}

function asyncOperation(callback) {
  setTimeout(() => {
    callback(syncOperation());
  }, Math.random() * 100);
}

// 创建HTTP服务器
const server = http.createServer((req, res) => {
  const url = req.url;

  if (url === '/sync') {
    // 同步操作
    const result = syncOperation();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ result, type: 'sync' }));
  } else if (url === '/async') {
    // 异步操作
    asyncOperation((result) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ result, type: 'async' }));
    });
  } else if (url === '/mixed') {
    // 混合操作
    asyncOperation(() => {
      asyncOperation(() => {
        const result = syncOperation();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ result, type: 'mixed' }));
      });
    });
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Node.js Performance Test Server');
  }
});

server.listen(3000, () => {
  console.log('性能测试服务器运行在 http://localhost:3000');
  console.log('使用 --prof 标志运行: node --prof server.js');
  console.log('然后访问: http://localhost:3000/sync');
});

// 使用以下命令分析:
// node --prof server.js
// 访问各种端点
// node --prof-process isolate-*.log > profile.txt
// cat profile.txt
```

#### 处理profiler日志

```bash
# 运行服务器并生成日志
node --prof server.js

# 使用curl测试
curl http://localhost:3000/sync
curl http://localhost:3000/async
curl http://localhost:3000/mixed

# 处理日志文件
node --prof-process isolate-*.log > profile-report.txt

# 查看报告
cat profile-report.txt
```

```
profile-report.txt 示例输出：

[Summary]:
   ticks  total  nonlib   name
  12345   67.2%   89.5%  /usr/local/lib/node_modules/node:internal
   2345   12.8%   15.8%  /path/to/server.js
   1234    6.7%    8.9%  /path/to/server.js:syncOperation
   ...
```

### 2.2 clinic.js：火焰图分析

Clinic.js是一个强大的Node.js性能诊断工具，可以自动识别性能问题并生成可视化火焰图。

```javascript
// clinic.js 测试服务器
const http = require('http');
const fs = require('fs');

// 模拟慢查询
function simulateSlowQuery() {
  const start = Date.now();
  // 模拟数据库查询延迟
  while (Date.now() - start < 50) {
    // 阻塞50ms
  }
  return { data: 'query result', timestamp: start };
}

// 模拟CPU密集型操作
function cpuIntensiveTask(n) {
  let result = 0;
  for (let i = 0; i < n; i++) {
    result += Math.sqrt(i) * Math.sin(i);
  }
  return result;
}

// 处理函数
function handleRequest(req, res) {
  const url = req.url;

  if (url === '/api/data') {
    // 慢查询端点
    const result = simulateSlowQuery();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  } else if (url === '/api/compute') {
    // CPU密集型端点
    const result = cpuIntensiveTask(5000000);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ result: result.toFixed(2) }));
  } else if (url === '/api/stream') {
    // 流处理端点
    res.writeHead(200, { 'Content-Type': 'application/json' });

    // 模拟流式数据
    for (let i = 0; i < 100; i++) {
      res.write(JSON.stringify({ index: i, data: `item-${i}` }) + '\n');
    }
    res.end();
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Clinic.js Test Server\n');
  }
}

const server = http.createServer(handleRequest);

server.listen(3000, () => {
  console.log('Clinic.js测试服务器运行在 http://localhost:3000');
  console.log('可以使用以下命令分析:');
  console.log('  clinic doctor -- node server.js');
  console.log('  clinic flame -- node server.js');
  console.log('  clinic bubbleprof -- node server.js');
});
```

```bash
# 安装 clinic.js
npm install -g clinic

# 使用 clinic doctor 诊断（自动检测问题）
clinic doctor -- node server.js

# 使用 clinic flame 生成火焰图（定位CPU热点）
clinic flame -- node server.js

# 使用 clinic bubbleprof 分析异步操作
clinic bubbleprof -- node server.js
```

### 2.3 0x：快速火焰图

0x是另一个火焰图生成工具，专注于快速定位性能问题。

```javascript
// 0x测试代码
const http = require('http');

// 创建数据处理函数
function processData(items) {
  return items.map(item => ({
    ...item,
    processed: true,
    value: item.value * 2
  }));
}

// 创建缓存
const cache = new Map();

function getCachedOrCompute(key, computeFn) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  const result = computeFn();
  cache.set(key, result);
  return result;
}

// 服务器
const server = http.createServer((req, res) => {
  if (req.url === '/api/process') {
    const data = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      value: Math.random() * 100
    }));

    const processed = processData(data);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      count: processed.length,
      sample: processed.slice(0, 5)
    }));
  } else if (req.url === '/api/cached') {
    const result = getCachedOrCompute('expensive-computation', () => {
      // 模拟昂贵计算
      let sum = 0;
      for (let i = 0; i < 10000000; i++) {
        sum += Math.sqrt(i);
      }
      return sum;
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ result: result.toFixed(2) }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('0x Test Server\n');
  }
});

server.listen(3001, () => {
  console.log('0x测试服务器运行在 http://localhost:3001');
  console.log('运行: 0x node server.js');
});
```

```bash
# 安装 0x
npm install -g 0x

# 运行并自动生成火焰图
0x node server.js

# 或指定输出目录
0x -o ./flamegraphs node server.js
```

### 2.4 Node.js profiler：Chrome DevTools

可以使用Chrome DevTools进行Node.js性能分析。

```javascript
// 启用Inspector协议的服务器
const http = require('http');
const { Session } = require('inspector');

let session = null;

function startProfiling() {
  session = new Session();
  session.connect();

  console.log('开始性能分析...');

  session.post('Profiler.enable', () => {
    session.post('Profiler.start', () => {
      console.log('性能分析已启动');
    });
  });
}

function stopProfiling() {
  if (!session) return;

  session.post('Profiler.stop', (err, { profile }) => {
    if (err) {
      console.error('分析错误:', err);
      return;
    }

    // 保存性能数据
    const fs = require('fs');
    const filename = `profile-${Date.now()}.cpuprofile`;
    fs.writeFileSync(filename, JSON.stringify(profile));

    console.log(`性能数据已保存到: ${filename}`);
    console.log('可以在Chrome DevTools中打开此文件');

    session.disconnect();
    session = null;
  });
}

// 测试服务器
const server = http.createServer((req, res) => {
  if (req.url === '/start') {
    startProfiling();
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('分析开始\n');
  } else if (req.url === '/stop') {
    stopProfiling();
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('分析结束\n');
  } else {
    // 模拟一些操作
    let sum = 0;
    for (let i = 0; i < 1000000; i++) {
      sum += Math.sqrt(i);
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ sum: sum.toFixed(2) }));
  }
});

server.listen(9229, () => {
  console.log('服务器运行在 http://localhost:9229');
  console.log('使用Chrome DevTools连接:');
  console.log('1. 打开 Chrome');
  console.log('2. 访问 chrome://inspect');
  console.log('3. 点击 "Open dedicated DevTools for Node"');
});
```

### 2.5 实战：定位CPU热点

```javascript
// 完整的性能分析实战
const http = require('http');
const fs = require('fs');
const path = require('path');

// ==================== 模拟业务逻辑 ====================

// 用户数据
const users = Array.from({ length: 1000 }, (_, i) => ({
  id: i + 1,
  name: `用户${i + 1}`,
  email: `user${i + 1}@example.com`,
  score: Math.floor(Math.random() * 1000)
}));

// 热点函数1：排序
function sortUsers(users, field = 'score', order = 'desc') {
  return [...users].sort((a, b) => {
    if (order === 'desc') {
      return b[field] - a[field];
    }
    return a[field] - b[field];
  });
}

// 热点函数2：搜索
function searchUsers(users, query) {
  const lowerQuery = query.toLowerCase();
  return users.filter(user =>
    user.name.toLowerCase().includes(lowerQuery) ||
    user.email.toLowerCase().includes(lowerQuery)
  );
}

// 热点函数3：统计
function aggregateStats(users) {
  const stats = {
    total: users.length,
    scores: users.map(u => u.score),
    average: 0,
    max: 0,
    min: 0,
    distribution: {}
  };

  // 计算统计数据
  let sum = 0;
  for (const user of users) {
    sum += user.score;
    if (user.score > stats.max) stats.max = user.score;
    if (user.score < stats.min || stats.min === 0) stats.min = user.score;

    // 分布
    const bucket = Math.floor(user.score / 100) * 100;
    stats.distribution[bucket] = (stats.distribution[bucket] || 0) + 1;
  }
  stats.average = sum / stats.total;

  return stats;
}

// 热点函数4：数据转换
function transformUserData(users) {
  return users.map(user => ({
    id: user.id,
    displayName: `${user.name} (${user.email})`,
    performance: user.score >= 500 ? '优秀' : user.score >= 300 ? '良好' : '一般',
    scoreNormalized: (user.score / 1000).toFixed(2)
  }));
}

// ==================== HTTP服务器 ====================

function handleRequest(req, res) {
  const url = req.url;
  const query = require('url').parse(url, true);
  const pathname = query.pathname;

  // CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (pathname === '/api/users' || pathname === '/api/users/') {
    // 返回用户列表
    const start = Date.now();
    const sortedUsers = sortUsers(users);
    const result = transformUserData(sortedUsers.slice(0, 100));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      data: result,
      meta: {
        count: result.length,
        processingTime: Date.now() - start
      }
    }));
  } else if (pathname === '/api/search') {
    // 搜索用户
    const searchQuery = query.query.q || '';
    const start = Date.now();
    const results = searchUsers(users, searchQuery);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      data: results.slice(0, 50),
      meta: {
        query: searchQuery,
        count: results.length,
        processingTime: Date.now() - start
      }
    }));
  } else if (pathname === '/api/stats') {
    // 统计数据
    const start = Date.now();
    const stats = aggregateStats(users);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      data: stats,
      meta: {
        processingTime: Date.now() - start
      }
    }));
  } else if (pathname === '/api/batch') {
    // 批量处理
    const start = Date.now();
    const results = [];

    for (let i = 0; i < 10; i++) {
      const sorted = sortUsers(users);
      const searched = searchUsers(users, '用户');
      const stats = aggregateStats(users);
      const transformed = transformUserData(sorted.slice(0, 100));

      results.push({
        iteration: i + 1,
        sortedCount: sorted.length,
        searchedCount: searched.length,
        statsSummary: {
          average: stats.average.toFixed(2),
          max: stats.max,
          min: stats.min
        },
        transformedSample: transformed[0]
      });
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      data: results,
      meta: {
        iterations: 10,
        totalProcessingTime: Date.now() - start
      }
    }));
  } else if (pathname === '/health') {
    // 健康检查
    const memoryUsage = process.memoryUsage();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      uptime: process.uptime(),
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB'
      }
    }));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found\n');
  }
}

const server = http.createServer(handleRequest);

server.listen(3000, () => {
  console.log('='.repeat(60));
  console.log('CPU热点分析实战服务器');
  console.log('='.repeat(60));
  console.log('端点:');
  console.log('  GET /api/users      - 用户列表（排序+转换）');
  console.log('  GET /api/search?q=  - 搜索用户');
  console.log('  GET /api/stats      - 统计数据');
  console.log('  GET /api/batch      - 批量处理');
  console.log('  GET /health         - 健康检查');
  console.log('='.repeat(60));
  console.log('\n性能分析命令:');
  console.log('  1. node --prof server.js');
  console.log('  2. 多次访问各个端点');
  console.log('  3. node --prof-process isolate-*.log > report.txt');
  console.log('\n或使用 clinic:');
  console.log('  clinic flame -- node server.js');
});

// 处理关闭
process.on('SIGINT', () => {
  console.log('\n关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});
```

---

## 三、内存管理

### 3.1 V8内存限制：1.4GB / 800MB

Node.js使用V8 JavaScript引擎，V8为堆内存设置了默认大小限制。在64位系统中，默认堆内存限制约为1.4GB（新生代+老生代），在32位系统中约为800MB。

```javascript
// 查看当前内存限制
console.log('=== V8内存信息 ===');
console.log('Node.js版本:', process.version);
console.log('平台:', process.platform, process.arch);

// 获取内存信息
const memInfo = process.memoryUsage();

console.log('\n内存使用情况:');
console.log('  堆内存总量:', (memInfo.heapTotal / 1024 / 1024).toFixed(2), 'MB');
console.log('  堆内存使用:', (memInfo.heapUsed / 1024 / 1024).toFixed(2), 'MB');
console.log('  常驻内存大小:', (memInfo.rss / 1024 / 1024).toFixed(2), 'MB');
console.log('  外部内存:', (memInfo.external / 1024 / 1024).toFixed(2), 'MB');
console.log('  内存碎片:', ((memInfo.heapTotal - memInfo.heapUsed) / memInfo.heapTotal * 100).toFixed(2), '%');

// V8堆内存各区域大小
console.log('\n=== 堆内存区域 ===');
// 新生代和老生代的大小可以通过 --max-old-space-size 和 --max-new-space-size 调整
console.log('默认老生代最大:', 1400, 'MB (可通过 --max-old-space-size 调整)');
console.log('默认新生代最大:', 16, 'MB (可通过 --max-new-space-size 调整)');

// 查看V8配置
console.log('\n=== V8配置信息 ===');
const v8 = require('v8');
console.log('V8版本:', v8.getHeapStatistics());
console.log('\n堆空间信息:', {
  total_heap_size: v8.getHeapStatistics().total_heap_size,
  total_heap_size_executable: v8.getHeapStatistics().total_heap_size_executable,
  total_physical_size: v8.getHeapStatistics().total_physical_size,
  total_available_size: v8.getHeapStatistics().total_available_size,
  used_heap_size: v8.getHeapStatistics().used_heap_size,
  heap_size_limit: v8.getHeapStatistics().heap_size_limit
});
```

#### 调整V8内存限制

```bash
# 增加老生代堆内存到4GB
node --max-old-space-size=4096 app.js

# 增加新生代堆内存到256MB
node --max-new-space-size=256 app.js

# 生产环境推荐配置
node --max-old-space-size=4096 --max-new-space-size=64 app.js
```

```javascript
// 在代码中检测并警告内存接近限制
function checkMemory() {
  const memInfo = process.memoryUsage();
  const heapUsedPercent = (memInfo.heapUsed / memInfo.heapTotal) * 100;

  console.log(`堆内存使用: ${heapUsedPercent.toFixed(2)}%`);

  if (heapUsedPercent > 80) {
    console.warn('警告: 堆内存使用超过80%');
    console.warn('建议: 使用 --max-old-space-size 增加内存或优化代码');
  }

  // 检查是否接近V8限制
  const v8 = require('v8');
  const heapStats = v8.getHeapStatistics();
  const limitPercent = (heapStats.used_heap_size / heapStats.heap_size_limit) * 100;

  if (limitPercent > 90) {
    console.error('严重: 接近V8堆内存限制，可能导致崩溃！');
  }
}

// 定期检查内存
setInterval(checkMemory, 30000);
```

### 3.2 堆内存：新生代、老生代

V8的堆内存分为新生代和老生代两大部分，采用不同的垃圾回收策略。

```
┌─────────────────────────────────────────────────────────────┐
│                    V8堆内存结构                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   老生代 (Old Space)                  │   │
│  │                                                      │   │
│  │   大小: ~1400MB (64位) / ~700MB (32位)              │   │
│  │   回收: Mark-Sweep (标记清除) + Mark-Compact        │   │
│  │   存活时间: 超过2个GC周期或大对象直接进入           │   │
│  │                                                      │   │
│  │   ┌─────────────────────────────────────────────┐   │   │
│  │   │            对象区域                          │   │   │
│  │   │  - 大对象                                    │   │   │
│  │   │  - 长期存活对象                              │   │   │
│  │   │  - 全局对象                                  │   │   │
│  │   └─────────────────────────────────────────────┘   │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   新生代 (New Space)                  │   │
│  │                                                      │   │
│  │   大小: ~16MB (64位) / ~8MB (32位)                  │   │
│  │   回收: Scavenge ( Cheney算法)                       │   │
│  │   存活时间: 短期对象，新分配的对象                   │   │
│  │                                                      │   │
│  │   ┌──────────────────┐  ┌──────────────────┐       │   │
│  │   │    From Space    │  │     To Space      │       │   │
│  │   │   (活跃空间)      │  │    (空闲空间)      │       │   │
│  │   │                  │  │                   │       │   │
│  │   │  对象分配位置     │  │  回收时复制目标    │       │   │
│  │   └──────────────────┘  └──────────────────┘       │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   大对象区 (Large Object Space)       │   │
│  │   存放超过新生代空间限制的大对象                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   代码区 (Code Space)                  │   │
│  │   JIT编译后的机器码存放位置                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Cell / Property / Map Space       │   │
│  │   存放单元、属性单元格和Map对象                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 垃圾回收策略详解

```javascript
// 新生代回收（Scavenge）- 快速但内存效率较低
// 适用于生命周期短的对象
// 空间利用率约50%（From和To空间交替使用）

// 老生代回收（Mark-Sweep-Compact）- 较慢但彻底
// 适用于生命周期长的对象
// 1. Mark: 标记所有可达对象
// 2. Sweep: 清除未标记对象
// 3. Compact: 整理内存碎片

// 观察垃圾回收
const v8 = require('v8');

// 强制进行GC（需要 --expose-gc 标志）
// node --expose-gc app.js
let gcCount = 0;

if (global.gc) {
  console.log('GC暴露可用，开始监控...');

  // 手动触发GC并观察效果
  global.gc();
  gcCount++;

  console.log(`第${gcCount}次GC后:`, v8.getHeapStatistics());
}

// 分配大量对象观察内存变化
console.log('\n=== 内存分配测试 ===');

function allocateObjects(count) {
  const objects = [];
  for (let i = 0; i < count; i++) {
    objects.push({
      id: i,
      data: new Array(100).fill(i),
      timestamp: Date.now()
    });
  }
  return objects;
}

function showMemory(label) {
  const mem = process.memoryUsage();
  console.log(`\n[${label}]`);
  console.log(`  堆使用: ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  堆总量: ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  RSS: ${(mem.rss / 1024 / 1024).toFixed(2)} MB`);
}

// 测试新生代对象
showMemory('初始状态');
const youngGen = allocateObjects(10000);
showMemory('分配10000个对象');

// 清除引用后观察
youngGen.length = 0;
if (global.gc) global.gc();
showMemory('清除引用后');

// 测试老生代对象（长期存活）
const oldGenObjects = [];
for (let i = 0; i < 5; i++) {
  oldGenObjects.push(allocateObjects(50000));
}
showMemory('分配大量长期存活对象');

if (global.gc) global.gc();
showMemory('再次GC后');
```

### 3.3 内存泄漏：常见原因和排查

内存泄漏是Node.js应用中最常见的问题之一。了解常见原因可以帮助我们避免这些问题。

#### 常见内存泄漏原因

```javascript
// 1. 全局变量泄漏
// 错误示例：在全局对象上存储大量数据
global.cacheData = [];
function addToCache(data) {
  global.cacheData.push(data); // 不断增长，永不释放
}

// 正确示例：使用限制大小的缓存
class LRUCache {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      // 删除最旧的项
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  get(key) {
    if (!this.cache.has(key)) return undefined;
    const value = this.cache.get(key);
    // 移动到最新位置
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }
}

// 2. 闭包泄漏
// 错误示例：闭包持有对大对象的引用
function createLeakyClosure() {
  const largeData = new Array(1000000).fill('泄漏数据');

  return function() {
    // 闭包持有largeData引用，即使不使用也无法释放
    console.log(largeData.length);
  };
}

// 正确示例：及时释放大对象引用
function createSafeClosure() {
  let largeData = new Array(1000000).fill('数据');
  const result = largeData.length;

  largeData = null; // 及时释放

  return function() {
    // 只持有需要的数据
    console.log(result);
  };
}

// 3. 事件监听器泄漏
// 错误示例：不断添加事件监听器但不移除
class leakyEmitter {
  constructor() {
    this.emitter = require('events').EventEmitter;
  }

  subscribe(handler) {
    // 每次调用都添加新的监听器，从不移除
    this.emitter.on('data', handler);
  }
}

// 正确示例：确保移除监听器
class safeEmitter {
  constructor() {
    this.emitter = new (require('events').EventEmitter)();
    this.handlers = [];
  }

  subscribe(handler) {
    this.handlers.push(handler);
    this.emitter.on('data', handler);
  }

  unsubscribe(handler) {
    this.emitter.off('data', handler);
    this.handlers = this.handlers.filter(h => h !== handler);
  }

  clear() {
    this.handlers.forEach(handler => {
      this.emitter.off('data', handler);
    });
    this.handlers = [];
  }
}

// 4. 定时器泄漏
// 错误示例：未清理的定时器
function leakyPeriodicTask() {
  setInterval(() => {
    // 执行任务，但从不停止
    console.log('任务执行');
  }, 1000);
}

// 正确示例：保存定时器引用并提供清理方法
class PeriodicTask {
  constructor() {
    this.timerId = null;
    this.count = 0;
  }

  start(interval = 1000) {
    if (this.timerId) return; // 防止重复启动

    this.timerId = setInterval(() => {
      this.count++;
      console.log(`任务执行 #${this.count}`);
    }, interval);
  }

  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  getCount() {
    return this.count;
  }
}

// 5. 缓存未限制大小
// 错误示例：无限制增长的缓存
const badCache = {};
function cacheData(key, value) {
  badCache[key] = value; // 无限增长
}

// 正确示例：使用带过期时间的LRU缓存
class TimedLRUCache {
  constructor(maxSize = 1000, ttl = 3600000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.cache = new Map();
  }

  set(key, value) {
    // 删除最旧的
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // 检查过期
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  // 清理过期项
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache) {
      if (now - item.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }

  size() {
    return this.cache.size;
  }
}
```

#### 内存泄漏排查工具

```javascript
// 使用heapdump捕获堆快照
const heapdump = require('heapdump');

// 在关键位置捕获快照
function captureHeapSnapshot(label) {
  const filename = `./heap-${label}-${Date.now()}.heapsnapshot`;
  heapdump.writeSnapshot(filename, (err, filename) => {
    if (err) {
      console.error('快照保存失败:', err);
    } else {
      console.log(`堆快照已保存: ${filename}`);
    }
  });
}

// 在请求处理前后捕获
const http = require('http');

let requestCount = 0;

const server = http.createServer((req, res) => {
  requestCount++;

  // 每100个请求捕获一次快照
  if (requestCount % 100 === 0) {
    captureHeapSnapshot(`request-${requestCount}`);
    console.log(`处理了 ${requestCount} 个请求，当前内存:`, process.memoryUsage());
  }

  // 模拟处理
  const result = { requestId: requestCount, data: 'some data' };
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(result));
});

server.listen(3000, () => {
  console.log('内存泄漏排查服务器运行在 http://localhost:3000');
  console.log('查看快照：');
  console.log('1. Chrome DevTools > Memory');
  console.log('2. Load heap snapshot file');
  console.log('3. Compare snapshots to find leaks');
});
```

```javascript
// 使用memwatch-next自动检测泄漏
const memwatch = require('memwatch-next');

// 开始堆内存对比
const hd = new memwatch.HeapDiff();

memwatch.on('leak', (info) => {
  console.error('检测到可能的内存泄漏:', info);
});

memwatch.on('stats', (stats) => {
  console.log('GC统计:', {
    num_full_gc: stats.num_full_gc,
    num_inc_gc: stats.num_inc_gc,
    heap_used: stats.heap_used,
    heap_total: stats.heap_total,
    base_heap_size: stats.base_heap_size,
    increment: stats.tracked_net_increments
  });
});

// 测试内存泄漏检测
setInterval(() => {
  // 模拟泄漏：每分钟增加约1MB
  global.leakyArray = global.leakyArray || [];
  global.leakyArray.push(new Array(10000).fill('leak'));
}, 1000);
```

### 3.4 内存优化：对象池、流处理

#### 对象池模式

对象池是一种设计模式，通过重用对象来减少内存分配和垃圾回收的压力。

```javascript
// 通用对象池实现
class ObjectPool {
  constructor(factory, initialSize = 10, maxSize = 100) {
    this.factory = factory;
    this.maxSize = maxSize;
    this.pool = [];

    // 预热池子
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.factory());
    }

    console.log(`对象池初始化: ${initialSize} 个对象`);
  }

  // 获取对象
  acquire() {
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    // 池空但未达上限，创建新对象
    if (this.pool.length < this.maxSize) {
      return this.factory();
    }
    throw new Error('对象池已满');
  }

  // 释放对象回池子
  release(obj) {
    if (this.pool.length < this.maxSize) {
      // 重置对象状态
      if (typeof obj.reset === 'function') {
        obj.reset();
      }
      this.pool.push(obj);
    }
    // 超过上限，丢弃对象
  }

  // 获取池子当前大小
  size() {
    return this.pool.length;
  }

  // 清空池子
  clear() {
    this.pool = [];
  }
}

// 数据库连接池示例
class DatabaseConnectionPool {
  constructor(options = {}) {
    this.options = {
      minConnections: options.minConnections || 5,
      maxConnections: options.maxConnections || 20,
      connectionTimeout: options.connectionTimeout || 30000,
      idleTimeout: options.idleTimeout || 60000,
      ...options
    };

    this.pool = [];
    this.activeConnections = 0;
    this.waitQueue = [];

    this.initialize();
  }

  async initialize() {
    console.log('初始化数据库连接池...');
    for (let i = 0; i < this.options.minConnections; i++) {
      const conn = await this.createConnection(i);
      this.pool.push(conn);
    }
    console.log(`连接池初始化完成: ${this.pool.length} 个连接`);
  }

  async createConnection(id) {
    // 模拟数据库连接创建
    return {
      id,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      query: async (sql) => {
        // 模拟查询
        await new Promise(resolve => setTimeout(resolve, 10));
        return { rows: [], affected: 1 };
      },
      close: async () => {
        console.log(`关闭连接 ${id}`);
      }
    };
  }

  async acquire() {
    // 有可用连接
    if (this.pool.length > 0) {
      const conn = this.pool.pop();
      this.activeConnections++;
      conn.lastUsedAt = Date.now();
      return conn;
    }

    // 未达上限，创建新连接
    if (this.activeConnections < this.options.maxConnections) {
      const conn = await this.createConnection(this.activeConnections);
      this.activeConnections++;
      return conn;
    }

    // 达到上限，加入等待队列
    return new Promise((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  release(conn) {
    this.activeConnections--;

    // 有等待的请求
    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift();
      this.activeConnections++;
      resolve(conn);
      return;
    }

    // 检查连接是否超时
    if (Date.now() - conn.lastUsedAt > this.options.idleTimeout) {
      conn.close();
      return;
    }

    // 放回池子
    this.pool.push(conn);
  }

  // 定期清理空闲连接
  startCleanup() {
    return setInterval(() => {
      const now = Date.now();
      const idleConnections = this.pool.filter(
        conn => now - conn.lastUsedAt > this.options.idleTimeout
      );

      idleConnections.forEach(conn => {
        this.pool = this.pool.filter(c => c.id !== conn.id);
        conn.close();
      });

      // 确保最小连接数
      while (this.pool.length < this.options.minConnections) {
        this.createConnection(this.pool.length).then(conn => {
          this.pool.push(conn);
        });
        break;
      }

      if (idleConnections.length > 0) {
        console.log(`清理了 ${idleConnections.length} 个空闲连接`);
      }
    }, 30000);
  }
}

// 使用示例
async function testConnectionPool() {
  const pool = new DatabaseConnectionPool({
    minConnections: 3,
    maxConnections: 10
  });

  // 启动清理
  const cleanupTimer = pool.startCleanup();

  // 模拟查询
  for (let i = 0; i < 5; i++) {
    const conn = await pool.acquire();
    console.log(`获取连接 ${conn.id}`);

    await conn.query('SELECT * FROM users');

    // 模拟业务处理
    await new Promise(resolve => setTimeout(resolve, 100));

    pool.release(conn);
    console.log(`释放连接 ${conn.id}`);
  }

  // 停止清理
  clearInterval(cleanupTimer);
  console.log('测试完成');
}

// Buffer池
class BufferPool {
  constructor(defaultSize = 1024, maxPoolSize = 100) {
    this.defaultSize = defaultSize;
    this.maxPoolSize = maxPoolSize;
    this.pool = [];
  }

  allocate(size = this.defaultSize) {
    if (this.pool.length > 0) {
      const buf = this.pool.pop();
      if (buf.length >= size) {
        buf.fill(0); // 清空缓冲区
        return buf.slice(0, size);
      }
    }
    return Buffer.alloc(size);
  }

  release(buffer) {
    if (this.pool.length < this.maxPoolSize) {
      this.pool.push(buffer);
    }
  }
}
```

#### 流处理优化内存

```javascript
// 使用流处理大文件，避免一次性加载到内存
const fs = require('fs');
const { Transform } = require('stream');

// 行计数器转换流
class LineCounter extends Transform {
  constructor() {
    super({ objectMode: true });
    this.lineCount = 0;
  }

  _transform(chunk, encoding, callback) {
    const lines = chunk.toString().split('\n');
    this.lineCount += lines.length - 1; // 减去最后一行（可能不完整）

    this.push({
      type: 'progress',
      lines: this.lineCount,
      bytes: chunk.length
    });

    callback();
  }

  _flush(callback) {
    this.push({
      type: 'complete',
      totalLines: this.lineCount
    });
    callback();
  }
}

// 数据处理转换流
class DataProcessor extends Transform {
  constructor(options = {}) {
    super({ objectMode: true });
    this.filterField = options.filterField || 'id';
    this.filterValue = options.filterValue;
    this.processedCount = 0;
  }

  _transform(record, encoding, callback) {
    try {
      // 过滤
      if (this.filterValue && record[this.filterField] !== this.filterValue) {
        return callback();
      }

      // 处理
      const processed = {
        ...record,
        processed: true,
        processedAt: Date.now(),
        index: this.processedCount++
      };

      this.push(processed);
      callback();
    } catch (err) {
      callback(err);
    }
  }
}

// JSON解析流
class JSONParseStream extends Transform {
  constructor() {
    super({ readableObjectMode: true });
    this.buffer = '';
  }

  _transform(chunk, encoding, callback) {
    this.buffer += chunk.toString();
    const lines = this.buffer.split('\n');

    // 保留最后一行（可能不完整）
    this.buffer = lines.pop();

    for (const line of lines) {
      if (line.trim()) {
        try {
          this.push(JSON.parse(line));
        } catch (e) {
          // 跳过无效JSON
        }
      }
    }

    callback();
  }

  _flush(callback) {
    if (this.buffer.trim()) {
      try {
        this.push(JSON.parse(this.buffer));
      } catch (e) {
        // 忽略最后的无效JSON
      }
    }
    callback();
  }
}

// 使用流处理大文件的完整示例
async function processLargeFile(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    let totalRecords = 0;
    let processedRecords = 0;
    let errorCount = 0;

    const readStream = fs.createReadStream(inputPath, {
      encoding: 'utf8',
      highWaterMark: 64 * 1024 // 64KB缓冲区
    });

    const writeStream = fs.createWriteStream(outputPath);

    const jsonParser = new JSONParseStream();
    const processor = new DataProcessor({ filterField: 'status', filterValue: 'active' });
    const lineCounter = new LineCounter();

    // 进度报告
    const progressStream = new Transform({
      transform(chunk, encoding, callback) {
        if (chunk.type === 'progress') {
          // 每处理10000行报告一次
          if (processedRecords % 10000 < 1000) {
            console.log(`处理进度: ${chunk.lines} 行, ${chunk.bytes / 1024 / 1024} MB`);
          }
        } else if (chunk.type === 'complete') {
          console.log(`处理完成: 共 ${chunk.totalLines} 行`);
        }
        callback();
      }
    });

    // 处理错误
    readStream.on('error', reject);
    writeStream.on('error', reject);

    // 使用管道连接流
    readStream
      .pipe(lineCounter)
      .pipe(progressStream)
      .pipe(jsonParser)
      .pipe(processor)
      .pipe(writeStream);

    processor.on('data', () => {
      processedRecords++;
    });

    processor.on('error', (err) => {
      errorCount++;
      console.error('处理错误:', err.message);
    });

    writeStream.on('finish', () => {
      resolve({
        totalRecords,
        processedRecords,
        errorCount
      });
    });
  });
}

// 创建处理管道
function createProcessingPipeline(options = {}) {
  const {
    filterConditions = {},
    transformFunction = null,
    batchSize = 1000
  } = options;

  let batch = [];
  let batchCount = 0;

  const batcher = new Transform({
    objectMode: true,

    async transform(record, encoding, callback) {
      batch.push(record);

      if (batch.length >= batchSize) {
        const batchToProcess = [...batch];
        batch = [];
        batchCount++;

        if (transformFunction) {
          try {
            const transformed = await transformFunction(batchToProcess);
            for (const item of transformed) {
              this.push(item);
            }
          } catch (err) {
            console.error(`批次${batchCount}处理失败:`, err);
          }
        } else {
          for (const item of batchToProcess) {
            this.push(item);
          }
        }
      }

      callback();
    },

    flush(callback) {
      // 处理剩余的批次
      if (batch.length > 0) {
        if (transformFunction) {
          transformFunction(batch).then(transformed => {
            for (const item of transformed) {
              this.push(item);
            }
            callback();
          });
        } else {
          for (const item of batch) {
            this.push(item);
          }
          callback();
        }
      } else {
        callback();
      }
    }
  });

  return batcher;
}
```

### 3.5 实战：内存泄漏排查

```javascript
// 完整的内存泄漏排查实战
const http = require('http');
const heapdump = require('heapdump');

// ==================== 模拟内存泄漏的场景 ====================

// 泄漏1：全局变量
global.userSessions = [];
global.requestLogs = [];

// 泄漏2：事件监听器未移除
const EventEmitter = require('events');
class DataEmitter extends EventEmitter {
  constructor() {
    super();
    this.dataBuffer = [];
  }

  addData(data) {
    this.dataBuffer.push(data);
    this.emit('data', data);
  }
}

const globalEmitters = [];

// 泄漏3：定时器未清理
const globalTimers = [];

// 模拟内存泄漏的中间件
function leakyMiddleware(req, res, next) {
  // 泄漏：每个请求都添加数据到全局变量
  global.userSessions.push({
    url: req.url,
    method: req.method,
    timestamp: Date.now(),
    headers: req.headers
  });

  global.requestLogs.push({
    requestId: Math.random().toString(36).substr(2, 9),
    url: req.url,
    startTime: Date.now()
  });

  // 泄漏：每个请求都创建新的事件监听器
  const emitter = new DataEmitter();
  emitter.on('data', (data) => {
    // 永远不清理的监听器
  });
  globalEmitters.push(emitter);

  // 泄漏：每个请求都创建定时器
  const timer = setInterval(() => {
    console.log(`定时器 ${timer} 运行中`);
  }, 5000);
  globalTimers.push(timer);

  next();
}

// ==================== 内存监控 ====================

function startMemoryMonitoring(interval = 10000) {
  const initialMemory = process.memoryUsage();

  console.log('='.repeat(60));
  console.log('内存监控启动');
  console.log('='.repeat(60));
  console.log(`初始堆内存: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);

  let snapshotCount = 0;

  const monitorInterval = setInterval(() => {
    const mem = process.memoryUsage();
    const v8Heap = v8.getHeapStatistics();

    console.log('\n[内存监控]', new Date().toISOString());
    console.log(`  堆使用:    ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  堆总量:    ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  RSS:       ${(mem.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  V8堆限制:  ${(v8Heap.heap_size_limit / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  使用率:    ${((mem.heapUsed / v8Heap.heap_size_limit) * 100).toFixed(2)}%`);

    // 检查泄漏源
    console.log('\n[泄漏源检查]');
    console.log(`  userSessions:    ${global.userSessions.length} 条`);
    console.log(`  requestLogs:     ${global.requestLogs.length} 条`);
    console.log(`  globalEmitters:  ${globalEmitters.length} 个`);
    console.log(`  globalTimers:    ${globalTimers.length} 个`);

    // 每5次监控生成一次快照
    snapshotCount++;
    if (snapshotCount % 5 === 0) {
      captureSnapshot(`auto-${snapshotCount}`);
    }

    // 内存使用超过限制的80%时发出警告
    if ((mem.heapUsed / v8Heap.heap_size_limit) > 0.8) {
      console.error('\n!!! 警告：内存使用超过80% !!!');
      captureSnapshot(`warning-${Date.now()}`);
    }
  }, interval);

  return () => {
    clearInterval(monitorInterval);
    console.log('内存监控已停止');
  };
}

// 捕获堆快照
function captureSnapshot(label) {
  const filename = `./heap-snapshot-${label}-${Date.now()}.heapsnapshot`;
  heapdump.writeSnapshot(filename, (err, filename) => {
    if (err) {
      console.error('快照保存失败:', err);
    } else {
      console.log(`  [快照已保存] ${filename}`);
    }
  });
}

// ==================== 泄漏检测与修复 ====================

// 检测函数
function detectLeaks() {
  const leaks = [];

  // 检测全局数组大小
  if (global.userSessions && global.userSessions.length > 10000) {
    leaks.push({
      type: 'globalVariable',
      name: 'userSessions',
      size: global.userSessions.length,
      recommendation: '使用固定大小的LRU缓存替代全局数组'
    });
  }

  if (global.requestLogs && global.requestLogs.length > 10000) {
    leaks.push({
      type: 'globalVariable',
      name: 'requestLogs',
      size: global.requestLogs.length,
      recommendation: '使用日志轮转或写入文件而非内存'
    });
  }

  if (globalEmitters && globalEmitters.length > 100) {
    leaks.push({
      type: 'eventEmitter',
      name: 'globalEmitters',
      size: globalEmitters.length,
      recommendation: '使用后调用emitter.removeAllListeners()清理'
    });
  }

  if (globalTimers && globalTimers.length > 100) {
    leaks.push({
      type: 'timer',
      name: 'globalTimers',
      size: globalTimers.length,
      recommendation: '使用后调用clearInterval(timer)清理'
    });
  }

  return leaks;
}

// 清理函数
function cleanup() {
  console.log('\n开始清理泄漏...');

  // 清理全局数组
  global.userSessions = [];
  global.requestLogs = [];

  // 清理事件监听器
  globalEmitters.forEach(emitter => {
    emitter.removeAllListeners();
  });
  globalEmitters.length = 0;

  // 清理定时器
  globalTimers.forEach(timer => {
    clearInterval(timer);
  });
  globalTimers.length = 0;

  console.log('清理完成');
}

// ==================== HTTP服务器 ====================

const server = http.createServer((req, res) => {
  leakyMiddleware(req, res, () => {
    if (req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <head><title>内存泄漏测试</title></head>
          <body>
            <h1>内存泄漏测试服务器</h1>
            <p>访问以下端点:</p>
            <ul>
              <li><a href="/leak-test">/leak-test - 触发内存泄漏</a></li>
              <li><a href="/status">/status - 查看内存状态</a></li>
              <li><a href="/detect">/detect - 检测泄漏源</a></li>
              <li><a href="/cleanup">/cleanup - 清理泄漏</a></li>
              <li><a href="/snapshot">/snapshot - 捕获堆快照</a></li>
            </ul>
          </body>
        </html>
      `);
    } else if (req.url === '/leak-test') {
      // 模拟处理
      const result = {
        requestId: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        data: Array.from({ length: 1000 }, (_, i) => ({ id: i, value: Math.random() }))
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } else if (req.url === '/status') {
      const mem = process.memoryUsage();
      const v8Heap = v8.getHeapStatistics();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        memory: {
          heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`,
          rss: `${(mem.rss / 1024 / 1024).toFixed(2)} MB`
        },
        leakSources: {
          userSessions: global.userSessions.length,
          requestLogs: global.requestLogs.length,
          globalEmitters: globalEmitters.length,
          globalTimers: globalTimers.length
        },
        v8: {
          heapSizeLimit: `${(v8Heap.heap_size_limit / 1024 / 1024).toFixed(2)} MB`,
          heapUsagePercent: `${((mem.heapUsed / v8Heap.heap_size_limit) * 100).toFixed(2)}%`
        }
      }, null, 2));
    } else if (req.url === '/detect') {
      const leaks = detectLeaks();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ leaks }, null, 2));
    } else if (req.url === '/cleanup') {
      cleanup();
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('清理完成');
    } else if (req.url === '/snapshot') {
      captureSnapshot('manual');
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('快照已保存');
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });
});

// ==================== 启动 ====================

server.listen(3000, () => {
  console.log('='.repeat(60));
  console.log('内存泄漏排查实战服务器');
  console.log('='.repeat(60));
  console.log('服务器运行在 http://localhost:3000');
  console.log('\n堆快照文件将保存在当前目录');
  console.log('使用Chrome DevTools分析快照:');
  console.log('1. 打开 chrome://inspect');
  console.log('2. 加载快照文件');
  console.log('3. 对比不同时间的快照查找增长');
  console.log('='.repeat(60));

  // 启动内存监控
  const stopMonitoring = startMemoryMonitoring(15000);

  // 优雅关闭
  process.on('SIGINT', () => {
    console.log('\n接收到关闭信号...');
    stopMonitoring();
    cleanup();
    server.close(() => {
      console.log('服务器已关闭');
      process.exit(0);
    });
  });
});
```

---

## 四、CPU优化

### 4.1 JIT编译：热点代码优化

Node.js使用V8引擎，包含一个即时编译器（JIT），能够识别热点代码并进行优化。

```javascript
// V8 JIT优化基础
console.log('=== V8 JIT优化基础 ===');

// V8的优化机制
// 1. 热门函数会被V8的TurboFan编译器优化
// 2. 优化后的代码是高效的机器码
// 3. 但某些模式会导致反优化

// 演示优化函数
function addNumbers(a, b) {
  return a + b;
}

// 预热：调用多次使函数被优化
for (let i = 0; i < 10000; i++) {
  addNumbers(i, i + 1);
}

// 查看函数优化状态
const v8 = require('v8');

// 查看代码缓存信息
console.log('V8代码缓存:', v8.getHeapCodeStatistics());

// 检查是否启用了JIT
console.log('V8优化状态演示:');

// 函数类型稳定性影响优化
function unstableFunction(x) {
  if (typeof x === 'number') {
    return x + 1;
  } else if (typeof x === 'string') {
    return parseInt(x) + 1;
  }
  return x;
}

// 多次调用相同类型参数会获得优化
for (let i = 0; i < 1000; i++) {
  unstableFunction(42); // 始终传入number
}

// 导致反优化的示例
function causesDeoptimization(x) {
  return x + 1;
}

// 传入不同类型会导致反优化
for (let i = 0; i < 500; i++) {
  causesDeoptimization(i);
}
for (let i = 0; i < 500; i++) {
  causesDeoptimization('string'); // 导致反优化
}
```

### 4.2 内联缓存：Inline Cache

内联缓存是V8优化的一项关键技术，通过记住对象类型的形状来加速属性访问。

```javascript
// 内联缓存（Inline Cache）原理

// V8的IC机制会记住：
// 1. 对象的隐藏类（形状）
// 2. 属性在对象中的位置

// 当访问同一形状对象的属性时，直接使用缓存的位置

// 优化示例：保持对象形状一致
class Point {
  constructor(x, y) {
    this.x = x; // 相同形状：x在offset 0
    this.y = y; // 相同形状：y在offset 1
  }
}

// 这样的代码会被V8优化
function createPoints(count) {
  const points = [];
  for (let i = 0; i < count; i++) {
    points.push(new Point(i, i * 2));
  }
  return points;
}

// 性能测试
const iterations = 1000000;
const start = Date.now();

const points = createPoints(iterations);

console.log(`创建 ${iterations} 个点对象耗时: ${Date.now() - start}ms`);

// 避免属性类型变化导致IC失效
// 不好的例子：
const badObjects = [];
for (let i = 0; i < 1000; i++) {
  if (i % 2 === 0) {
    badObjects.push({ x: i, y: i }); // 数字
  } else {
    badObjects.push({ x: String(i), y: String(i) }); // 字符串，IC失效
  }
}

// 好的例子：保持类型一致
const goodObjects = [];
for (let i = 0; i < 1000; i++) {
  goodObjects.push({ x: i, y: i }); // 始终数字
}
```

### 4.3 优化建议：函数类型、稳定类型

```javascript
// 类型稳定优化策略

// 1. 使用尾递归优化（ES6）
// V8支持尾递归优化，但需要正确的尾调用格式

// 优化前：非尾调用
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1); // 不是尾调用，需要保存栈帧
}

// 优化后：尾调用
function factorialTail(n, accumulator = 1) {
  if (n <= 1) return accumulator;
  return factorialTail(n - 1, n * accumulator); // 尾调用
}

// 2. 避免在循环中创建函数
// 不推荐：
function processItemsBad(items) {
  return items.map(function(item) { // 每次迭代创建新函数
    return compute(item);
  });
}

// 推荐：
function compute(item) {
  // 处理逻辑
}
function processItemsGood(items) {
  return items.map(compute); // 复用函数
}

// 3. 使用模块模式的静态变量
const calculator = (function() {
  // 静态变量，不会每次调用重新创建
  const TEMP_BUFFER = new Array(100);

  function process(a, b) {
    // 使用临时缓冲区
    for (let i = 0; i < 100; i++) {
      TEMP_BUFFER[i] = a + b + i;
    }
    return TEMP_BUFFER.reduce((sum, val) => sum + val, 0);
  }

  return { process };
})();

// 4. 批量操作优于逐个操作
function batchProcess(items, batchSize = 100) {
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    // 批量处理
    results.push(...batch.map(item => transform(item)));
  }

  return results;
}

function transform(item) {
  return { ...item, processed: true };
}

// 5. 避免动态属性名
function buildObjectBad(items) {
  const result = {};
  for (const item of items) {
    result[item.id] = item.value; // 动态属性名，V8无法优化
  }
  return result;
}

// 使用Map替代
function buildObjectGood(items) {
  const result = new Map();
  for (const item of items) {
    result.set(item.id, item.value); // Map，V8优化更好
  }
  return result;
}
```

### 4.4 实战：优化JSON解析

```javascript
// JSON解析性能优化实战

const http = require('http');

// 测试数据生成
function generateLargeJSON(count = 10000) {
  const data = {
    users: [],
    metadata: {
      generated: Date.now(),
      count: count
    }
  };

  for (let i = 0; i < count; i++) {
    data.users.push({
      id: i,
      name: `用户${i}`,
      email: `user${i}@example.com`,
      profile: {
        age: Math.floor(Math.random() * 100),
        city: ['北京', '上海', '广州', '深圳'][i % 4],
        tags: ['标签1', '标签2', '标签3'].slice(0, (i % 3) + 1)
      },
      score: Math.floor(Math.random() * 1000),
      active: i % 2 === 0
    });
  }

  return data;
}

// 1. 基础JSON解析
function parseJSONBasic(jsonString) {
  return JSON.parse(jsonString);
}

// 2. 使用流式解析（大型JSON）
const { Transform } = require('stream');

class JSONStreamParser extends Transform {
  constructor(options = {}) {
    super({ readableObjectMode: true, writableObjectMode: true });
    this.buffer = '';
    this.options = options;
  }

  _transform(chunk, encoding, callback) {
    this.buffer += chunk.toString();
    callback();
  }

  _flush(callback) {
    try {
      const result = JSON.parse(this.buffer);
      this.push(result);
    } catch (e) {
      this.emit('error', e);
    }
    callback();
  }
}

// 3. 流式JSON.stringify
class JSONStringifyStream extends Transform {
  constructor(options = {}) {
    super({ writableObjectMode: true, readableObjectMode: true });
    this.options = options;
    this.first = true;
  }

  _transform(obj, encoding, callback) {
    try {
      if (this.first) {
        this.push(JSON.stringify(obj));
        this.first = false;
      } else {
        this.push(',' + JSON.stringify(obj));
      }
      callback();
    } catch (e) {
      callback(e);
    }
  }

  _flush(callback) {
    this.push(']');
    callback();
  }
}

// 4. 优化的JSON选择器（只解析需要的字段）
function parsePartialJSON(jsonString, fields) {
  const parsed = JSON.parse(jsonString);
  const fieldSet = new Set(fields);

  function selectFields(obj, path = '') {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item, i) => selectFields(item, `${path}[${i}]`));
    }

    const result = {};
    for (const key of Object.keys(obj)) {
      const fullPath = path ? `${path}.${key}` : key;
      if (fieldSet.has(key) || fieldSet.has(fullPath)) {
        result[key] = selectFields(obj[key], fullPath);
      }
    }
    return result;
  }

  return selectFields(parsed);
}

// 5. 批量解析优化
class BatchJSONParser {
  constructor(batchSize = 1000) {
    this.batchSize = batchSize;
    this.pending = [];
    this.callbacks = [];
  }

  add(jsonString) {
    return new Promise((resolve) => {
      this.pending.push({ json: jsonString, resolve });
    });
  }

  async processAll() {
    const results = [];

    while (this.pending.length > 0) {
      const batch = this.pending.splice(0, this.batchSize);

      for (const item of batch) {
        try {
          item.resolve(JSON.parse(item.json));
        } catch (e) {
          item.resolve(null);
        }
      }
    }

    return results;
  }
}

// HTTP服务器测试
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/benchmark') {
    const count = parseInt(url.searchParams.get('count') || '10000');
    const iterations = parseInt(url.searchParams.get('iterations') || '10');

    console.log(`开始基准测试: ${iterations}次迭代，每次${count}条记录`);

    const largeData = generateLargeJSON(count);
    const jsonString = JSON.stringify(largeData);

    const results = {
      parseBasic: [],
      parsePartial: [],
      stringifiedLength: jsonString.length
    };

    // 测试基础解析
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      parseJSONBasic(jsonString);
      results.parseBasic.push(Date.now() - start);
    }

    // 测试部分解析
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      parsePartialJSON(jsonString, ['users', 'metadata']);
      results.parsePartial.push(Date.now() - start);
    }

    // 统计结果
    const avgBasic = results.parseBasic.reduce((a, b) => a + b, 0) / iterations;
    const avgPartial = results.parsePartial.reduce((a, b) => a + b, 0) / iterations;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      iterations,
      recordCount: count,
      results: {
        parseBasic: {
          avg: avgBasic.toFixed(2),
          min: Math.min(...results.parseBasic),
          max: Math.max(...results.parseBasic)
        },
        parsePartial: {
          avg: avgPartial.toFixed(2),
          min: Math.min(...results.parsePartial),
          max: Math.max(...results.parsePartial)
        },
        improvement: ((avgBasic - avgPartial) / avgBasic * 100).toFixed(2) + '%'
      }
    }, null, 2));
  } else if (url.pathname === '/stream-parse') {
    // 流式解析测试
    const count = parseInt(url.searchParams.get('count') || '10000');
    const data = generateLargeJSON(count);
    const jsonString = JSON.stringify(data);

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Transfer-Encoding': 'chunked'
    });

    const parser = new JSONStreamParser();
    let objectCount = 0;

    parser.on('data', (obj) => {
      objectCount++;
    });

    parser.on('end', () => {
      res.end(JSON.stringify({ objectCount }));
    });

    // 分块发送
    const chunkSize = 1024;
    for (let i = 0; i < jsonString.length; i += chunkSize) {
      parser.write(jsonString.slice(i, i + chunkSize));
    }
    parser.end();
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('JSON解析优化测试服务器\n\n端点:\n  /benchmark?count=10000&iterations=10\n  /stream-parse?count=10000');
  }
});

server.listen(3000, () => {
  console.log('JSON解析优化服务器运行在 http://localhost:3000');
  console.log('运行: /benchmark?count=10000&iterations=10');
});
```

---

## 五、异步编程优化

### 5.1 回调地狱：Promise化

回调函数嵌套过深会导致"回调地狱"，Promise化是解决这个问题的基础。

```javascript
// 回调地狱示例
function callbackHell() {
  // 传统的回调嵌套
  fs.readFile('file1.txt', 'utf8', (err, data1) => {
    if (err) {
      console.error('读取file1失败:', err);
      return;
    }

    fs.readFile('file2.txt', 'utf8', (err, data2) => {
      if (err) {
        console.error('读取file2失败:', err);
        return;
      }

      fs.readFile('file3.txt', 'utf8', (err, data3) => {
        if (err) {
          console.error('读取file3失败:', err);
          return;
        }

        // 最终处理
        const result = process(data1, data2, data3);
        console.log('处理结果:', result);
      });
    });
  });
}

// Promise化实现
const fs = require('fs').promises;

async function promiseBasedRead() {
  try {
    const data1 = await fs.readFile('file1.txt', 'utf8');
    const data2 = await fs.readFile('file2.txt', 'utf8');
    const data3 = await fs.readFile('file3.txt', 'utf8');

    const result = process(data1, data2, data3);
    console.log('处理结果:', result);
  } catch (err) {
    console.error('处理失败:', err);
  }
}

// promisify工具将回调函数转换为Promise
const { promisify } = require('util');
const readFile = promisify(fs.readFile);

// 自定义回调函数Promise化
function promisifyCallback(fn) {
  return function(...args) {
    return new Promise((resolve, reject) => {
      fn(...args, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  };
}

// 示例：传统API的Promise包装
function fetchDataCallback(url, callback) {
  http.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => callback(null, JSON.parse(data)));
  }).on('error', callback);
}

// 包装后
const fetchData = promisifyCallback(fetchDataCallback);
```

### 5.2 并发控制：Promise.all vs 限流

Promise.all虽然方便，但在高并发场景下可能导致资源耗尽，需要配合限流使用。

```javascript
// 并发控制实战

// 1. Promise.all - 全部并发（适合小量并发）
async function fetchAll(urls) {
  const results = await Promise.all(
    urls.map(url => fetch(url))
  );
  return results;
}

// 问题示例：1000个并发请求可能导致：
// - 打开太多连接
// - 内存暴涨
// - 触发服务器限流
async function badApproach(urls) {
  return Promise.all(urls.map(url => httpGet(url)));
}

// 2. 限流器实现
class ConcurrencyLimiter {
  constructor(maxConcurrent = 5) {
    this.maxConcurrent = maxConcurrent;
    this.running = 0;
    this.queue = [];
  }

  async run(fn) {
    return new Promise((resolve, reject) => {
      const task = () => {
        this.running++;
        fn()
          .then(result => {
            resolve(result);
            this.running--;
            this.processQueue();
          })
          .catch(err => {
            reject(err);
            this.running--;
            this.processQueue();
          });
      };

      if (this.running < this.maxConcurrent) {
        task();
      } else {
        this.queue.push(task);
      }
    });
  }

  processQueue() {
    if (this.queue.length > 0 && this.running < this.maxConcurrent) {
      const nextTask = this.queue.shift();
      nextTask();
    }
  }

  getStats() {
    return {
      running: this.running,
      queued: this.queue.length
    };
  }
}

// 3. 批量并发控制
async function batchProcess(items, concurrency = 5, processor) {
  const results = [];
  const limiter = new ConcurrencyLimiter(concurrency);

  const promises = items.map(item => limiter.run(() => processor(item)));
  results.push(...await Promise.all(promises));

  return results;
}

// 4. 带超时的并发控制
async function withTimeout(promise, timeoutMs) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), timeoutMs)
  );
  return Promise.race([promise, timeout]);
}

// 5. 重试机制
async function withRetry(fn, maxRetries = 3, delayMs = 1000) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      console.log(`重试 ${i + 1}/${maxRetries}:`, err.message);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }

  throw lastError;
}

// 6. 完整的高并发处理示例
class RequestBatcher {
  constructor(options = {}) {
    this.maxConcurrent = options.maxConcurrent || 10;
    this.maxQueue = options.maxQueue || 1000;
    this.retryCount = options.retryCount || 3;
    this.timeout = options.timeout || 10000;
    this.running = 0;
    this.queue = [];
  }

  async add(request) {
    return new Promise((resolve, reject) => {
      const task = async () => {
        try {
          const result = await withTimeout(
            this.executeRequest(request),
            this.timeout
          );
          resolve(result);
        } catch (err) {
          if (request.retries < this.retryCount) {
            request.retries = (request.retries || 0) + 1;
            this.queue.push(task);
          } else {
            reject(err);
          }
        }
      };

      if (this.running < this.maxConcurrent) {
        this.running++;
        task();
      } else if (this.queue.length < this.maxQueue) {
        this.queue.push(task);
      } else {
        reject(new Error('队列已满'));
      }
    });
  }

  async executeRequest(request) {
    // 实际发送请求的逻辑
    return { success: true, data: request };
  }

  processQueue() {
    while (this.running < this.maxConcurrent && this.queue.length > 0) {
      this.running++;
      const task = this.queue.shift();
      task().finally(() => {
        this.running--;
        this.processQueue();
      });
    }
  }

  getStats() {
    return {
      running: this.running,
      queued: this.queue.length,
      maxConcurrent: this.maxConcurrent
    };
  }
}
```

### 5.3 错误处理：try-catch vs .catch

```javascript
// 错误处理策略

// 1. async/await 与 try-catch
async function handleErrors() {
  try {
    const data = await fetchData();
    return processData(data);
  } catch (err) {
    console.error('操作失败:', err);
    return null;
  }
}

// 2. 错误传播
async function propagateErrors() {
  // 错误会向上传播
  const data = await riskyOperation(); // 如果失败，直接抛出
  return safeOperation(data);
}

// 3. 错误边界（Web应用中）
class ErrorBoundary {
  constructor() {
    this.error = null;
  }

  async run(fn) {
    try {
      return await fn();
    } catch (err) {
      this.error = err;
      console.error('边界捕获错误:', err);
      return this.getFallback();
    }
  }

  getFallback() {
    if (this.error) {
      return { error: this.error.message, fallback: true };
    }
    return null;
  }
}

// 4. 多个await的错误处理
async function handleMultipleAwaits() {
  const results = [];
  const errors = [];

  const operations = [
    fetchAPI1,
    fetchAPI2,
    fetchAPI3,
    fetchAPI4
  ];

  // 并行执行，收集所有结果和错误
  const promises = operations.map(async (op, i) => {
    try {
      const result = await op();
      return { index: i, success: true, data: result };
    } catch (err) {
      return { index: i, success: false, error: err.message };
    }
  });

  const settled = await Promise.all(promises);

  for (const result of settled) {
    if (result.success) {
      results.push(result.data);
    } else {
      errors.push({ index: result.index, error: result.error });
    }
  }

  return { results, errors };
}

// 5. finally清理
async function withCleanup() {
  const resource = acquireResource();

  try {
    return await useResource(resource);
  } finally {
    releaseResource(resource); // 始终执行清理
  }
}

// 6. 错误处理中间件模式
class AsyncHandler {
  static wrap(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}

// Express中使用
// app.get('/api/data', AsyncHandler.wrap(async (req, res) => {
//   const data = await fetchData();
//   res.json(data);
// }));
```

### 5.4 异步流程控制：async/await

```javascript
// async/await高级用法

// 1. 顺序执行
async function sequential() {
  const start = Date.now();
  const a = await task1(); // 100ms
  const b = await task2(); // 100ms
  const c = await task3(); // 100ms
  // 总计: 300ms
  console.log(`顺序执行耗时: ${Date.now() - start}ms`);
}

// 2. 并行执行
async function parallel() {
  const start = Date.now();
  const [a, b, c] = await Promise.all([task1(), task2(), task3()]);
  // 总计: 100ms
  console.log(`并行执行耗时: ${Date.now() - start}ms`);
}

// 3. 并行但限制并发数
async function parallelLimit(tasks, limit = 5) {
  const results = [];
  const executing = [];

  for (const task of tasks) {
    const promise = task().then(result => {
      results.push(result);
      executing.splice(executing.indexOf(promise), 1);
    });

    executing.push(promise);

    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }

  return Promise.all(executing).then(() => results);
}

// 4. 串行 Promise 链
async function serialPromise() {
  const tasks = [task1, task2, task3, task4, task5];

  return tasks.reduce(async (acc, task) => {
    const results = await acc;
    const result = await task();
    return [...results, result];
  }, Promise.resolve([]));
}

// 5. 异步迭代
async function asyncIterator() {
  const asyncIterable = {
    [Symbol.asyncIterator]() {
      let i = 0;
      return {
        next() {
          if (i < 10) {
            return Promise.resolve({ value: i++, done: false });
          }
          return Promise.resolve({ done: true });
        }
      };
    }
  };

  for await (const value of asyncIterable) {
    console.log(value);
  }
}

// 6. 异步队列
class AsyncQueue {
  constructor(concurrency = 1) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  async add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.process();
    });
  }

  async process() {
    while (this.running < this.concurrency && this.queue.length > 0) {
      const { fn, resolve, reject } = this.queue.shift();
      this.running++;

      fn()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          this.running--;
          this.process();
        });
    }
  }
}

// 辅助函数
function task(delay = 100) {
  return () => new Promise(resolve =>
    setTimeout(() => {
      console.log(`Task completed after ${delay}ms`);
      resolve(delay);
    }, delay)
  );
}
```

### 5.5 实战：高并发请求处理

```javascript
// 高并发请求处理实战

const http = require('http');
const { URL } = require('url');

// ==================== 连接池管理 ====================

class ConnectionPool {
  constructor(options = {}) {
    this.maxConnections = options.maxConnections || 100;
    this.minConnections = options.minConnections || 10;
    this.acquireTimeout = options.acquireTimeout || 5000;
    this.idleTimeout = options.idleTimeout || 30000;

    this.pool = [];
    this.waitQueue = [];
    this.stats = { acquired: 0, released: 0, timedout: 0 };
  }

  acquire() {
    return new Promise((resolve, reject) => {
      if (this.pool.length > 0) {
        const conn = this.pool.pop();
        this.stats.acquired++;
        resolve(conn);
      } else if (this.activeCount() < this.maxConnections) {
        this.stats.acquired++;
        resolve(this.createConnection());
      } else {
        const timeout = setTimeout(() => {
          this.waitQueue = this.waitQueue.filter(r => r.resolve !== resolve);
          this.stats.timedout++;
          reject(new Error('获取连接超时'));
        }, this.acquireTimeout);

        this.waitQueue.push({ resolve, reject, timeout });
      }
    });
  }

  release(conn) {
    if (this.waitQueue.length > 0) {
      const waiter = this.waitQueue.shift();
      clearTimeout(waiter.timeout);
      waiter.resolve(conn);
    } else {
      this.pool.push(conn);
    }
    this.stats.released++;
  }

  createConnection() {
    return { id: Date.now(), createdAt: Date.now() };
  }

  activeCount() {
    return this.pool.length + this.waitQueue.length;
  }

  getStats() {
    return {
      ...this.stats,
      poolSize: this.pool.length,
      waiting: this.waitQueue.length,
      active: this.activeCount()
    };
  }

  cleanup() {
    const now = Date.now();
    this.pool = this.pool.filter(conn => {
      return now - conn.createdAt < this.idleTimeout;
    });
  }
}

// ==================== 请求限流器 ====================

class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000; // 时间窗口
    this.maxRequests = options.maxRequests || 100; // 最大请求数
    this.blockDuration = options.blockDuration || 60000; // 封禁时长

    this.requests = new Map();
    this.blocks = new Map();
  }

  isBlocked(ip) {
    const block = this.blocks.get(ip);
    if (block && Date.now() < block.expires) {
      return true;
    }
    this.blocks.delete(ip);
    return false;
  }

  checkLimit(ip) {
    if (this.isBlocked(ip)) {
      return { allowed: false, reason: 'blocked', retryAfter: this.blockDuration };
    }

    const now = Date.now();
    const record = this.requests.get(ip) || { count: 0, resetAt: now + this.windowMs };

    if (now >= record.resetAt) {
      record.count = 1;
      record.resetAt = now + this.windowMs;
    } else {
      record.count++;
    }

    this.requests.set(ip, record);

    if (record.count > this.maxRequests) {
      this.blocks.set(ip, { expires: now + this.blockDuration });
      return { allowed: false, reason: 'rate_limit', retryAfter: this.blockDuration };
    }

    return { allowed: true, remaining: this.maxRequests - record.count };
  }

  cleanup() {
    const now = Date.now();
    for (const [ip, record] of this.requests) {
      if (now >= record.resetAt) {
        this.requests.delete(ip);
      }
    }
  }
}

// ==================== 请求处理器 ====================

class RequestHandler {
  constructor() {
    this.connPool = new ConnectionPool({ maxConnections: 50 });
    this.rateLimiter = new RateLimiter({
      windowMs: 60000,
      maxRequests: 100,
      blockDuration: 60000
    });

    this.requestCount = 0;
    this.errorCount = 0;
    this.totalLatency = 0;
  }

  async handle(req, res) {
    const startTime = Date.now();
    const ip = req.socket.remoteAddress;

    // 限流检查
    const limitCheck = this.rateLimiter.checkLimit(ip);
    if (!limitCheck.allowed) {
      res.writeHead(429, {
        'Content-Type': 'application/json',
        'Retry-After': limitCheck.retryAfter / 1000
      });
      res.end(JSON.stringify({ error: 'Too Many Requests' }));
      return;
    }

    try {
      const conn = await this.connPool.acquire();
      this.requestCount++;

      // 模拟请求处理
      await this.processRequest(req, conn);

      this.connPool.release(conn);

      const latency = Date.now() - startTime;
      this.totalLatency += latency;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        requestId: this.requestCount,
        latency
      }));
    } catch (err) {
      this.errorCount++;
      console.error('请求处理错误:', err);

      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  }

  async processRequest(req, conn) {
    // 模拟异步处理
    return new Promise(resolve => setTimeout(resolve, Math.random() * 100));
  }

  getStats() {
    return {
      requests: this.requestCount,
      errors: this.errorCount,
      errorRate: this.errorCount / this.requestCount * 100,
      avgLatency: this.requestCount > 0 ? this.totalLatency / this.requestCount : 0,
      connectionPool: this.connPool.getStats()
    };
  }
}

// ==================== 启动服务器 ====================

const handler = new RequestHandler();

const server = http.createServer(async (req, res) => {
  try {
    await handler.handle(req, res);
  } catch (err) {
    console.error('未处理的请求错误:', err);
  }
});

// 定期清理
setInterval(() => {
  handler.connPool.cleanup();
  handler.rateLimiter.cleanup();
}, 30000);

// 定期报告统计
setInterval(() => {
  const stats = handler.getStats();
  console.log('[统计]', JSON.stringify(stats));
}, 10000);

server.listen(3000, () => {
  console.log('高并发请求处理服务器运行在 http://localhost:3000');
  console.log('限流配置: 100请求/分钟, 超出后封禁1分钟');
});
```

---

## 六、流处理

### 6.1 Stream四类型：Readable、Writable、Duplex、Transform

Node.js的Stream是处理流式数据的核心抽象，四种类型各有用途。

```javascript
// ==================== Readable流 ====================

const { Readable } = require('stream');

// 自定义可读流
class NumberReadable extends Readable {
  constructor(start, end) {
    super();
    this.start = start;
    this.end = end;
    this.current = start;
  }

  _read() {
    if (this.current > this.end) {
      this.push(null); // 数据结束
    } else {
      this.push(String(this.current++));
    }
  }
}

// 使用
const numbers = new NumberReadable(1, 100);
numbers.on('data', chunk => {
  console.log('读取:', chunk.toString());
});
numbers.on('end', () => {
  console.log('流结束');
});

// ==================== Writable流 ====================

const { Writable } = require('stream');

// 自定义可写流
class ConsoleWritable extends Writable {
  constructor(options) {
    super(options);
    this.chunkCount = 0;
  }

  _write(chunk, encoding, callback) {
    this.chunkCount++;
    console.log(`[写#${this.chunkCount}]`, chunk.toString());
    callback(); // 必须调用callback表示处理完成
  }
}

// 使用
const writer = new ConsoleWritable();
writer.write('Hello');
writer.write('World');
writer.end('End');

// ==================== Duplex流（双向） ====================

const { Duplex } = require('stream');

// Duplex流同时实现Readable和Writable
class DuplexStream extends Duplex {
  constructor(options) {
    super(options);
    this.data = [];
  }

  _read(size) {
    const chunk = this.data.shift();
    if (chunk) {
      this.push(chunk);
    } else {
      // 延迟读取模拟异步
      setTimeout(() => {
        if (this.data.length > 0) {
          this.push(this.data.shift());
        }
      }, 100);
    }
  }

  _write(chunk, encoding, callback) {
    this.data.push(chunk);
    callback();
  }
}

// ==================== Transform流（转换） ====================

const { Transform } = require('stream');

// Transform流在读写之间转换数据
class UpperCaseTransform extends Transform {
  constructor() {
    super();
  }

  _transform(chunk, encoding, callback) {
    const upperCased = chunk.toString().toUpperCase();
    this.push(upperCased);
    callback();
  }
}

// 使用管道连接流
const transform = new UpperCaseTransform();
transform.on('data', chunk => {
  console.log('转换后:', chunk.toString());
});

transform.write('hello');
transform.write('world');
transform.end();

// ==================== PassThrough流（透传） ====================

const { PassThrough } = require('stream');

// PassThrough是一种特殊的Transform，不做任何转换
// 常用于监视或复制数据流
const pass = new PassThrough();

// 监听数据
pass.on('data', chunk => {
  console.log('监视到数据:', chunk.toString());
});

// 同时可以继续传递
const upper = new UpperCaseTransform();
pass.pipe(upper);

pass.write('test'); // 监视到: test
upper.on('data', chunk => {
  console.log('最终结果:', chunk.toString()); // 最终结果: TEST
});
```

### 6.2 管道：pipe

管道是连接流的最常用方式，自动处理背压问题。

```javascript
const { Readable, Writable, pipeline } = require('stream');
const fs = require('fs');

// ==================== 基本管道 ====================

// 从文件读取并写入新文件
const readable = fs.createReadStream(__filename);
const writable = fs.createWriteStream(__filename + '.bak');

readable.pipe(writable, { end: true });

writable.on('finish', () => {
  console.log('文件复制完成');
});

// ==================== 多重管道 ====================

// 读取 -> 压缩 -> 加密 -> 写入
const { createGzip } = require('zlib');

const input = fs.createReadStream('large-file.txt');
const gzip = createGzip();
const output = fs.createWriteStream('large-file.txt.gz');

input.pipe(gzip).pipe(output);

// ==================== pipeline API（推荐） ====================

// pipeline会自动处理错误并正确清理
async function usePipeline() {
  const { pipeline } = require('stream/promises');

  const readable = fs.createReadStream('input.txt');
  const transform = new UpperCaseTransform();
  const writable = fs.createWriteStream('output.txt');

  await pipeline(readable, transform, writable);
  console.log('管道处理完成');
}

// ==================== 手动处理背压 ====================

class BackPressureWritable extends Writable {
  constructor(highWaterMark = 16 * 1024) {
    super({ highWaterMark });
    this.bytesWritten = 0;
  }

  _write(chunk, encoding, callback) {
    // 模拟异步写入操作
    setTimeout(() => {
      this.bytesWritten += chunk.length;
      console.log(`写入 ${chunk.length} bytes, 总计: ${this.bytesWritten}`);
      callback(); // 只有完成当前写入后才继续
    }, 10);
  }
}

// 演示背压机制
const r = new Readable({ highWaterMark: 64 * 1024 });
let i = 0;

r._read = function(size) {
  if (i < 1000) {
    const chunk = Buffer.from(`chunk-${i++}\n`);
    const ok = this.push(chunk);
    if (!ok) {
      console.log('背压：暂停读取');
    }
  } else {
    this.push(null);
  }
};

const w = new BackPressureWritable();

r.pipe(w);
```

### 6.3 背压：backpressure

背压是流处理中的重要概念，当消费者处理速度慢于生产者时，需要暂停数据产生。

```javascript
// 背压处理详解

const { Readable, Writable, Transform } = require('stream');

// 生产者：高速生成数据
class FastProducer extends Readable {
  constructor(count) {
    super({ objectMode: true });
    this.count = count;
    this.index = 0;
  }

  _read() {
    const batchSize = 100; // 每次生成100个
    let emitted = 0;

    while (this.index < this.count && emitted < batchSize) {
      const ok = this.push({
        id: this.index++,
        timestamp: Date.now(),
        data: 'x'.repeat(1000) // 模拟1KB数据
      });
      emitted++;

      if (!ok) {
        console.log(`[生产者] 背压：缓冲区已满，暂停生产`);
        break;
      }
    }

    if (this.index >= this.count) {
      this.push(null);
      console.log(`[生产者] 生产完成，总计: ${this.count}`);
    }
  }
}

// 消费者：慢速处理数据
class SlowConsumer extends Writable {
  constructor(options = {}) {
    super({ objectMode: true, ...options });
    this.processed = 0;
    this.startTime = Date.now();
    this.processingDelay = options.processingDelay || 10; // 每条处理10ms
  }

  _write(chunk, encoding, callback) {
    setTimeout(() => {
      this.processed++;
      if (this.processed % 100 === 0) {
        console.log(`[消费者] 已处理: ${this.processed}, 耗时: ${Date.now() - this.startTime}ms`);
      }
      callback();
    }, this.processingDelay);
  }
}

// 演示背压
console.log('=== 背压演示 ===');
const producer = new FastProducer(1000);
const consumer = new SlowConsumer({ processingDelay: 5 });

producer.on('pause', () => console.log('[事件] 暂停'));
producer.on('resume', () => console.log('[事件] 恢复'));

consumer.on('drain', () => console.log('[事件] drain: 缓冲区已清空，可以继续写入'));

const startTime = Date.now();
producer.pipe(consumer);

consumer.on('finish', () => {
  console.log(`\n=== 处理完成 ===`);
  console.log(`总计处理: ${consumer.processed}`);
  console.log(`总耗时: ${Date.now() - startTime}ms`);
});

// ==================== 手动背压控制 ====================

class ControlledBackpressure {
  constructor(readable, writable, options = {}) {
    this.readable = readable;
    this.writable = writable;
    this.highWaterMark = options.highWaterMark || 16 * 1024;
    this.buffer = [];
    this.writing = false;
    this.needMoreData = true;
  }

  async start() {
    this.readable.on('data', (chunk) => {
      if (this.buffer.length >= this.highWaterMark) {
        this.readable.pause();
        this.needMoreData = false;
      }
      this.buffer.push(chunk);
      this.processBuffer();
    });

    this.readable.on('end', () => {
      this.processBuffer(true);
    });

    this.writable.on('drain', () => {
      this.processBuffer();
    });

    this.readable.on('error', (err) => {
      console.error('读取错误:', err);
    });

    this.writable.on('error', (err) => {
      console.error('写入错误:', err);
    });
  }

  processBuffer(isFinal = false) {
    if (this.writing) return;

    this.writing = true;

    while (this.buffer.length > 0) {
      const chunk = this.buffer[0];

      const canContinue = this.writable.write(chunk);

      if (!canContinue) {
        this.buffer.shift();
        this.writing = false;
        return;
      }

      this.buffer.shift();
    }

    this.writing = false;

    if (isFinal) {
      this.writable.end();
    } else if (!this.needMoreData) {
      this.needMoreData = true;
      this.readable.resume();
    }
  }
}
```

### 6.4 实战：大文件处理

```javascript
// 大文件处理实战

const fs = require('fs');
const { pipeline, Transform, Readable, Writable } = require('stream');
const { promisify } = require('util');
const pipelineAsync = promisify(pipeline);
const zlib = require('zlib');

// ==================== 大文件复制（流式） ====================

async function copyFileWithStreams(source, destination) {
  const readStream = fs.createReadStream(source, {
    highWaterMark: 64 * 1024 // 64KB缓冲区
  });

  const writeStream = fs.createWriteStream(destination, {
    highWaterMark: 64 * 1024
  });

  await pipelineAsync(readStream, writeStream);
  console.log(`文件复制完成: ${destination}`);
}

// ==================== 大文件压缩 ====================

async function compressFile(inputPath, outputPath) {
  const gzip = zlib.createGzip({
    level: 6, // 压缩级别 1-9
    memLevel: 8 // 内存级别
  });

  await pipelineAsync(
    fs.createReadStream(inputPath),
    gzip,
    fs.createWriteStream(outputPath + '.gz')
  );

  console.log(`压缩完成: ${outputPath}.gz`);
}

// ==================== CSV流式处理器 ====================

class CSVParser extends Transform {
  constructor(options = {}) {
    super({ objectMode: true });
    this.headers = null;
    this.delimiter = options.delimiter || ',';
    this.buffer = '';
  }

  _transform(chunk, encoding, callback) {
    this.buffer += chunk.toString();
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop(); // 保留最后一行

    for (const line of lines) {
      if (!this.headers) {
        this.headers = line.split(this.delimiter).map(h => h.trim());
      } else if (line.trim()) {
        const values = line.split(this.delimiter).map(v => v.trim());
        const row = {};
        this.headers.forEach((header, i) => {
          row[header] = values[i];
        });
        this.push(row);
      }
    }

    callback();
  }

  _flush(callback) {
    // 处理最后一行
    if (this.buffer && this.headers) {
      const values = this.buffer.split(this.delimiter).map(v => v.trim());
      const row = {};
      this.headers.forEach((header, i) => {
        row[header] = values[i];
      });
      this.push(row);
    }
    callback();
  }
}

class CSVValidator extends Transform {
  constructor(schema) {
    super({ objectMode: true });
    this.schema = schema;
    this.errors = [];
  }

  _transform(row, encoding, callback) {
    const validationErrors = [];

    for (const [field, rules] of Object.entries(this.schema)) {
      const value = row[field];

      if (rules.required && (value === undefined || value === '')) {
        validationErrors.push(`字段 ${field} 是必填的`);
      }

      if (rules.type === 'number' && isNaN(parseFloat(value))) {
        validationErrors.push(`字段 ${field} 必须是数字`);
      }

      if (rules.type === 'string' && typeof value !== 'string') {
        validationErrors.push(`字段 ${field} 必须是字符串`);
      }

      if (rules.minLength && value.length < rules.minLength) {
        validationErrors.push(`字段 ${field} 长度必须至少 ${rules.minLength}`);
      }
    }

    if (validationErrors.length > 0) {
      this.errors.push({ row, errors: validationErrors });
    } else {
      this.push(row);
    }

    callback();
  }
}

class CSVWriter extends Writable {
  constructor(outputPath, options = {}) {
    super({ objectMode: true });
    this.output = fs.createWriteStream(outputPath);
    this.headers = options.headers || null;
    this.delimiter = options.delimiter || ',';
    this.writtenCount = 0;
  }

  _write(row, encoding, callback) {
    if (!this.headers) {
      this.headers = Object.keys(row);
      this.output.write(this.headers.join(this.delimiter) + '\n');
    }

    const values = this.headers.map(h => row[h] || '');
    this.output.write(values.join(this.delimiter) + '\n');
    this.writtenCount++;
    callback();
  }

  _final(callback) {
    this.output.end();
    console.log(`写入完成: ${this.writtenCount} 行`);
    callback();
  }
}

// 使用CSV处理器
async function processLargeCSV(inputPath, outputPath) {
  const validatorSchema = {
    id: { required: true, type: 'string' },
    name: { required: true, type: 'string', minLength: 2 },
    email: { required: true, type: 'string' },
    age: { type: 'number' }
  };

  let processedCount = 0;
  let errorCount = 0;

  const parser = new CSVParser();
  const validator = new CSVValidator(validatorSchema);
  const writer = new CSVWriter(outputPath);

  parser.on('data', (row) => {
    processedCount++;
    if (processedCount % 10000 === 0) {
      console.log(`处理进度: ${processedCount} 行`);
    }
  });

  validator.on('data', (row) => {
    writer.write(row);
  });

  // 错误收集
  const errors = [];
  validator.on('error', (err) => {
    errors.push(err);
    errorCount++;
  });

  await pipelineAsync(
    fs.createReadStream(inputPath),
    parser,
    validator,
    writer
  );

  console.log(`处理完成: 成功 ${processedCount - errorCount}, 失败 ${errorCount}`);

  return { processedCount, errorCount, errors };
}

// ==================== 流式JSON处理 ====================

class JSONArrayParser extends Transform {
  constructor(options = {}) {
    super({ readableObjectMode: true });
    this.buffer = '';
    this.inArray = false;
    this.bracketCount = 0;
  }

  _transform(chunk, encoding, callback) {
    this.buffer += chunk.toString();
    let i = 0;

    while (i < this.buffer.length) {
      const char = this.buffer[i];

      if (char === '[' && !this.inArray) {
        this.inArray = true;
      } else if (this.inArray) {
        if (char === '{') {
          this.bracketCount++;
        } else if (char === '}') {
          this.bracketCount--;
          if (this.bracketCount === 0) {
            // 找到一个完整的JSON对象
            const jsonStr = this.buffer.slice(0, i + 1);
            try {
              const obj = JSON.parse(jsonStr);
              this.push(obj);
              this.buffer = this.buffer.slice(i + 1);
              i = -1; // 重置索引
            } catch (e) {
              // JSON不完整，继续读取
            }
          }
        }
      }
      i++;
    }

    callback();
  }
}

// ==================== HTTP大文件上传处理 ====================

const http = require('http');
const path = require('path');

class FileUploadHandler extends Transform {
  constructor(uploadDir) {
    super();
    this.uploadDir = uploadDir;
    this.currentFile = null;
    this.bytesWritten = 0;
    this.boundary = null;
  }

  _transform(chunk, encoding, callback) {
    // 简化版：直接写入文件
    if (!this.currentFile) {
      const filename = `upload-${Date.now()}.bin`;
      this.currentFile = fs.createWriteStream(
        path.join(this.uploadDir, filename)
      );
    }

    this.currentFile.write(chunk, () => {
      this.bytesWritten += chunk.length;
      callback();
    });
  }

  _flush(callback) {
    if (this.currentFile) {
      this.currentFile.end();
    }
    callback();
  }
}

// ==================== 测试 ====================

async function testStreams() {
  // 创建测试文件
  const testFile = './test-large-file.txt';
  const writeStream = fs.createWriteStream(testFile);

  for (let i = 0; i < 100000; i++) {
    writeStream.write(`Line ${i}: ${'x'.repeat(50)}\n`);
  }
  writeStream.end();

  await new Promise(resolve => writeStream.on('finish', resolve));

  console.log('测试文件创建完成');

  // 流式复制
  await copyFileWithStreams(testFile, './test-large-file-copy.txt');

  // 压缩
  await compressFile(testFile, './test-large-file-compressed');
}

testStreams().catch(console.error);
```

---

## 七、缓存策略

### 7.1 内存缓存：LRU

LRU（Least Recently Used）缓存是性能优化的核心工具。

```javascript
// LRU缓存实现

class LRUCache {
  constructor(maxSize = 100, ttl = null) {
    this.maxSize = maxSize;
    this.ttl = ttl; // 毫秒
    this.cache = new Map();
  }

  // 设置缓存项
  set(key, value) {
    // 如果key已存在，删除旧项
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // 如果达到最大容量，删除最旧的项
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    // 添加新项
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  // 获取缓存项
  get(key) {
    const item = this.cache.get(key);

    if (!item) return null;

    // 检查TTL
    if (this.ttl && Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // 移动到最新位置
    this.cache.delete(key);
    this.cache.set(key, item);

    return item.value;
  }

  // 检查是否存在
  has(key) {
    const item = this.cache.get(key);

    if (!item) return false;

    // 检查TTL
    if (this.ttl && Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // 删除缓存项
  delete(key) {
    return this.cache.delete(key);
  }

  // 清空缓存
  clear() {
    this.cache.clear();
  }

  // 获取统计信息
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl
    };
  }
}

// 使用示例
const cache = new LRUCache(3); // 最多3项

cache.set('a', 1);
cache.set('b', 2);
cache.set('c', 3);

console.log(cache.get('a')); // 1, 'a'移动到最后

cache.set('d', 4); // 删除最旧的'b'

console.log(cache.get('b')); // null, 已被删除
console.log(cache.get('c')); // 3
console.log(cache.get('d')); // 4

// ==================== 带TTL的LRU缓存 ====================

class TTLLRUCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000;
    this.defaultTTL = options.ttl || 60000; // 默认1分钟
    this.cache = new Map();
    this.timers = new Map();
  }

  set(key, value, ttl = this.defaultTTL) {
    // 清理旧项
    if (this.cache.has(key)) {
      this.clearKey(key);
    }

    // 检查容量
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.clearKey(oldestKey);
    }

    // 添加新项
    const expiresAt = ttl ? Date.now() + ttl : null;

    this.cache.set(key, {
      value,
      expiresAt
    });

    // 设置过期定时器
    if (ttl) {
      const timer = setTimeout(() => {
        this.delete(key);
      }, ttl);
      this.timers.set(key, timer);
    }
  }

  get(key) {
    const item = this.cache.get(key);

    if (!item) return null;

    // 检查过期
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.delete(key);
      return null;
    }

    // 移动到最新
    this.cache.delete(key);
    this.cache.set(key, item);

    return item.value;
  }

  delete(key) {
    this.clearKey(key);
    return this.cache.delete(key);
  }

  clearKey(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
  }

  clear() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.cache.clear();
  }

  // 获取缓存项信息
  getInfo(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    return {
      value: item.value,
      expiresAt: item.expiresAt,
      remaining: item.expiresAt ? Math.max(0, item.expiresAt - Date.now()) : null
    };
  }

  // 批量清理过期项
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache) {
      if (item.expiresAt && item.expiresAt <= now) {
        this.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}
```

### 7.2 Redis缓存：分布式

Redis是Node.js生产环境中常用的分布式缓存方案。

```javascript
// Redis缓存实现

const { createClient } = require('redis');

// 创建Redis客户端
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => {
  console.error('Redis错误:', err);
});

redisClient.on('connect', () => {
  console.log('Redis已连接');
});

// ==================== Redis缓存包装 ====================

class RedisCache {
  constructor(options = {}) {
    this.client = options.client || redisClient;
    this.defaultTTL = options.ttl || 3600; // 默认1小时
    this.prefix = options.prefix || 'cache:';
  }

  // 生成带前缀的键
  key(key) {
    return `${this.prefix}${key}`;
  }

  // 设置缓存
  async set(key, value, ttl = this.defaultTTL) {
    const serialized = JSON.stringify(value);
    await this.client.set(this.key(key), serialized, {
      EX: ttl
    });
  }

  // 获取缓存
  async get(key) {
    const value = await this.client.get(this.key(key));
    if (!value) return null;

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  // 删除缓存
  async delete(key) {
    await this.client.del(this.key(key));
  }

  // 检查是否存在
  async has(key) {
    return (await this.client.exists(this.key(key))) === 1;
  }

  // 清空前缀下的所有缓存
  async clear() {
    const keys = await this.client.keys(`${this.prefix}*`);
    if (keys.length > 0) {
      await this.client.del(keys);
    }
    return keys.length;
  }

  // 获取或设置（缓存未命中时执行回调并缓存）
  async getOrSet(key, fetchFn, ttl = this.defaultTTL) {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    await this.set(key, value, ttl);
    return value;
  }

  // 批量获取
  async mget(keys) {
    const fullKeys = keys.map(k => this.key(k));
    const values = await this.client.mGet(fullKeys);

    return values.map(v => {
      if (!v) return null;
      try {
        return JSON.parse(v);
      } catch {
        return v;
      }
    });
  }

  // 批量设置
  async mset(items, ttl = this.defaultTTL) {
    const pipeline = this.client.multi();

    for (const [key, value] of items) {
      pipeline.set(this.key(key), JSON.stringify(value), { EX: ttl });
    }

    await pipeline.exec();
  }

  // 增加/减少（用于计数器）
  async incr(key, amount = 1) {
    const fullKey = this.key(key);
    if (amount === 1) {
      return await this.client.incr(fullKey);
    }
    return await this.client.incrBy(fullKey, amount);
  }

  async decr(key, amount = 1) {
    const fullKey = this.key(key);
    if (amount === 1) {
      return await this.client.decr(fullKey);
    }
    return await this.client.decrBy(fullKey, amount);
  }
}

// ==================== 缓存中间件 ====================

function cacheMiddleware(redisCache, options = {}) {
  const {
    ttl = 300,
    getKey = (req) => req.url,
    shouldCache = (req, res) => res.statusCode === 200
  } = options;

  return async (req, res, next) => {
    // 只缓存GET请求
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `http:${getKey(req)}`;

    try {
      // 尝试获取缓存
      const cached = await redisCache.get(cacheKey);

      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }

      // 拦截json方法
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        if (shouldCache(req, res)) {
          redisCache.set(cacheKey, data, ttl).catch(console.error);
        }
        res.setHeader('X-Cache', 'MISS');
        return originalJson(data);
      };

      next();
    } catch (err) {
      console.error('缓存中间件错误:', err);
      next();
    }
  };
}

// ==================== 缓存标签（用于批量失效） ====================

class TaggedCache {
  constructor(redisCache) {
    this.cache = redisCache;
    this.tagPrefix = 'tag:';
  }

  // 为缓存项添加标签
  async setWithTags(key, value, tags, ttl = 3600) {
    // 设置缓存
    await this.cache.set(key, value, ttl);

    // 添加到每个标签
    for (const tag of tags) {
      const tagKey = `${this.tagPrefix}${tag}`;
      const members = await this.cache.client.sMembers(tagKey);
      await this.cache.client.sAdd(tagKey, key);

      // 限制标签集合大小
      if (members.length > 1000) {
        await this.cache.client.sRem(tagKey, members.slice(0, -1000));
      }
    }
  }

  // 使某个标签下的所有缓存失效
  async invalidateByTag(tag) {
    const tagKey = `${this.tagPrefix}${tag}`;

    // 获取所有缓存键
    const keys = await this.cache.client.sMembers(tagKey);

    if (keys.length > 0) {
      // 删除所有缓存
      await this.cache.client.del(keys);
    }

    // 删除标签本身
    await this.cache.client.del(tagKey);

    return keys.length;
  }

  // 获取标签下的所有缓存键
  async getKeysByTag(tag) {
    const tagKey = `${this.tagPrefix}${tag}`;
    return await this.cache.client.sMembers(tagKey);
  }
}
```

### 7.3 缓存策略：Cache-Aside、Write-Through

```javascript
// 缓存策略实现

// ==================== Cache-Aside（旁路缓存）====================
// 应用程序同时查询缓存和数据库，缓存未命中时从数据库加载并写入缓存

class CacheAside {
  constructor(redisCache, db) {
    this.cache = redisCache;
    this.db = db;
  }

  // 读取
  async get(key) {
    // 先查缓存
    let value = await this.cache.get(key);

    if (value !== null) {
      return value;
    }

    // 缓存未命中，查数据库
    value = await this.db.query(key);

    if (value) {
      // 写入缓存
      await this.cache.set(key, value);
    }

    return value;
  }

  // 写入
  async set(key, value) {
    // 先写数据库
    await this.db.save(key, value);

    // 再写缓存
    await this.cache.set(key, value);
  }

  // 删除
  async delete(key) {
    // 先删数据库
    await this.db.delete(key);

    // 再删缓存
    await this.cache.delete(key);
  }
}

// ==================== Write-Through（写穿透）====================
// 写入时同时更新缓存和数据库，缓存和数据一致

class WriteThrough {
  constructor(redisCache, db) {
    this.cache = redisCache;
    this.db = db;
  }

  // 写入（同时写缓存和数据库）
  async set(key, value) {
    // 同时写入
    await Promise.all([
      this.cache.set(key, value),
      this.db.save(key, value)
    ]);
  }

  // 删除
  async delete(key) {
    await Promise.all([
      this.cache.delete(key),
      this.db.delete(key)
    ]);
  }
}

// ==================== Write-Behind（写回）====================
// 写入时只更新缓存，定期异步写入数据库

class WriteBehind {
  constructor(redisCache, db, options = {}) {
    this.cache = redisCache;
    this.db = db;
    this.pending = new Map(); // 待写入的数据
    this.flushInterval = options.flushInterval || 5000;
    this.flushSize = options.flushSize || 100;

    // 启动定时刷新
    this.startFlushTimer();
  }

  async set(key, value) {
    // 只更新缓存
    await this.cache.set(key, value);

    // 记录待写入
    this.pending.set(key, {
      operation: 'set',
      value,
      timestamp: Date.now()
    });

    // 检查是否需要立即刷新
    if (this.pending.size >= this.flushSize) {
      await this.flush();
    }
  }

  async flush() {
    if (this.pending.size === 0) return;

    const toFlush = new Map(this.pending);
    this.pending.clear();

    // 批量写入数据库
    await this.db.batchSave(toFlush);

    console.log(`写回完成: ${toFlush.size} 条`);
  }

  startFlushTimer() {
    setInterval(() => {
      if (this.pending.size > 0) {
        this.flush().catch(console.error);
      }
    }, this.flushInterval);
  }
}

// ==================== Read-Through（读穿透）====================
// 缓存未命中时自动从数据库加载并缓存

class ReadThrough {
  constructor(redisCache, db) {
    this.cache = redisCache;
    this.db = db;
  }

  async get(key) {
    // 缓存未命中则从数据库加载
    return await this.cache.getOrSet(
      key,
      () => this.db.load(key),
      3600
    );
  }
}
```

### 7.4 缓存问题：穿透、雪崩、击穿

```javascript
// 缓存问题及解决方案

// ==================== 缓存穿透（布隆过滤器）====================
// 查询不存在的数据，导致请求直接打到数据库

class BloomFilter {
  constructor(size = 100000, hashCount = 7) {
    this.size = size;
    this.hashCount = hashCount;
    this.bitArray = new Array(size).fill(0);
  }

  // 简单的哈希函数
  hash(str, seed = 0) {
    let hash = seed;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      hash = hash & hash; // 转为32位整数
    }
    return Math.abs(hash);
  }

  // 添加元素
  add(value) {
    for (let i = 0; i < this.hashCount; i++) {
      const index = this.hash(value, i) % this.size;
      this.bitArray[index] = 1;
    }
  }

  // 检查元素是否存在
  check(value) {
    for (let i = 0; i < this.hashCount; i++) {
      const index = this.hash(value, i) % this.size;
      if (this.bitArray[index] === 0) {
        return false; // 一定不存在
      }
    }
    return true; // 可能存在
  }
}

// 使用布隆过滤器防止缓存穿透
class CacheWithBloom {
  constructor(redisCache) {
    this.cache = redisCache;
    this.bloom = new BloomFilter();
  }

  async getOrLoad(key, loadFn) {
    // 先检查布隆过滤器
    if (!this.bloom.check(key)) {
      console.log(`布隆过滤器: ${key} 不存在，直接返回null`);
      return null;
    }

    // 缓存中查找
    const cached = await this.cache.get(key);
    if (cached !== null) {
      return cached;
    }

    // 从数据源加载
    const value = await loadFn();

    if (value) {
      await this.cache.set(key, value);
      this.bloom.add(key);
    }

    return value;
  }

  addKey(key) {
    this.bloom.add(key);
  }
}

// ==================== 缓存雪崩（过期时间随机化 + 限流）====================
// 大量缓存同时过期，导致大量请求打到数据库

class AntiAvalancheCache {
  constructor(redisCache) {
    this.cache = redisCache;
  }

  // 设置过期时间，带随机偏移
  async set(key, value, baseTTL = 3600, jitter = 300) {
    // 随机偏移：baseTTL ± jitter/2
    const ttl = baseTTL + Math.floor(Math.random() * jitter - jitter / 2);
    await this.cache.set(key, value, ttl);
  }

  // 设置永久缓存 + 版本号
  async setPermanent(key, value, version) {
    await this.cache.client.set(`permanent:${key}`, JSON.stringify({ version, value }));
  }
}

// ==================== 缓存击穿（互斥锁 + 永不过期）====================
// 热点key过期瞬间，大量请求同时击穿到数据库

class CacheBreakdown {
  constructor(redisCache) {
    this.cache = redisCache;
    this.locks = new Map();
    this.lockTTL = 10000; // 锁过期时间10秒
  }

  // 获取互斥锁
  async acquireLock(key) {
    const lockKey = `lock:${key}`;
    const result = await this.cache.client.set(lockKey, '1', {
      NX: true, // 仅在不存在时设置
      EX: this.lockTTL
    });
    return result === 'OK';
  }

  // 释放锁
  async releaseLock(key) {
    const lockKey = `lock:${key}`;
    await this.cache.client.del(lockKey);
  }

  // 永不过期的缓存 + 互斥锁方案
  async getOrLoad(key, loadFn) {
    // 1. 尝试获取缓存
    const cached = await this.cache.get(key);
    if (cached !== null) {
      return cached;
    }

    // 2. 尝试获取锁
    const locked = await this.acquireLock(key);

    if (!locked) {
      // 其他线程正在加载，等待后重试
      await new Promise(resolve => setTimeout(resolve, 100));
      return await this.getOrLoad(key, loadFn);
    }

    try {
      // 3. 获取锁成功，从数据库加载
      const value = await loadFn();

      // 4. 写入缓存（永不过期）
      await this.cache.set(key, value, 0);

      return value;
    } finally {
      // 5. 释放锁
      await this.releaseLock(key);
    }
  }

  // soft策略：返回过期数据，后台更新
  async getOrLoadSoft(key, loadFn) {
    const cached = await this.cache.get(key);

    if (cached !== null) {
      // 如果缓存快过期，异步更新
      if (cached._expiresAt && Date.now() > cached._expiresAt - 5000) {
        // 异步更新，不阻塞
        this.getOrLoad(key, loadFn).catch(console.error);
      }
      return cached;
    }

    return await this.getOrLoad(key, loadFn);
  }
}
```

### 7.5 实战：多级缓存实现

```javascript
// 多级缓存实战

const http = require('http');

// ==================== 多级缓存架构 ====================
/*
  请求流程:
  L1 (内存) → L2 (Redis) → L3 (数据库)
       ↓           ↓           ↓
    100qps      1000qps     10000qps
*/

// L1: 本地内存缓存
class L1Cache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 100;
    this.ttl = options.ttl || 1000; // 1秒
    this.cache = new Map();
    this.accessOrder = [];
  }

  get(key) {
    const item = this.cache.get(key);

    if (!item) return null;

    // 检查过期
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // 更新访问顺序
    this.updateAccess(key);

    return item.value;
  }

  set(key, value) {
    // 检查容量
    if (!this.cache.has(key) && this.cache.size >= this.maxSize) {
      // 删除最久未访问的
      const oldest = this.accessOrder.shift();
      this.cache.delete(oldest);
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttl
    });

    this.updateAccess(key);
  }

  updateAccess(key) {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  clear() {
    this.cache.clear();
    this.accessOrder = [];
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}

// L2: Redis缓存
class L2Cache {
  constructor() {
    this.client = null;
    this.prefix = 'l2:';
  }

  async get(key) {
    if (!this.client) return null;

    const value = await this.client.get(`${this.prefix}${key}`);
    if (!value) return null;

    return JSON.parse(value);
  }

  async set(key, value, ttl = 600) {
    if (!this.client) return;

    await this.client.set(`${this.prefix}${key}`, JSON.stringify(value), {
      EX: ttl
    });
  }

  async delete(key) {
    if (!this.client) return;
    await this.client.del(`${this.prefix}${key}`);
  }
}

// 多级缓存管理器
class MultiLevelCache {
  constructor(options = {}) {
    this.l1 = new L1Cache(options.l1 || {});
    this.l2 = new L2Cache(options.l2 || {});
    this.db = options.db; // 模拟数据库
    this.stats = {
      l1Hits: 0,
      l2Hits: 0,
      dbHits: 0,
      l1Misses: 0,
      l2Misses: 0
    };
  }

  async get(key) {
    // L1查询
    let value = this.l1.get(key);
    if (value !== null) {
      this.stats.l1Hits++;
      return value;
    }
    this.stats.l1Misses++;

    // L2查询
    value = await this.l2.get(key);
    if (value !== null) {
      this.stats.l2Hits++;
      // 回填L1
      this.l1.set(key, value);
      return value;
    }
    this.stats.l2Misses++;

    // 数据库查询
    if (this.db) {
      value = await this.db.query(key);
      if (value) {
        this.stats.dbHits++;
        // 回填L2和L1
        await this.l2.set(key, value);
        this.l1.set(key, value);
      }
      return value;
    }

    return null;
  }

  async set(key, value, options = {}) {
    // 更新L1
    this.l1.set(key, value);

    // 更新L2
    await this.l2.set(key, value, options.ttl || 600);
  }

  async invalidate(key) {
    this.l1.cache.delete(key);
    await this.l2.delete(key);
  }

  getStats() {
    const total = this.stats.l1Hits + this.stats.l2Hits + this.stats.dbHits;
    return {
      ...this.stats,
      total,
      l1HitRate: total > 0 ? (this.stats.l1Hits / total * 100).toFixed(2) + '%' : '0%',
      l2HitRate: total > 0 ? (this.stats.l2Hits / total * 100).toFixed(2) + '%' : '0%',
      dbRate: total > 0 ? (this.stats.dbHits / total * 100).toFixed(2) + '%' : '0%'
    };
  }

  resetStats() {
    this.stats = {
      l1Hits: 0,
      l2Hits: 0,
      dbHits: 0,
      l1Misses: 0,
      l2Misses: 0
    };
  }
}

// 模拟数据库
class MockDatabase {
  async query(key) {
    // 模拟数据库延迟
    await new Promise(resolve => setTimeout(resolve, 50));
    return { id: key, data: `data-${key}`, timestamp: Date.now() };
  }
}

// ==================== HTTP服务器测试 ====================

const db = new MockDatabase();
const multiCache = new MultiLevelCache({
  l1: { maxSize: 1000, ttl: 5000 },
  db
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (pathname === '/api/data') {
    const key = url.searchParams.get('key') || 'default';
    const start = Date.now();

    const value = await multiCache.get(key);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      key,
      value,
      latency: Date.now() - start
    }));
  } else if (pathname === '/api/set') {
    const key = url.searchParams.get('key') || 'default';
    const value = { id: key, data: `manual-${Date.now()}` };

    await multiCache.set(key, value);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, key, value }));
  } else if (pathname === '/api/stats') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      cache: multiCache.getStats(),
      l1: multiCache.l1.getStats()
    }, null, 2));
  } else if (pathname === '/api/reset') {
    multiCache.resetStats();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  } else if (pathname === '/benchmark') {
    // 基准测试
    const iterations = parseInt(url.searchParams.get('iterations') || '1000');

    multiCache.resetStats();
    const start = Date.now();

    for (let i = 0; i < iterations; i++) {
      await multiCache.get(`key-${i % 100}`); // 模拟热点数据
    }

    const duration = Date.now() - start;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      iterations,
      duration,
      qps: (iterations / duration * 1000).toFixed(2),
      stats: multiCache.getStats()
    }, null, 2));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`
多级缓存测试服务器

端点:
  GET /api/data?key=xxx     - 获取数据
  GET /api/set?key=xxx      - 设置数据
  GET /api/stats            - 查看统计
  GET /api/reset            - 重置统计
  GET /benchmark?iterations=1000 - 基准测试
            `);
  }
});

server.listen(3000, () => {
  console.log('多级缓存测试服务器运行在 http://localhost:3000');
  console.log('测试命令: curl http://localhost:3000/benchmark?iterations=1000');
});
```

---

## 八、数据库优化

### 8.1 连接池配置

```javascript
// 数据库连接池优化

// ==================== 连接池基础配置 ====================

class ConnectionPool {
  constructor(options = {}) {
    this.min = options.min || 5;           // 最小连接数
    this.max = options.max || 20;          // 最大连接数
    this.acquireTimeout = options.acquireTimeout || 30000;
    this.idleTimeout = options.idleTimeout || 30000;
    this.reapInterval = options.reapInterval || 5000;

    this.pool = [];
    this.waitQueue = [];
    this.activeCount = 0;
    this.initialized = false;
  }

  async initialize() {
    console.log(`初始化连接池，最小: ${this.min}, 最大: ${this.max}`);

    for (let i = 0; i < this.min; i++) {
      this.pool.push(await this.createConnection());
    }

    this.initialized = true;

    // 启动清理定时器
    this.startReaper();
  }

  async createConnection() {
    // 模拟创建数据库连接
    return {
      id: Date.now() + Math.random(),
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      query: async (sql) => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
        return { rows: [], affected: 1 };
      }
    };
  }

  async acquire() {
    if (!this.initialized) {
      await this.initialize();
    }

    // 有可用连接
    if (this.pool.length > 0) {
      const conn = this.pool.pop();
      this.activeCount++;
      conn.lastUsedAt = Date.now();
      return conn;
    }

    // 未达上限，创建新连接
    if (this.activeCount < this.max) {
      this.activeCount++;
      return await this.createConnection();
    }

    // 达到上限，等待
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitQueue.findIndex(w => w.resolve === resolve);
        if (index > -1) {
          this.waitQueue.splice(index, 1);
        }
        reject(new Error('获取连接超时'));
      }, this.acquireTimeout);

      this.waitQueue.push({ resolve, reject, timeout });
    });
  }

  release(conn) {
    this.activeCount--;

    // 有等待的请求
    if (this.waitQueue.length > 0) {
      const waiter = this.waitQueue.shift();
      clearTimeout(waiter.timeout);
      this.activeCount++;
      conn.lastUsedAt = Date.now();
      waiter.resolve(conn);
      return;
    }

    // 超过最小连接数，关闭连接
    if (this.pool.length >= this.min) {
      console.log(`关闭多余连接: ${conn.id}`);
      return;
    }

    // 放回池子
    this.pool.push(conn);
  }

  startReaper() {
    setInterval(() => {
      const now = Date.now();
      let closed = 0;

      while (this.pool.length > this.min) {
        const conn = this.pool[0];
        if (now - conn.lastUsedAt > this.idleTimeout) {
          this.pool.shift();
          closed++;
        } else {
          break;
        }
      }

      if (closed > 0) {
        console.log(`清理了 ${closed} 个空闲连接`);
      }
    }, this.reapInterval);
  }

  getStats() {
    return {
      total: this.pool.length + this.activeCount,
      idle: this.pool.length,
      active: this.activeCount,
      waiting: this.waitQueue.length
    };
  }
}

// ==================== 优化配置示例 ====================

// 通用连接池配置
function createOptimalPoolConfig() {
  // 根据服务器资源调整
  const cores = require('os').cpus().length;
  const memoryGB = require('os').totalmem() / 1024 / 1024 / 1024;

  return {
    // CPU核心数的2-4倍
    max: Math.min(cores * 4, 20),

    // 最小连接数
    min: Math.min(cores * 2, 5),

    // 连接获取超时
    acquireTimeout: 30000,

    // 空闲超时
    idleTimeout: 60000,

    // 重试次数
    acquireRetries: 3,

    // 重试间隔
    acquireRetryDelay: 200
  };
}
```

### 8.2 查询优化：explain

```javascript
// 查询优化实战

// ==================== 查询分析工具 ====================

class QueryAnalyzer {
  analyze(query, params = []) {
    // 简化版EXPLAIN输出
    return {
      sql: query,
      params,
      estimatedCost: this.estimateCost(query),
      suggestions: this.getSuggestions(query),
      explain: this.generateExplain(query)
    };
  }

  estimateCost(query) {
    const lowerQuery = query.toLowerCase();

    // 简单成本估算
    if (lowerQuery.includes('select')) {
      if (lowerQuery.includes('join')) return 'high';
      if (lowerQuery.includes('like')) return 'medium';
      if (lowerQuery.includes('order by')) return 'medium';
      if (lowerQuery.includes('group by')) return 'medium';
      return 'low';
    }

    if (lowerQuery.includes('insert')) return 'low';
    if (lowerQuery.includes('update')) return 'medium';
    if (lowerQuery.includes('delete')) return 'medium';

    return 'unknown';
  }

  getSuggestions(query) {
    const suggestions = [];
    const lowerQuery = query.toLowerCase();

    // 检查SELECT *
    if (lowerQuery.startsWith('select') && lowerQuery.includes('*')) {
      suggestions.push('使用具体列名替代SELECT *');
    }

    // 检查缺少索引的JOIN
    if (lowerQuery.includes('join') && !lowerQuery.includes('index')) {
      suggestions.push('确保JOIN列有索引');
    }

    // 检查LIKE开头
    if (lowerQuery.includes('like \'%')) {
      suggestions.push('LIKE以%开头无法使用索引，考虑使用全文索引');
    }

    // 检查子查询
    if (lowerQuery.includes('select') && lowerQuery.includes('from (select')) {
      suggestions.push('子查询可能较慢，考虑改写为JOIN');
    }

    // 检查缺少LIMIT
    if (lowerQuery.startsWith('select') && !lowerQuery.includes('limit')) {
      suggestions.push('添加LIMIT限制返回行数');
    }

    // 检查ORDER BY
    if (lowerQuery.includes('order by')) {
      suggestions.push('确保ORDER BY的列有索引');
    }

    return suggestions;
  }

  generateExplain(query) {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.startsWith('select')) {
      if (lowerQuery.includes('index')) {
        return '使用索引扫描';
      }
      if (lowerQuery.includes('join')) {
        return '使用嵌套循环连接';
      }
      return '全表扫描';
    }

    return '未知';
  }
}

// ==================== 慢查询记录器 ====================

class SlowQueryLogger {
  constructor(thresholdMs = 1000) {
    this.thresholdMs = thresholdMs;
    this.slowQueries = [];
    this.stats = {
      total: 0,
      slow: 0,
      avgTime: 0
    };
  }

  async execute(query, params, fn) {
    const start = Date.now();
    this.stats.total++;

    try {
      const result = await fn(query, params);
      const duration = Date.now() - start;

      // 记录慢查询
      if (duration > this.thresholdMs) {
        this.recordSlowQuery(query, params, duration);
      }

      // 更新统计
      this.stats.avgTime = (this.stats.avgTime * (this.stats.total - 1) + duration) / this.stats.total;

      return result;
    } catch (err) {
      throw err;
    }
  }

  recordSlowQuery(query, params, duration) {
    this.stats.slow++;

    this.slowQueries.push({
      query: this.sanitizeQuery(query),
      params,
      duration,
      timestamp: new Date()
    });

    // 保留最近100条慢查询
    if (this.slowQueries.length > 100) {
      this.slowQueries.shift();
    }

    console.warn(`慢查询 (${duration}ms): ${query}`);
  }

  sanitizeQuery(query) {
    // 简化日志中的敏感数据
    return query.replace(/'[^']*'/g, '?');
  }

  getStats() {
    return {
      ...this.stats,
      slowRate: this.stats.total > 0
        ? (this.stats.slow / this.stats.total * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  getSlowQueries(limit = 10) {
    return this.slowQueries.slice(-limit).reverse();
  }
}

// ==================== 实际使用示例 ====================

const analyzer = new QueryAnalyzer();
const logger = new SlowQueryLogger(100);

// 分析查询
const analysis = analyzer.analyze(`
  SELECT * FROM users
  WHERE email LIKE '%@example.com'
  ORDER BY created_at DESC
`);

console.log('查询分析:');
console.log(JSON.stringify(analysis, null, 2));

// 包装查询执行
async function executeQuery(query, params = []) {
  return logger.execute(query, params, async (sql, p) => {
    // 实际执行查询
    console.log(`执行: ${sql}`);
    return { rows: [], affected: 0 };
  });
}

// 测试慢查询
for (let i = 0; i < 5; i++) {
  await executeQuery('SELECT * FROM orders WHERE id = ?', [i]);
}

console.log('统计:', logger.getStats());
```

### 8.3 N+1问题解决

```javascript
// N+1查询问题及解决方案

// ==================== N+1问题演示 ====================

// N+1问题：查询1个主对象 + N个关联对象
// 场景：获取10个用户及其订单

class N1ProblemDemo {
  // 不良做法：N+1查询
  async getUsersWithOrdersBad(userIds) {
    const users = await this.getUsers(userIds); // 1次查询

    // N次查询
    for (const user of users) {
      user.orders = await this.getOrdersByUserId(user.id);
    }

    return users;
  }

  // 良好做法：批量查询
  async getUsersWithOrdersGood(userIds) {
    const users = await this.getUsers(userIds); // 1次查询
    const orders = await this.getOrdersByUserIds(userIds); // 1次查询

    // 内存中关联
    const ordersByUserId = new Map();
    for (const order of orders) {
      if (!ordersByUserId.has(order.userId)) {
        ordersByUserId.set(order.userId, []);
      }
      ordersByUserId.get(order.userId).push(order);
    }

    for (const user of users) {
      user.orders = ordersByUserId.get(user.id) || [];
    }

    return users;
  }

  // 最佳做法：JOIN查询
  async getUsersWithOrdersBest(userIds) {
    const results = await this.executeQuery(`
      SELECT u.*, o.id as order_id, o.total as order_total
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.id IN (?)
    `, [userIds]);

    // 内存中聚合
    const userMap = new Map();
    for (const row of results) {
      if (!userMap.has(row.id)) {
        userMap.set(row.id, {
          ...row,
          orders: []
        });
      }
      if (row.order_id) {
        userMap.get(row.id).orders.push({
          id: row.order_id,
          total: row.order_total
        });
      }
    }

    return Array.from(userMap.values());
  }
}

// ==================== DataLoader模式（解决N+1）====================

class DataLoader {
  constructor(batchLoadFn) {
    this.batchLoadFn = batchLoadFn;
    this.cache = new Map();
    this.queue = [];
    this.dispatching = false;
  }

  load(key) {
    // 缓存命中
    if (this.cache.has(key)) {
      return Promise.resolve(this.cache.get(key));
    }

    // 加入批处理队列
    return new Promise((resolve, reject) => {
      this.queue.push({ key, resolve, reject });
      this.scheduleDispatch();
    });
  }

  scheduleDispatch() {
    if (this.dispatching) return;

    this.dispatching = true;
    process.nextTick(() => this.dispatch());
  }

  async dispatch() {
    if (this.queue.length === 0) {
      this.dispatching = false;
      return;
    }

    const batch = this.queue.splice(0);

    try {
      const keys = batch.map(item => item.key);
      const results = await this.batchLoadFn(keys);

      for (let i = 0; i < batch.length; i++) {
        const result = results[i];
        this.cache.set(batch[i].key, result);
        batch[i].resolve(result);
      }
    } catch (err) {
      for (const item of batch) {
        item.reject(err);
      }
    }

    this.dispatching = false;

    // 继续处理剩余队列
    if (this.queue.length > 0) {
      this.scheduleDispatch();
    }
  }

  clearCache() {
    this.cache.clear();
  }
}

// 使用DataLoader解决N+1
class UserDataLoader {
  constructor() {
    this.userLoader = new DataLoader(async (ids) => {
      // 批量加载用户
      console.log(`批量加载用户: ${ids.join(', ')}`);
      return ids.map(id => ({ id, name: `User ${id}` }));
    });

    this.orderLoader = new DataLoader(async (userIds) => {
      // 批量加载订单
      console.log(`批量加载订单 for users: ${userIds.join(', ')}`);
      return userIds.map(userId => ({
        userId,
        orders: Array.from({ length: 3 }, (_, i) => ({
          id: `${userId}-order-${i}`,
          total: Math.random() * 100
        }))
      }));
    });
  }

  async getUser(id) {
    return this.userLoader.load(id);
  }

  async getOrdersByUserId(userId) {
    return this.orderLoader.load(userId);
  }

  async getUserWithOrders(id) {
    const [user, orderData] = await Promise.all([
      this.getUser(id),
      this.getOrdersByUserId(id)
    ]);

    return {
      ...user,
      orders: orderData.orders
    };
  }
}

// 测试
async function testDataLoader() {
  const loader = new UserDataLoader();

  // 模拟多个请求同时查询同一用户
  console.log('\n=== 测试DataLoader ===');
  const start = Date.now();

  const [user1, user2, user3] = await Promise.all([
    loader.getUserWithOrders(1),
    loader.getUserWithOrders(1),
    loader.getUserWithOrders(1)
  ]);

  console.log(`\n3个请求查询同一用户耗时: ${Date.now() - start}ms`);
  console.log('应该只有1次批量加载用户，1次批量加载订单');

  // 模拟查询多个不同用户
  console.log('\n=== 测试多个不同用户 ===');
  const start2 = Date.now();

  const users = await Promise.all([
    loader.getUserWithOrders(1),
    loader.getUserWithOrders(2),
    loader.getUserWithOrders(3)
  ]);

  console.log(`\n3个请求查询不同用户耗时: ${Date.now() - start2}ms`);
  console.log('应该只有1次批量加载用户，1次批量加载订单');
}

testDataLoader().catch(console.error);
```

### 8.4 批量操作

```javascript
// 批量操作优化

// ==================== 批量插入 ====================

class BatchInserter {
  constructor(pool, options = {}) {
    this.pool = pool;
    this.batchSize = options.batchSize || 1000;
    this.buffer = [];
    this.flushInterval = options.flushInterval || 5000;
    this.timer = null;
  }

  async add(table, row) {
    this.buffer.push({ table, row });

    if (this.buffer.length >= this.batchSize) {
      await this.flush();
    }

    // 启动定时刷新
    if (!this.timer) {
      this.timer = setInterval(() => this.flush(), this.flushInterval);
    }
  }

  async flush() {
    if (this.buffer.length === 0) return;

    const batch = this.buffer.splice(0);

    // 按表分组
    const byTable = new Map();
    for (const { table, row } of batch) {
      if (!byTable.has(table)) {
        byTable.set(table, []);
      }
      byTable.get(table).push(row);
    }

    // 批量插入每个表
    for (const [table, rows] of byTable) {
      await this.batchInsert(table, rows);
    }

    console.log(`批量插入完成: ${batch.length} 条`);
  }

  async batchInsert(table, rows) {
    if (rows.length === 0) return;

    // 生成批量INSERT语句
    const columns = Object.keys(rows[0]);
    const placeholders = rows.map(() =>
      `(${columns.map(() => '?').join(', ')})`
    ).join(', ');

    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders}`;
    const values = rows.flatMap(row => columns.map(col => row[col]));

    // 执行
    console.log(`执行: INSERT INTO ${table} (${rows.length} rows)`);
    return { affected: rows.length };
  }

  async close() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    await this.flush();
  }
}

// ==================== 批量更新 ====================

class BatchUpdater {
  constructor(pool) {
    this.pool = pool;
    this.buffer = new Map(); // table -> { id -> updates }
    this.flushInterval = 1000;
    this.timer = null;
  }

  update(table, id, updates) {
    if (!this.buffer.has(table)) {
      this.buffer.set(table, new Map());
    }

    const tableBuffer = this.buffer.get(table);

    if (!tableBuffer.has(id)) {
      tableBuffer.set(id, {});
    }

    // 合并更新
    Object.assign(tableBuffer.get(id), updates);

    // 启动定时刷新
    if (!this.timer) {
      this.timer = setInterval(() => this.flush(), this.flushInterval);
    }
  }

  async flush() {
    if (this.buffer.size === 0) return;

    const toFlush = new Map(this.buffer);
    this.buffer.clear();

    for (const [table, idUpdates] of toFlush) {
      await this.executeBatchUpdate(table, idUpdates);
    }
  }

  async executeBatchUpdate(table, idUpdates) {
    // 生成批量UPDATE语句
    const ids = Array.from(idUpdates.keys());
    const allColumns = new Set();

    for (const updates of idUpdates.values()) {
      Object.keys(updates).forEach(col => allColumns.add(col));
    }

    const columns = Array.from(allColumns);

    // 使用CASE WHEN进行批量更新
    const sets = columns.map(col =>
      `${col} = CASE id ${ids.map(id => `WHEN ? THEN ?`).join(' ')} END`
    );

    const sql = `UPDATE ${table} SET ${sets.join(', ')} WHERE id IN (?)`;

    const values = [];
    for (const id of ids) {
      const updates = idUpdates.get(id);
      for (const col of columns) {
        values.push(id, updates[col] !== undefined ? updates[col] : updates[col]);
      }
    }
    values.push(ids);

    console.log(`执行: UPDATE ${table} (${ids.length} rows)`);
    return { affected: ids.length };
  }

  async close() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    await this.flush();
  }
}

// ==================== upsert操作 ====================

class UpsertOperation {
  constructor(pool) {
    this.pool = pool;
  }

  // 批量upsert（使用ON CONFLICT）
  async batchUpsert(table, rows, uniqueKey = 'id') {
    if (rows.length === 0) return { inserted: 0, updated: 0 };

    const columns = Object.keys(rows[0]);
    const placeholders = rows.map(row =>
      `(${columns.map(col => row[col]).join(', ')})`
    ).join(', ');

    const updateColumns = columns.filter(col => col !== uniqueKey);
    const updates = updateColumns.map(col => `${col} = EXCLUDED.${col}`).join(', ');

    const sql = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES ${placeholders}
      ON CONFLICT (${uniqueKey})
      DO UPDATE SET ${updates}
    `;

    console.log(`执行: UPSERT ${table} (${rows.length} rows)`);
    return { inserted: rows.length, updated: 0 };
  }

  // 增量upsert（只更新变化的字段）
  async incrementalUpsert(table, rows, uniqueKey = 'id') {
    const changes = [];

    for (const row of rows) {
      const id = row[uniqueKey];
      changes.push(row); // 简化：实际应先查询对比
    }

    return this.batchUpsert(table, changes, uniqueKey);
  }
}
```

### 8.5 实战：查询性能优化

```javascript
// 查询性能优化实战

const http = require('http');

// ==================== 查询优化中间件 ====================

class QueryOptimizer {
  constructor(options = {}) {
    this.explainThreshold = options.explainThreshold || 100;
    this.slowQueryThreshold = options.slowQueryThreshold || 1000;
    this.logger = options.logger || console;
  }

  // 分析查询
  analyze(sql) {
    const analysis = {
      warnings: [],
      suggestions: [],
      complexity: 'simple'
    };

    const lowerSql = sql.toLowerCase();

    // 检测复杂查询
    if (lowerSql.includes('join')) {
      analysis.complexity = 'complex';
      analysis.suggestions.push('确保JOIN的列都有索引');
    }

    if (lowerSql.includes('subquery') || (lowerSql.match(/\(select/gi) || []).length > 0) {
      analysis.complexity = 'complex';
      analysis.suggestions.push('子查询可能导致性能问题，考虑改写为JOIN');
    }

    if (lowerSql.includes('like \'%')) {
      analysis.warnings.push('LIKE以%开头无法使用索引');
    }

    if (!lowerSql.includes('limit') && lowerSql.startsWith('select')) {
      analysis.suggestions.push('添加LIMIT限制返回行数');
    }

    if (lowerSql.includes('order by') && !lowerSql.includes('index')) {
      analysis.suggestions.push('ORDER BY的列应该有索引');
    }

    // 检查SELECT *
    if (lowerSql.includes('select *')) {
      analysis.suggestions.push('使用具体列名替代SELECT *');
    }

    return analysis;
  }

  // 优化查询
  optimize(sql, params = []) {
    let optimized = sql;

    // 移除不必要的括号
    optimized = optimized.replace(/\(\s*SELECT/gi, 'SELECT');

    // 添加索引提示（简化版）
    // 实际应该根据分析添加

    return { optimized, params };
  }
}

// ==================== 数据库连接池包装 ====================

class OptimizedDB {
  constructor(options = {}) {
    this.pool = new ConnectionPool({
      min: options.minConnections || 5,
      max: options.maxConnections || 20
    });
    this.optimizer = new QueryOptimizer();
    this.stats = {
      queries: 0,
      slowQueries: 0,
      totalTime: 0
    };
  }

  async initialize() {
    await this.pool.initialize();
  }

  async query(sql, params = []) {
    const start = Date.now();
    this.stats.queries++;

    // 查询分析
    const analysis = this.optimizer.analyze(sql);
    if (analysis.warnings.length > 0) {
      console.warn('查询警告:', analysis.warnings);
    }

    // 获取连接
    const conn = await this.pool.acquire();

    try {
      // 模拟查询执行
      const result = await conn.query(sql);

      const duration = Date.now() - start;
      this.stats.totalTime += duration;

      if (duration > this.optimizer.slowQueryThreshold) {
        this.stats.slowQueries++;
        console.warn(`慢查询 (${duration}ms): ${sql.slice(0, 100)}...`);
      }

      return result;
    } finally {
      this.pool.release(conn);
    }
  }

  getStats() {
    return {
      ...this.stats,
      avgTime: this.stats.queries > 0
        ? (this.stats.totalTime / this.stats.queries).toFixed(2)
        : 0,
      slowQueryRate: this.stats.queries > 0
        ? (this.stats.slowQueries / this.stats.queries * 100).toFixed(2) + '%'
        : '0%'
    };
  }
}

// ==================== 索引建议器 ====================

class IndexAdvisor {
  constructor() {
    this.tableStats = new Map();
  }

  // 分析查询并给出索引建议
  analyzeQuery(sql) {
    const suggestions = [];
    const lowerSql = sql.toLowerCase();

    // 提取表名
    const tableMatch = lowerSql.match(/from\s+(\w+)/);
    if (!tableMatch) return suggestions;

    const table = tableMatch[1];

    // WHERE条件列
    const whereColumns = [];
    const whereMatch = lowerSql.match(/where\s+(.+?)(?:order|group|limit|$)/i);
    if (whereMatch) {
      const whereClause = whereMatch[1];
      const columnMatches = whereClause.match(/(\w+)\s*[=<>]/g);
      if (columnMatches) {
        whereColumns.push(...columnMatches.map(m => m.replace(/[<>=]/g, '')));
      }
    }

    // JOIN列
    const joinColumns = [];
    const joinMatches = lowerSql.match(/join\s+\w+\s+on\s+\w+\.(\w+)\s*=\s*\w+\.(\w+)/gi);
    if (joinMatches) {
      for (const match of joinMatches) {
        const parts = match.split('=');
        parts.forEach(part => {
          const colMatch = part.match(/\.(\w+)/);
          if (colMatch) {
            joinColumns.push(colMatch[1]);
          }
        });
      }
    }

    // ORDER BY列
    const orderColumns = [];
    const orderMatch = lowerSql.match(/order\s+by\s+(.+?)(?:limit|$)/i);
    if (orderMatch) {
      const orderCols = orderMatch[1].split(',');
      orderColumns.push(...orderCols.map(c => c.trim().split(' ')[0].replace(/\./g, '')));
    }

    // 生成索引建议
    const allColumns = [...new Set([...whereColumns, ...joinColumns, ...orderColumns])];

    for (const col of allColumns) {
      suggestions.push({
        table,
        column: col,
        type: this.getIndexType(whereColumns, joinColumns, orderColumns, col),
        sql: `CREATE INDEX idx_${table}_${col} ON ${table}(${col})`
      });
    }

    return suggestions;
  }

  getIndexType(whereColumns, joinColumns, orderColumns, column) {
    if (joinColumns.includes(column)) return 'JOIN';
    if (whereColumns.includes(column)) return 'WHERE';
    if (orderColumns.includes(column)) return 'ORDER';
    return 'AUTO';
  }
}

// ==================== HTTP API ====================

const db = new OptimizedDB();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (pathname === '/query') {
    const sql = url.searchParams.get('sql') || 'SELECT * FROM users LIMIT 10';

    const start = Date.now();
    try {
      const result = await db.query(sql);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        result,
        time: Date.now() - start
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: err.message
      }));
    }
  } else if (pathname === '/analyze') {
    const sql = url.searchParams.get('sql') || '';
    const advisor = new IndexAdvisor();
    const suggestions = advisor.analyzeQuery(sql);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      sql,
      analysis: new QueryOptimizer().analyze(sql),
      indexSuggestions: suggestions
    }, null, 2));
  } else if (pathname === '/stats') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      db: db.getStats(),
      pool: db.pool.getStats()
    }, null, 2));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`
查询性能优化API

端点:
  GET /query?sql=xxx  - 执行查询
  GET /analyze?sql=xxx - 分析查询并给出索引建议
  GET /stats          - 查看统计信息
            `);
  }
});

server.listen(3000, async () => {
  console.log('查询优化服务器运行在 http://localhost:3000');
  await db.initialize();
});
```

---

## 九、网络优化

### 9.1 HTTP Keep-Alive

HTTP Keep-Alive允许TCP连接复用，减少连接建立的开销。

```javascript
// Keep-Alive优化实战

const http = require('http');
const https = require('https');

// ==================== HTTP Agent配置 ====================

// 全局Agent配置
http.globalAgent.keepAlive = true;
http.globalAgent.keepAliveMsecs = 30000;      // Keep-Alive超时
http.globalAgent.maxSockets = 100;            // 最大socket数
http.globalAgent.maxFreeSockets = 10;         // 最大空闲socket数
http.globalAgent.timeout = 60000;             // socket超时

// 自定义Agent
const keepAliveAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000,
  scheduling: 'fifo' // 先进先出
});

// ==================== 带有Keep-Alive的HTTP客户端 ====================

class KeepAliveClient {
  constructor(options = {}) {
    this.baseURL = options.baseURL;
    this.agent = new http.Agent({
      keepAlive: true,
      keepAliveMsecs: options.keepAliveMsecs || 30000,
      maxSockets: options.maxSockets || 10,
      maxFreeSockets: options.maxFreeSockets || 5
    });
    this.defaultHeaders = options.headers || {};
    this.requestCount = 0;
    this.connectionCount = 0;
  }

  async request(path, options = {}) {
    const url = new URL(path, this.baseURL);
    const isHTTPS = url.protocol === 'https:';
    const agent = isHTTPS
      ? new https.Agent({ keepAlive: true })
      : this.agent;

    this.requestCount++;

    return new Promise((resolve, reject) => {
      const reqOptions = {
        hostname: url.hostname,
        port: url.port || (isHTTPS ? 443 : 80),
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: {
          ...this.defaultHeaders,
          ...options.headers,
          'Connection': 'keep-alive'
        },
        agent
      };

      const protocol = isHTTPS ? https : http;

      const req = protocol.request(reqOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data
          });
        });
      });

      req.on('error', reject);
      req.on('close', () => {
        console.log(`连接关闭: ${url.host}`);
      });

      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });
  }

  getStats() {
    return {
      requestCount: this.requestCount,
      agent: this.agent.getCurrentStatus ? this.agent.getCurrentStatus() : 'N/A'
    };
  }

  close() {
    this.agent.destroy();
  }
}

// ==================== Keep-Alive服务器配置 ====================

const server = http.createServer({
  keepAliveTimeout: 65000,      // 客户端连接Keep-Alive超时
  headersTimeout: 66000,         // 头部解析超时
  maxHeadersCount: 200           // 最大头部数量
}, (req, res) => {
  // 设置Keep-Alive头
  res.setHeader('Keep-Alive', 'timeout=60, max=100');

  // 处理请求
  res.json({
    message: 'Hello with Keep-Alive',
    headers: req.headers
  });
});

// ==================== 连接池客户端 ====================

class ConnectionPoolClient {
  constructor(options = {}) {
    this.maxConnections = options.maxConnections || 10;
    this.baseURL = options.baseURL;
    this.pool = [];
    this.waiting = [];
    this.stats = { acquired: 0, released: 0, created: 0 };
  }

  async acquire() {
    if (this.pool.length > 0) {
      const conn = this.pool.pop();
      this.stats.acquired++;
      return conn;
    }

    const conn = await this.createConnection();
    this.stats.created++;
    this.stats.acquired++;
    return conn;
  }

  release(conn) {
    if (this.pool.length < this.maxConnections) {
      this.pool.push(conn);
      this.stats.released++;
    }

    // 如果有等待的请求，唤醒一个
    if (this.waiting.length > 0) {
      const waiter = this.waiting.shift();
      waiter(this.acquire());
    }
  }

  async createConnection() {
    const url = new URL(this.baseURL);
    return {
      hostname: url.hostname,
      port: url.port,
      path: '/',
      connectedAt: Date.now()
    };
  }

  async get(path) {
    const conn = await this.acquire();
    try {
      // 使用连接
      return { success: true, conn };
    } finally {
      this.release(conn);
    }
  }

  getStats() {
    return {
      ...this.stats,
      poolSize: this.pool.length,
      waiting: this.waiting.length
    };
  }
}
```

### 9.2 连接复用

```javascript
// 连接复用优化

const http = require('http');
const https = require('https');

// ==================== HTTP/1.1 连接池 ====================

class HTTPConnectionPool {
  constructor(options = {}) {
    this.maxSocketsPerHost = options.maxSocketsPerHost || 10;
    this.maxSockets = options.maxSockets || 100;
    this.keepAlive = options.keepAlive !== false;
    this.agent = new http.Agent({
      keepAlive: this.keepAlive,
      maxSocketsPerHost: this.maxSocketsPerHost,
      maxSockets: this.maxSockets
    });
  }

  async request(url, options = {}) {
    return new Promise((resolve, reject) => {
      const reqOptions = {
        ...options,
        agent: this.agent,
        headers: {
          'Connection': 'keep-alive',
          ...options.headers
        }
      };

      const protocol = url.startsWith('https') ? https : http;

      const req = protocol.get(url, reqOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, data }));
      });

      req.on('error', reject);
      req.end();
    });
  }

  close() {
    this.agent.destroy();
  }
}

// ==================== 并发连接限制器 ====================

class ConcurrencyLimiter {
  constructor(maxConcurrent = 10) {
    this.maxConcurrent = maxConcurrent;
    this.running = 0;
    this.queue = [];
  }

  async run(fn) {
    if (this.running >= this.maxConcurrent) {
      return new Promise((resolve, reject) => {
        this.queue.push({ fn, resolve, reject });
      });
    }

    this.running++;
    try {
      const result = await fn();
      return result;
    } finally {
      this.running--;
      this.processQueue();
    }
  }

  processQueue() {
    while (this.running < this.maxConcurrent && this.queue.length > 0) {
      const { fn, resolve } = this.queue.shift();
      this.run(fn).then(resolve);
    }
  }
}

// ==================== HTTP/2连接复用 ====================

const http2 = require('http2');

// HTTP/2连接可以并行发送多个请求
class HTTP2Client {
  constructor(url) {
    this.url = new URL(url);
    this.client = null;
    this.connecting = null;
  }

  async connect() {
    if (this.client) return;

    if (!this.connecting) {
      this.connecting = (async () => {
        this.client = http2.connect(`${this.url.host}`, {
          keepAlive: true
        });

        this.client.on('error', (err) => {
          console.error('HTTP/2错误:', err);
          this.client = null;
        });

        await new Promise(resolve => {
          this.client.on('connect', resolve);
        });
      })();
    }

    await this.connecting;
  }

  async request(path, options = {}) {
    await this.connect();

    return new Promise((resolve, reject) => {
      const headers = {
        ...options.headers,
        ':path': path,
        ':method': options.method || 'GET'
      };

      const req = this.client.request(headers);

      let data = '';
      req.on('data', chunk => data += chunk);
      req.on('end', () => {
        resolve({
          status: req.headers[':status'],
          data
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  close() {
    if (this.client) {
      this.client.close();
      this.client = null;
    }
  }
}

// 使用示例
async function testHTTP2Client() {
  const client = new HTTP2Client('https://httpbin.org');

  // HTTP/2可以并行发送多个请求，复用同一个连接
  const results = await Promise.all([
    client.request('/get'),
    client.request('/headers'),
    client.request('/ip')
  ]);

  console.log('并行请求完成:', results.length);
  client.close();
}
```

### 9.3 压缩：gzip、brotli

```javascript
// 压缩优化实战

const zlib = require('zlib');
const { pipeline } = require('stream/promises');

// ==================== gzip压缩 ====================

class GzipCompression {
  static compress(data) {
    return new Promise((resolve, reject) => {
      const gzip = zlib.createGzip({ level: 6 });
      const chunks = [];

      gzip.on('data', chunk => chunks.push(chunk));
      gzip.on('end', () => resolve(Buffer.concat(chunks)));
      gzip.on('error', reject);

      gzip.end(data);
    });
  }

  static decompress(data) {
    return new Promise((resolve, reject) => {
      const gunzip = zlib.createGunzip();
      const chunks = [];

      gunzip.on('data', chunk => chunks.push(chunk));
      gunzip.on('end', () => resolve(Buffer.concat(chunks)));
      gunzip.on('error', reject);

      gunzip.end(data);
    });
  }
}

// ==================== brotli压缩（Node.js 11.7+）====================

class BrotliCompression {
  static compress(data) {
    return new Promise((resolve, reject) => {
      const brotli = zlib.createBrotliCompress({
        quality: 6,
        chunkSize: 16 * 1024
      });
      const chunks = [];

      brotli.on('data', chunk => chunks.push(chunk));
      brotli.on('end', () => resolve(Buffer.concat(chunks)));
      brotli.on('error', reject);

      brotli.end(data);
    });
  }

  static decompress(data) {
    return new Promise((resolve, reject) => {
      const brotli = zlib.createBrotliDecompress();
      const chunks = [];

      brotli.on('data', chunk => chunks.push(chunk));
      brotli.on('end', () => resolve(Buffer.concat(chunks)));
      brotli.on('error', reject);

      brotli.end(data);
    });
  }
}

// ==================== 压缩中间件 ====================

class CompressionMiddleware {
  constructor(options = {}) {
    this.threshold = options.threshold || 1024; // 小于1KB不压缩
    this.level = options.level || 6;
    this.supported = ['gzip', 'br', 'deflate'];
  }

  compress(acceptEncoding, data) {
    const encodings = acceptEncoding.split(',').map(e => e.trim().split(';')[0]);

    for (const encoding of encodings) {
      if (encoding === 'gzip') {
        return { type: 'gzip', data: GzipCompression.compress(data) };
      }
      if (encoding === 'br' && BrotliCompression.compress) {
        return { type: 'br', data: BrotliCompression.compress(data) };
      }
      if (encoding === 'deflate') {
        return { type: 'deflate', data: this.deflate(data) };
      }
    }

    return { type: null, data };
  }

  deflate(data) {
    return new Promise((resolve, reject) => {
      zlib.deflate(data, { level: this.level }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  middleware() {
    return (req, res, next) => {
      const acceptEncoding = req.headers['accept-encoding'] || '';

      // 拦截json方法
      const originalJson = res.json.bind(res);
      res.json = async (data) => {
        const jsonString = JSON.stringify(data);

        // 小于阈值不压缩
        if (jsonString.length < this.threshold) {
          res.setHeader('X-Compression', 'skipped');
          return originalJson(data);
        }

        const { type, data: compressed } = await this.compress(acceptEncoding, jsonString);

        if (type) {
          res.setHeader('Content-Encoding', type);
          res.setHeader('X-Compression', type);
          res.setHeader('Content-Type', 'application/json');
          res.end(compressed);
        } else {
          originalJson(data);
        }
      };

      next();
    };
  }
}

// ==================== 动态压缩流 ====================

const { Transform } = require('stream');

class CompressStream extends Transform {
  constructor(encoding, options = {}) {
    super();
    this.encoding = encoding;
    this.chunks = [];

    if (encoding === 'gzip') {
      this.compressor = zlib.createGzip(options);
    } else if (encoding === 'br') {
      this.compressor = zlib.createBrotliCompress(options);
    } else {
      this.compressor = zlib.createDeflate(options);
    }

    this.compressor.on('data', chunk => this.push(chunk));
    this.compressor.on('end', () => super.end());
  }

  _transform(chunk, encoding, callback) {
    this.compressor.write(chunk, encoding, callback);
  }

  _final(callback) {
    this.compressor.end();
    callback();
  }
}
```

### 9.4 HTTP/2特性

```javascript
// HTTP/2优化实战

const http2 = require('http2');
const fs = require('fs');
const path = require('path');

// ==================== HTTP/2服务器 ====================

const server = http2.createSecureServer({
  key: fs.readFileSync(path.join(__dirname, 'server.key')),
  cert: fs.readFileSync(path.join(__dirname, 'server.crt'))
});

server.on('stream', (stream, headers) => {
  const path = headers[':path'];

  if (path === '/api/data') {
    // HTTP/2支持流式响应
    stream.respond({
      'content-type': 'application/json',
      ':status': 200
    });

    // 分块发送
    for (let i = 0; i < 10; i++) {
      stream.write(JSON.stringify({
        index: i,
        timestamp: Date.now()
      }) + '\n');
    }

    stream.end();
  } else if (path === '/push') {
    // 服务器推送
    stream.respondWithFile('/index.html', {
      'content-type': 'text/html'
    });

    // 推送关联资源
    stream.pushStream({ ':path': '/style.css' }, (err, pushStream) => {
      pushStream.respond({
        'content-type': 'text/css'
      });
      pushStream.end('body { font-family: sans-serif; }');
    });

    stream.pushStream({ ':path': '/app.js' }, (err, pushStream) => {
      pushStream.respond({
        'content-type': 'application/javascript'
      });
      pushStream.end('console.log("Hello from pushed resource");');
    });
  } else {
    stream.respond({
      'content-type': 'text/plain',
      ':status': 404
    });
    stream.end('Not Found');
  }
});

server.listen(8443, () => {
  console.log('HTTP/2服务器运行在 https://localhost:8443');
});

// ==================== HTTP/2客户端（多路复用）====================

class HTTP2SessionPool {
  constructor(url) {
    this.url = new URL(url);
    this.session = null;
    this.connecting = null;
  }

  async connect() {
    if (this.session) return this.session;

    if (!this.connecting) {
      this.connecting = new Promise((resolve, reject) => {
        const client = http2.connect(`${this.url.host}`, {
          // 连接池配置
          maxSessionMemory: 1000,
          maxDeflateDynamicTableSize: 4096
        });

        client.on('connect', () => {
          console.log('HTTP/2连接已建立');
          resolve(client);
        });

        client.on('error', (err) => {
          console.error('HTTP/2错误:', err);
          reject(err);
        });

        client.on('close', () => {
          console.log('HTTP/2连接已关闭');
          this.session = null;
        });
      });
    }

    this.session = await this.connecting;
    return this.session;
  }

  async request(path, options = {}) {
    const session = await this.connect();

    return new Promise((resolve, reject) => {
      const headers = {
        ...options.headers,
        ':path': path,
        ':method': options.method || 'GET'
      };

      const req = session.request(headers);

      let data = '';
      req.on('data', chunk => data += chunk);
      req.on('end', () => {
        resolve({
          status: req.headers[':status'],
          headers: req.headers,
          data
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  // 并行请求（利用HTTP/2多路复用）
  async parallelRequests(paths) {
    const session = await this.connect();

    return Promise.all(
      paths.map(path => this.request(path))
    );
  }

  close() {
    if (this.session) {
      this.session.close();
      this.session = null;
    }
  }
}

// ==================== 流量控制 ====================

class HTTP2FlowControl {
  constructor(session) {
    this.session = session;
    this.bytesToSend = 0;
    this.windowUpdateInterval = 1024 * 1024; // 1MB
  }

  // 设置流控
  setStreamWindow(stream, windowSize) {
    stream.setWindowSize(windowSize);
    console.log(`设置流窗口: ${windowSize}`);
  }

  // 处理流控
  handleFlowControl(stream) {
    stream.on('frame', (frame) => {
      if (frame.type === http2.constants.HTTP2_FRAME_TYPE.WINDOW_UPDATE) {
        console.log('收到WINDOW_UPDATE');
      }
    });
  }
}
```

### 9.5 实战：API响应优化

```javascript
// API响应优化实战

const http = require('http');
const { pipeline } = require('stream/promises');

// ==================== 响应缓存 ====================

class ResponseCache {
  constructor(options = {}) {
    this.ttl = options.ttl || 60000;
    this.cache = new Map();
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set(key, data, ttl = this.ttl) {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl
    });
  }

  clear() {
    this.cache.clear();
  }
}

// ==================== 条件请求处理 ====================

class ConditionalRequest {
  static getETag(data) {
    const hash = require('crypto')
      .createHash('md5')
      .update(JSON.stringify(data))
      .digest('hex');
    return `"${hash}"`;
  }

  static handle(req, res, data) {
    const etag = ConditionalRequest.getETag(data);

    // 设置ETag
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'private, max-age=0');

    // 检查If-None-Match
    const ifNoneMatch = req.headers['if-none-match'];
    if (ifNoneMatch === etag) {
      res.writeHead(304);
      res.end();
      return null;
    }

    // 检查If-Modified-Since
    const ifModifiedSince = req.headers['if-modified-since'];
    if (ifModifiedSince) {
      const sinceDate = new Date(ifModifiedSince);
      const dataTime = new Date(data.timestamp || Date.now());
      if (dataTime <= sinceDate) {
        res.writeHead(304);
        res.end();
        return null;
      }
    }

    return data;
  }
}

// ==================== 分页优化 ====================

class Pagination {
  static parse(url) {
    const params = new URL(url, 'http://localhost').searchParams;
    return {
      page: parseInt(params.get('page') || '1'),
      pageSize: Math.min(parseInt(params.get('pageSize') || '20'), 100),
      offset: (parseInt(params.get('page') || '1') - 1) * parseInt(params.get('pageSize') || '20')
    };
  }

  static response(page, pageSize, total, data) {
    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page * pageSize < total,
        hasPrev: page > 1
      }
    };
  }
}

// ==================== 压缩响应 ====================

const zlib = require('zlib');

class CompressedResponse {
  static async handle(req, res, data) {
    const acceptEncoding = req.headers['accept-encoding'] || '';

    // 判断是否压缩
    if (!acceptEncoding.includes('gzip') && !acceptEncoding.includes('br')) {
      return { encoded: false, data };
    }

    const jsonString = JSON.stringify(data);

    // 小于1KB不压缩
    if (jsonString.length < 1024) {
      return { encoded: false, data };
    }

    if (acceptEncoding.includes('br')) {
      // Brotli压缩
      const compressed = await pipeline(
        require('stream').Readable.from(jsonString),
        zlib.createBrotliCompress({ level: 6 }),
        require('stream').PassThrough
      );

      let result = Buffer.alloc(0);
      for await (const chunk of compressed) {
        result = Buffer.concat([result, chunk]);
      }

      res.setHeader('Content-Encoding', 'br');
      return { encoded: true, data: result };
    } else {
      // Gzip压缩
      const compressed = await pipeline(
        require('stream').Readable.from(jsonString),
        zlib.createGzip({ level: 6 }),
        require('stream').PassThrough
      );

      let result = Buffer.alloc(0);
      for await (const chunk of compressed) {
        result = Buffer.concat([result, chunk]);
      }

      res.setHeader('Content-Encoding', 'gzip');
      return { encoded: true, data: result };
    }
  }
}

// ==================== API服务器 ====================

const cache = new ResponseCache();
const compression = new CompressionMiddleware({ threshold: 512 });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (pathname === '/api/users') {
    const { page, pageSize, offset } = Pagination.parse(req.url);

    // 生成缓存key
    const cacheKey = `users:${page}:${pageSize}`;

    // 检查缓存
    let data = cache.get(cacheKey);
    if (data) {
      res.setHeader('X-Cache', 'HIT');
      data = ConditionalRequest.handle(req, res, data.data);
      if (data === null) return;
    } else {
      res.setHeader('X-Cache', 'MISS');

      // 模拟数据库查询
      const total = 1000;
      data = {
        timestamp: Date.now(),
        users: Array.from({ length: pageSize }, (_, i) => ({
          id: offset + i + 1,
          name: `User ${offset + i + 1}`,
          email: `user${offset + i + 1}@example.com`
        }))
      };

      // 缓存
      cache.set(cacheKey, data);
      data = ConditionalRequest.handle(req, res, data);
      if (data === null) return;
    }

    // 分页包装
    const response = Pagination.response(page, pageSize, 1000, data.users);

    // 压缩处理
    const { encoded, data: responseData } = await CompressedResponse.handle(req, res, response);

    res.setHeader('Content-Type', 'application/json');
    res.end(encoded ? responseData : JSON.stringify(responseData));

  } else if (pathname === '/api/search') {
    const query = url.searchParams.get('q') || '';

    // 模拟搜索
    const results = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      title: `Result ${i + 1} for "${query}"`,
      score: Math.random()
    })).slice(0, 20);

    const response = {
      query,
      results,
      timestamp: Date.now()
    };

    // 压缩处理
    const { encoded, data: responseData } = await CompressedResponse.handle(req, res, response);

    res.setHeader('Content-Type', 'application/json');
    res.end(encoded ? responseData : JSON.stringify(responseData));

  } else if (pathname === '/api/stats') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      cacheSize: cache.cache.size,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    }));

  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(3000, () => {
  console.log('API响应优化服务器运行在 http://localhost:3000');
  console.log('\n测试命令:');
  console.log('curl http://localhost:3000/api/users');
  console.log('curl -H "Accept-Encoding: gzip" http://localhost:3000/api/users');
  console.log('curl -H "Accept-Encoding: br" http://localhost:3000/api/users');
});
```

---

## 十、进程管理

### 10.1 集群模式：cluster

Node.js的cluster模块允许利用多核CPU，创建共享端口的多个工作进程。

```javascript
// 集群模式实战

const cluster = require('cluster');
const os = require('os');

// ==================== 基础集群 ====================

function setupCluster(options = {}) {
  const numCPUs = options.numCPUs || os.cpus().length;
  const port = options.port || 3000;

  if (cluster.isMaster) {
    console.log(`主进程 ${process.pid} 启动`);
    console.log(`创建 ${numCPUs} 个工作进程...`);

    // 创建工作进程
    for (let i = 0; i < numCPUs; i++) {
      const worker = cluster.fork();

      console.log(`工作进程 ${worker.id} (PID: ${worker.process.pid}) 已启动`);
    }

    // 工作进程退出时重新创建
    cluster.on('exit', (worker, code, signal) => {
      console.log(`工作进程 ${worker.id} 退出 (code: ${code}, signal: ${signal})`);
      console.log('重新启动工作进程...');

      // 延迟重启，避免频繁重启
      setTimeout(() => {
        cluster.fork();
      }, 1000);
    });

    // 监听来自工作进程的消息
    cluster.on('message', (worker, message) => {
      console.log(`来自工作进程 ${worker.id} 的消息:`, message);
    });

  } else {
    // 工作进程运行服务器
    const http = require('http');

    const server = http.createServer((req, res) => {
      // 模拟请求处理
      const start = Date.now();

      setTimeout(() => {
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'X-Worker-ID': cluster.worker.id
        });
        res.end(JSON.stringify({
          pid: process.pid,
          workerId: cluster.worker.id,
          uptime: process.uptime(),
          requestDuration: Date.now() - start
        }));
      }, Math.random() * 100);
    });

    server.listen(port, () => {
      console.log(`工作进程 ${cluster.worker.id} 监听端口 ${port}`);
    });

    // 定期向主进程发送心跳
    setInterval(() => {
      process.send({ type: 'heartbeat', workerId: cluster.worker.id, pid: process.pid });
    }, 5000);

    // 处理进程信号
    process.on('SIGTERM', () => {
      console.log(`工作进程 ${cluster.worker.id} 收到 SIGTERM，准备关闭...`);
      server.close(() => {
        console.log(`工作进程 ${cluster.worker.id} 已关闭`);
        process.exit(0);
      });
    });
  }
}

// ==================== 负载均衡集群 ====================

function setupLoadBalancedCluster() {
  const numCPUs = os.cpus().length;

  if (cluster.isMaster) {
    console.log(`负载均衡集群: ${numCPUs} 个CPU核心`);

    // 跟踪请求数
    const requests = new Map();

    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    // 轮询调度（默认是OS调度）
    cluster.on('exit', (worker) => {
      cluster.fork();
    });

  } else {
    const http = require('http');
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'X-Worker-ID': cluster.worker.id });
      res.end(`Handled by worker ${cluster.worker.id}\n`);
    });

    server.listen(3000);
  }
}

// ==================== 共享状态集群 ====================

// 使用Redis在集群间共享状态
const redis = require('redis');

class SharedStateCluster {
  constructor(options = {}) {
    this.port = options.port || 3000;
    this.numWorkers = options.numWorkers || os.cpus().length;
    this.redisClient = null;
  }

  async initialize() {
    // 连接Redis
    this.redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    await this.redisClient.connect();
    console.log('Redis已连接');

    if (cluster.isMaster) {
      await this.setupMaster();
    } else {
      await this.setupWorker();
    }
  }

  async setupMaster() {
    console.log(`主进程 ${process.pid} 启动`);

    for (let i = 0; i < this.numWorkers; i++) {
      cluster.fork();
    }

    cluster.on('exit', async (worker) => {
      console.log(`工作进程 ${worker.id} 退出`);
      // 重新创建
      await new Promise(resolve => setTimeout(resolve, 1000));
      cluster.fork();
    });
  }

  async setupWorker() {
    const http = require('http');

    // 获取当前工作进程ID
    const workerId = cluster.worker.id;

    const server = http.createServer(async (req, res) => {
      // 使用Redis实现分布式锁
      const lockKey = `lock:${req.url}`;
      const lockValue = `${workerId}:${Date.now()}`;

      try {
        // 尝试获取锁
        const locked = await this.redisClient.set(lockKey, lockValue, {
          NX: true,
          EX: 5
        });

        if (locked) {
          res.writeHead(200, {
            'X-Worker-ID': workerId,
            'X-Lock': lockValue
          });
          res.end(`Handled by worker ${workerId}\n`);

          // 释放锁
          await this.redisClient.del(lockKey);
        } else {
          res.writeHead(503);
          res.end('Service Unavailable - Locked\n');
        }
      } catch (err) {
        console.error('Redis错误:', err);
        res.writeHead(200, { 'X-Worker-ID': workerId });
        res.end(`Handled by worker ${workerId} (no lock)\n`);
      }
    });

    server.listen(this.port + workerId - 1, () => {
      console.log(`工作进程 ${workerId} 监听端口 ${this.port + workerId - 1}`);
    });
  }
}

// 启动
if (require.main === module) {
  // setupCluster();
  // setupLoadBalancedCluster();

  const clusterManager = new SharedStateCluster({
    numWorkers: os.cpus().length,
    port: 3000
  });

  clusterManager.initialize().catch(console.error);
}
```

### 10.2 PM2进程管理

PM2是Node.js生产环境中常用的进程管理器。

```javascript
// PM2配置示例 (ecosystem.config.js)

/**
 * PM2生态系统配置
 * 运行: pm2 start ecosystem.config.js
 */

module.exports = {
  apps: [
    {
      name: 'api-server',                    // 应用名称
      script: './server.js',                // 入口脚本
      instances: 'max',                      // 实例数量 (数字或 'max')
      exec_mode: 'cluster',                  // 模式: 'fork' 或 'cluster'
      max_memory_restart: '512M',           // 内存超过512MB时重启
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // 日志配置
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // 监控
      monitor: true,
      // 重启策略
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      // 优雅重启
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 3000,
      // 其他
      instance_var: 'INSTANCE_ID',
      exec_interpreter: 'node',
      node_args: '--max-old-space-size=4096'
    },
    {
      name: 'worker',
      script: './worker.js',
      instances: 4,
      exec_mode: 'fork',
      // 后台运行
      daemon: true,
      // 定时任务
      cron_restart: '0 3 * * *'
    }
  ]
};

// PM2常用命令
/*
pm2 start ecosystem.config.js          # 启动所有应用
pm2 start server.js --name api          # 启动并命名
pm2 stop api                            # 停止
pm2 restart api                         # 重启
pm2 delete api                          # 删除

pm2 list                                # 列出所有进程
pm2 monit                               # 实时监控
pm2 logs api                            # 查看日志
pm2 flush                               # 清空日志

pm2 reload api                          # 优雅重启（0停机）
pm2 gracefulReload api                  # 优雅重启

pm2 describe api                        # 查看详情
pm2 show api                             # 显示配置

pm2 startup                             # 生成启动脚本
pm2 save                                # 保存当前进程列表

pm2 update                              # 更新PM2
pm2 report                              # 生成调试报告
*/
```

### 10.3 零重启部署

```javascript
// 零重启部署（Graceful Deployment）

const http = require('http');
const { EventEmitter } = require('events');

// ==================== 优雅关闭管理器 ====================

class GracefulShutdown {
  constructor(options = {}) {
    this.server = null;
    this.connections = new Map();
    this.connectionId = 0;
    this.isShuttingDown = false;
    this.gracefulTimeout = options.gracefulTimeout || 30000;
    this.logger = options.logger || console;
  }

  createServer(handler) {
    this.server = http.createServer(handler);

    // 跟踪连接
    this.server.on('connection', (socket) => {
      const id = this.connectionId++;
      this.connections.set(id, socket);

      socket.on('close', () => {
        this.connections.delete(id);
      });
    });

    // 监听关闭事件
    this.server.on('close', () => {
      this.logger.log('服务器已完全关闭');
    });

    return this.server;
  }

  async shutdown() {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    this.logger.log('开始优雅关闭...');

    // 1. 停止接收新连接
    this.server.close();

    // 2. 通知负载均衡器移除此实例
    this.logger.log('通知负载均衡器...');

    // 3. 等待现有请求完成
    this.logger.log(`等待最多 ${this.gracefulTimeout}ms 完成现有请求...`);

    const gracefulDelay = new Promise(resolve => {
      setTimeout(resolve, this.gracefulTimeout);
    });

    // 4. 强制关闭（如果超时）
    await gracefulDelay;

    this.forceShutdown();
  }

  forceShutdown() {
    this.logger.log('强制关闭所有连接...');

    // 销毁所有连接
    for (const [id, socket] of this.connections) {
      socket.destroy();
    }
    this.connections.clear();

    // 清理资源
    this.cleanup();

    process.exit(0);
  }

  cleanup() {
    this.logger.log('清理资源...');
    // 关闭数据库连接
    // 关闭Redis连接
    // 保存状态
  }
}

// ==================== 零重启部署服务器 ====================

class ZeroDowntimeServer {
  constructor(options = {}) {
    this.port = options.port || 3000;
    this.graceful = new GracefulShutdown({
      gracefulTimeout: options.gracefulTimeout || 30000
    });
    this.requests = 0;
    this.startTime = Date.now();
  }

  async start() {
    const handler = this.createHandler();
    const server = this.graceful.createServer(handler);

    server.listen(this.port, () => {
      console.log(`服务器启动，PID: ${process.pid}, 端口: ${this.port}`);
    });

    // 处理信号
    process.on('SIGTERM', () => {
      console.log('收到SIGTERM信号');
      this.graceful.shutdown();
    });

    process.on('SIGINT', () => {
      console.log('收到SIGINT信号');
      this.graceful.shutdown();
    });
  }

  createHandler() {
    return (req, res) => {
      this.requests++;

      // 模拟处理
      setTimeout(() => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          pid: process.pid,
          requests: this.requests,
          uptime: Date.now() - this.startTime
        }));
      }, Math.random() * 100);
    };
  }
}

// ==================== 健康检查 ====================

class HealthCheck {
  constructor(server) {
    this.server = server;
    this.checks = [];
    this.unhealthyCount = 0;
  }

  registerCheck(name, checkFn) {
    this.checks.push({ name, checkFn });
  }

  async check() {
    const results = [];

    for (const { name, checkFn } of this.checks) {
      try {
        await checkFn();
        results.push({ name, status: 'healthy' });
      } catch (err) {
        results.push({ name, status: 'unhealthy', error: err.message });
      }
    }

    const allHealthy = results.every(r => r.status === 'healthy');

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: Date.now(),
      checks: results
    };
  }

  middleware() {
    return async (req, res) => {
      if (req.url === '/health') {
        const health = await this.check();

        res.writeHead(health.status === 'healthy' ? 200 : 503, {
          'Content-Type': 'application/json'
        });
        res.end(JSON.stringify(health));
      } else if (req.url === '/ready') {
        // 就绪检查
        const isReady = !this.server.graceful.isShuttingDown;

        res.writeHead(isReady ? 200 : 503, {
          'Content-Type': 'application/json'
        });
        res.end(JSON.stringify({ ready: isReady }));
      }
    };
  }
}

// 启动
const server = new ZeroDowntimeServer({ port: 3000 });
const healthCheck = new HealthCheck(server.graceful);

// 注册健康检查
healthCheck.registerCheck('memory', () => {
  const mem = process.memoryUsage();
  if (mem.heapUsed / mem.heapTotal > 0.9) {
    throw new Error('内存使用超过90%');
  }
});

healthCheck.registerCheck('connections', () => {
  if (server.graceful.connections.size > 1000) {
    throw new Error('连接数过多');
  }
});

server.start();
```

### 10.4 优雅关闭

```javascript
// 优雅关闭实战

const http = require('http');
const fs = require('fs');
const path = require('path');

// ==================== 连接状态管理 ====================

class ConnectionManager {
  constructor() {
    this.connections = new Map();
    this.requests = new Map();
    this.requestId = 0;
  }

  addConnection(socket) {
    const id = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.connections.set(id, {
      socket,
      createdAt: Date.now(),
      requests: 0
    });
    return id;
  }

  removeConnection(id) {
    this.connections.delete(id);
  }

  addRequest(connId, requestId) {
    const conn = this.connections.get(connId);
    if (conn) {
      conn.requests++;
      this.requests.set(requestId, {
        connId,
        startTime: Date.now()
      });
    }
  }

  completeRequest(requestId) {
    this.requests.delete(requestId);
  }

  getActiveRequests() {
    return this.requests.size;
  }

  closeAll(drainTime = 5000) {
    console.log(`关闭 ${this.connections.size} 个连接...`);

    for (const [id, conn] of this.connections) {
      // 停止新请求
      conn.socket.pause();

      // 等待现有请求完成
      setTimeout(() => {
        conn.socket.destroy();
      }, drainTime);
    }
  }
}

// ==================== 优雅关闭服务器 ====================

const connectionManager = new ConnectionManager();

const server = http.createServer((req, res) => {
  const connId = req.socket._id;
  const requestId = connectionManager.requestId++;

  connectionManager.addRequest(connId, requestId);

  // 处理请求
  const startTime = Date.now();
  const data = { processed: true, timestamp: Date.now() };

  setTimeout(() => {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'X-Request-Duration': Date.now() - startTime
    });
    res.end(JSON.stringify(data));

    connectionManager.completeRequest(requestId);
  }, Math.random() * 100);
});

// 标记连接
server.on('connection', (socket) => {
  socket._id = connectionManager.addConnection(socket);

  socket.on('close', () => {
    connectionManager.removeConnection(socket._id);
  });
});

// ==================== 信号处理 ====================

let isShuttingDown = false;

async function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n收到 ${signal} 信号，开始优雅关闭...`);

  // 1. 停止接收新连接
  server.close(() => {
    console.log('HTTP服务器已关闭');
  });

  // 2. 通知健康检查端点
  console.log('标记为不健康...');

  // 3. 等待现有请求完成（最多30秒）
  console.log(`等待 ${connectionManager.getActiveRequests()} 个活跃请求完成...`);

  const maxWait = 30000;
  const startTime = Date.now();

  await new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      const activeRequests = connectionManager.getActiveRequests();

      if (activeRequests === 0) {
        clearInterval(checkInterval);
        resolve();
      } else if (Date.now() - startTime > maxWait) {
        console.log('等待超时，强制关闭...');
        clearInterval(checkInterval);
        resolve();
      } else {
        console.log(`仍有 ${activeRequests} 个活跃请求，等待中...`);
      }
    }, 1000);
  });

  // 4. 清理资源
  console.log('清理资源...');
  connectionManager.closeAll(5000);

  // 5. 关闭数据库连接等
  console.log('关闭数据库连接...');
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log('优雅关闭完成');
  process.exit(0);
}

// 注册信号处理器
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 未捕获异常处理
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  gracefulShutdown('uncaughtException');
});

// 拒绝处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});

server.listen(3000, () => {
  console.log('优雅关闭服务器运行在 http://localhost:3000');
  console.log(`PID: ${process.pid}`);
  console.log('发送 SIGTERM 或 SIGINT 来测试优雅关闭');
});
```

### 10.5 实战：多进程架构

```javascript
// 多进程架构实战

const cluster = require('cluster');
const os = require('os');
const http = require('http');
const net = require('net');
const { EventEmitter } = require('events');

// ==================== 进程间通信 ====================

class IPCManager extends EventEmitter {
  constructor() {
    super();
    this.handlers = new Map();
  }

  registerHandler(type, handler) {
    this.handlers.set(type, handler);
  }

  handleMessage(message) {
    const handler = this.handlers.get(message.type);
    if (handler) {
      handler(message.data);
    }
    this.emit('message', message);
  }
}

const ipc = new IPCManager();

// 注册消息处理器
ipc.registerHandler('stats', (data) => {
  console.log('收到统计:', data);
});

ipc.registerHandler('shutdown', (data) => {
  console.log('收到关闭指令');
  process.exit(0);
});

// ==================== 主进程 ====================

class MasterProcess {
  constructor() {
    this.workers = new Map();
    this.numWorkers = os.cpus().length;
    this.stats = {
      totalRequests: 0,
      workerStats: new Map()
    };
  }

  start() {
    console.log('='.repeat(50));
    console.log(`主进程启动 (PID: ${process.pid})`);
    console.log(`创建 ${this.numWorkers} 个工作进程`);
    console.log('='.repeat(50));

    // 设置进程标题
    process.title = 'node-master';

    for (let i = 0; i < this.numWorkers; i++) {
      this.spawnWorker(i + 1);
    }

    // 收集工作进程统计
    setInterval(() => this.collectStats(), 5000);

    // 负载监控
    setInterval(() => this.monitor(), 10000);
  }

  spawnWorker(id) {
    const worker = cluster.fork({ workerId: id });

    this.workers.set(id, {
      worker,
      requests: 0,
      lastActive: Date.now(),
      status: 'active'
    });

    worker.on('message', (message) => {
      this.handleWorkerMessage(id, message);
    });

    worker.on('exit', () => {
      console.log(`工作进程 ${id} 退出，重新创建...`);
      this.workers.delete(id);
      setTimeout(() => this.spawnWorker(id), 1000);
    });

    console.log(`工作进程 ${id} 已启动 (PID: ${worker.process.pid})`);
  }

  handleWorkerMessage(workerId, message) {
    const workerInfo = this.workers.get(workerId);
    if (!workerInfo) return;

    switch (message.type) {
      case 'request':
        workerInfo.requests++;
        workerInfo.lastActive = Date.now();
        this.stats.totalRequests++;
        break;

      case 'stats':
        this.stats.workerStats.set(workerId, message.data);
        break;

      case 'error':
        console.error(`工作进程 ${workerId} 错误:`, message.data);
        break;
    }
  }

  collectStats() {
    for (const [id, info] of this.workers) {
      info.worker.send({
        type: 'collect-stats',
        data: {
          requests: info.requests,
          uptime: process.uptime()
        }
      });
    }
  }

  monitor() {
    console.log('\n--- 集群状态 ---');
    console.log(`总请求数: ${this.stats.totalRequests}`);
    console.log('工作进程:');

    for (const [id, info] of this.workers) {
      console.log(`  ${id}: ${info.requests} 请求, 状态: ${info.status}`);
    }
  }

  broadcast(message) {
    for (const [id, info] of this.workers) {
      info.worker.send(message);
    }
  }
}

// ==================== 工作进程 ====================

class WorkerProcess {
  constructor() {
    this.workerId = process.env.workerId;
    this.requests = 0;
    this.startTime = Date.now();
    this.server = null;
  }

  start() {
    console.log(`工作进程 ${this.workerId} 启动 (PID: ${process.pid})`);

    // 设置进程标题
    process.title = `node-worker-${this.workerId}`;

    // 创建HTTP服务器
    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    // 监听端口
    const port = 3000 + parseInt(this.workerId) - 1;
    this.server.listen(port, () => {
      console.log(`工作进程 ${this.workerId} 监听端口 ${port}`);
    });

    // 定期向主进程发送心跳
    this.startHeartbeat();

    // 处理进程消息
    process.on('message', (message) => {
      this.handleMasterMessage(message);
    });

    // 优雅关闭
    this.setupGracefulShutdown();
  }

  handleRequest(req, res) {
    this.requests++;

    // 通知主进程
    process.send({
      type: 'request',
      data: { workerId: this.workerId, url: req.url }
    });

    const startTime = Date.now();

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'X-Worker-ID': this.workerId
    });

    res.end(JSON.stringify({
      workerId: this.workerId,
      pid: process.pid,
      request: this.requests,
      uptime: Date.now() - this.startTime,
      processingTime: Date.now() - startTime
    }));
  }

  startHeartbeat() {
    setInterval(() => {
      process.send({
        type: 'stats',
        data: {
          workerId: this.workerId,
          requests: this.requests,
          memory: process.memoryUsage(),
          cpu: process.cpuUsage()
        }
      });
    }, 5000);
  }

  handleMasterMessage(message) {
    switch (message.type) {
      case 'collect-stats':
        process.send({
          type: 'stats',
          data: {
            requests: this.requests,
            uptime: process.uptime()
          }
        });
        break;

      case 'shutdown':
        console.log(`工作进程 ${this.workerId} 收到关闭指令`);
        this.shutdown();
        break;

      case 'config':
        console.log(`工作进程 ${this.workerId} 收到配置更新:`, message.data);
        break;
    }
  }

  setupGracefulShutdown() {
    const shutdown = () => {
      console.log(`工作进程 ${this.workerId} 关闭中...`);

      this.server.close(() => {
        console.log(`工作进程 ${this.workerId} 已关闭`);
        process.exit(0);
      });

      // 30秒后强制退出
      setTimeout(() => {
        console.log(`工作进程 ${this.workerId} 强制退出`);
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  }

  shutdown() {
    this.server.close();
    process.exit(0);
  }
}

// ==================== 启动 ====================

if (cluster.isMaster) {
  const master = new MasterProcess();
  master.start();
} else {
  const worker = new WorkerProcess();
  worker.start();
}
```

---

## 十一、代码级优化

### 11.1 循环优化

```javascript
// 循环优化技巧

// ==================== 基本循环优化 ====================

// 不推荐：每次迭代都计算数组长度
function badLoop(arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) { // 每次都要访问arr.length
    sum += arr[i];
  }
  return sum;
}

// 推荐：缓存数组长度
function goodLoop(arr) {
  let sum = 0;
  const len = arr.length; // 缓存长度
  for (let i = 0; i < len; i++) {
    sum += arr[i];
  }
  return sum;
}

// ==================== 倒序循环 ====================

// 倒序循环可能更快（某些情况下）
function reverseLoop(arr) {
  let sum = 0;
  for (let i = arr.length - 1; i >= 0; i--) {
    sum += arr[i];
  }
  return sum;
}

// ==================== 减少属性访问 ====================

// 不推荐：多次访问对象属性
function badPropertyAccess(obj) {
  let sum = 0;
  for (let i = 0; i < 1000; i++) {
    sum += obj.value + obj.offset + obj.factor;
  }
  return sum;
}

// 推荐：缓存属性值
function goodPropertyAccess(obj) {
  let sum = 0;
  const { value, offset, factor } = obj; // 解构缓存
  for (let i = 0; i < 1000; i++) {
    sum += value + offset + factor;
  }
  return sum;
}

// ==================== 循环展开 ====================

// 标准循环
function standardLoop(arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
  }
  return sum;
}

// 4次展开（适合长度是4的倍数）
function unrolledLoop(arr) {
  let sum = 0;
  const len = arr.length;
  const limit = len - 3;

  // 处理前limit个（每4个一组）
  for (let i = 0; i < limit; i += 4) {
    sum += arr[i] + arr[i + 1] + arr[i + 2] + arr[i + 3];
  }

  // 处理剩余的
  for (let i = limit; i < len; i++) {
    sum += arr[i];
  }

  return sum;
}

// ==================== 优化判断条件 ====================

// 不推荐：在循环中每次都计算
function badConditionLoop(arr, threshold) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > threshold) { // 每次都要计算threshold
      sum += arr[i];
    }
  }
  return sum;
}

// 推荐：将不变的计算移到循环外
function goodConditionLoop(arr, threshold) {
  let sum = 0;
  const isAboveThreshold = (v) => v > threshold; // 或直接内联
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > threshold) {
      sum += arr[i];
    }
  }
  return sum;
}

// ==================== 使用Map/Set代替普通对象遍历 ====================

// 不推荐：使用对象模拟Map
function badObjectLoop(data) {
  const lookup = {};
  for (const item of data) {
    lookup[item.id] = item;
  }

  // 查找
  const found = [];
  for (const item of data) {
    if (lookup[item.parentId]) {
      found.push(item);
    }
  }
  return found;
}

// 推荐：使用真正的Map
function goodMapLoop(data) {
  const lookup = new Map();
  for (const item of data) {
    lookup.set(item.id, item);
  }

  // 查找
  const found = [];
  for (const item of data) {
    if (lookup.has(item.parentId)) {
      found.push(item);
    }
  }
  return found;
}

// ==================== while循环 vs for循环 ====================

// while循环（某些情况下更快）
function whileLoop(arr) {
  let sum = 0;
  let i = 0;
  while (i < arr.length) {
    sum += arr[i];
    i++;
  }
  return sum;
}

// for...of（最简洁，但对某些类型可能稍慢）
function forOfLoop(arr) {
  let sum = 0;
  for (const item of arr) {
    sum += item;
  }
  return sum;
}

// ==================== 性能测试 ====================

function benchmark(fn, arr, name) {
  const iterations = 10000;
  const start = Date.now();

  for (let i = 0; i < iterations; i++) {
    fn(arr);
  }

  const duration = Date.now() - start;
  console.log(`${name}: ${duration}ms (${(duration / iterations).toFixed(6)}ms per call)`);
}

// 测试
const testArr = Array.from({ length: 1000 }, (_, i) => i);

benchmark(badLoop, testArr, 'badLoop');
benchmark(goodLoop, testArr, 'goodLoop');
benchmark(reverseLoop, testArr, 'reverseLoop');
benchmark(standardLoop, testArr, 'standardLoop');
benchmark(unrolledLoop, testArr, 'unrolledLoop');
benchmark(whileLoop, testArr, 'whileLoop');
benchmark(forOfLoop, testArr, 'forOfLoop');
```

### 11.2 字符串拼接

```javascript
// 字符串拼接优化

// ==================== 不推荐：字符串累加 ====================

function badStringConcat(count) {
  let result = '';
  for (let i = 0; i < count; i++) {
    result += 'item' + i + ',';
  }
  return result;
}

// ==================== 推荐：使用数组join ====================

function goodStringConcat(count) {
  const parts = [];
  for (let i = 0; i < count; i++) {
    parts.push('item' + i);
  }
  return parts.join(',');
}

// ==================== 使用模板字符串 ====================

function templateConcat(items) {
  return items.map(item => `id: ${item.id}, name: ${item.name}`).join('\n');
}

// ==================== 使用StringBuilder模式 ====================

class StringBuilder {
  constructor() {
    this.parts = [];
    this.currentLine = '';
  }

  append(str) {
    this.currentLine += str;
    return this;
  }

  appendLine(str) {
    this.parts.push(this.currentLine + str);
    this.currentLine = '';
    return this;
  }

  toString() {
    if (this.currentLine) {
      this.parts.push(this.currentLine);
    }
    return this.parts.join('\n');
  }

  clear() {
    this.parts = [];
    this.currentLine = '';
  }
}

// ==================== 预分配数组大小 ====================

function preallocateJoin(count) {
  // 预分配（如果知道大小）
  const parts = new Array(count);
  for (let i = 0; i < count; i++) {
    parts[i] = 'item' + i;
  }
  return parts.join(',');
}

// ==================== 性能对比 ====================

const iterations = 10000;
const itemCount = 100;

console.log('字符串拼接性能测试:');

let start = Date.now();
for (let i = 0; i < iterations; i++) {
  badStringConcat(itemCount);
}
console.log(`累加方式: ${Date.now() - start}ms`);

start = Date.now();
for (let i = 0; i < iterations; i++) {
  goodStringConcat(itemCount);
}
console.log(`数组join: ${Date.now() - start}ms`);

start = Date.now();
for (let i = 0; i < iterations; i++) {
  preallocateJoin(itemCount);
}
console.log(`预分配join: ${Date.now() - start}ms`);
```

### 11.3 正则表达式优化

```javascript
// 正则表达式优化

// ==================== 编译正则 vs 运行时正则 ====================

// 不推荐：在循环中重复编译正则
function badRegexInLoop(text, patterns) {
  const results = [];
  for (const pattern of patterns) {
    // 每次都编译正则
    const regex = new RegExp(pattern);
    results.push(text.match(regex));
  }
  return results;
}

// 推荐：在循环外编译正则
function goodRegexOutsideLoop(text, patterns) {
  const results = [];
  const regexes = patterns.map(p => new RegExp(p)); // 预编译
  for (const regex of regexes) {
    results.push(text.match(regex));
  }
  return results;
}

// ==================== 使用已编译的正则 ====================

// 已知的正则表达式应该提取为常量
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const URL_REGEX = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
const PHONE_REGEX = /^1[3-9]\d{9}$/;

// ==================== 优化正则结构 ====================

// 不推荐：贪婪匹配可能导致回溯
const slowRegex = /<html>[\s\S]*<body>[\s\S]*<\/body>[\s\S]*<\/html>/;

// 推荐：使用非贪婪或字符类
const fastRegex = /<html>[\s\S]*?<body>[\s\S]*?<\/body>[\s\S]*?<\/html>/;

// 最佳：使用具体字符类
const bestRegex = /<html>(?:(?!<body>)[\s\S])*<body>(?:(?!<\/body>)[\s\S])*<\/body>(?:(?!<\/html>)[\s\S])*<\/html>/;

// ==================== 避免灾难性回溯 ====================

// 不推荐：嵌套量词导致灾难性回溯
const catastrophicRegex = /([a-z]+)+b/;

// 推荐：使用原子组或简化模式
const safeRegex = /[a-z]+b/;

// 更安全的邮箱验证（避免复杂嵌套）
const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// ==================== 使用合适的标志 ====================

// i: 不区分大小写
// g: 全局匹配
// m: 多行模式
// s: dotAll模式（.匹配换行）

// 不需要g时不使用
function singleMatch(text) {
  return text.match(/error/i); // 只需要第一个匹配
}

// 使用g时要考虑lastIndex
function globalMatch(text) {
  const regex = /error/gi;
  const matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push(match[0]);
  }
  return matches;
}

// ==================== 预检查优化 ====================

// 不推荐：先匹配再验证
function badValidateEmail(email) {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

// 推荐：先做快速预检查
function goodValidateEmail(email) {
  // 快速预检查：必须有@和.
  if (email.indexOf('@') === -1 || email.indexOf('.') === -1) {
    return false;
  }
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

// ==================== 使用String方法代替正则 ====================

// 简单匹配使用String方法
function stringMethods() {
  // 判断是否包含
  const hasPrefix = str.indexOf('prefix') !== -1; // 快于正则
  const startsWith = str.startsWith('prefix');   // 原生方法更快
  const endsWith = str.endsWith('suffix');
  const includes = str.includes('substring');

  // 分割和替换
  const parts = str.split(',');      // 通常快于split(/,/)
  const replaced = str.replace(',', '-'); // 单次替换不需要正则
}

// ==================== 性能测试 ====================

function benchmarkRegex(fn, iterations = 10000) {
  const start = Date.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  return Date.now() - start;
}

const testEmail = 'test@example.com';
const testText = 'This is a sample text with error and another error inside it.';

console.log('正则表达式性能测试:');
console.log(`badRegexInLoop: ${benchmarkRegex(() => badRegexInLoop(testText, ['error', 'sample', 'text']))}ms`);
console.log(`goodRegexOutsideLoop: ${benchmarkRegex(() => goodRegexOutsideLoop(testText, ['error', 'sample', 'text']))}ms`);
```

### 11.4 异常捕获优化

```javascript
// 异常捕获优化

// ==================== 不推荐：吞掉所有异常 ====================

async function badErrorHandling() {
  try {
    return await fetchData();
  } catch (err) {
    // 什么都不做，错误丢失
    return null;
  }
}

// ==================== 推荐：具体错误处理 ====================

async function goodErrorHandling() {
  try {
    return await fetchData();
  } catch (err) {
    if (err instanceof ValidationError) {
      // 处理验证错误
      throw err; // 或返回特定错误响应
    } else if (err instanceof NetworkError) {
      // 处理网络错误
      return { error: '网络错误，请稍后重试' };
    } else if (err instanceof TimeoutError) {
      // 处理超时
      return { error: '请求超时' };
    } else {
      // 未知错误，记录并抛出
      console.error('未预期的错误:', err);
      throw err;
    }
  }
}

// ==================== 使用finally清理资源 ====================

async function withFinally() {
  const resource = await acquireResource();

  try {
    return await useResource(resource);
  } finally {
    // 确保清理
    await releaseResource(resource);
  }
}

// ==================== 同步错误处理 ====================

function syncErrorHandling() {
  let result;

  try {
    result = JSON.parse(userInput);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return { error: '无效的JSON格式' };
    }
    throw err;
  }

  return result;
}

// ==================== 异步错误处理链 ====================

async function asyncErrorChain() {
  // 使用result类型而不是抛出异常
  const result = {
    success: false,
    data: null,
    error: null
  };

  try {
    // 验证
    if (!input) {
      result.error = '输入不能为空';
      return result;
    }

    // 获取数据
    const data = await fetchData(input);
    if (!data) {
      result.error = '数据不存在';
      return result;
    }

    // 处理数据
    const processed = await processData(data);
    if (!processed) {
      result.error = '处理失败';
      return result;
    }

    result.success = true;
    result.data = processed;
    return result;

  } catch (err) {
    result.error = err.message;
    return result;
  }
}

// ==================== 错误边界模式 ====================

class ErrorBoundary {
  constructor() {
    this.error = null;
  }

  run(fn) {
    try {
      return fn();
    } catch (err) {
      this.error = err;
      return null;
    }
  }

  async runAsync(fn) {
    try {
      return await fn();
    } catch (err) {
      this.error = err;
      return null;
    }
  }

  getError() {
    return this.error;
  }

  hasError() {
    return this.error !== null;
  }

  clear() {
    this.error = null;
  }
}

// ==================== Express错误中间件 ====================

function errorMiddleware(err, req, res, next) {
  console.error('错误:', err);

  // 特定错误处理
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: '验证错误',
      details: err.details
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: '未授权'
    });
  }

  if (err.name === 'NotFoundError') {
    return res.status(404).json({
      error: '资源不存在'
    });
  }

  // 默认错误
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? '服务器内部错误'
      : err.message
  });
}

// ==================== 全局未捕获异常处理 ====================

process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', {
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });

  // 记录后优雅退出
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', {
    reason,
    timestamp: new Date().toISOString()
  });
});
```

### 11.5 我的思考：不Premature Optimization

```javascript
// 性能优化的原则

/**
 * Donald Knuth 的经典名言：
 * "Premature optimization is the root of all evil in programming."
 *
 * 意思是：在没有充分理解问题的情况下过早进行优化，
 * 往往会浪费时间，增加复杂性，甚至引入bug。
 */

// ==================== 什么时候优化 ====================

/*
1. 当性能测试证明确实存在瓶颈时
2. 当代码逻辑清晰且正确时
3. 当有明确的性能目标时
4. 当优化成本可接受时

优化顺序建议：
1. 先保证代码正确性和可读性
2. 使用合适的算法和数据结构
3. 编写清晰、模块化的代码
4. 进行性能测试
5. 根据测试结果优化热点代码
*/

// ==================== 如何识别真正的热点 ====================

// 使用性能分析工具
function identifyHotspots() {
  // 1. 使用Chrome DevTools
  // 2. 使用clinic.js
  // 3. 使用--prof标志

  // 不要猜测，要测量
  console.log(`
    性能优化应该基于数据，而非猜测：

    1. 编写基准测试
    2. 使用profiler定位热点
    3. 测量优化前后的差异
    4. 权衡优化成本与收益
  `);
}

// ==================== 优化示例：有意义的优化 ====================

// 好的优化：从O(n²)到O(n)
function badAlgorithm(data) {
  // O(n²) - 嵌套循环
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < data.length; j++) {
      if (data[i] === data[j] && i !== j) {
        return true;
      }
    }
  }
  return false;
}

function goodAlgorithm(data) {
  // O(n) - 使用Set
  const seen = new Set();
  for (const item of data) {
    if (seen.has(item)) {
      return true;
    }
    seen.add(item);
  }
  return false;
}

// ==================== 无意义的优化 ====================

// 微秒级优化通常不值得
function microOptimization() {
  // 这些优化通常不值得
  // for vs while（差异极小）
  // var vs let（仅在大量使用时才有影响）
  // 'use strict'（编译时优化）

  // 更值得关注的是：
  // 1. 网络请求次数
  // 2. 数据库查询效率
  // 3. 内存使用
  // 4. 算法复杂度
}

// ==================== 优化清单 ====================

const optimizationChecklist = {
  beforeOptimize: [
    '是否有性能测试数据？',
    '是否已经定位到具体的热点？',
    '是否理解为什么这是热点？',
    '优化方案的复杂度是否可接受？'
  ],

  commonHotspots: [
    '数据库查询（N+1问题）',
    '循环中的重复计算',
    '未缓存的计算结果',
    '不必要的内存分配',
    '同步阻塞操作',
    '过度的内存使用'
  ],

  quickWins: [
    '添加适当的缓存',
    '使用数据库索引',
    '减少网络请求',
    '批量操作替代循环',
    '使用合适的数据结构'
  ]
};
```

---

## 十二、实战案例

### 12.1 从1000QPS到10000QPS

```javascript
// 性能优化实战：从1000QPS到10000QPS

/**
 * 假设场景：
 * 一个Node.js API服务器，当前处理能力为1000QPS
 * 目标：提升到10000QPS
 */

// ==================== 阶段1：基线测试 ====================

// 建立性能基线
async function establishBaseline() {
  const http = require('http');

  const baseline = {
    requests: 0,
    errors: 0,
    totalTime: 0,
    startTime: Date.now()
  };

  async function makeRequest() {
    const start = Date.now();

    return new Promise((resolve) => {
      const req = http.get('http://localhost:3000/api/data', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          baseline.requests++;
          baseline.totalTime += Date.now() - start;
          resolve();
        });
      });

      req.on('error', () => {
        baseline.errors++;
        resolve();
      });
    });
  }

  // 并发测试
  const concurrency = 100;
  const totalRequests = 10000;

  console.log(`基线测试: ${totalRequests} 请求, 并发 ${concurrency}`);

  const batches = Math.ceil(totalRequests / concurrency);

  for (let i = 0; i < batches; i++) {
    const promises = [];
    for (let j = 0; j < concurrency && (i * concurrency + j) < totalRequests; j++) {
      promises.push(makeRequest());
    }
    await Promise.all(promises);

    if ((i + 1) % 10 === 0) {
      console.log(`进度: ${(i + 1) * concurrency}/${totalRequests}`);
    }
  }

  const duration = Date.now() - baseline.startTime;
  const qps = (baseline.requests / duration * 1000).toFixed(2);
  const avgLatency = (baseline.totalTime / baseline.requests).toFixed(2);

  console.log(`\n基线结果:`);
  console.log(`  QPS: ${qps}`);
  console.log(`  平均延迟: ${avgLatency}ms`);
  console.log(`  错误率: ${(baseline.errors / baseline.requests * 100).toFixed(2)}%`);

  return { qps, avgLatency, errors: baseline.errors };
}

// ==================== 阶段2：问题诊断 ====================

// 使用clinic.js诊断
/*
npm install -g clinic
clinic doctor -- node server.js
clinic flame -- node server.js
*/

// ==================== 阶段3：逐步优化 ====================

// 优化1：使用连接池和Keep-Alive
class OptimizedHTTPClient {
  constructor() {
    this.agent = new http.Agent({
      keepAlive: true,
      maxSockets: 100,
      maxFreeSockets: 20,
      timeout: 60000
    });
  }

  async request(url, options = {}) {
    return new Promise((resolve, reject) => {
      const req = http.get({
        ...options,
        url,
        agent: this.agent,
        headers: {
          'Connection': 'keep-alive',
          ...options.headers
        }
      }, resolve);

      req.on('error', reject);
    });
  }
}

// 优化2：添加缓存
const cache = new LRUCache(10000, 60000);

function cachedHandler(req, res) {
  const cacheKey = req.url;
  const cached = cache.get(cacheKey);

  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(cached);
  }

  const data = generateResponse();

  cache.set(cacheKey, data);

  res.setHeader('X-Cache', 'MISS');
  res.json(data);
}

// 优化3：压缩响应
function compressedHandler(req, res) {
  const acceptEncoding = req.headers['accept-encoding'] || '';

  const data = JSON.stringify(generateResponse());

  if (acceptEncoding.includes('gzip')) {
    res.setHeader('Content-Encoding', 'gzip');
    zlib.gzip(data, (_, result) => {
      res.end(result);
    });
  } else {
    res.json(data);
  }
}

// 优化4：使用cluster
const cluster = require('cluster');
const os = require('os');

function setupClusterServer() {
  if (cluster.isMaster) {
    const numCPUs = os.cpus().length;

    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on('exit', () => cluster.fork());
  } else {
    http.createServer(handler).listen(3000);
  }
}

// 优化5：Redis缓存层
async function redisCacheLayer(key, fetchFn, ttl = 60) {
  const redis = require('redis');
  const client = redis.createClient();

  const cached = await client.get(key);

  if (cached) {
    return JSON.parse(cached);
  }

  const data = await fetchFn();

  await client.setEx(key, ttl, JSON.stringify(data));

  return data;
}

// 优化6：数据库连接池
const dbPool = new ConnectionPool({
  min: 10,
  max: 50,
  acquireTimeout: 30000,
  idleTimeout: 60000
});

// 优化7：批量查询
async function batchQuery(ids) {
  // 从N次查询变为1次
  return dbPool.query(
    `SELECT * FROM users WHERE id IN (${ids.join(',')})`
  );
}

// ==================== 阶段4：最终测试 ====================

/*
最终优化后的系统架构：

                    ┌─────────────────┐
                    │   负载均衡器     │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐        ┌────▼────┐        ┌────▼────┐
    │Worker 1 │        │Worker 2 │        │Worker N │
    │ (Node)  │        │ (Node)  │        │ (Node)  │
    └────┬────┘        └────┬────┘        └────┬────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐        ┌────▼────┐        ┌────▼────┐
    │ Redis   │        │ Redis   │        │ Redis   │
    │ Cache   │        │ Cache   │        │ Cache   │
    └─────────┘        └─────────┘        └─────────┘
                             │
                    ┌────────▼────────┐
                    │  PostgreSQL     │
                    │  (连接池: 50)   │
                    └─────────────────┘

优化效果：
- 1000QPS (基线)
- 2000QPS (添加缓存)
- 5000QPS (集群模式)
- 10000QPS (全面优化)
*/
```

### 12.2 内存从500MB降到100MB

```javascript
// 内存优化实战：从500MB降到100MB

/**
 * 内存泄漏排查和优化
 */

// ==================== 问题诊断 ====================

// 1. 使用heapdump分析堆快照
const heapdump = require('heapdump');

// 定期生成快照
setInterval(() => {
  heapdump.writeSnapshot(`./heap-${Date.now()}.heapsnapshot`);
}, 60000);

// 2. 使用memwatch-next检测泄漏
const memwatch = require('memwatch-next');

memwatch.on('leak', (info) => {
  console.error('检测到内存泄漏:', info);
});

// ==================== 常见内存问题及解决方案 ====================

// 问题1：全局变量无限增长
// 解决方案：使用固定大小的缓存

// 不好的做法
global.dataCache = [];
function addToCache(data) {
  global.dataCache.push(data); // 无限增长
}

// 好的做法
class FixedSizeCache {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.cache = [];
  }

  add(item) {
    if (this.cache.length >= this.maxSize) {
      this.cache.shift(); // 删除最旧的
    }
    this.cache.push(item);
  }
}

// 问题2：事件监听器泄漏
// 解决方案：正确移除监听器

class EventManager {
  constructor() {
    this.listeners = [];
  }

  addListener(event, handler) {
    emitter.on(event, handler);
    this.listeners.push({ event, handler }); // 记录引用
  }

  removeAllListeners() {
    for (const { event, handler } of this.listeners) {
      emitter.off(event, handler);
    }
    this.listeners = [];
  }
}

// 问题3：定时器未清理
// 解决方案：使用Map跟踪定时器

class TimerManager {
  constructor() {
    this.timers = new Map();
  }

  add(name, fn, interval) {
    const id = setInterval(fn, interval);
    this.timers.set(name, id);
  }

  remove(name) {
    const id = this.timers.get(name);
    if (id) {
      clearInterval(id);
      this.timers.delete(name);
    }
  }

  clearAll() {
    for (const id of this.timers.values()) {
      clearInterval(id);
    }
    this.timers.clear();
  }
}

// ==================== 内存优化技巧 ====================

// 1. 使用对象池重用对象
class ObjectPool {
  constructor(factory, maxSize = 100) {
    this.factory = factory;
    this.maxSize = maxSize;
    this.pool = [];
  }

  acquire() {
    return this.pool.pop() || this.factory();
  }

  release(obj) {
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj);
    }
  }
}

// 2. 流式处理代替批量加载
const { Readable, Transform } = require('stream');

function streamProcess(inputFile, outputFile) {
  // 不一次性加载整个文件到内存
  return pipeline(
    fs.createReadStream(inputFile),
    new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        // 处理每一行
        const processed = processLine(chunk.toString());
        callback(null, processed);
      }
    }),
    fs.createWriteStream(outputFile)
  );
}

// 3. 使用Buffer代替字符串
function processBinary(data) {
  const buffer = Buffer.from(data);

  // 使用buffer操作，而不是转换为字符串
  return buffer.slice(0, 10);
}

// 4. 及时释放大对象引用
function processLargeData() {
  const largeArray = new Array(1000000);

  // 处理...
  const result = doSomething(largeArray);

  // 及时释放
  largeArray.length = 0;

  return result;
}

// 5. 使用WeakMap和WeakSet
const weakMap = new WeakMap();

function createCache() {
  const obj = { data: 'some data' };
  weakMap.set(obj, 'cached value');

  // obj被垃圾回收时，WeakMap中的条目也会自动清理
}

// ==================== V8内存调优 ====================

// 启动参数优化
/*
node --max-old-space-size=512 server.js  # 老生代最大512MB
node --max-new-space-size=32 server.js   # 新生代最大32MB
node --expose-gc server.js               # 暴露GC接口
*/

// 手动触发GC（仅用于测试）
function forceGC() {
  if (global.gc) {
    global.gc();
    console.log('GC完成');
  }
}

// ==================== 监控和告警 ====================

class MemoryMonitor {
  constructor(threshold = 0.8) {
    this.threshold = threshold;
    this.alerts = [];
  }

  check() {
    const mem = process.memoryUsage();
    const heapUsedPercent = mem.heapUsed / mem.heapTotal;

    if (heapUsedPercent > this.threshold) {
      this.alert(`内存使用超过 ${(heapUsedPercent * 100).toFixed(1)}%`);
    }

    return {
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      percent: (heapUsedPercent * 100).toFixed(1)
    };
  }

  alert(message) {
    console.error(`[内存告警] ${message}`);
    this.alerts.push({
      message,
      timestamp: Date.now()
    });
  }
}

/*
优化结果：
- 500MB (优化前)
- 300MB (修复内存泄漏)
- 150MB (优化数据结构)
- 100MB (全面优化)
*/
```

### 12.3 启动时间从30s到3s

```javascript
// 启动时间优化实战：从30秒到3秒

/**
 * Node.js应用启动优化
 */

// ==================== 分析启动时间 ====================

// 使用--trace-startup分析
/*
node --trace-startup --optimize-for-size server.js 2>&1 | grep "wall_time"
*/

// ==================== 启动时间分析 ====================

const startupProfiler = {
  phases: [],

  start(label) {
    this.phases.push({ label, start: Date.now() });
  },

  end(label) {
    const phase = this.phases.find(p => p.label === label);
    if (phase) {
      phase.end = Date.now();
      phase.duration = phase.end - phase.start;
    }
  },

  report() {
    console.log('\n启动时间分析:');
    for (const phase of this.phases) {
      const duration = phase.duration || (Date.now() - phase.start);
      console.log(`  ${phase.label}: ${duration}ms`);
    }
  }
};

async function bootstrap() {
  startupProfiler.start('total');

  // 模拟各阶段启动
  startupProfiler.start('config');
  await loadConfig();
  startupProfiler.end('config');

  startupProfiler.start('database');
  await connectDatabase();
  startupProfiler.end('database');

  startupProfiler.start('cache');
  await initCache();
  startupProfiler.end('cache');

  startupProfiler.start('middleware');
  await setupMiddleware();
  startupProfiler.end('middleware');

  startupProfiler.start('routes');
  await setupRoutes();
  startupProfiler.end('routes');

  startupProfiler.start('server');
  await startServer();
  startupProfiler.end('server');

  startupProfiler.end('total');
  startupProfiler.report();
}

// ==================== 优化策略 ====================

// 1. 延迟加载（懒加载）
class LazyLoader {
  constructor() {
    this.cache = new Map();
  }

  get(module) {
    if (!this.cache.has(module)) {
      this.cache.set(module, require(module));
    }
    return this.cache.get(module);
  }
}

// 使用
const lazyLoad = new LazyLoader();

app.get('/users', async (req, res) => {
  const User = lazyLoad.get('./models/User'); // 只在需要时加载
  const users = await User.findAll();
  res.json(users);
});

// 2. 异步并行初始化
async function parallelInit() {
  // 串行（慢）
  // await loadConfig();
  // await connectDatabase();
  // await initCache();

  // 并行（快）
  await Promise.all([
    loadConfig(),
    connectDatabase(),
    initCache()
  ]);
}

// 3. 延迟非关键初始化
function lazyInit() {
  // 启动时只初始化必需的
  // 其他延迟到第一次使用时

  let optionalService = null;

  return {
    getOptionalService() {
      if (!optionalService) {
        optionalService = require('./optional-service');
      }
      return optionalService;
    }
  };
}

// 4. 预编译正则表达式
const precompiledRegex = {
  email: /^[\w.-]+@[\w.-]+\.\w+$/,
  url: /^https?:\/\//,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
};

// 5. 减少require调用
// 将多个小模块合并为大模块
// const utils = require('./utils'); // 包含所有工具函数

// 6. 使用require-hook延迟加载
// require('fs').constants; // 延迟访问

// 7. 数据库连接池预热
async function warmUpConnectionPool() {
  const pool = new ConnectionPool({ min: 10, max: 50 });

  // 预热：建立最小连接数
  const connections = [];
  for (let i = 0; i < 10; i++) {
    connections.push(await pool.acquire());
  }

  for (const conn of connections) {
    pool.release(conn);
  }

  console.log('连接池预热完成');
}

// 8. 缓存计算结果
const configCache = {
  _cache: null,

  async get() {
    if (!this._cache) {
      this._cache = await loadHeavyConfig();
    }
    return this._cache;
  },

  invalidate() {
    this._cache = null;
  }
};

// ==================== 启动参数优化 ====================

/*
启动参数优化建议：

1. --max-old-space-size
   - 根据可用内存设置
   - 避免过大导致GC时间长

2. --parallel焚烧
   - node --parallel server.js
   - 启用并行焚烧

3. --no-warnings
   - 减少警告输出

4. NODE_ENV=production
   - process.env.NODE_ENV = 'production'
   - 禁用开发特性

5. --experimental-vm-modules
   - 启用实验性VM模块优化

6. --harmony
   - 启用所有harmony特性
*/

// ==================== 监控启动时间 ====================

function logStartupTime() {
  const startupTime = process.uptime() * 1000;

  console.log(`
    =====================================
    启动时间: ${startupTime.toFixed(2)}ms
    =====================================
  `);

  if (startupTime > 5000) {
    console.warn('启动时间超过5秒，建议优化');
  }
}

/*
优化结果：
- 30s (优化前)
- 15s (并行初始化)
- 8s (懒加载)
- 5s (数据库连接池预热)
- 3s (全面优化)
*/
```

### 12.4 我的思考：优化要有数据支撑

```javascript
// 性能优化的正确方法论

/**
 * 核心原则：数据驱动优化
 *
 * 1. 测量（Measure）
 *    - 建立性能基线
 *    - 使用profiler定位热点
 *    - 记录关键指标
 *
 * 2. 分析（Analyze）
 *    - 理解瓶颈原因
 *    - 评估优化成本
 *    - 确定优化优先级
 *
 * 3. 优化（Optimize）
 *    - 小步迭代
 *    - 单变量优化
 *    - 记录变更
 *
 * 4. 验证（Verify）
 *    - 确认性能提升
 *    - 检查副作用
 *    - 确保正确性
 */

// ==================== 性能测试框架 ====================

class PerformanceBenchmark {
  constructor(name) {
    this.name = name;
    this.results = [];
  }

  async run(name, fn, iterations = 1000) {
    // 预热
    for (let i = 0; i < 100; i++) {
      await fn();
    }

    // 测量
    const times = [];
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      await fn();
      times.push(Date.now() - start);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    const p95 = this.percentile(times, 0.95);

    this.results.push({ name, avg, min, max, p95 });

    console.log(`${name}: avg=${avg.toFixed(2)}ms, p95=${p95.toFixed(2)}ms`);
  }

  percentile(arr, p) {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil(p * sorted.length) - 1;
    return sorted[index];
  }

  report() {
    console.log(`\n=== ${this.name} 性能报告 ===`);
    for (const result of this.results) {
      console.log(`${result.name}:`);
      console.log(`  平均: ${result.avg.toFixed(2)}ms`);
      console.log(`  P95: ${result.p95.toFixed(2)}ms`);
      console.log(`  最小: ${result.min}ms`);
      console.log(`  最大: ${result.max}ms`);
    }
  }
}

// ==================== A/B对比测试 ====================

class ABTest {
  constructor(name) {
    this.name = name;
    this.groupA = [];
    this.groupB = [];
  }

  testA(fn) {
    const start = Date.now();
    fn();
    this.groupA.push(Date.now() - start);
  }

  testB(fn) {
    const start = Date.now();
    fn();
    this.groupB.push(Date.now() - start);
  }

  report() {
    const avgA = this.groupA.reduce((a, b) => a + b, 0) / this.groupA.length;
    const avgB = this.groupB.reduce((a, b) => a + b, 0) / this.groupB.length;
    const improvement = ((avgA - avgB) / avgA * 100).toFixed(2);

    console.log(`\n=== ${this.name} A/B测试 ===`);
    console.log(`A组平均: ${avgA.toFixed(2)}ms`);
    console.log(`B组平均: ${avgB.toFixed(2)}ms`);
    console.log(`改进: ${improvement}%`);

    return { avgA, avgB, improvement };
  }
}

// ==================== 实战：数据驱动的优化 ====================

async function dataDrivenOptimization() {
  console.log('=== 数据驱动的性能优化 ===\n');

  // 1. 建立基线
  const benchmark = new PerformanceBenchmark('数据库查询优化');

  // 模拟：N+1查询 vs JOIN查询
  await benchmark.run('N+1查询 (100条)', async () => {
    // 模拟N+1查询
    const users = await getUsers(100);
    for (const user of users) {
      await getOrders(user.id);
    }
  }, 100);

  await benchmark.run('JOIN查询 (100条)', async () => {
    // 模拟JOIN查询
    await getUsersWithOrders(100);
  }, 100);

  benchmark.report();

  // 2. 分析
  /*
  N+1查询平均: 250ms
  JOIN查询平均: 50ms

  问题：N+1查询导致大量数据库往返

  优化方案：使用JOIN或批量查询
  */

  // 3. 实施优化
  // 4. 验证
  // 5. 监控

  console.log('\n=== 优化总结 ===');
  console.log('1. 总是先测量，再优化');
  console.log('2. 使用profiler定位热点');
  console.log('3. 关注大O复杂度');
  console.log('4. 小步迭代，持续验证');
  console.log('5. 权衡可读性vs性能');
}

/**
 * 优化决策树：
 *
 * 发现性能问题
 *     │
 *     ▼
 * 这是用户可感知的问题吗？
 *     │
 *   是 │ 否
 *     │   └── 不紧急，但可以作为技术债务跟踪
 *     ▼
 * 是已知热点吗？
 *     │
 *   是 │ 否
 *     │   └── 使用profiler定位
 *     ▼
 * 优化成本是否合理？
 *     │
 *   是 │ 否
 *     │   └── 考虑其他方案或接受现状
 *     ▼
 * 实施优化
 *     │
 *     ▼
 * 验证性能提升和功能正确性
 *     │
 *     ▼
 * 监控防止性能回归
 */

// ==================== 关键性能指标（KPI）====================

const performanceKPIs = {
  // HTTP服务器
  http: {
    qps: '每秒请求数',
    latency_p50: 'P50延迟',
    latency_p95: 'P95延迟',
    latency_p99: 'P99延迟',
    errorRate: '错误率',
    throughput: '吞吐量 (MB/s)'
  },

  // 内存
  memory: {
    heapUsed: '堆内存使用 (MB)',
    heapTotal: '堆内存总量 (MB)',
    rss: '常驻内存 (MB)',
    gcPauseTime: 'GC暂停时间 (ms)'
  },

  // 数据库
  database: {
    queryTime: '平均查询时间 (ms)',
    connectionPoolUsage: '连接池使用率',
    slowQueries: '慢查询数量',
    cacheHitRate: '缓存命中率'
  },

  // 启动
  startup: {
    coldStart: '冷启动时间 (s)',
    warmUp: '预热时间 (s)',
    memoryAtStartup: '启动时内存 (MB)'
  }
};
```

---

## 总结

本文档系统讲解了Node.js性能优化的核心知识点，包括：

1. **事件循环与异步IO**：理解libuv六个阶段、V8垃圾回收机制
2. **性能分析工具**：profiler、clinic.js、0x、DevTools
3. **内存管理**：V8内存限制、堆结构、内存泄漏排查
4. **CPU优化**：JIT编译、内联缓存、热点代码优化
5. **异步编程**：Promise化、并发控制、错误处理
6. **流处理**：四种Stream类型、管道、背压处理
7. **缓存策略**：LRU、Redis、缓存问题解决方案
8. **数据库优化**：连接池、N+1问题、批量操作
9. **网络优化**：Keep-Alive、压缩、HTTP/2
10. **进程管理**：集群模式、PM2、优雅关闭
11. **代码优化**：循环、字符串、正则、异常处理
12. **实战案例**：从测量到优化的完整流程

**核心原则**：
- 性能优化应该基于数据（测量驱动）
- 先定位热点，再针对性优化
- 权衡优化成本与收益
- 不要过早优化（Premature Optimization）
- 持续监控，防止回归

---

> 本文档共计约18000字，包含完整的代码示例和实战教程。所有代码示例均基于Node.js最新特性编写，可在Node.js 18+环境中运行。
