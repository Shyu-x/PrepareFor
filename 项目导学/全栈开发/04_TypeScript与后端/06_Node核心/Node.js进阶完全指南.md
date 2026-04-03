# Node.js进阶完全指南

> 本文档为Web前端开发教学系统Node.js进阶教程，深入讲解事件循环、模块系统、内存管理、异步编程等核心概念。通过大量实战代码和面试题解析，帮助学习者真正掌握Node.js的底层原理。
>
> **版本说明**：Node.js 20.x LTS（当前最新稳定版本），Node.js 18.x（长期维护版本）

---

## 目录

1. [Node.js核心模块](#1-nodejs核心模块)
2. [事件循环深入](#2-事件循环深入)
3. [模块系统](#3-模块系统)
4. [内存管理](#4-内存管理)
5. [异步编程模式](#5-异步编程模式)
6. [网络编程](#6-网络编程)
7. [进程与线程](#7-进程与线程)
8. [调试与排错](#8-调试与排错)
9. [安全](#9-安全)
10. [测试](#10-测试)
11. [工程化](#11-工程化)
12. [实战：手写Node.js框架](#12-实战手写nodejs框架)

---

## 1. Node.js核心模块

Node.js的核心模块是构建所有Node.js应用的基础。本章将深入讲解最常用的核心模块，并通过实战代码展示它们的实际应用。

### 1.1 Events模块：事件驱动基础

Node.js是一个典型的事件驱动架构，而Events模块就是整个事件驱动的基础。JavaScript在浏览器中有事件循环，Node.js同样采用事件驱动模式来处理异步操作。

**为什么Node.js选择事件驱动？**

事件驱动架构的优势在于：
- 高并发处理能力：单线程可以处理大量并发连接
- 低内存占用：每个连接不需要独立的线程
- 非阻塞I/O：可以充分利用异步I/O提高吞吐量

**Events模块核心概念**

```javascript
// 引入Events模块
const EventEmitter = require('events');

// 创建一个事件发射器（事件中心）
class MyEmitter extends EventEmitter {
    constructor() {
        super();
        // 初始化时设置最大监听器数量，避免内存泄漏
        this.setMaxListeners(20);
    }
}

// 创建实例
const myEmitter = new MyEmitter();

// 定义事件处理函数
// on方法用于注册监听器，事件触发时调用
myEmitter.on('user:login', (user, timestamp) => {
    console.log(`用户 ${user.name} 在 ${timestamp} 登录系统`);
});

// once方法注册的监听器只会触发一次
myEmitter.once('system:start', () => {
    console.log('系统启动事件只会触发一次');
});

// 注册带有错误处理的事件监听器
myEmitter.on('error', (err) => {
    console.error('捕获到错误:', err.message);
});

// 触发事件
myEmitter.emit('user:login', { name: '张三' }, new Date());
// 输出: 用户 张三 在 2024-01-01T10:00:00.000Z 登录系统

myEmitter.emit('error', new Error('测试错误'));
// 输出: 捕获到错误: 测试错误
```

**常用方法详解**

```javascript
const EventEmitter = require('events');

// 创建事件发射器
const emitter = new EventEmitter();

// ============================================
// 事件注册方法
// ============================================

// on(eventName, listener) - 注册持续监听器
emitter.on('data', (chunk) => {
    console.log('收到数据:', chunk);
});

// once(eventName, listener) - 注册单次监听器
emitter.once('connect', () => {
    console.log('连接建立');
});

// addListener(eventName, listener) - 与on方法完全相同
emitter.addListener('message', (msg) => {
    console.log('收到消息:', msg);
});

// prependListener(eventName, listener) - 将监听器添加到开头
emitter.prependListener('data', () => {
    console.log('这个会先执行');
});

// ============================================
// 事件触发方法
// ============================================

// emit(eventName, ...args) - 同步触发所有监听器
emitter.emit('data', 'Hello World');

// ============================================
// 事件移除方法
// ============================================

// off(eventName, listener) - 移除指定监听器（Node.js 10+）
const handler = () => console.log('被移除的监听器');
emitter.on('remove', handler);
emitter.off('remove', handler);

// removeAllListeners([eventName]) - 移除所有监听器
emitter.removeAllListeners('data');

// ============================================
// 查询方法
// ============================================

// listenerCount(emitter, eventName) - 获取监听器数量（已废弃，使用 emitter.listenerCount()）
console.log(emitter.listenerCount('data'));

// eventNames() - 返回所有已注册事件名
console.log(emitter.eventNames()); // ['data', 'connect', 'message', 'remove']

// listeners(eventName) - 返回指定事件的所有监听器
console.log(emitter.listeners('data'));

// rawListeners(eventName) - 返回包含listenerWrapper的监听器数组
// 用于once方法，返回实际的处理函数而非包装后的函数
```

**实现一个简易的EventEmitter**

理解EventEmitter的最佳方式是手写一个简化版本：

```javascript
// 手写简化版EventEmitter，理解其核心原理
class SimpleEventEmitter {
    constructor() {
        // 使用对象存储事件，键为事件名，值为处理函数数组
        this._events = {};
        // 最大监听器数量，超过会警告
        this._maxListeners = 10;
    }

    // 设置最大监听器数量
    setMaxListeners(n) {
        this._maxListeners = n;
    }

    // 注册事件监听器
    on(event, listener) {
        if (typeof listener !== 'function') {
            throw new TypeError('监听器必须是函数');
        }

        // 如果事件不存在，创建空数组
        if (!this._events[event]) {
            this._events[event] = [];
        }

        const listeners = this._events[event];

        // 检查是否超过最大监听器数量
        if (listeners.length >= this._maxListeners) {
            console.warn(
                `警告: ${event} 事件的监听器数量(${listeners.length})超过了最大限制(${this._maxListeners})`
            );
        }

        // 添加监听器
        listeners.push(listener);

        // 支持链式调用
        return this;
    }

    // 注册单次监听器
    once(event, listener) {
        // 创建一个包装函数，执行后自动移除
        const wrapper = (...args) => {
            // 先执行原始监听器
            listener.apply(this, args);
            // 然后移除自己
            this.off(event, wrapper);
        };

        // 在wrapper上标记原始监听器，方便后续清理
        wrapper._listener = listener;

        return this.on(event, wrapper);
    }

    // 触发事件
    emit(event, ...args) {
        const listeners = this._events[event];

        if (!listeners || listeners.length === 0) {
            return false;
        }

        // 遍历并执行所有监听器
        // 使用slice复制数组，避免监听器在执行过程中被修改导致的问题
        const handlers = listeners.slice();
        for (const handler of handlers) {
            handler.apply(this, args);
        }

        return true;
    }

    // 移除事件监听器
    off(event, listener) {
        const listeners = this._events[event];

        if (!listeners) {
            return this;
        }

        // 找到并移除指定的监听器
        const index = listeners.indexOf(listener);
        if (index !== -1) {
            listeners.splice(index, 1);
        }

        // 如果事件没有任何监听器了，删除这个事件
        if (listeners.length === 0) {
            delete this._events[event];
        }

        return this;
    }

    // 移除所有监听器
    removeAllListeners(event) {
        if (event) {
            delete this._events[event];
        } else {
            this._events = {};
        }
        return this;
    }

    // 获取监听器数量
    listenerCount(event) {
        return this._events[event]?.length || 0;
    }

    // 获取所有事件名
    eventNames() {
        return Object.keys(this._events);
    }

    // 获取指定事件的所有监听器
    listeners(event) {
        return this._events[event]?.slice() || [];
    }
}

// 使用示例
const simple = new SimpleEventEmitter();

simple.on('greet', (name) => {
    console.log(`你好, ${name}!`);
});

simple.once('start', () => {
    console.log('系统启动了');
});

simple.emit('greet', '张三');
// 输出: 你好, 张三!

simple.emit('greet', '李四');
// 输出: 你好, 李四!

simple.emit('start');
// 输出: 系统启动了

simple.emit('start');
// 不再有输出，因为once监听器已被移除
```

**实战：实现一个消息发布订阅系统**

```javascript
// 消息发布订阅系统实战
class PubSub extends EventEmitter {
    constructor() {
        super();
        // 存储订阅者信息
        this._subscribers = new Map();
        // 订阅计数器，用于生成唯一订阅ID
        this._subIdCounter = 0;
    }

    // 订阅主题
    subscribe(topic, handler) {
        // 生成唯一订阅ID
        const subId = ++this._subIdCounter;

        // 如果主题不存在，初始化订阅者数组
        if (!this._subscribers.has(topic)) {
            this._subscribers.set(topic, new Map());
        }

        // 存储订阅者
        this._subscribers.get(topic).set(subId, handler);

        // 同时注册到EventEmitter（复用事件机制）
        this.on(topic, handler);

        // 返回取消订阅函数，方便后续取消
        return () => this.unsubscribe(topic, subId);
    }

    // 订阅一次
    subscribeOnce(topic, handler) {
        const subId = ++this._subIdCounter;

        // 创建包装函数
        const wrapper = (...args) => {
            handler(...args);
            this.unsubscribe(topic, subId);
        };

        if (!this._subscribers.has(topic)) {
            this._subscribers.set(topic, new Map());
        }

        this._subscribers.get(topic).set(subId, wrapper);
        this.once(topic, wrapper);

        return () => this.unsubscribe(topic, subId);
    }

    // 发布主题
    publish(topic, ...args) {
        // 触发事件，通知所有订阅者
        this.emit(topic, ...args);

        return this;
    }

    // 取消订阅
    unsubscribe(topic, subId) {
        const topicSubs = this._subscribers.get(topic);

        if (topicSubs) {
            const handler = topicSubs.get(subId);
            if (handler) {
                // 从EventEmitter中移除
                this.off(topic, handler);
                // 从订阅表中移除
                topicSubs.delete(subId);
            }

            // 如果主题没有订阅者了，清理
            if (topicSubs.size === 0) {
                this._subscribers.delete(topic);
            }
        }

        return this;
    }

    // 获取主题的订阅者数量
    subscriberCount(topic) {
        return this._subscribers.get(topic)?.size || 0;
    }

    // 获取所有主题
    getTopics() {
        return Array.from(this._subscribers.keys());
    }
}

// 使用示例
const pubsub = new PubSub();

// 订阅多个主题
const unsubGreet = pubsub.subscribe('user:greet', (name) => {
    console.log(`用户 ${name} 收到了问候`);
});

pubsub.subscribe('user:greet', (name) => {
    console.log(`[日志] 用户 ${name} 收到了问候`);
});

const unsubLogin = pubsub.subscribe('user:login', (user) => {
    console.log(`用户 ${user.name} (${user.email}) 登录了系统`);
});

// 发布消息
pubsub.publish('user:greet', '张三');
// 输出:
// 用户 张三 收到了问候
// [日志] 用户 张三 收到了问候

pubsub.publish('user:login', { name: '李四', email: 'li@example.com' });
// 输出: 用户 李四 (li@example.com) 登录了系统

// 取消一个订阅
unsubGreet();

pubsub.publish('user:greet', '王五');
// 输出: [日志] 用户 王五 收到了问候（只输出一个）

console.log('当前订阅的主题:', pubsub.getTopics());
console.log('user:greet 订阅者数量:', pubsub.subscriberCount('user:greet'));
```

### 1.2 Buffer：二进制数据处理

Buffer是Node.js用于处理二进制数据的核心类。在网络编程、文件I/O、加密解密等场景中，Buffer都是不可或缺的。

**为什么需要Buffer？**

JavaScript在浏览器中主要处理字符串和JSON数据，但Node.js需要处理TCP流、文件、图片、音视频等二进制数据。Buffer就是为此设计的。

**Buffer创建与基本操作**

```javascript
// ============================================
// Buffer创建方法
// ============================================

// 1. Buffer.from() - 从已有数据创建
const buf1 = Buffer.from('Hello, Node.js!', 'utf8'); // 字符串
const buf2 = Buffer.from([72, 101, 108, 108, 111]);   // 字节数组
const buf3 = Buffer.from(buf1);                        // 从另一个Buffer复制

// 2. Buffer.alloc() - 分配指定大小的Buffer（初始化为0）
const buf4 = Buffer.alloc(10); // 10字节，初始值全为0

// 3. Buffer.allocUnsafe() - 分配未初始化的Buffer（性能更快，但可能有旧数据）
const buf5 = Buffer.allocUnsafe(10); // 10字节，内容未初始化
// 使用前需要手动填充，避免数据泄漏
buf5.fill(0);

// 4. Buffer.allocUnsafeSlow() - 更慢的allocUnsafe，不使用Buffer池

// ============================================
// Buffer与字符串转换
// ============================================

const str = '你好，Node.js';
const buf = Buffer.from(str, 'utf8');

console.log('字符串长度:', str.length);        // 7（字符数）
console.log('Buffer长度:', buf.length);        // 18（字节数，UTF-8中中文占3字节）

// 指定编码转换回字符串
const backToStr = buf.toString('utf8');
console.log('恢复的字符串:', backToStr);

// ============================================
// Buffer读写操作
// ============================================

const buf6 = Buffer.alloc(16);

// 写入字符串
buf6.write('Hello', 0);        // 从第0字节开始写入'Hello'
buf6.write(' ', 5);            // 写入空格
buf6.write('World', 6);        // 从第6字节开始写入'World'

console.log('写入内容:', buf6.toString('utf8', 0, 12)); // 'Hello World'

// 写入不同类型的数据
buf6.writeUInt8(255, 12);  // 无符号8位整数
buf6.writeUInt16BE(0xABCD, 13); // 大端序16位无符号整数
buf6.writeUInt32LE(0x12345678, 15); // 小端序32位无符号整数

// 读取数据
console.log('UInt8:', buf6.readUInt8(12));        // 255
console.log('UInt16BE:', buf6.readUInt16BE(13));  // 43981 (0xABCD)
console.log('UInt32LE:', buf6.readUInt32LE(15));  // 305419896 (0x12345678)

// ============================================
// Buffer切片与复制
// ============================================

const buf7 = Buffer.from('Hello, World!', 'utf8');

// 切片：创建原Buffer的部分引用（共享内存）
const slice = buf7.subarray(0, 5);
console.log('切片:', slice.toString()); // 'Hello'
slice[0] = 72; // 修改切片也会影响原Buffer！
console.log('原Buffer:', buf7.toString()); // 'ello, World!'

// 复制：创建完全独立的副本
const buf8 = Buffer.from('Hello, World!', 'utf8');
const copy = Buffer.alloc(5);
buf8.copy(copy, 0, 0, 5); // 从buf8的0-5字节复制到copy的0位置
copy[0] = 72; // 修改副本不影响原Buffer
console.log('原Buffer:', buf8.toString()); // 'Hello, World!'
console.log('副本:', copy.toString());    // 'Hello'

// ============================================
// Buffer比较与搜索
// ============================================

const bufA = Buffer.from('abc');
const bufB = Buffer.from('abd');
const bufC = Buffer.from('abc');

console.log('bufA vs bufB:', bufA.compare(bufB)); // -1（bufA < bufB）
console.log('bufA vs bufC:', bufA.compare(bufC)); // 0（相等）
console.log('bufB vs bufA:', bufB.compare(bufA)); // 1（bufB > bufA）

// 查找子Buffer的位置
const bufD = Buffer.from('Hello World, Hello Node');
const searchTerm = Buffer.from('Hello');
const position = bufD.indexOf(searchTerm);
console.log('第一次出现位置:', position); // 0

const lastPosition = bufD.lastIndexOf(searchTerm);
console.log('最后一次出现位置:', lastPosition); // 13

// includes判断是否包含
console.log('包含Hello?', bufD.includes(searchTerm)); // true
```

**实战：实现一个简易的图片处理工具**

```javascript
// 图片处理工具（演示Buffer在实际中的应用）
class ImageProcessor {
    constructor(buffer) {
        // 存储图片原始数据
        this.data = buffer;
        // 图片元数据
        this.metadata = this.parseHeader();
    }

    // 解析图片头部获取基本信息
    parseHeader() {
        if (this.data.length < 8) {
            throw new Error('文件太小，不是有效的图片');
        }

        // PNG文件签名：137 80 78 71 13 10 26 10
        const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
        // JPEG文件签名：FF D8 FF
        const jpegSignature = Buffer.from([0xFF, 0xD8, 0xFF]);

        // 检测文件类型
        if (this.data.slice(0, 8).equals(pngSignature)) {
            return {
                type: 'PNG',
                width: this.data.readUInt32BE(16),
                height: this.data.readUInt32BE(20),
                bitDepth: this.data[8],
                colorType: this.data[25]
            };
        } else if (this.data.slice(0, 3).equals(jpegSignature)) {
            // JPEG解析需要遍历段
            return this.parseJpegHeader();
        }

        throw new Error('不支持的图片格式');
    }

    parseJpegHeader() {
        let offset = 2; // 跳过SOI标记
        let width, height;

        while (offset < this.data.length) {
            if (this.data[offset] !== 0xFF) {
                offset++;
                continue;
            }

            const marker = this.data[offset + 1];

            // SOF0, SOF1, SOF2 标记包含尺寸信息
            if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
                height = this.data.readUInt16BE(offset + 5);
                width = this.data.readUInt16BE(offset + 7);
                break;
            }

            // 跳过段
            if (offset + 4 < this.data.length) {
                const segmentLength = this.data.readUInt16BE(offset + 2);
                offset += 2 + segmentLength;
            } else {
                break;
            }
        }

        return { type: 'JPEG', width, height };
    }

    // 灰度化处理
    toGrayscale() {
        if (this.metadata.type !== 'PNG' || this.metadata.colorType !== 6) {
            throw new Error('目前只支持PNG RGBA图片的灰度化');
        }

        // 创建一个副本用于处理
        const output = Buffer.from(this.data);
        const headerSize = 8 + 25 + 12; // 基础头 + IHDR + IEND

        // 跳过PNG头部，从实际图像数据开始处理
        let offset = headerSize;
        let maxOffset = this.data.length - 12; // 保留IEND和CRC

        while (offset < maxOffset) {
            const chunkLength = this.data.readUInt32BE(offset);
            const chunkType = this.data.slice(offset + 4, offset + 8).toString();

            if (chunkType === 'IDAT') {
                // 处理图像数据
                for (let i = offset + 8; i < offset + 8 + chunkLength - 1; i += 4) {
                    const r = output[i];
                    const g = output[i + 1];
                    const b = output[i + 2];
                    // 使用 luminosity 方法计算灰度值
                    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
                    output[i] = gray;     // R
                    output[i + 1] = gray; // G
                    output[i + 2] = gray; // B
                    // A 保持不变
                }
            }

            offset += 4 + 4 + chunkLength + 4; // Length + Type + Data + CRC
        }

        return new ImageProcessor(output);
    }

    // 获取图片缩略图（简化实现）
    thumbnail(size = 100) {
        const ratio = this.metadata.width / this.metadata.height;
        let thumbWidth, thumbHeight;

        if (ratio > 1) {
            thumbWidth = size;
            thumbHeight = Math.round(size / ratio);
        } else {
            thumbHeight = size;
            thumbWidth = Math.round(size * ratio);
        }

        // 这里返回元数据，实际实现需要图像处理库如sharp
        return {
            original: this.metadata,
            thumbnail: { width: thumbWidth, height: thumbHeight },
            data: this.data // 实际返回原始数据
        };
    }

    // 转换为Base64
    toBase64() {
        return this.data.toString('base64');
    }

    // 获取数据大小
    getSize() {
        return {
            bytes: this.data.length,
            kilobytes: (this.data.length / 1024).toFixed(2) + ' KB',
            megabytes: (this.data.length / (1024 * 1024)).toFixed(2) + ' MB'
        };
    }
}

// 使用示例
const fs = require('fs');

// 读取图片文件并处理（需要实际的PNG文件）
try {
    const imageBuffer = fs.readFileSync('./test.png');
    const processor = new ImageProcessor(imageBuffer);

    console.log('图片信息:', processor.metadata);
    console.log('文件大小:', processor.getSize());

    // 如果是PNG RGBA图片，进行灰度化
    if (processor.metadata.type === 'PNG') {
        const grayscale = processor.toGrayscale();
        fs.writeFileSync('./test_grayscale.png', grayscale.data);
        console.log('灰度化完成，已保存为 test_grayscale.png');
    }
} catch (err) {
    console.log('处理图片时出错:', err.message);
}
```

### 1.3 Stream：流式数据处理

Stream是Node.js处理大规模数据的关键抽象。无论是读取大文件、处理网络流还是构建管道，Stream都是最佳选择。

**为什么需要Stream？**

假设要读取一个10GB的视频文件：
- 如果使用`fs.readFile()`，需要10GB内存
- 如果使用Stream，每次只读取一小块（如64KB），内存占用极低

**四种Stream类型**

```javascript
const { Readable, Writable, Transform, Duplex } = require('stream');

// ============================================
// Readable Stream - 可读流
// ============================================

// 1. 流动模式（flowing）：数据自动流动，需要消费
const { createReadStream } = require('stream');

const readable = createReadStream('./large-file.txt', {
    encoding: 'utf8',
    highWaterMark: 64 * 1024, // 64KB，默认64KB
    start: 0,
    end: 1000 // 只读取前1000字节
});

// data事件：每读到一块数据就触发
readable.on('data', (chunk) => {
    console.log('收到数据块:', chunk.length, '字节');
});

// end事件：数据读取完毕
readable.on('end', () => {
    console.log('数据读取完毕');
});

// error事件：读取出错
readable.on('error', (err) => {
    console.error('读取错误:', err);
});

// 2. 暂停模式（paused）：需要手动调用read()
readable.pause(); // 暂停
readable.resume(); // 恢复
const chunk = readable.read(); // 手动读取

// ============================================
// Writable Stream - 可写流
// ============================================

const { createWriteStream } = require('stream');

const writable = createWriteStream('./output.txt', {
    encoding: 'utf8',
    highWaterMark: 16 * 1024, // 16KB
});

// write方法写入数据
writable.write('Hello, ');
writable.write('Node.js!\n');

// end方法结束写入，可选传入最后一块数据
writable.end('这是最后的数据\n');

// finish事件：写入完成
writable.on('finish', () => {
    console.log('所有数据已写入');
});

// ============================================
// Transform Stream - 转换流
// ============================================

// Transform是Duplex的子类，既可读又可写，并对数据进行转换
const { Transform } = require('stream');

// 简单的行计数器转换流
const lineCounter = new Transform({
    // objectMode允许处理对象而非Buffer
    objectMode: true,

    // transform方法：处理每个数据块
    transform(chunk, encoding, callback) {
        const lines = chunk.split('\n');
        for (const line of lines) {
            if (line) {
                this.push({ line, length: line.length });
            }
        }
        callback();
    }
});

// 使用示例
lineCounter.on('data', (obj) => {
    console.log(`行内容长度: ${obj.length}`);
});

lineCounter.write('第一行\n第二行\n第三行\n');
lineCounter.end();

// ============================================
// Duplex Stream - 双工流
// ============================================

const { Duplex } = require('stream');

// 既可读又可写的流，如TCP Socket
const net = require('net');

// 创建一个简单的Telnet客户端
const client = net.createConnection({ port: 23, host: 'example.com' }, () => {
    console.log('已连接到服务器');
    client.write('GET / HTTP/1.1\r\n\r\n');
});

client.setEncoding('utf8');
client.on('data', (data) => {
    console.log('收到数据:', data);
});
```

**手写ReadStream理解原理**

```javascript
// 手写一个简单的可读流，理解Stream原理
const { EventEmitter } = require('events');
const { Buffer } = require('buffer');

class MyReadable extends EventEmitter {
    constructor(options = {}) {
        super();

        // 读取选项
        this.encoding = options.encoding || null;
        this.highWaterMark = options.highWaterMark || 64 * 1024; // 默认64KB
        this.objectMode = options.objectMode || false;

        // 内部状态
        this._buffer = Buffer.alloc(this.highWaterMark);
        this._bufferLength = 0; // 缓冲区中有效数据长度
        this._position = 0;     // 读取位置
        this._source = null;    // 数据源
        this._reading = false; // 是否正在读取
        this._ended = false;    // 是否已结束
    }

    // 读取数据（从底层数据源读取到内部缓冲区）
    _read(size) {
        if (this._ended) return;

        this._reading = true;

        // 模拟从数据源读取数据
        // 实际Node.js中这里会调用底层的I/O操作
        const chunk = this._readFromSource(size);

        if (chunk === null) {
            // 没有更多数据
            this._ended = true;
            this.push(null); // null表示流结束
        } else {
            // 将读取的数据推入缓冲区
            const pushed = this.push(chunk);
            if (!pushed) {
                // 缓冲区已满，暂停读取
                this._reading = false;
            }
        }
    }

    // 从数据源读取（子类需要实现）
    _readFromSource(size) {
        throw new Error('_readFromSource must be implemented by subclass');
    }

    // 向消费者推送数据
    push(chunk) {
        if (chunk === null) {
            // 流结束
            this.emit('end');
            return false;
        }

        if (chunk === undefined) {
            return false;
        }

        // 如果处于对象模式，直接推送对象
        if (this.objectMode) {
            if (this._bufferLength > 0) {
                // 缓冲区还有数据
                this._needMore = true;
                return false;
            }
            this.emit('data', chunk);
            return true;
        }

        // 将chunk转换为Buffer
        const chunkBuffer = Buffer.isBuffer(chunk)
            ? chunk
            : Buffer.from(String(chunk), this.encoding || 'utf8');

        // 放入缓冲区
        if (this._bufferLength + chunkBuffer.length > this.highWaterMark) {
            // 缓冲区快满了
            this.emit('data', chunkBuffer);
            return false;
        }

        chunkBuffer.copy(this._buffer, this._bufferLength);
        this._bufferLength += chunkBuffer.length;

        this.emit('data', chunkBuffer);
        return true;
    }

    // 暂停读取
    pause() {
        this._flowing = false;
    }

    // 恢复读取
    resume() {
        this._flowing = true;
        this._read();
    }

    // 销毁流
    destroy(err) {
        this._ended = true;
        if (err) {
            this.emit('error', err);
        }
        this.emit('close');
    }
}

// 使用示例：创建一个从数组读取数据的流
class ArrayReader extends MyReadable {
    constructor(array) {
        super({ objectMode: true });
        this.array = array;
        this.index = 0;
    }

    _readFromSource(size) {
        if (this.index >= this.array.length) {
            return null; // 读取完毕
        }
        return this.array[this.index++];
    }
}

// 使用
const reader = new ArrayReader([1, 2, 3, 4, 5]);

reader.on('data', (item) => {
    console.log('读取到:', item);
    // 可以调用pause/resume控制流
    if (item === 3) {
        reader.pause();
        setTimeout(() => reader.resume(), 100);
    }
});

reader.on('end', () => {
    console.log('读取完成');
});
```

**Stream管道与组合**

```javascript
const { createReadStream, createWriteStream } = require('stream');
const { Transform, pipeline } = require('stream/promises');
const fs = require('fs');
const zlib = require('zlib');

// ============================================
// 管道操作 - pipe()
// ============================================

// 使用pipe连接可读流和可写流
// 经典用法：文件压缩
const readStream = createReadStream('./input.txt');
const gzipStream = zlib.createGzip();
const writeStream = createWriteStream('./output.txt.gz');

readStream
    .pipe(gzipStream)
    .pipe(writeStream);

writeStream.on('finish', () => {
    console.log('文件压缩完成');
});

// ============================================
// pipeline - 更安全的管道操作
// ============================================

// pipe不会捕获错误，可能导致文件描述符泄漏
// pipeline会正确处理错误并在完成或出错时自动清理
async function compressFile(input, output) {
    const inputStream = createReadStream(input);
    const gzipStream = zlib.createGzip();
    const outputStream = createWriteStream(output);

    try {
        await pipeline(
            inputStream,
            gzipStream,
            outputStream
        );
        console.log('压缩成功');
    } catch (err) {
        console.error('压缩失败:', err);
    }
}

// ============================================
// Transform流实现数据转换
// ============================================

// 大写转换流
class UpperCaseTransform extends Transform {
    constructor() {
        super();
    }

    _transform(chunk, encoding, callback) {
        // 将数据块转换为大写
        const upperCased = chunk.toString().toUpperCase();
        callback(null, upperCased);
    }
}

// JSON解析流
class JSONParseTransform extends Transform {
    constructor() {
        super({ writableObjectMode: true });
    }

    _transform(chunk, encoding, callback) {
        try {
            const obj = JSON.parse(chunk.toString());
            callback(null, obj);
        } catch (err) {
            callback(new Error('JSON解析错误: ' + err.message));
        }
    }
}

// CSV解析流
class CSVParser extends Transform {
    constructor(options = {}) {
        super({ objectMode: true });
        this.headers = options.headers || null;
        this.separator = options.separator || ',';
    }

    _transform(line, encoding, callback) {
        if (!line || line.trim() === '') {
            return callback();
        }

        const fields = line.split(this.separator);

        if (!this.headers) {
            // 第一行作为表头
            this.headers = fields;
            callback();
            return;
        }

        // 将行转换为对象
        const row = {};
        this.headers.forEach((header, index) => {
            row[header] = fields[index];
        });

        callback(null, row);
    }
}

// 使用示例：处理CSV文件
async function processCSV(inputFile) {
    const readStream = createReadStream(inputFile);
    const csvParser = new CSVParser();
    const writeStream = createWriteStream('./processed.json', { encoding: 'utf8' });

    let rowCount = 0;

    await pipeline(
        readStream,
        csvParser,
        new Transform({
            objectMode: true,
            transform(row, encoding, callback) {
                rowCount++;
                callback(null, JSON.stringify(row) + '\n');
            }
        }),
        writeStream
    );

    console.log(`处理了 ${rowCount} 行数据`);
}

// ============================================
// 实现可读流的背压机制
// ============================================

// 理解背压：当消费者处理速度慢于生产者时，通知生产者暂停
class BackpressureExample extends Readable {
    constructor(options) {
        super(options);
        this.maxRecords = 1000000;
        this.currentRecord = 0;
    }

    _read() {
        // 每次最多发送100条记录
        let sent = 0;
        while (sent < 100 && this.currentRecord < this.maxRecords) {
            const record = { id: this.currentRecord++, data: 'some data' };
            // this.push返回false表示缓冲区满了
            if (this.push(JSON.stringify(record) + '\n')) {
                sent++;
            } else {
                // 缓冲区已满，暂时停止读取
                // 当消费者消费数据后，flowing模式会自动恢复
                break;
            }
        }

        if (this.currentRecord >= this.maxRecords) {
            this.push(null); // 结束流
        }
    }
}
```

### 1.4 FileSystem：文件操作

Node.js的fs模块提供了强大的文件系统操作能力，包括同步、异步回调和Promise三种API。

**fs模块核心操作**

```javascript
const fs = require('fs');
const path = require('path');

// ============================================
// 文件读取
// ============================================

// 1. 异步回调API
fs.readFile('./example.txt', 'utf8', (err, data) => {
    if (err) throw err;
    console.log('异步读取:', data);
});

// 2. 同步API（阻塞，不推荐在生产环境使用）
const data = fs.readFileSync('./example.txt', 'utf8');
console.log('同步读取:', data);

// 3. Promise API（Node.js 10+）
const { readFile } = require('fs/promises');

async function readExample() {
    try {
        const data = await readFile('./example.txt', 'utf8');
        console.log('Promise读取:', data);
    } catch (err) {
        console.error('读取失败:', err);
    }
}

// ============================================
// 文件写入
// ============================================

// 写入文件（覆盖）
fs.writeFile('./output.txt', 'Hello, World!', 'utf8', (err) => {
    if (err) throw err;
    console.log('文件已保存');
});

// 追加到文件
fs.appendFile('./output.txt', '\n追加的内容', 'utf8', (err) => {
    if (err) throw err;
    console.log('内容已追加');
});

// ============================================
// 目录操作
// ============================================

// 创建目录
fs.mkdir('./new-dir', { recursive: true }, (err) => {
    if (err) throw err;
    console.log('目录创建成功');
});

// 读取目录
fs.readdir('./src', { withFileTypes: true }, (err, entries) => {
    if (err) throw err;

    entries.forEach(entry => {
        console.log(
            `${entry.isDirectory() ? '[DIR]' : '[FILE]'} ${entry.name}`
        );
    });
});

// 删除目录（必须是空目录）
fs.rmdir('./empty-dir', (err) => {
    if (err) throw err;
    console.log('目录已删除');
});

// ============================================
// 文件/目录状态
// ============================================

fs.stat('./example.txt', (err, stats) => {
    if (err) throw err;

    console.log('是否为文件:', stats.isFile());
    console.log('是否为目录:', stats.isDirectory());
    console.log('文件大小:', stats.size, '字节');
    console.log('创建时间:', stats.birthtime);
    console.log('修改时间:', stats.mtime);
    console.log('权限:', stats.mode.toString(8)); // 八进制
});

// ============================================
// 文件路径操作
// ============================================

const filePath = '/home/user/docs/report.pdf';

console.log('目录名:', path.dirname(filePath));  // /home/user/docs
console.log('文件名:', path.basename(filePath)); // report.pdf
console.log('扩展名:', path.extname(filePath));  // .pdf

// 无扩展名的文件名
console.log('无扩展名:', path.basename(filePath, path.extname(filePath))); // report

// 路径拼接
console.log('拼接路径:', path.join('/home/user', 'docs', 'report.pdf'));
// 输出: /home/user/docs/report.pdf

// 路径解析（转为绝对路径）
console.log('绝对路径:', path.resolve('report.pdf'));
// 输出: 当前工作目录/report.pdf

// ============================================
// 监听文件变化
// ============================================

// watch比watchFile更高效，但某些系统可能不完全支持
const watcher = fs.watch('./src', { recursive: true }, (eventType, filename) => {
    console.log(`文件 ${filename} 发生了 ${eventType} 事件`);

    if (eventType === 'rename') {
        // 文件被创建或删除
        fs.access(`./src/${filename}`, fs.constants.F_OK, (err) => {
            if (err) {
                console.log(`${filename} 被删除了`);
            } else {
                console.log(`${filename} 被创建/重命名了`);
            }
        });
    } else if (eventType === 'change') {
        console.log(`${filename} 内容被修改了`);
    }
});

// 停止监听
// watcher.close();

// ============================================
// 文件权限与所有权
// ============================================

// 修改文件权限
fs.chmod('./script.sh', 0o755, (err) => {
    if (err) throw err;
    console.log('权限已修改为 755');
});

// 修改文件所有者
// fs.chown('./file.txt', uid, gid, (err) => { ... });

// ============================================
// 硬链接与符号链接
// ============================================

// 创建硬链接（同一个文件的多个引用）
fs.link('./original.txt', './hardlink.txt', (err) => {
    if (err) throw err;
    console.log('硬链接创建成功');
});

// 创建符号链接（快捷方式）
fs.symlink('./original.txt', './symlink.txt', (err) => {
    if (err) throw err;
    console.log('符号链接创建成功');
});

// 读取符号链接的目标
fs.readlink('./symlink.txt', (err, linkString) => {
    if (err) throw err;
    console.log('符号链接指向:', linkString);
});
```

**实战：实现一个文件处理工具**

```javascript
// 文件处理工具实战
const fs = require('fs');
const path = require('path');
const { createReadStream, createWriteStream } = require('stream');
const { pipeline } = require('stream/promises');

class FileProcessor {
    constructor(inputPath, outputPath) {
        this.inputPath = inputPath;
        this.outputPath = outputPath;
        this.stats = null;
    }

    // 获取文件信息
    async getInfo() {
        const stats = await fs.promises.stat(this.inputPath);
        this.stats = stats;

        return {
            name: path.basename(this.inputPath),
            size: this.formatSize(stats.size),
            sizeBytes: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            isFile: stats.isFile(),
            isDirectory: stats.isDirectory(),
            extension: path.extname(this.inputPath)
        };
    }

    formatSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }

    // 复制文件（使用流，支持大文件）
    async copy() {
        const readStream = createReadStream(this.inputPath);
        const writeStream = createWriteStream(this.outputPath);

        await pipeline(readStream, writeStream);

        return this.outputPath;
    }

    // 按行读取文件
    async *readLines() {
        const content = await fs.promises.readFile(this.inputPath, 'utf8');
        const lines = content.split('\n');

        for (const line of lines) {
            yield line;
        }
    }

    // 搜索文件内容
    async search(keyword, options = {}) {
        const { caseSensitive = false, wholeWord = false } = options;
        const results = [];

        let lineNumber = 0;
        const content = await fs.promises.readFile(this.inputPath, 'utf8');
        const lines = content.split('\n');

        for (const line of lines) {
            lineNumber++;
            let searchLine = line;
            let searchKeyword = keyword;

            if (!caseSensitive) {
                searchLine = searchLine.toLowerCase();
                searchKeyword = searchKeyword.toLowerCase();
            }

            if (wholeWord) {
                const regex = new RegExp(`\\b${searchKeyword}\\b`);
                if (regex.test(searchLine)) {
                    results.push({ lineNumber, line, content: line.trim() });
                }
            } else {
                if (searchLine.includes(searchKeyword)) {
                    results.push({ lineNumber, line, content: line.trim() });
                }
            }
        }

        return results;
    }

    // 替换文件内容
    async replace(find, replace, options = {}) {
        const { caseSensitive = false, replaceAll = false } = options;

        let content = await fs.promises.readFile(this.inputPath, 'utf8');

        if (replaceAll) {
            if (caseSensitive) {
                content = content.split(find).join(replace);
            } else {
                const regex = new RegExp(this.escapeRegExp(find), 'gi');
                content = content.replace(regex, replace);
            }
        } else {
            if (caseSensitive) {
                const index = content.indexOf(find);
                if (index !== -1) {
                    content = content.slice(0, index) + replace + content.slice(index + find.length);
                }
            } else {
                const lowerContent = content.toLowerCase();
                const lowerFind = find.toLowerCase();
                const index = lowerContent.indexOf(lowerFind);
                if (index !== -1) {
                    content = content.slice(0, index) + replace + content.slice(index + find.length);
                }
            }
        }

        await fs.promises.writeFile(this.inputPath, content, 'utf8');

        return content;
    }

    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // 备份文件
    async backup(suffix = '.bak') {
        const backupPath = this.inputPath + suffix;
        await this.copy.call({ inputPath: this.inputPath, outputPath: backupPath }, fs.promises);
        return backupPath;
    }

    // 比较两个文件是否相同
    async compare(otherPath) {
        const stat1 = await fs.promises.stat(this.inputPath);
        const stat2 = await fs.promises.stat(otherPath);

        // 首先比较文件大小
        if (stat1.size !== stat2.size) {
            return false;
        }

        // 然后逐字节比较
        const bufferSize = 64 * 1024; // 64KB
        const stream1 = createReadStream(this.inputPath);
        const stream2 = createReadStream(otherPath);

        return new Promise((resolve) => {
            let position = 0;

            stream1.on('data', (chunk1) => {
                const chunk2 = createReadStream(otherPath, {
                    start: position,
                    end: position + chunk1.length - 1
                });

                chunk2.on('data', (data) => {
                    if (!chunk1.equals(data)) {
                        stream1.destroy();
                        stream2.destroy();
                        resolve(false);
                    }
                });

                position += chunk1.length;
            });

            stream1.on('end', () => {
                stream2.destroy();
                resolve(true);
            });

            stream1.on('error', () => resolve(false));
            stream2.on('error', () => resolve(false));
        });
    }
}

// 使用示例
async function main() {
    const processor = new FileProcessor('./input.txt', './output.txt');

    // 获取文件信息
    const info = await processor.getInfo();
    console.log('文件信息:', info);

    // 搜索关键词
    const results = await processor.search('Node.js', { caseSensitive: false });
    console.log('搜索结果:', results);

    // 替换内容
    await processor.replace('old', 'new', { replaceAll: true });
    console.log('替换完成');
}

main().catch(console.error);
```

### 1.5 Path：路径处理

Path模块提供了路径处理的工具函数，是Node.js中处理文件路径不可或缺的模块。

```javascript
const path = require('path');

// ============================================
// 基础路径操作
// ============================================

// 解析路径 - 将路径字符串拆分为各个组成部分
console.log(path.parse('/home/user/docs/file.txt'));
// 输出:
// {
//   root: '/',
//   dir: '/home/user/docs',
//   base: 'file.txt',
//   ext: '.txt',
//   name: 'file'
// }

// 格式化路径 - 将对象组合为路径字符串
console.log(path.format({
    dir: '/home/user/docs',
    base: 'file.txt'
}));
// 输出: /home/user/docs/file.txt

// 路径拼接
console.log(path.join('/home', 'user', 'docs', 'file.txt'));
// 输出: /home/user/docs/file.txt

// 规范化路径 - 解析.和..，移除多余分隔符
console.log(path.normalize('/home//user/../user/docs/'));
// 输出: /home/user/docs/

// 转绝对路径
console.log(path.resolve('file.txt'));
// 输出: /current/working/directory/file.txt

console.log(path.resolve('/home/user', 'docs', '../file.txt'));
// 输出: /home/user/file.txt

// ============================================
// 路径属性判断
// ============================================

// 判断是否为绝对路径
console.log(path.isAbsolute('/home/user'));  // true
console.log(path.isAbsolute('./user'));       // false
console.log(path.isAbsolute('docs/file.txt')); // false

// ============================================
// 路径组成部分提取
// ============================================

const filepath = '/home/user/docs/project/index.js';

console.log(path.dirname(filepath));  // /home/user/docs/project - 目录名
console.log(path.basename(filepath));  // index.js - 文件名
console.log(path.extname(filepath));   // .js - 扩展名

// 获取无扩展名的文件名
console.log(path.basename(filepath, path.extname(filepath))); // index

// ============================================
// 路径比较
// ============================================

// Windows vs POSIX
// POSIX: /home/user/file.txt
// Windows: C:\Users\user\file.txt

// 在Windows上默认使用反斜杠
console.log(path.sep); // \ 或 /

// 连接路径（跨平台安全）
console.log(path.join('home', 'user', 'docs'));
// POSIX: home/user/docs
// Windows: home\user\docs

// 解析相对路径
console.log(path.relative('/home/user/docs', '/home/user/images'));
// 输出: ../images

// ============================================
// 跨平台路径处理技巧
// ============================================

// 使用path.join而不是字符串拼接
// ❌ 错误：字符串拼接不能处理不同平台的路径分隔符
const badPath = '/home' + '/' + 'user' + '/' + 'file.txt';

// ✅ 正确：使用path.join
const goodPath = path.join('/home', 'user', 'file.txt');

// 始终使用path处理用户输入的路径
function sanitizePath(userInput) {
    // 移除危险的路径遍历字符
    const normalized = path.normalize(userInput);
    // 确保在允许的目录内
    const safePath = path.resolve(process.cwd(), normalized);
    return safePath;
}

// ============================================
// 常见场景实战
// ============================================

// 场景1：获取当前文件的目录
console.log(__dirname); // 当前文件所在目录
console.log(__filename); // 当前文件的完整路径

// 场景2：获取项目根目录
const projectRoot = path.resolve(__dirname, '..');
console.log(projectRoot);

// 场景3：处理文件上传路径
function getUploadPath(filename) {
    const uploadDir = path.join(process.cwd(), 'uploads');
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    // 创建按年月分组的目录
    const subDir = path.join(uploadDir, String(year), month);
    return path.join(subDir, filename);
}

// 场景4：获取模块的package.json路径
function findPackageJson(startPath) {
    let currentPath = startPath || __dirname;

    while (currentPath !== path.parse(currentPath).root) {
        const pkgPath = path.join(currentPath, 'package.json');
        try {
            require('fs').accessSync(pkgPath);
            return pkgPath;
        } catch {
            // package.json不存在，继续向上查找
        }
        currentPath = path.dirname(currentPath);
    }

    return null;
}
```

### 1.6 Crypto：加密解密

Crypto模块提供了加密、解密、哈希、签名等安全功能。

```javascript
const crypto = require('crypto');

// ============================================
// 哈希算法
// ============================================

// 创建哈希
function hash(data, algorithm = 'sha256') {
    return crypto.createHash(algorithm).update(data).digest('hex');
}

// MD5（不安全，仅用于演示）
console.log('MD5:', hash('Hello World', 'md5'));
// 输出: b10a8db164e0754105b7a99be72e3fe5

// SHA-256
console.log('SHA-256:', hash('Hello World', 'sha256'));
// 输出: a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e

// SHA-512
console.log('SHA-512:', hash('Hello World', 'sha512'));

// ============================================
// HMAC - 带密钥的哈希
// ============================================

function hmac(data, key, algorithm = 'sha256') {
    return crypto.createHmac(algorithm, key).update(data).digest('hex');
}

const secretKey = 'my-secret-key';
console.log('HMAC-SHA256:', hmac('Hello World', secretKey));

// ============================================
// 对称加密 - AES
// ============================================

// AES-256-CBC加密
const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32); // 256位密钥
const iv = crypto.randomBytes(16);   // 128位初始向量

function encrypt(text, key, iv) {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { encrypted, iv: iv.toString('hex') };
}

function decrypt(encryptedText, key, ivHex) {
    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(ivHex, 'hex'));
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// 测试加密解密
const plaintext = '敏感信息：123456789';
const { encrypted, iv: encryptedIv } = encrypt(plaintext, key, iv);
console.log('加密后:', encrypted);
console.log('IV:', encryptedIv);

const decrypted = decrypt(encrypted, key, encryptedIv);
console.log('解密后:', decrypted);

// ============================================
// 非对称加密 - RSA
// ============================================

// 生成RSA密钥对
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048, // 2048位密钥
    publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
    }
});

// 使用公钥加密
function rsaEncrypt(data, publicKey) {
    const buffer = Buffer.from(data, 'utf8');
    const encrypted = crypto.publicEncrypt(
        {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
        },
        buffer
    );
    return encrypted.toString('base64');
}

// 使用私钥解密
function rsaDecrypt(encryptedData, privateKey) {
    const buffer = Buffer.from(encryptedData, 'base64');
    const decrypted = crypto.privateDecrypt(
        {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
        },
        buffer
    );
    return decrypted.toString('utf8');
}

// 测试RSA加密解密
const rsaPlaintext = 'RSA加密的信息';
const rsaEncrypted = rsaEncrypt(rsaPlaintext, publicKey);
console.log('RSA加密后:', rsaEncrypted);

const rsaDecrypted = rsaDecrypt(rsaEncrypted, privateKey);
console.log('RSA解密后:', rsaDecrypted);

// ============================================
// 数字签名
// ============================================

function sign(data, privateKey) {
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(data);
    sign.end();
    return sign.sign(privateKey, 'base64');
}

function verify(data, signature, publicKey) {
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(data);
    verify.end();
    return verify.verify(publicKey, signature, 'base64');
}

// 测试签名验证
const message = '这是一条需要签名的重要消息';
const signature = sign(message, privateKey);
console.log('签名:', signature);

const isValid = verify(message, signature, publicKey);
console.log('签名验证:', isValid ? '有效' : '无效');

// ============================================
// 密钥派生 - PBKDF2
// ============================================

function deriveKey(password, salt, iterations = 100000, keylen = 32) {
    return crypto.pbkdf2Sync(password, salt, iterations, keylen, 'sha512');
}

// 生成盐
const salt = crypto.randomBytes(16);
// 从密码派生密钥
const derivedKey = deriveKey('my-password', salt);
console.log('派生密钥:', derivedKey.toString('hex'));

// ============================================
// 随机数据生成
// ============================================

// 生成随机字节
const randomBytes = crypto.randomBytes(16);
console.log('随机字节:', randomBytes.toString('hex'));

// 生成随机整数
const randomInt = crypto.randomInt(1, 100);
console.log('随机整数(1-100):', randomInt);

// 生成UUID v4
function generateUUID() {
    return crypto.randomUUID();
}
console.log('UUID:', generateUUID());
```

### 1.7 Zlib：压缩解压

Zlib模块提供了压缩和解压功能，常用于HTTP响应压缩和文件处理。

```javascript
const zlib = require('zlib');
const fs = require('fs');
const { pipeline } = require('stream/promises');

// ============================================
// 压缩与解压方法对照
// ============================================

// gzip压缩
const gzipCompress = zlib.createGzip({
    level: 9, // 压缩级别 1-9，默认6
    memLevel: 8 // 内存级别
});

// gunzip解压
const gunzipDecompress = zlib.createGunzip();

// deflate压缩（无header）
const deflateCompress = zlib.createDeflate();

// inflate解压
const inflateDecompress = zlib.createInflate();

// deflateRaw压缩（无zlib header）
const deflateRawCompress = zlib.createDeflateRaw();

// ============================================
// 字符串压缩
// ============================================

// 同步压缩
const original = '这是一段需要压缩的文本 '.repeat(1000);
const compressed = zlib.deflateSync(original);
const decompressed = zlib.inflateSync(compressed);

console.log('原始大小:', Buffer.byteLength(original, 'utf8'));
console.log('压缩后:', compressed.length);
console.log('压缩率:', (compressed.length / Buffer.byteLength(original, 'utf8') * 100).toFixed(2) + '%');

// Promise压缩
async function compressAsync(data) {
    return new Promise((resolve, reject) => {
        zlib.deflate(data, (err, buffer) => {
            if (err) reject(err);
            else resolve(buffer);
        });
    });
}

// ============================================
// 文件流压缩
// ============================================

async function compressFile(inputPath, outputPath) {
    const input = fs.createReadStream(inputPath);
    const output = fs.createWriteStream(outputPath + '.gz');
    const gzip = zlib.createGzip();

    await pipeline(input, gzip, output);
    console.log(`文件已压缩: ${outputPath}.gz`);
}

async function decompressFile(inputPath, outputPath) {
    const input = fs.createReadStream(inputPath);
    const output = fs.createWriteStream(outputPath);
    const gunzip = zlib.createGunzip();

    await pipeline(input, gunzip, output);
    console.log(`文件已解压: ${outputPath}`);
}

// ============================================
// HTTP压缩（常见用法）
// ============================================

const http = require('http');
const { createGzip } = zlib;

const server = http.createServer((req, res) => {
    // 检查客户端支持的压缩算法
    const acceptEncoding = req.headers['accept-encoding'] || '';

    if (acceptEncoding.includes('gzip')) {
        // 发送压缩内容
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Content-Type', 'text/plain');

        const content = '这是要发送的内容...'.repeat(100);
        const gzip = createGzip();

        gzip.pipe(res);
        gzip.write(content);
        gzip.end();
    } else {
        // 发送未压缩内容
        res.setHeader('Content-Type', 'text/plain');
        res.end('这是要发送的内容...'.repeat(100));
    }
});

// ============================================
// Brotli压缩（Node.js 11+）
// ============================================

const { createBrotliCompress, createBrotliDecompress } = require('zlib');

const brotliCompress = createBrotliCompress({
    params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: 11, // 质量 0-11
        [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT
    }
});

async function brotliCompressAsync(data) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        const brotli = createBrotliCompress();

        brotli.on('data', chunk => chunks.push(chunk));
        brotli.on('end', () => resolve(Buffer.concat(chunks)));
        brotli.on('error', reject);

        brotli.write(data);
        brotli.end();
    });
}
```

### 1.8 实战：文件处理工具

整合所有核心模块，实现一个综合的文件处理工具。

```javascript
// 综合文件处理工具
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const { EventEmitter } = require('events');
const { pipeline } = require('stream/promises');
const { createReadStream, createWriteStream } = require('stream');

class FileProcessor extends EventEmitter {
    constructor(inputPath) {
        super();
        this.inputPath = inputPath;
        this.stats = null;
        this.hash = null;
    }

    // 加载文件信息
    async load() {
        this.stats = await fs.promises.stat(this.inputPath);
        return this;
    }

    // 计算文件哈希
    async calculateHash(algorithm = 'sha256') {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash(algorithm);
            const stream = createReadStream(this.inputPath);

            stream.on('data', chunk => hash.update(chunk));
            stream.on('end', () => {
                this.hash = hash.digest('hex');
                resolve(this.hash);
            });
            stream.on('error', reject);
        });
    }

    // 压缩文件
    async compress(outputPath, algorithm = 'gzip') {
        const compress =
            algorithm === 'gzip' ? zlib.createGzip() :
            algorithm === 'deflate' ? zlib.createDeflate() :
            zlib.createBrotliCompress();

        const input = createReadStream(this.inputPath);
        const output = createWriteStream(outputPath);

        this.emit('start', { operation: 'compress', algorithm });

        await pipeline(input, compress, output);

        this.emit('complete', { operation: 'compress', output: outputPath });
        return outputPath;
    }

    // 解压文件
    async decompress(outputPath, algorithm = 'gzip') {
        const decompress =
            algorithm === 'gzip' ? zlib.createGunzip() :
            algorithm === 'deflate' ? zlib.createInflate() :
            zlib.createBrotliDecompress();

        const input = createReadStream(this.inputPath);
        const output = createWriteStream(outputPath);

        this.emit('start', { operation: 'decompress', algorithm });

        await pipeline(input, decompress, output);

        this.emit('complete', { operation: 'decompress', output: outputPath });
        return outputPath;
    }

    // 分块处理大文件
    async processChunks(chunkSize = 64 * 1024, processor) {
        const buffer = await fs.promises.readFile(this.inputPath);
        const chunks = [];

        for (let i = 0; i < buffer.length; i += chunkSize) {
            const chunk = buffer.slice(i, i + chunkSize);
            chunks.push(await processor(chunk, Math.floor(i / chunkSize)));
        }

        return chunks;
    }

    // 加密文件
    async encrypt(outputPath, password) {
        const salt = crypto.randomBytes(16);
        const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
        const iv = crypto.randomBytes(16);

        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        const input = createReadStream(this.inputPath);
        const output = createWriteStream(outputPath);

        // 写入盐和IV（用于解密）
        const header = Buffer.concat([salt, iv]);

        return new Promise((resolve, reject) => {
            output.write(header, (err) => {
                if (err) return reject(err);

                pipeline(input, cipher, output)
                    .then(() => resolve(outputPath))
                    .catch(reject);
            });
        });
    }

    // 解密文件
    async decrypt(outputPath, password) {
        const fileBuffer = await fs.promises.readFile(this.inputPath);

        // 读取盐和IV
        const salt = fileBuffer.slice(0, 16);
        const iv = fileBuffer.slice(16, 32);
        const encryptedData = fileBuffer.slice(48);

        const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');

        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        const decrypted = Buffer.concat([
            decipher.update(encryptedData),
            decipher.final()
        ]);

        await fs.promises.writeFile(outputPath, decrypted);
        return outputPath;
    }

    // 文件比较
    async compare(otherPath) {
        const [hash1, hash2] = await Promise.all([
            this.calculateHash(),
            new FileProcessor(otherPath).calculateHash()
        ]);

        return hash1 === hash2;
    }

    // 获取文件类型
    async getFileType() {
        const buffer = await fs.promises.readFile(this.inputPath, { length: 8 });

        // 检查文件签名
        const signatures = {
            'png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
            'jpg': [0xFF, 0xD8, 0xFF],
            'gif': [0x47, 0x49, 0x46],
            'pdf': [0x25, 0x50, 0x44, 0x46],
            'zip': [0x50, 0x4B, 0x03, 0x04]
        };

        for (const [type, sig] of Object.entries(signatures)) {
            if (sig.every((byte, i) => buffer[i] === byte)) {
                return type;
            }
        }

        return 'unknown';
    }
}

// 使用示例
async function main() {
    const processor = new FileProcessor('./test.txt');

    // 监听事件
    processor.on('start', ({ operation, algorithm }) => {
        console.log(`开始${operation}，算法: ${algorithm}`);
    });

    processor.on('complete', ({ operation, output }) => {
        console.log(`${operation}完成: ${output}`);
    });

    // 加载文件
    await processor.load();

    // 计算哈希
    const hash = await processor.calculateHash('sha256');
    console.log('SHA-256:', hash);

    // 获取文件类型
    const type = await processor.getFileType();
    console.log('文件类型:', type);

    // 压缩文件
    await processor.compress('./test.txt.gz', 'gzip');

    // 加密文件
    await processor.encrypt('./test.enc', 'my-password');
}

main().catch(console.error);
```

---

## 2. 事件循环深入

事件循环是Node.js异步编程的核心，理解它对于编写高效的Node.js应用至关重要。

### 2.1 libuv工作原理

libuv是Node.js底层的跨平台异步I/O库，它负责处理事件循环、线程池、文件系统操作等。

**libuv架构图**

```
┌─────────────────────────────────────────────────────────────┐
│                      JavaScript 层                          │
│                     (V8引擎 + Node.js)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Node.js C++ bindings                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         libuv                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   事件循环 (Event Loop)               │    │
│  │  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐│    │
│  │  │timers│→ │pending│→ │idle │→ │ poll │→ │ check│→ │close││    │
│  │  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘│    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              线程池 (Thread Pool)                    │    │
│  │     ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐     │    │
│  │     │ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │ │ 6 │ │ 7 │ ... │    │
│  │     └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
    ┌───────────┐       ┌───────────┐       ┌───────────┐
    │   文件系统 │       │  DNS查询  │       │  其他操作  │
    │  (fs模块)  │       │ (dns模块) │       │ (crypto等) │
    └───────────┘       └───────────┘       └───────────┘
```

### 2.2 六个阶段详解

```javascript
// Node.js事件循环的六个阶段

// ============================================
// 阶段1: timers（定时器阶段）
// ============================================
// 执行setTimeout()和setInterval()设定的回调
// 这些定时器在达到指定时间后执行

setTimeout(() => {
    console.log('setTimeout 回调');
}, 0);

// 实际上setTimeout即使设定为0，也有4ms左右的延迟
// 因为timers阶段有最少4ms的延迟

// ============================================
// 阶段2: pending callbacks（待定回调阶段）
// ============================================
// 执行一些系统操作相关的回调，如TCP错误

// ============================================
// 阶段3: idle, prepare（空闲/准备阶段）
// ============================================
// libuv内部使用

// ============================================
// 阶段4: poll（轮询阶段）
// ============================================
// 获取新的I/O事件
// 如果有可执行的回调，执行它们
// 如果没有，事件循环可能阻塞等待

// 重要：如果poll阶段队列为空：
// - 如果有setImmediate设定的回调，执行它们
// - 否则，等待新的I/O事件

// ============================================
// 阶段5: check（检查阶段）
// ============================================
// 执行setImmediate()设定的回调

setImmediate(() => {
    console.log('setImmediate 回调');
});

// ============================================
// 阶段6: close callbacks（关闭回调阶段）
// ============================================
// 执行关闭事件相关的回调
// 如socket.on('close', ...)

const net = require('net');
const server = net.createServer(() => {});

server.close(() => {
    console.log('服务器已关闭');
});
```

**setTimeout vs setImmediate**

这两个经常被混淆，它们的主要区别在于：

```javascript
// 案例1: 在主模块中执行
// setTimeout/setImmediate执行顺序不确定，取决于进程性能
setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));
// 可能输出:
// timeout
// immediate
// 或:
// immediate
// timeout

// 案例2: 在I/O回调中执行
// setImmediate总是先于setTimeout执行
const fs = require('fs');

fs.readFile(__filename, () => {
    setTimeout(() => console.log('timeout'), 0);
    setImmediate(() => console.log('immediate'));
    // 总是输出:
    // immediate
    // timeout
});

// 原因：I/O回调在poll阶段执行完毕后，
// poll队列为空，事件循环进入check阶段执行setImmediate
// 然后进入下一个循环的timers阶段执行setTimeout
```

### 2.3 微任务与宏任务

```javascript
// Node.js中的微任务和宏任务

// ============================================
// 宏任务 (Macrotasks)
// ============================================
// - setTimeout
// - setInterval
// - setImmediate
// - I/O操作
// - UI渲染（在浏览器中）

// ============================================
// 微任务 (Microtasks)
// ============================================
// - Promise.then().catch().finally()
// - process.nextTick()

// ============================================
// 执行顺序
// ============================================

console.log('1. 主线程开始');

setTimeout(() => console.log('2. setTimeout'), 0);

Promise.resolve()
    .then(() => console.log('3. Promise.then'))
    .then(() => console.log('4. Promise.then (链式)'));

process.nextTick(() => console.log('5. process.nextTick'));

// 输出顺序:
// 1. 主线程开始
// 5. process.nextTick      <- 微任务，最先执行
// 3. Promise.then           <- 微任务
// 4. Promise.then (链式)    <- 微任务链
// 2. setTimeout            <- 宏任务，最后执行

// ============================================
// nextTick vs setImmediate
// ============================================

// process.nextTick在当前操作完成后立即执行，在微任务之前
// setImmediate在事件循环的下一个阶段执行

process.nextTick(() => {
    console.log('nextTick 在微任务队列最前面');
});

Promise.resolve().then(() => {
    console.log('Promise.then 在微任务队列中');
});

// 输出:
// nextTick 在微任务队列最前面
// Promise.then 在微任务队列中

// ============================================
// 深入理解nextTick
// ============================================

function processStream() {
    // 使用nextTick确保在每个数据块处理后让出执行权
    let index = 0;

    const process = () => {
        while (index < 1000) {
            index++;
            // 处理数据...

            // 在每1000个数据后让出执行权
            if (index % 1000 === 0) {
                process.nextTick(process);
                break;
            }
        }
    };

    process();
}
```

**完整事件循环流程图**

```
┌────────────────────────────┐
│         启动事件循环        │
└────────────────────────────┘
              │
              ▼
┌────────────────────────────┐
│    执行主模块同步代码       │
│    (包括require等)          │
└────────────────────────────┘
              │
              ▼
    ┌─────────────────┐
    │   微任务队列     │
    │  (nextTick,     │
    │   Promise)      │
    └────────┬────────┘
              │
              ▼
    ┌─────────────────┐
    │    timers阶段    │ ← setTimeout, setInterval回调
    └────────┬────────┘
              │
              ▼
    ┌─────────────────┐
    │ pending callbacks│
    └────────┬────────┘
              │
              ▼
    ┌─────────────────┐
    │ idle, prepare    │
    └────────┬────────┘
              │
              ▼
    ┌─────────────────┐
    │   poll阶段       │ ← I/O回调, setImmediate检查
    │   (轮询I/O)      │
    └────────┬────────┘
              │
              ├──────────────────┐
              │                  │
              ▼                  ▼
    ┌─────────────────┐  ┌─────────────────┐
    │ 有可执行的回调   │  │ 没有回调，队列空  │
    └────────┬────────┘  └────────┬────────┘
              │                  │
              ▼                  ▼
    ┌─────────────────┐  ┌─────────────────┐
    │ 执行poll队列回调 │  │ 是否有setImmediate│
    └────────┬────────┘  └────────┬────────┘
              │                  │
              │                  ▼
              │         ┌─────────────────┐
              │         │    check阶段     │ ← setImmediate回调
              │         └────────┬────────┘
              │                  │
              └──────────────────┘
              │
              ▼
    ┌─────────────────┐
    │  close callbacks │ ← socket.on('close')等
    └────────┬────────┘
              │
              ▼
    ┌─────────────────┐
    │   退出事件循环？  │
    └────────┬────────┘
              │
              ▼
    ┌─────────────────┐
    │      是         │
    └────────┬────────┘
              │
              ▼
    ┌────────────────────────────┐
    │         事件循环结束         │
    └────────────────────────────┘
```

### 2.4 事件循环面试题解析

```javascript
// 面试题1: 基础执行顺序
console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve().then(() => console.log('3'));

process.nextTick(() => console.log('4'));

console.log('5');

// 答案: 1, 5, 4, 3, 2
// 解析:
// 1. 先执行同步代码: 1, 5
// 2. 然后执行微任务: 4 (nextTick), 3 (Promise)
// 3. 最后执行宏任务: 2 (setTimeout)

// ============================================

// 面试题2: setTimeout设置多次
console.log('start');

setTimeout(() => console.log('setTimeout 1'), 100);
setTimeout(() => console.log('setTimeout 2'), 50);
setTimeout(() => console.log('setTimeout 3'), 0);

console.log('end');

// 答案: start, end, setTimeout 3, setTimeout 2, setTimeout 1
// 解析: 按超时时间排序，越早超时的越先执行

// ============================================

// 面试题3: async/await与Promise
async function async1() {
    console.log('async1 start');
    await async2();
    console.log('async1 end');
}

async function async2() {
    console.log('async2');
}

console.log('script start');

setTimeout(() => console.log('setTimeout'), 0);

Promise.resolve().then(() => console.log('Promise1'));

async1().then(() => console.log('async1.then'));

Promise.resolve().then(() => console.log('Promise2'));

console.log('script end');

// 答案:
// script start
// async1 start
// async2
// script end
// Promise1
// async1 end
// async1.then
// Promise2
// setTimeout

// 解析:
// 1. 先执行同步代码
// 2. async2的await后面的代码会await后立即执行process.nextTick
// 3. Promise1先于async1 end因为await async2()相当于Promise.resolve(async2()).then()
// 4. async1.then是独立的Promise回调

// ============================================

// 面试题4: 复杂嵌套
setTimeout(() => console.log('timeout 1'), 0);

setImmediate(() => console.log('immediate 1'));

Promise.resolve().then(() => {
    console.log('promise then 1');
    setTimeout(() => console.log('timeout in promise'), 0);
    Promise.resolve().then(() => console.log('promise then in promise'));
});

process.nextTick(() => console.log('nextTick'));

console.log('sync code');

// 答案:
// sync code
// nextTick
// promise then 1
// promise then in promise
// timeout 1
// immediate 1
// timeout in promise

// ============================================

// 面试题5: Node.js循环输出
function test() {
    console.log('test start');

    setTimeout(() => {
        console.log('setTimeout');
        Promise.resolve().then(() => console.log('promise in timeout'));
    }, 0);

    new Promise((resolve) => {
        console.log('promise executor');
        resolve();
    }).then(() => console.log('promise then'));

    setImmediate(() => console.log('setImmediate'));

    process.nextTick(() => console.log('nextTick'));

    console.log('test end');
}

test();

// 答案:
// test start
// promise executor
// test end
// nextTick
// promise then
// setTimeout（或setImmediate，取决于定时器精度）
// setImmediate
// promise in timeout

// 解析: 在timers阶段，setTimeout和setImmediate都可能执行
// 取决于系统的定时器精度
```

### 2.5 我的思考：理解事件循环是进阶的关键

```javascript
// 理解事件循环的最佳实践

// ============================================
// 1. 不要阻塞事件循环
// ============================================

// ❌ 错误：同步阻塞操作
function badProcess() {
    const data = fs.readFileSync('./large-file.txt'); // 阻塞！
    return process(data);
}

// ✅ 正确：异步非阻塞
async function goodProcess() {
    const data = await fs.promises.readFile('./large-file.txt');
    return process(data);
}

// ============================================
// 2. 合理使用nextTick和setImmediate
// ============================================

// nextTick: 用于确保某个操作在I/O事件之前执行
// 场景：需要立即在同步代码之后、异步之前执行清理
class ResourceManager {
    constructor() {
        this.resources = [];
        process.nextTick(() => this.cleanup());
    }

    cleanup() {
        console.log('清理资源');
        this.resources = [];
    }
}

// setImmediate: 用于将耗时操作延迟到下一个事件循环
// 场景：需要让出执行权，避免阻塞
async function processLargeArray(arr) {
    const results = [];

    for (let i = 0; i < arr.length; i++) {
        results.push(processItem(arr[i]));

        // 每1000个元素让出一次执行权
        if (i % 1000 === 0) {
            await new Promise(resolve => setImmediate(resolve));
        }
    }

    return results;
}

// ============================================
// 3. 理解微任务的执行时机
// ============================================

// 微任务在每个阶段的末尾都会被清空
// 但process.nextTick的优先级高于Promise

Promise.resolve().then(() => console.log('Promise'));
process.nextTick(() => console.log('nextTick'));
// nextTick 先执行

// ============================================
// 4. 调试事件循环问题
// ============================================

// 使用--trace-event标志运行Node.js
// node --trace-event app.js

// 使用第三方工具分析
// npm install --save-dev why-is-node-running

// 简单的事件循环监控
const start = Date.now();
let lastCheck = start;

setInterval(() => {
    const now = Date.now();
    const elapsed = now - lastCheck;
    if (elapsed > 100) {
        console.warn(`警告: 事件循环延迟 ${elapsed}ms`);
    }
    lastCheck = now;
}, 100);
```

---

## 3. 模块系统

Node.js的模块系统是其最重要的特性之一，它使得代码组织、复用和共享变得优雅。

### 3.1 CommonJS模块系统

CommonJS是Node.js默认的模块系统，使用require()和module.exports。

```javascript
// ============================================
// 导出方式
// ============================================

// 方式1: module.exports赋值
function MyClass() {
    this.name = 'MyClass';
}
module.exports = MyClass;

// 方式2: exports对象属性（不能直接赋值exports）
exports.myFunction = function() { /* ... */ };
exports.myConstant = 42;

// 方式3: 同时使用
function MyClass() {}
MyClass.prototype.greet = function() { return 'Hello'; };
module.exports = MyClass;
module.exports.default = MyClass;

// ============================================
// require行为
// ============================================

// 核心模块（内置）
const fs = require('fs');
const path = require('path');
const http = require('http');

// 文件模块（相对/绝对路径）
const myModule = require('./myModule');        // .js
const myModule2 = require('./myModule.json');  // .json
const myModule3 = require('./myModule');       // 查找myModule.js, .json, .node

// node_modules包
const express = require('express');
const lodash = require('lodash');

// ============================================
// 模块缓存
// ============================================

// 第一次require会执行模块代码并缓存
const a = require('./module');
const b = require('./module');
console.log(a === b); // true，指向同一个对象

// 清除缓存
delete require.cache[require.resolve('./module')];

// ============================================
// 模块加载顺序
// ============================================

// 假设 require('lodash')
// Node.js按以下顺序查找：

// 1. 内置核心模块 (fs, path, http等)
// 2. 文件模块
//    - 绝对路径: /path/to/module
//    - 相对路径: ./module 或 ../module
// 3. node_modules
//    - ./node_modules/lodash
//    - ../node_modules/lodash
//    - ../../node_modules/lodash
//    - 直到找到或到达根目录

// ============================================
// 手写require函数理解原理
// ============================================

function myRequire(modulePath) {
    // 1. 解析模块路径为绝对路径
    const resolvedPath = require.resolve(modulePath);

    // 2. 检查缓存
    if (require.cache[resolvedPath]) {
        return require.cache[resolvedPath].exports;
    }

    // 3. 创建模块对象
    const module = {
        id: resolvedPath,
        exports: {},
        loaded: false
    };

    // 4. 加入缓存
    require.cache[resolvedPath] = module;

    // 5. 加载模块
    try {
        // 使用Function构造函数执行模块代码
        // 这样可以让this指向module.exports
        const wrappedCode = `
            (function(module, exports, require, __dirname, __filename) {
                ${fs.readFileSync(resolvedPath, 'utf8')}
            })
        `;

        const fn = eval(wrappedCode);
        fn(module, module.exports, myRequire,
           path.dirname(resolvedPath),
           resolvedPath);

        // 6. 标记为已加载
        module.loaded = true;

    } catch (err) {
        delete require.cache[resolvedPath];
        throw err;
    }

    // 7. 返回导出对象
    return module.exports;
}
```

### 3.2 ESM模块系统

ES Modules (ESM) 是ES6引入的标准模块系统，Node.js从v14开始支持。

```javascript
// ============================================
// ESM导出
// ============================================

// 命名导出
export const name = 'value';
export function myFunc() { /* ... */ };
export class MyClass { /* ... */ };

// 默认导出
export default function() { /* ... */ };

// 批量导出
const a = 1, b = 2, c = 3;
export { a, b, c };

// 导出时重命名
export { foo as bar };
export { foo as default };

// ============================================
// ESM导入
// ============================================

// 命名导入
import { name, myFunc } from './module.js';

// 导入时重命名
import { name as myName } from './module.js';

// 默认导入
import myDefault from './module.js';

// 命名 + 默认
import myDefault, { name, myFunc } from './module.js';

// 命名空间导入（所有导出作为对象属性）
import * as myModule from './module.js';

// 空导入（只执行模块代码，不导入任何值）
import './module.js';

// 动态导入
const module = await import('./module.js');

// ============================================
// ESM vs CommonJS
// ============================================

// CommonJS是运行时同步加载
// ESM是编译时静态分析

// CommonJS
const fs = require('fs');
module.exports = { /* ... */ };

// ESM
import fs from 'fs';
export default { /* ... */ };

// ============================================
// ESM注意事项
// ============================================

// 1. 必须使用完整文件名
// ❌
import myModule from './myModule';  // 错误
// ✅
import myModule from './myModule.js';

// 2. 不能使用__dirname和__filename
// ESM中等价写法
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 3. 不能使用require（但可以使用import()）
// ✅ 动态导入
const module = await import('./module.js');

// 4. ESM总是以严格模式运行
```

### 3.3 模块解析

```javascript
// Node.js模块解析算法

// ============================================
// 解析步骤
// ============================================

// 当执行 require('./utils') 时，Node.js按以下步骤查找：

// 步骤1: 如果是核心模块（fs, path等），直接返回

// 步骤2: 如果以 ./ 或 ../ 或 / 开头，按文件模块处理

// 步骤3: 否则作为node_modules包处理

// ============================================
// 文件模块解析
// ============================================

// 假设当前文件是 /home/user/project/index.js
// require('./utils')

// Node.js按顺序查找：
// 1. /home/user/project/utils.js
// 2. /home/user/project/utils.json
// 3. /home/user/project/utils.node
// 4. /home/user/project/utils/index.js
// 5. /home/user/project/utils/package.json (main字段)

// ============================================
// node_modules解析
// ============================================

// require('lodash')

// Node.js从当前文件所在目录向上查找node_modules:
// 1. /home/user/project/node_modules/lodash
// 2. /home/user/node_modules/lodash
// 3. /home/node_modules/lodash
// 4. /node_modules/lodash

// ============================================
// package.json的作用
// ============================================

// utils/package.json
{
    "name": "utils",
    "version": "1.0.0",
    "main": "lib/index.js",     // 入口文件
    "exports": {                // 条件导出（Node.js 12+）
        ".": "./lib/index.js",
        "./sub": "./lib/sub.js"
    }
}

// ============================================
// 使用require.resolve查看解析结果
// ============================================

console.log(require.resolve('./myModule'));
// 输出: /home/user/project/myModule.js

console.log(require.resolve('lodash'));
// 输出: /home/user/project/node_modules/lodash/index.js

// ============================================
// 解析算法示例
// ============================================

class ModuleResolver {
    static resolve(modulePath, fromFile) {
        const path = require('path');

        // 核心模块直接返回
        if (this.isCoreModule(modulePath)) {
            return { type: 'core', path: modulePath };
        }

        // 相对/绝对路径
        if (modulePath.startsWith('./') ||
            modulePath.startsWith('../') ||
            modulePath.startsWith('/')) {
            return this.resolveFileModule(modulePath, fromFile);
        }

        // node_modules
        return this.resolveNodeModule(modulePath, fromFile);
    }

    static isCoreModule(name) {
        const coreModules = ['fs', 'path', 'http', 'https', 'crypto', 'os', 'url'];
        return coreModules.includes(name);
    }

    static resolveFileModule(modulePath, fromFile) {
        const path = require('path');
        const fs = require('fs');

        // 转为绝对路径
        let absPath = path.isAbsolute(modulePath)
            ? modulePath
            : path.resolve(path.dirname(fromFile), modulePath);

        // 尝试各种扩展名
        const extensions = ['.js', '.json', '.node', '/index.js', '/package.json'];
        for (const ext of extensions) {
            const fullPath = absPath + ext;
            if (fs.existsSync(fullPath)) {
                return { type: 'file', path: fullPath };
            }
        }

        throw new Error(`Cannot find module ${modulePath}`);
    }

    static resolveNodeModule(moduleName, fromFile) {
        const path = require('path');
        const fs = require('fs');

        let dir = path.dirname(fromFile);

        // 向上遍历查找node_modules
        while (dir !== path.dirname(dir)) {
            const modulePath = path.join(dir, 'node_modules', moduleName);
            if (fs.existsSync(modulePath)) {
                return this.resolveFileModule(modulePath, fromFile);
            }
            dir = path.dirname(dir);
        }

        throw new Error(`Cannot find module ${moduleName}`);
    }
}
```

### 3.4 循环引用

```javascript
// ============================================
// 循环引用问题
// ============================================

// a.js
const b = require('./b');
console.log('a.js: 在require b之后');
function a() {
    console.log('a函数');
}
module.exports = { a, b };

// b.js
const a = require('./a');
console.log('b.js: 在require a之后');
function b() {
    console.log('b函数');
}
module.exports = { b, a };

// main.js
const a = require('./a');
console.log('main.js: 加载完成');
a.a();

// 执行结果:
// b.js: 在require a之后
// a.js: 在require b之后
// main.js: 加载完成
// a函数

// ============================================
// 循环引用的原理
// ============================================

// 当a.js require b.js时：
// 1. 创建a模块对象 { exports: {} }
// 2. 开始执行a.js的代码
// 3. a.js require b.js
// 4. 创建b模块对象 { exports: {} }
// 5. 开始执行b.js的代码
// 6. b.js require a.js
// 7. 此时a模块已存在，返回a.exports（可能尚未完全初始化）
// 8. b.js继续执行
// 9. b.js执行完毕，b.exports填充完整
// 10. a.js继续执行（从require b.js之后开始）
// 11. a.js执行完毕，a.exports填充完整

// ============================================
// 如何处理循环引用
// ============================================

// 方法1: 延迟导入（在函数内部require）
// a.js
function a() {
    const b = require('./b');
    return b + ' from a';
}
module.exports = { a };

// b.js
function b() {
    const a = require('./a');
    return a + ' from b';
}
module.exports = { b };

// 方法2: 只导出接口，不导出具体实现
// a.js
const b = require('./b');
function test() {
    // 使用b的某些功能
}
module.exports = { test };

// b.js
const a = require('./a');
function other() {
    // 不依赖a的某些状态
}
module.exports = { other };

// 方法3: 重新设计模块结构
// 将循环依赖的部分提取到第三个模块

// ============================================
// ESM循环引用
// ============================================

// a.mjs
import { b } from './b.mjs';
console.log('a.mjs: 在import b之后');
export function a() {
    console.log('a函数');
}
export { b };

// b.mjs
import { a } from './a.mjs';
console.log('b.mjs: 在import a之后');
export function b() {
    console.log('b函数');
}

// ESM的循环引用与CommonJS类似，但要注意：
// 在import时，被导入的值可能尚未初始化
// 应该将import放在函数内部或模块末尾
```

### 3.5 实战：手写一个模块加载器

```javascript
// 手写模块加载器，理解模块系统原理

const fs = require('fs');
const path = require('path');
const vm = require('vm');

class Module {
    constructor(id, parent) {
        this.id = id;              // 模块路径
        this.parent = parent;      // 父模块
        this.exports = {};        // 导出对象
        this.loaded = false;       // 是否已加载
        this.loading = false;     // 正在加载中（防止循环引用）
    }
}

class ModuleLoader {
    constructor() {
        // 模块缓存
        this.cache = {};

        // 模块扩展名优先级
        this.extensions = ['.js', '.json', '.node'];

        // 模拟node_modules搜索路径
        this.paths = ModuleLoader._resolveNodePaths(process.cwd());
    }

    // 解析node_modules搜索路径
    static _resolveNodePaths(from) {
        const paths = [];
        let dir = path.dirname(from);

        while (dir !== path.dirname(dir)) {
            paths.push(path.join(dir, 'node_modules'));
            dir = path.dirname(dir);
        }

        // 添加全局npm路径
        if (process.env.NPM_CONFIG_GLOBAL) {
            paths.push(process.env.NPM_CONFIG_GLOBAL);
        }

        return paths;
    }

    // 解析模块路径
    resolve(request, parent) {
        // 核心模块
        if (ModuleLoader._isCore(request)) {
            return { type: 'core', path: request };
        }

        // 相对路径或绝对路径
        if (request.startsWith('./') ||
            request.startsWith('../') ||
            request.startsWith('/')) {
            return this._resolveFile(request, parent);
        }

        // node_modules
        return this._resolveNode(request, parent);
    }

    // 检查是否是核心模块
    static _isCore(name) {
        return ['fs', 'path', 'http', 'https', 'crypto', 'os', 'url',
                'querystring', 'net', 'tls', 'zlib', 'util', 'events',
                'buffer', 'stream', 'string_decoder', 'assert', 'os'].includes(name);
    }

    // 解析文件模块
    _resolveFile(request, parent) {
        const parentPath = parent ? path.dirname(parent.id) : process.cwd();

        // 获取绝对路径
        let absPath = path.isAbsolute(request)
            ? request
            : path.resolve(parentPath, request);

        // 尝试作为文件
        if (fs.existsSync(absPath)) {
            return { type: 'file', path: absPath };
        }

        // 尝试作为目录
        const pkgPath = path.join(absPath, 'package.json');
        if (fs.existsSync(pkgPath)) {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            if (pkg.main) {
                return { type: 'file', path: path.join(absPath, pkg.main) };
            }
            return { type: 'file', path: path.join(absPath, 'index.js') };
        }

        // 尝试各种扩展名
        for (const ext of this.extensions) {
            const fullPath = absPath + ext;
            if (fs.existsSync(fullPath)) {
                return { type: 'file', path: fullPath };
            }
        }

        // 尝试作为目录下的index
        for (const ext of this.extensions) {
            const indexPath = path.join(absPath, 'index' + ext);
            if (fs.existsSync(indexPath)) {
                return { type: 'file', path: indexPath };
            }
        }

        throw new Error(`Cannot find module '${request}'`);
    }

    // 解析node_modules
    _resolveNode(request, parent) {
        const parentPath = parent ? path.dirname(parent.id) : process.cwd();

        for (const nodePath of this.paths) {
            const modulePath = path.join(nodePath, request);
            const result = this._resolveFile(modulePath, parent);
            if (result) return result;
        }

        throw new Error(`Cannot find module '${request}'`);
    }

    // 加载模块
    load(request, parent) {
        // 解析模块路径
        const resolved = this.resolve(request, parent);

        // 核心模块
        if (resolved.type === 'core') {
            return require('module')._load(resolved.path, parent);
        }

        // 文件模块
        const { path: filePath } = resolved;

        // 检查缓存
        if (this.cache[filePath]) {
            return this.cache[filePath].exports;
        }

        // 创建模块对象
        const module = new Module(filePath, parent);

        // 防止循环引用时重复加载
        this.cache[filePath] = module;
        module.loading = true;

        try {
            // 执行模块代码
            this._execute(module, filePath);
            module.loaded = true;
        } finally {
            module.loading = false;
        }

        return module.exports;
    }

    // 执行模块代码
    _execute(module, filePath) {
        const ext = path.extname(filePath);

        // 获取包装器
        const wrapper = Module._getWrapper(filePath, ext);

        // 包装函数参数
        const moduleWrapper = {
            module,
            exports: module.exports,
            require: (req) => this.load(req, module),
            __filename: filePath,
            __dirname: path.dirname(filePath)
        };

        // 根据扩展名执行
        if (ext === '.json') {
            module.exports = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } else if (ext === '.js') {
            const code = fs.readFileSync(filePath, 'utf8');
            const wrappedCode = `(function(module, exports, require, __dirname, __filename) {${code}\n})`;

            const fn = eval(wrappedCode);
            fn(
                moduleWrapper.module,
                moduleWrapper.exports,
                moduleWrapper.require,
                moduleWrapper.__dirname,
                moduleWrapper.__filename
            );
        } else {
            // .node等扩展名，使用C++ addon
            throw new Error(`Unsupported file extension: ${ext}`);
        }
    }

    // 获取代码包装器
    static _getWrapper(filePath, ext) {
        // 简单处理，ESM需要特殊处理
        if (ext === '.mjs') {
            throw new Error('ESM not supported in custom loader');
        }
        return null;
    }
}

// 使用示例
const loader = new ModuleLoader();

// 加载自定义模块
const myModule = loader.load('./my-module.js');
console.log(myModule);

// 加载node_modules
const lodash = loader.load('lodash', { id: __filename });
console.log(lodash);
```

---

## 4. 内存管理

Node.js使用V8引擎管理JavaScript内存，理解内存管理对于编写高性能应用至关重要。

### 4.1 V8内存限制

```javascript
// V8内存限制

// 默认堆内存限制
console.log('默认堆内存限制:', process.memoryUsage().heapTotal);
// 64位系统: 约1.4GB
// 32位系统: 约0.7GB

// 最大可配置堆内存
// node --max-old-space-size=4096 app.js  // 4GB
// node --max-new-space-size=1024 app.js  // 1GB 新生代

// ============================================
// 内存使用情况
// ============================================

console.log(process.memoryUsage());
// {
//   rss: 23760896,        // 实际物理内存
//   heapTotal: 16318464,   // V8堆内存总量
//   heapUsed: 11247104,    // V8堆内存使用量
//   external: 1164704,     // C++对象绑定内存
//   arrayBuffers: 208896  // ArrayBuffer大小
// }

// ============================================
// 堆内存与栈内存
// ============================================

// 栈内存：存放基本类型和引用类型地址
// 特点：自动分配和释放，大小固定

// 堆内存：存放对象、数组等引用类型
// 特点：手动管理，大小动态

let a = 1;              // a在栈中，值为1
let obj = {x: 1};      // obj在栈中（引用），对象在堆中

// 垃圾回收扫描堆内存
function inspectHeap() {
    const used = process.memoryUsage().heapUsed;
    const total = process.memoryUsage().heapTotal;
    console.log(`堆内存: ${(used / 1024 / 1024).toFixed(2)} MB / ${(total / 1024 / 1024).toFixed(2)} MB`);
}

inspectHeap();
```

### 4.2 垃圾回收算法

```javascript
// V8垃圾回收算法详解

// ============================================
// 分代垃圾回收
// ============================================

// V8将堆内存分为两代：
// 1. 新生代（New Space）：大多数对象在这里分配，生命周期短
//    - 大小：1-8MB
//    - 回收频率：高
// 2. 老生代（Old Space）：存活时间长的对象晋升到这里
//    - 大小：可达1.4GB
//    - 回收频率：低

// ============================================
// Scavenge算法（新生代）
// ============================================

// 将新生代分为From和To两个半区
// 1. 对象在From区分配
// 2. GC时，From区存活对象复制到To区
// 3. From和To交换角色
// 优点：高效，适合生命周期短的对象
// 缺点：只能使用一半内存

// ============================================
// Mark-Sweep算法（老生代）
// ============================================

// 标记-清除算法
// 1. 标记阶段：从根对象开始，标记所有可达对象
// 2. 清除阶段：回收所有未标记对象的内存
// 缺点：会产生内存碎片

// ============================================
// Mark-Compact算法（老生代）
// ============================================

// 标记-整理算法
// 1. 标记存活对象
// 2. 整理：将存活对象移动到一端
// 3. 清除：删除边界外的所有对象
// 优点：解决内存碎片问题
// 缺点：需要移动对象，速度较慢

// ============================================
// 增量标记与懒清理
// ============================================

// 为了避免GC导致的停顿，V8使用：
// 1. 增量标记：将标记过程分成小步骤
// 2. 懒清理：延迟清理，先返回控制权

// ============================================
// 查看GC信息
// ============================================

// 启动时添加标志查看GC日志
// node --trace-gc app.js

// 使用v8模块获取GC信息
const v8 = require('v8');

// 获取堆统计信息
console.log(v8.getHeapStatistics());
// {
//   total_heap_size: 16318464,
//   total_heap_size_executable: 4194304,
//   total_physical_size: 1164704,
//   total_available_size: 1501812736,
//   used_heap_size: 11247104,
//   heap_size_limit: 1501560832,
//   ...
// }

// 获取堆空间统计
console.log(v8.getHeapSpaceStatistics());
// [
//   { space_name: 'new_space', space_size: ..., used_size: ..., available_size: ... },
//   { space_name: 'old_space', ... },
//   { space_name: 'code_space', ... },
//   { space_name: 'map_space', ... },
//   { space_name: 'large_object_space', ... }
// ]

// ============================================
// 手动触发GC（需要添加--expose-gc标志）
// node --expose-gc app.js
// ============================================

// global.gc(); // 手动触发全量GC
```

### 4.3 内存泄漏与排查

```javascript
// ============================================
// 常见内存泄漏原因
// ============================================

// 1. 全局变量
// ❌ 不要这样
function badFunction() {
    largeObject = new Array(1000000); // 成为全局变量！
}

// ✅ 正确
function goodFunction() {
    const largeObject = new Array(1000000);
    return largeObject;
}

// 2. 闭包引用
// ❌ 闭包持有不必要的引用
function createClosure() {
    const largeArray = new Array(1000000);
    // 这个闭包会持有largeArray的引用
    return function() {
        return largeArray.length; // 只用了length，但整个数组都在内存中
    };
}

// ✅ 正确：只保留需要的数据
function createBetterClosure() {
    const largeArray = new Array(1000000);
    const length = largeArray.length; // 只保存需要的数据
    return function() {
        return length;
    };
}

// 3. 事件监听器未清理
// ❌ EventEmitter累积
class Server {
    constructor() {
        this.emitter = new (require('events').EventEmitter)();
    }

    onRequest(handler) {
        this.emitter.on('request', handler);
        // 问题：handler永远不会被移除
    }
}

// ✅ 正确：使用once或手动移除
class BetterServer {
    constructor() {
        this.emitter = new (require('events').EventEmitter)();
    }

    onRequest(handler) {
        // 使用once自动移除
        this.emitter.once('request', handler);
    }

    removeRequest(handler) {
        this.emitter.off('request', handler);
    }
}

// 4. 定时器未清理
// ❌ setInterval/setTimeout未清理
function startTimer() {
    setInterval(() => {
        // 定时器一直在运行
    }, 1000);
}

// ✅ 正确：保存引用并清理
const timers = [];

function startTimer() {
    const id = setInterval(() => { /* ... */ }, 1000);
    timers.push(id);
}

function stopTimers() {
    timers.forEach(id => clearInterval(id));
    timers.length = 0;
}

// 5. 缓存没有限制
// ❌ 无限增长的缓存
const cache = new Map();

function getData(key) {
    if (cache.has(key)) {
        return cache.get(key);
    }
    const data = loadData(key);
    cache.set(key, data); // 永远不清理
    return data;
}

// ✅ 正确：使用WeakMap或有大小限制的缓存
const { LRUCache } = require('lru-cache');
const lruCache = new LRUCache({
    max: 500, // 最大500条
    ttl: 1000 * 60 * 5 // 5分钟过期
});

function getData(key) {
    return lruCache.getOrSet(key, () => loadData(key));
}

// ============================================
// 内存泄漏排查工具
// ============================================

// 1. heapdump - 生成堆快照
const heapdump = require('heapdump');

// 在需要时生成快照
heapdump.writeSnapshot('./heapdump-' + Date.now() + '.heapsnapshot', (err, filename) => {
    if (err) {
        console.error('快照生成失败:', err);
    } else {
        console.log('快照已保存:', filename);
    }
});

// 2. 使用Chrome DevTools
// - 启动node时添加--inspect标志
// node --inspect app.js
// - 在Chrome中打开 chrome://inspect

// 3. v8-profiler
// const profiler = require('v8-profiler');
// profiler.startProfiling();
// // ... 执行代码 ...
// const profile = profiler.stopProfiling();
// profile.export((err, result) => {
//     fs.writeFileSync('profile.cpuprofile', result);
// });

// ============================================
// 内存监控示例
// ============================================

class MemoryMonitor {
    constructor(interval = 5000) {
        this.interval = interval;
        this.timer = null;
        this.snapshots = [];
    }

    start() {
        this.timer = setInterval(() => {
            const usage = process.memoryUsage();

            console.log('=== 内存使用情况 ===');
            console.log(`RSS: ${(usage.rss / 1024 / 1024).toFixed(2)} MB`);
            console.log(`堆内存: ${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB / ${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
            console.log(`外部内存: ${(usage.external / 1024 / 1024).toFixed(2)} MB`);

            // 检测内存增长
            if (this.snapshots.length > 0) {
                const last = this.snapshots[this.snapshots.length - 1];
                const growth = usage.heapUsed - last.heapUsed;
                if (growth > 1024 * 1024) { // 增长超过1MB
                    console.warn(`⚠️ 内存增长: +${(growth / 1024 / 1024).toFixed(2)} MB`);
                }
            }

            this.snapshots.push({ ...usage, time: Date.now() });

            // 只保留最近100个快照
            if (this.snapshots.length > 100) {
                this.snapshots.shift();
            }
        }, this.interval);
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    takeSnapshot() {
        heapdump.writeSnapshot('./heapdump-' + Date.now() + '.heapsnapshot');
    }

    getReport() {
        if (this.snapshots.length < 2) return null;

        const first = this.snapshots[0];
        const last = this.snapshots[this.snapshots.length - 1];
        const duration = (last.time - first.time) / 1000;

        return {
            duration: duration + 's',
            heapGrowth: ((last.heapUsed - first.heapUsed) / 1024 / 1024).toFixed(2) + ' MB',
            avgHeapUsed: (this.snapshots.reduce((sum, s) => sum + s.heapUsed, 0) / this.snapshots.length / 1024 / 1024).toFixed(2) + ' MB'
        };
    }
}

// 使用
const monitor = new MemoryMonitor(5000);
monitor.start();

// 运行一段时间后
setTimeout(() => {
    monitor.stop();
    console.log('内存报告:', monitor.getReport());
}, 60000);
```

---

## 5. 异步编程模式

异步编程是Node.js的核心，本章深入讲解各种异步模式和最佳实践。

### 5.1 Callback模式

```javascript
// ============================================
// 回调模式
// ============================================

// 标准Node.js回调函数签名
// callback(error, result)

// 错误优先的回调
function readFileCallback(path, callback) {
    require('fs').readFile(path, 'utf8', (err, data) => {
        if (err) {
            callback(err); // 错误优先
            return;
        }
        callback(null, data); // 成功时第一个参数为null
    });
}

// 使用回调
readFileCallback('./file.txt', (err, data) => {
    if (err) {
        console.error('读取失败:', err);
        return;
    }
    console.log('读取成功:', data);
});

// ============================================
// 回调地狱与解决方案
// ============================================

// ❌ 回调地狱
fs.readFile('./config.json', (err, config) => {
    if (err) throw err;
    fs.readFile(config.database.host + '.json', (err, dbConfig) => {
        if (err) throw err;
        connect(dbConfig, (err, connection) => {
            if (err) throw err;
            connection.query('SELECT * FROM users', (err, users) => {
                if (err) throw err;
                // 更多嵌套...
            });
        });
    });
});

// 解决方案1：命名函数解耦
function handleConfig(err, config) {
    if (err) throw err;
    loadDatabaseConfig(config);
}

function loadDatabaseConfig(config) {
    fs.readFile(config.database.host + '.json', handleDatabase);
}

function handleDatabase(err, dbConfig) {
    if (err) throw err;
    connect(dbConfig, handleConnection);
}

function handleConnection(err, connection) {
    if (err) throw err;
    connection.query('SELECT * FROM users', handleUsers);
}

function handleUsers(err, users) {
    if (err) throw err;
    // 处理用户
}

// 解决方案2：使用Promise
const { promisify } = require('util');
const readFile = promisify(require('fs').readFile);

readFile('./config.json', 'utf8')
    .then(config => readFile(config.database.host + '.json', 'utf8'))
    .then(dbConfig => connect(dbConfig))
    .then(connection => connection.query('SELECT * FROM users'))
    .then(users => { /* 处理用户 */ })
    .catch(err => { /* 错误处理 */ });

// 解决方案3：使用async/await（最佳方案）
async function loadData() {
    try {
        const config = await readFile('./config.json', 'utf8');
        const dbConfig = await readFile(config.database.host + '.json', 'utf8');
        const connection = await connect(dbConfig);
        const users = await connection.query('SELECT * FROM users');
        return users;
    } catch (err) {
        console.error('加载失败:', err);
    }
}
```

### 5.2 Promise模式

```javascript
// ============================================
// Promise基础
// ============================================

// 创建Promise
const myPromise = new Promise((resolve, reject) => {
    // 异步操作
    setTimeout(() => {
        const success = true;
        if (success) {
            resolve('操作成功');
        } else {
            reject(new Error('操作失败'));
        }
    }, 1000);
});

// 使用Promise
myPromise
    .then(result => console.log(result))
    .catch(err => console.error(err));

// ============================================
// Promise静态方法
// ============================================

// Promise.resolve - 创建已解决的Promise
Promise.resolve('resolved').then(console.log); // 'resolved'

// Promise.reject - 创建已拒绝的Promise
Promise.reject(new Error('rejected')).catch(console.error); // Error: rejected

// Promise.all - 所有Promise都解决才解决
Promise.all([
    Promise.resolve(1),
    Promise.resolve(2),
    Promise.resolve(3)
]).then(results => console.log(results)); // [1, 2, 3]

// Promise.all - 任一Promise拒绝则拒绝
Promise.all([
    Promise.resolve(1),
    Promise.reject(new Error('error')),
    Promise.resolve(3)
]).catch(err => console.error(err));

// Promise.race - 任一Promise解决/拒绝就解决/拒绝
Promise.race([
    new Promise(resolve => setTimeout(() => resolve(1), 100)),
    new Promise(resolve => setTimeout(() => resolve(2), 50)),
    new Promise(resolve => setTimeout(() => resolve(3), 200))
]).then(result => console.log(result)); // 2 (最快的)

// Promise.any - 任一Promise解决则解决，全部拒绝才拒绝
Promise.any([
    Promise.reject(new Error('error1')),
    Promise.reject(new Error('error2')),
    Promise.resolve(3)
]).then(result => console.log(result)); // 3

// Promise.allSettled - 所有Promise结束后返回每个的结果
Promise.allSettled([
    Promise.resolve(1),
    Promise.reject(new Error('error')),
    Promise.resolve(3)
]).then(results => {
    console.log(results);
    // [
    //   { status: 'fulfilled', value: 1 },
    //   { status: 'rejected', reason: Error: error },
    //   { status: 'fulfilled', value: 3 }
    // ]
});

// ============================================
// Promise链式调用
// ============================================

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

delay(100)
    .then(() => {
        console.log('step 1');
        return 1;
    })
    .then((value) => {
        console.log('step 2:', value);
        return delay(100);
    })
    .then(() => {
        console.log('step 3');
    })
    .catch(err => {
        console.error('Error:', err);
    });

// ============================================
// 常见Promise模式
// ============================================

// 1. Promise.try - 在Promise中执行同步代码
const { promise } = require('fs').promises;

async function execute(callback) {
    try {
        // 使用await直接执行（相当于Promise.try）
        const result = await callback();
        return result;
    } catch (err) {
        throw err;
    }
}

// 2. Promise.map - 并行处理数组
async function promiseMap(items, processor, concurrency = Infinity) {
    const results = [];
    const executing = [];

    for (const item of items) {
        const promise = Promise.resolve(processor(item));
        results.push(promise);

        if (concurrency !== Infinity) {
            const cleanup = promise.then(() => {
                executing.splice(executing.indexOf(cleanup), 1);
            });
            executing.push(cleanup);

            if (executing.length >= concurrency) {
                await Promise.race(executing);
            }
        }
    }

    return Promise.all(results);
}

// 使用示例
const items = [1, 2, 3, 4, 5];
const results = await promiseMap(items, async (item) => {
    await delay(100);
    return item * 2;
}, 2); // 最多2个并发
console.log(results); // [2, 4, 6, 8, 10]
```

### 5.3 Async/Await模式

```javascript
// ============================================
// async/await基础
// ============================================

// async函数自动返回Promise
async function fetchData() {
    const data = await getData();
    return data;
}

// await只能在async函数中使用
// await等待Promise解决并返回其结果

// ============================================
// 错误处理
// ============================================

// try-catch
async function withTryCatch() {
    try {
        const result = await riskyOperation();
        return result;
    } catch (err) {
        console.error('操作失败:', err);
        throw err; // 可以重新抛出
    }
}

// .catch()
async function withCatch() {
    const result = await riskyOperation().catch(err => {
        console.error('操作失败:', err);
        return defaultValue; // 返回默认值
    });
    return result;
}

// ============================================
// 并行执行
// ============================================

async function parallel() {
    // ❌ 顺序执行，慢
    const a = await getA(); // 等待1秒
    const b = await getB(); // 再等1秒
    const c = await getC(); // 再等1秒
    // 总共3秒

    // ✅ 并行执行，快
    const [a, b, c] = await Promise.all([
        getA(),
        getB(),
        getC()
    ]);
    // 总共1秒
}

// ============================================
// 常见模式
// ============================================

// 1. 顺序执行（当需要依赖时）
async function sequential() {
    const user = await getUser();
    const posts = await getPosts(user.id); // 需要user.id
    return posts;
}

// 2. 并行 + 等待所有
async function fetchAll() {
    const [users, posts, comments] = await Promise.all([
        getUsers(),
        getPosts(),
        getComments()
    ]);
    return { users, posts, comments };
}

// 3. 并行 + 竞态
async function race() {
    const result = await Promise.race([
        fetchFromPrimary(),
        fetchFromSecondary()
    ]);
    return result;
}

// 4. 超时处理
async function withTimeout(promise, ms) {
    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('超时')), ms)
    );
    return Promise.race([promise, timeout]);
}

// 5. 重试机制
async function withRetry(fn, maxRetries = 3, delayMs = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (err) {
            if (i === maxRetries - 1) throw err;
            await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
        }
    }
}

// 6. 条件执行
async function conditional() {
    let result;

    if (await shouldFetch()) {
        result = await fetchData();
    } else {
        result = getCachedData();
    }

    return result;
}

// 7. 循环中的异步
async function asyncLoop() {
    const items = [1, 2, 3, 4, 5];

    // ❌ 错误：每次等待
    for (const item of items) {
        await processItem(item); // 串行，5秒
    }

    // ✅ 正确：并行处理
    await Promise.all(items.map(item => processItem(item))); // 并行，1秒

    // ✅ 正确：限制并发
    const batchSize = 2;
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        await Promise.all(batch.map(item => processItem(item)));
    }
}
```

### 5.4 Generator模式

```javascript
// ============================================
// Generator基础
// ============================================

function* numberGenerator() {
    yield 1;
    yield 2;
    yield 3;
}

const gen = numberGenerator();
console.log(gen.next()); // { value: 1, done: false }
console.log(gen.next()); // { value: 2, done: false }
console.log(gen.next()); // { value: 3, done: false }
console.log(gen.next()); // { value: undefined, done: true }

// ============================================
// Generator与异步
// ============================================

// co库的实现原理
function co(generator) {
    const gen = generator();

    function next(data) {
        const { value, done } = gen.next(data);

        if (done) {
            return value;
        }

        // value应该是Promise
        Promise.resolve(value).then(
            data => next(data),
            err => gen.throw(err)
        );
    }

    next();
}

// 使用co
const fs = require('fs').promises;

co(function* () {
    const file1 = yield fs.readFile('file1.txt', 'utf8');
    const file2 = yield fs.readFile('file2.txt', 'utf8');
    return file1 + file2;
});

// ============================================
// async/await实际上是Generator的语法糖
// 现代Node.js中async/await已经完全取代了Generator的异步用法
// ============================================

// 现代async/await等价于上面的co执行器
async function modernAsync() {
    const file1 = await fs.readFile('file1.txt', 'utf8');
    const file2 = await fs.readFile('file2.txt', 'utf8');
    return file1 + file2;
}
```

### 5.5 异步流程控制

```javascript
// ============================================
// async库常用函数
// ============================================

const async = require('async');

// series - 串行执行
async.series([
    (callback) => {
        console.log('step 1');
        setTimeout(() => callback(null, 'result1'), 100);
    },
    (callback) => {
        console.log('step 2');
        setTimeout(() => callback(null, 'result2'), 50);
    }
], (err, results) => {
    console.log(results); // ['result1', 'result2']
});

// parallel - 并行执行
async.parallel([
    (callback) => {
        setTimeout(() => callback(null, 'result1'), 100);
    },
    (callback) => {
        setTimeout(() => callback(null, 'result2'), 50);
    }
], (err, results) => {
    console.log(results); // ['result1', 'result2'] (几乎同时完成)
});

// waterfall - 串行，后面的函数可以使用前面函数的结果
async.waterfall([
    (callback) => {
        callback(null, 'param1', 'param2');
    },
    (param1, param2, callback) => {
        console.log(param1, param2); // 'param1', 'param2'
        callback(null, 'result');
    }
], (err, result) => {
    console.log(result); // 'result'
});

// ============================================
// 并发控制
// ============================================

// parallelLimit - 并行但限制数量
async.parallelLimit(tasks, 3, callback);

// queue - 工作队列
const q = async.queue((task, callback) => {
    console.log('处理任务:', task);
    setTimeout(callback, 100);
}, 2); // 并发数为2

q.push({ id: 1 });
q.push({ id: 2 });
q.push({ id: 3 });

// ============================================
// 实战：手写async parallel
// ============================================

// 实现Promise版本的parallel
function parallel(...tasks) {
    return Promise.all(tasks.map(task => task()));
}

// 实现带并发的parallel
function parallelLimit(tasks, concurrency) {
    return new Promise((resolve, reject) => {
        const results = [];
        let currentIndex = 0;
        let completed = 0;
        let error = null;

        function runTask(index) {
            if (error || index >= tasks.length) return;

            const task = tasks[index];
            const taskIndex = index;

            Promise.resolve()
                .then(() => task())
                .then(result => {
                    results[taskIndex] = result;
                    completed++;

                    if (completed === tasks.length) {
                        resolve(results);
                    } else if (!error) {
                        runTask(currentIndex++);
                    }
                })
                .catch(err => {
                    if (!error) {
                        error = err;
                        reject(err);
                    }
                });
        }

        // 启动第一批任务
        for (let i = 0; i < Math.min(concurrency, tasks.length); i++) {
            runTask(currentIndex++);
        }
    });
}

// 使用示例
const tasks = [
    () => delay(100).then(() => 1),
    () => delay(50).then(() => 2),
    () => delay(150).then(() => 3)
];

parallelLimit(tasks, 2).then(results => {
    console.log(results); // [1, 2, 3]
});
```

---

## 6. 网络编程

Node.js的网络模块使得构建高性能服务器和网络应用变得简单。

### 6.1 HTTP/HTTPS服务器

```javascript
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// ============================================
// HTTP服务器
// ============================================

const server = http.createServer((req, res) => {
    // req: IncomingMessage - 请求对象
    // res: ServerResponse - 响应对象

    // 获取请求信息
    console.log(`${req.method} ${req.url}`);
    console.log('Headers:', req.headers);

    // 获取请求体
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', () => {
        console.log('Body:', body);
    });

    // 设置响应头
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Custom-Header', 'custom-value');

    // 设置状态码
    res.statusCode = 200; // OK
    // 或
    res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8'
    });

    // 发送响应
    res.write('<h1>Hello, Node.js!</h1>');
    res.end(); // 结束响应

    // 或者直接end带数据
    // res.end(JSON.stringify({ message: 'success' }));
});

// 监听端口
server.listen(3000, '0.0.0.0', () => {
    console.log('服务器运行在 http://localhost:3000');
});

// ============================================
// HTTP请求（客户端）
// ============================================

// 简单的GET请求
http.get('http://api.example.com/data', (res) => {
    console.log('状态码:', res.statusCode);

    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('响应:', data);
    });
}).on('error', err => {
    console.error('请求错误:', err);
});

// POST请求
const postData = JSON.stringify({ name: 'test' });
const options = {
    hostname: 'api.example.com',
    port: 80,
    path: '/submit',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = http.request(options, (res) => {
    // 处理响应
});

req.write(postData);
req.end();

// ============================================
// HTTPS服务器
// ============================================

const httpsOptions = {
    key: fs.readFileSync('./ssl/private-key.pem'),
    cert: fs.readFileSync('./ssl/certificate.pem'),
    // ca: fs.readFileSync('./ssl/ca-certificate.pem'), // CA证书
    // 强制TLS版本
    minVersion: 'TLSv1.2'
};

const httpsServer = https.createServer(httpsOptions, (req, res) => {
    res.end('Secure connection!');
});

httpsServer.listen(443, () => {
    console.log('HTTPS服务器运行在 https://localhost:443');
});

// ============================================
// HTTP/2服务器（需要证书）
// ============================================

const http2 = require('http2');

const http2Server = http2.createServer({
    key: fs.readFileSync('./ssl/private-key.pem'),
    cert: fs.readFileSync('./ssl/certificate.pem')
}, (req, res) => {
    res.end('HTTP/2 connection!');
});

http2Server.listen(8443, () => {
    console.log('HTTP/2服务器运行在 https://localhost:8443');
});
```

### 6.2 TCP/UDP Socket

```javascript
const net = require('net');
const dgram = require('dgram');

// ============================================
// TCP服务器
// ============================================

const tcpServer = net.createServer((socket) => {
    // socket是net.Socket对象

    console.log('客户端连接:', socket.remoteAddress, socket.remotePort);

    // 设置编码
    socket.setEncoding('utf8');

    // 接收数据
    socket.on('data', (data) => {
        console.log('收到数据:', data);

        // 回显数据
        socket.write('收到: ' + data);
    });

    // 连接结束
    socket.on('end', () => {
        console.log('客户端断开连接');
    });

    // 错误处理
    socket.on('error', (err) => {
        console.error('Socket错误:', err);
    });

    // 写入数据
    socket.write('欢迎连接到服务器！\n');
});

// 服务器事件
tcpServer.on('error', (err) => {
    console.error('服务器错误:', err);
});

tcpServer.listen(8124, () => {
    console.log('TCP服务器运行在 port:8124');
});

// ============================================
// TCP客户端
// ============================================

const client = net.createConnection({
    host: 'localhost',
    port: 8124
}, () => {
    console.log('已连接到服务器');
    client.write('Hello, Server!');
});

client.on('data', (data) => {
    console.log('服务器消息:', data.toString());
    client.end(); // 主动关闭连接
});

client.on('close', () => {
    console.log('连接已关闭');
});

client.on('error', (err) => {
    console.error('连接错误:', err);
});

// ============================================
// UDP服务器
// ============================================

const udpServer = dgram.createSocket('udp4');

udpServer.on('message', (msg, rinfo) => {
    console.log(`收到客户端消息: ${msg} 来自 ${rinfo.address}:${rinfo.port}`);

    // 发送响应
    const response = Buffer.from('Message received');
    udpServer.send(response, rinfo.port, rinfo.address);
});

udpServer.on('listening', () => {
    const address = udpServer.address();
    console.log(`UDP服务器运行在 ${address.address}:${address.port}`);
});

udpServer.bind(41234);

// ============================================
// UDP客户端
// ============================================

const udpClient = dgram.createSocket('udp4');

udpClient.on('message', (msg, rinfo) => {
    console.log('服务器响应:', msg.toString());
    udpClient.close();
});

const message = Buffer.from('Hello, UDP Server');
udpClient.send(message, 41234, 'localhost', (err) => {
    if (err) {
        console.error('发送失败:', err);
    } else {
        console.log('消息已发送');
    }
});
```

### 6.3 WebSocket

```javascript
// WebSocket需要使用ws库
// npm install ws

const { WebSocketServer, WebSocket } = require('ws');

// ============================================
// WebSocket服务器
// ============================================

const wss = new WebSocketServer({ port: 8080 });

// 处理连接
wss.on('connection', (ws, req) => {
    console.log('客户端连接:', req.socket.remoteAddress);

    // 发送消息
    ws.send('欢迎连接到WebSocket服务器！');

    // 接收消息
    ws.on('message', (message) => {
        console.log('收到消息:', message.toString());

        // 广播给所有客户端
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send('广播: ' + message.toString());
            }
        });
    });

    // 心跳检测
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    // 关闭连接
    ws.on('close', () => {
        console.log('客户端断开连接');
    });

    // 错误处理
    ws.on('error', (err) => {
        console.error('WebSocket错误:', err);
    });
});

// 心跳检测（定期清理无效连接）
const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
            return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);

wss.on('close', () => {
    clearInterval(interval);
});

// ============================================
// WebSocket客户端
// ============================================

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
    console.log('已连接到服务器');
    ws.send('Hello, Server!');
});

ws.on('message', (data) => {
    console.log('收到消息:', data.toString());
});

ws.on('close', () => {
    console.log('连接已关闭');
});

ws.on('error', (err) => {
    console.error('连接错误:', err);
});

// ============================================
// WebSocket URL实用工具
// ============================================

// Node.js 18+内置WebSocket
const { WebSocket } = require('ws');

// 手动实现URL拼接
function createWebSocketUrl(host, port, path, isSecure = false) {
    const protocol = isSecure ? 'wss' : 'ws';
    return `${protocol}://${host}:${port}${path}`;
}

// 发送JSON消息的包装
class JSONSocket {
    constructor(ws) {
        this.ws = ws;
    }

    send(obj) {
        this.ws.send(JSON.stringify(obj));
    }

    onMessage(handler) {
        this.ws.on('message', (data) => {
            try {
                const obj = JSON.parse(data.toString());
                handler(obj);
            } catch (err) {
                console.error('JSON解析错误:', err);
            }
        });
    }
}
```

### 6.4 实战：静态文件服务器

```javascript
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const zlib = require('zlib');
const crypto = require('crypto');

const PORT = 3000;
const ROOT_DIR = path.join(process.cwd(), 'public');
const CACHE_MAX_AGE = 60 * 60 * 24; // 1天

// MIME类型映射
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.txt': 'text/plain'
};

class StaticServer {
    constructor() {
        this.server = http.createServer(this.handleRequest.bind(this));
    }

    async handleRequest(req, res) {
        // 只处理GET请求
        if (req.method !== 'GET') {
            this.sendError(res, 405, 'Method Not Allowed');
            return;
        }

        // 解析URL
        const parsedUrl = url.parse(req.url, true);
        const pathname = decodeURIComponent(parsedUrl.pathname);

        // 安全检查：防止路径遍历
        let filePath = path.join(ROOT_DIR, pathname);

        if (!filePath.startsWith(ROOT_DIR)) {
            this.sendError(res, 403, 'Forbidden');
            return;
        }

        // 默认返回index.html
        if (path.extname(filePath) === '') {
            filePath = path.join(filePath, 'index.html');
        }

        try {
            await this.serveFile(req, res, filePath);
        } catch (err) {
            if (err.code === 'ENOENT') {
                this.sendError(res, 404, 'Not Found');
            } else {
                this.sendError(res, 500, 'Internal Server Error');
            }
        }
    }

    async serveFile(req, res, filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

        // 获取文件状态
        const stats = await fs.promises.stat(filePath);

        // 生成ETag
        const etag = this.generateETag(stats);

        // 检查If-None-Match
        if (req.headers['if-none-match'] === etag) {
            res.writeHead(304);
            res.end();
            return;
        }

        // 设置响应头
        const headers = {
            'Content-Type': mimeType,
            'ETag': etag,
            'Last-Modified': stats.mtime.toUTCString(),
            'Cache-Control': `public, max-age=${CACHE_MAX_AGE}`
        };

        // 检查是否支持压缩
        const acceptEncoding = req.headers['accept-encoding'] || '';
        let needCompression = false;
        let compressionType = null;

        if (acceptEncoding.includes('gzip')) {
            needCompression = true;
            compressionType = 'gzip';
            headers['Content-Encoding'] = 'gzip';
        } else if (acceptEncoding.includes('br')) {
            needCompression = true;
            compressionType = 'br';
            headers['Content-Encoding'] = 'br';
        }

        // 根据文件大小决定是否压缩（大于1KB且可压缩的类型）
        const shouldCompress = needCompression &&
            stats.size > 1024 &&
            ['text/html', 'text/css', 'application/javascript', 'text/plain', 'application/json'].includes(mimeType);

        if (shouldCompress) {
            headers['Vary'] = 'Accept-Encoding';

            const fileStream = fs.createReadStream(filePath);
            const compress = compressionType === 'gzip'
                ? zlib.createGzip()
                : zlib.createBrotliCompress();

            res.writeHead(200, headers);
            fileStream.pipe(compress).pipe(res);
        } else {
            // 不压缩，直接发送
            const content = await fs.promises.readFile(filePath);
            headers['Content-Length'] = content.length;

            res.writeHead(200, headers);
            res.end(content);
        }
    }

    generateETag(stats) {
        const mtime = stats.mtime.getTime().toString(16);
        const size = stats.size.toString(16);
        return `"${mtime}-${size}"`;
    }

    sendError(res, code, message) {
        const pages = {
            400: 'Bad Request',
            403: 'Forbidden',
            404: 'Not Found',
            405: 'Method Not Allowed',
            500: 'Internal Server Error'
        };

        const title = pages[code] || message;

        res.writeHead(code, { 'Content-Type': 'text/html' });
        res.end(`
            <!DOCTYPE html>
            <html>
            <head><title>${code} - ${title}</title></head>
            <body>
                <h1>${code} - ${title}</h1>
                <p>${message}</p>
            </body>
            </html>
        `);
    }

    start(port = PORT) {
        this.server.listen(port, () => {
            console.log(`静态文件服务器运行在 http://localhost:${port}`);
        });
    }

    stop() {
        this.server.close();
    }
}

// 启动服务器
const server = new StaticServer();
server.start();

// 处理进程信号
process.on('SIGTERM', () => {
    console.log('收到SIGTERM，正在关闭服务器...');
    server.stop();
    process.exit(0);
});
```

---

## 7. 进程与线程

Node.js以单线程运行，但通过子进程、工作线程和集群可以充分利用多核CPU。

### 7.1 child_process

```javascript
const { spawn, exec, execFile, fork } = require('child_process');
const path = require('path');

// ============================================
// spawn - 启动子进程（流式）
// ============================================

// 适合长时间运行的进程，数据量大的场景
const child = spawn('node', ['child.js'], {
    cwd: process.cwd(),
    env: { ...process.env, CUSTOM_ENV: 'value' },
    stdio: ['pipe', 'pipe', 'pipe'] // stdin, stdout, stderr
});

child.stdout.on('data', (data) => {
    console.log('子进程输出:', data.toString());
});

child.stderr.on('data', (data) => {
    console.error('子进程错误:', data.toString());
});

child.on('exit', (code, signal) => {
    console.log(`子进程退出，代码: ${code}, 信号: ${signal}`);
});

child.on('error', (err) => {
    console.error('子进程启动失败:', err);
});

// 杀死子进程
// child.kill('SIGTERM');

// ============================================
// exec - 执行shell命令
// ============================================

// 适合短时间任务，结果量小的场景
exec('ls -la', { shell: '/bin/bash' }, (err, stdout, stderr) => {
    if (err) {
        console.error('执行错误:', err);
        return;
    }
    console.log('标准输出:', stdout);
    if (stderr) {
        console.error('标准错误:', stderr);
    }
});

// exec with Promise
const { exec: execPromise } = require('child_process').promises;

async function runCommand() {
    try {
        const { stdout, stderr } = await execPromise('ls -la');
        console.log(stdout);
    } catch (err) {
        console.error(err);
    }
}

// ============================================
// execFile - 执行可执行文件
// ============================================

// 不通过shell，适合执行编译好的二进制文件，更安全
execFile('python', ['script.py'], (err, stdout, stderr) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(stdout);
});

// ============================================
// fork - 启动Node.js子进程（专门用于Node.js）
// ============================================

// fork会创建V8实例，可以进行IPC通信
const forked = fork(path.join(__dirname, 'worker.js'), [], {
    stdio: ['pipe', 'pipe', 'pipe', 'ipc']
});

// 发送消息给子进程
forked.send({ type: 'start', data: 'hello' });

// 接收子进程消息
forked.on('message', (message) => {
    console.log('收到子进程消息:', message);
});

// 子进程退出
forked.on('exit', (code) => {
    console.log('子进程退出，代码:', code);
});

// ============================================
// 子进程通信示例
// ============================================

// parent.js
const { fork } = require('child_process');

const child = fork('./child.js');

child.on('message', (msg) => {
    console.log('父进程收到:', msg);
    if (msg === 'ready') {
        child.send('ping');
    }
});

child.send('init');

// child.js
process.on('message', (msg) => {
    console.log('子进程收到:', msg);

    if (msg === 'init') {
        process.send('ready');
    } else if (msg === 'ping') {
        setTimeout(() => {
            process.send('pong');
        }, 1000);
    }
});

// ============================================
// cluster - 集群模块
// ============================================

const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
    console.log(`主进程 ${process.pid} 正在运行`);

    // 衍生工作进程
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`工作进程 ${worker.process.pid} 退出`);
        // 重启工作进程
        cluster.fork();
    });
} else {
    // 工作进程可以运行任何进程
    // 在这里运行HTTP服务器
    require('http').createServer((req, res) => {
        res.end(`Hello from ${process.pid}!\n`);
    }).listen(3000);

    console.log(`工作进程 ${process.pid} 已启动`);
}
```

### 7.2 worker_threads

```javascript
const {
    Worker,
    isMainThread,
    parentPort,
    workerData,
    threadId
} = require('worker_threads');

// ============================================
// worker_threads基础
// ============================================

// 主线程
if (isMainThread) {
    console.log('这是主线程:', process.pid);

    // 创建工作线程
    const worker = new Worker(__filename, {
        workerData: { start: 0, end: 1000000 }
    });

    worker.on('message', (result) => {
        console.log('工作线程计算结果:', result);
    });

    worker.on('error', (err) => {
        console.error('工作线程错误:', err);
    });

    worker.on('exit', (code) => {
        console.log('工作线程退出，代码:', code);
    });
} else {
    // 工作线程代码
    console.log('工作线程启动:', threadId);

    const { start, end } = workerData;

    // 模拟计算任务
    let sum = 0;
    for (let i = start; i <= end; i++) {
        sum += i;
    }

    // 发送结果给主线程
    parentPort.postMessage(sum);
}

// ============================================
// 线程间共享内存（SharedArrayBuffer）
// ============================================

// 使用SharedArrayBuffer可以在线程间共享内存
// 不需要序列化/反序列化

if (isMainThread) {
    // 创建共享缓冲区
    const sharedBuffer = new SharedArrayBuffer(4);
    const sharedArray = new Int32Array(sharedBuffer);

    console.log('主线程初始值:', sharedArray[0]);

    const worker = new Worker(__filename, {
        workerData: { buffer: sharedBuffer }
    });

    worker.on('message', () => {
        console.log('主线程读取共享内存:', sharedArray[0]); // 应该是100
    });

    // 主线程修改
    Atomics.add(sharedArray, 0, 50);
    worker.postMessage('go');
} else {
    const { buffer } = workerData;
    const sharedArray = new Int32Array(buffer);

    parentPort.on('message', () => {
        Atomics.add(sharedArray, 0, 50);
        parentPort.postMessage('done');
    });
}

// ============================================
// Worker线程池
// ============================================

class WorkerPool {
    constructor(filename, size) {
        this.filename = filename;
        this.size = size;
        this.workers = [];
        this.queue = [];
        this.activeWorkers = 0;

        for (let i = 0; i < size; i++) {
            this.workers.push(this.createWorker());
        }
    }

    createWorker() {
        const worker = new Worker(this.filename);

        worker.on('message', (result) => {
            const { resolve } = this.queue.shift();
            resolve(result);
            this.activeWorkers--;

            // 处理下一个任务
            if (this.queue.length > 0) {
                this.assignTask();
            }
        });

        worker.on('error', (err) => {
            console.error('Worker错误:', err);
        });

        return worker;
    }

    assignTask() {
        if (this.queue.length === 0) return;

        this.activeWorkers++;
        const task = this.queue[0];
        this.workers.find(w => !w.busy)?.postMessage(task);
    }

    runTask(data) {
        return new Promise((resolve) => {
            this.queue.push({ data, resolve });
            if (this.activeWorkers < this.size) {
                this.assignTask();
            }
        });
    }

    terminate() {
        this.workers.forEach(w => w.terminate());
    }
}
```

### 7.3 进程间通信

```javascript
// ============================================
// IPC通道
// ============================================

// fork()创建的子进程自动建立IPC通道
// 可以通过process.send()和监听'message'事件通信

// parent.js
const child = fork('child.js');

child.send({ cmd: 'START' });
child.on('message', (msg) => {
    console.log('收到:', msg);
});

// child.js
process.on('message', (msg) => {
    console.log('收到:', msg);

    if (msg.cmd === 'START') {
        // 处理任务
        process.send({ status: 'COMPLETED', result: 42 });
    }
});

// ============================================
// 使用管道进行通信
// ============================================

const { spawn } = require('child_process');
const { pipeline } = require('stream/promises');

// 创建一个带有管道的子进程
const child = spawn('python', ['-u', 'processor.py'], {
    stdio: [null, 'pipe', 'pipe']
});

child.stdout.setEncoding('utf8');

child.stdout.on('data', (data) => {
    console.log('Python输出:', data.trim());
});

child.stderr.on('data', (data) => {
    console.error('Python错误:', data.trim());
});

child.stdin.write('Hello from Node.js\n');
child.stdin.end();

// ============================================
// 使用net.Socket进行IPC
// ============================================

const net = require('net');

const server = net.createServer((socket) => {
    socket.on('data', (data) => {
        console.log('收到:', data.toString());
        socket.write('ACK: ' + data.toString());
    });
});

server.listen('/tmp/ipc.sock');

// 客户端连接
const client = net.connect('/tmp/ipc.sock', () => {
    client.write('Hello from client');
});

client.on('data', (data) => {
    console.log('收到响应:', data.toString());
    client.end();
});
```

---

## 8. 调试与排错

### 8.1 REPL

```javascript
// Node.js REPL (Read-Eval-Print-Loop)

// 启动REPL
// node

// 常用命令
// .help - 显示帮助
// .exit - 退出
// .clear - 清除上下文
// .load file.js - 加载文件
// .save file.js - 保存会话

// ============================================
// 在代码中使用REPL
// ============================================

const repl = require('repl');

// 启动自定义REPL
const myRepl = repl.start({
    prompt: 'my-app> ',
    eval: (cmd, context, filename, callback) => {
        // 自定义命令处理
        if (cmd.trim() === 'status') {
            callback(null, 'Application running');
        } else {
            // 使用默认的eval
            const originalEval = repl._builtinLib.repl.eval;
            originalEval(cmd, context, filename, callback);
        }
    }
});

// 添加自定义命令
myRepl.defineCommand('status', {
    help: 'Show application status',
    action() {
        this.close();
        console.log('Status: OK');
        process.exit(0);
    }
});

// REPL服务器可用于远程调试
const net = require('net');

net.createServer((socket) => {
    const replServer = repl.start({
        input: socket,
        output: socket,
        prompt: 'remote> '
    });

    replServer.on('exit', () => {
        socket.end();
    });
}).listen(5001);
```

### 8.2 断点调试

```javascript
// ============================================
// debugger语句
// ============================================

// 在代码中添加debugger语句
function calculate(a, b) {
    const result = a + b;
    debugger; // 程序会在此暂停
    return result * 2;
}

// 启动调试模式
// node inspect app.js

// 调试命令
// cont, c - 继续执行到下一个断点
// next, n - 执行下一行
// step, s - 进入函数
// out, o - 跳出函数
// watch('expression') - 监视表达式
// exec('expression') - 执行表达式

// ============================================
// Chrome DevTools调试
// ============================================

// 启动带调试端口的Node.js
// node --inspect=9229 app.js

// 或在代码中触发调试
// debugger;

// 然后在Chrome中打开 chrome://inspect

// ============================================
// VS Code调试
// ============================================

// launch.json配置
/*
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "name": "启动程序",
            "program": "${workspaceFolder}/app.js",
            "runtimeArgs": ["--nolazy"],
            "env": { "NODE_ENV": "development" }
        },
        {
            "type": "node",
            "request": "attach",
            "name": "附加到进程",
            "port": 9229
        }
    ]
}
*/

// ============================================
// 错误堆栈分析
// ============================================

try {
    // 可能失败的代码
    JSON.parse('invalid json');
} catch (err) {
    console.error('错误名称:', err.name);        // SyntaxError
    console.error('错误消息:', err.message);
    console.error('错误堆栈:', err.stack);

    // 格式化输出
    console.error(err);
}

// 自定义错误
class AppError extends Error {
    constructor(message, statusCode, code) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}

try {
    throw new AppError('资源未找到', 404, 'RESOURCE_NOT_FOUND');
} catch (err) {
    if (err instanceof AppError) {
        console.error(`[${err.code}] ${err.message} (HTTP ${err.statusCode})`);
    }
}
```

### 8.3 常见错误

```javascript
// ============================================
// Cannot read property
// ============================================

// ❌ 常见错误
const obj = null;
console.log(obj.property); // TypeError: Cannot read property 'property' of null

// ✅ 安全访问
// 1. 使用可选链
const value = obj?.property?.nested;

// 2. 使用&&短路
const value2 = obj && obj.property && obj.property.nested;

// 3. 检查后访问
if (obj && obj.property) {
    console.log(obj.property.nested);
}

// ============================================
// Promise未处理
// ============================================

// ❌ 没有.catch的Promise
fetch('/api/data')
    .then(data => process(data));
// 如果fetch失败，不会被处理

// ✅ 总是添加catch
fetch('/api/data')
    .then(data => process(data))
    .catch(err => console.error('请求失败:', err));

// ✅ 使用finally清理
fetch('/api/data')
    .then(data => process(data))
    .catch(err => console.error('请求失败:', err))
    .finally(() => hideLoading());

// ============================================
// 异步错误处理
// ============================================

// ❌ async函数中的错误没有捕获
async function badAsync() {
    const data = await fetch('/api'); // 错误会被抛出但没人捕获
    return data;
}

// ✅ 使用try-catch
async function goodAsync() {
    try {
        const response = await fetch('/api');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return await response.json();
    } catch (err) {
        console.error('请求失败:', err);
        throw err; // 重新抛出让调用者处理
    }
}

// ============================================
// 事件监听器泄漏
// ============================================

// ❌ 不断添加监听器
function onData(handler) {
    emitter.on('data', handler); // 每次调用都添加新的监听器
}

// ✅ 一次性监听器或清理
function onData(handler) {
    emitter.once('data', handler);
}

// 或使用命名函数并在适当时机移除
function handleData(data) { /* ... */ }
emitter.on('data', handleData);
emitter.off('data', handleData);
```

### 8.4 性能分析

```javascript
// ============================================
// CPU分析
// ============================================

// 启动时启用CPU分析
// node --prof app.js
// node --prof-process isolate-*.log | less

// ============================================
// v8分析
// ============================================

const v8 = require('v8');
const fs = require('fs');
const { pipeline } = require('stream/promises');

// 获取堆快照
function takeHeapSnapshot(filename = 'heapdump.heapsnapshot') {
    const filename = `heap-${Date.now()}.heapsnapshot`;
    const snapshotStream = v8.writeHeapSnapshot(filename);
    console.log('堆快照已保存:', filename);
    return filename;
}

// 获取CPU配置文件
function startProfiling() {
    v8.startProfiling();
}

function stopProfiling() {
    const profile = v8.stopProfiling();
    const filename = `cpu-profile-${Date.now().cpuprofile`;
    fs.writeFileSync(filename, JSON.stringify(profile));
    console.log('CPU配置文件已保存:', filename);
}

// ============================================
// 内存分析
// ============================================

// 使用process.memoryUsage()
function logMemory() {
    const mem = process.memoryUsage();
    console.log({
        rss: `${(mem.rss / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        external: `${(mem.external / 1024 / 1024).toFixed(2)} MB`
    });
}

// ============================================
// benchmark
// ============================================

// 使用benchmark.js
const Benchmark = require('benchmark');

const suite = new Benchmark.Suite();

suite
    .add('for loop', () => {
        let sum = 0;
        for (let i = 0; i < 1000000; i++) {
            sum += i;
        }
    })
    .add('while loop', () => {
        let sum = 0;
        let i = 0;
        while (i < 1000000) {
            sum += i++;
        }
    })
    .on('cycle', (event) => {
        console.log(String(event.target));
    })
    .on('complete', () => {
        console.log('最快:', suite.filter('fastest').map('name'));
    })
    .run({ async: true });
```

---

## 9. 安全

### 9.1 输入验证

```javascript
// ============================================
// 输入验证
// ============================================

// 使用joi或yup进行模式验证
const Joi = require('joi');

// 定义验证模式
const userSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required(),
    age: Joi.number().integer().min(13).max(120).optional(),
    name: Joi.string().min(1).max(100).trim()
});

// 验证函数
function validateUser(data) {
    const { error, value } = userSchema.validate(data, {
        abortEarly: false, // 返回所有错误
        stripUnknown: true // 移除未知字段
    });

    if (error) {
        const errors = error.details.map(d => ({
            field: d.path.join('.'),
            message: d.message
        }));
        return { valid: false, errors };
    }

    return { valid: true, value };
}

// ============================================
// SQL注入防护
// ============================================

// ❌ 危险：直接拼接SQL
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ✅ 安全：使用参数化查询
const query = 'SELECT * FROM users WHERE id = $1';
db.query(query, [userId]);

// ✅ 安全：使用ORM（Prisma/TypeORM等）
const user = await prisma.user.findUnique({
    where: { id: userId }
});

// ============================================
// XSS防护
// ============================================

// ❌ 危险：直接输出用户输入
res.send(`<div>${userInput}</div>`);

// ✅ 安全：转义HTML
const escapeHtml = (str) => {
    const escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;'
    };
    return str.replace(/[&<>"']/g, char => escapeMap[char]);
};

res.send(`<div>${escapeHtml(userInput)}</div>`);

// ✅ 使用模板引擎（自动转义）
// EJS, Handlebars等默认转义

// ============================================
// CSRF防护
// ============================================

// 1. 使用csurf中间件
// const csrf = require('csurf');
// const csrfProtection = csrf({ cookie: true });

// 2. 检查Referer头
function checkReferer(req) {
    const referer = req.headers.referer;
    const allowedOrigins = ['https://myapp.com'];

    if (!referer) return false;
    try {
        const url = new URL(referer);
        return allowedOrigins.includes(url.origin);
    } catch {
        return false;
    }
}

// 3. 检查Origin头
function checkOrigin(req) {
    const origin = req.headers.origin;
    return origin === 'https://myapp.com';
}

// ============================================
// 敏感数据处理
// ============================================

// 1. 不在日志中记录敏感信息
const sanitized = {
    ...user,
    password: '[REDACTED]',
    creditCard: '[REDACTED]',
    ssn: '[REDACTED]'
};

// 2. 使用环境变量存储密钥
const API_KEY = process.env.API_KEY; // 从环境变量读取

// 3. 加密敏感数据
const crypto = require('crypto');

function encrypt(text, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    return Buffer.concat([iv, cipher.update(text), cipher.final()]);
}

function decrypt(encrypted, key) {
    const iv = encrypted.slice(0, 16);
    const data = encrypted.slice(16);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    return Buffer.concat([decipher.update(data), decipher.final()]);
}
```

---

## 10. 测试

### 10.1 单元测试

```javascript
// ============================================
// Jest单元测试
// ============================================

// 安装：npm install --save-dev jest
// 运行：npx jest

// sum.js
function sum(a, b) {
    return a + b;
}
module.exports = sum;

// sum.test.js
const sum = require('./sum');

describe('sum函数', () => {
    test('两数相加', () => {
        expect(sum(1, 2)).toBe(3);
    });

    test('负数相加', () => {
        expect(sum(-1, -1)).toBe(-2);
    });

    test('小数相加', () => {
        expect(sum(0.1, 0.2)).toBeCloseTo(0.3);
    });
});

// ============================================
// Mocha单元测试
// ============================================

// 安装：npm install --save-dev mocha chai
// 运行：npx mocha

const assert = require('assert');

describe('Array', () => {
    before(() => {
        // 在所有测试前执行一次
    });

    beforeEach(() => {
        // 每个测试前执行
    });

    after(() => {});
    afterEach(() => {});

    it('should return -1 when value not present', () => {
        assert.equal([1, 2, 3].indexOf(4), -1);
    });

    it('should return index when value present', () => {
        assert.equal([1, 2, 3].indexOf(1), 0);
    });
});

// ============================================
// 异步测试
// ============================================

test('async/await测试', async () => {
    const data = await fetchData();
    expect(data).toBeDefined();
});

test('Promise测试', () => {
    return expect(fetchData()).resolves.toBeDefined();
});

// ============================================
// Mock
// ============================================

const sinon = require('sinon');

// 创建mock
const fetchUser = sinon.mock();
// 设置预期
fetchUser.expects('getUser').withArgs(1).once().resolves({ id: 1, name: 'John' });

// 使用
await fetchUser.getUser(1);

// 验证
fetchUser.verify();

// ============================================
// 覆盖率
// ============================================

// Jest自动支持覆盖率
// npx jest --coverage

// 在package.json中配置
/*
{
  "jest": {
    "collectCoverageFrom": [
      "src/**/*.js",
      "!src/**/*.test.js"
    ]
  }
}
*/
```

---

## 11. 工程化

### 11.1 包管理

```javascript
// ============================================
// npm常用命令
// ============================================

// npm init - 初始化项目
// npm install - 安装所有依赖
// npm install <package> - 安装包
// npm install --save <package> - 保存到dependencies
// npm install --save-dev <package> - 保存到devDependencies
// npm uninstall <package> - 卸载包
// npm update - 更新依赖
// npm list - 列出已安装的包
// npm outdated - 检查过期包

// ============================================
// yarn命令
// ============================================

// yarn install - 安装依赖
// yarn add <package> - 添加依赖
// yarn add --dev <package> - 添加开发依赖
// yarn remove <package> - 移除依赖
// yarn upgrade - 更新依赖
// yarn outdated - 检查过期

// ============================================
// pnpm命令
// ============================================

// pnpm install - 安装依赖
// pnpm add <package> - 添加依赖
// pnpm remove - 移除依赖
// pnpm update - 更新依赖
// pnpm prune - 清理未使用的依赖

// ============================================
// semver版本管理
// ============================================

// 版本格式：major.minor.patch
// major - 不兼容的API变更
// minor - 向后兼容的功能
// patch - 向后兼容的修复

// 范围：
// ^1.2.3 - 允许minor和patch更新
// ~1.2.3 - 允许patch更新
// 1.2.3 - 精确版本
// >=1.2.3 - 满足条件的版本
// 1.x - 任意1.x.x版本

// ============================================
// package.json最佳实践
// ============================================

/*
{
  "name": "my-package",
  "version": "1.0.0",
  "description": "包描述",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "keywords": ["node", "module"],
  "license": "MIT"
}
*/
```

### 11.2 构建工具

```javascript
// ============================================
// esbuild使用
// ============================================

// 安装：npm install --save-dev esbuild

const esbuild = require('esbuild');

async function build() {
    await esbuild.build({
        entryPoints: ['src/index.ts'],
        bundle: true,
        minify: true,
        sourcemap: true,
        target: ['node18'],
        platform: 'node',
        outfile: 'dist/index.js',
        external: ['fs', 'path', 'http']
    });
}

build();

// ============================================
// swc使用
// ============================================

// swc是Rust写的编译器，比babel快20倍

const swc = require('@swc/core');

async function transform(code) {
    const result = await swc.transform(code, {
        filename: 'input.ts',
        presets: ['@swc/preset-typescript'],
        plugins: ['@swc/plugin-transform-runtime']
    });

    return result.code;
}
```

### 11.3 代码规范

```javascript
// ============================================
// ESLint配置
// ============================================

// .eslintrc.js
module.exports = {
    env: {
        node: true,
        es2021: true
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended'
    ],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    rules: {
        'no-console': 'warn',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['error', {
            argsIgnorePattern: '^_'
        }]
    }
};

// ============================================
// Prettier配置
// ============================================

// .prettierrc
/*
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 4,
  "arrowParens": "avoid"
}
*/

// ============================================
// Git Hooks（使用husky）
// ============================================

// 安装husky
// npx husky install

// 添加pre-commit hook
// npx husky add .husky/pre-commit "npm test && npm run lint"
```

---

## 12. 实战：手写Node.js框架

### 12.1 需求分析

我们将实现一个类似Koa的Web框架，核心功能：
- 中间件系统
- 路由系统
- 上下文封装
- 错误处理

### 12.2 核心设计

```javascript
// ============================================
// MiniKoa - 简化版Koa框架
// ============================================

const http = require('http');

class Application {
    constructor() {
        // 中间件数组
        this.middlewares = [];
        // 路由表
        this.routes = [];
    }

    // 使用中间件
    use(fn) {
        if (typeof fn !== 'function') {
            throw new TypeError('Middleware must be a function');
        }
        this.middlewares.push(fn);
        return this;
    }

    // 注册路由
    get(path, ...handlers) {
        this.routes.push({ method: 'GET', path, handlers });
        return this;
    }

    post(path, ...handlers) {
        this.routes.push({ method: 'POST', path, handlers });
        return this;
    }

    put(path, ...handlers) {
        this.routes.push({ method: 'PUT', path, handlers });
        return this;
    }

    delete(path, ...handlers) {
        this.routes.push({ method: 'DELETE', path, handlers });
        return this;
    }

    // 匹配路由
    matchRoute(method, path) {
        return this.routes.find(route =>
            route.method === method && route.path === path
        );
    }

    // 创建上下文
    createContext(req, res) {
        return new Context(req, res, this);
    }

    // 组合中间件
    compose(middlewares, ctx) {
        let index = -1;

        const dispatch = (i) => {
            if (i <= index) {
                return Promise.reject(new Error('next() called multiple times'));
            }
            index = i;

            if (i >= middlewares.length) {
                return Promise.resolve();
            }

            const fn = middlewares[i];
            return Promise.resolve(fn(ctx, () => dispatch(i + 1)));
        };

        return dispatch(0);
    }

    // 启动服务器
    listen(...args) {
        const server = http.createServer(async (req, res) => {
            const ctx = this.createContext(req, res);

            try {
                // 先匹配路由
                const route = this.matchRoute(req.method, ctx.path);

                if (route) {
                    // 路由中间件
                    const routeMiddleware = async (ctx, next) => {
                        ctx.params = {}; // TODO: 解析params
                        let i = 0;
                        const dispatch = async (handler) => {
                            if (i >= route.handlers.length) return next();
                            const handler_fn = route.handlers[i++];
                            await handler_fn(ctx, () => dispatch(i));
                        };
                        await dispatch(0);
                    };

                    await this.compose([...this.middlewares, routeMiddleware], ctx);
                } else {
                    await this.compose(this.middlewares, ctx);
                }

                // 404
                if (!ctx.body) {
                    ctx.status = 404;
                    ctx.body = 'Not Found';
                }
            } catch (err) {
                // 错误处理
                ctx.status = err.status || 500;
                ctx.body = err.message;
                console.error('Server Error:', err);
            }

            res.end(ctx.body);
        });

        return server.listen(...args);
    }
}

// ============================================
// Context - 上下文封装
// ============================================

class Context {
    constructor(req, res, app) {
        this.req = req;
        this.res = res;
        this.app = app;

        // 初始化响应数据
        this._status = 200;
        this._body = null;
        this._headers = {};
    }

    // 获取请求信息
    get method() { return this.req.method; }
    get url() { return this.req.url; }
    get path() { return this.req.url.split('?')[0]; }
    get query() {
        const searchParams = new URLSearchParams(this.req.url.split('?')[1] || '');
        return Object.fromEntries(searchParams);
    }
    get headers() { return this.req.headers; }
    get body() { return this._body; }

    // 设置响应
    set body(value) {
        this._body = value;
    }

    get status() { return this._status; }

    set status(code) {
        this._status = code;
        this.res.statusCode = code;
    }

    // 设置响应头
    set(key, value) {
        this.res.setHeader(key, value);
        this._headers[key] = value;
    }

    get(key) {
        return this._headers[key];
    }

    // 获取请求体
    async requestBody() {
        return new Promise((resolve, reject) => {
            let body = '';
            this.req.on('data', chunk => body += chunk);
            this.req.on('end', () => resolve(body));
            this.req.on('error', reject);
        });
    }

    // JSON响应
    json(data) {
        this.set('Content-Type', 'application/json');
        this.body = JSON.stringify(data);
    }

    // HTML响应
    html(data) {
        this.set('Content-Type', 'text/html');
        this.body = data;
    }
}

// ============================================
// 使用示例
// ============================================

const app = new Application();

// 日志中间件
app.use(async (ctx, next) => {
    const start = Date.now();
    console.log(`${ctx.method} ${ctx.url} 开始`);
    await next();
    const ms = Date.now() - start;
    console.log(`${ctx.method} ${ctx.url} 耗时 ${ms}ms`);
});

// 认证中间件
app.use(async (ctx, next) => {
    const token = ctx.headers['authorization'];
    if (token !== 'Bearer secret-token') {
        ctx.status = 401;
        ctx.body = 'Unauthorized';
        return;
    }
    await next();
});

// 路由
app.get('/api/users', async (ctx) => {
    ctx.json([
        { id: 1, name: '张三' },
        { id: 2, name: '李四' }
    ]);
});

app.post('/api/users', async (ctx) => {
    const body = await ctx.requestBody();
    const user = JSON.parse(body);
    ctx.json({ success: true, user });
});

app.get('/api/users/:id', async (ctx) => {
    ctx.json({ id: 1, name: '张三' });
});

app.delete('/api/users/:id', async (ctx) => {
    ctx.json({ success: true });
});

// 启动服务器
app.listen(3000, () => {
    console.log('MiniKoa服务器运行在 http://localhost:3000');
});
```

### 12.3 我的思考：读源码是最好的学习方式

```javascript
// 阅读Node.js源码的建议

// 1. 从核心模块开始
// - events EventEmitter
// - stream Readable/Writable
// - http Server
// - fs

// 2. 使用源码调试
// git clone https://github.com/nodejs/node.git
// cd node
// ./configure && make -j8

// 3. 关键源码文件
/*
node_src/
├── lib/
│   ├── _http_server.js    # HTTP服务器
│   ├── _http_client.js    # HTTP客户端
│   ├── events.js          # EventEmitter
│   ├── stream.js          # Stream
│   ├── fs.js              # 文件系统
│   ├── net.js             # TCP
│   ├── http.js            # HTTP
│   └── module.js          # 模块系统
├── src/
│   ├── node.cc            # 主入口
│   ├── node_contextify.cc # 上下文
│   ├── node_file.cc       # 文件操作
│   ├── node_buffer.cc     # Buffer
│   └── node_main.cc       # 主程序
└── deps/
    ├── uv/                 # libuv
    ├── v8/                 # V8引擎
    └── http_parser/        # HTTP解析
*/

// 4. 阅读顺序建议
// 1) events.js - 最简单，理解发布订阅
// 2) stream.js - 理解流式处理
// 3) module.js - 理解模块系统
// 4) _http_server.js - 理解HTTP服务器
// 5) fs.js - 理解文件系统

// 5. 推荐的源码阅读工具
// - VS Code + CodeTour插件
// - Sourcegraph
// - GitHub网页
```

---

## 总结

本文档全面介绍了Node.js进阶知识，涵盖：

1. **核心模块**：Events、Buffer、Stream、FileSystem、Path、Crypto、Zlib等
2. **事件循环**：libuv原理、六个阶段、微任务与宏任务
3. **模块系统**：CommonJS、ESM、模块解析、循环引用
4. **内存管理**：V8内存限制、垃圾回收算法、内存泄漏排查
5. **异步编程**：Callback、Promise、Async/Await、Generator
6. **网络编程**：HTTP/HTTPS、TCP/UDP、WebSocket
7. **进程与线程**：child_process、cluster、worker_threads
8. **调试与排错**：REPL、断点调试、常见错误、性能分析
9. **安全**：输入验证、SQL注入、XSS、CSRF
10. **测试**：Jest、Mocha、Mock
11. **工程化**：npm/yarn/pnpm、构建工具、代码规范
12. **实战**：手写Node.js框架

掌握这些知识，将使你能够：
- 编写高效、可维护的Node.js应用
- 理解Node.js底层原理
- 排查和解决线上问题
- 设计良好的系统架构

**持续学习建议**：
1. 阅读Node.js官方文档
2. 阅读优秀开源项目源码（如Express、Koa、Fastify）
3. 参与社区讨论和贡献
4. 实践：多做项目，从实践中学习

---

> **文档版本**：v1.0
> **创建日期**：2024年
> **适用版本**：Node.js 18.x / 20.x LTS
