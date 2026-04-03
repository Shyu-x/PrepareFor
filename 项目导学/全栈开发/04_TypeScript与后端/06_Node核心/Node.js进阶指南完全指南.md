# Node.js 进阶指南完全指南

## 目录

1. [Node.js 架构](#1-nodejs-架构)
2. [异步编程](#2-异步编程)
3. [Streams 流式处理](#3-streams-流式处理)
4. [进程管理](#4-进程管理)
5. [内存管理](#5-内存管理)
6. [网络编程](#6-网络编程)
7. [安全](#7-安全)
8. [性能优化](#8-性能优化)
9. [测试](#9-测试)
10. [调试](#10-调试)
11. [实战：手写框架](#11-实战手写框架)
12. [企业架构](#12-企业架构)

---

## 1. Node.js 架构

### 1.1 V8 引擎原理

Node.js 的核心是 Google Chrome 浏览器使用的 V8 JavaScript 引擎。V8 是一个高性能的 JavaScript 引擎，它采用 JIT（Just-In-Time）编译技术，将 JavaScript 代码直接编译为机器码执行，这使得 JavaScript 的执行速度可以与本地编译的程序相媲美。

**V8 引擎的核心特性：**

```javascript
// V8 引擎通过隐藏类（Hidden Classes）优化对象属性访问
// 每次创建对象时，V8 会关联一个隐藏类

// 示例：创建多个相似结构的对象
function Point(x, y) {
  this.x = x;
  this.y = y;
}

// V8 会为这些对象创建相同的隐藏类
const p1 = new Point(1, 2);
const p2 = new Point(3, 4);

// 如果动态添加属性，会导致隐藏类变化，性能下降
p1.z = 3;  // 这会创建新的隐藏类
```

**JIT 编译流程：**

```
源代码 → 解析器 → AST（抽象语法树）→ 解释器（Ignition）→ 字节码
                                                      ↓
                                            热点代码识别
                                                      ↓
                                            优化编译器（TurboFan）→ 优化机器码
                                                      ↓
                                            去优化（Deoptimization）→ 回退到字节码
```

**V8 的内存布局：**

```javascript
// V8 堆内存分为多个区域
// 新生代：短生命周期对象（1-8MB）
// 老生代：长生命周期对象（可达数GB）

// 查看 V8 堆内存状态
const v8 = require('v8');
console.log(v8.getHeapStatistics());
// 输出示例：
// {
//   total_heap_size: 1097728,
//   total_heap_size_executable: 4194304,
//   total_physical_size: 1023484,
//   total_available_size: 2172641280,
//   used_heap_size: 1023484,
//   heap_size_limit: 2172641280,
//   malloced_memory: 262144,
//   peak_malloced_memory: 262144,
//   does_zap_garbage: 0
// }
```

### 1.2 libuv 事件循环

libuv 是 Node.js 底层的跨平台异步 I/O 库，它封装了不同操作系统的异步 API，提供统一的事件循环机制。libuv 是 Node.js 实现高性能的核心组件。

**libuv 事件循环阶段：**

```javascript
// libuv 事件循环的六个阶段
// 每个阶段都有特定的任务队列

/*
  ┌──────────────────────────────────────────────┐
  │                   事件循环                      │
  │                                               │
  │  ┌─────────────────────────────────────────┐  │
  │  │  阶段1: timers（定时器阶段）              │  │
  │  │  执行 setTimeout() 和 setInterval()    │  │
  │  │  的回调                                  │  │
  │  └─────────────────────────────────────────┘  │
  │                      ↓                         │
  │  ┌─────────────────────────────────────────┐  │
  │  │  阶段2: pending callbacks              │  │
  │  │  执行上一轮循环延时的 I/O 回调            │  │
  │  └─────────────────────────────────────────┘  │
  │                      ↓                         │
  │  ┌─────────────────────────────────────────┐  │
  │  │  阶段3: idle, prepare                  │  │
  │  │  内部使用，准备下一个 poll 阶段          │  │
  │  └─────────────────────────────────────────┘  │
  │                      ↓                         │
   │  ┌─────────────────────────────────────────┐  │
  │  │  阶段4: poll（轮询阶段）                 │  │
  │  │  获取新的 I/O 事件，执行 I/O 回调        │  │
  │  └─────────────────────────────────────────┘  │
  │                      ↓                         │
  │  ┌─────────────────────────────────────────┐  │
  │  │  阶段5: check（检查阶段）                │  │
  │  │  执行 setImmediate() 的回调             │  │
  │  └─────────────────────────────────────────┘  │
  │                      ↓                         │
  │  ┌─────────────────────────────────────────┐  │
  │  │  阶段6: close callbacks                │  │
  │  │  执行关闭事件的回调（如 socket.onClose） │  │
  │  └─────────────────────────────────────────┘  │
  └──────────────────────────────────────────────┘
*/
```

**setTimeout vs setImmediate 的执行顺序：**

```javascript
// 这是一个经典的 Node.js 事件循环面试题
// 执行顺序取决于具体的调用情境

// 情境1：主模块中调用
setTimeout(() => {
  console.log('setTimeout - 阶段1');  // 通常先执行
}, 0);

setImmediate(() => {
  console.log('setImmediate - 阶段5');  // 通常后执行
});

// 输出顺序不固定，取决于系统性能
// 因为定时器回调在 timers 阶段，而 setImmediate 在 check 阶段

// 情境2：在 I/O 循环中调用
const fs = require('fs');

fs.readFile('./test.txt', () => {
  // I/O 回调在 poll 阶段执行完后，进入 check 阶段
  setTimeout(() => {
    console.log('setTimeout');
  }, 0);

  setImmediate(() => {
    console.log('setImmediate');
  });
});

// 在 I/O 回调中，setImmediate 几乎总是先于 setTimeout 执行
// 因为此时事件循环位于 check 阶段
```

### 1.3 线程池

Node.js 虽然是单线程模型，但使用 libuv 的线程池来处理耗时的异步操作，如文件 I/O、DNS 查询、压缩等。默认线程池大小为 4，可以根据需要调整。

**线程池工作原理：**

```javascript
// libuv 默认线程池大小
// 可以通过环境变量 UV_THREADPOOL_SIZE 修改

// 设置线程池大小为 32
process.env.UV_THREADPOOL_SIZE = '32';

const crypto = require('crypto');
const fs = require('fs');

// crypto.pbkdf2 是使用线程池的操作
// 当处理大量加密请求时，线程池大小会影响性能
console.time('pbkdf2');
crypto.pbkdf2('password', 'salt', 100000, 64, 'sha512', (err, key) => {
  console.timeEnd('pbkdf2');
  // 在线程池中执行，结果通过回调返回
});

// 文件操作也使用线程池
console.time('readFile');
fs.readFile('./large-file.txt', (err, data) => {
  console.timeEnd('readFile');
  // 大文件读取会被分配到线程池处理
});
```

**线程池大小对性能的影响：**

```javascript
// 线程池大小规划
// 默认值：4，最大值：1024

// 调整线程池大小的场景
// 1. 大量文件 I/O 操作
// 2. 加密操作密集型应用
// 3. DNS 查询密集型应用

// 性能测试：不同线程池大小的对比
const threads = [4, 8, 16, 32, 64];
const crypto = require('crypto');

function benchmarkThreadpoolSize(size) {
  process.env.UV_THREADPOOL_SIZE = size.toString();
  const start = Date.now();
  let completed = 0;
  const total = 100;

  for (let i = 0; i < total; i++) {
    crypto.pbkdf2('password', 'salt', 10000, 32, 'sha512', () => {
      completed++;
      if (completed === total) {
        console.log(`线程池大小 ${size}: ${Date.now() - start}ms`);
      }
    });
  }
}

// 注意：实际项目中需要重启进程才能生效
```

### 1.4 模块系统

Node.js 采用 CommonJS 模块规范，每个文件都是一个独立的作用域，通过 `require()` 导入，通过 `module.exports` 或 `exports` 导出。

**模块加载机制：**

```javascript
// 模块解析顺序：缓存 → 内置模块 → 文件模块 → 目录模块 → node_modules

// 1. 内置模块（原生模块）
const fs = require('fs');           // 文件系统模块
const http = require('http');       // HTTP 模块
const path = require('path');       // 路径处理

// 2. 文件模块（相对路径或绝对路径）
const myModule = require('./myModule');        // 当前目录
const myModule2 = require('../lib/myModule');   // 上级目录
const myModule3 = require('/absolute/path');   // 绝对路径

// 3. 目录模块（package.json main 字段）
// const myPkg = require('./myPackage');

// 4. node_modules 查找
// 从当前目录向上逐级查找，直到根目录
```

**模块缓存机制：**

```javascript
// Node.js 会对已加载的模块进行缓存
// 首次 require 后，后续 require 会直接返回缓存

// module1.js
console.log('模块首次加载');
module.exports = { value: Date.now() };

// app.js
const m1 = require('./module1');
const m2 = require('./module1');

console.log(m1 === m2);  // true，指向同一对象
console.log(m1.value === m2.value);  // true，值也相同（因为是同一时刻加载的）

// 清除模块缓存（罕见场景使用）
delete require.cache[require.resolve('./module1')];
```

**exports 与 module.exports 的区别：**

```javascript
// exports 是 module.exports 的引用
// 记住：给 exports 赋值会断开与 module.exports 的连接

// 正确方式 1：添加属性
exports.foo = 'foo';
exports.bar = function() { return 'bar'; };

// 正确方式 2：直接赋值给 module.exports
module.exports = {
  foo: 'foo',
  bar: function() { return 'bar'; }
};

// 错误方式：直接给 exports 赋值（会断开连接）
exports = { foo: 'foo' };  // 这不会导出任何内容！
```

---

## 2. 异步编程

### 2.1 回调模式

回调是 Node.js 异步编程的基础模式，但处理多层嵌套时会导致"回调地狱"问题。

**回调地狱示例与解决：**

```javascript
// 回调地狱：多层嵌套的代码难以阅读和维护
doSomething(function(result) {
  doSomethingElse(result, function(newResult) {
    doThirdThing(newResult, function(finalResult) {
      console.log('完成: ' + finalResult);
    }, failureCallback);
  }, failureCallback);
}, failureCallback);

// 解决方案 1：保持扁平化的命名约定
function task1(callback) {
  doSomething(function(err, result) {
    if (err) return callback(err);
    task2(result, callback);
  });
}

function task2(result, callback) {
  doSomethingElse(result, function(err, newResult) {
    if (err) return callback(err);
    task3(newResult, callback);
  });
}

// 解决方案 2：模块化拆分
const step1 = require('./steps/step1');
const step2 = require('./steps/step2');
const step3 = require('./steps/step3');

// 每个步骤独立，代码更清晰
```

### 2.2 Promise

Promise 是 ES6 引入的异步编程解决方案，解决了回调地狱问题，提供了更清晰的错误处理和链式调用。

**Promise 基础用法：**

```javascript
// 创建 Promise
const myPromise = new Promise((resolve, reject) => {
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

// 使用 Promise
myPromise
  .then(result => console.log(result))
  .catch(err => console.error(err))
  .finally(() => console.log('操作完成'));

// Promise 静态方法
Promise.resolve('直接成功')           // 创建已成功的 Promise
Promise.reject(new Error('直接失败'))  // 创建已失败的 Promise
Promise.all([p1, p2, p3])              // 全部成功才成功
Promise.allSettled([p1, p2, p3])       // 等待所有 Promise 结束
Promise.race([p1, p2, p3])             // 返回最先完成的结果
Promise.any([p1, p2, p3])              // 返回最先成功的结果
```

**Promise 链式调用：**

```javascript
// Promise 链式调用
// 每个 .then() 返回新的 Promise

const fetchUser = (userId) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (userId > 0) {
        resolve({ id: userId, name: '张三' });
      } else {
        reject(new Error('无效的用户ID'));
      }
    }, 100);
  });
};

const fetchUserPosts = (user) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([`${user.name}的第一篇文章`, `${user.name}的第二篇文章`]);
    }, 100);
  });
};

fetchUser(1)
  .then(user => {
    console.log('获取用户:', user.name);
    return fetchUserPosts(user);  // 返回新的 Promise
  })
  .then(posts => {
    console.log('用户文章:', posts);
  })
  .catch(err => {
    console.error('错误:', err.message);
  });
```

### 2.3 async/await

async/await 是 ES2017 引入的异步编程语法糖，让异步代码看起来像同步代码，极大提高了可读性。

**async/await 基础用法：**

```javascript
// async 函数自动返回 Promise
async function fetchData() {
  return '数据';
}

// 等同于
function fetchData() {
  return Promise.resolve('数据');
}

// await 暂停函数执行，等待 Promise 解决
async function main() {
  console.log('开始');

  const result = await new Promise(resolve => {
    setTimeout(() => resolve('延迟数据'), 1000);
  });

  console.log('获取到:', result);
  console.log('结束');
}

main();
```

**错误处理模式：**

```javascript
// 方式 1：try-catch（推荐）
async function fetchWithTryCatch() {
  try {
    const response = await fetch('http://api.example.com/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('请求失败:', error.message);
    throw error;  // 重新抛出以便调用者处理
  }
}

// 方式 2：Promise.catch
async function fetchWithCatch() {
  return await fetch('http://api.example.com/data')
    .then(res => res.json())
    .catch(err => {
      console.error('请求失败:', err.message);
      return null;  // 返回默认值
    });
}

// 方式 3：同时处理多个错误
async function handleMultipleErrors() {
  try {
    const [user, posts] = await Promise.all([
      fetchUser(1),
      fetchUserPosts(1)
    ]);
    return { user, posts };
  } catch (error) {
    if (error.code === 'USER_NOT_FOUND') {
      // 处理用户不存在
    } else if (error.code === 'POSTS_NOT_FOUND') {
      // 处理文章不存在
    }
    throw error;
  }
}
```

### 2.4 并发控制

在实际应用中，我们需要控制同时执行的异步任务数量，避免资源耗尽。

**并发控制实现：**

```javascript
// 并发控制器：限制同时执行的任务数
class ConcurrencyLimiter {
  constructor(maxConcurrent) {
    this.maxConcurrent = maxConcurrent;
    this.running = 0;
    this.queue = [];
  }

  async run(task) {
    return new Promise((resolve, reject) => {
      const execute = () => {
        this.running++;
        task()
          .then(result => {
            this.running--;
            resolve(result);
            // 执行下一个排队的任务
            if (this.queue.length > 0) {
              const next = this.queue.shift();
              next();
            }
          })
          .catch(err => {
            this.running--;
            reject(err);
            if (this.queue.length > 0) {
              const next = this.queue.shift();
              next();
            }
          });
      };

      if (this.running < this.maxConcurrent) {
        execute();
      } else {
        this.queue.push(execute);
      }
    });
  }
}

// 使用示例
const limiter = new ConcurrencyLimiter(3);

const tasks = [
  () => fetch('/api/item/1'),
  () => fetch('/api/item/2'),
  () => fetch('/api/item/3'),
  () => fetch('/api/item/4'),
  () => fetch('/api/item/5'),
];

// 最多同时执行 3 个任务
for (const task of tasks) {
  limiter.run(task).then(() => {
    console.log('任务完成');
  });
}
```

**批量请求优化：**

```javascript
// 分批处理大量请求
async function batchProcess(items, batchSize, processFn) {
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    // 等待这一批全部完成
    const batchResults = await Promise.all(
      batch.map(item => processFn(item))
    );
    results.push(...batchResults);
    console.log(`已完成 ${Math.min(i + batchSize, items.length)}/${items.length}`);
  }

  return results;
}

// 使用示例：处理 1000 个用户
const userIds = Array.from({ length: 1000 }, (_, i) => i + 1);

const users = await batchProcess(
  userIds,
  50,  // 每批 50 个
  async (id) => {
    const res = await fetch(`/api/users/${id}`);
    return res.json();
  }
);
```

### 2.5 错误处理

Node.js 异步编程中的错误处理是确保应用稳定性的关键。

**统一错误处理模式：**

```javascript
// 错误优先回调模式
fs.readFile('file.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('读取文件失败:', err);
    return;
  }
  console.log('文件内容:', data);
});

// async/await 错误传播
async function asyncErrorExample() {
  try {
    await dangerousOperation();
  } catch (error) {
    // 错误处理逻辑
    console.error('操作失败:', error.message);
    // 可以添加错误上报逻辑
    // await reportError(error);
  }
}

// 自定义错误类
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, field) {
    super(message, 400, 'VALIDATION_ERROR');
    this.field = field;
  }
}

class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.resource = resource;
  }
}

// 使用自定义错误
async function getUser(id) {
  const user = await db.users.findById(id);
  if (!user) {
    throw new NotFoundError('User');
  }
  return user;
}
```

---

## 3. Streams 流式处理

Streams 是 Node.js 处理流式数据的核心抽象，用于处理大量数据或持续不断的数据流。

### 3.1 流类型

Node.js 中有四种基本的流类型：

```javascript
const { Readable, Writable, Duplex, Transform } = require('stream');

// 1. Readable 流（可读流）- 数据源
// 示例：fs.createReadStream(), http.IncomingMessage
const readable = require('stream').Readable;

// 自定义可读流
class CounterStream extends Readable {
  constructor(max) {
    super();
    this.count = 0;
    this.max = max;
  }

  _read() {
    if (this.count > this.max) {
      this.push(null);  // 数据结束
    } else {
      this.push(String(this.count++));
    }
  }
}

// 2. Writable 流（可写流）- 数据目标
// 示例：fs.createWriteStream(), http.ServerResponse
const writable = require('stream').Writable;

const writer = writable({
  write(chunk, encoding, callback) {
    console.log('写入:', chunk.toString());
    callback();  // 完成写入，准备接受下一个 chunk
  }
});

// 3. Duplex 流（双工流）- 同时可读可写
// 示例：net.Socket, WebSocket
const duplex = require('stream').Duplex;

// 4. Transform 流（转换流）- 读写过程中转换数据
// 示例：zlib.createGzip(), crypto.createCipher
const transform = require('stream').Transform;

const upperCaseTransform = new Transform({
  transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback();
  }
});
```

### 3.2 管道

管道操作符 `pipe()` 用于连接流，将上一个流的输出自动传递到下一个流的输入。

**管道基础用法：**

```javascript
const fs = require('fs');
const zlib = require('zlib');

// 文件复制：读取并写入
fs.createReadStream('./input.txt')
  .pipe(fs.createWriteStream('./output.txt'));

// 文件压缩
fs.createReadStream('./input.txt')
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream('./input.txt.gz'));

// 解压文件
fs.createReadStream('./input.txt.gz')
  .pipe(zlib.createGunzip())
  .pipe(fs.createWriteStream('./input-uncompressed.txt'));

// 多个管道串联
fs.createReadStream('./input.txt')
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream('./input.txt.gz'))
  .on('finish', () => {
    console.log('压缩完成');
  });
```

### 3.3 背压

背压机制是 Streams 最重要的特性之一，它允许下游消费者向上游生产者发送信号，告知其降低数据发送速度，防止内存溢出。

**背压问题与解决：**

```javascript
// 问题场景：快速的生产者 vs 慢速的消费者
// 不使用背压会导致内存堆积

// 错误示例：没有处理背压
const readable = getLargeReadableStream();  // 快速产生数据
const writable = slowWritable();            // 慢速消费

// 这会导致内存不断增长
readable.on('data', (chunk) => {
  const canContinue = writable.write(chunk);
  if (!canContinue) {
    // 问题：没有处理背压，数据会堆积在内存中
  }
});

// 正确示例：使用背压机制
const readable = getLargeReadableStream();
const writable = slowWritable();

readable.on('data', (chunk) => {
  const canContinue = writable.write(chunk);

  if (!canContinue) {
    // 暂停读取，等待 drain 事件
    readable.pause();

    writable.once('drain', () => {
      readable.resume();
    });
  }
});

// 更简洁的方式：使用 pipe
// pipe() 自动处理背压
readable.pipe(writable);
```

**手动实现背压控制：**

```javascript
// 实现带背压控制的流处理
const { Readable, Writable } = require('stream');

class ControlledReader extends Readable {
  constructor(source, highWaterMark = 16 * 1024) {
    super({ highWaterMark });
    this.source = source;
    this.waiting = false;
  }

  _read(size) {
    const chunk = this.source.read(size);

    if (chunk === null) {
      this.waiting = true;
      this.source.once('readable', () => {
        this.waiting = false;
        this.push(this.source.read(size));
      });
    } else {
      this.push(chunk);
    }
  }
}

class ControlledWriter extends Writable {
  constructor(destination, highWaterMark = 16 * 1024) {
    super({ highWaterMark });
    this.destination = destination;
  }

  _write(chunk, encoding, callback) {
    const canContinue = this.destination.write(chunk);

    if (!canContinue) {
      this.destination.once('drain', () => {
        callback();  // 恢复写入
      });
    } else {
      callback();  // 立即继续
    }
  }
}
```

### 3.4 实战：大文件处理

Streams 最实际的应用场景是大文件处理。

**大文件复制：**

```javascript
const fs = require('fs');
const path = require('path');

// 流式文件复制函数
function copyFile(src, dest, chunkSize = 64 * 1024) {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(src, { highWaterMark: chunkSize });
    const writeStream = fs.createWriteStream(dest);

    readStream.on('error', reject);
    writeStream.on('error', reject);
    writeStream.on('finish', resolve);

    readStream.pipe(writeStream);
  });
}

// 大文件处理示例：日志分析
class LogAnalyzer extends Transform {
  constructor(filterPattern) {
    super();
    this.pattern = filterPattern;
    this.stats = { total: 0, matched: 0 };
  }

  _transform(chunk, encoding, callback) {
    const line = chunk.toString();
    this.stats.total++;

    if (this.pattern.test(line)) {
      this.stats.matched++;
      this.push(line);
    }

    callback();
  }

  _flush(callback) {
    console.log(`统计: 共 ${this.stats.total} 行，匹配 ${this.stats.matched} 行`);
    callback();
  }
}

// 使用示例：分析大型日志文件
const readStream = fs.createReadStream('./access.log');
const analyzer = new LogAnalyzer(/ERROR/);
const writeStream = fs.createWriteStream('./error.log');

readStream
  .pipe(analyzer)
  .pipe(writeStream)
  .on('finish', () => {
    console.log('日志分析完成');
  });
```

**HTTP 分块传输：**

```javascript
const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
  const filePath = './large-file.zip';

  // 设置响应头
  res.writeHead(200, {
    'Content-Type': 'application/zip',
    'Content-Length': fs.statSync(filePath).size,
    'Transfer-Encoding': 'chunked'
  });

  // 流式传输文件
  const readStream = fs.createReadStream(filePath);

  readStream.pipe(res);

  readStream.on('error', (err) => {
    console.error('传输错误:', err);
    res.end();
  });
});

server.listen(3000);
```

---

## 4. 进程管理

### 4.1 child_process

child_process 模块用于创建子进程，实现多进程编程。

**创建子进程的方式：**

```javascript
const { spawn, exec, execFile, fork } = require('child_process');

// 1. spawn() - 衍生新进程，用于长生命周期的命令
// 适合数据流式处理（stdin/stdout/stderr）
const child = spawn('node', ['child.js'], {
  stdio: ['pipe', 'pipe', 'pipe']  // 标准输入、输出、错误
});

child.stdout.on('data', (data) => {
  console.log('子进程输出:', data.toString());
});

child.stderr.on('data', (data) => {
  console.error('子进程错误:', data.toString());
});

child.on('close', (code) => {
  console.log('子进程退出，代码:', code);
});

// 2. exec() - 执行 shell 命令，适合短生命周期的命令
exec('ls -la', (error, stdout, stderr) => {
  if (error) {
    console.error('执行错误:', error);
    return;
  }
  console.log('输出:', stdout);
});

// 带超时的 exec
exec('sleep 5 && echo done', {
  timeout: 1000,  // 1秒超时
  killSignal: 'SIGKILL'
}, (error, stdout, stderr) => {
  if (error) {
    console.error('命令超时或出错:', error);
  }
});

// 3. execFile() - 直接执行文件，不通过 shell
// 比 exec() 更安全，避免 shell 注入
execFile('node', ['child.js'], (error, stdout, stderr) => {
  if (error) throw error;
  console.log('输出:', stdout);
});

// 4. fork() - 专门用于衍生 Node.js 子进程
// 可以在父子进程间发送消息
const forked = fork('child.js', [], {
  silent: false  // true 会继承父进程的标准输入输出
});

forked.send({ message: '来自父进程' });

forked.on('message', (msg) => {
  console.log('收到子进程消息:', msg);
});

forked.on('exit', (code) => {
  console.log('子进程退出:', code);
});
```

**父子进程通信：**

```javascript
// parent.js
const fork = require('child_process').fork;

const child = fork('./child.js');

// 发送消息给子进程
child.send({ type: 'TASK', data: '任务数据' });

// 接收子进程消息
child.on('message', (msg) => {
  console.log('来自子进程:', msg);
});

// child.js
process.on('message', (msg) => {
  console.log('收到父进程消息:', msg);

  // 处理后发送响应
  process.send({ type: 'RESULT', data: '处理结果' });
});

// 确保父子进程通道打开
process.send({ type: 'READY' });
```

### 4.2 cluster

cluster 模块用于创建共享服务器端口的子进程，实现负载均衡。

**cluster 基础用法：**

```javascript
const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  console.log(`主进程 ${process.pid} 启动`);

  // 衍生工作进程
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // 监听工作进程退出
  cluster.on('exit', (worker, code, signal) => {
    console.log(`工作进程 ${worker.process.pid} 退出`);
    // 重新启动工作进程
    cluster.fork();
  });

  // 进程间事件传播
  cluster.on('message', (worker, message) => {
    console.log(`主进程收到来自 ${worker.process.pid} 的消息`);
  });
} else {
  // 工作进程
  console.log(`工作进程 ${process.pid} 启动`);

  http.createServer((req, res) => {
    res.writeHead(200);
    res.end(`处理请求的进程: ${process.pid}`);
  }).listen(8000);
}
```

**cluster 负载均衡策略：**

```javascript
const cluster = require('cluster');
const http = require('http');

// 负载均衡策略
// Node.js 默认使用 round-robin（在 Windows 外）
// Windows 使用共享句柄方式

if (cluster.isMaster) {
  // 创建 4 个工作进程
  for (let i = 0; i < 4; i++) {
    cluster.fork();
  }

  // 调度算法：轮询
  // 请求依次分配给不同的 worker
} else {
  const server = http.createServer((req, res) => {
    // 每个请求由不同 worker 处理
    res.end(`Worker ${process.pid} 处理\n`);
  });

  server.listen(3000);
}
```

### 4.3 PM2

PM2 是 Node.js  production 进程管理器，提供进程守护、负载均衡、日志管理等功能。

**PM2 常用命令：**

```bash
# 启动应用
pm2 start app.js
pm2 start app.js --name "my-app"        # 指定名称
pm2 start app.js -i 4                   # 启动 4 个实例

# 进程管理
pm2 list                                # 列出所有进程
pm2 status                               # 查看状态
pm2 restart my-app                      # 重启
pm2 stop my-app                         # 停止
pm2 delete my-app                       # 删除

# 日志管理
pm2 logs my-app                         # 查看日志
pm2 logs my-app --lines 100             # 最近 100 行
pm2 flush                               # 清空日志

# 监控
pm2 monit                               # 实时监控面板
pm2 status                              # 进程状态
```

**PM2 配置文件：**

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'my-app',
    script: './app.js',
    instances: 'max',         // 最大实例数
    exec_mode: 'cluster',      // 集群模式
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    // 日志配置
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',

    // 高级配置
    max_memory_restart: '512M',  // 内存超过 512MB 重启
    autorestart: true,           // 崩溃自动重启
    watch: false,                // 不监听文件变化
    ignore_watch: ['node_modules', 'logs'],

    // 健康检查
    listen_timeout: 3000,
    kill_timeout: 5000,

    // 重启策略
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000
  }]
};
```

### 4.4 进程通信

Node.js 支持多种进程间通信机制。

**IPC 通信：**

```javascript
// IPC（Inter-Process Communication）示例
// 使用 child_process.fork() 的消息通道

// worker.js
process.on('message', (data) => {
  console.log('Worker 收到:', data);

  // 处理耗时任务
  const result = heavyComputation(data);

  // 发送结果回主进程
  process.send({ status: 'done', result });
});

function heavyComputation(data) {
  // 模拟计算
  return data * 2;
}

// main.js
const { fork } = require('child_process');

const worker = fork('./worker.js');

worker.on('message', (message) => {
  console.log('主进程收到:', message);
  worker.kill();  // 终止 worker
});

worker.send({ id: 1, value: 100 });
```

**使用 net 模块进行 IPC：**

```javascript
// 通过 Unix Domain Socket 进行通信

// server.js
const net = require('net');

const server = net.createServer((socket) => {
  socket.on('data', (data) => {
    console.log('收到:', data.toString());
    socket.write('响应: ' + data);
  });
});

// 监听 Unix Domain Socket
server.listen('/tmp/node.sock', () => {
  console.log('服务器监听中:', server.address());
});

// client.js
const net = require('net');

const client = net.connect('/tmp/node.sock', () => {
  client.write('Hello Server');
});

client.on('data', (data) => {
  console.log('收到响应:', data.toString());
  client.end();
});
```

---

## 5. 内存管理

### 5.1 V8 内存

Node.js 使用 V8 引擎的垃圾回收器来管理内存。

**V8 内存模型：**

```javascript
// V8 堆内存结构
const v8 = require('v8');

// 获取堆内存统计
const heapStats = v8.getHeapStatistics();
console.log({
  totalHeapSize: heapStats.total_heap_size,           // 总堆大小
  totalHeapSizeExecutable: heapStats.total_heap_size_executable,  // 可执行代码堆大小
  totalPhysicalSize: heapStats.total_physical_size,   // 物理内存大小
  totalAvailableSize: heapStats.total_available_size,  // 可用大小
  usedHeapSize: heapStats.used_heap_size,              // 已使用堆大小
  heapSizeLimit: heapStats.heap_size_limit,             // 堆大小限制
  mallocedMemory: heapStats.malloced_memory,           // 已分配内存
  peakMallocedMemory: heapStats.peak_malloced_memory,  // 峰值分配内存
});

// 堆 Statistics 字段说明
// 新生代空间：短生命周期对象（1-8MB）
// 老生代空间：长生命周期对象（可达数GB）
// 大对象空间：大于 premumin 的对象
// 代码空间：可执行代码
// Map 空间：隐藏类信息
```

### 5.2 垃圾回收

V8 使用分代垃圾回收策略，将堆分为新生代和老生代两个区域。

**分代回收策略：**

```javascript
// 新生代 Scavenge 算法
// 使用 Cheney 算法，将堆分为 FROM 和 TO 两个空间
// 对象在 FROM 空间分配，存活对象复制到 TO 空间
// 交换 FROM 和 TO，继续执行

// 老生代 Mark-Compact 算法
// 标记：遍历所有可达对象，标记活跃对象
// 压缩：移动存活对象，合并碎片空间

// 查看 GC 日志
// 启动时添加 --expose-gc 参数
// node --expose-gc app.js

// 手动触发 GC（仅用于调试）
if (global.gc) {
  console.log('手动触发 GC');
  global.gc();
}

// 监控 GC
const v8 = require('v8');
const startHeap = v8.getHeapStatistics();

setInterval(() => {
  const endHeap = v8.getHeapStatistics();
  const used = (endHeap.used_heap_size - startHeap.used_heap_size) / 1024 / 1024;
  console.log(`内存增长: ${used.toFixed(2)} MB`);
  startHeap.used_heap_size = endHeap.used_heap_size;
}, 60000);
```

### 5.3 内存泄漏

常见的 Node.js 内存泄漏原因及排查方法。

**常见内存泄漏场景：**

```javascript
// 场景 1：全局变量泄漏
// 不小心创建的全局变量不会被垃圾回收
function leak() {
  // 错误：没有声明的变量成为全局变量
  leakData = new Array(10000);  // 泄漏！
}

// 正确：使用 let/const 或显式添加到全局对象
function noLeak() {
  const leakData = new Array(10000);  // 正确
}

// 场景 2：闭包引用
function createLeaker() {
  const largeData = new Array(100000);

  return function() {
    // 闭包引用了 largeData，即使这个内部函数不使用它
    console.log('闭包保持对 largeData 的引用');
  };
}

const leaker = createLeaker();
// largeData 不会被回收，因为它被 leaker 函数引用

// 场景 3：事件监听器未清理
const server = http.createServer((req, res) => {
  // 每个请求添加新的监听器，但从不移除
  someEmitter.on('event', handler);
});

server.listen(3000);
// 每次请求都会添加监听器，导致内存泄漏

// 场景 4：缓存没有限制大小
const cache = new Map();

function getData(key) {
  if (cache.has(key)) {
    return cache.get(key);
  }

  const data = fetchFromDatabase(key);
  cache.set(key, data);
  // Map 无限增长！
  return data;
}

// 解决方案：使用带大小限制的缓存
const LRU = require('lru-cache');
const lruCache = new LRU({ max: 500 });  // 最多 500 条
```

** WeakMap 和 WeakRef：**

```javascript
// WeakMap - 键为对象时，不阻止垃圾回收
const wm = new WeakMap();

{
  const obj = { name: '临时对象' };
  wm.set(obj, '相关数据');
  console.log(wm.get(obj));  // '相关数据'
}  // obj 超出作用域，可以被回收

// WeakRef - 引用对象，不阻止垃圾回收
const ref = new WeakRef({ data: '重要数据' });
console.log(ref.deref()?.data);  // '重要数据'

// 实际应用：缓存
class Cache {
  #cache = new Map();
  #maxAge = 1000 * 60 * 5;  // 5 分钟

  set(key, value) {
    this.#cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key) {
    const item = this.#cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.#maxAge) {
      this.#cache.delete(key);
      return null;
    }

    return item.value;
  }
}
```

### 5.4 排查工具

诊断 Node.js 内存问题的工具和方法。

**堆快照分析：**

```javascript
// 生成堆快照
const v8 = require('v8');
const fs = require('fs');

function takeHeapSnapshot() {
  const filename = `heap-${Date.now()}.heapsnapshot`;
  const snapshotStream = v8.writeHeapSnapshot(filename);
  console.log('堆快照已保存:', snapshotStream);
}

// 在怀疑有内存泄漏的地方调用
process.on('SIGUSR2', () => {
  takeHeapSnapshot();
});

// 启动时发送信号
// kill -USR2 <pid>

// 使用 Chrome DevTools 分析
// 1. 启动 Node.js：node --inspect app.js
// 2. Chrome 打开 chrome://inspect
// 3. 选择目标进程，点击 Memory
// 4. 选择 Heap Snapshot，拍摄快照
// 5. 比较多个快照找出增长的对象
```

**内存监控脚本：**

```javascript
// memory-monitor.js
const v8 = require('v8');
const os = require('os');

class MemoryMonitor {
  constructor(interval = 5000) {
    this.interval = interval;
    this.startMemory = process.memoryUsage();
    this.startTime = Date.now();
    this.snapshots = [];
  }

  start() {
    this.timer = setInterval(() => {
      this.check();
    }, this.interval);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  check() {
    const current = process.memoryUsage();
    const uptime = Date.now() - this.startTime;

    const snapshot = {
      timestamp: Date.now(),
      uptime: Math.floor(uptime / 1000),
      heapUsed: Math.floor(current.heapUsed / 1024 / 1024),
      heapTotal: Math.floor(current.heapTotal / 1024 / 1024),
      rss: Math.floor(current.rss / 1024 / 1024),
      external: Math.floor(current.external / 1024 / 1024),
      arrayBuffers: Math.floor((current.arrayBuffers || 0) / 1024 / 1024)
    };

    this.snapshots.push(snapshot);

    // 打印当前状态
    console.log(`[${snapshot.uptime}s] Heap: ${snapshot.heapUsed}MB / ${snapshot.heapTotal}MB | RSS: ${snapshot.rss}MB`);

    // 检查是否异常
    if (snapshot.heapUsed > this.startMemory.heapUsed * 1.5) {
      console.warn('警告：堆内存使用量增长超过 50%');
    }
  }

  getReport() {
    return {
      start: this.startMemory,
      current: process.memoryUsage(),
      snapshots: this.snapshots
    };
  }
}

// 使用
const monitor = new MemoryMonitor(5000);
monitor.start();

// 运行一段时间后
setTimeout(() => {
  monitor.stop();
  console.log('内存报告:', monitor.getReport());
}, 60000);
```

---

## 6. 网络编程

### 6.1 TCP/UDP

Node.js 内置 net 模块支持 TCP 协议，dgram 模块支持 UDP 协议。

**TCP 服务器与客户端：**

```javascript
// TCP 服务器
const net = require('net');

const server = net.createServer((socket) => {
  console.log('客户端连接:', socket.remoteAddress, socket.remotePort);

  // 数据事件
  socket.on('data', (data) => {
    console.log('收到数据:', data.toString());
    // 回显数据
    socket.write('服务器收到: ' + data);
  });

  // 连接结束
  socket.on('end', () => {
    console.log('客户端断开');
  });

  // 错误处理
  socket.on('error', (err) => {
    console.error('Socket 错误:', err);
  });

  // 设置超时
  socket.setTimeout(60000, () => {
    console.log('连接超时');
    socket.destroy();
  });
});

server.listen(8124, () => {
  console.log('TCP 服务器监听: 8124');
});

// TCP 客户端
const client = net.createConnection({
  host: '127.0.0.1',
  port: 8124
}, () => {
  console.log('已连接到服务器');
  client.write('Hello Server');
});

client.on('data', (data) => {
  console.log('服务器响应:', data.toString());
  client.end();
});

client.on('close', () => {
  console.log('连接关闭');
});
```

**UDP 服务器与客户端：**

```javascript
const dgram = require('dgram');

const server = dgram.createSocket('udp4');

server.on('message', (msg, rinfo) => {
  console.log(`收到客户端消息: ${msg} 来自 ${rinfo.address}:${rinfo.port}`);

  // 发送响应
  const response = Buffer.from('服务器收到: ' + msg);
  server.send(response, rinfo.port, rinfo.address);
});

server.on('listening', () => {
  const address = server.address();
  console.log(`UDP 服务器监听: ${address.address}:${address.port}`);
});

server.bind(41234);

// UDP 客户端
const client = dgram.createSocket('udp4');

const message = Buffer.from('Hello UDP Server');
client.send(message, 41234, '127.0.0.1', (err) => {
  if (err) {
    console.error('发送失败:', err);
  } else {
    console.log('消息已发送');
  }
});

client.on('message', (msg, rinfo) => {
  console.log('收到服务器响应:', msg.toString());
  client.close();
});
```

### 6.2 HTTP/HTTPS

Node.js 的 http 模块提供了构建 HTTP 服务器和客户端的能力。

**HTTP 服务器：**

```javascript
const http = require('http');

const server = http.createServer((req, res) => {
  // req 是可读流，res 是可写流
  let body = '';

  // 获取请求体
  req.on('data', chunk => {
    body += chunk;
  });

  req.on('end', () => {
    console.log('请求方法:', req.method);
    console.log('请求 URL:', req.url);
    console.log('请求头:', req.headers);

    // 发送响应
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'X-Custom-Header': '自定义响应头'
    });

    const response = {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: body
    };

    res.end(JSON.stringify(response));
  });
});

server.listen(3000, () => {
  console.log('HTTP 服务器运行在 http://localhost:3000');
});

// 完整示例：路由处理
const url = require('url');
const querystring = require('querystring');

const routes = {
  'GET /': (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>首页</h1>');
  },
  'GET /users': (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([{ id: 1, name: '张三' }]));
  },
  'POST /users': (req, res) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const user = querystring.parse(body);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ id: 2, ...user }));
    });
  }
};

http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  const key = `${method} ${pathname}`;
  const handler = routes[key];

  if (handler) {
    handler(req, res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
}).listen(3000);
```

**HTTP 客户端：**

```javascript
const http = require('http');

// 简单请求
http.get('http://api.example.com/data', (res) => {
  console.log('状态码:', res.statusCode);
  console.log('响应头:', res.headers);

  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log('响应体:', data);
  });
}).on('error', (err) => {
  console.error('请求错误:', err);
});

// 高级请求（POST 等）
const options = {
  hostname: 'api.example.com',
  port: 80,
  path: '/users',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token123'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log('响应:', data);
  });
});

req.on('error', (err) => {
  console.error('请求错误:', err);
});

req.write(JSON.stringify({ name: '张三', email: 'zhang@example.com' }));
req.end();
```

**HTTPS 服务器：**

```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('./keys/private-key.pem'),
  cert: fs.readFileSync('./keys/certificate.pem'),
  // ca: fs.readFileSync('./keys/ca-cert.pem'),  // CA 证书
};

const server = https.createServer(options, (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('安全的 HTTPS 响应');
});

server.listen(443, () => {
  console.log('HTTPS 服务器运行在 https://localhost:443');
});
```

### 6.3 WebSocket

WebSocket 提供了双向通信能力，适合实时应用。

**WebSocket 服务器：**

```javascript
const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ port: 8080 });

// 广播消息给所有客户端
function broadcast(message, excludeWs) {
  wss.clients.forEach(client => {
    if (client !== excludeWs && client.readyState === 1) {
      client.send(message);
    }
  });
}

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log('新客户端连接:', clientIp);

  // 发送欢迎消息
  ws.send(JSON.stringify({
    type: 'welcome',
    message: '已连接到服务器'
  }));

  // 广播用户数
  broadcast(JSON.stringify({
    type: 'userCount',
    count: wss.clients.size
  }), ws);

  // 处理客户端消息
  ws.on('message', (data) => {
    console.log('收到消息:', data.toString());

    // 解析消息
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'chat':
          // 广播聊天消息
          broadcast(JSON.stringify({
            type: 'chat',
            user: ws.userName || '匿名',
            content: message.content,
            timestamp: Date.now()
          }), ws);
          break;

        case 'setName':
          ws.userName = message.name;
          ws.send(JSON.stringify({
            type: 'system',
            message: `用户名已设置为: ${message.name}`
          }));
          break;
      }
    } catch (e) {
      console.error('消息解析失败:', e);
    }
  });

  // 处理关闭
  ws.on('close', () => {
    console.log('客户端断开:', clientIp);
    broadcast(JSON.stringify({
      type: 'userCount',
      count: wss.clients.size
    }));
  });

  // 错误处理
  ws.on('error', (err) => {
    console.error('WebSocket 错误:', err);
  });
});
```

### 6.4 HTTP/2

HTTP/2 提供多路复用、头部压缩等特性，提升网络性能。

**HTTP/2 服务器：**

```javascript
const http2 = require('http2');
const fs = require('fs');
const path = require('path');

const options = {
  key: fs.readFileSync('./keys/private-key.pem'),
  cert: fs.readFileSync('./keys/certificate.pem')
};

const server = http2.createSecureServer(options);

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json'
};

// HTTP/2 服务器推送
server.on('stream', (stream, headers) => {
  const pathname = headers[':path'];

  if (pathname === '/') {
    // 推送相关资源
    stream.pushStream({ ':path': '/style.css' }, (err, pushStream) => {
      pushStream.respond({
        'content-type': 'text/css',
        ':status': 200
      });
      pushStream.end('body { font-family: sans-serif; }');
    });

    stream.pushStream({ ':path': '/app.js' }, (err, pushStream) => {
      pushStream.respond({
        'content-type': 'application/javascript',
        ':status': 200
      });
      pushStream.end('console.log("HTTP/2推送的脚本");');
    });

    // 发送主页面
    stream.respond({
      'content-type': 'text/html',
      ':status': 200
    });
    stream.end('<html><head><link rel="stylesheet" href="style.css"></head><body><h1>HTTP/2 Demo</h1><script src="app.js"></script></body></html>');
  } else {
    // 处理静态文件
    const filePath = path.join(__dirname, pathname);
    const ext = path.extname(filePath);

    fs.readFile(filePath, (err, content) => {
      if (err) {
        stream.respond({ ':status': 404 });
        stream.end('Not Found');
      } else {
        stream.respond({
          'content-type': MIME_TYPES[ext] || 'text/plain',
          ':status': 200
        });
        stream.end(content);
      }
    });
  }
});

server.listen(8443, () => {
  console.log('HTTP/2 服务器运行在 https://localhost:8443');
});
```

---

## 7. 安全

### 7.1 输入验证

所有用户输入都应被视为不可信，需要严格验证。

**输入验证实践：**

```javascript
// 使用 joi 或 zod 进行模式验证
const Joi = require('joi');

// 定义验证模式
const userSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required(),

  email: Joi.string()
    .email()
    .required(),

  age: Joi.number()
    .integer()
    .min(0)
    .max(150),

  password: Joi.string()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/)
    .required(),

  role: Joi.string()
    .valid('admin', 'user', 'guest')
});

// 验证函数
function validateUser(data) {
  const { error, value } = userSchema.validate(data, {
    abortEarly: false,  // 返回所有错误
    stripUnknown: true  // 移除未知字段
  });

  if (error) {
    const errors = error.details.map(d => ({
      field: d.path.join('.'),
      message: d.message
    }));
    throw new ValidationError('Validation failed', errors);
  }

  return value;
}

// 使用示例
try {
  const user = validateUser({
    username: 'john_doe',
    email: 'john@example.com',
    age: 25,
    password: 'Password123'
  });
  console.log('验证通过:', user);
} catch (err) {
  console.error('验证失败:', err.details);
}
```

### 7.2 XSS/SQL 注入

防止常见 Web 攻击。

**XSS 防护：**

```javascript
const escapeHtml = require('escape-html');

// HTML 转义
function sanitizeOutput(userInput) {
  return escapeHtml(userInput);
}

// CSP 配置
const csp = `
  default-src 'self';
  script-src 'self' 'nonce-{random}';
  style-src 'self' 'nonce-{random}';
  img-src 'self' data: https:;
  font-src 'self';
  connect-src 'self';
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
`.replace(/\s+/g, ' ').trim();

// 在响应头中设置 CSP
res.setHeader('Content-Security-Policy', csp);

// 标记可信内容（非 CSP 环境）
function safeRender(html) {
  // 仅在完全信任的内容上使用
  return { __html: html };
}

// React 中的使用
// <div dangerouslySetInnerHTML={safeRender(userContent)} />
```

**SQL 注入防护：**

```javascript
// 使用参数化查询（推荐）
const { Pool } = require('pg');
const pool = new Pool();

// 参数化查询 - 安全
async function getUserById(id) {
  const result = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [id]  // 参数单独传递
  );
  return result.rows[0];
}

// 动态查询 - 使用白名单
function buildOrderByClause(orderBy, allowedFields) {
  if (!allowedFields.includes(orderBy)) {
    throw new Error('Invalid order field');
  }
  return orderBy;  // 白名单验证后直接使用
}

async function getUsers(orderBy = 'created_at') {
  const safeOrderBy = buildOrderByClause(orderBy, ['created_at', 'name', 'email']);
  const result = await pool.query(
    `SELECT * FROM users ORDER BY ${safeOrderBy} DESC`
  );
  return result.rows;
}

// ORM 使用（如 Prisma、Sequelize）
// 这些库自动处理参数化查询
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const user = await prisma.user.findUnique({
  where: { id: userId }
});
```

### 7.3 CSRF

跨站请求伪造防护。

**CSRF 防护策略：**

```javascript
const crypto = require('crypto');

// 生成 CSRF Token
function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

// 验证 CSRF Token（使用 double-submit cookie 模式）
function validateCSRFToken(req) {
  const cookieToken = req.cookies['csrf-token'];
  const headerToken = req.headers['x-csrf-token'];

  if (!cookieToken || !headerToken) {
    return false;
  }

  // 使用 timingSafeEqual 防止时序攻击
  return crypto.timingSafeEqual(
    Buffer.from(cookieToken),
    Buffer.from(headerToken)
  );
}

// CSRF 中间件
function csrfMiddleware(req, res, next) {
  // 仅对状态改变请求验证
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  if (!validateCSRFToken(req)) {
    return res.status(403).json({ error: 'CSRF validation failed' });
  }

  next();
}

// SameSite Cookie
// 防止 CSRF 的第一道防线
res.cookie('session', sessionId, {
  httpOnly: true,  // 禁止 JavaScript 访问
  secure: true,    // 仅 HTTPS
  sameSite: 'strict'  // 严格模式，完全禁止跨站请求携带 Cookie
});
```

### 7.4 加密

安全的密码存储和数据加密。

**密码加密：**

```javascript
const crypto = require('crypto');

// bcrypt 是专门为密码设计的哈希算法
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

// 哈希密码
async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

// 验证密码
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// 使用示例
async function registerUser(username, password) {
  const hash = await hashPassword(password);

  await db.users.create({
    username,
    passwordHash: hash
  });
}

async function loginUser(username, password) {
  const user = await db.users.findOne({ username });

  if (!user) {
    return { success: false, error: 'Invalid credentials' };
  }

  const isValid = await verifyPassword(password, user.passwordHash);

  if (!isValid) {
    return { success: false, error: 'Invalid credentials' };
  }

  // 生成会话
  return { success: true, user };
}
```

**数据加密：**

```javascript
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// 加密
function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    encrypted,
    authTag: authTag.toString('hex')
  };
}

// 解密
function decrypt(encryptedData) {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(encryptedData.iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// 使用示例
const sensitiveData = { ssn: '123-45-6789', creditCard: '4111111111111111' };
const encrypted = encrypt(JSON.stringify(sensitiveData));

console.log('加密后:', encrypted);
// 保存到数据库
db.secrets.create({
  data: encrypted
});

// 读取时解密
const decrypted = JSON.parse(decrypt(encrypted.data));
console.log('解密后:', decrypted);
```

---

## 8. 性能优化

### 8.1 性能分析

Node.js 提供了多种性能分析工具。

**内置性能分析：**

```javascript
const { PerformanceObserver, performance } = require('perf_hooks');

// 标记代码段性能
function measurePerformance() {
  performance.mark('operation-start');

  // 模拟操作
  for (let i = 0; i < 1000000; i++) {
    Math.sqrt(i);
  }

  performance.mark('operation-end');

  // 创建测量
  performance.measure(
    'operation-duration',
    'operation-start',
    'operation-end'
  );

  // 获取测量结果
  const measures = performance.getEntriesByType('measure');
  console.log('性能测量:', measures);
}

// 使用观察者
const observer = new PerformanceObserver((items) => {
  items.getEntries().forEach((entry) => {
    console.log(`${entry.name}: ${entry.duration}ms`);
  });
  performance.clearMarks();
});

observer.observe({ entryTypes: ['measure', 'mark'] });

measurePerformance();
```

**火焰图分析：**

```bash
# 使用 0x 生成火焰图
# 1. 安装 0x
npm install -g 0x

# 2. 运行应用
0x ./server.js

# 3. 在浏览器中查看火焰图

# 或使用 clinic.js
npm install -g clinic
clinic doctor -- node server.js
clinic flame -- node server.js
```

### 8.2 优化技巧

**常见性能优化方法：**

```javascript
// 1. 避免同步操作
// 错误
const data = fs.readFileSync('./large-file.json');
const parsed = JSON.parse(data);

// 正确
const data = await fs.promises.readFile('./large-file.json');
const parsed = JSON.parse(data);

// 2. 使用流处理大文件
const fs = require('fs');
const zlib = require('zlib');

// 流式压缩，比全部加载到内存高效
fs.createReadStream('./large-file.txt')
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream('./large-file.txt.gz'));

// 3. 批量操作替代循环
// 错误：循环中执行数据库操作
for (const id of ids) {
  await db.users.update(id, { status: 'active' });
}

// 正确：批量操作
await db.users.updateMany({
  where: { id: { in: ids } },
  data: { status: 'active' }
});

// 4. 使用连接池
const { Pool } = require('pg');
const pool = new Pool({ max: 20 });  // 最多 20 个连接

// 复用连接
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('查询耗时:', duration, 'ms');
  return res;
}

// 5. 缓存昂贵计算结果
const cache = new Map();
const CACHE_TTL = 60000;  // 1 分钟

function getCached(key, computeFn) {
  const cached = cache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return Promise.resolve(cached.value);
  }

  return computeFn().then(value => {
    cache.set(key, { value, timestamp: Date.now() });
    return value;
  });
}
```

### 8.3 缓存

多层次缓存策略。

**缓存实现：**

```javascript
// 多层缓存：内存 → Redis → 数据库
class MultiLayerCache {
  constructor(options = {}) {
    this.memoryCache = new Map();
    this.redis = options.redis;
    this.ttl = options.ttl || 300;  // 默认 5 分钟
  }

  async get(key) {
    // 1. 检查内存缓存
    const mem = this.memoryCache.get(key);
    if (mem && Date.now() < mem.expires) {
      console.log('Memory cache hit');
      return mem.value;
    }

    // 2. 检查 Redis
    if (this.redis) {
      const redis = await this.redis.get(key);
      if (redis) {
        console.log('Redis cache hit');
        const value = JSON.parse(redis);
        // 回填内存缓存
        this.memoryCache.set(key, {
          value,
          expires: Date.now() + this.ttl * 1000
        });
        return value;
      }
    }

    // 3. 未命中
    return null;
  }

  async set(key, value) {
    const expires = Date.now() + this.ttl * 1000;

    // 设置内存缓存
    this.memoryCache.set(key, { value, expires });

    // 设置 Redis 缓存
    if (this.redis) {
      await this.redis.setex(key, this.ttl, JSON.stringify(value));
    }
  }

  async invalidate(key) {
    this.memoryCache.delete(key);
    if (this.redis) {
      await this.redis.del(key);
    }
  }
}
```

### 8.4 压缩

HTTP 响应压缩和文件压缩。

**Gzip 压缩中间件：**

```javascript
const zlib = require('zlib');
const { promisify } = require('util');

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

// 压缩响应
async function compressResponse(req, res, data) {
  const acceptEncoding = req.headers['accept-encoding'] || '';

  if (acceptEncoding.includes('gzip')) {
    const compressed = await gzip(Buffer.from(JSON.stringify(data)));
    res.setHeader('Content-Encoding', 'gzip');
    res.send(compressed);
  } else {
    res.json(data);
  }
}

// 请求解压缩
async function decompressRequest(req) {
  const contentEncoding = req.headers['content-encoding'];

  if (contentEncoding === 'gzip') {
    const decompressed = await gunzip(req.rawBody);
    return JSON.parse(decompressed);
  }

  return req.body;
}

// Express 中间件示例
const express = require('express');
const app = express();

app.use((req, res, next) => {
  // 根据 Accept-Encoding 选择压缩方式
  const accept = req.headers['accept-encoding'];

  if (accept.includes('gzip')) {
    const originalJson = res.json.bind(res);

    res.json = async (data) => {
      const compressed = await gzip(Buffer.from(JSON.stringify(data)));
      res.setHeader('Content-Encoding', 'gzip');
      res.send(compressed);
    };
  }

  next();
});
```

---

## 9. 测试

### 9.1 单元测试

使用 Jest 或 Vitest 进行单元测试。

**Jest 单元测试示例：**

```javascript
// math.js
function add(a, b) {
  return a + b;
}

function multiply(a, b) {
  return a * b;
}

function factorial(n) {
  if (n < 0) throw new Error('负数没有阶乘');
  if (n === 0) return 1;
  return n * factorial(n - 1);
}

module.exports = { add, multiply, factorial };

// math.test.js
const { add, multiply, factorial } = require('./math');

describe('数学函数测试', () => {
  describe('add', () => {
    test('1 + 2 应该等于 3', () => {
      expect(add(1, 2)).toBe(3);
    });

    test('负数相加', () => {
      expect(add(-1, -2)).toBe(-3);
    });

    test('小数相加', () => {
      expect(add(0.1, 0.2)).toBeCloseTo(0.3);
    });
  });

  describe('multiply', () => {
    test('2 * 3 应该等于 6', () => {
      expect(multiply(2, 3)).toBe(6);
    });

    test('0 乘任何数都等于 0', () => {
      expect(multiply(0, 100)).toBe(0);
    });
  });

  describe('factorial', () => {
    test('0! 应该等于 1', () => {
      expect(factorial(0)).toBe(1);
    });

    test('5! 应该等于 120', () => {
      expect(factorial(5)).toBe(120);
    });

    test('负数应该抛出错误', () => {
      expect(() => factorial(-1)).toThrow('负数没有阶乘');
    });
  });
});
```

### 9.2 集成测试

测试模块间的交互。

**集成测试示例：**

```javascript
// userService.test.js
const { UserService } = require('./userService');
const { createMockDb } = require('../test/utils/mockDb');

describe('UserService 集成测试', () => {
  let userService;
  let mockDb;

  beforeEach(async () => {
    // 每次测试前创建新的数据库连接
    mockDb = await createMockDb();
    userService = new UserService(mockDb);
  });

  afterEach(async () => {
    await mockDb.cleanup();
  });

  describe('createUser', () => {
    test('创建新用户并返回用户信息', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'SecurePass123'
      };

      const user = await userService.createUser(userData);

      expect(user).toMatchObject({
        username: 'testuser',
        email: 'test@example.com'
      });
      expect(user.passwordHash).toBeDefined();
      expect(user.id).toBeDefined();
    });

    test('邮箱重复应该抛出错误', async () => {
      const userData = {
        username: 'user1',
        email: 'duplicate@example.com',
        password: 'password'
      };

      await userService.createUser(userData);

      await expect(
        userService.createUser({
          ...userData,
          username: 'user2'
        })
      ).rejects.toThrow('邮箱已被使用');
    });
  });

  describe('getUserById', () => {
    test('获取存在的用户', async () => {
      const created = await userService.createUser({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password'
      });

      const found = await userService.getUserById(created.id);

      expect(found.username).toBe('testuser');
    });

    test('获取不存在的用户返回 null', async () => {
      const found = await userService.getUserById(99999);
      expect(found).toBeNull();
    });
  });
});
```

### 9.3 Mock

测试中的 Mock 技术。

**Mock 技术示例：**

```javascript
const { jest } = require('@jest/globals');

// Mock 函数
test('mock 函数示例', () => {
  const mockCallback = jest.fn(x => 42 + x);

  [0, 1].forEach(mockCallback);

  // mock 函数被调用了 2 次
  expect(mockCallback.mock.calls).toHaveLength(2);

  // 第一次调用参数是 0
  expect(mockCallback.mock.calls[0][0]).toBe(0);

  // 第一次调用返回 42
  expect(mockCallback.mock.results[0].value).toBe(42);
});

// Mock 模块
jest.mock('../api/userApi');

const { getUser } = require('../api/userApi');
const { processUser } = require('./userProcessor');

test('processUser 应该调用 API 并处理结果', async () => {
  getUser.mockResolvedValue({ id: 1, name: '张三' });

  const result = await processUser(1);

  expect(getUser).toHaveBeenCalledWith(1);
  expect(result.displayName).toBe('张三 (ID: 1)');
});

// Mock timers
test('定时器测试', () => {
  jest.useFakeTimers();

  const callback = jest.fn();

  setTimeout(callback, 1000);

  // 快进 1 秒
  jest.advanceTimersByTime(1000);

  expect(callback).toHaveBeenCalled();

  jest.useRealTimers();
});
```

### 9.4 覆盖率

测试覆盖率报告。

**Jest 覆盖率配置：**

```javascript
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/index.js',
    // 忽略测试文件和入口文件
  ]
};
```

---

## 10. 调试

### 10.1 REPL

Node.js 内置的交互式解释器。

**REPL 使用技巧：**

```bash
# 启动 REPL
node

# REPL 命令
.help                    # 显示帮助
.break                   # 退出多行输入
.clear                   # 清空上下文
.exit                    # 退出 REPL
.save filename           # 保存会话到文件
.load filename           # 加载文件到 REPL
.editor                  # 进入编辑器模式

# 常用操作
> x = 10
10
> let sum = (...args) => args.reduce((a, b) => a + b, 0)
[Function: sum]
> sum(1, 2, 3, 4, 5)
15

# 使用 Tab 补全
# 输入全局变量或模块名后按 Tab 查看可用成员
```

**高级 REPL 功能：**

```javascript
// 自定义 REPL
const repl = require('repl');
const vm = require('vm');

// 创建自定义上下文
const customContext = repl.start({
  prompt: 'my-app> ',
  useGlobal: false  // 不使用全局对象
}).context;

// 添加自定义变量和函数
customContext.db = require('./db');
customContext.helpers = require('./helpers');
customContext.config = { debug: true };

// 在 REPL 中使用
// my-app> db.query('SELECT * FROM users')
// my-app> helpers.formatDate(new Date())
```

### 10.2 debugger

内置调试器支持断点调试。

**调试模式启动：**

```bash
# 启动调试模式
node inspect app.js

# 使用 Chrome DevTools 调试
node --inspect app.js
# 然后在 Chrome 中访问 chrome://inspect

# 远程调试
node --inspect=0.0.0.0:9229 app.js

# 使用 VS Code 调试
# .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "启动程序",
      "program": "${workspaceFolder}/app.js",
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
```

**调试命令：**

```javascript
// 在代码中添加断点
function calculateSum(numbers) {
  // Node.js 调试器会在下一行暂停
  debugger;

  return numbers.reduce((sum, n) => sum + n, 0);
}

// 或使用 process.debugPort 设置断点端口
```

### 10.3 日志

结构化日志实践。

**日志系统实现：**

```javascript
// logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'my-app' },
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          let msg = `${timestamp} [${level}]: ${message}`;
          if (Object.keys(meta).length > 1) {
            msg += ` ${JSON.stringify(meta)}`;
          }
          return msg;
        })
      )
    }),

    // 文件输出 - 错误日志
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880,  // 5MB
      maxFiles: 5
    }),

    // 文件输出 - 所有日志
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

module.exports = logger;

// 使用示例
logger.info('应用启动', { port: 3000 });
logger.warn('内存使用过高', { usage: '85%' });
logger.error('数据库连接失败', { error: err.message, stack: err.stack });
```

### 10.4 Profiler

性能分析工具。

**V8 Profiler 使用：**

```javascript
// 添加性能分析
const { Profiler } = require('v8');
const fs = require('fs');

const profiler = new Profiler();

// 开始采样
profiler.startProfiling('profile');

// 执行要分析的操作
function heavyOperation() {
  let result = 0;
  for (let i = 0; i < 1000000; i++) {
    result += Math.sqrt(i);
  }
  return result;
}

// 运行多次以获得稳定数据
for (let i = 0; i < 10; i++) {
  heavyOperation();
}

// 停止采样并保存
const profile = profiler.stopProfiling();

fs.writeFileSync(
  `profile-${Date.now()}.cpuprofile`,
  JSON.stringify(profile)
);

console.log('性能分析已保存');
```

---

## 11. 实战：手写框架

### 11.1 Koa 风格

手写一个类似 Koa 的 HTTP 框架，深入理解中间件机制。

**框架核心实现：**

```javascript
// my-koa.js
const http = require('http');

class MyKoa {
  constructor() {
    this.middlewares = [];
    this.context = {};
  }

  // 注册中间件
  use(fn) {
    this.middlewares.push(fn);
    return this;  // 支持链式调用
  }

  // 创建上下文对象
  createContext(req, res) {
    return {
      req,
      res,
      query: new URL(req.url, `http://${req.headers.host}`).searchParams,
      params: {},
      body: null,
      status: 200,
      set(key, value) {
        this.res.setHeader(key, value);
      },
      get body() {
        return this._body;
      },
      set body(value) {
        this._body = value;
        if (value !== null && this.status === 200) {
          this.status = 200;
        }
      }
    };
  }

  // 组合中间件
  compose(middlewares, ctx) {
    let index = -1;

    const dispatch = (i) => {
      if (i <= index) {
        throw new Error('next() 被多次调用');
      }
      index = i;

      if (i >= middlewares.length) {
        return Promise.resolve();
      }

      const fn = middlewares[i];
      return Promise.resolve(fn(ctx, () => dispatch(i + 1)));
    };

    return dispatch(0);
  }

  // 处理请求
  async handleRequest(req, res) {
    const ctx = this.createContext(req, res);

    await this.compose(this.middlewares, ctx);

    // 发送响应
    res.statusCode = ctx.status;
    if (ctx.body) {
      res.end(typeof ctx.body === 'object' ? JSON.stringify(ctx.body) : ctx.body);
    } else {
      res.end('Not Found');
    }
  }

  // 启动服务器
  listen(...args) {
    const server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    return server.listen(...args);
  }
}

module.exports = MyKoa;
```

### 11.2 中间件

中间件是 Koa 风格框架的核心，每个中间件可以处理请求的特定方面。

**常用中间件实现：**

```javascript
// middleware/logger.js - 日志中间件
function logger() {
  return async (ctx, next) => {
    const start = Date.now();
    await next();
    const duration = Date.now() - start;
    console.log(`${ctx.req.method} ${ctx.req.url} - ${ctx.status} - ${duration}ms`);
  };
}

// middleware/bodyParser.js - 请求体解析
function bodyParser() {
  return async (ctx, next) => {
    const chunks = [];
    for await (const chunk of ctx.req) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks).toString();

    if (ctx.req.headers['content-type']?.includes('application/json')) {
      try {
        ctx.body = JSON.parse(body);
      } catch (e) {
        ctx.body = null;
      }
    } else {
      ctx.body = body;
    }

    await next();
  };
}

// middleware/router.js - 路由中间件
function router(routes) {
  return async (ctx, next) => {
    const { method, pathname } = ctx.req;
    const routeKey = `${method} ${pathname}`;

    if (routes[routeKey]) {
      await routes[routeKey](ctx, next);
    } else {
      await next();
    }
  };
}

// middleware/errorHandler.js - 错误处理
function errorHandler() {
  return async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      ctx.status = err.status || 500;
      ctx.body = {
        error: err.message
      };
      console.error('Server Error:', err);
    }
  };
}

// middleware/static.js - 静态文件服务
const fs = require('fs');
const path = require('path');

function static(dir) {
  const staticDir = path.resolve(dir);

  return async (ctx, next) => {
    if (ctx.req.method !== 'GET') {
      return await next();
    }

    const filePath = path.join(staticDir, ctx.req.url === '/' ? 'index.html' : ctx.req.url);

    try {
      const content = await fs.promises.readFile(filePath);
      const ext = path.extname(filePath);
      const contentTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg'
      };
      ctx.set('Content-Type', contentTypes[ext] || 'text/plain');
      ctx.body = content;
    } catch (e) {
      await next();
    }
  };
}
```

### 11.3 路由

实现基本的路由系统。

**路由系统实现：**

```javascript
// my-router.js
class Router {
  constructor() {
    this.routes = new Map();
    this.params = [];
    this.middlewares = [];
  }

  // 注册 GET 路由
  get(path, ...handlers) {
    this.addRoute('GET', path, handlers);
    return this;
  }

  // 注册 POST 路由
  post(path, ...handlers) {
    this.addRoute('POST', path, handlers);
    return this;
  }

  // 注册 PUT 路由
  put(path, ...handlers) {
    this.addRoute('PUT', path, handlers);
    return this;
  }

  // 注册 DELETE 路由
  delete(path, ...handlers) {
    this.addRoute('DELETE', path, handlers);
    return this;
  }

  // 添加路由
  addRoute(method, path, handlers) {
    const paramNames = [];
    const regexPath = path.replace(/:([^/]+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });

    const key = `${method} ${path}`;
    this.routes.set(key, {
      method,
      path,
      regex: new RegExp(`^${regexPath}$`),
      paramNames,
      handlers
    });
  }

  // 匹配路由
  match(method, path) {
    for (const [key, route] of this.routes) {
      if (route.method !== method) continue;

      const match = path.match(route.regex);
      if (match) {
        // 提取参数
        const params = {};
        route.paramNames.forEach((name, i) => {
          params[name] = match[i + 1];
        });

        return {
          handlers: route.handlers,
          params
        };
      }
    }
    return null;
  }

  // 返回中间件函数
  routesMiddleware() {
    return async (ctx, next) => {
      const { method, pathname } = ctx.req;
      const matched = this.match(method, pathname);

      if (matched) {
        ctx.params = matched.params;
        // 执行路由处理函数
        const composed = this.compose(matched.handlers);
        await composed(ctx, next);
      } else {
        await next();
      }
    };
  }

  // 组合处理函数
  compose(handlers) {
    return async (ctx, next) => {
      let index = -1;

      const dispatch = async (i) => {
        if (i <= index) {
          throw new Error('next() 被多次调用');
        }
        index = i;

        if (i >= handlers.length) {
          return await next();
        }

        const handler = handlers[i];
        return await handler(ctx, () => dispatch(i + 1));
      };

      return dispatch(0);
    };
  }
}

module.exports = Router;
```

### 11.4 错误处理

完善的错误处理机制。

**错误处理中间件：**

```javascript
// 自定义错误类
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = 'HttpError';
  }
}

// 404 处理
function notFoundHandler() {
  return async (ctx, next) => {
    await next();

    if (ctx.status === 404) {
      ctx.body = {
        error: 'Not Found',
        message: `Cannot ${ctx.method} ${ctx.path}`
      };
    }
  };
}

// 全局错误处理
function errorHandler() {
  return async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      console.error('Error:', err);

      const status = err.status || err.statusCode || 500;
      const message = status === 500 ? 'Internal Server Error' : err.message;

      ctx.status = status;
      ctx.body = {
        error: err.name || 'Error',
        message
      };

      // 开发环境显示完整错误
      if (process.env.NODE_ENV === 'development') {
        ctx.body.stack = err.stack;
      }
    }
  };
}

// 使用示例
const Koa = require('koa');
const Router = require('./my-router');
const bodyParser = require('./middleware/bodyParser');
const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFoundHandler');

const app = new Koa();
const router = new Router();

// 错误处理
app.use(errorHandler());

// 路由
router.get('/users', async (ctx) => {
  ctx.body = [{ id: 1, name: '张三' }];
});

router.get('/users/:id', async (ctx) => {
  const { id } = ctx.params;
  const user = await getUserById(id);

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  ctx.body = user;
});

router.post('/users', async (ctx) => {
  const { name, email } = ctx.body;
  const user = await createUser({ name, email });
  ctx.status = 201;
  ctx.body = user;
});

app.use(bodyParser());
app.use(router.routesMiddleware());
app.use(notFoundHandler());

app.listen(3000, () => {
  console.log('服务器运行在 http://localhost:3000');
});
```

---

## 12. 企业架构

### 12.1 分层架构

企业级 Node.js 应用通常采用分层架构。

**分层架构示例：**

```javascript
// 项目结构
/*
src/
├── controllers/      # 控制层 - 处理 HTTP 请求
├── services/         # 服务层 - 业务逻辑
├── repositories/      # 数据访问层 - 数据库操作
├── models/            # 模型层 - 数据结构定义
├── middlewares/       # 中间件
├── routes/            # 路由定义
├── utils/             # 工具函数
├── config/            # 配置文件
└── app.js             # 应用入口
*/

// controllers/userController.js
class UserController {
  constructor(userService) {
    this.userService = userService;
  }

  // 获取用户列表
  async getUsers(ctx) {
    const { page = 1, limit = 10 } = ctx.query;

    const result = await this.userService.getUsers({
      page: parseInt(page),
      limit: parseInt(limit)
    });

    ctx.body = result;
  }

  // 获取单个用户
  async getUser(ctx) {
    const { id } = ctx.params;
    const user = await this.userService.getUserById(id);

    if (!user) {
      ctx.status = 404;
      ctx.body = { error: 'User not found' };
      return;
    }

    ctx.body = user;
  }

  // 创建用户
  async createUser(ctx) {
    const userData = ctx.body;
    const user = await this.userService.createUser(userData);

    ctx.status = 201;
    ctx.body = user;
  }
}

// services/userService.js
class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async getUsers({ page, limit }) {
    const [users, total] = await Promise.all([
      this.userRepository.findAll({ page, limit }),
      this.userRepository.count()
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getUserById(id) {
    return await this.userRepository.findById(id);
  }

  async createUser(userData) {
    // 业务逻辑验证
    if (!userData.email) {
      throw new Error('Email is required');
    }

    const existing = await this.userRepository.findByEmail(userData.email);
    if (existing) {
      throw new Error('Email already exists');
    }

    // 密码加密
    userData.passwordHash = await bcrypt.hash(userData.password, 10);
    delete userData.password;

    return await this.userRepository.create(userData);
  }
}

// repositories/userRepository.js
class UserRepository {
  constructor(db) {
    this.db = db;
  }

  async findAll({ page, limit }) {
    const offset = (page - 1) * limit;
    return await this.db.query(
      'SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
  }

  async findById(id) {
    const result = await this.db.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  async findByEmail(email) {
    const result = await this.db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  async create(data) {
    const result = await this.db.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [data.name, data.email, data.passwordHash]
    );
    return result.rows[0];
  }

  async count() {
    const result = await this.db.query('SELECT COUNT(*) FROM users');
    return parseInt(result.rows[0].count);
  }
}
```

### 12.2 微服务

微服务架构将大型应用拆分为独立服务。

**微服务架构示例：**

```javascript
// 服务注册与发现
// service-registry.js
const http = require('http');

class ServiceRegistry {
  constructor() {
    this.services = new Map();
  }

  register(name, address, port) {
    this.services.set(name, { address, port, timestamp: Date.now() });
    console.log(`服务注册: ${name} -> ${address}:${port}`);
  }

  unregister(name) {
    this.services.delete(name);
    console.log(`服务注销: ${name}`);
  }

  get(name) {
    return this.services.get(name);
  }

  getAll() {
    return Array.from(this.services.entries()).map(([name, info]) => ({
      name,
      ...info
    }));
  }
}

const registry = new ServiceRegistry();

// 服务启动时注册自己
const SERVICE_NAME = process.env.SERVICE_NAME || 'user-service';
const SERVICE_PORT = process.env.PORT || 3000;

registry.register(SERVICE_NAME, 'localhost', SERVICE_PORT);

// 优雅关闭时注销
process.on('SIGTERM', () => {
  registry.unregister(SERVICE_NAME);
  process.exit(0);
});

// API 网关
// api-gateway.js
const http = require('http');

class ApiGateway {
  constructor(registry) {
    this.registry = registry;
  }

  async handleRequest(req, targetService, targetPath) {
    const serviceInfo = this.registry.get(targetService);

    if (!serviceInfo) {
      return { status: 503, body: { error: 'Service unavailable' } };
    }

    return new Promise((resolve, reject) => {
      const options = {
        hostname: serviceInfo.address,
        port: serviceInfo.port,
        path: targetPath || req.url,
        method: req.method,
        headers: {
          ...req.headers,
          'X-Forwarded-For': req.socket.remoteAddress
        }
      };

      const proxyReq = http.request(options, (proxyRes) => {
        resolve({
          status: proxyRes.statusCode,
          headers: proxyRes.headers,
          body: proxyRes
        });
      });

      proxyReq.on('error', reject);
      req.pipe(proxyReq);
    });
  }
}
```

### 12.3 DevOps

现代 Node.js 应用的部署和运维实践。

**Docker 部署配置：**

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖（利用缓存）
RUN npm ci --only=production

# 复制源代码
COPY . .

# 第二阶段：生产镜像
FROM node:20-alpine AS production

WORKDIR /app

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 从 builder 复制依赖
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

# 切换用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# 启动命令
CMD ["node", "dist/main.js"]
```

**docker-compose.yml：**

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/myapp
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 12.4 我的思考：工程化思维

**工程化思维的核心要素：**

```
┌─────────────────────────────────────────────────────────────────┐
│                      工程化思维金字塔                              │
│                                                                  │
│                            ▲                                     │
│                           /│\                                    │
│                          / │ \                                   │
│                         /  │  \                                  │
│                        /   │   \                                 │
│                       /────│────\                                │
│                      /     │     \                               │
│                     /      │      \                              │
│                    /       │       \                             │
│                   ─────────│─────────                            │
│                      可维护性                                     │
│                                                                  │
│  可测试性 ─────────────────────────────────────────────────      │
│                                                                  │
│     可靠性 ─────────────────────────────────────────────────     │
│                                                                  │
│        性能 ─────────────────────────────────────────────────    │
│                                                                  │
│           安全性 ───────────────────────────────────────────── │
│                                                                  │
│              可扩展性 ──────────────────────────────────────── │
└─────────────────────────────────────────────────────────────────┘
```

**从需求到上线的完整流程：**

```javascript
/**
 * 工程化开发流程：
 *
 * 1. 需求分析
 *    - 理解业务目标
 *    - 识别关键用户故事
 *    - 评估技术风险
 *
 * 2. 架构设计
 *    - 选择合适的架构模式
 *    - 定义模块边界
 *    - 规划数据流
 *
 * 3. 编码规范
 *    - 统一代码风格 (ESLint + Prettier)
 *    - 命名规范
 *    - 注释规范
 *
 * 4. 自动化测试
 *    - 单元测试 (Jest/Vitest)
 *    - 集成测试
 *    - E2E 测试 (Playwright)
 *
 * 5. CI/CD 流程
 *    - 代码检查
 *    - 自动测试
 *    - 自动部署
 *
 * 6. 监控运维
 *    - 日志收集
 *    - 性能监控
 *    - 错误追踪
 */

// 实践中的工程化 Checklist
const projectChecklist = {
  // 代码质量
  codeQuality: [
    '代码风格统一 (ESLint + Prettier)',
    'TypeScript 类型覆盖',
    'Git hooks (husky + lint-staged)',
    '代码审查 (Code Review)'
  ],

  // 测试覆盖
  testing: [
    '单元测试覆盖率 > 80%',
    '关键路径集成测试',
    'E2E 冒烟测试',
    '性能基准测试'
  ],

  // 安全
  security: [
    '依赖安全扫描 (npm audit)',
    '输入验证和 sanitization',
    '敏感信息加密存储',
    'API 认证和授权'
  ],

  // 部署
  deployment: [
    '环境配置分离',
    '容器化部署',
    '健康检查端点',
    '优雅关闭处理',
    '回滚策略'
  ],

  // 监控
  monitoring: [
    '结构化日志',
    '性能指标采集',
    '错误追踪 (Sentry)',
    '业务指标监控'
  ]
};

console.log('工程化检查清单:', projectChecklist);
```

**持续改进的实践：**

```javascript
/**
 * 技术债务管理
 * - 定期识别和记录技术债务
 * - 安排时间偿还债务
 * - 将债务可视化
 */

// 技术债务记录
const techDebt = [
  {
    id: 'TD-001',
    title: '用户服务缺少索引',
    impact: 'high',
    effort: 'medium',
    createdAt: '2024-01-15',
    status: 'pending'
  },
  {
    id: 'TD-002',
    title: '认证模块需要重构',
    impact: 'medium',
    effort: 'high',
    createdAt: '2024-02-20',
    status: 'in-progress'
  }
];

/**
 * 性能优化迭代
 * - 建立性能基准
 * - 定期性能测试
 * - 持续优化
 */

// 性能基准测试
class PerformanceBenchmark {
  constructor() {
    this.baseline = {};
  }

  setBaseline(name, value) {
    this.baseline[name] = {
      value,
      timestamp: Date.now()
    };
  }

  compare(name, current) {
    const baseline = this.baseline[name];
    if (!baseline) {
      console.log(`${name}: 首次记录 ${current}`);
      return null;
    }

    const change = ((current - baseline.value) / baseline.value * 100).toFixed(2);
    const status = change > 0 ? '退化' : '改进';

    console.log(`${name}: ${baseline.value} -> ${current} (${status} ${change}%)`);

    return { baseline: baseline.value, current, change };
  }
}

const benchmark = new PerformanceBenchmark();
benchmark.setBaseline('API响应时间', 120);  // ms
benchmark.compare('API响应时间', 115);       // 改进 -4.17%
```

---

## 总结

本指南涵盖了 Node.js 进阶开发的各个方面，从底层架构到企业级应用实践。通过深入理解 V8 引擎、事件循环、Streams、进程管理等核心概念，你将能够构建高性能、可靠的 Node.js 应用。

**关键要点：**

1. **架构理解**：掌握 V8 和 libuv 的工作原理，理解事件循环的各个阶段
2. **异步编程**：熟练使用 Promise 和 async/await，注意并发控制和错误处理
3. **Streams**：使用流处理大文件和数据管道，注意背压处理
4. **进程管理**：使用 cluster 实现负载均衡，使用 PM2 管理生产进程
5. **内存管理**：理解 V8 垃圾回收机制，警惕内存泄漏
6. **安全**：严格验证输入，防范 XSS、SQL 注入、CSRF 等攻击
7. **测试**：建立完整的测试金字塔，确保代码质量
8. **工程化**：采用分层架构，实施 DevOps 实践

持续学习和实践是成为 Node.js 专家的关键。建议结合实际项目，不断深化对这些概念的理解和应用。
