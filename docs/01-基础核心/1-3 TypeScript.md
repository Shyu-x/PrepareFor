# TypeScript 核心知识与面试问题汇总

> TypeScript 是 JavaScript 的超集，它添加了类型系统和对 ES6+ 特性的支持。本文档涵盖 TypeScript 核心知识点和面试高频问题。

---

## 一、TypeScript 基础入门

### 1.1 TypeScript 是什么？

**定义：**

TypeScript 是一种由微软开发的开源编程语言，它是 JavaScript 的超集，添加了可选的静态类型、类和模块支持。TypeScript 最终会被编译为纯 JavaScript 代码，可以在任何浏览器、操作系统上运行。

**核心优势：**

- **静态类型检查**：在编译阶段发现潜在错误，减少运行时错误
- **IDE 支持**：提供更好的代码补全、重构和类型提示
- **代码可读性**：类型即文档，提高代码可维护性
- **现代特性**：支持 ES6+ 乃至更高版本的语法特性

---

### 1.2 TypeScript 与 JavaScript 的区别

| 特性 | JavaScript | TypeScript |
|------|------------|------------|
| 类型系统 | 动态类型 | 静态类型（可选） |
| 编译性 | 解释型 | 编译型 |
| 类与模块 | ES6+ 支持 | 原生支持 |
| 装饰器 | 不支持 | 支持 |
| 接口 | 不支持 | 支持 |
| 泛型 | 不支持 | 支持 |
| 类型推断 | 无 | 强大 |

---

### 1.3 TypeScript 安装与配置

**安装：**

```bash
# 全局安装
npm install -g typescript

# 本地安装
npm install --save-dev typescript

# 编译
tsc filename.ts
```

**tsconfig.json 配置文件：**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 二、TypeScript 基础类型

### 2.1 原始类型

```typescript
// 布尔类型
let isDone: boolean = false;

// 数字类型
let count: number = 42;
let decimal: number = 6.0;
let hex: number = 0xf00d;
let binary: number = 0b1010;
let octal: number = 0o744;

// 字符串类型
let name: string = "TypeScript";
let template: string = `Hello, ${name}`;

// 空值与未定义
let u: undefined = undefined;
let n: null = null;

// Symbol
let sym: symbol = Symbol("key");

// BigInt
let bigInt: bigint = 100n;
```

### 2.2 数组类型

```typescript
// 两种定义方式
let arr1: number[] = [1, 2, 3];
let arr2: Array<number> = [1, 2, 3];

// 混合类型
let arr3: (string | number)[] = [1, "two", 3];

// 只读数组
let arr4: readonly number[] = [1, 2, 3];
let arr5: ReadonlyArray<number> = [1, 2, 3];
```

### 2.3 元组类型

```typescript
// 固定长度和类型的数组
let tuple: [string, number];
tuple = ["hello", 42]; // OK
tuple = [42, "hello"]; // Error

// 可选元素
let optionalTuple: [string, number?];
optionalTuple = ["hello"];
optionalTuple = ["hello", 42];

// 剩余元素
let restTuple: [string, ...number[]];
restTuple = ["hello", 1, 2, 3];
```

### 2.4 枚举类型

```typescript
// 数字枚举
enum Color {
  Red,    // 0
  Green,  // 1
  Blue    // 2
}

// 字符串枚举
enum Direction {
  Up = "UP",
  Down = "DOWN",
  Left = "LEFT",
  Right = "RIGHT"
}

// 常量枚举
const enum Enum {
  A = 1,
  B = Enum.A * 2
}
```

### 2.5 Any、Void、Never、Unknown

```typescript
// any - 任意类型，绕过类型检查
let anyValue: any = 4;
anyValue = "string";
anyValue = true;
anyValue.foo.bar; // 不报错

// void - 无返回值
function warnUser(): void {
  console.log("Warning!");
}

// never - 永不返回（抛出异常或无限循环）
function error(message: string): never {
  throw new Error(message);
}

function infiniteLoop(): never {
  while (true) {}
}

// unknown - 未知类型，使用前必须进行类型检查
let unknownValue: unknown = "hello";
if (typeof unknownValue === "string") {
  console.log(unknownValue.toUpperCase()); // OK
}
```

---

## 三、接口与类型别名

### 3.1 接口定义

```typescript
// 基本接口
interface Person {
  name: string;
  age: number;
}

// 可选属性
interface Person {
  name: string;
  age?: number;
}

// 只读属性
interface Person {
  readonly id: number;
  name: string;
}

// 方法定义
interface Person {
  greet(): string;
}

// 索引签名
interface StringArray {
  [index: number]: string;
}

let arr: StringArray = ["a", "b", "c"];
```

### 3.2 接口继承

```typescript
interface Animal {
  name: string;
}

interface Dog extends Animal {
  breed: string;
}

interface ServiceDog extends Dog {
  trained: boolean;
}
```

### 3.3 类型别名

```typescript
// 基本类型别名
type ID = string | number;

// 对象类型别名
type Point = {
  x: number;
  y: number;
};

// 函数类型别名
type Callback = (data: string) => void;

// 交叉类型
type ExtendedPoint = Point & { z: number };
```

### 3.4 接口 vs 类型别名

| 特性 | 接口 | 类型别名 |
|------|------|----------|
| 扩展 | extends | 交叉类型 (&) |
| 声明合并 | 支持 | 不支持 |
| 计算属性 | 不支持 | 支持 |
| 描述对象 | 是 | 是 |
| 描述函数 | 是 | 是 |
| 描述元组 | 是 | 是 |

---

## 四、泛型

### 4.1 泛型基础

```typescript
// 泛型函数
function identity<T>(arg: T): T {
  return arg;
}

let result = identity<string>("hello");
let inferred = identity("hello"); // 类型推断

// 泛型接口
interface GenericIdentity<T> {
  (arg: T): T;
}

let myIdentity: GenericIdentity<number> = identity;

// 泛型类
class GenericNumber<T> {
  zeroValue: T;
  add: (x: T, y: T) => T;
}

let myGeneric = new GenericNumber<number>();
myGeneric.zeroValue = 0;
myGeneric.add = (x, y) => x + y;
```

### 4.2 泛型约束

```typescript
// 使用 extends 约束
interface Lengthwise {
  length: number;
}

function logLength<T extends Lengthwise>(arg: T): void {
  console.log(arg.length);
}

logLength("hello"); // OK
logLength([1, 2, 3]); // OK
logLength({ length: 10 }); // OK

// 约束属性
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

### 4.3 泛型默认值

```typescript
interface ApiResponse<T = string> {
  data: T;
  status: number;
}

let response1: ApiResponse;
let response2: ApiResponse<number>;
```

---

## 五、TypeScript 工具类型

### 5.1 常用工具类型

```typescript
// Partial - 所有属性可选
interface User {
  id: number;
  name: string;
  email: string;
}

type PartialUser = Partial<User>;
// 等价于
// { id?: number; name?: string; email?: string; }

// Required - 所有属性必需
type RequiredUser = Required<User>;

// Readonly - 所有属性只读
type ReadonlyUser = Readonly<User>;

// Pick - 选择属性
type UserPreview = Pick<User, "id" | "name">;

// Omit - 排除属性
type UserWithoutEmail = Omit<User, "email">;

// Record - 构造对象类型
type UserRoles = Record<string, "admin" | "user" | "guest">;
```

### 5.2 条件类型

```typescript
// 基本条件类型
type IsString<T> = T extends string ? true : false;

type A = IsString<string>;  // true
type B = IsString<number>;  // false

// 提取元素类型
type Flatten<T> = T extends Array<infer U> ? U : T;

type Str = Flatten<string[]>;  // string
type Num = Flatten<number>;    // number
```

### 5.3 映射类型

```typescript
// 基本映射
type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

// 添加可选和只读
type Proxy<T> = {
  get(): T;
  set(value: T): void;
};

type Proxify<T> = {
  [P in keyof T]: Proxy<T[P]>;
};

function proxify<T>(obj: T): Proxify<T> {
  // 实现...
  return obj as Proxify<T>;
}
```

---

## 六、装饰器

### 6.1 类装饰器

```typescript
function sealed(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}

@sealed
class Greeter {
  greeting: string;
  constructor(message: string) {
    this.greeting = message;
  }
  greet() {
    return "Hello, " + this.greeting;
  }
}
```

### 6.2 方法装饰器

```typescript
function enumerable(value: boolean) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    descriptor.enumerable = value;
  };
}

class Greeter {
  greeting: string;
  constructor(message: string) {
    this.greeting = message;
  }

  @enumerable(false)
  greet() {
    return "Hello, " + this.greeting;
  }
}
```

### 6.3 参数装饰器

```typescript
function logged(target: any, propertyKey: string, parameterIndex: number) {
  console.log(`Parameter ${parameterIndex} at ${propertyKey} has been logged`);
}

class Greeter {
  greeting: string;
  constructor(message: string) {
    this.greeting = message;
  }

  greet(@logged name: string) {
    return "Hello, " + name;
  }
}
```

---

## 七、TypeScript 面试高频问题

### 7.1 TypeScript 的类型推断机制

**问题：** TypeScript 如何进行类型推断？

**参考答案：**

TypeScript 会根据变量的初始值、函数返回值、上下文等信息自动推断类型。

1. **变量类型推断**：
   ```typescript
   let x = 3; // 推断为 number
   let y = "hello"; // 推断为 string
   ```

2. **函数返回类型推断**：
   ```typescript
   function add(a, b) {
     return a + b; // 推断返回 number
   }
   ```

3. **上下文类型推断**：
   ```typescript
   window.onmousedown = function(event) {
     // event 被推断为 MouseEvent
     console.log(event.button);
   };
   ```

### 7.2 any、never、unknown 的区别

**问题：** 解释 any、never、unknown 的区别和使用场景。

**参考答案：**

| 类型 | 特点 | 使用场景 |
|------|------|----------|
| any | 任意类型，无类型检查 | 迁移 JavaScript 代码、动态内容 |
| never | 永不返回任何值 | 抛出异常函数、死循环函数、类型保护 |
| unknown | 未知类型，使用前需检查 | 处理不确定的 API 返回值 |

**示例：**
```typescript
// any - 绕过类型检查
let anything: any = "hello";
anything.foo.bar; // 不报错

// unknown - 需要类型保护
let something: unknown = "hello";
// something.toUpperCase(); // Error
if (typeof something === "string") {
  something.toUpperCase(); // OK
}

// never - 用于类型保护
type Foo = string & number; // never
```

### 7.3 TypeScript 中如何实现类型守卫

**参考答案：**

1. **typeof 原始类型守卫**：
   ```typescript
   function print(value: string | number) {
     if (typeof value === "string") {
       console.log(value.toUpperCase());
     } else {
       console.log(value.toFixed(2));
     }
   }
   ```

2. **instanceof 类实例守卫**：
   ```typescript
   class Dog { bark() {} }
   class Cat { meow() {} }

   function makeSound(animal: Dog | Cat) {
     if (animal instanceof Dog) {
       animal.bark();
     } else {
       animal.meow();
     }
   }
   ```

3. **自定义类型守卫**：
   ```typescript
   interface Fish { swim(): void; }
   interface Bird { fly(): void; }

   function isFish(pet: Fish | Bird): pet is Fish {
     return (pet as Fish).swim !== undefined;
   }
   ```

4. **in 操作符守卫**：
   ```typescript
   function move(pet: Fish | Bird) {
     if ("swim" in pet) {
       pet.swim();
     } else {
       pet.fly();
     }
   }
   ```

### 7.4 TypeScript 泛型的实际应用

**问题：** 描述你在项目中如何使用泛型。

**参考答案：**

1. **API 数据处理**：
   ```typescript
   interface ApiResponse<T> {
     data: T;
     status: number;
     message: string;
   }

   async function fetchData<T>(url: string): Promise<ApiResponse<T>> {
     const response = await fetch(url);
     return response.json();
   }

   interface User { name: string; }
   const result = await fetchData<User>("/api/user");
   ```

2. **通用组件**：
   ```typescript
   interface ListProps<T> {
     items: T[];
     renderItem: (item: T) => React.ReactNode;
   }

   function List<T>({ items, renderItem }: ListProps<T>) {
     return (
       <ul>
         {items.map((item, index) => (
           <li key={index}>{renderItem(item)}</li>
         ))}
       </ul>
     );
   }
   ```

3. **工具函数**：
   ```typescript
   function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
     const result = {} as Pick<T, K>;
     keys.forEach(key => {
       result[key] = obj[key];
     });
     return result;
   }
   ```

### 7.5 TypeScript 编译选项详解

**问题：** 说说你常用的 tsconfig.json 配置。

**参考答案：**

```json
{
  "compilerOptions": {
    // 目标 ECMAScript 版本
    "target": "ES2020",

    // 模块系统
    "module": "ESNext",
    "moduleResolution": "node",

    // 严格模式（强烈建议开启）
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,

    // JSX 支持
    "jsx": "react-jsx",

    // 路径别名
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },

    // 输出配置
    "outDir": "./dist",
    "declaration": true,

    // 其他
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### 7.6 TypeScript 如何处理类型兼容性问题

**参考答案：**

TypeScript 使用结构化类型系统，基于形状而非名称进行类型检查。

1. **函数参数双向协变**：
   ```typescript
   let handler = (a: string) => void;
   let handler2 = (a: string | number) => void;

   handler = handler2; // OK
   ```

2. **启用 strictFunctionTypes**：
   ```typescript
   // 严格模式下不允许
   handler2 = handler; // Error
   ```

3. **类型断言**：
   ```typescript
   const values: number[] = [1, 2, 3];
   const strs = values as (string | number)[];
   ```

## 九、TypeScript 类型体操（高级）

### 9.1 深入条件类型

**分布式条件类型：**

```typescript
// 分布式条件类型 - 联合类型会自动分发
type ToArray<T> = T extends any ? T[] : never;

type StrArr = ToArray<string>;       // string[]
type NumArr = ToArray<number>;       // number[]
type UnionArr = ToArray<string | number>;  // string[] | number[]

// 实际应用：Exclude 和 Extract 的实现
type MyExclude<T, U> = T extends U ? never : T;
type MyExtract<T, U> = T extends U ? T : never;

type T1 = MyExclude<string | number | boolean, string>;  // number | boolean
type T2 = MyExtract<string | number | boolean, string>;  // string
```

**infer 关键字进阶：**

```typescript
// 提取函数返回类型
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type R1 = ReturnType<() => string>;    // string
type R2 = ReturnType<() => void>;      // void
type R3 = ReturnType<(x: number) => boolean>;  // boolean

// 提取函数参数类型
type Parameters<T> = T extends (...args: infer P) => any ? P : never;

type P1 = Parameters<(a: string, b: number) => void>;  // [string, number]
type P2 = Parameters<(x: boolean) => void>;  // [boolean]

// 提取构造函数参数
type ConstructorParameters<T> = T extends new (...args: infer P) => any ? P : never;

type CP = ConstructorParameters<new (x: string, y: number) => object>;  // [string, number]

// 提取实例类型
type InstanceType<T> = T extends new (...args: any[]) => infer R ? R : any;

type IT = InstanceType<new () => object>;  // object
```

**更复杂的类型推断：**

```typescript
// 提取数组元素类型
type ArrayElement<T> = T extends (infer U)[] ? U : never;

type AE1 = ArrayElement<string[]>;     // string
type AE2 = ArrayElement<[string, number]>;  // string | number

// 提取Promise内部类型
type PromiseInner<T> = T extends Promise<infer U> ? U : never;

type PI1 = PromiseInner<Promise<string>>;  // string
type PI2 = PromiseInner<string>;  // never

// 递归类型 - 深层次Partial
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

interface User {
  name: string;
  address: {
    city: string;
    zip: {
      code: string;
    };
  };
}

type PartialUser = DeepPartial<User>;
// { name?: string; address?: { city?: string; zip?: { code?: string; } } }

// 递归类型 - DeepReadonly
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

type ReadonlyUser = DeepReadonly<User>;
// { readonly name: string; readonly address: { readonly city: ... } }
```

### 9.2 模板字面量类型

```typescript
// 基本用法
type World = "world";
type Greeting = `hello ${World}`;  // "hello world"

// 联合类型
type EventName = "click" | "focus" | "blur";
type Handler = `on${EventName}`;  // "onclick" | "onfocus" | "onblur"

// 模板字面量中的类型操作
type Uppercase<T extends string> = T extends `${infer C}${infer R}`
  ? `${Uppercase<C>}${Uppercase<R>}` : T;

type UC = Uppercase<"hello">;  // "HELLO"

type Trim<T extends string> = T extends `${infer L} ${infer R}`
  ? `${Trim<L>} ${Trim<R>}` : T extends `${infer L}${" " | "\n" | "\t"}`
  ? Trim<L> : T;

type Trimmed = Trim<"  hello world  ">;  // "hello world"

// 实战：生成事件处理器类型
type EventHandler<T extends string> = `handle${Capitalize<T>}`;

type ClickHandler = EventHandler<"click">;   // "handleClick"
type HoverHandler = EventHandler<"hover">;    // "handleHover"

// 路径类型
type PathLike = "/users" | "/posts" | "/comments";
type ApiEndpoint = `https://api.example.com${PathLike}`;
// "https://api.example.com/users" | "https://api.example.com/posts" | ...
```

### 9.3 工具类型手写实战

**实现 Partial、Required、Readonly：**

```typescript
// Partial 实现
type MyPartial<T> = {
  [P in keyof T]?: T[P];
};

// Required 实现
type MyRequired<T> = {
  [P in keyof T]-?: T[P];
};

// Readonly 实现
type MyReadonly<T> = {
  readonly [P in keyof T]: T[P];
};

// Pick 实现
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// Omit 实现
type MyOmit<T, K extends keyof any> = MyPick<T, Exclude<keyof T, K>>;
```

**实现更复杂的工具类型：**

```typescript
// Mutable - 移除只读
type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

interface Foo {
  readonly a: number;
  readonly b: string;
}

type MutableFoo = Mutable<Foo>;  // { a: number; b: string }

// Nullable - 可选属性变为可空
type Nullable<T> = {
  [P in keyof T]?: T[P] | null;
};

// DeepNullable
type DeepNullable<T> = {
  [P in keyof T]?: T[P] extends object ? DeepNullable<T[P]> : T[P] | null;
};

// Record 实现
type MyRecord<K extends keyof any, T> = {
  [P in K]: T;
};

// NonNullable - 移除 null 和 undefined
type MyNonNullable<T> = T extends null | undefined ? never : T;

type NN1 = MyNonNullable<string | null | undefined>;  // string

// Parameters 实现
type MyParameters<T extends (...args: any[]) => any> = T extends (...args: infer P) => any ? P : never;

// ReturnType 实现
type MyReturnType<T extends (...args: any[]) => any> = T extends (...args: any[]) => infer R ? R : never;

// InstanceType 实现
type MyInstanceType<T extends new (...args: any[]) => any> = T extends new (...args: any[]) => infer R ? R : never;
```

### 9.4 类型编程面试题

**题目1：实现一个Flatten类型**

```typescript
// 将嵌套数组展平
type Flatten<T extends any[]> = T extends [infer F, ...infer R]
  ? F extends any[]
    ? [...Flatten<F>, ...Flatten<R>]
    : [F, ...Flatten<R>]
  : [];

type F1 = Flatten<[1, 2, 3]>;                    // [1, 2, 3]
type F2 = Flatten<[1, [2, 3], 4]>;               // [1, 2, 3, 4]
type F3 = Flatten<[1, [2, [3, [4]]]]>;           // [1, 2, 3, 4]
```

**题目2：实现一个Tuple类型转Union**

```typescript
type TupleToUnion<T extends any[]> = T[number];

type TU1 = TupleToUnion<[string, number]>;  // string | number
type TU2 = TupleToUnion<["a", "b", "c"]>;   // "a" | "b" | "c"
```

**题目3：实现一个Union类型转Intersection**

```typescript
type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

type UI = UnionToIntersection<{ a: 1 } | { b: 2 }>;  // { a: 1 } & { b: 2 }
```

---

## 十、TypeScript 5.x 新特性

### 10.1 TypeScript 5.0 更新

**常量参数类型：**

```typescript
// 之前
function createRoute<const T extends string>(path: T): T {
  return path;
}

// 现在可以直接使用 const
function createRoute<T extends string>(path: T): T {
  return path;
}

const route = createRoute("/users/profile");
// 之前推断为 string
// 现在推断为 "/users/profile"
```

**类型推导参数：**

```typescript
// 参数可以自动推断为 const
function makeArray<const T extends readonly unknown[]>(arr: T): T {
  return arr;
}

const arr = makeArray([1, 2, 3]);
// 推断为 readonly [1, 2, 3]
```

**@satisfies 运算符：**

```typescript
// 在保持类型推断的同时验证类型
const config = {
  port: 3000,
  host: "localhost",
} satisfies Record<string, string | number>;

// port 仍然是 number 类型
// host 仍然是 string 类型
// 同时验证了类型约束
```

### 10.2 TypeScript 5.x 装饰器

**完整装饰器语法：**

```typescript
// 类装饰器
function logged<T extends new (...args: any[]) => any>(target: T) {
  return class extends T {
    constructor(...args: any[]) {
      console.log(`Creating ${target.name}`);
      super(...args);
    }
  };
}

// 方法装饰器
function memoize(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  const cache = new Map();

  descriptor.value = function (...args: any[]) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = originalMethod.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

// 访问器装饰器
function validate(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalSetter = descriptor.set;
  const originalGetter = descriptor.get;

  descriptor.set = function (value: number) {
    if (value < 0) {
      throw new Error("Value must be positive");
    }
    originalSetter?.call(this, value);
  };
}
```

---

## 十一、项目实战中的 TypeScript

### 8.1 状态管理类型定义

```typescript
// Zustand store 类型
import { create } from 'zustand';

interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

const useStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));

### 8.2 API 类型定义

```typescript
// 请求参数
interface LoginParams {
  username: string;
  password: string;
}

// 响应类型
interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
}

// API 函数
async function login(params: LoginParams): Promise<LoginResponse> {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  return response.json();
}

### 8.3 React 组件类型

```typescript
// Props 类型
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

// 函数组件
const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false
}) => {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
```

---

## 十二、2026 TypeScript 面试趋势

### 12.1 考察重点

- 更注重实际项目中的类型设计能力
- 考察对 TypeScript 高级类型的理解
- 关注类型体操（Type Gymnastics）能力
- 结合 React/Node.js 项目的类型实践

### 12.2 准备建议

- 熟练掌握内置工具类型的实现原理
- 能够手写自定义工具类型
- 理解条件类型和映射类型的组合使用
- 阅读优秀的开源项目学习类型设计

---

> 持续更新中... 最后更新：2026-02-24
