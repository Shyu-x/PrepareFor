# JavaScript异步编程完全指南

## 目录

1. [异步编程概述](#1-异步编程概述)
2. [回调函数](#2-回调函数)
3. [Promise详解](#3-promise详解)
4. [Async/Await](#4-asyncawait)
5. [事件循环机制](#5-事件循环机制)
6. [异步编程模式](#6-异步编程模式)
7. [面试高频问题](#7-面试高频问题)

---

## 1. 异步编程概述

### 1.1 为什么需要异步？

```javascript
// JavaScript异步编程概述

/*
JavaScript是单线程语言，所有代码在主线程上执行。
如果所有操作都是同步的，那么耗时操作会阻塞整个程序。

异步编程的优势：
1. 避免阻塞主线程
2. 提高程序响应能力
3. 更好地处理I/O操作
4. 提升用户体验
*/

// 同步代码示例（阻塞）
function syncOperation() {
  // 模拟耗时操作
  const start = Date.now();
  while (Date.now() - start < 1000) {
    // 阻塞1秒
  }
  console.log('同步操作完成');
}

console.log('开始');
syncOperation(); // 阻塞1秒
console.log('结束');

// 输出：
// 开始
// （等待1秒）
// 同步操作完成
// 结束

// 异步代码示例（非阻塞）
function asyncOperation() {
  setTimeout(() => {
    console.log('异步操作完成');
  }, 1000);
}

console.log('开始');
asyncOperation(); // 不阻塞
console.log('结束');

// 输出：
// 开始
// 结束
// （1秒后）
// 异步操作完成
```

### 1.2 异步编程演进

```
┌─────────────────────────────────────────────────────────────┐
│                   异步编程演进历程                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  回调函数 (Callbacks)                                       │
│  ├── 最早的异步处理方式                                     │
│  ├── 简单直接                                               │
│  └── 问题：回调地狱                                         │
│                                                             │
│          ▼                                                  │
│                                                             │
│  Promise (ES6)                                              │
│  ├── 链式调用                                               │
│  ├── 更好的错误处理                                         │
│  └── 问题：链式调用仍显冗长                                 │
│                                                             │
│          ▼                                                  │
│                                                             │
│  Generator (ES6)                                            │
│  ├── 可暂停执行                                             │
│  ├── 配合co库实现异步                                       │
│  └── 问题：需要额外库支持                                   │
│                                                             │
│          ▼                                                  │
│                                                             │
│  Async/Await (ES2017)                                       │
│  ├── 同步写法处理异步                                       │
│  ├── 最佳可读性                                             │
│  └── 当前主流方案                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 回调函数

### 2.1 回调函数基础

```javascript
// 回调函数基础

// 1. 基本回调
function fetchData(callback) {
  setTimeout(() => {
    const data = { name: '张三', age: 25 };
    callback(data);
  }, 1000);
}

fetchData((data) => {
  console.log('获取到数据:', data);
});

// 2. 错误优先回调（Node.js风格）
function readFile(path, callback) {
  fs.readFile(path, 'utf8', (err, data) => {
    if (err) {
      callback(err, null);
      return;
    }
    callback(null, data);
  });
}

readFile('data.txt', (err, data) => {
  if (err) {
    console.error('读取失败:', err);
    return;
  }
  console.log('读取成功:', data);
});

// 3. 事件回调
document.getElementById('button').addEventListener('click', (event) => {
  console.log('按钮被点击');
});

// 4. 定时器回调
setTimeout(() => {
  console.log('1秒后执行');
}, 1000);

setInterval(() => {
  console.log('每秒执行一次');
}, 1000);

// 5. 数组方法回调
const numbers = [1, 2, 3, 4, 5];

const doubled = numbers.map((n) => n * 2);
const evens = numbers.filter((n) => n % 2 === 0);
const sum = numbers.reduce((acc, n) => acc + n, 0);

numbers.forEach((n) => {
  console.log(n);
});
```

### 2.2 回调地狱与解决方案

```javascript
// 回调地狱示例

// ❌ 回调地狱
function getUserData(userId, callback) {
  getUser(userId, (user) => {
    getPosts(user.id, (posts) => {
      getComments(posts[0].id, (comments) => {
        getCommentAuthor(comments[0].authorId, (author) => {
          // 嵌套层级太深，难以维护
          console.log('作者:', author.name);
          callback(author);
        });
      });
    });
  });
}

// ✅ 解决方案1：拆分函数
function getCommentAuthor(userId, callback) {
  getUser(userId, callback);
}

function getPostComments(postId, callback) {
  getComments(postId, (comments) => {
    getCommentAuthor(comments[0].authorId, callback);
  });
}

function getUserPosts(userId, callback) {
  getPosts(userId, (posts) => {
    getPostComments(posts[0].id, callback);
  });
}

function getUserData(userId, callback) {
  getUser(userId, (user) => {
    getUserPosts(user.id, callback);
  });
}

// ✅ 解决方案2：使用Promise
function getUserDataAsync(userId) {
  return getUser(userId)
    .then(user => getPosts(user.id))
    .then(posts => getComments(posts[0].id))
    .then(comments => getCommentAuthor(comments[0].authorId));
}

// ✅ 解决方案3：使用async/await
async function getUserDataModern(userId) {
  const user = await getUser(userId);
  const posts = await getPosts(user.id);
  const comments = await getComments(posts[0].id);
  const author = await getCommentAuthor(comments[0].authorId);
  return author;
}
```

---

## 3. Promise详解

### 3.1 Promise基础

```javascript
// Promise基础

// 1. 创建Promise
const promise = new Promise((resolve, reject) => {
  // 异步操作
  setTimeout(() => {
    const success = true;

    if (success) {
      resolve('操作成功'); // 成功时调用
    } else {
      reject(new Error('操作失败')); // 失败时调用
    }
  }, 1000);
});

// 2. 使用Promise
promise
  .then((result) => {
    console.log('成功:', result);
    return '处理后的结果'; // 返回值会传递给下一个then
  })
  .then((result) => {
    console.log('链式调用:', result);
  })
  .catch((error) => {
    console.error('失败:', error);
  })
  .finally(() => {
    console.log('无论成功失败都执行');
  });

// 3. Promise状态
/*
Promise有三种状态：
- pending: 初始状态，既未完成也未失败
- fulfilled: 操作成功完成
- rejected: 操作失败

状态一旦改变，就不会再变。
只能从 pending -> fulfilled 或 pending -> rejected
*/

// 4. 封装回调为Promise
function promisify(fn) {
  return function (...args) {
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

// 使用util.promisify
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);

// 5. Promise.resolve和Promise.reject
const resolved = Promise.resolve('立即成功');
const rejected = Promise.reject(new Error('立即失败'));

// 6. Promise链式调用
fetch('/api/user')
  .then(response => response.json())
  .then(user => fetch(`/api/posts/${user.id}`))
  .then(response => response.json())
  .then(posts => console.log(posts))
  .catch(error => console.error(error));
```

### 3.2 Promise静态方法

```javascript
// Promise静态方法

// 1. Promise.all - 所有Promise都成功才成功
const promises = [
  fetch('/api/users'),
  fetch('/api/posts'),
  fetch('/api/comments'),
];

Promise.all(promises)
  .then(([users, posts, comments]) => {
    console.log('所有请求完成');
    console.log('用户:', users);
    console.log('文章:', posts);
    console.log('评论:', comments);
  })
  .catch((error) => {
    // 任何一个Promise失败都会触发
    console.error('有一个请求失败:', error);
  });

// 2. Promise.allSettled - 等待所有Promise完成
Promise.allSettled([
  Promise.resolve('成功1'),
  Promise.reject('失败1'),
  Promise.resolve('成功2'),
])
  .then((results) => {
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        console.log('成功:', result.value);
      } else {
        console.log('失败:', result.reason);
      }
    });
  });

// 3. Promise.race - 返回最先完成的Promise
Promise.race([
  fetch('/api/server1'),
  fetch('/api/server2'),
])
  .then((response) => {
    console.log('最快的响应:', response);
  })
  .catch((error) => {
    console.error('最快的失败:', error);
  });

// 4. Promise.any - 返回第一个成功的Promise
Promise.any([
  Promise.reject('失败1'),
  Promise.resolve('成功1'),
  Promise.resolve('成功2'),
])
  .then((result) => {
    console.log('第一个成功:', result); // '成功1'
  })
  .catch((error) => {
    // 所有Promise都失败时触发
    console.error('全部失败:', error);
  });

// 5. 实现Promise.all
function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    const results = [];
    let completed = 0;

    promises.forEach((promise, index) => {
      Promise.resolve(promise)
        .then((result) => {
          results[index] = result;
          completed++;

          if (completed === promises.length) {
            resolve(results);
          }
        })
        .catch(reject);
    });
  });
}

// 6. 实现Promise.race
function promiseRace(promises) {
  return new Promise((resolve, reject) => {
    promises.forEach((promise) => {
      Promise.resolve(promise).then(resolve).catch(reject);
    });
  });
}
```

### 3.3 Promise实战应用

```javascript
// Promise实战应用

// 1. 请求重试
function fetchWithRetry(url, options = {}, retries = 3) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      fetch(url, options)
        .then(resolve)
        .catch((error) => {
          if (n === 0) {
            reject(error);
          } else {
            console.log(`重试剩余 ${n} 次`);
            setTimeout(() => attempt(n - 1), 1000);
          }
        });
    };
    attempt(retries);
  });
}

// 2. 请求超时
function fetchWithTimeout(url, options = {}, timeout = 5000) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('请求超时')), timeout)
    ),
  ]);
}

// 3. 并发控制
async function limitConcurrency(tasks, limit) {
  const results = [];
  const executing = [];

  for (const task of tasks) {
    const promise = Promise.resolve().then(() => task());
    results.push(promise);

    if (limit <= tasks.length) {
      const exec = promise.then(() => {
        executing.splice(executing.indexOf(exec), 1);
      });
      executing.push(exec);

      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }

  return Promise.all(results);
}

// 使用
const urls = ['/api/1', '/api/2', '/api/3', '/api/4', '/api/5'];
const tasks = urls.map((url) => () => fetch(url));

limitConcurrency(tasks, 2).then((results) => {
  console.log('所有请求完成');
});

// 4. 缓存Promise
class PromiseCache {
  constructor() {
    this.cache = new Map();
  }

  get(key, factory) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const promise = factory();
    this.cache.set(key, promise);

    // 失败时清除缓存
    promise.catch(() => {
      this.cache.delete(key);
    });

    return promise;
  }
}

// 使用
const cache = new PromiseCache();

function getUser(id) {
  return cache.get(`user-${id}`, () =>
    fetch(`/api/users/${id}`).then((res) => res.json())
  );
}

// 5. 请求取消
class CancelablePromise {
  constructor(executor) {
    this.canceled = false;
    this.promise = new Promise((resolve, reject) => {
      executor(
        (value) => {
          if (!this.canceled) {
            resolve(value);
          }
        },
        (reason) => {
          if (!this.canceled) {
            reject(reason);
          }
        }
      );
    });
  }

  cancel() {
    this.canceled = true;
  }

  then(onFulfilled, onRejected) {
    return this.promise.then(onFulfilled, onRejected);
  }

  catch(onRejected) {
    return this.promise.catch(onRejected);
  }
}

// 使用AbortController
const controller = new AbortController();
const signal = controller.signal;

fetch('/api/data', { signal })
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => {
    if (error.name === 'AbortError') {
      console.log('请求被取消');
    }
  });

// 取消请求
controller.abort();
```

---

## 4. Async/Await

### 4.1 Async/Await基础

```javascript
// Async/Await基础

// 1. async函数
async function fetchData() {
  return '数据'; // 自动包装成Promise
}

// 等价于
function fetchData() {
  return Promise.resolve('数据');
}

// 2. await表达式
async function getData() {
  const response = await fetch('/api/data'); // 等待Promise解决
  const data = await response.json();
  return data;
}

// 3. 错误处理
async function fetchWithErrorHandling() {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('请求失败:', error);
    throw error; // 可以重新抛出
  }
}

// 4. 并行执行
async function fetchParallel() {
  // 串行执行（慢）
  // const user = await fetch('/api/user');
  // const posts = await fetch('/api/posts');

  // 并行执行（快）
  const [userResponse, postsResponse] = await Promise.all([
    fetch('/api/user'),
    fetch('/api/posts'),
  ]);

  const user = await userResponse.json();
  const posts = await postsResponse.json();

  return { user, posts };
}

// 5. 循环中使用await
async function processItems(items) {
  // 串行处理
  for (const item of items) {
    await processItem(item);
  }

  // 并行处理
  await Promise.all(items.map((item) => processItem(item)));
}

// 6. 条件执行
async function conditionalFetch(shouldFetch) {
  if (shouldFetch) {
    return await fetch('/api/data');
  }
  return null;
}

// 7. 返回值
async function example() {
  // return value 等价于 Promise.resolve(value)
  return '成功';

  // throw error 等价于 Promise.reject(error)
  // throw new Error('失败');
}

// 8. 箭头函数
const fetchData = async () => {
  const data = await fetch('/api/data');
  return data.json();
};

// 9. 对象方法
const api = {
  async getData() {
    const response = await fetch('/api/data');
    return response.json();
  },
};

// 10. 类方法
class ApiClient {
  async fetchData(url) {
    const response = await fetch(url);
    return response.json();
  }
}
```

### 4.2 Async/Await模式

```javascript
// Async/Await常用模式

// 1. 顺序执行
async function sequential() {
  const result1 = await step1();
  const result2 = await step2(result1);
  const result3 = await step3(result2);
  return result3;
}

// 2. 并行执行
async function parallel() {
  const [result1, result2, result3] = await Promise.all([
    step1(),
    step2(),
    step3(),
  ]);
  return { result1, result2, result3 };
}

// 3. 竞速执行
async function racing() {
  return await Promise.race([
    fetchFromServer1(),
    fetchFromServer2(),
  ]);
}

// 4. 批处理
async function batchProcess(items, batchSize = 10) {
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((item) => processItem(item))
    );
    results.push(...batchResults);
  }

  return results;
}

// 5. 重试模式
async function retry(fn, maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2; // 指数退避
    }
  }
}

// 使用
const data = await retry(() => fetchData(), 3, 1000);

// 6. 超时模式
async function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), ms)
  );
  return Promise.race([promise, timeout]);
}

// 使用
const data = await withTimeout(fetchData(), 5000);

// 7. 缓存模式
const cache = new Map();

async function withCache(key, fn) {
  if (cache.has(key)) {
    return cache.get(key);
  }

  const result = await fn();
  cache.set(key, result);
  return result;
}

// 8. 队列模式
class AsyncQueue {
  constructor(concurrency = 1) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  async run(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.process();
    });
  }

  async process() {
    while (this.queue.length > 0 && this.running < this.concurrency) {
      const { task, resolve, reject } = this.queue.shift();
      this.running++;

      try {
        const result = await task();
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        this.running--;
        this.process();
      }
    }
  }
}

// 使用
const queue = new AsyncQueue(3); // 并发3个

const results = await Promise.all([
  queue.run(() => fetch('/api/1')),
  queue.run(() => fetch('/api/2')),
  queue.run(() => fetch('/api/3')),
  queue.run(() => fetch('/api/4')),
]);
```

---

## 5. 事件循环机制

### 5.1 事件循环详解

```javascript
// JavaScript事件循环机制

/*
┌─────────────────────────────────────────────────────────────┐
│                     事件循环流程                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌───────────────────────────────────────────────────┐    │
│   │                   Call Stack                       │    │
│   │              (调用栈，同步代码执行)                 │    │
│   └───────────────────────────────────────────────────┘    │
│                           │                                 │
│                           ▼                                 │
│   ┌───────────────────────────────────────────────────┐    │
│   │                   Microtask Queue                  │    │
│   │        (微任务队列: Promise, process.nextTick)     │    │
│   └───────────────────────────────────────────────────┘    │
│                           │                                 │
│                           ▼                                 │
│   ┌───────────────────────────────────────────────────┐    │
│   │                   Macrotask Queue                  │    │
│   │     (宏任务队列: setTimeout, setInterval, I/O)     │    │
│   └───────────────────────────────────────────────────┘    │
│                                                             │
│   执行顺序:                                                 │
│   1. 执行调用栈中的同步代码                                 │
│   2. 调用栈清空后，执行所有微任务                           │
│   3. 执行一个宏任务                                         │
│   4. 重复步骤2-3                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
*/

// 执行顺序示例
console.log('1. 同步代码开始');

setTimeout(() => {
  console.log('2. setTimeout (宏任务)');
}, 0);

Promise.resolve()
  .then(() => {
    console.log('3. Promise.then (微任务)');
  })
  .then(() => {
    console.log('4. Promise.then链 (微任务)');
  });

console.log('5. 同步代码结束');

// 输出顺序:
// 1. 同步代码开始
// 5. 同步代码结束
// 3. Promise.then (微任务)
// 4. Promise.then链 (微任务)
// 2. setTimeout (宏任务)

// 复杂示例
async function async1() {
  console.log('async1 start');
  await async2();
  console.log('async1 end');
}

async function async2() {
  console.log('async2');
}

console.log('script start');

setTimeout(() => {
  console.log('setTimeout');
}, 0);

async1();

new Promise((resolve) => {
  console.log('promise1');
  resolve();
}).then(() => {
  console.log('promise2');
});

console.log('script end');

// 输出顺序:
// script start
// async1 start
// async2
// promise1
// script end
// async1 end
// promise2
// setTimeout
```

### 5.2 微任务与宏任务

```javascript
// 微任务与宏任务分类

/*
微任务 (Microtask):
- Promise.then/catch/finally
- process.nextTick (Node.js)
- queueMicrotask()
- MutationObserver

宏任务 (Macrotask):
- setTimeout
- setInterval
- setImmediate (Node.js)
- I/O操作
- UI渲染
- requestAnimationFrame
*/

// 微任务优先级
Promise.resolve().then(() => console.log('Promise 1'));
queueMicrotask(() => console.log('queueMicrotask'));

// Node.js中 process.nextTick 优先级最高
// process.nextTick(() => console.log('nextTick'));

// requestAnimationFrame在渲染前执行
requestAnimationFrame(() => {
  console.log('requestAnimationFrame');
});

// 实际应用：确保在DOM更新后执行
function waitForDOMUpdate() {
  return new Promise((resolve) => {
    queueMicrotask(resolve);
  });
}

// 批量更新优化
let pending = false;

function scheduleUpdate() {
  if (!pending) {
    pending = true;
    queueMicrotask(() => {
      pending = false;
      // 执行更新
      console.log('批量更新');
    });
  }
}

scheduleUpdate();
scheduleUpdate();
scheduleUpdate();
// 只输出一次 '批量更新'
```

---

## 6. 异步编程模式

### 6.1 发布订阅模式

```javascript
// 发布订阅模式实现异步通信

class EventEmitter {
  constructor() {
    this.events = new Map();
  }

  // 订阅事件
  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event).add(callback);
    return () => this.off(event, callback);
  }

  // 取消订阅
  off(event, callback) {
    if (this.events.has(event)) {
      this.events.get(event).delete(callback);
    }
  }

  // 发布事件
  emit(event, ...args) {
    if (this.events.has(event)) {
      this.events.get(event).forEach((callback) => {
        callback(...args);
      });
    }
  }

  // 只订阅一次
  once(event, callback) {
    const wrapper = (...args) => {
      callback(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  // 异步事件
  async emitAsync(event, ...args) {
    if (this.events.has(event)) {
      await Promise.all(
        Array.from(this.events.get(event)).map((callback) =>
          Promise.resolve(callback(...args))
        )
      );
    }
  }
}

// 使用
const emitter = new EventEmitter();

emitter.on('data', (data) => {
  console.log('收到数据:', data);
});

emitter.emit('data', { name: '张三' });
```

### 6.2 观察者模式

```javascript
// 观察者模式

class Observable {
  constructor(value) {
    this._value = value;
    this._observers = new Set();
  }

  get value() {
    return this._value;
  }

  set value(newValue) {
    if (this._value !== newValue) {
      this._value = newValue;
      this._notify();
    }
  }

  subscribe(observer) {
    this._observers.add(observer);
    return () => this._observers.delete(observer);
  }

  _notify() {
    this._observers.forEach((observer) => {
      observer(this._value);
    });
  }
}

// 使用
const name = new Observable('张三');

name.subscribe((value) => {
  console.log('名字变更为:', value);
});

name.value = '李四'; // 输出: 名字变更为: 李四
```

### 6.3 异步迭代器

```javascript
// 异步迭代器

// 1. 异步生成器
async function* asyncGenerator() {
  yield await Promise.resolve(1);
  yield await Promise.resolve(2);
  yield await Promise.resolve(3);
}

// 使用
(async () => {
  for await (const value of asyncGenerator()) {
    console.log(value);
  }
})();

// 2. 异步迭代器类
class AsyncQueue {
  constructor() {
    this.queue = [];
    this.resolvers = [];
  }

  push(value) {
    if (this.resolvers.length > 0) {
      const resolve = this.resolvers.shift();
      resolve({ value, done: false });
    } else {
      this.queue.push(value);
    }
  }

  [Symbol.asyncIterator]() {
    return {
      next: () => {
        if (this.queue.length > 0) {
          return Promise.resolve({
            value: this.queue.shift(),
            done: false,
          });
        }
        return new Promise((resolve) => {
          this.resolvers.push(resolve);
        });
      },
    };
  }
}

// 使用
const queue = new AsyncQueue();

// 生产者
setTimeout(() => queue.push('数据1'), 1000);
setTimeout(() => queue.push('数据2'), 2000);
setTimeout(() => queue.push('数据3'), 3000);

// 消费者
(async () => {
  for await (const data of queue) {
    console.log('收到:', data);
  }
})();
```

---

## 7. 面试高频问题

### 问题1：Promise的状态有哪些？

**答案：** Promise有三种状态：
- `pending`：初始状态
- `fulfilled`：操作成功
- `rejected`：操作失败

状态只能改变一次，不可逆。

### 问题2：Promise.all和Promise.allSettled的区别？

**答案：**
- `Promise.all`：所有Promise成功才成功，一个失败就失败
- `Promise.allSettled`：等待所有Promise完成，返回每个Promise的结果

### 问题3：事件循环的执行顺序？

**答案：**
1. 执行同步代码
2. 执行微任务队列中的所有任务
3. 执行一个宏任务
4. 重复步骤2-3

### 问题4：async/await的原理？

**答案：** async/await是Promise的语法糖：
- async函数返回Promise
- await暂停函数执行，等待Promise解决
- 本质是Generator + Promise

### 问题5：如何处理并发请求？

**答案：**
```javascript
// 并行执行
const results = await Promise.all([fetch1(), fetch2(), fetch3()]);

// 限制并发数
const results = await limitConcurrency(tasks, 3);
```

---

## 8. 最佳实践总结

### 8.1 异步编程清单

- [ ] 优先使用async/await
- [ ] 正确处理错误
- [ ] 避免回调地狱
- [ ] 合理使用Promise.all
- [ ] 注意事件循环顺序
- [ ] 实现请求取消
- [ ] 添加超时处理

### 8.2 常见陷阱

| 陷阱 | 解决方案 |
|------|----------|
| 忘记await | 使用lint规则检查 |
| 并行变串行 | 使用Promise.all |
| 错误未捕获 | 添加catch处理 |
| 内存泄漏 | 取消未完成的请求 |

---

*本文档最后更新于 2026年3月*