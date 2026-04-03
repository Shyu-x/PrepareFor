# Tailwind CSS 实战完全指南

> 本文档将带你从零基础到实战精通，全面掌握 Tailwind CSS v4 最新特性。文档基于 FastDocument 和 WebEnv-OS 项目中的实际应用编写，所有代码示例均经过实际项目验证。

---

## 目录

1. [Tailwind 基础](#1-tailwind-基础)
2. [核心概念](#2-核心概念)
3. [布局](#3-布局)
4. [样式](#4-样式)
5. [动画](#5-动画)
6. [暗黑模式](#6-暗黑模式)
7. [组件化](#7-组件化)
8. [自定义配置](#8-自定义配置)
9. [优化](#9-优化)
10. [集成](#10-集成)
11. [vs CSS Modules](#11-vs-css-modules)
12. [案例：Shadcn/ui](#12-案例shadcnui)
13. [总结与展望](#13-总结与展望)

---

## 1. Tailwind 基础

### 1.1 什么是 Tailwind CSS？

Tailwind CSS 是一个 utility-first（工具优先）的 CSS 框架，它提供了一套低层次的工具类（utility classes），让你可以直接在 HTML 中组合使用这些类来构建复杂的界面，而无需编写自定义 CSS 代码。

**核心哲学：**

```
传统 CSS 思维：先定义样式，再应用到元素
.foo { color: blue; font-size: 16px; }
<div class="foo">Hello</div>

Tailwind 思维：直接在元素上组合工具类
<div class="text-blue-500 text-base">Hello</div>
```

### 1.2 Utility First（工具优先）的优势

**1.2.1 快速原型开发**

使用传统 CSS，你需要在多个文件中来回切换：先写 HTML，再写 CSS，还要记得给元素添加类名。使用 Tailwind，你只需要专注于 HTML 文件：

```html
<!-- 传统CSS：需要至少两个文件 -->
<!-- style.css -->
.button { background: blue; color: white; padding: 12px 24px; border-radius: 8px; }
.button:hover { background: darkblue; }

<!-- index.html -->
<button class="button">点击我</button>

<!-- Tailwind：一气呵成 -->
<button class="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
  点击我
</button>
```

**1.2.2 样式一致性**

当你定义了一套设计系统后（颜色、间距、字体），Tailwind 会确保整个项目使用相同的值：

```html
<!-- 所有按钮都使用相同的主色调和间距 -->
<button class="bg-blue-500 px-6 py-3 rounded-lg">主要按钮</button>
<button class="bg-blue-500 px-6 py-3 rounded-lg">另一个主要按钮</button>
<a href="#" class="bg-blue-500 px-6 py-3 rounded-lg">链接形式的按钮</a>
```

**1.2.3 减少样式冲突**

传统 CSS 中，全局样式表中的 `.title` 可能会与第三方库的 `.title` 冲突。Tailwind 的类名是组合式的，每个类只负责一种样式：

```html
<!-- 绝对不会有冲突风险 -->
<div class="text-xl font-bold text-gray-900">标题</div>
<div class="text-xl font-bold text-gray-900">另一个标题</div>
```

### 1.3 原子化 CSS 解析

**1.3.1 什么是原子化 CSS？**

原子化 CSS（Atomic CSS）是一种 CSS 架构方法，其中每个 CSS 规则只包含一个声明（property: value）。Tailwind 正是这一理念的完美实现：

```css
/* 传统 CSS：一个类包含多个样式 */
.card {
  display: flex;
  padding: 16px;
  margin: 8px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* 原子化 CSS：每个类只负责一个样式 */
.flex { display: flex; }
.p-4 { padding: 16px; }
.m-2 { margin: 8px; }
.bg-white { background-color: white; }
.rounded-lg { border-radius: 8px; }
.shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
```

**1.3.2 Tailwind 的原子化策略**

Tailwind 并没有完全使用原子化 CSS 的方式（每个类只有一个样式），而是采用了"语义化工具类"的方式：

```html
<!-- Tailwind 的工具类语义清晰，易于理解 -->
<div class="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h2 class="text-xl font-semibold text-gray-800">卡片标题</h2>
  <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
    操作
  </button>
</div>
```

### 1.4 JIT 模式（实时编译）

**1.4.1 什么是 JIT？**

JIT（Just-In-Time）编译器是 Tailwind CSS v2 引入的核心特性，它在开发过程中按需生成 CSS，而不是预先生成所有可能的类。

**工作原理：**

```
传统方式（v1）：预先生成所有类
- 生成的文件包含所有可能的组合
- 文件体积巨大（通常 3-10MB）

JIT 方式（v2+）：按需编译
- 只生成你实际使用的类
- 文件体积小（通常 10-50KB）
```

**1.4.2 JIT 的优势**

```javascript
// tailwind.config.js
module.exports = {
  mode: 'jit',  // v3+ 默认启用，无需此配置
  // ...
}
```

**JIT 模式的特性：**

```html
<!-- 1. 任意值支持 -->
<div class="p-[17px]">自定义精确值</div>
<div class="bg-[#1da1f2]">自定义颜色</div>
<div class="grid-cols-[1fr,2fr,1fr]">自定义网格</div>

<!-- 2. 任意变体支持 -->
<div class="hover:not-checked:opacity-100">复杂变体组合</div>
<div class="first:pt-0 last:pb-0">伪类组合</div>

<!-- 3. 动态类名 -->
<div class="text-{{ isError ? 'red' : 'green' }}-500">三元表达式</div>
```

### 1.5 实战：快速上手

**1.5.1 安装 Tailwind CSS v4**

```bash
# 使用 npm 安装
npm install -D tailwindcss @tailwindcss/postcss

# 使用 pnpm
pnpm add -D tailwindcss @tailwindcss/postcss

# 使用 yarn
yarn add -D tailwindcss @tailwindcss/postcss
```

**1.5.2 创建 PostCSS 配置文件**

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

**1.5.3 创建 Tailwind 配置文件**

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,js,jsx,ts,tsx,vue,svelte}',
  ],
  theme: {
    extend: {
      // 自定义主题
    },
  },
  plugins: [],
}
```

**1.5.4 在 CSS 中引入 Tailwind**

```css
/* style.css 或 main.css */
@import "tailwindcss";
```

**1.5.5 第一个 Tailwind 页面**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>我的第一个 Tailwind 页面</title>
  <link rel="stylesheet" href="style.css">
</head>
<body class="bg-gray-100 min-h-screen flex items-center justify-center">
  <div class="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
    <h1 class="text-3xl font-bold text-gray-800 mb-4">
      欢迎使用 Tailwind CSS
    </h1>
    <p class="text-gray-600 mb-6">
      这是一个使用 utility-first 方式构建的现代化界面。
    </p>
    <button class="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold
                   py-3 px-6 rounded-lg transition-colors duration-200">
      开始学习
    </button>
  </div>
</body>
</html>
```

### 1.6 Tailwind v4 新特性

**1.6.1 引擎升级：Lightning CSS**

Tailwind CSS v4 使用 Lightning CSS 作为新的底层引擎，这是一个使用 Rust 编写的 CSS 解析器、转换器和压缩器：

```bash
# v4 的安装方式完全不同
npm install tailwindcss @tailwindcss/postcss
```

```javascript
// postcss.config.js - v4 简化配置
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

**1.6.2 @theme 指令**

v4 中最重要的变化是使用 CSS 原生的 `@theme` 指令来定义主题变量：

```css
/* v4 主题定义方式 */
@import "tailwindcss";

@theme {
  /* 自定义颜色 */
  --color-primary: #3b82f6;
  --color-secondary: #8b5cf6;

  /* 自定义间距 */
  --spacing-128: 32rem;

  /* 自定义圆角 */
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;

  /* 自定义动画 */
  --animate-fade-in: fade-in 0.5s ease-out;
}
```

**1.6.3 性能提升**

| 指标 | v3 | v4 |
|------|-----|-----|
| 开发环境构建速度 | 基准 | 3.5 倍提升 |
| 生产环境构建速度 | 基准 | 5 倍提升 |
| 热更新速度 | 基准 | 10 倍提升 |

---

## 2. 核心概念

### 2.1 工具类（Utility Classes）

**2.1.1 工具类的命名规范**

Tailwind 的工具类命名遵循一致的约定，让你能够"见名知意"：

```
{属性}-{值}-{状态?}

示例：
- text-center（文字对齐）
- font-bold（字体粗细）
- bg-blue-500（背景颜色）
- hover:bg-blue-700（悬停状态）
```

**命名组成部分：**

```html
<!-- 1. 属性前缀 -->
text-      /* 文字相关 */
bg-        /* 背景相关 */
p- / px- / py- / pt- / pr- / pb- / pl-  /* 内边距 */
m- / mx- / my- / mt- / mr- / mb- / ml-  /* 外边距 */
w- / h-    /* 宽度和高度 */
flex-      /* flexbox */
grid-      /* 网格 */
border-    /* 边框 */
rounded-   /* 圆角 */
shadow-    /* 阴影 */

<!-- 2. 值（通常是设计系统中的token） -->
sm / md / lg / xl / 2xl  /* 尺寸 */
gray-100 ~ gray-900      /* 颜色阶度 */
3 / 4 / 5 / 6 / 8 / 10 / 12  /* 具体数值 */

<!-- 3. 状态前缀（可选） -->
hover:    /* 悬停 */
focus:    /* 聚焦 */
active:   /* 激活 */
disabled: /* 禁用 */
first:    /* 第一个子元素 */
last:     /* 最后一个子元素 */
odd:      /* 奇数子元素 */
even:     /* 偶数子元素 */
```

**2.1.2 常用工具类速查表**

```html
<!-- 布局 -->
<div class="block inline-block hidden flex inline-flex grid">
<div class="float-right clear-both overflow-hidden">

<!-- 定位 -->
<div class="static fixed absolute relative sticky inset-0">

<!-- 尺寸 -->
<div class="w-1/2 w-full w-screen h-32 h-screen max-w-sm">

<!-- 间距 -->
<div class="p-4 px-4 py-2 mx-auto my-4 space-y-4">

<!-- 文字 -->
<p class="text-sm text-lg text-xl text-2xl text-4xl">
<p class="font-thin font-normal font-medium font-bold font-extrabold">
<p class="leading-tight leading-normal leading-relaxed">

<!-- 颜色 -->
<p class="text-gray-500 bg-white border border-gray-200">

<!-- 边框 -->
<div class="border border-2 border-t border-b border-gray-300">
<div class="rounded rounded-sm rounded-lg rounded-full rounded-xl">

<!-- 阴影 -->
<div class="shadow-sm shadow-md shadow-lg shadow-xl shadow-2xl">

<!-- 动画 -->
<button class="transition duration-200 ease-in-out">
```

### 2.2 响应式前缀

**2.2.1 断点系统**

Tailwind 提供了一套响应式断点，让你可以在不同屏幕尺寸下应用不同的样式：

```html
<!-- 响应式断点前缀 -->
sm:   /* >= 640px */
md:   /* >= 768px */
lg:   /* >= 1024px */
xl:   /* >= 1280px */
2xl:  /* >= 1536px */

/* 使用方式：{断点}:{工具类} */
<div class="block md:flex lg:block xl:flex">
  响应式布局
</div>
```

**2.2.2 实战：响应式卡片布局**

```html
<!-- 移动优先：默认单列显示 -->
<div class="container mx-auto p-4">
  <div class="space-y-4">
    <!-- 卡片1 -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h3 class="text-lg font-semibold text-gray-800">移动端标题</h3>
      <p class="mt-2 text-gray-600">在移动设备上垂直堆叠显示</p>
    </div>

    <!-- 卡片2 -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h3 class="text-lg font-semibold text-gray-800">卡片2</h3>
      <p class="mt-2 text-gray-600">内容区域</p>
    </div>
  </div>
</div>

<!--
  平板及以上（md）：两列布局
  桌面及以上（lg）：三列布局
-->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <!-- 卡片内容 -->
</div>

<!-- 完整响应式示例 -->
<article class="
  /* 基础样式：移动端 */
  flex flex-col p-4 bg-white rounded-lg shadow-sm

  /* 平板 */
  md:flex-row md:shadow-md

  /* 桌面 */
  lg:p-6 lg:shadow-lg

  /* 大屏 */
  xl:max-w-4xl
">
  <div class="flex-shrink-0">
    <img src="image.jpg" alt="图片" class="w-full h-48 md:w-48 md:h-auto object-cover rounded-lg">
  </div>
  <div class="mt-4 md:mt-0 md:ml-6">
    <h2 class="text-xl font-bold text-gray-900">响应式文章标题</h2>
    <p class="mt-2 text-gray-600">根据屏幕尺寸自动调整布局和间距</p>
  </div>
</article>
```

### 2.3 状态前缀

**2.3.1 伪类变体**

Tailwind 支持大量的 CSS 伪类，让你能够为元素的不同状态添加样式：

```html
<!-- 悬停状态 -->
<button class="bg-blue-500 hover:bg-blue-700 hover:text-white">
  悬停查看效果
</button>

<!-- 聚焦状态 -->
<input
  type="text"
  class="border-2 border-gray-300 focus:border-blue-500 focus:outline-none"
  placeholder="聚焦时显示蓝色边框"
>

<!-- 激活状态 -->
<button class="bg-red-500 active:bg-red-700">
  点击时变暗
</button>

<!-- 禁用状态 -->
<button class="bg-gray-300 text-gray-500 cursor-not-allowed disabled:opacity-50">
  禁用按钮
</button>

<!-- 组合状态 -->
<button class="
  bg-blue-500
  hover:bg-blue-600
  focus:ring-4 focus:ring-blue-300
  active:bg-blue-700
  disabled:bg-gray-300 disabled:cursor-not-allowed
">
  多状态按钮
</button>
```

**2.3.2 伪元素变体**

```html
<!-- 占位符样式 -->
<input
  type="text"
  placeholder="请输入内容"
  class="text-gray-900 placeholder-gray-400 bg-white border border-gray-300"
>

<!-- 选中状态（用于复选框和单选框） -->
<label class="flex items-center cursor-pointer">
  <input type="checkbox" class="w-5 h-5 text-blue-600 rounded border-gray-300
                                focus:ring-blue-500 checked:bg-blue-500">
  <span class="ml-2 text-gray-700">同意服务条款</span>
</label>

<!-- 文件输入框 -->
<input type="file" class="file:mr-4 file:py-2 file:px-4 file:rounded-full
                          file:border-0 file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100">
```

**2.3.3 结构化伪类**

```html
<!-- 第一个和最后一个子元素 -->
<ul class="space-y-2">
  <li class="first:font-bold first:text-blue-600 last:text-red-600">
    第一项（粗体蓝色）
  </li>
  <li>中间项</li>
  <li>中间项</li>
  <li class="first:font-bold first:text-blue-600 last:text-red-600">
    最后一项（红色）
  </li>
</ul>

<!-- 奇数和偶数子元素 -->
<table class="w-full">
  <tr class="odd:bg-gray-50 even:bg-white">
    <td>行1（灰色背景）</td>
  </tr>
  <tr class="odd:bg-gray-50 even:bg-white">
    <td>行2（白色背景）</td>
  </tr>
</table>

<!-- 指定子元素 -->
<div class="flex space-x-4">
  <div class="basis-1/3 nth-w-[33%]:border-l">
    第一列
  </div>
  <div class="basis-1/3">
    第二列
  </div>
  <div class="basis-1/3">
    第三列
  </div>
</div>
```

### 2.4 实战：基础用法

**2.4.1 构建一个现代化按钮**

```html
<!-- 基础按钮 -->
<button class="
  /* 基础样式 */
  inline-flex items-center justify-center
  px-6 py-3

  /* 文字样式 */
  text-base font-medium

  /* 颜色 */
  text-white bg-blue-600

  /* 边框和圆角 */
  border border-transparent rounded-lg

  /* 阴影 */
  shadow-sm

  /* 过渡动画 */
  transition-all duration-200 ease-in-out

  /* 状态样式 */
  hover:bg-blue-700 hover:shadow-md
  focus:outline-none focus:ring-4 focus:ring-blue-300
  active:bg-blue-800
  disabled:opacity-50 disabled:cursor-not-allowed
">
  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
         d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
  </svg>
  添加新项目
</button>
```

**2.4.2 构建一个卡片组件**

```html
<div class="max-w-sm mx-auto bg-white rounded-xl shadow-md overflow-hidden
           hover:shadow-lg transition-shadow duration-300">
  <div class="md:flex">
    <!-- 图片区域 -->
    <div class="md:shrink-0">
      <img
        class="h-48 w-full object-cover md:h-full md:w-48"
        src="/api/placeholder/400/300"
        alt="卡片图片"
      >
    </div>

    <!-- 内容区域 -->
    <div class="p-8">
      <!-- 标签 -->
      <div class="uppercase tracking-wide text-sm text-indigo-500
                  font-semibold mb-1">
        技术教程
      </div>

      <!-- 标题 -->
      <h2 class="block mt-1 text-lg leading-tight font-medium text-black
                 hover:underline">
        Tailwind CSS 完全指南
      </h2>

      <!-- 描述 -->
      <p class="mt-2 text-slate-500">
        从基础概念到高级用法，全面掌握这个强大的 utility-first CSS 框架。
      </p>

      <!-- 底部信息 -->
      <div class="mt-4 flex items-center justify-between">
        <span class="text-slate-400 text-sm">阅读时间：10 分钟</span>
        <button class="text-indigo-600 hover:text-indigo-800 font-medium
                       text-sm transition-colors">
          开始阅读 →
        </button>
      </div>
    </div>
  </div>
</div>
```

---

## 3. 布局

### 3.1 Flexbox 布局

**3.1.1 Flex 容器基础**

```html
<!-- 基础 flex 容器 -->
<div class="flex">
  <div>子元素1</div>
  <div>子元素2</div>
  <div>子元素3</div>
</div>

<!-- 行方向（默认） -->
<div class="flex flex-row">
  <div>左到右</div>
</div>

<!-- 列方向 -->
<div class="flex flex-col">
  <div>上到下</div>
</div>

<!-- 反向 -->
<div class="flex flex-row-reverse">
  <div>右到左</div>
</div>
<div class="flex flex-col-reverse">
  <div>下到上</div>
</div>
```

**3.1.2 主轴对齐（justify-content）**

```html
<!-- 主轴对齐方式 -->
<div class="flex justify-start">左对齐</div>
<div class="flex justify-center">居中</div>
<div class="flex justify-end">右对齐</div>
<div class="flex justify-between">两端对齐，元素之间间距相等</div>
<div class="flex justify-around">每个元素周围间距相等</div>
<div class="flex justify-evenly">所有间距都相等</div>
```

**3.1.3 交叉轴对齐（align-items）**

```html
<!-- 交叉轴对齐方式 -->
<div class="flex items-start">顶部对齐</div>
<div class="flex items-center">垂直居中</div>
<div class="flex items-end">底部对齐</div>
<div class="flex items-baseline">基线对齐</div>
<div class="flex items-stretch">拉伸填充（默认）</div>
```

**3.1.4 多行对齐（align-content）**

```html
<!-- 多行内容对齐（需要 flex-wrap） -->
<div class="flex flex-wrap content-start">行顶部对齐</div>
<div class="flex flex-wrap content-center">行垂直居中</div>
<div class="flex flex-wrap content-end">行底部对齐</div>
<div class="flex flex-wrap content-between">行之间间距相等</div>
<div class="flex flex-wrap content-around">每行周围间距相等</div>
<div class="flex flex-wrap content-stretch">行拉伸填充</div>
```

**3.1.5 Flex 项属性**

```html
<!-- flex-grow 和 flex-shrink -->
<div class="flex">
  <div class="flex-grow">占满剩余空间</div>
  <div>固定宽度</div>
</div>

<!-- flex-shrink -->
<div class="flex">
  <div class="w-32 flex-shrink-0">不会被压缩</div>
  <div class="flex-1">可压缩</div>
</div>

<!-- flex-basis -->
<div class="flex">
  <div class="flex-basis-1/2">占一半宽度</div>
  <div>自动宽度</div>
</div>

<!-- 简写：flex-{grow}-{shrink} -->
<div class="flex">
  <div class="flex-1">flex: 1 1 0%</div>
  <div class="flex-auto">flex: 1 1 auto</div>
  <div class="flex-none">flex: 0 0 auto</div>
</div>

<!-- align-self -->
<div class="flex h-32">
  <div class="self-start">顶部对齐</div>
  <div class="self-center">垂直居中</div>
  <div class="self-end">底部对齐</div>
</div>
```

### 3.2 Grid 布局

**3.2.1 Grid 容器基础**

```html
<!-- 基础 grid 容器 -->
<div class="grid">
  <div>网格项1</div>
  <div>网格项2</div>
  <div>网格项3</div>
</div>

<!-- 指定列数 -->
<div class="grid grid-cols-1">单列</div>
<div class="grid grid-cols-2">两列</div>
<div class="grid grid-cols-3">三列</div>
<div class="grid grid-cols-4">四列</div>
<div class="grid grid-cols-6">六列</div>
<div class="grid grid-cols-12">十二列</div>

<!-- 自动列 -->
<div class="grid grid-cols-auto">根据内容自动列宽</div>
<div class="grid grid-cols-fr">使用 fr 单位</div>
```

**3.2.2 行和列间距**

```html
<!-- gap（间距） -->
<div class="grid grid-cols-3 gap-0">无间距</div>
<div class="grid grid-cols-3 gap-4">4单位间距</div>
<div class="grid grid-cols-3 gap-x-4 gap-y-8">分别设置水平和垂直间距</div>

<!-- 响应式间距 -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
```

**3.2.3 Grid 定位**

```html
<!-- 跨越多列 -->
<div class="grid grid-cols-4">
  <div class="col-span-1">占1列</div>
  <div class="col-span-2">占2列</div>
  <div class="col-span-1">占1列</div>
</div>

<!-- 跨越多行 -->
<div class="grid grid-cols-3 grid-rows-3">
  <div class="row-span-2">占2行</div>
  <div>普通项</div>
  <div>普通项</div>
</div>

<!-- 起始位置 -->
<div class="grid grid-cols-4">
  <div class="col-start-1">从第1列开始</div>
  <div class="col-start-2 col-end-4">从第2列开始，第4列结束</div>
</div>
```

**3.2.4 Grid 模板**

```html
<!-- 定义网格轨道 -->
<div class="grid grid-cols-[200px,1fr,200px]">
  <!-- 左侧边栏 固定200px，中间内容自适应，右侧边栏固定200px -->
  <aside>左侧边栏</aside>
  <main>主内容</main>
  <aside>右侧边栏</aside>
</div>

<!-- 自动填充和自动适应 -->
<div class="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
  <!-- 自动创建尽可能多的列，每列最小250px -->
  <div>响应式卡片</div>
  <div>响应式卡片</div>
  <div>响应式卡片</div>
</div>

<div class="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
  <!-- auto-fit 会填满整个容器 -->
  <div>自适应卡片</div>
  <div>自适应卡片</div>
</div>
```

### 3.3 Spacing（间距）

**3.3.1 间距系统**

Tailwind 的间距系统基于 0.25rem（4px）的倍数：

| Token | 值 | 用途 |
|-------|-----|------|
| 0 | 0px | 无间距 |
| 1 | 0.25rem (4px) | 微调 |
| 2 | 0.5rem (8px) | 小间距 |
| 3 | 0.75rem (12px) | 小间距 |
| 4 | 1rem (16px) | 标准间距 |
| 5 | 1.25rem (20px) | 中等间距 |
| 6 | 1.5rem (24px) | 中等间距 |
| 8 | 2rem (32px) | 大间距 |
| 10 | 2.5rem (40px) | 大间距 |
| 12 | 3rem (48px) | 特大间距 |
| 16 | 4rem (64px) | 特大间距 |
| 20 | 5rem (80px) | 超大间距 |
| 24 | 6rem (96px) | 超大间距 |
| 32 | 8rem (128px) | 极大间距 |

**3.3.2 边距 vs 内边距**

```html
<!-- 外边距（margin） -->
<div class="m-4">所有方向 16px</div>
<div class="mx-4">水平（左右）16px</div>
<div class="my-4">垂直（上下）16px</div>
<div class="mt-4">上 16px</div>
<div class="mr-4">右 16px</div>
<div class="mb-4">下 16px</div>
<div class="ml-4">左 16px</div>

<!-- 内边距（padding） -->
<div class="p-4">所有方向 16px</div>
<div class="px-4">水平（左右）16px</div>
<div class="py-4">垂直（上下）16px</div>
<div class="pt-4">上 16px</div>
<div class="pr-4">右 16px</div>
<div class="pb-4">下 16px</div>
<div class="pl-4">左 16px</div>
```

**3.3.3 负值间距**

```html
<!-- 负值外边距 -->
<div class="-mt-4">向上偏移 -16px</div>
<div class="-mx-2">水平负偏移 -8px</div>

<!-- 使用场景：卡片重叠效果 -->
<div class="relative">
  <div class="absolute -top-4 left-4 bg-white rounded-lg shadow-lg p-4 z-10">
    重叠在上方的卡片
  </div>
  <div class="bg-gray-200 rounded-lg p-8">
    底层卡片
  </div>
</div>

<!-- 使用场景：负边距补偿 -->
<div class="flex">
  <div class="w-1/3 -mr-4">向左延伸</div>
  <div class="w-1/3 bg-white">保持位置</div>
</div>
```

**3.3.4 空间隔离（Space Between）**

```html
<!-- space-x- 和 space-y- 在子元素之间添加间距 -->
<div class="flex space-x-4">
  <div>子元素1</div>  <!-- 添加右侧间距 -->
  <div>子元素2</div>  <!-- 添加右侧间距 -->
  <div>子元素3</div>
</div>

<!-- 垂直空间隔离 -->
<div class="flex flex-col space-y-4">
  <div>元素1</div>
  <div>元素2</div>
  <div>元素3</div>
</div>

<!-- 响应式空间隔离 -->
<div class="flex flex-col md:flex-row md:space-x-4 md:space-y-0 space-y-4">
  <!-- 移动端垂直排列，桌面端水平排列 -->
</div>
```

### 3.4 实战：布局实践

**3.4.1 经典圣杯布局**

```html
<!-- 经典圣杯布局：头部、侧边栏、主内容、另一侧边栏、底部 -->
<div class="flex flex-col h-screen">
  <!-- 头部 -->
  <header class="h-16 bg-blue-600 text-white flex items-center px-6">
    <h1 class="text-xl font-bold">网站标题</h1>
    <nav class="ml-auto flex space-x-4">
      <a href="#" class="hover:underline">首页</a>
      <a href="#" class="hover:underline">关于</a>
      <a href="#" class="hover:underline">联系</a>
    </nav>
  </header>

  <!-- 中间内容区 -->
  <div class="flex flex-1 overflow-hidden">
    <!-- 左侧边栏 -->
    <aside class="w-64 bg-gray-100 p-4 overflow-y-auto">
      <h2 class="font-semibold mb-4">导航菜单</h2>
      <ul class="space-y-2">
        <li><a href="#" class="block py-1 hover:text-blue-600">菜单一</a></li>
        <li><a href="#" class="block py-1 hover:text-blue-600">菜单二</a></li>
        <li><a href="#" class="block py-1 hover:text-blue-600">菜单三</a></li>
      </ul>
    </aside>

    <!-- 主内容区 -->
    <main class="flex-1 p-6 overflow-y-auto bg-white">
      <h2 class="text-2xl font-bold mb-4">主内容区域</h2>
      <p class="text-gray-600 mb-4">
        这是页面的主要内容区域，可以根据实际需求填充内容。
      </p>
      <!-- 内容卡片 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div class="bg-gray-50 p-4 rounded-lg">内容卡片1</div>
        <div class="bg-gray-50 p-4 rounded-lg">内容卡片2</div>
        <div class="bg-gray-50 p-4 rounded-lg">内容卡片3</div>
      </div>
    </main>

    <!-- 右侧边栏 -->
    <aside class="w-48 bg-gray-50 p-4 overflow-y-auto">
      <h2 class="font-semibold mb-4">快捷操作</h2>
      <button class="w-full bg-blue-500 text-white py-2 rounded mb-2
                     hover:bg-blue-600 transition-colors">
        新建
      </button>
      <button class="w-full bg-green-500 text-white py-2 rounded
                     hover:bg-green-600 transition-colors">
        保存
      </button>
    </aside>
  </div>

  <!-- 底部 -->
  <footer class="h-12 bg-gray-200 text-center text-sm text-gray-600
                 flex items-center justify-center">
    © 2024 我的网站. 保留所有权利.
  </footer>
</div>
```

**3.4.2 响应式仪表盘布局**

```html
<!-- 响应式仪表盘 -->
<div class="min-h-screen bg-gray-100">
  <!-- 顶部导航 -->
  <nav class="bg-white shadow-sm sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <!-- Logo -->
        <div class="flex items-center">
          <span class="text-xl font-bold text-blue-600">Dashboard</span>
        </div>

        <!-- 移动端菜单按钮 -->
        <div class="flex items-center sm:hidden">
          <button class="p-2 rounded-md text-gray-400 hover:text-gray-500">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                   d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </div>

        <!-- 桌面端导航 -->
        <div class="hidden sm:flex sm:items-center sm:space-x-4">
          <a href="#" class="text-gray-900 font-medium">概览</a>
          <a href="#" class="text-gray-500 hover:text-gray-900">项目</a>
          <a href="#" class="text-gray-500 hover:text-gray-900">团队</a>
          <a href="#" class="text-gray-500 hover:text-gray-900">设置</a>
        </div>
      </div>
    </div>
  </nav>

  <!-- 主内容 -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">总收入</p>
            <p class="text-2xl font-bold text-gray-900">¥45,231</p>
          </div>
          <div class="bg-green-100 rounded-full p-3">
            <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor"
                 viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                   d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
        <div class="mt-4 flex items-center text-sm">
          <span class="text-green-500 font-medium">+12%</span>
          <span class="text-gray-500 ml-2">较上月</span>
        </div>
      </div>

      <!-- 其他统计卡片 -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">用户数</p>
            <p class="text-2xl font-bold text-gray-900">2,350</p>
          </div>
          <div class="bg-blue-100 rounded-full p-3">
            <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor"
                 viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                   d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </div>
        </div>
        <div class="mt-4 flex items-center text-sm">
          <span class="text-green-500 font-medium">+5%</span>
          <span class="text-gray-500 ml-2">较上月</span>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">销售趋势</h3>
        <div class="h-64 bg-gray-50 rounded flex items-center justify-center">
          图表区域
        </div>
      </div>
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">用户分布</h3>
        <div class="h-64 bg-gray-50 rounded flex items-center justify-center">
          图表区域
        </div>
      </div>
    </div>

    <!-- 最近活动 -->
    <div class="bg-white rounded-lg shadow">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">最近活动</h3>
      </div>
      <div class="divide-y divide-gray-200">
        <div class="px-6 py-4 flex items-center">
          <div class="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-full flex
                      items-center justify-center text-white font-bold">
            A
          </div>
          <div class="ml-4 flex-1">
            <p class="text-sm font-medium text-gray-900">张三</p>
            <p class="text-sm text-gray-500">创建了新项目</p>
          </div>
          <div class="text-sm text-gray-400">5分钟前</div>
        </div>
        <div class="px-6 py-4 flex items-center">
          <div class="flex-shrink-0 h-10 w-10 bg-green-500 rounded-full flex
                      items-center justify-center text-white font-bold">
            L
          </div>
          <div class="ml-4 flex-1">
            <p class="text-sm font-medium text-gray-900">李四</p>
            <p class="text-sm text-gray-500">更新了配置文件</p>
          </div>
          <div class="text-sm text-gray-400">1小时前</div>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## 4. 样式

### 4.1 颜色系统

**4.1.1 默认调色板**

Tailwind 提供了一套完整的调色板，每个颜色从 50 到 900（以及 950）：

```html
<!-- 灰色系 -->
<div class="bg-gray-50">bg-gray-50</div>
<div class="bg-gray-100">bg-gray-100</div>
<div class="bg-gray-200">bg-gray-200</div>
<div class="bg-gray-300">bg-gray-300</div>
<div class="bg-gray-400">bg-gray-400</div>
<div class="bg-gray-500">bg-gray-500</div>
<div class="bg-gray-600">bg-gray-600</div>
<div class="bg-gray-700">bg-gray-700</div>
<div class="bg-gray-800">bg-gray-800</div>
<div class="bg-gray-900">bg-gray-900</div>

<!-- 主要颜色 -->
<div class="bg-blue-500">蓝色</div>
<div class="bg-red-500">红色</div>
<div class="bg-green-500">绿色</div>
<div class="bg-yellow-500">黄色</div>
<div class="bg-purple-500">紫色</div>
<div class="bg-pink-500">粉色</div>
<div class="bg-indigo-500">靛蓝</div>
<div class="bg-teal-500">青色</div>
<div class="bg-orange-500">橙色</div>
```

**4.1.2 文字颜色和边框颜色**

```html
<!-- 文字颜色 -->
<p class="text-red-500">红色文字</p>
<p class="text-blue-600">深蓝色文字</p>
<p class="text-gray-400">浅灰色文字</p>

<!-- 边框颜色 -->
<div class="border border-red-500">红色边框</div>
<div class="border-2 border-blue-500">2px蓝色边框</div>
<div class="border-t-4 border-green-500">顶部4px绿色边框</div>

<!-- 组合使用 -->
<button class="bg-blue-500 text-white border-2 border-blue-600
               hover:bg-blue-600 hover:border-blue-700">
  按钮
</button>
```

**4.1.3 不透明度**

```html
<!-- 使用 opacity 值 -->
<div class="bg-blue-500 bg-opacity-0">完全透明</div>
<div class="bg-blue-500 bg-opacity-25">25% 透明度</div>
<div class="bg-blue-500 bg-opacity-50">50% 透明度</div>
<div class="bg-blue-500 bg-opacity-75">75% 透明度</div>
<div class="bg-blue-500 bg-opacity-100">完全不透明</div>

<!-- v4 方式：使用 slash 语法 -->
<div class="bg-blue-500/0">完全透明（v4）</div>
<div class="bg-blue-500/25">25% 透明度（v4）</div>
<div class="bg-blue-500/50">50% 透明度（v4）</div>
<div class="bg-blue-500/75">75% 透明度（v4）</div>
<div class="bg-blue-500">完全不透明（v4）</div>

<!-- 文字颜色不透明度 -->
<p class="text-blue-500/50">50% 透明度的蓝色文字</p>

<!-- 边框颜色不透明度 -->
<div class="border border-blue-500/50">50% 透明度的蓝色边框</div>
```

### 4.2 字体样式

**4.2.1 字体大小**

```html
<!-- 字体大小类：text-{size} -->
<p class="text-xs">超小字体 (0.75rem / 12px)</p>
<p class="text-sm">小字体 (0.875rem / 14px)</p>
<p class="text-base">基础字体 (1rem / 16px)</p>
<p class="text-lg">大字体 (1.125rem / 18px)</p>
<p class="text-xl">特大字体 (1.25rem / 20px)</p>
<p class="text-2xl">2倍字体 (1.5rem / 24px)</p>
<p class="text-3xl">3倍字体 (1.875rem / 30px)</p>
<p class="text-4xl">4倍字体 (2.25rem / 36px)</p>
<p class="text-5xl">5倍字体 (3rem / 48px)</p>
<p class="text-6xl">6倍字体 (3.75rem / 60px)</p>
<p class="text-7xl">7倍字体 (4.5rem / 72px)</p>
<p class="text-8xl">8倍字体 (6rem / 96px)</p>
<p class="text-9xl">9倍字体 (8rem / 128px)</p>

<!-- 响应式字体大小 -->
<p class="text-sm md:text-base lg:text-lg">
  根据屏幕尺寸自动调整字体大小
</p>
```

**4.2.2 字体粗细**

```html
<!-- 字体粗细类：font-{weight} -->
<p class="font-thin">字体粗细 100</p>
<p class="font-extralight">字体粗细 200</p>
<p class="font-light">字体粗细 300</p>
<p class="font-normal">字体粗细 400（默认）</p>
<p class="font-medium">字体粗细 500</p>
<p class="font-semibold">字体粗细 600</p>
<p class="font-bold">字体粗细 700</p>
<p class="font-extrabold">字体粗细 800</p>
<p class="font-black">字体粗细 900</p>
```

**4.2.3 字体系列**

```html
<!-- 无衬线字体（默认） -->
<p class="font-sans">Sans-serif 字体族</p>

<!-- 衬线字体 -->
<p class="font-serif">Serif 字体族</p>

<!-- 等宽字体 -->
<p class="font-mono">Monospace 字体族</p>

<!-- 自定义字体（在配置中添加） -->
<!-- tailwind.config.js -->
<!-- module.exports = { -->
<!--   theme: { -->
<!--     fontFamily: { -->
<!--       display: ['Inter', 'sans-serif'], -->
<!--       body: ['Open Sans', 'sans-serif'], -->
<!--     } -->
<!--   } -->
<!-- } -->

<p class="font-display">使用自定义显示字体</p>
<p class="font-body">使用自定义正文字体</p>
```

**4.2.4 行高和字间距**

```html
<!-- 行高：leading-{size} -->
<p class="leading-none">行高 1</p>
<p class="leading-tight">行高 1.25</p>
<p class="leading-snug">行高 1.375</p>
<p class="leading-normal">行高 1.5（默认）</p>
<p class="leading-relaxed">行高 1.625</p>
<p class="leading-loose">行高 2</p>
<p class="leading-3">行高 0.75rem</p>
<p class="leading-4">行高 1rem</p>
<p class="leading-5">行高 1.25rem</p>
<p class="leading-6">行高 1.5rem</p>
<p class="leading-7">行高 1.75rem</p>
<p class="leading-8">行高 2rem</p>
<p class="leading-9">行高 2.25rem</p>
<p class="leading-10">行高 2.5rem</p>

<!-- 字间距：tracking-{size} -->
<p class="tracking-tighter">字间距 -0.05em</p>
<p class="tracking-tight">字间距 -0.025em</p>
<p class="tracking-normal">字间距 0（默认）</p>
<p class="tracking-wide">字间距 0.025em</p>
<p class="tracking-wider">字间距 0.05em</p>
<p class="tracking-widest">字间距 0.1em</p>

<!-- 大写字母间距 -->
<p class="uppercase tracking-widest">大写字母间距最大</p>
```

**4.2.5 文字装饰和换行**

```html
<!-- 文字装饰 -->
<p class="underline">下划线</p>
<p class="overline">上划线</p>
<p class="line-through">删除线</p>
<p class="no-underline">无装饰（覆盖默认下划线）</p>

<!-- 装饰颜色和样式 -->
<p class="underline decoration-blue-500">蓝色下划线</p>
<p class="underline decoration-2">2px 粗下划线</p>
<p class="underline decoration-double">双线装饰</p>
<p class="underline decoration-dotted">点线装饰</p>
<p class="underline decoration-dashed">虚线装饰</p>
<p class="underline decoration-wavy">波浪线装饰</p>

<!-- 装饰偏移 -->
<p class="underline decoration-blue-500 underline-offset-4">
  下划线偏移4px
</p>

<!-- 文字换行 -->
<p class="whitespace-normal">正常换行（默认）</p>
<p class="whitespace-nowrap">不换行</p>
<p class="whitespace-pre">保留空格</p>
<p class="whitespace-pre-line">保留换行</p>
<p class="whitespace-pre-wrap">保留空格和换行</p>

<!-- 文字溢出 -->
<p class="overflow-auto">自动处理溢出</p>
<p class="overflow-hidden">隐藏溢出内容</p>
<p class="overflow-visible">显示溢出内容</p>
<p class="overflow-x-auto">水平滚动</p>
<p class="overflow-y-auto">垂直滚动</p>

<!-- 文本溢出省略 -->
<p class="truncate">单行省略号（需要固定宽度）</p>
<p class="text-ellipsis overflow-hidden">文字溢出省略</p>
<p class="line-clamp-2">限制2行</p>
<p class="line-clamp-3">限制3行</p>
<p class="line-clamp-4">限制4行</p>
```

### 4.3 边框

**4.3.1 边框宽度**

```html
<!-- 边框宽度 -->
<div class="border">1px 边框（默认）</div>
<div class="border-0">无边框</div>
<div class="border-2">2px 边框</div>
<div class="border-4">4px 边框</div>
<div class="border-8">8px 边框</div>

<!-- 单边边框 -->
<div class="border-t">顶部边框</div>
<div class="border-r">右边框</div>
<div class="border-b">底部边框</div>
<div class="border-l">左边框</div>

<!-- 组合宽度 -->
<div class="border-t-2 border-r-4 border-b border-l-0">
  不同边不同宽度
</div>
```

**4.3.2 边框颜色**

```html
<!-- 边框颜色 -->
<div class="border border-gray-300">灰色边框</div>
<div class="border border-blue-500">蓝色边框</div>
<div class="border border-red-500">红色边框</div>

<!-- 带透明度的边框 -->
<div class="border border-blue-500/50">50%透明度蓝色边框</div>

<!-- 不同边不同颜色 -->
<div class="border-t-2 border-r-4 border-b border-l border-blue-500
            border-green-500 border-red-500 border-yellow-500">
  不同边不同颜色
</div>
```

**4.3.3 边框样式**

```html
<!-- 边框样式 -->
<div class="border-solid">实线边框（默认）</div>
<div class="border-dashed">虚线边框</div>
<div class="border-dotted">点线边框</div>
<div class="border-double">双线边框</div>
<div class="border-hidden">隐藏边框</div>
<div class="border-none">无边框</div>
```

**4.3.4 圆角**

```html
<!-- 圆角大小 -->
<div class="rounded-none">无圆角</div>
<div class="rounded-sm">小圆角 (0.125rem / 2px)</div>
<div class="rounded">默认圆角 (0.25rem / 4px)</div>
<div class="rounded-md">中等圆角 (0.375rem / 6px)</div>
<div class="rounded-lg">大圆角 (0.5rem / 8px)</div>
<div class="rounded-xl">特大圆角 (0.75rem / 12px)</div>
<div class="rounded-2xl">2倍圆角 (1rem / 16px)</div>
<div class="rounded-3xl">3倍圆角 (1.5rem / 24px)</div>
<div class="rounded-full">圆形/药丸形</div>

<!-- 单边圆角 -->
<div class="rounded-t-none">顶部无圆角</div>
<div class="rounded-t-sm">顶部小圆角</div>
<div class="rounded-t">顶部默认圆角</div>
<div class="rounded-tr">右上角圆角</div>
<div class="rounded-tr-sm">右上角小圆角</div>
<div class="rounded-tr-lg">右上角大圆角</div>

<!-- 组合单边圆角 -->
<div class="rounded-tl-lg rounded-tr-lg rounded-b-lg">
  顶部双角大圆角，底部大圆角
</div>
```

### 4.4 阴影

**4.4.1 阴影大小**

```html
<!-- 阴影大小 -->
<div class="shadow-sm">小阴影（用于卡片悬停等）</div>
<div class="shadow">默认阴影</div>
<div class="shadow-md">中等阴影</div>
<div class="shadow-lg">大阴影</div>
<div class="shadow-xl">特大阴影</div>
<div class="shadow-2xl">2倍大阴影</div>
<div class="shadow-inner">内阴影</div>
<div class="shadow-none">无阴影</div>

<!-- 使用场景示例 -->
<button class="shadow-sm hover:shadow-md">按钮悬停效果</button>
<div class="shadow-lg">卡片阴影</div>
<input class="shadow-inner">输入框内阴影</input>
```

**4.4.2 阴影颜色**

```html
<!-- 带颜色的阴影（v3.4+） -->
<div class="shadow-blue-500/50">蓝色阴影50%透明度</div>
<div class="shadow-red-500 shadow-xl">红色大阴影</div>
<div class="shadow-purple-500/25">淡紫色阴影</div>

<!-- 使用场景：霓虹灯效果 -->
<div class="shadow-lg shadow-blue-500/50">
  蓝色发光效果
</div>
<div class="shadow-lg shadow-pink-500/50">
  粉色发光效果
</div>
```

### 4.5 实战：样式实践

**4.5.1 现代化表单样式**

```html
<form class="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
  <h2 class="text-2xl font-bold text-gray-800 mb-6">用户注册</h2>

  <!-- 用户名输入框 -->
  <div class="mb-4">
    <label class="block text-sm font-medium text-gray-700 mb-2" for="username">
      用户名
    </label>
    <input
      type="text"
      id="username"
      class="w-full px-4 py-2 border border-gray-300 rounded-lg
             focus:outline-none focus:ring-2 focus:ring-blue-500
             focus:border-transparent transition-all duration-200
             placeholder-gray-400 text-gray-900"
      placeholder="请输入用户名"
    >
  </div>

  <!-- 邮箱输入框 -->
  <div class="mb-4">
    <label class="block text-sm font-medium text-gray-700 mb-2" for="email">
      邮箱
    </label>
    <input
      type="email"
      id="email"
      class="w-full px-4 py-2 border border-gray-300 rounded-lg
             focus:outline-none focus:ring-2 focus:ring-blue-500
             focus:border-transparent transition-all duration-200
             placeholder-gray-400 text-gray-900"
      placeholder="example@email.com"
    >
  </div>

  <!-- 密码输入框 -->
  <div class="mb-6">
    <label class="block text-sm font-medium text-gray-700 mb-2" for="password">
      密码
    </label>
    <input
      type="password"
      id="password"
      class="w-full px-4 py-2 border border-gray-300 rounded-lg
             focus:outline-none focus:ring-2 focus:ring-blue-500
             focus:border-transparent transition-all duration-200
             placeholder-gray-400 text-gray-900"
      placeholder="••••••••"
    >
    <p class="mt-1 text-xs text-gray-500">
      密码长度至少8位，包含字母和数字
    </p>
  </div>

  <!-- 提交按钮 -->
  <button
    type="submit"
    class="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800
           text-white font-semibold py-3 px-4 rounded-lg
           shadow-sm hover:shadow-md transition-all duration-200
           focus:outline-none focus:ring-4 focus:ring-blue-300
           disabled:opacity-50 disabled:cursor-not-allowed"
  >
    注册
  </button>

  <!-- 社交登录 -->
  <div class="mt-6 relative">
    <div class="absolute inset-0 flex items-center">
      <div class="w-full border-t border-gray-300"></div>
    </div>
    <div class="relative flex justify-center text-sm">
      <span class="px-2 bg-white text-gray-500">或</span>
    </div>
  </div>

  <div class="mt-6 grid grid-cols-2 gap-4">
    <button class="flex items-center justify-center px-4 py-2
                    border border-gray-300 rounded-lg hover:bg-gray-50
                    transition-colors duration-200">
      <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
        <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
      </svg>
      <span class="text-sm font-medium text-gray-700">Google</span>
    </button>
    <button class="flex items-center justify-center px-4 py-2
                    border border-gray-300 rounded-lg hover:bg-gray-50
                    transition-colors duration-200">
      <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
      </svg>
      <span class="text-sm font-medium text-gray-700">GitHub</span>
    </button>
  </div>
</form>
```

---

## 5. 动画

### 5.1 Transition（过渡）

**5.1.1 过渡属性**

```html
<!-- 过渡属性 -->
<div class="transition-none">无过渡</div>
<div class="transition-all">所有属性过渡（默认）</div>
<div class="transition">过渡（默认）</div>
<div class="transition-colors">仅颜色过渡</div>
<div class="transition-opacity">仅透明度过渡</div>
<div class="transition-transform">仅变换过渡</div>
```

**5.1.2 过渡时长**

```html
<!-- 过渡时长 -->
<div class="duration-0">0ms（无动画）</div>
<div class="duration-75">75ms</div>
<div class="duration-100">100ms</div>
<div class="duration-150">150ms</div>
<div class="duration-200">200ms</div>
<div class="duration-300">300ms</div>
<div class="duration-500">500ms</div>
<div class="duration-700">700ms</div>
<div class="duration-1000">1000ms（1秒）</div>
```

**5.1.3 缓动函数**

```html
<!-- 缓动函数 -->
<div class="ease-linear">线性（匀速）</div>
<div class="ease-in">由慢到快</div>
<div class="ease-out">由快到慢</div>
<div class="ease-in-out">由慢到快再到慢</div>
<div class="ease-in-[cubic-bezier(0.4,0,1,1)]">自定义贝塞尔曲线</div>
<div class="ease-out-[cubic-bezier(0,0,0.2,1)]">自定义贝塞尔曲线</div>
```

**5.1.4 延迟**

```html
<!-- 动画延迟 -->
<div class="delay-0">无延迟</div>
<div class="delay-75">75ms 延迟</div>
<div class="delay-100">100ms 延迟</div>
<div class="delay-150">150ms 延迟</div>
<div class="delay-200">200ms 延迟</div>
<div class="delay-300">300ms 延迟</div>
<div class="delay-500">500ms 延迟</div>
<div class="delay-1000">1000ms（1秒）延迟</div>

<!-- 组合使用：依次出现的效果 -->
<div class="flex space-x-4">
  <div class="w-10 h-10 bg-blue-500 rounded transition-all duration-300 delay-0"></div>
  <div class="w-10 h-10 bg-blue-500 rounded transition-all duration-300 delay-100"></div>
  <div class="w-10 h-10 bg-blue-500 rounded transition-all duration-300 delay-200"></div>
</div>
```

### 5.2 Animation（动画）

**5.2.1 内置动画**

```html
<!-- 内置动画类 -->
<div class="animate-none">无动画</div>
<div class="animate-spin">旋转动画</div>
<div class="animate-ping">脉冲动画（缩放+透明度）</div>
<div class="animate-pulse">呼吸动画（透明度变化）</div>
<div class="animate-bounce">弹跳动画（上下移动）</div>

<!-- 使用场景 -->
<button class="bg-blue-500 hover:bg-blue-600 transition-colors duration-200">
  按钮
</button>

<!-- 加载指示器 -->
<div class="flex space-x-2">
  <div class="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
  <div class="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-100"></div>
  <div class="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-200"></div>
</div>

<!-- 旋转加载器 -->
<button class="px-4 py-2 bg-blue-500 rounded-lg flex items-center">
  <svg class="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
            stroke-width="4"></circle>
    <path class="opacity-75" fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
  加载中
</button>
```

### 5.3 Keyframes（关键帧）

**5.3.1 自定义动画**

在 Tailwind 配置中定义自定义动画和关键帧：

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      // 自定义关键帧
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'wiggle': {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        'ping-slow': {
          '75%, 100%': { transform: 'scale(2)', opacity: '0' },
        },
      },
      // 动画类名
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
        'slide-down': 'slide-down 0.5s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'ping-slow': 'ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
    },
  },
}
```

**5.3.2 使用自定义动画**

```html
<!-- 使用自定义动画 -->
<div class="animate-fade-in">淡入动画</div>
<div class="animate-slide-up">上滑动画</div>
<div class="animate-slide-down">下滑动画</div>
<div class="animate-scale-in">缩放入场动画</div>
<div class="animate-wiggle">摇摆动画</div>

<!-- 无限循环 -->
<div class="animate-bounce infinite">无限弹跳</div>
<div class="animate-pulse infinite">无限脉冲</div>
<div class="animate-spin infinite">无限旋转</div>
```

### 5.4 实战：动画实现

**5.4.1 卡片悬停效果**

```html
<!-- 卡片悬停动画效果 -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
  <!-- 卡片1：缩放+阴影 -->
  <div class="bg-white rounded-xl shadow-md overflow-hidden
              transition-all duration-300 ease-out
              hover:shadow-xl hover:scale-105 cursor-pointer">
    <img src="/api/placeholder/400/200" alt="图片" class="w-full h-48 object-cover">
    <div class="p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-2">缩放效果</h3>
      <p class="text-gray-600">悬停时卡片会整体放大并加深阴影</p>
    </div>
  </div>

  <!-- 卡片2：上滑 -->
  <div class="bg-white rounded-xl shadow-md overflow-hidden
              group cursor-pointer">
    <div class="relative overflow-hidden">
      <img src="/api/placeholder/400/200" alt="图片"
           class="w-full h-48 object-cover transition-transform duration-500
                  group-hover:scale-110">
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent
                  opacity-0 group-hover:opacity-100 transition-opacity duration-300
                  flex items-end">
        <span class="text-white font-medium p-4">悬停查看详情</span>
      </div>
    </div>
    <div class="p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-2">图片上滑</h3>
      <p class="text-gray-600">图片会放大并显示遮罩和文字</p>
    </div>
  </div>

  <!-- 卡片3：边框高亮 -->
  <div class="relative bg-white rounded-xl p-6
              transition-all duration-300 hover:shadow-lg
              border-2 border-transparent hover:border-blue-500 cursor-pointer">
    <h3 class="text-lg font-semibold text-gray-900 mb-2">边框高亮</h3>
    <p class="text-gray-600">悬停时边框变为蓝色</p>
  </div>
</div>
```

**5.4.2 页面过渡动画**

```html
<!-- 页面内容过渡动画 -->
<div class="p-6 space-y-8">
  <!-- 延迟入场动画 -->
  <div class="space-y-4">
    <h2 class="text-2xl font-bold text-gray-900">入场动画示例</h2>
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-blue-500 rounded-lg p-6 text-white
                  animate-fade-in animate-slide-up"
           style="animation-delay: 0ms;">
        项目 1
      </div>
      <div class="bg-green-500 rounded-lg p-6 text-white
                  animate-fade-in animate-slide-up"
           style="animation-delay: 100ms;">
        项目 2
      </div>
      <div class="bg-purple-500 rounded-lg p-6 text-white
                  animate-fade-in animate-slide-up"
           style="animation-delay: 200ms;">
        项目 3
      </div>
      <div class="bg-pink-500 rounded-lg p-6 text-white
                  animate-fade-in animate-slide-up"
           style="animation-delay: 300ms;">
        项目 4
      </div>
    </div>
  </div>

  <!-- 交错动画 -->
  <div class="space-y-4">
    <h2 class="text-2xl font-bold text-gray-900">交错动画</h2>
    <div class="flex flex-wrap gap-4">
      <div class="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500
                  rounded-xl animate-wiggle">
      </div>
      <div class="w-24 h-24 bg-gradient-to-br from-green-500 to-teal-500
                  rounded-xl animate-wiggle" style="animation-delay: 100ms;">
      </div>
      <div class="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-500
                  rounded-xl animate-wiggle" style="animation-delay: 200ms;">
      </div>
      <div class="w-24 h-24 bg-gradient-to-br from-pink-500 to-rose-500
                  rounded-xl animate-wiggle" style="animation-delay: 300ms;">
      </div>
    </div>
  </div>

  <!-- 加载状态 -->
  <div class="space-y-4">
    <h2 class="text-2xl font-bold text-gray-900">加载状态</h2>
    <div class="flex items-center space-x-4">
      <div class="w-8 h-8 border-4 border-blue-200 border-t-blue-600
                  rounded-full animate-spin">
      </div>
      <div class="flex space-x-2">
        <div class="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
        <div class="w-3 h-3 bg-blue-500 rounded-full animate-bounce"
             style="animation-delay: 150ms;"></div>
        <div class="w-3 h-3 bg-blue-500 rounded-full animate-bounce"
             style="animation-delay: 300ms;"></div>
      </div>
      <div class="w-16 h-4 bg-gray-200 rounded-full overflow-hidden">
        <div class="h-full bg-gradient-to-r from-blue-500 to-purple-500
                    animate-pulse rounded-full" style="width: 60%;">
        </div>
      </div>
    </div>
  </div>
</div>
```

**5.4.3 按钮点击涟漪效果**

```html
<!-- 涟漪效果按钮（使用CSS自定义属性实现） -->
<style>
  .ripple-effect {
    position: relative;
    overflow: hidden;
  }
  .ripple-effect::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.6s ease-out, height 0.6s ease-out;
  }
  .ripple-effect:active::after {
    width: 300px;
    height: 300px;
  }
</style>

<button class="ripple-effect bg-blue-600 text-white px-8 py-3 rounded-lg
               shadow-lg hover:bg-blue-700 active:bg-blue-800
               transition-colors duration-200 font-medium">
  点击查看涟漪效果
</button>
```

---

## 6. 暗黑模式

### 6.1 配置暗黑模式

**6.1.1 启用暗黑模式**

```javascript
// tailwind.config.js

// 方式一：使用 class 策略（手动切换）
module.exports = {
  darkMode: 'class',
  // content: [...],
  theme: {
    extend: {},
  },
}

// 方式二：使用 media 策略（跟随系统）
module.exports = {
  darkMode: 'media',
  // content: [...],
  theme: {
    extend: {},
  },
}
```

**6.1.2 class 策略 vs media 策略**

```javascript
// class 策略：通过添加 .dark 类来切换
// 需要手动在 HTML 元素上添加/移除 .dark 类
document.documentElement.classList.add('dark')

// media 策略：跟随系统设置
// 自动根据用户的操作系统偏好切换
// prefers-color-scheme: dark 时自动应用暗黑样式
```

### 6.2 策略选择

**6.2.1 推荐：class 策略**

```javascript
// 原因：
// 1. 可以让用户手动切换，不受系统限制
// 2. 可以记住用户偏好（localStorage）
// 3. 更灵活，可以实现"自动"模式

module.exports = {
  darkMode: 'class',
  // ...
}
```

**6.2.2 暗黑模式切换按钮实现**

```javascript
// 主题状态管理（使用 Zustand）
// store/themeStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'light',

      // 切换到暗黑模式
      toggleDark: () => {
        document.documentElement.classList.add('dark');
        set({ theme: 'dark' });
      },

      // 切换到亮色模式
      toggleLight: () => {
        document.documentElement.classList.remove('dark');
        set({ theme: 'light' });
      },

      // 切换主题
      toggleTheme: () => {
        const { theme, toggleDark, toggleLight } = get();
        if (theme === 'light') {
          toggleDark();
        } else {
          toggleLight();
        }
      },

      // 初始化主题（从 localStorage 恢复或跟随系统）
      initTheme: () => {
        const { theme } = get();
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else if (theme === 'system') {
          // 跟随系统
          if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);
```

### 6.3 暗黑模式样式编写

**6.3.1 使用 dark: 前缀**

```html
<!-- 基础样式 + 暗黑模式样式 -->
<div class="bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
  <h1 class="text-3xl font-bold">标题</h1>
  <p class="text-gray-600 dark:text-gray-300">正文内容</p>
  <button class="bg-blue-500 hover:bg-blue-600
                 dark:bg-blue-600 dark:hover:bg-blue-700
                 text-white px-4 py-2 rounded-lg">
    按钮
  </button>
</div>

<!-- 复杂组件示例 -->
<nav class="bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between h-16">
      <div class="flex items-center">
        <span class="text-xl font-bold text-blue-600 dark:text-blue-400">
          Logo
        </span>
      </div>
      <div class="flex items-center space-x-4">
        <a href="#" class="text-gray-700 hover:text-blue-600
                          dark:text-gray-200 dark:hover:text-blue-400">
          首页
        </a>
        <a href="#" class="text-gray-700 hover:text-blue-600
                          dark:text-gray-200 dark:hover:text-blue-400">
          关于
        </a>
        <!-- 主题切换按钮 -->
        <button id="theme-toggle" class="p-2 rounded-lg
          bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600
          transition-colors duration-200">
          <!-- 太阳图标（暗黑模式时显示） -->
          <svg class="w-5 h-5 hidden dark:block text-yellow-400" fill="currentColor"
               viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                  clip-rule="evenodd"/>
          </svg>
          <!-- 月亮图标（亮色模式时显示） -->
          <svg class="w-5 h-5 block dark:hidden text-gray-600" fill="currentColor"
               viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</nav>
```

### 6.4 自定义暗黑模式颜色

**6.4.1 在配置中定义暗黑模式专用颜色**

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      // 暗黑模式专用背景色
      colors: {
        'dark-bg': '#1a1a2e',
        'dark-card': '#16213e',
        'dark-border': '#2d3748',
      },
    },
  },
}
```

**6.4.2 使用任意值自定义**

```html
<!-- 使用任意值 -->
<div class="bg-[#1a1a2e] dark:bg-[#0f0f23]">
  自定义背景色
</div>

<!-- 使用 CSS 变量 -->
<div class="bg-[var(--dark-bg)]">
  使用 CSS 变量
</div>
```

### 6.5 实战：主题切换

**6.5.1 完整的主题切换组件**

```html
<!-- ThemeProvider 组件（React 示例） -->
<script>
  // 主题状态管理
  const themeState = {
    theme: localStorage.getItem('theme') || 'light',
    toggle() {
      this.theme = this.theme === 'light' ? 'dark' : 'light';
      this.apply();
      localStorage.setItem('theme', this.theme);
    },
    apply() {
      if (this.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    init() {
      this.apply();
      // 监听系统主题变化
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (localStorage.getItem('theme') === 'system') {
          this.theme = e.matches ? 'dark' : 'light';
          this.apply();
        }
      });
    }
  };

  // 初始化主题
  themeState.init();
</script>

<!-- 使用 Tailwind 的主题切换 -->
<button
  onclick="themeState.toggle()"
  class="
    relative inline-flex items-center h-6 w-11 rounded-full
    transition-colors duration-200 ease-in-out
    bg-gray-200 dark:bg-blue-600
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
  "
>
  <span
    class="
      inline-block h-4 w-4 transform rounded-full bg-white
      transition-transform duration-200 ease-in-out
      translate-x-1 dark:translate-x-6
    "
  />
</button>

<!-- 或者使用更完整的切换开关 -->
<div class="p-6">
  <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
    主题切换
  </h3>

  <!-- 主题选项 -->
  <div class="space-y-3">
    <label class="flex items-center cursor-pointer">
      <input type="radio" name="theme" value="light"
             class="w-4 h-4 text-blue-600 border-gray-300
                    focus:ring-blue-500 dark:border-gray-600"
             checked
             onchange="setTheme('light')">
      <span class="ml-3 text-gray-700 dark:text-gray-300">浅色模式</span>
    </label>

    <label class="flex items-center cursor-pointer">
      <input type="radio" name="theme" value="dark"
             class="w-4 h-4 text-blue-600 border-gray-300
                    focus:ring-blue-500 dark:border-gray-600"
             onchange="setTheme('dark')">
      <span class="ml-3 text-gray-700 dark:text-gray-300">深色模式</span>
    </label>

    <label class="flex items-center cursor-pointer">
      <input type="radio" name="theme" value="system"
             class="w-4 h-4 text-blue-600 border-gray-300
                    focus:ring-blue-500 dark:border-gray-600"
             onchange="setTheme('system')">
      <span class="ml-3 text-gray-700 dark:text-gray-300">跟随系统</span>
    </label>
  </div>

  <script>
    function setTheme(theme) {
      localStorage.setItem('theme', theme);

      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        // 跟随系统
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    }
  </script>
</div>
```

---

## 7. 组件化

### 7.1 @apply 指令

**7.1.1 使用 @apply 抽取组件样式**

```html
<!-- 将重复的工具类组合成可复用的类 -->
<style>
  /* 定义一个按钮组件 */
  .btn {
    @apply inline-flex items-center justify-center px-6 py-3
           text-base font-medium rounded-lg transition-all duration-200
           focus:outline-none focus:ring-4 focus:ring-blue-300;
  }

  /* 按钮变体 */
  .btn-primary {
    @apply bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800
           shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-secondary {
    @apply bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400
           dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600;
  }

  .btn-danger {
    @apply bg-red-600 text-white hover:bg-red-700 active:bg-red-800;
  }

  .btn-outline {
    @apply border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white;
  }

  /* 尺寸变体 */
  .btn-sm {
    @apply px-4 py-2 text-sm;
  }

  .btn-lg {
    @apply px-8 py-4 text-lg;
  }
</style>

<!-- 使用抽取后的组件 -->
<button class="btn btn-primary">主要按钮</button>
<button class="btn btn-secondary">次要按钮</button>
<button class="btn btn-danger">危险按钮</button>
<button class="btn btn-outline">描边按钮</button>
<button class="btn btn-primary btn-sm">小尺寸</button>
<button class="btn btn-primary btn-lg">大尺寸</button>
```

**7.1.2 @apply 的限制**

```html
<!-- @apply 不能使用：状态变体（但可以用于定义的基础类中） -->
<style>
  /* 错误示例 */
  .card {
    @apply bg-white hover:bg-gray-100;
    /* hover: 不能直接在 @apply 中使用 */
  }

  /* 正确做法：使用普通 CSS 组合 */
  .card {
    @apply bg-white;
  }
  .card:hover {
    @apply bg-gray-100;
  }
</style>
```

### 7.2 组件抽取最佳实践

**7.2.1 基础组件结构**

```html
<!-- button.html - 基础按钮组件 -->
<template id="btn-template">
  <style>
    .btn {
      @apply inline-flex items-center justify-center px-6 py-3
             text-base font-medium rounded-lg transition-all duration-200
             focus:outline-none focus:ring-4 focus:ring-offset-2;
    }

    .btn-primary {
      @apply bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800
             shadow-sm hover:shadow-md;
    }

    .btn-secondary {
      @apply bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400;
    }

    .btn:disabled {
      @apply opacity-50 cursor-not-allowed;
    }
  </style>
  <button class="btn btn-primary">
    <slot></slot>
  </button>
</template>

<!-- 使用 Web Components -->
<script>
  class ButtonComponent extends HTMLElement {
    constructor() {
      super();
      const template = document.getElementById('btn-template');
      const clone = template.content.cloneNode(true);
      this.attachShadow({ mode: 'open' }).appendChild(clone);
    }

    static get observedAttributes() {
      return ['variant', 'disabled'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
      const button = this.shadowRoot.querySelector('button');
      button.className = `btn btn-${this.getAttribute('variant') || 'primary'}`;
      button.disabled = this.hasAttribute('disabled');
    }
  }

  customElements.define('my-button', ButtonComponent);
</script>

<!-- 使用 -->
<my-button variant="primary">主要按钮</my-button>
<my-button variant="secondary">次要按钮</my-button>
<my-button variant="primary" disabled>禁用</my-button>
```

**7.2.2 React 组件示例**

```tsx
// Button.tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}) => {
  // 基础类名
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-offset-2';

  // 变体类名映射
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm hover:shadow-md focus:ring-blue-300',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 focus:ring-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-300',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white focus:ring-blue-300',
  };

  // 尺寸类名映射
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  // 禁用状态
  const disabledClasses = disabled || loading ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabledClasses}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
};

// 使用示例
// <Button variant="primary" size="md" onClick={handleClick}>
//   点击我
// </Button>
```

### 7.3 设计系统

**7.3.1 设计令牌（Design Tokens）**

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      // 颜色系统
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',  // 主色
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },
        success: {
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          500: '#f59e0b',
          600: '#d97706',
        },
        danger: {
          500: '#ef4444',
          600: '#dc2626',
        },
      },

      // 间距系统
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },

      // 圆角系统
      borderRadius: {
        '4xl': '2rem',
      },

      // 阴影系统
      boxShadow: {
        'inner-lg': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
      },

      // 字体系统
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
    },
  },
}
```

**7.3.2 使用设计令牌**

```html
<!-- 使用设计系统中的颜色 -->
<button class="bg-primary-500 hover:bg-primary-600 text-white">
  主要按钮
</button>

<!-- 使用语义化颜色名称 -->
<div class="bg-success-500">成功</div>
<div class="bg-warning-500">警告</div>
<div class="bg-danger-500">危险</div>

<!-- 使用设计系统中的圆角 -->
<button class="rounded-4xl">超大圆角按钮</button>
```

### 7.4 实战：组件库

**7.4.1 卡片组件系统**

```html
<!-- 基础卡片 -->
<div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
  <div class="p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-2">基础卡片</h3>
    <p class="text-gray-600">这是一个基础卡片组件，使用 Tailwind 构建。</p>
  </div>
</div>

<!-- 可交互卡片 -->
<a href="#" class="group block bg-white rounded-xl shadow-md overflow-hidden
                   hover:shadow-lg transition-all duration-300
                   border border-transparent hover:border-blue-500">
  <div class="p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-2
               group-hover:text-blue-600 transition-colors">
      可交互卡片
    </h3>
    <p class="text-gray-600">悬停时边框变蓝，文字变蓝，有轻微上移效果。</p>
  </div>
</a>

<!-- 高级卡片（带图片） -->
<div class="max-w-sm bg-white rounded-xl shadow-md overflow-hidden
            hover:shadow-xl transition-all duration-300">
  <div class="relative">
    <img src="/api/placeholder/400/200" alt="卡片图片"
         class="w-full h-48 object-cover">
    <div class="absolute top-4 left-4">
      <span class="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">
        特色
      </span>
    </div>
  </div>
  <div class="p-6">
    <div class="flex items-center text-sm text-gray-500 mb-2">
      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
             d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
      2024年1月15日
    </div>
    <h3 class="text-xl font-bold text-gray-900 mb-2">卡片标题</h3>
    <p class="text-gray-600 mb-4">
      这里是卡片的描述内容，可以包含多行文字。
    </p>
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <img src="/api/placeholder/32/32" alt="头像"
             class="w-8 h-8 rounded-full">
        <span class="ml-2 text-sm text-gray-700">作者名称</span>
      </div>
      <button class="text-blue-600 hover:text-blue-800 font-medium text-sm">
        阅读更多 →
      </button>
    </div>
  </div>
</div>
```

---

## 8. 自定义配置

### 8.1 tailwind.config 配置详解

**8.1.1 完整配置结构**

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  // 内容配置（必填）- 指定哪些文件包含 Tailwind 样式
  content: [
    './src/**/*.{html,js}',
    './components/**/*.{html,js}',
    './pages/**/*.{html,js}',
    './index.html',
    // 使用 glob 模式
    './src/**/*.{html,js,jsx,tsx,vue,svelte}',
  ],

  // 暗黑模式配置
  darkMode: 'class',  // 或 'media'

  // 主题配置
  theme: {
    // 覆盖默认主题
    colors: {
      // 自定义颜色
    },
    spacing: {
      // 自定义间距
    },
    // ... 其他主题属性

    // extend 属性：在不覆盖默认配置的情况下添加
    extend: {
      colors: {
        // 添加新颜色
      },
      spacing: {
        // 添加新间距
      },
    },
  },

  // 插件配置
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    // ... 其他插件
  ],

  // 实验性功能
  experimental: {
    // 启用实验性功能
  },

  // JIT 模式（v3+ 默认启用）
  mode: 'jit',
}
```

### 8.2 主题扩展

**8.2.1 扩展颜色**

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // 方式一：使用字符串颜色值
        brand: '#3b82f6',

        // 方式二：使用对象定义色阶
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },

        // 方式三：添加新颜色（保持原有颜色不变）
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
      },
    },
  },
}
```

**8.2.2 扩展间距**

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      spacing: {
        // 添加新的间距值
        '128': '32rem',
        '144': '36rem',
        '1/7': '14.2857143%',
        '2/7': '28.5714286%',
        '3/7': '42.8571429%',
        '4/7': '57.1428571%',
        '5/7': '71.4285714%',
        '6/7': '85.7142857%',
      },
      // 扩展屏幕尺寸
      screens: {
        'xs': '480px',
        '3xl': '1920px',
        // 定制特定方向的断点
        'smartphone': { 'min': '320px', 'max': '639px' },
      },
    },
  },
}
```

**8.2.3 扩展动画**

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      keyframes: {
        'animation-name': {
          '0%': { property: 'value' },
          '100%': { property: 'value' },
        },
      },
      animation: {
        'duration-500': 'animation-name 500ms',
        'duration-1000': 'animation-name 1000ms',
      },
    },
  },
}
```

### 8.3 插件系统

**8.3.1 官方插件**

```bash
# 安装官方插件
npm install -D @tailwindcss/forms
npm install -D @tailwindcss/typography
npm install -D @tailwindcss/line-clamp
npm install -D @tailwindcss/aspect-ratio
```

```javascript
// tailwind.config.js
module.exports = {
  plugins: [
    require('@tailwindcss/forms'),      // 表单样式重置
    require('@tailwindcss/typography'),  // 排版插件
    require('@tailwindcss/line-clamp'),  // 文本截断
    require('@tailwindcss/aspect-ratio'), // 长宽比
  ],
}
```

**8.3.2 @tailwindcss/forms 插件使用**

```html
<!-- 默认样式 -->
<input type="text" class="rounded-md border-gray-300">
<select class="rounded-md border-gray-300">
  <option>选项1</option>
  <option>选项2</option>
</textarea>

<!-- 搭配暗黑模式 -->
<div class="dark">
  <input type="text" class="dark:border-gray-700 dark:bg-gray-800
                            dark:text-white rounded-md">
</div>
```

**8.3.3 @tailwindcss/typography 插件使用**

```html
<!-- 使用 typography 插件 -->
<article class="prose">
  <h1>文章标题</h1>
  <p>正文内容...</p>
  <ul>
    <li>列表项1</li>
    <li>列表项2</li>
  </ul>
  <blockquote>
    引用文本
  </blockquote>
</article>

<!-- 搭配暗黑模式 -->
<article class="prose dark:prose-invert">
  <!-- 内容会自动适配暗黑模式 -->
</article>

<!-- 自定义 prose 变体 -->
<article class="prose prose-lg prose-blue">
  <!-- 大号蓝色主题文章 -->
</article>

<!-- 代码块样式 -->
<pre class="prose-pre">
  <code>代码内容</code>
</pre>
```

### 8.4 实战：配置实践

**8.4.1 企业级 Tailwind 配置**

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './pages/**/*.{js,jsx,ts,tsx}',
    './public/**/*.html',
  ],

  darkMode: 'class',  // 手动切换暗黑模式

  theme: {
    extend: {
      // 品牌颜色
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
      },

      // 字体
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Poppins', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      // 阴影
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'medium': '0 4px 16px rgba(0, 0, 0, 0.12)',
        'hard': '0 8px 24px rgba(0, 0, 0, 0.16)',
      },

      // 动画
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.3s ease-out forwards',
      },
    },
  },

  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

---

## 9. 优化

### 9.1 生产构建

**9.1.1 生产构建优化**

```bash
# 使用 PostCSS + Autoprefixer + CSS Nano
npx postcss style.css -o dist/style.css --env production

# 或者使用 Tailwind CLI
npx tailwindcss -o dist/style.css --minify
```

**9.1.2 构建产物分析**

```bash
# 分析 CSS 文件大小
npx tailwindcss -o dist/style.css --analyze
```

### 9.2 关键 CSS

**9.2.1 使用 @layer 组织 CSS**

```html
<style>
  /* 使用 @layer 确保优先级 */
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  /* 自定义基础样式 */
  @layer base {
    body {
      @apply bg-gray-50 text-gray-900 font-sans;
    }
    h1, h2, h3, h4, h5, h6 {
      @apply font-display;
    }
  }

  /* 自定义组件 */
  @layer components {
    .card {
      @apply bg-white rounded-xl shadow-md p-6;
    }
    .btn {
      @apply inline-flex items-center justify-center px-6 py-3
             font-medium rounded-lg transition-all duration-200;
    }
  }

  /* 自定义工具类 */
  @layer utilities {
    .text-gradient {
      @apply bg-clip-text text-transparent bg-gradient-to-r;
    }
  }
</style>
```

**9.2.2 延迟加载非关键 CSS**

```html
<!-- 使用 media 属性延迟加载非关键样式 -->
<link rel="stylesheet" href="critical.css" media="print"
      onload="this.media='all'">

<!-- 或者使用 JavaScript 动态加载 -->
<link rel="preload" href="non-critical.css" as="style"
      onload="this.onload=null;this.rel='stylesheet'">
```

### 9.3 Purge 和 Tree Shaking

**9.3.1 内容配置（关键）**

```javascript
// tailwind.config.js
module.exports = {
  // content 配置告诉 Tailwind 需要扫描哪些文件
  // JIT 编译器只会生成这些文件中实际使用的类
  content: [
    './src/**/*.html',
    './src/**/*.js',
    './src/**/*.jsx',
    './src/**/*.ts',
    './src/**/*.tsx',
    // 确保包含所有可能的文件
  ],
}
```

**9.3.2 自定义 safelist**

```javascript
// tailwind.config.js
module.exports = {
  // 有时候某些类没有在文件中直接引用，但仍需要保留
  // 比如动态生成的类名
  content: ['./src/**/*.{js,jsx,ts,tsx,html}'],
  safelist: [
    // 完整的类名
    'bg-red-500',
    'text-white',
    // 正则匹配（需要 safelist 的正则支持）
    {
      pattern: /bg-(red|blue|green)-(100|200|300|400|500|600|700|800|900)/,
    },
    // 变体组合
    'hover:bg-red-600',
    'focus:bg-red-700',
    // 函数返回的动态类名
  ],
}
```

**9.3.3 使用 safelist 处理动态类名**

```javascript
// 如果你的代码中会动态生成类名，需要 safelist

// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx,html}'],
  safelist: [
    // 状态颜色
    'bg-success-500',
    'bg-warning-500',
    'bg-danger-500',
    // 动态宽度
    'w-1', 'w-2', 'w-3', 'w-4', 'w-5', 'w-6', 'w-7', 'w-8', 'w-9', 'w-10', 'w-11', 'w-12',
  ],
}
```

### 9.4 实战：构建优化

**9.4.1 完整的构建优化配置**

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    // Tailwind CSS
    '@tailwindcss/postcss': {},
    // Autoprefixer - 自动添加浏览器前缀
    autoprefixer: {},
    // CSS Nano - CSS 压缩和优化
    ...(process.env.NODE_ENV === 'production'
      ? { cssnano: {} }
      : {}),
  },
}
```

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  // 确保 content 配置正确，这是 JIT 和 tree-shaking 的关键
  content: [
    './src/**/*.{js,jsx,ts,tsx,html}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],

  // 生产环境启用优化
  mode: process.env.NODE_ENV === 'production' ? 'jit' : undefined,

  theme: {
    extend: {
      // ...
    },
  },

  plugins: [
    // 表单重置插件
    require('@tailwindcss/forms'),
    // 排版插件
    require('@tailwindcss/typography'),
  ],
}
```

**9.4.2 性能监控**

```html
<!-- 使用 CSS Stats 监控 CSS 大小 -->
<!-- https://cssstats.com/ -->

<!-- 或者使用 Parcel/Vite 的打包分析工具 -->

<!-- 推荐的 CSS 大小目标 -->
<!--
  小型项目: < 10KB (压缩后)
  中型项目: < 20KB (压缩后)
  大型项目: < 50KB (压缩后)

  如果超过 50KB，需要检查是否有过多未使用的类
-->
```

---

## 10. 集成

### 10.1 Vue 集成

**10.1.1 Vite + Vue + Tailwind**

```bash
# 1. 创建 Vue 项目
npm create vite@latest my-vue-app -- --template vue

# 2. 进入目录
cd my-vue-app

# 3. 安装 Tailwind CSS
npm install -D tailwindcss postcss autoprefixer

# 4. 初始化 Tailwind 配置
npx tailwindcss init -p
```

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
}
```

```css
/* src/style.css 或 src/assets/main.css */
@import "tailwindcss";
```

```vue
<!-- src/App.vue -->
<script setup>
import { ref } from 'vue'
const isDark = ref(false)
const toggleTheme = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
}
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
    <nav class="p-4 bg-blue-600 text-white">
      <h1 class="text-xl font-bold">Vue + Tailwind 应用</h1>
    </nav>
    <main class="p-8">
      <div class="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          欢迎回来
        </h2>
        <button
          @click="toggleTheme"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium
                 py-3 px-4 rounded-lg transition-colors duration-200"
        >
          {{ isDark ? '切换到浅色模式' : '切换到深色模式' }}
        </button>
      </div>
    </main>
  </div>
</template>
```

### 10.2 React 集成

**10.2.1 Vite + React + Tailwind**

```bash
# 1. 创建 React 项目
npm create vite@latest my-react-app -- --template react-ts

# 2. 进入目录
cd my-react-app

# 3. 安装依赖
npm install

# 4. 安装 Tailwind CSS
npm install -D tailwindcss postcss autoprefixer

# 5. 初始化配置
npx tailwindcss init -p
```

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
}
```

```css
/* src/index.css */
@import "tailwindcss";
```

```tsx
// src/App.tsx
import { useState } from 'react'
import './index.css'

function App() {
  const [isDark, setIsDark] = useState(false)

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark', !isDark)
  }

  return (
    <div className={`min-h-screen transition-colors duration-300
      ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <nav className={`p-4 ${isDark ? 'bg-gray-800' : 'bg-blue-600'} text-white`}>
        <h1 className="text-xl font-bold">React + Tailwind 应用</h1>
      </nav>
      <main className="p-8">
        <div className={`max-w-md mx-auto rounded-xl shadow-lg p-6
          ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-2xl font-bold mb-4
            ${isDark ? 'text-white' : 'text-gray-900'}`}>
            主题切换示例
          </h2>
          <button
            onClick={toggleTheme}
            className={`w-full font-medium py-3 px-4 rounded-lg transition-colors duration-200
              ${isDark
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
            {isDark ? '切换到浅色模式' : '切换到深色模式'}
          </button>
        </div>
      </main>
    </div>
  )
}

export default App
```

### 10.3 Next.js 集成

**10.3.1 Next.js 16 + Tailwind v4**

在 FastDocument 和 WebEnv-OS 项目中使用的配置方式：

```bash
# 安装依赖
npm install -D tailwindcss @tailwindcss/postcss postcss
```

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

```css
/* app/globals.css 或 app/globals.css */
@import "tailwindcss";
```

```tsx
/* app/layout.tsx */
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Next.js + Tailwind CSS',
  description: '现代化 Web 开发',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}
```

**10.3.2 Next.js 暗黑模式实现**

```tsx
/* components/ThemeProvider.tsx */
'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => {
    // 从 localStorage 恢复主题
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored) {
      setTheme(stored)
    }
  }, [])

  useEffect(() => {
    // 应用主题到 HTML 元素
    const root = document.documentElement

    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'light') {
      root.classList.remove('dark')
    } else {
      // system
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', isDark)
    }

    // 保存到 localStorage
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
```

```tsx
/* app/page.tsx */
'use client'

import { useTheme } from '@/components/ThemeProvider'

export default function HomePage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
          Next.js + Tailwind CSS 主题示例
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            当前主题: {theme}
          </h2>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setTheme('light')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors
                ${theme === 'light'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              浅色模式
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors
                ${theme === 'dark'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              深色模式
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors
                ${theme === 'system'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              跟随系统
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## 11. vs CSS Modules

### 11.1 学习曲线对比

**11.1.1 CSS Modules**

```css
/* Button.module.css */

/* 需要了解的概念 */
.button { }           /* 基本选择器 */
.button.primary { }   /* 组合选择器 */
:global(.helper) { }  /* 全局类 */
:local(.button) { }   /* 局部类 */

/* 伪类和伪元素 */
.button:hover { }          /* 悬停 */
.button::before { }        /* 伪元素 */
```

```tsx
/* Button.tsx */
import styles from './Button.module.css'

export function Button({ variant = 'primary', children }) {
  return (
    <button className={`${styles.button} ${styles[variant]}`}>
      {children}
    </button>
  )
}
```

**11.1.2 Tailwind CSS**

```html
<!-- 学习内容 -->
<!-- 1. 工具类命名规范 -->
<button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
  按钮
</button>

<!-- 2. 需要记忆常用工具类 -->
<!-- 间距: p-4 px-4 py-4 m-4 mx-auto -->
<!-- 颜色: text-gray-500 bg-blue-500 border-gray-300 -->
<!-- 字体: text-sm font-bold leading-tight -->
```

**11.1.3 学习难度对比**

| 方面 | CSS Modules | Tailwind CSS |
|------|-------------|--------------|
| 入门门槛 | 中等（需要理解 CSS Modules 概念） | 较低（直观可见） |
| 需要记忆 | 较少（自定义 CSS） | 较多（工具类名） |
| 学习曲线 | 较陡（概念+CSS） | 平缓（直观+实践） |
| 文档质量 | 依赖 CSS 基础 | 官方文档非常完善 |
| 上手速度 | 较慢 | 较快 |

### 11.2 开发体验对比

**11.2.1 CSS Modules 体验**

```css
/* 优点： */
/* 1. 原生 CSS 语法，无需学习新语法 */
/* 2. IDE 支持好（CSS 语法高亮、自动补全） */
/* 3. 选择器功能强大（伪类、伪元素、复杂选择器） */
/* 4. 样式隔离，避免冲突 */

.button {
  composes: base from './common.css'; /* 组合其他样式 */
  background: blue;
}

.button:hover {
  background: darkblue; /* 悬停状态 */
}

.primary {
  background: blue;
}
```

```tsx
/* 缺点： */
/* 1. 需要在 JSX 和 CSS 之间来回切换 */
/* 2. 命名可能冲突（虽然模块隔离） */
/* 3. 响应式设计需要媒体查询 */
/* 4. 暗黑模式需要额外的类切换 */
```

**11.2.2 Tailwind CSS 体验**

```html
<!-- 优点： */
/* 1. 所有样式在 JSX 中，无需切换文件 */
/* 2. 响应式设计内置（md:, lg: 前缀） */
/* 3. 暗黑模式内置（dark: 前缀） */
/* 4. JIT 编译，文件体积小 */
/* 5. 设计系统一致性 */

<button class="
  bg-blue-500 hover:bg-blue-600 active:bg-blue-700
  text-white font-medium px-6 py-3
  rounded-lg shadow-sm hover:shadow-md
  transition-all duration-200
  disabled:opacity-50 disabled:cursor-not-allowed
  md:bg-blue-600 lg:bg-blue-700
  dark:bg-blue-400 dark:hover:bg-blue-500
">
  按钮
</button>
```

```tsx
/* 缺点： */
/* 1. HTML 可能会变得很长 */
/* 2. 需要记住大量工具类名 */
/* 3. 复杂选择器（如 :nth-child）不方便 */
/* 4. IDE 可能需要额外插件支持 */
```

### 11.3 性能对比

**11.3.1 CSS 产物大小**

| 方案 | 开发环境 | 生产环境 |
|------|----------|----------|
| CSS Modules（无优化） | 包含所有样式 | 包含所有样式 |
| CSS Modules（手动优化） | 包含所有样式 | 按需打包 |
| Tailwind CSS v3 | 所有工具类 | 仅使用的类 |
| Tailwind CSS v4 | 所有工具类 | 仅使用的类（更高效） |

**11.3.2 运行时性能**

```html
<!-- CSS Modules -->
<!-- 运行时开销：几乎为零 -->
<!-- 浏览器渲染：标准 CSS 渲染 -->

<!-- Tailwind CSS -->
<!-- 运行时开销：几乎为零（JIT 编译为静态 CSS） -->
<!-- 浏览器渲染：标准 CSS 渲染 -->
```

### 11.4 我的思考：选择看团队

**11.4.1 适合使用 Tailwind CSS 的场景**

```
1. 快速原型开发
   - 需要快速迭代的项目
   - 时间紧迫的团队

2. 设计系统驱动的项目
   - 有明确的设计令牌
   - 需要保持视觉一致性
   - 组件化程度高的项目

3. 中小型项目
   - CSS 文件不大的项目
   - 团队对 utility-first 理念接受度高

4. 个人项目
   - 学习成本可控
   - 开发效率优先
```

**11.4.2 适合使用 CSS Modules 的场景**

```
1. 复杂样式逻辑
   - 需要复杂的 CSS 选择器
   - 有大量自定义动画
   - 样式之间有复杂依赖

2. 传统项目迁移
   - 已有大量 CSS 代码
   - 团队对 CSS 更加熟悉
   - 项目不需要快速迭代

3. 设计系统不完善
   - 没有统一的设计令牌
   - 需要灵活处理各种边缘情况

4. 对 CSS 有特殊要求
   - 需要使用 CSS 特性（如 @keyframes）
   - 复杂的伪元素交互
```

**11.4.3 混合使用方案**

```tsx
// 在 React/Vue 中可以混合使用

/* Button.tsx */
import styles from './Button.module.css'

// 使用 Tailwind 处理通用样式
// 使用 CSS Modules 处理复杂样式
export function Button({ children, className }) {
  return (
    <button className={`
      ${styles.complexAnimation}
      bg-blue-500 hover:bg-blue-600
      text-white px-4 py-2
      ${className}
    `}>
      {children}
    </button>
  )
}
```

**11.4.4 团队选择建议**

| 团队情况 | 推荐方案 | 理由 |
|----------|----------|------|
| 初创团队，快速迭代 | Tailwind CSS | 开发效率高，快速原型 |
| 大型团队，有设计系统 | Tailwind CSS | 保持一致性，利于协作 |
| 传统企业，稳为主 | CSS Modules | 稳定可控，风险低 |
| 组件库开发 | 两者结合 | 各取所长 |
| 学习阶段 | Tailwind CSS | 上手快，文档好 |

---

## 12. 案例：Shadcn/ui

### 12.1 设计理念

**12.1.1 Shadcn/ui 是什么？**

Shadcn/ui 不是传统意义上的组件库，而是一组"可以复制粘贴到项目中的组件"。它提供源码，让开发者完全控制组件的实现和样式。

```bash
# 安装 Shadcn/ui
npx shadcn@latest init

# 添加组件
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
```

```tsx
// 组件直接复制到项目中
// components/ui/button.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

### 12.2 组件实现

**12.2.1 Button 组件使用**

```tsx
// 基础按钮
<Button>Default</Button>

// 变体
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// 尺寸
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">
  <Icons.add className="h-4 w-4" />
</Button>

// 禁用状态
<Button disabled>Disabled</Button>

// 加载状态
<Button disabled>
  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
  Please wait
</Button>
```

**12.2.2 Card 组件**

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

<Card className="w-[350px]">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card Description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card Content</p>
  </CardContent>
  <CardFooter>
    <p>Card Footer</p>
  </CardFooter>
</Card>
```

**12.2.3 Dialog 组件**

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Open Dialog</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Are you sure absolutely sure?</DialogTitle>
      <DialogDescription>
        This action cannot be undone. This will permanently delete your account
        and remove your data from our servers.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button type="submit">Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 12.3 主题系统

**12.3.1 CSS 变量主题**

Shadcn/ui 使用 CSS 变量实现主题系统：

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* 亮色主题 */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    /* 暗黑主题 - 只需修改变量值 */
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... 其他变量 */
  }
}
```

**12.3.2 cn 工具函数**

```tsx
// lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// 合并 Tailwind 类名，处理冲突
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 使用示例
<div className={cn(
  "bg-blue-500",
  isActive && "bg-blue-600",  // 条件类
  className  // 自定义类
)}>
```

### 12.4 我的思考：Tailwind 生态

**12.4.1 Tailwind 生态圈**

```
核心工具
├── tailwindcss - 核心框架
├── @tailwindcss/postcss - PostCSS 插件
├── @tailwindcss/vite - Vite 插件
├── @tailwindcss/forms - 表单插件
├── @tailwindcss/typography - 排版插件
├── @tailwindcss/line-clamp - 文本截断
└── @tailwindcss/aspect-ratio - 长宽比

UI 组件库
├── Shadcn/ui - 可复制组件库
├── Headless UI - 无样式组件
├── HeroUI - React 组件库
├── Sakura UI - Vue 组件库
└── daisyUI - 实用组件库

工具类
├── tailwind-merge - 类名合并
├── clsx - 条件类名
├── tailwindcss-animate - 动画工具
└── tailwindcss-logical - CSS 逻辑属性

IDE 支持
├── Tailwind CSS IntelliSense - VS Code 插件
├── TailwindDocs - 文档助手
└── Headwind - 类名排序
```

**12.4.2 Tailwind 的优势**

```
1. 生态繁荣
   - 官方维护大量插件
   - 社区贡献丰富
   - 组件库选择多样

2. 工具链成熟
   - JIT 编译器高效
   - 开发体验好
   - 生产构建优化完善

3. 设计系统友好
   - 易于自定义配置
   - 设计令牌集成简单
   - 主题切换便捷

4. 社区活跃
   - 文档质量高
   - 教程资源丰富
   - 问题解决快速
```

**12.4.3 Tailwind 的挑战**

```
1. 学习成本
   - 需要记忆工具类名
   - 命名规范需要团队统一
   - 最佳实践需要时间积累

2. HTML 膨胀
   - 类名较长
   - 需要工具辅助（cn 函数）
   - 代码可读性可能下降

3. 复杂场景
   - 复杂动画实现困难
   - CSS 变量主题需要配置
   - 与其他 CSS 技术共存需要技巧
```

**12.4.4 未来展望**

```
Tailwind CSS v4 及未来方向：

1. 引擎升级
   - Lightning CSS 带来性能提升
   - 构建速度大幅提升
   - 更好的错误提示

2. CSS-first 配置
   - 使用 @theme 指令
   - 减少对 JS 配置文件的依赖
   - 更直观的配置方式

3. 更好的集成
   - 更强大的 IDE 支持
   - 更智能的类名提示
   - 更好的调试工具

4. 生态扩展
   - 更多官方插件
   - 更丰富的组件库
   - 更好的设计系统支持
```

---

## 13. 总结与展望

### 13.1 核心要点回顾

**13.1.1 Tailwind CSS 的核心价值**

1. **Utility First 理念**：通过组合小型工具类构建复杂界面
2. **JIT 编译**：只生成实际使用的样式，文件体积小
3. **设计系统集成**：内置设计令牌，支持自定义主题
4. **响应式设计**：内置断点系统，轻松实现移动优先
5. **暗黑模式**：内置支持，主题切换简单

**13.1.2 关键配置**

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx,html}'],  // 扫描所有可能使用类的文件
  darkMode: 'class',  // 手动切换暗黑模式
  theme: {
    extend: {
      // 自定义颜色、间距、动画等
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

**13.1.3 常用工具类速查**

```html
<!-- 布局 -->
<div class="flex flex-col grid grid-cols-3 gap-4">
<!-- 定位 -->
<div class="relative absolute fixed sticky inset-0 z-50">
<!-- 间距 -->
<div class="p-4 m-4 mx-auto my-4 space-y-4">
<!-- 尺寸 -->
<div class="w-full h-screen max-w-sm">
<!-- 文字 -->
<p class="text-lg font-bold text-gray-500 leading-tight tracking-wider">
<!-- 颜色 -->
<div class="bg-blue-500 text-white border border-gray-300">
<!-- 圆角 -->
<div class="rounded-lg rounded-full">
<!-- 阴影 -->
<div class="shadow-md hover:shadow-lg">
<!-- 动画 -->
<button class="transition-all duration-200 hover:scale-105">
```

### 13.2 实战建议

**13.2.1 项目实践路径**

```
第一阶段：入门（1-2天）
├── 安装和配置 Tailwind
├── 学习常用工具类
└── 尝试构建简单页面

第二阶段：掌握（1周）
├── 深入布局系统（Flex、Grid）
├── 掌握响应式设计
├── 了解暗黑模式实现
└── 开始使用 Tailwind 生态工具

第三阶段：精通（2周）
├── 自定义设计系统
├── 组件抽取和复用
├── 性能优化实践
└── 参与开源组件库项目
```

**13.2.2 最佳实践**

```html
<!-- 1. 使用 @layer 组织 CSS -->
<style>
  @layer components {
    .btn { @apply px-4 py-2 rounded-lg; }
  }
</style>

<!-- 2. 使用 cn 工具合并类名 -->
<div className={cn(
  "base-classes",
  condition && "conditional-class",
  className
)}>

<!-- 3. 响应式设计使用移动优先 -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">

<!-- 4. 暗黑模式使用 dark: 前缀 -->
<div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">

<!-- 5. 动画使用 transition 和工具类 -->
<button class="transition-all duration-200 hover:scale-105">
```

### 13.3 资源推荐

**13.3.1 官方资源**

```
1. Tailwind CSS 官方文档
   https://tailwindcss.com/docs

2. Tailwind CSS GitHub
   https://github.com/tailwindlabs/tailwindcss

3. Tailwind CSS Play（在线编辑器）
   https://play.tailwindcss.com/

4. Tailwind CSS Discord（社区）
   https://discord.gg/tailwindcss
```

**13.3.2 学习资源**

```
1. Tailwind CSS 官方博客
   https://tailwindcss.com/blog

2. Components 官方示例
   https://tailwindui.com/components

3. Shadcn/ui 组件库
   https://ui.shadcn.com/

4. Headless UI 无样式组件
   https://headlessui.com/
```

### 13.4 未来展望

**13.4.1 Tailwind CSS v4 特性**

```
1. Lightning CSS 引擎
   - 构建速度提升 3-10 倍
   - 更好的错误提示
   - 更小的产物

2. CSS-first 配置
   - 使用 @theme 指令
   - 不再需要 JS 配置文件
   - 更直观的配置方式

3. 改进的 Developer Experience
   - 更好的类型支持
   - 更好的 IDE 集成
   - 更好的调试工具
```

**13.4.2 持续学习建议**

```
1. 关注官方动态
   - 订阅官方博客
   - 加入 Discord 社区
   - 关注 GitHub 更新

2. 实践为主
   - 从小项目开始
   - 尝试重构现有项目
   - 参与开源贡献

3. 深入原理
   - 了解 CSS 工作机制
   - 学习构建工具原理
   - 掌握性能优化技巧

4. 拓展视野
   - 学习其他 CSS 方法论
   - 了解设计系统理念
   - 关注前端发展趋势
```

---

## 附录：常用工具类速查表

### A.1 布局类

| 类名 | 说明 |
|------|------|
| `block`, `inline-block`, `inline` |  display 属性 |
| `flex`, `inline-flex`, `grid` |  弹性盒和网格 |
| `flex-row`, `flex-col` |  主轴方向 |
| `flex-wrap`, `flex-nowrap` |  换行 |
| `items-start`, `items-center`, `items-end` |  交叉轴对齐 |
| `justify-start`, `justify-center`, `justify-end` |  主轴对齐 |
| `gap-4`, `gap-x-4`, `gap-y-4` |  间距 |
| `grid-cols-2`, `grid-cols-3` |  网格列数 |
| `col-span-2`, `row-span-2` |  跨越 |
| `w-full`, `w-1/2`, `w-auto` |  宽度 |
| `h-screen`, `h-full`, `h-auto` |  高度 |
| `min-h-screen`, `max-w-sm` |  最小/最大尺寸 |

### A.2 间距类

| 类名 | 说明 |
|------|------|
| `p-4`, `px-4`, `py-4` |  内边距 |
| `pt-4`, `pr-4`, `pb-4`, `pl-4` |  单边内边距 |
| `m-4`, `mx-4`, `my-4` |  外边距 |
| `mt-4`, `mr-4`, `mb-4`, `ml-4` |  单边外边距 |
| `-mt-4`, `-mx-2` |  负值 |
| `space-x-4`, `space-y-4` |  子元素间距 |

### A.3 文字类

| 类名 | 说明 |
|------|------|
| `text-xs` ~ `text-9xl` |  字号 |
| `font-thin` ~ `font-black` |  字重 |
| `leading-none` ~ `leading-loose` |  行高 |
| `tracking-tighter` ~ `tracking-widest` |  字间距 |
| `text-left`, `text-center`, `text-right` |  对齐 |
| `underline`, `line-through`, `no-underline` |  装饰 |
| `truncate`, `line-clamp-2` |  截断 |
| `text-gray-500` |  颜色 |

### A.4 背景和边框类

| 类名 | 说明 |
|------|------|
| `bg-white`, `bg-blue-500` |  背景色 |
| `bg-opacity-50`, `bg-blue-500/50` |  透明度 |
| `border`, `border-2`, `border-4` |  边框宽度 |
| `border-gray-300` |  边框颜色 |
| `rounded`, `rounded-lg`, `rounded-full` |  圆角 |
| `border-solid`, `border-dashed` |  边框样式 |

### A.5 阴影和动画类

| 类名 | 说明 |
|------|------|
| `shadow-sm`, `shadow`, `shadow-lg` |  阴影大小 |
| `shadow-blue-500/50` |  彩色阴影 |
| `transition`, `transition-all` |  过渡 |
| `duration-200`, `duration-300` |  时长 |
| `ease-in`, `ease-out` |  缓动 |
| `delay-100`, `delay-200` |  延迟 |
| `animate-spin`, `animate-pulse` |  动画 |
| `hover:scale-105` |  悬停变换 |
| `focus:ring-2` |  聚焦样式 |

### A.6 响应式和暗黑模式

| 前缀 | 说明 |
|------|------|
| `sm:` |  >= 640px |
| `md:` |  >= 768px |
| `lg:` |  >= 1024px |
| `xl:` |  >= 1280px |
| `2xl:` |  >= 1536px |
| `dark:` |  暗黑模式 |

---

> **文档信息**
>
> 创建日期：2024年
>
> 参考资料：
> - [Tailwind CSS 官方文档](https://tailwindcss.com/docs)
> - [Tailwind CSS v4 文档](https://v4.tailwindcss.com/)
> - [Tailwind UI 组件库](https://tailwindui.com/)
> - [Shadcn/ui 组件库](https://ui.shadcn.com/)
>
> 项目应用：
> - FastDocument：使用 Tailwind CSS v4 + Ant Design 6
> - WebEnv-OS：使用 Tailwind CSS v4 + Ant Design 6
