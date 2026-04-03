# CSS3深入学习

## 目录

1. [CSS选择器优先级](#1-css选择器优先级)
2. [Flexbox完整指南](#2-flexbox完整指南)
3. [CSS Grid布局系统](#3-css-grid布局系统)
4. [CSS动画与过渡](#4-css动画与过渡)
5. [响应式设计](#5-响应式设计)
6. [CSS变量与自定义属性](#6-css变量与自定义属性)
7. [CSS架构](#7-css架构)

---

## 1. CSS选择器优先级

### 1.1 选择器类型概述

CSS 选择器有不同的优先级层级，理解这些层级对于编写可维护的 CSS 代码至关重要。

#### 选择器优先级层级

```
优先级从低到高：
1. 元素选择器（div, p, span）
2. 伪元素（::before, ::after）
3. 类选择器（.class）
4. 属性选择器（[type="text"]）
5. 伪类（:hover, :focus）
6. ID选择器（#id）
7. 内联样式（style="..."）

特殊规则：
- !important 最高优先级
- 相同优先级时，后定义的样式覆盖先定义的样式
```

### 1.2 优先级计算规则

#### specificity（特异性）计算

```css
/* 简单记忆法：a, b, c, d 四个级别 */

/* a: 行内样式 */
<div style="color: red;">   /* a=1, b=0, c=0, d=0 */

/* b: ID 选择器 */
#header {}                  /* a=0, b=1, c=0, d=0 */

/* c: 类选择器、属性选择器、伪类 */
.active {}                  /* a=0, b=0, c=1, d=0 */
[type="text"] {}            /* a=0, b=0, c=1, d=0 */
:hover {}                   /* a=0, b=0, c=1, d=0 */

/* d: 元素选择器、伪元素 */
div {}                      /* a=0, b=0, c=0, d=1 */
::before {}                 /* a=0, b=0, c=0, d=1 */

/* 通配符、关系运算符不增加特异性 */
* {}                        /* a=0, b=0, c=0, d=0 */
div, p {}                   /* a=0, b=0, c=0, d=2 */
div > p {}                  /* a=0, b=0, c=0, d=2 */
```

#### 优先级计算示例

```css
/* specificity: 0,0,1,1 */
.style p {}

/* specificity: 0,1,0,1 */
#header div {}

/* specificity: 0,1,1,2 */
#nav li.active {}

/* specificity: 0,0,2,3 */
ul li:first-child {}

/* specificity: 0,1,0,0 */
#app {}
```

### 1.3 优先级实战技巧

#### 避免优先级冲突

```css
/* ❌ 不好的做法：依赖选择器顺序和特异性覆盖 */
.header .nav .nav-item {
    color: blue;
}

.nav .nav-item {
    color: red;  /* 会被上面的覆盖 */
}

/* ✅ 好的做法：使用明确的类名 */
.nav-item {
    color: blue;
}

.nav-item--highlighted {
    color: red;
}

/* 最佳实践：使用 BEM 命名 */
.nav__item {}
.nav__item--active {}
```

#### 正确使用 !important

```css
/* !important 应该谨慎使用，主要场景： */

/* 1. 覆盖第三方库的样式（作为最后的手段） */
.custom-button {
    background-color: #ff0000 !important;
}

/* 2. 工具类（utility classes） */
.text-center {
    text-align: center !important;
}

.d-block {
    display: block !important;
}

/* 3. 打印样式 */
@media print {
    .no-print {
        display: none !important;
    }
}

/* 4. 动态样式（用户切换主题等） */
[data-theme="dark"] .text-primary {
    color: #ffffff !important;
}
```

#### 优先级管理最佳实践

```css
/* 推荐的特异性层级 */

/* 第一层：基础元素样式（低特异性） */
body {}
h1, h2, h3 {}
a {}

/* 第二层：类选择器（中等特异性） */
.container {}
.card {}
.button {}

/* 第三层：状态和变体（较高特异性） */
.button--primary {}
.button:hover {}

/* 第四层：特定组件（高特异性） */
.modal__close-button {}

/* 避免使用 ID 选择器，因为特异性过高 */
#header {}  /* 不推荐 */
.header {}  /* 推荐 */
```

### 1.4 JavaScript 获取计算样式

```javascript
// 获取元素的最终计算样式
const element = document.querySelector('.my-element');

// 获取所有计算后的样式
const styles = window.getComputedStyle(element);

// 获取特定属性
const color = window.getComputedStyle(element).color;
const fontSize = window.getComputedStyle(element).fontSize;

// 获取伪元素样式
const beforeContent = window.getComputedStyle(element, '::before').content;

// 获取 CSS 变量
const primaryColor = window.getComputedStyle(element).getPropertyValue('--primary-color');
```

### 1.5 常见面试问题

**问题1：CSS 选择器的优先级如何计算？**

答案：
- 内联样式（style 属性）：优先级最高
- ID 选择器（#id）：次高优先级
- 类选择器（.class）、属性选择器、伪类：中等优先级
- 元素选择器、伪元素：最低优先级
- 相同优先级时，后定义的样式生效
- !important 最高优先级，但应尽量避免使用

**问题2：如何覆盖一个高优先级的选择器？**

答案：
1. 使用更高优先级的选择器（增加特异性）
2. 使用相同优先级但写在后面的选择器
3. 使用 !important（最后手段）
4. 修改 HTML 添加类名或 ID

---

## 2. Flexbox完整指南

### 2.1 Flexbox 概述

Flexbox（弹性盒子）是一种一维布局模型，特别适合处理行或列中的元素对齐和分布。

#### 核心概念

```
Flex Container（Flex 容器）
├── flex-direction: row | column
├── justify-content: 主轴对齐
└── align-items: 交叉轴对齐

Flex Items（Flex 项目）
├── flex-grow: 放大比例
├── flex-shrink: 缩小比例
├── flex-basis: 基准尺寸
└── align-self: 自身对齐
```

### 2.2 Flex 容器属性

#### flex-direction（主轴方向）

```css
/* 水平方向（默认） */
.flex-container {
    display: flex;
    flex-direction: row;
}

/* 水平反向 */
.flex-container {
    display: flex;
    flex-direction: row-reverse;
}

/* 垂直方向 */
.flex-container {
    display: flex;
    flex-direction: column;
}

/* 垂直反向 */
.flex-container {
    display: flex;
    flex-direction: column-reverse;
}
```

#### justify-content（主轴对齐）

```css
/* 开始对齐（默认） */
.flex-container {
    justify-content: flex-start;
}

/* 结束对齐 */
.flex-container {
    justify-content: flex-end;
}

/* 居中对齐 */
.flex-container {
    justify-content: center;
}

/* 两端对齐，项目之间间距相等 */
.flex-container {
    justify-content: space-between;
}

/* 每个项目两侧间距相等 */
.flex-container {
    justify-content: space-around;
}

/* 项目之间和两端的间距都相等 */
.flex-container {
    justify-content: space-evenly;
}
```

#### align-items（交叉轴对齐）

```css
/* 拉伸占满容器（默认） */
.flex-container {
    align-items: stretch;
}

/* 开始对齐 */
.flex-container {
    align-items: flex-start;
}

/* 结束对齐 */
.flex-container {
    align-items: flex-end;
}

/* 居中对齐 */
.flex-container {
    align-items: center;
}

/* 基线对齐 */
.flex-container {
    align-items: baseline;
}

/* 基线对齐示例 */
.flex-container {
    align-items: baseline;
}

.flex-item:nth-child(1) { font-size: 24px; }
.flex-item:nth-child(2) { font-size: 36px; }
.flex-item:nth-child(3) { font-size: 18px; }
```

#### flex-wrap（换行）

```css
/* 不换行（默认） */
.flex-container {
    flex-wrap: nowrap;
}

/* 换行 */
.flex-container {
    flex-wrap: wrap;
}

/* 反向换行 */
.flex-container {
    flex-wrap: wrap-reverse;
}
```

#### align-content（多行对齐）

```css
/* 只有在 flex-wrap: wrap 时才生效 */

/* 开始对齐 */
.flex-container {
    flex-wrap: wrap;
    align-content: flex-start;
}

/* 结束对齐 */
.flex-container {
    flex-wrap: wrap;
    align-content: flex-end;
}

/* 居中对齐 */
.flex-container {
    flex-wrap: wrap;
    align-content: center;
}

/* 两端对齐 */
.flex-container {
    flex-wrap: wrap;
    align-content: space-between;
}

/* 均匀分布 */
.flex-container {
    flex-wrap: wrap;
    align-content: space-around;
}

/* 拉伸占满 */
.flex-container {
    flex-wrap: wrap;
    align-content: stretch;
}
```

#### gap（间距）

```css
/* 行间距和列间距 */
.flex-container {
    display: flex;
    gap: 20px;
}

/* 分别设置 */
.flex-container {
    display: flex;
    gap: 10px 20px; /* row-gap column-gap */
}

/* 单独设置 */
.flex-container {
    display: flex;
    row-gap: 10px;
    column-gap: 20px;
}
```

### 2.3 Flex 项目属性

#### flex-basis（基准尺寸）

```css
/* 设置基准宽度 */
.flex-item {
    flex-basis: 200px;
}

/* auto（默认）：项目自身尺寸 */
.flex-item {
    flex-basis: auto;
}

/* 内容自适应 */
.flex-item {
    flex-basis: content;
}
```

#### flex-grow（放大比例）

```css
/* 默认 0：不放大 */
.flex-item {
    flex-grow: 0;
}

/* 全部项目等比放大 */
.flex-container {
    display: flex;
}
.flex-item {
    flex-grow: 1;
}

/* 按比例放大 */
.flex-item:nth-child(1) { flex-grow: 1; }
.flex-item:nth-child(2) { flex-grow: 2; }  /* 是第一个的2倍 */
.flex-item:nth-child(3) { flex-grow: 3; }  /* 是第一个的3倍 */
```

#### flex-shrink（缩小比例）

```css
/* 默认 1：允许缩小 */
.flex-item {
    flex-shrink: 1;
}

/* 不允许缩小 */
.flex-item {
    flex-shrink: 0;
    flex-basis: 200px;
}
```

#### flex 简写

```css
/* flex: none => flex: 0 0 auto */
.flex-item {
    flex: none;
}

/* flex: auto => flex: 1 1 auto */
.flex-item {
    flex: auto;
}

/* flex: 1 => flex: 1 1 0% */
.flex-item {
    flex: 1;
}

/* 完整写法：flex-grow flex-shrink flex-basis */
.flex-item {
    flex: 1 0 200px;
}
```

#### align-self（自身对齐）

```css
/* 继承容器的 align-items */
.flex-item {
    align-self: auto;
}

/* 开始对齐 */
.flex-item {
    align-self: flex-start;
}

/* 结束对齐 */
.flex-item {
    align-self: flex-end;
}

/* 居中对齐 */
.flex-item {
    align-self: center;
}

/* 基线对齐 */
.flex-item {
    align-self: baseline;
}

/* 拉伸占满 */
.flex-item {
    align-self: stretch;
}
```

#### order（排序）

```css
/* 默认 0，数值越小越靠前 */
.flex-item:nth-child(1) { order: 3; }
.flex-item:nth-child(2) { order: 1; }
.flex-item:nth-child(3) { order: 2; }

/* 负值 */
.flex-item:nth-child(1) { order: -1; }  /* 最前 */
```

### 2.4 Flexbox 实战布局

#### 垂直居中

```css
/* 经典垂直居中 */
.flex-center {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
}
```

#### 圣杯布局

```css
/* 圣杯布局：header + main + footer */
body {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    margin: 0;
}

header, footer {
    flex: 0 0 auto;
}

main {
    flex: 1 1 auto;
}
```

#### 等高列布局

```css
/* 等高列 */
.container {
    display: flex;
}

.column {
    flex: 1;
    padding: 20px;
}
```

#### 响应式导航栏

```css
.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background: #333;
    color: white;
}

.nav-links {
    display: flex;
    gap: 1rem;
}

@media (max-width: 768px) {
    .navbar {
        flex-direction: column;
    }

    .nav-links {
        flex-direction: column;
        width: 100%;
    }
}
```

#### 卡片网格

```css
.card-container {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
}

.card {
    flex: 1 1 300px;
    max-width: calc(33.333% - 20px);
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
}

/* 响应式调整 */
@media (max-width: 1024px) {
    .card {
        max-width: calc(50% - 20px);
    }
}

@media (max-width: 600px) {
    .card {
        max-width: 100%;
    }
}
```

### 2.5 常见面试问题

**问题1：flex: 1 是什么意思？**

答案：`flex: 1` 是 `flex: 1 1 0%` 的简写，表示：
- `flex-grow: 1`：允许放大
- `flex-shrink: 1`：允许缩小
- `flex-basis: 0%`：基准尺寸为 0

这会使项目平均分配容器的剩余空间。

**问题2：flexbox 和 grid 有什么区别？**

答案：
- Flexbox：适用于一维布局（行或列）
- Grid：适用于二维布局（行和列同时控制）

**问题3：如何实现子元素超出父容器时换行？**

答案：使用 `flex-wrap: wrap`，这样当子元素总和超过父容器宽度时，会自动换行显示。

---

## 3. CSS Grid布局系统

### 3.1 Grid 概述

CSS Grid 是一个二维布局系统，可以同时控制行和列，特别适合构建复杂的页面布局。

#### 核心概念

```
Grid Container（网格容器）
├── grid-template-rows / columns: 定义网格轨道
├── gap: 网格间距
└── grid-template-areas: 命名区域

Grid Item（网格项目）
├── grid-column / grid-row: 放置位置
└── grid-area: 指定到命名区域
```

### 3.2 网格容器属性

#### grid-template-columns / rows（定义网格轨道）

```css
/* 固定宽度列 */
.grid-container {
    display: grid;
    grid-template-columns: 100px 100px 100px;
}

/* 百分比 */
.grid-container {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;
}

/* repeat() 简写 */
.grid-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
}

/* auto-fill 自动填充 */
.grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

/* auto-fit 自适应填充 */
.grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

/* 命名网格线 */
.grid-container {
    display: grid;
    grid-template-columns: [start] 1fr [middle] 2fr [end] 1fr;
}
```

#### grid-template-areas（命名区域）

```css
/* 定义网格区域 */
.grid-container {
    display: grid;
    grid-template-areas:
        "header header header"
        "sidebar main main"
        "footer footer footer";
    grid-template-rows: auto 1fr auto;
    grid-template-columns: 200px 1fr 1fr;
    gap: 20px;
}

.header { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main { grid-area: main; }
.footer { grid-area: footer; }

/* 区域也可以用 . 表示空单元格 */
.grid-container {
    grid-template-areas:
        "header header ."
        "sidebar main main"
        "footer footer footer";
}
```

#### gap（间距）

```css
/* 行间距和列间距 */
.grid-container {
    display: grid;
    gap: 20px;
}

/* 分别设置 */
.grid-container {
    display: grid;
    row-gap: 10px;
    column-gap: 20px;
}

/* 响应式 */
.grid-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
}

@media (max-width: 768px) {
    .grid-container {
        grid-template-columns: 1fr;
        gap: 10px;
    }
}
```

#### justify-items / align-items（项目对齐）

```css
/* 水平对齐 */
.grid-container {
    justify-items: start | end | center | stretch;
}

/* 垂直对齐 */
.grid-container {
    align-items: start | end | center | stretch;
}

/* 简写 place-items */
.grid-container {
    place-items: center center;
}
```

#### justify-content / align-content（内容对齐）

```css
/* 当网格小于容器时的对齐方式 */

/* 水平对齐 */
.grid-container {
    justify-content: start | end | center | stretch | space-around | space-between | space-evenly;
}

/* 垂直对齐 */
.grid-container {
    align-content: start | end | center | stretch | space-around | space-between | space-evenly;
}
```

### 3.3 网格项目属性

#### grid-column / grid-row（放置位置）

```css
/* 指定起始和结束位置 */
.grid-item {
    grid-column: 1 / 3;  /* 从第1条线到第3条线 */
    grid-row: 1 / 2;
}

/* 使用 span 跨越 */
.grid-item {
    grid-column: span 2;  /* 跨越2列 */
    grid-row: span 3;     /* 跨越3行 */
}

/* 负数从末尾计算 */
.grid-item {
    grid-column: -1 / -2;
}

/* 命名网格线 */
.grid-container {
    grid-template-columns: [col-start] 1fr [col-end] 1fr;
}
.grid-item {
    grid-column: col-start / col-end;
}
```

#### grid-area（指定到区域）

```css
/* 放置到命名区域 */
.grid-item {
    grid-area: header;
}

/* 语法：row-start / col-start / row-end / col-end */
.grid-item {
    grid-area: 1 / 1 / 2 / 4;
}
```

#### justify-self / align-self（自身对齐）

```css
/* 单独对齐某个项目 */
.grid-item {
    justify-self: start | end | center | stretch;
    align-self: start | end | center | stretch;
}

/* 简写 */
.grid-item {
    place-self: center center;
}
```

### 3.4 Grid 实战布局

#### 经典 12 列栅格系统

```css
/* 12列栅格 */
.grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 20px;
}

/* 列类 */
.col-1 { grid-column: span 1; }
.col-2 { grid-column: span 2; }
.col-3 { grid-column: span 3; }
.col-4 { grid-column: span 4; }
.col-6 { grid-column: span 6; }
.col-8 { grid-column: span 8; }
.col-12 { grid-column: span 12; }

/* 响应式 */
@media (max-width: 1024px) {
    .col-md-1 { grid-column: span 1; }
    .col-md-6 { grid-column: span 6; }
    .col-md-12 { grid-column: span 12; }
}

@media (max-width: 768px) {
    .col-sm-1 { grid-column: span 1; }
    .col-sm-12 { grid-column: span 12; }
}
```

#### 响应式卡片网格

```css
.card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 24px;
    padding: 24px;
}

.card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transition: transform 0.2s, box-shadow 0.2s;
}

.card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}
```

#### 仪表盘布局

```css
.dashboard {
    display: grid;
    grid-template-columns: 250px 1fr;
    grid-template-rows: 60px 1fr;
    grid-template-areas:
        "sidebar header"
        "sidebar main";
    height: 100vh;
}

.sidebar {
    grid-area: sidebar;
    background: #1a1a2e;
}

.header {
    grid-area: header;
    background: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.main-content {
    grid-area: main;
    padding: 20px;
    overflow-y: auto;
}

.dashboard-widgets {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
}

.dashboard-charts {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 20px;
}

@media (max-width: 1024px) {
    .dashboard {
        grid-template-columns: 1fr;
        grid-template-rows: 60px auto 1fr;
        grid-template-areas:
            "header"
            "sidebar"
            "main";
    }

    .sidebar {
        display: none; /* 移动端隐藏或使用汉堡菜单 */
    }

    .dashboard-charts {
        grid-template-columns: 1fr;
    }
}
```

#### 相册网格

```css
.gallery {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-auto-rows: 200px;
    gap: 8px;
    padding: 8px;
}

.gallery-item {
    overflow: hidden;
    border-radius: 8px;
}

.gallery-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
}

.gallery-item:hover img {
    transform: scale(1.1);
}

/* 不同大小的图片布局 */
.gallery-item:nth-child(1) {
    grid-column: span 2;
    grid-row: span 2;
}

.gallery-item:nth-child(4) {
    grid-column: span 2;
}

.gallery-item:nth-child(5) {
    grid-row: span 2;
}
```

### 3.5 常见面试问题

**问题1：Grid 和 Flexbox 有什么区别？**

答案：
- Flexbox 是一维布局，一次只能控制一个方向
- Grid 是二维布局，可以同时控制行和列
- Flexbox 适合组件级别的布局
- Grid 适合页面级别的整体布局

**问题2：grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) 是什么意思？**

答案：
- `repeat(auto-fit, ...)`：自动填充尽可能多的列
- `minmax(200px, 1fr)`：每列最小 200px，最大等比分配剩余空间
- 效果：创建响应式网格列数

**问题3：如何实现网格项目的垂直居中？**

答案：
- 在网格容器上使用 `align-items: center`
- 或在单个项目上使用 `align-self: center`

---

## 4. CSS动画与过渡

### 4.1 transition（过渡）

#### transition 基本语法

```css
/* 简写：property duration timing-function delay */
.element {
    transition: all 0.3s ease;
}

/* 分别设置 */
.element {
    transition-property: background-color, transform;
    transition-duration: 0.3s;
    transition-timing-function: ease-in-out;
    transition-delay: 0s;
}
```

#### 过渡-timing-function

```css
/* 预定义函数 */
.element {
    transition-timing-function: ease;           /* 慢-快-慢 */
    transition-timing-function: linear;         /* 匀速 */
    transition-timing-function: ease-in;         /* 慢-快 */
    transition-timing-function: ease-out;        /* 快-慢 */
    transition-timing-function: ease-in-out;     /* 慢-快-慢 */
    transition-timing-function: step-start;      /* 立即变化 */
    transition-timing-function: step-end;        /* 结束时变化 */
    transition-timing-function: steps(4, end);   /* 分步 */
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); /* 自定义 */
}

/* 自定义贝塞尔曲线可视化 */
.smooth { transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
.bounce { transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55); }
```

#### transition 实战示例

```css
/* 按钮悬停效果 */
.button {
    background-color: #3498db;
    color: white;
    padding: 12px 24px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.button:hover {
    background-color: #2980b9;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4);
}

/* 卡片悬停效果 */
.card {
    background: white;
    padding: 20px;
    border-radius: 8px;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
}

/* 链接悬停效果 */
.link {
    color: #3498db;
    text-decoration: none;
    transition: color 0.2s ease, text-decoration 0.2s ease;
}

.link:hover {
    color: #e74c3c;
    text-decoration: underline;
}

/* 输入框焦点效果 */
.input {
    border: 2px solid #ddd;
    padding: 10px;
    outline: none;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.input:focus {
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
}

/* 菜单展开效果 */
.menu {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.5s ease-out;
}

.menu.open {
    max-height: 500px;
}

/* 淡入淡出效果 */
.fade {
    opacity: 0;
    transition: opacity 0.3s ease;
}

.fade.in {
    opacity: 1;
}
```

### 4.2 animation（动画）

#### @keyframes 定义动画

```css
/* 定义关键帧 */
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
    }
    to {
        transform: translateX(0);
    }
}

@keyframes bounce {
    0%, 100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-20px);
    }
}

@keyframes pulse {
    0%, 100% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.05);
    }
}

@keyframes rotate {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
```

#### animation 属性

```css
/* 简写 */
.element {
    animation: fadeIn 0.5s ease forwards;
}

/* 分别设置 */
.element {
    animation-name: fadeIn;
    animation-duration: 0.5s;
    animation-timing-function: ease;
    animation-delay: 0s;
    animation-iteration-count: 1;
    animation-direction: normal;
    animation-fill-mode: none;
    animation-play-state: running;
}

/* 动画属性详解 */
.element {
    /* 播放次数 */
    animation-iteration-count: 1;      /* 播放1次 */
    animation-iteration-count: infinite; /* 无限循环 */

    /* 播放方向 */
    animation-direction: normal;       /* 正向播放 */
    animation-direction: reverse;      /* 反向播放 */
    animation-direction: alternate;     /* 交替播放 */
    animation-direction: alternate-reverse; /* 反向交替 */

    /* 播放状态 */
    animation-play-state: running;      /* 播放 */
    animation-play-state: paused;       /* 暂停 */

    /* 填充模式 */
    animation-fill-mode: none;          /* 无 */
    animation-fill-mode: forwards;      /* 保持最后状态 */
    animation-fill-mode: backwards;     /* 使用初始状态 */
    animation-fill-mode: both;           /* 两者都有 */
}
```

#### animation 实战示例

```css
/* 加载动画 */
.loader {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* 脉冲动画 */
.pulse {
    animation: pulse 2s ease-in-out infinite;
}

/* 闪烁文字 */
.blink {
    animation: blink 1s step-end infinite;
}

@keyframes blink {
    50% { opacity: 0; }
}

/* 打字机效果 */
.typewriter {
    overflow: hidden;
    white-space: nowrap;
    animation: typing 3s steps(20) forwards;
}

@keyframes typing {
    from { width: 0; }
    to { width: 100%; }
}

/* 渐变背景动画 */
.gradient-bg {
    background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
    background-size: 400% 400%;
    animation: gradient 15s ease infinite;
}

@keyframes gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

/* 悬浮上浮 */
.float {
    animation: float 3s ease-in-out infinite;
}

@keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
}

/* 震动效果 */
.shake {
    animation: shake 0.5s;
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
}
```

### 4.3 transform（变换）

#### transform 函数

```css
/* 移动 */
.translate {
    transform: translate(20px, 30px);
    transform: translateX(20px);
    transform: translateY(30px);
    transform: translateZ(50px);  /* 3D */
    transform: translate3d(20px, 30px, 50px);
}

/* 缩放 */
.scale {
    transform: scale(1.5);
    transform: scale(0.8);
    transform: scaleX(1.5);
    transform: scaleY(0.8);
    transform: scale3d(1.5, 1.5, 1);
}

/* 旋转 */
.rotate {
    transform: rotate(45deg);
    transform: rotateX(45deg);   /* 3D */
    transform: rotateY(45deg);   /* 3D */
    transform: rotateZ(45deg);
    transform: rotate3d(1, 1, 1, 45deg);
}

/* 倾斜 */
.skew {
    transform: skew(20deg);
    transform: skewX(20deg);
    transform: skewY(20deg);
}

/* 矩阵变换 */
.matrix {
    transform: matrix(1, 0, 0, 1, 0, 0);
    /* 相当于：matrix(scaleX, skewY, skewX, scaleY, translateX, translateY) */
}

/* 组合变换 */
.combined {
    transform: translate(20px, 30px) rotate(45deg) scale(1.5);
}
```

#### transform-origin（变换原点）

```css
/* 设置变换原点 */
.origin {
    transform-origin: center center;     /* 默认：中心 */
    transform-origin: top left;           /* 左上角 */
    transform-origin: bottom right;       /* 右下角 */
    transform-origin: 50% 50%;            /* 百分比 */
    transform-origin: 100px 100px;        /* 像素 */
}
```

#### transform 实战示例

```css
/* 卡片悬停 3D 效果 */
.card-3d {
    transform-style: preserve-3d;
    transition: transform 0.5s;
}

.card-3d:hover {
    transform: rotateY(180deg);
}

.card-front,
.card-back {
    position: absolute;
    backface-visibility: hidden;
}

.card-back {
    transform: rotateY(180deg);
}

/* 环形菜单 */
.menu-item {
    transform-origin: center 150px;
}

.menu-item:nth-child(1) { transform: rotate(0deg); }
.menu-item:nth-child(2) { transform: rotate(60deg); }
.menu-item:nth-child(3) { transform: rotate(120deg); }
.menu-item:nth-child(4) { transform: rotate(180deg); }
.menu-item:nth-child(5) { transform: rotate(240deg); }
.menu-item:nth-child(6) { transform: rotate(300deg); }

/* 点击波纹效果 */
.ripple {
    position: relative;
    overflow: hidden;
}

.ripple::after {
    content: '';
    position: absolute;
    width: 200%;
    height: 200%;
    top: -50%;
    left: -50%;
    background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 60%);
    transform: scale(0);
    transition: transform 0.5s, opacity 0.5s;
}

.ripple:active::after {
    transform: scale(1);
    opacity: 0;
}
```

### 4.4 常见面试问题

**问题1：transition 和 animation 有什么区别？**

答案：
- transition：需要触发条件（如 hover），适合简单状态变化
- animation：可自动播放，适合复杂动画
- transition：两个状态之间的过渡
- animation：可定义多个关键帧

**问题2：如何实现无限循环的动画？**

答案：设置 `animation-iteration-count: infinite`

**问题3：transform 为什么不会引起重排（reflow）？**

答案：transform 和 opacity 只影响元素的合成层（compositor layer），不会触发布局计算，所以性能很好。

---

## 5. 响应式设计

### 5.1 媒体查询基础

#### @media 语法

```css
/* 基础语法 */
@media screen and (max-width: 768px) {
    /* 样式规则 */
}

/* 多个条件 */
@media screen and (min-width: 320px) and (max-width: 768px) {
    /* 样式规则 */
}

/* 或条件 */
@media screen and (max-width: 480px), screen and (max-height: 600px) {
    /* 样式规则 */
}

/* not 关键字 */
@media not screen and (color) {
    /* 样式规则 */
}

/* only 关键字（防止老浏览器应用） */
@media only screen and (min-width: 768px) {
    /* 样式规则 */
}
```

#### 媒体类型

```css
/* screen（屏幕） */
@media screen { }

/* print（打印） */
@media print {
    body { font-size: 12pt; }
    .no-print { display: none; }
}

/* speech（屏幕阅读器） */
@media speech { }

/* all（所有） */
@media all { }
```

### 5.2 常见断点

#### 常用断点参考

```css
/* 超级小屏幕 - 手机 */
@media screen and (max-width: 320px) { }

/* 小屏幕 - 大手机 */
@media screen and (min-width: 321px) and (max-width: 480px) { }

/* 中等屏幕 - 平板竖屏 */
@media screen and (min-width: 481px) and (max-width: 768px) { }

/* 大屏幕 - 平板横屏 */
@media screen and (min-width: 769px) and (max-width: 1024px) { }

/* 超大屏幕 - 桌面 */
@media screen and (min-width: 1025px) and (max-width: 1200px) { }

/* 特大屏幕 - 大桌面 */
@media screen and (min-width: 1201px) { }

/* Bootstrap 断点 */
/* 超小设备（手机） */
@media (max-width: 575.98px) { }

/* 小型设备（横屏手机） */
@media (min-width: 576px) and (max-width: 767.98px) { }

/* 中型设备（平板） */
@media (min-width: 768px) and (max-width: 991.98px) { }

/* 大型设备（桌面） */
@media (min-width: 992px) and (max-width: 1199.98px) { }

/* 超大型设备（大桌面） */
@media (min-width: 1200px) { }
```

### 5.3 响应式布局实战

#### 响应式导航栏

```css
/* 基础样式 */
.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background: #333;
    color: white;
}

.nav-links {
    display: flex;
    gap: 2rem;
    list-style: none;
    margin: 0;
    padding: 0;
}

.nav-links a {
    color: white;
    text-decoration: none;
}

.hamburger {
    display: none;
    flex-direction: column;
    gap: 4px;
    cursor: pointer;
}

.hamburger span {
    width: 25px;
    height: 3px;
    background: white;
}

/* 响应式 - 平板及以下 */
@media (max-width: 768px) {
    .hamburger {
        display: flex;
    }

    .nav-links {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        flex-direction: column;
        background: #333;
        padding: 1rem;
    }

    .nav-links.active {
        display: flex;
    }

    .nav-links li {
        padding: 0.5rem 0;
    }
}
```

#### 响应式栅格系统

```css
/* 基础容器 */
.container {
    width: 100%;
    padding: 0 15px;
    margin: 0 auto;
}

/* 栅格系统 */
.row {
    display: flex;
    flex-wrap: wrap;
    margin: 0 -15px;
}

[class*="col-"] {
    padding: 0 15px;
    box-sizing: border-box;
}

/* 默认（手机） */
.col-1 { width: 8.33%; }
.col-2 { width: 16.66%; }
.col-3 { width: 25%; }
.col-4 { width: 33.33%; }
.col-5 { width: 41.66%; }
.col-6 { width: 50%; }
.col-7 { width: 58.33%; }
.col-8 { width: 66.66%; }
.col-9 { width: 75%; }
.col-10 { width: 83.33%; }
.col-11 { width: 91.66%; }
.col-12 { width: 100%; }

/* 平板（≥576px） */
@media (min-width: 576px) {
    .container { max-width: 540px; }
    .col-sm-1 { width: 8.33%; }
    .col-sm-2 { width: 16.66%; }
    .col-sm-3 { width: 25%; }
    .col-sm-4 { width: 33.33%; }
    .col-sm-6 { width: 50%; }
    .col-sm-12 { width: 100%; }
}

/* 桌面（≥768px） */
@media (min-width: 768px) {
    .container { max-width: 720px; }
    .col-md-1 { width: 8.33%; }
    .col-md-2 { width: 16.66%; }
    .col-md-3 { width: 25%; }
    .col-md-4 { width: 33.33%; }
    .col-md-6 { width: 50%; }
    .col-md-8 { width: 66.66%; }
    .col-md-12 { width: 100%; }
}

/* 大桌面（≥992px） */
@media (min-width: 992px) {
    .container { max-width: 960px; }
    .col-lg-1 { width: 8.33%; }
    .col-lg-2 { width: 16.66%; }
    .col-lg-3 { width: 25%; }
    .col-lg-4 { width: 33.33%; }
    .col-lg-6 { width: 50%; }
    .col-lg-12 { width: 100%; }
}
```

### 5.4 响应式图片

```css
/* 响应式图片 */
img {
    max-width: 100%;
    height: auto;
}

/* 图片适配容器 */
.picture-container {
    width: 100%;
    overflow: hidden;
}

.picture-container img {
    width: 100%;
    height: auto;
    object-fit: cover;
}

/* srcset 响应式图片 */
<img srcset="img-400.jpg 400w,
             img-800.jpg 800w,
             img-1200.jpg 1200w"
     sizes="(max-width: 600px) 400px,
            (max-width: 1200px) 800px,
            1200px"
     src="img-800.jpg"
     alt="响应式图片">

/* picture 元素 */
<picture>
    <source media="(max-width: 768px)" srcset="img-mobile.webp">
    <source media="(max-width: 1200px)" srcset="img-tablet.webp">
    <source srcset="img-desktop.webp">
    <img src="img-fallback.jpg" alt="图片">
</picture>
```

### 5.5 常见面试问题

**问题1：响应式设计和移动端适配有什么区别？**

答案：
- 响应式设计：一套代码适配所有屏幕尺寸
- 移动端适配：针对移动设备开发独立版本
- 响应式适合内容型网站，移动适配适合功能复杂的应用

**问题2：移动端适配有哪些方案？**

答案：
1. 媒体查询（@media）
2. 百分比布局
3. rem/em 相对单位
4. viewport 适配
5. vw/vh 视口单位

**问题3：如何选择断点？**

答案：根据目标设备和内容特点选择，常用断点：480px、768px、1024px、1200px。建议先做移动端，然后逐步增强。

---

## 6. CSS变量与自定义属性

### 6.1 CSS 变量基础

#### 定义和使用

```css
/* 定义变量 */
:root {
    /* 颜色变量 */
    --primary-color: #3498db;
    --secondary-color: #2ecc71;
    --text-color: #333;
    --bg-color: #fff;

    /* 间距变量 */
    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --spacing-xl: 32px;

    /* 字号变量 */
    --font-size-sm: 12px;
    --font-size-base: 14px;
    --font-size-lg: 16px;
    --font-size-xl: 20px;

    /* 圆角变量 */
    --border-radius: 4px;
    --border-radius-lg: 8px;

    /* 阴影变量 */
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
    --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
    --shadow-lg: 0 10px 25px rgba(0,0,0,0.15);
}

/* 使用变量 */
.button {
    background-color: var(--primary-color);
    color: white;
    padding: var(--spacing-md);
    border-radius: var(--border-radius);
}

.card {
    background: var(--bg-color);
    box-shadow: var(--shadow-md);
    padding: var(--spacing-lg);
}
```

### 6.2 CSS 变量进阶

#### 变量作为属性值

```css
:root {
    --spacing: 16px;
}

/* 直接使用 */
.box {
    padding: var(--spacing);
}

/* calc() 中使用 */
.box {
    margin: calc(var(--spacing) * 2);
    width: calc(100% - var(--spacing));
}

/* 字符串拼接（不直接支持，但可以用 CSS 变量模拟） */
:root {
    --icon-path: '/icons/';
    --icon-name: 'arrow';
}

/* CSS 变量在 calc 中的应用 */
.card {
    --card-padding: 20px;
    padding: var(--card-padding);
    /* 注意：字符串拼接需要特殊处理 */
}
```

#### 变量的继承和作用域

```css
/* 全局变量 */
:root {
    --text-color: #333;
}

/* 组件级变量 */
.card {
    --card-bg: white;
    --card-padding: 20px;
    background: var(--card-bg);
    padding: var(--card-padding);
}

/* 局部覆盖 */
.card.highlight {
    --card-bg: #f0f8ff;
    --card-padding: 30px;
}

/* 变量继承 */
.card .card-title {
    color: var(--text-color, #000);  /* 回退值 */
}
```

#### 响应式变量

```css
:root {
    --font-size: 16px;
}

/* 响应式调整 */
@media (min-width: 768px) {
    :root {
        --font-size: 18px;
    }
}

@media (min-width: 1200px) {
    :root {
        --font-size: 20px;
    }
}

/* 根据容器大小调整 */
.container {
    --container-padding: 16px;
}

@media (min-width: 768px) {
    .container {
        --container-padding: 24px;
    }
}

.container {
    padding: var(--container-padding);
}
```

### 6.3 JavaScript 操作 CSS 变量

```javascript
// 获取变量值
const styles = getComputedStyle(document.documentElement);
const primaryColor = styles.getPropertyValue('--primary-color').trim();

// 设置变量
document.documentElement.style.setProperty('--primary-color', '#ff0000');

// 删除变量
document.documentElement.style.removeProperty('--primary-color');

// 监听变量变化
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName.startsWith('--')) {
            console.log('CSS 变量变化:', mutation.attributeName);
        }
    });
});

observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['style']
});

// 实时主题切换
function setTheme(theme) {
    const root = document.documentElement;

    if (theme === 'dark') {
        root.style.setProperty('--bg-color', '#1a1a1a');
        root.style.setProperty('--text-color', '#fff');
        root.style.setProperty('--primary-color', '#3498db');
    } else {
        root.style.setProperty('--bg-color', '#fff');
        root.style.setProperty('--text-color', '#333');
        root.style.setProperty('--primary-color', '#3498db');
    }
}
```

### 6.4 CSS 变量实战

#### 主题系统

```css
/* 基础主题 */
:root {
    /* 亮色主题（默认） */
    --theme-bg: #ffffff;
    --theme-text: #333333;
    --theme-primary: #3498db;
    --theme-secondary: #2ecc71;
    --theme-border: #e0e0e0;
    --theme-shadow: rgba(0, 0, 0, 0.1);
}

/* 暗色主题 */
[data-theme="dark"] {
    --theme-bg: #1a1a1a;
    --theme-text: #ffffff;
    --theme-primary: #5dade2;
    --theme-secondary: #58d68d;
    --theme-border: #333333;
    --theme-shadow: rgba(0, 0, 0, 0.3);
}

/* 主题化组件 */
.button {
    background: var(--theme-primary);
    color: var(--theme-bg);
    border: 1px solid var(--theme-border);
}

.card {
    background: var(--theme-bg);
    color: var(--theme-text);
    border: 1px solid var(--theme-border);
    box-shadow: 0 2px 4px var(--theme-shadow);
}
```

#### 组件化变量

```css
/* 按钮组件变量 */
.button {
    --btn-padding-x: 16px;
    --btn-padding-y: 8px;
    --btn-font-size: 14px;
    --btn-border-radius: 4px;
    --btn-bg: #3498db;
    --btn-color: white;

    padding: var(--btn-padding-y) var(--btn-padding-x);
    font-size: var(--btn-font-size);
    border-radius: var(--btn-border-radius);
    background: var(--btn-bg);
    color: var(--btn-color);
    border: none;
    cursor: pointer;
    transition: all 0.2s;
}

/* 按钮变体 */
.button--primary { --btn-bg: #3498db; }
.button--secondary { --btn-bg: #95a5a6; }
.button--success { --btn-bg: #2ecc71; }
.button--danger { --btn-bg: #e74c3c; }

/* 按钮大小 */
.button--sm {
    --btn-padding-x: 12px;
    --btn-padding-y: 4px;
    --btn-font-size: 12px;
}

.button--lg {
    --btn-padding-x: 24px;
    --btn-padding-y: 12px;
    --btn-font-size: 18px;
}
```

### 6.5 常见面试问题

**问题1：CSS 变量和预处理器变量（如 Sass 变量）有什么区别？**

答案：
- CSS 变量：运行时可用，可通过 JavaScript 动态修改，可继承
- 预处理器变量：编译时替换，无法运行时修改，不支持继承

**问题2：CSS 变量如何实现主题切换？**

答案：
1. 定义不同主题的 CSS 变量
2. 使用 data-theme 属性或类名切换
3. 通过 JavaScript 修改 CSS 变量值

**问题3：CSS 变量的回退值是什么？**

答案：使用 `var(--variable, default-value)` 语法，例如 `var(--color, #000)` 表示当 --color 不存在时使用 #000。

---

## 7. CSS架构

### 7.1 BEM 命名规范

#### BEM 概念

```
Block（块）          ->  .block
Element（元素）      ->  .block__element
Modifier（修饰符）   ->  .block--modifier
```

#### BEM 示例

```css
/* 块：独立的组件 */
.card { }

/* 元素：块的子元素 */
.card__header { }
.card__body { }
.card__footer { }
.card__title { }
.card__image { }
.card__text { }
.card__button { }

/* 修饰符：变体 */
.card--featured { }
.card--disabled { }
.card--dark { }

/* 元素也可以有修饰符 */
.card__title--large { }
.card__button--primary { }

/* 嵌套 */
.card {
    background: white;
}

.card__header {
    padding: 16px;
}

.card__title {
    font-size: 18px;
    margin: 0;
}

.card__body {
    padding: 16px;
}

.card__footer {
    padding: 16px;
    border-top: 1px solid #eee;
}
```

#### BEM 实战

```html
<!-- 导航组件 -->
<nav class="nav">
    <ul class="nav__list">
        <li class="nav__item">
            <a class="nav__link" href="/">首页</a>
        </li>
        <li class="nav__item nav__item--active">
            <a class="nav__link nav__link--active" href="/about">关于</a>
        </li>
        <li class="nav__item">
            <a class="nav__link" href="/contact">联系</a>
        </li>
    </ul>
</nav>

<!-- 按钮组件 -->
<button class="btn btn--primary btn--lg">主要按钮</button>
<button class="btn btn--secondary btn--sm">次要按钮</button>
<button class="btn btn--danger">危险按钮</button>

<!-- 表单组件 -->
<form class="form">
    <div class="form__group">
        <label class="form__label">用户名</label>
        <input class="form__input" type="text">
        <span class="form__error">请输入用户名</span>
    </div>
    <div class="form__group">
        <label class="form__label">邮箱</label>
        <input class="form__input form__input--error" type="email">
        <span class="form__error">邮箱格式不正确</span>
    </div>
    <button class="btn btn--primary form__submit">提交</button>
</form>
```

### 7.2 OOCSS（面向对象CSS）

#### 原则

```css
/* 原则1：结构和样式分离 */
.object {
    /* 结构 */
    width: 200px;
    height: 200px;
    /* 样式 */
    background: blue;
    border-radius: 4px;
}

/* 扩展：使用类组合 */
.object {
    width: 200px;
    height: 200px;
}

/* 媒体对象 */
.media {
    display: flex;
    align-items: flex-start;
}

.media__object {
    margin-right: 16px;
}

.media__body {
    flex: 1;
}

/* 按钮对象 */
.btn {
    display: inline-block;
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    text-align: center;
}

.btn--primary {
    background: #3498db;
    color: white;
}

.btn--secondary {
    background: #95a5a6;
    color: white;
}

.btn--large {
    padding: 12px 24px;
    font-size: 18px;
}
```

### 7.3 SMACSS（可扩展模块化CSS架构）

#### 分类

```css
/* 1. Base（基础） - 全局样式 */
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 16px;
    line-height: 1.5;
    color: #333;
    margin: 0;
    padding: 0;
}

a {
    color: #3498db;
    text-decoration: none;
}

/* 2. Layout（布局） - 页面结构 */
.l-header { }
.l-sidebar { }
.l-main { }
.l-footer { }

.l-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 16px;
}

.l-grid {
    display: grid;
    gap: 20px;
}

/* 3. Module（模块） - 可复用组件 */
.card { }
.button { }
.modal { }
.nav { }

/* 4. State（状态） - 组件状态 */
.is-active { }
.is-hidden { }
.is-disabled { }

.modal.is-open { }
.nav.is-scrolled { }

/* 5. Theme（主题） - 视觉主题 */
[data-theme="dark"] {
    --bg-color: #1a1a1a;
    --text-color: #fff;
}
```

### 7.4 CSS 文件组织

```css
/* 文件结构示例 */

/* main.css - 入口文件 */
@import './base/reset.css';
@import './base/typography.css';
@import './layout/grid.css';
@import './layout/header.css';
@import './layout/footer.css';
@import './components/button.css';
@import './components/card.css';
@import './components/modal.css';
@import './state/state.css';
@import './theme/theme.css';
```

### 7.5 常见面试问题

**问题1：BEM 命名规范有什么优缺点？**

答案：
- 优点：类名语义清晰，避免样式冲突，易于维护
- 缺点：类名较长，增加 HTML 复杂度

**问题2：如何选择 CSS 架构方法？**

答案：根据项目规模和团队习惯选择：
- 小型项目：BEM
- 中型项目：OOCSS
- 大型项目：SMACSS 或结合多种方法

**问题3：CSS 模块化有什么好处？**

答案：
1. 样式隔离，避免冲突
2. 提高代码复用性
3. 便于团队协作
4. 易于维护和扩展

---

## 8. 高级实战案例

### 8.1 复杂布局实现

#### 粘性页脚布局

```css
/* 方案1：Flexbox 实现 */
.page {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
}

.page-header {
    flex: 0 0 auto;
}

.page-content {
    flex: 1 0 auto; /* 自动填充剩余空间 */
}

.page-footer {
    flex: 0 0 auto;
}

/* 方案2：Grid 实现 */
.page {
    display: grid;
    grid-template-rows: auto 1fr auto;
    min-height: 100vh;
}

/* 方案3：使用 min-height */
.page-content {
    min-height: calc(100vh - 200px); /* 减去 header + footer 高度 */
}
```

#### 瀑布流布局

```css
/* CSS Columns 实现瀑布流 */
.masonry {
    column-count: 3;
    column-gap: 20px;
}

.masonry-item {
    break-inside: avoid; /* 防止项目被分割 */
    margin-bottom: 20px;
}

/* 响应式瀑布流 */
.masonry {
    column-count: 1;
}

@media (min-width: 576px) {
    .masonry { column-count: 2; }
}

@media (min-width: 992px) {
    .masonry { column-count: 3; }
}

@media (min-width: 1200px) {
    .masonry { column-count: 4; }
}

/* Grid 实现瀑布流（需要 Grid Masonry 支持） */
.masonry-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    grid-auto-rows: 10px;
}

.masonry-item--small { grid-row: span 20; }
.masonry-item--medium { grid-row: span 30; }
.masonry-item--large { grid-row: span 40; }
```

#### 等高多列布局

```css
/* Flexbox 等高列 */
.equal-columns {
    display: flex;
    flex-wrap: wrap;
}

.equal-columns > * {
    flex: 1;
    min-width: 300px;
}

/* Grid 等高列 */
.equal-columns {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

/* 使用 align-items: stretch（默认） */
.columns {
    display: flex;
    align-items: stretch; /* 默认值，子元素自动等高 */
}
```

#### 固定侧边栏布局

```css
/* 固定宽度侧边栏 + 自适应内容 */
.layout {
    display: flex;
    min-height: 100vh;
}

.sidebar {
    flex: 0 0 250px; /* 固定宽度 */
    background: #f5f5f5;
}

.main-content {
    flex: 1;
    min-width: 0; /* 防止内容溢出 */
    padding: 20px;
}

/* 响应式侧边栏 */
@media (max-width: 768px) {
    .layout {
        flex-direction: column;
    }
    
    .sidebar {
        flex: 0 0 auto;
        width: 100%;
    }
}

/* 可折叠侧边栏 */
.sidebar {
    width: 250px;
    transition: width 0.3s ease;
}

.sidebar.collapsed {
    width: 60px;
}

.sidebar.collapsed .sidebar-text {
    display: none;
}
```

### 8.2 复杂组件样式

#### 自定义表单控件

```css
/* 自定义复选框 */
.checkbox {
    position: relative;
    display: inline-flex;
    align-items: center;
    cursor: pointer;
}

.checkbox input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
}

.checkbox__box {
    width: 20px;
    height: 20px;
    border: 2px solid #ccc;
    border-radius: 4px;
    margin-right: 8px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.checkbox__box::after {
    content: '';
    width: 10px;
    height: 6px;
    border: 2px solid white;
    border-top: none;
    border-right: none;
    transform: rotate(-45deg) scale(0);
    transition: transform 0.2s;
}

.checkbox input:checked + .checkbox__box {
    background: #3498db;
    border-color: #3498db;
}

.checkbox input:checked + .checkbox__box::after {
    transform: rotate(-45deg) scale(1);
}

.checkbox input:focus + .checkbox__box {
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.3);
}

/* 自定义开关 */
.switch {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 26px;
}

.switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.switch__slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    border-radius: 26px;
    transition: 0.3s;
}

.switch__slider::before {
    position: absolute;
    content: '';
    height: 20px;
    width: 20px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    border-radius: 50%;
    transition: 0.3s;
}

.switch input:checked + .switch__slider {
    background-color: #3498db;
}

.switch input:checked + .switch__slider::before {
    transform: translateX(24px);
}

/* 自定义下拉菜单 */
.select {
    position: relative;
    width: 200px;
}

.select__trigger {
    padding: 10px 40px 10px 16px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: white;
    cursor: pointer;
}

.select__trigger::after {
    content: '';
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    border: 5px solid transparent;
    border-top-color: #666;
}

.select__options {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-top: 4px;
    max-height: 200px;
    overflow-y: auto;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: all 0.2s;
}

.select.open .select__options {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
}

.select__option {
    padding: 10px 16px;
    cursor: pointer;
}

.select__option:hover {
    background: #f5f5f5;
}
```

#### 工具提示组件

```css
/* 基础工具提示 */
.tooltip {
    position: relative;
    display: inline-block;
}

.tooltip::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%) translateY(-8px);
    padding: 8px 12px;
    background: #333;
    color: white;
    font-size: 12px;
    white-space: nowrap;
    border-radius: 4px;
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s;
}

.tooltip::before {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: #333;
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s;
}

.tooltip:hover::after,
.tooltip:hover::before {
    opacity: 1;
    visibility: visible;
}

/* 多方向工具提示 */
.tooltip--top::after {
    bottom: 100%;
    top: auto;
}

.tooltip--bottom::after {
    top: 100%;
    bottom: auto;
    transform: translateX(-50%) translateY(8px);
}

.tooltip--left::after {
    right: 100%;
    left: auto;
    bottom: auto;
    top: 50%;
    transform: translateY(-50%) translateX(-8px);
}

.tooltip--right::after {
    left: 100%;
    right: auto;
    bottom: auto;
    top: 50%;
    transform: translateY(-50%) translateX(8px);
}
```

---

## 9. 浏览器兼容性处理

### 9.1 CSS 前缀处理

```css
/* 自动添加前缀（推荐使用 Autoprefixer） */
/* 手动添加示例 */

/* Flexbox 兼容 */
.container {
    display: -webkit-box;
    display: -webkit-flex;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-orient: horizontal;
    -webkit-box-direction: normal;
    -webkit-flex-direction: row;
    -ms-flex-direction: row;
    flex-direction: row;
}

/* Grid 兼容 */
.grid {
    display: -ms-grid;
    display: grid;
    -ms-grid-columns: 1fr 20px 1fr 20px 1fr;
    grid-template-columns: repeat(3, 1fr);
    grid-gap: 20px;
}

/* Transform 兼容 */
.transform {
    -webkit-transform: translateX(10px);
    -ms-transform: translateX(10px);
    transform: translateX(10px);
}

/* Transition 兼容 */
.transition {
    -webkit-transition: all 0.3s ease;
    -o-transition: all 0.3s ease;
    transition: all 0.3s ease;
}

/* 渐变兼容 */
.gradient {
    background: -webkit-linear-gradient(left, #fff, #000);
    background: -o-linear-gradient(left, #fff, #000);
    background: linear-gradient(to right, #fff, #000);
}
```

### 9.2 特性检测与降级

```css
/* @supports 特性检测 */
@supports (display: grid) {
    .container {
        display: grid;
    }
}

@supports not (display: grid) {
    .container {
        display: flex;
        flex-wrap: wrap;
    }
}

/* CSS 变量降级 */
.element {
    color: #333; /* 降级值 */
    color: var(--text-color, #333);
}

/* Gap 属性降级 */
.container {
    display: flex;
    margin: -10px; /* 负边距模拟 gap */
}

.container > * {
    margin: 10px;
}

@supports (gap: 10px) {
    .container {
        gap: 20px;
        margin: 0;
    }
    
    .container > * {
        margin: 0;
    }
}

/* aspect-ratio 降级 */
.video-container {
    position: relative;
    padding-bottom: 56.25%; /* 16:9 比例 */
    height: 0;
}

.video-container iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

@supports (aspect-ratio: 16 / 9) {
    .video-container {
        aspect-ratio: 16 / 9;
        padding-bottom: 0;
        height: auto;
    }
}
```

### 9.3 IE 兼容处理

```css
/* IE 11 特定样式 */
@media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {
    /* IE 10+ 样式 */
    .flex-container {
        display: -ms-flexbox;
    }
    
    .flex-item {
        -ms-flex: 1;
    }
}

/* IE 条件注释（HTML 中使用） */
<!--[if IE]>
<link rel="stylesheet" href="ie.css">
<![endif]-->

<!--[if lt IE 9]>
<script src="html5shiv.js"></script>
<![endif]-->

/* IE Grid 布局修复 */
.grid {
    display: -ms-grid;
    display: grid;
    -ms-grid-columns: 1fr 1fr 1fr;
    grid-template-columns: repeat(3, 1fr);
}

.grid-item:nth-child(1) { -ms-grid-column: 1; }
.grid-item:nth-child(2) { -ms-grid-column: 2; }
.grid-item:nth-child(3) { -ms-grid-column: 3; }
```

---

## 10. 性能优化技巧

### 10.1 选择器性能优化

```css
/* ❌ 避免：深层嵌套选择器 */
.header .nav .menu .item .link {
    color: blue;
}

/* ✅ 推荐：扁平化选择器 */
.nav-link {
    color: blue;
}

/* ❌ 避免：通配符选择器 */
* {
    box-sizing: border-box;
}

/* ✅ 推荐：具体选择器 */
html {
    box-sizing: border-box;
}

*, *::before, *::after {
    box-sizing: inherit;
}

/* ❌ 避免：属性选择器（性能较差） */
[type="text"] {
    border: 1px solid #ccc;
}

/* ✅ 推荐：类选择器 */
.text-input {
    border: 1px solid #ccc;
}

/* ❌ 避免：复杂的伪类 */
:nth-child(2n+1) {
    /* 复杂计算 */
}

/* ✅ 推荐：简单伪类 */
:first-child {
    /* 简单选择 */
}
```

### 10.2 渲染性能优化

```css
/* 使用 will-change 提示浏览器 */
.animated-element {
    will-change: transform, opacity;
}

/* 使用 transform 代替 top/left */
/* ❌ 会触发重排 */
.moving-element {
    position: absolute;
    left: 100px;
    transition: left 0.3s;
}

.moving-element:hover {
    left: 200px;
}

/* ✅ 只触发合成 */
.moving-element {
    transform: translateX(100px);
    transition: transform 0.3s;
}

.moving-element:hover {
    transform: translateX(200px);
}

/* 使用 opacity 代替 visibility */
/* ❌ visibility 会触发重绘 */
.hidden {
    visibility: hidden;
}

/* ✅ opacity 可以利用 GPU 加速 */
.hidden {
    opacity: 0;
    pointer-events: none;
}

/* 避免强制同步布局 */
/* ❌ 读取布局属性后立即修改 */
.element {
    width: element.offsetWidth + 10 + 'px';
}

/* ✅ 批量读取，批量写入 */
const width = element.offsetWidth;
element.style.width = width + 10 + 'px';
```

### 10.3 动画性能优化

```css
/* 使用 CSS 动画代替 JavaScript 动画 */
/* ✅ CSS 动画可以利用 GPU 加速 */
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

/* 只动画 transform 和 opacity */
.animated {
    animation: slideIn 0.3s ease-out;
}

/* 使用 contain 属性隔离重排 */
.isolated-component {
    contain: layout style;
}

/* 使用 content-visibility 延迟渲染 */
.below-fold-content {
    content-visibility: auto;
    contain-intrinsic-size: 0 500px; /* 预估高度 */
}

/* 减少动画复杂度 */
@keyframes simple {
    from { opacity: 0; }
    to { opacity: 1; }
}

/* 使用 CSS 变量减少样式计算 */
:root {
    --animation-duration: 0.3s;
    --animation-easing: cubic-bezier(0.4, 0, 0.2, 1);
}

.animated {
    animation-duration: var(--animation-duration);
    animation-timing-function: var(--animation-easing);
}
```

### 10.4 关键渲染路径优化

```html
<!-- 内联关键 CSS -->
<head>
    <style>
        /* 首屏关键样式 */
        body { margin: 0; font-family: system-ui; }
        .header { height: 60px; background: #fff; }
        .hero { min-height: 400px; }
    </style>
</head>

<!-- 异步加载非关键 CSS -->
<link rel="stylesheet" href="main.css" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="main.css"></noscript>
```

---

## 11. 常见陷阱与最佳实践

### 11.1 常见陷阱

#### 陷阱1：margin 重叠

```css
/* 问题：相邻元素的 margin 会重叠 */
.element1 {
    margin-bottom: 20px;
}

.element2 {
    margin-top: 30px;
}
/* 实际间距：30px，不是 50px */

/* 解决方案1：使用 padding */
.element1 {
    padding-bottom: 20px;
}

/* 解决方案2：使用 BFC */
.container {
    overflow: hidden; /* 创建 BFC */
}

/* 解决方案3：使用 Flexbox/Grid */
.container {
    display: flex;
    flex-direction: column;
    gap: 20px;
}
```

#### 陷阱2：z-index 层叠上下文

```css
/* 问题：z-index 不生效 */
.parent1 {
    position: relative;
    z-index: 1;
}

.parent2 {
    position: relative;
    z-index: 2;
}

.child1 {
    position: absolute;
    z-index: 9999; /* 仍然在 parent2 下方 */
}

/* 解决方案：理解层叠上下文 */
/* z-index 只在同一层叠上下文中比较 */
/* 创建新的层叠上下文：position + z-index, opacity < 1, transform 等 */
```

#### 陷阱3：Flexbox 子元素溢出

```css
/* 问题：长文本导致 Flexbox 子元素溢出 */
.container {
    display: flex;
}

.text {
    /* 长文本会撑开容器 */
}

/* 解决方案：添加 min-width: 0 */
.text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
```

#### 陷阱4：position: absolute 定位问题

```css
/* 问题：absolute 定位找不到正确的参照 */
.parent {
    /* 没有 position 属性 */
}

.child {
    position: absolute; /* 相对于最近的定位祖先或 body */
}

/* 解决方案：给父元素添加 position: relative */
.parent {
    position: relative;
}

.child {
    position: absolute;
    top: 10px;
    left: 10px;
}
```

#### 陷阱5：图片下方空隙

```css
/* 问题：图片底部有 3-4px 空隙 */
.container img {
    /* 图片默认是 inline 元素，有基线对齐 */
}

/* 解决方案1：设置 display: block */
img {
    display: block;
}

/* 解决方案2：设置 vertical-align */
img {
    vertical-align: bottom;
}

/* 解决方案3：设置 line-height: 0 */
.container {
    line-height: 0;
}
```

### 11.2 最佳实践清单

```markdown
## CSS 最佳实践清单

### 选择器
- [ ] 避免深层嵌套（最多 3 层）
- [ ] 优先使用类选择器
- [ ] 避免使用 ID 选择器
- [ ] 避免使用 !important

### 布局
- [ ] 优先使用 Flexbox 和 Grid
- [ ] 避免使用 float 布局
- [ ] 使用 gap 代替 margin
- [ ] 使用 aspect-ratio 保持比例

### 性能
- [ ] 使用 transform 和 opacity 做动画
- [ ] 避免频繁触发重排的属性
- [ ] 使用 will-change 提示浏览器
- [ ] 使用 contain 隔离组件

### 响应式
- [ ] 使用移动优先策略
- [ ] 使用相对单位（rem、em、vw）
- [ ] 使用媒体查询适配不同屏幕
- [ ] 图片使用响应式技术

### 可维护性
- [ ] 使用 CSS 变量管理主题
- [ ] 使用 BEM 命名规范
- [ ] 模块化组织 CSS 文件
- [ ] 添加必要的注释
```

---

## 12. 与框架结合使用

### 12.1 React 中的 CSS

```jsx
// CSS Modules
import styles from './Button.module.css';

function Button({ children, variant = 'primary' }) {
    return (
        <button className={`${styles.button} ${styles[variant]}`}>
            {children}
        </button>
    );
}

// CSS Modules 文件
/* Button.module.css */
.button {
    padding: 12px 24px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
}

.primary {
    background: #3498db;
    color: white;
}

.secondary {
    background: #95a5a6;
    color: white;
}

// Styled Components
import styled, { css } from 'styled-components';

const Button = styled.button`
    padding: 12px 24px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    
    ${props => props.$variant === 'primary' && css`
        background: #3498db;
        color: white;
    `}
    
    ${props => props.$variant === 'secondary' && css`
        background: #95a5a6;
        color: white;
    `}
    
    &:hover {
        opacity: 0.9;
    }
`;

// Tailwind CSS
function Card({ title, description }) {
    return (
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-gray-600">{description}</p>
        </div>
    );
}
```

### 12.2 Vue 中的 CSS

```vue
<!-- Scoped CSS -->
<template>
    <div class="card">
        <h3 class="card__title">{{ title }}</h3>
        <p class="card__content">{{ content }}</p>
    </div>
</template>

<style scoped>
.card {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card__title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 10px;
}

.card__content {
    color: #666;
}
</style>

<!-- CSS Modules -->
<template>
    <div :class="$style.card">
        <h3 :class="$style.title">{{ title }}</h3>
    </div>
</template>

<style module>
.card { /* ... */ }
.title { /* ... */ }
</style>

<!-- 使用 CSS 变量 -->
<template>
    <div class="theme-container" :style="cssVars">
        <button class="btn">按钮</button>
    </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    theme: {
        type: String,
        default: 'light'
    }
});

const cssVars = computed(() => ({
    '--bg-color': props.theme === 'dark' ? '#1a1a1a' : '#ffffff',
    '--text-color': props.theme === 'dark' ? '#ffffff' : '#333333'
}));
</script>

<style scoped>
.theme-container {
    background: var(--bg-color);
    color: var(--text-color);
}
</style>
```

### 12.3 Tailwind CSS 最佳实践

```html
<!-- 组件化类名 -->
<!-- ❌ 避免：重复的长类名 -->
<div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
    <!-- ... -->
</div>
<div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
    <!-- ... -->
</div>

<!-- ✅ 推荐：使用 @apply 提取组件 -->
<!-- 在 CSS 文件中 -->
<style>
.card {
    @apply bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow;
}
</style>

<!-- 使用组件类 -->
<div class="card">...</div>

<!-- Tailwind 配置扩展 -->
<!-- tailwind.config.js -->
module.exports = {
    theme: {
        extend: {
            colors: {
                primary: '#3498db',
                secondary: '#2ecc71',
            },
            spacing: {
                '18': '4.5rem',
            },
            borderRadius: {
                '4xl': '2rem',
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/typography'),
    ],
};
```

---

## 13. 面试高频问题汇总

### 13.1 基础问题

**问题1：CSS 盒模型是什么？**

答案：
CSS 盒模型包括：content、padding、border、margin。

- `box-sizing: content-box`（默认）：width 只包含 content
- `box-sizing: border-box`：width 包含 content + padding + border

推荐使用 `border-box`，更直观。

**问题2：BFC 是什么？有什么作用？**

答案：
BFC（Block Formatting Context）块级格式化上下文，是一个独立的渲染区域。

创建 BFC 的方式：
- `float` 不为 none
- `position` 为 absolute 或 fixed
- `display` 为 inline-block、flex、grid
- `overflow` 不为 visible

作用：
- 阻止 margin 重叠
- 清除浮动
- 防止元素被浮动覆盖

**问题3：Flexbox 常用属性有哪些？**

答案：
容器属性：`flex-direction`、`justify-content`、`align-items`、`flex-wrap`、`gap`
项目属性：`flex-grow`、`flex-shrink`、`flex-basis`、`align-self`、`order`

### 13.2 进阶问题

**问题4：CSS 选择器优先级如何计算？**

答案：
使用 (a, b, c, d) 表示：
- a: 行内样式
- b: ID 选择器
- c: 类选择器、属性选择器、伪类
- d: 元素选择器、伪元素

比较时从左到右，数值大的优先级高。

**问题5：如何实现水平垂直居中？**

答案：
```css
/* 方案1：Flexbox */
.container {
    display: flex;
    justify-content: center;
    align-items: center;
}

/* 方案2：Grid */
.container {
    display: grid;
    place-items: center;
}

/* 方案3：绝对定位 + transform */
.element {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

/* 方案4：绝对定位 + margin: auto */
.element {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    margin: auto;
}
```

**问题6：重排和重绘有什么区别？**

答案：
- 重排（Reflow）：元素几何属性变化，需要重新计算布局
- 重绘（Repaint）：元素外观变化，不影响布局

重排一定触发重绘，重绘不一定触发重排。

优化方法：
- 批量修改样式
- 使用 transform 代替 top/left
- 使用 opacity 代替 visibility
- 使用 will-change 提示浏览器

---

## 14. 可视化图表

### 14.1 Flexbox 布局图解

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Flexbox 布局模型                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  flex-direction: row                                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     Main Axis (主轴)                         │   │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐          │   │
│  │  │      │  │      │  │      │  │      │  │      │          │   │
│  │  │ Item │  │ Item │  │ Item │  │ Item │  │ Item │          │   │
│  │  │  1   │  │  2   │  │  3   │  │  4   │  │  5   │          │   │
│  │  │      │  │      │  │      │  │      │  │      │          │   │
│  │  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘          │   │
│  │                                                             │   │
│  │                   Cross Axis (交叉轴)                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  justify-content 对齐方式：                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ flex-start:  [1][2][3][4][5]                                │   │
│  │ flex-end:                  [1][2][3][4][5]                  │   │
│  │ center:           [1][2][3][4][5]                           │   │
│  │ space-between: [1]   [2]   [3]   [4]   [5]                  │   │
│  │ space-around:  [1]  [2]  [3]  [4]  [5]                      │   │
│  │ space-evenly:  [ 1 ] [ 2 ] [ 3 ] [ 4 ] [ 5 ]                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 14.2 Grid 布局图解

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Grid 布局模型                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  grid-template-columns: 1fr 2fr 1fr                                │
│  grid-template-rows: auto 1fr auto                                 │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 1  │    2    │ 1 │ ← Grid Lines (网格线)                    │   │
│  │ fr │   fr    │ fr│                                            │   │
│  ├────┼─────────┼────┤                                            │   │
│  │    │         │    │                                            │   │
│  │    │         │    │                                            │   │
│  │    │         │    │                                            │   │
│  ├────┼─────────┼────┤                                            │   │
│  │    │         │    │                                            │   │
│  │    │         │    │                                            │   │
│  └────┴─────────┴────┘                                            │   │
│                                                                     │
│  Grid Area 示例：                                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ┌───────────────────────────────────────────────────────┐   │   │
│  │ │                      header                            │   │   │
│  │ └───────────────────────────────────────────────────────┘   │   │
│  │ ┌──────────┬────────────────────────────────────────────┐   │   │
│  │ │          │                                            │   │   │
│  │ │ sidebar  │                    main                    │   │   │
│  │ │          │                                            │   │   │
│  │ └──────────┴────────────────────────────────────────────┘   │   │
│  │ ┌───────────────────────────────────────────────────────┐   │   │
│  │ │                      footer                            │   │   │
│  │ └───────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 14.3 CSS 盒模型图解

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CSS 盒模型                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                         margin                               │   │
│  │  ┌───────────────────────────────────────────────────────┐  │   │
│  │  │                       border                           │  │   │
│  │  │  ┌─────────────────────────────────────────────────┐  │  │   │
│  │  │  │                    padding                       │  │  │   │
│  │  │  │  ┌───────────────────────────────────────────┐  │  │  │   │
│  │  │  │  │                                           │  │  │  │   │
│  │  │  │  │              content                      │  │  │  │   │
│  │  │  │  │                                           │  │  │  │   │
│  │  │  │  │              width × height               │  │  │  │   │
│  │  │  │  │                                           │  │  │  │   │
│  │  │  │  └───────────────────────────────────────────┘  │  │  │   │
│  │  │  └─────────────────────────────────────────────────┘  │  │   │
│  │  └───────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  box-sizing: content-box (默认)                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  width = content width                                       │   │
│  │  实际宽度 = width + padding + border                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  box-sizing: border-box (推荐)                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  width = content + padding + border                          │   │
│  │  实际宽度 = width                                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 14.4 层叠上下文图解

```
┌─────────────────────────────────────────────────────────────────────┐
│                        层叠上下文 (Stacking Context)                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  根层叠上下文 (Root Stacking Context)                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │  z-index: 1                                                 │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │                                                     │   │   │
│  │  │  z-index: 10                                        │   │   │
│  │  │  ┌─────────────────────────────────────────────┐   │   │   │
│  │  │  │                                             │   │   │   │
│  │  │  │  子元素的 z-index 只在父层叠上下文中比较     │   │   │   │
│  │  │  │                                             │   │   │   │
│  │  │  └─────────────────────────────────────────────┘   │   │   │
│  │  │                                                     │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  │                                                             │   │
│  │  z-index: 2                                                 │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │  即使子元素 z-index: 9999，仍在 z-index: 1 之上     │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  创建层叠上下文的条件：                                             │
│  • position: relative/absolute/fixed + z-index: auto 以外的值      │
│  • position: fixed/sticky                                          │
│  • opacity < 1                                                     │
│  • transform / filter / perspective / clip-path                    │
│  • display: flex/grid 的子元素 + z-index                           │
│  • will-change                                                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 8. 面试高频问题

### 问题1：如何理解CSS特异性？

```css
/* 特异性计算：ID > 类/属性/伪类 > 元素/伪元素 */
#header nav ul li a.link { /* ID:1, 类:1, 元素:4 = (0,1,1,4) */ }
.nav ul li a { /* (0,0,1,4) */ }
a.link { /* (0,0,1,1) */ }
.nav a { /* (0,0,1,2) */ }
#page .nav a { /* (0,1,1,2) */ }

/* 内联样式 > ID选择器 > 类/属性/伪类 > 元素/伪元素 */
<div style="color:red"> /* (1,0,0,0) */ </div>
```

### 问题2：flex:1具体代表什么？

```css
/* flex: 1 是 flex: 1 1 0 的简写 */
.item {
  flex-grow: 1;   /* 可分配剩余空间的比例 */
  flex-shrink: 1; /* 空间不足时的收缩比例 */
  flex-basis: 0;   /* 初始主轴尺寸 */
}

/* flex: auto 是 flex: 1 1 auto 的简写 */
/* flex: none 是 flex: 0 0 auto 的简写 */

/* 实战：实现三栏自适应 */
.container {
  display: flex;
}
.sidebar-left { flex: 0 0 200px; }  /* 固定200px */
.main { flex: 1; }                   /* 占据剩余全部空间 */
.sidebar-right { flex: 0 0 150px; } /* 固定150px */
```

### 问题3：Grid的subgrid有什么用？

```css
/* Subgrid允许嵌套Grid继承父Grid的轨道 */
.parent {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.child {
  display: grid;
  grid-column: 1 / -1; /* 跨越所有列 */
  grid-template-columns: subgrid; /* 继承父级的3列轨道 */
}

/* 实战：表格对齐 */
.table-grid {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 1px;
}

.table-row {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid; /* 所有行单元格自动对齐 */
}
```

### 问题4：CSS动画性能优化技巧？

```css
/* ✅ 好：只动画合成器线程可处理的属性 */
.animated {
  transform: translateX(100px); /* GPU加速 */
  opacity: 0.5; /* GPU加速 */
  will-change: transform; /* 提前告知浏览器优化 */
}

/* ❌ 差：触发布局重排 */
.bad {
  left: 100px; /* 触发Layout */
  width: 200px; /* 触发Layout */
  background-color: red; /* 触发Paint */
}

/* ✅ 好：使用translate实现动画 */
@keyframes slideIn {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

/* ✅ 好：使用opacity配合position实现淡入 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### 问题5：CSS Grid vs Flexbox 如何选择？

```css
/* 选择Grid的场景：需要同时控制行和列 */
.page-layout {
  display: grid;
  grid-template-columns: 250px 1fr 250px;
  grid-template-rows: 60px 1fr 40px;
  /* 更精确的控制，更清晰的代码 */
}

/* 选择Flexbox的场景：沿一个方向排列 */
.card-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  /* 项目在一行排列，超出换行，更灵活 */
}

/* 两者结合：Grid布局页面，Flexbox布局组件 */
.page { display: grid; }
.card { display: flex; flex-direction: column; }
```

---

## 9. 企业级CSS架构实战

### 9.1 CSS变量主题系统

```css
/* 完整的主题系统：变量 + 选择器覆盖 */
:root {
  --primary: #007bff;
  --danger: #dc3545;
  --success: #28a745;

  --text-primary: #333;
  --text-secondary: #666;
  --bg-primary: #fff;
  --bg-secondary: #f8f9fa;

  --radius: 8px;
  --shadow: 0 2px 8px rgba(0,0,0,0.1);
  --transition: 0.2s ease;
}

[data-theme="dark"] {
  --primary: #0d6efd;
  --text-primary: #eee;
  --text-secondary: #aaa;
  --bg-primary: #1a1a2e;
  --bg-secondary: #16213e;
  --shadow: 0 2px 8px rgba(0,0,0,0.4);
}

[data-theme="high-contrast"] {
  --primary: #0000ff;
  --text-primary: #000;
  --bg-primary: #fff;
}

/* 所有组件使用变量 */
.card {
  background: var(--bg-primary);
  color: var(--text-primary);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  transition: var(--transition);
}
```

### 9.2 响应式设计模式

```css
/* 移动优先断点策略 */
.container {
  /* 基础样式（移动端） */
  padding: 15px;
  font-size: 14px;
}

@media (min-width: 640px) {
  .container { padding: 24px; font-size: 15px; }
}

@media (min-width: 1024px) {
  .container {
    max-width: 1200px;
    padding: 32px;
    font-size: 16px;
    margin: 0 auto;
  }
}

/* 容器查询（未来趋势） */
@container card (min-width: 400px) {
  .card { flex-direction: row; }
}

/* 响应式字体 */
.responsive-text {
  font-size: clamp(1rem, 2.5vw, 2rem);
}
```

---

## 总结

本文档详细介绍了 CSS 选择器优先级、Flexbox、Grid、动画过渡、响应式设计、CSS 变量和 CSS 架构。通过学习本文档，你应该能够：

1. **理解选择器优先级**：正确计算和应用 CSS 选择器
2. **掌握 Flexbox 布局**：实现各种一维布局需求
3. **掌握 Grid 布局**：实现复杂的二维布局
4. **实现动画效果**：使用 transition 和 animation
5. **构建响应式页面**：使用媒体查询和相对单位
6. **使用 CSS 变量**：实现主题系统和组件化样式
7. **组织 CSS 架构**：使用 BEM 等命名规范

继续学习建议：
- 深入学习 CSS 动画和性能优化
- 掌握 Tailwind CSS 等现代 CSS 框架
- 了解 CSS-in-JS 解决方案
- 学习 CSS 容器查询等新特性
