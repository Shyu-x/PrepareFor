# JavaScript核心

## 目录

1. [变量声明](#1-变量声明)
2. [数据类型与类型转换](#2-数据类型与类型转换)
3. [作用域与闭包](#3-作用域与闭包)
4. [原型与原型链](#4-原型与原型链)
5. [异步编程](#5-异步编程)
6. [DOM操作与事件委托](#6-dom操作与事件委托)
7. [模块化](#7-模块化)

---

## 1. 变量声明

### 1.1 var、let、const 区别

JavaScript 中有三种变量声明方式：var、let 和 const。它们在作用域、提升（hoisting）和可变性方面有不同的特性。

#### var 声明

```javascript
// var 声明的变量具有函数作用域
function test() {
    if (true) {
        var x = 10;
    }
    console.log(x); // 10 - var 没有块级作用域
}
test();

// var 声明的变量会被提升（hoisting）
console.log(y); // undefined - 变量提升但未赋值
var y = 5;

// var 可以重复声明
var z = 1;
var z = 2; // 不会报错
```

#### let 声明

```javascript
// let 声明的变量具有块级作用域
function test() {
    if (true) {
        let a = 10;
    }
    // console.log(a); // ReferenceError - 块级作用域
}
test();

// let 声明的变量不会被提升（TDZ - Temporal Dead Zone）
// console.log(b); // ReferenceError
let b = 5;

// let 不能在同一作用域重复声明
let c = 1;
// let c = 2; // SyntaxError
{
    let c = 2; // 不同作用域可以
}
```

#### const 声明

```javascript
// const 声明的变量具有块级作用域
const PI = 3.14159;

// const 必须在声明时初始化
// const E; // SyntaxError - 必须初始化

// const 变量不能重新赋值
const obj = { name: '张三' };
// obj = {}; // TypeError - 不能重新赋值

// 但可以修改对象的属性
obj.name = '李四'; // 允许

// 冻结对象
const frozen = Object.freeze({ name: '张三' });
// frozen.name = '李四'; // TypeError (在严格模式下)

// const 数组
const arr = [1, 2, 3];
arr.push(4); // 允许
// arr = [1, 2, 3]; // TypeError
```

### 1.2 最佳实践

```javascript
// 1. 默认使用 const
const API_URL = 'https://api.example.com';
const DEFAULT_CONFIG = { timeout: 5000 };

// 2. 需要重新赋值时使用 let
let count = 0;
count++;
count = count + 1;

// 3. 循环中使用 let
for (let i = 0; i < 5; i++) {
    setTimeout(() => console.log(i), 100); // 0,1,2,3,4
}

// 4. 使用 var 的场景（很少）
// 兼容旧代码或在需要函数作用域时

// 5. 全局变量声明（使用 window 对象）
window.appName = 'MyApp';
```

### 1.3 常见面试问题

**问题1：var 和 let、const 的主要区别是什么？**

答案：
- var 是函数作用域，let/const 是块级作用域
- var 变量会提升，let/const 存在 TDZ（暂时性死区）
- var 可以重复声明，let/const 不可以
- const 声明的变量不能重新赋值（对象属性除外）

---

## 2. 数据类型与类型转换

### 2.1 JavaScript 数据类型

JavaScript 分为两种数据类型：原始类型（Primitive）和引用类型（Object）。

#### 原始类型

```javascript
// Undefined - 未定义
let a;
console.log(typeof a); // "undefined"

// Null - 空值
let b = null;
console.log(typeof b); // "object" - 历史遗留问题

// Boolean - 布尔值
let c = true;
let d = false;

// Number - 数字（双精度浮点数）
let e = 42;
let f = 3.14;
let g = Infinity;
let h = -Infinity;
let i = NaN; // Not a Number

// BigInt - 大整数
let j = 9007199254740991n;
let k = BigInt(9007199254740991);

// String - 字符串
let l = 'Hello';
let m = "World";
let n = `模板字符串`;

// Symbol - 唯一值
let o = Symbol('description');
let p = Symbol.for('global'); // 全局 Symbol
```

#### 引用类型

```javascript
// Object - 对象
let obj = { name: '张三', age: 25 };

// Array - 数组
let arr = [1, 2, 3];

// Function - 函数
function fn() {}

// Date - 日期
let date = new Date();

// RegExp - 正则
let regex = /pattern/;

// Error - 错误
let error = new Error('message');

// Map - 映射
let map = new Map();

// Set - 集合
let set = new Set();

// WeakMap / WeakSet
let weakMap = new WeakMap();
let weakSet = new WeakSet();

// 包装对象
let str = new String('hello'); // 不推荐
let num = new Number(42);      // 不推荐
let bool = new Boolean(true);   // 不推荐
```

### 2.2 类型判断

```javascript
// typeof 操作符
console.log(typeof 42);          // "number"
console.log(typeof 'hello');    // "string"
console.log(typeof true);       // "boolean"
console.log(typeof undefined);  // "undefined"
console.log(typeof Symbol('s')); // "symbol"
console.log(typeof 123n);       // "bigint"
console.log(typeof {});         // "object"
console.log(typeof []);         // "object"
console.log(typeof function(){}); // "function"

// instanceof
console.log([] instanceof Array);      // true
console.log({} instanceof Object);    // true
console.log(new Date() instanceof Date); // true

// Object.prototype.toString
Object.prototype.toString.call(123);    // "[object Number]"
Object.prototype.toString.call('hello'); // "[object String]"
Object.prototype.toString.call(true);   // "[object Boolean]"
Object.prototype.toString.call([]);     // "[object Array]"
Object.prototype.toString.call({});     // "[object Object]"

// Array.isArray
console.log(Array.isArray([]));  // true
console.log(Array.isArray({}));  // false

// isNaN 和 Number.isNaN
console.log(isNaN(NaN));              // true
console.log(isNaN('hello'));          // true - 会转换
console.log(Number.isNaN(NaN));       // true
console.log(Number.isNaN('hello'));   // false - 不会转换

// isFinite
console.log(isFinite(42));          // true
console.log(isFinite(Infinity));    // false
console.log(Number.isFinite(42));   // true
```

### 2.3 类型转换

#### 隐式转换

```javascript
// 转换为字符串
console.log('hello' + 123);      // "hello123"
console.log('hello' + true);     // "hellotrue"
console.log('hello' + null);    // "hellonull"
console.log('hello' + undefined); // "helloundefined"

// 转换为数字
console.log('123' - 0);         // 123
console.log('123' * 1);         // 123
console.log(+'123');            // 123 (一元加号)
console.log('123px' - 0);       // NaN

// 转换为布尔值
// falsy 值：false, 0, '', null, undefined, NaN
console.log(Boolean(false));     // false
console.log(Boolean(0));         // false
console.log(Boolean(''));       // false
console.log(Boolean(null));     // false
console.log(Boolean(undefined)); // false
console.log(Boolean(NaN));      // false
console.log(Boolean('0'));      // true
console.log(Boolean([]));       // true
console.log(Boolean({}));       // true

// 隐式布尔转换（在条件中）
if ('0') console.log('truthy');
if ([]) console.log('truthy - 空数组');
if ({}) console.log('truthy - 空对象');
```

#### 显式转换

```javascript
// 转换为字符串
String(123);           // "123"
(123).toString();      // "123"
123 + '';              // "123"

// 转换为数字
Number('123');         // 123
parseInt('123');       // 123
parseFloat('123.45');  // 123.45
+'123';                // 123
~~'123';               // 123 (位运算)

// 转换为布尔值
Boolean(123);          // true
!!123;                 // true

// 转换为数组
Array.from('hello');   // ["h", "e", "l", "l", "o"]
[...'hello'];          // ["h", "e", "l", "l", "o"]
Array.of(1, 2, 3);     // [1, 2, 3]

// 转换为对象
Object(123);           // Number {123}
Object('hello');       // String {"hello"}
Object(true);         // Boolean {true}
```

#### 特殊转换规则

```javascript
// == vs ===
console.log(1 == '1');   // true - 隐式转换
console.log(1 === '1');  // false - 不转换

// 对象与原始值比较
console.log([] == '');      // true - 都转为空字符串
console.log([] === '');     // false
console.log(0 == false);    // true
console.log(0 === false);   // false
console.log(null == undefined); // true
console.log(null === undefined); // false

// JSON.stringify 的转换
console.log(JSON.stringify({a: undefined})); // "{}"
console.log(JSON.stringify({a: null}));       // {"a":null}
console.log(JSON.stringify({a: function(){}})); // "{}"
console.log(JSON.stringify([undefined]));     // "[null]"
```

### 2.4 常见面试问题

**问题1：JavaScript 有哪些数据类型？**

答案：
- 原始类型：undefined、null、boolean、number、bigint、string、symbol
- 引用类型：object（包括数组、函数、日期、正则等）

**问题2：null 和 undefined 有什么区别？**

答案：
- null 表示空值，需要手动赋值
- undefined 表示未定义，变量声明但未赋值
- typeof null 返回 'object' 是历史遗留问题

---

## 3. 作用域与闭包

### 3.1 作用域

#### 全局作用域

```javascript
// 全局变量
var globalVar = 'I am global';
let globalLet = 'Also global';
const globalConst = 'Definitely global';

// 全局函数
function globalFunction() {
    console.log('I am global');
}

// 在浏览器中
window.globalVar = 'I am on window';
```

#### 函数作用域

```javascript
function outer() {
    var functionVar = 'I am function scoped';

    function inner() {
        console.log(functionVar); // 可以访问外部变量
    }

    inner();
}
outer();
// console.log(functionVar); // ReferenceError
```

#### 块级作用域

```javascript
{
    let blockLet = 'I am block scoped';
    const blockConst = 'Also block scoped';
    var blockVar = 'I am function scoped';
}

console.log(blockLet);  // ReferenceError
console.log(blockConst); // ReferenceError
console.log(blockVar);  // "I am function scoped"

// 循环中的块级作用域
for (let i = 0; i < 3; i++) {
    setTimeout(() => console.log(i), 100);
}
// 输出: 0, 1, 2

for (var i = 0; i < 3; i++) {
    setTimeout(() => console.log(i), 100);
}
// 输出: 3, 3, 3
```

#### 作用域链

```javascript
let a = 'global';

function outer() {
    let b = 'outer';

    function inner() {
        let c = 'inner';
        console.log(a, b, c); // 逐层向外查找
    }

    inner();
}

outer(); // "global" "outer" "inner"
```

### 3.2 闭包

#### 闭包的基本概念

```javascript
// 闭包：函数能够访问外部作用域的变量
function createCounter() {
    let count = 0; // 私有变量

    return function() { // 这个函数就是闭包
        count++;
        return count;
    };
}

const counter = createCounter();
console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3

// 每次调用 createCounter 都会创建独立的闭包
const counter2 = createCounter();
console.log(counter2()); // 1
```

#### 闭包的实际应用

```javascript
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

const person = createPerson('张三');
console.log(person.getName()); // "张三"
person.setName('李四');
console.log(person.getName()); // "李四"

// 2. 函数柯里化
function curriedAdd(a) {
    return function(b) {
        return a + b;
    };
}

const add5 = curriedAdd(5);
console.log(add5(3)); // 8
console.log(add5(10)); // 15

// 3. 记忆化函数（缓存结果）
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

function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

const memoizedFibonacci = memoize(fibonacci);
console.log(memoizedFibonacci(40)); // 更快

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

#### 闭包与循环

```javascript
// 问题：循环中的闭包
for (var i = 0; i < 3; i++) {
    setTimeout(() => console.log(i), 100);
}
// 输出: 3, 3, 3 (var 是函数作用域)

// 解决方案1：使用 let
for (let i = 0; i < 3; i++) {
    setTimeout(() => console.log(i), 100);
}
// 输出: 0, 1, 2

// 解决方案2：使用 IIFE
for (var i = 0; i < 3; i++) {
    ((j) => {
        setTimeout(() => console.log(j), 100);
    })(i);
}
// 输出: 0, 1, 2

// 解决方案3：保存到数组
const functions = [];
for (var i = 0; i < 3; i++) {
    functions.push(() => console.log(i));
}
functions.forEach(fn => setTimeout(fn, 100));
// 输出: 0, 1, 2
```

### 3.3 常见面试问题

**问题1：什么是闭包？**

答案：闭包是指一个函数能够访问并记住其定义时所在作用域的变量，即使该函数在其定义的作用域之外执行。

**问题2：闭包有什么应用场景？**

答案：
- 数据封装和私有变量
- 函数柯里化
- 记忆化函数
- 节流和防抖
- 模块模式
- 保持变量不被垃圾回收

---

## 4. 原型与原型链

### 4.1 原型基础

#### prototype 属性

```javascript
// 每个函数都有 prototype 属性
function Person(name, age) {
    this.name = name;
    this.age = age;
}

// 在 prototype 上添加方法
Person.prototype.greet = function() {
    return `Hello, I'm ${this.name}`;
};

Person.prototype.getAge = function() {
    return this.age;
};

// 创建实例
const person = new Person('张三', 25);
console.log(person.name);        // "张三"
console.log(person.greet());     // "Hello, I'm 张三"

// 实例可以访问 prototype 上的方法
console.log(person.__proto__ === Person.prototype); // true
```

#### __proto__ 和 Object.getPrototypeOf

```javascript
const obj = {};
const arr = [];

// __proto__ 是对象访问原型的直接方式
console.log(obj.__proto__ === Object.prototype); // true
console.log(arr.__proto__ === Array.prototype);  // true

// 推荐使用 Object.getPrototypeOf
console.log(Object.getPrototypeOf(obj) === Object.prototype); // true
console.log(Object.getPrototypeOf(arr) === Array.prototype);  // true

// 修改原型
const parent = { greet: () => 'Hello' };
const child = { __proto__: parent };
console.log(child.greet()); // "Hello"
```

### 4.2 原型链

```javascript
// 原型链结构
// object -> Object.prototype -> null
// array -> Array.prototype -> Object.prototype -> null
// function -> Function.prototype -> Object.prototype -> null

// 示例：原型链查找
const arr = [1, 2, 3];

// arr -> Array.prototype -> Object.prototype -> null
console.log(arr.hasOwnProperty('length')); // true (Array.prototype)
console.log(arr.hasOwnProperty('toString')); // false (Object.prototype)

// 自定义原型链
function Animal(name) {
    this.name = name;
}

Animal.prototype.speak = function() {
    return `${this.name} makes a sound`;
};

function Dog(name, breed) {
    Animal.call(this, name); // 调用父构造函数
    this.breed = breed;
}

// 建立原型链
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;

// 重写父方法
Dog.prototype.speak = function() {
    return `${this.name} barks`;
};

Dog.prototype.fetch = function() {
    return `${this.name} fetches the ball`;
};

const dog = new Dog('旺财', '金毛');
console.log(dog.name);     // "旺财"
console.log(dog.speak());  // "旺财 barks"
console.log(dog.fetch());  // "旺财 fetches the ball"
console.log(dog instanceof Dog);    // true
console.log(dog instanceof Animal); // true
console.log(dog instanceof Object); // true
```

### 4.3 ES6 类

```javascript
class Animal {
    constructor(name) {
        this.name = name;
    }

    speak() {
        return `${this.name} makes a sound`;
    }
}

class Dog extends Animal {
    constructor(name, breed) {
        super(name); // 调用父构造函数
        this.breed = breed;
    }

    speak() {
        return `${this.name} barks`;
    }

    fetch() {
        return `${this.name} fetches the ball`;
    }

    // 静态方法
    static create(name, breed) {
        return new Dog(name, breed);
    }
}

const dog = Dog.create('旺财', '金毛');
console.log(dog.name);     // "旺财"
console.log(dog.speak());  // "旺财 barks"
```

### 4.4 常见面试问题

**问题1：什么是原型链？**

答案：每个对象都有一个指向其原型对象的指针，当访问对象的属性或方法时，如果对象本身没有，会沿着原型链向上查找，直到找到或到达 null 为止。

**问题2：new 操作符做了什么？**

答案：
1. 创建新对象
2. 将新对象的 __proto__ 指向构造函数的 prototype
3. 执行构造函数（this 指向新对象）
4. 返回新对象（如果构造函数返回对象则返回该对象）

---

## 5. 异步编程

### 5.1 Promise

#### Promise 基础

```javascript
// 创建 Promise
const promise = new Promise((resolve, reject) => {
    // 异步操作
    const success = true;

    if (success) {
        resolve('成功结果');
    } else {
        reject(new Error('失败原因'));
    }
});

// 使用 Promise
promise
    .then(result => {
        console.log(result); // "成功结果"
    })
    .catch(error => {
        console.error(error); // Error: 失败原因
    })
    .finally(() => {
        console.log('完成'); // 无论成功或失败都会执行
    });
```

#### Promise 静态方法

```javascript
// Promise.resolve()
Promise.resolve('直接解决').then(console.log);

// Promise.reject()
Promise.reject(new Error('直接拒绝')).catch(console.error);

// Promise.all() - 全部完成
const p1 = Promise.resolve(1);
const p2 = Promise.resolve(2);
const p3 = Promise.resolve(3);

Promise.all([p1, p2, p3]).then(console.log); // [1, 2, 3]

// Promise.allSettled() - 全部结束（无论成功或失败）
const promises = [
    Promise.resolve(1),
    Promise.reject('error'),
    Promise.resolve(3)
];

Promise.allSettled(promises).then(results => {
    results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
            console.log(`p${i+1}: ${r.value}`);
        } else {
            console.log(`p${i+1}: ${r.reason}`);
        }
    });
});

// Promise.race() - 第一个完成（无论成功或失败）
Promise.race([
    new Promise(r => setTimeout(() => r(1), 100)),
    new Promise(r => setTimeout(() => r(2), 50))
]).then(console.log); // 2

// Promise.any() - 第一个成功
Promise.any([
    Promise.reject('error'),
    Promise.resolve(2),
    Promise.resolve(1)
]).then(console.log); // 2 (第一个成功的)
```

### 5.2 async/await

#### async/await 基础

```javascript
// async 函数
async function fetchData() {
    return '数据';
}

fetchData().then(console.log); // "数据"

// await 等待 Promise
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log('开始');
    await delay(1000);
    console.log('1秒后');
    console.log('完成');
}

main();

// try-catch 错误处理
async function fetchUser(id) {
    try {
        const response = await fetch(`/api/users/${id}`);
        const user = await response.json();
        return user;
    } catch (error) {
        console.error('获取用户失败:', error);
        throw error;
    }
}
```

#### 并行执行

```javascript
// 串行执行（一个接一个）
async function serial() {
    const result1 = await fetch('/api/user');
    const result2 = await fetch('/api/posts');
    // ...
}

// 并行执行（同时发起）
async function parallel() {
    const [user, posts] = await Promise.all([
        fetch('/api/user').then(r => r.json()),
        fetch('/api/posts').then(r => r.json())
    ]);
    // ...
}

// Promise.allSettled 并行
async function fetchAll() {
    const results = await Promise.allSettled([
        fetch('/api/users/1').then(r => r.json()),
        fetch('/api/users/2').then(r => r.json())
    ]);

    results.forEach(result => {
        if (result.status === 'fulfilled') {
            console.log(result.value);
        } else {
            console.error(result.reason);
        }
    });
}
```

### 5.3 事件循环

#### 宏任务和微任务

```javascript
console.log('1 - 同步');

setTimeout(() => console.log('2 - setTimeout'), 0);

Promise.resolve().then(() => console.log('3 - Promise'));

requestAnimationFrame(() => console.log('4 - rAF'));

console.log('5 - 同步');

// 执行顺序：
// 1 - 同步
// 5 - 同步
// 3 - Promise (微任务)
// 2 - setTimeout (宏任务)
// 4 - rAF (宏任务，但在下一个宏任务之前执行)
```

#### async/await 中的微任务

```javascript
async function example() {
    console.log('1');
    await console.log('2');
    console.log('3');
}

example();
console.log('4');

// 1
// 2
// 4
// 3

// await 相当于创建了一个微任务
async function example2() {
    console.log('1');
    await Promise.resolve();
    console.log('2');
}

example2();
console.log('3');

// 1
// 3
// 2
```

### 5.4 常见面试问题

**问题1：Promise 和 async/await 有什么区别？**

答案：
- Promise 是异步编程的底层 API
- async/await 是 Promise 的语法糖，让异步代码更像同步代码
- async/await 错误处理使用 try-catch 更直观
- async/await 更好地支持调试

**问题2：事件循环中，微任务和宏任务有什么区别？**

答案：
- 微任务：Promise 回调、MutationObserver、queueMicrotask
- 宏任务：setTimeout、setInterval、I/O、UI rendering
- 每个宏任务执行完后，会清空所有微任务
- 微任务优先级更高，会在下一个宏任务之前全部执行完

---

## 6. DOM操作与事件委托

### 6.1 DOM 选择器

#### 选择单个元素

```javascript
// 通过 ID 选择（最快）
const header = document.getElementById('header');

// 通过类名选择（返回 HTMLCollection）
const buttons = document.getElementsByClassName('btn');

// 通过标签名选择（返回 HTMLCollection）
const paragraphs = document.getElementsByTagName('p');

// 现代选择器（返回单个元素或 null）
const container = document.querySelector('.container');
const firstButton = document.querySelector('button');
```

#### 选择多个元素

```javascript
// querySelectorAll（返回 NodeList）
const buttons = document.querySelectorAll('.btn');
const listItems = document.querySelectorAll('ul li');

// NodeList 遍历
buttons.forEach((btn, index) => {
    console.log(`Button ${index}:`, btn);
});

// HTMLCollection 转数组
const arr = Array.from(document.getElementsByClassName('item'));

// 选择器性能
// ID > 标签 > 类 > 属性 > 伪类 > 通用选择器
```

### 6.2 DOM 操作

#### 创建元素

```javascript
// 创建元素
const div = document.createElement('div');
div.className = 'container';
div.textContent = 'Hello World';
div.innerHTML = '<span>Hello</span>';

// 克隆元素
const clone = div.cloneNode(true); // 深克隆
const shallowClone = div.cloneNode(false); // 浅克隆

// 创建文档片段（性能优化）
const fragment = document.createDocumentFragment();
for (let i = 0; i < 100; i++) {
    const item = document.createElement('div');
    item.textContent = `Item ${i}`;
    fragment.appendChild(item);
}
document.querySelector('.container').appendChild(fragment);
```

#### 操作元素

```javascript
const element = document.querySelector('.element');

// 内容操作
element.textContent = '纯文本';
element.innerHTML = '<strong>HTML</strong>';

// 属性操作
element.setAttribute('data-id', '123');
element.getAttribute('data-id');
element.removeAttribute('data-id');
element.hasAttribute('data-id');

// 类操作
element.classList.add('active');
element.classList.remove('active');
element.classList.toggle('active');
element.classList.contains('active');

// 样式操作
element.style.color = 'red';
element.style.backgroundColor = '#fff';
element.style.cssText = 'color: red; background: white;';

// 数据属性
element.dataset.userId = '123';
console.log(element.dataset.userId);
```

#### 插入和删除

```javascript
const parent = document.querySelector('.parent');
const newElement = document.createElement('div');

// 插入
parent.appendChild(newElement);           // 末尾添加
parent.insertBefore(newElement, null);   // 插入到指定位置

// 现代插入方法（支持字符串）
parent.insertAdjacentHTML('beforeend', '<div>HTML</div>');
parent.insertAdjacentText('beforeend', 'Text');
parent.insertAdjacentElement('beforeend', newElement);

/*
 * insertAdjacentHTML 位置：
 * 'beforebegin' - 元素前面
 * 'afterbegin' - 元素内部的开始
 * 'beforeend' - 元素内部的末尾
 * 'afterend' - 元素后面
 */

// 删除
element.remove();         // 现代方法
parent.removeChild(element); // 传统方法

// 替换
parent.replaceChild(newElement, oldElement);
element.replaceWith(newElement);
```

### 6.3 事件处理

#### 事件绑定

```javascript
const button = document.querySelector('button');

// DOM0 级事件处理程序
button.onclick = function(event) {
    console.log('Clicked!', event.target);
};

// DOM2 级事件处理程序
button.addEventListener('click', function(event) {
    console.log('Clicked!', event.target);
}, false);

// 箭头函数（this 指向问题）
button.addEventListener('click', (event) => {
    console.log(this); // window 或 undefined
});

// 移除事件
function handler(event) {
    console.log('Clicked!');
}
button.addEventListener('click', handler);
button.removeEventListener('click', handler);

// 一次性事件
button.addEventListener('click', function handler(event) {
    console.log('只执行一次');
    button.removeEventListener('click', handler);
}, { once: true });
```

#### 事件对象

```javascript
document.querySelector('.container').addEventListener('click', function(event) {
    // 事件属性
    event.type;           // 事件类型
    event.target;         // 触发事件的元素
    event.currentTarget;  // 绑定事件的元素
    event.timeStamp;      // 事件时间戳

    // 阻止默认行为
    event.preventDefault();

    // 停止冒泡
    event.stopPropagation();

    // 停止冒泡 + 阻止默认行为
    event.stopImmediatePropagation();

    // 事件阶段
    event.eventPhase; // 1=捕获, 2=目标, 3=冒泡
});
```

### 6.4 事件委托

```javascript
// 事件委托的原理：把事件绑定到父元素，利用事件冒泡处理子元素的事件

// 不使用事件委托（每个子元素都绑定）
document.querySelectorAll('.item').forEach(item => {
    item.addEventListener('click', handleClick);
});

// 使用事件委托（绑定到父元素）
const list = document.querySelector('.list');

list.addEventListener('click', function(event) {
    // event.target 可能是 .item 或其子元素
    const item = event.target.closest('.item');

    if (item) {
        handleClick(event, item);
    }
});

function handleClick(event, item) {
    console.log('Clicked:', item.textContent);
}

// 事件委托的优点：
// 1. 减少事件绑定数量
// 2. 动态添加的元素也能处理
// 3. 减少内存占用
```

### 6.5 常见面试问题

**问题1：事件委托有什么优点？**

答案：
- 减少内存占用：只需绑定一个事件处理器
- 动态元素支持：新添加的子元素也能自动获得事件处理
- 代码简化：无需为每个子元素单独绑定

**问题2：事件冒泡和事件捕获有什么区别？**

答案：
- 事件冒泡：从内向外（目标 -> 父元素 -> ...）
- 事件捕获：从外向内（父元素 -> ... -> 目标）
- 第三个参数：true 为捕获阶段，false（默认）为冒泡阶段

---

## 7. 模块化

### 7.1 CommonJS

#### 导出

```javascript
// 导出单个值
module.exports = function() {
    return 'Hello';
};

// 导出多个值
module.exports = {
    name: 'MyModule',
    version: '1.0.0',
    greet() {
        return 'Hello';
    }
};

// 导出引用
exports.name = 'MyModule';
exports.version = '1.0.0';
```

#### 导入

```javascript
// 导入整个模块
const myModule = require('./myModule');

// 导入单个导出
const greet = require('./myModule').greet;

// 解构导入
const { name, version, greet } = require('./myModule');
```

### 7.2 ES Modules

#### 导出

```javascript
// 命名导出
export const name = 'MyModule';
export const version = '1.0.0';
export function greet() {
    return 'Hello';
}

// 默认导出
export default function() {
    return 'Default Export';
}

// 组合导出
export const name = 'MyModule';
export default function() {
    return 'Default';
}
```

#### 导入

```javascript
// 命名导入
import { name, version, greet } from './myModule';

// 导入时重命名
import { name as moduleName } from './myModule';

// 默认导入
import myModule from './myModule';

// 组合导入
import myDefault, { name, version } from './myModule';

// 导入所有
import * as myModule from './myModule';

// 动态导入
const module = await import('./myModule');
```

### 7.3 模块加载

```html
<!-- 浏览器中使用 ES Modules -->
<script type="module" src="./main.js"></script>

<!-- 延迟加载 -->
<script type="module" src="./main.js" defer></script>
```

```javascript
// 动态导入
async function loadModule() {
    if (needsFeature) {
        const { feature } = await import('./feature.js');
        feature.init();
    }
}

// import() 返回 Promise，适合代码分割
```

### 7.4 常见面试问题

**问题1：CommonJS 和 ES Modules 有什么区别？**

答案：
- CommonJS：同步加载，运行时解析
- ES Modules：异步加载，编译时解析
- CommonJS 可以修改导出值，ES Modules 不行
- ES Modules 支持 tree shaking

**问题2：什么是 tree shaking？**

答案：tree shaking 是打包工具（如 Webpack、Rollup）通过静态分析代码，移除未使用的导出，从而减小打包体积的功能。它依赖于 ES Modules 的静态结构。

---

## 8. 高级实战案例

### 8.1 深拷贝实现

```javascript
/**
 * 完整的深拷贝实现
 * 支持各种数据类型和循环引用
 */
function deepClone(value, visited = new WeakMap()) {
    // 处理原始类型和 null/undefined
    if (value === null || typeof value !== 'object') {
        return value;
    }

    // 处理循环引用
    if (visited.has(value)) {
        return visited.get(value);
    }

    // 处理日期对象
    if (value instanceof Date) {
        return new Date(value);
    }

    // 处理正则表达式
    if (value instanceof RegExp) {
        return new RegExp(value.source, value.flags);
    }

    // 处理 Map
    if (value instanceof Map) {
        const clonedMap = new Map();
        visited.set(value, clonedMap);
        value.forEach((val, key) => {
            clonedMap.set(deepClone(key, visited), deepClone(val, visited));
        });
        return clonedMap;
    }

    // 处理 Set
    if (value instanceof Set) {
        const clonedSet = new Set();
        visited.set(value, clonedSet);
        value.forEach(val => {
            clonedSet.add(deepClone(val, visited));
        });
        return clonedSet;
    }

    // 处理数组
    if (Array.isArray(value)) {
        const clonedArray = [];
        visited.set(value, clonedArray);
        for (let i = 0; i < value.length; i++) {
            clonedArray[i] = deepClone(value[i], visited);
        }
        return clonedArray;
    }

    // 处理普通对象
    const clonedObject = Object.create(Object.getPrototypeOf(value));
    visited.set(value, clonedObject);

    // 处理 Symbol 键
    const symbolKeys = Object.getOwnPropertySymbols(value);
    for (const key of symbolKeys) {
        clonedObject[key] = deepClone(value[key], visited);
    }

    // 处理普通键
    for (const key in value) {
        if (value.hasOwnProperty(key)) {
            clonedObject[key] = deepClone(value[key], visited);
        }
    }

    return clonedObject;
}

// 使用示例
const original = {
    name: '张三',
    age: 25,
    hobbies: ['reading', 'coding'],
    info: {
        address: {
            city: '北京'
        }
    },
    date: new Date(),
    regex: /pattern/g,
    map: new Map([['key', 'value']]),
    set: new Set([1, 2, 3])
};

// 添加循环引用
original.self = original;

const cloned = deepClone(original);
console.log(cloned);
console.log(cloned.self === cloned); // true
```

### 8.2 发布订阅模式实现

```javascript
/**
 * 发布订阅模式（EventEmitter）
 * 支持一次性订阅、命名空间、错误处理
 */
class EventEmitter {
    constructor() {
        this.events = new Map();
        this.maxListeners = 100; // 最大监听器数量
    }

    // 订阅事件
    on(event, callback, options = {}) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }

        const listeners = this.events.get(event);

        // 检查监听器数量限制
        if (listeners.length >= this.maxListeners) {
            console.warn(`警告：事件 "${event}" 的监听器数量超过最大限制`);
        }

        const listener = {
            callback,
            once: options.once || false,
            priority: options.priority || 0
        };

        listeners.push(listener);

        // 按优先级排序
        listeners.sort((a, b) => b.priority - a.priority);

        // 返回取消订阅函数
        return () => this.off(event, callback);
    }

    // 一次性订阅
    once(event, callback, options = {}) {
        return this.on(event, callback, { ...options, once: true });
    }

    // 取消订阅
    off(event, callback) {
        if (!this.events.has(event)) return;

        if (callback) {
            const listeners = this.events.get(event);
            const index = listeners.findIndex(l => l.callback === callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        } else {
            this.events.delete(event);
        }
    }

    // 发布事件
    emit(event, ...args) {
        if (!this.events.has(event)) return false;

        const listeners = this.events.get(event);
        const toRemove = [];

        for (const listener of listeners) {
            try {
                listener.callback(...args);
                if (listener.once) {
                    toRemove.push(listener);
                }
            } catch (error) {
                console.error(`事件 "${event}" 处理出错:`, error);
            }
        }

        // 移除一次性监听器
        for (const listener of toRemove) {
            this.off(event, listener.callback);
        }

        return true;
    }

    // 异步发布
    async emitAsync(event, ...args) {
        if (!this.events.has(event)) return [];

        const listeners = this.events.get(event);
        const results = [];

        for (const listener of listeners) {
            try {
                const result = await listener.callback(...args);
                results.push(result);
            } catch (error) {
                console.error(`事件 "${event}" 异步处理出错:`, error);
            }
        }

        return results;
    }

    // 获取事件监听器数量
    listenerCount(event) {
        return this.events.has(event) ? this.events.get(event).length : 0;
    }

    // 移除所有事件监听器
    removeAllListeners(event) {
        if (event) {
            this.events.delete(event);
        } else {
            this.events.clear();
        }
    }

    // 获取所有事件名
    eventNames() {
        return Array.from(this.events.keys());
    }
}

// 使用示例
const emitter = new EventEmitter();

// 订阅事件
const unsubscribe = emitter.on('userCreated', (user) => {
    console.log('用户创建:', user);
    // 发送欢迎邮件
    sendWelcomeEmail(user.email);
});

// 一次性订阅
emitter.once('userDeleted', (userId) => {
    console.log('用户删除:', userId);
});

// 带优先级的订阅
emitter.on('orderCreated', (order) => {
    console.log('记录日志');
}, { priority: 10 });

emitter.on('orderCreated', (order) => {
    console.log('发送通知');
}, { priority: 5 });

// 发布事件
emitter.emit('userCreated', { id: 1, name: '张三', email: 'zhangsan@example.com' });

// 取消订阅
unsubscribe();
```

### 8.3 防抖与节流实现

```javascript
/**
 * 防抖函数
 * @param {Function} fn - 要执行的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @param {Object} options - 配置选项
 * @returns {Function} 防抖后的函数
 */
function debounce(fn, delay, options = {}) {
    let timer = null;
    let lastArgs = null;
    let lastThis = null;

    const { leading = false, trailing = true, maxWait } = options;
    let maxWaitTimer = null;

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

        // 清除之前的定时器
        clearTimeout(timer);
        clearTimeout(maxWaitTimer);

        // 立即执行（leading）
        if (leading && !timer) {
            invoke();
        }

        // 设置延迟执行
        timer = setTimeout(() => {
            if (trailing) {
                invoke();
            }
            timer = null;
        }, delay);

        // 最大等待时间
        if (maxWait && !maxWaitTimer) {
            maxWaitTimer = setTimeout(() => {
                invoke();
                maxWaitTimer = null;
            }, maxWait);
        }
    }

    // 取消执行
    debounced.cancel = function() {
        clearTimeout(timer);
        clearTimeout(maxWaitTimer);
        timer = null;
        maxWaitTimer = null;
        lastArgs = null;
        lastThis = null;
    };

    // 立即执行
    debounced.flush = function() {
        invoke();
        this.cancel();
    };

    return debounced;
}

/**
 * 节流函数
 * @param {Function} fn - 要执行的函数
 * @param {number} interval - 间隔时间（毫秒）
 * @param {Object} options - 配置选项
 * @returns {Function} 节流后的函数
 */
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

        // 第一次调用且不需要立即执行
        if (!lastTime && !leading) {
            lastTime = now;
        }

        const remaining = interval - (now - lastTime);
        lastArgs = args;
        lastThis = this;

        // 可以立即执行
        if (remaining <= 0 || remaining > interval) {
            clearTimeout(timer);
            timer = null;
            invoke();
        }
        // 设置延迟执行（trailing）
        else if (!timer && trailing) {
            timer = setTimeout(() => {
                invoke();
                timer = null;
            }, remaining);
        }
    }

    // 取消执行
    throttled.cancel = function() {
        clearTimeout(timer);
        timer = null;
        lastTime = 0;
        lastArgs = null;
        lastThis = null;
    };

    return throttled;
}

// 使用示例
// 搜索输入防抖
const searchInput = document.querySelector('#search');
const debouncedSearch = debounce((query) => {
    fetch(`/api/search?q=${query}`)
        .then(res => res.json())
        .then(data => console.log(data));
}, 300);

searchInput.addEventListener('input', (e) => {
    debouncedSearch(e.target.value);
});

// 滚动事件节流
const throttledScroll = throttle((scrollY) => {
    console.log('滚动位置:', scrollY);
    // 更新导航栏状态等
}, 100);

window.addEventListener('scroll', () => {
    throttledScroll(window.scrollY);
});
```

### 8.4 函数柯里化实现

```javascript
/**
 * 函数柯里化
 * 将多参数函数转换为一系列单参数函数
 */
function curry(fn, arity = fn.length) {
    return function curried(...args) {
        // 参数足够，执行原函数
        if (args.length >= arity) {
            return fn.apply(this, args);
        }

        // 参数不足，返回新函数继续收集参数
        return function(...moreArgs) {
            return curried.apply(this, [...args, ...moreArgs]);
        };
    };
}

// 使用示例
function add(a, b, c) {
    return a + b + c;
}

const curriedAdd = curry(add);

console.log(curriedAdd(1)(2)(3));     // 6
console.log(curriedAdd(1, 2)(3));     // 6
console.log(curriedAdd(1)(2, 3));     // 6
console.log(curriedAdd(1, 2, 3));     // 6

// 实际应用：创建可复用的函数
const multiply = curry((a, b, c) => a * b * c);
const double = multiply(2);
const quadruple = double(2);

console.log(quadruple(3)); // 12

// 实际应用：格式化函数
const formatCurrency = curry((symbol, decimals, number) => {
    return `${symbol}${number.toFixed(decimals)}`;
});

const formatUSD = formatCurrency('$', 2);
const formatCNY = formatCurrency('¥', 2);

console.log(formatUSD(123.456)); // "$123.46"
console.log(formatCNY(123.456)); // "¥123.46"

// 实际应用：API 请求
const request = curry((method, url, data) => {
    return fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
});

const post = request('POST');
const postUser = post('/api/users');

postUser({ name: '张三', email: 'zhangsan@example.com' });
```

### 8.5 模板引擎实现

```javascript
/**
 * 简单模板引擎
 * 支持 {{ variable }} 和 {% if condition %}...{% endif %} 语法
 */
class TemplateEngine {
    constructor() {
        this.cache = new Map();
    }

    // 编译模板
    compile(template) {
        if (this.cache.has(template)) {
            return this.cache.get(template);
        }

        // 转义特殊字符
        const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // 构建函数体
        let code = 'let result = [];\n';

        // 解析模板
        let lastIndex = 0;
        const regex = /\{\{(.+?)\}\}|\{%\s*(.+?)\s*%\}/g;
        let match;

        while ((match = regex.exec(template)) !== null) {
            // 添加普通文本
            if (match.index > lastIndex) {
                const text = template.slice(lastIndex, match.index);
                code += `result.push("${this.escape(text)}");\n`;
            }

            if (match[1]) {
                // 变量插值 {{ variable }}
                code += `result.push(this.escape(${match[1].trim()} || ''));\n`;
            } else if (match[2]) {
                // 控制语句 {% ... %}
                const statement = match[2].trim();

                if (statement.startsWith('if ')) {
                    code += `if (${statement.slice(3)}) {\n`;
                } else if (statement === 'else') {
                    code += '} else {\n';
                } else if (statement === 'endif') {
                    code += '}\n';
                } else if (statement.startsWith('for ')) {
                    const [, item, list] = statement.match(/for\s+(\w+)\s+in\s+(\w+)/) || [];
                    if (item && list) {
                        code += `for (const ${item} of ${list}) {\n`;
                    }
                } else if (statement === 'endfor') {
                    code += '}\n';
                }
            }

            lastIndex = regex.lastIndex;
        }

        // 添加剩余文本
        if (lastIndex < template.length) {
            code += `result.push("${this.escape(template.slice(lastIndex))}");\n`;
        }

        code += 'return result.join("");';

        // 创建渲染函数
        const render = new Function('data', `
            with (data) {
                ${code}
            }
        `).bind(this);

        this.cache.set(template, render);
        return render;
    }

    // 渲染模板
    render(template, data) {
        const renderFn = this.compile(template);
        return renderFn(data);
    }

    // HTML 转义
    escape(str) {
        if (typeof str !== 'string') return str;
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return str.replace(/[&<>"']/g, char => escapeMap[char]);
    }
}

// 使用示例
const engine = new TemplateEngine();

const template = `
<div class="user-card">
    <h2>{{ name }}</h2>
    <p>邮箱：{{ email }}</p>
    {% if isAdmin %}
    <span class="badge">管理员</span>
    {% endif %}
    <ul>
    {% for hobby in hobbies %}
        <li>{{ hobby }}</li>
    {% endfor %}
    </ul>
</div>
`;

const html = engine.render(template, {
    name: '张三',
    email: 'zhangsan@example.com',
    isAdmin: true,
    hobbies: ['阅读', '编程', '旅行']
});

console.log(html);
```

---

## 9. 性能优化技巧

### 9.1 内存管理

```javascript
// 1. 避免全局变量
// ❌ 不好的做法
var globalVar = 'I am global';

// ✅ 好的做法
(function() {
    const localVar = 'I am local';
})();

// 2. 及时清理引用
function createHandler() {
    const largeData = new Array(1000000).fill('data');

    return function handler() {
        // 使用 largeData
        console.log(largeData.length);

        // 使用完后清理
        largeData = null;
    };
}

// 3. 使用 WeakMap/WeakSet 避免内存泄漏
const weakMap = new WeakMap();

function attachData(element, data) {
    weakMap.set(element, data);
}

// 当 element 被垃圾回收时，data 也会被自动清理

// 4. 避免闭包内存泄漏
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

// 5. 使用对象池
class ObjectPool {
    constructor(createFn, resetFn, initialSize = 10) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];

        // 预创建对象
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(createFn());
        }
    }

    acquire() {
        return this.pool.length > 0 ? this.pool.pop() : this.createFn();
    }

    release(obj) {
        this.resetFn(obj);
        this.pool.push(obj);
    }
}

// 使用对象池
const vectorPool = new ObjectPool(
    () => ({ x: 0, y: 0 }),
    (v) => { v.x = 0; v.y = 0; }
);

const v = vectorPool.acquire();
v.x = 10;
v.y = 20;
// 使用完后释放
vectorPool.release(v);
```

### 9.2 循环优化

```javascript
// 1. 缓存数组长度
// ❌ 不好的做法
for (let i = 0; i < array.length; i++) {
    // 每次迭代都会访问 array.length
}

// ✅ 好的做法
for (let i = 0, len = array.length; i < len; i++) {
    // 只访问一次
}

// 2. 使用更快的循环方式
// 性能对比：for > while > for...of > forEach > for...in

// 最快的循环
for (let i = 0, len = array.length; i < len; i++) {
    process(array[i]);
}

// 3. 减少循环内操作
// ❌ 不好的做法
for (let i = 0; i < array.length; i++) {
    const result = heavyComputation(array[i]);
    process(result);
}

// ✅ 好的做法：提取不变的计算
const cachedResult = heavyComputation();
for (let i = 0; i < array.length; i++) {
    process(cachedResult, array[i]);
}

// 4. 使用 continue 减少嵌套
// ❌ 不好的做法
for (const item of items) {
    if (condition1) {
        if (condition2) {
            // 处理逻辑
        }
    }
}

// ✅ 好的做法
for (const item of items) {
    if (!condition1) continue;
    if (!condition2) continue;
    // 处理逻辑
}

// 5. 批量处理 DOM 操作
// ❌ 不好的做法：每次循环都操作 DOM
for (let i = 0; i < items.length; i++) {
    const div = document.createElement('div');
    div.textContent = items[i];
    container.appendChild(div);
}

// ✅ 好的做法：使用文档片段
const fragment = document.createDocumentFragment();
for (let i = 0; i < items.length; i++) {
    const div = document.createElement('div');
    div.textContent = items[i];
    fragment.appendChild(div);
}
container.appendChild(fragment);
```

### 9.3 函数优化

```javascript
// 1. 避免在循环中创建函数
// ❌ 不好的做法
for (let i = 0; i < elements.length; i++) {
    elements[i].addEventListener('click', function() {
        console.log(i);
    });
}

// ✅ 好的做法：使用事件委托
container.addEventListener('click', function(e) {
    const element = e.target.closest('.element');
    if (element) {
        console.log(element.dataset.index);
    }
});

// 2. 使用函数记忆化
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

// 使用记忆化优化递归
const memoizedFibonacci = memoize(function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
});

// 3. 惰性函数
function createXHR() {
    if (typeof XMLHttpRequest !== 'undefined') {
        createXHR = function() {
            return new XMLHttpRequest();
        };
    } else {
        createXHR = function() {
            return new ActiveXObject('Microsoft.XMLHTTP');
        };
    }
    return createXHR();
}

// 4. 函数绑定优化
class EventEmitter {
    constructor() {
        this.events = {};
        // 预绑定方法
        this.emit = this.emit.bind(this);
        this.on = this.on.bind(this);
    }

    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    emit(event, ...args) {
        if (this.events[event]) {
            this.events[event].forEach(cb => cb(...args));
        }
    }
}
```

---

## 10. 常见陷阱与最佳实践

### 10.1 常见陷阱

#### 陷阱1：this 指向问题

```javascript
// 问题：回调函数中 this 丢失
const obj = {
    name: '张三',
    greet() {
        console.log(`Hello, ${this.name}`);
    }
};

setTimeout(obj.greet, 100); // "Hello, undefined"

// 解决方案1：使用 bind
setTimeout(obj.greet.bind(obj), 100);

// 解决方案2：使用箭头函数
setTimeout(() => obj.greet(), 100);

// 解决方案3：在构造函数中绑定
class Person {
    constructor(name) {
        this.name = name;
        this.greet = this.greet.bind(this);
    }

    greet() {
        console.log(`Hello, ${this.name}`);
    }
}
```

#### 陷阱2：浮点数精度问题

```javascript
// 问题：浮点数计算不精确
console.log(0.1 + 0.2); // 0.30000000000000004
console.log(0.1 + 0.2 === 0.3); // false

// 解决方案1：使用整数运算
function add(a, b) {
    const precision = Math.max(
        (a.toString().split('.')[1] || '').length,
        (b.toString().split('.')[1] || '').length
    );
    const multiplier = Math.pow(10, precision);
    return (Math.round(a * multiplier) + Math.round(b * multiplier)) / multiplier;
}

// 解决方案2：使用 toFixed
function add(a, b) {
    return parseFloat((a + b).toFixed(10));
}

// 解决方案3：使用第三方库（如 decimal.js）
```

#### 陷阱3：数组排序问题

```javascript
// 问题：默认排序是字符串排序
const numbers = [1, 10, 2, 21, 3];
numbers.sort(); // [1, 10, 2, 21, 3] - 错误结果

// 解决方案：提供比较函数
numbers.sort((a, b) => a - b); // [1, 2, 3, 10, 21]

// 对象数组排序
const users = [
    { name: '张三', age: 25 },
    { name: '李四', age: 20 },
    { name: '王五', age: 30 }
];

users.sort((a, b) => a.age - b.age);
```

#### 陷阱4：对象引用问题

```javascript
// 问题：对象是引用类型
const obj1 = { a: 1 };
const obj2 = obj1;
obj2.a = 2;
console.log(obj1.a); // 2 - obj1 也被修改了

// 解决方案：深拷贝
const obj3 = JSON.parse(JSON.stringify(obj1));
// 或使用 structuredClone（现代浏览器）
const obj4 = structuredClone(obj1);
```

#### 陷阱5：异步循环问题

```javascript
// 问题：循环中的异步
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

// 解决方案3：使用 forEach
[0, 1, 2].forEach(i => {
    setTimeout(() => console.log(i), 100);
});
```

### 10.2 最佳实践清单

```markdown
## JavaScript 最佳实践清单

### 变量声明
- [ ] 优先使用 const，需要重新赋值时使用 let
- [ ] 避免使用 var
- [ ] 变量声明放在作用域顶部
- [ ] 使用有意义的变量名

### 函数
- [ ] 函数单一职责
- [ ] 使用箭头函数处理回调
- [ ] 为函数参数设置默认值
- [ ] 使用解构提取参数

### 异步
- [ ] 优先使用 async/await
- [ ] 正确处理错误（try/catch）
- [ ] 并行操作使用 Promise.all
- [ ] 避免回调地狱

### 性能
- [ ] 避免在循环中创建函数
- [ ] 使用事件委托
- [ ] 使用防抖/节流
- [ ] 及时清理不需要的引用

### 代码质量
- [ ] 使用严格模式（'use strict'）
- [ ] 避免全局变量
- [ ] 使用类型检查（===）
- [ ] 添加必要的注释
```

---

## 11. 面试高频问题汇总

### 11.1 基础问题

**问题1：JavaScript 有哪些数据类型？**

答案：
- 原始类型：undefined、null、boolean、number、bigint、string、symbol
- 引用类型：object（包括数组、函数、日期、正则等）

**问题2：== 和 === 有什么区别？**

答案：
- `==` 会进行类型转换后比较
- `===` 不会进行类型转换，类型不同直接返回 false
- 推荐使用 `===`

**问题3：什么是闭包？有什么应用场景？**

答案：
闭包是指函数能够访问其定义时所在作用域的变量，即使该函数在其定义的作用域之外执行。

应用场景：
- 数据封装和私有变量
- 函数柯里化
- 模块模式
- 回调函数和事件处理

### 11.2 进阶问题

**问题4：什么是原型链？**

答案：
每个对象都有一个指向其原型对象的指针，当访问对象的属性或方法时，如果对象本身没有，会沿着原型链向上查找，直到找到或到达 null 为止。

**问题5：JavaScript 是单线程的，如何实现异步？**

答案：
JavaScript 使用事件循环机制实现异步：
1. 同步代码在主线程执行
2. 异步操作交给 Web APIs 处理
3. 回调函数放入任务队列
4. 主线程空闲时，从任务队列取出回调执行

**问题6：什么是事件委托？有什么优点？**

答案：
事件委托是将事件监听器绑定到父元素，利用事件冒泡机制处理子元素的事件。

优点：
- 减少事件绑定数量
- 动态添加的元素也能处理事件
- 减少内存占用

---

## 12. 可视化图表

### 12.1 JavaScript 数据类型图

```
┌─────────────────────────────────────────────────────────────────────┐
│                      JavaScript 数据类型                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    原始类型 (Primitive)                      │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  undefined    - 未定义                                       │   │
│  │  null         - 空值                                         │   │
│  │  boolean      - 布尔值 (true/false)                         │   │
│  │  number       - 数字 (整数、浮点数、Infinity、NaN)           │   │
│  │  bigint       - 大整数 (如 9007199254740991n)               │   │
│  │  string       - 字符串 ('hello', "world", `template`)       │   │
│  │  symbol       - 唯一值 (Symbol('description'))              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    引用类型 (Reference)                      │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  Object       - 对象 ({ key: value })                       │   │
│  │  Array        - 数组 ([1, 2, 3])                            │   │
│  │  Function     - 函数 (function() {})                        │   │
│  │  Date         - 日期 (new Date())                           │   │
│  │  RegExp       - 正则 (/pattern/)                            │   │
│  │  Map          - 映射 (new Map())                            │   │
│  │  Set          - 集合 (new Set())                            │   │
│  │  WeakMap      - 弱映射 (new WeakMap())                      │   │
│  │  WeakSet      - 弱集合 (new WeakSet())                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 12.2 事件循环流程图

```
┌─────────────────────────────────────────────────────────────────────┐
│                        事件循环 (Event Loop)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐     ┌─────────────────┐                       │
│  │   Call Stack    │     │    Web APIs     │                       │
│  │   (调用栈)       │     │                 │                       │
│  │                 │     │  setTimeout     │                       │
│  │  ┌───────────┐  │     │  fetch          │                       │
│  │  │  fn()     │  │────▶│  DOM Events     │                       │
│  │  └───────────┘  │     │  ...            │                       │
│  │                 │     │                 │                       │
│  └─────────────────┘     └────────┬────────┘                       │
│          ▲                        │                                │
│          │                        ▼                                │
│          │              ┌─────────────────┐                        │
│          │              │  Callback Queue │                        │
│          │              │  (回调队列)      │                        │
│          │              │                 │                        │
│          │              │  ┌───┐┌───┐┌───┐│                        │
│          │              │  │cb1││cb2││cb3││                        │
│          │              │  └───┘└───┘└───┘│                        │
│          │              └────────┬────────┘                        │
│          │                       │                                 │
│          │                       │                                 │
│          └───────────────────────┘                                 │
│                                                                     │
│  执行顺序：                                                         │
│  1. 同步代码进入 Call Stack 执行                                    │
│  2. 异步操作交给 Web APIs 处理                                      │
│  3. 回调函数进入 Callback Queue 等待                                │
│  4. Call Stack 为空时，取出回调执行                                 │
│                                                                     │
│  微任务优先级高于宏任务：                                           │
│  微任务：Promise.then, queueMicrotask, MutationObserver            │
│  宏任务：setTimeout, setInterval, I/O, UI rendering                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 12.3 原型链示意图

```
┌─────────────────────────────────────────────────────────────────────┐
│                          原型链 (Prototype Chain)                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  function Person(name) {                                            │
│      this.name = name;                                              │
│  }                                                                  │
│  Person.prototype.greet = function() { ... };                       │
│  const person = new Person('张三');                                 │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │   person ──▶ Person.prototype ──▶ Object.prototype ──▶ null │   │
│  │                                                             │   │
│  │   ┌──────────────┐                                          │   │
│  │   │    person    │                                          │   │
│  │   ├──────────────┤                                          │   │
│  │   │ name: '张三' │                                          │   │
│  │   │ __proto__ ──────────────┐                               │   │
│  │   └──────────────┘          │                               │   │
│  │                             ▼                               │   │
│  │                   ┌──────────────────┐                      │   │
│  │                   │ Person.prototype │                      │   │
│  │                   ├──────────────────┤                      │   │
│  │                   │ greet: function  │                      │   │
│  │                   │ constructor:     │                      │   │
│  │                   │   Person         │                      │   │
│  │                   │ __proto__ ──────────────┐                │   │
│  │                   └──────────────────┘     │                │   │
│  │                                             ▼                │   │
│  │                                 ┌──────────────────┐        │   │
│  │                                 │ Object.prototype │        │   │
│  │                                 ├──────────────────┤        │   │
│  │                                 │ toString         │        │   │
│  │                                 │ hasOwnProperty   │        │   │
│  │                                 │ __proto__: null  │        │   │
│  │                                 └──────────────────┘        │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 8. 面试高频问题

### 问题1：var、let、const的核心区别？

```javascript
// 1. 作用域
var functionScope = '函数作用域';
let blockScope = '块级作用域'; // const同样

// 2. 变量提升（Hoisting）
console.log(hoistedVar); // undefined（已声明但未赋值）
var hoistedVar = 'var提升';
// let/const存在TDZ（暂时性死区），访问会报错
// console.log(hoistedLet); // ReferenceError
let hoistedLet = 'let不会提升';

// 3. 重复声明
var duplicated = 'first';
var duplicated = 'second'; // 允许，不报错

let notDuplicated = 'first';
// let notDuplicated = 'second'; // SyntaxError

// 4. 全局属性
var globalVar = 'window属性';
let globalLet = '非window属性'; // 不添加为window属性
console.log(window.globalVar); // 'window属性'
console.log(window.globalLet); // undefined
```

### 问题2：闭包的常见应用场景？

```javascript
// 1. 模块化（私有变量）
const Counter = (function() {
  let count = 0; // 私有变量，外部无法直接访问

  return {
    increment: () => ++count,
    decrement: () => --count,
    getCount: () => count,
    reset: () => { count = 0; }
  };
})();

Counter.increment(); // 1
Counter.increment(); // 2
Counter.getCount(); // 2
Counter.count; // undefined（无法直接访问）

// 2. 函数柯里化
const currying = (fn) => {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return function(...args2) {
      return curried.apply(this, args.concat(args2));
    };
  };
};

const add = currying((a, b, c) => a + b + c);
add(1)(2)(3); // 6
add(1, 2)(3); // 6

// 3. 节流与防抖
const throttle = (fn, delay) => {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= delay) {
      last = now;
      return fn.apply(this, args);
    }
  };
};

const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
};
```

### 问题3：Promise的常见方法与场景？

```javascript
// Promise.all - 所有请求都成功才算成功
async function loadDashboard() {
  const [user, posts, comments] = await Promise.all([
    fetch('/api/user').then(r => r.json()),
    fetch('/api/posts').then(r => r.json()),
    fetch('/api/comments').then(r => r.json())
  ]);
  return { user, posts, comments };
}

// Promise.race - 返回最快完成的
async function fetchWithTimeout(url, timeout = 3000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return res.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('请求超时');
    }
    throw err;
  }
}

// Promise.allSettled - 收集所有结果（成功/失败都算）
async function loadAllResources() {
  const results = await Promise.allSettled([
    fetch('/api/resource1').then(r => r.json()),
    fetch('/api/resource2').then(r => r.json()),
    fetch('/api/resource3').then(r => r.json())
  ]);

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`资源${index}加载成功:`, result.value);
    } else {
      console.error(`资源${index}加载失败:`, result.reason);
    }
  });
}

// Promise.any - 返回第一个成功的（忽略失败）
async function loadFromMultipleCDN() {
  const cdnUrls = [
    'https://cdn1.example.com/resource',
    'https://cdn2.example.com/resource',
    'https://cdn3.example.com/resource'
  ];

  try {
    const result = await Promise.any(
      cdnUrls.map(url => fetch(url).then(r => r.json()))
    );
    console.log('最快CDN返回:', result);
  } catch (err) {
    console.error('所有CDN都失败了:', err.errors);
  }
}
```

### 问题4：如何理解事件循环？

```javascript
// 事件循环面试题分析
console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve()
  .then(() => console.log('3'))
  .then(() => console.log('4'));

async function asyncFn() {
  console.log('5');
  await Promise.resolve();
  console.log('6');
}
asyncFn();

console.log('7');

// 答案：1 → 5 → 7 → 3 → 6 → 4 → 2
// 分析：
// 同步代码：1 → 5 → 7
// 微任务队列：3 → 6（第一个then输出3，await后输出6，然后第二个then输出4）
// 宏任务队列：2（setTimeout）
```

### 问题5：如何实现深拷贝？

```javascript
// 完整深拷贝实现
function deepClone(target, hash = new WeakMap()) {
  // 处理null和undefined
  if (target === null || typeof target !== 'object') {
    return target;
  }

  // 处理循环引用
  if (hash.has(target)) {
    return hash.get(target);
  }

  // 处理Date
  if (target instanceof Date) {
    return new Date(target.getTime());
  }

  // 处理RegExp
  if (target instanceof RegExp) {
    return new RegExp(target.source, target.flags);
  }

  // 处理Array
  if (Array.isArray(target)) {
    const clone = [];
    hash.set(target, clone);
    for (const item of target) {
      clone.push(deepClone(item, hash));
    }
    return clone;
  }

  // 处理Object
  const clone = {};
  hash.set(target, clone);
  for (const key in target) {
    if (Object.prototype.hasOwnProperty.call(target, key)) {
      clone[key] = deepClone(target[key], hash);
    }
  }
  return clone;
}

// 使用structuredClone（现代浏览器/Node.js）
const original = { date: new Date(), regex: /test/g, map: new Map([[1, 'one']]) };
const cloned = structuredClone(original);
```

### 问题6：ES6模块与CommonJS的区别？

```javascript
// ES6模块（import/export）
// 1. 静态分析，编译时确定依赖
// 2. 导入导出是引用，不能在运行时改变
// 3. 导入的值是只读的（live bindings）
// 4. 可以使用default export
export const name = 'module';
export default function() { }
import defaultFn, { name } from './module.js';

// CommonJS（require/module.exports）
// 1. 运行时动态加载
// 2. module.exports导出的是值的拷贝
// 3. 可以重新赋值
const module = require('./module.cjs');
module.exports = {}; // 可以重写整个导出对象

// Node.js中的处理：
// ES6模块使用.mjs扩展名，或在package.json中设置"type": "module"
// CommonJS使用.cjs扩展名，或不使用上述设置
```

---

## 9. 实战场景：企业级JavaScript架构

### 9.1 事件总线（Event Bus）实现

```javascript
// 事件总线：组件间通信的松耦合方案
class EventBus {
  constructor() {
    this.events = new Map();
  }

  // 订阅事件
  on(event, callback, once = false) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push({ callback, once });
    return () => this.off(event, callback); // 返回取消订阅函数
  }

  // 取消订阅
  off(event, callback) {
    if (!this.events.has(event)) return;
    this.events.set(
      event,
      this.events.get(event).filter(e => e.callback !== callback)
    );
  }

  // 触发事件
  emit(event, ...args) {
    if (!this.events.has(event)) return;
    const handlers = this.events.get(event);

    // 只执行一次的需要过滤
    const toRemove = [];

    handlers.forEach(({ callback, once }) => {
      try {
        callback(...args);
        if (once) toRemove.push(callback);
      } catch (err) {
        console.error(`事件 ${event} 处理器出错:`, err);
      }
    });

    toRemove.forEach(cb => this.off(event, cb));
  }

  // 订阅一次
  once(event, callback) {
    return this.on(event, callback, true);
  }

  // 清除所有事件
  clear() {
    this.events.clear();
  }
}

// 使用示例
const bus = new EventBus();

// 用户登录后通知所有组件
bus.on('user:login', (user) => {
  console.log('导航栏更新用户信息:', user.name);
});

bus.on('user:login', (user) => {
  console.log('购物车加载用户数据:', user.id);
});

// 组件卸载时取消订阅
const unsubscribe = bus.on('cart:update', handleCartUpdate);
// 组件卸载时
unsubscribe();

// 发布-订阅模式比直接调用更灵活，支持多个订阅者
bus.emit('user:login', { id: 1, name: '张三' });
```

### 9.2 链式调用（Builder Pattern）

```javascript
// 链式调用Builder模式
class RequestBuilder {
  constructor() {
    this.url = '';
    this.method = 'GET';
    this.headers = {};
    this.body = null;
    this.timeout = 5000;
  }

  url(u) { this.url = u; return this; }
  method(m) { this.method = m; return this; }
  headers(h) { this.headers = { ...this.headers, ...h }; return this; }
  body(b) { this.body = b; return this; }
  timeout(t) { this.timeout = t; return this; }

  async execute() {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), this.timeout);

    const response = await fetch(this.url, {
      method: this.method,
      headers: this.headers,
      body: this.body ? JSON.stringify(this.body) : null,
      signal: controller.signal
    });

    clearTimeout(id);
    return response.json();
  }
}

// 链式调用示例
const user = await new RequestBuilder()
  .url('https://api.example.com/users')
  .method('POST')
  .headers({ 'Content-Type': 'application/json', 'Authorization': 'Bearer token' })
  .body({ name: '张三', age: 25 })
  .timeout(10000)
  .execute();
```

---

## 总结

本文档详细介绍了 JavaScript 核心概念，包括变量声明、数据类型、作用域与闭包、原型与原型链、异步编程、DOM 操作和模块化。通过学习本文档，你应该能够：

1. **理解变量声明**：掌握 var、let、const 的区别和使用场景
2. **掌握数据类型**：了解原始类型和引用类型的特性
3. **理解作用域与闭包**：掌握作用域链和闭包的应用
4. **理解原型链**：掌握原型继承和 ES6 类
5. **掌握异步编程**：理解事件循环和 Promise、async/await
6. **操作 DOM**：掌握 DOM 选择、操作和事件处理
7. **使用模块化**：了解 CommonJS 和 ES Modules

继续学习建议：
- 深入学习 JavaScript 设计模式
- 掌握 TypeScript 类型系统
- 学习函数式编程范式
- 了解 JavaScript 引擎优化
