# CSS3核心知识

## 一、概述

CSS3是CSS的第三个重大版本，于2011年开始逐步发布，2026年已成为Web样式设计的**标准规范**。它引入了强大的布局能力、动画效果和响应式设计功能，使前端开发更加高效和灵活。

**核心特性**：
- **布局革命**：Flexbox和Grid彻底改变了页面布局方式
- **动画能力**：原生支持复杂的动画效果
- **响应式设计**：媒体查询和容器查询实现自适应布局
- **模块化**：各功能模块独立发展，浏览器逐步支持

---

## 二、核心概念

### 2.1 Flexbox弹性布局

Flexbox是一种一维布局模型，用于在容器内灵活排列项目。

**核心概念**：
- **主轴（Main Axis）**：项目排列的主要方向
- **交叉轴（Cross Axis）**：与主轴垂直的轴
- **Flex容器**：设置`display: flex`的元素
- **Flex项目**：容器内的直接子元素

**常用属性**：
| 属性 | 说明 | 示例 |
|------|------|------|
| `display` | 定义Flex容器 | `display: flex` |
| `flex-direction` | 主轴方向 | `flex-direction: row` |
| `justify-content` | 主轴对齐 | `justify-content: center` |
| `align-items` | 交叉轴对齐 | `align-items: center` |
| `flex-wrap` | 是否换行 | `flex-wrap: wrap` |
| `gap` | 项目间距 | `gap: 20px` |

### 2.2 CSS Grid网格布局

CSS Grid是一种二维布局系统，可以同时处理行和列。

**核心概念**：
- **网格容器**：设置`display: grid`的元素
- **网格轨道**：行和列
- **网格单元格**：网格的最小单位
- **网格区域**：由多个单元格组成的区域

**常用属性**：
| 属性 | 说明 | 示例 |
|------|------|------|
| `display` | 定义Grid容器 | `display: grid` |
| `grid-template-columns` | 定义列 | `grid-template-columns: 1fr 2fr` |
| `grid-template-rows` | 定义行 | `grid-template-rows: 100px auto` |
| `grid-gap` | 网格间距 | `grid-gap: 10px` |
| `grid-area` | 定义区域 | `grid-area: header` |

### 2.3 响应式设计

响应式设计使网站能够适应不同屏幕尺寸的设备。

**核心概念**：
- **媒体查询**：根据设备特性应用不同样式
- **流式布局**：使用百分比和相对单位
- **弹性图片**：图片自适应容器大小
- **断点**：布局变化的屏幕宽度

**常用媒体查询**：
```css
/* 超小屏幕（手机） */
@media (max-width: 575px) { ... }

/* 小屏幕（手机横屏） */
@media (min-width: 576px) and (max-width: 767px) { ... }

/* 中等屏幕（平板） */
@media (min-width: 768px) and (max-width: 991px) { ... }

/* 大屏幕（桌面） */
@media (min-width: 992px) and (max-width: 1199px) { ... }

/* 超大屏幕（大桌面） */
@media (min-width: 1200px) { ... }
```

### 2.4 CSS动画

CSS动画提供了一种声明式的动画实现方式。

**核心概念**：
- **过渡（Transition）**：属性值变化时的平滑过渡
- **动画（Animation）**：基于关键帧的动画序列
- **关键帧（Keyframes）**：定义动画的各个阶段

**常用属性**：
| 属性 | 说明 | 示例 |
|------|------|------|
| `transition` | 简写属性 | `transition: all 0.3s ease` |
| `animation` | 简写属性 | `animation: fadeIn 1s ease` |
| `@keyframes` | 定义关键帧 | `@keyframes fadeIn { ... }` |
| `transform` | 变换 | `transform: translateX(100px)` |

---

## 三、代码示例

### 3.1 Flexbox布局示例

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flexbox布局示例</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 40px;
      background: #f5f5f5;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    h2 {
      margin-bottom: 30px;
      color: #2c3e50;
      text-align: center;
    }
    
    /* 示例1：水平居中 */
    .example1 {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 200px;
      background: white;
      border-radius: 12px;
      margin-bottom: 20px;
      padding: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .box {
      width: 100px;
      height: 100px;
      display: flex;
      justify-content: center;
      align-items: center;
      color: white;
      border-radius: 8px;
    }
    
    .box1 { background: #3498db; }
    .box2 { background: #e74c3c; }
    .box3 { background: #2ecc71; }
    
    /* 示例2：导航栏 */
    .navbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #2c3e50;
      padding: 16px 40px;
      border-radius: 12px;
      margin-bottom: 20px;
    }
    
    .logo {
      color: white;
      font-size: 24px;
      font-weight: bold;
    }
    
    .nav-links {
      display: flex;
      gap: 30px;
      list-style: none;
    }
    
    .nav-links a {
      color: white;
      text-decoration: none;
      transition: color 0.3s ease;
    }
    
    .nav-links a:hover {
      color: #3498db;
    }
    
    /* 示例3：卡片网格 */
    .card-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      justify-content: center;
    }
    
    .card {
      flex: 1 1 300px;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .card:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 24px rgba(0,0,0,0.15);
    }
    
    .card-image {
      width: 100%;
      height: 200px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      color: white;
      font-size: 48px;
    }
    
    .card-content {
      padding: 24px;
    }
    
    .card-content h3 {
      margin-bottom: 12px;
      color: #2c3e50;
    }
    
    .card-content p {
      color: #666;
      line-height: 1.6;
    }
    
    /* 示例4：表单布局 */
    .form-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
      max-width: 600px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .form-row {
      display: flex;
      gap: 20px;
    }
    
    .form-group {
      flex: 1;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #333;
    }
    
    .form-group input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 16px;
    }
    
    .form-group input:focus {
      outline: none;
      border-color: #3498db;
    }
    
    button {
      padding: 14px 28px;
      background: #3498db;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.3s ease;
    }
    
    button:hover {
      background: #2980b9;
    }
    
    /* 示例5：页脚布局 */
    .footer {
      display: flex;
      flex-wrap: wrap;
      gap: 40px;
      background: #2c3e50;
      color: white;
      padding: 40px 20px;
      margin-top: 40px;
    }
    
    .footer-section {
      flex: 1 1 200px;
    }
    
    .footer-section h3 {
      margin-bottom: 20px;
      color: #3498db;
    }
    
    .footer-section ul {
      list-style: none;
    }
    
    .footer-section ul li {
      margin-bottom: 12px;
    }
    
    .footer-section ul li a {
      color: #bdc3c7;
      text-decoration: none;
      transition: color 0.3s ease;
    }
    
    .footer-section ul li a:hover {
      color: white;
    }
    
    .footer-bottom {
      width: 100%;
      text-align: center;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #34495e;
      color: #95a5a6;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Flexbox布局示例</h2>
    
    <!-- 示例1：水平居中 -->
    <div class="example1">
      <div class="box box1">1</div>
      <div class="box box2">2</div>
      <div class="box box3">3</div>
    </div>
    
    <!-- 示例2：导航栏 -->
    <nav class="navbar">
      <div class="logo">LOGO</div>
      <ul class="nav-links">
        <li><a href="#">首页</a></li>
        <li><a href="#">产品</a></li>
        <li><a href="#">服务</a></li>
        <li><a href="#">关于</a></li>
        <li><a href="#">联系</a></li>
      </ul>
    </nav>
    
    <!-- 示例3：卡片网格 -->
    <div class="card-grid">
      <div class="card">
        <div class="card-image">🎨</div>
        <div class="card-content">
          <h3>设计</h3>
          <p>创建美观的界面设计，提升用户体验。</p>
        </div>
      </div>
      <div class="card">
        <div class="card-image">💻</div>
        <div class="card-content">
          <h3>开发</h3>
          <p>编写高质量的代码，实现功能需求。</p>
        </div>
      </div>
      <div class="card">
        <div class="card-image">🚀</div>
        <div class="card-content">
          <h3>部署</h3>
          <p>将应用部署到服务器，提供稳定服务。</p>
        </div>
      </div>
    </div>
    
    <!-- 示例4：表单布局 -->
    <form class="form-container">
      <div class="form-row">
        <div class="form-group">
          <label for="firstName">名字</label>
          <input type="text" id="firstName" placeholder="请输入名字">
        </div>
        <div class="form-group">
          <label for="lastName">姓氏</label>
          <input type="text" id="lastName" placeholder="请输入姓氏">
        </div>
      </div>
      <div class="form-group">
        <label for="email">邮箱</label>
        <input type="email" id="email" placeholder="请输入邮箱">
      </div>
      <div class="form-group">
        <label for="message">留言</label>
        <input type="text" id="message" placeholder="请输入留言">
      </div>
      <button type="submit">提交</button>
    </form>
    
    <!-- 示例5：页脚布局 -->
    <footer class="footer">
      <div class="footer-section">
        <h3>关于我们</h3>
        <p>我们是一家专业的Web开发公司，致力于为客户提供高质量的网站和应用开发服务。</p>
      </div>
      <div class="footer-section">
        <h3>快速链接</h3>
        <ul>
          <li><a href="#">首页</a></li>
          <li><a href="#">产品</a></li>
          <li><a href="#">服务</a></li>
          <li><a href="#">关于</a></li>
        </ul>
      </div>
      <div class="footer-section">
        <h3>联系方式</h3>
        <ul>
          <li>电话：123-456-7890</li>
          <li>邮箱：info@example.com</li>
          <li>地址：北京市朝阳区</li>
        </ul>
      </div>
      <div class="footer-section">
        <h3>关注我们</h3>
        <ul>
          <li><a href="#">微信</a></li>
          <li><a href="#">微博</a></li>
          <li><a href="#">GitHub</a></li>
          <li><a href="#">Twitter</a></li>
        </ul>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 公司名称. 保留所有权利。</p>
      </div>
    </footer>
  </div>
</body>
</html>
```

### 3.2 CSS Grid布局示例

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CSS Grid布局示例</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 40px;
      background: #f5f5f5;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    h2 {
      margin-bottom: 30px;
      color: #2c3e50;
      text-align: center;
    }
    
    /* 示例1：基础网格 */
    .grid-example1 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .grid-item {
      padding: 30px;
      background: white;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      font-size: 24px;
      font-weight: bold;
      color: white;
    }
    
    .item1 { background: #3498db; }
    .item2 { background: #e74c3c; }
    .item3 { background: #2ecc71; }
    .item4 { background: #9b59b6; }
    .item5 { background: #f39c12; }
    .item6 { background: #1abc9c; }
    
    /* 示例2：复杂网格布局 */
    .grid-example2 {
      display: grid;
      grid-template-columns: 250px 1fr;
      grid-template-rows: auto 1fr auto;
      grid-template-areas:
        "header header"
        "sidebar main"
        "footer footer";
      gap: 20px;
      height: 600px;
      margin-bottom: 30px;
    }
    
    .header {
      grid-area: header;
      background: #2c3e50;
      color: white;
      padding: 20px;
      border-radius: 12px;
    }
    
    .sidebar {
      grid-area: sidebar;
      background: #ecf0f1;
      padding: 20px;
      border-radius: 12px;
    }
    
    .main {
      grid-area: main;
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .footer {
      grid-area: footer;
      background: #2c3e50;
      color: white;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
    }
    
    /* 示例3：响应式网格 */
    .grid-example3 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 24px;
      margin-bottom: 30px;
    }
    
    /* 示例4：图像画廊 */
    .gallery {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      grid-auto-rows: 200px;
      gap: 16px;
      margin-bottom: 30px;
    }
    
    .gallery-item {
      position: relative;
      overflow: hidden;
      border-radius: 12px;
      cursor: pointer;
    }
    
    .gallery-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    
    .gallery-item:hover img {
      transform: scale(1.1);
    }
    
    .gallery-item .overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(transparent, rgba(0,0,0,0.8));
      color: white;
      padding: 20px;
      transform: translateY(100%);
      transition: transform 0.3s ease;
    }
    
    .gallery-item:hover .overlay {
      transform: translateY(0);
    }
    
    /* 示例5：仪表盘布局 */
    .dashboard {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: auto 1fr;
      gap: 24px;
      margin-bottom: 30px;
    }
    
    .dashboard-header {
      grid-column: 1 / -1;
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .dashboard-widget {
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .widget-large {
      grid-column: span 2;
    }
    
    .widget-full {
      grid-column: span 4;
    }
    
    .widget-title {
      font-size: 18px;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 16px;
    }
    
    .widget-content {
      color: #666;
    }
    
    /* 示例6：杂志布局 */
    .magazine {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-auto-rows: 200px;
      gap: 24px;
      margin-bottom: 30px;
    }
    
    .magazine-item {
      border-radius: 12px;
      overflow: hidden;
      position: relative;
    }
    
    .magazine-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .magazine-item .content {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(transparent, rgba(0,0,0,0.9));
      color: white;
      padding: 24px;
    }
    
    .magazine-item span {
      position: absolute;
      top: 16px;
      right: 16px;
      background: #e74c3c;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
    }
    
    .magazine-item.large {
      grid-column: span 2;
      grid-row: span 2;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>CSS Grid布局示例</h2>
    
    <!-- 示例1：基础网格 -->
    <h3>示例1：基础网格布局</h3>
    <div class="grid-example1">
      <div class="grid-item item1">1</div>
      <div class="grid-item item2">2</div>
      <div class="grid-item item3">3</div>
      <div class="grid-item item4">4</div>
      <div class="grid-item item5">5</div>
      <div class="grid-item item6">6</div>
    </div>
    
    <!-- 示例2：复杂网格布局 -->
    <h3>示例2：复杂网格布局（页眉、侧边栏、主内容、页脚）</h3>
    <div class="grid-example2">
      <div class="header">页眉区域</div>
      <div class="sidebar">
        <h4>侧边栏</h4>
        <p>导航链接、广告等内容</p>
      </div>
      <div class="main">
        <h4>主内容区域</h4>
        <p>这是主要的内容区域，可以放置文章、图片等内容。</p>
        <p>Grid布局让复杂的页面结构变得简单。</p>
      </div>
      <div class="footer">页脚区域</div>
    </div>
    
    <!-- 示例3：响应式网格 -->
    <h3>示例3：响应式网格布局</h3>
    <div class="grid-example3">
      <div class="grid-item item1">项目 1</div>
      <div class="grid-item item2">项目 2</div>
      <div class="grid-item item3">项目 3</div>
      <div class="grid-item item4">项目 4</div>
      <div class="grid-item item5">项目 5</div>
      <div class="grid-item item6">项目 6</div>
    </div>
    
    <!-- 示例4：图像画廊 -->
    <h3>示例4：图像画廊</h3>
    <div class="gallery">
      <div class="gallery-item">
        <img src="https://picsum.photos/300/200?random=1" alt="图片1">
        <div class="overlay">图片标题 1</div>
      </div>
      <div class="gallery-item">
        <img src="https://picsum.photos/300/200?random=2" alt="图片2">
        <div class="overlay">图片标题 2</div>
      </div>
      <div class="gallery-item">
        <img src="https://picsum.photos/300/200?random=3" alt="图片3">
        <div class="overlay">图片标题 3</div>
      </div>
      <div class="gallery-item">
        <img src="https://picsum.photos/300/200?random=4" alt="图片4">
        <div class="overlay">图片标题 4</div>
      </div>
    </div>
    
    <!-- 示例5：仪表盘布局 -->
    <h3>示例5：仪表盘布局</h3>
    <div class="dashboard">
      <div class="dashboard-header">
        <h3>仪表盘</h3>
      </div>
      <div class="dashboard-widget">
        <div class="widget-title">用户统计</div>
        <div class="widget-content">
          <p>总用户数: 10,000</p>
          <p>今日新增: 150</p>
          <p>活跃用户: 8,500</p>
        </div>
      </div>
      <div class="dashboard-widget">
        <div class="widget-title">销售额</div>
        <div class="widget-content">
          <p>今日销售额: ¥50,000</p>
          <p>本月销售额: ¥1,200,000</p>
          <p>同比增长: 15%</p>
        </div>
      </div>
      <div class="dashboard-widget widget-large">
        <div class="widget-title">访问趋势</div>
        <div class="widget-content">
          <p>图表展示访问趋势数据</p>
        </div>
      </div>
      <div class="dashboard-widget widget-full">
        <div class="widget-title">系统状态</div>
        <div class="widget-content">
          <p>服务器状态: 正常</p>
          <p>数据库状态: 正常</p>
          <p>缓存状态: 正常</p>
        </div>
      </div>
    </div>
    
    <!-- 示例6：杂志布局 -->
    <h3>示例6：杂志布局</h3>
    <div class="magazine">
      <div class="magazine-item large">
        <img src="https://picsum.photos/600/400?random=5" alt="大图">
        <span>头条</span>
        <div class="content">
          <h4>重磅新闻</h4>
          <p>这是一篇重要的新闻报道，占据较大的空间。</p>
        </div>
      </div>
      <div class="magazine-item">
        <img src="https://picsum.photos/300/200?random=6" alt="图片1">
        <span>新闻</span>
        <div class="content">
          <h4>新闻标题</h4>
          <p>简短的新闻摘要。</p>
        </div>
      </div>
      <div class="magazine-item">
        <img src="https://picsum.photos/300/200?random=7" alt="图片2">
        <span>新闻</span>
        <div class="content">
          <h4>新闻标题</h4>
          <p>简短的新闻摘要。</p>
        </div>
      </div>
      <div class="magazine-item">
        <img src="https://picsum.photos/300/200?random=8" alt="图片3">
        <span>新闻</span>
        <div class="content">
          <h4>新闻标题</h4>
          <p>简短的新闻摘要。</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
```

### 3.3 响应式设计示例

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>响应式设计示例</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.6;
    }
    
    /* 移动端样式（默认） */
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }
    
    .header {
      background: #2c3e50;
      color: white;
      padding: 20px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 24px;
    }
    
    .nav {
      background: #34495e;
    }
    
    .nav ul {
      list-style: none;
      text-align: center;
    }
    
    .nav li {
      margin: 10px 0;
    }
    
    .nav a {
      color: white;
      text-decoration: none;
      padding: 10px 20px;
      display: inline-block;
    }
    
    .hero {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 60px 20px;
      text-align: center;
    }
    
    .hero h2 {
      font-size: 32px;
      margin-bottom: 20px;
    }
    
    .hero p {
      font-size: 18px;
      margin-bottom: 30px;
    }
    
    .btn {
      display: inline-block;
      padding: 14px 28px;
      background: white;
      color: #667eea;
      text-decoration: none;
      border-radius: 30px;
      font-weight: bold;
      transition: transform 0.3s ease;
    }
    
    .btn:hover {
      transform: translateY(-2px);
    }
    
    .features {
      padding: 60px 20px;
      background: #f5f5f5;
    }
    
    .features h3 {
      text-align: center;
      margin-bottom: 40px;
      color: #2c3e50;
    }
    
    .feature-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 30px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .feature {
      background: white;
      padding: 30px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .feature-icon {
      font-size: 48px;
      margin-bottom: 20px;
    }
    
    .feature h4 {
      margin-bottom: 10px;
      color: #2c3e50;
    }
    
    .feature p {
      color: #666;
    }
    
    .content {
      padding: 60px 20px;
    }
    
    .content h3 {
      text-align: center;
      margin-bottom: 40px;
      color: #2c3e50;
    }
    
    .content-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 30px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .content-item {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .content-image {
      width: 100%;
      height: 200px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      color: white;
      font-size: 48px;
    }
    
    .content-info {
      padding: 24px;
    }
    
    .content-info h4 {
      margin-bottom: 10px;
      color: #2c3e50;
    }
    
    .content-info p {
      color: #666;
      line-height: 1.6;
    }
    
    .footer {
      background: #2c3e50;
      color: white;
      padding: 40px 20px;
      text-align: center;
    }
    
    .footer p {
      margin-bottom: 10px;
    }
    
    /* 平板样式（768px及以上） */
    @media (min-width: 768px) {
      .hero h2 {
        font-size: 48px;
      }
      
      .hero p {
        font-size: 20px;
        max-width: 600px;
        margin: 0 auto 30px;
      }
      
      .feature-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .content-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .nav ul {
        display: flex;
        justify-content: center;
        gap: 30px;
      }
      
      .nav li {
        margin: 0;
      }
    }
    
    /* 桌面样式（1024px及以上） */
    @media (min-width: 1024px) {
      .container {
        padding: 0 40px;
      }
      
      .hero {
        padding: 100px 40px;
      }
      
      .features {
        padding: 80px 40px;
      }
      
      .content {
        padding: 80px 40px;
      }
      
      .feature-grid {
        grid-template-columns: repeat(3, 1fr);
      }
      
      .content-grid {
        grid-template-columns: repeat(3, 1fr);
      }
      
      .footer {
        padding: 60px 40px;
      }
    }
    
    /* 大桌面样式（1400px及以上） */
    @media (min-width: 1400px) {
      .container {
        padding: 0 80px;
      }
      
      .hero {
        padding: 120px 80px;
      }
      
      .features {
        padding: 100px 80px;
      }
      
      .content {
        padding: 100px 80px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- 页眉 -->
    <header class="header">
      <h1>响应式网站</h1>
    </header>
    
    <!-- 导航 -->
    <nav class="nav">
      <ul>
        <li><a href="#">首页</a></li>
        <li><a href="#">产品</a></li>
        <li><a href="#">服务</a></li>
        <li><a href="#">关于</a></li>
        <li><a href="#">联系</a></li>
      </ul>
    </nav>
    
    <!-- 英雄区 -->
    <section class="hero">
      <h2>创建响应式网站</h2>
      <p>使用CSS媒体查询和现代布局技术，让您的网站在任何设备上都能完美显示。</p>
      <a href="#" class="btn">开始学习</a>
    </section>
    
    <!-- 特性 -->
    <section class="features">
      <h3>我们的特性</h3>
      <div class="feature-grid">
        <div class="feature">
          <div class="feature-icon">📱</div>
          <h4>移动端优化</h4>
          <p>针对手机和平板进行专门优化，提供流畅的移动体验。</p>
        </div>
        <div class="feature">
          <div class="feature-icon">💻</div>
          <h4>桌面端适配</h4>
          <p>在桌面设备上提供完整功能和最佳视觉效果。</p>
        </div>
        <div class="feature">
          <div class="feature-icon">🚀</div>
          <h4>高性能</h4>
          <p>优化的代码和资源加载，确保快速响应。</p>
        </div>
      </div>
    </section>
    
    <!-- 内容 -->
    <section class="content">
      <h3>我们的服务</h3>
      <div class="content-grid">
        <div class="content-item">
          <div class="content-image">🎨</div>
          <div class="content-info">
            <h4>UI/UX设计</h4>
            <p>创建美观、易用的用户界面，提升用户体验。</p>
          </div>
        </div>
        <div class="content-item">
          <div class="content-image">💻</div>
          <div class="content-info">
            <h4>前端开发</h4>
            <p>使用最新技术栈，开发高性能的前端应用。</p>
          </div>
        </div>
        <div class="content-item">
          <div class="content-image">📱</div>
          <div class="content-info">
            <h4>移动开发</h4>
            <p>开发跨平台的移动应用，覆盖更多用户。</p>
          </div>
        </div>
      </div>
    </section>
    
    <!-- 页脚 -->
    <footer class="footer">
      <p>&copy; 2026 公司名称. 保留所有权利。</p>
      <p>电话: 123-456-7890 | 邮箱: info@example.com</p>
    </footer>
  </div>
</body>
</html>
```

### 3.4 CSS动画示例

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CSS动画示例</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 40px;
      background: #f5f5f5;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    h2 {
      margin-bottom: 30px;
      color: #2c3e50;
      text-align: center;
    }
    
    /* 示例1：按钮悬停效果 */
    .btn-container {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-bottom: 40px;
    }
    
    .btn {
      padding: 14px 28px;
      background: #3498db;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }
    
    .btn:hover {
      background: #2980b9;
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(52, 152, 219, 0.3);
    }
    
    .btn:active {
      transform: translateY(0);
    }
    
    .btn-secondary {
      background: #e74c3c;
    }
    
    .btn-secondary:hover {
      background: #c0392b;
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(231, 76, 60, 0.3);
    }
    
    /* 示例2：卡片悬停效果 */
    .card-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 30px;
      margin-bottom: 40px;
    }
    
    .card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
    }
    
    .card:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 24px rgba(0,0,0,0.15);
    }
    
    .card-image {
      width: 100%;
      height: 200px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      color: white;
      font-size: 48px;
      transition: transform 0.3s ease;
    }
    
    .card:hover .card-image {
      transform: scale(1.1);
    }
    
    .card-content {
      padding: 24px;
    }
    
    .card-content h3 {
      margin-bottom: 12px;
      color: #2c3e50;
    }
    
    .card-content p {
      color: #666;
      line-height: 1.6;
    }
    
    /* 示例3：加载动画 */
    .loader-container {
      display: flex;
      justify-content: center;
      gap: 40px;
      margin-bottom: 40px;
    }
    
    .loader {
      width: 50px;
      height: 50px;
      border: 4px solid #ecf0f1;
      border-top-color: #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    .loader-dots {
      width: 50px;
      height: 50px;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
    }
    
    .dot {
      width: 10px;
      height: 10px;
      background: #3498db;
      border-radius: 50%;
      animation: bounce 1s ease-in-out infinite;
    }
    
    .dot:nth-child(2) {
      animation-delay: 0.2s;
    }
    
    .dot:nth-child(3) {
      animation-delay: 0.4s;
    }
    
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
    
    @keyframes bounce {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-15px);
      }
    }
    
    /* 示例4：淡入淡出 */
    .fade-container {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-bottom: 40px;
    }
    
    .fade-box {
      width: 100px;
      height: 100px;
      background: #3498db;
      border-radius: 8px;
      opacity: 0;
      animation: fadeIn 1s ease forwards;
    }
    
    .fade-box:nth-child(2) {
      animation-delay: 0.5s;
      background: #e74c3c;
    }
    
    .fade-box:nth-child(3) {
      animation-delay: 1s;
      background: #2ecc71;
    }
    
    @keyframes fadeIn {
      to {
        opacity: 1;
      }
    }
    
    /* 示例5：滑动菜单 */
    .menu-container {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-bottom: 40px;
    }
    
    .menu {
      position: relative;
    }
    
    .menu-btn {
      padding: 14px 28px;
      background: #3498db;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.3s ease;
    }
    
    .menu-btn:hover {
      background: #2980b9;
    }
    
    .menu-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      min-width: 150px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      overflow: hidden;
      transform: translateY(-10px);
      opacity: 0;
      transition: all 0.3s ease;
      pointer-events: none;
    }
    
    .menu:hover .menu-dropdown {
      transform: translateY(0);
      opacity: 1;
      pointer-events: auto;
    }
    
    .menu-dropdown a {
      display: block;
      padding: 12px 20px;
      color: #333;
      text-decoration: none;
      transition: background 0.3s ease;
    }
    
    .menu-dropdown a:hover {
      background: #f5f5f5;
    }
    
    /* 示例6：进度条 */
    .progress-container {
      max-width: 400px;
      margin: 0 auto;
      margin-bottom: 40px;
    }
    
    .progress-bar {
      width: 100%;
      height: 20px;
      background: #ecf0f1;
      border-radius: 10px;
      overflow: hidden;
    }
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      width: 0;
      animation: progress 3s ease-in-out forwards;
    }
    
    @keyframes progress {
      to {
        width: 100%;
      }
    }
    
    /* 示例7：翻转卡片 */
    .flip-container {
      perspective: 1000px;
      margin: 0 auto;
      margin-bottom: 40px;
      width: 300px;
    }
    
    .flip-card {
      width: 100%;
      height: 200px;
      position: relative;
      transform-style: preserve-3d;
      transition: transform 0.6s ease;
      cursor: pointer;
    }
    
    .flip-container:hover .flip-card {
      transform: rotateY(180deg);
    }
    
    .card-face {
      position: absolute;
      width: 100%;
      height: 100%;
      backface-visibility: hidden;
      border-radius: 12px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 48px;
      color: white;
    }
    
    .card-front {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    
    .card-back {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      transform: rotateY(180deg);
    }
    
    /* 示例8：脉冲效果 */
    .pulse-container {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-bottom: 40px;
    }
    
    .pulse {
      width: 80px;
      height: 80px;
      background: #3498db;
      border-radius: 50%;
      position: relative;
    }
    
    .pulse::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 100%;
      height: 100%;
      background: inherit;
      border-radius: 50%;
      animation: pulse 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
    }
    
    .pulse::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 100%;
      height: 100%;
      background: inherit;
      border-radius: 50%;
      animation: pulse 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
      animation-delay: 1s;
    }
    
    @keyframes pulse {
      0% {
        width: 100%;
        height: 100%;
        opacity: 0.8;
      }
      100% {
        width: 200%;
        height: 200%;
        opacity: 0;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>CSS动画示例</h2>
    
    <!-- 示例1：按钮悬停效果 -->
    <h3>示例1：按钮悬停效果</h3>
    <div class="btn-container">
      <button class="btn">主按钮</button>
      <button class="btn btn-secondary">次按钮</button>
    </div>
    
    <!-- 示例2：卡片悬停效果 -->
    <h3>示例2：卡片悬停效果</h3>
    <div class="card-container">
      <div class="card">
        <div class="card-image">🎨</div>
        <div class="card-content">
          <h3>设计</h3>
          <p>创建美观的界面设计，提升用户体验。</p>
        </div>
      </div>
      <div class="card">
        <div class="card-image">💻</div>
        <div class="card-content">
          <h3>开发</h3>
          <p>编写高质量的代码，实现功能需求。</p>
        </div>
      </div>
      <div class="card">
        <div class="card-image">🚀</div>
        <div class="card-content">
          <h3>部署</h3>
          <p>将应用部署到服务器，提供稳定服务。</p>
        </div>
      </div>
    </div>
    
    <!-- 示例3：加载动画 -->
    <h3>示例3：加载动画</h3>
    <div class="loader-container">
      <div class="loader"></div>
      <div class="loader-dots">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
    </div>
    
    <!-- 示例4：淡入淡出 -->
    <h3>示例4：淡入淡出</h3>
    <div class="fade-container">
      <div class="fade-box"></div>
      <div class="fade-box"></div>
      <div class="fade-box"></div>
    </div>
    
    <!-- 示例5：滑动菜单 -->
    <h3>示例5：滑动菜单</h3>
    <div class="menu-container">
      <div class="menu">
        <button class="menu-btn">菜单</button>
        <div class="menu-dropdown">
          <a href="#">首页</a>
          <a href="#">产品</a>
          <a href="#">服务</a>
          <a href="#">关于</a>
        </div>
      </div>
    </div>
    
    <!-- 示例6：进度条 -->
    <h3>示例6：进度条</h3>
    <div class="progress-container">
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
    </div>
    
    <!-- 示例7：翻转卡片 -->
    <h3>示例7：翻转卡片</h3>
    <div class="flip-container">
      <div class="flip-card">
        <div class="card-face card-front">正面</div>
        <div class="card-face card-back">背面</div>
      </div>
    </div>
    
    <!-- 示例8：脉冲效果 -->
    <h3>示例8：脉冲效果</h3>
    <div class="pulse-container">
      <div class="pulse"></div>
    </div>
  </div>
</body>
</html>
```

---

## 四、最佳实践

### 4.1 Flexbox使用建议

1. **选择合适的布局模型**：Flexbox适合一维布局，Grid适合二维布局
2. **合理使用flex属性**：`flex-grow`、`flex-shrink`、`flex-basis`
3. **注意对齐方式**：`justify-content`和`align-items`的组合使用
4. **响应式设计**：结合媒体查询实现响应式布局

### 4.2 CSS Grid使用建议

1. **定义清晰的网格结构**：使用`grid-template-columns`和`grid-template-rows`
2. **合理使用fr单位**：`fr`单位表示剩余空间的分数
3. **使用grid-area命名区域**：提高代码可读性
4. **响应式网格**：使用`repeat(auto-fit, minmax())`实现自适应网格

### 4.3 响应式设计建议

1. **移动优先**：从最小屏幕开始设计，逐步增强
2. **合理设置断点**：根据内容而非设备设置断点
3. **流式布局**：使用百分比和相对单位
4. **弹性图片**：`max-width: 100%`确保图片自适应

### 4.4 CSS动画建议

1. **性能优化**：使用`transform`和`opacity`实现动画
2. **避免过度使用**：动画应增强用户体验，而非分散注意力
3. **提供回退方案**：确保不支持动画的浏览器仍能正常工作
4. **尊重用户偏好**：使用`prefers-reduced-motion`减少动画

---

## 五、常见问题

### 5.1 Flexbox与Grid的选择

**问题**：什么时候使用Flexbox，什么时候使用Grid？

**解决方案**：
- **Flexbox**：适合一维布局（行或列），如导航栏、卡片列表
- **Grid**：适合二维布局（行和列），如页面布局、仪表盘

### 5.2 响应式断点设置

**问题**：如何设置合理的响应式断点？

**解决方案**：
- 根据内容设置断点，而非特定设备
- 常用断点：576px、768px、992px、1200px
- 使用媒体查询测试布局变化

### 5.3 动画性能问题

**问题**：CSS动画导致页面卡顿？

**解决方案**：
- 使用`transform`和`opacity`而非`top`、`left`
- 减少动画元素数量
- 使用`will-change`提前分层
- 避免在动画中使用复杂的选择器

---

## 六、实战练习

### 6.1 练习1：响应式导航栏

**任务**：创建一个响应式导航栏，包含以下功能：
- 移动端：垂直菜单，点击展开
- 桌面端：水平菜单，悬停显示子菜单
- 品牌Logo居中
- 菜单两端对齐

### 6.2 练习2：仪表盘布局

**任务**：使用CSS Grid创建一个仪表盘布局，包含：
- 页眉区域
- 侧边栏导航
- 主内容区域
- 页脚区域
- 响应式调整布局

### 6.3 练习3：动画按钮

**任务**：创建一组动画按钮，包含：
- 悬停效果（阴影、位移）
- 点击效果（缩放）
- 加载状态（旋转动画）
- 不同颜色主题

---

## 七、总结

CSS3是现代Web开发的基石，掌握其核心知识至关重要：

1. **Flexbox**：一维布局的强大工具
2. **CSS Grid**：二维布局的终极解决方案
3. **响应式设计**：适配不同设备的必备技能
---

## 七、深入原理分析

### 7.1 CSS选择器优先级计算原理

CSS优先级（Specificity）决定了当多条规则作用于同一元素时，哪条规则生效。其计算基于四个层级：

```
优先级公式：(内联样式, ID数量, 类/属性/伪类数量, 元素/伪元素数量)

计算示例：
- p                    → (0, 0, 0, 1) → specificity = 0,0,0,1
- .nav li              → (0, 0, 1, 2) → specificity = 0,0,1,2
- #header .nav a:hover → (0, 1, 2, 1) → specificity = 0,1,2,1
- <div style="color">  → (1, 0, 0, 0) → specificity = 1,0,0,0
```

**特异性比较规则**：
1. 首先比较内联样式（A），数量大者胜出
2. 其次比较ID数量（B），数量大者胜出
3. 再次比较类/属性/伪类数量（C），数量大者胜出
4. 最后比较元素/伪元素数量（D），数量大者胜出
5. `!important` 最高优先级，但应尽量避免使用

**避免特异性战争的策略**：

```css
/* ❌ 特异性陷阱：越来越高的特异性 */
.nav .nav-item .nav-link { color: blue; }
.nav .nav-item .nav-link.active { color: red; }
#header .nav .nav-item .nav-link.active { color: green; }

/* ✅ 正确做法：保持特异性扁平化 */
.nav-link { color: blue; }
.nav-link--active { color: red; }
.nav-link--active.is-highlighted { color: green; }

/* ✅ 使用CSS变量实现动态优先级 */
.nav-link {
  color: var(--link-color, blue);
}
.nav-link--active {
  --link-color: red;
}
```

### 7.2 CSS盒模型与Box-Sizing工作原理

CSS盒模型决定了浏览器如何计算元素尺寸。存在两种盒模型：

```
标准盒模型（content-box）：
┌──────────────────────────────────┐
│           margin (外边距)           │
│  ┌────────────────────────────┐   │
│  │        border (边框)        │   │
│  │  ┌──────────────────────┐ │   │
│  │  │   padding (内边距)    │ │   │
│  │  │  ┌────────────────┐  │ │   │
│  │  │  │    content     │  │ │   │
│  │  │  │  (width/height)│  │ │   │
│  │  │  └────────────────┘  │ │   │
│  │  └──────────────────────┘ │   │
│  └────────────────────────────┘   │
└──────────────────────────────────┘

IE盒模型（border-box）：
┌──────────────────────────────────┐
│           margin (外边距)           │
│  ┌────────────────────────────┐   │
│  │        border (边框)        │   │
│  │  ┌──────────────────────┐  │   │
│  │  │   padding (内边距)   │  │   │
│  │  │  ┌──────────────┐   │  │   │
│  │  │  │   content    │   │  │   │
│  │  │  │  (包含内边距) │   │  │   │
│  │  │  └──────────────┘   │  │   │
│  │  └──────────────────────┘  │   │
│  └────────────────────────────┘   │
└──────────────────────────────────┘

元素实际宽度计算：
- content-box: width + padding*2 + border*2 + margin*2
- border-box: width（含padding和border） + margin*2
```

**实战应用：统一盒模型**：

```css
/* 全局设置border-box，简化尺寸计算 */
*, *::before, *::after {
  box-sizing: border-box;
}

/* 这样设置后，width=300px就真的是300px */
.box {
  width: 300px;
  padding: 20px;
  border: 1px solid #ddd;
  /* 实际占用宽度仍为300px（内容区缩小） */
}
```

### 7.3 Flexbox算法与布局原理

Flexbox的布局算法基于"弹性空间"分配机制：

```
Flex容器空间分配流程：

1. 计算flex项目的基础尺寸（flex-basis或width）
2. 如果所有项目flex-grow总和 < 1，剩余空间按比例分配
3. 如果flex-grow总和 >= 1，所有剩余空间按flex-grow比例分配
4. 如果项目总和超出容器，执行flex-shrink收缩计算
5. 计算交叉轴对齐（align-items）

示例：容器宽度800px，项目A(flex:1 1 200px), B(flex:2 1 300px)
- 基础尺寸总和：200 + 300 = 500px
- 剩余空间：800 - 500 = 300px
- flex-grow总和：1 + 2 = 3
- A获得：200 + 300 * (1/3) = 300px
- B获得：300 + 300 * (2/3) = 500px
```

**flex-shrink深入理解**：

```css
/* flex-shrink计算公式：
 * 实际收缩量 = (项目flex-shrink × 项目基础尺寸) / 加权总和 × 超出量
 *
 * 示例：容器400px，三个项目
 * Item1: width=200px, flex-shrink=1
 * Item2: width=200px, flex-shrink=1
 * Item3: width=200px, flex-shrink=2
 *
 * 加权总和 = 200*1 + 200*1 + 200*2 = 800
 * 超出量 = 600 - 400 = 200px
 *
 * Item1收缩 = 200 * 1 / 800 * 200 = 50px → 实际150px
 * Item2收缩 = 200 * 1 / 800 * 200 = 50px → 实际150px
 * Item3收缩 = 200 * 2 / 800 * 200 = 100px → 实际100px
 */
```

### 7.4 CSS Grid布局算法

CSS Grid使用"轨道"概念进行二维布局：

```css
/* 显式网格 vs 隐式网格 */
.grid {
  display: grid;

  /* 显式网格：明确定义轨道 */
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: auto 1fr auto;

  /* 隐式网格：自动创建轨道容纳额外项目 */
  grid-auto-rows: minmax(100px, auto);
  grid-auto-columns: 200px;

  /* 自动放置算法 */
  grid-auto-flow: row;    /* 默认：先行后列 */
  grid-auto-flow: dense;  /* 密集模式：回填空白 */
}
```

### 7.5 CSS动画性能优化原理

CSS动画的性能差异源于渲染管线的不同阶段：

```
浏览器渲染管线：
┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐
│ JS运行 │ → │ 样式计算 │ → │   布局  │ → │   绘制  │ → │  合成   │
└────────┘   └────────┘   └────────┘   └────────┘   └────────┘
               ↑                                  ↑
         触发 Layout                           触发 Paint
         (重排)                                  (重绘)

触发合成器线程的属性（最佳性能）：
✅ transform: translate() scale() rotate()
✅ opacity: 0~1
✅ filter: blur()（部分）
✅ clip-path: polygon()
✅ will-change: transform

触发重排的属性（性能较差）：
❌ width, height
❌ margin, padding
❌ top, left, right, bottom
❌ font-size, line-height

触发重绘的属性（性能中等）：
❌ color, background-color
❌ border, border-radius
❌ box-shadow
```

### 7.6 CSS层叠上下文（Stacking Context）

层叠上下文决定了元素在Z轴上的叠放顺序：

```css
/* 创建层叠上下文的条件：
 * 1. 根元素 (<html>)
 * 2. position: relative/absolute + z-index不为auto
 * 3. position: fixed/sticky（z-index不为auto）
 * 4. opacity < 1
 * 5. transform不为none
 * 6. filter不为none
 * 7. isolation: isolate
 * 8. mix-blend-mode不为normal
 * 9. CSS columns不为normal
 * 10. grid容器 + z-index不为auto
 */

.parent {
  position: relative;
  z-index: 1; /* 创建新的层叠上下文 */
}

.child {
  position: relative;
  z-index: 9999; /* 无法超出父级的层叠上下文 */
}
```

---

## 八、常见面试题详解

### 8.1 Flexbox和Grid的核心区别是什么？何时使用？

**参考答案**：

**核心区别**：

| 维度 | Flexbox | CSS Grid |
|------|---------|----------|
| **维度** | 一维布局（主轴或交叉轴） | 二维布局（行和列同时） |
| **方向** | 沿主轴单向排列 | 同时控制行和列 |
| **对齐** | 主轴+交叉轴独立控制 | 单元格级别精细控制 |
| **空间分配** | 项目弹性伸缩 | 轨道尺寸精确控制 |
| **适用场景** | 导航、列表、居中 | 页面整体布局、仪表盘 |

**何时使用Flexbox**：
```css
/* ✅ 导航栏（水平排列） */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* ✅ 卡片列表（自动换行） */
.card-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

/* ✅ 垂直居中 */
.center-box {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* ✅ 媒体对象 */
.media {
  display: flex;
  gap: 15px;
}
.media-body { flex: 1; }
```

**何时使用Grid**：
```css
/* ✅ 页面整体布局 */
.page {
  display: grid;
  grid-template-columns: 250px 1fr 250px;
  grid-template-rows: 60px 1fr 40px;
  grid-template-areas:
    "header header header"
    "nav main aside"
    "footer footer footer";
}

/* ✅ 照片墙/瀑布流 */
.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  grid-auto-rows: 200px;
  grid-auto-flow: dense; /* 密集填充 */
}

/* ✅ 仪表盘 */
.dashboard {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: auto repeat(3, 200px);
  gap: 20px;
}
```

**最佳实践**：两者可结合使用——Grid负责整体页面布局，Flexbox负责组件内部排列。

### 8.2 如何实现一个完美的垂直居中？

**参考答案**（从初学者到专家的5种方案）：

```css
/* 方案1：Flexbox（推荐，2026年最常用） */
.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 方案2：Grid（同样简洁） */
.grid-center {
  display: grid;
  place-items: center; /* justify-items + align-items 简写 */
}

/* 方案3：绝对定位 + transform（兼容性好） */
.absolute-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* 方案4：绝对定位 + margin（已知尺寸时） */
.absolute-center-fixed {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: auto; /* 四值全0时等价于垂直+水平居中 */
}

/* 方案5：视口单位（适用于全屏居中） */
.viewport-center {
  display: flex;
  min-height: 100vh;
  margin: 0;
}
```

**面试加分点**：提到Grid的`place-items: center`和Flexbox的组合使用，以及`margin: auto`在Flex项目中的居中原理。

### 8.3 CSS变量（自定义属性）的原理与应用场景

**参考答案**：

```css
/* CSS变量基础语法 */
:root {
  /* 全局变量 */
  --primary-color: #007bff;
  --spacing-unit: 8px;

  /* 带默认值的变量 */
  --border-radius: var(--spacing-unit, 8px);
}

.component {
  /* 局部变量（仅在此元素及其后代生效） */
  --component-bg: #f5f5f5;

  /* 使用变量 */
  background-color: var(--primary-color);
  padding: calc(var(--spacing-unit) * 2);

  /* 带备用值 */
  color: var(--undefined-var, #333);

  /* 使用多个备用值 */
  font-size: var(--custom-size, var(--default-size, 16px));

  /* 复杂运算 */
  padding: calc(var(--spacing-unit) * 2);
  border-radius: var(--border-radius);
}
```

**实战应用：主题切换系统**：

```css
/* 浅色主题 */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --text-primary: #333333;
  --text-secondary: #666666;
  --border-color: #dee2e6;
}

/* 深色主题 */
[data-theme="dark"] {
  --bg-primary: #1a1a2e;
  --bg-secondary: #16213e;
  --text-primary: #eaeaea;
  --text-secondary: #b0b0b0;
  --border-color: #2d3a4d;
}

/* 自动跟随系统主题 */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg-primary: #1a1a2e;
    --bg-secondary: #16213e;
    --text-primary: #eaeaea;
    --text-secondary: #b0b0b0;
    --border-color: #2d3a4d;
  }
}

/* 应用变量到所有元素 */
body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

```javascript
// JavaScript动态控制主题
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

// 页面加载时恢复主题
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  setTheme(savedTheme);
}
```

### 8.4 如何理解BFC（块级格式化上下文）？

**参考答案**：

**BFC的触发条件**：
- 根元素（`<html>`）
- `overflow !== visible`（常使用`overflow: hidden`或`auto`）
- `display: flow-root`（最纯粹的方式，不产生副作用）
- `position: absolute/fixed`
- `float !== none`
- `display: inline-block/table-cell/table-caption/flex/grid`

**BFC的特性**：
1. BFC内部的Box垂直排列
2. Box垂直方向的距离由margin决定，但会合并（外边距折叠）
3. BFC内部的浮动元素会被包含（清除浮动）
4. BFC区域不与外部浮动元素重叠
5. 计算BFC高度时，浮动子元素也参与计算

**实战应用**：

```css
/* 应用1：清除浮动 */
.clearfix::after {
  content: '';
  display: table;
  clear: both;
}

/* 或更现代的方式：使用flow-root */
.parent {
  display: flow-root;
  /* 子元素浮动自动被包含 */
}

/* 应用2：两栏自适应布局 */
.container {
  display: flow-root; /* 建立BFC */
}

.left {
  float: left;
  width: 200px;
}

.right {
  overflow: hidden; /* 建立BFC，不与浮动重叠 */
}

/* 应用3：防止外边距折叠 */
.wrapper {
  display: flow-root;
}

.parent {
  overflow: hidden;
}

.child {
  margin-top: 20px; /* 不再与父级的margin合并 */
}
```

### 8.5 CSS Modules、Styled-Components、Tailwind CSS 对比

**参考答案**：

| 特性 | CSS Modules | Styled-Components | Tailwind CSS |
|------|------------|------------------|--------------|
| **类型** | CSS预处理 | CSS-in-JS | Utility-First |
| **作用域** | 编译时生成唯一类名 | 运行时动态生成 | 预定义工具类 |
| **性能** | 编译优化，最佳 | 运行时开销 | 极好（purge后） |
| **学习曲线** | 低（标准CSS） | 中（需学JS API） | 中（大量工具类） |
| **动态样式** | 需要组合类名 | JS变量直接控制 | JS控制类名 |
| **适用场景** | React/任何框架 | React组件 | 快速开发 |

```css
/* CSS Modules 写法 */
.card { padding: 20px; }
.card__title { font-size: 20px; }
.card--highlighted { border: 2px solid gold; }

/* Styled-Components 写法 */
import styled from 'styled-components';

const Card = styled.div`padding: 20px;`;
const Title = styled.h2`font-size: ${props => props.$large ? '24px' : '20px'};`;
const HighlightedCard = styled(Card)`border: 2px solid gold;`;

/* Tailwind CSS 写法 */
<div className="p-5 border-2 border-yellow-400">
  <h2 className="text-xl">标题</h2>
</div>
```

---

## 九、扩展知识：CSS架构与2026年前沿特性

### 9.1 CSS架构模式

**BEM命名规范**：

```
Block__Element--Modifier

示例：
.card                    → 块：卡片组件
.card__header            → 元素：卡片头部
.card__image             → 元素：卡片图片
.card__title--large      → 元素+修饰符：大标题
.card--featured          → 修饰符：特色卡片
.card__footer__button    → 多层级元素
```

**原子化CSS（Atomic CSS）**：每个类只包含一条样式规则，如Tailwind CSS：

```css
/* 原子化CSS示例 */
.flex { display: flex; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.gap-4 { gap: 1rem; }
.p-4 { padding: 1rem; }
.rounded-lg { border-radius: 0.5rem; }
.shadow-md { box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
```

**CSS-in-JS**（Styled-Components、Emotion）：

```javascript
// Styled-Components完整示例
import styled, { css, createGlobalStyle } from 'styled-components';

// 全局样式
const GlobalStyle = createGlobalStyle`
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, sans-serif; }
`;

// 可复用组件
const Button = styled.button`
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;

  ${props => props.$primary && css`
    background: #007bff;
    color: white;
  `}

  ${props => props.$large && css`
    padding: 12px 24px;
    font-size: 18px;
  `}
`;

// 使用
function App() {
  return (
    <>
      <GlobalStyle />
      <Button $primary>主要按钮</Button>
      <Button $primary $large>大号主要按钮</Button>
    </>
  );
}
```

### 9.2 CSS Houdini与Paint API

Houdini是一组让开发者深入浏览器渲染引擎的API：

```javascript
// 注册自定义paint worklet
CSS.paintWorklet.addModule('paint-worklet.js');
```

```javascript
// paint-worklet.js
registerPaint('custom-border', (ctx, geom, properties) => {
  const { width, height } = geom;
  const color = properties.get('--border-color') || 'blue';
  const thickness = parseInt(properties.get('--border-thickness')) || 2;

  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.strokeRect(0, 0, width, height);
});
```

```css
/* 使用自定义paint */
.element {
  --border-color: #007bff;
  --border-thickness: 3;
  background-image: paint(custom-border);
}
```

### 9.3 CSS容器查询（Container Queries）

容器查询允许基于父容器尺寸而非视口尺寸应用样式：

```css
/* 定义容器 */
.card-container {
  container-type: inline-size;
  container-name: card;
}

/* 基于容器尺寸的样式 */
.card {
  display: flex;
  flex-direction: column;
}

@container card (min-width: 400px) {
  .card {
    flex-direction: row;
  }
}

@container card (min-width: 600px) {
  .card__image { width: 40%; }
  .card__content { width: 60%; }
}
```

### 9.4 CSS scroll-driven animations（滚动驱动动画）

2024-2026年新增的强大动画API：

```css
/* 滚动驱动动画：元素随滚动而运动 */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.scroll-animate {
  animation: fade-in linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 100%;
}

/* 进度条随滚动填充 */
.progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 4px;
  background: var(--primary);
  scale: var(--progress, 0) 1;
  transform-origin: left;
  animation: progress-grow linear both;
  animation-timeline: scroll(root);
}

@keyframes progress-grow {
  from { scale: 0 1; }
  to { scale: 1 1; }
}
```

---

## 十、企业级CSS工程实践

### 10.1 典型CSS目录结构

```
src/
├── styles/
│   ├── globals/
│   │   ├── _reset.css          # CSS Reset/Normalize
│   │   ├── _variables.css      # CSS变量定义
│   │   ├── _typography.css     # 字体排版
│   │   └── _global.css         # 全局样式
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.css
│   │   │   └── Button.test.css
│   │   ├── Card/
│   │   └── Modal/
│   ├── layouts/
│   │   ├── _header.css
│   │   ├── _sidebar.css
│   │   └── _footer.css
│   ├── utilities/
│   │   ├── _spacing.css
│   │   ├── _text.css
│   │   └── _display.css
│   └── main.css                # 入口文件
```

### 10.2 CSS变量命名规范

```css
:root {
  /* 颜色 - 语义化命名 */
  --color-primary: #007bff;
  --color-success: #28a745;
  --color-danger: #dc3545;

  /* 颜色 - 功能命名 */
  --color-text-primary: #333333;
  --color-text-secondary: #666666;
  --color-text-muted: #999999;
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f5f5f5;
  --color-border: #dee2e6;

  /* 间距 */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;

  /* 圆角 */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* 阴影 */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);

  /* 过渡 */
  --transition-fast: 150ms ease;
  --transition-base: 300ms ease;
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
```

### 10.3 防坑指南

```css
/* ❌ 错误1：滥用 !important */
.button { background: blue !important; }
.nav .button { background: red !important; }

/* ✅ 正确：提高选择器特异性 */
.nav .button--primary { background: blue; }

/* ❌ 错误2：magic numbers（魔法数字） */
.modal { top: 123px; padding: 42px; font-size: 15px; }

/* ✅ 正确：使用变量 */
.modal {
  top: calc(var(--header-height) + var(--space-6));
  padding: var(--space-6);
  font-size: var(--font-size-base);
}

/* ❌ 错误3：在组件中重复定义主题相关变量 */
.card {
  --card-bg: white;
  --card-border: #ddd;
  background: var(--card-bg);
}

/* ✅ 正确：组件只使用变量，主题在全局定义 */
:root { --card-bg: white; --card-border: #ddd; }
.card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
}
```

---

## 十一、总结

CSS3是现代Web开发的基石，掌握其核心知识至关重要：

1. **Flexbox**：一维布局的强大工具
2. **CSS Grid**：二维布局的终极解决方案
3. **响应式设计**：适配不同设备的必备技能
4. **CSS动画**：提升用户体验的利器
5. **CSS变量**：现代主题系统的基础
6. **层叠上下文**：理解Z轴堆叠的钥匙
7. **BFC**：解决浮动和边距合并问题的利器

掌握这些知识，为构建现代Web应用打下坚实基础。

---

*参考资料: MDN Web Docs, CSS规范, Chrome DevTools*
*本文档最后更新于 2026年3月*
