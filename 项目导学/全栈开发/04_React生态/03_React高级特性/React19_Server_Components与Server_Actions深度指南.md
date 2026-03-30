# React 19 Server Components 与 Server Actions 深度指南

## 1. 概述：全栈开发范式的革命

React 19 的 Server Components 和 Server Actions 彻底打破了前后端的界限，实现了**真正的全栈开发范式**。本指南深入解析 Server Components 的底层原理、Server Actions 的执行机制，以及如何构建高性能的全栈应用。

### 1.1 Server Components 的核心价值

| 传统 SSR | Server Components |
|---------|------------------|
| 服务器渲染 HTML | 服务器渲染组件树 |
| 客户端 Hydration | 客户端部分渲染 |
| JS 体积大 | 客户端 JS 体积为 0 |
| 数据获取在组件外 | 数据获取在组件内 |
| 状态管理复杂 | 服务端状态自动管理 |

### 1.2 Server Components vs Client Components

```typescript
// Server Component（默认）
// 此组件在服务器上渲染，不会增加客户端包大小

// ✅ 可以：直接访问数据库、文件系统
// ✅ 可以：使用 async/await
// ✅ 可以：访问环境变量
// ❌ 不可以：使用 useState、useEffect
// ❌ 不可以：使用浏览器 API
// ❌ 不可以：处理用户交互

// Client Component（'use client'）
// 此组件在浏览器中渲染

// ✅ 可以：使用 useState、useEffect
// ✅ 可以：使用浏览器 API
// ✅ 可以：处理用户交互
// ❌ 不可以：直接访问数据库
// ❌ 不可以：访问环境变量
```

---

## 2. Server Components 深入解析

### 2.1 Server Components 的渲染流程

```
1. 客户端发起请求
   ↓
2. 服务器渲染 Server Components
   - 执行所有 async 函数
   - 获取数据库数据
   - 生成 RSC Payload（序列化的组件树）
   ↓
3. 返回 HTML + RSC Payload
   - HTML：静态内容
   - RSC Payload：组件树结构
   ↓
4. 客户端 React 接收
   - 解析 RSC Payload
   - 构建客户端组件树
   - 部分 Hydration（只 Hydration Client Components）
```

### 2.2 Server Components 示例

```typescript
// app/products/page.tsx（Server Component）
import { db } from '@/lib/db';

// Server Component：默认在服务器上执行
async function ProductList() {
  // ✅ 可以直接访问数据库
  const products = await db.products.findMany({
    include: {
      category: true,
      reviews: true,
    },
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

// app/products/[id]/page.tsx（Server Component）
import { notFound } from 'next/navigation';

async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  // ✅ 可以使用 async/await
  const { id } = await params;
  
  // ✅ 可以直接访问数据库
  const product = await db.products.findUnique({
    where: { id },
    include: { category: true, reviews: true },
  });

  if (!product) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto">
      <ProductDetail product={product} />
      <Reviews productId={product.id} />
    </div>
  );
}
```

### 2.3 Server Components 与 Suspense

```typescript
// app/products/page.tsx
import { Suspense } from 'react';

async function ProductList() {
  const products = await fetch('/api/products').then(r => r.json());
  return <div>产品列表</div>;
}

export default function ProductsPage() {
  return (
    <div>
      <Header />
      <Suspense fallback={<div>加载中...</div>}>
        <ProductList />
      </Suspense>
      <Footer />
    </div>
  );
}
```

### 2.4 Server Components 与流式渲染

```typescript
// app/page.tsx
import { Suspense } from 'react';

async function HeavyComponent() {
  // 模拟耗时操作
  await new Promise(resolve => setTimeout(resolve, 2000));
  return <div>重型组件</div>;
}

export default function Page() {
  return (
    <div>
      <Header />
      <Suspense fallback={<div>加载中...</div>}>
        <HeavyComponent />
      </Suspense>
      <Footer />
    </div>
  );
}
```

---

## 3. Server Actions 深入解析

### 3.1 Server Actions 的核心概念

Server Actions 是 React 19 引入的新特性，允许在 Server Components 中直接定义和调用服务端函数。

**核心优势**：
- 无需创建 API 路由
- 类型安全的前后端通信
- 自动处理表单提交
- 支持乐观更新

### 3.2 Server Actions 基础示例

```typescript
// app/actions/user.ts
'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// Server Action：处理用户注册
export async function registerUser(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;

  // ✅ 可以直接访问数据库
  const user = await db.users.create({
    data: { email, password, name },
  });

  // ✅ 可以重新验证缓存
  revalidatePath('/users');

  return { success: true, user };
}

// Server Action：处理用户登录
export async function loginUser(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // 验证用户
  const user = await db.users.findUnique({
    where: { email },
  });

  if (!user || user.password !== password) {
    return { success: false, error: '邮箱或密码错误' };
  }

  // 登录成功
  return { success: true, user };
}

// Server Action：处理用户更新
export async function updateUser(userId: string, formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  const user = await db.users.update({
    where: { id: userId },
    data: { name, email },
  });

  revalidatePath('/users');
  revalidatePath(`/users/${userId}`);

  return { success: true, user };
}

// Server Action：处理用户删除
export async function deleteUser(userId: string) {
  await db.users.delete({
    where: { id: userId },
  });

  revalidatePath('/users');

  return { success: true };
}
```

### 3.3 Server Actions 与表单

```typescript
// app/users/new/page.tsx
import { registerUser } from '@/app/actions/user';

export default function NewUserPage() {
  return (
    <form action={registerUser} className="space-y-4">
      <div>
        <label className="block mb-1">姓名</label>
        <input
          name="name"
          required
          className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
        />
      </div>

      <div>
        <label className="block mb-1">邮箱</label>
        <input
          name="email"
          type="email"
          required
          className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
        />
      </div>

      <div>
        <label className="block mb-1">密码</label>
        <input
          name="password"
          type="password"
          required
          className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
        />
      </div>

      <button
        type="submit"
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        注册
      </button>
    </form>
  );
}
```

### 3.4 Server Actions 与 useActionState

```typescript
// app/login/page.tsx
import { loginUser } from '@/app/actions/user';
import { useActionState } from 'react';

function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    async (previousState: { error?: string }, formData: FormData) => {
      const result = await loginUser(formData);

      if (!result.success) {
        return { error: result.error };
      }

      return { success: true };
    },
    { error: undefined }
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg dark:bg-red-900/20 dark:text-red-400">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="p-3 bg-green-50 text-green-600 rounded-lg dark:bg-green-900/20 dark:text-green-400">
          登录成功！
        </div>
      )}

      <div>
        <label className="block mb-1">邮箱</label>
        <input
          name="email"
          type="email"
          required
          className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
        />
      </div>

      <div>
        <label className="block mb-1">密码</label>
        <input
          name="password"
          type="password"
          required
          className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? '登录中...' : '登录'}
      </button>
    </form>
  );
}
```

### 3.5 Server Actions 与 useOptimistic

```typescript
// app/products/[id]/page.tsx
import { useOptimistic, useState } from 'react';
import { updateProduct } from '@/app/actions/product';

function ProductDetail({ initialProduct }: { initialProduct: Product }) {
  const [product, setProduct] = useState(initialProduct);
  
  // 使用 useOptimistic 进行乐观更新
  const [optimisticProduct, addOptimistic] = useOptimistic(
    product,
    (state, newProduct) => ({
      ...state,
      ...newProduct,
      updatedAt: new Date(),
    })
  );

  const handleUpdate = async (formData: FormData) => {
    const updates = {
      name: formData.get('name') as string,
      price: Number(formData.get('price')),
    };

    // 立即更新 UI（乐观更新）
    addOptimistic(updates);

    // 调用 Server Action
    await updateProduct(product.id, formData);

    // 从 Server Action 获取最新数据
    const result = await updateProduct(product.id, formData);
    setProduct(result);
  };

  return (
    <div>
      <h1>{optimisticProduct.name}</h1>
      <p>价格: ¥{optimisticProduct.price}</p>
      <p>更新时间: {optimisticProduct.updatedAt.toLocaleString()}</p>

      <form action={handleUpdate} className="mt-4 space-y-4">
        <div>
          <label className="block mb-1">名称</label>
          <input
            name="name"
            defaultValue={product.name}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
          />
        </div>

        <div>
          <label className="block mb-1">价格</label>
          <input
            name="price"
            type="number"
            defaultValue={product.price}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
          />
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          更新
        </button>
      </form>
    </div>
  );
}
```

### 3.6 Server Actions 与 revalidateTag

```typescript
// app/actions/post.ts
'use server';

import { db } from '@/lib/db';
import { revalidateTag } from 'next/cache';

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  await db.posts.create({
    data: { title, content },
  });

  // 重新验证特定标签的缓存
  revalidateTag('posts');
}

export async function updatePost(id: string, formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  await db.posts.update({
    where: { id },
    data: { title, content },
  });

  // 重新验证特定标签的缓存
  revalidateTag('posts');
  revalidateTag(`post-${id}`);
}

export async function deletePost(id: string) {
  await db.posts.delete({
    where: { id },
  });

  // 重新验证特定标签的缓存
  revalidateTag('posts');
}
```

---

## 4. Server Components 与 Client Components 的组合

### 4.1 组合模式示例

```typescript
// app/products/page.tsx（Server Component）
import { ProductList } from '@/components/ProductList';

export default function ProductsPage() {
  return (
    <div>
      <Header />
      <ProductList />
      <Footer />
    </div>
  );
}

// components/ProductList.tsx（Server Component）
import { db } from '@/lib/db';
import { ProductCard } from '@/components/ProductCard';

async function ProductList() {
  const products = await db.products.findMany();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

// components/ProductCard.tsx（Client Component）
'use client';

import { useState } from 'react';

export function ProductCard({ product }: { product: Product }) {
  const [liked, setLiked] = useState(false);

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-bold">{product.name}</h3>
      <p className="text-gray-600">¥{product.price}</p>
      
      <button
        onClick={() => setLiked(!liked)}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        {liked ? '❤️ 已收藏' : '🤍 收藏'}
      </button>
    </div>
  );
}
```

### 4.2 传递 Server Component 到 Client Component

```typescript
// app/products/[id]/page.tsx（Server Component）
import { ProductDetail } from '@/components/ProductDetail';

async function ProductPage({ params }: { params: { id: string } }) {
  const product = await db.products.findUnique({
    where: { id: params.id },
  });

  if (!product) {
    notFound();
  }

  return <ProductDetail product={product} />;
}

// components/ProductDetail.tsx（Client Component）
'use client';

import { useState } from 'react';

export function ProductDetail({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);

  return (
    <div>
      <h1>{product.name}</h1>
      <p>¥{product.price}</p>
      
      <div className="flex items-center gap-4 mt-4">
        <button
          onClick={() => setQuantity(q => Math.max(1, q - 1))}
          className="px-4 py-2 border rounded-lg"
        >
          -
        </button>
        <span>{quantity}</span>
        <button
          onClick={() => setQuantity(q => q + 1)}
          className="px-4 py-2 border rounded-lg"
        >
          +
        </button>
      </div>

      <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
        加入购物车
      </button>
    </div>
  );
}
```

---

## 5. Server Components 最佳实践

### 5.1 组件设计原则

```typescript
// ✅ 好的设计：Server Components 用于数据获取
async function ProductList() {
  const products = await db.products.findMany();
  return <div>产品列表</div>;
}

// ✅ 好的设计：Client Components 用于交互
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}

// ❌ 不好的设计：在 Server Components 中使用状态
async function BadComponent() {
  const [count, setCount] = useState(0); // ❌ Server Components 不能使用 useState
  return <div>{count}</div>;
}

// ❌ 不好的设计：在 Client Components 中直接访问数据库
function BadComponent() {
  const products = await db.products.findMany(); // ❌ Client Components 不能使用 await
  return <div>产品列表</div>;
}
```

### 5.2 性能优化

```typescript
// 1. 使用 Server Components 减少客户端 JS 体积
// ✅ 好的设计
async function ProductList() {
  const products = await db.products.findMany();
  return <div>产品列表</div>; // 零客户端 JS
}

// 2. 使用 Suspense 进行流式渲染
function Page() {
  return (
    <div>
      <Suspense fallback={<div>加载中...</div>}>
        <HeavyComponent />
      </Suspense>
    </div>
  );
}

// 3. 使用 useOptimistic 进行乐观更新
function Form() {
  const [optimisticValue, addOptimistic] = useOptimistic(
    value,
    (state, newValue) => newValue
  );

  return <div>{optimisticValue}</div>;
}
```

### 5.3 错误处理

```typescript
// 1. 使用 try-catch 处理 Server Action 错误
async function registerUser(formData: FormData) {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const user = await db.users.create({
      data: { email, password },
    });

    return { success: true, user };
  } catch (error) {
    return { success: false, error: '注册失败' };
  }
}

// 2. 使用 useActionState 处理表单错误
function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    async (previousState: { error?: string }, formData: FormData) => {
      try {
        const result = await loginUser(formData);
        return result;
      } catch (error) {
        return { success: false, error: '登录失败' };
      }
    },
    { error: undefined }
  );

  return (
    <form action={formAction}>
      {state?.error && <div>{state.error}</div>}
      {/* 表单内容 */}
    </form>
  );
}

// 3. 使用 Error Boundary 捕获 Server Component 错误
class ErrorBoundary extends React.Component<{
  children: ReactNode;
  fallback: ReactNode;
}> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

function Page() {
  return (
    <ErrorBoundary fallback={<div>出错了</div>}>
      <ProductList />
    </ErrorBoundary>
  );
}
```

---

## 6. Server Actions 高级技巧

### 6.1 Server Actions 与文件上传

```typescript
// app/actions/upload.ts
'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function uploadImage(formData: FormData) {
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
```

### 6.2 Server Actions 与邮件发送

```typescript
// app/actions/email.ts
'use server';

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendContactForm(formData: FormData) {
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

### 6.3 Server Actions 与第三方 API

```typescript
// app/actions/stripe.ts
'use server';

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createCheckoutSession(formData: FormData) {
  const priceId = formData.get('priceId') as string;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cancel`,
    });

    return { success: true, url: session.url };
  } catch (error) {
    return { success: false, error: '创建支付会话失败' };
  }
}
```

---

## 7. Server Components 与缓存

### 7.1 数据缓存

```typescript
// app/products/page.tsx
import { cache } from 'react';

// 创建缓存的数据库查询
const getProducts = cache(async () => {
  const products = await db.products.findMany();
  return products;
});

async function ProductList() {
  // 第一次请求会执行数据库查询
  // 后续请求会从缓存中获取
  const products = await getProducts();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### 7.2 路由缓存

```typescript
// app/products/[id]/page.tsx
import { notFound } from 'next/navigation';
import { cache } from 'react';

// 创建缓存的数据库查询
const getProduct = cache(async (id: string) => {
  const product = await db.products.findUnique({
    where: { id },
  });

  if (!product) {
    notFound();
  }

  return product;
});

async function ProductPage({ params }: { params: { id: string } }) {
  // 第一次请求会执行数据库查询
  // 后续请求会从缓存中获取
  const product = await getProduct(params.id);

  return <ProductDetail product={product} />;
}
```

---

## 8. Server Components 与性能监控

### 8.1 使用 React DevTools

React DevTools 4.0+ 支持 Server Components 的调试：

1. 安装 React DevTools
2. 打开浏览器开发者工具
3. 切换到 React DevTools 标签
4. 查看 Server Components 和 Client Components 的树形结构

### 8.2 使用 Next.js DevTools

Next.js 15+ 提供了内置的性能监控工具：

1. 打开浏览器开发者工具
2. 切换到 Next.js 标签
3. 查看 Server Components 的渲染时间
4. 查看数据获取的性能

---

## 9. Server Components 最佳实践总结

| 场景 | 推荐方案 | 说明 |
|------|---------|------|
| **数据获取** | Server Components | 直接在组件内获取数据 |
| **用户交互** | Client Components | 使用 useState、useEffect |
| **表单提交** | Server Actions | 类型安全的前后端通信 |
| **文件上传** | Server Actions | 直接在服务端处理文件 |
| **第三方 API** | Server Actions | 避免暴露 API 密钥 |
| **性能优化** | Suspense + Server Components | 流式渲染、减少客户端 JS |

**最佳实践**：
1. 优先使用 Server Components 减少客户端 JS 体积
2. 使用 Server Actions 处理表单提交和数据修改
3. 使用 Suspense 进行流式渲染
4. 使用 useOptimistic 进行乐观更新
5. 使用 revalidateTag 精准控制缓存
6. 使用 try-catch 处理 Server Action 错误

---
*本文档持续更新，最后更新于 2026 年 3 月*
