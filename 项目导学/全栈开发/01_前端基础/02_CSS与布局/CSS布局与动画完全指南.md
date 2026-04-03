# CSS布局与动画完全指南

## 目录

1. [CSS基础深入](#1-css基础深入)
2. [Flexbox弹性布局](#2-flexbox弹性布局)
3. [CSS Grid网格布局](#3-css-grid网格布局)
4. [经典布局方案](#4-经典布局方案)
5. [CSS动画](#5-css动画)
6. [CSS新特性](#6-css新特性)
7. [实战项目](#7-实战项目)

---

## 1. CSS基础深入

### 1.1 选择器优先级

CSS选择器优先级决定了当多个规则应用于同一元素时，哪个规则会生效。理解优先级是编写可维护CSS的基础。

#### 优先级计算规则

CSS优先级采用Specificity（特异性）计算，遵循以下层级：

| 优先级层级 | 选择器类型 | 示例 |
|-----------|-----------|------|
| 最高 (0,0,0,0,0) | CSS !important | `color: red !important;` |
| 高 (1,0,0,0,0) | 内联样式 | `<div style="color: red;">` |
| 高 (0,1,0,0,0) | ID选择器 | `#header { }` |
| 中 (0,0,1,0,0) | 类选择器、属性选择器、伪类 | `.nav { }`, `[type="text"] { }`, `:hover { }` |
| 低 (0,0,0,1,0) | 标签选择器、伪元素 | `div { }`, `::before { }` |
| 最低 (0,0,0,0,1) | 通配符、组合符、否定伪类 | `* { }`, `> { }`, `:not() { }` |

#### 优先级计算示例

```css
/* 优先级计算：(0, 1, 0, 0) = 0,1,0,0 */
#header .nav li:first-child {
    color: blue; /* ID(1) + Class(1) + Tag(2) = (0,1,1,2) */
}

/* 优先级计算：(0, 0, 1, 1) = 0,0,1,1 */
.nav li:first-child {
    color: red; /* Class(1) + Tag(2) = (0,0,1,2) */
}

/* 实际生效的是第一个规则，因为ID选择器权重最高 */
```

#### 优先级进阶规则

```css
/* 1. !important 会覆盖正常优先级规则 */
/* 但应尽量避免使用，因为会破坏CSS级联 */
.header {
    color: blue !important; /* 最高优先级 */
}

/* 2. 内联样式优先级高于外部样式表 */
<!-- <div style="color: red;">内容</div> -->

/* 3. 相同优先级时，后定义的规则生效 */
.rule-a { color: blue; }
.rule-a { color: red; } /* 最终是红色 */

/* 4. :is() 和 :where() 的优先级计算 */
/* :is() 保留内部最高优先级选择器的权重 */
/* :where() 将所有优先级设为0 */
:is(#header, .sidebar) p {
    /* 优先级 = ID选择器的权重 = (1,0,0,0) */
}

:where(#header, .sidebar) p {
    /* 优先级 = (0,0,0,0) */
}
```

#### 实际开发中的优先级建议

```css
/* 最佳实践1：使用类选择器而非ID选择器 */
/* ID选择器优先级过高，难以覆盖 */
.nav-list { }           /* 推荐 */
#nav-list { }           /* 不推荐 */

/* 最佳实践2：避免嵌套过深 */
/* 嵌套过深会增加优先级且降低可读性 */
.article .content .body .text p span { } /* 优先级很高，不推荐 */

/* 最佳实践3：使用BEM命名规范控制优先级 */
/* BEM的高优先级是通过具体类名实现的，可预测 */
.block__element--modifier { } /* 高优先级但不混乱 */

/* 最佳实践4：适当使用 :where() 重置优先级 */
:where(.btn) {
    /* 所有.btn类的元素应用基础样式，优先级为0 */
}
```

### 1.2 层叠规则

层叠（Cascade）是CSS处理多个样式规则冲突的核心机制。浏览器按照以下顺序决定最终样式：

#### 层叠顺序（从低到高）

```
1. 用户代理样式（浏览器默认样式）
2. 用户样式（用户自定义样式）
3. 链接样式（外部CSS文件）
4. 内嵌样式（<style>标签）
5. 内联样式（style属性）
```

#### 层叠算法详解

```css
/* 层叠过程分为以下步骤： */

/* 步骤1：收集所有匹配的规则 */
p.intro { color: blue; }           /* 规则1 */
.intro { color: red; }             /* 规则2 */
p { color: green; }                /* 规则3 */

/* 步骤2：根据优先级排序 */
<!-- <p class="intro">示例文本</p> -->
<!-- 最终结果：蓝色（规则1优先级最高） -->

/* 步骤3：按源码顺序决定相同优先级规则的胜负 */
.link { color: blue; }  /* 先定义 */
.link { color: red; }   /* 后定义，最终是红色 */
```

#### 层叠与继承的区分

```css
/* 层叠：同一元素上多个规则冲突时的处理 */
.parent {
    color: blue;           /* 规则1 */
    font-size: 16px;       /* 规则2 */
}

.child {
    color: red;            /* 层叠：覆盖父元素的color */
    /* font-size自动继承：也是16px */
}

/* 继承：子元素自动获得父元素的某些属性值 */
<div class="parent">
    <div class="child">
        <!-- child会继承parent的font-size，但不继承color -->
    </div>
</div>
```

### 1.3 继承机制

继承允许子元素自动获得父元素的某些样式属性，从而减少重复代码。

#### 可继承属性

```css
/* 常见的可继承属性 */
.inheritable {
    /* 文本相关 */
    color: #333;                      /* 文本颜色 */
    font-family: "Microsoft YaHei"; /* 字体系列 */
    font-size: 16px;                 /* 字体大小 */
    font-style: italic;              /* 字体样式 */
    font-weight: bold;               /* 字体粗细 */
    letter-spacing: 1px;             /* 字间距 */
    line-height: 1.6;                 /* 行高 */
    text-align: center;              /* 文本对齐 */
    text-indent: 2em;                /* 首行缩进 */
    text-transform: uppercase;       /* 文本转换 */
    word-spacing: 2px;                /* 词间距 */

    /* 列表相关 */
    list-style-type: square;         /* 列表标记类型 */
    list-style-position: inside;     /* 列表标记位置 */

    /* 可见性 */
    visibility: visible;             /* 元素可见性 */

    /* 表格边框 */
    border-collapse: collapse;       /* 表格边框合并 */
}

/* 不可继承的属性示例 */
.non-inheritable {
    /* 盒模型相关 */
    width: 100px;
    height: 200px;
    margin: 10px;
    padding: 20px;
    border: 1px solid #ccc;

    /* 定位相关 */
    position: absolute;
    top: 0;
    left: 0;

    /* 背景相关 */
    background-color: #f0f0f0;

    /* 变换与动画 */
    transform: rotate(45deg);
    animation: slide 1s;
}
```

#### 继承控制

```css
/* 1. 使用 inherit 强制继承 */
.parent {
    color: blue;
    border: 1px solid blue;
}

.child {
    /* 显式继承父元素的color */
    color: inherit;

    /* 显式继承父元素的border */
    border: inherit;
}

/* 2. 使用 initial 重置为默认值 */
.child {
    /* 重置为CSS规范的初始值 */
    color: initial;
    border: initial;
}

/* 3. 使用 unset 组合 inherit 和 initial */
.child {
    /* 可继承属性表现为 inherit，不可继承属性表现为 initial */
    all: unset;
}

/* 4. 使用 revert 回退到用户代理样式 */
.child {
    /* 回退到浏览器默认样式 */
    all: revert;
}
```

### 1.4 盒模型详解

盒模型是CSS布局的基础，每个HTML元素都被看作一个矩形盒子，由内容、内边距、边框和外边距组成。

#### 标准盒模型 vs IE盒模型

```css
/* 标准盒模型（W3C盒模型） */
/* 元素宽度 = content的宽度，不包含padding、border、margin */
.standard-box {
    width: 200px;              /* 内容宽度 */
    height: 100px;             /* 内容高度 */
    padding: 20px;             /* 内边距 */
    border: 5px solid #333;    /* 边框 */
    margin: 10px;             /* 外边距 */

    /* 实际占据宽度 = 200 + 20*2 + 5*2 + 10*2 = 270px */
    /* 实际占据高度 = 100 + 20*2 + 5*2 + 10*2 = 170px */

    /* 设置盒模型类型 */
    box-sizing: content-box; /* 默认值，标准盒模型 */
}

/* IE盒模型（替代盒模型） */
/* 元素宽度 = content + padding + border的总宽度 */
.ie-box {
    width: 200px;              /* 包含padding和border的内容宽度 */
    height: 100px;
    padding: 20px;
    border: 5px solid #333;
    margin: 10px;

    /* 实际内容宽度 = 200 - 20*2 - 5*2 = 150px */
    /* 实际占据宽度 = 200 + 10*2 = 220px */

    box-sizing: border-box;   /* IE盒模型 */
}
```

#### 盒模型示意图

```
标准盒模型 (content-box):
┌─────────────────────────────────────┐
│             margin                  │
│  ┌───────────────────────────────┐  │
│  │           border              │  │
│  │  �───────────────────────────┐ │  │
│  │  │         padding          │ │  │
│  │  │  ┌─────────────────────┐ │ │  │
│  │  │  │       content        │ │ │  │
│  │  │  │   (width/height)     │ │ │  │
│  │  │  └─────────────────────┘ │ │  │
│  │  └───────────────────────────┘ │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘

IE盒模型 (border-box):
┌─────────────────────────────────────┐
│             margin                  │
│  ┌───────────────────────────────┐  │
│  │           border              │  │
│  │  ┌───────────────────────────┐ │  │
│  │  │         padding          │ │  │
│  │  │  ┌─────────────────────┐ │ │  │
│  │  │  │       content       │ │ │  │
│  │  │  │  (width包含padding  │ │ │  │
│  │  │  │   和border)         │ │ │  │
│  │  │  └─────────────────────┘ │ │  │
│  │  └───────────────────────────┘ │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

#### 盒模型实战应用

```css
/* 1. 全局设置border-box，便于计算 */
/* 现代CSS开发的标准实践 */
*,
*::before,
*::after {
    box-sizing: border-box;
}

/* 2. 精确控制元素尺寸 */
.card {
    width: 300px;
    padding: 20px;
    border: 1px solid #e0e0e0;

    /* 使用border-box后，内容宽度自动 = 300 - 20*2 - 1*2 = 258px */
}

/* 3. 外边距折叠（Margin Collapsing） */
/* 垂直方向相邻元素的外边距会合并 */
.box1 {
    margin-bottom: 30px;
    height: 100px;
    background: #f00;
}

.box2 {
    margin-top: 20px;
    height: 100px;
    background: #0f0;
}

/* 折叠后的外边距 = max(30px, 20px) = 30px */
/* 两个元素之间只有30px的间距，而不是50px */
```

### 1.5 display属性

display属性决定元素的显示类型，是CSS布局的核心属性之一。

#### display属性值详解

```css
/* 1. display: none */
/* 元素不显示，不占据任何空间 */
.hidden {
    display: none;
}

/* 2. display: block */
/* 块级元素，独占一行，可设置宽高 */
.block-element {
    display: block;
    width: 200px;
    height: 100px;
}

/* 常见的block元素：div, p, h1-h6, ul, ol, li, section, article */

/* 3. display: inline */
/* 行内元素，与其他行内元素共享一行，宽高由内容决定 */
.inline-element {
    display: inline;
    /* 注意：设置width、height、上下margin无效 */
    padding: 5px; /* 上下padding会重叠，不影响布局 */
}

/* 常见的inline元素：span, a, strong, em, label */

/* 4. display: inline-block */
/* 行内块元素，结合两者特点：同行显示，可设置宽高 */
.inline-block-wrapper {
    font-size: 0; /* 消除行内块元素间的空白间隙 */
}

.inline-block-element {
    display: inline-block;
    width: 100px;
    height: 100px;
    font-size: 16px; /* 恢复字体大小 */
}

/* 5. display: flex */
/* 开启弹性盒布局（一维） */
.flex-container {
    display: flex;
}

/* 6. display: grid */
/* 开启网格布局（二维） */
.grid-container {
    display: grid;
}

/* 7. display: inline-flex */
/* 行内弹性盒 */
.inline-flex-container {
    display: inline-flex;
}

/* 8. display: inline-grid */
/* 行内网格 */
.inline-grid-container {
    display: inline-grid;
}

/* 9. display: table系列（表格布局） */
/* 模拟<table>元素的表格布局 */
.table-wrapper {
    display: table;
    width: 100%;
}

.table-row {
    display: table-row;
}

.table-cell {
    display: table-cell;
    padding: 10px;
}

/* 10. display: contents */
/* 元素本身不显示，但其子元素正常显示 */
.contents-wrapper {
    display: contents;
    /* 常用于无障碍访问或布局调整 */
}
```

### 1.6 BFC块级格式化上下文

BFC（Block Formatting Context）是Web页面中一个独立的渲染区域，容器内部的元素与外部元素相互隔离。

#### 创建BFC的条件

```css
/* 1. 根元素 <html> */
html {
    /* 根元素本身就是BFC */
}

/* 2. 设置 overflow 不为 visible */
.bfc-overflow {
    overflow: hidden;    /* 创建BFC */
    overflow: auto;      /* 创建BFC */
    overflow: scroll;   /* 创建BFC */
}

/* 3. 设置 display 为以下值 */
.bfc-display {
    display: flow-root;  /* 专门用于创建BFC，无副作用 */
    display: inline-block;
    display: table-cell;
    display: table-caption;
}

/* 4. 设置 position 为 absolute 或 fixed */
.bfc-position {
    position: absolute;
    position: fixed;
}

/* 5. 设置 float 不为 none */
.bfc-float {
    float: left;
    float: right;
}

/* 6. 设置 display 为 flex 或 grid 的直接子元素 */
.bfc-flex-container {
    display: flex;
}
.bfc-flex-container > * {
    /* flex子元素会自动创建BFC？不对，flex子元素不会创建BFC */
}

.bfc-grid-container {
    display: grid;
}
```

#### BFC的特性与应用

```css
/* BFC特性1：包含内部浮动元素 */
/* 解决父元素高度塌陷问题 */
.float-container {
    display: flow-root; /* 创建BFC */
    /* 或者使用 overflow: hidden; */
}

.float-item {
    float: left;
    width: 100px;
    height: 100px;
}

/* BFC特性2：阻止外边距折叠 */
/* 两个相邻元素垂直方向的外边距会折叠 */
.margin-collapse {
    margin-top: 20px;
    margin-bottom: 30px;
    /* 普通情况下，实际间距 = max(20, 30) = 30px */
}

.bfc-prevent-margin {
    display: flow-root; /* 创建BFC后，margin不再折叠 */
}

/* BFC特性3：阻止元素被浮动元素覆盖 */
.overlap {
    float: left;
    width: 100px;
    height: 100px;
}

.protected {
    display: flow-root; /* 不会被浮动元素覆盖 */
    /* 或者使用 overflow: hidden; */
    /* 或者设置 margin-left: 100px; 配合clear */
}

/* BFC特性4：可包含子元素的定位 */
/* 子元素的position: absolute相对于BFC定位 */
.relative-wrapper {
    position: relative; /* 创建新的BFC？不对，position不创建BFC */
    /* 但结合overflow或其他属性可以创建BFC */
}
```

#### BFC实战案例

```css
/* 案例1：两栏自适应布局（左侧固定宽度，右侧自适应） */
.layout {
    display: flow-root; /* 创建BFC */
}

.sidebar {
    float: left;
    width: 200px;
}

.main {
    /* 创建BFC，包含sidebar并排显示 */
    display: flow-root;
    /* 或者使用 overflow: hidden; */
}

/* 案例2：清除浮动的影响 */
.clearfix {
    display: flow-root;
    /* 现代最佳实践，比:after伪元素更简洁 */
}

/* 案例3：防止文字环绕图片 */
.image-wrapper {
    display: flow-root;
}

.float-image {
    float: left;
    margin-right: 10px;
}

.protected-text {
    /* 不会被浮动图片覆盖 */
    display: flow-root;
}
```

### 1.7 IFC行内格式化上下文

IFC（Inline Formatting Context）是行内元素所在的格式化上下文，影响行内元素的排列方式。

#### IFC核心概念

```css
/* IFC特性1：水平排列 */
/* 行内元素在水平方向上依次排列 */
.inline-wrapper {
    background: #f0f0f0;
    line-height: 1.5;
}

.inline-text {
    /* 行内元素 */
}

.inline-element {
    display: inline;
    /* 上下padding和margin不影响行高计算 */
    padding: 10px 20px;
    margin: 5px 10px;
}

/* IFC特性2：行框计算 */
/* 每行文本形成一个行框，高度由最高元素和最低元素决定 */
.text-wrapper {
    font-size: 16px;
    line-height: 1.5;
    /* 行框高度 = 16 * 1.5 = 24px */
}

.tall-element {
    display: inline-block;
    height: 50px;
    /* 行框高度会扩展以容纳这个元素 */
}

/* IFC特性3：垂直对齐 */
/* 行内元素可设置 vertical-align */
.vertical-demo {
    font-size: 0; /* 消除空白 */
}

.vert-element {
    display: inline-block;
    width: 50px;
    height: 50px;
    vertical-align: top;    /* 顶部对齐 */
    vertical-align: middle;  /* 居中对齐 */
    vertical-align: bottom;  /* 底部对齐 */
    vertical-align: baseline; /* 基线对齐，默认 */
    vertical-align: 10px;     /* 正值向上偏移 */
    vertical-align: -10px;   /* 负值向下偏移 */
}

/* IFC特性4：inline-block基线 */
/* inline-block元素的基线位置取决于内容 */
.inline-block-baseline {
    display: inline-block;
    width: 50px;
    height: 50px;
    border: 1px solid #333;
    /* 有文本时基线是最后一行文本的基线 */
}

.inline-block-baseline::after {
    content: 'text';
    /* 无文本时基线是margin-box的底边 */
}
```

---

## 2. Flexbox弹性布局

### 2.1 Flexbox核心概念

Flexbox（弹性盒子）是CSS3引入的一维布局模型，专门为解决页面布局问题而设计。它可以让容器内的子元素自动分配空间，轻松实现水平/垂直居中、等高列、自适应布局等常见需求。

#### Flexbox布局模型

```
Flexbox布局示意图：

主轴 (Main Axis) 方向：
←─────────────────────────────────→
┌─────────────────────────────────┐
│           Flex Container        │ ↑
│  ┌─────────┬─────────┬─────────┐ │ │
│  │ Flex    │ Flex    │ Flex    │ │ 交叉轴
│  │ Item 1  │ Item 2  │ Item 3  │ │ (Cross Axis)
│  │         │         │         │ │ │
│  └─────────┴─────────┴─────────┘ │ ↓
└─────────────────────────────────┘

交叉轴方向：
──→←──→←──→←──→←──→←──→←──→←──→
```

#### 核心概念速查表

| 概念 | 说明 |
|------|------|
| **Flex Container** | 弹性容器，开启flex布局的元素 |
| **Flex Item** | 弹性项目，容器内的直接子元素 |
| **Main Axis** | 主轴，项目排列的主要方向（默认水平从左到右） |
| **Cross Axis** | 交叉轴，与主轴垂直的轴（默认垂直从上到下） |
| **Main Start/End** | 主轴起始/结束位置 |
| **Cross Start/End** | 交叉轴起始/结束位置 |
| **Main Size** | 项目在主轴方向上的尺寸 |
| **Cross Size** | 项目在交叉轴方向上的尺寸 |

### 2.2 Flex容器属性

```css
/* 1. display: 开启Flex布局 */
/* 块级弹性容器 - 独占一行 */
.flex-container-block {
    display: flex;
}

/* 行内弹性容器 - 与其他行内元素同行 */
.flex-container-inline {
    display: inline-flex;
}

/* 2. flex-direction: 主轴方向 */
.flex-direction-row {
    flex-direction: row;              /* 默认：水平从左到右 */
}

.flex-direction-row-reverse {
    flex-direction: row-reverse;       /* 水平从右到左 */
}

.flex-direction-column {
    flex-direction: column;            /* 垂直从上到下 */
}

.flex-direction-column-reverse {
    flex-direction: column-reverse;    /* 垂直从下到上 */
}

/* 3. flex-wrap: 换行控制 */
.flex-nowrap {
    flex-wrap: nowrap;    /* 默认：不换行，超出容器会压缩项目 */
}

.flex-wrap {
    flex-wrap: wrap;      /* 换行，第一行在上方 */
}

.flex-wrap-reverse {
    flex-wrap: wrap-reverse; /* 换行，第一行在下方 */
}

/* 4. justify-content: 主轴对齐方式 */
/* 定义项目在主轴方向上的对齐方式 */
.justify-flex-start {
    justify-content: flex-start;     /* 默认：起始对齐 */
}

.justify-flex-end {
    justify-content: flex-end;       /* 结束对齐 */
}

.justify-center {
    justify-content: center;         /* 居中对齐 */
}

.justify-space-between {
    justify-content: space-between;  /* 两端对齐，项目间距相等 */
}

.justify-space-around {
    justify-content: space-around;   /* 环绕对齐，项目两侧间距相等 */
}

.justify-space-evenly {
    justify-content: space-evenly;    /* 等间距对齐，所有间距相等 */
}

/* 5. align-items: 交叉轴对齐方式（单行） */
/* 定义项目在交叉轴方向上的对齐方式 */
.align-stretch {
    align-items: stretch;        /* 默认：拉伸填充容器高度 */
}

.align-flex-start {
    align-items: flex-start;     /* 起始对齐（交叉轴起点） */
}

.align-flex-end {
    align-items: flex-end;       /* 结束对齐（交叉轴终点） */
}

.align-center {
    align-items: center;          /* 居中对齐 */
}

.align-baseline {
    align-items: baseline;       /* 基线对齐，按文字基线对齐 */
}

/* 6. align-content: 交叉轴对齐方式（多行） */
/* 定义多根轴线在交叉轴方向上的对齐方式，仅在多行时生效 */
.align-content-stretch {
    align-content: stretch;        /* 默认：拉伸 */
}

.align-content-flex-start {
    align-content: flex-start;     /* 起始对齐 */
}

.align-content-flex-end {
    align-content: flex-end;       /* 结束对齐 */
}

.align-content-center {
    align-content: center;         /* 居中对齐 */
}

.align-content-space-between {
    align-content: space-between;  /* 两端对齐 */
}

.align-content-space-around {
    align-content: space-around;    /* 环绕对齐 */
}

/* 7. gap: 间距设置 */
/* 设置项目之间的间距 */
.gap-example {
    gap: 20px;                /* 行列间距相同 */
    row-gap: 10px;            /* 行间距（交叉轴方向） */
    column-gap: 20px;         /* 列间距（主轴方向） */
}

/* 8. flex-flow: 简写形式 */
/* flex-direction + flex-wrap */
.flex-flow-example {
    flex-flow: row wrap;      /* 水平换行布局 */
    flex-flow: column nowrap; /* 垂直不换行布局 */
}
```

### 2.3 Flex项目属性

```css
/* 1. order: 排列顺序 */
/* 数值越小越靠前，可以是负数 */
.order-item-1 {
    order: 1;                 /* 默认值为0 */
}

.order-item-2 {
    order: 2;
}

.order-item-negative {
    order: -1;                /* 负数优先显示 */
}

/* 2. flex-grow: 放大比例 */
/* 定义项目放大比例，默认为0（不放大） */
.grow-item {
    flex-grow: 1;              /* 占据剩余空间的1份 */
}

.grow-item-double {
    flex-grow: 2;              /* 占据剩余空间的2份 */
}

/* 3. flex-shrink: 缩小比例 */
/* 定义项目缩小比例，默认为1（空间不足时缩小） */
.shrink-item {
    flex-shrink: 1;            /* 默认：可缩小 */
}

.shrink-item-no {
    flex-shrink: 0;            /* 不缩小，保持原始尺寸 */
}

/* 4. flex-basis: 基础尺寸 */
/* 定义项目在主轴方向上的初始尺寸 */
.basis-item {
    flex-basis: 200px;         /* 初始尺寸200px */
}

.basis-item-auto {
    flex-basis: auto;         /* 默认：根据width或内容高度决定 */
}

/* 5. flex: 简写形式 */
/* 推荐使用简写形式，性能更好 */
.flex-shorthand {
    flex: 1;                   /* flex: 1 1 0% - 等分剩余空间 */
}

.flex-shorthand-fixed {
    flex: 0 0 200px;           /* 不放大不缩小，固定200px */
}

.flex-shorthand-auto {
    flex: 1 1 auto;            /* 可放大可缩小自适应 */
}

.flex-shorthand-none {
    flex: none;                /* flex: 0 0 auto - 不参与flex布局 */
}

/* 6. align-self: 单独对齐方式 */
/* 覆盖容器的align-items设置 */
.self-auto {
    align-self: auto;          /* 继承容器align-items */
}

.self-stretch {
    align-self: stretch;       /* 拉伸填充 */
}

.self-flex-start {
    align-self: flex-start;    /* 起始对齐 */
}

.self-flex-end {
    align-self: flex-end;      /* 结束对齐 */
}

.self-center {
    align-self: center;        /* 居中对齐 */
}

.self-baseline {
    align-self: baseline;      /* 基线对齐 */
}
```

### 2.4 居中布局完整指南

居中是CSS布局中最常见的需求，Flexbox提供了最简洁的解决方案。

#### 水平居中

```css
/* 方法1：flexbox水平居中（最常用） */
.horizontal-center-flex {
    display: flex;
    justify-content: center;
}

/* 方法2：grid水平居中 */
.horizontal-center-grid {
    display: grid;
    justify-content: center;
}

/* 方法3：margin auto + flexbox */
.horizontal-center-margin {
    display: flex;
}

.horizontal-center-margin .item {
    margin-left: auto;
    margin-right: auto;
}

/* 方法4：绝对定位 + transform */
.horizontal-center-absolute {
    position: relative;
}

.horizontal-center-absolute .item {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
}
```

#### 垂直居中

```css
/* 方法1：flexbox垂直居中 */
.vertical-center-flex {
    display: flex;
    align-items: center;
    height: 400px;
}

/* 方法2：grid垂直居中 */
.vertical-center-grid {
    display: grid;
    align-items: center;
    height: 400px;
}

/* 方法3：绝对定位 + transform */
.vertical-center-absolute {
    position: relative;
    height: 400px;
}

.vertical-center-absolute .item {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
}
```

#### 水平垂直居中

```css
/* 方法1：flexbox双向居中（推荐） */
.center-both-flex {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
}

/* 方法2：grid place-items（简洁） */
.center-both-grid {
    display: grid;
    place-items: center;
    height: 100vh;
}

/* 方法3：绝对定位 + transform（兼容性好） */
.center-both-absolute {
    position: relative;
    height: 100vh;
}

.center-both-absolute .item {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
}

/* 方法4：flexbox + margin auto */
.center-both-margin {
    display: flex;
    height: 100vh;
}

.center-both-margin .item {
    margin: auto;
}

/* 方法5：grid + margin auto */
.center-both-margin-grid {
    display: grid;
    height: 100vh;
}

.center-both-margin-grid .item {
    margin: auto;
}
```

### 2.5 Flex布局实战

#### 导航栏布局

```css
/* 经典导航栏：Logo左对齐 + 菜单居中 + 操作按钮右对齐 */
.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 24px;
    height: 64px;
    background: #1a1a1a;
    color: #fff;
}

.navbar-logo {
    font-size: 20px;
    font-weight: bold;
}

.navbar-menu {
    display: flex;
    gap: 32px;
    list-style: none;
    margin: 0;
    padding: 0;
}

.navbar-menu a {
    color: #ccc;
    text-decoration: none;
    transition: color 0.3s;
}

.navbar-menu a:hover {
    color: #fff;
}

.navbar-actions {
    display: flex;
    gap: 16px;
}

/* 响应式导航栏 */
@media (max-width: 768px) {
    .navbar {
        flex-wrap: wrap;
        height: auto;
        padding: 16px;
        gap: 16px;
    }

    .navbar-menu {
        order: 3;              /* 移动到第三行 */
        width: 100%;
        justify-content: center;
    }
}
```

#### 卡片网格布局

```css
/* 自适应卡片网格 */
.card-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    padding: 24px;
}

.card {
    flex: 1 1 300px;          /* 最小300px，可放大可缩小 */
    max-width: 400px;          /* 最大400px */
    padding: 24px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 等分布局（3列） */
.equal-grid {
    display: flex;
    gap: 24px;
}

.equal-grid .column {
    flex: 1;                   /* 三等分 */
}

/* 四列等宽布局 */
.quarter-grid {
    display: flex;
    gap: 16px;
}

.quarter-grid .item {
    flex: 1 1 25%;
}

/* 响应式：随屏幕减小列数 */
@media (max-width: 1024px) {
    .quarter-grid .item {
        flex: 1 1 33.33%;     /* 3列 */
    }
}

@media (max-width: 768px) {
    .quarter-grid {
        flex-wrap: wrap;
    }

    .quarter-grid .item {
        flex: 1 1 50%;        /* 2列 */
    }
}

@media (max-width: 480px) {
    .quarter-grid .item {
        flex: 1 1 100%;       /* 1列 */
    }
}
```

#### 圣杯布局（Holy Grail Layout）

```css
/* 圣杯布局：Header + LeftSidebar + Main + RightSidebar + Footer */
.holy-grail {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
}

.holy-grail-header {
    flex: 0 0 60px;          /* 不放大不缩小固定60px */
    background: #333;
    color: #fff;
    display: flex;
    align-items: center;
    padding: 0 24px;
}

.holy-grail-body {
    display: flex;
    flex: 1;                  /* 占据剩余空间 */
}

.holy-grail-sidebar-left {
    flex: 0 0 200px;         /* 固定200px */
    background: #f5f5f5;
    padding: 20px;
}

.holy-grail-main {
    flex: 1;                  /* 自适应填充 */
    padding: 20px;
    min-width: 0;             /* 防止内容溢出 */
}

.holy-grail-sidebar-right {
    flex: 0 0 200px;
    background: #f5f5f5;
    padding: 20px;
}

.holy-grail-footer {
    flex: 0 0 60px;
    background: #333;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* 响应式圣杯布局 */
@media (max-width: 768px) {
    .holy-grail-body {
        flex-direction: column;
    }

    .holy-grail-sidebar-left,
    .holy-grail-sidebar-right {
        flex: 0 0 auto;
    }

    .holy-grail-main {
        order: -1;            /* 移动到最上方 */
    }
}
```

### 2.6 Flex常见坑与解决方案

#### flex-basis与width冲突

```css
/* 坑：flex-basis和width同时设置时的优先级问题 */
/* flex-basis优先级高于width */

.conflict-example {
    flex: 1 1 300px;          /* flex-basis = 300px，width会被忽略 */
    width: 200px;             /* 这个width无效！ */
}

/* 解决方案1：只使用flex属性 */
.solution-1 {
    flex: 1 1 300px;          /* 正确 */
}

/* 解决方案2：flex-basis设为auto */
.solution-2 {
    flex-basis: auto;         /* 让width生效 */
    width: 200px;
    flex: 1 1 auto;           /* 配合flex-grow和flex-shrink */
}

/* 解决方案3：使用min-width和max-width */
.solution-3 {
    flex: 1 1 200px;
    min-width: 200px;
    max-width: 300px;
}
```

#### flex子元素溢出问题

```css
/* 坑：flex子元素不换行超出容器 */
.overflow-container {
    display: flex;
}

.overflow-item {
    flex-shrink: 1;           /* 默认可以缩小，但可能不够 */
    min-width: 0;              /* 关键：允许缩小到0 */
}

/* 解决方案：确保flex容器不溢出 */
.no-overflow {
    min-width: 0;              /* 允许flex项目收缩到内容以下 */
    overflow: hidden;          /* 隐藏溢出内容 */
}
```

#### flex子元素内容不换行

```css
/* 坑：文字或内容不换行导致布局破坏 */
.text-overflow {
    white-space: nowrap;       /* 导致文字不换行 */
    overflow: hidden;
    text-overflow: ellipsis;
}

/* 正确做法：设置合理的min-width */
.proper-overflow {
    min-width: 0;              /* 允许flex项目收缩 */
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
```

---

## 3. CSS Grid网格布局

### 3.1 Grid核心概念

CSS Grid是一个二维布局系统，可以同时控制行和列，适合创建复杂的页面布局。与Flexbox的一维布局不同，Grid可以同时处理水平和垂直方向。

#### Grid布局模型

```
CSS Grid 二维布局示意图：

        列网格线1    列网格线2    列网格线3
            ↓           ↓           ↓
行网格线1 → ┌───────────┬───────────┬───────────┐
            │  (1,1)    │  (1,2)    │  (1,3)    │
行网格线2 → ├───────────┼───────────┼───────────┤
            │  (2,1)    │  (2,2)    │  (2,3)    │
行网格线3 → ├───────────┼───────────┼───────────┤
            │  (3,1)    │  (3,2)    │  (3,3)    │
            └───────────┴───────────┴───────────┘
                  ↑           ↑           ↑
              网格区域    网格区域    网格区域
```

#### 核心概念速查表

| 概念 | 说明 |
|------|------|
| **Grid Container** | 网格容器，开启grid布局的元素 |
| **Grid Item** | 网格项目，容器内的直接子元素 |
| **Grid Line** | 网格线，划分行列的线（列网格线+行网格线） |
| **Grid Track** | 网格轨道，相邻网格线之间的区域（行轨道+列轨道） |
| **Grid Cell** | 网格单元格，由行列网格线围成的最小区域 |
| **Grid Area** | 网格区域，由多个单元格组成的区域 |
| **Gutter** | 网格间距，轨道之间的间隔 |

### 3.2 Grid容器属性

```css
/* 1. display: 开启Grid布局 */
.grid-container-block {
    display: grid;        /* 块级网格容器 */
}

.grid-container-inline {
    display: inline-grid; /* 行内网格容器 */
}

/* 2. grid-template-columns: 定义列轨道 */
.columns-examples {
    /* 具体值 */
    grid-template-columns: 100px 200px 100px;

    /* 百分比 */
    grid-template-columns: 33.33% 33.33% 33.33%;

    /* fr单位（比例份数） */
    grid-template-columns: 1fr 2fr 1fr;

    /* 混合使用 */
    grid-template-columns: 200px 1fr 200px;

    /* repeat函数 */
    grid-template-columns: repeat(3, 1fr);

    /* auto-fill 自动填充 */
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));

    /* auto-fit 自适应填充 */
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

/* 3. grid-template-rows: 定义行轨道 */
.rows-examples {
    grid-template-rows: 100px 200px 100px;
    grid-template-rows: 1fr 2fr 1fr;
    grid-template-rows: repeat(3, 100px);
    grid-template-rows: auto 1fr auto; /* 头尾自适应，中间填满 */
}

/* 4. grid-template-areas: 定义命名区域 */
.named-areas {
    grid-template-areas:
        "header header header"
        "sidebar main aside"
        "footer footer footer";
}

/* 区域命名后，可以直接使用区域名定位项目 */
.named-areas .header {
    grid-area: header;
}

.named-areas .sidebar {
    grid-area: sidebar;
}

.named-areas .main {
    grid-area: main;
}

.named-areas .aside {
    grid-area: aside;
}

.named-areas .footer {
    grid-area: footer;
}

/* 5. gap: 间距 */
.gap-examples {
    gap: 20px;             /* 行列间距相同 */
    row-gap: 10px;         /* 行间距 */
    column-gap: 20px;      /* 列间距 */

    /* 或使用 grid-gap（已废弃） */
    grid-gap: 20px;
}

/* 6. justify-items: 水平对齐（单元格内） */
/* 定义单元格内容在单元格内的水平对齐 */
.justify-items-stretch {
    justify-items: stretch;     /* 默认：拉伸填充 */
}

.justify-items-start {
    justify-items: start;       /* 左对齐 */
}

.justify-items-end {
    justify-items: end;         /* 右对齐 */
}

.justify-items-center {
    justify-items: center;      /* 居中对齐 */
}

/* 7. align-items: 垂直对齐（单元格内） */
/* 定义单元格内容在单元格内的垂直对齐 */
.align-items-stretch {
    align-items: stretch;       /* 默认：拉伸填充 */
}

.align-items-start {
    align-items: start;         /* 顶部对齐 */
}

.align-items-end {
    align-items: end;           /* 底部对齐 */
}

.align-items-center {
    align-items: center;        /* 居中对齐 */
}

/* 8. place-items: align-items + justify-items 简写 */
.place-items-center {
    place-items: center;        /* 双向居中 */
}

.place-items-start-end {
    place-items: start end;    /* 顶部右对齐 */
}

/* 9. justify-content: 水平对齐（整个网格） */
/* 当网格总宽度小于容器时的对齐方式 */
.justify-content-examples {
    justify-content: stretch;        /* 默认：拉伸填满 */
    justify-content: start;          /* 左对齐 */
    justify-content: end;            /* 右对齐 */
    justify-content: center;         /* 居中 */
    justify-content: space-between;  /* 两端对齐 */
    justify-content: space-around;   /* 环绕对齐 */
    justify-content: space-evenly;   /* 等间距 */
}

/* 10. align-content: 垂直对齐（整个网格） */
/* 当网格总高度小于容器时的对齐方式 */
.align-content-examples {
    align-content: stretch;         /* 默认：拉伸填满 */
    align-content: start;           /* 顶部对齐 */
    align-content: end;             /* 底部对齐 */
    align-content: center;          /* 居中 */
    align-content: space-between;   /* 两端对齐 */
    align-content: space-around;    /* 环绕对齐 */
    align-content: space-evenly;    /* 等间距 */
}

/* 11. place-content: align-content + justify-content 简写 */
.place-content-center {
    place-content: center;
}

/* 12. grid-auto-flow: 自动流动方向 */
.flow-examples {
    grid-auto-flow: row;           /* 默认：按行填充 */
    grid-auto-flow: column;        /* 按列填充 */
    grid-auto-flow: dense;         /* 紧密填充（填补空白） */
    grid-auto-flow: row dense;     /* 按行紧密填充 */
    grid-auto-flow: column dense;  /* 按列紧密填充 */
}

/* 13. grid-auto-columns/rows: 自动创建的轨道尺寸 */
.auto-track-size {
    grid-auto-columns: 100px;     /* 自动创建的列宽100px */
    grid-auto-rows: minmax(100px, auto); /* 自动行高最小100px，最大自适应 */
}
```

### 3.3 Grid项目属性

```css
/* 1. grid-column-start/end: 列位置 */
.column-position {
    grid-column-start: 1;              /* 从第1条列网格线开始 */
    grid-column-end: 3;               /* 到第3条列网格线结束（跨越1列） */

    /* 简写形式 */
    grid-column: 1 / 3;               /* 从第1条到第3条 */
    grid-column: 1 / span 2;          /* 跨越2列 */
    grid-column: 1 / -1;              /* -1表示最后一条网格线 */
    grid-column: span 2 / 5;          /* 从当前列开始跨越2列，到第5条线结束 */
}

/* 2. grid-row-start/end: 行位置 */
.row-position {
    grid-row-start: 1;
    grid-row-end: 3;

    /* 简写形式 */
    grid-row: 1 / 3;
    grid-row: 1 / span 2;
    grid-row: span 2 / 5;
}

/* 3. grid-area: 区域名称或位置 */
.area-position {
    /* 使用命名区域 */
    grid-area: header;

    /* 使用位置（row-start / col-start / row-end / col-end） */
    grid-area: 1 / 1 / 3 / 3;         /* 占据第1-2行，第1-2列 */
}

/* 4. justify-self: 单独水平对齐 */
/* 覆盖容器的justify-items */
.self-horizontal {
    justify-self: stretch;            /* 默认：拉伸 */
    justify-self: start;              /* 左对齐 */
    justify-self: end;                /* 右对齐 */
    justify-self: center;             /* 居中 */
}

/* 5. align-self: 单独垂直对齐 */
/* 覆盖容器的align-items */
.self-vertical {
    align-self: stretch;              /* 默认：拉伸 */
    align-self: start;                /* 顶部对齐 */
    align-self: end;                  /* 底部对齐 */
    align-self: center;               /* 居中 */
}

/* 6. place-self: align-self + justify-self 简写 */
.self-both {
    place-self: center;               /* 双向居中 */
}
```

### 3.4 命名网格线

```css
/* 命名网格线：使用 [] 定义线名 */
.named-lines {
    grid-template-columns:
        [full-start] 1fr
        [content-start] 200px
        [content-end] 1fr
        [full-end];

    grid-template-rows:
        [header-start] 60px
        [header-end content-start] 1fr
        [content-end footer-start] 60px
        [footer-end];
}

/* 使用命名线定位项目 */
.named-lines .full-width {
    grid-column: full-start / full-end; /* 占据全宽 */
}

.named-lines .main-content {
    grid-column: content-start / content-end;
    grid-row: content-start / content-end;
}

/* 重复命名：同一行可以有多个同名的网格线 */
.multi-named {
    grid-template-columns:
        [col-start] 1fr
        [col-start] 1fr
        [col-end];

    /* 项目可以使用 -start 和 -end 后缀 */
    .item {
        grid-column: col-start / col-end; /* 跨越两个1fr */
    }
}

/* 使用 line-name <integer> 精确定位 */
.explicit-line {
    grid-template-columns:
        [first] 100px
        [second] 100px
        [third] 100px
        [fourth] 100px
        [fifth];

    .span-two {
        grid-column: second / fourth; /* 从第2条到第4条 */
    }
}
```

### 3.5 repeat()、minmax()、auto-fill、auto-fit

```css
/* 1. repeat() 函数：重复轨道定义 */
/* 基本用法 */
.repeat-basic {
    grid-template-columns: repeat(3, 1fr);
    /* 等同于: 1fr 1fr 1fr */
}

/* 重复多次 */
.repeat-multiple {
    grid-template-columns: repeat(2, 100px 200px);
    /* 等同于: 100px 200px 100px 200px */
}

/* 使用auto-fill自动填充 */
.auto-fill-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    /* 列宽最小200px，最大平分剩余空间 */
    /* 自动计算能容纳多少列 */
}

/* 使用auto-fit自适应填充 */
.auto-fit-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    /* 与auto-fill类似，但当列数不满时会合并空白空间 */
}

/* auto-fill vs auto-fit 的区别 */
/* 容器宽度 900px，子元素最小 200px */

/* auto-fill：尽可能多地创建列，即使为空 */
.auto-fill-example {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    /* 900px / 200px = 4.5，创建5列（最后1列可能为空） */
}

/* auto-fit：只创建实际需要的列数，空白列被合并 */
.auto-fit-example {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    /* 900px / 200px = 4.5，实际创建4列，空白合并 */
}

/* 2. minmax() 函数：定义轨道尺寸范围 */
/* 固定+自适应 */
.minmax-fixed-auto {
    grid-template-columns: 200px minmax(200px, 1fr);
    /* 第一列固定200px，第二列最小200px最大无限 */
}

/* 自适应+固定 */
.minmax-auto-fixed {
    grid-template-columns: minmax(200px, 1fr) 200px;
    /* 第一列最小200px最大无限，第二列固定200px */
}

/* 内容自适应 */
.minmax-content {
    grid-template-columns: minmax(max-content, 1fr) 200px;
    /* 第一列根据内容自适应，最小1fr */
}

/* 常用模式 */
.minmax-common {
    grid-template-columns:
        200px                  /* 固定宽度侧边栏 */
        minmax(300px, 1fr)    /* 自适应主内容区 */
        200px;                /* 固定宽度侧边栏 */
}

/* 3. 组合使用 */
.combined {
    grid-template-columns:
        repeat(3, minmax(100px, 1fr)); /* 3列自适应 */

    grid-template-rows:
        auto
        minmax(100px, auto)
        auto;
}

/* 4. 实战：响应式栅格系统 */
.responsive-grid {
    display: grid;
    grid-template-columns:
        repeat(auto-fit, minmax(280px, 1fr));
    gap: 24px;
}

/* 5. masonry布局效果（类似Pinterest） */
.masonry-like {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-auto-rows: 100px;
    gap: 16px;
}

.masonry-item-tall {
    grid-row: span 2;
}

.masonry-item-wide {
    grid-column: span 2;
}
```

### 3.6 Grid vs Flex适用场景

#### 选择Flexbox的场景

```css
/* 1. 一维布局：单一方向上的排列 */
/* 导航菜单 */
.flex-nav {
    display: flex;
    gap: 24px;
    justify-content: center;
}

/* 2. 列表/网格项目等分布局 */
.flex-list {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
}

.flex-list-item {
    flex: 1 1 calc(25% - 16px);
    min-width: 200px;
}

/* 3. 内容自适应分配 */
.flex-remaining {
    display: flex;
}

.fixed-sidebar {
    flex: 0 0 250px;  /* 固定宽度 */
}

.flexible-main {
    flex: 1;          /* 占据剩余空间 */
}

/* 4. 元素对齐（特别是垂直居中） */
.flex-center {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 400px;
}
```

#### 选择Grid的场景

```css
/* 1. 二维布局：同时控制行和列 */
/* 页面整体布局 */
.grid-page {
    display: grid;
    grid-template:
        "header header" 60px
        "sidebar main" 1fr
        "footer footer" 60px
        / 200px 1fr;
}

.grid-page > header { grid-area: header; }
.grid-page > aside  { grid-area: sidebar; }
.grid-page > main   { grid-area: main; }
.grid-page > footer { grid-area: footer; }

/* 2. 精确的网格对齐 */
/* 相册/卡片网格 */
.grid-gallery {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-auto-rows: 200px;
    gap: 10px;
}

/* 3. 复杂的不规则布局 */
/* 报纸/杂志排版风格 */
.magazine-layout {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    grid-template-rows: repeat(6, auto);
    gap: 20px;
}

.magazine-hero {
    grid-column: 1 / 4;
    grid-row: 1 / 3;
}

.magazine-sidebar {
    grid-column: 4 / 7;
    grid-row: 1 / 4;
}

.magazine-content {
    grid-column: 1 / 5;
    grid-row: 3 / 6;
}
```

#### Grid vs Flex对比表

| 特性 | Flexbox | CSS Grid |
|------|---------|----------|
| **维度** | 一维（单行或单列） | 二维（行和列同时） |
| **布局方式** | 项目在主轴上依次排列 | 项目在网格轨道中定位 |
| **适用场景** | 导航、列表、均匀分布 | 页面布局、相册、仪表盘 |
| **对齐方式** | justify-content + align-items | justify-items + align-items + justify-content + align-content |
| **灵活性** | 内容驱动（内容决定尺寸） | 容器驱动（容器决定布局） |
| **学习难度** | 较简单 | 较复杂 |
| **浏览器支持** | 良好（IE11部分支持） | 良好（IE10部分支持） |
| **配合使用** | 可与Grid嵌套使用 | 可与Flexbox嵌套使用 |

### 3.7 Grid实战案例

#### 响应式栅格系统

```css
/* 12列栅格系统 */
.grid-system {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 24px;
    max-width: 1200px;
    margin: 0 auto;
}

/* 12列中占据不同列数 */
.col-1  { grid-column: span 1; }
.col-2  { grid-column: span 2; }
.col-3  { grid-column: span 3; }
.col-4  { grid-column: span 4; }
.col-6  { grid-column: span 6; }
.col-8  { grid-column: span 8; }
.col-12 { grid-column: span 12; }

/* 偏移量 */
.offset-1 { grid-column-start: 2; }
.offset-3 { grid-column-start: 4; }
.offset-center { grid-column: 3 / span 8; }

/* 响应式断点 */
@media (max-width: 1024px) {
    .grid-system {
        grid-template-columns: repeat(8, 1fr);
    }
    .col-6 { grid-column: span 8; }
    .col-4 { grid-column: span 4; }
}

@media (max-width: 768px) {
    .grid-system {
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
    }
    [class^="col-"] {
        grid-column: span 4;
    }
}

@media (max-width: 480px) {
    .grid-system {
        grid-template-columns: 1fr;
    }
    [class^="col-"] {
        grid-column: 1 / -1;
    }
}
```

#### 看板布局（类似Trello）

```css
/* 看板布局 */
.kanban-board {
    display: grid;
    grid-template-columns: 280px repeat(auto-fit, 280px);
    gap: 16px;
    padding: 16px;
    overflow-x: auto;
}

.kanban-column {
    background: #f5f5f5;
    border-radius: 8px;
    padding: 12px;
    min-height: 500px;
}

.kanban-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e0e0e0;
}

.kanban-cards {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.kanban-card {
    background: #fff;
    border-radius: 6px;
    padding: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    cursor: grab;
    transition: transform 0.2s, box-shadow 0.2s;
}

.kanban-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.kanban-card:active {
    cursor: grabbing;
}

.kanban-add {
    margin-top: auto;
    padding: 8px;
    text-align: center;
    color: #666;
    cursor: pointer;
    border-radius: 4px;
    transition: background 0.2s;
}

.kanban-add:hover {
    background: #e8e8e8;
}
```

---

## 4. 经典布局方案

### 4.1 居中布局

#### 多种居中方法对比

```css
/* 方法1：margin auto + 固定宽度 */
.center-margin {
    width: 300px;
    margin: 0 auto;
    /* 适用于块级元素，需要知道宽度 */
}

/* 方法2：flexbox */
.center-flex {
    display: flex;
    justify-content: center;
    align-items: center;
    /* 适用于任意元素，推荐 */
}

/* 方法3：grid */
.center-grid {
    display: grid;
    place-items: center;
    /* 简洁优雅，推荐 */
}

/* 方法4：绝对定位 + transform */
.center-absolute {
    position: relative;
}

.center-absolute .content {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    /* 适用于需要脱离文档流的场景 */
}

/* 方法5：绝对定位 + margin负值 */
.center-absolute-margin {
    position: relative;
}

.center-absolute-margin .content {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 300px;
    height: 200px;
    margin-left: -150px;  /* 宽度的一半 */
    margin-top: -100px;   /* 高度的一半 */
    /* 适用于知道固定尺寸的情况 */
}

/* 方法6：视口单位居中 */
.center-viewport {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    /* 相对于视口居中 */
}

/* 方法7：table布局居中（传统方法） */
.center-table {
    display: table-cell;
    vertical-align: middle;
    text-align: center;
    width: 100%;
    height: 400px;
}

.center-table .content {
    display: inline-block;
    /* 需要inline-block配合 */
}
```

### 4.2 两栏布局

#### float实现

```css
/* 左侧固定 + 右侧自适应 */
.float-layout {
    overflow: hidden; /* 创建BFC包含浮动元素 */
}

.float-layout .sidebar {
    float: left;
    width: 200px;
}

.float-layout .main {
    margin-left: 200px;
}

/* 右侧固定 + 左侧自适应 */
.float-layout-reverse {
    overflow: hidden;
}

.float-layout-reverse .sidebar {
    float: right;
    width: 200px;
}

.float-layout-reverse .main {
    margin-right: 200px;
}
```

#### flex实现

```css
/* 左侧固定 + 右侧自适应 */
.flex-two-column {
    display: flex;
}

.flex-two-column .sidebar {
    flex: 0 0 200px;
}

.flex-two-column .main {
    flex: 1;
}

/* 右侧固定 + 左侧自适应 */
.flex-two-column-reverse {
    display: flex;
}

.flex-two-column-reverse .sidebar {
    order: 2;
    flex: 0 0 200px;
}

.flex-two-column-reverse .main {
    order: 1;
    flex: 1;
}
```

#### grid实现

```css
/* 左侧固定 + 右侧自适应 */
.grid-two-column {
    display: grid;
    grid-template-columns: 200px 1fr;
}

/* 右侧固定 + 左侧自适应 */
.grid-two-column-reverse {
    display: grid;
    grid-template-columns: 1fr 200px;
}

/* 两栏等宽 */
.grid-two-equal {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
}
```

### 4.3 三栏布局

#### 圣杯布局（Holy Grail）

```css
/* 圣杯布局：两侧固定中间自适应 */
.holy-grail {
    display: flex;
    min-height: 100vh;
}

.holy-grail header {
    flex: 0 0 60px;
    background: #333;
    color: #fff;
}

.holy-grail-body {
    display: flex;
    flex: 1;
    min-width: 0;
}

.holy-grail-body nav {
    flex: 0 0 150px;
    background: #f5f5f5;
}

.holy-grail-body main {
    flex: 1;
    padding: 20px;
    min-width: 0;
}

.holy-grail-body aside {
    flex: 0 0 150px;
    background: #f5f5f5;
}

.holy-grail footer {
    flex: 0 0 60px;
    background: #333;
    color: #fff;
}

/* 响应式圣杯 */
@media (max-width: 768px) {
    .holy-grail-body {
        flex-direction: column;
    }

    .holy-grail-body nav,
    .holy-grail-body aside {
        flex: 0 0 auto;
    }

    .holy-grail-body main {
        order: -1;
    }
}
```

#### 双飞翼布局

```css
/* 双飞翼布局：中间栏优先渲染 */
.double-wing {
    display: flex;
    min-height: 100vh;
}

.double-wing header {
    flex: 0 0 60px;
    background: #333;
    color: #fff;
}

.double-wing footer {
    flex: 0 0 60px;
    background: #333;
    color: #fff;
}

.double-wing .main-wrapper {
    flex: 1;
    display: flex;
    min-width: 0;
}

.double-wing .main {
    flex: 1;
    min-width: 0;
    padding: 20px;
    /* 主体内容在DOM中优先渲染 */
}

.double-wing .left {
    flex: 0 0 150px;
    background: #f5f5f5;
    /* 左侧边栏 */
}

.double-wing .right {
    flex: 0 0 150px;
    background: #f5f5f5;
    /* 右侧边栏 */
}
```

#### grid实现三栏布局

```css
/* grid实现圣杯布局 */
.grid-holy-grail {
    display: grid;
    grid-template:
        "header header header" 60px
        "nav main aside" 1fr
        "footer footer footer" 60px
        / 150px 1fr 150px;
    min-height: 100vh;
}

.grid-holy-grail header { grid-area: header; }
.grid-holy-grail nav    { grid-area: nav; }
.grid-holy-grail main   { grid-area: main; }
.grid-holy-grail aside  { grid-area: aside; }
.grid-holy-grail footer { grid-area: footer; }

/* 响应式 */
@media (max-width: 768px) {
    .grid-holy-grail {
        grid-template:
            "header" 60px
            "main" 1fr
            "nav" auto
            "aside" auto
            "footer" 60px
            / 1fr;
    }

    .grid-holy-grail nav,
    .grid-holy-grail aside {
        /* 恢复为文档流顺序 */
    }
}
```

### 4.4 Sticky Footer布局

当页面内容不足一屏时，footer固定在底部；当内容超出时，footer随内容滚动。

#### flex实现（最推荐）

```css
/* Sticky Footer - Flexbox实现 */
.sticky-footer-flex {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
}

.sticky-footer-flex .content {
    flex: 1;               /* 内容区域占据所有可用空间 */
    padding: 20px;
}

.sticky-footer-flex header,
.sticky-footer-flex footer {
    flex: 0 0 auto;        /* 头脚区域不伸缩 */
    background: #333;
    color: #fff;
    padding: 16px 24px;
}

/* 变体：内容区域有最小高度 */
.sticky-footer-flex .content {
    flex: 1;
    min-height: 400px;
}
```

#### grid实现

```css
/* Sticky Footer - Grid实现 */
.sticky-footer-grid {
    display: grid;
    grid-template-rows: auto 1fr auto;
    min-height: 100vh;
}

.sticky-footer-grid header { /* 头部 */ }
.sticky-footer-grid main   { padding: 20px; }
.sticky-footer-grid footer { /* 底部 */ }
```

#### 传统实现

```css
/* Sticky Footer - 传统实现（兼容性好） */
.sticky-footer-wrapper {
    min-height: 100vh;
    display: table;
    width: 100%;
}

.sticky-footer-content {
    display: table-row;
    height: 100%;
}

.sticky-footer-content main {
    padding: 20px;
}

.sticky-footer-footer {
    display: table-row;
    height: 1px;  /* 或 auto */
}
```

### 4.5 响应式布局

#### 媒体查询断点设计

```css
/* 移动优先策略：从小屏幕开始，逐步增强 */

/* 默认（手机 portrait） */
.container {
    width: 100%;
    padding: 12px;
}

.sidebar {
    display: none; /* 默认隐藏 */
}

.main {
    width: 100%;
}

/* 手机 landscape / 平板 portrait (>= 576px) */
@media (min-width: 576px) {
    .container {
        padding: 16px;
    }
}

/* 平板 landscape / 小桌面 (>= 768px) */
@media (min-width: 768px) {
    .container {
        max-width: 720px;
        margin: 0 auto;
    }

    .sidebar {
        display: block;
        float: left;
        width: 200px;
    }

    .main {
        margin-left: 220px;
    }
}

/* 桌面 (>= 992px) */
@media (min-width: 992px) {
    .container {
        max-width: 960px;
    }

    .sidebar {
        width: 250px;
    }

    .main {
        margin-left: 270px;
    }
}

/* 大桌面 (>= 1200px) */
@media (min-width: 1200px) {
    .container {
        max-width: 1140px;
    }
}

/* 超大桌面 (>= 1400px) */
@media (min-width: 1400px) {
    .container {
        max-width: 1320px;
    }
}
```

#### 常见响应式模式

```css
/* 1. 列数响应式 */
.responsive-columns {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
}

.responsive-columns .column {
    flex: 1 1 100%; /* 默认1列 */
}

@media (min-width: 576px) {
    .responsive-columns .column {
        flex: 1 1 calc(50% - 12px); /* 2列 */
    }
}

@media (min-width: 992px) {
    .responsive-columns .column {
        flex: 1 1 calc(33.33% - 16px); /* 3列 */
    }
}

/* 2. 元素显示/隐藏 */
.hide-on-mobile {
    /* 默认显示 */
}

@media (max-width: 767px) {
    .hide-on-mobile {
        display: none;
    }
}

.show-on-mobile {
    display: none;
}

@media (max-width: 767px) {
    .show-on-mobile {
        display: block;
    }
}

/* 3. 字体响应式 */
.responsive-text {
    font-size: 14px;
}

@media (min-width: 768px) {
    .responsive-text {
        font-size: 16px;
    }
}

@media (min-width: 1200px) {
    .responsive-text {
        font-size: 18px;
    }
}

/* 4. 间距响应式 */
.responsive-spacing {
    padding: 12px;
}

@media (min-width: 768px) {
    .responsive-spacing {
        padding: 24px;
    }
}

@media (min-width: 1200px) {
    .responsive-spacing {
        padding: 32px 48px;
    }
}
```

---

## 5. CSS动画

### 5.1 transition过渡动画

transition属性用于在属性值变化时添加平滑的过渡效果。

#### transition基础语法

```css
/* transition: property duration timing-function delay */
.transition-basic {
    transition: all 0.3s ease;
    /* transition: all 300ms ease; */
}

/* 分别设置各属性 */
.transition-separated {
    transition-property: background-color, transform;
    transition-duration: 0.3s, 0.5s;
    transition-timing-function: ease, ease-out;
    transition-delay: 0s, 0.1s;
}

/* 简写形式 */
.transition-shorthand {
    transition: background-color 0.3s ease 0s,
                transform 0.5s ease-out 0.1s;
}
```

#### 常用timing-function

```css
/* 预定义 timing-function */
.timing-linear {
    transition-timing-function: linear;
    /* 匀速运动 */
}

.timing-ease {
    transition-timing-function: ease;
    /* 默认，慢-快-慢 */
}

.timing-ease-in {
    transition-timing-function: ease-in;
    /* 慢-快 */
}

.timing-ease-out {
    transition-timing-function: ease-out;
    /* 快-慢 */
}

.timing-ease-in-out {
    transition-timing-function: ease-in-out;
    /* 慢-快-慢 */
}

.timing-step-start {
    transition-timing-function: step-start;
    /* 直接跳到终点 */
}

.timing-step-end {
    transition-timing-function: step-end;
    /* 在终点前直接跳 */
}

.timing-steps {
    transition-timing-function: steps(4, end);
    /* 分4步跳转 */
}

/* 自定义贝塞尔曲线 cubic-bezier */
.timing-custom {
    /* cubic-bezier(x1, y1, x2, y2) */
    transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
    /* 弹跳效果 */
}

.timing-bounce {
    transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
    /* 更明显的弹跳 */
}
```

#### transition实战应用

```css
/* 按钮悬停效果 */
.btn {
    padding: 12px 24px;
    background: #007bff;
    color: #fff;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition:
        background-color 0.3s ease,
        transform 0.2s ease,
        box-shadow 0.3s ease;
}

.btn:hover {
    background: #0056b3;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.4);
}

.btn:active {
    transform: translateY(0);
}

/* 卡片悬停效果 */
.card {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition:
        transform 0.3s ease,
        box-shadow 0.3s ease;
}

.card:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

/* 图片缩放效果 */
.image-wrapper {
    overflow: hidden;
    border-radius: 8px;
}

.image-wrapper img {
    width: 100%;
    height: auto;
    transition: transform 0.5s ease;
}

.image-wrapper:hover img {
    transform: scale(1.1);
}

/* 下拉菜单 */
.dropdown {
    position: relative;
}

.dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition:
        opacity 0.3s ease,
        transform 0.3s ease,
        visibility 0.3s;
}

.dropdown:hover .dropdown-menu {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
}

/* 页面切换过渡 */
.page {
    opacity: 1;
    transform: translateX(0);
    transition:
        opacity 0.4s ease,
        transform 0.4s ease;
}

.page.exiting {
    opacity: 0;
    transform: translateX(-20px);
}

.page.entering {
    opacity: 0;
    transform: translateX(20px);
}
```

### 5.2 @keyframes动画

@keyframes用于定义更复杂的动画序列，支持多步骤和循环。

#### @keyframes基础语法

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

/* 使用百分比定义多步骤 */
@keyframes complexAnimation {
    0% {
        transform: translateX(0);
        background: #ff0000;
    }
    25% {
        transform: translateX(100px);
        background: #00ff00;
    }
    50% {
        transform: translateX(100px) rotate(180deg);
        background: #0000ff;
    }
    75% {
        transform: translateX(0) rotate(360deg);
        background: #ffff00;
    }
    100% {
        transform: translateX(0);
        background: #ff0000;
    }
}

/* 应用动画 */
.animated-element {
    animation: complexAnimation 2s ease-in-out;
    /* animation: name duration timing-function delay iteration-count direction fill-mode; */
}
```

#### animation属性详解

```css
/* 1. animation-name: 动画名称 */
.animation-name {
    animation-name: fadeIn;
    animation-name: slideIn, pulse, shake;
    /* 可以同时应用多个动画 */
}

/* 2. animation-duration: 动画时长 */
.animation-duration {
    animation-duration: 0.5s;
    animation-duration: 2s;
    animation-duration: 200ms;
}

/* 3. animation-timing-function: 时间函数 */
.animation-timing {
    animation-timing-function: ease;
    animation-timing-function: linear;
    animation-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* 4. animation-delay: 延迟 */
.animation-delay {
    animation-delay: 0s;       /* 默认无延迟 */
    animation-delay: 0.5s;       /* 延迟0.5秒 */
    animation-delay: -1s;       /* 从动画1秒处开始 */
}

/* 5. animation-iteration-count: 循环次数 */
.animation-count {
    animation-iteration-count: 1;       /* 播放1次 */
    animation-iteration-count: 3;       /* 播放3次 */
    animation-iteration-count: infinite; /* 无限循环 */
}

/* 6. animation-direction: 播放方向 */
.animation-direction {
    animation-direction: normal;        /* 正常播放 */
    animation-direction: reverse;       /* 反向播放 */
    animation-direction: alternate;     /* 交替播放（正-反-正...） */
    animation-direction: alternate-reverse; /* 交替反向（反-正-反...） */
}

/* 7. animation-fill-mode: 播放前后状态 */
.animation-fill {
    animation-fill-mode: none;         /* 默认，回到原始状态 */
    animation-fill-mode: forwards;      /* 停在最后一帧 */
    animation-fill-mode: backwards;     /* 应用第一帧状态 */
    animation-fill-mode: both;          /* 同时应用forwards和backwards */
}

/* 8. animation-play-state: 播放/暂停 */
.animation-play {
    animation-play-state: running;     /* 播放 */
    animation-play-state: paused;       /* 暂停 */
}

/* 9. animation简写 */
.animation-shorthand {
    animation:
        fadeIn 0.5s ease 0s 1 normal forwards,
        slideIn 0.5s ease 0.3s 1 alternate forwards;
}

/* 完整形式 */
.animation-complete {
    animation-name: fadeIn;
    animation-duration: 0.5s;
    animation-timing-function: ease;
    animation-delay: 0s;
    animation-iteration-count: 1;
    animation-direction: normal;
    animation-fill-mode: forwards;
}
```

### 5.3 动画性能优化

CSS动画性能的关键是只动画能利用GPU加速的属性。

#### GPU加速属性

```css
/* GPU加速的属性（推荐动画） */
/*
 * transform: translate(), scale(), rotate(), skew()
 * opacity
 * filter (部分)
 * clip-path
 */

/* 最佳性能动画 */
.perfect-animation {
    /* 使用transform，触发GPU加速 */
    transform: translate3d(0, 0, 0); /* 强制GPU渲染 */
    transform: translateX(100px);
    transform: scale(1.1);
    transform: rotate(45deg);

    opacity: 0.5; /* 使用opacity，GPU加速合成 */
}

/* 避免动画的属性（触发重排/重绘） */
/*
 * width, height
 * margin, padding
 * top, left, right, bottom
 * font-size, font-family
 * color, background
 * border
 */

/* 低性能动画（尽量避免） */
.poor-animation {
    width: 100px;        /* 触发重排 */
    margin-left: 20px;   /* 触发重排 */
    background: red;     /* 触发重绘 */
    color: blue;         /* 触发重绘 */
}

/* 性能优化技巧 */
.optimized-animation {
    /* 1. 使用transform代替position */
    position: absolute;
    left: 0;
    /* 改为： */
    /* transform: translateX(0); */

    /* 2. 使用opacity + transform组合 */
    /* 不要使用：left + background */
    /* 改为：transform + opacity */

    /* 3. 开启GPU加速 */
    will-change: transform, opacity;
    /* 告诉浏览器即将改变transform和opacity */

    /* 4. 使用contain优化 */
    contain: layout style paint;
    /* 限制动画对其他元素的影响 */
}

/* will-change使用注意 */
/* 过度使用will-change会影响性能 */
.will-change-correct {
    /* 在动画开始前添加 */
    will-change: transform;
    /* 动画结束后移除 */
}

.will-change-wrong {
    /* 不要在大量元素上长时间使用 */
    will-change: all; /* 极差性能 */
}
```

#### 动画性能测试

```css
/* 60fps流畅动画示例 */
.smooth-animation {
    transform: translateX(0);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    /* 使用更平滑的缓动函数 */
}

.smooth-animation:hover {
    transform: translateX(100px);
}

/* 防止动画卡顿 */
.no-jank {
    /* 1. 减少重绘区域 */
    overflow: hidden;

    /* 2. 使用合成层隔离 */
    transform: translateZ(0);
    isolation: isolate;

    /* 3. 避免在动画中改变布局 */
    /* 错误：动画中改变width */
    /* 正确：使用transform: scale() 代替 */
}
```

### 5.4 animation-fill-mode详解

```css
/* fill-mode控制动画在播放前后的状态 */

/* 场景：动画关键帧定义 */
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

/* none（默认）：动画前后保持原状态 */
.fill-none {
    animation-fill-mode: none;
    /* 动画前：元素在原位置，opacity:1 */
    /* 动画后：元素回到原位置，opacity:1 */
}

/* forwards：动画后保持最后一帧 */
.fill-forwards {
    animation-fill-mode: forwards;
    /* 动画前：元素在原位置，opacity:1 */
    /* 动画后：元素在结束位置，opacity:0 */
}

/* backwards：动画前应用第一帧 */
.fill-backwards {
    animation-fill-mode: backwards;
    /* 动画前：元素在开始位置，opacity:0 */
    /* 动画后：元素回到原位置，opacity:1 */
}

/* both：同时应用backwards和forwards */
.fill-both {
    animation-fill-mode: both;
    /* 动画前：元素在开始位置，opacity:0 */
    /* 动画后：元素在结束位置，opacity:0 */
}

/* 实战应用：按钮加载状态 */
.loading-btn {
    position: relative;
    overflow: hidden;
}

.loading-btn::after {
    content: '';
    position: absolute;
    left: -100%;
    top: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.4),
        transparent
    );
    animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
    to {
        left: 100%;
    }
}

.loading-btn .btn-text {
    animation: fadeOut 1.5s forwards;
}

@keyframes fadeOut {
    to {
        opacity: 0;
    }
}
```

### 5.5 逐帧动画与贝塞尔曲线

#### 逐帧动画实现

```css
/* 使用steps()实现逐帧动画 */
/* 适合精灵图动画 */
.sprite-animation {
    width: 100px;
    height: 100px;
    background: url('sprite.png');
    animation: sprite 1s steps(8) infinite;
    /* 8帧精灵图，分8步播放 */
}

@keyframes sprite {
    from {
        background-position: 0 0;
    }
    to {
        background-position: -800px 0; /* 8帧 * 100px */
    }
}

/* 纯CSS逐帧动画：走路小人 */
.walking-figure {
    width: 40px;
    height: 60px;
    background: #333;
    animation: walk 0.6s steps(4) infinite;
}

@keyframes walk {
    0% {
        /* 帧1：左脚向前 */
        clip-path: polygon(0 30%, 50% 30%, 50% 50%, 80% 50%, 80% 60%, 50% 60%, 50% 100%, 20% 100%, 20% 60%, 0 60%);
    }
    25% {
        /* 帧2：双腿并拢 */
    }
    50% {
        /* 帧3：右脚向前 */
    }
    75% {
        /* 帧4：双腿并拢 */
    }
    100% {
        /* 回到帧1 */
    }
}
```

#### 贝塞尔曲线应用

```css
/* 常用贝塞尔曲线 */

/* 1. 标准缓动 */
.standard-ease {
    transition-timing-function: cubic-bezier(0.25, 0.1, 0.25, 1);
    animation-timing-function: cubic-bezier(0.25, 0.1, 0.25, 1);
}

/* 2. 强调效果（慢-快-慢） */
.emphasis-ease {
    transition-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* 3. 减速效果（快-慢） */
.decelerate-ease {
    transition-timing-function: cubic-bezier(0, 0, 0.58, 1);
}

/* 4. 加速效果（慢-快） */
.accelerate-ease {
    transition-timing-function: cubic-bezier(0.42, 0, 1, 1);
}

/* 5. 弹性效果 */
.bounce-ease {
    transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* 6. 特殊弹性 */
.special-bounce {
    transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 7. 线性（不建议使用） */
.linear {
    transition-timing-function: linear;
}

/* 实用曲线库 */
/* 来源：https://easings.net/ */
.ease-in-sine      { transition-timing-function: cubic-bezier(0.47, 0, 0.745, 0.715); }
.ease-out-sine     { transition-timing-function: cubic-bezier(0.39, 0.575, 0.565, 1); }
.ease-in-out-sine  { transition-timing-function: cubic-bezier(0.445, 0.05, 0.55, 0.95); }

.ease-in-quad      { transition-timing-function: cubic-bezier(0.55, 0.085, 0.68, 0.53); }
.ease-out-quad     { transition-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94); }
.ease-in-out-quad { transition-timing-function: cubic-bezier(0.455, 0.03, 0.515, 0.955); }

.ease-in-cubic     { transition-timing-function: cubic-bezier(0.55, 0.055, 0.675, 0.19); }
.ease-out-cubic    { transition-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1); }
.ease-in-out-cubic { transition-timing-function: cubic-bezier(0.645, 0.045, 0.355, 1); }

.ease-in-quart     { transition-timing-function: cubic-bezier(0.895, 0.03, 0.685, 0.22); }
.ease-out-quart    { transition-timing-function: cubic-bezier(0.165, 0.84, 0.44, 1); }
.ease-in-out-quart { transition-timing-function: cubic-bezier(0.77, 0, 0.175, 1); }

.ease-in-quint     { transition-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06); }
.ease-out-quint    { transition-timing-function: cubic-bezier(0.23, 1, 0.32, 1); }
.ease-in-out-quint { transition-timing-function: cubic-bezier(0.86, 0, 0.07, 1); }

.ease-in-expo      { transition-timing-function: cubic-bezier(0.95, 0.05, 0.795, 0.035); }
.ease-out-expo     { transition-timing-function: cubic-bezier(0.19, 1, 0.22, 1); }
.ease-in-out-expo  { transition-timing-function: cubic-bezier(1, 0, 0, 1); }

.ease-in-circ      { transition-timing-function: cubic-bezier(0.6, 0.04, 0.98, 0.335); }
.ease-out-circ     { transition-timing-function: cubic-bezier(0.075, 0.82, 0.165, 1); }
.ease-in-out-circ  { transition-timing-function: cubic-bezier(0.785, 0.135, 0.15, 0.86); }
```

### 5.6 CSS动画实战

#### Loading动画

```css
/* 1. 圆形旋转加载动画 */
.loader-circle {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* 2. 脉冲加载动画 */
.loader-pulse {
    width: 40px;
    height: 40px;
    background: #007bff;
    border-radius: 50%;
    animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
    0%, 100% {
        transform: scale(0);
        opacity: 1;
    }
    50% {
        transform: scale(1);
        opacity: 0.5;
    }
}

/* 3. 三个点跳跃动画 */
.loader-dots {
    display: flex;
    gap: 8px;
}

.loader-dots span {
    width: 12px;
    height: 12px;
    background: #007bff;
    border-radius: 50%;
    animation: bounce 1.4s ease-in-out infinite;
}

.loader-dots span:nth-child(1) { animation-delay: 0s; }
.loader-dots span:nth-child(2) { animation-delay: 0.2s; }
.loader-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
    0%, 80%, 100% {
        transform: translateY(0);
    }
    40% {
        transform: translateY(-20px);
    }
}

/* 4. 进度条加载动画 */
.loader-progress {
    width: 200px;
    height: 8px;
    background: #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
}

.loader-progress::after {
    content: '';
    display: block;
    width: 40%;
    height: 100%;
    background: #007bff;
    border-radius: 4px;
    animation: progress 1.5s ease-in-out infinite;
}

@keyframes progress {
    0% {
        transform: translateX(-100%);
    }
    100% {
        transform: translateX(350%);
    }
}

/* 5. 骨架屏闪烁动画 */
.skeleton {
    background: linear-gradient(
        90deg,
        #f0f0f0 25%,
        #e0e0e0 50%,
        #f0f0f0 75%
    );
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

@keyframes skeleton-shimmer {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}

/* 6. 复杂spinner */
.complex-spinner {
    position: relative;
    width: 60px;
    height: 60px;
}

.complex-spinner::before,
.complex-spinner::after {
    content: '';
    position: absolute;
    border-radius: 50%;
}

.complex-spinner::before {
    width: 100%;
    height: 100%;
    border: 3px solid transparent;
    border-top-color: #007bff;
    animation: spin 1s linear infinite;
}

.complex-spinner::after {
    width: 70%;
    height: 70%;
    top: 15%;
    left: 15%;
    border: 3px solid transparent;
    border-bottom-color: #ff6b6b;
    animation: spin 0.8s linear infinite reverse;
}
```

#### 按钮悬停效果

```css
/* 1. 背景渐变移动 */
.btn-gradient {
    position: relative;
    padding: 12px 32px;
    background: linear-gradient(90deg, #007bff, #00d4ff);
    background-size: 200% 100%;
    transition: background-position 0.5s ease;
}

.btn-gradient:hover {
    background-position: 100% 0;
}

/* 2. 边框扩展效果 */
.btn-border {
    position: relative;
    padding: 12px 32px;
    background: transparent;
    border: 2px solid #007bff;
    color: #007bff;
    overflow: hidden;
    transition: all 0.3s ease;
}

.btn-border::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: #007bff;
    transition: left 0.3s ease;
    z-index: -1;
}

.btn-border:hover {
    color: #fff;
}

.btn-border:hover::before {
    left: 0;
}

/* 3. 缩放效果 */
.btn-scale {
    padding: 12px 32px;
    background: #007bff;
    color: #fff;
    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;
}

.btn-scale:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 20px rgba(0, 123, 255, 0.4);
}

.btn-scale:active {
    transform: scale(0.98);
}

/* 4. 文字抖动 */
.btn-shake {
    padding: 12px 32px;
    background: #007bff;
    color: #fff;
    transition: transform 0.1s;
}

.btn-shake:hover {
    animation: shake 0.5s ease-in-out;
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
}

/* 5. 多个子元素联动 */
.btn-group {
    display: flex;
    overflow: hidden;
    border-radius: 8px;
}

.btn-group .btn {
    padding: 12px 24px;
    background: #007bff;
    color: #fff;
    border: none;
    transition: all 0.3s ease;
}

.btn-group .btn:not(:last-child) {
    border-right: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-group .btn:hover {
    background: #0056b3;
}

.btn-group .btn:first-child:hover {
    transform: translateX(-3px);
}

.btn-group .btn:last-child:hover {
    transform: translateX(3px);
}
```

#### 页面切换动画

```css
/* 页面淡入淡出切换 */
.page-fade {
    animation: fadeIn 0.5s ease forwards;
}

.page-fade-out {
    animation: fadeOut 0.3s ease forwards;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fadeOut {
    from {
        opacity: 1;
        transform: translateY(0);
    }
    to {
        opacity: 0;
        transform: translateY(-20px);
    }
}

/* 页面滑动切换 */
.page-slide-left {
    animation: slideLeftIn 0.5s ease forwards;
}

@keyframes slideLeftIn {
    from {
        transform: translateX(100%);
    }
    to {
        transform: translateX(0);
    }
}

/* 页面缩放切换 */
.page-scale {
    animation: scaleIn 0.4s ease forwards;
}

@keyframes scaleIn {
    from {
        opacity: 0;
        transform: scale(0.9);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

/* 页面翻转效果 */
.page-flip {
    animation: flipIn 0.6s ease forwards;
    transform-style: preserve-3d;
    perspective: 1000px;
}

@keyframes flipIn {
    from {
        transform: rotateY(90deg);
        opacity: 0;
    }
    to {
        transform: rotateY(0);
        opacity: 1;
    }
}
```

---

## 6. CSS新特性

### 6.1 CSS Variables自定义属性

CSS变量允许在CSS中定义可复用的值，提高代码的可维护性。

#### 基础用法

```css
/* 定义CSS变量 */
:root {
    /* 颜色变量 */
    --primary-color: #007bff;
    --secondary-color: #6c757d;
    --success-color: #28a745;
    --danger-color: #dc3545;
    --warning-color: #ffc107;

    /* 字体变量 */
    --font-family-base: "Microsoft YaHei", -apple-system, sans-serif;
    --font-size-base: 16px;
    --line-height-base: 1.5;

    /* 间距变量 */
    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --spacing-xl: 32px;

    /* 圆角变量 */
    --border-radius-sm: 4px;
    --border-radius-md: 8px;
    --border-radius-lg: 12px;

    /* 阴影变量 */
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
    --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

    /* 过渡变量 */
    --transition-fast: 0.15s ease;
    --transition-normal: 0.3s ease;
    --transition-slow: 0.5s ease;
}

/* 使用变量 */
.element {
    color: var(--primary-color);
    background: var(--success-color);
    padding: var(--spacing-md);
    border-radius: var(--border-radius-md);
    transition: var(--transition-normal);
}

/* 变量默认值 */
.fallback {
    color: var(--primary-color, #333);
    /* 如果--primary-color未定义，使用#333 */
}

/* 计算 */
.calculated {
    width: calc(100% - var(--spacing-lg) * 2);
    padding: calc(var(--spacing-md) + 10px);
}
```

#### 变量进阶用法

```css
/* 1. 作用域 */
.local-scope {
    --local-color: #ff6b6b; /* 局部变量 */
    color: var(--local-color);
}

/* 2. JavaScript操作CSS变量 */
.js-variable {
    --dynamic-size: 100px;
    width: var(--dynamic-size);
    height: var(--dynamic-size);
}

/* 在JavaScript中： */
/*
element.style.setProperty('--dynamic-size', '200px');
const value = getComputedStyle(element).getPropertyValue('--dynamic-size');
*/

/* 3. 媒体查询中使用变量 */
.media-vars {
    --container-width: 100%;
    padding: var(--spacing-md);
}

@media (min-width: 768px) {
    .media-vars {
        --container-width: 720px;
        --spacing-md: 24px;
    }
}

@media (min-width: 1200px) {
    .media-vars {
        --container-width: 1140px;
        --spacing-md: 32px;
    }
}

/* 4. 暗色模式支持 */
:root {
    --bg-color: #ffffff;
    --text-color: #333333;
}

[data-theme="dark"] {
    --bg-color: #1a1a1a;
    --text-color: #ffffff;
}

.themed {
    background: var(--bg-color);
    color: var(--text-color);
}

/* 5. 组件化变量 */
.card {
    --card-padding: 16px;
    --card-border-radius: 8px;
    --card-bg: #fff;
    --card-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card {
    padding: var(--card-padding);
    border-radius: var(--card-border-radius);
    background: var(--card-bg);
    box-shadow: var(--card-shadow);
}

/* 覆盖组件变量 */
.card-compact {
    --card-padding: 8px;
}

.card-highlight {
    --card-bg: #fff9e6;
    --card-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
}
```

### 6.2 CSS Grid Subgrid

Subgrid允许嵌套的grid元素继承父grid的轨道，实现对齐。

#### Subgrid基础

```css
/* 父grid定义 */
.parent-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: auto 1fr auto;
    gap: 20px;
    min-height: 100vh;
}

.parent-grid header {
    grid-column: 1 / -1; /* 占据所有列 */
}

.parent-grid footer {
    grid-column: 1 / -1;
}

/* 子grid使用subgrid */
.child-grid {
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: subgrid; /* 继承父grid的列轨道 */
    grid-template-rows: subgrid;   /* 继承父grid的行轨道 */
}

/* 卡片内容对齐 */
.card {
    display: grid;
    grid-template-rows: subgrid;
    grid-row: span 3; /* 跨越父grid的3行 */
}

.card-title {
    /* 第一行对齐 */
}

.card-body {
    /* 第二行对齐 */
}

.card-footer {
    /* 第三行对齐 */
}
```

#### Subgrid实战

```css
/* 相册布局，每个图片标题对齐 */
.gallery {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    grid-auto-rows: auto 1fr auto;
    gap: 16px;
}

.gallery-item {
    display: grid;
    grid-template-rows: subgrid;
    grid-row: span 3;
}

.gallery-item img {
    width: 100%;
    height: 200px;
    object-fit: cover;
}

.gallery-item h3 {
    /* 标题始终对齐 */
}

.gallery-item p {
    /* 描述始终对齐 */
}

/* 复杂表单布局 */
.form-grid {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 16px;
}

.form-row {
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: subgrid;
    /* 标签和输入框对齐 */
}

.form-row label {
    justify-self: end;
    align-self: center;
}

.form-row input {
    /* 输入框对齐 */
}
```

### 6.3 Container Queries容器查询

容器查询允许根据容器自身的尺寸而不是视口尺寸来应用样式。

#### 基础用法

```css
/* 1. 定义容器 */
.card-container {
    container-type: inline-size;
    container-name: card;
    /* 或使用简写 */
    container: card / inline-size;
}

/* 2. 容器查询样式 */
.card {
    display: flex;
    flex-direction: column;
}

/* 当容器宽度 >= 400px 时应用 */
@container card (min-width: 400px) {
    .card {
        flex-direction: row;
    }

    .card-image {
        width: 200px;
    }
}

/* 3. 默认样式 + 增强样式 */
@container card (max-width: 399px) {
    .card-image {
        height: 150px;
    }
}
```

#### 容器查询实战

```css
/* 响应式卡片组件 */
.card-wrapper {
    container-type: inline-size;
    container-name: wrapper;
    max-width: 100%;
}

.feature-card {
    padding: 16px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
}

/* 小容器样式 */
@container wrapper (max-width: 300px) {
    .feature-card {
        padding: 12px;
    }

    .feature-card h3 {
        font-size: 14px;
    }

    .feature-card p {
        display: none; /* 小容器隐藏描述 */
    }
}

/* 中等容器样式 */
@container wrapper (min-width: 301px) and (max-width: 500px) {
    .feature-card h3 {
        font-size: 16px;
    }
}

/* 大容器样式 */
@container wrapper (min-width: 501px) {
    .feature-card {
        display: grid;
        grid-template-columns: 100px 1fr;
        gap: 16px;
    }

    .feature-card h3 {
        font-size: 18px;
    }
}
```

### 6.4 :has()伪类

:has()伪类允许选择包含特定子元素的父元素。

#### 基础用法

```css
/* 选择包含img的p标签 */
p:has(img) {
    background: #f0f0f0;
}

/* 选择包含.active子元素的li */
li:has(.active) {
    background: #e0e0e0;
}

/* 选择不包含子元素的div */
div:has(> *:only-child) {
    /* 选择只有唯一一个子元素的div */
}

/* 选择表单中包含禁用输入框的fieldset */
fieldset:has(input:disabled) {
    opacity: 0.6;
}
```

#### :has()实战

```css
/* 1. 卡片有图片时添加特殊样式 */
.card:has(img) {
    padding-top: 0;
}

/* 2. 导航菜单有下拉菜单时添加箭头 */
.nav-item:has(.dropdown) > .nav-link::after {
    content: '▼';
    font-size: 10px;
    margin-left: 4px;
}

/* 3. 表单验证样式 */
.input-group:has(input:invalid) .input-group-label {
    color: #dc3545;
}

.input-group:has(input:valid) .input-group-label {
    color: #28a745;
}

/* 4. 空状态提示 */
.list:empty::after {
    content: '暂无数据';
    display: block;
    text-align: center;
    padding: 40px;
    color: #999;
}

/* 5. 选择有错误提示的表单组 */
.form-group:has(.error-message) {
    margin-bottom: 24px;
}

.form-group .error-message {
    display: none;
}

.form-group:has(.error-message) .error-message {
    display: block;
    color: #dc3545;
    font-size: 12px;
    margin-top: 4px;
}

/* 6. 复杂的兄弟选择 */
.article:has(~ .article:only-of-type) {
    /* 选择紧邻唯一类型文章的.article */
}

/* 7. 动态布局 */
.grid:has(.featured) {
    grid-template-columns: 1fr 2fr;
}

.grid .featured {
    grid-column: span 2;
}
```

### 6.5 color-mix()与相对颜色语法

#### color-mix()函数

```css
/* color-mix() 混合两种颜色 */
/* color-mix(in <color-space>, <color> <percentage>, <color> <percentage>) */

/* 在srgb色彩空间混合 */
.mixed-srgb {
    background: color-mix(in srgb, #007bff 50%, #ff6b6b 50%);
}

/* 在oklch色彩空间混合（更自然的混合） */
.mixed-oklch {
    background: color-mix(in oklch, #007bff 50%, #ff6b6b 50%);
}

/* 不等比例混合 */
.mixed-unequal {
    background: color-mix(in srgb, #007bff 70%, #ff6b6b 30%);
}

/* 与透明混合 */
.mixed-transparent {
    background: color-mix(in srgb, #007bff 80%, transparent 20%);
}

/* 实战：主题色变体 */
:root {
    --primary: #007bff;
    --primary-lighter: color-mix(in srgb, var(--primary) 30%, white 70%);
    --primary-darker: color-mix(in srgb, var(--primary) 70%, black 30%);
    --primary-soft: color-mix(in srgb, var(--primary) 10%, transparent 90%);
}
```

#### 相对颜色语法

```css
/* 相对颜色：从现有颜色计算新颜色 */
:root {
    /* 基于 --base-color 创建变体 */
    --base-color: #007bff;

    /* 更亮 */
    --lighter: oklch(from var(--base-color) calc(l + 0.2) c h);

    /* 更暗 */
    --darker: oklch(from var(--base-color) calc(l - 0.2) c h);

    /* 饱和度更高 */
    --more-saturated: oklch(from var(--base-color) l calc(c * 1.5) h);

    /* 色相旋转30度 */
    --hue-rotated: oklch(from var(--base-color) l c calc(h + 30));
}

/* 实战：按钮状态 */
.btn {
    background: var(--primary);
}

.btn:hover {
    background: oklch(from var(--primary) calc(l + 0.1) c h);
}

.btn:active {
    background: oklch(from var(--primary) calc(l - 0.1) c h);
}

/* 透明度变体 */
.btn:disabled {
    background: oklch(from var(--primary) l c h / 40%);
}
```

### 6.6 Scroll-Driven Animations滚动驱动动画

Scroll-Driven Animations允许页面滚动时直接驱动动画，无需JavaScript。

#### 基础用法

```css
/* 1. 视口滚动驱动 */
.scroll-animation {
    animation: fadeIn linear;
    animation-timeline: scroll();
    /* 动画与滚动位置绑定 */
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

/* 2. 指定滚动容器 */
.scroll-container {
    overflow: auto;
    height: 400px;
}

.scroll-element {
    animation: slide linear;
    animation-timeline: scroll(root block);
    /* 或 */
    animation-timeline: scroll(self block);
}

@keyframes slide {
    from {
        transform: translateX(-100%);
    }
    to {
        transform: translateX(0);
    }
}
```

#### 滚动驱动实战

```css
/* 1. 进度条指示器 */
.progress-bar {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: #e0e0e0;
}

.progress-bar::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: #007bff;
    animation: grow linear;
    animation-timeline: scroll(root block);
    transform-origin: left;
}

@keyframes grow {
    from {
        transform: scaleX(0);
    }
    to {
        transform: scaleX(1);
    }
}

/* 2. 滚动显示动画 */
.reveal-on-scroll {
    animation: reveal linear both;
    animation-timeline: view();
    animation-range: entry 0% entry 100%;
}

@keyframes reveal {
    from {
        opacity: 0;
        transform: translateY(50px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 3. 粘性元素效果 */
.sticky-element {
    animation: sticky linear;
    animation-timeline: scroll();
    animation-range: 0% 100% contain 0%;
}

@keyframes sticky {
    0%, 100% {
        transform: translateY(0);
    }
}

/* 4. 视差效果 */
.parallax-bg {
    position: fixed;
    inset: 0;
    z-index: -1;
    animation: parallax linear;
    animation-timeline: scroll(root);
}

@keyframes parallax {
    from {
        transform: translateY(0);
    }
    to {
        transform: translateY(50%);
    }
}
```

---

## 7. 实战项目

### 7.1 响应式仪表盘布局

本项目实现一个完整的响应式仪表盘，包含侧边栏、顶部导航、主要内容区和卡片网格。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>响应式仪表盘</title>
    <style>
        /* ========== 基础重置与变量 ========== */
        *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        :root {
            /* 颜色系统 */
            --color-primary: #007bff;
            --color-primary-dark: #0056b3;
            --color-success: #28a745;
            --color-warning: #ffc107;
            --color-danger: #dc3545;
            --color-info: #17a2b8;

            --color-bg: #f5f7fa;
            --color-sidebar: #1a1a1a;
            --color-sidebar-hover: #2a2a2a;
            --color-card: #ffffff;
            --color-text: #333333;
            --color-text-muted: #6c757d;
            --color-border: #e0e0e0;

            /* 间距系统 */
            --spacing-xs: 4px;
            --spacing-sm: 8px;
            --spacing-md: 16px;
            --spacing-lg: 24px;
            --spacing-xl: 32px;

            /* 圆角 */
            --radius-sm: 4px;
            --radius-md: 8px;
            --radius-lg: 12px;

            /* 阴影 */
            --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
            --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
            --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

            /* 过渡 */
            --transition-fast: 0.15s ease;
            --transition-normal: 0.3s ease;

            /* 布局 */
            --sidebar-width: 260px;
            --header-height: 64px;
        }

        /* ========== 页面基础样式 ========== */
        html {
            font-size: 16px;
            line-height: 1.5;
        }

        body {
            font-family: "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: var(--color-bg);
            color: var(--color-text);
            min-height: 100vh;
        }

        /* ========== 主布局容器 ========== */
        .dashboard {
            display: grid;
            grid-template-areas:
                "sidebar header"
                "sidebar main";
            grid-template-columns: var(--sidebar-width) 1fr;
            grid-template-rows: var(--header-height) 1fr;
            min-height: 100vh;
        }

        /* ========== 侧边栏 ========== */
        .sidebar {
            grid-area: sidebar;
            background: var(--color-sidebar);
            color: #fff;
            display: flex;
            flex-direction: column;
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            width: var(--sidebar-width);
            z-index: 100;
            transition: transform var(--transition-normal);
        }

        .sidebar-header {
            display: flex;
            align-items: center;
            gap: var(--spacing-md);
            padding: var(--spacing-lg);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .sidebar-logo {
            width: 36px;
            height: 36px;
            background: var(--color-primary);
            border-radius: var(--radius-md);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 18px;
        }

        .sidebar-title {
            font-size: 18px;
            font-weight: 600;
        }

        .sidebar-nav {
            flex: 1;
            padding: var(--spacing-md);
            overflow-y: auto;
        }

        .nav-section {
            margin-bottom: var(--spacing-lg);
        }

        .nav-section-title {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: rgba(255, 255, 255, 0.5);
            padding: var(--spacing-sm) var(--spacing-md);
            margin-bottom: var(--spacing-sm);
        }

        .nav-item {
            display: flex;
            align-items: center;
            gap: var(--spacing-md);
            padding: var(--spacing-md);
            border-radius: var(--radius-md);
            color: rgba(255, 255, 255, 0.7);
            text-decoration: none;
            transition: all var(--transition-fast);
            cursor: pointer;
        }

        .nav-item:hover {
            background: var(--color-sidebar-hover);
            color: #fff;
        }

        .nav-item.active {
            background: var(--color-primary);
            color: #fff;
        }

        .nav-item-icon {
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .nav-item-badge {
            margin-left: auto;
            background: var(--color-danger);
            color: #fff;
            font-size: 11px;
            padding: 2px 6px;
            border-radius: 10px;
        }

        .sidebar-footer {
            padding: var(--spacing-lg);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .sidebar-user {
            display: flex;
            align-items: center;
            gap: var(--spacing-md);
        }

        .sidebar-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--color-primary), var(--color-info));
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: #fff;
        }

        .sidebar-user-info {
            flex: 1;
        }

        .sidebar-user-name {
            font-size: 14px;
            font-weight: 500;
        }

        .sidebar-user-role {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.5);
        }

        /* ========== 顶部导航栏 ========== */
        .header {
            grid-area: header;
            background: var(--color-card);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 var(--spacing-lg);
            border-bottom: 1px solid var(--color-border);
            position: sticky;
            top: 0;
            z-index: 50;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: var(--spacing-lg);
        }

        .header-toggle {
            display: none;
            background: none;
            border: none;
            cursor: pointer;
            padding: var(--spacing-sm);
            border-radius: var(--radius-sm);
            transition: background var(--transition-fast);
        }

        .header-toggle:hover {
            background: var(--color-bg);
        }

        .header-toggle-icon {
            width: 24px;
            height: 24px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 5px;
        }

        .header-toggle-icon span {
            display: block;
            height: 2px;
            background: var(--color-text);
            border-radius: 1px;
        }

        .header-search {
            position: relative;
        }

        .header-search-input {
            width: 320px;
            padding: var(--spacing-sm) var(--spacing-md);
            padding-left: 40px;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            font-size: 14px;
            background: var(--color-bg);
            transition: all var(--transition-fast);
        }

        .header-search-input:focus {
            outline: none;
            border-color: var(--color-primary);
            background: #fff;
            box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        }

        .header-search-icon {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--color-text-muted);
        }

        .header-right {
            display: flex;
            align-items: center;
            gap: var(--spacing-md);
        }

        .header-icon-btn {
            position: relative;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
            background: transparent;
            border-radius: var(--radius-md);
            cursor: pointer;
            color: var(--color-text-muted);
            transition: all var(--transition-fast);
        }

        .header-icon-btn:hover {
            background: var(--color-bg);
            color: var(--color-text);
        }

        .header-icon-btn .badge {
            position: absolute;
            top: 4px;
            right: 4px;
            width: 8px;
            height: 8px;
            background: var(--color-danger);
            border-radius: 50%;
        }

        .header-profile {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
            padding: var(--spacing-xs) var(--spacing-sm);
            border-radius: var(--radius-md);
            cursor: pointer;
            transition: background var(--transition-fast);
        }

        .header-profile:hover {
            background: var(--color-bg);
        }

        .header-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--color-primary), var(--color-info));
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 12px;
            color: #fff;
        }

        /* ========== 主内容区 ========== */
        .main {
            grid-area: main;
            padding: var(--spacing-lg);
            overflow-y: auto;
        }

        .main-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: var(--spacing-lg);
        }

        .main-title {
            font-size: 24px;
            font-weight: 600;
        }

        .main-subtitle {
            color: var(--color-text-muted);
            font-size: 14px;
            margin-top: var(--spacing-xs);
        }

        /* ========== 统计卡片网格 ========== */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: var(--spacing-lg);
            margin-bottom: var(--spacing-xl);
        }

        .stat-card {
            background: var(--color-card);
            border-radius: var(--radius-lg);
            padding: var(--spacing-lg);
            box-shadow: var(--shadow-sm);
            transition: all var(--transition-normal);
        }

        .stat-card:hover {
            transform: translateY(-4px);
            box-shadow: var(--shadow-md);
        }

        .stat-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: var(--spacing-md);
        }

        .stat-icon {
            width: 48px;
            height: 48px;
            border-radius: var(--radius-md);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
        }

        .stat-icon.primary {
            background: rgba(0, 123, 255, 0.1);
            color: var(--color-primary);
        }

        .stat-icon.success {
            background: rgba(40, 167, 69, 0.1);
            color: var(--color-success);
        }

        .stat-icon.warning {
            background: rgba(255, 193, 7, 0.1);
            color: var(--color-warning);
        }

        .stat-icon.danger {
            background: rgba(220, 53, 69, 0.1);
            color: var(--color-danger);
        }

        .stat-trend {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs);
            font-size: 12px;
            padding: 2px 6px;
            border-radius: var(--radius-sm);
        }

        .stat-trend.up {
            background: rgba(40, 167, 69, 0.1);
            color: var(--color-success);
        }

        .stat-trend.down {
            background: rgba(220, 53, 69, 0.1);
            color: var(--color-danger);
        }

        .stat-value {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: var(--spacing-xs);
        }

        .stat-label {
            color: var(--color-text-muted);
            font-size: 14px;
        }

        /* ========== 图表网格 ========== */
        .charts-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: var(--spacing-lg);
            margin-bottom: var(--spacing-xl);
        }

        .chart-card {
            background: var(--color-card);
            border-radius: var(--radius-lg);
            padding: var(--spacing-lg);
            box-shadow: var(--shadow-sm);
        }

        .chart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: var(--spacing-lg);
        }

        .chart-title {
            font-size: 16px;
            font-weight: 600;
        }

        .chart-tabs {
            display: flex;
            gap: var(--spacing-sm);
        }

        .chart-tab {
            padding: var(--spacing-xs) var(--spacing-md);
            border: none;
            background: transparent;
            border-radius: var(--radius-sm);
            font-size: 13px;
            color: var(--color-text-muted);
            cursor: pointer;
            transition: all var(--transition-fast);
        }

        .chart-tab:hover {
            background: var(--color-bg);
        }

        .chart-tab.active {
            background: var(--color-primary);
            color: #fff;
        }

        .chart-placeholder {
            height: 250px;
            background: linear-gradient(135deg, var(--color-bg) 0%, #e8eaed 100%);
            border-radius: var(--radius-md);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--color-text-muted);
            font-size: 14px;
        }

        /* ========== 活动列表 ========== */
        .activity-list {
            background: var(--color-card);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-sm);
        }

        .activity-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--spacing-lg);
            border-bottom: 1px solid var(--color-border);
        }

        .activity-item {
            display: flex;
            gap: var(--spacing-md);
            padding: var(--spacing-md) var(--spacing-lg);
            border-bottom: 1px solid var(--color-border);
            transition: background var(--transition-fast);
        }

        .activity-item:last-child {
            border-bottom: none;
        }

        .activity-item:hover {
            background: var(--color-bg);
        }

        .activity-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--color-primary), var(--color-info));
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
            color: #fff;
            flex-shrink: 0;
        }

        .activity-content {
            flex: 1;
            min-width: 0;
        }

        .activity-text {
            font-size: 14px;
            line-height: 1.5;
        }

        .activity-text strong {
            font-weight: 600;
        }

        .activity-time {
            font-size: 12px;
            color: var(--color-text-muted);
            margin-top: var(--spacing-xs);
        }

        .activity-status {
            flex-shrink: 0;
            padding: var(--spacing-xs) var(--spacing-sm);
            border-radius: var(--radius-sm);
            font-size: 12px;
            font-weight: 500;
        }

        .activity-status.completed {
            background: rgba(40, 167, 69, 0.1);
            color: var(--color-success);
        }

        .activity-status.pending {
            background: rgba(255, 193, 7, 0.1);
            color: var(--color-warning);
        }

        .activity-status.cancelled {
            background: rgba(220, 53, 69, 0.1);
            color: var(--color-danger);
        }

        /* ========== 响应式设计 ========== */
        /* 平板端 */
        @media (max-width: 1024px) {
            .stats-grid {
                grid-template-columns: repeat(2, 1fr);
            }

            .charts-grid {
                grid-template-columns: 1fr;
            }
        }

        /* 移动端 */
        @media (max-width: 768px) {
            :root {
                --sidebar-width: 100%;
            }

            .dashboard {
                grid-template-areas:
                    "header header"
                    "main main";
                grid-template-columns: 1fr;
            }

            .sidebar {
                transform: translateX(-100%);
            }

            .sidebar.open {
                transform: translateX(0);
            }

            .sidebar-overlay {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 99;
            }

            .sidebar.open + .sidebar-overlay {
                display: block;
            }

            .header-toggle {
                display: flex;
            }

            .header-search-input {
                width: 200px;
            }

            .stats-grid {
                grid-template-columns: 1fr;
            }

            .main {
                padding: var(--spacing-md);
            }
        }

        @media (max-width: 480px) {
            .header-search {
                display: none;
            }

            .header-profile .profile-text {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <!-- 侧边栏 -->
        <aside class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <div class="sidebar-logo">D</div>
                <span class="sidebar-title">Dashboard</span>
            </div>
            <nav class="sidebar-nav">
                <div class="nav-section">
                    <div class="nav-section-title">主菜单</div>
                    <a href="#" class="nav-item active">
                        <span class="nav-item-icon">📊</span>
                        <span>仪表盘</span>
                    </a>
                    <a href="#" class="nav-item">
                        <span class="nav-item-icon">📈</span>
                        <span>数据分析</span>
                    </a>
                    <a href="#" class="nav-item">
                        <span class="nav-item-icon">📋</span>
                        <span>订单管理</span>
                        <span class="nav-item-badge">3</span>
                    </a>
                </div>
                <div class="nav-section">
                    <div class="nav-section-title">组件</div>
                    <a href="#" class="nav-item">
                        <span class="nav-item-icon">🎨</span>
                        <span>UI组件</span>
                    </a>
                    <a href="#" class="nav-item">
                        <span class="nav-item-icon">📝</span>
                        <span>表单</span>
                    </a>
                    <a href="#" class="nav-item">
                        <span class="nav-item-icon">📦</span>
                        <span>表格</span>
                    </a>
                </div>
                <div class="nav-section">
                    <div class="nav-section-title">设置</div>
                    <a href="#" class="nav-item">
                        <span class="nav-item-icon">⚙️</span>
                        <span>系统设置</span>
                    </a>
                    <a href="#" class="nav-item">
                        <span class="nav-item-icon">👤</span>
                        <span>个人资料</span>
                    </a>
                </div>
            </nav>
            <div class="sidebar-footer">
                <div class="sidebar-user">
                    <div class="sidebar-avatar">张</div>
                    <div class="sidebar-user-info">
                        <div class="sidebar-user-name">张三</div>
                        <div class="sidebar-user-role">管理员</div>
                    </div>
                </div>
            </div>
        </aside>

        <!-- 移动端侧边栏遮罩 -->
        <div class="sidebar-overlay" id="sidebarOverlay"></div>

        <!-- 顶部导航 -->
        <header class="header">
            <div class="header-left">
                <button class="header-toggle" id="sidebarToggle">
                    <div class="header-toggle-icon">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </button>
                <div class="header-search">
                    <span class="header-search-icon">🔍</span>
                    <input type="text" class="header-search-input" placeholder="搜索...">
                </div>
            </div>
            <div class="header-right">
                <button class="header-icon-btn">
                    🔔
                    <span class="badge"></span>
                </button>
                <button class="header-icon-btn">
                    ⚙️
                </button>
                <div class="header-profile">
                    <div class="header-avatar">张</div>
                    <span class="profile-text">张三</span>
                </div>
            </div>
        </header>

        <!-- 主内容 -->
        <main class="main">
            <div class="main-header">
                <div>
                    <h1 class="main-title">仪表盘</h1>
                    <p class="main-subtitle">欢迎回来！以下是您的数据概览。</p>
                </div>
            </div>

            <!-- 统计卡片 -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon primary">💰</div>
                        <span class="stat-trend up">↑ 12.5%</span>
                    </div>
                    <div class="stat-value">¥54,230</div>
                    <div class="stat-label">总收入</div>
                </div>
                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon success">📦</div>
                        <span class="stat-trend up">↑ 8.2%</span>
                    </div>
                    <div class="stat-value">1,284</div>
                    <div class="stat-label">订单数量</div>
                </div>
                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon warning">👥</div>
                        <span class="stat-trend down">↓ 3.1%</span>
                    </div>
                    <div class="stat-value">8,652</div>
                    <div class="stat-label">活跃用户</div>
                </div>
                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon danger">🛒</div>
                        <span class="stat-trend up">↑ 15.3%</span>
                    </div>
                    <div class="stat-value">¥2,845</div>
                    <div class="stat-label">平均订单价值</div>
                </div>
            </div>

            <!-- 图表 -->
            <div class="charts-grid">
                <div class="chart-card">
                    <div class="chart-header">
                        <h3 class="chart-title">收入趋势</h3>
                        <div class="chart-tabs">
                            <button class="chart-tab active">周</button>
                            <button class="chart-tab">月</button>
                            <button class="chart-tab">年</button>
                        </div>
                    </div>
                    <div class="chart-placeholder">
                        📈 图表加载中...
                    </div>
                </div>
                <div class="chart-card">
                    <div class="chart-header">
                        <h3 class="chart-title">销售分布</h3>
                    </div>
                    <div class="chart-placeholder">
                        🥧 图表加载中...
                    </div>
                </div>
            </div>

            <!-- 活动列表 -->
            <div class="activity-list">
                <div class="activity-header">
                    <h3 class="chart-title">最近活动</h3>
                </div>
                <div class="activity-item">
                    <div class="activity-avatar">李</div>
                    <div class="activity-content">
                        <p class="activity-text"><strong>李四</strong> 提交了一个新订单，金额 <strong>¥2,580</strong></p>
                        <p class="activity-time">5分钟前</p>
                    </div>
                    <span class="activity-status pending">待处理</span>
                </div>
                <div class="activity-item">
                    <div class="activity-avatar">王</div>
                    <div class="activity-content">
                        <p class="activity-text"><strong>王五</strong> 完成了付款确认</p>
                        <p class="activity-time">15分钟前</p>
                    </div>
                    <span class="activity-status completed">已完成</span>
                </div>
                <div class="activity-item">
                    <div class="activity-avatar">赵</div>
                    <div class="activity-content">
                        <p class="activity-text"><strong>赵六</strong> 取消订单 #20240315</p>
                        <p class="activity-time">30分钟前</p>
                    </div>
                    <span class="activity-status cancelled">已取消</span>
                </div>
            </div>
        </main>
    </div>

    <script>
        // 移动端侧边栏切换
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebarOverlay = document.getElementById('sidebarOverlay');

        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
    </script>
</body>
</html>
```

### 7.2 复杂Loading动画

本项目实现一个复杂的多层Loading动画效果，包含多个动画元素协调配合。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>复杂Loading动画</title>
    <style>
        /* ========== 基础样式 ========== */
        *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        :root {
            --color-primary: #007bff;
            --color-secondary: #6c757d;
            --color-success: #28a745;
            --color-warning: #ffc107;
            --color-danger: #dc3545;
            --color-bg: #f5f7fa;
        }

        body {
            font-family: "Microsoft YaHei", -apple-system, sans-serif;
            background: var(--color-bg);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 60px;
            padding: 40px 20px;
        }

        h2 {
            color: #333;
            font-size: 18px;
            margin-bottom: 24px;
            text-align: center;
        }

        .demo-container {
            display: flex;
            flex-wrap: wrap;
            gap: 60px;
            justify-content: center;
        }

        .demo-item {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        /* ========== 动画1: 多层同心圆旋转 ========== */
        .loader-concentric {
            position: relative;
            width: 80px;
            height: 80px;
        }

        .loader-concentric .circle {
            position: absolute;
            top: 50%;
            left: 50%;
            border-radius: 50%;
            border: 3px solid transparent;
            transform: translate(-50%, -50%);
        }

        .loader-concentric .circle:nth-child(1) {
            width: 80px;
            height: 80px;
            border-top-color: var(--color-primary);
            animation: spin 1.2s linear infinite;
        }

        .loader-concentric .circle:nth-child(2) {
            width: 60px;
            height: 60px;
            border-right-color: var(--color-success);
            animation: spin 1s linear infinite reverse;
        }

        .loader-concentric .circle:nth-child(3) {
            width: 40px;
            height: 40px;
            border-bottom-color: var(--color-warning);
            animation: spin 0.8s linear infinite;
        }

        .loader-concentric .circle:nth-child(4) {
            width: 20px;
            height: 20px;
            border-left-color: var(--color-danger);
            animation: spin 0.6s linear infinite reverse;
        }

        @keyframes spin {
            to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        /* ========== 动画2: 波浪正方形 ========== */
        .loader-waves {
            display: flex;
            gap: 6px;
            align-items: center;
        }

        .loader-waves .wave {
            width: 12px;
            height: 40px;
            background: var(--color-primary);
            border-radius: 4px;
            animation: wave 1.2s ease-in-out infinite;
        }

        .loader-waves .wave:nth-child(1) { animation-delay: 0s; }
        .loader-waves .wave:nth-child(2) { animation-delay: 0.1s; }
        .loader-waves .wave:nth-child(3) { animation-delay: 0.2s; }
        .loader-waves .wave:nth-child(4) { animation-delay: 0.3s; }
        .loader-waves .wave:nth-child(5) { animation-delay: 0.4s; }

        @keyframes wave {
            0%, 100% {
                height: 20px;
                background: var(--color-primary);
            }
            50% {
                height: 40px;
                background: var(--color-warning);
            }
        }

        /* ========== 动画3: 渐变脉冲球 ========== */
        .loader-pulse {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(
                135deg,
                var(--color-primary) 0%,
                var(--color-success) 50%,
                var(--color-warning) 100%
            );
            background-size: 200% 200%;
            animation: pulseGradient 2s ease-in-out infinite, pulseScale 1.5s ease-in-out infinite;
        }

        @keyframes pulseGradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

        @keyframes pulseScale {
            0%, 100% {
                transform: scale(1);
                box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.4);
            }
            50% {
                transform: scale(1.1);
                box-shadow: 0 0 0 20px rgba(0, 123, 255, 0);
            }
        }

        /* ========== 动画4: 轨道行星 ========== */
        .loader-orbit {
            position: relative;
            width: 80px;
            height: 80px;
        }

        .loader-orbit .orbit {
            position: absolute;
            top: 50%;
            left: 50%;
            border: 1px dashed rgba(0, 123, 255, 0.3);
            border-radius: 50%;
            transform: translate(-50%, -50%);
        }

        .loader-orbit .orbit:nth-child(1) {
            width: 80px;
            height: 80px;
        }

        .loader-orbit .orbit:nth-child(2) {
            width: 60px;
            height: 60px;
            border-color: rgba(40, 167, 69, 0.3);
        }

        .loader-orbit .orbit:nth-child(3) {
            width: 40px;
            height: 40px;
            border-color: rgba(255, 193, 7, 0.3);
        }

        .loader-orbit .planet {
            position: absolute;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            animation: orbit 2s linear infinite;
        }

        .loader-orbit .planet:nth-child(4) {
            top: -5px;
            left: 50%;
            margin-left: -5px;
            background: var(--color-primary);
            animation-duration: 2s;
        }

        .loader-orbit .planet:nth-child(5) {
            top: 50%;
            right: -5px;
            margin-top: -5px;
            background: var(--color-success);
            animation-duration: 1.5s;
            animation-direction: reverse;
        }

        .loader-orbit .planet:nth-child(6) {
            bottom: -5px;
            left: 50%;
            margin-left: -5px;
            background: var(--color-warning);
            animation-duration: 1s;
        }

        @keyframes orbit {
            to { transform: rotate(360deg); }
        }

        /* ========== 动画5: 呼吸灯 ========== */
        .loader-breathe {
            display: flex;
            gap: 8px;
        }

        .loader-breathe .dot {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: var(--color-primary);
            animation: breathe 2s ease-in-out infinite;
        }

        .loader-breathe .dot:nth-child(1) { animation-delay: 0s; }
        .loader-breathe .dot:nth-child(2) { animation-delay: 0.3s; }
        .loader-breathe .dot:nth-child(3) { animation-delay: 0.6s; }
        .loader-breathe .dot:nth-child(4) { animation-delay: 0.9s; }
        .loader-breathe .dot:nth-child(5) { animation-delay: 1.2s; }

        @keyframes breathe {
            0%, 100% {
                transform: scale(0.5);
                opacity: 0.3;
            }
            50% {
                transform: scale(1);
                opacity: 1;
            }
        }

        /* ========== 动画6: DNA螺旋 ========== */
        .loader-dna {
            display: flex;
            gap: 4px;
            align-items: center;
        }

        .loader-dna .strand {
            width: 6px;
            height: 50px;
            position: relative;
        }

        .loader-dna .strand::before,
        .loader-dna .strand::after {
            content: '';
            position: absolute;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            animation: dnaStrand 1.5s ease-in-out infinite;
        }

        .loader-dna .strand::before {
            top: 0;
            background: var(--color-primary);
        }

        .loader-dna .strand::after {
            bottom: 0;
            background: var(--color-success);
            animation-delay: 0.75s;
        }

        .loader-dna .strand:nth-child(1) { animation: dnaFade 1.5s ease-in-out infinite; }
        .loader-dna .strand:nth-child(2) { animation: dnaFade 1.5s ease-in-out 0.1s infinite; }
        .loader-dna .strand:nth-child(3) { animation: dnaFade 1.5s ease-in-out 0.2s infinite; }
        .loader-dna .strand:nth-child(4) { animation: dnaFade 1.5s ease-in-out 0.3s infinite; }
        .loader-dna .strand:nth-child(5) { animation: dnaFade 1.5s ease-in-out 0.4s infinite; }

        @keyframes dnaStrand {
            0% { transform: translateY(0); }
            50% { transform: translateY(17px); }
            100% { transform: translateY(0); }
        }

        @keyframes dnaFade {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
        }

        /* ========== 动画7: 方块跳跃 ========== */
        .loader-blocks {
            display: grid;
            grid-template-columns: repeat(3, 16px);
            gap: 4px;
        }

        .loader-blocks .block {
            width: 16px;
            height: 16px;
            background: var(--color-primary);
            animation: blockJump 1.4s ease-in-out infinite;
        }

        .loader-blocks .block:nth-child(1) { animation-delay: 0s; }
        .loader-blocks .block:nth-child(2) { animation-delay: 0.1s; }
        .loader-blocks .block:nth-child(3) { animation-delay: 0.2s; }
        .loader-blocks .block:nth-child(4) { animation-delay: 0.3s; }
        .loader-blocks .block:nth-child(5) { animation-delay: 0.4s; }
        .loader-blocks .block:nth-child(6) { animation-delay: 0.5s; }
        .loader-blocks .block:nth-child(7) { animation-delay: 0.6s; }
        .loader-blocks .block:nth-child(8) { animation-delay: 0.7s; }
        .loader-blocks .block:nth-child(9) { animation-delay: 0.8s; }

        @keyframes blockJump {
            0%, 80%, 100% {
                transform: scale(1);
                background: var(--color-primary);
            }
            40% {
                transform: scale(1.3) translateY(-8px);
                background: var(--color-warning);
            }
        }

        /* ========== 动画8: 渐变圆环 ========== */
        .loader-gradient-ring {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: conic-gradient(
                from 0deg,
                var(--color-primary),
                var(--color-success),
                var(--color-warning),
                var(--color-danger),
                var(--color-primary)
            );
            animation: rotateRing 1.5s linear infinite;
            position: relative;
        }

        .loader-gradient-ring::after {
            content: '';
            position: absolute;
            top: 8px;
            left: 8px;
            right: 8px;
            bottom: 8px;
            background: var(--color-bg);
            border-radius: 50%;
        }

        @keyframes rotateRing {
            to { transform: rotate(360deg); }
        }

        /* ========== 动画9: 液体填充 ========== */
        .loader-liquid {
            width: 40px;
            height: 60px;
            border: 3px solid var(--color-primary);
            border-radius: 0 0 20px 20px;
            position: relative;
            overflow: hidden;
        }

        .loader-liquid::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 100%;
            background: var(--color-primary);
            animation: liquidFill 1.5s ease-in-out infinite;
        }

        .loader-liquid::after {
            content: '';
            position: absolute;
            top: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 20px;
            height: 10px;
            background: var(--color-primary);
            border-radius: 50%;
            animation: liquidWave 1.5s ease-in-out infinite;
        }

        @keyframes liquidFill {
            0% { height: 0%; }
            50% { height: 80%; }
            100% { height: 0%; }
        }

        @keyframes liquidWave {
            0%, 100% { transform: translateX(-50%) scaleX(1); }
            50% { transform: translateX(-50%) scaleX(1.2); }
        }

        /* ========== 动画10: 闪烁文字 ========== */
        .loader-text {
            font-size: 24px;
            font-weight: bold;
            color: var(--color-primary);
            position: relative;
        }

        .loader-text::after {
            content: 'Loading';
            animation: textChange 2s steps(8) infinite;
        }

        @keyframes textChange {
            0% { content: 'L'; }
            12.5% { content: 'Li'; }
            25% { content: 'Loa'; }
            37.5% { content: 'Loa'; }
            50% { content: 'Loadi'; }
            62.5% { content: 'Loadin'; }
            75% { content: 'Loading'; }
            87.5% { content: 'Loading.'; }
            100% { content: 'Loading'; }
        }

        /* ========== 动画11: 组合动画 ========== */
        .loader-combo {
            position: relative;
            width: 100px;
            height: 100px;
        }

        .loader-combo .outer-ring {
            position: absolute;
            inset: 0;
            border: 4px solid transparent;
            border-top-color: var(--color-primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        .loader-combo .middle-ring {
            position: absolute;
            inset: 12px;
            border: 4px solid transparent;
            border-bottom-color: var(--color-success);
            border-radius: 50%;
            animation: spin 0.8s linear infinite reverse;
        }

        .loader-combo .inner-ring {
            position: absolute;
            inset: 24px;
            border: 4px solid transparent;
            border-left-color: var(--color-warning);
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
        }

        .loader-combo .center-dot {
            position: absolute;
            inset: 38px;
            background: var(--color-danger);
            border-radius: 50%;
            animation: pulseScale 1s ease-in-out infinite;
        }

        /* ========== 动画12: 弹性方块 ========== */
        .loader-bounce {
            display: flex;
            gap: 8px;
            align-items: flex-end;
        }

        .loader-bounce .cube {
            width: 20px;
            height: 20px;
            background: var(--color-primary);
            animation: cubeBounce 0.6s ease-in-out infinite alternate;
        }

        .loader-bounce .cube:nth-child(1) { animation-delay: 0s; }
        .loader-bounce .cube:nth-child(2) { animation-delay: 0.1s; }
        .loader-bounce .cube:nth-child(3) { animation-delay: 0.2s; }
        .loader-bounce .cube:nth-child(4) { animation-delay: 0.3s; }

        @keyframes cubeBounce {
            from {
                height: 20px;
                background: var(--color-primary);
            }
            to {
                height: 50px;
                background: var(--color-warning);
            }
        }
    </style>
</head>
<body>
    <h1 style="font-size: 28px; margin-bottom: 40px; color: #333;">CSS复杂Loading动画合集</h1>

    <div class="demo-container">
        <div class="demo-item">
            <h2>同心圆旋转</h2>
            <div class="loader-concentric">
                <div class="circle"></div>
                <div class="circle"></div>
                <div class="circle"></div>
                <div class="circle"></div>
            </div>
        </div>

        <div class="demo-item">
            <h2>波浪方块</h2>
            <div class="loader-waves">
                <div class="wave"></div>
                <div class="wave"></div>
                <div class="wave"></div>
                <div class="wave"></div>
                <div class="wave"></div>
            </div>
        </div>

        <div class="demo-item">
            <h2>渐变脉冲</h2>
            <div class="loader-pulse"></div>
        </div>

        <div class="demo-item">
            <h2>轨道行星</h2>
            <div class="loader-orbit">
                <div class="orbit"></div>
                <div class="orbit"></div>
                <div class="orbit"></div>
                <div class="planet"></div>
                <div class="planet"></div>
                <div class="planet"></div>
            </div>
        </div>

        <div class="demo-item">
            <h2>呼吸灯</h2>
            <div class="loader-breathe">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
        </div>

        <div class="demo-item">
            <h2>DNA螺旋</h2>
            <div class="loader-dna">
                <div class="strand"></div>
                <div class="strand"></div>
                <div class="strand"></div>
                <div class="strand"></div>
                <div class="strand"></div>
            </div>
        </div>

        <div class="demo-item">
            <h2>方块跳跃</h2>
            <div class="loader-blocks">
                <div class="block"></div>
                <div class="block"></div>
                <div class="block"></div>
                <div class="block"></div>
                <div class="block"></div>
                <div class="block"></div>
                <div class="block"></div>
                <div class="block"></div>
                <div class="block"></div>
            </div>
        </div>

        <div class="demo-item">
            <h2>渐变圆环</h2>
            <div class="loader-gradient-ring"></div>
        </div>

        <div class="demo-item">
            <h2>液体填充</h2>
            <div class="loader-liquid"></div>
        </div>

        <div class="demo-item">
            <h2>文字闪烁</h2>
            <div class="loader-text"></div>
        </div>

        <div class="demo-item">
            <h2>组合动画</h2>
            <div class="loader-combo">
                <div class="outer-ring"></div>
                <div class="middle-ring"></div>
                <div class="inner-ring"></div>
                <div class="center-dot"></div>
            </div>
        </div>

        <div class="demo-item">
            <h2>弹性方块</h2>
            <div class="loader-bounce">
                <div class="cube"></div>
                <div class="cube"></div>
                <div class="cube"></div>
                <div class="cube"></div>
            </div>
        </div>
    </div>
</body>
</html>
```

---

## 总结

本文档涵盖了CSS布局与动画的完整知识体系：

### 核心要点

1. **CSS基础**：选择器优先级、层叠规则、继承机制、盒模型、display属性、BFC/IFC格式化上下文
2. **Flexbox**：一维布局的最佳选择，适合导航、列表、居中等场景
3. **CSS Grid**：二维布局系统，适合复杂页面布局、相册、仪表盘
4. **经典布局**：居中、两栏、三栏、Sticky Footer等常见模式
5. **CSS动画**：transition过渡、@keyframes动画、性能优化
6. **CSS新特性**：CSS变量、Subgrid、容器查询、:has()伪类、color-mix()、滚动驱动动画

### 学习建议

- 深入理解Flexbox和Grid的适用场景，两者可配合使用
- 掌握BFC和IFC机制，解决浮动、margin折叠等问题
- 动画优先使用transform和opacity，确保60fps流畅
- 积极使用CSS新特性，提升开发效率

### 实战提示

- 响应式设计优先使用移动端策略
- CSS变量提升主题切换和多端适配效率
- 善用容器查询实现真正的组件化响应式

---

*本文档持续更新，最后更新于2026年4月*
