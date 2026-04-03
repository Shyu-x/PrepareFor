# TypeScript底层原理完全指南

> **导读**：TypeScript 不仅是 JavaScript 的类型化超集，更是一门**编译时编程语言**。理解 TypeScript 的底层原理，能让你从"类型使用者"进化为"类型设计师"。本指南将深入编译器内核，揭示类型检查的奥秘，探讨泛型、条件类型、映射类型的本质，帮助你掌握类型编程的最高境界。

---

## 目录

1. [TypeScript架构](#1-typescript架构)
2. [类型系统深入](#2-类型系统深入)
3. [编译原理](#3-编译原理)
4. [类型检查原理](#4-类型检查原理)
5. [泛型底层](#5-泛型底层)
6. [条件类型底层](#6-条件类型底层)
7. [映射类型底层](#7-映射类型底层)
8. [TypeScript编译器扩展](#8-typescript编译器扩展)
9. [类型编程进阶](#9-类型编程进阶)
10. [性能优化](#10-性能优化)

---

## 1. TypeScript架构

### 1.1 TypeScript编译器架构概览

TypeScript 编译器（`tsc`）是一个复杂的五阶段流水线系统，每个阶段都有其独特的职责和使命。理解这个架构，是掌握 TypeScript 底层原理的第一步。

```
源码字符串
    ↓
┌─────────────────────────────────────────────────────────────────┐
│                     Scanner（扫描器）                            │
│  功能：将字符流转换为 Token 流                                   │
│  输入："const x: number = 123"                                  │
│  输出：Token序列 [const, 标识符(x), 冒号, 类型(number), 等号,   │
│        数字(123), 分号]                                         │
└─────────────────────────────────────────────────────────────────┘
    ↓ Token流
┌─────────────────────────────────────────────────────────────────┐
│                     Parser（解析器）                             │
│  功能：将 Token 流构建为 AST（抽象语法树）                        │
│  输出：树形结构，包含所有语法节点                                 │
└─────────────────────────────────────────────────────────────────┘
    ↓ AST
┌─────────────────────────────────────────────────────────────────┐
│                     Binder（绑定器）                             │
│  功能：创建符号表（Symbol Table），关联声明与引用                  │
│  输出：符号信息、作用域链、类型信息                               │
└─────────────────────────────────────────────────────────────────┘
    ↓ 带符号信息的 AST
┌─────────────────────────────────────────────────────────────────┐
│                     Checker（检查器）                            │
│  功能：类型检查、类型推断、类型兼容性判断                          │
│  输出：类型错误报告                                             │
└─────────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────────┐
│                     Emitter（发射器）                            │
│  功能：生成 JavaScript 代码、声明文件、Source Map                  │
│  输出：.js 文件、.d.ts 文件、.map 文件                           │
└─────────────────────────────────────────────────────────────────┘
    ↓
JavaScript代码 + 声明文件
```

### 1.2 各阶段详细解析

#### 1.2.1 Scanner（扫描器）

扫描器是编译器的第一阶段，负责将源代码的字符流转换为有意义的 Token 序列。这是词法分析的核心实现。

**扫描器的工作原理：**

```typescript
// 源代码
const name: string = "张三";

// 扫描过程伪代码
function scanner(source: string) {
  const tokens: Token[] = [];
  let pos = 0;

  while (pos < source.length) {
    // 跳过空白字符
    if (isWhitespace(source[pos])) {
      pos++;
      continue;
    }

    // 识别关键字和标识符
    if (isAlpha(source[pos])) {
      const start = pos;
      while (isAlphaNumeric(source[pos])) {
        pos++;
      }
      const text = source.substring(start, pos);
      const type = isKeyword(text) ? 'keyword' : 'identifier';
      tokens.push({ type, text });
      continue;
    }

    // 识别数字字面量
    if (isDigit(source[pos])) {
      const start = pos;
      while (isDigit(source[pos])) {
        pos++;
      }
      tokens.push({ type: 'number', text: source.substring(start, pos) });
      continue;
    }

    // 识别字符串字面量
    if (source[pos] === '"' || source[pos] === "'") {
      const quote = source[pos];
      const start = pos;
      pos++; // 跳过开始引号
      while (source[pos] !== quote && pos < source.length) {
        pos++;
      }
      pos++; // 跳过结束引号
      tokens.push({ type: 'string', text: source.substring(start, pos) });
      continue;
    }

    // 识别运算符和界符
    tokens.push({ type: 'punctuation', text: source[pos] });
    pos++;
  }

  return tokens;
}
```

**TypeScript 扫描器的实际实现特征：**

| 特性 | 说明 | 示例 |
|------|------|------|
| Unicode 支持 | 完整支持 UTF-8 编码 | `const 年龄: number = 25;` |
| 取消扫描 | 支持 tokens 取消以实现错误恢复 | 在遇到非法字符时继续扫描 |
| 位置信息 | 每个 token 包含行列号 | 用于精确错误定位 |
| 哈希网关 | 处理 /、*、/> 等上下文相关字符 | 区分除法和注释 |

#### 1.2.2 Parser（解析器）

解析器将 Token 流转换为抽象语法树（AST）。TypeScript 使用递归下降解析器，配合适当的运算符优先级处理。

**AST 节点结构示例：**

```typescript
// 源代码
const x: number = 123;

// 对应的 AST 结构（简化版）
{
  kind: "VariableStatement",
  declarationList: {
    kind: "VariableDeclarationList",
    declarations: [{
      kind: "VariableDeclaration",
      name: {
        kind: "Identifier",
        text: "x",
        pos: 6
      },
      type: {
        kind: "KeywordTypeNode",
        text: "number",
        pos: 8
      },
      initializer: {
        kind: "NumericLiteral",
        text: "123",
        pos: 16
      }
    }]
  }
}
```

**TypeScript 解析器支持的语法扩展：**

```typescript
// JSX 语法支持
const element = <div className="container">Hello</div>;

// 可选链表达式
const name = user?.profile?.name;

// 空值合并运算符
const value = input ?? "default";

// 装饰器语法
@decorator
class MyClass {}

// 模块语法
import { x } from "./module";
export const y = 1;
```

#### 1.2.3 Binder（绑定器）

绑定器是 TypeScript 编译器中最独特的设计，它负责建立符号之间的联系，是实现跨文件类型检查的关键。

**绑定器的核心任务：**

```typescript
// 绑定器创建的数据结构

interface SymbolTable {
  // 符号表：名称 -> 符号信息
  symbols: Map<string, Symbol>;

  // 作用域栈
  scopes: Scope[];
}

interface Symbol {
  id: number;                    // 唯一标识符
  name: string;                   // 符号名称
  flags: SymbolFlags;            // 符号类型标志
  declarations: Declaration[];   // 声明位置
  type?: Type;                   // 关联的类型
}

interface Scope {
  kind: ScopeKind;               // 模块、函数、块等
  symbols: Map<string, Symbol>;  // 作用域内的符号
  parent?: Scope;                // 父作用域
}
```

**绑定过程示例：**

```typescript
// 文件：user.ts
interface User {
  name: string;
  age: number;
}

class UserService {
  private user: User;  // 绑定器将这里的 User 引用链接到上面的 interface

  getUser(): User {   // 再次链接
    return this.user;
  }
}

// 绑定器内部逻辑
function bind(node: Node, checker: TypeChecker, binder: Binder) {
  switch (node.kind) {
    case SyntaxKind.InterfaceDeclaration:
      // 创建接口符号
      const interfaceSymbol = createSymbol(
        node.name.text,
        SymbolFlags.Interface
      );
      // 将符号注册到当前作用域
      addSymbolToScope(binder.currentScope, interfaceSymbol);
      // 绑定接口成员
      bindChildren(node);
      break;

    case SyntaxKind.TypeReference:
      // 类型引用查找
      const refSymbol = resolveName(
        node.typeName,           // 引用名称
        SymbolFlags.Type,         // 在类型空间中查找
        node
      );
      // 建立引用关系
      node.symbol = refSymbol;
      break;
  }
}
```

#### 1.2.4 Checker（检查器）

检查器是 TypeScript 编译器中代码量最大的部分（占编译器总代码量的80%以上），负责执行所有类型检查逻辑。

**检查器的核心算法：**

```typescript
// 类型检查器核心伪代码
class TypeChecker {
  // 上下文信息
  currentNode: Node;
  currentSymbol: Symbol;
  currentScope: Scope;

  // 递归检查入口
  checkNode(node: Node): Type {
    switch (node.kind) {
      case SyntaxKind.BinaryExpression:
        return this.checkBinaryExpression(node);
      case SyntaxKind.CallExpression:
        return this.checkCallExpression(node);
      case SyntaxKind.PropertyAccessExpression:
        return this.checkPropertyAccess(node);
      case SyntaxKind.Identifier:
        return this.checkIdentifier(node);
      // ... 数百种节点类型
    }
  }

  // 二元表达式检查
  checkBinaryExpression(node: BinaryExpression): Type {
    const leftType = this.checkNode(node.left);
    const rightType = this.checkNode(node.right);

    switch (node.operatorToken.kind) {
      case SyntaxKind.PlusToken:
        // 加法类型检查
        if (this.isStringType(leftType) || this.isStringType(rightType)) {
          return this.stringType; // 字符串连接
        }
        if (this.isNumericType(leftType) && this.isNumericType(rightType)) {
          return this.numberType;
        }
        this.reportError(node, "加法运算符不能用于这两个类型");
        return this.errorType;

      case SyntaxKind.EqualsToken:
        // 赋值类型检查
        if (!this.isAssignableTo(rightType, leftType)) {
          this.reportError(node, "不能将类型 X 赋值给类型 Y");
        }
        return leftType;
    }
  }

  // 函数调用检查
  checkCallExpression(node: CallExpression): Type {
    const signature = this.resolveCallSignature(node);
    if (!signature) {
      this.reportError(node, "类型不存在调用签名");
      return this.errorType;
    }

    // 检查参数类型
    const params = signature.parameters;
    const args = node.arguments;

    for (let i = 0; i < params.length; i++) {
      const paramType = this.getTypeOfSymbol(params[i]);
      const argType = this.checkNode(args[i]);

      if (!this.isAssignableTo(argType, paramType)) {
        this.reportError(args[i], `参数类型不匹配`);
      }
    }

    return signature.returnType;
  }
}
```

#### 1.2.5 Emitter（发射器）

发射器负责将 TypeScript AST 转换为 JavaScript 代码，同时生成类型声明文件。

**发射器的工作流程：**

```typescript
// 发射器核心伪代码
class Emitter {
  // 输出配置
  private target: ScriptTarget;      // ES5/ES6/ES2020 等
  private moduleKind: ModuleKind;   // CommonJS/ESNext 等

  // 转换入口
  emitNode(node: Node): Output {
    switch (node.kind) {
      case SyntaxKind.VariableStatement:
        return this.emitVariableStatement(node);
      case SyntaxKind.FunctionDeclaration:
        return this.emitFunctionDeclaration(node);
      case SyntaxKind.ClassDeclaration:
        return this.emitClassDeclaration(node);
      case SyntaxKind.InterfaceDeclaration:
        return this.emitInterfaceDeclaration(node); // 接口不生成代码
    }
  }

  // 变量声明转换示例
  emitVariableStatement(node: VariableStatement): Output {
    const output = [];

    for (const decl of node.declarationList.declarations) {
      // 移除类型注解
      const name = decl.name.text;

      if (decl.initializer) {
        // 保留初始化表达式
        const init = this.emitNode(decl.initializer);
        output.push(`var ${name} = ${init};`);
      } else {
        output.push(`var ${name};`);
      }
    }

    return output.join('\n');
  }

  // 类声明转换
  emitClassDeclaration(node: ClassDeclaration): Output {
    const members = [];

    // 构造函数
    const ctor = node.members.find(m => m.kind === SyntaxKind.Constructor);
    if (ctor) {
      members.push(this.emitConstructor(ctor));
    }

    // 方法
    for (const member of node.members) {
      if (member.kind === SyntaxKind.MethodDeclaration) {
        members.push(this.emitMethod(member));
      }
    }

    return `class ${node.name.text} {\n${members.join('\n')}\n}`;
  }

  // 生成声明文件
  emitDeclarationFile(sourceFile: SourceFile): string {
    const declarations = [];

    for (const statement of sourceFile.statements) {
      if (statement.kind === SyntaxKind.InterfaceDeclaration) {
        declarations.push(this.emitInterfaceDeclaration(statement));
      } else if (statement.kind === SyntaxKind.TypeAliasDeclaration) {
        declarations.push(this.emitTypeAliasDeclaration(statement));
      } else if (statement.kind === SyntaxKind.ClassDeclaration) {
        declarations.push(this.emitClassDeclaration(statement));
      }
    }

    return declarations.join('\n');
  }
}
```

### 1.3 源码到JS的编译过程

理解 TypeScript 编译的完整流程，对于调试类型错误和优化构建过程至关重要。

```
┌──────────────────────────────────────────────────────────────────────┐
│                         完整编译流程                                  │
└──────────────────────────────────────────────────────────────────────┘

阶段1：初始化
│
├─ 读取 tsconfig.json
├─ 解析编译选项（target, module, strict 等）
├─ 收集文件列表（files, include, exclude）
└─ 初始化编译器实例

阶段2：扫描与解析（Scanner → Parser）
│
├─ 逐文件扫描源码
├─ 生成 Token 流
├─ 解析为 AST
└─ 输出：SourceFile 对象列表

阶段3：符号绑定（Binder）
│
├─ 构建符号表
├─ 建立声明引用关系
├─ 解析作用域链
└─ 输出：带符号信息的 AST

阶段4：类型检查（Checker）
│
├─ 声明类型检查
├─ 表达式类型检查
├─ 类型推断
├─ 类型兼容性检查
└─ 输出：错误列表、类型信息

阶段5：发射输出（Emitter）
│
├─ 生成 JavaScript 代码
├─ 生成 .d.ts 声明文件
├─ 生成 Source Map
└─ 输出：.js, .d.ts, .map 文件
```

### 1.4 tsconfig.json配置详解

`tsconfig.json` 是 TypeScript 项目的核心配置文件，理解每个选项对于优化编译过程至关重要。

```json
{
  // 编译选项分为两大类：严格检查 和 输出控制
  "compilerOptions": {

    // ===== 语言和环境 =====
    "target": "ES2022",              // 编译目标 JavaScript 版本
    "lib": ["ES2022", "DOM"],        // 运行时 API 库
    "module": "ESNext",              // 模块系统
    "moduleResolution": "bundler",   // 模块解析策略（bundler/node10/node16/node20）
    "lib": ["ES2022", "DOM", "DOM.Iterable"],

    // ===== 严格模式（强烈建议开启） =====
    "strict": true,                  // 启用所有严格检查（相当于同时开启以下所有）
    "noImplicitAny": true,           // 不允许隐式 any 类型
    "strictNullChecks": true,       // 严格的空值检查
    "strictFunctionTypes": true,     // 严格的函数类型检查
    "strictBindCallApply": true,    // 严格的 bind/call/apply 检查
    "strictPropertyInitialization": true, // 类属性必须初始化
    "noImplicitThis": true,          // 不允许 this 隐式 any
    "useUnknownInCatchVariables": true,  // catch 变量类型为 unknown
    "alwaysStrict": true,            // 始终使用严格模式
    "noUnusedLocals": true,          // 检查未使用的局部变量
    "noUnusedParameters": true,     // 检查未使用的参数
    "noImplicitReturns": true,       // 检查代码路径是否都返回
    "noFallthroughCasesInSwitch": true, // switch 必须处理所有 case

    // ===== 输出控制 =====
    "outDir": "./dist",              // 输出目录
    "rootDir": "./src",             // 源码根目录
    "declaration": true,             // 生成 .d.ts 声明文件
    "declarationMap": true,          // 生成声明文件的 Source Map
    "sourceMap": true,               // 生成 Source Map
    "removeComments": true,          // 删除注释
    "emitDeclarationOnly": false,   // 仅输出声明文件

    // ===== 高级选项 =====
    "incremental": true,             // 增量编译
    "tsBuildInfoFile": ".tsbuildinfo", // 编译缓存文件位置
    "composite": true,               // 启用项目引用（用于大项目拆分）
    "skipLibCheck": true,            // 跳过 .d.ts 文件类型检查
    "allowSyntheticDefaultImports": true, // 允许合成默认导入
    "esModuleInterop": true,         // 启用 ES 模块互操作
    "forceConsistentCasingInFileNames": true, // 强制文件名大小写一致
    "resolveJsonModule": true,       // 允许导入 JSON 文件
    "isolatedModules": true,         // 每个文件作为独立模块检查

    // ===== 实验性特性 =====
    "experimentalDecorators": true,  // 启用装饰器（旧语法）
    "emitDecoratorMetadata": true,   // 为装饰器生成元数据
    "target": "ES2022",
    "jsx": "react-jsx",              // JSX 处理模式（preserve/react-native/react-jsx）

    // ===== 路径映射 =====
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"],
      "@components/*": ["./components/*"]
    }
  },

  // ===== 文件包含/排除 =====
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"],
  "files": ["src/index.ts"]          // 明确指定要编译的文件
}
```

### 1.5 我的思考：为什么TypeScript需要编译

**核心原因：JavaScript 没有运行时有类型系统**

JavaScript 是一门**动态类型语言**，它的执行环境（浏览器、Node.js）在运行时并不保存类型信息。当代码执行时：

```javascript
// JavaScript 运行时不保留类型信息
let x = 123;     // 运行到这里，x 是数字
x = "hello";     // 运行到这里，x 变成字符串
x = true;        // 又变成布尔值
```

**TypeScript 的解决方案**

TypeScript 在编译时进行类型检查，然后将类型信息"擦除"，生成标准的 JavaScript：

```typescript
// TypeScript 源码
function greet(name: string): string {
  return "Hello, " + name;
}

greet("张三");  // 编译时检查：OK
greet(123);     // 编译时错误：类型 'number' 不能赋值给类型 'string'

// 编译生成的 JavaScript（类型擦除）
function greet(name) {
  return "Hello, " + name;
}

greet("张三");  // 正常运行
```

**为什么不能直接在运行时保留类型？**

| 方案 | 问题 | TypeScript 选择 |
|------|------|----------------|
| 运行时保留类型 | 性能开销、破坏 JS 生态兼容 | 编译时检查，运行时擦除 |
| 解释执行 | 无法与现有 JS 引擎兼容 | 生成标准 JS，兼容所有引擎 |
| 新运行时 | 需要所有环境重新实现 | 编译到 JS，利用现有生态 |

**类型擦除的实际效果**

```typescript
// TypeScript 源码
interface User {
  name: string;
  age: number;
}

function processUser(user: User): void {
  console.log(user.name, user.age);
}

// 编译后的 JavaScript
function processUser(user) {
  console.log(user.name, user.age);
}

// 接口和类型信息完全消失
```

**类型擦除的边界情况**

有些 TypeScript 特性需要保留到运行时：

```typescript
// 1. 类型谓词（需要生成类型保护代码）
function isString(value: unknown): value is string {
  return typeof value === "string";
}

// 编译后仍然需要这个函数
function isString(value) {
  return typeof value === "string";
}

// 2. 枚举（默认编译为对象）
enum Direction {
  Up = "UP",
  Down = "DOWN"
}

// 编译后
var Direction;
(function (Direction) {
  Direction["Up"] = "UP";
  Direction["Down"] = "DOWN";
})(Direction || (Direction = {}));

// 3. 命名空间（编译为 IIFE）
namespace Validation {
  export function isEmail(email: string): boolean {
    return email.includes("@");
  }
}

// 编译后
var Validation;
(function (Validation) {
  function isEmail(email) {
    return email.includes("@");
  }
  Validation.isEmail = isEmail;
})(Validation || (Validation = {}));
```

---

## 2. 类型系统深入

### 2.1 原始类型与对象类型

TypeScript 的类型系统建立在 JavaScript 类型的基础上，但进行了更严格的分类和定义。

**TypeScript 类型层次结构**

```
                    ┌─────────────┐
                    │    unknown   │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────┴──────┐     │     ┌──────┴──────┐
       │    any      │     │     │    never    │
       └─────────────┘     │     └─────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────┴──────┐     │     ┌──────┴──────┐
       │  primitive  │     │     │   object    │
       └──────┬──────┘     │     └──────┬──────┘
              │            │            │
     ┌────────┼────────┐   │   ┌────────┼────────┐
     │        │        │   │   │        │        │
┌────┴───┐ ┌┴───┐ ┌───┴┐ ┌─┴┐ ┌┴───┐ ┌───┴───┐ ┌─┴─────┐
│ number │ │str │ │bool│ │nu││arr │ │function│ │object │
└────────┘ └────┘ └────┘ └──┘└─────┘ └───────┘ └───────┘
```

**原始类型详解**

```typescript
// 原始类型（Primitive Types）
// 这些类型在 JavaScript 中是不可变的值

// 1. number - 所有数字，包括整数和浮点数
let decimal: number = 42;
let hex: number = 0x2A;           // 十六进制
let binary: number = 0b101010;   // 二进制
let octal: number = 0o52;        // 八进制
let float: number = 3.14159;     // 浮点数

// 2. string - 字符串
let name: string = "张三";
let template: string = `Hello, ${name}`;  // 模板字符串

// 3. boolean - 布尔值
let isActive: boolean = true;
let isCompleted: boolean = false;

// 4. undefined - 未定义
let uninitialized: undefined = undefined;

// 5. null - 空值
let empty: null = null;

// 6. symbol - 唯一标识符
let sym: symbol = Symbol("unique");
let sym2: symbol = Symbol("unique");
console.log(sym === sym2); // false

// 7. bigint - 大整数
let bigNumber: bigint = 9007199254740991n;

// void - 无返回值函数
function logMessage(): void {
  console.log("This function returns nothing");
}

// never - 从不返回（抛出异常或无限循环）
function throwError(): never {
  throw new Error("This function never returns");
}

function infiniteLoop(): never {
  while (true) {
    // 无穷循环
  }
}
```

**对象类型详解**

```typescript
// 对象类型（Object Types）

// 1. 接口定义对象
interface User {
  id: number;
  name: string;
  email?: string;           // 可选属性
  readonly createdAt: Date; // 只读属性
  [key: string]: any;       // 索引签名
}

// 2. 类型字面量
type Point = {
  x: number;
  y: number;
};

// 3. 类作为类型
class Person {
  constructor(
    public name: string,
    public age: number
  ) {}
}

let person: Person = new Person("张三", 25);

// 4. 数组类型
let numbers: number[] = [1, 2, 3, 4, 5];
let names: Array<string> = ["Alice", "Bob", "Charlie"];

// 5. 元组类型（固定长度和类型的数组）
let tuple: [string, number, boolean] = ["hello", 42, true];
let [first, second, third] = tuple;  // 解构赋值

// 6. 函数类型
type Callback = (error: Error | null, result?: string) => void;

interface Handler {
  (event: Event): void;
  once?: boolean;  // 可选的方法
}

// 7. 枚举类型
enum Status {
  Pending = "PENDING",
  Active = "ACTIVE",
  Completed = "COMPLETED"
}

// 8. 联合类型
type StringOrNumber = string | number;
type UserOrAdmin = User | Admin;

// 9. 交叉类型
type Employee = User & {
  department: string;
  salary: number;
};

// 10. 映射类型
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

type Optional<T> = {
  [P in keyof T]?: T[P];
};
```

### 2.2 类型装箱：Number vs number

这是 TypeScript 类型系统中一个微妙但重要的区别。

**JavaScript 的装箱机制**

```javascript
// JavaScript 中，原始类型在需要时会自动"装箱"为对象
let primitiveNumber = 42;
let boxedNumber = new Number(42);

console.log(typeof primitiveNumber); // "number"（原始类型）
console.log(typeof boxedNumber);     // "object"（对象）

// 装箱后可以访问对象的方法
primitiveNumber.toFixed(2);  // JS 自动装箱：(new Number(primitiveNumber)).toFixed(2)
```

**TypeScript 中的类型区别**

```typescript
// 1. number（装箱类型）- Number 对象
//    这是 JavaScript 的 Number 构造函数创造的实例类型

let boxedNumber: Number = new Number(42);
let anotherBoxed: Number = Number(42);  // 显式装箱
let alsoBoxed: Number = 42 as Number;    // 类型断言

// 2. number（原始类型）- number 字面量
//    这是 JavaScript 的原始数字类型

let primitive: number = 42;
let anotherPrimitive = 123;

// 3. 两者不可混用
primitive = boxedNumber;  // 错误：不能将 Number 赋值给 number
boxedNumber = primitive;  // 警告：可以将 number 赋值给 Number（但应避免）

// 4. 为什么要区分？
//    原始类型更高效，因为它是值类型而非引用类型

// 5. 实际开发中的影响

// 错误示例：使用装箱类型
function processNumber(value: Number): void {
  // 这个函数接收的是一个对象，不是原始数字
  console.log(value.toFixed(2));  // 可以工作，但不推荐
}

// 正确示例：使用原始类型
function processPrimitive(value: number): void {
  console.log(value.toFixed(2));  // 推荐：更高效
}

// 6. 装箱类型的特殊场景：DOM API

// document.getElementById 返回 HTMLElement | null
const element = document.getElementById("myDiv");

// 如果你错误地使用了 String 而不是 string
function getElementId(el: String): string {  // 错误：应该用 string
  return el.toLowerCase();  // 方法可用，但不推荐
}

// 正确写法
function getElementIdCorrect(el: string): string {
  return el.toLowerCase();
}
```

**常见错误解析**

```typescript
// 错误1：字符串装箱
let boxedString: String = "hello";  // 不推荐
let primitiveString: string = "hello"; // 推荐

// 错误2：布尔值装箱
let boxedBool: Boolean = true;   // 不推荐
let primitiveBool: boolean = true; // 推荐

// 错误3：在函数参数中使用装箱类型
interface Config {
  timeout: Number;  // 应该用 number
}

// 正确写法
interface CorrectConfig {
  timeout: number;
}

// 4. 唯一可以使用装箱类型的场景：泛型约束
function isNumber(value: unknown): value is Number {
  return typeof value === "number" || value instanceof Number;
}
```

### 2.3 类型的本质：类型是集合

理解"类型是集合"这个概念，是掌握 TypeScript 类型系统的关键。

**类型作为集合**

```typescript
// 1. 类型的集合论解释

// number 类型是所有数字的集合
type NumberSet = number;  // { ... -3, -2, -1, 0, 1, 2, 3 ... }

// string 类型是所有字符串的集合
type StringSet = string;   // { "", "a", "ab", "abc", ... }

// 2. 联合类型是集合的并集
type StringOrNumber = string | number;
type IntOrFloat = 1 | 2 | 3 | 3.14;  // { 1, 2, 3, 3.14 }

// 3. 交叉类型是集合的交集
interface A { x: number; y: string; }
interface B { x: number; z: boolean; }

type AandB = A & B;  // { x: number } - 只有 x 是共有的

// 4. never 是空集
type Empty = string & number;  // 空集，没有任何值可以同时是 string 和 number

// 5. unknown 是全集
// unknown 类型可以代表任何值
let value: unknown = 42;        // 合法
value = "hello";                // 合法
value = { key: "value" };       // 合法

// 6. any 是"混乱的集合"
// any 类型绕过类型检查，代表"任意类型"
let chaotic: any = 42;
chaotic = "hello";              // 合法，但危险
chaotic.someMethod();           // 合法，但不安全

// 7. 集合运算示例

// Exclude: 从集合中排除
type Keys = "a" | "b" | "c" | "d";
type Excluded = Exclude<Keys, "a" | "c">;  // "b" | "d"

// Extract: 从集合中提取
type Extracted = Extract<Keys, "a" | "c" | "e">;  // "a" | "c"

// NonNullable: 排除 null 和 undefined
type NotNull = NonNullable<string | null | undefined>;  // string

// 8. 子集关系
// 如果 A 中的每个元素都在 B 中，则 A 是 B 的子集
type AllNumbers = number;
type Integers = number;  // 整数是数字的子集（概念上，实际 TS 不区分）

// 赋值兼容性：子集可以赋值给父集
let parent: number = 42;
let child: number = 42;  // 这里简化了，实际中 number 就是 number
```

**类型兼容性是集合包含关系**

```typescript
// TypeScript 的类型检查可以被理解为集合包含检查

// 赋值兼容性检查
let a: string = "hello";
let b: string | number = a;  // OK，string 是 string | number 的子集

// 函数参数检查：逆变
// 当函数作为参数时，参数类型是逆变的
let fn1: (x: string) => void = (x: string) => {};
let fn2: (x: string | number) => void = fn1;  // OK

// 如果 fn2 被调用，传入 string | number
// 但 fn1 只能处理 string
// 所以 fn2 不能赋值给 fn1（会导致 string | number 无法被 string 处理）
```

### 2.4 Structural Typing vs Nominal Typing

TypeScript 使用结构化类型系统（Structural Typing），这与 Java、C++ 等语言使用的名义化类型系统（Nominal Typing）有本质区别。

**结构化类型系统（Structural Typing）**

```typescript
// 核心原则：如果两个类型具有相同的结构，则它们是兼容的
// 也就是"如果它走起来像鸭子，叫起来像鸭子，那它就是鸭子"

interface Point2D {
  x: number;
  y: number;
}

interface Coordinate {
  x: number;
  y: number;
}

function printPoint(point: Point2D): void {
  console.log(`x: ${point.x}, y: ${point.y}`);
}

const coord: Coordinate = { x: 10, y: 20 };
printPoint(coord);  // OK！即使类型名不同，结构相同即可兼容

// 鸭子类型示例
interface Duck {
  quack(): void;
  swim(): void;
}

class RealDuck {
  quack() { console.log("嘎嘎嘎"); }
  swim() { console.log("鸭子游泳"); }
}

class RubberDuck {
  quack() { console.log("吱吱吱"); }  // 橡皮鸭也叫！
  swim() { console.log("橡皮鸭漂着"); }
}

function makeItQuack(duck: Duck): void {
  duck.quack();
}

const realDuck = new RealDuck();
const rubberDuck = new RubberDuck();

makeItQuack(realDuck);   // OK：橡皮鸭也嘎嘎叫
makeItQuack(rubberDuck); // OK：橡皮鸭也会吱吱叫

// 额外属性检查
const point: Point2D = { x: 1, y: 2, z: 3 };  // 错误：多余属性
const pointWithExtra: Point2D = { x: 1, y: 2 }; // OK
const point2: Point2D = { x: 1, y: 2 } as Point2D; // OK（类型断言绕过检查）
```

**名义化类型系统（Nominal Typing）**

```typescript
// 名义化类型要求类型名称必须匹配，而不仅仅是结构

// Java 示例：
// class User { String name; }
// class Admin { String name; }
// User u = new Admin();  // 编译错误：类型名称不同

// TypeScript 通过"品牌化"模拟名义化类型
type UserId = string & { readonly __brand: "UserId" };
type OrderId = string & { readonly __brand: "OrderId" };

function getUserById(id: UserId): User {
  // ...
}

function getOrderById(id: OrderId): Order {
  // ...
}

const userId = "123" as UserId;
const orderId = "456" as OrderId;

getUserById(userId);    // OK
getUserById(orderId);   // 错误！不能将 OrderId 赋值给 UserId

// 品牌化的实现原理
// 通过交叉类型在 string 上添加一个不可达的属性
// 使得即使底层类型相同，TypeScript 也会将它们视为不同类型
```

**对比总结**

```typescript
// 结构化类型 vs 名义化类型

/*
| 特性           | 结构化类型（TypeScript）     | 名义化类型（Java/C++）     |
|----------------|------------------------------|---------------------------|
| 兼容性判断     | 只需结构相同                 | 必须类型名称相同           |
| 编译性能       | 需要比较所有属性             | 只需比较类型标识           |
| 灵活性         | 高（可自由扩展）             | 低（需要显式继承）         |
| 安全性         | 可能意外匹配                 | 更严格（除非强制类型转换） |
| 典型场景       | 鸭子类型、接口               | 类继承、类型标签           |
*/

// TypeScript 的结构化类型优势
interface Serializable {
  serialize(): string;
}

class User implements Serializable {
  name: string;
  serialize() { return JSON.stringify(this); }
}

class Product implements Serializable {
  sku: string;
  serialize() { return JSON.stringify(this); }
}

function serializeAll(items: Serializable[]): string[] {
  return items.map(item => item.serialize());
}

// User 和 Product 结构相同（都实现了 Serializable）
// 因此可以一起处理
const user = new User();
const product = new Product();
serializeAll([user, product]);  // OK
```

### 2.5 我的思考：TypeScript为什么用结构化类型

**选择结构化类型的原因**

```typescript
// 1. JavaScript 的动态特性决定了结构化类型更自然
// JavaScript 是一门"基于对象"的语言，没有真正的类继承体系
// JS 中对象只是键值对的集合，结构化类型完美匹配这个模型

// 2. 鸭子类型在 JS/TS 中更常见
// 在 JS 中，我们通常关心"这个对象有什么方法"，而不是"它是什么类型"

const user = {
  name: "张三",
  getName() { return this.name; }
};

// 这个对象满足了任何包含 name 属性和 getName 方法的接口

// 3. 结构化类型提供了更好的兼容性
// 允许渐进化类型系统：从 any 逐步迁移到有类型

// 旧代码（JS）
function processUser(user) {
  return user.name;
}

// 新代码（TS）- 只需添加类型，不需要修改实现
interface User {
  name: string;
}

function processUser(user: User) {
  return user.name;  // 实现不需要改变
}

// 4. 结构化类型的权衡

// 优点：灵活、渐进化、符合 JS 习惯
// 缺点：可能过于宽松，导致意外的类型兼容

// 示例：过于宽松的类型检查
interfaceWritable {
  write(content: string): void;
}

class LoggingWriter implements Writable {
  write(content: string) {
    console.log("Writing:", content);
  }
}

class MaliciousWriter implements Writable {
  write(content: string) {
    sendDataToServer(content);  // 恶意行为
  }
}

// 两者类型兼容，但行为完全不同
// 这就是"鸭子类型"的危险：只检查结构，不检查行为
```

---

## 3. 编译原理

### 3.1 AST抽象语法树

AST（Abstract Syntax Tree）是源代码语法结构的一种树形表示，是编译器最核心的数据结构。

**AST 在 TypeScript 编译器中的角色**

```
源码 → Scanner → Token流 → Parser → AST → Binder → 带符号的AST
       ↓                                  ↓
    字符流                          Checker ← 使用
                                                    ↓
                                              类型检查
                                                    ↓
                                              Emitter → JS代码
```

**AST 节点类型层次**

```typescript
// TypeScript AST 节点类型层次（简化版）

// 基础节点接口
interface Node {
  kind: SyntaxKind;           // 节点类型
  pos: number;                // 起始位置
  end: number;               // 结束位置
  flags: NodeFlags;           // 节点标志
  parent?: Node;              // 父节点
}

// 表达式节点
interface Expression extends Node {
  // 表达式节点
}

interface PrimaryExpression extends Expression {
  // 基础表达式
}

interface Identifier extends PrimaryExpression {
  kind: SyntaxKind.Identifier;
  text: string;               // 标识符文本
}

interface NumericLiteral extends PrimaryExpression {
  kind: SyntaxKind.NumericLiteral;
  text: string;               // 数值文本
  numericLiteralFlags: NumericLiteralFlags;
}

interface StringLiteral extends PrimaryExpression {
  kind: SyntaxKind.StringLiteral;
  text: string;                // 字符串文本（不含引号）
  isSingleQuote?: boolean;
}

// 语句节点
interface Statement extends Node {
  // 语句节点
}

interface VariableStatement extends Statement {
  kind: SyntaxKind.VariableStatement;
  declarationList: VariableDeclarationList;
}

interface FunctionDeclaration extends Statement {
  kind: SyntaxKind.FunctionDeclaration;
  name: Identifier;
  parameters: Parameter[];
  body?: Block;
  type?: TypeNode;
  asteriskToken?: Token;
}

// 声明节点
interface Declaration extends Node {
  // 声明节点
}

interface VariableDeclaration extends Declaration {
  kind: SyntaxKind.VariableDeclaration;
  name: Identifier | BindingPattern;
  type?: TypeNode;
  initializer?: Expression;
}

interface ClassDeclaration extends Declaration {
  kind: SyntaxKind.ClassDeclaration;
  name?: Identifier;
  heritage?: HeritageClause[];  // 继承的类或实现的接口
  members: ClassElement[];
}
```

**AST 可视化示例**

```typescript
// 源码
const sum = (a: number, b: number): number => a + b;

// 对应的 AST 结构（JSON 简化表示）
{
  "kind": "VariableStatement",
  "declarationList": {
    "kind": "VariableDeclarationList",
    "declarations": [{
      "kind": "VariableDeclaration",
      "name": {
        "kind": "Identifier",
        "text": "sum"
      },
      "initializer": {
        "kind": "ArrowFunction",
        "parameters": {
          "kind": "ParameterList",
          "parameters": [
            {
              "kind": "Parameter",
              "name": { "kind": "Identifier", "text": "a" },
              "type": { "kind": "KeywordType", "text": "number" }
            },
            {
              "kind": "Parameter",
              "name": { "kind": "Identifier", "text": "b" },
              "type": { "kind": "KeywordType", "text": "number" }
            }
          ]
        },
        "type": { "kind": "KeywordType", "text": "number" },
        "body": {
          "kind": "BinaryExpression",
          "operator": "+",
          "left": {
            "kind": "Identifier",
            "text": "a"
          },
          "right": {
            "kind": "Identifier",
            "text": "b"
          }
        }
      }
    }]
  }
}
```

### 3.2 Visitor模式遍历AST

Visitor 模式是遍历和操作 AST 的标准设计模式。

**Visitor 模式原理**

```typescript
// 经典的 Visitor 模式实现

interface Visitor {
  visitNumber(node: NumberLiteral): void;
  visitString(node: StringLiteral): void;
  visitBinary(node: BinaryExpression): void;
  visitCall(node: CallExpression): void;
  visitFunction(node: FunctionDeclaration): void;
}

// AST 节点接受 Visitor
interface ASTNode {
  accept(visitor: Visitor): void;
}

class NumberLiteral implements ASTNode {
  constructor(public value: number) {}

  accept(visitor: Visitor): void {
    visitor.visitNumber(this);
  }
}

class BinaryExpression implements ASTNode {
  constructor(
    public operator: string,
    public left: ASTNode,
    public right: ASTNode
  ) {}

  accept(visitor: Visitor): void {
    visitor.visitBinary(this);
  }
}

// 具体 Visitor 实现
class PrintVisitor implements Visitor {
  visitNumber(node: NumberLiteral): void {
    console.log(node.value);
  }

  visitString(node: StringLiteral): void {
    console.log(`"${node.value}"`);
  }

  visitBinary(node: BinaryExpression): void {
    console.log("(");
    node.left.accept(this);
    console.log(` ${node.operator} `);
    node.right.accept(this);
    console.log(")");
  }
}

// TypeScript 编译器的 Visitor 实现
// TypeScript 使用 forEachChild 遍历 AST

function visitNode(node: Node, visitor: Visitor) {
  switch (node.kind) {
    case SyntaxKind.NumericLiteral:
      visitor.visitNumericLiteral(node as NumericLiteral);
      break;
    case SyntaxKind.StringLiteral:
      visitor.visitStringLiteral(node as StringLiteral);
      break;
    case SyntaxKind.BinaryExpression:
      visitor.visitBinaryExpression(node as BinaryExpression);
      break;
    // ... 更多节点类型
  }
}

// TypeScript 的 TypeChecker 使用 Visitor 模式
class TypeChecker {
  // 检查节点，递归遍历
  checkNode(node: Node): Type {
    return node.kind.visit({
      [SyntaxKind.NumericLiteral]: () => this.checkNumericLiteral(node),
      [SyntaxKind.StringLiteral]: () => this.checkStringLiteral(node),
      [SyntaxKind.BinaryExpression]: () => this.checkBinaryExpression(node),
      [SyntaxKind.CallExpression]: () => this.checkCallExpression(node),
      // ...
    });
  }
}
```

### 3.3 Transformer：代码转换

Transformer 是将一种 AST 转换为另一种 AST 的工具，是代码转换的核心。

**Transformer 的工作原理**

```typescript
// 简单的 Transformer 示例：将箭头函数转换为普通函数

const ts = require("typescript");

// 创建 Transformer 工厂
function arrowToFunctionTransformer(): ts.TransformerFactory<ts.SourceFile> {
  return (context) => {
    return (node) => {
      // 使用 TypeScript 的 visitNodes 遍历
      return ts.visitEachChild(
        transformNode(node),
        child => transformNode(child),
        context
      );
    };
  };

  function transformNode(node: ts.Node): ts.Node {
    // 检查是否是箭头函数
    if (ts.isArrowFunction(node)) {
      return transformArrowFunction(node);
    }
    return node;
  }

  function transformArrowFunction(node: ts.ArrowFunction): ts.FunctionExpression {
    // 创建普通函数
    return ts.factory.createFunctionExpression(
      node.modifiers,                           // 修饰符
      node.asteriskToken,                       // 是否是生成器
      node.name,                                 // 函数名
      node.typeParameters,                      // 类型参数
      node.parameters,                          // 参数
      node.type,                                 // 返回类型
      node.body                                  // 函数体
    );
  }
}

// 使用 Transformer
const sourceCode = `
  const add = (a: number, b: number): number => a + b;
`;

const result = ts.transpileModule(sourceCode, {
  compilersOptions: {
    target: ts.ScriptTarget.ES2015
  },
  transformers: {
    before: [arrowToFunctionTransformer()]
  }
});

console.log(result.outputText);
// 输出：
// var add = function (a, b) { return a + b; };
```

**实际应用：实现一个简单的代码转换器**

```typescript
// 场景：将 console.log 包装为带时间戳的日志

import * as ts from "typescript";

function instrumentLoggerTransformer(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
  const typeChecker = program.getTypeChecker();

  return (context) => {
    return (sourceFile) => {
      const visitor = (node: ts.Node): ts.Node => {
        // 检查是否是 console.log 调用
        if (ts.isCallExpression(node)) {
          const expression = node.expression;

          // 检查是否是 console.log
          if (ts.isPropertyAccessExpression(expression)) {
            const exprText = expression.expression.getText();
            const propText = expression.name.getText();

            if (exprText === "console" && propText === "log") {
              return createInstrumentedLog(node, sourceFile);
            }
          }
        }

        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitNode(sourceFile, visitor);
    };
  };

  function createInstrumentedLog(node: ts.CallExpression, sourceFile: ts.SourceFile): ts.CallExpression {
    // 获取当前位置信息
    const line = ts.getLineAndCharacterOfPosition(sourceFile, node.getStart()).line;
    const file = sourceFile.fileName;

    // 创建新的日志调用
    return ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier("console"),
        "log"
      ),
      undefined,
      [
        // 时间戳参数
        ts.factory.createStringLiteral(`[${new Date().toISOString()}] `),
        // 位置信息
        ts.factory.createStringLiteral(`${file}:${line + 1} `),
        // 原始参数
        ...node.arguments
      ]
    );
  }
}

// 使用
const program = ts.createProgram(["input.ts"], {
  target: ts.ScriptTarget.ES2015
});

const { diagnostics } = program.emit({
  transformers: {
    before: [instrumentLoggerTransformer(program)]
  }
});
```

### 3.4 实战：手写一个简单的TS编译器

通过实现一个简化版的 TypeScript 编译器，加深对编译原理的理解。

```typescript
// 简化版 TypeScript 编译器实现

// ===== 第一部分：Scanner（扫描器） =====

interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

enum TokenType {
  KEYWORD,      // 关键字
  IDENTIFIER,   // 标识符
  NUMBER,       // 数字
  STRING,       // 字符串
  OPERATOR,     // 运算符
  PUNCTUATION,  // 标点符号
  EOF           // 文件结束
}

class Scanner {
  private source: string;
  private pos: number = 0;
  private line: number = 1;
  private column: number = 0;

  private keywords = new Set([
    "const", "let", "var", "function", "return",
    "if", "else", "for", "while", "class", "interface",
    "type", "enum", "true", "false", "null", "undefined"
  ]);

  constructor(source: string) {
    this.source = source;
  }

  scan(): Token[] {
    const tokens: Token[] = [];

    while (this.pos < this.source.length) {
      const token = this.nextToken();
      if (token.type !== TokenType.EOF) {
        tokens.push(token);
      }
    }

    tokens.push({ type: TokenType.EOF, value: "", line: this.line, column: this.column });
    return tokens;
  }

  private nextToken(): Token {
    this.skipWhitespace();

    if (this.pos >= this.source.length) {
      return { type: TokenType.EOF, value: "", line: this.line, column: this.column };
    }

    const char = this.source[this.pos];

    // 标识符或关键字
    if (this.isAlpha(char)) {
      return this.scanIdentifier();
    }

    // 数字
    if (this.isDigit(char)) {
      return this.scanNumber();
    }

    // 字符串
    if (char === '"' || char === "'") {
      return this.scanString(char);
    }

    // 运算符或标点
    return this.scanOperator();
  }

  private skipWhitespace(): void {
    while (this.pos < this.source.length) {
      const char = this.source[this.pos];
      if (char === " " || char === "\t" || char === "\n" || char === "\r") {
        if (char === "\n") {
          this.line++;
          this.column = 0;
        } else {
          this.column++;
        }
        this.pos++;
      } else if (char === "/" && this.source[this.pos + 1] === "/") {
        // 单行注释
        while (this.pos < this.source.length && this.source[this.pos] !== "\n") {
          this.pos++;
        }
      } else {
        break;
      }
    }
  }

  private scanIdentifier(): Token {
    const start = this.pos;
    while (this.isAlphaNumeric(this.source[this.pos])) {
      this.pos++;
    }

    const value = this.source.substring(start, this.pos);
    const type = this.keywords.has(value) ? TokenType.KEYWORD : TokenType.IDENTIFIER;

    return { type, value, line: this.line, column: this.column - (this.pos - start) };
  }

  private scanNumber(): Token {
    const start = this.pos;
    while (this.isDigit(this.source[this.pos])) {
      this.pos++;
    }

    return {
      type: TokenType.NUMBER,
      value: this.source.substring(start, this.pos),
      line: this.line,
      column: this.column - (this.pos - start)
    };
  }

  private scanString(quote: string): Token {
    const start = this.pos;
    this.pos++; // 跳过开始引号

    while (this.pos < this.source.length && this.source[this.pos] !== quote) {
      if (this.source[this.pos] === "\\") {
        this.pos++; // 跳过转义字符
      }
      this.pos++;
    }

    this.pos++; // 跳过结束引号

    return {
      type: TokenType.STRING,
      value: this.source.substring(start + 1, this.pos - 1),
      line: this.line,
      column: this.column - (this.pos - start)
    };
  }

  private scanOperator(): Token {
    const char = this.source[this.pos];
    this.pos++;
    this.column++;

    // 两字符运算符
    if (this.pos < this.source.length) {
      const twoChar = char + this.source[this.pos];
      if (["==", "!=", "<=", ">=", "=>", "&&", "||", "===", "!=="].includes(twoChar)) {
        this.pos++;
        this.column++;
        return { type: TokenType.OPERATOR, value: twoChar, line: this.line, column: this.column - 2 };
      }
    }

    return { type: TokenType.OPERATOR, value: char, line: this.line, column: this.column - 1 };
  }

  private isAlpha(char: string): boolean {
    return /[a-zA-Z_]/.test(char);
  }

  private isDigit(char: string): boolean {
    return /[0-9]/.test(char);
  }

  private isAlphaNumeric(char: string): boolean {
    return /[a-zA-Z0-9_]/.test(char);
  }
}

// ===== 第二部分：Parser（解析器） =====

// AST 节点接口
interface ASTNode {
  type: string;
}

interface NumberLiteral extends ASTNode {
  type: "NumberLiteral";
  value: number;
}

interface StringLiteral extends ASTNode {
  type: "StringLiteral";
  value: string;
}

interface Identifier extends ASTNode {
  type: "Identifier";
  name: string;
}

interface BinaryExpression extends ASTNode {
  type: "BinaryExpression";
  operator: string;
  left: ASTNode;
  right: ASTNode;
}

interface CallExpression extends ASTNode {
  type: "CallExpression";
  callee: ASTNode;
  arguments: ASTNode[];
}

interface VariableDeclaration extends ASTNode {
  type: "VariableDeclaration";
  name: string;
  value: ASTNode;
}

interface FunctionDeclaration extends ASTNode {
  type: "FunctionDeclaration";
  name: string;
  params: string[];
  body: ASTNode;
}

interface ReturnStatement extends ASTNode {
  type: "ReturnStatement";
  value: ASTNode;
}

class Parser {
  private tokens: Token[];
  private pos: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): ASTNode[] {
    const statements: ASTNode[] = [];

    while (!this.isAtEnd()) {
      statements.push(this.parseStatement());
    }

    return statements;
  }

  private parseStatement(): ASTNode {
    const token = this.current();

    if (token.type === TokenType.KEYWORD) {
      switch (token.value) {
        case "const":
        case "let":
        case "var":
          return this.parseVariableDeclaration();
        case "function":
          return this.parseFunctionDeclaration();
        case "return":
          return this.parseReturnStatement();
      }
    }

    return this.parseExpression();
  }

  private parseVariableDeclaration(): VariableDeclaration {
    this.advance(); // 跳过 var/let/const
    const name = this.expect(TokenType.IDENTIFIER).value;
    this.expectValue("=");
    const value = this.parseExpression();

    return { type: "VariableDeclaration", name, value };
  }

  private parseFunctionDeclaration(): FunctionDeclaration {
    this.advance(); // 跳过 function
    const name = this.expect(TokenType.IDENTIFIER).value;
    this.expectValue("(");

    const params: string[] = [];
    while (this.current().value !== ")") {
      params.push(this.expect(TokenType.IDENTIFIER).value);
      if (this.current().value === ",") this.advance();
    }

    this.expectValue(")");
    this.expectValue("{");

    const body = this.parseBlock();

    return { type: "FunctionDeclaration", name, params, body };
  }

  private parseReturnStatement(): ReturnStatement {
    this.advance(); // 跳过 return
    const value = this.parseExpression();
    return { type: "ReturnStatement", value };
  }

  private parseBlock(): ASTNode {
    const statements: ASTNode[] = [];

    while (this.current().value !== "}") {
      statements.push(this.parseStatement());
    }

    this.expectValue("}");
    return { type: "Block", statements };
  }

  private parseExpression(): ASTNode {
    return this.parseAdditive();
  }

  private parseAdditive(): ASTNode {
    let left = this.parseMultiplicative();

    while (this.current().value === "+" || this.current().value === "-") {
      const operator = this.advance().value;
      const right = this.parseMultiplicative();
      left = { type: "BinaryExpression", operator, left, right };
    }

    return left;
  }

  private parseMultiplicative(): ASTNode {
    let left = this.parsePrimary();

    while (this.current().value === "*" || this.current().value === "/") {
      const operator = this.advance().value;
      const right = this.parsePrimary();
      left = { type: "BinaryExpression", operator, left, right };
    }

    return left;
  }

  private parsePrimary(): ASTNode {
    const token = this.current();

    if (token.type === TokenType.NUMBER) {
      this.advance();
      return { type: "NumberLiteral", value: parseFloat(token.value) };
    }

    if (token.type === TokenType.STRING) {
      this.advance();
      return { type: "StringLiteral", value: token.value };
    }

    if (token.type === TokenType.IDENTIFIER) {
      this.advance();

      // 检查是否是函数调用
      if (this.current().value === "(") {
        this.expectValue("(");
        const args: ASTNode[] = [];

        while (this.current().value !== ")") {
          args.push(this.parseExpression());
          if (this.current().value === ",") this.advance();
        }

        this.expectValue(")");
        return { type: "CallExpression", callee: { type: "Identifier", name: token.value }, arguments: args };
      }

      return { type: "Identifier", name: token.value };
    }

    if (token.value === "(") {
      this.advance();
      const expr = this.parseExpression();
      this.expectValue(")");
      return expr;
    }

    throw new Error(`Unexpected token: ${token.value}`);
  }

  private current(): Token {
    return this.tokens[this.pos];
  }

  private advance(): Token {
    return this.tokens[this.pos++];
  }

  private expect(type: TokenType): Token {
    if (this.current().type !== type) {
      throw new Error(`Expected ${type}, got ${this.current().type}`);
    }
    return this.advance();
  }

  private expectValue(value: string): Token {
    if (this.current().value !== value) {
      throw new Error(`Expected '${value}', got '${this.current().value}'`);
    }
    return this.advance();
  }

  private isAtEnd(): boolean {
    return this.current().type === TokenType.EOF;
  }
}

// ===== 第三部分：Emitter（发射器） =====

class Emitter {
  emit(node: ASTNode[]): string {
    return node.map(node => this.emitNode(node)).join("\n");
  }

  private emitNode(node: ASTNode): string {
    switch (node.type) {
      case "NumberLiteral":
        return String((node as NumberLiteral).value);
      case "StringLiteral":
        return `"${(node as StringLiteral).value}"`;
      case "Identifier":
        return (node as Identifier).name;
      case "BinaryExpression":
        return this.emitBinary(node as BinaryExpression);
      case "CallExpression":
        return this.emitCall(node as CallExpression);
      case "VariableDeclaration":
        return this.emitVariable(node as VariableDeclaration);
      case "FunctionDeclaration":
        return this.emitFunction(node as FunctionDeclaration);
      case "ReturnStatement":
        return `return ${this.emitNode((node as ReturnStatement).value)};`;
      case "Block":
        return this.emitBlock(node as any);
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  private emitBinary(node: BinaryExpression): string {
    const left = this.emitNode(node.left);
    const right = this.emitNode(node.right);
    return `(${left} ${node.operator} ${right})`;
  }

  private emitCall(node: CallExpression): string {
    const args = node.arguments.map(arg => this.emitNode(arg)).join(", ");
    return `${this.emitNode(node.callee)}(${args})`;
  }

  private emitVariable(node: VariableDeclaration): string {
    return `var ${node.name} = ${this.emitNode(node.value)};`;
  }

  private emitFunction(node: FunctionDeclaration): string {
    const params = node.params.join(", ");
    return `function ${node.name}(${params}) {\n  return ${this.emitNode(node.body)};\n}`;
  }

  private emitBlock(node: { statements: ASTNode[] }): string {
    return node.statements.map(s => "  " + this.emitNode(s)).join("\n");
  }
}

// ===== 第四部分：Compiler（编译器） =====

class Compiler {
  compile(source: string): string {
    // 1. 扫描
    const scanner = new Scanner(source);
    const tokens = scanner.scan();

    // 2. 解析
    const parser = new Parser(tokens);
    const ast = parser.parse();

    // 3. 发射
    const emitter = new Emitter();
    return emitter.emit(ast);
  }
}

// ===== 使用示例 =====
const compiler = new Compiler();

const source = `
  const result = add(1, 2);

  function add(a, b) {
    return a + b;
  }
`;

console.log("源代码：");
console.log(source);
console.log("\n编译结果：");
console.log(compiler.compile(source));
```

---

## 4. 类型检查原理

### 4.1 Symbol：类型的标识

Symbol 是 TypeScript 类型系统中最重要的概念之一，它为每个类型和值提供了唯一标识。

**TypeScript Symbol 的实现机制**

```typescript
// Symbol 是 TypeScript 内部用来标识类型和值的核心机制

// 1. 声明符号 - 每个声明都会创建一个 Symbol
interface User {
  name: string;
  age: number;
}

// 内部实现（概念性）
const userInterfaceSymbol = {
  id: 1,
  name: "User",
  flags: SymbolFlags.Interface,
  declarations: [userInterfaceDeclaration],
  members: {
    name: { id: 2, name: "name", type: stringType },
    age: { id: 3, name: "age", type: numberType }
  }
};

// 2. 引用符号 - 同一 Symbol 的引用是相同的
const a: User = { name: "张三", age: 25 };
const b: User = { name: "李四", age: 30 };

// 在 TypeScript 内部，a 和 b 的类型都链接到同一个 User Symbol

// 3. Symbol 与类型检查
// 当检查 a.name = "王五" 时：
// - 获取 a 的类型（User）
// - 获取 User 的 name 属性（Symbol）
// - 检查赋值类型（string）是否与 name 的类型兼容

// 4. Symbol 表结构
interface SymbolTable {
  // 符号映射
  symbols: Map<string, Symbol>;

  // 作用域
  scopes: Scope[];
}

interface Symbol {
  id: number;
  name: string;
  flags: SymbolFlags;
  declarations: Declaration[];
  valueDeclaration?: Declaration;
  type?: Type;
}

const enum SymbolFlags {
  Variable = 1 << 0,           // 变量
  Function = 1 << 1,            // 函数
  Class = 1 << 2,               // 类
  Enum = 1 << 3,                // 枚举
  Interface = 1 << 4,           // 接口
  TypeLiteral = 1 << 5,         // 类型字面量
  ObjectLiteral = 1 << 6,       // 对象字面量
  Method = 1 << 7,              // 方法
  GetAccessor = 1 << 8,         // Get 访问器
  SetAccessor = 1 << 9,         // Set 访问器
  TypeParameter = 1 << 10,       // 类型参数
}
```

### 4.2 Declaration Space：声明空间

TypeScript 中存在两个独立的声明空间：变量声明空间和类型声明空间。

**双声明空间机制**

```typescript
// 1. 变量声明空间（Value Declaration Space）
// 这个空间中的声明可以作为值使用

class MyClass {
  // MyClass 可以在变量声明空间中使用
}

const instance = new MyClass();  // OK：MyClass 作为值使用

// 2. 类型声明空间（Type Declaration Space）
// 这个空间中的声明只能作为类型使用

interface Point {
  x: number;
  y: number;
}

type StringOrNumber = string | number;

// 3. 同时存在于两个空间的声明

// 类同时存在于两个空间
class Animal {
  name: string;
}

// 作为类型使用
const animal: Animal = new Animal();

// 作为值使用（构造函数）
const createAnimal = Animal;

// 4. 枚举同时存在于两个空间
enum Status {
  Active,
  Inactive
}

// 作为类型使用
const currentStatus: Status = Status.Active;

// 作为值使用
const statusValue = Status.Active;

// 5. 类型别名只存在于类型空间
type User = { name: string };

// 不能作为值使用
// const u = User;  // 错误：User 不是值

// 6. 接口只存在于类型空间
interface Config {
  debug: boolean;
}

// 不能作为值使用
// const c = Config;  // 错误

// 7. 声明合并导致双空间存在
interface A {
  x: number;
}

interface A {
  y: number;
}

// 合并后 A 同时存在于两个空间？
// 实际上，合并只发生在类型空间
// 但我们可以同时声明值和类型

// 声明合并示例
interface Animal {
  name: string;
}

const Animal = "Animal";  // 这个 Animal 在值空间，与接口无关

// 8. 使用命名空间组织声明
namespace Shapes {
  export interface Point {
    x: number;
    y: number;
  }

  export function distance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }
}

// 类型空间使用
const p: Shapes.Point = { x: 0, y: 0 };

// 值空间使用
const d = Shapes.distance({ x: 0, y: 0 }, { x: 3, y: 4 });
```

### 4.3 Scope：作用域与类型检查

作用域决定了类型检查中名称解析的范围。

**作用域链与类型解析**

```typescript
// 1. 全局作用域
interface GlobalConfig {
  apiUrl: string;
}

// 全局声明在整个文件中可见

// 2. 模块作用域
module MyModule {
  interface ModuleConfig {
    timeout: number;
  }

  // ModuleConfig 只在 MyModule 内可见
}

// 3. 块级作用域
{
  interface BlockScoped {
    value: number;
  }

  const blockVar: BlockScoped = { value: 1 };
}

// console.log(blockVar);  // 错误：BlockScoped 不可见

// 4. 函数作用域
function processData() {
  interface ProcessedData {
    result: string;
  }

  const data: ProcessedData = { result: "ok" };
  return data;
}

// 5. 类型检查中的作用域

// 当解析标识符时：
// 1. 首先在当前作用域查找
// 2. 然后在外层作用域查找
// 3. 最后在全局作用域查找
// 4. 如果都没找到，报错

// 示例：作用域链解析
interface OuterInterface {
  outer: string;
}

function outer() {
  interface MiddleInterface {
    middle: string;
  }

  function inner() {
    interface InnerInterface {
      inner: string;
    }

    // 这里可以访问所有三个接口
    const obj: InnerInterface = { inner: "yes" };
    const obj2: MiddleInterface = { middle: "yes" };
    const obj3: OuterInterface = { outer: "yes" };
  }
}

// 6. 作用域与符号解析
// TypeScript 内部维护一个作用域链

interface Scope {
  kind: ScopeKind;
  symbols: Map<string, Symbol>;
  parent?: Scope;
  children?: Scope[];
}

// 作用域种类
const enum ScopeKind {
  Global,      // 全局作用域
  Module,      // 模块作用域
  Function,    // 函数作用域
  Block,       // 块级作用域
  Class,       // 类作用域
  Interface,   // 接口作用域
  TypeAlias,   // 类型别名作用域
}

// 7. 作用域隔离示例

// a.ts
interface A {
  value: string;
}

// b.ts
interface A {  // 这个 A 与 a.ts 的 A 是不同的
  value: number;
}

// 两个文件中的 A 互不影响，因为模块作用域隔离

// 8. 跨越作用域的类型查找
function createCounter() {
  let count = 0;

  return {
    increment: () => count++,
    getCount: () => count
  };
}

// 闭包中的类型检查
// count 的类型是 number
// increment 的返回类型是 number
```

### 4.4 类型推断：infer、推断、上下文

类型推断是 TypeScript 减少类型注解负担的核心机制。

**TypeScript 的类型推断策略**

```typescript
// 1. 从右向左推断（RTL - Right to Left）
// 当有明确类型注解时，从类型推断值

const name: string = "张三";  // 显式类型
const age = 25;               // 推断为 number

// 2. 从左向右推断（LTR - Left to Right）
// 函数参数的类型从调用上下文推断

const numbers = [1, 2, 3, 4, 5];

// 上下文推断：forEach 的 callback 参数类型从 numbers 推断
numbers.forEach((num) => {
  // num 被推断为 number
  console.log(num.toFixed(2));
});

// 3. 最佳公共类型推断（Best Common Type）
const values = [1, 2, 3.14, 4];  // 推断为 (number | 3.14)[] = number[]
const mixed = [1, "hello", true];  // 推断为 (string | number | boolean)[]

// 4. 推断与 literal 类型
const status = "active";        // 推断为 "active"（字面量类型）
const statuses = ["active", "pending"];  // 推断为 string[]（因为可能被修改）

// 使用 as const 保持字面量类型
const constStatuses = ["active", "pending"] as const;
// 推断为 readonly ["active", "pending"]

// 5. 推断与函数返回值
function createUser(name: string, age: number) {
  return { name, age, createdAt: new Date() };
}

// 返回类型被推断为 { name: string; age: number; createdAt: Date }

// 6. infer 关键字 - 在条件类型中推断类型

// 推断数组元素类型
type ElementType<T> = T extends (infer U)[] ? U : never;

type A = ElementType<string[]>;  // string
type B = ElementType<number[]>;  // number
type C = ElementType<boolean>;   // never（不是数组）

// 推断函数参数类型
type Parameters<T extends (...args: any) => any> =
  T extends (...args: infer P) => any ? P : never;

type MyParams = Parameters<(name: string, age: number) => void>;
// 推断为 [name: string, age: number]

// 推断函数返回类型
type ReturnType<T extends (...args: any) => any> =
  T extends (...args: any) => infer R ? R : any;

type MyReturn = ReturnType<() => User>;  // User

// 7. 递归推断
// 提取嵌套数组的深度和元素类型

type DeepArrayElement<T> = T extends (infer U)[]
  ? DeepArrayElement<U>
  : T;

type A1 = DeepArrayElement<string[]>;        // string
type A2 = DeepArrayElement<string[][]>;       // string
type A3 = DeepArrayElement<string[][][]>;     // string

// 8. 条件类型中的推断
// 默认情况下，条件类型会分发到联合类型
// 但使用 [...] 包装可以抑制分发

type Foo<T> = T extends string ? "string" : "other";

type T1 = Foo<string | number>;  // "string" | "other"（分发）

type Bar<T> = [T] extends [string] ? "string" : "other";

type T2 = Bar<string | number>;  // "other"（不分发）
```

**类型推断的局限性**

```typescript
// 1. 对象字面量的推断
const obj = {
  handler: function() {
    return this;  // this 被推断为 any
  }
};

// 2. 回调函数的推断
// 某些复杂场景下，TypeScript 无法准确推断

function createLogger(prefix: string) {
  return function log(message: string) {
    console.log(`${prefix}: ${message}`);
  };
}

const logger = createLogger("INFO");
// logger 的类型被推断为 (message: string) => void

// 3. 泛型与推断
// 某些泛型模式无法被推断

function pipe<A, B, C>(
  fn1: (input: A) => B,
  fn2: (input: B) => C
): (input: A) => C {
  return (input) => fn2(fn1(input));
}

// TypeScript 可能无法正确推断中间类型 B

// 4. 循环引用
// TypeScript 不支持递归类型推断

// type Infinite<T> = { value: T, next: Infinite<T> };
// const loop: Infinite<number> = { value: 1, next: loop };  // 错误

// 5. 多态函数的推断
// 重载函数的推断可能不符合预期

function overload(arg: string): string;
function overload(arg: number): number;
function overload(arg: any): any {
  return arg;
}

const result = overload("hello");
// result 被推断为 string | number，而非更精确的 string
```

### 4.5 实战：实现一个类型检查器

通过实现一个简化版的类型检查器，深入理解类型检查原理。

```typescript
// 简化版类型检查器实现

// ===== 类型系统基础 =====

type Type =
  | { kind: "number" }
  | { kind: "string" }
  | { kind: "boolean" }
  | { kind: "null" }
  | { kind: "undefined" }
  | { kind: "array"; elementType: Type }
  | { kind: "object"; properties: Map<string, Type> }
  | { kind: "function"; paramTypes: Type[]; returnType: Type }
  | { kind: "union"; types: Type[] }
  | { kind: "intersection"; types: Type[] }
  | { kind: "reference"; name: string }  // 类型引用
  | { kind: "error" };                  // 错误类型

// ===== 符号表 =====

interface Symbol {
  name: string;
  type: Type;
  kind: "variable" | "function" | "type";
}

interface TypeEnvironment {
  symbols: Map<string, Symbol>;
  parent?: TypeEnvironment;
}

function createEnvironment(parent?: TypeEnvironment): TypeEnvironment {
  return {
    symbols: new Map(),
    parent
  };
}

function lookup(env: TypeEnvironment, name: string): Symbol | undefined {
  return env.symbols.get(name) ?? env.parent && lookup(env.parent, name);
}

function declare(env: TypeEnvironment, symbol: Symbol): void {
  if (env.symbols.has(symbol.name)) {
    throw new Error(`Symbol ${symbol.name} already declared`);
  }
  env.symbols.set(symbol.name, symbol);
}

// ===== 类型比较 =====

function isAssignableTo(source: Type, target: Type): boolean {
  // any 可以赋值给任何类型
  if (source.kind === "error") return true;

  // 相同类型
  if (source.kind === target.kind) {
    switch (source.kind) {
      case "number":
      case "string":
      case "boolean":
      case "null":
      case "undefined":
        return true;
      case "array":
        return target.kind === "array" &&
               isAssignableTo(source.elementType, target.elementType);
      case "object":
        if (target.kind === "object") {
          for (const [key, targetType] of target.properties) {
            const sourceType = source.properties.get(key);
            if (!sourceType || !isAssignableTo(sourceType, targetType)) {
              return false;
            }
          }
          return true;
        }
        return false;
      case "function":
        if (target.kind !== "function") return false;
        // 参数逆变，返回值协变
        if (source.paramTypes.length !== target.paramTypes.length) return false;
        for (let i = 0; i < source.paramTypes.length; i++) {
          if (!isAssignableTo(target.paramTypes[i], source.paramTypes[i])) {
            return false;
          }
        }
        return isAssignableTo(source.returnType, target.returnType);
      case "union":
        // 联合类型赋值：每个成员都可以赋值给目标
        return source.types.every(t => isAssignableTo(t, target));
      case "reference":
        return target.kind === "reference" && source.name === target.name;
      default:
        return false;
    }
  }

  // number 与 string | number（联合类型）
  if (target.kind === "union") {
    return target.types.some(t => isAssignableTo(source, t));
  }

  return false;
}

// ===== 类型检查器主类 =====

class TypeChecker {
  private env: TypeEnvironment;
  private errors: string[] = [];

  constructor() {
    this.env = createEnvironment();
    this.initBuiltInTypes();
  }

  private initBuiltInTypes(): void {
    // 注册内置类型
    this.env.symbols.set("number", { name: "number", type: { kind: "number" }, kind: "type" });
    this.env.symbols.set("string", { name: "string", type: { kind: "string" }, kind: "type" });
    this.env.symbols.set("boolean", { name: "boolean", type: { kind: "boolean" }, kind: "type" });
  }

  // 检查变量声明
  checkVariableDeclaration(name: string, typeExpr: TypeExpr, initExpr: Expr): Type {
    const declaredType = this.checkTypeExpression(typeExpr);
    const initType = this.checkExpression(initExpr);

    if (!isAssignableTo(initType, declaredType)) {
      this.errors.push(
        `Type '${typeToString(initType)}' is not assignable to type '${typeToString(declaredType)}'`
      );
      return { kind: "error" };
    }

    const symbol: Symbol = { name, type: declaredType, kind: "variable" };
    declare(this.env, symbol);

    return declaredType;
  }

  // 检查函数声明
  checkFunctionDeclaration(
    name: string,
    paramNames: string[],
    paramTypes: TypeExpr[],
    returnTypeExpr: TypeExpr,
    body: Expr
  ): Type {
    // 创建函数作用域
    const funcEnv = createEnvironment(this.env);

    // 注册参数
    const paramTypes: Type[] = [];
    for (let i = 0; i < paramNames.length; i++) {
      const paramType = this.checkTypeExpression(paramTypes[i]);
      paramTypes.push(paramType);
      declare(funcEnv, { name: paramNames[i], type: paramType, kind: "variable" });
    }

    const returnType = this.checkTypeExpression(returnTypeExpr);

    // 检查函数体
    const bodyType = this.checkExpressionInScope(funcEnv, body);

    // 返回类型检查
    if (!isAssignableTo(bodyType, returnType)) {
      this.errors.push(
        `Return type '${typeToString(bodyType)}' is not assignable to declared return type '${typeToString(returnType)}'`
      );
    }

    const funcType: Type = {
      kind: "function",
      paramTypes,
      returnType
    };

    declare(this.env, { name, type: funcType, kind: "function" });

    return funcType;
  }

  // 检查表达式
  checkExpression(expr: Expr): Type {
    return this.checkExpressionInScope(this.env, expr);
  }

  private checkExpressionInScope(env: TypeEnvironment, expr: Expr): Type {
    switch (expr.kind) {
      case "number":
        return { kind: "number" };

      case "string":
        return { kind: "string" };

      case "boolean":
        return { kind: "boolean" };

      case "identifier": {
        const symbol = lookup(env, expr.name);
        if (!symbol) {
          this.errors.push(`Cannot find name '${expr.name}'`);
          return { kind: "error" };
        }
        return symbol.type;
      }

      case "binary": {
        const leftType = this.checkExpressionInScope(env, expr.left);
        const rightType = this.checkExpressionInScope(env, expr.right);

        switch (expr.operator) {
          case "+":
          case "-":
          case "*":
          case "/":
            // 算术运算符需要两边都是 number
            if (leftType.kind !== "number" || rightType.kind !== "number") {
              this.errors.push(`Operator '${expr.operator}' requires number operands`);
              return { kind: "error" };
            }
            return { kind: "number" };

          case "==":
          case "!=":
          case "===":
          case "!==":
            // 比较运算符返回 boolean
            if (!isAssignableTo(leftType, rightType) &&
                !isAssignableTo(rightType, leftType)) {
              this.errors.push(`Comparison between incompatible types`);
            }
            return { kind: "boolean" };

          case "=":
            // 赋值运算符
            if (!isAssignableTo(rightType, leftType)) {
              this.errors.push(
                `Cannot assign type '${typeToString(rightType)}' to '${typeToString(leftType)}'`
              );
              return { kind: "error" };
            }
            return leftType;
        }
      }

      case "call": {
        const calleeType = this.checkExpressionInScope(env, expr.callee);

        if (calleeType.kind !== "function") {
          this.errors.push(`'${expr.callee}' is not a function`);
          return { kind: "error" };
        }

        // 检查参数类型
        if (expr.arguments.length !== calleeType.paramTypes.length) {
          this.errors.push(
            `Expected ${calleeType.paramTypes.length} arguments, but got ${expr.arguments.length}`
          );
        }

        for (let i = 0; i < expr.arguments.length; i++) {
          const argType = this.checkExpressionInScope(env, expr.arguments[i]);
          if (i < calleeType.paramTypes.length) {
            if (!isAssignableTo(argType, calleeType.paramTypes[i])) {
              this.errors.push(
                `Argument ${i} type '${typeToString(argType)}' is not assignable to parameter type '${typeToString(calleeType.paramTypes[i])}'`
              );
            }
          }
        }

        return calleeType.returnType;
      }

      case "object": {
        const properties = new Map<string, Type>();
        for (const [key, value] of Object.entries(expr.properties)) {
          properties.set(key, this.checkExpressionInScope(env, value));
        }
        return { kind: "object", properties };
      }

      case "propertyAccess": {
        const objType = this.checkExpressionInScope(env, expr.object);

        if (objType.kind === "object" && objType.properties.has(expr.property)) {
          return objType.properties.get(expr.property)!;
        }

        this.errors.push(`Property '${expr.property}' does not exist on type`);
        return { kind: "error" };
      }
    }
  }

  // 检查类型表达式
  checkTypeExpression(typeExpr: TypeExpr): Type {
    switch (typeExpr.kind) {
      case "primitive":
        return { kind: typeExpr.name };

      case "array":
        return {
          kind: "array",
          elementType: this.checkTypeExpression(typeExpr.elementType)
        };

      case "object":
        const properties = new Map<string, Type>();
        for (const [key, value] of Object.entries(typeExpr.properties)) {
          properties.set(key, this.checkTypeExpression(value));
        }
        return { kind: "object", properties };

      case "reference":
        const symbol = lookup(this.env, typeExpr.name);
        if (!symbol) {
          this.errors.push(`Type '${typeExpr.name}' not found`);
          return { kind: "error" };
        }
        return symbol.type;
    }
  }

  getErrors(): string[] {
    return this.errors;
  }
}

// ===== 辅助函数 =====

function typeToString(type: Type): string {
  switch (type.kind) {
    case "number": return "number";
    case "string": return "string";
    case "boolean": return "boolean";
    case "null": return "null";
    case "undefined": return "undefined";
    case "array": return `${typeToString(type.elementType)}[]`;
    case "object":
      const props = Array.from(type.properties.entries())
        .map(([k, v]) => `${k}: ${typeToString(v)}`)
        .join("; ");
      return `{ ${props} }`;
    case "function":
      const params = type.paramTypes.map(typeToString).join(", ");
      return `(${params}) => ${typeToString(type.returnType)}`;
    case "union": return type.types.map(typeToString).join(" | ");
    case "intersection": return type.types.map(typeToString).join(" & ");
    case "reference": return type.name;
    case "error": return "error";
  }
}

// ===== 使用示例 =====

const checker = new TypeChecker();

// 检查函数声明
checker.checkFunctionDeclaration(
  "add",
  ["a", "b"],
  [{ kind: "primitive", name: "number" }, { kind: "primitive", name: "number" }],
  { kind: "primitive", name: "number" },
  {
    kind: "binary",
    operator: "+",
    left: { kind: "identifier", name: "a" },
    right: { kind: "identifier", name: "b" }
  }
);

// 检查变量声明
checker.checkVariableDeclaration(
  "result",
  { kind: "primitive", name: "number" },
  {
    kind: "call",
    callee: { kind: "identifier", name: "add" },
    arguments: [
      { kind: "number", value: 1 },
      { kind: "number", value: 2 }
    ]
  }
);

console.log("Type errors:", checker.getErrors());
```

---

## 5. 泛型底层

### 5.1 泛型的本质：类型参数化

泛型是 TypeScript 实现代码复用的核心机制，它的本质是对类型进行参数化。

**泛型的数学本质**

```typescript
// 泛型可以理解为"类型的函数"
// 普通函数：值 → 值
function identity<T>(x: T): T { return x; }

// 泛型类型：类型 → 类型
type Identity<T> = T;

// 如果我们把类型理解为"值的集合"：
// - number 是所有数字的集合
// - string 是所有字符串的集合
// - Identity<T> 是 { x ∈ T | x ∈ T } = T
// - 也就是说，恒等类型保持集合不变

// 更复杂的例子：Pair<T, U>
type Pair<T, U> = { first: T; second: U };

// Pair<number, string> 是 { first: number; second: string }
// 也就是 number × string 的笛卡尔积

// 泛型约束：子集约束
type Constrained<T extends string> = T;
// T 必须是 string 的子集

// Constrained<number> 是无效的
// Constrained<"hello"> 是有效的

// 泛型函数：类型级别的函数
type Append<T extends any[], U> = [...T, U];

// Append<[1, 2], 3> = [1, 2, 3]
// Append<[], string> = [string]
// 泛型函数可以理解为：给定输入类型元组 T 和类型 U，输出新的元组类型
```

**泛型在编译器的处理**

```typescript
// TypeScript 编译器如何处理泛型

// 1. 泛型声明时不生成代码
interface Container<T> {
  value: T;
  getValue(): T;
}

// 编译后（类型擦除）：
// interface Container {
//   value: any;
//   getValue(): any;
// }

// 2. 泛型实例化（Instantiation）
const container: Container<string> = { value: "hello", getValue: () => "hello" };

// 编译器创建具体版本的 Container
type ContainerOfString = {
  value: string;
  getValue(): string;
};

// 3. 泛型函数的处理
function identity<T>(x: T): T {
  return x;
}

const num = identity(42);  // T 被推断为 number
const str = identity("hello");  // T 被推断为 string

// 编译后（简化）：
// function identity(x: any): any {
//   return x;
// }
// var num = identity(42);
// var str = identity("hello");

// 4. 多态函数与单态化
// TypeScript 在可能的情况下会"单态化"泛型函数
// 即为每个不同的类型参数创建专用版本

function swap<T, U>(tuple: [T, U]): [U, T] {
  return [tuple[1], tuple[0]];
}

const swapped1 = swap([1, "hello"]);  // [string, number]
const swapped2 = swap([true, 42]);    // [number, boolean]

// 编译器可能生成：
// function swap_T_U__string_number(tuple) { ... }
// function swap_T_U__boolean_number(tuple) { ... }

// 但对于 any 类型，编译器会使用单态版本
const result = identity(42);  // 使用 any 版本
```

### 5.2 泛型约束：extends

`extends` 关键字在泛型中有多种用法，理解其本质是掌握泛型的关键。

**泛型约束的本质**

```typescript
// 1. 类型参数约束
// T extends U 表示"T 必须是 U 的子集"

function getLength<T extends { length: number }>(arg: T): number {
  return arg.length;
}

getLength("hello");     // string 有 length 属性
getLength([1, 2, 3]);  // 数组有 length 属性
getLength({ length: 5 }); // 有 length 属性的对象
// getLength(123);       // 错误：number 没有 length 属性

// 2. 约束的含义
// T extends U 可以理解为"T 中的每个元素都在 U 中"
// 或者"T 是 U 的子类型"

// 3. 多重约束
// T extends U & V 表示"T 同时是 U 和 V 的子类型"

interface Nameable {
  name: string;
}

interface Ageable {
  age: number;
}

type PersonLike = Nameable & Ageable;

function process<T extends Nameable & Ageable>(obj: T): string {
  return `${obj.name} is ${obj.age} years old`;
}

// 4. extends 条件类型
// T extends U ? X : Y 表示"如果 T 是 U 的子类型，则结果为 X，否则为 Y"

type IsString<T> = T extends string ? true : false;

type A = IsString<string>;  // true
type B = IsString<number>;   // false
type C = IsString<"hello">;  // true（字面量是 string 的子类型）

// 5. 泛型约束的逆变
// 当泛型用作函数参数时，类型检查是逆变的

function processValue<T extends string>(fn: (arg: T) => void): void {
  // ...
}

function stringFn(arg: string): void { }
function anyFn(arg: any): void { }

processValue(stringFn);  // OK
processValue(anyFn);     // OK

// 但如果反过来：
function callFn<T>(fn: (arg: T) => void, value: T): void {
  fn(value);
}

callFn(stringFn, "hello");  // OK
// callFn(stringFn, 123);   // 错误：number 不是 string 的子类型
```

**泛型约束的高级用法**

```typescript
// 1. 泛型默认值
type Container<T = unknown> = { value: T };

const c1: Container = { value: 42 };  // T 默认为 unknown
const c2: Container<string> = { value: "hello" };

// 2. 泛型约束中的类型推断
function pick<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: "张三", age: 25 };
const name = pick(user, "name");  // string
const age = pick(user, "age");    // number

// 3. 泛型类约束
class Stack<T extends number | string> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }
}

const numStack = new Stack<number>();
numStack.push(1);
// numStack.push("hello");  // 错误

// 4. 泛型接口约束
interface Identifiable {
  id: string;
}

function findById<T extends Identifiable>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id);
}

interface User extends Identifiable {
  name: string;
}

const users: User[] = [{ id: "1", name: "张三" }];
const user = findById(users, "1");

// 5. 泛型与继承
// 子类的泛型参数可以比父类更多
interface State<S, A> {
  state: S;
  action: A;
}

interface ExtendedState<S, A, M> extends State<S, A> {
  meta: M;
}

// 6. 交叉类型约束
type A = { a: string };
type B = { b: number };

function merge<T extends A & B>(obj: T): [A, B] {
  return [{ a: obj.a }, { b: obj.b }];
}

const merged = merge({ a: "hello", b: 42 });  // OK
// merge({ a: "hello" });  // 错误：缺少 b 属性
```

### 5.3 泛型推导：Inference

泛型推导允许 TypeScript 自动推断类型参数，减少显式类型注解的需要。

**泛型推导的规则**

```typescript
// 1. 基本推导
function identity<T>(value: T): T {
  return value;
}

const num = identity(42);      // T 推断为 number
const str = identity("hello");  // T 推断为 string

// 2. 多类型参数推导
function pair<T, U>(first: T, second: U): [T, U] {
  return [first, second];
}

const p1 = pair(1, "hello");    // [number, string]
const p2 = pair("a", true);    // [string, boolean]

// 3. 从函数参数推导
function createHandler<T extends (event: any) => any>(
  handler: T
): T extends (event: infer E) => any ? E : never {
  // ...
  return handler;
}

// 4. 复杂的推导场景
// 推断数组元素类型
type ElementType<T> = T extends (infer U)[] ? U : never;

type Num = ElementType<number[]>;      // number
type Str = ElementType<string[]>;      // string
type Mixed = ElementType<(string | number)[]>;  // string | number

// 5. 推断对象属性类型
type PropType<T, K extends keyof T> = T[K];

type Name = PropType<{ name: string; age: number }, "name">;  // string

// 6. 推断函数返回类型
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any;

type R1 = ReturnType<() => string>;     // string
type R2 = ReturnType<(x: number) => boolean>;  // boolean
type R3 = ReturnType<() => never>;     // never

// 7. 推断构造函数返回类型
type InstanceType<T extends new (...args: any[]) => any> =
  T extends new (...args: any[]) => infer R ? R : any;

class User {
  constructor(public name: string) {}
}

type UserInstance = InstanceType<typeof User>;  // User

// 8. 条件类型中的推断
// 推断联合类型
type UnionToIntersection<U> =
  (U extends any ? (x: U) => void : never) extends (x: infer I) => void
    ? I
    : never;

type T = UnionToIntersection<{ a: string } | { b: number }>;
// { a: string } & { b: number }

// 9. 递归推断
// 深度展开嵌套类型
type DeepRequired<T> = T extends object
  ? { [K in keyof T]-?: DeepRequired<T[K]> }
  : T;

type Nested = { a?: { b?: { c?: number } } };
type RequiredNested = DeepRequired<Nested>;
// { a: { b: { c: number } } }

// 10. 元组与数组推断
type First<T extends any[]> = T extends [infer F, ...any[]] ? F : never;

type F1 = First<[string, number, boolean]>;  // string
type F2 = First<[]>;                        // never

type Last<T extends any[]> = T extends [...any[], infer L] ? L : never;

type L1 = Last<[string, number, boolean]>;  // boolean
type L2 = Last<[]>;                       // never

type Rest<T extends any[]> = T extends [any, ...infer R] ? R : never;

type R1 = Rest<[string, number, boolean]>;  // [number, boolean]
```

### 5.4 逆变与协变：父子类型关系

协变和逆变是理解泛型类型兼容性的关键概念。

**协变与逆变的定义**

```typescript
// 1. 协变（Convariance）
// 如果 A 是 B 的子类型，那么 F<A> 也是 F<B> 的子类型
// 通常用于函数返回值

type A = { a: string };
type B = { a: string; b: number };

// B 是 A 的子类型（B 有 A 的所有属性，还多了一些）
// 所以 B 可以赋值给 A
const b: B = { a: "hello", b: 42 };
const a: A = b;  // OK：协变

// 数组是协变的
let arrB: B[] = [b];
let arrA: A[] = arrB;  // OK

// 2. 逆变（Contravariance）
// 如果 A 是 B 的子类型，那么 F<B> 是 F<A> 的子类型
// 通常用于函数参数

function processA(obj: A): void {
  console.log(obj.a);
}

function processB(obj: B): void {
  console.log(obj.a, obj.b);
}

let fnA: (obj: A) => void = processA;
let fnB: (obj: B) => void = processB;

// fnB = fnA;  // 错误！如果有 fnB，它期望 B，但 obj 是 A
fnA = fnB;  // OK！processB 可以处理 A（因为 B 有 A 的所有属性）

// 3. TypeScript 的默认行为
// TypeScript 使用"双变"（bivariant）策略处理函数参数类型
// 这是不安全的，但在实践中很有用

interface Event {
  timestamp: number;
}

interface MouseEvent extends Event {
  x: number;
  y: number;
}

interface KeyEvent extends Event {
  key: string;
}

// 数组在 TypeScript 中是双变的
// 这允许你把 MouseEvent[] 赋值给 (e: Event) => void
// 反过来也可以
const mouseEvents: MouseEvent[] = [];
const eventHandler: (e: Event) => void = (e) => {
  console.log(e.timestamp);
};

eventHandler = mouseEvents;  // OK
mouseEvents.push({ timestamp: 0, x: 0, y: 0, key: "a" });
eventHandler({ timestamp: 0 });  // 可能访问 x, y, key 但它们不存在

// 4. 泛型的协变与逆变

// 协变类型参数（out）
type Producer<out T> = () => T;

type ProducerA = Producer<A>;
type ProducerB = Producer<B>;

let producerA: ProducerA = () => ({ a: "hello" });
let producerB: ProducerB = () => ({ a: "hello", b: 42 });

// ProducerB 可以赋值给 ProducerA（协变）
producerA = producerB;  // OK

// 逆变类型参数（in）
type Consumer<in T> = (obj: T) => void;

type ConsumerA = Consumer<A>;
type ConsumerB = Consumer<B>;

let consumerA: ConsumerA = (obj) => console.log(obj.a);
let consumerB: ConsumerB = (obj) => console.log(obj.a, obj.b);

// ConsumerA 可以赋值给 ConsumerB（逆变）
consumerB = consumerA;  // OK
```

**TypeScript 中的泛型变体标记**

```typescript
// TypeScript 5.0 引入了显式变体标记

// 1. 协变标记（out）
// 只能在返回值位置使用
type ReadonlyArray<out T> = readonly T[];

type Box<out T> = {
  value: T;           // 协变位置（返回值）
  getValue(): T;      // 协变位置
};

// 2. 逆变标记（in）
// 只能在参数位置使用
type WriteonlyBox<in T> = {
  setValue(value: T): void;  // 逆变位置
};

// 3. 双向变体（默认，不标记）
type Box<T> = {
  value: T;
  setValue(value: T): void;  // 双向变体
};

// 4. 实际应用：Promise
// Promise 的泛型是协变的（只出现在返回类型）
type Promise<out T> = {
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2>;
  // ...
};

// 5. 实际应用：Readonly
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

// 属性在 TypeScript 中默认是双向变异的
// 但 readonly 标记使其变为协变

// 6. 实际应用：Partial
type Partial<T> = {
  [P in keyof T]?: T[P];
};

// 可选属性是双向变异的

// 7. 函数类型的变异性
// 函数参数是逆变的，返回值是协变的

type Fn<T> = (arg: T) => T;

// Fn<A> 和 Fn<B> 的关系取决于 A 和 B 的关系
// 但由于参数逆变和返回值协变，整体是复杂的

// 8. 泛型接口的变体
interface Mapper<out T, in U> {
  map(value: T): U;  // T 协变（只在返回类型），U 逆变（只在参数类型）
}
```

### 5.5 我的思考：泛型为什么这么难

**泛型难以理解的根源**

```typescript
// 1. 泛型是"类型级别的编程"
// 普通编程：值 → 值
// 泛型编程：类型 → 类型

// 这需要我们用完全不同的思维方式

// 2. 泛型的编译时/运行时二分
// 泛型参数 T 在编译时存在
// 但 T 的"值"（具体类型）在编译时可能还不确定
// 最终代码运行时，T 已经被擦除

// 3. 泛型的多态层次

// ad-hoc 多态（重载）
function len(x: string): number;
function len(x: any[]): number;
function len(x: any): number {
  return x.length;
}

// 参数多态（泛型）
function len<T>(x: T): T {
  // T 是类型参数
  // 这个函数对所有类型 T 都有效
  // 但我们不能访问 T 的任何属性
  return x;
}

// 4. 约束打破了这个限制
function len<T extends { length: number }>(x: T): number {
  return x.length;  // 现在可以访问 length 了
}

// 5. 泛型的递归限制
// TypeScript 不允许无限递归类型

// 这个会报错：
// type Infinite<T> = { value: T, next: Infinite<Infinite<T>> };

// 但这个可以：
type Flatten<T> = T extends (infer U)[] ? Flatten<U> : T;

type A = Flatten<number[][][]>;  // number（通过递归推导）

// 6. 泛型与条件类型的交互
// 当泛型遇到条件类型，事情变得更加复杂

type IsArray<T> = T extends any[] ? true : false;

type A = IsArray<string[]>;  // true
type B = IsArray<string>;    // false

// 但对于联合类型，会分发：
type C = IsArray<string[] | string>;  // true | false = boolean

// 7. 为什么 infer 难以理解
// infer 是在条件类型中创建"临时变量"

type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any;

// 这里 R 不是一个真正的变量
// 它是 TypeScript 在匹配 T 到 (...args: any[]) => R 模式时
// 临时记录下的"类型占位符"

// 8. 理解泛型的正确姿势

// 不要试图"运行"泛型代码
// 而是理解泛型是"类型的模具"

type Pair<T, U> = [T, U];

// Pair<string, number> 不是"创建了一个叫 T 的 string"
// 而是"模具 T 被实例化为 string，模具 U 被实例化为 number"

// 最终得到 [string, number]

// 9. 泛型的组合性
// 复杂泛型由简单泛型组合而成

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// 分解理解：
// - keyof T 遍历所有键
// - T[P] 获取键对应的值类型
// - T[P] extends object 检查值是否是对象
// - 如果是，递归应用 DeepPartial
// - 如果不是，保持原类型
```

---

## 6. 条件类型底层

### 6.1 条件类型的求值过程

条件类型是 TypeScript 类型系统中最强大的特性之一，它的求值过程遵循特定的规则。

**条件类型的基础**

```typescript
// 条件类型语法
// T extends U ? X : Y

// 语义："如果 T 是 U 的子类型，则结果为 X，否则为 Y"

// 1. 基本求值
type IsString<T> = T extends string ? true : false;

type A = IsString<string>;   // true
type B = IsString<number>;    // false
type C = IsString<"hello">;   // true（字面量是 string 的子类型）

// 2. 条件类型的惰性求值
// 条件类型默认是"惰性"的，只有在被使用时才会求值

type Lazy<T> = T extends string ? () => T : never;

// 这个类型本身不会报错
// 只有当你真正使用它时才会检查

// 3. 条件类型的分布式特性
// 当 T 是裸类型参数（没有额外包装）时，
// 条件类型会"分发"到联合类型的每个成员

type T1 = string | number extends string ? true : false;
// = (string extends string ? true : false) | (number extends string ? true : false)
// = true | false
// = boolean

// 4. 避免分布式
// 使用 [...] 包装可以避免分发

type T2 = [string | number] extends [string] ? true : false;
// = false（联合类型整体进行比较）

// 5. 裸类型参数判定
// 判断条件类型是否会分发的规则：
// - T（裸类型参数）会分发
// - [T]（包装为元组）不会分发
// - (T extends U ? X : Y)（在另一个条件类型中）会分发
// - 泛型约束中的 T 不会分发

// 6. 条件类型的递归限制
// TypeScript 对条件类型的递归深度有限制

type DeepFlatten<T> = T extends (infer U)[]
  ? DeepFlatten<U>
  : T;

// 递归太深会报错
// type Test = DeepFlatten<number[][][][][][]>;  // 可能超出限制

// 7. 条件类型与泛型的结合
type Filter<T, U> = T extends U ? T : never;

type Strings = Filter<string | number | boolean, string>;
// = (string extends string ? string : never)
//   | (number extends string ? number : never)
//   | (boolean extends string ? boolean : never)
// = string | never | never
// = string

// 8. 条件类型的简化规则
// TypeScript 会尝试简化条件类型

type Simplify<T> = T extends infer U ? U : never;

type A = Simplify<string>;     // string
type B = Simplify<never>;      // never
```

### 6.2 分布式条件类型

分布式条件类型是 TypeScript 类型系统中最强大但也最容易困惑的特性之一。

**分布式条件类型详解**

```typescript
// 1. 分发的定义
// 当条件类型的类型参数是联合类型时，
// 条件类型会对联合的每个成员分别求值，然后合并结果

type ToArray<T> = T extends any ? T[] : never;

type A = ToArray<string | number>;
// = ToArray<string> | ToArray<number>
// = string[] | number[]

// 2. 分发的触发条件
// 必须是裸类型参数（未包装的 T）

type Test1<T> = T extends string ? T[] : never;
type Test2<T> = [T] extends [string] ? T[] : never;  // 使用元组包装

type R1 = Test1<string | number>;  // string[] | number[]（分发）
type R2 = Test2<string | number>;   // never（不分发）

// 3. 分发在泛型接口中
interface Container<T> {
  value: T;
}

type Test3<T> = Container<T> extends { value: string } ? T : never;

type R3 = Test3<string | number>;
// = Test3<string> | Test3<number>
// = (Container<string> extends ... ? string : never)
//   | (Container<number> extends ... ? number : never)
// = string | never
// = string

// 4. 分发的实际应用：类型过滤
// 从联合类型中排除特定类型

type Exclude<T, U> = T extends U ? never : T;

type Original = string | number | boolean;
type WithoutNumber = Exclude<Original, number>;
// = (string extends number ? never : string)
//   | (number extends number ? never : number)
//   | (boolean extends number ? never : boolean)
// = string | never | boolean
// = string | boolean

// 5. Extract - 保留特定类型
type Extract<T, U> = T extends U ? T : never;

type OnlyString = Extract<Original, string>;
// = string | never | never
// = string

// 6. NonNullable 的实现
type NonNullable<T> = T extends null | undefined ? never : T;

type Cleaned = NonNullable<string | null | undefined | number>;
// = string | never | never | number
// = string | number

// 7. 分发与交叉类型
// 分发会"展开"联合类型

type IsNever<T> = [T] extends [never] ? true : false;

type R4 = IsNever<never>;   // true
type R5 = IsNever<string>;  // false

// 注意：never 是特殊情况
// never extends T 永远为真（never 是所有类型的子类型）
// 但 never extends never 也是真

// 8. 分发的副作用
// 分布式条件类型有时会产生意想不到的结果

type Double<T> = T extends string ? [T, T] : never;

type R6 = Double<string | number>;  // [string, string] | never = [string, string]

// 这可能不是你想要的（得到的是联合，不是交叉）

// 9. 避免分发的正确方式
// 如果不希望分发，使用元组包装

type NotDistributed<T> = [T] extends [string] ? true : false;

type R7 = NotDistributed<string | number>;  // false（不分发）
```

### 6.3 infer实现原理

`infer` 关键字是 TypeScript 类型系统中用于类型推断的核心机制。

**infer 的工作原理**

```typescript
// 1. infer 的基本用法
// infer 只能在条件类型的 extends 子句中使用
// 用于"提取"或"捕获"类型的一部分

// 提取数组元素类型
type ElementOf<T> = T extends (infer U)[] ? U : never;

type A = ElementOf<string[]>;  // string
type B = ElementOf<number[]>;  // number

// 2. infer 的语义
// "如果 T 可以匹配 (infer U)[] 的形式，那么 U 就是我们要的类型"

type Test = string[] extends (infer U)[] ? U : never;
// string[] 可以匹配 (infer U)[]，所以 U = string

// 3. 提取函数参数类型
type FirstArg<T> = T extends (arg: infer U, ...args: any[]) => any ? U : never;

type C = FirstArg<(name: string, age: number) => void>;  // string

// 4. 提取函数返回类型
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any;

type D = ReturnType<() => number>;          // number
type E = ReturnType<() => Promise<string>>; // Promise<string>

// 5. 提取构造函数参数类型
type ConstructorArgs<T> = T extends new (...args: infer U) => any ? U : never;

class Person {
  constructor(public name: string, public age: number) {}
}

type F = ConstructorArgs<typeof Person>;  // [name: string, age: number]

// 6. 多个 infer
type ExtractArgs<T> = T extends (a: infer A, b: infer B) => any ? [A, B] : never;

type G = ExtractArgs<(a: string, b: number) => void>;  // [string, number]

// 7. infer 的位置
// infer 可以在 extends 子句的多个位置使用

type Complex<T> = T extends {
  input: infer I;
  output: (result: infer O) => any;
} ? { input: I; output: O } : never;

type H = Complex<{ input: string; output: (r: number) => void }>;
// { input: string; output: number }

// 8. 嵌套 infer
// infer 可以嵌套使用

type DeepArrayElement<T> = T extends (infer U)[]
  ? U extends (infer V)[]
    ? DeepArrayElement<U>  // 递归
    : U
  : T;

type I = DeepArrayElement<string[][]>;  // string

// 9. infer 与协变/逆变
// infer 提取的类型位置影响其协变性

// 返回类型位置（协变）
type GetReturn<T> = T extends () => infer R ? R : never;

// 参数类型位置（逆变）
type GetParam<T> = T extends (arg: infer P) => any ? P : never;

// 10. infer 的限制
// - infer 只能在 extends 子句的条件类型中使用
// - 每个条件类型中可以有多个 infer
// - infer 声明的类型变量只能在结果分支中使用

// 错误示例
// type Wrong<T> = infer U;  // 错误：infer 不能单独使用

// 正确用法
type Correct<T> = T extends infer U ? U : never;

// 11. infer 的实际应用：解包类型
// 解包 Promise
type UnpackPromise<T> = T extends Promise<infer U> ? U : T;

type J = UnpackPromise<Promise<string>>;     // string
type K = UnpackPromise<Promise<number[]>>;   // number[]
type L = UnpackPromise<boolean>;            // boolean

// 解包 ReadonlyArray
type UnpackArray<T> = T extends readonly (infer U)[] ? U : T;

type M = UnpackArray<readonly string[]>;  // string

// 解包 keyed
type UnpackObject<T> = T extends { [key: string]: infer U } ? U : T;

type N = UnpackObject<{ [key: string]: number }>;  // number
```

### 6.4 内置工具类型实现

TypeScript 内置的工具类型是理解类型编程的最佳示例。

**核心工具类型的实现**

```typescript
// ===== 基础工具类型 =====

// 1. Partial<T> - 将所有属性变为可选
type MyPartial<T> = {
  [P in keyof T]?: T[P];
};

// 原理：
// - keyof T 获取 T 的所有属性键
// - in 遍历每个键
// - ? 将属性变为可选
// - T[P] 获取属性值的类型

interface User {
  id: number;
  name: string;
  email: string;
}

type PartialUser = MyPartial<User>;
// = { id?: number; name?: string; email?: string; }

// 2. Required<T> - 将所有属性变为必需
type MyRequired<T> = {
  [P in keyof T]-?: T[P];
};

// -? 是映射类型的修饰符
// - 移除可选标记（-? 表示移除 ?）
// +? 是显式添加可选标记

interface Config {
  debug?: boolean;
  timeout?: number;
}

type RequiredConfig = MyRequired<Config>;
// = { debug: boolean; timeout: number; }

// 3. Readonly<T> - 将所有属性变为只读
type MyReadonly<T> = {
  readonly [P in keyof T]: T[P];
};

type FrozenUser = MyReadonly<User>;
// = { readonly id: number; readonly name: string; readonly email: string; }

// 4. Pick<T, K> - 从 T 中选择一组属性 K
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};

type UserPreview = MyPick<User, "id" | "name">;
// = { id: number; name: string; }

// 5. Omit<T, K> - 从 T 中移除一组属性 K
type MyOmit<T, K extends keyof any> = {
  [P in Exclude<keyof T, K>]: T[P];
};

type UserWithoutEmail = MyOmit<User, "email">;
// = { id: number; name: string; }

// 6. Record<K, T> - 创建键类型为 K，值类型为 T 的对象类型
type MyRecord<K extends keyof any, T> = {
  [P in K]: T;
};

type UserDict = MyRecord<string, User>;
// = { [key: string]: User }

// ===== 高级工具类型 =====

// 7. Exclude<T, U> - 从 T 中排除可赋值给 U 的类型
type MyExclude<T, U> = T extends U ? never : T;

type ExtractedStrings = MyExclude<string | number | boolean, string | number>;
// = boolean

// 原理：分发到联合类型
// (string extends string ? never : string)
// | (number extends string ? never : number)
// | (boolean extends string ? never : boolean)
// = never | never | boolean
// = boolean

// 8. Extract<T, U> - 从 T 中提取可赋值给 U 的类型
type MyExtract<T, U> = T extends U ? T : never;

type ExtractedNumbers = MyExtract<string | number | boolean, string | number>;
// = string | number

// 9. NonNullable<T> - 排除 null 和 undefined
type MyNonNullable<T> = T extends null | undefined ? never : T;

type CleanType = MyNonNullable<string | null | undefined | number>;
// = string | number

// 10. ReturnType<T> - 获取函数返回类型
type MyReturnType<T extends (...args: any) => any> =
  T extends (...args: any) => infer R ? R : any;

function getUser() {
  return { id: 1, name: "张三" };
}

type UserType = MyReturnType<typeof getUser>;
// = { id: number; name: string; }

// 11. Parameters<T> - 获取函数参数类型为元组
type MyParameters<T extends (...args: any) => any> =
  T extends (...args: infer P) => any ? P : never;

function processUser(name: string, age: number, active: boolean) {}

type ProcessParams = MyParameters<typeof processUser>;
// = [name: string, age: number, active: boolean]

// 12. ConstructorParameters<T> - 获取构造函数参数类型
type MyConstructorParameters<T extends new (...args: any) => any> =
  T extends new (...args: infer P) => any ? P : never;

class UserClass {
  constructor(public name: string, public age: number) {}
}

type UserClassParams = MyConstructorParameters<typeof UserClass>;
// = [name: string, age: number]

// 13. InstanceType<T> - 获取实例类型
type MyInstanceType<T extends new (...args: any) => any> =
  T extends new (...args: any) => infer R ? R : any;

type UserInstance = MyInstanceType<typeof UserClass>;
// = UserClass

// 14. ThisParameterType<T> - 获取 this 参数类型
type MyThisParameterType<T> =
  T extends (this: infer This, ...args: any[]) => any ? This : unknown;

function myFunc(this: string, x: number) {}

type MyThis = MyThisParameterType<typeof myFunc>;
// = string

// 15. OmitThisParameter<T> - 移除 this 参数类型
type MyOmitThisParameter<T> =
  T extends (...args: infer P) => infer R ? (...args: P) => R : T;

type FuncWithoutThis = MyOmitThisParameter<typeof myFunc>;
// = (x: number) => void
```

### 6.5 实战：手写内置工具类型

通过实现更多高级工具类型，深入掌握条件类型和映射类型。

```typescript
// ===== 进阶工具类型实现 =====

// 1. DeepPartial - 深度可选
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

interface Company {
  name: string;
  address: {
    city: string;
    zip: string;
  };
}

type DeepPartialCompany = DeepPartial<Company>;
// = {
//     name?: string;
//     address?: {
//       city?: string;
//       zip?: string;
//     };
//   }

// 2. DeepReadonly - 深度只读
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// 3. DeepRequired - 深度必需
type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

// 4. RequiredKeys - 获取必需属性
type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

interface Test {
  a: string;      // 必需
  b?: number;     // 可选
  c: boolean;     // 必需
}

type T1 = RequiredKeys<Test>;  // "a" | "c"

// 5. OptionalKeys - 获取可选属性
type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

type T2 = OptionalKeys<Test>;  // "b"

// 6. Mutable - 移除只读
type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

type T3 = Mutable<readonly { name: string }>;  // { name: string }

// 7. MutableKeys - 获取可写属性
type MutableKeys<T> = {
  [P in keyof T]-?: {} extends Pick<T, P> ? never : T[P] extends Readonly<T[P]> ? never : P;
}[keyof T];

interface Frozen {
  readonly a: string;
  b: number;
}

type T4 = MutableKeys<Frozen>;  // "b"

// 8. UnionToIntersection - 联合转交叉
type UnionToIntersection<U> =
  (U extends any ? (x: U) => void : never) extends (x: infer I) => void ? I : never;

type T5 = UnionToIntersection<{ a: string } | { b: number }>;
// = { a: string } & { b: number }

// 原理：
// (U extends any ? (x: U) => void : never) 对每个联合成员创建一个函数类型
// 然后这些函数类型组成联合
// 最后通过 infer 提取交叉类型

// 9. IntersectionToUnion - 交叉转联合
type IntersectionToUnion<T> = T extends { [K in keyof T]: infer U } ? U : never;

type T6 = IntersectionToUnion<{ a: string } & { b: number }>;
// = string | number

// 10. Promisable - 类型可深度转换为 Promise
type Promisable<T> = T extends Promise<infer U>
  ? Promise<Promisable<U>>
  : T extends object
    ? { [K in keyof T]: Promisable<T[K]> }
    : T;

type T7 = Promisable<{ name: string; friends: string[] }>;
// = Promise<{ name: Promise<string>; friends: Promise<string>[] }>

// 11. Diff - 两个对象类型的差异
type Diff<T, U> = Omit<T, keyof U> & Omit<U, keyof T>;

type T8 = Diff<{ a: string; b: number }, { b: number; c: boolean }>;
// = { a: string; c: boolean }

// 12. Subtract - 从 T 中移除可赋值给 U 的属性
type Subtract<T, U> = T extends (infer O & Exclude<keyof U, never>) ? O : T;

type T9 = Subtract<{ a: string; b: number }, { b: number }>;
// = { a: string }

// 13. Overwrite - 覆盖对象类型
type Overwrite<T, U> = {
  [P in keyof T]: P extends keyof U ? U[P] : T[P]
} & {
  [P in keyof U]: U[P]
} extends infer O ? { [P in keyof O]: O[P] } : never;

type T10 = Overwrite<{ name: string; age: number }, { age: string }>;
// = { name: string; age: string }

// 14. AppendArgument - 追加函数参数
type AppendArgument<F, A> =
  F extends (...args: infer P) => infer R
    ? (...args: [...P, A]) => R
    : never;

type T11 = AppendArgument<(x: number) => string, boolean>;
// = (x: number, argument: boolean) => string

// 15. ReturnTypeDeep - 深度获取返回类型
type ReturnTypeDeep<T> = T extends (...args: any[]) => infer R
  ? R extends (...args: any[]) => any
    ? ReturnTypeDeep<R>
    : R
  : never;

function getUser() {
  return {
    getName: () => "张三"
  };
}

type T12 = ReturnTypeDeep<typeof getUser>;  // string

// 16. Simplify - 简化交叉类型
type Simplify<T> = { [K in keyof T]: T[K] };

type T13 = Simplify<{ a: string } & { b: number } & { a: string }>;
// = { a: string; b: number }

// 17.解包数组类型
type Unpacked<T> =
  T extends (infer U)[] ? U :
  T extends (infer U)[] ? U :
  T extends Promise<infer U> ? U :
  T;

type T14 = Unpacked<string[]>;        // string
type T15 = Unpacked<Promise<number>>; // number
type T16 = Unpacked<boolean>;          // boolean

// 18. Key-value map to object
type KeyValuePairs<T> = {
  [K in keyof T]: [K, T[K]]
}[keyof T];

type T17 = KeyValuePairs<{ a: string; b: number }>;
// = ["a", string] | ["b", number]
```

---

## 7. 映射类型底层

### 7.1 映射类型的转换

映射类型是 TypeScript 类型系统中最强大的抽象机制之一。

**映射类型基础**

```typescript
// 1. 映射类型的基本形式
// { [K in Keys]: ValueType }

// Keys 通常是 keyof T 获取的属性键
// K in 遍历每个键

type PropertiesTo<T, V> = {
  [K in keyof T]: V;
};

type Stringify<T> = {
  [K in keyof T]: string;
};

interface User {
  id: number;
  name: string;
  active: boolean;
}

type UserStringify = Stringify<User>;
// = { id: string; name: string; active: string }

// 2. 映射类型的键重映射
// TypeScript 4.1 引入了键重映射（Key Remapping）

type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type UserGetters = Getters<User>;
// = {
//     getId: () => number;
//     getName: () => string;
//     getActive: () => boolean;
//   }

// 3. 映射类型的修饰符
// readonly 和 ? 可以添加或移除

// 移除只读
type Writable<T> = {
  -readonly [P in keyof T]: T[P];
};

// 移除可选
type Required<T> = {
  [P in keyof T]-?: T[P];
};

// 添加只读
type Frozen<T> = {
  readonly [P in keyof T]: T[P];
};

// 添加可选
type Optional<T> = {
  [P in keyof T]?: T[P];
};

// 4. 条件映射
// 在映射类型中加入条件

type Conditional<T> = {
  [K in keyof T]: T[K] extends string ? K : never;
}[keyof T];

type T1 = Conditional<{ name: string; age: number; active: boolean }>;
// = "name"（只有 name 类型的值是 string）

// 5. 过滤映射
// 映射类型可以用来过滤属性

type PickByValue<T, V> = {
  [K in keyof T as T[K] extends V ? K : never]: T[K];
};

type StringProps = PickByValue<User, string>;
// = { name: string }

type NumberOrStringProps = PickByValue<User, number | string>;
// = { id: number; name: string }

// 6. 键过滤
// 基于键名过滤

type ExcludeMethods<T> = {
  [K in keyof T as K extends string ? K : never]: T[K];
};

interface Mixed {
  name: string;
  process(): void;
  value: number;
  execute(): string;
}

type T2 = ExcludeMethods<Mixed>;
// = { name: string; value: number }

// 7. 同态映射类型
// 映射类型在对象类型上会保持对象结构
// TypeScript 会记住映射前后的关系

type AnotherPartial<T> = {
  [P in keyof T]?: T[P];
};

const user: AnotherPartial<User> = { name: "张三" };
// user 的类型仍然是 { id?: number; name?: string; active?: boolean; }
// 只是某些属性变为可选
```

### 7.2 keyof与映射

`keyof` 是获取类型所有属性键的关键操作。

**keyof 的工作机制**

```typescript
// 1. 基本 keyof
interface Person {
  name: string;
  age: number;
}

type PersonKeys = keyof Person;  // "name" | "age"

// 2. keyof 与数字索引
interface StringArray {
  [index: number]: string;
}

type StringArrayKeys = keyof StringArray;  // number

// 3. keyof 与字符串索引
interface Map {
  [key: string]: any;
}

type MapKeys = keyof Map;  // string

// 4. keyof 与符号
class Counter {
  private count = 0;
  increment(): void { this.count++; }
}

type CounterKeys = keyof Counter;  // "increment" | "count"（如果 count 是公有的）

// 5. keyof 与泛型
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: "张三", age: 25 };

const name = getProperty(user, "name");  // string
const age = getProperty(user, "age");   // number

// 6. keyof 与只读属性
interface ReadonlyPerson {
  readonly name: string;
}

type ReadonlyKeys = keyof ReadonlyPerson;  // "name"

// 7. keyof 与可选属性
interface OptionalPerson {
  name?: string;
}

type OptionalKeys = keyof OptionalPerson;  // "name"

// 8. keyof 与继承
interface Employee extends Person {
  department: string;
}

type EmployeeKeys = keyof Employee;  // "name" | "age" | "department"

// 9. keyof 与交叉类型
type A = { a: string };
type B = { b: number };

type AB = A & B;
type ABKeys = keyof AB;  // "a" | "b"

// 10. keyof 与联合类型
type Keys1 = keyof (A | B);  // never（联合类型没有共同的键）
type Keys2 = keyof (A | { a: string; b: number });  // "a" | "b"

// 11. keyof 与索引签名
type Indexed = { [K: string]: number };
type IndexedKeys = keyof Indexed;  // string

// 12. keyof 实际应用
type MapToPromise<T> = {
  [K in keyof T]: Promise<T[K]>;
};

type T1 = MapToPromise<{ name: string; age: number }>;
// = { name: Promise<string>; age: Promise<number> }

// 13. keyof 实现高级类型
type Keyof<T> = keyof T;

type Values<T> = T[keyof T];

type PersonValues = Values<Person>;  // string | number

// 14. keyof 与只读/可选映射的交互
type Readonly<T> = {
  readonly [K in keyof T]: T[K];
};

type Partial<T> = {
  [K in keyof T]?: T[K];
};
```

### 7.3 修改修饰符

映射类型中的修饰符是控制属性特性的关键机制。

**修饰符详解**

```typescript
// 1. readonly 修饰符
// 添加 readonly
type Immutable<T> = {
  readonly [K in keyof T]: T[K];
};

// 移除 readonly
type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

// 2. ? 修饰符
// 添加可选
type Optional<T> = {
  [K in keyof T]?: T[K];
};

// 移除可选（使必需）
type Required<T> = {
  [K in keyof T]-?: T[K];
};

// 3. 组合使用
// 同时添加/移除多个修饰符
type AllModifiers<T> = {
  readonly [K in keyof T]?: T[K];
};

// 4. 条件修饰符
// 基于属性类型添加修饰符

type ToReadonly<T> = {
  [K in keyof T]: T[K] extends Function ? T[K] : readonly T[K];
};

interface Config {
  name: string;
  process(): void;
}

type T1 = ToReadonly<Config>;
// = { readonly name: string; process(): void }

// 5. 条件修饰符 - 保持函数不变
type KeepFunctions<T> = {
  [K in keyof T as T[K] extends Function ? K : never]: T[K];
};

// 6. 键重映射中的修饰符
type GettersOnly<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

// 7. 使用 infer 在映射中转换
type Unwrap<T> = {
  [K in keyof T]: T[K] extends Promise<infer U> ? U : T[K];
};

type T2 = Unwrap<{ name: Promise<string>; age: Promise<number> }>;
// = { name: string; age: number }

// 8. 映射类型与继承
interface Base {
  id: number;
}

type WithName<T extends Base> = {
  [K in keyof T]: T[K];
} & { name: string };

// 9. 模板字面量与映射
type EventHandlers<T> = {
  [K in keyof T as `on${Capitalize<string & K>}`]?: (value: T[K]) => void;
};

type T3 = EventHandlers<{ click: string; focus: string }>;
// = { onClick?: (value: string) => void; onFocus?: (value: string) => void; }

// 10. 复杂映射
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? DeepReadonly<T[K]>
    : T[K];
};
```

### 7.4 实战：实现一个映射类型工具

通过实现一个完整的映射类型工具库来巩固知识。

```typescript
// ===== 完整映射类型工具库 =====

// 1. BasicMappable - 基础映射接口
interface BasicMappable<T, K extends keyof T = keyof T> {
  [key in K]: T[key];
}

// 2. TransformValues - 转换值类型
type TransformValues<T, U> = {
  [K in keyof T]: U;
};

type T1 = TransformValues<{ name: string; age: number }, boolean>;
// = { name: boolean; age: boolean }

// 3. MapToIndexed - 添加索引前缀
type WithIndex<T, I extends string = "i"> = {
  [K in keyof T as `${I}${K & string}`]: T[K];
};

type T2 = WithIndex<{ name: string; age: number }, "i_">;
// = { i_name: string; i_age: number }

// 4. RenameKeys - 重命名属性
type RenameKeys<T, R extends Record<string, string>> = {
  [K in keyof T as K extends keyof R ? R[K] : K]: T[K];
};

type T3 = RenameKeys<{ name: string; age: number }, { name: "fullName" }>;
// = { fullName: string; age: number }

// 5. Paths - 获取对象所有路径
type Paths<T, P extends string = ""> = T extends object
  ? {
      [K in keyof T & string]: P extends ""
        ? Paths<T[K], K>
        : Paths<T[K], `${P}.${K}`>
    }[keyof T & string]
  : P;

interface Nested {
  user: {
    profile: {
      name: string;
    };
    address: {
      city: string;
    };
  };
}

type T4 = Paths<Nested>;
// = "user" | "user.profile" | "user.profile.name" | "user.address" | "user.address.city"

// 6. PickByPath - 按路径选择
type PickByPath<T, P extends Paths<T>> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? { [key in K]: PickByPath<T[K], Rest> }
    : never
  : P extends keyof T
    ? { [key in P]: T[key] }
    : never;

type T5 = PickByPath<Nested, "user.profile">;
// = { user: { profile: { name: string } } }

// 7. PathsToOptional - 将嵌套路径变为可选
type PathsToOptional<T> = {
  [K in Paths<T>]?: K extends `${infer A}.${infer B}`
    ? A extends keyof T
      ? { [key in A]: PathsToOptional<T[A]> }
      : never
    : never;
}[Paths<T>];

type T6 = PathsToOptional<Nested>;
// = {
//     user?: {
//       profile?: {
//         name?: string;
//       };
//       address?: {
//         city?: string;
//       };
//     };
//   }

// 8. Flatten - 展平对象
type Flatten<T, Prefix extends string = ""> = {
  [K in keyof T as K extends string
    ? Prefix extends ""
      ? K
      : `${Prefix}.${K}`
    : never
  ]: T[K] extends object
    ? Flatten<T[K], Prefix extends "" ? K : `${Prefix}.${K}`>
    : T[K]
}[keyof T extends string ? Flatten<T, Prefix> : never];

type T7 = Flatten<{ user: { name: string } }>;
// = { "user.name": string }

// 9. Merge - 合并对象类型
type Merge<T, U> = {
  [K in keyof T | keyof U]: K extends keyof T
    ? K extends keyof U
      ? T[K] | U[K]  // 联合两个值类型
      : T[K]
    : K extends keyof U
      ? U[K]
      : never;
};

type T8 = Merge<{ a: string }, { b: number }>;
// = { a: string; b: number }

// 10. Spread - 展开交叉类型
type Spread<T extends object> = {
  [K in keyof T]: T[K];
};

type T9 = Spread<{ a: string } & { b: number }>;
// = { a: string; b: number }

// 11. RequiredBy - 根据条件使属性必需
type RequiredBy<T, K extends keyof T> = {
  [P in keyof T as P extends K ? never : P]: T[P];
} & {
  [P in K]-?: T[P];
};

type T10 = RequiredBy<{ name?: string; age?: number }, "name">;
// = { age?: number } & { name: string }

// 12. OptionalBy - 根据条件使属性可选
type OptionalBy<T, K extends keyof T> = {
  [P in keyof T as P extends K ? P : never]?: T[P];
} & {
  [P in keyof T as P extends K ? never : P]: T[P];
};

type T11 = OptionalBy<{ name: string; age: number }, "name">;
// = { name?: string } & { age: number }

// 13. Exclusive - 互斥属性
type Exclusive<T, U extends keyof T> = {
  [K in keyof T]: K extends U ? T[K] : never;
};

type T12 = Exclusive<{ type: "a"; valueA: string } | { type: "b"; valueB: number }, "type">;
// = { type: "a"; valueA: string } | { type: "b"; valueB: number }

// 14. DeepMerge - 深度合并
type DeepMerge<T, U> = {
  [K in keyof T | keyof U]: K extends keyof T
    ? K extends keyof U
      ? T[K] extends object
        ? U[K] extends object
          ? DeepMerge<T[K], U[K]>
          : T[K]
        : T[K] | U[K]
      : T[K]
    : K extends keyof U
      ? U[K]
      : never;
};

type T13 = DeepMerge<
  { user: { name: string; age: number } },
  { user: { age: string; city: string } }
>;
// = { user: { name: string; age: string; city: string } }
```

---

## 8. TypeScript编译器扩展

### 8.1 Compiler API使用

TypeScript Compiler API 允许你程序化地访问 TypeScript 编译器的能力。

**Compiler API 基础**

```typescript
// 1. 创建程序（Program）
import * as ts from "typescript";

const compilerOptions: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2015,
  module: ts.ModuleKind.ESNext,
  strict: true,
  outDir: "./dist",
  declaration: true,
};

const program = ts.createProgram({
  rootNames: ["./src/index.ts"],
  options: compilerOptions,
});

// 2. 获取类型检查器
const checker = program.getTypeChecker();

// 3. 获取源码
const sourceFile = program.getSourceFile("./src/index.ts");

// 4. 获取所有诊断信息
const allDiagnostics = ts.getPreEmitDiagnostics(program);
allDiagnostics.forEach(diagnostic => {
  if (diagnostic.file && diagnostic.start) {
    const { line, character } = ts.getLineAndCharacterOfPosition(
      diagnostic.file,
      diagnostic.start
    );
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
    console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
  }
});

// 5. 发射输出
const { emitSkipped, diagnostics: emitDiagnostics } = program.emit();

// 6. 遍历 AST 节点
function visitNode(node: ts.Node) {
  console.log(`Kind: ${ts.SyntaxKind[node.kind]}`);

  if (ts.isIdentifier(node)) {
    console.log(`Name: ${node.text}`);
  }

  ts.forEachChild(node, visitNode);
}

if (sourceFile) {
  ts.forEachChild(sourceFile, visitNode);
}
```

**使用 Compiler API 进行代码分析**

```typescript
import * as ts from "typescript";

// 分析文件中的所有函数
function analyzeFunctions(filePath: string): void {
  const sourceFile = ts.createSourceFile(
    filePath,
    ts.sys.readFile(filePath)!,
    ts.ScriptTarget.Latest,
    true
  );

  const functions: Array<{
    name: string;
    parameters: number;
    returnType: string;
  }> = [];

  function visit(node: ts.Node) {
    if (ts.isFunctionDeclaration(node) && node.name) {
      const symbol = checker.getSymbolAtLocation(node.name);
      const type = symbol && checker.getTypeOfSymbolAtLocation(symbol, node.name);
      const signatures = type?.getCallSignatures();

      functions.push({
        name: node.name.text,
        parameters: node.parameters.length,
        returnType: signatures?.[0]?.getReturnType().getText() ?? "void",
      });
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  console.log(functions);
}

// 使用 transformer 修改代码
function transformSource(
  source: string,
  transformer: ts.TransformerFactory<ts.SourceFile>
): string {
  const sourceFile = ts.createSourceFile(
    "input.ts",
    source,
    ts.ScriptTarget.Latest,
    true
  );

  const result = ts.transform([sourceFile], [transformer], {
    target: ts.ScriptTarget.ES2015,
    module: ts.ModuleKind.CommonJS,
  });

  const printer = ts.createPrinter();
  const output = printer.printFile(result.transformed[0]);

  result.dispose();

  return output;
}

// 示例：将所有 var 转换为 let
const varToLetTransformer: ts.TransformerFactory<ts.SourceFile> = () => {
  return (sourceFile) => {
    const visitor: ts.Visitor = (node) => {
      if (ts.isVariableStatement(node)) {
        // 检查是否是 var 声明
        const hasVarKeyword = node.declarationList.flags & ts.NodeFlags.Let;

        if (node.declarationList.flags & ts.NodeFlags.JSDocComment) {
          // 转换为 let 声明
          const newFlags = node.declarationList.flags & ~ts.NodeFlags.JSDocComment;
          return ts.factory.createVariableStatement(
            node.modifiers,
            ts.factory.createVariableDeclarationList(
              node.declarationList.declarations,
              newFlags,
              node.declarationList.flags & ~ts.NodeFlags.JSDocComment
            )
          );
        }
      }
      return ts.visitEachChild(node, visitor, context);
    };

    return ts.visitNode(sourceFile, visitor);
  };
};
```

### 8.2 TSLint vs ESLint

现代 TypeScript 项目推荐使用 ESLint 而非 TSLint。

**ESLint 与 TypeScript**

```typescript
// 1. 安装依赖
// npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin

// 2. ESLint 配置（eslint.config.js 或 .eslintrc）
/*
module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  rules: {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/consistent-type-imports": "error",
  },
};
*/

// 3. TypeScript 特定的 lint 规则
/*
@typescript-eslint/no-unused-vars    - 检查未使用的变量
@typescript-eslint/no-explicit-any  - 禁止使用 any 类型
@typescript-eslint/consistent-type-imports - 强制类型导入风格
@typescript-eslint/explicit-function-return-type - 要求函数有返回类型注解
@typescript-eslint/explicit-module-boundary-types - 要求导出函数有类型注解
@typescript-eslint/no-floating-promises - 禁止未处理的 Promise
@typescript-eslint/await-thenable - 只对返回可Await类型的表达式使用 await
*/
```

### 8.3 Babel vs TypeScript编译器

Babel 和 TypeScript 编译器都可以转译 TypeScript，但各有优缺点。

**Babel 与 TypeScript 的对比**

| 特性 | Babel | TypeScript 编译器 (tsc) |
|------|-------|------------------------|
| 类型检查 | 无（需要额外工具） | 原生支持 |
| 编译速度 | 快（单次传递） | 较慢（全类型检查） |
| 类型擦除 | 是 | 是 |
| 代码生成 | 优化 | 标准 |
| IDE 支持 | 有限 | 完整 |
| 构建时间 | 快 | 慢 |
| 增量编译 | 需配置 | 原生支持 |

**Babel 配置示例**

```javascript
// babel.config.js
module.exports = {
  presets: [
    ["@babel/preset-typescript", {
      isTSX: true,
      allExtensions: true,  // 处理所有 .ts 和 .tsx 文件
    }],
    ["@babel/preset-env", {
      targets: {
        browsers: ["> 1%", "last 2 versions"],
      },
    }],
  ],
  plugins: [
    // 添加装饰器支持（如果需要旧版装饰器）
    ["@babel/plugin-proposal-decorators", { legacy: true }],
  ],
};
```

**实际项目中的选择建议**

```typescript
// 1. 大型项目（>1000 文件）
// 推荐：tsc --incremental
// 原因：增量编译可以显著提升速度，原生类型检查确保安全

// 2. 小型项目或库
// 推荐：tsc 或 esbuild
// 原因：构建速度快，配置简单

// 3. 需要与 Babel 生态集成
// 推荐：@babel/preset-typescript
// 原因：可以复用 Babel 插件体系

// 4. Next.js 项目
// 推荐：next 默认配置（使用 tsc 配合 SWC）
// 原因：Next.js 已经优化了开发体验

// 5. 微前端项目
// 推荐：各子项目使用 tsc，主应用可用 Babel
// 原因：子项目独立构建，主应用灵活组合
```

### 8.4 实战：开发一个TS插件

开发一个 TypeScript 语言服务插件，添加自定义诊断。

```typescript
// TypeScript 语言服务插件开发

// 1. 插件接口定义
/*
interface TypeScriptPlugin {
  // 插件名称
  getLanguageService(): LanguageService;

  // 在某个时机被调用
  onConfigurationChanged?(configuration: any): void;
}
*/

// 2. 完整插件示例
import * as ts from "typescript";

export = function createPlugin(
  typescript: typeof ts,
  options: { maxVariables?: number; maxDepth?: number }
): ts.LanguageServicePlugin {
  options = options || {};
  const maxVariables = options.maxVariables || 50;
  const maxDepth = options.maxDepth || 10;

  return {
    name: "complexity-checker",

    // 诊断钩子
    getSemanticDiagnostics(fileName: string): ts.Diagnostic[] {
      const sourceFile = this.getLanguageService().getSourceFile(fileName);
      if (!sourceFile) return [];

      const diagnostics: ts.Diagnostic[] = [];
      let variableCount = 0;
      let maxSeenDepth = 0;

      function visit(node: ts.Node, depth: number) {
        // 统计变量声明
        if (ts.isVariableDeclaration(node)) {
          variableCount++;
          if (variableCount > maxVariables) {
            diagnostics.push({
              file: sourceFile,
              start: node.getStart(),
              length: node.getWidth(),
              messageText: `函数内变量数量（${variableCount}）超过了建议的最大值（${maxVariables}）`,
              category: ts.DiagnosticCategory.Warning,
              code: 9999,
            });
          }
        }

        // 追踪最大嵌套深度
        if (depth > maxSeenDepth) {
          maxSeenDepth = depth;
          if (depth > maxDepth) {
            diagnostics.push({
              file: sourceFile,
              start: node.getStart(),
              length: node.getWidth(),
              messageText: `嵌套深度（${depth}）超过了建议的最大值（${maxDepth}）`,
              category: ts.DiagnosticCategory.Warning,
              code: 9998,
            });
          }
        }

        ts.forEachChild(node, (child) => visit(child, depth + 1));
      }

      visit(sourceFile, 0);
      return diagnostics;
    },

    // 代码补全钩子
    getCompletionsAtPosition(
      fileName: string,
      position: number,
      options: ts.GetCompletionsAtPositionOptions
    ): ts.CompletionInfo | undefined {
      const languageService = this.getLanguageService();
      const completions = languageService.getCompletionsAtPosition(
        fileName,
        position,
        options
      );

      if (completions) {
        // 添加自定义注释
        completions.entries = completions.entries.map((entry) => ({
          ...entry,
          // 添加说明文档（如果有的话）
          documentation: entry.name.startsWith("_")
            ? "私有成员"
            : undefined,
        }));
      }

      return completions;
    },

    // 悬停信息钩子
    getQuickInfoAtPosition(
      fileName: string,
      position: number
    ): ts.QuickInfo | undefined {
      const languageService = this.getLanguageService();
      const quickInfo = languageService.getQuickInfoAtPosition(fileName, position);

      if (quickInfo) {
        // 扩展显示信息
        return {
          ...quickInfo,
          documentation: ts.displayPartsToString(quickInfo.documentation) +
            "\n\n[Complexity Checker 插件增强]",
        };
      }

      return quickInfo;
    },
  };
};

// 3. 插件配置
/*
在 tsconfig.json 中启用插件：

{
  "compilerOptions": {
    "plugins": [
      {
        "name": "complexity-checker",
        "maxVariables": 50,
        "maxDepth": 10
      }
    ]
  }
}
*/

// 4. 调试插件
// 在 VSCode 中打开 TypeScript 项目
// 使用 "TypeScript: Open TS Server Log" 查看日志
// 使用 "TypeScript: Restart TS Server" 重启服务器
```

---

## 9. 类型编程进阶

### 9.1 模板字面量类型

模板字面量类型是 TypeScript 4.1 引入的强大特性。

**模板字面量基础**

```typescript
// 1. 基本语法
type Greeting = `Hello, ${string}!`;

// 2. 具体字面量
type Direction = "north" | "south" | "east" | "west";
type CompassDirection = `${Direction}Direction`;
// = "northDirection" | "southDirection" | "eastDirection" | "westDirection"

// 3. 类型组合
type PropertyName = "firstName" | "lastName" | "age";
type Getters = `get${Capitalize<PropertyName>}`;
// = "getFirstName" | "getLastName" | "getAge"

type Setters = `set${Capitalize<PropertyName>}`;
// = "setFirstName" | "setLastName" | "setAge"

// 4. 内置字符串操作类型
type T1 = Uppercase<"hello">;         // "HELLO"
type T2 = Lowercase<"HELLO">;        // "hello"
type T3 = Capitalize<"hello">;       // "Hello"
type T4 = Uncapitalize<"Hello">;      // "hello"

// 5. 递归模板字面量
type DeepPath<T, Prefix extends string = ""> = T extends object
  ? {
      [K in keyof T & string]: Prefix extends ""
        ? DeepPath<T[K], K>
        : DeepPath<T[K], `${Prefix}.${K}`>
    }[keyof T & string]
  : Prefix;

interface Config {
  server: {
    port: number;
    host: string;
  };
  db: {
    connection: {
      url: string;
    };
  };
}

type T5 = DeepPath<Config>;
// = "server" | "server.port" | "server.host" | "db" | "db.connection" | "db.connection.url"

// 6. 模板字面量实现类型安全的 event
type EventName = "click" | "focus" | "blur";
type EventHandler<E extends EventName> = `on${Capitalize<E>}`;

type T6 = EventHandler<"click">;  // "onClick"
type Handlers = {
  [E in EventName as EventHandler<E>]?: () => void;
};
// = { onClick?: () => void; onFocus?: () => void; onBlur?: () => void; }
```

### 9.2 递归类型

递归类型允许定义自我引用的类型结构。

**递归类型详解**

```typescript
// 1. 简单递归：树结构
interface TreeNode<T> {
  value: T;
  children: TreeNode<T>[];
}

const tree: TreeNode<number> = {
  value: 1,
  children: [
    { value: 2, children: [] },
    {
      value: 3,
      children: [
        { value: 4, children: [] }
      ]
    }
  ]
};

// 2. 递归类型别名
type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

const json: JSONValue = {
  name: "张三",
  age: 25,
  hobbies: ["读书", "编程"],
  address: {
    city: "北京",
    zip: "100000"
  }
};

// 3. 深度只读
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

// 4. 深度可选
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

// 5. 深度必需
type DeepRequired<T> = {
  [K in keyof T]-?: T[K] extends object ? DeepRequired<T[K]> : T[K];
};

// 6. 展平数组
type Flatten<T extends any[]> = T extends [infer First, ...infer Rest]
  ? First extends any[]
    ? [...Flatten<First>, ...Flatten<Rest>]
    : [First, ...Flatten<Rest>]
  : [];

type T1 = Flatten<[1, [2, [3, 4]], 5]>;  // [1, 2, 3, 4, 5]

// 7. DeepFlatten - 深度展平
type DeepFlatten<T> = T extends (infer U)[]
  ? U extends (infer V)[]
    ? DeepFlatten<U>
    : U
  : T;

type T2 = DeepFlatten<string[][]>;  // string

// 8. 递归类型限制
// TypeScript 对递归深度有限制

type DeepPick<T, P extends string> =
  P extends `${infer Key}.${infer Rest}`
    ? Key extends keyof T
      ? { [K in Key]: DeepPick<T[K], Rest> }
      : never
    : P extends keyof T
      ? { [K in P]: T[K] }
      : never;

// 9. 无限列表（惰性求值模拟）
type Cons<H, T extends any[]> = [H, ...T];
type Take<N extends number, T extends any[], R extends any[] = []> =
  R["length"] extends N
    ? R
    : T extends [infer H, ...infer Rest]
      ? Take<N, Rest, [...R, H]>
      : R;

type T3 = Take<3, [1, 2, 3, 4, 5]>;  // [1, 2, 3]

// 10. 递归与条件类型
type UnionToTuple<T> =
  (T extends any ? (t: T) => T : never) extends (t: infer U) => any
    ? [...UnionToTuple<Exclude<T, U>>, U]
    : [];

type T4 = UnionToTuple<"a" | "b" | "c">;  // ["a", "b", "c"]
```

### 9.3 TypeScript类型级别的计算

类型级别的计算让 TypeScript 成为一门"类型编程语言"。

**类型级别的计算模型**

```typescript
// 1. 类型作为值：类型级别的"函数"

type Add<A extends number, B extends number> =
  [...{ length: A }, ...{ length: B }]["length"];

type T1 = Add<1, 2>;  // 3
type T2 = Add<5, 3>;  // 8

// 2. 布尔代数
type And<A extends boolean, B extends boolean> = A extends true ? B : false;
type Or<A extends boolean, B extends boolean> = A extends true ? true : B;
type Not<A extends boolean> = A extends true ? false : true;

type T3 = And<true, true>;   // true
type T4 = Or<false, true>;   // true
type T5 = Not<false>;        // true

// 3. 比较运算
type IsEqual<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2)
    ? true
    : false;

type T6 = IsEqual<1, 1>;      // true
type T7 = IsEqual<1, 2>;      // false
type T8 = IsEqual<"a", "a">;  // true

// 4. 条件逻辑
type If<C extends boolean, T, F> = C extends true ? T : F;

type T9 = If<true, "yes", "no">;   // "yes"
type T10 = If<false, "yes", "no">; // "no"

// 5. 列表操作
type Push<T extends any[], V> = [...T, V];
type Pop<T extends any[]> = T extends [...infer Rest, any] ? Rest : never;
type Shift<T extends any[]> = T extends [any, ...infer Rest] ? Rest : never;
type Unshift<T extends any[], V> = [V, ...T];

type T11 = Push<[1, 2], 3>;   // [1, 2, 3]
type T12 = Pop<[1, 2, 3]>;   // [1, 2]
type T13 = Shift<[1, 2, 3]>; // [2, 3]
type T14 = Unshift<[1, 2], 0>; // [0, 1, 2]

// 6. 长度运算
type Length<T extends any[]> = T["length"];

type T15 = Length<[1, 2, 3]>;  // 3

// 7. 索引访问
type ElementAt<T extends any[], I extends number> = T[I];

type T16 = ElementAt<[string, number, boolean], 0>;  // string
type T17 = ElementAt<[string, number, boolean], 1>;  // number

// 8. 类型级别的"循环"：通过递归模拟
type Times<N extends number, V, R extends any[] = []> =
  R["length"] extends N
    ? R
    : Times<N, V, [...R, V]>;

type T18 = Times<3, "x">;  // ["x", "x", "x"]

// 9. 最大公约数（欧几里得算法）
type GCD<A extends number, B extends number> =
  B extends 0 ? A : GCD<B, Mod<A, B>>;

type Mod<A extends number, B extends number> =
  Extract<Exclude<Range<A>, MultipleOf<B>>, number> extends infer R
    ? R extends number
      ? R
      : 0
    : 0;

type Range<N extends number, R extends any[] = []> =
  R["length"] extends N
    ? R
    : Range<N, [...R, R["length"]]>;

type MultipleOf<N extends number> = {
  [K in number]: K extends N ? never : K;
}[number];

type T19 = GCD<12, 8>;  // 4
```

### 9.4 实战：类型安全的API客户端

综合运用所学知识，构建一个类型安全的 API 客户端。

```typescript
// ===== 类型安全的 API 客户端 =====

// 1. API 定义
interface API {
  "/users": {
    GET: {
      query: { page?: number; limit?: number };
      response: { users: User[]; total: number };
    };
    POST: {
      body: { name: string; email: string };
      response: User;
    };
  };
  "/users/:id": {
    GET: {
      params: { id: string };
      response: User;
    };
    PUT: {
      params: { id: string };
      body: Partial<{ name: string; email: string }>;
      response: User;
    };
    DELETE: {
      params: { id: string };
      response: { success: boolean };
    };
  };
  "/posts": {
    GET: {
      query: { authorId?: string };
      response: { posts: Post[] };
    };
    POST: {
      body: { title: string; content: string; authorId: string };
      response: Post;
    };
  };
}

// 2. 类型安全的 HTTP 方法
type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

// 3. 提取路径参数
type ExtractParams<Path extends string> =
  Path extends `${string}:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof ExtractParams<`/${Rest}`>]: string }
    : Path extends `${string}:${infer Param}`
      ? { [K in Param]: string }
      : {};

type Params1 = ExtractParams<"/users/:id">;       // { id: string }
type Params2 = ExtractParams<"/posts/:postId/comments/:commentId">;
// { postId: string; commentId: string }

// 4. 提取 Query 参数
type ExtractQuery<Path extends string, APIEntry> =
  APIEntry extends { GET: { query: infer Q } }
    ? Q extends Record<string, any>
      ? { [K in keyof Q]?: Q[K] }
      : {}
    : {};

// 5. 提取 Body 类型
type ExtractBody<Path extends string, Method extends HTTPMethod, APIEntry> =
  Method extends keyof APIEntry
    ? APIEntry[Method] extends { body: infer B }
      ? B
      : {}
    : {};

// 6. 提取 Response 类型
type ExtractResponse<Path extends string, Method extends HTTPMethod, APIEntry> =
  Method extends keyof APIEntry
    ? APIEntry[Method] extends { response: infer R }
      ? R
      : never
    : never;

// 7. API 客户端类
class APIClient<API schema> {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async request<
    Path extends keyof API,
    Method extends HTTPMethod
  >(
    path: Path,
    method: Method,
    options?: {
      params?: ExtractParams<Path & string>;
      query?: any;
      body?: any;
    }
  ): Promise<ExtractResponse<Path & string, Method, API[Path]>> {
    // 构建 URL
    let url = `${this.baseUrl}${path}`;

    // 替换路径参数
    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        url = url.replace(`:${key}`, String(value));
      });
    }

    // 添加查询参数
    if (options?.query) {
      const searchParams = new URLSearchParams();
      Object.entries(options.query).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    // 发送请求
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // 为每个路径和方法生成类型安全的快捷方法
  get<Path extends keyof API>(
    path: Path,
    options?: { params?: ExtractParams<Path & string>; query?: any }
  ) {
    return this.request(path, "GET", options);
  }

  post<Path extends keyof API>(
    path: Path,
    options?: { params?: ExtractParams<Path & string>; body?: any }
  ) {
    return this.request(path, "POST", options);
  }

  put<Path extends keyof API>(
    path: Path,
    options?: { params?: ExtractParams<Path & string>; body?: any }
  ) {
    return this.request(path, "PUT", options);
  }

  delete<Path extends keyof API>(
    path: Path,
    options?: { params?: ExtractParams<Path & string> }
  ) {
    return this.request(path, "DELETE", options);
  }
}

// 8. 使用示例
interface User {
  id: string;
  name: string;
  email: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
}

// 创建 API 客户端实例
const api = new APIClient<API>("https://api.example.com");

// 类型安全的调用
async function demo() {
  // 获取用户列表
  const { users, total } = await api.get("/users", {
    query: { page: 1, limit: 10 }
  });
  // users: User[]
  // total: number

  // 获取单个用户
  const user = await api.get("/users/:id", {
    params: { id: "123" }
  });
  // user: User

  // 创建用户
  const newUser = await api.post("/users", {
    body: { name: "张三", email: "zhangsan@example.com" }
  });
  // newUser: User

  // 更新用户
  const updatedUser = await api.put("/users/:id", {
    params: { id: "123" },
    body: { name: "张三更新" }
  });
  // updatedUser: User

  // 删除用户
  const result = await api.delete("/users/:id", {
    params: { id: "123" }
  });
  // result: { success: boolean }

  // 编译时错误示例
  // await api.post("/users", { body: { name: 123 } });  // 错误：name 必须是 string
  // await api.get("/users/:id", { params: { userId: "123" } });  // 错误：参数名应为 id
}

// 9. 增强：添加拦截器支持
interface Interceptor {
  onRequest?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
  onResponse?: (response: Response) => Response | Promise<Response>;
  onError?: (error: Error) => Error | Promise<Error>;
}

interface RequestConfig {
  url: string;
  method: HTTPMethod;
  params?: Record<string, string>;
  query?: Record<string, any>;
  body?: any;
}

class EnhancedAPIClient<API schema> {
  private interceptors: Interceptor[] = [];

  addInterceptor(interceptor: Interceptor): void {
    this.interceptors.push(interceptor);
  }

  async request<Path extends keyof API, Method extends HTTPMethod>(
    path: Path,
    method: Method,
    options?: {
      params?: ExtractParams<Path & string>;
      query?: any;
      body?: any;
    }
  ): Promise<ExtractResponse<Path & string, Method, API[Path]>> {
    let config: RequestConfig = {
      url: `${this.baseUrl}${path}`,
      method,
      params: options?.params,
      query: options?.query,
      body: options?.body,
    };

    // 应用请求拦截器
    for (const interceptor of this.interceptors) {
      if (interceptor.onRequest) {
        config = await interceptor.onRequest(config);
      }
    }

    // 发送请求并处理响应...
    const response = await fetch(config.url, {
      method: config.method,
      body: config.body ? JSON.stringify(config.body) : undefined,
    });

    return response.json();
  }
}
```

---

## 10. 性能优化

### 10.1 项目引用：Project References

项目引用是管理大型 TypeScript 代码库的关键机制。

**项目引用详解**

```json
// 1. 基础项目引用配置
// tsconfig.json（主项目）
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "composite": true,           // 启用复合模式
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist"
  },
  "references": [
    { "path": "./packages/utils" },
    { "path": "./packages/core" },
    { "path": "./packages/api" }
  ]
}

// packages/utils/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist"
  }
}

// packages/core/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist"
  },
  "references": [
    { "path": "../utils" }
  ]
}
```

**项目引用的优势**

```bash
# 2. 构建命令
# 使用 --build 或 -b 标志启用项目引用的优化构建
npx tsc --build

# 3. 增量构建
# 只重新编译修改的项目及其依赖
npx tsc --build --verbose

# 4. 清理构建
npx tsc --build --clean

# 5. 监视模式
npx tsc --build --watch
```

### 10.2 增量编译：incremental

增量编译可以显著提升大型项目的编译速度。

**增量编译配置**

```json
// tsconfig.json
{
  "compilerOptions": {
    "incremental": true,              // 启用增量编译
    "tsBuildInfoFile": ".tsbuildinfo" // 指定缓存文件位置
  }
}

// .tsbuildinfo 文件示例内容
/*
{
  "fileIds": ["src/index.ts", "src/utils.ts"],
  "fileNames": ["/path/to/project/src/index.ts", ...],
  "fileHashMap": {
    "src/index.ts": "abc123..."
  },
  "version": "5.0",
  "buildInfo": {
    "compilerOptions": {...},
    "fileIds": [...]
  },
  "lastChangedBuildTime": "2024-01-01T00:00:00.000Z"
}
*/
```

**增量编译的工作原理**

```typescript
// 1. 构建缓存
// TypeScript 保存上次构建的完整信息到 .tsbuildinfo 文件

// 2. 修改检测
// - 文件内容哈希变化
// - 文件添加/删除
// - 编译选项变化

// 3. 依赖图分析
// 确定哪些文件需要重新编译
// 从修改的文件向上追溯所有依赖

// 4. 增量发射
// 只对修改的文件重新生成代码
// 利用已有的 .d.ts 和 .map 文件
```

### 10.3 构建缓存：build模式

`tsc --build` 模式提供了完整的构建缓存管理。

**构建缓存最佳实践**

```bash
# 1. 初始构建
npx tsc --build

# 2. 增量构建（后续调用）
npx tsc --build  # 只会编译修改的文件

# 3. 强制完整重建
npx tsc --build --force

# 4. 显示构建信息
npx tsc --build --verbose

# 5. 并行构建（项目引用）
npx tsc --build --verbose --parallel

# 6. 清理构建产物
npx tsc --build --clean
```

**缓存失效场景**

```typescript
// 以下情况会导致缓存失效：

// 1. 修改了 .tsbuildinfo 文件
// 2. 修改了 tsconfig.json
// 3. 修改了 project references
// 4. 使用了 --force 标志
// 5. 删除了 .tsbuildinfo 文件
```

### 10.4 我的思考：TypeScript编译太慢了怎么办

**编译性能优化策略**

```typescript
// 1. skipLibCheck - 最重要的优化
{
  "compilerOptions": {
    "skipLibCheck": true  // 跳过 node_modules 中 .d.ts 的类型检查
    // 节省 30-50% 的编译时间
  }
}

// 2. 合理的项目结构
// 将大型项目拆分为多个子项目

// project/
//   tsconfig.json (根配置)
//   packages/
//     shared/      # 被多个包共享的代码
//     utils/       # 工具函数
//     core/        # 核心逻辑
//     features/    # 功能模块
//   apps/
//     web/
//     mobile/

// 3. 避免深层嵌套的依赖
// 使用项目引用而非深度嵌套的相对导入

// 4. 使用 swc 或 esbuild 加速开发构建
// npm install -D @swc/types

// 5. 监视模式的优化
{
  "watchOptions": {
    "watchFile": "useFsEvents",    // 使用系统事件监视
    "watchDirectory": "useFsEvents", // 监视目录
    "excludeDirectories": ["node_modules", "dist", "build"]
  }
}

// 6. 类型检查的渐进式
// 将严格检查分解为多个阶段

// 7. 使用 selective imports
// 只导入需要的类型，而非整个模块

// 错误
import { something } from "huge-module";

// 正确（如果只需要类型）
import type { something } from "huge-module";

// 8. 减少类型推断的复杂性
// 避免过多的嵌套条件类型
// 使用类型别名简化复杂表达式

type Complex =
  | { type: "a"; value: string }
  | { type: "b"; value: number }
  | { type: "c"; value: boolean };

// 9. 延迟类型计算
// 将复杂类型计算结果缓存

type Cached<T> = T extends infer U ? { value: U; timestamp: number } : never;

// 10. 合理使用 any vs unknown
// 对外部数据使用 unknown，然后收窄
// 避免 any 导致的额外类型检查开销

// 11. 监视模式 vs 全量构建
// 开发时使用 --watch + skipLibCheck
// CI/CD 中使用完整构建

// 12. 并行构建配置
{
  "compilerOptions": {
    "assumeChangesOnlyAffectDirectDependencies": true
    // 假设文件修改只影响直接依赖，加速监视模式
  }
}

// 13. 使用 Build Mode 的最佳实践
npx tsc --build --verbose --parallel

// 14. 分析编译性能
npx tsc --build --verbose 2>&1 | grep "Compiling"

# 输出示例：
# Compiling: src/index.ts [1/100]
# Compiling: src/utils.ts [2/100]
# ...
```

---

## 总结

TypeScript 的底层原理涵盖编译器架构、类型系统、编译原理和高级类型操作等多个维度。掌握这些知识，不仅能让你更好地使用 TypeScript，还能为前端工程化、性能优化和工具开发奠定坚实基础。

**核心要点回顾：**

1. **编译器五阶段**：Scanner → Parser → Binder → Checker → Emitter
2. **结构化类型系统**：基于"结构兼容"而非"名称匹配"
3. **泛型的本质**：类型参数化，编译时多态
4. **条件类型**：编译时的条件逻辑，通过分发处理联合类型
5. **映射类型**：批量转换对象属性结构
6. **性能优化**：项目引用、增量编译、合理配置

**持续学习建议：**

- 阅读 TypeScript 官方源码（GitHub: microsoft/TypeScript）
- 关注 TypeScript 团队博客和 TC39 提案
- 在实际项目中应用高级类型技巧
- 参与开源 TypeScript 工具开发

---

*本文档基于 TypeScript 5.x 编写，部分特性可能需要更高版本支持*
*最后更新：2026年4月*
