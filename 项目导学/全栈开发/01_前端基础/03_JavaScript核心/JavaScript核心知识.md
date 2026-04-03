# JavaScript核心知识

## 一、概述

JavaScript是Web开发的**核心语言**，2026年已成为全栈开发的必备技能。ES6+标准的引入使JavaScript具备了现代编程语言的特性，包括模块化、类、异步编程等。

**核心特性**：
- **动态类型**：运行时类型检查
- **函数式编程**：支持高阶函数、闭包
- **面向对象**：基于原型的继承
- **异步编程**：Promise、async/await
- **模块化**：ES6模块系统

---

## 二、核心概念

### 2.1 ES6+新特性

**变量声明**：
- `let`：块级作用域
- `const`：常量声明
- `var`：函数作用域（已不推荐）

**模板字符串**：
```javascript
const name = 'John';
const message = `Hello, ${name}!`;
```

**解构赋值**：
```javascript
const [a, b] = [1, 2];
const { name, age } = { name: 'John', age: 25 };
```

**默认参数**：
```javascript
function greet(name = 'Guest') {
  console.log(`Hello, ${name}!`);
}
```

**展开运算符**：
```javascript
const arr1 = [1, 2, 3];
const arr2 = [...arr1, 4, 5];
```

### 2.2 异步编程

**Promise**：
```javascript
const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('Success');
  }, 1000);
});

promise.then(result => {
  console.log(result);
}).catch(error => {
  console.error(error);
});
```

**async/await**：
```javascript
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

**事件循环**：
- **调用栈**：执行函数
- **任务队列**：宏任务（setTimeout、setInterval）
- **微任务队列**：微任务（Promise、MutationObserver）

### 2.3 模块化

**ES6模块**：
```javascript
// 导出
export const name = 'John';
export function greet() { ... }
export default function() { ... }

// 导入
import { name, greet } from './module.js';
import defaultExport from './module.js';
```

### 2.4 类

**ES6类**：
```javascript
class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }
  
  greet() {
    console.log(`Hello, I'm ${this.name}`);
  }
}

const person = new Person('John', 25);
person.greet();
```

### 2.5 闭包与原型链

**闭包**：函数记住其词法作用域的能力

**原型链**：JavaScript对象的继承机制

---

## 三、代码示例

### 3.1 ES6+新特性示例

```javascript
// 1. 变量声明对比
{
  var a = 1;    // 函数作用域
  let b = 2;    // 块级作用域
  const c = 3;  // 常量
  
  console.log(a, b, c); // 1, 2, 3
}

// 2. 模板字符串
const name = 'John';
const age = 25;
const message = `My name is ${name}, I'm ${age} years old.`;
console.log(message); // "My name is John, I'm 25 years old."

// 多行字符串
const multiline = `This is line 1
This is line 2
This is line 3`;
console.log(multiline);

// 3. 解构赋值
// 数组解构
const numbers = [1, 2, 3, 4, 5];
const [first, second, ...rest] = numbers;
console.log(first, second, rest); // 1, 2, [3, 4, 5]

// 对象解构
const person = { name: 'John', age: 25, city: 'Beijing' };
const { name: personName, age: personAge, ...other } = person;
console.log(personName, personAge, other); // John, 25, { city: 'Beijing' }

// 4. 默认参数
function greet(name = 'Guest', greeting = 'Hello') {
  return `${greeting}, ${name}!`;
}

console.log(greet()); // "Hello, Guest!"
console.log(greet('John')); // "Hello, John!"
console.log(greet('John', 'Hi')); // "Hi, John!"

// 5. 展开运算符
// 数组展开
const arr1 = [1, 2, 3];
const arr2 = [...arr1, 4, 5];
console.log(arr2); // [1, 2, 3, 4, 5]

// 对象展开
const obj1 = { a: 1, b: 2 };
const obj2 = { ...obj1, c: 3 };
console.log(obj2); // { a: 1, b: 2, c: 3 }

// 6. 箭头函数
// 传统函数
function add(a, b) {
  return a + b;
}

// 箭头函数
const addArrow = (a, b) => a + b;

// 箭头函数与this
const obj = {
  name: 'John',
  greet: function() {
    setTimeout(() => {
      console.log(`Hello, ${this.name}`); // 箭头函数继承外层this
    }, 1000);
  }
};

// 7. 模块化
// module.js
export const PI = 3.14159;
export function circleArea(radius) {
  return PI * radius * radius;
}
export default function greet(name) {
  return `Hello, ${name}!`;
}

// main.js
import greetDefault, { PI, circleArea } from './module.js';

// 8. 类
class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }
  
  greet() {
    console.log(`Hello, I'm ${this.name}`);
  }
  
  static create(name, age) {
    return new Person(name, age);
  }
}

class Student extends Person {
  constructor(name, age, grade) {
    super(name, age);
    this.grade = grade;
  }
  
  study() {
    console.log(`${this.name} is studying in grade ${this.grade}`);
  }
}

const student = Student.create('John', 20, 'Senior');
student.greet(); // "Hello, I'm John"
student.study(); // "John is studying in grade Senior"

// 9. Set和Map
// Set - 无序不重复集合
const set = new Set([1, 2, 3, 3, 4, 5]);
console.log(set); // Set {1, 2, 3, 4, 5}

set.add(6);
set.delete(3);
console.log(set.has(3)); // false
console.log(set.size); // 5

// Map - 键值对集合
const map = new Map();
map.set('name', 'John');
map.set('age', 25);
map.set({ id: 1 }, 'object key');

console.log(map.get('name')); // "John"
console.log(map.size); // 3

// 10. Proxy和Reflect
// Proxy - 对象代理
const target = { name: 'John' };
const handler = {
  get: function(obj, prop) {
    return prop in obj ? obj[prop] : 'Default';
  },
  set: function(obj, prop, value) {
    if (prop === 'age' && value < 0) {
      throw new Error('Age cannot be negative');
    }
    obj[prop] = value;
    return true;
  }
};

const proxy = new Proxy(target, handler);
console.log(proxy.age); // "Default"
proxy.age = 25;
console.log(proxy.age); // 25

// 11. 模式匹配（Stage 3提案）
// 使用switch简化条件判断
function processCommand(command) {
  switch (true) {
    case command.startsWith('hello'):
      return `Hello, ${command.slice(6)}!`;
    case command.startsWith('goodbye'):
      return `Goodbye, ${command.slice(9)}!`;
    default:
      return 'Unknown command';
  }
}

// 12. 可选链操作符
const user = {
  name: 'John',
  address: {
    city: 'Beijing'
  }
};

// 传统方式
const city1 = user && user.address && user.address.city;

// 可选链
const city2 = user?.address?.city;
console.log(city1, city2); // "Beijing", "Beijing"

// 13. 空值合并操作符
const count = null;
const count1 = count ?? 0; // 0
const count2 = count || 0; // 0 (但count为0时也返回0)

const width = 0;
const width1 = width ?? 100; // 0
const width2 = width || 100; // 100

// 14. 数值分隔符
const billion = 1_000_000_000;
const hex = 0xFF_CC_BB;
console.log(billion); // 1000000000
```

### 3.2 异步编程示例

```javascript
// 1. Promise基础
const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    const random = Math.random();
    if (random > 0.5) {
      resolve(`Success: ${random}`);
    } else {
      reject(`Error: ${random}`);
    }
  }, 1000);
});

promise
  .then(result => {
    console.log('Resolved:', result);
    return result;
  })
  .catch(error => {
    console.error('Rejected:', error);
    throw error;
  })
  .finally(() => {
    console.log('Promise completed');
  });

// 2. Promise.all - 并行执行
const promise1 = Promise.resolve('Result 1');
const promise2 = Promise.resolve('Result 2');
const promise3 = Promise.resolve('Result 3');

Promise.all([promise1, promise2, promise3])
  .then(results => {
    console.log('All promises resolved:', results);
  })
  .catch(error => {
    console.error('One promise rejected:', error);
  });

// 3. Promise.race - 竞速
const fastPromise = new Promise(resolve => setTimeout(() => resolve('Fast'), 100));
const slowPromise = new Promise(resolve => setTimeout(() => resolve('Slow'), 1000));

Promise.race([fastPromise, slowPromise])
  .then(result => {
    console.log('Race winner:', result); // "Fast"
  });

// 4. async/await
async function fetchData() {
  try {
    // 模拟API调用
    const response1 = await new Promise(resolve => 
      setTimeout(() => resolve({ data: 'Data 1' }), 500)
    );
    
    const response2 = await new Promise(resolve => 
      setTimeout(() => resolve({ data: 'Data 2' }), 300)
    );
    
    console.log('Response 1:', response1);
    console.log('Response 2:', response2);
    
    return { ...response1, ...response2 };
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

fetchData()
  .then(result => console.log('Final result:', result))
  .catch(error => console.error('Final error:', error));

// 5. 并行执行多个异步操作
async function parallelFetch() {
  const promises = [
    new Promise(resolve => setTimeout(() => resolve('Task 1'), 500)),
    new Promise(resolve => setTimeout(() => resolve('Task 2'), 300)),
    new Promise(resolve => setTimeout(() => resolve('Task 3'), 400))
  ];
  
  const results = await Promise.all(promises);
  console.log('Parallel results:', results);
}

parallelFetch();

// 6. 顺序执行多个异步操作
async function sequentialFetch() {
  const tasks = [
    () => new Promise(resolve => setTimeout(() => resolve('Task 1'), 500)),
    () => new Promise(resolve => setTimeout(() => resolve('Task 2'), 300)),
    () => new Promise(resolve => setTimeout(() => resolve('Task 3'), 400))
  ];
  
  const results = [];
  for (const task of tasks) {
    const result = await task();
    results.push(result);
  }
  
  console.log('Sequential results:', results);
}

sequentialFetch();

// 7. 实现sleep函数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function demoSleep() {
  console.log('Start');
  await sleep(1000);
  console.log('After 1 second');
  await sleep(2000);
  console.log('After 3 seconds total');
}

demoSleep();

// 8. 重试机制
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

async function unstableFetch() {
  const attempts = [];
  
  const result = await retry(async () => {
    attempts.push(1);
    const random = Math.random();
    
    if (random > 0.7) {
      return `Success on attempt ${attempts.length}`;
    } else {
      throw new Error(`Failed on attempt ${attempts.length}`);
    }
  }, 3, 100);
  
  console.log(result);
}

unstableFetch();

// 9. 限流器
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

const limiter = new RateLimiter(3, 1000);

async function testRateLimiter() {
  for (let i = 0; i < 5; i++) {
    await limiter.execute(async () => {
      console.log(`Call ${i + 1} at ${Date.now()}`);
    });
  }
}

testRateLimiter();

// 10. 中断异步操作
function createAbortController() {
  let abort = false;
  
  return {
    signal: {
      get aborted() { return abort; }
    },
    abort() {
      abort = true;
    }
  };
}

async function fetchWithAbort(url, controller) {
  const response = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      resolve({ data: 'Mock response' });
    }, 1000);
    
    if (controller.signal.aborted) {
      clearTimeout(timeout);
      reject(new Error('Aborted'));
    }
  });
  
  return response;
}

const controller = createAbortController();
fetchWithAbort('/api/data', controller)
  .then(result => console.log(result))
  .catch(error => console.error(error));

setTimeout(() => controller.abort(), 500);
```

### 3.3 闭包与原型链示例

```javascript
// 1. 闭包基础
function createCounter() {
  let count = 0; // 私有变量
  
  return {
    increment: function() {
      count++;
      return count;
    },
    decrement: function() {
      count--;
      return count;
    },
    getCount: function() {
      return count;
    }
  };
}

const counter = createCounter();
console.log(counter.increment()); // 1
console.log(counter.increment()); // 2
console.log(counter.decrement()); // 1
console.log(counter.getCount());  // 1

// 2. 闭包与事件处理
function setupButtons() {
  const buttons = document.querySelectorAll('button');
  
  buttons.forEach((button, index) => {
    button.addEventListener('click', function() {
      console.log(`Button ${index} clicked`);
    });
  });
}

// 3. 闭包与模块模式
const Module = (function() {
  // 私有变量
  let privateVar = 'private';
  
  // 私有函数
  function privateFunction() {
    console.log('Private function');
  }
  
  // 公共接口
  return {
    publicVar: 'public',
    publicFunction: function() {
      console.log('Public function');
      privateFunction();
      console.log(privateVar);
    }
  };
})();

console.log(Module.publicVar);
Module.publicFunction();

// 4. 原型链基础
function Person(name, age) {
  this.name = name;
  this.age = age;
}

Person.prototype.greet = function() {
  console.log(`Hello, I'm ${this.name}`);
};

Person.prototype.isAdult = function() {
  return this.age >= 18;
};

const person1 = new Person('John', 25);
const person2 = new Person('Jane', 16);

person1.greet(); // "Hello, I'm John"
person2.greet(); // "Hello, I'm Jane"

console.log(person1.isAdult()); // true
console.log(person2.isAdult()); // false

// 5. 原型链继承
function Animal(name) {
  this.name = name;
}

Animal.prototype.eat = function() {
  console.log(`${this.name} is eating`);
};

function Dog(name, breed) {
  Animal.call(this, name);
  this.breed = breed;
}

// 继承原型
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;

Dog.prototype.bark = function() {
  console.log(`${this.name} is barking`);
};

const dog = new Dog('Buddy', 'Golden Retriever');
dog.eat(); // "Buddy is eating"
dog.bark(); // "Buddy is barking"

// 6. ES6类继承
class Animal {
  constructor(name) {
    this.name = name;
  }
  
  eat() {
    console.log(`${this.name} is eating`);
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name);
    this.breed = breed;
  }
  
  bark() {
    console.log(`${this.name} is barking`);
  }
}

const dog2 = new Dog('Buddy', 'Golden Retriever');
dog2.eat(); // "Buddy is eating"
dog2.bark(); // "Buddy is barking"

// 7. 闭包实现记忆化
function memoize(fn) {
  const cache = {};
  
  return function(...args) {
    const key = JSON.stringify(args);
    
    if (cache[key]) {
      return cache[key];
    }
    
    const result = fn.apply(this, args);
    cache[key] = result;
    return result;
  };
}

// 计算斐波那契数列
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const memoizedFibonacci = memoize(fibonacci);

console.time('fibonacci');
console.log(memoizedFibonacci(30)); // 832040
console.timeEnd('fibonacci');

// 8. 闭包实现节流
function throttle(fn, delay) {
  let lastCall = 0;
  
  return function(...args) {
    const now = Date.now();
    
    if (now - lastCall >= delay) {
      lastCall = now;
      return fn.apply(this, args);
    }
  };
}

// 9. 闭包实现防抖
function debounce(fn, delay) {
  let timeoutId;
  
  return function(...args) {
    clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

// 10. 原型链与this
function Person(name) {
  this.name = name;
}

Person.prototype.getName = function() {
  return this.name;
};

const person = new Person('John');
console.log(person.getName()); // "John"

// 11. 闭包与this绑定
function Counter() {
  this.count = 0;
  
  this.increment = function() {
    this.count++;
    console.log(this.count);
  };
}

const counter = new Counter();
counter.increment(); // 1
counter.increment(); // 2

// 12. 闭包实现私有方法
const Module = (function() {
  // 私有方法
  function _privateMethod() {
    console.log('Private method');
  }
  
  // 公共方法
  function publicMethod() {
    console.log('Public method');
    _privateMethod();
  }
  
  return {
    publicMethod: publicMethod
  };
})();

Module.publicMethod();
```

### 3.4 模块化示例

```javascript
// 1. ES6模块 - 导出
// math.js
export const PI = 3.14159;
export const E = 2.71828;

export function add(a, b) {
  return a + b;
}

export function multiply(a, b) {
  return a * b;
}

export function circleArea(radius) {
  return PI * radius * radius;
}

export default function greet(name) {
  return `Hello, ${name}!`;
}

// 2. ES6模块 - 导入
// main.js
import greetDefault, { PI, E, circleArea } from './math.js';

console.log(greetDefault('John')); // "Hello, John!"
console.log(PI); // 3.14159
console.log(circleArea(5)); // 78.53975

// 3. 动态导入
async function loadModule() {
  const module = await import('./math.js');
  console.log(module.PI);
  console.log(module.circleArea(10));
}

loadModule();

// 4. CommonJS模块
// module.cjs
const privateVar = 'private';

function privateFunction() {
  console.log('Private function');
}

function publicFunction() {
  console.log('Public function');
  privateFunction();
}

module.exports = {
  publicFunction: publicFunction
};

// 5. AMD模块
// define(['dependency'], function(dependency) {
//   function moduleFunction() {
//     console.log('Module function');
//   }
//   
//   return {
//     moduleFunction: moduleFunction
//   };
// });

// 6. 模块封装模式
const Utils = (function() {
  // 私有变量
  const version = '1.0.0';
  
  // 私有函数
  function formatDate(date) {
    return date.toISOString().split('T')[0];
  }
  
  // 公共函数
  function debounce(fn, delay) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  }
  
  function throttle(fn, delay) {
    let lastCall = 0;
    return function(...args) {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        return fn.apply(this, args);
      }
    };
  }
  
  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
  
  // 公共接口
  return {
    version: version,
    debounce: debounce,
    throttle: throttle,
    deepClone: deepClone
  };
})();

console.log(Utils.version); // "1.0.0"
console.log(Utils.formatDate(new Date())); // 2026-03-14

// 7. 模块依赖管理
// dependency.js
export function dependencyFunction() {
  console.log('Dependency function');
}

// main.js
import { dependencyFunction } from './dependency.js';

export function mainFunction() {
  console.log('Main function');
  dependencyFunction();
}

// 8. 模块热替换（HMR）
// 仅在开发环境中
if (module.hot) {
  module.hot.accept('./math.js', () => {
    console.log('Module updated');
  });
}

// 9. 模块命名空间
import * as MathModule from './math.js';

console.log(MathModule.PI);
console.log(MathModule.circleArea(5));
MathModule.default('John');

// 10. 模块副作用
// side-effect.js
console.log('Module loaded');

export function sideEffectFunction() {
  console.log('Side effect function');
}

// 11. 模块循环依赖
// a.js
import { bFunction } from './b.js';
export function aFunction() {
  console.log('A function');
  bFunction();
}

// b.js
import { aFunction } from './a.js';
export function bFunction() {
  console.log('B function');
  aFunction();
}

// 12. 模块树摇（Tree Shaking）
// 只导出使用的函数
export function usedFunction() {
  console.log('Used function');
}

export function unusedFunction() {
  console.log('Unused function');
}
```

---

## 四、最佳实践

### 4.1 变量声明

1. **使用const和let**：避免使用var
2. **const优先**：默认使用const，需要修改时使用let
3. **块级作用域**：利用块级作用域避免变量污染

### 4.2 异步编程

1. **使用async/await**：比Promise更易读
2. **错误处理**：使用try-catch处理异步错误
3. **并行执行**：使用Promise.all并行执行独立的异步操作
4. **超时控制**：为异步操作设置超时

### 4.3 模块化

1. **使用ES6模块**：标准的模块系统
2. **按需导入**：只导入需要的模块
3. **避免循环依赖**：重新设计模块结构
4. **模块职责单一**：每个模块只负责一个功能

### 4.4 代码质量

1. **使用TypeScript**：类型检查提升代码质量
2. **代码规范**：使用ESLint和Prettier
3. **单元测试**：使用Jest或Mocha
4. **文档注释**：使用JSDoc

---

## 五、常见问题

### 5.1 var、let、const的区别

**问题**：三种变量声明方式有什么区别？

**解决方案**：
- `var`：函数作用域，存在变量提升
- `let`：块级作用域，不存在变量提升
- `const`：块级作用域，常量，必须初始化

### 5.2 Promise与async/await的区别

**问题**：两种异步编程方式有什么区别？

**解决方案**：
- `Promise`：基于回调的异步处理
- `async/await`：基于Promise的语法糖，更易读

### 5.3 闭包的内存泄漏

**问题**：闭包可能导致内存泄漏？

**解决方案**：
- 及时清理不再使用的闭包
- 避免在闭包中引用大型对象
- 使用弱引用（WeakMap、WeakSet）

---

## 六、实战练习

### 6.1 练习1：实现Promise

**任务**：实现一个简单的Promise类，包含以下方法：
- `then`：添加成功回调
- `catch`：添加失败回调
- `finally`：添加完成回调

### 6.2 练习2：实现模块系统

**任务**：实现一个简单的模块系统，包含以下功能：
- `define`：定义模块
- `require`：导入模块
- `export`：导出模块

### 6.3 练习3：实现异步工具函数

**任务**：实现以下异步工具函数：
- `sleep`：延迟执行
- `retry`：重试机制
- `throttle`：节流
- `debounce`：防抖

---

## 七、总结

JavaScript是Web开发的核心语言，掌握其核心知识至关重要：

1. **ES6+新特性**：现代JavaScript的必备技能
2. **异步编程**：处理异步操作的核心能力
3. **模块化**：组织代码的最佳实践
4. **闭包与原型链**：理解JavaScript本质

掌握这些知识，为构建复杂Web应用打下坚实基础。

---

## 八、深入原理分析

### 8.1 JavaScript引擎工作原理（V8引擎深度解析）

现代JavaScript引擎（如V8）采用JIT（即时编译）技术，将JavaScript编译为机器码执行：

```
JavaScript执行流程（V8引擎）：

┌─────────────────────────────────────────────────────┐
│                   源代码 (Source Code)               │
└─────────────────────────┬───────────────────────────┘
                          ↓ 解析
┌─────────────────────────────────────────────────────┐
│               抽象语法树 (AST)                        │
└─────────────────────────┬───────────────────────────┘
                          ↓ Ignition（解释器）
┌─────────────────────────────────────────────────────┐
│           字节码 (Bytecode) ←→ 监视器 (Profiler)      │
└─────────────────────────┬───────────────────────────┘
                          ↓ 热函数检测
┌─────────────────────────────────────────────────────┐
│              TurboFan（优化编译器）                    │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  │
│  │ TurboFan  │  │TurboFan    │  │TurboFan    │  │
│  │ 优化编译   │→ │ 去优化     │→ │ 重新优化    │  │
│  │ (热函数)   │  │ (类型变化)  │  │ (新类型)    │  │
│  └────────────┘  └────────────┘  └────────────┘  │
└─────────────────────────┬───────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│                  优化后的机器码                       │
└─────────────────────────────────────────────────────┘
```

**V8的隐藏类（Hidden Classes）机制**：

```javascript
// V8为对象创建隐藏类以优化属性访问
const person = { name: '张三', age: 25 };
// V8创建隐藏类 C0: { name: @offset0, age: @offset1 }

// 添加属性顺序影响隐藏类
const obj1 = {};
obj1.x = 1;  // 隐藏类 C0: { x: @offset0 }
obj1.y = 2;  // 隐藏类 C1: { x: @offset0, y: @offset1 }

const obj2 = {};
obj2.y = 2;  // 隐藏类 D0: { y: @offset0 }
obj2.x = 1;  // 隐藏类 D1: { y: @offset0, x: @offset1 }

// obj1和obj2有不同的隐藏类！属性访问无法被优化
// ✅ 正确做法：始终按相同顺序初始化属性
function Point(x, y) {
  this.x = x;
  this.y = y; // 保持相同顺序
}
```

### 8.2 事件循环与任务调度机制

JavaScript的事件循环是单线程的，通过任务队列协调执行：

```
事件循环执行模型：

调用栈 (Call Stack)
┌─────────────────────┐
│  当前执行上下文      │ ← 执行中
└─────────────────────┘

微任务队列 (Microtask Queue)
┌─────────────────────┐
│ Promise.then        │ ← 本轮执行完立即处理
│ queueMicrotask      │
│ MutationObserver    │
└─────────────────────┘

宏任务队列 (Macrotask Queue)
┌─────────────────────┐
│ setTimeout          │ ← 每轮事件循环处理一个
│ setInterval         │
│ I/O操作             │
│ UI渲染              │
│ setImmediate        │
└─────────────────────┘

执行顺序：
1. 执行调用栈中所有同步代码
2. 执行完调用栈后，执行所有微任务（清空队列）
3. 从宏任务队列取出一个任务执行
4. 重复第1步
```

**实战示例：事件循环的坑**：

```javascript
// 示例1：微任务优先于宏任务
console.log('1 - 同步开始');  // 同步

setTimeout(() => console.log('2 - setTimeout'), 0);  // 宏任务

Promise.resolve()
  .then(() => console.log('3 - Promise.then'))  // 微任务
  .then(() => console.log('4 - Promise.then2'));

console.log('5 - 同步结束');  // 同步

// 输出顺序：1 → 5 → 3 → 4 → 2

// 示例2：async/await的微任务特性
async function asyncExample() {
  console.log('1');  // 同步
  await Promise.resolve();
  console.log('2');  // 微任务（await后的代码）
  await Promise.resolve();
  console.log('3');  // 微任务
  setTimeout(() => console.log('4'), 0);  // 宏任务
  console.log('5');  // 同步
}

asyncExample();
console.log('6');  // 同步

// 输出：1 → 6 → 2 → 3 → 5 → 4

// 示例3：Node.js中的setImmediate vs setTimeout
setImmediate(() => console.log('setImmediate'));  // I/O回调后立即执行
setTimeout(() => console.log('setTimeout'), 0);   // 定时器回调

// 在Node.js中，setImmediate通常在setTimeout之前执行（在I/O回调内）
// 但在浏览器中两者顺序取决于当前执行阶段
```

### 8.3 内存管理与垃圾回收

JavaScript使用自动垃圾回收，但理解其机制对性能优化至关重要：

```javascript
// 内存泄漏的常见原因

// 1. 全局变量（永不回收）
function leak() {
  // 不使用var/let/const，变量成为window属性
  leakedVar = '永远不会被回收'; // ❌
}

// 2. 闭包引用外部变量
function createLeak() {
  const bigData = new Array(1000000).fill('x'); // 占用大量内存

  return function() {
    // bigData被闭包引用，即使createLeak执行完也无法回收
    console.log(bigData.length);
  };
}
const leaked = createLeak(); // bigData永远不会被回收

// 修复：及时释放引用
function createFixed() {
  const bigData = new Array(1000000).fill('x');

  return function() {
    console.log(bigData.length);
    // 用完后手动释放
    arguments.callee = null; // 解除引用
  };
}

// 3. 定时器未清理
function badPattern() {
  setInterval(() => {
    // 持续引用DOM元素
    document.getElementById('target').textContent = Date.now();
  }, 100);
  // ❌ 从未clearInterval，元素和回调都无法回收
}

// ✅ 正确做法：组件卸载时清理
function goodPattern() {
  const intervalId = setInterval(() => {
    document.getElementById('target').textContent = Date.now();
  }, 100);

  // 组件卸载时清理
  return () => clearInterval(intervalId);
}

// 4. DOM引用
const elements = {};
function badDOMReference() {
  const div = document.createElement('div');
  div.id = 'temp';
  document.body.appendChild(div);
  elements.temp = div; // DOM引用在elements中
}
function cleanup() {
  elements.temp?.remove();
  delete elements.temp; // 手动删除引用
}

// 5. WeakMap/WeakSet避免内存泄漏
const cache = new WeakMap();

function process(obj) {
  if (!cache.has(obj)) {
    const result = heavyComputation(obj);
    cache.set(obj, result); // obj被回收时，缓存项自动消失
  }
  return cache.get(obj);
}
```

### 8.4 原型链与继承机制

JavaScript的继承基于原型链，每个对象都有一个指向其原型对象的内部属性`[[Prototype]]`：

```
原型链结构示意：

实例对象 (obj)
┌──────────────────────────┐
│ [[Prototype]] ───────────┼──→ 原型对象 A (A.prototype)
└──────────────────────────┘        │ [[Prototype]] ───→ 原型对象 B (B.prototype)
                                  │ [[Prototype]] ───→ 原型对象 C (Object.prototype)
                                  │ [[Prototype]] ───→ null（原型链终点）

继承查找路径：
obj.name
  ↓ 检查自身属性
  → 原型 A.name（继承）
  → 原型 B.name（继承）
  → 原型 C.name（Object.prototype）
  → undefined
```

**ES5 vs ES6 继承对比**：

```javascript
// ES5 构造函数继承
function Animal(name) {
  this.name = name;
}
Animal.prototype.speak = function() {
  console.log(`${this.name} makes a sound`);
};

function Dog(name, breed) {
  Animal.call(this, name); // 借用构造函数继承实例属性
  this.breed = breed;
}

// 原型链继承
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog; // 修正constructor指向

Dog.prototype.speak = function() {
  console.log(`${this.name} barks`);
};

Dog.prototype.fetch = function() {
  console.log(`${this.name} fetches the ball`);
};

// ES6 类继承（语法糖）
class Animal {
  constructor(name) {
    this.name = name;
  }

  speak() {
    console.log(`${this.name} makes a sound`);
  }

  static create(name) {
    return new Animal(name);
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name); // 调用父类构造函数
    this.breed = breed;
  }

  speak() {
    super.speak(); // 调用父类方法
    console.log(`${this.name} barks`);
  }

  fetch() {
    console.log(`${this.name} fetches the ball`);
  }
}
```

---

## 九、常见面试题详解

### 9.1 JavaScript中this的指向规则是什么？

**参考答案**：

| 调用方式 | this指向 | 示例 |
|----------|----------|------|
| 普通函数调用 | 全局对象（严格模式为undefined） | `fn()` → window/undefined |
| 方法调用 | 调用该方法的对象 | `obj.fn()` → obj |
| 构造函数调用 | 新创建实例 | `new Fn()` → instance |
| 箭头函数 | 继承外层函数的this | `() => {}` → 外层this |
| call/apply/bind | 第一个参数 | `fn.call(obj)` → obj |
| DOM事件处理 | 绑定事件的元素 | `el.onclick = fn` → el |

**详解**：

```javascript
// 1. 默认绑定（普通函数调用）
function showThis() {
  console.log(this);
}
showThis(); // 浏览器中: window, 严格模式: undefined

// 2. 隐式绑定（方法调用）
const person = {
  name: '张三',
  showThis() {
    console.log(this);
  }
};
person.showThis(); // person对象

// 3. 显式绑定（call/apply/bind）
function greet(phrase) {
  console.log(`${phrase}, I'm ${this.name}`);
}
const obj = { name: '李四' };
greet.call(obj, 'Hello');     // 立即调用，参数逐个传递
greet.apply(obj, ['Hi']);     // 立即调用，参数以数组传递
const boundGreet = greet.bind(obj, 'Hey'); // 返回新函数，不立即调用
boundGreet();

// 4. 箭头函数（不绑定this）
const counter = {
  count: 0,
  // ❌ 错误：setTimeout的普通函数this指向window
  badIncrement() {
    setTimeout(function() {
      this.count++; // window.count++
    }, 1000);
  },
  // ✅ 正确：箭头函数继承外层this
  goodIncrement() {
    setTimeout(() => {
      this.count++; // counter.count++
    }, 1000);
  }
};

// 5. new绑定（构造函数）
function Person(name) {
  this.name = name; // this指向新创建的实例
}
const p = new Person('王五'); // p.name === '王五'

// 6. 优先级：new > bind > call/apply > 隐式 > 默认
```

### 9.2 Promise、async/await、Generator的区别与适用场景

**参考答案**：

```javascript
// 1. Promise - 异步编程的基础
const promise = new Promise((resolve, reject) => {
  setTimeout(() => resolve('data'), 1000);
});

promise
  .then(data => console.log(data))
  .catch(err => console.error(err))
  .finally(() => console.log('完成'));

// 2. async/await - Promise的语法糖，更易读
async function fetchUser(id) {
  try {
    const response = await fetch(`/api/users/${id}`);
    const user = await response.json();
    return user;
  } catch (error) {
    console.error('获取用户失败', error);
    throw error;
  }
}

// 3. Generator - 可暂停的函数，用于迭代器
function* numberGenerator() {
  yield 1;
  yield 2;
  yield 3;
  return 4;
}

const gen = numberGenerator();
console.log(gen.next()); // { value: 1, done: false }
console.log(gen.next()); // { value: 2, done: false }
console.log(gen.next()); // { value: 3, done: false }
console.log(gen.next()); // { value: 4, done: true }

// Generator的实际应用：状态机
function* stateMachine() {
  let state = 'idle';
  while (true) {
    const action = yield state;
    switch (action) {
      case 'start': state = 'running'; break;
      case 'stop': state = 'idle'; break;
      case 'pause': state = 'paused'; break;
    }
  }
}
```

**适用场景对比**：

| 场景 | 推荐方式 | 原因 |
|------|----------|------|
| 简单的异步链式调用 | Promise | 直观，不需要async语法 |
| 复杂异步逻辑 | async/await | 代码结构清晰，便于调试 |
| 分步流程控制 | async/await + 循环 | 比Promise.all更可控 |
| 并行无依赖请求 | Promise.all | 提高性能 |
| 生成器模式/迭代器 | Generator | 可暂停函数是独特能力 |
| 处理流式数据 | Generator + async | 支持惰性求值 |

### 9.3 深拷贝与浅拷贝的区别及实现

**参考答案**：

```javascript
// 浅拷贝：只复制第一层，嵌套对象共享引用
const shallowCopy = { ...original };       // 对象展开
const shallowCopy2 = Object.assign({}, original); // Object.assign
const shallowCopy3 = original.slice();    // 数组

// 深拷贝：递归复制所有层级

// 方案1：JSON序列化（简单但有局限）
const deepCopy1 = JSON.parse(JSON.stringify(original));
// 局限：无法拷贝函数、Symbol、undefined、正则、Date对象

// 方案2：递归实现
function deepClone(obj, hash = new WeakMap()) {
  // 处理null
  if (obj === null) return null;

  // 处理原始类型（直接返回）
  if (typeof obj !== 'object') return obj;

  // 处理Date
  if (obj instanceof Date) return new Date(obj.getTime());

  // 处理RegExp
  if (obj instanceof RegExp) return new RegExp(obj.source, obj.flags);

  // 处理循环引用
  if (hash.has(obj)) return hash.get(obj);

  // 处理数组/对象
  const clone = Array.isArray(obj) ? [] : {};
  hash.set(obj, clone);

  for (const key of Object.keys(obj)) {
    clone[key] = deepClone(obj[key], hash);
  }

  return clone;
}

// 方案3：Structured Clone（现代浏览器/Node.js原生）
const deepCopy3 = structuredClone(original);
// 支持：Date, RegExp, Map, Set, TypedArray, Blob等
// 不支持：函数、Symbol（会跳过）、Error（部分支持）

// 方案4：lodash的cloneDeep
// import { cloneDeep } from 'lodash';
// const deepCopy4 = cloneDeep(original);
```

### 9.4 事件委托（Event Delegation）原理与实践

**参考答案**：

```javascript
// 事件委托：将事件监听器绑定到父元素，利用冒泡机制处理子元素事件

// ❌ 低效：为每个li单独绑定事件
document.querySelectorAll('li').forEach(li => {
  li.addEventListener('click', handleClick);
});

// ✅ 高效：事件委托，绑定一个监听器处理所有li
document.querySelector('ul').addEventListener('click', event => {
  // 检查事件源是否为li
  if (event.target.tagName === 'LI') {
    // 处理点击
    const id = event.target.dataset.id;
    handleClick(id, event.target.textContent);
  }
});

// 实战：动态列表的事件委托
class TodoList {
  constructor(container) {
    this.container = container;
    this.todos = [];

    // 绑定事件委托
    this.container.addEventListener('click', e => {
      const target = e.target;
      const todoItem = target.closest('.todo-item');

      if (!todoItem) return;

      const id = todoItem.dataset.id;

      // 删除按钮
      if (target.classList.contains('todo-delete')) {
        this.deleteTodo(id);
      }

      // 完成按钮
      if (target.classList.contains('todo-complete')) {
        this.toggleComplete(id);
      }

      // 编辑按钮
      if (target.classList.contains('todo-edit')) {
        this.startEdit(id);
      }
    });

    // 动态内容使用事件委托，无需为新增元素重新绑定
    document.getElementById('addBtn').addEventListener('click', () => {
      this.addTodo({ text: '新待办', completed: false });
    });
  }

  addTodo(todo) {
    this.todos.push(todo);
    this.render();
  }

  deleteTodo(id) {
    this.todos = this.todos.filter(t => t.id !== id);
    this.render();
  }

  toggleComplete(id) {
    const todo = this.todos.find(t => t.id === id);
    if (todo) todo.completed = !todo.completed;
    this.render();
  }

  render() {
    // 渲染逻辑...
  }
}
```

### 9.5 JavaScript模块化演进史

**参考答案**：

```javascript
// 1. 全局变量（IIFE模式）- 早期
(function(global) {
  const privateVar = '私有变量';

  function privateFn() {
    console.log('私有方法');
  }

  global.MyModule = {
    publicApi: function() {
      privateFn();
      console.log(privateVar);
    }
  };
})(window);

// 2. CommonJS - Node.js标准（同步加载）
// module-a.js
const dep = require('./dep');
module.exports = { value: dep.value * 2 };

// main.js
const moduleA = require('./module-a');

// 3. AMD - 异步模块定义（浏览器异步加载）
// define(['./dep'], function(dep) {
//   return { value: dep.value * 2 };
// });

// 4. CMD - 同步模块定义（Sea.js）
// define(function(require, exports, module) {
//   const dep = require('./dep');
//   module.exports = { value: dep.value * 2 };
// });

// 5. ES6模块（推荐）
// math.js
export const PI = 3.14159;
export function add(a, b) { return a + b; }
export default class Calculator { /* ... */ }

// main.js
import Calculator, { PI, add } from './math.js';
// 或
import * as math from './math.js';

// 6. ES6模块特性
// 静态分析：import必须位于模块顶层（不能条件导入）
// 单例：模块只执行一次，后续导入共享实例
// 实时绑定：导出值的变化可被导入方感知

// counter.js
export let count = 0;
export function increment() { count++; }

// main.js
import { count, increment } from './counter.js';
console.log(count); // 0
increment();
console.log(count); // 1（实时绑定）
```

---

## 十、扩展知识：2026年JavaScript新特性

### 10.1 ECMAScript 2024-2026重要提案

| 特性 | 状态 | 说明 |
|------|------|------|
| Array grouping | ES2024 | `Object.groupBy()`, `Map.groupBy()` |
| Promise.withResolvers | ES2024 | `Promise.withResolvers()` 替代deferred模式 |
| Import Attributes | ES2024 | `import with {}` 导入断言 |
| Decorators | Stage 3 | 类和方法的装饰器语法 |
| Temporal API | Stage 3 | 原生日期时间API（替代Date） |
| Records & Tuples | Stage 2 | 不可变数据结构 |
| Pipeline Operator | Stage 2 | `\|>` 管道操作符 |

**Array Grouping实战**：

```javascript
// 旧写法
const grouped = products.reduce((acc, product) => {
  const category = product.category;
  acc[category] = acc[category] || [];
  acc[category].push(product);
  return acc;
}, {});

// ES2024新写法
const grouped = Object.groupBy(products, product => product.category);

// Map版本（当键非字符串时）
const grouped = Map.groupBy(products, product => product.id);
```

**Promise.withResolvers实战**：

```javascript
// 旧写法（Deferred模式）
function fetchWithTimeout(url, timeout) {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  const timer = setTimeout(() => reject(new Error('Timeout')), timeout);

  fetch(url)
    .then(res => {
      clearTimeout(timer);
      resolve(res);
    })
    .catch(reject);

  return promise;
}

// ES2024新写法
function fetchWithTimeout(url, timeout) {
  const { promise, resolve, reject } = Promise.withResolvers();

  const timer = setTimeout(() => reject(new Error('Timeout')), timeout);

  fetch(url)
    .then(res => {
      clearTimeout(timer);
      resolve(res);
    })
    .catch(reject);

  return promise;
}
```

### 10.2 Temporal API（日期时间的新标准）

```javascript
// Temporal是JavaScript新的日期时间API，解决Date的所有问题
// 注意：目前处于Stage 3，需要polyfill使用

// 基础类型
const now = Temporal.Now.instant();    // 当前时刻
const date = Temporal.PlainDate.from('2026-03-18'); // 日期（无时区）
const time = Temporal.PlainTime.from('14:30:00');   // 时间（无时区）
const datetime = Temporal.PlainDateTime.from({
  year: 2026, month: 3, day: 18, hour: 14, minute: 30
});

// 带时区的日期时间
const zoned = Temporal.ZonedDateTime.from({
  year: 2026, month: 3, day: 18, hour: 14, minute: 30,
  timeZone: 'Asia/Shanghai'
});

// 计算和比较
const tomorrow = date.add({ days: 1 });
const lastWeek = date.subtract({ weeks: 1 });
const duration = date.since(date.subtract({ days: 5 }));

if (date.equals(tomorrow)) {
  console.log('是同一天');
}

// 格式化
const formatter = new Temporal.PlainDateTimeFormat('zh-CN', {
  year: 'numeric', month: 'long', day: 'numeric'
});
console.log(formatter.format(datetime));
```

### 10.3 装饰器（Decorators）实战

```javascript
// 装饰器是Stage 3提案，修改类和方法的行为
// 需要启用实验性支持：tsconfig.json中 "experimentalDecorators": true

// 类装饰器
function sealed(target) {
  Object.seal(target);
  Object.seal(target.prototype);
}

// 方法装饰器
function log(target, methodName, descriptor) {
  const original = descriptor.value;

  descriptor.value = function(...args) {
    console.log(`调用 ${methodName}，参数:`, args);
    const result = original.apply(this, args);
    console.log(`${methodName} 返回:`, result);
    return result;
  };

  return descriptor;
}

// 参数装饰器
function validate(target, methodName, paramIndex) {
  // 参数验证逻辑
}

// 属性装饰器
function readonly(target, name, descriptor) {
  descriptor.writable = false;
  return descriptor;
}

// 使用装饰器
class Calculator {
  @log
  @readonly
  add(a, b) {
    return a + b;
  }

  @log
  divide(a, b) {
    if (b === 0) throw new Error('除数不能为零');
    return a / b;
  }
}
```

---

*参考资料: MDN Web Docs, ECMAScript标准, V8引擎文档*
*本文档最后更新于 2026年3月*
