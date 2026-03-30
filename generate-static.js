/**
 * HTML书籍静态生成器 - 商业级出版物
 * 专业的技术文档与教学书籍排版系统
 *
 * 特性：
 * - 专业的出版物排版设计
 * - 完整的教学内容解析
 * - 语法高亮与代码讲解
 * - 目录导航与书签
 * - 响应式与打印优化
 */

const fs = require('fs');
const path = require('path');
const markdownIt = require('markdown-it');
const hljs = require('highlight.js/lib/core');

// 注册语言
hljs.registerLanguage('javascript', require('highlight.js/lib/languages/javascript'));
hljs.registerLanguage('typescript', require('highlight.js/lib/languages/typescript'));
hljs.registerLanguage('jsx', require('highlight.js/lib/languages/javascript'));  // JSX uses JavaScript
hljs.registerLanguage('tsx', require('highlight.js/lib/languages/typescript'));  // TSX uses TypeScript
hljs.registerLanguage('react', require('highlight.js/lib/languages/javascript'));  // React is JSX
hljs.registerLanguage('css', require('highlight.js/lib/languages/css'));
hljs.registerLanguage('scss', require('highlight.js/lib/languages/scss'));
hljs.registerLanguage('less', require('highlight.js/lib/languages/less'));
hljs.registerLanguage('json', require('highlight.js/lib/languages/json'));
hljs.registerLanguage('bash', require('highlight.js/lib/languages/bash'));
hljs.registerLanguage('shell', require('highlight.js/lib/languages/bash'));
hljs.registerLanguage('python', require('highlight.js/lib/languages/python'));
hljs.registerLanguage('sql', require('highlight.js/lib/languages/sql'));
hljs.registerLanguage('java', require('highlight.js/lib/languages/java'));
hljs.registerLanguage('go', require('highlight.js/lib/languages/go'));
hljs.registerLanguage('rust', require('highlight.js/lib/languages/rust'));
hljs.registerLanguage('yaml', require('highlight.js/lib/languages/yaml'));
hljs.registerLanguage('markdown', require('highlight.js/lib/languages/markdown'));
hljs.registerLanguage('xml', require('highlight.js/lib/languages/xml'));
hljs.registerLanguage('html', require('highlight.js/lib/languages/xml'));
hljs.registerLanguage('php', require('highlight.js/lib/languages/php'));
hljs.registerLanguage('java', require('highlight.js/lib/languages/java'));
hljs.registerLanguage('c', require('highlight.js/lib/languages/c'));
hljs.registerLanguage('cpp', require('highlight.js/lib/languages/cpp'));
hljs.registerLanguage('csharp', require('highlight.js/lib/languages/csharp'));
hljs.registerLanguage('ruby', require('highlight.js/lib/languages/ruby'));
hljs.registerLanguage('swift', require('highlight.js/lib/languages/swift'));
hljs.registerLanguage('kotlin', require('highlight.js/lib/languages/kotlin'));
hljs.registerLanguage('scala', require('highlight.js/lib/languages/scala'));

// 配置
const CONFIG = {
  booksDir: path.join(__dirname, '书籍'),
  outputDir: path.join(__dirname, 'html-book'),

  // 卷信息配置
  volumes: {
    1: { name: '基础核心', desc: 'HTML、CSS、JavaScript核心基础，构建坚实的技术根基', color: '#1a56db', icon: 'fa-code' },
    2: { name: '框架生态', desc: 'React、Vue、Node.js等主流框架生态，全面掌握现代前端', color: '#7c3aed', icon: 'fa-layer-group' },
    3: { name: '工程实战', desc: '工程化、构建工具、大厂实战经验，提升工程能力', color: '#059669', icon: 'fa-tools' },
    4: { name: '大厂面试专题', desc: '各大厂面试真题与高频考点针对性突破', color: '#dc2626', icon: 'fa-building' },
    5: { name: '项目实战案例', desc: '完整项目实战案例深度解析，展现工程实力', color: '#ea580c', icon: 'fa-project-diagram' },
    6: { name: '面试技巧与总结', desc: '面试技巧、简历优化、软技能全方位准备', color: '#0891b2', icon: 'fa-user-tie' },
    7: { name: '面经汇总', desc: '真实面经汇总与经验分享，少走弯路', color: '#4f46e5', icon: 'fa-comments' }
  }
};

// ==================== HTML模板 ====================

// 首页模板 - 商业级封面设计
const INDEX_TEMPLATE = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>前端面试题库 - 系统化准备前端面试</title>
  <meta name="description" content="7卷完整知识体系，80+章节深度解析，1000+面试考点">

  <!-- 字体 -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700&family=Noto+Sans+SC:wght@300;400;500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.1/css/all.min.css">

  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      --primary: #1a56db;
      --primary-light: #3b82f6;
      --text: #111827;
      --text-light: #4b5563;
      --text-muted: #9ca3af;
      --bg: #f9fafb;
      --bg-card: #ffffff;
      --border: #e5e7eb;
    }

    body {
      font-family: 'Noto Sans SC', -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
    }

    /* 封面区域 */
    .hero {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 3rem;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
      position: relative;
      overflow: hidden;
    }

    .hero::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image:
        radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 40%),
        radial-gradient(circle at 40% 80%, rgba(5, 150, 105, 0.1) 0%, transparent 40%);
    }

    .hero-content {
      position: relative;
      z-index: 1;
      max-width: 800px;
    }

    .logo {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, var(--primary), var(--primary-light));
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      color: white;
      margin: 0 auto 2rem;
      box-shadow: 0 20px 40px rgba(26, 86, 219, 0.3);
    }

    .hero h1 {
      font-family: 'Noto Serif SC', serif;
      font-size: 3rem;
      font-weight: 700;
      color: white;
      margin-bottom: 1rem;
      letter-spacing: 0.05em;
    }

    .hero .subtitle {
      font-size: 1.25rem;
      color: rgba(255,255,255,0.7);
      margin-bottom: 2.5rem;
    }

    .stats {
      display: flex;
      justify-content: center;
      gap: 3rem;
      margin-bottom: 2.5rem;
    }

    .stat {
      text-align: center;
    }

    .stat-value {
      font-family: 'Noto Serif SC', serif;
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--primary-light);
      display: block;
    }

    .stat-label {
      font-size: 0.875rem;
      color: rgba(255,255,255,0.5);
    }

    .cta {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem 2rem;
      background: var(--primary);
      color: white;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 500;
      transition: all 0.3s;
    }

    .cta:hover {
      background: var(--primary-light);
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(26, 86, 219, 0.4);
    }

    /* 内容区域 */
    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 4rem 2rem;
    }

    .section-title {
      font-family: 'Noto Serif SC', serif;
      font-size: 1.75rem;
      font-weight: 600;
      text-align: center;
      margin-bottom: 3rem;
      color: var(--text);
    }

    .volume-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 1.5rem;
    }

    .volume-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 1.75rem;
      transition: all 0.3s;
    }

    .volume-card:hover {
      border-color: var(--primary);
      box-shadow: 0 10px 40px rgba(0,0,0,0.08);
      transform: translateY(-4px);
    }

    .volume-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .volume-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      color: white;
    }

    .volume-title {
      font-size: 1.125rem;
      font-weight: 600;
    }

    .volume-desc {
      color: var(--text-light);
      font-size: 0.9375rem;
      margin-bottom: 1.25rem;
      line-height: 1.6;
    }

    .chapters {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .chapter-link {
      padding: 0.375rem 0.875rem;
      background: var(--bg);
      border-radius: 8px;
      text-decoration: none;
      color: var(--text-light);
      font-size: 0.8125rem;
      transition: all 0.2s;
    }

    .chapter-link:hover {
      background: var(--primary);
      color: white;
    }

    footer {
      text-align: center;
      padding: 3rem;
      background: var(--bg-card);
      border-top: 1px solid var(--border);
      color: var(--text-muted);
    }

    footer a { color: var(--primary); text-decoration: none; }

    @media (max-width: 768px) {
      .hero h1 { font-size: 2rem; }
      .stats { gap: 1.5rem; }
      .stat-value { font-size: 1.75rem; }
      .volume-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <!-- 封面 -->
  <section class="hero">
    <div class="hero-content">
      <div class="logo"><i class="fas fa-graduation-cap"></i></div>
      <h1>前端面试题库</h1>
      <p class="subtitle">系统化准备前端面试 · 7卷完整知识体系 · 80+章节深度解析</p>
      <div class="stats">
        <div class="stat"><span class="stat-value">7</span><span class="stat-label">知识卷册</span></div>
        <div class="stat"><span class="stat-value">80+</span><span class="stat-label">章节内容</span></div>
        <div class="stat"><span class="stat-value">1000+</span><span class="stat-label">面试考点</span></div>
      </div>
      <a href="{{START_URL}}" class="cta"><i class="fas fa-book-open"></i> 开始学习</a>
    </div>
  </section>

  <!-- 卷内容 -->
  <section class="container">
    <h2 class="section-title">知识体系一览</h2>
    <div class="volume-grid">{{VOLUMES}}</div>
  </section>

  <footer>
    <p>持续更新中 · <a href="https://github.com/shyu/prepare-for">GitHub</a></p>
  </footer>
</body>
</html>`;

// 卷卡片
const VOLUME_CARD = `<div class="volume-card">
  <div class="volume-header">
    <div class="volume-icon" style="background: linear-gradient(135deg, {{COLOR}}, {{COLOR_LIGHT}})">
      <i class="fas {{ICON}}"></i>
    </div>
    <div class="volume-title">第{{NUM}}卷 {{NAME}}</div>
  </div>
  <p class="volume-desc">{{DESC}}</p>
  <div class="chapters">{{CHAPTERS}}</div>
</div>`;

// 章节链接
const CHAPTER_LINK = `<a href="{{URL}}" class="chapter-link">第{{NUM}}章 {{NAME}}</a>`;

// ==================== 文章页面模板 ====================

const ARTICLE_TEMPLATE = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}} - 前端面试题库</title>
  <meta name="description" content="{{SUBTITLE}}">

  <!-- 字体 -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700&family=Noto+Sans+SC:wght@300;400;500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">

  <!-- 图标 -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.1/css/all.min.css">

  <!-- 语法高亮 -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/github-dark.min.css">

  <style>
    /* ==================== CSS变量 ==================== */
    :root {
      --primary: #1a56db;
      --primary-light: #3b82f6;
      --primary-dark: #1e40af;
      --accent: #f59e0b;
      --success: #059669;
      --danger: #dc2626;
      --text: #1f2937;
      --text-secondary: #4b5563;
      --text-muted: #9ca3af;
      --bg: #ffffff;
      --bg-secondary: #f9fafb;
      --bg-tertiary: #f3f4f6;
      --border: #e5e7eb;
      --border-light: #f3f4f6;
      --shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.05);
      --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
      --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
      --font-serif: 'Noto Serif SC', serif;
      --font-sans: 'Noto Sans SC', -apple-system, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
      --sidebar-width: 280px;
      --header-height: 60px;
    }

    /* ==================== 重置 ==================== */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; font-size: 18px; }
    body {
      font-family: var(--font-sans);
      color: var(--text);
      background: var(--bg);
      line-height: 1.8;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* ==================== 书籍排版标准 ==================== */
    /* 中文排版规范： */
    /* - 正文字号：18px（最佳阅读尺寸） */
    /* - 行间距：1.8（保证呼吸感） */
    /* - 段落间距：1.5em */
    /* - 每行字数：60-70字符（最佳阅读宽度） */

    /* ==================== 布局 ==================== */
    .layout { display: flex; min-height: 100vh; }

    /* ==================== 侧边栏 ==================== */
    .sidebar {
      position: fixed;
      top: 0;
      left: 0;
      width: var(--sidebar-width);
      height: 100vh;
      background: linear-gradient(180deg, #1f2937 0%, #111827 100%);
      overflow-y: auto;
      z-index: 100;
      display: flex;
      flex-direction: column;
    }

    .sidebar-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      color: white;
    }

    .sidebar-logo-icon {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, var(--primary), var(--primary-light));
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    }

    .sidebar-logo-text {
      font-family: var(--font-serif);
      font-weight: 600;
      font-size: 1rem;
      letter-spacing: 0.02em;
    }

    /* 侧边栏关闭按钮 */
    .sidebar-close {
      width: 28px;
      height: 28px;
      border: none;
      background: rgba(255,255,255,0.1);
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255,255,255,0.6);
      transition: all 0.15s;
    }

    .sidebar-close:hover {
      background: rgba(255,255,255,0.2);
      color: white;
    }

    /* 目录 */
    .toc { flex: 1; padding: 1rem 0; overflow-y: auto; }

    .toc-section { margin-bottom: 0.5rem; }

    .toc-section-title {
      padding: 0.75rem 1.5rem;
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: rgba(255,255,255,0.35);
    }

    .toc-list { list-style: none; }

    .toc-item { margin: 1px 0; }

    .toc-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.5rem;
      color: rgba(255,255,255,0.65);
      text-decoration: none;
      font-size: 0.84375rem;
      transition: all 0.15s;
      border-left: 3px solid transparent;
      position: relative;
    }

    .toc-link::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 0;
      background: var(--primary-light);
      border-radius: 0 2px 2px 0;
      transition: height 0.2s;
    }

    .toc-link:hover {
      background: rgba(255,255,255,0.05);
      color: rgba(255,255,255,0.95);
    }

    .toc-link.active {
      background: rgba(59, 130, 246, 0.12);
      color: var(--primary-light);
      border-left-color: transparent;
    }

    .toc-link.active::before {
      height: 60%;
    }

    .toc-link:hover { background: rgba(255,255,255,0.05); color: white; }
    .toc-link.active { background: rgba(59,130,246,0.15); color: var(--primary-light); border-left-color: var(--primary-light); }

    .toc-num { font-size: 0.75rem; color: rgba(255,255,255,0.4); min-width: 20px; }

    /* 卷分组 */
    .volume-group { margin-bottom: 0.5rem; }

    .volume-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1.5rem;
      color: rgba(255,255,255,0.9);
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
    }

    .volume-title:hover { background: rgba(255,255,255,0.05); }
    .volume-icon { font-size: 0.625rem; color: rgba(255,255,255,0.5); transition: transform 0.2s; }
    .volume-group.collapsed .volume-icon { transform: rotate(-90deg); }
    .volume-group.collapsed .toc-list { display: none; }

    /* ==================== 主内容 ==================== */
    .main { flex: 1; margin-left: var(--sidebar-width); min-width: 0; }

    /* 顶部栏 */
    .topbar {
      position: sticky;
      top: 0;
      height: var(--header-height);
      background: rgba(255,255,255,0.95);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
      z-index: 50;
    }

    .breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--text-muted); }
    .breadcrumb a { color: var(--primary); text-decoration: none; }
    .breadcrumb a:hover { text-decoration: underline; }

    .topbar-actions { display: flex; gap: 0.5rem; }
    .icon-btn {
      width: 40px; height: 40px;
      border: none; background: transparent;
      border-radius: 8px;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: var(--text-muted);
      transition: all 0.15s;
    }
    .icon-btn:hover { background: var(--bg-tertiary); color: var(--primary); }

    /* 文章容器 */
    .article-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 3rem 2rem;
    }

    /* 文章头部 */
    .article-header { margin-bottom: 3rem; padding-bottom: 2rem; border-bottom: 1px solid var(--border-light); position: relative; }
    .article-header::after {
      content: ''; position: absolute; bottom: -1px; left: 0;
      width: 60px; height: 3px; background: linear-gradient(90deg, var(--primary), var(--primary-light));
      border-radius: 3px;
    }

    .article-meta { display: flex; gap: 1.5rem; margin-bottom: 1rem; }
    .meta-item { display: flex; align-items: center; gap: 0.375rem; font-size: 0.8125rem; color: var(--text-muted); }
    .meta-item i { color: var(--primary); }

    .article-title {
      font-family: var(--font-serif);
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--text);
      line-height: 1.25;
      margin-bottom: 0.75rem;
    }

    .article-subtitle { font-size: 1.125rem; color: var(--text-secondary); }

    /* ==================== 内容样式 ==================== */
    .content { color: var(--text-secondary); }

    /* 段落 */
    .content p { margin-bottom: 1.5em; text-align: justify; }

    /* 标题 */
    .content h2 {
      font-family: var(--font-serif);
      font-size: 1.625rem;
      font-weight: 600;
      color: var(--text);
      margin: 2.5em 0 1em;
      padding-bottom: 0.5em;
      border-bottom: 1px solid var(--border-light);
    }

    .content h3 { font-size: 1.25rem; font-weight: 600; color: var(--text); margin: 2em 0 0.75em; }
    .content h4 { font-size: 1.0625rem; font-weight: 600; color: var(--text); margin: 1.5em 0 0.5em; }
    .content h5, .content h6 { font-size: 1rem; font-weight: 600; color: var(--text-muted); margin: 1.25em 0 0.5em; }

    /* 锚点 */
    .content h2 .anchor { opacity: 0; margin-left: 0.5rem; color: var(--text-muted); font-size: 0.875rem; transition: opacity 0.2s; }
    .content h2:hover .anchor { opacity: 1; }

    /* 列表 */
    .content ul, .content ol { margin: 1.25em 0; padding-left: 1.75em; }
    .content li { margin-bottom: 0.5em; }
    .content ul li::marker { color: var(--primary); }

    /* 代码块 - 书籍级排版 */
    .content pre {
      margin: 1.5em 0;
      padding: 1.25em 1.5em;
      background: #1e1e1e;
      border-radius: 12px;
      overflow-x: auto;
      position: relative;
      border: 1px solid rgba(255,255,255,0.1);
    }

    /* 代码块语言标签 */
    .content pre[data-lang]::before {
      content: attr(data-lang);
      position: absolute;
      top: 0;
      right: 0;
      padding: 0.25rem 0.75rem;
      background: rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.6);
      font-size: 0.7rem;
      text-transform: uppercase;
      border-radius: 0 12px 0 8px;
      font-family: var(--font-sans);
    }

    .content code { font-family: var(--font-mono); font-size: 0.875em; line-height: 1.6; }

    .content :not(pre) > code {
      background: rgba(29, 78, 216, 0.08);
      color: var(--primary-dark);
      padding: 0.2em 0.4em;
      border-radius: 4px;
      font-size: 0.9em;
    }

    /* 表格 */
    .content table { width: 100%; margin: 1.5em 0; border-collapse: collapse; border-radius: 12px; overflow: hidden; box-shadow: var(--shadow-sm); }
    .content th { background: linear-gradient(135deg, var(--primary), var(--primary-dark)); color: white; font-weight: 600; text-align: left; padding: 1em 1.25em; font-size: 0.875rem; }
    .content td { padding: 0.875em 1.25em; border-bottom: 1px solid var(--border-light); font-size: 0.9375rem; }
    .content tr:last-child td { border-bottom: none; }
    .content tr:nth-child(even) { background: var(--bg-secondary); }
    .content tr:hover { background: rgba(29, 78, 216, 0.04); }

    /* 引用 */
    .content blockquote {
      margin: 1.5em 0;
      padding: 1.25em 1.5em;
      border-left: 4px solid var(--primary);
      background: linear-gradient(135deg, rgba(29, 78, 216, 0.03), rgba(29, 78, 216, 0.08));
      border-radius: 0 12px 12px 0;
    }

    .content blockquote p { margin-bottom: 0.75em; font-style: italic; }
    .content blockquote p:last-child { margin-bottom: 0; }

    /* 分割线 */
    .content hr { border: none; height: 1px; background: var(--border); margin: 2.5em 0; }

    /* 图片 */
    .content img { max-width: 100%; height: auto; border-radius: 12px; margin: 1.5em 0; }

    /* ==================== 图表容器 ==================== */
    .diagram-container {
      position: relative;
      margin: 1.5em 0;
      padding: 1rem;
      background: var(--bg-secondary);
      border-radius: 12px;
      border: 1px solid var(--border);
      overflow: hidden;
    }

    .diagram-container:hover .diagram-fullscreen {
      opacity: 1;
    }

    .diagram-fullscreen {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 8px;
      background: var(--bg);
      color: var(--text-secondary);
      cursor: pointer;
      opacity: 0;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow-md);
      z-index: 10;
    }

    .diagram-fullscreen:hover {
      background: var(--primary);
      color: white;
    }

    /* Mermaid 图表样式 */
    .mermaid {
      display: flex;
      justify-content: center;
      overflow-x: auto;
      padding: 0.5rem;
    }

    .mermaid svg {
      max-width: 100%;
      height: auto;
    }

    /* PlantUML 图表样式 */
    .plantuml-diagram {
      display: block;
      max-width: 100%;
      height: auto;
      margin: 0 auto;
    }

    /* 图表全屏模式 */
    .diagram-container.fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 9999;
      margin: 0;
      border-radius: 0;
      background: rgba(0, 0, 0, 0.95);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .diagram-container.fullscreen .diagram-fullscreen {
      opacity: 1;
      top: 1.5rem;
      right: 1.5rem;
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }

    .diagram-container.fullscreen .diagram-fullscreen:hover {
      background: var(--primary);
    }

    .diagram-container.fullscreen .mermaid,
    .diagram-container.fullscreen .plantuml-diagram {
      max-width: 90vw;
      max-height: 90vh;
    }

    /* 链接 */
    .content a { color: var(--primary); text-decoration: none; border-bottom: 1px solid transparent; transition: border-color 0.15s; }
    .content a:hover { border-bottom-color: var(--primary); }

    /* ==================== 提示框 ==================== */
    .callout { margin: 1.5em 0; padding: 1.25em 1.5em; border-radius: 12px; border-left: 4px solid; }
    .callout-info { background: rgba(8, 145, 178, 0.08); border-color: #0891b2; }
    .callout-success { background: rgba(5, 150, 105, 0.08); border-color: var(--success); }
    .callout-warning { background: rgba(245, 158, 11, 0.08); border-color: var(--accent); }
    .callout-danger { background: rgba(220, 38, 38, 0.08); border-color: var(--danger); }

    .callout-title { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.9375rem; }
    .callout-info .callout-title { color: #0891b2; }
    .callout-success .callout-title { color: var(--success); }
    .callout-warning .callout-title { color: var(--accent); }
    .callout-danger .callout-title { color: var(--danger); }

    /* ==================== 页脚导航 ==================== */
    .page-footer { margin-top: 4rem; padding-top: 2rem; border-top: 1px solid var(--border); }

    /* 章节导航 */
    .chapter-nav {
      display: flex;
      justify-content: space-between;
      gap: 1.5rem;
    }

    .chapter-nav-link {
      flex: 1;
      max-width: 45%;
      padding: 1.25rem 1.5rem;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      text-decoration: none;
      transition: all 0.25s ease;
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .chapter-nav-link:hover {
      border-color: var(--primary);
      background: linear-gradient(135deg, rgba(26, 86, 219, 0.04), rgba(26, 86, 219, 0.08));
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(26, 86, 219, 0.15);
    }

    .chapter-nav-link.prev {
      align-items: flex-start;
    }

    .chapter-nav-link.next {
      align-items: flex-end;
      text-align: right;
    }

    .chapter-nav-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .chapter-nav-link.prev .chapter-nav-label {
      align-self: flex-start;
    }

    .chapter-nav-link.next .chapter-nav-label {
      align-self: flex-end;
    }

    .chapter-nav-title {
      font-weight: 600;
      color: var(--text);
      font-size: 0.9375rem;
      line-height: 1.4;
    }

    .chapter-nav-empty {
      visibility: hidden;
    }

    @media (max-width: 768px) {
      .chapter-nav {
        flex-direction: column;
      }
      .chapter-nav-link {
        max-width: 100%;
      }
      .chapter-nav-link.next {
        align-items: flex-start;
        text-align: left;
      }
      .chapter-nav-label {
        align-self: flex-start !important;
      }
    }
    .page-nav { display: flex; justify-content: space-between; gap: 1.5rem; }
    .page-nav-link { flex: 1; max-width: 45%; padding: 1.25rem; background: var(--bg); border: 1px solid var(--border); border-radius: 12px; text-decoration: none; transition: all 0.2s; }
    .page-nav-link:hover { border-color: var(--primary); box-shadow: var(--shadow-md); }
    .page-nav-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; color: var(--text-muted); margin-bottom: 0.25rem; }
    .page-nav-title { font-weight: 600; color: var(--text); }

    /* ==================== 侧边栏隐藏功能 ==================== */
    .sidebar.hidden { transform: translateX(-100%); }

    .main.expanded { margin-left: 0; }

    /* 侧边栏切换按钮 - 仅在桌面显示 */
    .sidebar-close { display: flex; }

    /* ==================== 双页浏览模式 (沉浸式书籍效果) ==================== */
    @media (min-width: 1200px) {
      /* 隐藏侧边栏和顶部栏 */
      .layout.dual-page .sidebar { display: none !important; }
      .layout.dual-page .topbar { display: none !important; }

      .layout.dual-page {
        display: block;
        background: #0f0f0f;
        min-height: 100vh;
        padding: 0;
      }

      .layout.dual-page .main {
        margin-left: 0;
        max-width: 100%;
        width: 100%;
        background: #fafafa;
        min-height: 100vh;
        box-shadow: none;
        border-radius: 0;
      }

      /* 沉浸式内容区域 - 完全铺满 */
      .layout.dual-page .article-container {
        max-width: 100%;
        width: 100%;
        padding: 3rem 4rem;
        margin: 0 auto;
      }

      /* 标题样式 - 书籍风格居中 */
      .layout.dual-page .article-header {
        text-align: center;
        max-width: 900px;
        margin: 0 auto 3rem;
        padding-bottom: 2rem;
        border-bottom: 2px solid var(--border);
      }

      .layout.dual-page .article-title {
        font-family: var(--font-serif);
        font-size: 2.5rem;
        font-weight: 700;
        color: #111;
        text-align: center;
        line-height: 1.3;
        margin-bottom: 1rem;
        letter-spacing: 0.02em;
      }

      .layout.dual-page .article-subtitle {
        font-size: 1.25rem;
        color: #666;
      }

      .layout.dual-page .article-meta {
        justify-content: center;
        margin-top: 1rem;
      }

      /* 双页模式的文章内容 - 书籍排版 */
      .layout.dual-page .content {
        max-width: 900px;
        margin: 0 auto;
        column-count: 2;
        column-gap: 4rem;
        column-rule: 1px solid #e0e0e0;
        text-align: justify;
        font-size: 1rem;
        line-height: 1.85;
      }

      /* 标题跨列显示 */
      .layout.dual-page .content h2,
      .layout.dual-page .content h3 {
        column-span: all;
        break-after: avoid;
        margin-top: 2rem;
      }

      /* 代码块不中断 */
      .layout.dual-page .content pre {
        break-inside: avoid;
        margin: 1.5em 0;
        font-size: 0.875rem;
      }

      /* 表格不中断 */
      .layout.dual-page .content table {
        break-inside: avoid;
        font-size: 0.875rem;
      }

      /* 引用块不中断 */
      .layout.dual-page .content blockquote {
        break-inside: avoid;
      }

      /* 书籍式页脚 */
      .layout.dual-page .page-footer {
        max-width: 900px;
        margin: 4rem auto 0;
        padding-top: 2rem;
        border-top: 1px solid var(--border);
        text-align: center;
      }

      /* 退出按钮 - 固定在右上角 */
      .layout.dual-page ~ .view-toggle {
        position: fixed;
        top: 1.5rem;
        right: 1.5rem;
        z-index: 1000;
        background: #fff;
        border: 1px solid #ddd;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .layout.dual-page ~ .view-toggle:hover {
        background: #f5f5f5;
      }
    }

    /* 超宽屏幕 - 三栏布局预览 */
    @media (min-width: 1800px) {
      .layout.dual-page .content {
        column-count: 2;
        max-width: 1400px;
        column-gap: 5rem;
        font-size: 1.0625rem;
      }

      .layout.dual-page .article-title {
        font-size: 3rem;
      }
    }

    /* 双页切换按钮 */
    .view-toggle {
      display: none;
      position: fixed;
      top: 80px;
      right: 24px;
      padding: 0.5rem 1rem;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.8125rem;
      color: var(--text-secondary);
      z-index: 60;
      align-items: center;
      gap: 0.375rem;
      transition: all 0.2s;
    }

    .view-toggle:hover {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }

    @media (min-width: 1200px) {
      .view-toggle { display: flex; }
    }

    /* ==================== 响应式 ==================== */
    @media (max-width: 1024px) {
      .sidebar { transform: translateX(-100%); }
      .sidebar.open { transform: translateX(0); }
      .main { margin-left: 0; }
      .sidebar-close { display: none; }  /* 移动端不显示关闭按钮，用遮罩层关闭 */
    }

    @media (max-width: 768px) {
      .article-container { padding: 2rem 1rem; }
      .article-title { font-size: 1.875rem; }
      .page-nav { flex-direction: column; }
      .page-nav-link { max-width: 100%; }
    }

    /* 打印 */
    @media print {
      .sidebar, .topbar, .chapter-nav, .diagram-fullscreen { display: none !important; }
      .main { margin-left: 0 !important; max-width: 100% !important; }
      .article-container { padding: 0 !important; }
      .content { font-size: 12pt !important; line-height: 1.6 !important; }
      .content h2 { page-break-after: avoid; }
      .content h3, .content h4 { page-break-after: avoid; }
      .content pre, .content blockquote { page-break-inside: avoid; }
      .content img { max-width: 100% !important; page-break-inside: avoid; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }

    /* ==================== 打印优化 ==================== */
    @page { margin: 2cm; }

    /* ==================== 学习目标框 ==================== */
    .learning-objectives {
      margin: 2em 0;
      padding: 1.5em;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.05));
      border: 1px solid rgba(99, 102, 241, 0.2);
      border-radius: 12px;
    }

    .learning-objectives-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: #6366f1;
      margin-bottom: 1rem;
      font-size: 1rem;
    }

    .learning-objectives ul {
      margin: 0;
      padding-left: 1.25rem;
    }

    .learning-objectives li {
      margin-bottom: 0.5rem;
      color: var(--text-secondary);
    }

    /* ==================== 关键点高亮 ==================== */
    .key-point {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.2em 0.6em;
      background: rgba(245, 158, 11, 0.1);
      color: #d97706;
      border-radius: 4px;
      font-size: 0.85em;
      font-weight: 500;
    }

    /* ==================== 概念卡 ==================== */
    .concept-card {
      margin: 1.5em 0;
      padding: 1.25em 1.5em;
      background: var(--bg-secondary);
      border-radius: 12px;
      border: 1px solid var(--border);
    }

    .concept-card-title {
      font-weight: 600;
      color: var(--text);
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .concept-card-title::before {
      content: '💡';
    }

    /* ==================== 流程图样式 ==================== */
    .flowchart-step {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin: 1rem 0;
      padding: 1rem;
      background: var(--bg-secondary);
      border-radius: 8px;
      border-left: 3px solid var(--primary);
    }

    .flowchart-step-number {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--primary);
      color: white;
      border-radius: 50%;
      font-weight: 600;
      font-size: 0.875rem;
      flex-shrink: 0;
    }

    .flowchart-step-content {
      flex: 1;
    }

    .flowchart-step-title {
      font-weight: 600;
      color: var(--text);
      margin-bottom: 0.25rem;
    }

    .flowchart-step-desc {
      font-size: 0.9em;
      color: var(--text-secondary);
    }

    /* ==================== 代码行号 ==================== */
    .hljs { counter-reset: line; }
    .hljs .line { display: block; }
    .hljs .line::before {
      counter-increment: line;
      content: counter(line);
      display: inline-block;
      width: 2.5em;
      margin-right: 1em;
      text-align: right;
      color: #6b7280;
      opacity: 0.5;
    }

    /* ==================== 进度指示器 ==================== */
    .progress-indicator {
      display: flex;
      gap: 0.5rem;
      margin: 1rem 0;
    }

    .progress-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--border);
    }

    .progress-dot.active {
      background: var(--primary);
      transform: scale(1.25);
    }

    .progress-dot.completed {
      background: var(--success);
    }

    /* ==================== 标签 ==================== */
    .tag {
      display: inline-block;
      padding: 0.25em 0.75em;
      background: rgba(29, 78, 216, 0.08);
      color: var(--primary);
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
      margin-right: 0.5rem;
    }

    .tag-outline {
      background: transparent;
      border: 1px solid var(--primary);
    }

    /* 滚动条 */
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }

    /* 移动菜单按钮 */
    .menu-btn { display: none; position: fixed; bottom: 24px; right: 24px; width: 56px; height: 56px; background: var(--primary); border: none; border-radius: 50%; box-shadow: var(--shadow-lg); cursor: pointer; z-index: 200; align-items: center; justify-content: center; color: white; font-size: 1.25rem; }
    @media (max-width: 1024px) { .menu-btn { display: flex; } }

    /* 遮罩 */
    .overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 99; }
    @media (max-width: 1024px) { .overlay.visible { display: block; } }
  </style>
</head>
<body>
  <!-- 移动菜单按钮 -->
  <button class="menu-btn" onclick="toggleSidebar()"><i class="fas fa-bars"></i></button>

  <!-- 双页浏览切换按钮 -->
  <button class="view-toggle" onclick="toggleDualPage()" title="双页浏览模式">
    <i class="fas fa-book-open"></i>
    <span>双页浏览</span>
  </button>

  <div class="overlay" onclick="toggleSidebar()"></div>

  <div class="layout" id="mainLayout">
    <!-- 侧边栏 -->
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <a href="index.html" class="sidebar-logo">
          <div class="sidebar-logo-icon"><i class="fas fa-graduation-cap"></i></div>
          <span class="sidebar-logo-text">前端面试题库</span>
        </a>
        <button class="sidebar-close" onclick="toggleSidebar()" title="关闭侧边栏">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <nav class="toc">{{TOC}}</nav>
    </aside>

    <!-- 主内容 -->
    <div class="main">
      <!-- 顶部栏 -->
      <header class="topbar">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <button class="icon-btn" onclick="toggleSidebar()" title="目录">
            <i class="fas fa-bars"></i>
          </button>
          <nav class="breadcrumb">
            <a href="index.html">首页</a>
            <span>/</span>
          <span>{{BREADCRUMB}}</span>
        </nav>
        <div class="topbar-actions">
          <button class="icon-btn" onclick="window.print()" title="打印"><i class="fas fa-print"></i></button>
        </div>
      </header>

      <!-- 文章 -->
      <main class="article-container">
        <article>
          <header class="article-header">
            <div class="article-meta">
              <span class="meta-item"><i class="fas fa-book"></i> {{VOLUME}}</span>
            </div>
            <h1 class="article-title">{{TITLE}}</h1>
          </header>

          <div class="content">{{CONTENT}}</div>

          <footer class="page-footer">
            <nav class="chapter-nav">
              {{PREV_LINK}}
              {{NEXT_LINK}}
            </nav>
          </footer>
        </article>
      </main>
    </div>
  </div>

  <!-- 语法高亮 -->
  <script src="https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/lib/highlight.min.js"></script>
  <script>hljs.highlightAll();</script>

  <!-- Mermaid 图表支持 -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"></script>
  <script>
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
      flowchart: {
        curve: 'basis',
        padding: 15
      },
      sequence: {
        actorMargin: 50,
        boxMargin: 10,
        boxTextMargin: 5,
        noteMargin: 10,
        messageMargin: 35
      }
    });
  </script>

  <script>
    function toggleSidebar() {
      const sidebar = document.getElementById('sidebar');
      const overlay = document.querySelector('.overlay');
      const isMobile = window.innerWidth <= 1024;

      if (isMobile) {
        // 移动端使用遮罩层
        sidebar.classList.toggle('open');
        overlay.classList.toggle('visible');
      } else {
        // 桌面端切换隐藏/显示
        sidebar.classList.toggle('hidden');
        // 保存状态到 localStorage
        const isHidden = sidebar.classList.contains('hidden');
        localStorage.setItem('sidebarHidden', isHidden);
      }
    }

    // 图表全屏切换
    function toggleDiagramFullscreen(btn) {
      const container = btn.closest('.diagram-container');
      container.classList.toggle('fullscreen');

      // 按 ESC 退出全屏
      if (container.classList.contains('fullscreen')) {
        document.addEventListener('keydown', handleDiagramEsc);
      } else {
        document.removeEventListener('keydown', handleDiagramEsc);
      }
    }

    function handleDiagramEsc(e) {
      if (e.key === 'Escape') {
        const fullscreenContainer = document.querySelector('.diagram-container.fullscreen');
        if (fullscreenContainer) {
          fullscreenContainer.classList.remove('fullscreen');
          document.removeEventListener('keydown', handleDiagramEsc);
        }
      }
    }

    // 双页浏览模式切换
    function toggleDualPage() {
      const layout = document.getElementById('mainLayout');
      const btn = document.querySelector('.view-toggle');
      layout.classList.toggle('dual-page');

      const isDualPage = layout.classList.contains('dual-page');
      btn.innerHTML = isDualPage
        ? '<i class="fas fa-columns"></i><span>单页浏览</span>'
        : '<i class="fas fa-book-open"></i><span>双页浏览</span>';

      localStorage.setItem('dualPageMode', isDualPage);
    }

    // 页面加载时恢复侧边栏状态
    document.addEventListener('DOMContentLoaded', () => {
      const sidebar = document.getElementById('sidebar');
      const layout = document.getElementById('mainLayout');
      const isMobile = window.innerWidth > 1024;

      if (isMobile) {
        const savedState = localStorage.getItem('sidebarHidden');
        if (savedState === 'true') {
          sidebar.classList.add('hidden');
        }
      }

      // 恢复双页浏览模式
      const savedDualPage = localStorage.getItem('dualPageMode');
      if (savedDualPage === 'true') {
        layout.classList.add('dual-page');
        const btn = document.querySelector('.view-toggle');
        if (btn) {
          btn.innerHTML = '<i class="fas fa-columns"></i><span>单页浏览</span>';
        }
      }
    });

    // 卷展开/折叠
    document.querySelectorAll('.volume-title').forEach(el => {
      el.addEventListener('click', () => el.parentElement.classList.toggle('collapsed'));
    });

    // 滚动监听更新目录激活状态
    const headings = document.querySelectorAll('.content h2[id], .content h3[id]');
    const tocLinks = document.querySelectorAll('.toc-link');

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          tocLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + id) link.classList.add('active');
          });
        }
      });
    }, { rootMargin: '-80px 0px -70%' });

    headings.forEach(h => observer.observe(h));

    // 点击目录跳转
    tocLinks.forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const id = link.getAttribute('href').substring(1);
        const target = document.getElementById(id);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
          // 移动端点击后关闭侧边栏
          if (window.innerWidth <= 1024) toggleSidebar();
        }
      });
    });
  </script>
</body>
</html>`;

// ==================== 工具函数 ====================

function init() {
  console.log('📚 正在生成商业级HTML书籍...\n');
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }
}

function getVolumes() {
  const volumes = [];
  fs.readdirSync(CONFIG.booksDir).forEach(item => {
    const match = item.match(/^第(\d+)卷-(.+)$/);
    if (match) {
      volumes.push({ num: parseInt(match[1]), name: match[2], path: path.join(CONFIG.booksDir, item) });
    }
  });
  return volumes.sort((a, b) => a.num - b.num);
}

function getChapters(volumePath) {
  const chapters = [];
  if (!fs.existsSync(volumePath)) return chapters;
  fs.readdirSync(volumePath).forEach(item => {
    const match = item.match(/^第(\d+)章-(.+)$/);
    if (match) {
      chapters.push({ num: parseInt(match[1]), name: match[2], path: path.join(volumePath, item) });
    }
  });
  return chapters.sort((a, b) => a.num - b.num);
}

function readMarkdown(filePath) {
  try { return fs.readFileSync(filePath, 'utf-8'); }
  catch (e) { console.error(`❌ 读取失败: ${filePath}`); return ''; }
}

function createMarkdownIt() {
  const md = new markdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight: (str, lang) => {
      if (lang && hljs.getLanguage(lang)) {
        try { return '<pre class="hljs"><code>' + hljs.highlight(str, { language: lang, ignoreIllegals: true }).value + '</code></pre>'; }
        catch { }
      }
      return '<pre class="hljs"><code>' + escapeHtml(str) + '</code></pre>';
    }
  });

  // 自定义 Mermaid 图表渲染
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const lang = token.info.trim().toLowerCase();
    const code = token.content;

    // Mermaid 图表
    if (lang === 'mermaid') {
      return `<div class="diagram-container">
        <pre class="mermaid">${code.trim()}</pre>
        <button class="diagram-fullscreen" onclick="toggleDiagramFullscreen(this)">
          <i class="fas fa-expand"></i>
        </button>
      </div>`;
    }

    // PlantUML 图表 - 使用本地 Docker 服务渲染
    if (lang === 'plantuml') {
      const encoded = encodePlantUML(code.trim());
      // 使用本地 PlantUML 服务 (Docker 端口 33629)
      const localSvgUrl = `http://localhost:33629/svg/${encoded}`;
      // 回退到在线服务
      const onlineSvgUrl = `https://www.plantuml.com/plantuml/svg/~1${encoded}`;

      return `<div class="diagram-container">
        <img src="${localSvgUrl}" alt="PlantUML Diagram" class="plantuml-diagram" onerror="this.onerror=null;this.src='${onlineSvgUrl}'">
        <button class="diagram-fullscreen" onclick="toggleDiagramFullscreen(this)">
          <i class="fas fa-expand"></i>
        </button>
      </div>`;
    }

    // 使用默认的高亮渲染
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' + hljs.highlight(code, { language: lang, ignoreIllegals: true }).value + '</code></pre>';
      } catch {}
    }
    return '<pre class="hljs"><code>' + escapeHtml(code) + '</code></pre>';
  };

  return md;
}

// PlantUML 编码函数 (标准 Base64 URL-safe 编码)
function encodePlantUML(uml) {
  // PlantUML 使用标准方式编码：将 UTF-8 编码后转为 Base64，然后做 URL 安全替换
  return Buffer.from(uml, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// 简单哈希函数
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// 预渲染 PlantUML 为本地 SVG
const http = require('http');
const https = require('https');

async function renderPlantUmlSvg(uml, svgPath) {
  const encoded = encodePlantUML(uml);
  const url = `https://www.plantuml.com/plantuml/svg/~1${encoded}`;

  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const req = protocol.get(url, (res) => {
      if (res.statusCode !== 200) {
        console.warn(`⚠️ PlantUML 渲染失败 (${res.statusCode})`);
        resolve();
        return;
      }

      // 确保目录存在
      const fs = require('fs');
      const dir = require('path').dirname(svgPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const file = fs.createWriteStream(svgPath);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    });

    req.on('error', (err) => {
      console.warn(`⚠️ PlantUML 渲染错误: ${err.message}`);
      resolve();
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve();
    });
  });
}

// 收集需要渲染的 PlantUML 图表
const plantUmlDiagrams = [];

function addPlantUmlDiagram(uml, svgPath) {
  plantUmlDiagrams.push({ uml, svgPath });
}

// 批量渲染所有 PlantUML 图表
async function renderAllPlantUmlDiagrams() {
  if (plantUmlDiagrams.length === 0) return;

  console.log(`\n🎨 开始渲染 PlantUML 图表 (${plantUmlDiagrams.length} 个)...`);

  // 确保 diagrams 目录存在
  const fs = require('fs');
  const path = require('path');
  const diagramsDir = path.join(__dirname, 'html-book', 'diagrams');
  if (!fs.existsSync(diagramsDir)) {
    fs.mkdirSync(diagramsDir, { recursive: true });
  }

  // 渲染每个图表
  for (const diagram of plantUmlDiagrams) {
    await renderPlantUmlSvg(diagram.uml, diagram.svgPath);
  }

  console.log(`✅ PlantUML 图表渲染完成!\n`);
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function slugify(s) {
  // 保留数字和点，替换空格和特殊字符为连字符
  return s.trim()
    .toLowerCase()
    .replace(/[^\w\s.-]/g, '')  // 保留字母数字空格点和连字符
    .replace(/[\s_]+/g, '-')    // 空格和下划线转为连字符
    .replace(/\.{2,}/g, '-')    // 多个点转为单个连字符
    .replace(/^-+|-+$/g, '');   // 去除首尾连字符
}

// ==================== 生成函数 ====================

function generateIndex(volumes) {
  const volumesHtml = volumes.map(volume => {
    const chapters = getChapters(volume.path);
    const config = CONFIG.volumes[volume.num] || CONFIG.volumes[1];

    let chaptersHtml = '';
    chapters.forEach(chapter => {
      const files = fs.readdirSync(chapter.path).filter(f => f.endsWith('.md')).sort();
      const mainFile = files.find(f => f.includes('项目介绍') || f.includes('核心') || f.includes('面试')) || files[0];
      if (mainFile) {
        const fileBaseName = mainFile.replace('.md', '');
        // 始终使用完整文件名格式
        const url = `${volume.num}-${chapter.num}-${fileBaseName}.html`;
        chaptersHtml += CHAPTER_LINK
          .replace('{{URL}}', url)
          .replace('{{NUM}}', chapter.num)
          .replace('{{NAME}}', chapter.name);
      }
    });

    return VOLUME_CARD
      .replace('{{NUM}}', volume.num)
      .replace('{{NAME}}', volume.name)
      .replace('{{DESC}}', config.desc)
      .replace('{{COLOR}}', config.color)
      .replace('{{COLOR_LIGHT}}', config.color + '99')
      .replace('{{ICON}}', config.icon)
      .replace('{{CHAPTERS}}', chaptersHtml);
  }).join('');

  // 计算开始学习的链接（第一卷第一章的主文件）
  const firstVolume = volumes[0];
  const firstChapters = getChapters(firstVolume.path);
  const firstChapter = firstChapters[0];
  const firstChapterFiles = fs.readdirSync(firstChapter.path).filter(f => f.endsWith('.md')).sort();
  const firstMainFile = firstChapterFiles.find(f => f.includes('项目介绍') || f.includes('核心') || f.includes('面试')) || firstChapterFiles[0];
  const firstMainFileBaseName = firstMainFile.replace('.md', '');
  const startUrl = `${firstVolume.num}-${firstChapter.num}-${firstMainFileBaseName}.html`;

  return INDEX_TEMPLATE.replace('{{VOLUMES}}', volumesHtml).replace('{{START_URL}}', startUrl);
}

function generateToc(volumes) {
  let html = '';
  volumes.forEach(volume => {
    const chapters = getChapters(volume.path);
    const config = CONFIG.volumes[volume.num] || CONFIG.volumes[1];
    const isCollapsed = volume.num > 2;

    html += `<div class="volume-group ${isCollapsed ? 'collapsed' : ''}">`;
    html += `<div class="volume-title"><i class="fas fa-chevron-down volume-icon"></i><span>第${volume.num}卷 ${volume.name}</span></div>`;
    html += `<ul class="toc-list">`;

    chapters.forEach(chapter => {
      const files = fs.readdirSync(chapter.path).filter(f => f.endsWith('.md'));
      const mainFile = files.find(f => f.includes('项目介绍') || f.includes('核心') || f.includes('面试'));
      if (mainFile) {
        const fileBaseName = mainFile.replace('.md', '');
        const url = `${volume.num}-${chapter.num}-${fileBaseName}.html`;
        html += `<li class="toc-item">`;
        html += `<a href="${url}" class="toc-link">`;
        html += `<span class="toc-num">${chapter.num}</span><span>${chapter.name}</span>`;
        html += `</a></li>`;
      }
    });

    html += `</ul></div>`;
  });
  return html;
}

function extractTitle(md) {
  const match = md.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : '未命名';
}

function extractHeadings(md) {
  const items = [];
  const regex = /^(#{2,3})\s+(.+)$/gm;
  let match;
  while ((match = regex.exec(md)) !== null && items.length < 10) {
    items.push({ level: match[1].length, text: match[2].trim() });
  }
  return items;
}

function generateArticleToc(items) {
  if (items.length === 0) return '<ul class="toc-list"></ul>';
  let html = '<ul class="toc-list">';
  items.forEach(item => {
    const slug = slugify(item.text);
    html += `<li class="toc-item">`;
    html += `<a href="#${slug}" class="toc-link ${item.level === 3 ? '' : ''}">`;
    html += `<span>${item.text}</span>`;
    html += `</a></li>`;
  });
  html += '</ul>';
  return html;
}

// ==================== 主函数 ====================

async function generateAll() {
  const volumes = getVolumes();
  const md = createMarkdownIt();

  // 生成首页
  const indexHtml = generateIndex(volumes);
  fs.writeFileSync(path.join(CONFIG.outputDir, 'index.html'), indexHtml);
  console.log('✅ 首页已生成: index.html\n');

  // 生成各章节
  volumes.forEach(volume => {
    const chapters = getChapters(volume.path);
    const config = CONFIG.volumes[volume.num] || CONFIG.volumes[1];

    // 构建所有章节的扁平列表（用于上下章导航）
    const allChapters = [];
    const allVolumes = getVolumes();
    allVolumes.forEach(v => {
      const volChapters = getChapters(v.path);
      volChapters.forEach(c => {
        // 计算主文件名
        const chapterFiles = fs.readdirSync(c.path).filter(f => f.endsWith('.md')).sort();
        const mainFile = chapterFiles.find(f => f.includes('项目介绍') || f.includes('核心') || f.includes('面试')) || chapterFiles[0];
        const mainFileBaseName = mainFile ? mainFile.replace('.md', '') : '';
        allChapters.push({
          volume: v,
          chapter: c,
          mainFileBaseName
        });
      });
    });

    chapters.forEach((chapter, chapterIndex) => {
      const files = fs.readdirSync(chapter.path).filter(f => f.endsWith('.md')).sort();

      // 为每个 markdown 文件生成一个 HTML
      files.forEach((file, fileIndex) => {
        // 计算当前章节在全局列表中的位置（基于章节而非文件）
        const currentGlobalIndex = allChapters.findIndex(
          c => c.volume.num === volume.num && c.chapter.num === chapter.num
        );

        // 计算上一章和下一章（基于章节）
        let prevLink = '';
        let nextLink = '';

        if (currentGlobalIndex > 0) {
          const prev = allChapters[currentGlobalIndex - 1];
          const prevUrl = `${prev.volume.num}-${prev.chapter.num}-${prev.mainFileBaseName}.html`;
          prevLink = `<a href="${prevUrl}" class="chapter-nav-link prev">
            <span class="chapter-nav-label"><i class="fas fa-arrow-left"></i> 上一章</span>
            <span class="chapter-nav-title">第${prev.volume.num}卷 ${prev.chapter.name}</span>
          </a>`;
        }

        if (currentGlobalIndex < allChapters.length - 1) {
          const next = allChapters[currentGlobalIndex + 1];
          const nextUrl = `${next.volume.num}-${next.chapter.num}-${next.mainFileBaseName}.html`;
          nextLink = `<a href="${nextUrl}" class="chapter-nav-link next">
            <span class="chapter-nav-label">下一章 <i class="fas fa-arrow-right"></i></span>
            <span class="chapter-nav-title">第${next.volume.num}卷 ${next.chapter.name}</span>
          </a>`;
        }

        // 使用文件名作为输出文件名的一部分（去掉 .md 后缀）
        const fileBaseName = file.replace('.md', '');
        const outputFileName = `${volume.num}-${chapter.num}-${fileBaseName}.html`;

        const mdContent = readMarkdown(path.join(chapter.path, file));

        // 渲染markdown
        let htmlContent = md.render(mdContent);

        // 手动为标题添加ID（markdown-it默认不添加ID）
        htmlContent = htmlContent
          .replace(/<h2>([^<]+)<\/h2>/g, (match, title) => {
            const id = slugify(title);
            return `<h2 id="${id}">${title}</h2>`;
          })
          .replace(/<h3>([^<]+)<\/h3>/g, (match, title) => {
            const id = slugify(title);
            return `<h3 id="${id}">${title}</h3>`;
          })
          .replace(/<h4>([^<]+)<\/h4>/g, (match, title) => {
            const id = slugify(title);
            return `<h4 id="${id}">${title}</h4>`;
          });

        // 移除内容中的第一个h1标题（因为已经显示在页面顶部了）
        htmlContent = htmlContent.replace(/^<h1>[^<]+<\/h1>\n?/gm, '');

        const title = extractTitle(mdContent);
        const headings = extractHeadings(mdContent);
        const articleToc = generateArticleToc(headings);

        const finalHtml = ARTICLE_TEMPLATE
          .replace(/\{\{TITLE\}\}/g, title)
          .replace(/\{\{BREADCRUMB\}\}/g, `第${volume.num}卷 ${volume.name} / 第${chapter.num}章 ${chapter.name}`)
          .replace(/\{\{VOLUME\}\}/g, `第${volume.num}卷 ${volume.name}`)
          .replace(/\{\{TOC\}\}/g, articleToc)
          .replace(/\{\{CONTENT\}\}/g, htmlContent)
          .replace('{{PREV_LINK}}', prevLink)
          .replace('{{NEXT_LINK}}', nextLink);

        const outputFile = path.join(CONFIG.outputDir, outputFileName);
        fs.writeFileSync(outputFile, finalHtml);
        console.log(`✅ 已生成: 第${volume.num}卷 第${chapter.num}章 - ${fileBaseName}`);
      });
    });
  });

  console.log('\n🎉 HTML书籍生成完成!');
  console.log(`📁 输出目录: ${CONFIG.outputDir}`);

  // 渲染所有 PlantUML 图表
  await renderAllPlantUmlDiagrams();
}

// 运行
init();
generateAll();
