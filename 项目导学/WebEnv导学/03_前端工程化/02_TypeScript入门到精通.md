# TypeScript 入门到精通

## 目录

1. [TypeScript 是什么？为什么需要它？](#1-typescript-是什么为什么需要它)
2. [基本类型和类型推断](#2-基本类型和类型推断)
3. [接口和类型别名](#3-接口和类型别名)
4. [函数类型](#4-函数类型)
5. [泛型](#5-泛型)
6. [装饰器](#6-装饰器)
7. [类型守卫](#7-类型守卫)
8. [实用类型工具](#8-实用类型工具)
9. [在 React 中使用 TypeScript](#9-在-react-中使用-typescript)

---

## 1. TypeScript 是什么？为什么需要它？

### 1.1 什么是 TypeScript？

TypeScript 是 JavaScript 的超集，它添加了**类型系统**。由微软开发维护，是当今最流行的前端开发语言之一。

```
JavaScript
┌─────────────────────────────┐
│  动态类型                    │
│  运行时才检查类型错误         │
│  → 只能在浏览器运行后才发现  │
└─────────────────────────────┘

TypeScript
┌─────────────────────────────┐
│  静态类型                    │
│  编译时检查类型错误          │
│  → 开发阶段就能发现错误      │
└─────────────────────────────┘
```

### 1.2 为什么需要 TypeScript？

**JavaScript 的问题**：

```javascript
// JavaScript - 运行前不知道错误
function greet(user) {
  return user.name.toUpperCase() // 如果 user 是 undefined 呢？
}

greet()  // 运行时报错: Cannot read property 'name' of undefined
```

**TypeScript 的优势**：

```typescript
// TypeScript - 编译时就报错
interface User {
  name: string
  age?: number
}

function greet(user: User): string {
  return user.name.toUpperCase()
}

// ❌ 编译错误: Parameter 'user' implicitly has an 'any' type
greet()

// ✅ 正确
greet({ name: '张三' })
```

### 1.3 项目中的 TypeScript 配置

```json
// apps/web/tsconfig.json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,                    // 严格模式
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",      // 模块解析策略
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",                // JSX 转换
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]                // 路径别名
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

```json
// apps/web/package.json
{
  "devDependencies": {
    "typescript": "^5.7.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/three": "^0.173.0"
  }
}
```

---

## 2. 基本类型和类型推断

### 2.1 原始类型

```typescript
// 字符串
let name: string = '张三'
let greeting: string = `你好，${name}`

// 数字
let age: number = 25
let price: number = 99.99
let binary: number = 0b1010  // 二进制

// 布尔值
let isActive: boolean = true
let isComplete: boolean = false

// Symbol
let sym: symbol = Symbol('id')

// BigInt
let bigNumber: bigint = 9007199254740991n
```

### 2.2 数组

```typescript
// 两种声明方式
let numbers: number[] = [1, 2, 3, 4, 5]
let names: Array<string> = ['张三', '李四', '王五']

// 混合类型数组
let mixed: (string | number)[] = [1, 'two', 3, 'four']

// 只读数组
let readonlyArray: readonly number[] = [1, 2, 3]
// 或
let readonlyArray2: ReadonlyArray<number> = [1, 2, 3]
```

### 2.3 元组 (Tuple)

```typescript
// 固定长度和类型的数组
let point: [number, number] = [10, 20]
let user: [string, number, boolean] = ['张三', 25, true]

// 可选元素
let optionalTuple: [string, number?] = ['hello']
optionalTuple = ['hello', 42]

// 解构
const [x, y] = point
```

### 2.4 对象类型

```typescript
// 基础对象
let user: { name: string; age: number } = {
  name: '张三',
  age: 25
}

// 可选属性
let person: {
  name: string
  age?: number
  email?: string
} = {
  name: '李四'
}

// 只读属性
let config: {
  readonly apiKey: string
  readonly baseUrl: string
} = {
  apiKey: 'abc123',
  baseUrl: 'https://api.example.com'
}
```

### 2.5 特殊类型

```typescript
// any - 任意类型 (避开类型检查)
let anything: any = 'hello'
anything = 42
anything = { foo: 'bar' }

// unknown - 未知类型 (需要类型检查)
let value: unknown = 'hello'
if (typeof value === 'string') {
  console.log(value.toUpperCase()) // 需要类型守卫
}

// void - 无返回值
function log(message: string): void {
  console.log(message)
}

// never - 永不返回
function throwError(message: string): never {
  throw new Error(message)
}

function infiniteLoop(): never {
  while (true) {}
}

// null 和 undefined
let nullable: string | null = null
let optional: string | undefined = undefined

// type: number | null | undefined
let maybeNumber: number | null | undefined
```

### 2.6 类型推断

TypeScript 会自动推断类型：

```typescript
// 显式声明
let count: number = 0

// 类型推断 - 推断为 number
let count2 = 0

// 函数返回类型推断
function add(a: number, b: number) {
  return a + b  // 推断返回 number
}

// 复杂类型推断
const users = [
  { name: '张三', age: 25 },
  { name: '李四', age: 30 }
]
// 推断为: { name: string; age: number }[]

// 对象字面量推断
const config = {
  apiKey: 'abc',
  timeout: 5000
}
// 推断为: { apiKey: string; timeout: number }
```

---

## 3. 接口和类型别名

### 3.1 接口 (Interface)

```typescript
// 基本接口
interface User {
  id: number
  name: string
  email: string
  age?: number           // 可选属性
  readonly createdAt: Date  // 只读属性
}

const user: User = {
  id: 1,
  name: '张三',
  email: 'zhangsan@example.com',
  createdAt: new Date()
}
```

### 3.2 接口继承

```typescript
interface Person {
  name: string
  age: number
}

interface Employee extends Person {
  employeeId: string
  department: string
}

const employee: Employee = {
  name: '张三',
  age: 30,
  employeeId: 'EMP001',
  department: 'Engineering'
}
```

### 3.3 接口合并 (声明合并)

```typescript
interface Animal {
  name: string
}

interface Animal {
  age: number
}

// 等同于
interface Animal {
  name: string
  age: number
}
```

### 3.4 函数类型接口

```typescript
interface SearchFunc {
  (source: string, subString: string): boolean
}

const search: SearchFunc = (source, subString) => {
  return source.includes(subString)
}

search('hello world', 'world')  // true
```

### 3.5 可索引类型

```typescript
interface StringArray {
  [index: number]: string
}

const arr: StringArray = ['a', 'b', 'c']
arr[0]  // 'a'

interface Dictionary {
  [key: string]: number
}

const dict: Dictionary = {
  'one': 1,
  'two': 2
}
```

### 3.6 类型别名 (Type Alias)

```typescript
// 基本类型别名
type ID = string | number
type Status = 'pending' | 'active' | 'completed'

// 对象类型别名
type User = {
  id: ID
  name: string
  status: Status
}

// 工具类型
type PartialUser = Partial<User>
type RequiredUser = Required<User>
type ReadonlyUser = Readonly<User>
```

### 3.7 接口 vs 类型别名

| 特性 | Interface | Type Alias |
|------|-----------|------------|
| 扩展 | extends | 交叉类型 (&) |
| 声明合并 | 支持 | 不支持 |
| 计算属性 | 不支持 | 支持 |
|  implements | 支持 | 支持 |
| 推荐场景 | 对象形状、类定义 | 联合类型、工具类型 |

```typescript
// 接口 - 推荐用于对象形状
interface User {
  name: string
  age: number
}

// 类型别名 - 推荐用于联合类型
type Status = 'loading' | 'success' | 'error'

// 计算属性 (类型别名)
type Keys = 'firstName' | 'lastName'
type Name = {
  [K in Keys]: string
}
// { firstName: string; lastName: string }
```

---

## 4. 函数类型

### 4.1 函数类型声明

```typescript
// 函数声明
function add(a: number, b: number): number {
  return a + b
}

// 函数表达式
const multiply = function(a: number, b: number): number {
  return a * b
}

// 箭头函数
const divide = (a: number, b: number): number => {
  return a / b
}

// 箭头函数简写
const subtract = (a: number, b: number): number => a - b
```

### 4.2 函数类型签名

```typescript
// 函数类型
let myAdd: (x: number, y: number) => number

myAdd = function(x: number, y: number): number {
  return x + y
}

// 使用类型别名
type AddFn = (a: number, b: number) => number

const add: AddFn = (a, b) => a + b
```

### 4.3 可选参数和默认参数

```typescript
// 可选参数
function greet(name: string, greeting?: string): string {
  if (greeting) {
    return `${greeting}, ${name}!`
  }
  return `Hello, ${name}!`
}

greet('张三')           // 'Hello, 张三!'
greet('张三', '你好')  // '你好, 张三!'

// 默认参数
function createUser(name: string, role: string = 'user'): User {
  return { name, role, createdAt: new Date() }
}

// 剩余参数
function sum(...numbers: number[]): number {
  return numbers.reduce((a, b) => a + b, 0)
}

sum(1, 2, 3, 4, 5)  // 15
```

### 4.4 重载 (Overload)

```typescript
// 函数重载 - 多个函数签名
function reverse(str: string): string
function reverse(arr: string[]): string[]
function reverse(param: string | string[]): string | string[] {
  if (typeof param === 'string') {
    return param.split('').reverse().join('')
  }
  return param.slice().reverse()
}

reverse('hello')    // 'olleh'
reverse(['a', 'b']) // ['b', 'a']

// 方法重载
class Calculator {
  add(a: number, b: number): number
  add(a: string, b: string): string
  add(a: any, b: any): any {
    return a + b
  }
}
```

### 4.5 this 类型

```typescript
interface User {
  name: string
  greet(this: User): string
}

const user: User = {
  name: '张三',
  greet() {
    return `你好，我是 ${this.name}`
  }
}
```

---

## 5. 泛型

### 5.1 什么是泛型？

泛型允许你创建**可重用的组件**，能够支持**多种类型**而不是单一类型。

```typescript
// 不使用泛型 - 只能处理单一类型
function identity(arg: number): number {
  return arg
}

// 使用泛型 - 支持多种类型
function identity<T>(arg: T): T {
  return arg
}

identity<string>('hello')  // 'hello'
identity<number>(42)       // 42
identity('world')          // 推断为 string
```

### 5.2 泛型接口

```typescript
// 泛型接口
interface Container<T> {
  value: T
  getValue(): T
}

const stringContainer: Container<string> = {
  value: 'hello',
  getValue() {
    return this.value
  }
}

const numberContainer: Container<number> = {
  value: 42,
  getValue() {
    return this.value
  }
}
```

### 5.3 泛型类

```typescript
class Box<T> {
  private content: T

  constructor(content: T) {
    this.content = content
  }

  getContent(): T {
    return this.content
  }

  setContent(value: T): void {
    this.content = value
  }
}

const box = new Box<string>('书籍')
box.getContent()  // '书籍'

const numberBox = new Box(100)  // 类型推断
numberBox.getContent()  // 100
```

### 5.4 泛型约束

```typescript
// 使用 extends 约束泛型
interface Lengthwise {
  length: number
}

function logLength<T extends Lengthwise>(arg: T): number {
  return arg.length
}

logLength('hello')      // 5
logLength([1, 2, 3])   // 3
logLength({ length: 10 }) // 10

// 约束为特定类型
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}

const user = { name: '张三', age: 25 }
getProperty(user, 'name')  // '张三'
getProperty(user, 'age')   // 25
// getProperty(user, 'email')  // 错误: 'email' 不在 user 中
```

### 5.5 多类型参数

```typescript
function pair<K, V>(key: K, value: V): { key: K; value: V } {
  return { key, value }
}

pair<string, number>('age', 25)
pair('name', '张三')

// 泛型默认类型
interface ApiResponse<T = any> {
  data: T
  status: number
  message: string
}

const response: ApiResponse = {
  data: 'ok',
  status: 200,
  message: 'success'
}
```

### 5.6 条件类型

```typescript
// 条件类型
type IsString<T> = T extends string ? true : false

type A = IsString<string>  // true
type B = IsString<number>  // false

// 提取数组元素类型
type ArrayElement<T> = T extends (infer U)[] ? U : never

type Elem = ArrayElement<string[]>  // string
type Elem2 = ArrayElement<number[]> // number
```

### 5.7 项目中的泛型使用

```typescript
// apps/web/src/store/index.ts
interface AppState {
  activeMenu: string
  setActiveMenu: (menu: string) => void
  isDarkMode: boolean
  toggleDarkMode: () => void
  favorites: string[]
  addFavorite: (menu: string) => void
  removeFavorite: (menu: string) => void
}

// 使用 zustand 的 create 函数
export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      activeMenu: 'index',
      setActiveMenu: (menu) => set({ activeMenu: menu }),
      // ...
    }),
    {
      name: 'prepare-for-storage',
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        favorites: state.favorites,
      }),
    }
  )
)
```

---

## 6. 装饰器

### 6.1 什么是装饰器？

装饰器是一种特殊类型的声明，可以附加到类声明、方法、访问器、属性或参数上，用于修改行为。

**注意**: 使用装饰器需要在 `tsconfig.json` 中启用：

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### 6.2 类装饰器

```typescript
function sealed(constructor: Function) {
  console.log(`密封类: ${constructor.name}`)
  Object.seal(constructor)
  Object.seal(constructor.prototype)
}

@sealed
class User {
  name: string

  constructor(name: string) {
    this.name = name
  }

  greet() {
    return `你好，我是 ${this.name}`
  }
}
```

### 6.3 方法装饰器

```typescript
function logMethod(
  target: Object,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value

  descriptor.value = function(...args: any[]) {
    console.log(`调用方法: ${propertyKey}`, args)
    const result = originalMethod.apply(this, args)
    console.log(`方法返回: ${result}`)
    return result
  }

  return descriptor
}

class Calculator {
  @logMethod
  add(a: number, b: number): number {
    return a + b
  }
}

const calc = new Calculator()
calc.add(2, 3)
// 输出:
// 调用方法: add [2, 3]
// 方法返回: 5
```

### 6.4 属性装饰器

```typescript
function format(formatString: string) {
  return function(target: Object, propertyKey: string) {
    let value: string

    const getter = () => value
    const setter = (val: string) => {
      value = val.replace(/%s/g, formatString)
    }

    Object.defineProperty(target, propertyKey, {
      get: getter,
      set: setter,
      enumerable: true,
      configurable: true
    })
  }
}

class Message {
  @format('***')
  content: string
}

const msg = new Message()
msg.content = 'secret'
console.log(msg.content)  // '***secret***'
```

### 6.5 参数装饰器

```typescript
function validate(
  target: Object,
  propertyKey: string,
  parameterIndex: number
) {
  console.log(`验证参数 ${parameterIndex} 在 ${propertyKey}`)
}

class UserService {
  createUser(
    @validate name: string,
    @validate age: number
  ) {
    return { name, age }
  }
}
```

### 6.6 装饰器工厂

```typescript
// 装饰器工厂 - 返回装饰器的函数
function color(color: string) {
  return function(target: Function) {
    target.prototype.color = color
  }
}

@color('blue')
class Animal {
  color?: string
}

const animal = new Animal()
console.log(animal.color)  // 'blue'
```

---

## 7. 类型守卫

### 7.1 什么是类型守卫？

类型守卫是一种表达式，用于在运行时检查某个变量的类型，以便 TypeScript 能够缩窄类型范围。

### 7.2 typeof 类型守卫

```typescript
function printValue(value: string | number) {
  if (typeof value === 'string') {
    // TypeScript 知道 value 是 string
    return value.toUpperCase()
  } else {
    // TypeScript 知道 value 是 number
    return value.toFixed(2)
  }
}
```

### 7.3 instanceof 类型守卫

```typescript
class Dog {
  bark() {
    return '汪汪!'
  }
}

class Cat {
  meow() {
    return '喵喵!'
  }
}

function makeSound(animal: Dog | Cat) {
  if (animal instanceof Dog) {
    animal.bark()
  } else {
    animal.meow()
  }
}
```

### 7.4 in 操作符

```typescript
interface Fish {
  swim(): void
}

interface Bird {
  fly(): void
}

function move(animal: Fish | Bird) {
  if ('swim' in animal) {
    animal.swim()
  } else {
    animal.fly()
  }
}
```

### 7.5 自定义类型守卫

```typescript
interface Fish {
  swim(): void
}

interface Bird {
  fly(): void
}

// 自定义类型守卫函数
function isFish(animal: Fish | Bird): animal is Fish {
  return (animal as Fish).swim !== undefined
}

function move(animal: Fish | Bird) {
  if (isFish(animal)) {
    animal.swim()
  } else {
    animal.fly()
  }
}
```

### 7.6 可辨识联合

```typescript
type Action =
  | { type: 'increment'; amount: number }
  | { type: 'decrement'; amount: number }
  | { type: 'reset' }

function reducer(state: number, action: Action): number {
  switch (action.type) {
    case 'increment':
      return state + action.amount  // amount 可用
    case 'decrement':
      return state - action.amount  // amount 可用
    case 'reset':
      return 0
  }
}
```

---

## 8. 实用类型工具

TypeScript 提供了许多内置的工具类型，帮助你更方便地操作类型。

### 8.1 基础工具类型

```typescript
// Partial<T> - 所有属性变为可选
interface User {
  id: number
  name: string
  email: string
}

type PartialUser = Partial<User>
// 等同于
// { id?: number; name?: string; email?: string }

// Required<T> - 所有属性变为必需
type RequiredUser = Required<PartialUser>

// Readonly<T> - 所有属性变为只读
type ReadonlyUser = Readonly<User>

// Pick<T, K> - 选择特定属性
type UserPreview = Pick<User, 'id' | 'name'>
// { id: number; name: string }

// Omit<T, K> - 排除特定属性
type UserWithoutEmail = Omit<User, 'email'>
// { id: number; name: string }
```

### 8.2 联合类型工具

```typescript
// Extract<T, U> - 提取 T 中可赋值给 U 的类型
type T1 = Extract<'a' | 'b' | 'c', 'a' | 'f'>
// 'a'

// Exclude<T, U> - 从 T 中排除可赋值给 U 的类型
type T2 = Exclude<'a' | 'b' | 'c', 'a'>
// 'b' | 'c'

// NonNullable<T> - 排除 null 和 undefined
type T3 = NonNullable<string | null | undefined>
// string
```

### 8.3 函数工具类型

```typescript
// Parameters<T> - 获取函数参数类型为元组
type AddFn = (a: number, b: number) => number
type AddParams = Parameters<AddFn>
// [number, number]

// ReturnType<T> - 获取函数返回类型
type AddReturn = ReturnType<AddFn>
// number

// ThisParameterType<T> - 获取函数的 this 参数类型
interface Obj {
  name: string
}

function greet(this: Obj) {
  return `Hello, ${this.name}`
}

type GreetThis = ThisParameterType<typeof greet>
// Obj

// OmitThisParameter<T> - 移除函数的 this 参数
type GreetNoThis = OmitThisParameter<typeof greet>
// () => string
```

### 8.4 构造器工具类型

```typescript
// ConstructorParameters<T> - 获取构造器参数类型
class User {
  constructor(name: string, age: number) {}
}

type UserConstructorParams = ConstructorParameters<typeof User>
// [string, number]

// InstanceType<T> - 获取实例类型
type UserInstance = InstanceType<typeof User>
// User
```

### 8.5 高级工具类型

```typescript
// Record<K, T> - 构造对象类型
type Role = 'admin' | 'user' | 'guest'
type Permissions = Record<Role, string[]>

const permissions: Permissions = {
  admin: ['read', 'write', 'delete'],
  user: ['read', 'write'],
  guest: ['read']
}

// PartialBy<T, K> - 部分属性变为可选
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

interface User {
  id: number
  name: string
  email: string
}

type UserCreate = PartialBy<User, 'id'>
// { id?: number; name: string; email: string }

// DeepPartial<T> - 深度可选
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

interface Company {
  name: string
  address: {
    city: string
    zip: string
  }
}

type PartialCompany = DeepPartial<Company>
// { name?: string; address?: { city?: string; zip?: string } }
```

---

## 9. 在 React 中使用 TypeScript

### 9.1 组件类型

```typescript
// 函数组件类型
interface Props {
  title: string
  count?: number
  onClick?: () => void
}

function MyComponent({ title, count = 0, onClick }: Props) {
  return (
    <div onClick={onClick}>
      <h1>{title}</h1>
      <p>Count: {count}</p>
    </div>
  )
}

// 或使用 React.FC (虽然不推荐)
const MyComponent2: React.FC<Props> = ({ title, count = 0 }) => {
  return (
    <div>
      <h1>{title}</h1>
      <p>Count: {count}</p>
    </div>
  )
}
```

### 9.2 事件处理类型

```typescript
// 表单事件
function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault()
  // 处理表单提交
}

// 输入事件
function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
  const value = e.target.value
}

// 鼠标事件
function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
  console.log(e.currentTarget)
}

// 焦点事件
function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
  console.log(e.target)
}
```

### 9.3 useState 泛型

```typescript
import { useState } from 'react'

// 基础类型
const [count, setCount] = useState<number>(0)

// 对象类型
interface User {
  name: string
  age: number
}
const [user, setUser] = useState<User | null>(null)

// 数组类型
const [items, setItems] = useState<string[]>([])

// 复杂状态 - 使用类型推断
const [state, setState] = useState({
  loading: false,
  data: null as string | null,
  error: null as Error | null
})
```

### 9.4 useRef 泛型

```typescript
import { useRef, useEffect } from 'react'

// DOM 引用
const inputRef = useRef<HTMLInputElement>(null)

useEffect(() => {
  inputRef.current?.focus()
}, [])

// 可变值引用
const countRef = useRef<number>(0)
countRef.current++
```

### 9.5 useEffect 泛型

```typescript
import { useEffect, useState } from 'react'

// 带清理的副作用
useEffect(() => {
  const subscription = api.subscribe(data => {
    setData(data)
  })

  return () => {
    subscription.unsubscribe()
  }
}, [])

// 依赖项类型
interface User {
  id: number
  name: string
}

function useUser(userId: number) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        setUser(data)
        setLoading(false)
      })
  }, [userId])

  return { user, loading }
}
```

### 9.6 Context 类型

```typescript
// 创建 Context
interface ThemeContextValue {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null)

// 使用 Context
function useTheme() {
  const context = React.useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Provider
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  const toggleTheme = () => {
    setTheme(t => t === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
```

### 9.7 项目中的 TypeScript 实践

```typescript
// apps/web/src/app/page.tsx 中的类型使用

// 接口定义
interface TocItem {
  id: string
  text: string
  level: number
}

// 组件使用
export default function Home() {
  // 状态定义 - 使用类型
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [toc, setToc] = useState<TocItem[]>([])
  const [activeTocId, setActiveTocId] = useState<string>('')

  // 函数定义 - 参数和返回类型
  const handleMenuClick = (key: string): void => {
    setActiveMenu(key)
  }

  const handleTocClick = (id: string): void => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // 计算属性 - 使用泛型
  const totalDocs = useMemo(() => {
    let count = 0
    const countDocs = (items: any[]) => {
      items.forEach(item => {
        if (item.type === 'file') count++
        if (item.children) countDocs(item.children)
      })
    }
    countDocs(categories)
    return count
  }, [categories])

  return <div>...</div>
}
```

```typescript
// apps/web/src/store/index.ts 中的类型使用
interface AppState {
  // 状态类型
  activeMenu: string
  setActiveMenu: (menu: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  isDarkMode: boolean
  toggleDarkMode: () => void
  favorites: string[]
  addFavorite: (menu: string) => void
  removeFavorite: (menu: string) => void
}

// 使用泛型创建 store
export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      activeMenu: 'index',
      setActiveMenu: (menu) => set({ activeMenu: menu }),
      // ...
    }),
    {
      name: 'prepare-for-storage',
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        favorites: state.favorites,
      }),
    }
  )
)
```

### 9.8 常见 React + TypeScript 模式

```typescript
// 泛型组件
interface ListProps<T> {
  items: T[]
  renderItem: (item: T) => React.ReactNode
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{renderItem(item)}</li>
      ))}
    </ul>
  )
}

// 使用
<List
  items={['a', 'b', 'c']}
  renderItem={(item) => <span>{item}</span>}
/>

// forwardRef 组件
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, ...props }, ref) => {
    return (
      <div>
        <label>{label}</label>
        <input ref={ref} {...props} />
      </div>
    )
  }
)

// 添加显示名称
Input.displayName = 'Input'

// 高阶组件类型
function withLoading<T extends React.ComponentType<any>>(
  Component: T
): React.FC<React.ComponentProps<T>> {
  return ({ isLoading, ...props }) => {
    if (isLoading) return <div>Loading...</div>
    return <Component {...props as any} />
  }
}
```

---

## 常见错误和调试技巧

### 错误 1: "Implicit Any"

```typescript
// ❌ 错误: 参数隐式有 'any' 类型
function greet(user) {
  return user.name
}

// ✅ 正确: 添加类型注解
function greet(user: { name: string }) {
  return user.name
}

// 或在 tsconfig.json 中启用 strict: true
```

### 错误 2: "Type 'string' is not assignable to type"

```typescript
// ❌ 错误: 类型不匹配
const str: string = 123

// ✅ 正确: 使用正确的类型
const num: number = 123
```

### 错误 3: "Property does not exist on type"

```typescript
interface User {
  name: string
  age: number
}

const user: User = { name: '张三', age: 25 }

// ❌ 错误: email 不在 User 类型中
console.log(user.email)

// ✅ 正确: 先检查属性是否存在
if ('email' in user) {
  console.log(user.email)
}
```

### 错误 4: "Generic type 'XXX' requires 1 type argument(s)"

```typescript
// ❌ 错误: 缺少泛型参数
const [state, setState] = useState()

// ✅ 正确: 提供泛型参数
const [state, setState] = useState<string>('initial')
```

---

## 总结

TypeScript 为 JavaScript 添加了强大的类型系统，主要优势包括：

1. **静态类型检查** - 开发阶段发现错误
2. **代码补全** - IDE 提供更好的智能提示
3. **可维护性** - 大型项目更易维护
4. **重构支持** - 安全重构代码

掌握以下核心概念：
- 基本类型和类型推断
- 接口和类型别名
- 函数类型
- 泛型
- 装饰器
- 类型守卫
- 实用工具类型

这些知识将帮助你在 React 项目中编写类型安全的代码。
