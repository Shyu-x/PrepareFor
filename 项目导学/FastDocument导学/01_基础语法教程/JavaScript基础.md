# JavaScript 基础语法与项目应用

## 目录

1. 变量声明与作用域
2. 函数定义与调用
3. 数组与对象操作
4. 异步编程 Promise 与 async/await
5. 模块化导入导出
6. 装饰器与注解

---

## 1. 变量声明与作用域

### 1.1 const、let、var 的选择

在 FastDocument 项目中，严格遵循以下规则：

```typescript
// ✅ 使用 const：值不会被重新赋值的场景
const API_URL = "/documents";           // 常量
const generateId = () => crypto.randomUUID();  // 函数引用

// ✅ 使用 let：值会被重新赋值的场景
let currentDoc: Document | null = null;
let blockCount = 0;

// ❌ 避免使用 var：没有块级作用域
// var legacyCode = "避免使用";  // 不推荐
```

### 1.2 项目中的实际应用

**示例 1：Store 中的状态声明** (`store/documentStore.ts`)

```typescript
// 常量定义 - 使用 const
const API_URL = "/documents";

// 状态声明 - 使用 let 因为会被更新
let documents: Document[] = [];
let currentDoc: Document | null = null;
let blocks: Block[] = [];
```

**示例 2：类型定义中的只读属性** (`types/architecture.ts`)

```typescript
// 接口属性默认是只读的
interface DocumentState {
  // 读取时使用 const 语义
  readonly id: string;
  readonly createdAt: number;
  // 可变属性
  title: string;
  content: string;
}
```

### 1.3 块级作用域与闭包

**示例：循环中的闭包问题** (`components/Editor.tsx`)

```typescript
// ✅ 正确：使用 let 绑定块级作用域
blocks.forEach((block, index) => {
  // 每次循环都有独立的 index 变量
  console.log(`Block ${index}: ${block.type}`);
});

// ❌ 错误：使用 var 会导致闭包问题
// for (var i = 0; i < blocks.length; i++) {
//   setTimeout(() => console.log(blocks[i]), 100); // i 永远是最后一个值
// }
```

---

## 2. 函数定义与调用

### 2.1 函数声明方式

**方式一：函数声明** - 会被提升

```typescript
// 函数声明 - 可以在定义前调用
function generateId(): string {
  return crypto.randomUUID();
}
```

**方式二：函数表达式** - 不会被提升

```typescript
// 函数表达式 - 必须在定义后调用
const generateId = function(): string {
  return crypto.randomUUID();
};
```

**方式三：箭头函数** - 保持 this 上下文

```typescript
// 箭头函数 - 常用作回调
const handleBlockAdd = (block: Block) => {
  setBlocks([...blocks, block]);
};

// 单行箭头函数 - 隐式返回
const getBlockCount = (blocks: Block[]) => blocks.length;
```

### 2.2 项目中的箭头函数应用

**示例 1：数组方法的回调** (`lib/utils.ts`)

```typescript
// 数组过滤
const activeBlocks = blocks.filter(block => block.type !== 'deleted');

// 数组映射
const blockIds = blocks.map(block => block.id);

// 数组排序
const sortedBlocks = [...blocks].sort((a, b) => (a.order || 0) - (b.order || 0));

// 数组查找
const firstHeading = blocks.find(block => block.type.startsWith('h'));
```

**示例 2：对象方法简写** (`store/documentStore.ts`)

```typescript
// 对象方法简写
export const useDocumentStore = create<DocumentState>()(
  persist(
    (set, get) => ({
      // 方法定义
      setCurrentDoc: (doc) => set({ currentDoc: doc }),

      addBlock: (block) => set((state) => ({
        blocks: [...state.blocks, block]
      })),

      updateBlock: (id, content) => set((state) => ({
        blocks: state.blocks.map(b =>
          b.id === id ? { ...b, content } : b
        )
      })),
    }),
    // 配置...
  )
);
```

### 2.3 默认参数与剩余参数

```typescript
// 默认参数
function createBlock(type: BlockType = 'text', content: string = ''): Block {
  return {
    id: generateId(),
    type,
    content
  };
}

// 剩余参数
function mergeBlocks(...blocks: Block[]): Block[] {
  return blocks.reduce((acc, block) => [...acc, block], []);
}
```

---

## 3. 数组与对象操作

### 3.1 数组操作在项目中的应用

**示例：文档块管理** (`store/documentStore.ts`)

```typescript
// 添加块
addBlock: (block) => set((state) => ({
  blocks: [...state.blocks, block]  // 展开运算符
})),

// 删除块
removeBlock: (id) => set((state) => ({
  blocks: state.blocks.filter(b => b.id !== id)  // filter
})),

// 更新块
updateBlock: (id, updates) => set((state) => ({
  blocks: state.blocks.map(b =>
    b.id === id ? { ...b, ...updates } : b  // map + 展开
  )
})),

// 排序块
reorderBlocks: (fromIndex, toIndex) => set((state) => {
  const newBlocks = [...state.blocks];
  const [removed] = newBlocks.splice(fromIndex, 1);
  newBlocks.splice(toIndex, 0, removed);
  return { blocks: newBlocks };
}),
```

### 3.2 对象操作

**示例：浅拷贝与深拷贝**

```typescript
// 浅拷贝 - 展开运算符
const updatedBlock = { ...block, content: 'new content' };

// 深拷贝 - 用于复杂对象
const clonedBlocks = JSON.parse(JSON.stringify(blocks));

// 对象合并
const defaultProps = { type: 'text', order: 0 };
const blockProps = { ...defaultProps, ...customProps };
```

### 3.3 解构赋值

**示例：React Hook 返回值**

```typescript
// 数组解构
const [blocks, setBlocks] = useState<Block[]>([]);
const [loading, setLoading] = useState(false);

// 对象解构
const { id, type, content } = block;

// 带默认值的解构
const { properties = {} } = block;

// 重命名
const { id: blockId, type: blockType } = block;

// 嵌套解构
const { data: { user: { name } } } = response;
```

---

## 4. 异步编程 Promise 与 async/await

### 4.1 项目中的异步模式

**示例 1：API 调用** (`lib/api.ts`)

```typescript
// 使用 async/await
async function fetchDocuments(): Promise<Document[]> {
  try {
    const response = await fetch(`${API_URL}/documents`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch documents:', error);
    throw error;
  }
}

// 并行请求
async function fetchDocumentWithBlocks(docId: string) {
  const [doc, blocks] = await Promise.all([
    fetch(`${API_URL}/documents/${docId}`).then(r => r.json()),
    fetch(`${API_URL}/documents/${docId}/blocks`).then(r => r.json())
  ]);
  return { doc, blocks };
}
```

**示例 2：Zustand 中的异步操作** (`store/documentStore.ts`)

```typescript
// 异步 actions
fetchDocuments: async () => {
  try {
    set({ loading: true });
    const response = await fetch('/api/documents');
    const documents = await response.json();
    set({ documents, loading: false });
  } catch (error) {
    set({ error: error.message, loading: false });
  }
},

// 保存文档
saveDocument: async (doc: Document) => {
  try {
    await fetch(`/api/documents/${doc.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc)
    });
  } catch (error) {
    console.error('Save failed:', error);
  }
}
```

### 4.2 Promise 链式调用

```typescript
// 链式调用
fetchDocument(id)
  .then(doc => processDocument(doc))
  .then(processed => saveDocument(processed))
  .then(() => showSuccessMessage())
  .catch(error => handleError(error))
  .finally(() => setLoading(false));
```

### 4.3 错误处理模式

```typescript
// Try-catch 包装
async function safeOperation() {
  try {
    const result = await riskyOperation();
    return result;
  } catch (error) {
    // 区分错误类型
    if (error instanceof NetworkError) {
      // 处理网络错误
    } else if (error instanceof ValidationError) {
      // 处理验证错误
    } else {
      // 处理其他错误
    }
    throw error; // 重新抛出以便上游处理
  }
}
```

---

## 5. 模块化导入导出

### 5.1 项目中的导入模式

**默认导入**

```typescript
// lib/api.ts
export default api;
// other file
import api from '@/lib/api';
```

**命名导入**

```typescript
// 单一导入
import { generateId } from '@/lib/utils';

// 多个导入
import { generateId, formatDate, debounce } from '@/lib/utils';

// 导入并重命名
import { generateId as createUniqueId } from '@/lib/utils';

// 导入所有
import * as utils from '@/lib/utils';
```

**类型导入** (TypeScript)

```typescript
// 导入类型
import type { Block, Document, BlockType } from '@/types';

// 导入值和类型
import { useState, useEffect } from 'react';
import type { FC, CSSProperties } from 'react';
```

### 5.2 项目路径别名配置

**tsconfig.json 配置**

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**使用示例**

```typescript
// 使用 @ 别名
import { generateId } from '@/lib/utils';
import { useDocumentStore } from '@/store/documentStore';
import type { Block } from '@/types/architecture';
```

---

## 6. 装饰器与注解 (TypeScript)

### 6.1 装饰器基础

**类装饰器**

```typescript
// 简单装饰器
function LogClass(target: Function) {
  console.log(`Class ${target.name} defined`);
  return target;
}

@LogClass
class DocumentService {
  // ...
}
```

### 6.2 NestJS 中的装饰器应用

**路由装饰器** (`auth/auth.controller.ts`)

```typescript
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.validateUser(loginDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req) {
    return req.user;
  }
}
```

**自定义装饰器**

```typescript
// 提取用户信息
export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);

// 使用
@Get('profile')
getProfile(@GetUser() user: User) {
  return user;
}
```

---

## 7. 常见错误与最佳实践

### 7.1 常见错误

```typescript
// ❌ 错误：修改 state 直接
blocks.push(newBlock);  // 违反了不可变性

// ✅ 正确：创建新数组
setBlocks([...blocks, newBlock]);

// ❌ 错误：忘记 await
const data = fetchData();  // data 是 Promise，不是数据

// ✅ 正确：使用 await
const data = await fetchData();

// ❌ 错误：在循环中使用 await（顺序执行）
for (const item of items) {
  await processItem(item);  // 效率低
}

// ✅ 正确：并行执行
await Promise.all(items.map(item => processItem(item)));
```

### 7.2 最佳实践

1. **优先使用 const**：避免意外修改
2. **使用箭头函数**：保持 this 上下文
3. **使用 async/await**：代码更易读
4. **正确处理错误**：always try-catch
5. **不可变性**：始终创建新对象/数组
6. **类型标注**：为函数参数和返回值添加类型
