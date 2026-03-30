# SSG静态站点生成与ISR增量静态再生

## 目录

1. [SSG概述](#1-ssg概述)
2. [Next.js SSG实现](#2-nextjs-ssg实现)
3. [ISR增量静态再生](#3-isr增量静态再生)
4. [SSG vs SSR vs ISR对比](#4-ssg-vs-ssr-vs-isr对比)
5. [实战案例](#5-实战案例)
6. [面试高频问题](#6-面试高频问题)

---

## 1. SSG概述

### 1.1 什么是SSG？

SSG（Static Site Generation，静态站点生成）是在构建时将页面预渲染为静态HTML文件的技术。用户访问时直接返回预生成的HTML，无需服务器实时渲染。

### 1.2 SSG工作原理

```
┌─────────────────────────────────────────────────────────────┐
│                     SSG工作原理                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  构建时                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │   数据源 ──► 模板渲染 ──► 生成静态HTML文件          │   │
│  │                                                     │   │
│  │   /posts/1.html                                    │   │
│  │   /posts/2.html                                    │   │
│  │   /posts/3.html                                    │   │
│  │   ...                                              │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                   │
│                         ▼                                   │
│  部署到CDN                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │   CDN边缘节点                                       │   │
│  │   ├── 北京节点                                      │   │
│  │   ├── 上海节点                                      │   │
│  │   └── 广州节点                                      │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                   │
│                         ▼                                   │
│  用户访问                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │   用户请求 ──► CDN直接返回HTML ──► 极速响应         │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 SSG的优势与局限

```typescript
// SSG优势与局限

interface SSGProsCons {
  pros: string[];
  cons: string[];
  suitable: string[];
  notSuitable: string[];
}

const ssgAnalysis: SSGProsCons = {
  pros: [
    '极快的响应速度（CDN直接返回）',
    '低服务器成本（无需运行时渲染）',
    '优秀的SEO（完整的HTML内容）',
    '高安全性（无服务器端代码执行）',
    '高可用性（静态文件不会崩溃）',
  ],
  cons: [
    '构建时间长（页面多时）',
    '内容更新需要重新构建',
    '不适合动态内容',
    '个性化内容难以实现',
  ],
  suitable: [
    '博客和文档站点',
    '营销页面',
    '产品展示页',
    '新闻资讯站',
    '个人作品集',
  ],
  notSuitable: [
    '实时数据仪表盘',
    '社交网络',
    '电商购物车',
    '用户个性化页面',
    '实时协作应用',
  ],
};
```

---

## 2. Next.js SSG实现

### 2.1 静态页面生成

```typescript
// Next.js App Router SSG实现

// app/page.tsx - 静态页面
// 默认就是静态生成的

async function HomePage() {
  // 在构建时获取数据
  const posts = await getPosts();

  return (
    <main>
      <h1>博客文章</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={`/posts/${post.slug}`}>
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

// 强制静态生成
export const dynamic = 'force-static';

// 或者使用 generateStaticParams 预生成动态路由

// app/posts/[slug]/page.tsx

interface PageProps {
  params: { slug: string };
}

// 生成静态参数
export async function generateStaticParams() {
  const posts = await getPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// 页面组件
async function PostPage({ params }: PageProps) {
  const post = await getPost(params.slug);

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}

// 生成元数据
export async function generateMetadata({ params }: PageProps) {
  const post = await getPost(params.slug);

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  };
}
```

### 2.2 数据获取策略

```typescript
// Next.js数据获取策略

// 1. 静态数据获取（默认）
async function StaticDataPage() {
  // 默认缓存: 'force-cache'
  const data = await fetch('https://api.example.com/data');

  return <div>{data}</div>;
}

// 2. 禁用缓存
async function NoCachePage() {
  const data = await fetch('https://api.example.com/data', {
    cache: 'no-store', // 每次请求都重新获取
  });

  return <div>{data}</div>;
}

// 3. 定时重新验证（ISR）
async function RevalidatePage() {
  const data = await fetch('https://api.example.com/data', {
    next: { revalidate: 60 }, // 60秒后重新验证
  });

  return <div>{data}</div>;
}

// 4. 页面级重新验证
export const revalidate = 3600; // 1小时

async function Page() {
  const data = await fetch('https://api.example.com/data');

  return <div>{data}</div>;
}

// 5. 按需重新验证
import { revalidatePath, revalidateTag } from 'next/cache';

// API路由中触发重新验证
// app/api/revalidate/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path');

  if (path) {
    // 重新验证指定路径
    revalidatePath(path);
    return NextResponse.json({ revalidated: true, now: Date.now() });
  }

  // 重新验证指定标签
  revalidateTag('posts');
  return NextResponse.json({ revalidated: true, now: Date.now() });
}

// 使用标签获取数据
async function PostsPage() {
  const posts = await fetch('https://api.example.com/posts', {
    next: { tags: ['posts'] }, // 添加标签
  });

  return <div>{posts}</div>;
}
```

### 2.3 generateStaticParams详解

```typescript
// generateStaticParams详解

// app/products/[category]/[id]/page.tsx

interface PageProps {
  params: {
    category: string;
    id: string;
  };
}

// 生成所有可能的静态参数
export async function generateStaticParams() {
  // 获取所有分类
  const categories = await getCategories();

  const params = [];

  for (const category of categories) {
    // 获取每个分类下的产品
    const products = await getProductsByCategory(category.slug);

    for (const product of products) {
      params.push({
        category: category.slug,
        id: product.id,
      });
    }
  }

  return params;
}

// 页面组件
async function ProductPage({ params }: PageProps) {
  const product = await getProduct(params.category, params.id);

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p>价格: ¥{product.price}</p>
    </div>
  );
}

// 配置
export const dynamicParams = true; // 允许动态生成未预渲染的页面（默认true）

// 分页示例
// app/blog/page/[page]/page.tsx

export async function generateStaticParams() {
  const totalPages = await getTotalPages();

  return Array.from({ length: totalPages }, (_, i) => ({
    page: String(i + 1),
  }));
}

async function BlogPage({ params }: { params: { page: string } }) {
  const page = parseInt(params.page);
  const posts = await getPostsByPage(page);

  return (
    <div>
      {posts.map((post) => (
        <article key={post.id}>{post.title}</article>
      ))}
      <Pagination currentPage={page} />
    </div>
  );
}
```

---

## 3. ISR增量静态再生

### 3.1 ISR原理

```
┌─────────────────────────────────────────────────────────────┐
│                     ISR工作原理                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  时间线                                                     │
│                                                             │
│  T0: 构建时                                                 │
│  ├── 生成静态页面 A (version 1)                             │
│  └── 部署到CDN                                              │
│                                                             │
│  T1: 用户首次访问 (revalidate = 60s)                        │
│  ├── CDN返回页面 A (version 1)                              │
│  └── 检查是否过期 (未过期)                                  │
│                                                             │
│  T2: 60秒后用户访问                                         │
│  ├── CDN返回页面 A (version 1)                              │
│  ├── 检查是否过期 (已过期)                                  │
│  ├── 触发后台重新生成                                       │
│  └── 用户仍看到旧版本                                       │
│                                                             │
│  T3: 重新生成完成                                           │
│  ├── 新页面 A (version 2) 替换旧版本                        │
│  └── 后续用户看到新版本                                     │
│                                                             │
│  T4: 下一个用户访问                                         │
│  └── CDN返回页面 A (version 2)                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Next.js ISR实现

```typescript
// Next.js ISR实现

// 1. 基于时间的ISR
// app/posts/[slug]/page.tsx

interface PageProps {
  params: { slug: string };
}

// 页面级重新验证
export const revalidate = 60; // 60秒

async function PostPage({ params }: PageProps) {
  const post = await getPost(params.slug);

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
      <small>最后更新: {post.updatedAt}</small>
    </article>
  );
}

// 生成静态参数
export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

// 2. 基于请求的ISR
async function ProductPage({ params }: { params: { id: string } }) {
  const product = await fetch(`/api/products/${params.id}`, {
    next: {
      revalidate: 3600, // 1小时
      tags: [`product-${params.id}`], // 标签
    },
  }).then((res) => res.json());

  return (
    <div>
      <h1>{product.name}</h1>
      <p>价格: ¥{product.price}</p>
    </div>
  );
}

// 3. 按需重新验证
// app/api/revalidate/route.ts

import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { path, tag, secret } = body;

  // 验证密钥
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  try {
    if (path) {
      // 重新验证路径
      revalidatePath(path);
      return NextResponse.json({ revalidated: true, path });
    }

    if (tag) {
      // 重新验证标签
      revalidateTag(tag);
      return NextResponse.json({ revalidated: true, tag });
    }

    return NextResponse.json({ error: 'Missing path or tag' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: 'Error revalidating' }, { status: 500 });
  }
}

// 4. Webhook触发重新验证
// 当CMS内容更新时，调用webhook触发重新验证

// 外部服务调用示例
async function triggerRevalidate(slug: string) {
  await fetch('https://your-site.com/api/revalidate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path: `/posts/${slug}`,
      secret: process.env.REVALIDATE_SECRET,
    }),
  });
}

// 5. ISR与动态路由结合
// app/products/[id]/page.tsx

export const revalidate = 3600; // 1小时

export async function generateStaticParams() {
  // 只预生成热门产品
  const popularProducts = await getPopularProducts(100);

  return popularProducts.map((product) => ({
    id: product.id,
  }));
}

// 允许动态生成其他产品页面
export const dynamicParams = true;

async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);

  if (!product) {
    notFound();
  }

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
    </div>
  );
}
```

### 3.3 ISR最佳实践

```typescript
// ISR最佳实践

// 1. 合理设置revalidate时间
const REVALIDATE_TIMES = {
  // 高频更新内容
  news: 60, // 1分钟
  stock: 5, // 5秒

  // 中频更新内容
  blog: 3600, // 1小时
  product: 1800, // 30分钟

  // 低频更新内容
  docs: 86400, // 1天
  about: 604800, // 1周
};

// 2. 使用标签进行精细控制
// app/lib/cache.ts

export const CACHE_TAGS = {
  posts: 'posts',
  post: (slug: string) => `post-${slug}`,
  products: 'products',
  product: (id: string) => `product-${id}`,
} as const;

// 使用标签
async function PostPage({ params }: { params: { slug: string } }) {
  const post = await fetch(`/api/posts/${params.slug}`, {
    next: {
      revalidate: 3600,
      tags: [CACHE_TAGS.post(params.slug)],
    },
  }).then((res) => res.json());

  return <article>{post.title}</article>;
}

// 3. 错误处理
async function SafePage() {
  try {
    const data = await fetch('/api/data', {
      next: { revalidate: 60 },
    });

    if (!data.ok) {
      throw new Error('Failed to fetch');
    }

    return data.json();
  } catch (error) {
    // 返回缓存数据或默认数据
    return getDefaultData();
  }
}

// 4. 预览模式
import { draftMode } from 'next/headers';

async function PreviewPage({ params }: { params: { slug: string } }) {
  const { isEnabled } = draftMode();

  // 预览模式禁用缓存
  const post = await fetch(`/api/posts/${params.slug}`, {
    cache: isEnabled ? 'no-store' : 'force-cache',
  }).then((res) => res.json());

  return <article>{post.title}</article>;
}

// 启用预览模式
// app/api/preview/route.ts
import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const secret = searchParams.get('secret');

  if (secret !== process.env.PREVIEW_SECRET) {
    return new Response('Invalid secret', { status: 401 });
  }

  draftMode().enable();
  redirect(`/posts/${slug}`);
}

// 禁用预览模式
// app/api/disable-preview/route.ts
export async function GET() {
  draftMode().disable();
  redirect('/');
}
```

---

## 4. SSG vs SSR vs ISR对比

### 4.1 渲染策略对比

```typescript
// 渲染策略对比

interface RenderStrategy {
  name: string;
  renderTime: string;
  cache: string;
  ttfb: string;
  freshness: string;
  serverLoad: string;
  useCase: string[];
}

const strategies: RenderStrategy[] = [
  {
    name: 'SSG',
    renderTime: '构建时',
    cache: 'CDN缓存',
    ttfb: '极快',
    freshness: '低',
    serverLoad: '无',
    useCase: ['博客', '文档', '营销页'],
  },
  {
    name: 'SSR',
    renderTime: '请求时',
    cache: '无/服务器缓存',
    ttfb: '较慢',
    freshness: '高',
    serverLoad: '高',
    useCase: ['仪表盘', '社交网络', '实时数据'],
  },
  {
    name: 'ISR',
    renderTime: '构建时+定时更新',
    cache: 'CDN缓存',
    ttfb: '快',
    freshness: '中',
    serverLoad: '低',
    useCase: ['电商', '新闻', '博客'],
  },
  {
    name: 'CSR',
    renderTime: '客户端',
    cache: '浏览器缓存',
    ttfb: '慢',
    freshness: '高',
    serverLoad: '无',
    useCase: ['SPA', '后台管理', '工具应用'],
  },
];
```

### 4.2 选择指南

```typescript
// 渲染策略选择指南

function selectRenderStrategy(requirements: {
  contentFreshness: 'realtime' | 'frequent' | 'occasional' | 'rare';
  seoRequired: boolean;
  trafficVolume: 'high' | 'medium' | 'low';
  personalization: boolean;
}): string {
  // 实时数据 + 无SEO需求
  if (requirements.contentFreshness === 'realtime' && !requirements.seoRequired) {
    return 'CSR';
  }

  // 实时数据 + SEO需求
  if (requirements.contentFreshness === 'realtime') {
    return 'SSR';
  }

  // 频繁更新 + 高流量
  if (requirements.contentFreshness === 'frequent' && requirements.trafficVolume === 'high') {
    return 'ISR';
  }

  // 个性化内容
  if (requirements.personalization) {
    return 'SSR + CSR混合';
  }

  // 偶尔更新或很少更新
  if (requirements.contentFreshness === 'occasional' || requirements.contentFreshness === 'rare') {
    return 'SSG';
  }

  // 默认
  return 'ISR';
}

// 混合渲染示例
// app/page.tsx - 静态部分
function HomePage() {
  return (
    <div>
      {/* 静态内容 */}
      <Header />
      <HeroSection />

      {/* 动态内容 */}
      <Suspense fallback={<Skeleton />}>
        <RecommendedProducts />
      </Suspense>

      {/* 静态内容 */}
      <Footer />
    </div>
  );
}

// 推荐产品 - 动态渲染
async function RecommendedProducts() {
  const products = await getRecommendedProducts(); // 动态获取

  return (
    <div>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

---

## 5. 实战案例

### 5.1 博客系统

```typescript
// 博客系统SSG/ISR实现

// app/blog/page.tsx - 博客列表页
export const revalidate = 600; // 10分钟

async function BlogPage() {
  const posts = await getPosts();

  return (
    <main>
      <h1>博客文章</h1>
      <div className="grid">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </main>
  );
}

// app/blog/[slug]/page.tsx - 博客详情页
interface PageProps {
  params: { slug: string };
}

export const revalidate = 3600; // 1小时

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

async function BlogPostPage({ params }: PageProps) {
  const post = await getPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="prose">
      <h1>{post.title}</h1>
      <div className="meta">
        <span>{post.author}</span>
        <span>{formatDate(post.publishedAt)}</span>
      </div>
      <Content html={post.content} />
      <AuthorBio author={post.author} />
      <RelatedPosts postId={post.id} />
    </article>
  );
}

// app/api/revalidate/route.ts - Webhook触发更新
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { slug, secret } = body;

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 重新验证列表页
  revalidatePath('/blog');

  // 重新验证文章详情页
  if (slug) {
    revalidatePath(`/blog/${slug}`);
  }

  return NextResponse.json({ success: true });
}
```

### 5.2 电商产品页

```typescript
// 电商产品页ISR实现

// app/products/[id]/page.tsx

interface PageProps {
  params: { id: string };
}

// 30分钟重新验证
export const revalidate = 1800;

// 预生成热门产品
export async function generateStaticParams() {
  const popularProducts = await getPopularProducts(500);

  return popularProducts.map((product) => ({
    id: product.id,
  }));
}

// 允许动态生成其他产品
export const dynamicParams = true;

async function ProductPage({ params }: PageProps) {
  // 并行获取产品数据和库存
  const [product, inventory] = await Promise.all([
    getProduct(params.id),
    getInventory(params.id),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="product-page">
      {/* 产品图片 */}
      <ProductGallery images={product.images} />

      {/* 产品信息 */}
      <div className="product-info">
        <h1>{product.name}</h1>
        <p className="price">¥{product.price}</p>
        <p className="description">{product.description}</p>

        {/* 库存状态 - 动态数据 */}
        <InventoryStatus inventory={inventory} />

        {/* 加入购物车 */}
        <AddToCart productId={product.id} />
      </div>

      {/* 相关产品 */}
      <Suspense fallback={<Skeleton />}>
        <RelatedProducts productId={product.id} />
      </Suspense>
    </div>
  );
}

// 库存状态组件 - 客户端动态获取
'use client';

function InventoryStatus({ inventory }: { inventory: Inventory }) {
  const [currentInventory, setCurrentInventory] = useState(inventory);

  useEffect(() => {
    // 定期更新库存
    const interval = setInterval(async () => {
      const newInventory = await fetchInventory();
      setCurrentInventory(newInventory);
    }, 30000); // 30秒更新一次

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="inventory">
      {currentInventory.stock > 0 ? (
        <span className="in-stock">有货 ({currentInventory.stock}件)</span>
      ) : (
        <span className="out-of-stock">缺货</span>
      )}
    </div>
  );
}
```

---

## 6. 面试高频问题

### 问题1：SSG和SSR的区别？

**答案：**
| 方面 | SSG | SSR |
|------|-----|-----|
| 渲染时机 | 构建时 | 请求时 |
| 响应速度 | 极快 | 较慢 |
| 内容新鲜度 | 低 | 高 |
| 服务器负载 | 无 | 高 |
| 适用场景 | 静态内容 | 动态内容 |

### 问题2：什么是ISR？

**答案：** ISR（Incremental Static Regeneration）是增量静态再生，结合了SSG和SSR的优点：
1. 构建时预渲染页面
2. 设置重新验证时间
3. 过期后后台重新生成
4. 用户始终获得快速响应

### 问题3：如何选择渲染策略？

**答案：**
- **SSG**：内容很少变化，SEO重要
- **SSR**：内容实时更新，个性化内容
- **ISR**：内容定期更新，高流量
- **CSR**：无需SEO，高度交互

### 问题4：ISR的revalidate时间如何设置？

**答案：**
- 新闻资讯：1-5分钟
- 博客文章：1小时-1天
- 产品页面：30分钟-1小时
- 文档页面：1天-1周

### 问题5：如何触发ISR重新验证？

**答案：**
1. 基于时间：设置revalidate
2. 按需：使用revalidatePath/revalidateTag
3. Webhook：CMS更新时调用API

---

## 7. 最佳实践总结

### 7.1 SSG/ISR清单

- [ ] 合理选择渲染策略
- [ ] 设置适当的revalidate时间
- [ ] 使用generateStaticParams预生成
- [ ] 实现按需重新验证
- [ ] 处理404和错误页面
- [ ] 优化构建时间
- [ ] 监控缓存命中率

### 7.2 常见问题解决

| 问题 | 解决方案 |
|------|----------|
| 构建时间长 | 分批预生成、增量构建 |
| 内容不更新 | 检查revalidate设置 |
| 404页面 | 配置dynamicParams |
| 内存溢出 | 优化数据获取 |

---

*本文档最后更新于 2026年3月*