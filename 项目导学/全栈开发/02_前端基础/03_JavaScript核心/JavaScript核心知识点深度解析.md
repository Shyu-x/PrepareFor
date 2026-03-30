# JavaScript核心知识点深度解析（2026版）

> **本文档全面覆盖JavaScript核心知识点：事件委托、this绑定、代码输出顺序、Map/Set数据结构、箭头函数等底层原理与最佳实践**

---

## 目录

- [1. 事件委托（Event Delegation）](#1-事件委托event-delegation)
  - [1.1 事件委托原理](#11-事件委托原理)
  - [1.2 事件冒泡与捕获](#12-事件冒泡与捕获)
  - [1.3 事件委托性能优势](#13-事件委托性能优势)
  - [1.4 事件委托最佳实践](#14-事件委托最佳实践)
  - [1.5 事件委托实战案例](#15-事件委托实战案例)
- [2. this绑定机制](#2-this绑定机制)
  - [2.1 this的四种绑定规则](#21-this的四种绑定规则)
  - [2.2 箭头函数的this特性](#22-箭头函数的this特性)
  - [2.3 this绑定优先级](#23-this绑定优先级)
  - [2.4 this绑定的边界情况](#24-this绑定的边界情况)
  - [2.5 this绑定实战技巧](#25-this绑定实战技巧)
- [3. 代码输出顺序题](#3-代码输出顺序题)
  - [3.1 事件循环机制](#31-事件循环机制)
  - [3.2 宏任务与微任务](#32-宏任务与微任务)
  - [3.3 async/await原理](#33-asyncawait原理)
  - [3.4 Promise执行顺序](#34-promise执行顺序)
  - [3.5 复杂异步代码分析](#35-复杂异步代码分析)
- [4. Map和Set数据结构](#4-map和set数据结构)
  - [4.1 Map底层实现](#41-map底层实现)
  - [4.2 Set底层实现](#42-set底层实现)
  - [4.3 Map/Set与Object对比](#43-mapset与object对比)
  - [4.4 Map/Set性能优势](#44-mapset性能优势)
  - [4.5 WeakMap和WeakSet](#45-weakmap和weakset)
- [5. 箭头函数](#5-箭头函数)
  - [5.1 箭头函数与普通函数区别](#51-箭头函数与普通函数区别)
  - [5.2 箭头函数的this绑定](#52-箭头函数的this绑定)
  - [5.3 箭头函数的arguments](#53-箭头函数的arguments)
  - [5.4 箭头函数使用场景](#54-箭头函数使用场景)
  - [5.5 箭头函数的限制](#55-箭头函数的限制)
- [6. JavaScript八股文面试题](#6-javascript八股文面试题)
  - [6.1 var/let/const区别](#61-varletconst区别)
  - [6.2 闭包原理与应用](#62-闭包原理与应用)
  - [6.3 原型链与继承](#63-原型链与继承)
  - [6.4 深浅拷贝](#64-深浅拷贝)
  - [6.5 防抖与节流](#65-防抖与节流)
  - [6.6 模块化](#66-模块化)
  - [6.7 ES6+新特性](#67-es6新特性)
  - [6.8 Proxy和Reflect](#68-proxy和reflect)
  - [6.9 Generator和Iterator](#69-generator和iterator)
  - [6.10 Symbol和BigInt](#610-symbol和bigint)
- [7. 经典面试真题](#7-经典面试真题)
  - [7.1 基础题](#71-基础题)
  - [7.2 进阶题](#72-进阶题)
  - [7.3 复杂题](#73-复杂题)

---

## 6. JavaScript八股文面试题

### 6.1 var/let/const区别

**考察频率**：⭐⭐⭐⭐⭐（100%面试必问）

**核心知识点**：

```javascript
// var 声明
function testVar() {
    if (true) {
        var x = 10;
    }
    console.log(x); // 10 - var 没有块级作用域
}

// let 声明
function testLet() {
    if (true) {
        let a = 10;
    }
    // console.log(a); // ReferenceError - 块级作用域
}

// const 声明
const PI = 3.14159;
const obj = { name: '张三' };
obj.name = '李四'; // 允许 - 修改属性
// obj = {}; // TypeError - 不能重新赋值

// 三者对比表
/*
| 特性 | var | let | const |
|------|-----|-----|-------|
| 作用域 | 函数作用域 | 块级作用域 | 块级作用域 |
| 提升 | 会提升（hoisting） | 会提升但有TDZ | 会提升但有TDZ |
| 重复声明 | 允许 | 不允许 | 不允许 |
| 初始化 | 可不初始化 | 可不初始化 | 必须初始化 |
| 可变性 | 可变 | 可变 | 不可重新赋值 |
*/
```

**经典面试题**：

```javascript
// 面试题1：var的提升问题
console.log(y); // undefined
var y = 5;

// 面试题2：循环中的var问题
for (var i = 0; i < 3; i++) {
    setTimeout(() => console.log(i), 100);
}
// 输出：3, 3, 3

// 面试题3：let的TDZ问题
// console.log(b); // ReferenceError
let b = 5;

// 面试题4：const对象的可变性
const frozen = Object.freeze({ name: '张三' });
// frozen.name = '李四'; // TypeError (严格模式)
```

**最佳实践**：
- 默认使用 `const`
- 需要重新赋值时使用 `let`
- 避免使用 `var`

### 6.2 闭包原理与应用

**考察频率**：⭐⭐⭐⭐⭐（95%面试会问）

**核心原理**：

```javascript
// 闭包基础
function createCounter() {
    let count = 0; // 私有变量

    return function() { // 闭包
        count++;
        return count;
    };
}

const counter = createCounter();
console.log(counter()); // 1
console.log(counter()); // 2

// 闭包的应用场景
// 1. 数据封装和私有变量
function createPerson(name) {
    let _name = name; // 私有变量

    return {
        getName() {
            return _name;
        },
        setName(newName) {
            _name = newName;
        }
    };
}

// 2. 函数柯里化
function curriedAdd(a) {
    return function(b) {
        return a + b;
    };
}

const add5 = curriedAdd(5);
console.log(add5(3)); // 8

// 3. 记忆化函数
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

// 4. 节流和防抖
function throttle(fn, delay) {
    let lastCall = 0;
    return function(...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            fn.apply(this, args);
        }
    };
}

function debounce(fn, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            fn.apply(this, args);
        }, delay);
    };
}
```

**经典面试题**：

```javascript
// 面试题1：循环中的闭包
for (var i = 0; i < 3; i++) {
    setTimeout(() => console.log(i), 100);
}
// 输出：3, 3, 3

// 解决方案1：使用 let
for (let i = 0; i < 3; i++) {
    setTimeout(() => console.log(i), 100);
}
// 输出：0, 1, 2

// 解决方案2：使用 IIFE
for (var i = 0; i < 3; i++) {
    ((j) => {
        setTimeout(() => console.log(j), 100);
    })(i);
}
// 输出：0, 1, 2
```

**内存泄漏风险**：
```javascript
// ❌ 危险：闭包导致内存泄漏
function setupEventListeners() {
    const element = document.getElementById('button');
    const largeData = { /* 大量数据 */ };

    element.addEventListener('click', function handler() {
        // 闭包捕获了 largeData，即使不需要也会一直占用内存
        console.log(largeData);
    });
}

// ✅ 正确：只捕获需要的数据
function setupEventListeners() {
    const element = document.getElementById('button');
    const largeData = { /* 大量数据 */ };

    element.addEventListener('click', function handler() {
        // 只使用需要的数据
        const neededData = largeData.needed;
        console.log(neededData);
    });

    // 清理不需要的数据
    largeData = null;
}
```

### 6.3 原型链与继承

**考察频率**：⭐⭐⭐⭐（90%面试会问）

**核心概念**：

```javascript
// prototype 属性
function Person(name, age) {
    this.name = name;
    this.age = age;
}

Person.prototype.greet = function() {
    return `Hello, I'm ${this.name}`;
};

const person = new Person('张三', 25);
console.log(person.greet()); // "Hello, I'm 张三"

// 原型链结构
// object -> Object.prototype -> null
// array -> Array.prototype -> Object.prototype -> null

// 原型链继承
function Animal(name) {
    this.name = name;
}

Animal.prototype.speak = function() {
    return `${this.name} makes a sound`;
};

function Dog(name, breed) {
    Animal.call(this, name);
    this.breed = breed;
}

Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;

Dog.prototype.speak = function() {
    return `${this.name} barks`;
};

const dog = new Dog('旺财', '金毛');
console.log(dog.speak()); // "旺财 barks"
```

**经典面试题**：

```javascript
// 面试题1：new操作符做了什么？
function myNew(Constructor, ...args) {
    const obj = Object.create(Constructor.prototype);
    const result = Constructor.apply(obj, args);
    return result instanceof Object ? result : obj;
}

// 面试题2：instanceof的实现
function myInstanceof(left, right) {
    let proto = Object.getPrototypeOf(left);
    while (true) {
        if (proto === null) return false;
        if (proto === right.prototype) return true;
        proto = Object.getPrototypeOf(proto);
    }
}

// 面试题3：原型链查找
const arr = [1, 2, 3];
console.log(arr.hasOwnProperty('length')); // true
console.log(arr.hasOwnProperty('toString')); // false
```

### 6.4 深浅拷贝

**考察频率**：⭐⭐⭐⭐（85%面试会问）

**核心概念**：

```javascript
// 浅拷贝
const obj1 = { a: 1, b: { c: 2 } };

// 方法1：Object.assign
const obj2 = Object.assign({}, obj1);

// 方法2：展开运算符
const obj3 = { ...obj1 };

// 深拷贝
const obj4 = JSON.parse(JSON.stringify(obj1));

// 完整的深拷贝实现
function deepClone(value, visited = new WeakMap()) {
    if (value === null || typeof value !== 'object') {
        return value;
    }

    if (visited.has(value)) {
        return visited.get(value);
    }

    if (value instanceof Date) {
        return new Date(value);
    }

    if (value instanceof RegExp) {
        return new RegExp(value.source, value.flags);
    }

    if (value instanceof Map) {
        const clonedMap = new Map();
        visited.set(value, clonedMap);
        value.forEach((val, key) => {
            clonedMap.set(deepClone(key, visited), deepClone(val, visited));
        });
        return clonedMap;
    }

    if (value instanceof Set) {
        const clonedSet = new Set();
        visited.set(value, clonedSet);
        value.forEach(val => {
            clonedSet.add(deepClone(val, visited));
        });
        return clonedSet;
    }

    if (Array.isArray(value)) {
        const clonedArray = [];
        visited.set(value, clonedArray);
        for (let i = 0; i < value.length; i++) {
            clonedArray[i] = deepClone(value[i], visited);
        }
        return clonedArray;
    }

    const clonedObject = Object.create(Object.getPrototypeOf(value));
    visited.set(value, clonedObject);

    const symbolKeys = Object.getOwnPropertySymbols(value);
    for (const key of symbolKeys) {
        clonedObject[key] = deepClone(value[key], visited);
    }

    for (const key in value) {
        if (value.hasOwnProperty(key)) {
            clonedObject[key] = deepClone(value[key], visited);
        }
    }

    return clonedObject;
}
```

**经典面试题**：

```javascript
// 面试题1：浅拷贝的问题
const obj1 = { a: 1, b: { c: 2 } };
const obj2 = Object.assign({}, obj1);

obj2.b.c = 3;
console.log(obj1.b.c); // 3 - obj1也被修改了

// 面试题2：循环引用
const obj1 = { a: 1 };
obj1.self = obj1;

// ❌ JSON.parse(JSON.stringify(obj1)) 会报错
// ✅ deepClone(obj1) 可以处理循环引用
```

### 6.5 防抖与节流

**考察频率**：⭐⭐⭐⭐（80%面试会问）

**核心概念**：

```javascript
// 防抖函数
function debounce(fn, delay, options = {}) {
    let timer = null;
    let lastArgs = null;
    let lastThis = null;

    const { leading = false, trailing = true, maxWait } = options;

    function invoke() {
        if (lastArgs) {
            fn.apply(lastThis, lastArgs);
            lastArgs = null;
            lastThis = null;
        }
    }

    function debounced(...args) {
        lastArgs = args;
        lastThis = this;

        clearTimeout(timer);
        clearTimeout(maxWaitTimer);

        if (leading && !timer) {
            invoke();
        }

        timer = setTimeout(() => {
            if (trailing) {
                invoke();
            }
            timer = null;
        }, delay);

        if (maxWait && !maxWaitTimer) {
            maxWaitTimer = setTimeout(() => {
                invoke();
                maxWaitTimer = null;
            }, maxWait);
        }
    }

    debounced.cancel = function() {
        clearTimeout(timer);
        clearTimeout(maxWaitTimer);
        timer = null;
        maxWaitTimer = null;
        lastArgs = null;
        lastThis = null;
    };

    debounced.flush = function() {
        invoke();
        this.cancel();
    };

    return debounced;
}

// 节流函数
function throttle(fn, interval, options = {}) {
    let lastTime = 0;
    let timer = null;
    let lastArgs = null;
    let lastThis = null;

    const { leading = true, trailing = true } = options;

    function invoke() {
        if (lastArgs) {
            fn.apply(lastThis, lastArgs);
            lastTime = Date.now();
            lastArgs = null;
            lastThis = null;
        }
    }

    function throttled(...args) {
        const now = Date.now();

        if (!lastTime && !leading) {
            lastTime = now;
        }

        const remaining = interval - (now - lastTime);
        lastArgs = args;
        lastThis = this;

        if (remaining <= 0 || remaining > interval) {
            clearTimeout(timer);
            timer = null;
            invoke();
        }
        else if (!timer && trailing) {
            timer = setTimeout(() => {
                invoke();
                timer = null;
            }, remaining);
        }
    }

    throttled.cancel = function() {
        clearTimeout(timer);
        timer = null;
        lastTime = 0;
        lastArgs = null;
        lastThis = null;
    };

    return throttled;
}
```

**经典面试题**：

```javascript
// 面试题1：搜索输入防抖
const searchInput = document.querySelector('#search');
const debouncedSearch = debounce((query) => {
    fetch(`/api/search?q=${query}`)
        .then(res => res.json())
        .then(data => console.log(data));
}, 300);

searchInput.addEventListener('input', (e) => {
    debouncedSearch(e.target.value);
});

// 面试题2：滚动事件节流
const throttledScroll = throttle((scrollY) => {
    console.log('滚动位置:', scrollY);
}, 100);

window.addEventListener('scroll', () => {
    throttledScroll(window.scrollY);
});
```

### 6.6 模块化

**考察频率**：⭐⭐⭐⭐⭐（75%面试会问）

**核心概念**：

```javascript
// CommonJS（Node.js）
// 导出
module.exports = function() {
    return 'Hello';
};

module.exports = {
    name: 'MyModule',
    greet() {
        return 'Hello';
    }
};

// 导入
const myModule = require('./myModule');
const { greet } = require('./myModule');

// ES Modules（浏览器）
// 导出
export const name = 'MyModule';
export function greet() {
    return 'Hello';
}

export default function() {
    return 'Default';
}

// 导入
import { name, greet } from './myModule';
import myModule from './myModule';

// 动态导入
const module = await import('./myModule');
```

**经典面试题**：

```javascript
// 面试题1：CommonJS和ES Modules的区别
/*
CommonJS：
- 同步加载
- 运行时解析
- 可以修改导出值
- 不支持tree shaking

ES Modules：
- 异步加载
- 编译时解析
- 不可以修改导出值
- 支持tree shaking
*/

// 面试题2：什么是tree shaking？
// tree shaking是打包工具通过静态分析代码，移除未使用的导出，从而减小打包体积的功能。
```

### 6.7 ES6+新特性

**考察频率**：⭐⭐⭐⭐⭐（90%面试会问）

**核心概念**：

```javascript
// 1. 箭头函数
const add = (a, b) => a + b;

// 2. 解构赋值
const [a, b] = [1, 2];
const { name, age } = { name: 'John', age: 25 };

// 3. 模板字符串
const name = 'John';
const message = `Hello, ${name}!`;

// 4. 扩展运算符
const arr1 = [1, 2, 3];
const arr2 = [...arr1, 4, 5];

// 5. 默认参数
function greet(name = 'Guest') {
    return `Hello, ${name}!`;
}

// 6. let/const
let count = 0;
const PI = 3.14159;

// 7. Set和Map
const set = new Set([1, 2, 3]);
const map = new Map();

// 8. Proxy和Reflect
const proxy = new Proxy(target, handler);
Reflect.has(target, 'name');

// 9. Generator和Iterator
function* generator() {
    yield 1;
    yield 2;
}

// 10. Symbol和BigInt
const sym = Symbol('key');
const bigNum = 9007199254740991n;
```

### 6.8 Proxy和Reflect

**考察频率**：⭐⭐⭐⭐（60%面试会问）

**核心概念**：

```javascript
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

// Reflect - 对象操作的反射API
console.log(Reflect.has(target, 'name')); // true
console.log(Reflect.get(target, 'name')); // "John"
```

### 6.9 Generator和Iterator

**考察频率**：⭐⭐⭐（50%面试会问）

**核心概念**：

```javascript
// Generator函数
function* generator() {
    yield 1;
    yield 2;
    yield 3;
}

const gen = generator();
console.log(gen.next()); // { value: 1, done: false }
console.log(gen.next()); // { value: 2, done: false }
console.log(gen.next()); // { value: 3, done: false }
console.log(gen.next()); // { value: undefined, done: true }

// Iterator接口
const arr = [1, 2, 3];
const iterator = arr[Symbol.iterator]();

console.log(iterator.next()); // { value: 1, done: false }
console.log(iterator.next()); // { value: 2, done: false }
console.log(iterator.next()); // { value: 3, done: false }
```

### 6.10 Symbol和BigInt

**考察频率**：⭐⭐⭐（40%面试会问）

**核心概念**：

```javascript
// Symbol - 唯一值
const sym1 = Symbol('description');
const sym2 = Symbol('description');

console.log(sym1 === sym2); // false

// 用于对象属性
const obj = {};
const sym = Symbol('key');
obj[sym] = 'value';

console.log(obj[sym]); // "value"

// BigInt - 大整数
const bigNum1 = 9007199254740991n;
const bigNum2 = BigInt(9007199254740991);

console.log(bigNum1 + bigNum2); // 18014398509481982n
```

---

## 7. 经典面试真题

### 7.1 基础题

**题目1：var/let/const区别**

```javascript
// 面试题
for (var i = 0; i < 3; i++) {
    setTimeout(() => console.log(i), 100);
}
// 输出：3, 3, 3

// 解决方案
for (let i = 0; i < 3; i++) {
    setTimeout(() => console.log(i), 100);
}
// 输出：0, 1, 2
```

**题目2：闭包应用**

```javascript
// 面试题：实现计数器
function createCounter() {
    let count = 0;
    return {
        increment: () => count++,
        getCount: () => count
    };
}

const counter = createCounter();
counter.increment();
console.log(counter.getCount()); // 1
```

**题目3：原型链**

```javascript
// 面试题：instanceof实现
function myInstanceof(left, right) {
    let proto = Object.getPrototypeOf(left);
    while (proto) {
        if (proto === right.prototype) return true;
        proto = Object.getPrototypeOf(proto);
    }
    return false;
}
```

### 7.2 进阶题

**题目1：事件循环**

```javascript
// 面试题：输出顺序
console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve().then(() => console.log('3'));

console.log('4');

// 输出：1, 4, 3, 2
```

**题目2：深浅拷贝**

```javascript
// 面试题：实现深拷贝
function deepClone(obj, visited = new WeakMap()) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (visited.has(obj)) return visited.get(obj);
    
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof RegExp) return new RegExp(obj);
    
    const cloned = Array.isArray(obj) ? [] : {};
    visited.set(obj, cloned);
    
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            cloned[key] = deepClone(obj[key], visited);
        }
    }
    
    return cloned;
}
```

**题目3：防抖节流**

```javascript
// 面试题：实现防抖
function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// 面试题：实现节流
function throttle(fn, delay) {
    let lastTime = 0;
    return (...args) => {
        const now = Date.now();
        if (now - lastTime >= delay) {
            lastTime = now;
            fn.apply(this, args);
        }
    };
}
```

### 7.3 复杂题

**题目1：Promise.all实现**

```javascript
// 面试题：实现Promise.all
function promiseAll(promises) {
    return new Promise((resolve, reject) => {
        const results = [];
        let completed = 0;
        
        if (promises.length === 0) {
            resolve(results);
            return;
        }
        
        promises.forEach((promise, index) => {
            Promise.resolve(promise)
                .then(result => {
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
```

**题目2：async/await原理**

```javascript
// 面试题：async/await等价实现
async function fetchData() {
    const result1 = await fetch('/api/data1');
    const result2 = await fetch('/api/data2');
    return { result1, result2 };
}

// 等价于
function fetchData() {
    return fetch('/api/data1')
        .then(result1 => {
            return fetch('/api/data2')
                .then(result2 => ({ result1, result2 }));
        });
}
```

**题目3：柯里化实现**

```javascript
// 面试题：实现柯里化
function curry(fn, arity = fn.length) {
    return function curried(...args) {
        if (args.length >= arity) {
            return fn.apply(this, args);
        }
        return function(...moreArgs) {
            return curried.apply(this, [...args, ...moreArgs]);
        };
    };
}

// 使用
function add(a, b, c) {
    return a + b + c;
}

const curriedAdd = curry(add);
console.log(curriedAdd(1)(2)(3)); // 6
```

---

## 1. 事件委托（Event Delegation）

### 1.1 事件委托原理

**事件委托**是一种利用事件冒泡机制，将子元素的事件处理程序委托给父元素的技术。

```javascript
// ❌ 传统方式：为每个li添加事件监听器
const list = document.querySelector('ul');
const items = list.querySelectorAll('li');

items.forEach(item => {
  item.addEventListener('click', function() {
    console.log('点击了:', this.textContent);
  });
});
// 问题：1000个li = 1000个事件监听器，内存占用高

// ✅ 事件委托：只在ul上添加一个事件监听器
const list = document.querySelector('ul');

list.addEventListener('click', function(event) {
  // 检查事件目标是否为li
  if (event.target.tagName === 'LI') {
    console.log('点击了:', event.target.textContent);
  }
});
// 优势：1000个li = 1个事件监听器，内存占用低
```

**事件委托的核心原理**：
1. **事件冒泡**：子元素触发事件后，事件会逐级向上冒泡到父元素
2. **event.target**：通过`event.target`获取实际触发事件的元素
3. **条件判断**：通过条件判断确定是否需要处理该事件

### 1.2 事件冒泡与捕获

JavaScript事件流分为三个阶段：

```javascript
// 事件流示意图
// 1. 捕获阶段（Capture Phase）：从document → 目标元素
// 2. 目标阶段（Target Phase）：到达目标元素
// 3. 冒泡阶段（Bubbling Phase）：从目标元素 → document

<div id="outer">
  <div id="middle">
    <div id="inner">点击我</div>
  </div>
</div>

const inner = document.getElementById('inner');
const middle = document.getElementById('middle');
const outer = document.getElementById('outer');

// 捕获阶段（useCapture = true）
outer.addEventListener('click', () => console.log('outer 捕获'), true);
middle.addEventListener('click', () => console.log('middle 捕获'), true);
inner.addEventListener('click', () => console.log('inner 捕获'), true);

// 冒泡阶段（useCapture = false，默认）
inner.addEventListener('click', () => console.log('inner 冒泡'));
middle.addEventListener('click', () => console.log('middle 冒泡'));
outer.addEventListener('click', () => console.log('outer 冒泡'));

// 输出顺序：
// 1. outer 捕获
// 2. middle 捕获
// 3. inner 捕获
// 4. inner 冒泡
// 5. middle 冒泡
// 6. outer 冒泡
```

**事件委托通常使用冒泡阶段**，因为：
- 冒泡阶段更符合直觉
- 某些事件不支持捕获阶段
- 性能更好

### 1.3 事件委托性能优势

**性能对比测试**（1000个li元素）：

```javascript
// 测试代码
function testTraditional() {
  const list = document.querySelector('#list');
  const items = list.querySelectorAll('li');
  
  console.time('传统方式');
  items.forEach(item => {
    item.addEventListener('click', () => {});
  });
  console.timeEnd('传统方式');
  // 输出：传统方式: ~50ms
}

function testDelegation() {
  const list = document.querySelector('#list');
  
  console.time('事件委托');
  list.addEventListener('click', (e) => {
    if (e.target.tagName === 'LI') {
      // 处理点击
    }
  });
  console.timeEnd('事件委托');
  // 输出：事件委托: ~1ms
}
```

**性能对比表**：

| 指标 | 传统方式 | 事件委托 | 优势 |
|------|---------|---------|------|
| 事件监听器数量 | O(N) | O(1) | **1000倍** |
| 内存占用 | O(N) | O(1) | **1000倍** |
| 初始化时间 | ~50ms | ~1ms | **50倍** |
| 动态添加元素 | 需要重新绑定 | 自动支持 | **无需额外代码** |
| 删除元素 | 需要移除监听器 | 自动失效 | **无需额外代码** |

**内存占用对比**：

```javascript
// 传统方式：每个事件监听器占用约48字节
const items = document.querySelectorAll('li'); // 1000个
// 总内存：1000 × 48 = 48KB

// 事件委托：只有一个事件监听器
const list = document.querySelector('ul');
// 总内存：1 × 48 = 48字节

// 内存节省：99.9%
```

### 1.4 事件委托最佳实践

**1. 使用closest()方法**（推荐）：

```javascript
// ✅ 推荐：使用closest()方法
list.addEventListener('click', function(event) {
  const li = event.target.closest('li');
  if (li && list.contains(li)) {
    console.log('点击了:', li.textContent);
  }
});

// ❌ 不推荐：使用tagName检查
list.addEventListener('click', function(event) {
  if (event.target.tagName === 'LI') {
    console.log('点击了:', event.target.textContent);
  }
});
```

**closest()方法的优势**：
- 可以匹配任意层级的祖先元素
- 支持复杂选择器
- 性能更好

**2. 检查事件目标是否在委托元素内**：

```javascript
list.addEventListener('click', function(event) {
  // 确保事件目标在list内部
  if (list.contains(event.target)) {
    const li = event.target.closest('li');
    if (li) {
      console.log('点击了:', li.textContent);
    }
  }
});
```

**3. 防止事件冒泡到委托元素**：

```javascript
// 某些情况下需要阻止事件冒泡
list.addEventListener('click', function(event) {
  // 阻止事件继续冒泡
  event.stopPropagation();
  
  const li = event.target.closest('li');
  if (li) {
    console.log('点击了:', li.textContent);
  }
});
```

**4. 使用委托处理动态添加的元素**：

```javascript
// 动态添加元素后，事件委托自动生效
const list = document.querySelector('ul');

list.addEventListener('click', function(event) {
  const li = event.target.closest('li');
  if (li) {
    console.log('点击了:', li.textContent);
  }
});

// 动态添加新元素
const newItem = document.createElement('li');
newItem.textContent = '新元素';
list.appendChild(newItem);
// 新元素自动拥有点击事件，无需额外绑定！
```

### 1.5 事件委托实战案例

**完整TodoList实现**：

```javascript
// TodoList组件
class TodoList {
  constructor(container) {
    this.container = container;
    this.todos = [];
    this.init();
  }

  init() {
    // 使用事件委托处理所有点击事件
    this.container.addEventListener('click', (event) => {
      const li = event.target.closest('li');
      const button = event.target.closest('button');

      // 删除任务
      if (button && button.classList.contains('delete')) {
        const id = parseInt(li.dataset.id);
        this.deleteTodo(id);
      }
      // 切换完成状态
      else if (li && !button) {
        const id = parseInt(li.dataset.id);
        this.toggleTodo(id);
      }
    });

    // 处理添加任务
    this.container.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = this.container.querySelector('input');
      const text = input.value.trim();
      
      if (text) {
        this.addTodo(text);
        input.value = '';
      }
    });
  }

  addTodo(text) {
    const id = Date.now();
    this.todos.push({ id, text, completed: false });
    this.render();
  }

  deleteTodo(id) {
    this.todos = this.todos.filter(todo => todo.id !== id);
    this.render();
  }

  toggleTodo(id) {
    const todo = this.todos.find(todo => todo.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      this.render();
    }
  }

  render() {
    this.container.innerHTML = `
      <h2>TodoList</h2>
      <form>
        <input type="text" placeholder="添加新任务" />
        <button type="submit">添加</button>
      </form>
      <ul>
        ${this.todos.map(todo => `
          <li data-id="${todo.id}" class="${todo.completed ? 'completed' : ''}">
            <span>${todo.text}</span>
            <button class="delete">删除</button>
          </li>
        `).join('')}
      </ul>
    `;
  }
}

// 使用
const list = new TodoList(document.body);
```

**性能优化对比**：

```javascript
// 性能测试
function performanceTest() {
  const count = 1000;
  
  // 传统方式
  console.time('传统方式');
  const list1 = document.createElement('ul');
  for (let i = 0; i < count; i++) {
    const li = document.createElement('li');
    li.textContent = `Item ${i}`;
    li.addEventListener('click', () => console.log(i));
    list1.appendChild(li);
  }
  console.timeEnd('传统方式');
  
  // 事件委托
  console.time('事件委托');
  const list2 = document.createElement('ul');
  list2.addEventListener('click', (e) => {
    if (e.target.tagName === 'LI') {
      console.log(Array.from(e.target.parentNode.children).indexOf(e.target));
    }
  });
  for (let i = 0; i < count; i++) {
    const li = document.createElement('li');
    li.textContent = `Item ${i}`;
    list2.appendChild(li);
  }
  console.timeEnd('事件委托');
  
  // 输出：
  // 传统方式: ~50ms
  // 事件委托: ~1ms
}
```

---

## 2. this绑定机制

### 2.1 this的四种绑定规则

JavaScript中this的绑定有四种规则，优先级从高到低：

#### 1. new绑定（最高优先级）

```javascript
function Person(name) {
  this.name = name;
}

const person = new Person('张三');
console.log(person.name); // "张三"

// new绑定的过程：
// 1. 创建新对象
// 2. 将新对象的__proto__指向Person.prototype
// 3. 执行Person函数，this指向新对象
// 4. 返回新对象
```

#### 2. 显式绑定（call/apply/bind）

```javascript
function greet(greeting) {
  console.log(`${greeting}, ${this.name}`);
}

const obj = { name: '李四' };

// call：立即调用，参数逐个传递
greet.call(obj, '你好'); // "你好, 李四"

// apply：立即调用，参数以数组传递
greet.apply(obj, ['你好']); // "你好, 李四"

// bind：返回绑定后的函数，延迟调用
const boundGreet = greet.bind(obj);
boundGreet('你好'); // "你好, 李四"
```

#### 3. 隐式绑定（对象调用）

```javascript
const obj = {
  name: '王五',
  sayName: function() {
    console.log(this.name); // "王五"
  }
};

obj.sayName();

// 注意：隐式绑定会丢失
const sayName = obj.sayName;
sayName(); // "undefined"（默认绑定）
```

#### 4. 默认绑定（独立调用）

```javascript
function test() {
  console.log(this);
}

// 严格模式下
'use strict';
test(); // undefined

// 非严格模式下
test(); // window（浏览器）或 global（Node.js）
```

**绑定优先级测试**：

```javascript
function greet() {
  console.log(this.name);
}

const obj1 = { name: 'obj1' };
const obj2 = { name: 'obj2' };

// new绑定 > 显式绑定
const bound = greet.bind(obj1);
new bound(); // "undefined"（new绑定创建新对象）

// 显式绑定 > 隐式绑定
const obj3 = {
  name: 'obj3',
  greet: greet.bind(obj1)
};
obj3.greet(); // "obj1"（显式绑定优先）

// 隐式绑定 > 默认绑定
const obj4 = { name: 'obj4', greet: greet };
obj4.greet(); // "obj4"（隐式绑定优先）
```

### 2.2 箭头函数的this特性

**箭头函数没有自己的this**，它的this继承自外层作用域：

```javascript
// 普通函数
const obj1 = {
  name: '张三',
  greet: function() {
    console.log(this.name); // "张三"
  }
};

// 箭头函数
const obj2 = {
  name: '李四',
  greet: () => {
    console.log(this.name); // "undefined"（继承外层this）
  }
};

// 箭头函数嵌套普通函数
const obj3 = {
  name: '王五',
  greet: function() {
    const arrow = () => {
      console.log(this.name); // "王五"（继承greet的this）
    };
    arrow();
  }
};
```

**箭头函数this绑定时机**：

```javascript
// 箭头函数的this在定义时绑定，而不是调用时绑定
function Timer() {
  this.seconds = 0;
  
  // ❌ 错误：箭头函数的this指向Timer实例
  setInterval(() => {
    this.seconds++;
    console.log(this.seconds);
  }, 1000);
  
  // ✅ 正确：使用普通函数并手动绑定
  setInterval(function() {
    this.seconds++;
    console.log(this.seconds);
  }.bind(this), 1000);
  
  // ✅ 正确：使用变量保存this
  const self = this;
  setInterval(function() {
    self.seconds++;
    console.log(self.seconds);
  }, 1000);
}

new Timer();
```

### 2.3 this绑定优先级

**完整的this绑定优先级**：

```
1. new绑定（最高）
2. 显式绑定（call/apply/bind）
3. 隐式绑定（对象调用）
4. 默认绑定（最低）
```

**优先级测试**：

```javascript
function test() {
  console.log(this.value);
}

const obj1 = { value: 'obj1' };
const obj2 = { value: 'obj2' };

// 1. new绑定 > 显式绑定
const bound = test.bind(obj1);
new bound(); // undefined（new绑定创建新对象）

// 2. 显式绑定 > 隐式绑定
const obj3 = {
  value: 'obj3',
  test: test.bind(obj1)
};
obj3.test(); // "obj1"

// 3. 隐式绑定 > 默认绑定
const obj4 = { value: 'obj4', test: test };
obj4.test(); // "obj4"

// 4. 默认绑定
test(); // undefined（严格模式）
```

### 2.4 this绑定的边界情况

**1. 箭头函数作为构造函数**：

```javascript
const Arrow = () => {};
// Arrow.prototype === undefined

const instance = new Arrow(); // TypeError: Arrow is not a constructor
```

**2. null/undefined作为显式绑定**：

```javascript
function test() {
  console.log(this);
}

test.call(null);     // window（非严格模式）或 undefined（严格模式）
test.call(undefined); // window（非严格模式）或 undefined（严格模式）

// 使用Object()包装
test.call(Object(null)); // Object {}
```

**3. 解构赋值丢失this**：

```javascript
const obj = {
  name: '张三',
  sayName: function() {
    console.log(this.name);
  }
};

const { sayName } = obj;
sayName(); // "undefined"（丢失this绑定）

// 解决方案
const { sayName } = obj;
sayName.call(obj); // "张三"
```

**4. 回调函数中的this**：

```javascript
// ❌ 错误：回调函数丢失this
class Counter {
  constructor() {
    this.count = 0;
  }
  
  start() {
    setTimeout(function() {
      this.count++; // this指向window
      console.log(this.count);
    }, 1000);
  }
}

// ✅ 正确：使用箭头函数
class Counter {
  constructor() {
    this.count = 0;
  }
  
  start() {
    setTimeout(() => {
      this.count++; // this指向Counter实例
      console.log(this.count);
    }, 1000);
  }
}

// ✅ 正确：使用bind绑定
class Counter {
  constructor() {
    this.count = 0;
  }
  
  start() {
    setTimeout(function() {
      this.count++;
      console.log(this.count);
    }.bind(this), 1000);
  }
}
```

### 2.5 this绑定实战技巧

**1. 类方法绑定**：

```javascript
// ❌ 错误：方法未绑定
class Button {
  constructor() {
    this.clicked = false;
  }
  
  click() {
    this.clicked = true;
    console.log(this.clicked);
  }
}

const button = new Button();
const click = button.click;
click(); // "undefined"（this丢失）

// ✅ 正确：在构造函数中绑定
class Button {
  constructor() {
    this.clicked = false;
    this.click = this.click.bind(this);
  }
  
  click() {
    this.clicked = true;
    console.log(this.clicked);
  }
}

// ✅ 正确：使用箭头函数
class Button {
  constructor() {
    this.clicked = false;
  }
  
  click = () => {
    this.clicked = true;
    console.log(this.clicked);
  }
}
```

**2. 事件处理函数绑定**：

```javascript
// ❌ 错误：this指向DOM元素
class Component {
  constructor() {
    this.name = 'Component';
  }
  
  init() {
    document.querySelector('button').addEventListener('click', function() {
      console.log(this.name); // "undefined"（this指向button）
    });
  }
}

// ✅ 正确：使用箭头函数
class Component {
  constructor() {
    this.name = 'Component';
  }
  
  init() {
    document.querySelector('button').addEventListener('click', () => {
      console.log(this.name); // "Component"（this指向Component实例）
    });
  }
}

// ✅ 正确：使用bind绑定
class Component {
  constructor() {
    this.name = 'Component';
  }
  
  init() {
    document.querySelector('button').addEventListener('click', function() {
      console.log(this.name);
    }.bind(this));
  }
}
```

**3. Promise回调中的this**：

```javascript
// ❌ 错误：this丢失
class ApiClient {
  constructor() {
    this.baseUrl = 'https://api.example.com';
  }
  
  fetchData() {
    fetch('/api/data')
      .then(function(response) {
        console.log(this.baseUrl); // "undefined"
        return response.json();
      });
  }
}

// ✅ 正确：使用箭头函数
class ApiClient {
  constructor() {
    this.baseUrl = 'https://api.example.com';
  }
  
  fetchData() {
    fetch('/api/data')
      .then(response => {
        console.log(this.baseUrl); // "https://api.example.com"
        return response.json();
      });
  }
}
```

---

## 3. 代码输出顺序题

### 3.1 事件循环机制

**事件循环（Event Loop）**是JavaScript实现异步编程的核心机制。

```javascript
// 事件循环流程图
// 1. 执行同步代码（调用栈）
// 2. 清空微任务队列
// 3. 执行一个宏任务
// 4. 清空微任务队列
// 5. 重复步骤3-4

// 代码示例
console.log('1. 同步代码');

setTimeout(() => {
  console.log('2. 宏任务：setTimeout');
}, 0);

Promise.resolve().then(() => {
  console.log('3. 微任务：Promise.then');
});

console.log('4. 同步代码');

// 输出顺序：
// 1. 同步代码
// 4. 同步代码
// 3. 微任务：Promise.then
// 2. 宏任务：setTimeout
```

**事件循环详细流程**：

```
┌─────────────────────────────────────────────────────┐
│              JavaScript调用栈（Call Stack）       │
│  - 执行同步代码                                     │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│              微任务队列（Microtask Queue）       │
│  - Promise.then/catch/finally                     │
│  - queueMicrotask                                 │
│  - MutationObserver                               │
│  - Node.js: process.nextTick                      │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│              宏任务队列（Macrotask Queue）       │
│  - setTimeout/setInterval                         │
│  - setImmediate（Node.js）                        │
│  - I/O操作                                        │
│  - UI渲染                                        │
└─────────────────────────────────────────────────────┘
```

### 3.2 宏任务与微任务

**宏任务（Macrotask）**：
- setTimeout
- setInterval
- setImmediate（Node.js）
- I/O操作
- UI渲染

**微任务（Microtask）**：
- Promise.then/catch/finally
- queueMicrotask
- MutationObserver
- Node.js: process.nextTick

**微任务优先级高于宏任务**：

```javascript
console.log('1. 同步代码');

setTimeout(() => {
  console.log('2. setTimeout');
}, 0);

Promise.resolve().then(() => {
  console.log('3. Promise.then');
});

queueMicrotask(() => {
  console.log('4. queueMicrotask');
});

console.log('5. 同步代码');

// 输出顺序：
// 1. 同步代码
// 5. 同步代码
// 3. Promise.then
// 4. queueMicrotask
// 2. setTimeout
```

**微任务队列清空机制**：

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

### 3.3 async/await原理

**async/await是Promise的语法糖**：

```javascript
// async函数
async function fetchData() {
  const response = await fetch('/api/data');
  const data = await response.json();
  return data;
}

// 等价于
function fetchData() {
  return fetch('/api/data')
    .then(response => response.json())
    .then(data => data);
}

// await的执行机制
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

// 说明：await会将后续代码包装成微任务
```

**async/await错误处理**：

```javascript
// ❌ 错误：try-catch无法捕获异步错误
async function bad() {
  try {
    await Promise.reject(new Error('错误'));
  } catch (error) {
    console.log('捕获错误'); // 不会执行
  }
}

// ✅ 正确：在async函数内部使用try-catch
async function good() {
  try {
    await Promise.reject(new Error('错误'));
  } catch (error) {
    console.log('捕获错误'); // 执行
  }
}

// ✅ 正确：使用catch捕获
async function good2() {
  await Promise.reject(new Error('错误')).catch(error => {
    console.log('捕获错误'); // 执行
  });
}
```

### 3.4 Promise执行顺序

**Promise链式调用**：

```javascript
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
  });

// 输出：
// 1. 第一个then
// 2. 第二个then: 数据
// 3. 第三个then: 新的数据
```

**Promise.all执行顺序**：

```javascript
console.log('1. 同步代码');

Promise.all([
  Promise.resolve().then(() => console.log('2. Promise 1')),
  Promise.resolve().then(() => console.log('3. Promise 2')),
  Promise.resolve().then(() => console.log('4. Promise 3'))
]).then(() => console.log('5. Promise.all完成'));

setTimeout(() => console.log('6. setTimeout'), 0);

console.log('7. 同步代码');

// 输出：
// 1. 同步代码
// 7. 同步代码
// 2. Promise 1
// 3. Promise 2
// 4. Promise 3
// 5. Promise.all完成
// 6. setTimeout
```

**Promise.race执行顺序**：

```javascript
console.log('1. 同步代码');

Promise.race([
  new Promise(resolve => setTimeout(() => resolve('慢'), 1000)),
  new Promise(resolve => setTimeout(() => resolve('快'), 100))
]).then(result => console.log('2. race结果:', result));

setTimeout(() => console.log('3. setTimeout'), 0);

console.log('4. 同步代码');

// 输出：
// 1. 同步代码
// 4. 同步代码
// 2. race结果: 快
// 3. setTimeout
```

### 3.5 复杂异步代码分析

**经典面试题**：

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

**复杂async/await题目**：

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

// 执行过程分析：
// 1. 同步代码执行：
//    - 打印 '4. 同步代码'
//    - 遇到setTimeout，回调放入宏任务队列
//    - 遇到Promise 1，then回调放入微任务队列
//    - 调用async1()，打印 '1. async1 start'
//    - 调用async2()，打印 '3. async2'
//    - await async2()将'2. async1 end'放入微任务队列
//    - 创建Promise 2，打印 '7. Promise 2'
//    - Promise 2的then回调放入微任务队列
//    - 打印 '9. 同步代码结束'

// 2. 清空微任务队列：
//    - 执行Promise 1的then回调，打印 '6. Promise 1'
//    - 执行async1的await后续代码，打印 '2. async1 end'
//    - 执行Promise 2的then回调，打印 '8. Promise 3'

// 3. 执行宏任务：
//    - 执行setTimeout回调，打印 '5. setTimeout'

// 最终输出顺序：
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

**微任务阻塞测试**：

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

---

## 4. Map和Set数据结构

### 4.1 Map底层实现

**Map是哈希表的实现**，支持任意类型的键：

```javascript
// Map基础操作
const map = new Map();

// 添加键值对
map.set('name', '张三');
map.set(123, '数字键');
map.set(true, '布尔键');
map.set({ id: 1 }, '对象键'); // 对象可以作为键

// 获取值
console.log(map.get('name')); // "张三"
console.log(map.get(123));    // "数字键"
console.log(map.get(true));   // "布尔键"
console.log(map.get({ id: 1 })); // undefined（对象引用不同）

// 检查键是否存在
console.log(map.has('name')); // true

// 删除键值对
map.delete('name');

// 获取大小
console.log(map.size); // 3

// 遍历Map
map.set('a', 1);
map.set('b', 2);
map.set('c', 3);

// 遍历键
for (const key of map.keys()) {
  console.log(key);
}

// 遍历值
for (const value of map.values()) {
  console.log(value);
}

// 遍历键值对
for (const [key, value] of map.entries()) {
  console.log(key, value);
}

// 使用forEach
map.forEach((value, key) => {
  console.log(key, value);
});
```

**Map与Object对比**：

```javascript
// Object的限制
const obj = {};
obj[123] = '数字键'; // 键被转换为字符串"123"
obj[true] = '布尔键'; // 键被转换为字符串"true"

console.log(obj); // { "123": "数字键", "true": "布尔键" }

// Map的优势
const map = new Map();
map.set(123, '数字键');
map.set(true, '布尔键');

console.log(map.get(123)); // "数字键"（保持类型）
console.log(map.get(true)); // "布尔键"（保持类型）
```

**Map的性能优势**：

```javascript
// 性能测试
function testMapVsObject() {
  const count = 10000;
  
  // Object测试
  console.time('Object');
  const obj = {};
  for (let i = 0; i < count; i++) {
    obj[i] = i;
  }
  for (let i = 0; i < count; i++) {
    const value = obj[i];
  }
  console.timeEnd('Object');
  
  // Map测试
  console.time('Map');
  const map = new Map();
  for (let i = 0; i < count; i++) {
    map.set(i, i);
  }
  for (let i = 0; i < count; i++) {
    const value = map.get(i);
  }
  console.timeEnd('Map');
  
  // 通常Map性能更好，特别是在大量数据时
}
```

### 4.2 Set底层实现

**Set是哈希表实现的集合**，存储唯一值：

```javascript
// Set基础操作
const set = new Set();

// 添加元素
set.add(1);
set.add(2);
set.add(3);
set.add(1); // 重复元素，不会添加

console.log(set); // Set { 1, 2, 3 }

// 检查元素是否存在
console.log(set.has(2)); // true

// 删除元素
set.delete(2);

// 获取大小
console.log(set.size); // 2

// 遍历Set
set.add('a');
set.add('b');
set.add('c');

// 遍历值
for (const value of set.values()) {
  console.log(value);
}

// 遍历键（与values相同）
for (const key of set.keys()) {
  console.log(key);
}

// 遍历键值对
for (const [key, value] of set.entries()) {
  console.log(key, value);
}

// 使用forEach
set.forEach((value) => {
  console.log(value);
});
```

**Set的常见用途**：

```javascript
// 1. 数组去重
const arr = [1, 2, 2, 3, 3, 3, 4, 4, 4, 4];
const unique = [...new Set(arr)];
console.log(unique); // [1, 2, 3, 4]

// 2. 成员检查
const set = new Set([1, 2, 3, 4, 5]);
console.log(set.has(3)); // true
console.log(set.has(6)); // false

// 3. 交集
const set1 = new Set([1, 2, 3]);
const set2 = new Set([2, 3, 4]);
const intersection = new Set([...set1].filter(x => set2.has(x)));
console.log(intersection); // Set { 2, 3 }

// 4. 并集
const union = new Set([...set1, ...set2]);
console.log(union); // Set { 1, 2, 3, 4 }

// 5. 差集
const difference = new Set([...set1].filter(x => !set2.has(x)));
console.log(difference); // Set { 1 }
```

### 4.3 Map/Set与Object对比

**对比表**：

| 特性 | Object | Map |
|------|--------|-----|
| 键类型 | 字符串/Symbol | 任意类型 |
| 键顺序 | 插入顺序（ES2015+） | 插入顺序 |
| 大小获取 | 手动计算 | size属性 |
| 迭代 | 需要转换 | 直接迭代 |
| 性能 | 小数据快 | 大数据快 |
| 原型污染 | 可能 | 不会 |

**性能对比**：

```javascript
// 添加元素性能
console.time('Object添加');
const obj = {};
for (let i = 0; i < 100000; i++) {
  obj[i] = i;
}
console.timeEnd('Object添加');

console.time('Map添加');
const map = new Map();
for (let i = 0; i < 100000; i++) {
  map.set(i, i);
}
console.timeEnd('Map添加');

// 获取元素性能
console.time('Object获取');
for (let i = 0; i < 100000; i++) {
  const value = obj[i];
}
console.timeEnd('Object获取');

console.time('Map获取');
for (let i = 0; i < 100000; i++) {
  const value = map.get(i);
}
console.timeEnd('Map获取');

// 通常Map在大量数据时性能更好
```

### 4.4 Map/Set性能优势

**1. 添加元素**：

```javascript
// Object：需要检查原型链
const obj = {};
obj[0] = 'a';
obj[1] = 'b';

// Map：直接哈希表操作
const map = new Map();
map.set(0, 'a');
map.set(1, 'b');

// 性能测试
function testAdd() {
  const count = 10000;
  
  console.time('Object添加');
  const obj = {};
  for (let i = 0; i < count; i++) {
    obj[i] = i;
  }
  console.timeEnd('Object添加');
  
  console.time('Map添加');
  const map = new Map();
  for (let i = 0; i < count; i++) {
    map.set(i, i);
  }
  console.timeEnd('Map添加');
}
```

**2. 检查存在**：

```javascript
// Object：需要检查原型链
const obj = { a: 1, b: 2, c: 3 };
console.log('a' in obj); // true

// Map：直接哈希表查找
const map = new Map([['a', 1], ['b', 2], ['c', 3]]);
console.log(map.has('a')); // true

// 性能测试
function testHas() {
  const count = 10000;
  const obj = {};
  const map = new Map();
  
  // 初始化
  for (let i = 0; i < count; i++) {
    obj[i] = i;
    map.set(i, i);
  }
  
  console.time('Object检查');
  for (let i = 0; i < count; i++) {
    const value = i in obj;
  }
  console.timeEnd('Object检查');
  
  console.time('Map检查');
  for (let i = 0; i < count; i++) {
    const value = map.has(i);
  }
  console.timeEnd('Map检查');
}
```

**3. 删除元素**：

```javascript
// Object：需要使用delete
const obj = { a: 1, b: 2, c: 3 };
delete obj.a;

// Map：直接删除
const map = new Map([['a', 1], ['b', 2], ['c', 3]]);
map.delete('a');

// 性能测试
function testDelete() {
  const count = 10000;
  const obj = {};
  const map = new Map();
  
  // 初始化
  for (let i = 0; i < count; i++) {
    obj[i] = i;
    map.set(i, i);
  }
  
  console.time('Object删除');
  for (let i = 0; i < count; i++) {
    delete obj[i];
  }
  console.timeEnd('Object删除');
  
  console.time('Map删除');
  for (let i = 0; i < count; i++) {
    map.delete(i);
  }
  console.timeEnd('Map删除');
}
```

### 4.5 WeakMap和WeakSet

**WeakMap**：
- 键必须是对象
- 键是弱引用，可以被垃圾回收
- 不能遍历

```javascript
const weakMap = new WeakMap();

const obj1 = { id: 1 };
const obj2 = { id: 2 };

weakMap.set(obj1, '值1');
weakMap.set(obj2, '值2');

console.log(weakMap.get(obj1)); // "值1"

// obj1被置空后，对应的键值对会被垃圾回收
obj1 = null;
```

**WeakSet**：
- 成员必须是对象
- 成员是弱引用，可以被垃圾回收
- 不能遍历

```javascript
const weakSet = new WeakSet();

const obj1 = { id: 1 };
const obj2 = { id: 2 };

weakSet.add(obj1);
weakSet.add(obj2);

console.log(weakSet.has(obj1)); // true

// obj1被置空后，会被垃圾回收
obj1 = null;
```

**WeakMap实战应用**：

```javascript
// 私有数据存储
const PrivateData = new WeakMap();

class Person {
  constructor(name) {
    this.name = name;
    PrivateData.set(this, { age: 0 });
  }
  
  setAge(age) {
    PrivateData.get(this).age = age;
  }
  
  getAge() {
    return PrivateData.get(this).age;
  }
}

const person = new Person('张三');
person.setAge(25);
console.log(person.getAge()); // 25

// 外部无法访问PrivateData
console.log(PrivateData.has(person)); // true
console.log(PrivateData.has({})); // false
```

**WeakMap缓存应用**：

```javascript
// 缓存计算结果
const cache = new WeakMap();

function compute(obj) {
  if (cache.has(obj)) {
    return cache.get(obj);
  }
  
  const result = { data: '计算结果' };
  cache.set(obj, result);
  return result;
}

const obj1 = { id: 1 };
const obj2 = { id: 2 };

const result1 = compute(obj1);
const result2 = compute(obj2);

console.log(result1 === cache.get(obj1)); // true

// obj1被垃圾回收后，缓存也会被清理
obj1 = null;
```

---

## 5. 箭头函数

### 5.1 箭头函数与普通函数区别

**基本语法对比**：

```javascript
// 普通函数
function add(a, b) {
  return a + b;
}

// 箭头函数
const addArrow = (a, b) => a + b;

// 箭头函数（多行）
const addArrowMulti = (a, b) => {
  return a + b;
};
```

**完整对比表**：

| 特性 | 普通函数 | 箭头函数 |
|------|---------|---------|
| this绑定 | 动态绑定 | 静态绑定（继承外层） |
| arguments | 有 | 无（使用rest参数） |
| prototype | 有 | 无 |
| 可作为构造函数 | 可以 | 不可以 |
| 可以使用yield | 可以 | 不可以 |

**this绑定对比**：

```javascript
// 普通函数：this动态绑定
const obj1 = {
  name: '张三',
  greet: function() {
    console.log(this.name); // "张三"
  }
};

// 箭头函数：this静态绑定
const obj2 = {
  name: '李四',
  greet: () => {
    console.log(this.name); // "undefined"（继承外层this）
  }
};

// 箭头函数嵌套普通函数
const obj3 = {
  name: '王五',
  greet: function() {
    const arrow = () => {
      console.log(this.name); // "王五"（继承greet的this）
    };
    arrow();
  }
};
```

### 5.2 箭头函数的this绑定

**箭头函数没有自己的this**：

```javascript
// ❌ 错误：箭头函数的this不是调用者
const obj = {
  name: '张三',
  greet: () => {
    console.log(this.name); // "undefined"
  }
};

obj.greet();

// ✅ 正确：使用普通函数
const obj2 = {
  name: '李四',
  greet: function() {
    console.log(this.name); // "李四"
  }
};

obj2.greet();

// ✅ 正确：箭头函数继承外层this
const obj3 = {
  name: '王五',
  greet: function() {
    const arrow = () => {
      console.log(this.name); // "王五"
    };
    arrow();
  }
};

obj3.greet();
```

**箭头函数this绑定时机**：

```javascript
// 箭头函数的this在定义时绑定，而不是调用时绑定
function Timer() {
  this.seconds = 0;
  
  // ✅ 正确：箭头函数继承Timer的this
  setInterval(() => {
    this.seconds++;
    console.log(this.seconds);
  }, 1000);
}

new Timer();

// ❌ 错误：普通函数的this指向window
function Timer2() {
  this.seconds = 0;
  
  setInterval(function() {
    this.seconds++;
    console.log(this.seconds);
  }, 1000);
}

new Timer2();
```

### 5.3 箭头函数的arguments

**箭头函数没有arguments对象**：

```javascript
// 普通函数：有arguments
function normal() {
  console.log(arguments); // Arguments { 0: 1, 1: 2, 2: 3 }
}

normal(1, 2, 3);

// 箭头函数：没有arguments
const arrow = () => {
  console.log(arguments); // ReferenceError: arguments is not defined
};

arrow(1, 2, 3);

// ✅ 解决方案：使用rest参数
const arrowWithRest = (...args) => {
  console.log(args); // [1, 2, 3]
};

arrowWithRest(1, 2, 3);
```

**arguments与rest参数对比**：

```javascript
// 普通函数使用arguments
function sum() {
  let total = 0;
  for (let i = 0; i < arguments.length; i++) {
    total += arguments[i];
  }
  return total;
}

console.log(sum(1, 2, 3)); // 6

// 箭头函数使用rest参数
const sumArrow = (...args) => {
  return args.reduce((total, num) => total + num, 0);
};

console.log(sumArrow(1, 2, 3)); // 6
```

### 5.4 箭头函数使用场景

**1. 数组回调函数**：

```javascript
// ❌ 错误：普通函数的this指向window
const obj = {
  numbers: [1, 2, 3, 4, 5],
  double() {
    return this.numbers.map(function(num) {
      return num * 2; // this.numbers是undefined
    });
  }
};

// ✅ 正确：使用箭头函数
const obj2 = {
  numbers: [1, 2, 3, 4, 5],
  double() {
    return this.numbers.map(num => num * 2);
  }
};

console.log(obj2.double()); // [2, 4, 6, 8, 10]
```

**2. Promise回调**：

```javascript
// ❌ 错误：普通函数的this丢失
class ApiClient {
  constructor() {
    this.baseUrl = 'https://api.example.com';
  }
  
  fetchData() {
    fetch('/api/data')
      .then(function(response) {
        console.log(this.baseUrl); // "undefined"
        return response.json();
      });
  }
}

// ✅ 正确：使用箭头函数
class ApiClient2 {
  constructor() {
    this.baseUrl = 'https://api.example.com';
  }
  
  fetchData() {
    fetch('/api/data')
      .then(response => {
        console.log(this.baseUrl); // "https://api.example.com"
        return response.json();
      });
  }
}
```

**3. 事件处理函数**：

```javascript
// ❌ 错误：普通函数的this指向DOM元素
class Component {
  constructor() {
    this.name = 'Component';
  }
  
  init() {
    document.querySelector('button').addEventListener('click', function() {
      console.log(this.name); // "undefined"（this指向button）
    });
  }
}

// ✅ 正确：使用箭头函数
class Component2 {
  constructor() {
    this.name = 'Component';
  }
  
  init() {
    document.querySelector('button').addEventListener('click', () => {
      console.log(this.name); // "Component"
    });
  }
}
```

**4. 计时器回调**：

```javascript
// ❌ 错误：普通函数的this丢失
class Counter {
  constructor() {
    this.count = 0;
  }
  
  start() {
    setTimeout(function() {
      this.count++;
      console.log(this.count);
    }, 1000);
  }
}

// ✅ 正确：使用箭头函数
class Counter2 {
  constructor() {
    this.count = 0;
  }
  
  start() {
    setTimeout(() => {
      this.count++;
      console.log(this.count);
    }, 1000);
  }
}
```

### 5.5 箭头函数的限制

**1. 不能作为构造函数**：

```javascript
// ❌ 错误：箭头函数不能用作构造函数
const Arrow = () => {};
const instance = new Arrow(); // TypeError: Arrow is not a constructor

// ✅ 正确：使用普通函数
function Person(name) {
  this.name = name;
}
const person = new Person('张三');
```

**2. 没有prototype属性**：

```javascript
// 普通函数有prototype
function Person() {}
console.log(Person.prototype); // { constructor: Person }

// 箭头函数没有prototype
const Arrow = () => {};
console.log(Arrow.prototype); // undefined
```

**3. 没有arguments对象**：

```javascript
// ❌ 错误：箭头函数没有arguments
const arrow = () => {
  console.log(arguments); // ReferenceError
};

// ✅ 正确：使用rest参数
const arrowWithRest = (...args) => {
  console.log(args);
};
```

**4. 不能使用yield**：

```javascript
// ❌ 错误：箭头函数不能用作生成器
const arrowGenerator = function*() {
  yield 1;
  yield 2;
};

// 箭头函数不能使用yield
// const arrowGenerator = *() => { ... }; // SyntaxError
```

**5. this绑定的陷阱**：

```javascript
// ❌ 错误：箭头函数的this不是调用者
const obj = {
  name: '张三',
  greet: () => {
    console.log(this.name); // "undefined"
  }
};

// ✅ 正确：使用普通函数
const obj2 = {
  name: '李四',
  greet: function() {
    console.log(this.name); // "李四"
  }
};

// ✅ 正确：箭头函数嵌套普通函数
const obj3 = {
  name: '王五',
  greet: function() {
    const arrow = () => {
      console.log(this.name); // "王五"
    };
    arrow();
  }
};
```

---

## 6. 综合实战案例

### 6.1 TodoList完整实现

```javascript
// TodoList组件
class TodoList {
  constructor(container) {
    this.container = container;
    this.todos = [];
    this.init();
  }

  init() {
    // 使用事件委托处理所有点击事件
    this.container.addEventListener('click', (event) => {
      const li = event.target.closest('li');
      const button = event.target.closest('button');

      // 删除任务
      if (button && button.classList.contains('delete')) {
        const id = parseInt(li.dataset.id);
        this.deleteTodo(id);
      }
      // 切换完成状态
      else if (li && !button) {
        const id = parseInt(li.dataset.id);
        this.toggleTodo(id);
      }
    });

    // 处理添加任务
    this.container.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = this.container.querySelector('input');
      const text = input.value.trim();
      
      if (text) {
        this.addTodo(text);
        input.value = '';
      }
    });
  }

  addTodo(text) {
    const id = Date.now();
    this.todos.push({ id, text, completed: false });
    this.render();
  }

  deleteTodo(id) {
    this.todos = this.todos.filter(todo => todo.id !== id);
    this.render();
  }

  toggleTodo(id) {
    const todo = this.todos.find(todo => todo.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      this.render();
    }
  }

  render() {
    this.container.innerHTML = `
      <h2>TodoList</h2>
      <form>
        <input type="text" placeholder="添加新任务" />
        <button type="submit">添加</button>
      </form>
      <ul>
        ${this.todos.map(todo => `
          <li data-id="${todo.id}" class="${todo.completed ? 'completed' : ''}">
            <span>${todo.text}</span>
            <button class="delete">删除</button>
          </li>
        `).join('')}
      </ul>
    `;
  }
}

// 使用
const list = new TodoList(document.body);
```

### 6.2 异步数据获取

```javascript
// API客户端
class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.cache = new Map(); // 使用Map作为缓存
  }

  // 获取用户
  async getUser(id) {
    // 检查缓存
    if (this.cache.has(id)) {
      console.log('从缓存获取');
      return this.cache.get(id);
    }

    try {
      const response = await fetch(`${this.baseUrl}/users/${id}`);
      const user = await response.json();
      
      // 存入缓存
      this.cache.set(id, user);
      
      return user;
    } catch (error) {
      console.error('获取用户失败:', error);
      throw error;
    }
  }

  // 并行获取多个用户
  async getUsers(ids) {
    const promises = ids.map(id => this.getUser(id));
    return await Promise.all(promises);
  }

  // 串行获取多个用户
  async getUsersSequential(ids) {
    const users = [];
    for (const id of ids) {
      const user = await this.getUser(id);
      users.push(user);
    }
    return users;
  }

  // 重试机制
  async fetchWithRetry(url, maxAttempts = 3, delay = 1000) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        if (i === maxAttempts - 1) {
          throw error;
        }
        await this.sleep(delay * (i + 1));
      }
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 使用
const api = new ApiClient('https://api.example.com');

// 并行获取
api.getUsers([1, 2, 3]).then(users => {
  console.log(users);
});

// 重试获取
api.fetchWithRetry('https://api.example.com/data', 3, 1000)
  .then(data => console.log(data))
  .catch(error => console.error('获取失败:', error));
```

### 6.3 性能优化的事件处理

```javascript
// 性能优化的事件处理
class OptimizedEventList {
  constructor(container) {
    this.container = container;
    this.items = [];
    this.debounceTimer = null;
    this.init();
  }

  init() {
    // 使用事件委托
    this.container.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (button) {
        const id = parseInt(button.dataset.id);
        this.handleClick(id);
      }
    });

    // 使用防抖处理输入
    this.container.addEventListener('input', (event) => {
      if (event.target.tagName === 'INPUT') {
        this.handleInput(event.target.value);
      }
    });
  }

  handleClick(id) {
    console.log('点击:', id);
    // 处理点击逻辑
  }

  handleInput = (value) => {
    // 防抖处理
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
      console.log('输入:', value);
      // 处理输入逻辑
    }, 300);
  };

  // 节流处理
  handleScroll = () => {
    // 节流处理
    if (this.throttleTimer) {
      return;
    }
    
    this.throttleTimer = setTimeout(() => {
      console.log('滚动');
      // 处理滚动逻辑
      this.throttleTimer = null;
    }, 100);
  };

  // 批量更新
  batchUpdate(items) {
    // 批量更新DOM
    const fragment = document.createDocumentFragment();
    
    items.forEach(item => {
      const element = document.createElement('div');
      element.textContent = item;
      fragment.appendChild(element);
    });
    
    this.container.appendChild(fragment);
  }
}

// 使用
const list = new OptimizedEventList(document.body);
```

---

## 7. 面试真题解析

### 7.1 this绑定面试题

**题目1：this绑定优先级**

```javascript
function test() {
  console.log(this.value);
}

const obj1 = { value: 'obj1' };
const obj2 = { value: 'obj2' };

// 1. new绑定 > 显式绑定
const bound = test.bind(obj1);
new bound(); // undefined（new绑定创建新对象）

// 2. 显式绑定 > 隐式绑定
const obj3 = {
  value: 'obj3',
  test: test.bind(obj1)
};
obj3.test(); // "obj1"

// 3. 隐式绑定 > 默认绑定
const obj4 = { value: 'obj4', test: test };
obj4.test(); // "obj4"

// 4. 默认绑定
test(); // undefined（严格模式）
```

**题目2：箭头函数的this**

```javascript
const obj = {
  name: '张三',
  greet: () => {
    console.log(this.name);
  },
  sayName: function() {
    const arrow = () => console.log(this.name);
    arrow();
  }
};

obj.greet(); // "undefined"
obj.sayName(); // "张三"
```

### 7.2 事件委托面试题

**题目1：事件委托原理**

```javascript
// 问题：为什么事件委托比直接绑定性能更好？
// 答案：
// 1. 事件监听器数量：O(N) → O(1)
// 2. 内存占用：O(N) → O(1)
// 3. 初始化时间：~50ms → ~1ms
// 4. 动态添加元素：自动支持
// 5. 删除元素：自动失效

// 问题：如何使用事件委托处理动态添加的元素？
// 答案：使用closest()方法
list.addEventListener('click', (event) => {
  const li = event.target.closest('li');
  if (li && list.contains(li)) {
    console.log('点击了:', li.textContent);
  }
});
```

### 7.3 异步执行顺序面试题

**题目1：经典输出顺序**

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

**题目2：async/await执行顺序**

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

---

## 8. 最佳实践总结

### 8.1 事件委托最佳实践

1. **使用closest()方法**：更安全的事件目标检查
2. **检查容器包含**：确保事件目标在委托元素内
3. **使用事件委托处理动态元素**：自动支持动态添加
4. **避免过度委托**：不要将事件委托到document或body

### 8.2 this绑定最佳实践

1. **类方法使用箭头函数**：避免this丢失
2. **回调函数使用箭头函数**：继承外层this
3. **构造函数使用普通函数**：支持new绑定
4. **避免显式绑定this**：使用箭头函数替代

### 8.3 异步编程最佳实践

1. **使用async/await**：更易读的异步代码
2. **并行执行独立操作**：使用Promise.all
3. **错误处理使用try-catch**：捕获异步错误
4. **避免微任务阻塞**：不要在微任务中创建新的微任务

### 8.4 Map/Set最佳实践

1. **使用Map代替Object**：需要任意类型键时
2. **使用Set去重**：数组去重和成员检查
3. **使用WeakMap缓存**：自动垃圾回收
4. **使用WeakSet存储对象**：弱引用集合

### 8.5 箭头函数最佳实践

1. **数组回调使用箭头函数**：继承外层this
2. **Promise回调使用箭头函数**：继承外层this
3. **事件处理使用箭头函数**：继承外层this
4. **避免用箭头函数作为构造函数**：不支持new绑定

---

## 参考资源

- [MDN JavaScript文档](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript)
- [JavaScript权威指南](https://book.douban.com/subject/269287.html)
- [JavaScript高级程序设计](https://book.douban.com/subject/270666.html)
- [JavaScript.info](https://javascript.info/)

---

*本文档持续更新，最后更新于2026年3月16日*