# Next.js 16 App Router 完整教程

> 基于 MDN 和 Next.js 官方文档整理  
> 最后更新：2026年3月

---

## 一、入门指南（Getting Started）

### 1.1 Next.js 概述

Next.js 是由 Vercel 开发的 React 全栈框架，提供了完整的全栈开发解决方案。Next.js 16 是最新版本，基于 React 19 构建，引入了多项重大更新。

#### 核心特性

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

#### App Router vs Pages Router

| 特性 | App Router | Pages Router |
|------|------------|--------------|
| **目录** | `app/` | `pages/` |
| **布局** | 支持嵌套布局 | 需要自定义 `_app.js` |
| **服务端组件** | 默认支持 | 需要配置 |
| **数据获取** | `async/await` | `getServerSideProps` |
| **加载状态** | 内置 `loading.tsx` | 需要手动处理 |
| **错误处理** | 内置 `error.tsx` | 需要自定义 |
| **路由组** | 支持 | 不支持 |

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

#### 创建项目时的配置选项

```bash
# 使用 TypeScript
npx create-next-app@latest my-app --typescript

# 使用 ESLint
npx create-next-app@latest my-app --eslint

# 使用 Tailwind CSS
npx create-next-app@latest my-app --tailwind

# 使用 src 目录
npx create-next-app@latest my-app --src-dir

# 使用 App Router
npx create-next-app@latest my-app --app

# 使用 Turbopack
npx create-next-app@latest my-app --turbopack

# 自定义导入别名
npx create-next-app@latest my-app --import-alias "@/*"
```

### 1.3 开发服务器

```bash
# 启动开发服务器
npm run dev

# 自定义端口
npm run dev -- -p 3001

# 自定义主机
npm run dev -- -H 0.0.0.0

# 启用 HTTPS
npm run dev -- --https

# 使用自定义证书
npm run dev -- --https --key ./certs/key.pem --cert ./certs/cert.pem
```

#### 开发服务器配置

```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

### 1.4 配置选项

#### next.config.js 配置文件

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用静态导出
  output: 'export',
  
  // 自定义构建目录
  distDir: '.next',
  
  // 自定义构建 ID
  buildId: 'my-app',
  
  // 压缩
  compress: true,
  
  // HTTP 代理
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/:path*',
      },
    ];
  },
  
  // 自定义 headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Custom-Header',
            value: 'My Custom Header',
          },
        ],
      },
    ];
  },
  
  // 图片优化配置
  images: {
    domains: ['example.com', 'cdn.example.com'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // TypeScript 配置
  typescript: {
    // 忽略 TypeScript 类型检查
    ignoreBuildErrors: false,
    // TypeScript 配置文件路径
    tsconfigPath: 'tsconfig.json',
  },
  
  // ESLint 配置
  eslint: {
    // 忽略 ESLint 错误
    ignoreDuringBuilds: false,
    // ESLint 配置文件路径
    configFile: '.eslintrc.json',
  },
  
  // Webpack 配置
  webpack: (config, { isServer }) => {
    // 自定义 webpack 配置
    return config;
  },
  
  // 实验性功能
  experimental: {
    // 优化图片加载
    optimizeCss: true,
    // 优化字体加载
    optimizeFonts: true,
    // 优化样式
    optimizeStyles: true,
    // 优化脚本
    optimizeScripts: true,
  },
};

module.exports = nextConfig;
```

### 1.5 TypeScript 配置

#### tsconfig.json 配置文件

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

---

## 二、项目结构（Project Structure）

### 2.1 目录结构详解

```
app/
├── layout.tsx              # 根布局（必需）
├── page.tsx                # 首页
├── loading.tsx             # 加载状态
├── error.tsx               # 错误处理
├── not-found.tsx           # 404 页面
├── globals.css             # 全局样式
├── robots.ts               # robots.txt 生成
├── sitemap.ts              # sitemap.xml 生成
├── manifest.json           # PWA 清单
│
├── (auth)/                 # 路由组（不影响 URL）
│   ├── layout.tsx
│   ├── login/
│   │   └── page.tsx        # /login
│   └── register/
│       └── page.tsx        # /register
│
├── (dashboard)/            # 路由组
│   ├── layout.tsx
│   ├── page.tsx            # /dashboard
│   ├── users/
│   │   └── page.tsx        # /dashboard/users
│   └── settings/
│       └── page.tsx        # /dashboard/settings
│
├── products/               # 路由段
│   ├── page.tsx            # /products
│   └── [id]/               # 动态路由
│       ├── page.tsx        # /products/123
│       └── loading.tsx
│
├── api/                    # API 路由
│   └── users/
│       └── route.ts        # /api/users
│
├── actions/                # Server Actions
│   └── user.ts
│
├── (blog)/                 # 博客路由组
│   ├── layout.tsx
│   ├── page.tsx            # /blog
│   └── [slug]/             # 动态路由
│       └── page.tsx        # /blog/my-post
│
├── (admin)/                # 管理员路由组
│   ├── layout.tsx
│   └── page.tsx            # /admin
│
└── dashboard/
    ├── layout.tsx          # 嵌套布局
    ├── page.tsx            # /dashboard
    ├── users/
    │   └── page.tsx        # /dashboard/users
    └── settings/
        └── page.tsx        # /dashboard/settings
```

### 2.2 layout.tsx 布局文件

#### 根布局（必需）

```tsx
// app/layout.tsx - 根布局（必需）
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

// 页面元数据
export const metadata: Metadata = {
  title: {
    default: '我的应用',
    template: '%s | 我的应用', // 子页面标题模板
  },
  description: 'Next.js 16 应用',
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
  robots: {
    index: true,
    follow: true,
  },
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

#### 嵌套布局

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

### 2.3 page.tsx 页面文件

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

### 2.4 loading.tsx 加载状态

```tsx
// app/products/loading.tsx - 加载状态
export default function ProductsLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="p-4 border rounded-lg animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
```

### 2.5 error.tsx 错误处理

```tsx
// app/products/error.tsx - 错误处理
'use client';

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-4">
      <h2>出错了！</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>重试</button>
    </div>
  );
}
```

### 2.6 not-found.tsx 404 页面

```tsx
// app/products/not-found.tsx - 404 页面
import Link from 'next/link';

export default function ProductsNotFound() {
  return (
    <div className="p-4">
      <h2>产品不存在</h2>
      <Link href="/products">返回产品列表</Link>
    </div>
  );
}
```

### 2.7 route.ts API 路由

```tsx
// app/api/users/route.ts - API 路由
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

### 2.8 actions.ts Server Actions

```tsx
// app/actions/user.ts - Server Actions
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

---

## 三、布局和页面（Layouts and Pages）

### 3.1 根布局（Root Layout）

根布局是应用的顶层布局，包含所有页面。

```tsx
// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '我的应用',
  description: 'Next.js 16 应用',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
```

### 3.2 嵌套布局（Nested Layouts）

嵌套布局允许在不同路由层级使用不同的布局。

```tsx
// app/layout.tsx - 根布局
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <header>全局导航栏</header>
        <main>{children}</main>
        <footer>全局页脚</footer>
      </body>
    </html>
  );
}

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
        {children}
      </section>
    </div>
  );
}

// app/dashboard/page.tsx - 仪表盘页面
export default function DashboardPage() {
  return <h1>仪表盘</h1>;
}
```

### 3.3 并行路由（Parallel Routes）

并行路由允许在同一个路由层级渲染多个组件。

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
  sidebar,
  analytics,
}: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  analytics: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <aside className="col-span-1">{sidebar}</aside>
      <main className="col-span-3">{children}</main>
      <aside className="col-span-1">{analytics}</aside>
    </div>
  );
}

// app/dashboard/@sidebar/page.tsx
export default function SidebarPage() {
  return <div>侧边栏内容</div>;
}

// app/dashboard/@analytics/page.tsx
export default function AnalyticsPage() {
  return <div>分析内容</div>;
}

// app/dashboard/page.tsx
export default function DashboardPage() {
  return <div>主内容</div>;
}
```

### 3.4 路由组（Route Groups）

路由组允许组织路由而不影响 URL。

```tsx
// app/(auth)/layout.tsx - 认证路由组布局
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-container">
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

### 3.5 页面（Pages）

页面是路由的最终渲染内容。

```tsx
// app/page.tsx - 首页
export default function HomePage() {
  return <h1>欢迎来到首页</h1>;
}

// app/about/page.tsx - 关于页面
export default function AboutPage() {
  return <h1>关于我们</h1>;
}

// app/contact/page.tsx - 联系页面
export default function ContactPage() {
  return <h1>联系我们</h1>;
}
```

### 3.6 动态路由（Dynamic Routes）

动态路由允许创建基于参数的路由。

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

---

## 四、链接和导航（Linking and Navigation）

### 4.1 Link 组件

```tsx
// app/page.tsx
import Link from 'next/link';

export default function HomePage() {
  return (
    <div>
      {/* 基础链接 */}
      <Link href="/about">关于页面</Link>

      {/* 带查询参数的链接 */}
      <Link href="/products?category=electronics">电子产品</Link>

      {/* 带哈希的链接 */}
      <Link href="/docs#installation">安装指南</Link>

      {/* 替换当前历史记录 */}
      <Link href="/dashboard" replace>仪表盘</Link>

      {/* 传递状态 */}
      <Link href="/dashboard" state={{ from: 'home' }}>仪表盘</Link>

      {/* 自定义样式 */}
      <Link href="/dashboard" className="text-blue-500 hover:text-blue-700">
        仪表盘
      </Link>
    </div>
  );
}
```

### 4.2 useRouter Hook

```tsx
// components/Navigation.tsx
'use client';

import { useRouter } from 'next/navigation';

export function Navigation() {
  const router = useRouter();

  const handleNavigate = () => {
    // 导航到新页面
    router.push('/dashboard');

    // 替换当前历史记录
    router.replace('/settings');

    // 返回上一页
    router.back();

    // 前进到下一页
    router.forward();

    // 传递状态
    router.push('/profile', { state: { userId: '123' } });
  };

  return (
    <nav>
      <button onClick={() => router.push('/home')}>首页</button>
      <button onClick={() => router.push('/about')}>关于</button>
    </nav>
  );
}
```

### 4.3 usePathname Hook

```tsx
// components/CurrentPath.tsx
'use client';

import { usePathname } from 'next/navigation';

export function CurrentPath() {
  const pathname = usePathname();

  return (
    <div>
      <p>当前路径: {pathname}</p>

      {/* 根据路径显示不同内容 */}
      {pathname === '/' && <p>欢迎来到首页</p>}
      {pathname === '/about' && <p>关于我们</p>}
      {pathname === '/contact' && <p>联系我们</p>}
    </div>
  );
}
```

### 4.4 useSearchParams Hook

```tsx
// components/SearchParams.tsx
'use client';

import { useSearchParams } from 'next/navigation';

export function SearchParams() {
  const searchParams = useSearchParams();

  // 获取查询参数
  const category = searchParams.get('category');
  const search = searchParams.get('search');

  return (
    <div>
      <p>分类: {category || '全部'}</p>
      <p>搜索: {search || '无'}</p>

      {/* 动态渲染内容 */}
      {category === 'electronics' && <p>显示电子产品</p>}
      {category === 'clothing' && <p>显示服装</p>}
    </div>
  );
}
```

### 4.5 navigate 函数

```tsx
// components/NavigationButtons.tsx
'use client';

import { useNavigate } from 'next/navigation';

export function NavigationButtons() {
  const navigate = useNavigate();

  return (
    <div>
      <button onClick={() => navigate('/home')}>首页</button>
      <button onClick={() => navigate('/about')}>关于</button>
      <button onClick={() => navigate(-1)}>返回</button>
      <button onClick={() => navigate(1)}>前进</button>
    </div>
  );
}
```

### 4.6 相对链接

```tsx
// app/products/[id]/page.tsx
import Link from 'next/link';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = params;

  return (
    <div>
      {/* 相对链接 */}
      <Link href="../">返回产品列表</Link>
      <Link href="../../">返回上上级目录</Link>

      {/* 相对链接带查询参数 */}
      <Link href="?category=electronics">电子产品</Link>
      <Link href="?category=clothing&sort=price">服装（按价格排序）</Link>
    </div>
  );
}
```

---

## 五、Server 和 Client 组件（Server and Client Components）

### 5.1 Server Components 原理

Server Components 在服务器端渲染，不发送到客户端。

```tsx
// app/products/page.tsx - Server Component
import { db } from '@/lib/db';

// Server Component 默认就是 async
export default async function ProductsPage() {
  // 数据在服务器端获取
  const products = await db.products.findMany();

  return (
    <div>
      <h1>产品列表</h1>
      <ul>
        {products.map(product => (
          <li key={product.id}>{product.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 5.2 Client Components 原理

Client Components 在客户端渲染，可以使用 React Hooks。

```tsx
// components/Counter.tsx - Client Component
'use client';

import { useState } from 'react';

export default function Counter() {
  // 使用 useState Hook
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>计数: {count}</p>
      <button onClick={() => setCount(count + 1)}>增加</button>
    </div>
  );
}
```

### 5.3 "use client" 指令

```tsx
// components/InteractiveComponent.tsx
'use client';

import { useState, useEffect } from 'react';

export default function InteractiveComponent() {
  const [data, setData] = useState(null);

  // 使用 useEffect Hook
  useEffect(() => {
    // 客户端副作用
    const fetchData = async () => {
      const response = await fetch('/api/data');
      const result = await response.json();
      setData(result);
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1>交互式组件</h1>
      {data ? <pre>{JSON.stringify(data, null, 2)}</pre> : '加载中...'}
    </div>
  );
}
```

### 5.4 组件通信

```tsx
// app/page.tsx - 父组件
import ServerComponent from '@/components/ServerComponent';
import ClientComponent from '@/components/ClientComponent';

export default function HomePage() {
  return (
    <div>
      <ServerComponent />
      <ClientComponent />
    </div>
  );
}

// components/ServerComponent.tsx - Server Component
export default function ServerComponent() {
  return <div>服务器组件</div>;
}

// components/ClientComponent.tsx - Client Component
'use client';

export default function ClientComponent() {
  return <div>客户端组件</div>;
}
```

### 5.5 选择组件类型

```tsx
// ==================== 组件类型选择指南 ====================

// ✅ 使用 Server Component
// - 只需要在服务器端渲染的内容
// - 需要访问数据库或其他服务器资源
// - 不需要交互性
// - 需要 SEO 优化

// ❌ 使用 Client Component
// - 需要使用 React Hooks
// - 需要处理用户交互
// - 需要访问浏览器 API
// - 需要使用 useEffect、useState 等

// 🔄 混合使用
// - Server Component 传递数据给 Client Component
// - Client Component 作为交互容器

// 示例：混合使用
// app/products/page.tsx - Server Component
import ProductListClient from '@/components/ProductListClient';

export default async function ProductsPage() {
  // 在服务器端获取数据
  const products = await fetchProducts();

  // 传递数据给客户端组件
  return <ProductListClient products={products} />;
}

// components/ProductListClient.tsx - Client Component
'use client';

interface ProductListClientProps {
  products: { id: number; name: string }[];
}

export default function ProductListClient({ products }: ProductListClientProps) {
  // 在客户端处理交互
  const [selectedProduct, setSelectedProduct] = useState(null);

  return (
    <div>
      {products.map(product => (
        <button
          key={product.id}
          onClick={() => setSelectedProduct(product)}
        >
          {product.name}
        </button>
      ))}
    </div>
  );
}
```

---

## 六、缓存组件（Cache Components）

### 6.1 cache 函数

```tsx
// lib/cache.ts - 缓存函数
import { cache } from 'react';

// 创建缓存函数
export const getUser = cache(async (id: string) => {
  const user = await db.users.findUnique({ where: { id } });
  return user;
});

export const getProducts = cache(async () => {
  const products = await db.products.findMany();
  return products;
});

// app/users/[id]/page.tsx
import { getUser } from '@/lib/cache';

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser(id); // 使用缓存函数

  return <div>{user.name}</div>;
}
```

### 6.2 unstable_cache

```tsx
// lib/data.ts - 不稳定缓存
import { unstable_cache } from 'next/cache';

// 创建缓存函数
export const getPosts = unstable_cache(
  async () => {
    const posts = await db.posts.findMany();
    return posts;
  },
  ['posts'],
  { revalidate: 3600 } // 1小时后重新验证
);

export const getPost = unstable_cache(
  async (id: string) => {
    const post = await db.posts.findUnique({ where: { id } });
    return post;
  },
  ['posts', (id: string) => id],
  { revalidate: 3600 }
);

// app/posts/page.tsx
import { getPosts } from '@/lib/data';

export default async function PostsPage() {
  const posts = await getPosts();

  return (
    <div>
      {posts.map(post => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  );
}
```

### 6.3 缓存策略

```tsx
// ==================== 缓存策略 ====================

// 1. 不缓存（每次请求都重新获取）
const data1 = await fetch('/api/data', { cache: 'no-store' });

// 2. 永久缓存（默认）
const data2 = await fetch('/api/data', { cache: 'force-cache' });

// 3. 定时重新验证（ISR）
const data3 = await fetch('/api/data', {
  next: { revalidate: 60 } // 60秒后重新验证
});

// 4. 按标签重新验证
const data4 = await fetch('/api/data', {
  next: { tags: ['users'] }
});

// 5. 动态渲染
export const dynamic = 'force-dynamic';

// 6. 静态生成
export const dynamic = 'force-static';

// 7. 混合模式
export const dynamic = 'auto'; // 自动选择
```

### 6.4 重新验证

```tsx
// app/actions/revalidate.ts - 重新验证
'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

// 重新验证特定路径
export async function refreshProducts() {
  revalidatePath('/products');
  revalidatePath('/products/123');
}

// 重新验证特定标签
export async function refreshUserData() {
  revalidateTag('users');
}

// 重新验证所有数据
export async function refreshAll() {
  revalidatePath('/', 'layout');
}

// app/products/[id]/page.tsx
export const revalidate = 3600; // 1小时后重新验证

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await fetch(`/api/products/${id}`).then(res => res.json());

  return <div>{product.name}</div>;
}
```

---

## 七、获取数据（Fetching Data）

### 7.1 fetch API

```tsx
// app/products/page.tsx - 数据获取
export default async function ProductsPage() {
  // 基础 fetch
  const response = await fetch('https://api.example.com/products');
  const products = await response.json();

  // 带选项的 fetch
  const response2 = await fetch('https://api.example.com/products', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.API_TOKEN}`,
    },
    cache: 'no-store', // 不缓存
    // cache: 'force-cache', // 强制缓存（默认）
    // next: { revalidate: 60 }, // 60秒后重新验证
  });

  // 错误处理
  if (!response.ok) {
    throw new Error('获取产品失败');
  }

  return (
    <div>
      {products.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

### 7.2 数据获取模式

```tsx
// ==================== 数据获取模式 ====================

// 1. 串行获取
export default async function Page() {
  const user = await fetch('/api/user').then(res => res.json());
  const posts = await fetch('/api/posts').then(res => res.json());
  const comments = await fetch('/api/comments').then(res => res.json());

  return <div>{/* 渲染内容 */}</div>;
}

// 2. 并行获取
export default async function Page() {
  const [user, posts, comments] = await Promise.all([
    fetch('/api/user').then(res => res.json()),
    fetch('/api/posts').then(res => res.json()),
    fetch('/api/comments').then(res => res.json()),
  ]);

  return <div>{/* 渲染内容 */}</div>;
}

// 3. 流式获取
export default async function Page() {
  return (
    <div>
      <Suspense fallback={<div>加载中...</div>}>
        <SlowComponent />
      </Suspense>
    </div>
  );
}

async function SlowComponent() {
  const data = await fetch('/api/slow-data').then(res => res.json());
  return <div>{data}</div>;
}
```

### 7.3 流式获取

```tsx
// app/dashboard/page.tsx - 流式渲染
import { Suspense } from 'react';

export default async function DashboardPage() {
  return (
    <div>
      {/* 立即显示的内容 */}
      <h1>仪表盘</h1>

      {/* 分层加载 */}
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

      <div className="mt-6">
        <Suspense fallback={<ChartSkeleton />}>
          <SalesChart />
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
      <div className="h-8 bg-gray-200 rounded w-3/4" />
    </div>
  );
}

async function RevenueCard() {
  const data = await fetch('/api/revenue').then(res => res.json());
  return <div>收入: {data}</div>;
}

async function OrdersCard() {
  const data = await fetch('/api/orders').then(res => res.json());
  return <div>订单: {data}</div>;
}

async function UsersCard() {
  const data = await fetch('/api/users').then(res => res.json());
  return <div>用户: {data}</div>;
}

async function SalesChart() {
  const data = await fetch('/api/sales-chart').then(res => res.json());
  return <div>图表: {data}</div>;
}
```

### 7.4 错误处理

```tsx
// app/products/page.tsx - 错误处理
import { notFound, error } from 'next/navigation';

export default async function ProductsPage() {
  try {
    const response = await fetch('/api/products');

    if (response.status === 404) {
      notFound(); // 显示 404 页面
    }

    if (!response.ok) {
      throw new Error('获取产品失败'); // 显示 error.tsx
    }

    const products = await response.json();

    return (
      <div>
        {products.map(product => (
          <div key={product.id}>{product.name}</div>
        ))}
      </div>
    );
  } catch (error) {
    console.error(error);
    throw error; // 让 error.tsx 处理
  }
}

// app/products/error.tsx
'use client';

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-4">
      <h2>出错了！</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>重试</button>
    </div>
  );
}
```

---

## 八、更新数据（Mutating Data）

### 8.1 Server Actions

```tsx
// app/actions/user.ts - Server Actions
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
  revalidatePath('/users');
  revalidateTag('users');

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

  redirect('/users');
}
```

### 8.2 表单提交

```tsx
// app/users/create/page.tsx - 表单提交
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

### 8.3 乐观更新

```tsx
// components/UserForm.tsx - 乐观更新
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

// components/OptimisticUpdate.tsx - 使用 useOptimistic
'use client';

import { useOptimistic, useState } from 'react';

interface Item {
  id: number;
  name: string;
}

export function OptimisticUpdate() {
  const [items, setItems] = useState<Item[]>([]);
  const [optimisticItems, addOptimistic] = useOptimistic(
    items,
    (state, newItem: Item) => [...state, newItem]
  );

  const addItem = async () => {
    const newItem = { id: Date.now(), name: '新项目' };

    // 乐观更新
    addOptimistic(newItem);

    // 实际添加
    await fetch('/api/items', {
      method: 'POST',
      body: JSON.stringify(newItem),
    });

    setItems(prev => [...prev, newItem]);
  };

  return (
    <div>
      <button onClick={addItem}>添加项目</button>
      <ul>
        {optimisticItems.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 8.4 错误处理

```tsx
// app/actions/form.ts - Server Actions 错误处理
'use server';

import { revalidatePath } from 'next/cache';

export async function submitForm(formData: FormData) {
  const name = formData.get('name') as string;

  // 验证错误
  if (!name) {
    return {
      error: '姓名不能为空',
      success: false,
    };
  }

  try {
    // 提交表单
    await db.forms.create({ data: { name } });

    // 重新验证
    revalidatePath('/forms');

    return {
      success: true,
      message: '提交成功',
    };
  } catch (error) {
    return {
      error: '提交失败',
      success: false,
    };
  }
}

// components/Form.tsx - 客户端表单
'use client';

import { useActionState } from 'react';
import { submitForm } from '@/app/actions/form';

export function Form() {
  const [state, formAction, isPending] = useActionState(submitForm, null);

  return (
    <form action={formAction}>
      <input name="name" placeholder="姓名" required />

      <button type="submit" disabled={isPending}>
        {isPending ? '提交中...' : '提交'}
      </button>

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

## 九、缓存和重新验证（Caching and Revalidating）

### 9.1 缓存机制

```tsx
// ==================== 缓存机制 ====================

// 1. 请求缓存
const data1 = await fetch('/api/data', { cache: 'no-store' }); // 不缓存
const data2 = await fetch('/api/data', { cache: 'force-cache' }); // 强制缓存（默认）
const data3 = await fetch('/api/data', { next: { revalidate: 60 } }); // 定时重新验证

// 2. 路由缓存
export const revalidate = 3600; // 1小时后重新验证
export const dynamic = 'force-dynamic'; // 动态渲染
export const dynamic = 'force-static'; // 静态生成

// 3. 组件缓存
import { cache } from 'react';

export const getUser = cache(async (id: string) => {
  const user = await db.users.findUnique({ where: { id } });
  return user;
});
```

### 9.2 revalidatePath

```tsx
// app/actions/revalidate.ts - 重新验证路径
'use server';

import { revalidatePath } from 'next/cache';

// 重新验证特定路径
export async function refreshProducts() {
  revalidatePath('/products');
}

// 重新验证特定路径及其子路径
export async function refreshProduct(id: string) {
  revalidatePath(`/products/${id}`);
}

// 重新验证所有路径
export async function refreshAll() {
  revalidatePath('/', 'layout');
}

// app/products/[id]/page.tsx
export const revalidate = 3600; // 1小时后重新验证

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await fetch(`/api/products/${id}`).then(res => res.json());

  return <div>{product.name}</div>;
}
```

### 9.3 revalidateTag

```tsx
// lib/data.ts - 使用标签缓存
import { unstable_cache } from 'next/cache';

export const getProducts = unstable_cache(
  async () => {
    const products = await db.products.findMany();
    return products;
  },
  ['products'],
  { revalidate: 3600 }
);

export const getProduct = unstable_cache(
  async (id: string) => {
    const product = await db.products.findUnique({ where: { id } });
    return product;
  },
  ['products', (id: string) => id],
  { revalidate: 3600 }
);

// app/actions/revalidate.ts - 重新验证标签
'use server';

import { revalidateTag } from 'next/cache';

export async function refreshProducts() {
  revalidateTag('products');
}

export async function refreshProduct(id: string) {
  revalidateTag(`product-${id}`);
}
```

### 9.4 动态缓存

```tsx
// app/products/page.tsx - 动态缓存
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const category = params.category || 'all';

  // 根据参数动态缓存
  const products = await fetch(
    `/api/products?category=${category}`,
    { next: { tags: [`products-${category}`] } }
  ).then(res => res.json());

  return (
    <div>
      {products.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

### 9.5 静态生成

```tsx
// app/products/page.tsx - 静态生成
export const dynamic = 'force-static'; // 强制静态生成

export default async function ProductsPage() {
  const products = await fetch('/api/products').then(res => res.json());

  return (
    <div>
      {products.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}

// 生成静态参数
export async function generateStaticParams() {
  const products = await fetch('/api/products').then(res => res.json());

  return products.map(product => ({
    id: product.id.toString(),
  }));
}
```

---

## 十、错误处理（Error Handling）

### 10.1 错误边界

```tsx
// app/products/error.tsx - 错误边界
'use client';

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-4">
      <h2>出错了！</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>重试</button>
    </div>
  );
}
```

### 10.2 error.tsx

```tsx
// app/products/error.tsx - 错误处理页面
'use client';

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-4">
      <h2>出错了！</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>重试</button>
    </div>
  );
}
```

### 10.3 global-error.tsx

```tsx
// app/global-error.tsx - 全局错误处理
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="p-4">
          <h1>出错了！</h1>
          <p>{error.message}</p>
          <button onClick={() => reset()}>重试</button>
        </div>
      </body>
    </html>
  );
}
```

### 10.4 错误处理最佳实践

```tsx
// ==================== 错误处理最佳实践 ====================

// 1. 使用 try-catch
export default async function Page() {
  try {
    const data = await fetch('/api/data').then(res => res.json());
    return <div>{data}</div>;
  } catch (error) {
    console.error(error);
    throw error; // 让 error.tsx 处理
  }
}

// 2. 使用 notFound()
import { notFound } from 'next/navigation';

export default async function Page() {
  const data = await fetch('/api/data').then(res => res.json());

  if (!data) {
    notFound(); // 显示 404 页面
  }

  return <div>{data}</div>;
}

// 3. 使用 error()
import { error } from 'next/navigation';

export default async function Page() {
  try {
    const data = await fetch('/api/data').then(res => res.json());
    return <div>{data}</div>;
  } catch (error) {
    error(); // 显示 error.tsx
  }
}

// 4. 自定义错误页面
// app/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-4">
      <h2>出错了！</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>重试</button>
    </div>
  );
}

// 5. 全局错误处理
// app/global-error.tsx
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="p-4">
          <h1>出错了！</h1>
          <p>{error.message}</p>
          <button onClick={() => reset()}>重试</button>
        </div>
      </body>
    </html>
  );
}
```

---

## 十一、CSS（样式）

### 11.1 全局样式

```css
/* app/globals.css - 全局样式 */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-rgb: 255, 255, 255;
}

body {
  color: rgb(var(--foreground-rgb));
  background: rgb(var(--background-rgb));
}

/* 自定义样式 */
.btn {
  @apply px-4 py-2 bg-blue-500 text-white rounded;
}

.btn:hover {
  @apply bg-blue-600;
}
```

### 11.2 CSS Modules

```tsx
// components/Button.module.css - CSS Modules
.button {
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: white;
  border-radius: 0.25rem;
}

.button:hover {
  background-color: #2563eb;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

// components/Button.tsx
import styles from './Button.module.css';

export function Button({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      className={styles.button}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

### 11.3 Tailwind CSS

```tsx
// components/Card.tsx - Tailwind CSS
export function Card({ title, description }: { title: string; description: string }) {
  return (
    <div className="max-w-sm rounded overflow-hidden shadow-lg">
      <div className="px-6 py-4">
        <div className="font-bold text-xl mb-2">{title}</div>
        <p className="text-gray-700 text-base">{description}</p>
      </div>
      <div className="px-6 pt-4 pb-2">
        <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2">
          #tag
        </span>
      </div>
    </div>
  );
}

// components/Button.tsx - Tailwind CSS 按钮
export function Button({ children, variant = 'primary', size = 'md', disabled }: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}) {
  const baseStyles = 'rounded font-medium transition-colors duration-200';
  
  const variants = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-500 text-white hover:bg-gray-600',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };
  
  const sizes = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

### 11.4 CSS-in-JS

```tsx
// components/StyledComponent.tsx - CSS-in-JS
import styled from '@emotion/styled';

const Button = styled.button`
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: white;
  border-radius: 0.25rem;
  transition: background-color 0.2s;

  &:hover {
    background-color: #2563eb;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export function StyledComponent() {
  return <Button>按钮</Button>;
}

// components/StyledComponent.tsx - Styled Components
import styled from 'styled-components';

const Button = styled.button`
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: white;
  border-radius: 0.25rem;
  transition: background-color 0.2s;

  &:hover {
    background-color: #2563eb;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export function StyledComponent() {
  return <Button>按钮</Button>;
}
```

### 11.5 Sass

```scss
// styles/variables.scss - Sass 变量
$primary-color: #3b82f6;
$secondary-color: #6b7280;
$success-color: #10b981;
$danger-color: #ef4444;

$font-size-base: 1rem;
$font-size-lg: 1.25rem;
$font-size-sm: 0.875rem;

$border-radius: 0.25rem;
$border-radius-lg: 0.5rem;

// styles/components.scss - Sass 组件
.button {
  padding: 0.5rem 1rem;
  border-radius: $border-radius;
  font-size: $font-size-base;
  transition: background-color 0.2s;

  &.primary {
    background-color: $primary-color;
    color: white;

    &:hover {
      background-color: darken($primary-color, 10%);
    }
  }

  &.secondary {
    background-color: $secondary-color;
    color: white;

    &:hover {
      background-color: darken($secondary-color, 10%);
    }
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// components/Button.tsx
import '@/styles/components.scss';

export function Button({ children, variant = 'primary', disabled }: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}) {
  return (
    <button
      className={`button ${variant} ${disabled ? 'disabled' : ''}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

---

## 十二、Image Optimization（图片优化）

### 12.1 next/image 组件

```tsx
// components/ImageComponent.tsx - next/image 组件
import Image from 'next/image';

export function ImageComponent() {
  return (
    <div>
      {/* 基础用法 */}
      <Image
        src="/images/logo.png"
        alt="Logo"
        width={200}
        height={100}
      />

      {/* 响应式图片 */}
      <Image
        src="/images/banner.jpg"
        alt="Banner"
        width={1200}
        height={600}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />

      {/* 优先加载 */}
      <Image
        src="/images/hero.jpg"
        alt="Hero"
        width={1200}
        height={600}
        priority
      />

      {/* 占位符 */}
      <Image
        src="/images/product.jpg"
        alt="Product"
        width={300}
        height={200}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQE..."
      />

      {/* 懒加载 */}
      <Image
        src="/images/lazy.jpg"
        alt="Lazy"
        width={300}
        height={200}
        loading="lazy"
      />

      {/* 填充容器 */}
      <div className="relative w-full h-64">
        <Image
          src="/images/fill.jpg"
          alt="Fill"
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
    </div>
  );
}
```

### 12.2 图片优化原理

```tsx
// ==================== 图片优化原理 ====================

// 1. 自动优化
// - 根据设备自动调整图片大小
// - 使用 WebP 格式（如果支持）
// - 压缩图片

// 2. 响应式图片
// - 使用 sizes 属性指定不同屏幕尺寸下的图片宽度
// - 浏览器根据屏幕宽度选择合适的图片

// 3. 懒加载
// - 只有当图片进入视口时才加载
// - 使用 loading="lazy" 属性

// 4. 占位符
// - 使用 placeholder="blur" 显示模糊占位符
// - 减少布局偏移

// 5. 预加载
// - 使用 priority 属性预加载关键图片
// - 提高首屏加载速度
```

### 12.3 懒加载

```tsx
// components/LazyImage.tsx - 懒加载图片
import Image from 'next/image';

export function LazyImage() {
  return (
    <div>
      {/* 默认懒加载 */}
      <Image
        src="/images/lazy1.jpg"
        alt="Lazy 1"
        width={300}
        height={200}
      />

      {/* 显式懒加载 */}
      <Image
        src="/images/lazy2.jpg"
        alt="Lazy 2"
        width={300}
        height={200}
        loading="lazy"
      />

      {/* 优先加载 */}
      <Image
        src="/images/hero.jpg"
        alt="Hero"
        width={1200}
        height={600}
        priority
      />
    </div>
  );
}
```

### 12.4 响应式图片

```tsx
// components/ResponsiveImage.tsx - 响应式图片
import Image from 'next/image';

export function ResponsiveImage() {
  return (
    <div>
      {/* 响应式图片 */}
      <Image
        src="/images/banner.jpg"
        alt="Banner"
        width={1200}
        height={600}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />

      {/* 响应式图片组 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Image
          src="/images/image1.jpg"
          alt="Image 1"
          width={400}
          height={300}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <Image
          src="/images/image2.jpg"
          alt="Image 2"
          width={400}
          height={300}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <Image
          src="/images/image3.jpg"
          alt="Image 3"
          width={400}
          height={300}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
    </div>
  );
}
```

---

## 十三、Font Optimization（字体优化）

### 13.1 next/font

```tsx
// app/layout.tsx - next/font
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${playfair.variable}`}>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
```

### 13.2 Google Fonts

```tsx
// app/layout.tsx - Google Fonts
import { Inter, Roboto, Open_Sans } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-roboto',
});

const openSans = Open_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-open-sans',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${roboto.variable} ${openSans.variable}`}>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
```

### 13.3 自定义字体

```tsx
// app/layout.tsx - 自定义字体
import localFont from 'next/font/local';

const myFont = localFont({
  src: './MyFont.woff2',
  display: 'swap',
  variable: '--font-my-font',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={myFont.variable}>
      <body className={myFont.className}>
        {children}
      </body>
    </html>
  );
}
```

### 13.4 字体预加载

```tsx
// app/layout.tsx - 字体预加载
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true, // 预加载字体
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
```

---

## 十四、Metadata and OG images（元数据和 OG 图片）

### 14.1 metadata 配置

```tsx
// app/layout.tsx - 元数据配置
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: '我的应用',
    template: '%s | 我的应用', // 子页面标题模板
  },
  description: '应用描述',
  keywords: ['关键词1', '关键词2'],
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
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
```

### 14.2 Open Graph

```tsx
// app/products/[id]/page.tsx - Open Graph
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      type: 'product',
      url: `https://example.com/products/${id}`,
      images: [
        {
          url: product.image,
          width: 800,
          height: 600,
          alt: product.name,
        },
      ],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);

  return <div>{product.name}</div>;
}
```

### 14.3 Twitter Cards

```tsx
// app/products/[id]/page.tsx - Twitter Cards
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  return {
    title: product.name,
    description: product.description,
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description,
      images: [product.image],
      creator: '@myapp',
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);

  return <div>{product.name}</div>;
}
```

### 14.4 动态元数据

```tsx
// app/products/[id]/page.tsx - 动态元数据
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: '产品未找到',
      description: '您请求的产品不存在',
    };
  }

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [product.image],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description,
      images: [product.image],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    // notFound(); // 显示 404 页面
  }

  return <div>{product.name}</div>;
}
```

---

## 十五、Route Handlers（路由处理器）

### 15.1 API 路由

```tsx
// app/api/users/route.ts - API 路由
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

### 15.2 动态路由处理器

```tsx
// app/api/users/[id]/route.ts - 动态路由处理器
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

### 15.3 Edge Runtime

```tsx
// app/api/edge/route.ts - Edge Runtime
export const runtime = 'edge'; // 使用 Edge Runtime

export async function GET(request: Request) {
  // Edge Runtime 限制
  // - 不支持 Node.js API
  // - 只支持 Web API
  // - 只能使用 fetch、setTimeout 等

  const url = new URL(request.url);
  const name = url.searchParams.get('name') || '世界';

  return new Response(`Hello, ${name}!`, {
    headers: { 'Content-Type': 'text/plain' },
  });
}

// app/api/cors/route.ts - CORS 处理
export async function OPTIONS(request: Request) {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(request: Request) {
  return new Response(JSON.stringify({ message: 'Hello!' }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
```

---

## 十六、Proxy（代理）

### 16.1 代理配置

```javascript
// next.config.js - 代理配置
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/:path*',
      },
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:3002/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
```

### 16.2 API 代理

```javascript
// next.config.js - API 代理
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
  
  // 图片代理
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.example.com',
      },
    ],
  },
};

module.exports = nextConfig;
```

---

## 十七、部署（Deployment）

### 17.1 Vercel 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel

# 生产环境部署
vercel --prod

# 预览部署
vercel --preview

# 设置环境变量
vercel env add MY_ENV_VAR

# 部署并设置环境变量
vercel --prod --env MY_ENV_VAR=value
```

### 17.2 自托管部署

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

### 17.3 静态导出

```javascript
// next.config.js - 静态导出
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  
  // 静态导出配置
  exportTrailingSlash: true,
  exportPathMap: async (defaultPathMap) => {
    return {
      '/': { page: '/' },
      '/about': { page: '/about' },
      '/contact': { page: '/contact' },
    };
  },
};

module.exports = nextConfig;
```

```bash
# 构建静态导出
npm run build

# 导出静态文件
npm run export

# 部署静态文件
# 将 out 目录部署到静态托管服务
```

### 17.4 Docker 部署

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

## 十八、升级（Upgrading）

### 18.1 版本升级

```bash
# 升级 Next.js
npm install next@latest react@latest react-dom@latest

# 升级 TypeScript
npm install typescript@latest @types/react@latest @types/node@latest

# 升级 ESLint
npm install eslint-config-next@latest
```

### 18.2 迁移指南

```bash
# 从 Pages Router 迁移到 App Router

# 1. 创建 app 目录
mkdir app

# 2. 迁移页面
# pages/index.tsx -> app/page.tsx
# pages/about.tsx -> app/about/page.tsx

# 3. 迁移布局
# _app.tsx -> app/layout.tsx
# _document.tsx -> app/layout.tsx

# 4. 迁移 API 路由
# pages/api/users.ts -> app/api/users/route.ts

# 5. 迁移中间件
# middleware.ts -> middleware.ts (保持不变)
```

---

## 十九、指南（Guides）

### 19.1 Analytics 分析

```tsx
// app/layout.tsx - Google Analytics
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        {/* Google Analytics */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-XXXXXXXXXX');
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 19.2 身份验证

```tsx
// app/actions/auth.ts - 身份验证
'use server';

import { sign, verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const JWT_SECRET = process.env.JWT_SECRET!;

// 生成 JWT
async function generateToken(userId: string) {
  return sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

// 验证 JWT
async function verifyToken(token: string) {
  return verify(token, JWT_SECRET);
}

// 登录
export async function login(email: string, password: string) {
  // 验证用户
  const user = await db.users.findUnique({ where: { email } });

  if (!user) {
    return { error: '用户不存在' };
  }

  // 验证密码
  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    return { error: '密码错误' };
  }

  // 生成 token
  const token = await generateToken(user.id);

  // 设置 cookie
  cookies().set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60, // 7 天
    path: '/',
  });

  redirect('/dashboard');
}

// 登出
export async function logout() {
  cookies().delete('token');
  redirect('/login');
}
```

### 19.3 Backend for Frontend

```tsx
// app/api/bff/route.ts - BFF 模式
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  // 从后端服务获取数据
  const userResponse = await fetch(`http://localhost:3001/users/${userId}`);
  const user = await userResponse.json();

  const ordersResponse = await fetch(`http://localhost:3001/orders?userId=${userId}`);
  const orders = await ordersResponse.json();

  return NextResponse.json({ user, orders });
}

export async function POST(request: Request) {
  const body = await request.json();

  // 提交到后端服务
  const response = await fetch('http://localhost:3001/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const order = await response.json();

  return NextResponse.json(order);
}
```

### 19.4 缓存策略

```tsx
// ==================== 缓存策略 ====================

// 1. 静态数据：永久缓存
export const dynamic = 'force-static';

// 2. 动态数据：按需重新验证
export const revalidate = 3600;

// 3. 完全动态：每次请求都重新渲染
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
```

### 19.5 CI Build Caching

```yaml
# .github/workflows/deploy.yml - CI 缓存
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: ~/.npm
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-node-

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy
        run: vercel --prod
```

### 19.6 内容安全策略

```javascript
// next.config.js - 内容安全策略
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval';
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: https:;
              font-src 'self' data:;
              connect-src 'self' https://api.example.com;
              frame-src 'self';
              base-uri 'self';
              form-action 'self';
              frame-ancestors 'self';
            `.replace(/\n/g, ' ').replace(/  +/g, ' ').trim(),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### 19.7 自定义服务器

```javascript
// server.js - 自定义服务器
const { createServer } = require('http');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    // 自定义路由
    if (req.url === '/custom') {
      res.writeHead(200);
      res.end('Custom Route');
      return;
    }

    // Next.js 处理
    handle(req, res);
  }).listen(3000, () => {
    console.log('> Ready on http://localhost:3000');
  });
});
```

### 19.8 数据安全

```tsx
// app/actions/data.ts - 数据安全
'use server';

import { z } from 'zod';

// 验证 Schema
const schema = z.object({
  name: z.string().min(2, '姓名至少2个字符'),
  email: z.string().email('请输入有效的邮箱'),
  message: z.string().min(10, '消息至少10个字符'),
});

// 处理表单
export async function handleSubmit(formData: FormData) {
  // 验证输入
  const result = schema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
  });

  if (!result.success) {
    return { error: '验证失败', details: result.error.flatten() };
  }

  // 清理输入
  const { name, email, message } = result.data;

  // 存储数据
  await db.messages.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
    },
  });

  return { success: true };
}
```

### 19.9 调试

```tsx
// app/debug/page.tsx - 调试页面
export default function DebugPage() {
  return (
    <div>
      <h1>调试页面</h1>
      <pre>{JSON.stringify(process.env, null, 2)}</pre>
    </div>
  );
}

// next.config.js - 调试配置
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用调试模式
  reactStrictMode: true,
  
  // 启用 ESLint
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // 启用 TypeScript
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
```

### 19.10 Draft Mode

```tsx
// app/api/draft/route.ts - Draft Mode
import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const slug = searchParams.get('slug');

  // 验证密钥
  if (secret !== process.env.DRAFT_SECRET) {
    return new Response('Invalid secret', { status: 401 });
  }

  // 启用 Draft Mode
  draftMode().enable();

  // 重定向到草稿页面
  redirect(`/posts/${slug}?draft=true`);
}

// app/posts/[slug]/page.tsx - 草稿页面
import { draftMode } from 'next/headers';

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { isEnabled } = draftMode();

  // 获取文章
  const post = await getPost(slug);

  if (!post && !isEnabled) {
    notFound();
  }

  return (
    <div>
      <h1>{post?.title}</h1>
      <p>{post?.content}</p>
      {isEnabled && <p>草稿模式</p>}
    </div>
  );
}
```

### 19.11 环境变量

```bash
# .env.local - 环境变量
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_APP_NAME="我的应用"
NEXT_PUBLIC_APP_URL=https://example.com

# 服务器端环境变量（不暴露到客户端）
JWT_SECRET=your-secret-key
DATABASE_URL=your-database-url
```

```tsx
// app/page.tsx - 使用环境变量
export default function HomePage() {
  return (
    <div>
      <h1>{process.env.NEXT_PUBLIC_APP_NAME}</h1>
      <p>API URL: {process.env.NEXT_PUBLIC_API_URL}</p>
    </div>
  );
}
```

### 19.12 Forms 表单

```tsx
// app/actions/form.ts - 表单处理
'use server';

import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2, '姓名至少2个字符'),
  email: z.string().email('请输入有效的邮箱'),
  message: z.string().min(10, '消息至少10个字符'),
});

export async function handleSubmit(formData: FormData) {
  const result = schema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
  });

  if (!result.success) {
    return { error: '验证失败', details: result.error.flatten() };
  }

  // 处理表单数据
  await db.messages.create({
    data: result.data,
  });

  return { success: true };
}

// components/Form.tsx - 表单组件
'use client';

import { useActionState } from 'react';
import { handleSubmit } from '@/app/actions/form';

export function Form() {
  const [state, formAction, isPending] = useActionState(handleSubmit, null);

  return (
    <form action={formAction}>
      <div>
        <label htmlFor="name">姓名</label>
        <input id="name" name="name" required />
        {state?.details?.fieldErrors?.name?.map((error: string) => (
          <p key={error} className="error">{error}</p>
        ))}
      </div>

      <div>
        <label htmlFor="email">邮箱</label>
        <input id="email" name="email" type="email" required />
        {state?.details?.fieldErrors?.email?.map((error: string) => (
          <p key={error} className="error">{error}</p>
        ))}
      </div>

      <div>
        <label htmlFor="message">消息</label>
        <textarea id="message" name="message" required />
        {state?.details?.fieldErrors?.message?.map((error: string) => (
          <p key={error} className="error">{error}</p>
        ))}
      </div>

      <button type="submit" disabled={isPending}>
        {isPending ? '提交中...' : '提交'}
      </button>

      {state?.error && <p className="error">{state.error}</p>}
      {state?.success && <p className="success">提交成功！</p>}
    </form>
  );
}
```

### 19.13 ISR（增量静态再生）

```tsx
// app/products/page.tsx - ISR
export const revalidate = 3600; // 1小时后重新验证

export default async function ProductsPage() {
  const products = await fetch('/api/products').then(res => res.json());

  return (
    <div>
      {products.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}

// app/actions/revalidate.ts - 手动重新验证
'use server';

import { revalidatePath } from 'next/cache';

export async function refreshProducts() {
  revalidatePath('/products');
}
```

### 19.14 国际化

```tsx
// app/[lang]/layout.tsx - 国际化布局
export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  return (
    <html lang={params.lang}>
      <body>{children}</body>
    </html>
  );
}

// app/[lang]/page.tsx - 国际化页面
export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  return (
    <div>
      <h1>欢迎来到 {lang === 'zh' ? '中文' : 'English'} 页面</h1>
    </div>
  );
}
```

### 19.15 测试

```tsx
// tests/ProductList.test.tsx - 测试
import { render, screen } from '@testing-library/react';
import ProductList from '@/components/ProductList';

test('渲染产品列表', () => {
  render(<ProductList products={[{ id: 1, name: '产品1' }]} />);
  
  expect(screen.getByText('产品1')).toBeInTheDocument();
});

// tests/ServerAction.test.ts
import { createUser } from '@/app/actions/user';

test('创建用户', async () => {
  const formData = new FormData();
  formData.set('name', '测试用户');
  formData.set('email', 'test@example.com');

  const result = await createUser(formData);

  expect(result.success).toBe(true);
});
```

### 19.16 第三方库

```tsx
// components/Chart.tsx - 第三方库
'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export function Chart() {
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '图表标题',
      },
    },
  };

  const data = {
    labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
    datasets: [
      {
        label: '数据集 1',
        data: [10, 20, 30, 40, 50, 60],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
    ],
  };

  return <Line options={options} data={data} />;
}
```

---

## 二十、实战项目

### 20.1 完整的电商应用

```tsx
// ==================== 项目结构 ====================
// app/
// ├── layout.tsx
// ├── page.tsx
// ├── products/
// │   ├── page.tsx
// │   └── [id]/
// │       ├── page.tsx
// │       └── loading.tsx
// ├── cart/
// │   └── page.tsx
// ├── api/
// │   ├── products/
// │   │   └── route.ts
// │   └── cart/
// │       └── route.ts
// └── actions/
//     ├── cart.ts
//     └── order.ts

// ==================== 产品列表 ====================
// app/products/page.tsx
export default async function ProductsPage() {
  const products = await fetch('/api/products').then(res => res.json());

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">产品列表</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product.id} className="border rounded-lg p-4">
            <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
            <h2 className="text-xl font-bold mt-4">{product.name}</h2>
            <p className="text-gray-600 mt-2">{product.description}</p>
            <p className="text-lg font-bold mt-2">¥{product.price}</p>
            <Link href={`/products/${product.id}`} className="mt-4 inline-block">
              查看详情
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== 产品详情 ====================
// app/products/[id]/page.tsx
import { Suspense } from 'react';
import ProductInfo from '@/components/ProductInfo';
import ProductGallery from '@/components/ProductGallery';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await fetch(`/api/products/${id}`).then(res => res.json());

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ProductGallery images={product.images} />
        <Suspense fallback={<div>加载中...</div>}>
          <ProductInfo product={product} />
        </Suspense>
      </div>
    </div>
  );
}

// ==================== 购物车 ====================
// app/actions/cart.ts
'use server';

import { cookies } from 'next/headers';

export async function addToCart(productId: string, quantity: number) {
  const cart = JSON.parse(cookies().get('cart')?.value || '[]');
  
  const existingItem = cart.find((item: any) => item.productId === productId);
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({ productId, quantity });
  }
  
  cookies().set('cart', JSON.stringify(cart));
}

export async function removeFromCart(productId: string) {
  const cart = JSON.parse(cookies().get('cart')?.value || '[]');
  
  const newCart = cart.filter((item: any) => item.productId !== productId);
  
  cookies().set('cart', JSON.stringify(newCart));
}

// ==================== 订单 ====================
// app/actions/order.ts
'use server';

import { cookies } from 'next/headers';

export async function createOrder() {
  const cart = JSON.parse(cookies().get('cart')?.value || '[]');
  
  // 创建订单
  const order = await db.orders.create({
    data: {
      items: cart,
      total: calculateTotal(cart),
    },
  });
  
  // 清空购物车
  cookies().set('cart', '[]');
  
  return order;
}
```

---

## 二十一、最佳实践

### 21.1 项目结构建议

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

### 21.2 性能检查清单

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

### 21.3 SEO 优化

```tsx
// app/layout.tsx - SEO 优化
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

// app/sitemap.ts - Sitemap
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

// app/robots.ts - Robots
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

---

## 二十二、面试高频问题

### 22.1 基础概念题

#### Q1：Next.js 中 App Router 和 Pages Router 有什么区别？

**答案要点：**

| 特性 | App Router | Pages Router |
|------|------------|--------------|
| **目录** | `app/` | `pages/` |
| **布局** | 支持嵌套布局 | 需要自定义 `_app.js` |
| **服务端组件** | 默认支持 | 需要配置 |
| **数据获取** | `async/await` | `getServerSideProps` |
| **加载状态** | 内置 `loading.tsx` | 需要手动处理 |
| **错误处理** | 内置 `error.tsx` | 需要自定义 |
| **路由组** | 支持 | 不支持 |

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

### 22.2 进阶问题

#### Q4：如何优化 Next.js 应用的首屏加载速度？

**答案要点：**

1. **使用服务端组件**
   - 减少客户端 JavaScript
   - 数据在服务端获取

2. **流式渲染**
   - 使用 Suspense 分层加载
   - 关键内容优先显示

3. **图片优化**
   - 使用 next/image
   - 设置合适的 sizes 属性
   - 使用 placeholder="blur"

4. **字体优化**
   - 使用 next/font
   - 设置 display: 'swap'

5. **代码分割**
   - 使用 dynamic 导入
   - 按需加载非关键组件

6. **缓存策略**
   - 合理设置 revalidate
   - 使用 ISR 减少服务器负载

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

### 22.3 实战场景题

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
```

---

## 二十三、与其他框架对比

### 23.1 Next.js vs Remix

| 特性 | Next.js | Remix |
|------|---------|-------|
| **路由** | 文件系统路由 | 文件系统路由 |
| **数据加载** | `async/await` | Loader 函数 |
| **数据提交** | Server Actions | Action 函数 |
| **错误处理** | `error.tsx` | ErrorBoundary |
| **缓存** | 内置多种策略 | 需要手动配置 |
| **部署** | Vercel 优化 | 多平台支持 |
| **生态** | 更丰富 | 发展中 |

### 23.2 Next.js vs Nuxt

| 特性 | Next.js | Nuxt |
|------|---------|------|
| **框架基础** | React | Vue |
| **服务端组件** | 原生支持 | 需要配置 |
| **状态管理** | Zustand/Redux | Pinia |
| **类型支持** | TypeScript | TypeScript |
| **学习曲线** | 中等 | 较低 |
| **生态** | 更丰富 | 较丰富 |

---

## 二十四、总结

### 24.1 核心概念

- **App Router**：基于文件系统的路由，支持布局、加载状态
- **Server Components**：默认服务端组件，零客户端 JavaScript
- **Server Actions**：服务端操作，无需 API 路由
- **Turbopack**：Rust 编写的新构建工具，极速编译
- **流式渲染**：渐进式页面加载
- **图片优化**：自动图片优化和懒加载
- **字体优化**：自动字体优化和预加载
- **SEO 优化**：内置元数据管理

### 24.2 最佳实践

- 使用 Server Components 获取数据
- 合理使用 Suspense 进行流式渲染
- 图片使用 next/image 组件
- 字体使用 next/font 优化
- 设置合理的缓存策略
- 使用动态导入减少初始包大小
- 配置适当的元数据
- 使用中间件进行认证
- 实现错误边界处理
- 配置 sitemap 和 robots.txt

### 24.3 学习路径

1. **入门**：了解 Next.js 基础概念和项目结构
2. **布局和页面**：学习 App Router 的布局和页面系统
3. **数据获取**：掌握 Server Components 和数据获取
4. **导航**：学习链接和导航
5. **Server 和 Client 组件**：理解组件类型和通信
6. **缓存**：掌握缓存和重新验证
7. **更新数据**：学习 Server Actions 和表单处理
8. **错误处理**：实现错误边界和错误处理
9. **样式**：掌握 CSS、CSS Modules、Tailwind CSS
10. **优化**：学习图片、字体优化
11. **元数据**：配置 SEO 元数据
12. **API 路由**：创建 API 路由
13. **部署**：学习部署和优化

---

*本文档基于 MDN 和 Next.js 官方文档整理，最后更新于 2026年3月*
