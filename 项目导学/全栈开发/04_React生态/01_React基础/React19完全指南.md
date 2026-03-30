# React 19 完全指南

## 一、React 19 概述

React 19 是 React 团队于 2024 年发布的重大版本更新，引入了多项革命性特性，标志着 React 从纯客户端框架向全栈框架的演进。

### 1.1 核心新特性

| 特性 | 说明 | 重要性 |
|------|------|--------|
| **Server Components** | 服务端组件，在服务器上渲染组件 | ⭐⭐⭐⭐⭐ |
| **Server Actions** | 服务端操作，直接在服务端执行函数 | ⭐⭐⭐⭐⭐ |
| **use() Hook** | 统一的异步数据获取 Hook | ⭐⭐⭐⭐⭐ |
| **useFormStatus** | 表单状态管理 Hook | ⭐⭐⭐⭐ |
| **useOptimistic** | 乐观更新 Hook | ⭐⭐⭐⭐ |
| **useActionState** | Action 状态管理 Hook | ⭐⭐⭐⭐ |
| **React Compiler** | 自动记忆化编译器 | ⭐⭐⭐⭐⭐ |
| **Document Metadata** | 文档元数据支持 | ⭐⭐⭐ |
| **Stylesheets** | 样式表支持 | ⭐⭐⭐ |
| **Suspense 增强** | 更强大的异步渲染 | ⭐⭐⭐⭐ |

---

## 二、Server Components（服务端组件）

### 2.1 概念解析

Server Components（服务端组件）是一种在服务器端渲染的 React 组件，它们：

- **不会被打包到客户端 JavaScript 中**
- **可以直接访问服务端资源**（数据库、文件系统等）
- **零客户端 JavaScript 开销**
- **支持流式渲染**

### 2.2 服务端组件 vs 客户端组件

| 特性 | 服务端组件 | 客户端组件 |
|------|----------|----------|
| 渲染位置 | 服务器 | 浏览器 |
| JavaScript 打包 | 不打包 | 打包到客户端 |
| 访问数据库 | ✅ 可以 | ❌ 不可以 |
| 使用 Hooks | ❌ 不可以 | ✅ 可以 |
| 使用事件处理 | ❌ 不可以 | ✅ 可以 |
| 使用 useState | ❌ 不可以 | ✅ 可以 |
| 使用 useEffect | ❌ 不可以 | ✅ 可以 |
| 访问文件系统 | ✅ 可以 | ❌ 不可以 |

### 2.3 服务端组件示例

```tsx
// ✅ 服务端组件（默认）
// 此组件在服务器上渲染，不会增加客户端包大小

// 直接从数据库获取数据
async function ProductList() {
  // 可以直接访问数据库
  const products = await db.products.findMany();
  
  return (
    <ul>
      {products.map(product => (
        <li key={product.id}>
          <h2>{product.name}</h2>
          <p>价格: ¥{product.price}</p>
        </li>
      ))}
    </ul>
  );
}

// 使用 Suspense 包裹异步组件
function ProductsPage() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <ProductList />
    </Suspense>
  );
}
```

### 2.4 客户端组件示例

```tsx
// 'use client' 指令标记为客户端组件
'use client';

import { useState } from 'react';

// 客户端组件可以使用状态和事件处理
function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>计数: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        增加
      </button>
    </div>
  );
}
```

### 2.5 组合模式

```tsx
// 服务端组件可以导入客户端组件
import Counter from './Counter';

// 服务端组件
async function Dashboard() {
  const data = await fetchDashboardData();
  
  return (
    <div>
      {/* 服务端渲染的数据 */}
      <h1>{data.title}</h1>
      
      {/* 客户端交互组件 */}
      <Counter />
      
      {/* 传递数据给客户端组件 */}
      <ClientComponent initialData={data.items} />
    </div>
  );
}
```

---

## 三、Server Actions（服务端操作）

### 3.1 概念解析

Server Actions 是在服务器上执行的函数，可以直接在组件中定义和调用，无需创建 API 路由。

### 3.2 基础用法

```tsx
// 服务端操作定义
async function submitForm(formData: FormData) {
  'use server'; // 标记为服务端操作
  
  const name = formData.get('name');
  const email = formData.get('email');
  
  // 直接操作数据库
  await db.users.create({
    data: { name, email }
  });
  
  // 重新验证缓存
  revalidatePath('/users');
}

// 在表单中使用
function CreateUserForm() {
  return (
    <form action={submitForm}>
      <input name="name" placeholder="姓名" required />
      <input name="email" type="email" placeholder="邮箱" required />
      <button type="submit">创建用户</button>
    </form>
  );
}
```

### 3.3 在客户端组件中调用

```tsx
'use client';

import { useFormStatus } from 'react-dom';
import { submitOrder } from './actions';

// 提交按钮组件
function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button type="submit" disabled={pending}>
      {pending ? '提交中...' : '提交订单'}
    </button>
  );
}

// 订单表单
export function OrderForm() {
  return (
    <form action={submitOrder}>
      <input name="productId" required />
      <input name="quantity" type="number" required />
      <SubmitButton />
    </form>
  );
}
```

### 3.4 带返回值的 Server Action

```tsx
// 服务端操作
async function updateUser(formData: FormData) {
  'use server';
  
  const id = formData.get('id');
  const name = formData.get('name');
  
  try {
    const user = await db.users.update({
      where: { id },
      data: { name }
    });
    
    return { success: true, user };
  } catch (error) {
    return { success: false, error: '更新失败' };
  }
}

// 客户端调用
'use client';

function UpdateUserForm({ user }) {
  const [result, formAction] = useActionState(updateUser, null);
  
  return (
    <form action={formAction}>
      <input name="id" type="hidden" value={user.id} />
      <input name="name" defaultValue={user.name} />
      <button type="submit">更新</button>
      
      {result && (
        <p className={result.success ? 'success' : 'error'}>
          {result.success ? '更新成功' : result.error}
        </p>
      )}
    </form>
  );
}
```

---

## 四、use() Hook

### 4.1 概念解析

`use()` 是 React 19 引入的新 Hook，用于统一处理 Promise 和 Context，可以在组件内部直接读取异步值。

### 4.2 读取 Promise

```tsx
import { use } from 'react';

// 获取数据的函数
function fetchUser(id: string) {
  return fetch(`/api/users/${id}`).then(res => res.json());
}

// 使用 use() 读取 Promise
function UserProfile({ userPromise }) {
  // use() 会自动处理 Promise
  // 当 Promise pending 时，最近的 Suspense 会显示 fallback
  const user = use(userPromise);
  
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

// 父组件传递 Promise
function UserPage({ userId }) {
  // 在父组件创建 Promise
  const userPromise = fetchUser(userId);
  
  return (
    <Suspense fallback={<div>加载用户信息...</div>}>
      <UserProfile userPromise={userPromise} />
    </Suspense>
  );
}
```

### 4.3 读取 Context

```tsx
import { use, createContext } from 'react';

// 创建 Context
const ThemeContext = createContext('light');

// 使用 use() 读取 Context
function ThemedButton() {
  // use() 可以替代 useContext()
  const theme = use(ThemeContext);
  
  return (
    <button className={`btn btn-${theme}`}>
      主题按钮
    </button>
  );
}

// use() 可以在条件语句中使用（与 useContext 不同）
function ConditionalComponent({ showTheme }) {
  if (showTheme) {
    // ✅ use() 可以在条件中使用
    const theme = use(ThemeContext);
    return <div>当前主题: {theme}</div>;
  }
  return <div>无主题</div>;
}
```

### 4.4 错误处理

```tsx
import { use, ErrorBoundary } from 'react';

function UserProfile({ userPromise }) {
  const user = use(userPromise);
  
  return (
    <div>
      <h1>{user.name}</h1>
    </div>
  );
}

// 使用 ErrorBoundary 捕获错误
function UserPage({ userId }) {
  const userPromise = fetchUser(userId);
  
  return (
    <ErrorBoundary fallback={<div>加载失败</div>}>
      <Suspense fallback={<div>加载中...</div>}>
        <UserProfile userPromise={userPromise} />
      </Suspense>
    </ErrorBoundary>
  );
}
```

---

## 五、表单相关 Hooks

### 5.1 useFormStatus

```tsx
import { useFormStatus } from 'react-dom';

// 获取表单提交状态
function SubmitButton() {
  const { pending, data, method, action } = useFormStatus();
  
  return (
    <button 
      type="submit" 
      disabled={pending}
      className={pending ? 'loading' : ''}
    >
      {pending ? '提交中...' : '提交'}
    </button>
  );
}

// 必须在 <form> 内部使用
function ContactForm() {
  return (
    <form action={submitContact}>
      <input name="name" required />
      <input name="email" type="email" required />
      
      {/* SubmitButton 必须在 form 内 */}
      <SubmitButton />
    </form>
  );
}
```

### 5.2 useOptimistic

```tsx
import { useOptimistic } from 'react';

function TodoList({ todos, addTodo }) {
  // 乐观更新状态
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo) => [
      ...state,
      { ...newTodo, id: 'temp-' + Date.now(), pending: true }
    ]
  );
  
  async function handleSubmit(formData) {
    const title = formData.get('title');
    
    // 立即显示乐观更新
    addOptimisticTodo({ title, completed: false });
    
    // 实际提交到服务器
    await addTodo(title);
  }
  
  return (
    <div>
      <ul>
        {optimisticTodos.map(todo => (
          <li 
            key={todo.id}
            style={{ opacity: todo.pending ? 0.5 : 1 }}
          >
            {todo.title}
            {todo.pending && <span> (保存中...)</span>}
          </li>
        ))}
      </ul>
      
      <form action={handleSubmit}>
        <input name="title" placeholder="添加待办事项" />
        <button type="submit">添加</button>
      </form>
    </div>
  );
}
```

### 5.3 useActionState

```tsx
import { useActionState } from 'react';

// Server Action
async function createPost(prevState, formData) {
  'use server';
  
  const title = formData.get('title');
  const content = formData.get('content');
  
  // 验证
  if (!title || title.length < 3) {
    return { error: '标题至少需要3个字符' };
  }
  
  if (!content) {
    return { error: '内容不能为空' };
  }
  
  try {
    await db.posts.create({ data: { title, content } });
    return { success: true, message: '文章创建成功' };
  } catch (error) {
    return { error: '创建失败，请重试' };
  }
}

// 使用 useActionState
function CreatePostForm() {
  const [state, formAction, isPending] = useActionState(createPost, null);
  
  return (
    <form action={formAction}>
      <div>
        <label>标题</label>
        <input name="title" />
      </div>
      
      <div>
        <label>内容</label>
        <textarea name="content" />
      </div>
      
      <button type="submit" disabled={isPending}>
        {isPending ? '创建中...' : '创建文章'}
      </button>
      
      {/* 显示状态 */}
      {state?.error && (
        <p className="error">{state.error}</p>
      )}
      {state?.success && (
        <p className="success">{state.message}</p>
      )}
    </form>
  );
}
```

---

## 六、React Compiler（React 编译器）

### 6.1 概念解析

React Compiler 是 React 19 引入的自动记忆化编译器，它可以：

- **自动优化组件渲染**
- **消除手动 useMemo/useCallback 的需求**
- **减少不必要的重渲染**
- **提升应用性能**

### 6.2 编译前后对比

```tsx
// ❌ 编译前：需要手动优化
function UserCard({ user, onUpdate }) {
  // 手动记忆化
  const formattedName = useMemo(() => {
    return `${user.firstName} ${user.lastName}`;
  }, [user.firstName, user.lastName]);
  
  // 手动记忆化回调
  const handleClick = useCallback(() => {
    onUpdate(user.id);
  }, [user.id, onUpdate]);
  
  return (
    <div onClick={handleClick}>
      <h2>{formattedName}</h2>
      <p>{user.email}</p>
    </div>
  );
}

// ✅ 编译后：自动优化，无需手动记忆化
function UserCard({ user, onUpdate }) {
  // 编译器自动处理记忆化
  const formattedName = `${user.firstName} ${user.lastName}`;
  
  const handleClick = () => {
    onUpdate(user.id);
  };
  
  return (
    <div onClick={handleClick}>
      <h2>{formattedName}</h2>
      <p>{user.email}</p>
    </div>
  );
}
```

### 6.3 配置使用

```javascript
// babel.config.js
module.exports = {
  presets: [
    ['@babel/preset-react', { runtime: 'automatic' }]
  ],
  plugins: [
    // 启用 React Compiler
    'babel-plugin-react-compiler'
  ]
};

// next.config.js (Next.js 项目)
const nextConfig = {
  experimental: {
    // 启用 React Compiler
    reactCompiler: true,
  },
};
```

### 6.4 编译器规则

```tsx
// ✅ 编译器可以优化的代码
function GoodComponent({ items }) {
  // 纯函数计算
  const sortedItems = items.sort((a, b) => a.name.localeCompare(b.name));
  
  // 条件渲染
  const showCount = items.length > 0;
  
  return (
    <div>
      {showCount && <p>共 {items.length} 项</p>}
      <ul>
        {sortedItems.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}

// ❌ 编译器无法优化的代码（违反 React 规则）
function BadComponent({ items }) {
  // 副作用在渲染中（违反规则）
  items.forEach(item => console.log(item));
  
  // 直接修改 props（违反规则）
  items.push({ id: 999, name: 'New' });
  
  return <div>{items.length}</div>;
}
```

---

## 七、其他新特性

### 7.1 Document Metadata

```tsx
// React 19 支持在组件中直接渲染 <title>、<meta> 等
function BlogPost({ post }) {
  return (
    <article>
      {/* 直接在组件中设置文档元数据 */}
      <title>{post.title}</title>
      <meta name="description" content={post.excerpt} />
      <meta property="og:title" content={post.title} />
      <link rel="canonical" href={`https://example.com/posts/${post.id}`} />
      
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}
```

### 7.2 Stylesheets 支持

```tsx
// 组件级别的样式表管理
function App() {
  return (
    <>
      {/* 样式表会自动去重和优先级管理 */}
      <link rel="stylesheet" href="styles.css" precedence="default" />
      <link rel="stylesheet" href="critical.css" precedence="high" />
      
      <div className="app">
        {/* 组件内容 */}
      </div>
    </>
  );
}
```

### 7.3 Suspense 增强

```tsx
import { Suspense } from 'react';

// 多个 Suspense 边界
function Dashboard() {
  return (
    <div>
      {/* 独立加载状态 */}
      <Suspense fallback={<div>加载用户信息...</div>}>
        <UserProfile />
      </Suspense>
      
      <Suspense fallback={<div>加载订单数据...</div>}>
        <OrderList />
      </Suspense>
      
      <Suspense fallback={<div>加载统计数据...</div>}>
        <Statistics />
      </Suspense>
    </div>
  );
}

// 使用 Suspense 进行流式渲染
async function StreamingPage() {
  return (
    <html>
      <head>
        <title>流式渲染页面</title>
      </head>
      <body>
        {/* 快速内容 */}
        <Header />
        
        {/* 流式加载 */}
        <Suspense fallback={<Skeleton />}>
          <SlowComponent />
        </Suspense>
        
        {/* 快速内容 */}
        <Footer />
      </body>
    </html>
  );
}
```

---

## 八、迁移指南

### 8.1 从 React 18 迁移

```bash
# 更新依赖
npm install react@19 react-dom@19

# 更新类型定义
npm install @types/react@19 @types/react-dom@19
```

### 8.2 废弃的 API

| 废弃 API | 替代方案 |
|----------|----------|
| `propTypes` | TypeScript 类型定义 |
| `defaultProps` | 函数参数默认值 |
| `contextTypes` | `contextType` 或 `useContext` |
| `string refs` | `createRef` 或 `useRef` |
| `findDOMNode` | DOM 引用 |

### 8.3 代码迁移示例

```tsx
// ❌ 旧写法（已废弃）
function OldComponent({ name, age }) {
  return <div>{name}, {age}</div>;
}

OldComponent.defaultProps = {
  name: 'Guest',
  age: 18
};

OldComponent.propTypes = {
  name: PropTypes.string,
  age: PropTypes.number
};

// ✅ 新写法
interface NewComponentProps {
  name?: string;
  age?: number;
}

function NewComponent({ 
  name = 'Guest', 
  age = 18 
}: NewComponentProps) {
  return <div>{name}, {age}</div>;
}
```

---

## 九、最佳实践

### 9.1 组件设计原则

```tsx
// ✅ 好的设计：服务端组件获取数据，客户端组件处理交互
// services/UserService.ts（服务端）
async function getUser(id: string) {
  'use server';
  return db.users.findUnique({ where: { id } });
}

// components/UserCard.tsx（客户端）
'use client';

function UserCard({ user }) {
  const [isEditing, setIsEditing] = useState(false);
  
  return (
    <div>
      {isEditing ? (
        <EditForm user={user} />
      ) : (
        <UserDisplay user={user} />
      )}
      <button onClick={() => setIsEditing(!isEditing)}>
        {isEditing ? '取消' : '编辑'}
      </button>
    </div>
  );
}
```

### 9.2 性能优化建议

```tsx
// 1. 合理划分服务端/客户端组件
// 服务端组件：数据获取、SEO 关键内容
// 客户端组件：交互、状态管理

// 2. 使用 Suspense 进行代码分割
<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>

// 3. 利用 Server Actions 减少客户端代码
async function deleteItem(id: string) {
  'use server';
  await db.items.delete({ where: { id } });
  revalidatePath('/items');
}

// 4. 使用 useOptimistic 提升用户体验
const [optimisticItems, addOptimistic] = useOptimistic(items, reducer);
```

---

## 十、总结

React 19 是 React 历史上最重要的版本之一，它带来了：

1. **Server Components** - 服务端渲染的革命性改进
2. **Server Actions** - 简化全栈开发流程
3. **use() Hook** - 统一的异步数据处理
4. **React Compiler** - 自动性能优化
5. **表单增强 Hooks** - 更好的表单处理体验

掌握 React 19 的新特性，将帮助你构建更高效、更现代的 Web 应用。

---

## 十一、实战项目示例

### 11.1 完整的用户认证系统

```tsx
// ==================== 服务端操作 ====================
// app/actions/auth.ts
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// 登录验证 Schema
const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少需要6个字符'),
});

// 登录操作
export async function login(formData: FormData) {
  // 验证输入数据
  const result = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!result.success) {
    return { 
      success: false, 
      errors: result.error.flatten().fieldErrors 
    };
  }

  try {
    // 调用后端 API 进行认证
    const response = await fetch(`${process.env.API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result.data),
    });

    if (!response.ok) {
      return { success: false, error: '邮箱或密码错误' };
    }

    const { token, user } = await response.json();

    // 设置 HTTP-only Cookie
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7天
    });

    // 重定向到仪表盘
    redirect('/dashboard');
  } catch (error) {
    return { success: false, error: '登录失败，请稍后重试' };
  }
}

// 登出操作
export async function logout() {
  'use server';

  const cookieStore = await cookies();
  cookieStore.delete('token');
  redirect('/login');
}

// 获取当前用户
export async function getCurrentUser() {
  'use server';

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${process.env.API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}
```

```tsx
// ==================== 登录表单组件 ====================
// app/(auth)/login/page.tsx
'use client';

import { useActionState } from 'react';
import { login } from '@/app/actions/auth';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            登录账户
          </h2>
        </div>

        <form action={formAction} className="mt-8 space-y-6">
          {/* 邮箱输入 */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              邮箱地址
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="请输入邮箱"
            />
            {/* 显示字段错误 */}
            {state?.errors?.email && (
              <p className="mt-1 text-sm text-red-600">{state.errors.email[0]}</p>
            )}
          </div>

          {/* 密码输入 */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              密码
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="请输入密码"
            />
            {/* 显示字段错误 */}
            {state?.errors?.password && (
              <p className="mt-1 text-sm text-red-600">{state.errors.password[0]}</p>
            )}
          </div>

          {/* 显示通用错误 */}
          {state?.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{state.error}</p>
            </div>
          )}

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? '登录中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

### 11.2 实时数据仪表盘

```tsx
// ==================== 仪表盘页面 ====================
// app/dashboard/page.tsx
import { Suspense } from 'react';
import { getCurrentUser } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import StatisticsCards from '@/components/dashboard/StatisticsCards';
import RecentOrders from '@/components/dashboard/RecentOrders';
import SalesChart from '@/components/dashboard/SalesChart';

// 服务端组件：检查认证
async function DashboardContent() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">欢迎回来，{user.name}</h1>

      {/* 统计卡片 - 独立加载 */}
      <Suspense fallback={<StatisticsCardsSkeleton />}>
        <StatisticsCards />
      </Suspense>

      {/* 图表和订单 - 并行加载 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Suspense fallback={<ChartSkeleton />}>
          <SalesChart />
        </Suspense>

        <Suspense fallback={<OrdersSkeleton />}>
          <RecentOrders />
        </Suspense>
      </div>
    </div>
  );
}

// 骨架屏组件
function StatisticsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return <div className="h-80 bg-gray-200 rounded-lg animate-pulse" />;
}

function OrdersSkeleton() {
  return <div className="h-80 bg-gray-200 rounded-lg animate-pulse" />;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
```

```tsx
// ==================== 统计卡片组件 ====================
// components/dashboard/StatisticsCards.tsx
import { fetchStatistics } from '@/lib/api';

async function StatCard({ 
  title, 
  value, 
  change, 
  icon 
}: { 
  title: string; 
  value: string; 
  change: number; 
  icon: React.ReactNode;
}) {
  const isPositive = change >= 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          <p className={`text-sm mt-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '↑' : '↓'} {Math.abs(change)}% 较上月
          </p>
        </div>
        <div className="p-3 bg-blue-50 rounded-full">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default async function StatisticsCards() {
  // 服务端获取统计数据
  const stats = await fetchStatistics();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard
        title="总收入"
        value={`¥${stats.revenue.toLocaleString()}`}
        change={stats.revenueChange}
        icon={<RevenueIcon />}
      />
      <StatCard
        title="订单数"
        value={stats.orders.toString()}
        change={stats.ordersChange}
        icon={<OrdersIcon />}
      />
      <StatCard
        title="用户数"
        value={stats.users.toLocaleString()}
        change={stats.usersChange}
        icon={<UsersIcon />}
      />
      <StatCard
        title="转化率"
        value={`${stats.conversionRate}%`}
        change={stats.conversionChange}
        icon={<ConversionIcon />}
      />
    </div>
  );
}
```

### 11.3 乐观更新的待办事项应用

```tsx
// ==================== 待办事项列表 ====================
// components/todos/TodoList.tsx
'use client';

import { useState, useTransition } from 'react';
import { useOptimistic } from 'react';
import { addTodo, toggleTodo, deleteTodo } from '@/app/actions/todos';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

interface TodoListProps {
  initialTodos: Todo[];
}

export default function TodoList({ initialTodos }: TodoListProps) {
  // 使用 useOptimistic 实现乐观更新
  const [optimisticTodos, updateOptimisticTodos] = useOptimistic(
    initialTodos,
    (state, { action, todo }: { action: 'add' | 'toggle' | 'delete'; todo: Partial<Todo> }) => {
      switch (action) {
        case 'add':
          return [...state, { ...todo, id: 'temp-' + Date.now(), pending: true } as Todo];
        case 'toggle':
          return state.map(t => 
            t.id === todo.id ? { ...t, completed: !t.completed, pending: true } : t
          );
        case 'delete':
          return state.filter(t => t.id !== todo.id);
        default:
          return state;
      }
    }
  );

  const [isPending, startTransition] = useTransition();
  const [newTodo, setNewTodo] = useState('');

  // 添加待办事项
  const handleAddTodo = async (formData: FormData) => {
    const title = formData.get('title') as string;
    
    if (!title.trim()) return;

    // 立即显示乐观更新
    startTransition(async () => {
      updateOptimisticTodos({ 
        action: 'add', 
        todo: { title, completed: false, createdAt: new Date() } 
      });

      // 实际提交到服务器
      await addTodo(title);
      setNewTodo('');
    });
  };

  // 切换完成状态
  const handleToggle = async (id: string, completed: boolean) => {
    startTransition(async () => {
      updateOptimisticTodos({ action: 'toggle', todo: { id } });
      await toggleTodo(id, !completed);
    });
  };

  // 删除待办事项
  const handleDelete = async (id: string) => {
    startTransition(async () => {
      updateOptimisticTodos({ action: 'delete', todo: { id } });
      await deleteTodo(id);
    });
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">待办事项</h1>

      {/* 添加表单 */}
      <form action={handleAddTodo} className="flex gap-2 mb-4">
        <input
          type="text"
          name="title"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="添加新任务..."
          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          添加
        </button>
      </form>

      {/* 待办列表 */}
      <ul className="space-y-2">
        {optimisticTodos.map((todo) => (
          <li
            key={todo.id}
            className={`flex items-center gap-3 p-3 bg-white rounded-lg shadow ${
              (todo as any).pending ? 'opacity-50' : ''
            }`}
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => handleToggle(todo.id, todo.completed)}
              className="w-5 h-5 rounded border-gray-300"
            />
            <span className={`flex-1 ${todo.completed ? 'line-through text-gray-400' : ''}`}>
              {todo.title}
            </span>
            <button
              onClick={() => handleDelete(todo.id)}
              className="text-red-500 hover:text-red-700"
            >
              删除
            </button>
          </li>
        ))}
      </ul>

      {/* 统计信息 */}
      <div className="mt-4 text-sm text-gray-500">
        共 {optimisticTodos.length} 项，已完成 {optimisticTodos.filter(t => t.completed).length} 项
      </div>
    </div>
  );
}
```

---

## 十二、常见问题与解决方案

### 12.1 Server Components 常见问题

#### 问题1：如何在服务端组件中使用客户端交互？

```tsx
// ❌ 错误：在服务端组件中使用事件处理
async function ProductCard({ product }) {
  const handleAddToCart = () => {
    // 错误！服务端组件不能有事件处理
  };

  return <button onClick={handleAddToCart}>加入购物车</button>;
}

// ✅ 正确：拆分为服务端和客户端组件
// components/ProductCard.tsx（服务端组件）
import AddToCartButton from './AddToCartButton';

async function ProductCard({ productId }) {
  // 服务端获取产品数据
  const product = await fetchProduct(productId);

  return (
    <div>
      <h2>{product.name}</h2>
      <p>{product.description}</p>
      {/* 客户端组件处理交互 */}
      <AddToCartButton productId={product.id} />
    </div>
  );
}

// components/AddToCartButton.tsx（客户端组件）
'use client';

import { useState } from 'react';
import { addToCart } from '@/app/actions/cart';

export default function AddToCartButton({ productId }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await addToCart(productId);
      alert('已添加到购物车');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={loading}>
      {loading ? '添加中...' : '加入购物车'}
    </button>
  );
}
```

#### 问题2：如何处理服务端组件的数据刷新？

```tsx
// app/products/page.tsx
import { revalidatePath, revalidateTag } from 'next/cache';

// 方式1：基于时间重新验证
export const revalidate = 60; // 60秒后重新验证

// 方式2：按需重新验证
async function ProductsPage() {
  const products = await fetch('/api/products', {
    next: { tags: ['products'] } // 设置标签
  }).then(res => res.json());

  return <ProductList products={products} />;
}

// app/actions/products.ts
'use server';

export async function updateProduct(id: string, data: any) {
  await db.products.update({ where: { id }, data });

  // 方式1：重新验证特定路径
  revalidatePath('/products');
  revalidatePath(`/products/${id}`);

  // 方式2：重新验证特定标签
  revalidateTag('products');
}
```

#### 问题3：如何在服务端组件间共享数据？

```tsx
// ❌ 错误：使用全局变量（请求间会共享）
let cachedData = null;

async function ComponentA() {
  if (!cachedData) {
    cachedData = await fetchData();
  }
  return <div>{cachedData}</div>;
}

// ✅ 正确：使用 React Cache
import { cache } from 'react';

// cache 确保同一请求内只获取一次数据
const getCachedUser = cache(async (id: string) => {
  return db.users.findUnique({ where: { id } });
});

// 多个组件可以安全地调用同一个缓存函数
async function UserProfile({ userId }) {
  const user = await getCachedUser(userId);
  return <div>{user.name}</div>;
}

async function UserSettings({ userId }) {
  // 同一请求内，这里会复用上面的数据
  const user = await getCachedUser(userId);
  return <div>{user.email}</div>;
}
```

### 12.2 Server Actions 常见问题

#### 问题1：如何处理 Server Action 的错误？

```tsx
// app/actions/user.ts
'use server';

import { z } from 'zod';

// 定义错误类型
export type ActionResult<T = void> = 
  | { success: true; data: T }
  | { success: false; error: string; errors?: Record<string, string[]> };

// 验证 Schema
const userSchema = z.object({
  name: z.string().min(2, '姓名至少2个字符'),
  email: z.string().email('请输入有效的邮箱'),
  age: z.number().min(0).max(150, '年龄必须在0-150之间'),
});

export async function createUser(formData: FormData): Promise<ActionResult<User>> {
  // 1. 验证输入
  const result = userSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    age: Number(formData.get('age')),
  });

  if (!result.success) {
    return {
      success: false,
      error: '验证失败',
      errors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  // 2. 检查唯一性
  const existingUser = await db.users.findUnique({
    where: { email: result.data.email },
  });

  if (existingUser) {
    return {
      success: false,
      error: '该邮箱已被注册',
    };
  }

  // 3. 创建用户
  try {
    const user = await db.users.create({
      data: result.data,
    });

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    // 记录错误日志
    console.error('创建用户失败:', error);

    return {
      success: false,
      error: '创建用户失败，请稍后重试',
    };
  }
}

// 组件中使用
'use client';

import { useActionState } from 'react';
import { createUser, type ActionResult } from '@/app/actions/user';

function CreateUserForm() {
  const [state, formAction, isPending] = useActionState(createUser, null);

  return (
    <form action={formAction}>
      <div>
        <input name="name" placeholder="姓名" />
        {state?.errors?.name && (
          <p className="error">{state.errors.name[0]}</p>
        )}
      </div>

      <div>
        <input name="email" type="email" placeholder="邮箱" />
        {state?.errors?.email && (
          <p className="error">{state.errors.email[0]}</p>
        )}
      </div>

      <button type="submit" disabled={isPending}>
        {isPending ? '创建中...' : '创建用户'}
      </button>

      {!state?.success && state?.error && (
        <p className="error">{state.error}</p>
      )}
    </form>
  );
}
```

#### 问题2：如何在 Server Action 中处理文件上传？

```tsx
// app/actions/upload.ts
'use server';

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// 文件类型验证
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function uploadImage(formData: FormData): Promise<ActionResult<{ url: string }>> {
  const file = formData.get('file') as File;

  // 验证文件存在
  if (!file || file.size === 0) {
    return { success: false, error: '请选择文件' };
  }

  // 验证文件类型
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: '只支持 JPG、PNG、WebP 格式' };
  }

  // 验证文件大小
  if (file.size > MAX_SIZE) {
    return { success: false, error: '文件大小不能超过 5MB' };
  }

  try {
    // 生成唯一文件名
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    
    // 确保上传目录存在
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    // 写入文件
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // 返回可访问的 URL
    return {
      success: true,
      data: { url: `/uploads/${fileName}` },
    };
  } catch (error) {
    console.error('文件上传失败:', error);
    return { success: false, error: '文件上传失败' };
  }
}

// 组件中使用
'use client';

import { useState } from 'react';
import { uploadImage } from '@/app/actions/upload';

function ImageUploader() {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (formData: FormData) => {
    setUploading(true);
    const result = await uploadImage(formData);
    setUploading(false);

    if (result.success) {
      setPreview(result.data.url);
    } else {
      alert(result.error);
    }
  };

  return (
    <form action={handleUpload}>
      <input 
        type="file" 
        name="file" 
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setPreview(URL.createObjectURL(file));
          }
        }}
      />
      
      {preview && (
        <img src={preview} alt="预览" className="w-32 h-32 object-cover" />
      )}

      <button type="submit" disabled={uploading}>
        {uploading ? '上传中...' : '上传图片'}
      </button>
    </form>
  );
}
```

### 12.3 use() Hook 常见问题

#### 问题1：如何在循环中使用 use()？

```tsx
// ❌ 错误：在循环中直接使用 use()
function UserList({ userIds }) {
  return (
    <ul>
      {userIds.map(id => {
        const user = use(fetchUser(id)); // 错误！不能在循环中使用
        return <li key={id}>{user.name}</li>;
      })}
    </ul>
  );
}

// ✅ 正确：将 use() 移到子组件中
function UserItem({ userId }) {
  const user = use(fetchUser(userId));
  return <li>{user.name}</li>;
}

function UserList({ userIds }) {
  return (
    <ul>
      {userIds.map(id => (
        <Suspense key={id} fallback={<li>加载中...</li>}>
          <UserItem userId={id} />
        </Suspense>
      ))}
    </ul>
  );
}
```

#### 问题2：如何处理 use() 的错误？

```tsx
// 使用 Error Boundary 捕获错误
import { ErrorBoundary } from 'react-error-boundary';

function UserProfile({ userPromise }) {
  const user = use(userPromise);
  return <div>{user.name}</div>;
}

function UserPage({ userId }) {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div>
          <p>加载失败: {error.message}</p>
          <button onClick={resetErrorBoundary}>重试</button>
        </div>
      )}
    >
      <Suspense fallback={<div>加载中...</div>}>
        <UserProfile userPromise={fetchUser(userId)} />
      </Suspense>
    </ErrorBoundary>
  );
}
```

---

## 十三、性能优化技巧

### 13.1 服务端组件优化

```tsx
// ==================== 数据获取优化 ====================

// ❌ 不好的做法：串行获取数据
async function DashboardPage() {
  const user = await fetchUser();        // 等待 200ms
  const orders = await fetchOrders();    // 等待 300ms
  const stats = await fetchStats();      // 等待 200ms
  // 总等待时间：700ms

  return <Dashboard user={user} orders={orders} stats={stats} />;
}

// ✅ 好的做法：并行获取数据
async function DashboardPage() {
  const [user, orders, stats] = await Promise.all([
    fetchUser(),
    fetchOrders(),
    fetchStats(),
  ]);
  // 总等待时间：300ms（最慢的那个）

  return <Dashboard user={user} orders={orders} stats={stats} />;
}

// ✅ 更好的做法：使用 Suspense 流式渲染
async function DashboardPage() {
  return (
    <div>
      {/* 关键内容优先 */}
      <Suspense fallback={<UserSkeleton />}>
        <UserProfile />
      </Suspense>

      {/* 次要内容流式加载 */}
      <div className="grid grid-cols-2 gap-4">
        <Suspense fallback={<OrdersSkeleton />}>
          <RecentOrders />
        </Suspense>

        <Suspense fallback={<StatsSkeleton />}>
          <Statistics />
        </Suspense>
      </div>
    </div>
  );
}
```

### 13.2 客户端组件优化

```tsx
// ==================== 减少客户端 JavaScript ====================

// ❌ 不好的做法：整个页面都是客户端组件
'use client';

import { useState, useEffect } from 'react';

export default function ProductPage({ productId }) {
  const [product, setProduct] = useState(null);

  useEffect(() => {
    fetchProduct(productId).then(setProduct);
  }, [productId]);

  if (!product) return <div>加载中...</div>;

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <button onClick={() => addToCart(productId)}>加入购物车</button>
    </div>
  );
}

// ✅ 好的做法：拆分服务端和客户端组件
// app/products/[id]/page.tsx（服务端组件）
import AddToCartButton from '@/components/AddToCartButton';

export default async function ProductPage({ params }) {
  const { id } = await params;
  const product = await fetchProduct(id); // 服务端获取数据

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      {/* 只有交互部分是客户端组件 */}
      <AddToCartButton productId={id} />
    </div>
  );
}

// components/AddToCartButton.tsx（客户端组件）
'use client';

import { useState } from 'react';

export default function AddToCartButton({ productId }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    await addToCart(productId);
    setLoading(false);
  };

  return (
    <button onClick={handleClick} disabled={loading}>
      {loading ? '添加中...' : '加入购物车'}
    </button>
  );
}
```

### 13.3 React Compiler 最佳实践

```tsx
// ==================== 编译器友好的代码 ====================

// ✅ 编译器可以优化的代码模式

// 1. 纯函数组件
function ProductCard({ product, onAddToCart }) {
  // 编译器自动记忆化
  const formattedPrice = formatPrice(product.price);

  return (
    <div>
      <h3>{product.name}</h3>
      <p>{formattedPrice}</p>
      <button onClick={() => onAddToCart(product.id)}>
        加入购物车
      </button>
    </div>
  );
}

// 2. 条件渲染
function UserGreeting({ user }) {
  return (
    <div>
      {user ? (
        <span>欢迎，{user.name}</span>
      ) : (
        <span>请登录</span>
      )}
    </div>
  );
}

// 3. 列表渲染
function ProductList({ products }) {
  return (
    <ul>
      {products.map(product => (
        <li key={product.id}>{product.name}</li>
      ))}
    </ul>
  );
}

// ❌ 编译器无法优化的代码模式

// 1. 副作用在渲染中
function BadComponent({ items }) {
  // 副作用不应该在渲染中
  items.push({ id: 999 }); // 修改 props

  return <div>{items.length}</div>;
}

// 2. 非纯函数
let globalCounter = 0;

function BadComponent() {
  // 依赖外部状态
  globalCounter++;

  return <div>{globalCounter}</div>;
}

// 3. 随机值
function BadComponent() {
  // 每次渲染结果不同
  const randomValue = Math.random();

  return <div>{randomValue}</div>;
}
```

### 13.4 缓存策略优化

```tsx
// ==================== 智能缓存策略 ====================

// 1. 静态数据：永久缓存
const siteConfig = await fetch('/api/config', {
  cache: 'force-cache'
});

// 2. 动态数据：定时重新验证
const products = await fetch('/api/products', {
  next: { revalidate: 60 } // 60秒后重新验证
});

// 3. 用户特定数据：不缓存
const userProfile = await fetch('/api/user/profile', {
  cache: 'no-store'
});

// 4. 按需重新验证
// app/actions/products.ts
'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

export async function updateProduct(id: string, data: any) {
  await db.products.update({ where: { id }, data });

  // 精确失效
  revalidatePath(`/products/${id}`); // 只失效该产品页面
  revalidateTag('products'); // 失效所有带 products 标签的请求
}

// 5. 按标签分组缓存
const products = await fetch('/api/products', {
  next: { tags: ['products', 'catalog'] }
});

const categories = await fetch('/api/categories', {
  next: { tags: ['categories', 'catalog'] }
});

// 失效整个目录
revalidateTag('catalog');
```

---

## 十四、面试高频问题

### 14.1 基础概念题

#### Q1：React 19 中 Server Components 和 Client Components 的区别是什么？

**答案要点：**

| 特性 | Server Components | Client Components |
|------|------------------|-------------------|
| 渲染位置 | 服务器 | 浏览器 |
| JavaScript 打包 | 不打包到客户端 | 打包到客户端 |
| 数据获取 | 可直接访问数据库 | 需要通过 API |
| 状态管理 | 不支持 useState | 支持 useState |
| 生命周期 | 不支持 useEffect | 支持 useEffect |
| 事件处理 | 不支持 | 支持 |
| SEO | 更友好 | 需要额外处理 |

**代码示例：**
```tsx
// 服务端组件（默认）
async function ProductList() {
  // 可以直接访问数据库
  const products = await db.products.findMany();

  return (
    <ul>
      {products.map(p => <li key={p.id}>{p.name}</li>)}
    </ul>
  );
}

// 客户端组件
'use client';

import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(c => c + 1)}>
      点击次数: {count}
    </button>
  );
}
```

#### Q2：什么是 Server Actions？它解决了什么问题？

**答案要点：**

Server Actions 是在服务器上执行的函数，可以直接在组件中定义和调用，无需创建 API 路由。

**解决的问题：**
1. 简化全栈开发流程，无需手动创建 API 端点
2. 减少客户端 JavaScript 代码量
3. 自动处理表单提交和数据验证
4. 内置 CSRF 保护

**代码示例：**
```tsx
// 传统方式：需要创建 API 路由
// app/api/users/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  const user = await db.users.create({ data: body });
  return Response.json(user);
}

// app/users/page.tsx
'use client';

function CreateUserForm() {
  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
  };

  return <form onSubmit={handleSubmit}>...</form>;
}

// Server Actions 方式：更简洁
// app/actions/user.ts
'use server';

export async function createUser(formData: FormData) {
  const user = await db.users.create({
    data: {
      name: formData.get('name'),
      email: formData.get('email'),
    },
  });
  revalidatePath('/users');
  return user;
}

// app/users/page.tsx
function CreateUserForm() {
  return <form action={createUser}>...</form>;
}
```

#### Q3：React 19 的 use() Hook 有什么作用？

**答案要点：**

`use()` 是 React 19 引入的新 Hook，用于统一处理 Promise 和 Context。

**特点：**
1. 可以在组件内部直接读取 Promise 的值
2. 可以替代 useContext，且可以在条件语句中使用
3. 配合 Suspense 实现优雅的加载状态

**代码示例：**
```tsx
import { use, Suspense } from 'react';

// 读取 Promise
function UserProfile({ userPromise }) {
  const user = use(userPromise); // 自动处理 Promise
  return <h1>{user.name}</h1>;
}

// 读取 Context（可在条件中使用）
function ThemedButton({ showTheme }) {
  if (showTheme) {
    const theme = use(ThemeContext); // ✅ 可以在条件中使用
    return <button className={theme}>按钮</button>;
  }
  return <button>按钮</button>;
}

// 配合 Suspense
function UserPage({ userId }) {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <UserProfile userPromise={fetchUser(userId)} />
    </Suspense>
  );
}
```

### 14.2 进阶问题

#### Q4：useOptimistic 的工作原理是什么？如何正确使用？

**答案要点：**

`useOptimistic` 实现乐观更新模式：在服务器响应之前先更新 UI，提升用户体验。

**工作原理：**
1. 接收当前状态和一个更新函数
2. 调用更新函数时立即显示"乐观"状态
3. 服务器响应后自动恢复真实状态

**代码示例：**
```tsx
import { useOptimistic } from 'react';

function LikeButton({ postId, initialLikes }) {
  // 乐观状态
  const [optimisticLikes, addLike] = useOptimistic(
    initialLikes,
    (state, newLike) => state + newLike
  );

  async function handleLike() {
    // 立即显示乐观更新
    addLike(1);

    // 实际发送请求
    await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
  }

  return (
    <button onClick={handleLike}>
      ❤️ {optimisticLikes}
    </button>
  );
}
```

#### Q5：React Compiler 如何优化性能？使用时需要注意什么？

**答案要点：**

React Compiler 自动进行记忆化优化，消除手动 useMemo/useCallback 的需求。

**优化原理：**
1. 编译时分析组件依赖
2. 自动插入记忆化代码
3. 避免不必要的重渲染

**注意事项：**
1. 组件必须是纯函数
2. 不能在渲染中产生副作用
3. 不能直接修改 props 或 state
4. 需要遵循 React 的规则

**代码示例：**
```tsx
// 编译前：需要手动优化
function UserCard({ user, onUpdate }) {
  const formattedName = useMemo(() => 
    `${user.firstName} ${user.lastName}`,
    [user.firstName, user.lastName]
  );

  const handleClick = useCallback(() => {
    onUpdate(user.id);
  }, [user.id, onUpdate]);

  return <div onClick={handleClick}>{formattedName}</div>;
}

// 编译后：自动优化
function UserCard({ user, onUpdate }) {
  // 编译器自动处理记忆化
  const formattedName = `${user.firstName} ${user.lastName}`;
  const handleClick = () => onUpdate(user.id);

  return <div onClick={handleClick}>{formattedName}</div>;
}
```

### 14.3 实战场景题

#### Q6：如何设计一个支持实时更新的数据表格？

**答案要点：**

```tsx
// components/RealtimeTable.tsx
'use client';

import { useOptimistic, useEffect, useState } from 'react';
import { updateRow, deleteRow } from '@/app/actions/table';

interface Row {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

export default function RealtimeTable({ initialRows }: { initialRows: Row[] }) {
  // 乐观更新状态
  const [rows, updateRows] = useOptimistic(
    initialRows,
    (state, { action, row }: { action: 'update' | 'delete'; row: Partial<Row> }) => {
      switch (action) {
        case 'update':
          return state.map(r => r.id === row.id ? { ...r, ...row, pending: true } : r);
        case 'delete':
          return state.filter(r => r.id !== row.id);
        default:
          return state;
      }
    }
  );

  // 实时订阅更新
  useEffect(() => {
    const channel = subscribeToTable((newRow) => {
      updateRows({ action: 'update', row: newRow });
    });

    return () => channel.unsubscribe();
  }, []);

  // 更新行
  const handleUpdate = async (id: string, data: Partial<Row>) => {
    updateRows({ action: 'update', row: { id, ...data } });
    await updateRow(id, data);
  };

  // 删除行
  const handleDelete = async (id: string) => {
    updateRows({ action: 'delete', row: { id } });
    await deleteRow(id);
  };

  return (
    <table>
      <thead>
        <tr>
          <th>名称</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
          <tr key={row.id} className={(row as any).pending ? 'opacity-50' : ''}>
            <td>
              <input
                value={row.name}
                onChange={(e) => handleUpdate(row.id, { name: e.target.value })}
              />
            </td>
            <td>
              <select
                value={row.status}
                onChange={(e) => handleUpdate(row.id, { status: e.target.value as any })}
              >
                <option value="active">激活</option>
                <option value="inactive">停用</option>
              </select>
            </td>
            <td>
              <button onClick={() => handleDelete(row.id)}>删除</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## 十五、与其他技术对比

### 15.1 React 19 vs Vue 3

| 特性 | React 19 | Vue 3 |
|------|----------|-------|
| **服务端组件** | 原生支持 | 需要 Nuxt |
| **状态管理** | Zustand/Redux | Pinia |
| **类型支持** | TypeScript | TypeScript |
| **学习曲线** | 中等 | 较低 |
| **生态系统** | 更丰富 | 较丰富 |
| **性能** | 优秀 | 优秀 |
| **编译优化** | React Compiler | 模板编译 |

### 15.2 React 19 vs Svelte

| 特性 | React 19 | Svelte |
|------|----------|--------|
| **运行时** | 需要 React 运行时 | 编译时框架 |
| **包体积** | 较大 | 更小 |
| **语法** | JSX | 模板语法 |
| **响应式** | Hooks | 编译时响应式 |
| **学习曲线** | 中等 | 较低 |
| **生态** | 丰富 | 发展中 |

### 15.3 Server Components vs SSR

| 特性 | Server Components | 传统 SSR |
|------|------------------|----------|
| **JavaScript 开销** | 零客户端 JS | 需要水合 |
| **数据获取** | 直接访问数据库 | 需要预取 |
| **交互性** | 需要客户端组件 | 自动水合 |
| **流式渲染** | 原生支持 | 需要配置 |
| **SEO** | 优秀 | 优秀 |

---

## 十六、最佳实践总结

### 16.1 组件设计原则

```
┌─────────────────────────────────────────────────────────────┐
│                    React 19 组件设计原则                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 默认使用服务端组件                                       │
│     - 数据获取在服务端完成                                   │
│     - SEO 友好                                              │
│     - 零客户端 JavaScript                                   │
│                                                             │
│  2. 仅在需要时使用客户端组件                                  │
│     - 需要状态管理 (useState)                                │
│     - 需要事件处理 (onClick)                                 │
│     - 需要生命周期 (useEffect)                               │
│     - 需要浏览器 API                                        │
│                                                             │
│  3. 合理拆分组件                                             │
│     - 服务端组件获取数据                                     │
│     - 客户端组件处理交互                                     │
│     - 通过 props 传递数据                                    │
│                                                             │
│  4. 使用 Suspense 优化加载体验                                │
│     - 细粒度的加载状态                                       │
│     - 流式渲染                                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 16.2 性能优化清单

- [ ] 使用服务端组件获取数据
- [ ] 合理使用 Suspense 进行流式渲染
- [ ] 使用 useOptimistic 提升用户体验
- [ ] 配置合理的缓存策略
- [ ] 启用 React Compiler 自动优化
- [ ] 减少客户端组件数量
- [ ] 使用动态导入减少初始包大小
- [ ] 图片使用 next/image 优化
- [ ] 字体使用 next/font 优化

---

## 十七、React 19 vs React 18 对比

### 17.1 核心差异对比

| 特性 | React 18 | React 19 | 说明 |
|------|----------|----------|------|
| 并发渲染 | 基础支持 | 完全支持 | React 19 完善了并发特性 |
| Server Components | 稳定版 | 稳定版 | 两版本都支持 |
| use() Hook | ❌ | ✅ | React 19 新增 |
| useActionState | ❌ | ✅ | React 19 新增 |
| useOptimistic | ❌ | ✅ | React 19 新增 |
| useFormStatus | ❌ | ✅ | React 19 新增 |
| React Compiler | Beta | 稳定版 | React 19 正式发布 |
| Actions | 稳定版 | 增强 | React 19 增强了 Actions |

### 17.2 代码迁移指南

```tsx
// React 18: 手动管理表单状态
function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.target);
      await login(formData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div>{error}</div>}
      <button disabled={isLoading}>
        {isLoading ? '登录中...' : '登录'}
      </button>
    </form>
  );
}

// React 19: 使用 useActionState
function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    async (prevState, formData) => {
      try {
        await login(formData);
        return { error: null, success: true };
      } catch (err) {
        return { error: err.message, success: false };
      }
    },
    { error: null, success: false }
  );

  return (
    <form action={formAction}>
      {state.error && <div>{state.error}</div>}
      <button disabled={isPending}>
        {isPending ? '登录中...' : '登录'}
      </button>
    </form>
  );
}

// React 18: 数据获取
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <div>加载中...</div>;
  return <div>{user.name}</div>;
}

// React 19: 使用 use()
function UserProfile({ userPromise }) {
  const user = use(userPromise);
  return <div>{user.name}</div>;
}

// 使用方式
function UserPage({ userId }) {
  const userPromise = fetch(`/api/users/${userId}`).then(r => r.json());

  return (
    <Suspense fallback={<div>加载中...</div>}>
      <UserProfile userPromise={userPromise} />
    </Suspense>
  );
}

// React 18: 乐观更新
function LikeButton({ initialLikes }) {
  const [likes, setLikes] = useState(initialLikes);
  const [optimistic, setOptimistic] = useState(false);

  async function handleLike() {
    setOptimistic(true);
    setLikes(l => l + 1);

    try {
      await like();
    } catch {
      // 回滚
      setLikes(initialLikes);
    } finally {
      setOptimistic(false);
    }
  }

  return (
    <button onClick={handleLike} disabled={optimistic}>
      👍 {likes}
    </button>
  );
}

// React 19: 使用 useOptimistic
function LikeButton({ initialLikes }) {
  const [optimisticLikes, addOptimistic] = useOptimistic(
    initialLikes,
    (state, value) => state + value
  );

  async function handleLike() {
    addOptimistic(1);
    await like();
  }

  return <button onClick={handleLike}>👍 {optimisticLikes}</button>;
}
```

### 17.3 升级注意事项

```tsx
// 1. 新的 JSX Transform
// React 19 不再需要从 react 导入 React
// app/page.tsx (无需修改)
import { useState } from 'react'; // 仍然需要导入 hooks

function App() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}

// 2. ref 作为 prop
// React 18: 需要使用 forwardRef
const Input = forwardRef((props, ref) => (
  <input ref={ref} {...props} />
));

// React 19: 可以直接使用 ref 作为 prop
const Input = (props) => (
  <input {...props} ref={props.ref} />
);

// 3. Context 作为 provider
// React 18
<ThemeContext.Provider value={theme}>
  <App />
</ThemeContext.Provider>

// React 19: 仍然支持，但推荐新语法
<ThemeContext value={theme}>
  <App />
</ThemeContext>

// 4. Suspense 的行为变化
// React 19 的 Suspense 更智能
// 不会在数据更新时显示 fallback
```

---

## 十八、常见面试题

### 18.1 Server Components 相关

**问题1：Server Components 和 SSR 有什么区别？**

答案：
- **SSR（服务端渲染）**：每次请求都在服务端渲染完整的 HTML，客户端接收到 HTML 后需要水合（hydrate）才能交互
- **Server Components**：只在服务端运行，不会发送到客户端。可以组合使用：静态内容用 Server Components，需要交互的用 Client Components
- **主要区别**：
  1. Server Components 不会增加客户端 JavaScript 包大小
  2. Server Components 可以直接访问服务端资源
  3. Server Components 支持流式渲染，部分内容可以先行显示

**问题2：Server Components 可以使用哪些 API？**

答案：Server Components 只能使用：
- Node.js API（文件系统、路径等）
- 数据库客户端
- HTTP 请求库
- 其他服务端资源

不能使用：
- window、document 等浏览器 API
- useState、useEffect 等客户端 Hooks
- 事件处理函数（onClick 等）

**问题3：如何选择使用 Server Components 还是 Client Components？**

答案：
- **使用 Server Components**：
  - 获取数据
  - 访问服务端资源
  - 大型依赖库（不会打包到客户端）
  - 静态内容展示

- **使用 Client Components**：
  - 需要 useState、useEffect
  - 需要事件处理（onClick 等）
  - 需要浏览器 API
  - 需要实时交互

### 18.2 Server Actions 相关

**问题4：Server Actions 和 API Routes 有什么区别？**

答案：
- **API Routes**：需要手动定义端点、处理 HTTP 请求/响应
- **Server Actions**：直接调用异步函数，React 自动处理序列化
- **优势**：
  1. 代码更简洁，不需要单独定义 API 路由
  2. 类型安全，可以自动推断参数和返回类型
  3. 与表单深度集成，支持渐进式增强

**问题5：Server Actions 如何保证安全性？**

答案：
1. **内置 CSRF 保护**：React 自动验证请求来源
2. **闭包安全**：Server Actions 在服务端闭包中执行，不会暴露敏感代码
3. **类型检查**：参数自动序列化，防止恶意数据注入
4. **错误处理**：可以返回结构化的错误信息

### 18.3 React 19 新特性相关

**问题6：use() Hook 相比 useEffect 有什么优势？**

答案：
1. **代码更简洁**：不需要手动管理 loading/error 状态
2. **自动 Suspense 集成**：与 Suspense 配合使用更自然
3. **更好的类型推断**：TypeScript 支持更好
4. **支持 Promise 和 Context**：统一的 API

**问题7：useOptimistic 的适用场景？**

答案：
- 点赞/点踩按钮
- 评论发布
- 表单草稿保存
- 任何需要即时反馈的操作

不适合：
- 需要严格数据一致性的操作（如支付）
- 副作用较大的操作

### 18.4 综合设计面试题

**问题8：如何设计一个 React 19 的博客系统？**

答案：
```tsx
// 布局组件 - Server Component
async function BlogLayout({ children }) {
  // 服务端获取导航数据
  const categories = await db.categories.findMany();
  const popularPosts = await db.posts.findMany({
    orderBy: { views: 'desc' },
    take: 5
  });

  return (
    <div className="blog-layout">
      <header>
        <nav>
          {categories.map(cat => (
            <Link key={cat.id} href={`/category/${cat.slug}`}>
              {cat.name}
            </Link>
          ))}
        </nav>
      </header>

      <main>{children}</main>

      <aside>
        <h3>热门文章</h3>
        <PopularPosts posts={popularPosts} />
      </aside>
    </div>
  );
}

// 文章列表 - Server Component
async function PostList({ category }) {
  const posts = await db.posts.findMany({
    where: category ? { categoryId: category.id } : {},
    orderBy: { createdAt: 'desc' }
  });

  return (
    <ul className="post-list">
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </ul>
  );
}

// 文章卡片 - Client Component（需要交互）
'use client';

function PostCard({ post }) {
  const [isLiked, setIsLiked] = useState(false);
  const [optimisticLikes, addOptimistic] = useOptimistic(
    post.likes,
    (likes, delta) => likes + delta
  );

  async function handleLike() {
    addOptimistic(1);
    await toggleLike(post.id);
  }

  return (
    <li className="post-card">
      <h2>{post.title}</h2>
      <p>{post.excerpt}</p>
      <button onClick={handleLike}>
        👍 {optimisticLikes}
      </button>
    </li>
  );
}

// 评论组件 - Client Component
'use client';

function Comments({ postId }) {
  const [newComment, setNewComment] = useState('');
  const [optimisticComments, addOptimistic] = useOptimistic(
    [],
    (comments, comment) => [...comments, comment]
  );

  async function handleSubmit(e) {
    e.preventDefault();
    const optimisticComment = {
      id: crypto.randomUUID(),
      content: newComment,
      createdAt: new Date()
    };

    addOptimistic(optimisticComment);
    setNewComment('');
    await submitComment(postId, optimisticComment.content);
  }

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={newComment}
        onChange={e => setNewComment(e.target.value)}
      />
      <button type="submit">发表评论</button>

      <ul>
        {optimisticComments.map(comment => (
          <li key={comment.id}>{comment.content}</li>
        ))}
      </ul>
    </form>
  );
}
```

**问题9：React 19 的最佳实践有哪些？**

答案：
1. **默认使用服务端组件**：只在需要交互时使用客户端组件
2. **合理拆分组件**：将数据获取和交互分离
3. **使用 Suspense 优化加载**：提供渐进式的加载体验
4. **使用 useOptimistic 提升 UX**：即时反馈用户操作
5. **利用 React Compiler**：自动化优化，减少手动 memoize
6. **渐进式增强**：确保无 JavaScript 时应用仍可工作

---

*本文档最后更新于 2026年3月*