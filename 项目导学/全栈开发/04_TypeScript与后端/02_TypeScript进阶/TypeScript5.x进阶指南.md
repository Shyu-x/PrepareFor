# TypeScript 5.x 进阶指南

## 一、TypeScript 5.x 新特性

### 1.1 版本更新概览

| 版本 | 发布时间 | 核心特性 |
|------|----------|----------|
| 5.0 | 2023.03 | 装饰器标准实现、const 类型参数、extends 支持多配置 |
| 5.1 | 2023.06 | JSX 增强函数返回 undefined、类型守卫改进 |
| 5.2 | 2023.08 | using 关键字、装饰器元数据 |
| 5.3 | 2023.11 | Import Attributes、switch 自动补全优化 |
| 5.4 | 2024.03 | NoInfer 工具类型、闭包中的类型收窄 |
| 5.5 | 2024.06 | inferred 类型谓词、正则表达式语法检查 |
| 5.6 | 2024.08 | Iterator 方法类型、严格内置迭代器检查 |
| 5.7 | 2024.11 | outDir 支持多目录、项目引用增量构建优化 |

### 1.2 装饰器标准实现

```typescript
// TypeScript 5.0 实现了 ECMAScript 装饰器标准

// 类装饰器
function logged(
  value: Function,
  context: ClassMethodDecoratorContext
) {
  const methodName = String(context.name);
  
  return function (...args: any[]) {
    console.log(`调用 ${methodName}，参数:`, args);
    return value.apply(this, args);
  };
}

class Calculator {
  @logged
  add(a: number, b: number) {
    return a + b;
  }
}

// 字段装饰器
function bound(
  value: Function,
  context: ClassFieldDecoratorContext
) {
  const methodName = String(context.name);
  
  return function (this: any) {
    console.log(`绑定方法 ${methodName}`);
    return value.bind(this);
  };
}

class Button {
  @bound
  handleClick() {
    console.log('按钮被点击');
  }
}
```

### 1.3 const 类型参数

```typescript
// TypeScript 5.0 引入 const 类型参数

// 不使用 const 泛型
function createArray<T>(items: T[]): T[] {
  return items;
}

// 类型推断为 string[]
const arr1 = createArray(['a', 'b', 'c']);
// arr1 类型: string[]

// 使用 const 泛型
function createArrayConst<const T>(items: T[]): T[] {
  return items;
}

// 类型推断为 readonly ['a', 'b', 'c']
const arr2 = createArrayConst(['a', 'b', 'c']);
// arr2 类型: readonly ['a', 'b', 'c']

// 实际应用：精确的对象类型推断
function createConfig<const T extends object>(config: T): T {
  return config;
}

const config = createConfig({
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3,
});
// config 类型精确推断为：
// { readonly apiUrl: 'https://api.example.com'; readonly timeout: 5000; readonly retries: 3; }
```

### 1.4 using 关键字（资源管理）

```typescript
// TypeScript 5.2 引入 using 关键字，用于资源管理

// 定义可释放资源
class FileHandle implements Disposable {
  constructor(private path: string) {
    console.log(`打开文件: ${path}`);
  }
  
  read() {
    console.log('读取文件内容');
    return '文件内容';
  }
  
  [Symbol.dispose]() {
    console.log(`关闭文件: ${this.path}`);
  }
}

// 使用 using 关键字
function readFile() {
  // 使用 using 声明，作用域结束时自动释放
  using file = new FileHandle('data.txt');
  
  file.read();
  // 函数结束时自动调用 file[Symbol.dispose]()
}

// 异步资源管理
class AsyncDatabase implements AsyncDisposable {
  async connect() {
    console.log('连接数据库');
  }
  
  async query(sql: string) {
    console.log(`执行查询: ${sql}`);
    return [];
  }
  
  async [Symbol.asyncDispose]() {
    console.log('关闭数据库连接');
  }
}

async function queryData() {
  // 使用 await using 声明异步资源
  await using db = new AsyncDatabase();
  
  await db.connect();
  await db.query('SELECT * FROM users');
  // 函数结束时自动调用 db[Symbol.asyncDispose]()
}
```

### 1.5 Import Attributes

```typescript
// TypeScript 5.3 支持 Import Attributes

// 导入 JSON 文件
import config from './config.json' with { type: 'json' };

// 导入 CSS 文件（构建工具支持）
import styles from './styles.css' with { type: 'css' };

// 动态导入
async function loadModule() {
  const { default: data } = await import('./data.json', {
    with: { type: 'json' },
  });
  return data;
}
```

### 1.6 NoInfer 工具类型

```typescript
// TypeScript 5.4 引入 NoInfer 工具类型

// 问题：推断类型过于宽泛
function createRequest<T>(
  url: string,
  method: T
): { url: string; method: T } {
  return { url, method };
}

// method 被推断为 string，而不是 'GET'
const request1 = createRequest('/api/users', 'GET');

// 使用 NoInfer 限制推断
function createRequestFixed<T extends string>(
  url: string,
  method: NoInfer<T>
): { url: string; method: T } {
  return { url, method };
}

// 现在需要显式指定类型
const request2 = createRequestFixed<'GET' | 'POST'>('/api/users', 'GET');

// 实际应用：API 函数
function apiCall<TData, TError = Error>(
  endpoint: string,
  options?: {
    method?: NoInfer<TData> extends never ? 'GET' : 'POST';
    body?: TData;
  }
): Promise<TData> {
  return fetch(endpoint, {
    method: options?.method || 'GET',
    body: options?.body ? JSON.stringify(options.body) : undefined,
  }).then(res => res.json());
}
```

---

## 二、高级类型系统

### 2.1 条件类型

```typescript
// 基础条件类型
type IsString<T> = T extends string ? true : false;

type A = IsString<string>; // true
type B = IsString<number>; // false

// 条件类型分发
type ToArray<T> = T extends any ? T[] : never;

type C = ToArray<string | number>; // string[] | number[]

// 排除 null 和 undefined
type NonNullable<T> = T extends null | undefined ? never : T;

type D = NonNullable<string | null | undefined>; // string

// 提取函数返回类型
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function greet(): string {
  return 'Hello';
}

type GreetReturn = ReturnType<typeof greet>; // string

// 提取函数参数类型
type Parameters<T> = T extends (...args: infer P) => any ? P : never;

function add(a: number, b: number): number {
  return a + b;
}

type AddParams = Parameters<typeof add>; // [number, number]

// 提取 Promise 值类型
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;

type E = Awaited<Promise<Promise<string>>>; // string
```

### 2.2 映射类型

```typescript
// 基础映射类型
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

type Partial<T> = {
  [P in keyof T]?: T[P];
};

type Required<T> = {
  [P in keyof T]-?: T[P];
};

// 深度只读
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object 
    ? DeepReadonly<T[P]> 
    : T[P];
};

interface User {
  name: string;
  profile: {
    age: number;
    address: {
      city: string;
    };
  };
}

type ReadonlyUser = DeepReadonly<User>;
// 所有属性都变为只读

// 条件映射类型
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

interface Person {
  name: string;
  age: number;
}

type PersonGetters = Getters<Person>;
// { getName: () => string; getAge: () => number; }

// 过滤属性
type OnlyStrings<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K];
};

interface Mixed {
  name: string;
  age: number;
  email: string;
  active: boolean;
}

type StringProps = OnlyStrings<Mixed>;
// { name: string; email: string; }
```

### 2.3 模板字面量类型

```typescript
// 基础模板字面量类型
type EventName = 'click' | 'focus' | 'blur';
type EventHandler = `on${Capitalize<EventName>}`;
// 'onClick' | 'onFocus' | 'onBlur'

// 字符串操作类型
type Lowercase<S extends string> = intrinsic; // 内置
type Uppercase<S extends string> = intrinsic;
type Capitalize<S extends string> = intrinsic;
type Uncapitalize<S extends string> = intrinsic;

type A = Uppercase<'hello'>; // 'HELLO'
type B = Lowercase<'HELLO'>; // 'hello'
type C = Capitalize<'hello'>; // 'Hello'

// 路由类型
type Routes = '/users' | '/posts' | '/comments';
type APIRoutes = `/api${Routes}`;
// '/api/users' | '/api/posts' | '/api/comments'

// 动态路由类型
type DynamicRoutes = `/users/${number}` | `/posts/${string}`;

// 提取路由参数
type ExtractRouteParams<T extends string> = T extends `${string}:${infer Param}/${infer Rest}`
  ? { [K in Param | keyof ExtractRouteParams<Rest>]: string }
  : T extends `${string}:${infer Param}`
  ? { [K in Param]: string }
  : {};

type Params = ExtractRouteParams<'/users/:id/posts/:postId'>;
// { id: string; postId: string; }

// 事件处理器类型
type Events = {
  click: { x: number; y: number };
  focus: { target: HTMLElement };
  input: { value: string };
};

type EventHandlerMap = {
  [K in keyof Events as `on${Capitalize<K>}`]: (event: Events[K]) => void;
};
// {
//   onClick: (event: { x: number; y: number }) => void;
//   onFocus: (event: { target: HTMLElement }) => void;
//   onInput: (event: { value: string }) => void;
// }
```

### 2.4 递归类型

```typescript
// 深度部分类型
type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

interface Config {
  database: {
    host: string;
    port: number;
    credentials: {
      username: string;
      password: string;
    };
  };
}

type PartialConfig = DeepPartial<Config>;
// 所有层级都是可选的

// 深度必需类型
type DeepRequired<T> = T extends object
  ? { [P in keyof T]-?: DeepRequired<T[P]> }
  : T;

// 数组元素类型
type Flatten<T> = T extends Array<infer U> ? Flatten<U> : T;

type Nested = string[][][];
type Flat = Flatten<Nested>; // string

// JSON 类型
type JSONValue = 
  | string 
  | number 
  | boolean 
  | null 
  | JSONValue[] 
  | { [key: string]: JSONValue };

// 树结构类型
interface TreeNode<T> {
  value: T;
  children?: TreeNode<T>[];
}

// 链表类型
interface ListNode<T> {
  value: T;
  next: ListNode<T> | null;
}
```

---

## 三、类型体操实战

### 3.1 实用工具类型

```typescript
// 挑选属性
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// 排除属性
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;

// 记录类型
type Record<K extends keyof any, V> = {
  [P in K]: V;
};

// 排除类型
type Exclude<T, U> = T extends U ? never : T;

// 提取类型
type Extract<T, U> = T extends U ? T : never;

// 不可为空
type NonNullable<T> = T extends null | undefined ? never : T;

// 实战：创建可选的挑选类型
type OptionalPick<T, K extends keyof T> = {
  [P in K]?: T[P];
};

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

type UserUpdate = OptionalPick<User, 'name' | 'email'>;
// { name?: string; email?: string; }
```

### 3.2 对象类型操作

```typescript
// 合并两个对象类型
type Merge<T, U> = Omit<T, keyof U> & U;

interface Defaults {
  host: string;
  port: number;
  debug: boolean;
}

interface Config {
  host?: string;
  port?: number;
  ssl?: boolean;
}

type MergedConfig = Merge<Defaults, Config>;
// { debug: boolean; host?: string; port?: number; ssl?: boolean; }

// 对象键重命名
type RenameKeys<T, M extends Record<string, string>> = {
  [K in keyof T as K extends keyof M ? M[K] : K]: T[K];
};

interface OldUser {
  user_name: string;
  user_age: number;
}

type NewUser = RenameKeys<OldUser, { user_name: 'name'; user_age: 'age' }>;
// { name: string; age: number; }

// 提取对象值类型
type ValueOf<T> = T[keyof T];

interface Status {
  pending: 'PENDING';
  success: 'SUCCESS';
  error: 'ERROR';
}

type StatusValue = ValueOf<Status>;
// 'PENDING' | 'SUCCESS' | 'ERROR'

// 对象路径类型
type Path<T, K extends string = ''> = T extends object
  ? {
      [P in keyof T]: P extends string
        ? K extends ''
          ? P | Path<T[P], P>
          : `${K}.${P}` | Path<T[P], `${K}.${P}`>
        : never;
    }[keyof T]
  : never;

interface Data {
  user: {
    profile: {
      name: string;
    };
  };
}

type DataPath = Path<Data>;
// 'user' | 'user.profile' | 'user.profile.name'
```

### 3.3 函数类型操作

```typescript
// 函数重载类型提取
type Overload<T> = T extends {
  (...args: infer A): infer R;
  (...args: any[]): any;
}
  ? (...args: A) => R
  : T extends {
      (...args: any[]): any;
      (...args: infer A): infer R;
    }
  ? (...args: A) => R
  : never;

// 函数参数部分应用
type PartialArgs<T extends (...args: any[]) => any> = T extends (
  ...args: infer A
) => any
  ? { [K in keyof A]?: A[K] }
  : never;

// 构造函数类型
type Constructor<T> = new (...args: any[]) => T;

// 类类型
type ClassType<T> = {
  new (...args: any[]): T;
  prototype: T;
};

// 混入类型
type Mixin<T extends Constructor<any>> = InstanceType<T>;

class Base {
  baseMethod() {}
}

function MixinA<TBase extends Constructor<Base>>(Base: TBase) {
  return class extends Base {
    methodA() {}
  };
}

function MixinB<TBase extends Constructor<Base>>(Base: TBase) {
  return class extends Base {
    methodB() {}
  };
}

const MixedClass = MixinB(MixinA(Base));
type MixedInstance = InstanceType<typeof MixedClass>;
// { baseMethod(): void; methodA(): void; methodB(): void; }
```

---

## 四、类型安全实践

### 4.1 类型守卫

```typescript
// typeof 类型守卫
function process(value: string | number) {
  if (typeof value === 'string') {
    // value 类型收窄为 string
    return value.toUpperCase();
  }
  // value 类型收窄为 number
  return value.toFixed(2);
}

// instanceof 类型守卫
class Dog {
  bark() {}
}

class Cat {
  meow() {}
}

function makeSound(animal: Dog | Cat) {
  if (animal instanceof Dog) {
    animal.bark();
  } else {
    animal.meow();
  }
}

// in 操作符类型守卫
interface Fish {
  swim(): void;
}

interface Bird {
  fly(): void;
}

function move(animal: Fish | Bird) {
  if ('swim' in animal) {
    animal.swim();
  } else {
    animal.fly();
  }
}

// 自定义类型守卫
interface User {
  id: number;
  name: string;
}

function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    typeof (value as User).id === 'number' &&
    typeof (value as User).name === 'string'
  );
}

function processUser(data: unknown) {
  if (isUser(data)) {
    // data 类型收窄为 User
    console.log(data.name);
  }
}

// 断言函数
function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error('值不是字符串');
  }
}

function processString(value: unknown) {
  assertIsString(value);
  // value 类型收窄为 string
  console.log(value.toUpperCase());
}
```

### 4.2 泛型约束

```typescript
// 基础泛型约束
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: 'Alice', age: 25 };
const name = getProperty(user, 'name'); // string
// const invalid = getProperty(user, 'email'); // 编译错误

// 构造函数约束
function createInstance<T>(ctor: new (...args: any[]) => T): T {
  return new ctor();
}

class Person {
  constructor(public name: string) {}
}

const person = createInstance(Person);

// 数组约束
function getFirstElement<T extends any[]>(arr: T): T[0] {
  return arr[0];
}

// 对象约束
function mergeObjects<T extends object, U extends object>(a: T, b: U): T & U {
  return { ...a, ...b };
}

// 函数约束
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
```

### 4.3 类型推断增强

```typescript
// infer 关键字
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

type Result = UnwrapPromise<Promise<string>>; // string

// 多个 infer
type First<T extends any[]> = T extends [infer F, ...any[]] ? F : never;
type Last<T extends any[]> = T extends [...any[], infer L] ? L : never;

type Head = First<[1, 2, 3]>; // 1
type Tail = Last<[1, 2, 3]>; // 3

// 条件推断
type Flatten<T> = T extends Array<infer U> 
  ? U extends Array<any> 
    ? Flatten<U> 
    : U 
  : T;

type Flat = Flatten<number[][]>; // number

// 函数返回类型推断
type AsyncReturnType<T extends (...args: any) => Promise<any>> = 
  T extends (...args: any) => Promise<infer R> ? R : never;

async function fetchData(): Promise<{ id: number; name: string }> {
  return { id: 1, name: 'Test' };
}

type Data = AsyncReturnType<typeof fetchData>;
// { id: number; name: string; }
```

---

## 五、工程化配置

### 5.1 tsconfig.json 配置

```json
{
  "compilerOptions": {
    // 基础选项
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    
    // 类型检查
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "useUnknownInCatchVariables": true,
    "alwaysStrict": true,
    
    // 额外检查
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false,
    
    // 模块解析
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@utils/*": ["./src/utils/*"]
    },
    "resolveJsonModule": true,
    
    // 输出
    "outDir": "./dist",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": true,
    
    // 互操作性
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    
    // JSX
    "jsx": "react-jsx",
    
    // 性能
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 5.2 项目引用

```json
// 根目录 tsconfig.json
{
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/utils" },
    { "path": "./packages/ui" }
  ],
  "files": []
}

// packages/core/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}

// packages/ui/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "references": [
    { "path": "../core" },
    { "path": "../utils" }
  ],
  "include": ["src/**/*"]
}
```

### 5.3 类型声明文件

```typescript
// types/global.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    API_URL: string;
    DATABASE_URL: string;
  }
}

// types/modules.d.ts
declare module '*.css' {
  const styles: { [className: string]: string };
  export default styles;
}

declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default content;
}

declare module '*.json' {
  const value: unknown;
  export default value;
}

// types/api.d.ts
declare namespace API {
  interface User {
    id: number;
    name: string;
    email: string;
  }
  
  interface Response<T> {
    data: T;
    message: string;
    code: number;
  }
}
```

---

## 六、最佳实践

### 6.1 类型设计原则

```typescript
// ✅ 好的设计：使用精确类型
type Status = 'pending' | 'processing' | 'completed' | 'failed';

// ❌ 不好的设计：使用宽泛类型
type Status = string;

// ✅ 好的设计：使用品牌类型
type UserId = number & { readonly __brand: unique symbol };
type OrderId = number & { readonly __brand: unique symbol };

function createUser(id: UserId) {}
function createOrder(id: OrderId) {}

const userId = 1 as UserId;
const orderId = 1 as OrderId;

createUser(userId); // ✅
// createUser(orderId); // ❌ 类型错误

// ✅ 好的设计：使用不可变类型
interface User {
  readonly id: number;
  readonly name: string;
  readonly email: string;
}

// ✅ 好的设计：使用联合类型代替枚举
type Role = 'admin' | 'user' | 'guest';

// ❌ 不好的设计：使用枚举
enum Role {
  Admin = 'admin',
  User = 'user',
  Guest = 'guest',
}
```

### 6.2 类型复用策略

```typescript
// 使用泛型复用类型
interface ApiResponse<T> {
  data: T;
  message: string;
  code: number;
}

type UserResponse = ApiResponse<User>;
type OrderResponse = ApiResponse<Order>;

// 使用工具类型复用
interface BaseUser {
  id: number;
  name: string;
  email: string;
}

type CreateUser = Omit<BaseUser, 'id'>;
type UpdateUser = Partial<Omit<BaseUser, 'id'>>;
type UserSummary = Pick<BaseUser, 'id' | 'name'>;
```

---

## 七、类型体操实战练习

### 7.1 基础练习

```typescript
// 练习1：实现 DeepReadonly
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object 
    ? DeepReadonly<T[K]> 
    : T[K];
};

// 测试
interface Config {
  server: {
    host: string;
    port: number;
  };
  database: {
    url: string;
    credentials: {
      username: string;
      password: string;
    };
  };
}

type ReadonlyConfig = DeepReadonly<Config>;
// 所有层级都是只读的

// 练习2：实现 DeepPartial
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object 
    ? DeepPartial<T[K]> 
    : T[K];
};

// 练习3：实现 DeepRequired
type DeepRequired<T> = {
  [K in keyof T]-?: T[K] extends object 
    ? DeepRequired<T[K]> 
    : T[K];
};

// 练习4：实现 DeepNonNullable
type DeepNonNullable<T> = {
  [K in keyof T]: T[K] extends null | undefined 
    ? never 
    : T[K] extends object 
      ? DeepNonNullable<T[K]> 
      : T[K];
};

// 练习5：实现 RequiredKeys（获取必需的键）
type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

interface User {
  id: number;
  name: string;
  age?: number;
  email?: string;
}

type UserRequiredKeys = RequiredKeys<User>; // 'id' | 'name'

// 练习6：实现 OptionalKeys（获取可选的键）
type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

type UserOptionalKeys = OptionalKeys<User>; // 'age' | 'email'
```

### 7.2 进阶练习

```typescript
// 练习7：实现 UnionToIntersection（联合转交叉）
type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void ? I : never;

type Union = { a: string } | { b: number };
type Intersection = UnionToIntersection<Union>;
// { a: string } & { b: number }

// 练习8：实现 UnionToTuple（联合转元组）
type UnionToTuple<T, Last = LastOfUnion<T>> = 
  [T] extends [never] 
    ? [] 
    : [...UnionToTuple<Exclude<T, Last>>, Last];

type LastOfUnion<T> = UnionToIntersection<
  T extends any ? () => T : never
> extends () => infer R ? R : never;

type Tuple = UnionToTuple<'a' | 'b' | 'c'>;
// ['a', 'b', 'c']

// 练习9：实现 StringToUnion（字符串转联合）
type StringToUnion<S extends string> = 
  S extends `${infer First}${infer Rest}` 
    ? First | StringToUnion<Rest> 
    : never;

type Chars = StringToUnion<'abc'>; // 'a' | 'b' | 'c'

// 练习10：实现 TupleToUnion（元组转联合）
type TupleToUnion<T extends any[]> = T[number];

type Union2 = TupleToUnion<['a', 'b', 'c']>; // 'a' | 'b' | 'c'

// 练习11：实现 ReverseTuple（反转元组）
type ReverseTuple<T extends any[]> = 
  T extends [infer First, ...infer Rest] 
    ? [...ReverseTuple<Rest>, First] 
    : [];

type Reversed = ReverseTuple<[1, 2, 3]>; // [3, 2, 1]

// 练习12：实现 FlattenArray（扁平化数组）
type FlattenArray<T extends any[]> = 
  T extends [infer First, ...infer Rest] 
    ? First extends any[] 
      ? [...FlattenArray<First>, ...FlattenArray<Rest>] 
      : [First, ...FlattenArray<Rest>] 
    : [];

type Flattened = FlattenArray<[1, [2, [3, 4]], 5]>;
// [1, 2, 3, 4, 5]
```

### 7.3 高级练习

```typescript
// 练习13：实现 ObjectPaths（获取对象所有路径）
type ObjectPaths<T, Prefix extends string = ''> = 
  T extends object 
    ? {
        [K in keyof T]: K extends string 
          ? T[K] extends object 
            ? ObjectPaths<T[K], `${Prefix}${K}.`> | `${Prefix}${K}` 
            : `${Prefix}${K}` 
          : never;
      }[keyof T] 
    : never;

interface Data {
  user: {
    profile: {
      name: string;
      age: number;
    };
    settings: {
      theme: string;
    };
  };
}

type Paths = ObjectPaths<Data>;
// 'user' | 'user.profile' | 'user.profile.name' | 'user.profile.age' | 
// 'user.settings' | 'user.settings.theme'

// 练习14：实现 GetByPath（根据路径获取类型）
type GetByPath<T, Path extends string> = 
  Path extends `${infer First}.${infer Rest}` 
    ? First extends keyof T 
      ? GetByPath<T[First], Rest> 
      : never 
    : Path extends keyof T 
      ? T[Path] 
      : never;

type NameType = GetByPath<Data, 'user.profile.name'>; // string
type AgeType = GetByPath<Data, 'user.profile.age'>; // number

// 练习15：实现 CamelCase（转驼峰）
type CamelCase<S extends string> = 
  S extends `${infer First}_${infer Rest}` 
    ? `${First}${Capitalize<CamelCase<Rest>>}` 
    : S extends `${infer First}-${infer Rest}` 
      ? `${First}${Capitalize<CamelCase<Rest>>}` 
      : S;

type Camel = CamelCase<'hello_world_test'>; // 'helloWorldTest'

// 练习16：实现 SnakeCase（转下划线）
type SnakeCase<S extends string> = 
  S extends `${infer First}${infer Rest}` 
    ? First extends Uppercase<First> 
      ? `${Lowercase<First>}${SnakeCase<Rest>}` 
      : `_${Lowercase<First>}${SnakeCase<Rest>}` 
    : S;

type Snake = SnakeCase<'helloWorldTest'>; // 'hello_world_test'

// 练习17：实现 IsAny（判断是否为 any）
type IsAny<T> = 0 extends (1 & T) ? true : false;

type Test1 = IsAny<any>; // true
type Test2 = IsAny<unknown>; // false
type Test3 = IsAny<string>; // false

// 练习18：实现 IsNever（判断是否为 never）
type IsNever<T> = [T] extends [never] ? true : false;

type Test4 = IsNever<never>; // true
type Test5 = IsNever<string>; // false

// 练习19：实现 IsTuple（判断是否为元组）
type IsTuple<T> = 
  T extends readonly any[] 
    ? number extends T['length'] 
      ? false 
      : true 
    : false;

type Test6 = IsTuple<[1, 2, 3]>; // true
type Test7 = IsTuple<number[]>; // false

// 练习20：实现 Equal（精确类型相等）
type Equal<X, Y> = 
  (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) 
    ? true 
    : false;
```

---

## 八、与 React 集成

### 8.1 组件类型定义

```typescript
import { ReactNode, ComponentType, FC, PropsWithChildren } from 'react';

// 基础组件类型
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

export const Button: FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  children,
}) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

// 泛型组件
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string | number;
}

export function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={keyExtractor(item)}>{renderItem(item, index)}</li>
      ))}
    </ul>
  );
}

// 使用
<List
  items={[{ id: 1, name: '张三' }]}
  renderItem={(item) => <span>{item.name}</span>}
  keyExtractor={(item) => item.id}
/>

// 高阶组件类型
interface WithLoadingProps {
  loading?: boolean;
}

export function withLoading<P extends object>(
  Component: ComponentType<P>
): ComponentType<P & WithLoadingProps> {
  return function WithLoadingComponent({ loading, ...props }) {
    if (loading) {
      return <div>加载中...</div>;
    }
    return <Component {...(props as P)} />;
  };
}

// forwardRef 组件
import { forwardRef, Ref } from 'react';

interface InputProps {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error }, ref: Ref<HTMLInputElement>) => {
    return (
      <div>
        {label && <label>{label}</label>}
        <input ref={ref} className={error ? 'error' : ''} />
        {error && <span className="error">{error}</span>}
      </div>
    );
  }
);
```

### 8.2 Hooks 类型定义

```typescript
import { useState, useEffect, useCallback, useRef, RefObject } from 'react';

// useState 类型推断
const [count, setCount] = useState<number>(0);
const [user, setUser] = useState<User | null>(null);

// 自定义 Hook 类型
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);
    window.localStorage.setItem(key, JSON.stringify(valueToStore));
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}

// useDebounce Hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// usePrevious Hook
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}

// useRef 类型
const inputRef = useRef<HTMLInputElement>(null);
const timerRef = useRef<NodeJS.Timeout | null>(null);

// 泛型 Hook
function useAsync<T, E = Error>(
  asyncFunction: () => Promise<T>
): {
  data: T | null;
  error: E | null;
  loading: boolean;
  execute: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<E | null>(null);
  const [loading, setLoading] = useState(false);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFunction();
      setData(result);
    } catch (e) {
      setError(e as E);
    } finally {
      setLoading(false);
    }
  }, [asyncFunction]);

  return { data, error, loading, execute };
}
```

---

## 九、与 Node.js 集成

### 9.1 Express 类型定义

```typescript
import express, { Request, Response, NextFunction, Router } from 'express';

// 扩展 Request 类型
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

// 路由处理器类型
type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

// 异步处理器包装器
const asyncHandler = (fn: AsyncHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 控制器类型
interface UserController {
  getAll: AsyncHandler;
  getById: AsyncHandler;
  create: AsyncHandler;
  update: AsyncHandler;
  delete: AsyncHandler;
}

// 实现控制器
const userController: UserController = {
  getAll: async (req, res) => {
    const users = await UserService.findAll();
    res.json({ data: users });
  },
  
  getById: async (req, res) => {
    const { id } = req.params;
    const user = await UserService.findById(id);
    res.json({ data: user });
  },
  
  create: async (req, res) => {
    const data = req.body as CreateUserDTO;
    const user = await UserService.create(data);
    res.status(201).json({ data: user });
  },
  
  update: async (req, res) => {
    const { id } = req.params;
    const data = req.body as UpdateUserDTO;
    const user = await UserService.update(id, data);
    res.json({ data: user });
  },
  
  delete: async (req, res) => {
    const { id } = req.params;
    await UserService.delete(id);
    res.status(204).send();
  },
};

// 路由定义
const router = Router();

router.get('/', asyncHandler(userController.getAll));
router.get('/:id', asyncHandler(userController.getById));
router.post('/', asyncHandler(userController.create));
router.put('/:id', asyncHandler(userController.update));
router.delete('/:id', asyncHandler(userController.delete));

export default router;
```

### 9.2 DTO 类型定义

```typescript
// DTO（数据传输对象）定义
import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';

// 创建用户 DTO
export class CreateUserDTO {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsEnum(['user', 'admin'])
  role?: string;
}

// 更新用户 DTO
export class UpdateUserDTO {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string;
}

// 查询 DTO
export class QueryUserDTO {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string;

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  limit?: number = 20;
}

// 响应 DTO
export interface UserResponseDTO {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedResponseDTO<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

---

## 十、常见类型错误与解决方案

### 10.1 类型推断问题

```typescript
// 问题1：对象字面量类型推断过宽
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
};
// config 类型: { apiUrl: string; timeout: number }

// 解决方案：使用 as const
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
} as const;
// config 类型: { readonly apiUrl: "https://api.example.com"; readonly timeout: 5000 }

// 问题2：数组元素类型推断
const arr = [1, 2, 3];
// arr 类型: number[]

const arr = [1, 2, 3] as const;
// arr 类型: readonly [1, 2, 3]

// 问题3：函数返回类型推断
function getData() {
  return { name: '张三', age: 25 };
}
// 返回类型: { name: string; age: number }

// 解决方案：显式定义返回类型
interface UserData {
  name: string;
  age: number;
}

function getData(): UserData {
  return { name: '张三', age: 25 };
}
```

### 10.2 泛型约束问题

```typescript
// 问题：泛型约束不足
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// 问题：可选属性访问
interface User {
  name: string;
  email?: string;
}

const user: User = { name: '张三' };
// user.email 可能是 undefined

// 解决方案1：使用可选链
const email = user.email?.toLowerCase();

// 解决方案2：使用空值合并
const email = user.email ?? '未设置';

// 解决方案3：使用类型守卫
if (user.email) {
  console.log(user.email.toLowerCase());
}
```

### 10.3 类型断言问题

```typescript
// 问题：过度使用类型断言
const value = something as any as string; // 危险！

// 解决方案：使用类型守卫
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

const value: unknown = 'hello';

if (isString(value)) {
  console.log(value.toUpperCase());
}

// 问题：双重断言
const element = document.getElementById('myInput') as HTMLInputElement;

// 解决方案：使用类型守卫
function isHTMLInputElement(element: Element | null): element is HTMLInputElement {
  return element instanceof HTMLInputElement;
}

const element = document.getElementById('myInput');

if (element && isHTMLInputElement(element)) {
  console.log(element.value);
}
```

---

## 十一、面试高频问题

### 问题1：TypeScript 中 type 和 interface 的区别？

**答案：**
1. **type** 可以定义联合类型、交叉类型、元组等；**interface** 主要定义对象类型
2. **interface** 可以被扩展和实现；**type** 使用交叉类型扩展
3. **interface** 同名会自动合并；**type** 同名会报错
4. **interface** 更适合定义公共 API；**type** 更适合复杂类型操作

### 问题2：什么是类型收窄？

**答案：** 类型收窄是将宽泛的类型缩小为更具体的类型的过程。常见方式：
1. `typeof` 类型守卫
2. `instanceof` 类型守卫
3. `in` 操作符
4. 自定义类型守卫（`is` 关键字）
5. 断言函数（`asserts` 关键字）

### 问题3：infer 关键字的作用？

**答案：** `infer` 用于条件类型中推断类型。只能在 `extends` 子句中使用，通常用于提取函数参数、返回值、Promise 值等类型。

```typescript
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
type Parameters<T> = T extends (...args: infer P) => any ? P : never;
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
```

### 问题4：什么是协变和逆变？

**答案：**
- **协变**：子类型可以赋值给父类型（数组、函数返回值）
- **逆变**：父类型可以赋值给子类型（函数参数）
- **双向协变**：既可以是协变也可以是逆变（默认情况下函数参数）

### 问题5：如何实现类型安全的 EventEmitter？

**答案：**
```typescript
type EventMap = {
  login: { userId: string };
  logout: void;
  message: { from: string; content: string };
};

class TypedEventEmitter<T extends Record<string, any>> {
  private listeners = new Map<keyof T, Set<Function>>();

  on<K extends keyof T>(event: K, listener: T[K] extends void 
    ? () => void 
    : (data: T[K]) => void
  ) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  emit<K extends keyof T>(event: K, ...args: T[K] extends void ? [] : [T[K]]) {
    const listeners = this.listeners.get(event);
    listeners?.forEach(fn => fn(...args));
  }
}

const emitter = new TypedEventEmitter<EventMap>();
emitter.on('login', (data) => console.log(data.userId));
emitter.emit('login', { userId: '123' });
```

---

## 十二、最佳实践总结

### 12.1 类型设计原则

1. **优先使用 interface**：定义对象类型时优先使用 interface
2. **避免 any**：使用 unknown 或具体类型
3. **使用 as const**：需要精确类型时使用
4. **善用工具类型**：复用和转换类型
5. **类型守卫**：安全地进行类型收窄

### 12.2 项目配置清单

- [ ] 启用 strict 模式
- [ ] 配置路径别名
- [ ] 使用项目引用
- [ ] 配置类型声明文件
- [ ] 启用增量编译

### 12.3 常用工具类型清单

| 工具类型 | 用途 |
|----------|------|
| `Partial<T>` | 所有属性可选 |
| `Required<T>` | 所有属性必需 |
| `Readonly<T>` | 所有属性只读 |
| `Pick<T, K>` | 选择部分属性 |
| `Omit<T, K>` | 排除部分属性 |
| `Record<K, V>` | 创建记录类型 |
| `ReturnType<T>` | 获取函数返回类型 |
| `Parameters<T>` | 获取函数参数类型 |
| `NonNullable<T>` | 排除 null 和 undefined |
| `Extract<T, U>` | 提取匹配类型 |
| `Exclude<T, U>` | 排除匹配类型 |

---

*本文档最后更新于 2026年3月*

// 使用类型组合
interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

interface SoftDelete {
  deletedAt: Date | null;
}

type UserWithTimestamps = BaseUser & Timestamps;
type UserWithSoftDelete = BaseUser & Timestamps & SoftDelete;
```

---

*本文档最后更新于 2026年3月*