# Node.js后端开发完全指南

## 目录

1. [Node.js核心概念](#1-nodejs核心概念)
2. [模块系统](#2-模块系统)
3. [事件驱动与非阻塞I/O](#3-事件驱动与非阻塞io)
4. [异步编程模式](#4-异步编程模式)
5. [常用核心模块](#5-常用核心模块)
6. [文件系统操作](#6-文件系统操作)
7. [网络编程](#7-网络编程)
8. [进程与子进程](#8-进程与子进程)
9. [性能优化](#9-性能优化)

---

## 1. Node.js核心概念

### 1.1 什么是Node.js

Node.js是一个基于Chrome V8引擎的JavaScript运行时环境，用于在服务器端运行JavaScript。它采用事件驱动、非阻塞I/O模型，适合构建高并发的网络应用。

```
Node.js核心特性：
- 基于V8引擎：高性能JavaScript执行
- 事件驱动：单线程事件循环
- 非阻塞I/O：高效的并发处理
- 跨平台：Windows、Linux、macOS
- 丰富的npm生态：百万级包
```

### 1.2 Node.js vs 传统后端

| 特性 | Node.js | PHP/Java |
|------|---------|-----------|
| **运行模型** | 单线程事件循环 | 多线程/多进程 |
| **I/O模型** | 非阻塞 | 阻塞 |
| **并发处理** | 事件驱动 | 线程池 |
| **内存使用** | 较低 | 较高 |
| **CPU密集型** | 弱点 | 优势 |
| **I/O密集型** | 优势 | 一般 |
| **学习曲线** | 简单 | 较陡 |

---

## 2. 模块系统

### 2.1 CommonJS规范

```javascript
// 1. 导出模块（module.exports）
// utils.js
function add(a, b) {
    return a + b;
}

function multiply(a, b) {
    return a * b;
}

// 导出单个对象
module.exports = {
    add,
    multiply
};

// 或者逐个导出
exports.add = add;
exports.multiply = multiply;

// 2. 导入模块（require）
// app.js
const utils = require('./utils');
const { add, multiply } = require('./utils');

console.log(add(1, 2));         // 3
console.log(multiply(3, 4));    // 12

// 3. 导入第三方模块
const fs = require('fs');
const express = require('express');

// 4. 模块缓存
// 模块第一次被require时会被加载并缓存
const module1 = require('./utils');
const module2 = require('./utils');
console.log(module1 === module2);  // true（同一引用）

// 5. 循环依赖
// Node.js会部分加载模块以解决循环依赖
```

### 2.2 ES Modules（ESM）

```javascript
// 1. 命名导出
// utils.js
export function add(a, b) {
    return a + b;
}

export const PI = 3.14159;

// 默认导出
export default class Calculator {
    add(a, b) {
        return a + b;
    }
}

// 2. 命名导入
// app.js
import { add, PI } from './utils.js';
import Calculator from './utils.js';

console.log(add(1, 2));         // 3
console.log(PI);                // 3.14159

// 3. 导入整个模块
import * as utils from './utils.js';
console.log(utils.add(1. 2));

// 4. 动态导入（支持异步）
async function loadModule() {
    const { add } = await import('./utils.js');
    console.log(add(1, 2));  // 3
}
```

### 2.3 模块查找规则

```javascript
// 模块查找顺序：
// 1. 核心模块（fs, http, path等）
require('fs');

// 2. 相对路径（./或../）
require('./utils.js');

// 3. 绝对路径
require('/home/user/project/utils.js');

// 4. node_modules查找
// a. 当前目录的node_modules
// b. 父目录的node_modules
// c. 递归向上查找，直到根目录
require('express');

// 5. 文件扩展名
// 如果指定了扩展名，直接加载
// 如果没有，按顺序尝试：.js, .json, .node
require('./utils');

// 6. 目录加载
// 如果指向目录，查找package.json的main字段
// 如果没有package.json，尝试加载了index.js
require('./my-module/');
```

---

## 3. 事件驱动与非阻塞I/O

### 3.1 事件循环详解

```javascript
// Node.js事件循环的6个阶段
/*
1. timers: 执行setTimeout和setInterval的回调
2. I/O callbacks: 执行I/O操作的回调（除了close回调）
3. idle, prepare: 内部使用
4. poll: 执行I/O相关的回调，轮询新事件
5. check: setImmediate的回调
6. close callbacks: socket.close()等close事件的回调

每个阶段执行完毕后，都会清空微任务队列
*/

// 示例：理解执行顺序
console.log('1. 脚本开始');

setTimeout(() => {
    console.log('2. setTimeout - 阶段1');
}, 0);

setImmediate(() => {
    console.log('3. setImmediate - 阶段5');
});

process.nextTick(() => {
    console.log('4. process.nextTick - 微任务');
});

Promise.resolve().then(() => {
    console.log('5. Promise.then - 微任务');
});

console.log('6. 脚本结束');

// 输出顺序：
// 1. 脚本开始
// 6. 脚本结束
// 4. process.nextTick - 微任务
// 5. Promise.then - 微任务
// 2. setTimeout - 阶段1
// 3. setImmediate - 阶段5
```

### 3.2 非阻塞I/O示例

```javascript
const fs = require('fs');

// 1. 同步读取（阻塞）
console.log('开始读取文件（同步）');
try {
    const data = fs.readFileSync('large-file.txt', 'utfutf8');
    console.log('文件读取完毕');
} catch (error) {
    console.error('读取失败', error);
}

// 2. 异步读取（非阻塞）
console.log('开始读取文件（异步）');
fs.readFile('large-file.txt', 'utf8', (error, data) => {
    if (error) {
        console.error('读取失败', error);
        return;
    }
    console.log('文件读取完毕');
});
console.log('其他操作可以继续执行');

// 3. Promise封装异步操作
function readFileAsync(filename) {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, 'utf8', (error, data) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(data);
        });
    });
}

// 使用async/await
async function main() {
    try {
        const data = await readFileAsync('file.txt');
        console.log('文件内容：', data);
    } catch (error) {
        console.error('读取失败', error);
    }
}
```

---

## 4. 异步编程模式

### 4.1 回调模式

```javascript
const fs = require('fs');

// 1. 基本回调
fs.readFile('file.txt', 'utf8', (error, data) => {
    if (error) {
        console.error('读取失败', error);
        return;
    }
    console.log('文件内容：', data);
});

// 2. 回调地狱问题（多层嵌套）
fs.readFile('config1.json', 'utf8', (error1, data1) => {
    if (error1) {
        console.error(error1);
        return;
    }
    fs.readFile('config2.json', 'utf8', (error2, data2) => {
        if (error2) {
            console.error(error2);
            return;
        }
        fs.readFile('config3.json', 'utf8', (error3, data3) => {
            if (error3) {
                console.error(error3);
                return;
            }
            console.log('所有配置加载完成', data1, data2, data3);
        });
    });
});
```

### 4.2 Promise模式

```javascript
const fs = require('fs').promises; // Node.js 10+提供Promise API

// 1. 基础Promise
function readFileAsync(filename) {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, 'utf8', (error, data) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(data);
        });
    });
}

// 2. Promise链
readFileAsync('file.txt')
    .then(data => {
        console.log('文件内容：', data);
        return data.trim().split('\n');
    })
    .then(lines => {
        console.log('行数：', lines.length);
        return lines;
    })
    .catch(error => {
        console.error('错误：', error);
    });

// 3. Promise.all并行执行
Promise.all([
    readFileAsync('file1.txt'),
    readFileAsync('file2.txt'),
    readFileAsync('file3.txt')
])
    .then(([data1, data2, data3]) => {
        console.log('所有文件读取完成');
        console.log(data1, data2, data3);
    })
    .catch(error => {
        console.error('至少一个文件读取失败', error);
    });

// 4. Promise.allSettled不管成功失败都返回
Promise.allSettled([
    readFileAsync('existing.txt'),
    readFileAsync('non-existing.txt')
])
    .then(results => {
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                console.log(`文件${index + 1}成功`, result.value);
            } else {
                console.log(`文件${index + 1}失败`, result.reason);
            }
        });
    });

// 5. Promise.race哪个先完成就返回哪个
Promise.race([
    readFileAsync('file1.txt'),
    readFileAsync('file2.txt')
])
    .then(data => {
        console.log('最快的文件内容：', data);
    });
```

### 4.3 async/await模式

```javascript
const fs = require('fs').promises;

// 1. 基础使用
async function readFile(filename) {
    try {
        const data = await fs.readFile(filename, 'utf8');
        console.log('文件内容：', data);
        return data;
    } catch (error) {
        console.error('读取失败', error);
        throw error;
    }
}

// 2. 并行执行多个异步操作
async function readMultipleFiles() {
    try {
        const [data1, data2, data3] = await Promise.all([
            fs.readFile('file1.txt', 'utf8'),
            fs.readFile('file2.txt', 'utf8'),
            fs.readFile('file3.txt', 'utf8')
        ]);

        console.log('所有文件读取完成');
        return { data1, data2, data3 };
    } catch (error) {
        console.error('至少一个文件读取失败', error);
        throw error;
    }
}

// 3. 顺序执行
async function readFilesSequentially() {
    try {
        const file1 = await fs.readFile('file1.txt', 'utf8');
        console.log('file1读取完成');

        const file2 = await fs.readFile('file2.txt', 'utf8');
        console.log('file2读取完成');

        const file3 = await fs.readFile('file3.txt', 'utf8');
        console.log('file3读取完成');

        return { file1, file2, file3 };
    } catch (error) {
        console.error('读取失败', error);
        throw error;
    }
}

// 4. 带超时的异步操作
function withTimeout(promise, timeout) {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => reject(new Error('超时')), timeout);
        })
    ]);
}

async function readFileWithTimeout(filename) {
    try {
        const data = await withTimeout(
            fs.readFile(filename, 'utf8'),
            5000 // 5秒超时
        );
        console.log('文件读取成功');
        return data;
    } catch (error) {
        if (error.message === '超时') {
            console.error('读取超时');
            return null;
        }
        throw error;
    }
}

// 5. 重试机制
async function retry(fn, maxAttempts = 3, delay = 1000) {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxAttempts - 1) {
                console.error(`尝试${maxAttempts}次后失败`);
                throw error;
            }
            console.log(`第${i + 1}次尝试失败，${delay}ms后重试`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

async function readFileWithRetry(filename) {
    return retry(() => fs.readFile(filename, 'utf8'));
}
```

---

## 5. 常用核心模块

### 5.1 path模块（路径处理）

```javascript
const path = require('path');

// 1. 路径拼接
const fullPath = path.join('/home/user', 'projects', 'myproject');
console.log(fullPath);  // /home/user/projects/myproject

// 2. 路径解析
console.log(path.dirname('/home/user/file.txt'));  // /home/user
console.log(path.basename('/home/user/file.txt'));  // file.txt
console.log(path.extname('/home/user/file.txt'));  // .txt
console.log(path.basename('/home/user/file.txt', '.txt'));  // file

// 3. 路径规范化
console.log(path.normalize('/home/user/../user/./file.txt'));
// /home/user/file.txt

// 4. 绝对路径
console.log(path.resolve('/home/user', 'project'));
// /home/user/project

console.log(path.resolve('./project'));
// /current/working/directory/project

// 5. 平台特定
console.log(path.sep);     // 路径分隔符（/ 或 \）
console.log(path.delimiter); // 环境变量分隔符（: 或 ;）

// 6. 跨平台路径
const configPath = path.join(process.env.HOME, '.config', 'app.json');
console.log(configPath);
// Windows: C:\Users\Username\.config\app.json
// Linux/Mac: /home/username/.config/app.json
```

### 5.2 url模块（URL解析）

```javascript
const url = require('url');

// 1. 解析URL
const parsed = url.parse('https://example.com:8080/path?query=value#hash');
console.log(parsed.protocol);   // https:
console.log(parsed.host);       // example.com:8080
console.log(parsed.hostname);   // example.com
console.log(parsed.port);       // 8080
console.log(parsed.pathname);   // /path
console.log(parsed.query);      // query=value
console.log(parsed.hash);       // #hash

// 2. 格式化URL
const formatted = url.format({
    protocol: 'https:',
    hostname: 'example.com',
    pathname: '/path',
    query: 'query=value',
    hash: 'hash'
});
console.log(formatted);
// https://example.com/path?query=value#hash

// 3. 查询字符串处理
const querystring = require('querystring');
const params = querystring.parse('name=张三&age=25&city=北京');
console.log(params);
// { name: '张三', age: '25', city: '北京' }

// 参数编码
const encoded = querystring.stringify({ name: '张三', age: 25 });
console.log(encoded);
// name=%E5%BC%A0%E4%B8%89&age=25
```

### 5.3 crypto模块（加密）

```javascript
const crypto = require('crypto');

// 1. MD5哈希
function md5Hash(text) {
    return crypto.createHash('md5').update(text).digest('hex');
}

console.log(md5Hash('hello'));
// 5d41402abc4b2a76b9719d911017c592

// 2. SHA256哈希
function sha256Hash(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
}

console.log(sha256Hash('hello'));
// 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e7304339298064b6cd2...

// 3. 密码哈希（bcrypt推荐用于密码）
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHmac('sha256', salt).update(password).digest('hex');
    return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
    const [salt, hash] = storedHash.split(':');
    const verifyHash = crypto.createHmac('sha256', salt).update(password).digest('hex');
    return hash === verifyHash;
}

const passwordHash = hashPassword('mypassword');
console.log(verifyPassword('mypassword', passwordHash));  // true
console.log(verifyPassword('wrongpassword', passwordHash)); // false

// 4. 随机字符串
function generateRandomString(length = 32) {
    return crypto.randomBytes(length / 2).toString('hex');
}

console.log(generateRandomString(16));
// a1b2c3d4e5f6g7h8

// 5. UUID生成
function generateUUID() {
    return crypto.randomUUID();
}

console.log(generateUUID());
// 1b9d6bcd-bbfd-4b2d-9b5d-ab8d8c8a9e1e
```

### 5.4 util模块（工具函数）

```javascript
const util = require('util');

// 1. 格式化输出
const name = '张三';
const age = 25;
console.log(util.format('姓名：%s，年龄：%d', name, age));
// 姓名：张三，年龄：25

// 2. 继承（推荐使用class语法）
function Parent() {
    this.name = '父类';
}

function Child() {
    Parent.call(this);
    this.age = 18;
}

util.inherits(Child, Parent);

// 3. 类型检查
console.log(util.isArray([]));            // true
console.log(util.isDate(new Date()));    // true
console.log(util.isRegExp(/test/));      // true
console.log(util.isError(new Error()));   // true
console.log(util.isObject({}));          // true
console.log(util.isPrimitive('test'));    // true

// 4. 深度检查
const obj = { a: 1, b: { c: 2 } };
console.log(util.isDeepStrictEqual(obj, { a: 1, b: { c: 2 } }));  // true

// 5. 调试输出
function debugLog(...args) {
    console.log(util.inspect(args[0], { colors: true, depth: null }));
}

debugLog({ name: '张三', age: 25, hobbies: ['code', 'read'] });
```

---

## 6. 文件系统操作

### 6.1 文件读取与写入

```javascript
const fs = require('fs');
const path = require('path');

// 1. 同步读取
try {
    const data = fs.readFileSync('file.txt', 'utf8');
    console.log('文件内容：', data);
} catch (error) {
    console.error('读取失败：', error);
}

// 2. 异步读取（回调）
fs.readFile('file.txt', 'utf8', (error, data) => {
    if (error) {
        console.error('读取失败：', error);
        return;
    }
    console.log('文件内容：', data);
});

// 3. Promise API（推荐）
async function readFileWithPromise(filename) {
    try {
        const data = await fs.promises.readFile(filename, 'utf8');
        return data;
    } catch (error) {
        console.error('读取失败：', error);
        throw error;
    }
}

// 4. 读取二进制文件
async function readBinaryFile(filename) {
    const buffer = await fs.promises.readFile(filename);
    console.log('文件大小：', buffer.length, '字节');
    return buffer;
}

// 5. 写入文件
fs.writeFile('output.txt', 'Hello, World!', 'utf8', (error) => {
    if (error) {
        console.error('写入失败：', error);
        return;
    }
    console.log('写入成功');
});

// 6. 追加内容
fs.appendFile('log.txt', '新的日志内容\n', 'utf8', (error) => {
    if (error) {
        console.error('追加失败：', error);
        return;
    }
    console.log('追加成功');
});

// 7. 复制文件
async function copyFile(source, destination) {
    const data = await fs.promises.readFile(source);
    await fs.promises.writeFile(destination, data);
    console.log('复制成功');
}

// 8. 读取大文件（流式读取）
const readStream = fs.createReadStream('large-file.txt', {
    encoding: 'utf8',
    highWaterMark: 64 * 1024 // 64KB缓冲区
});

readStream.on('data', (chunk) => {
    console.log('读取到一块数据：', chunk.length, '字节');
});

readStream.on('end', () => {
    console.log('文件读取完毕');
});

readStream.on('error', (error) => {
    console.error('读取错误：', error);
});
```

### 6.2 目录操作

```javascript
const fs = require('fs');
const path = require('path');

// 1. 创建目录
fs.mkdir('./new-folder', { recursive: true }, (error) => {
    if (error) {
        console.error('创建目录失败：', error);
        return;
    }
    console.log('目录创建成功');
});

// 2. 检查目录是否存在
fs.existsSync('./folder');  // boolean

// 3. 读取目录内容
fs.readdir('./folder', (error, files) => {
    if (error) {
        console.error('读取目录失败：', error);
        return;
    }
    console.log('目录内容：', files);
});

// 4. 读取目录详细信息（async/await）
async function readDirectory(dirPath) {
    const files = await fs.promises.readdir(dirPath);

    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.promises.stat(filePath);

        if (stats.isDirectory()) {
            console.log(`[目录] ${file}`);
        } else if (stats.isFile()) {
            console.log(`[文件] ${file} (${stats.size} 字节)`);
        }
    }
}

// 5. 删除目录（递归）
fs.rm('./folder', { recursive: true, force: true }, (error) => {
    if (error) {
        console.error('删除失败：', error);
        return;
    }
    console.log('删除成功');
});

// 6. 重命名文件/目录
fs.rename('old-name.txt', 'new-name.txt', (error) => {
    if (error) {
        console.error('重命名失败：', error);
        return;
    }
    console.log('重命名成功');
});

// 7. 监听文件变化
const watcher = fs.watch('./folder', (eventType, filename) => {
    console.log(`事件：${eventType}，文件：${filename}`);
});

// 停止监听
setTimeout(() => {
    watcher.close();
}, 60000);
```

---

## 7. 网络编程

### 7.1 HTTP服务器

```javascript
const http = require('http');

// 1. 创建HTTP服务器
const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

    // 路由处理
    if (req.url === '/' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Hello, World!');
    } else if (req.url === '/api/users' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ users: [] }));
    } else if (req.url === '/api/users' && req.method === 'POST') {
        let body = '';

        req.on('data', (chunk) => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                console.log('接收到数据：', data);

                res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ message: '创建成功', user: data }));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ error: '无效的JSON' }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
    }
});

// 2. 监听端口
server.listen(3000, () => {
    console.log('服务器运行在 http://localhost:3000');
});

// 3. 静态文件服务器
const fs = require('fs');
const path = require('path');

const staticServer = http.createServer((req, res) => {
    // 移除查询参数
    const url = req.url.split('?')[0];
    // 构建文件路径
    const filePath = path.join(__dirname, 'public', url === '/' ? 'index.html' : url);

    // 读取文件
    fs.readFile(filePath, (error, data) => {
        if (error) {
            res.writeHead(404);
            res.end('404 Not Found');
            return;
        }

        // 根据文件扩展名设置Content-Type
        const ext = path.extname(filePath);
        const contentType = {
            '.html': 'text/html; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.js': 'application/javascript; charset=utf-8',
            '.json': 'application/json; charset=utf-8',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.svg': 'image/svg+xml'
        }[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

staticServer.listen(8080, () => {
    console.log('静态服务器运行在 http://localhost:8080');
});
```

### 7.2 HTTP客户端

```javascript
const http = require('http');
const https = require('https');

// 1. GET请求
function get(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;

        const req = client.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });
    });
}

// 使用
get('http://example.com/api/users')
    .then(response => {
        console.log('状态码：', response.statusCode);
        console.log('响应体：', response.body);
    })
    .catch(error => {
        console.error('请求失败：', error);
    });

// 2. POST请求
function post(url, data) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const jsonData = JSON.stringify(data);

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Length': Buffer.byteLength(jsonData)
            }
        };

        const req = client.request(url, options, (res) => {
            let body = '';

            res.on('data', (chunk) => {
                body += chunk;
            });

            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: body
                });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(jsonData);
        req.end();
    });
}

// 使用
post('http://example.com/api/users', { name: '张三', email: 'zhangsan@example.com' })
    .then(response => {
        console.log('状态码：', response.statusCode);
        console.log('响应体：', response.body);
    })
    .catch(error => {
        console.error('请求失败：', error);
    });
```

---

## 8. 进程与子进程

### 8.1 子进程操作

```javascript
const { spawn, exec, execFileSync } = require('child_process');

// 1. spawn - 启动子进程
function runCommand(command, args) {
    return new Promise((resolve, reject) => {
        const childProcess = spawn(command, args);

        let stdout = '';
        let stderr = '';

        childProcess.stdout.on('data', (data) => {
            stdout += data.toString();
            console.log('输出：', data.toString());
        });

        childProcess.stderr.on('data', (data) => {
            stderr += data.toString();
            console.error('错误：', data.toString());
        });

        childProcess.on('close', (code) => {
            if (code === 0) {
                resolve({ stdout, stderr, code });
            } else {
                reject(new Error(`进程退出，代码：${code}`));
            }
        });

        childProcess.on('error', (error) => {
            reject(error);
        });
    });
}

// 使用
runCommand('ls', ['-la', '/home'])
    .then(result => {
        console.log('命令执行成功');
    })
    .catch(error => {
        console.error('命令执行失败：', error);
    });

// 2. exec - 执行命令并回调
exec('ls -la /home', (error, stdout, stderr) => {
    if (error) {
        console.error('执行失败：', error);
        return;
    }
    console.log('输出：', stdout);
});

// 3. execFileSync - 同步执行
try {
    const output = execFileSync('ls -la /home');
    console.log('输出：', output.stdout.toString());
} catch (error) {
    console.error('执行失败：', error);
}

// 4. Node.js子进程通信
const { fork } = require('child_process');

// 启动子进程
const child = fork('./worker.js');

// 发送消息到子进程
child.send({ type: 'start', data: [1, 2, 3, 4, 5] });

// 接收子进程消息
child.on('message', (message) => {
    console.log('收到子进程消息：', message);
});

child.on('exit', (code) => {
    console.log('子进程退出，代码：', code);
});

// worker.js
process.on('message', (message) => {
    if (message.type === 'start') {
        const result = message.data.reduce((a, b) => a + b, 0);
        process.send({ type: 'result', data: result });
    }
});
```

### 8.2 进程管理

```javascript
const process = require('process');

// 1. 进程信息
console.log('进程ID：', process.pid);
console.log('Node版本：', process.version);
console.log('平台：', process.platform);
console.log('架构：', process.arch);
console.log('当前目录：', process.cwd());

// 2. 环境变量
console.log('环境变量PATH：', process.env.PATH);
console.log('环境变量NODE_ENV：', process.env.NODE_ENV);

// 3. 内存使用
setInterval(() => {
    const memoryUsage = process.memoryUsage();
    console.log('内存使用情况：', {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,  // 常驻内存
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
    });
}, 5000);

// 4. CPU使用
const startTime = process.hrtime();

setTimeout(() => {
    const elapsedTime = process.hrtime(startTime);
    const seconds = elapsedTime[0] + elapsedTime[1] / 1e9;
    console.log('CPU时间：', seconds, '秒');
}, 1000);

// 5. 信号处理
process.on('SIGINT', () => {
    console.log('收到SIGINT信号，清理资源...');
    // 清理资源...
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('收到SIGTERM信号，清理资源...');
    // 清理资源...
    process.exit(0);
});

// 6. 退出处理
process.on('exit', (code) => {
    console.log(`进程退出，代码：${code}`);
});

process.on('uncaughtException', (error) => {
    console.error('未捕获的异常：', error);
    process.exit(1);
});

// 7. 设置退出码
process.exitCode = 1;
```

---

## 9. 性能优化

### 9.1 性能分析工具

```javascript
const { performance, PerformanceObserver } = require('perf_hooks');

// 1. 性能观察器
const obs = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach(entry => {
        console.log('性能条目：', {
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime
        });
    });
});

obs.observe({ entryTypes: ['measure'] });

// 2. 性能测量标记
performance.mark('startA');

// 执行一些操作
for (let i = 0; i < 1000000; i++) {
    Math.sqrt(i);
}

performance.mark('endA');
performance.measure('A', 'startA', 'endA');

// 3. CPU分析
// 启动Node.js时添加--prof参数
// node --prof script.js

// 输出：CPU profile

// 4. 内存分析
// 启动Node.js时添加--inspect参数
// node --inspect script.js

// 然后使用Chrome DevTools连接
```

### 9.2 性能优化技巧

```javascript
// 1. 避免同步阻塞操作
// ❌ 错误：同步文件操作阻塞事件循环
const data = fs.readFileSync('large-file.txt');

// ✅ 正确：使用异步操作
fs.readFile('large-file.txt', (error, data) => {
    if (error) {
        console.error('读取失败：', error);
        return;
    }
    // 处理数据
});

// 2. 使用流处理大数据
// ✅ 流式处理，避免内存溢出
const readStream = fs.createReadStream('large-file.txt');
const writeStream = fs.createWriteStream('output-file.txt');

readStream.pipe(writeStream);

// 3. 缓存计算结果
const cache = new Map();

function expensiveCalculation(n) {
    if (cache.has(n)) {
        console.log('从缓存获取');
        return cache.get(n);
    }

    console.log('执行计算');
    const result = n * n;  // 模拟耗时操作
    cache.set(n, result);
    return result;
}

// 4. 使用worker_threads处理CPU密集任务
const { Worker } = require('worker_threads');

function runInWorker(filename) {
    return new Promise((resolve, reject) => {
        const worker = new Worker('./worker-task.js', {
            workerData: filename
        });

        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`Worker退出，代码：${code}`));
            }
        });
    });
}

// 使用
runInWorker('large-data.json')
    .then(result => {
        console.log('处理结果：', result);
    })
    .catch(error => {
        console.error('处理失败：', error);
    });

// 5. 限制并发数
const { default: pLimit } = require('p-limit');

const limit = pLimit(5); // 同时最多5个异步操作

async function processUrls(urls) {
    const results = await Promise.all(
        urls.map(url => limit(() => fetch(url)))
    );
    return results;
}

// 6. 使用对象池减少GC
class ObjectPool {
    constructor(createFn, initialSize = 10) {
        this.pool = [];
        this.createFn = createFn;

        // 预创建对象
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(createFn());
        }
    }

    get() {
        return this.pool.length > 0
            ? this.pool.pop()
            : this.createFn();
    }

    release(obj) {
        // 重置对象状态
        for (let key in obj) {
            delete obj[key];
        }
        this.pool.push(obj);
    }
}

const pool = new ObjectPool(() => ({ data: null }));

function processData(data) {
    const obj = pool.get();
    obj.data = data;

    // 处理数据...

    // 归还对象
    pool.release(obj);
}

// 7. 使用更高效的数据结构
// ❌ 错误：数组查找O(n)
const array = [1, 2, 3, 4, 5];
const found = array.includes(3);  // O(n)

// ✅ 正确：使用Set查找O(1)
const set = new Set([1, 2, 3, 4, 5]);
const found2 = set.has(3);  // O(1)
```

---

## 参考资源

- [Node.js官方文档](https://nodejs.org/docs/)
- [Node.js最佳实践](https://github.com/goldbergyoni/best-practices/blob/master/README.md)
- [Node.js设计模式](https://nodejspatterns.com/)

---

*本文档持续更新，最后更新于2026年3月*
