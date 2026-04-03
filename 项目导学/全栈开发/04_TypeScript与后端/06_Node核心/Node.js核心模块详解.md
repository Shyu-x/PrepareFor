# Node.js 核心模块详解

## 一、模块系统

### 1.1 CommonJS 模块

```javascript
// 导出模块
// utils.js

// 方式1：导出对象
module.exports = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
};

// 方式2：单独导出
exports.multiply = (a, b) => a * b;
exports.divide = (a, b) => a / b;

// 方式3：导出函数
module.exports = function(name) {
  return `Hello, ${name}!`;
};

// 方式4：导出类
class Calculator {
  add(a, b) { return a + b; }
  subtract(a, b) { return a - b; }
}
module.exports = Calculator;

// 导入模块
// app.js

// 导入核心模块
const fs = require('fs');
const path = require('path');
const http = require('http');

// 导入自定义模块
const utils = require('./utils');
const Calculator = require('./calculator');

// 导入 node_modules 中的模块
const express = require('express');
const lodash = require('lodash');

// 使用模块
console.log(utils.add(1, 2)); // 3

const calc = new Calculator();
console.log(calc.add(5, 3)); // 8
```

### 1.2 ES Modules

```javascript
// 导出模块
// utils.mjs

// 命名导出
export const add = (a, b) => a + b;
export const subtract = (a, b) => a - b;

// 默认导出
export default class Calculator {
  add(a, b) { return a + b; }
  subtract(a, b) { return a - b; }
}

// 导入模块
// app.mjs

// 命名导入
import { add, subtract } from './utils.mjs';

// 默认导入
import Calculator from './utils.mjs';

// 混合导入
import Calculator, { add, subtract } from './utils.mjs';

// 全部导入
import * as utils from './utils.mjs';
console.log(utils.add(1, 2));

// 动态导入
async function loadModule() {
  const { default: Calculator } = await import('./utils.mjs');
  const calc = new Calculator();
  return calc.add(1, 2);
}
```

### 1.3 模块缓存机制

```javascript
// Node.js 模块缓存机制
// 每个模块只加载一次，后续 require 返回缓存

// counter.js
let count = 0;

module.exports = {
  increment: () => ++count,
  getCount: () => count,
};

// app.js
const counter1 = require('./counter');
const counter2 = require('./counter');

console.log(counter1.increment()); // 1
console.log(counter2.increment()); // 2（共享同一个实例）
console.log(counter1.getCount());  // 2

// 清除缓存（不推荐）
delete require.cache[require.resolve('./counter')];
const counter3 = require('./counter');
console.log(counter3.getCount()); // 0（新实例）
```

---

## 二、fs 文件系统模块

### 2.1 同步与异步操作

```javascript
const fs = require('fs');
const path = require('path');

// 异步读取（回调风格）
fs.readFile('data.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('读取失败:', err);
    return;
  }
  console.log('文件内容:', data);
});

// 同步读取（阻塞）
try {
  const data = fs.readFileSync('data.txt', 'utf8');
  console.log('文件内容:', data);
} catch (err) {
  console.error('读取失败:', err);
}

// Promise 风格（推荐）
const fsPromises = require('fs/promises');

async function readFile() {
  try {
    const data = await fsPromises.readFile('data.txt', 'utf8');
    console.log('文件内容:', data);
  } catch (err) {
    console.error('读取失败:', err);
  }
}

// 写入文件
// 异步
fs.writeFile('output.txt', 'Hello World', 'utf8', (err) => {
  if (err) throw err;
  console.log('写入成功');
});

// Promise
await fsPromises.writeFile('output.txt', 'Hello World', 'utf8');

// 追加内容
await fsPromises.appendFile('output.txt', '\n新的一行', 'utf8');

// 删除文件
await fsPromises.unlink('output.txt');

// 复制文件
await fsPromises.copyFile('source.txt', 'destination.txt');

// 移动/重命名文件
await fsPromises.rename('old.txt', 'new.txt');
```

### 2.2 目录操作

```javascript
const fs = require('fs/promises');
const path = require('path');

// 创建目录
await fs.mkdir('mydir');
await fs.mkdir('mydir/subdir', { recursive: true }); // 递归创建

// 读取目录
const files = await fs.readdir('mydir');
console.log(files); // ['file1.txt', 'file2.txt', 'subdir']

// 读取目录详情
const filesWithDetails = await fs.readdir('mydir', { withFileTypes: true });
filesWithDetails.forEach(file => {
  console.log(file.name, file.isDirectory() ? '[目录]' : '[文件]');
});

// 删除空目录
await fs.rmdir('emptydir');

// 递归删除目录
await fs.rm('mydir', { recursive: true, force: true });

// 检查路径是否存在
try {
  await fs.access('myfile.txt', fs.constants.F_OK);
  console.log('文件存在');
} catch {
  console.log('文件不存在');
}

// 检查读写权限
try {
  await fs.access('myfile.txt', fs.constants.R_OK | fs.constants.W_OK);
  console.log('可读可写');
} catch {
  console.log('权限不足');
}

// 获取文件信息
const stats = await fs.stat('myfile.txt');
console.log({
  isFile: stats.isFile(),
  isDirectory: stats.isDirectory(),
  size: stats.size,
  created: stats.birthtime,
  modified: stats.mtime,
});
```

### 2.3 文件流操作

```javascript
const fs = require('fs');
const path = require('path');

// 创建读取流
const readStream = fs.createReadStream('large-file.txt', {
  encoding: 'utf8',
  highWaterMark: 64 * 1024, // 64KB 缓冲区
});

readStream.on('data', (chunk) => {
  console.log('收到数据块:', chunk.length, '字节');
});

readStream.on('end', () => {
  console.log('读取完成');
});

readStream.on('error', (err) => {
  console.error('读取错误:', err);
});

// 创建写入流
const writeStream = fs.createWriteStream('output.txt', {
  encoding: 'utf8',
});

writeStream.write('第一行\n');
writeStream.write('第二行\n');
writeStream.end('最后一行');

writeStream.on('finish', () => {
  console.log('写入完成');
});

// 管道操作：读取 -> 处理 -> 写入
const { Transform } = require('stream');

const upperCase = new Transform({
  transform(chunk, encoding, callback) {
    callback(null, chunk.toString().toUpperCase());
  },
});

fs.createReadStream('input.txt')
  .pipe(upperCase)
  .pipe(fs.createWriteStream('output.txt'));

// 复制大文件
function copyFile(src, dest) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(src)
      .pipe(fs.createWriteStream(dest))
      .on('finish', resolve)
      .on('error', reject);
  });
}
```

### 2.4 文件监控

```javascript
const fs = require('fs');

// 监控文件变化
const watcher = fs.watch('myfile.txt', (eventType, filename) => {
  console.log(`事件类型: ${eventType}`);
  console.log(`文件名: ${filename}`);
});

// 关闭监控
watcher.close();

// 使用 fs.watchFile 轮询监控
fs.watchFile('myfile.txt', (curr, prev) => {
  console.log('当前修改时间:', curr.mtime);
  console.log('上次修改时间:', prev.mtime);
});

// 停止监控
fs.unwatchFile('myfile.txt');
```

---

## 三、path 路径模块

### 3.1 路径处理

```javascript
const path = require('path');

// 路径拼接
path.join('/foo', 'bar', 'baz/asdf', 'quux', '..');
// 返回: '/foo/bar/baz/asdf'

path.join('foo', {}, 'bar');
// 抛出 TypeError: Path must be a string

// 获取绝对路径
path.resolve('foo/bar', '/tmp/file/', '..', 'a/../subfile');
// 返回: '/tmp/subfile'

// 相对于当前工作目录
path.resolve('wwwroot', 'static_files/png/', '../gif/image.gif');
// 如果当前目录是 /home/user:
// 返回: '/home/user/wwwroot/static_files/gif/image.gif'

// 获取相对路径
path.relative('/data/orandea/test/aaa', '/data/orandea/impl/bbb');
// 返回: '../../impl/bbb'

// 获取目录名
path.dirname('/foo/bar/baz/asdf/quux');
// 返回: '/foo/bar/baz/asdf'

// 获取文件名
path.basename('/foo/bar/baz/asdf/quux.html');
// 返回: 'quux.html'

path.basename('/foo/bar/baz/asdf/quux.html', '.html');
// 返回: 'quux'

// 获取扩展名
path.extname('index.html');
// 返回: '.html'

path.extname('index.coffee.md');
// 返回: '.md'

path.extname('index.');
// 返回: '.'

path.extname('index');
// 返回: ''

// 解析路径
path.parse('/home/user/dir/file.txt');
// 返回:
// {
//   root: '/',
//   dir: '/home/user/dir',
//   base: 'file.txt',
//   ext: '.txt',
//   name: 'file'
// }

// 格式化路径对象
path.format({
  root: '/ignored',
  dir: '/home/user/dir',
  base: 'file.txt',
});
// 返回: '/home/user/dir/file.txt'
```

### 3.2 跨平台路径处理

```javascript
const path = require('path');

// 获取路径分隔符
console.log(path.sep); // Windows: '\\', POSIX: '/'

// 获取路径定界符（用于 PATH 环境变量）
console.log(path.delimiter); // Windows: ';', POSIX: ':'

// 跨平台路径拼接
const filePath = path.join('folder', 'subfolder', 'file.txt');
// Windows: 'folder\\subfolder\\file.txt'
// POSIX: 'folder/subfolder/file.txt'

// 规范化路径
path.normalize('/foo/bar//baz/asdf/quux/..');
// 返回: '/foo/bar/baz/asdf'

// 判断是否为绝对路径
path.isAbsolute('/foo/bar'); // true
path.isAbsolute('foo/bar');  // false
path.isAbsolute('C:/foo');   // Windows: true

// 跨平台路径处理示例
function getProjectPath(...segments) {
  return path.resolve(__dirname, '..', ...segments);
}

const configPath = getProjectPath('config', 'database.json');
const publicPath = getProjectPath('public');
```

---

## 四、http 模块

### 4.1 创建 HTTP 服务器

```javascript
const http = require('http');

// 创建服务器
const server = http.createServer((req, res) => {
  // 请求信息
  console.log('请求方法:', req.method);
  console.log('请求路径:', req.url);
  console.log('请求头:', req.headers);
  
  // 设置响应头
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Custom-Header': 'value',
  });
  
  // 发送响应
  res.end(JSON.stringify({
    message: 'Hello World',
    timestamp: new Date().toISOString(),
  }));
});

// 监听端口
server.listen(3000, () => {
  console.log('服务器运行在 http://localhost:3000');
});

// 错误处理
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('端口已被占用');
  } else {
    console.error('服务器错误:', err);
  }
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});
```

### 4.2 处理请求

```javascript
const http = require('http');
const url = require('url');
const querystring = require('querystring');

const server = http.createServer(async (req, res) => {
  // 解析 URL
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;
  
  // 解析请求体
  const body = await parseBody(req);
  
  // 路由处理
  if (pathname === '/api/users' && req.method === 'GET') {
    // 获取用户列表
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ users: [] }));
  } else if (pathname === '/api/users' && req.method === 'POST') {
    // 创建用户
    const user = JSON.parse(body);
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ id: 1, ...user }));
  } else if (pathname.match(/^\/api\/users\/\d+$/) && req.method === 'GET') {
    // 获取单个用户
    const id = pathname.split('/')[3];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ id, name: 'User ' + id }));
  } else {
    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

// 解析请求体
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      resolve(body);
    });
    
    req.on('error', reject);
  });
}

server.listen(3000);
```

### 4.3 发送 HTTP 请求

```javascript
const http = require('http');
const https = require('https');

// GET 请求
http.get('http://example.com/api/data', (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('响应数据:', data);
  });
}).on('error', (err) => {
  console.error('请求错误:', err);
});

// POST 请求
function postRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body,
        });
      });
    });
    
    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

// 使用
const result = await postRequest('http://example.com/api/users', {
  name: '张三',
  email: 'zhangsan@example.com',
});
```

---

## 五、events 事件模块

### 5.1 EventEmitter

```javascript
const EventEmitter = require('events');

// 创建事件发射器
class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter();

// 监听事件
myEmitter.on('event', (data) => {
  console.log('收到事件:', data);
});

// 只监听一次
myEmitter.once('once', () => {
  console.log('只执行一次');
});

// 发射事件
myEmitter.emit('event', { message: 'Hello' });
myEmitter.emit('once');
myEmitter.emit('once'); // 不会再次触发

// 获取监听器数量
console.log(myEmitter.listenerCount('event')); // 1

// 获取所有监听器
console.log(myEmitter.listeners('event'));

// 移除监听器
const callback = () => console.log('回调');
myEmitter.on('test', callback);
myEmitter.off('test', callback); // 或 removeListener

// 移除所有监听器
myEmitter.removeAllListeners('event');
```

### 5.2 错误处理

```javascript
const EventEmitter = require('events');

const emitter = new EventEmitter();

// 错误事件必须处理，否则会抛出异常
emitter.on('error', (err) => {
  console.error('捕获错误:', err);
});

// 发射错误事件
emitter.emit('error', new Error('出错了'));

// 使用 try-catch 捕获监听器中的错误
emitter.on('data', () => {
  throw new Error('监听器错误');
});

emitter.on('error', (err) => {
  console.error('错误:', err.message);
});

// 或者使用 domain（已废弃，建议使用 async_hooks）
```

### 5.3 实际应用

```javascript
// 任务队列
class TaskQueue extends EventEmitter {
  constructor(concurrency = 2) {
    super();
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }
  
  add(task) {
    this.queue.push(task);
    this.run();
  }
  
  async run() {
    while (this.running < this.concurrency && this.queue.length > 0) {
      this.running++;
      const task = this.queue.shift();
      
      try {
        const result = await task();
        this.emit('completed', result);
      } catch (error) {
        this.emit('error', error);
      } finally {
        this.running--;
        this.run();
      }
    }
    
    if (this.running === 0 && this.queue.length === 0) {
      this.emit('drain');
    }
  }
}

// 使用
const queue = new TaskQueue(2);

queue.on('completed', (result) => {
  console.log('任务完成:', result);
});

queue.on('error', (error) => {
  console.error('任务失败:', error);
});

queue.on('drain', () => {
  console.log('所有任务完成');
});

queue.add(() => fetch('https://api.example.com/data1'));
queue.add(() => fetch('https://api.example.com/data2'));
queue.add(() => fetch('https://api.example.com/data3'));
```

---

## 六、stream 流模块

### 6.1 流的类型

```javascript
const { Readable, Writable, Duplex, Transform } = require('stream');

// 可读流
class MyReadable extends Readable {
  constructor(options) {
    super(options);
    this.data = ['数据1', '数据2', '数据3'];
    this.index = 0;
  }
  
  _read(size) {
    if (this.index < this.data.length) {
      this.push(this.data[this.index++]);
    } else {
      this.push(null); // 结束
    }
  }
}

// 可写流
class MyWritable extends Writable {
  _write(chunk, encoding, callback) {
    console.log('写入:', chunk.toString());
    callback();
  }
}

// 双工流（可读可写）
class MyDuplex extends Duplex {
  _read(size) {
    this.push('数据');
    this.push(null);
  }
  
  _write(chunk, encoding, callback) {
    console.log('写入:', chunk.toString());
    callback();
  }
}

// 转换流
class MyTransform extends Transform {
  _transform(chunk, encoding, callback) {
    // 转换数据
    const transformed = chunk.toString().toUpperCase();
    this.push(transformed);
    callback();
  }
}
```

### 6.2 流的管道

```javascript
const fs = require('fs');
const { Transform, pipeline } = require('stream');
const zlib = require('zlib');

// 使用 pipe
fs.createReadStream('input.txt')
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream('input.txt.gz'));

// 使用 pipeline（更好的错误处理）
pipeline(
  fs.createReadStream('input.txt'),
  zlib.createGzip(),
  fs.createWriteStream('input.txt.gz'),
  (err) => {
    if (err) {
      console.error('管道失败:', err);
    } else {
      console.log('管道成功');
    }
  }
);

// 自定义转换流
const upperCase = new Transform({
  transform(chunk, encoding, callback) {
    callback(null, chunk.toString().toUpperCase());
  },
});

pipeline(
  fs.createReadStream('input.txt'),
  upperCase,
  fs.createWriteStream('output.txt'),
  (err) => {
    if (err) console.error(err);
  }
);
```

### 6.3 流的背压

```javascript
const fs = require('fs');

// 背压处理
const readable = fs.createReadStream('large-file.txt');
const writable = fs.createWriteStream('output.txt');

readable.on('data', (chunk) => {
  // 如果写入缓冲区已满，暂停读取
  if (!writable.write(chunk)) {
    readable.pause();
  }
});

// 当写入缓冲区排空，恢复读取
writable.on('drain', () => {
  readable.resume();
});

// 使用 pipe 自动处理背压
readable.pipe(writable);
```

---

## 七、Buffer 缓冲区

### 7.1 创建 Buffer

```javascript
// 创建 Buffer
const buf1 = Buffer.alloc(10); // 10 字节，填充 0
const buf2 = Buffer.allocUnsafe(10); // 10 字节，不初始化
const buf3 = Buffer.from('Hello World'); // 从字符串创建
const buf4 = Buffer.from([1, 2, 3, 4, 5]); // 从数组创建
const buf5 = Buffer.from('Hello', 'utf8'); // 指定编码

console.log(buf1); // <Buffer 00 00 00 00 00 00 00 00 00 00>
console.log(buf3); // <Buffer 48 65 6c 6c 6f 20 57 6f 72 6c 64>
console.log(buf3.toString()); // 'Hello World'
```

### 7.2 Buffer 操作

```javascript
const buf = Buffer.from('Hello World');

// 读取
console.log(buf[0]); // 72 (H 的 ASCII 码)
console.log(buf.readUInt8(0)); // 72

// 写入
buf.write('Hi', 0);
console.log(buf.toString()); // 'Hillo World'

// 切片
const slice = buf.slice(0, 5);
console.log(slice.toString()); // 'Hillo'

// 拼接
const buf1 = Buffer.from('Hello ');
const buf2 = Buffer.from('World');
const buf3 = Buffer.concat([buf1, buf2]);
console.log(buf3.toString()); // 'Hello World'

// 查找
const index = buf.indexOf('World');
console.log(index); // 6

// 比较
const bufA = Buffer.from('abc');
const bufB = Buffer.from('abd');
console.log(bufA.compare(bufB)); // -1 (a < b)

// 复制
const target = Buffer.alloc(5);
buf.copy(target, 0, 0, 5);
console.log(target.toString()); // 'Hillo'

// 长度
console.log(buf.length); // 11

// 转换
console.log(buf.toString('hex')); // 十六进制
console.log(buf.toString('base64')); // Base64
console.log(buf.toJSON()); // JSON 格式
```

### 7.3 Buffer 与编码

```javascript
const buf = Buffer.from('你好世界', 'utf8');

// 不同编码
console.log(buf.toString('utf8'));    // '你好世界'
console.log(buf.toString('hex'));     // 'e4bda0e5a5bde4b896e7958c'
console.log(buf.toString('base64'));  // '5L2g5aW95LiW55WM'

// 编码转换
const text = 'Hello World';
const encoded = Buffer.from(text).toString('base64');
console.log('Base64 编码:', encoded);

const decoded = Buffer.from(encoded, 'base64').toString('utf8');
console.log('Base64 解码:', decoded);

// 处理二进制数据
function createPacket(type, data) {
  const typeBuffer = Buffer.alloc(1);
  typeBuffer.writeUInt8(type, 0);
  
  const dataBuffer = Buffer.from(data, 'utf8');
  const lengthBuffer = Buffer.alloc(2);
  lengthBuffer.writeUInt16BE(dataBuffer.length, 0);
  
  return Buffer.concat([typeBuffer, lengthBuffer, dataBuffer]);
}

function parsePacket(buffer) {
  const type = buffer.readUInt8(0);
  const length = buffer.readUInt16BE(1);
  const data = buffer.slice(3, 3 + length).toString('utf8');
  
  return { type, length, data };
}
```

---

## 八、crypto 加密模块

### 8.1 哈希算法

```javascript
const crypto = require('crypto');

// 创建哈希
const hash = crypto.createHash('sha256');
hash.update('Hello World');
console.log(hash.digest('hex'));
// 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e'

// 快捷方式
const hashValue = crypto
  .createHash('sha256')
  .update('Hello World')
  .digest('hex');

// 支持的算法
console.log(crypto.getHashes());
// ['sha256', 'sha512', 'md5', 'sha1', ...]

// 文件哈希
const fs = require('fs');

function hashFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}
```

### 8.2 加密解密

```javascript
const crypto = require('crypto');

// 对称加密（AES）
const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32); // 256 位密钥
const iv = crypto.randomBytes(16);  // 初始化向量

// 加密
function encrypt(text) {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// 解密
function decrypt(encrypted) {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

const encrypted = encrypt('Hello World');
console.log('加密:', encrypted);
console.log('解密:', decrypt(encrypted));

// 非对称加密（RSA）
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

// 公钥加密
const encryptedData = crypto.publicEncrypt(
  publicKey,
  Buffer.from('Hello World')
);

// 私钥解密
const decryptedData = crypto.privateDecrypt(
  privateKey,
  encryptedData
);

console.log(decryptedData.toString()); // 'Hello World'
```

### 8.3 签名验证

```javascript
const crypto = require('crypto');

// 生成密钥对
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

// 签名
const sign = crypto.createSign('SHA256');
sign.update('要签名的数据');
sign.end();

const signature = sign.sign(privateKey, 'hex');
console.log('签名:', signature);

// 验证
const verify = crypto.createVerify('SHA256');
verify.update('要签名的数据');
verify.end();

const isValid = verify.verify(publicKey, signature, 'hex');
console.log('验证结果:', isValid); // true
```

---

## 九、最佳实践

### 9.1 错误处理

```javascript
// 使用 try-catch 处理同步错误
try {
  const data = fs.readFileSync('file.txt', 'utf8');
} catch (err) {
  console.error('读取失败:', err);
}

// 使用回调处理异步错误
fs.readFile('file.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('读取失败:', err);
    return;
  }
  console.log(data);
});

// 使用 Promise 处理异步错误
async function readFile() {
  try {
    const data = await fsPromises.readFile('file.txt', 'utf8');
    return data;
  } catch (err) {
    console.error('读取失败:', err);
    throw err;
  }
}

// 全局错误处理
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
});
```

### 9.2 性能优化

```javascript
// 使用流处理大文件
// ❌ 错误：加载整个文件到内存
const data = fs.readFileSync('large-file.txt');

// ✅ 正确：使用流
fs.createReadStream('large-file.txt')
  .pipe(process.stdout);

// 使用 Buffer 池
const bufferPool = [];

function getBuffer(size) {
  return bufferPool.pop() || Buffer.allocUnsafe(size);
}

function releaseBuffer(buffer) {
  bufferPool.push(buffer);
}

// 批量操作
async function batchProcess(items, batchSize = 100) {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(item => processItem(item))
    );
    results.push(...batchResults);
  }
  
  return results;
}
```

---

## 十、错误处理最佳实践

### 10.1 错误类型分类

```javascript
// 自定义错误类型
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // 可操作的错误
    Error.captureStackTrace(this, this.constructor);
  }
}

// 具体错误类型
class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class UnauthorizedError extends AppError {
  constructor(message = '未授权访问') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = '禁止访问') {
    super(message, 403, 'FORBIDDEN');
  }
}

class NotFoundError extends AppError {
  constructor(resource = '资源') {
    super(`${resource}不存在`, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message = '资源冲突') {
    super(message, 409, 'CONFLICT');
  }
}

class InternalServerError extends AppError {
  constructor(message = '服务器内部错误') {
    super(message, 500, 'INTERNAL_ERROR');
  }
}

// 使用示例
function findUserById(id) {
  if (!id || typeof id !== 'number') {
    throw new ValidationError('用户ID无效', [
      { field: 'id', message: 'ID必须为正整数' }
    ]);
  }

  const user = users.find(u => u.id === id);

  if (!user) {
    throw new NotFoundError('用户');
  }

  return user;
}
```

### 10.2 异步错误处理

```javascript
// 异步函数错误处理包装器
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 使用示例
app.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await findUserById(parseInt(req.params.id));
  res.json({ data: user });
}));

// 统一错误处理中间件
function errorHandler(err, req, res, next) {
  // 记录错误日志
  console.error({
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
    },
  });

  // 处理已知错误
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // 处理 JSON 解析错误
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: '请求体JSON格式错误',
      },
    });
  }

  // 未知错误
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? '服务器内部错误'
        : err.message,
    },
  });
}

// 全局错误处理
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  // 记录日志后优雅退出
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  // 可以选择继续运行或退出
});
```

### 10.3 错误日志记录

```javascript
const fs = require('fs');
const path = require('path');

// 简单的日志类
class Logger {
  constructor(logDir = 'logs') {
    this.logDir = logDir;
    this.ensureLogDir();
  }

  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, meta = {}) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
    }) + '\n';
  }

  writeLog(filename, content) {
    const logPath = path.join(this.logDir, filename);
    fs.appendFileSync(logPath, content);
  }

  info(message, meta = {}) {
    const log = this.formatMessage('INFO', message, meta);
    this.writeLog('app.log', log);
    console.log(log.trim());
  }

  error(message, meta = {}) {
    const log = this.formatMessage('ERROR', message, meta);
    this.writeLog('error.log', log);
    console.error(log.trim());
  }

  warn(message, meta = {}) {
    const log = this.formatMessage('WARN', message, meta);
    this.writeLog('app.log', log);
    console.warn(log.trim());
  }
}

const logger = new Logger();

// 使用示例
logger.info('服务器启动', { port: 3000 });
logger.error('数据库连接失败', { error: 'Connection refused' });
```

---

## 十一、安全性考虑

### 11.1 输入验证与清洗

```javascript
// 输入验证工具
const validator = {
  // 验证邮箱
  isEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // 验证手机号
  isPhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  },

  // 验证URL
  isUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // 验证身份证号
  isIdCard(idCard) {
    const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
    return idCardRegex.test(idCard);
  },

  // 验证密码强度
  isStrongPassword(password) {
    // 至少8位，包含大小写字母、数字和特殊字符
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongRegex.test(password);
  },

  // 清洗HTML（防止XSS）
  sanitizeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  },

  // 清洗SQL（防止SQL注入）
  sanitizeSql(str) {
    return str.replace(/['";\\]/g, '');
  },
};

// 使用示例
function validateUserInput(data) {
  const errors = [];

  if (!validator.isEmail(data.email)) {
    errors.push({ field: 'email', message: '邮箱格式不正确' });
  }

  if (!validator.isStrongPassword(data.password)) {
    errors.push({ field: 'password', message: '密码强度不足' });
  }

  if (errors.length > 0) {
    throw new ValidationError('输入验证失败', errors);
  }

  // 清洗输入
  return {
    email: data.email.toLowerCase().trim(),
    name: validator.sanitizeHtml(data.name),
  };
}
```

### 11.2 安全头设置

```javascript
const http = require('http');

const server = http.createServer((req, res) => {
  // 安全相关的响应头
  const securityHeaders = {
    // 防止点击劫持
    'X-Frame-Options': 'DENY',

    // 防止MIME类型嗅探
    'X-Content-Type-Options': 'nosniff',

    // XSS保护
    'X-XSS-Protection': '1; mode=block',

    // 内容安全策略
    'Content-Security-Policy': "default-src 'self'; script-src 'self'",

    // HTTPS强制
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',

    // 引用策略
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // 权限策略
    'Permissions-Policy': 'geolocation=(), microphone=()',
  };

  // 设置安全头
  Object.entries(securityHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // 移除敏感头
  res.removeHeader('X-Powered-By');

  // 处理请求...
});

// Express中使用helmet
// npm install helmet
const helmet = require('helmet');
app.use(helmet());
```

### 11.3 敏感数据处理

```javascript
const crypto = require('crypto');

// 密码加密
const bcrypt = require('bcrypt');

async function hashPassword(password) {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

// 敏感数据加密存储
class SecureStorage {
  constructor(encryptionKey) {
    this.algorithm = 'aes-256-gcm';
    this.key = Buffer.from(encryptionKey, 'hex');
  }

  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      iv: iv.toString('hex'),
      data: encrypted,
      authTag: authTag.toString('hex'),
    };
  }

  decrypt(encrypted) {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(encrypted.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));

    let decrypted = decipher.update(encrypted.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

// 日志脱敏
function maskSensitiveData(data) {
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];

  const masked = { ...data };

  for (const field of sensitiveFields) {
    if (masked[field]) {
      masked[field] = '***MASKED***';
    }
  }

  // 邮箱脱敏
  if (masked.email) {
    const [localPart, domain] = masked.email.split('@');
    masked.email = `${localPart.slice(0, 2)}***@${domain}`;
  }

  // 手机号脱敏
  if (masked.phone) {
    masked.phone = masked.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }

  return masked;
}
```

### 11.4 速率限制

```javascript
// 简单的内存速率限制器
class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000; // 时间窗口（毫秒）
    this.max = options.max || 100; // 最大请求数
    this.requests = new Map();
  }

  getKey(req) {
    // 使用IP作为限制键
    return req.ip || req.connection.remoteAddress;
  }

  middleware() {
    return (req, res, next) => {
      const key = this.getKey(req);
      const now = Date.now();

      // 获取或创建请求记录
      let record = this.requests.get(key);

      if (!record || now - record.startTime > this.windowMs) {
        // 新的时间窗口
        record = {
          count: 0,
          startTime: now,
        };
        this.requests.set(key, record);
      }

      record.count++;

      // 设置响应头
      res.setHeader('X-RateLimit-Limit', this.max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, this.max - record.count));
      res.setHeader('X-RateLimit-Reset', record.startTime + this.windowMs);

      if (record.count > this.max) {
        return res.status(429).json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: '请求过于频繁，请稍后再试',
            retryAfter: Math.ceil((record.startTime + this.windowMs - now) / 1000),
          },
        });
      }

      next();
    };
  }

  // 清理过期记录
  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now - record.startTime > this.windowMs) {
        this.requests.delete(key);
      }
    }
  }
}

// 使用示例
const limiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 最多100次请求
});

app.use('/api', limiter.middleware());

// 定期清理
setInterval(() => limiter.cleanup(), 60000);
```

---

## 十二、性能优化技巧

### 12.1 内存管理

```javascript
// 监控内存使用
function monitorMemory() {
  const used = process.memoryUsage();

  console.log({
    rss: `${Math.round(used.rss / 1024 / 1024)}MB`, // 常驻内存
    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`, // 堆总量
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`, // 堆使用
    external: `${Math.round(used.external / 1024 / 1024)}MB`, // 外部内存
  });
}

// 内存泄漏检测
function detectMemoryLeak() {
  let lastHeapUsed = 0;

  setInterval(() => {
    const used = process.memoryUsage();
    const heapUsed = used.heapUsed;

    if (lastHeapUsed > 0 && heapUsed > lastHeapUsed * 1.5) {
      console.warn('可能存在内存泄漏!', {
        lastHeapUsed: `${Math.round(lastHeapUsed / 1024 / 1024)}MB`,
        currentHeapUsed: `${Math.round(heapUsed / 1024 / 1024)}MB`,
      });
    }

    lastHeapUsed = heapUsed;
  }, 30000);
}

// 手动触发垃圾回收（需要 --expose-gc 标志）
if (global.gc) {
  global.gc();
}

// 设置内存限制
const LIMIT_MB = 512;

setInterval(() => {
  const used = process.memoryUsage();

  if (used.heapUsed > LIMIT_MB * 1024 * 1024) {
    console.warn('内存使用超过限制，准备重启...');
    process.exit(1);
  }
}, 60000);
```

### 12.2 并发控制

```javascript
// 并发队列
class ConcurrencyQueue {
  constructor(concurrency = 4) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  async add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.run();
    });
  }

  async run() {
    while (this.running < this.concurrency && this.queue.length > 0) {
      this.running++;
      const { task, resolve, reject } = this.queue.shift();

      try {
        const result = await task();
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        this.running--;
        this.run();
      }
    }
  }
}

// 使用示例
const queue = new ConcurrencyQueue(3);

const urls = ['url1', 'url2', 'url3', 'url4', 'url5'];

const results = await Promise.all(
  urls.map(url => queue.add(() => fetch(url)))
);
```

### 12.3 缓存策略

```javascript
// 内存缓存
class MemoryCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000;
    this.defaultTTL = options.defaultTTL || 60000; // 默认1分钟
    this.cache = new Map();
  }

  set(key, value, ttl = this.defaultTTL) {
    // 如果超过最大大小，删除最旧的
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  get(key) {
    const item = this.cache.get(key);

    if (!item) return null;

    // 检查是否过期
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  // 清理过期缓存
  cleanup() {
    const now = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// 使用示例
const cache = new MemoryCache({ maxSize: 500, defaultTTL: 300000 });

async function getUserWithCache(userId) {
  const cacheKey = `user:${userId}`;

  // 尝试从缓存获取
  let user = cache.get(cacheKey);

  if (user) {
    return user;
  }

  // 从数据库获取
  user = await User.findById(userId);

  // 存入缓存
  if (user) {
    cache.set(cacheKey, user);
  }

  return user;
}

// 定期清理过期缓存
setInterval(() => cache.cleanup(), 60000);
```

### 12.4 流式处理大数据

```javascript
const { Transform, pipeline } = require('stream');
const fs = require('fs');

// 处理大JSON文件
async function processLargeJsonFile(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const transformStream = new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        try {
          // 处理每一行数据
          const data = JSON.parse(chunk.toString());
          const processed = {
            id: data.id,
            name: data.name.toUpperCase(),
            processedAt: new Date().toISOString(),
          };
          callback(null, JSON.stringify(processed) + '\n');
        } catch (error) {
          callback(error);
        }
      },
    });

    pipeline(
      fs.createReadStream(inputPath),
      transformStream,
      fs.createWriteStream(outputPath),
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

// CSV处理
const { parse } = require('csv-parse');
const { stringify } = require('csv-stringify');

async function processCsvFile(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const records = [];

    pipeline(
      fs.createReadStream(inputPath),
      parse({ columns: true }),
      new Transform({
        objectMode: true,
        transform(record, encoding, callback) {
          // 处理每条记录
          const processed = {
            ...record,
            processed: true,
          };
          callback(null, processed);
        },
      }),
      stringify({ header: true }),
      fs.createWriteStream(outputPath),
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}
```

---

## 十三、生产环境部署建议

### 13.1 进程管理

```javascript
// cluster 模块实现多进程
const cluster = require('cluster');
const os = require('os');

if (cluster.isPrimary) {
  const cpuCount = os.cpus().length;

  console.log(`主进程 ${process.pid} 正在运行`);
  console.log(`启动 ${cpuCount} 个工作进程`);

  // 根据 CPU 核心数创建工作进程
  for (let i = 0; i < cpuCount; i++) {
    cluster.fork();
  }

  // 监听工作进程退出
  cluster.on('exit', (worker, code, signal) => {
    console.log(`工作进程 ${worker.process.pid} 已退出`);
    // 自动重启
    cluster.fork();
  });
} else {
  // 工作进程代码
  const http = require('http');

  const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end(`工作进程 ${process.pid} 处理请求`);
  });

  server.listen(3000);
  console.log(`工作进程 ${process.pid} 已启动`);
}
```

### 13.2 健康检查

```javascript
const http = require('http');

// 健康检查端点
class HealthChecker {
  constructor() {
    this.checks = new Map();
  }

  // 注册检查项
  register(name, checkFn) {
    this.checks.set(name, checkFn);
  }

  // 执行所有检查
  async check() {
    const results = {};
    let isHealthy = true;

    for (const [name, checkFn] of this.checks.entries()) {
      try {
        const result = await checkFn();
        results[name] = { status: 'ok', ...result };
      } catch (error) {
        results[name] = { status: 'error', message: error.message };
        isHealthy = false;
      }
    }

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: results,
    };
  }
}

const healthChecker = new HealthChecker();

// 注册数据库检查
healthChecker.register('database', async () => {
  // 执行简单的数据库查询
  await db.ping();
  return { latency: '5ms' };
});

// 注册Redis检查
healthChecker.register('redis', async () => {
  await redis.ping();
  return { latency: '2ms' };
});

// 健康检查路由
app.get('/health', async (req, res) => {
  const health = await healthChecker.check();
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// 存活探针
app.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

// 就绪探针
app.get('/health/ready', async (req, res) => {
  try {
    await healthChecker.check();
    res.status(200).json({ status: 'ready' });
  } catch {
    res.status(503).json({ status: 'not ready' });
  }
});
```

### 13.3 优雅关闭

```javascript
const http = require('http');

const server = http.createServer(app);

// 跟踪活跃连接
const activeConnections = new Set();

server.on('connection', (connection) => {
  activeConnections.add(connection);
  connection.on('close', () => {
    activeConnections.delete(connection);
  });
});

// 优雅关闭
let isShuttingDown = false;

async function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`收到 ${signal} 信号，开始优雅关闭...`);

  // 停止接受新连接
  server.close(() => {
    console.log('HTTP服务器已关闭');
  });

  // 设置强制关闭超时
  const forceCloseTimeout = setTimeout(() => {
    console.log('强制关闭剩余连接');
    process.exit(1);
  }, 30000);

  // 等待所有活跃连接关闭
  const checkConnections = setInterval(() => {
    if (activeConnections.size === 0) {
      clearInterval(checkConnections);
      clearTimeout(forceCloseTimeout);
      console.log('所有连接已关闭');
      process.exit(0);
    }
    console.log(`等待 ${activeConnections.size} 个连接关闭...`);
  }, 1000);

  // 关闭数据库连接
  try {
    await db.close();
    console.log('数据库连接已关闭');
  } catch (error) {
    console.error('关闭数据库连接失败:', error);
  }

  // 关闭Redis连接
  try {
    await redis.quit();
    console.log('Redis连接已关闭');
  } catch (error) {
    console.error('关闭Redis连接失败:', error);
  }
}

// 监听关闭信号
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

### 13.4 环境配置

```javascript
// config/index.js
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

const config = {
  // 应用配置
  app: {
    port: parseInt(process.env.PORT, 10) || 3000,
    env: process.env.NODE_ENV || 'development',
    name: process.env.APP_NAME || 'my-app',
  },

  // 数据库配置
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'mydb',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    poolSize: parseInt(process.env.DB_POOL_SIZE, 10) || 10,
  },

  // Redis配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD,
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
};

// 验证必要配置
function validateConfig() {
  const required = ['JWT_SECRET', 'DB_PASSWORD'];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`缺少必要的环境变量: ${key}`);
    }
  }
}

validateConfig();

module.exports = config;
```

---

## 十四、常见面试问题

### 14.1 Node.js 基础问题

**Q1: Node.js 为什么是单线程的？有什么优缺点？**

```
答案：
Node.js 采用单线程模型的原因：
1. 避免线程创建和上下文切换的开销
2. 避免多线程编程的复杂性（锁、竞态条件等）
3. 更适合 I/O 密集型应用

优点：
- 内存占用低
- 无需处理线程同步问题
- 适合高并发 I/O 场景

缺点：
- CPU 密集型任务会阻塞事件循环
- 无法利用多核 CPU（需要 cluster 模块）
- 单个错误可能导致整个进程崩溃

解决方案：
- 使用 cluster 模块创建多进程
- 使用 worker_threads 处理 CPU 密集型任务
- 使用 child_process 执行外部程序
```

**Q2: 解释 Node.js 的事件循环机制**

```
答案：
事件循环分为6个阶段：

1. timers（定时器阶段）
   - 执行 setTimeout/setInterval 回调

2. pending callbacks（待处理回调）
   - 执行上一轮循环中被延迟的 I/O 回调

3. idle, prepare（空闲/准备）
   - 仅 libuv 内部使用

4. poll（轮询阶段）
   - 执行 I/O 回调
   - 处理队列中的事件

5. check（检查阶段）
   - 执行 setImmediate 回调

6. close callbacks（关闭回调）
   - 执行 close 事件回调

微任务优先级：
- process.nextTick > Promise.then > setTimeout > setImmediate
```

**Q3: 什么是回调地狱？如何避免？**

```javascript
// 回调地狱示例
getData(function(a) {
  getMoreData(a, function(b) {
    getMoreData(b, function(c) {
      getMoreData(c, function(d) {
        // 嵌套过深，难以维护
      });
    });
  });
});

// 解决方案1：使用 Promise
getData()
  .then(a => getMoreData(a))
  .then(b => getMoreData(b))
  .then(c => getMoreData(c))
  .then(d => console.log(d))
  .catch(err => console.error(err));

// 解决方案2：使用 async/await（推荐）
async function fetchAllData() {
  try {
    const a = await getData();
    const b = await getMoreData(a);
    const c = await getMoreData(b);
    const d = await getMoreData(c);
    return d;
  } catch (err) {
    console.error(err);
  }
}
```

### 14.2 核心模块问题

**Q4: Buffer 和 Stream 有什么区别？**

```
答案：
Buffer：
- 固定大小的内存块
- 用于处理二进制数据
- 适合小数据处理
- 数据一次性加载到内存

Stream：
- 流式数据处理
- 数据分块处理，不一次性加载
- 适合大文件处理
- 支持管道操作

选择建议：
- 小文件（< 100MB）：使用 Buffer
- 大文件（> 100MB）：使用 Stream
- 网络传输：使用 Stream
- 实时数据：使用 Stream
```

**Q5: 如何实现一个大文件的复制？**

```javascript
// 方式1：使用 pipe（推荐）
const fs = require('fs');

function copyLargeFile(src, dest) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(src)
      .pipe(fs.createWriteStream(dest))
      .on('finish', resolve)
      .on('error', reject);
  });
}

// 方式2：使用 pipeline（更好的错误处理）
const { pipeline } = require('stream');

function copyWithPipeline(src, dest) {
  return new Promise((resolve, reject) => {
    pipeline(
      fs.createReadStream(src),
      fs.createWriteStream(dest),
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

// 方式3：带进度显示
async function copyWithProgress(src, dest) {
  const stat = await fs.promises.stat(src);
  const totalSize = stat.size;
  let copiedSize = 0;

  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(src);
    const writeStream = fs.createWriteStream(dest);

    readStream.on('data', (chunk) => {
      copiedSize += chunk.length;
      const progress = (copiedSize / totalSize * 100).toFixed(2);
      console.log(`进度: ${progress}%`);
    });

    readStream.pipe(writeStream)
      .on('finish', resolve)
      .on('error', reject);
  });
}
```

### 14.3 性能优化问题

**Q6: 如何诊断 Node.js 应用的性能问题？**

```javascript
// 1. 使用 Node.js 内置分析器
// node --prof app.js
// node --prof-process isolate-*.log

// 2. 使用 clinic.js
// npm install -g clinic
// clinic doctor -- node app.js

// 3. 监控事件循环延迟
function monitorEventLoopDelay() {
  const start = process.hrtime.bigint();

  setImmediate(() => {
    const end = process.hrtime.bigint();
    const delay = Number(end - start) / 1e6; // 转换为毫秒

    if (delay > 100) {
      console.warn(`事件循环延迟: ${delay.toFixed(2)}ms`);
    }
  });
}

setInterval(monitorEventLoopDelay, 1000);

// 4. 使用 perf_hooks
const { performance, PerformanceObserver } = require('perf_hooks');

const obs = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach((entry) => {
    console.log(`${entry.name}: ${entry.duration}ms`);
  });
});

obs.observe({ entryTypes: ['measure', 'function'] });

// 5. 内存分析
const { heapSnapshot } = require('v8');
// 触发堆快照
// kill -USR2 <pid>
```

**Q7: 如何处理 CPU 密集型任务？**

```javascript
// 方式1：使用 worker_threads
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

// 主线程
if (isMainThread) {
  function runHeavyTask(data) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename, {
        workerData: data,
      });

      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
      });
    });
  }

  const result = await runHeavyTask({ numbers: [1, 2, 3, 4, 5] });
  console.log(result);
}

// 工作线程
if (!isMainThread) {
  const result = workerData.numbers.reduce((sum, n) => sum + n, 0);
  parentPort.postMessage(result);
}

// 方式2：使用 child_process
const { fork } = require('child_process');

function runInChildProcess(modulePath, data) {
  return new Promise((resolve, reject) => {
    const child = fork(modulePath);

    child.send(data);
    child.on('message', resolve);
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Child process exited with code ${code}`));
    });
  });
}

// 方式3：拆分任务
async function processInChunks(data, chunkSize, processFn) {
  const results = [];

  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(chunk.map(processFn));
    results.push(...chunkResults);

    // 让出事件循环
    await new Promise(resolve => setImmediate(resolve));
  }

  return results;
}
```

### 14.4 安全问题

**Q8: Node.js 应用常见的安全漏洞有哪些？如何防范？**

```
答案：
1. SQL 注入
   - 使用参数化查询
   - 使用 ORM
   - 输入验证和清洗

2. XSS（跨站脚本攻击）
   - 输出编码
   - 使用 CSP 头
   - 使用安全的模板引擎

3. CSRF（跨站请求伪造）
   - 使用 CSRF Token
   - 验证 Referer 头
   - SameSite Cookie 属性

4. 敏感信息泄露
   - 错误信息不暴露堆栈
   - 日志脱敏
   - 环境变量管理

5. 依赖漏洞
   - 定期运行 npm audit
   - 使用 Snyk 等工具
   - 及时更新依赖

6. DoS 攻击
   - 速率限制
   - 请求大小限制
   - 超时设置
```

```javascript
// 安全配置示例
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

// 安全中间件
app.use(helmet()); // 安全头

// 速率限制
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
}));

// 数据清洗
app.use(mongoSanitize()); // 防止 NoSQL 注入
app.use(xss()); // 防止 XSS

// 参数污染防护
app.use(hpp());

// 请求体大小限制
app.use(express.json({ limit: '10kb' }));
```

---

## 十五、实战案例

### 15.1 文件上传服务

```javascript
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pipeline } = require('stream');

class FileUploadService {
  constructor(options = {}) {
    this.uploadDir = options.uploadDir || './uploads';
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png', 'application/pdf'];

    this.ensureUploadDir();
  }

  ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  // 生成唯一文件名
  generateFileName(originalName) {
    const ext = path.extname(originalName);
    const hash = crypto.randomBytes(16).toString('hex');
    const date = new Date().toISOString().split('T')[0];
    return `${date}_${hash}${ext}`;
  }

  // 验证文件
  validateFile(file) {
    const errors = [];

    if (file.size > this.maxFileSize) {
      errors.push(`文件大小超过限制 (${this.maxFileSize / 1024 / 1024}MB)`);
    }

    if (!this.allowedTypes.includes(file.mimetype)) {
      errors.push(`不支持的文件类型: ${file.mimetype}`);
    }

    return errors;
  }

  // 保存文件
  async saveFile(file) {
    const errors = this.validateFile(file);

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    const fileName = this.generateFileName(file.originalname);
    const filePath = path.join(this.uploadDir, fileName);

    await fs.promises.writeFile(filePath, file.buffer);

    return {
      fileName,
      filePath,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  // 流式保存大文件
  async saveStream(readStream, fileInfo) {
    const fileName = this.generateFileName(fileInfo.originalname);
    const filePath = path.join(this.uploadDir, fileName);

    return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(filePath);
      let size = 0;

      readStream.on('data', (chunk) => {
        size += chunk.length;
        if (size > this.maxFileSize) {
          readStream.destroy();
          writeStream.destroy();
          fs.unlinkSync(filePath);
          reject(new Error('文件大小超过限制'));
        }
      });

      pipeline(
        readStream,
        writeStream,
        (err) => {
          if (err) reject(err);
          else resolve({ fileName, filePath, size });
        }
      );
    });
  }
}

// Express 中使用
const multer = require('multer');

const uploadService = new FileUploadService({
  maxFileSize: 20 * 1024 * 1024, // 20MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: uploadService.maxFileSize },
  fileFilter: (req, file, cb) => {
    if (uploadService.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  },
});

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const result = await uploadService.saveFile(req.file);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
```

### 15.2 任务队列实现

```javascript
const EventEmitter = require('events');

class TaskQueue extends EventEmitter {
  constructor(options = {}) {
    super();
    this.concurrency = options.concurrency || 5;
    this.timeout = options.timeout || 30000;
    this.retries = options.retries || 3;

    this.queue = [];
    this.running = 0;
    this.paused = false;
  }

  // 添加任务
  add(task, options = {}) {
    const taskItem = {
      id: Date.now() + Math.random(),
      task,
      retries: options.retries ?? this.retries,
      timeout: options.timeout ?? this.timeout,
      priority: options.priority || 0,
    };

    // 按优先级插入
    const index = this.queue.findIndex(t => t.priority < taskItem.priority);
    if (index === -1) {
      this.queue.push(taskItem);
    } else {
      this.queue.splice(index, 0, taskItem);
    }

    this.emit('added', taskItem);
    this.run();

    return taskItem.id;
  }

  // 执行任务
  async run() {
    if (this.paused || this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }

    this.running++;
    const taskItem = this.queue.shift();

    try {
      // 设置超时
      const result = await Promise.race([
        taskItem.task(),
        this.createTimeout(taskItem.timeout),
      ]);

      this.emit('completed', { id: taskItem.id, result });
    } catch (error) {
      // 重试
      if (taskItem.retries > 0) {
        taskItem.retries--;
        this.queue.unshift(taskItem);
        this.emit('retry', { id: taskItem.id, retriesLeft: taskItem.retries });
      } else {
        this.emit('failed', { id: taskItem.id, error });
      }
    } finally {
      this.running--;
      this.run();
    }

    // 检查是否全部完成
    if (this.running === 0 && this.queue.length === 0) {
      this.emit('drain');
    }
  }

  createTimeout(ms) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('任务超时')), ms);
    });
  }

  // 暂停队列
  pause() {
    this.paused = true;
    this.emit('paused');
  }

  // 恢复队列
  resume() {
    this.paused = false;
    this.emit('resumed');
    this.run();
  }

  // 获取状态
  getStatus() {
    return {
      pending: this.queue.length,
      running: this.running,
      paused: this.paused,
    };
  }
}

// 使用示例
const queue = new TaskQueue({ concurrency: 3, retries: 2 });

queue.on('completed', ({ id, result }) => {
  console.log(`任务 ${id} 完成:`, result);
});

queue.on('failed', ({ id, error }) => {
  console.error(`任务 ${id} 失败:`, error.message);
});

queue.on('drain', () => {
  console.log('所有任务已完成');
});

// 添加任务
for (let i = 0; i < 10; i++) {
  queue.add(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return `结果 ${i}`;
  });
}
```

---

*本文档最后更新于 2026年3月*