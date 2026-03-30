# JavaScript 基础

## 目录

1. [JavaScript 简介](#1-javascript-简介)
2. [变量和数据类型](#2-变量和数据类型)
3. [数据类型](#3-数据类型)
4. [运算符和表达式](#4-运算符和表达式)
5. [条件语句](#5-条件语句)
6. [循环](#6-循环)
7. [函数](#7-函数)
8. [数组](#8-数组)
9. [对象](#9-对象)
10. [DOM 操作](#10-dom-操作)
11. [错误处理](#11-错误处理)

---

## 1. JavaScript 简介

### 1.1 什么是 JavaScript？

**JavaScript** 是一种运行在浏览器中的脚本语言，用于实现网页的交互功能。它可以：
- 响应用户操作（点击、输入等）
- 操作网页内容（修改文字、样式等）
- 与服务器通信（AJAX、Fetch）
- 创建动画和特效
- 构建复杂的 Web 应用

### 1.2 JavaScript 能做什么？

```javascript
// 1. 动态修改网页内容
document.getElementById('title').innerHTML = '新标题';

// 2. 响应用户事件
button.addEventListener('click', function() {
    alert('按钮被点击了！');
});

// 3. 数据处理和计算
let sum = 0;
for (let i = 1; i <= 100; i++) {
    sum += i;
}
console.log('1到100的和：' + sum); // 5050

// 4. 与服务器通信
fetch('https://api.example.com/data')
    .then(response => response.json())
    .then(data => console.log(data));

// 5. 本地存储
localStorage.setItem('username', '张三');
const user = localStorage.getItem('username');
```

### 1.3 JavaScript 书写位置

#### 1.3.1 行内脚本

```html
<!-- 不推荐：难以维护 -->
<button onclick="alert('你好！')">点击</button>
```

#### 1.3.2 页面内 script 标签

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>JS 示例</title>
</head>
<body>
    <h1 id="demo">Hello</h1>

    <script>
        // JavaScript 代码写在这里
        document.getElementById('demo').style.color = 'red';
    </script>
</body>
</html>
```

#### 1.3.3 外部 JS 文件

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>JS 示例</title>
    <!-- 建议放在 body 末尾 -->
    <script src="main.js"></script>
</head>
<body>
    <h1 id="demo">Hello</h1>
</body>
</html>
```

```javascript
// main.js
document.getElementById('demo').style.color = 'red';
```

### 1.4 JavaScript 输出方式

```javascript
// 1. console.log - 控制台输出
console.log('你好');           // 你好
console.log(1, 2, 3);         // 1 2 3

// 2. alert - 弹窗警告
alert('欢迎访问！');

// 3. document.write - 写入页面
document.write('<h1>标题</h1>');

// 4. innerHTML - 修改元素内容
document.getElementById('demo').innerHTML = '新内容';
```

---

## 2. 变量和数据类型

### 2.1 变量声明

#### 2.1.1 var（ES5）

```javascript
// var 声明的变量可以重复声明
var name = '张三';
var name = '李四'; // 不会报错

// var 声明的变量没有块级作用域
if (true) {
    var test = '在 if 块中声明';
}
console.log(test); // 可以访问，输出 "在 if 块中声明"

// var 声明的变量会提升
console.log(hoisted); // undefined（不会报错）
var hoisted = '变量提升';
```

#### 2.1.2 let（ES6+）

```javascript
// let 声明的变量不能重复声明
let age = 25;
let age = 30; // 报错：Identifier 'age' has already been declared

// let 声明的变量有块级作用域
if (true) {
    let localVar = '局部变量';
}
console.log(localVar); // 报错：localVar is not defined

// let 声明的变量不会提升
// console.log(notHoisted); // 报错：Cannot access 'notHoisted' before initialization
let notHoisted = '不会提升';
```

#### 2.1.3 const（ES6+）

```javascript
// const 声明常量，赋值后不能重新赋值
const PI = 3.14159;
PI = 3.14; // 报错：Assignment to constant variable

// const 声明时必须赋值
// const NUM; // 报错：Missing initializer in const declaration
const NUM = 100;

// const 声明的对象，引用不能改变，但属性可以修改
const user = { name: '张三' };
user.name = '李四'; // 可以
// user = {}; // 报错：Assignment to constant variable
```

#### 2.1.4 var vs let vs const 推荐

```javascript
// 优先使用 const
const API_URL = 'https://api.example.com';
const MAX_COUNT = 100;

// 需要重新赋值时使用 let
let counter = 0;
counter++;

// 避免使用 var
// var 存在变量提升和块级作用域问题，容易造成 bug
```

### 2.2 变量命名规则

```javascript
// 变量名可以是字母、数字、下划线和 $ 符号
let name = '张三';
let age1 = 25;
let _private = '私有';
let $element = 'jQuery 风格';

// 不能以数字开头
// let 2name = '错误'; // 报错

// 区分大小写
let Name = '张三';
let name = '李四';
console.log(Name, name); // 张三 李四

// 建议使用驼峰命名
let firstName = '张';
let lastName = '三';
let myVeryLongVariableName = '长变量名';

// 不能使用保留字
// let class = '类'; // 报错
// let function = '函数'; // 报错
```

### 2.3 变量类型推断

```javascript
// JavaScript 是动态类型语言
let x = 5;       // x 是数字
x = 'hello';     // x 变成字符串

// typeof 操作符查看类型
console.log(typeof 5);           // "number"
console.log(typeof 'hello');     // "string"
console.log(typeof true);        // "boolean"
console.log(typeof undefined);   // "undefined"
console.log(typeof null);        // "object"（历史 bug）
console.log(typeof {});          // "object"
console.log(typeof []);          // "object"
console.log(typeof function(){}); // "function"
```

---

## 3. 数据类型

### 3.1 原始类型（Primitive Types）

#### 3.1.1 Number（数字）

```javascript
// 整数
let integer = 42;
let negative = -10;

// 浮点数
let float = 3.14;
let scientific = 2.5e5; // 250000

// 特殊值
let infinity = Infinity;
let negInfinity = -Infinity;
let notANumber = NaN; // Not a Number

// 数值运算
console.log(10 + 5);    // 15
console.log(10 - 5);    // 5
console.log(10 * 5);    // 50
console.log(10 / 5);    // 2
console.log(10 % 3);    // 1（取余）
console.log(2 ** 3);    // 8（幂运算）

// NaN
console.log(0 / 0);           // NaN
console.log(parseInt('abc')); // NaN
console.log(NaN === NaN);    // false（NaN 不等于自身）
console.log(isNaN(NaN));     // true
console.log(Number.isNaN(NaN)); // true（更严格）
```

#### 3.1.2 String（字符串）

```javascript
// 三种定义方式
let str1 = '单引号字符串';
let str2 = "双引号字符串";
let str3 = `反引号字符串（模板字符串）`;

// 字符串拼接
let firstName = '张';
let lastName = '三';
let fullName = firstName + lastName;     // "张三"
let templateName = `${firstName}${lastName}`; // "张三"（模板字符串）

// 常用方法
let message = 'Hello, World!';
console.log(message.length);              // 13
console.log(message.toUpperCase());       // "HELLO, WORLD!"
console.log(message.toLowerCase());       // "hello, world!"
console.log(message.charAt(0));           // "H"
console.log(message.substring(0, 5));     // "Hello"
console.log(message.slice(0, 5));         // "Hello"
console.log(message.split(','));          // ["Hello", " World!"]
console.log(message.replace('World', 'JavaScript')); // "Hello, JavaScript!"
console.log(message.trim());              // 去除首尾空格

// 字符串查找
let text = 'Hello World';
console.log(text.indexOf('World'));      // 6
console.log(text.includes('World'));     // true
console.log(text.startsWith('Hello'));   // true
console.log(text.endsWith('!'));         // false
```

#### 3.1.3 Boolean（布尔）

```javascript
let isActive = true;
let isComplete = false;

// 布尔转换
console.log(Boolean(1));        // true
console.log(Boolean(0));        // false
console.log(Boolean(''));       // false
console.log(Boolean('hello'));  // true
console.log(Boolean(null));     // false
console.log(Boolean(undefined));// false
console.log(Boolean([]));       // true（空数组也是 true）
console.log(Boolean({}));       // true（空对象也是 true）

// 假值（falsy）：false, 0, '', null, undefined, NaN
```

#### 3.1.4 undefined（未定义）

```javascript
// 声明但未赋值
let notAssigned;
console.log(notAssigned); // undefined

// 访问不存在的属性
let obj = {};
console.log(obj.name);    // undefined

// 函数没有返回值
function noReturn() {}
console.log(noReturn());  // undefined
```

#### 3.1.5 null（空值）

```javascript
// 主动设置为空
let empty = null;
console.log(empty); // null

// typeof null 是 'object'（历史遗留 bug）
console.log(typeof null); // "object"

// 检查 null
console.log(empty === null); // true
console.log(empty === undefined); // false（=== 不会转换类型）
console.log(empty == undefined);  // true（== 会转换类型）
```

#### 3.1.6 Symbol（符号，ES6+）

```javascript
// 创建唯一的符号
let sym1 = Symbol('description');
let sym2 = Symbol('description');
console.log(sym1 === sym2); // false（每次都是新的）

// 作为对象属性键
let obj = {
    [Symbol('id')]: 1,
    name: '张三'
};
```

### 3.2 引用类型（Reference Types）

#### 3.2.1 Object（对象）

```javascript
// 创建对象
let person = {
    name: '张三',
    age: 25,
    isStudent: false,
    hobbies: ['reading', 'coding'],
    address: {
        city: 'Beijing',
        country: 'China'
    },
    sayHello: function() {
        return '你好，我是' + this.name;
    }
};

// 访问属性
console.log(person.name);          // "张三"
console.log(person['age']);        // 25
console.log(person.hobbies[0]);   // "reading"
console.log(person.address.city);  // "Beijing"
console.log(person.sayHello());    // "你好，我是张三"

// 修改属性
person.age = 26;
person['gender'] = 'male';

// 删除属性
delete person.isStudent;

// 检查属性
console.log('name' in person);    // true
console.log(person.hasOwnProperty('age')); // true
```

#### 3.2.2 Array（数组）

```javascript
// 创建数组
let fruits = ['apple', 'banana', 'orange'];
let numbers = [1, 2, 3, 4, 5];
let mixed = [1, 'hello', true, null];

// 访问元素（从0开始）
console.log(fruits[0]);  // "apple"
console.log(fruits[10]); // undefined

// 数组长度
console.log(fruits.length); // 3

// 修改数组
fruits[0] = 'pear';
fruits.push('grape');      // 末尾添加
fruits.pop();              // 末尾删除
fruits.unshift('mango');   // 开头添加
fruits.shift();            // 开头删除

// 数组方法
let arr = [1, 2, 3];
arr.forEach((item, index) => {
    console.log(index + ': ' + item);
});

let doubled = arr.map(x => x * 2); // [2, 4, 6]
let evens = arr.filter(x => x % 2 === 0); // [2]
let sum = arr.reduce((acc, x) => acc + x, 0); // 6
```

---

## 4. 运算符和表达式

### 4.1 算术运算符

```javascript
// 加减乘除
console.log(10 + 5);   // 15
console.log(10 - 5);   // 5
console.log(10 * 5);   // 50
console.log(10 / 5);   // 2
console.log(10 / 3);   // 3.333...

// 取余
console.log(10 % 3);   // 1
console.log(17 % 5);   // 2

// 幂运算
console.log(2 ** 3);   // 8
console.log(4 ** 0.5); // 2

// 自增/自减
let a = 5;
console.log(a++);      // 5（先返回值，再加1）
console.log(a);        // 6
let b = 5;
console.log(++b);      // 6（先加1，再返回值）
console.log(b);        // 6

let c = 5;
console.log(c--);      // 5
console.log(c);        // 4
let d = 5;
console.log(--d);      // 4
console.log(d);        // 4
```

### 4.2 赋值运算符

```javascript
let x = 10;

x += 5;   // x = x + 5  → 15
x -= 5;   // x = x - 5  → 10
x *= 2;   // x = x * 2  → 20
x /= 4;   // x = x / 4  → 5
x %= 3;   // x = x % 3  → 2
x **= 2;  // x = x ** 2 → 4
```

### 4.3 比较运算符

```javascript
// 相等（会转换类型）
console.log(5 == '5');     // true
console.log(0 == false);   // true
console.log('' == 0);      // true

// 全等（不转换类型）
console.log(5 === '5');    // false
console.log(0 === false);  // false

// 大于/小于
console.log(5 > 3);        // true
console.log(5 < 3);        // false
console.log(5 >= 5);       // true
console.log(5 <= 5);       // true

// 不相等
console.log(5 != '5');     // false（会转换）
console.log(5 !== '5');    // true（不转换）
```

### 4.4 逻辑运算符

```javascript
// 与（AND）
console.log(true && true);   // true
console.log(true && false);  // false
console.log(false && true);  // false
console.log(false && false); // false

// 或（OR）
console.log(true || true);   // true
console.log(true || false);  // true
console.log(false || true);  // true
console.log(false || false); // false

// 非（NOT）
console.log(!true);   // false
console.log(!false); // true

// 短路求值
console.log(true && 'hello');    // "hello"
console.log(false && 'hello');   // false
console.log(true || 'hello');    // true
console.log(false || 'hello');   // "hello"

// 实际应用
let name = '';
let displayName = name || '匿名用户';
console.log(displayName); // "匿名用户"

let age = 0;
let displayAge = age || '未填写';
console.log(displayAge); // "未填写"
```

### 4.5 三元运算符

```javascript
// 条件 ? 值1 : 值2
let age = 20;
let status = age >= 18 ? '成人' : '未成年';
console.log(status); // "成人"

// 嵌套使用（不推荐）
let score = 85;
let grade = score >= 90 ? 'A' :
            score >= 80 ? 'B' :
            score >= 70 ? 'C' :
            score >= 60 ? 'D' : 'F';
console.log(grade); // "B"
```

### 4.6 位运算符（了解）

```javascript
// 按位与
console.log(5 & 3);  // 1 (0101 & 0011 = 0001)

// 按位或
console.log(5 | 3);  // 7 (0101 | 0011 = 0111)

// 按位异或
console.log(5 ^ 3);  // 6 (0101 ^ 0011 = 0110)

// 左移
console.log(5 << 1); // 10

// 右移
console.log(5 >> 1); // 2

// 无符号右移
console.log(-5 >>> 1); // 大数
```

### 4.7 typeof 和 delete

```javascript
typeof 5;           // "number"
typeof 'hello';     // "string"
typeof true;        // "boolean"
typeof undefined;   // "undefined"
typeof {};          // "object"
typeof [];          // "object"
typeof function(){} // "function"

let obj = { name: '张三', age: 25 };
delete obj.age;     // true
console.log(obj);   // { name: '张三' }

let arr = [1, 2, 3];
delete arr[1];      // true
console.log(arr);   // [1, empty, 3]
```

---

## 5. 条件语句

### 5.1 if...else

```javascript
// 基本语法
let age = 18;

if (age >= 18) {
    console.log('成年人');
}

// if...else
if (age >= 18) {
    console.log('成年人');
} else {
    console.log('未成年');
}

// if...else if...else
let score = 85;

if (score >= 90) {
    console.log('优秀');
} else if (score >= 80) {
    console.log('良好');
} else if (score >= 60) {
    console.log('及格');
} else {
    console.log('不及格');
}

// 条件简写
let isOnline = true;
if (isOnline) {
    console.log('在线');
}
// 等价于
isOnline && console.log('在线');
```

### 5.2 switch

```javascript
// 基本语法
let day = new Date().getDay();
let dayName;

switch (day) {
    case 0:
        dayName = '星期日';
        break;
    case 1:
        dayName = '星期一';
        break;
    case 2:
        dayName = '星期二';
        break;
    case 3:
        dayName = '星期三';
        break;
    case 4:
        dayName = '星期四';
        break;
    case 5:
        dayName = '星期五';
        break;
    case 6:
        dayName = '星期六';
        break;
    default:
        dayName = '未知';
}

console.log(dayName);

// 多个 case 合并
let fruit = 'apple';

switch (fruit) {
    case 'apple':
    case 'pear':
    case 'banana':
        console.log('这是水果');
        break;
    case 'carrot':
        console.log('这是蔬菜');
        break;
    default:
        console.log('未知');
}
```

### 5.3 三元运算符

```javascript
// 基本用法
let age = 20;
let result = age >= 18 ? '成人' : '未成年';
console.log(result);

// 替代简单 if...else
let isMember = true;
let price = isMember ? 10 : 20;
console.log(price); // 10

// 嵌套使用
let score = 85;
let grade = score >= 90 ? 'A' :
            score >= 80 ? 'B' :
            score >= 70 ? 'C' :
            score >= 60 ? 'D' : 'F';
```

### 5.4 逻辑运算符替代

```javascript
// && 运算符
let user = { name: '张三' };
// 如果 user 存在，输出欢迎信息
user && console.log('欢迎，' + user.name);

// || 运算符设置默认值
let config = { theme: '' };
let theme = config.theme || 'light';
console.log(theme); // "light"

// ?. 可选链（ES2020）
let data = { profile: { age: 25 } };
let city = data?.profile?.city ?? '未知';
console.log(city); // "未知"
```

---

## 6. 循环

### 6.1 for 循环

```javascript
// 基本 for 循环
for (let i = 0; i < 5; i++) {
    console.log(i); // 0, 1, 2, 3, 4
}

// 遍历数组
let fruits = ['apple', 'banana', 'orange'];
for (let i = 0; i < fruits.length; i++) {
    console.log(fruits[i]);
}

// 倒序循环
for (let i = 5; i > 0; i--) {
    console.log(i); // 5, 4, 3, 2, 1
}

// 步长为 2
for (let i = 0; i < 10; i += 2) {
    console.log(i); // 0, 2, 4, 6, 8
}
```

### 6.2 while 循环

```javascript
// while 循环
let count = 0;
while (count < 5) {
    console.log(count); // 0, 1, 2, 3, 4
    count++;
}

// do...while（至少执行一次）
let i = 0;
do {
    console.log(i); // 0, 1, 2, 3, 4
    i++;
} while (i < 5);

// 无限循环（谨慎使用）
// while (true) { ... }
```

### 6.3 for...in 循环

```javascript
// 遍历对象属性
let person = {
    name: '张三',
    age: 25,
    city: 'Beijing'
};

for (let key in person) {
    console.log(key + ': ' + person[key]);
}
// 输出:
// name: 张三
// age: 25
// city: Beijing

// 遍历数组索引（不推荐）
let arr = ['a', 'b', 'c'];
for (let index in arr) {
    console.log(index + ': ' + arr[index]);
}
// 输出:
// 0: a
// 1: b
// 2: c
```

### 6.4 for...of 循环（ES6+）

```javascript
// 遍历数组元素
let fruits = ['apple', 'banana', 'orange'];
for (let fruit of fruits) {
    console.log(fruit);
}
// 输出:
// apple
// banana
// orange

// 遍历字符串
let str = 'hello';
for (let char of str) {
    console.log(char);
}
// 输出: h, e, l, l, o

// 遍历 Map
let map = new Map([['a', 1], ['b', 2]]);
for (let [key, value] of map) {
    console.log(key + ': ' + value);
}

// 遍历 Set
let set = new Set([1, 2, 3]);
for (let value of set) {
    console.log(value);
}
```

### 6.5 forEach 方法

```javascript
// 数组 forEach
let numbers = [1, 2, 3, 4, 5];

numbers.forEach(function(item, index, array) {
    console.log(index + ': ' + item);
});

// 使用箭头函数
numbers.forEach((item, index) => {
    console.log(index + ': ' + item);
});
```

### 6.6 循环控制

```javascript
// break - 跳出循环
for (let i = 0; i < 10; i++) {
    if (i === 5) {
        break;
    }
    console.log(i); // 0, 1, 2, 3, 4
}

// continue - 跳过本次循环
for (let i = 0; i < 5; i++) {
    if (i === 2) {
        continue;
    }
    console.log(i); // 0, 1, 3, 4（跳过2）
}

// 标签（label）
outer: for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
        if (j === 1) {
            break outer; // 跳出外层循环
        }
        console.log(i, j);
    }
}
```

### 6.7 循环示例

```javascript
// 计算数组总和
let numbers = [1, 2, 3, 4, 5];
let sum = 0;
for (let i = 0; i < numbers.length; i++) {
    sum += numbers[i];
}
console.log('总和：' + sum);

// 找最大值
let max = numbers[0];
for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] > max) {
        max = numbers[i];
    }
}
console.log('最大值：' + max);

// 过滤数组
let evens = [];
for (let i = 0; i < numbers.length; i++) {
    if (numbers[i] % 2 === 0) {
        evens.push(numbers[i]);
    }
}
console.log('偶数：' + evens); // [2, 4]
```

---

## 7. 函数

### 7.1 函数声明

```javascript
// 函数声明
function greet(name) {
    return '你好，' + name + '！';
}

// 调用函数
console.log(greet('张三')); // 你好，张三！

// 函数表达式
const greet2 = function(name) {
    return '你好，' + name + '！';
};

// 箭头函数（ES6+）
const greet3 = (name) => {
    return '你好，' + name + '！';
};

// 简写（单参数可省略括号，单行可省略 return 和大括号）
const greet4 = name => '你好，' + name + '！';
```

### 7.2 函数参数

```javascript
// 默认参数
function greet(name = '访客') {
    return '你好，' + name + '！';
}
console.log(greet());        // 你好，访客！
console.log(greet('张三'));  // 你好，张三！

// 剩余参数
function sum(...numbers) {
    let total = 0;
    for (let num of numbers) {
        total += num;
    }
    return total;
}
console.log(sum(1, 2, 3, 4, 5)); // 15

// arguments 对象（函数声明可用）
function showArgs() {
    console.log(arguments); // [Arguments] { '0': 1, '1': 2, '2': 3 }
    return arguments.length;
}
showArgs(1, 2, 3);

// 参数解构
function greet({ name, age }) {
    return `我叫${name}，今年${age}岁`;
}
console.log(greet({ name: '张三', age: 25 }));

// 数组解构
function getFirst([first]) {
    return first;
}
console.log(getFirst([1, 2, 3])); // 1
```

### 7.3 返回值

```javascript
// return 语句
function add(a, b) {
    return a + b;
}
console.log(add(1, 2)); // 3

// 返回多个值（数组）
function getMinMax(numbers) {
    return [Math.min(...numbers), Math.max(...numbers)];
}
const [min, max] = getMinMax([3, 1, 4, 1, 5]);
console.log(min, max); // 1 5

// 返回对象
function createUser(name, age) {
    return {
        name: name,
        age: age,
        createdAt: new Date()
    };
}

// 提前返回
function findUser(users, id) {
    if (!users) return null;
    for (let user of users) {
        if (user.id === id) return user;
    }
    return null;
}
```

### 7.4 作用域

```javascript
// 全局变量
let globalVar = '全局';

function test() {
    // 局部变量
    let localVar = '局部';
    console.log(globalVar); // 可访问
    console.log(localVar);  // 可访问
}

test();
// console.log(localVar); // 报错

// 块级作用域（let/const）
{
    let blockVar = '块级';
    const blockConst = '常量';
}
// console.log(blockVar); // 报错

// 闭包
function outer() {
    let count = 0;
    return function() {
        count++;
        return count;
    };
}
const counter = outer();
console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3
```

### 7.5 递归

```javascript
// 阶乘
function factorial(n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}
console.log(factorial(5)); // 120

// 斐波那契数列
function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}
console.log(fibonacci(10)); // 55

// 尾递归优化
function fibonacciTail(n, a = 0, b = 1) {
    if (n === 0) return a;
    return fibonacciTail(n - 1, b, a + b);
}
console.log(fibonacciTail(100)); // 大数
```

### 7.6 常用函数示例

```javascript
// 防抖函数
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

// 节流函数
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 偏函数
function partial(fn, ...presetArgs) {
    return function(...laterArgs) {
        return fn(...presetArgs, ...laterArgs);
    };
}

const add = (a, b) => a + b;
const add5 = partial(add, 5);
console.log(add5(3)); // 8
```

---

## 8. 数组

### 8.1 创建数组

```javascript
// 字面量
let fruits = ['apple', 'banana', 'orange'];

// Array 构造函数
let nums = new Array(1, 2, 3);

// 创建一个包含 5 个空元素的数组
let empty = new Array(5);
console.log(empty.length); // 5
console.log(empty[0]);    // undefined

// Array.of（ES6+）
let arr = Array.of(1, 2, 3); // [1, 2, 3]

// Array.from（ES6+）
let arr2 = Array.from('hello'); // ['h', 'e', 'l', 'l', 'o']
let arr3 = Array.from({ length: 3 }); // [undefined, undefined, undefined]
```

### 8.2 访问和修改

```javascript
let arr = [1, 2, 3, 4, 5];

// 访问元素
console.log(arr[0]);      // 1
console.log(arr[arr.length - 1]); // 5（最后一个）

// 修改元素
arr[0] = 10;
console.log(arr);         // [10, 2, 3, 4, 5]

// 越界访问返回 undefined
console.log(arr[100]);    // undefined

// 数组长度
console.log(arr.length);  // 5

// 改变长度
arr.length = 3;
console.log(arr);         // [10, 2, 3]
```

### 8.3 添加/删除元素

```javascript
let arr = [1, 2, 3];

// 末尾添加
arr.push(4, 5);
console.log(arr); // [1, 2, 3, 4, 5]

// 末尾删除
let last = arr.pop();
console.log(last); // 5
console.log(arr);  // [1, 2, 3, 4]

// 开头添加
arr.unshift(0);
console.log(arr); // [0, 1, 2, 3, 4]

// 开头删除
let first = arr.shift();
console.log(first); // 0
console.log(arr);    // [1, 2, 3, 4]

// splice - 任意位置添加/删除
arr.splice(2, 1);           // 删除 1 个元素
console.log(arr);           // [1, 2, 4]

arr.splice(2, 0, 3);        // 在索引 2 插入 3
console.log(arr);           // [1, 2, 3, 4]

arr.splice(2, 1, 'three');  // 替换
console.log(arr);           // [1, 2, 'three', 4]
```

### 8.4 数组方法详解

```javascript
let arr = [1, 2, 3, 4, 5];

// forEach - 遍历
arr.forEach((item, index) => {
    console.log(index + ': ' + item);
});

// map - 映射
let doubled = arr.map(x => x * 2);
console.log(doubled); // [2, 4, 6, 8, 10]

// filter - 过滤
let evens = arr.filter(x => x % 2 === 0);
console.log(evens); // [2, 4]

// find - 查找第一个
let found = arr.find(x => x > 3);
console.log(found); // 4

// findIndex - 查找索引
let foundIndex = arr.findIndex(x => x > 3);
console.log(foundIndex); // 3

// some - 是否存在满足条件
let hasEven = arr.some(x => x % 2 === 0);
console.log(hasEven); // true

// every - 是否都满足条件
let allPositive = arr.every(x => x > 0);
console.log(allPositive); // true

// reduce - 归约
let sum = arr.reduce((acc, x) => acc + x, 0);
console.log(sum); // 15

// includes - 是否包含
console.log(arr.includes(3)); // true

// indexOf - 查找索引
console.log(arr.indexOf(3));  // 2
console.log(arr.indexOf(10)); // -1

// slice - 切片
console.log(arr.slice(1, 3)); // [2, 3]

// concat - 合并
console.log(arr.concat([6, 7])); // [1, 2, 3, 4, 5, 6, 7]

// join - 转为字符串
console.log(arr.join('-')); // "1-2-3-4-5"

// reverse - 反转
console.log(arr.reverse()); // [5, 4, 3, 2, 1]

// sort - 排序
let unsorted = [3, 1, 4, 1, 5];
console.log(unsorted.sort((a, b) => a - b)); // [1, 1, 3, 4, 5]
```

### 8.5 数组解构（ES6+）

```javascript
let arr = [1, 2, 3];

// 基本解构
let [a, b, c] = arr;
console.log(a, b, c); // 1 2 3

// 跳过元素
let [first, , third] = arr;
console.log(first, third); // 1 3

// 剩余模式
let [head, ...tail] = arr;
console.log(head); // 1
console.log(tail); // [2, 3]

// 默认值
let [x, y, z, w = 10] = arr;
console.log(w); // 10

// 交换变量
let a = 1, b = 2;
[a, b] = [b, a];
console.log(a, b); // 2 1
```

---

## 9. 对象

### 9.1 创建对象

```javascript
// 字面量
let person = {
    name: '张三',
    age: 25,
    sayHello: function() {
        return '你好，我是' + this.name;
    }
};

// 构造函数
let person2 = new Object();
person2.name = '李四';
person2.age = 30;

// Object.create()
let person3 = Object.create(null);
person3.name = '王五';
```

### 9.2 访问属性

```javascript
let person = { name: '张三', age: 25 };

// 点符号
console.log(person.name); // "张三"

// 方括号
console.log(person['name']); // "张三"

// 动态属性
let key = 'name';
console.log(person[key]); // "张三"

// 可选链（ES2020）
let data = {};
console.log(data?.profile?.age); // undefined（不报错）
```

### 9.3 修改属性

```javascript
let person = { name: '张三' };

// 修改
person.age = 25;

// 添加
person.city = 'Beijing';

// 删除
delete person.city;

// 检查
console.log('name' in person); // true
console.log(person.hasOwnProperty('age')); // true
```

### 9.4 方法

```javascript
let person = {
    name: '张三',
    age: 25,

    // 方法简写（ES6+）
    sayHello() {
        return '你好，我是' + this.name;
    },

    // 箭头函数（this 指向外部）
    getAge: () => {
        // console.log(this); // 指向 window
        return this.age;
    }
};

console.log(person.sayHello());
```

### 9.5 this 关键字

```javascript
// 普通函数中的 this
function show() {
    console.log(this);
}
show(); // window（严格模式下 undefined）

// 对象方法中的 this
let person = {
    name: '张三',
    show() {
        console.log(this.name);
    }
};
person.show(); // "张三"

// 事件处理中的 this
// <button id="btn">点击</button>
btn.addEventListener('click', function() {
    console.log(this); // button 元素
});

// 构造函数中的 this
function Person(name, age) {
    this.name = name;
    this.age = age;
}
let p = new Person('张三', 25);
console.log(p.name); // "张三"

// 箭头函数中的 this
let obj = {
    name: '张三',
    show: () => {
        console.log(this); // 继承外部的 this
    }
};
```

### 9.6 对象解构（ES6+）

```javascript
let person = { name: '张三', age: 25, city: 'Beijing' };

// 基本解构
let { name, age } = person;
console.log(name, age); // 张三 25

// 重命名
let { name: personName, age: personAge } = person;
console.log(personName); // "张三"

// 默认值
let { name, country = '中国' } = person;
console.log(country); // "中国"

// 剩余模式
let { name, ...rest } = person;
console.log(rest); // { age: 25, city: 'Beijing' }

// 函数参数解构
function greet({ name, age }) {
    return `你好，我叫${name}，今年${age}岁`;
}
console.log(greet({ name: '张三', age: 25 }));
```

### 9.7 Object 常用方法

```javascript
let obj = { a: 1, b: 2 };

// keys
console.log(Object.keys(obj)); // ['a', 'b']

// values
console.log(Object.values(obj)); // [1, 2]

// entries
console.log(Object.entries(obj)); // [['a', 1], ['b', 2]]

// assign（合并）
let obj2 = { c: 3 };
let merged = Object.assign({}, obj, obj2);
console.log(merged); // { a: 1, b: 2, c: 3 }

// freeze（冻结）
let frozen = Object.freeze({ a: 1 });
// frozen.a = 2; // 报错（严格模式）或 静默失败

// seal（密封）
let sealed = Object.seal({ a: 1 });
sealed.a = 2;     // 可以
// sealed.b = 3; // 报错，不能添加新属性

// hasOwn
console.log(obj.hasOwnProperty('a')); // true
```

---

## 10. DOM 操作

### 10.1 选择元素

```html
<!DOCTYPE html>
<html>
<body>
    <div id="app">
        <h1 class="title">Hello</h1>
        <p class="text">Paragraph 1</p>
        <p class="text">Paragraph 2</p>
    </div>

    <script>
        // 根据 ID 选择
        const app = document.getElementById('app');
        console.log(app);

        // 根据 class 选择（返回 HTMLCollection）
        const texts = document.getElementsByClassName('text');
        console.log(texts[0]);

        // 根据标签选择
        const paragraphs = document.getElementsByTagName('p');

        // querySelector（返回第一个匹配）
        const title = document.querySelector('.title');

        // querySelectorAll（返回所有匹配）
        const allTexts = document.querySelectorAll('.text');
    </script>
</body>
</html>
```

### 10.2 创建元素

```javascript
// 创建新元素
const newDiv = document.createElement('div');
newDiv.textContent = '新创建的 div';
newDiv.className = 'new-div';
newDiv.style.color = 'red';

// 添加到页面
document.body.appendChild(newDiv);

// 或插入到指定位置
const container = document.getElementById('app');
container.appendChild(newDiv);

// insertBefore
const firstChild = container.firstChild;
container.insertBefore(newDiv, firstChild);

// insertAdjacentHTML
container.insertAdjacentHTML('beforeend', '<p>新段落</p>');
// beforebegin, afterbegin, beforeend, afterend
```

### 10.3 修改元素

```javascript
const element = document.querySelector('.text');

// 修改内容
element.innerHTML = '<strong>粗体文字</strong>';
element.textContent = '纯文本内容';

// 修改属性
element.setAttribute('data-id', '123');
element.id = 'newId';
console.log(element.getAttribute('data-id'));

// 修改样式
element.style.color = 'blue';
element.style.backgroundColor = '#f0f0f0';
element.style.fontSize = '20px';

// 修改类名
element.classList.add('active');
element.classList.remove('hidden');
element.classList.toggle('selected');
console.log(element.classList.contains('active'));
```

### 10.4 事件处理

```javascript
const button = document.querySelector('#myButton');

// addEventListener
button.addEventListener('click', function(event) {
    console.log('按钮被点击了！');
    console.log(event.target); // 触发事件的元素
});

// 箭头函数
button.addEventListener('click', (e) => {
    console.log(e.type); // "click"
});

// 移除事件
function handleClick() {
    console.log('clicked');
}
button.addEventListener('click', handleClick);
button.removeEventListener('click', handleClick);

// 常见事件
// 鼠标事件: click, dblclick, mousedown, mouseup, mouseover, mouseout
// 键盘事件: keydown, keyup, keypress
// 表单事件: submit, change, input, focus, blur
// 窗口事件: load, resize, scroll

// 事件委托
document.getElementById('list').addEventListener('click', (e) => {
    if (e.target.tagName === 'LI') {
        console.log('点击了 li', e.target.textContent);
    }
});

// 阻止默认行为
link.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('链接被阻止跳转');
});

// 停止冒泡
child.addEventListener('click', (e) => {
    e.stopPropagation();
    console.log('child clicked');
});
```

### 10.5 DOM 操作示例

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        .todo-item {
            display: flex;
            align-items: center;
            padding: 10px;
            border-bottom: 1px solid #ddd;
        }
        .todo-item.completed {
            text-decoration: line-through;
            color: #999;
        }
        .delete-btn {
            margin-left: auto;
            background: #ff4444;
            color: white;
            border: none;
            padding: 5px 10px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <h1>待办事项</h1>
    <input type="text" id="todoInput" placeholder="添加新事项...">
    <button id="addBtn">添加</button>
    <div id="todoList"></div>

    <script>
        const input = document.getElementById('todoInput');
        const addBtn = document.getElementById('addBtn');
        const todoList = document.getElementById('todoList');

        // 添加待办事项
        addBtn.addEventListener('click', addTodo);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addTodo();
        });

        function addTodo() {
            const text = input.value.trim();
            if (!text) return;

            // 创建元素
            const todoItem = document.createElement('div');
            todoItem.className = 'todo-item';

            todoItem.innerHTML = `
                <input type="checkbox" class="checkbox">
                <span>${text}</span>
                <button class="delete-btn">删除</button>
            `;

            // 事件处理
            const checkbox = todoItem.querySelector('.checkbox');
            checkbox.addEventListener('change', (e) => {
                todoItem.classList.toggle('completed', e.target.checked);
            });

            const deleteBtn = todoItem.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => {
                todoItem.remove();
            });

            todoList.appendChild(todoItem);
            input.value = '';
        }
    </script>
</body>
</html>
```

---

## 11. 错误处理

### 11.1 try...catch

```javascript
// 基本语法
try {
    // 可能出错的代码
    let result = riskyFunction();
    console.log(result);
} catch (error) {
    // 错误处理
    console.log('发生错误：' + error.message);
}

// finally（无论是否出错都会执行）
try {
    console.log('尝试执行');
} catch (e) {
    console.log('捕获错误');
} finally {
    console.log('总是执行');
}
```

### 11.2 Error 对象

```javascript
try {
    // 手动抛出错误
    throw new Error('自定义错误信息');
} catch (error) {
    console.log(error.name);    // Error
    console.log(error.message); // 自定义错误信息
    console.log(error.stack);   // 堆栈跟踪
}

// 常见错误类型
try {
    undefinedVariable; // ReferenceError
} catch (e) {
    console.log(e instanceof ReferenceError); // true
}

try {
    JSON.parse('invalid'); // SyntaxError
} catch (e) {
    console.log(e instanceof SyntaxError); // true
}

try {
    ({}).undefinedMethod(); // TypeError
} catch (e) {
    console.log(e instanceof TypeError); // true
}
```

### 11.3 throw

```javascript
// 抛出各种类型的错误
throw new Error('错误信息');
throw new SyntaxError('语法错误');
throw new ReferenceError('引用错误');
throw new TypeError('类型错误');
throw new RangeError('范围错误');

// 自定义错误
class ValidationError extends Error {
    constructor(message, field) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
    }
}

try {
    throw new ValidationError('年龄必须是数字', 'age');
} catch (e) {
    if (e instanceof ValidationError) {
        console.log(e.field + ': ' + e.message);
    }
}
```

### 11.4 错误处理最佳实践

```javascript
// 1. 使用 try...catch 处理异步操作
async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('网络响应失败');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('获取数据失败：', error);
        throw error; // 重新抛出或处理
    }
}

// 2. 验证函数输入
function divide(a, b) {
    if (typeof a !== 'number' || typeof b !== 'number') {
        throw new TypeError('参数必须是数字');
    }
    if (b === 0) {
        throw new Error('不能除以零');
    }
    return a / b;
}

// 3. 全局错误处理
window.addEventListener('error', (event) => {
    console.error('全局错误：', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('未处理的 Promise 拒绝：', event.reason);
});
```

---

## 练习题

### 练习 1：计算器

创建一个计算器函数，支持：
- 加减乘除
- 参数验证
- 错误处理

### 练习 2：数组去重

实现数组去重函数，比较不同方法的效率。

### 练习 3：表单验证

创建表单验证函数：
- 验证邮箱格式
- 验证手机号
- 验证密码强度

### 练习 4：待办事项应用

使用 DOM 操作创建完整的待办事项应用：
- 添加任务
- 标记完成
- 删除任务
- 本地存储保存

### 练习 5：深拷贝

实现对象的深拷贝函数，处理循环引用。

---

## 总结

本章全面介绍了 JavaScript 的核心知识点：

1. **JavaScript 简介**：定义、作用、书写位置、输出方式
2. **变量**：var、let、const 的区别和使用场景
3. **数据类型**：原始类型（Number、String、Boolean、undefined、null、Symbol）和引用类型（Object、Array）
4. **运算符**：算术、赋值、比较、逻辑、三元运算符
5. **条件语句**：if...else、switch、三元运算符
6. **循环**：for、while、do...while、for...in、for...of
7. **函数**：声明、参数、返回值、作用域、闭包、递归
8. **数组**：创建、访问、修改、常用方法
9. **对象**：创建、属性访问、this 指向、解构
10. **DOM 操作**：选择、创建、修改、事件处理
11. **错误处理**：try...catch、throw、Error 对象

掌握这些基础内容后，你就可以开始编写交互性强的网页和应用了！
