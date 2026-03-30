# JavaScript事件循环与异步执行深度解析（2026版）

> **深入理解JavaScript事件循环、宏任务、微任务、async/await等异步编程核心机制**

---

## 目录

- [1. 事件循环基础](#1-事件循环基础)
  - [1.1 JavaScript单线程模型](#11-javascript单线程模型)
  - [1.2 调用栈与任务队列](#12-调用栈与任务队列)
  - [1.3 事件循环完整流程](#13-事件循环完整流程)
- [2. 宏任务与微任务](#2-宏任务与微任务)
  - [2.1 宏任务类型](#21-宏任务类型)
  - [2.2 微任务类型](#22-微任务类型)
  - [2.3 宏任务与微任务对比](#23-宏任务与微任务对比)
- [3. Promise执行机制](#3-promise执行机制)
  - [3.1 Promise基础](#31-promise基础)
  - [3.2 Promise链式调用](#32-promise链式调用)
  - [3.3 Promise静态方法](#33-promise静态方法)
- [4. async/await原理](#4-asyncawait原理)
  - [4.1 async/await基础](#41-asyncawait基础)
  - [4.2 await执行机制](#42-await执行机制)
  - [4.3 async/await错误处理](#43-asyncawait错误处理)
- [5. 复杂异步代码分析](#5-复杂异步代码分析)
  - [5.1 经典面试题解析](#51-经典面试题解析)
  - [5.2 async/await与Promise混合](#52-asyncawait与promise混合)
  - [5.3 微任务阻塞问题](#53-微任务阻塞问题)
- [6. 实战应用](#6-实战应用)
  - [6.1 并行与串行执行](#61-并行与串行执行)
  - [6.2 重试机制实现](#62-重试机制实现)
  - [6.3 限流器实现](#63-限流器实现)

---

## 1. 事件循环基础

### 1.1 JavaScript单线程模型

JavaScript是一门**单线程**语言，这意味着在同一时间只能执行一条指令。然而，现代Web应用需要处理大量的网络请求、定时器和用户交互。

```javascript
// 单线程模型示意图
// ┌─────────────────────────────────────────────────────┐
// │              JavaScript调用栈（Call Stack）       │
// │  - 同步代码执行                                     │
// │  - 函数调用入栈                                     │
// │  - 函数返回出栈                                     │
// └─────────────────────────────────────────────────────┘
//           │
//           ▼
// ┌─────────────────────────────────────────────────────┐
// │              Web APIs（浏览器提供）               │
// │  - setTimeout/setInterval                         │
// │  - fetch/XMLHttpRequest                           │
// │  - DOM事件                                        │
// │  - Promise                                        │
// └─────────────────────────────────────────────────────┘
//           │
//           ▼
// ┌─────────────────────────────────────────────────────┐
// │              任务队列（Task Queue）               │
// │  - 宏任务队列（Macrotask Queue）                   │
// │  - 微任务队列（Microtask Queue）                   │
// └─────────────────────────────────────────────────────┘
```

**单线程的优势**：
- 简单：不需要处理多线程同步问题
- 可预测：执行顺序确定
- 适合DOM操作：避免并发修改DOM

**单线程的挑战**：
- 阻塞：长时间运行会阻塞UI渲染
- 异步：需要事件循环处理异步操作

### 1.2 调用栈与任务队列

**调用栈（Call Stack）**：
- LIFO（后进先出）数据结构
- 存储函数调用
- 栈溢出：调用栈过深会导致错误

```javascript
// 调用栈示例
function first() {
  console.log('first');
}

function second() {
  first();
  console.log('second');
}

function third() {
  second();
  console.log('third');
}

third();
// 调用栈：third → second → first
```

**任务队列（Task Queue）**：
- FIFO（先进先出）数据结构
- 存储待执行的回调函数
- 分为宏任务队列和微任务队列

```javascript
// 任务队列示例
console.log('1. 同步代码');

setTimeout(() => {
  console.log('2. 宏任务');
}, 0);

Promise.resolve().then(() => {
  console.log('3. 微任务');
});

console.log('4. 同步代码');

// 输出顺序：
// 1. 同步代码
// 4. 同步代码
// 3. 微任务
// 2. 宏任务
```

### 1.3 事件循环完整流程

**事件循环（Event Loop）**是JavaScript实现异步编程的核心机制。

```javascript
// 事件循环伪代码
while (true) {
  // 1. 执行同步代码
  executeSyncCode();
  
  // 2. 清空微任务队列
  while (microtaskQueue.length > 0) {
    const task = microtaskQueue.shift();
    task();
  }
  
  // 3. 执行一个宏任务
  if (macrotaskQueue.length > 0) {
    const task = macrotaskQueue.shift();
    task();
  }
  
  // 4. UI渲染
  renderUI();
}
```

**事件循环详细流程**：

```
┌─────────────────────────────────────────────────────┐
│              JavaScript调用栈（Call Stack）       │
│  1. 执行同步代码                                     │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│              微任务队列（Microtask Queue）       │
│  2. 清空微任务队列（包括新创建的微任务）           │
│  - Promise.then/catch/finally                     │
│  - queueMicrotask                                 │
│  - MutationObserver                               │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│              宏任务队列（Macrotask Queue）       │
│  3. 执行一个宏任务                                 │
│  - setTimeout/setInterval                         │
│  - setImmediate（Node.js）                        │
│  - I/O操作                                        │
│  - UI渲染                                        │
└─────────────────────────────────────────────────────┘
```

**执行顺序规则**：
1. 执行同步代码（调用栈）
2. 清空微任务队列（包括新创建的微任务）
3. 执行一个宏任务
4. 清空微任务队列
5. 重复步骤3-4

### 1.4 实战案例：事件循环分析

```javascript
console.log('1. Script Start');

setTimeout(() => {
  console.log('2. setTimeout 1');
  Promise.resolve().then(() => {
    console.log('3. promise inside setTimeout 1');
  });
}, 0);

Promise.resolve().then(() => {
  console.log('4. Promise 1');
}).then(() => {
  console.log('5. Promise 2');
});

setTimeout(() => {
  console.log('6. setTimeout 2');
}, 0);

console.log('7. Script End');

// 执行过程分析：
// 1. 同步代码执行：
//    - 打印 '1. Script Start'
//    - 遇到setTimeout 1，回调放入宏任务队列
//    - 遇到Promise 1，then回调放入微任务队列
//    - 遇到setTimeout 2，回调放入宏任务队列
//    - 打印 '7. Script End'

// 2. 清空微任务队列：
//    - 执行Promise 1的then回调，打印 '4. Promise 1'
//    - 返回新的Promise，其then回调放入微任务队列
//    - 执行新的then回调，打印 '5. Promise 2'

// 3. 执行第一个宏任务（setTimeout 1）：
//    - 打印 '2. setTimeout 1'
//    - 遇到Promise，then回调放入微任务队列
//    - 清空微任务队列，打印 '3. promise inside setTimeout 1'

// 4. 执行第二个宏任务（setTimeout 2）：
//    - 打印 '6. setTimeout 2'

// 最终输出顺序：
// 1. Script Start
// 7. Script End
// 4. Promise 1
// 5. Promise 2
// 2. setTimeout 1
// 3. promise inside setTimeout 1
// 6. setTimeout 2
```

---

## 2. 宏任务与微任务

### 2.1 宏任务类型

**宏任务（Macrotask）**：
- setTimeout
- setInterval
- setImmediate（Node.js）
- I/O操作
- UI渲染
- MessageChannel

```javascript
// 宏任务示例
console.log('1. 同步代码');

setTimeout(() => {
  console.log('2. setTimeout');
}, 0);

setInterval(() => {
  console.log('3. setInterval');
}, 1000);

setImmediate(() => {
  console.log('4. setImmediate');
});

// Node.js中使用
const fs = require('fs');
fs.readFile('file.txt', (err, data) => {
  console.log('5. I/O操作');
});

console.log('6. 同步代码');
```

**宏任务特性**：
- 每次事件循环只执行一个宏任务
- 执行完宏任务后清空微任务队列
- 宏任务之间可以进行UI渲染

### 2.2 微任务类型

**微任务（Microtask）**：
- Promise.then/catch/finally
- queueMicrotask
- MutationObserver
- Node.js: process.nextTick

```javascript
// 微任务示例
console.log('1. 同步代码');

Promise.resolve().then(() => {
  console.log('2. Promise.then');
});

Promise.resolve().then(() => {
  console.log('3. Promise.then 2');
});

queueMicrotask(() => {
  console.log('4. queueMicrotask');
});

// MutationObserver示例
const observer = new MutationObserver(() => {
  console.log('5. MutationObserver');
});

observer.observe(document.body, { childList: true });
document.body.appendChild(document.createElement('div'));

console.log('6. 同步代码');
```

**微任务特性**：
- 优先级高于宏任务
- 执行完微任务队列才执行宏任务
- 微任务中可以创建新的微任务

### 2.3 宏任务与微任务对比

**对比表**：

| 特性 | 宏任务 | 微任务 |
|------|--------|--------|
| 优先级 | 低 | 高 |
| 执行时机 | 微任务清空后 | 同步代码后 |
| 数量 | 每次执行一个 | 清空整个队列 |
| 常见类型 | setTimeout、setInterval | Promise.then、queueMicrotask |
| UI渲染 | 可以 | 不可以 |

**执行顺序测试**：

```javascript
console.log('1. 同步代码');

// 宏任务
setTimeout(() => {
  console.log('2. setTimeout');
}, 0);

// 微任务
Promise.resolve().then(() => {
  console.log('3. Promise.then');
});

queueMicrotask(() => {
  console.log('4. queueMicrotask');
});

// 宏任务
setTimeout(() => {
  console.log('5. setTimeout 2');
}, 0);

console.log('6. 同步代码');

// 输出顺序：
// 1. 同步代码
// 6. 同步代码
// 3. Promise.then
// 4. queueMicrotask
// 2. setTimeout
// 5. setTimeout 2
```

**微任务中创建微任务**：

```javascript
Promise.resolve().then(() => {
  console.log('1. 第一个微任务');
  Promise.resolve().then(() => {
    console.log('2. 第二个微任务（在第一个微任务中创建）');
  });
});

// 输出：
// 1. 第一个微任务
// 2. 第二个微任务（在第一个微任务中创建）

// 说明：微任务队列会清空到空为止，包括在执行微任务期间新创建的微任务
```

---

## 3. Promise执行机制

### 3.1 Promise基础

**Promise状态**：
- pending：进行中
- fulfilled：已成功
- rejected：已失败

```javascript
// Promise基础示例
const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    const random = Math.random();
    if (random > 0.5) {
      resolve(`成功: ${random}`);
    } else {
      reject(new Error(`失败: ${random}`));
    }
  }, 1000);
});

promise
  .then(result => {
    console.log('成功:', result);
    return result;
  })
  .catch(error => {
    console.error('失败:', error);
  })
  .finally(() => {
    console.log('完成');
  });
```

**Promise链式调用**：

```javascript
// 链式调用示例
Promise.resolve()
  .then(() => {
    console.log('1. 第一个then');
    return '数据';
  })
  .then(data => {
    console.log('2. 第二个then:', data);
    return Promise.resolve('新的数据');
  })
  .then(data => {
    console.log('3. 第三个then:', data);
  })
  .catch(error => {
    console.error('错误:', error);
  });

// 输出：
// 1. 第一个then
// 2. 第二个then: 数据
// 3. 第三个then: 新的数据
```

### 3.2 Promise链式调用

**链式调用原理**：

```javascript
// 每个then返回新的Promise
const promise = Promise.resolve();

const promise1 = promise.then(() => {
  console.log('1');
  return '数据1';
});

const promise2 = promise1.then((data) => {
  console.log('2:', data);
  return '数据2';
});

const promise3 = promise2.then((data) => {
  console.log('3:', data);
});

// promise1, promise2, promise3是不同的Promise实例
console.log(promise1 === promise2); // false
console.log(promise2 === promise3); // false
```

**错误传播**：

```javascript
// 错误传播示例
Promise.resolve()
  .then(() => {
    console.log('1. 第一个then');
    throw new Error('错误1');
  })
  .then(() => {
    console.log('2. 第二个then（不会执行）');
  })
  .catch(error => {
    console.error('捕获错误:', error.message);
    throw new Error('错误2');
  })
  .then(() => {
    console.log('3. 第三个then（不会执行）');
  })
  .catch(error => {
    console.error('捕获错误2:', error.message);
  });

// 输出：
// 1. 第一个then
// 捕获错误: 错误1
// 捕获错误2: 错误2
```

### 3.3 Promise静态方法

**Promise.all**：

```javascript
// 并行执行多个Promise
const promise1 = Promise.resolve('结果1');
const promise2 = Promise.resolve('结果2');
const promise3 = Promise.resolve('结果3');

Promise.all([promise1, promise2, promise3])
  .then(results => {
    console.log('全部成功:', results); // ['结果1', '结果2', '结果3']
  })
  .catch(error => {
    console.error('至少一个失败:', error);
  });

// 实际应用：并行获取多个API
async function fetchMultiple() {
  const [users, posts, comments] = await Promise.all([
    fetch('/api/users').then(r => r.json()),
    fetch('/api/posts').then(r => r.json()),
    fetch('/api/comments').then(r => r.json())
  ]);
  
  return { users, posts, comments };
}
```

**Promise.allSettled**：

```javascript
// 不管成功失败都返回
const promises = [
  Promise.resolve('成功1'),
  Promise.reject('失败1'),
  Promise.resolve('成功2')
];

Promise.allSettled(promises)
  .then(results => {
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`Promise ${index} 成功:`, result.value);
      } else {
        console.error(`Promise ${index} 失败:`, result.reason);
      }
    });
  });

// 输出：
// Promise 0 成功: 成功1
// Promise 1 失败: 失败1
// Promise 2 成功: 成功2
```

**Promise.race**：

```javascript
// 谁先完成就返回谁
const fastPromise = new Promise(resolve => setTimeout(() => resolve('快'), 100));
const slowPromise = new Promise(resolve => setTimeout(() => resolve('慢'), 1000));

Promise.race([fastPromise, slowPromise])
  .then(result => {
    console.log('race结果:', result); // "快"
  });

// 实际应用：超时控制
function fetchWithTimeout(url, timeout) {
  return Promise.race([
    fetch(url),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('超时')), timeout)
    )
  ]);
}
```

**Promise.any**：

```javascript
// 只要有一个成功就返回
Promise.any([
  Promise.reject('失败1'),
  Promise.resolve('成功'),
  Promise.reject('失败2')
])
  .then(result => {
    console.log('any结果:', result); // "成功"
  })
  .catch(error => {
    console.error('全部失败:', error);
  });
```

---

## 4. async/await原理

### 4.1 async/await基础

**async函数**：

```javascript
// async函数返回Promise
async function fetchData() {
  return '数据';
}

fetchData().then(result => {
  console.log(result); // "数据"
});

// 等价于
function fetchData2() {
  return Promise.resolve('数据');
}
```

**await表达式**：

```javascript
// await等待Promise
async function fetchData() {
  const response = await fetch('/api/data');
  const data = await response.json();
  return data;
}

// await会将后续代码包装成微任务
async function test() {
  console.log('1. 开始');
  await Promise.resolve();
  console.log('2. await之后');
  console.log('3. 结束');
}

test();
console.log('4. 外部代码');

// 输出：
// 1. 开始
// 4. 外部代码
// 2. await之后
// 3. 结束
```

### 4.2 await执行机制

**await执行过程**：

```javascript
// await执行机制
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
console.log('5. 同步代码结束');

// 执行过程分析：
// 1. 打印 '4. 同步代码'
// 2. 调用async1()，打印 '1. async1 start'
// 3. 调用async2()，打印 '3. async2'
// 4. await async2()将'2. async1 end'放入微任务队列
// 5. 打印 '5. 同步代码结束'
// 6. 清空微任务队列，打印 '2. async1 end'

// 输出：
// 4. 同步代码
// 1. async1 start
// 3. async2
// 5. 同步代码结束
// 2. async1 end
```

**await与Promise.resolve**：

```javascript
// await与Promise.resolve
async function test1() {
  console.log('1');
  await Promise.resolve();
  console.log('2');
}

async function test2() {
  console.log('3');
  await console.log('4');
  console.log('5');
}

test1();
test2();
console.log('6');

// 输出：
// 1
// 3
// 4
// 6
// 2
// 5

// 说明：
// await Promise.resolve() 会创建微任务
// await console.log('4') 相当于 await undefined，不会创建微任务
```

### 4.3 async/await错误处理

**try-catch错误处理**：

```javascript
// try-catch错误处理
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('错误:', error);
    throw error; // 重新抛出错误
  }
}

// 使用
fetchData()
  .then(result => console.log(result))
  .catch(error => console.error('最终错误:', error));
```

**多个await错误处理**：

```javascript
// 多个await错误处理
async function fetchData() {
  try {
    const user = await fetchUser();
    const posts = await fetchPosts(user.id);
    const comments = await fetchComments(posts[0].id);
    return { user, posts, comments };
  } catch (error) {
    console.error('错误:', error);
    throw error;
  }
}

// 或者
async function fetchData2() {
  const user = await fetchUser().catch(error => {
    console.error('获取用户失败:', error);
    return null;
  });
  
  if (!user) return null;
  
  const posts = await fetchPosts(user.id).catch(error => {
    console.error('获取文章失败:', error);
    return [];
  });
  
  const comments = await fetchComments(posts[0]?.id).catch(error => {
    console.error('获取评论失败:', error);
    return [];
  });
  
  return { user, posts, comments };
}
```

---

## 5. 复杂异步代码分析

### 5.1 经典面试题解析

**题目1：经典输出顺序**：

```javascript
console.log('1. Script Start');

setTimeout(() => {
  console.log('2. setTimeout 1');
  Promise.resolve().then(() => {
    console.log('3. promise inside setTimeout 1');
  });
}, 0);

Promise.resolve().then(() => {
  console.log('4. Promise 1');
}).then(() => {
  console.log('5. Promise 2');
});

setTimeout(() => {
  console.log('6. setTimeout 2');
}, 0);

console.log('7. Script End');

// 输出顺序：
// 1. Script Start
// 7. Script End
// 4. Promise 1
// 5. Promise 2
// 2. setTimeout 1
// 3. promise inside setTimeout 1
// 6. setTimeout 2
```

**题目2：async/await与Promise混合**：

```javascript
async function async1() {
  console.log('1. async1 start');
  await async2();
  console.log('2. async1 end');
}

async function async2() {
  console.log('3. async2');
}

console.log('4. 同步代码');

setTimeout(() => {
  console.log('5. setTimeout');
}, 0);

Promise.resolve().then(() => {
  console.log('6. Promise 1');
});

async1();

new Promise(resolve => {
  console.log('7. Promise 2');
  resolve();
}).then(() => {
  console.log('8. Promise 3');
});

console.log('9. 同步代码结束');

// 输出顺序：
// 4. 同步代码
// 1. async1 start
// 3. async2
// 7. Promise 2
// 9. 同步代码结束
// 6. Promise 1
// 2. async1 end
// 8. Promise 3
// 5. setTimeout
```

**题目3：复杂嵌套**：

```javascript
console.log('1. 同步1');

setTimeout(() => {
  console.log('2. setTimeout 1');
  Promise.resolve().then(() => {
    console.log('3. Promise 1');
  });
}, 0);

Promise.resolve().then(() => {
  console.log('4. Promise 2');
  setTimeout(() => {
    console.log('5. setTimeout 2');
  }, 0);
});

async function async1() {
  console.log('6. async1 start');
  await async2();
  console.log('7. async1 end');
}

async function async2() {
  console.log('8. async2');
}

async1();

console.log('9. 同步2');

// 输出顺序：
// 1. 同步1
// 6. async1 start
// 8. async2
// 9. 同步2
// 4. Promise 2
// 7. async1 end
// 3. Promise 1
// 2. setTimeout 1
// 5. setTimeout 2
```

### 5.2 async/await与Promise混合

**async/await与Promise.all混合**：

```javascript
async function fetchData() {
  const [user, posts] = await Promise.all([
    fetch('/api/user').then(r => r.json()),
    fetch('/api/posts').then(r => r.json())
  ]);
  
  return { user, posts };
}

// 等价于
function fetchData2() {
  return Promise.all([
    fetch('/api/user').then(r => r.json()),
    fetch('/api/posts').then(r => r.json())
  ]).then(([user, posts]) => ({ user, posts }));
}
```

**async/await与Promise.race混合**：

```javascript
async function fetchWithTimeout(url, timeout) {
  try {
    const result = await Promise.race([
      fetch(url),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('超时')), timeout)
      )
    ]);
    return await result.json();
  } catch (error) {
    console.error('错误:', error);
    throw error;
  }
}
```

### 5.3 微任务阻塞问题

**微任务阻塞示例**：

```javascript
// ❌ 危险：微任务中不断创建新的微任务
Promise.resolve().then(function loop() {
  console.log('无限循环');
  Promise.resolve().then(loop);
});

// 说明：这会导致微任务阻塞，页面假死
// 浏览器会检测到这种情况并阻止

// ✅ 正确：使用宏任务避免阻塞
Promise.resolve().then(function loop() {
  console.log('安全循环');
  setTimeout(loop, 0);
});

// 或者
Promise.resolve().then(function loop() {
  console.log('安全循环');
  queueMicrotask(loop);
});
```

**微任务阻塞测试**：

```javascript
// 测试微任务阻塞
function testMicrotaskStarvation() {
  let count = 0;
  
  Promise.resolve().then(function loop() {
    count++;
    if (count > 10000) {
      console.log('已执行10000次');
      return;
    }
    Promise.resolve().then(loop);
  });
  
  // 由于微任务阻塞，以下代码不会执行
  setTimeout(() => {
    console.log('这个不会执行');
  }, 0);
}

// 解决方案
function testMicrotaskSafe() {
  let count = 0;
  
  Promise.resolve().then(function loop() {
    count++;
    if (count > 10000) {
      console.log('已执行10000次');
      return;
    }
    setTimeout(loop, 0); // 使用宏任务
  });
  
  // 以下代码会执行
  setTimeout(() => {
    console.log('这个会执行');
  }, 0);
}
```

---

## 6. 实战应用

### 6.1 并行与串行执行

**并行执行**：

```javascript
// 并行执行多个异步操作
async function parallelFetch() {
  const [users, posts, comments] = await Promise.all([
    fetch('/api/users').then(r => r.json()),
    fetch('/api/posts').then(r => r.json()),
    fetch('/api/comments').then(r => r.json())
  ]);
  
  return { users, posts, comments };
}

// 性能对比
function performanceTest() {
  const count = 10;
  
  // 串行执行
  console.time('串行执行');
  async function serial() {
    const results = [];
    for (let i = 0; i < count; i++) {
      results.push(await fetch(`/api/data/${i}`));
    }
    return results;
  }
  console.timeEnd('串行执行');
  
  // 并行执行
  console.time('并行执行');
  async function parallel() {
    const promises = Array.from({ length: count }, (_, i) => 
      fetch(`/api/data/${i}`)
    );
    return await Promise.all(promises);
  }
  console.timeEnd('并行执行');
  
  // 并行执行通常更快
}
```

**串行执行**：

```javascript
// 串行执行多个异步操作
async function sequentialFetch() {
  const results = [];
  for (let i = 0; i < 10; i++) {
    const response = await fetch(`/api/data/${i}`);
    results.push(await response.json());
  }
  return results;
}

// 实际应用：顺序执行依赖操作
async function sequentialTasks() {
  const step1 = await doTask1();
  const step2 = await doTask2(step1);
  const step3 = await doTask3(step2);
  return step3;
}
```

### 6.2 重试机制实现

**基础重试机制**：

```javascript
// 重试机制实现
async function retry(fn, maxAttempts = 3, delay = 1000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxAttempts - 1) {
        throw error;
      }
      await sleep(delay * (i + 1));
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 使用
async function unstableFetch() {
  const result = await retry(async () => {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error('请求失败');
    }
    return await response.json();
  }, 3, 1000);
  
  return result;
}
```

**指数退避重试**：

```javascript
// 指数退避重试
async function retryWithBackoff(fn, maxAttempts = 3, baseDelay = 100) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxAttempts - 1) {
        throw error;
      }
      const delay = baseDelay * Math.pow(2, i);
      await sleep(delay);
    }
  }
}

// 使用
const result = await retryWithBackoff(async () => {
  return await fetch('/api/data').then(r => r.json());
}, 3, 100);
```

### 6.3 限流器实现

**简单限流器**：

```javascript
// 限流器实现
class RateLimiter {
  constructor(maxCalls, windowMs) {
    this.maxCalls = maxCalls;
    this.windowMs = windowMs;
    this.calls = [];
  }

  async execute(fn) {
    const now = Date.now();

    // 清理过期调用
    this.calls = this.calls.filter(call => now - call < this.windowMs);

    // 如果达到限制，等待
    if (this.calls.length >= this.maxCalls) {
      const oldestCall = this.calls[0];
      const waitTime = this.windowMs - (now - oldestCall);
      await sleep(waitTime);
    }

    this.calls.push(now);
    return await fn();
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 使用
const limiter = new RateLimiter(3, 1000);

async function testRateLimiter() {
  for (let i = 0; i < 5; i++) {
    await limiter.execute(async () => {
      console.log(`Call ${i + 1} at ${Date.now()}`);
    });
  }
}

testRateLimiter();
```

**令牌桶限流器**：

```javascript
// 令牌桶限流器
class TokenBucketLimiter {
  constructor(rate, capacity) {
    this.rate = rate; // 令牌生成速率（每秒）
    this.capacity = capacity; // 桶容量
    this.tokens = capacity; // 当前令牌数
    this.lastRefill = Date.now();
  }

  refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = elapsed * this.rate / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  async execute(fn) {
    this.refill();
    
    if (this.tokens < 1) {
      const waitTime = (1 - this.tokens) / this.rate * 1000;
      await sleep(waitTime);
      this.refill();
    }
    
    this.tokens--;
    return await fn();
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 使用
const limiter = new TokenBucketLimiter(1, 5); // 每秒1个，容量5

async function testLimiter() {
  for (let i = 0; i < 10; i++) {
    await limiter.execute(async () => {
      console.log(`Call ${i + 1} at ${Date.now()}`);
    });
  }
}

testLimiter();
```

---

## 7. 面试真题解析

### 7.1 事件循环面试题

**题目1：为什么Promise.then比setTimeout执行得快？**

```javascript
// 答案：
// Promise.then是微任务，setTimeout是宏任务
// 事件循环机制：清空微任务队列后才执行宏任务

console.log('1. 同步代码');

setTimeout(() => console.log('2. setTimeout'), 0);

Promise.resolve().then(() => console.log('3. Promise'));

console.log('4. 同步代码');

// 输出：
// 1. 同步代码
// 4. 同步代码
// 3. Promise
// 2. setTimeout
```

**题目2：Node.js和浏览器的事件循环有什么区别？**

```javascript
// 答案：
// 浏览器端：每个宏任务执行完毕后，都会清空一次微任务队列
// Node.js（v11之前）：分为6个阶段，在一个阶段的所有宏任务执行完毕后，才会执行微任务
// Node.js（v11及以后）：行为已修改为与浏览器一致

// Node.js特有的微任务：process.nextTick
// process.nextTick的优先级比Promise还高

process.nextTick(() => console.log('process.nextTick'));
Promise.resolve().then(() => console.log('Promise'));
console.log('同步代码');

// 输出：
// 同步代码
// process.nextTick
// Promise
```

### 7.2 async/await面试题

**题目1：await到底阻塞了什么？**

```javascript
// 答案：
// await绝不会阻塞主线程，它只会阻塞它所在的async函数内部的后续代码

async function foo() {
  console.log('A');
  await somePromise(); // 暂停函数foo的执行，交出控制权给主线程
  console.log('B');    // 当somePromise解决后，这行代码会被作为一个【微任务】放入队列
}

// 等价于（Babel编译逻辑简化版）
function foo() {
  console.log('A');
  return Promise.resolve(somePromise()).then(() => {
    console.log('B');
  });
}
```

**题目2：async/await和Promise有什么区别？**

```javascript
// 答案：
// 1. async/await是Promise的语法糖
// 2. async/await让异步代码更像同步代码
// 3. async/await错误处理使用try-catch更直观
// 4. async/await更好地支持调试

// Promise
fetch('/api/data')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error(error));

// async/await
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}
```

---

## 8. 最佳实践总结

### 8.1 事件循环最佳实践

1. **理解宏任务和微任务**：掌握事件循环机制
2. **避免微任务阻塞**：不要在微任务中创建新的微任务
3. **使用并行执行**：使用Promise.all并行执行独立操作
4. **错误处理**：使用try-catch处理异步错误

### 8.2 async/await最佳实践

1. **使用async/await**：比Promise更易读
2. **并行执行**：使用Promise.all并行执行
3. **错误处理**：使用try-catch处理异步错误
4. **避免嵌套**：不要过度嵌套async/await

### 8.3 实战应用最佳实践

1. **重试机制**：使用指数退避重试
2. **限流器**：使用令牌桶限流器
3. **超时控制**：使用Promise.race实现超时
4. **缓存**：使用Map缓存结果

---

## 参考资源

- [MDN JavaScript文档](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript)
- [JavaScript.info](https://javascript.info/)
- [Node.js官方文档](https://nodejs.org/docs/)

---

*本文档持续更新，最后更新于2026年3月16日*