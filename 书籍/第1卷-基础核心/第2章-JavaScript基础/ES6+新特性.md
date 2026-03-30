# 第1卷-基础核心

## 第2章 JavaScript基础

### 2.1 let / const / var 区别

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

### 2.2 箭头函数与普通函数区别

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

### 2.3 Symbol / BigInt / Proxy / Reflect

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

### 2.4 数组方法详解

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

### 2.5 对象方法详解

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

### 2.6 扩展运算符与解构

**参考答案：**

```javascript
// 数组扩展
const arr1 = [1, 2, 3];
const arr2 = [...arr1, 4, 5];  // [1, 2, 3, 4, 5]

// 对象扩展
const obj1 = { a: 1, b: 2 };
const obj2 = { ...obj1, c: 3 };  // { a: 1, b: 2, c: 3 }

// 函数参数展开
function sum(a, b, c) {
  return a + b + c;
}
const nums = [1, 2, 3];
sum(...nums);  // 6

// 数组解构
const [a, b, c] = [1, 2, 3];
const [d, ...rest] = [1, 2, 3, 4];  // d=1, rest=[2,3,4]
const [e, , f] = [1, 2, 3];  // e=1, f=3

// 对象解构
const { name, age } = { name: 'Tom', age: 18 };
const { name: userName } = { name: 'Tom' };  // userName = 'Tom'
const { name, ...rest } = { name: 'Tom', age: 18, city: 'Beijing' };

// 默认值
const [x = 1] = [];
const { y = 2 } = {};
```

---

### 2.7 模板字符串

**参考答案：**

```javascript
// 基本用法
const name = 'Tom';
const greeting = `Hello, ${name}!`;

// 多行字符串
const html = `
<div>
  <h1>Title</h1>
  <p>Content</p>
</div>
`;

// 标签模板
function tag(strings, ...values) {
  return strings[0] + values.map(v => v.toUpperCase()).join('');
}
const result = tag`Hello ${'world'} and ${'javascript'}!`;
```

---

### 2.8 Class 语法

**参考答案：**

```javascript
class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  // 实例方法
  greet() {
    return `Hello, I'm ${this.name}`;
  }

  // 静态方法
  static create(name, age) {
    return new Person(name, age);
  }

  // Getter
  get info() {
    return `${this.name}, ${this.age} years old`;
  }

  // Setter
  set info(value) {
    [this.name, this.age] = value.split(',');
  }
}

// 继承
class Student extends Person {
  constructor(name, age, grade) {
    super(name, age);
    this.grade = grade;
  }

  // 重写方法
  greet() {
    return `${super.greet()}, I'm in grade ${this.grade}`;
  }
}
```

---

### 2.9 模块化（import/export）

**参考答案：**

```javascript
// 命名导出
export const name = 'Tom';
export function greet() { return 'Hello'; }
export class Person { }

// 默认导出
export default function() { }

// 导入
import { name, greet } from './module.js';
import defaultExport from './module.js';

// 复合导入
import React, { useState } from 'react';

// 重新导出
export { name } from './module.js';
export * from './module.js';
```

---

### 2.10 Promise 与 async/await

**参考答案：**

```javascript
// Promise 创建
const promise = new Promise((resolve, reject) => {
  // 异步操作
  if (success) {
    resolve(result);
  } else {
    reject(error);
  }
});

// Promise 方法
promise.then(onFulfilled, onRejected);
promise.catch(onRejected);
promise.finally(onFinally);

// Promise 静态方法
Promise.resolve(value);
Promise.reject(error);
Promise.all(promises);
Promise.race(promises);
Promise.allSettled(promises);

// async/await
async function fetchData() {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
  }
}
```
