# HTML 基础

## 目录

1. [HTML 简介和发展历史](#1-html-简介和发展历史)
2. [文档结构](#2-文档结构)
3. [语义化标签](#3-语义化标签)
4. [文本标签](#4-文本标签)
5. [列表](#5-列表)
6. [表格](#6-表格)
7. [表单](#7-表单)
8. [多媒体](#8-多媒体)
9. [全局属性](#9-全局属性)
10. [常用meta标签](#10-常用meta标签)
11. [语义化最佳实践](#11-语义化最佳实践)

---

## 1. HTML 简介和发展历史

### 1.1 什么是 HTML？

**HTML**（HyperText Markup Language，超文本标记语言）是用于创建网页的标准标记语言。它不是一种编程语言，而是一种标记语言，用于告诉浏览器如何结构化网页内容。

**核心概念：**
- **超文本**：不仅包含文本，还可以包含图片、链接、视频等多媒体内容
- **标记语言**：使用标签（tag）来描述文档的结构和内容

### 1.2 HTML 发展历史

| 年份 | 版本 | 主要特点 |
|------|------|----------|
| 1991 | HTML 1.0 | 最初的简单版本，只有18个标签 |
| 1995 | HTML 2.0 | 添加表单功能 |
| 1997 | HTML 3.2 | 添加表格、复杂排版 |
| 1999 | HTML 4.01 | 引入CSS支持，语义化改进 |
| 2000 | XHTML 1.0 | XML格式的HTML，更严格 |
| 2012 | HTML5 | 现代标准，支持语义化、多媒体、离线存储 |

### 1.3 HTML5 的重大改进

```javascript
// HTML5 新增特性总结
const html5Features = {
    语义化标签: ['header', 'nav', 'main', 'article', 'section', 'aside', 'footer'],
    多媒体: ['video', 'audio', 'canvas'],
    表单增强: ['input 新类型', 'datalist', 'output'],
    存储: ['localStorage', 'sessionStorage', 'IndexedDB'],
    离线: ['Application Cache', 'Service Worker'],
    通信: ['WebSocket', 'Web Workers'],
    地理: ['Geolocation API']
};
```

### 1.4 第一个 HTML 页面

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>我的第一个网页</title>
</head>
<body>
    <h1>你好，世界！</h1>
    <p>欢迎学习 HTML！</p>
</body>
</html>
```

---

## 2. 文档结构

### 2.1 完整文档结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <!-- 文档头部信息 -->
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="网页描述信息">
    <meta name="keywords" content="HTML, CSS, JavaScript">
    <title>页面标题</title>
    <!-- 外部资源引用 -->
    <link rel="stylesheet" href="styles.css">
    <script src="script.js"></script>
</head>
<body>
    <!-- 文档主体内容 -->
    <header>
        <h1>网站标题</h1>
    </header>

    <main>
        <article>
            <h2>文章标题</h2>
            <p>文章内容...</p>
        </article>
    </main>

    <footer>
        <p>&copy; 2024 公司名称</p>
    </footer>
</body>
</html>
```

### 2.2 DOCTYPE 声明

`<!DOCTYPE html>` 是 HTML5 的文档类型声明，必须放在 HTML 文档的第一行。

**作用：**
- 告诉浏览器使用 HTML5 标准解析文档
- 启用标准模式（Standards Mode）

```html
<!-- HTML5（推荐） -->
<!DOCTYPE html>

<!-- 旧版本（不推荐） -->
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
    "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
```

### 2.3 html 标签

```html
<!-- 根元素，lang 属性指定语言 -->
<html lang="zh-CN">
    <!-- 中文网页使用 zh-CN -->
    <!-- 英文网页使用 en -->
    <!-- 繁体中文使用 zh-TW -->
</html>
```

### 2.4 head 标签

`head` 标签包含文档的元数据（metadata），不显示在页面内容中。

```html
<head>
    <!-- 字符编码 -->
    <meta charset="UTF-8">

    <!-- 响应式 viewport 设置（移动端必备） -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!-- 页面标题（浏览器标签显示） -->
    <title>页面标题</title>

    <!-- 网页描述（搜索引擎使用） -->
    <meta name="description" content="这是网页的描述信息">

    <!-- 关键词（搜索引擎使用） -->
    <meta name="keywords" content="HTML, CSS, JavaScript, 前端">

    <!-- 作者 -->
    <meta name="author" content="张三">

    <!-- 刷新/重定向 -->
    <meta http-equiv="refresh" content="30">
    <!-- 3秒后跳转到百度 -->
    <meta http-equiv="refresh" content="3;url=https://www.baidu.com">

    <!-- 外部样式表 -->
    <link rel="stylesheet" href="style.css">

    <!-- 图标 -->
    <link rel="icon" href="favicon.ico">

    <!-- JavaScript -->
    <script src="app.js"></script>

    <!-- 基础 URL -->
    <base href="https://example.com/">
</head>
```

### 2.5 body 标签

`body` 标签包含所有可见的页面内容。

```html
<body>
    <!-- 所有可见内容都在这里 -->
    <h1>一级标题</h1>
    <p>段落文本</p>
    <div>块级容器</div>
    <span>行内容器</span>
</body>
```

---

## 3. 语义化标签

### 3.1 什么是语义化？

**语义化**是指使用具有明确含义的 HTML 标签，让标签本身表达内容的结构意义，而不仅仅是视觉样式。

**语义化的好处：**
1. **可读性**：代码更易阅读和维护
2. **SEO**：搜索引擎更好地理解页面结构
3. **无障碍**：屏幕阅读器能更好地解析内容
4. **团队协作**：开发者更容易理解代码意图

### 3.2 语义化标签详解

```html
<!-- header - 页头或区域头部 -->
<header>
    <logo>网站Logo</logo>
    <nav>
        <a href="/">首页</a>
        <a href="/about">关于</a>
        <a href="/contact">联系</a>
    </nav>
</header>

<!-- nav - 导航链接区域 -->
<nav>
    <ul>
        <li><a href="#home">首页</a></li>
        <li><a href="#products">产品</a></li>
        <li><a href="#services">服务</a></li>
        <li><a href="#contact">联系</a></li>
    </ul>
</nav>

<!-- main - 主内容区域（每个页面一个） -->
<main>
    <h1>页面主标题</h1>

    <!-- article - 独立完整的内容 -->
    <article>
        <h2>文章标题</h2>
        <p>文章内容...</p>
        <footer>作者信息、发布时间</footer>
    </article>

    <!-- section - 文档中的章节/部分 -->
    <section>
        <h2>章节标题</h2>
        <p>章节内容...</p>
    </section>

    <!-- aside - 侧边栏相关内容 -->
    <aside>
        <h3>相关文章</h3>
        <ul>
            <li><a href="#">相关链接1</a></li>
            <li><a href="#">相关链接2</a></li>
        </ul>
    </aside>
</main>

<!-- footer - 页脚或区域底部 -->
<footer>
    <p>&copy; 2024 公司名称. 保留所有权利.</p>
    <address>
        联系方式: <a href="mailto:info@example.com">info@example.com</a>
    </address>
</footer>
```

### 3.3 article 与 section 的区别

```html
<!-- article: 内容独立、可单独分发 -->
<article>
    <h1>一篇博客文章</h1>
    <p>文章正文...</p>
    <!-- 评论是文章的组成部分，用 section -->
    <section class="comments">
        <h2>评论</h2>
        <p>评论1...</p>
        <p>评论2...</p>
    </section>
</article>

<!-- section: 文档中的通用章节 -->
<section>
    <h2>产品介绍</h2>
    <p>产品详情...</p>
</section>

<section>
    <h2>产品规格</h2>
    <p>规格详情...</p>
</section>
```

### 3.4 语义化布局示例

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>语义化布局示例</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, sans-serif; }
        header { background: #333; color: #fff; padding: 20px; }
        nav ul { list-style: none; display: flex; gap: 20px; }
        nav a { color: #fff; text-decoration: none; }
        main { display: flex; gap: 20px; padding: 20px; }
        article { flex: 2; }
        aside { flex: 1; background: #f5f5f5; padding: 20px; }
        footer { background: #333; color: #fff; padding: 20px; text-align: center; }
    </style>
</head>
<body>
    <header>
        <h1>我的博客</h1>
        <nav>
            <ul>
                <li><a href="#">首页</a></li>
                <li><a href="#">文章</a></li>
                <li><a href="#">关于</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <article>
            <h2>第一篇文章</h2>
            <p>这是文章的正文内容...</p>
        </article>
        <aside>
            <h3>关于我</h3>
            <p>这里是侧边栏内容...</p>
        </aside>
    </main>

    <footer>
        <p>&copy; 2024 我的博客</p>
    </footer>
</body>
</html>
```

---

## 4. 文本标签

### 4.1 标题标签 h1-h6

```html
<h1>一级标题 - 最重要的标题</h1>
<h2>二级标题 - 章节标题</h2>
<h3>三级标题 - 小节标题</h3>
<h4>四级标题 - 次级小节</h4>
<h5>五级标题 - 较小标题</h5>
<h6>六级标题 - 最小标题</h6>
```

**使用规则：**
```html
<!-- 正确：一个页面只有一个 h1 -->
<article>
    <h1>文章主标题</h1>
    <section>
        <h2>章节标题</h2>
        <section>
            <h3>小节标题</h3>
        </section>
    </section>
</article>

<!-- 错误：不要跳过标题级别 -->
<!-- 错误示例：h1 直接跳到 h3 -->
<h1>标题</h1>
<h3>这是错误的</h3>
```

### 4.2 段落和换行

```html
<!-- p 标签：段落 -->
<p>这是一个段落。浏览器会自动在段落前后添加间距。</p>
<p>这是另一个段落。</p>

<!-- br 标签：强制换行 -->
<p>第一行<br>第二行<br>第三行</p>

<!-- hr 标签：水平分隔线 -->
<p>上面是分隔线上面的内容</p>
<hr>
<p>下面是分隔线下面的内容</p>
```

### 4.3 span 标签

`span` 是行内元素，用于对文本的某部分进行样式设置或操作。

```html
<p>这是一段普通文本，<span style="color: red;">这部分是红色</span>，这部分又是普通文本。</p>

<!-- 结合 class 使用 -->
<p>价格：<span class="price">99.99</span> 元</p>
<p>状态：<span class="status success">已完成</span></p>

<style>
    .price { font-weight: bold; color: #e74c3c; }
    .status { padding: 2px 8px; border-radius: 4px; }
    .success { background: #2ecc71; color: white; }
</style>
```

### 4.4 a 标签（链接）

```html
<!-- 基本用法 -->
<a href="https://www.baidu.com">访问百度</a>
<a href="about.html">关于页面</a>
<a href="#section1">跳转到本页章节</a>

<!-- 新窗口打开 -->
<a href="https://www.baidu.com" target="_blank">新窗口打开百度</a>

<!-- 发送邮件 -->
<a href="mailto:example@email.com">发送邮件</a>

<!-- 电话（移动端） -->
<a href="tel:13800138000">拨打热线</a>

<!-- 下载文件 -->
<a href="files/document.pdf" download>下载 PDF</a>
<a href="files/image.png" download="新文件名.png">下载并重命名</a>

<!-- 锚点链接 -->
<h2 id="section1">第一章</h2>
<a href="#section1">跳转到第一章</a>
<a href="page.html#section1">跳转到其他页面的章节</a>
```

### 4.5 strong 和 b 标签

```html
<!-- strong: 表示重要内容，语义化 -->
<p><strong>注意：</strong>请在截止日期前完成提交。</p>
<p>这段话中，<strong>这部分内容特别重要</strong>需要强调。</p>

<!-- b: 仅仅是视觉加粗，无语义 -->
<p>普通文本，<b>这部分只是加粗显示</b>而已。</p>
```

### 4.6 em 和 i 标签

```html
<!-- em: 表示强调，语义化 -->
<p>学习 <em>HTML</em> 是 Web 开发的第一步。</p>
<p>我 <em>真的</em> 很喜欢这门课程！</p>

<!-- i: 仅仅是斜体显示，无语义 -->
<p><i>这是一段引用的文本</i></p>
<p><i>技术术语</i> 通常用斜体表示。</p>
```

### 4.7 其他文本标签

```html
<!-- mark: 标记/高亮 -->
<p>搜索结果中 <mark>关键词</mark> 会被高亮显示。</p>

<!-- del: 删除线 -->
<p>原价：<del>199元</del> 现价：99元</p>

<!-- ins: 下划线（表示新增） -->
<p>新增内容：<ins>这是新添加的内容</ins></p>

<!-- small: 小号文字 -->
<p>正文内容 <small>补充说明文字</small></p>

<!-- sub: 下标 -->
<p>化学式：H<sub>2</sub>O</p>

<!-- sup: 上标 -->
<p>数学公式：x<sup>2</sup> + y<sup>2</sup></p>

<!-- code: 代码 -->
<p>使用 <code>console.log()</code> 输出内容。</p>

<!-- pre: 预格式化文本 -->
<pre>
function hello() {
    console.log("Hello World");
}
</pre>

<!-- blockquote: 块引用 -->
<blockquote cite="https://example.com">
    <p>这是引用的内容。</p>
    <footer>—— <cite>来源</cite></footer>
</blockquote>

<!-- q: 行内引用 -->
<p>正如所说：<q>学无止境</q>。</p>
```

---

## 5. 列表

### 5.1 无序列表 ul

```html
<!-- 基本用法 -->
<ul>
    <li>苹果</li>
    <li>香蕉</li>
    <li>橙子</li>
</ul>

<!-- 嵌套列表 -->
<ul>
    <li>
        水果
        <ul>
            <li>苹果</li>
            <li>香蕉</li>
        </ul>
    </li>
    <li>
        蔬菜
        <ul>
            <li>白菜</li>
            <li>萝卜</li>
        </ul>
    </li>
</ul>

<!-- 自定义标记类型（CSS 控制更灵活，此处仅作了解） -->
<ul type="circle">
    <li>圆形标记</li>
</ul>
<ul type="square">
    <li>方形标记</li>
</ul>
```

### 5.2 有序列表 ol

```html
<!-- 基本用法 -->
<ol>
    <li>第一步：准备材料</li>
    <li>第二步：混合搅拌</li>
    <li>第三步：烘烤</li>
</ol>

<!-- 调整起始数字 -->
<ol start="5">
    <li>从5开始计数</li>
    <li>第6项</li>
    <li>第7项</li>
</ol>

<!-- 倒序排列 -->
<ol reversed>
    <li>第3项</li>
    <li>第2项</li>
    <li>第1项</li>
</ol>

<!-- 指定编号类型 -->
<ol type="A">
    <li>大写字母 A</li>
    <li>大写字母 B</li>
</ol>
<ol type="a">
    <li>小写字母 a</li>
    <li>小写字母 b</li>
</ol>
<ol type="I">
    <li>大写罗马数字 I</li>
    <li>大写罗马数字 II</li>
</ol>
<ol type="i">
    <li>小写罗马数字 i</li>
    <li>小写罗马数字 ii</li>
</ol>
```

### 5.3 定义列表 dl

```html
<!-- 基本用法 -->
<dl>
    <dt>HTML</dt>
    <dd>超文本标记语言，用于创建网页</dd>

    <dt>CSS</dt>
    <dd>层叠样式表，用于控制网页外观</dd>

    <dt>JavaScript</dt>
    <dd>一种脚本语言，用于实现网页交互</dd>
</dl>

<!-- 多个术语同一个定义 -->
<dl>
    <dt>前端</dt>
    <dt>Frontend</dt>
    <dd>Web 开发中负责用户界面的部分</dd>
</dl>

<!-- 样式示例 -->
<style>
    dl { margin: 20px 0; }
    dt {
        font-weight: bold;
        color: #333;
        margin-top: 10px;
    }
    dd {
        margin-left: 20px;
        color: #666;
        margin-bottom: 10px;
    }
</style>
```

### 5.4 列表综合示例

```html
<!-- 导航菜单 -->
<nav class="menu">
    <ul>
        <li><a href="/">首页</a></li>
        <li>
            <a href="/products">产品</a>
            <ul class="submenu">
                <li><a href="/products/phone">手机</a></li>
                <li><a href="/products/tablet">平板</a></li>
                <li><a href="/products/laptop">笔记本</a></li>
            </ul>
        </li>
        <li><a href="/about">关于</a></li>
        <li><a href="/contact">联系</a></li>
    </ul>
</nav>

<style>
    .menu ul {
        list-style: none;
        padding: 0;
        display: flex;
        gap: 20px;
    }
    .menu > ul > li {
        position: relative;
    }
    .submenu {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        background: white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .menu li:hover .submenu {
        display: block;
    }
</style>
```

---

## 6. 表格

### 6.1 基本表格结构

```html
<!-- 基本表格 -->
<table>
    <tr>
        <td>单元格1</td>
        <td>单元格2</td>
        <td>单元格3</td>
    </tr>
    <tr>
        <td>单元格4</td>
        <td>单元格5</td>
        <td>单元格6</td>
    </tr>
</table>
```

### 6.2 完整的表格结构

```html
<!-- 语义化表格 -->
<table>
    <thead>
        <tr>
            <th>姓名</th>
            <th>年龄</th>
            <th>城市</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>张三</td>
            <td>25</td>
            <td>北京</td>
        </tr>
        <tr>
            <td>李四</td>
            <td>30</td>
            <td>上海</td>
        </tr>
        <tr>
            <td>王五</td>
            <td>28</td>
            <td>广州</td>
        </tr>
    </tbody>
    <tfoot>
        <tr>
            <td colspan="3">共 3 人</td>
        </tr>
    </tfoot>
</table>

<style>
    table {
        width: 100%;
        border-collapse: collapse;
    }
    th, td {
        border: 1px solid #ddd;
        padding: 12px;
        text-align: left;
    }
    th {
        background-color: #4CAF50;
        color: white;
    }
    tr:nth-child(even) {
        background-color: #f2f2f2;
    }
</style>
```

### 6.3 单元格合并

```html
<!-- 横向合并 colspan -->
<table>
    <tr>
        <td colspan="2">跨两列</td>
        <td>普通单元格</td>
    </tr>
    <tr>
        <td>普通单元格</td>
        <td>普通单元格</td>
        <td>普通单元格</td>
    </tr>
</table>

<!-- 纵向合并 rowspan -->
<table>
    <tr>
        <td rowspan="2">跨两行</td>
        <td>普通单元格</td>
    </tr>
    <tr>
        <td>普通单元格</td>
    </tr>
</table>

<!-- 综合示例：课程表 -->
<table class="schedule">
    <thead>
        <tr>
            <th>时间</th>
            <th>周一</th>
            <th>周二</th>
            <th>周三</th>
            <th>周四</th>
            <th>周五</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>第1节</td>
            <td>语文</td>
            <td>数学</td>
            <td>英语</td>
            <td>物理</td>
            <td>化学</td>
        </tr>
        <tr>
            <td>第2节</td>
            <td>数学</td>
            <td>语文</td>
            <td>物理</td>
            <td>英语</td>
            <td>数学</td>
        </tr>
        <tr>
            <td>午休</td>
            <td colspan="5" style="text-align: center;">午休时间</td>
        </tr>
        <tr>
            <td>第3节</td>
            <td>英语</td>
            <td>物理</td>
            <td>化学</td>
            <td>语文</td>
            <td>体育</td>
        </tr>
    </tbody>
</table>

<style>
    .schedule th, .schedule td {
        border: 1px solid #333;
        padding: 10px;
        text-align: center;
    }
    .schedule th {
        background-color: #333;
        color: white;
    }
    .schedule tbody tr:nth-child(odd) {
        background-color: #f9f9f9;
    }
</style>
```

### 6.4 表格列分组

```html
<!-- colgroup 和 col -->
<table>
    <colgroup>
        <col style="background-color: #f0f0f0;">
        <col>
        <col>
        <col style="background-color: #e0e0e0;">
    </colgroup>
    <thead>
        <tr>
            <th>列1</th>
            <th>列2</th>
            <th>列3</th>
            <th>列4</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>数据1</td>
            <td>数据2</td>
            <td>数据3</td>
            <td>数据4</td>
        </tr>
    </tbody>
</table>
```

---

## 7. 表单

### 7.1 form 标签

```html
<!-- 基本结构 -->
<form action="/submit" method="POST">
    <!-- 表单控件 -->
    <label for="username">用户名：</label>
    <input type="text" id="username" name="username">

    <button type="submit">提交</button>
</form>

<!-- form 属性详解 -->
<form
    action="/submit-url"      <!-- 提交地址 -->
    method="POST"             <!-- 提交方法：GET/POST -->
    enctype="multipart/form-data"  <!-- 编码类型 -->
    target="_blank"          <!-- 提交后响应显示位置 -->
    autocomplete="on"         <!-- 自动完成 -->
    novalidate               <!-- 禁用验证 -->
>
```

### 7.2 input 标签

```html
<!-- 文本输入 -->
<label for="name">姓名：</label>
<input type="text" id="name" name="name" placeholder="请输入姓名">

<!-- 密码输入 -->
<label for="password">密码：</label>
<input type="password" id="password" name="password">

<!-- 邮箱输入 -->
<label for="email">邮箱：</label>
<input type="email" id="email" name="email">

<!-- 数字输入 -->
<label for="age">年龄：</label>
<input type="number" id="age" name="age" min="18" max="100">

<!-- 电话输入 -->
<label for="phone">电话：</label>
<input type="tel" id="phone" name="phone" pattern="[0-9]{11}">

<!-- URL 输入 -->
<label for="website">网址：</label>
<input type="url" id="website" name="website">

<!-- 搜索框 -->
<label for="search">搜索：</label>
<input type="search" id="search" name="search">

<!-- 范围选择 -->
<label for="range">音量：</label>
<input type="range" id="range" name="range" min="0" max="100" value="50">

<!-- 颜色选择 -->
<label for="color">颜色：</label>
<input type="color" id="color" name="color" value="#ff0000">

<!-- 日期时间 -->
<input type="date" name="date">      <!-- 日期 -->
<input type="time" name="time">      <!-- 时间 -->
<input type="datetime-local">        <!-- 本地日期时间 -->
<input type="week">                  <!-- 周 -->
<input type="month">                 <!-- 月 -->

<!-- 文件上传 -->
<label for="file">上传文件：</label>
<input type="file" id="file" name="file" accept=".jpg,.png" multiple>

<!-- 复选框 -->
<input type="checkbox" id="agree" name="agree" value="yes">
<label for="agree">我同意条款</label>

<!-- 单选按钮 -->
<input type="radio" id="male" name="gender" value="male">
<label for="male">男</label>
<input type="radio" id="female" name="gender" value="female">
<label for="female">女</label>

<!-- 隐藏字段 -->
<input type="hidden" name="token" value="abc123">

<!-- 按钮 -->
<input type="submit" value="提交">
<input type="reset" value="重置">
<input type="button" value="普通按钮">
<input type="image" src="submit-btn.png" alt="提交">
```

### 7.3 input 标签的公共属性

```html
<input
    type="text"
    id="username"
    name="username"
    value="默认值"
    placeholder="提示文字"
    required              <!-- 必填 -->
    disabled             <!-- 禁用 -->
    readonly             <!-- 只读 -->
    maxlength="10"       <!-- 最大长度 -->
    minlength="3"        <!-- 最小长度 -->
    pattern="\d{3,6}"    <!-- 正则验证 -->
    autocomplete="off"   <!-- 自动完成 -->
    autofocus            <!-- 自动聚焦 -->
>
```

### 7.4 textarea 标签

```html
<!-- 多行文本输入 -->
<label for="message">留言：</label>
<textarea
    id="message"
    name="message"
    rows="5"
    cols="30"
    placeholder="请输入留言内容..."
    maxlength="200"
></textarea>

<!-- 禁止调整大小 -->
<textarea style="resize: none;"></textarea>

<!-- 允许水平和垂直调整 -->
<textarea style="resize: both;"></textarea>

<!-- 只允许垂直调整 -->
<textarea style="resize: vertical;"></textarea>
```

### 7.5 select 标签

```html
<!-- 下拉选择框 -->
<label for="country">国家：</label>
<select id="country" name="country">
    <option value="">请选择</option>
    <option value="cn">中国</option>
    <option value="us">美国</option>
    <option value="uk">英国</option>
    <option value="jp">日本</option>
</select>

<!-- 默认选中 -->
<select name="city">
    <option value="bj">北京</option>
    <option value="sh" selected>上海</option>
    <option value="gz">广州</option>
</select>

<!-- 分组选项 -->
<select name="province">
    <optgroup label="华北">
        <option value="bj">北京</option>
        <option value="tj">天津</option>
        <option value="hb">河北</option>
    </optgroup>
    <optgroup label="华东">
        <option value="sh">上海</option>
        <option value="js">江苏</option>
        <option value="zj">浙江</option>
    </optgroup>
</select>

<!-- 多选 -->
<label for="hobbies">爱好：</label>
<select id="hobbies" name="hobbies" multiple size="4">
    <option value="reading">阅读</option>
    <option value="music">音乐</option>
    <option value="sports">运动</option>
    <option value="travel">旅行</option>
</select>
```

### 7.6 button 标签

```html
<!-- 提交按钮（默认行为） -->
<button type="submit">提交表单</button>

<!-- 重置按钮 -->
<button type="reset">重置表单</button>

<!-- 普通按钮 -->
<button type="button" onclick="alert('点击了！')">点击我</button>

<!-- 带图标的按钮 -->
<button type="submit">
    <img src="icon.png" alt="提交" width="16" height="16">
    提交
</button>

<!-- button 与 input 的区别 -->
<!-- input 是空元素，button 是可包含内容的容器 -->
<button type="button">
    <strong>加粗文本</strong>
    <br>
    <em>斜体文本</em>
    <img src="icon.png" alt="图标">
</button>
```

### 7.7 表单验证

```html
<!-- HTML5 内置验证属性 -->
<form>
    <!-- 必填 -->
    <input type="text" required>

    <!-- 最小/最大长度 -->
    <input type="text" minlength="3" maxlength="10">

    <!-- 最小/最大值 -->
    <input type="number" min="0" max="100">

    <!-- 正则表达式 -->
    <input type="text" pattern="[A-Za-z]{3,}">

    <!-- 自定义验证消息 -->
    <input type="email" id="email" required
           title="请输入有效的邮箱地址">

    <button type="submit">提交</button>
</form>

<!-- 验证相关的伪类 -->
<style>
    /* 验证通过的输入框 */
    input:valid {
        border-color: green;
    }

    /* 验证失败的输入框 */
    input:invalid {
        border-color: red;
    }
</style>

<!-- checkValidity() 方法 -->
<script>
    const form = document.querySelector('form');
    const input = document.querySelector('input');

    // 检查单个输入框
    if (input.checkValidity()) {
        console.log('输入有效');
    } else {
        console.log(input.validationMessage);
    }

    // 检查整个表单
    form.addEventListener('submit', function(e) {
        if (!form.checkValidity()) {
            e.preventDefault();
            alert('表单填写有误，请检查');
        }
    });
</script>
```

### 7.8 表单综合示例

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>用户注册表单</title>
    <style>
        form {
            max-width: 500px;
            margin: 20px auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        input[type="text"],
        input[type="email"],
        input[type="password"],
        input[type="tel"],
        select,
        textarea {
            width: 100%;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
            box-sizing: border-box;
        }
        .checkbox-group label {
            display: inline;
            font-weight: normal;
        }
        button {
            padding: 10px 20px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        button:hover {
            background-color: #45a049;
        }
    </style>
</head>
<body>
    <form action="/register" method="POST">
        <h2>用户注册</h2>

        <!-- 用户名 -->
        <div class="form-group">
            <label for="username">用户名 <span style="color: red;">*</span></label>
            <input type="text" id="username" name="username"
                   required minlength="3" maxlength="20"
                   placeholder="3-20个字符">
        </div>

        <!-- 邮箱 -->
        <div class="form-group">
            <label for="email">邮箱 <span style="color: red;">*</span></label>
            <input type="email" id="email" name="email" required
                   placeholder="example@email.com">
        </div>

        <!-- 密码 -->
        <div class="form-group">
            <label for="password">密码 <span style="color: red;">*</span></label>
            <input type="password" id="password" name="password"
                   required minlength="6"
                   placeholder="至少6个字符">
        </div>

        <!-- 确认密码 -->
        <div class="form-group">
            <label for="confirm-password">确认密码 <span style="color: red;">*</span></label>
            <input type="password" id="confirm-password"
                   name="confirm-password" required>
        </div>

        <!-- 性别 -->
        <div class="form-group">
            <label>性别</label>
            <input type="radio" id="male" name="gender" value="male">
            <label for="male" style="display: inline;">男</label>
            <input type="radio" id="female" name="gender" value="female">
            <label for="female" style="display: inline;">女</label>
        </div>

        <!-- 生日 -->
        <div class="form-group">
            <label for="birthday">生日</label>
            <input type="date" id="birthday" name="birthday">
        </div>

        <!-- 国家 -->
        <div class="form-group">
            <label for="country">国家</label>
            <select id="country" name="country">
                <option value="">请选择</option>
                <option value="cn">中国</option>
                <option value="us">美国</option>
                <option value="uk">英国</option>
                <option value="jp">日本</option>
            </select>
        </div>

        <!-- 兴趣爱好 -->
        <div class="form-group">
            <label>兴趣爱好</label>
            <div class="checkbox-group">
                <input type="checkbox" id="reading" name="hobbies" value="reading">
                <label for="reading">阅读</label>
                <input type="checkbox" id="music" name="hobbies" value="music">
                <label for="music">音乐</label>
                <input type="checkbox" id="sports" name="hobbies" value="sports">
                <label for="sports">运动</label>
                <input type="checkbox" id="travel" name="hobbies" value="travel">
                <label for="travel">旅行</label>
            </div>
        </div>

        <!-- 个人简介 -->
        <div class="form-group">
            <label for="bio">个人简介</label>
            <textarea id="bio" name="bio" rows="4"
                      placeholder="介绍一下自己..."></textarea>
        </div>

        <!-- 服务条款 -->
        <div class="form-group">
            <input type="checkbox" id="terms" name="terms" required>
            <label for="terms">我已阅读并同意 <a href="#">服务条款</a></label>
        </div>

        <!-- 按钮 -->
        <button type="submit">注册</button>
        <button type="reset">重置</button>
    </form>
</body>
</html>
```

---

## 8. 多媒体

### 8.1 img 标签

```html
<!-- 基本用法 -->
<img src="image.jpg" alt="图片描述">

<!-- 完整属性 -->
<img
    src="photo.jpg"
    alt="风景图片"
    width="800"           <!-- 宽度 -->
    height="600"           <!-- 高度 -->
    loading="lazy"         <!-- 懒加载 -->
    decoding="async"       <!-- 异步解码 -->
    crossorigin="anonymous" <!-- 跨域设置 -->
>

<!-- 带标题 -->
<figure>
    <img src="chart.png" alt="销售图表">
    <figcaption>图1：2024年销售额趋势</figcaption>
</figure>

<!-- 响应式图片 -->
<img
    src="image-800.jpg"
    srcset="image-400.jpg 400w,
            image-800.jpg 800w,
            image-1200.jpg 1200w"
    sizes="(max-width: 600px) 100vw,
           (max-width: 1200px) 50vw,
           33vw"
    alt="响应式图片"
>

<!-- picture 元素：艺术方向 -->
<picture>
    <source media="(max-width: 600px)" srcset="mobile.jpg">
    <source media="(max-width: 1200px)" srcset="tablet.jpg">
    <img src="desktop.jpg" alt="适应性图片">
</picture>
```

### 8.2 video 标签

```html
<!-- 基本用法 -->
<video src="video.mp4" controls></video>

<!-- 完整属性 -->
<video
    src="video.mp4"
    controls              <!-- 显示控制条 -->
    autoplay              <!-- 自动播放 -->
    muted                 <!-- 静音（自动播放需要） -->
    loop                  <!-- 循环播放 -->
    poster="poster.jpg"   <!-- 封面图片 -->
    preload="auto"        <!-- 预加载：auto/metadata/none -->
    width="640"
    height="480"
>
    <!-- 备用来源 -->
    <source src="video.webm" type="video/webm">
    <source src="video.mp4" type="video/mp4">

    <!-- 兼容提示 -->
    您的浏览器不支持 video 标签。
</video>

<!-- 带字幕 -->
<video controls>
    <source src="video.mp4" type="video/mp4">
    <track
        kind="subtitles"
        src="subtitles.vtt"
        srclang="zh"
        label="中文"
        default
    >
</video>
```

### 8.3 audio 标签

```html
<!-- 基本用法 -->
<audio src="music.mp3" controls></audio>

<!-- 完整属性 -->
<audio
    src="music.mp3"
    controls              <!-- 显示控制条 -->
    autoplay              <!-- 自动播放 -->
    muted                 <!-- 静音 -->
    loop                  <!-- 循环播放 -->
    preload="auto"        <!-- 预加载 -->
>
    <!-- 备用来源 -->
    <source src="music.ogg" type="audio/ogg">
    <source src="music.mp3" type="audio/mpeg">

    <!-- 兼容提示 -->
    您的浏览器不支持 audio 标签。
</audio>
```

### 8.4 多媒体综合示例

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>多媒体示例</title>
    <style>
        .media-container {
            max-width: 800px;
            margin: 20px auto;
        }
        video, audio {
            width: 100%;
            margin: 10px 0;
        }
        .video-wrapper {
            position: relative;
            padding-bottom: 56.25%; /* 16:9 比例 */
            height: 0;
        }
        .video-wrapper video {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }
    </style>
</head>
<body>
    <div class="media-container">
        <h2>视频示例</h2>

        <!-- 视频 -->
        <div class="video-wrapper">
            <video controls poster="poster.jpg" preload="metadata">
                <source src="video.mp4" type="video/mp4">
                <source src="video.webm" type="video/webm">
                您的浏览器不支持视频播放。
            </video>
        </div>

        <h2>音频示例</h2>

        <!-- 音频 -->
        <audio controls preload="metadata">
            <source src="music.mp3" type="audio/mpeg">
            <source src="music.ogg" type="audio/ogg">
            您的浏览器不支持音频播放。
        </audio>

        <h2>图片示例</h2>

        <!-- 图片与图注 -->
        <figure>
            <img src="photo.jpg" alt="美丽风景" style="max-width: 100%;">
            <figcaption>图1：日出时分</figcaption>
        </figure>
    </div>
</body>
</html>
```

---

## 9. 全局属性

全局属性是所有 HTML 元素都可以使用的属性。

### 9.1 id 属性

```html
<!-- 唯一标识符 -->
<header id="main-header">
    <h1>网站标题</h1>
</header>

<!-- 锚点链接 -->
<h2 id="section1">第一章</h2>
<a href="#section1">跳转到第一章</a>

<!-- JavaScript 中使用 -->
<script>
    const element = document.getElementById('main-header');
    element.style.backgroundColor = 'red';
</script>

<!-- CSS 中使用 -->
<style>
    #main-header {
        background-color: #333;
        color: white;
    }
</style>
```

### 9.2 class 属性

```html
<!-- 单一类名 -->
<div class="container"></div>

<!-- 多个类名 -->
<div class="container fluid highlight"></div>

<!-- JavaScript 中使用 -->
<script>
    const elements = document.getElementsByClassName('container');

    // 或使用 querySelector
    const element = document.querySelector('.container');
</script>

<!-- CSS 中使用 -->
<style>
    .container {
        max-width: 1200px;
        margin: 0 auto;
    }
    .highlight {
        background-color: yellow;
    }
</style>
```

### 9.3 style 属性

```html
<!-- 行内样式 -->
<p style="color: red; font-size: 16px;">红色文字</p>

<!-- 不推荐大量使用，建议用 CSS 类 -->
<div style="display: flex; justify-content: center; align-items: center;">
    内容
</div>
```

### 9.4 data-* 自定义数据属性

```html
<!-- 存储自定义数据 -->
<button class="delete-btn" data-id="123" data-type="user">删除</button>

<ul>
    <li data-price="99.99" data-currency="CNY">商品A</li>
    <li data-price="199.99" data-currency="CNY">商品B</li>
</ul>

<!-- JavaScript 访问 -->
<script>
    const btn = document.querySelector('.delete-btn');
    console.log(btn.dataset.id);      // "123"
    console.log(btn.dataset.type);    // "user"

    // 修改数据
    btn.dataset.id = '456';

    // 添加新数据
    btn.dataset.newData = 'value';
</script>

<!-- 应用场景：组件化开发 -->
<div class="product" data-product-id="1001" data-price="299" data-name="iPhone">
    <h3>商品名称</h3>
    <button onclick="addToCart(this)">加入购物车</button>
</div>

<script>
    function addToCart(button) {
        const product = button.closest('.product');
        const productData = {
            id: product.dataset.productId,
            price: product.dataset.price,
            name: product.dataset.name
        };
        console.log('添加到购物车:', productData);
    }
</script>
```

### 9.5 其他全局属性

```html
<!-- title: 鼠标悬停显示提示 -->
<a href="#" title="查看更多详情">了解更多</a>

<!-- tabindex: 键盘导航顺序 -->
<a href="#" tabindex="2">第二个</a>
<a href="#" tabindex="1">第一个</a>
<a href="#" tabindex="3">第三个</a>

<!-- hidden: 隐藏元素 -->
<p hidden>这段文字被隐藏了</p>

<!-- lang: 语言 -->
<p lang="en">This is English.</p>
<p lang="zh-CN">这是中文。</p>

<!-- dir: 文本方向 -->
<p dir="ltr">从左到右</p>
<p dir="rtl">从右到左（阿拉伯语）</p>

<!-- contenteditable: 可编辑 -->
<p contenteditable="true">这段文字可以编辑</p>

<!-- draggable: 可拖拽 -->
<img src="image.jpg" draggable="true">

<!-- spellcheck: 拼写检查 -->
<textarea spellcheck="true"></textarea>
```

---

## 10. 常用 meta 标签

### 10.1 字符编码

```html
<!-- UTF-8（推荐） -->
<meta charset="UTF-8">

<!-- 旧写法 -->
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
```

### 10.2 viewport 响应式

```html
<!-- 基础设置 -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<!-- 完整配置 -->
<meta name="viewport" content="
    width=device-width,     <!-- 视口宽度 = 设备宽度 -->
    initial-scale=1.0,       <!-- 初始缩放比例 -->
    maximum-scale=1.0,      <!-- 最大缩放比例 -->
    minimum-scale=0.5,      <!-- 最小缩放比例 -->
    user-scalable=no        <!-- 禁止用户缩放 -->
">
```

### 10.3 SEO 相关

```html
<!-- 页面描述 -->
<meta name="description" content="这是一个关于Web开发的教程网站...">

<!-- 关键词 -->
<meta name="keywords" content="HTML, CSS, JavaScript, Web开发, 教程">

<!-- 作者 -->
<meta name="author" content="张三">

<!-- 版权 -->
<meta name="copyright" content="Copyright © 2024">

<!-- 搜索引擎控制 -->
<meta name="robots" content="index,follow">        <!-- 允许索引和跟踪链接 -->
<meta name="robots" content="noindex,nofollow">   <!-- 禁止索引和跟踪 -->

<!-- 刷新和重定向 -->
<meta http-equiv="refresh" content="30">         <!-- 30秒刷新一次 -->
<meta http-equiv="refresh" content="5;url=page2.html">  <!-- 5秒后跳转 -->
```

### 10.4 社交媒体

```html
<!-- Open Graph (Facebook) -->
<meta property="og:title" content="页面标题">
<meta property="og:description" content="页面描述">
<meta property="og:image" content="https://example.com/image.jpg">
<meta property="og:url" content="https://example.com/page">
<meta property="og:type" content="website">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="页面标题">
<meta name="twitter:description" content="页面描述">
<meta name="twitter:image" content="https://example.com/image.jpg">
```

### 10.5 其他常用

```html
<!-- 缓存控制 -->
<meta http-equiv="Cache-Control" content="no-cache">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">

<!-- 兼容模式 -->
<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">

<!-- 主题色（移动端地址栏） -->
<meta name="theme-color" content="#ffffff">

<!-- 视口 fit-content（iOS） -->
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

---

## 11. 语义化最佳实践

### 11.1 DOCTYPE 和语言

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>语义化网页</title>
</head>
```

### 11.2 标题层级

```html
<!-- 正确：按层级使用标题 -->
<article>
    <h1>文章标题</h1>
    <section>
        <h2>第一章</h2>
        <section>
            <h3>第一节</h3>
        </section>
    </section>
</article>
```

### 11.3 链接使用

```html
<!-- 正确：链接到有意义的内容 -->
<a href="/about">关于我们</a>
<a href="download.pdf">下载 PDF</a>
<a href="javascript:void(0)">无效链接</a>  <!-- 避免使用 -->

<!-- 按钮 vs 链接 -->
<!-- 导航 → 链接 -->
<a href="/page">查看更多</a>

<!-- 执行操作 → 按钮 -->
<button onclick="submit()">提交</button>
```

### 11.4 列表使用

```html
<!-- 导航菜单 -->
<nav>
    <ul>
        <li><a href="/">首页</a></li>
        <li><a href="/about">关于</a></li>
    </ul>
</nav>

<!-- 相关链接列表 -->
<aside>
    <h3>相关文章</h3>
    <ul>
        <li><a href="#">链接1</a></li>
        <li><a href="#">链接2</a></li>
    </ul>
</aside>
```

### 11.5 表单标签

```html
<!-- 正确：使用 label 关联输入框 -->
<label for="username">用户名：</label>
<input type="text" id="username">

<!-- 嵌套写法 -->
<label>
    用户名：
    <input type="text">
</label>
```

### 11.6 语义化页面模板

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="网页描述">
    <title>网页标题</title>
</head>
<body>
    <!-- 跳过链接（无障碍） -->
    <a href="#main-content" class="skip-link">跳到主要内容</a>

    <!-- 页头 -->
    <header role="banner">
        <h1>网站Logo</h1>
        <nav role="navigation" aria-label="主导航">
            <ul>
                <li><a href="/">首页</a></li>
                <li><a href="/about">关于</a></li>
            </ul>
        </nav>
    </header>

    <!-- 主内容 -->
    <main id="main-content" role="main">
        <article>
            <header>
                <h1>文章标题</h1>
                <p><time datetime="2024-01-01">2024年1月1日</time></p>
            </header>
            <section>
                <h2>章节标题</h2>
                <p>内容...</p>
            </section>
            <footer>
                <p>作者信息</p>
            </footer>
        </article>

        <!-- 侧边栏 -->
        <aside role="complementary">
            <h2>相关内容</h2>
        </aside>
    </main>

    <!-- 页脚 -->
    <footer role="contentinfo">
        <p>&copy; 2024 网站名称</p>
    </footer>
</body>
</html>

<style>
    .skip-link {
        position: absolute;
        top: -40px;
        left: 0;
        background: #000;
        color: #fff;
        padding: 8px;
        z-index: 100;
    }
    .skip-link:focus {
        top: 0;
    }
</style>
```

---

## 练习题

### 练习 1：创建个人介绍页面

使用语义化标签创建一个个人介绍页面，包含：
- 页头（姓名、导航）
- 主要内容（个人简介、教育背景、技能）
- 侧边栏（联系方式）
- 页脚

### 练习 2：创建商品表格

创建一个商品信息表格，包含：
- 表头（商品名称、价格、库存、操作）
- 至少5个商品
- 合并单元格显示统计信息

### 练习 3：创建注册表单

创建一个用户注册表单，包含：
- 用户名、邮箱、密码（带确认）
- 性别、生日、兴趣选择
- 表单验证（必填、格式）
- 提交和重置按钮

### 练习 4：响应式图片展示

创建带有响应式图片的页面：
- 使用 srcset 实现不同屏幕宽度加载不同图片
- 使用 picture 元素实现艺术方向切换

---

## 总结

本章学习了 HTML 的基础知识和核心概念：

1. **文档结构**：DOCTYPE、html、head、body 的正确使用
2. **语义化标签**：header、nav、main、article、section、aside、footer
3. **文本标签**：标题、段落、链接、强调等
4. **列表**：ul、ol、dl 的使用场景
5. **表格**：table 及相关标签的语义化结构
6. **表单**：form、input、select、button 及验证
7. **多媒体**：img、video、audio 的使用
8. **全局属性**：id、class、style、data-* 等
9. **meta 标签**：SEO、viewport、社交媒体等

掌握这些基础内容后，你就可以开始编写结构清晰、语义明确的 HTML 页面了！
