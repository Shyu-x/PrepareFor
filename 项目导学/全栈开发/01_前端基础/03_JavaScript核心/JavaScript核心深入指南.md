# JavaScript核心深入指南

## 目录

1. [变量与数据类型](#1-变量与数据类型)
2. [函数与作用域](#2-函数与作用域)
3. [闭包与this](#3-闭包与this)
4. [原型链与继承](#4-原型链与继承)
5. [异步编程](#5-异步编程)
6. [事件循环](#6-事件循环)
7. [内存管理](#7-内存管理)

---

## 1. 变量与数据类型

### 1.1 变量声明对比

```
变量声明方式对比：

┌─────────────┬────────────────┬────────────────┬────────────────┐
│   声明方式   │    作用域      │    变量提升    │    重新声明    │
├─────────────┼────────────────┼────────────────┼────────────────┤
│   var       │   函数作用域    │    提升        │      允许      │
│   let       │   块级作用域    │   暂时死区    │    不允许      │
│   const     │   块级作用域    │   暂时死区    │    不允许      │
└─────────────┴────────────────┴────────────────┴────────────────┘
```

### 1.2 数据类型详解

```javascript
// 1. 基本类型（7种）
let number = 123;          // Number
let string = 'hello';      // String
let boolean = true;        // Boolean
let nullValue = null;      // Null
let undefined = undefined;  // Undefined
let symbol = Symbol();      // Symbol (ES6)
let bigint = 123n;        // BigInt (ES2020)

// 2. 引用类型
let object = {};           // Object
let array = [];            // Array
let func = function() {};  // Function
let date = new Date();     // Date
let regexp = /pattern/;    // RegExp

// 3. 类型检测
typeof 123;              // 'number'
typeof 'hello';           // 'string'
typeof true;              // 'boolean'
typeof undefined;         // 'undefined'
typeof null;              // 'object' (历史遗留问题）
typeof {};                // 'object'
typeof [];                // 'object'

// 更准确的类型检测
Object.prototype.toString.call(null);       // '[object Null]'
Object.prototype.toString.call([]);          // '[object Array]'
Object.prototype.toString.call(new Date());   // '[object Date]'

// 检查数组
Array.isArray([]);         // true
Array.isArray({});         // false

// 检查null
value === null;            // 准确检查null

// 检查undefined
typeof value === 'undefined';  // 准确检查undefined
```

### 1.3 类型转换

```javascript
// 1. 隐式类型转换
// 字符串 + 数字 = 字符串
console.log('10' + 5);      // '105'

// 数字 - 字符串 = 数字
console.log('10' - 5);      // 5

// 布尔值转换
console.log(true + 1);       // 2
console.log(false + 1);      // 1

// 2. 显式类型转换
String(123);                // '123'
Number('123');              // 123
Boolean(1);                 // true

parseInt('10px');           // 10
parseFloat('10.5px');       // 10.5

// 3. 真假值判断
// 假值（falsy）：false, 0, '', null, undefined, NaN, 0n
// 真值（truthy）：除此之外所有值

console.log(!!0);            // false
console.log(!!'');           // false
console.log(!!null);         // false
console.log(!![]);           // true (空数组是真值)
console.log(!!{});           // true (空对象是真值)
```

---

## 2. 函数与作用域

### 2.1 函数定义方式

```javascript
// 1. 函数声明（变量提升）
function sayHello() {
    console.log('Hello');
}

// 2. 函数表达式（不提升）
const sayHi = function() {
    console.log('Hi');
};

// 3. 箭头函数（ES6）
const greet = (name) => {
    return `Hello, ${name}`;
};

// 简写（单行返回）
const greet = name => `Hello, ${name}`;

// 4. 立即执行函数（IIFE）
(function() {
    console.log('立即执行');
})();

// 5. 生成器函数（ES6）
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
```

### 2.2 作用域类型

```
作用域链模型：

┌─────────────────────────────────────────────────────────────┐
│                 全局作用域（Global）                   │
│  ┌───────────────────────────────────────────────────┐  │
│  │         函数作用域（Function Scope）            │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │       块级作用域（Block Scope）           │  │  │
│  │  │  { let x = 1; const y = 2; }         │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  │         function() { ... }                  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 变量提升详解

```javascript
// var的变量提升
console.log(x);  // undefined（不是报错）
var x = 10;

// 等价于：
var x;           // 声明提升
console.log(x);  // undefined
x = 10;          // 赋值原地

// 函数声明提升
console.log(sayHello); // 函数对象
function sayHello() {
    console.log('Hello');
}

// let/const的暂时死区（TDZ）
// console.log(y);  // ReferenceError
// let y = 20;

// 在暂时死区内无法访问
if (true) {
    // console.log(z);  // ReferenceError
    let z = 30;
}

// 函数内部的变量提升
function test() {
    console.log(a);  // undefined
    var a = 10;
}
```

---

## 3. 闭包与this

### 3.1 闭包原理

```
闭包机制：
- 函数嵌套
- 内部函数引用外部函数的变量
- 外部函数返回内部函数
- 形成"词法作用域"的延伸

┌─────────────────────────────────────────────────────┐
│  外部函数（outerFunction）                      │
│  ┌───────────────────────────────────────────┐  │
│  │   变量：outerVar                          │  │
│  │   ┌───────────────────────────────────┐  │  │
│  │   │  内部函数（innerFunction）        │  │  │
│  │   │   引用：outerVar                   │  │  │
│  │   │   即使外部函数执行完毕          │  │  │
│  │   │   依然可以访问outerVar        │  │  │
│  │   └───────────────────────────────────┘  │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 3.2 闭包实战应用

```javascript
// 1. 数据私有化
function createCounter() {
    let count = 0;  // 私有变量，外部无法直接访问

    return {
        increment: () => ++count,
        decrement: () => --count,
        getCount: () => count
    };
}

const counter = createCounter();
console.log(counter.increment());  // 1
console.log(counter.getCount());   // 1
console.log(counter.count);      // undefined（无法直接访问）

// 2. 函数柯里化（固定参数）
function curry(fn) {
    return function curried(...args) {
        if (args.length >= fn.length) {
            return fn(...args);
        }
        return (...more) => curried(...args, ...more);
    };
}

function add(a, b, c) {
    return a + b + c;
}

const curriedAdd = curry(add);
console.log(curriedAdd(1)(2)(3));  // 6
console.log(curriedAdd(1, 2)(3));  // 6

// 3. 记忆化（缓存结果）
function memoize(fn) {
    const cache = new Map();

    return function(...args) {
        const key = JSON.stringify(args);

        if (cache.has(key)) {
            console.log('从缓存获取');
            return cache.get(key);
        }

        const result = fn(...args);
        cache.set(key, result);
        return result;
    };
}

function expensiveCalculation(n) {
    console.log('执行计算');
    return n * n * n;
}

const memoizedCalc = memoize(expensiveCalculation);
console.log(memoizedCalc(5));  // 执行计算，125
console.log(memoizedCalc(5));  // 从缓存获取，125

// 4. 事件处理器
function createLogger(prefix) {
    return function(message) {
        console.log(`[${prefix}] ${message}`);
    };
}

const errorLogger = createLogger('ERROR');
const infoLogger = createLogger('INFO');

errorLogger('文件未找到');
infoLogger('操作成功');

// 5. 避免循环中的闭包陷阱
// 错误示范
for (var i = 0; i < 3; i++) {
    setTimeout(() => console.log(i), 100);  // 3, 3, 3
}

// 正确方法1：使用let
for (let i = 0; i < 3; i++) {
    setTimeout(() => console.log(i), 100);  // 0, 1, 2
}

// 正确方法2：使用立即执行函数
for (var i = 0; i < 3; i++) {
    (function(index) {
        setTimeout(() => console.log(index), 100);  // 0, 1, 2
    })(i);
}

// 正确方法3：使用bind
for (var i = 0; i < 3; i++) {
    setTimeout(console.log.bind(null, i), 100);  // 0, 1, 2
}
```

### 3.3 this指向详解

```javascript
// 1. this的绑定规则

// 规则1：默认绑定（独立调用）
function test() {
    console.log(this);  // 严格模式：undefined，非严格模式：window
}
test();

// 规则2：隐式绑定（对象调用）
const obj = {
    name: '张三',
    sayName: function() {
        console.log(this.name);  // '张三'
    }
};
obj.sayName();

// 规则3：显式绑定（call/apply/bind）
function greet(greeting) {
    console.log(`${greeting}, ${this.name}`);
}

greet.call({ name: '李四' }, '你好');      // 你好, 李四
greet.apply({ name: '王五' }, ['你好']);   // 你好, 王五

const boundGreet = greet.bind({ name: '赵六' });
boundGreet('你好');  // 你好, 赵六

// 规则4：new绑定（构造函数调用）
function Person(name) {
    this.name = name;
}
const person = new Person('钱七');
console.log(person.name);  // '钱七'

// 规则5：箭头函数（没有自己的this）
const obj2 = {
    name: '张三',
    sayName: () => {
        console.log(this.name);  // undefined
    }
};
obj2.sayName();

// 箭头函数的this继承自外层作用域
const obj3 = {
    name: '张三',
    sayName: function() {
        const arrow = () => console.log(this.name);
        arrow();  // '张三'
    }
};
obj3.sayName();

// 2. bind创建偏函数
function multiply(a, b) {
    return a * b;
}

const double = multiply.bind(null, 2);
console.log(double(5));  // 10

const triple = multiply.bind(null, 3);
console.log(triple(5));  // 15
```

---

## 4. 原型链与继承

### 4.1 原型链机制

```
原型链示意图：

┌─────────────────────────────────────────────────────┐
│           实例对象（instance）                 │
│           属性：name, age                      │
│  └──────────────────┬──────────────────────┘   │
│                     │ __proto__                 │
│                     ▼                          │
│  ┌────────────────────────────────────────────┐ │
│  │          构造函数原型（Person.prototype） │ │
│  │          属性：species, greet()         │ │
│  └──────────────────┬──────────────────────┘   │
│                     │ __proto__                 │
│                     ▼                          │
│  ┌────────────────────────────────────────────┐ │
│  │          原型链顶端（Object.prototype）  │ │
│  │          方法：toString(), value()        │ │
│  └──────────────────┬──────────────────────┘   │
│                     │ __proto__                 │
│                     ▼                          │
│  ┌────────────────────────────────────────────┐ │
│  │          null（链的尽头）               │ │
└───────────────────────────────────────────────────┘

属性查找顺序：
1. 实例对象自身属性
2. 构造函数prototype
3. Object.prototype
4. 找不到返回undefined
```

### 4.2 原型操作

```javascript
// 1. 创建对象
const obj1 = {};
const obj2 = Object.create(null);  // 无原型的对象
const obj3 = Object.create(Object.prototype);

// 2. 原型操作
function Person(name) {
    this.name = name;
}

Person.prototype.species = '人类';
Person.prototype.greet = function() {
    console.log(`你好，我是${this.name}`);
};

const person = new Person('张三');

console.log(person.species);  // '人类'
person.greet();             // '你好，我是张三'

// 3. 原型链查找
console.log(person.hasOwnProperty('name'));    // true（自身属性）
console.log(person.hasOwnProperty('species')); // false（原型属性）

console.log('name' in person);              // true（自身+原型）
console.log('species' in person);           // true（自身+原型）

// 4. 获取原型
console.log(Object.getPrototypeOf(person)); // Person.prototype
console.log(person.__proto__);              // Person.prototype（不推荐）

// 5. 设置原型
const proto = { species: '人类' };
const obj4 = Object.create(proto);
console.log(obj4.species);  // '人类'
```

### 4.3 继承实现

```javascript
// 1. 原型链继承（传统方式）
function Animal(name) {
    this.name = name;
}

Animal.prototype.speak = function() {
    console.log(`${this.name}发出声音`);
};

function Dog(name, breed) {
    Animal.call(this, name);  // 继承构造函数属性
    this.breed = breed;
}

// 继承原型
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;

Dog.prototype.bark = function() {
    console.log(`${this.name}汪汪叫`);
};

const dog = new Dog('旺财', '金毛');
dog.speak();  // '旺财发出声音'
dog.bark();   // '旺财汪汪叫'

// 2. ES6类继承
class Animal {
    constructor(name) {
        this.name = name;
    }

    speak() {
        console.log(`${this.name}发出声音`);
    }
}

class Dog extends Animal {
    constructor(name, breed) {
        super(name);  // 调用父类构造函数
        this.breed = breed;
    }

    bark() {
        console.log(`${this.name}汪汪叫`);
    }
}

const dog2 = new Dog('小黑', '拉布拉多');
dog2.speak();  // '小黑发出声音'
dog2.bark();   // '小黑汪汪叫'
```

### 4.4 混入（Mixin）

```javascript
// 混入模式：向对象添加功能
const canEat = {
    eat(food) {
        console.log(`${this.name}吃${food}`);
    }
};

const canSleep = {
    sleep(hours) {
        console.log(`${this.name}睡了${hours}小时`);
    }
};

function createPerson(name) {
    const person = {
        name
    };

    // 混入功能
    Object.assign(person, canEat, canSleep);

    return person;
}

const person = createPerson('张三');
person.eat('米饭');     // '张三吃米饭'
person.sleep(8);        // '张三睡了8小时'

// ES6混入
class Person {
    constructor(name) {
        this.name = name;
    }
}

Object.assign(Person.prototype, canEat, canSleep);

const person2 = new Person('李四');
person2.eat('面条');     // '李四吃面条'
person2.sleep(7);        // '李四睡了7小时'
```

---

## 5. 异步编程

### 5.1 回调函数（Callback）

```javascript
// 基础回调
function fetchData(callback) {
    setTimeout(() => {
        callback({ data: '数据' });
    }, 1000);
}

fetchData((result) => {
    console.log(result.data);  // '数据'
});

// 回调地狱（Callback Hell）
getData((data) => {
    processData(data, (processed) => {
        saveData(processed, (saved) => {
            respond(saved, (response) => {
                // 层层嵌套...
            });
        });
    });
});
```

### 5.2 Promise对象

```javascript
// 1. 创建Promise
const promise = new Promise((resolve, reject) => {
    setTimeout(() => {
        if (Math.random() > 0.5) {
            resolve('成功');
        } else {
            reject('失败');
        }
    }, 1000);
});

// 2. Promise链式调用
promise
    .then(result => {
        console.log(result);  // '成功'
        return result + '!';
    })
    .then(result => {
        console.log(result);  // '成功!'
    })
    .catch(error => {
        console.error(error);  // '失败'
    })
    .finally(() => {
        console.log('无论成功失败都会执行');
    });

// 3. Promise.all（并行执行，都成功才成功）
const promise1 = fetch('/api/users');
const promise2 = fetch('/api/posts');

Promise.all([promise1, promise2])
    .then(([users, posts]) => {
        console.log(users, posts);  // 两个都成功
    })
    .catch(error => {
        console.error('至少一个失败');
    });

// 4. Promise.allSettled（不管成功失败都返回）
Promise.allSettled([promise1, promise2])
    .then(results => {
        results.forEach(result => {
            if (result.status === 'fulfilled') {
                console.log(result.value);
            } else {
                console.error(result.reason);
            }
        });
    });

// 5. Promise.race（谁先完成就返回谁）
Promise.race([promise1, promise2])
    .then(result => {
        console.log('最快的那个结果');
    });

// 6. Promise.any（只要有一个成功就返回）
Promise.any([promise1, promise2])
    .then(result => {
        console.log('第一个成功的结果');
    });
```

### 5.3 async/await语法

```javascript
// 1. 基础使用
async function fetchData() {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
}

fetchData().then(data => console.log(data));

// 2. 错误处理
async function handleFetch() {
    try {
        const response = await fetch('/api/data');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('请求失败', error);
        return null;
    } finally {
        console.log('清理操作');
    }
}

// 3. 并行执行
async function fetchMultiple() {
    const [users, posts] = await Promise.all([
        fetch('/api/users').then(r => r.json()),
        fetch('/api/posts').then(r => r.json())
    ]);

    return { users, posts };
}

// 4. 顺序执行
async function sequentialTasks() {
    const step1 = await doTask1();
    const step2 = await doTask2(step1);
    const step3 = await doTask3(step2);
    return step3;
}

// 5. 等待所有完成（不管成功失败）
async function fetchMultipleSettled() {
    const results = await Promise.allSettled([
        fetch('/api/users'),
        fetch('/api/posts')
    ]);

    results.forEach(result => {
        if (result.status === 'fulfilled') {
            console.log('成功');
        } else {
            console.error('失败', result.reason);
        }
    });
}

// 6. 超时控制
function withTimeout(promise, timeout) {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('超时')), timeout)
        )
    ]);
}

// 使用
const result = await withTimeout(fetch('/api/data'), 5000);

// 7. 重试机制
async function retry(fn, maxAttempts = 3, delay = 1000) {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxAttempts - 1) {
                throw error;  // 最后一次尝试失败，抛出错误
            }
            console.log(`第${i + 1}次尝试失败，${delay}ms后重试`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// 使用
const data = await retry(() => fetch('/api/data').then(r => r.json()), 3);
```

---

## 6. 事件循环

### 6.1 事件循环机制

```
事件循环流程：

┌─────────────────────────────────────────────────────┐
│              JavaScript调用栈（Call Stack）       │
└─────────────────────────────────────────────────────┘
                      │
                      │ 执行完同步代码
                      ▼
┌─────────────────────────────────────────────────────┐
│              宏任务队列（Macrotask Queue）      │
│  - setTimeout/setInterval                        │
│  - I/O操作                                     │
│  - UI渲染                                      │
└─────────────────────────────────────────────────────┘
                      │
                      │ 微任务队列为空时执行
                      ▼
┌─────────────────────────────────────────────────────┐
│              微任务队列（Microtask Queue）       │
│  - Promise.then/catch/finally                   │
│  - process.nextTick（Node.js）                  │
│  - MutationObserver                             │
└─────────────────────────────────────────────────────┘

执行顺序：
1. 执行同步代码
2. 清空微任务队列
3. 执行一个宏任务
4. 清空微任务队列
5. 重复步骤3-4
```

### 6.2 任务队列示例

```javascript
console.log('1. 同步代码');

// 微任务（优先级高）
Promise.resolve().then(() => {
    console.log('3. Promise微任务');
});

queueMicrotask(() => {
    console.log('4. queueMicrotask');
});

// 宏任务（优先级低）
setTimeout(() => {
    console.log('5. setTimeout宏任务');
}, 0);

setImmediate(() => {
    console.log('6. setImmediate（Node.js）');
});

console.log('2. 同步代码结束');

// 输出顺序：
// 1. 同步代码
// 2. 同步代码结束
// 3. Promise微任务
// 4. queueMicrotask
// 5. setTimeout宏任务
// 6. setImmediate（Node.js）
```

### 6.3 异步执行顺序

```javascript
// 复杂的异步执行顺序示例
async function async1() {
    console.log('async1开始');
    await Promise.resolve();
    console.log('async1结束');
}

async function async2() {
    console.log('async2开始');
    await Promise.resolve();
    console.log('async2结束');
}

console.log('同步1');

setTimeout(() => console.log('setTimeout'), 0);

Promise.resolve().then(() => {
    console.log('Promise.then');
    setTimeout(() => console.log('setTimeout in Promise'), 0);
});

async1();
async2();

console.log('同步2');

// 输出顺序：
// 同步1
// 同步2
// async1开始
// async2开始
// Promise.then
// async1结束
// async2结束
// setTimeout
// setTimeout in Promise
```

---

## 7. 内存管理

### 7.1 垃圾回收机制

```
垃圾回收策略：

┌─────────────────────────────────────────────────────┐
│              标记-清除（Mark-Sweep）            │
│  1. 标记所有可从根访问的对象                 │
│  2. 清除所有未标记的对象                       │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│              引用计数（Reference Counting）      │
│  1. 每个对象维护一个引用计数                 │
│  2. 引用为0时回收                            │
└─────────────────────────────────────────────────────┘

内存泄漏常见原因：
- 全局变量
- 未清除的定时器
- 未清理的事件监听器
- 闭包中的大对象
- DOM引用
```

### 7.2 内存泄漏示例与防范

```javascript
// 1. 全局变量泄漏
// ❌ 错误：创建全局变量
var globalVar = new Array(1000000);  // 占用大量内存

// ✅ 正确：使用局部变量或模块作用域
let localVar = new Array(1000000);

// 2. 定时器泄漏
// ❌ 错误：未清除定时器
function startTimer() {
    setInterval(() => {
        console.log('定时执行');
    }, 1000);
}

// ✅ 正确：保存定时器ID并清除
let timerId = null;

function startTimer() {
    timerId = setInterval(() => {
        console.log('定时执行');
    }, 1000);
}

function stopTimer() {
    if (timerId) {
        clearInterval(timerId);
        timerId = null;
    }
}

// 3. 事件监听器泄漏
// ❌ 错误：未移除事件监听器
const button = document.getElementById('button');
button.addEventListener('click', handleClick);

// ✅ 正确：移除事件监听器
function addClickListener() {
    const handleClick = () => console.log('点击');
    button.addEventListener('click', handleClick);

    // 返回清理函数
    return () => {
        button.removeEventListener('click', handleClick);
    };
}

const cleanup = addClickListener();
// 使用完毕后调用 cleanup();

// 4. 闭包泄漏
// ❌ 错误：大对象在闭包中无法被回收
function createLeak() {
    const largeData = new Array(1000000).fill('data');

    return function() {
        // 这个函数引用了largeData，导致无法被回收
        console.log('闭包函数');
    };
}

const leak = createLeak();  // largeData一直存在于内存中

// ✅ 正确：释放引用
function createNoLeak() {
    const largeData = new Array(1000000).fill('data');

    // 使用完毕后置空
    const result = function() {
        console.log('闭包函数');
    };

    largeData = null;  // 释放引用
    return result;
}

// 5. WeakMap和WeakSet（自动垃圾回收）
const cache = new WeakMap();

function cacheData(obj, data) {
    cache.set(obj, data);  // obj被回收时，对应的data也会被回收
}

// 使用
let tempObj = {};
cacheData(tempObj, '重要数据');
tempObj = null;  // tempObj被回收，cache中的数据也会被删除
```

### 7.3 性能优化技巧

```javascript
// 1. 减少对象创建（重用）
// ❌ 错误：每次循环都创建新对象
for (let i = 0; i < 1000; i++) {
    const temp = { x: i, y: i * 2 };
    process(temp);
}

// ✅ 正确：重用对象
const temp = {};
for (let i = 0; i < 1000; i++) {
    temp.x = i;
    temp.y = i * 2;
    process(temp);
}

// 2. 避免频繁的垃圾回收
// ❌ 错误：频繁创建和销毁对象
function badConcat() {
    let result = '';
    for (let i = 0; i < 1000; i++) {
        result += i;  // 每次创建新字符串
    }
    return result;
}

// ✅ 正确：使用数组join
function goodConcat() {
    const parts = [];
    for (let i = 0; i < 1000; i++) {
        parts.push(i.toString());
    }
    return parts.join('');
}

// 3. 使用对象池
class ObjectPool {
    constructor(createFn) {
        this.pool = [];
        this.createFn = createFn;
    }

    get() {
        return this.pool.length > 0
            ? this.pool.pop()
            : this.createFn();
    }

    release(obj) {
        // 重置对象状态
        for (let key in obj) {
            delete obj[key];
        }
        this.pool.push(obj);
    }
}

// 使用对象池
const pool = new ObjectPool(() => ({ data: null }));

function processItem() {
    const item = pool.get();
    item.data = '处理数据';

    // 使用item...

    // 归还对象
    pool.release(item);
}

// 4. 延迟加载
// ❌ 错误：加载所有模块
import { heavyModule1 } from './heavyModule1';
import { heavyModule2 } from './heavyModule2';
import { heavyModule3 } from './heavyModule3';

// ✅ 正确：动态导入
async function loadHeavyModule() {
    const module = await import('./heavyModule');
    return module.default;
}

// 5. 分批处理大数据
function processInBatches(items, batchSize, processor) {
    let index = 0;

    function processBatch() {
        const batch = items.slice(index, index + batchSize);

        batch.forEach(item => processor(item));

        index += batchSize;

        if (index < items.length) {
            // 使用setTimeout避免阻塞主线程
            setTimeout(processBatch, 0);
        }
    }

    processBatch();
}

// 使用
const largeArray = new Array(10000).fill(null);
processInBatches(largeArray, 100, (item) => {
    // 处理每个item
});
```

---

## 参考资源

- [MDN JavaScript文档](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript)
- [JavaScript权威指南](https://book.douban.com/subject/269287.html)
- [JavaScript高级程序设计](https://book.douban.com/subject/270666.html)

---

*本文档持续更新，最后更新于2026年3月*
