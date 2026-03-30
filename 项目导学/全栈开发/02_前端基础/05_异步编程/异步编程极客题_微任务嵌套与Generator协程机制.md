# 异步编程极客题：微任务嵌套与 Generator 协程机制 (2026版)

## 1. 概述：异步的本质是让出控制权

在面试中，只要看到一堆 `setTimeout`、`Promise.then` 和 `async/await` 混杂在一起的代码，考官就是在测试你对 **V8 引擎事件循环 (Event Loop)** 和 **协程 (Coroutine)** 底层编译原理的理解。

本篇指南将从微任务队列的“饿死 (Starvation)”现象讲起，一路挖到 `async/await` 被 Babel 编译为状态机 (Generator) 的底层实现。

---

## 2. 微任务的陷阱：队列饥饿 (Microtask Starvation)

在事件循环中，宏任务（Macrotask，如 `setTimeout`）和微任务（Microtask，如 `Promise.then`）最大的区别是：**在进入下一个宏任务之前，V8 引擎必须清空当前所有的微任务。**

### 2.1 无限微任务带来的死锁
如果在清空微任务队列的过程中，又产生了新的微任务，V8 会继续在这个阶段死磕，直到队列绝对空为止。

**灾难代码：页面假死**
```javascript
function recursivePromise() {
  Promise.resolve().then(() => {
    // 在微任务中，往微任务队列里又塞了一个微任务
    recursivePromise(); 
  });
}
recursivePromise();

// 下面这个 setTimeout 永远、永远不会执行！
setTimeout(() => console.log('永远不会出现'), 0);
```
**原理**：虽然你的代码没有写 `while(true)`，但由于微任务队列不断有新任务排入，主线程永远卡在“清空微任务”这一步，永远无法推进到“UI 渲染 (Render)”和“下一个宏任务”阶段。这就是著名的**微任务饥饿**，导致页面瞬间变成无响应的白屏。

---

## 3. 终极面试题：`await` 到底阻塞了谁？

**请准确说出下面代码的输出顺序：**

```javascript
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
```

**解题底层法则 (2026 标准)**：
1. `async` 函数在遇到 `await` 之前，里面的代码都是**同步**执行的。
2. `await` 右侧的函数也是**立刻同步**执行的。
3. **最关键的一步**：`await` 后面的所有代码（即 `console.log('async1 end')`），会被打包成一个隐式的 `Promise.then()`，并作为**微任务**推入队列。同时，`async1` 函数**交出控制权 (Yield)**，让主线程继续执行外面的代码。

**极速推演步骤：**
1. 打印 `script start`。
2. 遇到 `setTimeout`，交由 Web API，回调推入**宏任务队列**。
3. 调用 `async1()`，打印 `async1 start`。
4. 遇到 `await async2()`，立刻同步执行 `async2()`，打印 `async2`。
5. **重头戏**：`await` 强制中断 `async1`，将 `async1 end` 推入**微任务队列**。
6. 主线程继续向下，遇到 `new Promise`，执行其同步的 executor，打印 `promise1`。
7. 遇到 `.then()`，将 `promise2` 推入**微任务队列**。
8. 打印 `script end`。同步代码执行完毕，调用栈清空。
9. 开始清空微任务队列：依次取出并打印 `async1 end` 和 `promise2`。
10. UI 渲染。
11. 进入下一轮事件循环，取出宏任务，打印 `setTimeout`。

**最终结果**：`script start` -> `async1 start` -> `async2` -> `promise1` -> `script end` -> `async1 end` -> `promise2` -> `setTimeout`。

---

## 4. `async/await` 的底层真相：Generator 状态机

你真的以为引擎原生理解 `async` 吗？在低版本编译（Babel）或底层的协程实现中，`async/await` 其实是 **Generator（生成器）和 Promise 结合的语法糖**。

### 4.1 什么是 Generator？
Generator (带 `*` 的函数) 是 JavaScript 中能够**暂停和恢复执行**的唯一内置机制。
当你调用 `yield` 时，函数交出执行权；当外部调用 `iterator.next()` 时，函数从上次暂停的地方恢复。这就是**协程 (Coroutine)** 在 JS 里的真面目。

### 4.2 Babel 是如何把 `async` 编译成 Generator 的？
一段简单的 `async` 代码：
```javascript
async function foo() {
  const a = await fetch('/api');
  console.log(a);
}
```
**编译到底层的状态机伪代码：**
```javascript
// 核心：一个自动执行 next() 的自执行器 (Runner)
function spawn(genF) {
  return new Promise(function(resolve, reject) {
    const gen = genF();
    function step(nextF) {
      let next;
      try {
        next = nextF(); // 调用 gen.next()
      } catch(e) {
        return reject(e);
      }
      if (next.done) {
        return resolve(next.value);
      }
      // 如果还没结束，把 yield 出来的值（一个 Promise）包起来
      // 等这个 Promise 解决后，递归调用 step，从而继续执行后续代码！
      Promise.resolve(next.value).then(
        (v) => step(() => gen.next(v)), 
        (e) => step(() => gen.throw(e))
      );
    }
    step(() => gen.next(undefined));
  });
}

// 你的 async 函数被编译为了普通的 Generator
function foo() {
  return spawn(function* () {
    // await 变成了 yield
    const a = yield fetch('/api'); 
    console.log(a);
  });
}
```
这彻底解释了为什么 `await` 会阻断下面的代码：因为底层的 `Runner` 强制把后面的代码塞到了前一个 Promise 的 `.then` 回调里！

---
*本文档持续更新，最后更新于 2026 年 3 月*