# CSS 基础

## 目录

1. [CSS 简介和引入方式](#1-css-简介和引入方式)
2. [选择器](#2-选择器)
3. [优先级和层叠](#3-优先级和层叠)
4. [盒模型](#4-盒模型)
5. [Flexbox 布局](#5-flexbox-布局)
6. [Grid 布局](#6-grid-布局)
7. [定位](#7-定位)
8. [响应式设计](#8-响应式设计)
9. [动画和过渡](#9-动画和过渡)
10. [CSS 变量](#10-css-变量)

---

## 1. CSS 简介和引入方式

### 1.1 什么是 CSS？

**CSS**（Cascading Style Sheets，层叠样式表）用于控制网页的外观和布局。它允许你：
- 控制字体、颜色、间距
- 创建复杂布局
- 添加动画效果
- 实现响应式设计

### 1.2 CSS 的三种引入方式

#### 1.2.1 内联样式（行内样式）

直接写在 HTML 元素的 `style` 属性中：

```html
<p style="color: red; font-size: 16px;">这是内联样式</p>
```

**特点：**
- 优先级最高
- 不利于维护和复用
- 仅用于测试或特殊情况

#### 1.2.2 内嵌样式（内部样式表）

写在 HTML 文档的 `<head>` 标签内的 `<style>` 标签中：

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>内嵌样式示例</title>
    <style>
        /* CSS 规则写在这里 */
        p {
            color: blue;
            font-size: 14px;
        }

        .title {
            font-size: 24px;
            font-weight: bold;
        }

        #header {
            background-color: #333;
            color: white;
        }
    </style>
</head>
<body>
    <p>这是内嵌样式</p>
    <div class="title">标题</div>
    <div id="header">头部</div>
</body>
</html>
```

**特点：**
- 页面级别的样式
- 适合单页面应用

#### 1.2.3 外链样式（外部样式表）

写在独立的 `.css` 文件中，通过 `<link>` 标签引入：

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>外部样式示例</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <p>外部样式</p>
</body>
</html>
```

```css
/* styles.css */
p {
    color: green;
    font-size: 16px;
}
```

**特点：**
- 样式与结构分离
- 可被多个页面共享
- 利于浏览器缓存
- **推荐使用**

### 1.3 @import 导入

在 CSS 文件中导入其他 CSS 文件：

```css
/* main.css */
@import url("base.css");
@import url("layout.css");

body {
    margin: 0;
}
```

### 1.4 基本语法

```css
/* 选择器 {
    属性: 值;
    属性: 值;
} */

h1 {
    color: #333;
    font-size: 32px;
    font-weight: bold;
}

/* 注释 */
```

---

## 2. 选择器

### 2.1 元素选择器

选择指定类型的 HTML 元素：

```css
/* 选择所有 p 元素 */
p {
    color: #333;
}

/* 选择所有 div 元素 */
div {
    margin: 10px;
    padding: 10px;
}

/* 选择所有元素 */
* {
    box-sizing: border-box;
}
```

```html
<p>段落1</p>
<p>段落2</p>
<div>容器</div>
```

### 2.2 类选择器

选择具有特定 class 属性的元素：

```css
/* 定义类 */
.highlight {
    background-color: yellow;
}

.btn {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.btn-primary {
    background-color: #007bff;
    color: white;
}

.btn-danger {
    background-color: #dc3545;
    color: white;
}
```

```html
<p class="highlight">高亮段落</p>
<button class="btn btn-primary">主要按钮</button>
<button class="btn btn-danger">危险按钮</button>
```

### 2.3 ID 选择器

选择具有特定 id 属性的元素（应保持唯一性）：

```css
#header {
    background-color: #333;
    color: white;
    padding: 20px;
}

#main-content {
    max-width: 1200px;
    margin: 0 auto;
}

#footer {
    text-align: center;
    padding: 20px;
    background-color: #f5f5f5;
}
```

```html
<header id="header">网站头部</header>
<main id="main-content">主要内容</main>
<footer id="footer">页脚</footer>
```

### 2.4 属性选择器

根据属性或属性值选择元素：

```css
/* [属性] - 包含指定属性的元素 */
[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
}

/* [属性=值] - 属性等于指定值 */
[type="text"] {
    border: 1px solid #ccc;
}

/* [属性~=值] - 属性包含指定单词（空格分隔） */
[class~="important"] {
    font-weight: bold;
}

/* [属性|=值] - 属性值以指定值开头 */
[lang|="zh"] {
    color: red;
}

/* [属性^=值] - 属性值以指定值开头 */
[a href^="https://"] {
    color: blue;
}

/* [属性$=值] - 属性值以指定值结尾 */
[a href$=".pdf"] {
    color: red;
}

/* [属性*=值] - 属性值包含指定字符串 */
[a href*="example"] {
    color: green;
}
```

```html
<!-- 属性选择器示例 -->
<input type="text" placeholder="文本输入">
<input type="email" placeholder="邮箱输入">
<input type="password" disabled placeholder="禁用输入">

<a href="https://google.com">Google</a>
<a href="document.pdf">下载 PDF</a>
<a href="page.html">内部链接</a>
```

### 2.5 伪类选择器

选择元素的特定状态：

#### 2.5.1 基础伪类

```css
/* :hover - 鼠标悬停 */
a:hover {
    color: red;
}

.button:hover {
    background-color: #0056b3;
}

/* :focus - 获取焦点 */
input:focus {
    outline: none;
    border-color: blue;
    box-shadow: 0 0 5px rgba(0, 0, 255, 0.3);
}

/* :active - 激活状态 */
button:active {
    transform: scale(0.98);
}

/* :visited - 已访问链接 */
a:visited {
    color: purple;
}

/* :link - 未访问链接 */
a:link {
    color: blue;
}
```

#### 2.5.2 结构伪类

```css
/* :first-child - 第一个子元素 */
ul li:first-child {
    border-top: none;
}

/* :last-child - 最后一个子元素 */
ul li:last-child {
    border-bottom: none;
}

/* :nth-child(n) - 第 n 个子元素 */
tr:nth-child(odd) {
    background-color: #f9f9f9;
}

tr:nth-child(2n) {
    background-color: #f0f0f0;
}

tr:nth-child(3n) {
    background-color: #e0e0e0;
}

/* :nth-last-child(n) - 倒数第 n 个子元素 */
li:nth-last-child(1) {
    font-weight: bold;
}

/* :only-child - 唯一的子元素 */
p:only-child {
    color: red;
}

/* :first-of-type - 同类型第一个 */
p:first-of-type {
    font-size: 1.2em;
}

/* :last-of-type - 同类型最后一个 */
p:last-of-type {
    margin-bottom: 0;
}

/* :nth-of-type(n) - 同类型第 n 个 */
div:nth-of-type(2) {
    background-color: yellow;
}

/* :empty - 空元素 */
div:empty {
    display: none;
}

/* :not(selector) - 否定伪类 */
input:not([type="submit"]) {
    border: 1px solid #ccc;
}
```

```html
<!-- 结构伪类示例 -->
<ul>
    <li>第1项</li>
    <li>第2项</li>
    <li>第3项</li>
    <li>第4项</li>
    <li>第5项</li>
</ul>

<table>
    <tr><td>行1</td></tr>
    <tr><td>行2</td></tr>
    <tr><td>行3</td></tr>
    <tr><td>行4</td></tr>
</table>
```

#### 2.5.3 表单伪类

```css
/* :checked - 被选中的复选框/单选框 */
input:checked + label {
    color: blue;
    font-weight: bold;
}

/* :disabled - 禁用状态 */
input:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
}

/* :enabled - 启用状态 */
input:enabled {
    background-color: white;
}

/* :required - 必填字段 */
input:required {
    border-color: red;
}

/* :optional - 可选字段 */
input:optional {
    border-color: #ccc;
}

/* :valid - 验证通过 */
input:valid {
    border-color: green;
}

/* :invalid - 验证失败 */
input:invalid {
    border-color: red;
}

/* :in-range - 在范围内（number/range） */
input:in-range {
    background-color: #e8f5e9;
}

/* :out-of-range - 超出范围 */
input:out-of-range {
    background-color: #ffebee;
}
```

```html
<!-- 表单伪类示例 -->
<form>
    <label>
        <input type="checkbox" name="hobby" value="reading">
        阅读
    </label>
    <label>
        <input type="checkbox" name="hobby" value="music">
        音乐
    </label>

    <input type="text" disabled placeholder="禁用输入">

    <input type="email" required placeholder="必填邮箱">
    <input type="url" placeholder="可选网址">

    <input type="number" min="0" max="100" placeholder="0-100">
</form>
```

### 2.6 伪元素选择器

#### 2.6.1 ::before 和 ::after

```css
/* ::before - 在元素内容之前插入内容 */
.required::before {
    content: "*";
    color: red;
    margin-right: 5px;
}

/* ::after - 在元素内容之后插入内容 */
.clearfix::after {
    content: "";
    display: table;
    clear: both;
}

/* 添加图标 */
.link-external::after {
    content: "↗";
    margin-left: 5px;
}

/* 计数器 */
.list {
    counter-reset: item;
}

.list-item::before {
    counter-increment: item;
    content: counter(item) ". ";
}
```

```html
<!-- 伪元素示例 -->
<span class="required">必填字段</span>
<a href="#" class="link-external">外部链接</a>
```

#### 2.6.2 ::first-line 和 ::first-letter

```css
/* ::first-line - 第一行 */
.article::first-line {
    font-weight: bold;
    color: #333;
}

/* ::first-letter - 第一个字符 */
.article::first-letter {
    font-size: 3em;
    float: left;
    margin-right: 10px;
    line-height: 1;
}
```

```html
<p class="article">
    这是第一行的内容，会被特殊样式。
    这是第二行的内容。
    这是第三行的内容。
</p>
```

#### 2.6.3 ::selection

```css
/* ::selection - 选中文本 */
::selection {
    background-color: #3399ff;
    color: white;
}
```

### 2.7 组合选择器

```css
/* 后代选择器（空格） */
.container p {
    margin: 10px;
}

/* 子选择器（>） */
.container > p {
    font-weight: bold;
}

/* 相邻兄弟选择器（+） */
h1 + p {
    font-size: 1.2em;
}

/* 通用兄弟选择器（~） */
h1 ~ p {
    color: #666;
}

/* 多个选择器（逗号） */
h1, h2, h3 {
    margin: 0;
}
```

---

## 3. 优先级和层叠

### 3.1 选择器优先级计算

优先级由四部分组成 (a, b, c, d)：
- a: 行内样式（inline style）
- b: ID 选择器数量
- c: 类选择器、属性选择器、伪类数量
- d: 元素选择器、伪元素数量

```css
/* 优先级: (0, 0, 0, 1) */
p { }

/* 优先级: (0, 0, 0, 2) */
div p { }

/* 优先级: (0, 0, 1, 0) */
.highlight { }

/* 优先级: (0, 0, 2, 0) */
a.class1.class2 { }

/* 优先级: (0, 1, 0, 0) */
#header { }

/* 优先级: (0, 1, 1, 1) */
#nav .active a { }

/* 优先级: (1, 0, 0, 0) - 行内样式最高 */
style="color: red;"
```

### 3.2 !important 规则

```css
/* !important 优先级最高 */
p {
    color: red !important;
}

/* 谨慎使用，会破坏样式优先级规则 */
```

### 3.3 层叠规则

当多条规则作用于同一元素时：

```css
/* 规则1 */
p { color: red; }

/* 规则2 */
p { color: blue; }

/* 最终显示蓝色（后来者居上） */
```

### 3.4 优先级示例

```html
<style>
    /* 优先级: (0, 0, 1, 1) */
    .container p {
        color: red;
    }

    /* 优先级: (0, 1, 0, 0) */
    #main p {
        color: blue;
    }

    /* 优先级: (0, 0, 1, 0) */
    .text {
        color: green;
    }

    /* 优先级: (0, 0, 0, 1) */
    p {
        color: orange;
    }

    /* 最终蓝色（#main 优先级最高） */
</style>

<div id="main" class="container">
    <p class="text">这段文字是什么颜色？</p>
</div>
```

### 3.5 继承

```css
/* 可继承的属性 */
.parent {
    color: #333;
    font-family: Arial, sans-serif;
    font-size: 16px;
    line-height: 1.6;
}

/* 不可继承 */
.border {
    border: 1px solid red;
}
```

```html
<div class="parent">
    <!-- 子元素会继承 color, font-family, font-size, line-height -->
    <p>子元素继承父元素的文字颜色和字体</p>
    <span>也是继承的</span>
</div>
```

---

## 4. 盒模型

### 4.1 盒模型概述

所有 HTML 元素都可以看作一个盒子，由内到外包含：
- **content（内容）**：元素的实际内容
- **padding（内边距）**：内容与边框之间的区域
- **border（边框）**：元素的边框
- **margin（外边距）**：元素与其他元素之间的区域

### 4.2 盒模型属性

```css
.box {
    /* 内容区域 */
    width: 200px;
    height: 100px;

    /* 内边距 */
    padding: 20px;              /* 上下左右 */
    padding: 20px 30px;         /* 上下 左右 */
    padding: 10px 20px 30px 40px; /* 上 右 下 左 */
    padding-top: 10px;
    padding-right: 20px;
    padding-bottom: 30px;
    padding-left: 40px;

    /* 边框 */
    border: 1px solid #ccc;
    border-width: 2px;
    border-style: solid;       /* solid dashed dotted double */
    border-color: red;
    border-top: 2px solid blue;
    border-radius: 8px;        /* 圆角 */

    /* 外边距 */
    margin: 20px;
    margin: 10px auto;         /* 居中 */
    margin-top: 10px;
    margin-right: 20px;
    margin-bottom: 30px;
    margin-left: 40px;
}
```

### 4.3 box-sizing 属性

```css
/* 默认：content-box（内容盒） */
.content-box {
    box-sizing: content-box;
    width: 200px;
    padding: 20px;
    border: 1px solid #ccc;
    /* 实际宽度 = 200 + 40 + 2 = 242px */
}

/* 推荐：border-box（边框盒） */
.border-box {
    box-sizing: border-box;
    width: 200px;
    padding: 20px;
    border: 1px solid #ccc;
    /* 实际宽度 = 200px */
}
```

```html
<!-- 全局重置 box-sizing -->
<style>
    * {
        box-sizing: border-box;
    }
</style>
```

### 4.4 盒模型可视化

```css
.box {
    /* 一个完整的盒子 */
    width: 200px;
    height: 100px;
    padding: 20px;
    border: 10px solid #333;
    margin: 20px;
    background-color: #f0f0f0;

    /* 从外到内布局：
       margin(20px)
         └── border(10px) #333
               └── padding(20px)
                     └── content(200x100) #f0f0f0
    */
}
```

### 4.5 margin 负值和折叠

```css
/* margin 负值 - 元素上移 */
.negative-margin {
    margin-top: -20px;
}

/* margin 折叠 */
.parent {
    /* 包含子元素的 margin */
    overflow: hidden; /* 阻止折叠 */
}

.box1 {
    margin-bottom: 20px;
}

.box2 {
    margin-top: 30px;
    /* 实际间距 = 30px（折叠取最大值） */
}
```

---

## 5. Flexbox 布局

### 5.1 什么是 Flexbox？

Flexbox（弹性盒子）是一种一维布局模型，特别适合处理行或列中的元素对齐和分布。

### 5.2 启用 Flexbox

```css
.flex-container {
    display: flex;       /* 块级弹性容器 */
    /* display: inline-flex;  行内弹性容器 */
}
```

### 5.3 容器属性

#### 5.3.1 flex-direction（主轴方向）

```css
.container {
    flex-direction: row;           /* 默认：左到右 */
    flex-direction: row-reverse;   /* 右到左 */
    flex-direction: column;         /* 上到下 */
    flex-direction: column-reverse; /* 下到上 */
}
```

#### 5.3.2 flex-wrap（换行）

```css
.container {
    flex-wrap: nowrap;       /* 默认：不换行 */
    flex-wrap: wrap;         /* 换行 */
    flex-wrap: wrap-reverse; /* 反向换行 */
}
```

#### 5.3.3 justify-content（主轴对齐）

```css
.container {
    justify-content: flex-start;     /* 默认：起点对齐 */
    justify-content: flex-end;      /* 终点对齐 */
    justify-content: center;        /* 居中 */
    justify-content: space-between; /* 两端对齐，项目之间等距 */
    justify-content: space-around;  /* 项目两侧间距相等 */
    justify-content: space-evenly;   /* 项目之间间距相等 */
}
```

#### 5.3.4 align-items（交叉轴对齐 - 单行）

```css
.container {
    align-items: stretch;       /* 默认：拉伸填满 */
    align-items: flex-start;    /* 起点对齐 */
    align-items: flex-end;      /* 终点对齐 */
    align-items: center;        /* 居中 */
    align-items: baseline;      /* 基线对齐 */
}
```

#### 5.3.5 align-content（交叉轴对齐 - 多行）

```css
.container {
    flex-wrap: wrap;
    align-content: flex-start;     /* 起点对齐 */
    align-content: flex-end;       /* 终点对齐 */
    align-content: center;          /* 居中 */
    align-content: space-between;  /* 两端对齐 */
    align-content: space-around;    /* 两侧等距 */
    align-content: stretch;         /* 默认：拉伸 */
}
```

#### 5.3.6 gap（间距）

```css
.container {
    gap: 10px;           /* 行和列间距 */
    row-gap: 10px;       /* 行间距 */
    column-gap: 20px;    /* 列间距 */
}
```

### 5.4 项目属性

#### 5.4.1 flex-basis / width（基础尺寸）

```css
.item {
    flex-basis: 200px;  /* 基础宽度 */
    /* 相当于 width: 200px; */
}
```

#### 5.4.2 flex-grow（放大比例）

```css
.item {
    flex-grow: 1;  /* 默认0，设置为1表示等分剩余空间 */
}

/* 示例：三个项目，按 1:2:3 比例分配 */
.item1 { flex-grow: 1; }
.item2 { flex-grow: 2; }
.item3 { flex-grow: 3; }
```

#### 5.4.3 flex-shrink（缩小比例）

```css
.item {
    flex-shrink: 1;  /* 默认1，允许收缩 */
}
```

#### 5.4.4 flex（简写）

```css
.item {
    /* flex: none | auto | <flex-grow> <flex-shrink> <flex-basis> */
    flex: 1;              /* flex: 1 1 0% */
    flex: auto;           /* flex: 1 1 auto */
    flex: none;          /* flex: 0 0 auto */
    flex: 0 0 200px;     /* 不放大，不缩小，固定200px */
}
```

#### 5.4.5 align-self（单个项目对齐）

```css
.item {
    align-self: auto;        /* 继承容器 align-items */
    align-self: flex-start;
    align-self: flex-end;
    align-self: center;
    align-self: baseline;
    align-self: stretch;
}
```

#### 5.4.6 order（顺序）

```css
.item {
    order: 0;  /* 默认0，数值越小越靠前 */
}

.item1 { order: 3; }
.item2 { order: 1; }
.item3 { order: 2; }
```

### 5.5 Flexbox 完整示例

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        /* 基础重置 */
        * { margin: 0; padding: 0; box-sizing: border-box; }

        /* 导航栏 */
        .navbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #333;
            padding: 0 20px;
            height: 60px;
        }

        .logo { color: white; font-size: 20px; }

        .nav-links {
            display: flex;
            gap: 20px;
            list-style: none;
        }

        .nav-links a {
            color: white;
            text-decoration: none;
        }

        /* 卡片网格 */
        .card-container {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            padding: 20px;
        }

        .card {
            flex: 1 1 300px;  /* 放大、缩小、基础宽度 */
            padding: 20px;
            background: #f9f9f9;
            border-radius: 8px;
        }

        /* 居中布局 */
        .center-box {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 200px;
            background: #e0e0e0;
        }

        /* 表单 */
        .form-row {
            display: flex;
            gap: 20px;
            margin-bottom: 15px;
        }

        .form-row label {
            flex: 0 0 100px;
            line-height: 36px;
        }

        .form-row input {
            flex: 1;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
        }

        /* 响应式 */
        @media (max-width: 768px) {
            .navbar {
                flex-direction: column;
                height: auto;
                padding: 10px;
            }

            .form-row {
                flex-direction: column;
            }

            .form-row label {
                flex: none;
            }
        }
    </style>
</head>
<body>
    <!-- 导航栏 -->
    <nav class="navbar">
        <div class="logo">Logo</div>
        <ul class="nav-links">
            <li><a href="#">首页</a></li>
            <li><a href="#">产品</a></li>
            <li><a href="#">关于</a></li>
        </ul>
    </nav>

    <!-- 卡片网格 -->
    <div class="card-container">
        <div class="card">卡片1</div>
        <div class="card">卡片2</div>
        <div class="card">卡片3</div>
    </div>

    <!-- 居中 -->
    <div class="center-box">
        <p>垂直水平居中</p>
    </div>

    <!-- 表单 -->
    <form style="padding: 20px;">
        <div class="form-row">
            <label>用户名：</label>
            <input type="text">
        </div>
        <div class="form-row">
            <label>邮箱：</label>
            <input type="email">
        </div>
    </form>
</body>
</html>
```

---

## 6. Grid 布局

### 6.1 什么是 Grid？

CSS Grid 是一个二维布局系统，可以同时控制行和列。

### 6.2 启用 Grid

```css
.grid-container {
    display: grid;           /* 块级网格 */
    /* display: inline-grid;  行内网格 */
}
```

### 6.3 容器属性

#### 6.3.1 grid-template-columns / rows（定义网格）

```css
.container {
    /* 固定宽度 */
    grid-template-columns: 200px 200px 200px;

    /* 百分比 */
    grid-template-columns: 33.33% 33.33% 33.33%;

    /* fr 单位（比例） */
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-columns: 2fr 1fr 1fr;

    /* repeat() 函数 */
    grid-template-columns: repeat(3, 1fr);
    grid-template-columns: repeat(3, 200px);

    /* auto-fit / auto-fill 自适应 */
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));

    /* 混合使用 */
    grid-template-columns: 200px repeat(2, 1fr) 100px;

    /* 行高 */
    grid-template-rows: 100px 200px auto;
}
```

#### 6.3.2 gap（网格间距）

```css
.container {
    gap: 20px;           /* 行和列间距 */
    row-gap: 10px;       /* 行间距 */
    column-gap: 20px;    /* 列间距 */
}
```

#### 6.3.3 grid-template-areas（命名区域）

```css
.container {
    grid-template-areas:
        "header header header"
        "sidebar main main"
        "footer footer footer";

    /* 等价于 */
    grid-template-columns: 200px 1fr 1fr;
    grid-template-rows: auto 1fr auto;
}

.header { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main { grid-area: main; }
.footer { grid-area: footer; }
```

#### 6.3.4 justify-items / align-items（项目对齐）

```css
.container {
    justify-items: start | end | center | stretch;
    align-items: start | end | center | stretch;
}
```

#### 6.3.5 justify-content / align-content（网格对齐）

```css
.container {
    justify-content: start | end | center | stretch | space-around | space-between | space-evenly;
    align-content: start | end | center | stretch | space-around | space-between | space-evenly;
}
```

### 6.4 项目属性

#### 6.4.1 grid-column / grid-row（位置）

```css
.item {
    /* 起始位置 / 结束位置 */
    grid-column: 1 / 3;      /* 从第1条线到第3条线 */
    grid-column: 1 / span 2; /* 从第1条线跨2格 */
    grid-row: 1 / 4;

    /* 简写 */
    grid-area: 1 / 1 / 4 / 3; /* row-start / col-start / row-end / col-end */
}
```

#### 6.4.2 grid-area（命名区域）

```css
.item {
    grid-area: header;  /* 命名 */
}
```

#### 6.4.3 justify-self / align-self（单个项目对齐）

```css
.item {
    justify-self: start | end | center | stretch;
    align-self: start | end | center | stretch;
}
```

### 6.5 Grid 完整示例

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body { font-family: sans-serif; }

        /* 页面布局 */
        .layout {
            display: grid;
            grid-template-columns: 200px 1fr 200px;
            grid-template-rows: auto 1fr auto;
            grid-template-areas:
                "header header header"
                "sidebar main aside"
                "footer footer footer";
            min-height: 100vh;
        }

        .header {
            grid-area: header;
            background: #333;
            color: white;
            padding: 20px;
        }

        .sidebar {
            grid-area: sidebar;
            background: #f5f5f5;
            padding: 20px;
        }

        .main {
            grid-area: main;
            padding: 20px;
        }

        .aside {
            grid-area: aside;
            background: #f5f5f5;
            padding: 20px;
        }

        .footer {
            grid-area: footer;
            background: #333;
            color: white;
            padding: 20px;
            text-align: center;
        }

        /* 响应式 */
        @media (max-width: 768px) {
            .layout {
                grid-template-columns: 1fr;
                grid-template-rows: auto auto 1fr auto auto;
                grid-template-areas:
                    "header"
                    "sidebar"
                    "main"
                    "aside"
                    "footer";
            }
        }

        /* 卡片网格 */
        .card-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            padding: 20px;
        }

        .card {
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <!-- 页面布局 -->
    <div class="layout">
        <header class="header">头部</header>
        <aside class="sidebar">侧边栏</aside>
        <main class="main">主要内容</main>
        <aside class="aside">右侧边栏</aside>
        <footer class="footer">页脚</footer>
    </div>

    <hr>

    <!-- 卡片网格 -->
    <div class="card-grid">
        <div class="card">卡片1</div>
        <div class="card">卡片2</div>
        <div class="card">卡片3</div>
        <div class="card">卡片4</div>
        <div class="card">卡片5</div>
        <div class="card">卡片6</div>
    </div>
</body>
</html>
```

---

## 7. 定位

### 7.1 position 属性

```css
.positioned {
    position: static;      /* 默认定位 */
    position: relative;     /* 相对定位 */
    position: absolute;    /* 绝对定位 */
    position: fixed;        /* 固定定位 */
    position: sticky;       /* 粘性定位 */
}
```

### 7.2 static（静态定位）

```css
.static {
    position: static;
    /* 正常文档流，不受 top/right/bottom/left 影响 */
}
```

### 7.3 relative（相对定位）

```css
.relative {
    position: relative;
    top: 20px;       /* 相对于原位置向下偏移 */
    left: 10px;      /* 相对于原位置向右偏移 */
    /* 元素占据的原位置保留 */
}
```

```html
<div style="border: 1px solid #ccc; padding: 20px; margin: 20px;">
    <div style="width: 100px; height: 100px; background: #e0e0e0;">
        原始位置
    </div>
    <div style="width: 100px; height: 100px; background: #ff6b6b;
                position: relative; top: 30px; left: 30px;">
        相对定位后
    </div>
    <div style="width: 100px; height: 100px; background: #e0e0e0;">
        后续元素
    </div>
</div>
```

### 7.4 absolute（绝对定位）

```css
.parent {
    position: relative;  /* 父元素需要相对定位 */
}

.absolute {
    position: absolute;
    top: 0;
    right: 0;
    /* 相对于最近定位祖先元素定位 */
    /* 脱离文档流，不占据空间 */
}
```

```html
<div style="position: relative; width: 300px; height: 200px;
            border: 1px solid #333; margin: 20px;">
    <div style="position: absolute; top: 10px; left: 10px;
                background: #ff6b6b; padding: 10px;">
        左上角
    </div>
    <div style="position: absolute; top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                background: #4ecdc4; padding: 10px;">
        正中央
    </div>
    <div style="position: absolute; bottom: 10px; right: 10px;
                background: #ffe66d; padding: 10px;">
        右下角
    </div>
</div>
```

### 7.5 fixed（固定定位）

```css
.fixed {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    /* 相对于视口定位 */
    /* 脱离文档流 */
}
```

```html
<!-- 固定头部 -->
<header style="position: fixed; top: 0; left: 0; right: 0;
               background: #333; color: white; padding: 15px;">
    固定头部
</header>

<!-- 内容区域 -->
<div style="margin-top: 60px;">
    <p>内容...</p>
</div>
```

### 7.6 sticky（粘性定位）

```css
.sticky {
    position: sticky;
    top: 20px;
    /* 在视口内是相对定位，溢出时变为固定定位 */
}
```

```html
<div style="height: 2000px; padding: 20px;">
    <div style="position: sticky; top: 10px; background: #ff6b6b;
                padding: 10px; text-align: center;">
        粘性元素（滚动到顶部时固定）
    </div>
    <p>滚动查看效果...</p>
</div>
```

### 7.7 z-index（层叠顺序）

```css
.box1 {
    position: relative;
    z-index: 1;
}

.box2 {
    position: relative;
    z-index: 2;  /* 更高，叠在上层 */
}

.box3 {
    position: relative;
    z-index: auto;  /* 默认 */
}
```

### 7.8 定位综合示例

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        /* 页面布局 */
        body { padding-bottom: 100px; }

        /* 固定导航 */
        .navbar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: #333;
            color: white;
            display: flex;
            align-items: center;
            padding: 0 20px;
            z-index: 1000;
        }

        /* 相对定位容器 */
        .card {
            position: relative;
            width: 300px;
            margin: 100px auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
        }

        /* 绝对定位标签 */
        .badge {
            position: absolute;
            top: -10px;
            right: -10px;
            background: #ff6b6b;
            color: white;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 12px;
        }

        /* 粘性目录 */
        .toc {
            position: sticky;
            top: 80px;
            width: 200px;
            background: #f5f5f5;
            padding: 20px;
            float: left;
            margin-left: 20px;
        }

        /* 弹出层遮罩 */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
        }

        .modal {
            background: white;
            padding: 30px;
            border-radius: 8px;
            max-width: 400px;
        }
    </style>
</head>
<body>
    <!-- 固定导航 -->
    <nav class="navbar">固定导航栏</nav>

    <!-- 卡片 -->
    <div class="card">
        <span class="badge">NEW</span>
        <h2>商品名称</h2>
        <p>商品描述...</p>
    </div>

    <!-- 粘性目录 -->
    <div class="toc">
        <h3>目录</h3>
        <ul>
            <li>第一章</li>
            <li>第二章</li>
            <li>第三章</li>
        </ul>
    </div>

    <div style="margin-left: 260px; padding: 20px;">
        <h1>内容区域</h1>
        <p>大量内容...</p>
        <div style="height: 1500px;"></div>
    </div>

    <!-- 弹出层 -->
    <div class="modal-overlay">
        <div class="modal">
            <h2>提示</h2>
            <p>这是一个弹出层示例</p>
        </div>
    </div>
</body>
</html>
```

---

## 8. 响应式设计

### 8.1 viewport 视口

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

### 8.2 媒体查询

```css
/* 基础样式 */
.container {
    width: 100%;
    padding: 20px;
}

/* 平板及以上 */
@media (min-width: 768px) {
    .container {
        width: 750px;
        margin: 0 auto;
    }
}

/* 桌面及以上 */
@media (min-width: 1024px) {
    .container {
        width: 960px;
    }
}

/* 大屏幕 */
@media (min-width: 1200px) {
    .container {
        width: 1140px;
    }
}

/* 断点示例 */
@media (max-width: 767px) {
    /* 手机样式 */
}

@media (min-width: 768px) and (max-width: 1023px) {
    /* 平板样式 */
}

@media (min-width: 1024px) {
    /* 桌面样式 */
}
```

### 8.3 常见断点

```css
/* 超小屏幕（手机）< 576px */
@media (max-width: 575px) { }

/* 小屏幕（平板）576px - 767px */
@media (min-width: 576px) and (max-width: 767px) { }

/* 中等屏幕（桌面）768px - 991px */
@media (min-width: 768px) and (max-width: 991px) { }

/* 大屏幕 992px - 1199px */
@media (min-width: 992px) and (max-width: 1199px) { }

/* 超大屏幕 >= 1200px */
@media (min-width: 1200px) { }
```

### 8.4 响应式列系统

```css
/* 基础网格 */
.row {
    display: flex;
    flex-wrap: wrap;
    margin: -10px;
}

.col {
    padding: 10px;
}

/* 12列系统 */
.col-1 { flex: 0 0 8.33%; max-width: 8.33%; }
.col-2 { flex: 0 0 16.66%; max-width: 16.66%; }
.col-3 { flex: 0 0 25%; max-width: 25%; }
.col-4 { flex: 0 0 33.33%; max-width: 33.33%; }
.col-5 { flex: 0 0 41.66%; max-width: 41.66%; }
.col-6 { flex: 0 0 50%; max-width: 50%; }
.col-7 { flex: 0 0 58.33%; max-width: 58.33%; }
.col-8 { flex: 0 0 66.66%; max-width: 66.66%; }
.col-9 { flex: 0 0 75%; max-width: 75%; }
.col-10 { flex: 0 0 83.33%; max-width: 83.33%; }
.col-11 { flex: 0 0 91.66%; max-width: 91.66%; }
.col-12 { flex: 0 0 100%; max-width: 100%; }

/* 响应式 - 平板 */
@media (max-width: 767px) {
    [class*="col-"] {
        flex: 0 0 100%;
        max-width: 100%;
    }
}
```

```html
<!-- 使用 -->
<div class="row">
    <div class="col col-3">3列</div>
    <div class="col col-9">9列</div>
</div>
```

### 8.5 响应式图片

```css
/* 响应式图片 */
img {
    max-width: 100%;
    height: auto;
}

/* picture 元素 */
picture img {
    width: 100%;
    height: auto;
}
```

### 8.6 响应式设计示例

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /* 导航 */
        .navbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #333;
            color: white;
            padding: 1rem;
        }

        .menu-toggle {
            display: none;
        }

        .nav-links {
            display: flex;
            list-style: none;
            gap: 1rem;
        }

        /* 主内容 */
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 1rem;
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
        }

        .card {
            background: #f5f5f5;
            padding: 1rem;
            border-radius: 8px;
        }

        /* 响应式 */
        @media (max-width: 992px) {
            .grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        @media (max-width: 576px) {
            .menu-toggle {
                display: block;
            }

            .nav-links {
                display: none;
            }

            .nav-links.active {
                display: flex;
                flex-direction: column;
                position: absolute;
                top: 60px;
                left: 0;
                right: 0;
                background: #333;
                padding: 1rem;
            }

            .grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="logo">Logo</div>
        <button class="menu-toggle">菜单</button>
        <ul class="nav-links">
            <li><a href="#" style="color: white; text-decoration: none;">首页</a></li>
            <li><a href="#" style="color: white; text-decoration: none;">产品</a></li>
            <li><a href="#" style="color: white; text-decoration: none;">关于</a></li>
        </ul>
    </nav>

    <main class="container">
        <div class="grid">
            <div class="card">卡片1</div>
            <div class="card">卡片2</div>
            <div class="card">卡片3</div>
            <div class="card">卡片4</div>
            <div class="card">卡片5</div>
            <div class="card">卡片6</div>
        </div>
    </main>
</body>
</html>
```

---

## 9. 动画和过渡

### 9.1 transform（变换）

```css
.transform {
    /* 2D 变换 */
    transform: translate(20px, 30px);    /* 平移 */
    transform: rotate(45deg);             /* 旋转 */
    transform: scale(1.5);               /* 缩放 */
    transform: skew(20deg, 10deg);        /* 倾斜 */

    /* 组合变换 */
    transform: translate(20px, 30px) rotate(45deg) scale(1.5);

    /* 3D 变换 */
    transform: translateX(20px);
    transform: translateY(20px);
    transform: translateZ(20px);
    transform: rotateX(45deg);
    transform: rotateY(45deg);
    transform: rotateZ(45deg);

    /* 3D 透视 */
    perspective: 1000px;
    transform-style: preserve-3d;
}
```

### 9.2 transition（过渡）

```css
.button {
    background: #007bff;
    transition: background 0.3s ease;
}

.button:hover {
    background: #0056b3;
}

/* 多个属性 */
.box {
    transition:
        background-color 0.3s ease,
        transform 0.3s ease,
        opacity 0.3s ease;
}

/* 过渡-timing-function */
.ease { transition-timing-function: ease; }        /* 缓入缓出 */
.linear { transition-timing-function: linear; }     /* 线性 */
.ease-in { transition-timing-function: ease-in; }  /* 缓入 */
.ease-out { transition-timing-function: ease-out; }/* 缓出 */
.ease-in-out { transition-timing-function: ease-in-out; }
.cubic-bezier(0.68, -0.55, 0.27, 1.55)  /* 自定义 */

/* 延迟 */
.delay {
    transition: transform 0.3s ease 0.5s;
}
```

```html
<!-- 过渡示例 -->
<style>
    .box {
        width: 100px;
        height: 100px;
        background: #3498db;
        transition: all 0.3s ease;
    }

    .box:hover {
        transform: translateY(-10px);
        box-shadow: 0 10px 20px rgba(0,0,0,0.2);
    }
</style>

<div class="box"></div>
```

### 9.3 animation（动画）

```css
/* 定义动画 */
@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateX(-100%);
    }
    to {
        opacity: 1;
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

@keyframes fadeIn {
    0% { opacity: 0; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
}

/* 应用动画 */
.animated {
    animation: slideIn 0.5s ease forwards;
    animation: bounce 1s infinite;
    animation: fadeIn 2s ease-in-out;
}
```

```html
<!-- 动画示例 -->
<style>
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }

    .pulse {
        width: 100px;
        height: 100px;
        background: #e74c3c;
        animation: pulse 2s infinite;
    }
</style>

<div class="pulse"></div>
```

### 9.4 完整动画示例

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body { padding: 50px; }

        /* 加载动画 */
        .loader {
            width: 50px;
            height: 50px;
            border: 5px solid #f3f3f3;
            border-top: 5px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* 卡片悬停效果 */
        .card {
            width: 200px;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .card:hover {
            transform: translateY(-10px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }

        /* 按钮点击效果 */
        .btn {
            padding: 12px 24px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .btn:hover {
            background: #2980b9;
            transform: translateY(-2px);
        }

        .btn:active {
            transform: translateY(0);
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }

        /* 渐入动画 */
        .fade-in {
            opacity: 0;
            animation: fadeIn 0.5s ease forwards;
        }

        .delay-1 { animation-delay: 0.2s; }
        .delay-2 { animation-delay: 0.4s; }
        .delay-3 { animation-delay: 0.6s; }

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

        /* 走马灯效果 */
        .marquee {
            overflow: hidden;
            white-space: nowrap;
        }

        .marquee-content {
            display: inline-block;
            animation: marquee 10s linear infinite;
        }

        @keyframes marquee {
            from { transform: translateX(100%); }
            to { transform: translateX(-100%); }
        }

        /* 骨架屏 */
        .skeleton {
            background: #f0f0f0;
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
    </style>
</head>
<body>
    <h2>加载动画</h2>
    <div class="loader"></div>

    <h2>卡片悬停效果</h2>
    <div class="card">
        <h3>卡片标题</h3>
        <p>卡片内容...</p>
    </div>

    <h2>按钮效果</h2>
    <button class="btn">点击我</button>

    <h2>渐入动画</h2>
    <div class="fade-in delay-1">元素1</div>
    <div class="fade-in delay-2">元素2</div>
    <div class="fade-in delay-3">元素3</div>

    <h2>骨架屏</h2>
    <div style="width: 300px; padding: 20px;">
        <div class="skeleton" style="height: 20px; margin-bottom: 10px; width: 60%;"></div>
        <div class="skeleton" style="height: 16px; margin-bottom: 8px;"></div>
        <div class="skeleton" style="height: 16px; width: 80%;"></div>
    </div>
</body>
</html>
```

---

## 10. CSS 变量

### 10.1 定义和使用变量

```css
/* 定义变量（根作用域） */
:root {
    --primary-color: #3498db;
    --secondary-color: #2ecc71;
    --text-color: #333;
    --spacing: 20px;
    --border-radius: 8px;
}

/* 使用变量 */
.button {
    background: var(--primary-color);
    color: white;
    padding: var(--spacing);
    border-radius: var(--border-radius);
}
```

### 10.2 变量继承和覆盖

```css
/* 局部变量 */
.container {
    --bg-color: #f5f5f5;
    background: var(--bg-color);
}

/* 子元素继承 */
.child {
    background: var(--bg-color);
}

/* 覆盖变量 */
.special {
    --primary-color: #e74c3c;
    background: var(--primary-color);
}
```

### 10.3 变量在 JavaScript 中使用

```css
:root {
    --theme-color: #3498db;
}
```

```javascript
// 读取变量
const color = getComputedStyle(document.documentElement)
    .getPropertyValue('--theme-color');

// 设置变量
document.documentElement.style.setProperty('--theme-color', '#e74c3c');
```

### 10.4 响应式变量

```css
:root {
    --font-size: 16px;
    --container-width: 1200px;
}

@media (max-width: 768px) {
    :root {
        --font-size: 14px;
        --container-width: 100%;
    }
}

body {
    font-size: var(--font-size);
}

.container {
    max-width: var(--container-width);
}
```

### 10.5 CSS 变量示例

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        /* 定义主题变量 */
        :root {
            /* 颜色 */
            --primary: #3498db;
            --primary-dark: #2980b9;
            --secondary: #2ecc71;
            --danger: #e74c3c;
            --dark: #2c3e50;
            --light: #ecf0f1;
            --text: #333;
            --text-light: #666;

            /* 间距 */
            --space-xs: 4px;
            --space-sm: 8px;
            --space-md: 16px;
            --space-lg: 24px;
            --space-xl: 32px;

            /* 圆角 */
            --radius-sm: 4px;
            --radius-md: 8px;
            --radius-lg: 16px;

            /* 阴影 */
            --shadow-sm: 0 2px 4px rgba(0,0,0,0.1);
            --shadow-md: 0 4px 8px rgba(0,0,0,0.15);
            --shadow-lg: 0 8px 16px rgba(0,0,0,0.2);

            /* 过渡 */
            --transition: 0.3s ease;
        }

        /* 暗色主题 */
        [data-theme="dark"] {
            --primary: #5dade2;
            --dark: #ecf0f1;
            --light: #2c3e50;
            --text: #ecf0f1;
            --text-light: #bdc3c7;
        }

        /* 使用变量 */
        body {
            background: var(--light);
            color: var(--text);
            font-family: sans-serif;
            margin: 0;
            padding: var(--space-lg);
            transition: var(--transition);
        }

        .card {
            background: white;
            padding: var(--space-lg);
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-md);
            margin-bottom: var(--space-md);
            color: var(--text);
        }

        .btn {
            padding: var(--space-sm) var(--space-md);
            border: none;
            border-radius: var(--radius-sm);
            cursor: pointer;
            font-size: 1rem;
            transition: var(--transition);
        }

        .btn-primary {
            background: var(--primary);
            color: white;
        }

        .btn-primary:hover {
            background: var(--primary-dark);
            transform: translateY(-2px);
            box-shadow: var(--shadow-sm);
        }

        /* 主题切换 */
        .theme-toggle {
            position: fixed;
            top: 20px;
            right: 20px;
        }
    </style>
</head>
<body>
    <button class="btn btn-primary theme-toggle" onclick="toggleTheme()">
        切换主题
    </button>

    <div class="card">
        <h2>CSS 变量示例</h2>
        <p>这是一个使用 CSS 变量构建的卡片组件。</p>
    </div>

    <div class="card">
        <h2>主题切换</h2>
        <p>点击右上角按钮切换明暗主题。</p>
    </div>

    <script>
        function toggleTheme() {
            const html = document.documentElement;
            const current = html.getAttribute('data-theme');
            html.setAttribute('data-theme',
                current === 'dark' ? 'light' : 'dark'
            );
        }
    </script>
</body>
</html>
```

---

## 练习题

### 练习 1：Flexbox 导航栏

创建一个响应式导航栏：
- PC 端：Logo 在左，链接在右
- 移动端：Logo 在上，链接在下

### 练习 2：Grid 相册布局

使用 Grid 创建图片画廊：
- PC 端：4列
- 平板：3列
- 手机：2列

### 练习 3：卡片悬停效果

创建产品卡片，包含：
- 悬停时上移并添加阴影
- 点击时缩放效果
- 过渡动画

### 练习 4：实现暗色主题

使用 CSS 变量实现主题切换：
- 定义完整的颜色变量
- 实现一键切换明暗主题

---

## 总结

本章详细介绍了 CSS 的核心知识点：

1. **CSS 引入方式**：内联、内嵌、外链
2. **选择器**：元素、类、ID、属性、伪类、伪元素
3. **优先级和层叠**：选择器优先级计算、!important、继承
4. **盒模型**：content、padding、border、margin、box-sizing
5. **Flexbox**：一维布局，容器和项目属性
6. **Grid**：二维布局，网格模板和区域
7. **定位**：static、relative、absolute、fixed、sticky
8. **响应式设计**：viewport、媒体查询、断点
9. **动画和过渡**：transform、transition、animation、keyframes
10. **CSS 变量**：定义、使用、响应式、JavaScript 交互

掌握这些知识后，你就可以创建现代、响应式、交互性强的网页了！
