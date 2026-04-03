# Electron与桌面开发完全指南

## 概述

本指南系统讲解 Electron 桌面应用开发的核心知识，从基础概念到高级优化，涵盖架构设计、开发实践、性能调优、安全防护和打包分发等全流程。适合具备 JavaScript/React 基础的开发者学习桌面应用开发技术。

---

## 一、Electron基础

### 1.1 Electron是什么

Electron 是一个使用 Web 技术（HTML、CSS、JavaScript）构建跨平台桌面应用的框架。其核心由两大组件构成：

| 组件 | 版本 | 作用 |
|------|------|------|
| **Chromium** | 最新稳定版 | 提供渲染引擎，处理 UI 渲染、网络请求、JavaScript 运行时 |
| **Node.js** | LTS 版本 | 提供文件系统访问、原生模块调用、操作系统交互能力 |

**架构示意图：**

```
┌─────────────────────────────────────────────────────────────┐
│                     Electron 应用                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐      ┌─────────────────────────┐  │
│  │    主进程 (Main)     │      │    渲染进程 (Renderer)   │  │
│  │                     │      │                         │  │
│  │  • Node.js 运行时    │      │  • Chromium 浏览器      │  │
│  │  • 原生API访问       │◄────►│  • Web 页面             │  │
│  │  • 系统功能调用       │ IPC  │  • React/Vue 应用       │  │
│  │  • 窗口管理          │      │  • 用户界面              │  │
│  └─────────────────────┘      └─────────────────────────┘  │
│           │                            │                   │
│           ▼                            ▼                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Chromium + Node.js 组合                 │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 与其他桌面框架对比

| 特性 | Electron | Qt | Tauri | Flutter Desktop |
|------|----------|-----|-------|-----------------|
| **开发语言** | JavaScript/TypeScript | C++/Python | Rust + Web | Dart |
| **渲染引擎** | Chromium | Qt自研 | 系统WebView | Flutter自研 |
| **包体积** | 120-150MB | 30-50MB | 3-10MB | 20-30MB |
| **启动速度** | 较慢 (2-5秒) | 快 | 极快 (<100ms) | 快 |
| **内存占用** | 高 (150-500MB) | 中 | 低 (<50MB) | 中 |
| **生态丰富度** | 极其丰富 | 丰富 | 发展中 | 一般 |
| **原生能力** | 强 | 极强 | 中 | 中 |
| **学习曲线** | 低 | 高 | 中 | 中 |
| **社区活跃度** | 非常活跃 | 活跃 |快速增长 | 活跃 |

**我的思考：Electron的优缺点分析**

**优点：**

1. **开发效率极高**：前端开发者可以直接使用现有的 HTML/CSS/JS 技能开发桌面应用，无需学习新的编程语言

2. **生态成熟完善**：npm 上有数十万个可用的 Node.js 包，几乎任何功能都能找到现成的解决方案

3. **跨平台一致性强**：Windows、macOS、Linux 三个平台使用同一套代码，UI 表现高度一致

4. **社区资源丰富**：GitHub Stars 超过 11 万，有大量开源项目和教程可供参考

5. **热更新支持**：可以像 Web 应用一样实现热更新，无需用户下载安装包

**缺点：**

1. **包体积过大**：包含完整的 Chromium 引擎，即使是最简单的应用也要 120MB 以上

2. **内存占用高**：每个渲染进程都是独立的 Chromium 实例，空载时占用 150MB+ 内存

3. **性能天花板**：相比 Qt/Tauri 等框架，在 CPU 密集型任务上性能较差

4. **安全风险**：需要谨慎配置才能避免 Node.js API 被恶意网页调用

5. **打包复杂**：原生模块（native modules）需要针对不同平台分别编译

### 1.3 为什么选择Electron

在以下场景中，Electron 是很好的选择：

- **需要快速开发跨平台桌面应用**：团队熟悉 Web 技术，希望复用现有代码
- **应用 UI 复杂**：需要现代 UI 效果、动画、3D 等，Web 技术最适合
- **需要频繁更新**：支持热更新，用户无需手动下载安装包
- **生态依赖强**：项目依赖大量 npm 包，其他框架无法直接使用
- **团队构成**：前端开发者为主，不需要 native 开发能力

**典型应用案例：**

| 应用 | 开发者 | 说明 |
|------|--------|------|
| VS Code | Microsoft | 最成功的 Electron 应用 |
| Slack | Slack Technologies | 团队协作工具 |
| Figma | Figma Inc. | 设计工具 |
| Postman | Postman Inc. | API 开发工具 |
| Obsidian | Obsidian.md | 知识管理工具 |
| GitHub Desktop | GitHub | Git 客户端 |

---

## 二、Electron架构

### 2.1 主进程与渲染进程

Electron 应用运行在两种进程中：**主进程（Main Process）** 和 **渲染进程（Renderer Process）**。

**主进程职责：**

```javascript
// main.js - 主进程入口
const { app, BrowserWindow } = require('electron');

// app 模块：管理应用生命周期
// 当 Electron 完成初始化时触发
app.whenReady().then(() => {
  console.log('Electron 应用已启动');

  // 创建窗口
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: '我的Electron应用',
    webPreferences: {
      // 渲染进程配置
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // 加载页面
  mainWindow.loadFile('index.html');

  // 窗口关闭时退出应用（macOS 除外）
  mainWindow.on('closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
});

// 监听所有窗口关闭事件
app.on('window-all-closed', () => {
  // macOS 通常不强制退出应用
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 应用被激活时（macOS Dock 点击）
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
```

**渲染进程职责：**

```html
<!-- index.html - 渲染进程页面 -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Electron渲染进程</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 20px;
      background: #1e1e1e;
      color: #fff;
    }
    h1 { color: #61dafb; }
    .info { background: #2d2d2d; padding: 15px; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>Hello Electron</h1>
  <div class="info">
    <p>这是渲染进程中的内容</p>
    <p>进程ID: <span id="pid"></span></p>
  </div>

  <script>
    // 显示当前渲染进程的ID
    document.getElementById('pid').textContent = process.pid;
  </script>
</body>
</html>
```

**多窗口管理示例：**

```javascript
// main.js - 多窗口管理
const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow = null;      // 主窗口
let settingsWindow = null; // 设置窗口
let aboutWindow = null;     // 关于窗口

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: '主窗口',
    backgroundColor: '#1e1e1e',
    show: false,  // 创建后不立即显示，等待加载完成
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // 显示窗口（当页面加载完成时）
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 创建设置窗口（模态对话框风格）
function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus(); // 已存在则聚焦
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 600,
    height: 500,
    parent: mainWindow,    // 关联主窗口，成为模态
    modal: true,           // 模态窗口
    title: '设置',
    resizable: false,       // 不可调整大小
    minimizable: false,
    maximizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  settingsWindow.loadFile('settings.html');
  settingsWindow.setMenu(null); // 不显示菜单栏

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

// 创建关于窗口（非模态）
function createAboutWindow() {
  if (aboutWindow) {
    aboutWindow.focus();
    return;
  }

  aboutWindow = new BrowserWindow({
    width: 400,
    height: 300,
    title: '关于',
    resizable: false,
    minimizable: true,
    maximizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  aboutWindow.loadFile('about.html');
  aboutWindow.on('closed', () => {
    aboutWindow = null;
  });
}

// 导出创建方法供 IPC 调用
module.exports = {
  createMainWindow,
  createSettingsWindow,
  createAboutWindow
};
```

### 2.2 IPC通信机制

Electron 的主进程和渲染进程通过 **IPC（Inter-Process Communication）** 进行通信。

**IPC 通信流程：**

```
┌─────────────────┐                              ┌─────────────────┐
│   渲染进程       │                              │   主进程         │
│                 │                              │                 │
│  ipcRenderer    │                              │   ipcMain       │
│       │         │         IPC 通道              │       │         │
│       │ invoke  │ ─────────────────────────►   │       │         │
│       │         │                              │       │ handle  │
│       │         │  ◄───────────────────────── │       │         │
│       │ response│         响应数据              │       │         │
│                 │                              │                 │
└─────────────────┘                              └─────────────────┘
```

**基础 IPC 示例：**

```javascript
// main.js - 主进程 IPC 处理器
const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

let mainWindow;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');
});

// 注册 IPC 处理器 - 获取应用信息
ipcMain.handle('get-app-info', async () => {
  return {
    version: app.getVersion(),
    name: app.getName(),
    platform: process.platform,
    arch: process.arch,
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    chromeVersion: process.versions.chrome
  };
});

// 注册 IPC 处理器 - 读取文件
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const absolutePath = path.resolve(filePath);
    const content = await fs.promises.readFile(absolutePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 注册 IPC 处理器 - 写入文件
ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    const absolutePath = path.resolve(filePath);
    await fs.promises.writeFile(absolutePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 注册 IPC 处理器 - 显示对话框
ipcMain.handle('show-open-dialog', async (event) => {
  const { dialog } = require('electron');
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: '文本文件', extensions: ['txt', 'md', 'json'] },
      { name: '所有文件', extensions: ['*'] }
    ]
  });
  return result;
});

// 监听渲染进程发送的消息（单向通信）
ipcMain.on('window-minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});
```

```javascript
// preload.js - 预加载脚本（安全桥接）
const { contextBridge, ipcRenderer } = require('electron');

// 通过 contextBridge 安全地暴露 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 获取应用信息
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),

  // 文件操作
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),

  // 显示打开对话框
  showOpenDialog: () => ipcRenderer.invoke('show-open-dialog'),

  // 窗口控制
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // 监听主进程推送的消息
  onMaximizedChange: (callback) => {
    ipcRenderer.on('maximized-changed', (event, isMaximized) => {
      callback(isMaximized);
    });
  }
});
```

```html
<!-- index.html - 渲染进程使用 IPC -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>IPC通信示例</title>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      padding: 20px;
      background: #1e1e1e;
      color: #fff;
    }
    .container { max-width: 800px; margin: 0 auto; }
    h1 { color: #61dafb; border-bottom: 2px solid #61dafb; padding-bottom: 10px; }
    .card { background: #2d2d2d; padding: 20px; margin: 15px 0; border-radius: 8px; }
    .btn {
      padding: 10px 20px;
      margin: 5px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    .btn-primary { background: #61dafb; color: #000; }
    .btn-danger { background: #e74c3c; color: #fff; }
    .btn-success { background: #2ecc71; color: #fff; }
    pre { background: #1e1e1e; padding: 15px; border-radius: 4px; overflow-x: auto; }
    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .info-item { background: #3d3d3d; padding: 10px; border-radius: 4px; }
    .info-label { color: #888; font-size: 12px; }
    .info-value { color: #61dafb; font-size: 16px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Electron IPC 通信示例</h1>

    <!-- 应用信息卡片 -->
    <div class="card">
      <h2>应用信息</h2>
      <div class="info-grid" id="appInfo">
        <div class="info-item">
          <div class="info-label">应用名称</div>
          <div class="info-value" id="appName">加载中...</div>
        </div>
        <div class="info-item">
          <div class="info-label">版本</div>
          <div class="info-value" id="appVersion">-</div>
        </div>
        <div class="info-item">
          <div class="info-label">平台</div>
          <div class="info-value" id="appPlatform">-</div>
        </div>
        <div class="info-item">
          <div class="info-label">进程ID</div>
          <div class="info-value" id="processId">-</div>
        </div>
      </div>
      <button class="btn btn-primary" onclick="loadAppInfo()">刷新信息</button>
    </div>

    <!-- 窗口控制卡片 -->
    <div class="card">
      <h2>窗口控制</h2>
      <p>当前窗口状态: <span id="windowState">正常</span></p>
      <button class="btn btn-primary" onclick="minimizeWindow()">最小化</button>
      <button class="btn btn-success" onclick="maximizeWindow()">最大化/还原</button>
      <button class="btn btn-danger" onclick="closeWindow()">关闭</button>
    </div>

    <!-- 文件操作卡片 -->
    <div class="card">
      <h2>文件操作</h2>
      <button class="btn btn-primary" onclick="openFile()">打开文件</button>
      <button class="btn btn-success" onclick="saveFile()">保存文件</button>
      <pre id="fileContent">文件内容将显示在这里...</pre>
    </div>
  </div>

  <script>
    // 加载应用信息
    async function loadAppInfo() {
      try {
        const info = await window.electronAPI.getAppInfo();
        document.getElementById('appName').textContent = info.name;
        document.getElementById('appVersion').textContent = info.version;
        document.getElementById('appPlatform').textContent = `${info.platform} (${info.arch})`;
        document.getElementById('processId').textContent = process.pid;
      } catch (error) {
        console.error('获取应用信息失败:', error);
      }
    }

    // 窗口控制
    function minimizeWindow() {
      window.electronAPI.minimize();
    }

    function maximizeWindow() {
      window.electronAPI.maximize();
    }

    function closeWindow() {
      window.electronAPI.close();
    }

    // 监听最大化状态变化
    window.electronAPI.onMaximizedChange((isMaximized) => {
      document.getElementById('windowState').textContent =
        isMaximized ? '已最大化' : '正常';
    });

    // 打开文件
    async function openFile() {
      try {
        const result = await window.electronAPI.showOpenDialog();
        if (!result.canceled && result.filePaths.length > 0) {
          const filePath = result.filePaths[0];
          const fileResult = await window.electronAPI.readFile(filePath);
          if (fileResult.success) {
            document.getElementById('fileContent').textContent = fileResult.content;
          } else {
            alert('读取文件失败: ' + fileResult.error);
          }
        }
      } catch (error) {
        console.error('打开文件失败:', error);
      }
    }

    // 保存文件（简化示例）
    async function saveFile() {
      const content = document.getElementById('fileContent').textContent;
      // 实际应用中应该使用 showSaveDialog 选择保存位置
      console.log('保存内容:', content);
    }

    // 页面加载完成后获取信息
    document.addEventListener('DOMContentLoaded', loadAppInfo);
  </script>
</body>
</html>
```

### 2.3 Context Bridge：安全桥接

Context Bridge 是 Electron 提供的安全机制，用于在渲染进程中安全地访问主进程的 API。

**为什么需要 Context Bridge：**

```
┌─────────────────────────────────────────────────────────────────┐
│  不使用 Context Bridge（不安全）                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  主进程                                                          │
│     │                                                           │
│     │  nodeIntegration: true                                    │
│     │  (渲染进程直接访问 Node.js)                                 │
│     ▼                                                           │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  window.require('fs').readFileSync('/etc/passwd')      │    │
│  │  恶意网页可以直接访问文件系统、网络等所有 Node.js API         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  使用 Context Bridge（安全）                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  主进程                                                          │
│     │                                                           │
│     │  nodeIntegration: false                                   │
│     │  contextIsolation: true                                   │
│     ▼                                                           │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  preload.js 使用 contextBridge.exposeInMainWorld()       │    │
│  │  只暴露明确定义的 API                                      │    │
│  │  恶意网页无法访问 Node.js 原生 API                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**preload.js 完整示例：**

```javascript
// preload.js - 预加载脚本
const { contextBridge, ipcRenderer } = require('electron');

// 安全地暴露 API 到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // ============ 系统信息 ============
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  getPlatform: () => process.platform,

  // ============ 文件操作 ============
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  readDir: (dirPath) => ipcRenderer.invoke('read-dir', dirPath),
  createDir: (dirPath) => ipcRenderer.invoke('create-dir', dirPath),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
  fileExists: (filePath) => ipcRenderer.invoke('file-exists', filePath),

  // ============ 对话框 ============
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),

  // ============ 窗口控制 ============
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  setAlwaysOnTop: (flag) => ipcRenderer.send('window-always-on-top', flag),

  // ============ 系统托盘 ============
  setTrayTooltip: (tooltip) => ipcRenderer.send('tray-tooltip', tooltip),
  setTrayIcon: (iconPath) => ipcRenderer.send('tray-icon', iconPath),

  // ============ 应用控制 ============
  quit: () => ipcRenderer.send('app-quit'),
  relaunch: () => ipcRenderer.send('app-relaunch'),
  getPath: (name) => ipcRenderer.invoke('get-path', name),

  // ============ 剪贴板 ============
  clipboardRead: () => ipcRenderer.invoke('clipboard-read'),
  clipboardWrite: (text) => ipcRenderer.invoke('clipboard-write', text),

  // ============ 事件监听 ============
  onMaximizedChange: (callback) => {
    ipcRenderer.on('maximized-changed', (event, isMaximized) => callback(isMaximized));
  },
  onWindowFocus: (callback) => {
    ipcRenderer.on('window-focus', () => callback());
  },
  onWindowBlur: (callback) => {
    ipcRenderer.on('window-blur', () => callback());
  },
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-action', (event, action) => callback(action));
  },

  // ============ 事件移除 ============
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// 通知渲染进程预加载已完成
window.addEventListener('DOMContentLoaded', () => {
  console.log('Preload script loaded successfully');
});
```

### 2.4 进程隔离：为什么需要

**进程隔离的必要性：**

1. **安全考虑**：渲染进程可能加载不受信任的外部内容，如果能直接访问 Node.js API，可能导致系统被恶意代码控制

2. **稳定性考虑**：渲染进程崩溃不会导致整个应用崩溃，主进程可以重新创建渲染进程

3. **性能考虑**：可以为不同的渲染进程分配不同的资源限制

**安全配置对比：**

```javascript
// main.js - 安全配置
const mainWindow = new BrowserWindow({
  width: 1200,
  height: 800,
  webPreferences: {
    // ============ 安全性配置（推荐） ============

    // 启用上下文隔离
    // 渲染进程的 JavaScript 上下文与 Node.js/主进程完全隔离
    contextIsolation: true,

    // 禁用 Node.js 集成
    // 渲染进程无法直接使用 require() 或 Node.js API
    nodeIntegration: false,

    // 启用安全策略
    // 防止远程内容访问本地资源
    webSecurity: true,

    // 禁用远程模块（已废弃，但仍需注意）
    enableRemoteModule: false,

    // 设置内容来源验证
    // 允许加载的外部脚本白名单
    // contentSecurityPolicy: "default-src 'self'",

    // ============ 可选配置 ============

    // 禁用网站图标获取
    // 防止通过 favicon 判断用户访问历史
    // offscreen: false,

    // Sandbox 模式（实验性）
    // 完全沙箱化渲染进程，无法创建子进程或访问系统
    // sandbox: true,
  }
});

// ============ 危险配置（绝对不要使用） ============
const dangerousWindow = new BrowserWindow({
  webPreferences: {
    // 危险！这会让任何网页都能访问 Node.js
    nodeIntegration: true,
    contextIsolation: false,

    // 危险！这完全禁用了安全策略
    webSecurity: false,
  }
});
```

**我的思考：主从进程设计的原因**

Electron 采用主进程 + 渲染进程的架构设计，并非刻意复杂化，而是由多个实际因素决定：

1. **Chromium 的安全模型**
   - Chromium 设计之初就假设网页可能是恶意的，因此渲染进程运行在沙箱中
   - 需要一个特权进程（主进程）来处理需要更高权限的操作

2. **系统集成需求**
   - 桌面应用需要访问窗口管理、菜单、系统托盘等原生功能
   - 这些 API 不适合在浏览器沙箱中暴露给网页

3. **Node.js 架构限制**
   - Node.js 不是为浏览器环境设计的，其全局对象与 DOM 不兼容
   - 如果在渲染进程中直接启用 Node.js，会导致与 Chromium 的冲突

4. **稳定性和安全性平衡**
   - 将不可信的网页内容隔离在渲染进程中
   - 主进程处理系统级操作，形成安全边界

5. **多窗口支持**
   - 桌面应用通常需要多个窗口
   - 主进程可以统一管理所有窗口的生命周期

---

## 三、桌面应用开发

### 3.1 窗口管理

窗口管理是桌面应用的基础功能，包括创建、关闭、最小化、最大化等操作。

**基础窗口管理：**

```javascript
// main.js - 窗口管理完整示例
const { app, BrowserWindow, screen } = require('electron');
const path = require('path');

let mainWindow = null;

// 创建主窗口
function createMainWindow() {
  // 获取主屏幕尺寸
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    // 窗口尺寸
    width: 1200,
    height: 800,

    // 最小/最大尺寸限制
    minWidth: 400,
    minHeight: 300,
    maxWidth: 1920,
    maxHeight: 1080,

    // 窗口位置（null 表示居中）
    x: undefined,
    y: undefined,

    // 是否显示（false 可用于创建后加载完成再显示）
    show: false,

    // 窗口标题
    title: '我的Electron应用',

    // 背景颜色（页面加载完成前显示）
    backgroundColor: '#1e1e1e',

    // 是否可调整大小
    resizable: true,

    // 是否可移动
    movable: true,

    // 是否有标题栏（false 时使用自定义标题栏）
    frame: true,

    // 是否有阴影（仅 macOS 和 Windows）
    hasShadow: true,

    // 是否透明（需要 ARGB 值）
    // transparent: false,

    // 窗口类型：normal, desktop, dock, menuBar, toolBar, splash
    type: 'normal',

    // macOS 特定：窗口等级
    // level: 'normal',

    // macOS 特定：是否在 Dock 中显示
    // skipTaskbar: false,

    // Windows 特定：是否在任务栏中显示
    // autoHideMenuBar: false,

    // Linux 特定：窗口图标
    // icon: path.join(__dirname, 'icon.png'),

    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // 加载页面
  mainWindow.loadFile('index.html');

  // 窗口准备就绪后显示（避免白屏）
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 监听窗口事件
  setupWindowEvents(mainWindow);

  return mainWindow;
}

// 窗口事件监听
function setupWindowEvents(window) {
  // 窗口最大化状态改变
  window.on('maximize', () => {
    console.log('窗口已最大化');
    // 通知渲染进程
    window.webContents.send('maximized-changed', true);
  });

  window.on('unmaximize', () => {
    console.log('窗口已从最大化状态还原');
    window.webContents.send('maximized-changed', false);
  });

  // 窗口最小化
  window.on('minimize', () => {
    console.log('窗口已最小化');
  });

  // 窗口还原
  window.on('restore', () => {
    console.log('窗口已还原');
    const isMaximized = window.isMaximized();
    window.webContents.send('maximized-changed', isMaximized);
  });

  // 窗口获得焦点
  window.on('focus', () => {
    console.log('窗口获得焦点');
    window.webContents.send('window-focus');
  });

  // 窗口失去焦点
  window.on('blur', () => {
    console.log('窗口失去焦点');
    window.webContents.send('window-blur');
  });

  // 窗口即将关闭（可以取消关闭）
  window.on('close', (event) => {
    console.log('窗口即将关闭');

    // 可以在这里添加确认对话框
    // event.preventDefault();
    // window.webContents.send('confirm-close');
  });

  // 窗口已关闭
  window.on('closed', () => {
    console.log('窗口已关闭');
    mainWindow = null;
  });

  // 页面加载完成
  window.webContents.on('did-finish-load', () => {
    console.log('页面加载完成');
  });

  // 页面加载失败
  window.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('页面加载失败:', errorDescription);
  });
}

// 窗口控制 IPC 处理器
function setupWindowIPC() {
  const { ipcMain } = require('electron');

  // 获取窗口是否最大化
  ipcMain.handle('window-is-maximized', () => {
    return mainWindow ? mainWindow.isMaximized() : false;
  });

  // 设置窗口是否始终在最前
  ipcMain.on('window-always-on-top', (event, flag) => {
    if (mainWindow) {
      mainWindow.setAlwaysOnTop(flag);
    }
  });

  // 获取窗口边界
  ipcMain.handle('window-get-bounds', () => {
    return mainWindow ? mainWindow.getBounds() : null;
  });

  // 设置窗口边界
  ipcMain.handle('window-set-bounds', (event, bounds) => {
    if (mainWindow) {
      mainWindow.setBounds(bounds);
      return true;
    }
    return false;
  });

  // 获取内容边界（不含标题栏）
  ipcMain.handle('window-get-content-bounds', () => {
    return mainWindow ? mainWindow.getContentBounds() : null;
  });

  // 设置窗口标题
  ipcMain.on('window-set-title', (event, title) => {
    if (mainWindow) {
      mainWindow.setTitle(title);
    }
  });

  // 获取窗口标题
  ipcMain.handle('window-get-title', () => {
    return mainWindow ? mainWindow.getTitle() : '';
  });

  // 聚焦窗口
  ipcMain.on('window-focus', () => {
    if (mainWindow) {
      mainWindow.focus();
    }
  });

  // 取消聚焦
  ipcMain.on('window-blur', () => {
    if (mainWindow) {
      mainWindow.blur();
    }
  });

  // 最大化窗口
  ipcMain.on('window-maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  // 最小化窗口
  ipcMain.on('window-minimize', () => {
    if (mainWindow) {
      mainWindow.minimize();
    }
  });

  // 还原窗口
  ipcMain.on('window-restore', () => {
    if (mainWindow) {
      mainWindow.restore();
    }
  });

  // 关闭窗口
  ipcMain.on('window-close', () => {
    if (mainWindow) {
      mainWindow.close();
    }
  });
}

// 应用启动
app.whenReady().then(() => {
  createMainWindow();
  setupWindowIPC();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

**窗口状态持久化示例：**

```javascript
// window-state.js - 窗口状态管理
const { app, BrowserWindow, screen } = require('electron');
const fs = require('fs');
const path = require('path');

class WindowStateManager {
  constructor(windowName, defaultBounds) {
    this.windowName = windowName;
    this.defaultBounds = defaultBounds;
    this.stateFile = path.join(
      app.getPath('userData'),
      `window-state-${windowName}.json`
    );
    this.state = this.load();
  }

  // 加载保存的窗口状态
  load() {
    try {
      if (fs.existsSync(this.stateFile)) {
        const data = fs.readFileSync(this.stateFile, 'utf-8');
        const state = JSON.parse(data);
        console.log('已加载窗口状态:', state);
        return this.validateState(state);
      }
    } catch (error) {
      console.error('加载窗口状态失败:', error);
    }
    return this.getDefaultState();
  }

  // 验证窗口状态是否有效
  validateState(state) {
    const defaultState = this.getDefaultState();

    // 验证宽高
    if (state.width < defaultState.minWidth || state.height < defaultState.minHeight) {
      return defaultState;
    }

    // 验证是否在屏幕范围内
    const displays = screen.getAllDisplays();
    const isOnScreen = displays.some(display => {
      const { x, y, width, height } = display.bounds;
      return (
        state.x >= x &&
        state.y >= y &&
        state.x + state.width <= x + width &&
        state.y + state.height <= y + height
      );
    });

    if (!isOnScreen) {
      return defaultState;
    }

    return state;
  }

  // 获取默认状态
  getDefaultState() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    return {
      x: undefined,  // undefined 表示居中
      y: undefined,
      width: Math.min(1200, width - 100),
      height: Math.min(800, height - 100),
      isMaximized: false,
      minWidth: 400,
      minHeight: 300
    };
  }

  // 保存窗口状态
  save() {
    try {
      if (this.stateFile) {
        const state = {
          x: this.state.x,
          y: this.state.y,
          width: this.state.width,
          height: this.state.height,
          isMaximized: this.state.isMaximized
        };
        fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
        console.log('窗口状态已保存');
      }
    } catch (error) {
      console.error('保存窗口状态失败:', error);
    }
  }

  // 获取当前状态
  get() {
    return this.state;
  }

  // 更新状态
  update(state) {
    this.state = { ...this.state, ...state };
  }

  // 跟踪窗口状态
  track(window) {
    const updateState = () => {
      if (!window.isMaximized() && !window.isMinimized()) {
        this.state.x = window.getBounds().x;
        this.state.y = window.getBounds().y;
        this.state.width = window.getBounds().width;
        this.state.height = window.getBounds().height;
      }
      this.state.isMaximized = window.isMaximized();
    };

    ['resize', 'move', 'maximize', 'unmaximize'].forEach(event => {
      window.on(event, updateState);
    });

    window.on('close', () => {
      updateState();
      this.save();
    });
  }
}

module.exports = WindowStateManager;
```

### 3.2 系统托盘

系统托盘是在桌面后台运行的图标，提供快捷访问功能。

**托盘功能完整示例：**

```javascript
// main.js - 系统托盘实现
const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } = require('electron');
const path = require('path');

let mainWindow = null;
let tray = null;

// 创建系统托盘
function createTray() {
  // 创建托盘图标（使用 16x16 或 32x32 的小图标）
  // 创建空白图标示例（实际应用中应使用真实的图标文件）
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAADASURBVDiNrdMxDsIwDEXhN5R0dHR0dJTR0UXEBXABHAAXwAF0dHR0dHR0gDYWYIMLCRofsmM7dvI4ToAmfCTb8/N4t0ASQgg/hJQywBi1Ukp1AIwxh7c7AKy15xDH0+kwxvA8T9M0TdM0TfM8b9ZxvF4ul4vBYDC8Xq/X8/n8fr/f7/f7/X6/3+/3+/1+v9/v9/v9fr/f7/f7/X6/3+/3+/1+v9/v9/v9fr/f7/f7/X6/3+/3+/1+v9/v9/v9fr/f7/f7/X6/3+/3+/1+v9/v9/v9fr/f7/f7/X6/3+/3+/1+v9/v9/v9fr/f7/f7/X6/3+/3+/1+v9/v9/v9fr/f7/f7/X6/3+/3+/1+v9/v9/v9fr/f7/f7/X6/3+/3+/1+v9/v9/v9fr/f7/f7/X6/3+/3+/1+v9/v9/v9fgB+YxZ6l7x8YgAAAABJRU5ErkJggg=='
  );

  tray = new Tray(icon);

  // 设置托盘提示文字
  tray.setToolTip('我的Electron应用');

  // 创建托盘菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主窗口',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: '隐藏主窗口',
      click: () => {
        if (mainWindow) {
          mainWindow.hide();
        }
      }
    },
    { type: 'separator' },
    {
      label: '功能菜单',
      submenu: [
        {
          label: '新建文档',
          accelerator: 'CmdOrCtrl+N',  // 快捷键
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-action', 'new-document');
            }
          }
        },
        {
          label: '打开文件',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-action', 'open-file');
            }
          }
        },
        {
          label: '保存',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-action', 'save');
            }
          }
        }
      ]
    },
    { type: 'separator' },
    {
      label: '关于',
      click: () => {
        const { dialog } = require('electron');
        dialog.showMessageBox({
          type: 'info',
          title: '关于',
          message: '我的Electron应用',
          detail: `版本: ${app.getVersion()}\nElectron: ${process.versions.electron}\nChrome: ${process.versions.chrome}\nNode.js: ${process.versions.node}`
        });
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      accelerator: 'CmdOrCtrl+Q',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  // 双击托盘图标显示窗口
  tray.on('double-click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
      }
    }
  });

  // 单击托盘图标
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    }
  });

  // 鼠标悬停显示提示
  tray.on('hover', (event) => {
    tray.setToolTip('我的Electron应用 - 点击显示/隐藏');
  });
}

// 托盘 IPC 处理器
function setupTrayIPC() {
  // 设置托盘提示文字
  ipcMain.on('tray-tooltip', (event, tooltip) => {
    if (tray) {
      tray.setToolTip(tooltip);
    }
  });

  // 设置托盘图标
  ipcMain.on('tray-icon', (event, iconPath) => {
    if (tray) {
      const icon = nativeImage.createFromPath(iconPath);
      tray.setImage(icon);
    }
  });

  // 显示托盘通知
  ipcMain.on('tray-notification', (event, { title, body }) => {
    if (tray) {
      const { Notification } = require('electron');
      if (Notification.isSupported()) {
        new Notification({ title, body }).show();
      }
    }
  });
}
```

### 3.3 菜单栏

菜单栏包括应用菜单、上下文菜单（右键菜单）等。

**完整菜单实现：**

```javascript
// main.js - 菜单栏实现
const { app, BrowserWindow, Menu, MenuItem, shell, ipcMain } = require('electron');

// 创建应用菜单
function createAppMenu() {
  const isMac = process.platform === 'darwin';

  // macOS 的应用菜单结构
  const macOSMenuTemplate = [
    {
      label: app.name,  // 显示应用名称
      submenu: [
        { role: 'about' },  // 关于
        { type: 'separator' },
        { role: 'services' },  // 服务
        { type: 'separator' },
        { role: 'hide' },  // 隐藏应用
        { role: 'hideOthers' },  // 隐藏其他
        { role: 'unhide' },  // 显示全部
        { type: 'separator' },
        { role: 'quit' }  // 退出
      ]
    },
    {
      label: '文件',
      submenu: [
        {
          label: '新建窗口',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => {
            // 创建新窗口
            createNewWindow();
          }
        },
        { type: 'separator' },
        {
          label: '新建文档',
          accelerator: 'CmdOrCtrl+N',
          click: () => sendToRenderer('menu-action', 'new-document')
        },
        {
          label: '打开文件',
          accelerator: 'CmdOrCtrl+O',
          click: () => sendToRenderer('menu-action', 'open-file')
        },
        { type: 'separator' },
        {
          label: '保存',
          accelerator: 'CmdOrCtrl+S',
          click: () => sendToRenderer('menu-action', 'save')
        },
        {
          label: '另存为',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => sendToRenderer('menu-action', 'save-as')
        },
        { type: 'separator' },
        {
          label: '页面设置',
          click: () => sendToRenderer('menu-action', 'page-setup')
        },
        {
          label: '打印',
          accelerator: 'CmdOrCtrl+P',
          click: () => sendToRenderer('menu-action', 'print')
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo' },  // 撤销
        { role: 'redo' },  // 重做
        { type: 'separator' },
        { role: 'cut' },  // 剪切
        { role: 'copy' },  // 复制
        { role: 'paste' },  // 粘贴
        { role: 'delete' },  // 删除
        { type: 'separator' },
        { role: 'selectAll' }  // 全选
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload' },  // 重新加载
        { role: 'forceReload' },  // 强制重新加载
        { role: 'toggleDevTools' },  // 开发者工具
        { type: 'separator' },
        { role: 'resetZoom' },  // 实际大小
        { role: 'zoomIn' },  // 放大
        { role: 'zoomOut' },  // 缩小
        { type: 'separator' },
        { role: 'togglefullscreen' }  // 全屏
      ]
    },
    {
      label: '窗口',
      submenu: [
        { role: 'minimize' },  // 最小化
        { role: 'zoom' },  // 缩放
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },  // 全部置于顶层
          { type: 'separator' },
          { role: 'window' }  // 窗口菜单
        ] : [
          { role: 'close' }  // 关闭
        ])
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '学习Electron',
          click: async () => {
            await shell.openExternal('https://www.electronjs.org/docs');
          }
        },
        {
          label: '关于',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox({
              type: 'info',
              title: '关于 Electron 应用',
              message: 'Electron 应用示例',
              detail: `版本: ${app.getVersion()}\nElectron: ${process.versions.electron}`
            });
          }
        }
      ]
    }
  ];

  // Windows/Linux 的菜单结构
  const windowsMenuTemplate = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建文档',
          accelerator: 'CmdOrCtrl+N',
          click: () => sendToRenderer('menu-action', 'new-document')
        },
        {
          label: '打开文件',
          accelerator: 'CmdOrCtrl+O',
          click: () => sendToRenderer('menu-action', 'open-file')
        },
        { type: 'separator' },
        {
          label: '保存',
          accelerator: 'CmdOrCtrl+S',
          click: () => sendToRenderer('menu-action', 'save')
        },
        {
          label: '另存为',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => sendToRenderer('menu-action', 'save-as')
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: '窗口',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '学习Electron',
          click: async () => {
            await shell.openExternal('https://www.electronjs.org/docs');
          }
        }
      ]
    }
  ];

  // 根据平台选择菜单模板
  const menuTemplate = isMac ? macOSMenuTemplate : windowsMenuTemplate;

  // 构建菜单
  const menu = Menu.buildFromTemplate(menuTemplate);

  // 设置为应用菜单
  Menu.setApplicationMenu(menu);
}

// 创建上下文菜单（右键菜单）
function createContextMenu() {
  return Menu.buildFromTemplate([
    {
      label: '剪切',
      accelerator: 'CmdOrCtrl+X',
      role: 'cut'
    },
    {
      label: '复制',
      accelerator: 'CmdOrCtrl+C',
      role: 'copy'
    },
    {
      label: '粘贴',
      accelerator: 'CmdOrCtrl+V',
      role: 'paste'
    },
    { type: 'separator' },
    {
      label: '全选',
      accelerator: 'CmdOrCtrl+A',
      role: 'selectAll'
    },
    { type: 'separator' },
    {
      label: '自定义功能',
      submenu: [
        {
          label: '在新窗口中打开链接',
          click: () => sendToRenderer('context-menu', 'open-link')
        },
        {
          label: '复制链接地址',
          click: () => sendToRenderer('context-menu', 'copy-link')
        },
        { type: 'separator' },
        {
          label: '检查元素',
          click: () => sendToRenderer('context-menu', 'inspect')
        }
      ]
    }
  ]);
}

// 发送消息到渲染进程
function sendToRenderer(channel, ...args) {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow) {
    focusedWindow.webContents.send(channel, ...args);
  }
}

// 导出上下文菜单供渲染进程使用
function setupContextMenuIPC() {
  ipcMain.handle('show-context-menu', () => {
    const contextMenu = createContextMenu();
    contextMenu.popup();
  });
}
```

**渲染进程中的右键菜单：**

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>上下文菜单示例</title>
</head>
<body>
  <div id="content">在此区域右键点击显示自定义菜单</div>
  <a href="https://example.com" id="link">这是一个链接</a>

  <script>
    // 自定义右键菜单
    document.addEventListener('contextmenu', (event) => {
      event.preventDefault();

      // 检查是否在特定元素上
      const isLink = event.target.tagName === 'A' || event.target.closest('a');

      // 创建自定义菜单
      const menu = new Menu();

      if (isLink) {
        // 链接元素的菜单
        menu.append(new MenuItem({
          label: '在新窗口中打开',
          click: () => {
            const href = event.target.href || event.target.closest('a').href;
            window.open(href, '_blank');
          }
        }));
        menu.append(new MenuItem({
          label: '复制链接地址',
          click: () => {
            const href = event.target.href || event.target.closest('a').href;
            navigator.clipboard.writeText(href);
          }
        }));
      } else {
        // 普通文本的菜单
        menu.append(new MenuItem({
          label: '剪切',
          role: 'cut',
          enabled: window.getSelection().toString().length > 0
        }));
        menu.append(new MenuItem({
          label: '复制',
          role: 'copy',
          enabled: window.getSelection().toString().length > 0
        }));
        menu.append(new MenuItem({
          label: '粘贴',
          role: 'paste'
        }));
        menu.append(new MenuItem({ type: 'separator' }));
        menu.append(new MenuItem({
          label: '全选',
          role: 'selectAll'
        }));
      }

      menu.popup();
    });

    // 监听来自主进程的菜单动作
    window.electronAPI.onMenuAction((action) => {
      console.log('菜单动作:', action);
      switch (action) {
        case 'new-document':
          console.log('新建文档');
          break;
        case 'open-file':
          openFile();
          break;
        case 'save':
          console.log('保存');
          break;
      }
    });
  </script>
</body>
</html>
```

### 3.4 拖拽与文件操作

**文件拖拽实现：**

```javascript
// main.js - 文件拖拽处理
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

function setupDragDropIPC() {
  // 处理文件拖拽到窗口
  ipcMain.on('ondragstart', (event, filePath) => {
    // 创建拖拽项
    event.sender.startDrag({
      file: filePath,
      icon: path.join(__dirname, 'drag-icon.png')  // 需要提供拖拽图标
    });
  });

  // 获取拖拽文件信息
  ipcMain.handle('get-drag-file-info', async (event, filePath) => {
    try {
      const stats = await fs.promises.stat(filePath);
      return {
        name: path.basename(filePath),
        path: filePath,
        size: stats.size,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        modifiedTime: stats.mtime,
        createdTime: stats.birthtime
      };
    } catch (error) {
      return { error: error.message };
    }
  });

  // 读取拖拽的文件内容
  ipcMain.handle('read-drag-file', async (event, filePath) => {
    try {
      const content = await fs.promises.readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      return {
        content: content.toString('base64'),  // 返回 base64
        ext,
        name: path.basename(filePath)
      };
    } catch (error) {
      return { error: error.message };
    }
  });
}

// 在 BrowserWindow 中启用拖拽区域
// 需要在窗口配置中设置
const mainWindow = new BrowserWindow({
  webPreferences: {
    // 允许拖拽文件
    webSecurity: true
  }
});
```

```html
<!-- index.html - 拖拽区域 -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>文件拖拽示例</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; padding: 20px; background: #1e1e1e; color: #fff; }
    .drop-zone {
      border: 3px dashed #61dafb;
      border-radius: 10px;
      padding: 50px;
      text-align: center;
      margin: 20px 0;
      transition: all 0.3s;
    }
    .drop-zone.dragover {
      background: rgba(97, 218, 251, 0.1);
      border-color: #2ecc71;
    }
    .file-info { background: #2d2d2d; padding: 15px; border-radius: 8px; margin-top: 20px; }
    .file-item { padding: 10px; border-bottom: 1px solid #3d3d3d; }
    .file-item:last-child { border-bottom: none; }
    .file-name { color: #61dafb; font-weight: bold; }
    .file-size { color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <h1>文件拖拽示例</h1>

  <!-- 拖拽目标区域 -->
  <div class="drop-zone" id="dropZone">
    <p>将文件或文件夹拖拽到此处</p>
    <p style="color: #888; font-size: 14px;">支持文件: txt, md, json, js, css, html</p>
  </div>

  <!-- 文件列表 -->
  <div id="fileList" class="file-info" style="display: none;">
    <h3>已拖拽文件:</h3>
    <div id="files"></div>
  </div>

  <!-- 拖拽区域元素 -->
  <div id="draggable" style="padding: 20px; background: #61dafb; color: #000; display: inline-block; cursor: move;">
    可拖拽元素（拖动此元素）
  </div>

  <script>
    const dropZone = document.getElementById('dropZone');
    const fileList = document.getElementById('fileList');
    const filesContainer = document.getElementById('files');

    // 阻止默认行为
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, preventDefaults, false);
      document.body.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // 高亮拖拽区域
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => {
        dropZone.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => {
        dropZone.classList.remove('dragover');
      }, false);
    });

    // 处理拖放
    dropZone.addEventListener('drop', async (e) => {
      const files = e.dataTransfer.files;
      const items = e.dataTransfer.items;

      if (files.length > 0) {
        // 处理文件
        for (const file of files) {
          await handleFile(file.path || file.name, file);
        }
      } else if (items) {
        // 处理拖拽项（可能包含文件路径）
        for (const item of items) {
          if (item.kind === 'file') {
            const file = item.getAsFile();
            await handleFile(file.path || file.name, file);
          }
        }
      }
    });

    // 处理单个文件
    async function handleFile(filePath, file) {
      console.log('处理文件:', filePath);

      // 显示文件信息
      fileList.style.display = 'block';
      const fileItem = document.createElement('div');
      fileItem.className = 'file-item';
      fileItem.innerHTML = `
        <div class="file-name">${file.name || path.basename(filePath)}</div>
        <div class="file-size">大小: ${formatFileSize(file.size)}</div>
        <div class="file-size">类型: ${file.type || 'unknown'}</div>
      `;
      filesContainer.appendChild(fileItem);

      // 读取文件内容
      if (window.electronAPI) {
        const result = await window.electronAPI.readFile(filePath);
        if (result.success) {
          console.log('文件内容:', result.content.substring(0, 100) + '...');
        }
      }
    }

    // 格式化文件大小
    function formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 可拖拽元素的拖拽开始
    document.getElementById('draggable').addEventListener('dragstart', (e) => {
      // 设置拖拽数据
      e.dataTransfer.setData('text/plain', '这是一个可拖拽的元素');
      e.dataTransfer.effectAllowed = 'copy';

      // 如果需要拖拽文件
      if (window.electronAPI) {
        const filePath = '/path/to/file.txt';  // 替换为实际文件路径
        e.sender.startDrag({
          file: filePath,
          icon: 'drag-icon.png'
        });
      }
    });
  </script>
</body>
</html>
```

### 3.5 实战：记事本应用

**完整的记事本应用示例：**

```javascript
// main.js - 记事本应用主进程
const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let currentFilePath = null;

// 创建窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 400,
    minHeight: 300,
    title: '记事本',
    backgroundColor: '#1e1e1e',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');

  // 窗口关闭时询问是否保存
  mainWindow.on('close', (e) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      showSaveDialog();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 是否有未保存的更改
let hasUnsavedChanges = false;

// 设置菜单
function createMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建',
          accelerator: 'CmdOrCtrl+N',
          click: () => newFile()
        },
        {
          label: '打开',
          accelerator: 'CmdOrCtrl+O',
          click: () => openFile()
        },
        {
          label: '保存',
          accelerator: 'CmdOrCtrl+S',
          click: () => saveFile()
        },
        {
          label: '另存为',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => saveFileAs()
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' }
      ]
    },
    {
      label: '格式',
      submenu: [
        {
          label: '自动换行',
          type: 'checkbox',
          checked: true,
          click: (menuItem) => {
            mainWindow.webContents.send('toggle-word-wrap', menuItem.checked);
          }
        }
      ]
    },
    {
      label: '查看',
      submenu: [
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'resetZoom' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 新建文件
function newFile() {
  if (hasUnsavedChanges) {
    showSaveDialog(() => {
      currentFilePath = null;
      mainWindow.webContents.send('new-file');
    });
  } else {
    currentFilePath = null;
    mainWindow.webContents.send('new-file');
  }
}

// 打开文件
async function openFile() {
  if (hasUnsavedChanges) {
    const result = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: ['保存', '不保存', '取消'],
      defaultId: 0,
      title: '打开文件',
      message: '当前文件有未保存的更改，是否保存？'
    });

    if (result.response === 0) {
      await saveFile();
    } else if (result.response === 2) {
      return;
    }
  }

  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: '文本文件', extensions: ['txt', 'md', 'js', 'css', 'html', 'json'] },
      { name: '所有文件', extensions: ['*'] }
    ]
  });

  if (!canceled && filePaths.length > 0) {
    const filePath = filePaths[0];
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      currentFilePath = filePath;
      mainWindow.webContents.send('file-opened', { path: filePath, content });
    } catch (error) {
      dialog.showErrorBox('错误', `无法打开文件: ${error.message}`);
    }
  }
}

// 保存文件
async function saveFile() {
  if (currentFilePath) {
    mainWindow.webContents.send('request-save-content');
  } else {
    await saveFileAs();
  }
}

// 另存为
async function saveFileAs() {
  mainWindow.webContents.send('request-save-content');
}

// 显示保存对话框
async function showSaveDialog(callback) {
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: ['保存', '不保存', '取消'],
    defaultId: 0,
    title: '保存更改',
    message: '是否保存当前更改？'
  });

  if (result.response === 0) {
    await saveFile();
    if (callback) callback();
  } else if (result.response === 1) {
    hasUnsavedChanges = false;
    if (callback) callback();
  }
}

// IPC 处理器
function setupIPC() {
  ipcMain.handle('save-content', async (event, { content, filePath }) => {
    const savePath = filePath || currentFilePath;

    if (!savePath) {
      const result = await dialog.showSaveDialog(mainWindow, {
        filters: [
          { name: '文本文件', extensions: ['txt'] },
          { name: '所有文件', extensions: ['*'] }
        ]
      });

      if (result.canceled) {
        return { success: false, canceled: true };
      }

      currentFilePath = result.filePath;
    } else {
      currentFilePath = savePath;
    }

    try {
      await fs.promises.writeFile(currentFilePath, content, 'utf-8');
      hasUnsavedChanges = false;
      mainWindow.setTitle(`记事本 - ${path.basename(currentFilePath)}`);
      return { success: true, filePath: currentFilePath };
    } catch (error) {
      dialog.showErrorBox('错误', `无法保存文件: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  ipcMain.on('content-changed', () => {
    hasUnsavedChanges = true;
    const title = currentFilePath
      ? `记事本 - ${path.basename(currentFilePath)} *`
      : '记事本 *';
    mainWindow.setTitle(title);
  });

  ipcMain.handle('get-current-file', () => {
    return currentFilePath;
  });
}

// 应用启动
app.whenReady().then(() => {
  createWindow();
  createMenu();
  setupIPC();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

```html
<!-- index.html - 记事本界面 -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>记事本</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
      background: #1e1e1e;
      color: #fff;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .toolbar {
      background: #2d2d2d;
      padding: 8px 15px;
      display: flex;
      gap: 10px;
      border-bottom: 1px solid #3d3d3d;
    }
    .toolbar button {
      padding: 6px 12px;
      background: #3d3d3d;
      border: none;
      border-radius: 4px;
      color: #fff;
      cursor: pointer;
      font-size: 13px;
      transition: background 0.2s;
    }
    .toolbar button:hover { background: #4d4d4d; }
    .toolbar button:active { background: #5d5d5d; }
    .editor-container {
      flex: 1;
      display: flex;
    }
    .line-numbers {
      background: #252526;
      color: #858585;
      padding: 10px 15px;
      text-align: right;
      user-select: none;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 14px;
      line-height: 1.6;
      min-width: 50px;
      overflow: hidden;
    }
    textarea {
      flex: 1;
      background: #1e1e1e;
      color: #d4d4d4;
      border: none;
      padding: 10px;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 14px;
      line-height: 1.6;
      resize: none;
      outline: none;
    }
    textarea::placeholder { color: #6a6a6a; }
    .statusbar {
      background: #007acc;
      padding: 4px 15px;
      font-size: 12px;
      display: flex;
      justify-content: space-between;
    }
    .word-count { color: #fff; }
    .status { color: #fff; }
  </style>
</head>
<body>
  <div class="toolbar">
    <button onclick="newFile()">新建</button>
    <button onclick="openFile()">打开</button>
    <button onclick="saveFile()">保存</button>
    <button onclick="saveFileAs()">另存为</button>
  </div>

  <div class="editor-container">
    <div class="line-numbers" id="lineNumbers">1</div>
    <textarea
      id="editor"
      placeholder="在此输入内容..."
      spellcheck="false"
    ></textarea>
  </div>

  <div class="statusbar">
    <span class="status" id="status">就绪</span>
    <span class="word-count" id="wordCount">字数: 0</span>
  </div>

  <script>
    const editor = document.getElementById('editor');
    const lineNumbers = document.getElementById('lineNumbers');
    const wordCount = document.getElementById('wordCount');
    const status = document.getElementById('status');
    let wordWrap = true;

    // 更新行号
    function updateLineNumbers() {
      const lines = editor.value.split('\n').length;
      const numbers = [];
      for (let i = 1; i <= lines; i++) {
        numbers.push(i);
      }
      lineNumbers.textContent = numbers.join('\n');
    }

    // 更新字数统计
    function updateWordCount() {
      const text = editor.value.trim();
      const chars = text.length;
      const words = text ? text.split(/\s+/).length : 0;
      wordCount.textContent = `字数: ${chars} | 词数: ${words}`;
    }

    // 文本变化监听
    editor.addEventListener('input', () => {
      updateLineNumbers();
      updateWordCount();
      if (window.electronAPI) {
        window.electronAPI.contentChanged();
      }
    });

    // Tab 键处理
    editor.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        editor.value = editor.value.substring(0, start) + '    ' + editor.value.substring(end);
        editor.selectionStart = editor.selectionEnd = start + 4;
        updateLineNumbers();
      }
    });

    // 滚动同步
    editor.addEventListener('scroll', () => {
      lineNumbers.scrollTop = editor.scrollTop;
    });

    // 新建文件
    function newFile() {
      editor.value = '';
      updateLineNumbers();
      updateWordCount();
      status.textContent = '新建文件';
    }

    // 打开文件（通过 IPC）
    async function openFile() {
      if (window.electronAPI) {
        const result = await window.electronAPI.showOpenDialog({
          properties: ['openFile'],
          filters: [
            { name: '文本文件', extensions: ['txt', 'md', 'js', 'css', 'html', 'json'] },
            { name: '所有文件', extensions: ['*'] }
          ]
        });

        if (!result.canceled && result.filePaths.length > 0) {
          const filePath = result.filePaths[0];
          const fileResult = await window.electronAPI.readFile(filePath);
          if (fileResult.success) {
            editor.value = fileResult.content;
            updateLineNumbers();
            updateWordCount();
            status.textContent = `已打开: ${filePath}`;
          }
        }
      }
    }

    // 保存文件（通过 IPC）
    async function saveFile() {
      if (window.electronAPI) {
        const currentFile = await window.electronAPI.getCurrentFile();
        const result = await window.electronAPI.saveContent({
          content: editor.value,
          filePath: currentFile
        });

        if (result.success) {
          status.textContent = `已保存: ${result.filePath}`;
        }
      }
    }

    // 另存为
    async function saveFileAs() {
      if (window.electronAPI) {
        const result = await window.electronAPI.showSaveDialog({
          filters: [
            { name: '文本文件', extensions: ['txt'] },
            { name: '所有文件', extensions: ['*'] }
          ]
        });

        if (!result.canceled) {
          const saveResult = await window.electronAPI.saveContent({
            content: editor.value,
            filePath: result.filePath
          });

          if (saveResult.success) {
            status.textContent = `已保存: ${saveResult.filePath}`;
          }
        }
      }
    }

    // 监听主进程消息
    if (window.electronAPI) {
      window.electronAPI.onMenuAction((action) => {
        switch (action) {
          case 'new-document':
            newFile();
            break;
          case 'open-file':
            openFile();
            break;
          case 'save':
            saveFile();
            break;
          case 'save-as':
            saveFileAs();
            break;
        }
      });

      window.electronAPI.onToggleWordWrap((enabled) => {
        wordWrap = enabled;
        editor.style.whiteSpace = enabled ? 'pre-wrap' : 'pre';
      });
    }

    // 初始化
    updateLineNumbers();
    updateWordCount();
  </script>
</body>
</html>
```

---

## 四、Node.js集成

### 4.1 原生模块调用

Electron 的主进程可以调用 Node.js 的所有原生模块和 npm 包。

**原生模块使用示例：**

```javascript
// main.js - 原生模块调用
const { app, ipcMain } = require('electron');
const fs = require('fs');           // 文件系统
const path = require('path');       // 路径处理
const os = require('os');           // 操作系统信息
const crypto = require('crypto');   // 加密
const { exec, spawn } = require('child_process');  // 子进程

// ============ 文件系统操作 ============
async function setupFileSystemIPC() {
  // 读取文件
  ipcMain.handle('fs-read-file', async (event, filePath, options = 'utf-8') => {
    try {
      const content = await fs.promises.readFile(filePath, options);
      return { success: true, content };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 写入文件
  ipcMain.handle('fs-write-file', async (event, filePath, content, options = 'utf-8') => {
    try {
      await fs.promises.writeFile(filePath, content, options);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 追加内容
  ipcMain.handle('fs-append-file', async (event, filePath, content) => {
    try {
      await fs.promises.appendFile(filePath, content);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 读取目录
  ipcMain.handle('fs-read-dir', async (event, dirPath) => {
    try {
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
      const items = entries.map(entry => ({
        name: entry.name,
        isFile: entry.isFile(),
        isDirectory: entry.isDirectory(),
        isSymbolicLink: entry.isSymbolicLink()
      }));
      return { success: true, items };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 创建目录
  ipcMain.handle('fs-create-dir', async (event, dirPath) => {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 删除文件
  ipcMain.handle('fs-delete-file', async (event, filePath) => {
    try {
      await fs.promises.unlink(filePath);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 删除目录
  ipcMain.handle('fs-delete-dir', async (event, dirPath) => {
    try {
      await fs.promises.rmdir(dirPath, { recursive: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 复制文件
  ipcMain.handle('fs-copy-file', async (event, src, dest) => {
    try {
      await fs.promises.copyFile(src, dest);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 移动文件
  ipcMain.handle('fs-move-file', async (event, src, dest) => {
    try {
      await fs.promises.rename(src, dest);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 获取文件信息
  ipcMain.handle('fs-stat', async (event, filePath) => {
    try {
      const stats = await fs.promises.stat(filePath);
      return {
        success: true,
        stats: {
          size: stats.size,
          isFile: stats.isFile(),
          isDirectory: stats.isDirectory(),
          created: stats.birthtime,
          modified: stats.mtime,
          accessed: stats.atime
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 检查路径是否存在
  ipcMain.handle('fs-exists', async (event, filePath) => {
    return fs.existsSync(filePath);
  });
}

// ============ 系统信息 ============
function setupSystemIPC() {
  ipcMain.handle('system-info', () => {
    return {
      platform: os.platform(),        // 'darwin', 'freebsd', 'linux', 'win32'
      arch: os.arch(),                 // 'x64', 'arm64'
      release: os.release(),          // 系统版本
      type: os.type(),                 // 'Windows_NT', 'Darwin', 'Linux'
      hostname: os.hostname(),         // 主机名
      homedir: os.homedir(),           // 用户主目录
      tmpdir: os.tmpdir(),             // 临时目录
      cpus: os.cpus(),                 // CPU 信息
      memory: {
        total: os.totalmem(),          // 总内存
        free: os.freemem(),            // 空闲内存
        used: os.totalmem() - os.freemir()
      },
      networkInterfaces: os.networkInterfaces(),  // 网络接口
      uptime: os.uptime()              // 系统运行时间
    };
  });

  // 获取 CPU 负载
  ipcMain.handle('system-cpu-load', () => {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    return {
      idle: totalIdle / cpus.length,
      total: totalTick / cpus.length,
      load: 1 - totalIdle / totalTick
    };
  });

  // 获取内存使用
  ipcMain.handle('system-memory', () => {
    const total = os.totalmem();
    const free = os.freemem();
    return {
      total: total,
      free: free,
      used: total - free,
      usedPercent: ((total - free) / total * 100).toFixed(2)
    };
  });
}

// ============ 加密功能 ============
function setupCryptoIPC() {
  ipcMain.handle('crypto-md5', async (event, content) => {
    return crypto.createHash('md5').update(content).digest('hex');
  });

  ipcMain.handle('crypto-sha256', async (event, content) => {
    return crypto.createHash('sha256').update(content).digest('hex');
  });

  ipcMain.handle('crypto-random', async (event, length = 32) => {
    return crypto.randomBytes(length).toString('hex');
  });

  ipcMain.handle('crypto-aes-encrypt', async (event, content, password) => {
    const key = crypto.scryptSync(password, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    let encrypted = cipher.update(content, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encrypted,
      iv: iv.toString('hex')
    };
  });

  ipcMain.handle('crypto-aes-decrypt', async (event, encrypted, password, iv) => {
    try {
      const key = crypto.scryptSync(password, 'salt', 32);
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        key,
        Buffer.from(iv, 'hex')
      );

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return { success: true, decrypted };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

// ============ 子进程执行 ============
function setupChildProcessIPC() {
  // 执行命令
  ipcMain.handle('exec-command', async (event, command, options = {}) => {
    return new Promise((resolve) => {
      exec(command, {
        encoding: 'utf8',
        timeout: options.timeout || 30000,
        ...options
      }, (error, stdout, stderr) => {
        if (error) {
          resolve({
            success: false,
            error: error.message,
            stderr
          });
        } else {
          resolve({
            success: true,
            stdout,
            stderr
          });
        }
      });
    });
  });

  // 生成子进程
  ipcMain.handle('spawn-process', async (event, command, args, options = {}) => {
    return new Promise((resolve) => {
      const child = spawn(command, args, {
        shell: true,
        ...options
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          success: code === 0,
          code,
          stdout,
          stderr
        });
      });

      child.on('error', (error) => {
        resolve({
          success: false,
          error: error.message
        });
      });
    });
  });
}
```

### 4.2 SQLite数据库集成

```javascript
// database.js - SQLite 数据库封装
const { app } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');

class AppDatabase {
  constructor() {
    this.db = null;
  }

  // 初始化数据库
  initialize() {
    const dbPath = path.join(app.getPath('userData'), 'appdata.db');
    console.log('数据库路径:', dbPath);

    this.db = new Database(dbPath);

    // 启用 WAL 模式提高并发性能
    this.db.pragma('journal_mode = WAL');

    // 创建表
    this.createTables();

    return this;
  }

  // 创建数据表
  createTables() {
    // 用户表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT,
        password_hash TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 文档表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // 设置表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('数据表创建完成');
  }

  // ============ 用户操作 ============

  // 创建用户
  createUser(username, email, passwordHash) {
    const stmt = this.db.prepare(`
      INSERT INTO users (username, email, password_hash)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(username, email, passwordHash);
    return result.lastInsertRowid;
  }

  // 获取用户
  getUser(id) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  }

  // 获取用户（按用户名）
  getUserByUsername(username) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
  }

  // 获取所有用户
  getAllUsers() {
    const stmt = this.db.prepare('SELECT * FROM users');
    return stmt.all();
  }

  // 更新用户
  updateUser(id, { username, email }) {
    const stmt = this.db.prepare(`
      UPDATE users
      SET username = ?, email = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(username, email, id);
  }

  // 删除用户
  deleteUser(id) {
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
    return stmt.run(id);
  }

  // ============ 文档操作 ============

  // 创建文档
  createDocument(title, content, userId) {
    const stmt = this.db.prepare(`
      INSERT INTO documents (title, content, user_id)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(title, content, userId);
    return result.lastInsertRowid;
  }

  // 获取文档
  getDocument(id) {
    const stmt = this.db.prepare(`
      SELECT d.*, u.username as author
      FROM documents d
      LEFT JOIN users u ON d.user_id = u.id
      WHERE d.id = ?
    `);
    return stmt.get(id);
  }

  // 获取用户的所有文档
  getUserDocuments(userId) {
    const stmt = this.db.prepare(`
      SELECT * FROM documents
      WHERE user_id = ?
      ORDER BY updated_at DESC
    `);
    return stmt.all(userId);
  }

  // 更新文档
  updateDocument(id, { title, content }) {
    const stmt = this.db.prepare(`
      UPDATE documents
      SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(title, content, id);
  }

  // 删除文档
  deleteDocument(id) {
    const stmt = this.db.prepare('DELETE FROM documents WHERE id = ?');
    return stmt.run(id);
  }

  // 搜索文档
  searchDocuments(keyword) {
    const stmt = this.db.prepare(`
      SELECT * FROM documents
      WHERE title LIKE ? OR content LIKE ?
      ORDER BY updated_at DESC
    `);
    const pattern = `%${keyword}%`;
    return stmt.all(pattern, pattern);
  }

  // ============ 设置操作 ============

  // 设置值
  setSetting(key, value) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);
    return stmt.run(key, value);
  }

  // 获取值
  getSetting(key) {
    const stmt = this.db.prepare('SELECT value FROM settings WHERE key = ?');
    const result = stmt.get(key);
    return result ? result.value : null;
  }

  // 获取所有设置
  getAllSettings() {
    const stmt = this.db.prepare('SELECT * FROM settings');
    const rows = stmt.all();
    const settings = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });
    return settings;
  }

  // 删除设置
  deleteSetting(key) {
    const stmt = this.db.prepare('DELETE FROM settings WHERE key = ?');
    return stmt.run(key);
  }

  // ============ 事务支持 ============

  // 执行事务
  transaction(fn) {
    return this.db.transaction(fn)();
  }

  // 批量插入
  batchInsert(table, dataArray) {
    const insert = this.db.prepare(`
      INSERT INTO ${table} (${Object.keys(dataArray[0]).join(', ')})
      VALUES (${Object.keys(dataArray[0]).map(() => '?').join(', ')})
    `);

    const insertMany = this.db.transaction((items) => {
      for (const item of items) {
        insert.run(...Object.values(item));
      }
    });

    insertMany(dataArray);
  }

  // 关闭数据库
  close() {
    if (this.db) {
      this.db.close();
      console.log('数据库连接已关闭');
    }
  }
}

// 导出单例
module.exports = new AppDatabase();
```

### 4.3 网络请求

```javascript
// network.js - 网络请求封装
const axios = require('axios');
const { ipcMain } = require('electron');
const https = require('https');
const http = require('http');

// 创建 axios 实例
const apiClient = axios.create({
  timeout: 30000,
  headers: {
    'User-Agent': 'Electron App/1.0'
  }
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    console.log('请求发送:', config.url);
    return config;
  },
  (error) => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    console.log('响应成功:', response.status);
    return response;
  },
  (error) => {
    console.error('响应错误:', error.message);
    return Promise.reject(error);
  }
);

// 设置网络 IPC
function setupNetworkIPC() {
  // GET 请求
  ipcMain.handle('http-get', async (event, url, options = {}) => {
    try {
      const response = await apiClient.get(url, options);
      return {
        success: true,
        data: response.data,
        status: response.status,
        headers: response.headers
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  });

  // POST 请求
  ipcMain.handle('http-post', async (event, url, data, options = {}) => {
    try {
      const response = await apiClient.post(url, data, options);
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  });

  // 下载文件
  ipcMain.handle('http-download', async (event, url, destPath) => {
    const fs = require('fs');
    const path = require('path');

    return new Promise((resolve) => {
      const protocol = url.startsWith('https') ? https : http;

      protocol.get(url, (response) => {
        // 处理重定向
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          resolve(this.download(response.headers.location, destPath));
          return;
        }

        const file = fs.createWriteStream(destPath);
        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve({ success: true, path: destPath });
        });
      }).on('error', (error) => {
        fs.unlink(destPath, () => {});
        resolve({ success: false, error: error.message });
      });
    });
  });

  // 上传文件
  ipcMain.handle('http-upload', async (event, url, filePath) => {
    const fs = require('fs');

    try {
      const formData = new FormData();
      const fileContent = await fs.promises.readFile(filePath);
      const fileName = path.basename(filePath);

      formData.append('file', new Blob([fileContent]), fileName);

      const response = await apiClient.post(url, formData, {
        headers: formData.getHeaders()
      });

      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  });
}
```

**我的思考：为什么Electron需要Node**

Electron 的主进程集成 Node.js 是架构设计的必然结果，而非简单捆绑：

1. **桌面应用的需求**
   - 桌面应用需要访问本地文件系统、启动子进程、执行系统命令
   - 这些能力在浏览器沙箱中是完全禁止的

2. **生态系统复用**
   - npm 上有海量的包（超过 200 万个）
   - 文件处理（fs-extra）、数据库（better-sqlite3）、图像处理（sharp）等
   - 无需重新造轮子

3. **安全性考量**
   - 主进程运行在特权模式下，需要 Node.js 的全部能力
   - 渲染进程通过 IPC 与主进程通信，保持安全隔离
   - 通过 Context Bridge 精确控制暴露给渲染进程的 API

4. **开发体验统一**
   - 前端开发者可以使用熟悉的 JavaScript
   - 使用 npm 安装依赖
   - 使用 Node.js 的模块系统组织代码

---

## 五、React + Electron

### 5.1 Vite + Electron开发

**项目结构：**

```
my-electron-app/
├── electron/
│   ├── main.js           # 主进程入口
│   ├── preload.js        # 预加载脚本
│   └── ipc/               # IPC 处理器
│       ├── handlers.js
│       └── channels.js
├── src/
│   ├── main.jsx          # React 入口
│   ├── App.jsx           # 根组件
│   ├── components/       # 组件
│   ├── stores/           # 状态管理
│   ├── hooks/            # 自定义 Hooks
│   └── styles/           # 样式
├── public/
├── package.json
├── vite.config.js
├── electron-builder.json
└── index.html
```

**package.json 配置：**

```json
{
  "name": "my-electron-app",
  "version": "1.0.0",
  "main": "electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "electron:dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && electron .\"",
    "electron:build": "vite build && electron-builder",
    "electron:preview": "vite build && electron ."
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.5.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "electron": "^28.0.0",
    "electron-builder": "^24.9.0",
    "concurrently": "^8.2.0",
    "wait-on": "^7.2.0"
  },
  "build": {
    "appId": "com.myapp.electron",
    "productName": "MyElectronApp",
    "directories": {
      "output": "release"
    },
    "files": [
      "dist/**/*",
      "electron/**/*"
    ],
    "mac": {
      "category": "public.app-category.developer-tools",
      "target": ["dmg", "zip"]
    },
    "win": {
      "target": ["nsis", "portable"]
    },
    "linux": {
      "target": ["AppImage", "deb"]
    }
  }
}
```

**vite.config.js：**

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',  // 相对路径，适合 Electron
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // electron-builder 会打包此目录
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['axios', 'zustand']
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    strictPort: true  // 端口被占用时报错
  }
});
```

### 5.2 Zustand持久化状态管理

**store/useAppStore.js：**

```javascript
// store/useAppStore.js - 应用状态管理
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 应用设置 Store
const useSettingsStore = create(
  persist(
    (set, get) => ({
      // 主题设置
      theme: 'dark',  // 'dark' | 'light' | 'system'
      primaryColor: '#61dafb',

      // 编辑器设置
      fontSize: 14,
      fontFamily: 'Consolas, monospace',
      tabSize: 2,
      wordWrap: true,
      lineNumbers: true,

      // 窗口设置
      windowBounds: null,
      isMaximized: false,

      // 设置操作
      setTheme: (theme) => set({ theme }),
      setPrimaryColor: (color) => set({ primaryColor: color }),
      setFontSize: (size) => set({ fontSize: size }),
      setFontFamily: (family) => set({ fontFamily: family }),
      setTabSize: (size) => set({ tabSize: size }),
      setWordWrap: (wrap) => set({ wordWrap: wrap }),
      setLineNumbers: (show) => set({ lineNumbers: show }),

      setWindowBounds: (bounds) => set({ windowBounds: bounds }),
      setIsMaximized: (maximized) => set({ isMaximized: maximized }),

      // 重置设置
      resetSettings: () => set({
        theme: 'dark',
        primaryColor: '#61dafb',
        fontSize: 14,
        fontFamily: 'Consolas, monospace',
        tabSize: 2,
        wordWrap: true,
        lineNumbers: true
      })
    }),
    {
      name: 'app-settings-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        primaryColor: state.primaryColor,
        fontSize: state.fontSize,
        fontFamily: state.fontFamily,
        tabSize: state.tabSize,
        wordWrap: state.wordWrap,
        lineNumbers: state.lineNumbers
      })
    }
  )
);

// 文档 Store
const useDocumentStore = create(
  (set, get) => ({
    // 当前文档
    currentDocument: null,
    content: '',
    isDirty: false,

    // 文档列表
    documents: [],
    recentDocuments: [],

    // 操作
    setCurrentDocument: (doc) => set({
      currentDocument: doc,
      content: doc?.content || '',
      isDirty: false
    }),

    setContent: (content) => set({ content, isDirty: true }),

    newDocument: () => set({
      currentDocument: null,
      content: '',
      isDirty: false
    }),

    markSaved: () => set({ isDirty: false }),

    // 最近文档
    addToRecent: (doc) => {
      const { recentDocuments } = get();
      const filtered = recentDocuments.filter(d => d.id !== doc.id);
      const updated = [doc, ...filtered].slice(0, 10);
      set({ recentDocuments: updated });
    },

    // 加载文档列表
    loadDocuments: async () => {
      if (window.electronAPI) {
        const result = await window.electronAPI.getDocuments();
        if (result.success) {
          set({ documents: result.data });
        }
      }
    }
  })
);

// UI Store
const useUIStore = create(
  (set, get) => ({
    // 侧边栏
    sidebarOpen: true,
    sidebarWidth: 250,

    // 模态框
    activeModal: null,
    modalProps: {},

    // 通知
    notifications: [],

    // 侧边栏操作
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    setSidebarWidth: (width) => set({ sidebarWidth: width }),

    // 模态框操作
    openModal: (name, props = {}) => set({ activeModal: name, modalProps: props }),
    closeModal: () => set({ activeModal: null, modalProps: {} }),

    // 通知操作
    addNotification: (notification) => {
      const id = Date.now();
      const newNotification = { id, ...notification };
      set((state) => ({
        notifications: [...state.notifications, newNotification]
      }));

      // 自动移除
      setTimeout(() => {
        get().removeNotification(id);
      }, notification.duration || 3000);

      return id;
    },
    removeNotification: (id) => set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }))
  })
);

export { useSettingsStore, useDocumentStore, useUIStore };
```

### 5.3 IPC通信封装

**hooks/useElectron.js：**

```javascript
// hooks/useElectron.js - Electron API Hook
import { useCallback, useEffect } from 'react';
import { useUIStore } from '../store/useAppStore';

/**
 * Electron API 钩子
 * 提供对 Electron 主进程 API 的类型安全访问
 */
export function useElectron() {
  const addNotification = useUIStore((state) => state.addNotification);

  // ============ 文件操作 ============

  const readFile = useCallback(async (filePath) => {
    if (!window.electronAPI?.readFile) {
      throw new Error('Electron API 不可用');
    }
    return await window.electronAPI.readFile(filePath);
  }, []);

  const writeFile = useCallback(async (filePath, content) => {
    if (!window.electronAPI?.writeFile) {
      throw new Error('Electron API 不可用');
    }
    return await window.electronAPI.writeFile(filePath, content);
  }, []);

  const showOpenDialog = useCallback(async (options = {}) => {
    if (!window.electronAPI?.showOpenDialog) {
      throw new Error('Electron API 不可用');
    }
    return await window.electronAPI.showOpenDialog(options);
  }, []);

  const showSaveDialog = useCallback(async (options = {}) => {
    if (!window.electronAPI?.showSaveDialog) {
      throw new Error('Electron API 不可用');
    }
    return await window.electronAPI.showSaveDialog(options);
  }, []);

  // ============ 窗口控制 ============

  const minimizeWindow = useCallback(() => {
    window.electronAPI?.minimize?.();
  }, []);

  const maximizeWindow = useCallback(() => {
    window.electronAPI?.maximize?.();
  }, []);

  const closeWindow = useCallback(() => {
    window.electronAPI?.close?.();
  }, []);

  const isMaximized = useCallback(async () => {
    if (!window.electronAPI?.isMaximized) {
      return false;
    }
    return await window.electronAPI.isMaximized();
  }, []);

  // ============ 系统信息 ============

  const getAppInfo = useCallback(async () => {
    if (!window.electronAPI?.getAppInfo) {
      return null;
    }
    return await window.electronAPI.getAppInfo();
  }, []);

  const getPlatform = useCallback(() => {
    return window.electronAPI?.getPlatform?.() || 'unknown';
  }, []);

  // ============剪贴板 ============

  const clipboardRead = useCallback(async () => {
    if (!window.electronAPI?.clipboardRead) {
      return '';
    }
    return await window.electronAPI.clipboardRead();
  }, []);

  const clipboardWrite = useCallback(async (text) => {
    if (!window.electronAPI?.clipboardWrite) {
      throw new Error('Electron API 不可用');
    }
    return await window.electronAPI.clipboardWrite(text);
  }, []);

  // ============ 事件监听 ============

  const onMaximizedChange = useCallback((callback) => {
    window.electronAPI?.onMaximizedChange?.(callback);
  }, []);

  const onMenuAction = useCallback((callback) => {
    window.electronAPI?.onMenuAction?.(callback);
  }, []);

  // ============ 清理 ============

  const removeAllListeners = useCallback((channel) => {
    window.electronAPI?.removeAllListeners?.(channel);
  }, []);

  return {
    // 文件操作
    readFile,
    writeFile,
    showOpenDialog,
    showSaveDialog,

    // 窗口控制
    minimizeWindow,
    maximizeWindow,
    closeWindow,
    isMaximized,

    // 系统信息
    getAppInfo,
    getPlatform,

    // 剪贴板
    clipboardRead,
    clipboardWrite,

    // 事件
    onMaximizedChange,
    onMenuAction,
    removeAllListeners,

    // 工具
    addNotification,

    // 检查 API 可用性
    isElectronAvailable: !!window.electronAPI
  };
}

/**
 * 应用信息钩子
 */
export function useAppInfo() {
  const { getAppInfo, isElectronAvailable } = useElectron();

  const [appInfo, setAppInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isElectronAvailable) {
      getAppInfo().then((info) => {
        setAppInfo(info);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [isElectronAvailable, getAppInfo]);

  return { appInfo, loading };
}

/**
 * 窗口状态钩子
 */
export function useWindowState() {
  const { onMaximizedChange } = useElectron();
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    onMaximizedChange((maximized) => {
      setIsMaximized(maximized);
    });
  }, [onMaximizedChange]);

  return isMaximized;
}

/**
 * 菜单动作钩子
 */
export function useMenuActions(handlers = {}) {
  const { onMenuAction, removeAllListeners } = useElectron();

  useEffect(() => {
    if (handlers) {
      Object.entries(handlers).forEach(([action, handler]) => {
        if (typeof handler === 'function') {
          // 这里需要修改，因为 onMenuAction 只接受一个回调
          // 需要在组件中处理 action 参数
        }
      });
    }

    return () => {
      removeAllListeners?.('menu-action');
    };
  }, [handlers, removeAllListeners]);

  return {};
}
```

### 5.4 打包配置：electron-builder

**electron-builder.json：**

```json
{
  "appId": "com.myapp.electron",
  "productName": "MyElectronApp",
  "copyright": "Copyright © 2024 MyCompany",

  "directories": {
    "output": "release",
    "buildResources": "build"
  },

  "files": [
    "dist/**/*",
    "electron/**/*",
    "!node_modules/**/*",
    "node_modules/better-sqlite3/**/*"
  ],

  "extraResources": [
    {
      "from": "resources/",
      "to": "resources/",
      "filter": ["**/*"]
    }
  ],

  "asar": true,
  "asarUnpack": [
    "**/*.node",
    "**/better-sqlite3/**/*"
  ],

  "mac": {
    "category": "public.app-category.developer-tools",
    "target": [
      {
        "target": "dmg",
        "arch": ["x64", "arm64"]
      },
      {
        "target": "zip",
        "arch": ["x64", "arm64"]
      }
    ],
    "icon": "build/icon.icns",
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "entitlements": "build/entitlements.mac.plist",
    "entitlementsInherit": "build/entitlements.mac.plist"
  },

  "dmg": {
    "title": "${productName}",
    "background": "build/dmg-background.png",
    "icon": "build/icon.icns",
    "window": {
      "width": 540,
      "height": 380
    },
    "contents": [
      {
        "x": 130,
        "y": 220,
        "type": "file"
      },
      {
        "x": 410,
        "y": 220,
        "type": "link",
        "path": "/Applications"
      }
    ]
  },

  "win": {
    "target": [
      {
        "target": "nsis",
        "arch": ["x64"]
      },
      {
        "target": "portable",
        "arch": ["x64"]
      }
    ],
    "icon": "build/icon.ico",
    "artifactName": "${productName}-${version}-Setup.${ext}"
  },

  "nsis": {
    "oneClick": false,
    "perMachine": false,
    "allowToChangeInstallationDirectory": true,
    "deleteAppDataOnUninstall": false,
    "installerIcon": "build/icon.ico",
    "uninstallerIcon": "build/icon.ico",
    "installerHeaderIcon": "build/icon.ico",
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "shortcutName": "${productName}"
  },

  "linux": {
    "target": [
      {
        "target": "AppImage",
        "arch": ["x64"]
      },
      {
        "target": "deb",
        "arch": ["x64"]
      }
    ],
    "category": "Development",
    "icon": "build/icons",
    "maintainer": "MyCompany",
    "vendor": "MyCompany"
  },

  "publish": {
    "provider": "generic",
    "url": "https://update.mycompany.com/"
  }
}
```

### 5.5 实战：Markdown编辑器

**React组件实现：**

```jsx
// components/MarkdownEditor.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { useSettingsStore, useDocumentStore, useUIStore } from '../store/useAppStore';
import { useElectron } from '../hooks/useElectron';
import { marked } from 'marked';  // Markdown 解析库
import { DOMPurify } from 'dompurify';  // HTML 净化

const MarkdownEditor = () => {
  const { theme, fontSize, fontFamily, tabSize, wordWrap, lineNumbers } = useSettingsStore();
  const { content, setContent, currentDocument, isDirty, markSaved, addToRecent } = useDocumentStore();
  const { addNotification } = useUIStore();
  const { showOpenDialog, showSaveDialog, readFile, writeFile } = useElectron();

  const [viewMode, setViewMode] = useState('split');  // 'edit' | 'preview' | 'split'
  const [htmlContent, setHtmlContent] = useState('');

  // 解析 Markdown
  useEffect(() => {
    try {
      const html = marked.parse(content, {
        breaks: true,
        gfm: true
      });
      // 净化 HTML，防止 XSS
      const sanitized = DOMPurify.sanitize(html);
      setHtmlContent(sanitized);
    } catch (error) {
      console.error('Markdown 解析错误:', error);
    }
  }, [content]);

  // 处理文本变化
  const handleContentChange = useCallback((e) => {
    setContent(e.target.value);
  }, [setContent]);

  // Tab 键处理
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newContent = content.substring(0, start) + ' '.repeat(tabSize) + content.substring(end);
      setContent(newContent);

      // 设置光标位置
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + tabSize;
      }, 0);
    }
  }, [content, setContent, tabSize]);

  // 打开文件
  const handleOpen = useCallback(async () => {
    try {
      const result = await showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'Markdown', extensions: ['md', 'markdown'] },
          { name: '文本文件', extensions: ['txt'] },
          { name: '所有文件', extensions: ['*'] }
        ]
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        const fileResult = await readFile(filePath);

        if (fileResult.success) {
          setContent(fileResult.content);
          markSaved();
          addToRecent({ id: Date.now(), path: filePath, title: filePath.split('/').pop() });
          addNotification({ type: 'success', message: '文件已打开' });
        } else {
          addNotification({ type: 'error', message: '打开文件失败' });
        }
      }
    } catch (error) {
      addNotification({ type: 'error', message: `打开文件失败: ${error.message}` });
    }
  }, [showOpenDialog, readFile, setContent, markSaved, addToRecent, addNotification]);

  // 保存文件
  const handleSave = useCallback(async () => {
    try {
      const result = await showSaveDialog({
        filters: [
          { name: 'Markdown', extensions: ['md'] },
          { name: '所有文件', extensions: ['*'] }
        ]
      });

      if (!result.canceled) {
        const saveResult = await writeFile(result.filePath, content);
        if (saveResult.success) {
          markSaved();
          addNotification({ type: 'success', message: '文件已保存' });
        } else {
          addNotification({ type: 'error', message: '保存文件失败' });
        }
      }
    } catch (error) {
      addNotification({ type: 'error', message: `保存文件失败: ${error.message}` });
    }
  }, [showSaveDialog, writeFile, content, markSaved, addNotification]);

  // 快捷键处理
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        handleOpen();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleOpen, handleSave]);

  // 编辑器样式
  const editorStyle = {
    fontFamily,
    fontSize: `${fontSize}px`,
    tabSize,
    whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
    lineHeight: 1.6
  };

  return (
    <div className="markdown-editor" data-theme={theme}>
      {/* 工具栏 */}
      <div className="toolbar">
        <button onClick={handleOpen}>打开</button>
        <button onClick={handleSave} disabled={!isDirty}>保存</button>
        <div className="separator" />
        <button onClick={() => setViewMode('edit')}>编辑</button>
        <button onClick={() => setViewMode('split')}>分屏</button>
        <button onClick={() => setViewMode('preview')}>预览</button>
        {isDirty && <span className="dirty-indicator">*</span>}
      </div>

      {/* 编辑区域 */}
      <div className={`editor-container ${viewMode}`}>
        {/* 编辑器 */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className="editor-pane">
            {lineNumbers && (
              <div className="line-numbers">
                {content.split('\n').map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
            )}
            <textarea
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              style={editorStyle}
              placeholder="在此输入 Markdown 内容..."
              spellCheck={false}
            />
          </div>
        )}

        {/* 预览 */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
            className="preview-pane"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        )}
      </div>

      <style>{`
        .markdown-editor {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: var(--bg-color, #1e1e1e);
        }
        .toolbar {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          background: var(--toolbar-bg, #2d2d2d);
          border-bottom: 1px solid var(--border-color, #3d3d3d);
        }
        .toolbar button {
          padding: 6px 12px;
          margin-right: 8px;
          background: var(--button-bg, #3d3d3d);
          border: none;
          border-radius: 4px;
          color: var(--button-color, #fff);
          cursor: pointer;
        }
        .toolbar button:hover { background: var(--button-hover, #4d4d4d); }
        .toolbar button:disabled { opacity: 0.5; cursor: not-allowed; }
        .separator { width: 1px; height: 20px; background: #555; margin: 0 8px; }
        .dirty-indicator { color: #e74c3c; margin-left: 8px; }
        .editor-container { flex: 1; display: flex; overflow: hidden; }
        .editor-container.split .editor-pane,
        .editor-container.split .preview-pane { width: 50%; }
        .editor-container.edit .editor-pane { width: 100%; }
        .editor-container.preview .preview-pane { width: 100%; }
        .editor-pane { display: flex; overflow: hidden; }
        .line-numbers {
          background: var(--line-num-bg, #252526);
          color: var(--line-num-color, #858585);
          padding: 10px 8px;
          text-align: right;
          user-select: none;
          overflow: hidden;
        }
        .line-numbers div { line-height: 1.6; }
        textarea {
          flex: 1;
          padding: 10px;
          background: var(--editor-bg, #1e1e1e);
          color: var(--editor-color, #d4d4d4);
          border: none;
          resize: none;
          outline: none;
        }
        .preview-pane {
          padding: 20px;
          background: var(--preview-bg, #252526);
          color: var(--preview-color, #ccc);
          overflow-y: auto;
          border-left: 1px solid var(--border-color, #3d3d3d);
        }
        .preview-pane h1, .preview-pane h2, .preview-pane h3 {
          color: var(--heading-color, #61dafb);
          margin: 1em 0 0.5em;
        }
        .preview-pane code {
          background: var(--code-bg, #1e1e1e);
          padding: 2px 6px;
          border-radius: 3px;
          font-family: Consolas, monospace;
        }
        .preview-pane pre {
          background: var(--code-bg, #1e1e1e);
          padding: 15px;
          border-radius: 6px;
          overflow-x: auto;
        }
        .preview-pane pre code { background: none; padding: 0; }
        .preview-pane blockquote {
          border-left: 4px solid var(--accent-color, #61dafb);
          margin: 1em 0;
          padding-left: 1em;
          color: var(--quote-color, #888);
        }
      `}</style>
    </div>
  );
};

export default MarkdownEditor;
```

---

## 六、性能优化

### 6.1 启动速度优化

**主进程启动优化：**

```javascript
// main.js - 启动优化策略

// 1. 延迟加载非必要模块
// 在应用启动时只加载核心模块
const { app, BrowserWindow } = require('electron');
const path = require('path');

// 模拟：延迟加载数据库模块（只有在需要时才加载）
let database = null;
async function getDatabase() {
  if (!database) {
    // 懒加载数据库
    database = require('./database');
    await database.initialize();
  }
  return database;
}

// 2. 使用 ready 事件而非 whenReady
// 当 Electron 准备就绪时创建窗口
app.whenReady().then(() => {
  // 立即创建窗口，不要在这里做其他事情
  createWindow();
});

// 3. 窗口创建优化
function createWindow() {
  const mainWindow = new BrowserWindow({
    // 窗口配置
    width: 1200,
    height: 800,
    show: false,  // 先创建不显示

    // 优化：禁用不必要的功能
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // 如果不需要预览功能可以禁用
      sandbox: true,
      // 禁用图像加载可以提升启动速度（如果不需要）
      images: true,
      // 禁用字体加载（可选）
      // webgl: false,
    }
  });

  // 使用 file:// 协议比 http 快
  mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));

  // 等待内容加载完成再显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 如果是调试模式再打开 DevTools
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

// 4. 禁用不必要的功能
app.commandLine.appendSwitch('disable-features', 'VizDisplayCompositor');

// 5. GPU 加速控制
app.disableHardwareAcceleration();  // 如果应用不需要 GPU 加速
```

**预加载脚本优化：**

```javascript
// preload.js - 精简的预加载脚本

// 只在需要时暴露 API
const { contextBridge, ipcRenderer } = require('electron');

// 避免在预加载脚本中执行耗时操作
// 预先计算的内容可以缓存

// 基础 API（始终可用）
contextBridge.exposeInMainWorld('electronAPI', {
  // 核心功能
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),

  // 文件操作（高频使用）
  readFile: (path) => ipcRenderer.invoke('read-file', path),
  writeFile: (path, content) => ipcRenderer.invoke('write-file', path, content),

  // 窗口控制
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // 事件监听
  onMaximizedChange: (cb) => ipcRenderer.on('maximized-changed', (e, val) => cb(val))
});
```

### 6.2 内存占用优化

```javascript
// main.js - 内存优化策略

// 1. 限制渲染进程数量
// 默认情况下 Electron 会为每个 WebContents 创建新进程
// 对于不需要的页面可以禁用

// 2. 内存监控
function setupMemoryMonitoring() {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    console.log('主进程内存使用:');
    console.log(`  - RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  - Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  - Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  - External: ${(memUsage.external / 1024 / 1024).toFixed(2)} MB`);
  }, 30000);  // 每 30 秒检查一次
}

// 3. 释放不需要的资源
function cleanupUnusedResources() {
  // 清理旧的 WebContents
  const allWindows = BrowserWindow.getAllWindows();

  // 关闭超过一定时间的隐藏窗口
  allWindows.forEach(window => {
    if (!window.isVisible() && window.getTitle() !== 'main') {
      // 可以选择销毁或保留
      // window.destroy();
    }
  });

  // 清理未使用的大对象
  if (global.cachedData && Date.now() - global.cachedData.timestamp > 300000) {
    global.cachedData = null;
  }
}

// 4. 使用 webPreferences 限制内存使用
const mainWindow = new BrowserWindow({
  webPreferences: {
    // 禁用 JavaScript 堆内存快照
    v8CacheOptions: 'none',

    // 限制最大 WebGL 纹理大小
    // webglParams: { ... },

    // 禁用背景 Throttling
    backgroundThrottling: false,

    // 禁用 offscreen 渲染（如果不需要）
    offscreen: false
  }
});

// 5. 垃圾回收提示
// 在适当的时候触发垃圾回收（谨慎使用）
function triggerGC() {
  if (global.gc) {
    console.log('触发垃圾回收...');
    global.gc();
  }
}
```

### 6.3 渲染进程管理

```javascript
// main.js - 渲染进程管理

// 1. 使用 BrowserView 而不是多个 BrowserWindow
// BrowserView 共享一个渲染进程，更节省内存

let mainWindow = null;
let sidePanelView = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800
  });
}

function createSidePanel() {
  // 创建 BrowserView
  sidePanelView = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // 设置大小和位置
  mainWindow.addBrowserView(sidePanelView);
  sidePanelView.setBounds({ x: 0, y: 0, width: 300, height: 800 });

  // 加载内容
  sidePanelView.webContents.loadURL('https://example.com/sidebar');
}

// 2. 进程池管理（高级）
class RendererPool {
  constructor(maxInstances = 4) {
    this.maxInstances = maxInstances;
    this.activeRenderers = new Set();
    this.idleRenderers = [];
  }

  acquire() {
    if (this.idleRenderers.length > 0) {
      const renderer = this.idleRenderers.pop();
      this.activeRenderers.add(renderer);
      return renderer;
    }

    if (this.activeRenderers.size < this.maxInstances) {
      const renderer = this.createRenderer();
      this.activeRenderers.add(renderer);
      return renderer;
    }

    // 所有实例都在使用中，等待
    return null;
  }

  release(renderer) {
    if (this.activeRenderers.has(renderer)) {
      this.activeRenderers.delete(renderer);
      this.idleRenderers.push(renderer);
    }
  }

  createRenderer() {
    return new BrowserWindow({
      width: 800,
      height: 600,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });
  }

  destroyAll() {
    [...this.activeRenderers, ...this.idleRenderers].forEach(r => r.destroy());
    this.activeRenderers.clear();
    this.idleRenderers = [];
  }
}
```

### 6.4 大数据量优化

```javascript
// renderer-optimization.js - 渲染进程大数据处理

// 1. 虚拟滚动（处理大列表）
class VirtualList {
  constructor({ container, itemHeight, renderItem }) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.renderItem = renderItem;
    this.items = [];
    this.scrollTop = 0;
    this.containerHeight = 0;

    this.setup();
  }

  setup() {
    this.container.style.overflow = 'auto';

    // 创建内部容器
    this.innerContainer = document.createElement('div');
    this.innerContainer.style.position = 'relative';
    this.container.appendChild(this.innerContainer);

    // 监听滚动
    this.container.addEventListener('scroll', () => this.onScroll());

    // 获取容器高度
    this.containerHeight = this.container.clientHeight;
  }

  setItems(items) {
    this.items = items;
    this.innerContainer.style.height = `${items.length * this.itemHeight}px`;
    this.render();
  }

  onScroll() {
    this.scrollTop = this.container.scrollTop;
    requestAnimationFrame(() => this.render());
  }

  render() {
    const startIndex = Math.floor(this.scrollTop / this.itemHeight);
    const visibleCount = Math.ceil(this.containerHeight / this.itemHeight) + 2;

    // 清除现有内容
    this.innerContainer.querySelectorAll('.virtual-item').forEach(el => el.remove());

    // 渲染可见项
    for (let i = startIndex; i < startIndex + visibleCount && i < this.items.length; i++) {
      const item = this.items[i];
      const element = this.renderItem(item, i);

      element.className = 'virtual-item';
      element.style.position = 'absolute';
      element.style.top = `${i * this.itemHeight}px`;
      element.style.width = '100%';

      this.innerContainer.appendChild(element);
    }
  }
}

// 2. 分批处理数据
async function processLargeData(data, batchSize = 1000, onProgress) {
  const results = [];
  const totalBatches = Math.ceil(data.length / batchSize);

  for (let i = 0; i < totalBatches; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, data.length);
    const batch = data.slice(start, end);

    // 处理当前批次
    const batchResults = await processBatch(batch);
    results.push(...batchResults);

    // 报告进度
    if (onProgress) {
      onProgress({
        processed: end,
        total: data.length,
        percent: Math.round((end / data.length) * 100)
      });
    }

    // 让出主线程
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  return results;
}

// 3. 使用 Web Workers 处理耗时计算
// worker.js
self.onmessage = async function(e) {
  const { data, type } = e.data;

  switch (type) {
    case 'PROCESS_LARGE_ARRAY':
      const result = await processLargeArray(data);
      self.postMessage({ type: 'RESULT', result });
      break;

    case 'PARSE_CSV':
      const parsed = parseCSV(data);
      self.postMessage({ type: 'RESULT', result: parsed });
      break;
  }
};

// 在渲染进程中使用
function useWorker() {
  const worker = new Worker('./worker.js');

  worker.onmessage = (e) => {
    const { type, result } = e.data;
    if (type === 'RESULT') {
      console.log('Worker 处理完成:', result);
    }
  };

  return {
    processLargeArray: (data) => {
      worker.postMessage({ type: 'PROCESS_LARGE_ARRAY', data });
    },
    parseCSV: (data) => {
      worker.postMessage({ type: 'PARSE_CSV', data });
    }
  };
}
```

**我的思考：Electron为什么内存占用高**

Electron 内存占用高的根本原因在于其架构设计：

1. **Chromium 本身是内存大户**
   - Chromium 为每个标签页维护独立的渲染进程
   - 每个进程都有独立的 V8 JavaScript 引擎实例
   - 即使是空白的 HTML 页面，Chromium 也要占用 50-100MB 内存

2. **Node.js 运行时开销**
   - 主进程包含完整的 Node.js 运行时
   - 这部分内存与 Chromium 的内存是独立的
   - npm 包即使不使用也会被加载到内存中

3. **多进程架构的内存冗余**
   - 每个渲染进程都需要加载相同的框架代码
   - 无法像单进程应用那样共享内存

4. **GPU 进程占用**
   - Chromium 的 GPU 进程也需要独立内存
   - 图形渲染会占用额外的显存

5. **优化建议**
   - 减少 BrowserWindow 实例数量
   - 合理使用 BrowserView 替代多窗口
   - 禁用不必要的功能（背景 Throttling、图像加载等）
   - 使用代码分割减少初始加载的 JavaScript
   - 及时释放不再使用的资源

---

## 七、安全考虑

### 7.1 Context Isolation

Context Isolation 是 Electron 最重要的安全特性之一。

```javascript
// main.js - Context Isolation 配置
const mainWindow = new BrowserWindow({
  width: 1200,
  height: 800,
  webPreferences: {
    // 启用上下文隔离（必须为 true）
    contextIsolation: true,

    // 禁用 Node.js 集成（必须为 false）
    nodeIntegration: false,

    // 启用安全策略
    webSecurity: true,

    // 禁用远程模块（已废弃）
    enableRemoteModule: false,

    // Sandbox 模式（实验性）
    sandbox: true,

    // 预加载脚本
    preload: path.join(__dirname, 'preload.js')
  }
});
```

### 7.2 Node Integration

Node Integration 应该始终保持关闭状态：

```javascript
// main.js - 安全配置
const mainWindow = new BrowserWindow({
  webPreferences: {
    // 错误配置 - 不要使用
    // nodeIntegration: true,
    // contextIsolation: false,

    // 正确配置
    nodeIntegration: false,     // 禁用 Node.js 集成
    contextIsolation: true,      // 启用上下文隔离
    sandbox: true,              // 启用沙箱
    webSecurity: true,           // 启用安全策略
    preload: path.join(__dirname, 'preload.js')
  }
});
```

### 7.3 Content Security Policy

```javascript
// main.js - CSP 配置
const { session } = require('electron');

app.whenReady().then(() => {
  // 设置 Content Security Policy
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          // 默认只允许同源脚本
          "default-src 'self'",
          // 允许加载本地脚本
          "script-src 'self' 'unsafe-inline'",
          // 样式只能从同源加载
          "style-src 'self' 'unsafe-inline'",
          // 图片可以从同源和 HTTPS 加载
          "img-src 'self' data: https:",
          // 允许连接到的 API
          "connect-src 'self' https://api.myapp.com",
          // 字体
          "font-src 'self' data:"
        ].join('; ')
      }
    });
  });
});
```

### 7.4 远程内容加载限制

```javascript
// main.js - 限制远程内容加载
const { session } = require('electron');

app.whenReady().then(() => {
  // 拦截并验证 URL
  session.defaultSession.webRequest.onBeforeRequest(async (details, callback) => {
    const url = new URL(details.url);

    // 白名单域名
    const allowedDomains = ['myapp.com', 'cdn.myapp.com'];

    // 只允许白名单中的域名
    if (url.protocol === 'https:' && allowedDomains.some(d => url.hostname.endsWith(d))) {
      callback({});
    } else if (url.protocol === 'file:') {
      // 允许本地文件
      callback({});
    } else {
      // 拒绝加载
      console.warn('阻止加载:', details.url);
      callback({ cancel: true });
    }
  });
});

// 禁用外部协议
app.on('web-contents-created', (event, contents) => {
  // 阻止打开新窗口
  contents.setWindowOpenHandler(({ url }) => {
    // 只允许 http/https 和 file 协议
    if (url.startsWith('http:') || url.startsWith('https:') || url.startsWith('file:')) {
      // 验证域名
      const allowed = isUrlAllowed(url);
      if (allowed) {
        require('electron').shell.openExternal(url);
      }
    }
    return { action: 'deny' };
  });

  // 拦截导航请求
  contents.on('will-navigate', (event, url) => {
    if (!isUrlAllowed(url)) {
      event.preventDefault();
    }
  });
});

function isUrlAllowed(url) {
  try {
    const parsed = new URL(url);
    const allowedDomains = ['localhost', 'myapp.com'];
    return allowedDomains.some(d => parsed.hostname.endsWith(d) || parsed.hostname === d);
  } catch {
    return false;
  }
}
```

**我的思考：Electron安全坑**

Electron 开发中常见的安全问题：

1. **禁用安全特性以"方便"开发**
   - 很多教程为了简化示例，会将 `nodeIntegration` 设为 `true`
   - 这会让任何加载的网页都能访问 Node.js API
   - 正确做法：保持安全配置，通过 IPC 通信

2. **预加载脚本过度暴露 API**
   - 预加载脚本中暴露了过多的主进程 API
   - 应该只暴露应用需要的最小 API 集
   - 避免直接暴露文件系统的读写操作

3. **CSP 配置不当**
   - 过度宽松的 CSP 允许内联脚本和外部脚本
   - 应该限制外部脚本加载来源
   - 定期审查 CSP 策略

4. **不验证 IPC 消息来源**
   - 主进程应该验证 IPC 消息的来源
   - 使用 `event.senderFrame` 检查来源
   - 避免接受来自不可信来源的请求

5. **远程内容直接执行**
   - 加载远程 URL 时不进行安全验证
   - 应该对所有外部内容实施严格的 CSP

6. **不安全的光标/选择处理**
   - 使用 `insertText` 事件时要小心
   - 确保插入的文本不包含恶意代码

---

## 八、打包与分发

### 8.1 electron-builder配置

```json
// electron-builder.json
{
  "appId": "com.mycompany.myapp",
  "productName": "MyApp",
  "copyright": "Copyright © 2024 MyCompany",

  "directories": {
    "output": "release",
    "buildResources": "build"
  },

  "files": [
    "dist/**/*",
    "electron/**/*"
  ],

  "asar": true,
  "compression": "maximum",

  "mac": {
    "category": "public.app-category.productivity",
    "target": ["dmg", "zip"],
    "icon": "build/icon.icns",
    "hardenedRuntime": true,
    "gatekeeperAssess": false
  },

  "win": {
    "target": [
      {
        "target": "nsis",
        "arch": ["x64"]
      }
    ],
    "icon": "build/icon.ico"
  },

  "linux": {
    "target": ["AppImage", "deb"],
    "icon": "build/icons",
    "category": "Office"
  }
}
```

### 8.2 代码签名

```json
// electron-builder.json - 代码签名配置
{
  "mac": {
    "category": "public.app-category.developer-tools",
    "hardenedRuntime": true,
    "entitlements": "build/entitlements.plist",
    "entitlementsInherit": "build/entitlements-inherit.plist",
    "signature": "Your Developer ID Application certificate name"
  },

  "dmg": {
    "sign": true
  }
}
```

```bash
# macOS 代码签名步骤

# 1. 申请开发者证书
# 在 Apple Developer Portal 创建 Developer ID Application 证书

# 2. 导出证书
security export -k ~/Library/Keychains/login.keychain-db -t cert -P "证书密码" -o "certificate.p12"

# 3. 配置 electron-builder
export CSC_NAME="Your Developer ID"

# 4. 构建并签名
npm run electron:build
```

### 8.3 自动更新

```javascript
// updater.js - 自动更新模块
const { app, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');

// 配置
autoUpdater.autoDownload = false;  // 不自动下载，让用户确认
autoUpdater.autoInstallOnAppQuit = true;

// 启用日志
autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';

// 检查更新
async function checkForUpdates() {
  try {
    const result = await autoUpdater.checkForUpdates();
    if (result && result.updateInfo) {
      return {
        available: true,
        version: result.updateInfo.version,
        releaseDate: result.updateInfo.releaseDate,
        releaseNotes: result.updateInfo.releaseNotes
      };
    }
    return { available: false };
  } catch (error) {
    console.error('检查更新失败:', error);
    return { available: false, error: error.message };
  }
}

// 下载更新
async function downloadUpdate() {
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 安装更新并重启
function quitAndInstall() {
  autoUpdater.quitAndInstall();
}

// 设置事件监听
function setupAutoUpdaterEvents() {
  autoUpdater.on('checking-for-update', () => {
    console.log('正在检查更新...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('发现新版本:', info.version);
    // 通知渲染进程
    const windows = require('electron').BrowserWindow.getAllWindows();
    windows.forEach(win => {
      win.webContents.send('update-available', info);
    });
  });

  autoUpdater.on('update-not-available', () => {
    console.log('已是最新版本');
  });

  autoUpdater.on('download-progress', (progress) => {
    console.log(`下载进度: ${progress.percent.toFixed(2)}%`);
    const windows = require('electron').BrowserWindow.getAllWindows();
    windows.forEach(win => {
      win.webContents.send('update-progress', progress);
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('更新已下载');
    const windows = require('electron').BrowserWindow.getAllWindows();
    windows.forEach(win => {
      win.webContents.send('update-downloaded', info);
    });
  });

  autoUpdater.on('error', (error) => {
    console.error('更新错误:', error);
  });
}

// IPC 处理器
function setupUpdaterIPC() {
  ipcMain.handle('check-for-updates', checkForUpdates);
  ipcMain.handle('download-update', downloadUpdate);
  ipcMain.on('quit-and-install', quitAndInstall);
}

module.exports = {
  setupAutoUpdater,
  setupAutoUpdaterEvents,
  setupUpdaterIPC
};
```

### 8.4 应用商店分发

**macOS App Store 注意事项：**

```json
// electron-builder.json - App Store 配置
{
  "mac": {
    "category": "public.app-category.productivity",
    "target": [
      {
        "target": "dmg",
        "arch": ["x64", "arm64"]
      }
    ],
    "icon": "build/icon.icns",
    "hardenedRuntime": false,
    "gatekeeperAssess": true
  }
}
```

**重要提示：**
- macOS App Store 需要将 `hardenedRuntime` 设为 `false`
- 需要使用 App Sandbox
- 必须使用 App Store 专用的签名证书

**Windows Store 配置：**

```json
{
  "win": {
    "target": [
      {
        "target": "appx",
        "arch": ["x64", "arm64"]
      }
    ],
    "icon": "build/icon.ico"
  },
  "appx": {
    "identityName": "MyCompany.MyApp",
    "publisher": "CN=MyCompany",
    "publisherDisplayName": "MyCompany",
    "applicationId": "MyApp"
  }
}
```

**我的思考：打包体积优化**

Electron 应用体积大的根本原因是包含完整的 Chromium 浏览器。以下是优化策略：

1. **使用 asar 打包**
   - 启用 asar 可以减少 30-50MB 的文件数量开销
   - 使用 `compression: "maximum"` 进一步减小体积

2. **排除不需要的文件**
   ```json
   {
     "files": [
       "dist/**/*",
       "!dist/**/*.map",      // 排除 source map
       "!dist/**/*.test.js",  // 排除测试文件
       "!**/node_modules/*/{CHANGELOG.md,README.md,test,__tests__}"
     ]
   }
   ```

3. **排除 npm 包的类型文件**
   - 排除 TypeScript 类型文件（.d.ts）
   - 排除源码和测试文件

4. **使用 yarn workspaces**
   - 如果有多个项目，使用 yarn workspaces 共享依赖
   - 减少重复安装

5. **考虑 Tauri**
   - 如果体积是关键需求，Tauri 的打包体积可以小到 3-10MB
   - 但需要付出 Rust 开发的代价

6. **优化资源文件**
   - 压缩图片资源
   - 使用 WebP 等更高效的图片格式
   - 懒加载非必要的资源

---

## 九、Tauri对比

### 9.1 Rust vs Node.js后端

| 维度 | Electron (Node.js) | Tauri (Rust) |
|------|---------------------|--------------|
| **内存效率** | 较高（Chromium + Node.js） | 极低（系统 WebView） |
| **CPU 性能** | 中等 | 极高（Rust 编译优化） |
| **启动速度** | 2-5 秒 | < 100ms |
| **包体积** | 120-150MB | 3-10MB |
| **npm 生态** | 200万+ 包 | 受限（Rust crates） |
| **前端兼容性** | 完全兼容 | 完全兼容（使用 WebView） |
| **原生能力** | 强 | 极强 |
| **学习曲线** | 低（JavaScript） | 中高（Rust） |
| **社区规模** | 成熟庞大 | 快速增长 |

### 9.2 性能对比

```
启动时间对比（示例应用）：
┌─────────────────────────────────────────────────────────┐
│ Electron ████████████████████████████████████ 2.5秒    │
│ Tauri    ██ 0.08秒                                       │
└─────────────────────────────────────────────────────────┘

内存占用对比（空应用）：
┌─────────────────────────────────────────────────────────┐
│ Electron ████████████████████████████████ ~180MB       │
│ Tauri    ██ ~20MB                                       │
└─────────────────────────────────────────────────────────┘

包体积对比：
┌─────────────────────────────────────────────────────────┐
│ Electron ████████████████████████████████████ ~130MB   │
│ Tauri    ██ ~5MB                                        │
└─────────────────────────────────────────────────────────┘
```

### 9.3 生态对比

| 需求 | Electron | Tauri |
|------|----------|-------|
| 访问文件系统 | fs 模块 | Rust 原生 + JS API |
| 数据库 | better-sqlite3, TypeORM | SQLite, PostgreSQL (Rust) |
| HTTP 客户端 | axios, node-fetch | reqwest (Rust) |
| 图像处理 | sharp, jimp | image (Rust) |
| 加密 | crypto | ring, rustls |
| 状态管理 | Zustand, Redux | 相同方案 |
| UI 框架 | React, Vue | React, Vue, Svelte |

### 9.4 Tauri 主要优势

```rust
// Tauri 的 Rust 后端示例
use tauri::Manager;

#[tauri::command]
fn get_system_info() -> Result<SystemInfo, String> {
    Ok(SystemInfo {
        os_type: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        version: whoami::version().unwrap_or_else(|| "unknown".into()),
    })
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_system_info])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Tauri 优势：**

1. **体积极小**：只包含 WebView，应用体积可控制在 10MB 以内
2. **内存效率高**：使用系统 WebView，不包含独立浏览器引擎
3. **性能卓越**：Rust 后端可以处理 CPU 密集型任务
4. **安全性更强**：Rust 的内存安全特性减少了安全漏洞
5. **原生集成**：更容易调用系统 API 和原生库

### 9.5 我的思考：什么时候选Tauri

**选择 Tauri 的场景：**

1. **对包体积敏感**
   - 需要通过网络分发的应用
   - 用户可能不愿下载 100MB+ 的安装包
   - 离线或低带宽环境

2. **性能要求高**
   - 需要处理大量数据或复杂计算
   - 对启动速度有严格要求
   - 内存受限的环境（如树莓派）

3. **团队有 Rust 能力**
   - 团队成员熟悉 Rust
   - 可以编写和维护 Rust 后端代码
   - 需要高度定制的原生功能

4. **资源密集型后端**
   - 需要直接调用系统 API
   - 需要使用 Rust 生态库
   - 需要高并发处理能力

**继续选择 Electron 的场景：**

1. **现有 Electron 项目**
   - 已经投资了大量时间和代码
   - 团队不熟悉 Rust

2. **npm 依赖密集**
   - 项目依赖大量 npm 包
   - 难以用 Rust 重写
   - 需要使用 Node.js 特有的库

3. **团队 Web 技术栈**
   - 团队主要是前端开发者
   - 缺乏 Rust 开发经验
   - 开发效率优先

4. **复杂 UI 需求**
   - 需要大量 Web 特有功能
   - 依赖 Electron 特有的 API
   - 需要与 VS Code 等 Electron 应用集成

**折中方案：**

- 如果两个框架都不完全满足需求，可以考虑：
  - **Neutralinojs**：更轻量但功能有限
  - **Flutter**：完全自绘，体积适中
  - **Qt WebEngine**：功能强大但体积大

---

## 总结

本指南涵盖了 Electron 桌面应用开发的全方面知识：

| 模块 | 核心要点 |
|------|----------|
| **基础** | Chromium + Node.js 架构，与 Qt/Tauri/Flutter 对比 |
| **架构** | 主进程/渲染进程分离，IPC 通信，Context Bridge 安全桥接 |
| **桌面功能** | 窗口管理、系统托盘、菜单栏、文件拖拽 |
| **Node.js 集成** | 文件系统、SQLite 数据库、网络请求 |
| **React 集成** | Vite 构建、Zustand 状态管理、IPC 封装 |
| **性能优化** | 启动速度、内存占用、渲染进程、大数据处理 |
| **安全** | Context Isolation、CSP、远程内容限制 |
| **打包分发** | electron-builder、代码签名、自动更新、应用商店 |
| **Tauri 对比** | 架构差异、性能对比、选型建议 |

掌握这些知识后，你将能够开发功能完善、性能良好、安全可靠的 Electron 桌面应用。

---

## 参考资源

- [Electron 官方文档](https://www.electronjs.org/docs)
- [electron-builder 文档](https://www.electron.build/)
- [Electron 安全最佳实践](https://www.electronjs.org/docs/tutorial/security)
- [Tauri 官方文档](https://tauri.app/)
- [Rust 桌面应用开发](https://rust-cli.github.io/book/)
