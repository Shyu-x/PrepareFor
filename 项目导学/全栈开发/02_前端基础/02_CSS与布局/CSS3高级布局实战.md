# CSS3高级布局实战

## 目录

1. [Flexbox弹性布局深入](#1-flexbox弹性布局深入)
2. [Grid网格布局精通](#2-grid网格布局精通)
3. [响应式布局方案](#3-响应式布局方案)
4. [CSS变量与主题系统](#4-css变量与主题系统)
5. [CSS动画与过渡](#5-css动画与过渡)
6. [面试高频问题](#6-面试高频问题)

---

## 1. Flexbox弹性布局深入

### 1.1 Flexbox核心概念

```
┌─────────────────────────────────────────────────────────────┐
│                    Flexbox布局模型                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   main axis (主轴)                   │   │
│  │    ─────────────────────────────────────────────►    │   │
│  │                                                     │   │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │   │
│  │  │      │ │      │ │      │ │      │              │   │
│  │  │ Item │ │ Item │ │ Item │ │ Item │              │   │
│  │  │  1   │ │  2   │ │  3   │ │  4   │              │   │
│  │  │      │ │      │ │      │ │      │              │   │
│  │  └──────┘ └──────┘ └──────┘ └──────┘              │   │
│  │                                                     │   │
│  │    ◄─────────────────────────────────────────────   │   │
│  │                cross axis (交叉轴)                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  容器属性:                                                  │
│  - flex-direction: 主轴方向                                │
│  - flex-wrap: 换行方式                                     │
│  - justify-content: 主轴对齐                               │
│  - align-items: 交叉轴对齐                                 │
│  - align-content: 多行对齐                                 │
│                                                             │
│  项目属性:                                                  │
│  - flex-grow: 放大比例                                     │
│  - flex-shrink: 缩小比例                                   │
│  - flex-basis: 初始大小                                    │
│  - flex: 简写属性                                          │
│  - align-self: 单独对齐                                    │
│  - order: 排列顺序                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Flexbox实战布局

```css
/* Flexbox实战布局 */

/* 1. 水平垂直居中 */
.center-container {
  display: flex;
  justify-content: center;  /* 主轴居中 */
  align-items: center;      /* 交叉轴居中 */
}

/* 2. 圣杯布局 */
.holy-grail {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.holy-grail-header,
.holy-grail-footer {
  flex: none; /* 不伸缩 */
}

.holy-grail-body {
  display: flex;
  flex: 1; /* 占据剩余空间 */
}

.holy-grail-content {
  flex: 1;
}

.holy-grail-nav,
.holy-grail-ads {
  flex: 0 0 200px; /* 固定宽度 */
}

.holy-grail-nav {
  order: -1; /* 导航在左侧 */
}

/* 3. 等分布局 */
.equal-columns {
  display: flex;
}

.equal-columns > * {
  flex: 1; /* 每列等宽 */
}

/* 4. 底部固定 */
.sticky-footer {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.sticky-footer-content {
  flex: 1 0 auto;
}

.sticky-footer-footer {
  flex-shrink: 0;
}

/* 5. 响应式卡片网格 */
.card-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.card {
  flex: 1 1 300px; /* 最小300px，可伸缩 */
  max-width: 100%;
}

/* 6. 导航栏布局 */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.navbar-brand {
  flex: none;
}

.navbar-menu {
  display: flex;
  gap: 20px;
}

.navbar-actions {
  display: flex;
  gap: 10px;
}

/* 7. 侧边栏布局 */
.sidebar-layout {
  display: flex;
}

.sidebar {
  flex: 0 0 250px;
  transition: flex-basis 0.3s;
}

.sidebar.collapsed {
  flex-basis: 60px;
}

.main-content {
  flex: 1;
  min-width: 0; /* 防止内容溢出 */
}

/* 8. 输入框组合 */
.input-group {
  display: flex;
}

.input-group input {
  flex: 1;
  min-width: 0;
}

.input-group button {
  flex: none;
}

/* 9. 媒体对象 */
.media-object {
  display: flex;
  align-items: flex-start;
  gap: 15px;
}

.media-object-figure {
  flex: none;
}

.media-object-body {
  flex: 1;
  min-width: 0;
}

/* 10. 粘性页脚 */
.page-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.page-content {
  flex: 1 0 auto;
}

.page-footer {
  flex-shrink: 0;
}
```

### 1.3 Flexbox常见问题

```css
/* Flexbox常见问题解决 */

/* 1. 文本溢出省略 */
.flex-text-ellipsis {
  display: flex;
  min-width: 0; /* 关键 */
}

.flex-text-ellipsis .text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 2. 子元素高度不一致 */
.flex-stretch {
  display: flex;
  align-items: stretch; /* 子元素高度拉伸 */
}

/* 3. 最后一个元素右对齐 */
.flex-last-right {
  display: flex;
}

.flex-last-right > :last-child {
  margin-left: auto;
}

/* 4. 保持子元素原始尺寸 */
.flex-original-size {
  display: flex;
}

.flex-original-size > * {
  flex: none; /* 或 flex: 0 0 auto */
}

/* 5. 多行等高布局 */
.flex-equal-height {
  display: flex;
  flex-wrap: wrap;
}

.flex-equal-height > * {
  display: flex;
  flex-direction: column;
}

.flex-equal-height > * > * {
  flex: 1;
}

/* 6. 解决flex子项margin塌陷 */
.flex-with-margin {
  display: flex;
  gap: 20px; /* 使用gap替代margin */
}

/* 7. flex-basis与width的区别 */
.flex-basis-example {
  display: flex;
}

.flex-basis-example .item {
  /* flex-basis: 在flex容器中生效 */
  /* width: 在非flex容器中生效 */
  flex-basis: 200px;
  width: 300px; /* 被flex-basis覆盖 */
}

/* 8. 防止flex子项收缩 */
.flex-no-shrink {
  display: flex;
}

.flex-no-shrink .item {
  flex-shrink: 0; /* 不收缩 */
  min-width: max-content; /* 保持内容宽度 */
}
```

---

## 2. Grid网格布局精通

### 2.1 Grid核心概念

```css
/* Grid核心概念 */

/*
┌─────────────────────────────────────────────────────────────┐
│                     Grid布局模型                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  容器属性:                                                  │
│  - grid-template-columns: 列轨道                            │
│  - grid-template-rows: 行轨道                               │
│  - grid-template-areas: 区域命名                            │
│  - grid-gap / gap: 间距                                     │
│  - grid-auto-columns: 隐式列轨道                            │
│  - grid-auto-rows: 隐式行轨道                               │
│  - grid-auto-flow: 自动放置算法                             │
│  - justify-items: 水平对齐（所有项目）                      │
│  - align-items: 垂直对齐（所有项目）                        │
│  - place-items: 两者简写                                    │
│  - justify-content: 网格水平对齐                            │
│  - align-content: 网格垂直对齐                              │
│                                                             │
│  项目属性:                                                  │
│  - grid-column-start/end: 列起止线                          │
│  - grid-row-start/end: 行起止线                             │
│  - grid-column/row: 简写                                    │
│  - grid-area: 区域命名                                      │
│  - justify-self: 单个项目水平对齐                           │
│  - align-self: 单个项目垂直对齐                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
*/

/* 基础网格 */
.basic-grid {
  display: grid;
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: auto 1fr auto;
  gap: 20px;
  min-height: 100vh;
}

/* 使用fr单位 */
.fr-grid {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr; /* 1:2:1比例 */
}

/* repeat函数 */
.repeat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 3列等宽 */
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); /* 响应式 */
}

/* minmax函数 */
.minmax-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
}
```

### 2.2 Grid实战布局

```css
/* Grid实战布局 */

/* 1. 经典圣杯布局 */
.grid-holy-grail {
  display: grid;
  grid-template-areas:
    "header header header"
    "nav main ads"
    "footer footer footer";
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
  gap: 20px;
}

.grid-holy-grail > header { grid-area: header; }
.grid-holy-grail > nav { grid-area: nav; }
.grid-holy-grail > main { grid-area: main; }
.grid-holy-grail > aside { grid-area: ads; }
.grid-holy-grail > footer { grid-area: footer; }

/* 2. 响应式圣杯布局 */
.responsive-holy-grail {
  display: grid;
  grid-template-areas:
    "header"
    "main"
    "nav"
    "ads"
    "footer";
  grid-template-columns: 1fr;
  grid-template-rows: auto;
  min-height: 100vh;
  gap: 20px;
}

@media (min-width: 768px) {
  .responsive-holy-grail {
    grid-template-areas:
      "header header header"
      "nav main ads"
      "footer footer footer";
    grid-template-columns: 200px 1fr 200px;
  }
}

/* 3. 照片墙布局 */
.photo-wall {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  grid-auto-rows: 200px;
  grid-auto-flow: dense; /* 填充空白 */
  gap: 10px;
}

.photo-wall .large {
  grid-column: span 2;
  grid-row: span 2;
}

.photo-wall .wide {
  grid-column: span 2;
}

.photo-wall .tall {
  grid-row: span 2;
}

/* 4. 仪表盘布局 */
.dashboard {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: auto repeat(3, 200px);
  gap: 20px;
}

.dashboard-header {
  grid-column: 1 / -1; /* 跨越所有列 */
}

.dashboard-chart {
  grid-column: span 2;
  grid-row: span 2;
}

/* 5. 卡片网格 */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

/* 6. 杂志布局 */
.magazine-layout {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 200px;
  gap: 15px;
}

.magazine-layout .featured {
  grid-column: span 2;
  grid-row: span 2;
}

/* 7. 表单布局 */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.form-grid .full-width {
  grid-column: 1 / -1;
}

/* 8. 产品列表 */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 30px;
}

/* 9. 复杂页面布局 */
.complex-layout {
  display: grid;
  grid-template-columns: 250px 1fr 250px;
  grid-template-rows: 60px 1fr 40px;
  grid-template-areas:
    "header header header"
    "sidebar main aside"
    "footer footer footer";
  min-height: 100vh;
}

/* 10. 瀑布流布局（近似） */
.masonry-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 10px;
}

.masonry-item {
  grid-row: span var(--row-span);
}
```

### 2.3 Grid高级技巧

```css
/* Grid高级技巧 */

/* 1. 子网格（Subgrid） */
.parent-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.child-grid {
  display: grid;
  grid-template-columns: subgrid; /* 继承父网格 */
  grid-column: 1 / -1;
}

/* 2. 网格叠加 */
.overlap-grid {
  display: grid;
  grid-template-areas: "stack";
}

.overlap-grid > * {
  grid-area: stack;
}

/* 3. 自适应网格 */
.adaptive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
}

/* 4. 固定侧边栏 */
.fixed-sidebar {
  display: grid;
  grid-template-columns: 250px 1fr;
}

/* 5. 隐式网格控制 */
.implicit-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: minmax(100px, auto);
}

/* 6. 网格对齐 */
.grid-alignment {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  justify-items: center; /* 项目水平居中 */
  align-items: center;   /* 项目垂直居中 */
  justify-content: center; /* 网格整体水平居中 */
  align-content: center;   /* 网格整体垂直居中 */
}

/* 7. 响应式网格 */
.responsive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

/* 8. 网格间距 */
.grid-gap {
  display: grid;
  gap: 20px; /* 行列间距相同 */
  gap: 20px 10px; /* 行间距 列间距 */
  row-gap: 20px;
  column-gap: 10px;
}
```

---

## 3. 响应式布局方案

### 3.1 媒体查询策略

```css
/* 媒体查询策略 */

/* 1. 移动优先 */
/* 默认样式为移动端 */
.container {
  padding: 15px;
}

/* 平板 */
@media (min-width: 768px) {
  .container {
    padding: 30px;
  }
}

/* 桌面 */
@media (min-width: 1024px) {
  .container {
    padding: 50px;
  }
}

/* 大屏 */
@media (min-width: 1440px) {
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
}

/* 2. 桌面优先 */
/* 默认样式为桌面 */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 50px;
}

/* 平板 */
@media (max-width: 1023px) {
  .container {
    padding: 30px;
  }
}

/* 移动端 */
@media (max-width: 767px) {
  .container {
    padding: 15px;
  }
}

/* 3. 断点变量 */
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}

/* 4. 响应式字体 */
.text-responsive {
  font-size: clamp(1rem, 2vw + 1rem, 2rem);
}

/* 5. 响应式间距 */
.spacing-responsive {
  padding: clamp(1rem, 5vw, 3rem);
}

/* 6. 容器查询（现代方案） */
.card-container {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .card {
    display: flex;
  }
}

/* 7. 响应式图片 */
img {
  max-width: 100%;
  height: auto;
}

picture {
  display: block;
}

/* 8. 响应式网格 */
.responsive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
}
```

### 3.2 响应式组件

```css
/* 响应式组件 */

/* 1. 响应式导航 */
.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
}

.nav-menu {
  display: flex;
  gap: 1rem;
}

.nav-toggle {
  display: none;
}

@media (max-width: 767px) {
  .nav-menu {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    flex-direction: column;
    background: white;
    padding: 1rem;
  }

  .nav-menu.active {
    display: flex;
  }

  .nav-toggle {
    display: block;
  }
}

/* 2. 响应式卡片 */
.card {
  display: flex;
  flex-direction: column;
}

@media (min-width: 768px) {
  .card {
    flex-direction: row;
  }

  .card-image {
    width: 40%;
  }

  .card-content {
    width: 60%;
  }
}

/* 3. 响应式表格 */
.table-wrapper {
  overflow-x: auto;
}

.table {
  width: 100%;
  min-width: 600px;
}

@media (max-width: 767px) {
  .table-mobile-label {
    display: block;
  }

  .table thead {
    display: none;
  }

  .table tr {
    display: block;
    margin-bottom: 1rem;
  }

  .table td {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem;
  }

  .table td::before {
    content: attr(data-label);
    font-weight: bold;
  }
}

/* 4. 响应式表单 */
.form {
  display: grid;
  gap: 1rem;
}

@media (min-width: 768px) {
  .form {
    grid-template-columns: repeat(2, 1fr);
  }

  .form-group.full {
    grid-column: 1 / -1;
  }
}

/* 5. 响应式侧边栏 */
.layout {
  display: grid;
  grid-template-columns: 1fr;
  min-height: 100vh;
}

@media (min-width: 1024px) {
  .layout {
    grid-template-columns: 250px 1fr;
  }
}

/* 6. 响应式页脚 */
.footer {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
}

@media (min-width: 768px) {
  .footer {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

---

## 4. CSS变量与主题系统

### 4.1 CSS变量基础

```css
/* CSS变量基础 */

/* 1. 定义变量 */
:root {
  /* 颜色 */
  --color-primary: #007bff;
  --color-secondary: #6c757d;
  --color-success: #28a745;
  --color-danger: #dc3545;
  --color-warning: #ffc107;
  --color-info: #17a2b8;

  /* 文本颜色 */
  --color-text: #333333;
  --color-text-light: #666666;
  --color-text-muted: #999999;

  /* 背景颜色 */
  --color-bg: #ffffff;
  --color-bg-secondary: #f8f9fa;

  /* 边框 */
  --border-color: #dee2e6;
  --border-radius: 4px;

  /* 间距 */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* 字体 */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.25rem;
  --font-size-xl: 1.5rem;

  /* 阴影 */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

  /* 过渡 */
  --transition-fast: 150ms ease;
  --transition-normal: 300ms ease;
  --transition-slow: 500ms ease;

  /* 层级 */
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
}

/* 2. 使用变量 */
.button {
  background-color: var(--color-primary);
  color: white;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  transition: background-color var(--transition-fast);
}

.button:hover {
  background-color: color-mix(in srgb, var(--color-primary) 85%, black);
}

/* 3. 变量回退值 */
.element {
  color: var(--custom-color, var(--color-text));
}

/* 4. 局部变量 */
.card {
  --card-padding: var(--spacing-md);
  padding: var(--card-padding);
}

.card.compact {
  --card-padding: var(--spacing-sm);
}

/* 5. 响应式变量 */
:root {
  --container-padding: 15px;
}

@media (min-width: 768px) {
  :root {
    --container-padding: 30px;
  }
}

@media (min-width: 1024px) {
  :root {
    --container-padding: 50px;
  }
}
```

### 4.2 主题系统实现

```css
/* 主题系统实现 */

/* 1. 浅色主题（默认） */
:root {
  --color-bg: #ffffff;
  --color-text: #333333;
  --color-surface: #f5f5f5;
}

/* 2. 深色主题 */
[data-theme="dark"] {
  --color-bg: #1a1a1a;
  --color-text: #e0e0e0;
  --color-surface: #2d2d2d;
}

/* 3. 系统主题自动切换 */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-bg: #1a1a1a;
    --color-text: #e0e0e0;
    --color-surface: #2d2d2d;
  }
}

/* 4. 语义化颜色变量 */
:root {
  --color-bg-primary: var(--color-bg);
  --color-bg-secondary: var(--color-surface);
  --color-text-primary: var(--color-text);
  --color-text-secondary: color-mix(in srgb, var(--color-text) 70%, transparent);
}

/* 5. 主题切换过渡 */
html {
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* 6. 组件主题适配 */
.card {
  background-color: var(--color-bg);
  color: var(--color-text);
  border: 1px solid var(--border-color);
}

.button {
  background-color: var(--color-primary);
  color: white;
}

.button.outline {
  background-color: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
}

/* 7. 主题色板 */
:root {
  --palette-primary-50: #e3f2fd;
  --palette-primary-100: #bbdefb;
  --palette-primary-200: #90caf9;
  --palette-primary-300: #64b5f6;
  --palette-primary-400: #42a5f5;
  --palette-primary-500: #2196f3;
  --palette-primary-600: #1e88e5;
  --palette-primary-700: #1976d2;
  --palette-primary-800: #1565c0;
  --palette-primary-900: #0d47a1;
}

/* 8. 动态主题色 */
:root {
  --primary-h: 210;
  --primary-s: 100%;
  --primary-l: 50%;
  --color-primary: hsl(var(--primary-h), var(--primary-s), var(--primary-l));
  --color-primary-light: hsl(var(--primary-h), var(--primary-s), calc(var(--primary-l) + 10%));
  --color-primary-dark: hsl(var(--primary-h), var(--primary-s), calc(var(--primary-l) - 10%));
}
```

---

## 5. CSS动画与过渡

### 5.1 过渡动画

```css
/* 过渡动画 */

/* 1. 基础过渡 */
.element {
  transition: all 0.3s ease;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

/* 2. 过渡属性详解 */
.transition-demo {
  transition-property: transform, opacity;
  transition-duration: 300ms;
  transition-timing-function: ease-in-out;
  transition-delay: 100ms;
}

/* 3. 缓动函数 */
.easing-demo {
  /* 预定义 */
  transition-timing-function: ease;
  transition-timing-function: ease-in;
  transition-timing-function: ease-out;
  transition-timing-function: ease-in-out;
  transition-timing-function: linear;

  /* 贝塞尔曲线 */
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);

  /* 步进 */
  transition-timing-function: steps(4, end);
}

/* 4. 常用过渡效果 */
.fade-in {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.fade-in.visible {
  opacity: 1;
}

.slide-up {
  transform: translateY(20px);
  opacity: 0;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-up.visible {
  transform: translateY(0);
  opacity: 1;
}

.scale-in {
  transform: scale(0.9);
  opacity: 0;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.scale-in.visible {
  transform: scale(1);
  opacity: 1;
}

/* 5. 悬停效果 */
.button {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.button:active {
  transform: translateY(0);
}

/* 6. 焦点效果 */
.input {
  border: 2px solid var(--border-color);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
  outline: none;
}
```

### 5.2 关键帧动画

```css
/* 关键帧动画 */

/* 1. 定义关键帧 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-30px);
  }
  60% {
    transform: translateY(-15px);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateX(-10px);
  }
  20%, 40%, 60%, 80% {
    transform: translateX(10px);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 2. 应用动画 */
.animated-fade {
  animation: fadeIn 0.5s ease forwards;
}

.animated-slide {
  animation: slideIn 0.5s ease-out;
}

.animated-bounce {
  animation: bounce 1s ease infinite;
}

.animated-pulse {
  animation: pulse 2s ease-in-out infinite;
}

.animated-spin {
  animation: spin 1s linear infinite;
}

/* 3. 动画属性详解 */
.animation-demo {
  animation-name: fadeIn;
  animation-duration: 0.5s;
  animation-timing-function: ease;
  animation-delay: 0.2s;
  animation-iteration-count: 1;
  animation-direction: normal;
  animation-fill-mode: forwards;
  animation-play-state: running;
}

/* 4. 动画简写 */
.animation-shorthand {
  animation: fadeIn 0.5s ease 0.2s 1 normal forwards running;
}

/* 5. 多动画 */
.multi-animation {
  animation: fadeIn 0.5s ease, slideIn 0.5s ease 0.5s;
}

/* 6. 暂停动画 */
.animation-paused {
  animation-play-state: paused;
}

/* 7. 加载动画 */
.loader {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 8. 骨架屏动画 */
.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
```

### 5.3 性能优化

```css
/* CSS动画性能优化 */

/* 1. 使用transform和opacity */
/* ✅ 好：GPU加速 */
.optimized-animation {
  transform: translateX(100px);
  opacity: 0.5;
  transition: transform 0.3s, opacity 0.3s;
}

/* ❌ 差：触发重排 */
.bad-animation {
  left: 100px;
  transition: left 0.3s;
}

/* 2. 使用will-change */
.will-change-demo {
  will-change: transform, opacity;
}

/* 3. 使用GPU加速层 */
.gpu-accelerated {
  transform: translateZ(0);
  /* 或 */
  backface-visibility: hidden;
}

/* 4. 避免动画过多元素 */
/* ✅ 好：动画容器 */
.container {
  transition: transform 0.3s;
}

/* ❌ 差：动画大量子元素 */
.container > * {
  transition: transform 0.3s;
}

/* 5. 使用CSS变量优化 */
:root {
  --animation-duration: 0.3s;
  --animation-easing: cubic-bezier(0.4, 0, 0.2, 1);
}

.animated {
  transition: all var(--animation-duration) var(--animation-easing);
}

/* 6. 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 6. 面试高频问题

### 问题1：Flexbox和Grid的区别？

**答案：**
| 方面 | Flexbox | Grid |
|------|---------|------|
| 维度 | 一维 | 二维 |
| 方向 | 行或列 | 行和列同时 |
| 适用场景 | 导航、卡片列表 | 页面布局、复杂网格 |
| 对齐 | 主轴和交叉轴 | 行和列独立控制 |

### 问题2：flex: 1是什么意思？

**答案：** `flex: 1` 是 `flex: 1 1 0` 的简写：
- `flex-grow: 1` - 可以放大
- `flex-shrink: 1` - 可以缩小
- `flex-basis: 0` - 初始大小为0

### 问题3：如何实现水平垂直居中？

**答案：**
```css
/* 方法1：Flexbox */
.center { display: flex; justify-content: center; align-items: center; }

/* 方法2：Grid */
.center { display: grid; place-items: center; }

/* 方法3：绝对定位 */
.center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }
```

### 问题4：CSS变量有什么优势？

**答案：**
1. 主题切换方便
2. 减少重复代码
3. JavaScript可读写
4. 作用域控制
5. 响应式设计

### 问题5：如何优化CSS动画性能？

**答案：**
1. 使用transform和opacity
2. 开启GPU加速
3. 使用will-change
4. 避免重排重绘
5. 减少动画元素数量

---

## 7. 最佳实践总结

### 7.1 布局选择指南

| 场景 | 推荐方案 |
|------|----------|
| 居中 | Flexbox或Grid |
| 导航栏 | Flexbox |
| 卡片列表 | Grid或Flexbox |
| 页面布局 | Grid |
| 表单布局 | Grid |
| 响应式 | Grid + 媒体查询 |

### 7.2 CSS清单

- [ ] 使用语义化类名
- [ ] 使用CSS变量
- [ ] 移动优先响应式
- [ ] 优化动画性能
- [ ] 支持深色模式
- [ ] 减少重排重绘
## 8. 深入原理分析

### 8.1 CSS 布局引擎的工作流程

当浏览器渲染一个页面时，CSS 布局引擎按照以下流程工作：

```
┌─────────────────────────────────────────────────────────┐
│                   CSS 渲染流水线                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. 解析 HTML → DOM 树                                  │
│           ↓                                              │
│  2. 解析 CSS → CSSOM 树                                 │
│           ↓                                              │
│  3. DOM + CSSOM → Render Tree（渲染树）                  │
│           ↓                                              │
│  4. 布局（Layout/Reflow）→ 计算每个元素的位置和大小       │
│           ↓                                              │
│  5. 绘制（Paint）→ 将每个元素绘制到多个图层               │
│           ↓                                              │
│  6. 合成（Composite）→ 将所有图层合成为最终画面           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**布局（Layout）触发条件：**
- 元素尺寸变化（width/height、padding、margin）
- 内容变化（文本、图片加载）
- 元素位置变化（top/left/right/bottom）
- 字体变化
- 窗口尺寸变化

**绘制（Paint）触发条件：**
- 背景色变化
- 前景色变化（color）
- 边框变化
- 阴影变化
- visibility: hidden（不触发 layout，但触发 paint）

**仅合成（Composite）触发条件（性能最优）：**
- transform: translate/scale/rotate
- opacity
- filter（某些情况下）

### 8.2 Flexbox 算法深入解析

Flexbox 的布局算法可以分解为以下步骤：

```
┌─────────────────────────────────────────────────┐
│            Flexbox 布局算法                       │
├─────────────────────────────────────────────────┤
│                                                  │
│  第一步：确定主轴方向（flex-direction）            │
│  - row：主轴水平，从左到右                        │
│  - row-reverse：主轴水平，从右到左                 │
│  - column：主轴垂直，从上到下                     │
│  - column-reverse：主轴垂直，从下到上              │
│                                                  │
│  第二步：确定交叉轴方向（始终垂直于主轴）            │
│  - row → 交叉轴垂直（上下）                      │
│  - column → 交叉轴水平（左右）                   │
│                                                  │
│  第三步：计算 flex-item 的基准尺寸                 │
│  - flex-basis vs width/height 优先级：            │
│    flex-basis > width/height（主轴方向）          │
│                                                  │
│  第四步：处理 flex-shrink（收缩）                  │
│  - 计算收缩权重：flex-shrink × flex-basis          │
│  - 计算超出量：sum(flex-basis) - container-size   │
│  - 收缩量 = 超出量 × (权重占比)                    │
│                                                  │
│  第五步：处理 flex-grow（扩展）                    │
│  - 可用空间 = 容器尺寸 - sum(收缩后尺寸)           │
│  - 扩展量 = 可用空间 × (grow占比)                  │
│                                                  │
│  第六步：处理对齐                                  │
│  - 主轴对齐：justify-content                      │
│  - 交叉轴对齐：align-items / align-self           │
│  - 多行/列对齐：align-content                     │
│                                                  │
└─────────────────────────────────────────────────┘
```

**flex-shrink 收缩算法示例：**

```css
/* 容器宽度 500px，三个子元素 */
.container {
  display: flex;
  width: 500px;
}

.item1 { flex-basis: 200px; flex-shrink: 1; }  /* 原始 200px */
.item2 { flex-basis: 200px; flex-shrink: 2; }  /* 原始 200px */
.item3 { flex-basis: 200px; flex-shrink: 1; }  /* 原始 200px */
```

```
总基准尺寸：600px，超出量：100px

收缩权重：
- item1: 1 × 200 = 200
- item2: 2 × 200 = 400
- item3: 1 × 200 = 200
总权重：800

实际收缩量：
- item1: 100 × (200/800) = 25px  → 最终 175px
- item2: 100 × (400/800) = 50px  → 最终 150px
- item3: 100 × (200/800) = 25px  → 最终 175px

验证：175 + 150 + 175 = 500px
```

### 8.3 Grid 布局算法深入解析

Grid 是二维布局系统，同时处理行和列：

```
┌─────────────────────────────────────────────────────┐
│              Grid 双维度布局模型                       │
├─────────────────────────────────────────────────────┤
│                                                      │
│  显式网格（explicit grid）：                          │
│    grid-template-columns: 100px 1fr 200px;           │
│    grid-template-rows: auto 1fr auto;                │
│                                                      │
│  隐式网格（implicit grid）：                          │
│    grid-auto-rows: minmax(100px, auto);              │
│    （当内容超出显式行时自动创建）                       │
│                                                      │
│  网格线编号：                                        │
│    ┌─────────┬─────────┬─────────┐                  │
│    │1,1│1,2  │1,3 │1,4  │1,5│                      │
│    │────┼─────┼────┼─────┼────│                      │
│    │2,1│2,2  │2,3 │2,4  │2,5│                      │
│    └─────────┴─────────┴─────────┘                  │
│                                                      │
│  单元格定位：                                        │
│    .item { grid-column: 2 / 4; } /* 占第2-3列 */     │
│    .item { grid-row: 1 / 3; }    /* 占第1-2行 */    │
│                                                      │
│  自动放置算法（auto-placement）：                     │
│    按行优先（默认）→ 按列优先（grid-auto-flow: column）│
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 8.4 视觉格式化模型与包含块

CSS 的视觉格式化模型决定了浏览器如何处理文档树中的每个元素：

```css
/* 包含块（Containing Block）的确定规则 */

.block {
  /* 块级元素的宽度 = 包含块宽度的 100% */
  width: 100%; /* 相对于包含块 */
  max-width: 800px;
}

/* 绝对定位：相对于最近的定位祖先（position != static） */
.absolute-wrapper {
  position: relative; /* 成为包含块 */
  width: 500px;
}

.absolute-child {
  position: absolute;
  top: 0;
  right: 0;
  /* 相对于 .absolute-wrapper，包含块 = 500px */
  width: 50%; /* = 250px */
}

/* 固定定位：始终相对于视口 */
.fixed-element {
  position: fixed;
  top: 0;
  left: 0;
  /* 始终相对于浏览器视口定位 */
  width: 100vw;
}

/* sticky 定位：相对定位 + 固定定位的混合 */
.sticky-header {
  position: sticky;
  top: 0;
  /* 在滚动容器内表现为相对定位，滚动到阈值后表现为固定定位 */
}
```

## 9. CSS Houdini 深入探索

### 9.1 CSS Houdini 简介

CSS Houdini 是浏览器提供的一组 API，允许开发者介入浏览器的 CSS 引擎，实现以前只能靠 JavaScript 或根本无法实现的渲染效果。

```
┌─────────────────────────────────────────────────────────┐
│              CSS Houdini API 分层                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  高层 API（已广泛支持）                                  │
│  ├── Paint API：自定义背景、边框绘制                      │
│  ├── Layout API：自定义布局算法                          │
│  └── Animation Worklet：高性能动画                        │
│                                                          │
│  中层 API（部分支持）                                     │
│  ├── Properties & Values API：自定义 CSS 属性与类型        │
│  └── Font Metrics API：字体度量信息                       │
│                                                          │
│  底层 API（实验性）                                      │
│  └── Parser API：介入 CSS 解析过程                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 9.2 Paint API 实战

Paint API 允许使用 JavaScript 绘制背景、边框等渲染效果：

```javascript
// paint-worklet.js
class DotPattern {
  static get inputProperties() {
    // 声明需要监听的 CSS 属性
    return ['--dot-color', '--dot-size', '--dot-spacing'];
  }

  paint(ctx, geom, properties) {
    // ctx: CanvasRenderingContext2D
    // geom: { width, height }
    const color = properties.get('--dot-color').toString().trim() || '#000';
    const size = parseFloat(properties.get('--dot-size')) || 10;
    const spacing = parseFloat(properties.get('--dot-spacing')) || 20;

    ctx.fillStyle = color;

    // 绘制点阵图案
    for (let x = size / 2; x < geom.width; x += spacing) {
      for (let y = size / 2; y < geom.height; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

// 注册绘制器（需在 CSS 中注册）
registerPaint('dot-pattern', DotPattern);
```

```css
/* 使用自定义绘制 */
.pattern-bg {
  background-image: paint(dot-pattern);
  --dot-color: #007bff;
  --dot-size: 8px;
  --dot-spacing: 24px;
}
```

### 9.3 Properties & Values API（自定义属性类型）

```javascript
// 注册带类型的 CSS 自定义属性
if (CSS.registerProperty) {
  CSS.registerProperty({
    name: '--gradient-angle',
    syntax: '<angle>',
    inherits: false,
    initialValue: '0deg',
  });

  CSS.registerProperty({
    name: '--card-scale',
    syntax: '<number>',
    inherits: true,
    initialValue: '1',
  });

  CSS.registerProperty({
    name: '--theme-color',
    syntax: '<color>',
    inherits: true,
    initialValue: '#007bff',
  });
}
```

```css
/* 注册后，CSS 过渡/插值就能正常工作 */
.card {
  --card-scale: 1;
  transform: scale(var(--card-scale));
  transition: --card-scale 0.3s ease; /* 现在可以过渡自定义属性 */
}

.card:hover {
  --card-scale: 1.05; /* hover 时平滑过渡 */
}
```

## 10. 常见面试高频问题

### 问题1：说说 CSS 盒模型

**参考答案：**

CSS 盒模型描述了文档树中每个元素生成的矩形盒子，以及如何根据 CSS 属性（尺寸、边距、边框、内边距）来排列和布局这些盒子。

有两种盒模型：

**标准盒模型（W3C 盒模型）：**
- `box-sizing: content-box`（默认值）
- 元素宽度 = content（内容）宽度
- 总宽度 = content + padding + border + margin

**IE 盒模型（替代盒模型）：**
- `box-sizing: border-box`
- 元素宽度 = content + padding + border 的总和
- 总宽度 = 元素宽度 + margin

实际开发中，推荐在全局样式中设置：

```css
*, *::before, *::after {
  box-sizing: border-box; /* 全局采用 border-box */
}
```

### 问题2：Flexbox 和 Grid 的区别是什么？

**参考答案（按年份演进）：**

| 维度 | Flexbox | Grid |
|------|---------|------|
| 维度 | 一维（单行或单列） | 二维（行和列同时控制） |
| 适用场景 | 导航栏、卡片列表、表单项 | 页面整体布局、相册、时间线 |
| 定位方式 | 内容驱动（内容决定尺寸） | 容器驱动（先定义网格，再放内容） |
| 对齐能力 | 强大（justify/align） | 更强大（同时支持两个方向） |
| 响应式 | 适合简单响应式 | 适合复杂响应式（配合 minmax） |
| 学习曲线 | 平缓 | 陡峭但强大 |

**典型选择：**
- 一维导航栏 → Flexbox
- 二维页面布局 → Grid
- 组合使用 → Grid 布局整体，Flexbox 布局内部元素

### 问题3：如何实现垂直居中？

**参考答案（按年份演进）：**

```css
/* 方法1：flexbox（推荐，现代标准） */
.parent {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 方法2：grid */
.parent {
  display: grid;
  place-items: center; /* 两行合并为一行 */
}

/* 方法3：绝对定位 + transform */
.parent {
  position: relative;
}
.child {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* 方法4：绝对定位 + margin auto（需已知尺寸） */
.parent {
  position: relative;
}
.child {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
  width: 200px;  /* 已知尺寸 */
  height: 100px;
}
```

### 问题4：如何优化 CSS 动画性能？

**参考答案：**

1. **使用 transform 和 opacity**：这两个属性的变化不会触发布局和重绘，浏览器只需在合成层处理。

```css
/* 正确：GPU 加速，仅触发合成 */
.box { transition: transform 0.3s, opacity 0.3s; }

/* 错误：触发重排，性能差 */
.box { transition: left 0.3s, top 0.3s; }
```

2. **使用 will-change 提示浏览器优化**：

```css
.animated-element {
  will-change: transform, opacity; /* 提前提升到独立合成层 */
}
```

3. **避免布局抖动**：动画过程中不要同时修改影响布局的属性。

4. **使用 contain 属性隔离重排影响范围**：

```css
.animated-component {
  contain: layout style paint;
}
```

### 问题5：CSS 选择器优先级是如何计算的？

**参考答案：**

CSS 特异性（Specificity）计算公式：`(a, b, c)`
- `a`：ID 选择器的数量
- `b`：类选择器、属性选择器、伪类（:hover、:focus 等）的数量
- `c`：元素选择器、伪元素（::before、::after）的数量
- `*`（通配符）不参与计算

```css
/*  specificity: (0, 1, 1) */
.container .card { }

/*  specificity: (1, 0, 0) */
#app { }

/*  specificity: (0, 2, 1) */
a:hover::before { }

/*  specificity: (1, 1, 1) */
#app .nav a { }

/* specificity: (0, 0, 0) */
* { }
```

优先级规则：`(1,0,0) > (0,1,1) > (0,1,0) > (0,0,1)`

相同优先级时，后定义的规则覆盖先定义的规则（源码顺序）。`!important` 会覆盖普通规则。

---

*本文档最后更新于 2026年3月*

*本文档最后更新于 2026年3月*