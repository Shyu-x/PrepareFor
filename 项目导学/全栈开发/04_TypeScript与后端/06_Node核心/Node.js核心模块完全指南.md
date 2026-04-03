# Node.js 核心模块完全指南

## 目录

1. [Node.js 基础架构](#1-nodejs-基础架构)
2. [事件循环与异步编程](#2-事件循环与异步编程)
3. [Buffer 与 Stream](#3-buffer-与-stream)
4. [模块系统](#4-模块系统)
5. [核心模块详解](#5-核心模块详解)
6. [调试方法](#6-调试方法)
7. [实战案例](#7-实战案例)

---

## 1. Node.js 基础架构

### 1.1 Node.js 是什么

Node.js 是一个基于 Chrome V8 引擎的 JavaScript 运行时，使 JavaScript 能够脱离浏览器在服务器端运行。它采用事件驱动、非阻塞 I/O 模型，具有高性能和伸缩性。

```
┌─────────────────────────────────────────────────────────────────┐
│                        Node.js 架构图                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    JavaScript 代码                        │  │
│  │   (ES6+ 语法、Promise、async/await、模块系统)            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      V8 引擎                              │  │
│  │   (JavaScript 编译、执行、内存管理)                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Node.js 运行时                          │  │
│  │   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │  │
│  │   │  事件    │  │  异步   │  │  模块   │  │  网络   │    │  │
│  │   │  循环    │  │  I/O    │  │  系统   │  │  操作   │    │  │
│  │   └─────────┘  └─────────┘  └─────────┘  └─────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    操作系统层                             │  │
│  │   (文件系统、网络、进程、子系统)                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Node.js 核心特性

| 特性 | 说明 | 优势 |
|------|------|------|
| **事件驱动** | 基于事件的异步编程模型 | 高并发处理能力 |
| **非阻塞 I/O** | I/O 操作不阻塞主线程 | 高性能、高吞吐量 |
| **单线程** | 主线程只有一个 | 避免锁竞争、简化开发 |
| **V8 引擎** | Google Chrome 同款 JS 引擎 | 快速执行 JavaScript |
| **npm 生态** | 全球最大包管理器 | 丰富第三方库 |

### 1.3 全局对象

Node.js 提供了一些全局对象，可以在任何地方直接使用：

```javascript
// console - 控制台输出
console.log('信息日志');
console.warn('警告信息');
console.error('错误信息');
console.time('timer'); // 计时开始
console.timeEnd('timer'); // 计时结束并输出

// process - 进程信息
console.log(process.version);        // Node.js 版本
console.log(process.platform);       // 操作系统平台
console.log(process.arch);           // CPU 架构
console.log(process.cwd());          // 当前工作目录
console.log(process.env);            // 环境变量
console.log(process.argv);           // 命令行参数
console.log(process.pid);           // 进程 ID

// process 事件
process.on('exit', (code) => {
  // 进程退出前触发
  console.log(`进程即将退出，退出码: ${code}`);
});

process.on('uncaughtException', (err) => {
  // 未捕获的异常
  console.error('未捕获的异常:', err);
});

// setTimeout / setInterval - 定时器
setTimeout(() => {
  console.log('3秒后执行');
}, 3000);

setInterval(() => {
  console.log('每2秒执行一次');
}, 2000);

// __dirname 和 __filename
console.log(__dirname); // 当前文件所在目录的绝对路径
console.log(__filename); // 当前文件的绝对路径
```

### 1.4 Node.js 版本与新特性（2026年）

| 版本 | 发布时间 | 重要特性 |
|------|----------|----------|
| Node.js 22 | 2024年4月 | 原生 ES 模块支持、WebSocket 客户端、V8 12.4 |
| Node.js 23 | 2024年10月 | require() 支持 ES 模块、稳定 --run 命令 |
| Node.js 24 (预期) | 2026年 | 增强的性能、更多 ES 特性支持 |

**Node.js 22/23 新特性：**

```javascript
// 1. Array.fromAsync - 异步创建数组
async function* asyncIterable() {
  for (let i = 0; i < 5; i++) {
    await new Promise(resolve => setTimeout(resolve, 10 * i));
    yield i;
  }
}
const array = await Array.fromAsync(asyncIterable); // [0, 1, 2, 3, 4]

// 2. Set 新方法
const set1 = new Set([1, 2, 3]);
const set2 = new Set([2, 3, 4]);
const union = set1.union(set2);      // 并集: {1, 2, 3, 4}
const intersection = set1.intersection(set2); // 交集: {2, 3}
const difference = set1.difference(set2); // 差集: {1}

// 3. 迭代器辅助方法
const iterator = [1, 2, 3, 4, 5][Symbol.iterator]();
const taken = iterator.take(3); // 获取前3个元素
const dropped = iterator.drop(2); // 跳过前2个元素
```

---

## 2. 事件循环与异步编程

### 2.1 事件循环原理

事件循环是 Node.js 异步编程的核心机制，它负责协调和处理各种异步操作。

```
┌─────────────────────────────────────────────────────────────────┐
│                        事件循环流程                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐                                               │
│   │    执行     │ ←── 当前任务栈 (Call Stack)                   │
│   │   主线程    │     同步代码在这里执行                         │
│   └──────┬──────┘                                               │
│          │ 完成                                                  │
│          ↓                                                       │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    阶段执行 (Phases)                      │   │
│   │                                                          │   │
│   │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │   │
│   │  │ timers  │→│ pending │→│  idle   │→│ check   │    │   │
│   │  │  定时器 │  │  回调   │  │  准备   │  │  检查   │    │   │
│   │  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │   │
│   │      ↑                                    │            │   │
│   │      │                                    ↓            │   │
│   │  ┌─────────────────────────────────────────────────┐  │   │
│   │  │              微任务队列 (Microtasks)              │  │   │
│   │  │   Promise.then、process.nextTick、MutationObserver│  │   │
│   │  └─────────────────────────────────────────────────┘  │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**事件循环阶段说明：**

| 阶段 | 说明 | 处理的回调类型 |
|------|------|---------------|
| timers | 定时器阶段 | setTimeout、setInterval |
| pending callbacks | 待定回调 | I/O 回调延迟执行 |
| idle, prepare | 内部使用 | 内部调度 |
| poll | 轮询阶段 | I/O 事件、网络回调 |
| check | 检查阶段 | setImmediate |
| close callbacks | 关闭回调 | socket.on('close') |

### 2.2 宏任务与微任务

```javascript
// 宏任务 (Macrotask) vs 微任务 (Microtask) 执行顺序

console.log('1. 同步代码开始');

setTimeout(() => {
  // 宏任务 - 下一轮事件循环执行
  console.log('2. setTimeout - 宏任务');
}, 0);

Promise.resolve().then(() => {
  // 微任务 - 当前任务结束后立即执行
  console.log('3. Promise.then - 微任务');
});

process.nextTick(() => {
  // 微任务 - 优先级最高，在其他微任务之前执行
  console.log('4. process.nextTick - 高优先级微任务');
});

console.log('5. 同步代码结束');

// 输出顺序:
// 1. 同步代码开始
// 5. 同步代码结束
// 4. process.nextTick - 高优先级微任务
// 3. Promise.then - 微任务
// 2. setTimeout - 宏任务
```

### 2.3 异步编程模式

#### 2.3.1 回调函数 (传统方式)

```javascript
const fs = require('fs');

// 读取文件（回调方式）
fs.readFile('./test.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('读取文件失败:', err);
    return;
  }
  console.log('文件内容:', data);
});

// 回调地狱示例
fs.readFile('file1.txt', 'utf8', (err, data1) => {
  if (err) return console.error(err);
  fs.readFile('file2.txt', 'utf8', (err, data2) => {
    if (err) return console.error(err);
    fs.readFile('file3.txt', 'utf8', (err, data3) => {
      if (err) return console.error(err);
      console.log('所有文件:', data1, data2, data3);
    });
  });
});
```

#### 2.3.2 Promise 方式

```javascript
const fs = require('fs').promises;

// Promise 化封装
function readFilePromise(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

// Promise 链式调用
readFilePromise('file1.txt')
  .then(data1 => {
    console.log('文件1:', data1);
    return readFilePromise('file2.txt');
  })
  .then(data2 => {
    console.log('文件2:', data2);
    return readFilePromise('file3.txt');
  })
  .then(data3 => {
    console.log('文件3:', data3);
  })
  .catch(err => {
    console.error('读取失败:', err);
  });

// Promise.all - 并行读取
Promise.all([
  readFilePromise('file1.txt'),
  readFilePromise('file2.txt'),
  readFilePromise('file3.txt')
])
  .then(([data1, data2, data3]) => {
    console.log('并行读取完成:', data1, data2, data3);
  })
  .catch(err => {
    console.error('读取失败:', err);
  });
```

#### 2.3.3 async/await 方式（推荐）

```javascript
const fs = require('fs').promises;

// async/await 是 Promise 的语法糖，写法更简洁
async function readAllFiles() {
  try {
    // 串行读取
    const data1 = await fs.readFile('file1.txt', 'utf8');
    const data2 = await fs.readFile('file2.txt', 'utf8');
    const data3 = await fs.readFile('file3.txt', 'utf8');
    console.log('串行读取:', data1, data2, data3);

    // 并行读取（使用 Promise.all）
    const [d1, d2, d3] = await Promise.all([
      fs.readFile('file1.txt', 'utf8'),
      fs.readFile('file2.txt', 'utf8'),
      fs.readFile('file3.txt', 'utf8')
    ]);
    console.log('并行读取:', d1, d2, d3);

    // 并行读取（使用 Promise.allSettled，不阻塞）
    const results = await Promise.allSettled([
      fs.readFile('file1.txt', 'utf8'),
      fs.readFile('file2.txt', 'utf8'),
      fs.readFile('file3.txt', 'utf8')
    ]);

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`文件${index + 1}:`, result.value);
      } else {
        console.error(`文件${index + 1}读取失败:`, result.reason);
      }
    });
  } catch (err) {
    console.error('读取失败:', err);
  }
}

readAllFiles();

// 错误处理最佳实践
async function safeAsyncOperation() {
  try {
    const result = await riskyOperation();
    return result;
  } catch (err) {
    // 区分不同类型的错误
    if (err.code === 'ENOENT') {
      console.error('文件不存在');
    } else if (err.code === 'PERMISSION_DENIED') {
      console.error('权限不足');
    } else {
      console.error('未知错误:', err);
    }
    throw err; // 重新抛出，让调用者处理
  }
}
```

### 2.4 异步编程最佳实践

```javascript
// 1. 避免在循环中使用 await
// ❌ 错误：串行执行，性能差
async function processItemsBad(items) {
  for (const item of items) {
    await processItem(item);
  }
}

// ✅ 正确：并行执行，性能好
async function processItemsGood(items) {
  await Promise.all(items.map(item => processItem(item)));
}

// 2. 合理使用 try-catch
// ✅ 推荐：统一错误处理
async function fetchUserData() {
  try {
    const [user, posts, comments] = await Promise.all([
      fetchUser(),
      fetchPosts(),
      fetchComments()
    ]);
    return { user, posts, comments };
  } catch (err) {
    console.error('获取用户数据失败:', err);
    throw err;
  }
}

// 3. 使用 Promise.race 实现超时
function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('超时')), ms);
  });
  return Promise.race([promise, timeout]);
}

// 4. 使用 Promise.allSettled 处理部分失败
async function uploadFiles(files) {
  const results = await Promise.allSettled(
    files.map(file => uploadFile(file))
  );

  const successful = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);

  const failed = results
    .filter(r => r.status === 'rejected')
    .map(r => r.reason);

  return { successful, failed };
}
```

---

## 3. Buffer 与 Stream

### 3.1 Buffer 概念

Buffer 是 Node.js 用于处理二进制数据的类，类似于整数数组，但可以在任意时刻创建，并提供编码转换功能。

```javascript
// 创建 Buffer 的多种方式

// 1. Buffer.from() - 从数据创建
const buf1 = Buffer.from('Hello World', 'utf8'); // 字符串
const buf2 = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // 字节数组
const buf3 = Buffer.from(Buffer.from('test')); // 从另一个 Buffer 创建

// 2. Buffer.alloc() - 分配指定大小的 Buffer
const buf4 = Buffer.alloc(10); // 初始化为 0 的 Buffer
const buf5 = Buffer.alloc(10, 0xFF); // 初始化为 0xFF

// 3. Buffer.allocUnsafe() - 快速分配（不初始化）
// 注意：可能包含旧数据，需要手动填充
const buf6 = Buffer.allocUnsafe(1024);

// Buffer 基本操作
console.log(buf1.length); // 字节长度
console.log(buf1.toString('utf8')); // 转为字符串
console.log(buf1.toString('hex')); // 十六进制字符串
console.log(buf1.toString('base64')); // Base64 编码

// 写入 Buffer
const buf7 = Buffer.alloc(10);
buf7.write('Hello', 0, 'utf8'); // 从偏移量 0 开始写入
buf7.write('World', 5, 'utf8');

// 读取 Buffer
console.log(buf7.toString()); // "HelloWorld"

// 拼接 Buffer
const buf8 = Buffer.concat([buf1, buf2]);
console.log(buf8.toString());

// Buffer 切片
const buf9 = buf1.slice(0, 5); // 取前5个字节

// 遍历 Buffer
for (const byte of buf1) {
  console.log(byte); // 输出每个字节的整数值
}
```

### 3.2 Stream 概念

Stream 是 Node.js 处理流式数据的抽象接口，用于高效处理大量数据，避免内存溢出。

```
┌─────────────────────────────────────────────────────────────────┐
│                        Stream 类型                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐                   │
│  │   Readable      │    │   Writable       │                   │
│  │   (可读流)      │    │   (可写流)       │                   │
│  │                 │    │                 │                   │
│  │  ┌───────────┐  │    │  ┌───────────┐   │                   │
│  │  │   data    │  │    │  │   write   │   │                   │
│  │  │   end     │  │    │  │   finish  │   │                   │
│  │  │   error   │  │    │  │   error   │   │                   │
│  │  └───────────┘  │    │  └───────────┘   │                   │
│  └────────┬────────┘    └────────┬────────┘                   │
│           │                      │                              │
│           └──────────┬───────────┘                              │
│                      ↓                                          │
│            ┌─────────────────┐                                  │
│            │   Duplex        │                                  │
│            │   (双工流)       │                                  │
│            │  可读可写        │                                  │
│            └─────────────────┘                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Stream 使用示例

#### 3.3.1 可读流 (Readable Stream)

```javascript
const fs = require('fs');

// 从文件创建可读流
const readableStream = fs.createReadStream('./large-file.txt', {
  encoding: 'utf8',
  highWaterMark: 64 * 1024 // 64KB，默认为 64KB
});

// 监听 data 事件 - 数据到达时触发
readableStream.on('data', (chunk) => {
  console.log('接收到数据块:', chunk.length, 'bytes');
});

// 监听 end 事件 - 数据读取完成
readableStream.on('end', () => {
  console.log('数据读取完成');
});

// 监听 error 事件 - 发生错误
readableStream.on('error', (err) => {
  console.error('读取错误:', err);
});

// 使用管道（推荐）
const writableStream = fs.createWriteStream('./output.txt');
readableStream.pipe(writableStream);

// 异步迭代器方式读取（Node.js 10+）
async function readFile() {
  const stream = fs.createReadStream('./large-file.txt', { encoding: 'utf8' });

  for await (const chunk of stream) {
    console.log('数据块:', chunk);
  }
}
```

#### 3.3.2 可写流 (Writable Stream)

```javascript
const fs = require('fs');

// 创建可写流
const writableStream = fs.createWriteStream('./output.txt', {
  flags: 'a', // 'a' 追加，'w' 写入
  encoding: 'utf8',
  highWaterMark: 16 * 1024 // 16KB
});

// write() 方法
const data = 'Hello, Node.js Stream!';
writableStream.write(data, (err) => {
  if (err) {
    console.error('写入错误:', err);
  } else {
    console.log('数据已写入');
  }
});

// end() 方法 - 表示不再写入
writableStream.end('最终数据', () => {
  console.log('写入完成');
});

// 监听事件
writableStream.on('finish', () => {
  console.log('所有数据已写入');
});

writableStream.on('error', (err) => {
  console.error('写入错误:', err);
});

// backpressure 背压处理
// 当缓冲区满时，write() 返回 false
const readable = fs.createReadStream('./input.txt');
const writable = fs.createWriteStream('./output.txt');

readable.on('data', (chunk) => {
  const canContinue = writable.write(chunk);
  if (!canContinue) {
    // 暂停读取，等待缓冲区清空
    readable.pause();
    writable.once('drain', () => {
      // 恢复读取
      readable.resume();
    });
  }
});
```

#### 3.3.3 转换流 (Transform Stream)

```javascript
const { Transform } = require('stream');
const zlib = require('zlib');

// 自定义转换流 - 将大写字母转为小写
const toLowerCase = new Transform({
  transform(chunk, encoding, callback) {
    // 将数据转为小写并输出
    this.push(chunk.toString().toLowerCase());
    callback();
  }
});

// 使用转换流进行 gzip 压缩
const gzip = zlib.createGzip();
const readStream = fs.createReadStream('./input.txt');
const writeStream = fs.createWriteStream('./input.txt.gz');

readStream
  .pipe(gzip)
  .pipe(writeStream);

// 完整的 gzip 压缩示例
const compressFile = async (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    const input = fs.createReadStream(inputPath);
    const output = fs.createWriteStream(outputPath);
    const gzip = zlib.createGzip();

    input.pipe(gzip).pipe(output);

    output.on('finish', resolve);
    output.on('error', reject);
    input.on('error', reject);
  });
};

// 解压示例
const decompressFile = async (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    const input = fs.createReadStream(inputPath);
    const output = fs.createWriteStream(outputPath);
    const gunzip = zlib.createGunzip();

    input.pipe(gunzip).pipe(output);

    output.on('finish', resolve);
    output.on('error', reject);
    input.on('error', reject);
  });
};
```

### 3.4 Stream 实战案例

#### 文件上传处理（来自 FastDocument 项目）

```javascript
const fs = require('fs').promises;
const { join } = require('path');

/**
 * 大文件分片上传处理
 * 将大文件分成多个小块进行上传
 */
class LargeFileUploader {
  constructor(uploadDir) {
    this.uploadDir = uploadDir;
  }

  /**
   * 分片写入
   * @param {string} filename - 文件名
   * @param {Buffer} chunk - 数据块
   * @param {number} chunkIndex - 块索引
   */
  async writeChunk(filename, chunk, chunkIndex) {
    const chunkDir = join(this.uploadDir, `${filename}.chunks`);

    // 创建分片目录
    await fs.mkdir(chunkDir, { recursive: true });

    // 写入分片文件
    const chunkPath = join(chunkDir, `${chunkIndex}.part`);
    await fs.writeFile(chunkPath, chunk);

    return chunkPath;
  }

  /**
   * 合并分片
   * @param {string} filename - 文件名
   * @param {number} totalChunks - 总分片数
   */
  async mergeChunks(filename, totalChunks) {
    const chunkDir = join(this.uploadDir, `${filename}.chunks`);
    const outputPath = join(this.uploadDir, filename);

    // 创建写入流
    const writeStream = fs.createWriteStream(outputPath);

    // 按顺序读取并合并分片
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = join(chunkDir, `${i}.part`);
      const chunkData = await fs.readFile(chunkPath);
      writeStream.write(chunkData);
    }

    return new Promise((resolve, reject) => {
      writeStream.end();
      writeStream.on('finish', () => resolve(outputPath));
      writeStream.on('error', reject);
    });
  }
}
```

---

## 4. 模块系统

### 4.1 CommonJS 模块系统

Node.js 默认使用 CommonJS 模块系统，每个 JavaScript 文件是一个模块。

```javascript
// math.js - 导出模块
// 方式1: module.exports
module.exports = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
  PI: 3.14159
};

// 方式2: exports 简写
exports.multiply = (a, b) => a * b;
exports.divide = (a, b) => b !== 0 ? a / b : NaN;

// 注意：exports 是 module.exports 的引用
// 不能直接赋值 exports，会断开引用
// ❌ 错误
exports = { name: 'test' }; // 断开引用

// ✅ 正确
module.exports = { name: 'test' };
exports.name = 'test'; // 保持引用

// =========================================

// app.js - 引入模块
const math = require('./math'); // 自定义模块
const fs = require('fs'); // Node.js 内置模块
const path = require('path'); // Node.js 内置模块

console.log(math.add(1, 2)); // 3
console.log(math.multiply(3, 4)); // 12

// 模块导出函数或类
// =========================================

// logger.js
class Logger {
  constructor(name) {
    this.name = name;
  }

  log(message) {
    console.log(`[${this.name}] ${message}`);
  }

  error(message) {
    console.error(`[${this.name}] ERROR: ${message}`);
  }
}

module.exports = Logger;

// 使用
const Logger = require('./logger');
const logger = new Logger('App');
logger.log('应用程序启动');
```

### 4.2 模块加载机制

```javascript
// 模块查找顺序（require.resolve）
// 1. 检查是否为内置模块（fs, path, http 等）
// 2. 检查是否为文件（./, ../）
//    - 首先查找 ./file.js
//    - 然后查找 ./file/index.js
//    - 然后查找 ./file.json
// 3. 检查是否为 node_modules 目录中的模块
//    - 从当前目录向上查找 node_modules
//    - 最后查找全局 node_modules

// 模块缓存
// Node.js 会缓存首次加载的模块
const a = require('./module');
const b = require('./module');
console.log(a === b); // true，指向同一个对象

// 重新加载模块
delete require.cache[require.resolve('./module')];
const c = require('./module'); // 重新加载

// 动态加载
const moduleName = 'fs';
const fs = require(moduleName); // 动态加载内置模块
```

### 4.3 ES Module（Node.js 12+）

```javascript
// 注意：需要设置 "type": "module" 或使用 .mjs 扩展名

// math.mjs - 导出
export const add = (a, b) => a + b;
export const subtract = (a, b) => a - b;
export default class Calculator {
  constructor() {
    this.result = 0;
  }

  add(n) {
    this.result += n;
    return this;
  }
}

// app.mjs - 引入
import Calculator, { add, subtract } from './math.mjs';
// 或者 import * as math from './math.mjs';

console.log(add(1, 2)); // 3
console.log(subtract(5, 3)); // 2

const calc = new Calculator();
calc.add(10).add(5);
console.log(calc.result); // 15
```

### 4.4 npm 包管理

```bash
# 初始化项目
npm init -y # 使用默认配置
npm init # 交互式初始化

# 安装依赖
npm install express          # 安装生产依赖
npm install -D typescript    # 安装开发依赖
npm install -g nodemon       # 全局安装

# package.json 字段说明
{
  "name": "my-app",           # 包名
  "version": "1.0.0",         # 版本号 (semver)
  "main": "index.js",         # 入口文件
  "scripts": {                # npm 脚本
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest"
  },
  "dependencies": {           # 生产依赖
    "express": "^4.18.0",
    "mongoose": "^6.0.0"
  },
  "devDependencies": {        # 开发依赖
    "typescript": "^5.0.0",
    "jest": "^29.0.0"
  },
  "type": "module"           # 模块类型 (commonjs/esmodule)
}

# 查看依赖
npm list                     # 本地依赖
npm list -g                  # 全局依赖
npm list --depth=0           # 只显示顶层依赖

# 更新依赖
npm update                   # 更新所有依赖
npm update express           # 更新指定依赖

# 清理
npm cache clean --force      # 清理缓存
npm prune                   # 移除不需要的依赖
```

### 4.5 项目模块结构示例

以下代码来自 FastDocument 项目的实际目录结构：

```
src/
├── auth/                    # 认证模块
│   ├── auth.module.ts       # 模块定义
│   ├── auth.controller.ts   # 控制器
│   ├── auth.service.ts     # 业务逻辑
│   ├── auth.guard.ts       # 认证守卫
│   └── dto/                # 数据传输对象
├── documents/               # 文档模块
│   ├── documents.module.ts
│   ├── documents.controller.ts
│   ├── documents.service.ts
│   └── documents.gateway.ts # WebSocket 网关
└── common/                  # 公共模块
    ├── common.module.ts
    └── cache.service.ts    # 缓存服务
```

---

## 5. 核心模块详解

### 5.1 fs 模块（文件系统）

fs 模块提供文件系统操作功能，支持同步和异步两种方式。

```javascript
const fs = require('fs').promises; // 推荐使用 promises 版本
const fsSync = require('fs'); // 同步版本
const path = require('path');
const { promisify } = require('util');

// 异步 async/await 方式（推荐）
async function fileOperations() {
  const dir = './test-dir';
  const file = './test-dir/test.txt';

  // 创建目录
  await fs.mkdir(dir, { recursive: true });

  // 写入文件
  await fs.writeFile(file, 'Hello Node.js!', 'utf8');

  // 读取文件
  const content = await fs.readFile(file, 'utf8');
  console.log(content);

  // 更新文件
  await fs.appendFile(file, '\n追加内容', 'utf8');

  // 检查文件是否存在
  const exists = await fs.access(file)
    .then(() => true)
    .catch(() => false);

  // 获取文件信息
  const stats = await fs.stat(file);
  console.log('文件大小:', stats.size);
  console.log('创建时间:', stats.birthtime);
  console.log('是否为文件:', stats.isFile());
  console.log('是否为目录:', stats.isDirectory());

  // 读取目录
  const files = await fs.readdir('./test-dir');
  console.log('目录内容:', files);

  // 重命名
  await fs.rename(file, './test-dir/new-name.txt');

  // 删除文件
  await fs.unlink('./test-dir/new-name.txt');

  // 删除目录
  await fs.rmdir(dir, { recursive: true });
}

// 同步方式（不推荐，用于简单脚本）
function syncOperations() {
  fsSync.writeFileSync('test.txt', '内容');
  const content = fsSync.readFileSync('test.txt', 'utf8');
  fsSync.unlinkSync('test.txt');
}

// 回调方式
fs.readFile('test.txt', 'utf8', (err, data) => {
  if (err) throw err;
  console.log(data);
});

// 文件监听
fs.watch('./test-dir', { recursive: true }, (eventType, filename) => {
  console.log(`文件变化: ${eventType} - ${filename}`);
});

// 使用 chokidar 库（更强大的监听）
// npm install chokidar
const chokidar = require('chokidar');

const watcher = chokidar.watch('./test-dir', {
  ignored: /(^|[\/\\])\../,
  persistent: true,
  ignoreInitial: false
});

watcher
  .on('add', path => console.log(`文件添加: ${path}`))
  .on('change', path => console.log(`文件修改: ${path}`))
  .on('unlink', path => console.log(`文件删除: ${path}`));
```

**fs 模块在 FastDocument 项目中的实际使用：**

```javascript
// 来自 uploads.service.ts 的代码示例
import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * 文件上传服务
 * 展示了 fs 模块的真实使用场景
 */
class UploadsService {
  /**
   * 确保上传目录存在
   * 使用 recursive: true 自动创建多层目录
   */
  async ensureUploadDir(uploadDir) {
    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.error('创建上传目录失败:', error);
    }
  }

  /**
   * 写入文件
   * 使用 async/await 处理文件写入
   */
  async saveFile(filePath, buffer) {
    await fs.writeFile(filePath, buffer);
  }

  /**
   * 读取文件
   * 返回文件的 Buffer 对象
   */
  async readFile(filePath) {
    const buffer = await fs.readFile(filePath);
    return buffer;
  }

  /**
   * 删除文件
   * 用于删除已上传的文件
   */
  async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn('删除物理文件失败:', error);
    }
  }
}
```

### 5.2 path 模块（路径处理）

```javascript
const path = require('path');

// 路径解析
console.log(__filename); // 当前文件的完整路径
console.log(__dirname);  // 当前目录的完整路径

// 路径拼接
const fullPath = path.join(__dirname, 'subdir', 'file.txt');
console.log(fullPath);

// path.join vs path.resolve
console.log(path.join('/a', 'b', 'c'));  // /a/b/c（相对路径拼接）
console.log(path.resolve('/a', 'b'));   // /a/b（绝对路径，从根目录开始）

// 路径解析
const parsed = path.parse('/home/user/project/src/app.js');
console.log(parsed);
/*
{
  root: '/',
  dir: '/home/user/project/src',
  base: 'app.js',
  ext: '.js',
  name: 'app'
}
*/

// 获取文件扩展名
console.log(path.extname('app.js')); // .js
console.log(path.extname('image.png')); // .png

// 获取文件名和目录名
console.log(path.basename('/path/to/file.txt')); // file.txt
console.log(path.basename('/path/to/file.txt', '.txt')); // file

console.log(path.dirname('/path/to/file.txt')); // /path/to

// 路径格式化
const formatted = path.format({
  dir: '/home/user',
  name: 'config',
  ext: '.json'
});
console.log(formatted); // /home/user/config.json

// 路径判断
console.log(path.isAbsolute('/home/user')); // true
console.log(path.isAbsolute('./relative')); // false

// 路径标准化
console.log(path.normalize('/home//user/../user/project')); // /home/user/project

// 跨平台路径分隔符
console.log(path.sep); // Windows: \, Linux/Mac: /

// 路径转换
// 将 Windows 风格的路径转换为 POSIX 风格
console.log(path.toNamespacedPath('C:\\Users\\test')); // //?/C:/Users/test
```

### 5.3 http 模块（网络编程）

```javascript
const http = require('http');
const https = require('https');
const { URL } = require('url');

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
  // req - 请求对象
  // res - 响应对象

  // 设置响应头
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // 获取请求信息
  console.log('请求方法:', req.method);
  console.log('请求URL:', req.url);
  console.log('请求路径:', new URL(req.url, `http://${req.headers.host}`).pathname);

  // 获取请求体
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    console.log('请求体:', body);

    // 发送响应
    if (req.method === 'GET') {
      res.statusCode = 200;
      res.end(JSON.stringify({ message: 'GET 请求成功' }));
    } else if (req.method === 'POST') {
      res.statusCode = 201;
      res.end(JSON.stringify({ message: 'POST 请求成功', data: JSON.parse(body) }));
    } else {
      res.statusCode = 405;
      res.end(JSON.stringify({ error: '不支持的方法' }));
    }
  });
});

// 监听端口
server.listen(3000, () => {
  console.log('服务器运行在 http://localhost:3000');
});

// 创建 HTTP 请求
// GET 请求
const getRequest = () => {
  http.get('http://localhost:3000/api', (res) => {
    let data = '';

    res.on('data', chunk => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('响应:', JSON.parse(data));
    });
  });
};

// POST 请求
const postRequest = () => {
  const data = JSON.stringify({ name: 'test', value: 123 });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  const req = http.request(options, (res) => {
    let responseData = '';

    res.on('data', chunk => {
      responseData += chunk;
    });

    res.on('end', () => {
      console.log('响应:', JSON.parse(responseData));
    });
  });

  req.on('error', (err) => {
    console.error('请求错误:', err);
  });

  req.write(data);
  req.end();
};

// 使用 https 模块（安全的 HTTPS 请求）
const httpsRequest = () => {
  const options = {
    hostname: 'api.example.com',
    port: 443,
    path: '/data',
    method: 'GET',
    rejectUnauthorized: false // 生产环境应设为 true
  };

  const req = https.request(options, (res) => {
    // 处理响应
  });

  req.end();
};
```

### 5.4 crypto 模块（加密）

```javascript
const crypto = require('crypto');

// 1. 哈希算法
const hash = (data) => {
  // SHA-256 哈希
  const hash256 = crypto.createHash('sha256').update(data).digest('hex');
  console.log('SHA-256:', hash256);

  // SHA-512 哈希
  const hash512 = crypto.createHash('sha512').update(data).digest('hex');
  console.log('SHA-512:', hash512);

  // MD5（不推荐用于安全场景）
  const md5 = crypto.createHash('md5').update(data).digest('hex');
  console.log('MD5:', md5);

  return hash256;
};

// 2. HMAC - 带密钥的哈希
const hmac = (data, key) => {
  const hmacSha256 = crypto.createHmac('sha256', key)
    .update(data)
    .digest('hex');
  console.log('HMAC-SHA256:', hmacSha256);
  return hmacSha256;
};

// 3. 对称加密（AES）
const encryptAes = (plainText, key) => {
  // 生成随机的初始化向量（IV）
  const iv = crypto.randomBytes(16);

  // 创建加密器
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // 返回 IV 和加密数据（IV 需要传递给解密方）
  return {
    iv: iv.toString('hex'),
    encrypted
  };
};

const decryptAes = (encryptedData, key, ivHex) => {
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};

// 4. 非对称加密（RSA）
const { generateKeyPairSync, publicEncrypt, privateDecrypt } = crypto;

const generateKeyPair = () => {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'pkcs1',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs1',
      format: 'pem'
    }
  });

  return { publicKey, privateKey };
};

const rsaEncrypt = (data, publicKey) => {
  const encrypted = publicEncrypt(publicKey, Buffer.from(data));
  return encrypted.toString('base64');
};

const rsaDecrypt = (encryptedBase64, privateKey) => {
  const decrypted = privateDecrypt(
    Buffer.from(encryptedBase64, 'base64'),
    privateKey
  );
  return decrypted.toString('utf8');
};

// 5. 密码学安全随机数
const randomBytes = (length) => {
  const random = crypto.randomBytes(length);
  return random.toString('hex');
};

// 6. 计时安全比较（防止时序攻击）
const timingSafeCompare = (a, b) => {
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch (err) {
    return a === b;
  }
};

// 使用示例
// hash('Hello World');
// hmac('Hello World', 'my-secret-key');

// AES 加解密示例
const key = crypto.randomBytes(32).toString('hex'); // 256位密钥
const encrypted = encryptAes('Hello World!', key);
console.log('加密:', encrypted);
const decrypted = decryptAes(encrypted.encrypted, key, encrypted.iv);
console.log('解密:', decrypted);

// 来自 FastDocument 项目的实际加密代码示例
/*
const crypto = require('crypto');

class InvitationService {
  private readonly SECRET_SALT = 'FastDoc-Security-Industrial-Salt-2026';

  getTodayCode() {
    const today = dayjs().format('YYYY-MM-DD');
    const keySource = today + this.SECRET_SALT;

    // 1. 使用 SHA-256 生成 32 字节(256位)的密钥
    const key = crypto.createHash('sha256').update(keySource).digest();

    // 2. 使用 MD5 为今日生成一个确定的 16 字节初始化向量 (IV)
    const iv = crypto.createHash('md5').update(today).digest();

    // 3. 执行 AES-256-CBC 加密
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const plainText = `FastDoc-Daily-Access-${today}`;

    let encrypted = cipher.update(plainText, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    // 4. 为了增加复杂度，将 IV 与加密结果拼接并转为 Base64
    const finalCode = Buffer.from(iv.toString('hex') + ':' + encrypted).toString('base64');

    return finalCode;
  }
}
*/
```

### 5.5 zlib 模块（压缩）

```javascript
const zlib = require('zlib');
const fs = require('fs');

// 1. Gzip 压缩
const gzip = (input) => {
  return new Promise((resolve, reject) => {
    zlib.gzip(Buffer.from(input), (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

// 2. Gzip 解压
const gunzip = (input) => {
  return new Promise((resolve, reject) => {
    zlib.gunzip(input, (err, result) => {
      if (err) reject(err);
      else resolve(result.toString());
    });
  });
};

// 3. Deflate 压缩
const deflate = (input) => {
  return new Promise((resolve, reject) => {
    zlib.deflate(Buffer.from(input), (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

// 4. Inflate 解压
const inflate = (input) => {
  return new Promise((resolve, reject) => {
    zlib.inflate(input, (err, result) => {
      if (err) reject(err);
      else resolve(result.toString());
    });
  });
};

// 5. Brotli 压缩（更高压缩比，Node.js 11.7+）
const brotliCompress = (input) => {
  return new Promise((resolve, reject) => {
    zlib.brotliCompress(Buffer.from(input), (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

const brotliDecompress = (input) => {
  return new Promise((resolve, reject) => {
    zlib.brotliDecompress(input, (err, result) => {
      if (err) reject(err);
      else resolve(result.toString());
    });
  });
};

// 6. 使用流进行文件压缩
const compressFile = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    const input = fs.createReadStream(inputPath);
    const output = fs.createWriteStream(outputPath);
    const gzip = zlib.createGzip();

    input.pipe(gzip).pipe(output);

    output.on('finish', resolve);
    output.on('error', reject);
  });
};

const decompressFile = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    const input = fs.createReadStream(inputPath);
    const output = fs.createWriteStream(outputPath);
    const gunzip = zlib.createGunzip();

    input.pipe(gunzip).pipe(output);

    output.on('finish', resolve);
    output.on('error', reject);
  });
};

// 7. HTTP 响应压缩（Express 示例）
/*
const express = require('express');
const app = express();

// 自动压缩响应
app.use((req, res, next) => {
  // 检查客户端是否支持 gzip
  const acceptEncoding = req.headers['accept-encoding'] || '';

  if (acceptEncoding.includes('gzip')) {
    // 替换 res.send 方法
    const originalSend = res.send;
    res.send = function(body) {
      const gzip = zlib.createGzip();

      res.setHeader('Content-Encoding', 'gzip');
      res.removeHeader('Content-Length');

      // 压缩并发送
      const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body);
      gzip.pipe(res);
      gzip.end(buffer);
    };
  }

  next();
});
*/
```

---

## 6. 调试方法

### 6.1 控制台调试

```javascript
// 基础调试
console.log('调试信息');
console.warn('警告信息');
console.error('错误信息');

// 格式化输出
console.log('用户信息: %s, 年龄: %d', '张三', 25);
console.log('对象: %o', { name: 'test' });

// 调试技巧
const data = { id: 1, name: 'Test' };
console.log('数据:', JSON.stringify(data, null, 2)); // 格式化 JSON

// 条件调试
function debugFunction(value) {
  // 仅在开发环境输出
  if (process.env.NODE_ENV === 'development') {
    console.debug('调试:', { value, timestamp: new Date() });
  }
}

// 分组输出
console.group('用户操作');
console.log('登录');
console.log('查询数据');
console.log('登出');
console.groupEnd();

// 计时
console.time('fetchData');
fetchData().then(() => {
  console.timeEnd('fetchData');
});

// 断言
console.assert(process.env.NODE_ENV === 'production', '应为生产环境');
```

### 6.2 调试器

```javascript
// 使用 VS Code 调试配置
// .vscode/launch.json
/*
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "启动程序",
      "program": "${workspaceFolder}/index.js",
      "console": "integratedTerminal"
    },
    {
      "type": "node",
      "request": "attach",
      "name": "附加到进程",
      "port": 9229
    }
  ]
}
*/

// 使用 --inspect 标志启动
// node --inspect index.js
// node --inspect-brk index.js // 在第一行暂停

// 在代码中添加断点
function buggyFunction() {
  // debugger 会在调试器中暂停
  debugger;
  // 其他代码
}
```

### 6.3 日志管理

```javascript
const fs = require('fs');
const path = require('path');

// 简单的日志类
class Logger {
  constructor(logDir) {
    this.logDir = logDir;
    this.logFile = path.join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
  }

  write(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };

    const logLine = JSON.stringify(logEntry) + '\n';

    // 写入文件
    fs.appendFileSync(this.logFile, logLine);

    // 开发环境同时输出到控制台
    if (process.env.NODE_ENV === 'development') {
      console[level === 'ERROR' ? 'error' : 'log'](logLine);
    }
  }

  info(message, data) {
    this.write('INFO', message, data);
  }

  warn(message, data) {
    this.write('WARN', message, data);
  }

  error(message, data) {
    this.write('ERROR', message, data);
  }
}

const logger = new Logger('./logs');
logger.info('服务器启动', { port: 3000 });
logger.error('请求失败', { url: '/api/test', error: 'Timeout' });
```

### 6.4 性能监控

```javascript
// 1. 简单的性能计时
const performance = {
  marks: new Map(),

  mark(name) {
    this.marks.set(name, process.hrtime.bigint());
  },

  measure(name, startMark, endMark) {
    const start = this.marks.get(startMark);
    const end = this.marks.get(endMark);
    if (start && end) {
      const duration = Number(end - start) / 1000000; // 转换为毫秒
      console.log(`${name}: ${duration.toFixed(2)}ms`);
      return duration;
    }
  }
};

performance.mark('start');
// 执行耗时操作
performTask();
performance.mark('end');
performance.measure('任务耗时', 'start', 'end');

// 2. 内存使用监控
const memoryUsage = () => {
  const usage = process.memoryUsage();
  console.log({
    rss: `${Math.round(usage.rss / 1024 / 1024)} MB`,      // 驻留内存
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`, // 堆内存总量
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`,  // 堆内存使用
    external: `${Math.round(usage.external / 1024 / 1024)} MB`    // 外部内存
  });
};

// 3. CPU 使用监控
const cpuUsage = () => {
  const usage = process.cpuUsage();
  console.log({
    user: `${Math.round(usage.user / 1000000)}s`,  // 用户态 CPU 时间
    system: `${Math.round(usage.system / 1000000)}s` // 系统态 CPU 时间
  });
};

// 定期监控
setInterval(() => {
  console.log('\n--- 性能监控 ---');
  memoryUsage();
  cpuUsage();
}, 60000); // 每分钟输出一次
```

### 6.5 错误处理

```javascript
// 1. 同步错误处理
try {
  const result = JSON.parse('invalid json');
} catch (err) {
  console.error('解析错误:', err.message);
  console.error('错误堆栈:', err.stack);
}

// 2. 异步错误处理
async function asyncOperation() {
  try {
    await Promise.reject(new Error('异步错误'));
  } catch (err) {
    console.error('异步错误:', err.message);
  }
}

// 3. 未捕获的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
});

// 4. 全局异常处理器
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);

  // 记录日志
  fs.appendFileSync(
    './crash.log',
    `${new Date().toISOString()} - ${err.stack}\n`
  );

  // 优雅退出
  process.exit(1);
});

// 5. 错误传播
async function middleWare(ctx, next) {
  try {
    await next();
  } catch (err) {
    // 根据错误类型返回不同状态码
    if (err.name === 'ValidationError') {
      ctx.status = 400;
      ctx.body = { error: '验证失败', details: err.message };
    } else if (err.name === 'NotFoundError') {
      ctx.status = 404;
      ctx.body = { error: '资源不存在' };
    } else {
      ctx.status = 500;
      ctx.body = { error: '服务器内部错误' };
    }

    // 记录错误日志
    console.error('请求错误:', err);
  }
}
```

---

## 7. 实战案例

### 7.1 静态文件服务器

以下是一个完整的静态文件服务器实现：

```javascript
const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const { URL } = require('url');

/**
 * 静态文件服务器
 * 支持文件读取、目录列表、MIME 类型
 */
class StaticServer {
  constructor(rootDir, port = 8080) {
    this.rootDir = rootDir;
    this.port = port;
    this.mimeTypes = {
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
      '.txt': 'text/plain'
    };
  }

  /**
   * 获取文件的 MIME 类型
   */
  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return this.mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * 处理文件请求
   */
  async handleFile(filePath, res) {
    try {
      const stats = await fs.stat(filePath);

      if (stats.isDirectory()) {
        // 如果是目录，查找 index.html
        return await this.handleFile(path.join(filePath, 'index.html'), res);
      }

      // 读取并返回文件
      const content = await fs.readFile(filePath);
      const mimeType = this.getMimeType(filePath);

      res.writeHead(200, {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=3600'
      });
      res.end(content);
    } catch (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      }
    }
  }

  /**
   * 处理目录列表请求
   */
  async handleDirectory(dirPath, reqUrl, res) {
    try {
      const files = await fs.readdir(dirPath);

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${reqUrl}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            a { color: #0066cc; text-decoration: none; }
            a:hover { text-decoration: underline; }
            li { margin: 8px 0; }
          </style>
        </head>
        <body>
          <h1>目录: ${reqUrl}</h1>
          <ul>
            ${reqUrl !== '/' ? '<li><a href="../">..</a></li>' : ''}
            ${files.map(file => `<li><a href="${file}">${file}</a></li>`).join('\n')}
          </ul>
        </body>
        </html>
      `;

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Internal Server Error');
    }
  }

  /**
   * 请求处理主函数
   */
  async handleRequest(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    let filePath = path.join(this.rootDir, url.pathname);

    // 防止路径遍历攻击
    if (!filePath.startsWith(this.rootDir)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('403 Forbidden');
      return;
    }

    try {
      const stats = await fs.stat(filePath);

      if (stats.isDirectory()) {
        await this.handleDirectory(filePath, url.pathname, res);
      } else {
        await this.handleFile(filePath, res);
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      }
    }
  }

  /**
   * 启动服务器
   */
  start() {
    const server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    server.listen(this.port, () => {
      console.log(`静态文件服务器运行在 http://localhost:${this.port}`);
      console.log(`根目录: ${this.rootDir}`);
    });

    return server;
  }
}

// 使用示例
const server = new StaticServer('./public', 8080);
server.start();
```

### 7.2 CLI 工具

```javascript
#!/usr/bin/env node

/**
 * 命令行工具示例
 * 使用 commander 或 yargs 处理命令行参数
 */
const { Command } = require('commander');
const fs = require('fs').promises;
const path = require('path');

const program = new Command();

program
  .name('file-tool')
  .description('文件处理命令行工具')
  .version('1.0.0');

// 命令: analyze - 分析文件
program
  .command('analyze <file>')
  .description('分析文件信息')
  .option('-s, --stats', '显示详细统计信息')
  .action(async (file, options) => {
    try {
      const stats = await fs.stat(file);

      console.log(`文件: ${path.basename(file)}`);
      console.log(`路径: ${path.resolve(file)}`);
      console.log(`大小: ${stats.size} bytes`);
      console.log(`创建时间: ${stats.birthtime}`);
      console.log(`修改时间: ${stats.mtime}`);

      if (options.stats) {
        const content = await fs.readFile(file);
        console.log(`\n详细统计:`);
        console.log(`- 字节数: ${content.length}`);
        console.log(`- 行数: ${content.toString().split('\n').length}`);
      }
    } catch (err) {
      console.error(`错误: ${err.message}`);
      process.exit(1);
    }
  });

// 命令: find - 查找文件
program
  .command('find <directory> <pattern>')
  .description('在目录中查找文件')
  .option('-r, --recursive', '递归搜索子目录')
  .action(async (directory, pattern, options) => {
    async function search(dir, pattern, recursive) {
      const files = await fs.readdir(dir);

      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stats = await fs.stat(fullPath);

        if (stats.isDirectory() && recursive) {
          await search(fullPath, pattern, recursive);
        } else if (stats.isFile() && file.includes(pattern)) {
          console.log(fullPath);
        }
      }
    }

    try {
      await search(directory, pattern, options.recursive);
    } catch (err) {
      console.error(`错误: ${err.message}`);
      process.exit(1);
    }
  });

// 命令: template - 生成模板文件
program
  .command('template <type> <filename>')
  .description('生成模板文件')
  .option('-d, --description <text>', '文件描述')
  .action(async (type, filename, options) => {
    const templates = {
      react: `import React from 'react';

export default function ${filename.replace('.jsx', '')}() {
  return (
    <div>
      {/* TODO: 实现组件 */}
    </div>
  );
}
`,
      component: `/**
 * ${options.description || filename} 组件
 */

export default function ${filename.replace('.js', '')}() {
  return (
    <div>
      {/* TODO: 实现组件 */}
    </div>
  );
}
`,
      service: `/**
 * ${filename} 服务
 */

class ${filename.replace('.js', '')}Service {
  constructor() {
    // 初始化
  }

  async findAll() {
    // 查询所有记录
  }

  async findById(id) {
    // 根据 ID 查询
  }

  async create(data) {
    // 创建记录
  }

  async update(id, data) {
    // 更新记录
  }

  async delete(id) {
    // 删除记录
  }
}

export default new ${filename.replace('.js', '')}Service();
`
    };

    const content = templates[type];
    if (!content) {
      console.error(`未知模板类型: ${type}`);
      console.log(`支持的类型: react, component, service`);
      process.exit(1);
    }

    try {
      await fs.writeFile(filename, content);
      console.log(`已创建文件: ${filename}`);
    } catch (err) {
      console.error(`错误: ${err.message}`);
      process.exit(1);
    }
  });

// 解析命令行参数
program.parse(process.argv);
```

---

## 附录

### 附录 A: 常用 npm 包

| 包名 | 用途 | 安装命令 |
|------|------|----------|
| express | Web 框架 | `npm i express` |
| koa | 下一代 Web 框架 | `npm i koa` |
| nestjs | 企业级框架 | `npm i @nestjs/core` |
| mongoose | MongoDB ODM | `npm i mongoose` |
| typeorm | ORM 框架 | `npm i typeorm` |
| pg | PostgreSQL 驱动 | `npm i pg` |
| redis | Redis 客户端 | `npm i redis` |
| jsonwebtoken | JWT 认证 | `npm i jsonwebtoken` |
| bcrypt | 密码加密 | `npm i bcrypt` |
| cors | 跨域中间件 | `npm i cors` |
| dotenv | 环境变量 | `npm i dotenv` |
| winston | 日志库 | `npm i winston` |

### 附录 B: 常用命令

```bash
# Node.js 基础命令
node app.js                  # 运行应用
node --version              # 查看版本
node --watch app.js         # 监听文件变化（Node.js 18+）

# npm 命令
npm init -y                 # 初始化项目
npm install                  # 安装依赖
npm install <package>        # 安装包
npm run <script>            # 运行脚本
npm list                    # 查看依赖
npm outdated                # 查看过期依赖

# npx 命令
npx create-react-app my-app  # 创建 React 项目
npx tsc --init              # 初始化 TypeScript
```

### 附录 C: 常见问题

| 问题 | 解决方案 |
|------|----------|
| 模块未找到 | 检查 node_modules 和路径 |
| 内存溢出 | 增加 --max-old-space-size |
| 端口被占用 | 杀死占用进程或更换端口 |
| 异步错误未捕获 | 使用 try-catch 和 .catch() |
| 路径问题 | 使用 path 模块处理路径 |

---

## 八、Node.js 常见面试题详解

### 8.1 事件循环相关面试题

**面试题1：描述Node.js事件循环的工作原理**

**参考答案：**
Node.js 的事件循环是实现非阻塞 I/O 的核心机制，它让单线程的 JavaScript 能够高效处理大量并发请求。

```
事件循环的六个阶段：

┌─────────────────────────────────────────────────────────────┐
│                     事件循环执行顺序                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ① Timers（定时器阶段）                                    │
│      └─ 执行 setTimeout() 和 setInterval() 的回调          │
│                                                             │
│   ② Pending Callbacks（待定回调）                           │
│      └─ 执行被延迟的 I/O 错误回调                           │
│                                                             │
│   ③ Idle, Prepare（内部准备）                              │
│      └─ Node.js 内部使用                                    │
│                                                             │
│   ④ Poll（轮询阶段）★★★★★ 核心阶段                        │
│      └─ 获取新的 I/O 事件，执行相关回调                     │
│      └─ 如果没有定时器，会阻塞等待 I/O                      │
│                                                             │
│   ⑤ Check（检查阶段）                                      │
│      └─ 执行 setImmediate() 的回调                         │
│                                                             │
│   ⑥ Close Callbacks（关闭回调）                            │
│      └─ 执行关闭事件的回调，如 socket.on('close')          │
│                                                             │
└─────────────────────────────────────────────────────────────┘

微任务队列（穿插在每个阶段之间）：
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   微任务（microtask）优先级高于宏任务（macrotask）           │
│                                                             │
│   高优先级：process.nextTick() > Promise.then()             │
│                                                             │
│   执行规则：每个宏任务执行完毕后，立即清空所有微任务队列       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**关键点：**
- `setTimeout` 在 Timers 阶段执行
- `setImmediate` 在 Check 阶段执行
- 如果两者同时存在，谁先注册谁先执行
- 微任务在每个阶段结束后都会执行

---

**面试题2：setTimeout(fn, 0) 和 setImmediate(fn) 的区别**

**参考答案：**

```javascript
// 经典面试题：两者的执行顺序
setTimeout(() => {
  console.log('setTimeout');  // 可能在 setImmediate 之前或之后
}, 0);

setImmediate(() => {
  console.log('setImmediate');  // 可能在 setTimeout 之前或之后
});

// 但在 I/O 回调中，setImmediate 总是先执行
fs.readFile('file.txt', () => {
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate'));  // 始终先输出
  // 输出顺序: immediate -> timeout
});
```

**核心区别：**

| 特性 | setTimeout | setImmediate |
|------|------------|--------------|
| 所属阶段 | Timers 阶段 | Check 阶段 |
| 执行时机 | 定时器到期后 | Poll 阶段完成后 |
| 精度 | 最低 1ms | 立即执行 |
| 适用场景 | 延迟执行 | 异步任务完成后立即执行 |

---

**面试题3：什么是Node.js的宏任务和微任务？**

**参考答案：**

```
┌─────────────────────────────────────────────────────────────┐
│                    任务优先级体系                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  最高优先级                                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 1. process.nextTick()                               │   │
│  │    - 最高优先级微任务                               │   │
│  │    - 会在当前操作完成后、下一个微任务前立即执行     │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 2. Promise.then() / async/await                    │   │
│  │    - 标准微任务                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  宏任务（按执行顺序）                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 3. setTimeout / setInterval (Timers)              │   │
│  │ 4. I/O 回调 (Poll)                               │   │
│  │ 5. setImmediate (Check)                          │   │
│  │ 6. close 事件回调 (Close)                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**代码验证：**

```javascript
console.log('1 - 同步代码开始');

setTimeout(() => console.log('2 - setTimeout'), 0);

Promise.resolve()
  .then(() => console.log('3 - Promise.then'));

process.nextTick(() => {
  console.log('4 - nextTick');
  process.nextTick(() => console.log('5 - 嵌套nextTick'));
});

console.log('6 - 同步代码结束');

// 输出顺序：1 -> 6 -> 4 -> 5 -> 3 -> 2
```

---

### 8.2 模块系统相关面试题

**面试题4：Node.js的模块缓存机制是什么？**

**参考答案：**

```javascript
// module-a.js
console.log('module-a 被加载');
module.exports = { name: 'moduleA' };

// main.js
const a1 = require('./module-a');  // 输出: module-a 被加载
const a2 = require('./module-a');  // 不输出，直接从缓存返回

console.log(a1 === a2);  // true - 同一个对象
```

**缓存机制原理：**
- Node.js 对每个模块只执行一次
- 缓存键是模块的绝对路径
- 模块是单例模式，第二次 require 返回缓存对象

**实际应用场景：**

```javascript
// 场景1：热更新插件系统
// 清除缓存以实现热更新
delete require.cache[require.resolve('./plugin')];

// 场景2：测试中的Mock
// 缓存允许我们在测试中替换模块行为
jest.mock('./database');

// 场景3：配置单例
// 多次require返回同一个配置实例
const config = require('./config');
```

---

**面试题5：CommonJS和ES Module的区别？**

**参考答案：**

```javascript
// ┌─────────────────────────────────────────────────────────────┐
// │              CommonJS vs ES Module 对比                       │
// ├─────────────────────────────────────────────────────────────┤
// │                                                             │
// │  CommonJS (CJS)              ES Module (ESM)                │
// │  ────────────────             ───────────────               │
// │  require() 动态导入           import 静态导入                │
// │  module.exports 导出           export 导出                    │
// │  同步加载                     异步加载                       │
// │  运行时常量                   编译时常量                    │
// │  运行时可拼接路径            必须使用静态字符串             │
// │                                                             │
// └─────────────────────────────────────────────────────────────┘

// CommonJS 示例
const fs = require('fs');
const path = require('path');
module.exports = { foo: 'bar' };

// ES Module 示例
import fs from 'fs';
import { readFile } from 'fs/promises';
export const foo = 'bar';
export default class MyClass {}

// 混合使用警告
// ❌ 错误：ESM 中不能使用 require
import { readFile } from 'fs';
// const data = require('./data.json');  // 这会报错！

// ✅ 正确做法：使用 import()
const data = await import('./data.json');
```

---

### 8.3 内存管理与性能相关面试题

**面试题6：Node.js的内存限制是多少？如何突破？**

**参考答案：**

```javascript
// Node.js 基于 V8 引擎，V8 对堆内存有限制
// - 32位系统：约 512MB
// - 64位系统：约 1.4GB（默认）
// - 可通过命令行参数调整

// 查看当前内存限制
console.log('V8 堆内存限制:', v8.getHeapStatistics().heap_size_limit);

// 突破内存限制的方法
// 方法1：命令行参数
// node --max-old-space-size=4096 app.js  // 4GB
// node --max-new-space-size=2048 app.js  // 新生代 2MB

// 方法2：V8 API
// 在代码中动态调整（需要管理员权限）
// v8.setFlagsFromString('--max-old-space-size=4096');

// 方法3：使用流处理大文件
// 避免将大文件一次性读入内存
const fs = require('fs');
const readStream = fs.createReadStream('big-file.txt', 'utf8');
readStream.on('data', (chunk) => {
  // 每次只处理一块数据
  processChunk(chunk);
});
```

---

**面试题7：什么是Node.js的垃圾回收机制？**

**参考答案：**

```
┌─────────────────────────────────────────────────────────────┐
│                    V8 垃圾回收机制                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  内存分区：                                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 1. 新生代（New Space）1-8MB                         │   │
│  │    - 频繁分配和回收                                 │   │
│  │    - Scavenge 算法（快速回收）                      │   │
│  │    - 分为 From 和 To 两个半区                       │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 2. 老生代（Old Space）数百MB                       │   │
│  │    - 存活时间较长的对象                             │   │
│  │    - Mark-Sweep（标记清除）                        │   │
│  │    - Mark-Compact（标记整理）                       │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 3. 大对象区（Large Object Space）                  │   │
│  │    - 体积过大的对象                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  GC 触发场景：                                              │
│  - 新生代满时自动触发 Scavenge                             │
│  - 老生代达到一定比例时触发 Full GC                        │
│  - 手动调用 global.gc()（需要 --expose-gc）                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**内存泄漏的常见原因：**

```javascript
// 常见内存泄漏场景
// 1. 全局变量泄漏
global.leakedData = [];  // 永不释放
function addLeak() {
  global.leakedData.push(new Array(10000));
}

// 2. 闭包泄漏
function createClosure() {
  const largeData = new Array(100000);
  return () => {
    // 闭包引用了 largeData，即使函数返回也不释放
    console.log(largeData.length);
  };
}

// 3. 事件监听器未清理
server.on('connection', handler);
// 正确的做法：使用 once 或手动移除
server.once('connection', handler);
// server.removeListener('connection', handler);

// 4. 定时器未清理
const timer = setInterval(() => {
  // 定时任务
}, 1000);
clearInterval(timer);  // 使用完毕后必须清理
```

---

### 8.4 异步编程相关面试题

**面试题8：Promise、async/await 和回调函数有什么区别？**

**参考答案：**

```javascript
// ┌─────────────────────────────────────────────────────────────┐
// │              异步编程方式对比                                 │
// ├─────────────────────────────────────────────────────────────┤
// │                                                             │
// │  回调函数（Callback）                                        │
// │  ───────────────────                                        │
// │  优点：简单直观，适用于一次性任务                           │
// │  缺点：回调地狱（Callback Hell），错误处理困难              │
// │                                                             │
// │  Promise                                                   │
// │  ──────                                                    │
// │  优点：链式调用，错误冒泡，可组合                          │
// │  缺点：语法仍然繁琐                                        │
// │                                                             │
// │  async/await                                                │
// │  ───────────                                                │
// │  优点：同步语法，错误处理简单，代码可读性好                 │
// │  缺点：无法并行（需要 Promise.all）                        │
// │                                                             │
// └─────────────────────────────────────────────────────────────┘

// 回调地狱示例
fs.readFile('a.txt', (err, data) => {
  if (err) return handleError(err);
  fs.readFile(data, (err, data) => {
    if (err) return handleError(err);
    fs.readFile(data, (err, data) => {
      if (err) return handleError(err);
      // 继续嵌套...
    });
  });
});

// Promise 链式调用
fs.promises.readFile('a.txt')
  .then(data => fs.promises.readFile(data))
  .then(data => fs.promises.readFile(data))
  .catch(handleError);

// async/await 同步语法
async function readAll() {
  try {
    const data1 = await fs.promises.readFile('a.txt');
    const data2 = await fs.promises.readFile(data1);
    const data3 = await fs.promises.readFile(data2);
    return data3;
  } catch (err) {
    handleError(err);
  }
}
```

---

**面试题9：如何处理异步错误？**

**参考答案：**

```javascript
// 错误处理最佳实践

// 1. try-catch（async/await）
async function fetchData() {
  try {
    const data = await fetchFromAPI();
    return data;
  } catch (error) {
    // 必须处理错误，否则会吞掉
    console.error('API请求失败:', error.message);
    throw error;  // 重新抛出以便上层处理
  }
}

// 2. Promise.catch
fetchFromAPI()
  .then(data => process(data))
  .catch(error => {
    console.error('处理失败:', error);
    return defaultData;  // 返回默认值
  })
  .finally(() => {
    console.log('请求完成');  // 无论成功失败都执行
  });

// 3. 未处理的Promise rejection
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  // 记录日志、发送告警
});

// 4. 全局错误处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  // 必须优雅退出，否则状态可能不一致
  process.exit(1);
});

// 5. Express/Koa 错误中间件
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = {
      success: false,
      message: err.message,
      code: err.code
    };
    // 记录日志
    logger.error(err);
  }
});
```

---

### 8.5 进程与集群相关面试题

**面试题10：Node.js如何实现多进程？child_process和cluster的区别？**

**参考答案：**

```javascript
// ┌─────────────────────────────────────────────────────────────┐
// │              Node.js 多进程方案对比                           │
// ├─────────────────────────────────────────────────────────────┤
// │                                                             │
// │  child_process（子进程）                                     │
// │  ──────────────────────                                      │
// │  - spawn()：衍生子进程，流式处理大输出                      │
// │  - exec()：执行Shell命令，缓冲输出（可能OOM）               │
// │  - execFile()：执行可执行文件                               │
// │  - fork()：衍生Node.js子进程，建立IPC通道                   │
// │                                                             │
// │  cluster（集群）                                            │
// │  ──────────                                                │
// │  - 基于 child_process.fork()                               │
// │  - 自动实现负载均衡（Round-Robin）                          │
// │  - 自动处理Worker崩溃重启                                   │
// │  - 共享端口（由Master监听分发给Worker）                     │
// │                                                             │
// └─────────────────────────────────────────────────────────────┘

// child_process.fork() 示例
const { fork } = require('child_process');

// 父进程
const worker = fork('./worker.js');
worker.send({ cmd: 'start', data: 1000 });
worker.on('message', (msg) => {
  console.log('收到子进程消息:', msg.result);
});

// worker.js
process.on('message', (msg) => {
  const result = heavyComputation(msg.data);
  process.send({ result });
});

// cluster 示例
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  console.log(`主进程 ${process.pid} 启动`);
  // 创建Worker
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  // 监听Worker退出
  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} 退出，重启中...`);
    cluster.fork();
  });
} else {
  // Worker进程执行HTTP服务
  require('./server.js');
}
```

---

**文档信息**

- 作者：Node.js 教学团队
- 创建时间：2026年3月
- 版本：1.0.0
- 参考资料：Node.js 官方文档、FastDocument 项目源码
