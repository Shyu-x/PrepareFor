# JavaScript 深度进阶面试题库

---

## 一、执行机制与事件循环

### 1.1 浏览器 Event Loop 深度解析

**参考答案：**

```
┌─────────────────────────────────────────────────────────────────┐
│                      浏览器 Event Loop                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │                    主线程 (Main Thread)                 │     │
│  │                                                         │     │
│  │   ┌─────────────┐    ┌─────────────┐                  │     │
│  │   │  执行栈     │    │   堆内存    │                  │     │
│  │   │  (Call      │    │  (Heap)     │                  │     │
│  │   │   Stack)    │    │             │                  │     │
│  │   └──────┬──────┘    └─────────────┘                  │     │
│  │          │                                             │     │
│  └──────────┼─────────────────────────────────────────────┘     │
│             │                                                   │
│             ▼                                                   │
│  ┌────────────────────────────────────────────────────────┐     │
│  │              Web APIs (浏览器环境)                      │     │
│  │   setTimeout | setInterval | DOM Events | AJAX | ...  │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
│  ┌───────────────┐              ┌───────────────────┐         │
│  │  宏任务队列    │              │    微任务队列      │         │
│  │ (Task Queue) │              │ (MicroTask Queue) │         │
│  │               │              │                   │         │
│  │ setTimeout   │              │ Promise.then      │         │
│  │ setInterval  │              │ MutationObserver  │         │
│  │ UI rendering │              │ process.nextTick │         │
│  │ I/O          │              │ queueMicrotask   │         │
│  └───────────────┘              └───────────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**执行顺序**：

```javascript
console.log(1);  // 同步任务

setTimeout(() => {
  console.log(2);  // 宏任务
}, 0);

new Promise((resolve) => {
  console.log(3);  // 同步任务
  resolve();
}).then(() => {
  console.log(4);  // 微任务
});

console.log(：1,5);
// 输出顺序 3, 5, 4, 2
```

**核心要点**：
- 主线程执行完当前所有同步代码后，才开始执行 Event Loop
- 每次宏任务执行完毕后，立即清空所有微任务
- 微任务优先级高于宏任务
- `requestAnimationFrame` 在渲染前执行
- `setTimeout` 最小延迟为 4ms（浏览器优化）

---

### 1.2 宏任务与微任务详解

**参考答案：**

| 类型 | 来源 | 特点 |
| :--- | :--- | :--- |
| **宏任务 (Macrotask)** | setTimeout, setInterval, I/O, UI rendering, script | 每次从队列取出一个执行 |
| **微任务 (Microtask)** | Promise.then/catch/finally, MutationObserver, queueMicrotask, process.nextTick | 批量执行，清空为止 |

**详细分类**：

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
// 等同于
function example() {
  return fetchData().then(result => {
    console.log(result);
  });
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
┌─────────────────────────────────────────────────────────────────┐
│                    Node.js Event Loop                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌───────────────────────────────────────────────────────┐    │
│   │                     Timers Phase                       │    │
│   │              setTimeout, setInterval                   │    │
│   └───────────────────────┬───────────────────────────────┘    │
│                           ▼                                     │
│   ┌───────────────────────────────────────────────────────┐    │
│   │                  Pending Callbacks                    │    │
│   │            延迟的 I/O 回调 (内部使用)                   │    │
│   └───────────────────────┬───────────────────────────────┘    │
│                           ▼                                     │
│   ┌───────────────────────────────────────────────────────┐    │
│   │                    Idle, Prepare                      │    │
│   │              内部使用 (libuv 预留)                     │    │
│   └───────────────────────┬───────────────────────────────┘    │
│                           ▼                                     │
│   ┌───────────────────────────────────────────────────────┐    │
│   │                      Poll Phase                      │    │
│   │            获取新的 I/O 事件 (文件/网络)               │    │
│   └───────────────────────┬───────────────────────────────┘    │
│                           ▼                                     │
│   ┌───────────────────────────────────────────────────────┐    │
│   │                      Check Phase                     │    │
│   │                   setImmediate 回调                   │    │
│   └───────────────────────┬───────────────────────────────┘    │
│                           ▼                                     │
│   ┌───────────────────────────────────────────────────────┐    │
│   │                   Close Callbacks                     │    │
│   │                  socket.on('close')                  │    │
│   └───────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
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

## 二、原型与继承

### 2.1 原型链深度理解

**参考答案：**

```
┌─────────────────────────────────────────────────────────────────┐
│                         原型链                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    ┌─────────────────┐                                        │
│    │   Object.prototype│ ◄──────┐                              │
│    │  hasOwnProperty  │        │                               │
│    │  toString        │        │                               │
│    └────────┬─────────┘        │                               │
│             │                   │                               │
│    ┌────────▼─────────┐        │  prototype                    │
│    │   Person.prototype│ ──────┘                               │
│    │  sayName         │                                        │
│    └────────┬─────────┘                                        │
│             │                                                   │
│    ┌────────▼─────────┐                                        │
│    │    person        │                                        │
│    │  (实例对象)       │ ◄────── __proto__                    │
│    │  name: 'Tom'     │                                        │
│    └─────────────────┘                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
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

## 三、异步与 Promise

### 3.1 Promise 底层实现

**参考答案：**

```javascript
class MyPromise {
  constructor(executor) {
    this.state = 'pending';
    this.value = undefined;
    this.reason = undefined;
    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];

    const resolve = (value) => {
      if (this.state === 'pending') {
        this.state = 'fulfilled';
        this.value = value;
        this.onFulfilledCallbacks.forEach(cb => cb());
      }
    };

    const reject = (reason) => {
      if (this.state === 'pending') {
        this.state = 'rejected';
        this.reason = reason;
        this.onRejectedCallbacks.forEach(cb => cb());
      }
    };

    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      if (this.state === 'fulfilled') {
        try {
          const result = onFulfilled(this.value);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }

      if (this.state === 'rejected') {
        try {
          const result = onRejected(this.reason);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }

      if (this.state === 'pending') {
        this.onFulfilledCallbacks.push(() => {
          try {
            const result = onFulfilled(this.value);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
        this.onRejectedCallbacks.push(() => {
          try {
            const result = onRejected(this.reason);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      }
    });
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }

  finally(onFinally) {
    return this.then(
      value => MyPromise.resolve(onFinally()).then(() => value),
      reason => MyPromise.resolve(onFinally()).then(() => { throw reason; })
    );
  }

  static resolve(value) {
    return new MyPromise(resolve => resolve(value));
  }

  static reject(reason) {
    return new MyPromise((_, reject) => reject(reason));
  }

  static all(promises) {
    return new MyPromise((resolve, reject) => {
      const results = [];
      let count = 0;
      promises.forEach((promise, index) => {
        promise.then(value => {
          results[index] = value;
          count++;
          if (count === promises.length) {
            resolve(results);
          }
        }, reject);
      });
    });
  }

  static race(promises) {
    return new MyPromise((resolve, reject) => {
      promises.forEach(promise => {
        promise.then(resolve, reject);
      });
    });
  }
}
```

---

### 3.2 并发请求控制（手写版）

**参考答案：**

**限制并发数的 Promise 调度器**：

```javascript
class Scheduler {
  constructor(limit = 2) {
    this.limit = limit;
    this.running = 0;
    this.queue = [];
  }

  async add(promiseCreator) {
    // 如果当前运行数已满，等待
    if (this.running >= this.limit) {
      await new Promise(resolve => this.queue.push(resolve));
    }

    this.running++;
    try {
      return await promiseCreator();
    } finally {
      this.running--;
      // 取出队列中下一个任务
      if (this.queue.length > 0) {
        this.queue.shift()();
      }
    }
  }
}

// 测试
const delay = (ms) => new Promise(r => setTimeout(r, ms));

const scheduler = new Scheduler(2);

const tasks = [
  () => delay(1000).then(() => 'task1'),
  () => delay(500).then(() => 'task2'),
  () => delay(300).then(() => 'task3'),
  () => delay(400).then(() => 'task4'),
];

Promise.all(tasks.map(t => scheduler.add(t))).then(console.log);
// 输出顺序: task2, task3, task1, task4
```

---

### 3.3 Promise.all / race / allSettled 实现

**参考答案：**

```javascript
// Promise.all - 所有成功才成功，一个失败则失败
Promise.myAll = function(promises) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(promises)) {
      return reject(new TypeError('参数必须是数组'));
    }

    const results = [];
    let count = 0;

    if (promises.length === 0) return resolve([]);

    promises.forEach((promise, index) => {
      Promise.resolve(promise).then(
        value => {
          results[index] = value;
          count++;
          if (count === promises.length) {
            resolve(results);
          }
        },
        reason => reject(reason)
      );
    });
  });
};

// Promise.race - 返回最先完成的结果（无论成功/失败）
Promise.myRace = function(promises) {
  return new Promise((resolve, reject) => {
    promises.forEach(promise => {
      Promise.resolve(promise).then(resolve, reject);
    });
  });
};

// Promise.allSettled - 等待所有 Promise 完成（无论成功/失败）
Promise.myAllSettled = function(promises) {
  return new Promise((resolve) => {
    const results = [];
    let count = 0;

    if (promises.length === 0) return resolve([]);

    promises.forEach((promise, index) => {
      Promise.resolve(promise).then(
        value => {
          results[index] = { status: 'fulfilled', value };
          count++;
          if (count === promises.length) resolve(results);
        },
        reason => {
          results[index] = { status: 'rejected', reason };
          count++;
          if (count === promises.length) resolve(results);
        }
      );
    });
  });
};

// Promise.any - 返回最先成功的结果
Promise.myAny = function(promises) {
  return new Promise((resolve, reject) => {
    const errors = [];
    let count = 0;

    if (promises.length === 0) {
      return reject(new AggregateError('All promises were rejected'));
    }

    promises.forEach((promise, index) => {
      Promise.resolve(promise).then(
        value => resolve(value),
        error => {
          errors[index] = error;
          count++;
          if (count === promises.length) {
            reject(new AggregateError(errors));
          }
        }
      );
    });
  });
};
```

---

## 四、作用域与闭包

### 4.1 闭包深度理解

**参考答案：**

**闭包定义**：函数与其外部作用域的引用捆绑在一起，形成闭包。

```
┌─────────────────────────────────────────────────────────────────┐
│                         闭包原理                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  function outer() {                                              │
│    let count = 0;                                                │
│                                                                  │
│    return function inner() {  ◄── 闭包函数                       │
│      count++;                            │                      │
│      return count;                       │ 记住 outer 的       │
│    };                                     │ 作用域              │
│  }                                          │                      │
│                                                 │               │
│  const fn = outer();  ◄── count 变量被 fn 引用，不被销毁         │
│  fn();  // 1                                                      │
│  fn();  // 2   count 仍在内存中                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
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

// 解决方案 3：使用 bind
for (var i = 0; i < 5; i++) {
  setTimeout(console.log.bind(null, i), 100);
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

// 3. 防抖与节流（见下文）
```

---

### 4.2 作用域链理解

**参考答案：**

```
┌─────────────────────────────────────────────────────────────────┐
│                        作用域链                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  全局作用域 (Global)                                            │
│       │                                                         │
│       ▼                                                         │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  函数作用域 (Function Scope) - outer                    │     │
│  │       │                                                  │     │
│  │       ▼                                                  │     │
│  │  ┌──────────────────────────────────────────────────┐  │     │
│  │  │  函数作用域 (Function Scope) - inner             │  │     │
│  │  │  作用域链: inner → outer → global                │  │     │
│  │  └──────────────────────────────────────────────────┘  │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**作用域类型**：
1. **全局作用域**：最外层，代码任何位置可访问
2. **函数作用域**：函数内部
3. **块级作用域**：`let` 和 `const`（ES6+）
4. **词法作用域**：函数定义时决定，而非运行时

---

## 五、函数式编程

### 5.1 防抖（Debounce）实现

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

  const debounced = function(...args) {
    lastArgs = args;
    const context = this;

    if (timer) clearTimeout(timer);

    if (immediate) {
      const callNow = !timer;
      timer = setTimeout(() => {
        timer = null;
      }, delay);
      if (callNow) {
        result = fn.apply(context, args);
      }
    } else {
      timer = setTimeout(() => {
        result = fn.apply(context, args);
        timer = null;
      }, delay);
    }

    return result;
  };

  // 取消功能
  debounced.cancel = function() {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  // 立即执行
  debounced.flush = function() {
    if (timer) {
      fn.apply(this, lastArgs);
      clearTimeout(timer);
      timer = null;
    }
  };

  return debounced;
}
```

---

### 5.2 节流（Throttle）实现

**参考答案：**

```javascript
// 时间戳版本
function throttle(fn, delay) {
  let lastTime = 0;

  return function(...args) {
    const now = Date.now();
    if (now - lastTime >= delay) {
      fn.apply(this, args);
      lastTime = now;
    }
  };
}

// 定时器版本
function throttle2(fn, delay) {
  let timer = null;

  return function(...args) {
    if (!timer) {
      timer = setTimeout(() => {
        fn.apply(this, args);
        timer = null;
      }, delay);
    }
  };
}

// 优化版本：支持 leading/trailing
function throttle3(fn, delay, options = { leading: true, trailing: false }) {
  let timer = null;
  let lastTime = 0;
  const { leading, trailing } = options;

  return function(...args) {
    const now = Date.now();
    const context = this;

    // 立即执行
    if (leading && lastTime === 0) {
      fn.apply(context, args);
      lastTime = now;
      return;
    }

    // 剩余时间
    const remaining = delay - (now - lastTime);

    if (remaining <= 0 || remaining > delay) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      lastTime = now;
      fn.apply(context, args);
    } else if (trailing && !timer) {
      timer = setTimeout(() => {
        lastTime = Date.now();
        timer = null;
        fn.apply(context, args);
      }, remaining);
    }
  };
}
```

---

## 六、ES6+ 新特性

### 6.1 let / const / var 区别

**参考答案：**

| 特性 | var | let | const |
| :--- | :--- | :--- | :--- |
| **作用域** | 函数作用域 | 块级作用域 | 块级作用域 |
| **变量提升** | 初始化提升 | 暂时性死区 | 暂时性死区 |
| **重复声明** | 允许 | 不允许 | 不允许 |
| **重新赋值** | 允许 | 允许 | 不允许（对象引用可修改） |
| **全局属性** | 挂载到 window | 不挂载 | 不挂载 |

**暂时性死区（TDZ）**：

```javascript
{
  console.log(a);  // ReferenceError
  let a = 1;
}

// var 不会报错，打印 undefined
{
  console.log(b);  // undefined（变量提升）
  var b = 1;
}
```

---

### 6.2 箭头函数与普通函数区别

**参考答案：**

```javascript
// 箭头函数
const add = (a, b) => a + b;
const greet = name => `Hello, ${name}`;
const fn = () => ({ id: 1 });  // 返回对象需加括号

// 普通函数
function add(a, b) {
  return a + b;
}
```

**核心区别**：

| 特性 | 箭头函数 | 普通函数 |
| :--- | :--- | :--- |
| this | 继承外层第一个普通函数的 this | 运行时确定（谁调用指向谁） |
| arguments | 没有自己的 arguments | 有自己的 arguments |
| new | 不能作为构造函数 | 可以作为构造函数 |
| prototype | 没有 prototype | 有 prototype |
|  yield | 不能使用 yield | 可以使用 yield |

**this 绑定示例**：

```javascript
const obj = {
  name: 'obj',
  regular() {
    console.log(this.name);  // obj
  },
  arrow: () => {
    console.log(this.name);  // undefined（指向 window）
  }
};

const obj2 = {
  name: 'obj2',
  regular() {
    setTimeout(function() {
      console.log(this.name);  // undefined（指向 window）
    }, 100);
  },
  arrow() {
    setTimeout(() => {
      console.log(this.name);  // obj2
    }, 100);
  }
};
```

---

### 6.3 Symbol / BigInt / Proxy / Reflect

**参考答案：**

**Symbol**：

```javascript
// 创建唯一值
const s1 = Symbol('desc');
const s2 = Symbol('desc');
s1 === s2;  // false

// Symbol.for - 全局 Symbol 注册表
const s3 = Symbol.for('key');
const s4 = Symbol.for('key');
s3 === s4;  // true

// Symbol.iterator
const arr = [1, 2, 3];
const iterator = arr[Symbol.iterator]();
iterator.next();  // {value: 1, done: false}
```

**BigInt**：

```javascript
// 大整数
const bigInt = 9007199254740991n;
const result = bigInt + 1n;

// 安全整数范围
Number.MAX_SAFE_INTEGER;  // 9007199254740991
Number.MIN_SAFE_INTEGER; // -9007199254740991
```

**Proxy**：

```javascript
const handler = {
  get(target, prop) {
    console.log(`getting ${prop}`);
    return target[prop];
  },
  set(target, prop, value) {
    console.log(`setting ${prop} to ${value}`);
    target[prop] = value;
    return true;
  }
};

const proxy = new Proxy({}, handler);
proxy.name = 'Tom';  // setting name to Tom
console.log(proxy.name);  // getting name, Tom
```

**Reflect**：

```javascript
// 统一的对象操作 API
Reflect.get(obj, 'name');
Reflect.set(obj, 'name', 'Tom');
Reflect.has(obj, 'name');
Reflect.deleteProperty(obj, 'name');
Reflect.ownKeys(obj);
Reflect.apply(fn, thisArg, args);
```

---

### 6.4 数组方法详解

**参考答案：**

```javascript
// 遍历方法
arr.forEach((item, index, array) => {});     // 无返回值
arr.map((item, index, array) => item * 2);  // 返回新数组
arr.filter(item => item > 5);               // 返回满足条件的数组
arr.reduce((acc, cur, index, array) => acc + cur, 0);  // 返回累计结果
arr.some(item => item > 5);                  // 是否有满足条件
arr.every(item => item > 5);                // 是否全部满足条件
arr.find(item => item > 5);                  // 找到第一个
arr.findIndex(item => item > 5);             // 找到第一个索引
arr.flatMap(x => [x, x * 2]);                // map + flat

// ES10+
arr.flat(2);                 // 扁平化数组
arr.flatMap(x => [x, x * 2]); // map + flat

// 排序
arr.sort((a, b) => a - b);  // 升序

// 查找
arr.includes(5);             // 是否包含
arr.indexOf(5);              // 首次索引
arr.lastIndexOf(5);         // 最后一次索引

// 其他
arr.slice(1, 3);            // 浅拷贝
arr.splice(1, 2, 'a', 'b'); // 删除/替换/插入
arr.concat(arr2);           // 合并
arr.join(',');              // 转字符串
arr.reverse();              // 反转（修改原数组）
arr.fill(0, 1, 3);          // 填充
```

---

### 6.5 对象方法详解

**参考答案：**

```javascript
// Object.keys - 返回自身可枚举属性
Object.keys(obj);           // ['name', 'age']

// Object.values - 返回自身可枚举属性值
Object.values(obj);         // ['Tom', 18]

// Object.entries - 返回键值对数组
Object.entries(obj);        // [['name', 'Tom'], ['age', 18]]

// Object.fromEntries - 键值对数组转对象
Object.fromEntries([['name', 'Tom'], ['age', 18]]);

// Object.assign - 合并对象
Object.assign({}, obj1, obj2);

// Object.defineProperty - 定义属性
Object.defineProperty(obj, 'name', {
  value: 'Tom',
  writable: false,
  enumerable: true,
  configurable: false
});

// Object.defineProperties - 定义多个属性
Object.defineProperties(obj, {
  name: { value: 'Tom', writable: false },
  age: { value: 18, writable: true }
});

// Object.getOwnPropertyDescriptor - 获取属性描述
Object.getOwnPropertyDescriptor(obj, 'name');

// Object.getPrototypeOf / setPrototypeOf
Object.getPrototypeOf(obj);
Object.setPrototypeOf(obj, newPrototype);

// Object.create - 创建对象并指定原型
const newObj = Object.create(proto);

// Object.freeze / seal / preventExtensions
Object.freeze(obj);        // 不可修改/删除/添加
Object.seal(obj);         // 不可删除/添加（可修改）
Object.preventExtensions(obj);  // 不可添加

// Object.isFrozen / isSealed / isExtensible
Object.isFrozen(obj);
Object.isSealed(obj);
Object.isExtensible(obj);
```

---

## 七、手写代码题

### 7.1 深拷贝实现

**参考答案：**

```javascript
function deepClone(target, cache = new WeakMap()) {
  // 原始类型直接返回
  if (target === null || typeof target !== 'object') {
    return target;
  }

  // 处理日期
  if (target instanceof Date) {
    return new Date(target);
  }

  // 处理正则
  if (target instanceof RegExp) {
    return new RegExp(target);
  }

  // 处理 Symbol
  if (typeof target === 'symbol') {
    return Symbol(target.description);
  }

  // 处理循环引用
  if (cache.has(target)) {
    return cache.get(target);
  }

  // 创建新对象/数组
  const clone = Array.isArray(target) ? [] : {};
  cache.set(target, clone);

  // 获取所有属性（包括 Symbol）
  const keys = Reflect.ownKeys(target);

  keys.forEach(key => {
    // 跳过不可枚举属性（可选）
    const descriptor = Object.getOwnPropertyDescriptor(target, key);
    if (!descriptor.enumerable) return;

    // 递归克隆
    clone[key] = deepClone(target[key], cache);
  });

  return clone;
}

// 测试
const obj = {
  name: 'Tom',
  date: new Date(),
  regex: /test/,
  nested: {
    a: 1,
    b: [1, 2, 3]
  },
  [Symbol('id')]: 123
};

// 处理循环引用
obj.self = obj;

const cloned = deepClone(obj);
console.log(cloned);
```

---

### 7.2 instanceof 实现

**参考答案：**

```javascript
function myInstanceof(left, right) {
  // 获取构造函数的 prototype
  const prototype = right.prototype;

  // 获取对象的原型
  let proto = left.__proto__;

  // 循环遍历原型链
  while (proto !== null) {
    if (proto === prototype) {
      return true;
    }
    proto = proto.__proto__;
  }

  return false;
}

// 测试
function Person() {}
const person = new Person();

myInstanceof(person, Person);       // true
myInstanceof(person, Object);       // true
myInstanceof('str', String);        // false
```

---

### 7.3 call / apply / bind 实现

**参考答案：**

```javascript
// call 实现
Function.prototype.myCall = function(context, ...args) {
  // context 不存在时指向 window
  const ctx = context || window;

  // 创建一个唯一的属性名
  const fn = Symbol('fn');

  // 将函数挂载到 context 上
  ctx[fn] = this;

  // 执行函数并获取结果
  const result = ctx[fn](...args);

  // 删除临时属性
  delete ctx[fn];

  return result;
};

// apply 实现
Function.prototype.myApply = function(context, args = []) {
  const ctx = context || window;
  const fn = Symbol('fn');
  ctx[fn] = this;
  const result = args.length > 0 ? ctx[fn](...args) : ctx[fn]();
  delete ctx[fn];
  return result;
};

// bind 实现
Function.prototype.myBind = function(context, ...args) {
  const fn = this;

  return function(...args2) {
    // 构造函数调用时忽略 context
    if (this instanceof fn) {
      return new fn(...args, ...args2);
    }
    return fn.apply(context, [...args, ...args2]);
  };
};
```

---

### 7.4 Promise 实现红绿灯交换

**参考答案：**

```javascript
// 题目：红灯 3 秒亮一次，黄灯 2 秒亮一次，绿灯 1 秒亮一次
// 输出: 红 -> 黄 -> 绿 -> 红 -> 黄 -> 绿...

function red() { console.log('red'); }
function yellow() { console.log('yellow'); }
function green() { console.log('green'); }

function light(fn, ms) {
  return new Promise(resolve => {
    setTimeout(() => {
      fn();
      resolve();
    }, ms);
  });
}

async function run() {
  while (true) {
    await light(red, 3000);
    await light(yellow, 2000);
    await light(green, 1000);
  }
}

// 使用 Promise 链式
function runChain() {
  light(red, 3000)
    .then(() => light(yellow, 2000))
    .then(() => light(green, 1000))
    .then(() => runChain());
}
```

---

### 7.5 并行限制调度器

**参考答案：**

```javascript
class LimitScheduler {
  constructor(limit) {
    this.limit = limit;
    this.running = 0;
    this.queue = [];
  }

  async add(task) {
    if (this.running >= this.limit) {
      await new Promise(resolve => this.queue.push(resolve));
    }

    this.running++;
    try {
      return await task();
    } finally {
      this.running--;
      if (this.queue.length > 0) {
        this.queue.shift()();
      }
    }
  }
}

// 使用
const scheduler = new LimitScheduler(2);

const tasks = [
  () => new Promise(r => setTimeout(() => r(1), 3000)),
  () => new Promise(r => setTimeout(() => r(2), 2000)),
  () => new Promise(r => setTimeout(() => r(3), 1000)),
  () => new Promise(r => setTimeout(() => r(4), 4000)),
];

async function main() {
  const start = Date.now();
  const results = await Promise.all(tasks.map(t => scheduler.add(t)));
  console.log(results, Date.now() - start);
}
```

---

## 八、内存管理与垃圾回收

### 8.1 V8 垃圾回收机制

**参考答案：**

```
┌─────────────────────────────────────────────────────────────────┐
│                      V8 内存分布                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    新生代区 (New Space)                  │   │
│  │    ┌────────────────┐      ┌────────────────┐           │   │
│  │    │    From        │      │     To         │           │   │
│  │    │  (使用中)       │ <─── │  (空闲)        │           │   │
│  │    └────────────────┘      └────────────────┘           │   │
│  │         32MB / 64MB (32位 / 64位)                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    老生代区 (Old Space)                  │   │
│  │    ┌────────────────┐      ┌────────────────┐           │   │
│  │    │   对象数据     │      │   指针数据     │           │   │
│  │    │  (Data Pointer)│      │ (Data Pointer)│           │   │
│  │    └────────────────┘      └────────────────┘           │   │
│  │              ~1400MB                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    大对象区 (Large Object Space)        │   │
│  │              大对象存储 (>10MB)                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    代码区 (Code Space)                   │   │
│  │              JIT 编译后的代码                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Cell / Map / Promise 等              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**垃圾回收算法**：

| 算法 | 区域 | 说明 |
| :--- | :--- | :--- |
| **Scavenge** | 新生代 | 复制存活对象，清理死亡对象 |
| **Mark-Sweep** | 老生代 | 标记清除，碎片化 |
| **Mark-Compact** | 老生代 | 标记整理，解决碎片化 |
| **Incremental Marking** | 老生代 | 分阶段标记，避免卡顿 |
| **Orinoco** | 全部 | 并发/并行回收 |

---

### 8.2 内存泄漏与解决方案

**参考答案：**

**常见内存泄漏场景**：

```javascript
// 1. 全局变量
function leak() {
  largeData = new Array(1000000);  // 忘记声明，挂在 window
}

// 2. 闭包
function leak2() {
  const largeData = new Array(1000000);
  return function() {
    console.log(largeData);  // 闭包引用 largeData
  };
}

// 3. DOM 引用
const elements = [];
function leak3() {
  const div = document.createElement('div');
  elements.push(div);  // 引用 DOM，即使 DOM 删除
}

// 4. 定时器未清理
function leak4() {
  setInterval(() => {
    // 定时器持续执行
  }, 1000);
}

// 5. 事件监听未移除
function leak5() {
  const el = document.getElementById('el');
  el.addEventListener('click', () => {});  // 组件销毁时未移除
}
```

**检测方法**：

```javascript
// 使用 Chrome DevTools Memory
// 1. Performance Monitor - 监控内存使用
// 2. Memory - 快照对比
// 3. Allocation Timeline - 分配时间线

// 代码检测
function detectMemoryLeak() {
  if (performance.memory) {
    console.log('JS Heap Size:', performance.memory.jsHeapSizeLimit);
    console.log('Total:', performance.memory.totalJSHeapSize);
    console.log('Used:', performance.memory.usedJSHeapSize);
  }
}
```

---

> 资料整理自 2025 字节跳动、阿里巴巴、拼多多面试

---

## 九、数据类型与类型转换

### 9.1 JavaScript 数据类型详解

**参考答案：**

JavaScript 共有 8 种数据类型，分为原始类型（Primitive）和引用类型（Reference）两大类：

```javascript
// 原始类型（Primitive Types）- 7 种
typeof undefined        // "undefined"
typeof null             // "object" (历史遗留 bug)
typeof 42               // "number"
typeof "hello"          // "string"
typeof true             // "boolean"
typeof Symbol('id')     // "symbol"
typeof 9007199254740991n  // "bigint"

// 引用类型（Reference Types）- 1 种
typeof {}               // "object"
typeof []               // "object"
typeof function() {}    // "function" (特殊对象)
typeof new Date()       // "object"
typeof new Map()        // "object"
typeof new Set()        // "object"
```

**原始类型与引用类型的本质区别**：

```javascript
// 原始类型 - 值传递
let a = 10;
let b = a;
b = 20;
console.log(a);  // 10 - a 不受影响

// 引用类型 - 引用传递
let obj1 = { name: 'Tom' };
let obj2 = obj1;
obj2.name = 'Jerry';
console.log(obj1.name);  // "Jerry" - obj1 也被修改
```

**栈内存与堆内存**：

```
┌─────────────────────────────────────────────────────────────────┐
│                      JavaScript 内存模型                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  栈内存 (Stack)                  堆内存 (Heap)                   │
│  ┌─────────────────┐          ┌─────────────────────────┐      │
│  │                 │          │                         │      │
│  │  a: 10          │          │  { name: 'Tom' }        │      │
│  │  b: 20          │  ──────► │  (0x001)               │      │
│  │  str: 'hello'   │          │                         │      │
│  │  flag: true     │          │  [1, 2, 3]             │      │
│  │                 │          │  (0x002)               │      │
│  │                 │          │                         │      │
│  └─────────────────┘          └─────────────────────────┘      │
│                                                                  │
│  - 原始类型存储在栈中           - 引用类型存储在堆中             │
│  - 大小固定，访问速度快         - 大小不固定，访问需要引用       │
│  - 自动分配和释放               - 需要垃圾回收器管理             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 类型转换深度理解

**参考答案：**

**显式类型转换**：

```javascript
// 转换为数字
Number('123')        // 123
Number('12.3')       // 12.3
Number('')           // 0
Number('hello')      // NaN
Number(true)         // 1
Number(false)        // 0

parseInt('123')      // 123
parseInt('12.3')     // 12
parseInt('100px')    // 100
parseFloat('12.3')   // 12.3

// 转换为字符串
String(123)          // '123'
String(true)         // 'true'
String(null)         // 'null'
String(undefined)    // 'undefined'

(123).toString()     // '123'
(true).toString()    // 'true'

// 转换为布尔值
Boolean(1)           // true
Boolean(0)           // false
Boolean('hello')     // true
Boolean('')          // false
Boolean(null)        // false
Boolean(undefined)   // false
Boolean(NaN)         // false
Boolean([])          // true (特殊!)
Boolean({})          // true (特殊!)
```

**隐式类型转换**：

```javascript
// 算术运算符
'1' + 2              // '12' (数字转字符串)
1 + '2'              // '12'
1 + 2                // 3
1 - '2'              // -1 (字符串转数字)
'5' * '2'            // 10
'5' - 2              // 3

// 比较运算符
'5' == 5             // true (隐式转换)
'5' === 5            // false (严格比较)
null == undefined    // true
null === undefined   // false

// 逻辑运算符
!!'hello'            // true
!!''                 // false
!!0                  // false

// 宽松相等 == 转换规则
// ┌─────────────────┬──────────────────┬──────────────────┐
// │    x            │    y             │    结果          │
// ├─────────────────┼──────────────────┼──────────────────┤
// │ null           │ undefined        │ true            │
// │ number         │ string           │ x == toNumber(y)│
// │ boolean        │ any              │ toNumber(x)==y  │
// │ object         │ string/number    │ toPrimitive(y)  │
// └─────────────────┴──────────────────┴──────────────────┘
```

**类型转换原理详解**：

```javascript
// ToPrimitive 操作详解
// input 是对象时，会调用 valueOf 或 toString

// 1. 先尝试 valueOf
const obj1 = {
  valueOf() { return 1; }
};
console.log(obj1 + 1);  // 2

// 2. 如果 valueOf 不返回原始值，尝试 toString
const obj2 = {
  toString() { return 'hello'; }
};
console.log(obj2 + ' world');  // 'hello world'

// 3. 两者都返回对象，抛出 TypeError
const obj3 = {
  valueOf() { return {}; },
  toString() { return {}; }
};
// console.log(obj3 + 1);  // TypeError

// 数组的 ToPrimitive
[1, 2] + [3, 4]    // '1,23,4'
// 步骤1: [1,2].valueOf() 返回 [1,2]
// 步骤2: [1,2].toString() 返回 '1,2'
// 同理 [3,4] -> '3,4'
// 结果: '1,2' + '3,4' = '1,23,4'
```

### 9.3 类型判断详解

**参考答案：**

```javascript
// typeof 的局限性
typeof null          // 'object' (历史 bug)
typeof []            // 'object'
typeof {}            // 'object'
typeof new Date()    // 'object'
typeof /regex/       // 'object'

// instanceof 原理
// 检查构造函数的 prototype 是否在对象的原型链上
function Person() {}
const person = new Person();

person instanceof Person      // true
person instanceof Object      // true
[] instanceof Array           // true
[] instanceof Object          // true

// Object.prototype.toString.call()
Object.prototype.toString.call(123)      // '[object Number]'
Object.prototype.toString.call('str')   // '[object String]'
Object.prototype.toString.call(true)    // '[object Boolean]'
Object.prototype.toString.call([])      // '[object Array]'
Object.prototype.toString.call({})      // '[object Object]'
Object.prototype.toString.call(null)    // '[object Null]'
Object.prototype.toString.call(undefined) // '[object Undefined]'

// 封装类型判断函数
function getType(value) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  const typeStr = Object.prototype.toString.call(value);
  const match = typeStr.match(/\[object (\w+)\]/);
  return match ? match[1].toLowerCase() : 'unknown';
}

// isArray 判断
Array.isArray([])           // true
Array.isArray({})           // false

// isNaN 判断
isNaN(NaN)                  // true
isNaN(10)                   // false
isNaN('hello')              // true (隐式转换)
Number.isNaN(NaN)           // true
Number.isNaN('hello')       // false (不转换)

// isFinite 判断
isFinite(Infinity)         // false
isFinite(-Infinity)         // false
isFinite(100)               // true
isFinite('100')             // true (转换后)
Number.isFinite(100)        // true
Number.isFinite('100')      // false (不转换)
```

---

## 十、函数深入理解

### 10.1 函数创建与调用方式

**参考答案：**

```javascript
// 1. 函数声明（函数提升）
function add(a, b) {
  return a + b;
}

// 2. 函数表达式
const add = function(a, b) {
  return a + b;
};

// 3. 箭头函数
const add = (a, b) => a + b;

// 4. 构造函数（不推荐）
const add = new Function('a', 'b', 'return a + b');

// 5. IIFE（立即执行函数）
(function() {
  console.log('立即执行');
})();

(() => {
  console.log('箭头函数 IIFE');
})();

// 6. 生成器函数
function* generator() {
  yield 1;
  yield 2;
  return 3;
}
const gen = generator();
gen.next();  // {value: 1, done: false}
gen.next();  // {value: 2, done: false}
gen.next();  // {value: 3, done: true}

// 7. 异步函数
async function fetchData() {
  const data = await fetch('/api');
  return data;
}
```

### 10.2 函数参数传递

**参考答案：**

```javascript
// 原始类型参数 - 值传递
function changeValue(num) {
  num = 100;
}
let a = 10;
changeValue(a);
console.log(a);  // 10 - 不受影响

// 引用类型参数 - 引用传递
function changeObject(obj) {
  obj.name = 'Jerry';
  obj = new Object();  // 重新赋值，不影响原引用
  obj.name = 'New';
}
let person = { name: 'Tom' };
changeObject(person);
console.log(person.name);  // 'Jerry'

// 参数默认值
function greet(name = 'Guest', greeting = 'Hello') {
  return `${greeting}, ${name}!`;
}
greet();                    // 'Hello, Guest!'
greet('Tom');               // 'Hello, Tom!'
greet('Tom', 'Hi');        // 'Hi, Tom!'

// 剩余参数
function sum(...numbers) {
  return numbers.reduce((a, b) => a + b, 0);
}
sum(1, 2, 3, 4);  // 10

// arguments 对象
function showArgs() {
  console.log(arguments);         // [1, 2, 3]
  console.log(arguments.length); // 3
  console.log(arguments[0]);      // 1
}
showArgs(1, 2, 3);

// 注意：箭头函数没有 arguments
const fn = () => {
  console.log(arguments);  // ReferenceError
};
```

### 10.3 函数科里化与偏函数

**参考答案：**

```javascript
// 柯里化 (Currying)
// 将多参数函数转换为一系列单参数函数

// 基础实现
function curry(fn) {
  return function curried(...args) {
    // 如果参数足够，执行原函数
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    // 否则返回一个新函数，等待接收剩余参数
    return function(...args2) {
      return curried.apply(this, args.concat(args2));
    };
  };
}

// 使用
function add(a, b, c) {
  return a + b + c;
}
const curriedAdd = curry(add);
curriedAdd(1)(2)(3);    // 6
curriedAdd(1, 2)(3);    // 6
curriedAdd(1)(2, 3);    // 6

// 偏函数 (Partial Application)
// 固定函数的部分参数

function partial(fn, ...presetArgs) {
  return function(...laterArgs) {
    return fn(...presetArgs, ...laterArgs);
  };
}

// 使用
function multiply(a, b, c) {
  return a * b * c;
}
const multiplyBy2 = partial(multiply, 2);
multiplyBy2(3, 4);  // 24

// 柯里化经典面试题
// 实现 add(1)(2)(3) = 6
function add(...args) {
  return function(...args2) {
    const total = [...args, ...args2].reduce((a, b) => a + b, 0);
    // 递归返回函数直到没有参数
    return function(...args3) {
      if (args3.length === 0) {
        return total;
      }
      return add(total)(...args3);
    };
  };
}
// 简化版本
function add(...args1) {
  const fn = function(...args2) {
    return add(...args1, ...args2);
  };
  fn.toString = function() {
    return args1.reduce((a, b) => a + b, 0);
  };
  return fn;
}
console.log(add(1)(2)(3).toString());  // 6
console.log(add(1, 2)(3).toString()); // 6
```

### 10.4 高阶函数详解

**参考答案：**

```javascript
// 高阶函数：接收函数作为参数或返回函数的函数

// 1. 函数组合
function compose(...fns) {
  return function(x) {
    return fns.reduceRight((acc, fn) => fn(acc), x);
  };
}

// 使用
const add1 = x => x + 1;
const multiply2 = x => x * 2;
const square = x => x * x;

const composed = compose(square, multiply2, add1);
composed(3);  // square(multiply2(add1(3))) = square(8) = 64

// 2. 函数管道
function pipe(...fns) {
  return function(x) {
    return fns.reduce((acc, fn) => fn(acc), x);
  };
}

// 3. 柯里化工具
const curry = (fn, arity = fn.length) => {
  return function curried(...args) {
    if (args.length >= arity) {
      return fn.apply(this, args);
    }
    return function(...args2) {
      return curried.apply(this, args.concat(args2));
    };
  };
};

// 4. 函数记忆 (Memoization)
function memoize(fn) {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

// 使用
const fibonacci = memoize(function(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
});

// 5. 函数节流与防抖 (已在前面章节详述)

// 6. once - 只执行一次
function once(fn) {
  let called = false;
  let result;
  return function(...args) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    return result;
  };
}

// 7. after - 延迟执行
function after(times, fn) {
  return function(...args) {
    if (--times === 0) {
      fn.apply(this, args);
    }
  };
}

// 8. before - 限制执行次数
function before(times, fn) {
  let result;
  return function(...args) {
    if (times-- > 0) {
      result = fn.apply(this, args);
    }
    return result;
  };
}
```

---

## 十一、异步编程深度理解

### 11.1 异步编程发展历程

**参考答案：**

```javascript
// 1. 回调函数 (Callback)
function fetchData(callback) {
  setTimeout(() => {
    callback(null, 'data');
  }, 1000);
}
fetchData((err, data) => {
  if (err) {
    console.error(err);
  } else {
    console.log(data);
  }
});

// 回调地狱示例
fetchData((err, data) => {
  if (err) return;
  processData(data, (err, result) => {
    if (err) return;
    saveResult(result, (err, saved) => {
      if (err) return;
      console.log(saved);
    });
  });
});

// 2. Promise
function fetchData() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve('data');
    }, 1000);
  });
}
fetchData()
  .then(data => processData(data))
  .then(result => saveResult(result))
  .catch(err => console.error(err));

// 3. async/await
async function main() {
  try {
    const data = await fetchData();
    const result = await processData(data);
    const saved = await saveResult(result);
    console.log(saved);
  } catch (err) {
    console.error(err);
  }
}

// 4. 生成器函数
function* generatorDemo() {
  const data = yield fetchData();
  const result = yield processData(data);
  return result;
}
const gen = generatorDemo();
gen.next().value.then(data => {
  gen.next(data).value.then(result => {
    console.log(result);
  });
});

// 5. async 迭代器 (for await...of)
async function demo() {
  const asyncIterable = {
    [Symbol.asyncIterator]() {
      return {
        i: 0,
        next() {
          return Promise.resolve({
            value: this.i++,
            done: this.i > 5
          });
        }
      };
    }
  };
  for await (const num of asyncIterable) {
    console.log(num);
  }
}
```

### 11.2 Promise 高级特性

**参考答案：**

```javascript
// Promise 状态流转
// ┌─────────────────────────────────────────────────────────────┐
// │                                                             │
// │  ┌──────────┐    resolve(value)    ┌──────────────┐        │
// │  │          │ ──────────────────►  │              │        │
// │  │  pending │                      │  fulfilled   │        │
// │  │          │ ◄──────────────────  │              │        │
// │  │          │    reject(reason)    │              │        │
// │  └──────────┘                      └──────────────┘        │
// │      │                                   │                 │
// │      │                                   │                 │
// │      │ reject(reason)                   │                 │
// │      ▼                                   ▼                 │
// │  ┌──────────┐                      ┌──────────────┐        │
// │  │          │ ──────────────────►  │              │        │
// │  │  pending │                      │   rejected   │        │
// │  │          │ ◄──────────────────  │              │        │
// │  │          │    resolve(value)    │              │        │
// │  └──────────┘                      └──────────────┘        │
// │                                                             │
// │  状态只能从 pending → fulfilled/rejected                   │
// │  一旦状态改变，不可逆转                                     │
// └─────────────────────────────────────────────────────────────┘

// Promise then 方法链式调用
const promise = new Promise(resolve => resolve(1));

promise
  .then(x => x + 1)     // 2
  .then(x => x * 2)     // 4
  .then(x => {
    throw new Error('error');
  })
  .catch(err => {
    console.error(err); // Error: error
    return 'recovered';
  })
  .then(x => console.log(x));  // 'recovered'

// Promise 静态方法详解
Promise.resolve(1);  // Promise {1}
Promise.reject(new Error('error'));  // Promise rejected

// Promise.resolve 对不同值的处理
Promise.resolve(1);                    // 已经是 Promise，直接返回
Promise.resolve(Promise.resolve(1));  // 层层解包
Promise.resolve({ then: fn });        // 提取 thenable

// thenable 示例
const thenable = {
  then(resolve) {
    resolve(42);
  }
};
Promise.resolve(thenable).then(console.log);  // 42

// Promise.all - 并行执行，全部成功才成功
const p1 = Promise.resolve(1);
const p2 = Promise.resolve(2);
const p3 = Promise.resolve(3);

Promise.all([p1, p2, p3])
  .then(console.log);  // [1, 2, 3]

// 任意一个失败则失败
Promise.all([
  Promise.resolve(1),
  Promise.reject('error'),
  Promise.resolve(3)
]).catch(console.error);  // 'error'

// Promise.race - 竞态，谁先完成返回谁
Promise.race([
  new Promise(r => setTimeout(() => r(1), 100)),
  new Promise(r => setTimeout(() => r(2), 50)),
  new Promise(r => setTimeout(() => r(3), 200))
]).then(console.log);  // 2

// 应用：超时处理
function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), ms)
  );
  return Promise.race([promise, timeout]);
}

// Promise.allSettled - 无论成功失败都返回
Promise.allSettled([
  Promise.resolve(1),
  Promise.reject('error'),
  Promise.resolve(3)
]).then(results => {
  results.forEach(result => {
    if (result.status === 'fulfilled') {
      console.log(result.value);
    } else {
      console.error(result.reason);
    }
  });
});

// Promise.any - 返回第一个成功的结果
Promise.any([
  Promise.reject('error1'),
  Promise.reject('error2'),
  Promise.resolve(3)
]).then(console.log);  // 3

// 全部失败才失败
Promise.any([
  Promise.reject('error1'),
  Promise.reject('error2')
]).catch(e => {
  console.error(e.errors);  // ['error1', 'error2']
});
```

### 11.3 async/await 深入理解

**参考答案：**

```javascript
// async/await 是 Promise 的语法糖
// async 函数总是返回 Promise
// await 等待 Promise resolve

// async 函数返回值
async function fn1() { return 1; }
fn1().then(console.log);  // 1

async function fn2() { return Promise.resolve(2); }
fn2().then(console.log);  // 2

async function fn3() { throw new Error('error'); }
fn3().catch(console.error);  // Error: error

// await 等待 Promise
async function demo() {
  const result = await Promise.resolve(1);
  console.log(result);  // 1

  // await 等待出错会抛出异常
  try {
    await Promise.reject('error');
  } catch (e) {
    console.error(e);  // 'error'
  }
}

// 并行执行
async function parallel() {
  const [a, b] = await Promise.all([
    Promise.resolve(1),
    Promise.resolve(2)
  ]);
  console.log(a, b);  // 1, 2
}

// 串行执行
async function serial() {
  const a = await Promise.resolve(1);
  const b = await Promise.resolve(2);
  console.log(a, b);  // 1, 2
}

// 错误处理
async function withErrorHandling() {
  try {
    const data = await fetch('/api');
    const result = await data.json();
    return result;
  } catch (err) {
    console.error('请求失败:', err);
    return null;
  }
}

// Promise.all 与 async/await 结合
async function fetchAll(urls) {
  const promises = urls.map(url => fetch(url));
  const responses = await Promise.all(promises);
  return Promise.all(responses.map(r => r.json()));
}

// 循环中的 async/await
async function processItems(items) {
  // 串行处理
  for (const item of items) {
    await processItem(item);
  }

  // 并行处理（需要并发控制）
  const results = await Promise.all(items.map(item => processItem(item)));
}

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// async/await 实现重试
async function retry(fn, times = 3) {
  for (let i = 0; i < times; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === times - 1) throw err;
      await delay(1000 * (i + 1));  // 指数退避
    }
  }
}

// 使用
async function fetchData() {
  const data = await retry(() => fetch('/api').then(r => r.json()));
  return data;
}
```

### 11.4 事件循环面试题汇总

**参考答案：**

```javascript
// 面试题 1
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');
// 输出: 1, 4, 3, 2

// 面试题 2
console.log('1');
setTimeout(() => console.log('2'), 0);
new Promise((resolve) => {
  console.log('3');
  resolve();
}).then(() => console.log('4'));
console.log('5');
// 输出: 1, 3, 5, 4, 2

// 面试题 3
setTimeout(() => console.log('1'), 0);
new Promise((resolve) => {
  console.log('2');
  resolve();
}).then(() => console.log('3'));
console.log('4');
// 输出: 2, 4, 3, 1

// 面试题 4 - async/await
async function async1() {
  console.log('1');
  await async2();
  console.log('2');
}
async function async2() {
  console.log('3');
}
console.log('4');
setTimeout(() => console.log('5'), 0);
async1();
new Promise(resolve => {
  console.log('6');
  resolve();
}).then(() => console.log('7'));
console.log('8');
// 输出: 4, 3, 6, 8, 2, 7, 5

// 面试题 5 - 微任务队列
Promise.resolve().then(() => {
  console.log('1');
  return Promise.resolve();
}).then(() => {
  console.log('2');
});
Promise.resolve().then(() => {
  console.log('3');
}).then(() => {
  console.log('4');
});
// 输出: 1, 3, 2, 4

// 面试题 6 - Promise then 返回 Promise
new Promise(resolve => resolve())
  .then(() => console.log('1'))
  .then(() => console.log('2'))
  .then(() => console.log('3'));

new Promise(resolve => resolve())
  .then(() => console.log('4'))
  .then(() => console.log('5'));
// 输出: 1, 4, 2, 5, 3

// 面试题 7 - async 函数返回值
async function A() {
  console.log('1');
  return 'hello';
}
async function B() {
  console.log('2');
  return Promise.resolve('world');
}
async function main() {
  console.log('3');
  const a = await A();
  console.log(a);
  const b = await B();
  console.log(b);
}
main();
// 输出: 3, 1, hello, 2, world

// 面试题 8 - setTimeout vs setImmediate (Node.js)
setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));
// 输出顺序不确定，取决于性能

// 面试题 9 - process.nextTick vs setImmediate (Node.js)
process.nextTick(() => console.log('nextTick'));
setImmediate(() => console.log('immediate'));
console.log('sync');
// 输出: sync, nextTick, immediate

// 面试题 10 - queueMicrotask
Promise.resolve().then(() => console.log('promise'));
queueMicrotask(() => console.log('microtask'));
console.log('sync');
// 输出: sync, promise, microtask
```

---

## 十二、ES6+ 核心特性详解

### 12.1 解构赋值深度理解

**参考答案：**

```javascript
// 数组解构
const [a, b, c] = [1, 2, 3];
console.log(a, b, c);  // 1, 2, 3

// 跳过元素
const [a, , c] = [1, 2, 3];
console.log(a, c);  // 1, 3

// 剩余模式
const [a, ...rest] = [1, 2, 3, 4, 5];
console.log(a, rest);  // 1, [2, 3, 4, 5]

// 默认值
const [a, b = 10] = [1];
console.log(a, b);  // 1, 10

// 交换变量
let x = 1, y = 2;
[x, y] = [y, x];
console.log(x, y);  // 2, 1

// 嵌套解构
const [a, [b, c]] = [1, [2, 3]];
console.log(a, b, c);  // 1, 2, 3

// 对象解构
const { name, age } = { name: 'Tom', age: 18 };
console.log(name, age);  // Tom, 18

// 变量重命名
const { name: userName, age: userAge } = { name: 'Tom', age: 18 };
console.log(userName, userAge);  // Tom, 18

// 默认值
const { name = 'Guest', age = 0 } = { name: 'Tom' };
console.log(name, age);  // Tom, 0

// 嵌套解构
const {
  user: { name, age },
  admin: { name: adminName }
} = { user: { name: 'Tom', age: 18 }, admin: { name: 'Admin' } };

// 函数参数解构
function fn({ x, y = 10, z = 0 }) {
  return x + y + z;
}
fn({ x: 1 });           // 11
fn({ x: 1, y: 2 });    // 3

// 解构赋值妙用
// 1. 交换变量
[a, b] = [b, a];

// 2. 从函数返回多个值
function getUser() {
  return { name: 'Tom', age: 18 };
}
const { name, age } = getUser();

// 3. 遍历 Map
const map = new Map([['a', 1], ['b', 2]]);
for (const [key, value] of map) {
  console.log(key, value);
}

// 4. 导入模块
import { Component, useState } from 'react';
```

### 12.2 模板字符串与标签模板

**参考答案：**

```javascript
// 基本用法
const name = 'Tom';
const greeting = `Hello, ${name}!`;
console.log(greeting);  // Hello, Tom!

// 多行字符串
const multiLine = `
  This is a
  multi-line
  string
`;

// 表达式
const a = 10, b = 20;
console.log(`a + b = ${a + b}`);  // a + b = 30

// 调用函数
function highlight(strings, ...values) {
  return strings.reduce((result, str, i) => {
    return result + str + (values[i] ? `<em>${values[i]}</em>` : '');
  }, '');
}
const name = 'Tom', score = 100;
const html = highlight`Hello ${name}, your score is ${score}!`;
console.log(html);
// Hello <em>Tom</em>, your score is <em>100</em>!

// 标签模板实际应用 - i18n
function i18n(strings, ...values) {
  const translations = {
    hello: '你好',
    world: '世界'
  };
  return strings.reduce((result, str, i) => {
    return result + translations[str.trim()] + (values[i] || '');
  }, '');
}
const greeting = i18n` hello  world `;
console.log(greeting);  // 你好 世界

// 标签模板 - SQL 防注入
function sql(strings, ...values) {
  let query = '';
  strings.forEach((str, i) => {
    query += str;
    if (i < values.length) {
      // 参数化查询，防止 SQL 注入
      query += `$${i + 1}`;
    }
  });
  return { query, values };
}
const userId = 1;
const { query, values } = sql`SELECT * FROM users WHERE id = ${userId}`;
console.log(query);    // SELECT * FROM users WHERE id = $1
console.log(values);   // [1]
```

### 12.3 装饰器详解

**参考答案：**

```javascript
// 装饰器是一种语法糖，用于修改类或类的属性

// 1. 类的装饰器
function logged(constructor) {
  return class extends constructor {
    constructor(...args) {
      console.log(`Creating ${constructor.name}`);
      super(...args);
    }
  };
}

@logged
class Person {
  constructor(name) {
    this.name = name;
  }
}

// 2. 方法装饰器
function enumerable(value) {
  return function(target, propertyKey, descriptor) {
    descriptor.enumerable = value;
  };
}

class Calculator {
  @enumerable(false)
  add(a, b) {
    return a + b;
  }

  @enumerable(true)
  multiply(a, b) {
    return a * b;
  }
}

// 3. 属性装饰器
function readonly(target, propertyKey, descriptor) {
  descriptor.writable = false;
  return descriptor;
}

class User {
  @readonly
  name = 'Tom';
}

// 4. 参数装饰器
function loggedParam(target, propertyKey, parameterIndex) {
  console.log(`Parameter ${parameterIndex} of ${propertyKey}`);
}

class Service {
  method(@loggedParam param1, @loggedParam param2) {
    return param1 + param2;
  }
}

// 5. 装饰器工厂
function color(value) {
  return function(target, propertyKey, descriptor) {
    descriptor.value = function(...args) {
      console.log(`Color: ${value}`);
      return descriptor.value.apply(this, args);
    };
    return descriptor;
  };
}

class Shape {
  @color('red')
  draw() {
    console.log('Drawing shape');
  }
}

// 6. 装饰器组合
function first() {
  console.log('first(): evaluated');
  return function(target, propertyKey, descriptor) {
    console.log('first(): called');
  };
}

function second() {
  console.log('second(): evaluated');
  return function(target, propertyKey, descriptor) {
    console.log('second(): called');
  };
}

class Example {
  @first()
  @second()
  method() {}
}
// 输出:
// first(): evaluated
// second(): evaluated
// second(): called
// first(): called
```

### 12.4 模块化详解

**参考答案：**

```javascript
// 1. ES6 模块 (export/import)
// 命名导出
export const name = 'Tom';
export function greet() { return 'Hello'; }
export class User { }

// 默认导出
export default function() { return 'default'; }

// 导入
import defaultExport from './module.js';
import { name, greet } from './module.js';
import * as module from './module.js';

// 2. CommonJS (Node.js)
module.exports = { name: 'Tom' };
const { name } = require('./module.js');

// 3. 动态导入
async function loadModule() {
  const module = await import('./module.js');
  module.default();
}

// 4. 模块循环引用
// a.js
import { b } from './b.js';
export const a = 'a';
export function getB() {
  return b;
}

// b.js
import { a } from './a.js';
export const b = 'b';
export function getA() {
  return a;
}

// 注意：循环引用时，导出变量的初始值为 undefined

// 5. 模块单例模式
// 每个 ES 模块都是单例，导入多次得到相同引用

// 6. 模块静态分析
// 模块在解析阶段确定导入导出，无法动态导入

// 7. import() 动态导入 - 代码分割
async function loadFeature(flag) {
  if (flag) {
    const { featureA } = await import('./featureA.js');
    featureA();
  } else {
    const { featureB } = await import('./featureB.js');
    featureB();
  }
}
```

### 12.5 Set / Map / WeakSet / WeakMap

**参考答案：**

```javascript
// Set - 值的集合
const set = new Set([1, 2, 3, 2, 1]);
console.log(set.size);  // 3 (去重)
set.add(4);
set.has(1);     // true
set.delete(1);
set.clear();

// 遍历
for (const item of set) {
  console.log(item);
}
set.forEach(item => console.log(item));

// 数组去重
const arr = [1, 2, 2, 3, 3, 3];
const unique = [...new Set(arr)];  // [1, 2, 3]

// Set 实践应用
// 1. 字符串去重
const str = 'hello';
const uniqueStr = [...new Set(str)].join('');  // 'helo'

// 2. 数组交集
const a = [1, 2, 3];
const b = [2, 3, 4];
const intersection = [...new Set(a)].filter(x => new Set(b).has(x));

// 3. 数组差集
const difference = [...new Set(a)].filter(x => !new Set(b).has(x));

// Map - 键值对集合
const map = new Map();
map.set('name', 'Tom');
map.set('age', 18);
map.get('name');     // 'Tom'
map.has('name');     // true
map.delete('name');
map.size;            // 2

// Map 遍历
for (const [key, value] of map) {
  console.log(key, value);
}
map.forEach((value, key) => {
  console.log(key, value);
});

// Map 与对象互转
const obj = { name: 'Tom', age: 18 };
const mapFromObj = new Map(Object.entries(obj));
const objFromMap = Object.fromEntries(map);

// Map 实践应用
// 1. 缓存函数结果
const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

// 2. 字典统计
const countWords = (text) => {
  const counts = new Map();
  for (const word of text.split(' ')) {
    counts.set(word, (counts.get(word) || 0) + 1);
  }
  return counts;
};

// WeakSet - 弱引用集合
const weakSet = new WeakSet();
const obj = {};
weakSet.add(obj);
weakSet.has(obj);    // true
weakSet.delete(obj);

// 应用：存储对象，只关心是否存在
const visited = new WeakSet();
function visit(node) {
  if (visited.has(node)) return false;
  visited.add(node);
  return true;
}

// WeakMap - 弱引用字典
const weakMap = new WeakMap();
const obj = {};
weakMap.set(obj, 'value');
weakMap.get(obj);    // 'value'
weakMap.has(obj);    // true

// 应用：私有数据
const privateData = new WeakMap();
class User {
  constructor(name) {
    privateData.set(this, { name });
  }
  getName() {
    return privateData.get(this).name;
  }
}
```

---

## 十三、手写代码题精选

### 13.1 完整版深拷贝

**参考答案：**

```javascript
/**
 * 深拷贝完整版
 * 支持：
 * - 基本类型
 * - 数组和对象
 * - Date 和 RegExp
 * - Symbol 作为键名
 * - 循环引用
 * - 函数（可选）
 * - Map 和 Set
 */

function deepClone(target, hash = new WeakMap()) {
  // 1. 处理 null 和 undefined
  if (target === null) return null;
  if (target === undefined) return undefined;

  // 2. 处理原始类型
  if (typeof target !== 'object') {
    return target;
  }

  // 3. 处理函数（可选）
  if (typeof target === 'function') {
    return target;  // 或者 return target.bind({});
  }

  // 4. 处理日期
  if (target instanceof Date) {
    return new Date(target.getTime());
  }

  // 5. 处理正则
  if (target instanceof RegExp) {
    const flags = target.flags || '';
    return new RegExp(target.source, flags);
  }

  // 6. 处理 Map
  if (target instanceof Map) {
    const cloneMap = new Map();
    hash.set(target, cloneMap);
    target.forEach((value, key) => {
      cloneMap.set(
        deepClone(key, hash),
        deepClone(value, hash)
      );
    });
    return cloneMap;
  }

  // 7. 处理 Set
  if (target instanceof Set) {
    const cloneSet = new Set();
    hash.set(target, cloneSet);
    target.forEach(value => {
      cloneSet.add(deepClone(value, hash));
    });
    return cloneSet;
  }

  // 8. 处理循环引用
  if (hash.has(target)) {
    return hash.get(target);
  }

  // 9. 处理数组
  if (Array.isArray(target)) {
    const cloneArr = [];
    hash.set(target, cloneArr);
    target.forEach((item, index) => {
      cloneArr[index] = deepClone(item, hash);
    });
    return cloneArr;
  }

  // 10. 处理普通对象
  const cloneObj = {};
  hash.set(target, cloneObj);

  // 获取所有键（包括 Symbol）
  const keys = [
    ...Object.keys(target),
    ...Object.getOwnPropertySymbols(target)
  ];

  keys.forEach(key => {
    const descriptor = Object.getOwnPropertyDescriptor(target, key);
    if (descriptor && !descriptor.enumerable) {
      // 处理不可枚举属性
      Object.defineProperty(cloneObj, key, {
        ...descriptor,
        value: deepClone(descriptor.value, hash)
      });
    } else {
      cloneObj[key] = deepClone(target[key], hash);
    }
  });

  return cloneObj;
}

// 测试
const original = {
  name: 'Tom',
  date: new Date('2024-01-01'),
  regex: /test/gi,
  symbol: Symbol('id'),
  map: new Map([['key', 'value']]),
  set: new Set([1, 2, 3]),
  nested: {
    a: 1,
    b: [1, 2, { c: 3 }]
  },
  self: null  // 循环引用
};
original.self = original;

const cloned = deepClone(original);
console.log(cloned);
console.log(original.self === cloned.self);  // false（循环引用被正确处理）
```

### 13.2 完整版防抖节流

**参考答案：**

```javascript
/**
 * 防抖 (Debounce) - 函数在指定时间间隔内不被再次调用
 * 适用场景：搜索框输入、窗口调整大小、提交按钮
 */

// 基础版防抖
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

// 带立即执行选项的防抖
function debounceImmediate(func, wait, immediate = false) {
  let timeout;
  return function(...args) {
    const context = this;

    const later = () => {
      timeout = null;
      if (!immediate) {
        func.apply(context, args);
      }
    };

    const callNow = immediate && !timeout;

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) {
      func.apply(context, args);
    }
  };
}

// 完整版防抖（支持取消和立即执行）
function debouncePro(func, wait, options = {}) {
  let timeout;
  let lastArgs;
  let lastThis;
  let result;
  let lastCallTime;

  const { immediate = false, trailing = true } = options;

  const debounced = function(...args) {
    lastArgs = args;
    lastThis = this;
    const now = Date.now();

    // 立即执行模式
    if (immediate) {
      const callNow = !timeout;
      timeout = setTimeout(() => {
        timeout = null;
      }, wait);

      if (callNow) {
        result = func.apply(this, args);
      }
    } else {
      // 普通模式
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        timeout = null;
        if (trailing && lastArgs) {
          result = func.apply(lastThis, lastArgs);
        }
      }, wait);
    }

    return result;
  };

  // 取消函数
  debounced.cancel = function() {
    if (timeout) clearTimeout(timeout);
    timeout = null;
    lastArgs = lastThis = null;
  };

  // 立即执行函数
  debounced.flush = function() {
    if (timeout) {
      if (immediate) {
        func.apply(lastThis, lastArgs);
      }
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}

/**
 * 节流 (Throttle) - 函数在指定时间间隔内最多执行一次
 * 适用场景：滚动事件、鼠标移动、resize 事件
 */

// 时间戳版本
function throttleTimestamp(func, wait) {
  let previous = 0;
  return function(...args) {
    const now = Date.now();
    if (now - previous >= wait) {
      func.apply(this, args);
      previous = now;
    }
  };
}

// 定时器版本
function throttleTimer(func, wait) {
  let timeout;
  return function(...args) {
    if (!timeout) {
      timeout = setTimeout(() => {
        timeout = null;
        func.apply(this, args);
      }, wait);
    }
  };
}

// 完整版节流（支持 leading/trailing）
function throttlePro(func, wait, options = {}) {
  let timeout;
  let previous = 0;
  let result;
  let lastArgs;
  let lastThis;

  const { leading = true, trailing = true } = options;

  const throttled = function(...args) {
    const now = Date.now();
    lastArgs = args;
    lastThis = this;

    // leading：立即执行
    if (leading && previous === 0) {
      result = func.apply(this, args);
      previous = now;
      return result;
    }

    // 距离上次执行剩余时间
    const remaining = wait - (now - previous);

    // 执行条件
    if (remaining <= 0 || remaining > wait) {
      // 清除定时器
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }

      previous = now;
      result = func.apply(this, args);

      // trailing：最后执行
    } else if (trailing && !timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        result = func.apply(lastThis, lastArgs);

        // 防止 trailing 在 leading 之后再次执行
        if (!leading) {
          previous = 0;
        }
      }, remaining);
    }

    return result;
  };

  // 取消函数
  throttled.cancel = function() {
    clearTimeout(timeout);
    previous = 0;
    timeout = lastArgs = lastThis = null;
  };

  return throttled;
}

// 实际应用示例
const handleSearch = debouncePro((keyword) => {
  console.log('搜索:', keyword);
}, 300, { immediate: true });

const handleScroll = throttlePro(() => {
  console.log('滚动位置:', window.scrollY);
}, 100, { leading: true, trailing: true });

const handleResize = throttlePro(() => {
  console.log('窗口大小:', window.innerWidth, window.innerHeight);
}, 200);

// 使用示例
window.addEventListener('resize', handleResize);
window.addEventListener('scroll', handleScroll);
```

### 13.3 完整版 Promise 实现

**参考答案：**

```javascript
/**
 * 手写完整版 Promise
 * 包含：状态管理、then 链式调用、catch、finally、
 *      resolve、reject、all、race、allSettled、any
 */

const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

class MyPromise {
  constructor(executor) {
    // 状态
    this.state = PENDING;
    // 值
    this.value = undefined;
    // 失败原因
    this.reason = undefined;

    // 成功回调队列
    this.onFulfilledCallbacks = [];
    // 失败回调队列
    this.onRejectedCallbacks = [];

    // 绑定 this
    const resolve = this.resolve.bind(this);
    const reject = this.reject.bind(this);

    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  // 改变状态为成功
  resolve(value) {
    // 只有 pending 状态可以改变
    if (this.state === PENDING) {
      // 处理 Promise 值（如果是 Promise，递归解析）
      if (value instanceof MyPromise) {
        value.then(this.resolve.bind(this), this.reject.bind(this));
        return;
      }

      this.state = FULFILLED;
      this.value = value;

      // 异步执行回调
      this.onFulfilledCallbacks.forEach(callback => {
        queueMicrotask(() => callback(this.value));
      });
    }
  }

  // 改变状态为失败
  reject(reason) {
    if (this.state === PENDING) {
      this.state = REJECTED;
      this.reason = reason;

      this.onRejectedCallbacks.forEach(callback => {
        queueMicrotask(() => callback(this.reason));
      });
    }
  }

  // then 方法
  then(onFulfilled, onRejected) {
    // 参数可选
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
    onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason; };

    // 返回新的 Promise
    return new MyPromise((resolve, reject) => {
      // 封装回调函数，统一处理
      const handleCallback = (callback, value) => {
        try {
          const result = callback(value);
          // 处理返回值，如果是 Promise 则等待其完成
          if (result instanceof MyPromise) {
            result.then(resolve, reject);
          } else {
            resolve(result);
          }
        } catch (error) {
          reject(error);
        }
      };

      // 根据状态执行回调
      if (this.state === FULFILLED) {
        queueMicrotask(() => handleCallback(onFulfilled, this.value));
      } else if (this.state === REJECTED) {
        queueMicrotask(() => handleCallback(onRejected, this.reason));
      } else {
        // pending 状态，保存回调
        this.onFulfilledCallbacks.push(value => {
          handleCallback(onFulfilled, value);
        });
        this.onRejectedCallbacks.push(reason => {
          handleCallback(onRejected, reason);
        });
      }
    });
  }

  // catch 方法
  catch(onRejected) {
    return this.then(null, onRejected);
  }

  // finally 方法
  finally(onFinally) {
    return this.then(
      value => {
        // 等待 finally 执行完成
        return MyPromise.resolve(onFinally()).then(() => value);
      },
      reason => {
        return MyPromise.resolve(onFinally()).then(() => { throw reason; });
      }
    );
  }

  // 静态 resolve 方法
  static resolve(value) {
    if (value instanceof MyPromise) {
      return value;
    }
    return new MyPromise(resolve => resolve(value));
  }

  // 静态 reject 方法
  static reject(reason) {
    return new MyPromise((_, reject) => reject(reason));
  }

  // 静态 all 方法 - 全部成功才成功
  static all(promises) {
    return new MyPromise((resolve, reject) => {
      if (!Array.isArray(promises)) {
        return reject(new TypeError('参数必须是数组'));
      }

      const results = [];
      let count = 0;

      if (promises.length === 0) {
        return resolve([]);
      }

      promises.forEach((promise, index) => {
        // 包装非 Promise 值
        MyPromise.resolve(promise).then(
          value => {
            results[index] = value;
            count++;
            if (count === promises.length) {
              resolve(results);
            }
          },
          reject
        );
      });
    });
  }

  // 静态 race 方法 - 返回最先完成的结果
  static race(promises) {
    return new MyPromise((resolve, reject) => {
      if (!Array.isArray(promises)) {
        return reject(new TypeError('参数必须是数组'));
      }

      promises.forEach(promise => {
        MyPromise.resolve(promise).then(resolve, reject);
      });
    });
  }

  // 静态 allSettled 方法 - 等待所有 Promise 完成
  static allSettled(promises) {
    return new MyPromise((resolve) => {
      if (!Array.isArray(promises)) {
        return reject(new TypeError('参数必须是数组'));
      }

      const results = [];
      let count = 0;

      if (promises.length === 0) {
        return resolve([]);
      }

      promises.forEach((promise, index) => {
        MyPromise.resolve(promise).then(
          value => {
            results[index] = { status: FULFILLED, value };
            count++;
            if (count === promises.length) {
              resolve(results);
            }
          },
          reason => {
            results[index] = { status: REJECTED, reason };
            count++;
            if (count === promises.length) {
              resolve(results);
            }
          }
        );
      });
    });
  }

  // 静态 any 方法 - 返回第一个成功的结果
  static any(promises) {
    return new MyPromise((resolve, reject) => {
      if (!Array.isArray(promises)) {
        return reject(new TypeError('参数必须是数组'));
      }

      const errors = [];
      let count = 0;

      if (promises.length === 0) {
        return reject(new AggregateError('All promises were rejected'));
      }

      promises.forEach((promise, index) => {
        MyPromise.resolve(promise).then(
          value => resolve(value),
          error => {
            errors[index] = error;
            count++;
            if (count === promises.length) {
              reject(new AggregateError(errors));
            }
          }
        );
      });
    });
  }
}

// 测试
const p1 = new MyPromise(resolve => setTimeout(() => resolve(1), 1000));
const p2 = new MyPromise(resolve => setTimeout(() => resolve(2), 500));
const p3 = new MyPromise((_, reject) => setTimeout(() => reject('error'), 200));

MyPromise.all([p1, p2]).then(console.log);  // [1, 2]
MyPromise.race([p1, p2]).then(console.log); // 2
```

### 13.4 call / apply / bind 完整实现

**参考答案：**

```javascript
/**
 * call 实现
 * 语法: fn.call(thisArg, arg1, arg2, ...)
 * 作用: 改变函数 this 指向并执行
 */
Function.prototype.myCall = function(context, ...args) {
  // 1. 处理 context（thisArg）
  // 如果为 null 或 undefined，指向全局对象
  // 如果是原始类型，转换为对象
  const ctx = context === null || context === undefined
    ? globalThis
    : Object(context);

  // 2. 创建唯一属性名
  const fn = Symbol('fn');

  // 3. 将函数设置为 context 的属性
  ctx[fn] = this;

  // 4. 执行函数并获取结果
  // 使用扩展运算符传递参数
  const result = ctx[fn](...args);

  // 5. 删除临时属性
  delete ctx[fn];

  // 6. 返回结果
  return result;
};

/**
 * apply 实现
 * 语法: fn.apply(thisArg, [argsArray])
 * 作用: 改变函数 this 指向并执行（参数为数组）
 */
Function.prototype.myApply = function(context, args = []) {
  // 处理 context
  const ctx = context === null || context === undefined
    ? globalThis
    : Object(context);

  // 创建唯一属性名
  const fn = Symbol('fn');

  // 设置临时属性
  ctx[fn] = this;

  // 执行函数
  let result;
  if (args.length > 0) {
    result = ctx[fn](...args);
  } else {
    result = ctx[fn]();
  }

  // 清理
  delete ctx[fn];

  return result;
};

/**
 * bind 实现
 * 语法: fn.bind(thisArg, arg1, arg2, ...)
 * 作用: 创建一个新函数，this 被绑定
 */
Function.prototype.myBind = function(context, ...args) {
  // 保存原函数
  const fn = this;

  // 返回新函数
  return function(...args2) {
    // 处理构造函数调用
    // 如果使用 new 调用，忽略 thisArg
    if (this instanceof fn) {
      return new fn(...args, ...args2);
    }

    // 普通调用
    return fn.apply(context, [...args, ...args2]);
  };
};

/**
 * 简化的 bind 实现（面试常考）
 */
Function.prototype.simpleBind = function(context) {
  const fn = this;
  const args = Array.prototype.slice.call(arguments, 1);

  return function() {
    const args2 = Array.prototype.slice.call(arguments);
    return fn.apply(context, args.concat(args2));
  };
};

/**
 * bind 的高级特性 - 构造函数检测
 */
function Animal(name) {
  if (this instanceof Animal) {
    this.name = name;
  } else {
    throw new Error('必须使用 new 调用');
  }
}

const AnimalFn = Animal.myBind(null, 'Tom');
const animal1 = new AnimalFn();  // this instanceof Animal === true
const animal2 = AnimalFn();       // 抛出错误

/**
 * 使用示例
 */
function greet(greeting, punctuation) {
  return `${greeting}, ${this.name}${punctuation}`;
}

const person = { name: 'Tom' };

// call 使用
console.log(greet.myCall(person, 'Hello', '!'));  // Hello, Tom!

// apply 使用
console.log(greet.myApply(person, ['Hello', '!']));  // Hello, Tom!

// bind 使用
const boundGreet = greet.myBind(person, 'Hi');
console.log(boundGreet('?'));  // Hi, Tom?
```

### 13.5 数组去重方法汇总

**参考答案：**

```javascript
/**
 * 数组去重方法汇总
 */

// 方法1: Set（最简单）
function unique1(arr) {
  return [...new Set(arr)];
}

// 方法2: filter + indexOf
function unique2(arr) {
  return arr.filter((item, index) => arr.indexOf(item) === index);
}

// 方法3: filter + includes
function unique3(arr) {
  const result = [];
  arr.forEach(item => {
    if (!result.includes(item)) {
      result.push(item);
    }
  });
  return result;
}

// 方法4: reduce
function unique4(arr) {
  return arr.reduce((acc, cur) => {
    if (!acc.includes(cur)) {
      acc.push(cur);
    }
    return acc;
  }, []);
}

// 方法5: Map（保持插入顺序）
function unique5(arr) {
  const map = new Map();
  const result = [];
  arr.forEach(item => {
    if (!map.has(item)) {
      map.set(item, true);
      result.push(item);
    }
  });
  return result;
}

// 方法6: Object（适用于基本类型）
function unique6(arr) {
  const obj = {};
  return arr.filter(item => {
    const key = typeof item + JSON.stringify(item);
    if (obj[key]) {
      return false;
    }
    obj[key] = true;
    return true;
  });
}

// 方法7: 排序后去重
function unique7(arr) {
  const sorted = [...arr].sort();
  const result = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] !== sorted[i - 1]) {
      result.push(sorted[i]);
    }
  }
  return result;
}

// 方法8: 递归（支持深层数组）
function uniqueDeep(arr) {
  const result = [];
  arr.forEach(item => {
    if (Array.isArray(item)) {
      const uniqueItems = uniqueDeep(item);
      uniqueItems.forEach(u => {
        if (!result.includes(u)) {
          result.push(u);
        }
      });
    } else if (!result.includes(item)) {
      result.push(item);
    }
  });
  return result;
}

// 测试
const arr = [1, 2, 2, 3, 3, 3, 'a', 'a', { a: 1 }, { a: 1 }];
console.log(unique1(arr));
// [1, 2, 3, 'a', {a: 1}, {a: 1}]

// 特殊情况处理
// 1. NaN 去重
function uniqueNaN(arr) {
  return arr.filter((item, index, array) =>
    array.findIndex(x => Number.isNaN(x)) === index
  );
}

// 2. 对象数组去重
function uniqueBy(arr, key) {
  const seen = new Set();
  return arr.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

const users = [
  { id: 1, name: 'Tom' },
  { id: 2, name: 'Jerry' },
  { id: 1, name: 'Tom' }
];
console.log(uniqueBy(users, 'id'));
// [{id: 1, name: 'Tom'}, {id: 2, name: 'Jerry'}]
```

### 13.6 常见算法实现

**参考答案：**

```javascript
/**
 * 排序算法
 */

// 冒泡排序
function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}

// 快速排序
function quickSort(arr) {
  if (arr.length <= 1) return arr;

  const pivot = arr[0];
  const left = arr.slice(1).filter(x => x < pivot);
  const right = arr.slice(1).filter(x => x >= pivot);

  return [...quickSort(left), pivot, ...quickSort(right)];
}

// 归并排序
function mergeSort(arr) {
  if (arr.length <= 1) return arr;

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));

  return merge(left, right);
}

function merge(left, right) {
  const result = [];
  let i = 0, j = 0;

  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) {
      result.push(left[i++]);
    } else {
      result.push(right[j++]);
    }
  }

  return result.concat(left.slice(i)).concat(right.slice(j));
}

// 插入排序
function insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    const current = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > current) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = current;
  }
  return arr;
}

/**
 * 查找算法
 */

// 二分查找
function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }

  return -1;
}

// 顺序查找
function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}

/**
 * 字符串算法
 */

// 反转字符串
function reverseString(str) {
  return str.split('').reverse().join('');
}

// 回文判断
function isPalindrome(str) {
  const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');
  return cleaned === cleaned.split('').reverse().join('');
}

// 字符串压缩（行程编码）
function compressString(str) {
  let result = '';
  let count = 1;

  for (let i = 1; i <= str.length; i++) {
    if (str[i] === str[i - 1]) {
      count++;
    } else {
      result += str[i - 1] + (count > 1 ? count : '');
      count = 1;
    }
  }

  return result;
}

/**
 * 树与图算法
 */

// 二叉树遍历
class TreeNode {
  constructor(val) {
    this.val = val;
    this.left = null;
    this.right = null;
  }
}

// 前序遍历
function preorderTraversal(root) {
  const result = [];
  function traverse(node) {
    if (!node) return;
    result.push(node.val);
    traverse(node.left);
    traverse(node.right);
  }
  traverse(root);
  return result;
}

// 中序遍历
function inorderTraversal(root) {
  const result = [];
  function traverse(node) {
    if (!node) return;
    traverse(node.left);
    result.push(node.val);
    traverse(node.right);
  }
  traverse(root);
  return result;
}

// 后序遍历
function postorderTraversal(root) {
  const result = [];
  function traverse(node) {
    if (!node) return;
    traverse(node.left);
    traverse(node.right);
    result.push(node.val);
  }
  traverse(root);
  return result;
}

// 广度优先遍历（BFS）
function bfs(root) {
  if (!root) return [];
  const result = [];
  const queue = [root];

  while (queue.length) {
    const node = queue.shift();
    result.push(node.val);
    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }

  return result;
}

/**
 * 动态规划
 */

// 斐波那契数列
function fibonacci(n) {
  // 递归（效率低）
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// 动态规划优化
function fibonacciDP(n) {
  if (n <= 1) return n;
  const dp = [0, 1];
  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }
  return dp[n];
}

// 空间优化
function fibonacciOptimized(n) {
  if (n <= 1) return n;
  let prev = 0, curr = 1;
  for (let i = 2; i <= n; i++) {
    [prev, curr] = [curr, prev + curr];
  }
  return curr;
}

// 爬楼梯
function climbStairs(n) {
  if (n <= 2) return n;
  let a = 1, b = 2;
  for (let i = 3; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}

// 最大子序和
function maxSubArray(nums) {
  let maxSum = nums[0];
  let currentSum = nums[0];

  for (let i = 1; i < nums.length; i++) {
    currentSum = Math.max(nums[i], currentSum + nums[i]);
    maxSum = Math.max(maxSum, currentSum);
  }

  return maxSum;
}

// 背包问题
function knapSack(weights, values, capacity) {
  const n = weights.length;
  const dp = Array(n + 1).fill(null).map(() => Array(capacity + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= capacity; w++) {
      if (weights[i - 1] <= w) {
        dp[i][w] = Math.max(
          dp[i - 1][w],
          dp[i - 1][w - weights[i - 1]] + values[i - 1]
        );
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  return dp[n][capacity];
}
```

---

## 十四、浏览器渲染与优化

### 14.1 浏览器渲染流程

**参考答案：**

```
┌─────────────────────────────────────────────────────────────────┐
│                      浏览器渲染流程                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐            │
│  │   解析     │───►│   样式     │───►│   布局     │            │
│  │  HTML/CSS  │    │   计算     │    │   (Layout)│            │
│  └────────────┘    └────────────┘    └─────┬──────┘            │
│                                            │                    │
│                                            ▼                    │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐            │
│  │    绘制    │◄───│    渲染    │◄───│   分层     │            │
│  │  (Paint)  │    │   (Layer)  │    │  (Composite)│           │
│  └────────────┘    └────────────┘    └────────────┘            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

详细流程：
1. HTML 解析 → DOM 树
2. CSS 解析 → CSSOM 树
3. DOM + CSSOM → 渲染树 (Render Tree)
4. 渲染树 → 布局 (Layout) - 计算位置和大小
5. 布局树 → 分层 (Layer) - 创建图层
6. 图层 → 绘制 (Paint) - 绘制指令
7. 合成 (Composite) - GPU 合成最终图像
```

### 14.2 重排与重绘

**参考答案：**

```javascript
// 触发重排（Reflow）的操作
// 任何改变元素位置、大小、内容的操作都会触发重排

// 1. 调整窗口大小
window.addEventListener('resize', handler);

// 2. 改变元素尺寸
element.style.width = '100px';
element.style.height = '100px';

// 3. 改变元素内容
element.textContent = 'new content';
element.innerHTML = '<div>new</div>';

// 4. 获取布局信息
element.offsetWidth;     // 触发重排
element.offsetHeight;
element.clientWidth;
element.scrollWidth;
element.getBoundingClientRect();
window.getComputedStyle(element);

// 5. 添加/删除可见元素
document.body.appendChild(element);

// 6. 改变字体大小
element.style.fontSize = '20px';

// 7. 改变 padding/margin
element.style.padding = '10px';


// 触发重绘（Repaint）的操作
// 改变元素外观但不影响布局

// 1. 改变颜色
element.style.color = 'red';
element.style.backgroundColor = 'blue';

// 2. 改变边框样式
element.style.border = '1px solid red';

// 3. 改变 visibility
element.style.visibility = 'hidden';


// 性能优化：减少重排重绘

// 1. 批量修改样式
// 错误
element.style.width = '100px';
element.style.height = '100px';
element.style.color = 'red';

// 正确 - 使用 class
element.className = 'active';

// 正确 - 使用 CSS变量
element.style.setProperty('--width', '100px');

// 2. 使用 transform 代替 left/top
// 触发重排
element.style.left = '100px';
element.style.top = '100px';

// 触发合成
element.style.transform = 'translateX(100px)';

// 3. 使用 will-change
.element {
  will-change: transform;  // 提前告知浏览器
}

// 4. 缓存布局信息
const width = element.offsetWidth;  // 读取一次
// 多次使用 width 变量

// 5. 使用 DocumentFragment
const fragment = document.createDocumentFragment();
for (let i = 0; i < 100; i++) {
  const div = document.createElement('div');
  fragment.appendChild(div);
}
document.body.appendChild(fragment);  // 触发一次重排

// 6. 虚拟 DOM（React 原理）
// 合并多次修改到一次重排
```

### 14.3 requestAnimationFrame 详解

**参考答案：**

```javascript
// requestAnimationFrame - 浏览器下一次重绘前执行
// 特点：60fps 自动节流、页面不可见时暂停、保证动画流畅

// 基本用法
function animate() {
  // 更新动画状态
  update();

  // 绘制
  draw();

  // 继续下一帧
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// 取消动画
let animationId = requestAnimationFrame(animate);
cancelAnimationFrame(animationId);

// 实际应用：平滑动画
function smoothMove(element, targetX, targetY) {
  let currentX = 0, currentY = 0;

  function animate() {
    // 计算移动步长
    const dx = targetX - currentX;
    const dy = targetY - currentY;

    // 接近目标时停止
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
      element.style.transform = `translate(${targetX}px, ${targetY}px)`;
      return;
    }

    // 使用缓动函数
    currentX += dx * 0.1;
    currentY += dy * 0.1;

    element.style.transform = `translate(${currentX}px, ${currentY}px)`;
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

// 实现防抖版本 requestAnimationFrame
function rafDebounce(fn) {
  let rafId = null;
  return function(...args) {
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    rafId = requestAnimationFrame(() => {
      fn.apply(this, args);
      rafId = null;
    });
  };
}

// 实现节流版本 requestAnimationFrame
function rafThrottle(fn) {
  let lastTime = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastTime >= 16) {  // 约 60fps
      lastTime = now;
      fn.apply(this, args);
    }
  };
}

// 与 setTimeout/setInterval 对比
// setInterval 可能在帧之间执行，导致丢帧
// requestAnimationFrame 总是与浏览器刷新率同步

// 实际应用：倒计时
function countDown(element, seconds) {
  let remaining = seconds;

  function update() {
    element.textContent = remaining;
    remaining--;

    if (remaining >= 0) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

// 实际应用：滚动监听优化
function handleScroll() {
  console.log(window.scrollY);
}

window.addEventListener('scroll', rafThrottle(handleScroll));

// 实际应用：Canvas 动画
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function gameLoop() {
  // 清除画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 更新状态
  update();

  // 绘制
  draw();

  // 继续循环
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
```

---

## 十五、网络与性能

### 15.1 HTTP 缓存机制

**参考答案：**

```
┌─────────────────────────────────────────────────────────────────┐
│                      HTTP 缓存机制                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    浏览器缓存                            │    │
│  │                                                          │    │
│  │  ┌─────────────┐    ┌─────────────┐                     │    │
│  │  │   强缓存    │    │   协商缓存  │                     │    │
│  │  │  (Cache)   │    │  (Etag)     │                     │    │
│  │  └──────┬──────┘    └──────┬──────┘                     │    │
│  │         │                  │                             │    │
│  │  Expires │            If-None-Match                     │    │
│  │  Cache-Control     If-Modified-Since                    │    │
│  │                                            │             │    │
│  └──────────┼──────────────────────────────┘              │    │
│             │                                            │    │
│             ▼                                            ▼    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                      服务器                             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

```javascript
// 强缓存 - 不发送请求到服务器
// Cache-Control (HTTP/1.1)
response.setHeader('Cache-Control', 'max-age=3600');           // 1小时
response.setHeader('Cache-Control', 'no-cache');             // 每次验证
response.setHeader('Cache-Control', 'no-store');              // 不缓存
response.setHeader('Cache-Control', 'public');                 // 允许代理缓存
response.setHeader('Cache-Control', 'private');               // 仅浏览器缓存

// Expires (HTTP/1.0)
response.setHeader('Expires', 'Wed, 21 Oct 2025 07:28:00 GMT');

// 协商缓存 - 需要发送请求验证
// ETag / If-None-Match
response.setHeader('ETag', 'abc123');  // 服务器生成
// 下次请求
request.setHeader('If-None-Match', 'abc123');

// Last-Modified / If-Modified-Since
response.setHeader('Last-Modified', 'Wed, 21 Oct 2025 07:28:00 GMT');
// 下次请求
request.setHeader('If-Modified-Since', 'Wed, 21 Oct 2025 07:28:00 GMT');

// 优先级：Cache-Control > Expires
// ETag > Last-Modified（更精确）
```

### 15.2 性能优化技巧

**参考答案：**

```javascript
// 1. 减少 HTTP 请求
// - 合并 CSS/JS 文件
// - 使用 CSS Sprite
// - 使用 Base64 编码（小图片）
// - 懒加载

// 2. 使用 CDN
// 静态资源使用 CDN 加速

// 3. 启用压缩
// Gzip / Brotli 压缩

// 4. 代码优化
// - 删除未使用的代码
// - 代码分割 (Code Splitting)
// - Tree Shaking

// 5. 图片优化
// - 使用 WebP 格式
// - 响应式图片 srcset
// - 懒加载
// - 压缩

// 6. 关键渲染路径优化
// <link rel="preload"> 预加载关键资源
<link rel="preload" href="main.css" as="style">
<link rel="preload" href="main.js" as="script">

// 7. DNS 预解析
<link rel="dns-prefetch" href="//example.com">

// 8. TCP 预连接
<link rel="preconnect" href="//example.com">

// 9. Service Worker 缓存
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// 10. 前端性能指标
// LCP (Largest Contentful Paint) - 最大内容绘制
// FID (First Input Delay) - 首次输入延迟
// CLS (Cumulative Layout Shift) - 累计布局偏移

// 使用 Performance API
performance.mark('start');
// 执行代码
performance.mark('end');
performance.measure('duration', 'start', 'end');

// 11. 减少重排重绘
// 使用 transform/opacity 进行动画
// 使用 will-change 提示浏览器
element.style.willChange = 'transform';

// 12. 使用 requestAnimationFrame
// 动画使用 rAF 而不是 setTimeout/setInterval
```

---

## 十六、面试常见问题汇总

### 16.1 JavaScript 基础面试题

**参考答案：**

```javascript
// Q1: var、let、const 的区别
// 答案见 6.1 节

// Q2: null 和 undefined 的区别
// null: 表示"空值"，手动赋值
// undefined: 表示"未定义"，自动赋值
let a;
console.log(a);  // undefined

const b = null;
console.log(b);  // null

// typeof 区别
typeof null;        // 'object' (历史 bug)
typeof undefined;   // 'undefined'

// == 区别
null == undefined;  // true
null === undefined; // false

// Q3: 什么是闭包
// 闭包是指函数与其外部作用域的引用捆绑在一起
// 外部函数可以访问内部函数的变量
function outer() {
  let count = 0;
  return function inner() {
    count++;
    return count;
  };
}
const fn = outer();
fn(); // 1
fn(); // 2

// Q4: 原型链是什么
// 每个对象都有一个指向其原型对象的内部链接
// 形成了对象的继承链

// Q5: 什么是事件循环
// 单线程的 JavaScript 通过事件循环处理异步操作
// 同步代码 -> 微任务 -> 渲染 -> 宏任务

// Q6: Promise 和 async/await 的区别
// Promise: 基于回调的异步解决方案
// async/await: Promise 的语法糖，更简洁

// Q7: 什么是柯里化
// 将多参数函数转换为单参数函数序列

// Q8: 深拷贝和浅拷贝的区别
// 浅拷贝: 只复制一层，引用类型共享内存
// 深拷贝: 递归复制所有层级，完全独立

// Q9: 防抖和节流的区别
// 防抖: 等待停止触发后执行
// 节流: 固定时间间隔执行

// Q10: 为什么 0.1 + 0.2 !== 0.3
// 浮点数精度问题
console.log(0.1 + 0.2);  // 0.30000000000000004
// 解决: 使用整数运算或 toFixed
Math.abs(0.1 + 0.2 - 0.3) < 0.000001;  // true
```

### 16.2 手写代码面试题

**参考答案：**

```javascript
// Q1: 实现一个类
class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  greet() {
    return `Hello, I'm ${this.name}`;
  }

  static create(name, age) {
    return new Person(name, age);
  }
}

// Q2: 实现继承
class Student extends Person {
  constructor(name, age, grade) {
    super(name, age);
    this.grade = grade;
  }

  study() {
    return `${this.name} is studying`;
  }
}

// Q3: 实现 EventEmitter
class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return this;
  }

  off(event, listener) {
    if (!this.events[event]) return this;
    this.events[event] = this.events[event].filter(l => l !== listener);
    return this;
  }

  emit(event, ...args) {
    if (!this.events[event]) return this;
    this.events[event].forEach(listener => listener(...args));
    return this;
  }

  once(event, listener) {
    const wrapper = (...args) => {
      listener(...args);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }
}

// Q4: 实现 LRU 缓存
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

// Q5: 实现 instanceof
function myInstanceof(left, right) {
  let proto = left.__proto__;
  const prototype = right.prototype;
  while (proto) {
    if (proto === prototype) return true;
    proto = proto.__proto__;
  }
  return false;
}

// Q6: 实现 new
function myNew(constructor, ...args) {
  const obj = Object.create(constructor.prototype);
  const result = constructor.apply(obj, args);
  return result instanceof Object ? result : obj;
}

// Q7: 实现 Promise.all
function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    const results = [];
    let count = 0;
    promises.forEach((p, i) => {
      Promise.resolve(p).then(
        value => {
          results[i] = value;
          count++;
          if (count === promises.length) resolve(results);
        },
        reject
      );
    });
  });
}

// Q8: 实现红绿灯交换
function red() { console.log('red'); }
function yellow() { console.log('yellow'); }
function green() { console.log('green'); }

function light(fn, ms) {
  return new Promise(r => setTimeout(() => { fn(); r(); }, ms));
}

async function run() {
  while (true) {
    await light(red, 3000);
    await light(yellow, 2000);
    await light(green, 1000);
  }
}

// Q9: 数组扁平化
function flatten(arr, depth = 1) {
  if (depth <= 0) return arr;
  return arr.reduce((acc, val) => {
    return Array.isArray(val)
      ? acc.concat(flatten(val, depth - 1))
      : acc.concat(val);
  }, []);
}

// Q10: 函数节流
function throttle(fn, wait) {
  let timeout;
  return function(...args) {
    if (!timeout) {
      timeout = setTimeout(() => {
        timeout = null;
        fn.apply(this, args);
      }, wait);
    }
  };
}
```

---

## 十七、JavaScript 最佳实践

### 17.1 代码规范与风格

**参考答案：**

```javascript
// 1. 使用 const/let 代替 var
// const: 不变的引用
// let: 可变的引用
// var: 函数作用域（容易产生 bug）

// 2. 使用模板字符串
const name = 'Tom';
const greeting = `Hello, ${name}!`;

// 3. 解构赋值
const { name, age } = user;
const [first, second] = arr;

// 4. 箭头函数
const add = (a, b) => a + b;

// 5. 使用默认参数
function fn(a = 10, b = 20) {}

// 6. 使用展开运算符
const arr1 = [1, 2, 3];
const arr2 = [...arr1, 4, 5];

const obj1 = { a: 1 };
const obj2 = { ...obj1, b: 2 };

// 7. 使用可选链
const value = obj?.nested?.property;
const method = obj?.method?.();

// 8. 使用空值合并
const value = null ?? 'default';

// 9. 使用 async/await
async function fetchData() {
  try {
    const data = await fetch('/api');
    return data.json();
  } catch (err) {
    console.error(err);
  }
}

// 10. 使用 BigInt
const big = 9007199254740991n;

// 11. 使用 BigInt 安全整数
Number.isSafeInteger(9007199254740991);  // true
Number.isSafeInteger(9007199254740992n); // false
```

### 17.2 错误处理最佳实践

**参考答案：**

```javascript
// 1. try-catch
try {
  // 可能出错的代码
  const data = JSON.parse(jsonString);
} catch (err) {
  console.error('解析失败:', err.message);
} finally {
  // 无论成功失败都执行
  console.log('清理资源');
}

// 2. 异步错误处理
async function fetchData() {
  try {
    const response = await fetch('/api');
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('请求失败:', err);
    throw err;
  }
}

// 3. Promise 错误处理
fetch('/api')
  .then(response => response.json())
  .catch(err => console.error(err));

// 4. window.onerror
window.onerror = (message, source, lineno, colno, error) => {
  console.error('全局错误:', message);
  return false;  // 不阻止默认错误处理
};

// 5. unhandledrejection
window.addEventListener('unhandledrejection', event => {
  console.error('未处理的 Promise 拒绝:', event.reason);
});

// 6. 自定义错误类
class AppError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}

// 7. 错误边界（React）
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong.</div>;
    }
    return this.props.children;
  }
}

// 8. 验证函数
function validate(data, schema) {
  const errors = [];
  for (const [field, rules] of Object.entries(schema)) {
    if (rules.required && !data[field]) {
      errors.push(`${field} is required`);
    }
    if (rules.type && typeof data[field] !== rules.type) {
      errors.push(`${field} must be ${rules.type}`);
    }
  }
  return errors;
}
```

### 17.3 单元测试最佳实践

**参考答案：**

```javascript
// Jest 测试示例

// 1. 基础测试
describe('Array', () => {
  test('should add items', () => {
    const arr = [];
    arr.push(1);
    expect(arr).toEqual([1]);
  });

  test('should remove items', () => {
    const arr = [1, 2, 3];
    arr.pop();
    expect(arr).toEqual([1, 2]);
  });
});

// 2. 异步测试
test('async operation', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});

// 3. 模拟函数
test('mock function', () => {
  const mockFn = jest.fn();
  mockFn.mockReturnValue('mock');

  const result = mockFn();
  expect(result).toBe('mock');
  expect(mockFn).toHaveBeenCalled();
});

// 4. 模拟模块
jest.mock('./api');
import { fetchUser } from './api';

// 5. 快照测试
test('snapshot', () => {
  const component = renderer.create(<App />);
  expect(component.toJSON()).toMatchSnapshot();
});

// 6. 覆盖率
// jest --coverage
```

---

## 附录

### 附录 A: ES6+ 新特性速查表

```javascript
// ES6 (ES2015)
const, let                    // 块级作用域
=>                             // 箭头函数
模板字符串                     // Template Literals
解构赋值                       // Destructuring
默认参数                       // Default Parameters
剩余参数                       // Rest Parameters
展开运算符                     // Spread Operator
类                             // Class
模块                           // Module (import/export)
Symbol                        // 新的原始类型
Promise                       // 异步解决方案
Map, Set                      // 新的数据结构
Proxy, Reflect               // 元编程
Iterator, for...of           // 迭代器

// ES7 (ES2016)
Array.prototype.includes     // 数组包含判断
幂运算符 **                   // Exponentiation Operator

// ES8 (ES7)
async/await                  // 异步语法糖
Object.values/entries       // 对象方法
String.prototype.padStart/padEnd  // 字符串填充
Object.getOwnPropertyDescriptors  // 属性描述符

// ES9 (ES2018)
async 迭代器                 // Async Iterator
Promise.prototype.finally    // finally 方法
对象展开运算符               // Object Rest/Spread

// ES10 (ES2019)
Array.prototype.flat/flatMap // 数组扁平化
Object.fromEntries          // 键值对转对象
String.prototype.trimStart/trimEnd  // 字符串 trim
可选捕获                     // Optional Catch Binding

// ES11 (ES2020)
?.                           // 可选链
??                            // 空值合并
BigInt                       // 大整数
Promise.allSettled          // Promise 方法
dynamic import              // 动态导入
globalThis                  // 全局对象

// ES12 (ES2021)
replaceAll                  // 字符串替换
Promise.any                 // Promise 方法
WeakRef                     // 弱引用
逻辑赋值运算符 ||= &&= ??=

// ES13 (ES2022)
static 块                   // 静态块
at()                        // 数组/字符串方法
Object.hasOwn              // 对象方法
Array.prototype.findLast   // 数组方法
```

### 附录 B: 常用工具函数库

```javascript
// 常用工具函数汇总

// 类型判断
const isType = (type) => (obj) => Object.prototype.toString.call(obj) === `[object ${type}]`;
const isArray = isType('Array');
const isObject = isType('Object');
const isString = isType('String');
const isNumber = isType('Number');
const isFunction = isType('Function');

// 防抖
const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

// 节流
const throttle = (fn, delay) => {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= delay) {
      last = now;
      fn(...args);
    }
  };
};

// 深拷贝
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(deepClone);
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, deepClone(v)])
  );
};

// 格式化日期
const formatDate = (date, format = 'YYYY-MM-DD') => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day);
};

// 随机数
const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// 数组去重
const unique = (arr) => [...new Set(arr)];

// 数组分块
const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );

// 随机打乱数组
const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

// 字符串脱敏
const mask = (str, start = 0, end = 0) => {
  if (str.length <= start + end) return str;
  return str.slice(0, start) + '*'.repeat(str.length - start - end) + str.slice(-end);
};
```

### 附录 C: 面试常考概念速记

```javascript
// 1. JavaScript 是单线程语言
// 2. 执行栈：后进先出
// 3. 事件循环：同步 → 微任务 → 渲染 → 宏任务

// 4. 闭包：函数能访问外部变量
// 5. 原型链：对象的继承机制
// 6. this 指向：最后调用它的对象

// 7. var 变量提升，let/const 暂时性死区
// 8. 箭头函数没有自己的 this/arguments
// 9. Promise 有三种状态：pending/fulfilled/rejected

// 10. 深拷贝要处理：循环引用、Date、RegExp、函数、Symbol
// 11. 防抖：最后一次触发后执行
// 12. 节流：固定时间间隔执行

// 13. 浏览器渲染：解析 → 样式 → 布局 → 绘制 → 合成
// 14. 重排：改变元素几何属性
// 15. 重绘：改变元素外观

// 16. Event Loop 浏览器：执行栈 → 微任务 → 渲染 → 宏任务
// 17. Event Loop Node：timers → pending → idle → poll → check → close

// 18. async/await 是 Promise 语法糖
// 19. await 会阻塞后面的代码，等待 Promise resolve
// 20. Promise.then 返回新的 Promise，支持链式调用
```

---

> 资料整理自 2025 字节跳动、阿里巴巴、拼多多面试
