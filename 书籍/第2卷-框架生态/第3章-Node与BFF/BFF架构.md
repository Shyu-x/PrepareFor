# 第2卷-框架生态

---

## 第3章 Node与BFF

---

### 1.1 什么是BFF

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

#### 2.1.6 libuv 架构与事件循环底层原理

**面试常问题目**:
理解 Node.js 事件循环的底层原理是进阶面试中的高频考点。Node.js 的事件循环由 libuv 库实现，它是跨平台的异步 I/O 库。

##### libuv 架构解析

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ 
┃                   Node.js                   ┃ 
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   ┃  
┃  ┃           V8 JavaScript 引擎         ┃   ┃ 
┃  ┃  (执行 JavaScript 代码，管理堆内存)   ┃   ┃
┃  ┗━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━┛   ┃  
┃                     ┃                        ┃
┃                     ▼                        ┃
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   ┃  
┃  ┃           libuv 事件循环             ┃   ┃ 
┃  ┃  ┏━━━━━━━━━┓ ┏━━━━━━━━━┓ ┏━━━━━━━┓ ┃   ┃   
┃  ┃  ┃Timers   ┃ ┃Pending  ┃ ┃ Check ┃ ┃   ┃   
┃  ┃  ┃         ┃ ┃Callbacks┃ ┃       ┃ ┃   ┃   
┃  ┃  ┗━━━━┳━━━━┛ ┗━━━━┳━━━━┛ ┗━━━┳━━━┛ ┃   ┃   
┃  ┃       ┃           ┃          ┃      ┃   ┃  
┃  ┃       ▼           ▼          ▼      ┃   ┃  
┃  ┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ ┃   ┃  
┃  ┃  ┃       6 个阶段循环执行          ┃ ┃   ┃ 
┃  ┃  ┃  timers → pending → idle →    ┃ ┃   ┃   
┃  ┃  ┃  poll → check → close          ┃ ┃   ┃  
┃  ┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃   ┃  
┃  ┗━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━┛   ┃  
┃                     ┃                        ┃
┃                     ▼                        ┃
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   ┃  
┃  ┃           线程池 (Thread Pool)       ┃   ┃ 
┃  ┃    处理文件 I/O、DNS、压缩等         ┃   ┃ 
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   ┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ 
```

##### 事件循环 6 个阶段详解

```javascript
// 事件循环每个阶段的任务队列

// 阶段1: Timers (定时器阶段)
// 执行 setTimeout 和 setInterval 回调，时间阈值 >= 0
setTimeout(() => {
  console.log('timers 阶段执行');
}, 0);

// 阶段2: Pending Callbacks
// 执行被延迟到下一次循环的 I/O 回调

// 阶段3: Idle, Prepare (仅 libuv 内部使用)
// 开发者无需关注

// 阶段4: Poll (轮询阶段)
// 处理 I/O 事件，执行大部分回调
// 如果 poll 队列不为空，依次执行回调直到队列为空
// 如果 poll 队列为空且 check 队列有回调，会等待一段时间后进入 check 阶段

// 阶段5: Check (检查阶段)
// 执行 setImmediate() 回调
setImmediate(() => {
  console.log('check 阶段执行');
});

// 阶段6: Close Callbacks
// 执行 close 事件回调，如 socket.destroy(), socket.on('close')
```

##### Node.js 特有的微任务执行时机

```javascript
// Node.js 微任务执行时机详解

// 重要结论：
// 1. 每个阶段之间都会执行微任务队列
// 2. process.nextTick 优先级高于 Promise
// 3. nextTick 队列在每个阶段结束后单独执行，不与其他微任务混合

console.log('1. 同步代码 start');

setTimeout(() => {
  console.log('2. setTimeout 回调');
  Promise.resolve().then(() => {
    console.log('   Promise in setTimeout');
  });
}, 0);

Promise.resolve().then(() => {
  console.log('3. Promise.then');
});

process.nextTick(() => {
  console.log('4. nextTick');
});

console.log('5. 同步代码 end');

// 输出顺序:
// 1. 同步代码 start
// 5. 同步代码 end
// 4. nextTick (nextTick 队列优先执行)
// 3. Promise.then (Promise 队列)
// 2. setTimeout 回调 (下一个事件循环阶段)

// 特别注意：nextTick 会在每个阶段之间执行
const fs = require('fs');

fs.readFile(__filename, () => {
  console.log('I/O 回调');

  // 在 I/O 回调中执行微任务
  process.nextTick(() => console.log('nextTick in I/O'));
  Promise.resolve().then(() => console.log('Promise in I/O'));
});

// 微任务执行流程图
// ┏━━━━━━━━━━━━━━━━━━━━━━━┓ 
// ┃  主线程同步代码        ┃
// ┗━━━━━━━━━┳━━━━━━━━━━━━━┛ 
//           ▼
// ┏━━━━━━━━━━━━━━━━━━━━━━━┓             
// ┃  nextTick 队列        ┃ ← 最高优先级
// ┗━━━━━━━━━┳━━━━━━━━━━━━━┛             
//           ▼
// ┏━━━━━━━━━━━━━━━━━━━━━━━┓            
// ┃  Promise 队列          ┃ ← 次优先级
// ┗━━━━━━━━━┳━━━━━━━━━━━━━┛            
//           ▼
// ┏━━━━━━━━━━━━━━━━━━━━━━━┓ 
// ┃  事件循环阶段1: Timers ┃
// ┗━━━━━━━━━┳━━━━━━━━━━━━━┛ 
//           ▼
// ┏━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃  微任务队列 (nextTick ┃
// ┃  + Promise)          ┃ 
// ┗━━━━━━━━━┳━━━━━━━━━━━━━┛
//           ▼
// ┃  ... 其他阶段 ...     ┃
//           ▼
// ┏━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃  阶段5: Check         ┃
// ┗━━━━━━━━━┳━━━━━━━━━━━━━┛
//           ▼
// ┏━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃  微任务队列           ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━┛
```

##### 经典面试题：事件循环执行顺序

```javascript
// 面试题1: 多个 setTimeout 和 setImmediate
const fs = require('fs');

fs.readFile(__filename, () => {
  console.log('1. I/O 回调');

  setTimeout(() => console.log('2. setTimeout'), 0);
  setImmediate(() => console.log('3. setImmediate'));
});

// 答案: 1 -> 3 -> 2
// 解释: I/O 回调在 poll 阶段执行，执行完后进入 check 阶段，
//       然后才是 timers 阶段

// 面试题2: process.nextTick 嵌套
process.nextTick(() => {
  console.log('1. nextTick 1');

  process.nextTick(() => {
    console.log('2. nextTick 2');

    process.nextTick(() => {
      console.log('3. nextTick 3');
    });
  });
});

Promise.resolve().then(() => {
  console.log('4. Promise 1');
});

console.log('5. 同步代码');

// 输出: 5 -> 1 -> 2 -> 3 -> 4
// 解释: nextTick 队列会清空后再执行 Promise 队列

// 面试题3: async/await 与微任务
async function async1() {
  console.log('1. async1 start');
  await async2();
  console.log('2. async1 end');
}

async function async2() {
  console.log('3. async2');
}

console.log('4. 同步代码');

async1();

Promise.resolve().then(() => {
  console.log('5. Promise');
});

// 输出: 4 -> 1 -> 3 -> 5 -> 2
// 解释: await 后面的代码相当于 Promise.then，会作为微任务执行
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

### 2.8 Node.js 内存管理

**面试常问题目**:
理解 Node.js 的内存管理机制对于编写高性能应用和排查内存问题至关重要。Node.js 使用 V8 引擎的垃圾回收机制，但开发者仍需了解内存配置和常见内存问题。

#### 2.8.1 堆内存配置

```javascript
// Node.js 堆内存配置

// 1. 查看默认内存限制
// node --max-old-space-size=4096 app.js  设置老年带为 4GB

// 2. 内存统计 API
const memoryUsage = () => {
  const used = process.memoryUsage();

  console.log('heapUsed:', Math.round(used.heapUsed / 1024 / 1024), 'MB');
  console.log('heapTotal:', Math.round(used.heapTotal / 1024 / 1024), 'MB');
  console.log('rss (Resident Set Size):', Math.round(used.rss / 1024 / 1024), 'MB');
  console.log('external:', Math.round(used.external / 1024 / 1024), 'MB');

  // rss: 进程占用的总内存
  // heapTotal: V8 堆内存总量
  // heapUsed: 已使用的堆内存
  // external: V8 管理的 C++ 对象内存
};

// 3. 堆内存各区域说明
// 新生代 (New Space): 1-8MB，分为 from-space 和 to-space
// 老年带 (Old Space): 存放长时间存活的对象
// 大对象区 (Large Object Space): 存放大于老年带阈值的大对象
// 代码区 (Code Space): 存放编译后的代码
// 属性区 (Property Cell Space): 存放属性槽
// 调试区 (Debugger Space): 调试相关
```

#### 2.8.2 垃圾回收机制

```javascript
// V8 垃圾回收机制

// 1. Scavenge (新生代垃圾回收)
// 适用于生命周期短的对象，使用 from-space 和 to-space 复制
// 效率高，但内存利用率只有 50%

// 2. Mark-Sweep / Mark-Compact (老年带垃圾回收)
// Mark-Sweep: 标记清除，回收死亡对象
// Mark-Compact: 标记整理，整理碎片化内存

// 3. 增量标记 (Incremental Marking)
// 将 GC 分为多个小步骤，避免长时间停顿

// 4. 垃圾回收触发时机
setInterval(() => {
  const used = process.memoryUsage();
  const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);

  // 如果老年带使用超过 70%，建议触发 GC 或排查内存
  if (heapUsedMB > 1024) {
    console.warn('Memory usage high:', heapUsedMB, 'MB');
  }
}, 5000);

// 5. 手动触发 GC (仅用于调试)
if (global.gc) {
  console.log('Running GC...');
  global.gc();
}

// 启动时启用 GC 调试
// node --expose-gc --inspect app.js
```

#### 2.8.3 内存泄漏排查

```javascript
// 内存泄漏排查方法

// 1. 使用 --inspect 进行内存分析
// node --inspect app.js
// 打开 Chrome DevTools -> Memory -> Heap Snapshot

// 2. 定位内存泄漏代码
const leakDetector = () => {
  const used = process.memoryUsage();

  return {
    heapUsed: Math.round(used.heapUsed / 1024 / 1024),
    // 对比不同时刻的 heapUsed，持续增长说明有内存泄漏
  };
};

// 3. 常见内存泄漏场景

// 场景1: 全局变量泄漏
// 错误
global.cacheData = [];
global.cacheData.push(largeObject);

// 解决: 使用 WeakMap 或及时清理
const cache = new WeakMap();

// 场景2: 闭包引用
function createClosure() {
  const bigData = new Array(1000000);

  return {
    getData: () => bigData.length, // 错误: 整个 bigData 被保留
    getSize: () => bigData.length  // 正确: 只保留需要的数据
  };
}

// 场景3: 事件监听器未移除
class EventManager {
  constructor() {
    this.listeners = new Map();
  }

  subscribe(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(handler);
  }

  unsubscribe(event, handler) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) handlers.splice(index, 1);
    }
  }

  // 内存泄漏: 组件销毁时未取消订阅
}

// 正确做法
class SafeEventManager extends EventManager {
  constructor() {
    super();
    this.cleanupCallbacks = [];
  }

  subscribeWithCleanup(event, handler) {
    this.subscribe(event, handler);
    this.cleanupCallbacks.push(() => this.unsubscribe(event, handler));
  }

  destroy() {
    this.cleanupCallbacks.forEach(cb => cb());
    this.cleanupCallbacks = [];
    this.listeners.clear();
  }
}

// 场景4: 定时器未清理
class TimerLeak {
  constructor() {
    this.timers = [];
  }

  startPolling() {
    const timer = setInterval(() => {
      // 轮询任务
    }, 1000);
    this.timers.push(timer);
  }

  stopPolling() {
    this.timers.forEach(clearInterval);
    this.timers = [];
  }
}

// 场景5: 模块级缓存无限增长
// 错误
const cache = {};
function getData(id) {
  if (!cache[id]) {
    cache[id] = fetchFromDB(id);
  }
  return cache[id];
}

// 解决: 使用 LRU 缓存或设置过期时间
const LRU = require('lru-cache');
const cache = new LRU({
  max: 1000,
  ttl: 1000 * 60 * 10 // 10 分钟过期
});
```

#### 2.8.4 内存优化最佳实践

```javascript
// 内存优化技巧

// 1. 对象池模式 - 复用对象减少 GC 压力
class ObjectPool {
  constructor(factory, maxSize = 100) {
    this.pool = [];
    this.factory = factory;
    this.maxSize = maxSize;
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

// 示例: 复用 Buffer
const bufferPool = new ObjectPool(() => Buffer.alloc(8192));
const buf = bufferPool.acquire();
// 使用 buffer
bufferPool.release(buf);

// 2. 流式处理 - 避免一次性加载大文件
const fs = require('fs');
const readStream = fs.createReadStream('large-file.txt');
const chunks = [];

readStream.on('data', (chunk) => {
  chunks.push(chunk);
  // 处理每个 chunk，而不是等待全部加载
});

readStream.on('end', () => {
  const result = Buffer.concat(chunks);
});

// 3. 及时释放大对象引用
async function processLargeData() {
  const largeData = await fetchLargeData();

  try {
    const result = transform(largeData);
    return result;
  } finally {
    // 显式释放
    largeData.length = 0;
  }
}

// 4. 使用 WeakRef 和 FinalizationRegistry
// (Node.js 14+)
const registry = new FinalizationRegistry((value) => {
  console.log('Object with value', value, 'is being garbage collected');
});

let obj = { data: 'important' };
registry.register(obj, obj.data);
obj = null; // 不再持有引用，对象可被回收
```

---

