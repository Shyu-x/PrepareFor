# TypeScript完全指南

## 目录

1. [TypeScript基础](#1-typescript基础)
2. [类型系统](#2-类型系统)
3. [接口与类型](#3-接口与类型)
4. [泛型编程](#4-泛型编程)
5. [装饰器](#5-装饰器)
6. [工具类型](#6-工具类型)
7. [配置文件](#7-配置文件)

---

## 1. TypeScript基础

### 1.1 什么是TypeScript

TypeScript是JavaScript的超集，添加了静态类型、类、接口、模块等特性。它可以在编译时捕获错误，提供更好的IDE支持，最终编译为纯JavaScript。

```
TypeScript vs JavaScript：

┌─────────────────────────────────────────────┐
│              JavaScript                     │
│  ┌───────────────────────────────────┐  │
│  │  let name = '张三';          │  │
│  │  name = 25;  // 运行时才发现错误│  │
│  └───────────────────────────────────┘  │
│  ↓ 编译运行                          │
│  ↓ 发现错误（运行时）                   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│              TypeScript                    │
│  ┌───────────────────────────────────┐  │
│  │  let name: string = '张三';    │  │
│  │  name = 25;  // 编译时报错    │  │
│  └───────────────────────────────────┘  │
│  ↓ 编译为JavaScript                  │
│  ↓ 发现错误（编译时）                   │
└─────────────────────────────────────────────┘
```

### 1.2 安装与配置

```bash
# 使用npm安装
npm install -g typescript

# 使用yarn安装
yarn global add typescript

# 检查版本
tsc --version

# 编译TypeScript文件
tsc filename.ts

# 监听模式编译（自动编译）
tsc --watch filename.ts

# 生成source map（方便调试）
tsc --sourceMap filename.ts
```

---

## 2. 类型系统

### 2.1 基础类型

```typescript
// 1. 基本类型
let str: string = 'hello';
let num: number = 42;
let bool: boolean = true;
let arr: number[] = [1, 2, 3];
let tuple: [string, number] = ['hello', 42];

// 2. any类型（绕过类型检查，不推荐）
let anything: any = '可以赋值任何类型';
anything = 123;
anything = {};

// 3. unknown类型（比any更安全）
let unknown: unknown = '初始值';

if (typeof unknown === 'string') {
    console.log(unknown.toUpperCase());  // 类型缩小
}

// 4. void类型（表示函数没有返回值）
function logMessage(message: string): void {
    console.log(message);
}

// 5. never类型（表示不可能存在的值）
function error(message: string): never {
    throw new Error(message);
}

// 6. null和undefined
let nullValue: null = null;
let undefinedValue: undefined = undefined;

// 7. 对象类型
let obj: object = {};
let date: Date = new Date();
let regex: RegExp = /pattern/;

// 8. 函数类型
let add: (a: number, b: number) => number = (a, b) => a + b;
```

### 2.2 类型推断

```typescript
// 1. 基础推断（自动推断类型）
let message = 'hello';  // 推断为string
let count = 42;        // 推断为number

// 2. 上下文推断（根据使用场景推断）
const numbers = [1, 2, 3];  // 推断为number[]
numbers.map(num => num * 2);  // num推断为number

// 3. 明确类型标注（推荐）
let name: string = '张三';
let age: number = 25;

// 4. 联合类型
type StringOrNumber = string | number;
let value: StringOrNumber = 'hello';
value = 42;  // 有效

// 5. 类型守卫
function isString(value: unknown): value is string {
    return typeof value === 'string';
}

function process(value: unknown) {
    if (isString(value)) {
        console.log(value.toUpperCase());
    }
}
```

### 2.3 类型断言

```typescript
// 1. 基础类型断言
let someValue: unknown = 'hello world';
let strLength: number = (someValue as string).length;

// 2. 类型断言风险
let value: any = 'hello';
let wrongLength: number = (value as number).toFixed(2);  // 运行时错误

// 3. const断言（推荐）
function assertString(value: unknown): asserts value is string {
    if (typeof value !== 'string') {
        throw new Error('Expected string');
    }
}

assertString(someValue);
console.log(someValue.length);  // 安全

// 4. as const类型守卫
function processArray(array: unknown) {
    if (Array.isArray(array)) {
        // 只在这个分支里，array被断言为string[]
        const strings = array as const string[];
        return strings.map(s => s.toUpperCase());
    }
    return [];
}
```

---

## 3. 接口与类型

### 3.1 接口定义

```typescript
// 1. 基础接口
interface User {
    id: number;
    name: string;
    email: string;
    age?: number;  // 可选属性
}

const user: User = {
    id: 1,
    name: '张三',
    email: 'zhangsan@example.com'
};

// 2. 函数接口
interface UserFactory {
    (name: string, email: string): User;
    version: string;
}

const createUser: UserFactory = (name, email) => {
    return { id: 1, name, email };
};

createUser.version = '1.0.0';

// 3. 类接口
interface IUserService {
    getUser(id: number): Promise<User>;
    saveUser(user: User): Promise<void>;
}

class UserService implements IUserService {
    async getUser(id: number): Promise<User> {
        return { id, name: '张三', email: 'zhangsan@example.com' };
    }

    async saveUser(user: User): Promise<void> {
        console.log('保存用户', user);
    }
}

// 4. 可索引接口
interface StringArray {
    [index: number]: string;
}

const strings: StringArray = ['hello', 'world', '!'];
console.log(strings[0]);  // hello

// 5. 继承接口
interface BaseUser {
    id: number;
    name: string;
}

interface ExtendedUser extends BaseUser {
    email: string;
    age: number;
}

const extendedUser: ExtendedUser = {
    id: 1,
    name: '张三',
    email: 'zhangsan@example.com',
    age: 25
};
```

### 3.2 类型别名 vs 接口

```typescript
// 1. 类型别名（编译时删除）
type UserId = number;
type UserName = string;

function getUser(id: UserId, name: UserName) {
    console.log(id, name);
}

// 2. 接口（编译时保留，运行时检查）
interface User {
    id: number;
    name: string;
}

function processUser(user: User) {
    console.log(user.id, user.name);
}

// 3. 选择建议
// 使用接口：定义对象结构、类实现、API契约
// 使用类型别名：基本类型别名、联合类型、交叉类型

// 4. 接口扩展
interface User {
    id: number;
    name: string;
}

interface UserWithPermissions extends User {
    permissions: string[];
}

// 5. 交叉类型（类型别名）
type UserOrAdmin = User & { isAdmin: boolean };

const admin: UserOrAdmin = {
    id: 1,
    name: '张三',
    isAdmin: true
};

// 6. 联合类型（类型别名）
type StringOrNumber = string | number;

function processValue(value: StringOrNumber) {
    if (typeof value === 'string') {
        return value.toUpperCase();
    }
    return value.toFixed(2);
}
```

---

## 4. 泛型编程

### 4.1 泛型函数

```typescript
// 1. 基础泛型
function identity<T>(value: T): T {
    return value;
}

identity<number>(42);      // 42
identity<string>('hello');  // 'hello'

// 2. 泛型接口
interface Box<T> {
    value: T;
}

function createBox<T>(value: T): Box<T> {
    return { value };
}

const stringBox = createBox('hello');
const numberBox = createBox(42);

// 3. 多个类型参数
function pair<T, U>(first: T, second: U): [T, U] {
    return [first, second];
}

const [string, number] = pair('hello', 42);

// 4. 泛型约束
interface Lengthwise {
    length: number;
}

function getLength<T extends Lengthwise>(value: T): number {
    return value.length;
}

getLength('hello');  // 5

// 5. 泛型默认值
function createArray<T = string>(length: number, defaultValue: T): T[] {
    return Array(length).fill(defaultValue);
}

createArray(3, 'default');  // ['default', 'default', 'default']
createArray<number>(3, 0);     // [0, 0, 0]
```

### 4.2 泛型类

```typescript
// 1. 基础泛型类
class Box<T> {
    constructor(private value: T) {}

    getValue(): T {
        return this.value;
    }

    setValue(value: T): void {
        this.value = value;
    }
}

const stringBox = new Box('hello');
console.log(stringBox.getValue());  // hello

// 2. 泛型约束
interface HasLength {
    length: number;
}

class DataContainer<T extends HasLength> {
    constructor(private data: T) {}

    getSize(): number {
        return this.data.length;
    }
}

const arrayContainer = new DataContainer([1, 2, 3]);
console.log(arrayContainer.getSize());  // 3

// 3. 泛型方法
class Calculator<T> {
    add(a: T, b: T): T {
        return (a as any + b) as T;
    }

    subtract(a: T, b: T): T {
        return (a as any - b) as T;
    }
}

const numberCalc = new Calculator<number>();
console.log(numberCalc.add(1, 2));  // 3

// 4. 静态方法
interface Entity {
    id: number;
    createdAt: Date;
}

class Repository<T extends Entity> {
    private items: T[] = [];

    add(item: T): void {
        this.items.push(item);
    }

    findAll(): T[] {
        return [...this.items];
    }

    findById(id: number): T | undefined {
        return this.items.find(item => item.id === id);
    }
}
```

### 4.3 映射类型

```typescript
// 1. 映射类型定义
type Users = {
    [key: string]: {
        id: number;
        name: string;
        email: string;
    }
};

const users: Users = {
    'user1': { id: 1, name: '张三', email: 'zhangsan@example.com' },
    'user2': { id: 2, name: '李四', email: 'lisi@example.com' }
};

// 2. 映射类型工具
type Keys<T> = keyof T;
type Values<T> = T[keyof T];

function getUserNames(users: Users): Values<Users> {
    return Object.values(users);
}

function getUserKeys(users: Users): Keys<Users>[] {
    return Object.keys(users);
}

console.log(getUserNames(users));  // ['张三', '李四']
console.log(getUserKeys(users));  // ['user1', 'user2']

// 3. 条件类型
type User = {
    id: number;
    name: string;
    role: 'admin' | 'user' | 'guest';
};

const admin: User = {
    id: 1,
    name: '张三',
    role: 'admin'
};

// 4. 只读/只写映射
type ReadonlyUsers = Readonly<Users>;

const readonlyUsers: ReadonlyUsers = {
    'user1': { id: 1, name: '张三', email: 'zhangsan@example.com' }
};

// readonlyUsers['user1'] = {...};  // 错误：只读属性
```

---

## 5. 装饰器

### 5.1 类装饰器

```typescript
// 1. 装饰器工厂函数
function logClass(target: any) {
    // 保存原始构造函数
    const originalConstructor = target;

    // 创建新的构造函数
    function newConstructor(...args: any[]) {
        console.log(`创建${target.name}实例`);
        const instance = new originalConstructor(...args);
        return instance;
    }

    // 复制原型和静态属性
    newConstructor.prototype = originalConstructor.prototype;
    Object.setPrototypeOf(newConstructor, originalConstructor);

    return newConstructor as any;
}

// 2. 使用装饰器
@logClass
class User {
    constructor(private name: string) {}

    greet() {
        console.log(`你好，我是${this.name}`);
    }
}

const user = new User('张三');
// 输出：创建User实例

// 3. 参数化装饰器
function logProperty(target: any, key: string) {
    let value = target[key];

    const getter = () => {
        console.log(`读取属性${key}`);
        return value;
    };

    const setter = (newValue: any) => {
        console.log(`设置属性${key}为${newValue}`);
        value = newValue;
    };

    Object.defineProperty(target, key, {
        get: getter,
        set: setter,
        enumerable: true,
        configurable: true
    });
}

class User2 {
    @logProperty
    name: string = '张三';
}

const user2 = new User2();
console.log(user2.name);  // 读取属性name
user2.name = '李四';    // 设置属性name为李四
```

### 5.2 方法装饰器

```typescript
// 1. 方法装饰器
function logMethod(target: any, key: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
        console.log(`调用方法${key}`);
        return originalMethod.apply(this, args);
    };

    return descriptor;
}

class Calculator {
    @logMethod
    add(a: number, b: number): number {
        return a + b;
    }

    @logMethod
    subtract(a: number, b: number): number {
        return a - b;
    }
}

const calc = new Calculator();
calc.add(1, 2);  // 输出：调用方法add
calc.subtract(3, 1);  // 输出：调用方法subtract

// 2. 异步方法装饰器
function asyncMethod(target: any, key: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
        console.log(`开始异步方法${key}`);
        const result = await originalMethod.apply(this, args);
        console.log(`结束异步方法${key}`);
        return result;
    };

    return descriptor;
}

class APIService {
    @asyncMethod
    async fetchData(url: string): Promise<any> {
        const response = await fetch(url);
        return response.json();
    }
}

const api = new APIService();
api.fetchData('https://api.example.com/data');
```

### 5.3 参数装饰器

```typescript
// 1. 参数装饰器工厂
function required(target: any, key: string, index: number) {
    // 在类上创建元数据
    if (!target.__required) {
        target.__required = {};
    }

    // 记录必需参数的位置
    target.__required[key] = index;
}

// 2. 参数验证装饰器
function validate(target: any, key: string, index: number) {
    const originalMethod = target[key];

    target[key] = function (...args: any[]) {
        // 检查必需参数
        if (target.__required && target.__required[key] !== undefined) {
            const value = args[target.__required[key]];
            if (value === undefined || value === null) {
                throw new Error(`参数${key}是必需的`);
            }
        }

        return originalMethod.apply(this, args);
    };
}

class Form {
    @required
    @validate
    submit(@required data: any): void {
        console.log('提交表单', data);
    }
}

const form = new Form();
form.submit({ name: '张三', email: 'zhangsan@example.com' });
```

---

## 6. 工具类型

### 6.1 常用工具类型

```typescript
// 1. Partial（所有属性可选）
interface User {
    id: number;
    name: string;
    email: string;
}

const updateUser = (id: number, data: Partial<User>) => {
    // 只更新提供的字段
    console.log(`更新用户${id}`, data);
};

updateUser(1, { name: '新名字' });  // 只更新name

// 2. Required（所有属性必需）
interface Article {
    id: number;
    title: string;
    content: string;
}

function createArticle(data: Required<Article>) {
    console.log('创建文章', data);
}

createArticle({ id: 1, title: '标题', content: '内容' });  // 必须提供所有字段

// 3. Readonly（所有属性只读）
interface Config {
    apiUrl: string;
    timeout: number;
}

const config: Readonly<Config> = {
    apiUrl: 'https://api.example.com',
    timeout: 5000
};

// config.apiUrl = 'new';  // 错误：只读属性

// 4. Record（键值对类型）
type Users = Record<string, User>;

const users: Users = {
    'user1': { id: 1, name: '张三', email: 'zhangsan@example.com' },
    'user2': { id: 2, name: '李四', email: 'lisi@example.com' }
};

// 5. Pick（选择部分属性）
interface User {
    id: number;
    name: string;
    email: string;
    age: number;
}

typeUserPreview = Pick<User, 'id' | 'name'>;

const getUserPreview = (user: User): UserPreview => {
    const { id, name } = user;
    return { id, name };
};

// 6. Omit（排除部分属性）
type CreateUserRequest = Omit<User, 'id'>;

const createUserRequest = (data: CreateUserRequest) => {
    console.log('创建用户', data);
};

// 7. Extract（提取函数类型）
type AsyncFunction = () => Promise<any>;

function executeTask(task: Extract<AsyncFunction>) {
    return task();
}

// 8. ReturnType和Parameters
function getUser(id: number): Promise<User> {
    return Promise.resolve({ id, name: '张三', email: 'zhangsan@example.com' });
}

type GetUserReturnType = ReturnType<typeof getUser>;  // Promise<User>
type GetUserParameters = Parameters<typeof getUser>;  // [number]

type UserId = GetUserParameters[0];  // number
```

---

## 7. 配置文件

### 7.1 tsconfig.json

```json
{
  "compilerOptions": {
    // 编译目标
    "target": "ES2020",

    // 模块系统
    "module": "commonjs",  // 或 "ES2020", "UMD"

    // 库文件搜索策略
    "lib": ["ES2020", "DOM"],

    // 严格模式
    "strict": true,

    // 类型检查
    "noImplicitAny": true,     // 禁止隐式any
    "strictNullChecks": true,   // 严格空值检查
    "noUnusedLocals": true,     // 检查未使用的变量

    // 模块解析
    "moduleResolution": "node",
    "esModuleInterop": true,

    // 路径解析
    "baseUrl": ".",
    "paths": {
      "@/*": ["node_modules/*"]
    },

    // 生成配置
    "outDir": "./dist",
    "rootDir": "./src",
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true,

    // 其他选项
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "**/*.test.ts"
  ]
}
```

### 7.2 常用编译器选项

| 选项 | 说明 | 推荐值 |
|------|------|--------|
| **strict** | 启用严格模式 | true |
| **noImplicitAny** | 禁止隐式any类型 | true |
| **strictNullChecks** | 严格空值检查了 | true |
| **noUnusedLocals** | 检查未使用的变量 | true |
| **noFallthroughCasesInSwitch** | switch穿透检查 | true |
| **noImplicitReturns** | 检查隐式返回 | true |
| **esModuleInterop** | ES模块互操作 | true |
| **allowSyntheticDefaultImports** | 允许默认导入 | true |
| **sourceMap** | 生成source map | true |
| **declaration** | 生成.d.ts文件 | true |
| **declarationMap** | 生成.d.ts.map | true |

---

## 8. 最佳实践

### 8.1 类型设计原则

```typescript
// 1. 達合类型优于any
// ✅ 推荐
type User = {
    id: number;
    name: string;
    email: string;
};

// ❌ 避免
let user: any = {};

// 2. 明确类型优于推断
// ✅ 推荐
const count: number = 42;

// ❌ 避免
const count = 42;  // 虽然可以推断

// 3. 使用接口定义对象结构
// ✅ 推荐
interface User {
    id: number;
    name: string;
}

// ❌ 避免
const user: { id: number; name: string } = {};

// 4. 使用类型别名提高可读性
// ✅ 推荐
type UserId = number;

function getUser(id: UserId) { }

// ❌ 避免
function getUser(id: number) { }

// 5. 使用泛型提高复用性
// ✅ 推荐
function identity<T>(value: T): T {
    return value;
}

// ❌ 避免
function identity(value: any): any {
    return value;
}

// 6. 使用readonly保护不可变数据
// ✅ 推荐
const config: Readonly<Config> = {};

// ❌ 避免
const config = {};

// 7. 使用?表示可选属性
// ✅ 推荐
interface User {
    id: number;
    name?: string;  // 可选
}

// ❌ 避免
interface User {
    id: number;
    name: string | undefined;
}
```

---

## 参考资源

- [TypeScript官方文档](https://www.typescriptlang.org/)
- [TypeScript中文文档](https://ts.nodejs.cn/)
- [TypeScript深度解析](https://www.typescriptlang.org/docs/handbook/intro/types-from-the-ground-up.html)

---

*本文档持续更新，最后更新于2026年3月*
