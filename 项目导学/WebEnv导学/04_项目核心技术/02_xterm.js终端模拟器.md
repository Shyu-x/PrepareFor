# xterm.js 终端模拟器开发教程

## 目录

1. [xterm.js 是什么？](#1-xtermjs-是什么)
2. [基础集成](#2-基础集成)
3. [插件系统](#3-插件系统)
4. [与后端 WebSocket 通信](#4-与后端-websocket-通信)
5. [样式定制](#5-样式定制)
6. [项目中的实际使用](#6-项目中的实际使用)

---

## 1. xterm.js 是什么？

### 1.1 简介

**xterm.js** 是终端模拟器的 JavaScript 实现，它是 **xterm** 项目的 TypeScript 重写版本。xterm.js 可以在浏览器中运行完整的终端模拟器，是 VS Code、Hyper 等知名项目的终端组件。

> **注意**: xterm.js 从 v5 版本开始使用新包名 `@xterm/xterm`，请勿混淆旧的 `xterm` 包名。

```bash
# 安装新版本 xterm.js（使用新包名）
npm install @xterm/xterm@6.0.0
npm install @xterm/addon-fit@0.11.0      # 自动适应容器大小
npm install @xterm/addon-search@0.16.0   # 搜索功能
npm install @xterm/addon-clipboard@0.2.0  # 剪贴板支持
npm install @xterm/addon-web-links@0.12.0 # 链接点击
npm install @xterm/addon-webgl@0.19.0     # WebGL 渲染加速
```

### 1.2 核心特性

| 特性 | 说明 |
|------|------|
| 终端模拟 | 支持 VT100、xterm、ANSI 转义序列 |
| Unicode 支持 | 完整支持 Unicode 字符和 emoji |
| 256 色 | 支持 256 色调色板 |
| True Color | 支持 24 位真彩色 |
| 链接检测 | 自动识别和可点击的链接 |
| 搜索 | 终端内容搜索功能 |
| 插件系统 | 丰富的插件生态 |

---

## 2. 基础集成

### 2.1 HTML 基础集成

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>xterm.js 示例</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/xterm@6.0.0/css/xterm.css" />
    <style>
        #terminal {
            width: 800px;
            height: 400px;
            padding: 10px;
        }
    </style>
</head>
<body>
    <div id="terminal"></div>

    <script src="https://cdn.jsdelivr.net/npm/xterm@6.0.0/lib/xterm.js"></script>
    <script>
        // 创建终端实例
        const term = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            theme: {
                background: '#1e1e1e',
                foreground: '#d4d4d4',
                cursor: '#ffffff'
            }
        });

        // 挂载到 DOM
        term.open(document.getElementById('terminal'));

        // 写入内容
        term.writeln('欢迎使用 xterm.js 终端模拟器!');
        term.writeln('$ ');

        // 处理输入
        term.onData(data => {
            // 处理用户输入
            console.log('用户输入:', data);
            term.write(data);
        });
    </script>
</body>
</html>
```

### 2.2 NPM 项目中使用

```bash
# 安装依赖
npm install xterm@6.0.0
```

```javascript
import { Terminal } from 'xterm';
import 'xterm/css/xterm.css';

// 创建终端实例
const term = new Terminal({
    // 基础配置
    cursorBlink: true,           // 光标闪烁
    cursorStyle: 'block',        // 光标样式: 'block' | 'underline' | 'bar'
    cursorWidth: 1,              // 光标宽度 (仅 bar 样式生效)
    scrollback: 1000,            // 回滚缓冲区大小

    // 字体配置
    fontSize: 14,
    fontFamily: '"Fira Code", Menlo, Monaco, monospace',
    lineHeight: 1.0,

    // 主题配置
    theme: {
        background: '#1e1e1e',
        foreground: '#cccccc',
        cursor: '#ffffff',
        cursorAccent: '#000000',
        selectionBackground: '#264f78',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5'
    },

    // 窗口配置
    allowTransparency: false,    // 允许透明背景
    title: 'Terminal',           // 窗口标题

    // 行为配置
    convertEol: false,           // 转换换行符 (NL -> CRNL)
    termName: 'xterm-256color', // 终端类型
    rightClickSelectsWord: true, // 右键选择单词
    rendererType: 'canvas',      // 渲染器类型: 'canvas' | 'dom'
    allowProposedApi: false      // 允许实验性 API
});

// 挂载到 DOM
term.open(document.getElementById('terminal-container'));

// 写入内容
term.write('\x1b[32m绿色文本\x1b[0m\n');
term.writeln('这是一行文本');

// 读取输入
term.onData((data) => {
    console.log('输入数据:', data);
});

// 窗口大小变化时调整
window.addEventListener('resize', () => {
    term.resize(width, height);
});
```

### 2.3 完整配置详解

```javascript
const term = new Terminal({
    // ===== 光标配置 =====
    cursorBlink: true,           // 光标闪烁
    cursorStyle: 'block',        // 光标样式: 'block' | 'underline' | 'bar'
    cursorWidth: 10,             // 光标宽度 (像素)

    // ===== 字体配置 =====
    fontSize: 14,                // 字体大小
    fontFamily: 'monospace',     // 字体系列
    lineHeight: 1.2,            // 行高
    letterSpacing: 0,            // 字间距

    // ===== 主题配置 =====
    theme: {
        // 背景和前景
        background: '#1e1e1e',
        foreground: '#cccccc',
        cursor: '#ffffff',
        cursorAccent: '#000000',

        // 选区
        selectionBackground: '#264f78',
        selectionInactiveBackground: '#264f7855',

        // ANSI 颜色 (16 色)
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',

        // 亮色 ANSI 颜色
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#ffffff',

        // 扩展颜色 (256 色模式)
        extendedAnsi: [...]

        // 链接
        link: '#4daafc',
        linkHover: '#dddddd'
    },

    // ===== 窗口配置 =====
    allowTransparency: false,   // 允许透明
    title: 'Terminal',           // 窗口标题
    windowTitle: 'Terminal',     // 窗口标题 (更精确)

    // ===== 滚动配置 =====
    scrollback: 1000,           // 回滚缓冲区行数
    smoothScrollDuration: 0,    // 平滑滚动持续时间 (ms)

    // ===== 行为配置 =====
    convertEol: false,           // NL -> CRNL 转换
    termName: 'xterm-256color',  // 终端类型
    cancelEvents: false,         // 取消默认事件
    disableStdin: false,         // 禁用输入
    allowProposedApi: false,     // 允许实验性 API
    rightClickSelectsWord: true, // 右键选择单词
    rendererType: 'canvas',      // 渲染器: 'canvas' | 'dom'

    // ===== 光标位置恢复 =====
    cursorSavePosition: false,   // 保存光标位置

    // ===== 标签配置 =====
    tabStopWidth: 8,             // Tab 宽度

    // ===== 屏幕配置 =====
    screenReaderMode: false,     // 屏幕阅读器模式
    allowCharset: true           // 允许字符集
});
```

---

## 3. 插件系统

### 3.1 Fit 插件 - 自动适应容器

```bash
npm install @xterm/addon-fit@0.11.0
```

```javascript
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import 'xterm/css/xterm.css';

// 创建终端
const term = new Terminal({
    fontSize: 14,
    fontFamily: 'monospace'
});

// 创建 Fit 插件
const fitAddon = new FitAddon();

// 加载插件
term.loadAddon(fitAddon);

// 挂载终端
term.open(document.getElementById('terminal'));

// 调用 fit
fitAddon.fit();

// 监听窗口大小变化
window.addEventListener('resize', () => {
    fitAddon.fit();
});

// 获取尺寸信息
console.log('列数:', fitAddon.proposeDimensions?.cols);
console.log('行数:', fitAddon.proposeDimensions?.rows);
```

### 3.2 Search 插件 - 搜索功能

```bash
npm install @xterm/addon-search@0.16.0
```

```javascript
import { Terminal } from 'xterm';
import { SearchAddon } from '@xterm/addon-search';
import 'xterm/css/xterm.css';

const term = new Terminal();
const searchAddon = new SearchAddon();

term.loadAddon(searchAddon);
term.open(document.getElementById('terminal'));

// 写入测试内容
term.writeln('Hello World');
term.writeln('This is a test');
term.writeln('Another line with Hello');

// 搜索
const result1 = searchAddon.findNext('Hello');  // 向下搜索
const result2 = searchAddon.findPrevious('test'); // 向上搜索

// 搜索并高亮所有匹配
searchAddon.findAll('line').forEach(match => {
    console.log('找到匹配:', match);
});

// 搜索选项
const searchOptions = {
    regex: false,          // 正则表达式
    caseSensitive: false,  // 区分大小写
    wholeWord: false       // 全词匹配
};

searchAddon.findNext('hello', searchOptions);
```

### 3.3 Clipboard 插件 - 剪贴板支持

```bash
npm install @xterm/addon-clipboard@0.2.0
```

```javascript
import { Terminal } from 'xterm';
import { ClipboardAddon } from '@xterm/addon-clipboard';

const term = new Terminal();
const clipboardAddon = new ClipboardAddon();

term.loadAddon(clipboardAddon);
term.open(document.getElementById('terminal'));

// 复制选中的内容到剪贴板
term.onSelectionChange(() => {
    const selection = term.getSelection();
    if (selection) {
        clipboardAddon.copy(selection);
    }
});

// 从剪贴板粘贴
document.getElementById('paste-button').addEventListener('click', async () => {
    const text = await navigator.clipboard.readText();
    term.paste(text);
});
```

### 3.4 WebLinks 插件 - 链接检测

```bash
npm install @xterm/addon-web-links@0.12.0
```

```javascript
import { Terminal } from 'xterm';
import { WebLinksAddon } from '@xterm/addon-web-links';
import 'xterm/css/xterm.css';

const term = new Terminal();

// 使用默认处理 (点击打开浏览器)
const webLinksAddon = new WebLinksAddon();
term.loadAddon(webLinksAddon);

// 自定义链接处理
const customWebLinksAddon = new WebLinksAddon((event, uri) => {
    // 自定义处理逻辑
    console.log('点击链接:', uri);
    // 在新窗口打开
    window.open(uri, '_blank');
});

term.loadAddon(customWebLinksAddon);
term.open(document.getElementById('terminal'));

// 写入带链接的内容
term.writeln('访问 https://example.com 了解更多信息');
term.writeln('发送邮件至 test@example.com');
```

### 3.5 Serialize 插件 - 序列化内容

```bash
npm install xterm-addon-serialize@0.14.0
```

```javascript
import { Terminal } from 'xterm';
import { SerializeAddon } from 'xterm-addon-serialize';
import 'xterm/css/xterm.css';

const term = new Terminal();
const serializeAddon = new SerializeAddon();

term.loadAddon(serializeAddon);
term.open(document.getElementById('terminal'));

term.writeln('第一行');
term.writeln('第二行');

// 序列化选项
const options = {
    scrollback: 1000,           // 包含的回滚行数
    format: 'plainText',        // 'plainText' | 'html' | 'ansi'
    renderer: true,             // 包含渲染器样式
    style: true                 // 包含内联样式
};

// 获取序列化内容
const text = serializeAddon.serialize(options);
console.log(text);

// 保存终端状态
function saveTerminalState() {
    return serializeAddon.serialize({
        format: 'plainText'
    });
}

// 恢复终端状态
function restoreTerminalState(text) {
    term.clear();
    term.write(text);
}
```

### 3.6 完整插件集成示例

```javascript
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { SearchAddon } from '@xterm/addon-search';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SerializeAddon } from 'xterm-addon-serialize';
import 'xterm/css/xterm.css';

class TerminalManager {
    constructor(container) {
        this.container = container;
        this.term = null;
        this.addons = {};

        this.init();
    }

    init() {
        // 创建终端实例
        this.term = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: '"Fira Code", monospace',
            theme: {
                background: '#1e1e1e',
                foreground: '#d4d4d4'
            },
            rendererType: 'canvas'
        });

        // 初始化插件
        this.initAddons();

        // 挂载终端
        this.term.open(this.container);

        // 适应容器大小
        this.addons.fit?.fit();

        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            this.addons.fit?.fit();
        });
    }

    initAddons() {
        // Fit 插件
        this.addons.fit = new FitAddon();
        this.term.loadAddon(this.addons.fit);

        // Search 插件
        this.addons.search = new SearchAddon();
        this.term.loadAddon(this.addons.search);

        // Web Links 插件
        this.addons.webLinks = new WebLinksAddon();
        this.term.loadAddon(this.addons.webLinks);

        // Serialize 插件
        this.addons.serialize = new SerializeAddon();
        this.term.loadAddon(this.addons.serialize);
    }

    // 搜索
    search(pattern, direction = 'next') {
        if (direction === 'next') {
            return this.addons.search.findNext(pattern);
        } else {
            return this.addons.search.findPrevious(pattern);
        }
    }

    // 获取内容
    getContent() {
        return this.addons.serialize.serialize({
            format: 'plainText'
        });
    }

    // 清空终端
    clear() {
        this.term.clear();
    }

    // 销毁终端
    dispose() {
        this.term.dispose();
    }
}
```

---

## 4. 与后端 WebSocket 通信

### 4.1 WebSocket 基础连接

```javascript
import { Terminal } from 'xterm';

class TerminalClient {
    constructor(container, wsUrl) {
        this.container = container;
        this.wsUrl = wsUrl;
        this.term = null;
        this.ws = null;
        this.isConnected = false;

        this.init();
    }

    init() {
        // 创建终端
        this.term = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: 'monospace',
            theme: {
                background: '#1e1e1e',
                foreground: '#d4d4d4'
            }
        });

        this.term.open(this.container);

        // 监听终端输入
        this.term.onData((data) => {
            this.send(data);
        });

        // 监听终端输出
        this.term.onResize(({ cols, rows }) => {
            if (this.isConnected) {
                this.sendTerminalSize(cols, rows);
            }
        });

        // 连接 WebSocket
        this.connect();
    }

    connect() {
        this.ws = new WebSocket(this.wsUrl);

        this.ws.onopen = () => {
            console.log('WebSocket 连接已建立');
            this.isConnected = true;

            // 发送初始窗口大小
            const { cols, rows } = this.term;
            this.sendTerminalSize(cols, rows);

            this.term.writeln('\x1b[32m连接成功\x1b[0m');
        };

        this.ws.onmessage = (event) => {
            // 将服务器返回的数据写入终端
            this.term.write(event.data);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket 错误:', error);
            this.term.writeln('\x1b[31m连接错误\x1b[0m');
        };

        this.ws.onclose = () => {
            console.log('WebSocket 连接已关闭');
            this.isConnected = false;
            this.term.writeln('\x1b[33m连接已关闭\x1b[0m');

            // 自动重连
            setTimeout(() => this.connect(), 3000);
        };
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'input',
                data: data
            }));
        }
    }

    sendTerminalSize(cols, rows) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'resize',
                cols: cols,
                rows: rows
            }));
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }

    dispose() {
        this.disconnect();
        this.term.dispose();
    }
}

// 使用
const client = new TerminalClient(
    document.getElementById('terminal'),
    'ws://localhost:8080/terminal'
);
```

### 4.2 使用 Socket.io

```javascript
import { Terminal } from 'xterm';
import { io } from 'socket.io-client';

class SocketIOTerminal {
    constructor(container, serverUrl) {
        this.term = null;
        this.socket = null;
        this.container = container;

        this.init(serverUrl);
    }

    init(serverUrl) {
        // 创建终端
        this.term = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: 'monospace'
        });

        this.term.open(this.container);

        // 初始化 Socket.io
        this.socket = io(serverUrl, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        this.setupEventHandlers();
    }

    setupEventHandlers() {
        // 连接成功
        this.socket.on('connect', () => {
            console.log('Socket.io 连接成功');
            this.term.writeln('\x1b[32m已连接到服务器\x1b[0m');

            // 发送终端尺寸
            const { cols, rows } = this.term;
            this.socket.emit('terminal:resize', { cols, rows });
        });

        // 接收服务器输出
        this.socket.on('terminal:data', (data) => {
            this.term.write(data);
        });

        // 发送终端输入
        this.term.onData((data) => {
            this.socket.emit('terminal:input', data);
        });

        // 终端尺寸变化
        this.term.onResize(({ cols, rows }) => {
            this.socket.emit('terminal:resize', { cols, rows });
        });

        // 连接错误
        this.socket.on('connect_error', (error) => {
            console.error('连接错误:', error);
            this.term.writeln(`\x1b[31m连接错误: ${error.message}\x1b[0m`);
        });

        // 断开连接
        this.socket.on('disconnect', () => {
            this.term.writeln('\x1b[33m服务器连接已断开\x1b[0m');
        });
    }

    // 发送命令
    sendCommand(command) {
        this.socket.emit('terminal:command', { command });
    }

    // 调整大小
    resize(cols, rows) {
        this.term.resize(cols, rows);
        this.socket.emit('terminal:resize', { cols, rows });
    }

    dispose() {
        this.socket?.disconnect();
        this.term?.dispose();
    }
}
```

### 4.3 Node.js 后端示例

```javascript
// Node.js 后端 WebSocket 服务器
const WebSocket = require('ws');
const { spawn } = require('child_process');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('客户端连接');

    let shell = null;

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        switch (data.type) {
            case 'input':
                // 向 shell 发送输入
                if (shell) {
                    shell.stdin.write(data.data);
                }
                break;

            case 'resize':
                // 调整终端大小
                if (shell) {
                    shell.stdout.rows = data.rows;
                    shell.stdout.columns = data.cols;
                    shell.stderr.rows = data.rows;
                    shell.stderr.columns = data.cols;
                }
                break;
        }
    });

    // 启动 shell 进程
    shell = spawn(process.platform === 'win32' ? 'cmd.exe' : '/bin/bash', [], {
        shell: true,
        env: process.env
    });

    // 读取 shell 输出
    shell.stdout.on('data', (data) => {
        ws.send(data.toString());
    });

    shell.stderr.on('data', (data) => {
        ws.send(data.toString());
    });

    shell.on('close', (code) => {
        ws.send(`\r\n进程退出，退出码: ${code}\r\n`);
    });

    ws.on('close', () => {
        if (shell) {
            shell.kill();
        }
    });
});

console.log('WebSocket 服务器运行在 ws://localhost:8080');
```

---

## 5. 样式定制

### 5.1 基础样式定制

```css
/* 终端容器样式 */
.xterm {
    height: 100%;
    padding: 10px;
}

/* 光标样式 */
.xterm-cursor-block {
    background-color: #fff !important;
}

/* 选中文字 */
.xterm-selection div {
    background-color: #264f78 !important;
}

/* 链接样式 */
.xterm-link {
    color: #4daafc;
    text-decoration: underline;
}

.xterm-link:hover {
    color: #dddddd;
    cursor: pointer;
}

/* 滚动条样式 */
.xterm-viewport::-webkit-scrollbar {
    width: 10px;
}

.xterm-viewport::-webkit-scrollbar-track {
    background: #1e1e1e;
}

.xterm-viewport::-webkit-scrollbar-thumb {
    background: #444;
    border-radius: 5px;
}

.xterm-viewport::-webkit-scrollbar-thumb:hover {
    background: #555;
}
```

### 5.2 自定义主题

```javascript
// 亮色主题
const lightTheme = {
    background: '#ffffff',
    foreground: '#000000',
    cursor: '#000000',
    cursorAccent: '#ffffff',
    selectionBackground: '#add6ff',
    black: '#000000',
    red: '#cd3131',
    green: '#0dbc79',
    yellow: '#949800',
    blue: '#0451a5',
    magenta: '#800080',
    cyan: '#0598bc',
    white: '#555555',
    brightBlack: '#666666',
    brightRed: '#cd3131',
    brightGreen: '#0dbc79',
    brightYellow: '#949800',
    brightBlue: '#0451a5',
    brightMagenta: '#800080',
    brightCyan: '#0598bc',
    brightWhite: '#ffffff'
};

// 暗色主题 (Dracula 风格)
const draculaTheme = {
    background: '#282a36',
    foreground: '#f8f8f2',
    cursor: '#f8f8f0',
    cursorAccent: '#282a36',
    selectionBackground: '#44475a',
    black: '#21222c',
    red: '#ff5555',
    green: '#50fa7b',
    yellow: '#f1fa8c',
    blue: '#bd93f9',
    magenta: '#ff79c6',
    cyan: '#8be9fd',
    white: '#f8f8f2',
    brightBlack: '#6272a8',
    brightRed: '#ff6e6e',
    brightGreen: '#69ff94',
    brightYellow: '#ffffa5',
    brightBlue: '#d6acff',
    brightMagenta: '#ff92df',
    brightCyan: '#a4ffff',
    brightWhite: '#ffffff'
};

const term = new Terminal({
    theme: draculaTheme
});
```

### 5.3 动态主题切换

```javascript
class ThemedTerminal {
    constructor(container) {
        this.container = container;
        this.term = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            theme: this.getTheme('dark')
        });

        this.term.open(this.container);
    }

    getTheme(mode) {
        if (mode === 'light') {
            return {
                background: '#ffffff',
                foreground: '#000000',
                cursor: '#000000'
            };
        } else {
            return {
                background: '#1e1e1e',
                foreground: '#d4d4d4',
                cursor: '#ffffff'
            };
        }
    }

    setTheme(mode) {
        const theme = this.getTheme(mode);
        this.term.options.theme = theme;
    }
}
```

---

## 6. 项目中的实际使用

### 6.1 完整的终端组件

```jsx
// 项目中的终端组件
import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { SearchAddon } from '@xterm/addon-search';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { io } from 'socket.io-client';
import { Button, Space, Select, Input, message } from 'antd';
import 'xterm/css/xterm.css';

const TerminalComponent = ({ sessionId, onDisconnect }) => {
    const containerRef = useRef(null);
    const terminalRef = useRef(null);
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        if (!containerRef.current) return;

        // 创建终端
        const term = new Terminal({
            cursorBlink: true,
            cursorStyle: 'block',
            fontSize: 14,
            fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
            theme: {
                background: '#1e1e1e',
                foreground: '#d4d4d4',
                cursor: '#ffffff',
                cursorAccent: '#000000',
                selectionBackground: '#264f78'
            },
            scrollback: 5000,
            rendererType: 'canvas'
        });

        // 创建插件
        const fitAddon = new FitAddon();
        const searchAddon = new SearchAddon();
        const webLinksAddon = new WebLinksAddon();

        // 加载插件
        term.loadAddon(fitAddon);
        term.loadAddon(searchAddon);
        term.loadAddon(webLinksAddon);

        // 挂载终端
        term.open(containerRef.current);
        fitAddon.fit();

        // 适应窗口大小
        window.addEventListener('resize', () => {
            fitAddon.fit();
        });

        // 连接到 Socket.io
        const socket = io(process.env.REACT_APP_WS_URL || 'ws://localhost:3001', {
            path: '/terminal',
            query: { sessionId },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5
        });

        socketRef.current = socket;
        terminalRef.current = term;

        // Socket 事件处理
        socket.on('connect', () => {
            setIsConnected(true);
            term.writeln('\x1b[32m✓ 已连接到终端服务器\x1b[0m');

            // 发送终端尺寸
            const { cols, rows } = term;
            socket.emit('resize', { cols, rows });
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
            term.writeln('\x1b[33m✗ 连接已断开\x1b[0m');
        });

        socket.on('data', (data) => {
            term.write(data);
        });

        socket.on('error', (error) => {
            message.error(`终端错误: ${error.message}`);
        });

        // 终端事件处理
        term.onData((data) => {
            socket.emit('data', data);
        });

        term.onResize(({ cols, rows }) => {
            socket.emit('resize', { cols, rows });
        });

        // 清理函数
        return () => {
            socket.disconnect();
            term.dispose();
        };
    }, [sessionId]);

    // 搜索功能
    const handleSearch = (direction) => {
        const addon = terminalRef.current?.kernel?.searchAddon;
        if (addon && searchText) {
            if (direction === 'next') {
                addon.findNext(searchText);
            } else {
                addon.findPrevious(searchText);
            }
        }
    };

    // 清空终端
    const handleClear = () => {
        terminalRef.current?.clear();
    };

    // 调整大小
    const handleResize = () => {
        const addon = terminalRef.current?.kernel?.fitAddon;
        addon?.fit();
    };

    return (
        <div className="terminal-component">
            <div className="terminal-toolbar">
                <Space>
                    <Button
                        onClick={handleClear}
                        disabled={!isConnected}
                    >
                        清空
                    </Button>
                    <Button
                        onClick={handleResize}
                        disabled={!isConnected}
                    >
                        适应窗口
                    </Button>
                    <Input.Search
                        placeholder="搜索..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onSearch={() => handleSearch('next')}
                        style={{ width: 200 }}
                    />
                    <Select
                        value={isConnected ? 'connected' : 'disconnected'}
                        style={{ width: 120 }}
                        options={[
                            { value: 'connected', label: '已连接' },
                            { value: 'disconnected', label: '已断开' }
                        ]}
                    />
                </Space>
            </div>
            <div
                ref={containerRef}
                className="terminal-container"
                style={{ height: 'calc(100% - 50px)' }}
            />
        </div>
    );
};

export default TerminalComponent;
```

### 6.2 多终端标签页

```jsx
// 多终端标签页组件
import React, { useState } from 'react';
import { Tabs } from 'antd';
import TerminalComponent from './TerminalComponent';

const MultiTerminal = ({ sessions }) => {
    const [activeKey, setActiveKey] = useState(sessions[0]?.id);

    const items = sessions.map(session => ({
        key: session.id,
        label: (
            <span>
                {session.name}
                <span
                    className="terminal-status"
                    style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        marginLeft: 8,
                        backgroundColor: session.status === 'active' ? '#52c41a' : '#ccc'
                    }}
                />
            </span>
        ),
        children: (
            <TerminalComponent
                sessionId={session.id}
                sessionName={session.name}
            />
        )
    }));

    return (
        <Tabs
            activeKey={activeKey}
            onChange={setActiveKey}
            items={items}
            type="editable-card"
            onEdit={(targetKey, action) => {
                if (action === 'remove') {
                    // 处理关闭标签
                    handleCloseTab(targetKey);
                }
            }}
        />
    );
};
```

---

## 7. xterm.js 源码实现深度解析

### 7.1 渲染器架构

xterm.js 支持多种渲染器，以满足不同场景的性能需求：

```
┌─────────────────────────────────────────────────────────────────┐
│                    xterm.js 渲染器架构                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   渲染器类型：                                                  │
│   ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│   │   DOM 渲染器    │ │  Canvas 渲染器  │ │  WebGL 渲染器   │ │
│   │  (默认)        │ │  (性能优化)      │ │  (高性能)       │ │
│   └────────┬────────┘ └────────┬────────┘ └────────┬────────┘ │
│            │                    │                    │          │
│            ▼                    ▼                    ▼          │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                    字符渲染层                          │  │
│   │  - 字符测量                                            │  │
│   │  - 纹理管理                                            │  │
│   │  - 位置计算                                            │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   性能对比：                                                   │
│   - DOM: 适合小规模终端 (< 80x24)                           │
│   - Canvas: 适合中等规模 (80x24 - 200x60)                   │
│   - WebGL: 适合大规模终端 (> 200x60)                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 WebGL 渲染器

WebGL 渲染器使用 GPU 加速，适合大型终端场景：

```javascript
// 安装 WebGL 插件
npm install @xterm/addon-webgl@0.19.0

// 使用 WebGL 渲染器
import { Terminal } from 'xterm';
import { WebglAddon } from '@xterm/addon-webgl';
import 'xterm/css/xterm.css';

const term = new Terminal({
  rendererType: undefined  // 让 WebglAddon 自动选择
});

// 加载 WebGL 插件
const webglAddon = new WebglAddon();
term.loadAddon(webglAddon);

term.open(document.getElementById('terminal'));

// WebGL 渲染器特性
// - 使用纹理图集 (Texture Atlas) 优化渲染
// - GPU 加速字符渲染
// - 支持大规模终端显示
```

### 7.3 渲染性能优化

```typescript
// 性能优化配置
const term = new Terminal({
  // 禁用不必要的功能
  cursorBlink: false,      // 禁用光标闪烁
  cursorStyle: 'block',    // 使用块光标

  // 限制渲染范围
  scrollback: 1000,        // 限制回滚缓冲区

  // 禁用动画
  smoothScrolling: false,  // 禁用平滑滚动

  // 大型终端优化
  largeOptimizations: true,

  // 字符渲染优化
  letterSpacing: 0,        // 字符间距
  lineHeight: 1.0          // 行高
});

// 动态调整渲染设置
function optimizeForSize(term: Terminal, cols: number, rows: number) {
  if (cols * rows > 10000) {
    // 大型终端使用 WebGL
    term.options.rendererType = 'webgl';
  } else if (cols * rows > 2000) {
    // 中等规模使用 Canvas
    term.options.rendererType = 'canvas';
  } else {
    // 小规模使用 DOM
    term.options.rendererType = 'dom';
  }
}
```

### 7.4 核心模块解析

```typescript
// xterm.js 核心模块

// 1. Terminal 类 - 主入口
class Terminal {
  // 核心属性
  cols: number;           // 列数
  rows: number;          // 行数
  options: ITerminalOptions;  // 配置选项

  // 核心方法
  open(container: HTMLElement): void;  // 挂载到 DOM
  write(data: string): void;           // 写入数据
  writeln(data: string): void;         // 写入数据并换行
  resize(cols: number, rows: number): void;  // 调整大小
  clear(): void;                         // 清空终端
  dispose(): void;                       // 销毁终端
}

// 2. Buffer - 缓冲区管理
class Buffer {
  lines: CircularBuffer<BufferLine>;  // 行缓冲区
  y: number;                          // 当前行
  yBase: number;                      // 滚动起点
  scrollTop: number;                   // 滚动顶部
  scrollBottom: number;                // 滚动底部
}

// 3. InputHandler - 输入处理
class InputHandler {
  // 处理 ANSI 转义序列
  parse(data: string): void;

  // 处理光标移动
  cursorMove(direction: Direction, steps: number): void;

  // 处理清屏
  clear(): void;
}

// 4. SelectionManager - 选择管理
class SelectionManager {
  selectionStart: [number, number] | null;
  selectionEnd: [number, number] | null;

  selectAll(): void;
  selectWordAtPosition(position: IPosition): void;
  getSelection(): string;
}
```

### 7.5 ANSI 转义序列处理

```typescript
// ANSI 转义序列处理示例

// 常见转义序列：
// \x1b[31m - 设置前景色为红色
// \x1b[32m - 设置前景色为绿色
// \x1b[0m  - 重置属性

// 自定义颜色序列处理
term.onData((data) => {
  // 解析自定义转义序列
  const customSequence = /\x1b\[(\d+)m/g;
  let match;

  while ((match = customSequence.exec(data)) !== null) {
    const code = parseInt(match[1]);
    // 处理自定义颜色码
    handleCustomColorCode(code);
  }
});

// 颜色映射
const colorMap: Record<number, string> = {
  30: '#0d0d0d',  // 黑色
  31: '#cd3131',  // 红色
  32: '#0dbc79',  // 绿色
  33: '#e5e510',  // 黄色
  34: '#2472c8',  // 蓝色
  35: '#bc3fbc',  // 品红
  36: '#11a8cd',  // 青色
  37: '#e5e5e5',  // 白色
};
```

### 7.6 性能监控

```typescript
// 使用性能监控 API
function monitorPerformance(term: Terminal) {
  // 监控渲染帧率
  let frameCount = 0;
  let lastTime = performance.now();

  function measureFPS() {
    frameCount++;
    const currentTime = performance.now();

    if (currentTime - lastTime >= 1000) {
      console.log(`FPS: ${frameCount}`);
      frameCount = 0;
      lastTime = currentTime;
    }

    requestAnimationFrame(measureFPS);
  }

  measureFPS();

  // 监控输入延迟
  term.onData(() => {
    const start = performance.now();
    // 模拟处理
    const delay = performance.now() - start;
    if (delay > 16) { // 超过一帧
      console.warn(`输入处理延迟: ${delay}ms`);
    }
  });
}
```

---

## 总结

xterm.js 是一个功能强大的浏览器端终端模拟器，通过本教程你应该能够：

1. **基础集成**：创建和配置 xterm.js 终端实例
2. **插件使用**：使用 Fit、Search、Clipboard、WebLinks 等插件
3. **WebSocket 通信**：实现与后端服务器的实时通信
4. **样式定制**：自定义终端主题和样式
5. **项目实践**：构建完整的终端组件

在 WebEnv 项目中，xterm.js 用于实现浏览器端的终端模拟功能，通过 WebSocket 与后端服务器通信，支持命令执行、文件操作等特性，为用户提供接近本地终端的使用体验。

---

## 参考资源

- [xterm.js 官方文档](https://xtermjs.org/)
- [xterm.js GitHub](https://github.com/xtermjs/xterm.js)
- [xterm-addon-fit 文档](https://www.npmjs.com/package/xterm-addon-fit)
- [xterm-addon-search 文档](https://www.npmjs.com/package/xterm-addon-search)
