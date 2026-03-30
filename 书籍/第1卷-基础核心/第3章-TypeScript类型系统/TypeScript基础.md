# 第1卷-基础核心

## 第3章 TypeScript类型系统

### 3.1 为什么学习 TypeScript

**面试官提问**

> "请介绍一下 TypeScript，以及为什么要在项目中使用它？"

**概念解释**

TypeScript 是由微软开发的 JavaScript 超集（Superset）。它为 JavaScript 添加了可选的静态类型、接口、泛型等高级特性，使得大型项目的开发更加安全和高效。可以把它想象成"带翻译器的 JavaScript"——你用 TypeScript 编写代码，TypeScript 编译器将其翻译成纯 JavaScript 代码。

**特别说明**

- **超集含义**：TypeScript 包含 JavaScript 的所有特性，同时增加了自己的语法。这意味着所有有效的 JavaScript 代码都是有效的 TypeScript 代码。
- **编译过程**：TypeScript 最终会被编译为 JavaScript，在浏览器或 Node.js 环境中运行。所以生产环境中不需要安装 TypeScript。

**主要优势包括**：

1. **强大的类型系统** - 在编译阶段就能发现潜在错误
2. **静态类型检查** - 代码在运行前就能发现类型错误
3. **完善的IDE支持** - 智能提示、代码导航、重构工具
4. **面向对象特性** - 类、接口、继承、抽象类
5. **现代JavaScript特性** - 支持最新的 ECMAScript 标准
6. **代码可读性和可维护性** - 类型即文档
7. **更好的团队协作** - 类型定义明确，减少沟通成本
8. **生态系统丰富** - 主流框架都提供 TypeScript 支持

**类比理解**

把 TypeScript 想象成一份"体检报告"：
- **JavaScript** 就像不做体检就直接上岗——身体有问题只有工作了才发现
- **TypeScript** 就像入职前做全面体检——在正式工作前就发现潜在健康问题

---

### 3.2 TypeScript 与 JavaScript 的区别

**面试官提问**

> "TypeScript 和 JavaScript 有什么区别？TypeScript 有什么优缺点？"

**概念解释**

| 特性 | JavaScript | TypeScript |
|------|------------|------------|
| 类型系统 | 动态类型 | 静态类型（可选） |
| 编译时检查 | 无 | 有 |
| 代码提示 | 有限 | 完整且准确 |
| 重构支持 | 困难 | 容易且安全 |
| 学习曲线 | 低 | 中等 |
| 运行时代码 | 直接执行 | 编译为 JavaScript |
| 接口/抽象类 | 不支持 | 完全支持 |
| 泛型 | 不支持 | 支持 |
| 装饰器 | 不支持 | 支持 |
| 模块系统 | ES Modules | ES Modules + namespace |

**具体应用实例**

```typescript
// JavaScript - 运行时不报错
function add(a, b) {
    return a + b;
}
console.log(add(1, "2")); // 输出: "12" (字符串拼接)

// TypeScript - 编译时就会报错
function add(a: number, b: number): number {
    return a + b;
}
add(1, "2"); // 编译错误: Type 'string' is not assignable to type 'number'
```

**特别说明**

**常见误区**：
1. "TypeScript 可以在浏览器直接运行" —— 错误！必须先编译成 JavaScript
2. "TypeScript 完全替代 JavaScript" —— 错误！TypeScript 最终还是转成 JavaScript 执行
3. "使用 TypeScript 性能会更好" —— 错误！编译后的 JavaScript 性能与手写 JS 相同

**最佳实践**：
- 新项目建议直接使用 TypeScript
- 从 JavaScript 迁移时，可以先使用 `allowJs: true` 逐步迁移
- 不要为了类型而类型，过度复杂的类型会增加维护成本

---

### 3.3 TypeScript 环境搭建与配置

**面试官提问**

> "如何搭建 TypeScript 开发环境？tsconfig.json 的主要配置项有哪些？"

**概念解释**

TypeScript 环境搭建主要包括：
1. 安装 TypeScript 编译器 (`tsc`)
2. 创建配置文件 (`tsconfig.json`)
3. 编写和编译代码

**具体应用实例**

#### 3.3.1 安装 TypeScript

```bash
# 全局安装 TypeScript（全局安装意味着可以在任意目录使用 tsc 命令）
npm install -g typescript

# 检查安装版本
tsc -v

# 本地安装（推荐，项目内安装）
npm install --save-dev typescript

# 使用 npx 运行本地版本
npx tsc --version
```

#### 3.3.2 初始化 TypeScript 项目

```bash
# 创建项目目录
mkdir my-ts-project
cd my-ts-project

# 初始化 npm 项目
npm init -y

# 安装 TypeScript
npm install --save-dev typescript

# 初始化 TypeScript 配置
npx tsc --init
```

#### 3.3.3 编译 TypeScript 文件

```bash
# 编译单个文件
tsc app.ts

# 监听模式自动编译（修改代码后自动重新编译）
tsc app.ts --watch
# 简写形式
tsc app.ts -w

# 编译整个项目（需要 tsconfig.json）
tsc

# 编译并指定配置文件
tsc --project tsconfig.json

# 编译并显示详细信息
tsc --project tsconfig.json --verbose
```

#### 3.3.4 使用 ts-node 直接运行

```bash
# 安装 ts-node（可以直接运行 TS 文件，无需手动编译）
npm install --save-dev ts-node

# 运行 TS 文件
npx ts-node app.ts
```

#### 3.3.5 tsconfig.json 配置文件详解

```json
{
    "compilerOptions": {
        /* 基础配置 */
        "target": "ES2020",          // 编译目标 JavaScript 版本
        "module": "ESNext",          // 模块系统
        "lib": ["ES2020", "DOM"],    // 引入的库定义文件

        /* 严格模式 - 强烈建议开启！ */
        "strict": true,                      // 开启所有严格类型检查
        "strictNullChecks": true,            // null/undefined 严格检查
        "strictFunctionTypes": true,        // 函数参数双向协变检查
        "strictPropertyInitialization": true, // 类属性必须初始化

        /* 模块解析 */
        "moduleResolution": "node",   // 模块解析策略
        "baseUrl": "./",              // 基础路径
        "paths": {                    // 路径别名
            "@/*": ["src/*"]
        },
        "resolveJsonModule": true,    // 允许导入 JSON 文件

        /* 输出配置 */
        "outDir": "./dist",           // 输出目录
        "rootDir": "./src",          // 源代码目录
        "declaration": true,          // 生成 .d.ts 类型声明文件
        "declarationDir": "./types", // 类型声明文件输出目录

        /* JavaScript 支持 */
        "allowJs": true,              // 允许编译 JavaScript 文件
        "checkJs": true,              // 对 JavaScript 文件进行类型检查

        /* 其他选项 */
        "jsx": "react-jsx",           // JSX 语法支持
        "esModuleInterop": true,      // 允许导入 CommonJS 模块
        "skipLibCheck": true,         // 跳过库文件类型检查（提升编译速度）
        "forceConsistentCasingInFileNames": true, // 强制文件名大小写一致
        "isolatedModules": true,      // 强制每个文件独立编译
        "noUnusedLocals": true,       // 报告未使用的局部变量
        "noUnusedParameters": true,   // 报告未使用的参数

        /* 实验性特性 */
        "experimentalDecorators": true,       // 启用装饰器
        "emitDecoratorMetadata": true        // 发射装饰器元数据
    },
    "include": ["src/**/*"],          // 要编译的文件
    "exclude": ["node_modules", "dist"], // 排除的文件
    "references": [{ "path": "./tsconfig.node.json" }] // 项目引用
}
```

**特别说明**

**最佳实践配置**：

```json
{
    "compilerOptions": {
        // 1. 始终使用严格模式
        "strict": true,

        // 2. 合理设置编译目标
        "target": "ES2020",
        "module": "ESNext",

        // 3. 开启这些选项避免常见错误
        "strictNullChecks": true,
        "noImplicitAny": true,
        "noImplicitReturns": true,
        "noFallthroughCasesInSwitch": true,

        // 4. 提升开发体验
        "esModuleInterop": true,
        "skipLibCheck": true
    }
}
```

**常见错误解决**：

1. **找不到模块 'xxx'**
   - 检查 `moduleResolution` 是否正确
   - 检查路径别名配置

2. **undefined 赋值错误**
   - 启用 `strictNullChecks: true`
   - 使用可选链 `?.` 和空值合并 `??`

3. **编译太慢**
   - 启用 `skipLibCheck: true`
   - 使用 `incremental: true`

---

## 第4章 TypeScript 基础类型系统

### 4.1 JavaScript 原始类型

**面试官提问**

> "TypeScript 有哪些基础类型？如何正确使用它们？"

**概念解释**

TypeScript 完全支持 JavaScript 的原始类型，并为其添加了类型注解功能。类型注解（Type Annotation）是一种告诉 TypeScript 变量应该是什么类型的语法。

**语法格式**：
```typescript
let 变量名: 类型 = 值;
```

---

#### 4.1.1 布尔类型 (boolean)

**概念解释**

布尔类型是最简单的类型，只有两个可能的值：`true` 和 `false`。用于表示逻辑判断结果。

**具体应用实例**

```typescript
// 基本用法
let isDone: boolean = false;
let isLoading: boolean = true;

// 逻辑运算
const isActive: boolean = !isDone;                    // 取反
const canAccess: boolean = isDone && isLoading;      // AND
const hasPermission: boolean = isDone || isLoading;  // OR

// 业务场景示例：用户权限系统
interface User {
    username: string;
    isAdmin: boolean;
    isVerified: boolean;
}

function canEditPost(user: User): boolean {
    return user.isAdmin || user.isVerified;
}

// 条件判断
const status: boolean = count > 10;
if (status) {
    console.log("Count is greater than 10");
}
```

**特别说明**

**常见误区**：
- 不要将 `0`、`1`、`""` 等假值直接赋给 `boolean` 类型
- 在 JavaScript 中 `new Boolean()` 返回的是对象，不是布尔值

**最佳实践**：
- 使用描述性的布尔变量命名（isXxx, hasXxx, canXxx）
- 避免过于复杂的布尔表达式，考虑提取为函数

---

#### 4.1.2 数字类型 (number)

**概念解释**

在 TypeScript 中，所有数字（整数和浮点数）都是 `number` 类型。不像某些语言区分 `int`、`float`、`double`，TypeScript 统一使用 `number`。

**具体应用实例**

```typescript
// 基本数字类型
let count: number = 10;
let decimal: number = 6.99;
let negative: number = -42;

// 不同进制的表示
let hex: number = 0xf00d;      // 十六进制 (0x 开头)
let binary: number = 0b1010;   // 二进制 (0b 开头)
let octal: number = 0o744;     // 八进制 (0o 开头)

// 特殊数值
let infinity: number = Infinity;           // 正无穷
let negativeInfinity: number = -Infinity;  // 负无穷
let notANumber: number = NaN;               // 非数值

// 数学运算示例
function calculateCircleArea(radius: number): number {
    return Math.PI * radius * radius;
}

function calculateDistance(
    x1: number, y1: number,
    x2: number, y2: number
): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// 数值范围判断
function isInRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
}

// 数值安全性检查
function safeDivide(a: number, b: number): number | null {
    if (b === 0) {
        return null;
    }
    return a / b;
}
```

**帮助理解**

```
十进制: 10, 42, 100
十六进制: 0xFF (255), 0x10 (16)
二进制: 0b1010 (10), 0b1111 (15)
八进制: 0o755 (493), 0o777 (511)
```

**特别说明**

**常见误区**：
- 不要将字符串 "10" 赋值给 `number` 类型
- `NaN` 仍然是 `number` 类型，`typeof NaN === "number"` 为 true

---

#### 4.1.3 字符串类型 (string)

**概念解释**

字符串类型用于表示文本数据。可以使用单引号、双引号或模板字符串。

**具体应用实例**

```typescript
// 基本用法
let name: string = "Tom";
let greeting: string = 'Hello';
let message: string = "Welcome to TypeScript";

// 模板字符串（使用反引号）
let template: string = `Hello, ${name}!`;
let multiLine: string = `
    This is a multi-line
    string in TypeScript
`;

// 字符串方法
let str: string = "Hello TypeScript";
let upper: string = str.toUpperCase();    // "HELLO TYPESCRIPT"
let lower: string = str.toLowerCase();    // "hello typescript"
let length: number = str.length;          // 16
let includes: boolean = str.includes("Type"); // true

// 业务示例：用户信息格式化
interface User {
    firstName: string;
    lastName: string;
    age: number;
}

function formatUserInfo(user: User): string {
    return `Name: ${user.firstName} ${user.lastName}, Age: ${user.age}`;
}

function getInitials(name: string): string {
    return name
        .split(" ")
        .map(part => part[0])
        .join("")
        .toUpperCase();
}
```

**特别说明**

**最佳实践**：
- 优先使用模板字符串，代码更清晰
- 处理用户输入时注意转义，防止 XSS

---

#### 4.1.4 数组类型 (array)

**概念解释**

数组类型表示一组相同类型元素的集合。TypeScript 支持两种定义数组的方式。

**具体应用实例**

```typescript
// 方式一：元素类型[]
let numbers: number[] = [1, 2, 3, 4, 5];
let strings: string[] = ["a", "b", "c"];

// 方式二：Array<元素类型>
let numbers2: Array<number> = [1, 2, 3];
let strings2: Array<string> = ["a", "b", "c"];

// 只读数组（不可修改）
const readonlyList: readonly number[] = [1, 2, 3];
const immutableList: ReadonlyArray<number> = [1, 2, 3];

// 数组常用操作
let arr: number[] = [1, 2, 3, 4, 5];

// map - 转换数组
let doubled: number[] = arr.map(x => x * 2);

// filter - 过滤数组
let even: number[] = arr.filter(x => x % 2 === 0);

// reduce - 聚合操作
let sum: number = arr.reduce((acc, curr) => acc + curr, 0);

// find - 查找元素
let found: number | undefined = arr.find(x => x > 3);

// 业务示例：学生成绩统计
interface Student {
    name: string;
    score: number;
}

function analyzeScores(students: Student[]): {
    average: number;
    highest: Student;
    lowest: Student;
    passed: number;
} {
    const scores = students.map(s => s.score);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    const highest = students.reduce((a, b) => a.score > b.score ? a : b);
    const lowest = students.reduce((a, b) => a.score < b.score ? a : b);
    const passed = students.filter(s => s.score >= 60).length;

    return { average, highest, lowest, passed };
}
```

**帮助理解**

```
数组类型示意:
number[]    →  [1, 2, 3]
string[]    →  ["a", "b", "c"]
User[]      →  [{id:1, name:"Tom"}, {id:2, name:"Lucy"}]

只读 vs 可变:
readonly number[] → 只能读取，不能修改元素
number[]          → 可以任意修改
```

**特别说明**

**常见误区**：
- 数组类型 `number[]` 和 `Array<number>` 在大多数情况下等价
- `readonly` 数组不能赋值给可变数组，反之则可以

---

#### 4.1.5 元组类型 (tuple)

**概念解释**

元组类型表示一个固定长度、每位置类型固定的数组。就像"结构化数据"的轻量级版本。

**具体应用实例**

```typescript
// 基本元组 - 固定长度，类型固定
let tuple: [string, number];
tuple = ["hello", 10];  // 正确
tuple = [10, "hello"]; // 错误！顺序不对
tuple = ["hello"];     // 错误！长度不对

// 可选元组 - 部分元素可选
let optionalTuple: [string, number?];
optionalTuple = ["hello"];     // 正确
optionalTuple = ["hello", 10]; // 正确

// 命名元组 - 增加可读性
const httpResponse: [status: number, body: string] = [200, "OK"];

// 实际应用场景

// 1. 坐标
type Point = [number, number];
const origin: Point = [0, 0];
const position: Point = [100, 200];

// 2. 键值对
type KeyValuePair = [string, any];
const config: KeyValuePair = ["theme", "dark"];

// 3. RGB 颜色
type RGB = [number, number, number];
const red: RGB = [255, 0, 0];
const green: RGB = [0, 255, 0];

// 4. 函数返回多个值
function getUserStats(): [string, number, boolean] {
    return ["Tom", 25, true];
}

const [name, age, isActive] = getUserStats();

// 5. 可变元组
type FlexibleTuple = [string, ...number[]];
const flexible: FlexibleTuple = ["test", 1, 2, 3, 4];

// 6. 字典和结构化数据
interface HttpResponse {
    status: number;
    data: string;
}

function parseResponse(response: [number, string]): HttpResponse {
    const [status, body] = response;
    return { status, data: body };
}
```

**帮助理解**

```
元组 vs 数组:
数组:   number[]     → 任意长度，同类型 [1], [1,2], [1,2,3]...
元组:   [number, string] → 固定长度，不同类型

元组示例:
[number, string]       → [1, "hello"]
[string, number, boolean] → ["Tom", 25, true]
[string, number?]       → ["hello"] 或 ["hello", 10]
```

**特别说明**

**最佳实践**：
- 元组适用于"少量、固定、异构"的数据
- 对于复杂数据结构，建议使用对象或接口
- 使用命名元组提高代码可读性

---

#### 4.1.6 枚举类型 (enum)

**概念解释**

枚举（Enum）是一种为一组数值赋予更友好名称的类型。适合用于表示固定数量的相关常量。

**具体应用实例**

```typescript
// 1. 数字枚举（默认从 0 开始）
enum Color {
    Red,    // 0
    Green,  // 1
    Blue    // 2
}

const c: Color = Color.Red;
console.log(c);  // 0

// 2. 数字枚举（自定义起始值）
enum Status {
    Pending = 1,
    InProgress = 2,
    Completed = 3,
    Failed = 4
}

// 3. 字符串枚举
enum Direction {
    Up = "UP",
    Down = "DOWN",
    Left = "LEFT",
    Right = "RIGHT"
}

// 4. 常量枚举（编译时被内联，不会生成实际代码）
const enum Directions {
    Up,
    Down,
    Left,
    Right
}

// 5. 异构枚举（混合字符串和数字）
enum Mixed {
    No = 0,
    Yes = "YES"
}

// 实际应用场景

// 场景1: HTTP 状态码
enum HttpStatus {
    OK = 200,
    Created = 201,
    BadRequest = 400,
    Unauthorized = 401,
    NotFound = 404,
    ServerError = 500
}

function handleStatus(status: HttpStatus): void {
    switch (status) {
        case HttpStatus.OK:
            console.log("Success");
            break;
        case HttpStatus.NotFound:
            console.log("Not found");
            break;
        // ...
    }
}

// 场景2: 权限级别
enum Permission {
    None = 0,
    Read = 1,
    Write = 2,
    Execute = 4,
    Admin = 8
}

function hasPermission(userPerm: Permission, required: Permission): boolean {
    return (userPerm & required) === required;
}

// 场景3: 日志级别
enum LogLevel {
    Debug = "DEBUG",
    Info = "INFO",
    Warn = "WARN",
    Error = "ERROR"
}

class Logger {
    log(level: LogLevel, message: string): void {
        console.log(`[${level}] ${message}`);
    }
}
```

**帮助理解**

```
枚举类型示意:
enum Color { Red, Green, Blue }

Color.Red   → 0
Color.Green  → 1
Color.Blue   → 2

反向映射:
Color[0]     → "Red"
Color[1]     → "Green"
Color[2]     → "Blue"
```

**特别说明**

**常见误区**：
- 数字枚举可以被赋值给 `number` 类型
- 字符串枚举不能反向映射

**最佳实践**：
- 使用 `const enum` 减少编译后代码体积
- 优先使用字符串枚举，便于调试
- 对于简单布尔场景，考虑使用联合类型

---

#### 4.1.7 Any 类型

**概念解释**

`any` 是 TypeScript 中最"宽松"的类型，表示任意类型。使用 `any` 相当于告诉 TypeScript"跳过类型检查"。应该尽量避免使用，但在某些场景下是必要的。

**具体应用实例**

```typescript
// any 可以接受任何值
let notSure: any = 4;
notSure = "maybe a string";  // 可以
notSure = false;             // 可以

// any 类型可以访问任意属性和方法
notSure.toString();          // 可以
notSure.foo();               // 可以
notSure.bar();               // 可以

// any 数组
let anyList: any[] = [1, "hello", true, { name: "Tom" }];

// 实际应用场景

// 场景1: 处理动态数据
function parseJSON(jsonString: string): any {
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        return null;
    }
}

// 场景2: 第三方库没有类型定义
// import $ from 'jquery';  // $ 是 any 类型

// 场景3: 类型未知时的临时处理
function processValue(value: unknown): void {
    // 需要先判断类型
    if (typeof value === 'string') {
        console.log(value.toUpperCase());
    }
}

// 场景4: 迁移 JavaScript 代码
// 逐步添加类型时可以先用 any 标记
let oldCode: any = /* 从 JS 迁移来的代码 */;
```

**帮助理解**

```
any 类型就像 "通行证":
- 任何类型都可以赋值给 any
- any 可以赋值给任何类型
- any 可以访问任何属性

any vs unknown:
any:     "我不在乎类型，请关闭所有检查"
unknown: "我暂时不知道类型，但使用前必须检查"
```

**特别说明**

**常见误区**：
- 过度使用 `any` 会失去 TypeScript 的类型安全优势
- `any` 会"污染"其他类型

**最佳实践**：
- 尽量避免使用 `any`
- 使用 `unknown` 代替 `any` 来处理未知类型
- 使用类型断言或类型守卫来处理 `unknown`

---

#### 4.1.8 Void 类型

**概念解释**

`void` 表示没有返回值。通常用于表示函数的返回类型。

**具体应用实例**

```typescript
// 函数返回 void
function warnUser(): void {
    console.log("This is a warning message");
    // 不需要 return 语句
    // 或者明确 return;
}

// 返回 undefined
function noReturn(): void {
    return undefined;  // 合法
}

// void 类型的变量（很少使用）
let unusable: void = undefined;
let unusable2: void = null;  // 如果 strictNullChecks: false

// 实际应用场景

// 场景1: 事件处理函数
type ClickHandler = (event: MouseEvent) => void;

const handleClick: ClickHandler = (event) => {
    console.log("Clicked at", event.clientX, event.clientY);
};

// 场景2: 回调函数
function fetchData(callback: (error: Error | null, data?: string) => void): void {
    // 模拟异步操作
    const success = Math.random() > 0.5;
    if (success) {
        callback(null, "Data loaded");
    } else {
        callback(new Error("Failed to fetch"));
    }
}

// 场景3: 数组方法
const actions: (() => void)[] = [
    () => console.log("Action 1"),
    () => console.log("Action 2"),
];

actions.forEach(action => action());
```

**帮助说明**

**void vs undefined**：
- `void` 表示"没有返回值"
- `undefined` 是一个具体的值
- 函数不显式返回时，实际返回的是 `undefined`

**特别说明**

**最佳实践**：
- 使用 `void` 而非 `undefined` 作为回调函数返回类型
- 注意：`void` 类型表示函数不关心返回值，而不是返回 `undefined`

---

#### 4.1.9 Null 和 Undefined

**概念解释**

`null` 和 `undefined` 是 JavaScript 中的两种空值类型。在 TypeScript 中，它们有各自独立的类型。

**具体应用实例**

```typescript
// 基础用法
let u: undefined = undefined;
let n: null = null;

// 联合类型 - 可能是某种值，也可能是空
let num: number | undefined = undefined;
let str: string | null = null;

// 严格模式下需要处理 null/undefined
interface User {
    name: string;
    email?: string;           // 可选属性，类型为 string | undefined
}

function processUser(user: User): void {
    // 可选链操作
    const email = user.email?.toLowerCase();

    // 空值合并
    const displayEmail = user.email ?? "No email provided";

    // 传统判断
    if (user.email !== undefined) {
        console.log(user.email);
    }
}

// 实际应用场景

// 场景1: 可选参数
function greet(name?: string): void {
    const displayName = name ?? "Guest";
    console.log(`Hello, ${displayName}!`);
}

// 场景2: 可能不存在的值
interface Config {
    database?: {
        host: string;
        port: number;
    };
}

function connect(config: Config): void {
    const host = config.database?.host;
    const port = config.database?.port;

    if (host && port) {
        console.log(`Connecting to ${host}:${port}`);
    }
}

// 场景3: 明确表示"无"
function findUser(id: number): User | null {
    // 找到返回用户，找不到返回 null
    return null;
}
```

**帮助理解**

```
null vs undefined:
undefined: "变量未初始化" 或 "属性不存在"
null:      "明确表示没有值"

使用场景:
- 函数参数未传 → undefined
- 明确表示"没有" → null
```

**特别说明**

**最佳实践**：
- 启用 `strictNullChecks: true`
- 使用可选链 `?.` 和空值合并 `??`
- 明确区分"未定义"和"无值"

---

#### 4.1.10 Never 类型

**概念解释**

`never` 表示"永不返回"的值。它用于表示：
1. 抛出异常的函数
2. 无限循环的函数
3. 类型 Guard 中"不可能"的分支

**具体应用实例**

```typescript
// 场景1: 抛出异常的函数
function error(message: string): never {
    throw new Error(message);
}

// 场景2: 无限循环
function infiniteLoop(): never {
    while (true) {
        // 永久阻塞
    }
}

// 场景3: never 在联合类型中
type Result<T> = { success: true; value: T } | { success: false; error: string };

function handleResult<T>(result: Result<T>): T {
    if (result.success) {
        return result.value;
    } else {
        // TypeScript 知道这里是 never，因为不可能执行到这里
        error(result.error);
    }
}

// 场景4: exhaustive check（穷尽检查）
enum ShapeType {
    Circle = "circle",
    Square = "square",
    Triangle = "triangle"
}

function getArea(shape: ShapeType): number {
    switch (shape) {
        case ShapeType.Circle:
            return Math.PI * 2 * 2;
        case ShapeType.Square:
            return 4 * 4;
        case ShapeType.Triangle:
            return 0.5 * 3 * 4;
        default:
            // 如果漏掉某个分支，TypeScript 会报错
            const exhaustiveCheck: never = shape;
            throw new Error(`Unknown shape: ${exhaustiveCheck}`);
    }
}

// 场景5: 过滤 never
type Filter<T, U> = T extends U ? never : T;

type ExcludeString = Filter<string, number>;  // string
type ExcludeNumber = Filter<number, string>;  // number
```

**帮助理解**

```
never 特点:
1. 永远不会有返回值
2. 不能赋值给任何类型（除了 never 自身）
3. 任何类型都可以赋值给 never（这是错误的推导）

使用场景:
- 抛出异常的函数
- 死循环函数
- 类型收窄的"不可能"分支
```

**特别说明**

**最佳实践**：
- 使用 `never` 进行穷尽性检查
- 在 switch 中使用 `never` 确保覆盖所有情况

---

#### 4.1.11 Object 类型

**概念解释**

`object` 表示非原始类型的值，即除了 `number`、`string`、`boolean`、`symbol`、`null`、`undefined` 之外的值。

**具体应用实例**

```typescript
// object 类型表示非原始类型
let obj: object = { name: "Tom" };
let arr: object = [1, 2, 3];
let func: object = function() {};

// 描述具体对象结构（更推荐）
let person: { name: string; age: number } = {
    name: "Tom",
    age: 25
};

// 完整示例：用户管理系统

interface User {
    id: number;
    name: string;
    email: string;
    role: "admin" | "user" | "guest";
    createdAt: Date;
    metadata?: Record<string, any>;
}

const user: User = {
    id: 1,
    name: "Tom",
    email: "tom@example.com",
    role: "admin",
    createdAt: new Date(),
    metadata: {
        department: "Engineering",
        level: 3
    }
};

// 对象方法
function updateUser(user: User, updates: Partial<User>): User {
    return { ...user, ...updates };
}

function getUserName(user: User): string {
    return user.name;
}

// Record 类型
type UserMap = Record<string, User>;
const users: UserMap = {
    "tom": { id: 1, name: "Tom", email: "tom@example.com", role: "admin", createdAt: new Date() },
    "lucy": { id: 2, name: "Lucy", email: "lucy@example.com", role: "user", createdAt: new Date() }
};
```

**帮助理解**

```
object vs Object:
- object: 非原始类型（推荐使用）
- Object: JavaScript Object 类（包含 toString 等方法）

{} vs object:
- {}: 空对象字面量（包含 Object.prototype 上的方法）
- object: 纯对象类型
```

**特别说明**

**最佳实践**：
- 使用接口或类型别名描述具体对象结构
- 避免使用泛泛的 `object` 类型

---

### 4.2 any、unknown、never 的区别与使用场景

**面试官提问**

> "TypeScript 中 any、unknown、never 有什么区别？何时使用？"

**概念解释**

这三个类型是 TypeScript 类型系统中的"特殊存在"，理解它们的区别对于编写类型安全的代码至关重要。

**类比理解**

```
any:     "我TypeScript管不了你了"           → 完全放弃类型检查
unknown: "我不知道你是什么，但用之前要检查"  → 类型安全版 any
never:   "你不可能到达这里"                  → 用于不可能的情况
```

---

#### 4.2.1 any 类型

**概念解释**

`any` 是"万金油"类型，可以绕过所有类型检查。使用 any 相当于对 TypeScript 说"我知道自己在做什么"。

**具体应用实例**

```typescript
let x: any = 10;
x = "hello";      // 可以
x = true;         // 可以
x.foo();          // 可以（但不安全）
x.bar();          // 可以（但不安全）

// any 数组
const anything: any[] = [1, "string", true, {}];

// any 会"污染"其他类型
function processAny(value: any): string {
    return value.toString(); // 不报错，但不安全
}

const str: string = anything[0]; // 不报错，可能有问题
```

**特别说明**

**使用场景**：
1. 迁移 JavaScript 代码到 TypeScript
2. 动态内容（如 JSON.parse 返回的结果）
3. 第三方库没有类型定义时临时使用

---

#### 4.2.2 unknown 类型

**概念解释**

`unknown` 是类型安全的 "any"。它表示"我不知道这个值是什么类型"，所以使用前必须进行类型检查。

**具体应用实例**

```typescript
let y: unknown = 10;
y = "hello";    // 可以
y = true;       // 可以

// y.toUpperCase(); // 错误！不能直接访问属性

// 类型守卫检查
if (typeof y === "string") {
    console.log(y.toUpperCase()); // 在这个分支，y 被推断为 string
}

// 类型断言
const str: string = y as string;

// 实际应用场景
function parseJSON(input: string): unknown {
    try {
        return JSON.parse(input);
    } catch {
        return null;
    }
}

const result = parseJSON('{"name":"Tom"}');
if (typeof result === "object" && result !== null) {
    // 现在 TypeScript 知道 result 是 object
    console.log((result as { name: string }).name);
}

// 使用 unknown 的安全函数
function safeGetProperty(obj: unknown, key: string): unknown {
    if (typeof obj === "object" && obj !== null && key in obj) {
        return (obj as Record<string, unknown>)[key];
    }
    return undefined;
}
```

**特别说明**

**最佳实践**：
- 处理未知类型时优先使用 `unknown`
- 使用类型守卫（type guard）缩小类型范围
- 不要直接使用 `unknown` 类型的值，先进行类型检查

---

#### 4.2.3 never 类型

**概念解释**

`never` 表示"永不"类型，通常用于：
1. 永远不会返回的函数
2. 类型收窄后的"不可能"分支

**具体应用实例**

```typescript
// 抛出异常
function throwError(message: string): never {
    throw new Error(message);
}

// 无限循环
function infiniteLoop(): never {
    while (true) {}
}

// 联合类型中的 never（被移除）
type T = string | never; // 等于 string

// 交叉类型中的 never
type T2 = string & never; // 等于 never

// 穷尽性检查
type Result<T> =
    | { type: "success"; data: T }
    | { type: "error"; error: Error };

function handle(result: Result<string>): string {
    switch (result.type) {
        case "success":
            return result.data;
        case "error":
            // TypeScript 知道 result.type 是 "error"
            // 返回类型被推断为 never
            throw new Error(result.error.message);
    }
}
```

---

#### 4.2.4 三者对比

| 特性 | any | unknown | never |
|------|-----|---------|-------|
| 类型检查 | 无 | 有 | 不适用 |
| 赋值给其他类型 | 可以 | 不可以 | 可以（但无意义） |
| 可访问属性 | 可以 | 不可以 | 不可以 |
| 使用场景 | 迁移JS、动态类型 | API类型安全 | 异常处理、穷尽检查 |
| 可赋值给 | 任何类型 | 仅 unknown 和 any | 任何类型 |

**最佳实践**

```typescript
// ❌ 不推荐：使用 any
function parseAny(input: any): number {
    return input * 2;
}

// ✅ 推荐：使用 unknown + 类型守卫
function parseUnknown(input: unknown): number {
    if (typeof input === "number") {
        return input * 2;
    }
    return 0;
}

// ✅ 推荐：使用类型断言（当确定类型时）
function parseKnown(input: unknown): number {
    return (input as number) * 2;
}

// 使用 never 进行穷尽检查
function assertNever(value: never): never {
    throw new Error(`Unexpected value: ${value}`);
}
```

---

## 第5章 接口与类型别名

**面试官提问**

> "TypeScript 中接口和类型别名有什么区别？什么时候使用接口，什么时候使用类型别名？"

**概念解释**

- **接口（Interface）**：用于定义对象的结构，是 TypeScript 最强大的特性之一
- **类型别名（Type Alias）**：为类型创建别名，可以用于任何类型

---

### 5.1 接口的定义和使用

**概念解释**

接口用于定义对象的"形状"（shape），告诉 TypeScript 对象应该有哪些属性，每个属性应该是什么类型。

---

#### 5.1.1 基本接口定义

**具体应用实例**

```typescript
// 基本接口
interface Person {
    name: string;
    age: number;
    email?: string;     // 可选属性
    readonly id: number; // 只读属性
}

const person: Person = {
    name: "Tom",
    age: 25,
    id: 1
};

// 尝试修改只读属性会报错
// person.id = 2; // Error: Cannot assign to 'id' because it is a read-only property

// 可选属性
interface User {
    username: string;
    password: string;
    nickname?: string;
    avatar?: string;
}

function createUser(username: string, password: string): User {
    return { username, password };
}

// 完整示例：学生信息管理系统
interface Student {
    id: string;
    name: string;
    age: number;
    grade: "A" | "B" | "C" | "D" | "E";
    subjects: string[];
    contact?: {
        email: string;
        phone: string;
    };
    readonly createdAt: Date;
}

function createStudent(
    id: string,
    name: string,
    age: number,
    grade: "A" | "B" | "C" | "D" | "E"
): Student {
    return {
        id,
        name,
        age,
        grade,
        subjects: [],
        createdAt: new Date()
    };
}

const student = createStudent("S001", "Tom", 18, "A");
```

**帮助理解**

```
接口属性修饰符:
string           → 必需属性，必须提供
string?          → 可选属性，可提供可不提供
readonly string  → 只读属性，创建后不能修改
```

**特别说明**

**常见误区**：
- 可选属性 `?` 不等于 `| undefined`
- 只读属性在运行时仍然可以被修改（只在 TypeScript 检查时生效）

---

#### 5.1.2 接口的方法

**具体应用实例**

```typescript
// 接口定义方法
interface Animal {
    name: string;
    speak(): void;           // 无返回值的方法
    move(distance: number): void;  // 带参数的方法
    getAge(): number;        // 有返回值的方法
}

class Dog implements Animal {
    name: string;
    age: number;

    constructor(name: string, age: number) {
        this.name = name;
        this.age = age;
    }

    speak(): void {
        console.log("Woof!");
    }

    move(distance: number): void {
        console.log(`${this.name} moved ${distance}m`);
    }

    getAge(): number {
        return this.age;
    }
}

// 多态示例
function makeSpeak(animal: Animal): void {
    animal.speak();
}

const dog = new Dog("Buddy", 3);
const cat: Animal = {
    name: "Whiskers",
    speak: () => console.log("Meow!"),
    move: (distance) => console.log(`Cat moved ${distance}m`),
    getAge: () => 2
};

makeSpeak(dog); // Woof!
makeSpeak(cat); // Meow!

// 实际应用：支付接口
interface PaymentProcessor {
    process(amount: number): Promise<boolean>;
    refund(transactionId: string): Promise<boolean>;
    getBalance(): Promise<number>;
}

class CreditCardProcessor implements PaymentProcessor {
    async process(amount: number): Promise<boolean> {
        console.log(`Processing credit card payment: $${amount}`);
        return true;
    }

    async refund(transactionId: string): Promise<boolean> {
        console.log(`Refunding transaction: ${transactionId}`);
        return true;
    }

    async getBalance(): Promise<number> {
        return 1000;
    }
}
```

---

#### 5.1.3 接口的继承

**概念解释**

接口可以继承其他接口，实现代码复用。TypeScript 支持多继承。

**具体应用实例**

```typescript
// 单继承
interface Named {
    name: string;
}

interface Person extends Named {
    age: number;
}

const person: Person = {
    name: "Tom",
    age: 25
};

// 多继承
interface Logger {
    log(message: string): void;
    error(message: string): void;
}

interface Serializable {
    serialize(): string;
    deserialize(data: string): void;
}

// 组合多个接口
interface PersistentLogger extends Logger, Serializable {
    save(): void;
    load(): void;
}

class FileLogger implements PersistentLogger {
    log(message: string): void {
        console.log(`[LOG] ${message}`);
    }

    error(message: string): void {
        console.error(`[ERROR] ${message}`);
    }

    serialize(): string {
        return "{}";
    }

    deserialize(data: string): void {
        console.log("Deserialized:", data);
    }

    save(): void {
        console.log("Saved to file");
    }

    load(): void {
        console.log("Loaded from file");
    }
}

// 实际应用：用户系统
interface BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}

interface User extends BaseEntity {
    username: string;
    email: string;
    role: "admin" | "user" | "guest";
}

interface AuditLog extends BaseEntity {
    userId: string;
    action: string;
    details: Record<string, any>;
}
```

**帮助理解**

```
接口继承示意:
    Named
       ↑
       |
    Person

    Logger     Serializable
       ↑            ↑
       |____________|
              ↑
         PersistentLogger
```

---

#### 5.1.4 接口的函数类型

**概念解释**

接口可以定义函数类型，用于描述函数的签名。

**具体应用实例**

```typescript
// 函数类型接口
interface SearchFunc {
    (source: string, subString: string): boolean;
}

// 使用函数类型接口
const search: SearchFunc = (source, subString) => {
    return source.includes(subString);
};

// 完整示例：数组操作器
interface ArrayMapper<T, U> {
    (item: T, index: number): U;
}

function mapArray<T, U>(arr: T[], mapper: ArrayMapper<T, U>): U[] {
    return arr.map(mapper);
}

const numbers = [1, 2, 3, 4, 5];
const doubled = mapArray(numbers, (num) => num * 2);
console.log(doubled); // [2, 4, 6, 8, 10]

// 回调函数类型
interface Callback<T> {
    (error: Error | null, result?: T): void;
}

function fetchData(callback: Callback<string>): void {
    setTimeout(() => {
        callback(null, "Data loaded");
    }, 1000);
}

fetchData((error, result) => {
    if (error) {
        console.error(error);
    } else {
        console.log(result);
    }
});

// 构造函数类型
interface Constructor<T> {
    new(...args: any[]): T;
}

function createInstance<T>(Constructor: Constructor<T>): T {
    return new Constructor();
}
```

---

#### 5.1.5 接口的索引签名

**概念解释**

索引签名允许对象有动态的属性名。用于描述"字典"类型的对象。

**具体应用实例**

```typescript
// 字符串索引签名
interface StringDictionary {
    [key: string]: string;
}

const dict: StringDictionary = {
    hello: "world",
    foo: "bar"
};

// 数字索引签名
interface NumberDictionary {
    [index: number]: string;
}

const numbers2: NumberDictionary = {
    0: "zero",
    1: "one",
    2: "two"
};

// 混合类型索引签名
interface MixedDict {
    [key: string]: string | number;
    length: number;
    name: string;
}

const mixed: MixedDict = {
    name: "Test",
    length: 10,
    key1: "value1",
    key2: 123
};

// 实际应用场景

// 1. 用户自定义属性
interface User {
    name: string;
    age: number;
    [customKey: string]: string | number;
}

const user: User = {
    name: "Tom",
    age: 25,
    email: "tom@example.com",  // 动态添加的属性
    phone: "1234567890"        // 动态添加的属性
};

// 2. 缓存系统
interface Cache<T> {
    [key: string]: T;
}

class SimpleCache<T> {
    private cache: Cache<T> = {};

    set(key: string, value: T): void {
        this.cache[key] = value;
    }

    get(key: string): T | undefined {
        return this.cache[key];
    }
}

const stringCache = new SimpleCache<string>();
stringCache.set("user:1", "Tom");
console.log(stringCache.get("user:1")); // Tom

// 3. 环境变量
interface EnvConfig {
    [key: string]: string;
}

const env: EnvConfig = {
    NODE_ENV: "development",
    PORT: "3000",
    API_URL: "http://localhost:3000"
};
```

**帮助理解**

```
索引签名示意:
[key: string]: string
 ↑        ↑
key名类型  value类型

常见的索引签名:
[string]: any      → 任意字符串键
[number]: T        → 任意数字键
[string, number]: any → 多个索引签名
```

**特别说明**

**最佳实践**：
- 尽量避免使用索引签名，因为它会丢失类型安全
- 优先使用具体的属性定义

---

#### 5.1.6 接口的额外属性检查

**概念解释**

TypeScript 会对接口进行额外的属性检查，防止传入未定义的属性。

**具体应用实例**

```typescript
interface Config {
    width: number;
    height: number;
    color?: string;
}

// 正常赋值
const config1: Config = {
    width: 100,
    height: 200
};

// 正常赋值（包含可选属性）
const config2: Config = {
    width: 100,
    height: 200,
    color: "red"
};

// ❌ 错误：存在未定义的属性
// const config3: Config = {
//     width: 100,
//     height: 200,
//     extra: "value" // Error: Object literal may only specify known properties
// };

// 解决方式1：使用类型断言
const config3: Config = {
    width: 100,
    height: 200,
    extra: "value"
} as Config;

// 解决方式2：使用索引签名
interface ExtendedConfig extends Config {
    [key: string]: any;
}

// 解决方式3：先将对象赋值给变量
const obj = {
    width: 100,
    height: 200,
    extra: "value"
};
const config4: Config = obj; // 不会报错
```

**特别说明**

这是 TypeScript 的"额外属性检查"特性，旨在帮助开发者发现拼写错误等问题。

---

### 5.2 类型别名的使用

**概念解释**

类型别名（Type Alias）使用 `type` 关键字为类型创建名称。它可以用于任何类型，不仅仅是对象。

**具体应用实例**

```typescript
// 基本类型别名
type ID = string;
type Name = string;
type Age = number;

// 对象类型别名
type Point = {
    x: number;
    y: number;
};

type User = {
    id: ID;
    name: Name;
    age: Age;
};

// 联合类型别名
type Status = "pending" | "success" | "error";
type Result<T> = { success: true; data: T } | { success: false; error: string };

// 元组类型别名
type Coordinates = [number, number];
type RGB = [number, number, number];

// 函数类型别名
type Handler = (event: Event) => void;
type Predicate<T> = (item: T) => boolean;

// 映射类型
type Readonly<T> = {
    readonly [P in keyof T]: T[P];
};

type Partial<T> = {
    [P in keyof T]?: T[P];
};

// 条件类型
type NonNullable<T> = T extends null | undefined ? never : T;

// 实际应用

// 1. API 响应包装
type ApiResponse<T> =
    | { status: "loading" }
    | { status: "success"; data: T }
    | { status: "error"; error: Error };

// 2. 事件系统
type EventHandler<T = any> = (payload: T) => void;

interface EventMap {
    click: { x: number; y: number };
    keypress: { key: string };
    error: Error;
}

type EventEmitter<T extends Record<string, any>> = {
    [K in keyof T]: EventHandler<T[K]>;
};

// 3. 状态机
type State = "idle" | "loading" | "success" | "error";

type Transition = {
    from: State;
    to: State;
    action: string;
};
```

---

### 5.3 接口 vs 类型别名

**面试官提问**

> "接口和类型别名有什么区别？应该优先使用哪个？"

**对比表**

| 特性 | 接口 | 类型别名 |
|------|------|----------|
| 对象类型 | 支持 | 支持 |
| 扩展 | extends | 交叉类型 (&) |
| 合并 | 自动合并 | 不支持 |
| 计算属性 | 不支持 | 支持 |
| 联合类型 | 不支持 | 支持 |
| 元组 | 不支持 | 支持 |
| 函数类型 | 支持 | 支持 |

**具体应用实例**

```typescript
// 接口可以自动合并（声明合并）
interface User {
    name: string;
}

interface User {
    age: number;
}

// User 实际上是 { name: string; age: number; }

// 类型别名不能合并
// type User = { name: string; };
// type User = { age: number; }; // Error: Duplicate identifier

// 类型别名支持更多类型
type StringOrNumber = string | number;
type Tuple = [string, number];
type Callback = () => void;

// 接口支持声明合并，适合库扩展
interface Window {
    myCustomProperty: string;
}

// 使用场景选择

// ✅ 优先使用接口的场景：定义对象结构
interface Person {
    name: string;
    age: number;
}

// ✅ 优先使用类型别名的场景：联合类型、元组、函数类型
type Status = "pending" | "approved" | "rejected";
type Coordinates = [number, number];
type EventHandler = (e: Event) => void;
```

**特别说明**

**最佳实践**：
1. 定义对象结构时，优先使用接口（更好的扩展性）
2. 使用联合类型、元组、函数类型时，使用类型别名
3. 需要声明合并时，必须使用接口
4. 复杂类型考虑使用类型别名提高可读性
