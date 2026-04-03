# TypeScript进阶

## 目录

1. [泛型编程](#1-泛型编程)
2. [装饰器](#2-装饰器)
3. [高级类型](#3-高级类型)
4. [映射类型](#4-映射类型)

---

## 1. 泛型编程

### 1.1 泛型基础

```typescript
// 泛型函数
function identity<T>(value: T): T {
    return value;
}

const result = identity<string>('hello');
const numResult = identity(123); // 类型推断

// 泛型接口
interface Container<T> {
    value: T;
    getValue(): T;
}

const container: Container<string> = {
    value: 'hello',
    getValue() { return this.value; }
};

// 泛型类
class Box<T> {
    private content: T;

    constructor(content: T) {
        this.content = content;
    }

    getContent(): T {
        return this.content;
    }
}

const box = new Box<number>(123);
```

### 1.2 泛型约束

```typescript
// 使用 extends 约束泛型
interface Lengthwise {
    length: number;
}

function logLength<T extends Lengthwise>(arg: T): void {
    console.log(arg.length);
}

logLength('hello');      // 字符串有 length
logLength([1, 2, 3]);   // 数组有 length
logLength({ length: 5 }); // 对象有 length
// logLength(123);       // 错误：数字没有 length

// 约束为另一个类型
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
    return obj[key];
}

const person = { name: '张三', age: 25 };
const name = getProperty(person, 'name');
```

---

## 2. 装饰器

### 2.1 装饰器基础

```typescript
// 启用装饰器：tsconfig.json
// { "compilerOptions": { "experimentalDecorators": true } }

// 类装饰器
function Logger(constructor: Function) {
    console.log('Logger: 创建了', constructor.name);
}

@Logger
class User {
    constructor(public name: string) {}
}

// 方法装饰器
function LogMethod(
    target: Object,
    propertyKey: string,
    descriptor: PropertyDescriptor
) {
    const original = descriptor.value;

    descriptor.value = function(...args: any[]) {
        console.log(`调用 ${propertyKey}`, args);
        return original.apply(this, args);
    };

    return descriptor;
}

class Calculator {
    @LogMethod
    add(a: number, b: number): number {
        return a + b;
    }
}
```

---

## 3. 高级类型

### 3.1 交叉类型

```typescript
interface A {
    a: string;
}

interface B {
    b: number;
}

type AB = A & B;

const ab: AB = {
    a: 'hello',
    b: 123
};
```

### 3.2 联合类型

```typescript
type StringOrNumber = string | number;

function print(value: StringOrNumber) {
    if (typeof value === 'string') {
        console.log(value.toUpperCase());
    } else {
        console.log(value.toFixed(2));
    }
}
```

### 3.3 条件类型

```typescript
type IsString<T> = T extends string ? true : false;

type A = IsString<string>;  // true
type B = IsString<number>; // false

// 提取元素类型
type ArrayElement<T> = T extends (infer U)[] ? U : never;

type Elem = ArrayElement<string[]>; // string
```

---

## 4. 映射类型

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
type UserPreview = Pick<User, 'id' | 'name'>;

// Omit - 排除属性
type UserWithoutEmail = Omit<User, 'email'>;

// 自定义映射类型
type Nullable<T> = {
    [P in keyof T]: T[P] | null;
};

type NullableUser = Nullable<User>;
```

---

## 5. 常见面试问题

**问题1：泛型有什么作用？**

答案：
- 创建可复用的组件
- 支持多种类型
- 保持类型安全

**问题2：infer 关键字的作用？**

答案：
- 在条件类型中推断类型
- 用于提取类型

---

## 5. 类型体操实战

### 5.1 工具类型实现

```typescript
// 1. Partial - 所有属性可选
type MyPartial<T> = {
  [P in keyof T]?: T[P];
};

// 2. Required - 所有属性必需
type MyRequired<T> = {
  [P in keyof T]-?: T[P];
};

// 3. Readonly - 所有属性只读
type MyReadonly<T> = {
  readonly [P in keyof T]: T[P];
};

// 4. Pick - 选择属性
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// 5. Omit - 排除属性
type MyOmit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;

// 6. Record - 记录类型
type MyRecord<K extends keyof any, T> = {
  [P in K]: T;
};

// 7. Exclude - 排除类型
type MyExclude<T, U> = T extends U ? never : T;

// 8. Extract - 提取类型
type MyExtract<T, U> = T extends U ? T : never;

// 9. NonNullable - 排除 null 和 undefined
type MyNonNullable<T> = T extends null | undefined ? never : T;

// 10. ReturnType - 获取函数返回类型
type MyReturnType<T extends (...args: any) => any> = T extends (
  ...args: any
) => infer R
  ? R
  : any;

// 11. Parameters - 获取函数参数类型
type MyParameters<T extends (...args: any) => any> = T extends (
  ...args: infer P
) => any
  ? P
  : never;

// 测试
interface User {
  id: number;
  name: string;
  email: string;
}

type PartialUser = MyPartial<User>;
type UserPreview = MyPick<User, 'id' | 'name'>;
type UserWithoutEmail = MyOmit<User, 'email'>;

function getUser(): User {
  return { id: 1, name: '张三', email: 'test@example.com' };
}

type UserReturn = MyReturnType<typeof getUser>; // User
type UserParams = MyParameters<typeof getUser>; // []
```

### 5.2 高级类型体操

```typescript
// 1. DeepPartial - 深度可选
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

interface Config {
  server: {
    host: string;
    port: number;
  };
  database: {
    url: string;
    pool: {
      min: number;
      max: number;
    };
  };
}

type PartialConfig = DeepPartial<Config>;
// 所有嵌套属性都可选

// 2. DeepReadonly - 深度只读
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// 3. RequiredKeys - 获取必需属性名
type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

interface Example {
  a: string;      // 必需
  b?: number;     // 可选
  c: boolean;     // 必需
  d?: object;     // 可选
}

type Required = RequiredKeys<Example>; // 'a' | 'c'

// 4. OptionalKeys - 获取可选属性名
type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

type Optional = OptionalKeys<Example>; // 'b' | 'd'

// 5. UnionToIntersection - 联合转交叉
type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

type Union = { a: string } | { b: number };
type Intersection = UnionToIntersection<Union>; // { a: string } & { b: number }

// 6. GetOptional - 获取可选属性
type GetOptional<T> = {
  [P in keyof T as T[P] extends Required<T>[P] ? never : P]: T[P];
};

// 7. GetRequired - 获取必需属性
type GetRequired<T> = {
  [P in keyof T as T[P] extends Required<T>[P] ? P : never]: T[P];
};

// 8. Mutable - 移除只读
type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

// 9. GetElementType - 获取数组元素类型
type GetElementType<T> = T extends (infer E)[] ? E : never;

type NumArray = number[];
type Element = GetElementType<NumArray>; // number

// 10. GetPromiseType - 获取 Promise 返回类型
type GetPromiseType<T> = T extends Promise<infer R> ? R : T;

type AsyncResult = Promise<string>;
type Result = GetPromiseType<AsyncResult>; // string
```

### 5.3 实战类型体操练习

```typescript
// 练习1：实现 ObjectKeys 类型
type ObjectKeys<T extends object> = `${Exclude<keyof T, symbol>}`;

const person = {
  name: '张三',
  age: 25,
  city: '北京'
};

type PersonKeys = ObjectKeys<typeof person>; // 'name' | 'age' | 'city'

// 练习2：实现 TupleToUnion
type TupleToUnion<T extends any[]> = T[number];

type Tuple = [1, 2, 3];
type Union = TupleToUnion<Tuple>; // 1 | 2 | 3

// 练习3：实现 First 和 Last
type First<T extends any[]> = T extends [infer F, ...any[]] ? F : never;
type Last<T extends any[]> = T extends [...any[], infer L] ? L : never;

type Arr = [1, 2, 3, 4, 5];
type FirstElement = First<Arr>; // 1
type LastElement = Last<Arr>;   // 5

// 练习4：实现 Pop 和 Push
type Pop<T extends any[]> = T extends [...infer Rest, infer _] ? Rest : never;
type Push<T extends any[], V> = [...T, V];

type Popped = Pop<[1, 2, 3]>;     // [1, 2]
type Pushed = Push<[1, 2], 3>;    // [1, 2, 3]

// 练习5：实现 Flatten
type Flatten<T extends any[]> = T extends [infer First, ...infer Rest]
  ? First extends any[]
    ? [...Flatten<First>, ...Flatten<Rest>]
    : [First, ...Flatten<Rest>]
  : [];

type Nested = [1, [2, [3, 4]], 5];
type Flat = Flatten<Nested>; // [1, 2, 3, 4, 5]

// 练习6：实现 Reverse
type Reverse<T extends any[]> = T extends [infer First, ...infer Rest]
  ? [...Reverse<Rest>, First]
  : [];

type Reversed = Reverse<[1, 2, 3, 4]>; // [4, 3, 2, 1]

// 练习7：实现 Includes
type Includes<T extends any[], U> = T extends [infer First, ...infer Rest]
  ? Equal<First, U> extends true
    ? true
    : Includes<Rest, U>
  : false;

type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <
  T
>() => T extends Y ? 1 : 2
  ? true
  : false;

type HasOne = Includes<[1, 2, 3], 2>; // true
type HasFour = Includes<[1, 2, 3], 4>; // false

// 练习8：实现 Length
type Length<T extends readonly any[]> = T['length'];

type StrLength = Length<['a', 'b', 'c']>; // 3

// 练习9：实现 Concat
type Concat<T extends any[], U extends any[]> = [...T, ...U];

type Concatenated = Concat<[1, 2], [3, 4]>; // [1, 2, 3, 4]

// 练习10：实现 Without
type Without<T extends any[], U> = T extends [infer First, ...infer Rest]
  ? First extends U
    ? Without<Rest, U>
    : [First, ...Without<Rest, U>]
  : [];

type WithoutResult = Without<[1, 2, 3, 2, 1], 2>; // [1, 3, 1]
```

---

## 6. 模板字面量类型

### 6.1 基础用法

```typescript
// 字符串拼接
type Greeting = `hello ${string}`;

const a: Greeting = 'hello world';    // ✅
const b: Greeting = 'hello there';    // ✅
// const c: Greeting = 'hi world';    // ❌

// 联合类型展开
type Color = 'red' | 'blue' | 'green';
type Size = 'small' | 'medium' | 'large';

type ColorSize = `${Color}-${Size}`;
// 'red-small' | 'red-medium' | 'red-large'
// 'blue-small' | 'blue-medium' | 'blue-large'
// 'green-small' | 'green-medium' | 'green-large'

// 内置字符串操作类型
type Str = 'Hello World';

type Upper = Uppercase<Str>;      // 'HELLO WORLD'
type Lower = Lowercase<Str>;      // 'hello world'
type Capital = Capitalize<Str>;   // 'Hello world'
type Uncapital = Uncapitalize<Str>; // 'hello World'
```

### 6.2 高级应用

```typescript
// 1. 获取对象所有路径
type Path<T, K extends keyof T = keyof T> = K extends string | number
  ? T[K] extends object
    ? K | `${K}.${Path<T[K]>}`
    : K
  : never;

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

type ConfigPath = Path<Config>;
// 'server' | 'database' | 'server.host' | 'server.port' | 'database.url' | 'database.credentials' | 'database.credentials.username' | 'database.credentials.password'

// 2. 类型安全的 get 函数
function get<T, P extends string>(
  obj: T,
  path: P extends Path<T> ? P : never
): any {
  return path.split('.').reduce((acc: any, key) => acc?.[key], obj);
}

const config: Config = {
  server: { host: 'localhost', port: 3000 },
  database: {
    url: 'mongodb://localhost',
    credentials: { username: 'admin', password: 'secret' }
  }
};

get(config, 'server.host');     // ✅
get(config, 'database.url');    // ✅
// get(config, 'invalid.path'); // ❌ 类型错误

// 3. 事件名称类型
type EventName<T extends string> = `on${Capitalize<T>}`;

type ClickEvent = EventName<'click'>;   // 'onClick'
type FocusEvent = EventName<'focus'>;   // 'onFocus'

// 4. CSS 属性类型
type CSSUnit = 'px' | 'em' | 'rem' | '%' | 'vh' | 'vw';
type CSSValue = `${number}${CSSUnit}`;

const width: CSSValue = '100px';   // ✅
const height: CSSValue = '50vh';   // ✅
// const invalid: CSSValue = '100'; // ❌

// 5. Getter/Setter 类型生成
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type Setters<T> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: (value: T[K]) => void;
};

interface State {
  name: string;
  count: number;
}

type StateGetters = Getters<State>;
// { getName: () => string; getCount: () => number }

type StateSetters = Setters<State>;
// { setName: (value: string) => void; setCount: (value: number) => void }
```

---

## 7. 类型安全最佳实践

### 7.1 严格模式配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "useUnknownInCatchVariables": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true
  }
}
```

### 7.2 类型守卫

```typescript
// 1. typeof 类型守卫
function process(value: string | number) {
  if (typeof value === 'string') {
    // 这里 value 是 string 类型
    return value.toUpperCase();
  }
  // 这里 value 是 number 类型
  return value.toFixed(2);
}

// 2. instanceof 类型守卫
class Dog {
  bark() { console.log('汪汪'); }
}

class Cat {
  meow() { console.log('喵喵'); }
}

function makeSound(animal: Dog | Cat) {
  if (animal instanceof Dog) {
    animal.bark();
  } else {
    animal.meow();
  }
}

// 3. in 操作符类型守卫
interface Bird {
  fly(): void;
}

interface Fish {
  swim(): void;
}

function move(animal: Bird | Fish) {
  if ('fly' in animal) {
    animal.fly();
  } else {
    animal.swim();
  }
}

// 4. 自定义类型守卫
interface User {
  id: number;
  name: string;
  email: string;
}

function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'email' in value
  );
}

function processUser(data: unknown) {
  if (isUser(data)) {
    // 这里 data 是 User 类型
    console.log(data.name);
  }
}

// 5. 断言函数
function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error('Value is not a string');
  }
}

function processValue(value: unknown) {
  assertIsString(value);
  // 这里 value 是 string 类型
  console.log(value.toUpperCase());
}
```

### 7.3 泛型约束最佳实践

```typescript
// 1. 约束对象属性
function getProperty<T extends object, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: '张三', age: 25 };
const name = getProperty(user, 'name');    // ✅ string
// getProperty(user, 'email');             // ❌ 类型错误

// 2. 约束数组类型
function firstElement<T extends any[]>(arr: T): T[number] {
  return arr[0];
}

// 3. 约束构造函数
function createInstance<T extends new (...args: any[]) => any>(
  Constructor: T,
  ...args: ConstructorParameters<T>
): InstanceType<T> {
  return new Constructor(...args);
}

class Person {
  constructor(public name: string, public age: number) {}
}

const person = createInstance(Person, '张三', 25);

// 4. 约束 Promise 类型
async function fetchData<T extends { id: number }>(
  url: string
): Promise<T[]> {
  const response = await fetch(url);
  return response.json();
}

// 5. 约束组件 Props
interface ComponentProps<T> {
  data: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

function List<T extends { id: string | number }>({
  data,
  renderItem,
  keyExtractor,
}: ComponentProps<T>) {
  return (
    <ul>
      {data.map((item) => (
        <li key={keyExtractor(item)}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}
```

---

## 8. 面试高频问题

### 问题1：TypeScript 的类型系统有什么特点？

**答案：**
- 静态类型检查，编译时发现错误
- 类型推断，减少类型注解
- 结构化类型系统（鸭子类型）
- 泛型支持，代码复用
- 高级类型操作（条件类型、映射类型等）

### 问题2：interface 和 type 的区别？

**答案：**
| 特性 | interface | type |
|------|-----------|------|
| 扩展 | extends | & 交叉类型 |
| 声明合并 | 支持 | 不支持 |
| 类型别名 | 不支持 | 支持 |
| 联合类型 | 不支持 | 支持 |
| 元组/映射 | 不支持 | 支持 |

### 问题3：什么是类型收窄？

**答案：** 类型收窄是通过类型守卫将宽泛的类型缩小为更具体的类型。常见方式包括：
- typeof 检查
- instanceof 检查
- in 操作符
- 自定义类型守卫
- 断言函数

### 问题4：如何处理 any 和 unknown？

**答案：**
- **any**：关闭类型检查，不安全
- **unknown**：安全的 any，使用前必须类型检查

```typescript
let anyValue: any = 'hello';
anyValue.toUpperCase(); // ✅ 但可能运行时错误

let unknownValue: unknown = 'hello';
// unknownValue.toUpperCase(); // ❌ 类型错误
if (typeof unknownValue === 'string') {
  unknownValue.toUpperCase(); // ✅ 安全
}
```

### 问题5：什么是协变和逆变？

**答案：**
- **协变**：子类型可以赋值给父类型（数组、函数返回值）
- **逆变**：父类型可以赋值给子类型（函数参数）

---

## 9. 最佳实践总结

### 9.1 类型设计原则

- [ ] 优先使用 interface 定义对象类型
- [ ] 使用 type 定义联合类型、交叉类型
- [ ] 避免使用 any，优先 unknown
- [ ] 使用严格模式
- [ ] 为公共 API 提供类型定义

### 9.2 常用工具类型

| 工具类型 | 用途 |
|----------|------|
| Partial\<T\> | 所有属性可选 |
| Required\<T\> | 所有属性必需 |
| Readonly\<T\> | 所有属性只读 |
| Pick\<T, K\> | 选择属性 |
| Omit\<T, K\> | 排除属性 |
| Record\<K, T\> | 记录类型 |
| ReturnType\<T\> | 函数返回类型 |
| Parameters\<T\> | 函数参数类型 |

---

*本文档最后更新于 2026年3月*
