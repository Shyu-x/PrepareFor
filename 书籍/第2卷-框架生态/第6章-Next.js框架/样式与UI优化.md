# 第2卷-框架生态

## 第6章 Next.js框架

### 6.6 样式与UI优化

---

## 6.6 样式与UI优化

### 6.6.1 CSS Modules

**参考答案：**

CSS Modules 提供组件级别的样式隔离。

**基础用法：**

```css
/* src/components/Button.module.css */
.button {
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.2s;
}

.primary {
  background-color: #0070f3;
  color: white;
}

.secondary {
  background-color: #eaeaea;
  color: #333;
}

.button:hover {
  opacity: 0.9;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

```tsx
// src/components/Button.tsx
import styles from './Button.module.css'

interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  onClick?: () => void
}

export function Button({
  children,
  variant = 'primary',
  disabled = false,
  onClick,
}: ButtonProps) {
  return (
    <button
      className={`${styles.button} ${styles[variant]}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
```

---

### 6.6.2 Tailwind CSS

**参考答案：**

Tailwind CSS 是一个实用优先的 CSS 框架。

**配置：**

```tsx
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0070f3',
        secondary: '#eaeaea',
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
      },
    },
  },
  plugins: [],
}

export default config
```

**使用：**

```tsx
// src/app/page.tsx
export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          欢迎
        </h1>
        <p className="text-gray-600 mb-6">
          这是一个使用 Tailwind CSS 的页面
        </p>
        <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
          点击我
        </button>
      </div>
    </div>
  )
}
```

**动态类名：**

```tsx
// 静态分析限制的处理方式
<div className={clsx(
  'p-4',
  isActive && 'bg-blue-500',
  isLarge && 'text-xl'
)} />
```

---

### 6.6.3 全局样式

**参考答案：**

**globals.css：**

```css
/* src/app/globals.css */
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

@layer components {
  .container {
    @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
  }

  .btn-primary {
    @apply bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600;
  }
}
```

---

### 6.6.4 Sass (SCSS)

**参考答案：**

**安装：**

```bash
npm install sass
```

**使用：**

```scss
// src/styles/variables.scss
$primary-color: #0070f3;
$border-radius: 8px;

// src/styles/button.scss
.button {
  background-color: $primary-color;
  border-radius: $border-radius;
  padding: 12px 24px;
  border: none;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }

  &.secondary {
    background-color: #eaeaea;
  }
}
```

```tsx
// src/components/Button.tsx
import '@/styles/button.scss'

export function Button({ children }: Props) {
  return <button className="button">{children}</button>
}
```

---

### 6.6.5 CSS-in-JS（已不推荐）

**参考答案：**

Next.js 不推荐使用 CSS-in-JS 方案，因为 Server Components 不支持。如果必须使用，建议使用 styled-components 或 emotion 的客户端方案。

**styled-components 示例：**

```tsx
// src/components/Container.tsx
'use client'

import styled from 'styled-components'

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
`

export function Container({ children }: { children: React.ReactNode }) {
  return <Container>{children}</Container>
}
```

---

### 6.6.6 图像优化（next/image）

**参考答案：**

**基础用法：**

```tsx
import Image from 'next/image'
import heroImage from '@/images/hero.jpg'

export default function Page() {
  return (
    <div>
      <Image
        src={heroImage}
        alt="Hero image"
        width={1200}
        height={600}
        priority  // 预加载
      />

      {/* 远程图片 */}
      <Image
        src="https://example.com/image.jpg"
        alt="Remote image"
        width={800}
        height={600}
      />
    </div>
  )
}
```

**next.config.js 配置：**

```tsx
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'example.com',
        port: '',
        pathname: '/images/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
}

export default nextConfig
```

**属性说明：**

| 属性 | 类型 | 说明 |
|:---|:---|:---|
| src | string/object | 图片源 |
| alt | string | 替代文本 |
| width | number | 宽度 |
| height | number | 高度 |
| fill | boolean | 填充父容器 |
| priority | boolean | 预加载 |
| placeholder | string | 占位符 blur |
| sizes | string | 响应式尺寸 |

---

### 6.6.7 字体优化（next/font）

**参考答案：**

**Google Fonts：**

```tsx
// src/app/layout.tsx
import { Inter, Noto_Sans_SC } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-noto-sc',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${notoSansSC.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

**本地字体：**

```tsx
// src/app/layout.tsx
import localFont from 'next/font/local'

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
  variable: '--font-myfont',
})

export default function RootLayout({ children }: Props) {
  return (
    <html lang="zh-CN" className={myFont.variable}>
      <body>{children}</body>
    </html>
  )
}
```

---

### 6.6.8 面试常见问题

**Q1: Next.js 推荐使用哪种样式方案？**

| 方案 | 推荐度 | 说明 |
|:---|:---|:---|
| CSS Modules | ⭐⭐⭐⭐⭐ | 原生支持，简单 |
| Tailwind CSS | ⭐⭐⭐⭐⭐ | 官方推荐 |
| Sass/SCSS | ⭐⭐⭐⭐ | 功能强大 |
| CSS-in-JS | ⭐⭐ | 不推荐用于 App Router |

**Q2: next/image 有什么优势？**

- 自动格式转换（WebP/AVIF）
- 响应式图片生成
- 懒加载
- 布局偏移保护
- CDN 优化

**Q3: next/font 有什么优势？**

- 自动优化字体文件
- 零布局偏移
- 字体托管在同域名
- 内联关键 CSS

---

> **面试提示**：样式和优化是实际项目中的常见需求，Tailwind CSS 和 next/image/next/font 是现代 Next.js 项目的标配。
