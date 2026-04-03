# React 19 深度教程

## 一、React 19 概述

### 1.1 React 19 核心特性概览

React 19 是 React 团队于 2024 年发布的重大版本更新，标志着 React 从纯客户端框架向**全栈框架**的革命性演进。本教程将深入解析 React 19 的所有核心特性、新 API、性能优化和最佳实践。

| 特性分类 | 核心特性 | 重要性 | 说明 |
|---------|---------|--------|------|
| **服务端渲染** | Server Components | ⭐⭐⭐⭐⭐ | 服务器端组件，零客户端 JavaScript |
| **服务端操作** | Server Actions | ⭐⭐⭐⭐⭐ | 服务端函数，无需 API 路由 |
| **编译器优化** | React Compiler | ⭐⭐⭐⭐⭐ | 自动记忆化，消除手动优化需求 |
| **异步处理** | use() Hook | ⭐⭐⭐⭐⭐ | 统一的异步数据获取 Hook |
| **表单处理** | useActionState | ⭐⭐⭐⭐ | 表单状态管理、异步操作 |
| **乐观更新** | useOptimistic | ⭐⭐⭐⭐ | 乐观更新、用户体验优化 |
| **表单状态** | useFormStatus | ⭐⭐⭐⭐ | 表单提交状态管理 |
| **文档元数据** | Document Metadata | ⭐⭐⭐ | 组件内直接设置元数据 |
| **样式表** | Stylesheets | ⭐⭐⭐ | 样式表自动管理 |

### 1.2 React 19 版本对比

| 特性 | React 18 | React 19 |
|------|---------|---------|
| **服务端组件** | ❌ 实验性 | ✅ 稳定版 |
| **服务端操作** | ❌ 无 | ✅ 内置支持 |
| **自动批处理** | ✅ 基础支持 | ✅ 增强支持 |
| **并发特性** | ✅ 基础支持 | ✅ 完整支持 |
| **编译器** | ❌ 无 | ✅ React Compiler |
| **use() Hook** | ❌ 无 | ✅ 内置支持 |
| **表单增强** | ⚠️ 基础 | ✅ 完整增强 |

---

## 二、Server Components（服务端组件）

### 2.1 概念解析

Server Components（服务端组件）是一种在服务器端渲染的 React 组件，它们：

- **不会被打包到客户端 JavaScript 中**
- **可以直接访问服务端资源**（数据库、文件系统等）
- **零客户端 JavaScript 开销**
- **支持流式渲染**

#### 服务端组件 vs 客户端组件

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

### 2.2 服务端组件示例

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

### 2.3 客户端组件示例

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

### 2.4 组合模式

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

### 2.5 服务端组件最佳实践

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

---

## 三、Server Actions（服务端操作）

### 3.1 概念解析

Server Actions 是在服务器上执行的函数，可以直接在组件中定义和调用，无需创建 API 路由。

**核心优势**：
- 无需创建 API 路由
- 类型安全的前后端通信
- 自动处理表单提交
- 支持乐观更新

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

### 3.5 Server Actions 高级技巧

```tsx
// 文件上传
async function uploadImage(formData: FormData) {
  'use server';

  const file = formData.get('file') as File;

  if (!file) {
    return { success: false, error: '请选择文件' };
  }

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    return { success: false, error: '请选择图片文件' };
  }

  // 验证文件大小（限制 5MB）
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: '文件大小不能超过 5MB' };
  }

  // 读取文件内容
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // 保存到数据库
  const image = await db.images.create({
    data: {
      filename: file.name,
      contentType: file.type,
      size: file.size,
      data: buffer,
    },
  });

  revalidatePath('/images');

  return { success: true, image };
}

// 邮件发送
async function sendContactForm(formData: FormData) {
  'use server';

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const message = formData.get('message') as string;

  try {
    await resend.emails.send({
      from: 'Contact Form <onboarding@resend.dev>',
      to: 'admin@example.com',
      subject: `新消息来自 ${name}`,
      html: `
        <p>姓名: ${name}</p>
        <p>邮箱: ${email}</p>
        <p>消息: ${message}</p>
      `,
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: '发送失败' };
  }
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

## 八、React 19 核心 API 详解

### 8.1 useId

```tsx
import { useId } from 'react';

// 场景 1：表单元素
function Form() {
  const id = useId();

  return (
    <div>
      <label htmlFor={id}>姓名</label>
      <input id={id} type="text" />
    </div>
  );
}

// 场景 2：多个表单元素
function ComplexForm() {
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();

  return (
    <form>
      <div>
        <label htmlFor={nameId}>姓名</label>
        <input id={nameId} type="text" />
      </div>
      <div>
        <label htmlFor={emailId}>邮箱</label>
        <input id={emailId} type="email" />
      </div>
      <div>
        <label htmlFor={passwordId}>密码</label>
        <input id={passwordId} type="password" />
      </div>
    </form>
  );
}

// 场景 3：可访问性
function Accordion() {
  const panelId = useId();

  return (
    <div>
      <button aria-expanded="true" aria-controls={panelId}>
        点击展开
      </button>
      <div id={panelId} aria-labelledby={panelId}>
        这里是内容
      </div>
    </div>
  );
}
```

### 8.2 useDeferredValue

```tsx
import { useState, useDeferredValue } from 'react';

function SearchResults() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="搜索..."
      />

      {/* 延迟渲染结果 */}
      <Results query={deferredQuery} />
    </div>
  );
}

// 与 useTransition 对比
function SearchWithTransition() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    startTransition(() => {
      setQuery(e.target.value);
    });
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="搜索..."
      />

      {isPending && <div>加载中...</div>}
      <Results query={query} />
    </div>
  );
}
```

### 8.3 useTransition

```tsx
import { useState, useTransition } from 'react';

function TabContainer() {
  const [activeTab, setActiveTab] = useState('tab1');
  const [isPending, startTransition] = useTransition();

  const handleTabChange = (tab: string) => {
    startTransition(() => {
      setActiveTab(tab);
    });
  };

  return (
    <div>
      <div className="tabs">
        <button
          onClick={() => handleTabChange('tab1')}
          className={activeTab === 'tab1' ? 'active' : ''}
        >
          标签1
        </button>
        <button
          onClick={() => handleTabChange('tab2')}
          className={activeTab === 'tab2' ? 'active' : ''}
        >
          标签2
        </button>
      </div>

      {isPending && <div>加载中...</div>}

      {activeTab === 'tab1' && <Tab1Content />}
      {activeTab === 'tab2' && <Tab2Content />}
    </div>
  );
}
```

### 8.4 useSyncExternalStore

```tsx
import { useSyncExternalStore } from 'react';

// 外部存储示例
const store = {
  state: { count: 0 },
  listeners: [] as (() => void)[],
  
  subscribe(callback: () => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  },
  
  dispatch(action: { type: 'increment' | 'decrement' }) {
    if (action.type === 'increment') {
      this.state.count++;
    } else if (action.type === 'decrement') {
      this.state.count--;
    }
    
    this.listeners.forEach(listener => listener());
  }
};

// 自定义 Hook
function useStore() {
  return useSyncExternalStore(
    store.subscribe,
    () => store.state,
    () => ({ count: 0 }) // 服务端渲染的回退值
  );
}

// 使用
function Counter() {
  const { count } = useStore();

  return (
    <div>
      <p>计数: {count}</p>
      <button onClick={() => store.dispatch({ type: 'increment' })}>
        增加
      </button>
      <button onClick={() => store.dispatch({ type: 'decrement' })}>
        减少
      </button>
    </div>
  );
}
```

---

## 九、性能优化

### 9.1 并发渲染

```tsx
import { useState, useTransition } from 'react';

function LargeList() {
  const [items, setItems] = useState<Item[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleLoadItems = () => {
    startTransition(() => {
      // 模拟大量数据加载
      const newItems = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `项目 ${i}`
      }));
      setItems(newItems);
    });
  };

  return (
    <div>
      <button onClick={handleLoadItems} disabled={isPending}>
        {isPending ? '加载中...' : '加载项目'}
      </button>

      <ul>
        {items.slice(0, 50).map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 9.2 自动批处理

```tsx
import { useState } from 'react';

function BatchedUpdates() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');

  const handleUpdate = () => {
    // React 18+ 自动批处理：只触发一次重渲染
    setCount(c => c + 1);
    setName('新名字');
    // 只重渲染一次，而不是两次
  };

  return (
    <div>
      <p>计数: {count}</p>
      <p>姓名: {name}</p>
      <button onClick={handleUpdate}>更新</button>
    </div>
  );
}
```

### 9.3 内存优化

```tsx
// 使用 useMemo 避免不必要的对象创建
function ExpensiveComponent({ data }) {
  // ✅ 正确：使用 useMemo 缓存计算结果
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      processed: true,
      timestamp: Date.now()
    }));
  }, [data]);

  return <div>{processedData.length}</div>;
}

// 使用 useCallback 避免函数重新创建
function ParentComponent() {
  // ✅ 正确：使用 useCallback 缓存函数
  const handleClick = useCallback((id: string) => {
    console.log('点击:', id);
  }, []);

  return <ChildComponent onClick={handleClick} />;
}
```

### 9.4 渲染优化

```tsx
// 使用 React.memo 避免不必要的重渲染
const MemoizedComponent = React.memo(({ data }) => {
  console.log('渲染组件');
  return <div>{data}</div>;
});

// 使用 useMemo 缓存复杂计算
function ComplexCalculation({ input }) {
  const result = useMemo(() => {
    // 模拟复杂计算
    let sum = 0;
    for (let i = 0; i < 1000000; i++) {
      sum += input * i;
    }
    return sum;
  }, [input]);

  return <div>结果: {result}</div>;
}

// 使用 useCallback 缓存回调函数
function FormComponent() {
  const handleSubmit = useCallback((data) => {
    console.log('提交:', data);
  }, []);

  return <Form onSubmit={handleSubmit} />;
}
```

---

## 十、最佳实践

### 10.1 组件设计原则

```tsx
// ✅ 好的设计：服务端组件获取数据，客户端组件处理交互
// 服务端组件：数据获取、SEO 关键内容
// 客户端组件：交互、状态管理

// 1. 合理划分服务端/客户端组件
// 服务端组件：获取数据、SEO 关键内容
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

### 10.2 状态管理最佳实践

```tsx
// 使用 Zustand 进行状态管理
import { create } from 'zustand';

interface Store {
  count: number;
  increment: () => void;
  decrement: () => void;
}

export const useStore = create<Store>((set) => ({
  count: 0,
  increment: () => set(state => ({ count: state.count + 1 })),
  decrement: () => set(state => ({ count: state.count - 1 })),
}));

// 组件中使用
function Counter() {
  const { count, increment, decrement } = useStore();
  
  return (
    <div>
      <p>计数: {count}</p>
      <button onClick={increment}>增加</button>
      <button onClick={decrement}>减少</button>
    </div>
  );
}
```

### 10.3 表单处理最佳实践

```tsx
// 使用 React Hook Form
import { useForm } from 'react-hook-form';

interface FormData {
  email: string;
  password: string;
}

function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>邮箱</label>
        <input {...register('email', { required: '邮箱必填' })} />
        {errors.email && <span>{errors.email.message}</span>}
      </div>

      <div>
        <label>密码</label>
        <input 
          type="password" 
          {...register('password', { 
            required: '密码必填',
            minLength: 6
          })} 
        />
        {errors.password && <span>{errors.password.message}</span>}
      </div>

      <button type="submit">登录</button>
    </form>
  );
}
```

### 10.4 数据获取最佳实践

```tsx
// 使用 React Query
import { useQuery, useMutation, QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserList />
    </QueryClientProvider>
  );
}

function UserList() {
  // 获取数据
  const { data, error, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then(res => res.json())
  });

  // 创建数据
  const mutation = useMutation({
    mutationFn: (user: User) => 
      fetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(user)
      }).then(res => res.json())
  });

  if (isLoading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <ul>
        {data.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>

      <button onClick={() => mutation.mutate({ name: '新用户' })}>
        添加用户
      </button>
    </div>
  );
}
```

---

## 十一、实战案例

### 11.1 Todo 应用

```tsx
// ==================== Store ====================
// stores/useTodoStore.ts
import { create } from 'zustand';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

interface TodoStore {
  todos: Todo[];
  addTodo: (title: string) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
}

export const useTodoStore = create<TodoStore>((set) => ({
  todos: [],
  
  addTodo: (title) => {
    set(state => ({
      todos: [...state.todos, { id: Date.now().toString(), title, completed: false }]
    }));
  },
  
  toggleTodo: (id) => {
    set(state => ({
      todos: state.todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    }));
  },
  
  removeTodo: (id) => {
    set(state => ({
      todos: state.todos.filter(todo => todo.id !== id)
    }));
  }
}));
```

```tsx
// ==================== Todo 组件 ====================
// components/TodoApp.tsx
'use client';

import { useState } from 'react';
import { useTodoStore } from '@/stores/useTodoStore';

function TodoApp() {
  const { todos, addTodo, toggleTodo, removeTodo } = useTodoStore();
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      addTodo(input.trim());
      setInput('');
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Todo 应用</h1>
      
      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="添加新的待办事项"
          className="w-full px-4 py-2 border rounded-lg"
        />
      </form>

      <ul className="space-y-2">
        {todos.map(todo => (
          <li key={todo.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
              className="w-5 h-5"
            />
            <span className={todo.completed ? 'line-through text-gray-500' : ''}>
              {todo.title}
            </span>
            <button
              onClick={() => removeTodo(todo.id)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              删除
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TodoApp;
```

### 11.2 博客系统

```tsx
// ==================== 服务端组件 ====================
// app/blog/page.tsx
import { Suspense } from 'react';
import { BlogList } from '@/components/blog/BlogList';
import { BlogSidebar } from '@/components/blog/BlogSidebar';

export default function BlogPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Suspense fallback={<div>加载中...</div>}>
            <BlogList />
          </Suspense>
        </div>
        
        <div>
          <BlogSidebar />
        </div>
      </div>
    </div>
  );
}
```

```tsx
// ==================== 客户端组件 ====================
// components/blog/BlogList.tsx
'use client';

import { useState, useTransition } from 'react';
import { useBlogStore } from '@/stores/useBlogStore';

export function BlogList() {
  const { blogs, loading, error } = useBlogStore();
  const [filter, setFilter] = useState('all');
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (filter: string) => {
    startTransition(() => {
      setFilter(filter);
    });
  };

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;

  const filteredBlogs = filter === 'all' 
    ? blogs 
    : blogs.filter(blog => blog.category === filter);

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => handleFilterChange('all')}
          className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          全部
        </button>
        <button
          onClick={() => handleFilterChange('tech')}
          className={`px-4 py-2 rounded-lg ${filter === 'tech' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          技术
        </button>
        <button
          onClick={() => handleFilterChange('life')}
          className={`px-4 py-2 rounded-lg ${filter === 'life' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          生活
        </button>
      </div>

      <div className="space-y-4">
        {filteredBlogs.map(blog => (
          <div key={blog.id} className="p-4 border rounded-lg">
            <h2 className="text-xl font-bold mb-2">{blog.title}</h2>
            <p className="text-gray-600 mb-2">{blog.excerpt}</p>
            <span className="text-sm text-gray-500">{blog.category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 11.3 电商系统

```tsx
// ==================== 购物车 Store ====================
// stores/useCartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => {
        set(state => {
          const existingIndex = state.items.findIndex(i => i.productId === item.productId);
          
          if (existingIndex > -1) {
            const newItems = state.items.map((i, index) =>
              index === existingIndex
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            );
            return { items: newItems };
          }
          
          return {
            items: [...state.items, { ...item, id: Date.now().toString() }]
          };
        });
      },
      
      removeItem: (id) => {
        set(state => ({
          items: state.items.filter(item => item.id !== id)
        }));
      },
      
      updateQuantity: (id, quantity) => {
        set(state => ({
          items: state.items.map(item =>
            item.id === id ? { ...item, quantity } : item
          )
        }));
      },
      
      clearCart: () => {
        set({ items: [] });
      },
      
      getTotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      }
    }),
    {
      name: 'cart-storage'
    }
  )
);
```

```tsx
// ==================== 购物车组件 ====================
// components/cart/Cart.tsx
'use client';

import { useCartStore } from '@/stores/useCartStore';

export function Cart() {
  const { items, removeItem, updateQuantity, getTotal } = useCartStore();

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">购物车</h1>
      
      {items.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">购物车是空的</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <img src={item.image} alt={item.name} className="w-20 h-20 object-cover" />
                
                <div className="flex-1">
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-gray-500">¥{item.price.toFixed(2)}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                    className="w-8 h-8 border rounded"
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 border rounded"
                  >
                    +
                  </button>
                </div>
                
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-4 border rounded-lg">
            <div className="flex justify-between text-lg font-bold">
              <span>总计</span>
              <span>¥{getTotal().toFixed(2)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

---

## 十二、迁移指南

### 12.1 从 React 18 迁移

```bash
# 更新依赖
npm install react@19 react-dom@19

# 更新类型定义
npm install @types/react@19 @types/react-dom@19
```

### 12.2 废弃的 API

| 废弃 API | 替代方案 |
|----------|----------|
| `propTypes` | TypeScript 类型定义 |
| `defaultProps` | 函数参数默认值 |
| `contextTypes` | `contextType` 或 `useContext` |
| `string refs` | `createRef` 或 `useRef` |
| `findDOMNode` | DOM 引用 |

### 12.3 代码迁移示例

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

## 十三、总结

React 19 是 React 历史上最重要的版本之一，它带来了：

1. **Server Components** - 服务端渲染的革命性改进
2. **Server Actions** - 简化全栈开发流程
3. **use() Hook** - 统一的异步数据处理
4. **React Compiler** - 自动性能优化
5. **表单增强 Hooks** - 更好的表单处理体验

掌握 React 19 的新特性，将帮助你构建更高效、更现代的 Web 应用。

---

## 十四、学习资源

### 14.1 官方文档

- [React 官方文档](https://react.dev/)
- [Next.js 官方文档](https://nextjs.org/docs)
- [React Query 官方文档](https://tanstack.com/query/latest)
- [React Hook Form 官方文档](https://react-hook-form.com/)

### 14.2 社区资源

- [Reactiflux Discord](https://reactiflux.com/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/react)
- [GitHub Issues](https://github.com/facebook/react/issues)

---

*本文档由 Qwen Code 生成，最后更新于 2026 年 3 月*
