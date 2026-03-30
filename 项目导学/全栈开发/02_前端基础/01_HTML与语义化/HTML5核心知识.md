# HTML5核心知识

## 一、概述

HTML5是HTML的第五个重大版本，于2014年正式发布，2026年已成为Web开发的**标准基础**。它不仅增加了新的语义化标签，还引入了强大的Web API，使Web应用具备接近原生应用的能力。

**核心演进方向**：
- **语义化**：用标签表达内容含义，而非仅表示样式
- **功能性**：原生支持多媒体、图形、存储等复杂功能
- **标准化**：统一API规范，减少浏览器兼容性问题

---

## 二、核心概念

### 2.1 语义化标签

语义化标签让代码更易读、更易维护，同时提升SEO和无障碍访问。

| 标签 | 说明 | 使用场景 |
|------|------|----------|
| `<header>` | 页眉或导航栏 | 页面顶部或章节头部 |
| `<nav>` | 导航链接 | 网站导航菜单 |
| `<main>` | 主要内容 | 页面唯一主要内容 |
| `<article>` | 独立内容 | 博客文章、新闻 |
| `<section>` | 内容分区 | 文档中的逻辑分区 |
| `<aside>` | 侧边栏 | 与主要内容相关但可独立的内容 |
| `<footer>` | 页脚 | 页面底部或章节尾部 |
| `<figure>` | 自包含内容 | 图片、代码、图表 |
| `<figcaption>` | 图表标题 | 配合figure使用 |

### 2.2 表单增强

HTML5新增了多种输入类型和验证功能。

| 输入类型 | 说明 | 浏览器验证 |
|----------|------|------------|
| `email` | 邮箱地址 | ✅ 自动验证格式 |
| `url` | URL地址 | ✅ 自动验证格式 |
| `number` | 数字 | ✅ 限制数字输入 |
| `range` | 滑块 | ✅ 限制范围 |
| `date` | 日期选择器 | ✅ 日期格式 |
| `time` | 时间选择器 | ✅ 时间格式 |
| `color` | 颜色选择器 | ✅ 颜色格式 |
| `tel` | 电话号码 | ❌ 无自动验证 |
| `search` | 搜索框 | ❌ 无自动验证 |

### 2.3 多媒体支持

HTML5原生支持音频和视频，无需Flash插件。

```html
<!-- 音频播放器 -->
<audio controls>
  <source src="audio.mp3" type="audio/mpeg">
  <source src="audio.ogg" type="audio/ogg">
  您的浏览器不支持audio元素。
</audio>

<!-- 视频播放器 -->
<video width="640" height="360" controls poster="poster.jpg">
  <source src="video.mp4" type="video/mp4">
  <source src="video.webm" type="video/webm">
  您的浏览器不支持video元素。
</video>
```

### 2.4 Web Storage

本地存储方案，替代Cookie。

| 存储方式 | 容量 | 生命周期 | 作用域 |
|----------|------|----------|--------|
| `localStorage` | ~5MB | 永久保存 | 同源 |
| `sessionStorage` | ~5MB | 浏览器关闭 | 同源 |
| `Cookie` | ~4KB | 可设置过期 | 可设置域 |

---

## 三、代码示例

### 3.1 语义化页面结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>语义化HTML5页面</title>
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
    
    /* 语义化样式 */
    header, nav, main, aside, footer {
      display: block;
      padding: 20px;
    }
    
    header {
      background: #2c3e50;
      color: white;
    }
    
    nav {
      background: #34495e;
    }
    
    nav ul {
      list-style: none;
      display: flex;
      gap: 20px;
    }
    
    nav a {
      color: white;
      text-decoration: none;
    }
    
    main {
      display: flex;
      gap: 20px;
      padding: 20px;
    }
    
    .content {
      flex: 1;
      background: white;
      padding: 20px;
      border-radius: 8px;
    }
    
    aside {
      width: 300px;
      background: #ecf0f1;
      padding: 20px;
      border-radius: 8px;
    }
    
    footer {
      background: #2c3e50;
      color: white;
      text-align: center;
      padding: 20px;
    }
    
    article {
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #ddd;
    }
    
    article h2 {
      margin-bottom: 10px;
      color: #2c3e50;
    }
  </style>
</head>
<body>
  <!-- 页眉 -->
  <header>
    <h1>我的网站</h1>
    <p>网站描述</p>
  </header>
  
  <!-- 导航 -->
  <nav>
    <ul>
      <li><a href="#home">首页</a></li>
      <li><a href="#articles">文章</a></li>
      <li><a href="#about">关于</a></li>
      <li><a href="#contact">联系</a></li>
    </ul>
  </nav>
  
  <!-- 主要内容 -->
  <main>
    <!-- 主内容区 -->
    <article class="content">
      <h2>文章标题</h2>
      <p>这是文章内容...</p>
    </article>
    
    <!-- 侧边栏 -->
    <aside>
      <h3>侧边栏</h3>
      <p>相关链接或广告</p>
    </aside>
  </main>
  
  <!-- 页脚 -->
  <footer>
    <p>&copy; 2026 我的网站. 保留所有权利。</p>
  </footer>
</body>
</html>
```

### 3.2 增强表单

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HTML5增强表单</title>
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
    
    .form-container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .form-group {
      margin-bottom: 24px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #333;
    }
    
    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 16px;
      transition: border-color 0.3s ease;
    }
    
    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #3498db;
    }
    
    .form-group input:invalid {
      border-color: #e74c3c;
    }
    
    .form-group input:valid {
      border-color: #2ecc71;
    }
    
    .form-group small {
      display: block;
      margin-top: 6px;
      color: #666;
      font-size: 14px;
    }
    
    button {
      width: 100%;
      padding: 14px;
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
    
    button:disabled {
      background: #bdc3c7;
      cursor: not-allowed;
    }
  </style>
</head>
<body>
  <div class="form-container">
    <h2>用户注册表单</h2>
    <form id="registrationForm">
      <!-- 用户名 -->
      <div class="form-group">
        <label for="username">用户名</label>
        <input 
          type="text" 
          id="username" 
          name="username" 
          required 
          minlength="3" 
          maxlength="20"
          placeholder="3-20个字符"
        >
        <small>用户名必须为3-20个字符</small>
      </div>
      
      <!-- 邮箱 -->
      <div class="form-group">
        <label for="email">邮箱</label>
        <input 
          type="email" 
          id="email" 
          name="email" 
          required 
          placeholder="example@example.com"
        >
        <small>请输入有效的邮箱地址</small>
      </div>
      
      <!-- 网址 -->
      <div class="form-group">
        <label for="website">个人网站</label>
        <input 
          type="url" 
          id="website" 
          name="website" 
          placeholder="https://example.com"
        >
        <small>请输入有效的URL地址</small>
      </div>
      
      <!-- 年龄 -->
      <div class="form-group">
        <label for="age">年龄</label>
        <input 
          type="number" 
          id="age" 
          name="age" 
          min="18" 
          max="100" 
          value="25"
        >
        <small>年龄必须在18-100之间</small>
      </div>
      
      <!-- 生日 -->
      <div class="form-group">
        <label for="birthday">生日</label>
        <input 
          type="date" 
          id="birthday" 
          name="birthday"
        >
      </div>
      
      <!-- 时间 -->
      <div class="form-group">
        <label for="appointment">预约时间</label>
        <input 
          type="time" 
          id="appointment" 
          name="appointment"
        >
      </div>
      
      <!-- 颜色 -->
      <div class="form-group">
        <label for="color">喜欢的颜色</label>
        <input 
          type="color" 
          id="color" 
          name="color" 
          value="#3498db"
        >
      </div>
      
      <!-- 滑块 -->
      <div class="form-group">
        <label for="satisfaction">满意度</label>
        <input 
          type="range" 
          id="satisfaction" 
          name="satisfaction" 
          min="0" 
          max="10" 
          value="5"
        >
        <small id="satisfactionValue">5</small>
      </div>
      
      <!-- 搜索框 -->
      <div class="form-group">
        <label for="search">搜索</label>
        <input 
          type="search" 
          id="search" 
          name="search" 
          placeholder="搜索内容..."
        >
      </div>
      
      <!-- 下拉选择 -->
      <div class="form-group">
        <label for="country">国家</label>
        <select id="country" name="country" required>
          <option value="">请选择国家</option>
          <option value="cn">中国</option>
          <option value="us">美国</option>
          <option value="uk">英国</option>
          <option value="jp">日本</option>
          <option value="other">其他</option>
        </select>
      </div>
      
      <!-- 多行文本 -->
      <div class="form-group">
        <label for="message">留言</label>
        <textarea 
          id="message" 
          name="message" 
          rows="4" 
          placeholder="请输入留言..."
        ></textarea>
      </div>
      
      <!-- 提交按钮 -->
      <button type="submit" id="submitBtn" disabled>提交表单</button>
    </form>
  </div>

  <script>
    // 表单验证和交互
    const form = document.getElementById('registrationForm');
    const submitBtn = document.getElementById('submitBtn');
    const satisfactionSlider = document.getElementById('satisfaction');
    const satisfactionValue = document.getElementById('satisfactionValue');
    
    // 实时验证
    function validateForm() {
      // 检查表单是否有效
      if (form.checkValidity()) {
        submitBtn.disabled = false;
      } else {
        submitBtn.disabled = true;
      }
    }
    
    // 监听输入事件
    form.addEventListener('input', validateForm);
    
    // 滑块值显示
    satisfactionSlider.addEventListener('input', function() {
      satisfactionValue.textContent = this.value;
    });
    
    // 表单提交
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      if (form.checkValidity()) {
        const formData = new FormData(form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
          data[key] = value;
        }
        
        console.log('表单数据:', data);
        alert('表单提交成功！\n' + JSON.stringify(data, null, 2));
      }
    });
    
    // 初始化验证
    validateForm();
  </script>
</body>
</html>
```

### 3.3 多媒体播放器

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HTML5多媒体播放器</title>
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
    
    .media-player {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .media-container {
      position: relative;
      width: 100%;
      margin-bottom: 20px;
    }
    
    video, audio {
      width: 100%;
      border-radius: 8px;
    }
    
    .controls {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }
    
    .btn {
      padding: 10px 20px;
      background: #3498db;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.3s ease;
    }
    
    .btn:hover {
      background: #2980b9;
    }
    
    .btn:disabled {
      background: #bdc3c7;
      cursor: not-allowed;
    }
    
    .volume-container {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .volume-slider {
      width: 100px;
    }
    
    .info {
      margin-top: 20px;
      padding: 15px;
      background: #ecf0f1;
      border-radius: 8px;
    }
    
    .info h3 {
      margin-bottom: 10px;
      color: #2c3e50;
    }
    
    .info p {
      margin-bottom: 8px;
      color: #666;
    }
    
    .info code {
      background: #34495e;
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="media-player">
    <h2>HTML5多媒体播放器</h2>
    
    <!-- 视频播放器 -->
    <div class="media-container">
      <video id="videoPlayer" poster="https://via.placeholder.com/800x450">
        <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4">
        <source src="https://www.w3schools.com/html/mov_bbb.ogg" type="video/ogg">
        您的浏览器不支持video元素。
      </video>
      
      <div class="controls">
        <button class="btn" id="playBtn">播放</button>
        <button class="btn" id="pauseBtn">暂停</button>
        <button class="btn" id="muteBtn">静音</button>
        
        <div class="volume-container">
          <span>音量:</span>
          <input 
            type="range" 
            class="volume-slider" 
            id="volumeSlider" 
            min="0" 
            max="1" 
            step="0.1" 
            value="1"
          >
        </div>
        
        <div class="volume-container">
          <span>速度:</span>
          <select id="playbackRate" class="btn">
            <option value="0.5">0.5x</option>
            <option value="1" selected>1x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>
        </div>
      </div>
    </div>
    
    <!-- 音频播放器 -->
    <div class="media-container">
      <audio id="audioPlayer">
        <source src="https://www.w3schools.com/html/horse.mp3" type="audio/mpeg">
        您的浏览器不支持audio元素。
      </audio>
      
      <div class="controls">
        <button class="btn" id="audioPlayBtn">播放</button>
        <button class="btn" id="audioPauseBtn">暂停</button>
        <button class="btn" id="audioMuteBtn">静音</button>
      </div>
    </div>
    
    <!-- 信息面板 -->
    <div class="info">
      <h3>播放器信息</h3>
      <p>当前时间: <code id="currentTime">00:00</code> / <code id="duration">00:00</code></p>
      <p>音量: <code id="volume">100%</code></p>
      <p>状态: <code id="status">准备就绪</code></p>
    </div>
  </div>

  <script>
    // 视频播放器控制
    const videoPlayer = document.getElementById('videoPlayer');
    const audioPlayer = document.getElementById('audioPlayer');
    
    // 播放/暂停按钮
    const playBtn = document.getElementById('playBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const muteBtn = document.getElementById('muteBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    const playbackRate = document.getElementById('playbackRate');
    
    // 音频播放器按钮
    const audioPlayBtn = document.getElementById('audioPlayBtn');
    const audioPauseBtn = document.getElementById('audioPauseBtn');
    const audioMuteBtn = document.getElementById('audioMuteBtn');
    
    // 信息显示
    const currentTimeEl = document.getElementById('currentTime');
    const durationEl = document.getElementById('duration');
    const volumeEl = document.getElementById('volume');
    const statusEl = document.getElementById('status');
    
    // 格式化时间
    function formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    // 更新时间显示
    function updateDisplay() {
      currentTimeEl.textContent = formatTime(videoPlayer.currentTime);
      durationEl.textContent = formatTime(videoPlayer.duration);
    }
    
    // 更新音量显示
    function updateVolume() {
      const volume = Math.round(videoPlayer.volume * 100);
      volumeEl.textContent = `${volume}%`;
    }
    
    // 更新状态
    function updateStatus(message) {
      statusEl.textContent = message;
    }
    
    // 视频播放控制
    playBtn.addEventListener('click', () => {
      videoPlayer.play()
        .then(() => updateStatus('正在播放'))
        .catch(error => {
          console.error('播放失败:', error);
          updateStatus('播放失败');
        });
    });
    
    pauseBtn.addEventListener('click', () => {
      videoPlayer.pause();
      updateStatus('已暂停');
    });
    
    muteBtn.addEventListener('click', () => {
      videoPlayer.muted = !videoPlayer.muted;
      muteBtn.textContent = videoPlayer.muted ? '取消静音' : '静音';
      updateStatus(videoPlayer.muted ? '已静音' : '取消静音');
    });
    
    // 音量控制
    volumeSlider.addEventListener('input', () => {
      videoPlayer.volume = parseFloat(volumeSlider.value);
      updateVolume();
    });
    
    // 播放速度控制
    playbackRate.addEventListener('change', () => {
      videoPlayer.playbackRate = parseFloat(playbackRate.value);
      updateStatus(`播放速度: ${playbackRate.value}x`);
    });
    
    // 音频播放控制
    audioPlayBtn.addEventListener('click', () => {
      audioPlayer.play()
        .then(() => updateStatus('音频播放中'))
        .catch(error => {
          console.error('音频播放失败:', error);
          updateStatus('音频播放失败');
        });
    });
    
    audioPauseBtn.addEventListener('click', () => {
      audioPlayer.pause();
      updateStatus('音频已暂停');
    });
    
    audioMuteBtn.addEventListener('click', () => {
      audioPlayer.muted = !audioPlayer.muted;
      audioMuteBtn.textContent = audioPlayer.muted ? '取消静音' : '静音';
    });
    
    // 事件监听
    videoPlayer.addEventListener('timeupdate', updateDisplay);
    videoPlayer.addEventListener('loadedmetadata', updateDisplay);
    videoPlayer.addEventListener('play', () => updateStatus('正在播放'));
    videoPlayer.addEventListener('pause', () => updateStatus('已暂停'));
    videoPlayer.addEventListener('ended', () => updateStatus('播放完成'));
    videoPlayer.addEventListener('volumechange', updateVolume);
    
    // 初始化
    updateVolume();
  </script>
</body>
</html>
```

### 3.4 Web Storage使用

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Web Storage应用</title>
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
      max-width: 600px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    h2 {
      margin-bottom: 24px;
      color: #2c3e50;
    }
    
    .storage-section {
      margin-bottom: 32px;
      padding: 24px;
      background: #ecf0f1;
      border-radius: 8px;
    }
    
    .storage-section h3 {
      margin-bottom: 16px;
      color: #34495e;
    }
    
    .form-group {
      margin-bottom: 16px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #333;
    }
    
    .form-group input {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
    }
    
    .form-group input:focus {
      outline: none;
      border-color: #3498db;
    }
    
    .btn {
      padding: 10px 20px;
      background: #3498db;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.3s ease;
    }
    
    .btn:hover {
      background: #2980b9;
    }
    
    .btn-danger {
      background: #e74c3c;
    }
    
    .btn-danger:hover {
      background: #c0392b;
    }
    
    .data-list {
      margin-top: 16px;
    }
    
    .data-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: white;
      border-radius: 6px;
      margin-bottom: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    
    .data-item span {
      font-family: monospace;
      color: #666;
    }
    
    .delete-btn {
      padding: 4px 10px;
      background: #e74c3c;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    
    .delete-btn:hover {
      background: #c0392b;
    }
    
    .info {
      margin-top: 16px;
      padding: 16px;
      background: #fff3cd;
      border-radius: 6px;
      font-size: 14px;
      color: #856404;
    }
    
    .info strong {
      color: #533f03;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Web Storage应用示例</h2>
    
    <!-- localStorage 示例 -->
    <div class="storage-section">
      <h3>localStorage (永久存储)</h3>
      <div class="form-group">
        <label for="localStorageKey">键名</label>
        <input type="text" id="localStorageKey" placeholder="例如: username">
      </div>
      <div class="form-group">
        <label for="localStorageValue">值</label>
        <input type="text" id="localStorageValue" placeholder="例如: John">
      </div>
      <button class="btn" id="localStorageSaveBtn">保存到 localStorage</button>
      <button class="btn btn-danger" id="localStorageClearBtn">清空 localStorage</button>
      
      <div class="data-list" id="localStorageList"></div>
      
      <div class="info">
        <strong>说明:</strong> localStorage 数据永久保存，除非手动清除或用户清除浏览器数据。
      </div>
    </div>
    
    <!-- sessionStorage 示例 -->
    <div class="storage-section">
      <h3>sessionStorage (会话存储)</h3>
      <div class="form-group">
        <label for="sessionStorageKey">键名</label>
        <input type="text" id="sessionStorageKey" placeholder="例如: tempData">
      </div>
      <div class="form-group">
        <label for="sessionStorageValue">值</label>
        <input type="text" id="sessionStorageValue" placeholder="例如: 临时数据">
      </div>
      <button class="btn" id="sessionStorageSaveBtn">保存到 sessionStorage</button>
      <button class="btn btn-danger" id="sessionStorageClearBtn">清空 sessionStorage</button>
      
      <div class="data-list" id="sessionStorageList"></div>
      
      <div class="info">
        <strong>说明:</strong> sessionStorage 数据在浏览器关闭后自动清除。
      </div>
    </div>
  </div>

  <script>
    // localStorage 操作
    const localStorageKeyInput = document.getElementById('localStorageKey');
    const localStorageValueInput = document.getElementById('localStorageValue');
    const localStorageSaveBtn = document.getElementById('localStorageSaveBtn');
    const localStorageClearBtn = document.getElementById('localStorageClearBtn');
    const localStorageList = document.getElementById('localStorageList');
    
    // sessionStorage 操作
    const sessionStorageKeyInput = document.getElementById('sessionStorageKey');
    const sessionStorageValueInput = document.getElementById('sessionStorageValue');
    const sessionStorageSaveBtn = document.getElementById('sessionStorageSaveBtn');
    const sessionStorageClearBtn = document.getElementById('sessionStorageClearBtn');
    const sessionStorageList = document.getElementById('sessionStorageList');
    
    // 渲染 localStorage 数据
    function renderLocalStorage() {
      localStorageList.innerHTML = '';
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        
        const item = document.createElement('div');
        item.className = 'data-item';
        item.innerHTML = `
          <span><strong>${key}</strong>: ${value}</span>
          <button class="delete-btn" data-key="${key}">删除</button>
        `;
        
        localStorageList.appendChild(item);
      }
    }
    
    // 渲染 sessionStorage 数据
    function renderSessionStorage() {
      sessionStorageList.innerHTML = '';
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        const value = sessionStorage.getItem(key);
        
        const item = document.createElement('div');
        item.className = 'data-item';
        item.innerHTML = `
          <span><strong>${key}</strong>: ${value}</span>
          <button class="delete-btn" data-key="${key}">删除</button>
        `;
        
        sessionStorageList.appendChild(item);
      }
    }
    
    // 保存到 localStorage
    localStorageSaveBtn.addEventListener('click', () => {
      const key = localStorageKeyInput.value.trim();
      const value = localStorageValueInput.value.trim();
      
      if (!key || !value) {
        alert('请填写键名和值');
        return;
      }
      
      localStorage.setItem(key, value);
      localStorageKeyInput.value = '';
      localStorageValueInput.value = '';
      
      renderLocalStorage();
    });
    
    // 清空 localStorage
    localStorageClearBtn.addEventListener('click', () => {
      if (confirm('确定要清空所有 localStorage 数据吗？')) {
        localStorage.clear();
        renderLocalStorage();
      }
    });
    
    // 保存到 sessionStorage
    sessionStorageSaveBtn.addEventListener('click', () => {
      const key = sessionStorageKeyInput.value.trim();
      const value = sessionStorageValueInput.value.trim();
      
      if (!key || !value) {
        alert('请填写键名和值');
        return;
      }
      
      sessionStorage.setItem(key, value);
      sessionStorageKeyInput.value = '';
      sessionStorageValueInput.value = '';
      
      renderSessionStorage();
    });
    
    // 清空 sessionStorage
    sessionStorageClearBtn.addEventListener('click', () => {
      if (confirm('确定要清空所有 sessionStorage 数据吗？')) {
        sessionStorage.clear();
        renderSessionStorage();
      }
    });
    
    // 删除单个项
    localStorageList.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-btn')) {
        const key = e.target.dataset.key;
        localStorage.removeItem(key);
        renderLocalStorage();
      }
    });
    
    sessionStorageList.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-btn')) {
        const key = e.target.dataset.key;
        sessionStorage.removeItem(key);
        renderSessionStorage();
      }
    });
    
    // 初始化渲染
    renderLocalStorage();
    renderSessionStorage();
  </script>
</body>
</html>
```

---

## 四、最佳实践

### 4.1 语义化标签使用原则

1. **优先使用语义化标签**：能用`<article>`就不要用`<div class="article">`
2. **正确嵌套**：`<header>`、`<nav>`、`<main>`、`<aside>`、`<footer>`应正确嵌套
3. **避免过度使用**：不是所有内容都需要语义化标签
4. **考虑无障碍访问**：语义化标签提升屏幕阅读器体验

### 4.2 表单验证最佳实践

1. **使用HTML5验证**：优先使用`required`、`minlength`、`maxlength`等属性
2. **自定义验证**：使用`pattern`属性添加正则验证
3. **友好的错误提示**：使用`title`属性提供错误信息
4. **JavaScript增强**：用JavaScript提供更友好的验证体验

### 4.3 多媒体优化建议

1. **提供多种格式**：支持MP4、WebM、OGG等格式
2. **使用poster属性**：设置视频封面图
3. **优化加载**：使用`preload`属性控制预加载
4. **响应式设计**：确保多媒体在不同设备上正常显示

### 4.4 Storage使用建议

1. **数据大小限制**：localStorage约5MB，sessionStorage约5MB
2. **字符串存储**：Storage只能存储字符串，对象需用`JSON.stringify()`
3. **安全性**：不要存储敏感信息（如密码、Token）
4. **事件监听**：使用`storage`事件监听其他标签页的存储变化

---

## 五、常见问题

### 5.1 语义化标签的浏览器兼容性

**问题**：旧版IE不支持HTML5语义化标签

**解决方案**：
```css
/* 为旧版IE添加样式 */
header, nav, main, aside, footer, article, section {
  display: block;
}
```

### 5.2 表单验证的浏览器差异

**问题**：不同浏览器的表单验证样式不一致

**解决方案**：
```css
/* 统一表单验证样式 */
input:valid, select:valid, textarea:valid {
  border-color: #2ecc71;
}

input:invalid, select:invalid, textarea:invalid {
  border-color: #e74c3c;
}

/* 移除默认的验证气泡 */
form {
  -webkit-validation-bubble-message: none;
}
```

### 5.3 Storage的跨域限制

**问题**：Storage只能在同源下访问

**解决方案**：
- 使用`postMessage`进行跨域通信
- 使用Cookie或LocalStorage配合服务器端存储

---

## 六、实战练习

### 6.1 练习1：重构页面结构

**任务**：将以下使用div的页面重构为语义化HTML5结构

```html
<!-- 原始代码 -->
<div class="header">
  <h1>网站标题</h1>
</div>
<div class="nav">
  <ul>
    <li><a href="#">首页</a></li>
    <li><a href="#">关于</a></li>
  </ul>
</div>
<div class="main">
  <div class="content">
    <div class="article">
      <h2>文章标题</h2>
      <p>文章内容</p>
    </div>
  </div>
  <div class="sidebar">
    <div class="widget">
      <h3>侧边栏</h3>
      <p>侧边栏内容</p>
    </div>
  </div>
</div>
<div class="footer">
  <p>版权信息</p>
</div>
```

### 6.2 练习2：创建增强表单

**任务**：创建一个包含以下字段的注册表单：
- 用户名（必填，3-20字符）
- 邮箱（必填，自动验证格式）
- 年龄（数字输入，18-100）
- 生日（日期选择器）
- 网址（URL格式验证）
- 滑块（满意度，0-10）
- 提交按钮（表单有效时才启用）

### 6.3 练习3：多媒体播放器

**任务**：创建一个视频播放器，包含以下功能：
- 播放/暂停按钮
- 音量控制
- 播放速度控制
- 进度条显示
- 静音/取消静音

---

## 七、总结

HTML5是现代Web开发的基础，掌握其核心知识至关重要：

1. **语义化标签**：提升代码可读性和SEO
2. **表单增强**：减少JavaScript验证代码
3. **多媒体支持**：原生支持音频和视频
4. **Web Storage**：本地存储解决方案

掌握这些知识，为学习更高级的Web技术打下坚实基础。

---

---

## 八、深入原理分析

### 8.1 HTML解析器工作原理

浏览器在解析HTML文档时，会经过以下步骤：

```
1. 字节流 → 字符流（根据编码如UTF-8解码）
2. 字符流 → 令牌流（Tokenization）
3. 令牌流 → DOM树（DOM Tree Construction）
4. DOM树 + CSSOM → 渲染树（Render Tree）
5. 布局计算（Layout）
6. 绘制（Paint）
7. 合成（Composite）
```

**令牌化（Tokenization）** 是HTML解析的核心步骤。解析器逐字符读取文档，识别出不同类型的令牌：

| 令牌类型 | 示例 | 说明 |
|----------|------|------|
| DOCTYPE | `<!DOCTYPE html>` | 文档类型声明 |
| 开始标签 | `<div class="box">` | 元素开始 |
| 结束标签 | `</div>` | 元素结束 |
| 自闭合标签 | `<br />` | 无需闭合 |
| 文本节点 | `这是一段文字` | 纯文本内容 |
| 注释 | `<!-- 注释 -->` | 注释内容 |

**树构建（Tree Construction）** 阶段：解析器根据令牌构建DOM树，同时处理嵌套关系。当遇到 `<script>` 标签时，会暂停解析，等待脚本执行完毕。

### 8.2 HTML5新增的解析规则

HTML5引入了一套更宽松的解析算法，能够容错处理不规范文档：

```javascript
// 隐式生成标签示例
// <!DOCTYPE html>
// <div>内容</div>
// </body>  // 可省略，浏览器自动推断
```

**常见容错机制**：

```html
<!-- 1. 表格修复：自动包裹tbody -->
<table>
  <tr><td>单元格</td></tr>
  <!-- 浏览器自动生成 <tbody> -->
</table>

<!-- 2. 表单嵌套修复 -->
<form>
  <form>
    <!-- 内层form自动被忽略 -->
  </form>
</form>

<!-- 3. 列表嵌套修复 -->
<ul>
  <li>项目1
    <ul>
      <li>子项目</li>  <!-- 自动关联到外层li -->
    </ul>
  </li>
</ul>

<!-- 4. 可选结束标签自动补全 -->
<p>第一段
<p>第二段
<!-- 第二段的</p>自动补全 -->
```

### 8.3 浏览器如何处理资源加载

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <!-- 1. 元数据按声明顺序解析 -->
  <meta charset="UTF-8">        <!-- 必须在最前面，影响后续解析 -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>页面标题</title>

  <!-- 2. CSS同步加载，阻塞渲染 -->
  <link rel="stylesheet" href="styles.css">

  <!-- 3. JS阻塞解析，需谨慎放置 -->
  <script src="app.js"></script>        <!-- 阻塞解析 -->
  <script async src="analytics.js"></script>  <!-- 异步下载，完成后立即执行 -->
  <script defer src="main.js"></script>     <!-- 异步下载，DOM解析完成后执行 -->
</head>
<body>
  <!-- JS引用的元素必须在此之前或使用defer/async -->
</body>
</html>
```

**脚本加载策略对比**：

| 属性 | 下载时机 | 执行时机 | 阻塞 |
|------|----------|----------|------|
| 无属性 | 解析时遇到停止 | 立即执行 | 阻塞解析 |
| `async` | 并行下载 | 下载完成后立即 | 不阻塞（但执行时阻塞） |
| `defer` | 并行下载 | DOM解析完成后 | 不阻塞解析 |

---

## 九、常见面试题详解

### 9.1 如何理解HTML语义化？它的实际价值是什么？

**参考答案要点**：

**1. 什么是语义化**
语义化是用合适的标签表达内容的含义，让机器（浏览器、搜索引擎、屏幕阅读器）能够理解文档结构。

**2. 核心价值**
- **SEO优化**：搜索引擎根据标签含义判断内容重要性（如 `<h1>` 比 `<div>` 权重更高）
- **可访问性**：屏幕阅读器用户依赖语义标签导航（如 `<nav>`、`<main>`、`<article>`）
- **代码可维护性**：开发者通过标签名即可理解页面结构
- **团队协作**：统一规范减少理解成本

**3. 实践建议**
```html
<!-- ❌ 错误：只用div -->
<div class="header">
  <div class="nav">
    <div class="item"><a href="#">首页</a></div>
  </div>
</div>

<!-- ✅ 正确：语义化标签 -->
<header>
  <nav>
    <a href="#">首页</a>
  </nav>
</header>
```

**4. 语义化程度分级**
```
强语义：<article>, <nav>, <main>, <aside>, <header>, <footer>
中等语义：<section>, <figure>, <figcaption>, <time>, <address>
弱语义：<div>, <span>（无特定含义，用于布局或样式）
```

### 9.2 HTML5离线存储（Application Cache）的工作原理

Application Cache通过manifest文件声明需要缓存的资源：

```html
<!-- index.html -->
<!DOCTYPE html>
<html manifest="app.appcache">
<head>
  <meta charset="UTF-8">
  <title>离线应用</title>
  <!-- 所有引用的资源都会根据manifest缓存 -->
  <link rel="stylesheet" href="style.css">
  <script src="app.js"></script>
</head>
<body>
  <h1>离线内容</h1>
</body>
</html>
```

```text
<!-- app.appcache -->
CACHE MANIFEST
# 版本号：2026-03-18
CACHE:
style.css
app.js
/offline.html

NETWORK:
# 这些资源必须在线访问
/api/*
*

FALLBACK:
# 离线时的降级页面
/api/ /offline.html
```

**Application Cache vs Service Worker**：
Application Cache 已于2020年被废弃，推荐使用 Service Worker：

```javascript
// 注册 Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('SW已注册', reg.scope))
    .catch(err => console.error('SW注册失败', err));
}
```

```javascript
// sw.js - Service Worker实现离线缓存
const CACHE_NAME = 'app-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/offline.html'
];

// 安装阶段：缓存资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()) // 立即激活
  );
});

// 激活阶段：清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// 请求拦截：缓存优先
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request)
        .then(response => {
          // 缓存新的网络资源
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache =>
              cache.put(event.request, clone)
            );
          }
          return response;
        })
      )
      .catch(() => caches.match('/offline.html'))
  );
});
```

### 9.3 Web Storage与Cookie的区别及应用场景

| 特性 | Cookie | localStorage | sessionStorage |
|------|--------|--------------|----------------|
| **容量** | ~4KB | ~5-10MB | ~5-10MB |
| **生命周期** | 可设置过期时间 | 永久有效 | 标签页关闭 |
| **作用域** | 可设置域路径 | 仅同源 | 仅同源同标签页 |
| **请求携带** | 自动随请求发送 | 不自动发送 | 不自动发送 |
| **访问方式** | document.cookie | localStorage | sessionStorage |
| **适用场景** | 身份认证Token | 用户偏好设置 | 临时表单数据 |

**实战应用：用户偏好主题存储**

```javascript
// 保存用户主题偏好
function saveThemePreference(theme) {
  localStorage.setItem('theme', JSON.stringify({
    theme,
    updatedAt: new Date().toISOString()
  }));

  // 同步更新文档根元素
  document.documentElement.setAttribute('data-theme', theme);

  // 分发自定义事件通知其他组件
  window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme } }));
}

// 页面加载时恢复主题
function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) {
    try {
      const { theme } = JSON.parse(saved);
      document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {
      console.error('主题数据解析失败', e);
    }
  } else {
    // 检测系统偏好
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  }
}

// 监听系统主题变化
window.matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', e => {
    if (!localStorage.getItem('theme')) {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
  });
```

### 9.4 HTML5拖拽API的实现原理

拖拽API基于DataTransfer对象实现数据传输：

```html
<!-- 拖拽源 -->
<div id="drag-source" draggable="true">
  <h3>拖拽我</h3>
  <p>拖拽内容区域</p>
</div>

<!-- 放置目标 -->
<div id="drop-target">
  <h3>放置区域</h3>
  <p>将内容放置在此处</p>
</div>

<!-- 文件拖放区域 -->
<div id="file-drop" class="drop-zone">
  <p>拖拽文件到此处上传</p>
</div>
```

```javascript
const dragSource = document.getElementById('drag-source');
const dropTarget = document.getElementById('drop-target');
const fileDrop = document.getElementById('file-drop');

// ==================== 拖拽源事件 ====================

// 开始拖拽（必须设置draggable="true"）
dragSource.addEventListener('dragstart', event => {
  // 设置拖拽数据（格式，数据值）
  event.dataTransfer.setData('text/plain', '拖拽的文本内容');
  event.dataTransfer.setData('application/json', JSON.stringify({ id: 1, name: '项目' }));

  // 设置拖拽图像（可选）
  // event.dataTransfer.setDragImage(imgElement, x, y);

  // 设置允许的操作
  event.dataTransfer.effectAllowed = 'copyMove';

  // 添加拖拽样式
  dragSource.classList.add('dragging');
});

// 拖拽结束
dragSource.addEventListener('dragend', event => {
  dragSource.classList.remove('dragging');
});

// ==================== 放置目标事件 ====================

// 进入放置区域（可选：用于视觉反馈）
dropTarget.addEventListener('dragenter', event => {
  event.preventDefault(); // 必须阻止默认行为
  dropTarget.classList.add('drag-over');
});

// 悬停（每移动都会触发）
dropTarget.addEventListener('dragover', event => {
  event.preventDefault(); // 关键：必须阻止才能允许放置
  event.dataTransfer.dropEffect = 'copy'; // 显示放置效果
});

// 离开放置区域
dropTarget.addEventListener('dragleave', event => {
  // 仅在真正离开时移除，而非进入子元素
  if (!dropTarget.contains(event.relatedTarget)) {
    dropTarget.classList.remove('drag-over');
  }
});

// 实际放置
dropTarget.addEventListener('drop', event => {
  event.preventDefault();
  dropTarget.classList.remove('drag-over');

  // 获取拖拽数据
  const text = event.dataTransfer.getData('text/plain');
  const jsonData = event.dataTransfer.getData('application/json');

  if (text) {
    dropTarget.innerHTML += `<p>接收到文本: ${text}</p>`;
  }

  if (jsonData) {
    try {
      const data = JSON.parse(jsonData);
      dropTarget.innerHTML += `<p>接收到数据: ${data.name}</p>`;
    } catch (e) {
      console.error('JSON解析失败', e);
    }
  }
});

// ==================== 文件拖放上传 ====================

// 阻止默认行为（允许文件拖放）
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  fileDrop.addEventListener(eventName, e => e.preventDefault());
});

fileDrop.addEventListener('dragover', () => {
  fileDrop.classList.add('drag-over');
});

fileDrop.addEventListener('dragleave', () => {
  fileDrop.classList.remove('drag-over');
});

fileDrop.addEventListener('drop', event => {
  fileDrop.classList.remove('drag-over');
  const files = event.dataTransfer.files;

  if (files.length > 0) {
    handleFileUpload(files);
  }
});

function handleFileUpload(files) {
  Array.from(files).forEach(file => {
    // 验证文件类型和大小
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      console.error(`文件类型不支持: ${file.name}`);
      return;
    }

    if (file.size > maxSize) {
      console.error(`文件过大: ${file.name}`);
      return;
    }

    // 使用FormData上传
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', file.name);

    // 模拟上传
    console.log(`准备上传: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);

    // 实际项目中使用fetch上传
    // fetch('/api/upload', { method: 'POST', body: formData })
    //   .then(res => res.json())
    //   .then(data => console.log('上传成功', data))
    //   .catch(err => console.error('上传失败', err));
  });
}
```

### 9.5 Web Workers在HTML5中的实际应用

Web Workers允许在后台线程运行脚本，不阻塞主线程UI：

```javascript
// worker.js - 后台线程中的Worker脚本
// 接收主线程消息
self.addEventListener('message', event => {
  const { type, data } = event.data;

  switch (type) {
    case 'fibonacci':
      // 计算斐波那契数列（耗时操作）
      const result = fibonacci(data.n);
      self.postMessage({ type: 'fibonacciResult', result });
      break;

    case 'sort':
      // 大数组排序
      const sorted = data.array.sort((a, b) => a - b);
      self.postMessage({ type: 'sortResult', sorted });
      break;

    case 'primes':
      // 质数筛选（埃拉托斯特尼筛法）
      const primes = sieveOfEratosthenes(data.max);
      self.postMessage({ type: 'primesResult', primes, count: primes.length });
      break;
  }
});

// 斐波那契数列（递归优化：记忆化）
function fibonacci(n, memo = {}) {
  if (n in memo) return memo[n];
  if (n <= 1) return n;
  memo[n] = fibonacci(n - 1, memo) + fibonacci(n - 2, memo);
  return memo[n];
}

// 埃拉托斯特尼筛法
function sieveOfEratosthenes(max) {
  const sieve = new Array(max + 1).fill(true);
  sieve[0] = sieve[1] = false;

  for (let p = 2; p * p <= max; p++) {
    if (sieve[p]) {
      for (let i = p * p; i <= max; i += p) {
        sieve[i] = false;
      }
    }
  }

  return sieve.map((isPrime, i) => isPrime ? i : null).filter(n => n !== null);
}
```

```html
<!-- 主页面 -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>Web Worker示例</title>
  <style>
    body { font-family: -apple-system, sans-serif; padding: 20px; }
    button { padding: 10px 20px; margin: 5px; cursor: pointer; }
    pre { background: #f5f5f5; padding: 15px; border-radius: 8px; overflow-x: auto; }
    .result { margin-top: 20px; }
  </style>
</head>
<body>
  <h1>Web Worker 后台计算示例</h1>

  <div>
    <button id="btn-fib">计算斐波那契(40)</button>
    <button id="btn-sort">排序100万元素</button>
    <button id="btn-prime">筛选100万个质数</button>
  </div>

  <div class="result">
    <h3>计算结果：</h3>
    <pre id="output">等待计算...</pre>
  </div>

  <script>
    // 创建 Worker
    const worker = new Worker('worker.js');

    // 接收 Worker 返回的消息
    worker.addEventListener('message', event => {
      const { type, result, sorted, primes, count } = event.data;

      switch (type) {
        case 'fibonacciResult':
          document.getElementById('output').textContent =
            `斐波那契(40) = ${result}`;
          break;
        case 'sortResult':
          document.getElementById('output').textContent =
            `排序完成，前10个元素: [${sorted.slice(0, 10).join(', ')}...]`;
          break;
        case 'primesResult':
          document.getElementById('output').textContent =
            `找到 ${count} 个质数 (最大100万)\n前10个: [${primes.slice(0, 10).join(', ')}]`;
          break;
      }
    });

    // 处理 Worker 错误
    worker.addEventListener('error', error => {
      console.error('Worker错误:', error.message);
    });

    // 发送计算任务
    document.getElementById('btn-fib').addEventListener('click', () => {
      document.getElementById('output').textContent = '计算中...';
      worker.postMessage({ type: 'fibonacci', data: { n: 40 } });
    });

    document.getElementById('btn-sort').addEventListener('click', () => {
      document.getElementById('output').textContent = '排序中...';
      // 生成100万元素的随机数组
      const arr = Array.from({ length: 1000000 }, () => Math.floor(Math.random() * 1000000));
      worker.postMessage({ type: 'sort', data: { array: arr } });
    });

    document.getElementById('btn-prime').addEventListener('click', () => {
      document.getElementById('output').textContent = '筛选中...';
      worker.postMessage({ type: 'primes', data: { max: 1000000 } });
    });
  </script>
</body>
</html>
```

---

## 十、实战场景：企业级HTML5架构设计

### 10.1 可维护的HTML文档结构规范

在实际项目中，一个可维护的HTML文档应遵循以下结构：

```html
<!DOCTYPE html>
<html lang="zh-CN" dir="ltr">
<head>
  <!-- ===== 必需：字符编码(最先) ===== -->
  <meta charset="UTF-8">

  <!-- ===== 必需：响应式视口 ===== -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- ===== SEO元数据 ===== -->
  <title>页面标题 | 网站名</title>
  <meta name="description" content="页面描述，150字符以内">
  <meta name="keywords" content="关键词1, 关键词2">
  <meta name="author" content="作者名">
  <meta name="robots" content="index, follow">

  <!-- ===== Open Graph (社交分享) ===== -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="分享标题">
  <meta property="og:description" content="分享描述">
  <meta property="og:image" content="https://example.com/og-image.jpg">
  <meta property="og:url" content="https://example.com/page">

  <!-- ===== Twitter Card ===== -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Twitter标题">
  <meta name="twitter:description" content="Twitter描述">

  <!-- ===== 资源预加载（性能优化） ===== -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="dns-prefetch" href="https://api.example.com">
  <link rel="preload" href="/fonts/main.woff2" as="font" crossorigin>

  <!-- ===== 图标 ===== -->
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" href="/icon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">

  <!-- ===== 主题色 ===== -->
  <meta name="theme-color" content="#007bff">

  <!-- ===== 样式表 ===== -->
  <link rel="stylesheet" href="/css/main.css">

  <!-- ===== 预加载关键脚本（非阻塞） ===== -->
  <link rel="modulepreload" href="/js/app.js">
</head>
<body>
  <!-- ===== Skip Link (无障碍) ===== -->
  <a href="#main-content" class="skip-link">跳转到主要内容</a>

  <!-- ===== 页面结构 ===== -->
  <header><!-- 导航 --></header>

  <main id="main-content" tabindex="-1"><!-- 主要内容 --></main>

  <footer><!-- 页脚 --></footer>

  <!-- ===== 结构脚本（defer） ===== -->
  <script src="/js/main.js" defer></script>

  <!-- ===== 内联关键脚本 ===== -->
  <script>
    // 关键路径：主题初始化、FOUC防护
    (function() {
      const theme = localStorage.getItem('theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', theme);
    })();
  </script>
</body>
</html>
```

### 10.2 微前端架构中的HTML模板策略

```html
<!-- 主应用 index.html -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>微前端主应用</title>

  <!-- 公共依赖（主应用加载一次，子应用共享） -->
  <link rel="stylesheet" href="/common/vendor.css">

  <!-- 应用容器 -->
  <div id="micro-app-container"></div>

  <!-- 按需加载子应用 -->
  <script type="module">
    import { registerMicroApp } from '/lib/micro-loader.js';

    // 注册子应用
    registerMicroApp('react-app', '/apps/react/build/', {
      // 运行时配置
      globalVar: 'REACT_APP_API_URL',
      prefetch: ['vue-app']  // 预加载其他子应用
    });

    registerMicroApp('vue-app', '/apps/vue/build/');

    // 路由监听（基于qiankun框架）
    window.addEventListener('popstate', () => {
      const path = window.location.pathname;
      if (path.startsWith('/react')) {
        import('/apps/react/build/index.js');
      } else if (path.startsWith('/vue')) {
        import('/apps/vue/build/index.js');
      }
    });
  </script>
</head>
<body>
  <!-- 主应用内容 -->
  <nav>主导航</nav>
  <main id="micro-app-container"></main>
</body>
</html>
```

---

## 十一、扩展知识：HTML5的演进与未来

### 11.1 HTML5.3 → HTML现状

HTML标准从HTML5.3后更名为"HTML Living Standard"（活的HTML标准），由WHATWG维护，废弃了版本号概念，持续演进。

**2024-2026年新增特性**：

| 特性 | 说明 | 浏览器支持 |
|------|------|------------|
| `<dialog>` 增强 | 原生模态框，支持`showModal()` | Chrome 37+ |
| `popover` 属性 | 原生弹出层API | Chrome 114+ |
| `@starting-style` | 进入动画 | Chrome 117+ |
| `scroll-driven animations` | 滚动驱动动画 | Chrome 115+ |
| View Transitions API | 视图过渡动画 | Chrome 126+ |
| `<search>` 元素 | 原生搜索框语义 | 全面支持 |

**popover API实战**：

```html
<!-- 使用popover属性实现弹出层 -->
<button popovertarget="menu-popover">打开菜单</button>

<div id="menu-popover" popover>
  <ul>
    <li><a href="/profile">个人资料</a></li>
    <li><a href="/settings">设置</a></li>
    <li><a href="/logout">退出登录</a></li>
  </ul>
</div>
```

```javascript
// JavaScript控制popover
const popover = document.getElementById('menu-popover');

// 显示/隐藏
popover.showPopover();
popover.hidePopover();

// 监听显示/隐藏事件
popover.addEventListener('beforetoggle', event => {
  console.log('即将', event.newState === 'open' ? '打开' : '关闭');
});

popover.addEventListener('toggle', event => {
  console.log('已', event.newState === 'open' ? '打开' : '关闭');
});
```

### 11.2 从HTML到Web Components的演进

Web Components是一套原生组件化标准，包括三大部分：

```javascript
// 1. 自定义元素（Custom Elements）
class MyButton extends HTMLElement {
  constructor() {
    super();
    // 创建Shadow DOM
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.shadowRoot.querySelector('button').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('myclick', { bubbles: true, composed: true }));
    });
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        button {
          padding: var(--btn-padding, 8px 16px);
          background: var(--btn-bg, #007bff);
          color: var(--btn-color, white);
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        button:hover { opacity: 0.9; }
      </style>
      <button part="button">
        <slot>按钮</slot>
      </button>
    `;
  }
}

// 注册自定义元素
customElements.define('my-button', MyButton);
```

```html
<!-- 使用自定义元素 -->
<my-button variant="primary">点击我</my-button>

<!-- 属性控制 -->
<script>
  const btn = document.querySelector('my-button');
  btn.setAttribute('variant', 'danger');
</script>
```

---

*参考资料: MDN Web Docs, W3C HTML5标准, WHATWG HTML Living Standard*
*本文档最后更新于 2026年3月*
