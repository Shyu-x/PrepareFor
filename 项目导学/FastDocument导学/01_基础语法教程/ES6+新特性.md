# ES6+ 新特性与项目应用

## 目录

1. 模板字符串
2. 解构赋值
3. 展开运算符与剩余参数
4. 箭头函数
5. 模块化
6. Promise 与 async/await
7. 可选链与空值合并
8. BigInt 与 Symbol

---

## 1. 模板字符串

### 1.1 基本用法

```typescript
// 传统拼接
const url = API_URL + '/documents/' + docId;

// 模板字符串
const url = `${API_URL}/documents/${docId}`;
```

### 1.2 项目中的实际应用

**示例：构建 API URL** (`lib/api.ts`)

```typescript
// 动态构建 URL
const buildURL = (endpoint: string, params?: Record<string, string>) => {
  const url = new URL(endpoint);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  return url.toString();
};

// 使用模板字符串构建消息
const formatMessage = (user: string, action: string) => {
  return `${user} ${action} at ${new Date().toLocaleTimeString()}`;
};
```

**示例：动态类名** (`components/Block.tsx`)

```typescript
// 使用模板字符串动态生成类名
const blockClassName = `block block-${type} ${isActive ? 'active' : ''}`;

// 条件类名组合
const classes = `
  editor-block
  ${isSelected ? 'selected' : ''}
  ${isDragging ? 'dragging' : ''}
  ${isExpanded ? 'expanded' : 'collapsed'}
`.trim().replace(/\s+/g, ' ');
```

---

## 2. 解构赋值

### 2.1 数组解构

```typescript
// 基本数组解构
const [first, second] = [1, 2, 3];
// first = 1, second = 2

// 跳过元素
const [first, , third] = [1, 2, 3];
// first = 1, third = 3

// 剩余模式
const [first, ...rest] = [1, 2, 3, 4];
// first = 1, rest = [2, 3, 4]

// 默认值
const [a, b = 10] = [1];
// a = 1, b = 10
```

### 2.2 对象解构

```typescript
// 基本对象解构
const { name, age } = { name: 'John', age: 30 };

// 重命名
const { name: userName, age: userAge } = { name: 'John', age: 30 };
// userName = 'John', userAge = 30

// 默认值
const { name, role = 'user' } = { name: 'John' };
// name = 'John', role = 'user'

// 嵌套解构
const { data: { user: { profile } } } = response;
```

### 2.3 项目中的应用

**示例 1：React Hook 返回值**

```typescript
// useState 解构
const [state, setState] = useState(initialValue);

// useEffect 解构
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [data, setData] = useState<Data[]>([]);
```

**示例 2：API 响应处理**

```typescript
// 从响应中提取数据
const handleResponse = async (response: Response) => {
  const { success, data, message } = await response.json();

  if (!success) {
    throw new Error(message);
  }

  return data;
};
```

**示例 3：Zustand Store 状态**

```typescript
// 从 store 提取状态
const { documents, currentDoc, blocks } = useDocumentStore();
```

---

## 3. 展开运算符与剩余参数

### 3.1 展开运算符 (...)

```typescript
// 数组展开
const arr1 = [1, 2, 3];
const arr2 = [...arr1, 4, 5];
// arr2 = [1, 2, 3, 4, 5]

// 对象展开
const obj1 = { a: 1, b: 2 };
const obj2 = { ...obj1, c: 3 };
// obj2 = { a: 1, b: 2, c: 3 }

// 函数参数展开
const numbers = [1, 2, 3, 4, 5];
Math.max(...numbers);  // 5
```

### 3.2 剩余参数 (...rest)

```typescript
// 收集剩余参数
function sum(a, b, ...rest) {
  return a + b + rest.reduce((acc, n) => acc + n, 0);
}

sum(1, 2, 3, 4, 5);  // 15
```

### 3.3 项目中的应用

**示例 1：状态更新** (`store/documentStore.ts`)

```typescript
// 添加块 - 数组展开
addBlock: (block) => set((state) => ({
  blocks: [...state.blocks, block]
})),

// 更新块 - 对象展开
updateBlock: (id, updates) => set((state) => ({
  blocks: state.blocks.map(b =>
    b.id === id ? { ...b, ...updates } : b
  )
})),

// 删除块
removeBlock: (id) => set((state) => ({
  blocks: state.blocks.filter(b => b.id !== id)
})),
```

**示例 2：表单数据收集**

```typescript
// 收集表单数据
const handleSubmit = (e: FormEvent) => {
  e.preventDefault();
  const formData = new FormData(e.target as HTMLFormElement);
  const data = Object.fromEntries(formData);
  // formData 本身是可迭代的
};
```

---

## 4. 箭头函数

### 4.1 基本语法

```typescript
// 有参数
const add = (a, b) => a + b;

// 无参数
const getRandom = () => Math.random();

// 单参数（可省略括号）
const double = x => x * 2;

// 多行函数体
const process = (data) => {
  const result = transform(data);
  return result;
};
```

### 4.2 箭头函数的特点

1. **词法 this**：继承外层作用域的 this
2. **不能用作构造函数**：不能使用 new
3. **没有 arguments**：使用剩余参数替代

### 4.3 项目中的应用

**示例 1：数组方法回调**

```typescript
// filter
const activeBlocks = blocks.filter(block => block.status === 'active');

// map
const blockIds = blocks.map(block => block.id);

// find
const targetBlock = blocks.find(block => block.id === targetId);

// sort
const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

// reduce
const blockCount = blocks.reduce((acc, block) => acc + 1, 0);
```

**示例 2：事件处理**

```typescript
// React 事件处理
const handleClick = (e: MouseEvent) => {
  e.preventDefault();
  console.log('Clicked');
};

// 防抖函数
const debounce = (fn: Function, delay: number) => {
  let timer: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};
```

**示例 3：Zustand Store**

```typescript
// 创建 store 时的箭头函数
const useDocumentStore = create((set, get) => ({
  blocks: [],

  // 方法定义
  addBlock: (block) => set((state) => ({
    blocks: [...state.blocks, block]
  })),

  // 带逻辑的方法
  updateBlock: (id, content) => {
    const { blocks } = get();
    const newBlocks = blocks.map(b =>
      b.id === id ? { ...b, content } : b
    );
    set({ blocks: newBlocks });
  }
}));
```

---

## 5. 模块化

### 5.1 导出方式

**命名导出**

```typescript
// 方式1：声明时导出
export const API_URL = '/api';
export function generateId() { }

// 方式2：统一导出
const API_URL = '/api';
function generateId() { }
export { API_URL, generateId };

// 导出时重命名
export { API_URL as BASE_URL, generateId as createId };
```

**默认导出**

```typescript
// lib/api.ts
export default api;

// 导入
import api from '@/lib/api';
```

### 5.2 项目中的模块化实践

**示例：工具函数模块化** (`lib/utils.ts`)

```typescript
// 导出多个工具函数
export function generateId(): string { }
export function formatDate(date: Date): string { }
export function debounce<T extends Function>(fn: T, delay: number): T { }

// 导出类型
export type { Block, Document, BlockType };
```

---

## 6. Promise 与 async/await

### 6.1 Promise 基础

```typescript
// 创建 Promise
const promise = new Promise((resolve, reject) => {
  if (condition) {
    resolve(data);
  } else {
    reject(error);
  }
});

// Promise 方法
promise
  .then(data => console.log(data))
  .catch(error => console.error(error))
  .finally(() => console.log('Done'));
```

### 6.2 async/await

```typescript
// async 函数
async function fetchData() {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
```

### 6.3 项目中的应用

**示例：API 调用封装** (`lib/api.ts`)

```typescript
class APIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
}

export const api = new APIClient('/api');
```

**示例：并行请求**

```typescript
// 同时获取多个资源
async function loadDocumentData(docId: string) {
  const [doc, blocks, comments] = await Promise.all([
    api.get(`/documents/${docId}`),
    api.get(`/documents/${docId}/blocks`),
    api.get(`/documents/${docId}/comments`)
  ]);

  return { doc, blocks, comments };
}

// Promise.race - 超时处理
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), ms)
  );
  return Promise.race([promise, timeout]);
}
```

---

## 7. 可选链与空值合并

### 7.1 可选链 (?.)

```typescript
// 访问深层属性
const city = user?.profile?.address?.city;

// 调用可能不存在的方法
const result = user?.getName?.();

// 访问可能不存在的数组元素
const first = items?.[0];
```

### 7.2 空值合并 (??)

```typescript
// ?? 只对 null/undefined 生效
const value = null ?? 'default';  // 'default'
const value = 0 ?? 'default';     // 0
const value = '' ?? 'default';   // ''

// || 对所有假值生效
const value = null || 'default'; // 'default'
const value = 0 || 'default';    // 'default'
```

### 7.3 项目中的应用

**示例：安全访问数据**

```typescript
// 可选链访问
const userName = user?.name ?? 'Anonymous';
const blockContent = block?.content ?? '';
const documentTitle = document?.metadata?.title ?? 'Untitled';

// 条件渲染
{user?.isActive && <ActiveIndicator />}

// 回调安全调用
onClick?.();
```

---

## 8. BigInt 与 Symbol

### 8.1 BigInt

```typescript
// 大整数
const bigNumber = 9007199254740991n;

// 运算
const result = bigNumber + 1n;

// 安全整数判断
Number.isSafeInteger(9007199254740991);  // false
```

### 8.2 Symbol

```typescript
// 创建唯一标识
const uniqueId = Symbol('documentId');
const obj = {
  [uniqueId]: '12345'
};

// 常用场景：对象属性键
const keys = {
  NAME: Symbol('name'),
  EMAIL: Symbol('email')
};
```

---

## 9. 总结

ES6+ 为现代 JavaScript 开发提供了强大的语法支持：

| 特性 | 用途 | 项目中的应用 |
|------|------|------------|
| 模板字符串 | 字符串拼接 | 动态类名、URL 构建 |
| 解构赋值 | 数据提取 | React Hooks、API 响应 |
| 展开运算符 | 数组/对象操作 | 状态更新、浅拷贝 |
| 箭头函数 | 回调、事件处理 | 数组方法、事件绑定 |
| async/await | 异步编程 | API 调用、数据获取 |
| 可选链 | 安全访问 | 数据处理、防御性编程 |
| 空值合并 | 默认值 | 配置处理、默认值设置 |

这些特性在 FastDocument 项目中被广泛使用，使代码更加简洁、可读和健壮。
