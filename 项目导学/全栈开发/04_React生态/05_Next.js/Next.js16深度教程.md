# Next.js 16 深度教程

## 一、Next.js 概述

Next.js 是由 Vercel 开发的 React 全栈框架，提供了完整的全栈开发解决方案。Next.js 16 是最新版本，基于 React 19 构建，引入了多项重大更新。

### 1.1 核心特性

| 特性 | 说明 |
|------|------|
| **App Router** | 基于文件系统的路由，支持布局、加载状态 |
| **Server Components** | 默认服务端组件，零客户端 JavaScript |
| **Server Actions** | 服务端操作，无需 API 路由 |
| **Turbopack** | Rust 编写的新构建工具，极速编译 |
| **流式渲染** | 渐进式页面加载 |
| **图片优化** | 自动图片优化和懒加载 |
| **字体优化** | 自动字体优化和预加载 |
| **SEO 优化** | 内置元数据管理 |

### 1.2 项目创建

```bash
# 创建新项目
npx create-next-app@latest my-app

# 交互式配置选项
# - TypeScript: Yes
# - ESLint: Yes
# - Tailwind CSS: Yes
# - `src/` directory: Yes
# - App Router: Yes
# - Turbopack: Yes
# - Custom import alias: @/*

# 启动开发服务器
cd my-app
npm run dev
```

---

## 二、App Router 架构

### 2.1 目录结构

```
app/
├── layout.tsx          # 根布局（必需）
├── page.tsx            # 首页
├── loading.tsx         # 加载状态
├── error.tsx           # 错误处理
├── not-found.tsx       # 404 页面
├── globals.css         # 全局样式
│
├── (auth)/             # 路由组（不影响 URL）
│   ├── layout.tsx
│   ├── login/
│   │   └── page.tsx    # /login
│   └── register/
│       └── page.tsx    # /register
│
├── dashboard/          # 路由段
│   ├── layout.tsx      # 嵌套布局
│   ├── page.tsx        # /dashboard
│   ├── users/
│   │   └── page.tsx    # /dashboard/users
│   └── settings/
│       └── page.tsx    # /dashboard/settings
│
├── products/
│   ├── page.tsx        # /products
│   └── [id]/           # 动态路由
│       └── page.tsx    # /products/123
│
├── api/                # API 路由
│   └── users/
│       └── route.ts    # /api/users
│
└── actions/            # Server Actions
    └── user.ts
```

### 2.2 布局系统

```tsx
// app/layout.tsx - 根布局（必需）
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

// 页面元数据
export const metadata: Metadata = {
  title: '我的应用',
  description: 'Next.js 16 应用',
};

// 根布局组件
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        {/* 布局内容在页面切换时保持不变 */}
        <header>
          <nav>导航栏</nav>
        </header>
        
        <main>
          {/* 子页面渲染在这里 */}
          {children}
        </main>
        
        <footer>
          <p>页脚</p>
        </footer>
      </body>
    </html>
  );
}
```

```tsx
// app/dashboard/layout.tsx - 嵌套布局
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <section className="dashboard-content">
        {/* 嵌套页面渲染在这里 */}
        {children}
      </section>
    </div>
  );
}
```

### 2.3 页面组件

```tsx
// app/page.tsx - 首页
import Link from 'next/link';

export default function HomePage() {
  return (
    <div>
      <h1>欢迎来到首页</h1>
      
      {/* 客户端导航 */}
      <Link href="/dashboard">进入仪表盘</Link>
    </div>
  );
}

// app/dashboard/page.tsx - 仪表盘页面
export default function DashboardPage() {
  return (
    <div>
      <h1>仪表盘</h1>
    </div>
  );
}
```

### 2.4 动态路由

```tsx
// app/products/[id]/page.tsx - 动态路由页面
interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    color?: string;
    size?: string;
  }>;
}

// 生成静态参数（静态生成）
export async function generateStaticParams() {
  const products = await fetchProducts();
  
  return products.map(product => ({
    id: product.id.toString(),
  }));
}

// 页面组件
export default async function ProductPage({ 
  params, 
  searchParams 
}: ProductPageProps) {
  // 获取路由参数
  const { id } = await params;
  const { color, size } = await searchParams;
  
  // 获取产品数据
  const product = await fetch(`/api/products/${id}`).then(res => res.json());
  
  return (
    <div>
      <h1>产品详情: {product.name}</h1>
      <p>ID: {id}</p>
      {color && <p>颜色: {color}</p>}
      {size && <p>尺寸: {size}</p>}
    </div>
  );
}

// 生成元数据
export async function generateMetadata({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await fetch(`/api/products/${id}`).then(res => res.json());
  
  return {
    title: product.name,
    description: product.description,
  };
}
```

### 2.5 路由组

```tsx
// app/(auth)/layout.tsx - 认证路由组布局
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-container">
      {/* 认证页面共享布局 */}
      <div className="auth-card">
        {children}
      </div>
    </div>
  );
}

// app/(auth)/login/page.tsx - 登录页面
// URL: /login（路由组不影响 URL）
export default function LoginPage() {
  return <h1>登录</h1>;
}

// app/(auth)/register/page.tsx - 注册页面
// URL: /register
export default function RegisterPage() {
  return <h1>注册</h1>;
}
```

---

## 三、数据获取

### 3.1 服务端数据获取

```tsx
// app/users/page.tsx
// 默认就是服务端组件，可以直接 async/await

interface User {
  id: number;
  name: string;
  email: string;
}

// 服务端组件可以直接使用 async
export default async function UsersPage() {
  // 在服务端获取数据
  const response = await fetch('https://api.example.com/users', {
    // 缓存策略
    cache: 'no-store', // 不缓存，每次请求都重新获取
    // cache: 'force-cache', // 强制缓存（默认）
    next: {
      revalidate: 60, // 60秒后重新验证
    },
  });
  
  const users: User[] = await response.json();
  
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>
          {user.name} - {user.email}
        </li>
      ))}
    </ul>
  );
}
```

### 3.2 并行数据获取

```tsx
// app/dashboard/page.tsx
export default async function DashboardPage() {
  // 并行获取多个数据源
  const [users, orders, statistics] = await Promise.all([
    fetch('/api/users').then(res => res.json()),
    fetch('/api/orders').then(res => res.json()),
    fetch('/api/statistics').then(res => res.json()),
  ]);
  
  return (
    <div>
      <UsersList users={users} />
      <OrdersTable orders={orders} />
      <StatisticsChart data={statistics} />
    </div>
  );
}
```

### 3.3 流式渲染

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react';

// 慢速数据组件
async function SlowDataComponent() {
  const data = await fetch('/api/slow-data').then(res => res.json());
  
  return <div>{JSON.stringify(data)}</div>;
}

// 页面组件
export default function DashboardPage() {
  return (
    <div>
      {/* 快速渲染的内容 */}
      <h1>仪表盘</h1>
      
      {/* 流式加载慢速数据 */}
      <Suspense fallback={<div>加载中...</div>}>
        <SlowDataComponent />
      </Suspense>
    </div>
  );
}
```

### 3.4 客户端数据获取

```tsx
// hooks/useUsers.ts
'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useUsers() {
  const { data, error, isLoading, mutate } = useSWR('/api/users', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 60秒内不重复请求
  });
  
  return {
    users: data,
    isLoading,
    isError: error,
    mutate, // 手动刷新
  };
}

// components/UserList.tsx
'use client';

import { useUsers } from '@/hooks/useUsers';

export function UserList() {
  const { users, isLoading, isError, mutate } = useUsers();
  
  if (isLoading) return <div>加载中...</div>;
  if (isError) return <div>加载失败</div>;
  
  return (
    <div>
      <button onClick={() => mutate()}>刷新</button>
      <ul>
        {users?.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 四、Server Actions

### 4.1 定义 Server Actions

```tsx
// app/actions/user.ts
'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';

// 创建用户
export async function createUser(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  
  // 验证
  if (!name || !email) {
    return { error: '姓名和邮箱不能为空' };
  }
  
  // 创建用户
  const user = await db.users.create({
    data: { name, email },
  });
  
  // 重新验证缓存
  revalidatePath('/users'); // 重新验证 /users 页面
  revalidateTag('users'); // 重新验证带有 'users' 标签的请求
  
  return { success: true, user };
}

// 删除用户
export async function deleteUser(id: string) {
  await db.users.delete({ where: { id } });
  
  revalidatePath('/users');
}

// 更新用户并重定向
export async function updateUser(id: string, formData: FormData) {
  const name = formData.get('name') as string;
  
  await db.users.update({
    where: { id },
    data: { name },
  });
  
  // 重定向到用户列表
  redirect('/users');
}
```

### 4.2 在表单中使用

```tsx
// app/users/create/page.tsx
import { createUser } from '@/app/actions/user';

export default function CreateUserPage() {
  return (
    <form action={createUser}>
      <div>
        <label htmlFor="name">姓名</label>
        <input 
          id="name" 
          name="name" 
          type="text" 
          required 
        />
      </div>
      
      <div>
        <label htmlFor="email">邮箱</label>
        <input 
          id="email" 
          name="email" 
          type="email" 
          required 
        />
      </div>
      
      <button type="submit">创建用户</button>
    </form>
  );
}
```

### 4.3 在客户端组件中使用

```tsx
// components/UserForm.tsx
'use client';

import { useActionState } from 'react';
import { createUser } from '@/app/actions/user';

export function UserForm() {
  const [state, formAction, isPending] = useActionState(createUser, null);
  
  return (
    <form action={formAction}>
      <input name="name" placeholder="姓名" required />
      <input name="email" type="email" placeholder="邮箱" required />
      
      <button type="submit" disabled={isPending}>
        {isPending ? '创建中...' : '创建用户'}
      </button>
      
      {state?.error && (
        <p className="error">{state.error}</p>
      )}
      {state?.success && (
        <p className="success">创建成功！</p>
      )}
    </form>
  );
}
```

---

## 五、API 路由

### 5.1 基础 API 路由

```tsx
// app/api/users/route.ts
import { NextResponse } from 'next/server';

// GET /api/users
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || '1';
  const limit = searchParams.get('limit') || '10';
  
  const users = await db.users.findMany({
    skip: (parseInt(page) - 1) * parseInt(limit),
    take: parseInt(limit),
  });
  
  return NextResponse.json({ users });
}

// POST /api/users
export async function POST(request: Request) {
  const body = await request.json();
  
  const user = await db.users.create({
    data: body,
  });
  
  return NextResponse.json(user, { status: 201 });
}
```

### 5.2 动态 API 路由

```tsx
// app/api/users/[id]/route.ts
import { NextResponse } from 'next/server';

// GET /api/users/:id
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const user = await db.users.findUnique({
    where: { id },
  });
  
  if (!user) {
    return NextResponse.json(
      { error: '用户不存在' },
      { status: 404 }
    );
  }
  
  return NextResponse.json(user);
}

// PUT /api/users/:id
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  
  const user = await db.users.update({
    where: { id },
    data: body,
  });
  
  return NextResponse.json(user);
}

// DELETE /api/users/:id
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  await db.users.delete({
    where: { id },
  });
  
  return new NextResponse(null, { status: 204 });
}
```

### 5.3 中间件

```tsx
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 匹配的路由
export const config = {
  matcher: [
    '/dashboard/:path*', // 匹配 /dashboard 及其子路由
    '/api/admin/:path*', // 匹配 /api/admin 及其子路由
  ],
};

export function middleware(request: NextRequest) {
  // 获取 token
  const token = request.cookies.get('token')?.value;
  
  // 未登录则重定向
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // 验证 token
  try {
    const payload = verifyToken(token);
    
    // 将用户信息添加到请求头
    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.userId);
    
    return response;
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
```

---

## 六、缓存策略

### 6.1 请求缓存

```tsx
// 默认缓存（force-cache）
const data = await fetch('/api/data');

// 不缓存
const data = await fetch('/api/data', { cache: 'no-store' });

// 定时重新验证（ISR）
const data = await fetch('/api/data', { 
  next: { revalidate: 60 } // 60秒后重新验证
});

// 按标签重新验证
const data = await fetch('/api/data', { 
  next: { tags: ['users'] } 
});
// 然后在 Server Action 中
revalidateTag('users');
```

### 6.2 路由缓存

```tsx
// 页面级缓存
export const revalidate = 60; // 60秒后重新验证

// 或动态渲染
export const dynamic = 'force-dynamic'; // 每次请求都重新渲染

// app/products/page.tsx
export const revalidate = 3600; // 1小时后重新验证

export default async function ProductsPage() {
  const products = await fetch('/api/products').then(res => res.json());
  
  return <ProductList products={products} />;
}
```

### 6.3 缓存失效

```tsx
// app/actions/product.ts
'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

export async function updateProduct(id: string, data: any) {
  await db.products.update({ where: { id }, data });
  
  // 使特定路径缓存失效
  revalidatePath('/products');
  revalidatePath(`/products/${id}`);
  
  // 使特定标签缓存失效
  revalidateTag('products');
  
  // 使所有缓存失效
  // revalidatePath('/', 'layout');
}
```

---

## 七、性能优化

### 7.1 图片优化

```tsx
import Image from 'next/image';

export function ProductCard({ product }) {
  return (
    <div>
      {/* 自动优化图片 */}
      <Image
        src={product.image}
        alt={product.name}
        width={300}
        height={200}
        // 响应式尺寸
        sizes="(max-width: 768px) 100vw, 300px"
        // 懒加载
        loading="lazy"
        // 占位符
        placeholder="blur"
        blurDataURL={product.blurDataURL}
      />
      <h3>{product.name}</h3>
    </div>
  );
}
```

### 7.2 字体优化

```tsx
// app/layout.tsx
import { Inter, Playfair_Display } from 'next/font/google';

// 自动优化和预加载字体
const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // 字体加载策略
  variable: '--font-inter', // CSS 变量
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
});

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${playfair.variable}`}>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
```

### 7.3 代码分割

```tsx
// 动态导入组件
import dynamic from 'next/dynamic';

// 客户端动态导入
const DynamicChart = dynamic(() => import('@/components/Chart'), {
  loading: () => <p>加载图表...</p>,
  ssr: false, // 禁用服务端渲染
});

// 页面组件
export default function DashboardPage() {
  return (
    <div>
      <h1>仪表盘</h1>
      <DynamicChart data={chartData} />
    </div>
  );
}
```

### 7.4 元数据优化

```tsx
// app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: '我的应用',
    template: '%s | 我的应用', // 子页面标题模板
  },
  description: 'Next.js 16 全栈应用',
  keywords: ['Next.js', 'React', 'TypeScript'],
  authors: [{ name: '作者名' }],
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://example.com',
    siteName: '我的应用',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

// app/products/[id]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  
  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [product.image],
    },
  };
}
```

---

## 八、部署

### 8.1 Vercel 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel

# 生产环境部署
vercel --prod
```

### 8.2 Docker 部署

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# 安装依赖
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 构建应用
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 生产镜像
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

```bash
# 构建镜像
docker build -t my-nextjs-app .

# 运行容器
docker run -p 3000:3000 my-nextjs-app
```

---

## 九、最佳实践

### 9.1 目录结构建议

```
app/
├── (auth)/              # 认证相关页面
│   ├── login/
│   └── register/
├── (dashboard)/         # 仪表盘相关页面
│   ├── layout.tsx
│   └── page.tsx
├── api/                 # API 路由
│   └── users/
├── actions/             # Server Actions
│   └── user.ts
├── components/          # 共享组件
│   ├── ui/              # 基础 UI 组件
│   └── features/        # 功能组件
├── hooks/               # 自定义 Hooks
├── lib/                 # 工具函数
│   ├── db.ts            # 数据库连接
│   └── utils.ts         # 工具函数
├── types/               # 类型定义
└── styles/              # 样式文件
```

### 9.2 性能检查清单

- [ ] 使用 Server Components 获取数据
- [ ] 合理使用 Suspense 进行流式渲染
- [ ] 图片使用 next/image 组件
- [ ] 字体使用 next/font 优化
- [ ] 设置合理的缓存策略
- [ ] 使用动态导入减少初始包大小
- [ ] 配置适当的元数据

---

## 十、实战项目示例

### 10.1 完整的电商产品页面

```tsx
// ==================== 产品详情页 ====================
// app/products/[id]/page.tsx
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import ProductGallery from '@/components/products/ProductGallery';
import ProductInfo from '@/components/products/ProductInfo';
import ProductReviews from '@/components/products/ProductReviews';
import RelatedProducts from '@/components/products/RelatedProducts';
import AddToCartButton from '@/components/products/AddToCartButton';

// 生成静态参数
export async function generateStaticParams() {
  const products = await fetch(`${process.env.API_URL}/products`).then(res => res.json());

  return products.map(product => ({
    id: product.id.toString(),
  }));
}

// 生成元数据
export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await fetch(`${process.env.API_URL}/products/${id}`).then(res => res.json());

  if (!product) {
    return { title: '产品未找到' };
  }

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [product.images[0]],
    },
  };
}

// 获取产品数据
async function getProduct(id: string) {
  const response = await fetch(`${process.env.API_URL}/products/${id}`, {
    next: { revalidate: 3600 }, // 1小时缓存
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

// 产品详情页组件
export default async function ProductPage({ params }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 面包屑导航 */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm">
          <li><a href="/">首页</a></li>
          <li>/</li>
          <li><a href="/products">产品</a></li>
          <li>/</li>
          <li className="text-gray-500">{product.name}</li>
        </ol>
      </nav>

      {/* 产品主体 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 产品图片 */}
        <ProductGallery images={product.images} />

        {/* 产品信息 */}
        <div>
          <ProductInfo product={product} />
          <AddToCartButton productId={product.id} />
        </div>
      </div>

      {/* 产品详情描述 */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">产品详情</h2>
        <div className="prose max-w-none">
          {product.details}
        </div>
      </div>

      {/* 评价区域 - 流式加载 */}
      <div className="mt-12">
        <Suspense fallback={<ReviewsSkeleton />}>
          <ProductReviews productId={id} />
        </Suspense>
      </div>

      {/* 相关产品 - 流式加载 */}
      <div className="mt-12">
        <Suspense fallback={<RelatedProductsSkeleton />}>
          <RelatedProducts categoryId={product.categoryId} currentProductId={id} />
        </Suspense>
      </div>
    </div>
  );
}

// 骨架屏组件
function ReviewsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="p-4 border rounded-lg">
          <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse mb-2" />
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function RelatedProductsSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-64 bg-gray-200 rounded animate-pulse" />
      ))}
    </div>
  );
}
```

```tsx
// ==================== 产品图片画廊 ====================
// components/products/ProductGallery.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ProductGalleryProps {
  images: string[];
}

export default function ProductGallery({ images }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <div className="space-y-4">
      {/* 主图 */}
      <div
        className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 cursor-zoom-in"
        onClick={() => setIsZoomed(!isZoomed)}
      >
        <Image
          src={images[selectedIndex]}
          alt="产品图片"
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className={`object-cover transition-transform duration-300 ${
            isZoomed ? 'scale-150' : 'scale-100'
          }`}
          priority
        />
      </div>

      {/* 缩略图 */}
      <div className="flex gap-2 overflow-x-auto">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedIndex(index)}
            className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
              selectedIndex === index ? 'border-blue-500' : 'border-transparent'
            }`}
          >
            <Image
              src={image}
              alt={`缩略图 ${index + 1}`}
              fill
              sizes="80px"
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
```

```tsx
// ==================== 添加到购物车按钮 ====================
// components/products/AddToCartButton.tsx
'use client';

import { useState, useTransition } from 'react';
import { useOptimistic } from 'react';
import { addToCart } from '@/app/actions/cart';

interface AddToCartButtonProps {
  productId: string;
}

export default function AddToCartButton({ productId }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useTransition();

  // 乐观更新购物车数量
  const [cartCount, updateCartCount] = useOptimistic(0, (state, newCount: number) => {
    return state + newCount;
  });

  const handleAddToCart = async () => {
    startTransition(async () => {
      // 乐观更新
      updateCartCount(quantity);

      // 实际添加到购物车
      const result = await addToCart(productId, quantity);

      if (result.success) {
        // 显示成功提示
        showToast('已添加到购物车');
      } else {
        // 显示错误提示
        showToast(result.error || '添加失败', 'error');
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* 数量选择 */}
      <div className="flex items-center gap-4">
        <span className="text-gray-600">数量：</span>
        <div className="flex items-center border rounded-lg">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-4 py-2 hover:bg-gray-100"
            disabled={isPending}
          >
            -
          </button>
          <span className="px-4 py-2 min-w-[60px] text-center">{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="px-4 py-2 hover:bg-gray-100"
            disabled={isPending}
          >
            +
          </button>
        </div>
      </div>

      {/* 添加按钮 */}
      <button
        onClick={handleAddToCart}
        disabled={isPending}
        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? '添加中...' : '加入购物车'}
      </button>
    </div>
  );
}

// 简单的提示函数
function showToast(message: string, type: 'success' | 'error' = 'success') {
  // 实际项目中可以使用 toast 库
  alert(message);
}
```

### 10.2 用户认证中间件

```tsx
// ==================== 认证中间件 ====================
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 需要认证的路由
const protectedRoutes = ['/dashboard', '/profile', '/orders'];

// 认证相关路由（已登录用户不能访问）
const authRoutes = ['/login', '/register'];

// 管理员路由
const adminRoutes = ['/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 获取 token
  const token = request.cookies.get('token')?.value;
  const userRole = request.cookies.get('userRole')?.value;

  // 检查是否是受保护的路由
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // 检查是否是认证路由
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );

  // 检查是否是管理员路由
  const isAdminRoute = adminRoutes.some(route => 
    pathname.startsWith(route)
  );

  // 未登录访问受保护路由 -> 重定向到登录页
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 已登录访问认证路由 -> 重定向到仪表盘
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 非管理员访问管理员路由 -> 返回 403
  if (isAdminRoute && userRole !== 'admin') {
    return NextResponse.json(
      { error: '无权访问' },
      { status: 403 }
    );
  }

  // 添加用户信息到请求头
  const response = NextResponse.next();

  if (token) {
    response.headers.set('x-auth-token', token);
  }

  return response;
}

// 配置匹配的路由
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - _next/static (静态文件)
     * - _next/image (图片优化文件)
     * - favicon.ico (网站图标)
     * - public 文件夹中的文件
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
```

### 10.3 完整的 API 路由示例

```tsx
// ==================== 用户 API 路由 ====================
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hash, compare } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';

// 数据库连接（示例）
import { db } from '@/lib/db';

// 验证 Schema
const registerSchema = z.object({
  name: z.string().min(2, '姓名至少2个字符'),
  email: z.string().email('请输入有效的邮箱'),
  password: z.string().min(6, '密码至少6个字符'),
});

const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱'),
  password: z.string().min(1, '请输入密码'),
});

// GET /api/users - 获取用户列表
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const decoded = verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };

    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: '无权访问' }, { status: 403 });
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    // 查询用户
    const users = await db.user.findMany({
      where: {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
        ],
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // 获取总数
    const total = await db.user.count({
      where: {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
        ],
      },
    });

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// POST /api/users - 创建用户（注册）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证输入
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: '验证失败', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;

    // 检查邮箱是否已存在
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: '该邮箱已被注册' },
        { status: 400 }
      );
    }

    // 加密密码
    const hashedPassword = await hash(password, 10);

    // 创建用户
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    // 生成 JWT
    const token = sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return NextResponse.json(
      { user, token },
      { status: 201 }
    );
  } catch (error) {
    console.error('创建用户失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// app/api/users/[id]/route.ts
// GET /api/users/:id - 获取单个用户
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profile: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('获取用户失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// PUT /api/users/:id - 更新用户
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 验证权限（只能更新自己的信息）
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = verify(token!, process.env.JWT_SECRET!) as { userId: string };

    if (decoded.userId !== id) {
      return NextResponse.json(
        { error: '无权修改' },
        { status: 403 }
      );
    }

    // 更新用户
    const user = await db.user.update({
      where: { id },
      data: body,
      select: {
        id: true,
        name: true,
        email: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('更新用户失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/:id - 删除用户
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 验证权限
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = verify(token!, process.env.JWT_SECRET!) as { userId: string; role: string };

    if (decoded.userId !== id && decoded.role !== 'admin') {
      return NextResponse.json(
        { error: '无权删除' },
        { status: 403 }
      );
    }

    // 删除用户
    await db.user.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('删除用户失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
```

---

## 十一、常见问题与解决方案

### 11.1 路由相关问题

#### 问题1：动态路由参数如何获取？

```tsx
// Next.js 15+ 中，params 和 searchParams 都是 Promise

// ❌ 旧写法（Next.js 14 及之前）
export default function Page({ params, searchParams }) {
  const id = params.id;
  const query = searchParams.q;
  // ...
}

// ✅ 新写法（Next.js 15+）
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { id } = await params;
  const { q } = await searchParams;
  // ...
}
```

#### 问题2：如何处理并行路由？

```tsx
// app/dashboard/@team/page.tsx
export default function TeamPage() {
  return <div>团队页面</div>;
}

// app/dashboard/@analytics/page.tsx
export default function AnalyticsPage() {
  return <div>分析页面</div>;
}

// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
  team,
  analytics,
}: {
  children: React.ReactNode;
  team: React.ReactNode;
  analytics: React.ReactNode;
}) {
  return (
    <div>
      <nav>{children}</nav>
      <div className="grid grid-cols-2 gap-4">
        {team}
        {analytics}
      </div>
    </div>
  );
}
```

#### 问题3：如何实现路由拦截？

```tsx
// app/photos/page.tsx - 照片列表页
import Link from 'next/link';

export default function PhotosPage() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {photos.map(photo => (
        <Link key={photo.id} href={`/photos/${photo.id}`}>
          <img src={photo.thumbnail} alt={photo.title} />
        </Link>
      ))}
    </div>
  );
}

// app/photos/[id]/page.tsx - 照片详情页（完整页面）
export default async function PhotoPage({ params }) {
  const { id } = await params;
  const photo = await getPhoto(id);

  return (
    <div className="min-h-screen">
      <img src={photo.url} alt={photo.title} />
      <h1>{photo.title}</h1>
    </div>
  );
}

// app/(.)photos/[id]/page.tsx - 拦截路由（模态框）
// 当从 /photos 点击照片时，显示模态框而不是完整页面
export default function InterceptedPhotoPage({ params }) {
  const { id } = use(params); // 客户端组件中使用

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-4 max-w-2xl">
        <img src={photo.url} alt={photo.title} />
        <Link href="/photos" className="close-btn">关闭</Link>
      </div>
    </div>
  );
}
```

### 11.2 数据获取问题

#### 问题1：如何处理数据获取错误？

```tsx
// app/users/page.tsx
import { notFound, error } from 'next/navigation';

async function getUsers() {
  const response = await fetch('/api/users');

  if (response.status === 404) {
    notFound(); // 显示 404 页面
  }

  if (!response.ok) {
    throw new Error('获取用户失败'); // 显示 error.tsx
  }

  return response.json();
}

export default async function UsersPage() {
  try {
    const users = await getUsers();
    return <UserList users={users} />;
  } catch (error) {
    // 可以在这里处理特定错误
    console.error(error);
    throw error; // 让 error.tsx 处理
  }
}

// app/users/error.tsx
'use client';

export default function UsersError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="p-4">
      <h2>出错了！</h2>
      <p>{error.message}</p>
      <button onClick={reset}>重试</button>
    </div>
  );
}

// app/users/not-found.tsx
import Link from 'next/link';

export default function UsersNotFound() {
  return (
    <div className="p-4">
      <h2>用户不存在</h2>
      <Link href="/users">返回用户列表</Link>
    </div>
  );
}
```

#### 问题2：如何实现无限滚动？

```tsx
// app/posts/page.tsx
import { Suspense } from 'react';
import PostList from '@/components/PostList';

export default function PostsPage() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <PostList />
    </Suspense>
  );
}

// components/PostList.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';

interface Post {
  id: string;
  title: string;
  content: string;
}

export default function PostList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // 使用 Intersection Observer 检测底部
  const { ref, inView } = useInView({
    threshold: 0,
  });

  // 加载更多数据
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/posts?page=${page}&limit=10`);
      const newPosts = await response.json();

      if (newPosts.length === 0) {
        setHasMore(false);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore]);

  // 当底部进入视口时加载更多
  useEffect(() => {
    if (inView) {
      loadMore();
    }
  }, [inView, loadMore]);

  return (
    <div>
      <div className="space-y-4">
        {posts.map(post => (
          <article key={post.id} className="p-4 border rounded-lg">
            <h2 className="text-xl font-bold">{post.title}</h2>
            <p className="mt-2">{post.content}</p>
          </article>
        ))}
      </div>

      {/* 加载指示器 */}
      <div ref={ref} className="py-8 text-center">
        {loading && <span>加载中...</span>}
        {!hasMore && <span>没有更多了</span>}
      </div>
    </div>
  );
}
```

### 11.3 性能问题

#### 问题1：如何优化大型列表渲染？

```tsx
// 使用虚拟列表优化大型列表
// components/VirtualList.tsx
'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
}

export default function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // 计算可见范围
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  // 可见的项目
  const visibleItems = items.slice(startIndex, endIndex);

  // 滚动处理
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
      }}
    >
      {/* 占位元素，撑起滚动条 */}
      <div style={{ height: items.length * itemHeight }} />

      {/* 可见项目容器 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          transform: `translateY(${startIndex * itemHeight}px)`,
        }}
      >
        {visibleItems.map((item, index) => (
          <div
            key={startIndex + index}
            style={{ height: itemHeight }}
          >
            {renderItem(item, startIndex + index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// 使用示例
function UserList({ users }) {
  return (
    <VirtualList
      items={users}
      itemHeight={60}
      containerHeight={600}
      renderItem={(user, index) => (
        <div className="p-4 border-b flex items-center">
          <img src={user.avatar} className="w-10 h-10 rounded-full" />
          <div className="ml-4">
            <div className="font-bold">{user.name}</div>
            <div className="text-gray-500">{user.email}</div>
          </div>
        </div>
      )}
    />
  );
}
```

#### 问题2：如何优化图片加载？

```tsx
// components/OptimizedImage.tsx
import Image from 'next/image';

// 图片占位符生成
function shimmer(width: number, height: number): string {
  return `
    <svg width="${width}" height="${height}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <linearGradient id="g">
          <stop stop-color="#f0f0f0" offset="20%" />
          <stop stop-color="#e0e0e0" offset="50%" />
          <stop stop-color="#f0f0f0" offset="70%" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="#f0f0f0" />
      <rect id="r" width="${width}" height="${height}" fill="url(#g)" />
      <animate xlink:href="#r" attributeName="x" from="-${width}" to="${width}" dur="1s" repeatCount="indefinite" />
    </svg>
  `;
}

function toBase64(str: string): string {
  return typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str);
}

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
}: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      placeholder="blur"
      blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(width, height))}`}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      style={{
        width: '100%',
        height: 'auto',
      }}
    />
  );
}
```

---

## 十二、性能优化进阶

### 12.1 缓存策略详解

```tsx
// ==================== 缓存策略配置 ====================

// 1. 静态数据：永久缓存
// app/layout.tsx
export const dynamic = 'force-static'; // 强制静态生成

// 2. 动态数据：按需重新验证
// app/products/page.tsx
export const revalidate = 3600; // 1小时后重新验证

// 3. 完全动态：每次请求都重新渲染
// app/dashboard/page.tsx
export const dynamic = 'force-dynamic';

// 4. 使用 fetch 缓存选项
async function getData() {
  // 不缓存
  const data1 = await fetch('/api/data', { cache: 'no-store' });

  // 永久缓存
  const data2 = await fetch('/api/data', { cache: 'force-cache' });

  // 定时重新验证
  const data3 = await fetch('/api/data', {
    next: { revalidate: 60 }
  });

  // 按标签重新验证
  const data4 = await fetch('/api/data', {
    next: { tags: ['users'] }
  });
}

// 5. 按需重新验证
// app/actions/revalidate.ts
'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

// 重新验证特定路径
export async function refreshProducts() {
  revalidatePath('/products');
}

// 重新验证特定标签
export async function refreshUserData() {
  revalidateTag('users');
}

// 重新验证所有数据
export async function refreshAll() {
  revalidatePath('/', 'layout');
}
```

### 12.2 代码分割策略

```tsx
// ==================== 动态导入策略 ====================

// 1. 客户端动态导入
import dynamic from 'next/dynamic';

// 带加载状态的动态导入
const DynamicChart = dynamic(() => import('@/components/Chart'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded" />,
  ssr: false, // 禁用服务端渲染
});

// 2. 条件导入
function ConditionalComponent({ showChart }) {
  if (!showChart) return null;

  // 动态导入只在条件满足时加载
  const Chart = dynamic(() => import('@/components/Chart'));
  return <Chart />;
}

// 3. 预加载
import { preload } from 'react-dom';

function ProductCard({ productId }) {
  const handleMouseEnter = () => {
    // 鼠标悬停时预加载详情页数据
    preload(`/api/products/${productId}`, { as: 'fetch' });
  };

  return (
    <Link
      href={`/products/${productId}`}
      onMouseEnter={handleMouseEnter}
    >
      查看详情
    </Link>
  );
}

// 4. 组件级代码分割
// components/HeavyComponent.tsx
export default function HeavyComponent() {
  // 这个组件会被单独打包
  return <div>重型组件</div>;
}

// app/page.tsx
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(
  () => import('@/components/HeavyComponent'),
  { ssr: false }
);

export default function Page() {
  return (
    <div>
      <h1>首页</h1>
      <HeavyComponent />
    </div>
  );
}
```

### 12.3 流式渲染优化

```tsx
// ==================== 流式渲染最佳实践 ====================

// app/dashboard/page.tsx
import { Suspense } from 'react';

// 分层加载策略
export default function DashboardPage() {
  return (
    <div>
      {/* 第一层：立即显示 */}
      <DashboardHeader />

      {/* 第二层：关键数据 */}
      <div className="grid grid-cols-3 gap-4">
        <Suspense fallback={<StatCardSkeleton />}>
          <RevenueCard />
        </Suspense>
        <Suspense fallback={<StatCardSkeleton />}>
          <OrdersCard />
        </Suspense>
        <Suspense fallback={<StatCardSkeleton />}>
          <UsersCard />
        </Suspense>
      </div>

      {/* 第三层：次要内容 */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <Suspense fallback={<ChartSkeleton />}>
          <SalesChart />
        </Suspense>
        <Suspense fallback={<TableSkeleton />}>
          <RecentOrders />
        </Suspense>
      </div>

      {/* 第四层：延迟加载 */}
      <div className="mt-6">
        <Suspense fallback={<div>加载推荐...</div>}>
          <Recommendations />
        </Suspense>
      </div>
    </div>
  );
}

// 骨架屏组件
function StatCardSkeleton() {
  return (
    <div className="p-6 bg-white rounded-lg shadow animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
      <div className="h-8 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-1/3" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-80 bg-gray-100 rounded-lg animate-pulse">
      <div className="h-full flex items-center justify-center text-gray-400">
        加载图表...
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-4 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 mb-3">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
        </div>
      ))}
    </div>
  );
}
```

---

## 十三、面试高频问题

### 13.1 基础概念题

#### Q1：Next.js 中 App Router 和 Pages Router 有什么区别？

**答案要点：**

| 特性 | App Router | Pages Router |
|------|------------|--------------|
| 目录 | app/ | pages/ |
| 布局 | 支持嵌套布局 | 需要自定义 _app.js |
| 服务端组件 | 默认支持 | 需要配置 |
| 数据获取 | async/await | getServerSideProps |
| 加载状态 | 内置 loading.tsx | 需要手动处理 |
| 错误处理 | 内置 error.tsx | 需要自定义 |
| 路由组 | 支持 | 不支持 |

**代码对比：**
```tsx
// Pages Router (pages/users/[id].tsx)
import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!;
  const user = await fetchUser(id as string);

  return {
    props: { user },
  };
};

export default function UserPage({ user }) {
  return <div>{user.name}</div>;
}

// App Router (app/users/[id]/page.tsx)
export default async function UserPage({ params }) {
  const { id } = await params;
  const user = await fetchUser(id);

  return <div>{user.name}</div>;
}
```

#### Q2：什么是 ISR（增量静态再生）？如何使用？

**答案要点：**

ISR 允许在构建后更新静态页面，无需重新部署整个应用。

**使用方式：**
```tsx
// 方式1：页面级配置
export const revalidate = 60; // 60秒后重新验证

export default async function ProductsPage() {
  const products = await fetchProducts();
  return <ProductList products={products} />;
}

// 方式2：fetch 级配置
async function getProducts() {
  const products = await fetch('/api/products', {
    next: { revalidate: 60 }
  }).then(res => res.json());

  return products;
}

// 方式3：按需重新验证
'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

export async function updateProduct(id: string, data: any) {
  await db.products.update({ where: { id }, data });

  // 重新验证特定路径
  revalidatePath('/products');
  revalidatePath(`/products/${id}`);

  // 或重新验证特定标签
  revalidateTag('products');
}
```

#### Q3：Next.js 中的中间件有什么作用？

**答案要点：**

中间件允许在请求完成之前运行代码，用于：
- 认证和授权
- 重定向
- 重写 URL
- 添加请求头
- 日志记录

**代码示例：**
```tsx
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 认证检查
  const token = request.cookies.get('token');

  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 添加请求头
  const response = NextResponse.next();
  response.headers.set('x-request-id', crypto.randomUUID());

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
```

### 13.2 进阶问题

#### Q4：如何优化 Next.js 应用的首屏加载速度？

**答案要点：**

```
┌─────────────────────────────────────────────────────────────┐
│                  Next.js 首屏优化策略                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 使用服务端组件                                           │
│     - 减少客户端 JavaScript                                  │
│     - 数据在服务端获取                                       │
│                                                             │
│  2. 流式渲染                                                 │
│     - 使用 Suspense 分层加载                                 │
│     - 关键内容优先显示                                       │
│                                                             │
│  3. 图片优化                                                 │
│     - 使用 next/image                                        │
│     - 设置合适的 sizes 属性                                  │
│     - 使用 placeholder="blur"                                │
│                                                             │
│  4. 字体优化                                                 │
│     - 使用 next/font                                         │
│     - 设置 display: 'swap'                                   │
│                                                             │
│  5. 代码分割                                                 │
│     - 使用 dynamic 导入                                      │
│     - 按需加载非关键组件                                     │
│                                                             │
│  6. 缓存策略                                                 │
│     - 合理设置 revalidate                                    │
│     - 使用 ISR 减少服务器负载                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Q5：Next.js 如何实现 SEO 优化？

**答案要点：**

```tsx
// 1. 元数据配置
// app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: '我的应用',
    template: '%s | 我的应用',
  },
  description: '应用描述',
  keywords: ['关键词1', '关键词2'],
  authors: [{ name: '作者' }],
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://example.com',
    siteName: '我的应用',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
};

// 2. 动态元数据
// app/products/[id]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [product.image],
    },
  };
}

// 3. 结构化数据
// app/products/[id]/page.tsx
export default async function ProductPage({ params }) {
  const { id } = await params;
  const product = await getProduct(id);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'CNY',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetails product={product} />
    </>
  );
}

// 4. Sitemap 生成
// app/sitemap.ts
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();

  const productUrls = products.map(product => ({
    url: `https://example.com/products/${product.id}`,
    lastModified: product.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    { url: 'https://example.com', lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: 'https://example.com/products', lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    ...productUrls,
  ];
}

// 5. robots.txt
// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/'],
    },
    sitemap: 'https://example.com/sitemap.xml',
  };
}
```

### 13.3 实战场景题

#### Q6：如何实现一个支持搜索、筛选、分页的产品列表？

```tsx
// app/products/page.tsx
import { Suspense } from 'react';
import ProductList from '@/components/products/ProductList';
import ProductFilters from '@/components/products/ProductFilters';
import ProductSearch from '@/components/products/ProductSearch';

interface SearchParams {
  q?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page?: string;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">产品列表</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 筛选侧边栏 */}
        <div className="lg:col-span-1">
          <ProductFilters />
        </div>

        {/* 产品列表 */}
        <div className="lg:col-span-3">
          {/* 搜索栏 */}
          <ProductSearch />

          {/* 产品网格 */}
          <Suspense fallback={<ProductGridSkeleton />} key={JSON.stringify(params)}>
            <ProductList searchParams={params} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

// components/products/ProductList.tsx
import Link from 'next/link';

interface ProductListProps {
  searchParams: {
    q?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    page?: string;
  };
}

export default async function ProductList({ searchParams }: ProductListProps) {
  // 构建查询参数
  const queryParams = new URLSearchParams();
  if (searchParams.q) queryParams.set('q', searchParams.q);
  if (searchParams.category) queryParams.set('category', searchParams.category);
  if (searchParams.minPrice) queryParams.set('minPrice', searchParams.minPrice);
  if (searchParams.maxPrice) queryParams.set('maxPrice', searchParams.maxPrice);
  if (searchParams.sort) queryParams.set('sort', searchParams.sort);
  queryParams.set('page', searchParams.page || '1');

  // 获取产品数据
  const response = await fetch(
    `${process.env.API_URL}/products?${queryParams}`,
    { next: { revalidate: 60 } }
  );

  const { products, pagination } = await response.json();

  return (
    <div>
      {/* 产品网格 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.map(product => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
          >
            <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
            <h3 className="mt-2 font-bold">{product.name}</h3>
            <p className="text-gray-600">¥{product.price}</p>
          </Link>
        ))}
      </div>

      {/* 分页 */}
      <div className="mt-6 flex justify-center gap-2">
        {pagination.currentPage > 1 && (
          <Link
            href={`/products?${queryParams.toString().replace(/page=\d+/, `page=${pagination.currentPage - 1}`)}`}
            className="px-4 py-2 border rounded"
          >
            上一页
          </Link>
        )}

        <span className="px-4 py-2">
          第 {pagination.currentPage} / {pagination.totalPages} 页
        </span>

        {pagination.currentPage < pagination.totalPages && (
          <Link
            href={`/products?${queryParams.toString().replace(/page=\d+/, `page=${pagination.currentPage + 1}`)}`}
            className="px-4 py-2 border rounded"
          >
            下一页
          </Link>
        )}
      </div>
    </div>
  );
}
```

---

## 十四、与其他框架对比

### 14.1 Next.js vs Remix

| 特性 | Next.js | Remix |
|------|---------|-------|
| **路由** | 文件系统路由 | 文件系统路由 |
| **数据加载** | async/await | Loader 函数 |
| **数据提交** | Server Actions | Action 函数 |
| **错误处理** | error.tsx | ErrorBoundary |
| **缓存** | 内置多种策略 | 需要手动配置 |
| **部署** | Vercel 优化 | 多平台支持 |
| **生态** | 更丰富 | 发展中 |

### 14.2 Next.js vs Nuxt

| 特性 | Next.js | Nuxt |
|------|---------|------|
| **框架基础** | React | Vue |
| **服务端组件** | 原生支持 | 需要配置 |
| **状态管理** | Zustand/Redux | Pinia |
| **类型支持** | TypeScript | TypeScript |
| **学习曲线** | 中等 | 较低 |
| **生态** | 更丰富 | 较丰富 |

---

## 十五、最佳实践总结

### 15.1 项目结构建议

```
app/
├── (auth)/              # 认证相关页面
│   ├── login/
│   └── register/
├── (dashboard)/         # 仪表盘相关页面
│   ├── layout.tsx
│   └── page.tsx
├── api/                 # API 路由
│   └── users/
├── actions/             # Server Actions
│   └── user.ts
├── components/          # 共享组件
│   ├── ui/              # 基础 UI 组件
│   └── features/        # 功能组件
├── hooks/               # 自定义 Hooks
├── lib/                 # 工具函数
│   ├── db.ts            # 数据库连接
│   └── utils.ts         # 工具函数
├── types/               # 类型定义
└── styles/              # 样式文件
```

### 15.2 性能检查清单

- [ ] 使用 Server Components 获取数据
- [ ] 合理使用 Suspense 进行流式渲染
- [ ] 图片使用 next/image 组件
- [ ] 字体使用 next/font 优化
- [ ] 设置合理的缓存策略
- [ ] 使用动态导入减少初始包大小
- [ ] 配置适当的元数据
- [ ] 使用中间件进行认证
- [ ] 实现错误边界处理
- [ ] 配置 sitemap 和 robots.txt

---

## 十六、Next.js 16 与 Next.js 14 对比

### 16.1 核心差异

| 特性 | Next.js 14 | Next.js 16 | 说明 |
|------|------------|------------|------|
| React 版本 | 18 | 19 | Next.js 16 使用 React 19 |
| App Router | 稳定 | 增强 | 更多优化和改进 |
| Server Actions | 稳定 | 增强 | 更好的类型推断 |
| Turbopack | Beta | 稳定 | 构建速度大幅提升 |
| 缓存策略 | 静态/动态 | 静态/动态/增量 | 更灵活的缓存控制 |
| Metadata API | 基础 | 增强 | 更多 SEO 特性支持 |
| 图像优化 | next/image | next/image | 新增 AVIF 支持 |
| 边缘函数 | 支持 | 增强 | 更好的边缘部署 |

### 16.2 迁移指南

```tsx
// Next.js 14: 静态生成 + 客户端交互
// app/posts/[id]/page.tsx
export async function generateStaticParams() {
  const posts = await fetchPosts();
  return posts.map(post => ({ id: post.id }));
}

async function PostPage({ params }) {
  const post = await fetchPost(params.id);

  return (
    <article>
      <h1>{post.title}</h1>
      <PostContent content={post.content} />
      <LikeButton initialLikes={post.likes} />
    </article>
  );
}

// app/components/LikeButton.tsx
'use client';
function LikeButton({ initialLikes }) {
  // ... 客户端逻辑
}

// Next.js 16: 更优化的架构
// app/posts/[id]/page.tsx
async function PostPage({ params }) {
  const post = await fetchPost(params.id);

  return (
    <article>
      <h1>{post.title}</h1>
      {/* 直接在服务端组件中处理 */}
      <Suspense fallback={<div>加载中...</div>}>
        <PostContent postId={params.id} />
      </Suspense>
      {/* 交互部分使用客户端组件 */}
      <LikeButton initialLikes={post.likes} />
    </article>
  );
}

// app/components/LikeButton.tsx
'use client';
import { useOptimistic } from 'react';

function LikeButton({ initialLikes }) {
  const [optimisticLikes, addOptimistic] = useOptimistic(
    initialLikes,
    (state, value) => state + value
  );

  async function handleLike() {
    addOptimistic(1);
    await toggleLike();
  }

  return <button onClick={handleLike}>👍 {optimisticLikes}</button>;
}
```

### 16.3 Turbopack 配置

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Turbopack 配置
  experimental: {
    // 启用 Turbopack（Next.js 16 默认启用）
    turbolinks: true,

    // 优化包大小
    optimizePackageImports: ['lucide-react', 'antd', '@mui/material'],

    // 优化 CSS
    optimizeCss: true,
  },

  // 图片优化
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.example.com',
      },
    ],
  },

  // 编译优化
  compiler: {
    // 移除开发环境日志
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
```

---

## 十七、常见面试题

### 17.1 App Router 相关

**问题1：App Router 和 Pages Router 有什么区别？**

答案：
- **App Router**：使用 `app/` 目录，支持 Server Components、嵌套布局、流式渲染
- **Pages Router**：使用 `pages/` 目录，基于文件的路由系统
- **主要区别**：
  1. App Router 默认服务端渲染，Pages Router 默认客户端渲染
  2. App Router 支持布局嵌套，Pages Router 使用 `_app.js`
  3. App Router 使用 React 19 新特性（Server Components 等）
  4. App Router 提供更灵活的缓存策略

**问题2：如何选择 Server Component 还是 Client Component？**

答案：
- **Server Components**：数据获取、访问服务端资源、大多数 UI 渲染
- **Client Components**：`useState`、`useEffect`、事件处理、浏览器 API

### 17.2 数据获取相关

**问题3：Next.js 有哪些数据获取方式？**

答案：
1. **服务端组件直接获取**：在 Server Components 中直接使用数据库查询、fetch 等
2. **generateStaticParams**：静态生成页面参数
3. **fetch API with caching**：使用 Next.js 扩展的 fetch API
4. **React Server Components**：使用 React 19 的 use() Hook
5. **Client-side fetching**：使用 SWR/React Query 客户端获取

**问题4：如何实现增量静态再生成（ISR）？**

答案：
```tsx
// app/blog/[slug]/page.tsx

// 使用 revalidate 设置增量重建时间
export const revalidate = 60; // 60 秒后重新验证

async function BlogPost({ params }) {
  const post = await fetchPost(params.slug);

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}

// 或者使用 unstable_cache
import { unstable_cache } from 'next/cache';

const getCachedPost = unstable_cache(
  async (slug) => fetchPost(slug),
  ['post'],
  { revalidate: 60, tags: ['post'] }
);
```

### 17.3 缓存与性能相关

**问题5：Next.js 的缓存机制是怎样的？**

答案：
- **Fetch Cache**：默认缓存 fetch 请求，可通过 `cache: 'no-store'` 禁用
- **Full Route Cache**：静态路由的渲染结果缓存
- **Data Cache**：服务端数据请求的缓存
- **Router Cache**：客户端路由切换时的缓存
- **unstale-while-revalidate**：默认的缓存策略

**问题6：如何优化首屏加载性能？**

答案：
1. 使用 Server Components 减少客户端 JavaScript
2. 使用 next/image 自动优化图片
3. 使用 next/font 自动优化字体
4. 使用 Suspense 实现流式渲染
5. 懒加载非关键组件
6. 减少不必要的客户端组件

### 17.4 Server Actions 相关

**问题7：Server Actions 如何保证安全性？**

答案：
1. **内置 CSRF 保护**：React 自动验证请求来源
2. **类型安全**：参数自动序列化，防止注入
3. **服务端执行**：敏感逻辑不会暴露到客户端
4. **错误处理**：可以返回结构化错误信息

**问题8：什么时候使用 Server Actions？**

答案：
- 表单提交
- 数据创建、更新、删除
- 需要访问服务端资源的操作
- 需要保护敏感逻辑的操作

### 17.5 综合设计面试题

**问题9：如何设计一个 Next.js 16 的电商网站？**

答案：
```tsx
// 架构设计：

// 1. 服务端组件获取数据
// app/page.tsx - 首页
async function HomePage() {
  const featuredProducts = await getFeaturedProducts();
  const categories = await getCategories();

  return (
    <div>
      <Hero />
      <CategoryList categories={categories} />
      <ProductGrid products={featuredProducts} />
    </div>
  );
}

// 2. 产品详情页 - SSG + ISR
// app/products/[slug]/page.tsx
export const revalidate = 3600; // 每小时重新验证

async function ProductPage({ params }) {
  const product = await getProduct(params.slug);

  return (
    <div>
      <ProductGallery images={product.images} />
      <ProductInfo product={product} />
      <AddToCartButton product={product} />
      <ProductReviews productId={product.id} />
    </div>
  );
}

// 3. 购物车 - 客户端组件
'use client';

function AddToCartButton({ product }) {
  const [optimisticCart, addOptimistic] = useOptimistic(
    cart,
    (state, product) => [...state, product]
  );

  async function handleAddToCart() {
    addOptimistic(product);
    await addToCart(product.id);
  }

  return (
    <button onClick={handleAddToCart}>
      加入购物车
    </button>
  );
}

// 4. 搜索 - 使用 Server Actions
// app/actions/search.ts
'use server';

export async function searchProducts(query: string) {
  const products = await db.products.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { description: { contains: query } },
      ],
    },
  });

  return products;
}

// 5. 订单提交 - Server Action
// app/actions/order.ts
'use server';

export async function createOrder(formData: FormData) {
  const items = JSON.parse(formData.get('items') as string);
  const shippingAddress = {
    street: formData.get('street'),
    city: formData.get('city'),
    // ...
  };

  const order = await db.order.create({
    data: {
      items,
      shippingAddress,
      total: calculateTotal(items),
    },
  });

  revalidatePath('/orders');
  return order;
}

// 6. 性能优化
// - 使用 next/image 优化产品图片
// - 使用 next/font 优化字体加载
// - 使用 Suspense 实现流式渲染
// - 使用 ISR 缓存产品页面
// - 使用中间件进行 A/B 测试
```

**问题10：Next.js 16 的最佳实践有哪些？**

答案：
1. **默认使用 Server Components**：只在需要交互时使用 Client Components
2. **合理使用缓存**：根据数据更新频率设置合适的缓存策略
3. **优化图片和字体**：使用 Next.js 内置优化组件
4. **使用 Suspense 提升 UX**：提供渐进式加载体验
5. **TypeScript 优先**：充分利用类型安全
6. **合理组织目录结构**：分离服务端和客户端代码

---

## 十八、附录

### 18.1 Next.js 常用命令

```bash
# 开发
npm run dev          # 启动开发服务器
npm run dev -- --turbo  # 使用 Turbopack

# 构建
npm run build        # 生产构建
npm run start        # 启动生产服务器

# 其他
npm run lint         # 代码检查
npm run lint:fix     # 自动修复
npm run type-check   # 类型检查
```

### 18.2 常用配置模板

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 图片优化
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  // 头部配置
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ];
  },

  // 重定向
  async redirects() {
    return [
      { source: '/old/:path*', destination: '/new/:path*', permanent: true },
    ];
  },

  // 路径别名（已在 tsconfig.json 中配置）
  // resolve: { alias: { '@/*': './src/*' } }
};

export default nextConfig;
```

### 18.3 常见错误排查

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| Hydration mismatch | 服务端和客户端 HTML 不一致 | 检查日期格式化、时间戳等 |
| 404 on navigation | 动态路由未正确生成 | 使用 generateStaticParams |
| Stale data | 缓存未及时更新 | 设置合适的 revalidate |
| Module not found | 导入路径错误 | 检查 tsconfig.json 别名配置 |

---

*本文档最后更新于 2026年3月*