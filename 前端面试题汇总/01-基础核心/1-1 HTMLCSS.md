# HTML/CSS 深度进阶面试题库

---

## 一、HTML 核心原理

### 1.1 HTML5 新增特性详解

**参考答案：**

HTML5 引入了一系列重磅特性，极大推动了 Web 应用的发展：

1. **语义化标签**：`<article>`、`<section>`、`<nav>`、`<header>`、`<footer>`、`<aside>` 等，提升文档结构可读性和 SEO 效果。

2. **表单增强**：
   - 新增 input 类型：`email`、`url`、`tel`、`number`、`range`、`date`、`time`、`datetime-local`、`color` 等
   - 新增属性：`placeholder`、`required`、`pattern`、`autofocus`、`autocomplete`、`novalidate`
   - 新增表单元素：`<datalist>`、`<output>`、`<keygen>`（已废弃）、`<meter>`

3. **多媒体标签**：
   - `<video>`：支持 MP4、WebM、Ogg 格式，具备 controls、autoplay、loop、muted、poster 等属性
   - `<audio>`：支持 MP3、Wav、Ogg 格式
   - 视频编解码：H.264（Safari/IE）、VP8/VP9（Chrome/Firefox）、Ogg Theora

4. **Canvas 与 SVG**：
   - `<canvas>`：基于位图的 2D 绘图 API，支持动画、游戏渲染、数据可视化
   - `<svg>`：矢量图形语言，支持 DOM 操作、事件绑定、动画

5. **本地存储**：
   - `localStorage`：持久化存储，容量约 5-10MB，同源策略
   - `sessionStorage`：会话级存储，页面关闭后清除
   - `IndexedDB`：浏览器内置的 NoSQL 数据库，支持大容量结构化数据存储

6. **Web Worker**：后台线程，不阻塞主线程，用于复杂计算
7. **WebSocket**：全双工通信协议
8. **Geolocation API**：地理定位
9. **Drag and Drop API**：拖拽接口
10. **History API**：history.pushState、history.replaceState、popstate 事件

---

### 1.2 DOCTYPE 的作用与类型

**参考答案：**

`<!DOCTYPE>` 声明位于 HTML 文档第一行，告知浏览器使用哪种 HTML 或 XHTML 规范。该标签可声明三种 DTD（文档类型定义）类型：

| DOCTYPE | 规范 | 说明 |
| :--- | :--- | :--- |
| `HTML5` | HTML5 | `<!DOCTYPE html>` 简洁声明，现代标准 |
| `HTML4.01 Strict` | HTML4.01 严格版 | 不包含废弃元素和框架集 |
| `HTML4.01 Transitional` | HTML4.01 过渡版 | 包含废弃元素，但不包含框架集 |
| `HTML4.01 Frameset` | HTML4.01 框架版 | 允许使用框架集 |

**关键作用**：
- 触发标准模式（Standards Mode）渲染，避免混杂模式（Quirks Mode）
- 混杂模式模拟非标准行为以兼容旧网站
- HTML5 使用简洁声明，不再需要 DTD 引用

---

### 1.3 浏览器渲染过程详解

**参考答案：**

```
┌─────────────────────────────────────────────────────────────────┐
│                        浏览器渲染流程                            │
├─────────────────────────────────────────────────────────────────┤
│  1. HTML 解析 ──→ 2. DOM 树构建 ──→ 3. CSS 解析 ──→ 4. 渲染树   │
│         │                │                │              │       │
│         ▼                ▼                ▼              ▼       │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐   ┌─────────┐   │
│  │  网络进程 │───▶│  HTML    │───▶│  CSS     │──▶│ Render  │   │
│  │  下载资源 │    │  Parser  │    │  Parser  │   │ Tree    │   │
│  └──────────┘    └──────────┘    └──────────┘   └────┬────┘   │
│                                                      │         │
│                                                      ▼         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐   ┌─────────┐   │
│  │  布局    │◀───│  绘制    │◀───│ 分层     │◀──│ 合成    │   │
│  │ Layout   │    │  Paint   │    │  Layer   │   │ Composite│   │
│  └──────────┘    └──────────┘    └──────────┘   └─────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**详细步骤**：

1. **HTML 解析**：浏览器通过网络获取 HTML 文档，解析为 DOM 节点，构建 DOM 树。

2. **CSS 解析**：同时解析 CSS，包括内联样式、外链样式、内嵌样式，生成 CSSOM（CSS Object Model）树。

3. **渲染树（Render Tree）**：DOM 树 + CSSOM 树 = 渲染树，只包含可见节点。

4. **布局（Layout）**：计算每个节点的几何位置和尺寸，得到布局树。

5. **分层（Layer）**：
   - 拥有**层叠上下文**的元素（position: absolute/fixed、opacity < 1、transform、filter 等）独立分层
   - 特殊元素（`<video>`、`<canvas>`、`<iframe>`）也会分层
   - 分层有助于优化渲染性能

6. **绘制（Paint）**：将每个图层拆分为绘制指令，绘制到位图。

7. **合成（Composite）**：将各图层提交给 GPU 合成，最终显示在屏幕上。

**性能优化关键点**：
- 避免强制同步布局（forced reflow）
- 减少重绘（repaint）和重排（reflow）
- 使用 `transform` 和 `opacity` 实现动画（触发合成而非重排）

---

### 1.4 src 与 href 的区别

**参考答案：**

| 属性 | 作用 | 适用标签 | 加载行为 |
| :--- | :--- | :--- | :--- |
| `src` | **引入资源**，资源是页面必需的一部分 | `<script>`、`<img>`、`<iframe>`、`<video>`、`<audio>` | 阻塞 HTML 解析，资源加载完成才继续 |
| `href` | **建立关联**，表示语义上的链接关系 | `<a>`、`<link>` | 并行下载，不阻塞 HTML 解析 |

**本质区别**：
- `src` 会替代当前元素内容，浏览器需要立即加载该资源
- `href` 只是建立链接关系，浏览器可以并行处理

---

### 1.5 meta 标签全面解析

**参考答案：**

`<meta>` 标签位于 `<head>` 区域，提供页面元数据。

**常见用法**：

```html
<!-- 字符编码 -->
<meta charset="UTF-8">

<!-- 搜索引擎 SEO -->
<meta name="description" content="页面描述，控制在 150 字符内">
<meta name="keywords" content="关键词1,关键词2">
<meta name="author" content="作者名称">
<meta name="robots" content="index,follow">

<!-- 视口配置（移动端适配） -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">

<!-- 缓存控制 -->
<meta http-equiv="Cache-Control" content="no-cache">
<meta http-equiv="Expires" content="0">

<!-- 兼容性设置 -->
<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">

<!-- 刷新与重定向 -->
<meta http-equiv="Refresh" content="5;url=https://example.com">

<!-- CSP 内容安全策略 -->
<meta http-equiv="Content-Security-Policy" content="default-src 'self'">

<!-- 主题颜色（移动端 PWA） -->
<meta name="theme-color" content="#ffffff">
```

---

### 1.6 HTML 语义化的重要性

**参考答案：**

1. **SEO 优化**：搜索引擎爬虫更好地理解页面结构，提升关键词排名
2. **可访问性（a11y）**：屏幕阅读器正确解析，便于视障用户浏览
3. **代码可读性**：便于开发者维护和团队协作
4. **结构清晰**：DOM 树更加规范，便于样式绑定

**最佳实践**：
- 使用 `<header>`、`<nav>`、`<main>`、`<article>`、`<section>`、`<aside>`、`<footer>` 代替大量 `<div>`
- 列表使用 `<ul>`、`<ol>`、`<li>`
- 表格使用 `<table>`、`<thead>`、`<tbody>`、`<th>`、`<td>`
- 表单使用 `<form>`、`<label>`、`<input>`、`<button>`

---

## 二、CSS 核心原理

### 2.1 CSS 选择器优先级与计算规则

**参考答案：**

```
┌─────────────────────────────────────────────────────────────────┐
│                    CSS 选择器优先级权重                          │
├─────────────────────────────────────────────────────────────────┤
│  !important    ────▶  无穷大（最高优先级）                       │
│  内联样式      ────▶  1000                                      │
│  ID 选择器     ────▶  100                                       │
│  类/属性/伪类  ────▶  10                                         │
│  元素/伪元素   ────▶  1                                          │
│  通配符/组合   ────▶  0                                          │
└─────────────────────────────────────────────────────────────────┘
```

**计算示例**：

```css
/* 优先级: 0-1-0-1 = 101 */
#nav .list-item { }

/* 优先级: 0-0-2-0 = 20 */
:hover .active { }

/* 优先级: 0-0-1-2 = 12 */
div ul li { }

/* 优先级: 0-1-0-1 = 101 */
#app .card:hover { }
```

**重要规则**：
- `!important` 优先级最高，慎用
- 相同优先级时，后定义的样式覆盖先定义的
- 组合选择器（逗号分隔）分别计算权重
- `:not()` 内部选择器参与权重计算
- `*` 通配符不增加权重

---

### 2.2 CSS 盒模型深度理解

**参考答案：**

```
┌─────────────────────────────────────────────────────────────────┐
│                        CSS 盒模型                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    ┌───────────────────────────────────────────────┐           │
│    │                 margin (外边距)                 │           │
│    │  ┌─────────────────────────────────────────┐  │           │
│    │  │            border (边框)                  │  │           │
│    │  │  ┌───────────────────────────────────┐  │  │           │
│    │  │  │         padding (内边距)           │  │  │           │
│    │  │  │  ┌───────────────────────────┐  │  │  │           │
│    │  │  │  │                           │  │  │  │           │
│    │  │  │  │     content (内容区)       │  │  │  │           │
│    │  │  │  │                           │  │  │  │           │
│    │  │  │  └───────────────────────────┘  │  │  │           │
│    │  │  └───────────────────────────────────┘  │  │           │
│    │  └─────────────────────────────────────────┘  │           │
│    └───────────────────────────────────────────────┘           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**两种盒模型**：

| 盒模型 | 设置方式 | width 包含内容 |
| :--- | :--- | :--- |
| **content-box**（默认） | `box-sizing: content-box` | 仅内容区域 |
| **border-box** | `box-sizing: border-box` | content + padding + border |

**实际宽度计算**：
- `content-box`：`width` = 内容宽度，总宽度 = width + padding + border + margin
- `border-box`：`width` = 内容 + padding + border，总宽度 = width + margin

**建议**：全局使用 `box-sizing: border-box`，避免 padding/border 导致的布局问题。

---

### 2.3 BFC（块级格式化上下文）深度理解

**参考答案：**

**BFC 定义**：
BFC 是 CSS 渲染模型的一部分，是页面中一个独立的渲染区域，容器内的元素不会影响外部元素。

**触发 BFC 的方式**：
```css
/* 1. 根元素 */
html { }

/* 2. float 不为 none */
float: left | right;

/* 3. position 不为 static/relative */
position: absolute | fixed;

/* 4. display 为 inline-block、table-cell、flex、grid 等 */
display: inline-block | flex | grid | table-cell;

/* 5. overflow 不为 visible */
overflow: auto | hidden | scroll;

/* 6. fieldset 元素 */
```

**BFC 特性**：
1. 内部的 Box 垂直方向依次排列
2. Box 垂直方向的距离由 margin 决定，**同一 BFC 中相邻 Box 的 margin 会重叠**
3. BFC 区域不会与 float 元素重叠
4. 计算 BFC 高度时，浮动元素也参与计算

**应用场景**：

```css
/* 1. 清除浮动 */
.parent {
  overflow: hidden; /* 触发 BFC */
}

/* 2. 防止 margin 重叠 */
.box1, .box2 {
  margin-bottom: 20px;
}
.container {
  overflow: hidden; /* 创建独立 BFC，阻止 margin 重叠 */
}

/* 3. 自适应两栏布局 */
.left {
  float: left;
  width: 200px;
}
.right {
  overflow: hidden; /* 触发 BFC，不与 left 重叠 */
}
```

---

### 2.4 Flexbox 布局完全指南

**参考答案：**

```
┌─────────────────────────────────────────────────────────────────┐
│                      Flexbox 轴向系统                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                    主轴 (Main Axis)                             │
│                    ◀─────────────────▶                         │
│                                                                  │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐             │
│   │  Item   │ │  Item   │ │  Item   │ │  Item   │             │
│   └─────────┘ └─────────┘ └─────────┘ └─────────┘             │
│                                                                  │
│                    │                                            │
│                    │ 交叉轴 (Cross Axis)                        │
│                    │                                            │
│                    ▼                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**容器属性**：

| 属性 | 值 | 说明 |
| :--- | :--- | :--- |
| `display` | `flex` / `inline-flex` | 开启 Flex 布局 |
| `flex-direction` | `row` / `column` / `row-reverse` / `column-reverse` | 主轴方向 |
| `flex-wrap` | `nowrap` / `wrap` / `wrap-reverse` | 是否换行 |
| `justify-content` | `flex-start` / `flex-end` / `center` / `space-between` / `space-around` | 主轴对齐 |
| `align-items` | `stretch` / `flex-start` / `flex-end` / `center` / `baseline` | 交叉轴对齐（单行） |
| `align-content` | `stretch` / `flex-start` / `flex-end` / `center` / `space-between` / `space-around` | 交叉轴对齐（多行） |
| `gap` | `10px` / `1rem` | 项目间距 |

**项目属性**：

| 属性 | 说明 |
| :--- | :--- |
| `flex-grow` | 放大比例，默认 0 |
| `flex-shrink` | 缩小比例，默认 1 |
| `flex-basis` | 基础宽度，auto |
| `flex` | 简写：`flex-grow flex-shrink flex-basis` |
| `align-self` | 覆盖容器的 align-items |
| `order` | 排列顺序，数值越小越靠前 |

**flex 速记**：
- `flex: 1` = `flex: 1 1 0%`（等分剩余空间）
- `flex: auto` = `flex: 1 1 auto`
- `flex: none` = `flex: 0 0 auto`
- `flex: 0 auto` = `flex: 0 1 auto`

---

### 2.5 Grid 布局完全指南

**参考答案：**

```
┌─────────────────────────────────────────────────────────────────┐
│                      Grid 网格系统                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│         ┌─────────┬─────────┬─────────┐                         │
│         │  Area 1 │  Area 2 │  Area 3 │  ← row 1                │
│         │ (1,1)   │ (1,2)   │ (1,3)   │                         │
│         ├─────────┼─────────┼─────────┤                         │
│         │  Area 4 │  Area 5 │  Area 6 │  ← row 2                │
│         │ (2,1)   │ (2,2)   │ (2,3)   │                         │
│         └─────────┴─────────┴─────────┘                         │
│            ↑          ↑          ↑                             │
│          col 1      col 2      col 3                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**容器属性**：

```css
.container {
  /* 定义行列 */
  grid-template-columns: 100px 1fr 2fr;  /* 3 列：固定 + 自适应 + 2倍 */
  grid-template-rows: 50px auto 100px;  /* 3 行 */

  /* 命名区域 */
  grid-template-areas:
    "header header header"
    "sidebar main aside"
    "footer footer footer";

  /* 简写 */
  gap: 20px;        /* grid-gap */
  row-gap: 10px;
  column-gap: 20px;

  /* 对齐 */
  justify-items: start | end | center | stretch;
  align-items: start | end | center | stretch;
  place-items: center center;  /* 简写 */

  /* 整网格对齐 */
  justify-content: start | end | center | stretch | space-between | space-around | space-evenly;
  align-content: start | end | center | stretch | space-between | space-around | space-evenly;
}
```

**项目属性**：

```css
.item {
  /* 定位 */
  grid-column: 1 / 3;    /* 跨 2 列 */
  grid-row: 1 / 2;       /* 跨 1 行 */
  grid-area: header;     /* 命名区域 */

  /* 简写 */
  grid-column: span 2;   /* 跨 2 列 */

  /* 对齐（覆盖容器） */
  justify-self: start | end | center | stretch;
  align-self: start | end | center | stretch;
}
```

**fr 单位**：
- `1fr` = 1 份可用空间
- `repeat(3, 1fr)` = 3 等分
- `repeat(auto-fill, 100px)` = 自动填充列
- `minmax(100px, 1fr)` = 最小 100px，最大等分

---

### 2.6 层叠上下文（Stacking Context）深度理解

**参考答案：**

```
┌─────────────────────────────────────────────────────────────────┐
│                    层叠顺序（从低到高）                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. background / border        背景/边框（最低）                │
│     (负 z-index)               负 z-index                       │
│                                                                  │
│  2. block boxes                块级盒子                          │
│     float                      浮动元素                          │
│     inline boxes               行内盒子                          │
│                                                                  │
│  3. z-index: 0                 z-index: 0 / auto                │
│                                                                  │
│  4. inline boxes               行内元素（含 inline-block）       │
│                                                                  │
│  5. position: fixed            固定定位                          │
│                                                                  │
│  6. z-index: auto / 1+         正 z-index（最高）               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**层叠上下文触发条件**：
1. 根元素 `<html>`
2. `position` 不为 `static` + `z-index` 不为 `auto`
3. `position: fixed`
4. `z-index` 不为 `auto` 的 flex 子项
5. `opacity` < 1
6. `transform` 不为 `none`
7. `filter` 不为 `none`
8. `isolation: isolate`
9. `will-change` 指定上述属性
10. `-webkit-overflow-scrolling: touch`

**重要特性**：
- 层叠上下文可以嵌套
- 子元素的层叠顺序相对于父元素
- 同一个层叠上下文内按层叠顺序比较
- 不同层叠上下文间无法通过 z-index 比较

---

### 2.7 清除浮动的方法

**参考答案：**

**问题**：浮动元素脱离文档流，导致父元素高度塌陷。

**解决方案**：

```css
/* 1. 父元素 overflow: hidden（触发 BFC） */
.parent {
  overflow: hidden;
}

/* 2. 父元素添加 ::after 伪元素 */
.parent::after {
  content: "";
  display: block;
  clear: both;
}

/* 3. 父元素添加额外空元素 */
<div class="parent">
  <div class="float-left"></div>
  <div class="float-right"></div>
  <div class="clear"></div>
</div>
.clear {
  clear: both;
}

/* 4. 父元素 float（不推荐） */
.parent {
  float: left;
}

/* 5. 父元素 display: flow-root（现代方案） */
.parent {
  display: flow-root;  /* 触发 BFC，无副作用 */
}
```

---

### 2.8 居中布局方案汇总

**参考答案：**

```
┌─────────────────────────────────────────────────────────────────┐
│                        各种居中方案                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────────────────────────────────────┐          │
│   │                   水平居中                        │          │
│   ├─────────────────────────────────────────────────┤          │
│   │  1. margin: 0 auto;          (块级元素)          │          │
│   │  2. text-align: center;      (行内/文字)        │          │
│   │  3. flex: justify-content: center;              │          │
│   │  4. grid: place-items: center;                  │          │
│   │  5. absolute + transform                         │          │
│   └─────────────────────────────────────────────────┘          │
│                                                                  │
│   ┌─────────────────────────────────────────────────┐          │
│   │                   垂直居中                        │          │
│   ├─────────────────────────────────────────────────┤          │
│   │  1. line-height = height     (单行文字)          │          │
│   │  2. flex: align-items: center;                  │          │
│   │  3. grid: place-items: center;                  │          │
│   │  4. absolute + transform                         │          │
│   │  5. table-cell + vertical-align                 │          │
│   └─────────────────────────────────────────────────┘          │
│                                                                  │
│   ┌─────────────────────────────────────────────────┐          │
│   │                 完全居中 (水平和垂直)             │          │
│   ├─────────────────────────────────────────────────┤          │
│   │  1. flex + justify-content + align-items       │          │
│   │  2. grid + place-items: center                  │          │
│   │  3. absolute + transform (translate -50%)       │          │
│   │  4. absolute + margin: auto                      │          │
│   └─────────────────────────────────────────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**代码示例**：

```css
/* Flex 方案（推荐） */
.parent {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Grid 方案（最简） */
.parent {
  display: grid;
  place-items: center;
}

/* Absolute + Transform（已知宽高） */
.child {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* Absolute + Margin（已知宽高） */
.child {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  margin: auto;
}
```

---

### 2.9 重绘（Repaint）与重排（Reflow）

**参考答案：**

| 概念 | 定义 | 触发条件 |
| :--- | :--- | :--- |
| **重排（Reflow）** | 重新计算元素的几何属性（位置、尺寸） | 页面布局变化 |
| **重绘（Repaint）** | 重新绘制元素的外观（颜色、背景） | 外观变化但布局不变 |

```
┌─────────────────────────────────────────────────────────────────┐
│                    重排 vs 重绘                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  重排（Reflow） ──┬── 几何属性变化                               │
│     (严重)        ├── 盒子模型变化                               │
│                   ├── 增删 DOM 节点                              │
│                   ├── 元素尺寸/位置变化                          │
│                   └── font-size, padding, margin, width...      │
│                                                                  │
│  重绘（Repaint） ──┬── 外观变化                                  │
│     (较轻)        ├── 颜色/背景变化                              │
│                   ├── visibility, outline, border-color...     │
│                   └── 不影响布局的属性                          │
│                                                                  │
│  优化 ──────────►  使用 transform, opacity（触发合成）          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**避免重排的方法**：

```javascript
// ❌ 不好：每次循环都触发重排
for (let i = 0; i < 100; i++) {
  element.style.top = i + 'px';  // 触发重排
}

// ✅ 更好：使用 transform
element.style.transform = `translateY(${i * 100}px)`;  // 触发合成

// ✅ 更好：缓存布局信息
const width = element.offsetWidth;  // 缓存
element.style.width = width + 'px';
```

---

### 2.10 CSS 动画与性能优化

**参考答案：**

**动画性能黄金法则**：
- 动画属性分为三档：**合成器线程** > 布局 > 绘制

| 动画属性 | 线程 | 性能 |
| :--- | :--- | :--- |
| `transform` | 合成器 | 最佳 ✓ |
| `opacity` | 合成器 | 最佳 ✓ |
| `filter` | 合成器 | 良好 |
| `will-change` | 提示合成 | 优化 |
| `width`, `height` | 布局 | 较差 |
| `background-color` | 绘制 | 一般 |
| `color` | 绘制 | 一般 |

**最佳实践**：

```css
/* ✅ 使用 transform 和 opacity */
.element {
  transform: translateX(100px);
  opacity: 0.5;
}

/* ❌ 避免使用动画属性 */
.element {
  width: 100px;      /* 触发重排 */
  left: 100px;       /* 触发重排 */
  top: 100px;        /* 触发重排 */
  margin: 10px;      /* 触发重排 */
  padding: 10px;     /* 触发重排 */
  background: red;   /* 触发重绘 */
}
```

**will-change 优化**：

```css
.element {
  /* 提前告知浏览器即将变化 */
  will-change: transform, opacity;
}

/* 动画结束后移除，避免内存浪费 */
.element {
  will-change: auto;
}
```

---

### 2.11 响应式设计策略

**参考答案：**

**三种实现方案**：

```css
/* 1. 媒体查询（Media Query） */
@media screen and (max-width: 768px) {
  .container {
    flex-direction: column;
  }
}

@media (min-width: 768px) and (max-width: 1024px) {
  .container {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 2. 视口单位（vw/vh） */
.container {
  width: 100vw;
  font-size: 2vw;  /* 随视口缩放 */
}

/* 3. 容器查询（Container Query）@container */
@container (min-width: 400px) {
  .card {
    display: flex;
  }
}
```

**断点设计**：

| 断点 | 设备 | 尺寸 |
| :--- | :--- | :--- |
| 576px | 手机竖屏 | < 576px |
| 768px | 手机横屏/小平板 | ≥ 576px |
| 992px | 平板 | ≥ 768px |
| 1200px | 桌面 | ≥ 992px |
| 1400px | 大屏桌面 | ≥ 1200px |

**移动端优化**：

```css
/* 视口设置 */
<meta name="viewport" content="width=device-width, initial-scale=1.0">

/* 禁止缩放（可选） */
touch-action: manipulation;

/* 清除点击高亮 */
-webkit-tap-highlight-color: transparent;
```

---

### 2.12 CSS 预处理器与后处理器

**参考答案：**

**主流预处理器对比**：

| 特性 | Sass/SCSS | Less | Stylus |
| :--- | :--- | :--- | :--- |
| 变量 | `$var` | `@var` | `var` |
| 嵌套 | ✓ | ✓ | ✓ |
| 混合 | `@mixin` | `.class` | `mixin` |
| 继承 | `@extend` | 无 | ✓ |
| 条件 | `@if/@else` | `.when` | ✓ |
| 循环 | `@for/@each` | `.when` | ✓ |
| 函数 | 内置+自定义 | 内置+自定义 | 内置+自定义 |
| 导入 | `@import` | `@import` | `@import` |

**PostCSS 生态**：

| 插件 | 功能 |
| :--- | :--- |
| `autoprefixer` | 自动添加浏览器前缀 |
| `postcss-preset-env` | 现代 CSS 转换 |
| `cssnano` | CSS 压缩优化 |
| `postcss-modules` | CSS 模块化 |

---

### 2.13 link 与 @import 的区别

**参考答案：**

| 特性 | `<link>` | `@import` |
| :--- | :--- | :--- |
| **位置** | HTML 文档 `<head>` 中 | CSS 文件内部 |
| **加载时机** | 页面加载时同时下载 | CSS 解析时加载 |
| **并行下载** | 支持（多个 link 可并行） | 不支持（串行） |
| **DOM 控制** | 可用 JS 操作 | 不可用 JS 操作 |
| **权重** | 更高 | 较低 |
| **兼容性** | 所有浏览器 | IE5+ |

```html
<!-- link（推荐） -->
<link rel="stylesheet" href="style.css">

<!-- @import -->
<style>
  @import url("style.css");
</style>
```

---

### 2.14 CSS 伪类与伪元素

**参考答案：**

**伪类（:）**：选择元素的**特定状态**

| 伪类 | 说明 |
| :--- | :--- |
| `:hover` | 鼠标悬停 |
| `:active` | 激活状态（点击） |
| `:focus` | 获得焦点 |
| `:visited` | 已访问链接 |
| `:link` | 未访问链接 |
| `:first-child` | 第一个子元素 |
| `:last-child` | 最后一个子元素 |
| `:nth-child(n)` | 第 n 个子元素 |
| `:nth-of-type(n)` | 同类型第 n 个 |
| `:not(selector)` | 不匹配的元素 |
| `:checked` | 被选中的表单元素 |
| `:disabled` | 禁用状态 |
| `:valid` / `:invalid` | 表单验证状态 |

**伪元素（::）**：创建**虚拟元素**

| 伪元素 | 说明 |
| :--- | :--- |
| `::before` | 元素前插入内容 |
| `::after` | 元素后插入内容 |
| `::first-line` | 第一行文本 |
| `::first-letter` | 第一个字母 |
| `::selection` | 选中文本 |
| `::placeholder` | 输入框占位符 |

```css
/* 伪元素示例 */
.btn::before {
  content: "";
  display: inline-block;
}
```

---

### 2.15 display:none 与 visibility:hidden 的区别

**参考答案：**

| 特性 | `display: none` | `visibility: hidden` |
| :--- | :--- | :--- |
| **渲染** | 不渲染，完全隐藏 | 渲染但不可见 |
| **空间** | 不占据空间 | 占据空间 |
| **DOM** | 存在于 DOM 中 | 存在于 DOM 中 |
| **事件** | 不触发事件 | 不触发事件 |
| **子元素** | 隐藏后无法恢复 | 设置 `visibility: visible` 可恢复 |
| **过渡动画** | 不支持 | 支持 |

```css
/* 子元素可以恢复显示 */
.parent {
  visibility: hidden;
}
.child {
  visibility: visible;  /* 子元素显示 */
}

/* display 无法做到这点 */
```

---

### 2.16 常见 CSS 兼容性问题与解决方案

**参考答案：**

```css
/* 1. Flex 旧语法 */
.box {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
}

/* 2. Grid 旧语法 */
.container {
  display: -ms-grid;
  display: grid;
}

/* 3. 居中方案 */
.parent {
  display: -webkit-box;
  -webkit-box-pack: center;
  -webkit-box-align: center;
}

/* 4. 清除浮动 */
.clearfix::after {
  content: "";
  display: block;
  clear: both;
}

/* 5. 圆角 */
.border {
  -webkit-border-radius: 5px;
  border-radius: 5px;
}

/* 6. 阴影 */
.box {
  -webkit-box-shadow: 0 2px 5px rgba(0,0,0,0.3);
  box-shadow: 0 2px 5px rgba(0,0,0,0.3);
}

/* 7. 渐变 */
.gradient {
  background: -webkit-linear-gradient(left, red, blue);
  background: linear-gradient(to right, red, blue);
}

/* 8. Flex 弹性盒 */
.flex {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
}
.flex > li {
  -webkit-box-flex: 1;
  -ms-flex: 1;
  flex: 1;
}
```

---

### 2.17 CSS 新特性（Modern CSS）

**参考答案：**

**CSS Grid 进化**：

```css
/* subgrid - 继承父网格 */
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}
.item {
  display: grid;
  grid-column: span 3;
  grid-template-columns: subgrid;
}
```

**CSS 容器查询**：

```css
/* 父容器定义 */
.card-container {
  container-type: inline-size;
  container-name: card;
}

/* 基于容器的响应式 */
@container card (min-width: 400px) {
  .card {
    display: flex;
  }
}
```

**CSS 嵌套**：

```css
/* 原生嵌套（无需预处理器） */
.card {
  & .title {
    font-size: 16px;
  }
  &:hover {
    background: #f5f5f5;
  }
}
```

**CSS 自定义属性**：

```css
@property --color-primary {
  syntax: '<color>';
  inherits: false;
  initial-value: blue;
}
```

**CSS 触发器（:has()）**：

```css
/* 父元素有特定子元素时样式 */
.card:has(.badge) {
  padding-top: 20px;
}

/* 表单验证样式 */
form:has(input:invalid) .submit-btn {
  opacity: 0.5;
}
```

---

### 2.18 CSS 字体相关知识

**参考答案：**

```css
/* 字体族 */
font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;

/* 字体大小 */
font-size: 16px;
font-size: 2rem;      /* 根元素字体的倍数 */
font-size: 2em;      /* 父元素字体的倍数 */
font-size: 50vh;     /* 视口高度 */

/* 字体粗细 */
font-weight: 100 | 200 | 300 | 400(normal) | 500 | 600 | 700(bold) | 800 | 900;

/* 行高 */
line-height: 1.5;    /* 推荐使用倍数 */
line-height: 20px;

/* 字体属性简写 */
font: italic bold 16px/1.5 "Helvetica Neue", sans-serif;

/* Web 字体 */
@font-face {
  font-family: 'MyFont';
  src: url('myfont.woff2') format('woff2'),
       url('myfont.woff') format('woff');
  font-weight: 400;
  font-style: normal;
  font-display: swap;  /* 优化字体加载 */
}

/* 字体显示策略 */
font-display: block;     /* 等待加载完成 */
font-display: swap;      /* 先用默认字体，加载后交换 */
font-display: fallback;  /* 短暂等待后降级 */
font-display: optional;  /* 可选，可能不加载 */
```

---

### 2.19 CSS 长度单位详解

**参考答案：**

| 单位 | 类型 | 说明 |
| :--- | :--- | :--- |
| `px` | 绝对 | 像素，屏幕物理像素 |
| `em` | 相对 | 相对于父元素字体大小 |
| `rem` | 相对 | 相对于根元素字体大小 |
| `%` | 相对 | 相对于父元素对应属性 |
| `vw` | 相对 | 视口宽度的 1% |
| `vh` | 相对 | 视口高度的 1% |
| `vmin` | 相对 | vw 和 vh 中较小者 |
| `vmax` | 相对 | vw 和 vh 中较大者 |
| `ch` | 相对 | 数字 0 的宽度 |
| `ex` | 相对 | 字母 x 的高度 |

**使用场景**：

```css
/* 响应式布局 */
width: 50vw;
height: 100vh;

/* 流体排版 */
font-size: clamp(1rem, 2vw + 1rem, 2rem);

/* 等比例缩放 */
.container {
  width: 100%;
  max-width: 1200px;
}

/* rem 方案 */
html {
  font-size: 16px;
}
```

---

### 2.20 CSS 雪碧图（Sprite）技术

**参考答案：**

**原理**：将多张图标合并为一张图片，通过 `background-position` 显示不同部分。

```css
/* 定义图标 */
.icon {
  background-image: url(sprite.png);
  display: inline-block;
}

/* 定位各图标 */
.icon-home {
  width: 20px;
  height: 20px;
  background-position: 0 0;
}

.icon-user {
  width: 20px;
  height: 20px;
  background-position: -20px 0;
}

.icon-settings {
  width: 20px;
  height: 20px;
  background-position: -40px 0;
}
```

**现代替代方案**：
- SVG Icons（推荐）
- Icon Fonts（Font Awesome）
- 内联 SVG
- Data URI

---

## 三、浏览器原理

### 3.1 浏览器存储方案对比

**参考答案：**

| 特性 | localStorage | sessionStorage | Cookie | IndexedDB |
| :--- | :--- | :--- | :--- | :--- |
| **容量** | 5-10MB | 5-10MB | 4KB | 无限 |
| **有效期** | 永久 | 会话 | 设置 | 永久 |
| **域限制** | 同源 | 同源 | 同源 | 同源 |
| **API** | 同步 | 同步 | 需封装 | 异步 |
| **类型** | 字符串 | 字符串 | 字符串 | 任意 |

```javascript
// localStorage
localStorage.setItem('key', 'value');
localStorage.getItem('key');
localStorage.removeItem('key');
localStorage.clear();

// sessionStorage - 同上，只是关闭标签页后清除

// Cookie
document.cookie = "name=value; expires=date; path=/";

// IndexedDB
const request = indexedDB.open('myDB', 1);
request.onsuccess = (e) => { /* 成功 */ };
```

---

### 3.2 Cookie、Session、Token 区别

**参考答案：**

```
┌─────────────────────────────────────────────────────────────────┐
│                      认证机制对比                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Cookie + Session                                               │
│  ┌──────────┐     ┌──────────────┐     ┌────────────┐        │
│  │  Client   │────▶│   Server     │────▶│  Session   │        │
│  │  Cookie   │◀────│  (内存/Redis) │◀────│  Store     │        │
│  │  JSESSION │     └──────────────┘     └────────────┘        │
│  └──────────┘                                                  │
│                                                                  │
│  Token (JWT)                                                    │
│  ┌──────────┐     ┌──────────────┐                             │
│  │  Client  │────▶│   Server     │  (无状态，验证签名)        │
│  │  Token   │◀────│              │                             │
│  │  (JWT)   │     └──────────────┘                             │
│  └──────────┘                                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

| 特性 | Cookie | Session | Token |
| :--- | :--- | :--- | :--- |
| **存储位置** | 浏览器 | 服务器内存/数据库 | 浏览器/客户端 |
| **安全性** | 较安全（可加密） | 安全 | 需考虑 XSS |
| **跨域** | 支持 CORS | 不支持 | 支持 |
| **状态管理** | 有状态 | 有状态 | 无状态 |
| **扩展性** | 差 | 需共享 Session | 好 |

---

### 3.3 前端性能优化策略

**参考答案：**

**资源加载优化**：

```html
<!-- 1. 懒加载 -->
<img loading="lazy" src="image.jpg">

<!-- 2. 预加载 -->
<link rel="preload" href="font.woff2" as="font">
<link rel="prefetch" href="next-page.html">

<!-- 3. DNS 预解析 -->
<link rel="dns-prefetch" href="//cdn.example.com">

<!-- 4. 预连接 -->
<link rel="preconnect" href="https://api.example.com">

<!-- 5. 异步加载脚本 -->
<script src="app.js" async></script>
<script src="app.js" defer></script>
```

**渲染优化**：

```css
/* 1. 减少重排重绘 */
.el {
  transform: translateX(100px);  /* 合成器线程 */
  opacity: 0.5;
}

/* 2. will-change 提示 */
.el {
  will-change: transform;
}

/* 3. 减少 DOM 层级 */

/* 4. CSS 放在 head，JS 放在 body 末尾 */
```

**构建优化**：

```javascript
// webpack.config.js
{
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
        }
      }
    }
  },
  production: {
    minimize: true,
    treeShaking: true,
  }
}
```

---

## 一、HTML 深入详解

### 1.1 HTML5 新增特性详解

**参考答案：**

HTML5 引入了一系列重磅特性，极大推动了 Web 应用的发展：

1. **语义化标签**：`<article>`、`<section>`、`<nav>`、`<header>`、`<footer>`、`<aside>` 等，提升文档结构可读性和 SEO 效果。

2. **表单增强**：
   - 新增 input 类型：`email`、`url`、`tel`、`number`、`range`、`date`、`time`、`datetime-local`、`color` 等
   - 新增属性：`placeholder`、`required`、`pattern`、`autofocus`、`autocomplete`、`novalidate`
   - 新增表单元素：`<datalist>`、`<output>`、`<keygen>`（已废弃）、`<meter>`

3. **多媒体标签**：
   - `<video>`：支持 MP4、WebM、Ogg 格式，具备 controls、autoplay、loop、muted、poster 等属性
   - `<audio>`：支持 MP3、Wav、Ogg 格式
   - 视频编解码：H.264（Safari/IE）、VP8/VP9（Chrome/Firefox）、Ogg Theora

4. **Canvas 与 SVG**：
   - `<canvas>`：基于位图的 2D 绘图 API，支持动画、游戏渲染、数据可视化
   - `<svg>`：矢量图形语言，支持 DOM 操作、事件绑定、动画

5. **本地存储**：
   - `localStorage`：持久化存储，容量约 5-10MB，同源策略
   - `sessionStorage`：会话级存储，页面关闭后清除
   - `IndexedDB`：浏览器内置的 NoSQL 数据库，支持大容量结构化数据存储

6. **Web Worker**：后台线程，不阻塞主线程，用于复杂计算
7. **WebSocket**：全双工通信协议
8. **Geolocation API**：地理定位
9. **Drag and Drop API**：拖拽接口
10. **History API**：history.pushState、history.replaceState、popstate 事件

---

### 1.2 HTML 语义化标签深度解析

**参考答案：**

HTML5 语义化标签是 Web 标准的重要进步，它们让 HTML 文档具有明确的结构含义，不仅便于开发者理解，也使得搜索引擎和辅助技术能够更好地解析页面内容。

#### 1.2.1 语义化标签概述

语义化标签是指那些具有明确含义的 HTML 元素，它们本身就传达了所包含内容的类型和作用。与 `<div>` 和 `<span>` 这类无语义的通用容器不同，语义化标签如 `<header>`、`<nav>`、`<article>` 等，能够让浏览器、搜索引擎和屏幕阅读器更好地理解文档结构。

在 HTML5 之前，开发者通常使用大量的 `<div>` 元素配合 CSS 类名来构建页面结构，如 `<div class="header">`、`<div class="nav">` 等。虽然这种方式在视觉上能够实现相同的效果，但在语义层面却无法传达任何有意义的信息。HTML5 引入的语义化标签正是为了解决这一问题。

语义化标签的使用带来了多方面的好处。首先，在 SEO 方面，搜索引擎爬虫能够更准确地理解页面的主题和结构，从而提升页面在搜索结果中的排名。其次，对于使用屏幕阅读器的视障用户来说，语义化标签能够帮助他们更快速地导航和理解页面内容。此外，语义化标签也提高了代码的可读性和可维护性，使得团队协作更加高效。

#### 1.2.2 常用语义化标签详解

**header 元素**

`<header>` 元素用于表示页面或区块的头部内容。一个页面可以有多个 `<header>` 元素，每个语义区块（如 `<article>`、`<section>`）也可以有自己的头部。`<header>` 元素通常包含导航链接、标题、logo 或其他 introductory 内容。

```html
<!-- 页面级 header -->
<header>
    <h1>网站标题</h1>
    <nav>
        <ul>
            <li><a href="/">首页</a></li>
            <li><a href="/about">关于</a></li>
            <li><a href="/contact">联系</a></li>
        </ul>
    </nav>
</header>

<!-- 文章级 header -->
<article>
    <header>
        <h2>文章标题</h2>
        <p class="meta">发布时间：2024-01-15</p>
    </header>
    <p>文章内容...</p>
</article>
```

**nav 元素**

`<nav>` 元素用于标记导航链接区域。并不是所有的链接组都需要使用 `<nav>` 标签，只有那些主要的导航区块才应该使用它。页面底部的辅助导航、面包屑导航等也可以使用 `<nav>`，但应根据实际语义来决定。

```html
<nav aria-label="主导航">
    <ul>
        <li><a href="/">首页</a></li>
        <li><a href="/products">产品</a></li>
        <li><a href="/services">服务</a></li>
        <li><a href="/blog">博客</a></li>
    </ul>
</nav>

<!-- 面包屑导航 -->
<nav aria-label="面包屑">
    <ol>
        <li><a href="/">首页</a></li>
        <li><a href="/products">产品</a></li>
        <li>当前页面</li>
    </ol>
</nav>
```

**main 元素**

`<main>` 元素用于标记页面的主要内容区域。一个页面应该只有一个 `<main>` 元素，且该元素不应包含导航、侧边栏、页脚等通用内容。`<main>` 元素的内容应该是页面独有的核心功能或信息。

```html
<main>
    <h1>页面主标题</h1>
    <article>
        <h2>文章标题</h2>
        <p>文章内容...</p>
    </article>
    <section>
        <h2>功能区块</h2>
        <p>功能描述...</p>
    </section>
</main>
```

**article 元素**

`<article>` 元素用于包装独立的、可分发的内容单元，如博客文章、新闻报道、论坛帖子、用户评论等。`<article>` 元素内部应该能够独立于页面其他部分而被理解和使用。一个页面可以有多个 `<article>` 元素。

```html
<article>
    <header>
        <h2>深入理解 CSS Grid 布局</h2>
        <p>作者：张三 | 2024-01-20</p>
    </header>
    <div class="content">
        <p>CSS Grid Layout 是 CSS 中最强大的二维布局系统...</p>
    </div>
    <footer>
        <p>标签：CSS, 前端开发</p>
    </footer>
</article>

<!-- 评论区域也是独立的 article -->
<article class="comment">
    <p>评论内容：非常棒的文章！</p>
    <footer>
        <p>评论者：李四 | 2024-01-21</p>
    </footer>
</article>
```

**section 元素**

`<section>` 元素用于将相关内容分组，通常配合标题使用。`<section>` 用于将页面分割为不同的功能或主题区域。与 `<div>` 不同，`<section>` 元素内部通常应该有一个标题。如果一个区域不需要标题，可能更适合使用 `<div>`。

```html
<section>
    <h2>产品特色</h2>
    <p>介绍产品的核心优势...</p>
</section>

<section>
    <h2>技术规格</h2>
    <table>
        <tr><td>尺寸</td><td>100x200mm</td></tr>
        <tr><td>重量</td><td>500g</td></tr>
    </table>
</section>
```

**aside 元素**

`<aside>` 元素用于表示与主内容相关但可以独立的辅助信息。在页面侧边栏中使用较多，也可以用于标记引用、广告、导航补充信息等。<aside> 元素的内容与周围内容有一定的关联，但应该是可以分离的。

```html
<aside>
    <h3>相关文章</h3>
    <ul>
        <li><a href="#">CSS Flexbox 入门指南</a></li>
        <li><a href="#">响应式设计最佳实践</a></li>
    </ul>
</aside>

<!-- 在 article 中使用 aside -->
<article>
    <h1>主文章标题</h1>
    <p>文章正文...</p>
    <aside>
        <h3>术语解释</h3>
        <dl>
            <dt>BFC</dt>
            <dd>块级格式化上下文（Block Formatting Context）</dd>
        </dl>
    </aside>
</article>
```

**footer 元素**

`<footer>` 元素用于表示页面或区块的底部内容。与 `<header>` 类似，一个页面可以有多个 `<footer>` 元素，每个语义区块也可以有自己的底部。<footer> 通常包含版权信息、作者链接、相关文档链接等。

```html
<!-- 页面级 footer -->
<footer>
    <p>&copy; 2024 公司名称. All rights reserved.</p>
    <nav>
        <a href="/privacy">隐私政策</a>
        <a href="/terms">服务条款</a>
    </nav>
</footer>

<!-- 文章级 footer -->
<article>
    <h2>文章标题</h2>
    <p>文章内容...</p>
    <footer>
        <p>本文作者：张三</p>
        <p>未经授权，禁止转载</p>
    </footer>
</article>
```

#### 1.2.3 语义化标签的使用原则

语义化标签的使用需要遵循一定的原则，以确保其发挥应有的作用。首先，应该根据内容的语义选择合适的标签，而不是为了布局方便而随意使用。如果内容本身就是导航信息，就应该使用 `<nav>`；如果是一篇文章，就应该使用 `<article>`。

其次，语义化标签可以嵌套使用，形成清晰的文档结构。例如，一个 `<article>` 可以包含多个 `<section>`，一个 `<section>` 也可以包含多个 `<article>`。关键是要理解每个标签的语义含义，并根据实际内容结构来选择。

最后，语义化标签的使用不应该过度。并不是所有的 `<div>` 都需要替换为语义化标签，如果一个容器仅仅是用于布局目的而没有特定的语义含义，使用 `<div>` 是完全合理的。语义化标签的目的是增强文档的语义表达，而不是取代所有 `<div>`。

```html
<!-- 正确的语义化使用 -->
<body>
    <header>
        <h1>我的博客</h1>
        <nav>...</nav>
    </header>

    <main>
        <article>
            <header><h2>文章标题</h2></header>
            <section>
                <h3>第一章</h3>
                <p>内容...</p>
            </section>
            <section>
                <h3>第二章</h3>
                <p>内容...</p>
            </section>
            <footer>...</footer>
        </article>

        <aside>
            <section>
                <h3>关于作者</h3>
                <p>...</p>
            </section>
        </aside>
    </main>

    <footer>...</footer>
</body>

<!-- 不必要地使用语义化标签（过度使用） -->
<!-- 不推荐 -->
<nav><div class="wrapper">...</div></nav>
<article><section><div>...</div></section></article>

<!-- 使用 div 是合理的情况 -->
<!-- 推荐 -->
<div class="clearfix"></div>
<div class="modal-overlay"></div>
<div class="button-group">...</div>
```

#### 1.2.4 语义化与可访问性

语义化标签在可访问性（Accessibility，简称 a11y）中扮演着至关重要的角色。屏幕阅读器依赖 HTML 元素的语义来向视障用户传达页面结构和内容。正确使用语义化标签可以显著提升网站的可访问性，使得所有用户都能够顺利地获取信息。

ARIA（Accessible Rich Internet Applications）是一套用于增强 Web 应用可访问性的规范。ARIA 通过添加特定的属性来补充 HTML 语义，帮助辅助技术更好地理解动态内容和复杂的 UI 组件。常见的 ARIA 属性包括 `aria-label`、`aria-describedby`、`aria-hidden`、`role` 等。

```html
<!-- 使用 ARIA 增强语义 -->
<nav aria-label="主导航">
    <ul role="menubar">
        <li role="menuitem"><a href="/">首页</a></li>
        <li role="menuitem"><a href="/about">关于</a></li>
    </ul>
</nav>

<!-- 按钮使用 aria-label -->
<button aria-label="关闭" onclick="closeModal()">
    <span aria-hidden="true">&times;</span>
</button>

<!-- 表单关联标签 -->
<label for="username">用户名</label>
<input type="text" id="username" aria-describedby="username-help">
<p id="username-help">请输入您的用户名</p>
```

---

### 1.3 SEO 优化深度指南

**参考答案：**

SEO（Search Engine Optimization，搜索引擎优化）是通过了解搜索引擎的运作规则来调整网站，以提高网站在搜索结果中的排名。对于前端开发者来说，正确的 HTML 语义化、合理使用 meta 标签、优化页面性能等都是 SEO 优化的重要方面。

#### 1.3.1 搜索引擎工作原理

搜索引擎的工作流程通常包括三个主要阶段：爬取（Crawling）、索引（Indexing）和排名（Ranking）。在爬取阶段，搜索引擎使用被称为"爬虫"或"蜘蛛"的自动程序来发现和访问网页。爬虫通过跟踪页面上的链接来发现新的内容。

索引阶段，搜索引擎会分析爬取到的网页内容，提取关键词、建立倒排索引等。搜索引擎会分析页面的标题、内容、结构、链接等多方面信息，并将其存储在巨大的数据库中。

排名阶段，当用户搜索某个关键词时，搜索引擎会根据其算法对索引中的相关页面进行排序。排名算法会考虑数百个因素，包括页面内容的相关性、页面质量、用户体验、加载速度、外部链接等。

了解搜索引擎的工作原理有助于我们采取针对性的优化措施。作为前端开发者，我们需要确保搜索引擎能够有效地爬取和理解我们的页面内容，这正是 HTML 语义化和各种 SEO 技术发挥作用的地方。

#### 1.3.2 标题标签层级

标题标签（`<h1>` 到 `<h6>`）在 SEO 中具有极高的权重。搜索引擎通过标题来理解页面的主题和结构。一个页面应该只有一个 `<h1>` 标签，用于表示页面的主标题。`<h2>` 到 `<h6>` 用于表示不同层级的子标题。

```html
<!-- 正确的标题层级 -->
<body>
    <h1>网站主标题</h1>

    <article>
        <h2>文章主标题</h2>

        <section>
            <h3>章节标题 1</h3>
            <p>内容...</p>

            <h4>小节标题 1.1</h4>
            <p>内容...</p>
        </section>

        <section>
            <h3>章节标题 2</h3>
            <p>内容...</p>
        </section>
    </article>
</body>

<!-- 错误的标题使用 -->
<!-- 1. 多个 h1 -->
<h1>主标题</h1>
<h1>另一个主标题</h1>

<!-- 2. 跳过标题级别 -->
<h1>标题</h1>
<h3>子标题</h3>  <!-- 跳过了 h2 -->

<!-- 3. 用标题标签来设置样式 -->
<h1 style="font-size: 14px;">我只是想用小字体</h1>
```

#### 1.3.3 Meta 标签优化

Meta 标签提供了关于 HTML 文档的元数据信息，这些信息不会直接显示在页面上，但会被搜索引擎和其他网络服务使用。正确配置 Meta 标签是 SEO 优化的基础。

**Title 标签**

虽然严格来说 `<title>` 不是 meta 标签，但它在 SEO 中的重要性不容忽视。`<title>` 标签定义了浏览器标题栏和搜索结果中显示的标题。一个好的标题应该简洁明了，包含目标关键词，并且具有吸引力。

```html
<!-- 推荐的标题格式 -->
<title>主关键词 - 品牌名称</title>
<title>如何学习前端开发 - 前端学习指南</title>

<!-- 不推荐的标题 -->
<title>首页</title>  <!-- 缺乏描述性 -->
<title>欢迎来到我们的网站 - 公司名</title>  <!-- 关键词靠后 -->
```

**Description 标签**

Meta description 提供了页面的简要描述。虽然搜索引擎不再像以前那样重视这个标签，但它仍然会出现在搜索结果中，影响用户的点击意愿。一个好的描述应该简洁、准确地概括页面内容，并包含相关的关键词。

```html
<meta name="description" content="深入学习 HTML、CSS、JavaScript，提供完整的前端开发教程和最佳实践。适合初学者和进阶开发者。">
```

**Keywords 标签**

Meta keywords 曾是 SEO 的重要因素，但现在搜索引擎已经大大降低了对它的重视程度。一些搜索引擎甚至完全忽略这个标签。因此，不需要过度关注这个标签，但可以适当添加一些相关的关键词。

```html
<meta name="keywords" content="前端开发, HTML, CSS, JavaScript, 教程">
```

**robots 标签**

Robots 标签用于指示搜索引擎爬虫如何处理页面。

```html
<!-- 允许爬虫索引和跟踪链接 -->
<meta name="robots" content="index, follow">

<!-- 禁止索引但允许跟踪链接 -->
<meta name="robots" content="noindex, follow">

<!-- 允许索引但禁止跟踪链接 -->
<meta name="robots" content="index, nofollow">

<!-- 禁止索引和跟踪 -->
<meta name="robots" content="noindex, nofollow">
```

**Canonical 标签**

Canonical 标签用于解决重复内容问题。当同一个页面可以通过多个 URL 访问时，使用 canonical 标签可以告诉搜索引擎哪个是首选的 URL。

```html
<link rel="canonical" href="https://example.com/page/">
```

**Open Graph 标签**

Open Graph 标签用于控制社交媒体分享时显示的内容。虽然不是传统意义上的 SEO 标签，但好的社交分享预览可以间接提升流量。

```html
<meta property="og:title" content="页面标题">
<meta property="og:description" content="页面描述">
<meta property="og:image" content="https://example.com/image.jpg">
<meta property="og:url" content="https://example.com/page/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="网站名称">
```

**Twitter Card 标签**

```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="页面标题">
<meta name="twitter:description" content="页面描述">
<meta name="twitter:image" content="https://example.com/image.jpg">
```

#### 1.3.4 链接优化

链接在 SEO 中扮演着重要角色。搜索引擎通过链接来发现新的页面，并评估页面之间的关系。内部链接帮助搜索引擎理解网站结构，外部链接（尤其是来自权威网站的链接）可以提升页面的权威性。

**内部链接优化**

```html
<!-- 使用描述性的锚文本 -->
<a href="/css-tutorial/">学习 CSS 教程</a>
<a href="/js-framework/react/">React 框架教程</a>

<!-- 避免使用无意义的链接文本 -->
<a href="#">点击这里</a>
<a href="/page">这里</a>
<a href="/page">更多</a>
```

**外部链接策略**

链接到高质量的外部资源可以增加页面的可信度。但要注意，链接到的网站应该是权威且相关的。避免链接到低质量或可疑的网站，因为这可能会影响自身页面的排名。

```html
<!-- 推荐：链接到权威来源 -->
<p>根据 <a href="https://www.w3.org/" target="_blank" rel="noopener noreferrer">W3C</a> 的标准...</p>

<!-- 使用 rel 属性保护自身 -->
<a href="https://external-site.com" target="_blank" rel="noopener noreferrer">
    外部链接
</a>
<!-- noopener 防止新窗口访问 window.opener -->
<!-- noreferrer 防止传递引用信息 -->
```

**nofollow 属性**

对于不应该传递权重的链接（如评论链接、广告链接等），应该添加 `rel="nofollow"` 属性。

```html
<!-- 搜索引擎不应跟随此链接 -->
<a href="https://advertiser.com" rel="nofollow">广告链接</a>

<!-- 用户生成的链接建议添加 nofollow -->
<a href="/user/profile" rel="nofollow">用户名</a>
```

#### 1.3.5 图片优化

图片优化是 SEO 中常被忽视但非常重要的方面。搜索引擎无法"看"图片的内容，但可以通过 alt 属性和其他信息来理解图片。

**Alt 属性**

Alt 属性为图片提供了文本描述，对于搜索引擎理解和可访问性都至关重要。

```html
<!-- 描述性的 alt 文本 -->
<img src="css-box-model-diagram.png" alt="CSS 盒模型示意图，展示 content、padding、border、margin 的关系">

<!-- 装饰性图片使用空 alt -->
<img src="decorative-line.png" alt="">

<!-- 避免使用不描述内容的 alt 文本 -->
<img src="image1.jpg" alt="图片">  <!-- 不好 -->
<img src="photo.jpg" alt="照片">   <!-- 不好 -->
```

**图片文件命名**

使用描述性的文件名可以帮助搜索引擎理解图片内容。

```html
<!-- 好的文件名 -->
<img src="cat-sitting-on-sofa.jpg" alt="坐在沙发上的猫">

<!-- 不好的文件名 -->
<img src="img_00123.jpg" alt="猫">
<img src="dsc0892.png" alt="猫">
```

**图片格式选择**

不同的图片格式有不同的特点，选择合适的格式可以优化页面性能。

- JPEG：适合照片和复杂图像，支持有损压缩
- PNG：适合需要透明背景或需要无损质量的图像
- WebP：现代格式，提供更好的压缩比
- SVG：适合图标和简单图形，文件小且可缩放

```html
<!-- 现代图片格式示例 -->
<picture>
    <source srcset="image.avif" type="image/avif">
    <source srcset="image.webp" type="image/webp">
    <img src="image.jpg" alt="描述性文本">
</picture>
```

#### 1.3.6 结构化数据

结构化数据（Structured Data）是一种使用特定格式（如 JSON-LD）来向搜索引擎提供关于页面内容额外信息的技术。正确使用结构化数据可以帮助搜索引擎更好地理解页面内容，并在搜索结果中显示丰富的摘要（Rich Snippets）。

**JSON-LD 格式**

```html
<!-- 文章结构化数据 -->
<script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "深入理解 CSS 盒模型",
    "image": "https://example.com/images/css-box-model.jpg",
    "author": {
        "@type": "Person",
        "name": "张三"
    },
    "datePublished": "2024-01-15",
    "dateModified": "2024-01-20",
    "description": "详细解析 CSS 盒模型的原理，包括 content-box 和 border-box 的区别..."
}
</script>

<!-- 产品结构化数据 -->
<script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "无线蓝牙耳机",
    "image": "https://example.com/images/headphones.jpg",
    "description": "高品质无线蓝牙耳机，支持主动降噪",
    "brand": {
        "@type": "Brand",
        "name": "AudioTech"
    },
    "offers": {
        "@type": "Offer",
        "priceCurrency": "CNY",
        "price": "599.00",
        "availability": "https://schema.org/InStock"
    }
}
</script>

<!-- 组织结构化数据 -->
<script type="application/ld+json">
{
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "示例公司",
    "url": "https://example.com",
    "logo": "https://example.com/logo.png",
    "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+86-10-12345678",
        "contactType": "customer service"
    }
}
</script>
```

#### 1.3.7 URL 优化

URL 的结构和命名对 SEO 也有一定影响。一个好的 URL 应该简洁、可读，并且包含相关的关键词。

```html
<!-- 推荐的 URL 格式 -->
https://example.com/tutorials/css/flexbox-layout
https://example.com/blog/2024/01/前端开发趋势

<!-- 不推荐的 URL 格式 -->
https://example.com/page?id=123456
https://example.com/index.php?cat=2&page=5
```

**URL 最佳实践**：

1. 使用简洁的 URL 结构
2. 包含目标关键词
3. 使用小写字母和连字符分隔单词
4. 避免不必要的参数
5. 创建逻辑清晰的目录结构

#### 1.3.8 页面性能与 SEO

页面加载速度是搜索引擎排名的重要因素之一。Google 明确表示页面速度是其排名算法的一个因素，尤其是对移动端搜索结果影响更大。

**性能优化要点**：

1. 优化图片大小和格式
2. 使用浏览器缓存
3. 启用 gzip 压缩
4. 减少 HTTP 请求
5. 使用 CDN 加速
6. 优化 CSS 和 JavaScript

```html
<!-- 预连接关键资源 -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- 预加载关键资源 -->
<link rel="preload" href="styles.css" as="style">
<link rel="preload" href="main.js" as="script">

<!-- 异步加载非关键资源 -->
<script src="analytics.js" async defer></script>
```

#### 1.3.9 移动端优化

随着移动设备使用的普及，移动端优化变得越来越重要。Google 采用了移动优先索引（Mobile-First Indexing），意味着它主要基于网站的移动版本来进行索引和排名。

**移动端优化要点**：

```html
<!-- 视口设置 -->
<meta name="viewport" content="width=device-width, initial-scale=1">

<!-- 确保内容适合移动端 -->
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">

<!-- 移动端友好的链接（更大的点击区域） -->
<style>
    a, button {
        min-height: 44px;
        min-width: 44px;
    }
</style>
```

#### 1.3.10 SEO 检查清单

以下是前端开发中应该注意的 SEO 要点：

1. **标题和描述**：
   - 每个页面有独特的 `<title>` 标签
   - 每个页面有独特的 meta description
   - 标题包含目标关键词

2. **语义化 HTML**：
   - 正确使用 `<h1>` 到 `<h6>` 标题层级
   - 使用语义化标签（header、nav、main、article、section、footer 等）
   - 图片添加描述性的 alt 属性

3. **链接**：
   - 使用描述性的锚文本
   - 合理使用内部链接
   - 控制页面上的链接数量（避免链接稀释）

4. **图片**：
   - 使用适当的图片格式
   - 优化图片大小
   - 添加 alt 属性

5. **URL**：
   - 使用简洁、可读的 URL
   - URL 包含关键词
   - 保持 URL 稳定（避免频繁更改）

6. **性能**：
   - 优化页面加载速度
   - 确保移动端友好
   - 使用响应式设计

7. **结构化数据**：
   - 添加适当的结构化数据
   - 使用 JSON-LD 格式

8. **技术方面**：
   - 创建 XML 网站地图
   - 设置 robots.txt
   - 实现 HTTPS
   - 使用规范的 URL（canonical）

---

### 1.4 表单验证全面解析

**参考答案：**

表单是 Web 应用中用户交互的核心元素，表单验证是确保数据质量和安全性的重要环节。HTML5 引入了强大的原生表单验证功能，同时 JavaScript 提供了更灵活的验证能力。

#### 1.4.1 HTML5 原生表单验证

HTML5 为表单验证提供了丰富的内置功能，无需编写 JavaScript 代码即可实现基本的验证。

**Required 属性**

required 属性指定输入字段必须填写：

```html
<form>
    <label for="username">用户名：</label>
    <input type="text" id="username" name="username" required>

    <label for="email">邮箱：</label>
    <input type="email" id="email" name="email" required>

    <button type="submit">提交</button>
</form>
```

**Pattern 属性**

pattern 属性允许使用正则表达式验证输入：

```html
<!-- 中国手机号验证 -->
<label for="phone">手机号：</label>
<input type="tel" id="phone" name="phone"
       pattern="1[3-9]\d{9}"
       title="请输入11位手机号"
       required>

<!-- 密码验证（8-16位，包含数字和字母） -->
<label for="password">密码：</label>
<input type="password" id="password" name="password"
       pattern="(?=.*\d)(?=.*[a-zA-Z]).{8,16}"
       title="密码长度为8-16位，必须包含数字和字母"
       required>

<!-- 身份证号验证 -->
<label for="idcard">身份证号：</label>
<input type="text" id="idcard" name="idcard"
       pattern="[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]"
       title="请输入正确的身份证号"
       required>
```

**输入类型限制**

HTML5 提供了多种输入类型，可以自动限制用户输入的内容：

```html
<!-- 邮箱 -->
<input type="email" required>

<!-- URL -->
<input type="url" required>

<!-- 数字 -->
<input type="number" min="0" max="100" step="1">

<!-- 滑块 -->
<input type="range" min="0" max="100" value="50">

<!-- 日期时间 -->
<input type="date">
<input type="time">
<input type="datetime-local">
<input type="month">
<input type="week">

<!-- 颜色 -->
<input type="color">
```

**长度限制**

```html
<!-- 最小长度 -->
<input type="text" minlength="3">

<!-- 最大长度 -->
<input type="text" maxlength="50">

<!-- 同时设置 -->
<input type="text" minlength="3" maxlength="50">
```

**Step 属性**

step 属性指定输入字段的合法数字间隔：

```html
<!-- 整数 -->
<input type="number" step="1">

<!-- 0.5 间隔 -->
<input type="number" step="0.5">

<!-- 日期间隔（7天） -->
<input type="date" step="7">
```

#### 1.4.2 CSS 验证状态样式

CSS 提供了伪类来根据表单元素的验证状态应用不同的样式：

```css
/* 输入有效时的样式 */
input:valid {
    border-color: green;
    background-color: #f0fff0;
}

/* 输入无效时的样式 */
input:invalid {
    border-color: red;
    background-color: #fff0f0;
}

/* 必填字段未填时的样式（初始状态不显示错误） */
input:required:placeholder-shown {
    border-color: initial;
    background-color: initial;
}

/* 自定义验证消息样式 */
input:invalid:not(:placeholder-shown) {
    border: 2px solid red;
}

/* focus 时的样式 */
input:focus:invalid {
    outline: 2px solid orange;
}

input:focus:valid {
    outline: 2px solid green;
}

/* 选中状态 */
input:checked + label {
    color: blue;
}

/* 禁用和只读样式 */
input:disabled {
    background-color: #eee;
    cursor: not-allowed;
}

input:read-only {
    background-color: #f5f5f5;
}
```

**完整的表单验证样式示例**：

```html
<style>
    .form-group {
        margin-bottom: 15px;
    }

    .form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
    }

    .form-group input {
        width: 100%;
        padding: 8px 12px;
        border: 2px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        transition: border-color 0.3s;
    }

    /* 有效状态 */
    .form-group input:valid:not(:placeholder-shown) {
        border-color: #28a745;
    }

    /* 无效状态 */
    .form-group input:invalid:not(:placeholder-shown) {
        border-color: #dc3545;
    }

    /* 获得焦点 */
    .form-group input:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
    }

    /* 错误消息 */
    .error-message {
        display: none;
        color: #dc3545;
        font-size: 12px;
        margin-top: 5px;
    }

    .form-group input:invalid:not(:placeholder-shown) ~ .error-message {
        display: block;
    }
</style>

<form>
    <div class="form-group">
        <label for="username">用户名（3-16个字符）</label>
        <input type="text" id="username" name="username"
               minlength="3" maxlength="16"
               pattern="^[a-zA-Z0-9_]+$"
               placeholder="请输入用户名"
               required>
        <span class="error-message">用户名必须为3-16位的字母、数字或下划线</span>
    </div>

    <div class="form-group">
        <label for="email">邮箱</label>
        <input type="email" id="email" name="email"
               placeholder="example@mail.com"
               required>
        <span class="error-message">请输入有效的邮箱地址</span>
    </div>

    <div class="form-group">
        <label for="password">密码（至少8位，包含数字和字母）</label>
        <input type="password" id="password" name="password"
               minlength="8"
               pattern="(?=.*\d)(?=.*[a-zA-Z]).{8,}"
               placeholder="请输入密码"
               required>
        <span class="error-message">密码必须至少8位，且包含数字和字母</span>
    </div>

    <div class="form-group">
        <label for="confirm-password">确认密码</label>
        <input type="password" id="confirm-password" name="confirm-password"
               placeholder="请再次输入密码"
               required>
        <span class="error-message">两次输入的密码不一致</span>
    </div>

    <button type="submit">注册</button>
</form>
```

#### 1.4.3 JavaScript 表单验证

虽然 HTML5 提供了强大的原生验证功能，但在实际应用中往往需要更复杂的验证逻辑。

**checkValidity() 方法**

每个表单元素都有 checkValidity() 方法，用于手动检查元素是否有效：

```javascript
const input = document.getElementById('username');

if (input.checkValidity()) {
    console.log('输入有效');
} else {
    console.log('输入无效: ' + input.validationMessage);
}
```

**validity 属性**

validity 属性包含多个布尔属性，用于检查具体的验证规则：

```javascript
const input = document.getElementById('email');

console.log(input.validity.valid);           // 是否有效
console.log(input.validity.valueMissing);    // 是否为空（required）
console.log(input.validity.typeMismatch);   // 类型不匹配
console.log(input.validity.patternMismatch); // 正则不匹配
console.log(input.validity.tooLong);        // 超过最大长度
console.log(input.validity.tooShort);       // 不足最小长度
console.log(input.validity.rangeUnderflow); // 低于最小值
console.log(input.validity.rangeOverflow); // 超过最大值
console.log(input.validity.stepMismatch);   // 步长不匹配
console.log(input.validity.customError);     // 自定义错误
```

**setCustomValidity() 方法**

可以自定义验证错误消息：

```javascript
const password = document.getElementById('password');
const confirmPassword = document.getElementById('confirm-password');

function validatePassword() {
    if (password.value !== confirmPassword.value) {
        confirmPassword.setCustomValidity('两次输入的密码不一致');
    } else {
        confirmPassword.setCustomValidity('');
    }
}

password.addEventListener('input', validatePassword);
confirmPassword.addEventListener('input', validatePassword);
```

**完整的 JavaScript 验证示例**：

```javascript
class FormValidator {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.inputs = this.form.querySelectorAll('input, select, textarea');
        this.init();
    }

    init() {
        // 实时验证
        this.inputs.forEach(input => {
            input.addEventListener('input', () => this.validateField(input));
            input.addEventListener('blur', () => this.validateField(input));
        });

        // 表单提交验证
        this.form.addEventListener('submit', (e) => {
            if (!this.validateForm()) {
                e.preventDefault();
            }
        });
    }

    validateField(input) {
        const errorElement = document.getElementById(input.id + '-error');

        if (input.checkValidity()) {
            input.classList.remove('invalid');
            input.classList.add('valid');
            if (errorElement) {
                errorElement.textContent = '';
            }
            return true;
        } else {
            input.classList.remove('valid');
            input.classList.add('invalid');
            if (errorElement) {
                errorElement.textContent = input.validationMessage;
            }
            return false;
        }
    }

    validateForm() {
        let isValid = true;

        this.inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        return isValid;
    }

    // 添加自定义验证规则
    addRule(inputId, validatorFn, message) {
        const input = document.getElementById(inputId);
        const originalCheckValidity = input.checkValidity.bind(input);

        input.checkValidity = () => {
            if (!originalCheckValidity()) {
                return false;
            }
            if (!validatorFn(input.value)) {
                input.setCustomValidity(message);
                return false;
            }
            input.setCustomValidity('');
            return true;
        };
    }
}

// 使用示例
const validator = new FormValidator('registration-form');

// 添加自定义验证
validator.addRule('password', (value) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value);
}, '密码必须至少8位，包含大小写字母和数字');

validator.addRule('username', (value) => {
    return !/^(admin|root|system)$/i.test(value);
}, '用户名不能使用保留字');

validator.addRule('age', (value) => {
    return value >= 18 && value <= 100;
}, '年龄必须在18-100之间');
```

#### 1.4.4 表单验证最佳实践

**客户端验证的重要性**：

1. 提供即时反馈，改善用户体验
2. 减少无效数据提交，节省服务器资源
3. 减轻服务器验证压力

**服务端验证的重要性**：

1. 客户端验证可以被绕过
2. 保护数据安全
3. 确保数据完整性

**验证原则**：

1. **渐进式验证**：在用户输入过程中实时验证，而非仅在提交时验证
2. **清晰的错误提示**：错误消息应该明确告诉用户哪里错了以及如何修正
3. **包容性设计**：考虑使用辅助技术的用户
4. **不要过度验证**：只验证必要的字段，避免给用户带来不必要的麻烦

```html
<!-- 良好的表单验证体验示例 -->
<form id="checkout-form" novalidate>
    <div class="form-field">
        <label for="card-number">银行卡号</label>
        <input type="text"
               id="card-number"
               name="card-number"
               inputmode="numeric"
               pattern="[\d\s]{16,19}"
               placeholder="1234 5678 9012 3456"
               autocomplete="cc-number"
               required>
        <span class="field-error" aria-live="polite"></span>
    </div>

    <div class="form-row">
        <div class="form-field">
            <label for="expiry">有效期</label>
            <input type="text"
                   id="expiry"
                   name="expiry"
                   pattern="(0[1-9]|1[0-2])\/([0-9]{2})"
                   placeholder="MM/YY"
                   autocomplete="cc-exp"
                   required>
        </div>

        <div class="form-field">
            <label for="cvv">CVV</label>
            <input type="text"
                   id="cvv"
                   name="cvv"
                   pattern="\d{3,4}"
                   placeholder="123"
                   autocomplete="cc-csc"
                   required>
        </div>
    </div>

    <button type="submit">支付</button>
</form>

<style>
    .form-field {
        margin-bottom: 1rem;
    }

    .form-field label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
    }

    .form-field input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 1rem;
    }

    .form-field input:focus {
        outline: none;
        border-color: #0066cc;
        box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.2);
    }

    .form-field input.invalid {
        border-color: #dc3545;
    }

    .form-field input.valid {
        border-color: #28a745;
    }

    .field-error {
        display: block;
        color: #dc3545;
        font-size: 0.875rem;
        margin-top: 0.25rem;
        min-height: 1.25rem;
    }

    .form-row {
        display: flex;
        gap: 1rem;
    }

    .form-row .form-field {
        flex: 1;
    }

    button {
        background-color: #0066cc;
        color: white;
        padding: 1rem 2rem;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        cursor: pointer;
    }

    button:hover {
        background-color: #0052a3;
    }

    button:disabled {
        background-color: #ccc;
        cursor: not-allowed;
    }
</style>

<script>
    const form = document.getElementById('checkout-form');
    const inputs = form.querySelectorAll('input');

    inputs.forEach(input => {
        const errorSpan = input.parentElement.querySelector('.field-error');

        input.addEventListener('invalid', (e) => {
            e.preventDefault();
            input.classList.add('invalid');
            input.classList.remove('valid');

            let message = '';
            if (input.validity.valueMissing) {
                message = '此字段为必填项';
            } else if (input.validity.patternMismatch) {
                message = '格式不正确';
            } else if (input.validity.tooShort) {
                message = `最少需要 ${input.minLength} 个字符`;
            } else if (input.validity.customError) {
                message = input.validationMessage;
            }

            if (errorSpan) {
                errorSpan.textContent = message;
            }
        });

        input.addEventListener('input', () => {
            if (input.checkValidity()) {
                input.classList.remove('invalid');
                input.classList.add('valid');
                if (errorSpan) {
                    errorSpan.textContent = '';
                }
            } else {
                input.classList.remove('valid');
            }
        });
    });
</script>
```

---

## 二、CSS 深入详解

### 2.1 CSS 选择器优先级与计算规则

**参考答案：**

```
┌─────────────────────────────────────────────────────────────────┐
│                    CSS 选择器优先级权重                          │
├─────────────────────────────────────────────────────────────────┤
│  !important    ────▶  无穷大（最高优先级）                       │
│  内联样式      ────▶  1000                                      │
│  ID 选择器     ────▶  100                                       │
│  类/属性/伪类  ────▶  10                                         │
│  元素/伪元素   ────▶  1                                          │
│  通配符/组合   ────▶  0                                          │
└─────────────────────────────────────────────────────────────────┘
```

**计算示例**：

```css
/* 优先级: 0-1-0-1 = 101 */
#nav .list-item { }

/* 优先级: 0-0-2-0 = 20 */
:hover .active { }

/* 优先级: 0-0-1-2 = 12 */
div ul li { }

/* 优先级: 0-1-0-1 = 101 */
#app .card:hover { }
```

**重要规则**：
- `!important` 优先级最高，慎用
- 相同优先级时，后定义的样式覆盖先定义的
- 组合选择器（逗号分隔）分别计算权重
- `:not()` 内部选择器参与权重计算
- `*` 通配符不增加权重

---

### 2.2 CSS 盒模型深度理解

**参考答案：**

```
┌─────────────────────────────────────────────────────────────────┐
│                        CSS 盒模型                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    ┌───────────────────────────────────────────────┐           │
│    │                 margin (外边距)                 │           │
│    │  ┌─────────────────────────────────────────┐  │           │
│    │  │            border (边框)                  │  │           │
│    │  │  ┌───────────────────────────────────┐  │  │           │
│    │  │  │         padding (内边距)           │  │  │           │
│    │  │  │  ┌───────────────────────────┐  │  │  │           │
│    │  │  │  │                           │  │  │  │           │
│    │  │  │  │     content (内容区)       │  │  │  │           │
│    │  │  │  │                           │  │  │  │           │
│    │  │  │  └───────────────────────────┘  │  │  │           │
│    │  │  └───────────────────────────────────┘  │  │           │
│    │  └─────────────────────────────────────────┘  │           │
│    └───────────────────────────────────────────────┘           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**两种盒模型**：

| 盒模型 | 设置方式 | width 包含内容 |
| :--- | :--- | :--- |
| **content-box**（默认） | `box-sizing: content-box` | 仅内容区域 |
| **border-box** | `box-sizing: border-box` | content + padding + border |

**实际宽度计算**：
- `content-box`：`width` = 内容宽度，总宽度 = width + padding + border + margin
- `border-box`：`width` = 内容 + padding + border，总宽度 = width + margin

**建议**：全局使用 `box-sizing: border-box`，避免 padding/border 导致的布局问题。

**盒模型详细解析**：

```css
/* 全局盒模型设置 */
*, *::before, *::after {
    box-sizing: border-box;
}

/* 手动计算示例 */
.content-box-element {
    width: 200px;
    padding: 20px;
    border: 10px solid #333;
    margin: 15px;
    /* 实际占用宽度 = 200 + 20*2 + 10*2 + 15*2 = 310px */
}

.border-box-element {
    box-sizing: border-box;
    width: 200px;
    padding: 20px;
    border: 10px solid #333;
    margin: 15px;
    /* 实际占用宽度 = 200 + 15*2 = 230px */
    /* 内容区域 = 200 - 20*2 - 10*2 = 140px */
}
```

---

### 2.3 BFC（块级格式化上下文）深度理解

**参考答案：**

**BFC 定义**：
BFC 是 CSS 渲染模型的一部分，是页面中一个独立的渲染区域，容器内的元素不会影响外部元素。

**触发 BFC 的方式**：
```css
/* 1. 根元素 */
html { }

/* 2. float 不为 none */
float: left | right;

/* 3. position 不为 static/relative */
position: absolute | fixed;

/* 4. display 为 inline-block、table-cell、flex、grid 等 */
display: inline-block | flex | grid | table-cell;

/* 5. overflow 不为 visible */
overflow: auto | hidden | scroll;

/* 6. fieldset 元素 */
```

**BFC 特性**：
1. 内部的 Box 垂直方向依次排列
2. Box 垂直方向的距离由 margin 决定，**同一 BFC 中相邻 Box 的 margin 会重叠**
3. BFC 区域不会与 float 元素重叠
4. 计算 BFC 高度时，浮动元素也参与计算

**应用场景**：

```css
/* 1. 清除浮动 */
.parent {
  overflow: hidden; /* 触发 BFC */
}

/* 2. 防止 margin 重叠 */
.box1, .box2 {
  margin-bottom: 20px;
}
.container {
  overflow: hidden; /* 创建独立 BFC，阻止 margin 重叠 */
}

/* 3. 自适应两栏布局 */
.left {
  float: left;
  width: 200px;
}
.right {
  overflow: hidden; /* 触发 BFC，不与 left 重叠 */
}
```

**BFC 深入理解与应用**：

```html
<!-- BFC 应用示例：防止 margin 重叠 -->
<style>
    .bfc-container {
        overflow: hidden; /* 创建新的 BFC */
    }

    .box {
        margin: 20px;
        padding: 20px;
        background: #f0f0f0;
    }
</style>

<div class="bfc-container">
    <div class="box">Box 1</div>
    <div class="box">Box 2</div>
</div>

<!-- BFC 应用示例：两栏自适应布局 -->
<style>
    .layout {
        overflow: hidden;
    }

    .sidebar {
        float: left;
        width: 200px;
        background: #f5f5f5;
    }

    .content {
        overflow: hidden; /* 触发 BFC，自适应剩余宽度 */
        background: #e0e0e0;
    }
</style>

<div class="layout">
    <div class="sidebar">侧边栏</div>
    <div class="content">主内容区</div>
</div>

<!-- BFC 应用示例：防止文字环绕 -->
<style>
    .float-box {
        float: left;
        width: 100px;
        height: 100px;
        background: #ff6b6b;
    }

    .text-box {
        overflow: hidden; /* 触发 BFC，防止文字环绕 */
    }
</style>

<div class="float-box"></div>
<div class="text-box">
    这是一段文字，不会环绕在浮动元素周围...
</div>
```

---

### 2.4 Flexbox 布局完全指南

**参考答案：**

```
┌─────────────────────────────────────────────────────────────────┐
│                      Flexbox 轴向系统                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                    主轴 (Main Axis)                             │
│                    ◀─────────────────▶                         │
│                                                                  │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐             │
│   │  Item   │ │  Item   │ │  Item   │ │  Item   │             │
│   └─────────┘ └─────────┘ └─────────┘ └─────────┘             │
│                                                                  │
│                    │                                            │
│                    │ 交叉轴 (Cross Axis)                        │
│                    │                                            │
│                    ▼                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**容器属性**：

| 属性 | 值 | 说明 |
| :--- | :--- | :--- |
| `display` | `flex` / `inline-flex` | 开启 Flex 布局 |
| `flex-direction` | `row` / `column` / `row-reverse` / `column-reverse` | 主轴方向 |
| `flex-wrap` | `nowrap` / `wrap` / `wrap-reverse` | 是否换行 |
| `justify-content` | `flex-start` / `flex-end` / `center` / `space-between` / `space-around` | 主轴对齐 |
| `align-items` | `stretch` / `flex-start` / `flex-end` / `center` / `baseline` | 交叉轴对齐（单行） |
| `align-content` | `stretch` / `flex-start` / `flex-end` / `center` / `space-between` / `space-around` | 交叉轴对齐（多行） |
| `gap` | `10px` / `1rem` | 项目间距 |

**项目属性**：

| 属性 | 说明 |
| :--- | :--- |
| `flex-grow` | 放大比例，默认 0 |
| `flex-shrink` | 缩小比例，默认 1 |
| `flex-basis` | 基础宽度，auto |
| `flex` | 简写：`flex-grow flex-shrink flex-basis` |
| `align-self` | 覆盖容器的 align-items |
| `order` | 排列顺序，数值越小越靠前 |

**flex 速记**：
- `flex: 1` = `flex: 1 1 0%`（等分剩余空间）
- `flex: auto` = `flex: 1 1 auto`
- `flex: none` = `flex: 0 0 auto`
- `flex: 0 auto` = `flex: 0 1 auto`

**Flexbox 详细示例**：

```css
/* 基础 Flex 布局 */
.flex-container {
    display: flex;
}

/* 行方向（默认） */
.flex-row {
    flex-direction: row;
}

/* 列方向 */
.flex-column {
    flex-direction: column;
}

/* 换行 */
.flex-wrap {
    flex-wrap: wrap;
}

/* 主轴对齐方式 */
.justify-start { justify-content: flex-start; }
.justify-end { justify-content: flex-end; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.justify-around { justify-content: space-around; }
.justify-evenly { justify-content: space-evenly; }

/* 交叉轴对齐方式 */
.align-stretch { align-items: stretch; }
.align-start { align-items: flex-start; }
.align-end { align-items: flex-end; }
.align-center { align-items: center; }
.align-baseline { align-items: baseline; }

/* 多行对齐（需要 flex-wrap: wrap） */
.align-content-start { align-content: flex-start; }
.align-content-end { align-content: flex-end; }
.align-content-center { align-content: center; }
.align-content-between { align-content: space-between; }
.align-content-around { align-content: space-around; }

/* 项目属性 */
.flex-grow { flex-grow: 1; }
.flex-shrink-0 { flex-shrink: 0; }
.flex-basis-auto { flex-basis: auto; }
.flex-basis-100 { flex-basis: 100%; }
.flex-1 { flex: 1; }
.flex-auto { flex: auto; }
.flex-none { flex: none; }
.order-first { order: -1; }
.order-last { order: 999; }
.align-self-start { align-self: flex-start; }
.align-self-end { align-self: flex-end; }
.align-self-center { align-self: center; }
.align-self-stretch { align-self: stretch; }
```

**Flexbox 实战布局**：

```html
<!-- 导航栏 -->
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

    .navbar-logo {
        font-size: 20px;
        font-weight: bold;
    }

    .navbar-menu {
        display: flex;
        gap: 20px;
        list-style: none;
        margin: 0;
        padding: 0;
    }

    .navbar-menu a {
        color: white;
        text-decoration: none;
    }

    .navbar-actions {
        display: flex;
        gap: 10px;
    }
</style>

<nav class="navbar">
    <div class="navbar-logo">Logo</div>
    <ul class="navbar-menu">
        <li><a href="#">首页</a></li>
        <li><a href="#">产品</a></li>
        <li><a href="#">关于</a></li>
    </ul>
    <div class="navbar-actions">
        <button>登录</button>
        <button>注册</button>
    </div>
</nav>

<!-- 卡片网格 -->
<style>
    .card-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
    }

    .card {
        flex: 1 1 300px;
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 8px;
    }

    .card-image {
        width: 100%;
        height: 200px;
        object-fit: cover;
    }

    .card-content {
        padding: 15px 0;
    }
</style>

<div class="card-grid">
    <div class="card">
        <img src="image.jpg" class="card-image" alt="">
        <div class="card-content">
            <h3>卡片标题</h3>
            <p>卡片内容...</p>
        </div>
    </div>
    <!-- 更多卡片... -->
</div>

<!-- 水平垂直居中 -->
<style>
    .center-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
    }
</style>

<div class="center-container">
    <div class="content">居中内容</div>
</div>

<!-- 等高列布局 -->
<style>
    .equal-height {
        display: flex;
    }

    .equal-height > .column {
        flex: 1;
        padding: 20px;
    }
</style>

<div class="equal-height">
    <div class="column" style="background: #f5f5f5;">
        <p>列1内容较多...</p>
        <p>更多内容...</p>
    </div>
    <div class="column" style="background: #e0e0e0;">
        <p>列2内容</p>
    </div>
</div>
```

---

### 2.5 Grid 布局完全指南

**参考答案：**

```
┌─────────────────────────────────────────────────────────────────┐
│                      Grid 网格系统                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│         ┌─────────┬─────────┬─────────┐                         │
│         │  Area 1 │  Area 2 │  Area 3 │  ← row 1                │
│         │ (1,1)   │ (1,2)   │ (1,3)   │                         │
│         ├─────────┼─────────┼─────────┤                         │
│         │  Area 4 │  Area 5 │  Area 6 │  ← row 2                │
│         │ (2,1)   │ (2,2)   │ (2,3)   │                         │
│         └─────────┴─────────┴─────────┘                         │
│            ↑          ↑          ↑                             │
│          col 1      col 2      col 3                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**容器属性**：

```css
.container {
  /* 定义行列 */
  grid-template-columns: 100px 1fr 2fr;  /* 3 列：固定 + 自适应 + 2倍 */
  grid-template-rows: 50px auto 100px;  /* 3 行 */

  /* 命名区域 */
  grid-template-areas:
    "header header header"
    "sidebar main aside"
    "footer footer footer";

  /* 简写 */
  gap: 20px;        /* grid-gap */
  row-gap: 10px;
  column-gap: 20px;

  /* 对齐 */
  justify-items: start | end | center | stretch;
  align-items: start | end | center | stretch;
  place-items: center center;  /* 简写 */

  /* 整网格对齐 */
  justify-content: start | end | center | stretch | space-between | space-around | space-evenly;
  align-content: start | end | center | stretch | space-between | space-around | space-evenly;
}
```

**项目属性**：

```css
.item {
  /* 定位 */
  grid-column: 1 / 3;    /* 跨 2 列 */
  grid-row: 1 / 2;       /* 跨 1 行 */
  grid-area: header;     /* 命名区域 */

  /* 简写 */
  grid-column: span 2;   /* 跨 2 列 */

  /* 对齐（覆盖容器） */
  justify-self: start | end | center | stretch;
  align-self: start | end | center | stretch;
}
```

**fr 单位**：
- `1fr` = 1 份可用空间
- `repeat(3, 1fr)` = 3 等分
- `repeat(auto-fill, 100px)` = 自动填充列
- `minmax(100px, 1fr)` = 最小 100px，最大等分

**Grid 布局详细示例**：

```css
/* 基础网格 */
.basic-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
}

/* 自适应网格 */
.auto-fit-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
}

/* 固定列数和行数 */
.fixed-grid {
    display: grid;
    grid-template-columns: 100px 200px 100px;
    grid-template-rows: 50px 200px;
    gap: 10px;
}

/* 命名网格线 */
.named-lines {
    display: grid;
    grid-template-columns: [start] 100px [main-start] 1fr [main-end] 100px [end];
    grid-template-rows: [top] 50px [content] auto [bottom];
}

/* 命名区域 */
.template-areas {
    display: grid;
    grid-template-areas:
        "header header header"
        "nav main aside"
        "footer footer footer";
    grid-template-columns: 200px 1fr 200px;
    grid-template-rows: 60px 1fr 60px;
    min-height: 100vh;
}

.header { grid-area: header; }
.nav { grid-area: nav; }
.main { grid-area: main; }
.aside { grid-area: aside; }
.footer { grid-area: footer; }
```

**Grid 实战布局**：

```html
<!-- 经典布局 -->
<style>
    .page-layout {
        display: grid;
        grid-template-columns: 250px 1fr;
        grid-template-rows: 60px 1fr 60px;
        grid-template-areas:
            "header header"
            "sidebar main"
            "footer footer";
        min-height: 100vh;
    }

    .page-header {
        grid-area: header;
        background: #333;
        color: white;
    }

    .page-sidebar {
        grid-area: sidebar;
        background: #f5f5f5;
    }

    .page-main {
        grid-area: main;
        padding: 20px;
    }

    .page-footer {
        grid-area: footer;
        background: #333;
        color: white;
    }

    /* 响应式 */
    @media (max-width: 768px) {
        .page-layout {
            grid-template-columns: 1fr;
            grid-template-rows: 60px auto 1fr 60px;
            grid-template-areas:
                "header"
                "sidebar"
                "main"
                "footer";
        }
    }
</style>

<div class="page-layout">
    <header class="page-header">头部</header>
    <aside class="page-sidebar">侧边栏</aside>
    <main class="page-main">主内容</main>
    <footer class="page-footer">底部</footer>
</div>

<!-- 相册网格 -->
<style>
    .gallery {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 10px;
        padding: 10px;
    }

    .gallery-item {
        aspect-ratio: 1;
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
</style>

<div class="gallery">
    <div class="gallery-item"><img src="photo1.jpg" alt=""></div>
    <div class="gallery-item"><img src="photo2.jpg" alt=""></div>
    <div class="gallery-item"><img src="photo3.jpg" alt=""></div>
    <!-- 更多图片... -->
</div>

<!-- 仪表盘布局 -->
<style>
    .dashboard {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        grid-template-rows: auto auto 1fr;
        gap: 20px;
        padding: 20px;
    }

    .stat-card {
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .chart-large {
        grid-column: span 2;
        grid-row: span 2;
    }

    .chart-wide {
        grid-column: span 2;
    }
</style>

<div class="dashboard">
    <div class="stat-card">统计1</div>
    <div class="stat-card">统计2</div>
    <div class="stat-card">统计3</div>
    <div class="stat-card">统计4</div>
    <div class="stat-card chart-large">大图表</div>
    <div class="stat-card">数据5</div>
    <div class="stat-card chart-wide">宽图表</div>
</div>
```

---

## 三、布局实战详解

### 3.1 两栏布局

**参考答案：**

两栏布局是 Web 开发中最常见的布局形式之一，通常由一个侧边栏和一个主内容区组成。

#### 3.1.1 浮动 + margin 实现

```html
<style>
    .layout-float {
        overflow: hidden; /* 触发 BFC */
    }

    .sidebar {
        float: left;
        width: 200px;
        background: #f5f5f5;
    }

    .content {
        margin-left: 200px;
        background: #e0e0e0;
    }
</style>

<div class="layout-float">
    <div class="sidebar">侧边栏</div>
    <div class="content">主内容</div>
</div>
```

#### 3.1.2 浮动 + BFC 实现

```html
<style>
    .layout-bfc {
        overflow: hidden;
    }

    .sidebar {
        float: left;
        width: 200px;
    }

    .content {
        overflow: hidden; /* 触发 BFC */
    }
</style>

<div class="layout-bfc">
    <div class="sidebar">侧边栏</div>
    <div class="content">主内容</div>
</div>
```

#### 3.1.3 Flexbox 实现

```html
<style>
    .layout-flex {
        display: flex;
    }

    .sidebar {
        width: 200px;
        flex-shrink: 0;
    }

    .content {
        flex: 1;
    }
</style>

<div class="layout-flex">
    <div class="sidebar">侧边栏</div>
    <div class="content">主内容</div>
</div>
```

#### 3.1.4 Grid 实现

```html
<style>
    .layout-grid {
        display: grid;
        grid-template-columns: 200px 1fr;
    }
</style>

<div class="layout-grid">
    <div class="sidebar">侧边栏</div>
    <div class="content">主内容</div>
</div>
```

#### 3.1.5 Grid 响应式两栏

```html
<style>
    .layout-responsive {
        display: grid;
        grid-template-columns: 200px 1fr;
        gap: 20px;
    }

    @media (max-width: 768px) {
        .layout-responsive {
            grid-template-columns: 1fr;
        }
    }
</style>

<div class="layout-responsive">
    <div class="sidebar">侧边栏</div>
    <div class="content">主内容</div>
</div>
```

---

### 3.2 三栏布局

**参考答案：**

三栏布局通常包含左 sidebar、主内容和右 sidebar。

#### 3.2.1 浮动实现

```html
<style>
    .layout-3col-float {
        overflow: hidden;
    }

    .left, .right {
        float: left;
        width: 200px;
    }

    .right {
        float: right;
    }

    .main {
        margin-left: 200px;
        margin-right: 200px;
    }
</style>

<div class="layout-3col-float">
    <div class="left">左栏</div>
    <div class="right">右栏</div>
    <div class="main">主内容</div>
</div>
```

#### 3.2.2 Flexbox 实现

```html
<style>
    .layout-3col-flex {
        display: flex;
    }

    .left, .right {
        width: 200px;
        flex-shrink: 0;
    }

    .main {
        flex: 1;
    }
</style>

<div class="layout-3col-flex">
    <div class="left">左栏</div>
    <div class="main">主内容</div>
    <div class="right">右栏</div>
</div>
```

#### 3.2.3 Grid 实现

```html
<style>
    .layout-3col-grid {
        display: grid;
        grid-template-columns: 200px 1fr 200px;
    }
</style>

<div class="layout-3col-grid">
    <div class="left">左栏</div>
    <div class="main">主内容</div>
    <div class="right">右栏</div>
</div>
```

---

### 3.3 圣杯布局

**参考答案：**

圣杯布局（Holy Grail Layout）是一种经典的三栏布局，左 sidebar 和右 sidebar 固定宽度，中间主内容自适应。特点是在 HTML 结构中主内容在最前面。

```html
<style>
    .holy-grail {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
    }

    .holy-grail header {
        background: #333;
        color: white;
        padding: 20px;
    }

    .holy-grail body {
        display: flex;
        flex: 1;
    }

    .holy-grail .left {
        width: 200px;
        background: #f5f5f5;
    }

    .holy-grail .main {
        flex: 1;
        background: white;
    }

    .holy-grail .right {
        width: 200px;
        background: #f5f5f5;
    }

    .holy-grail footer {
        background: #333;
        color: white;
        padding: 20px;
    }

    /* 响应式 */
    @media (max-width: 768px) {
        .holy-grail body {
            flex-direction: column;
        }

        .holy-grail .left,
        .holy-grail .right {
            width: 100%;
        }
    }
</style>

<div class="holy-grail">
    <header>头部</header>
    <body>
        <main class="main">主内容</main>
        <aside class="left">左栏</aside>
        <aside class="right">右栏</aside>
    </body>
    <footer>底部</footer>
</div>
```

**圣杯布局（双飞翼方案）**：

```html
<style>
    /* 圣杯布局 - 使用 float */
    .holy-grail-float {
        padding: 0 200px;
        overflow: hidden;
    }

    .holy-grail-float .left {
        float: left;
        width: 200px;
        margin-left: -200px;
        position: relative;
        left: -200px;
    }

    .holy-grail-float .right {
        float: right;
        width: 200px;
        margin-right: -200px;
    }

    .holy-grail-float .main {
        float: left;
        width: 100%;
    }

    /* 响应式 */
    @media (max-width: 768px) {
        .holy-grail-float {
            padding: 0;
        }

        .holy-grail-float .left,
        .holy-grail-float .right,
        .holy-grail-float .main {
            float: none;
            width: 100%;
            margin: 0;
            position: static;
        }
    }
</style>

<div class="holy-grail-float">
    <div class="main">主内容区域</div>
    <div class="left">左侧边栏</div>
    <div class="right">右侧边栏</div>
</div>
```

---

### 3.4 双飞翼布局

**参考答案：**

双飞翼布局是淘宝UED提出的优化版圣杯布局，通过在主内容内部再添加一层来避免 center 区域的 min-width 问题。

```html
<style>
    /* 双飞翼布局 */
    .double-wing {
        overflow: hidden;
    }

    .double-wing .main {
        float: left;
        width: 100%;
    }

    .double-wing .main-inner {
        margin: 0 200px;
        min-height: 100px;
    }

    .double-wing .left {
        float: left;
        width: 200px;
        margin-left: -100%;
    }

    .double-wing .right {
        float: right;
        width: 200px;
        margin-left: -200px;
    }

    /* 响应式 */
    @media (max-width: 768px) {
        .double-wing .main-inner {
            margin: 0;
        }

        .double-wing .left,
        .double-wing .right {
            display: none;
        }
    }
</style>

<div class="double-wing">
    <div class="main">
        <div class="main-inner">
            主内容区域
        </div>
    </div>
    <div class="left">左侧边栏</div>
    <div class="right">右侧边栏</div>
</div>
```

**双飞翼布局完整示例**：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>双飞翼布局</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            min-width: 600px;
        }

        /* 头部和底部 */
        header, footer {
            background: #333;
            color: white;
            padding: 20px;
            text-align: center;
        }

        /* 双飞翼容器 */
        .double-wing-container {
            overflow: hidden;
            padding-bottom: 9999px;
            margin-bottom: -9999px;
        }

        /* 中间主体 */
        .main {
            float: left;
            width: 100%;
        }

        .main-content {
            margin: 0 200px;
            background: #fff;
            min-height: 400px;
            padding: 20px;
        }

        /* 左侧 */
        .left {
            float: left;
            width: 200px;
            margin-left: -100%;
            background: #f5f5f5;
            padding: 20px;
            min-height: 400px;
        }

        /* 右侧 */
        .right {
            float: right;
            width: 200px;
            margin-left: -200px;
            background: #f5f5f5;
            padding: 20px;
            min-height: 400px;
        }

        /* 响应式适配 */
        @media (max-width: 768px) {
            .main-content {
                margin: 0;
            }

            .left, .right {
                display: none;
            }
        }
    </style>
</head>
<body>
    <header>
        <h1>双飞翼布局示例</h1>
    </header>

    <div class="double-wing-container">
        <!-- 主体放最前面 -->
        <div class="main">
            <div class="main-content">
                <h2>主内容区域</h2>
                <p>双飞翼布局的核心思想：</p>
                <ul>
                    <li>主体内容在前渲染</li>
                    <li>左右侧边栏利用负 margin 定位</li>
                    <li>主内容区域内部用 margin 留出侧边栏空间</li>
                </ul>
            </div>
        </div>

        <!-- 左侧 -->
        <aside class="left">
            <h3>左侧边栏</h3>
            <ul>
                <li>导航项 1</li>
                <li>导航项 2</li>
                <li>导航项 3</li>
            </ul>
        </aside>

        <!-- 右侧 -->
        <aside class="right">
            <h3>右侧边栏</h3>
            <p>相关内容...</p>
        </aside>
    </div>

    <footer>
        <p>&copy; 2024 双飞翼布局示例</p>
    </footer>
</body>
</html>
```

---

### 3.5 等高布局

**参考答案：**

等高布局是指多列高度相等的布局效果。

#### 3.5.1 Flexbox 等高布局

```html
<style>
    .equal-height-flex {
        display: flex;
    }

    .equal-height-flex > div {
        flex: 1;
        padding: 20px;
    }

    .col-1 { background: #ffcccc; }
    .col-2 { background: #ccffcc; }
    .col-3 { background: #ccccff; }
</style>

<div class="equal-height-flex">
    <div class="col-1">
        <p>列1 - 内容较少</p>
    </div>
    <div class="col-2">
        <p>列2 - 内容较多</p>
        <p>更多内容...</p>
        <p>更多内容...</p>
    </div>
    <div class="col-3">
        <p>列3 - 内容中等</p>
        <p>更多内容...</p>
    </div>
</div>
```

#### 3.5.2 Grid 等高布局

```html
<style>
    .equal-height-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
    }

    .equal-height-grid > div {
        padding: 20px;
    }
</style>

<div class="equal-height-grid">
    <div style="background: #ffcccc;">列1</div>
    <div style="background: #ccffcc;">列2 - 更多内容</div>
    <div style="background: #ccccff;">列3</div>
</div>
```

#### 3.5.3 伪元素实现等高

```html
<style>
    .equal-height-pseudo {
        overflow: hidden;
    }

    .equal-height-pseudo .col {
        float: left;
        width: 33.33%;
        padding-bottom: 9999px;
        margin-bottom: -9999px;
    }

    .equal-height-pseudo .col-1 { background: #ffcccc; }
    .equal-height-pseudo .col-2 { background: #ccffcc; }
    .equal-height-pseudo .col-3 { background: #ccccff; }
</style>

<div class="equal-height-pseudo">
    <div class="col col-1">列1</div>
    <div class="col col-2">列2 - 更多内容</div>
    <div class="col col-3">列3</div>
</div>
```

---

### 3.6 瀑布流布局

**参考答案：**

瀑布流布局是一种错落有致的布局方式，常用于图片展示。

```html
<style>
    .waterfall {
        column-count: 3;
        column-gap: 20px;
    }

    .waterfall-item {
        break-inside: avoid;
        margin-bottom: 20px;
    }

    .waterfall-item img {
        width: 100%;
        display: block;
    }

    /* 响应式 */
    @media (max-width: 992px) {
        .waterfall {
            column-count: 2;
        }
    }

    @media (max-width: 576px) {
        .waterfall {
            column-count: 1;
        }
    }
</style>

<div class="waterfall">
    <div class="waterfall-item">
        <img src="photo1.jpg" alt="">
    </div>
    <div class="waterfall-item">
        <img src="photo2.jpg" alt="">
    </div>
    <!-- 更多项 -->
</div>
```

---

### 3.7 Sticky Footer 布局

**参考答案：**

当页面内容不足一屏时，让 footer 固定在底部。

```html
<style>
    /* Flexbox 方案 */
    .sticky-footer-flex {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
    }

    .sticky-footer-flex main {
        flex: 1;
    }

    .sticky-footer-flex footer {
        background: #333;
        color: white;
        padding: 20px;
    }

    /* Grid 方案 */
    .sticky-footer-grid {
        display: grid;
        grid-template-rows: auto 1fr auto;
        min-height: 100vh;
    }

    .sticky-footer-grid footer {
        background: #333;
        color: white;
        padding: 20px;
    }
</style>

<!-- Flexbox 方案 -->
<div class="sticky-footer-flex">
    <header>头部</header>
    <main>主内容</main>
    <footer>底部</footer>
</div>
```

---

### 3.8 栅格系统实现

**参考答案：**

```css
/* 12 栅格系统 */
.row {
    display: flex;
    flex-wrap: wrap;
    margin-left: -15px;
    margin-right: -15px;
}

.col-1, .col-2, .col-3, .col-4, .col-5, .col-6,
.col-7, .col-8, .col-9, .col-10, .col-11, .col-12 {
    padding-left: 15px;
    padding-right: 15px;
}

.col-1 { width: 8.333333%; }
.col-2 { width: 16.666667%; }
.col-3 { width: 25%; }
.col-4 { width: 33.333333%; }
.col-5 { width: 41.666667%; }
.col-6 { width: 50%; }
.col-7 { width: 58.333333%; }
.col-8 { width: 66.666667%; }
.col-9 { width: 75%; }
.col-10 { width: 83.333333%; }
.col-11 { width: 91.666667%; }
.col-12 { width: 100%; }

/* 响应式 */
@media (max-width: 768px) {
    .col-1, .col-2, .col-3, .col-4, .col-5, .col-6,
    .col-7, .col-8, .col-9, .col-10, .col-11, .col-12 {
        width: 100%;
    }
}
```

---

## 四、CSS 动画深入

### 4.1 CSS 过渡（Transition）

**参考答案：**

```css
/* 基础过渡 */
.transition-basic {
    transition: property duration timing-function delay;
}

/* 常用过渡 */
.transition-color {
    transition: color 0.3s ease;
}

.transition-all {
    transition: all 0.3s ease-in-out;
}

/* 多属性过渡 */
.transition-multiple {
    transition:
        transform 0.3s ease,
        opacity 0.3s ease,
        background-color 0.3s ease;
}

/* 贝塞尔曲线 */
.transition-custom {
    transition: transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

**过渡示例**：

```html
<style>
    .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        background: #007bff;
        color: white;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }

    .btn:active {
        transform: translateY(0);
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    /* 卡片悬停效果 */
    .card {
        transition: transform 0.3s, box-shadow 0.3s;
    }

    .card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 20px rgba(0,0,0,0.15);
    }

    /* 菜单动画 */
    .menu-item {
        opacity: 0;
        transform: translateX(-20px);
        transition: opacity 0.3s, transform 0.3s;
    }

    .menu-item.visible {
        opacity: 1;
        transform: translateX(0);
    }

    /* 列表项依次出现 */
    .list-item {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.5s ease, transform 0.5s ease;
    }

    .list-item:nth-child(1) { transition-delay: 0.1s; }
    .list-item:nth-child(2) { transition-delay: 0.2s; }
    .list-item:nth-child(3) { transition-delay: 0.3s; }
    .list-item:nth-child(4) { transition-delay: 0.4s; }
    .list-item:nth-child(5) { transition-delay: 0.5s; }
</style>

<button class="btn">悬停按钮</button>

<div class="card" style="padding: 20px; background: #f5f5f5;">
    悬停卡片
</div>
```

---

### 4.2 CSS 动画（Animation）

**参考答案：**

```css
/* 定义动画 */
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

@keyframes pulse {
    0%, 100% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.05);
    }
}

/* 使用动画 */
.animated-element {
    animation: fadeIn 0.5s ease forwards;
}

.pulse-element {
    animation: pulse 2s infinite;
}

/* 动画属性 */
.animation-props {
    animation-name: fadeIn;
    animation-duration: 0.5s;
    animation-timing-function: ease;
    animation-delay: 0.2s;
    animation-iteration-count: 3;
    animation-direction: normal;
    animation-fill-mode: forwards;
    animation-play-state: running;
}
```

**动画示例**：

```html
<style>
    /* 淡入效果 */
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    .fade-in {
        animation: fadeIn 0.5s ease-out;
    }

    /* 淡入上移 */
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .fade-in-up {
        animation: fadeInUp 0.6s ease-out;
    }

    /* 缩放效果 */
    @keyframes zoomIn {
        from {
            opacity: 0;
            transform: scale(0.8);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }

    .zoom-in {
        animation: zoomIn 0.4s ease-out;
    }

    /* 旋转效果 */
    @keyframes rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    .rotate {
        animation: rotate 1s linear infinite;
    }

    /* loading 动画 */
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    /* 呼吸效果 */
    @keyframes breathe {
        0%, 100% {
            box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.4);
        }
        50% {
            box-shadow: 0 0 0 15px rgba(0, 123, 255, 0);
        }
    }

    .breathe {
        animation: breathe 2s ease-in-out infinite;
    }

    /* 闪烁效果 */
    @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
    }

    .blink {
        animation: blink 1s ease-in-out infinite;
    }

    /* 移动效果 */
    @keyframes slideLeftRight {
        0%, 100% { transform: translateX(0); }
        50% { transform: translateX(20px); }
    }

    .slide {
        animation: slideLeftRight 2s ease-in-out infinite;
    }
</style>

<div class="fade-in">淡入效果</div>
<div class="fade-in-up">淡入上移</div>
<div class="zoom-in">缩放效果</div>
<div class="rotate">旋转</div>
<div class="spinner">加载中...</div>
<div class="breathe" style="width: 50px; height: 50px; background: #007bff; border-radius: 50%;"></div>
<div class="blink">闪烁文字</div>
<div class="slide">左右移动</div>
```

---

### 4.3 CSS 变换（Transform）

**参考答案：**

```css
/* 2D 变换 */
.transform-2d {
    /* 平移 */
    transform: translate(x, y);
    transform: translateX(100px);
    transform: translateY(100px);

    /* 缩放 */
    transform: scale(x, y);
    transform: scaleX(2);
    transform: scaleY(2);

    /* 旋转 */
    transform: rotate(deg);
    transform: rotateX(deg);
    transform: rotateY(deg);
    transform: rotateZ(deg);

    /* 倾斜 */
    transform: skew(x, y);
    transform: skewX(deg);
    transform: skewY(deg);

    /* 组合变换 */
    transform: translate(100px, 100px) rotate(45deg) scale(1.5);
}

/* 3D 变换 */
.transform-3d {
    /* 3D 平移 */
    transform: translate3d(x, y, z);
    transform: translateZ(100px);

    /* 3D 缩放 */
    transform: scale3d(x, y, z);
    transform: scaleZ(2);

    /* 3D 旋转 */
    transform: rotateX(45deg);
    transform: rotateY(45deg);
    transform: rotateZ(45deg);
    transform: rotate3d(x, y, z, angle);

    /* 3D 透视 */
    perspective: 1000px;
    transform: perspective(1000px) rotateX(45deg);

    /* 保留 3D 空间 */
    transform-style: preserve-3d;
    transform: rotateY(180deg);
}

/* 变换原点 */
.transform-origin {
    transform-origin: center center;      /* 默认 */
    transform-origin: top left;
    transform-origin: 50% 50%;
    transform-origin: 100px 100px;
}

/* 透视 */
.perspective {
    perspective: 1000px;
}

.perspective .cube {
    transform-style: preserve-3d;
    transform: rotateX(30deg) rotateY(30deg);
}
```

**Transform 示例**：

```html
<style>
    /* 卡片翻转效果 */
    .flip-container {
        perspective: 1000px;
    }

    .flip-card {
        width: 200px;
        height: 300px;
        position: relative;
        transform-style: preserve-3d;
        transition: transform 0.6s;
    }

    .flip-container:hover .flip-card {
        transform: rotateY(180deg);
    }

    .flip-front, .flip-back {
        position: absolute;
        width: 100%;
        height: 100%;
        backface-visibility: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .flip-front {
        background: #007bff;
        color: white;
    }

    .flip-back {
        background: #28a745;
        color: white;
        transform: rotateY(180deg);
    }

    /* 3D 立方体 */
    .cube-container {
        perspective: 600px;
    }

    .cube {
        width: 100px;
        height: 100px;
        position: relative;
        transform-style: preserve-3d;
        transform: rotateX(-30deg) rotateY(45deg);
        animation: rotateCube 4s infinite linear;
    }

    .cube-face {
        position: absolute;
        width: 100px;
        height: 100px;
        border: 2px solid #333;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
    }

    .cube-face-front  { transform: translateZ(50px); background: rgba(255,0,0,0.5); }
    .cube-face-back   { transform: rotateY(180deg) translateZ(50px); background: rgba(0,255,0,0.5); }
    .cube-face-right  { transform: rotateY(90deg) translateZ(50px); background: rgba(0,0,255,0.5); }
    .cube-face-left   { transform: rotateY(-90deg) translateZ(50px); background: rgba(255,255,0,0.5); }
    .cube-face-top    { transform: rotateX(90deg) translateZ(50px); background: rgba(0,255,255,0.5); }
    .cube-face-bottom { transform: rotateX(-90deg) translateZ(50px); background: rgba(255,0,255,0.5); }

    @keyframes rotateCube {
        from { transform: rotateX(-30deg) rotateY(0deg); }
        to { transform: rotateX(-30deg) rotateY(360deg); }
    }
</style>

<!-- 翻转卡片 -->
<div class="flip-container">
    <div class="flip-card">
        <div class="flip-front">正面</div>
        <div class="flip-back">背面</div>
    </div>
</div>

<!-- 3D 立方体 -->
<div class="cube-container">
    <div class="cube">
        <div class="cube-face cube-face-front">前</div>
        <div class="cube-face cube-face-back">后</div>
        <div class="cube-face cube-face-right">右</div>
        <div class="cube-face cube-face-left">左</div>
        <div class="cube-face cube-face-top">上</div>
        <div class="cube-face cube-face-bottom">下</div>
    </div>
</div>
```

---

### 4.4 动画性能优化

**参考答案：**

```css
/* 高性能动画 */
.perfect-animation {
    /* 最佳：使用 transform 和 opacity */
    transform: translateX(100px);
    opacity: 0.5;
}

/* 提示浏览器优化 */
.will-change {
    will-change: transform, opacity;
}

/* 启用 GPU 加速 */
.gpu-acceleration {
    transform: translateZ(0);
    backface-visibility: hidden;
}

/* 避免的性能问题 */
.poor-performance {
    /* 这些属性会触发重排/重绘 */
    width: 100px;          /* 重排 */
    height: 100px;         /* 重排 */
    padding: 10px;         /* 重排 */
    margin: 10px;          /* 重排 */
    left: 100px;           /* 重排 */
    top: 100px;            /* 重排 */
    background-color: red; /* 重绘 */
    color: blue;           /* 重绘 */
    border-color: green;   /* 重绘 */
}
```



---

## 五、HTML5 深度应用

### 5.1 HTML5 语义化标签实际应用案例

**参考答案：**

语义化标签是HTML5最重要的改进之一，它使文档结构更加清晰，对SEO和无障碍访问有重要意义。

**语义化标签结构示例：**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>语义化标签实践案例</title>
</head>
<body>
    <!-- 页面头部 -->
    <header>
        <div class="logo">
            <h1>网站标题</h1>
        </div>
        <nav>
            <ul>
                <li><a href="/">首页</a></li>
                <li><a href="/about">关于我们</a></li>
                <li><a href="/products">产品中心</a></li>
                <li><a href="/contact">联系我们</a></li>
            </ul>
        </nav>
    </header>

    <!-- 主内容区域 -->
    <main>
        <!-- 独立文章区块 -->
        <article>
            <header>
                <h2>文章标题</h2>
                <div class="meta">
                    <time datetime="2024-01-15">2024年1月15日</time>
                    <span class="author">作者：张三</span>
                    <span class="category">分类：<a href="/category/tech">技术</a></span>
                </div>
            </header>

            <section>
                <h3>第一章</h3>
                <p>这里是文章正文内容...</p>
            </section>

            <section>
                <h3>第二章</h3>
                <p>更多详细内容...</p>
            </section>

            <footer>
                <p>本文标签：<tag>HTML5</tag> <tag>语义化</tag></p>
            </footer>
        </article>

        <!-- 侧边栏内容 -->
        <aside>
            <section class="related-articles">
                <h3>相关文章</h3>
                <ul>
                    <li><a href="#">相关文章1</a></li>
                    <li><a href="#">相关文章2</a></li>
                </ul>
            </section>

            <section class="advertisement">
                <h3>广告</h3>
                <p>广告内容...</p>
            </section>
        </aside>
    </main>

    <!-- 页面底部 -->
    <footer>
        <div class="footer-content">
            <section>
                <h4>关于公司</h4>
                <p>公司介绍...</p>
            </section>
            <section>
                <h4>快速链接</h4>
                <ul>
                    <li><a href="#">隐私政策</a></li>
                    <li><a href="#">服务条款</a></li>
                </ul>
            </section>
            <section>
                <h4>联系方式</h4>
                <address>
                    <p>邮箱：info@example.com</p>
                    <p>电话：400-888-8888</p>
                </address>
            </section>
        </div>
        <div class="copyright">
            <p>&copy; 2024 公司名称. 保留所有权利。</p>
        </div>
    </footer>
</body>
</html>
```

**语义化标签样式：**

```css
/* 基础布局 */
body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    line-height: 1.6;
}

/* Header 样式 */
header {
    background: #2c3e50;
    color: white;
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

header nav ul {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
}

header nav ul li {
    margin-left: 20px;
}

header nav ul li a {
    color: white;
    text-decoration: none;
    transition: color 0.3s;
}

header nav ul li a:hover {
    color: #3498db;
}

/* Main 布局 */
main {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 2rem;
    max-width: 1200px;
    margin: 2rem auto;
    padding: 0 2rem;
}

/* Article 样式 */
article {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

article header {
    background: none;
    padding: 0;
    color: inherit;
    margin-bottom: 1.5rem;
}

article h2 {
    margin: 0 0 0.5rem 0;
    color: #2c3e50;
}

article .meta {
    color: #7f8c8d;
    font-size: 0.9rem;
}

article .meta time,
article .meta .author,
article .meta .category {
    margin-right: 15px;
}

article section {
    margin-bottom: 2rem;
}

article section h3 {
    color: #34495e;
    border-bottom: 2px solid #3498db;
    padding-bottom: 0.5rem;
}

article footer {
    border-top: 1px solid #ecf0f1;
    padding-top: 1rem;
    margin-top: 2rem;
}

/* Aside 样式 */
aside {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

aside section {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

aside h3 {
    margin-top: 0;
    color: #2c3e50;
    border-bottom: 2px solid #3498db;
    padding-bottom: 0.5rem;
}

aside ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

aside ul li {
    padding: 0.5rem 0;
    border-bottom: 1px solid #ecf0f1;
}

aside ul li:last-child {
    border-bottom: none;
}

aside a {
    color: #3498db;
    text-decoration: none;
}

aside a:hover {
    text-decoration: underline;
}

/* Footer 样式 */
footer {
    background: #34495e;
    color: white;
    padding: 2rem;
    margin-top: 3rem;
}

footer .footer-content {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

footer h4 {
    margin-top: 0;
    border-bottom: 2px solid #3498db;
    padding-bottom: 0.5rem;
}

footer ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

footer ul li {
    padding: 0.3rem 0;
}

footer a {
    color: #ecf0f1;
    text-decoration: none;
}

footer a:hover {
    color: #3498db;
}

footer address {
    font-style: normal;
}

footer .copyright {
    text-align: center;
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid #5d6d7e;
}

/* 响应式布局 */
@media (max-width: 768px) {
    main {
        grid-template-columns: 1fr;
    }

    footer .footer-content {
        grid-template-columns: 1fr;
    }

    header {
        flex-direction: column;
        gap: 1rem;
    }

    header nav ul {
        flex-wrap: wrap;
        justify-content: center;
    }

    header nav ul li {
        margin: 0.5rem;
    }
}
```

**语义化标签使用原则：**

| 标签 | 用途 | 注意事项 |
|------|------|----------|
| `<header>` | 页面或区块的头部 | 可以有多个，一个页面可以有多个header |
| `<nav>` | 导航链接区域 | 用于主导航，页面级导航 |
| `<main>` | 页面主内容 | 每个页面只能有一个 |
| `<article>` | 独立完整的内容 | 如博客文章、新闻报道 |
| `<section>` | 文档中的一个区块 | 通常配合标题使用 |
| `<aside>` | 侧边栏相关内容 | 与主内容相关但可独立 |
| `<footer>` | 页面或区块的底部 | 可以有多个 |
| `<time>` | 时间日期 | 配合datetime属性使用 |
| `<address>` | 联系信息 | 用于作者或公司的联系方式 |

---

### 5.2 HTML5 表单深入详解

**参考答案：**

HTML5对表单进行了重大增强，提供了丰富的输入类型、验证功能和API。

**完整的表单示例：**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML5 表单详解</title>
    <style>
        * {
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }

        .form-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        h2 {
            margin-top: 0;
            color: #333;
            border-bottom: 2px solid #007bff;
            padding-bottom: 10px;
        }

        .form-section {
            margin-bottom: 30px;
            padding: 20px;
            background: #fafafa;
            border-radius: 6px;
        }

        .form-section h3 {
            margin-top: 0;
            color: #555;
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: #333;
        }

        .form-group label .required {
            color: red;
        }

        .form-group .help-text {
            font-size: 12px;
            color: #666;
            margin-top: 4px;
        }

        input[type="text"],
        input[type="email"],
        input[type="tel"],
        input[type="url"],
        input[type="password"],
        input[type="number"],
        input[type="search"],
        input[type="date"],
        input[type="time"],
        input[type="datetime-local"],
        input[type="color"],
        textarea,
        select {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            transition: border-color 0.3s, box-shadow 0.3s;
        }

        input:focus,
        textarea:focus,
        select:focus {
            outline: none;
            border-color: #007bff;
            box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
        }

        input:invalid {
            border-color: #dc3545;
        }

        input:valid {
            border-color: #28a745;
        }

        /* 浏览器原生验证提示样式 */
        input:required:invalid {
            border-color: #dc3545;
        }

        input:required:valid {
            border-color: #28a745;
        }

        /* 复选框和单选框自定义样式 */
        .checkbox-group,
        .radio-group {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .checkbox-item,
        .radio-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        input[type="checkbox"],
        input[type="radio"] {
            width: 18px;
            height: 18px;
            cursor: pointer;
        }

        /* 范围选择器样式 */
        input[type="range"] {
            width: 100%;
            height: 8px;
            background: #ddd;
            border-radius: 4px;
            outline: none;
            -webkit-appearance: none;
        }

        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 20px;
            height: 20px;
            background: #007bff;
            border-radius: 50%;
            cursor: pointer;
        }

        .range-value {
            display: inline-block;
            margin-left: 10px;
            font-weight: bold;
            color: #007bff;
        }

        /* 颜色选择器 */
        input[type="color"] {
            width: 60px;
            height: 40px;
            padding: 2px;
            cursor: pointer;
        }

        /* 文件上传样式 */
        input[type="file"] {
            padding: 10px;
            background: #f8f9fa;
            border: 2px dashed #ddd;
            border-radius: 4px;
            cursor: pointer;
        }

        input[type="file"]:hover {
            border-color: #007bff;
        }

        /* 进度条和度量计 */
        meter {
            width: 100%;
            height: 30px;
        }

        progress {
            width: 100%;
            height: 20px;
        }

        /* 按钮样式 */
        .btn-group {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }

        button,
        input[type="button"],
        input[type="submit"],
        input[type="reset"] {
            padding: 12px 24px;
            border: none;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }

        .btn-primary {
            background: #007bff;
            color: white;
        }

        .btn-primary:hover {
            background: #0056b3;
        }

        .btn-secondary {
            background: #6c757d;
            color: white;
        }

        .btn-secondary:hover {
            background: #545b62;
        }

        .btn-success {
            background: #28a745;
            color: white;
        }

        .btn-success:hover {
            background: #218838;
        }

        .btn-danger {
            background: #dc3545;
            color: white;
        }

        .btn-danger:hover {
            background: #c82333;
        }

        /* 禁用状态 */
        input:disabled,
        textarea:disabled,
        select:disabled,
        button:disabled {
            background: #e9ecef;
            cursor: not-allowed;
            opacity: 0.7;
        }

        /* 只读状态 */
        input[readonly] {
            background: #e9ecef;
        }

        /* datalist 样式 */
        datalist {
            display: none;
        }
    </style>
</head>
<body>
    <div class="form-container">
        <h2>HTML5 表单完整示例</h2>

        <form id="advancedForm" action="/submit" method="POST">
            <!-- 基础输入类型 -->
            <div class="form-section">
                <h3>1. 基础输入类型</h3>

                <div class="form-group">
                    <label for="username">用户名 <span class="required">*</span></label>
                    <input type="text" id="username" name="username"
                           placeholder="请输入用户名"
                           required
                           minlength="3"
                           maxlength="20"
                           pattern="^[a-zA-Z0-9_]+$"
                           title="3-20个字符，只允许字母、数字、下划线">
                    <div class="help-text">3-20个字符，只允许字母、数字、下划线</div>
                </div>

                <div class="form-group">
                    <label for="email">邮箱 <span class="required">*</span></label>
                    <input type="email" id="email" name="email"
                           placeholder="example@example.com"
                           required
                           autocomplete="email">
                </div>

                <div class="form-group">
                    <label for="phone">手机号码</label>
                    <input type="tel" id="phone" name="phone"
                           placeholder="请输入手机号"
                           pattern="^1[3-9]\d{9}$"
                           title="请输入11位手机号">
                </div>

                <div class="form-group">
                    <label for="password">密码 <span class="required">*</span></label>
                    <input type="password" id="password" name="password"
                           placeholder="请输入密码"
                           required
                           minlength="6"
                           maxlength="20">
                </div>

                <div class="form-group">
                    <label for="confirm-password">确认密码 <span class="required">*</span></label>
                    <input type="password" id="confirm-password"
                           placeholder="请再次输入密码"
                           required>
                </div>

                <div class="form-group">
                    <label for="homepage">个人主页</label>
                    <input type="url" id="homepage" name="homepage"
                           placeholder="https://example.com"
                           title="请输入有效的URL">
                </div>
            </div>

            <!-- 数字和范围类型 -->
            <div class="form-section">
                <h3>2. 数字和范围类型</h3>

                <div class="form-group">
                    <label for="age">年龄</label>
                    <input type="number" id="age" name="age"
                           min="18"
                           max="100"
                           placeholder="18-100">
                </div>

                <div class="form-group">
                    <label for="score">评分 (0-100): <span id="scoreValue" class="range-value">50</span></label>
                    <input type="range" id="score" name="score"
                           min="0"
                           max="100"
                           value="50"
                           oninput="document.getElementById('scoreValue').textContent = this.value">
                    <div class="help-text">拖动滑块选择评分</div>
                </div>

                <div class="form-group">
                    <label for="quantity">数量</label>
                    <input type="number" id="quantity" name="quantity"
                           min="1"
                           max="10"
                           step="1"
                           value="1">
                </div>
            </div>

            <!-- 日期和时间类型 -->
            <div class="form-section">
                <h3>3. 日期和时间类型</h3>

                <div class="form-group">
                    <label for="birthday">出生日期</label>
                    <input type="date" id="birthday" name="birthday">
                </div>

                <div class="form-group">
                    <label for="start-time">开始时间</label>
                    <input type="time" id="start-time" name="start-time">
                </div>

                <div class="form-group">
                    <label for="appointment">预约时间</label>
                    <input type="datetime-local" id="appointment" name="appointment">
                </div>

                <div class="form-group">
                    <label for="birth-month">出生月份</label>
                    <input type="month" id="birth-month" name="birth-month">
                </div>

                <div class="form-group">
                    <label for="birth-week">出生周</label>
                    <input type="week" id="birth-week" name="birth-week">
                </div>
            </div>

            <!-- 颜色和搜索类型 -->
            <div class="form-section">
                <h3>4. 颜色和搜索类型</h3>

                <div class="form-group">
                    <label for="favorite-color">喜欢的颜色</label>
                    <input type="color" id="favorite-color" name="favorite-color"
                           value="#007bff">
                </div>

                <div class="form-group">
                    <label for="search">搜索</label>
                    <input type="search" id="search" name="search"
                           placeholder="搜索内容..."
                           results="5"
                           autosave="saved-searches">
                </div>
            </div>

            <!-- 复选框和单选框 -->
            <div class="form-section">
                <h3>5. 复选框和单选框</h3>

                <div class="form-group">
                    <label>性别</label>
                    <div class="radio-group">
                        <div class="radio-item">
                            <input type="radio" id="male" name="gender" value="male" checked>
                            <label for="male">男</label>
                        </div>
                        <div class="radio-item">
                            <input type="radio" id="female" name="gender" value="female">
                            <label for="female">女</label>
                        </div>
                        <div class="radio-item">
                            <input type="radio" id="other" name="gender" value="other">
                            <label for="other">其他</label>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label>兴趣爱好</label>
                    <div class="checkbox-group">
                        <div class="checkbox-item">
                            <input type="checkbox" id="reading" name="hobbies" value="reading">
                            <label for="reading">阅读</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="travel" name="hobbies" value="travel">
                            <label for="travel">旅行</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="sports" name="hobbies" value="sports">
                            <label for="sports">运动</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="music" name="hobbies" value="music">
                            <label for="music">音乐</label>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 下拉选择和文本域 -->
            <div class="form-section">
                <h3>6. 下拉选择和文本域</h3>

                <div class="form-group">
                    <label for="country">国家</label>
                    <select id="country" name="country" required>
                        <option value="">请选择国家</option>
                        <option value="cn">中国</option>
                        <option value="us">美国</option>
                        <option value="uk">英国</option>
                        <option value="jp">日本</option>
                        <option value="kr">韩国</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="city">城市</label>
                    <select id="city" name="city">
                        <optgroup label="直辖市">
                            <option value="beijing">北京</option>
                            <option value="shanghai">上海</option>
                            <option value="guangzhou">广州</option>
                            <option value="shenzhen">深圳</option>
                        </optgroup>
                        <optgroup label="省会城市">
                            <option value="hangzhou">杭州</option>
                            <option value="chengdu">成都</option>
                            <option value="wuhan">武汉</option>
                        </optgroup>
                    </select>
                </div>

                <div class="form-group">
                    <label for="browser">常用浏览器（支持搜索）</label>
                    <input type="text" id="browser" name="browser" list="browsers">
                    <datalist id="browsers">
                        <option value="Chrome">
                        <option value="Firefox">
                        <option value="Safari">
                        <option value="Edge">
                        <option value="Opera">
                    </datalist>
                </div>

                <div class="form-group">
                    <label for="introduction">个人简介</label>
                    <textarea id="introduction" name="introduction"
                              rows="5"
                              maxlength="500"
                              placeholder="请输入个人简介..."></textarea>
                    <div class="help-text">最多500个字符</div>
                </div>
            </div>

            <!-- 文件上传 -->
            <div class="form-section">
                <h3>7. 文件上传</h3>

                <div class="form-group">
                    <label for="avatar">头像上传</label>
                    <input type="file" id="avatar" name="avatar"
                           accept="image/*"
                           multiple>
                    <div class="help-text">支持 JPG、PNG 格式</div>
                </div>

                <div class="form-group">
                    <label for="documents">文档上传</label>
                    <input type="file" id="documents" name="documents"
                           accept=".pdf,.doc,.docx,.xls,.xlsx"
                           multiple>
                    <div class="help-text">支持 PDF、Word、Excel 格式，可多选</div>
                </div>
            </div>

            <!-- 进度条和度量计 -->
            <div class="form-section">
                <h3>8. 进度条和度量计</h3>

                <div class="form-group">
                    <label>下载进度</label>
                    <progress value="70" max="100">70%</progress>
                </div>

                <div class="form-group">
                    <label>磁盘使用量（度量计）</label>
                    <meter value="60" min="0" max="100" low="30" high="80" optimum="50">60%</meter>
                    <div class="help-text">低:<30 高:>80 最优:50</div>
                </div>

                <div class="form-group">
                    <label>电池电量</label>
                    <meter value="0.2" min="0" max="1" low="0.2" high="0.8" optimum="0.8">低电量</meter>
                </div>
            </div>

            <!-- 输出元素 -->
            <div class="form-section">
                <h3>9. 输出元素</h3>

                <div class="form-group">
                    <label for="a">A值：</label>
                    <input type="number" id="a" value="10">
                </div>

                <div class="form-group">
                    <label for="b">B值：</label>
                    <input type="number" id="b" value="20">
                </div>

                <div class="form-group">
                    <label>A + B = </label>
                    <output name="result" for="a b">30</output>
                </div>
            </div>

            <!-- 隐藏字段和只读字段 -->
            <div class="form-section">
                <h3>10. 隐藏和只读字段</h3>

                <div class="form-group">
                    <label for="user-id">用户ID（隐藏）</label>
                    <input type="hidden" id="user-id" name="user-id" value="12345">
                </div>

                <div class="form-group">
                    <label for="referrer">来源</label>
                    <input type="text" id="referrer" name="referrer" value="google" readonly>
                </div>

                <div class="form-group">
                    <label for="disabled-field">禁用字段</label>
                    <input type="text" id="disabled-field" value="禁用状态" disabled>
                </div>
            </div>

            <!-- 表单按钮 -->
            <div class="btn-group">
                <button type="submit" class="btn-primary">提交表单</button>
                <button type="reset" class="btn-secondary">重置表单</button>
                <button type="button" class="btn-success" onclick="validateForm()">自定义验证</button>
                <button type="button" class="btn-danger" onclick="getFormData()">获取表单数据</button>
            </div>
        </form>
    </div>

    <script>
        // 表单验证示例
        function validateForm() {
            const form = document.getElementById('advancedForm');
            const username = document.getElementById('username');
            const email = document.getElementById('email');

            // 使用 checkValidity() 方法
            if (!form.checkValidity()) {
                alert('表单验证失败！');
                // 获取第一个无效输入
                const invalidInput = form.querySelector(':invalid');
                invalidInput.focus();
                return false;
            }

            alert('表单验证通过！');
            return true;
        }

        // 获取表单数据
        function getFormData() {
            const form = document.getElementById('advancedForm');
            const formData = new FormData(form);
            const data = {};

            for (let [key, value] of formData.entries()) {
                // 处理多选情况
                if (data[key]) {
                    if (Array.isArray(data[key])) {
                        data[key].push(value);
                    } else {
                        data[key] = [data[key], value];
                    }
                } else {
                    data[key] = value;
                }
            }

            console.log('表单数据：', data);
            alert('表单数据已输出到控制台');
        }

        // 实时计算示例
        document.getElementById('a').addEventListener('input', calculate);
        document.getElementById('b').addEventListener('input', calculate);

        function calculate() {
            const a = parseFloat(document.getElementById('a').value) || 0;
            const b = parseFloat(document.getElementById('b').value) || 0;
            const output = document.querySelector('output[name="result"]');
            output.value = a + b;
        }

        // 表单提交事件
        document.getElementById('advancedForm').addEventListener('submit', function(e) {
            e.preventDefault();

            // 自定义验证逻辑
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (password !== confirmPassword) {
                alert('两次密码输入不一致！');
                return false;
            }

            alert('表单提交成功！');
            // 实际提交时使用 this.submit()
        });

        // 输入事件监听
        document.getElementById('username').addEventListener('input', function(e) {
            console.log('输入值:', e.target.value);
        });

        document.getElementById('email').addEventListener('change', function(e) {
            console.log('邮箱变更:', e.target.value);
        });

        // 密码强度检测
        document.getElementById('password').addEventListener('input', function(e) {
            const password = e.target.value;
            let strength = 0;

            if (password.length >= 6) strength++;
            if (password.length >= 10) strength++;
            if (/[a-z]/.test(password)) strength++;
            if (/[A-Z]/.test(password)) strength++;
            if (/[0-9]/.test(password)) strength++;
            if (/[^a-zA-Z0-9]/.test(password)) strength++;

            console.log('密码强度:', strength);
        });

        // 文件选择事件
        document.getElementById('avatar').addEventListener('change', function(e) {
            const files = e.target.files;
            if (files.length > 0) {
                console.log('已选择文件:', files[0].name);
                console.log('文件大小:', files[0].size);
                console.log('文件类型:', files[0].type);
            }
        });
    </script>
</body>
</html>
```

**表单属性详解：**

| 属性 | 说明 | 示例 |
|------|------|------|
| `required` | 必填项 | `<input required>` |
| `pattern` | 正则验证 | `pattern="^[a-z]{3}$"` |
| `min` / `max` | 最小/最大值 | `min="0" max="100"` |
| `minlength` / `maxlength` | 字符长度限制 | `minlength="3"` |
| `placeholder` | 占位提示 | `placeholder="请输入..."` |
| `autofocus` | 自动聚焦 | `autofocus` |
| `autocomplete` | 自动完成 | `autocomplete="on/off"` |
| `readonly` | 只读 | `readonly` |
| `disabled` | 禁用 | `disabled` |
| `form` | 关联表单 | `form="formId"` |
| `novalidate` | 禁用验证 | `form novalidate` |

**输入类型汇总：**

| 类型 | 用途 | 移动端键盘 |
|------|------|-----------|
| `text` | 文本输入 |  |
| `email文本键盘` | 邮箱输入 | 邮件键盘 |
| `tel` | 电话输入 | 数字键盘 |
| `url` | URL输入 | 文本键盘 |
| `password` | 密码输入 | 密码键盘 |
| `number` | 数字输入 | 数字键盘 |
| `range` | 范围选择 | 滑动选择 |
| `date` | 日期选择 | 日期选择器 |
| `time` | 时间选择 | 时间选择器 |
| `datetime-local` | 本地日期时间 | 日期时间选择器 |
| `color` | 颜色选择 | 颜色选择器 |
| `search` | 搜索输入 | 搜索键盘 |

---

### 5.3 音频视频标签详细使用

**参考答案：**

HTML5 引入了原生的 `<video>` 和 `<audio>` 标签，使得在网页中播放多媒体内容变得非常简单。

**视频标签完整示例：**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML5 视频播放器</title>
    <style>
        * {
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #1a1a1a;
            color: white;
            padding: 20px;
        }

        h1 {
            text-align: center;
        }

        /* 基础视频播放器 */
        .video-container {
            max-width: 800px;
            margin: 20px auto;
            background: #000;
            border-radius: 8px;
            overflow: hidden;
        }

        video {
            width: 100%;
            display: block;
        }

        /* 自定义视频播放器 */
        .custom-player {
            max-width: 800px;
            margin: 20px auto;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }

        .video-wrapper {
            position: relative;
            width: 100%;
            border-radius: 8px;
            overflow: hidden;
            background: #000;
        }

        .video-wrapper video {
            width: 100%;
            vertical-align: middle;
        }

        /* 视频封面 */
        .video-wrapper .poster {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: 1;
        }

        .video-wrapper .poster.hidden {
            display: none;
        }

        /* 播放按钮 */
        .play-button {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80px;
            height: 80px;
            background: rgba(255,255,255,0.9);
            border-radius: 50%;
            cursor: pointer;
            z-index: 2;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.3s, background 0.3s;
        }

        .play-button:hover {
            transform: translate(-50%, -50%) scale(1.1);
            background: white;
        }

        .play-button::after {
            content: '';
            width: 0;
            height: 0;
            border-left: 25px solid #667eea;
            border-top: 15px solid transparent;
            border-bottom: 15px solid transparent;
            margin-left: 5px;
        }

        .play-button.playing::after {
            width: 20px;
            height: 25px;
            border: none;
            border-left: 6px solid #667eea;
            border-right: 6px solid #667eea;
            margin-left: 0;
            background: transparent;
        }

        /* 进度条 */
        .progress-container {
            margin-top: 15px;
        }

        .progress-bar {
            width: 100%;
            height: 6px;
            background: rgba(255,255,255,0.3);
            border-radius: 3px;
            cursor: pointer;
            position: relative;
        }

        .progress-bar:hover {
            height: 8px;
        }

        .progress-filled {
            height: 100%;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            border-radius: 3px;
            width: 0%;
            position: relative;
        }

        .progress-filled::after {
            content: '';
            position: absolute;
            right: -6px;
            top: 50%;
            transform: translateY(-50%);
            width: 12px;
            height: 12px;
            background: white;
            border-radius: 50%;
            opacity: 0;
            transition: opacity 0.2s;
        }

        .progress-bar:hover .progress-filled::after {
            opacity: 1;
        }

        /* 缓冲条 */
        .progress-buffered {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            background: rgba(255,255,255,0.4);
            border-radius: 3px;
            width: 0%;
        }

        /* 控制栏 */
        .controls {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-top: 15px;
        }

        .control-btn {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 8px;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: opacity 0.2s;
        }

        .control-btn:hover {
            opacity: 0.8;
        }

        .control-btn svg {
            width: 24px;
            height: 24px;
            fill: currentColor;
        }

        /* 音量控制 */
        .volume-container {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .volume-slider {
            width: 80px;
            height: 4px;
            -webkit-appearance: none;
            background: rgba(255,255,255,0.3);
            border-radius: 2px;
            cursor: pointer;
        }

        .volume-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 12px;
            height: 12px;
            background: white;
            border-radius: 50%;
            cursor: pointer;
        }

        /* 时间显示 */
        .time-display {
            font-size: 14px;
            font-family: monospace;
            min-width: 100px;
        }

        /* 全屏按钮 */
        .fullscreen-btn {
            margin-left: auto;
        }

        /* 倍速控制 */
        .speed-control {
            position: relative;
        }

        .speed-menu {
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            padding: 10px;
            border-radius: 6px;
            display: none;
        }

        .speed-menu.show {
            display: block;
        }

        .speed-option {
            padding: 5px 15px;
            cursor: pointer;
            white-space: nowrap;
            transition: background 0.2s;
        }

        .speed-option:hover {
            background: rgba(255,255,255,0.2);
        }

        .speed-option.active {
            color: #667eea;
        }

        /* 视频列表 */
        .video-list {
            max-width: 800px;
            margin: 40px auto;
        }

        .video-list h2 {
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }

        .video-item {
            display: flex;
            gap: 15px;
            padding: 15px;
            background: #2a2a2a;
            margin-bottom: 10px;
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.3s;
        }

        .video-item:hover {
            background: #3a3a3a;
        }

        .video-item.active {
            background: #667eea;
        }

        .video-item-thumb {
            width: 160px;
            height: 90px;
            object-fit: cover;
            border-radius: 4px;
        }

        .video-item-info {
            flex: 1;
        }

        .video-item-title {
            font-weight: bold;
            margin-bottom: 5px;
        }

        .video-item-duration {
            font-size: 12px;
            color: #aaa;
        }

        /* 画中画模式 */
        .pip-btn {
            position: relative;
        }

        .pip-btn.active::after {
            content: 'PIP';
            position: absolute;
            top: -5px;
            right: -5px;
            font-size: 10px;
            background: #667eea;
            padding: 2px 4px;
            border-radius: 3px;
        }

        /* 响应式 */
        @media (max-width: 600px) {
            .controls {
                flex-wrap: wrap;
            }

            .volume-container {
                display: none;
            }

            .time-display {
                font-size: 12px;
                min-width: 80px;
            }
        }
    </style>
</head>
<body>
    <h1>HTML5 视频播放器示例</h1>

    <!-- 基础视频播放器 -->
    <div class="video-container">
        <!-- 多种格式支持，确保浏览器兼容性 -->
        <video id="basicVideo" controls poster="poster.jpg" preload="metadata">
            <source src="video.mp4" type="video/mp4">
            <source src="video.webm" type="video/webm">
            <source src="video.ogv" type="video/ogg">
            <!-- 字幕轨道 -->
            <track kind="subtitles" src="subtitles.vtt" srclang="zh" label="中文" default>
            <track kind="subtitles" src="subtitles_en.vtt" srclang="en" label="English">
            <!-- 不支持时的提示 -->
            您的浏览器不支持 video 标签。
        </video>
    </div>

    <!-- 自定义视频播放器 -->
    <div class="custom-player">
        <div class="video-wrapper">
            <video id="customVideo" preload="metadata" poster="poster.jpg">
                <source src="video.mp4" type="video/mp4">
            </video>
            <div class="play-button" id="playBtn"></div>
        </div>

        <div class="progress-container">
            <div class="progress-bar" id="progressBar">
                <div class="progress-buffered" id="buffered"></div>
                <div class="progress-filled" id="progressFilled"></div>
            </div>
        </div>

        <div class="controls">
            <button class="control-btn" id="playPauseBtn" title="播放/暂停">
                <svg viewBox="0 0 24 24" id="playIcon">
                    <path d="M8 5v14l11-7z"/>
                </svg>
            </button>

            <div class="volume-container">
                <button class="control-btn" id="muteBtn" title="静音">
                    <svg viewBox="0 0 24 24" id="volumeIcon">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                </button>
                <input type="range" class="volume-slider" id="volumeSlider"
                       min="0" max="1" step="0.1" value="1">
            </div>

            <div class="time-display">
                <span id="currentTime">0:00</span> / <span id="duration">0:00</span>
            </div>

            <div class="speed-control">
                <button class="control-btn" id="speedBtn" title="播放速度">1x</button>
                <div class="speed-menu" id="speedMenu">
                    <div class="speed-option" data-speed="0.5">0.5x</div>
                    <div class="speed-option" data-speed="0.75">0.75x</div>
                    <div class="speed-option active" data-speed="1">1x</div>
                    <div class="speed-option" data-speed="1.25">1.25x</div>
                    <div class="speed-option" data-speed="1.5">1.5x</div>
                    <div class="speed-option" data-speed="2">2x</div>
                </div>
            </div>

            <button class="control-btn pip-btn" id="pipBtn" title="画中画">
                <svg viewBox="0 0 24 24">
                    <path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z"/>
                </svg>
            </button>

            <button class="control-btn fullscreen-btn" id="fullscreenBtn" title="全屏">
                <svg viewBox="0 0 24 24" id="fullscreenIcon">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                </svg>
            </button>
        </div>
    </div>

    <!-- 视频列表 -->
    <div class="video-list">
        <h2>播放列表</h2>
        <div class="video-item active" data-src="video1.mp4">
            <img src="thumb1.jpg" alt="视频1" class="video-item-thumb">
            <div class="video-item-info">
                <div class="video-item-title">视频标题 1</div>
                <div class="video-item-duration">10:30</div>
            </div>
        </div>
        <div class="video-item" data-src="video2.mp4">
            <img src="thumb2.jpg" alt="视频2" class="video-item-thumb">
            <div class="video-item-info">
                <div class="video-item-title">视频标题 2</div>
                <div class="video-item-duration">15:45</div>
            </div>
        </div>
        <div class="video-item" data-src="video3.mp4">
            <img src="thumb3.jpg" alt="视频3" class="video-item-thumb">
            <div class="video-item-info">
                <div class="video-item-title">视频标题 3</div>
                <div class="video-item-duration">08:20</div>
            </div>
        </div>
    </div>

    <!-- 音频播放器示例 -->
    <div class="video-container" style="background: #2a2a2a; padding: 20px;">
        <h2>音频播放器</h2>
        <audio id="audioPlayer" controls>
            <source src="audio.mp3" type="audio/mpeg">
            <source src="audio.ogg" type="audio/ogg">
            <source src="audio.wav" type="audio/wav">
            您的浏览器不支持 audio 标签。
        </audio>
    </div>

    <script>
        // 获取元素
        const video = document.getElementById('customVideo');
        const playBtn = document.getElementById('playBtn');
        const playPauseBtn = document.getElementById('playPauseBtn');
        const progressBar = document.getElementById('progressBar');
        const progressFilled = document.getElementById('progressFilled');
        const buffered = document.getElementById('buffered');
        const currentTimeEl = document.getElementById('currentTime');
        const durationEl = document.getElementById('duration');
        const volumeSlider = document.getElementById('volumeSlider');
        const muteBtn = document.getElementById('muteBtn');
        const speedBtn = document.getElementById('speedBtn');
        const speedMenu = document.getElementById('speedMenu');
        const pipBtn = document.getElementById('pipBtn');
        const fullscreenBtn = document.getElementById('fullscreenBtn');

        // 格式化时间
        function formatTime(seconds) {
            if (isNaN(seconds)) return '0:00';
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }

        // 播放/暂停
        function togglePlay() {
            if (video.paused || video.ended) {
                video.play();
            } else {
                video.pause();
            }
        }

        playBtn.addEventListener('click', togglePlay);
        playPauseBtn.addEventListener('click', togglePlay);

        // 播放状态改变
        video.addEventListener('play', () => {
            playBtn.classList.add('playing');
            document.getElementById('playIcon').innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
        });

        video.addEventListener('pause', () => {
            playBtn.classList.remove('playing');
            document.getElementById('playIcon').innerHTML = '<path d="M8 5v14l11-7z"/>';
        });

        // 加载元数据
        video.addEventListener('loadedmetadata', () => {
            durationEl.textContent = formatTime(video.duration);
        });

        // 更新时间
        video.addEventListener('timeupdate', () => {
            const progress = (video.currentTime / video.duration) * 100;
            progressFilled.style.width = `${progress}%`;
            currentTimeEl.textContent = formatTime(video.currentTime);
        });

        // 缓冲进度
        video.addEventListener('progress', () => {
            if (video.buffered.length > 0) {
                const bufferedEnd = video.buffered.end(video.buffered.length - 1);
                const bufferPercent = (bufferedEnd / video.duration) * 100;
                buffered.style.width = `${bufferPercent}%`;
            }
        });

        // 点击进度条跳转
        progressBar.addEventListener('click', (e) => {
            const rect = progressBar.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            video.currentTime = pos * video.duration;
        });

        // 音量控制
        volumeSlider.addEventListener('input', () => {
            video.volume = volumeSlider.value;
            updateVolumeIcon();
        });

        function updateVolumeIcon() {
            const icon = document.getElementById('volumeIcon');
            if (video.muted || video.volume === 0) {
                icon.innerHTML = '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
            } else if (video.volume < 0.5) {
                icon.innerHTML = '<path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>';
            } else {
                icon.innerHTML = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
            }
        }

        muteBtn.addEventListener('click', () => {
            video.muted = !video.muted;
            updateVolumeIcon();
        });

        // 播放速度
        speedBtn.addEventListener('click', () => {
            speedMenu.classList.toggle('show');
        });

        document.querySelectorAll('.speed-option').forEach(option => {
            option.addEventListener('click', () => {
                const speed = parseFloat(option.dataset.speed);
                video.playbackRate = speed;
                speedBtn.textContent = speed + 'x';
                document.querySelectorAll('.speed-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                speedMenu.classList.remove('show');
            });
        });

        // 画中画模式
        pipBtn.addEventListener('click', async () => {
            try {
                if (document.pictureInPictureElement) {
                    await document.exitPictureInPicture();
                } else {
                    await video.requestPictureInPicture();
                }
            } catch (error) {
                console.error('画中画模式不支持:', error);
            }
        });

        video.addEventListener('enterpictureinpicture', () => {
            pipBtn.classList.add('active');
        });

        video.addEventListener('leavepictureinpicture', () => {
            pipBtn.classList.remove('active');
        });

        // 全屏
        fullscreenBtn.addEventListener('click', () => {
            const wrapper = document.querySelector('.video-wrapper');
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                wrapper.requestFullscreen();
            }
        });

        // 视频列表切换
        document.querySelectorAll('.video-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.video-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                const src = item.dataset.src;
                video.src = src;
                video.play();
            });
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;

            switch(e.code) {
                case 'Space':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'ArrowLeft':
                    video.currentTime -= 5;
                    break;
                case 'ArrowRight':
                    video.currentTime += 5;
                    break;
                case 'ArrowUp':
                    video.volume = Math.min(1, video.volume + 0.1);
                    volumeSlider.value = video.volume;
                    updateVolumeIcon();
                    break;
                case 'ArrowDown':
                    video.volume = Math.max(0, video.volume - 0.1);
                    volumeSlider.value = video.volume;
                    updateVolumeIcon();
                    break;
                case 'KeyM':
                    video.muted = !video.muted;
                    updateVolumeIcon();
                    break;
                case 'KeyF':
                    fullscreenBtn.click();
                    break;
            }
        });

        // 视频事件监听
        video.addEventListener('waiting', () => {
            console.log('等待更多数据...');
        });

        video.addEventListener('playing', () => {
            console.log('视频播放中...');
        });

        video.addEventListener('ended', () => {
            console.log('播放结束');
            playBtn.classList.remove('playing');
        });

        video.addEventListener('error', (e) => {
            console.error('视频加载错误:', video.error);
        });

        // 音量变化
        video.addEventListener('volumechange', () => {
            console.log('音量变化:', video.volume);
        });
    </script>
</body>
</html>
```

**Video/Audio API 完整属性和方法：**

```javascript
// 获取 video/audio 元素
const video = document.querySelector('video');
const audio = document.querySelector('audio');

// 属性
console.log(video.src);                    // 当前视频URL
console.log(video.currentSrc);              // 实际使用的URL
console.log(video.currentTime);             // 当前播放时间（秒）
console.log(video.duration);                // 媒体时长（秒）
console.log(video.paused);                  // 是否暂停
console.log(video.ended);                   // 是否播放结束
console.log(video.error);                    // 错误对象
console.log(video.volume);                   // 音量（0-1）
console.log(video.muted);                   // 是否静音
console.log(video.playbackRate);            // 播放速率
console.log(video.defaultPlaybackRate);     // 默认播放速率
console.log(video.buffered);                // 缓冲范围
console.log(video.seekable);                // 可跳转范围
console.log(video.played);                   // 已播放范围
console.log(video.readyState);              // 就绪状态
console.log(video.networkState);            // 网络状态
console.log(video.videoWidth);              // 视频宽度
console.log(video.videoHeight);             // 视频高度
console.log(video.poster);                  // 封面图片
console.log(video.controls);                // 是否显示控制条
console.log(video.loop);                    // 是否循环
console.log(video.autoplay);                // 是否自动播放
console.log(video.preload);                 // 预加载策略

// 方法
video.play();                               // 播放
video.pause();                              // 暂停
video.load();                               // 重新加载
video.canPlayType('video/mp4');             // 检查是否支持

// 跳转
video.currentTime = 30;                     // 跳转到30秒
video.seekTo(30);                           // 同上（已废弃）

// 音量控制
video.volume = 0.5;                         // 设置音量50%
video.muted = false;                        // 取消静音

// 播放速率
video.playbackRate = 1.5;                  // 1.5倍速播放

// 全屏
video.requestFullscreen();                  // 请求全屏
video.exitFullscreen();                     // 退出全屏

// 画中画
video.requestPictureInPicture();            // 请求画中画
video.exitPictureInPicture();               // 退出画中画

// 媒体源扩展
const mediaSource = new MediaSource();
video.src = URL.createObjectURL(mediaSource);

// 事件
video.addEventListener('loadstart', () => {});      // 开始加载
video.addEventListener('progress', () => {});       // 加载中
video.addEventListener('loadedmetadata', () => {}); // 元数据加载完成
video.addEventListener('loadeddata', () => {});     // 数据加载完成
video.addEventListener('canplay', () => {});       // 可播放
video.addEventListener('canplaythrough', () => {}); // 可流畅播放
video.addEventListener('play', () => {});           // 开始播放
video.addEventListener('pause', () => {});          // 暂停
video.addEventListener('ended', () => {});          // 播放结束
video.addEventListener('timeupdate', () => {});     // 时间更新
video.addEventListener('volumechange', () => {});   // 音量变化
video.addEventListener('waiting', () => {});        // 等待数据
video.addEventListener('playing', () => {});        // 播放中
video.addEventListener('error', () => {});          // 错误
video.addEventListener('emptied', () => {});        // 媒体为空
video.addEventListener('stalled', () => {});        // 尝试获取数据但无数据
```

---

### 5.4 Canvas API 详细教程

**参考答案：**

Canvas是HTML5最强大的特性之一，提供了一个位图画布，可以通过JavaScript进行高性能的图形绘制。

**Canvas 完整示例：**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Canvas API 完整教程</title>
    <style>
        * {
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }

        .canvas-section {
            background: white;
            margin-bottom: 30px;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        h2 {
            margin-top: 0;
            color: #333;
            border-bottom: 2px solid #007bff;
            padding-bottom: 10px;
        }

        canvas {
            border: 1px solid #ddd;
            display: block;
            margin: 20px auto;
        }

        .canvas-container {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 20px;
        }

        .canvas-wrapper {
            text-align: center;
        }

        .canvas-wrapper h3 {
            margin: 10px 0;
            color: #555;
        }
    </style>
</head>
<body>
    <!-- 1. 基础画布 -->
    <div class="canvas-section">
        <h2>1. 基础画布设置</h2>
        <div class="canvas-container">
            <div class="canvas-wrapper">
                <canvas id="basicCanvas" width="400" height="200"></canvas>
                <h3>基础画布</h3>
            </div>
            <div class="canvas-wrapper">
                <canvas id="retinaCanvas" width="400" height="200" style="width:400px;height:200px;"></canvas>
                <h3>高清屏适配</h3>
            </div>
        </div>
    </div>

    <!-- 2. 图形绘制 -->
    <div class="canvas-section">
        <h2>2. 基本图形绘制</h2>
        <canvas id="shapesCanvas" width="600" height="300"></canvas>
    </div>

    <!-- 3. 路径和贝塞尔曲线 -->
    <div class="canvas-section">
        <h2>3. 路径和贝塞尔曲线</h2>
        <canvas id="pathCanvas" width="600" height="400"></canvas>
    </div>

    <!-- 4. 文本绘制 -->
    <div class="canvas-section">
        <h2>4. 文本绘制</h2>
        <canvas id="textCanvas" width="600" height="300"></canvas>
    </div>

    <!-- 5. 图像处理 -->
    <div class="canvas-section">
        <h2>5. 图像处理</h2>
        <canvas id="imageCanvas" width="600" height="400"></canvas>
    </div>

    <!-- 6. 动画示例 -->
    <div class="canvas-section">
        <h2>6. 动画示例</h2>
        <canvas id="animationCanvas" width="600" height="400"></canvas>
    </div>

    <!-- 7. 粒子效果 -->
    <div class="canvas-section">
        <h2>7. 粒子效果</h2>
        <canvas id="particleCanvas" width="600" height="400"></canvas>
    </div>

    <!-- 8. 图表绘制 -->
    <div class="canvas-section">
        <h2>8. 图表绘制</h2>
        <canvas id="chartCanvas" width="600" height="400"></canvas>
    </div>

    <script>
        // ========================================
        // 1. 基础画布设置
        // ========================================
        (function() {
            const canvas = document.getElementById('basicCanvas');
            const ctx = canvas.getContext('2d');

            // 填充背景
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 绘制矩形
            ctx.fillStyle = '#3498db';
            ctx.fillRect(50, 50, 100, 60);

            // 绘制描边矩形
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 3;
            ctx.strokeRect(200, 50, 100, 60);

            // 绘制圆形
            ctx.beginPath();
            ctx.arc(350, 80, 30, 0, Math.PI * 2);
            ctx.fillStyle = '#2ecc71';
            ctx.fill();
        })();

        // 高清屏适配
        (function() {
            const canvas = document.getElementById('retinaCanvas');
            const ctx = canvas.getContext('2d');

            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();

            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;

            ctx.scale(dpr, dpr);

            ctx.font = '24px Arial';
            ctx.fillStyle = '#333';
            ctx.fillText('高清屏适配', 20, 40);

            ctx.beginPath();
            ctx.arc(100, 100, 50, 0, Math.PI * 2);
            ctx.fillStyle = '#3498db';
            ctx.fill();
        })();

        // ========================================
        // 2. 基本图形绘制
        // ========================================
        (function() {
            const canvas = document.getElementById('shapesCanvas');
            const ctx = canvas.getContext('2d');

            // 绘制矩形
            ctx.fillStyle = '#3498db';
            ctx.fillRect(20, 20, 100, 60);

            // 绘制圆角矩形
            function roundRect(x, y, w, h, r) {
                ctx.beginPath();
                ctx.moveTo(x + r, y);
                ctx.lineTo(x + w - r, y);
                ctx.quadraticCurveTo(x + w, y, x + w, y + r);
                ctx.lineTo(x + w, y + h - r);
                ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
                ctx.lineTo(x + r, y + h);
                ctx.quadraticCurveTo(x, y + h, x, y + h - r);
                ctx.lineTo(x, y + r);
                ctx.quadraticCurveTo(x, y, x + r, y);
                ctx.closePath();
            }

            ctx.fillStyle = '#e74c3c';
            roundRect(150, 20, 100, 60, 10);
            ctx.fill();

            // 绘制圆形
            ctx.beginPath();
            ctx.arc(300, 50, 30, 0, Math.PI * 2);
            ctx.fillStyle = '#2ecc71';
            ctx.fill();

            // 绘制椭圆
            ctx.beginPath();
            ctx.ellipse(400, 50, 40, 25, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#9b59b6';
            ctx.fill();

            // 绘制三角形
            ctx.beginPath();
            ctx.moveTo(500, 20);
            ctx.lineTo(550, 80);
            ctx.lineTo(450, 80);
            ctx.closePath();
            ctx.fillStyle = '#f39c12';
            ctx.fill();

            // 绘制多边形
            function drawPolygon(x, y, radius, sides) {
                ctx.beginPath();
                for (let i = 0; i < sides; i++) {
                    const angle = (i * 2 * Math.PI / sides) - Math.PI / 2;
                    const px = x + radius * Math.cos(angle);
                    const py = y + radius * Math.sin(angle);
                    if (i === 0) {
                        ctx.moveTo(px, py);
                    } else {
                        ctx.lineTo(px, py);
                    }
                }
                ctx.closePath();
            }

            // 五边形
            drawPolygon(80, 180, 35, 5);
            ctx.fillStyle = '#1abc9c';
            ctx.fill();

            // 六边形
            drawPolygon(180, 180, 35, 6);
            ctx.fillStyle = '#34495e';
            ctx.fill();

            // 七边形
            drawPolygon(280, 180, 35, 7);
            ctx.fillStyle = '#e67e22';
            ctx.fill();

            // 八边形
            drawPolygon(380, 180, 35, 8);
            ctx.fillStyle = '#16a085';
            ctx.fill();

            // 绘制弧线
            ctx.beginPath();
            ctx.arc(500, 180, 30, 0, Math.PI * 1.5);
            ctx.strokeStyle = '#c0392b';
            ctx.lineWidth = 4;
            ctx.stroke();
        })();

        // ========================================
        // 3. 路径和贝塞尔曲线
        // ========================================
        (function() {
            const canvas = document.getElementById('pathCanvas');
            const ctx = canvas.getContext('2d');

            // 二次贝塞尔曲线
            ctx.beginPath();
            ctx.moveTo(50, 200);
            ctx.quadraticCurveTo(150, 50, 250, 200);
            ctx.strokeStyle = '#3498db';
            ctx.lineWidth = 3;
            ctx.stroke();

            // 标记控制点
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(150, 50, 5, 0, Math.PI * 2);
            ctx.fill();

            // 三次贝塞尔曲线
            ctx.beginPath();
            ctx.moveTo(300, 200);
            ctx.bezierCurveTo(350, 50, 450, 50, 500, 200);
            ctx.strokeStyle = '#2ecc71';
            ctx.stroke();

            // 标记控制点
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(350, 50, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(450, 50, 5, 0, Math.PI * 2);
            ctx.fill();

            // 波浪线
            ctx.beginPath();
            const waveWidth = 500;
            const waveHeight = 40;
            const amplitude = 30;
            const frequency = 0.02;

            ctx.moveTo(50, 300);
            for (let x = 0; x <= waveWidth; x++) {
                const y = 300 + Math.sin(x * frequency) * amplitude;
                ctx.lineTo(50 + x, y);
            }
            ctx.strokeStyle = '#9b59b6';
            ctx.lineWidth = 2;
            ctx.stroke();

            // 爱心形状
            ctx.beginPath();
            const heartX = 300;
            const heartY = 80;
            const size = 30;

            ctx.moveTo(heartX, heartY + size / 4);
            ctx.quadraticCurveTo(heartX, heartY, heartX - size / 2, heartY);
            ctx.quadraticCurveTo(heartX - size, heartY, heartX - size, heartY + size / 2);
            ctx.quadraticCurveTo(heartX - size, heartY + size, heartX - size / 2, heartY + size);
            ctx.quadraticCurveTo(heartX, heartY + size * 1.5, heartX, heartY + size * 1.5);
            ctx.quadraticCurveTo(heartX, heartY + size * 1.5, heartX + size / 2, heartY + size);
            ctx.quadraticCurveTo(heartX + size, heartY + size, heartX + size, heartY + size / 2);
            ctx.quadraticCurveTo(heartX + size, heartY, heartX + size / 2, heartY);
            ctx.quadraticCurveTo(heartX, heartY, heartX, heartY + size / 4);

            const gradient = ctx.createLinearGradient(heartX - size, heartY, heartX + size, heartY + size);
            gradient.addColorStop(0, '#ff6b6b');
            gradient.addColorStop(1, '#ee5a5a');
            ctx.fillStyle = gradient;
            ctx.fill();
        })();

        // ========================================
        // 4. 文本绘制
        // ========================================
        (function() {
            const canvas = document.getElementById('textCanvas');
            const ctx = canvas.getContext('2d');

            // 基础文本
            ctx.font = '30px Arial';
            ctx.fillStyle = '#333';
            ctx.fillText('Hello Canvas!', 20, 50);

            // 带描边的文本
            ctx.font = 'bold 40px Georgia';
            ctx.fillStyle = '#3498db';
            ctx.fillText('描边文字', 20, 120);
            ctx.strokeStyle = '#2c3e50';
            ctx.lineWidth = 1;
            ctx.strokeText('描边文字', 20, 120);

            // 文本对齐
            ctx.font = '24px Arial';

            ctx.textAlign = 'left';
            ctx.fillStyle = '#e74c3c';
            ctx.fillText('左对齐', 300, 50);

            ctx.textAlign = 'center';
            ctx.fillStyle = '#2ecc71';
            ctx.fillText('居中', 300, 100);

            ctx.textAlign = 'right';
            ctx.fillStyle = '#9b59b6';
            ctx.fillText('右对齐', 300, 150);

            // 垂直对齐
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#f39c12';
            ctx.fillText('顶部对齐', 20, 200);

            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#1abc9c';
            ctx.fillText('中间对齐', 150, 220);

            ctx.textBaseline = 'bottom';
            ctx.fillStyle = '#34495e';
            ctx.fillText('底部对齐', 300, 240);

            // 文本渐变
            const gradient = ctx.createLinearGradient(380, 180, 550, 180);
            gradient.addColorStop(0, '#3498db');
            gradient.addColorStop(0.5, '#e74c3c');
            gradient.addColorStop(1, '#2ecc71');
            ctx.font = 'bold 36px Arial';
            ctx.fillStyle = gradient;
            ctx.fillText('渐变文字', 380, 220);

            // 文本阴影
            ctx.font = 'bold 40px Arial';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 3;
            ctx.fillStyle = '#fff';
            ctx.fillText('阴影文字', 420, 50);
            ctx.shadowColor = 'transparent';
        })();

        // ========================================
        // 5. 图像处理
        // ========================================
        (function() {
            const canvas = document.getElementById('imageCanvas');
            const ctx = canvas.getContext('2d');

            // 创建图片
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function() {
                // 原始图片
                ctx.drawImage(img, 20, 20, 150, 150);

                // 缩放
                ctx.drawImage(img, 200, 20, 100, 100);

                // 裁剪
                ctx.save();
                ctx.beginPath();
                ctx.arc(350, 95, 70, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(img, 280, 25, 140, 140);
                ctx.restore();

                // 镜像
                ctx.save();
                ctx.translate(500, 170);
                ctx.scale(-1, 1);
                ctx.drawImage(img, 0, -70, 120, 140);
                ctx.restore();

                // 滤镜效果 - 灰度
                const grayCanvas = document.createElement('canvas');
                grayCanvas.width = 150;
                grayCanvas.height = 150;
                const grayCtx = grayCanvas.getContext('2d');
                grayCtx.drawImage(img, 0, 0, 150, 150);

                const imageData = grayCtx.getImageData(0, 0, 150, 150);
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    data[i] = avg;
                    data[i + 1] = avg;
                    data[i + 2] = avg;
                }
                grayCtx.putImageData(imageData, 0, 0);
                ctx.drawImage(grayCanvas, 20, 200);

                // 滤镜效果 - 复古
                const vintageCanvas = document.createElement('canvas');
                vintageCanvas.width = 150;
                vintageCanvas.height = 150;
                const vintageCtx = vintageCanvas.getContext('2d');
                vintageCtx.drawImage(img, 0, 0, 150, 150);

                const vintageData = vintageCtx.getImageData(0, 0, 150, 150);
                const vData = vintageData.data;
                for (let i = 0; i < vData.length; i += 4) {
                    vData[i] = Math.min(255, vData[i] * 1.2 + 30);
                    vData[i + 1] = Math.min(255, vData[i + 1] * 1.1 + 20);
                    vData[i + 2] = Math.min(255, vData[i + 2] * 0.8);
                }
                vintageCtx.putImageData(vintageData, 0, 0);
                ctx.drawImage(vintageCanvas, 200, 200);

                // 马赛克效果
                const mosaicCanvas = document.createElement('canvas');
                mosaicCanvas.width = 150;
                mosaicCanvas.height = 150;
                const mosaicCtx = mosaicCanvas.getContext('2d');
                mosaicCtx.drawImage(img, 0, 0, 150, 150);

                const mosaicSize = 10;
                const mData = mosaicCtx.getImageData(0, 0, 150, 150);
                const md = mData.data;
                for (let y = 0; y < 150; y += mosaicSize) {
                    for (let x = 0; x < 150; x += mosaicSize) {
                        let r = 0, g = 0, b = 0, count = 0;
                        for (let dy = 0; dy < mosaicSize && y + dy < 150; dy++) {
                            for (let dx = 0; dx < mosaicSize && x + dx < 150; dx++) {
                                const idx = ((y + dy) * 150 + (x + dx)) * 4;
                                r += md[idx];
                                g += md[idx + 1];
                                b += md[idx + 2];
                                count++;
                            }
                        }
                        r = Math.floor(r / count);
                        g = Math.floor(g / count);
                        b = Math.floor(b / count);
                        for (let dy = 0; dy < mosaicSize && y + dy < 150; dy++) {
                            for (let dx = 0; dx < mosaicSize && x + dx < 150; dx++) {
                                const idx = ((y + dy) * 150 + (x + dx)) * 4;
                                md[idx] = r;
                                md[idx + 1] = g;
                                md[idx + 2] = b;
                            }
                        }
                    }
                }
                mosaicCtx.putImageData(mData, 0, 0);
                ctx.drawImage(mosaicCanvas, 380, 200);
            };

            // 使用占位图
            img.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect fill="#3498db" width="300" height="300"/><text fill="white" font-size="30" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">Image</text></svg>');
        })();

        // ========================================
        // 6. 动画示例
        // ========================================
        (function() {
            const canvas = document.getElementById('animationCanvas');
            const ctx = canvas.getContext('2d');

            let angle = 0;
            let x = 50;
            let y = 200;
            let dx = 2;
            let dy = 2;
            const radius = 20;

            function animate() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // 背景
                ctx.fillStyle = '#f8f9fa';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // 网格
                ctx.strokeStyle = '#e0e0e0';
                ctx.lineWidth = 1;
                for (let i = 0; i < canvas.width; i += 20) {
                    ctx.beginPath();
                    ctx.moveTo(i, 0);
                    ctx.lineTo(i, canvas.height);
                    ctx.stroke();
                }
                for (let i = 0; i < canvas.height; i += 20) {
                    ctx.beginPath();
                    ctx.moveTo(0, i);
                    ctx.lineTo(canvas.width, i);
                    ctx.stroke();
                }

                // 弹球动画
                x += dx;
                y += dy;

                if (x + radius > canvas.width || x - radius < 0) dx = -dx;
                if (y + radius > canvas.height || y - radius < 0) dy = -dy;

                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                const ballGradient = ctx.createRadialGradient(x - 5, y - 5, 0, x, y, radius);
                ballGradient.addColorStop(0, '#fff');
                ballGradient.addColorStop(1, '#3498db');
                ctx.fillStyle = ballGradient;
                ctx.fill();
                ctx.strokeStyle = '#2980b9';
                ctx.lineWidth = 2;
                ctx.stroke();

                // 旋转矩形
                ctx.save();
                ctx.translate(300, 200);
                ctx.rotate(angle);
                ctx.fillStyle = '#e74c3c';
                ctx.fillRect(-40, -40, 80, 80);
                ctx.restore();

                // 缩放圆环
                ctx.save();
                ctx.translate(450, 100);
                ctx.beginPath();
                ctx.arc(0, 0, 30 + Math.sin(angle * 2) * 10, 0, Math.PI * 2);
                ctx.strokeStyle = '#2ecc71';
                ctx.lineWidth = 5;
                ctx.stroke();
                ctx.restore();

                // 脉冲圆
                const pulseRadius = 20 + Math.sin(angle * 3) * 10;
                ctx.beginPath();
                ctx.arc(450, 300, pulseRadius, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(155, 89, 182, 0.5)';
                ctx.fill();

                angle += 0.05;
                requestAnimationFrame(animate);
            }

            animate();
        })();

        // ========================================
        // 7. 粒子效果
        // ========================================
        (function() {
            const canvas = document.getElementById('particleCanvas');
            const ctx = canvas.getContext('2d');

            class Particle {
                constructor(x, y) {
                    this.x = x;
                    this.y = y;
                    this.vx = (Math.random() - 0.5) * 4;
                    this.vy = (Math.random() - 0.5) * 4;
                    this.radius = Math.random() * 3 + 1;
                    this.color = `hsl(${Math.random() * 60 + 180}, 80%, 60%)`;
                    this.life = 100;
                    this.decay = Math.random() * 0.5 + 0.5;
                }

                update() {
                    this.x += this.vx;
                    this.y += this.vy;
                    this.vx *= 0.99;
                    this.vy *= 0.99;
                    this.life -= this.decay;
                }

                draw() {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                    ctx.fillStyle = this.color;
                    ctx.globalAlpha = this.life / 100;
                    ctx.fill();
                    ctx.globalAlpha = 1;
                }
            }

            const particles = [];
            let mouseX = 0;
            let mouseY = 0;
            let isMouseDown = false;

            canvas.addEventListener('mousemove', (e) => {
                const rect = canvas.getBoundingClientRect();
                mouseX = e.clientX - rect.left;
                mouseY = e.clientY - rect.top;

                if (isMouseDown) {
                    for (let i = 0; i < 5; i++) {
                        particles.push(new Particle(mouseX, mouseY));
                    }
                }
            });

            canvas.addEventListener('mousedown', () => {
                isMouseDown = true;
            });

            canvas.addEventListener('mouseup', () => {
                isMouseDown = false;
            });

            canvas.addEventListener('mouseleave', () => {
                isMouseDown = false;
            });

            function animate() {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // 自动生成粒子
                if (Math.random() < 0.1) {
                    const x = Math.random() * canvas.width;
                    const y = Math.random() * canvas.height;
                    particles.push(new Particle(x, y));
                }

                for (let i = particles.length - 1; i >= 0; i--) {
                    particles[i].update();
                    particles[i].draw();

                    if (particles[i].life <= 0) {
                        particles.splice(i, 1);
                    }
                }

                requestAnimationFrame(animate);
            }

            animate();
        })();

        // ========================================
        // 8. 图表绘制
        // ========================================
        (function() {
            const canvas = document.getElementById('chartCanvas');
            const ctx = canvas.getContext('2d');

            // 柱状图数据
            const barData = [
                { label: '一月', value: 120, color: '#3498db' },
                { label: '二月', value: 180, color: '#2ecc71' },
                { label: '三月', value: 150, color: '#e74c3c' },
                { label: '四月', value: 220, color: '#f39c12' },
                { label: '五月', value: 280, color: '#9b59b6' },
                { label: '六月', value: 200, color: '#1abc9c' }
            ];

            // 绘制柱状图
            const chartX = 50;
            const chartY = 50;
            const chartWidth = 250;
            const chartHeight = 200;
            const barWidth = 30;
            const gap = 15;
            const maxValue = Math.max(...barData.map(d => d.value));

            // 坐标轴
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(chartX, chartY + chartHeight);
            ctx.lineTo(chartX + chartWidth, chartY + chartHeight);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(chartX, chartY);
            ctx.lineTo(chartX, chartY + chartHeight);
            ctx.stroke();

            // 绘制柱子和标签
            barData.forEach((item, index) => {
                const barHeight = (item.value / maxValue) * chartHeight;
                const x = chartX + gap + index * (barWidth + gap);
                const y = chartY + chartHeight - barHeight;

                // 柱子
                ctx.fillStyle = item.color;
                ctx.fillRect(x, y, barWidth, barHeight);

                // 数值
                ctx.fillStyle = '#333';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(item.value, x + barWidth / 2, y - 5);

                // 标签
                ctx.fillText(item.label, x + barWidth / 2, chartY + chartHeight + 20);
            });

            // 饼图数据
            const pieData = [
                { label: 'A产品', value: 35, color: '#3498db' },
                { label: 'B产品', value: 25, color: '#2ecc71' },
                { label: 'C产品', value: 20, color: '#e74c3c' },
                { label: 'D产品', value: 15, color: '#f39c12' },
                { label: '其他', value: 5, color: '#9b59b6' }
            ];

            // 绘制饼图
            const pieCenterX = 420;
            const pieCenterY = 180;
            const pieRadius = 100;
            let startAngle = -Math.PI / 2;

            pieData.forEach(item => {
                const sliceAngle = (item.value / 100) * Math.PI * 2;

                ctx.beginPath();
                ctx.moveTo(pieCenterX, pieCenterY);
                ctx.arc(pieCenterX, pieCenterY, pieRadius, startAngle, startAngle + sliceAngle);
                ctx.closePath();
                ctx.fillStyle = item.color;
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();

                // 标签
                const midAngle = startAngle + sliceAngle / 2;
                const labelRadius = pieRadius * 0.7;
                const labelX = pieCenterX + Math.cos(midAngle) * labelRadius;
                const labelY = pieCenterY + Math.sin(midAngle) * labelRadius;

                ctx.fillStyle = '#333';
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(item.label + ' ' + item.value + '%', labelX, labelY);

                startAngle += sliceAngle;
            });

            // 饼图中心圆
            ctx.beginPath();
            ctx.arc(pieCenterX, pieCenterY, 40, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();

            ctx.fillStyle = '#333';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('总计', pieCenterX, pieCenterY + 5);

            // 折线图
            const lineData = [
                { x: 0, y: 80 },
                { x: 1, y: 60 },
                { x: 2, y: 90 },
                { x: 3, y: 45 },
                { x: 4, y: 70 },
                { x: 5, y: 30 },
                { x: 6, y: 55 },
                { x: 7, y: 40 },
                { x: 8, y: 75 },
                { x: 9, y: 50 }
            ];

            const lineX = 50;
            const lineY = 280;
            const lineWidth = 250;
            const lineHeight = 80;

            // 背景网格
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 4; i++) {
                const y = lineY + (lineHeight / 4) * i;
                ctx.beginPath();
                ctx.moveTo(lineX, y);
                ctx.lineTo(lineX + lineWidth, y);
                ctx.stroke();
            }

            // 折线
            ctx.beginPath();
            lineData.forEach((point, index) => {
                const x = lineX + (point.x / 9) * lineWidth;
                const y = lineY + lineHeight - (point.y / 100) * lineHeight;
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 2;
            ctx.stroke();

            // 数据点
            lineData.forEach((point, index) => {
                const x = lineX + (point.x / 9) * lineWidth;
                const y = lineY + lineHeight - (point.y / 100) * lineHeight;

                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fillStyle = '#e74c3c';
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
            });
        })();
    </script>
</body>
</html>
```

**Canvas API 核心方法汇总：**

```javascript
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

// 获取上下文
ctx = canvas.getContext('2d');           // 2D 上下文
ctx = canvas.getContext('webgl');        // WebGL 3D

// 状态管理
ctx.save();                              // 保存状态
ctx.restore();                           // 恢复状态

// 变换
ctx.translate(x, y);                     // 平移
ctx.rotate(angle);                       // 旋转
ctx.scale(x, y);                         // 缩放
ctx.transform(a, b, c, d, e, f);         // 矩阵变换
ctx.setTransform(a, b, c, d, e, f);      // 设置变换矩阵

// 路径 - 开始和关闭
ctx.beginPath();                         // 开始路径
ctx.closePath();                         // 关闭路径

// 路径 - 移动和直线
ctx.moveTo(x, y);                        // 移动到点
ctx.lineTo(x, y);                        // 直线到点

// 路径 - 曲线
ctx.arc(x, y, radius, startAngle, endAngle, counterclockwise); // 圆弧
ctx.arcTo(x1, y1, x2, y2, radius);       // 圆弧连接
ctx.quadraticCurveTo(cpx, cpy, x, y);    // 二次贝塞尔
ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y); // 三次贝塞尔
ctx.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle); // 椭圆

// 矩形
ctx.fillRect(x, y, width, height);       // 填充矩形
ctx.strokeRect(x, y, width, height);     // 描边矩形
ctx.clearRect(x, y, width, height);      // 清除矩形

// 填充和描边
ctx.fill();                              // 填充路径
ctx.stroke();                            // 描边路径
ctx.clip();                              // 裁剪

// 样式
ctx.fillStyle = '#ff0000';               // 填充颜色
ctx.strokeStyle = '#ff0000';            // 描边颜色
ctx.lineWidth = 2;                      // 线宽
ctx.lineCap = 'butt';                    // 端点样式
ctx.lineJoin = 'miter';                  // 连接样式

// 渐变
const gradient = ctx.createLinearGradient(x1, y1, x2, y2); // 线性渐变
const gradient = ctx.createRadialGradient(x1, y1, r1, x2, y2, r2); // 径向渐变
gradient.addColorStop(0, '#ff0000');    // 添加颜色停点

// 图案
const pattern = ctx.createPattern(image, 'repeat'); // 创建图案

// 阴影
ctx.shadowColor = 'rgba(0,0,0,0.5)';     // 阴影颜色
ctx.shadowBlur = 10;                    // 阴影模糊
ctx.shadowOffsetX = 5;                  // 阴影X偏移
ctx.shadowOffsetY = 5;                  // 阴影Y偏移

// 文本
ctx.font = '20px Arial';                 // 字体设置
ctx.fillText(text, x, y);               // 填充文本
ctx.strokeText(text, x, y);             // 描边文本
ctx.measureText(text);                  // 测量文本宽度

// 文本对齐
ctx.textAlign = 'left';                 // 水平对齐
ctx.textBaseline = 'top';               // 垂直对齐

// 图像
ctx.drawImage(image, x, y);             // 绘制图像
ctx.drawImage(image, x, y, width, height); // 缩放绘制
ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh); // 裁剪绘制

// 图像数据
const imageData = ctx.getImageData(x, y, width, height); // 获取图像数据
ctx.putImageData(imageData, x, y);    // 放回图像数据
ctx.createImageData(width, height);   // 创建空白图像数据

// 像素操作
ctx.globalAlpha = 0.5;                 // 全局透明度
ctx.globalCompositeOperation = 'source-over'; // 混合模式
```

---

> 资料整理自 2024 字节跳动、阿里巴巴、拼多多面试
