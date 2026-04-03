# Electron桌面应用开发完全指南

## 前言：为什么选择Electron

Electron是一个让我们可以用Web技术（HTML、CSS、JavaScript）来构建跨平台桌面应用的框架。它由GitHub开发，最初用于构建Atom编辑器，后来被广泛应用于VS Code、Slack、Discord等知名应用。

**Electron的核心优势：**
- 一套代码，多平台运行（Windows、macOS、Linux）
- 可以直接使用所有Node.js生态的npm包
- 开发效率高，Web开发者几乎零学习成本
- 社区活跃，文档完善，生态成熟

**Electron的不足：**
- 打包体积较大（包含完整的Chromium和Node.js）
- 内存占用相对较高
- 性能不如纯原生应用

本文将从实战角度，深入讲解Electron的开发、调试和打包优化。

---

## 一、Electron核心概念

### 1.1 主进程与渲染进程

Electron应用运行在两个核心进程中：主进程（Main Process）和渲染进程（Renderer Process）。

**主进程**是整个应用的入口点，负责：
- 创建和管理浏览器窗口（BrowserWindow）
- 处理应用生命周期（启动、退出、前台/后台切换）
- 管理原生菜单、托盘图标、系统托盘
- 协调多个渲染进程
- 访问Node.js原生API和系统级操作

**渲染进程**是每个窗口中运行的页面，负责：
- 渲染UI界面（HTML、CSS）
- 执行JavaScript代码
- 处理用户交互事件
- 通过IPC与主进程通信

```javascript
// 主进程文件：main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

// 创建浏览器窗口的函数
function createWindow() {
  // BrowserWindow的构造函数接收一个配置对象
  const mainWindow = new BrowserWindow({
    width: 1200,          // 窗口宽度（像素）
    height: 800,          // 窗口高度（像素）
    minWidth: 800,         // 最小宽度，防止窗口过小
    minHeight: 600,        // 最小高度
    title: '我的Electron应用', // 窗口标题
    backgroundColor: '#ffffff', // 背景颜色
    webPreferences: {
      // 是否启用Node.js集成（渲染进程中访问Node API）
      nodeIntegration: false,   // 出于安全考虑，默认false
      // 是否启用上下文隔离（推荐开启）
      contextIsolation: true,
      // 预加载脚本路径（用于安全地暴露IPC接口）
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // 加载应用的主页面
  mainWindow.loadFile('index.html');

  // 开启开发者工具（开发时使用）
  mainWindow.webContents.openDevTools();

  // 当窗口关闭时触发
  mainWindow.on('closed', () => {
    // 取消引用窗口对象，如果应用支持多窗口，通常在这里存储窗口引用
    mainWindow = null;
  });
}

// 当Electron完成初始化时触发
app.whenReady().then(() => {
  createWindow();

  // macOS特有：激活应用时如果没有窗口，则创建新窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 所有窗口关闭时触发（macOS除外）
app.on('window-all-closed', () => {
  // 在macOS上，应用通常在菜单栏保持活跃
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

**为什么默认关闭nodeIntegration？**
- 如果开启，渲染进程中的JavaScript可以直接访问require等Node.js全局对象
- 这会导致XSS攻击风险剧增，恶意网页可以完全控制你的系统
- contextIsolation: true 会把渲染进程和Node.js环境完全隔离
- 通过preload脚本可以安全地暴露特定的API给渲染进程

### 1.2 预加载脚本（Preload Script）

预加载脚本是连接主进程和渲染进程的桥梁。它在渲染进程加载之前执行，可以安全地暴露特定API给渲染进程。

```javascript
// preload.js - 预加载脚本
const { contextBridge, ipcRenderer } = require('electron');

// 通过contextBridge安全地暴露API到渲染进程
// 这样渲染进程无法直接访问Node.js，只能使用我们暴露的方法
contextBridge.exposeInMainWorld('electronAPI', {
  // 暴露读取文件的API
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),

  // 暴露写入文件的API
  writeFile: (filePath, content) => ipcRenderer.invoke('file:write', filePath, content),

  // 暴露打开文件对话框的API
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),

  // 暴露系统信息获取的API
  getSystemInfo: () => ipcRenderer.invoke('system:getInfo'),

  // 监听主进程推送的消息（用于实时更新）
  onUpdate: (callback) => {
    // 每当收到'update'消息时调用callback
    ipcRenderer.on('update', (event, data) => callback(data));
  }
});
```

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Electron应用</title>
</head>
<body>
  <h1>文件查看器</h1>
  <button id="openBtn">打开文件</button>
  <pre id="content"></pre>

  <script>
    // 使用预加载脚本暴露的API
    document.getElementById('openBtn').addEventListener('click', async () => {
      try {
        // 调用打开文件对话框
        const filePath = await window.electronAPI.openFileDialog();
        if (filePath) {
          // 读取文件内容
          const content = await window.electronAPI.readFile(filePath);
          document.getElementById('content').textContent = content;
        }
      } catch (error) {
        console.error('读取文件失败:', error);
      }
    });

    // 监听主进程推送的更新
    window.electronAPI.onUpdate((data) => {
      console.log('收到更新:', data);
    });
  </script>
</body>
</html>
```

---

## 二、IPC通信详解

### 2.1 IPC基础概念

IPC（Inter-Process Communication，进程间通信）是Electron中主进程和渲染进程交换数据的核心机制。Electron提供了两种IPC方式：

1. **invoke/handle**：双向异步通信，渲染进程调用，主进程处理并返回结果
2. **send/on**：单向通信，不需要等待响应

```javascript
// 主进程：main.js
const { ipcMain } = require('electron');
const fs = require('fs');

// 注册处理程序 - 处理渲染进程的调用
// invoke方式：返回一个Promise
ipcMain.handle('file:read', async (event, filePath) => {
  try {
    // 读取文件内容
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return { success: true, data: content };
  } catch (error) {
    // 返回错误信息
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file:write', async (event, filePath, content) => {
  try {
    await fs.promises.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 处理不需要返回值的单向消息
ipcMain.on('app:minimize', (event) => {
  // 获取发送消息的窗口
  const window = BrowserWindow.fromWebContents(event.sender);
  window.minimize();
});

ipcMain.on('app:maximize', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window.isMaximized()) {
    window.unmaximize();
  } else {
    window.maximize();
  }
});

// 向渲染进程推送消息
function sendUpdateToRenderer(data) {
  // 获取所有窗口
  const windows = BrowserWindow.getAllWindows();
  windows.forEach(window => {
    // 发送消息到渲染进程
    window.webContents.send('update', data);
  });
}
```

### 2.2 渲染进程调用IPC

```javascript
// 渲染进程：renderer.js
// 使用async/await风格调用主进程API

// 调用主进程的处理程序并获取返回结果
async function loadFile(filePath) {
  try {
    // invoke返回一个Promise，直接await获取结果
    const result = await window.electronAPI.readFile(filePath);
    if (result.success) {
      console.log('文件内容:', result.data);
      return result.data;
    } else {
      console.error('读取失败:', result.error);
    }
  } catch (error) {
    console.error('调用失败:', error);
  }
}

// 发送单向消息（不需要等待响应）
function minimizeWindow() {
  window.electronAPI.minimize();
}

function maximizeWindow() {
  window.electronAPI.maximize();
}
```

### 2.3 IPC通信的最佳实践

```javascript
// 主进程：定义统一的IPC通道
// ipcChannels.js - 集中管理所有IPC通道

const { ipcMain } = require('electron');

// 文件操作通道
const FileChannel = {
  CHANNEL_NAME: 'file',
  // 注册所有文件相关的处理程序
  register(handle) {
    ipcMain.handle(`${this.CHANNEL_NAME}:read`, async (event, filePath) => {
      return await handle.read(filePath);
    });

    ipcMain.handle(`${this.CHANNEL_NAME}:write`, async (event, filePath, content) => {
      return await handle.write(filePath, content);
    });

    ipcMain.handle(`${this.CHANNEL_NAME}:exists`, async (event, filePath) => {
      return await handle.exists(filePath);
    });
  }
};

// 系统操作通道
const SystemChannel = {
  CHANNEL_NAME: 'system',
  register(handle) {
    ipcMain.handle(`${this.CHANNEL_NAME}:getInfo`, async () => {
      return await handle.getInfo();
    });

    ipcMain.handle(`${this.CHANNEL_NAME}:getPlatform`, async () => {
      return process.platform;
    });

    ipcMain.handle(`${this.CHANNEL_NAME}:getVersion`, async () => {
      return process.versions;
    });
  }
};

// 应用操作通道
const AppChannel = {
  CHANNEL_NAME: 'app',
  register(handle) {
    ipcMain.on(`${this.CHANNEL_NAME}:minimize`, (event) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      window.minimize();
    });

    ipcMain.on(`${this.CHANNEL_NAME}:maximize`, (event) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      window.isMaximized() ? window.unmaximize() : window.maximize();
    });

    ipcMain.on(`${this.CHANNEL_NAME}:close`, (event) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      window.close();
    });
  }
};

module.exports = { FileChannel, SystemChannel, AppChannel };
```

---

## 三、Node.js集成与原生能力

### 3.1 为什么需要Node.js集成

Electron的核心优势之一就是能在桌面应用中直接使用Node.js生态。这意味着你可以：

- 使用npm上的成千上万个包
- 直接读写文件系统
- 创建网络请求（不只是fetch，还有socket、FTP等）
- 调用系统命令
- 访问数据库
- 等等...

### 3.2 文件系统操作实战

```javascript
// 主进程：fs模块使用
const fs = require('fs');
const path = require('path');

class FileManager {
  constructor(basePath) {
    this.basePath = basePath;
  }

  // 读取整个文件
  async readFile(fileName) {
    const filePath = path.join(this.basePath, fileName);
    try {
      // 异步读取文件
      const content = await fs.promises.readFile(filePath, 'utf-8');
      return { success: true, data: content };
    } catch (error) {
      // 处理文件不存在等错误
      if (error.code === 'ENOENT') {
        return { success: false, error: '文件不存在' };
      }
      return { success: false, error: error.message };
    }
  }

  // 写入文件（自动创建目录）
  async writeFile(fileName, content) {
    const filePath = path.join(this.basePath, fileName);
    try {
      // 确保目录存在
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
      // 写入文件
      await fs.promises.writeFile(filePath, content, 'utf-8');
      return { success: true, path: filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 列出目录内容
  async listDir(dirName = '') {
    const dirPath = path.join(this.basePath, dirName);
    try {
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
      // 整理目录条目信息
      const items = entries.map(entry => ({
        name: entry.name,
        isDirectory: entry.isDirectory(),
        isFile: entry.isFile(),
        path: path.join(dirPath, entry.name)
      }));
      return { success: true, data: items };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 监听文件变化
  watchFile(fileName, callback) {
    const filePath = path.join(this.basePath, fileName);
    // 使用fs.watch监听文件变化
    const watcher = fs.watch(filePath, (eventType, filename) => {
      callback({ eventType, filename });
    });
    return watcher;
  }
}

module.exports = FileManager;
```

### 3.3 子进程与系统命令

```javascript
// 主进程：使用child_process执行系统命令
const { spawn } = require('child_process');
const { ipcMain } = require('electron');

// 执行外部命令
function executeCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    // spawn创建子进程
    // options.shell设为true可以执行shell命令字符串
    const child = spawn(command, args, {
      cwd: options.cwd,       // 工作目录
      env: options.env,       // 环境变量
      shell: true             // 在shell中执行
    });

    let stdout = '';  // 标准输出
    let stderr = '';  // 标准错误

    // 收集标准输出数据
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    // 收集标准错误数据
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // 子进程退出时
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, stdout, stderr });
      } else {
        resolve({ success: false, code, stdout, stderr });
      }
    });

    // 进程错误时
    child.on('error', (error) => {
      reject(error);
    });
  });
}

// 注册IPC处理程序
ipcMain.handle('system:execute', async (event, command, args, options) => {
  return await executeCommand(command, args, options);
});

// 实时输出命令执行结果（用于长时任务）
function executeCommandStreaming(command, args, onData, onError, onClose) {
  const child = spawn(command, args, { shell: true });

  child.stdout.on('data', (data) => {
    onData(data.toString());
  });

  child.stderr.on('data', (data) => {
    onError(data.toString());
  });

  child.on('close', (code) => {
    onClose(code);
  });

  return child; // 返回子进程以便控制
}
```

### 3.4 原生对话框与系统交互

```javascript
// 主进程：使用Electron的dialog模块
const { dialog } = require('electron');

// 打开文件对话框
async function showOpenDialog(mainWindow) {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '选择文件',                    // 对话框标题
    defaultPath: '/Users',                // 默认路径
    buttonLabel: '确认选择',               // 确认按钮文字
    filters: [                            // 文件过滤器
      { name: '文本文件', extensions: ['txt', 'md', 'json'] },
      { name: '所有文件', extensions: ['*'] }
    ],
    properties: ['openFile']              // 对话框属性：打开文件
    // 还可以是：'openDirectory', 'multiSelections', 'showHiddenFiles'
  });

  // result.canceled - 用户是否取消
  // result.filePaths - 选择的文件路径数组
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0]; // 返回第一个选择的文件
  }
  return null;
}

// 打开目录对话框
async function showDirectoryDialog(mainWindow) {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '选择文件夹',
    properties: ['openDirectory']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
}

// 保存文件对话框
async function showSaveDialog(mainWindow, defaultName = 'untitled.txt') {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: '保存文件',
    defaultPath: defaultName,
    filters: [
      { name: '文本文件', extensions: ['txt'] },
      { name: '所有文件', extensions: ['*'] }
    ]
  });

  if (!result.canceled) {
    return result.filePath;
  }
  return null;
}

// 消息对话框（确认框、提示框）
async function showMessageBox(mainWindow) {
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'question',        // 对话框类型：'none', 'info', 'error', 'question', 'warning'
    buttons: ['是', '否', '取消'],  // 按钮
    defaultId: 0,             // 默认选中的按钮索引
    cancelId: 2,              // 取消按钮的索引（点击关闭按钮时返回）
    title: '确认操作',         // 标题
    message: '确定要执行此操作吗？', // 主消息
    detail: '此操作不可撤销，请谨慎操作。' // 详细说明
  });

  // 返回点击的按钮索引
  return result.response; // 0: 是, 1: 否, 2: 取消
}
```

---

## 四、应用生命周期管理

### 4.1 应用生命周期事件

```javascript
// 主进程：app模块管理应用生命周期
const { app } = require('electron');

// ready - Electron完成初始化
// 这是启动应用主要逻辑的最佳时机
app.whenReady().then(() => {
  console.log('应用已准备就绪');
  createWindow();
});

// macOS特有：点击Dock图标时触发
// 如果没有窗口，需要创建一个
app.on('activate', (event, hasVisibleWindows) => {
  if (!hasVisibleWindows) {
    createWindow();
  }
});

// window-all-closed - 所有窗口关闭时触发
// macOS上通常不退出应用（保持菜单栏活跃）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit(); // 非macOS系统退出应用
  }
});

// before-quit - 应用退出前触发
// 可以在这里执行清理操作
app.on('before-quit', (event) => {
  console.log('应用即将退出');
  // 可以阻止退出：event.preventDefault();
  // 保存数据、关闭数据库连接等
});

// will-quit - 应用即将完全退出时触发
app.on('will-quit', (event) => {
  console.log('应用将完全退出');
  // 取消注册所有全局快捷键
});

// quit - 应用完全退出时触发
app.on('quit', (event) => {
  console.log('应用已退出');
});
```

### 4.2 多窗口管理

```javascript
// 主进程：管理多个窗口
const { app, BrowserWindow } = require('electron');

class WindowManager {
  constructor() {
    this.windows = new Map(); // 存储所有窗口，key为窗口ID
    this.windowCounter = 0;   // 窗口计数器
  }

  // 创建新窗口
  createWindow(options = {}) {
    const id = ++this.windowCounter; // 生成唯一ID

    const window = new BrowserWindow({
      width: options.width || 1200,
      height: options.height || 800,
      minWidth: options.minWidth || 800,
      minHeight: options.minHeight || 600,
      x: options.x,               // 窗口x坐标（未指定则居中）
      y: options.y,               // 窗口y坐标
      title: options.title || '新窗口',
      backgroundColor: options.backgroundColor || '#ffffff',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: options.preload || path.join(__dirname, 'preload.js')
      }
    });

    // 加载内容
    if (options.url) {
      window.loadURL(options.url);
    } else if (options.file) {
      window.loadFile(options.file);
    }

    // 窗口关闭时从管理器移除
    window.on('closed', () => {
      this.windows.delete(id);
      console.log(`窗口 ${id} 已关闭`);
    });

    // 保存窗口
    this.windows.set(id, window);
    return { id, window };
  }

  // 根据ID获取窗口
  getWindow(id) {
    return this.windows.get(id);
  }

  // 获取所有窗口
  getAllWindows() {
    return Array.from(this.windows.values());
  }

  // 关闭所有窗口
  closeAll() {
    this.windows.forEach((window) => {
      window.close();
    });
  }

  // 向所有窗口广播消息
  broadcast(channel, data) {
    this.windows.forEach((window) => {
      window.webContents.send(channel, data);
    });
  }
}

module.exports = WindowManager;
```

### 4.3 系统托盘

```javascript
// 主进程：系统托盘（System Tray）
const { app, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

class TrayManager {
  constructor(mainWindow) {
    this.tray = null;
    this.mainWindow = mainWindow;
  }

  create() {
    // 创建托盘图标（可以是.png或空图标用系统默认）
    // nativeImage.createFromPath接受图片路径
    const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');

    // 如果图标不存在，创建一个简单的图标
    let icon;
    try {
      icon = nativeImage.createFromPath(iconPath);
      if (icon.isEmpty()) {
        // 创建一个16x16的简单图标
        icon = nativeImage.createEmpty();
      }
    } catch (e) {
      icon = nativeImage.createEmpty();
    }

    // 创建托盘实例
    this.tray = new Tray(icon);

    // 设置鼠标悬停时显示的提示文字
    this.tray.setToolTip('我的Electron应用');

    // 创建托盘菜单
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示主窗口',
        click: () => {
          // 显示并聚焦主窗口
          if (this.mainWindow) {
            this.mainWindow.show();
            this.mainWindow.focus();
          }
        }
      },
      {
        label: '隐藏主窗口',
        click: () => {
          if (this.mainWindow) {
            this.mainWindow.hide();
          }
        }
      },
      { type: 'separator' }, // 分隔线
      {
        label: '功能1',
        click: () => {
          console.log('功能1被点击');
        }
      },
      {
        label: '功能2',
        submenu: [ // 子菜单
          {
            label: '子功能A',
            click: () => console.log('子功能A')
          },
          {
            label: '子功能B',
            click: () => console.log('子功能B')
          }
        ]
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          // 退出应用
          app.quit();
        }
      }
    ]);

    // 设置右键菜单
    this.tray.setContextMenu(contextMenu);

    // 点击托盘图标的事件（macOS上通常是打开主窗口）
    this.tray.on('click', () => {
      if (this.mainWindow) {
        if (this.mainWindow.isVisible()) {
          this.mainWindow.hide();
        } else {
          this.mainWindow.show();
        }
      }
    });
  }

  // 更新托盘菜单
  updateMenu(newMenuTemplate) {
    const contextMenu = Menu.buildFromTemplate(newMenuTemplate);
    this.tray.setContextMenu(contextMenu);
  }

  // 销毁托盘
  destroy() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}

module.exports = TrayManager;
```

---

## 五、打包与分发

### 5.1 electron-builder配置

electron-builder是最流行的Electron打包工具，支持多平台打包。

```json
{
  "name": "my-electron-app",
  "version": "1.0.0",
  "description": "我的Electron应用",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "dev": "electron . --enable-logging",
    "build": "electron-builder",
    "build:win": "electron-builder --win",
    "build:mac": "electron-builder --mac",
    "build:linux": "electron-builder --linux"
  },
  "build": {
    "appId": "com.mycompany.myapp",      // 应用唯一ID
    "productName": "我的应用",             // 应用显示名称
    "directories": {
      "output": "dist"                    // 输出目录
    },
    "files": [
      "main.js",
      "preload.js",
      "index.html",
      "assets/**/*",
      "node_modules/**/*"
    ],
    "win": {
      "target": [
        {
          "target": "nsis",               // Windows安装包
          "arch": ["x64"]                 // 64位
        },
        {
          "target": "portable",           // 便携版（无需安装）
          "arch": ["x64"]
        }
      ],
      "icon": "assets/icon.ico"           // Windows图标
    },
    "mac": {
      "target": ["dmg", "zip"],
      "icon": "assets/icon.icns",
      "category": "public.app-category.productivity"
    },
    "linux": {
      "target": ["AppImage", "deb"],
      "icon": "assets/icon.png",
      "category": "Utility"
    },
    "nsis": {
      "oneClick": false,                  // 不一键安装
      "allowToChangeInstallationDirectory": true,  // 允许用户选择安装目录
      "createDesktopShortcut": true,      // 创建桌面快捷方式
      "createStartMenuShortcut": true     // 创建开始菜单快捷方式
    },
    "asar": true,                         // 打包为asar归档（保护源码）
    "compression": "maximum"              // 最大压缩
  }
}
```

### 5.2 打包优化技巧

```javascript
// package.json - 优化配置
{
  "build": {
    // 1. 使用代码压缩
    "asar": true,
    "compression": "maximum",

    // 2. 排除不必要的文件（大大减小体积）
    "files": [
      "!node_modules/**/test/**",       // 排除测试文件
      "!node_modules/**/docs/**",       // 排除文档
      "!node_modules/**/__tests__/**",
      "!node_modules/**/example/**",
      "!node_modules/**/examples/**",
      "!.git/**",
      "!.gitignore",
      "!*.md",
      "!LICENSE*"
    ],

    // 3. 使用更小的图标格式
    "win": {
      "icon": "build/icon.ico"           // ICO格式比PNG在Windows上更小
    },

    // 4. 启用UPX压缩（需要安装UPX工具）
    "win": {
      "upx": true,
      "upxCompressionLevel": 9           // 最大压缩级别
    },

    // 5. 配置忽略规则（排除特定文件）
    "npmRebuild": false,                 // 不重新编译原生模块

    // 6. 使用远程模块
    "buildDependenciesFromSource": false
  }
}
```

### 5.3 分发与自动更新

```javascript
// 主进程：配置自动更新（使用electron-updater）
const { autoUpdater } = require('electron-updater');
const { ipcMain } = require('electron');

// 配置日志输出
autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';

// 检查更新的函数
function checkForUpdates() {
  // autoUpdater.checkForUpdates() 会检查更新并返回更新信息
  autoUpdater.checkForUpdates().then(result => {
    console.log('检查更新结果:', result);
  }).catch(error => {
    console.error('检查更新失败:', error);
  });
}

// 当有可用更新时触发（下载开始前）
autoUpdater.on('checking-for-update', () => {
  console.log('正在检查更新...');
  // 可以通知渲染进程显示"检查中"状态
});

// 当有可用更新时触发
autoUpdater.on('update-available', (info) => {
  console.log('发现新版本:', info.version);
  // info包含版本信息：version, releaseDate, releaseNotes等
  // 可以通知渲染进程显示"发现新版本"提示
});

// 当没有可用更新时触发
autoUpdater.on('update-not-available', (info) => {
  console.log('当前已是最新版本');
});

// 下载进度触发
autoUpdater.on('download-progress', (progressObj) => {
  // progressObj.percent - 下载百分比
  // progressObj.bytesPerSecond - 下载速度
  // progressObj.total - 总字节数
  console.log(`下载进度: ${progressObj.percent.toFixed(1)}%`);
  // 可以通知渲染进程更新进度条
});

// 下载完成时触发
autoUpdater.on('update-downloaded', (info) => {
  console.log('更新下载完成');
  // 通知用户并询问是否立即安装
  // 提示用户：可以立即重启更新，也可以稍后更新
});

// 安装更新并重启
function installUpdate() {
  autoUpdater.quitAndInstall();
}

// 注册IPC处理程序
ipcMain.handle('app:checkUpdate', async () => {
  await autoUpdater.checkForUpdates();
});
```

---

## 六、调试技巧

### 6.1 主进程调试

```javascript
// 主进程调试：使用electron-log记录日志
const log = require('electron-log');
const { ipcMain } = require('electron');

// 配置日志
log.transports.file.level = 'debug';      // 日志级别
log.transports.file.maxSize = 10 * 1024 * 1024;  // 最大10MB
log.transports.console.level = 'debug';    // 同时输出到控制台

// 替换全局console（让console.log自动记录到文件）
Object.assign(console, log.functions);

log.info('应用启动');       // 信息日志
log.warn('警告信息');       // 警告日志
log.error('错误信息');      // 错误日志
log.debug('调试信息');      // 调试日志

// 捕获未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  log.error('未处理的Promise拒绝:', reason);
});

// 捕获未捕获的异常
process.on('uncaughtException', (error) => {
  log.error('未捕获的异常:', error);
  // 在生产环境中，应该优雅退出并发送错误报告
  app.exit(1);
});
```

### 6.2 渲染进程调试

```javascript
// 渲染进程：使用Chrome DevTools

// 方式1：在创建窗口时打开DevTools
function createWindow() {
  const mainWindow = new BrowserWindow({...});
  mainWindow.webContents.openDevTools();
}

// 方式2：在渲染进程中远程调试
// 在渲染进程执行以下代码（在DevTools Console中）
// 或者在DevTools的Console面板中执行
window.postMessage('open-devtools', '*');

// 方式3：使用IPC让主进程打开DevTools
// 在渲染进程中
const openDevTools = () => {
  // 通过IPC通知主进程打开DevTools
  require('electron').ipcRenderer.send('devtools:open');
};

// 在主进程中监听
ipcMain.on('devtools:open', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  window.webContents.toggleDevTools();
});
```

### 6.3 常见问题排查

```javascript
// 问题1：渲染进程白屏
// 可能原因：
// 1. 加载的HTML文件路径错误
// 2. 缺少必要的依赖
// 3. 预加载脚本错误

// 排查方法：
window.onerror = (message, source, lineno, colno, error) => {
  console.error('渲染进程错误:', {
    message, source, lineno, colno, error
  });
};

// 问题2：IPC通信失败
// 检查清单：
// 1. 是否在正确的地方注册了处理程序（主进程）
// 2. 是否正确使用了contextBridge暴露API
// 3. 是否在正确的通道上监听/发送消息

// 添加详细的错误日志
ipcMain.handle('channel:name', async (event, ...args) => {
  console.log('收到IPC请求:', { channel: 'channel:name', args });
  try {
    const result = await doSomething(...args);
    console.log('IPC响应成功:', result);
    return result;
  } catch (error) {
    console.error('IPC处理失败:', error);
    throw error;
  }
});

// 问题3：内存泄漏
// 使用Chrome DevTools的Memory面板
// 1. 拍摄快照（Take heap snapshot）
// 2. 比较快照找出泄漏对象
// 3. 检查事件监听器是否正确移除
```

---

## 七、实战项目结构

### 7.1 推荐的项目结构

```
my-electron-app/
├── package.json          # 项目配置
├── main.js               # 主进程入口
├── preload.js            # 预加载脚本
├── src/
│   ├── main/             # 主进程代码
│   │   ├── index.js      # 主进程入口
│   │   ├── ipc/          # IPC处理程序
│   │   │   ├── fileHandler.js
│   │   │   ├── systemHandler.js
│   │   │   └── appHandler.js
│   │   ├── windows/      # 窗口管理
│   │   │   └── WindowManager.js
│   │   ├── tray/         # 托盘管理
│   │   │   └── TrayManager.js
│   │   └── utils/        # 工具函数
│   │       └── logger.js
│   └── renderer/         # 渲染进程代码
│       ├── index.html    # 主页HTML
│       ├── styles/       # 样式文件
│       │   └── main.css
│       ├── scripts/      # JavaScript文件
│       │   └── app.js
│       └── components/   # UI组件
│           ├── Button.js
│           └── Modal.js
├── assets/               # 静态资源
│   ├── icons/           # 应用图标
│   └── images/          # 图片资源
└── build/                # 构建资源
    └── icon.ico          # Windows图标
```

### 7.2 完整的项目示例

```javascript
// main.js - 完整的主进程示例
const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// ============================================
// 导入自定义模块
// ============================================
const FileHandler = require('./src/main/ipc/fileHandler');
const SystemHandler = require('./src/main/ipc/systemHandler');
const AppHandler = require('./src/main/ipc/appHandler');
const WindowManager = require('./src/main/windows/WindowManager');
const TrayManager = require('./src/main/tray/TrayManager');
const logger = require('./src/main/utils/logger');

// ============================================
// 全局变量
// ============================================
let mainWindow = null;        // 主窗口引用
let trayManager = null;       // 托盘管理器
const windowManager = new WindowManager();  // 窗口管理器

// ============================================
// 创建主窗口
// ============================================
function createMainWindow() {
  mainWindow = windowManager.createWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: '我的Electron应用',
    preload: path.join(__dirname, 'preload.js'),
    file: path.join(__dirname, 'src/renderer/index.html')
  });

  // 创建托盘
  trayManager = new TrayManager(mainWindow.window);
  trayManager.create();

  // 创建应用菜单
  createAppMenu();

  // 打开开发者工具（开发模式）
  if (process.argv.includes('--dev')) {
    mainWindow.window.webContents.openDevTools();
  }
}

// ============================================
// 创建应用菜单
// ============================================
function createAppMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '打开文件',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow.window, {
              properties: ['openFile']
            });
            if (!result.canceled) {
              mainWindow.window.webContents.send('file:opened', result.filePaths[0]);
            }
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
          click: () => app.quit()
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { label: '重新加载', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: '强制重新加载', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { type: 'separator' },
        { label: '放大', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: '缩小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { label: '重置缩放', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { type: 'separator' },
        { label: '全屏', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: '窗口',
      submenu: [
        { label: '最小化', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
        { label: '关闭', accelerator: 'CmdOrCtrl+W', role: 'close' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            dialog.showMessageBox(mainWindow.window, {
              type: 'info',
              title: '关于',
              message: '我的Electron应用',
              detail: '版本 1.0.0\n基于Electron构建'
            });
          }
        }
      ]
    }
  ];

  // macOS特有：添加应用菜单
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ============================================
// 注册IPC处理程序
// ============================================
function registerIpcHandlers() {
  // 文件操作处理程序
  FileHandler.register(ipcMain);
  // 系统操作处理程序
  SystemHandler.register(ipcMain);
  // 应用操作处理程序
  AppHandler.register(ipcMain, mainWindow.window);
}

// ============================================
// 应用生命周期
// ============================================
app.whenReady().then(() => {
  logger.info('应用启动');

  // 注册IPC处理程序
  registerIpcHandlers();

  // 创建主窗口
  createMainWindow();

  // macOS特有
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// 所有窗口关闭时（macOS除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 应用退出前
app.on('before-quit', () => {
  logger.info('应用即将退出');
  if (trayManager) {
    trayManager.destroy();
  }
});

// 全局错误处理
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常:', error);
});
```

---

## 八、性能优化

### 8.1 减少打包体积

1. **排除不必要的文件**：在package.json的build.files中精确指定
2. **使用asar归档**：保护源码的同时减少文件数量
3. **压缩资源**：压缩HTML、CSS、JS、图片
4. **延迟加载**：不常用的模块采用动态导入

### 8.2 减少内存占用

```javascript
// 1. 及时释放窗口引用
window.on('closed', () => {
  mainWindow = null; // 手动置空，帮助垃圾回收
});

// 2. 移除事件监听器
function createButton() {
  const button = document.getElementById('myButton');

  // 使用once选项只监听一次
  button.addEventListener('click', handleClick, { once: true });
}

// 3. 避免内存泄漏的定时器
let timer = setInterval(() => {
  // 处理逻辑
}, 1000);

// 组件卸载时清除定时器
function cleanup() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
```

### 8.3 启动速度优化

```javascript
// 1. 延迟加载非必要模块
app.whenReady().then(async () => {
  // 先创建窗口显示UI
  createMainWindow();

  // 再异步加载其他模块
  const { autoUpdater } = await import('electron-updater');
  autoUpdater.checkForUpdates();

  const { analytics } = await import('./analytics');
  analytics.init();
});

// 2. 减少主进程初始化工作
// 将不需要立即执行的工作放到setImmediate中
app.whenReady().then(() => {
  createWindow();

  // 下一事件循环再执行
  setImmediate(() => {
    loadPlugins();
    initializeServices();
  });
});
```

---

## 总结

本文从Electron的核心概念出发，详细讲解了：

1. **主进程与渲染进程**的分工与协作
2. **IPC通信机制**的实现与最佳实践
3. **Node.js集成**在桌面应用中的实战应用
4. **应用生命周期管理**与多窗口、托盘管理
5. **打包分发**与自动更新配置
6. **调试技巧**与常见问题排查
7. **项目结构设计**与实战代码示例
8. **性能优化策略**

Electron是一个非常成熟的跨平台桌面应用开发框架，特别适合：
- 已有Web技术栈的团队快速开发桌面应用
- 需要跨平台（Windows/macOS/Linux）的应用
- 对原生功能要求不是特别极致的应用

如果你追求更小的体积和更好的性能，可以考虑下一章将要介绍的Tauri框架。
