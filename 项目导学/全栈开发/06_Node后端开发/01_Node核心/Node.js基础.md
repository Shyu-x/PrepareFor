# Node.js 基础

## 目录

1. [Node.js 架构与原理](#1-nodejs-架构与原理)
2. [事件循环深入理解](#2-事件循环深入理解)
3. [异步编程模式](#3-异步编程模式)
4. [Buffer 与 Stream](#4-buffer-与-stream)
5. [模块系统](#5-模块系统)

---

## 1. Node.js 架构与原理

### 1.1 Node.js 是什么？

Node.js 是一个基于 Chrome V8 引擎的 JavaScript 运行时环境，它让 JavaScript 可以在服务器端运行。Node.js 采用非阻塞 I/O 模型，使其在处理高并发请求时表现出色。

**Node.js 核心特性：**

- **事件驱动**：采用事件循环机制处理异步操作
- **非阻塞 I/O**：不等待 I/O 操作完成，继续执行后续代码
- **单线程**：使用单线程处理请求，减少线程创建和上下文切换的开销
- **跨平台**：可以在 Windows、Linux、macOS 等操作系统运行

### 1.2 Node.js 架构分层

```
┌─────────────────────────────────────────────┐
│              应用层 (Application)             │
│         JavaScript 代码、npm 包               │
├─────────────────────────────────────────────┤
│           Node.js 运行时层 (Runtime)          │
│    模块系统、事件循环、异步 I/O、缓冲区         │
├─────────────────────────────────────────────┤
│           V8 JavaScript 引擎                   │
│     执行 JavaScript 代码、内存管理、 JIT       │
├─────────────────────────────────────────────┤
│          Node.js C++ 绑定层 (Bindings)       │
│       libuv、系统调用、底层功能封装             │
├─────────────────────────────────────────────┤
│            操作系统层 (OS)                     │
│        网络、文件系统、进程管理、内存            │
└─────────────────────────────────────────────┘
```

### 1.3 核心组件详解

#### 1.3.1 V8 引擎

V8 是 Google 开发的 JavaScript 引擎，使用 JIT（Just-In-Time）编译技术，将 JavaScript 代码直接编译为机器码执行，极大提升了执行性能。

**V8 核心机制：**

```javascript
// JIT 编译优化示例
// V8 会在运行时分析代码热点并进行优化

// 第一次执行：解释执行
function add(a, b) {
  return a + b;
}

// 多次调用后，V8 会将这个函数编译为机器码
// 下次调用时直接执行机器码，性能大幅提升
for (let i = 0; i < 10000; i++) {
  add(1, 2);
}
```

#### 1.3.2 libuv

libuv 是一个跨平台的异步 I/O 库，负责处理操作系统的底层异步操作，包括文件 I/O、网络请求、定时器等。

**libuv 的核心功能：**

```javascript
// libuv 通过事件循环处理各种异步操作

// 1. 文件异步读取
const fs = require('fs');
fs.readFile('./data.txt', 'utf8', (err, data) => {
  if (err) throw err;
  console.log('文件内容:', data);
});

// 2. 网络请求
const http = require('http');
http.get('http://example.com', (res) => {
  console.log('状态码:', res.statusCode);
});

// 3. 定时器
setTimeout(() => {
  console.log('1秒后执行');
}, 1000);
```

### 1.4 全局对象

Node.js 提供了多个全局对象，可以在任何地方直接使用。

#### 1.4.1 process 对象

process 对象提供当前 Node.js 进程的信息和控制能力。

```javascript
// 1. 获取进程信息
console.log('当前工作目录:', process.cwd());           // /Users/xxx/project
console.log('Node.js 版本:', process.version);        // v20.10.0
console.log('平台信息:', process.platform);            // win32 / darwin / linux
console.log('进程 ID:', process.pid);                // 12345
console.log('内存使用:', process.memoryUsage());      // 内存使用情况

// 2. 环境变量
console.log('环境变量:', process.env.NODE_ENV);       // development / production
console.log('所有环境变量:', process.env);

// 3. 进程事件
process.on('exit', (code) => {
  console.log('进程即将退出，退出码:', code);
});

process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  process.exit(1);
});

// 4. 进程控制
// process.exit(0);  // 正常退出
// process.exit(1);  // 异常退出
// process.kill(pid, 'SIGTERM');  // 发送信号
```

#### 1.4.2 console 对象

console 对象提供控制台输出功能。

```javascript
// 1. 基础输出
console.log('普通信息');
console.info('提示信息');
console.warn('警告信息');
console.error('错误信息');

// 2. 格式化输出
console.log('用户名: %s, 年龄: %d', '张三', 25);
console.log('对象: %o', { name: '张三' });
console.log('JSON: %j', { name: '张三' });

// 3. 计时功能
console.time('forLoop');
for (let i = 0; i < 1000000; i++) {}
console.timeEnd('forLoop');  // forLoop: 5.123ms

// 4. 断言
console.assert(true, '条件为 true 时不输出');
console.assert(false, '条件为 false 时输出这条消息');

// 5. 堆栈跟踪
console.trace('打印当前堆栈');
```

#### 1.4.3 全局函数

```javascript
// 1. 定时器函数
setTimeout(() => {}, 1000);      // 延迟执行
setInterval(() => {}, 1000);      // 周期性执行
setImmediate(() => {});           // 立即执行（I/O 回调后）
process.nextTick(() => {});       // 立即执行（当前操作完成后）

// 2. 对象操作
Object.keys(obj);                 // 获取对象键名
Object.values(obj);               // 获取对象值
Object.entries(obj);              // 获取键值对

// 3. JavaScript 常用全局函数
JSON.parse(str);                  // JSON 解析
JSON.stringify(obj);              // JSON 序列化
isNaN(value);                     // 判断是否为 NaN
isFinite(value);                  // 判断是否为有限数
eval(code);                       // 执行代码（谨慎使用）
```

---

## 2. 事件循环深入理解

### 2.1 什么是事件循环？

事件循环是 Node.js 异步编程的核心机制，它负责协调和处理各种异步操作的执行顺序。理解事件循环对于编写高效的 Node.js 应用至关重要。

### 2.2 事件循环的工作原理

```
┌───────────────────────────────────────────────────────────┐
│                        事件循环                             │
│                                                            │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐  │
│  │  定时器  │──▶│  待处理  │──▶│  回调    │──▶│  关闭    │  │
│  │ (Timers)│   │ (Pending)│   │ (Poll)   │  │ (Close)  │  │
│  └────┬────┘   └────┬────┘   └────┬────┘   └─────────┘  │
│       │              │              │                       │
│       │              │              │                       │
│       ▼              ▼              ▼                       │
│  ┌─────────────────────────────────────────────────┐       │
│  │              检查阶段 (Check)                     │       │
│  │         setImmediate 回调在这里执行               │       │
│  └─────────────────────────────────────────────────┘       │
│       │              │              │                       │
│       │              │              │                       │
│       ▼              ▼              ▼                       │
│  ┌─────────────────────────────────────────────────┐       │
│  │              空闲/等待阶段 (Idle)                 │       │
│  │         仅 libuv 内部使用                         │       │
│  └─────────────────────────────────────────────────┘       │
│       │              │              │                       │
│       └──────────────┴──────────────┘                       │
│                       │                                      │
│                       ▼                                      │
│              ┌─────────────────┐                            │
│              │ 回到定时器阶段   │                            │
│              └─────────────────┘                            │
└───────────────────────────────────────────────────────────┘
```

### 2.3 事件循环阶段详解

#### 2.3.1 定时器阶段（Timers）

执行 setTimeout 和 setInterval 回调。

```javascript
// 示例：定时器阶段执行顺序
console.log('1. 同步代码开始');

setTimeout(() => {
  console.log('2. setTimeout 回调 - 0ms');
}, 0);

setTimeout(() => {
  console.log('3. setTimeout 回调 - 10ms');
}, 10);

setImmediate(() => {
  console.log('4. setImmediate 回调');
});

process.nextTick(() => {
  console.log('5. process.nextTick 回调');
});

console.log('6. 同步代码结束');

// 执行顺序：
// 1. 同步代码开始
// 6. 同步代码结束
// 5. process.nextTick 回调（优先级最高）
// 2. setTimeout 回调 - 0ms
// 4. setImmediate 回调
// 3. setTimeout 回调 - 10ms
```

#### 2.3.2 待处理阶段（Pending Callbacks）

执行上一轮事件循环中延迟的 I/O 回调。

```javascript
// 这个阶段很少直接使用，主要由 Node.js 内部使用
// 但了解它的存在有助于理解事件循环的完整性
```

#### 2.3.3 回调阶段（Poll）

处理 I/O 回调，执行除了 setTimeout、setInterval、setImmediate 之外的回调。

```javascript
// Poll 阶段示例
const fs = require('fs');

console.log('开始');

// 读取文件是异步操作，回调在 Poll 阶段执行
fs.readFile(__filename, 'utf8', (err, data) => {
  console.log('文件读取完成 - Poll 阶段');
});

console.log('其他同步代码');

// 当 Poll 队列为空且有 setImmediate 时，会跳转到 Check 阶段
setImmediate(() => {
  console.log('setImmediate - Check 阶段');
});
```

#### 2.3.4 检查阶段（Check）

执行 setImmediate 回调。

```javascript
// Check 阶段总是紧跟在 Poll 阶段之后
setImmediate(() => {
  console.log('第一个 setImmediate');
});

setImmediate(() => {
  console.log('第二个 setImmediate');
});

// 输出顺序：
// 第一个 setImmediate
// 第二个 setImmediate
```

#### 2.3.5 关闭阶段（Close）

执行关闭回调，如 socket.on('close')。

```javascript
// 关闭阶段示例
const net = require('net');

const server = net.createServer((socket) => {
  socket.end('Hello');
});

server.listen(3000, () => {
  console.log('服务器启动');

  // 关闭服务器
  server.close();

  server.on('close', () => {
    console.log('服务器关闭 - Close 阶段');
  });
});
```

### 2.4 process.nextTick 与 setImmediate

这两个函数容易混淆，它们的执行时机不同。

```javascript
// process.nextTick 在当前操作完成后、下一个事件循环阶段前执行
// setImmediate 在 Check 阶段执行（在 Poll 阶段之后）

console.log('1. 同步开始');

process.nextTick(() => {
  console.log('2. nextTick');
});

setImmediate(() => {
  console.log('3. setImmediate');
});

console.log('4. 同步结束');

// 输出顺序：
// 1. 同步开始
// 4. 同步结束
// 2. nextTick
// 3. setImmediate
```

### 2.5 微任务与宏任务

JavaScript 中的异步任务分为微任务和宏任务两类。

#### 2.5.1 微任务（Microtasks）

- Promise 回调
- process.nextTick
- MutationObserver 回调

#### 2.5.2 宏任务（Macrotasks）

- setTimeout / setInterval
- setImmediate
- I/O 操作
- UI 渲染

```javascript
// 微任务与宏任务示例
console.log('1. 同步代码');

setTimeout(() => {
  console.log('2. setTimeout - 宏任务');
}, 0);

Promise.resolve().then(() => {
  console.log('3. Promise - 微任务');
});

process.nextTick(() => {
  console.log('4. nextTick - 微任务');
});

// 输出顺序：
// 1. 同步代码
// 4. nextTick - 微任务
// 3. Promise - 微任务
// 2. setTimeout - 宏任务
```

### 2.6 事件循环面试题

#### 面试题 1：输出顺序分析

```javascript
console.log('1');

setTimeout(() => {
  console.log('2');
  Promise.resolve().then(() => {
    console.log('3');
  });
}, 0);

Promise.resolve().then(() => {
  console.log('4');
  setTimeout(() => {
    console.log('5');
  }, 0);
});

process.nextTick(() => {
  console.log('6');
});

console.log('7');
```

**正确答案：** 1 -> 7 -> 6 -> 4 -> 2 -> 3 -> 5

**解析：**
1. 先执行所有同步代码：1, 7
2. 执行所有微任务：nextTick(6), Promise(4)
3. 执行宏任务 setTimeout(2)
4. 在 setTimeout 中产生新的微任务：Promise(3)
5. 执行微任务：Promise(3)
6. 执行下一个宏任务：setTimeout(5)

---

## 3. 异步编程模式

### 3.1 回调函数

回调函数是 Node.js 最基础的异步编程方式。

#### 3.1.1 错误优先回调

Node.js 约定：回调函数的第一个参数是错误对象，如果没有错误则为 null 或 undefined。

```javascript
const fs = require('fs');

// 错误优先回调示例
fs.readFile('./file.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('读取文件失败:', err);
    return;
  }
  console.log('文件内容:', data);
});

// 封装为 Promise（后续使用）
function readFilePromise(path, encoding = 'utf8') {
  return new Promise((resolve, reject) => {
    fs.readFile(path, encoding, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data);
    });
  });
}
```

#### 3.1.2 回调地狱

回调函数嵌套过深会导致代码难以维护，形成"回调地狱"。

```javascript
// 回调地狱示例（不推荐）
fs.readFile('./a.txt', 'utf8', (err, dataA) => {
  if (err) return console.error(err);

  fs.readFile('./b.txt', 'utf8', (err, dataB) => {
    if (err) return console.error(err);

    fs.readFile('./c.txt', 'utf8', (err, dataC) => {
      if (err) return console.error(err);

      console.log(dataA + dataB + dataC);
    });
  });
});

// 解决方案 1：使用 Promise 链式调用
function readFile(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

readFile('./a.txt')
  .then(dataA => readFile('./b.txt'))
  .then(dataB => readFile('./c.txt'))
  .then(dataC => console.log(dataA + dataB + dataC))
  .catch(err => console.error(err));

// 解决方案 2：使用 async/await（推荐）
async function readFiles() {
  try {
    const dataA = await readFile('./a.txt');
    const dataB = await readFile('./b.txt');
    const dataC = await readFile('./c.txt');
    console.log(dataA + dataB + dataC);
  } catch (err) {
    console.error(err);
  }
}
```

### 3.2 Promise

Promise 是 ES6 引入的异步编程解决方案，用于表示一个异步操作的最终结果。

#### 3.2.1 Promise 状态

- **pending**：初始状态，既不是成功也不是失败
- **fulfilled**：操作成功完成
- **rejected**：操作失败

```javascript
// Promise 基本用法
const promise = new Promise((resolve, reject) => {
  // 异步操作
  const success = true;

  if (success) {
    resolve('操作成功');
  } else {
    reject(new Error('操作失败'));
  }
});

promise
  .then(result => console.log(result))
  .catch(error => console.error(error))
  .finally(() => console.log('操作完成'));

// Promise 静态方法
Promise.resolve('直接解决').then(console.log);
Promise.reject(new Error('直接拒绝')).catch(console.error);

// Promise.all - 所有 Promise 都成功才成功
const p1 = Promise.resolve(1);
const p2 = Promise.resolve(2);
const p3 = Promise.resolve(3);

Promise.all([p1, p2, p3])
  .then(results => console.log(results))  // [1, 2, 3]
  .catch(err => console.error(err));

// Promise.race - 返回最快完成的那个
Promise.race([
  new Promise(r => setTimeout(() => r(1), 100)),
  new Promise(r => setTimeout(() => r(2), 50)),
  new Promise(r => setTimeout(() => r(3), 10))
])
  .then(result => console.log(result));  // 3

// Promise.allSettled - 等待所有 Promise 结束
Promise.allSettled([p1, p2, p3])
  .then(results => console.log(results));
// [{status: 'fulfilled', value: 1}, ...]

// Promise.any - 返回第一个成功的结果
Promise.any([
  Promise.reject(new Error('失败')),
  Promise.resolve('成功'),
  Promise.resolve('也成功')
])
  .then(result => console.log(result));  // 成功
```

#### 3.2.2 Promise 链式调用

```javascript
// Promise 链式调用
function asyncOperation(value) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(value * 2);
    }, 100);
  });
}

asyncOperation(1)
  .then(result => {
    console.log('第一步:', result);  // 2
    return asyncOperation(result);
  })
  .then(result => {
    console.log('第二步:', result);  // 4
    return asyncOperation(result);
  })
  .then(result => {
    console.log('第三步:', result);  // 8
  });
```

### 3.3 async/await

async/await 是 ES2017 引入的 Promise 语法糖，让异步代码看起来像同步代码。

#### 3.3.1 基本用法

```javascript
// async 函数总是返回 Promise
async function fetchUser(id) {
  // await 等待 Promise 解决
  const response = await fetch(`/api/users/${id}`);
  const user = await response.json();
  return user;
}

// 调用 async 函数
fetchUser(1)
  .then(user => console.log(user))
  .catch(err => console.error(err));

// 或者使用 IIFE
(async () => {
  try {
    const user = await fetchUser(1);
    console.log(user);
  } catch (err) {
    console.error(err);
  }
})();
```

#### 3.3.2 并行执行

```javascript
// 顺序执行（串行）
async function sequential() {
  const result1 = await operation1();
  const result2 = await operation2();
  const result3 = await operation3();
  return [result1, result2, result3];
}

// 并行执行
async function parallel() {
  const [result1, result2, result3] = await Promise.all([
    operation1(),
    operation2(),
    operation3()
  ]);
  return [result1, result2, result3];
}

// 竞态执行（谁先完成返回谁）
async function race() {
  const result = await Promise.race([
    timeout(1000, '操作1'),
    timeout(2000, '操作2'),
    timeout(500, '操作3')
  ]);
  return result;
}

function timeout(ms, value) {
  return new Promise(resolve => setTimeout(() => resolve(value), ms));
}
```

#### 3.3.3 错误处理

```javascript
// 方式 1：try-catch
async function handleError() {
  try {
    const result = await riskyOperation();
    return result;
  } catch (err) {
    console.error('操作失败:', err);
    throw err;
  }
}

// 方式 2：Promise.catch 捕获
async function handleError2() {
  const result = await riskyOperation().catch(err => {
    console.error('操作失败:', err);
    return defaultValue;  // 返回默认值
  });
  return result;
}

// 方式 3：使用工具函数统一处理
async function to(promise) {
  try {
    const result = await promise;
    return [null, result];
  } catch (err) {
    return [err, null];
  }
}

// 使用
async function main() {
  const [err, user] = await to(fetchUser(1));
  if (err) {
    console.error('获取用户失败:', err);
    return;
  }
  console.log('用户:', user);
}
```

### 3.4 异步迭代

#### 3.4.1 for await...of

```javascript
// 异步迭代器
async function* asyncGenerator() {
  yield Promise.resolve(1);
  yield Promise.resolve(2);
  yield Promise.resolve(3);
}

// 使用 for await...of
async function main() {
  for await (const num of asyncGenerator()) {
    console.log(num);
  }
}
```

---

## 4. Buffer 与 Stream

### 4.1 Buffer

Buffer 是 Node.js 用来处理二进制数据的类，用于在 TCP 流、文件系统操作等场景中处理字节数据。

#### 4.1.1 创建 Buffer

```javascript
// 1. 从字符串创建
const buf1 = Buffer.from('Hello Node.js', 'utf8');
console.log(buf1);  // <Buffer 48 65 6c 6c 6f 20 4e 6f 64 65 2e 6a 73>

// 2. 指定编码创建
const buf2 = Buffer.from('你好', 'utf8');
console.log(buf2.length);  // 6 (每个中文字符 3 字节)

// 3. 创建指定大小的 Buffer
const buf3 = Buffer.alloc(10);  // 初始化为 0
console.log(buf3);  // <Buffer 00 00 00 00 00 00 00 00 00 00>

// 4. 创建未初始化的 Buffer（可能包含旧数据）
const buf4 = Buffer.allocUnsafe(10);
console.log(buf4);  // 可能包含随机数据

// 5. 从数组创建
const buf5 = Buffer.from([72, 101, 108, 108, 111]);
console.log(buf5.toString());  // Hello
```

#### 4.1.2 Buffer 操作

```javascript
const buf = Buffer.from('Hello World');

// 1. 字符串转换
console.log(buf.toString());       // Hello World
console.log(buf.toString('hex'));  // 48656c6c6f20576f726c64
console.log(buf.toString('base64'));  // SGVsbG8gV29ybGQ=

// 2. 读写数据
console.log(buf[0]);              // 72 (H 的 ASCII)
buf[0] = 65;                      // 改为 A
console.log(buf.toString());      // Aello World

// 3. 切片
const subBuf = buf.slice(0, 5);
console.log(subBuf.toString());   // Hello

// 4. 拼接
const buf1 = Buffer.from('Hello');
const buf2 = Buffer.from(' World');
const combined = Buffer.concat([buf1, buf2]);
console.log(combined.toString());  // Hello World

// 5. 查找
console.log(Buffer.from('World').indexOf('o'));  // 1

// 6. 比较
const bufA = Buffer.from('abc');
const bufB = Buffer.from('abc');
console.log(bufA.compare(bufB));  // 0 (相等)
```

### 4.2 Stream

Stream 是处理流式数据的抽象接口，用于高效处理大量数据，避免一次性将所有数据加载到内存中。

#### 4.2.1 流类型

| 类型 | 说明 |
|------|------|
| Readable | 可读流（如文件读取、网络请求） |
| Writable | 可写流（如文件写入、网络响应） |
| Duplex | 双工流（可读可写，如 TCP 套接字） |
| Transform | 转换流（数据转换，如压缩） |

#### 4.2.2 可读流

```javascript
const fs = require('fs');

// 1. 流式读取文件
const readStream = fs.createReadStream('./large-file.txt', {
  encoding: 'utf8',
  highWaterMark: 64 * 1024  // 64KB 一块
});

// 读取数据事件
readStream.on('data', (chunk) => {
  console.log('接收到数据块:', chunk.length, 'bytes');
});

// 数据读取完成
readStream.on('end', () => {
  console.log('数据读取完成');
});

// 错误处理
readStream.on('error', (err) => {
  console.error('读取错误:', err);
});

// 2. 使用 pipe 管道
const writeStream = fs.createWriteStream('./output.txt');
readStream.pipe(writeStream);

// 3. 手动控制流（暂停/恢复）
readStream.pause();
setTimeout(() => {
  readStream.resume();
}, 1000);
```

#### 4.2.3 可写流

```javascript
const fs = require('fs');
const writeStream = fs.createWriteStream('./output.txt');

// 写入数据
writeStream.write('第一行数据\n');
writeStream.write('第二行数据\n');

// 标记写入完成
writeStream.end('最后一行数据\n');

// 监听事件
writeStream.on('finish', () => {
  console.log('所有数据已写入');
});

writeStream.on('error', (err) => {
  console.error('写入错误:', err);
});

// 背压处理
readStream.on('data', (chunk) => {
  const canContinue = writeStream.write(chunk);
  if (!canContinue) {
    readStream.pause();
    writeStream.once('drain', () => {
      readStream.resume();
    });
  }
});
```

#### 4.2.4 Transform 流

```javascript
const zlib = require('zlib');
const fs = require('fs');

// 1. 压缩流
const gzip = zlib.createGzip();
const input = fs.createReadStream('./input.txt');
const output = fs.createWriteStream('./input.txt.gz');

input.pipe(gzip).pipe(output);

// 2. 自定义 Transform 流
const { Transform } = require('stream');

class UpperCaseTransform extends Transform {
  _transform(chunk, encoding, callback) {
    // 将数据转换为大写
    const upperCased = chunk.toString().toUpperCase();
    this.push(upperCased);
    callback();
  }
}

const transform = new UpperCaseTransform();
transform.write('hello');
transform.write(' world');
transform.end();

transform.on('data', (chunk) => {
  console.log(chunk.toString());  // HELLO WORLD
});
```

#### 4.2.5 流式处理大文件

```javascript
const fs = require('fs');

// 统计文件行数（不将整个文件加载到内存）
function countLines(filePath) {
  return new Promise((resolve, reject) => {
    let lineCount = 0;
    const readStream = fs.createReadStream(filePath, {
      encoding: 'utf8'
    });

    readStream.on('data', (chunk) => {
      lineCount += (chunk.match(/\n/g) || []).length;
    });

    readStream.on('end', () => {
      resolve(lineCount);
    });

    readStream.on('error', reject);
  });
}

// 文件复制（使用 pipe，自动处理背压）
function copyFile(source, destination) {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(source);
    const writeStream = fs.createWriteStream(destination);

    readStream.on('error', reject);
    writeStream.on('error', reject);
    writeStream.on('finish', resolve);

    readStream.pipe(writeStream);
  });
}
```

---

## 5. 模块系统

### 5.1 CommonJS 模块

CommonJS 是 Node.js 默认的模块系统，使用 require 加载模块，使用 module.exports 导出模块。

#### 5.1.1 导出模块

```javascript
// 方式 1：导出单个值
module.exports = function add(a, b) {
  return a + b;
};

// 方式 2：导出多个值（对象）
module.exports = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
  multiply: (a, b) => a * b,
  divide: (a, b) => b !== 0 ? a / b : NaN
};

// 方式 3：使用 exports 简写（注意：不能直接赋值）
exports.add = (a, b) => a + b;
exports.subtract = (a, b) => a - b;

// exports 与 module.exports 的关系
// exports 是 module.exports 的引用
// 正确：exports.xxx = value
// 错误：exports = value （这会切断引用）
```

#### 5.1.2 加载模块

```javascript
// 1. 加载内置模块
const fs = require('fs');
const path = require('path');
const http = require('http');

// 2. 加载自定义模块
const myModule = require('./myModule');  // .js 可省略
const myModule2 = require('./myModule2');  // .json
const myModule3 = require('./myModule3');  // 目录（加载 index.js）

// 3. 加载 node_modules
const express = require('express');
const lodash = require('lodash');

// 4. 加载机制
// 第一次 require 会执行模块并缓存
// 多次 require 同一个模块会返回缓存的结果
```

#### 5.1.3 模块作用域

每个模块都有自己的作用域，不会污染全局变量。

```javascript
// 模块 A
const privateVar = '私有变量';  // 不会泄露
const publicVar = '公开变量';

function privateFunction() {
  // 私有函数
}

function publicFunction() {
  return privateVar;  // 可以访问私有变量
}

module.exports = {
  publicVar,
  publicFunction
};

// 模块 B 无法访问 privateVar 和 privateFunction
```

### 5.2 ES Modules

ES Modules (ESM) 是 JavaScript 官方的模块系统，从 ES6 开始引入。

#### 5.2.1 配置 Node.js 支持 ESM

```json
// package.json
{
  "type": "module"  // 启用 ESM
}

// 或者使用 .mjs 扩展名
```

#### 5.2.2 导出与导入

```javascript
// 命名导出
// util.js
export const add = (a, b) => a + b;
export const subtract = (a, b) => a - b;

export default function multiply(a, b) {
  return a * b;
}

// 命名导入
import { add, subtract } from './util.js';

// 默认导入
import multiply from './util.js';

// 全部导入
import * as utils from './util.js';

// 组合导入
import multiply, { add, subtract } from './util.js';
```

### 5.3 模块加载顺序

```javascript
// require('./moduleA') 执行顺序：
// 1. 解析模块路径
// 2. 检查缓存（已加载则返回缓存）
// 3. 加载模块（执行模块代码）
// 4. 缓存模块
// 5. 返回 module.exports
```

---

## 常见面试问题

### 问题 1：Node.js 为什么是单线程的？

**答案：** Node.js 采用单线程 + 事件循环的模式，主要是为了简化编程模型，避免多线程带来的复杂性（如死锁、竞态条件）。单线程避免了线程创建和销毁的开销，也避免了多线程间的上下文切换。对于 I/O 操作，Node.js 内部使用 libuv 的线程池来处理，实际执行是异步的。

### 问题 2：Node.js 适合处理高并发的原因？

**答案：**
1. 非阻塞 I/O：不会等待 I/O 操作完成
2. 事件循环：使用单线程处理所有请求
3. V8 引擎：JIT 编译，执行效率高
4. 适合 I/O 密集型任务：不适合 CPU 密集型任务

### 问题 3：setTimeout 和 setImmediate 的区别？

**答案：** setTimeout 在定时器阶段执行，setImmediate 在检查阶段执行。在 I/O 操作的回调中，setImmediate 总是先执行；但在其他情况下，执行顺序可能不确定。

---

## 最佳实践

1. **优先使用 async/await**：语法更清晰，易于维护
2. **正确处理错误**：每个异步操作都应该有错误处理
3. **避免回调地狱**：使用 Promise 链或 async/await
4. **使用流处理大文件**：不要一次性将大文件加载到内存
5. **理解事件循环**：合理安排同步/异步代码的执行顺序
6. **使用环境变量**：通过 process.env 管理配置

---

## 参考资源

- [Node.js 官方文档](https://nodejs.org/docs/)
- [Node.js 事件循环详解](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/)
- [libuv 文档](http://docs.libuv.org/)

---

## 六、错误处理最佳实践

### 6.1 错误类型与自定义错误

```javascript
// 自定义错误基类
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // 标识可操作的错误
    Error.captureStackTrace(this, this.constructor);
  }
}

// 具体错误类型
class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class UnauthorizedError extends AppError {
  constructor(message = '未授权访问') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = '禁止访问') {
    super(message, 403, 'FORBIDDEN');
  }
}

class NotFoundError extends AppError {
  constructor(resource = '资源') {
    super(`${resource}不存在`, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message = '资源冲突') {
    super(message, 409, 'CONFLICT');
  }
}

class RateLimitError extends AppError {
  constructor(retryAfter = 60) {
    super('请求过于频繁', 429, 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
  }
}

// 使用示例
function validateUser(data) {
  const errors = [];

  if (!data.name || data.name.length < 2) {
    errors.push({ field: 'name', message: '姓名至少2个字符' });
  }

  if (!data.email || !data.email.includes('@')) {
    errors.push({ field: 'email', message: '邮箱格式不正确' });
  }

  if (errors.length > 0) {
    throw new ValidationError('输入验证失败', errors);
  }

  return data;
}
```

### 6.2 异步错误处理模式

```javascript
// 模式1：try-catch + async/await
async function fetchData(id) {
  try {
    const response = await fetch(`/api/data/${id}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('获取数据失败:', error);
    throw error; // 重新抛出，让调用者处理
  }
}

// 模式2：错误优先回调
function readFileCallback(path, callback) {
  fs.readFile(path, 'utf8', (err, data) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, data);
  });
}

// 模式3：Promise 包装
function readFilePromise(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

// 模式4：工具函数 - Go 风格错误处理
function to(promise) {
  return promise
    .then(data => [null, data])
    .catch(err => [err, null]);
}

// 使用示例
async function main() {
  const [err, data] = await to(fetchData(123));

  if (err) {
    console.error('错误:', err);
    return;
  }

  console.log('数据:', data);
}

// 模式5：Express 异步处理包装器
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 使用示例
app.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new NotFoundError('用户');
  }

  res.json({ data: user });
}));
```

### 6.3 全局错误处理

```javascript
// 全局错误处理中间件（Express）
function globalErrorHandler(err, req, res, next) {
  // 记录错误日志
  console.error({
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    body: req.body,
    query: req.query,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
    },
  });

  // 处理已知错误
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // 处理 JSON 解析错误
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: '请求体JSON格式错误',
      },
    });
  }

  // 处理 JWT 错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: '无效的认证令牌',
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: '认证令牌已过期',
      },
    });
  }

  // 未知错误
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? '服务器内部错误'
        : err.message,
    },
  });
}

// 进程级别错误处理
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  // 记录日志后优雅退出
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  // 可以选择继续运行或退出
});

// 信号处理
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，准备关闭...');
  // 清理资源
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});
```

---

## 七、安全性考虑

### 7.1 输入验证与清洗

```javascript
// 输入验证工具类
class InputValidator {
  // 验证邮箱
  static isEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // 验证手机号（中国大陆）
  static isPhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  // 验证URL
  static isUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // 验证身份证号
  static isIdCard(idCard) {
    const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
    return idCardRegex.test(idCard);
  }

  // 验证密码强度
  static isStrongPassword(password) {
    // 至少8位，包含大小写字母、数字和特殊字符
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongRegex.test(password);
  }

  // 获取密码强度评分
  static getPasswordStrength(password) {
    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';
    return 'strong';
  }

  // 验证并清洗字符串
  static sanitizeString(str, options = {}) {
    if (typeof str !== 'string') return '';

    let result = str.trim();

    // 移除HTML标签
    if (options.stripHtml) {
      result = result.replace(/<[^>]*>/g, '');
    }

    // 转义HTML实体
    if (options.escapeHtml) {
      result = result
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    }

    // 限制长度
    if (options.maxLength) {
      result = result.slice(0, options.maxLength);
    }

    return result;
  }
}

// 使用示例
function validateRegistration(data) {
  const errors = [];

  // 验证姓名
  const name = InputValidator.sanitizeString(data.name, { maxLength: 50 });
  if (!name || name.length < 2) {
    errors.push({ field: 'name', message: '姓名至少2个字符' });
  }

  // 验证邮箱
  if (!InputValidator.isEmail(data.email)) {
    errors.push({ field: 'email', message: '邮箱格式不正确' });
  }

  // 验证密码
  if (!InputValidator.isStrongPassword(data.password)) {
    errors.push({ field: 'password', message: '密码强度不足，需包含大小写字母、数字和特殊字符' });
  }

  // 验证手机号
  if (data.phone && !InputValidator.isPhone(data.phone)) {
    errors.push({ field: 'phone', message: '手机号格式不正确' });
  }

  if (errors.length > 0) {
    throw new ValidationError('输入验证失败', errors);
  }

  return {
    name,
    email: data.email.toLowerCase().trim(),
    password: data.password,
    phone: data.phone,
  };
}
```

### 7.2 安全响应头

```javascript
const http = require('http');

// 安全响应头配置
const securityHeaders = {
  // 防止点击劫持
  'X-Frame-Options': 'DENY',

  // 防止MIME类型嗅探
  'X-Content-Type-Options': 'nosniff',

  // XSS保护
  'X-XSS-Protection': '1; mode=block',

  // 内容安全策略
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",

  // HTTPS强制（生产环境）
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',

  // 引用策略
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // 权限策略
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

// 应用安全头的中间件
function securityMiddleware(req, res, next) {
  // 设置安全头
  Object.entries(securityHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // 移除敏感头
  res.removeHeader('X-Powered-By');

  next();
}

// Express 中使用 helmet
// npm install helmet
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));
```

### 7.3 敏感数据处理

```javascript
const crypto = require('crypto');

// 密码处理
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

// 数据加密
class DataEncryptor {
  constructor(key) {
    this.algorithm = 'aes-256-gcm';
    this.key = Buffer.from(key, 'hex');
  }

  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      iv: iv.toString('hex'),
      data: encrypted,
      authTag: authTag.toString('hex'),
    };
  }

  decrypt(encrypted) {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(encrypted.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));

    let decrypted = decipher.update(encrypted.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

// 日志脱敏
function maskSensitiveData(data) {
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard', 'ssn'];

  const masked = { ...data };

  for (const field of sensitiveFields) {
    if (masked[field]) {
      masked[field] = '***MASKED***';
    }
  }

  // 邮箱脱敏
  if (masked.email) {
    const [localPart, domain] = masked.email.split('@');
    masked.email = `${localPart.slice(0, 2)}***@${domain}`;
  }

  // 手机号脱敏
  if (masked.phone) {
    masked.phone = masked.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }

  // 身份证号脱敏
  if (masked.idCard) {
    masked.idCard = masked.idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2');
  }

  return masked;
}

// 使用示例
const logger = {
  info(message, data = {}) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      data: maskSensitiveData(data),
    }));
  },

  error(message, error, data = {}) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      error: {
        name: error.name,
        message: error.message,
      },
      data: maskSensitiveData(data),
    }));
  },
};
```

### 7.4 速率限制与防护

```javascript
// 内存速率限制器
class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000; // 时间窗口
    this.max = options.max || 100; // 最大请求数
    this.requests = new Map();
  }

  getKey(req) {
    return req.ip || req.connection.remoteAddress;
  }

  middleware() {
    return (req, res, next) => {
      const key = this.getKey(req);
      const now = Date.now();

      let record = this.requests.get(key);

      if (!record || now - record.startTime > this.windowMs) {
        record = { count: 0, startTime: now };
        this.requests.set(key, record);
      }

      record.count++;

      // 设置响应头
      res.setHeader('X-RateLimit-Limit', this.max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, this.max - record.count));
      res.setHeader('X-RateLimit-Reset', new Date(record.startTime + this.windowMs).toISOString());

      if (record.count > this.max) {
        const retryAfter = Math.ceil((record.startTime + this.windowMs - now) / 1000);
        return res.status(429).json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: '请求过于频繁，请稍后再试',
            retryAfter,
          },
        });
      }

      next();
    };
  }

  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now - record.startTime > this.windowMs) {
        this.requests.delete(key);
      }
    }
  }
}

// 使用示例
const apiLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 最多100次请求
});

const authLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 5, // 最多5次登录尝试
});

app.use('/api', apiLimiter.middleware());
app.use('/auth/login', authLimiter.middleware());

// 定期清理过期记录
setInterval(() => {
  apiLimiter.cleanup();
  authLimiter.cleanup();
}, 60000);
```

---

## 八、性能优化技巧

### 8.1 内存管理

```javascript
// 监控内存使用
function monitorMemory() {
  const used = process.memoryUsage();

  console.log({
    rss: `${Math.round(used.rss / 1024 / 1024)}MB`, // 常驻内存
    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`, // 堆总量
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`, // 堆使用
    external: `${Math.round(used.external / 1024 / 1024)}MB`, // 外部内存
  });
}

// 内存泄漏检测
function detectMemoryLeak() {
  let lastHeapUsed = 0;
  let checkCount = 0;

  setInterval(() => {
    const used = process.memoryUsage();
    const heapUsed = used.heapUsed;
    checkCount++;

    // 每10次检查记录一次
    if (checkCount % 10 === 0) {
      console.log(`堆内存使用: ${Math.round(heapUsed / 1024 / 1024)}MB`);
    }

    // 检测内存增长趋势
    if (lastHeapUsed > 0 && heapUsed > lastHeapUsed * 1.5) {
      console.warn('可能存在内存泄漏!', {
        lastHeapUsed: `${Math.round(lastHeapUsed / 1024 / 1024)}MB`,
        currentHeapUsed: `${Math.round(heapUsed / 1024 / 1024)}MB`,
      });
    }

    lastHeapUsed = heapUsed;
  }, 30000);
}

// 设置内存限制并自动重启
const MEMORY_LIMIT_MB = 512;

function setupMemoryLimit() {
  setInterval(() => {
    const used = process.memoryUsage();

    if (used.heapUsed > MEMORY_LIMIT_MB * 1024 * 1024) {
      console.warn(`内存使用超过限制(${MEMORY_LIMIT_MB}MB)，准备重启...`);
      process.exit(1);
    }
  }, 60000);
}
```

### 8.2 并发控制

```javascript
// 并发队列
class ConcurrencyQueue {
  constructor(concurrency = 4) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  async add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.run();
    });
  }

  async run() {
    while (this.running < this.concurrency && this.queue.length > 0) {
      this.running++;
      const { task, resolve, reject } = this.queue.shift();

      try {
        const result = await task();
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        this.running--;
        this.run();
      }
    }
  }

  get status() {
    return {
      running: this.running,
      pending: this.queue.length,
    };
  }
}

// 使用示例
const queue = new ConcurrencyQueue(3);

const urls = ['url1', 'url2', 'url3', 'url4', 'url5'];

const results = await Promise.all(
  urls.map(url => queue.add(() => fetch(url)))
);
```

### 8.3 缓存策略

```javascript
// 内存缓存
class MemoryCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000;
    this.defaultTTL = options.defaultTTL || 60000;
    this.cache = new Map();
  }

  set(key, value, ttl = this.defaultTTL) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  get(key) {
    const item = this.cache.get(key);

    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  cleanup() {
    const now = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// 使用示例
const cache = new MemoryCache({ maxSize: 500, defaultTTL: 300000 });

async function getUserWithCache(userId) {
  const cacheKey = `user:${userId}`;

  let user = cache.get(cacheKey);

  if (user) {
    return user;
  }

  user = await User.findById(userId);

  if (user) {
    cache.set(cacheKey, user);
  }

  return user;
}

// 定期清理过期缓存
setInterval(() => cache.cleanup(), 60000);
```

### 8.4 事件循环优化

```javascript
// 避免阻塞事件循环
// ❌ 错误：同步处理大量数据
function processDataSync(data) {
  return data.map(item => heavyComputation(item));
}

// ✅ 正确：分批处理，让出事件循环
async function processDataAsync(data, batchSize = 100) {
  const results = [];

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);

    // 处理当前批次
    const batchResults = batch.map(item => heavyComputation(item));
    results.push(...batchResults);

    // 让出事件循环
    await new Promise(resolve => setImmediate(resolve));
  }

  return results;
}

// 监控事件循环延迟
function monitorEventLoopDelay() {
  const start = process.hrtime.bigint();

  setImmediate(() => {
    const end = process.hrtime.bigint();
    const delay = Number(end - start) / 1e6; // 转换为毫秒

    if (delay > 100) {
      console.warn(`事件循环延迟: ${delay.toFixed(2)}ms`);
    }
  });
}

setInterval(monitorEventLoopDelay, 1000);
```

---

## 九、生产环境部署建议

### 9.1 进程管理

```javascript
// 使用 cluster 模块
const cluster = require('cluster');
const os = require('os');

if (cluster.isPrimary) {
  const cpuCount = os.cpus().length;

  console.log(`主进程 ${process.pid} 正在运行`);
  console.log(`启动 ${cpuCount} 个工作进程`);

  for (let i = 0; i < cpuCount; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`工作进程 ${worker.process.pid} 已退出`);
    cluster.fork(); // 自动重启
  });
} else {
  // 工作进程代码
  require('./app');
}
```

### 9.2 健康检查

```javascript
// 健康检查端点
class HealthChecker {
  constructor() {
    this.checks = new Map();
  }

  register(name, checkFn) {
    this.checks.set(name, checkFn);
  }

  async check() {
    const results = {};
    let isHealthy = true;

    for (const [name, checkFn] of this.checks.entries()) {
      try {
        const result = await checkFn();
        results[name] = { status: 'ok', ...result };
      } catch (error) {
        results[name] = { status: 'error', message: error.message };
        isHealthy = false;
      }
    }

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: results,
    };
  }
}

const healthChecker = new HealthChecker();

// 注册检查项
healthChecker.register('database', async () => {
  await db.ping();
  return { latency: '5ms' };
});

healthChecker.register('redis', async () => {
  await redis.ping();
  return { latency: '2ms' };
});

// 健康检查路由
app.get('/health', async (req, res) => {
  const health = await healthChecker.check();
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

app.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

app.get('/health/ready', async (req, res) => {
  try {
    await healthChecker.check();
    res.status(200).json({ status: 'ready' });
  } catch {
    res.status(503).json({ status: 'not ready' });
  }
});
```

### 9.3 优雅关闭

```javascript
// 优雅关闭
let isShuttingDown = false;
const activeConnections = new Set();

server.on('connection', (connection) => {
  activeConnections.add(connection);
  connection.on('close', () => {
    activeConnections.delete(connection);
  });
});

async function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`收到 ${signal} 信号，开始优雅关闭...`);

  // 停止接受新连接
  server.close(() => {
    console.log('HTTP服务器已关闭');
  });

  // 设置强制关闭超时
  const forceCloseTimeout = setTimeout(() => {
    console.log('强制关闭剩余连接');
    process.exit(1);
  }, 30000);

  // 等待所有活跃连接关闭
  const checkConnections = setInterval(() => {
    if (activeConnections.size === 0) {
      clearInterval(checkConnections);
      clearTimeout(forceCloseTimeout);
      console.log('所有连接已关闭');
      process.exit(0);
    }
    console.log(`等待 ${activeConnections.size} 个连接关闭...`);
  }, 1000);

  // 关闭数据库连接
  try {
    await db.close();
    console.log('数据库连接已关闭');
  } catch (error) {
    console.error('关闭数据库连接失败:', error);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

---

## 十、更多面试问题

### 10.1 进阶问题

**Q4: 解释 Node.js 中的流（Stream）及其类型**

```
答案：
Stream 是 Node.js 中处理流式数据的抽象接口，用于高效处理大量数据。

四种类型：
1. Readable（可读流）：用于读取数据
   - fs.createReadStream()
   - process.stdin

2. Writable（可写流）：用于写入数据
   - fs.createWriteStream()
   - process.stdout

3. Duplex（双工流）：可读可写
   - net.Socket
   - zlib streams

4. Transform（转换流）：在读写过程中修改数据
   - zlib.createGzip()
   - crypto streams

优点：
- 内存效率高：不需要一次性加载所有数据
- 时间效率高：数据到达后立即处理
- 可组合：使用 pipe() 连接多个流
```

**Q5: 什么是背压（Backpressure）？如何处理？**

```javascript
// 背压：当写入速度慢于读取速度时，数据会在内存中积压

// ❌ 错误：可能导致内存溢出
readStream.on('data', (chunk) => {
  writeStream.write(chunk);
});

// ✅ 正确：手动处理背压
readStream.on('data', (chunk) => {
  if (!writeStream.write(chunk)) {
    readStream.pause();
  }
});

writeStream.on('drain', () => {
  readStream.resume();
});

// ✅ 推荐：使用 pipe 自动处理背压
readStream.pipe(writeStream);

// ✅ 推荐：使用 pipeline 更好的错误处理
const { pipeline } = require('stream');

pipeline(
  readStream,
  transformStream,
  writeStream,
  (err) => {
    if (err) console.error('管道失败:', err);
    else console.log('管道成功');
  }
);
```

**Q6: Node.js 如何处理 CPU 密集型任务？**

```javascript
// 方式1：使用 worker_threads
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (isMainThread) {
  // 主线程
  const worker = new Worker(__filename, {
    workerData: { numbers: [1, 2, 3, 4, 5] }
  });

  worker.on('message', result => console.log('结果:', result));
} else {
  // 工作线程
  const result = workerData.numbers.reduce((sum, n) => sum + n * n, 0);
  parentPort.postMessage(result);
}

// 方式2：使用 child_process
const { fork } = require('child_process');

const child = fork('./heavy-task.js');
child.send({ data: 'some data' });
child.on('message', result => console.log(result));

// 方式3：拆分任务，让出事件循环
async function processInChunks(data, chunkSize = 100) {
  const results = [];

  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    results.push(...chunk.map(processItem));

    // 让出事件循环
    await new Promise(resolve => setImmediate(resolve));
  }

  return results;
}
```

**Q7: 如何诊断 Node.js 内存泄漏？**

```javascript
// 1. 使用 process.memoryUsage() 监控
setInterval(() => {
  const used = process.memoryUsage();
  console.log(`堆内存: ${Math.round(used.heapUsed / 1024 / 1024)}MB`);
}, 10000);

// 2. 使用 v8 模块生成堆快照
const v8 = require('v8');
const fs = require('fs');

// 生成堆快照
const snapshotStream = v8.getHeapSnapshot();
const fileStream = fs.createWriteStream('heap.heapsnapshot');
snapshotStream.pipe(fileStream);

// 3. 使用 --inspect 标志和 Chrome DevTools
// node --inspect app.js
// 打开 chrome://inspect

// 4. 使用 clinic.js 工具
// npm install -g clinic
// clinic heapprofiler -- node app.js

// 5. 常见内存泄漏原因
// - 未清理的定时器
// - 未移除的事件监听器
// - 闭包引用
// - 缓存未设置上限
// - 全局变量
```

**Q8: 解释 Node.js 中的模块缓存机制**

```javascript
// Node.js 模块缓存机制
// 每个模块只加载一次，后续 require 返回缓存

// counter.js
let count = 0;

module.exports = {
  increment: () => ++count,
  getCount: () => count,
};

// app.js
const counter1 = require('./counter');
const counter2 = require('./counter');

console.log(counter1.increment()); // 1
console.log(counter2.increment()); // 2（共享同一个实例）
console.log(counter1.getCount());  // 2

// 查看缓存
console.log(require.cache);

// 清除缓存（不推荐）
delete require.cache[require.resolve('./counter')];
const counter3 = require('./counter');
console.log(counter3.getCount()); // 0（新实例）

// 模块缓存的键是模块的绝对路径
// 可以利用缓存实现单例模式
```

---

## 十一、实战案例

### 11.1 实现一个简单的 HTTP 服务器

```javascript
const http = require('http');
const url = require('url');
const querystring = require('querystring');

// 简单的路由系统
class Router {
  constructor() {
    this.routes = {
      GET: {},
      POST: {},
      PUT: {},
      DELETE: {},
    };
  }

  get(path, handler) {
    this.routes.GET[path] = handler;
  }

  post(path, handler) {
    this.routes.POST[path] = handler;
  }

  put(path, handler) {
    this.routes.PUT[path] = handler;
  }

  delete(path, handler) {
    this.routes.DELETE[path] = handler;
  }

  async handle(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    // 查找路由
    const handler = this.routes[method]?.[pathname];

    if (handler) {
      try {
        await handler(req, res, parsedUrl);
      } catch (error) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: '服务器错误' }));
      }
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: '未找到' }));
    }
  }
}

// 创建路由器
const router = new Router();

// 定义路由
router.get('/', (req, res, parsedUrl) => {
  res.end(JSON.stringify({ message: 'Hello World' }));
});

router.get('/users', (req, res, parsedUrl) => {
  const { page = 1, limit = 10 } = parsedUrl.query;
  res.end(JSON.stringify({ users: [], page, limit }));
});

router.post('/users', async (req, res, parsedUrl) => {
  const body = await parseBody(req);
  res.statusCode = 201;
  res.end(JSON.stringify({ id: 1, ...body }));
});

// 解析请求体
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });

    req.on('error', reject);
  });
}

// 创建服务器
const server = http.createServer((req, res) => {
  // 设置响应头
  res.setHeader('Content-Type', 'application/json');

  // 处理 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');

  if (req.method === 'OPTIONS') {
    res.end();
    return;
  }

  router.handle(req, res);
});

server.listen(3000, () => {
  console.log('服务器运行在 http://localhost:3000');
});
```

### 11.2 实现一个简单的文件服务器

```javascript
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT_DIR = './public';

// MIME 类型映射
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
};

const server = http.createServer((req, res) => {
  // 解析请求路径
  let filePath = path.join(ROOT_DIR, req.url === '/' ? 'index.html' : req.url);

  // 获取文件扩展名
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // 读取文件
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // 文件不存在，返回 404
        res.statusCode = 404;
        res.end('Not Found');
      } else {
        // 其他错误
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
      return;
    }

    // 设置响应头
    res.setHeader('Content-Type', contentType);
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`文件服务器运行在 http://localhost:${PORT}`);
});
```

---

*本文档最后更新于 2026年3月*
