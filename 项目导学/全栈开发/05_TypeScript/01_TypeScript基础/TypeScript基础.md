# TypeScript基础

## 目录

1. [类型系统](#1-类型系统)
2. [接口与类型别名](#2-接口与类型别名)
3. [函数类型](#3-函数类型)

---

## 1. 类型系统

### 1.1 基础类型

```typescript
// 基础类型
let name: string = '张三';
let age: number = 25;
let isStudent: boolean = true;
let nullValue: null = null;
let undefinedValue: undefined = undefined;

// 数组
let numbers: number[] = [1, 2, 3];
let strings: Array<string> = ['a', 'b', 'c'];

// 元组
let tuple: [string, number] = ['张三', 25];

// 枚举
enum Color {
    Red = 'red',
    Green = 'green',
    Blue = 'blue'
}
let color: Color = Color.Red;

// Any（任意类型）
let anything: any = '任意值';
anything = 123;
anything = {};

// Unknown（未知类型）
let unknownValue: unknown = 'hello';
// 需要类型断言或类型守卫
if (typeof unknownValue === 'string') {
    console.log(unknownValue.toUpperCase());
}

// Void（无返回值）
function log(message: string): void {
    console.log(message);
}

// Never（永不返回值）
function throwError(message: string): never {
    throw new Error(message);
}
```

### 1.2 对象类型

```typescript
// 对象类型定义
let user: { name: string; age: number } = {
    name: '张三',
    age: 25
};

// 可选属性
let person: {
    name: string;
    age?: number;
} = {
    name: '张三'
};

// 只读属性
let config: {
    readonly apiUrl: string;
    timeout: number;
} = {
    apiUrl: 'https://api.example.com',
    timeout: 5000
};
// config.apiUrl = 'other'; // 错误：只读
```

---

## 2. 接口与类型别名

### 2.1 接口定义

```typescript
// 接口基础
interface User {
    id: number;
    name: string;
    email: string;
    age?: number;           // 可选属性
    readonly createdAt: Date; // 只读属性
}

const user: User = {
    id: 1,
    name: '张三',
    email: 'zhangsan@example.com',
    createdAt: new Date()
};

// 接口继承
interface Person {
    name: string;
    age: number;
}

interface Employee extends Person {
    employeeId: string;
    department: string;
}

const employee: Employee = {
    name: '李四',
    age: 30,
    employeeId: 'E001',
    department: 'Engineering'
};

// 接口声明合并
interface Config {
    url: string;
}

interface Config {
    method: string;
}

const config: Config = {
    url: 'https://api.example.com',
    method: 'GET'
};
```

### 2.2 类型别名

```typescript
// 类型别名基础
type ID = string | number;
type Status = 'pending' | 'success' | 'error';
type Callback = (data: string) => void;

// 使用类型别名
let userId: ID = '123';
let status: Status = 'success';
```

### 2.3 接口 vs 类型别名

```typescript
// 接口：适合定义对象结构，可以合并声明
interface Animal {
    name: string;
}

interface Animal {
    age: number;
}

// 类型别名：适合联合类型、函数类型、元组
type StringOrNumber = string | number;
type Callback = () => void;
type Point = [number, number];

// 选择建议：
// - 对象结构优先使用 interface
// - 联合类型、元组优先使用 type
```

---

## 3. 函数类型

### 3.1 函数类型定义

```typescript
// 函数声明
function add(a: number, b: number): number {
    return a + b;
}

// 函数表达式
const multiply = function(a: number, b: number): number {
    return a * b;
};

// 箭头函数
const divide = (a: number, b: number): number => {
    return a / b;
};

// 可选参数
function greet(name: string, greeting?: string): string {
    return greeting ? `${greeting}, ${name}!` : `Hello, ${name}!`;
}

// 默认参数
function greet(name: string, greeting: string = 'Hello'): string {
    return `${greeting}, ${name}!`;
}

// 剩余参数
function sum(...numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0);
}
```

### 3.2 函数重载

```typescript
// 函数重载
function getValue(key: string): string | undefined;
function getValue(key: string, defaultValue: string): string;

function getValue(key: string, defaultValue?: string): string | undefined {
    const value = localStorage.getItem(key);
    if (value === null && defaultValue !== undefined) {
        return defaultValue;
    }
    return value || undefined;
}

// 调用
const value1 = getValue('name');
const value2 = getValue('name', 'default');
```

### 3.3 类型守卫

```typescript
// typeof 守卫
function print(value: string | number) {
    if (typeof value === 'string') {
        console.log(value.toUpperCase());
    } else {
        console.log(value.toFixed(2));
    }
}

// instanceof 守卫
class Dog {
    bark() { console.log('Woof!'); }
}

class Cat {
    meow() { console.log('Meow!'); }
}

function makeSound(animal: Dog | Cat) {
    if (animal instanceof Dog) {
        animal.bark();
    } else {
        animal.meow();
    }
}

// 自定义守卫
interface Fish {
    swim(): void;
}

interface Bird {
    fly(): void;
}

function isFish(pet: Fish | Bird): pet is Fish {
    return (pet as Fish).swim !== undefined;
}

function move(pet: Fish | Bird) {
    if (isFish(pet)) {
        pet.swim();
    } else {
        pet.fly();
    }
}
```

---

## 4. 常见面试问题

**问题1：TypeScript 和 JavaScript 有什么区别？**

答案：
- TypeScript 是 JavaScript 的超集，添加了类型系统
- TypeScript 编译为 JavaScript 运行
- TypeScript 提供编译时类型检查

**问题2：interface 和 type 有什么区别？**

答案：
- interface 可以合并声明，type 不行
- type 可以定义联合类型、元组，interface 不行
- 一般对象结构用 interface，复杂类型用 type
