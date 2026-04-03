# 2026年前端框架技术全景指南

## 目录

1. [React 19 核心新特性](#1-react-19-核心新特性)
2. [Next.js 16 深度解析](#2-nextjs-16-深度解析)
3. [Vue 4 发展现状](#3-vue-4-发展现状)
4. [框架对比与选型](#4-框架对比与选型)
5. [实战练习](#5-实战练习)

---

## 1. React 19 核心新特性

### 1.1 服务器组件（Server Components）

服务器组件是React 19最大的架构变革，它允许组件在服务端渲染并直接将HTML发送到客户端。

**设计原理**：
- 传统的React组件全部在客户端执行，需要下载JavaScript bundle
- Server Components允许组件在服务端执行，只发送最终HTML
- 减少了客户端JavaScript体积，首屏加载速度大幅提升
- 可以直接访问服务端数据源（数据库、文件系统），无需API调用

**工作原理**：

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Server Components架构                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   服务端（Server）                                                   │
│   ┌────────────────────────────────────────────────────────────┐   │
│   │  async function UserList() {                               │   │
│   │    // 直接访问数据库，无需API                               │   │
│   │    const users = await db.users.findMany();                │   │
│   │                                                            │   │
│   │    return (                                                │   │
│   │      <ul>{users.map(...)}</ul>    ← 只发送HTML            │   │
│   │    );                                                       │   │
│   │  }                                                          │   │
│   └────────────────────────────────────────────────────────────┘   │
│                              ↓                                      │
│                        HTML字符串                                    │
│                              ↓                                      │
│   客户端（Client）                                                  │
│   ┌────────────────────────────────────────────────────────────┐   │
│   │  <ul>                                                       │   │
│   │    <li>用户1</li>   ← 无需下载组件JS代码                    │   │
│   │    <li>用户2</li>                                          │   │
│   │  </ul>                                                      │   │
│   └────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**代码示例**：

```tsx
// 服务器组件示例
// 文件命名规范：Xxx.server.tsx（可选约定）

// 这是一个服务器组件，默认在服务端运行
// 特点：可以await任何异步操作，直接访问数据库
async function UserList() {
  // 可以直接在这里执行数据库查询
  const users = await db.users.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  // 返回JSX，被序列化为HTML发送到客户端
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>
          <UserAvatar user={user} />
          <span>{user.name}</span>
        </li>
      ))}
    </ul>
  );
}

// 服务器组件不能使用：
// - useState（状态管理）
// - useEffect（副作用）
// - 浏览器API
// - 事件监听器

// 客户端组件需要使用 'use client' 指令
'use client';
function LikeButton({ initialLikes }) {
  // 客户端组件：可以访问所有React Hooks和浏览器API
  const [likes, setLikes] = useState(initialLikes);

  return (
    <button onClick={() => setLikes(l => l + 1)}>
      👍 {likes}
    </button>
  );
}

// 混合使用：服务器组件包裹客户端组件
export default async function PostPage({ params }) {
  // 服务器端获取数据
  const post = await getPost(params.id);

  return (
    <article>
      <h1>{post.title}</h1>
      {/* 服务器组件获取数据，传递给客户端组件 */}
      <LikeButton initialLikes={post.likes} />
    </article>
  );
}
```

**核心优势**：
- 减少客户端JavaScript体积（大型应用可减少50%+的JS）
- 首屏加载速度显著提升
- 直接访问服务端数据源，无需创建API端点
- 更好的SEO支持（服务端渲染的内容更易被搜索引擎索引）
- 敏感逻辑（如数据库访问、密钥）只在服务端执行，提高安全性

```tsx
// 服务器组件示例
// 文件命名规范：Xxx.server.tsx

// 这是一个服务器组件，默认在服务端运行
async function UserList() {
  // 可以直接在这里执行数据库查询
  const users = await db.users.findMany();

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

// 客户端组件需要使用 'use client' 指令
'use client';
function LikeButton() {
  const [likes, setLikes] = useState(0);

  return (
    <button onClick={() => setLikes(l => l + 1)}>
      👍 {likes}
    </button>
  );
}
```

**核心优势**：
- 减少客户端JavaScript体积
- 首屏加载速度提升
- 直接访问服务端数据源
- 更好的SEO支持

### 1.2 Server Actions

Server Actions允许客户端直接调用服务端函数，无需创建API端点。这种"后端即服务"的模式大幅简化了全栈开发。

**工作原理**：

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Server Actions执行流程                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. 表单提交                                                        │
│     <form action={createPost}>                                       │
│              ↓                                                       │
│  2. React生成POST请求（自动序列化FormData）                          │
│              ↓                                                       │
│  3. 服务端执行函数                                                  │
│     async function createPost(formData) {                            │
│       const title = formData.get('title');                          │
│       return await db.posts.create({ title });  ← 直接写数据库       │
│     }                                                               │
│              ↓                                                       │
│  4. 自动重新验证相关数据（revalidatePath）                           │
│              ↓                                                       │
│  5. React自动更新UI（乐观更新或等待响应）                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**高级用法示例**：

```tsx
// 定义服务端操作
'use server';

// 基本用法
async function createPost(formData: FormData) {
  const title = formData.get('title');
  const content = formData.get('content');

  // 直接在服务端执行数据库操作
  const post = await db.posts.create({
    data: { title, content, authorId: getCurrentUser().id }
  });

  // 重新验证页面数据（让Server Components重新获取最新数据）
  revalidatePath('/posts');
  revalidatePath('/');

  return post;
}

// 带验证的Server Action
async function updatePost(postId: string, formData: FormData) {
  'use server';

  // 验证用户权限
  const user = await getCurrentUser();
  const post = await db.posts.findUnique({ where: { id: postId } });

  if (!post || post.authorId !== user.id) {
    throw new Error('没有权限修改此文章');
  }

  // 验证输入数据
  const title = formData.get('title');
  if (typeof title !== 'string' || title.length < 1) {
    return { error: '标题不能为空' };
  }

  // 更新数据
  const updated = await db.posts.update({
    where: { id: postId },
    data: { title }
  });

  revalidatePath(`/posts/${postId}`);
  return { success: true, post: updated };
}

// 乐观更新配合Server Action
'use client';
import { useOptimistic, useTransition } from 'react';

function LikeButton({ postId, initialLikes }) {
  const [isPending, startTransition] = useTransition();

  // useOptimistic实现乐观更新
  const [optimisticLikes, addOptimistic] = useOptimistic(
    initialLikes,
    (state, newValue) => state + newValue
  );

  async function handleLike() {
    // 立即更新UI
    addOptimistic(1);

    // 发送到服务端
    startTransition(async () => {
      await likePost(postId);
    });
  }

  return (
    <button onClick={handleLike} disabled={isPending}>
      👍 {optimisticLikes}
    </button>
  );
}
```

**表单状态管理新API**：

```tsx
// useActionState（原useFormState）- 管理表单状态
import { useActionState } from 'react';

async function submitForm(prevState, formData) {
  // prevState：上一次提交的状态
  // formData：表单数据

  const name = formData.get('name');
  const email = formData.get('email');

  // 表单验证
  if (!name || !email) {
    return { error: '请填写所有必填项', success: false };
  }

  try {
    await db.user.create({ data: { name, email } });
    revalidatePath('/users');
    return { error: null, success: true, message: '创建成功！' };
  } catch (e) {
    return { error: '创建失败：' + e.message, success: false };
  }
}

function CreateUserForm() {
  // useActionState：自动管理loading状态和错误状态
  const [state, formAction, isPending] = useActionState(submitForm, null);

  return (
    <form action={formAction}>
      <input name="name" placeholder="用户名" />
      <input name="email" placeholder="邮箱" />

      {/* 显示错误信息 */}
      {state?.error && <p style={{ color: 'red' }}>{state.error}</p>}

      {/* 显示成功信息 */}
      {state?.success && <p style={{ color: 'green' }}>{state.message}</p>}

      <button type="submit" disabled={isPending}>
        {isPending ? '提交中...' : '提交'}
      </button>
    </form>
  );
}

// useFormStatus - 获取表单提交状态
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? '提交中...' : '提交'}
    </button>
  );
}

function FormWithStatus() {
  return (
    <form action={async () => { /* ... */ }}>
      <input name="email" />
      {/* SubmitButton作为独立组件可以使用useFormStatus */}
      <SubmitButton />
    </form>
  );
}
```

### 1.3 React Compiler

React Compiler（原React Forget）是一个革命性的优化工具，它可以自动分析组件依赖，实现最优渲染，开发者无需手动优化。

**核心原理**：

```
┌─────────────────────────────────────────────────────────────────────┐
│                       React Compiler工作原理                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  开发者编写代码：                                                    │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  function Component({ data }) {                            │   │
│  │    const [count, setCount] = useState(0);                  │   │
│  │                                                            │   │
│  │    return (                                                 │   │
│  │      <div onClick={() => setCount(c => c + 1)}>           │   │
│  │        <HeavyList items={data.items} />  ← 每次点击都重渲染？│   │
│  │      </div>                                                 │   │
│  │    );                                                       │   │
│  │  }                                                          │   │
│  └────────────────────────────────────────────────────────────┘   │
│                              ↓                                      │
│                    React Compiler自动分析                            │
│                              ↓                                      │
│  编译优化后：                                                        │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  function Component({ data }) {                            │   │
│  │    const $ = useState(0);                                  │   │
│  │                                                            │   │
│  │    // Compiler自动添加memoization                          │   │
│  │    if (!($[0].data === data)) {                           │   │
│  │      const nextValue = $useState(0);                      │   │
│  │      $[0] = nextValue;                                    │   │
│  │      $[1] = nextValue[1];                                 │   │
│  │    }                                                       │   │
│  │                                                            │   │
│  │    // data.items变化时才重新渲染HeavyList                  │   │
│  │    return <HeavyList items={data.items} />;                │   │
│  │  }                                                          │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**使用配置**：

```tsx
// babel.config.js 或 tsconfig.json
// 启用React Compiler
{
  "plugins": [
    ["babel-plugin-react-compiler", {
      "target": "19"  // React版本
    }]
  ]
}

// next.config.js (Next.js项目)
module.exports = {
  experimental: {
    // Next.js 16内置Compiler支持
    reactCompiler: true
  }
};
```

**使用示例**：

```tsx
// 传统方式：手动优化（需要开发者手动添加优化）
const MemoizedComponent = React.memo(function Component({ data, onClick }) {
  return <div onClick={onClick}>{data.title}</div>;
});

// 使用React.memo + useCallback手动优化
const Parent = () => {
  const [count, setCount] = useState(0);

  // 必须用useCallback包裹，否则onClick每次都是新函数
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);

  return (
    <MemoizedComponent
      data={someData}    // 只在data变化时重渲染
      onClick={handleClick}  // 只在handleClick变化时重渲染
    />
  );
};

// React Compiler 自动处理优化
// 只需编写普通组件，编译器自动分析依赖并添加最优memoization
function Component({ data, onClick }) {
  // Compiler自动识别：
  // - data是props，需要比较
  // - onClick是事件处理器，需要稳定引用
  // - 只有当data真正变化时才重新渲染
  return <div onClick={onClick}>{data.title}</div>;
}

// 使用useMemoCache（Compiler生成的hook）示例
// 这是Compiler实际生成的代码逻辑
function Component({ data }) {
  // Compiler自动生成缓存hook
  let cache = useMemoCache(1);

  if (cache[0] !== data) {
    cache[0] = data;
    cache[1] = computeExpensiveValue(data);  // 昂贵计算只执行一次
  }

  return <div>{cache[1]}</div>;
}
```

**Compiler最佳实践**：

```tsx
// ✅ 正确：遵循React规则，Compiler能自动优化
function GoodComponent({ user, posts }) {
  const [count, setCount] = useState(0);

  return (
    <div>
      <span>{count}</span>
      <button onClick={() => setCount(c => c + 1)}>+</button>
      {/* 复杂列表，Compiler会自动优化重渲染 */}
      <PostList posts={posts} />
    </div>
  );
}

// ❌ 错误：违反React规则，Compiler无法优化
function BadComponent() {
  const ref = useRef([]);

  // 不要在渲染时修改ref
  ref.current.push(something);  // 副作用！

  // 不要使用过时的模式
  componentWillReceiveProps();  // 已废弃的生命周期
}
```

### 1.4 新Hooks体系

```tsx
// use - 消费Promise/Context
function UserProfile({ userPromise }) {
  const user = use(userPromise);
  return <div>{user.name}</div>;
}

// useOptimistic - 乐观更新
import { useOptimistic } from 'react';

function LikeButton({ initialLikes }) {
  const [likes, setLikes] = useState(initialLikes);
  const [optimisticLikes, addOptimistic] = useOptimistic(
    likes,
    (state, newValue) => state + newValue
  );

  return (
    <button onClick={() => addOptimistic(1)}>
      👍 {optimisticLikes}
    </button>
  );
}

// useActionState - 表单状态管理
import { useActionState } from 'react';

async function submitForm(prevState, formData) {
  const result = await fetch('/api/submit', {
    method: 'POST',
    body: formData
  });
  return result.ok ? { success: true } : { error: 'Failed' };
}

function MyForm() {
  const [state, formAction, isPending] = useActionState(submitForm, null);

  return (
    <form action={formAction}>
      <input name="name" />
      <button type="submit" disabled={isPending}>
        {isPending ? '提交中...' : '提交'}
      </button>
    </form>
  );
}
```

---

## 2. Next.js 16 深度解析

### 2.1 App Router核心特性

App Router是Next.js 16的核心架构，它基于React Server Components构建，提供了更强大的服务端渲染能力。

**目录结构与约定**：

```
app/
├── layout.tsx           # 根布局（所有页面共享）
├── page.tsx             # 首页（/）
├── loading.tsx          # 加载状态（ Suspense fallback）
├── error.tsx            # 错误边界
├── not-found.tsx        # 404页面
├── global-error.tsx     # 全局错误处理（根error boundary）
│
├── (marketing)/         # 路由组（不影响URL）
│   ├── layout.tsx       # 营销页面专属布局
│   ├── page.tsx        # / → 首页或营销页
│   ├── about/
│   │   └── page.tsx    # /about
│   └── pricing/
│       └── page.tsx    # /pricing
│
├── (dashboard)/         # 另一个路由组
│   ├── layout.tsx       # 仪表盘专属布局（可能需要登录）
│   ├── settings/
│   │   └── page.tsx    # /settings
│   └── profile/
│       └── page.tsx    # /profile
│
├── posts/
│   ├── page.tsx         # /posts（文章列表）
│   ├── loading.tsx      # 列表加载状态
│   └── [slug]/          # 动态路由
│       ├── page.tsx     # /posts/any-slug
│       └── loading.tsx  # 文章详情加载状态
│
├── api/                 # API路由
│   ├── route.ts         # /api（通用）
│   └── users/
│       └── route.ts     # /api/users
│
└── admin/               # 需要特殊处理
    ├── layout.tsx       # 管理员布局
    └── page.tsx         # /admin
```

**完整布局示例**：

```tsx
// app/layout.tsx - 根布局
import './globals.css';
import { Inter } from 'next/font/google';
import { Metadata } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { Providers } from './providers';

// 加载字体（自动优化）
const inter = Inter({ subsets: ['latin', 'cyrillic'] });

// 静态元数据
export const metadata: Metadata = {
  title: '我的应用',
  description: 'Next.js 16 全栈应用',
  // 社交分享
  openGraph: {
    title: '我的应用',
    images: ['/og-image.jpg'],
  },
};

// 动态元数据（服务端获取数据）
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPost(params.slug);

  return {
    title: `${post.title} - 我的应用`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      images: [post.coverImage],
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <AntdRegistry>
          <Providers>
            <AppHeader />
            <main>{children}</main>
            <AppFooter />
          </Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}

// app/providers.tsx - 客户端Provider包装
'use client';

import { ConfigProvider } from 'antd';
import { SWRConfig } from 'swr';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#1890ff' } }}>
      <SWRConfig value={{ revalidateOnFocus: false }}>
        {children}
      </SWRConfig>
    </ConfigProvider>
  );
}
```

**并行数据获取与错误处理**：

```tsx
// app/posts/page.tsx - 并行数据获取
import { Suspense } from 'react';

// 定义多个并行加载的数据组件
async function PostList() {
  // 直接await，多个请求会并行执行
  const posts = await getPosts();
  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>
          <Link href={`/posts/${post.slug}`}>{post.title}</Link>
        </li>
      ))}
    </ul>
  );
}

async function PostStats() {
  const stats = await getPostStats();
  return <div>共 {stats.total} 篇文章</div>;
}

async function PopularPosts() {
  const popular = await getPopularPosts();
  return (
    <div>
      <h3>热门文章</h3>
      <ul>
        {popular.map(post => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}

// 主页面组件
export default function PostsPage() {
  return (
    <div className="posts-page">
      <h1>文章列表</h1>

      {/* Suspense边界允许部分内容先渲染 */}
      <section>
        <Suspense fallback={<PostStatsSkeleton />}>
          <PostStats />
        </Suspense>
      </section>

      <div className="main-layout">
        <Suspense fallback={<PostListSkeleton />}>
          <PostList />
        </Suspense>

        <aside>
          <Suspense fallback={<PopularSkeleton />}>
            <PopularPosts />
          </Suspense>
        </aside>
      </div>
    </div>
  );
}

// 加载骨架屏组件
function PostListSkeleton() {
  return (
    <div className="animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      ))}
    </div>
  );
}
```

### 2.2 Partial Prerendering (PPR) - 部分预渲染

Next.js 16引入了Partial Prerendering，这是一种结合SSG静态生成和动态渲染的新模式。

**核心概念**：

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Partial Prerendering工作原理                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  页面组成：                                                          │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  ┌──────────────────┐  ┌──────────────────────────────┐  │   │
│  │  │  静态外壳        │  │  动态内容                      │  │   │
│  │  │  (HTML预渲染)    │  │  (Streaming)                 │  │   │
│  │  │                  │  │                              │  │   │
│  │  │  - Header       │  │  - 用户个性化推荐             │  │   │
│  │  │  - Footer       │  │  - 实时评论                  │  │   │
│  │  │  - 导航栏       │  │  - 购物车数量                │  │   │
│  │  │  - 静态广告      │  │  - 通知数量                  │  │   │
│  │  │                  │  │                              │  │   │
│  │  └──────────────────┘  └──────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  用户体验：                                                          │
│  1. 首次访问 → 立即看到静态HTML（秒开）                            │
│  2. 动态内容 → 通过流式传输逐步加载                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**使用示例**：

```tsx
// next.config.js - 启用PPR
module.exports = {
  experimental: {
    ppr: true,
  },
};

// app/product/[id]/page.tsx
import { Suspense } from 'react';

// 静态部分 - 产品基本信息（预渲染）
async function ProductInfo({ id }) {
  // 静态生成，在构建时渲染
  const product = await getProductStatic(id);

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <ProductImage src={product.image} />
    </div>
  );
}

// 动态部分 - 实时库存和价格（流式加载）
async function ProductRealtime({ id }) {
  // 动态数据，在请求时获取
  const realtime = await getRealtimeProductData(id);

  return (
    <div className="realtime-info">
      <Price price={realtime.price} />
      <Stock count={realtime.stock} />
      <UserReviews productId={id} />
    </div>
  );
}

// 客户端交互部分
'use client';
function AddToCartButton({ productId }) {
  const [quantity, setQuantity] = useState(1);

  return (
    <div>
      <input
        type="number"
        value={quantity}
        onChange={e => setQuantity(Number(e.target.value))}
      />
      <button onClick={() => addToCart(productId, quantity)}>
        加入购物车
      </button>
    </div>
  );
}

// 使用PPR
export default function ProductPage({ params }) {
  return (
    <div>
      {/* 静态内容会被预渲染 */}
      <ProductInfo id={params.id} />

      {/* 动态内容流式加载 */}
      <Suspense fallback={<RealtimeSkeleton />}>
        <ProductRealtime id={params.id} />
      </Suspense>

      {/* 客户端组件（天然动态） */}
      <AddToCartButton productId={params.id} />
    </div>
  );
}
```

### 2.3 缓存策略详解

Next.js 16提供了细粒度的缓存控制机制。

**缓存层级**：

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Next.js 16缓存层级                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. 请求记忆化 (Request Memoization)                                 │
│     └─ 同一请求多次调用，只执行一次                                  │
│     └─ 使用 fetch() 或 React cache()                               │
│                                                                      │
│  2. 数据缓存 (Data Cache)                                           │
│     └─ 跨请求持久化缓存                                              │
│     └─ 使用 fetch() 的 cache 选项                                   │
│     └─ 默认：持久缓存                                                │
│                                                                      │
│  3. 路由缓存 (Full Route Cache)                                    │
│     └─ 构建时生成的静态页面                                          │
│     └─ 使用 generateStaticParams()                                  │
│     └─ 可被revalidatePath/revalidateTag清除                          │
│                                                                      │
│  4. 私有缓存 (Private Cache)                                        │
│     └─ 浏览器缓存（setHeader设置）                                   │
│     └─ 响应头：Cache-Control: private                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**缓存配置示例**：

```tsx
// fetch缓存配置
async function getUserData() {
  // 强制最新数据（不缓存）
  const fresh = await fetch('/api/user', {
    cache: 'no-store',
  });

  // 每60秒重新验证
  const cached = await fetch('/api/posts', {
    next: { revalidate: 60 },
  });

  // 静态数据（构建时获取，之后不更新）
  const static = await fetch('/api/config', {
    cache: 'force-cache',  // 默认值
  });

  // 按标签重新验证
  const tagged = await fetch('/api/recommendations', {
    next: { tags: ['recommendations'] },
  });

  return tagged.json();
}

// 使用React cache实现请求记忆化
import { cache } from 'react';

// 缓存数据获取函数
export const getUser = cache(async (id: string) => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
});

// 同一组件多次调用，只发起一次请求
export default async function UserPage({ params }) {
  // 无论调用多少次，fetch只执行一次
  const user = await getUser(params.id);
  const profile = await getUser(params.id);  // 使用缓存
  const posts = await getUser(params.id);    // 使用缓存

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{profile.bio}</p>
      {/* ... */}
    </div>
  );
}

// 重新验证缓存
'use server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function updatePost(postId: string, data) {
  await db.posts.update({ where: { id: postId }, data });

  // 按路径重新验证
  revalidatePath('/posts');
  revalidatePath('/posts/[slug]', 'page');

  // 按标签重新验证
  revalidateTag('recommendations');
}
```

### 2.4 Turbopack构建工具

Turbopack是Vercel开发的Rust编写的构建工具，比Webpack快10倍以上。

```bash
# 启动开发服务器（使用Turbopack）
npx next dev --turbopack

# 生产构建（仍使用SWC编译，Turbopack优化中）
npx next build

# Turbopack性能对比
# 冷启动：
# - Webpack: 45秒+（需要打包所有模块）
# - Turbopack: 0.8秒（增量加载）

# 热更新：
# - Webpack: 3-5秒（重新编译相关模块）
# - Turbopack: <50ms（Turbo引擎追踪依赖图，只更新变化的模块）

# 增量构建：
# - Turbopack利用持久缓存，重复构建只处理变化的文件
```

```tsx
// next.config.ts - Turbopack配置
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Turbopack会在未来版本完全替代Webpack
  // 目前开发环境默认使用，生产构建使用SWC

  // 图片优化配置
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },

  // 实验性功能
  experimental: {
    // 部分预渲染
    ppr: true,

    // React Compiler
    reactCompiler: true,

    // 静态导入优化
    optimizePackageImports: ['antd', '@ant-design/icons', 'lodash'],
  },
};

export default nextConfig;
```

### 2.5 流式渲染进阶

流式渲染允许页面部分内容先生成，部分内容异步加载。

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react';

// 快速数据 - 先显示
async function QuickMetrics() {
  const metrics = await fetchQuickMetrics();

  return (
    <div className="metrics-grid">
      <MetricCard title="访问量" value={metrics.visits} />
      <MetricCard title="收入" value={metrics.revenue} />
      <MetricCard title="用户" value={metrics.users} />
    </div>
  );
}

// 慢速数据 - 后加载
async function AnalyticsChart() {
  // 模拟慢查询
  await new Promise(resolve => setTimeout(resolve, 2000));

  const data = await fetchAnalyticsData();

  return <Chart data={data} />;
}

// 推荐列表（可能更慢）
async function Recommendations() {
  const recommendations = await fetchRecommendations();

  return (
    <div className="recommendations">
      <h3>为你推荐</h3>
      <ul>
        {recommendations.map(item => (
          <li key={item.id}>{item.title}</li>
        ))}
      </ul>
    </div>
  );
}

// 骨架屏组件
function MetricsSkeleton() {
  return (
    <div className="metrics-grid animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-24 bg-gray-200 rounded" />
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-80 bg-gray-200 rounded animate-pulse">
      <div className="h-full flex items-end justify-around px-4">
        {[1, 2, 3, 4, 5, 6, 7].map(i => (
          <div
            key={i}
            className="w-8 bg-gray-300 rounded-t"
            style={{ height: `${Math.random() * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// 主页面
export default function DashboardPage() {
  return (
    <div className="dashboard">
      <h1>仪表盘</h1>

      {/* 快速指标，骨架屏简单 */}
      <section>
        <Suspense fallback={<MetricsSkeleton />}>
          <QuickMetrics />
        </Suspense>
      </section>

      {/* 图表，骨架屏展示图表形状 */}
      <section>
        <Suspense fallback={<ChartSkeleton />}>
          <AnalyticsChart />
        </Suspense>
      </section>

      {/* 推荐，骨架屏展示列表形状 */}
      <section>
        <Suspense fallback={<div className="animate-pulse h-48">加载中...</div>}>
          <Recommendations />
        </Suspense>
      </section>
    </div>
  );
}
```

---

## 3. Vue 4 发展现状

### 3.1 Vue 3  Composition API

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// 响应式状态
const count = ref(0)

// 计算属性
const doubled = computed(() => count.value * 2)

// 方法
function increment() {
  count.value++
}

// 生命周期
onMounted(() => {
  console.log('组件已挂载')
})
</script>

<template>
  <button @click="increment">
    点击次数: {{ count }}
    双倍: {{ doubled }}
  </button>
</template>
```

### 3.2 Vue Router 4

```typescript
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('./views/Home.vue')
    },
    {
      path: '/user/:id',
      name: 'User',
      component: () => import('./views/User.vue'),
      props: true
    }
  ]
})

export default router
```

---

## 4. 框架对比与选型

### 4.1 技术对比

| 特性 | React 19 | Next.js 16 | Vue 3/4 |
|------|----------|------------|----------|
| **渲染模式** | CSR/SSR/SSG | SSR/SSG/ISR | CSR/SSG |
| **学习曲线** | 中等 | 较陡 | 较平缓 |
| **生态系统** | 丰富 | 丰富 | 中等 |
| **类型支持** | TypeScript | TypeScript | TypeScript |
| **状态管理** | Zustand/Redux | Zustand/Context | Pinia |
| **服务器组件** | 原生支持 | 原生支持 | 有限 |

### 4.2 场景选型建议

| 场景 | 推荐方案 |
|------|----------|
| 企业级后台 | React + Ant Design 6 |
| 营销网站 | Next.js 16 + Tailwind |
| 简单应用 | Vue 3 + Element Plus |
| 需要SEO | Next.js 16 SSR |
| 追求性能 | React 19 + Vite |
| 快速原型 | Vue 3 + Vite |

---

## 5. 实战练习

### 练习1：创建一个Todo应用

使用React 19 + Server Actions实现：

```tsx
// app/actions.ts - 服务端操作
'use server';
export async function addTodo(formData: FormData) {
  const title = formData.get('title');
  await db.todo.create({ title });
  revalidatePath('/');
}

export async function deleteTodo(id: string) {
  await db.todo.delete(id);
  revalidatePath('/');
}

// app/page.tsx - 页面组件
import { addTodo, deleteTodo } from './actions';

export default function TodoPage() {
  return (
    <div>
      <h1>待办事项</h1>
      <form action={addTodo}>
        <input name="title" required />
        <button type="submit">添加</button>
      </form>
    </div>
  );
}
```

### 练习2：实现乐观更新

```tsx
'use client';
import { useOptimistic } from 'react';

function LikeButton({ initialCount }) {
  const [count, setCount] = useOptimistic(
    initialCount,
    (state, newCount) => state + newCount
  );

  async function handleLike() {
    setCount(1);
    await fetch('/api/like', { method: 'POST' });
  }

  return <button onClick={handleLike}>👍 {count}</button>;
}
```

### 练习3：流式加载数据

```tsx
import { Suspense } from 'react';

function UserData() {
  throw fetch('/api/users').then(r => r.json());
}

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <UserData />
    </Suspense>
  );
}

function Skeleton() {
  return <div className="skeleton">加载中...</div>;
}
```

---

## 参考资料

- [React 19官方文档](https://react.dev)
- [Next.js 16官方文档](https://nextjs.org/docs)
- [Vue官方文档](https://vuejs.org)

---

*本文档持续更新，最后更新于2026年3月*
