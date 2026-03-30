# Tailwind CSS 实战

## 目录

1. [Tailwind CSS 是什么？](#1-tailwind-css-是什么)
2. [基础语法和类名](#2-基础语法和类名)
3. [响应式设计](#3-响应式设计)
4. [状态变体 (hover, focus, etc.)](#4-状态变体-hover-focus-etc)
5. [自定义配置](#5-自定义配置)
6. [与组件库结合使用](#6-与组件库结合使用)

---

## 1. Tailwind CSS 是什么？

### 1.1 概念介绍

Tailwind CSS 是一个**原子化 CSS 框架**，它提供了一套低级的工具类，让你可以直接在 HTML 中组合构建自定义设计。

```
传统 CSS:
┌─────────────────────────────────────┐
│ .btn {                             │
│   background-color: #3b82f6;        │
│   color: white;                     │
│   padding: 0.5rem 1rem;            │
│   border-radius: 0.5rem;           │
│   font-weight: 500;                │
│ }                                  │
└─────────────────────────────────────┘

Tailwind CSS:
┌─────────────────────────────────────┐
│ <button class="bg-blue-500         │
│   text-white px-4 py-2             │
│   rounded-lg font-medium">          │
│   Button                            │
│ </button>                          │
└─────────────────────────────────────┘
```

### 1.2 项目配置

```javascript
// apps/web/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

```javascript
// apps/web/postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

```css
/* apps/web/src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 可以添加自定义样式 */
@layer base {
  body {
    @apply antialiased;
  }
}
```

---

## 2. 基础语法和类名

### 2.1 布局 (Layout)

#### 盒子模型 (Box Model)

```html
<!-- 宽度 -->
<div class="w-4">      width: 1rem (16px) </div>
<div class="w-16">     width: 4rem (64px) </div>
<div class="w-full">    width: 100% </div>
<div class="w-screen">  width: 100vw </div>
<div class="w-auto">    width: auto </div>

<!-- 高度 -->
<div class="h-4">      height: 1rem </div>
<div class="h-full">    height: 100% </div>
<div class="h-screen">  height: 100vh </div>
<div class="h-auto">    height: auto </div>
<div class="min-h-screen"> min-height: 100vh </div>

<!-- 内边距 -->
<div class="p-0">      padding: 0 </div>
<div class="p-2">      padding: 0.5rem </div>
<div class="p-4">      padding: 1rem </div>
<div class="px-4">     padding-left: 1rem; padding-right: 1rem </div>
<div class="py-4">    padding-top: 1rem; padding-bottom: 1rem </div>
<div class="pt-4">    padding-top: 1rem </div>
<div class="pr-4">    padding-right: 1rem </div>
<div class="pb-4">    padding-bottom: 1rem </div>
<div class="pl-4">    padding-left: 1rem </div>

<!-- 外边距 -->
<div class="m-0">      margin: 0 </div>
<div class="m-4">      margin: 1rem </div>
<div class="mx-auto">   margin-left: auto; margin-right: auto </div>
<div class="my-4">     margin-top: 1rem; margin-bottom: 1rem </div>
<div class="mt-4">     margin-top: 1rem </div>
<div class="-mt-4">    margin-top: -1rem (负值) </div>

<!-- 间距 (常用) -->
<div class="space-y-4">   /* 子元素垂直间距 */
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>

<div class="space-x-4">   /* 子元素水平间距 */
  <span>A</span>
  <span>B</span>
  <span>C</span>
</div>
```

#### 显示 (Display)

```html
<div class="block">        display: block </div>
<div class="inline">       display: inline </div>
<div class="inline-block"> display: inline-block </div>
<div class="flex">         display: flex </div>
<div class="inline-flex">  display: inline-flex </div>
<div class="grid">         display: grid </div>
<div class="inline-grid">  display: inline-grid </div>
<div class="hidden">       display: none </div>
```

#### 定位 (Position)

```html
<div class="static">       position: static </div>
<div class="relative">     position: relative </div>
<div class="absolute">     position: absolute </div>
<div class="fixed">        position: fixed </div>
<div class="sticky">       position: sticky </div>

<!-- 位置 -->
<div class="inset-0">      top: 0; right: 0; bottom: 0; left: 0 </div>
<div class="top-0">        top: 0 </div>
<div class="right-0">      right: 0 </div>
<div class="bottom-0">     bottom: 0 </div>
<div class="left-0">       left: 0 </div>
<div class="z-0">          z-index: 0 </div>
<div class="z-10">         z-index: 10 </div>
<div class="z-50">         z-index: 50 </div>
```

### 2.2 弹性盒 (Flexbox)

```html
<!-- 主轴对齐 -->
<div class="flex justify-start">    justify-content: flex-start </div>
<div class="flex justify-end">      justify-content: flex-end </div>
<div class="flex justify-center">   justify-content: center </div>
<div class="flex justify-between">  justify-content: space-between </div>
<div class="flex justify-around">  justify-content: space-around </div>
<div class="flex justify-evenly">  justify-content: space-evenly </div>

<!-- 交叉轴对齐 -->
<div class="items-start">       align-items: flex-start </div>
<div class="items-end">         align-items: flex-end </div>
<div class="items-center">      align-items: center </div>
<div class="items-stretch">     align-items: stretch </div>
<div class="items-baseline">    align-items: baseline </div>

<!-- 换行 -->
<div class="flex-nowrap">      flex-wrap: nowrap </div>
<div class="flex-wrap">        flex-wrap: wrap </div>
<div class="flex-wrap-reverse"> flex-wrap: wrap-reverse </div>

<!-- 方向 -->
<div class="flex-row">          flex-direction: row </div>
<div class="flex-row-reverse">  flex-direction: row-reverse </div>
<div class="flex-col">          flex-direction: column </div>
<div class="flex-col-reverse"> flex-direction: column-reverse </div>
```

### 2.3 网格 (Grid)

```html
<!-- 网格列 -->
<div class="grid grid-cols-1">   grid-template-columns: repeat(1, minmax(0, 1fr)) </div>
<div class="grid grid-cols-2">   grid-template-columns: repeat(2, minmax(0, 1fr)) </div>
<div class="grid grid-cols-3">   grid-template-columns: repeat(3, minmax(0, 1fr)) </div>
<div class="grid grid-cols-4">   grid-template-columns: repeat(4, minmax(0, 1fr)) </div>
<div class="grid grid-cols-12">  grid-template-columns: repeat(12, minmax(0, 1fr)) </div>

<!-- 网格行 -->
<div class="grid-rows-1">       grid-template-rows: repeat(1, minmax(0, 1fr)) </div>
<div class="grid-rows-2">       grid-template-rows: repeat(2, minmax(0, 1fr)) </div>
<div class="grid-rows-3">       grid-template-rows: repeat(3, minmax(0, 1fr)) </div>

<!-- 间距 -->
<div class="gap-4">             gap: 1rem </div>
<div class="gap-x-4">           column-gap: 1rem </div>
<div class="gap-y-4">           row-gap: 1rem </div>

<!-- 跨越 -->
<div class="col-span-1">        grid-column: span 1 / span 1 </div>
<div class="col-span-2">        grid-column: span 2 / span 2 </div>
<div class="col-start-1">       grid-column-start: 1 </div>
<div class="col-end-2">         grid-column-end: 2 </div>
```

### 2.4 颜色 (Colors)

```html
<!-- 基础颜色 -->
<div class="text-gray-500">    color: #6b7280 </div>
<div class="text-red-500">     color: #ef4444 </div>
<div class="text-orange-500"> color: #f97316 </div>
<div class="text-yellow-500"> color: #eab308 </div>
<div class="text-green-500">  color: #22c55e </div>
<div class="text-blue-500">   color: #3b82f6 </div>
<div class="text-indigo-500"> color: #6366f1 </div>
<div class="text-purple-500"> color: #a855f7 </div>
<div class="text-pink-500">   color: #ec4899 </div>

<!-- 背景颜色 -->
<div class="bg-gray-500">      background-color: #6b7280 </div>
<div class="bg-red-500">       background-color: #ef4444 </div>

<!-- 透明度 -->
<div class="bg-blue-500/50">   background-color: rgba(59, 130, 246, 0.5) </div>
<div class="text-white/80">    color: rgba(255, 255, 255, 0.8) </div>
```

### 2.5 排版 (Typography)

```html
<!-- 字体大小 -->
<div class="text-xs">      font-size: 0.75rem (12px) </div>
<div class="text-sm">      font-size: 0.875rem (14px) </div>
<div class="text-base">    font-size: 1rem (16px) </div>
<div class="text-lg">      font-size: 1.125rem (18px) </div>
<div class="text-xl">      font-size: 1.25rem (20px) </div>
<div class="text-2xl">     font-size: 1.5rem (24px) </div>
<div class="text-3xl">     font-size: 1.875rem (30px) </div>
<div class="text-4xl">     font-size: 2.25rem (36px) </div>

<!-- 字体粗细 -->
<div class="font-thin">       font-weight: 100 </div>
<div class="font-extralight"> font-weight: 200 </div>
<div class="font-light">     font-weight: 300 </div>
<div class="font-normal">    font-weight: 400 </div>
<div class="font-medium">    font-weight: 500 </div>
<div class="font-semibold">  font-weight: 600 </div>
<div class="font-bold">      font-weight: 700 </div>
<div class="font-extrabold"> font-weight: 800 </div>

<!-- 文字对齐 -->
<div class="text-left">      text-align: left </div>
<div class="text-center">    text-align: center </div>
<div class="text-right">     text-align: right </div>
<div class="text-justify">   text-align: justify </div>

<!-- 行高 -->
<div class="leading-none">    line-height: 1 </div>
<div class="leading-tight">   line-height: 1.25 </div>
<div class="leading-normal">  line-height: 1.5 </div>
<div class="leading-loose">   line-height: 2 </div>

<!-- 字间距 -->
<div class="tracking-tighter"> letter-spacing: -0.05em </div>
<div class="tracking-tight">  letter-spacing: -0.025em </div>
<div class="tracking-normal"> letter-spacing: 0 </div>
<div class="tracking-wide">   letter-spacing: 0.025em </div>
<div class="tracking-wider">  letter-spacing: 0.05em </div>
```

### 2.6 边框 (Borders)

```html
<!-- 边框宽度 -->
<div class="border">          border-width: 1px </div>
<div class="border-0">        border-width: 0 </div>
<div class="border-2">        border-width: 2px </div>
<div class="border-4">        border-width: 4px </div>
<div class="border-8">        border-width: 8px </div>

<!-- 边框方向 -->
<div class="border-t">        border-top-width: 1px </div>
<div class="border-b">        border-bottom-width: 1px </div>
<div class="border-l">        border-left-width: 1px </div>
<div class="border-r">        border-right-width: 1px </div>

<!-- 边框颜色 -->
<div class="border-gray-500"> border-color: #6b7280 </div>
<div class="border-blue-500"> border-color: #3b82f6 </div>

<!-- 边框圆角 -->
<div class="rounded">         border-radius: 0.25rem </div>
<div class="rounded-sm">     border-radius: 0.125rem </div>
<div class="rounded-md">     border-radius: 0.375rem </div>
<div class="rounded-lg">     border-radius: 0.5rem </div>
<div class="rounded-xl">     border-radius: 0.75rem </div>
<div class="rounded-2xl">    border-radius: 1rem </div>
<div class="rounded-full">   border-radius: 9999px </div>

<!-- 方向圆角 -->
<div class="rounded-t">       border-top-left-radius, border-top-right-radius </div>
<div class="rounded-b">       border-bottom-left-radius, border-bottom-right-radius </div>
<div class="rounded-tl">      border-top-left-radius </div>
```

### 2.7 阴影 (Shadows)

```html
<div class="shadow-none">     box-shadow: none </div>
<div class="shadow-sm">       box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) </div>
<div class="shadow">         box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1) </div>
<div class="shadow-md">      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1) </div>
<div class="shadow-lg">      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1) </div>
<div class="shadow-xl">     box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) </div>
<div class="shadow-2xl">    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) </div>
```

### 2.8 过渡和动画 (Transitions & Animations)

```html
<!-- 过渡属性 -->
<div class="transition-none">      transition-property: none </div>
<div class="transition-all">       transition-property: all </div>
<div class="transition-colors">    transition-property: color, background-color, border-color... </div>
<div class="transition-opacity">   transition-property: opacity </div>
<div class="transition-transform"> transition-property: transform </div>

<!-- 过渡时长 -->
<div class="duration-0">          transition-duration: 0s </div>
<div class="duration-75">         transition-duration: 75ms </div>
<div class="duration-100">        transition-duration: 100ms </div>
<div class="duration-150">        transition-duration: 150ms </div>
<div class="duration-200">        transition-duration: 200ms </div>
<div class="duration-300">        transition-duration: 300ms </div>
<div class="duration-500">        transition-duration: 500ms </div>
<div class="duration-700">        transition-duration: 700ms </div>
<div class="duration-1000">       transition-duration: 1000ms </div>

<!-- 过渡-timing 函数 -->
<div class="ease-linear">        transition-timing-function: linear </div>
<div class="ease-in">            transition-timing-function: cubic-bezier(0.4, 0, 1, 1) </div>
<div class="ease-out">           transition-timing-function: cubic-bezier(0, 0, 0.2, 1) </div>
<div class="ease-in-out">       transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1) </div>

<!-- 动画 -->
<div class="animate-spin">       旋转动画 </div>
<div class="animate-pulse">      脉冲动画 </div>
<div class="animate-bounce">     弹跳动画 </div>
```

---

## 3. 响应式设计

### 3.1 断点 (Breakpoints)

Tailwind 的默认断点：

| 断点 | 最小宽度 | CSS |
|------|----------|-----|
| `sm` | 640px | `@media (min-width: 640px)` |
| `md` | 768px | `@media (min-width: 768px)` |
| `lg` | 1024px | `@media (min-width: 1024px)` |
| `xl` | 1280px | `@media (min-width: 1280px)` |
| `2xl` | 1536px | `@media (min-width: 1536px)` |

### 3.2 响应式前缀

```html
<!-- 默认: 移动端 -->
<div class="w-full md:w-1/2 lg:w-1/3">
  <!--
    移动端: w-full (100%)
    md (768px+): w-1/2 (50%)
    lg (1024px+): w-1/3 (33.33%)
  -->
</div>

<!-- 响应式显示 -->
<div class="hidden md:block">
  <!-- 默认隐藏，md 及以上显示 -->
</div>

<div class="block md:hidden">
  <!-- 默认显示，md 及以上隐藏 -->
</div>

<!-- 响应式文字 -->
<p class="text-sm md:text-base lg:text-lg">
  响应式文字大小
</p>

<!-- 响应式弹性布局 -->
<div class="flex flex-col md:flex-row">
  <!-- 移动端: 垂直排列 -->
  <!-- md 及以上: 水平排列 -->
</div>
```

### 3.3 响应式 Grid 布局

```html
<!-- 响应式网格 -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
  <div>Item 4</div>
  <div>Item 5</div>
  <div>Item 6</div>
</div>

<!-- 响应式间距 -->
<div class="p-4 md:p-6 lg:p-8">
  响应式内边距
</div>
```

### 3.4 自定义断点

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'xs': '480px',    // 自定义 xs 断点
      '3xl': '1600px',  // 自定义 3xl 断点
    }
  }
}
```

---

## 4. 状态变体 (hover, focus, etc.)

### 4.1 交互状态变体

```html
<!-- Hover -->
<button class="bg-blue-500 hover:bg-blue-600">
  Hover me
</button>

<!-- Focus -->
<input class="border focus:border-blue-500 focus:outline-none" />

<!-- Active -->
<button class="bg-blue-500 active:bg-blue-700">
  Active
</button>

<!-- 组合状态 -->
<button class="
  bg-blue-500
  hover:bg-blue-600
  focus:ring-2
  focus:ring-blue-300
  active:bg-blue-700
">
  Button
</button>
```

### 4.2 伪类变体

```html
<!-- 第一个子元素 -->
<li class="first:text-red-500">Item 1</li>
<li class="first:text-blue-500">Item 2</li>

<!-- 最后一个子元素 -->
<div class="last:border-b-0">Last item</div>

<!-- 奇数/偶数子元素 -->
<tr class="odd:bg-gray-50 even:bg-white">...</tr>

<!-- 只读/只写 -->
<input readonly class="bg-gray-100 read-only:bg-gray-200" />
<input class="bg-white read-only:bg-gray-100" />

<!-- 选中状态 -->
<input type="checkbox" class="checked:bg-blue-500" />

<!-- 焦点 within -->
<div class="focus-within:bg-blue-50">
  <input class="focus:bg-white" />
</div>

<!-- 占位符 -->
<input placeholder="text-gray-400 placeholder-gray-500" />
```

### 4.3 媒体查询变体

```html
<!-- 暗色模式 -->
<div class="bg-white dark:bg-gray-800">
  <p class="text-gray-900 dark:text-white">暗色模式</p>
</div>

<!-- 减少动画 -->
<div class="transition-all motion-reduce:transition-none">
  减少动画时无过渡
</div>

<!-- 打印 -->
<div class="print:hidden">
  打印时隐藏
</div>
```

### 4.4 暗色模式配置

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',  // 使用 class 控制暗色模式
  // 或
  darkMode: 'media',  // 使用系统偏好
}
```

```typescript
// React 中使用暗色模式
import { useStore } from '@/store'

function Component() {
  const { isDarkMode } = useStore()

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="bg-white dark:bg-gray-900">
        <p className="text-gray-900 dark:text-white">Hello</p>
      </div>
    </div>
  )
}
```

---

## 5. 自定义配置

### 5.1 自定义主题

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    // 自定义颜色
    colors: {
      primary: {
        50: '#eff6ff',
        100: '#dbeafe',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
      },
      brand: '#0891B2',  // 自定义品牌色
    },

    // 自定义间距
    spacing: {
      '18': '4.5rem',
      '22': '5.5rem',
    },

    // 自定义圆角
    borderRadius: {
      '4xl': '2rem',
    },

    // 自定义字体
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      display: ['Poppins', 'sans-serif'],
    },

    // 自定义阴影
    boxShadow: {
      'custom': '0 4px 6px -1px rgba(8, 145, 178, 0.3)',
    },

    // 覆盖默认配置
    extend: {
      // 在默认基础上扩展
    }
  }
}
```

### 5.2 @apply 指令

```css
/* 定义可复用的组件类 */
@layer components {
  .btn {
    @apply px-4 py-2 rounded-lg font-medium transition-colors;
  }

  .btn-primary {
    @apply bg-blue-500 text-white hover:bg-blue-600;
  }

  .btn-secondary {
    @apply bg-gray-200 text-gray-800 hover:bg-gray-300;
  }

  .card {
    @apply bg-white rounded-xl shadow-lg p-6;
  }
}
```

### 5.3 自定义工具类

```css
@layer utilities {
  .text-balance {
    text-wrap: balance;
  }

  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
}
```

---

## 6. 与组件库结合使用

### 6.1 项目中的实际使用

本项目使用 Ant Design (antd) 作为 UI 组件库，结合 Tailwind CSS 进行样式微调：

```typescript
// apps/web/src/app/page.tsx
export default function Home() {
  return (
    <>
      {/* 使用 Ant Design 组件 */}
      <Card>
        <Statistic
          title="文档总数"
          value={totalDocs}
          prefix={<FileTextOutlined />}
          valueStyle={{ color: '#0891B2' }}
        />
      </Card>

      {/* 使用 Tailwind CSS 自定义样式 */}
      <div
        style={{
          padding: '8px 0',
          cursor: 'pointer',
          color: '#0891B2',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span>
          <FileTextOutlined style={{ marginRight: 8 }} />
          {file.title}
        </span>
      </div>

      {/* 响应式布局 */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>内容</Card>
        </Col>
      </Row>
    </>
  )
}
```

### 6.2 结合 Ant Design 和 Tailwind

```typescript
// 自定义 Ant Design 组件样式
const customToken = {
  colorPrimary: '#0891B2',
  borderRadius: 12,
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}

// 使用 Tailwind 覆盖特定样式
<div className="ant-card custom-card">
  {/* Tailwind 类可以与 antd 类结合使用 */}
  <div className="shadow-xl rounded-2xl hover:shadow-2xl transition-shadow">
    <Card variant="borderless" className="backdrop-blur-md bg-white/80">
      {/* ... */}
    </Card>
  </div>
</div>
```

### 6.3 组件封装示例

```typescript
// 封装带 Tailwind 样式的组件
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseStyles = 'rounded-lg font-medium transition-all duration-200'

  const variants = {
    primary: 'bg-cyan-500 text-white hover:bg-cyan-600 active:bg-cyan-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 active:bg-gray-400',
    danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
```

### 6.4 常见组合模式

```typescript
// 响应式卡片组件
function ResponsiveCard({ children }) {
  return (
    <div className="
      bg-white
      rounded-2xl
      shadow-lg
      p-4
      md:p-6
      lg:p-8
      hover:shadow-xl
      transition-shadow
      duration-300
    ">
      {children}
    </div>
  )
}

// 响应式网格
function ResponsiveGrid({ children }) {
  return (
    <div className="
      grid
      grid-cols-1
      sm:grid-cols-2
      lg:grid-cols-3
      xl:grid-cols-4
      gap-4
      md:gap-6
      lg:gap-8
    ">
      {children}
    </div>
  )
}

// Flex 布局
function FlexContainer({ children, direction = 'row' }) {
  return (
    <div className={`
      flex
      flex-${direction}
      items-center
      justify-between
      gap-4
    `}>
      {children}
    </div>
  )
}
```

---

## 常见错误和调试技巧

### 错误 1: 样式不生效

```html
<!-- ❌ 错误: 类名拼写错误 -->
<div class="text-bule-500">Text</div>

<!-- ✅ 正确: 使用正确的颜色名 -->
<div class="text-blue-500">Text</div>
```

### 错误 2: 响应式断点顺序

```html
<!-- ❌ 错误: 顺序错误 -->
<div class="md:w-1/2 w-full">...</div>

<!-- ✅ 正确: 从小到大排列 -->
<div class="w-full md:w-1/2">...</div>
```

### 错误 3: 暗色模式不生效

```html
<!-- ❌ 错误: 没有正确配置 darkMode -->
<!-- 确保 tailwind.config.js 中设置了 darkMode: 'class' -->

<!-- ✅ 正确: 使用 dark: 前缀 -->
<div class="bg-white dark:bg-gray-900">...</div>
```

### 错误 4: 使用 !important

```html
<!-- ❌ 错误: 不推荐使用 !important -->
<div class="!p-4">...</div>

<!-- ✅ 正确: 使用更高优先级的类 -->
<div class="p-4 md:p-6 lg:p-8">...</div>
```

---

## 实用技巧

### 1. 使用 arbitrary values (任意值)

```html
<!-- 使用任意值替代预定义类 -->
<div class="w-[300px]">任意宽度</div>
<div class="h-[50vh]">任意高度</div>
<div class="top-[100px]">任意位置</div>
<div class="bg-[#0891B2]">任意颜色</div>
<div class="rounded-[20px]">任意圆角</div>
```

### 2. 使用 CSS 变量

```css
/* globals.css */
:root {
  --color-primary: #0891B2;
}

/* 使用 var() */
<div class="bg-[var(--color-primary)]">
```

### 3. 条件类名

```typescript
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs))
}

function Button({ variant, className }: ButtonProps) {
  return (
    <button className={cn(
      'px-4 py-2 rounded-lg',
      variant === 'primary' && 'bg-blue-500 text-white',
      className
    )}>
      Click
    </button>
  )
}
```

### 4. 配置路径别名

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  // ...
}
```

---

## 总结

Tailwind CSS 的核心理念：

1. **原子化类名** - 组合构建复杂 UI
2. **响应式设计** - 移动优先断点
3. **状态变体** - hover、focus、active 等
4. **可配置** - 自定义主题和设计系统

掌握这些内容，你将能够快速构建现代化、响应式的用户界面。
