# TypeScript 工程实践完全指南

TypeScript 已经成为现代前端和后端开发的标准配置，它不仅是一门编程语言，更是一套完整的类型系统和开发工具链。本指南将从工程实践的角度，系统性地讲解 TypeScript 在实际项目中的应用，帮助开发者建立严谨的类型思维和工程化能力。

---

## 一、TypeScript 配置详解

TypeScript 的配置文件是项目工程化的核心，它决定了编译行为、类型检查强度和项目结构。理解和掌握 tsconfig.json 是 TypeScript 工程实践的第一步，也是最重要的一步。

### 1.1 tsconfig.json 核心结构

一个完整的 tsconfig.json 包含多个顶层配置项，每个项控制着 TypeScript 编译器的不同方面。理解这些配置项的含义和相互作用，是进行 TypeScript 工程配置的基础。

```json
{
  // 文件相关配置
  "files": ["src/index.ts"],
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"],

  // 编译选项 - 这是最核心的部分
  "compilerOptions": {
    /* 基本选项 */
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",

    /* 路径和解析 */
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"]
    },
    "moduleResolution": "bundler",
    "resolveJsonModule": true,

    /* 严格模式 - 强烈建议开启 */
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,

    /* 额外检查 */
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,

    /* 输出控制 */
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": true,

    /* 实验性特性 */
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,

    /* 高级选项 */
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true
  },

  // 项目引用
  "references": [
    { "path": "./tsconfig.node.json" }
  ]
}
```

### 1.2 编译选项深度解析

#### 1.2.1 Target 与 Module

`target` 选项指定编译输出的 JavaScript 版本，这直接影响生成代码的兼容性和性能表现。在现代项目中，通常选择 ES2022 或更高版本，以获得更好的原生支持和更小的输出体积。

```json
{
  "compilerOptions": {
    // 目标 ECMAScript 版本
    "target": "ES2022",           // 建议使用 ES2022+ 以支持私有字段、Top-Level Await 等特性
    "module": "ESNext",           // 模块系统，使用 ESM
    "moduleResolution": "bundler" // 模块解析策略，推荐 bundler 模式
  }
}
```

`moduleResolution` 有三个可选值：`classic`、`node`（或 `node10`）和 `bundler`。在现代构建工具（如 Vite、Webpack 5+、esbuild）环境下，`bundler` 是最佳选择，它与这些工具的模块解析逻辑完全一致，避免了路径解析的差异问题。

#### 1.2.2 严格模式体系

TypeScript 的严格模式是一组相关检查选项的集合，它们共同构成了类型系统的安全网。单独启用 `strict: true` 会同时开启以下所有检查：

```json
{
  "compilerOptions": {
    // 严格模式总开关
    "strict": true,

    // 隐式 any 检查 - 当无法推断类型时不允许使用 any
    "noImplicitAny": true,

    // null 和 undefined 检查 - 防止 null/undefined 赋值给非空类型
    "strictNullChecks": true,

    // 函数类型严格检查 - 参数类型必须精确匹配
    "strictFunctionTypes": true,

    // bind/call/apply 严格检查 - this 类型必须精确
    "strictBindCallApply": true,

    // 类属性初始化检查 - 确保属性在构造函数中初始化
    "strictPropertyInitialization": true,

    // this 隐式 any 检查
    "noImplicitThis": true,

    // 严格模式下的语句块必须使用严格模式
    "alwaysStrict": true
  }
}
```

`strictNullChecks` 是最重要的检查之一，它强制开发者显式处理 null 和 undefined。启用此选项后，以下代码将报错：

```typescript
// 错误：不能将 undefined 赋值给 string
function greet(name: string) {
  return name.toLowerCase(); // 如果 name 是 undefined？
}

// 正确做法：显式处理 null/undefined
function greet(name: string | null | undefined) {
  if (!name) {
    return 'Hello, stranger';
  }
  return `Hello, ${name.toLowerCase()}`;
}
```

#### 1.2.3 noUnusedLocals 与 noUnusedParameters

这两个选项能有效防止代码污染，保持代码库的整洁。它们会在编译时报告未使用的变量和参数：

```json
{
  "compilerOptions": {
    // 报告未使用的局部变量
    "noUnusedLocals": true,

    // 报告未使用的函数参数
    "noUnusedParameters": true
  }
}
```

考虑这样一个场景：开发者重构代码后遗留了一个不再使用的变量：

```typescript
function calculateTotal(items: CartItem[]) {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const tax = subtotal * 0.1;

  // 错误：tax 变量声明后未使用
  // 如果确实不需要tax，应该删除这行代码
  return subtotal;
}

// 正确：如果确实需要计算tax但暂时不用
function calculateTotal(items: CartItem[]) {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const _tax = subtotal * 0.1; // 使用下划线前缀标记暂未使用的变量

  return subtotal;
}
```

#### 1.2.4 noUncheckedIndexedAccess

当访问数组或对象的索引时，TypeScript 默认假设索引总是有效的。启用此选项后，访问结果的类型会自动包含 undefined：

```json
{
  "compilerOptions": {
    "noUncheckedIndexedAccess": true
  }
}
```

```typescript
const fruits = ['apple', 'banana', 'orange'];

// 启用 noUncheckedIndexedAccess 后
const firstFruit = fruits[0];
// 类型为: string | undefined，而不是 string

// 正确：必须进行安全检查
if (firstFruit !== undefined) {
  console.log(firstFruit.toUpperCase());
}

// 或者使用可选链
console.log(fruits[0]?.toUpperCase());
```

### 1.3 项目引用配置

TypeScript 的项目引用功能允许将大型项目拆分为多个可独立编译的子项目。这种架构不仅能改善构建性能，还能提供更好的类型检查 encapsulation。

```json
// 根目录 tsconfig.json
{
  "compilerOptions": {
    "composite": true,              // 启用项目引用
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist"
  },
  "references": [
    // 引用前端和后端子项目
    { "path": "./packages/frontend" },
    { "path": "./packages/backend" },
    // 使用 prepend 强制该引用优先编译
    { "path": "./packages/shared", "prepend": true }
  ]
}
```

```json
// packages/shared/tsconfig.json - 共享代码
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "outDir": "../dist/shared",
    "rootDir": "./src"
  }
}
```

### 1.4 实战：配置优化策略

在实际项目中，配置优化需要考虑多个维度：编译速度、类型安全、输出体积和开发体验。以下是一个针对大型项目的优化配置：

```json
// tsconfig.json - 生产环境配置
{
  "compilerOptions": {
    // 目标环境
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],

    // 严格模式
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,

    // 性能优化
    "incremental": true,
    "skipLibCheck": true,

    // 输出配置
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": true,

    // 路径别名
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
```

```json
// tsconfig.dev.json - 开发环境配置
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    // 开发环境额外的检查
    "noUnusedLocals": true,
    "noUnusedParameters": true,

    // 更快的增量编译
    "incremental": true,

    // Source Map 配置
    "sourceMap": true,
    "inlineSources": true
  }
}
```

---

## 二、类型基础与类型设计

TypeScript 的类型系统是其核心价值所在。一个设计良好的类型系统不仅能捕获错误，还能作为代码的文档，提升开发体验和代码可维护性。本章将深入讲解 TypeScript 的类型基础，以及如何在实际项目中设计有效的类型。

### 2.1 基础类型详解

TypeScript 的基础类型包括 JavaScript 的七种原始类型加上 void、never、any 和 unknown。理解这些类型的语义和用法是建立类型思维的基础。

```typescript
// 原始类型
const name: string = '张三';
const age: number = 30;
const isActive: boolean = true;
const nullValue: null = null;
const undefinedValue: undefined = undefined;

// Symbol - 需要注意 symbol 在类型系统中的特性
const uniqueKey: symbol = Symbol('unique');
const obj: { [key: symbol]: string } = {
  [uniqueKey]: '这是 symbol 作为键的值'
};

// BigInt - 用于大整数运算
const hugeNumber: bigint = 9007199254740991n;

// void - 表示没有返回值的函数
function logMessage(message: string): void {
  console.log(message);
}

// never - 表示永不返回的函数（抛出异常或无限循环）
function throwError(message: string): never {
  throw new Error(message);
}

function infiniteLoop(): never {
  while (true) {
    // 无限循环
  }
}

// any - 任意类型，绕过类型检查（慎用）
let uncertain: any = 10;
uncertain = 'hello'; // OK
uncertain.toUpperCase(); // OK - 不进行类型检查

// unknown - 未知类型，比 any 更安全
let unknownValue: unknown = 10;
// (unknownValue as string).toUpperCase(); // 需要先断言
```

### 2.2 联合类型与交叉类型

联合类型和交叉类型是 TypeScript 类型系统中最强大的组合工具之一。联合类型表示值可以是多种类型之一，交叉类型表示值必须同时满足多种类型。

```typescript
// 联合类型 - 或的关系
type StringOrNumber = string | number;
type SuccessOrFailure = { success: true; data: any } | { success: false; error: Error };

function processResult(result: SuccessOrFailure) {
  if (result.success) {
    console.log('数据:', result.data); // TypeScript 知道 success 为 true
  } else {
    console.log('错误:', result.error.message); // TypeScript 知道 success 为 false
  }
}

// 可辨识联合 - 基于字面量类型区分
type Circle = { kind: 'circle'; radius: number };
type Square = { kind: 'square'; side: number };
type Triangle = { kind: 'triangle'; base: number; height: number };

type Shape = Circle | Square | Triangle;

function getArea(shape: Shape): number {
  // TypeScript 能够识别出每种形状的具体类型
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2; // shape 是 Circle
    case 'square':
      return shape.side ** 2; // shape 是 Square
    case 'triangle':
      return (shape.base * shape.height) / 2; // shape 是 Triangle
  }
}

// 交叉类型 - 与的关系
type Person = { name: string; age: number };
type Employee = { company: string; salary: number };
type Developer = Person & Employee & { skills: string[] };

const developer: Developer = {
  name: '李四',
  age: 28,
  company: '科技公司',
  salary: 30000,
  skills: ['TypeScript', 'React', 'Node.js']
};
```

### 2.3 类型别名与接口

类型别名和接口都能用于定义对象类型，但它们有不同的特性和适用场景。理解它们的区别是设计类型的基础。

```typescript
// 类型别名 - 使用 type 关键字
type Point = { x: number; y: number };
type ID = string | number;
type Callback<T> = (data: T) => void;

// 接口 - 使用 interface 关键字
interface IPoint {
  x: number;
  y: number;
}

interface IEmployee {
  readonly id: string; // 只读属性
  name: string;
  department: string;
  email?: string; // 可选属性
}

// 接口可以声明合并 - 同一接口的多处声明会自动合并
interface IUser {
  name: string;
}

interface IUser {
  email: string;
}

// 合并后的 IUser 等同于:
// interface IUser {
//   name: string;
//   email: string;
// }

// 接口扩展 - 使用 extends
interface IManager extends IEmployee {
  teamSize: number;
  department: string;
}

// 类型交叉 - 等同于接口扩展
type Manager = IEmployee & { teamSize: number; department: string };

// 选择接口还是类型别名？
// 原则：
// 1. 定义对象结构 -> 使用接口（支持声明合并、继承）
// 2. 定义联合类型、交叉类型、元组 -> 使用类型别名
// 3. 需要泛型 -> 两者皆可
type Status = 'pending' | 'active' | 'deleted'; // 联合类型用 type
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E }; // 泛型用 type
```

### 2.4 实战：设计类型系统

在实际项目中，良好的类型设计能够显著提升代码质量和开发效率。以下是一个电商订单系统的类型设计示例：

```typescript
// ==================== 领域模型类型 ====================

// 用户相关类型
interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  status: UserStatus;
}

type UserStatus = 'active' | 'inactive' | 'banned';

// 地址相关类型
interface Address {
  id: string;
  userId: string;
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  streetAddress: string;
  postalCode: string;
  isDefault: boolean;
}

// 商品相关类型
interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // 价格，单位：分
  categoryId: string;
  images: string[];
  stock: number;
  tags: string[];
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

type ProductStatus = 'draft' | 'active' | 'offline';

// 订单相关类型 - 展示完整的状态机设计
interface Order {
  id: string;
  orderNo: string; // 订单号
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number; // 订单总金额
  discountAmount: number; // 优惠金额
  freightAmount: number; // 运费
  finalAmount: number; // 实付金额
  address: Address;
  remark?: string;
  createdAt: Date;
  paidAt?: Date;
  shippedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
}

type OrderStatus =
  | 'pending_payment'   // 待付款
  | 'paid'               // 已付款
  | 'preparing'          // 备货中
  | 'shipped'            // 已发货
  | 'in_transit'         // 运输中
  | 'delivered'          // 已送达
  | 'completed'          // 已完成
  | 'cancelled';         // 已取消

interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number; // 商品单价
  quantity: number;
  subtotal: number; // 小计
  skuId?: string;
  skuDesc?: string; // SKU 规格描述
}

// ==================== API 响应类型 ====================

// 通用 API 响应封装
interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

// 分页响应类型
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 订单列表查询参数
interface OrderQueryParams {
  userId?: string;
  status?: OrderStatus;
  startDate?: Date;
  endDate?: Date;
  keyword?: string;
  page: number;
  pageSize: number;
}

// ==================== 业务逻辑类型 ====================

// 订单状态转换规则
type OrderStatusTransition = {
  from: OrderStatus;
  to: OrderStatus[];
  action: string;
  guard?: (order: Order) => boolean; // 前置条件检查
};

const ORDER_STATUS_TRANSITIONS: OrderStatusTransition[] = [
  { from: 'pending_payment', to: ['paid', 'cancelled'], action: '支付' },
  { from: 'paid', to: ['preparing', 'cancelled'], action: '开始备货' },
  { from: 'preparing', to: ['shipped'], action: '发货' },
  { from: 'shipped', to: ['in_transit'], action: '运输' },
  { from: 'in_transit', to: ['delivered'], action: '送达' },
  { from: 'delivered', to: ['completed'], action: '确认收货' },
];

// 状态机实现
function canTransitionTo(currentStatus: OrderStatus, targetStatus: OrderStatus): boolean {
  const transition = ORDER_STATUS_TRANSITIONS.find(t => t.from === currentStatus);
  return transition?.to.includes(targetStatus) ?? false;
}

// 订单创建 DTO
interface CreateOrderDTO {
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
    skuId?: string;
  }>;
  addressId: string;
  remark?: string;
}

// 订单更新 DTO
interface UpdateOrderDTO {
  status?: OrderStatus;
  remark?: string;
  trackingNo?: string;
}
```

---

## 三、泛型深入实践

泛型是 TypeScript 类型系统中最强大的特性之一，它允许开发者编写可重用的类型安全代码。掌握泛型是成为 TypeScript 高手的关键。本章将从基础到高级，系统讲解泛型的使用方法和最佳实践。

### 3.1 泛型函数基础

泛型函数允许函数在调用时自动推断类型，而不是在使用前固定类型参数。这使得函数能够处理多种类型，同时保持类型安全。

```typescript
// 基础泛型函数
function identity<T>(value: T): T {
  return value;
}

// 调用时自动推断类型
const num = identity(42);           // 类型为 number
const str = identity('hello');     // 类型为 string
const bool = identity(true);       // 类型为 boolean

// 显式指定类型参数
const obj = identity<{ name: string }>({ name: '张三' });

// 泛型数组操作
function firstElement<T>(arr: T[]): T | undefined {
  return arr[0];
}

const nums = [1, 2, 3];
const first = firstElement(nums); // 类型为 number | undefined

// 多个类型参数
function mapObject<K, V>(
  obj: Record<K, V>,
  transform: (value: V, key: K) => V
): Record<K, V> {
  const result = {} as Record<K, V>;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = transform(obj[key], key);
    }
  }
  return result;
}

const doubled = mapObject(
  { a: 1, b: 2, c: 3 },
  (value) => value * 2
);
// 结果类型为 { a: number; b: number; c: number }
```

### 3.2 泛型约束

泛型约束限制了类型参数的范围，使得我们能够在泛型函数或泛型类型中安全地访问类型参数的特定属性或方法。

```typescript
// 使用 extends 关键字约束类型参数
interface HasLength {
  length: number;
}

function logLength<T extends HasLength>(value: T): T {
  console.log(`长度为: ${value.length}`);
  return value;
}

// 合法调用
logLength('hello');           // string 有 length 属性
logLength([1, 2, 3]);         // 数组有 length 属性
logLength({ length: 10 });    // 自定义对象有 length 属性
// logLength(123);            // 错误！number 没有 length 属性

// 约束必须包含特定属性
interface Point {
  x: number;
  y: number;
}

function createPoint<T extends Point>(point: T): T {
  return { ...point, x: point.x, y: point.y };
}

// keyof 约束 - 限制为对象键的联合类型
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: '张三', age: 30, email: 'zhang@example.com' };
const name = getProperty(user, 'name');    // 类型为 string
const age = getProperty(user, 'age');      // 类型为 number
// getProperty(user, 'phone');             // 错误！user 没有 phone 属性

// 多重约束
interface Serializable {
  toJSON(): string;
}

interface Loggable {
  log(): void;
}

function processAndLog<T extends Serializable & Loggable>(item: T): void {
  console.log(item.toJSON());
  item.log();
}

// 使用构造函数约束
class Animal {
  constructor(public name: string) {}
}

class Dog extends Animal {
  breed: string;
}

function createInstance<T extends Animal>(
  constructor: new (name: string) => T,
  name: string
): T {
  return new constructor(name);
}

const dog = createInstance(Dog, '旺财');
// dog 的类型为 Dog
```

### 3.3 泛型接口与泛型类

泛型不仅可以用在函数上，还可以用在接口和类上，创建可重用的类型定义。

```typescript
// 泛型接口
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

interface User {
  id: string;
  name: string;
}

// 使用具体类型
type UserResponse = ApiResponse<User>;
type UserListResponse = ApiResponse<User[]>;

// 泛型类
class Stack<T> {
  private items: T[] = [];
  private top: number = 0;

  push(item: T): void {
    this.items[this.top++] = item;
  }

  pop(): T | undefined {
    if (this.top === 0) return undefined;
    return this.items[--this.top];
  }

  peek(): T | undefined {
    return this.top > 0 ? this.items[this.top - 1] : undefined;
  }

  isEmpty(): boolean {
    return this.top === 0;
  }

  size(): number {
    return this.top;
  }
}

const numberStack = new Stack<number>();
numberStack.push(1);
numberStack.push(2);
numberStack.push(3);
console.log(numberStack.pop()); // 3
console.log(numberStack.peek()); // 2

const stringStack = new Stack<string>();
stringStack.push('a');
stringStack.push('b');
console.log(stringStack.pop()); // 'b'

// 泛型枚举
enum ResponseStatus {
  Success = 200,
  NotFound = 404,
  Error = 500,
}

// 泛型类型别名
type Nullable<T> = T | null;
type Optional<T> = T | undefined;
type AsyncResult<T> = Promise<ApiResponse<T>>;

// 工具类型组合
type UserApiResponse = AsyncResult<Nullable<User>>;
```

### 3.4 条件类型

条件类型是 TypeScript 2.8引入的高级特性，它允许根据类型关系动态计算类型。条件类型是构建高级类型工具的基础。

```typescript
// 基础条件类型
type IsString<T> = T extends string ? true : false;

type A = IsString<string>;  // true
type B = IsString<number>;  // false

// 条件类型与泛型结合
type NonNullable<T> = T extends null | undefined ? never : T;

type C = NonNullable<string | null | undefined>; // string

// 提取类型
type ExtractPromise<T> = T extends Promise<infer U> ? U : T;

type D = ExtractPromise<Promise<string>>; // string
type E = ExtractPromise<number>;          // number

// 推断数组元素类型
type ElementType<T> = T extends (infer U)[] ? U : never;

type F = ElementType<string[]>; // string
type G = ElementType<number[]>; // number

// 推断函数返回类型
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function greet(): string {
  return 'hello';
}

type H = ReturnType<typeof greet>; // string

// 多重条件推断
type UnwrapPromise<T> = T extends Promise<infer U>
  ? U extends Promise<infer V>
    ? V
    : U
  : T;

type I = UnwrapPromise<Promise<Promise<string>>>; // string

// 条件类型中的分发机制
type ToArray<T> = T extends any ? T[] : never;

type J = ToArray<string | number>; // string[] | number[]
// 相当于: ToArray<string> | ToArray<number>
// 结果: string[] | number[]

// 非分发条件类型
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;

type K = ToArrayNonDist<string | number>; // (string | number)[]
```

### 3.5 实战：泛型工具实现

在实际项目中，泛型工具类型能显著提升开发效率和类型安全性。以下是一些实用的泛型工具实现：

```typescript
// ==================== 基础工具类型 ====================

// Partialize - 将类型 T 的所有属性转换为可选
type Partialize<T> = {
  [P in keyof T]?: T[P];
};

// Required - 将类型 T 的所有属性转换为必需
type Required<T> = {
  [P in keyof T]-?: T[P];
};

// Readonly - 将类型 T 的所有属性转换为只读
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

// Pick - 从 T 中选取指定的属性
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// Omit - 从 T 中移除指定的属性
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

// Record - 创建键类型为 K，值类型为 T 的对象类型
type Record<K extends keyof any, T> = {
  [P in K]: T;
};

// ==================== 高级工具类型 ====================

// DeepPartial - 深度的 Partialize
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// DeepReadonly - 深度的 Readonly
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// DeepRequired - 深度的 Required
type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

// ==================== 函数工具类型 ====================

// Parameters - 提取函数参数类型
type Parameters<T extends (...args: any) => any> = T extends (
  ...args: infer P
) => any
  ? P
  : never;

// FirstParameter - 提取第一个参数类型
type FirstParameter<T extends (...args: any) => any> = T extends (
  arg: infer F,
  ...args: any
) => any
  ? F
  : never;

// ReturnType - 提取函数返回类型（内置）
// type ReturnType<T extends (...args: any) => any> = ...

// AsyncReturnType - 提取异步函数返回类型
type AsyncReturnType<T extends (...args: any) => Promise<any>> =
  T extends (...args: any) => Promise<infer R> ? R : never;

// ==================== 联合类型工具 ====================

// UnionToIntersection - 将联合类型转换为交叉类型
type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

// 示例：{ a: number } | { b: string } -> { a: number } & { b: string }
type Intersection = UnionToIntersection<{ a: number } | { b: string }>;
// 结果: { a: number } & { b: string }

// ExclusiveUnion - 互斥联合类型，确保只有一个属性存在
type ExclusiveUnion<T extends object> = {
  [K in keyof T]: { [P in K]: T[P] } & Partial<Record<Exclude<keyof T, K>, never>>[K]
}[keyof T];

// 示例使用
type Shape =
  | { type: 'circle'; radius: number }
  | { type: 'square'; side: number };

type ExclusiveShape = ExclusiveUnion<{
  circle: { radius: number };
  square: { side: number };
}>;

// ==================== 实际项目工具类型 ====================

// API 错误类型
type ApiError<E = Error> = {
  code: number;
  message: string;
  error?: E;
};

// API 结果类型
type ApiResult<T, E = Error> = Promise<ApiError<E> & { data?: T }>;

// 响应式状态类型
type AsyncState<T, E = Error> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: E };

// 表单状态类型
type FormState<T> = {
  values: Partial<T>;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValidating: boolean;
};

// 分页参数类型
type PaginationParams = {
  page: number;
  pageSize: number;
  total?: number;
};

// 带分页的响应类型
type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};
```

---

## 四、装饰器实践

装饰器是 TypeScript 实验性功能之一，它提供了一种修改类、属性、方法和参数行为的强大方式。装饰器在 Angular、NestJS 等框架中有广泛应用，是构建元编程能力的基础。本章将详细讲解装饰器的使用方法和实战技巧。

### 4.1 装饰器基础概念

TypeScript 支持五种装饰器：类装饰器、方法装饰器、访问器装饰器、属性装饰器和参数装饰器。装饰器本身是一个函数，它接受特定参数并返回 void 或一个新函数来替换被装饰的目标。

```typescript
// 装饰器是实验性功能，需要在 tsconfig.json 中启用：
// {
//   "compilerOptions": {
//     "experimentalDecorators": true,
//     "emitDecoratorMetadata": true
//   }
// }

// 装饰器执行时机
// 装饰器在运行时作为函数被调用
// 类装饰器在类定义时（不是实例化时）执行
// 装饰器从内到外执行，靠近声明的先执行

// 装饰器签名
// 类装饰器: (constructor: Function) => void | Function
// 方法装饰器: (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => PropertyDescriptor | void
// 属性装饰器: (target: Object, propertyKey: string | symbol) => void
// 参数装饰器: (target: Object, propertyKey: string | symbol, parameterIndex: number) => void
```

### 4.2 类装饰器

类装饰器用于修改类的行为，可以替换类构造函数或添加原型方法。

```typescript
// 基础类装饰器
function sealed(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}

@sealed
class Person {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}

// 类装饰器工厂 - 带参数的装饰器
function logging(prefix: string) {
  return function <T extends { new (...args: any[]): {} }>(
    constructor: T
  ) {
    return class extends constructor {
      createdAt = new Date();

      log(message: string) {
        console.log(`[${prefix}] ${new Date().toISOString()}: ${message}`);
      }
    };
  };
}

@logging('USER')
class User {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}

const user = new User('张三');
// user.log('用户已创建'); // 可以调用添加的方法

// 单例模式装饰器
function singleton<T extends { new (...args: any[]): {} }>(constructor: T) {
  let instance: T | null = null;

  return function (...args: any[]) {
    if (!instance) {
      instance = new constructor(...args);
    }
    return instance;
  } as unknown as T & { getInstance: () => T };
}

@singleton
class Database {
  connectionString: string;

  constructor() {
    this.connectionString = 'mongodb://localhost:27017';
  }

  query(sql: string) {
    console.log(`执行 SQL: ${sql}`);
  }
}

// 混合模式 - 添加静态属性
function withVersion <T extends { new (...args: any[]): {} }>(constructor: T) {
  return class extends constructor {
    static version = '1.0.0';
    static createdAt = new Date();
  };
}

// 装饰器组合
function first() {
  console.log('first(): evaluated');
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    console.log('first(): called');
  };
}

function second() {
  console.log('second(): evaluated');
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    console.log('second(): called');
  };
}

class ExampleClass {
  @first()
  @second()
  method() {}
}
// 输出顺序:
// first(): evaluated
// second(): evaluated
// second(): called
// first(): called
```

### 4.3 方法装饰器

方法装饰器可以修改方法的行为，包括改变返回值、修改描述符、或添加日志和验证逻辑。

```typescript
// 方法装饰器 - 计算方法执行时间
function measure() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const start = performance.now();
      const result = originalMethod.apply(this, args);
      const end = performance.now();
      console.log(`${propertyKey} 执行时间: ${end - start}ms`);
      return result;
    };

    return descriptor;
  };
}

// 方法装饰器 - 防抖
function debounce(wait: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        originalMethod.apply(this, args);
      }, wait);
    };

    return descriptor;
  };
}

// 方法装饰器 - 重试机制
function retry(options: { maxAttempts: number; delay: number }) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      let lastError: Error;

      for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error as Error;
          console.log(`${propertyKey} 第 ${attempt} 次尝试失败`);

          if (attempt < options.maxAttempts) {
            await new Promise(resolve =>
              setTimeout(resolve, options.delay)
            );
          }
        }
      }

      throw lastError;
    };

    return descriptor;
  };
}

// 方法装饰器 - 缓存结果
function cached() {
  const cache = new Map<string, any>();

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const key = `${propertyKey}:${JSON.stringify(args)}`;

      if (cache.has(key)) {
        console.log(`缓存命中: ${propertyKey}`);
        return cache.get(key);
      }

      const result = originalMethod.apply(this, args);
      cache.set(key, result);
      return result;
    };

    return descriptor;
  };
}

class ApiService {
  @measure()
  fetchData(id: string): Promise<any> {
    return fetch(`/api/data/${id}`).then(r => r.json());
  }

  @debounce(300)
  search(keyword: string): void {
    console.log(`搜索: ${keyword}`);
  }

  @retry({ maxAttempts: 3, delay: 1000 })
  async fetchWithRetry(url: string): Promise<any> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return response.json();
  }

  @cached()
  getExpensiveResult(param: string): number {
    console.log('计算中...');
    return param.length * 100;
  }
}
```

### 4.4 属性装饰器

属性装饰器用于修改或增强类属性的行为，常用于依赖注入和元数据标记。

```typescript
// 属性装饰器 - 简单日志
function log(target: any, propertyKey: string): void {
  // 获取属性的描述符
  const descriptor = Object.getOwnPropertyDescriptor(
    target,
    propertyKey
  ) || { value: undefined, writable: true, enumerable: true, configurable: true };

  if (descriptor.value !== undefined) {
    // 如果是普通属性
    const original = descriptor.value;
    descriptor.value = function (...args: any[]) {
      console.log(`${propertyKey} 被调用，参数:`, args);
      return original.apply(this, args);
    };
  }

  Object.defineProperty(target, propertyKey, descriptor);
}

// 属性装饰器 - 默认值
function defaultValue(value: any) {
  return function (target: any, propertyKey: string) {
    target[propertyKey] = value;
  };
}

// 属性装饰器 - 只读标记
function readonly(target: any, propertyKey: string): void {
  Object.defineProperty(target, propertyKey, {
    writable: false,
    enumerable: true,
    configurable: true
  });
}

// 属性装饰器 - 类型检查
function validateType(expectedType: string) {
  return function (target: any, propertyKey: string) {
    const descriptor = Object.getOwnPropertyDescriptor(
      target,
      propertyKey
    );

    if (descriptor && descriptor.set) {
      const originalSetter = descriptor.set;

      descriptor.set = function (value: any) {
        if (typeof value !== expectedType) {
          throw new TypeError(
            `${propertyKey} 期望类型 ${expectedType}，实际类型 ${typeof value}`
          );
        }
        return originalSetter.call(this, value);
      };

      Object.defineProperty(target, propertyKey, descriptor);
    }
  };
}

// 属性装饰器 - 依赖注入标记
const INJECTED_KEY = Symbol('injected');

function injectable() {
  return function (target: any, propertyKey: string) {
    const dependencies: string[] =
      Reflect.getMetadata(INJECTED_KEY, target) || [];
    dependencies.push(propertyKey);
    Reflect.defineMetadata(INJECTED_KEY, dependencies, target);
  };
}

function inject(token: string) {
  return function (target: any, propertyKey: string) {
    Reflect.defineMetadata('injectToken', token, target, propertyKey);
  };
}

class Container {
  private services = new Map<string, any>();

  register(token: string, service: any): void {
    this.services.set(token, service);
  }

  resolve<T>(target: new (...args: any[]) => T): T {
    const dependencies: string[] =
      Reflect.getOwnMetadata(INJECTED_KEY, target.prototype) || [];

    const args = dependencies.map(dep => {
      const token = Reflect.getOwnMetadata(
        'injectToken',
        target.prototype,
        dep
      );
      return this.services.get(token);
    });

    return new target(...args);
  }
}

// 使用示例
class UserService {
  @injectable()
  @inject('USER_REPOSITORY')
  userRepository: any;

  @log
  getUser(id: string) {
    return { id, name: '张三' };
  }

  @validateType('string')
  setName(name: string) {
    this.name = name;
  }

  @defaultValue('匿名用户')
  name: string = '匿名用户';
}
```

### 4.5 实战：装饰器实现控制反转容器

依赖注入是现代框架的核心模式，装饰器提供了一种优雅的依赖注入实现方式。以下是一个完整的依赖注入容器实现：

```typescript
// ==================== 依赖注入容器实现 ====================

// 标记符号
const INJECT_METADATA_KEY = Symbol('inject');
const INJECTABLE_METADATA_KEY = Symbol('injectable');

// 注入标记
function inject(token: string) {
  return function (
    target: undefined,
    context: ClassMemberDecoratorContext
  ) {
    if (context.kind === 'class') {
      Reflect.defineMetadata(INJECT_METADATA_KEY, token, target);
    }
    return function (
      target: any,
      propertyKey: string | symbol,
      _parameterIndex: number
    ) {
      Reflect.defineMetadata(INJECT_METADATA_KEY, token, target, propertyKey);
    };
  };
}

// 可注入标记
function injectable(target: any) {
  Reflect.defineMetadata(INJECTABLE_METADATA_KEY, true, target);
}

// 依赖项接口
interface Dependency {
  token: string;
  instance?: any;
  factory?: () => any;
  scope?: 'singleton' | 'transient';
}

// 容器类
class Container {
  private dependencies = new Map<string, Dependency>();
  private singletons = new Map<string, any>();

  // 注册依赖
  register(options: {
    token: string;
    useClass?: new (...args: any[]) => any;
    useValue?: any;
    useFactory?: () => any;
    scope?: 'singleton' | 'transient';
  }) {
    this.dependencies.set(options.token, {
      token: options.token,
      scope: options.scope || 'transient',
      factory: options.useFactory || (() => new options.useClass!()),
    });
  }

  // 解析依赖
  resolve<T>(token: string): T {
    const dependency = this.dependencies.get(token);

    if (!dependency) {
      throw new Error(`依赖 ${token} 未注册`);
    }

    if (dependency.scope === 'singleton') {
      if (!this.singletons.has(token)) {
        this.singletons.set(token, dependency.factory!());
      }
      return this.singletons.get(token);
    }

    return dependency.factory!();
  }

  // 检查依赖是否已注册
  has(token: string): boolean {
    return this.dependencies.has(token);
  }
}

// 全局容器实例
const globalContainer = new Container();

// 服务定位器
class ServiceLocator {
  private static container = globalContainer;

  static getContainer(): Container {
    return this.container;
  }

  static setContainer(container: Container) {
    this.container = container;
  }
}

// ==================== 使用装饰器 ====================

// 定义服务接口
interface ILogger {
  log(message: string): void;
  error(message: string, error?: Error): void;
}

interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: Omit<User, 'id'>): Promise<User>;
}

// 实现服务
@injectable()
class Logger implements ILogger {
  log(message: string): void {
    console.log(`[${new Date().toISOString()}] INFO: ${message}`);
  }

  error(message: string, error?: Error): void {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`, error);
  }
}

@injectable()
class UserRepository implements IUserRepository {
  private users = new Map<string, User>();

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async create(userData: Omit<User, 'id'>): Promise<User> {
    const id = crypto.randomUUID();
    const user = { ...userData, id };
    this.users.set(id, user);
    return user;
  }
}

// 用户服务
@injectable()
class UserService {
  constructor(
    @inject('ILogger') private logger: ILogger,
    @inject('IUserRepository') private userRepository: IUserRepository
  ) {}

  async getUser(id: string): Promise<User | null> {
    this.logger.log(`获取用户: ${id}`);
    return this.userRepository.findById(id);
  }

  async createUser(data: Omit<User, 'id'>): Promise<User> {
    this.logger.log(`创建用户: ${data.email}`);

    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new Error('用户已存在');
    }

    return this.userRepository.create(data);
  }
}

// ==================== 自动注册和解析 ====================

// 自动扫描和注册服务
function scanAndRegister(
  container: Container,
  classes: Array<new (...args: any[]) => any>
) {
  for (const Class of classes) {
    const token = Class.name;
    container.register({
      token,
      useClass: Class,
      scope: 'singleton',
    });
  }
}

// 手动绑定接口到实现
function bindInterface(
  container: Container,
  interfaceToken: string,
  implementationToken: string
) {
  container.register({
    token: interfaceToken,
    useFactory: () => container.resolve(implementationToken),
    scope: 'singleton',
  });
}

// 解析带依赖的类
function resolve<T>(container: Container, Class: new (...args: any[]) => T): T {
  // 获取构造函数参数的类型信息
  const paramTypes = Reflect.getMetadata(
    'design:paramtypes',
    Class
  ) || [];

  // 解析每个参数
  const deps = paramTypes.map((paramType: any) => {
    // 尝试从注入标记获取 token
    const injectToken = Reflect.getOwnMetadata(
      INJECT_METADATA_KEY,
      Class.prototype
    );

    if (injectToken) {
      return container.resolve(injectToken);
    }

    // 使用类名作为 token
    return container.resolve(paramType.name);
  });

  return new Class(...deps);
}

// ==================== 使用示例 ====================

// 注册所有服务
const container = ServiceLocator.getContainer();
ServiceLocator.setContainer(container);

// 手动注册（也可以使用装饰器自动注册）
container.register({
  token: 'ILogger',
  useClass: Logger,
  scope: 'singleton',
});

container.register({
  token: 'IUserRepository',
  useClass: UserRepository,
  scope: 'singleton',
});

container.register({
  token: 'UserService',
  useClass: UserService,
  scope: 'singleton',
});

// 解析服务
const userService = container.resolve<UserService>('UserService');

// 使用服务
userService.getUser('123').then(user => {
  console.log('用户:', user);
});
```

---

## 五、声明文件与类型管理

声明文件是 TypeScript 类型系统的重要组成部分，它们为 JavaScript 库和模块提供类型信息，使 JavaScript 代码也能享受 TypeScript 的类型检查和智能提示。本章将深入讲解声明文件的创建和管理。

### 5.1 声明文件基础

声明文件使用 `.d.ts` 扩展名，它们包含类型声明但不包含任何运行时代码。TypeScript 编译器会自动读取这些文件来提供类型检查。

```typescript
// 示例：简单的数学库声明文件 math.d.ts

// 声明模块
declare module 'my-math-lib' {
  // 导出函数
  export function add(a: number, b: number): number;
  export function subtract(a: number, b: number): number;
  export function multiply(a: number, b: number): number;
  export function divide(a: number, b: number): number;

  // 导出接口
  export interface MathResult {
    value: number;
    precision: number;
    formatted: string;
  }

  // 导出枚举
  export enum RoundingMode {
    FLOOR = 'floor',
    CEIL = 'ceil',
    ROUND = 'round',
    TRUNCATE = 'truncate',
  }

  // 导出类
  export class MathHelper {
    constructor(precision?: number);
    round(value: number, mode?: RoundingMode): number;
    format(value: number): string;
    static readonly PI: number;
    static readonly E: number;
  }

  // 导出类型别名
  export type NumberArray = number[] | ArrayLike<number>;

  // 导出常量
  export const VERSION: string;
}
```

### 5.2 模块声明

模块声明用于为没有类型定义的模块添加类型信息。这在迁移 JavaScript 项目或使用第三方库时非常有用。

```typescript
// ==================== 全局模块声明 ====================

// 在你的项目中全局声明（通常在 src/types/global.d.ts）

// 声明全局变量
declare const API_BASE_URL: string;
declare const APP_VERSION: string;

// 声明全局函数
declare function formatDate(date: Date, format: string): string;
declare function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void;

// 声明全局类型
declare type Callback<T = any> = (error: Error | null, result?: T) => void;
declare type AsyncCallback<T = any> = (result: T) => void;

// ==================== 命名空间声明 ====================

// 声明一个命名空间（现在较少使用，但在某些场景仍有价值）
declare namespace MyNamespace {
  const version: string;
  function helper(): void;

  namespace Nested {
    const value: number;
  }

  interface Options {
    timeout?: number;
    retries?: number;
  }
}

// 使用命名空间
// MyNamespace.helper();
// const v = MyNamespace.Nested.value;

// ==================== 模块扩展声明 ====================

// 为现有模块添加新属性
declare module 'express' {
  interface Application {
    locals: {
      user?: any;
      title?: string;
      [key: string]: any;
    };
  }
}

// 为内置对象添加方法
interface Array<T> {
  groupBy<K extends keyof T>(key: K): Record<T[K], T[]>;
  groupBy<T>(callback: (item: T) => string): Record<string, T[]>;
  first(): T | undefined;
  last(): T | undefined;
  distinct(): T[];
}

interface String {
  capitalize(): string;
  camelCase(): string;
  snakeCase(): string;
  kebabCase(): string;
}

// ==================== 第三方库类型扩展 ====================

// 为 lodash 添加类型
declare module 'lodash' {
  interface LoDashStatic {
    chunk<T>(array: T[], size?: number): T[][];
    deepClone<T>(obj: T): T;
    groupBy<T>(
      collection: T[],
      iteratee?: ((item: T) => any) | keyof T
    ): Dictionary<T[]>;
  }
}

// 为 axios 添加自定义配置
declare module 'axios' {
  interface AxiosRequestConfig {
    retry?: number;
    retryDelay?: number;
    onUploadProgress?: (progress: number) => void;
    cache?: boolean;
  }
}
```

### 5.3 全局声明与环境声明

全局声明用于为没有模块系统的脚本提供类型支持，常用于浏览器环境和传统的脚本文件。

```typescript
// ==================== 全局声明文件 src/types/global.d.ts ====================

// 环境变量声明
declare const process: {
  env: {
    NODE_ENV: 'development' | 'production' | 'test';
    [key: string]: string | undefined;
  };
  cwd: () => string;
  argv: string[];
};

// 浏览器环境声明
declare const window: Window & typeof globalThis;
declare const document: Document;
declare const navigator: Navigator;

// 节点环境声明
declare const __dirname: string;
declare const __filename: string;
declare const require: NodeRequire;

// ==================== CSS 模块类型声明 ====================

// style.d.ts 或 css.d.ts
declare module '*.css' {
  const classes: { [key: string]: string };
  export default classes;
  export = classes;
}

// ==================== 图片和资源类型声明 ====================

declare module '*.svg' {
  const content: string;
  export default content;
  export { content as ReactComponent };
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.json' {
  const value: Record<string, any>;
  export default value;
}

// ==================== Vue/Svelte 等框架类型声明 ====================

// vite-env.d.ts (Vite 项目)
// /// <reference types="vite/client" />

// Svelte 组件声明
declare module '*.svelte' {
  import type { ComponentType, SvelteComponent } from 'svelte';
  const component: ComponentType<SvelteComponent>;
  export default component;
}
```

### 5.4 实战：创建完整的 SDK 类型定义

以下是一个完整的 SDK 类型定义示例，展示如何为 API SDK 创建专业的类型声明：

```typescript
// ==================== SDK 类型定义文件 ====================

// sdk-types.d.ts

// ==================== 基础类型 ====================

/** API 基础 URL */
declare const API_BASE_URL: string;

/** API 版本 */
declare const API_VERSION: string;

/** 应用密钥 */
declare const APP_SECRET: string;

// ==================== 通用响应类型 ====================

/** API 响应状态码 */
enum ApiCode {
  SUCCESS = 1000,
  BAD_REQUEST = 4000,
  UNAUTHORIZED = 4001,
  FORBIDDEN = 4003,
  NOT_FOUND = 4004,
  INTERNAL_ERROR = 5000,
  NETWORK_ERROR = 5001,
}

/** API 错误 */
interface ApiError {
  code: ApiCode;
  message: string;
  details?: Record<string, any>;
  requestId?: string;
  timestamp: number;
}

/** 分页参数 */
interface PaginationParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

/** 分页响应 */
interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

/** API 响应封装 */
interface ApiResponse<T = any> {
  code: ApiCode;
  message: string;
  data: T;
  requestId: string;
  timestamp: number;
}

// ==================== 用户相关类型 ====================

/** 用户角色 */
type UserRole = 'admin' | 'editor' | 'viewer';

/** 用户状态 */
type UserStatus = 'active' | 'inactive' | 'suspended';

/** 用户信息 */
interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  metadata?: Record<string, any>;
}

/** 创建用户请求 */
interface CreateUserRequest {
  username: string;
  email: string;
  phone?: string;
  password: string;
  role?: UserRole;
}

/** 更新用户请求 */
interface UpdateUserRequest {
  email?: string;
  phone?: string;
  avatar?: string;
  role?: UserRole;
  status?: UserStatus;
}

// ==================== 认证相关类型 ====================

/** 登录请求 */
interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/** 登录响应 */
interface LoginResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

/** 刷新令牌请求 */
interface RefreshTokenRequest {
  refreshToken: string;
}

/** 刷新令牌响应 */
interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
}

// ==================== 资源相关类型 ====================

/** 资源类型 */
type ResourceType = 'image' | 'video' | 'audio' | 'document' | 'archive';

/** 资源状态 */
type ResourceStatus = 'pending' | 'processing' | 'ready' | 'failed';

/** 资源信息 */
interface Resource {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  type: ResourceType;
  status: ResourceStatus;
  url: string;
  thumbnailUrl?: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    pages?: number;
    [key: string]: any;
  };
  uploaderId: string;
  createdAt: string;
  updatedAt: string;
}

/** 上传资源响应 */
interface UploadResourceResponse {
  resource: Resource;
  uploadUrl?: string;
}

// ==================== SDK 配置 ====================

/** SDK 配置项 */
interface SdkConfig {
  baseUrl: string;
  apiVersion?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  debug?: boolean;
  storage?: 'localStorage' | 'sessionStorage' | 'memory';
}

// ==================== SDK 类声明 ====================

/**
 * 用户 SDK
 */
declare class UserSdk {
  constructor(config: SdkConfig);

  /** 获取当前用户 */
  getCurrentUser(): Promise<ApiResponse<User>>;

  /** 根据 ID 获取用户 */
  getUserById(id: string): Promise<ApiResponse<User>>;

  /** 获取用户列表 */
  listUsers(params: PaginationParams & { role?: UserRole; status?: UserStatus }): Promise<ApiResponse<PaginatedResult<User>>>;

  /** 创建用户 */
  createUser(data: CreateUserRequest): Promise<ApiResponse<User>>;

  /** 更新用户 */
  updateUser(id: string, data: UpdateUserRequest): Promise<ApiResponse<User>>;

  /** 删除用户 */
  deleteUser(id: string): Promise<ApiResponse<void>>;

  /** 更新用户角色 */
  updateUserRole(id: string, role: UserRole): Promise<ApiResponse<User>>;

  /** 禁用/启用用户 */
  setUserStatus(id: string, status: UserStatus): Promise<ApiResponse<User>>;
}

/**
 * 认证 SDK
 */
declare class AuthSdk {
  constructor(config: SdkConfig);

  /** 登录 */
  login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>>;

  /** 登出 */
  logout(): Promise<ApiResponse<void>>;

  /** 刷新令牌 */
  refreshToken(request: RefreshTokenRequest): Promise<ApiResponse<RefreshTokenResponse>>;

  /** 验证令牌 */
  validateToken(token: string): Promise<ApiResponse<{ valid: boolean; user?: User }>>;

  /** 请求密码重置 */
  requestPasswordReset(email: string): Promise<ApiResponse<void>>;

  /** 重置密码 */
  resetPassword(token: string, newPassword: string): Promise<ApiResponse<void>>;
}

/**
 * 资源 SDK
 */
declare class ResourceSdk {
  constructor(config: SdkConfig);

  /** 获取资源信息 */
  getResource(id: string): Promise<ApiResponse<Resource>>;

  /** 获取资源列表 */
  listResources(params: PaginationParams & { type?: ResourceType; status?: ResourceStatus }): Promise<ApiResponse<PaginatedResult<Resource>>>;

  /** 上传资源 */
  uploadResource(file: File | Blob, metadata?: Record<string, any>): Promise<ApiResponse<Resource>>;

  /** 删除资源 */
  deleteResource(id: string): Promise<ApiResponse<void>>;

  /** 批量删除资源 */
  deleteResources(ids: string[]): Promise<ApiResponse<{ deleted: number }>>;

  /** 获取上传 URL */
  getUploadUrl(filename: string, contentType: string): Promise<ApiResponse<{ uploadUrl: string; resourceId: string }>>;

  /** 确认上传完成 */
  confirmUpload(resourceId: string): Promise<ApiResponse<Resource>>;
}

/**
 * SDK 主类
 */
declare class MainSdk {
  constructor(config: SdkConfig);

  readonly config: SdkConfig;
  readonly users: UserSdk;
  readonly auth: AuthSdk;
  readonly resources: ResourceSdk;

  /** 初始化 SDK */
  initialize(): Promise<void>;

  /** 设置认证令牌 */
  setAuthToken(token: string): void;

  /** 获取认证令牌 */
  getAuthToken(): string | null;

  /** 清除认证信息 */
  clearAuth(): void;

  /** 设置调试模式 */
  setDebug(enabled: boolean): void;

  /** 请求拦截器 */
  onRequest(callback: (config: RequestInit) => RequestInit): void;

  /** 响应拦截器 */
  onResponse<T>(callback: (response: ApiResponse<T>) => ApiResponse<T>): void;
}

// ==================== 默认导出 ====================

declare namespace MainSdk {
  export { ApiCode, ApiError, PaginationParams, PaginatedResult, ApiResponse };
  export type { UserRole, UserStatus, User, CreateUserRequest, UpdateUserRequest };
  export type { LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse };
  export type { ResourceType, ResourceStatus, Resource, UploadResourceResponse };
  export type { SdkConfig };
}

export = MainSdk;
```

---

## 六、高级类型工具

TypeScript 提供了一系列内置的高级类型工具，它们是构建类型安全代码的利器。掌握这些工具类型能够显著提升开发效率和代码质量。

### 6.1 内置工具类型详解

TypeScript 内置的工具类型覆盖了大部分常用场景，理解它们的实现原理能够更好地使用它们。

```typescript
// ==================== 构造类型工具 ====================

// Partial<T> - 将类型 T 的所有属性设为可选
type Partial<T> = {
  [P in keyof T]?: T[P];
};

// Required<T> - 将类型 T 的所有属性设为必需
type Required<T> = {
  [P in keyof T]-?: T[P];
};

// Readonly<T> - 将类型 T 的所有属性设为只读
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

// Pick<T, K> - 从 T 中选取指定的属性 K
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// Omit<T, K> - 从 T 中移除指定的属性 K
type Omit<T, K extends keyof T> = {
  [P in Exclude<keyof T, K>]: T[P];
};

// ==================== 联合类型工具 ====================

// Exclude<T, U> - 从 T 中排除可分配给 U 的类型
type Exclude<T, U> = T extends U ? never : T;

// Extract<T, U> - 从 T 中提取可分配给 U 的类型
type Extract<T, U> = T extends U ? T : never;

// NonNullable<T> - 从 T 中排除 null 和 undefined
type NonNullable<T> = T extends null | undefined ? never : T;

// ==================== 函数工具 ====================

// Parameters<T> - 提取函数类型 T 的参数类型为元组
type Parameters<T extends (...args: any) => any> =
  T extends (...args: infer P) => any ? P : never;

// ConstructorParameters<T> - 提取构造函数类型的参数
type ConstructorParameters<T extends new (...args: any) => any> =
  T extends new (...args: infer P) => any ? P : never;

// ReturnType<T> - 提取函数类型 T 的返回类型
type ReturnType<T extends (...args: any) => any> =
  T extends (...args: any) => infer R ? R : any;

// InstanceType<T> - 提取构造函数类型的实例类型
type InstanceType<T extends new (...args: any) => any> =
  T extends new (...args: any) => infer R ? R : any;

// ==================== 字符串工具 ====================

// Uppercase<S> - 将字符串 S 转为大写
type Uppercase<S extends string> = intrinsic;

// Lowercase<S> - 将字符串 S 转为小写
type Lowercase<S extends string> = intrinsic;

// Capitalize<S> - 将字符串 S 的首字母大写
type Capitalize<S extends string> = intrinsic;

// Uncapitalize<S> - 将字符串 S 的首字母小写
type Uncapitalize<S extends string> = intrinsic;

// ==================== 使用示例 ====================

interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  role: 'admin' | 'user';
}

// Partial - 用于更新用户时只需要部分字段
type UpdateUserDto = Partial<User>;
// 等同于:
// {
//   id?: string;
//   name?: string;
//   email?: string;
//   age?: number;
//   role?: 'admin' | 'user';
// }

// Required - 用于创建用户时所有字段都是必需的
type CreateUserDto = Required<User>;

// Pick - 只选择需要的字段
type UserBasicInfo = Pick<User, 'id' | 'name' | 'email'>;
// 等同于:
// {
//   id: string;
//   name: string;
//   email: string;
// }

// Omit - 排除不需要的字段
type UserCreateInput = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
// 等同于:
// {
//   name: string;
//   email: string;
//   age: number;
//   role: 'admin' | 'user';
// }

// Extract - 从联合类型中提取特定类型
type AdminOrUser = Extract<User['role'], 'admin' | 'superadmin'>; // never
type Admin = Extract<User['role'], 'admin'>; // 'admin'

// NonNullable - 移除可选属性中的 null/undefined
type NonOptionalName = NonNullable<User['name']>; // string
type NullableName = User['name'] | null | undefined; // string | null | undefined
```

### 6.2 自定义工具类型

在实际项目中，内置工具类型往往不够用，需要根据业务需求创建自定义的工具类型。

```typescript
// ==================== 深度工具类型 ====================

// DeepPartial - 深度 Partial
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// DeepRequired - 深度 Required
type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

// DeepReadonly - 深度 Readonly
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// DeepMutable - 深度 Mutable（移除 readonly）
type DeepMutable<T> = {
  -readonly [P in keyof T]: T[P] extends object ? DeepMutable<T[P]> : T[P];
};

// ==================== 函数增强工具 ====================

// AsyncFunction - 异步函数类型
type AsyncFunction<T = any, Args extends any[] = any[]> = (
  ...args: Args
) => Promise<T>;

// BoundFunction - 绑定函数类型
type BoundFunction<T extends (...args: any) => any> = (
  ...args: Parameters<T>
) => ReturnType<T>;

// CurriedFunction - 柯里化函数类型
type Curry<
  F extends (...args: any) => any,
  P extends any[] = Parameters<F>,
  R = ReturnType<F>
> = P extends [infer A, ...infer B]
  ? (arg: A) => Curry<(...args: B) => R, B, R>
  : R;

// ==================== 类型转换工具 ====================

// JsonSchema - JSON Schema 类型
type JsonSchema = {
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  enum?: any[];
  description?: string;
  default?: any;
};

// ToJsonSchema - 将 TypeScript 类型转换为 JSON Schema
type ToJsonSchema<T> = {
  [K in keyof T]: {
    type: T[K] extends string
      ? 'string'
      : T[K] extends number
      ? 'number'
      : T[K] extends boolean
      ? 'boolean'
      : T[K] extends object
      ? 'object'
      : T[K] extends any[]
      ? 'array'
      : 'null';
  };
};

// ==================== 实际项目工具类型 ====================

// 表单值类型
type FormValues<T> = DeepPartial<T>;

// 表单错误类型
type FormErrors<T> = {
  [P in keyof T]?: string;
};

// 表单触摸状态
type FormTouched<T> = {
  [P in keyof T]?: boolean;
};

// React 受控组件值类型
type ControlledValue<T> = {
  value: T;
  onChange: (value: T) => void;
};

// React 非受控组件默认值类型
type UncontrolledValue<T> = {
  defaultValue: T;
  onChange?: (value: T) => void;
};

// API 响应数据提取
type ApiData<T> = T extends { data: infer U } ? U : never;

// Promise 结果类型
type PromiseResult<T> = T extends Promise<infer U> ? U : never;

// ==================== 条件类型高级应用 ====================

// If<C, T, F> - 条件类型
type If<C extends boolean, T, F> = C extends true ? T : F;

// IsAny<T> - 判断是否为 any 类型
type IsAny<T> = 0 extends 1 & T ? true : false;

// IsNever<T> - 判断是否为 never 类型
type IsNever<T> = [T] extends [never] ? true : false;

// IsUnknown<T> - 判断是否为 unknown 类型
type IsUnknown<T> = IsAny<T> extends true
  ? false
  : T extends unknown
  ? [keyof T] extends [never]
    ? true
    : false
  : false;
```

### 6.3 实战：表单类型系统

以下是一个完整的表单类型系统实现，展示了如何结合泛型、条件类型和工具类型构建类型安全的表单：

```typescript
// ==================== 表单基础类型 ====================

/** 表单字段配置 */
interface FieldConfig<T = any> {
  name: keyof T;
  label: string;
  placeholder?: string;
  defaultValue?: any;
  disabled?: boolean;
  readonly?: boolean;
  rules?: ValidationRule[];
}

/** 验证规则 */
interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  validator?: (value: any) => boolean | string;
  message?: string;
}

/** 表单状态 */
interface FormState<T = any> {
  values: Partial<T>;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  dirty: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValidating: boolean;
  isValid: boolean;
  isDirty: boolean;
}

/** 表单提交结果 */
interface FormSubmitResult<T = any> {
  success: boolean;
  data?: T;
  errors?: Partial<Record<keyof T, string>>;
}

// ==================== 表单类型工具 ====================

/** 从字段配置提取字段名 */
type FieldNames<T> = T extends FieldConfig<infer U>[]
  ? U extends object
    ? keyof U
    : never
  : never;

/** 从验证规则提取错误类型 */
type ValidationErrors<T, Rules extends FieldConfig<T>[]> = {
  [K in FieldNames<Rules>]: string | undefined;
};

/** 表单配置类型 */
type FormSchema<T = any> = {
  fields: FieldConfig<T>[];
  onSubmit: (values: T) => Promise<FormSubmitResult<T>>;
  onReset?: () => void;
  initialValues?: Partial<T>;
};

// ==================== 动态表单类型 ====================

/** 动态字段类型 */
interface DynamicField<T = any> {
  id: string;
  name: keyof T & string;
  field: FieldConfig<T>;
}

/** 动态表单项 */
interface DynamicFormItem<T = any> {
  id: string;
  values: T;
  errors?: Partial<Record<keyof T, string>>;
  isNew?: boolean;
  isDeleted?: boolean;
}

/** 动态表单数据 */
interface DynamicFormData<T = any> {
  items: DynamicFormItem<T>[];
  addedItems: T[];
  removedItems: string[];
  modifiedItems: Map<string, Partial<T>>;
}

// ==================== 表单 Hook 返回类型 ====================

/** useForm Hook 返回类型 */
interface UseFormReturn<T = any> {
  /** 表单状态 */
  state: FormState<T>;

  /** 注册字段 */
  register: (config: FieldConfig<T>) => void;

  /** 设置字段值 */
  setValue: (name: keyof T, value: T[keyof T]) => void;

  /** 获取字段值 */
  getValue: (name: keyof T) => T[keyof T] | undefined;

  /** 设置字段错误 */
  setError: (name: keyof T, error: string) => void;

  /** 清除字段错误 */
  clearError: (name: keyof T) => void;

  /** 设置字段为已触摸 */
  setTouched: (name: keyof T) => void;

  /** 重置表单 */
  reset: (values?: Partial<T>) => void;

  /** 提交表单 */
  handleSubmit: () => Promise<FormSubmitResult<T>>;

  /** 验证表单 */
  validate: () => Promise<boolean>;

  /** 验证单个字段 */
  validateField: (name: keyof T) => Promise<boolean>;
}

// ==================== 使用示例 ====================

interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface UserFormValues {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  age: number;
  role: 'admin' | 'editor' | 'viewer';
  department?: {
    id: string;
    name: string;
  };
  skills: string[];
}

// 登录表单配置
const loginFormSchema: FormSchema<LoginFormValues> = {
  fields: [
    {
      name: 'email',
      label: '邮箱',
      placeholder: '请输入邮箱',
      rules: [
        { required: true, message: '邮箱不能为空' },
        {
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: '邮箱格式不正确',
        },
      ],
    },
    {
      name: 'password',
      label: '密码',
      placeholder: '请输入密码',
      rules: [
        { required: true, message: '密码不能为空' },
        { minLength: 6, message: '密码至少6位' },
      ],
    },
    {
      name: 'rememberMe',
      label: '记住我',
    },
  ],
  onSubmit: async (values) => {
    const response = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify(values),
    });

    if (response.ok) {
      return { success: true, data: values };
    }

    return { success: false, errors: { email: '登录失败' } };
  },
};

// 用户表单配置
const userFormSchema: FormSchema<UserFormValues> = {
  fields: [
    {
      name: 'name',
      label: '姓名',
      rules: [{ required: true, message: '姓名不能为空' }],
    },
    {
      name: 'email',
      label: '邮箱',
      rules: [
        { required: true, message: '邮箱不能为空' },
        { type: 'email', message: '邮箱格式不正确' },
      ],
    },
    {
      name: 'phone',
      label: '手机号',
      rules: [
        {
          pattern: /^1[3-9]\d{9}$/,
          message: '手机号格式不正确',
        },
      ],
    },
    {
      name: 'age',
      label: '年龄',
      rules: [
        { required: true, message: '年龄不能为空' },
        { min: 0, max: 150, message: '年龄范围不正确' },
      ],
    },
    {
      name: 'role',
      label: '角色',
      rules: [{ required: true, message: '请选择角色' }],
    },
  ],
  initialValues: {
    role: 'viewer',
    skills: [],
  },
  onSubmit: async (values) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        return { success: true, data: values };
      }

      const error = await response.json();
      return { success: false, errors: error.fieldErrors };
    } catch (e) {
      return { success: false, errors: { _form: '提交失败' } };
    }
  },
};
```

---

## 七、类型守卫与类型 narrowing

类型守卫是 TypeScript 类型系统中至关重要的一部分，它允许在条件分支中缩小类型的范围，从而实现更精确的类型检查和更安全的类型操作。

### 7.1 typeof 类型守卫

typeof 是 JavaScript 原生的类型检查运算符，TypeScript 能够识别其返回的值并据此缩小类型范围。

```typescript
// 基础 typeof 类型守卫
function processValue(value: string | number | boolean) {
  if (typeof value === 'string') {
    // 在这个分支中，value 被缩小为 string
    console.log(value.toUpperCase());
    return value.trim();
  }

  if (typeof value === 'number') {
    // 在这个分支中，value 被缩小为 number
    console.log(value.toFixed(2));
    return Math.abs(value);
  }

  // 在这个分支中，value 是 boolean
  console.log(value ? '是' : '否');
  return value;
}

// typeof 与联合类型结合
type StringOrNumberArray = string[] | number[];

function processArray(arr: StringOrNumberArray) {
  if (typeof arr[0] === 'string') {
    // arr 被缩小为 string[]
    return arr.map(s => s.toUpperCase());
  } else {
    // arr 被缩小为 number[]
    return arr.map(n => n * 2);
  }
}

// typeof 与原始类型
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

// 使用自定义类型守卫
function capitalize(value: unknown) {
  if (isString(value)) {
    // 这里 value 的类型被收窄为 string
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
  throw new Error('值不是字符串');
}
```

### 7.2 instanceof 类型守卫

instanceof 运算符用于检查对象是否是某个类的实例，TypeScript 会根据 instanceof 的检查结果自动缩小类型范围。

```typescript
// 基础 instanceof 类型守卫
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

function makeSound(animal: Animal) {
  if (animal instanceof Dog) {
    // animal 被缩小为 Dog
    console.log(`${animal.name} (${animal.breed}) 汪汪叫`);
  } else if (animal instanceof Cat) {
    // animal 被缩小为 Cat
    console.log(`${animal.name} (${animal.color}) 喵喵叫`);
  } else {
    // animal 是 Animal
    console.log(`${animal.name} 发出声音`);
  }
}

// instanceof 与构造函数
function isDate(value: any): value is Date {
  return value instanceof Date;
}

function isError(value: any): value is Error {
  return value instanceof Error;
}

function parseValue(value: any): string {
  if (isDate(value)) {
    return value.toISOString();
  }

  if (isError(value)) {
    return value.message;
  }

  return String(value);
}

// instanceof 与接口
interface Flyable {
  fly(): void;
}

interface Swimmable {
  swim(): void;
}

class Duck implements Flyable, Swimmable {
  fly() {
    console.log('鸭子飞');
  }
  swim() {
    console.log('鸭子游泳');
  }
}

class Sparrow implements Flyable {
  fly() {
    console.log('麻雀飞');
  }
}

function makeItFly(creature: Flyable | Swimmable) {
  if (creature instanceof Duck) {
    // Duck 同时实现了 Flyable 和 Swimmable
    creature.fly();
    creature.swim();
  } else {
    // 是只实现了 Flyable 的动物
    creature.fly();
  }
}
```

### 7.3 in 操作符类型守卫

in 操作符用于检查对象是否包含某个属性，TypeScript 会据此缩小类型的范围。

```typescript
// 基础 in 类型守卫
interface Admin {
  kind: 'admin';
  permissions: string[];
  role: string;
}

interface User {
  kind: 'user';
  email: string;
  name: string;
}

function processPerson(person: Admin | User) {
  if ('permissions' in person) {
    // person 被缩小为 Admin
    console.log('管理员权限:', person.permissions);
    console.log('角色:', person.role);
  } else {
    // person 被缩小为 User
    console.log('用户邮箱:', person.email);
    console.log('用户名:', person.name);
  }
}

// in 与可选属性
interface Person {
  name: string;
  email?: string;
  phone?: string;
}

function contact(person: Person) {
  if ('email' in person) {
    console.log('邮件联系方式:', person.email);
  }

  if ('phone' in person) {
    console.log('电话联系方式:', person.phone);
  }
}

// 自定义 in 类型守卫
function hasPermissions(obj: any): obj is Admin {
  return 'permissions' in obj && typeof obj.permissions === 'object';
}

function hasEmail(obj: any): obj is { email: string } {
  return 'email' in obj && typeof obj.email === 'string';
}

// in 与复杂类型
interface Circle {
  kind: 'circle';
  radius: number;
}

interface Rectangle {
  kind: 'rectangle';
  width: number;
  height: number;
}

interface Triangle {
  kind: 'triangle';
  base: number;
  height: number;
}

type Shape = Circle | Rectangle | Triangle;

function getArea(shape: Shape): number {
  if ('radius' in shape && shape.kind === 'circle') {
    return Math.PI * shape.radius ** 2;
  }

  if ('width' in shape && 'height' in shape) {
    return shape.width * shape.height;
  }

  if ('base' in shape && 'height' in shape) {
    return (shape.base * shape.height) / 2;
  }

  throw new Error('未知形状');
}
```

### 7.4 自定义类型守卫与断言

除了语言内置的类型守卫外，还可以创建自定义的类型守卫函数和类型断言。

```typescript
// 自定义类型守卫函数
interface Cat {
  meow(): void;
}

interface Dog {
  bark(): void;
}

function isCat(animal: Cat | Dog): animal is Cat {
  return (animal as Cat).meow !== undefined;
}

function isDog(animal: Cat | Dog): animal is Dog {
  return (animal as Dog).bark !== undefined;
}

function makeAnimalSpeak(animal: Cat | Dog) {
  if (isCat(animal)) {
    animal.meow();
  } else {
    animal.bark();
  }
}

// 类型谓词 (Type Predicate) 语法
// function isType(value: any): value is Type
// 返回类型必须为 value is Type

// 数组元素类型守卫
function isStringArray(arr: any[]): arr is string[] {
  return arr.every(item => typeof item === 'string');
}

function processArray(items: any[]) {
  if (isStringArray(items)) {
    // items 是 string[]
    return items.map(s => s.toUpperCase());
  }
  return items;
}

// 类型断言函数
function assertIsString(value: any): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error(`Expected string, got ${typeof value}`);
  }
}

function processValue(value: unknown) {
  // 断言后 value 被收窄为 string
  assertIsString(value);
  console.log(value.toUpperCase());
}

// 条件类型与类型守卫结合
type NonNullable<T> = T extends null | undefined ? never : T;

function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

function processOptional<T>(value: T | null | undefined) {
  if (isNonNullable(value)) {
    // value 被收窄为 T (排除 null 和 undefined)
    console.log(value);
  }
}

// 复杂的自定义类型守卫
interface Product {
  type: 'product';
  name: string;
  price: number;
}

interface Service {
  type: 'service';
  name: string;
  duration: number;
}

type Sellable = Product | Service;

function isProduct(item: Sellable): item is Product {
  return item.type === 'product';
}

function isService(item: Sellable): item is Service {
  return item.type === 'service';
}

function getSellableName(item: Sellable): string {
  if (isProduct(item)) {
    return `${item.name} - ¥${item.price}`;
  }
  return `${item.name} - ${item.duration}小时`;
}
```

### 7.5 实战：类型安全的错误处理

以下是一个完整的类型安全错误处理方案，展示了如何结合类型守卫和泛型实现健壮的错误处理：

```typescript
// ==================== 错误类型定义 ====================

/** 应用错误基类 */
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/** 验证错误 */
class ValidationError extends AppError {
  constructor(
    message: string,
    public fieldErrors: Record<string, string> = {}
  ) {
    super(message, 'VALIDATION_ERROR', 400, fieldErrors);
    this.name = 'ValidationError';
  }
}

/** 认证错误 */
class AuthError extends AppError {
  constructor(message: string, code: 'INVALID_CREDENTIALS' | 'TOKEN_EXPIRED' | 'UNAUTHORIZED' = 'UNAUTHORIZED') {
    super(message, `AUTH_${code}`, 401);
    this.name = 'AuthError';
  }
}

/** 资源未找到错误 */
class NotFoundError extends AppError {
  constructor(resource: string, identifier: string | number) {
    super(`${resource} ${identifier} 未找到`, 'NOT_FOUND', 404, { resource, identifier });
    this.name = 'NotFoundError';
  }
}

/** 权限错误 */
class ForbiddenError extends AppError {
  constructor(message: string = '没有权限执行此操作') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}

// ==================== 类型守卫函数 ====================

function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}

function isForbiddenError(error: unknown): error is ForbiddenError {
  return error instanceof ForbiddenError;
}

// ==================== 错误处理工具 ====================

type ErrorHandler<T> = (error: AppError) => T;

interface ErrorHandlers {
  validation?: ErrorHandler<any>;
  auth?: ErrorHandler<any>;
  notFound?: ErrorHandler<any>;
  forbidden?: ErrorHandler<any>;
  default?: ErrorHandler<any>;
}

function handleAppError<T>(
  error: unknown,
  handlers: ErrorHandlers,
  defaultValue: T
): T {
  if (isValidationError(error) && handlers.validation) {
    return handlers.validation(error);
  }

  if (isAuthError(error) && handlers.auth) {
    return handlers.auth(error);
  }

  if (isNotFoundError(error) && handlers.notFound) {
    return handlers.notFound(error);
  }

  if (isForbiddenError(error) && handlers.forbidden) {
    return handlers.forbidden(error);
  }

  if (handlers.default) {
    return handlers.default(error as AppError);
  }

  return defaultValue;
}

// ==================== Result 类型实现 ====================

type Success<T> = {
  ok: true;
  value: T;
};

type Failure<E extends AppError = AppError> = {
  ok: false;
  error: E;
};

type Result<T, E extends AppError = AppError> = Success<T> | Failure<E>;

function success<T>(value: T): Success<T> {
  return { ok: true, value };
}

function failure<E extends AppError = AppError>(error: E): Failure<E> {
  return { ok: false, error };
}

function isSuccess<T, E>(result: Result<T, E>): result is Success<T> {
  return result.ok === true;
}

function isFailure<T, E>(result: Result<T, E>): result is Failure<E> {
  return result.ok === false;
}

// ==================== 使用示例 ====================

async function fetchUser(id: string): Promise<Result<User, AppError>> {
  try {
    const response = await fetch(`/api/users/${id}`);

    if (!response.ok) {
      if (response.status === 404) {
        return failure(new NotFoundError('用户', id));
      }

      if (response.status === 401) {
        return failure(new AuthError('请重新登录', 'UNAUTHORIZED'));
      }

      throw new AppError('获取用户失败', 'FETCH_ERROR', response.status);
    }

    const user = await response.json();
    return success(user);
  } catch (e) {
    if (isAppError(e)) {
      return failure(e);
    }
    return failure(new AppError('网络错误', 'NETWORK_ERROR', 0));
  }
}

// 使用 Result 类型
async function getUserDisplayName(id: string): Promise<string> {
  const result = await fetchUser(id);

  if (isFailure(result)) {
    const error = result.error;

    if (isNotFoundError(error)) {
      return '用户不存在';
    }

    if (isAuthError(error)) {
      return '请先登录';
    }

    return '获取用户失败';
  }

  return result.value.name;
}

// 链式调用示例
async function getUserEmail(id: string): Promise<Result<string, AppError>> {
  const result = await fetchUser(id);

  if (isFailure(result)) {
    return failure(result.error);
  }

  return success(result.value.email);
}

// 错误处理模板
async function userOperation(id: string) {
  const result = await fetchUser(id);

  return handleAppError(
    result,
    {
      validation: (error) => ({
        success: false,
        message: error.message,
        details: error.details,
      }),
      auth: (error) => ({
        success: false,
        message: '请重新登录',
        redirectTo: '/login',
      }),
      notFound: (error) => ({
        success: false,
        message: `${error.details?.resource} 不存在`,
      }),
      default: (error) => ({
        success: false,
        message: error.message,
      }),
    },
    { success: false, message: '未知错误' }
  );
}
```

---

## 八、React + TypeScript 最佳实践

React 与 TypeScript 的结合是现代前端开发的主流选择。本章将详细讲解在 React 应用中使用 TypeScript 的最佳实践，包括 Props、State、Events 和 Hooks 的类型定义。

### 8.1 Props 类型定义

Props 是 React 组件的输入，良好的 Props 类型定义能够提供完善的类型检查和 IDE 智能提示。

```typescript
// ==================== 基础 Props 类型 ====================

interface ButtonProps {
  /** 按钮文本 */
  children: React.ReactNode;
  /** 点击事件处理 */
  onClick?: () => void;
  /** 按钮类型 */
  type?: 'button' | 'submit' | 'reset';
  /** 是否禁用 */
  disabled?: boolean;
  /** 按钮变体 */
  variant?: 'primary' | 'secondary' | 'danger';
  /** 自定义类名 */
  className?: string;
}

function Button({
  children,
  onClick,
  type = 'button',
  disabled = false,
  variant = 'primary',
  className = '',
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} ${className}`}
    >
      {children}
    </button>
  );
}

// ==================== 必需 Props 与可选 Props ====================

interface CardProps {
  // 必需的属性 - 没有 ? 标记
  title: string;
  content: string;

  // 可选的属性 - 使用 ? 标记
  footer?: React.ReactNode;
  image?: string;
  onEdit?: () => void;
  onDelete?: () => void;

  // 默认值可以在解构时提供
  padding?: number;
  bordered?: boolean;
}

function Card({
  title,
  content,
  footer,
  image,
  onEdit,
  onDelete,
  padding = 16,
  bordered = true,
}: CardProps) {
  return (
    <div
      className={`card ${bordered ? 'card-bordered' : ''}`}
      style={{ padding }}
    >
      {image && <img src={image} alt={title} className="card-image" />}
      <h3 className="card-title">{title}</h3>
      <p className="card-content">{content}</p>
      {(footer || onEdit || onDelete) && (
        <div className="card-footer">
          {footer}
          {onEdit && <Button variant="secondary" onClick={onEdit}>编辑</Button>}
          {onDelete && <Button variant="danger" onClick={onDelete}>删除</Button>}
        </div>
      )}
    </div>
  );
}

// ==================== 泛型 Props ====================

interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  loading?: boolean;
}

function List<T>({
  items,
  renderItem,
  keyExtractor,
  emptyMessage = '暂无数据',
  loading = false,
}: ListProps<T>) {
  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (items.length === 0) {
    return <div className="empty">{emptyMessage}</div>;
  }

  return (
    <div className="list">
      {items.map((item, index) => (
        <div key={keyExtractor(item)}>{renderItem(item, index)}</div>
      ))}
    </div>
  );
}

// 使用泛型 List 组件
interface User {
  id: string;
  name: string;
  email: string;
}

const userList: User[] = [
  { id: '1', name: '张三', email: 'zhang@example.com' },
  { id: '2', name: '李四', email: 'li@example.com' },
];

function UserList() {
  return (
    <List
      items={userList}
      keyExtractor={(user) => user.id}
      renderItem={(user, index) => (
        <div>
          {index + 1}. {user.name} - {user.email}
        </div>
      )}
    />
  );
}

// ==================== Props 组合与扩展 ====================

interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  testId?: string;
}

interface ClickableProps {
  onClick?: () => void;
  onDoubleClick?: () => void;
}

interface TooltipProps {
  tooltip: string;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
}

// 组合多个 Props 接口
type IconButtonProps = BaseComponentProps &
  ClickableProps & {
    icon: React.ReactNode;
    ariaLabel: string;
    size?: 'small' | 'medium' | 'large';
  };

function IconButton({
  className,
  style,
  testId,
  onClick,
  onDoubleClick,
  icon,
  ariaLabel,
  size = 'medium',
}: IconButtonProps) {
  return (
    <button
      className={`icon-button icon-button-${size} ${className || ''}`}
      style={style}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      aria-label={ariaLabel}
      data-testid={testId}
    >
      {icon}
    </button>
  );
}

// 使用 Omit 排除不需要的属性
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
}

interface DialogProps extends Omit<ModalProps, 'footer'> {
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

function Dialog({
  isOpen,
  onClose,
  title,
  children,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel,
  size = 'medium',
}: DialogProps) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size={size}>
      <div className="dialog-content">{children}</div>
      <div className="dialog-footer">
        <Button variant="secondary" onClick={onCancel || onClose}>
          {cancelText}
        </Button>
        <Button onClick={onConfirm}>{confirmText}</Button>
      </div>
    </Modal>
  );
}
```

### 8.2 State 类型定义

State 是 React 组件的内部状态，正确的 State 类型定义对于组件的健壮性和可维护性至关重要。

```typescript
// ==================== 基础 State 类型 ====================

interface CounterState {
  count: number;
  lastUpdated: Date | null;
}

class Counter extends React.Component<{}, CounterState> {
  state: CounterState = {
    count: 0,
    lastUpdated: null,
  };

  increment = () => {
    this.setState((prev) => ({
      count: prev.count + 1,
      lastUpdated: new Date(),
    }));
  };

  decrement = () => {
    this.setState((prev) => ({
      count: prev.count - 1,
      lastUpdated: new Date(),
    }));
  };

  reset = () => {
    this.setState({ count: 0, lastUpdated: new Date() });
  };

  render() {
    return (
      <div>
        <span>计数: {this.state.count}</span>
        <button onClick={this.increment}>+1</button>
        <button onClick={this.decrement}>-1</button>
        <button onClick={this.reset}>重置</button>
      </div>
    );
  }
}

// ==================== 函数组件中的 State ====================

// useState 的泛型参数
function UserProfile() {
  // 显式指定 state 类型
  const [user, setUser] = useState<User | null>(null);

  // 提供初始值
  const [isLoading, setIsLoading] = useState(false);

  // 使用联合类型
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // 复杂 state 类型
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    bio: string;
  }>({
    name: '',
    email: '',
    bio: '',
  });

  // 数组 state
  const [tags, setTags] = useState<string[]>([]);

  // 对象数组 state
  const [items, setItems] = useState<Array<{ id: string; name: string; quantity: number }>>([]);

  // ...
}

// ==================== useReducer 的 State 类型 ====================

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

type TodoAction =
  | { type: 'ADD'; payload: string }
  | { type: 'TOGGLE'; payload: string }
  | { type: 'DELETE'; payload: string }
  | { type: 'CLEAR_COMPLETED' }
  | { type: 'SET_TODOS'; payload: Todo[] };

interface TodoState {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed';
  error: string | null;
}

const initialState: TodoState = {
  todos: [],
  filter: 'all',
  error: null,
};

function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case 'ADD':
      return {
        ...state,
        todos: [
          ...state.todos,
          {
            id: crypto.randomUUID(),
            text: action.payload,
            completed: false,
            createdAt: new Date(),
          },
        ],
      };

    case 'TOGGLE':
      return {
        ...state,
        todos: state.todos.map((todo) =>
          todo.id === action.payload
            ? { ...todo, completed: !todo.completed }
            : todo
        ),
      };

    case 'DELETE':
      return {
        ...state,
        todos: state.todos.filter((todo) => todo.id !== action.payload),
      };

    case 'CLEAR_COMPLETED':
      return {
        ...state,
        todos: state.todos.filter((todo) => !todo.completed),
      };

    case 'SET_TODOS':
      return {
        ...state,
        todos: action.payload,
      };

    default:
      return state;
  }
}

function TodoApp() {
  const [state, dispatch] = useReducer(todoReducer, initialState);
  const [inputText, setInputText] = useState('');

  const handleAddTodo = () => {
    if (inputText.trim()) {
      dispatch({ type: 'ADD', payload: inputText });
      setInputText('');
    }
  };

  return (
    <div>
      <input
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="添加新任务..."
      />
      <button onClick={handleAddTodo}>添加</button>

      <ul>
        {state.todos.map((todo) => (
          <li
            key={todo.id}
            style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => dispatch({ type: 'TOGGLE', payload: todo.id })}
            />
            {todo.text}
            <button onClick={() => dispatch({ type: 'DELETE', payload: todo.id })}>
              删除
            </button>
          </li>
        ))}
      </ul>

      <button onClick={() => dispatch({ type: 'CLEAR_COMPLETED' })}>
        清除已完成
      </button>
    </div>
  );
}
```

### 8.3 Events 类型定义

事件处理是 React 应用中最重要的交互部分，正确的事件类型能够提供准确的类型检查和智能提示。

```typescript
// ==================== 表单事件 ====================

// React.FormEvent 处理
function ContactForm() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // 处理表单提交
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 表单内容 */}
    </form>
  );
}

// Input onChange 事件
function NameInput() {
  const [name, setName] = useState('');

  // 完整的 onChange 类型
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    console.log('输入值:', e.target.value);
    console.log('输入名称:', e.target.name);
    console.log('输入类型:', e.target.type);
  };

  return (
    <input
      type="text"
      name="name"
      value={name}
      onChange={handleChange}
    />
  );
}

// Textarea onChange 事件
function BioInput() {
  const [bio, setBio] = useState('');

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBio(e.target.value);
  };

  return (
    <textarea
      value={bio}
      onChange={handleBioChange}
      placeholder="自我介绍..."
      maxLength={200}
    />
  );
}

// Select onChange 事件
function CountrySelect() {
  const [country, setCountry] = useState('');

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCountry(e.target.value);
  };

  return (
    <select value={country} onChange={handleSelectChange}>
      <option value="">请选择国家</option>
      <option value="CN">中国</option>
      <option value="US">美国</option>
      <option value="JP">日本</option>
    </select>
  );
}

// ==================== 鼠标事件 ====================

// 点击事件
function ClickableDiv() {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    console.log('点击坐标:', e.clientX, e.clientY);
    console.log('点击元素:', e.currentTarget);
    console.log('修饰键:', {
      shift: e.shiftKey,
      ctrl: e.ctrlKey,
      alt: e.altKey,
      meta: e.metaKey,
    });
  };

  return (
    <div onClick={handleClick}>
      点击这个区域
    </div>
  );
}

// 双击事件
function DoubleClickButton() {
  const handleDoubleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log('双击位置:', e.clientX, e.clientY);
  };

  return (
    <button onDoubleClick={handleDoubleClick}>
      双击我
    </button>
  );
}

// 拖拽事件
function DraggableBox() {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    console.log('拖拽开始:', e.dataTransfer.getData('text/plain'));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    console.log('拖拽结束');
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      拖拽我
    </div>
  );
}

// ==================== 键盘事件 ====================

function KeyboardInput() {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    console.log('按键:', e.key);
    console.log('按键代码:', e.code);
    console.log('组合键:', {
      shift: e.shiftKey,
      ctrl: e.ctrlKey,
      alt: e.altKey,
      meta: e.metaKey,
    });

    // 常见快捷键处理
    if (e.key === 'Enter') {
      console.log('回车键被按下');
    }

    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      console.log('Ctrl+S 保存');
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    console.log('按键释放:', e.key);
  };

  return (
    <input
      type="text"
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      placeholder="输入内容..."
    />
  );
}

// ==================== 焦点事件 ====================

function FocusInput() {
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    console.log('输入框获得焦点');
    console.log('相关元素:', e.relatedTarget);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    console.log('输入框失去焦点');
  };

  return (
    <input
      type="text"
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder="聚焦/失焦测试"
    />
  );
}

// ==================== 合成事件与原生事件 ====================

function EventTypeExample() {
  // React 合成事件
  const handleSyntheticEvent = (e: React.SyntheticEvent) => {
    console.log('React 合成事件:', e.type);
    console.log('目标:', e.currentTarget);
  };

  // 获取原生事件
  const handleNativeEvent = (e: React.SyntheticEvent) => {
    const nativeEvent = e.nativeEvent;
    console.log('原生事件:', nativeEvent.type);
    console.log('原生事件目标:', nativeEvent.target);
  };

  // 类型断言获取原生事件
  const handleMouseEvent = (e: React.MouseEvent) => {
    // 转换为原生 MouseEvent
    const mouseEvent = e as unknown as MouseEvent;
    console.log('原生鼠标事件:', mouseEvent.clientX, mouseEvent.clientY);
  };

  return (
    <div onClick={handleSyntheticEvent}>
      <button onClick={handleNativeEvent}>点击</button>
      <div onMouseMove={handleMouseEvent}>移动鼠标</div>
    </div>
  );
}
```

### 8.4 实战：完整的 React 类型组件

以下是一个完整的、类型安全的 React 组件实现，展示了在实际项目中的最佳实践：

```typescript
// ==================== 完整组件示例：用户管理列表 ====================

// ==================== 类型定义 ====================

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLoginAt?: string;
}

interface UserFilters {
  role?: User['role'];
  status?: User['status'];
  search?: string;
}

interface UserFormData {
  name: string;
  email: string;
  role: User['role'];
  password?: string;
}

// ==================== Props 定义 ====================

interface UserTableProps {
  users: User[];
  loading?: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onView: (user: User) => void;
}

interface UserFiltersProps {
  filters: UserFilters;
  onChange: (filters: UserFilters) => void;
}

interface UserFormModalProps {
  user?: User; // 如果提供则是编辑模式
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => Promise<void>;
}

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}

// ==================== 用户表格组件 ====================

const UserTable: React.FC<UserTableProps> = ({
  users,
  loading = false,
  onEdit,
  onDelete,
  onView,
}) => {
  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (users.length === 0) {
    return <div className="empty">暂无用户</div>;
  }

  return (
    <table className="user-table">
      <thead>
        <tr>
          <th>头像</th>
          <th>姓名</th>
          <th>邮箱</th>
          <th>角色</th>
          <th>状态</th>
          <th>注册时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td>
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="avatar" />
              ) : (
                <div className="avatar-placeholder">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </td>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td>
              <span className={`role-badge role-${user.role}`}>
                {user.role === 'admin' ? '管理员' : user.role === 'editor' ? '编辑' : '查看者'}
              </span>
            </td>
            <td>
              <span className={`status-badge status-${user.status}`}>
                {user.status === 'active' ? '正常' : user.status === 'inactive' ? '未激活' : '已封禁'}
              </span>
            </td>
            <td>{new Date(user.createdAt).toLocaleDateString()}</td>
            <td>
              <button onClick={() => onView(user)}>查看</button>
              <button onClick={() => onEdit(user)}>编辑</button>
              <button onClick={() => onDelete(user)}>删除</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// ==================== 筛选组件 ====================

const UserFilters: React.FC<UserFiltersProps> = ({ filters, onChange }) => {
  const [search, setSearch] = useState(filters.search || '');
  const [role, setRole] = useState<User['role'] | ''>(filters.role || '');
  const [status, setStatus] = useState<User['status'] | ''>(filters.status || '');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRole(e.target.value as User['role'] | '');
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value as User['status'] | '');
  };

  const handleSearch = () => {
    onChange({
      search: search || undefined,
      role: role || undefined,
      status: status || undefined,
    });
  };

  const handleReset = () => {
    setSearch('');
    setRole('');
    setStatus('');
    onChange({});
  };

  return (
    <div className="filters">
      <input
        type="text"
        value={search}
        onChange={handleSearchChange}
        placeholder="搜索用户名或邮箱..."
        className="search-input"
      />
      <select value={role} onChange={handleRoleChange}>
        <option value="">全部角色</option>
        <option value="admin">管理员</option>
        <option value="editor">编辑</option>
        <option value="viewer">查看者</option>
      </select>
      <select value={status} onChange={handleStatusChange}>
        <option value="">全部状态</option>
        <option value="active">正常</option>
        <option value="inactive">未激活</option>
        <option value="suspended">已封禁</option>
      </select>
      <button onClick={handleSearch}>搜索</button>
      <button onClick={handleReset}>重置</button>
    </div>
  );
};

// ==================== 分页组件 ====================

const Pagination: React.FC<PaginationProps> = ({
  page,
  pageSize,
  total,
  onChange,
}) => {
  const totalPages = Math.ceil(total / pageSize);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      onChange(newPage);
    }
  };

  return (
    <div className="pagination">
      <button
        disabled={page === 1}
        onClick={() => handlePageChange(page - 1)}
      >
        上一页
      </button>
      <span>
        第 {page} / {totalPages} 页，共 {total} 条
      </span>
      <button
        disabled={page === totalPages}
        onClick={() => handlePageChange(page + 1)}
      >
        下一页
      </button>
    </div>
  );
};

// ==================== 用户表单弹窗 ====================

const UserFormModal: React.FC<UserFormModalProps> = ({
  user,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<UserFormData>({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'viewer',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!user;

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'viewer',
        password: '',
      });
    }
    setErrors({});
  }, [user, isOpen]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof UserFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = '姓名不能为空';
    }

    if (!formData.email.trim()) {
      newErrors.email = '邮箱不能为空';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '邮箱格式不正确';
    }

    if (!isEditMode && !formData.password) {
      newErrors.password = '密码不能为空';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = '密码至少6位';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('提交失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // 清除该字段的错误
    if (errors[name as keyof UserFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{isEditMode ? '编辑用户' : '创建用户'}</h2>
          <button onClick={onClose} className="close-button">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="name">姓名 *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'input-error' : ''}
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">邮箱 *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="role">角色 *</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="viewer">查看者</option>
              <option value="editor">编辑</option>
              <option value="admin">管理员</option>
            </select>
          </div>

          {!isEditMode && (
            <div className="form-group">
              <label htmlFor="password">密码 *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'input-error' : ''}
              />
              {errors.password && (
                <span className="error-text">{errors.password}</span>
              )}
            </div>
          )}

          <div className="modal-footer">
            <button type="button" onClick={onClose}>
              取消
            </button>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '提交中...' : '确认'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==================== 完整的用户管理页面 ====================

interface UserManagementState {
  users: User[];
  loading: boolean;
  filters: UserFilters;
  page: number;
  pageSize: number;
  total: number;
  selectedUser: User | null;
  isModalOpen: boolean;
  modalMode: 'create' | 'edit' | 'view';
}

const UserManagement: React.FC = () => {
  const [state, setState] = useState<UserManagementState>({
    users: [],
    loading: false,
    filters: {},
    page: 1,
    pageSize: 10,
    total: 0,
    selectedUser: null,
    isModalOpen: false,
    modalMode: 'create',
  });

  const fetchUsers = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));

    try {
      // 模拟 API 调用
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 模拟数据
      const mockUsers: User[] = [
        {
          id: '1',
          name: '张三',
          email: 'zhang@example.com',
          role: 'admin',
          status: 'active',
          createdAt: '2024-01-15',
        },
        // ... 更多用户数据
      ];

      setState((prev) => ({
        ...prev,
        users: mockUsers,
        total: 100,
        loading: false,
      }));
    } catch (error) {
      console.error('获取用户列表失败:', error);
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, state.page, state.pageSize, state.filters]);

  const handleFiltersChange = (filters: UserFilters) => {
    setState((prev) => ({ ...prev, filters, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setState((prev) => ({ ...prev, page }));
  };

  const handleEdit = (user: User) => {
    setState((prev) => ({
      ...prev,
      selectedUser: user,
      modalMode: 'edit',
      isModalOpen: true,
    }));
  };

  const handleView = (user: User) => {
    setState((prev) => ({
      ...prev,
      selectedUser: user,
      modalMode: 'view',
      isModalOpen: true,
    }));
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`确定要删除用户 ${user.name} 吗？`)) return;

    try {
      await deleteUser(user.id);
      fetchUsers();
    } catch (error) {
      console.error('删除用户失败:', error);
    }
  };

  const handleModalClose = () => {
    setState((prev) => ({
      ...prev,
      selectedUser: null,
      isModalOpen: false,
    }));
  };

  const handleFormSubmit = async (data: UserFormData) => {
    console.log('表单数据:', data);
    // 实际项目中这里会调用 API
    await new Promise((resolve) => setTimeout(resolve, 500));
  };

  const handleCreateUser = () => {
    setState((prev) => ({
      ...prev,
      selectedUser: null,
      modalMode: 'create',
      isModalOpen: true,
    }));
  };

  return (
    <div className="user-management">
      <div className="page-header">
        <h1>用户管理</h1>
        <button onClick={handleCreateUser}>创建用户</button>
      </div>

      <UserFilters
        filters={state.filters}
        onChange={handleFiltersChange}
      />

      <UserTable
        users={state.users}
        loading={state.loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
      />

      {state.total > state.pageSize && (
        <Pagination
          page={state.page}
          pageSize={state.pageSize}
          total={state.total}
          onChange={handlePageChange}
        />
      )}

      <UserFormModal
        user={state.selectedUser || undefined}
        isOpen={state.isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
};

// 辅助函数
async function deleteUser(id: string): Promise<void> {
  console.log('删除用户:', id);
}
```

---

## 九、Node.js + TypeScript 实践

在后端开发中，TypeScript 同样发挥着重要作用。本章将讲解如何在 Node.js 环境中使用 TypeScript，特别是与 Express 和数据库结合的类型实践。

### 9.1 Express 类型定义

Express 是 Node.js 最流行的 Web 框架之一，正确地为 Express 应用添加类型能够显著提升开发体验和代码质量。

```typescript
// ==================== 基础 Express 类型配置 ====================

import express, {
  Express,
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from 'express';
import { Router } from 'express';

// 扩展 Express Request 类型
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
      requestId?: string;
      startTime?: number;
    }
  }
}

// ==================== 请求/响应类型定义 ====================

// URL 参数类型
interface UserParams {
  userId: string;
}

// 查询参数类型
interface UserQuery {
  page?: string;
  pageSize?: string;
  role?: string;
  status?: string;
}

// 请求体类型
interface CreateUserBody {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'editor' | 'viewer';
}

interface UpdateUserBody {
  name?: string;
  email?: string;
  role?: 'admin' | 'editor' | 'viewer';
  status?: 'active' | 'inactive' | 'suspended';
}

// 响应类型
interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page: number;
    pageSize: number;
    total: number;
  };
}

// ==================== 路由处理器类型 ====================

// 完整的请求处理器类型签名
type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

// 创建用户
const createUser: AsyncRequestHandler = async (req, res, next) => {
  try {
    const body = req.body as CreateUserBody;

    // 验证请求体
    if (!body.name || !body.email || !body.password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '缺少必填字段',
        },
      });
    }

    // 创建用户逻辑
    const user = await userService.create(body);

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// 获取用户列表
const getUsers: AsyncRequestHandler = async (req, res, next) => {
  try {
    const query = req.query as unknown as UserQuery;

    const page = parseInt(query.page || '1', 10);
    const pageSize = parseInt(query.pageSize || '10', 10);

    const result = await userService.findAll({
      page,
      pageSize,
      role: query.role as any,
      status: query.status as any,
    });

    res.json({
      success: true,
      data: result.items,
      meta: {
        page,
        pageSize,
        total: result.total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 获取单个用户
const getUserById: AsyncRequestHandler = async (req, res, next) => {
  try {
    const { userId } = req.params as unknown as UserParams;

    const user = await userService.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '用户不存在',
        },
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// 更新用户
const updateUser: AsyncRequestHandler = async (req, res, next) => {
  try {
    const { userId } = req.params as unknown as UserParams;
    const body = req.body as UpdateUserBody;

    const user = await userService.update(userId, body);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// 删除用户
const deleteUser: AsyncRequestHandler = async (req, res, next) => {
  try {
    const { userId } = req.params as unknown as UserParams;

    await userService.delete(userId);

    res.json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== 中间件类型 ====================

// 认证中间件
const authenticate: RequestHandler = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '请先登录',
      },
    });
  }

  try {
    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: '无效的令牌',
      },
    });
  }
};

// 授权中间件工厂
const authorize = (...roles: string[]): RequestHandler => {
  return (req, res, next) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '没有权限执行此操作',
        },
      });
    }
    next();
  };
};

// 请求日志中间件
const requestLogger: RequestHandler = (req, res, next) => {
  req.requestId = crypto.randomUUID();
  req.startTime = Date.now();

  console.log(`[${req.requestId}] ${req.method} ${req.path}`);

  res.on('finish', () => {
    const duration = Date.now() - (req.startTime || 0);
    console.log(
      `[${req.requestId}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
    );
  });

  next();
};

// 错误处理中间件
const errorHandler: express.ErrorRequestHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.requestId}:`, err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: '服务器内部错误',
    },
  });
};

// ==================== 路由定义 ====================

const userRouter = Router();

// 公开路由
userRouter.get('/users', getUsers);
userRouter.get('/users/:userId', getUserById);

// 需要认证的路由
userRouter.post('/users', authenticate, createUser);
userRouter.patch('/users/:userId', authenticate, updateUser);
userRouter.delete('/users/:userId', authenticate, authorize('admin'), deleteUser);

// ==================== 应用配置 ====================

const app: Express = express();

// 中间件
app.use(express.json());
app.use(requestLogger);

// 路由
app.use('/api', userRouter);

// 错误处理
app.use(errorHandler);

// 启动服务器
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
```

### 9.2 数据库类型定义

在 TypeScript 中使用数据库时，正确的类型定义能够确保数据操作的类型安全。

```typescript
// ==================== 数据库模型类型 ====================

// 用户模型
interface DbUser {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'inactive' | 'suspended';
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
}

// 文章模型
interface DbPost {
  id: string;
  title: string;
  content: string;
  slug: string;
  author_id: string;
  status: 'draft' | 'published' | 'archived';
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// 评论模型
interface DbComment {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  created_at: Date;
  updated_at: Date;
}

// 标签模型
interface DbTag {
  id: string;
  name: string;
  slug: string;
  created_at: Date;
}

// 文章-标签关联
interface DbPostTag {
  post_id: string;
  tag_id: string;
}

// ==================== Repository 类型 ====================

// Repository 接口定义
interface IUserRepository {
  findById(id: string): Promise<DbUser | null>;
  findByEmail(email: string): Promise<DbUser | null>;
  findAll(options?: {
    page?: number;
    pageSize?: number;
    role?: string;
    status?: string;
  }): Promise<{ users: DbUser[]; total: number }>;
  create(data: Omit<DbUser, 'id' | 'created_at' | 'updated_at'>): Promise<DbUser>;
  update(id: string, data: Partial<DbUser>): Promise<DbUser>;
  delete(id: string): Promise<void>;
}

// Repository 实现
class UserRepository implements IUserRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<DbUser | null> {
    const result = await this.db.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByEmail(email: string): Promise<DbUser | null> {
    const result = await this.db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  async findAll(options: {
    page = 1,
    pageSize = 10,
    role?: string,
    status?: string,
  }): Promise<{ users: DbUser[]; total: number }> {
    const { page, pageSize, role, status } = options;
    const offset = (page - 1) * pageSize;

    let query = 'SELECT * FROM users WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (role) {
      query += ` AND role = $${paramIndex++}`;
      params.push(role);
    }

    if (status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await this.db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(pageSize, offset);

    const result = await this.db.query(query, params);

    return {
      users: result.rows,
      total,
    };
  }

  async create(data: Omit<DbUser, 'id' | 'created_at' | 'updated_at'>): Promise<DbUser> {
    const id = crypto.randomUUID();
    const result = await this.db.query(
      `INSERT INTO users (id, name, email, password_hash, role, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, data.name, data.email, data.password_hash, data.role, data.status]
    );
    return result.rows[0];
  }

  async update(id: string, data: Partial<DbUser>): Promise<DbUser> {
    const fields = Object.keys(data)
      .filter((key) => key !== 'id' && key !== 'created_at')
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = Object.keys(data)
      .filter((key) => key !== 'id' && key !== 'created_at')
      .map((key) => data[key as keyof DbUser]);

    const result = await this.db.query(
      `UPDATE users SET ${fields}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    return result.rows[0];
  }

  async delete(id: string): Promise<void> {
    await this.db.query('DELETE FROM users WHERE id = $1', [id]);
  }
}

// ==================== Service 类型 ====================

// Service 层数据类型（与数据库模型分离）
interface UserEntity {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'editor' | 'viewer';
}

interface UpdateUserDTO {
  name?: string;
  email?: string;
  role?: 'admin' | 'editor' | 'viewer';
  status?: 'active' | 'inactive' | 'suspended';
}

// Service 接口
interface IUserService {
  create(data: CreateUserDTO): Promise<UserEntity>;
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findAll(options?: {
    page?: number;
    pageSize?: number;
    role?: string;
    status?: string;
  }): Promise<{ users: UserEntity[]; total: number }>;
  update(id: string, data: UpdateUserDTO): Promise<UserEntity>;
  delete(id: string): Promise<void>;
}

// Service 实现
class UserService implements IUserService {
  constructor(private userRepository: IUserRepository) {}

  private toEntity(dbUser: DbUser): UserEntity {
    return {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      status: dbUser.status,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at,
      lastLoginAt: dbUser.last_login_at,
    };
  }

  async create(data: CreateUserDTO): Promise<UserEntity> {
    // 检查邮箱是否已存在
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new Error('邮箱已被使用');
    }

    // 密码哈希（实际项目中应使用 bcrypt）
    const passwordHash = await hashPassword(data.password);

    const dbUser = await this.userRepository.create({
      name: data.name,
      email: data.email,
      password_hash: passwordHash,
      role: data.role || 'viewer',
      status: 'active',
    });

    return this.toEntity(dbUser);
  }

  async findById(id: string): Promise<UserEntity | null> {
    const dbUser = await this.userRepository.findById(id);
    return dbUser ? this.toEntity(dbUser) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const dbUser = await this.userRepository.findByEmail(email);
    return dbUser ? this.toEntity(dbUser) : null;
  }

  async findAll(options: {
    page?: number;
    pageSize?: number;
    role?: string;
    status?: string;
  } = {}): Promise<{ users: UserEntity[]; total: number }> {
    const result = await this.userRepository.findAll(options);
    return {
      users: result.users.map((u) => this.toEntity(u)),
      total: result.total,
    };
  }

  async update(id: string, data: UpdateUserDTO): Promise<UserEntity> {
    const dbUser = await this.userRepository.update(id, data);
    return this.toEntity(dbUser);
  }

  async delete(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }
}

// 辅助函数
async function hashPassword(password: string): Promise<string> {
  // 实际项目中应使用 bcrypt 或 argon2
  return `hashed_${password}`;
}
```

### 9.3 实战：Node.js 类型化 SDK

以下是一个完整的、类型安全的 Node.js SDK 实现，展示了如何构建专业的后端类型系统：

```typescript
// ==================== SDK 配置与客户端 ====================

/** SDK 配置 */
interface SdkConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

/** SDK 错误 */
class SdkError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public response?: any
  ) {
    super(message);
    this.name = 'SdkError';
  }
}

/** HTTP 客户端 */
class HttpClient {
  constructor(private config: SdkConfig) {}

  private async request<T>(
    method: string,
    path: string,
    options: {
      body?: any;
      params?: Record<string, string>;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const { body, params, headers } = options;

    // 构建 URL
    const url = new URL(path, this.config.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    // 构建请求头
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': this.config.apiKey,
      ...this.config.headers,
      ...headers,
    };

    // 构建请求配置
    const requestConfig: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body && method !== 'GET') {
      requestConfig.body = JSON.stringify(body);
    }

    // 发送请求（带重试）
    let lastError: Error;
    for (let attempt = 0; attempt <= (this.config.retries || 0); attempt++) {
      try {
        const response = await fetch(url.toString(), requestConfig);
        const data = await response.json();

        if (!response.ok) {
          throw new SdkError(
            data.message || '请求失败',
            data.code || 'REQUEST_FAILED',
            response.status,
            data
          );
        }

        return data as T;
      } catch (error) {
        lastError = error as Error;

        if (attempt < (this.config.retries || 0)) {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 100)
          );
        }
      }
    }

    throw lastError!;
  }

  get<T>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', path, { params });
  }

  post<T>(path: string, body?: any): Promise<T> {
    return this.request<T>('POST', path, { body });
  }

  put<T>(path: string, body?: any): Promise<T> {
    return this.request<T>('PUT', path, { body });
  }

  patch<T>(path: string, body?: any): Promise<T> {
    return this.request<T>('PATCH', path, { body });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}

// ==================== 类型定义 ====================

/** 用户 */
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

/** 创建用户请求 */
interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'editor' | 'viewer';
}

/** 更新用户请求 */
interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: 'admin' | 'editor' | 'viewer';
  status?: 'active' | 'inactive' | 'suspended';
}

/** 认证令牌 */
interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

/** 登录请求 */
interface LoginRequest {
  email: string;
  password: string;
}

/** 项目 */
interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  status: 'active' | 'archived' | 'deleted';
  createdAt: string;
  updatedAt: string;
}

/** 创建项目请求 */
interface CreateProjectRequest {
  name: string;
  description?: string;
}

/** 分页参数 */
interface PaginationParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

/** 分页结果 */
interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ==================== API 响应类型 ====================

/** API 响应 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page: number;
    pageSize: number;
    total: number;
  };
}

// ==================== 服务类 ====================

/** 认证服务 */
class AuthService {
  constructor(private client: HttpClient) {}

  async login(credentials: LoginRequest): Promise<AuthToken> {
    const response = await this.client.post<ApiResponse<AuthToken>>(
      '/auth/login',
      credentials
    );
    return response.data!;
  }

  async refreshToken(refreshToken: string): Promise<AuthToken> {
    const response = await this.client.post<ApiResponse<AuthToken>>(
      '/auth/refresh',
      { refreshToken }
    );
    return response.data!;
  }

  async logout(): Promise<void> {
    await this.client.post('/auth/logout');
  }

  async me(): Promise<User> {
    const response = await this.client.get<ApiResponse<User>>('/auth/me');
    return response.data!;
  }
}

/** 用户服务 */
class UserService {
  constructor(private client: HttpClient) {}

  async create(data: CreateUserRequest): Promise<User> {
    const response = await this.client.post<ApiResponse<User>>(
      '/users',
      data
    );
    return response.data!;
  }

  async findById(id: string): Promise<User> {
    const response = await this.client.get<ApiResponse<User>>(`/users/${id}`);
    return response.data!;
  }

  async findAll(params?: PaginationParams): Promise<PaginatedResult<User>> {
    const response = await this.client.get<ApiResponse<PaginatedResult<User>>>(
      '/users',
      params as Record<string, string>
    );
    return response.data!;
  }

  async update(id: string, data: UpdateUserRequest): Promise<User> {
    const response = await this.client.patch<ApiResponse<User>>(
      `/users/${id}`,
      data
    );
    return response.data!;
  }

  async delete(id: string): Promise<void> {
    await this.client.delete(`/users/${id}`);
  }
}

/** 项目服务 */
class ProjectService {
  constructor(private client: HttpClient) {}

  async create(data: CreateProjectRequest): Promise<Project> {
    const response = await this.client.post<ApiResponse<Project>>(
      '/projects',
      data
    );
    return response.data!;
  }

  async findById(id: string): Promise<Project> {
    const response = await this.client.get<ApiResponse<Project>>(
      `/projects/${id}`
    );
    return response.data!;
  }

  async findAll(params?: PaginationParams): Promise<PaginatedResult<Project>> {
    const response = await this.client.get<ApiResponse<PaginatedResult<Project>>>(
      '/projects',
      params as Record<string, string>
    );
    return response.data!;
  }

  async update(id: string, data: Partial<CreateProjectRequest>): Promise<Project> {
    const response = await this.client.patch<ApiResponse<Project>>(
      `/projects/${id}`,
      data
    );
    return response.data!;
  }

  async delete(id: string): Promise<void> {
    await this.client.delete(`/projects/${id}`);
  }
}

// ==================== 主 SDK 类 ====================

/** SDK 主类 */
class MainSdk {
  public auth: AuthService;
  public users: UserService;
  public projects: ProjectService;

  constructor(config: SdkConfig) {
    const client = new HttpClient(config);
    this.auth = new AuthService(client);
    this.users = new UserService(client);
    this.projects = new ProjectService(client);
  }
}

// ==================== 使用示例 ====================

// 创建 SDK 实例
const sdk = new MainSdk({
  baseUrl: 'https://api.example.com',
  apiKey: 'your-api-key',
  timeout: 30000,
  retries: 3,
});

// 登录并获取令牌
async function example() {
  try {
    // 登录
    const token = await sdk.auth.login({
      email: 'user@example.com',
      password: 'password',
    });
    console.log('登录成功:', token.accessToken);

    // 获取当前用户
    const user = await sdk.auth.me();
    console.log('当前用户:', user);

    // 创建用户
    const newUser = await sdk.users.create({
      name: '新用户',
      email: 'new@example.com',
      password: 'password123',
      role: 'editor',
    });
    console.log('创建的用户:', newUser);

    // 获取用户列表
    const { items, total } = await sdk.users.findAll({
      page: 1,
      pageSize: 10,
    });
    console.log(`共 ${total} 个用户`);

    // 创建项目
    const project = await sdk.projects.create({
      name: '我的项目',
      description: '这是一个示例项目',
    });
    console.log('创建的项目:', project);

    // 获取项目列表
    const projects = await sdk.projects.findAll();
    console.log('所有项目:', projects);

  } catch (error) {
    if (error instanceof SdkError) {
      console.error(`SDK 错误 [${error.code}]:`, error.message);
      console.error('状态码:', error.statusCode);
      console.error('响应:', error.response);
    } else {
      console.error('未知错误:', error);
    }
  }
}

// 导出 SDK
export { MainSdk, SdkConfig, SdkError };
export type {
  User,
  Project,
  AuthToken,
  LoginRequest,
  CreateUserRequest,
  UpdateUserRequest,
  CreateProjectRequest,
  PaginationParams,
  PaginatedResult,
  ApiResponse,
};
```

---

## 十、类型测试与类型覆盖

类型测试是确保 TypeScript 类型正确性的重要手段。虽然 TypeScript 编译器已经进行了类型检查，但在某些场景下，我们需要额外的工具来验证类型的正确性。

### 10.1 使用 tsd 进行类型测试

tsd 是一个专门用于测试 TypeScript 类型定义的工具，它允许你编写类型级别的测试用例。

```bash
# 安装 tsd
npm install --save-dev tsd

# 在 package.json 中添加测试脚本
# "test:types": "tsd"
```

```typescript
// types.test-d.ts - 类型测试文件

import { expectType, expectNotType, expectAssignable, expectNotAssignable } from 'tsd';
import { describe, it, expect } from 'vitest';

// ==================== 基础类型测试 ====================

// 测试类型相等
type User = {
  id: string;
  name: string;
  email: string;
};

type Admin = User & {
  permissions: string[];
};

// expectType - 期望类型完全相等
const user: User = { id: '1', name: '张三', email: 'zhang@example.com' };
expectType<User>(user);

// expectAssignable - 期望类型可分配
const admin: Admin = { id: '2', name: '李四', email: 'li@example.com', permissions: ['read', 'write'] };
expectAssignable<User>(admin); // Admin 可分配给 User

// ==================== 工具类型测试 ====================

import { Partial, Required, Pick, Omit, Record } from './types';

// 测试 Partial
type UserPartial = Partial<User>;
expectType<{ id?: string; name?: string; email?: string }>({} as UserPartial);

// 测试 Required
type UserRequired = Required<{ name?: string; email?: string }>;
expectType<{ name: string; email: string }>({} as UserRequired);

// 测试 Pick
type UserNameAndEmail = Pick<User, 'name' | 'email'>;
expectType<{ name: string; email: string }>({} as UserNameAndEmail);

// 测试 Omit
type UserWithoutEmail = Omit<User, 'email'>;
expectType<{ id: string; name: string }>({} as UserWithoutEmail);

// ==================== 条件类型测试 ====================

// 测试 Extract
type T1 = Extract<'a' | 'b' | 'c', 'a' | 'c'>; // 'a' | 'c'
expectType<'a' | 'c'>({} as T1);

// 测试 Exclude
type T2 = Exclude<'a' | 'b' | 'c', 'a' | 'c'>; // 'b'
expectType<'b'>({} as T2);

// 测试 NonNullable
type T3 = NonNullable<string | number | null | undefined>; // string | number
expectType<string | number>({} as T3);

// ==================== 泛型测试 ====================

// 测试数组类型推断
function firstElement<T>(arr: T[]): T | undefined {
  return arr[0];
}

const numbers = [1, 2, 3];
const first = firstElement(numbers);
expectType<number | undefined>(first); // 应该是 number | undefined

const strings = ['a', 'b', 'c'];
const firstStr = firstElement(strings);
expectType<string | undefined>(firstStr); // 应该是 string | undefined

// ==================== 响应类型测试 ====================

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

interface UserResponse extends ApiResponse<User> {}

// 测试泛型扩展
const response: UserResponse = {
  code: 1000,
  message: '成功',
  data: { id: '1', name: '张三', email: 'zhang@example.com' },
};
expectType<User>(response.data);

// ==================== 函数类型测试 ====================

type Callback<T> = (error: Error | null, result?: T) => void;

declare function fetchUser(callback: Callback<User>): void;

// 测试回调函数类型
declare const userCallback: Callback<User>;
expectType<(error: Error | null, result?: User) => void>(userCallback);

// ==================== 装饰器类型测试 ====================

@injectable()
class UserService {
  @inject('ILogger')
  logger: ILogger;

  @logged
  async getUser(id: string): Promise<User> {
    return { id, name: '张三', email: 'zhang@example.com' };
  }
}

// 测试装饰器后的类型
const service = new UserService();
// service.logger 应该是 ILogger 类型
expectType<ILogger>(service.logger);

// ==================== 运行时类型与编译时类型对应测试 ====================

// 确保运行时数据符合编译时类型
const userData = JSON.parse('{"id":"1","name":"张三","email":"zhang@example.com"}');
expectType<User>(userData); // 运行时数据应该符合 User 类型

// 测试 null 安全
const nullableUser = null as User | null;
if (nullableUser !== null) {
  expectType<User>(nullableUser); // 排除 null 后应该是 User
}
```

### 10.2 Vitest 类型测试

Vitest 除了支持常规的单元测试外，还支持类型测试。可以通过 `@vitest/typecheck` 插件启用类型检查。

```bash
# 安装 vitest 类型检查插件
npm install --save-dev @vitest/typecheck
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    typecheck: {
      // tsconfig 文件路径
      tsconfigPath: './tsconfig.json',
    },
  },
});
```

```typescript
// src/__tests__/types.test.ts
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { MyComponent } from '../components/MyComponent';
import type { User } from '../types';

// 类型检查测试
describe('MyComponent 类型检查', () => {
  // 测试 Props 类型
  it('应该正确接收 User 类型的 props', () => {
    const user: User = {
      id: '1',
      name: '张三',
      email: 'zhang@example.com',
    };

    const wrapper = mount(MyComponent, {
      props: { user },
    });

    expect(wrapper.props().user).toEqual(user);
  });

  // 测试 emits 类型
  it('应该正确触发带有类型的 emits', async () => {
    const wrapper = mount(MyComponent, {
      props: { user: { id: '1', name: '张三', email: 'zhang@example.com' } },
    });

    await wrapper.find('button').trigger('click');

    // 检查 emit 的参数类型
    const emitCall = wrapper.emitted('update');
    expect(emitCall).toBeDefined();
    expect(emitCall![0]).toEqual([{ id: '1', name: '张三' }]);
  });
});
```

### 10.3 类型覆盖检查

TypeScript 的 `--noEmit` 选项可以检查类型而不输出文件，结合覆盖率工具可以追踪类型覆盖情况。

```bash
# 检查类型但不输出
npx tsc --noEmit --pretty

# 使用 type-coverage 工具检查类型覆盖
npm install --save-dev type-coverage
npx type-coverage --detail
```

```typescript
// type-coverage 配置 (package.json 或 .typecoveragerc)
{
  "typeCoverage": {
    "ignoreFiles": ["**/*.d.ts", "**/node_modules/**"],
    "ignoreCases": ["TODO", "any"],
    "report": true,
    "atLeast": 0.95
  }
}
```

### 10.4 实战：类型安全测试套件

以下是一个完整的类型测试套件实现，展示了如何系统性地测试 TypeScript 类型：

```typescript
// ==================== types.test.ts ====================

import { describe, it, expectType, expectAssignable } from 'vitest';

// ==================== 基础工具类型测试 ====================

import type {
  // 基础类型
  StringOrNumber,
  NonEmptyString,
  PositiveInteger,

  // 工具类型
  DeepPartial,
  DeepReadonly,
  DeepRequired,
  JsonSchema,

  // 函数类型
  AsyncFunction,
  ThrottleFunction,
  DebounceFunction,

  // 业务类型
  User,
  Order,
  ApiResponse,
} from '../types';

// 基础类型测试
describe('基础类型', () => {
  it('StringOrNumber 应该是 string 或 number', () => {
    const value1: StringOrNumber = 'hello';
    const value2: StringOrNumber = 123;
    // @ts-expect-error 应该是 string 或 number
    const value3: StringOrNumber = true;
  });

  it('NonEmptyString 应该是非空字符串', () => {
    const value: NonEmptyString = 'hello';
    // @ts-expect-error 空字符串应该报错
    const empty: NonEmptyString = '';
  });

  it('PositiveInteger 应该是正整数', () => {
    const value: PositiveInteger = 1;
    // @ts-expect-error 0 应该报错
    const zero: PositiveInteger = 0;
    // @ts-expect-error 负数应该报错
    const negative: PositiveInteger = -1;
    // @ts-expect-error 浮点数应该报错
    const float: PositiveInteger = 1.5;
  });
});

// 深度工具类型测试
describe('深度工具类型', () => {
  interface NestedObject {
    user: {
      name: string;
      address: {
        city: string;
        zip?: string;
      };
    };
    tags: string[];
  }

  it('DeepPartial 应该递归地将所有属性设为可选', () => {
    const partial: DeepPartial<NestedObject> = {
      user: {
        name: '张三',
        // address 可选
        // city 可选
        // zip 可选
      },
      // tags 可选
    };

    expectAssignable<DeepPartial<NestedObject>>(partial);
  });

  it('DeepReadonly 应该递归地将所有属性设为只读', () => {
    const readonly: DeepReadonly<NestedObject> = {
      user: {
        name: '张三',
        address: {
          city: '北京',
        },
      },
      tags: ['a', 'b'],
    };

    // @ts-expect-error 尝试修改只读属性应该报错
    readonly.user.name = '李四';

    // @ts-expect-error 尝试修改嵌套只读属性应该报错
    readonly.user.address.city = '上海';
  });

  it('DeepRequired 应该递归地将所有属性设为必需', () => {
    const required: DeepRequired<NestedObject> = {
      user: {
        name: '张三', // 现在是必需的
        address: {
          city: '北京', // 现在是必需的
          zip: '100000', // 现在是必需的
        },
      },
      tags: ['a', 'b'], // 现在是必需的
    };

    expectAssignable<DeepRequired<NestedObject>>(required);
  });
});

// 函数类型测试
describe('函数类型', () => {
  it('AsyncFunction 应该正确类型化异步函数', () => {
    const asyncFunc: AsyncFunction<User> = async (id: string) => {
      return {
        id,
        name: '张三',
        email: 'zhang@example.com',
      };
    };

    // 返回类型应该是 Promise<User>
    expectType<Promise<User>>(asyncFunc('1'));
  });

  it('ThrottleFunction 应该正确包装函数', () => {
    const original = (name: string) => console.log(name);
    const throttled: ThrottleFunction<typeof original> = original;

    // 第一次调用应该执行
    throttled('第一次');
  });

  it('DebounceFunction 应该正确包装函数', () => {
    const original = (name: string) => console.log(name);
    const debounced: DebounceFunction<typeof original> = original;

    // 延迟调用应该被防抖
    debounced('第一次');
  });
});

// API 类型测试
describe('API 类型', () => {
  it('ApiResponse 应该正确包装数据', () => {
    const response: ApiResponse<User> = {
      code: 1000,
      message: '成功',
      data: {
        id: '1',
        name: '张三',
        email: 'zhang@example.com',
      },
    };

    expectType<number>(response.code);
    expectType<string>(response.message);
    expectType<User | undefined>(response.data);
  });

  it('ApiResponse 应该支持泛型嵌套', () => {
    type PaginatedUsersResponse = ApiResponse<{
      items: User[];
      total: number;
    }>;

    const response: PaginatedUsersResponse = {
      code: 1000,
      message: '成功',
      data: {
        items: [
          { id: '1', name: '张三', email: 'zhang@example.com' },
          { id: '2', name: '李四', email: 'li@example.com' },
        ],
        total: 2,
      },
    };

    expectType<User[]>(response.data?.items);
    expectType<number>(response.data?.total);
  });
});

// 业务类型测试
describe('业务类型', () => {
  it('User 类型应该包含所有必需字段', () => {
    const user: User = {
      id: '1',
      name: '张三',
      email: 'zhang@example.com',
      role: 'admin',
      status: 'active',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    expectAssignable<User>(user);
  });

  it('Order 状态转换应该类型安全', () => {
    type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

    const transitions: Record<OrderStatus, OrderStatus[]> = {
      pending: ['paid', 'cancelled'],
      paid: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: [],
    };

    function canTransition(from: OrderStatus, to: OrderStatus): boolean {
      return transitions[from].includes(to);
    }

    // 有效转换
    expectType<boolean>(canTransition('pending', 'paid'));
    expectType<boolean>(canTransition('paid', 'shipped'));

    // 无效转换应该被类型系统捕获
    // @ts-expect-error pending 不能直接转为 delivered
    canTransition('pending', 'delivered');
  });
});
```

---

## 十一、最佳实践与类型思维

TypeScript 的最终目标是帮助开发者编写更好的代码。掌握语法只是基础，建立正确的类型思维才是关键。本章将分享在实际项目中积累的最佳实践和思考。

### 11.1 any vs unknown 的抉择

这是 TypeScript 中最常被问到的问题之一。选择正确的不确定性类型能够显著提升代码的类型安全性。

```typescript
// ==================== any 类型 - 绕过所有类型检查 ====================

// any 的问题
function processValue(value: any) {
  // 没有任何类型检查
  value.foo(); // OK - 不会报错
  value.bar.baz; // OK - 不会报错
  value(); // OK - 不会报错
}

// 使用 any 意味着放弃 TypeScript 的优势
const user: any = getUser();
user.name; // 没有提示
user.invalidProp; // 不会报错
```

```typescript
// ==================== unknown 类型 - 类型安全的"any" ====================

// unknown 强制进行类型检查
function processValue(value: unknown) {
  // 在使用前必须进行类型检查
  if (typeof value === 'string') {
    // 这里 value 被收窄为 string
    console.log(value.toUpperCase());
  } else if (typeof value === 'number') {
    // 这里 value 被收窄为 number
    console.log(value.toFixed(2));
  } else if (Array.isArray(value)) {
    // 这里 value 被收窄为 array
    console.log(value.length);
  } else {
    // value 是其他类型
    throw new Error('不支持的类型');
  }
}
```

```typescript
// ==================== 选择原则 ====================

// 应该使用 any 的场景：
// 1. 迁移 JavaScript 项目时
// 2. 快速原型开发时
// 3. 复杂类型难以表达时（但这通常意味着需要重构）

// 更好的做法：使用 unknown + 类型守卫

// ❌ 不好的做法
function parseJSON(json: string): any {
  return JSON.parse(json);
}

// ✅ 好的做法
function parseJSON(json: string): unknown {
  return JSON.parse(json);
}

// 使用时必须类型检查
const data = parseJSON('{"name":"张三"}');
if (typeof data === 'object' && data !== null && 'name' in data) {
  console.log((data as { name: string }).name);
}
```

```typescript
// ==================== unknown 与类型断言 ====================

// 使用类型断言时要谨慎
function processValue(value: unknown) {
  // 不安全的断言 - 如果 value 不是 User 会出问题
  const user = value as User;

  // 更好的做法：先检查
  if (isUser(value)) {
    // 这里可以安全地使用 value
    console.log(value.name);
  }
}

// 类型守卫函数
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'email' in value
  );
}
```

### 11.2 类型推断的智慧

TypeScript 的类型推断能力可以减少冗余的类型标注，同时保持类型安全。学会信任推断并善用它。

```typescript
// ==================== 信任类型推断 ====================

// TypeScript 能够推断出大部分类型
const numbers = [1, 2, 3]; // number[]
const doubled = numbers.map(n => n * 2); // number[]

// 对象字面量的类型推断
const user = {
  name: '张三',
  age: 30,
}; // { name: string; age: number }

// 函数返回类型推断
function createUser(name: string, age: number) {
  return { name, age, id: crypto.randomUUID() };
}
// 返回类型被推断为 { name: string; age: number; id: string }

// ==================== 需要显式标注的场景 ====================

// 1. 函数参数需要泛型时
function firstElement<T>(arr: T[]): T | undefined {
  return arr[0];
}

// 2. API 返回类型复杂时
interface ApiResponse<T> {
  data: T;
  meta: {
    page: number;
    total: number;
  };
}

async function fetchData(): Promise<ApiResponse<User[]>> {
  const response = await fetch('/api/users');
  return response.json();
}

// 3. 类属性需要明确类型时
class Cache {
  private store: Map<string, unknown> = new Map();

  get<T>(key: string): T | undefined {
    return this.store.get(key) as T | undefined;
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, value);
  }
}

// ==================== 类型推断的陷阱 ====================

// 1. 延迟求值导致的推断问题
const fn = () => ({});
const obj = { fn }; // { fn: () => { id: string } }
obj.fn().id; // OK - fn 返回的 { id: string }

// 但如果是数组中会失去上下文
const fns = [() => ({ id: '1' }), () => ({ id: '2' })];
fns[0](); // { id: string } | { id: string }

// 2. 字面量类型的推断
function handleStatus(status: 'pending' | 'success' | 'error') {
  // ...
}

// TypeScript 会推断字面量类型
const status1 = 'pending'; // type: 'pending'
handleStatus(status1); // OK

const status2 = getStatus(); // 如果返回 string，则需要转换
handleStatus(status2 as 'pending' | 'success' | 'error');

// 3. 联合类型的推断
type Result = { type: 'success'; data: User } | { type: 'error'; error: Error };

// TypeScript 正确推断
function process(result: Result) {
  if (result.type === 'success') {
    console.log(result.data); // User
  } else {
    console.log(result.error); // Error
  }
}
```

### 11.3 泛型约束的艺术

好的泛型约束能够在灵活性和安全性之间找到平衡点。

```typescript
// ==================== 适度约束 ====================

// ❌ 过度约束 - 限制了泛型的通用性
function processArray1<T extends number[]>(arr: T): T {
  return arr.map(n => n * 2); // 只接受 number[] 的子类型
}

// ✅ 适度约束 - 根据实际需求约束
function processArray2<T extends readonly number[]>(arr: T): T {
  return arr.map(n => n * 2) as unknown as T;
}

// ✅ 最小约束 - 只约束必需的属性
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// ==================== 约束的位置 ====================

// 约束可以放在多个位置
// 1. 函数签名中直接约束
function longestItem<T extends { length: number }>(a: T, b: T): T {
  return a.length > b.length ? a : b;
}

// 2. 使用 extends 分号
function identity<T>(arg: T): T {
  return arg;
}

interface Lengthwise {
  length: number;
}

function loggingIdentity<T extends Lengthwise>(arg: T): T {
  console.log(arg.length);
  return arg;
}

// 3. 多重约束
function merge<T extends object, U extends object>(target: T, source: U): T & U {
  return { ...target, ...source };
}

// ==================== 泛型默认类型 ====================

interface Response<T = any> {
  code: number;
  message: string;
  data: T;
}

// 使用默认类型
const response: Response = {
  code: 1000,
  message: '成功',
  data: '任意类型',
};

// 指定类型
const userResponse: Response<User> = {
  code: 1000,
  message: '成功',
  data: { id: '1', name: '张三', email: 'zhang@example.com' },
};
```

### 11.4 类型是文档

TypeScript 的类型系统本质上是一种文档形式。良好的类型设计能够让代码自解释，减少沟通成本。

```typescript
// ==================== 类型即文档 ====================

// ❌ 不好的类型设计 - 无法传达意图
interface Config {
  a: string;
  b: number;
  c: boolean;
  d: any;
}

// ✅ 好的类型设计 - 清晰表达意图
interface ApiConfig {
  /** API 基础地址 */
  baseUrl: string;

  /** API 密钥 */
  apiKey: string;

  /** 请求超时时间（毫秒） */
  timeout: number;

  /** 是否启用调试模式 */
  debug: boolean;

  /** 自定义请求头 */
  headers?: Record<string, string>;

  /** 重试次数 */
  retries?: number;
}
```

```typescript
// ==================== 使用 JSDoc 增强类型文档 ====================

interface User {
  /**
   * 用户唯一标识符
   * @example 'usr_abc123'
   */
  id: string;

  /**
   * 用户显示名称
   * @minLength 2
   * @maxLength 50
   */
  name: string;

  /**
   * 用户邮箱地址
   * @format email
   */
  email: string;

  /**
   * 用户角色
   * @default 'viewer'
   */
  role: 'admin' | 'editor' | 'viewer';

  /**
   * 用户状态
   * @see UserStatus
   */
  status: 'active' | 'inactive' | 'suspended';

  /**
   * 创建时间
   * @format date-time
   */
  createdAt: string;

  /**
   * 最后登录时间
   * @format date-time
   * @optional
   */
  lastLoginAt?: string;
}

/**
 * 用户状态枚举
 * @enum {string}
 */
enum UserStatus {
  /** 正常状态，可以正常登录和使用 */
  Active = 'active',

  /** 未激活状态，需要邮箱验证 */
  Inactive = 'inactive',

  /** 被封禁状态，无法登录 */
  Suspended = 'suspended',
}
```

```typescript
// ==================== Branded Types 防止误用 ====================

// 原始类型可以通过 branded types 添加语义
type UserId = string & { readonly __brand: 'UserId' };
type OrderId = string & { readonly __brand: 'OrderId' };
type ProductId = string & { readonly __brand: 'ProductId' };

// 创建 branded types 的函数
function createUserId(id: string): UserId {
  return id as UserId;
}

function createOrderId(id: string): OrderId {
  return id as OrderId;
}

// 使用 branded types
function getUser(userId: UserId): User {
  // ...
}

function getOrder(orderId: OrderId): Order {
  // ...
}

// 现在 TypeScript 会防止误用
const userId = createUserId('usr_123');
const orderId = createOrderId('ord_456');

getUser(userId); // OK
getUser(orderId); // ❌ 错误！OrderId 不能赋值给 UserId

// ==================== 模板字面量类型 ====================

// 使用模板字面量类型添加前缀
type UserId = `usr_${string}`;
type OrderId = `ord_${string}`;
type ProductId = `prd_${string}`;

function processUserId(id: UserId) {
  console.log('处理用户:', id);
}

const validId: UserId = 'usr_abc123';
processUserId(validId); // OK

const invalidId = 'usr_'; // 类型错误 - 不能是空字符串
processUserId('ord_123'); // 类型错误 - 必须是 usr_ 开头
```

### 11.5 我的思考：类型是文档

类型系统不仅是 TypeScript 的语法特性，更是一种表达意图和约束的语言。优秀的 TypeScript 代码应该能够通过类型声明讲述业务逻辑的故事。

```typescript
// ==================== 类型驱动的开发 ====================

// 传统方式：先写实现，后补类型
function createUser(name, email, role) {
  return { name, email, role };
}

// 类型驱动方式：先定义类型，再实现逻辑
type CreateUserInput = {
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
};

function createUser(input: CreateUserInput): User {
  // 验证和处理逻辑
  return { id: generateId(), ...input, status: 'active', createdAt: new Date() };
}

// ==================== 类型优先的设计 ====================

// 1. 从业务模型开始设计类型
interface BlogPost {
  id: string;
  title: string;
  content: string;
  author: User;
  status: PostStatus;
  tags: Tag[];
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// 2. 定义状态机
type PostStatus = 'draft' | 'reviewing' | 'published' | 'archived';

// 3. 定义状态转换规则
type StatusTransition = {
  from: PostStatus;
  to: PostStatus;
  action: string;
  guard?: (post: BlogPost) => boolean;
};

const TRANSITIONS: StatusTransition[] = [
  { from: 'draft', to: 'reviewing', action: '提交审核' },
  { from: 'reviewing', to: 'published', action: '审核通过', guard: (p) => p.content.length > 0 },
  { from: 'reviewing', to: 'draft', action: '审核拒绝' },
  { from: 'published', to: 'archived', action: '归档' },
];

// 4. 实现状态转换函数
function canTransition(post: BlogPost, targetStatus: PostStatus): boolean {
  const transition = TRANSITIONS.find(t => t.from === post.status);
  return transition?.to.includes(targetStatus) && (transition.guard?.(post) ?? true);
}

// ==================== 类型系统的价值 ====================

// 类型系统帮助我们思考：
// 1. 数据结构 - 我需要什么数据？
// 2. 约束条件 - 数据有什么限制？
// 3. 状态变化 - 数据如何转换？
// 4. 边界情况 - 可能出现什么错误？

// 类型是最好的文档：
// - 与代码同步更新
// - 编译器验证
// - IDE 支持
// - 重构时自动更新
```

---

## 十二、实战案例：类型化 SDK 开发

本章将通过一个完整的 SDK 开发案例，展示如何将本书所有知识点综合应用，构建一个生产级别的类型化 SDK。

### 12.1 SDK 需求分析

我们将要构建的是一个电商后端 SDK，用于管理商品、订单、用户等业务实体。这个 SDK 需要具备以下特性：

- 完整的类型安全
- 链式 API 调用
- 错误处理机制
- 请求拦截器
- 响应缓存
- 分页处理

### 12.2 类型定义层

```typescript
// ==================== sdk/types.ts ====================

// ==================== 基础类型 ====================

/** SDK 配置 */
export interface SdkConfig {
  /** API 基础地址 */
  baseUrl: string;
  /** API 密钥 */
  apiKey: string;
  /** API 密钥 ID */
  apiSecret?: string;
  /** 请求超时（毫秒） */
  timeout?: number;
  /** 重试次数 */
  retries?: number;
  /** 默认分页大小 */
  defaultPageSize?: number;
  /** 调试模式 */
  debug?: boolean;
  /** 自定义请求头 */
  headers?: Record<string, string>;
  /** 存储适配器 */
  storage?: StorageAdapter;
}

/** 存储适配器接口 */
export interface StorageAdapter {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttl?: number): void;
  delete(key: string): void;
  clear(): void;
}

// ==================== 错误类型 ====================

/** 错误代码 */
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/** SDK 错误 */
export class SdkError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public statusCode: number,
    public details?: Record<string, any>,
    public requestId?: string
  ) {
    super(message);
    this.name = 'SdkError';
    Error.captureStackTrace(this, this.constructor);
  }

  static fromResponse(response: ApiErrorResponse, statusCode: number): SdkError {
    return new SdkError(
      response.message || '请求失败',
      response.code as ErrorCode || ErrorCode.UNKNOWN_ERROR,
      statusCode,
      response.details,
      response.requestId
    );
  }

  static networkError(cause: Error): SdkError {
    return new SdkError(
      cause.message || '网络错误',
      ErrorCode.NETWORK_ERROR,
      0
    );
  }

  static timeoutError(): SdkError {
    return new SdkError(
      '请求超时',
      ErrorCode.TIMEOUT_ERROR,
      408
    );
  }
}

/** API 错误响应 */
export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: Record<string, any>;
  requestId?: string;
}

// ==================== 业务模型类型 ====================

/** 用户角色 */
export type UserRole = 'admin' | 'manager' | 'staff' | 'customer';

/** 用户状态 */
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'deleted';

/** 用户 */
export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

/** 创建用户请求 */
export interface CreateUserRequest {
  username: string;
  email: string;
  phone?: string;
  password: string;
  role?: UserRole;
  metadata?: Record<string, any>;
}

/** 更新用户请求 */
export interface UpdateUserRequest {
  email?: string;
  phone?: string;
  avatar?: string;
  role?: UserRole;
  status?: UserStatus;
  metadata?: Record<string, any>;
}

/** 认证令牌 */
export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  issuedAt: number;
}

/** 登录请求 */
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// ==================== 商品类型 ====================

/** 商品状态 */
export type ProductStatus = 'draft' | 'active' | 'inactive' | 'deleted';

/** 商品 */
export interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number; // 价格，单位：分
  costPrice?: number; // 成本价
  stock: number;
  categoryId: string;
  images: string[];
  tags: string[];
  status: ProductStatus;
  attributes?: Record<string, string>;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

/** 创建商品请求 */
export interface CreateProductRequest {
  name: string;
  description?: string;
  sku: string;
  price: number;
  costPrice?: number;
  stock?: number;
  categoryId: string;
  images?: string[];
  tags?: string[];
  attributes?: Record<string, string>;
  metadata?: Record<string, any>;
}

/** 更新商品请求 */
export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  costPrice?: number;
  stock?: number;
  categoryId?: string;
  images?: string[];
  tags?: string[];
  status?: ProductStatus;
  attributes?: Record<string, string>;
  metadata?: Record<string, any>;
}

// ==================== 订单类型 ====================

/** 订单状态 */
export type OrderStatus =
  | 'pending'      // 待支付
  | 'paid'         // 已支付
  | 'preparing'    // 备货中
  | 'shipped'      // 已发货
  | 'delivered'   // 已送达
  | 'completed'    // 已完成
  | 'cancelled'   // 已取消
  | 'refunded';    // 已退款

/** 订单项 */
export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  sku: string;
  price: number;
  quantity: number;
  subtotal: number;
  attributes?: Record<string, string>;
}

/** 收货地址 */
export interface ShippingAddress {
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  streetAddress: string;
  postalCode: string;
  isDefault?: boolean;
}

/** 订单 */
export interface Order {
  id: string;
  orderNo: string;
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  discountAmount: number;
  freightAmount: number;
  finalAmount: number;
  shippingAddress: ShippingAddress;
  remark?: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

/** 创建订单请求 */
export interface CreateOrderRequest {
  items: Array<{
    productId: string;
    quantity: number;
    sku?: string;
    attributes?: Record<string, string>;
  }>;
  shippingAddress: ShippingAddress;
  remark?: string;
  couponCode?: string;
}

/** 订单状态转换 */
export interface OrderStatusTransition {
  from: OrderStatus;
  to: OrderStatus;
  action: string;
  guard?: (order: Order) => boolean;
}

// ==================== API 响应类型 ====================

/** API 响应 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiErrorResponse;
  meta?: ResponseMeta;
  requestId?: string;
}

/** 响应元数据 */
export interface ResponseMeta {
  requestId?: string;
  timestamp?: number;
  [key: string]: any;
}

/** 分页参数 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

/** 分页结果 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ==================== 拦截器类型 ====================

/** 请求拦截器 */
export type RequestInterceptor = (
  config: RequestConfig
) => RequestConfig | Promise<RequestConfig>;

/** 响应拦截器 */
export type ResponseInterceptor<T = any> = (
  response: ApiResponse<T>
) => ApiResponse<T> | Promise<ApiResponse<T>>;

/** 错误拦截器 */
export type ErrorInterceptor = (
  error: SdkError
) => SdkError | Promise<SdkError>;

/** 请求配置 */
export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  params?: Record<string, any>;
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
  retry?: boolean;
}
```

### 12.3 核心实现

```typescript
// ==================== sdk/core.ts ====================

import {
  SdkConfig,
  SdkError,
  ErrorCode,
  ApiResponse,
  ApiErrorResponse,
  RequestConfig,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
  AuthToken,
  StorageAdapter,
} from './types';

// ==================== 存储适配器 ====================

/** LocalStorage 存储适配器 */
export class LocalStorageAdapter implements StorageAdapter {
  get<T>(key: string): T | null {
    const item = localStorage.getItem(key);
    if (!item) return null;

    try {
      const { value, expiry } = JSON.parse(item);
      if (expiry && Date.now() > expiry) {
        localStorage.removeItem(key);
        return null;
      }
      return value as T;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T, ttl?: number): void {
    const item = {
      value,
      expiry: ttl ? Date.now() + ttl : null,
    };
    localStorage.setItem(key, JSON.stringify(item));
  }

  delete(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }
}

// ==================== HTTP 客户端 ====================

export class HttpClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;
  private retries: number;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  constructor(config: SdkConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 0;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'X-API-Key': config.apiKey,
      ...config.headers,
    };
  }

  // 拦截器管理
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  // 核心请求方法
  async request<T>(config: RequestConfig): Promise<T> {
    // 应用请求拦截器
    let finalConfig = config;
    for (const interceptor of this.requestInterceptors) {
      finalConfig = await interceptor(finalConfig);
    }

    const { method, path, params, body, headers, timeout, retry = true } = finalConfig;

    // 构建 URL
    const url = new URL(this.baseUrl + path);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    // 构建请求头
    const requestHeaders: Record<string, string> = {
      ...this.defaultHeaders,
      ...headers,
    };

    // 构建请求配置
    const requestInit: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body && method !== 'GET') {
      requestInit.body = JSON.stringify(body);
    }

    // 发送请求（带重试）
    let lastError: SdkError;
    const maxAttempts = retry ? this.retries + 1 : 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url.toString(), {
          ...requestInit,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // 解析响应
        const data: ApiResponse<T> = await response.json();

        // 检查业务错误
        if (!response.ok || !data.success) {
          const error = SdkError.fromResponse(
            data.error || { code: 'UNKNOWN', message: '未知错误' },
            response.status
          );

          // 应用错误拦截器
          throw await this.applyErrorInterceptors(error);
        }

        // 应用响应拦截器
        for (const interceptor of this.responseInterceptors) {
          data.data = await interceptor(data as any);
        }

        return data.data as T;

      } catch (error) {
        if (error instanceof SdkError) {
          // 如果是 SDK 错误，不重试
          throw await this.applyErrorInterceptors(error);
        }

        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            lastError = SdkError.timeoutError();
          } else {
            lastError = SdkError.networkError(error);
          }
        } else {
          lastError = new SdkError(
            '未知错误',
            ErrorCode.UNKNOWN_ERROR,
            0
          );
        }

        // 应用错误拦截器
        const interceptedError = await this.applyErrorInterceptors(lastError);

        // 如果不是网络错误，不重试
        if (interceptedError.code !== ErrorCode.NETWORK_ERROR) {
          throw interceptedError;
        }

        // 指数退避
        if (attempt < maxAttempts - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 100)
          );
        }
      }
    }

    throw await this.applyErrorInterceptors(lastError!);
  }

  private async applyErrorInterceptors(error: SdkError): Promise<SdkError> {
    let finalError = error;
    for (const interceptor of this.errorInterceptors) {
      finalError = await interceptor(finalError);
    }
    return finalError;
  }

  // HTTP 方法便捷方法
  get<T>(path: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>({ method: 'GET', path, params });
  }

  post<T>(path: string, body?: any): Promise<T> {
    return this.request<T>({ method: 'POST', path, body });
  }

  put<T>(path: string, body?: any): Promise<T> {
    return this.request<T>({ method: 'PUT', path, body });
  }

  patch<T>(path: string, body?: any): Promise<T> {
    return this.request<T>({ method: 'PATCH', path, body });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>({ method: 'DELETE', path });
  }
}

// ==================== 认证管理器 ====================

export class AuthManager {
  private storage: StorageAdapter;
  private storageKey = 'auth_token';
  private token: AuthToken | null = null;
  private refreshPromise: Promise<AuthToken> | null = null;

  constructor(storage?: StorageAdapter) {
    this.storage = storage || new LocalStorageAdapter();
    this.loadToken();
  }

  private loadToken(): void {
    const token = this.storage.get<AuthToken>(this.storageKey);
    if (token && this.isTokenValid(token)) {
      this.token = token;
    }
  }

  private saveToken(token: AuthToken): void {
    this.token = token;
    this.storage.set(this.storageKey, token, token.expiresIn * 1000);
  }

  private isTokenValid(token: AuthToken): boolean {
    const now = Date.now();
    const expiresAt = token.issuedAt + token.expiresIn * 1000;
    return expiresAt > now;
  }

  getAccessToken(): string | null {
    return this.token?.accessToken || null;
  }

  getRefreshToken(): string | null {
    return this.token?.refreshToken || null;
  }

  setToken(token: AuthToken): void {
    this.saveToken(token);
  }

  clearToken(): void {
    this.token = null;
    this.storage.delete(this.storageKey);
  }

  async refreshTokenIfNeeded(client: HttpClient): Promise<string> {
    if (!this.token) {
      throw new SdkError('未登录', ErrorCode.AUTHENTICATION_ERROR, 401);
    }

    const expiresAt = this.token.issuedAt + this.token.expiresIn * 1000;
    const bufferTime = 5 * 60 * 1000; // 5分钟缓冲

    // Token 仍然有效
    if (expiresAt - Date.now() > bufferTime) {
      return this.token.accessToken;
    }

    // 防止并发刷新
    if (this.refreshPromise) {
      const token = await this.refreshPromise;
      return token.accessToken;
    }

    // 发起刷新请求
    this.refreshPromise = this.doRefreshToken(client);
    try {
      const newToken = await this.refreshPromise;
      return newToken.accessToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async doRefreshToken(client: HttpClient): Promise<AuthToken> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new SdkError('刷新令牌不存在', ErrorCode.AUTHENTICATION_ERROR, 401);
    }

    const response = await client.post<ApiResponse<AuthToken>>('/auth/refresh', {
      refreshToken,
    });

    if (!response.data) {
      throw new SdkError('刷新令牌失败', ErrorCode.AUTHENTICATION_ERROR, 401);
    }

    this.setToken(response.data);
    return response.data;
  }
}

// ==================== SDK 主类 ====================

export class EcommerceSdk {
  private config: SdkConfig;
  private httpClient: HttpClient;
  private authManager: AuthManager;

  constructor(config: SdkConfig) {
    this.config = config;
    this.httpClient = new HttpClient(config);
    this.authManager = new AuthManager(config.storage);

    // 添加认证拦截器
    this.httpClient.addRequestInterceptor(async (config) => {
      const token = await this.authManager.refreshTokenIfNeeded(this.httpClient);
      return {
        ...config,
        headers: {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        },
      };
    });

    // 添加调试日志
    if (config.debug) {
      this.httpClient.addRequestInterceptor((config) => {
        console.log(`[SDK] ${config.method} ${config.path}`, config);
        return config;
      });
      this.httpClient.addResponseInterceptor((response) => {
        console.log('[SDK] Response:', response);
        return response;
      });
    }
  }

  // 获取 HTTP 客户端
  getHttpClient(): HttpClient {
    return this.httpClient;
  }

  // 获取认证管理器
  getAuthManager(): AuthManager {
    return this.authManager;
  }

  // 添加拦截器
  use(interceptor: {
    request?: RequestInterceptor;
    response?: ResponseInterceptor;
    error?: ErrorInterceptor;
  }): this {
    if (interceptor.request) {
      this.httpClient.addRequestInterceptor(interceptor.request);
    }
    if (interceptor.response) {
      this.httpClient.addResponseInterceptor(interceptor.response);
    }
    if (interceptor.error) {
      this.httpClient.addErrorInterceptor(interceptor.error);
    }
    return this;
  }
}
```

### 12.4 服务层实现

```typescript
// ==================== sdk/services.ts ====================

import {
  EcommerceSdk,
  HttpClient,
  AuthManager,
} from './core';

import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  LoginRequest,
  AuthToken,
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  Order,
  CreateOrderRequest,
  OrderStatus,
  OrderStatusTransition,
  PaginatedResult,
  PaginationParams,
  ApiResponse,
  SdkError,
  ErrorCode,
} from './types';

// ==================== 认证服务 ====================

export class AuthService {
  constructor(
    private client: HttpClient,
    private authManager: AuthManager
  ) {}

  async login(credentials: LoginRequest): Promise<AuthToken> {
    const response = await this.client.post<ApiResponse<AuthToken>>(
      '/auth/login',
      credentials
    );

    if (!response.data) {
      throw new SdkError('登录失败', ErrorCode.AUTHENTICATION_ERROR, 401);
    }

    this.authManager.setToken(response.data);
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
    } finally {
      this.authManager.clearToken();
    }
  }

  async refreshToken(): Promise<AuthToken> {
    // 由 AuthManager 处理
    throw new Error('请使用 Sdk 的 AuthManager');
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<ApiResponse<User>>('/auth/me');
    if (!response.data) {
      throw new SdkError('获取用户信息失败', ErrorCode.AUTHENTICATION_ERROR, 401);
    }
    return response.data;
  }

  isAuthenticated(): boolean {
    return !!this.authManager.getAccessToken();
  }
}

// ==================== 用户服务 ====================

export class UserService {
  constructor(private client: HttpClient) {}

  async findById(id: string): Promise<User> {
    const response = await this.client.get<ApiResponse<User>>(`/users/${id}`);
    if (!response.data) {
      throw new SdkError('用户不存在', ErrorCode.NOT_FOUND, 404);
    }
    return response.data;
  }

  async findAll(params?: PaginationParams & {
    role?: User['role'];
    status?: User['status'];
  }): Promise<PaginatedResult<User>> {
    const response = await this.client.get<ApiResponse<PaginatedResult<User>>>(
      '/users',
      params as Record<string, string>
    );
    if (!response.data) {
      throw new SdkError('获取用户列表失败', ErrorCode.UNKNOWN_ERROR, 500);
    }
    return response.data;
  }

  async create(data: CreateUserRequest): Promise<User> {
    const response = await this.client.post<ApiResponse<User>>('/users', data);
    if (!response.data) {
      throw new SdkError('创建用户失败', ErrorCode.VALIDATION_ERROR, 400);
    }
    return response.data;
  }

  async update(id: string, data: UpdateUserRequest): Promise<User> {
    const response = await this.client.patch<ApiResponse<User>>(
      `/users/${id}`,
      data
    );
    if (!response.data) {
      throw new SdkError('更新用户失败', ErrorCode.VALIDATION_ERROR, 400);
    }
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await this.client.delete(`/users/${id}`);
  }
}

// ==================== 商品服务 ====================

export class ProductService {
  constructor(private client: HttpClient) {}

  async findById(id: string): Promise<Product> {
    const response = await this.client.get<ApiResponse<Product>>(
      `/products/${id}`
    );
    if (!response.data) {
      throw new SdkError('商品不存在', ErrorCode.NOT_FOUND, 404);
    }
    return response.data;
  }

  async findAll(params?: PaginationParams & {
    categoryId?: string;
    status?: Product['status'];
    minPrice?: number;
    maxPrice?: number;
    keyword?: string;
  }): Promise<PaginatedResult<Product>> {
    const response = await this.client.get<ApiResponse<PaginatedResult<Product>>>(
      '/products',
      params as Record<string, string>
    );
    if (!response.data) {
      throw new SdkError('获取商品列表失败', ErrorCode.UNKNOWN_ERROR, 500);
    }
    return response.data;
  }

  async create(data: CreateProductRequest): Promise<Product> {
    const response = await this.client.post<ApiResponse<Product>>(
      '/products',
      data
    );
    if (!response.data) {
      throw new SdkError('创建商品失败', ErrorCode.VALIDATION_ERROR, 400);
    }
    return response.data;
  }

  async update(id: string, data: UpdateProductRequest): Promise<Product> {
    const response = await this.client.patch<ApiResponse<Product>>(
      `/products/${id}`,
      data
    );
    if (!response.data) {
      throw new SdkError('更新商品失败', ErrorCode.VALIDATION_ERROR, 400);
    }
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await this.client.delete(`/products/${id}`);
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    return this.update(id, { stock: quantity } as any);
  }
}

// ==================== 订单服务 ====================

export class OrderService {
  private static readonly STATUS_TRANSITIONS: OrderStatusTransition[] = [
    { from: 'pending', to: ['paid', 'cancelled'], action: '支付' },
    { from: 'paid', to: ['preparing', 'cancelled'], action: '开始备货' },
    { from: 'preparing', to: ['shipped'], action: '发货' },
    { from: 'shipped', to: ['delivered'], action: '送达' },
    { from: 'delivered', to: ['completed'], action: '确认收货' },
    { from: 'pending', to: ['paid'], action: '支付' },
    { from: 'paid', to: ['refunded'], action: '退款' },
  ];

  constructor(private client: HttpClient) {}

  async findById(id: string): Promise<Order> {
    const response = await this.client.get<ApiResponse<Order>>(`/orders/${id}`);
    if (!response.data) {
      throw new SdkError('订单不存在', ErrorCode.NOT_FOUND, 404);
    }
    return response.data;
  }

  async findByOrderNo(orderNo: string): Promise<Order> {
    const response = await this.client.get<ApiResponse<Order>>(
      `/orders/by-order-no/${orderNo}`
    );
    if (!response.data) {
      throw new SdkError('订单不存在', ErrorCode.NOT_FOUND, 404);
    }
    return response.data;
  }

  async findAll(params?: PaginationParams & {
    userId?: string;
    status?: OrderStatus;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResult<Order>> {
    const response = await this.client.get<ApiResponse<PaginatedResult<Order>>>(
      '/orders',
      params as Record<string, string>
    );
    if (!response.data) {
      throw new SdkError('获取订单列表失败', ErrorCode.UNKNOWN_ERROR, 500);
    }
    return response.data;
  }

  async create(data: CreateOrderRequest): Promise<Order> {
    const response = await this.client.post<ApiResponse<Order>>('/orders', data);
    if (!response.data) {
      throw new SdkError('创建订单失败', ErrorCode.VALIDATION_ERROR, 400);
    }
    return response.data;
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    // 类型安全的订单状态转换检查
    const order = await this.findById(id);
    const transition = OrderService.STATUS_TRANSITIONS.find(
      (t) => t.from === order.status
    );

    if (!transition || !transition.to.includes(status)) {
      throw new SdkError(
        `订单状态不能从 ${order.status} 转换为 ${status}`,
        ErrorCode.VALIDATION_ERROR,
        400
      );
    }

    const response = await this.client.patch<ApiResponse<Order>>(
      `/orders/${id}/status`,
      { status }
    );
    if (!response.data) {
      throw new SdkError('更新订单状态失败', ErrorCode.VALIDATION_ERROR, 400);
    }
    return response.data;
  }

  async cancel(id: string, reason: string): Promise<Order> {
    const order = await this.findById(id);

    if (!['pending', 'paid'].includes(order.status)) {
      throw new SdkError(
        `订单当前状态 ${order.status} 不允许取消`,
        ErrorCode.VALIDATION_ERROR,
        400
      );
    }

    const response = await this.client.post<ApiResponse<Order>>(
      `/orders/${id}/cancel`,
      { reason }
    );
    if (!response.data) {
      throw new SdkError('取消订单失败', ErrorCode.VALIDATION_ERROR, 400);
    }
    return response.data;
  }

  async getStatusTransitions(currentStatus: OrderStatus): OrderStatus[] {
    const transition = OrderService.STATUS_TRANSITIONS.find(
      (t) => t.from === currentStatus
    );
    return transition?.to || [];
  }
}
```

### 12.5 SDK 导出与使用

```typescript
// ==================== sdk/index.ts ====================

export { EcommerceSdk, HttpClient, AuthManager, LocalStorageAdapter } from './core';
export { AuthService, UserService, ProductService, OrderService } from './services';
export * from './types';
```

```typescript
// ==================== 使用示例 ====================

import { EcommerceSdk, SdkError, ErrorCode } from './sdk';

// 创建 SDK 实例
const sdk = new EcommerceSdk({
  baseUrl: 'https://api.example.com',
  apiKey: 'your-api-key',
  timeout: 30000,
  retries: 3,
  debug: true,
  storage: new LocalStorageAdapter(),
});

// 添加自定义拦截器
sdk.use({
  request: (config) => {
    console.log('请求:', config);
    return config;
  },
  error: (error) => {
    console.error('SDK 错误:', error);
    return error;
  },
});

// 获取服务实例
const authService = new AuthService(
  sdk.getHttpClient(),
  sdk.getAuthManager()
);
const userService = new UserService(sdk.getHttpClient());
const productService = new ProductService(sdk.getHttpClient());
const orderService = new OrderService(sdk.getHttpClient());

// ==================== 认证流程 ====================

async function authFlow() {
  try {
    // 登录
    const token = await authService.login({
      email: 'user@example.com',
      password: 'password123',
      rememberMe: true,
    });
    console.log('登录成功:', token.accessToken);

    // 获取当前用户
    const user = await authService.getCurrentUser();
    console.log('当前用户:', user);

  } catch (error) {
    if (error instanceof SdkError) {
      console.error(`错误 [${error.code}]:`, error.message);
      if (error.code === ErrorCode.AUTHENTICATION_ERROR) {
        // 处理认证错误
      }
    }
  }
}

// ==================== 用户管理流程 ====================

async function userManagementFlow() {
  try {
    // 创建用户
    const newUser = await userService.create({
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'password123',
      role: 'customer',
    });
    console.log('创建用户:', newUser);

    // 获取用户列表
    const { items, total, totalPages } = await userService.findAll({
      page: 1,
      pageSize: 10,
      role: 'customer',
      status: 'active',
    });
    console.log(`共 ${total} 个用户，${totalPages} 页`);

    // 更新用户
    const updatedUser = await userService.update(newUser.id, {
      role: 'staff',
      metadata: { department: '销售部' },
    });
    console.log('更新用户:', updatedUser);

  } catch (error) {
    if (error instanceof SdkError) {
      console.error(`错误 [${error.code}]:`, error.message, error.details);
    }
  }
}

// ==================== 商品管理流程 ====================

async function productManagementFlow() {
  try {
    // 创建商品
    const product = await productService.create({
      name: 'iPhone 15 Pro',
      description: '最新款 iPhone',
      sku: 'IPHONE-15-PRO',
      price: 799900, // 7999.00 元
      stock: 100,
      categoryId: 'cat_electronics',
      images: ['https://example.com/iphone15.jpg'],
      tags: ['手机', '苹果', '旗舰'],
    });
    console.log('创建商品:', product);

    // 搜索商品
    const searchResult = await productService.findAll({
      keyword: 'iPhone',
      minPrice: 500000,
      maxPrice: 1000000,
      status: 'active',
    });
    console.log('搜索结果:', searchResult.items);

    // 更新库存
    const updatedProduct = await productService.updateStock(product.id, 50);
    console.log('更新后库存:', updatedProduct.stock);

  } catch (error) {
    if (error instanceof SdkError) {
      console.error(`错误 [${error.code}]:`, error.message);
    }
  }
}

// ==================== 订单处理流程 ====================

async function orderFlow() {
  try {
    // 创建订单
    const order = await orderService.create({
      items: [
        { productId: 'prod_123', quantity: 2 },
        { productId: 'prod_456', quantity: 1 },
      ],
      shippingAddress: {
        recipientName: '张三',
        phone: '13800138000',
        province: '北京市',
        city: '北京市',
        district: '朝阳区',
        streetAddress: '某街道某小区1号楼101',
        postalCode: '100000',
      },
      remark: '请小心轻放',
    });
    console.log('创建订单:', order);

    // 模拟支付
    const paidOrder = await orderService.updateStatus(order.id, 'paid');
    console.log('订单已支付:', paidOrder.status);

    // 查看可用的状态转换
    const availableTransitions = await orderService.getStatusTransitions(
      paidOrder.status
    );
    console.log('可用的状态转换:', availableTransitions);

    // 模拟发货
    const shippedOrder = await orderService.updateStatus(order.id, 'shipped');
    console.log('订单已发货:', shippedOrder);

  } catch (error) {
    if (error instanceof SdkError) {
      console.error(`错误 [${error.code}]:`, error.message);
    }
  }
}

// ==================== 错误处理最佳实践 ====================

async function errorHandlingBestPractices() {
  try {
    const order = await orderService.findById('non_existent_id');
  } catch (error) {
    if (error instanceof SdkError) {
      switch (error.code) {
        case ErrorCode.NOT_FOUND:
          console.log('资源不存在');
          break;
        case ErrorCode.AUTHENTICATION_ERROR:
          console.log('认证失败，需要重新登录');
          // 引导用户重新登录
          break;
        case ErrorCode.RATE_LIMIT_ERROR:
          console.log('请求过于频繁，请稍后重试');
          break;
        default:
          console.log('其他错误:', error.message);
      }

      // 所有错误都可以访问详细信息
      console.log('错误详情:', error.details);
      console.log('请求 ID:', error.requestId);
      console.log('HTTP 状态码:', error.statusCode);
    }
  }
}
```

### 12.6 我的思考：类型驱动开发

通过这个完整的 SDK 开发案例，我们可以看到类型系统在实际项目中的巨大价值。

**类型驱动的价值：**

```typescript
// 1. 类型即文档 - 任何人都能通过类型了解 API 结构
const order: Order = await orderService.findById('ord_123');
// 通过类型，我们知道 order 有哪些属性，每个属性的类型

// 2. 类型即验证 - 在编写代码时就能发现错误
orderService.updateStatus('ord_123', 'invalid_status');
// TypeScript 会报错，因为 'invalid_status' 不是 OrderStatus

// 3. 类型即提示 - IDE 提供完整的智能提示
order.items[0].productName // 自动提示所有可用属性

// 4. 类型即重构 - 重构时编译器告诉你哪里需要修改
interface Order {
  // 添加新字段
  trackingNo?: string;
}
```

**SDK 设计的核心原则：**

1. **单一职责** - 每个类/方法只做一件事
2. **类型安全** - 所有公共 API 都有完整的类型定义
3. **错误可预测** - 所有可能的错误都有明确的类型
4. **可扩展** - 通过拦截器机制支持自定义扩展
5. **可测试** - 依赖注入使得测试变得简单

**类型系统的终极目标：** 让错误在编译时被捕获，而不是在运行时。让代码成为最好的文档。

---

## 总结

本指南涵盖了 TypeScript 工程实践的各个方面，从基础的配置和类型系统，到高级的装饰器和泛型，再到实际的 React、Node.js 和 SDK 开发应用。通过学习和实践这些内容，你将能够：

1. **配置 TypeScript 项目** - 理解并优化 tsconfig.json
2. **设计类型系统** - 创建清晰、健壮的类型定义
3. **使用泛型** - 编写灵活、可重用的代码
4. **应用装饰器** - 实现元编程和框架集成
5. **编写声明文件** - 为 JavaScript 库添加类型支持
6. **构建类型安全应用** - 在 React 和 Node.js 中使用 TypeScript
7. **测试类型** - 确保类型定义的正确性
8. **遵循最佳实践** - 建立正确的类型思维

记住，TypeScript 不仅仅是一门语言，更是一种思考方式。当你在编写代码时始终考虑类型，你会发现代码质量自然而然地提升，bug 减少，团队协作更加顺畅。

继续深入学习 TypeScript，推荐关注：
- TypeScript 官方文档和源码
- 高级类型技巧和类型体操
- 各框架的 TypeScript 最佳实践
- 类型测试工具的发展

祝你在 TypeScript 之旅中收获满满！
