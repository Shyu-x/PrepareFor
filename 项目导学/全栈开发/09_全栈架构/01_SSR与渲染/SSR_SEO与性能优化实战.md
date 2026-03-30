# SSR SEO与性能优化实战

## 概述

服务端渲染（Server-Side Rendering，SSR）是一种将网页内容在服务器端生成HTML的技术，相比传统的客户端渲染（CSR），SSR能够让搜索引擎爬虫直接抓取到完整的页面内容，从而显著提升SEO效果。同时，SSR也是优化Core Web Vitals核心性能指标的重要手段。

本文将从SEO优化、Core Web Vitals优化、缓存策略三个维度，深入讲解SSR应用中的性能优化实战技巧，帮助开发者构建既满足搜索引擎友好、又具备卓越用户体验的高性能全栈应用。

## 一、SSR SEO优化

### 1.1 Meta标签体系

Meta标签是搜索引擎了解网页内容的第一窗口，合理的Meta标签设置能够让网页在搜索结果中获得更好的展示效果。

#### 1.1.1 基础Meta标签

```typescript
// Next.js 16 Metadata API - 基础Meta标签设置
import { Metadata } from 'next';

// 静态Metadata - 适用于固定页面
export const metadata: Metadata = {
  title: 'FastDocument - 现代化文档协作平台',
  description: 'FastDocument是一款支持实时协作、原子化编辑、视频会议的现代化文档协作平台。',
  keywords: ['文档协作', '实时编辑', '团队协作', '在线文档', '项目管理'],
  authors: [{ name: 'FastDocument Team' }],
  creator: 'FastDocument',
  publisher: 'FastDocument Inc.',
  robots: {
    index: true,           // 允许被索引
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

// 动态Metadata - 适用于动态页面
interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const document = await fetchDocumentById(id);

  if (!document) {
    return {
      title: '文档未找到 - FastDocument',
    };
  }

  return {
    title: `${document.title} - FastDocument`,
    description: document.summary || `查看 ${document.title} 的详细内容`,
    openGraph: {
      title: document.title,
      description: document.summary,
      type: 'article',
      publishedTime: document.createdAt,
      modifiedTime: document.updatedAt,
      authors: document.authors,
      tags: document.tags,
    },
  };
}
```

#### 1.1.2 Open Graph社交标签

Open Graph协议允许网页在社交媒体分享时展示富媒体预览，是现代社交传播不可或缺的技术。

```typescript
// Open Graph完整配置
export const metadata: Metadata = {
  // 基础信息
  title: '使用Next.js构建高性能应用',
  description: '深入讲解Next.js服务端渲染、性能优化与SEO最佳实践',

  // Open Graph标签
  openGraph: {
    // 基础配置
    type: 'website',                    // 或 'article'、'video'、'product'
    locale: 'zh_CN',                    // 语言区域
    alternateLocale: ['en_US'],        // 备用语言
    url: 'https://example.com/blog/nextjs-performance',
    siteName: '全栈开发指南',

    // 图片配置 - 社交分享时的预览图
    images: [
      {
        url: '/og-image.jpg',           // 图片URL
        width: 1200,                    // 推荐尺寸：1200x630
        height: 630,
        alt: 'Next.js性能优化指南封面图',
        type: 'image/jpeg',
      },
      {
        url: '/og-image-mobile.jpg',    // 移动端专用图片
        width: 300,
        height: 157,
        media: '(max-width: 700px)',
      },
    ],

    // 音频配置
    audio: {
      url: '/podcast-intro.mp3',
      secureUrl: 'https://cdn.example.com/podcast-intro.mp3',
      type: 'audio/mpeg',
    },

    // 视频配置
    videos: [
      {
        url: 'https://youtube.com/watch?v=example',
        width: 640,
        height: 360,
      },
    ],

    // 文章类型页面的额外信息
    ...(isArticle && {
      publishedTime: '2026-03-18T08:00:00Z',
      modifiedTime: '2026-03-18T10:30:00Z',
      expirationTime: '2027-03-18T08:00:00Z',
      authors: ['https://example.com/authors/zhangsan'],
      tags: ['Next.js', 'SSR', 'SEO'],
    }),
  },

  // Twitter Cards标签
  twitter: {
    card: 'summary_large_image',        // summary | summary_large_image | app | player
    site: '@exampleaccount',            // 网站官方账号
    creator: '@authoraccount',           // 作者账号
    title: '使用Next.js构建高性能应用',
    description: '深入讲解Next.js服务端渲染、性能优化与SEO最佳实践',
    images: ['/twitter-image.jpg'],
    player: 'https://www.youtube.com/embed/VIDEO_ID',
    playerWidth: 640,
    playerHeight: 360,
  },
};
```

#### 1.1.3 语义化HTML结构

语义化HTML不仅提升可访问性，也是搜索引擎理解页面内容结构的关键。

```tsx
// 完整的语义化HTML结构示例
export default function ArticlePage({ article }: { article: Article }) {
  return (
    <>
      {/* 跳转到主内容区的链接 - 提升可访问性 */}
      <a href="#main-content" className="skip-link">
        跳转到主要内容
      </a>

      {/* 页头区域 - 包含导航和Logo */}
      <header className="site-header">
        <nav aria-label="主导航">
          <ul>
            <li><Link href="/">首页</Link></li>
            <li><Link href="/blog">博客</Link></li>
            <li><Link href="/about">关于我们</Link></li>
          </ul>
        </nav>
      </header>

      {/* 主内容区域 - 使用main标签标识核心内容 */}
      <main id="main-content">
        {/* 文章内容 - 使用article标签 */}
        <article>
          {/* 文章头部 */}
          <header className="article-header">
            {/* 面包屑导航 - 帮助用户和搜索引擎理解位置 */}
            <nav aria-label="面包屑导航">
              <ol>
                <li><Link href="/">首页</Link></li>
                <li><Link href="/blog">博客</Link></li>
                <li aria-current="page">{article.title}</li>
              </ol>
            </nav>

            {/* 文章标题 - 搜索引擎重视h1标签 */}
            <h1>{article.title}</h1>

            {/* 文章元信息 */}
            <div className="article-meta">
              <time dateTime={article.publishedAt}>
                发布于 {formatDate(article.publishedAt)}
              </time>
              <span>阅读时间: {article.readTime}分钟</span>
              <span>作者: {article.author}</span>
            </div>
          </header>

          {/* 文章正文 - 使用section划分内容区块 */}
          <section className="article-content">
            {article.sections.map((section, index) => (
              <section key={index}>
                <h2>{section.title}</h2>
                <p>{section.content}</p>
              </section>
            ))}
          </section>

          {/* 文章尾部 */}
          <footer className="article-footer">
            <div className="article-tags">
              {article.tags.map(tag => (
                <Link key={tag} href={`/tags/${tag}`}>
                  #{tag}
                </Link>
              ))}
            </div>

            {/* 相关文章推荐 */}
            <aside className="related-articles">
              <h2>相关推荐</h2>
              <ul>
                {article.relatedArticles.map(related => (
                  <li key={related.id}>
                    <Link href={`/blog/${related.slug}`}>
                      {related.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          </footer>
        </article>

        {/* 侧边栏 - 使用aside标签标识辅助内容 */}
        <aside className="sidebar">
          <nav aria-label="文章目录">
            <h2>文章目录</h2>
            <TableOfContents headings={article.headings} />
          </nav>

          {/* 关注我们 */}
          <div className="follow-us">
            <h2>关注我们</h2>
            <SocialLinks />
          </div>
        </aside>
      </main>

      {/* 页脚区域 */}
      <footer className="site-footer">
        <nav aria-label="页脚导航">
          <div className="footer-links">
            <section>
              <h3>产品</h3>
              <ul>
                <li><Link href="/features">功能介绍</Link></li>
                <li><Link href="/pricing">定价方案</Link></li>
                <li><Link href="/demo">在线演示</Link></li>
              </ul>
            </section>
            <section>
              <h3>资源</h3>
              <ul>
                <li><Link href="/docs">文档中心</Link></li>
                <li><Link href="/api">API文档</Link></li>
                <li><Link href="/blog">技术博客</Link></li>
              </ul>
            </section>
          </div>
        </nav>

        <div className="footer-bottom">
          <p>&copy; 2026 FastDocument. 保留所有权利.</p>
        </div>
      </footer>
    </>
  );
}
```

### 1.2 结构化数据

结构化数据（Schema.org）是一种让搜索引擎更深入理解页面内容的标记语言。正确使用结构化数据可以让页面在搜索结果中展示富媒体卡片。

#### 1.2.1 JSON-LD基础配置

```tsx
// Next.js中使用JSON-LD标记结构化数据
import { Metadata } from 'next';

export default async function ProductPage({ params }: Props) {
  const product = await getProduct(params.id);

  // 构建产品结构化数据
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images,
    description: product.description,
    sku: product.sku,
    mpn: product.mpn,
    brand: {
      '@type': 'Brand',
      name: product.brandName,
    },
    manufacturer: {
      '@type': 'Organization',
      name: product.manufacturer,
    },
    // 评分信息
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
    // 价格信息
    offers: {
      '@type': 'Offer',
      url: product.url,
      priceCurrency: 'CNY',
      price: product.price,
      priceValidUntil: product.priceValidUntil,
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'FastDocument Store',
      },
    },
  };

  return (
    <>
      {/* 在head中注入结构化数据脚本 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 页面内容... */}
    </>
  );
}
```

#### 1.2.2 文章结构化数据

```typescript
// 博客文章结构化数据
function createArticleJsonLd(article: Article) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,                    // 文章标题
    description: article.summary,               // 文章摘要
    image: article.coverImage,                  // 封面图
    author: {
      '@type': 'Person',
      name: article.author.name,
      url: article.author.profileUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: '全栈开发指南',
      logo: {
        '@type': 'ImageObject',
        url: 'https://example.com/logo.png',
      },
    },
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url,
    },
    // 文章类型
    articleSection: article.category,
    // 关键词
    keywords: article.tags.join(', '),
    // 字数统计
    wordCount: article.wordCount,
    // 推荐阅读时间
    timeRequired: `PT${article.readTime}M`,
  };
}
```

#### 1.2.3 面包屑结构化数据

```typescript
// 面包屑导航结构化数据
function createBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return breadcrumb;
}

// 使用示例
const breadcrumbItems = [
  { name: '首页', url: 'https://example.com/' },
  { name: '博客', url: 'https://example.com/blog' },
  { name: 'Next.js', url: 'https://example.com/blog/nextjs' },
  { name: 'SSR性能优化', url: 'https://example.com/blog/nextjs/ssr-optimization' },
];

// 在页面中注入面包屑JSON-LD
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(createBreadcrumbJsonLd(breadcrumbItems)),
  }}
/>
```

## 二、Core Web Vitals优化

Core Web Vitals是Google定义的核心性能指标，包括LCP（最大内容绘制）、CLS（累积布局偏移）和FID/INP（首次输入延迟/交互延迟）。这些指标直接影响用户体验和搜索排名。

### 2.1 LCP（Largest Contentful Paint）优化

LCP衡量的是页面主要内容加载完成的时间，目标是将LCP控制在2.5秒以内。

#### 2.1.1 图片优化策略

```tsx
import Image from 'next/image';

// 使用Next.js Image组件优化LCP
export default function HeroSection() {
  return (
    <section className="hero">
      {/* priority属性预加载首屏重要图片 */}
      <Image
        src="/hero-image.jpg"
        alt="产品展示图"
        width={1920}
        height={1080}
        priority           // 添加此属性会在head中生成预加载链接
        quality={85}      // 合理设置质量参数
        sizes="100vw"     // 配合srcset生成多尺寸图片
      />

      {/* 使用placeholder减少布局抖动 */}
      <Image
        src="/lazy-image.jpg"
        alt="延迟加载图片"
        width={800}
        height={600}
        placeholder="blur"     // 模糊占位
        blurDataURL={generateBlurPlaceholder()}  // 模糊图片的base64编码
      />
    </section>
  );
}

// 图片加载优化配置 - next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // 允许的图片来源域名
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.example.com',
        pathname: '/images/**',
      },
    ],
    // WebP和AVIF格式支持
    formats: ['image/avif', 'image/webp'],
    // 图片设备尺寸适配
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};
```

#### 2.1.2 字体加载优化

```tsx
// app/layout.tsx - 字体优化配置
import { Inter } from 'next/font/google';

// 使用next/font/google加载字体 - 自动优化
const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',              // 使用swap策略避免FOIT
  preload: true,                // 预加载字体
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
  variable: '--font-inter',      // CSS变量方式使用
});

// 或者使用本地字体文件
import localFont from 'next/font/local';

const myFont = localFont({
  src: [
    {
      path: './fonts/MyFont-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/MyFont-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  display: 'optional',          // 可选策略减少CLS
  variable: '--font-local',
  preload: true,
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${myFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

```css
/* 全局字体样式优化 */
:root {
  --font-inter: 'Inter', system-ui, sans-serif;
}

body {
  font-family: var(--font-inter);
  /* 预定义字体大小避免回退导致的布局偏移 */
  font-size: 16px;
  line-height: 1.5;
  letter-spacing: -0.01em;
}

/* 字体加载时的样式处理 */
@font-face {
  font-family: 'Inter';
  font-display: swap;           /* FOIT转FOUT */
  size-adjust: 100%;             /* 调整字体大小避免CLS */
  ascent-override: 90%;         /* 调整 ascent 值 */
  descent-override: 25%;
  line-gap-override: 0%;
}
```

#### 2.1.3 CSS和渲染优化

```tsx
// 使用Suspense实现流式SSR - 提升FCP
import { Suspense } from 'react';

// 关键内容优先加载
async function CriticalContent() {
  const data = await fetchCriticalData();
  return <CriticalSection data={data} />;
}

// 非关键内容延迟加载
async function NonCriticalContent() {
  const data = await fetchNonCriticalData();
  return <AnalyticsWidget data={data} />;
}

export default async function Page() {
  return (
    <>
      {/* 关键内容 - 同步渲染 */}
      <CriticalContent />

      {/* 非关键内容 - Suspense边界 */}
      <Suspense fallback={<LoadingSkeleton />}>
        <NonCriticalContent />
      </Suspense>
    </>
  );
}

// 使用服务端组件减少客户端JS - 提升LCP
// app/page.tsx - 服务端组件
export default async function HomePage() {
  // 直接在服务端获取数据
  const products = await getFeaturedProducts();
  const categories = await getCategories();

  return (
    <main>
      {/* 服务端渲染的内容会直接包含在HTML中 */}
      <HeroSection />

      {/* 产品列表 - 服务端渲染，无水合成本 */}
      <ProductGrid products={products} />

      {/* 分类导航 */}
      <CategoryNav categories={categories} />
    </main>
  );
}
```

### 2.2 CLS（Cumulative Layout Shift）优化

CLS衡量页面视觉稳定性，目标是将CLS控制在0.1以内。任何在视觉上造成内容意外移动的元素都会影响CLS分数。

#### 2.2.1 图片尺寸预留

```tsx
// 正确设置图片尺寸避免布局偏移
export default function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="article-card">
      {/* 必须设置宽高比或具体尺寸 */}
      <div className="image-container" style={{ aspectRatio: '16/9' }}>
        <Image
          src={article.thumbnail}
          alt={article.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          style={{ objectFit: 'cover' }}
        />
      </div>

      {/* 内容区域 */}
      <div className="content">
        <h3>{article.title}</h3>
        <p>{article.summary}</p>
      </div>
    </article>
  );
}

// CSS样式确保容器尺寸
.article-card {
  display: flex;
  flex-direction: column;
}

.image-container {
  position: relative;
  width: 100%;
  /* 防止图片加载前的布局抖动 */
  background-color: #f0f0f0;
}

.content {
  flex: 1;
  /* 最小高度防止内容区域抖动 */
  min-height: 100px;
}
```

#### 2.2.2 动态内容尺寸预留

```tsx
// 广告位和动态内容预留空间
export default function ArticlePage({ article }: { article: Article }) {
  return (
    <main className="article-layout">
      {/* 文章主体 */}
      <article className="article-main">
        <h1>{article.title}</h1>
        <div className="article-body">
          {article.sections.map(section => (
            <section key={section.id}>
              <h2>{section.title}</h2>
              <p>{section.content}</p>
            </section>
          ))}
        </div>
      </article>

      {/* 侧边栏 - 预留固定高度 */}
      <aside className="sidebar">
        {/* 推荐文章 - 固定高度容器 */}
        <div className="recommended-articles" style={{ minHeight: '400px' }}>
          <h2>推荐阅读</h2>
          <Suspense fallback={<ArticleSkeleton count={3} />}>
            <RecommendedArticles />
          </Suspense>
        </div>

        {/* 广告位 - 必须预留固定高度 */}
        <div className="ad-container" style={{ minHeight: '250px' }}>
          <Advertisement />
        </div>
      </aside>
    </main>
  );
}

// 骨架屏组件保持布局稳定
function ArticleSkeleton({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-item">
          <div className="skeleton-image" />
          <div className="skeleton-title" />
          <div className="skeleton-desc" />
        </div>
      ))}
    </>
  );
}
```

```css
/* 骨架屏样式 */
.skeleton-item {
  padding: 12px;
  margin-bottom: 12px;
}

.skeleton-image {
  width: 100%;
  height: 120px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

.skeleton-title {
  height: 20px;
  width: 80%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  margin-top: 8px;
  border-radius: 4px;
}

.skeleton-desc {
  height: 14px;
  width: 60%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  margin-top: 8px;
  border-radius: 4px;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

### 2.3 FID/INP（交互延迟）优化

FID/INP衡量页面响应用户交互的速度，目标是将FID控制在100毫秒以内，INP控制在200毫秒以内。

#### 2.3.1 JavaScript代码分割

```tsx
// 使用动态导入实现代码分割
import dynamic from 'next/dynamic';

// 非首屏组件使用动态导入
const AnalyticsDashboard = dynamic(
  () => import('@/components/AnalyticsDashboard'),
  {
    loading: () => <AnalyticsSkeleton />,
    ssr: false,  // 客户端组件不需要SSR
  }
);

const CommentSection = dynamic(
  () => import('@/components/CommentSection'),
  { ssr: false }
);

const ShareButtons = dynamic(
  () => import('@/components/ShareButtons'),
  { ssr: false }
);

// 使用示例
export default function BlogPost({ post }: { post: BlogPost }) {
  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />

      {/* 非关键交互组件延迟加载 */}
      <Suspense fallback={null}>
        <CommentSection postId={post.id} />
      </Suspense>

      <Suspense fallback={null}>
        <ShareButtons url={post.url} title={post.title} />
      </Suspense>
    </article>
  );
}
```

#### 2.3.2 长任务拆分

```typescript
// 将耗时操作拆分为小任务，避免阻塞主线程

// 使用requestIdleCallback调度非紧急任务
function scheduleNonUrgentWork() {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      performHeavyComputation();
    });
  } else {
    // fallback for Safari
    setTimeout(() => {
      performHeavyComputation();
    }, 100);
  }
}

// 使用Web Worker处理复杂计算
const workerCode = `
  self.onmessage = function(e) {
    const result = heavyComputation(e.data);
    self.postMessage(result);
  };

  function heavyComputation(data) {
    // 在Worker线程中执行复杂计算
    return data.map(item => expensiveOperation(item));
  }
`;

// 创建Worker
const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
const workerUrl = URL.createObjectURL(workerBlob);
const worker = new Worker(workerUrl);

worker.onmessage = (e) => {
  console.log('计算结果:', e.data);
};

// 发送数据到Worker处理
worker.postMessage(largeDataSet);

// 大数据处理分片
async function processLargeDataset(data: any[]) {
  const CHUNK_SIZE = 1000;
  const results: any[] = [];

  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    const chunkResult = await processChunk(chunk);
    results.push(...chunkResult);

    // 让出主线程，避免阻塞
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  return results;
}
```

## 三、缓存策略

合理的缓存策略能够显著提升SSR应用的性能，降低服务器负载，减少用户等待时间。

### 3.1 服务端缓存

#### 3.1.1 页面级缓存

```typescript
// Next.js中的页面缓存配置
// app/blog/[slug]/page.tsx

import { cache } from 'react';

// 使用cache函数缓存数据获取
const getPost = cache(async (slug: string) => {
  const post = await fetchPostBySlug(slug);
  return post;
});

// 使用revalidate设置缓存时间
export const revalidate = 3600;  // 每小时重新验证一次

// 或使用动态数据重新验证
export const dynamicParams = true;

// ISR - 增量静态再生成
export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <article>
      <h1>{post.title}</h1>
      {/* ... */}
    </article>
  );
}
```

#### 3.1.2 组件级缓存

```tsx
// 使用React的cache实现组件级缓存
import { cache, use, Suspense } from 'react';

// 缓存数据获取函数
const getUserData = cache(async (userId: string) => {
  const response = await fetch(`/api/users/${userId}`);
  return response.json();
});

const getUserPosts = cache(async (userId: string) => {
  const response = await fetch(`/api/users/${userId}/posts`);
  return response.json();
});

// 用户信息组件 - 使用缓存的数据
function UserProfile({ userId }: { userId: string }) {
  const userData = getUserData(userId);

  return (
    <div className="user-profile">
      <Avatar src={userData.avatar} alt={userData.name} />
      <h1>{userData.name}</h1>
      <p>{userData.bio}</p>
    </div>
  );
}

// 用户文章组件 - 同样使用缓存的数据
function UserPosts({ userId }: { userId: string }) {
  const posts = getUserPosts(userId);

  return (
    <div className="user-posts">
      <h2>最新文章</h2>
      {posts.map(post => (
        <article key={post.id}>
          <h3>{post.title}</h3>
          <p>{post.summary}</p>
        </article>
      ))}
    </div>
  );
}

// 页面组合 - 共享缓存
export default function UserPage({ params }: { params: { id: string } }) {
  return (
    <main>
      {/* 两个组件共享同一个userId，getUserData只会执行一次 */}
      <UserProfile userId={params.id} />
      <Suspense fallback={<PostsSkeleton />}>
        <UserPosts userId={params.id} />
      </Suspense>
    </main>
  );
}
```

#### 3.1.3 数据缓存层

```typescript
// 自定义数据缓存层
class DataCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl: number;

  constructor(ttlSeconds: number = 300) {
    this.ttl = ttlSeconds * 1000;
  }

  // 获取缓存
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  // 设置缓存
  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  // 清除缓存
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  // 清除所有缓存
  clear(): void {
    this.cache.clear();
  }
}

// 全局缓存实例
const globalCache = new DataCache(300); // 5分钟TTL

// 缓存的数据获取函数
async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = globalCache.get<T>(key);
  if (cached) return cached;

  const data = await fetcher();
  globalCache.set(key, data);

  return data;
}

// 使用示例
export async function getProductWithCache(productId: string) {
  return getCachedData(
    `product:${productId}`,
    () => fetchProduct(productId)
  );
}
```

### 3.2 CDN缓存

#### 3.2.1 边缘缓存配置

```typescript
// Next.js配置边缘缓存策略
// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 静态资源缓存头配置
  async headers() {
    return [
      {
        // 匹配所有静态文件
        source: '/:all*(svg|jpg|png|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // 匹配所有JS/CSS文件
        source: '/:path*.(:glob)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // 匹配所有API路由
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
      {
        // 匹配博客文章页面
        source: '/blog/:slug*',
        headers: [
          {
            key: 'Cache-Control',
            // 边缘缓存1小时，浏览器缓存10分钟
            value: 'public, s-maxage=3600, max-age=600, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
};
```

#### 3.2.2 缓存失效策略

```typescript
// 实现按需缓存失效
async function on-demandRevalidation(
  secret: string,
  tags: string[]
) {
  const response = await fetch(`${process.env.API_URL}/revalidate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-revalidate-secret': secret,
    },
    body: JSON.stringify({ tags }),
  });

  return response.json();
}

// 使用WebHook触发缓存失效
// app/api/revalidate/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-revalidate-secret');

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  const { tags, paths } = await request.json();

  const results: { tag?: string; path?: string; success: boolean }[] = [];

  // 按标签失效
  if (tags?.length) {
    for (const tag of tags) {
      try {
        await unstable_cacheTagInvalidate(tag);
        results.push({ tag, success: true });
      } catch {
        results.push({ tag, success: false });
      }
    }
  }

  // 按路径失效
  if (paths?.length) {
    for (const path of paths) {
      try {
        await unstable_revalidatePath(path);
        results.push({ path, success: true });
      } catch {
        results.push({ path, success: false });
      }
    }
  }

  return NextResponse.json({ results });
}
```

### 3.3 客户端缓存

#### 3.3.1 SWR配置优化

```typescript
// 自定义SWR配置
import { SWRConfiguration } from 'swr';

// 应用级SWR配置
export const swrConfig: SWRConfiguration = {
  // 初始数据展示后立即重新验证
  revalidateOnMount: true,

  // 窗口聚焦时重新验证
  revalidateOnFocus: true,

  // 网络恢复时重新验证
  revalidateOnReconnect: true,

  // 防抖间隔
  dedupingInterval: 2000,

  // 错误重试次数
  errorRetryCount: 3,

  // 错误重试间隔
  errorRetryInterval: 5000,

  // 缓存存储
  provider: (key) => new Map([[key, null]]),
};

// 使用SWR的封装Hook
function useProduct(productId: string) {
  return useSWR<Product>(
    `/api/products/${productId}`,
    fetcher,
    {
      // 缓存5分钟
      dedupingInterval: 300000,

      // 后台重新验证时展示旧数据
      keepPreviousData: true,

      // 自定义错误处理
      onError: (error, key) => {
        console.error(`SWR Error: ${key}`, error);
      },
    }
  );
}
```

#### 3.3.2 LocalStorage持久化

```typescript
// LocalStorage缓存策略
class LocalStorageCache {
  private prefix: string;

  constructor(prefix: string = 'cache:') {
    this.prefix = prefix;
  }

  // 设置缓存（带TTL）
  set<T>(key: string, data: T, ttlSeconds: number = 3600): void {
    const entry = {
      data,
      expiry: Date.now() + ttlSeconds * 1000,
    };

    try {
      localStorage.setItem(
        `${this.prefix}${key}`,
        JSON.stringify(entry)
      );
    } catch (error) {
      // 处理存储配额不足的情况
      console.warn('LocalStorage write failed:', error);
      this.evictOldEntries();
      try {
        localStorage.setItem(
          `${this.prefix}${key}`,
          JSON.stringify(entry)
        );
      } catch {
        // 忽略最终失败
      }
    }
  }

  // 获取缓存
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(`${this.prefix}${key}`);
      if (!raw) return null;

      const entry = JSON.parse(raw);

      // 检查是否过期
      if (Date.now() > entry.expiry) {
        localStorage.removeItem(`${this.prefix}${key}`);
        return null;
      }

      return entry.data as T;
    } catch {
      return null;
    }
  }

  // 清除过期条目
  private evictOldEntries(): void {
    const keys = Object.keys(localStorage).filter(k =>
      k.startsWith(this.prefix)
    );

    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;

        const entry = JSON.parse(raw);
        if (Date.now() > entry.expiry) {
          localStorage.removeItem(key);
        }
      } catch {
        // 忽略解析错误
      }
    }
  }

  // 清除所有缓存
  clear(): void {
    const keys = Object.keys(localStorage).filter(k =>
      k.startsWith(this.prefix)
    );

    for (const key of keys) {
      localStorage.removeItem(key);
    }
  }
}

// 创建缓存实例
const localCache = new LocalStorageCache('app:');

// 封装的使用Hook
function useLocalCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 3600
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 优先从缓存读取
    const cached = localCache.get<T>(key);
    if (cached) {
      setData(cached);
      return;
    }

    // 缓存不存在，从服务器获取
    setIsLoading(true);
    fetcher()
      .then(freshData => {
        localCache.set(key, freshData, ttlSeconds);
        setData(freshData);
      })
      .finally(() => setIsLoading(false));
  }, [key, fetcher, ttlSeconds]);

  return { data, isLoading };
}
```

## 四、实际案例分析

### 4.1 电商详情页优化

电商详情页是SEO和性能优化的典型场景，需要同时满足搜索引擎抓取和用户体验。

```tsx
// app/products/[slug]/page.tsx
import { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ slug: string }>;
}

// 静态生成产品页面
export const revalidate = 3600;

export async function generateStaticParams() {
  const products = await getAllProductSlugs();
  return products.map(product => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: '商品未找到' };
  }

  return {
    title: `${product.name} - 官方商城`,
    description: product.shortDescription,
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      images: [{ url: product.images[0], width: 1200, height: 630 }],
      type: 'website',
    },
    other: {
      'product:price:amount': product.price.toString(),
      'product:price:currency': 'CNY',
    },
  };
}

// 结构化数据
function ProductJsonLd({ product }: { product: Product }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.sku,
    brand: { '@type': 'Brand', name: product.brand },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'CNY',
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <>
      <ProductJsonLd product={product} />

      <main className="product-page">
        {/* 图片画廊 - 优化LCP */}
        <section className="gallery">
          <Image
            src={product.images[0]}
            alt={product.name}
            width={800}
            height={800}
            priority  // 首屏关键图片
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="thumbnail-list">
            {product.images.slice(1).map((img, i) => (
              <Image
                key={i}
                src={img}
                alt={`${product.name} 视图 ${i + 2}`}
                width={100}
                height={100}
              />
            ))}
          </div>
        </section>

        {/* 产品信息 */}
        <section className="product-info">
          <h1>{product.name}</h1>
          <p className="price">¥{product.price}</p>

          {/* 规格选择 */}
          <div className="specifications">
            {product.specs.map(spec => (
              <div key={spec.id} className="spec-option">
                <label>{spec.name}</label>
                <select>
                  {spec.values.map(value => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* 购买按钮 - 客户端组件 */}
          <AddToCartButton productId={product.id} />
        </section>

        {/* 详情描述 - 延迟加载 */}
        <section className="product-details">
          <h2>产品详情</h2>
          <div
            className="description"
            dangerouslySetInnerHTML={{ __html: product.details }}
          />
        </section>
      </main>
    </>
  );
}
```

### 4.2 博客文章页优化

博客文章页需要注重内容SEO和阅读体验的平衡。

```tsx
// app/blog/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

// 文章缓存时间
export const revalidate = 86400;  // 24小时

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return { title: '文章未找到' };
  }

  return {
    title: `${article.title} | 技术博客`,
    description: article.summary,
    keywords: article.tags,
    authors: [{ name: article.author }],
    openGraph: {
      title: article.title,
      description: article.summary,
      type: 'article',
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      tags: article.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.summary,
      images: [article.coverImage],
    },
  };
}

// 文章JSON-LD
function ArticleJsonLd({ article }: { article: Article }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: article.title,
          description: article.summary,
          image: article.coverImage,
          author: {
            '@type': 'Person',
            name: article.author,
          },
          publisher: {
            '@type': 'Organization',
            name: '技术博客',
          },
          datePublished: article.publishedAt,
          dateModified: article.updatedAt,
        }),
      }}
    />
  );
}

// 目录组件
function TableOfContents({ headings }: { headings: Heading[] }) {
  return (
    <nav className="toc" aria-label="文章目录">
      <h2>目录</h2>
      <ol>
        {headings.map(heading => (
          <li key={heading.id}>
            <a href={`#${heading.id}`}>{heading.text}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <>
      <ArticleJsonLd article={article} />

      <article className="blog-post">
        {/* 面包屑 */}
        <nav aria-label="面包屑" className="breadcrumb">
          <Link href="/">首页</Link>
          <span>/</span>
          <Link href="/blog">博客</Link>
          <span>/</span>
          <span aria-current="page">{article.title}</span>
        </nav>

        {/* 文章头部 */}
        <header className="post-header">
          <h1>{article.title}</h1>
          <div className="meta">
            <time dateTime={article.publishedAt}>
              {formatDate(article.publishedAt)}
            </time>
            <span>阅读 {article.readTime} 分钟</span>
          </div>
          <div className="tags">
            {article.tags.map(tag => (
              <Link key={tag} href={`/tags/${tag}`}>
                {tag}
              </Link>
            ))}
          </div>
        </header>

        <div className="post-layout">
          {/* 文章主体 */}
          <div className="post-content">
            <Image
              src={article.coverImage}
              alt={article.title}
              width={1200}
              height={630}
              priority
              style={{ width: '100%', height: 'auto' }}
            />

            <div dangerouslySetInnerHTML={{ __html: article.content }} />
          </div>

          {/* 侧边栏 */}
          <aside className="post-sidebar">
            <TableOfContents headings={article.headings} />
          </aside>
        </div>

        {/* 评论区 - 客户端组件 */}
        <section className="comments">
          <h2>评论</h2>
          <CommentSection articleId={article.id} />
        </section>
      </article>
    </>
  );
}
```

## 五、面试高频问题

### Q1: SSR对SEO有什么好处？

**参考答案：**

SSR对SEO的核心优势在于让搜索引擎爬虫能够直接获取到完整的页面内容，无需执行JavaScript即可解析页面结构。

**具体好处包括：**

1. **内容可抓取性**：传统CSR页面的内容需要JavaScript执行后才能渲染，爬虫可能无法获取到完整内容。SSR页面在服务端生成完整的HTML，爬虫直接获取，无需等待JS执行。

2. **首屏加载速度**：SSR页面可以更快地展示内容，减少了首屏空白时间，提升了用户留存率和搜索引擎对页面质量的评估。

3. **Meta标签优化**：服务端可以动态设置每个页面的Meta标签（title、description、og:title等），这些标签对搜索引擎排名和社交分享至关重要。

4. **结构化数据支持**：可以在服务端生成完整的JSON-LD结构化数据，帮助搜索引擎更好地理解页面内容。

5. **URL语义化**：SSR应用天然支持语义化的URL结构，有利于关键词排名。

**代码示例：**

```typescript
// Next.js App Router中的SEO优化
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.id);

  return {
    title: product.name,                    // 生成<title>标签
    description: product.description,        // 生成<meta name="description">
    openGraph: {
      title: product.name,
      description: product.description,
      images: [product.image],
      type: 'product',
    },
  };
}
```

### Q2: 如何优化SSR应用的FCP？

**参考答案：**

First Contentful Paint（首次内容绘制）优化需要从服务端和客户端两个层面入手。

**服务端优化策略：**

1. **减少服务器响应时间**：
   - 使用缓存（Redis、内存缓存）
   - 优化数据库查询（添加索引、使用查询优化）
   - 考虑使用CDN加速

2. **减少HTML传输大小**：
   - 启用Gzip/Brotli压缩
   - 删除不必要的HTML注释和空格
   - 使用流式响应（Streaming）

**客户端优化策略：**

1. **CSS优化**：
   - 将关键CSS内联到HTML中
   - 延迟加载非关键CSS
   - 避免CSS阻塞渲染

2. **资源加载优化**：
   - 预加载关键资源（字体、图片）
   - 使用preconnect提前建立连接
   - 优化图片格式和大小

**代码示例：**

```tsx
// 使用Streaming提升FCP
import { Suspense } from 'react';

export default function Page() {
  return (
    <div>
      {/* 关键内容立即渲染 */}
      <header>
        <h1>页面标题</h1>
      </header>

      {/* 非关键内容使用Suspense实现流式加载 */}
      <Suspense fallback={<ProductSkeleton />}>
        <ProductList />  {/* 可能在稍后加载 */}
      </Suspense>
    </div>
  );
}
```

### Q3: 什么情况下SSR反而会影响性能？

**参考答案：**

SSR虽然有诸多优势，但在某些场景下反而可能成为性能瓶颈。

**不适合SSR的场景：**

1. **高交互性页面**：如仪表盘、数据可视化等需要大量客户端交互的页面，SSR带来的优势有限，反而增加了服务器负担。

2. **个性化内容页面**：每个用户看到的内容都不同（如购物车、用户设置页），SSR无法有效利用缓存，且增加服务器计算负担。

3. **频繁更新的数据页面**：如实时股价、直播数据等，SSR缓存策略难以平衡，容易导致数据过期或服务器过载。

4. **弱服务器环境**：在服务器资源有限或地理位置偏远的情况下，SSR可能比CSR的客户端渲染更慢。

5. **大量数据聚合页面**：需要从多个数据源聚合数据的页面，SSR可能显著增加页面TTFB（首字节时间）。

**替代方案：**

```tsx
// 使用客户端渲染处理个性化内容
'use client';

export default function UserDashboard() {
  const { user } = useUser();
  const { data: dashboardData } = useSWR('/api/dashboard');

  if (!dashboardData) return <LoadingSkeleton />;

  return (
    <div>
      <h1>欢迎回来，{user.name}</h1>
      <DashboardContent data={dashboardData} />
    </div>
  );
}
```

### Q4: 如何实现SSR页面的缓存？

**参考答案：**

SSR页面的缓存需要从多个层面进行设计。

**缓存层级：**

1. **CDN边缘缓存**：
   - 设置Cache-Control头
   - 使用surrogate-key实现按需失效

```typescript
// Next.js配置CDN缓存
export const revalidate = 3600;  // 1小时后重新验证

export async function generateHeaders() {
  return [
    {
      source: '/blog/:slug*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      ],
    },
  ];
}
```

2. **应用层缓存**：
   - 使用Redis缓存页面片段
   - 缓存数据库查询结果

```typescript
// 应用层缓存示例
const cachedGetProducts = cache(async (category: string) => {
  // 先检查缓存
  const cached = await redis.get(`products:${category}`);
  if (cached) return JSON.parse(cached);

  // 缓存未命中，从数据库获取
  const products = await db.products.findMany({ category });
  await redis.setex(`products:${category}`, 3600, JSON.stringify(products));

  return products;
});
```

3. **组件级缓存**：
   - 使用React的cache函数
   - 利用SWR/React Query的缓存能力

```tsx
const getUserData = cache(async (userId: string) => {
  return fetch(`/api/users/${userId}`).then(r => r.json());
});
```

4. **按需失效策略**：
   - WebHook触发失效
   - 定时失效
   - 手动失效

```typescript
// 按标签失效
async function invalidateByTag(tag: string) {
  await fetch('/api/revalidate', {
    method: 'POST',
    body: JSON.stringify({ tags: [tag] }),
  });
}
```

## 总结

本文深入讲解了SSR应用的SEO优化和性能优化实战技巧，主要涵盖以下核心内容：

**SEO优化层面：**
- 完整的Meta标签体系，包括基础标签、Open Graph和Twitter Cards
- 结构化数据的正确使用，JSON-LD格式的多种场景应用
- 语义化HTML结构，提升可访问性和搜索引擎理解能力

**Core Web Vitals优化层面：**
- LCP优化：图片懒加载、字体优化、流式SSR
- CLS优化：尺寸预留、骨架屏、动态内容处理
- FID优化：代码分割、Web Worker、长任务拆分

**缓存策略层面：**
- 服务端缓存：页面级、组件级、数据级缓存
- CDN缓存：边缘缓存配置、按需失效策略
- 客户端缓存：SWR配置、LocalStorage持久化

掌握这些技术，能够帮助开发者构建既满足搜索引擎友好、又具备卓越用户体验的高性能全栈应用。
