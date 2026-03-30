# 第1卷-基础核心

## 第2章 JavaScript基础

### 1.1 浏览器 Event Loop 深度解析

**概念语法详细解释：**

Event Loop（事件循环）是 JavaScript 运行时用来协调异步操作的核心机制。理解 Event Loop 对于掌握 JavaScript 的执行流程至关重要。

**核心概念：**
- **执行栈（Call Stack）**：存放正在执行的函数上下文，后进先出（LIFO）
- **堆内存（Heap）**：存储对象、函数等引用类型数据
- **任务队列（Task Queue）**：存放宏任务 callback，按先进先出（FIFO）执行
- **微任务队列（MicroTask Queue）**：存放 Promise 回调等，优先级高于宏任务

**特别说明（常见误区）：**

> **误区1**：误以为 setTimeout(fn, 0) 会立即执行
> - 实际上会作为宏任务加入队列，等待主线程空闲
> - 最小延迟为 4ms（浏览器优化）

> **误区2**：认为微任务在每个宏任务之间执行
> - 正确理解：每个宏任务执行完毕后，会立即清空所有微任务
> - 然后才可能触发渲染（浏览器）

> **误区3**：混淆 Event Loop 和 JavaScript 引擎
> - Event Loop 是浏览器/Node.js 提供的运行时环境
> - JavaScript 引擎（V8）负责编译和执行代码

**帮助理解（类比）：**

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    
┃                    把 Event Loop 想象成餐厅                     ┃    
┃                                                                  ┃   
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓     ┃    
┃  ┃                    主线程 (主厨)                         ┃     ┃  
┃  ┃                                                         ┃     ┃   
┃  ┃   执行栈 = 烹饪过程（一次只做一道菜）                    ┃     ┃  
┃  ┃   堆内存 = 食材仓库                                     ┃     ┃   
┃  ┃   Web APIs = 助手（处理耗时任务）                        ┃     ┃  
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛     ┃    
┃                         ┃                                        ┃   
┃                         ▼                                        ┃   
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓     ┃    
┃  ┃              微任务队列（甜点单）                         ┃     ┃ 
┃  ┃   优先级高，主厨做完一道菜立即处理                         ┃     ┃
┃  ┃   Promise.then, queueMicrotask                          ┃     ┃   
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛     ┃    
┃                         ┃                                        ┃   
┃                         ▼                                        ┃   
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓     ┃    
┃  ┃              宏任务队列（主菜单）                         ┃     ┃ 
┃  ┃   优先级低，处理完甜点后才开始                             ┃     ┃
┃  ┃   setTimeout, setInterval, I/O                          ┃     ┃   
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛     ┃    
┃                                                                  ┃   
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    

```

**参考答案：**

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ 
┃                      浏览器 Event Loop                          ┃ 
┃                                                                  ┃
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓     ┃ 
┃  ┃                    主线程 (Main Thread)                 ┃     ┃
┃  ┃                                                         ┃     ┃
┃  ┃   ┏━━━━━━━━━━━━━┓    ┏━━━━━━━━━━━━━┓                  ┃     ┃  
┃  ┃   ┃  执行栈     ┃    ┃   堆内存    ┃                  ┃     ┃  
┃  ┃   ┃  (Call      ┃    ┃  (Heap)     ┃                  ┃     ┃  
┃  ┃   ┃   Stack)    ┃    ┃             ┃                  ┃     ┃  
┃  ┃   ┗━━━━━━┳━━━━━━┛    ┗━━━━━━━━━━━━━┛                  ┃     ┃  
┃  ┃          ┃                                             ┃     ┃ 
┃  ┗━━━━━━━━━━╋━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛     ┃ 
┃             ┃                                                   ┃ 
┃             ▼                                                   ┃ 
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓     ┃ 
┃  ┃              Web APIs (浏览器环境)                      ┃     ┃
┃  ┃   setTimeout | setInterval | DOM Events | AJAX | ...  ┃     ┃  
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛     ┃ 
┃                                                                  ┃
┃  ┏━━━━━━━━━━━━━━━┓              ┏━━━━━━━━━━━━━━━━━━━┓         ┃   
┃  ┃  宏任务队列    ┃              ┃    微任务队列      ┃         ┃ 
┃  ┃ (Task Queue) ┃              ┃ (MicroTask Queue) ┃         ┃    
┃  ┃               ┃              ┃                   ┃         ┃   
┃  ┃ setTimeout   ┃              ┃ Promise.then      ┃         ┃    
┃  ┃ setInterval  ┃              ┃ MutationObserver  ┃         ┃    
┃  ┃ UI rendering ┃              ┃ process.nextTick ┃         ┃     
┃  ┃ I/O          ┃              ┃ queueMicrotask   ┃         ┃     
┃  ┗━━━━━━━━━━━━━━━┛              ┗━━━━━━━━━━━━━━━━━━━┛         ┃   
┃                                                                  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ 

```

**执行顺序详解：**

```javascript
// 完整可运行代码示例
console.log('=== Event Loop 执行顺序演示 ===');

// 步骤1：同步任务立即执行
console.log(1);  // 同步任务

// 步骤2：setTimeout 加入宏任务队列（延迟0ms）
setTimeout(() => {
  console.log(2);  // 宏任务
}, 0);

// 步骤3：Promise 构造函数内同步执行
new Promise((resolve) => {
  console.log(3);  // 同步任务，立即执行
  resolve();
}).then(() => {
  console.log(4);  // 微任务
});

// 步骤5：同步任务
console.log(5);

/*
执行流程分析：
1. 执行 console.log(1) → 输出 1
2. 遇到 setTimeout → 交给 Web APIs，0ms 后加入宏任务队列
3. 执行 Promise 构造函数 → 输出 3
4. .then() 回调加入微任务队列
5. 执行 console.log(5) → 输出 5

6. 同步代码执行完毕，检查微任务队列
   → 执行 Promise.then() → 输出 4

7. 微任务队列清空，从宏任务队列取任务
   → 执行 setTimeout 回调 → 输出 2

输出顺序: 1, 3, 5, 4, 2
*/
```

**最佳实践：**

```javascript
// 实际应用：正确使用 async/await 和 Promise
async function fetchData() {
  try {
    // 同步任务
    console.log('开始获取数据...');

    // 模拟异步请求（微任务）
    const result = await new Promise(resolve => {
      setTimeout(() => resolve('数据加载完成'), 1000);
    });

    console.log(result);  // 微任务执行后
    return result;
  } catch (error) {
    console.error('错误:', error);
  }
}

// 实际应用：避免阻塞主线程
function heavyTask() {
  // 错误方式：大量计算会阻塞 UI
  // for (let i = 0; i < 1000000000; i++) {}

  // 正确方式：使用 setTimeout 分片
  function processChunk(data, index, chunkSize) {
    const end = Math.min(index + chunkSize, data.length);
    for (let i = index; i < end; i++) {
      // 处理数据
    }

    if (end < data.length) {
      setTimeout(() => processChunk(data, end, chunkSize), 0);
    }
  }
}
```

**核心要点**：
- 主线程执行完当前所有同步代码后，才开始执行 Event Loop
- 每次宏任务执行完毕后，立即清空所有微任务
- 微任务优先级高于宏任务
- `requestAnimationFrame` 在渲染前执行
- `setTimeout` 最小延迟为 4ms（浏览器优化）

---

### 1.2 宏任务与微任务详解

**概念语法详细解释：**

宏任务和微任务是 JavaScript 异步编程的两大基石。理解它们的区别对于掌握异步编程至关重要。

**详细概念说明：**

| 类型 | 来源 | 特点 | 执行时机 |
| :--- | :--- | :--- | :--- |
| **宏任务 (Macrotask)** | setTimeout, setInterval, I/O, UI rendering, script | 每次从队列取出一个执行 | 每轮 Event Loop |
| **微任务 (Microtask)** | Promise.then/catch/finally, MutationObserver, queueMicrotask | 批量执行，清空为止 | 当前宏任务结束后、下一个宏任务开始前 |

**特别说明（常见误区）：**

> **误区1**：认为 requestAnimationFrame 是宏任务
> - 实际上 rAF 在渲染前执行，优先级高于宏任务但低于微任务
> - 它会在下一个帧绘制前调用

> **误区2**：混淆 setTimeout 和 setImmediate（Node.js）
> - setTimeout(0) 在 timers 阶段执行
> - setImmediate 在 check 阶段执行
> - 两者顺序不确定

> **误区3**：认为 async/await 没有微任务
> - async 函数返回值自动包装为 Promise
> - await 后面如果是 Promise，会产生微任务

**帮助理解（对比图解）：**

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  
┃                    宏任务 vs 微任务                              ┃ 
┃                                                                  ┃ 
┃   宏任务队列                    微任务队列                       ┃ 
┃   ┏━━━━━━━━━━━━━┓              ┏━━━━━━━━━━━━━┓                 ┃   
┃   ┃ Task 1     ┃              ┃ Microtask 1┃                 ┃     
┃   ┃ (setTimeout)┃              ┃(Promise.then)┃                ┃   
┃   ┗━━━━━━━━━━━━━┛              ┗━━━━━━━━━━━━━┛                 ┃   
┃   ┏━━━━━━━━━━━━━┓              ┏━━━━━━━━━━━━━┓                 ┃   
┃   ┃ Task 2     ┃              ┃ Microtask 2┃                 ┃     
┃   ┃ (I/O)      ┃              ┃ (async/await)┃                ┃    
┃   ┗━━━━━━━━━━━━━┛              ┗━━━━━━━━━━━━━┛                 ┃   
┃                                                                  ┃ 
┃   执行特点：                   执行特点：                        ┃ 
┃   • 一次只执行一个              • 一次全部执行完                  ┃
┃   • 执行完才检查微任务          • 插入到当前宏任务末尾            ┃
┃   • 可能触发页面渲染            • 不会触发渲染                   ┃ 
┃                                                                  ┃ 
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  

```

**参考答案：**

| 类型 | 来源 | 特点 |
| :--- | :--- | :--- |
| **宏任务 (Macrotask)** | setTimeout, setInterval, I/O, UI rendering, script | 每次从队列取出一个执行 |
| **微任务 (Microtask)** | Promise.then/catch/finally, MutationObserver, queueMicrotask, process.nextTick | 批量执行，清空为止 |

**完整可运行代码示例：**

```javascript
// 完整可运行代码示例
console.log('=== 宏任务与微任务演示 ===');

// 1. 宏任务 - setTimeout
setTimeout(() => {
  console.log('宏任务1: setTimeout');
}, 0);

// 2. 微任务 - Promise.then
Promise.resolve().then(() => {
  console.log('微任务1: Promise.then');
});

// 3. 宏任务 - setTimeout
setTimeout(() => {
  console.log('宏任务2: setTimeout');
}, 0);

// 4. 微任务 - queueMicrotask
queueMicrotask(() => {
  console.log('微任务2: queueMicrotask');
});

// 5. 微任务 - Promise.then
new Promise(resolve => resolve()).then(() => {
  console.log('微任务3: Promise.then');
});

/*
执行顺序分析：
1. 同步代码：无
2. 遇到 setTimeout → 加入宏任务队列
3. 遇到 Promise.then → 加入微任务队列
4. 遇到 setTimeout → 加入宏任务队列
5. 遇到 queueMicrotask → 加入微任务队列
6. 遇到 Promise.then → 加入微任务队列

同步执行完后：
  → 清空微任务队列：微任务1, 微任务2, 微任务3
  → 取出宏任务1执行
  → 检查微任务队列：无
  → 取出宏任务2执行
  → 检查微任务队列：无

预期输出：
微任务1: Promise.then
微任务2: queueMicrotask
微任务3: Promise.then
宏任务1: setTimeout
宏任务2: setTimeout
*/
```

**详细分类：**

```javascript
// 宏任务
setTimeout(() => {}, 0);
setInterval(() => {}, 0);
requestAnimationFrame(() => {});
I/O 操作 (文件读写、网络请求)
UI 渲染
script（整体代码）

// 微任务
Promise.then/catch/finally
async/await (底层是 Promise)
MutationObserver
queueMicrotask()
process.nextTick (Node.js 优先于 Promise)
Object.observe (已废弃)

// 特别注意：new Promise(fn) 中的 fn 是同步执行的
new Promise(() => {
  console.log('这是同步执行的');  // 立即输出
});
```

**实际应用场景：**

```javascript
// 场景1：微任务用于 DOM 更新后的操作
function updateAndLog() {
  document.body.innerHTML = '<div>更新内容</div>';

  // 错误方式：DOM 可能还未渲染
  // console.log(document.body.innerHTML);

  // 正确方式：使用微任务
  Promise.resolve().then(() => {
    console.log('DOM已更新:', document.body.innerHTML);
  });
}

// 场景2：使用 queueMicrotask 实现可靠的异步
function reliableAsync(callback) {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(callback);
  } else {
    Promise.resolve().then(callback);
  }
}

// 场景3：理解 async/await 的微任务本质
async function asyncDemo() {
  console.log('1. async 函数开始');

  await Promise.resolve();  // 产生微任务

  console.log('2. await 之后的代码');  // 微任务执行

  await Promise.resolve();

  console.log('3. 第二个 await 之后');  // 另一个微任务
}

console.log('0. 同步代码');
asyncDemo();
console.log('4. async 调用后');

/*
输出顺序：
0. 同步代码
1. async 函数开始
4. async 调用后
2. await 之后的代码
3. 第二个 await 之后
*/
```

**最佳实践：**

```javascript
// 1. 避免在微任务中执行耗时操作
// 不好：大量计算会阻塞后续微任务
Promise.resolve().then(() => {
  for (let i = 0; i < 1000000000; i++) {}  // 阻塞
});

// 好：使用 setTimeout 分片
function processInChunks(callback) {
  return new Promise(resolve => {
    setTimeout(() => {
      callback();
      resolve();
    }, 0);
  });
}

// 2. 理解微任务的异常处理
Promise.resolve()
  .then(() => {
    throw new Error('在微任务中抛出');
  })
  .catch(err => {
    console.log('捕获到微任务错误:', err.message);
  });

// 3. 避免创建不必要的 Promise
// 不好
async function bad() {
  return await Promise.resolve(42);
}

// 好
function good() {
  return Promise.resolve(42);
}
```

```javascript
// 宏任务
setTimeout(() => {}, 0);
setInterval(() => {}, 0);
requestAnimationFrame(() => {});
I/O 操作 (文件读写、网络请求)
UI 渲染

// 微任务
Promise.then/catch/finally
async/await (底层是 Promise)
MutationObserver
queueMicrotask()
process.nextTick (Node.js 优先于 Promise)
Object.observe (已废弃)
```

---

### 1.3 async/await 执行原理

**概念语法详细解释：**

async/await 是 ES2017 引入的异步编程语法糖，让异步代码看起来像同步代码，大大提高了可读性。

**核心概念：**

- **async 函数**：返回 Promise 的函数，自动将返回值包装为 Promise
- **await 关键字**：暂停 async 函数执行，等待 Promise resolve/reject

**语法详解：**

```javascript
// async 函数声明方式
async function fn1() {}
const fn2 = async () => {};
const fn3 = { async fn() {} };
class A { async method() {} }

// await 只能在 async 函数中使用
async function demo() {
  const result = await promise;  // 等待 Promise
  // await 后面如果不是 Promise，会自动包装为 Promise.resolve()
}
```

**特别说明（常见误区）：**

> **误区1**：认为 await 会阻塞线程
> - 实际上 await 只是暂停函数执行，不会阻塞主线程
> - 其他同步代码可以继续执行

> **误区2**：忘记 await 会返回 Promise
> - `const result = await fn()` 返回的是 resolve 的值，不是 Promise
> - 但 `fn()` 调用本身返回 Promise

> **误区3**：在循环中顺序 await
> - 如果可以并行，应使用 Promise.all()
> - 顺序 await 会导致性能问题

**帮助理解（类比与图解）：**

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓       
┃                    async/await 执行流程                         ┃       
┃                                                                  ┃      
┃   传统 Promise 写法：          async/await 写法：               ┃       
┃                                                                  ┃      
┃   fn().then(a => {           async function demo() {           ┃        
┃     return fn2(a);              const a = await fn();          ┃        
┃   }).then(b => {              const b = await fn2(a);         ┃         
┃     return fn3(b);            const c = await fn3(b);         ┃         
┃   }).then(c => {              console.log(c);                 ┃         
┃     console.log(c);          }                                 ┃        
┃   });                                                                  ┃
┃                                                                  ┃      
┃   链式调用                   线性书写                              ┃    
┃   回调地狱                   同步风格                              ┃    
┃                                                                  ┃      
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛       

```

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  
┃                    await 执行过程                               ┃  
┃                                                                  ┃ 
┃  async function demo() {                                        ┃  
┃    console.log('1. 开始');                                      ┃  
┃                                                                  ┃ 
┃    const result = await fetchData();  ◄━━ 暂停函数              ┃  
┃                                                                  ┃ 
┃    console.log('3. 继续执行');  ◄━━ Promise resolve 后继续      ┃  
┃  }                                                                ┃
┃                                                                  ┃ 
┃  fetchData() 返回 Promise → 进入微任务队列                      ┃  
┃  主线程继续执行其他任务                                          ┃ 
┃  Promise resolve → 回到 async 函数继续执行                       ┃ 
┃                                                                  ┃ 
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  

```

**参考答案：**

**async/await 是 Promise 的语法糖**：

```javascript
// async 函数返回值
async function fetchData() {
  return 'data';
}
// 等同于
function fetchData() {
  return Promise.resolve('data');
}

// await 原理
async function example() {
  const result = await fetchData();
  console.log(result);
}
// 等价于
function example() {
  return fetchData().then(result => {
    console.log(result);
  });
}
```

**完整可运行代码示例：**

```javascript
// 完整示例：模拟真实 API 调用
function mockApi(name, delay) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ name, data: `数据 from ${name}` });
    }, delay);
  });
}

// 顺序执行（性能较差）
async function sequential() {
  console.time('顺序执行');
  const a = await mockApi('API1', 1000);
  const b = await mockApi('API2', 1000);
  const c = await mockApi('API3', 1000);
  console.timeEnd('顺序执行');  // ~3000ms
  return [a, b, c];
}

// 并行执行（性能更好）
async function parallel() {
  console.time('并行执行');
  const [a, b, c] = await Promise.all([
    mockApi('API1', 1000),
    mockApi('API2', 1000),
    mockApi('API3', 1000)
  ]);
  console.timeEnd('并行执行');  // ~1000ms
  return [a, b, c];
}

// 竞态处理（只取第一个结果）
async function race() {
  const result = await Promise.race([
    mockApi('API1', 1000),
    mockApi('API2', 500),
    mockApi('API3', 2000)
  ]);
  return result;  // 返回最快解决的
}

// 错误处理
async function withErrorHandle() {
  try {
    const result = await mockApi('API', 1000);
    return result;
  } catch (error) {
    console.error('请求失败:', error);
    return null;
  }
}

// 执行演示
async function run() {
  console.log('--- 并行执行测试 ---');
  const result = await parallel();
  console.log('结果:', result);

  console.log('\n--- 错误处理测试 ---');
  const errorResult = await withErrorHandle();
  console.log('错误处理结果:', errorResult);
}

run();
```

**执行流程图解：**

```javascript
async function async1() {
  console.log('1');        // 同步执行
  await async2();          // 等待 Promise resolve
  console.log('2');        // 微任务：await 后的代码
}

async function async2() {
  console.log('3');        // 同步执行
}

console.log('4');          // 同步执行

setTimeout(() => {
  console.log('5');        // 宏任务
}, 0);

async1();

new Promise(resolve => {
  console.log('6');        // 同步执行
  resolve();
}).then(() => {
  console.log('7');        // 微任务
});

console.log('8');          // 同步执行

/*
执行过程分析：

第一轮同步执行：
  4 → 3 → 6 → 8
  async2() 立即 resolve，await 进入微任务队列
  Promise.then(7) 进入微任务队列
  setTimeout(5) 进入宏任务队列

同步执行完，检查微任务队列：
  await async2() 后的代码(2) → 7
  微任务队列清空

检查宏任务队列：
  setTimeout(5) 执行

最终输出: 4, 3, 6, 8, 2, 7, 5
*/
```

**常见错误与最佳实践：**

```javascript
// 错误1：忘记 await
async function bad() {
  const users = fetchUsers();  // 返回 Promise，没有 await
  console.log(users);  // Promise {<pending>}
}

// 正确
async function good() {
  const users = await fetchUsers();
  console.log(users);
}

// 错误2：在循环中顺序 await
async function bad() {
  const ids = [1, 2, 3];
  const results = [];
  for (const id of ids) {
    results.push(await fetchItem(id));  // 顺序执行，很慢
  }
}

// 正确：使用 Promise.all 并行
async function good() {
  const ids = [1, 2, 3];
  const results = await Promise.all(ids.map(id => fetchItem(id)));
}

// 错误3：没有正确处理 reject
async function bad() {
  await fetchData();  // 如果 reject，会抛出未处理的异常
}

// 正确：使用 try-catch
async function good() {
  try {
    await fetchData();
  } catch (error) {
    console.error(error);
  }
}

// 最佳实践1：封装工具函数
async function retry(fn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// 最佳实践2：并发限制（控制并发数）
async function concurrencyLimit(tasks, limit) {
  const results = [];
  const executing = [];

  for (const task of tasks) {
    const p = task().then(result => {
      results.push(result);
      executing.splice(executing.indexOf(p), 1);
    });

    executing.push(p);

    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }

  return Promise.all(executing).then(() => results);
}
```

**执行流程**：

```javascript
async function async1() {
  console.log('1');        // 同步
  await async2();          // 等待 Promise resolve
  console.log('2');        // 微任务
}

async function async2() {
  console.log('3');        // 同步
}

console.log('4');          // 同步

setTimeout(() => {
  console.log('5');        // 宏任务
}, 0);

async1();

new Promise(resolve => {
  console.log('6');        // 同步
  resolve();
}).then(() => {
  console.log('7');        // 微任务
});

console.log('8');          // 同步

// 输出: 4, 3, 6, 8, 2, 7, 5
```

---

### 1.4 Node.js Event Loop 与浏览器区别

**参考答案：**

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ 
┃                    Node.js Event Loop                          ┃  
┃                                                                  ┃
┃   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    ┃  
┃   ┃                     Timers Phase                       ┃    ┃ 
┃   ┃              setTimeout, setInterval                   ┃    ┃ 
┃   ┗━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    ┃  
┃                           ▼                                     ┃ 
┃   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    ┃  
┃   ┃                  Pending Callbacks                    ┃    ┃  
┃   ┃            延迟的 I/O 回调 (内部使用)                   ┃    ┃
┃   ┗━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    ┃  
┃                           ▼                                     ┃ 
┃   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    ┃  
┃   ┃                    Idle, Prepare                      ┃    ┃  
┃   ┃              内部使用 (libuv 预留)                     ┃    ┃ 
┃   ┗━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    ┃  
┃                           ▼                                     ┃ 
┃   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    ┃  
┃   ┃                      Poll Phase                      ┃    ┃   
┃   ┃            获取新的 I/O 事件 (文件/网络)               ┃    ┃ 
┃   ┗━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    ┃  
┃                           ▼                                     ┃ 
┃   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    ┃  
┃   ┃                      Check Phase                     ┃    ┃   
┃   ┃                   setImmediate 回调                   ┃    ┃  
┃   ┗━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    ┃  
┃                           ▼                                     ┃ 
┃   ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    ┃  
┃   ┃                   Close Callbacks                     ┃    ┃  
┃   ┃                  socket.on('close')                  ┃    ┃   
┃   ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    ┃  
┃                                                                  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ 

```

**与浏览器 Event Loop 的区别**：

| 特性 | 浏览器 | Node.js |
| :--- | :--- | :--- |
| 微任务队列 | Promise.then | Promise.then + process.nextTick |
| nextTick | 无 | 优先于其他微任务 |
| setImmediate | 宏任务 | 在 check 阶段执行 |
| 渲染时机 | 每帧渲染 | 无 UI 渲染 |
| 定时器精度 | ~4ms | 更精确 |

---

## 第2章 原型与继承

### 2.1 原型链深度理解

**参考答案：**

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ 
┃                         原型链                                  ┃ 
┃                                                                  ┃
┃    ┏━━━━━━━━━━━━━━━━━┓                                        ┃   
┃    ┃   Object.prototype┃ ◄━━━━━━┓                              ┃  
┃    ┃  hasOwnProperty  ┃        ┃                               ┃  
┃    ┃  toString        ┃        ┃                               ┃  
┃    ┗━━━━━━━━┳━━━━━━━━━┛        ┃                               ┃  
┃             ┃                   ┃                               ┃ 
┃    ┏━━━━━━━━▼━━━━━━━━━┓        ┃  prototype                    ┃  
┃    ┃   Person.prototype┃ ━━━━━━┛                               ┃  
┃    ┃  sayName         ┃                                        ┃  
┃    ┗━━━━━━━━┳━━━━━━━━━┛                                        ┃  
┃             ┃                                                   ┃ 
┃    ┏━━━━━━━━▼━━━━━━━━━┓                                        ┃  
┃    ┃    person        ┃                                        ┃  
┃    ┃  (实例对象)       ┃ ◄━━━━━━ __proto__                    ┃   
┃    ┃  name: 'Tom'     ┃                                        ┃  
┃    ┗━━━━━━━━━━━━━━━━━┛                                        ┃   
┃                                                                  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ 

```

**核心概念**：

```javascript
function Person(name) {
  this.name = name;
}

Person.prototype.sayName = function() {
  return this.name;
};

const person = new Person('Tom');

// 原型链查找
person.sayName();           // 自身属性
person.toString();         // 沿原型链查找
person.hasOwnProperty('name');  // 原型链查找
```

**属性详解**：

| 属性 | 说明 |
| :--- | :--- |
| `prototype` | 构造函数上的属性，指向原型对象 |
| `__proto__` | 对象实例上的属性，指向构造函数的 prototype |
| `constructor` | 原型对象上的属性，指向构造函数 |

---

### 2.2 new 操作符实现原理

**参考答案：**

**new 的执行过程**：

```javascript
function myNew(constructor, ...args) {
  // 1. 创建空对象，继承构造函数的 prototype
  const obj = Object.create(constructor.prototype);

  // 2. 执行构造函数，this 指向新对象
  const result = constructor.apply(obj, args);

  // 3. 返回结果（如果返回对象则用返回的，否则用新对象）
  return result instanceof Object ? result : obj;
}

// 使用
function Person(name) {
  this.name = name;
}

const person = myNew(Person, 'Tom');
console.log(person.name);  // Tom
```

**关键步骤**：
1. 创建新对象
2. 链接到原型
3. 绑定 this
4. 返回新对象

---

### 2.3 原型继承的 6 种方式

**参考答案：**

```javascript
// 父类
function Animal(name) {
  this.name = name;
}
Animal.prototype.speak = function() {
  return `${this.name} makes a sound`;
};

// 1. 原型链继承
function Dog() {}
Dog.prototype = new Animal('Animal');
Dog.prototype.constructor = Dog;

// 2. 构造函数继承（经典继承）
function Cat(name) {
  Animal.call(this, name);
}

// 3. 组合继承（最常用）
function Bird(name) {
  Animal.call(this, name);
}
Bird.prototype = new Animal();
Bird.prototype.constructor = Bird;

// 4. 原型式继承
function create(obj) {
  function F() {}
  F.prototype = obj;
  return new F();
}

// 5. 寄生式继承
function createEnhanced(obj) {
  const clone = Object.create(obj);
  clone.sayHi = function() { return 'Hi'; };
  return clone;
}

// 6. 寄生组合继承（最优）
function inherit(subClass, superClass) {
  const prototype = Object.create(superClass.prototype);
  prototype.constructor = subClass;
  subClass.prototype = prototype;
}
```

---

## 第3章 作用域与闭包

### 3.1 闭包深度理解

**参考答案：**

**闭包定义**：函数与其外部作用域的引用捆绑在一起，形成闭包。

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   
┃                         闭包原理                                 ┃  
┃                                                                  ┃  
┃  function outer() {                                              ┃  
┃    let count = 0;                                                ┃  
┃                                                                  ┃  
┃    return function inner() {  ◄━━ 闭包函数                       ┃  
┃      count++;                            ┃                      ┃   
┃      return count;                       ┃ 记住 outer 的       ┃    
┃    };                                     ┃ 作用域              ┃   
┃  }                                          ┃                      ┃
┃                                                 ┃               ┃   
┃  const fn = outer();  ◄━━ count 变量被 fn 引用，不被销毁         ┃  
┃  fn();  // 1                                                      ┃ 
┃  fn();  // 2   count 仍在内存中                                   ┃ 
┃                                                                  ┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   

```

**经典面试题**：

```javascript
// 题目 1：循环与闭包
for (var i = 0; i < 5; i++) {
  setTimeout(() => console.log(i), 100);
}
// 输出: 5, 5, 5, 5, 5

// 解决方案 1：使用 let
for (let i = 0; i < 5; i++) {
  setTimeout(() => console.log(i), 100);
}
// 输出: 0, 1, 2, 3, 4

// 解决方案 2：使用闭包
for (var i = 0; i < 5; i++) {
  ((j) => {
    setTimeout(() => console.log(j), 100);
  })(i);
}
```

**应用场景**：

```javascript
// 1. 数据私有化
function createCounter() {
  let count = 0;
  return {
    increment() { return ++count; },
    decrement() { return --count; },
    getCount() { return count; }
  };
}

// 2. 函数柯里化
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return function(...args2) {
      return curried.apply(this, args.concat(args2));
    };
  };
}
```

---

### 3.2 作用域链理解

**参考答案：**

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  
┃                        作用域链                                 ┃  
┃                                                                  ┃ 
┃  全局作用域 (Global)                                            ┃  
┃       ┃                                                         ┃  
┃       ▼                                                         ┃  
┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓     ┃  
┃  ┃  函数作用域 (Function Scope) - outer                    ┃     ┃ 
┃  ┃       ┃                                                  ┃     ┃
┃  ┃       ▼                                                  ┃     ┃
┃  ┃  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  ┃     ┃  
┃  ┃  ┃  函数作用域 (Function Scope) - inner             ┃  ┃     ┃  
┃  ┃  ┃  作用域链: inner → outer → global                ┃  ┃     ┃  
┃  ┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  ┃     ┃  
┃  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛     ┃  
┃                                                                  ┃ 
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  

```

**作用域类型**：
1. **全局作用域**：最外层，代码任何位置可访问
2. **函数作用域**：函数内部
3. **块级作用域**：`let` 和 `const`（ES6+）
4. **词法作用域**：函数定义时决定，而非运行时

---

## 第4章 函数式编程

### 4.1 防抖（Debounce）实现

**参考答案：**

```javascript
// 基础防抖
function debounce(fn, delay, immediate = false) {
  let timer = null;

  return function(...args) {
    const context = this;

    // 立即执行模式
    if (immediate && !timer) {
      fn.apply(context, args);
    }

    // 清除之前的定时器
    if (timer) clearTimeout(timer);

    // 设置新的定时器
    timer = setTimeout(() => {
      if (!immediate) {
        fn.apply(context, args);
      }
      timer = null;
    }, delay);
  };
}

// 增强版：支持取消和获取结果
function debouncePro(fn, delay, immediate = false) {
  let timer = null;
  let result;
  let lastArgs;
