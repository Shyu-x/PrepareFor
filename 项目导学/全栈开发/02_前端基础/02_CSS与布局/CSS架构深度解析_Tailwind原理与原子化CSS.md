# CSS 架构深度解析：CSS-in-JS、Tailwind 原理与原子化 CSS (2026版)

## 1. 概述：CSS 的架构演进

在前端开发的演进史中，CSS 经历了从"手写样式"到"工程化架构"的巨大变革。2026 年，我们站在了 CSS 架构的十字路口：Tailwind 的原子化哲学、传统 CSS-in-JS 的运行时开销、以及 CSS Modules 的静态化趋势。

---

## 2. CSS Modules：静态编译的优雅方案

### 2.1 原理

CSS Modules 通过编译时转换，将类名转换为唯一的哈希值，实现样式隔离：

```css
/* Button.module.css */

/* 原始类名 */
.primary {
  background: blue;
  color: white;
}

/* 组合类名 */
.large {
  padding: 16px 32px;
  font-size: 18px;
}
```

```typescript
// 编译后生成：
// {
//   "primary": "Button_primary__xKmUc",
//   "large": "Button_large__xKmUc"
// }

// Button.tsx
import styles from './Button.module.css';

function Button() {
  return (
    <button className={`${styles.primary} ${styles.large}`}>
      点击我
    </button>
  );
}

// 编译后的 HTML:
// <button class="Button_primary__xKmUc Button_large__xKmUc">
```

### 2.2 Next.js 中的 CSS Modules

```typescript
// app/Button/Button.tsx
import styles from './Button.module.css';

export function Button({ children, variant = 'primary' }: ButtonProps) {
  const variantClass = variant === 'primary' ? styles.primary : styles.secondary;

  return (
    <button className={`${styles.base} ${variantClass}`}>
      {children}
    </button>
  );
}
```

```css
/* Button.module.css */

/* Base 样式 */
.base {
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

/* 变体样式 */
.primary {
  background: #3b82f6;
  color: white;
}

.primary:hover {
  background: #2563eb;
}

.secondary {
  background: transparent;
  color: #3b82f6;
  border: 1px solid #3b82f6;
}

/* 伪类组合 */
.base:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

## 3. CSS-in-JS：运行时styled-components

### 3.1 styled-components 原理

styled-components 使用模板字符串和 Tagged Template Literals，在运行时生成唯一的类名：

```typescript
// 源码
import styled from 'styled-components';

export const Button = styled.button`
  background: blue;
  color: white;
  padding: 8px 16px;
`;

// 运行时生成的代码逻辑
const hash = cssHashFunction(`
  background: blue;
  color: white;
  padding: 8px 16px;
`);

const className = `sc-${hash}`;

// 插入到 <style> 标签
injectStyle(`.${className} { background: blue; ... }`);
```

### 3.2 动态样式与 props 穿透

```typescript
import styled from 'styled-components';

// 1. 基本用法
const Button = styled.button`
  background: ${props => props.$primary ? '#3b82f6' : '#e5e7eb'};
  color: ${props => props.$primary ? 'white' : '#374151'};
  padding: ${props => props.$size === 'large' ? '12px 24px' : '8px 16px'};
`;

// 2. 扩展已有组件
const PrimaryButton = styled(Button)`
  background: #3b82f6;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
`;

// 3. 样式组合
const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
`;

const HoverableCard = styled(Card)`
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }
`;

// 4. 属性穿透（htmlAttrs）
const Input = styled.input.attrs(props => ({
  type: props.type || 'text',
  placeholder: props.placeholder || '请输入...',
}))`
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 8px 12px;
  outline: none;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;
```

### 3.3 主题系统

```typescript
// 1. 定义主题
const theme = {
  colors: {
    primary: '#3b82f6',
    secondary: '#10b981',
    danger: '#ef4444',
    background: '#ffffff',
    text: '#1f2937',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
  },
};

// 2. 注入主题
import { ThemeProvider } from 'styled-components';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Button>点击我</Button>
    </ThemeProvider>
  );
}

// 3. 使用主题
const Button = styled.button`
  background: ${props => props.theme.colors.primary};
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
`;
```

---

## 4. Emotion：高性能 CSS-in-JS

### 4.1 css prop 与 styled 的区别

```tsx
/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

// 1. css prop（更轻量）
function Button({ primary }) {
  return (
    <button
      css={css`
        background: ${primary ? 'blue' : 'gray'};
        color: white;
        padding: 8px 16px;
      `}
    >
      点击
    </button>
  );
}

// 2. styled API（更声明式）
import styled from '@emotion/styled';

const StyledButton = styled.button`
  background: blue;
  color: white;
  padding: 8px 16px;
`;

// 3. 样式组合
const baseStyle = css`
  padding: 8px 16px;
  border-radius: 6px;
`;

const Button = styled.button`
  ${baseStyle};
  background: blue;
`;

const SecondaryButton = styled.button`
  ${baseStyle};
  background: gray;
`;
```

### 4.2 SSR 与预渲染优化

```typescript
// emotion 的关键优化：extractCritical
import { renderToString } from 'react-dom/server';
import { extractCritical } from '@emotion/server';

function renderHTML(component) {
  const html = renderToString(component);

  // 提取关键的 CSS（减少 FOUC）
  const { ids, css } = extractCritical(html);

  return `
    <html>
      <head>
        <style data-emotion="${ids.join(' ')}">${css}</style>
      </head>
      <body>
        <div id="root">${html}</div>
      </body>
    </html>
  `;
}
```

---

## 5. Tailwind CSS v4：原子化 CSS 的巅峰

### 5.1 工作原理

Tailwind 不生成 CSS 文件，而是通过"扫描 HTML → 按需生成原子类"的方式工作：

```
源码:
┌─────────────────────────────────┐
│ <div class="flex p-4 bg-blue-500">│
│   <span class="text-white font-bold">│
│ </div>                            │
└─────────────────────────────────┘
           │
           ▼ JIT 编译器扫描
           │
┌─────────────────────────────────┐
│ 使用的类:                        │
│ - flex                          │
│ - p-4                          │
│ - bg-blue-500                  │
│ - text-white                    │
│ - font-bold                    │
└─────────────────────────────────┘
           │
           ▼ 只生成用到的 CSS
┌─────────────────────────────────┐
│ .flex { display: flex; }       │
│ .p-4 { padding: 1rem; }        │
│ .bg-blue-500 { bg: #3b82f6; }  │
│ .text-white { color: #fff; }    │
│ .font-bold { font-weight: 700; }│
└─────────────────────────────────┘
```

### 5.2 Tailwind v4 的新特性

```css
/* 1. @theme 指令：在 CSS 中定义设计系统 */
@theme {
  /* 颜色 */
  --color-primary: #3b82f6;
  --color-secondary: #10b981;

  /* 间距 */
  --spacing-section: 4rem;

  /* 圆角 */
  --radius-card: 12px;

  /* 阴影 */
  --shadow-card: 0 4px 6px -1px rgba(0,0,0,0.1);
}

/* 2. 使用自定义主题值 */
.card {
  background: var(--color-primary);
  border-radius: var(--radius-card);
  padding: var(--spacing-section);
}

/* 3. 状态变体 */
.button {
  background: var(--color-primary);
}

.button:hover {
  background: var(--color-secondary);
}
```

### 5.3 任意值语法

```html
<!-- 精确值 -->
<div class="w-[127px] h-[calc(100vh-64px)]">
  精确的像素值和计算值
</div>

<!-- 任意属性 -->
<div class="[--my-var:theme(colors.gray.500)]">
  CSS 变量
</div>

<!-- 伪类变体 -->
<button class="hover:bg-blue-500 focus:ring-2 disabled:opacity-50">
  多状态支持
</button>
```

### 5.4 组件化：@apply 指令

```css
/* 提取为组件类 */
.btn {
  @apply inline-flex items-center justify-center
         px-4 py-2 rounded-lg font-medium
         transition-colors duration-200
         focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.btn-primary {
  @apply bg-blue-500 text-white
         hover:bg-blue-600 focus:ring-blue-500;
}

.btn-secondary {
  @apply bg-gray-200 text-gray-900
         hover:bg-gray-300 focus:ring-gray-500;
}
```

---

## 6. UnoCSS：动态原子化引擎

### 6.1 UnoCSS 架构

```
┌─────────────────────────────────────────────────┐
│                   UnoCSS                         │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐  ┌──────────────────────────┐│
│  │  Presets    │  │     Transformations      ││
│  │  - preset-uno│  │  - Attributify         ││
│  │  - preset-  │  │  - Icons               ││
│  │    wind     │  │  - Shortcuts           ││
│  │  - preset-  │  │                        ││
│  │    icons    │  │                        ││
│  └──────────────┘  └──────────────────────────┘│
│          │                    │                │
│          ▼                    ▼                │
│  ┌──────────────────────────────────────────┐ │
│  │              Virtual FS                   │ │
│  │  (按需生成的 CSS，像虚拟模块一样工作)    │ │
│  └──────────────────────────────────────────┘ │
│                     │                          │
│                     ▼                          │
│  ┌──────────────────────────────────────────┐ │
│  │        浏览器 (仅加载使用的样式)          │ │
│  └──────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 6.2 配置示例

```typescript
// uno.config.ts
import { defineConfig, presetUno, presetAttributify, presetIcons } from 'unocss';

export default defineConfig({
  presets: [
    // 核心预设（原子类）
    presetUno(),
    // 属性模式：<button bg="blue-500 hover:blue-600">
    presetAttributify(),
    // 图标预设
    presetIcons({
      scale: 1.2,
      cdn: 'https://esm.sh/',
    }),
  ],

  // 自定义快捷方式
  shortcuts: {
    'btn': 'px-4 py-2 rounded-lg font-medium transition-colors',
    'btn-primary': 'btn bg-blue-500 text-white hover:bg-blue-600',
    'card': 'bg-white rounded-xl shadow-lg p-6',
  },

  // 自定义规则
  rules: [
    // 静态规则
    ['m-1', { margin: '0.25rem' }],
    // 动态规则
    [/^text-(.*)$/, ([, c]) => ({ 'font-size': `var(--text-${c})` })],
  ],

  // 预检核（预扫描）
  safelist: [
    // 始终保留的类
    'text-red-500',
    'bg-active',
  ],
});
```

### 6.3 Attributify 模式

```html
<!-- 传统写法 -->
<button class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:ring-2">
  按钮
</button>

<!-- Attributify 写法 -->
<button bg="blue-500 hover:blue-600" text="white" p="y-2 x-4" rounded="lg" focus="ring-2">
  按钮
</button>

<!-- Vue/React 中的使用 -->
<template>
  <div
    w="full"
    h="screen"
    p="4"
    bg="gray-100"
    :class="{ 'bg-blue-500': isActive }"
  >
    内容
  </div>
</template>
```

---

## 7. Vanilla Extract：零运行时 CSS-in-JS

### 7.1 原理

Vanilla Extract 在构建时生成静态 CSS 文件，零运行时开销：

```typescript
// Button.css.ts
import { style, styleVariants } from '@vanilla-extract/css';

// 1. 基础样式
export const button = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 16px',
  borderRadius: '8px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
});

// 2. 变体（编译时展开）
export const buttonVariants = styleVariants({
  primary: {
    backgroundColor: '#3b82f6',
    color: 'white',
    ':hover': {
      backgroundColor: '#2563eb',
    },
  },
  secondary: {
    backgroundColor: '#e5e7eb',
    color: '#374151',
    ':hover': {
      backgroundColor: '#d1d5db',
    },
  },
});

// 3. 大小变体
export const buttonSizes = styleVariants({
  small: { padding: '4px 8px', fontSize: '14px' },
  medium: { padding: '8px 16px', fontSize: '16px' },
  large: { padding: '12px 24px', fontSize: '18px' },
});
```

### 7.2 生成的文件

```css
/* 编译后生成的 Button.css */

/* 静态哈希类名 */
. Button_button__1xKmUc {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.Button_buttonVariants__primary__1xKmUc {
  background-color: #3b82f6;
  color: white;
}

/* ... 完整生成的 CSS ... */
```

---

## 8. CSS 架构选型指南

### 8.1 技术对比

| 方案 | 运行时开销 | 样式隔离 | 开发体验 | 适用场景 |
|------|-----------|----------|----------|----------|
| **CSS Modules** | 无 | ✅ 类名哈希 | 好 | Next.js 项目，SSR |
| **styled-components** | 高 | ✅ CSS-in-JS | 优秀 | 动态样式多的应用 |
| **Emotion** | 中 | ✅ CSS-in-JS | 好 | 需要性能的 CSS-in-JS |
| **Tailwind CSS** | 无 | ⚠️ 需手动管理 | 好 | 快速开发，中后台 |
| **UnoCSS** | 无 | ⚠️ 需手动管理 | 好 | 高度定制化项目 |
| **Vanilla Extract** | 无 | ✅ 类型安全 | 好 | 类型敏感的大型项目 |

### 8.2 2026 年推荐

```
传统企业级应用 / SSR 优先
└── CSS Modules + Tailwind (组合使用)

动态主题 / 组件库
└── Emotion 或 styled-components

性能敏感 / 静态站点
└── Vanilla Extract 或 UnoCSS

快速原型 / 中后台系统
└── Tailwind CSS

高度定制化 / 设计系统
└── Vanilla Extract + CSS Variables
```

---

## 9. 设计系统实战

### 9.1 基于 CSS Variables 的主题系统

```css
/* design-system.css */

/* 1. 颜色系统 */
:root {
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-900: #1e3a8a;

  /* 语义化颜色 */
  --color-background: var(--color-white);
  --color-text: var(--color-gray-900);
  --color-text-muted: var(--color-gray-500);
}

/* 暗色主题 */
[data-theme="dark"] {
  --color-background: var(--color-gray-900);
  --color-text: var(--color-white);
  --color-text-muted: var(--color-gray-400);
}

/* 2. 间距系统 */
:root {
  --spacing-unit: 4px;
  --spacing-1: calc(var(--spacing-unit) * 1);   /* 4px */
  --spacing-2: calc(var(--spacing-unit) * 2);   /* 8px */
  --spacing-3: calc(var(--spacing-unit) * 3);   /* 12px */
  --spacing-4: calc(var(--spacing-unit) * 4);   /* 16px */
  --spacing-6: calc(var(--spacing-unit) * 6);   /* 24px */
  --spacing-8: calc(var(--spacing-unit) * 8);   /* 32px */
}

/* 3. 组件 token */
:root {
  --button-bg: var(--color-primary-500);
  --button-color: white;
  --button-radius: var(--radius-md);
  --button-padding: var(--spacing-2) var(--spacing-4);
}
```

### 9.2 组件 token 应用

```typescript
// button.css.ts (Vanilla Extract)
import { style } from '@vanilla-extract/css';

export const button = style({
  backgroundColor: 'var(--button-bg)',
  color: 'var(--button-color)',
  borderRadius: 'var(--button-radius)',
  padding: 'var(--button-padding)',
  border: 'none',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
  ':hover': {
    backgroundColor: 'var(--color-primary-600)',
  },
});
```

---

*本文档持续更新，最后更新于 2026 年 3 月*
