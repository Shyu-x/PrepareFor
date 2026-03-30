# TypeScript 类型系统基础

## 目录

1. 基础类型
2. 接口与类型别名
3. 泛型
4. 联合类型与交叉类型
5. 映射类型与条件类型
6. 装饰器
7. 项目中的类型应用

---

## 1. 基础类型

### 1.1 原始类型

```typescript
// 布尔类型
let isActive: boolean = true;

// 数字类型
let count: number = 42;
let price: number = 19.99;

// 字符串类型
let name: string = "FastDocument";

// 模板字符串
let message: string = `Hello, ${name}`;

// 空类型
let unused: void = undefined;
let nullValue: null = null;
let notDefined: undefined = undefined;
```

### 1.2 数组与元组

```typescript
// 数组类型
let numbers: number[] = [1, 2, 3];
let strings: Array<string> = ['a', 'b', 'c'];

// 只读数组
let readonlyArray: readonly number[] = [1, 2, 3];

// 元组 - 固定长度和类型的数组
let user: [string, number, boolean] = ['john', 30, true];
```

### 1.3 特殊类型

```typescript
// any - 任意类型（避免使用）
let anything: any = 'hello';
anything = 42;

// unknown - 类型安全的 any
let unknownValue: unknown = 'hello';
if (typeof unknownValue === 'string') {
  // 需要类型 narrowing
  console.log(unknownValue.toUpperCase());
}

// never - 永不返回
function throwError(message: string): never {
  throw new Error(message);
}

// void - 没有返回值
function log(message: string): void {
  console.log(message);
}
```

---

## 2. 接口与类型别名

### 2.1 接口定义

```typescript
// 基本接口
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;  // 可选属性
  readonly createdAt: number;  // 只读属性
}

// 接口继承
interface Admin extends User {
  role: 'admin' | 'superadmin';
  permissions: string[];
}

// 函数接口
interface SearchFunction {
  (query: string, limit?: number): Promise<SearchResult[]>;
}

// 可索引类型
interface StringArray {
  [index: number]: string;
}
```

### 2.2 类型别名

```typescript
// 基本类型别名
type ID = string | number;
type Status = 'pending' | 'active' | 'completed';

// 对象类型别名
type Point = {
  x: number;
  y: number;
};

// 函数类型别名
type Callback<T> = (error: Error | null, result?: T) => void;

// 元组类型别名
type Pair<T, U> = [T, U];
```

### 2.3 项目中的应用

**示例：块类型定义** (`store/documentStore.ts`)

```typescript
// 定义块类型
export type BlockType =
  | 'text'
  | 'h1' | 'h2' | 'h3'
  | 'todo'
  | 'code'
  | 'image'
  | 'table'
  | 'callout'
  | 'divider'
  | 'mindmap'
  | 'flowchart';

// 块属性接口
export interface Block {
  id: string;
  type: BlockType;
  content: string;
  properties?: BlockProperties;
  order?: number;
}

// 块属性 - 使用可选属性
export interface BlockProperties {
  // 通用
  style?: string;
  collapsed?: boolean;

  // 待办
  checked?: boolean;
  priority?: 'low' | 'medium' | 'high' | 'urgent';

  // 代码块
  language?: string;

  // 图片
  url?: string;
  imageWidth?: number;
  imageHeight?: number;
}
```

---

## 3. 泛型

### 3.1 基础泛型

```typescript
// 泛型函数
function identity<T>(value: T): T {
  return value;
}

// 泛型接口
interface Container<T> {
  value: T;
  getValue(): T;
}

// 泛型类
class Box<T> {
  constructor(private content: T) {}
  get(): T { return this.content; }
}
```

### 3.2 泛型约束

```typescript
// 约束为特定类型
interface HasLength {
  length: number;
}

function logLength<T extends HasLength>(item: T): void {
  console.log(item.length);
}

// 约束为特定属性
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

### 3.3 项目中的应用

**示例 1：API 响应泛型** (`lib/api.ts`)

```typescript
// 泛型 API 响应
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 使用泛型
async function fetchDocuments(): Promise<APIResponse<Document[]>> {
  const response = await fetch('/api/documents');
  return response.json();
}
```

**示例 2：Store 泛型** (`store/documentStore.ts`)

```typescript
// 泛型 Store 接口
interface StoreState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

// 具体实现
interface DocumentState {
  documents: Document[];
  currentDoc: Document | null;
  loading: boolean;
  error: string | null;
}
```

**示例 3：工具函数泛型** (`lib/utils.ts`)

```typescript
// 泛型工具函数
function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    (result[groupKey] = result[groupKey] || []).push(item);
    return result;
  }, {} as Record<string, T[]>);
}

// 泛型类型守卫
function isType<T>(value: unknown, key: keyof T): value is T {
  return typeof value === 'object' && value !== null && key in value;
}
```

---

## 4. 联合类型与交叉类型

### 4.1 联合类型

```typescript
// 使用 | 连接多个类型
type StringOrNumber = string | number;

// 字面量联合类型
type Status = 'pending' | 'active' | 'completed';

// 可辨识联合
type Result =
  | { success: true; data: string }
  | { success: false; error: Error };

// 类型 narrowing
function handleResult(result: Result) {
  if (result.success) {
    console.log(result.data);  // 类型收窄为 string
  } else {
    console.log(result.error); // 类型收窄为 Error
  }
}
```

### 4.2 交叉类型

```typescript
interface A {
  a: string;
}

interface B {
  b: number;
}

// 交叉类型 - 合并所有属性
type C = A & B;
// C = { a: string; b: number }

// 混入模式
type Mixin = A & B & { c: boolean };
```

### 4.3 项目中的应用

**示例：块类型联合**

```typescript
// 块类型联合
type Block =
  | TextBlock
  | HeadingBlock
  | TodoBlock
  | CodeBlock
  | ImageBlock
  | TableBlock;

// 具体块类型
interface TextBlock {
  type: 'text';
  content: string;
}

interface HeadingBlock {
  type: 'h1' | 'h2' | 'h3';
  content: string;
}

interface TodoBlock {
  type: 'todo';
  content: string;
  checked: boolean;
}

// 类型守卫
function isTextBlock(block: Block): block is TextBlock {
  return block.type === 'text';
}
```

---

## 5. 映射类型与条件类型

### 5.1 映射类型

```typescript
// 基本映射类型
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

type Partial<T> = {
  [P in keyof T]?: T[P];
};

// 可选
type Optional<T> = {
  [P in keyof T]?: T[P];
};

// 只读
type Frozen<T> = {
  readonly [P in keyof T]: T[P];
};
```

### 5.2 条件类型

```typescript
// 条件类型
type IsString<T> = T extends string ? true : false;

// 提取返回类型
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

// 提取参数类型
type Parameters<T> = T extends (...args: infer P) => any ? P : never;
```

### 5.3 项目中的应用

```typescript
// 创建 Update 类型 - 所有属性可选
type Update<T> = Partial<T>;

// 创建 Partial Document
type UpdateDocument = Update<Document>;

// 创建只读类型
type ReadonlyDocument = Readonly<Document>;
```

---

## 6. 装饰器

### 6.1 类装饰器

```typescript
// 类装饰器
function Logger(target: Function) {
  console.log(`Class ${target.name} defined`);
}

@Logger
class DocumentService {
  // ...
}
```

### 6.2 方法装饰器

```typescript
// 方法装饰器
function Log(target: Object, propertyKey: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;
  descriptor.value = function(...args: any[]) {
    console.log(`Calling ${propertyKey} with`, args);
    return original.apply(this, args);
  };
}

class Calculator {
  @Log
  add(a: number, b: number): number {
    return a + b;
  }
}
```

### 6.3 NestJS 装饰器应用

```typescript
// 控制器装饰器
@Controller('documents')
export class DocumentsController {
  // 参数装饰器
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  // Body 装饰器
  @Post()
  create(@Body() createDto: CreateDocumentDto) {
    return this.service.create(createDto);
  }

  // 自定义装饰器
  @Get('me')
  getProfile(@User() user: User) {
    return user;
  }
}
```

---

## 7. 项目中的类型应用

### 7.1 类型守卫

```typescript
// typeof 守卫
function process(value: string | number) {
  if (typeof value === 'string') {
    return value.toUpperCase();
  }
  return value.toFixed(2);
}

// instanceof 守卫
function process(value: Date | string) {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value.toUpperCase();
}

// 自定义守卫
function isDocument(value: unknown): value is Document {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'title' in value
  );
}
```

### 7.2 类型断言

```typescript
// 尖括号断言
let someValue: unknown = 'hello';
let strLength: number = (someValue as string).length;

// as 语法
let input: unknown = document.getElementById('input');
let value = (input as HTMLInputElement).value;

// 非空断言
let element = document.getElementById('div')!;
```

### 7.3 完整示例：Store 类型定义

```typescript
// types/document.ts
export interface Document {
  id: string;
  title: string;
  content: string;
  blocks: Block[];
  createdAt: number;
  updatedAt: number;
  ownerId: string;
  spaceId?: string;
}

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  properties?: BlockProperties;
  order?: number;
}

export type BlockType =
  | 'text'
  | 'h1' | 'h2' | 'h3'
  | 'todo'
  | 'code'
  | 'image'
  | 'table'
  | 'callout'
  | 'divider';

export interface BlockProperties {
  checked?: boolean;
  language?: string;
  url?: string;
  calloutType?: 'info' | 'warning' | 'error' | 'success';
}

// store/documentStore.ts
export interface DocumentState {
  documents: Document[];
  currentDoc: Document | null;
  blocks: Block[];
  loading: boolean;
  error: string | null;
}

export type DocumentAction =
  | { type: 'SET_DOCUMENTS'; payload: Document[] }
  | { type: 'SET_CURRENT_DOC'; payload: Document | null }
  | { type: 'ADD_BLOCK'; payload: Block }
  | { type: 'UPDATE_BLOCK'; payload: { id: string; updates: Partial<Block> } }
  | { type: 'REMOVE_BLOCK'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };
```

---

## 8. 总结

TypeScript 类型系统是现代 Web 开发的重要工具：

| 特性 | 用途 | 优势 |
|------|------|------|
| 接口/类型别名 | 定义对象结构 | 代码提示、重构安全 |
| 泛型 | 复用组件逻辑 | 类型安全、高复用 |
| 联合类型 | 表示多种可能 | 精确类型、类型收窄 |
| 条件类型 | 动态计算类型 | 高级类型操作 |
| 装饰器 | 元编程 | AOP、框架集成 |

在 FastDocument 项目中，TypeScript 贯穿始终，从组件 Props 到 API 响应，从 Store 定义到后端实体，都使用了完整的类型系统。
