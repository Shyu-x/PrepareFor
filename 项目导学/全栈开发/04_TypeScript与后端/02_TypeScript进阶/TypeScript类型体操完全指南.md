# TypeScript类型体操完全指南

## 概述

类型体操是TypeScript最强大的特性之一，它让我们能够在类型系统层面进行编程，实现复杂的类型逻辑。本指南将深入探讨TypeScript的高级类型技巧，从基础的类型注解到复杂的类型推导，帮助你掌握类型系统的精髓。

**前置知识**：本教程假设你已经掌握了TypeScript的基础语法，包括基础类型、接口、类型别名等概念。如果你是TypeScript初学者，建议先阅读《TypeScript完全指南》后再学习本教程。

---

## 一、TypeScript类型基础深入

### 1.1 类型注解与类型推断

TypeScript的核心特性是**静态类型检查**，而实现这一特性的两种主要方式是类型注解和类型推断。

**类型注解**是指我们显式地为一个变量、函数参数或返回值指定类型：

```typescript
// 显式指定变量类型
let name: string = "张三";
let age: number = 25;
let isActive: boolean = true;

// 数组类型注解
let numbers: number[] = [1, 2, 3, 4, 5];
let names: Array<string> = ["Alice", "Bob", "Charlie"];

// 函数参数和返回值的类型注解
function add(a: number, b: number): number {
    return a + b;
}

// 对象类型注解
interface User {
    id: number;
    name: string;
    email: string;
    age?: number; // 可选属性
}

const user: User = {
    id: 1,
    name: "李四",
    email: "lisi@example.com"
};
```

**类型推断**是TypeScript根据变量的初始值或上下文自动推断出变量类型的能力：

```typescript
// TypeScript自动推断为string类型
let message = "Hello, TypeScript"; // string

// TypeScript自动推断为number类型
let count = 42; // number

// TypeScript自动推断为boolean类型
let isDone = false; // boolean

// 从函数返回值推断返回类型
function multiply(a: number, b: number) {
    return a * b; // TypeScript推断返回类型为number
}

// 数组字面量的类型推断
let scores = [95, 82, 77, 91, 65]; // number[]

// 对象字面量的类型推断
const person = {
    name: "王五",
    age: 30,
    city: "北京"
};
// TypeScript推断person的类型为: { name: string; age: number; city: string; }
```

**类型推断的最佳实践**：

```typescript
// 推荐：使用类型推断简化代码
const config = {
    host: "localhost",
    port: 3306,
    database: "myapp",
    user: "admin",
    password: "123456"
};
// TypeScript自动推断config的类型，无需手动注解

// 不推荐：过度使用类型注解降低代码可读性
const config: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
} = {
    host: "localhost",
    port: 3306,
    database: "myapp",
    user: "admin",
    password: "123456"
};

// 折中方案：使用类型别名或接口
interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
}

const config: DatabaseConfig = {
    host: "localhost",
    port: 3306,
    database: "myapp",
    user: "admin",
    password: "123456"
};
```

### 1.2 基础类型与联合类型、交叉类型

**基础类型**包括：string、number、boolean、null、undefined、symbol、bigint、void、never、object。

```typescript
// 基础类型示例
let str: string = "字符串";
let num: number = 123;
let bool: boolean = true;
let n: null = null;
let u: undefined = undefined;
let sym: symbol = Symbol("unique");
let big: bigint = 100n;
let nothing: void = undefined;
let neverVal: never;

// 数组类型
let arr1: number[] = [1, 2, 3];
let arr2: string[] = ["a", "b", "c"];
let arr3: (number | string)[] = [1, "a", 2, "b"];

// 元组类型 - 固定长度和类型的数组
let tuple: [string, number, boolean] = ["hello", 42, true];
let tuple2: [name: string, age: number] = ["张三", 25];

// 枚举类型
enum Color {
    Red = "#FF0000",
    Green = "#00FF00",
    Blue = "#0000FF"
}

let background: Color = Color.Green;
```

**联合类型**表示一个值可以是多种类型之一，使用`|`操作符连接：

```typescript
// 联合类型基础
let id: number | string;
id = 123;      // 合法
id = "ABC123"; // 合法
// id = true;  // 不合法，boolean不是number | string

// 函数参数使用联合类型
function formatValue(value: string | number | boolean): string {
    if (typeof value === "string") {
        return value.toUpperCase();
    } else if (typeof value === "number") {
        return value.toFixed(2);
    } else {
        return value ? "TRUE" : "FALSE";
    }
}

// 联合类型在数组中的应用
let mixedArray: (number | string)[] = [1, "a", 2, "b", 3];

// 字面量联合类型 - 限制值为特定的字面量
type Direction = "north" | "south" | "east" | "west";
type Status = "pending" | "approved" | "rejected";
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

function move(direction: Direction): void {
    console.log(`Moving ${direction}`);
}

move("north");  // 合法
move("up");     // 不合法，类型"up"不能赋值给类型"north" | "south" | "east" | "west"
```

**交叉类型**表示一个值同时具有多种类型的所有成员，使用`&`操作符连接：

```typescript
// 交叉类型基础
interface Person {
    name: string;
    age: number;
}

interface Employee {
    companyId: string;
    department: string;
}

// 交叉类型：同时具有Person和Employee的所有属性
type EmployeePerson = Person & Employee;

const employee: EmployeePerson = {
    name: "张三",
    age: 30,
    companyId: "C001",
    department: "技术部"
};

// 交叉类型用于接口继承
interface A {
    propA: string;
}

interface B {
    propB: number;
}

interface C extends A, B {
    propC: boolean;
}

// 等价于
type CType = A & B & {
    propC: boolean;
};

// 交叉类型的实际应用：合并配置对象
type WindowConfig = {
    width: number;
    height: number;
    title?: string;
};

type WindowFeatures = {
    resizable: boolean;
    maximizable: boolean;
    minimizable: boolean;
};

type FullWindowConfig = WindowConfig & WindowFeatures;

function createWindow(config: FullWindowConfig): void {
    console.log(`Creating window: ${config.width}x${config.height}`);
    console.log(`Resizable: ${config.resizable}`);
}

createWindow({
    width: 800,
    height: 600,
    resizable: true,
    maximizable: true,
    minimizable: true
});
```

### 1.3 接口vs类型别名

接口和类型别名都可以用来定义类型，但它们有一些重要的区别和各自的优势：

```typescript
// ==================== 接口 ====================

// 接口定义对象结构
interface User {
    id: number;
    name: string;
    email: string;
}

// 接口可以声明合并 - 多个同名接口会自动合并
interface User {
    age?: number;
    avatar?: string;
}

// 合并后的User接口等价于：
// interface User {
//     id: number;
//     name: string;
//     email: string;
//     age?: number;
//     avatar?: string;
// }

// 接口可以继承
interface Admin extends User {
    permissions: string[];
}

// ==================== 类型别名 ====================

// 类型别名定义任何类型
type UserType = {
    id: number;
    name: string;
    email: string;
};

// 类型别名可以使用联合类型
type ID = number | string;
type StatusType = "active" | "inactive" | "pending";

// 类型别名可以使用交叉类型
type ExtendedUser = UserType & {
    age: number;
    avatar: string;
};

// ==================== 对比 ====================

// 1. 接口适合定义对象结构，类型别名适合定义联合类型、交叉类型等复杂类型
type StringOrNumber = string | number;
type Callback = () => void;

// 2. 接口可以声明合并，类型别名不能
// 这在扩展第三方库类型时非常有用
interface Window {
    myExtension: string;
}

// 3. 类型别名可以使用更复杂的表达式
type T1 = string | number;
type T2 = T1 extends string ? never : T1;

// 4. 类可以实现接口
class UserImpl implements User {
    id: number;
    name: string;
    email: string;
}

// ==================== 最佳实践 ====================

// 推荐：使用接口定义对象结构
interface Point {
    x: number;
    y: number;
}

// 推荐：使用类型别名定义联合类型、交叉类型、工具类型
type Primitive = string | number | boolean | null | undefined;
type ReadonlyPoint = Readonly<Point>;
type PartialPoint = Partial<Point>;

// 复杂场景的选择
// - 定义公开API的对象结构 → 接口（易于扩展）
// - 定义配置对象 → 接口（声明合并方便扩展）
// - 定义联合类型 → 类型别名
// - 定义映射类型 → 类型别名
```

### 1.4 枚举类型

枚举是TypeScript的一种特殊类型，它允许我们定义一组命名常量：

```typescript
// ==================== 数字枚举 ====================

// 默认从0开始递增
enum Direction {
    North,  // 0
    South,  // 1
    East,   // 2
    West    // 3
}

// 设置起始值
enum Status {
    Pending = 1,
    Approved,   // 2
    Rejected,   // 3
    Completed   // 4
}

// 完全自定义值
enum HttpStatus {
    OK = 200,
    BadRequest = 400,
    Unauthorized = 401,
    Forbidden = 403,
    NotFound = 404
}

// 使用枚举
function getStatusMessage(status: Status): string {
    switch (status) {
        case Status.Pending:
            return "请求等待中...";
        case Status.Approved:
            return "请求已批准";
        case Status.Rejected:
            return "请求被拒绝";
        case Status.Completed:
            return "请求已完成";
        default:
            return "未知状态";
    }
}

// ==================== 字符串枚举 ====================

enum Environment {
    Development = "development",
    Staging = "staging",
    Production = "production"
}

enum Permission {
    Read = "read",
    Write = "write",
    Execute = "execute"
}

// 字符串枚举的优势：序列化后的值更有意义
// 反向映射也可用
let statusName = Status[2]; // "Approved"
let httpMessage = HttpStatus[200]; // "OK"

// ==================== 常量枚举 ====================

// 常量枚举会在编译时被完全移除，所有使用枚举值的地方都会被替换为实际的值
const enum Color {
    Red = "#FF0000",
    Green = "#00FF00",
    Blue = "#0000FF"
}

// 编译后：console.log("#FF0000"); 不会有Color.Red的存在
console.log(Color.Red);
console.log(Color.Green);

// 常量枚举的性能优势
// 1. 没有运行时开销
// 2. 生成的JavaScript代码更小
// 3. 适合那些只在编译时使用的枚举

// ==================== 异构枚举 ====================

// 混合数字和字符串的枚举（不推荐，但合法）
enum BooleanLike {
    Yes = 1,
    No = "NO"
}

// ==================== 枚举的实际应用 ====================

// 配置管理
enum LogLevel {
    Debug = "DEBUG",
    Info = "INFO",
    Warn = "WARN",
    Error = "ERROR"
}

interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: Date;
}

function log(entry: LogEntry): void {
    const levelPrefix = `[${entry.level}]`;
    console.log(`${levelPrefix} ${entry.timestamp.toISOString()}: ${entry.message}`);
}

log({
    level: LogLevel.Info,
    message: "应用程序启动",
    timestamp: new Date()
});

// 状态机
enum OrderState {
    Created = "CREATED",
    Paid = "PAID",
    Shipped = "SHIPPED",
    Delivered = "DELIVERED",
    Cancelled = "CANCELLED"
}

function canCancelOrder(state: OrderState): boolean {
    return state === OrderState.Created || state === OrderState.Paid;
}

function getNextState(state: OrderState): OrderState | null {
    switch (state) {
        case OrderState.Created:
            return OrderState.Paid;
        case OrderState.Paid:
            return OrderState.Shipped;
        case OrderState.Shipped:
            return OrderState.Delivered;
        case OrderState.Delivered:
        case OrderState.Cancelled:
            return null;
    }
}
```

### 1.5 类型守卫

类型守卫是TypeScript中用于在条件块中缩小变量类型范围的机制：

```typescript
// ==================== typeof类型守卫 ====================

function processValue(value: string | number | boolean) {
    if (typeof value === "string") {
        // 在这个分支中，TypeScript知道value是string类型
        return value.toUpperCase();
    } else if (typeof value === "number") {
        // 在这个分支中，TypeScript知道value是number类型
        return value.toFixed(2);
    } else {
        // 在这个分支中，TypeScript知道value是boolean类型
        return value ? "是" : "否";
    }
}

// typeof的局限性：只能识别基础类型
// typeof === "object"无法区分object的具体类型

// ==================== instanceof类型守卫 ====================

class Animal {
    name: string;
    constructor(name: string) {
        this.name = name;
    }
}

class Dog extends Animal {
    breed: string;
    constructor(name: string, breed: string) {
        super(name);
        this.breed = breed;
    }
}

class Cat extends Animal {
    color: string;
    constructor(name: string, color: string) {
        super(name);
        this.color = color;
    }
}

function makeSound(animal: Animal): void {
    if (animal instanceof Dog) {
        // TypeScript知道这里是Dog类型
        console.log(`${animal.name}是一只${animal.breed}狗，汪汪汪！`);
    } else if (animal instanceof Cat) {
        // TypeScript知道这里是Cat类型
        console.log(`${animal.name}是一只${animal.color}猫，喵喵喵！`);
    } else {
        // 基础Animal类型
        console.log(`${animal.name}发出了声音`);
    }
}

// ==================== in操作符类型守卫 ====================

interface Admin {
    adminId: number;
    permissions: string[];
}

interface User {
    userId: number;
    email: string;
}

function isAdmin(person: Admin | User): boolean {
    return "permissions" in person;
}

function handlePerson(person: Admin | User): void {
    if (isAdmin(person)) {
        // TypeScript知道这里是Admin类型
        console.log(`管理员权限: ${person.permissions.join(", ")}`);
    } else {
        // TypeScript知道这里是User类型
        console.log(`用户邮箱: ${person.email}`);
    }
}

// ==================== 字面量类型守卫 ====================

type Shape =
    | { kind: "circle"; radius: number }
    | { kind: "rectangle"; width: number; height: number }
    | { kind: "triangle"; base: number; height: number };

function getArea(shape: Shape): number {
    if (shape.kind === "circle") {
        // TypeScript知道这里是circle类型
        return Math.PI * shape.radius ** 2;
    } else if (shape.kind === "rectangle") {
        // TypeScript知道这里是rectangle类型
        return shape.width * shape.height;
    } else {
        // TypeScript知道这里是triangle类型
        return (shape.base * shape.height) / 2;
    }
}

// ==================== 自定义类型守卫 ====================

// 类型谓词函数
function isString(value: unknown): value is string {
    return typeof value === "string";
}

function isNonNullable<T>(value: T): value is NonNullable<T> {
    return value !== null && value !== undefined;
}

function processOptional(value: string | null | undefined): void {
    if (isNonNullable(value)) {
        // TypeScript知道value是string类型（排除了null和undefined）
        console.log(`Value: ${value.toUpperCase()}`);
    }
}

function filterStrings(values: (string | number | null)[]): string[] {
    return values.filter((value): value is string => isString(value));
}

// ==================== 可辨识联合类型 ====================

// 可辨识联合类型是一种强大的模式，它使用一个公共的"辨识"属性来区分联合成员
interface BaseResponse {
    status: "success" | "error";
}

interface SuccessResponse extends BaseResponse {
    status: "success";
    data: unknown;
}

interface ErrorResponse extends BaseResponse {
    status: "error";
    message: string;
    code: number;
}

type ApiResponse = SuccessResponse | ErrorResponse;

function handleResponse(response: ApiResponse): void {
    if (response.status === "success") {
        console.log("成功获取数据:", response.data);
    } else {
        console.error(`错误 [${response.code}]: ${response.message}`);
    }
}
```

---

## 二、泛型深入

### 2.1 泛型函数、泛型接口、泛型类

泛型是TypeScript最强大的特性之一，它允许我们编写可复用的组件，这些组件可以支持多种类型：

```typescript
// ==================== 泛型函数 ====================

// 基本泛型函数
function identity<T>(value: T): T {
    return value;
}

// 使用泛型函数
let num = identity<number>(42);       // number类型
let str = identity<string>("hello"); // string类型
let bool = identity(true);            // TypeScript自动推断类型为boolean

// 多类型参数的泛型函数
function makePair<K, V>(key: K, value: V): [K, V] {
    return [key, value];
}

let pair1 = makePair<string, number>("age", 25);
let pair2 = makePair("name", "张三"); // 自动推断为[string, string]

// 泛型约束
function getLength<T extends { length: number }>(value: T): number {
    return value.length;
}

console.log(getLength("hello"));        // 5
console.log(getLength([1, 2, 3]));      // 3
console.log(getLength({ length: 10 })); // 10
// getLength(123); // 错误：number没有length属性

// ==================== 泛型接口 ====================

// 定义泛型接口
interface Container<T> {
    value: T;
    getValue(): T;
    setValue(value: T): void;
}

class StringContainer implements Container<string> {
    value: string;

    constructor(initial: string) {
        this.value = initial;
    }

    getValue(): string {
        return this.value;
    }

    setValue(value: string): void {
        this.value = value;
    }
}

class NumberContainer implements Container<number> {
    value: number;

    constructor(initial: number) {
        this.value = initial;
    }

    getValue(): number {
        return this.value;
    }

    setValue(value: number): void {
        this.value = value;
    }
}

// 使用泛型接口
const stringContainer = new StringContainer("Hello");
console.log(stringContainer.getValue()); // Hello

const numberContainer = new NumberContainer(42);
console.log(numberContainer.getValue()); // 42

// ==================== 泛型类 ====================

// 基本泛型类
class Stack<T> {
    private items: T[] = [];

    push(item: T): void {
        this.items.push(item);
    }

    pop(): T | undefined {
        return this.items.pop();
    }

    peek(): T | undefined {
        return this.items[this.items.length - 1];
    }

    isEmpty(): boolean {
        return this.items.length === 0;
    }

    size(): number {
        return this.items.length;
    }
}

// 使用泛型类
const numberStack = new Stack<number>();
numberStack.push(1);
numberStack.push(2);
numberStack.push(3);
console.log(numberStack.pop()); // 3

const stringStack = new Stack<string>();
stringStack.push("a");
stringStack.push("b");
console.log(stringStack.pop()); // "b"

// 多类型参数的泛型类
class Pair<K, V> {
    constructor(
        public readonly key: K,
        public readonly value: V
    ) {}

    toString(): string {
        return `Pair(${this.key}, ${this.value})`;
    }
}

const pair = new Pair<string, number>("score", 95);
console.log(pair.toString()); // Pair(score, 95)

// ==================== 泛型与数组、元组 ====================

// 泛型数组类型
function firstElement<T>(arr: T[]): T | undefined {
    return arr[0];
}

function lastElement<T>(arr: T[]): T | undefined {
    return arr[arr.length - 1];
}

function swap<T, U>(tuple: [T, U]): [U, T] {
    return [tuple[1], tuple[0]];
}

// 读取数组类型
type ElementType<T> = T extends (infer E)[] ? E : never;

type A = ElementType<number[]>;  // number
type B = ElementType<string[]>; // string
type C = ElementType<boolean[]>; // boolean

// ==================== 泛型的默认类型 ====================

interface Response<T = string> {
    data: T;
    status: number;
}

type StringResponse = Response;           // 等价于Response<string>
type NumberResponse = Response<number>;  // data是number类型
type ObjectResponse = Response<{ id: number; name: string }>;

// 泛型约束与默认值结合
function processValue<T extends string | number = string>(value: T): T {
    console.log(`Processing: ${value}`);
    return value;
}

processValue("hello"); // OK, T默认为string
processValue(123);     // OK, T是number
```

### 2.2 泛型约束详解

泛型约束使用`extends`关键字来限制泛型参数的类型范围：

```typescript
// ==================== 基本泛型约束 ====================

// 要求泛型参数必须具有特定属性
interface HasLength {
    length: number;
}

function logLength<T extends HasLength>(value: T): void {
    console.log(`Length: ${value.length}`);
}

logLength("hello");        // OK
logLength([1, 2, 3]);      // OK
logLength({ length: 10 }); // OK
// logLength(123);          // 错误

// 约束泛型为对象键
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
    return obj[key];
}

const user = {
    id: 1,
    name: "张三",
    email: "zhangsan@example.com"
};

const name = getProperty(user, "name");     // string
const id = getProperty(user, "id");         // number
// const invalid = getProperty(user, "age"); // 错误，类型"age"不在user中

// ==================== 多重约束 ====================

// 要求同时满足多个约束
interface Printable {
    print(): void;
}

interface Serializable {
    serialize(): string;
}

function processAndPrint<T extends Printable & Serializable>(obj: T): void {
    obj.print();
    console.log(obj.serialize());
}

// 使用extends约束继承链
class Animal {
    name: string;
    constructor(name: string) {
        this.name = name;
    }
}

class Bird extends Animal {
    wingspan: number;
    constructor(name: string, wingspan: number) {
        super(name);
        this.wingspan = wingspan;
    }
}

function getAnimalName<T extends Animal>(animal: T): string {
    return animal.name;
}

const bird = new Bird("麻雀", 20);
console.log(getAnimalName(bird)); // "麻雀"

// ==================== 在约束中使用泛型 ====================

// 创建一个从对象中提取特定类型值的函数
function extract<T, K extends keyof T>(obj: T, keys: K[]): T[K][] {
    return keys.map(key => obj[key]);
}

const product = {
    id: 1,
    name: "笔记本电脑",
    price: 5999,
    category: "电子产品"
};

const values = extract(product, ["name", "price"] as const);
// values的类型为(string | number)[]，实际上是("笔记本电脑" | 5999)[]

// 泛型约束实现Builder模式
class QueryBuilder<T extends Record<string, unknown> = {}> {
    private query: T;

    constructor(initial: T = {} as T) {
        this.query = { ...initial };
    }

    where<K extends string, V>(
        this: QueryBuilder<T>,
        key: K,
        value: V
    ): QueryBuilder<T & Record<K, V>> {
        return new QueryBuilder({ ...this.query, [key]: value });
    }

    build(): T {
        return { ...this.query };
    }
}

const query = new QueryBuilder()
    .where("status", "active")
    .where("category", "electronics")
    .build();
// query的类型为{ status: string; category: string; }
```

### 2.3 泛型与数组、元组

```typescript
// ==================== 泛型数组操作 ====================

// 读取数组元素类型
type ArrayElement<T> = T extends readonly (infer E)[] ? E : never;

type Num = ArrayElement<number[]>;     // number
type Str = ArrayElement<string[]>;     // string
type Item = ArrayElement<Array<{ id: number }>>; // { id: number }

// 读取函数参数类型
type FunctionParams<T> = T extends (...args: infer P) => unknown ? P : never;

type AddParams = FunctionParams<(a: number, b: number) => number>; // [number, number]
type StringProcessParams = FunctionParams<(s: string) => string>;   // [string]

// ==================== 泛型元组操作 ====================

// 元组长度
type TupleLength<T extends readonly unknown[]> = T["length"];

type Len1 = TupleLength<[string, number]>;     // 2
type Len2 = TupleLength<[boolean, string, number]>; // 3
type Len3 = TupleLength<[]>;                   // 0

// 元组首尾元素
type First<T extends readonly unknown[]> = T extends readonly [infer F, ...unknown[]] ? F : never;
type Last<T extends readonly unknown[]> = T extends readonly [...unknown[], infer L] ? L : never;

type FirstNum = First<[number, string, boolean]>;  // number
type LastBool = Last<[number, string, boolean]>;    // boolean

// 去除元组最后一个元素
type Pop<T extends readonly unknown[]> = T extends readonly [...infer F, unknown] ? F : never;

type WithoutLast = Pop<[string, number, boolean]>; // [string, number]

// ==================== 实战：实现一个类型安全的EventEmitter ====================

type EventMap = Record<string, unknown>;

interface EventHandler<T = unknown> {
    (data: T): void;
}

class TypedEventEmitter<TEvents extends EventMap> {
    private handlers: {
        [K in keyof TEvents]?: Set<EventHandler<TEvents[K]>>;
    } = {};

    // 订阅事件
    on<K extends keyof TEvents>(
        event: K,
        handler: EventHandler<TEvents[K]>
    ): () => void {
        if (!this.handlers[event]) {
            this.handlers[event] = new Set();
        }
        this.handlers[event]!.add(handler);

        // 返回取消订阅函数
        return () => this.off(event, handler);
    }

    // 取消订阅
    off<K extends keyof TEvents>(
        event: K,
        handler: EventHandler<TEvents[K]>
    ): void {
        this.handlers[event]?.delete(handler);
    }

    // 触发事件
    emit<K extends keyof TEvents>(event: K, data: TEvents[K]): void {
        this.handlers[event]?.forEach(handler => handler(data));
    }

    // 只订阅一次
    once<K extends keyof TEvents>(
        event: K,
        handler: EventHandler<TEvents[K]>
    ): void {
        const wrapper: EventHandler<TEvents[K]> = (data) => {
            handler(data);
            this.off(event, wrapper);
        };
        this.on(event, wrapper);
    }

    // 移除所有事件处理器
    removeAllListeners<K extends keyof TEvents>(event?: K): void {
        if (event) {
            this.handlers[event]?.clear();
        } else {
            Object.keys(this.handlers).forEach(key => {
                this.handlers[key as keyof TEvents]?.clear();
            });
        }
    }
}

// 定义事件类型
interface AppEvents {
    userLoggedIn: { userId: number; username: string; timestamp: Date };
    userLoggedOut: { userId: number };
    messageReceived: { from: string; content: string; timestamp: Date };
    connectionStatusChanged: { connected: boolean };
}

// 使用类型安全的事件发射器
const emitter = new TypedEventEmitter<AppEvents>();

// 订阅userLoggedIn事件
const unsubscribe = emitter.on("userLoggedIn", (data) => {
    console.log(`用户 ${data.username} (ID: ${data.userId}) 登录了`);
});

// 触发事件
emitter.emit("userLoggedIn", {
    userId: 1,
    username: "张三",
    timestamp: new Date()
});

// 取消订阅
unsubscribe();

// 订阅多个事件
emitter.on("messageReceived", (data) => {
    console.log(`收到来自 ${data.from} 的消息: ${data.content}`);
});

emitter.emit("messageReceived", {
    from: "李四",
    content: "你好！",
    timestamp: new Date()
});
```

---

## 三、条件类型

### 3.1 条件类型语法

条件类型是TypeScript类型系统中最强大的特性之一，它允许我们根据类型关系来决定返回哪种类型：

```typescript
// ==================== 基本语法 ====================

// 语法：T extends U ? X : Y
// 如果T可以赋值给U，则类型为X，否则为Y

type IsString<T> = T extends string ? "yes" : "no";

type A = IsString<string>;  // "yes"
type B = IsString<number>;   // "no"
type C = IsString<"hello">; // "yes"（字符串字面量可赋值给string）

// 条件类型与泛型结合
function process<T>(value: T): IsString<T> {
    return typeof value === "string" ? "yes" : "no";
}

// ==================== 条件类型的分布式特性 ====================

// 当条件类型的泛型参数是联合类型时，会分布式计算
type ToArray<T> = T extends any ? T[] : never;

type Result = ToArray<string | number>;
// 相当于：ToArray<string> | ToArray<number>
// 结果：string[] | number[]

// 如果不想分布式，可以使用元组包装
type ToArrayNonDistributive<T> = [T] extends [any] ? T[] : never;

type Result2 = ToArrayNonDistributive<string | number>;
// 结果：(string | number)[]

// ==================== 条件类型的实际应用 ====================

// 类型筛选
type NonNull<T> = T extends null | undefined ? never : T;

type A = NonNull<string | null | undefined>;  // string
type B = NonNull<number | null>;              // number

// 类型推导
type Unwrap<T> = T extends Promise<infer U> ? U : T;

type A2 = Unwrap<Promise<string>>;  // string
type B2 = Unwrap<number>;            // number
type C2 = Unwrap<Promise<{ id: number }>>; // { id: number }

// 提取函数返回类型
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function getUser() {
    return { id: 1, name: "张三" };
}

type UserType = ReturnType<typeof getUser>; // { id: number; name: string; }
```

### 3.2 分布式条件类型

分布式条件类型是条件类型最重要的特性之一，理解它对于掌握TypeScript高级类型至关重要：

```typescript
// ==================== 分布式条件类型原理 ====================

// 当泛型参数是裸类型（没有被元组或数组包装）时
// 条件类型会自动对联合类型的每个成员进行计算

type Diff<T, U> = T extends U ? never : T;

type A = Diff<"a" | "b" | "c", "a" | "b">;
// 相当于：(Diff<"a", "a" | "b">) | (Diff<"b", "a" | "b">) | (Diff<"c", "a" | "b">)
// 相当于：never | never | "c"
// 结果："c"

// ==================== 常见的分布式条件类型工具 ====================

// Extract: 提取T中可以赋值给U的部分
type Extract<T, U> = T extends U ? T : never;

type A3 = Extract<string | number | boolean, string | number>; // string | number
type B3 = Extract<"a" | "b" | "c", "a">;                        // "a"
type C3 = Extract<number | string | number[], string>;           // string

// Exclude: 从T中移除可以赋值给U的部分
type Exclude<T, U> = T extends U ? never : T;

type D = Exclude<string | number | boolean, string | number>; // boolean
type E = Exclude<"a" | "b" | "c", "a">;                        // "b" | "c"
type F = Exclude<number | string | number[], string | number>;  // number[]

// ==================== 组合使用 ====================

// 从联合类型中移除null和undefined
type NonNullable<T> = T extends null | undefined ? never : T;

type G = NonNullable<string | null | undefined | number>; // string | number

// 提取函数类型
type FunctionType<T> = T extends (...args: infer Args) => infer Return
    ? (args: Args) => Return
    : never;

type H = FunctionType<(x: number, y: string) => boolean>; // (args: [number, string]) => boolean

// ==================== 条件类型的嵌套 ====================

// 深度条件类型
type DeepNonNullable<T> = T extends object
    ? { [P in keyof T]-?: DeepNonNullable<NonNullable<T[P]>> }
    : NonNullable<T>;

type Nested = {
    a: string | null;
    b: number | undefined;
    c: {
        d: string | null;
        e: boolean | undefined;
    } | null;
};

type DeepCleaned = DeepNonNullable<Nested>;
// 结果：
// {
//     a: string;
//     b: number;
//     c: {
//         d: string;
//         e: boolean;
//     };
// }
```

### 3.3 内置条件类型详解

TypeScript内置了许多实用的条件类型工具：

```typescript
// ==================== TypeScript内置条件类型 ====================

// ----- Extract<T, U> -----
// 提取T中可以赋值给U的类型
namespace ExtractDemo {
    type A = Extract<string | number, string>;           // string
    type B = Extract<"a" | "b" | "c", "a" | "b">;        // "a" | "b"
    type C = Extract<number | string | boolean, string | number>; // number | string
    type D = Extract<any, string>;                       // any（any比较特殊）
    type E = Extract<never, string>;                     // never
}

// ----- Exclude<T, U> -----
// 从T中排除可以赋值给U的类型
namespace ExcludeDemo {
    type A = Exclude<string | number, string>;           // number
    type B = Exclude<"a" | "b" | "c", "a" | "b">;        // "c"
    type C = Exclude<number | string | boolean, string | number>; // boolean
    type D = Exclude<any, string>;                       // never
    type E = Exclude<never, string>;                     // never
}

// ----- NonNullable<T> -----
// 从T中排除null和undefined
namespace NonNullableDemo {
    type A = NonNullable<string | null | undefined>;     // string
    type B = NonNullable<number[] | null | undefined>;    // number[]
    type C = NonNullable<{ name: string } | null | undefined>; // { name: string }
}

// ----- ReturnType<T> -----
// 提取函数返回类型
namespace ReturnTypeDemo {
    function getUser() {
        return { id: 1, name: "张三", age: 25 };
    }

    type User = ReturnType<typeof getUser>;
    // 结果：{ id: number; name: string; age: number; }

    type PromiseResult = ReturnType<() => Promise<string>>; // Promise<string>
    type NeverResult = ReturnType<() => never>;            // never
}

// ----- Parameters<T> -----
// 提取函数参数类型为元组
namespace ParametersDemo {
    function processUser(id: number, name: string, active: boolean) {}

    type Params = Parameters<typeof processUser>;
    // 结果：[id: number, name: string, active: boolean]

    type FirstParam = Params[0]; // number
    type SecondParam = Params[1]; // string
}

// ----- ConstructorParameters<T> -----
// 提取构造函数参数类型
namespace ConstructorParametersDemo {
    class Person {
        constructor(
            public name: string,
            public age: number
        ) {}
    }

    type PersonParams = ConstructorParameters<typeof Person>;
    // 结果：[name: string, age: number]
}

// ----- InstanceType<T> -----
// 提取实例类型
namespace InstanceTypeDemo {
    class User {
        id: number = 0;
        name: string = "";
    }

    type U = InstanceType<typeof User>; // User
}

// ----- ThisParameterType<T> -----
// 提取函数this参数类型
namespace ThisParameterTypeDemo {
    function getName(this: { name: string }) {
        return this.name;
    }

    type T = ThisParameterType<typeof getName>; // { name: string }
}
```

### 3.4 infer关键字详解

`infer`关键字用于在条件类型中声明一个类型变量，然后在true分支中引用它：

```typescript
// ==================== infer基本用法 ====================

// infer声明一个待推断的类型变量
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

type A = UnwrapPromise<Promise<string>>;  // string
type B = UnwrapPromise<Promise<{ id: number }>>; // { id: number }
type C = UnwrapPromise<number>;          // number

// ==================== infer在元组中的应用 ====================

// 提取元组第一个元素类型
type FirstOfTuple<T> = T extends readonly [infer F, ...unknown[]] ? F : never;

type A2 = FirstOfTuple<[string, number, boolean]>; // string
type B2 = FirstOfTuple<[number]>;                  // number
type C2 = FirstOfTuple<[]>;                        // never

// 提取元组最后一个元素类型
type LastOfTuple<T> = T extends readonly [...unknown[], infer L] ? L : never;

type D = LastOfTuple<[string, number, boolean]>; // boolean

// 提取元组中除了第一个元素外的所有元素
type RestOfTuple<T> = T extends readonly [unknown, ...infer R] ? R : never;

type E = RestOfTuple<[string, number, boolean]>; // [number, boolean]

// ==================== infer在函数中的应用 ====================

// 提取函数参数类型
type Parameters<T extends (...args: any) => any> =
    T extends (...args: infer P) => any ? P : never;

type A3 = Parameters<(a: string, b: number) => void>; // [a: string, b: number]
type B3 = Parameters<(x: boolean) => string>;          // [x: boolean]

// 提取函数返回类型
type ReturnType2<T extends (...args: any) => any> =
    T extends (...args: any) => infer R ? R : never;

type C3 = ReturnType2<() => string>;                     // string
type D3 = ReturnType2<(x: number) => { id: number }>;   // { id: number }

// 提取构造函数参数类型
type ConstructorParams<T extends new (...args: any) => any> =
    T extends new (...args: infer P) => any ? P : never;

class Animal {
    constructor(
        public name: string,
        public age: number
    ) {}
}

type AnimalParams = ConstructorParams<typeof Animal>; // [name: string, age: number]

// ==================== 递归类型推断 ====================

// 展平数组类型
type FlattenArray<T> = T extends Array<infer U>
    ? U extends Array<any>
        ? FlattenArray<U>
        : U
    : T;

type A4 = FlattenArray<number[]>;                       // number
type B4 = FlattenArray<(number | string)[]>;            // number | string
type C4 = FlattenArray<number[][]>;                     // number
type D4 = FlattenArray<number[][][]>;                   // number

// 深度Partial
type DeepPartial<T> = T extends object
    ? { [P in keyof T]?: DeepPartial<T[P]> }
    : T;

interface Company {
    name: string;
    address: {
        city: string;
        street: string;
    };
}

type CompanyPartial = DeepPartial<Company>;
// {
//     name?: string;
//     address?: {
//         city?: string;
//         street?: string;
//     };
// }
```

### 3.5 实战：实现ReturnType、Parameters工具类型

让我们从头实现这些TypeScript内置的工具类型，以加深对条件类型和infer的理解：

```typescript
// ==================== 从零实现ReturnType ====================

// 首先理解实现思路：
// 1. 使用条件类型
// 2. 使用infer提取返回类型
// 3. 处理边界情况

// 基础版本
type MyReturnType<T extends (...args: any) => any> =
    T extends (...args: any) => infer R ? R : never;

// 测试
function fetchUser() {
    return { id: 1, name: "张三", email: "zhangsan@example.com" };
}

function fetchUsers() {
    return [
        { id: 1, name: "张三" },
        { id: 2, name: "李四" }
    ];
}

async function getCount() {
    return 42;
}

type FetchUserReturn = MyReturnType<typeof fetchUser>;
// 结果：{ id: number; name: string; email: string; }

type FetchUsersReturn = MyReturnType<typeof fetchUsers>;
// 结果：{ id: number; name: string; }[]

type GetCountReturn = MyReturnType<typeof getCount>;
// 结果：number（Promise被自动剥除，因为return type是Promise<number>）

// ==================== 从零实现Parameters ====================

// 基础版本
type MyParameters<T extends (...args: any) => any> =
    T extends (...args: infer P) => any ? P : never;

// 测试
function createUser(name: string, age: number, active: boolean) {
    return { name, age, active };
}

function simpleCallback(callback: (err: Error | null, result: string) => void) {
    callback(null, "success");
}

type CreateUserParams = MyParameters<typeof createUser>;
// 结果：[name: string, age: number, active: boolean]

type SimpleCallbackParams = MyParameters<typeof simpleCallback>;
// 结果：[(err: Error | null, result: string) => void]

// ==================== 实现更复杂的工具类型 ====================

// ConstructorParameters - 构造函数参数
type MyConstructorParameters<T extends new (...args: any) => any> =
    T extends new (...args: infer P) => any ? P : never;

class User {
    constructor(
        public id: number,
        public name: string,
        public email: string
    ) {}
}

type UserParams = MyConstructorParameters<typeof User>;
// 结果：[id: number, name: string, email: string]

// InstanceType - 实例类型
type MyInstanceType<T extends new (...args: any) => any> =
    T extends new (...args: any) => infer R ? R : never;

type UserInstance = MyInstanceType<typeof User>;
// 结果：User

// ==================== 实战：实现一个完整的工具类型库 ====================

// 1. Awaited - 提取Promise的内部类型
type MyAwaited<T> =
    T extends null | undefined ? T :
    T extends object & { then(onfulfilled: infer F, ...args: any): any } ?
        F extends (value: infer V, ...args: any) => any ? MyAwaited<V> : never :
        T;

type A5 = MyAwaited<Promise<string>>;                       // string
type B5 = MyAwaited<Promise<Promise<number>>>;              // number
type C5 = MyAwaited<Promise<{ id: number }>>;              // { id: number }

// 2. Partial<T> - 所有属性变为可选
type MyPartial<T extends object> = {
    [P in keyof T]?: T[P];
};

// 3. Required<T> - 所有属性变为必需
type MyRequired<T extends object> = {
    [P in keyof T]-?: T[P];
};

// 4. Readonly<T> - 所有属性变为只读
type MyReadonly<T extends object> = {
    readonly [P in keyof T]: T[P];
};

// 5. Pick<T, K> - 从T中选取指定的键
type MyPick<T extends object, K extends keyof T> = {
    [P in K]: T[P];
};

// 6. Record<K, V> - 创建键类型为K，值类型为V的对象
type MyRecord<K extends keyof any, V> = {
    [P in K]: V;
};

// 7. Exclude<T, U> - 从T中排除U
type MyExclude<T, U> = T extends U ? never : T;

// 8. Extract<T, U> - 从T中提取U
type MyExtract<T, U> = T extends U ? T : never;

// 9. NonNullable<T> - 排除null和undefined
type MyNonNullable<T> = T extends null | undefined ? never : T;

// 10. Omit<T, K> - 从T中排除指定的键
type MyOmit<T extends object, K extends keyof T> = {
    [P in Exclude<keyof T, K>]: T[P];
};

// 测试这些工具类型
interface User2 {
    id: number;
    name: string;
    email: string;
    age: number;
}

type UserOptional = MyPartial<User2>;
type UserRequired = MyRequired<UserOptional>; // 恢复为必需
type UserReadonly = MyReadonly<User2>;
type UserNameOnly = MyPick<User2, "name" | "email">;
type UserRecord = MyRecord<string, User2>;
type UserNameEmail = MyOmit<User2, "id" | "age">;
```

---

## 四、映射类型

### 4.1 基础映射类型

映射类型允许我们通过遍历已有类型的键来创建新类型：

```typescript
// ==================== 基础映射类型语法 ====================

// 语法：[P in K] - P是键变量，K是键的联合类型
type MappedType<T> = {
    [P in keyof T]: T[P];
};

// ==================== 基础示例 ====================

// 将所有属性值变为string类型
type Stringify<T> = {
    [P in keyof T]: string;
};

interface Point {
    x: number;
    y: number;
}

type StringPoint = Stringify<Point>;
// 结果：{ x: string; y: string; }

// 将所有属性变为可选
type Optional<T> = {
    [P in keyof T]?: T[P];
};

interface Config {
    host: string;
    port: number;
    ssl: boolean;
}

type OptionalConfig = Optional<Config>;
// 结果：{ host?: string; port?: number; ssl?: boolean; }

// 将所有属性变为只读
type Frozen<T> = {
    readonly [P in keyof T]: T[P];
};

type FrozenConfig = Frozen<Config>;
// 结果：{ readonly host: string; readonly port: number; readonly ssl: boolean; }

// ==================== 映射类型的变形 ====================

// 使用as子句重映射键
type Getters<T> = {
    [P in keyof T as `get${Capitalize<string & P>}`]: () => T[P];
};

interface Person {
    name: string;
    age: number;
}

type PersonGetters = Getters<Person>;
// 结果：
// {
//     getName: () => string;
//     getAge: () => number;
// }

// 使用as子句过滤键
type RemoveKind<T> = {
    [P in keyof T as Exclude<P, "kind">]: T[P];
};

interface Circle {
    kind: "circle";
    radius: number;
}

type CircleWithoutKind = RemoveKind<Circle>;
// 结果：{ radius: number; }

// ==================== 模板字面量与映射类型结合 ====================

// 创建以on开头的事件处理器类型
type EventHandlers<T> = {
    [P in keyof T as `on${Capitalize<string & P>}`]: (value: T[P]) => void;
};

interface AppState {
    click: { x: number; y: number };
    keypress: string;
    scroll: number;
}

type AppEventHandlers = EventHandlers<AppState>;
// 结果：
// {
//     onClick: (value: { x: number; y: number }) => void;
//     onKeypress: (value: string) => void;
//     onScroll: (value: number) => void;
// }
```

### 4.2 keyof与映射类型结合

`keyof`操作符返回一个类型的所有键作为联合类型，映射类型可以遍历这些键：

```typescript
// ==================== keyof基础 ====================

interface User {
    id: number;
    name: string;
    email: string;
}

type UserKeys = keyof User; // "id" | "name" | "email"

// ==================== keyof与泛型结合 ====================

function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
    return obj[key];
}

const user = { id: 1, name: "张三", email: "zhangsan@example.com" };

const name = getProperty(user, "name");     // string
const id = getProperty(user, "id");         // number

// ==================== 创建只包含指定键的新类型 ====================

function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    keys.forEach(key => {
        result[key] = obj[key];
    });
    return result;
}

const picked = pick(user, ["name", "email"]);
// 结果：{ name: string; email: string; }

// ==================== 创建排除指定键的新类型 ====================

type Omit<T, K extends keyof T> = {
    [P in Exclude<keyof T, K>]: T[P];
};

type UserWithoutEmail = Omit<User, "email">;
// 结果：{ id: number; name: string; }

// ==================== 映射类型与keyof的深层应用 ====================

// 创建所有值类型为boolean的对象类型
type Booleanize<T> = {
    [P in keyof T]: boolean;
};

type UserBooleans = Booleanize<User>;
// 结果：{ id: boolean; name: boolean; email: boolean; }

// 创建函数类型映射
type FunctionPropertyNames<T> = {
    [P in keyof T]: T[P] extends Function ? P : never;
}[keyof T];

interface MouseInteraction {
    x: number;
    y: number;
    onClick: () => void;
    onMove: (x: number, y: number) => void;
    name: string;
}

type MouseInteractionFunctionNames = FunctionPropertyNames<MouseInteraction>;
// 结果："onClick" | "onMove"

// 创建只包含函数属性的新类型
type FunctionProperties<T> = {
    [P in keyof T as T[P] extends Function ? P : never]: T[P];
};

type MouseInteractionFunctions = FunctionProperties<MouseInteraction>;
// 结果：
// {
//     onClick: () => void;
//     onMove: (x: number, y: number) => void;
// }
```

### 4.3 修改修饰符：readonly、?

TypeScript映射类型支持两个内置修饰符：`readonly`（只读）和`?`（可选）：

```typescript
// ==================== 添加和移除readonly修饰符 ====================

// 添加readonly
type Readonly<T> = {
    readonly [P in keyof T]: T[P];
};

// 移除readonly
type Mutable<T> = {
    -readonly [P in keyof T]: T[P];
};

interface Config2 {
    readonly apiUrl: string;
    readonly maxRetries: number;
    timeout: number;
}

type ReadonlyConfig = Readonly<Config2>;
// 所有属性变为readonly

type MutableConfig = Mutable<ReadonlyConfig>;
// readonlyConfig的readonly被移除，等价于Config2

// ==================== 添加和移除可选修饰符 ====================

// 添加可选
type Optional<T> = {
    [P in keyof T]?: T[P];
};

// 移除可选
type Required<T> = {
    [P in keyof T]-?: T[P];
};

interface UserProfile {
    name?: string;
    age?: number;
    email: string;
}

type AllOptional = Optional<UserProfile>;
// 所有属性变为可选

type AllRequired = Required<AllOptional>;
// 可选属性变为必需，等价于{ name: string; age: number; email: string; }

// ==================== 组合使用修饰符 ====================

// 创建只读可选类型
type ReadonlyOptional<T> = {
    readonly [P in keyof T]?: T[P];
};

// 创建可变必需类型
type MutableRequired<T> = {
    -readonly [P in keyof T]-?: T[P];
};

// ==================== 使用as子句修改修饰符 ====================

// 使用条件类型动态决定是否添加readonly
type DeepReadonly<T> = T extends object
    ? { readonly [P in keyof T]: DeepReadonly<T[P]> }
    : T;

interface NestedObject {
    user: {
        name: string;
        address: {
            city: string;
        };
    };
    settings: {
        theme: string;
    };
}

type DeepReadonlyNested = DeepReadonly<NestedObject>;
// 所有嵌套属性都变为readonly
```

### 4.4 实战：实现Partial、Required、Pick、Record

```typescript
// ==================== Partial<T> ====================

// 实现思路：
// 1. 遍历T的所有键
// 2. 将每个键标记为可选（添加?修饰符）

/**
 * 将类型T的所有属性变为可选
 * @param T - 需要处理的对象类型
 * @returns 所有属性可选的新类型
 */
type MyPartial<T extends object> = {
    [P in keyof T]?: T[P];
};

// 等价于内置的Partial

// 使用示例
interface User3 {
    id: number;
    name: string;
    email: string;
}

type PartialUser = MyPartial<User3>;
// 结果：{ id?: number; name?: string; email?: string; }

// ==================== Required<T> ====================

// 实现思路：
// 1. 遍历T的所有键
// 2. 移除可选修饰符（使用-?）

/**
 * 将类型T的所有属性变为必需
 * @param T - 需要处理的对象类型
 * @returns 所有属性必需的新类型
 */
type MyRequired<T extends object> = {
    [P in keyof T]-?: T[P];
};

// 使用示例
interface OptionalUser {
    id?: number;
    name?: string;
    email?: string;
}

type RequiredUser = MyRequired<OptionalUser>;
// 结果：{ id: number; name: string; email: string; }

// ==================== Pick<T, K> ====================

// 实现思路：
// 1. 遍历K中的每个键
// 2. 保留这些键及其类型

/**
 * 从T中选取指定的键K
 * @param T - 源对象类型
 * @param K - 需要选取的键，必须是T的键
 * @returns 只包含指定键的新类型
 */
type MyPick<T extends object, K extends keyof T> = {
    [P in K]: T[P];
};

// 使用示例
type PickedUser = MyPick<User3, "id" | "name">;
// 结果：{ id: number; name: string; }

// ==================== Record<K, V> ====================

// 实现思路：
// 1. K是新的键的联合类型
// 2. V是所有键对应的值的类型

/**
 * 创建键类型为K，值类型为V的对象类型
 * @param K - 键的联合类型
 * @param V - 值的类型
 * @returns 键为K、值为V的对象类型
 */
type MyRecord<K extends keyof any, V> = {
    [P in K]: V;
};

// 使用示例
type UserId = 1 | 2 | 3;

const userMap: MyRecord<UserId, { name: string; age: number }> = {
    1: { name: "张三", age: 25 },
    2: { name: "李四", age: 30 },
    3: { name: "王五", age: 28 }
};

// ==================== 综合实战：实现更复杂的工具类型 ====================

// 1. Omit<T, K> - 排除指定键
type MyOmit<T extends object, K extends keyof T> = {
    [P in Exclude<keyof T, K>]: T[P];
};

// 2. PickByValue<T, V> - 根据值类型选取键
type PickByValue<T, V> = {
    [P in keyof T as T[P] extends V ? P : never]: T[P];
};

interface User4 {
    id: number;
    name: string;
    age: number;
    active: boolean;
}

type StringProperties = PickByValue<User4, string>;
// 结果：{ name: string; }

// 3. ExcludeByValue<T, V> - 根据值类型排除键
type ExcludeByValue<T, V> = {
    [P in keyof T as T[P] extends V ? never : P]: T[P];
};

type NonStringProperties = ExcludeByValue<User4, string>;
// 结果：{ id: number; age: number; active: boolean; }

// 4. Merge<T, U> - 合并两个对象类型
type Merge<T extends object, U extends object> = {
    [P in keyof T | keyof U]: P extends keyof T
        ? T[P]
        : P extends keyof U
            ? U[P]
            : never;
};

type Merged = Merge<{ id: number; name: string }, { name: string; age: number }>;
// 结果：{ id: number; name: string; age: number; }

// 5. Overwrite<T, U> - 用U覆盖T中的键
type Overwrite<T extends object, U extends object> = {
    [P in keyof T as P extends keyof U ? never : P]: T[P];
} & U;

type Overwritten = Overwrite<{ id: number; name: string }, { name: number; age: number }>;
// 结果：{ id: number; } & { name: number; age: number; }
```

---

## 五、模板字面量类型

### 5.1 模板字面量语法

TypeScript 4.1引入了模板字面量类型，允许我们在类型级别操作字符串：

```typescript
// ==================== 基础语法 ====================

// 模板字面量类型使用反引号定义
type World = "world";
type Greeting = `hello ${World}`; // "hello world"

// 可以在插值位置使用联合类型
type Direction = "north" | "south" | "east" | "west";
type DirectionName = `go-${Direction}`;
// 结果："go-north" | "go-south" | "go-east" | "go-west"

// ==================== 字符串操作类型 ====================

// Uppercase、Lowercase、Capitalize、Uncapitalize
type Greet = "hello";
type GreetUpper = Uppercase<Greet>;    // "HELLO"
type GreetLower = Lowercase<Greet>;    // "hello"
type GreetCapital = Capitalize<Greet>; // "Hello"
type GreetUncapital = Uncapitalize<Greet>; // "hello"（首字符小写）

// 自定义字符串转换
type SnakeToCamel<S extends string> =
    S extends `${infer T}_${infer U}`
        ? `${T}${Capitalize<SnakeToCamel<U>>}`
        : S;

type CamelCase = SnakeToCamel<"hello_world_how_are_you">; // "helloWorldHowAreYou"

// ==================== 模板字面量与泛型结合 ====================

type EventName<T extends string> = `on${Capitalize<T>}`;

function createEvent<T extends string>(name: EventName<T>): void {
    console.log(`Creating event: ${name}`);
}

createEvent("click");  // createEvent("onClick")
createEvent("move");   // createEvent("onMove")
// createEvent("onClick"); // 错误：不能重复添加前缀

// ==================== 模板字面量类型在映射中的应用 ====================

type Props = "name" | "age" | "email";

type PropHandlers = {
    [P in Props as `on${Capitalize<P>}Change`]: (value: any) => void;
};

// 结果：
// {
//     onNameChange: (value: any) => void;
//     onAgeChange: (value: any) => void;
//     onEmailChange: (value: any) => void;
// }
```

### 5.2 内置模板工具类型

TypeScript提供了一些内置的模板字面量工具类型：

```typescript
// ==================== Uppercase / Lowercase / Capitalize / Uncapitalize ====================

type A6 = Uppercase<"hello">;   // "HELLO"
type B6 = Lowercase<"HELLO">;   // "hello"
type C6 = Capitalize<"hello">;  // "Hello"
type D6 = Uncapitalize<"Hello">; // "hello"

// 支持联合类型
type E6 = Uppercase<"a" | "b">; // "A" | "B"

// ==================== 自定义模板工具类型 ====================

// 1. 将字符串转为短横线命名
type KebabCase<S extends string> =
    S extends `${infer T}${infer U}`
        ? U extends Uncapitalize<U>
            ? `${Uncapitalize<T>}${KebabCase<U>}`
            : `${Uncapitalize<T>}-${KebabCase<U>}`
        : S;

type Kebab = KebabCase<"HelloWorld">; // "hello-world"
type Kebab2 = KebabCase<"ABCDEF">;   // "a-b-c-d-e-f"

// 2. 将字符串转为驼峰命名
type CamelCase<S extends string> =
    S extends `${infer T}_${infer U}${infer V}`
        ? `${T}${Capitalize<U>}${CamelCase<V>}`
        : S;

type Camel = CamelCase<"hello_world_how_are_you">; // "helloWorldHowAreYou"

// 3. 将字符串首字母大写
type CapitalizeFirst<S extends string> =
    S extends `${infer F}${infer R}`
        ? `${Capitalize<F>}${R}`
        : S;

type CapFirst = CapitalizeFirst<"hello world">; // "Hello world"

// 4. 追加前缀
type Prefix<P extends string, S extends string> = `${P}${S}`;

type Prefixed = Prefix<"get", "User">; // "getUser"

// 5. 追加后缀
type Suffix<S extends string, Post extends string> = `${S}${Post}`;

type Suffixed = Suffix<"User", "List">; // "UserList"
```

### 5.3 实战：实现路由参数类型推断

```typescript
// ==================== 路由参数类型系统 ====================

// 定义路由参数的类型约束
type ExtractParams<T extends string> =
    T extends `${infer _Start}:${infer Param}/${infer Rest}`
        ? Param | ExtractParams<`/${Rest}`>
        : T extends `${infer _Start}:${infer Param}`
            ? Param
            : never;

type RouteParams = ExtractParams<"/users/:userId/posts/:postId">;
// 结果："userId" | "postId"

// ==================== 完整的路由类型系统 ====================

interface RouteDefinition<TPath extends string> {
    path: TPath;
    params: ExtractParams<TPath>;
}

type RouteHandler<TPath extends string> = (
    params: Record<ExtractParams<TPath>, string>
) => void;

function createRoute<TPath extends string>(
    path: TPath,
    handler: RouteHandler<TPath>
): void {
    console.log(`Creating route: ${path}`);
}

// 使用
createRoute("/users/:userId", (params) => {
    console.log(`User ID: ${params.userId}`);
});

createRoute("/posts/:postId/comments/:commentId", (params) => {
    console.log(`Post ID: ${params.postId}, Comment ID: ${params.commentId}`);
});

// ==================== 更强大的类型安全路由 ====================

type ParamsFromPath<T extends string> = {
    [K in ExtractParams<T>]: string;
};

type PathWithParams<T extends string> = {
    [K in T]: K extends `${string}:${string}` ? ParamsFromPath<K> : never;
}[T] extends never ? T : ParamsFromPath<T>;

// 路由配置接口
interface RouteConfig<TPath extends string> {
    path: TPath;
    params: ParamsFromPath<TPath>;
    query?: Record<string, string>;
    hash?: string;
}

// 创建路由的工厂函数
function defineRoute<TPath extends string>(
    path: TPath,
    config: RouteConfig<TPath>
): RouteConfig<TPath> {
    return config;
}

// 使用示例
const route = defineRoute("/users/:userId/posts/:postId", {
    path: "/users/:userId/posts/:postId",
    params: {
        userId: "123",
        postId: "456"
    }
});

// ==================== 生成类型安全的API路径 ====================

type ApiPaths = {
    "/users": { params: never; query: { page?: number; limit?: number } };
    "/users/:userId": { params: { userId: string }; query: never };
    "/posts/:postId/comments": { params: { postId: string }; query: { sort?: "asc" | "desc" } };
};

type BuildUrl<
    TPath extends keyof ApiPaths,
    TParams extends ApiPaths[TPath]["params"],
    TQuery extends ApiPaths[TPath]["query"]
> =
    TParams extends never
        ? TQuery extends never
            ? TPath
            : `${TPath}?${BuildQuery<TQuery>}`
        : `${TPath}/${TParams}`;

type BuildQuery<T extends Record<string, unknown>> = {
    [K in keyof T & string]: `${K}=${T[K] & string | number}`;
}[keyof T & string];

type UserListUrl = BuildUrl<"/users", never, { page: number }>;
// 结果："/users?page=${number}"

type UserDetailUrl = BuildUrl<"/users/:userId", { userId: string }, never>;
// 结果："/users/${string}"

type PostCommentsUrl = BuildUrl<
    "/posts/:postId/comments",
    { postId: string },
    { sort: "asc" | "desc" }
>;
// 结果："/posts/${string}?sort=${"asc" | "desc"}"
```

---

## 六、高级类型技巧

### 6.1 递归类型

递归类型允许类型引用自身，这在处理嵌套数据结构时非常有用：

```typescript
// ==================== 递归类型基础 ====================

// 树形结构的类型定义
interface TreeNode<T> {
    value: T;
    children?: TreeNode<T>[];
}

// JSON类型的递归定义
type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };

// 深度只读类型
type DeepReadonly<T> = T extends object
    ? { readonly [P in keyof T]: DeepReadonly<T[P]> }
    : T;

// 深度可选类型
type DeepPartial<T> = T extends object
    ? { [P in keyof T]?: DeepPartial<T[P]> }
    : T;

// ==================== 递归类型实战 ====================

// 深度Required
type DeepRequired<T> = T extends object
    ? { [P in keyof T]-?: DeepRequired<T[P]> }
    : T;

// 深度可空类型（将undefined也视为null）
type DeepNonNullable<T> = T extends object
    ? { [P in keyof T]-?: DeepNonNullable<NonNullable<T[P]>> }
    : T;

// ==================== 递归条件类型 ====================

// 获取数组元素的嵌套类型
type DeepArrayElement<T> = T extends (infer E)[] ? DeepArrayElement<E> : T;

type Nested = number[][][];
type DeepElement = DeepArrayElement<Nested>; // number

// 展平嵌套数组
type Flatten<T extends unknown[]> =
    T extends []
        ? []
        : T extends [infer F, ...infer R]
            ? [...(F extends unknown[] ? Flatten<F> : [F]), ...Flatten<R>]
            : T;

type FlattenResult = Flatten<[1, [2, [3, [4, [5]]]]]>; // [1, 2, 3, 4, 5]

// ==================== 递归类型限制 ====================

// TypeScript对递归深度有限制，通常最大深度约为1000层
// 编译器会报"Type instantiation is excessively deep"错误

// 优化递归类型的方法：使用条件类型提前终止
type EffectiveDeepReadonly<T> = 0 extends (1 & T)
    ? T
    : T extends object
        ? { readonly [P in keyof T]: EffectiveDeepReadonly<T[P]> }
        : T;
```

### 6.2 联合类型展开

联合类型在TypeScript中有特殊的展开行为：

```typescript
// ==================== 联合类型的分布式特性 ====================

// 当联合类型出现在条件类型的泛型位置时，会分布式计算
type ToArray<T> = T extends any ? T[] : never;

type Result6 = ToArray<string | number>; // string[] | number[]

// 这意味着联合类型会被"展开"处理每个成员

// ==================== 防止分布式 ====================

// 使用元组包装泛型参数
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;

type Result7 = ToArrayNonDist<string | number>; // (string | number)[]

// ==================== 联合类型展开的应用 ====================

// 展开函数返回的联合类型
type UnwrapReturn<T> = T extends (...args: any[]) => infer R ? R : never;

type Fn1 = () => string | number;
type Fn2 = () => boolean;

type Unwrap1 = UnwrapReturn<Fn1>; // string | number
type Unwrap2 = UnwrapReturn<Fn2>; // boolean

// 使用分发特性过滤联合类型
type StringKeys<T> = T extends any ? (T extends string ? T : never) : never;

type Keys = StringKeys<string | number | boolean | "a" | 1>; // string | "a"

// ==================== 联合类型的交叉处理 ====================

// 当联合类型遇到交叉类型时的特殊处理
type Foo<T> = T & { foo: string };

type A7 = Foo<string | number>;
// 相当于：(string & { foo: string }) | (number & { foo: string })
// 结果：{ foo: string } | { foo: string }
// 因为string和number与对象交叉后都得到{ foo: string }，所以是同一类型

// 更复杂的例子
type Bar<T> = T extends string ? { isString: true } : { isString: false };

type B7 = Bar<string | number>;
// 相当于：{ isString: true } | { isString: false }
```

### 6.3 类型断言与类型保护

类型断言用于强制将一个类型视为另一个类型，类型保护用于收窄类型范围：

```typescript
// ==================== 类型断言 ====================

// as语法（推荐）
const value: unknown = "hello";
const str = value as string;
const length = str.length;

// 尖括号语法（与JSX冲突时不适用）
const str2 = <string>value;

// 非空断言
const element = document.getElementById("app")!; // 断言不为null

// 确定赋值断言
let initialized: number;
initialized!; // 断言在使用前已赋值

// ==================== 类型保护函数 ====================

// 自定义类型谓词
function isString(value: unknown): value is string {
    return typeof value === "string";
}

function isNumber(value: unknown): value is number {
    return typeof value === "number";
}

function isObject(value: unknown): value is object {
    return typeof value === "object" && value !== null;
}

function processValue(value: unknown): string {
    if (isString(value)) {
        return value.toUpperCase();
    } else if (isNumber(value)) {
        return value.toFixed(2);
    } else if (isObject(value)) {
        return JSON.stringify(value);
    }
    return "unknown";
}

// ==================== 链式类型保护 ====================

interface Dog {
    kind: "dog";
    bark(): void;
}

interface Cat {
    kind: "cat";
    meow(): void;
}

type Animal = Dog | Cat;

function speak(animal: Animal): void {
    if (animal.kind === "dog") {
        animal.bark();
    } else {
        animal.meow();
    }
}

// ==================== 可辨识联合类型 ====================

interface Base {
    type: string;
}

interface A8 extends Base {
    type: "a";
    valueA: string;
}

interface B8 extends Base {
    type: "b";
    valueB: number;
}

type AB = A8 | B8;

function processAB(value: AB): string {
    switch (value.type) {
        case "a":
            return value.valueA;
        case "b":
            return value.valueB.toString();
        default:
            // 确保exhaustive check
            const _exhaustive: never = value;
            return _exhaustive;
    }
}
```

### 6.4 declaration文件

 declaration文件（.d.ts）用于为JavaScript库提供类型声明：

```typescript
// ==================== declaration文件基础 ====================

// mylib.d.ts
declare module "mylib" {
    export interface Config {
        host: string;
        port: number;
        timeout?: number;
    }

    export function initialize(config: Config): void;
    export class MyClass {
        constructor(name: string);
        greet(): string;
    }
}

// 使用时
import { initialize, MyClass } from "mylib";

// ==================== 扩展已有模块 ====================

// 给原生JavaScript对象添加方法
interface Array<T> {
    first(): T | undefined;
    last(): T | undefined;
    groupBy<K extends keyof T>(key: K): Record<T[K], T[]>;
}

Array.prototype.first = function() {
    return this[0];
};

Array.prototype.last = function() {
    return this[this.length - 1];
};

Array.prototype.groupBy = function(key) {
    return this.reduce((groups, item) => {
        const groupKey = item[key] as string | number;
        (groups[groupKey] = groups[groupKey] || []).push(item);
        return groups;
    }, {} as Record<any, T[]>);
};

// ==================== 全局类型扩展 ====================

// global.d.ts
declare global {
    interface Window {
        myGlobalFunction(): void;
    }

    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV: "development" | "production" | "test";
            PORT?: string;
        }
    }
}

export {};
```

---

## 七、React+TypeScript

### 7.1 组件prop类型定义

```typescript
// ==================== 基本Props类型 ====================

interface ButtonProps {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "danger";
    disabled?: boolean;
}

function Button({
    label,
    onClick,
    variant = "primary",
    disabled = false
}: ButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`btn btn-${variant}`}
        >
            {label}
        </button>
    );
}

// ==================== 使用React FC类型 ====================

import { FC, ReactNode } from "react";

interface CardProps {
    title: string;
    children: ReactNode;
    footer?: ReactNode;
}

const Card: FC<CardProps> = ({ title, children, footer }) => {
    return (
        <div className="card">
            <div className="card-header">{title}</div>
            <div className="card-body">{children}</div>
            {footer && <div className="card-footer">{footer}</div>}
        </div>
    );
};

// ==================== 泛型组件 ====================

import { GenericComponent } from "./types";

interface ListProps<T> {
    items: T[];
    renderItem: (item: T) => ReactNode;
    keyExtractor: (item: T) => string;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
    return (
        <ul>
            {items.map(item => (
                <li key={keyExtractor(item)}>{renderItem(item)}</li>
            ))}
        </ul>
    );
}

// 使用
<List
    items={[{ id: 1, name: "张三" }, { id: 2, name: "李四" }]}
    keyExtractor={item => item.id.toString()}
    renderItem={item => <span>{item.name}</span>}
/>
```

### 7.2 事件处理类型

```typescript
// ==================== 常见事件类型 ====================

// MouseEvent
function MouseEventComponent() {
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        console.log(event.clientX, event.clientY);
    };

    return <button onClick={handleClick}>点击</button>;
}

// FormEvent
function FormEventComponent() {
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
    };

    return <form onSubmit={handleSubmit}>...</form>;
}

// ChangeEvent
function InputComponent() {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        console.log(event.target.value);
    };

    return <input onChange={handleChange} />;
}

// KeyboardEvent
function KeyboardComponent() {
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            console.log("Enter pressed");
        }
    };

    return <input onKeyDown={handleKeyDown} />;
}

// FocusEvent
function FocusComponent() {
    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
        console.log("Focused on:", event.target.name);
    };

    return <input name="email" onFocus={handleFocus} />;
}

// ==================== 事件处理器类型别名 ====================

type ButtonClickHandler = React.MouseEventHandler<HTMLButtonElement>;
type FormSubmitHandler = React.FormEventHandler<HTMLFormElement>;
type InputChangeHandler = React.ChangeEventHandler<HTMLInputElement>;
type InputFocusHandler = React.FocusEventHandler<HTMLInputElement>;
```

### 7.3 自定义Hooks类型

```typescript
// ==================== useState类型 ====================

// 显式指定类型
const [user, setUser] = useState<User | null>(null);

// 泛型形式
const [count, setCount] = useState<number>(0);

// 类型推断
const [name, setName] = useState(""); // string

// ==================== useRef类型 ====================

// 可变引用
const timerRef = useRef<number | null>(null);

// DOM引用
const inputRef = useRef<HTMLInputElement>(null);

// 访问DOM
const focusInput = () => {
    inputRef.current?.focus();
};

// ==================== useCallback类型 ====================

const handleSubmit = useCallback<(data: FormData) => void>(
    (data) => {
        console.log(data);
    },
    [] // 依赖数组
);

// ==================== 自定义Hook返回类型 ====================

interface UseToggleReturn {
    value: boolean;
    toggle: () => void;
    setTrue: () => void;
    setFalse: () => void;
}

function useToggle(initialValue = false): UseToggleReturn {
    const [value, setValue] = useState(initialValue);

    const toggle = useCallback(() => setValue(v => !v), []);
    const setTrue = useCallback(() => setValue(true), []);
    const setFalse = useCallback(() => setValue(false), []);

    return { value, toggle, setTrue, setFalse };
}

// 使用泛型自定义Hook
interface UseAsyncReturn<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
    execute: () => Promise<void>;
}

function useAsync<T>(asyncFunction: () => Promise<T>): UseAsyncReturn<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const execute = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await asyncFunction();
            setData(result);
        } catch (e) {
            setError(e instanceof Error ? e : new Error("Unknown error"));
        } finally {
            setLoading(false);
        }
    }, [asyncFunction]);

    return { data, loading, error, execute };
}
```

### 7.4 实战：实现类型安全的fetch hook

```typescript
// ==================== 基础类型定义 ====================

interface FetchState<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
}

interface FetchOptions extends RequestInit {
    params?: Record<string, string | number | boolean>;
}

// ==================== 类型安全的fetch hook ====================

function useFetch<T>(
    url: string,
    options?: FetchOptions
): FetchState<T> & { refetch: () => void } {
    const [state, setState] = useState<FetchState<T>>({
        data: null,
        loading: true,
        error: null
    });

    const fetchData = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            // 处理URL参数
            let fullUrl = url;
            if (options?.params) {
                const searchParams = new URLSearchParams();
                Object.entries(options.params).forEach(([key, value]) => {
                    searchParams.append(key, String(value));
                });
                fullUrl = `${url}?${searchParams.toString()}`;
            }

            const response = await fetch(fullUrl, {
                ...options,
                params: undefined // 移除params，避免传递到fetch
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: T = await response.json();
            setState({ data, loading: false, error: null });
        } catch (error) {
            setState({
                data: null,
                loading: false,
                error: error instanceof Error ? error : new Error("Unknown error")
            });
        }
    }, [url, options?.params]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { ...state, refetch: fetchData };
}

// ==================== 使用示例 ====================

interface User {
    id: number;
    name: string;
    email: string;
}

interface Post {
    id: number;
    title: string;
    body: string;
    userId: number;
}

// 获取用户列表
function UserList() {
    const { data: users, loading, error, refetch } = useFetch<User[]>(
        "https://jsonplaceholder.typicode.com/users"
    );

    if (loading) return <div>加载中...</div>;
    if (error) return <div>错误: {error.message}</div>;

    return (
        <div>
            <button onClick={refetch}>刷新</button>
            <ul>
                {users?.map(user => (
                    <li key={user.id}>{user.name} - {user.email}</li>
                ))}
            </ul>
        </div>
    );
}

// 获取单个用户
function UserProfile({ userId }: { userId: number }) {
    const { data: user, loading, error } = useFetch<User>(
        `https://jsonplaceholder.typicode.com/users/${userId}`
    );

    if (loading) return <div>加载中...</div>;
    if (error) return <div>错误: {error.message}</div>;

    return user ? (
        <div>
            <h1>{user.name}</h1>
            <p>{user.email}</p>
        </div>
    ) : null;
}

// ==================== 更高级的版本：支持乐观更新 ====================

interface OptimisticFetchState<T> extends FetchState<T> {
    optimisticData: T | null;
    setOptimisticData: (data: T | null) => void;
    commit: (data: T) => void;
    rollback: () => void;
}

function useOptimisticFetch<T>(
    url: string,
    options?: FetchOptions
): OptimisticFetchState<T> & { refetch: () => void } {
    const [state, setState] = useState<FetchState<T>>({
        data: null,
        loading: true,
        error: null
    });

    const [optimisticData, setOptimisticData] = useState<T | null>(null);

    const fetchData = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            let fullUrl = url;
            if (options?.params) {
                const searchParams = new URLSearchParams();
                Object.entries(options.params).forEach(([key, value]) => {
                    searchParams.append(key, String(value));
                });
                fullUrl = `${url}?${searchParams.toString()}`;
            }

            const response = await fetch(fullUrl, {
                ...options,
                params: undefined
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: T = await response.json();
            setState({ data, loading: false, error: null });
            setOptimisticData(null); // 清除乐观数据
        } catch (error) {
            setState({
                data: null,
                loading: false,
                error: error instanceof Error ? error : new Error("Unknown error")
            });
        }
    }, [url, options?.params]);

    const commit = useCallback((data: T) => {
        setState({ data, loading: false, error: null });
        setOptimisticData(null);
    }, []);

    const rollback = useCallback(() => {
        setOptimisticData(null);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        ...state,
        optimisticData,
        setOptimisticData,
        commit,
        rollback,
        refetch: fetchData
    };
}
```

---

## 八、实战项目：从零实现类型工具库

### 8.1 项目概述

我们将实现一个完整的TypeScript类型工具库，参考TypeScript内置工具类型并加入一些实用的扩展：

```typescript
// ==================== 类型工具库主文件 ====================

// ---------------------- 基础工具类型 ----------------------

/**
 * 使所有属性变为可选
 */
export type Partial<T extends object> = {
    [P in keyof T]?: T[P];
};

/**
 * 使所有属性变为必需
 */
export type Required<T extends object> = {
    [P in keyof T]-?: T[P];
};

/**
 * 使所有属性变为只读
 */
export type Readonly<T extends object> = {
    readonly [P in keyof T]: T[P];
};

/**
 * 使所有属性变为可变（移除readonly）
 */
export type Mutable<T extends object> = {
    -readonly [P in keyof T]: T[P];
};

/**
 * 从T中选取指定的键K
 */
export type Pick<T extends object, K extends keyof T> = {
    [P in K]: T[P];
};

/**
 * 从T中排除指定的键K
 */
export type Omit<T extends object, K extends keyof T> = {
    [P in Exclude<keyof T, K>]: T[P];
};

/**
 * 创建键类型为K，值类型为V的对象类型
 */
export type Record<K extends keyof any, V> = {
    [P in K]: V;
};

// ---------------------- 联合类型工具 ----------------------

/**
 * 提取T中可以赋值给U的类型
 */
export type Extract<T, U> = T extends U ? T : never;

/**
 * 从T中排除可以赋值给U的类型
 */
export type Exclude<T, U> = T extends U ? never : T;

/**
 * 从T中排除null和undefined
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * 获取函数返回类型
 */
export type ReturnType<T extends (...args: any) => any> =
    T extends (...args: any) => infer R ? R : any;

/**
 * 获取函数参数类型为元组
 */
export type Parameters<T extends (...args: any) => any> =
    T extends (...args: infer P) => any ? P : never;

/**
 * 获取构造函数参数类型
 */
export type ConstructorParameters<T extends new (...args: any) => any> =
    T extends new (...args: infer P) => any ? P : never;

/**
 * 获取实例类型
 */
export type InstanceType<T extends new (...args: any) => any> =
    T extends new (...args: any) => infer R ? R : never;

/**
 * 获取Promise的内部类型
 */
export type Awaited<T> =
    T extends null | undefined ? T :
    T extends object & { then(onfulfilled: infer F, ...args: any): any } ?
        F extends (value: infer V, ...args: any) => any ? Awaited<V> : never :
        T;

// ---------------------- 字符串工具 ----------------------

/**
 * 将字符串转为大写
 */
export type Uppercase<S extends string> = intrinsic;

/**
 * 将字符串转为小写
 */
export type Lowercase<S extends string> = intrinsic;

/**
 * 将字符串首字母大写
 */
export type Capitalize<S extends string> = intrinsic;

/**
 * 将字符串首字母小写
 */
export type Uncapitalize<S extends string> = intrinsic;

/**
 * 将字符串转为短横线命名
 */
export type KebabCase<S extends string> =
    S extends `${infer T}${infer U}`
        ? U extends Uncapitalize<U>
            ? `${Uncapitalize<T>}${KebabCase<U>}`
            : `${Uncapitalize<T>}-${KebabCase<U>}`
        : S;

/**
 * 将字符串转为驼峰命名
 */
export type CamelCase<S extends string> =
    S extends `${infer T}_${infer U}${infer V}`
        ? `${T}${Capitalize<U>}${CamelCase<V>}`
        : S;

/**
 * 将字符串首字母大写
 */
export type CapitalizeFirst<S extends string> =
    S extends `${infer F}${infer R}`
        ? `${Capitalize<F>}${R}`
        : S;
```

### 8.2 高级工具类型实现

```typescript
// ---------------------- 深度工具类型 ----------------------

/**
 * 深度Partial
 */
export type DeepPartial<T> = T extends object
    ? { [P in keyof T]?: DeepPartial<T[P]> }
    : T;

/**
 * 深度Readonly
 */
export type DeepReadonly<T> = T extends object
    ? { readonly [P in keyof T]: DeepReadonly<T[P]> }
    : T;

/**
 * 深度Required
 */
export type DeepRequired<T> = T extends object
    ? { [P in keyof T]-?: DeepRequired<T[P]> }
    : T;

/**
 * 深度Mutable
 */
export type DeepMutable<T> = T extends object
    ? { -readonly [P in keyof T]: DeepMutable<T[P]> }
    : T;

// ---------------------- 对象工具类型 ----------------------

/**
 * 根据值类型选取键
 */
export type PickByValue<T, V> = {
    [P in keyof T as T[P] extends V ? P : never]: T[P];
};

/**
 * 根据值类型排除键
 */
export type ExcludeByValue<T, V> = {
    [P in keyof T as T[P] extends V ? never : P]: T[P];
};

/**
 * 获取对象类型的所有函数属性
 */
export type FunctionProperties<T> = {
    [P in keyof T as T[P] extends Function ? P : never]: T[P];
};

/**
 * 获取对象类型的所有非函数属性
 */
export type NonFunctionProperties<T> = {
    [P in keyof T as T[P] extends Function ? never : P]: T[P];
};

/**
 * 获取函数类型的参数类型
 */
export type ArgType<T> = T extends (arg: infer A) => any ? A : never;

/**
 * 返回类型所指向的属性路径
 */
export type Paths<T, Prefix extends string = ""> = {
    [P in keyof T & string]: T[P] extends object
        ? Paths<T[P], `${Prefix}${P}`> | `${Prefix}${P}`
        : `${Prefix}${P}`;
}[keyof T & string];

// ---------------------- 数组工具类型 ----------------------

/**
 * 获取数组元素类型
 */
export type ArrayElement<T> = T extends readonly (infer E)[] ? E : never;

/**
 * 获取元组长度
 */
export type TupleLength<T extends readonly unknown[]> = T["length"];

/**
 * 获取元组第一个元素类型
 */
export type First<T extends readonly unknown[]> = T extends readonly [infer F, ...unknown[]] ? F : never;

/**
 * 获取元组最后一个元素类型
 */
export type Last<T extends readonly unknown[]> = T extends readonly [...unknown[], infer L] ? L : never;

/**
 * 移除元组最后一个元素
 */
export type Pop<T extends readonly unknown[]> = T extends readonly [...infer F, unknown] ? F : never;

/**
 * 在元组开头添加元素
 */
export type Unshift<T extends readonly unknown[], E> = [E, ...T];

/**
 * 合并多个元组
 */
export type Concat<T extends readonly unknown[][], U extends readonly unknown[][] = [] = []> =
    T extends [infer F extends readonly unknown[], ...infer R extends readonly unknown[][]]
        ? [...F, ...Concat<R>]
        : [];
```

### 8.3 类型安全的API客户端

```typescript
// ---------------------- API类型系统 ----------------------

/**
 * HTTP方法类型
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";

/**
 * URL参数类型
 */
export type QueryParams = Record<string, string | number | boolean | undefined | null>;

/**
 * 请求头类型
 */
export type Headers = Record<string, string>;

/**
 * API端点定义
 */
export interface ApiEndpoint<
    TPath extends string,
    TMethod extends HttpMethod,
    TResponse,
    TBody = never,
    TQuery extends QueryParams = never
> {
    path: TPath;
    method: TMethod;
    response: TResponse;
    body?: TBody;
    query?: TQuery;
}

/**
 * 从API端点提取路径参数
 */
export type PathParams<T extends string> = {
    [K in ExtractPathParams<T>]: string;
};

/**
 * 从路径字符串提取路径参数名
 */
export type ExtractPathParams<T extends string> =
    T extends `${string}:${infer Param}/${infer Rest}`
        ? Param | ExtractPathParams<`/${Rest}`>
        : T extends `${string}:${infer Param}`
            ? Param
            : never;

/**
 * 路径参数转请求URL
 */
export type BuildPath<T extends string, TParams extends Record<string, string>> =
    T extends `${infer Prefix}:${infer Param}/${infer Rest}`
        ? TParams[Param] extends string
            ? `${Prefix}${TParams[Param]}${BuildPath<`/${Rest}`, TParams>}`
            : never
        : T extends `${infer Prefix}:${infer Param}`
            ? TParams[Param] extends string
                ? `${Prefix}${TParams[Param]}`
                : never
            : T;

/**
 * 查询参数转URL字符串
 */
export type BuildQuery<T extends QueryParams> = {
    [K in keyof T as T[K] extends undefined | null ? never : K]: T[K];
};

/**
 * API客户端配置
 */
export interface ApiClientConfig {
    baseUrl: string;
    headers?: Headers;
    credentials?: RequestCredentials;
}

/**
 * API请求选项
 */
export interface ApiRequestOptions<
    TEndpoint extends ApiEndpoint<string, HttpMethod, unknown, unknown, QueryParams>
> {
    pathParams: TEndpoint["path"] extends string
        ? PathParams<TEndpoint["path"]>
        : never;
    query: TEndpoint["query"] extends QueryParams
        ? TEndpoint["query"]
        : never;
    body: TEndpoint extends ApiEndpoint<string, HttpMethod, unknown, infer TBody, never>
        ? TBody
        : never;
}

// ---------------------- 类型安全的API客户端实现 ----------------------

class TypedApiClient {
    private config: ApiClientConfig;

    constructor(config: ApiClientConfig) {
        this.config = config;
    }

    async request<
        TPath extends string,
        TMethod extends HttpMethod,
        TResponse,
        TBody = never,
        TQuery extends QueryParams = never
    >(
        endpoint: ApiEndpoint<TPath, TMethod, TResponse, TBody, TQuery>,
        options: {
            pathParams: PathParams<TPath>;
            query?: TQuery;
            body?: TBody;
        }
    ): Promise<TResponse> {
        // 构建URL
        let url = this.config.baseUrl + endpoint.path;

        // 替换路径参数
        Object.entries(options.pathParams).forEach(([key, value]) => {
            url = url.replace(`:${key}`, encodeURIComponent(value));
        });

        // 添加查询参数
        if (options.query && Object.keys(options.query).length > 0) {
            const searchParams = new URLSearchParams();
            Object.entries(options.query).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    searchParams.append(key, String(value));
                }
            });
            url += `?${searchParams.toString()}`;
        }

        // 准备请求选项
        const requestOptions: RequestInit = {
            method: endpoint.method,
            headers: {
                "Content-Type": "application/json",
                ...this.config.headers
            },
            credentials: this.config.credentials
        };

        // 添加请求体
        if (options.body !== undefined && endpoint.method !== "GET" && endpoint.method !== "HEAD") {
            requestOptions.body = JSON.stringify(options.body);
        }

        // 发送请求
        const response = await fetch(url, requestOptions);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }
}

// ---------------------- API定义示例 ----------------------

// 定义用户API
interface User {
    id: number;
    name: string;
    email: string;
    age: number;
}

const UserApi = {
    list: {
        path: "/users",
        method: "GET" as HttpMethod,
        response: User[]
    },
    get: {
        path: "/users/:userId",
        method: "GET" as HttpMethod,
        response: User
    },
    create: {
        path: "/users",
        method: "POST" as HttpMethod,
        response: User,
        body: Omit<User, "id">
    },
    update: {
        path: "/users/:userId",
        method: "PUT" as HttpMethod,
        response: User,
        body: Partial<Omit<User, "id">>
    },
    delete: {
        path: "/users/:userId",
        method: "DELETE" as HttpMethod,
        response: void
    },
    search: {
        path: "/users/search",
        method: "GET" as HttpMethod,
        response: User[],
        query: {
            name: "string",
            age: "number",
            page: "number"
        }
    }
} as const;

// ---------------------- 使用API客户端 ----------------------

const api = new TypedApiClient({
    baseUrl: "https://api.example.com",
    headers: {
        "Authorization": "Bearer token"
    }
});

async function example() {
    // 获取用户列表
    const users = await api.request(UserApi.list, {
        pathParams: {} as PathParams<"/users">
    });

    // 获取单个用户
    const user = await api.request(UserApi.get, {
        pathParams: { userId: "123" }
    });

    // 创建用户
    const newUser = await api.request(UserApi.create, {
        pathParams: {} as PathParams<"/users">,
        body: {
            name: "张三",
            email: "zhangsan@example.com",
            age: 25
        }
    });

    // 搜索用户
    const searchResults = await api.request(UserApi.search, {
        pathParams: {} as PathParams<"/users/search">,
        query: {
            name: "张三",
            age: 25,
            page: 1
        }
    });
}
```

---

## 总结

本教程深入探讨了TypeScript类型系统的各个层面，从基础类型注解到复杂的高级类型技巧。我们学习了：

1. **类型基础深入**：掌握了类型注解与类型推断、联合类型与交叉类型、接口与类型别名的选择、枚举类型以及类型守卫等核心概念。

2. **泛型深入**：理解了泛型函数、泛型接口、泛型类的定义和使用，掌握了泛型约束的各种场景，以及如何实现类型安全的EventEmitter。

3. **条件类型**：深入理解了条件类型语法、分布式条件类型的特性、内置条件类型工具，以及使用infer关键字进行类型提取。

4. **映射类型**：学会了基础映射类型语法、keyof与映射类型结合使用，以及如何修改readonly和?修饰符。

5. **模板字面量类型**：掌握了模板字面量语法、内置模板工具类型，以及实现路由参数类型推断。

6. **高级类型技巧**：了解了递归类型、联合类型展开、类型断言与类型保护，以及declaration文件的编写。

7. **React+TypeScript**：学习了组件prop类型定义、事件处理类型、自定义Hooks类型，以及实现类型安全的fetch hook。

8. **实战项目**：从零实现了一套完整的类型工具库，并构建了类型安全的API客户端。

掌握这些类型技巧，将使你能够编写更加类型安全、可维护的TypeScript代码，在大型项目中游刃有余。

---

## 附录：常用类型工具速查表

| 工具类型 | 用途 | 示例 |
|---------|------|------|
| `Partial<T>` | 所有属性可选 | `Partial<User>` |
| `Required<T>` | 所有属性必需 | `Required<Partial<User>>` |
| `Readonly<T>` | 所有属性只读 | `Readonly<User>` |
| `Pick<T, K>` | 选取指定键 | `Pick<User, "id" \| "name">` |
| `Omit<T, K>` | 排除指定键 | `Omit<User, "email">` |
| `Record<K, V>` | 创建对象类型 | `Record<string, number>` |
| `Extract<T, U>` | 提取可赋值类型 | `Extract<string \| number, string>` |
| `Exclude<T, U>` | 排除可赋值类型 | `Exclude<string \| number, string>` |
| `NonNullable<T>` | 排除null/undefined | `NonNullable<string \| null>` |
| `ReturnType<T>` | 获取函数返回类型 | `ReturnType<typeof getUser>` |
| `Parameters<T>` | 获取函数参数类型 | `Parameters<typeof process>` |
| `InstanceType<T>` | 获取实例类型 | `InstanceType<typeof User>` |
| `Awaited<T>` | 获取Promise内部类型 | `Awaited<Promise<string>>` |
