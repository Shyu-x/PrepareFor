# SSR服务端渲染完全指南

## 目录

1. [渲染模式全解](#1-渲染模式全解)
2. [Next.js SSR深入解析](#2-nextjs-ssr深入解析)
3. [数据获取策略](#3-数据获取策略)
4. [SEO优化实战](#4-seo优化实战)
5. [性能优化指南](#5-性能优化指南)
6. [实战：从CSR迁移到SSR](#6-实战从csr迁移到ssr)
7. [实战：博客系统实现](#7-实战博客系统实现)
8. [面试高频问题](#8-面试高频问题)

---

## 1. 渲染模式全解

### 1.1 客户端渲染CSR vs 服务端渲染SSR

客户端渲染（Client-Side Rendering，CSR）和服务端渲染（Server-Side Rendering，SSR）是现代Web应用两种主要的渲染模式，它们在首屏加载时间、SEO效果、服务器负载和用户体验方面存在显著差异。

**客户端渲染CSR的工作原理：**

```typescript
// CSR渲染流程
// 用户请求 -> 服务器返回HTML骨架 + JS链接 -> 浏览器下载JS -> 执行React -> 渲染页面

// 1. 首次请求：服务器返回的HTML只包含根元素和JS链接
// <!DOCTYPE html>
// <html>
//   <head><title>CSR App</title></head>
//   <body>
//     <div id="root"></div>  <!-- 空白容器 -->
//     <script src="/bundle.js"></script>  <!-- React代码 -->
//   </body>
// </html>

// 2. 浏览器下载并执行JavaScript
// 3. React在客户端运行，构建虚拟DOM
// 4. 渲染完整的HTML内容到#root容器
```

**服务端渲染SSR的工作原理：**

```typescript
// SSR渲染流程
// 用户请求 -> 服务器执行React组件 -> 生成HTML字符串 -> 返回完整HTML -> 浏览器显示内容 -> 水合

// 1. 服务器执行React组件，生成完整HTML
// const html = ReactDOMServer.renderToString(<App />);

// 2. 返回的HTML已经包含完整内容
// <!DOCTYPE html>
// <html>
//   <head><title>SSR App</title></head>
//   <body>
//     <div id="root"><h1>博客文章</h1><article>...</article></div>  <!-- 完整内容 -->
//     <script src="/bundle.js"></script>  <!-- 用于水合的JS -->
//   </body>
// </html>

// 3. 浏览器直接显示HTML内容，无需等待JS执行
// 4. React进行水合（Hydration），绑定事件处理器
```

**FastDocument项目中的CSR示例（登录页面）：**

```typescript
// D:\Develeping\FastDocument\frontend\src\app\login\page.tsx
// 这是一个客户端组件，使用"use client"指令
"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input, Button, App } from "antd";
import { useTheme } from "@/components/ThemeProvider";
import { appEnv } from "@/lib/env";
import { useDemoStore } from "@/store/demoStore";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Lock, User, Key, Mail, ArrowRight, Sparkles } from "lucide-react";

/**
 * 登录页面 - 清新玻璃态设计
 * 采用CSR渲染，用户交互较多
 */
export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme.isDark;
  const { startDemoMode } = useDemoStore();
  const { message } = App.useApp();

  const API_URL = appEnv.backendUrl;

  // 处理游客体验 - 异步登录逻辑
  const handleDemoLogin = useCallback(async () => {
    setDemoLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/demo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (data.success) {
        startDemoMode();
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("username", "游客");
        localStorage.setItem("user", JSON.stringify({ ...data.user, isDemo: true }));
        void message.success("欢迎进入体验模式");
        router.push("/");
      } else {
        void message.error(data.message || "体验模式启动失败");
      }
    } catch {
      void message.error("体验模式启动失败，请检查网络");
    } finally {
      setDemoLoading(false);
    }
  }, [API_URL, router, startDemoMode, message]);

  // 处理登录逻辑
  const handleLogin = useCallback(async () => {
    if (!username || !password) {
      setError("请输入用户名和密码");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("username", data.user.username);
        localStorage.setItem("user", JSON.stringify(data.user));
        void message.success("登录成功");
        router.push("/");
      } else {
        setError(data.message || "登录失败");
      }
    } catch {
      setError("登录失败，请检查用户名和密码");
    } finally {
      setLoading(false);
    }
  }, [username, password, API_URL, router, message]);

  // 渲染表单UI
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* 装饰性渐变光晕 */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[150px] opacity-40"
        style={{ background: "radial-gradient(circle, #5EEAD4 0%, transparent 70%)" }} />
      {/* 主容器 */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* 表单内容 */}
        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
          <Input size="large" prefix={<User size={17} className="text-gray-400" />}
            value={username} onChange={(e) => setUsername(e.target.value)} placeholder="输入用户名" />
          <Input.Password size="large" prefix={<Lock size={17} className="text-gray-400" />}
            value={password} onChange={(e) => setPassword(e.target.value)} placeholder="输入密码" />
          <Button type="primary" block size="large" loading={loading} onClick={handleLogin}>
            登 录
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
```

**FastDocument项目中的SSR示例（布局文件）：**

```typescript
// D:\Develeping\FastDocument\frontend\src\app\layout.tsx
// 这是一个服务端组件（没有"use client"），默认在服务端渲染

import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { cookies } from "next/headers";  // 服务端API
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AntdThemeProvider } from "@/components/AntdThemeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  DEFAULT_PRESET_ID,
  DEFAULT_PRIMARY,
  DEFAULT_THEME_MODE,
  THEME_COOKIE_MAX_AGE,
  THEME_COOKIE_NAME,
  THEME_STORAGE_KEY,
  getPrimaryColorFromSnapshot,
  parseThemeSnapshot,
  resolveThemeSnapshot,
} from "@/lib/theme";
import "./globals.css";

// 导出metadata用于SEO优化
export const metadata: Metadata = {
  title: "FastDocument - 现代化文档协作平台",
  description: "支持多人实时编辑、知识库、项目管理、视频会议的现代化文档协作平台。",
  metadataBase: new URL(process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://localhost:13000'),
  openGraph: {
    title: "FastDocument - 现代化文档协作平台",
    description: "支持多人实时编辑、知识库、项目管理、视频会议的现代化文档协作平台",
    url: "/",
    siteName: "FastDocument",
    images: [{
      url: "/og-image.png",
      width: 1200,
      height: 630,
      alt: "FastDocument - 现代化文档协作平台",
    }],
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FastDocument - 现代化文档协作平台",
    description: "支持多人实时编辑、知识库、项目管理、视频会议的现代化文档协作平台",
    images: ["/og-image.png"],
  },
  keywords: ["文档协作", "实时编辑", "知识库", "项目管理", "视频会议", "多人协作", "在线文档"],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// 主题初始化脚本 - 内联脚本避免闪烁
const themeBootstrapScript = `
(() => {
  const storageKey = '${THEME_STORAGE_KEY}';
  const cookieName = '${THEME_COOKIE_NAME}';
  const cookieMaxAge = ${THEME_COOKIE_MAX_AGE};
  const defaultPrimary = '${DEFAULT_PRIMARY}';
  // 预设颜色配置
  const presets = {
    ${DEFAULT_PRESET_ID}: '${DEFAULT_PRIMARY}',
    blue: '#3B82F6',
    indigo: '#6366F1',
    purple: '#8B5CF6',
    pink: '#EC4899',
    red: '#EF4444',
    orange: '#F97316',
    amber: '#F59E0B',
    emerald: '#10B981',
    cyan: '#06B6D4'
  };
  // 从localStorage或Cookie读取主题配置
  let mode = '${DEFAULT_THEME_MODE}';
  let presetId = '${DEFAULT_PRESET_ID}';
  let customPrimary = defaultPrimary;
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      mode = parsed?.state?.mode === 'dark' ? 'dark' : '${DEFAULT_THEME_MODE}';
      presetId = parsed?.state?.presetId || presetId;
      customPrimary = parsed?.state?.customPrimary || customPrimary;
    } else {
      // 尝试从Cookie读取
      const cookieMatch = document.cookie.match(new RegExp('(?:^|; )' + cookieName + '=([^;]*)'));
      if (cookieMatch?.[1]) {
        const parsed = JSON.parse(decodeURIComponent(cookieMatch[1]));
        mode = parsed?.mode === 'dark' ? 'dark' : '${DEFAULT_THEME_MODE}';
        presetId = parsed?.presetId || presetId;
        customPrimary = parsed?.customPrimary || customPrimary;
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        mode = 'dark';
      }
    }
  } catch {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      mode = 'dark';
    }
  }
  // 应用主题到DOM
  const primary = presetId === 'custom' ? customPrimary : (presets[presetId] || customPrimary || defaultPrimary);
  const root = document.documentElement;
  root.classList.toggle('dark', mode === 'dark');
  root.style.setProperty('--theme-primary', primary);
  root.style.colorScheme = mode === 'dark' ? 'dark' : 'light';
  // 同步Cookie
  document.cookie = cookieName + '=' + encodeURIComponent(JSON.stringify({ mode, presetId, customPrimary }))
    + '; path=/; max-age=' + cookieMaxAge + '; SameSite=Lax';
  localStorage.setItem(storageKey, JSON.stringify({
    state: { mode, presetId, customPrimary },
    version: 0
  }));
})();
`;

// 服务端组件默认在服务端执行
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 服务端：可以直接访问cookies
  const cookieStore = await cookies();
  const initialTheme = resolveThemeSnapshot(
    parseThemeSnapshot(cookieStore.get(THEME_COOKIE_NAME)?.value)
  );
  const initialPrimaryColor = getPrimaryColorFromSnapshot(initialTheme);

  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={initialTheme.mode === "dark" ? "dark" : undefined}
      style={{
        colorScheme: initialTheme.mode === "dark" ? "dark" : "light",
        "--theme-primary": initialPrimaryColor,
      } as CSSProperties}
    >
      <head>
        {/* 内联脚本防止主题闪烁 */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body suppressHydrationWarning className="bg-primary text-primary">
        <AntdRegistry>
          <ThemeProvider initialTheme={initialTheme}>
            <ErrorBoundary>
              <AntdThemeProvider>{children}</AntdThemeProvider>
            </ErrorBoundary>
          </ThemeProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
```

**CSR与SSR对比表：**

| 特性 | CSR | SSR |
|------|-----|-----|
| 首屏时间 | 慢（需下载JS后渲染） | 快（HTML直接显示） |
| TTFB | 快（返回空白HTML快） | 慢（需渲染完整内容） |
| SEO | 差（爬虫可能无法执行JS） | 好（返回完整HTML） |
| 服务器负载 | 低（静态文件托管） | 高（每次请求需渲染） |
| 交互性 | 好（事件已绑定） | 需等待水合完成 |
| 带宽消耗 | 大（需下载完整JS） | 小（返回HTML） |
| 适用场景 | 登录后页面、后台管理 | 博客、电商、文档网站 |

### 1.2 静态站点生成SSG

静态站点生成（Static Site Generation，SSG）是一种在构建时预渲染页面的技术，生成的HTML可以部署到CDN等静态文件服务器，具有极快的加载速度和极低的服务器负载。SSG适用于内容不经常变化的页面，如博客、文档、营销页面等。

**SSG的工作原理：**

```typescript
// SSG渲染流程
// 构建时 -> 执行React组件 -> 生成静态HTML -> 部署到CDN -> 用户请求 -> 直接返回HTML

// Next.js中的SSG示例
// app/blog/[slug]/page.tsx

interface Post {
  id: string;
  title: string;
  content: string;
  publishedAt: string;
}

// 模拟获取文章数据（实际项目中从数据库或CMS获取）
async function getPost(slug: string): Promise<Post | null> {
  // SSG：在构建时调用，不会每次请求都执行
  const res = await fetch(`https://api.example.com/posts/${slug}`, {
    cache: 'force-cache'  // 默认缓存策略，构建时获取一次
  });
  if (!res.ok) return null;
  return res.json();
}

// 模拟获取所有文章slug
async function getAllPostSlugs(): Promise<string[]> {
  const res = await fetch('https://api.example.com/posts', { cache: 'force-cache' });
  const posts: Post[] = await res.json();
  return posts.map(post => post.id);
}

// 生成静态路径 - 构建时调用
export async function generateStaticParams() {
  const slugs = await getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

// SSG页面组件
async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);

  if (!post) {
    return <div>文章不存在</div>;
  }

  return (
    <article>
      <h1>{post.title}</h1>
      <time>{new Date(post.publishedAt).toLocaleDateString('zh-CN')}</time>
      <div>{post.content}</div>
    </article>
  );
}

// 静态元数据
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  return {
    title: post?.title || '文章未找到',
    description: post?.content.slice(0, 160),
    openGraph: {
      title: post?.title,
      images: [post?.coverImage].filter(Boolean),
    },
  };
}
```

### 1.3 增量静态再生ISR

增量静态再生（Incremental Static Regeneration，ISR）是SSG的增强版本，允许在运行时按需重新生成特定页面，而不需要重新构建整个站点。ISR结合了静态页面的性能和动态内容的需求，是现代Web应用的核心渲染策略之一。

**ISR的工作原理：**

```typescript
// ISR渲染流程
// 首次请求 -> 返回缓存的静态HTML -> 后台重新生成 -> 下次请求返回新内容
// 缓存过期后 -> 同步重新生成 -> 返回新内容

// Next.js ISR配置示例
// app/products/[id]/page.tsx

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  stock: number;
}

// 获取产品数据，支持ISR缓存
async function getProduct(id: string): Promise<Product | null> {
  const res = await fetch(`https://api.example.com/products/${id}`, {
    // ISR核心配置：revalidate表示多久重新生成一次（秒）
    revalidate: 60,  // 每60秒重新生成一次静态页面
  });
  if (!res.ok) return null;
  return res.json();
}

// 生成所有产品静态路径
export async function generateStaticParams() {
  const res = await fetch('https://api.example.com/products', { cache: 'force-cache' });
  const products: Product[] = await res.json();
  // 只预生成前100个产品页面
  return products.slice(0, 100).map((product) => ({ id: product.id }));
}

// 产品详情页面
async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);

  if (!product) {
    return <div>产品不存在</div>;
  }

  return (
    <div>
      <h1>{product.name}</h1>
      <p className="text-2xl font-bold">¥{product.price}</p>
      <p>{product.description}</p>
      <p>库存：{product.stock > 0 ? `${product.stock}件` : '缺货'}</p>
    </div>
  );
}
```

**ISR缓存策略详解：**

```typescript
// ISR的缓存失效机制

// 1. 时间-based失效
// revalidate: 60 表示60秒后缓存失效
async function fetchData() {
  return fetch('https://api.example.com/data', { revalidate: 60 });
}

// 2. 按需失效 - 使用revalidatePath
// 在数据更新时手动触发重新生成
async function updateProduct(id: string, data: Partial<Product>) {
  await fetch(`https://api.example.com/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  // 手动触发重新生成该产品页面
  revalidatePath(`/products/${id}`);
}

// 3. 按需失效 - 使用revalidateTag
// 标记特定数据源，需要时全部失效
async function getProduct() {
  return fetch('https://api.example.com/products', {
    next: { tags: ['products'] }  // 标记为products标签
  });
}

// 触发products标签的所有缓存失效
revalidateTag('products');

// 4. 混合策略 - 部分静态部分动态
async function HybridPage() {
  // 静态部分：导航菜单、侧边栏（每小时更新）
  const navItems = await fetch('/api/nav', { revalidate: 3600 });

  // 动态部分：用户特定内容（每次请求重新获取）
  const userActivity = await fetch('/api/activity', { cache: 'no-store' });

  return (
    <div>
      <nav>{navItems.map(item => <Link href={item.href}>{item.name}</Link>)}</nav>
      <main>用户动态：{userActivity}</main>
    </div>
  );
}
```

### 1.4 部分水合PPR

部分水合（Progressive Partial Hydration，PPH）和React的Progressive Enhancement特性是React 18引入的重大改进。其中最具代表性的是React Server Components（RSC）和Partial Hydration的结合。Next.js 13+的App Router完整实现了这一特性。

**React 18的PPR概念：**

```typescript
// PPR核心思想：只水合需要交互的部分

// 1. 服务端组件（Server Component）
// 默认在服务端渲染，不参与客户端水合
// 可以直接访问数据库、文件系统
async function ServerComponent() {
  // 直接在服务端获取数据，无需API
  const data = await db.query('SELECT * FROM posts');
  return <ul>{data.map(post => <li key={post.id}>{post.title}</li>)}</ul>;
}

// 2. 客户端组件（Client Component）
// 需要交互的部分，使用"use client"
"use client";
import { useState } from 'react';

function LikeButton({ initialLikes }: { initialLikes: number }) {
  const [likes, setLikes] = useState(initialLikes);
  return <button onClick={() => setLikes(l => l + 1)}>👍 {likes}</button>;
}

// 3. 组合使用 - 服务端渲染大部分内容，客户端处理交互
async function ArticleWithComments() {
  // 服务端：获取文章内容（只需读取）
  const article = await getArticle();

  return (
    <article>
      <h1>{article.title}</h1>
      <div>{article.content}</div>

      {/* 客户端：点赞按钮需要交互，水合这个组件 */}
      <LikeButton initialLikes={article.likes} />

      {/* 客户端：评论区需要交互 */}
      <Suspense fallback={<CommentsSkeleton />}>
        <Comments postId={article.id} />
      </Suspense>
    </article>
  );
}
```

### 1.5 流式SSR与Suspense

流式SSR（Streaming SSR）是React 18引入的核心特性，允许服务器逐步发送HTML内容，用户可以更早看到部分内容，而不是等待整个页面渲染完成。

**流式SSR的工作原理：**

```typescript
// 传统SSR vs 流式SSR

/*
传统SSR时间线：
|──请求──|────────渲染────|────返回────|──水合──|
         等待所有数据完成   等待渲染完成   等待JS下载

流式SSR时间线：
|──请求──|──快速返回Shell──|──流式内容──|──水合──|
         立即返回          逐步接收      增量水合
*/

// React 18 流式渲染API
import { renderToPipeableStream } from 'react-dom/server';
import { Suspense } from 'react';

// 使用renderToPipeableStream实现流式渲染
app.get('*', (req, res) => {
  let didError = false;

  const stream = renderToPipeableStream(
    <App url={req.url} />,
    {
      // Shell准备就绪时调用（快速返回的初始HTML）
      onShellReady() {
        res.statusCode = didError ? 500 : 200;
        res.setHeader('Content-Type', 'text/html');
        // 开始流式传输
        stream.pipe(res);
      },
      // Shell错误时调用
      onShellError(error) {
        console.error('Shell渲染失败:', error);
        res.status(500).send('<!DOCTYPE html><html><body>加载失败</body></html>');
      },
      // 发生错误时调用
      onError(error) {
        didError = true;
        console.error('渲染错误:', error);
      },
    }
  );
});

// Next.js App Router中的Suspense流式渲染
// app/blog/page.tsx
import { Suspense } from 'react';

function BlogPage() {
  return (
    <div>
      <h1>博客文章</h1>

      {/* 立即显示的部分 */}
      <Header />

      {/* 流式加载的部分 - 显示fallback直到数据准备好 */}
      <Suspense fallback={<PostsSkeleton />}>
        <Posts />  {/* 异步组件，逐步渲染 */}
      </Suspense>

      <Suspense fallback={<CommentsSkeleton />}>
        <PopularComments />
      </Suspense>
    </div>
  );
}

// 慢速异步组件
async function Posts() {
  // 模拟慢速数据获取
  await new Promise(resolve => setTimeout(resolve, 2000));
  const posts = await fetchPosts();
  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}

// 骨架屏组件
function PostsSkeleton() {
  return (
    <ul className="animate-pulse">
      <li className="h-4 bg-gray-200 rounded w-3/4"></li>
      <li className="h-4 bg-gray-200 rounded w-1/2"></li>
      <li className="h-4 bg-gray-200 rounded w-5/6"></li>
    </ul>
  );
}
```

**Next.js中的loading.tsx自动流式：**

```typescript
// app/blog/loading.tsx
// Next.js自动为这个文件创建Suspense边界
// 当路由正在加载时显示此内容

export default function Loading() {
  return (
    <div className="space-y-4">
      {/* 文章列表骨架屏 */}
      <div className="animate-pulse space-y-2">
        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
      <div className="animate-pulse space-y-2">
        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
      <div className="animate-pulse space-y-2">
        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-4/5"></div>
      </div>
    </div>
  );
}

// app/blog/page.tsx
// 这个页面会自动被loading.tsx包裹
export default async function BlogPage() {
  const posts = await getPosts(); // 可能很慢
  return (
    <div>
      <h1>博客文章</h1>
      <ul>
        {posts.map(post => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 1.6 各模式对比与适用场景

```typescript
// 渲染模式对比与选择指南

/*
┌─────────────────────────────────────────────────────────────────────┐
│                        渲染模式选择决策树                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  内容是否需要SEO？                                                    │
│       │                                                             │
│       ├── 是 ──> 内容是否频繁变化？                                   │
│       │           │                                                 │
│       │           ├── 否 ──> SSG（构建时生成）                        │
│       │           │                                                 │
│       │           └── 是 ──> ISR（增量更新）                          │
│       │                                                             │
│       └── 否 ──> 是否需要个性化内容？                                 │
│                   │                                                 │
│                   ├── 是 ──> CSR（客户端渲染）                        │
│                   │     或SSR（服务端渲染，按需）                      │
│                   │                                                 │
│                   └── 否 ──> 可以使用SSG/ISR                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
*/

// 渲染模式对比表

const RENDERING_MODES = {
  // 静态站点生成
  SSG: {
    优点: ['首屏加载极快', 'SEO完美', '服务器负载低', '可部署到CDN'],
    缺点: ['构建时间长', '内容更新延迟', '不适合大量页面'],
    适用: ['博客', '文档', '营销页面', '产品列表（数量有限）'],
    缓存: '永久缓存，直到主动重新构建'
  },

  // 增量静态再生
  ISR: {
    优点: ['内容相对实时', '性能好', '扩展性强'],
    缺点: ['首次访问可能慢', '缓存策略复杂'],
    适用: ['电商产品页', '新闻文章', '用户生成内容'],
    缓存: '按时间或按需失效'
  },

  // 服务端渲染
  SSR: {
    优点: ['SEO友好', '内容实时', '首屏快'],
    缺点: ['服务器负载高', 'TTFB较慢', '交互需水合'],
    适用: ['社交媒体', '论坛', '需要登录的页面'],
    缓存: '按请求或短时间缓存'
  },

  // 客户端渲染
  CSR: {
    优点: ['交互丰富', '服务器负载低', '开发简单'],
    缺点: ['首屏慢', 'SEO差', '需要JS'],
    适用: ['后台管理', 'SaaS应用', '高度交互应用'],
    缓存: '静态资源长期缓存'
  },

  // React Server Components + PPR
  RSC: {
    优点: ['零客户端JS', '数据获取高效', '渐进式增强'],
    缺点: ['学习曲线', '生态仍在成熟'],
    适用: ['复杂应用', '内容+交互混合'],
    缓存: '服务端缓存 + 客户端缓存'
  }
};

// Next.js App Router中的混合渲染策略
// app/
// ├── page.tsx              - 静态（SSG）
// ├── blog/
// │   ├── page.tsx          - 静态+ISR
// │   ├── [slug]/
// │   │   └── page.tsx     - 动态SSR
// │   └── loading.tsx      - 流式加载状态
// ├── dashboard/
// │   └── page.tsx         - 动态SSR（需要登录）
// └── api/
//     └── route.ts         - API路由
```

---

## 2. Next.js SSR深入解析

### 2.1 App Router vs Pages Router

Next.js提供了两套路由系统：App Router（App Router）和Pages Router（Pages Router）。App Router是Next.js 13引入的新一代路由系统，基于React Server Components构建，提供更强大的服务端能力。

**App Router核心特性：**

```typescript
// App Router结构
// app/
// ├── layout.tsx           # 根布局
// ├── page.tsx             # 首页（/）
// ├── about/
// │   └── page.tsx         # 关于页（/about）
// ├── blog/
// │   ├── page.tsx         # 博客列表（/blog）
// │   ├── [slug]/
// │   │   └── page.tsx     # 博客详情（/blog/:slug）
// │   └── loading.tsx      # 加载状态
// └── api/
//     └── route.ts         # API路由

// app/layout.tsx - 根布局
// 所有页面共享的布局，服务端组件
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

// app/page.tsx - 首页（服务端组件）
// 默认在服务端渲染，可以直接获取数据
async function HomePage() {
  const data = await fetchData();
  return <HomePageClient data={data} />;
}

// 如果需要客户端交互，创建单独的客户端组件
// components/HomePageClient.tsx
"use client";
export function HomePageClient({ data }: { data: any }) {
  // 客户端交互逻辑
  return <div>{/* 使用data渲染 */}</div>;
}
```

**Pages Router核心特性（传统方式）：**

```typescript
// Pages Router结构
// pages/
// ├── _app.tsx             # 应用入口
// ├── _document.tsx        # 文档模板
// ├── index.tsx            # 首页
// ├── about.tsx            # 关于页
// ├── blog/
// │   ├── index.tsx        # 博客列表
// │   └── [slug].tsx       # 博客详情
// └── api/
//     └── hello.ts         # API路由

// pages/_app.tsx - 应用入口
import type { AppProps } from 'next/app';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

// pages/index.tsx - 首页
// 使用getStaticProps实现SSG
export async function getStaticProps() {
  const data = await fetchData();
  return {
    props: { data },
    revalidate: 60,  // ISR
  };
}

export default function HomePage({ data }) {
  return <div>{/* 渲染数据 */}</div>;
}

// pages/blog/[slug].tsx - 动态路由
// 使用getServerSideProps实现SSR
export async function getServerSideProps(context) {
  const { params, query } = context;
  const slug = params.slug;

  const post = await fetchPost(slug);
  if (!post) {
    return { notFound: true };
  }

  return {
    props: { post },
  };
}

export default function BlogPostPage({ post }) {
  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}
```

**App Router vs Pages Router对比：**

```typescript
// App Router vs Pages Router 核心差异

const ROUTER_COMPARISON = {
  // 组件默认渲染位置
  serverComponents: {
    appRouter: '默认服务端组件，无需"use server"',
    pagesRouter: '所有组件客户端渲染，需要API区分'
  },

  // 数据获取API
  dataFetching: {
    appRouter: {
      fetch: '直接使用fetch，cache选项控制缓存',
      async: '组件直接定义为async',
      example: `async function Page() {
  const data = await fetch('/api/data', { cache: 'force-cache' });
  return <div>{data}</div>;
}`
    },
    pagesRouter: {
      getStaticProps: '构建时获取数据（SSG/ISR）',
      getServerSideProps: '每次请求获取数据（SSR）',
      getInitialProps: '客户端+服务端（已废弃）'
    }
  },

  // 布局系统
  layouts: {
    appRouter: '支持嵌套布局，每个路由段可有自己的布局',
    pagesRouter: '只有单一_app.tsx布局'
  },

  // 加载状态
  loading: {
    appRouter: 'loading.tsx自动创建Suspense边界',
    pagesRouter: '_app.tsx中使用自定义加载状态'
  },

  // 错误处理
  errorHandling: {
    appRouter: 'error.tsx + global-error.tsx',
    pagesRouter: '_error.tsx'
  },

  // API路由
  apiRoutes: {
    appRouter: 'app/api/[route]/route.ts，使用POST/GET等方法',
    pagesRouter: 'pages/api/[route].ts，使用req/res'
  }
};
```

### 2.2 服务端组件与客户端组件

在Next.js App Router中，组件默认在服务端渲染。只有明确标记为客户端组件的部分才会发送到客户端执行。这种精细化的渲染控制是App Router的核心优势。

**服务端组件特性：**

```typescript
// 服务端组件特点
// 1. 默认渲染在服务端
// 2. 可以直接访问数据库、文件系统
// 3. 不能使用hooks（useState, useEffect等）
// 4. 不能使用浏览器API
// 5. 不会打包到客户端JS中

// app/blog/page.tsx - 服务端组件
import { db } from '@/lib/database';

async function BlogPage() {
  // 直接访问数据库，无需API
  const posts = await db.post.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  // 可以使用async/await
  const featuredPost = await getFeaturedPost();

  return (
    <div>
      {featuredPost && <FeaturedPost post={featuredPost} />}
      <PostList posts={posts} />
    </div>
  );
}

// 服务端组件可以导入客户端组件
import { LikeButton } from '@/components/LikeButton';

async function BlogPost({ post }) {
  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
      {/* LikeButton是客户端组件，会被水合 */}
      <LikeButton initialLikes={post.likes} />
    </article>
  );
}
```

**客户端组件特性：**

```typescript
// 客户端组件特点
// 1. 使用"use client"指令标记
// 2. 在客户端渲染，支持交互
// 3. 可以使用hooks和浏览器API
// 4. 会打包到客户端JS中

// components/LikeButton.tsx
"use client";

import { useState } from 'react';

interface LikeButtonProps {
  initialLikes: number;
  postId: string;
}

export function LikeButton({ initialLikes, postId }: LikeButtonProps) {
  // 使用useState管理本地状态
  const [likes, setLikes] = useState(initialLikes);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);

    // 乐观更新
    setLikes(l => l + 1);

    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
      });
      if (!res.ok) {
        // 回滚
        setLikes(l => l - 1);
      }
    } catch {
      // 回滚
      setLikes(l => l - 1);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <button onClick={handleLike} disabled={isLiking}>
      👍 {likes}
    </button>
  );
}
```

**服务端与客户端组件边界：**

```typescript
// 组件边界设计原则

// ❌ 错误：服务端组件中使用客户端hooks
// app/page.tsx
async function Page() {
  // 错误：useState只能在客户端组件中使用
  const [count, setCount] = useState(0); // Error!
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}

// ✅ 正确：分离为客户端组件
// app/page.tsx（服务端）
async function Page() {
  const data = await getData();
  return (
    <div>
      <h1>{data.title}</h1>
      {/* 客户端组件处理交互 */}
      <Counter initialCount={data.count} />
    </div>
  );
}

// components/Counter.tsx（客户端）
"use client";
import { useState } from 'react';

export function Counter({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}

// 正确：服务端组件作为数据获取层
// app/dashboard/page.tsx
async function DashboardPage() {
  // 服务端获取数据
  const [user, stats, notifications] = await Promise.all([
    getUser(),
    getStats(),
    getNotifications()
  ]);

  return (
    <div>
      {/* 传递数据给客户端组件 */}
      <UserProfile user={user} />
      <StatsChart stats={stats} />
      <NotificationList notifications={notifications} />
    </div>
  );
}

// 客户端组件接收数据并处理交互
"use client";
function NotificationList({ notifications }: { notifications: any[] }) {
  const [filter, setFilter] = useState('all');

  const filtered = notifications.filter(n =>
    filter === 'all' || n.type === filter
  );

  return (
    <div>
      <select value={filter} onChange={e => setFilter(e.target.value)}>
        <option value="all">全部</option>
        <option value="mention">提及</option>
        <option value="reply">回复</option>
      </select>
      {filtered.map(n => <NotificationItem key={n.id} notification={n} />)}
    </div>
  );
}
```

### 2.3 getServerSideProps与getStaticProps

在Pages Router中，getServerSideProps和getStaticProps是两种主要的数据获取方式。理解它们的区别和使用场景对于构建高效的Next.js应用至关重要。

**getServerSideProps（SSR）：**

```typescript
// pages/products/[id].tsx
// 每次请求都会重新执行，用于需要实时数据的页面

import { GetServerSideProps } from 'next';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { params, req, res, query } = context;
  const { id } = params;

  // 可以访问请求上下文
  const authToken = req.headers.cookie?.split('=')[1];

  // 获取产品数据
  const res = await fetch(`https://api.example.com/products/${id}`);
  if (!res.ok) {
    return { notFound: true };
  }

  const product = await res.json();

  // 传递数据给组件
  return {
    props: {
      product,
      // 可以传递额外的数据
      generatedAt: new Date().toISOString(),
    },
  };
};

interface ProductPageProps {
  product: Product;
  generatedAt: string;
}

export default function ProductPage({ product, generatedAt }: ProductPageProps) {
  return (
    <div>
      <p>生成时间：{generatedAt}</p>
      <h1>{product.name}</h1>
      <p>价格：¥{product.price}</p>
      <p>库存：{product.stock}</p>
    </div>
  );
}
```

**getStaticProps（SSG/ISR）：**

```typescript
// pages/blog/index.tsx
// 构建时执行，用于内容相对稳定的页面

import { GetStaticProps } from 'next';

interface Post {
  id: string;
  title: string;
  excerpt: string;
  publishedAt: string;
}

export const getStaticProps: GetStaticProps = async () => {
  // SSG：构建时获取所有博客文章
  const res = await fetch('https://api.example.com/posts');
  const posts: Post[] = await res.json();

  // ISR：返回revalidate实现增量静态再生
  return {
    props: {
      posts,
    },
    revalidate: 60, // 60秒后重新生成
  };
};

interface BlogIndexProps {
  posts: Post[];
}

export default function BlogIndex({ posts }: BlogIndexProps) {
  return (
    <div>
      <h1>博客文章</h1>
      <ul>
        {posts.map(post => (
          <li key={post.id}>
            <a href={`/blog/${post.id}`}>{post.title}</a>
            <p>{post.excerpt}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

// 使用generateStaticParams实现SSG动态路由
// pages/blog/[slug].tsx

export const getStaticPaths = async () => {
  const res = await fetch('https://api.example.com/posts');
  const posts = await res.json();

  return {
    paths: posts.map(post => ({
      params: { slug: post.id },
    })),
    fallback: 'blocking', // 新页面首次访问时静态生成
  };
};

export const getStaticProps: GetStaticProps = async (context) => {
  const { params } = context;
  const slug = params.slug;

  const res = await fetch(`https://api.example.com/posts/${slug}`);
  if (!res.ok) {
    return { notFound: true };
  }

  const post = await res.json();

  return {
    props: { post },
    revalidate: 60,
  };
};
```

### 2.4 路由预取与缓存

Next.js提供了智能的路由预取和缓存机制，可以显著提升页面导航性能。Link组件在视口中可见时会自动预取目标页面，而Next.js的App Router提供了更精细的缓存控制。

**Link组件预取：**

```typescript
// app/page.tsx
import Link from 'next/link';

function HomePage() {
  return (
    <div>
      <h1>首页</h1>

      {/* 预取行为： */}
      {/* 1. Link在视口中可见时自动预取 */}
      {/* 2. 鼠标悬停时预取 */}
      {/* 3. prefetch={false}可禁用预取 */}

      <Link href="/blog">
        博客列表（自动预取）
      </Link>

      <Link href="/about" prefetch={false}>
        关于页面（禁用预取）
      </Link>

      {/* 动态路由预取 */}
      <Link href="/blog/post-1">
        文章1
      </Link>
    </div>
  );
}
```

**App Router缓存机制：**

```typescript
// Next.js App Router的完整缓存层次

/*
缓存层次结构：

┌─────────────────────────────────────────────┐
│           Request Memoization               │
│     （同一请求中的重复fetch去重）              │
├─────────────────────────────────────────────┤
│              Data Cache                      │
│    （fetch请求的默认缓存，持久化）             │
├─────────────────────────────────────────────┤
│            Full Route Cache                  │
│      （渲染结果缓存，运行时生效）              │
├─────────────────────────────────────────────┤
│            Router Cache                     │
│      （客户端路由缓存，预取数据）              │
└─────────────────────────────────────────────┘
*/

// 数据缓存 - fetch默认行为
async function getData() {
  // 默认：force-cache（静态数据）
  const data1 = await fetch('https://api.example.com/data');

  // 动态获取（每次请求重新获取）
  const data2 = await fetch('https://api.example.com/realtime', {
    cache: 'no-store'
  });

  // 定时重新验证（ISR）
  const data3 = await fetch('https://api.example.com/posts', {
    next: { revalidate: 60 }
  });
}

// 使用fetch扩展 - 便捷配置
// 等同于 fetch(url, { cache: 'force-cache' })
const staticData = await fetch('https://api.example.com/static');

// 等同于 fetch(url, { cache: 'no-store' })
const dynamicData = await fetch('https://api.example.com/dynamic', {
  cache: 'no-store'
});

// 等同于 fetch(url, { next: { revalidate: 60 } })
const revalidatedData = await fetch('https://api.example.com/posts', {
  next: { revalidate: 60 }
});

// 预加载模式
const preloadData = await fetch('https://api.example.com/data', {
  priority: true  // 高优先级预加载
});
```

### 2.5 流式HTML与streaming

Next.js 13+的App Router原生支持流式渲染，配合Suspense组件可以创建流畅的流式体验。

**流式渲染完整示例：**

```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react';

async function DashboardPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 静态内容，立即显示 */}
      <div className="lg:col-span-3">
        <h1>控制台</h1>
        <p>欢迎回来</p>
      </div>

      {/* 动态内容，流式加载 */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsCard />
      </Suspense>

      <Suspense fallback={<ChartSkeleton />}>
        <RevenueChart />
      </Suspense>

      <Suspense fallback={<RecentActivitySkeleton />}>
        <RecentActivity />
      </Suspense>

      <Suspense fallback={<NotificationsSkeleton />}>
        <Notifications />
      </Suspense>
    </div>
  );
}

// 统计卡片 - 模拟慢速数据获取
async function StatsCard() {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 1500));

  const stats = await fetchStats();
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3>统计数据</h3>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <p className="text-gray-500">总用户</p>
          <p className="text-2xl font-bold">{stats.totalUsers}</p>
        </div>
        <div>
          <p className="text-gray-500">活跃用户</p>
          <p className="text-2xl font-bold">{stats.activeUsers}</p>
        </div>
      </div>
    </div>
  );
}

// 收入图表
async function RevenueChart() {
  await new Promise(resolve => setTimeout(resolve, 2000));
  const data = await fetchRevenueData();

  return (
    <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
      <h3>收入趋势</h3>
      <div className="h-64 flex items-end gap-2">
        {data.map((item, i) => (
          <div
            key={i}
            className="flex-1 bg-teal-500 rounded-t"
            style={{ height: `${item.value}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// 骨架屏组件
function StatsSkeleton() {
  return (
    <div className="bg-white p-6 rounded-lg shadow animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-12 bg-gray-200 rounded"></div>
        <div className="h-12 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-white p-6 rounded-lg shadow lg:col-span-2 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div className="h-64 bg-gray-100 rounded flex items-end gap-2 p-4">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="flex-1 bg-gray-200 rounded-t" style={{ height: `${Math.random() * 80 + 20}%` }}></div>
        ))}
      </div>
    </div>
  );
}

function RecentActivitySkeleton() {
  return (
    <div className="bg-white p-6 rounded-lg shadow animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationsSkeleton() {
  return (
    <div className="bg-white p-6 rounded-lg shadow animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  );
}
```

### 2.6 服务端Action与表单处理

Next.js 14+引入了Server Actions，允许直接在服务端组件中定义可被客户端调用的异步函数。这大大简化了表单处理和数据提交的复杂度。

**Server Actions基础：**

```typescript
// app/actions.ts
// 定义Server Actions

'use server';

interface FormState {
  success: boolean;
  message: string;
  errors?: Record<string, string>;
}

export async function submitContactForm(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  // 获取表单数据
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const message = formData.get('message') as string;

  // 验证
  const errors: Record<string, string> = {};
  if (!name || name.length < 2) {
    errors.name = '姓名至少需要2个字符';
  }
  if (!email || !email.includes('@')) {
    errors.email = '请输入有效的邮箱地址';
  }
  if (!message || message.length < 10) {
    errors.message = '留言至少需要10个字符';
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      message: '表单验证失败',
      errors,
    };
  }

  // 提交到数据库
  try {
    await db.contact.create({
      data: { name, email, message },
    });

    return {
      success: true,
      message: '提交成功！我们会尽快与您联系。',
    };
  } catch (error) {
    return {
      success: false,
      message: '提交失败，请稍后重试',
    };
  }
}

// 上传文件
export async function uploadDocument(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const file = formData.get('file') as File;
  const title = formData.get('title') as string;

  if (!file || !title) {
    return {
      success: false,
      message: '请提供文件标题和上传文件',
    };
  }

  // 检查文件大小（限制10MB）
  if (file.size > 10 * 1024 * 1024) {
    return {
      success: false,
      message: '文件大小不能超过10MB',
    };
  }

  // 上传到存储服务
  const buffer = await file.arrayBuffer();
  const fileName = `${Date.now()}-${file.name}`;

  try {
    await uploadToS3(buffer, fileName);

    // 保存到数据库
    await db.document.create({
      data: {
        title,
        fileName,
        size: file.size,
      },
    });

    revalidatePath('/documents');

    return {
      success: true,
      message: '上传成功',
    };
  } catch (error) {
    return {
      success: false,
      message: '上传失败，请重试',
    };
  }
}
```

**在表单中使用Server Actions：**

```typescript
// app/contact/page.tsx
// 使用useActionState管理表单状态

'use client';

import { useActionState } from 'react';
import { submitContactForm } from '@/app/actions';

const initialState = {
  success: false,
  message: '',
  errors: {},
};

export default function ContactPage() {
  const [state, formAction, isPending] = useActionState(
    submitContactForm,
    initialState
  );

  return (
    <div className="max-w-2xl mx-auto py-12">
      <h1>联系我们</h1>

      {state.message && (
        <div
          className={`p-4 mb-6 rounded-lg ${
            state.success
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {state.message}
        </div>
      )}

      <form action={formAction} className="space-y-6">
        <div>
          <label htmlFor="name" className="block mb-2 font-medium">
            姓名
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className="w-full px-4 py-2 border rounded-lg"
          />
          {state.errors?.name && (
            <p className="text-red-500 text-sm mt-1">{state.errors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block mb-2 font-medium">
            邮箱
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className="w-full px-4 py-2 border rounded-lg"
          />
          {state.errors?.email && (
            <p className="text-red-500 text-sm mt-1">{state.errors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="message" className="block mb-2 font-medium">
            留言
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            className="w-full px-4 py-2 border rounded-lg"
          />
          {state.errors?.message && (
            <p className="text-red-500 text-sm mt-1">{state.errors.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 bg-teal-500 text-white rounded-lg disabled:opacity-50"
        >
          {isPending ? '提交中...' : '提交'}
        </button>
      </form>
    </div>
  );
}
```

### 2.7 Middleware中间件

Next.js的Middleware允许在请求完成前执行代码，用于认证、重定向、请求修改等场景。

**Middleware基础：**

```typescript
// middleware.ts
// 位于项目根目录（或src目录）

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware在以下情况会被执行：
// - 每个请求到达时
// - 可以基于路径匹配执行特定逻辑

export function middleware(request: NextRequest) {
  // 获取请求路径
  const { pathname } = request.nextUrl;

  // 1. 认证检查
  // 保护路由
  const protectedPaths = ['/dashboard', '/settings', '/profile'];
  const isProtectedPath = protectedPaths.some(path =>
    pathname.startsWith(path)
  );

  // 获取token
  const token = request.cookies.get('auth_token');

  if (isProtectedPath && !token) {
    // 重定向到登录页
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. 添加响应头
  const response = NextResponse.next();

  // 添加安全头
  response.headers.set('X-Custom-Header', 'value');
  response.headers.set('X-Frame-Options', 'DENY');

  // 添加内容安全策略
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  );

  return response;
}

// 配置匹配路径
export const config = {
  matcher: [
    // 匹配所有路径，除了API路由、静态文件等
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
```

**Middleware高级用法：**

```typescript
// middleware.ts - 完整的认证和本地化中间件

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 支持的语言
const locales = ['zh-CN', 'en-US', 'ja-JP'];
const defaultLocale = 'zh-CN';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. 本地化处理
  // 检查路径是否已包含语言前缀
  const pathnameHasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!pathnameHasLocale) {
    // 检测用户语言偏好
    const locale = request.cookies.get('NEXT_LOCALE')?.value ||
      request.headers.get('Accept-Language')?.split(',')[0] ||
      defaultLocale;

    // 重定向到带语言前缀的路径
    const newUrl = new URL(`/${locale}${pathname}`, request.url);
    return NextResponse.redirect(newUrl);
  }

  // 2. JWT验证
  const token = request.cookies.get('access_token')?.value;

  if (token) {
    try {
      // 验证JWT（实际项目中应使用jose库）
      const payload = parseJWT(token);

      // 检查token是否过期
      if (payload.exp && payload.exp < Date.now() / 1000) {
        // Token过期，尝试刷新
        const refreshToken = request.cookies.get('refresh_token')?.value;
        if (refreshToken) {
          const newTokens = await refreshAccessToken(refreshToken);
          if (newTokens) {
            const response = NextResponse.next();
            response.cookies.set('access_token', newTokens.access_token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 60 * 60, // 1小时
            });
            return response;
          }
        }

        // 刷新失败，清除token并重定向
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('access_token');
        response.cookies.delete('refresh_token');
        return response;
      }

      // 将用户信息添加到请求头
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', payload.userId);
      requestHeaders.set('x-user-role', payload.role);

      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    } catch {
      // Token无效，清除并重定向
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('access_token');
      return response;
    }
  }

  // 3. 速率限制（简单实现）
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const rateLimitKey = `rate_limit:${ip}`;

  // 实际项目中应使用Redis
  // const current = await redis.incr(rateLimitKey);
  // if (current > 100) { // 限制100请求/分钟
  //   return NextResponse.json(
  //     { error: '请求过于频繁' },
  //     { status: 429 }
  //   );
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // 匹配所有路径
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};

// 简单的JWT解析（实际使用jose库）
function parseJWT(token: string) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token');
  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
  return payload;
}
```

---

## 3. 数据获取策略

### 3.1 服务端数据获取

Next.js App Router中的服务端数据获取变得更加直接和强大。组件可以直接定义为async函数，直接使用fetch获取数据。

**服务端fetch扩展：**

```typescript
// app/users/page.tsx
// 服务端组件直接获取数据

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'user' | 'guest';
  createdAt: string;
}

// 服务端数据获取 - fetch默认缓存
async function getUsers(): Promise<User[]> {
  // 使用fetch，Next.js会自动处理缓存和重新验证
  const res = await fetch('https://api.example.com/users', {
    // cache选项控制缓存行为
    // - force-cache: 强制使用缓存（默认）
    // - no-store: 每次请求重新获取
    // - no-cache: 强制重新验证
    cache: 'force-cache',
  });

  if (!res.ok) {
    throw new Error('获取用户列表失败');
  }

  return res.json();
}

// 获取单个用户
async function getUser(id: string): Promise<User | null> {
  const res = await fetch(`https://api.example.com/users/${id}`, {
    cache: 'no-store', // 动态数据不使用缓存
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}

// 用户列表页面
async function UsersPage() {
  const users = await getUsers();

  return (
    <div>
      <h1>用户列表</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(user => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    </div>
  );
}

// 用户卡片组件
function UserCard({ user }: { user: User }) {
  return (
    <div className="border rounded-lg p-4">
      <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full" />
      <h3>{user.name}</h3>
      <p className="text-gray-500">{user.email}</p>
      <span className="inline-block px-2 py-1 text-xs rounded bg-gray-100">
        {user.role}
      </span>
    </div>
  );
}
```

**使用数据库直接查询：**

```typescript
// app/posts/[slug]/page.tsx
// 直接使用数据库查询，无需API

import { db } from '@/lib/database';

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  coverImage: string | null;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  tags: { name: string }[];
  publishedAt: Date;
  updatedAt: Date;
}

async function getPost(slug: string): Promise<Post | null> {
  const post = await db.post.findUnique({
    where: { slug },
    include: {
      author: {
        select: { id: true, name: true, avatar: true },
      },
      tags: {
        select: { name: true },
      },
    },
  });

  return post;
}

async function PostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);

  if (!post) {
    return <div>文章不存在</div>;
  }

  return (
    <article>
      {/* 文章封面图 - 使用next/image优化 */}
      {post.coverImage && (
        <div className="relative h-64 md:h-96 mb-8">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover rounded-lg"
            priority
          />
        </div>
      )}

      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        <div className="flex items-center gap-4">
          <img
            src={post.author.avatar}
            alt={post.author.name}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <p className="font-medium">{post.author.name}</p>
            <p className="text-gray-500 text-sm">
              {new Date(post.publishedAt).toLocaleDateString('zh-CN')}
            </p>
          </div>
        </div>

        {/* 标签 */}
        <div className="flex gap-2 mt-4">
          {post.tags.map(tag => (
            <span key={tag.name} className="px-2 py-1 bg-gray-100 rounded text-sm">
              {tag.name}
            </span>
          ))}
        </div>
      </header>

      <div className="prose max-w-none">
        {post.content}
      </div>
    </article>
  );
}
```

### 3.2 缓存策略

Next.js提供了细粒度的缓存控制，允许开发者根据数据特性选择合适的缓存策略。

**缓存策略详解：**

```typescript
// Next.js缓存策略分类

/*
缓存策略层次：

1. fetch请求缓存
   ├── force-cache (默认) - 使用缓存，不重新获取
   ├── no-store - 每次重新获取
   └── revalidate - 定时重新验证

2. 路由缓存（Full Route Cache）
   ├── 静态路由 - 自动缓存
   └── 动态路由 - 默认不缓存

3. 客户端缓存（Router Cache）
   ├── 预取缓存 - 链接hover时
   └── 前后导航缓存 - 访问过的页面
*/

// 1. 静态数据（很少变化）
async function getStaticData() {
  const res = await fetch('https://api.example.com/config', {
    cache: 'force-cache', // 默认选项
    // 或者使用next选项
    // next: { revalidate: false }
  });
}

// 2. 动态数据（每次需要最新）
async function getRealtimeData() {
  const res = await fetch('https://api.example.com/stock-price', {
    cache: 'no-store', // 每次请求都获取最新数据
    // 相当于 getServerSideProps
  });
}

// 3. ISR数据（定时更新）
async function getISRData() {
  const res = await fetch('https://api.example.com/products', {
    next: { revalidate: 60 }, // 60秒后重新验证
  });
}

// 4. 按标签缓存（需要时批量失效）
async function getTaggedData() {
  return fetch('https://api.example.com/posts', {
    next: { tags: ['posts'] }, // 添加posts标签
  });
}

// 触发posts标签的所有缓存失效
// 在Server Action或API Route中
import { revalidateTag } from 'next/cache';

export async function createPost(data: PostData) {
  await db.post.create({ data });
  // 使所有包含posts标签的缓存失效
  revalidateTag('posts');
}

// 5. 按路径缓存失效
import { revalidatePath } from 'next/cache';

export async function updateUser(userId: string, data: UserData) {
  await db.user.update({ where: { id: userId }, data });
  // 使该用户的页面缓存失效
  revalidatePath(`/users/${userId}`);
  // 使用户列表缓存失效
  revalidatePath('/users');
}

// 6. 时间-based ISR
export async function getBlogPost(slug: string) {
  return fetch(`https://api.example.com/posts/${slug}`, {
    // 1小时后重新验证
    next: { revalidate: 3600 },
  });
}
```

### 3.3 并行数据获取与串行请求

优化数据获取的性能关键在于合理安排请求的并行与串行关系。

**并行数据获取：**

```typescript
// app/dashboard/page.tsx
// 并行获取多个数据源

async function DashboardPage() {
  // 使用Promise.all并行获取多个数据源
  const [user, stats, notifications, recentActivity] = await Promise.all([
    getUser(),              // 并行请求1
    getStats(),             // 并行请求2
    getNotifications(),    // 并行请求3
    getRecentActivity()    // 并行请求4
  ]);

  // 总时间 ≈ 最慢请求的时间，而非所有请求时间之和
  // 如果每个请求1秒，串行需要4秒，并行只需要1秒

  return (
    <div className="dashboard">
      <Welcome name={user.name} />
      <Stats data={stats} />
      <Notifications notifications={notifications} />
      <Activity activities={recentActivity} />
    </div>
  );
}

// 使用Promise.allSettled处理部分失败
async function getAllData() {
  const results = await Promise.allSettled([
    getUser(),
    getStats(),
    getNotifications(),
  ]);

  const user = results[0].status === 'fulfilled' ? results[0].value : null;
  const stats = results[1].status === 'fulfilled' ? results[1].value : null;
  const notifications = results[2].status === 'fulfilled' ? results[2].value : [];

  return { user, stats, notifications };
}
```

**串行请求（按顺序依赖）：**

```typescript
// app/blog/[slug]/page.tsx
// 串行请求 - 当数据存在依赖关系时

async function BlogPostPage({ params }: { params: { slug: string } }) {
  // 串行请求 - 必须按顺序执行
  // 1. 先获取文章信息
  const post = await getPostBySlug(params.slug);

  if (!post) {
    return <div>文章不存在</div>;
  }

  // 2. 再获取作者信息（依赖post.authorId）
  const author = await getAuthor(post.authorId);

  // 3. 最后获取相关文章（依赖post.tags）
  const relatedPosts = await getRelatedPosts(post.tags);

  return (
    <article>
      <h1>{post.title}</h1>
      <AuthorInfo author={author} />
      <Content content={post.content} />
      <RelatedPosts posts={relatedPosts} />
    </article>
  );
}

// 混合策略 - 优先并行，必要时串行
async function OptimizedBlogPostPage({ params }: { params: { slug: string } }) {
  // 第一批：获取文章（没有依赖）
  const post = await getPostBySlug(params.slug);

  if (!post) {
    return <div>文章不存在</div>;
  }

  // 第二批：获取作者和标签（都已知道，可以并行）
  const [author, tags] = await Promise.all([
    getAuthor(post.authorId),
    getTags(post.tags)
  ]);

  // 第三批：获取相关文章（需要完整post和tags数据）
  const relatedPosts = await getRelatedPosts(tags);

  return (
    <article>
      <h1>{post.title}</h1>
      <AuthorInfo author={author} />
      <Tags tags={tags} />
      <Content content={post.content} />
      <RelatedPosts posts={relatedPosts} />
    </article>
  );
}
```

### 3.4 预加载与预获取

预加载技术可以显著提升用户体验，在用户实际需要数据之前就准备好数据。

**React Suspense与预加载：**

```typescript
// 预加载模式实现

// 创建预加载Promise
const preloadedData = new Map();

function preloadData(key: string, fetcher: () => Promise<any>) {
  if (!preloadedData.has(key)) {
    preloadedData.set(key, fetcher());
  }
  return preloadedData.get(key);
}

function getPreloadedData(key: string) {
  return preloadedData.get(key);
}

// 使用预加载
async function ProductPage({ params }: { params: { id: string } }) {
  // 预加载评论数据
  preloadData(`comments-${params.id}`, () => fetchComments(params.id));

  const product = await getProduct(params.id);

  return (
    <div>
      <ProductDetail product={product} />
      <Suspense fallback={<CommentsSkeleton />}>
        <Comments productId={params.id} />
      </Suspense>
    </div>
  );
}

// Comments组件尝试使用预加载数据
async function Comments({ productId }: { productId: string }) {
  // 优先使用预加载数据
  let comments = getPreloadedData(`comments-${productId}`);

  // 如果没有预加载，则直接获取
  if (!comments) {
    comments = fetchComments(productId);
  }

  return <CommentList comments={await comments} />;
}
```

### 3.5 useOptimistic乐观更新

React 19引入了useOptimistic Hook，用于实现乐观更新，提供即时反馈的用户体验。

**useOptimistic使用场景：**

```typescript
// components/CommentSection.tsx
"use client";

import { useOptimistic, useState, useTransition } from 'react';

interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: Date;
}

interface CommentWithOptimistic extends Comment {
  isOptimistic?: boolean;
}

// 乐观更新评论
function CommentSection({ initialComments }: { initialComments: Comment[] }) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [isPending, startTransition] = useTransition();

  // 使用useOptimistic实现乐观更新
  // optimisticComments会在提交时立即更新UI
  const [optimisticComments, addOptimisticComment] = useOptimistic(
    comments,
    (state: Comment[], newComment: { text: string; author: string }) => [
      ...state,
      {
        id: `temp-${Date.now()}`,
        text: newComment.text,
        author: newComment.author,
        createdAt: new Date(),
        isOptimistic: true, // 标记为乐观更新
      }
    ]
  );

  const handleSubmitComment = async (text: string) => {
    const newComment = { text, author: 'currentUser' };

    // 立即添加乐观更新
    addOptimisticComment(newComment);

    // 后台提交
    startTransition(async () => {
      try {
        const response = await fetch('/api/comments', {
          method: 'POST',
          body: JSON.stringify(newComment),
        });

        if (response.ok) {
          const savedComment = await response.json();
          // 成功后用真实数据替换乐观更新
          setComments(prev => [
            ...prev.filter(c => !c.isOptimistic),
            savedComment
          ]);
        } else {
          // 失败时移除乐观更新
          setComments(prev => prev.filter(c => !c.isOptimistic));
        }
      } catch {
        // 失败时移除乐观更新
        setComments(prev => prev.filter(c => !c.isOptimistic));
      }
    });
  };

  return (
    <div>
      <CommentForm onSubmit={handleSubmitComment} isPending={isPending} />

      <div className="space-y-4">
        {optimisticComments.map(comment => (
          <CommentItem
            key={comment.id}
            comment={comment}
            isPending={comment.isOptimistic}
          />
        ))}
      </div>
    </div>
  );
}

// 点赞按钮的乐观更新示例
"use client";
import { useOptimistic } from 'react';

function LikeButton({ initialLikes, commentId }: { initialLikes: number; commentId: string }) {
  const [optimisticLikes, addOptimisticLike] = useOptimistic(
    initialLikes,
    (likes: number) => likes + 1
  );

  const handleLike = async () => {
    // 立即更新UI
    addOptimisticLike();

    // 发送请求
    await fetch(`/api/comments/${commentId}/like`, { method: 'POST' });
  };

  return (
    <button onClick={handleLike}>
      👍 {optimisticLikes}
    </button>
  );
}
```

---

## 4. SEO优化实战

### 4.1 Meta标签与Open Graph

Next.js提供了强大的Metadata API，可以轻松配置页面标题、描述、Open Graph等SEO相关标签。

**静态Metadata：**

```typescript
// app/about/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  // 基础标签
  title: '关于我们 - FastDocument',
  description: '了解FastDocument团队，我们致力于打造最现代化文档协作平台。',
  keywords: ['关于我们', '团队介绍', '公司理念', '文档协作'],

  // 作者信息
  authors: [{ name: 'FastDocument Team', url: 'https://fastdocument.com' }],
  creator: 'FastDocument Team',

  // Open Graph（社交媒体分享）
  openGraph: {
    title: '关于我们 - FastDocument',
    description: '了解FastDocument团队，我们致力于打造最现代化文档协作平台。',
    url: 'https://fastdocument.com/about',
    siteName: 'FastDocument',
    locale: 'zh_CN',
    type: 'website',
    images: [
      {
        url: 'https://fastdocument.com/og-about.png',
        width: 1200,
        height: 630,
        alt: 'FastDocument团队',
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: '关于我们 - FastDocument',
    description: '了解FastDocument团队，我们致力于打造最现代化文档协作平台。',
    images: ['https://fastdocument.com/og-about.png'],
  },

  // 机器人设置
  robots: {
    index: true,           // 允许索引
    follow: true,          // 允许跟踪链接
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function AboutPage() {
  return (
    <div>
      <h1>关于我们</h1>
      <p>FastDocument是一个现代化文档协作平台...</p>
    </div>
  );
}
```

**动态Metadata：**

```typescript
// app/blog/[slug]/page.tsx
import type { Metadata } from 'next';

interface Props {
  params: { slug: string };
}

// 动态生成Metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.slug);

  if (!post) {
    return {
      title: '文章未找到',
    };
  }

  return {
    title: `${post.title} - FastDocument博客`,
    description: post.excerpt,
    authors: [{ name: post.author.name }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://fastdocument.com/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author.name],
      tags: post.tags,
      images: post.coverImage ? [
        {
          url: post.coverImage,
          width: 1200,
          height: 630,
          alt: post.title,
        }
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}
```

### 4.2 结构化数据JSON-LD

结构化数据帮助搜索引擎更好地理解页面内容，可以显著提升搜索结果的展示效果。

**JSON-LD实现：**

```typescript
// app/blog/[slug]/page.tsx
import { JsonLd } from '@/components/JsonLd';

interface Props {
  params: { slug: string };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPost(params.slug);

  if (!post) {
    return <div>文章不存在</div>;
  }

  // 文章结构化数据
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: post.author.name,
      url: `https://fastdocument.com/authors/${post.author.id}`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'FastDocument',
      logo: {
        '@type': 'ImageObject',
        url: 'https://fastdocument.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://fastdocument.com/blog/${post.slug}`,
    },
  };

  // 网站结构化数据
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'FastDocument',
    url: 'https://fastdocument.com',
    description: '现代化文档协作平台',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://fastdocument.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      {/* 注入JSON-LD */}
      <JsonLd jsonLd={articleJsonLd} />
      <JsonLd jsonLd={websiteJsonLd} />

      <article>
        <h1>{post.title}</h1>
        {/* 文章内容 */}
      </article>
    </>
  );
}

// JsonLd组件
function JsonLd({ jsonLd }: { jsonLd: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
```

### 4.3 Sitemap自动生成

Next.js支持自动生成sitemap.xml，便于搜索引擎爬取。

**动态Sitemap：**

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://fastdocument.com';

  // 获取所有文章
  const posts = await getAllPosts();
  const postUrls = posts.map(post => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: post.featured ? 0.8 : 0.6,
  }));

  // 获取所有页面
  const pages = [
    { slug: '', priority: 1, changefreq: 'daily' },
    { slug: 'about', priority: 0.5, changefreq: 'monthly' },
    { slug: 'blog', priority: 0.7, changefreq: 'daily' },
    { slug: 'pricing', priority: 0.6, changefreq: 'weekly' },
    { slug: 'contact', priority: 0.4, changefreq: 'yearly' },
  ];

  const pageUrls = pages.map(page => ({
    url: `${baseUrl}/${page.slug}`,
    lastModified: new Date(),
    changeFrequency: page.changefreq as any,
    priority: page.priority,
  }));

  // 获取所有产品（如果有）
  const products = await getAllProducts();
  const productUrls = products.map(product => ({
    url: `${baseUrl}/products/${product.id}`,
    lastModified: new Date(product.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...pageUrls, ...postUrls, ...productUrls];
}
```

### 4.4 robots.txt配置

```typescript
// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // 允许所有爬虫
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',           // 禁止API路由
          '/_next/',         // 禁止Next.js内部路由
          '/private/',       // 禁止私有目录
          '/admin/',         // 禁止管理后台
          '/dashboard?',    // 禁止仪表盘（可选）
        ],
      },
      {
        // Google爬虫特殊规则
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/private/'],
      },
    ],
    sitemap: [
      'https://fastdocument.com/sitemap.xml',
    ],
    // 爬虫慢速模式（可选）
    // crawlDelay: 1,
  };
}
```

### 4.5 Core Web Vitals优化

Core Web Vitals是Google定义的用于评估用户体验的关键指标，包括LCP、FID和CLS。

**Next.js中的性能优化：**

```typescript
// app/layout.tsx
// 优化LCP（最大内容绘制）

import { metadata } from 'next';
import { LCPImage } from '@/components/LCPImage';

export const metadata: Metadata = {
  // 预加载关键资源
  other: {
    'preload': '/fonts/main-font.woff2',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        {/* 预连接关键域名 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.fastdocument.com" />
      </head>
      <body>
        {/* LCP元素使用LCPImage组件 */}
        <LCPImage src="/hero-image.jpg" alt="Hero" priority />
        {children}
      </body>
    </html>
  );
}

// LCPImage组件 - 自动优化LCP
import Image from 'next/image';

function LCPImage({ src, alt, ...props }: ImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      priority  // 添加priority属性启用blur placeholder和预加载
      placeholder="blur"
      blurDataURL={props.blurDataURL || generateBlurDataURL(src)}
      {...props}
    />
  );
}
```

### 4.6 实战：SEO优化清单

```typescript
// 完整的SEO优化清单

/*
技术SEO清单：

1. 基础配置
   [x] title标签 - 每个页面唯一、包含关键词
   [x] meta description - 150-160字符、包含关键词
   [x] canonical URL - 避免重复内容
   [x] hreflang标签 - 多语言网站

2. Open Graph & Twitter Card
   [x] og:title, og:description, og:image
   [x] og:url, og:type, og:site_name
   [x] twitter:card, twitter:image

3. 结构化数据
   [x] Article结构化数据
   [x] BreadcrumbList面包屑
   [x] Organization网站信息
   [x] FAQPage常见问题（可选）

4. 技术细节
   [x] robots.txt - 正确配置
   [x] sitemap.xml - 自动生成
   [x] 页面加载速度 < 2.5秒
   [x] 移动端友好
   [x] HTTPS安全

5. 内容优化
   [x] 标题层级合理（H1-H6）
   [x] 图片alt属性
   [x] 内部链接结构
   [x] 外部链接nofollow（谨慎使用）
*/

// BreadcrumbList组件
function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
```

---

## 5. 性能优化指南

### 5.1 首屏加载优化

首屏加载性能直接影响用户体验和SEO效果。以下是优化首屏加载的核心策略。

**首屏优化策略：**

```typescript
// 1. 服务端组件优先
// app/layout.tsx

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // 服务端获取关键数据
  const navigation = await getNavigation();
  const user = await getCurrentUser();

  return (
    <html lang="zh-CN">
      <body>
        {/* 首屏内容立即渲染 */}
        <Navigation items={navigation} />
        <UserStatus user={user} />
        <main>{children}</main>
      </body>
    </html>
  );
}

// 2. 关键CSS内联
// app/layout.tsx

const criticalCSS = `
  body { margin: 0; font-family: system-ui, sans-serif; }
  .header { background: #fff; padding: 1rem; }
  .hero { min-height: 80vh; display: flex; align-items: center; }
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        {/* 内联关键CSS */}
        <style dangerouslySetInnerHTML={{ __html: criticalCSS }} />
      </head>
      <body>
        {children}
        {/* 非关键CSS异步加载 */}
        <link rel="stylesheet" href="/non-critical.css" media="print" onLoad="this.media='all'" />
      </body>
    </html>
  );
}

// 3. 字体优化
// 使用next/font自动优化字体加载
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',  // 使用swap显示策略
  variable: '--font-inter',
  preload: true,
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

### 5.2 TTFB优化

Time To First Byte（TTFB）是衡量服务器响应速度的关键指标。

**TTFB优化策略：**

```typescript
// 1. 使用边缘计算
// next.config.ts

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用边缘运行时
  experimental: {
    serverActions: {
      allowedOrigins: ['*'],
    },
  },

  // 静态页面启用CDN缓存
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

// 2. 静态生成优先
// app/blog/page.tsx

// 对于内容固定的页面使用SSG
export const revalidate = 3600; // 每小时重新验证一次

async function BlogPage() {
  const posts = await getPosts();
  return <PostList posts={posts} />;
}

// 3. 数据库查询优化
// lib/database.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// 使用连接池
export async function queryDatabase<T>(
  queryFn: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  return queryFn(prisma);
}
```

### 5.3 关键CSS内联

关键CSS内联可以显著减少首屏渲染阻塞。

**关键CSS策略：**

```typescript
// 关键CSS提取和内联

// 定义关键CSS（首屏必需）
const CRITICAL_CSS = `
  /* 重置和基础样式 */
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }

  /* 首屏布局 */
  .layout { display: flex; min-height: 100vh; flex-direction: column; }
  .header { height: 64px; background: #fff; border-bottom: 1px solid #eee; }
  .main { flex: 1; padding: 2rem; }
  .footer { padding: 1rem; background: #f5f5f5; text-align: center; }

  /* 首屏组件 */
  .hero { display: flex; align-items: center; justify-content: center; min-height: 60vh; }
  .hero-title { font-size: 3rem; font-weight: 700; margin-bottom: 1rem; }
  .hero-subtitle { font-size: 1.25rem; color: #666; }
`;

// 非关键CSS延迟加载
// components/NonCriticalStyles.tsx
function NonCriticalStyles() {
  return (
    <link
      rel="stylesheet"
      href="/styles/non-critical.css"
      media="print"
      onLoad={(e) => {
        // 加载完成后应用样式
        (e.target as HTMLLinkElement).media = 'all';
      }}
    />
  );
}

// AppLayout组件
export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="layout">
      <style dangerouslySetInnerHTML={{ __html: CRITICAL_CSS }} />
      <header className="header">
        <Logo />
        <Navigation />
      </header>
      <main className="main">{children}</main>
      <footer className="footer">
        <Footer />
      </footer>
      <NonCriticalStyles />
    </div>
  );
}
```

### 5.4 图片优化：next/image

next/image是Next.js提供的强大图片优化组件，可以自动处理图片格式、尺寸、懒加载等。

**next/image使用指南：**

```typescript
// app/blog/[slug]/page.tsx
import Image from 'next/image';

async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);

  return (
    <article>
      {/* 1. 基本使用 */}
      <Image
        src={post.author.avatar}
        alt={`${post.author.name}的头像`}
        width={48}
        height={48}
        className="rounded-full"
      />

      {/* 2. 响应式图片 */}
      <div className="relative w-full aspect-video">
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          priority  // LCP图片添加priority
        />
      </div>

      {/* 3. 多格式支持（自动转换WebP/AVIF） */}
      {/* Next.js会自动将图片转换为最佳格式 */}

      {/* 4. 模糊占位符 */}
      <Image
        src={post.thumbnail}
        alt={post.title}
        placeholder="blur"
        blurDataURL={post.blurDataURL}
        width={800}
        height={400}
      />

      {/* 5. 远处图片 */}
      <Image
        src="https://example.com/image.jpg"
        alt="Example"
        width={800}
        height={400}
        // 需要在next.config中配置域名
      />
    </article>
  );
}

// next.config.ts配置
const nextConfig = {
  images: {
    // 支持的图片格式
    formats: ['image/avif', 'image/webp'],  // AVIF优先级更高
    // 设备尺寸断点
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // 图片尺寸断点
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // 允许的域名
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'example.com',
        port: '',
        pathname: '/images/**',
      },
    ],
    // 图片域名（已废弃，推荐使用remotePatterns）
    domains: ['example.com'],
    // 最小缓存时间（秒）
    minimumCacheTTL: 60,
  },
};
```

### 5.5 字体优化：next/font

next/font可以自动优化字体加载，消除字体布局偏移（CLS）。

**next/font使用指南：**

```typescript
// app/layout.tsx
import { Inter, Noto_Sans_SC, Source_Code_Pro } from 'next/font/google';

// 主字体 - Inter用于英文
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',  // 字体交换策略
  variable: '--font-inter',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
});

// 中文字体 - Noto Sans SC
const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-noto-sans-sc',
  preload: true,
  weight: ['400', '500', '700'],
  fallback: ['"PingFang SC"', "Microsoft YaHei", "Heiti SC", "sans-serif"],
});

// 代码字体 - Source Code Pro
const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-code',
  preload: true,
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="zh-CN"
      className={`${inter.variable} ${notoSansSC.variable} ${sourceCodePro.variable}`}
    >
      <body className="font-sans">{children}</body>
    </html>
  );
}

// 使用字体变量
// styles/globals.css
:root {
  --font-inter: 'Inter', system-ui, sans-serif;
  --font-noto-sans-sc: 'Noto Sans SC', 'PingFang SC', sans-serif;
  --font-code: 'Source Code Pro', monospace;
}

body {
  font-family: var(--font-noto-sans-sc);
}

code, pre {
  font-family: var(--font-code);
}
```

### 5.6 Bundle分析

使用@next/bundle-analyzer分析JavaScript bundle大小。

**Bundle优化策略：**

```typescript
// next.config.js配置bundle分析
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 代码分割优化
  modularizeImports: {
    // 按需导入antd组件
    antd: {
      transform: 'antd/es/{{member}}',
    },
    // 按需导入lodash
    lodash: {
      transform: 'lodash-es/{{member}}',
    },
  },

  // 优化打包配置
  experimental: {
    optimizePackageImports: ['antd', '@ant-design/icons', 'lucide-react'],
  },
};

module.exports = withBundleAnalyzer(nextConfig);

// 分析脚本
// package.json
{
  "scripts": {
    "analyze": "ANALYZE=true next build",
    "analyze:server": "ANALYZE=true ANALYZE_SERVER=true next build",
    "analyze:browser": "ANALYZE=true ANALYZE_BROWSER=true next build"
  }
}
```

---

## 6. 实战：从CSR迁移到SSR

### 6.1 CSR应用分析

将现有CSR应用迁移到SSR需要系统性的分析和规划。

**迁移前分析清单：**

```typescript
/*
CSR到SSR迁移分析：

1. 组件分析
   [ ] 识别所有使用hooks的组件
   [ ] 识别所有使用浏览器API的组件
   [ ] 确定组件是否需要客户端交互

2. 数据获取分析
   [ ] 识别所有useEffect中的数据获取
   [ ] 识别所有API调用
   [ ] 确定数据是否需要在服务端获取

3. 状态管理分析
   [ ] 识别全局状态
   [ ] 确定状态持久化需求
   [ ] 分析状态是否需要客户端特有

4. 第三方库分析
   [ ] 检查库是否支持SSR
   [ ] 识别需要客户端特有的库
   [ ] 确定库的替代方案
*/

// CSR典型模式（需要迁移）
// components/UserProfile.tsx
"use client";

import { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        setLoading(true);
        const res = await fetch(`/api/users/${userId}`);
        const data = await res.json();
        setUser(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [userId]);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

### 6.2 迁移步骤与策略

**分阶段迁移策略：**

```typescript
// 第一阶段：识别并分离组件

/*
迁移步骤：

阶段1：组件分离
1. 创建服务端子组件
2. 创建客户端包装器
3. 保持现有功能

阶段2：数据迁移
1. 将useEffect中的fetch移到服务端
2. 使用服务端数据作为props传递
3. 保留客户端状态用于交互

阶段3：优化与清理
1. 移除不必要的水合
2. 优化Suspense边界
3. 添加错误边界
*/

// 阶段1：分离组件
// components/UserProfile.tsx

// 服务端子组件 - 负责数据获取和展示
// app/components/UserProfile.tsx
async function UserProfile({ userId }: { userId: string }) {
  // 直接在服务端获取数据
  const user = await getUser(userId);

  if (!user) {
    return <div>用户不存在</div>;
  }

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      {/* 客户端交互部分 */}
      <ClientFollowButton userId={userId} initialFollowing={user.isFollowing} />
    </div>
  );
}

// 客户端组件 - 只负责交互
// components/ClientFollowButton.tsx
"use client";

import { useState } from 'react';

function ClientFollowButton({
  userId,
  initialFollowing
}: {
  userId: string;
  initialFollowing: boolean;
}) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);

  const handleFollow = async () => {
    setIsFollowing(!isFollowing);
    await fetch(`/api/users/${userId}/follow`, { method: 'POST' });
  };

  return (
    <button onClick={handleFollow}>
      {isFollowing ? '取消关注' : '关注'}
    </button>
  );
}

// 阶段2：使用Server Actions
// app/actions.ts
"use server";

export async function followUser(userId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: '请先登录' };
  }

  await db.user.update({
    where: { id: currentUser.id },
    data: {
      following: {
        connect: { id: userId }
      }
    }
  });

  revalidatePath(`/users/${userId}`);
  return { success: true };
}

// 阶段3：完整迁移示例
// app/users/[id]/page.tsx
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getUser, getUserPosts, getUserStats } from '@/lib/data';
import { UserHeader } from '@/components/UserHeader';
import { UserPosts } from '@/components/UserPosts';
import { UserStats } from '@/components/UserStats';
import { FollowButton } from '@/components/FollowButton';
import { Skeleton } from '@/components/ui/Skeleton';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await getUser(params.id);

  if (!user) {
    return { title: '用户未找到' };
  }

  return {
    title: `${user.name} (@${user.username}) - FastDocument`,
    description: user.bio || `${user.name}的个人主页`,
    openGraph: {
      title: `${user.name} (@${user.username})`,
      description: user.bio || `${user.name}的个人主页`,
      images: user.avatar ? [user.avatar] : [],
    },
  };
}

async function UserPage({ params }: Props) {
  // 并行获取多个数据源
  const [user, posts, stats] = await Promise.all([
    getUser(params.id),
    getUserPosts(params.id),
    getUserStats(params.id),
  ]);

  if (!user) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* 用户信息头部 - 静态内容，服务端渲染 */}
      <UserHeader user={user} />

      {/* 关注按钮 - 客户端交互 */}
      <Suspense fallback={<Skeleton className="w-24 h-10" />}>
        <FollowButton userId={user.id} initialFollowing={user.isFollowing} />
      </Suspense>

      {/* 统计信息 - 静态展示 */}
      <UserStats stats={stats} />

      {/* 用户文章列表 - 流式加载 */}
      <Suspense fallback={<PostsSkeleton />}>
        <UserPosts posts={posts} />
      </Suspense>
    </div>
  );
}

function PostsSkeleton() {
  return (
    <div className="space-y-4 mt-8">
      {[1, 2, 3].map(i => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
  );
}
```

---

## 7. 实战：博客系统实现

### 7.1 完整博客系统实现

以下是一个完整的博客系统实现，包含文章列表、文章详情、评论系统等功能。

**目录结构：**

```typescript
/*
app/
├── blog/
│   ├── page.tsx              # 文章列表页
│   ├── loading.tsx           # 列表加载状态
│   ├── [slug]/
│   │   ├── page.tsx          # 文章详情页
│   │   └── loading.tsx       # 详情加载状态
│   └── new/
│       └── page.tsx          # 创建文章页
├── api/
│   ├── posts/
│   │   └── route.ts          # 文章API
│   └── comments/
│       └── route.ts          # 评论API
├── actions/
│   └── blog.ts               # Server Actions
└── components/
    ├── blog/
    │   ├── PostCard.tsx
    │   ├── PostContent.tsx
    │   ├── CommentSection.tsx
    │   └── CommentForm.tsx
    └── ui/
        ├── Button.tsx
        ├── Input.tsx
        └── Skeleton.tsx
*/
```

**文章列表页：**

```typescript
// app/blog/page.tsx
import { Suspense } from 'react';
import Link from 'next/link';
import { getAllPosts, getFeaturedPosts } from '@/lib/blog';
import { PostCard } from '@/components/blog/PostCard';
import { FeaturedPost } from '@/components/blog/FeaturedPost';
import { Skeleton } from '@/components/ui/Skeleton';

export const metadata = {
  title: '博客 - FastDocument',
  description: '阅读最新的技术文章、教程和见解。',
};

export default async function BlogPage() {
  // 并行获取数据
  const [posts, featuredPosts] = await Promise.all([
    getAllPosts({ limit: 20 }),
    getFeaturedPosts({ limit: 3 }),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* 页面标题 */}
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">博客</h1>
        <p className="text-xl text-gray-600">
          探索最新技术趋势，获取实用开发技巧
        </p>
      </header>

      {/* 精选文章 */}
      {featuredPosts.length > 0 && (
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">精选文章</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredPosts.map(post => (
              <FeaturedPost key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* 最新文章 */}
      <section>
        <h2 className="text-2xl font-bold mb-6">最新文章</h2>

        {/* 筛选标签 */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <Link
            href="/blog"
            className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            全部
          </Link>
          {['React', 'Next.js', 'TypeScript', 'Node.js', 'DevOps'].map(tag => (
            <Link
              key={tag}
              href={`/blog?tag=${tag}`}
              className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {tag}
            </Link>
          ))}
        </div>

        {/* 文章列表 - 流式加载 */}
        <Suspense fallback={<PostListSkeleton count={6} />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </Suspense>

        {/* 加载更多 */}
        {posts.length >= 20 && (
          <div className="text-center mt-12">
            <Link
              href="/blog?page=2"
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
            >
              加载更多
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

// 骨架屏组件
function PostListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border rounded-lg p-6 animate-pulse">
          <Skeleton className="h-48 w-full mb-4" />
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-2/3 mb-4" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

**文章详情页：**

```typescript
// app/blog/[slug]/page.tsx
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getPostBySlug, getAllPostSlugs, getRelatedPosts } from '@/lib/blog';
import { PostContent } from '@/components/blog/PostContent';
import { CommentSection } from '@/components/blog/CommentSection';
import { AuthorCard } from '@/components/blog/AuthorCard';
import { RelatedPosts } from '@/components/blog/RelatedPosts';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { Skeleton } from '@/components/ui/Skeleton';

interface Props {
  params: { slug: string };
}

// 生成静态路径（构建时预渲染）
export async function generateStaticParams() {
  const slugs = await getAllPostSlugs();
  return slugs.map(slug => ({ slug }));
}

// 动态生成Metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    return { title: '文章未找到' };
  }

  return {
    title: `${post.title} - FastDocument博客`,
    description: post.excerpt,
    authors: [{ name: post.author.name }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author.name],
      tags: post.tags,
      images: post.coverImage ? [{
        url: post.coverImage,
        width: 1200,
        height: 630,
        alt: post.title,
      }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}

// JSON-LD结构化数据
function ArticleJsonLd({ post }: { post: any }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: post.author.name,
      url: `https://fastdocument.com/users/${post.author.id}`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'FastDocument',
      logo: {
        '@type': 'ImageObject',
        url: 'https://fastdocument.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://fastdocument.com/blog/${post.slug}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  // 获取相关文章
  const relatedPosts = await getRelatedPosts(post.tags, post.id);

  return (
    <>
      <ArticleJsonLd post={post} />

      <article className="max-w-4xl mx-auto px-4 py-12">
        {/* 面包屑导航 */}
        <nav className="mb-6 text-sm">
          <Link href="/blog" className="text-teal-500 hover:underline">
            博客
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-500">{post.category}</span>
        </nav>

        {/* 文章头部 */}
        <header className="mb-8">
          {/* 标签 */}
          <div className="flex gap-2 mb-4">
            {post.tags.map(tag => (
              <Link
                key={tag}
                href={`/blog?tag=${tag}`}
                className="px-3 py-1 text-sm bg-teal-100 text-teal-700 rounded-full hover:bg-teal-200 transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>

          {/* 标题 */}
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            {post.title}
          </h1>

          {/* 元信息 */}
          <div className="flex items-center gap-4 text-gray-600">
            <Link href={`/users/${post.author.id}`} className="flex items-center gap-2">
              <Image
                src={post.author.avatar}
                alt={post.author.name}
                width={40}
                height={40}
                className="rounded-full"
              />
              <span className="font-medium">{post.author.name}</span>
            </Link>
            <span className="text-gray-400">|</span>
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            <span className="text-gray-400">|</span>
            <span>{post.readTime}分钟阅读</span>
          </div>
        </header>

        {/* 封面图 */}
        {post.coverImage && (
          <div className="relative w-full aspect-video mb-8 rounded-lg overflow-hidden">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 896px) 100vw, 896px"
            />
          </div>
        )}

        {/* 文章内容布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 侧边栏 - 目录 */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <TableOfContents headings={post.headings} />
            </div>
          </aside>

          {/* 主内容 */}
          <div className="lg:col-span-3">
            {/* 文章正文 */}
            <PostContent content={post.content} />

            {/* 点赞和分享 */}
            <div className="flex items-center justify-between py-6 border-y my-8">
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                  <span>👍</span>
                  <span>{post.likes}</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                  <span>🔖</span>
                  <span>收藏</span>
                </button>
              </div>

              {/* 分享按钮 */}
              <div className="flex items-center gap-2">
                <span className="text-gray-500">分享到：</span>
                <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200">𝕏</button>
                <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200">📘</button>
                <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200">🔗</button>
              </div>
            </div>

            {/* 作者信息 */}
            <AuthorCard author={post.author} />

            {/* 评论区 */}
            <Suspense fallback={<Skeleton className="h-64" />}>
              <CommentSection postId={post.id} />
            </Suspense>
          </div>
        </div>
      </article>

      {/* 相关文章 */}
      {relatedPosts.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 pb-12">
          <RelatedPosts posts={relatedPosts} />
        </section>
      )}
    </>
  );
}
```

**评论系统：**

```typescript
// components/blog/CommentSection.tsx
"use client";

import { useState, useOptimistic, useTransition } from 'react';
import { useActionState } from 'react';
import { submitComment, deleteComment } from '@/app/actions/blog';
import { formatDate } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Skeleton } from '@/components/ui/Skeleton';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  likes: number;
  replies?: Comment[];
}

interface CommentFormProps {
  postId: string;
  parentId?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
}

function CommentForm({ postId, parentId, onCancel, onSuccess }: CommentFormProps) {
  const [content, setContent] = useState('');
  const [state, formAction, isPending] = useActionState(
    submitComment,
    { success: false, error: null }
  );

  if (state.success) {
    setContent('');
    onSuccess?.();
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="postId" value={postId} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}

      <Textarea
        name="content"
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={parentId ? '回复评论...' : '写下你的评论...'}
        rows={parentId ? 2 : 4}
        required
        minLength={10}
      />

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            取消
          </Button>
        )}
        <Button type="submit" disabled={isPending || content.length < 10}>
          {isPending ? '提交中...' : '发表评论'}
        </Button>
      </div>

      {state.error && (
        <p className="text-red-500 text-sm">{state.error}</p>
      )}
    </form>
  );
}

interface CommentItemProps {
  comment: Comment;
  postId: string;
  onReply: (commentId: string) => void;
}

function CommentItem({ comment, postId, onReply }: CommentItemProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [optimisticLikes, addOptimisticLike] = useOptimistic(
    comment.likes,
    (likes: number) => likes + 1
  );

  const handleLike = async () => {
    setIsLiking(true);
    addOptimisticLike();
    try {
      await fetch(`/api/comments/${comment.id}/like`, { method: 'POST' });
    } catch {
      // 失败时乐观更新已应用
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className="py-4">
      <div className="flex gap-3">
        <Avatar src={comment.author.avatar} alt={comment.author.name} size="md" />

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">{comment.author.name}</span>
            <span className="text-gray-400 text-sm">
              {formatDate(comment.createdAt)}
            </span>
          </div>

          <p className="text-gray-700 mb-2">{comment.content}</p>

          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              disabled={isLiking}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
            >
              <span>👍</span>
              <span>{optimisticLikes}</span>
            </button>

            <button
              onClick={() => onReply(comment.id)}
              className="text-gray-500 hover:text-gray-700"
            >
              回复
            </button>
          </div>

          {/* 回复表单 */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 pl-4 border-l-2 border-gray-100 space-y-4">
              {comment.replies.map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  onReply={onReply}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface CommentSectionProps {
  postId: string;
  initialComments?: Comment[];
}

export function CommentSection({ postId, initialComments = [] }: CommentSectionProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId);
  };

  const handleReplySuccess = () => {
    setReplyingTo(null);
    // 刷新评论列表
    startTransition(() => {
      // 触发评论重新获取
    });
  };

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold mb-6">
        评论 ({initialComments.length})
      </h2>

      {/* 评论表单 */}
      <div className="mb-8">
        <CommentForm postId={postId} onSuccess={handleReplySuccess} />
      </div>

      {/* 评论列表 */}
      <div className="space-y-4">
        {initialComments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="mb-2">暂无评论</p>
            <p className="text-sm">成为第一个评论的人吧！</p>
          </div>
        ) : (
          initialComments.map(comment => (
            <div key={comment.id} className="border-b">
              <CommentItem
                comment={comment}
                postId={postId}
                onReply={handleReply}
              />

              {/* 回复表单 */}
              {replyingTo === comment.id && (
                <div className="pl-12 pb-4">
                  <CommentForm
                    postId={postId}
                    parentId={comment.id}
                    onCancel={() => setReplyingTo(null)}
                    onSuccess={handleReplySuccess}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 加载更多 */}
      {initialComments.length >= 10 && (
        <div className="text-center mt-8">
          <Button variant="outline">加载更多评论</Button>
        </div>
      )}
    </section>
  );
}
```

**Server Actions：**

```typescript
// app/actions/blog.ts
"use server";

import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/lib/database';
import { auth } from '@/lib/auth';

interface CommentActionState {
  success: boolean;
  error: string | null;
  comment?: any;
}

export async function submitComment(
  prevState: CommentActionState,
  formData: FormData
): Promise<CommentActionState> {
  // 验证用户登录
  const user = await auth();
  if (!user) {
    return { success: false, error: '请先登录后再评论' };
  }

  const content = formData.get('content') as string;
  const postId = formData.get('postId') as string;
  const parentId = formData.get('parentId') as string | null;

  // 验证内容
  if (!content || content.trim().length < 10) {
    return { success: false, error: '评论内容至少需要10个字符' };
  }

  if (content.length > 2000) {
    return { success: false, error: '评论内容不能超过2000个字符' };
  }

  try {
    // 创建评论
    const comment = await db.comment.create({
      data: {
        content: content.trim(),
        postId,
        authorId: user.id,
        parentId: parentId || null,
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    // 使评论缓存失效
    revalidateTag(`comments-${postId}`);
    revalidatePath(`/blog/${postSlug}`);

    return { success: true, error: null, comment };
  } catch (error) {
    console.error('创建评论失败:', error);
    return { success: false, error: '评论发表失败，请稍后重试' };
  }
}

export async function deleteComment(
  commentId: string,
  postId: string
): Promise<{ success: boolean; error: string | null }> {
  const user = await auth();
  if (!user) {
    return { success: false, error: '请先登录' };
  }

  const comment = await db.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true },
  });

  if (!comment) {
    return { success: false, error: '评论不存在' };
  }

  if (comment.authorId !== user.id && user.role !== 'admin') {
    return { success: false, error: '无权删除此评论' };
  }

  try {
    await db.comment.delete({ where: { id: commentId } });
    revalidateTag(`comments-${postId}`);
    return { success: true, error: null };
  } catch {
    return { success: false, error: '删除失败' };
  }
}
```

---

## 8. 面试高频问题

### 问题1：SSR和CSR的区别？如何选择？

**答案：**

| 特性 | SSR | CSR |
|------|-----|-----|
| 首屏渲染 | 快（HTML直接显示） | 慢（需下载JS后渲染） |
| SEO | 友好 | 不友好 |
| 服务器负载 | 高 | 低 |
| TTFB | 较慢 | 快 |
| 交互性 | 需水合 | 直接可用 |
| 适用场景 | 博客、电商、内容站 | 登录后页面、Dashboard |

**选择建议：**
- 需要SEO的页面使用SSR
- 高度交互的页面使用CSR
- 混合场景使用App Router的RSC模式

### 问题2：什么是水合（Hydration）？

**答案：** 水合是React在客户端重新接管服务端渲染的HTML的过程。流程如下：

1. 服务端执行React组件，生成HTML
2. 浏览器显示HTML（用户看到内容）
3. React下载并执行JavaScript
4. React遍历已有DOM，构建虚拟DOM
5. 绑定事件处理器，使页面可交互

### 问题3：如何避免水合不匹配？

**答案：** 常见问题和解决方案：

1. **时间相关**：使用`useEffect`在客户端渲染
```typescript
// 错误
return <div>{new Date().toLocaleString()}</div>;

// 正确
const [time, setTime] = useState('');
useEffect(() => {
  setTime(new Date().toLocaleString());
}, []);
return <div>{time || '加载中...'}</div>;
```

2. **浏览器API**：条件渲染
```typescript
// 错误
return <div>{window.innerWidth}</div>;

// 正确
const [width, setWidth] = useState(0);
useEffect(() => {
  setWidth(window.innerWidth);
}, []);
return <div>{width}</div>;
```

3. **随机数**：使用固定值或客户端生成

### 问题4：Next.js App Router和Pages Router的区别？

**答案：**

| 特性 | App Router | Pages Router |
|------|------------|--------------|
| 组件默认位置 | 服务端 | 客户端 |
| 数据获取 | fetch/async | getServerSideProps |
| 布局 | 嵌套布局 | 单一_app.tsx |
| 加载状态 | loading.tsx | 自定义 |
| 错误处理 | error.tsx | _error.tsx |
| API | Server Actions | API Routes |

### 问题5：什么是ISR？适用场景？

**答案：** ISR是增量静态再生，允许在运行时按需重新生成静态页面。

**适用场景：**
- 内容更新频率适中的页面
- 产品列表页
- 用户量大的内容站
- 需要SSG性能但内容需要更新的场景

### 问题6：如何优化Core Web Vitals？

**答案：** Core Web Vitals包括LCP、FID、CLS。

**LCP优化：**
- 使用`next/image`添加`priority`属性
- 预加载关键资源
- 使用`next/font`优化字体加载

**CLS优化：**
- 为图片指定宽高
- 使用`next/font`的`display: swap`
- 避免动态插入内容

**FID优化：**
- 代码分割
- 减少主线程工作
- 使用Web Worker处理计算密集任务

---

## 附录：配置参考

### next.config.ts配置示例

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 基础配置
  reactStrictMode: true,
  poweredByHeader: false,

  // 压缩优化
  compress: true,

  // 图片优化
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.fastdocument.com',
      },
    ],
  },

  // 实验性功能
  experimental: {
    optimizePackageImports: ['antd', '@ant-design/icons', 'lucide-react'],
  },

  // 编译器优化
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // 头部优化
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },

  // 导出配置
  output: 'standalone',
};

export default nextConfig;
```

---

*本文档最后更新于 2026年4月*
