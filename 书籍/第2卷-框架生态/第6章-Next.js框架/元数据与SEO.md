# 第2卷-框架生态

## 第6章 Next.js框架

### 6.7 元数据与SEO

---

## 6.7 元数据与SEO

### 6.7.1 Metadata API

**参考答案：**

Next.js 提供了完整的 Metadata API 来管理页面元数据。

**静态元数据：**

```tsx
// src/app/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '首页',
  description: '这是一个 Next.js 应用',
  keywords: ['Next.js', 'React', '前端'],
  authors: [{ name: '张三' }],
  creator: '张三',
  publisher: '我的公司',
}

export default function Page() {
  return <h1>欢迎访问</h1>
}
```

**动态元数据：**

```tsx
// src/app/blog/[slug]/page.tsx
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  }
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug)

  return <article>{post.content}</article>
}
```

---

### 6.7.2 Open Graph

**参考答案：**

```tsx
export const metadata: Metadata = {
  openGraph: {
    title: '我的文章标题',
    description: '文章描述内容',
    url: 'https://example.com/blog/my-post',
    siteName: '我的网站',
    locale: 'zh_CN',
    type: 'article',
    publishedTime: '2024-01-01T00:00:00Z',
    authors: ['张三'],
    images: [
      {
        url: 'https://example.com/images/post.jpg',
        width: 1200,
        height: 630,
        alt: '文章封面图',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '我的文章标题',
    description: '文章描述内容',
    creator: '@username',
    images: ['https://example.com/images/post.jpg'],
  },
}
```

---

### 6.7.3 标题模板

**参考答案：**

```tsx
// src/app/layout.tsx
export const metadata: Metadata = {
  title: {
    template: '%s | 我的网站',
    default: '我的网站',
    absolute: '独立标题', // 覆盖模板
  },
}
```

**效果：**
- 首页：`我的网站`
- 关于：`关于 | 我的网站`
- 使用 absolute：`独立标题`

---

### 6.7.4 favicon 和图标

**参考答案：**

**静态文件方式：**

```
public/
┣━━ favicon.ico
┣━━ apple-touch-icon.png (180x180)
┣━━ icon-192.png (192x192)
┣━━ icon-512.png (512x512)
┣━━ og-image.png (1200x630)
┗━━ manifest.json
```

**manifest.json：**

```json
{
  "name": "我的应用",
  "short_name": "应用",
  "description": "一个 Next.js PWA",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0070f3",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

**动态生成 favicon：**

```tsx
// src/app/icon.tsx
import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 32,
  height: 32,
}

export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    {
      emoji: '👋',
      style: {
        fontSize: 24,
      },
    },
    {
      width: size.width,
      height: size.height,
    }
  )
}
```

---

### 6.7.5 JSON-LD 结构化数据

**参考答案：**

```tsx
// src/app/blog/[slug]/page.tsx
export default async function BlogPost({ params }: Props) {
  const post = await getPost(params.slug)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    image: [post.coverImage],
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: [
      {
        '@type': 'Person',
        name: post.author.name,
        url: post.author.url,
      },
    ],
  }

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1>{post.title}</h1>
    </article>
  )
}
```

---

### 6.7.6 站点地图（sitemap.xml）

**参考答案：**

```tsx
// src/app/sitemap.ts
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://example.com'

  const staticPages = [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/about`, lastModified: new Date() },
    { url: `${baseUrl}/blog`, lastModified: new Date() },
  ]

  const posts = await getAllPosts()

  const dynamicPages = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...dynamicPages]
}
```

---

### 6.7.7 robots.txt

**参考答案：**

```tsx
// src/app/robots.ts
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/private/', '/api/'],
      },
    ],
    sitemap: 'https://example.com/sitemap.xml',
  }
}
```

---

### 6.7.8 面试常见问题

**Q1: Metadata API 的优势是什么？**

- 类型安全
- Server Components 原生支持
- 自动生成 SEO 相关标签
- 支持 Open Graph、Twitter Cards

**Q2: generateMetadata 和导出 metadata 有什么区别？**

- `export const metadata`: 静态元数据
- `generateMetadata()`: 动态元数据，基于参数

**Q3: 如何优化 SEO？**

1. 使用语义化 HTML
2. 正确配置 Metadata
3. 添加结构化数据（JSON-LD）
4. 使用 next/image 优化图片
5. 确保内容可索引

---

> **面试提示**：SEO 是面试中常考的内容，需要理解 Metadata API、Open Graph、结构化数据等概念。
