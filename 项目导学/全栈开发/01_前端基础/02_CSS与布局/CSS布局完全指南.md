# CSS布局完全指南

## 目录

1. [Flexbox弹性布局](#1-flexbox弹性布局)
2. [CSS Grid网格布局](#2-css-grid网格布局)
3. [响应式布局](#3-响应式布局)
4. [布局技巧](#4-布局技巧)

---

## 1. Flexbox弹性布局

### 1.1 什么是Flexbox

Flexbox（弹性盒子）是CSS3引入的一种一维布局模型，专门为解决页面布局问题而设计。它可以让容器内的子元素自动分配空间，轻松实现水平/垂直居中、等高列、自适应布局等常见需求。

```
Flexbox布局模型：
┌─────────────────────────────────────┐
│           Flex Container            │
│  ┌─────────┬─────────┬─────────┐  │
│  │  Item   │  Item   │  Item   │  │
│  │    1    │    2    │    3    │  │
│  └─────────┴─────────┴─────────┘  │
│              ↑ 主轴 (Main Axis)    │
│         ← 交叉轴 (Cross Axis) →   │
└─────────────────────────────────────┘
```

### 1.2 核心概念

| 概念 | 说明 |
|------|------|
| **Flex Container** | 弹性容器，开启flex布局的元素 |
| **Flex Item** | 弹性项目，容器内的直接子元素 |
| **Main Axis** | 主轴，项目排列的主要方向（默认水平） |
| **Cross Axis** | 交叉轴，与主轴垂直的轴 |
| **Main Start/End** | 主轴起始/结束位置 |
| **Cross Start/End** | 交叉轴起始/结束位置 |

### 1.3 容器属性

```css
/* 1. display: 开启Flex布局 */
.flex-container {
    display: flex;        /* 块级弹性容器 */
    display: inline-flex; /* 行内弹性容器 */
}

/* 2. flex-direction: 主轴方向 */
.flex-container {
    flex-direction: row;             /* 默认：水平从左到右 */
    flex-direction: row-reverse;     /* 水平从右到左 */
    flex-direction: column;          /* 垂直从上到下 */
    flex-direction: column-reverse;  /* 垂直从下到上 */
}

/* 3. flex-wrap: 换行控制 */
.flex-container {
    flex-wrap: nowrap;    /* 默认：不换行，压缩项目 */
    flex-wrap: wrap;      /* 换行，第一行在上方 */
    flex-wrap: wrap-reverse; /* 换行，第一行在下方 */
}

/* 4. justify-content: 主轴对齐方式 */
.flex-container {
    justify-content: flex-start;     /* 默认：起始对齐 */
    justify-content: flex-end;       /* 结束对齐 */
    justify-content: center;         /* 居中对齐 */
    justify-content: space-between;  /* 两端对齐 */
    justify-content: space-around;  /* 环绕对齐 */
    justify-content: space-evenly;  /* 等间距对齐 */
}

/* 5. align-items: 交叉轴对齐方式（单行） */
.flex-container {
    align-items: stretch;        /* 默认：拉伸填充 */
    align-items: flex-start;     /* 起始对齐 */
    align-items: flex-end;       /* 结束对齐 */
    align-items: center;         /* 居中对齐 */
    align-items: baseline;       /* 基线对齐 */
}

/* 6. align-content: 交叉轴对齐方式（多行） */
.flex-container {
    align-content: stretch;        /* 默认：拉伸 */
    align-content: flex-start;     /* 起始对齐 */
    align-content: flex-end;       /* 结束对齐 */
    align-content: center;         /* 居中对齐 */
    align-content: space-between;  /* 两端对齐 */
    align-content: space-around;  /* 环绕对齐 */
}

/* 7. gap: 间距 */
.flex-container {
    gap: 20px;        /* 行列间距相同 */
    row-gap: 10px;    /* 行间距 */
    column-gap: 20px; /* 列间距 */
}

/* 简写形式 */
.flex-container {
    flex-flow: row wrap; /* flex-direction + flex-wrap */
}
```

### 1.4 项目属性

```css
/* 1. order: 排列顺序（数值越小越靠前） */
.flex-item {
    order: 1; /* 默认值为0，可以是负数 */
}

/* 2. flex-grow: 放大比例 */
.flex-item {
    flex-grow: 1; /* 默认0，剩余空间按比例分配 */
}

/* 3. flex-shrink: 缩小比例 */
.flex-item {
    flex-shrink: 1; /* 默认1，空间不足时缩小 */
}

/* 4. flex-basis: 基础尺寸 */
.flex-item {
    flex-basis: 200px; /* 在主轴方向的初始尺寸 */
}

/* 5. flex: 简写形式 */
.flex-item {
    flex: 1 1 auto;      /* flex-grow flex-shrink flex-basis */
    flex: 1;             /* flex: 1 1 0% */
    flex: 200px;         /* flex: 1 1 200px */
}

/* 6. align-self: 单独对齐方式 */
.flex-item {
    align-self: auto;      /* 继承容器align-items */
    align-self: stretch;   /* 拉伸 */
    align-self: flex-start;
    align-self: flex-end;
    align-self: center;
    align-self: baseline;
}
```

### 1.5 实战案例

```html
<!-- 水平垂直居中 -->
<div class="center-box">
    <div class="content">内容</div>
</div>

<style>
.center-box {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
}
</style>

<!-- 三栏等高布局 -->
<div class="three-column">
    <div class="column">左栏</div>
    <div class="column">中栏<br>多行内容</div>
    <div class="column">右栏</div>
</div>

<style>
.three-column {
    display: flex;
    height: 200px;
}
.column {
    flex: 1;
    /* 自动等高 */
}
</style>

<!-- 导航菜单 -->
<nav class="navbar">
    <div class="logo">Logo</div>
    <ul class="menu">
        <li>首页</li>
        <li>关于</li>
        <li>服务</li>
        <li>联系</li>
    </ul>
    <div class="user-actions">
        <button>登录</button>
    </div>
</nav>

<style>
.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    height: 60px;
    background: #333;
    color: white;
}
.menu {
    display: flex;
    gap: 20px;
    list-style: none;
    margin: 0;
    padding: 0;
}
</style>

<!-- 圣杯布局 -->
<div class="holy-grail">
    <header>头部</header>
    <main class="content">
        <aside class="sidebar-left">左侧边栏</aside>
        <article class="main-content">主内容</article>
        <aside class="sidebar-right">右侧边栏</aside>
    </main>
    <footer>底部</footer>
</div>

<style>
.holy-grail {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
}
.content {
    display: flex;
    flex: 1;
}
.sidebar-left, .sidebar-right {
    width: 200px;
}
.main-content {
    flex: 1;
}
</style>
```

---

## 2. CSS Grid网格布局

### 2.1 什么是CSS Grid

CSS Grid是一个二维布局系统，可以同时控制行和列，适合创建复杂的页面布局。与Flexbox的一维布局不同，Grid可以同时处理水平和垂直方向。

```
CSS Grid布局模型：
┌─────────────┬─────────────┬─────────────┐
│    单元格    │    单元格    │    单元格    │
│  (1,1)      │  (1,2)      │  (1,3)      │
├─────────────┼─────────────┼─────────────┤
│    单元格    │    单元格    │    单元格    │
│  (2,1)      │  (2,2)      │  (2,3)      │
├─────────────┼─────────────┼─────────────┤
│    单元格    │    单元格    │    单元格    │
│  (3,1)      │  (3,2)      │  (3,3)      │
└─────────────┴─────────────┴─────────────┘
     行1          行2          行3
   列网格线     列网格线     列网格线
```

### 2.2 核心概念

| 概念 | 说明 |
|------|------|
| **Grid Container** | 网格容器，开启grid布局的元素 |
| **Grid Item** | 网格项目，容器内的直接子元素 |
| **Grid Line** | 网格线，划分行列的线 |
| **Grid Track** | 网格轨道，相邻网格线之间的区域 |
| **Grid Cell** | 网格单元格，由行列网格线围成的区域 |
| **Grid Area** | 网格区域，由多个单元格组成的区域 |

### 2.3 容器属性

```css
/* 1. display: 开启Grid布局 */
.grid-container {
    display: grid;        /* 块级网格容器 */
    display: inline-grid; /* 行内网格容器 */
}

/* 2. grid-template-columns: 定义列 */
.grid-container {
    /* 具体值 */
    grid-template-columns: 100px 200px 100px;
    /* 百分比 */
    grid-template-columns: 33.33% 33.33% 33.33%;
    /* fr单位（比例） */
    grid-template-columns: 1fr 2fr 1fr;
    /* 混合使用 */
    grid-template-columns: 200px 1fr 200px;
    /* repeat函数 */
    grid-template-columns: repeat(3, 1fr);
    /* auto-fill 自动填充 */
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

/* 3. grid-template-rows: 定义行 */
.grid-container {
    grid-template-rows: 100px 200px 100px;
    grid-template-rows: 1fr 2fr 1fr;
    grid-template-rows: repeat(3, 100px);
}

/* 4. gap: 间距 */
.grid-container {
    gap: 20px;           /* 行列间距相同 */
    row-gap: 10px;       /* 行间距 */
    column-gap: 20px;    /* 列间距 */
}

/* 5. grid-template-areas: 命名区域 */
.grid-container {
    grid-template-areas:
        "header header header"
        "sidebar main main"
        "footer footer footer";
}

/* 6. justify-items: 水平对齐（单元格内） */
.grid-container {
    justify-items: stretch;     /* 默认：拉伸 */
    justify-items: start;
    justify-items: end;
    justify-items: center;
}

/* 7. align-items: 垂直对齐（单元格内） */
.grid-container {
    align-items: stretch;
    align-items: start;
    align-items: end;
    align-items: center;
}

/* 8. justify-content: 水平对齐（整个网格） */
.grid-container {
    justify-content: stretch;
    justify-content: start;
    justify-content: end;
    justify-content: center;
    justify-content: space-between;
    justify-content: space-around;
    justify-content: space-evenly;
}

/* 9. align-content: 垂直对齐（整个网格） */
.grid-container {
    align-content: stretch;
    align-content: start;
    align-content: end;
    align-content: center;
    align-content: space-between;
    align-content: space-around;
    align-content: space-evenly;
}

/* 10. grid-auto-flow: 自动流动 */
.grid-container {
    grid-auto-flow: row;           /* 默认：按行填充 */
    grid-auto-flow: column;        /* 按列填充 */
    grid-auto-flow: dense;         /* 紧密填充 */
    grid-auto-flow: row dense;     /* 行填充+紧密 */
}
```

### 2.4 项目属性

```css
/* 1. grid-column-start/end: 列位置 */
.grid-item {
    grid-column-start: 1;
    grid-column-end: 3;   /* 跨越到第3条线 */
    /* 简写 */
    grid-column: 1 / 3;
    grid-column: 1 / span 2; /* 跨越2列 */
}

/* 2. grid-row-start/end: 行位置 */
.grid-item {
    grid-row-start: 1;
    grid-row-end: 3;
    /* 简写 */
    grid-row: 1 / 3;
    grid-row: 1 / span 2;
}

/* 3. grid-area: 区域名称 */
.grid-item {
    grid-area: header; /* 使用命名区域 */
    /* 简写 */
    grid-area: 1 / 1 / 3 / 3; /* row-start / col-start / row-end / col-end */
}

/* 4. justify-self: 单独水平对齐 */
.grid-item {
    justify-self: stretch;
    justify-self: start;
    justify-self: end;
    justify-self: center;
}

/* 5. align-self: 单独垂直对齐 */
.grid-item {
    align-self: stretch;
    align-self: start;
    align-self: end;
    align-self: center;
}
```

### 2.5 实战案例

```html
<!-- 响应式卡片网格 -->
<div class="card-grid">
    <div class="card">卡片1</div>
    <div class="card">卡片2</div>
    <div class="card">卡片3</div>
    <div class="card">卡片4</div>
    <div class="card">卡片5</div>
    <div class="card">卡片6</div>
</div>

<style>
.card-grid {
    display: grid;
    /* 自动响应式列数 */
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
}
.card {
    padding: 20px;
    background: #f5f5f5;
    border-radius: 8px;
}
</style>

<!-- 经典布局 -->
<div class="layout">
    <header class="header">Header</header>
    <aside class="sidebar">Sidebar</aside>
    <main class="content">Content</main>
    <footer class="footer">Footer</footer>
</div>

<style>
.layout {
    display: grid;
    grid-template-areas:
        "header header"
        "sidebar content"
        "footer footer";
    grid-template-columns: 200px 1fr;
    grid-template-rows: auto 1fr auto;
    min-height: 100vh;
}
.header { grid-area: header; }
.sidebar { grid-area: sidebar; }
.content { grid-area: content; }
.footer { grid-area: footer; }
</style>

<!-- 相册布局 -->
<div class="gallery">
    <div class="photo">1</div>
    <div class="photo">2</div>
    <div class="photo wide">3</div>
    <div class="photo">4</div>
    <div class="photo tall">5</div>
    <div class="photo">6</div>
</div>

<style>
.gallery {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-auto-rows: 200px;
    gap: 10px;
}
.photo {
    background: #ddd;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
}
.photo.wide {
    grid-column: span 2;
}
.photo.tall {
    grid-row: span 2;
}
</style>
```

### 2.6 高级技巧

```css
/* minmax函数：自动适应范围 */
.container {
    grid-template-columns: minmax(100px, 1fr) 1fr;
    /* 第一列最小100px，最大1fr（可用空间） */
}

/* auto-fit vs auto-fill */
.container {
    /* auto-fit：项目自适应，空白合并 */
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    /* auto-fill：项目填满，空白保留 */
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

/* subgrid（继承父网格） */
.parent {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
}
.child {
    display: grid;
    grid-column: span 2;
    grid-template-columns: subgrid; /* 继承父网格轨道 */
}
```

---

## 3. 响应式布局

### 3.1 媒体查询

```css
/* 基本语法 */
@media (条件) {
    /* CSS规则 */
}

/* 断点示例 */
@media (max-width: 768px) {
    /* 平板及以下 */
}

@media (min-width: 769px) and (max-width: 1024px) {
    /* 平板到桌面 */
}

@media (min-width: 1025px) {
    /* 桌面及以上 */
}

/* 常见断点 */
@media (max-width: 480px)  { /* 手机 portrait */ }
@media (max-width: 767px)  { /* 手机 landscape / 平板 portrait */ }
@media (max-width: 1023px) { /* 平板 landscape / 小桌面 */ }
@media (max-width: 1279px) { /* 桌面 */ }
@media (min-width: 1280px) { /* 大桌面 */ }

/* 方向判断 */
@media (orientation: portrait) { /* 竖屏 */ }
@media (orientation: landscape) { /* 横屏 */ }

/* 设备像素比 */
@media (-webkit-min-device-pixel-ratio: 2),
       (min-resolution: 192dpi) {
    /* Retina屏幕 */
}
```

### 3.2 响应式布局模式

```css
/* 1. 移动优先：先写移动端样式，再为大屏幕添加媒体查询 */
.container {
    width: 100%;
    padding: 10px;
}

@media (min-width: 768px) {
    .container {
        width: 750px;
        margin: 0 auto;
    }
}

@media (min-width: 1024px) {
    .container {
        width: 970px;
    }
}

/* 2. 桌面优先：先写桌面样式，再为小屏幕覆盖 */
.container {
    width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 200px 1fr;
}

@media (max-width: 1023px) {
    .container {
        width: 100%;
        grid-template-columns: 150px 1fr;
    }
}

@media (max-width: 767px) {
    .container {
        grid-template-columns: 1fr;
    }
}

/* 3. 容器查询（CSS新特性） */
.card-container {
    container-type: inline-size;
}

@container (min-width: 400px) {
    .card {
        display: flex;
    }
}
```

---

## 4. 布局技巧

### 4.1 常见布局解决方案

```css
/* 水平居中 */
.center-horizontal {
    margin: 0 auto;
    width: 80%;
}

/* Flexbox水平垂直居中 */
.center-both {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
}

/* Grid水平垂直居中 */
.center-grid {
    display: grid;
    place-items: center;
    min-height: 100vh;
}

/* 两端对齐，最后一行左对齐 */
.justify-last-left {
    text-align: justify;
}
.justify-last-left::after {
    content: '';
    display: inline-block;
    width: 100%;
}

/* 等高列（Flexbox） */
.equal-height {
    display: flex;
}
.equal-height > .column {
    flex: 1;
}

/* 等高列（Grid） */
.equal-height-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
}

/* 保持宽高比 */
.aspect-ratio {
    aspect-ratio: 16 / 9;
    width: 100%;
    background: #ccc;
}

/* 粘性定位（Sticky） */
.sticky-header {
    position: sticky;
    top: 0;
    z-index: 100;
}
```

### 4.2 常见问题解决

```css
/* 1. Flexbox子元素不换行 */
.flex-container {
    flex-wrap: wrap;
}

/* 2. Flexbox子元素超出容器 */
.flex-container {
    min-width: 0; /* 解决flex子元素溢出 */
    overflow: hidden;
}

/* 3. Grid自动高度 */
.grid-container {
    grid-auto-rows: minmax(100px, auto);
}

/* 4. 防止内容溢出 */
.overflow-handle {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* 5. 多行文字省略 */
.multi-line-ellipsis {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
```

---

## 布局方案对比

| 特性 | Flexbox | CSS Grid |
|------|---------|-----------|
| 维度 | 一维 | 二维 |
| 适用场景 | 导航、列表、卡片 | 页面整体布局、相册 |
| 学习难度 | 较简单 | 较复杂 |
| 浏览器支持 | 良好 | 良好 |
| 组合使用 | 可以 | 可以 |

---

## 参考资源

- [CSS Flexbox完全指南](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
- [CSS Grid完全指南](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [MDN Flexbox](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_Flexible_Box_Layout)
- [MDN Grid](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_Grid_Layout)

---

*本文档持续更新，最后更新于2026年3月*
