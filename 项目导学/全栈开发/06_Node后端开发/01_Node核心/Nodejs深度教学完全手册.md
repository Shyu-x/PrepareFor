# Node.js深度教学完全手册（超详细版）

## 目录

1. [Node.js核心架构深度解析](#1-nodejs核心架构深度解析)
2. [事件循环与异步机制详解](#2-事件循环与异步机制详解)
3. [Buffer与Stream流处理](#3-buffer与stream流处理)
4. [进程与集群管理](#4-进程与集群管理)
5. [内存管理与性能优化](#5-内存管理与性能优化)
6. [Node.js网络编程实战](#6-nodejs网络编程实战)

---

## 1. Node.js核心架构深度解析

### 1.1 Node.js架构设计

```
Node.js技术栈层次结构

┌─────────────────────────────────────────┐
│        应用层（Application）             │
│    - JavaScript代码                      │
│    - Node.js内置模块                     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│    绑定层（Node.js Bindings）            │
│    - C++绑定                             │
│    - V8接口封装                          │
│    - libuv接口封装                       │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         V8引擎（V8 Engine）              │
│    - JavaScript解释执行                  │
│    - JIT编译                             │
│    - 垃圾回收                            │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         libuv（事件循环）                │
│    - 异步I/O                             │
│    - 事件循环                            │
│    - 线程池                              │
│    - 跨平台抽象                          │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         操作系统层（OS）                 │
│    - 文件系统                            │
│    - 网络通信                            │
│    - 进程管理                            │
│    - 定时器                              │
└─────────────────────────────────────────┘
```

#### V8引擎架构

```javascript
/**
 * V8引擎工作流程详解
 *
 * JavaScript代码执行过程：
 * 1. 解析（Parse）：将源代码转换为AST（抽象语法树）
 * 2. 解释（Ignition）：将AST编译为字节码并执行
 * 3. 编译（TurboFan）：热点代码编译为机器码
 * 4. 优化（Optimization）：内联、逃逸分析等优化
 * 5. 去优化（Deoptimization）：类型不稳定时回退
 */

// V8编译流水线示例

// 1. JavaScript源代码
const sourceCode = `
function add(a, b) {
    return a + b;
}

const result = add(1, 2);
console.log(result);
`;

// 2. 词法分析（Lexical Analysis）
// 将源代码分解为Token序列
const tokens = [
    { type: 'Keyword', value: 'function' },
    { type: 'Identifier', value: 'add' },
    { type: 'Punctuator', value: '(' },
    { type: 'Identifier', value: 'a' },
    { type: 'Punctuator', value: ',' },
    { type: 'Identifier', value: 'b' },
    { type: 'Punctuator', value: ')' },
    { type: 'Punctuator', value: '{' },
    // ...
];

// 3. 语法分析（Syntax Analysis）
// 将Token序列转换为AST
const ast = {
    type: 'Program',
    body: [{
        type: 'FunctionDeclaration',
        id: { type: 'Identifier', name: 'add' },
        params: [
            { type: 'Identifier', name: 'a' },
            { type: 'Identifier', name: 'b' }
        ],
        body: {
            type: 'BlockStatement',
            body: [{
                type: 'ReturnStatement',
                argument: {
                    type: 'BinaryExpression',
                    operator: '+',
                    left: { type: 'Identifier', name: 'a' },
                    right: { type: 'Identifier', name: 'b' }
                }
            }]
        }
    }]
};

// 4. Ignition解释器：生成字节码
const byteCode = `
Ldar a0      // 加载第一个参数
Add a1, [0]  // 加上第二个参数
Return       // 返回结果
`;

// 5. TurboFan编译器：优化编译（热点代码）
// 当函数被多次调用时，V8会将其编译为机器码
const machineCode = `
mov eax, [ebp+8]   ; 加载第一个参数
add eax, [ebp+12]  ; 加上第二个参数
ret                ; 返回结果
`;

// 6. 内联优化示例
// 原始代码
function add(a, b) {
    return a + b;
}

function calculate(x, y) {
    return add(x, y) * 2;
}

// 内联后的代码
function calculate(x, y) {
    return (x + y) * 2;  // add函数被内联
}

// 7. 逃逸分析
function createUser() {
    const user = { name: '张三', age: 25 };  // 对象不会逃逸
    return user.name;  // 只使用name属性
}

// 优化后：对象可能在栈上分配
function createUser() {
    return '张三';  // 直接返回字符串，不创建对象
}

// 8. 去优化触发条件
function process(value) {
    if (typeof value === 'number') {
        return value * 2;  // 优化假设：value总是number
    } else {
        return String(value);
    }
}

// 热点调用（优化）
process(1);  // number类型
process(2);  // number类型
process(3);  // number类型

// 类型改变触发去优化
process('hello');  // string类型，去优化！

// 9. V8优化建议

// ✅ 好的做法：保持类型一致
function add(a, b) {
    return a + b;
}

add(1, 2);      // number
add(3, 4);      // number
add(5, 6);      // number

// ❌ 不好的做法：类型变化
function add(a, b) {
    return a + b;
}

add(1, 2);          // number
add('hello', '!'); // string，触发去优化
add(3, 4);          // number，重新优化
```

#### libuv架构

```c
/**
 * libuv架构深度解析
 *
 * libuv是Node.js的核心库，负责：
 * 1. 事件循环（Event Loop）
 * 2. 异步I/O操作
 * 3. 线程池管理
 * 4. 跨平台抽象
 */

// libuv架构图
/*
┌──────────────────────────────────────────┐
│           Node.js Process                │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │     事件循环（Event Loop）          │  │
│  │                                    │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │   Timers（定时器）            │  │  │
│  │  │   - setTimeout               │  │  │
│  │  │   - setInterval              │  │  │
│  │  └──────────────────────────────┘  │  │
│  │                                    │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │   Pending Callbacks           │  │  │
│  │  │   - 延迟到下一个循环的回调     │  │  │
│  │  └──────────────────────────────┘  │  │
│  │                                    │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │   Idle, Prepare               │  │  │
│  │  │   - 内部使用                  │  │  │
│  │  └──────────────────────────────┘  │  │
│  │                                    │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │   Poll（轮询）                │  │  │
│  │  │   - I/O事件                   │  │  │
│  │  │   - 文件读写                  │  │  │
│  │  │   - 网络通信                  │  │  │
│  │  └──────────────────────────────┘  │  │
│  │                                    │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │   Check（检查）               │  │  │
│  │  │   - setImmediate             │  │  │
│  │  └──────────────────────────────┘  │  │
│  │                                    │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │   Close Callbacks             │  │  │
│  │  │   - 关闭回调                  │  │  │
│  │  └──────────────────────────────┘  │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │   线程池（Thread Pool）            │  │
│  │   - 4个线程（默认）                 │  │
│  │   - 文件系统操作                    │  │
│  │   - DNS查询                         │  │
│  │   - 加密操作                        │  │
│  │   - 用户自定义任务                  │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
*/

// libuv核心结构
struct uv_loop_s {
    void* data;                    // 用户数据
    unsigned int active_handles;   // 活跃的handle数量
    unsigned int active_reqs;      // 活跃的request数量
    unsigned int stop_flag;        // 停止标志

    // 句柄队列
    UV_LOOP_PRIVATE_FIELDS

    // 各阶段队列
    struct {
        void* min_heap;
    } timer_handles;

    QUEUE pending_handles;
    QUEUE idle_handles;
    QUEUE check_handles;
    QUEUE prepare_handles;
    QUEUE closing_handles;

    // 线程池
    struct {
        uv_mutex_t mutex;
        uv_cond_t cond;
        unsigned int num_threads;
        uv_thread_t* threads;
        QUEUE wq;
    } threadpool;
};

// Handle结构
struct uv_handle_s {
    void* data;                    // 用户数据
    uv_loop_t* loop;               // 所属事件循环
    uv_handle_type type;           // Handle类型
    uv_close_cb close_cb;         // 关闭回调
    void* handle_queue[2];         // 队列指针
    unsigned int flags;            // 标志位
};

// Request结构
struct uv_req_s {
    void* data;                    // 用户数据
    uv_req_type type;              // Request类型
    void* active_queue[2];         // 活跃队列指针
};

// I/O观察者
struct uv__io_s {
    uv__io_cb cb;                  // 回调函数
    void* pending_queue[2];        // 待处理队列
    void* watcher_queue[2];        // 观察者队列
    unsigned int pevents;          // 待处理事件
    unsigned int events;           // 当前事件
    int fd;                        // 文件描述符
};
```

### 1.2 Node.js模块系统

```javascript
/**
 * Node.js模块系统深度解析
 *
 * 模块类型：
 * 1. 核心模块（Core Modules）：内置模块，如fs、http、path等
 * 2. 文件模块（File Modules）：用户编写的模块
 * 3. 第三方模块（Third-party Modules）：node_modules中的模块
 */

// ========== CommonJS模块加载流程 ==========

// 1. 模块包装器（Module Wrapper）
// 每个模块都被包装在一个函数中
(function (exports, require, module, __filename, __dirname) {
    // 模块代码
    const fs = require('fs');
    const path = require('path');

    module.exports = {
        read: function() { /* ... */ }
    };
});

// 2. require函数实现
function require(modulePath) {
    // 2.1 解析模块路径
    const resolvedPath = Module._resolveFilename(modulePath, this, false);

    // 2.2 检查缓存
    const cachedModule = Module._cache[resolvedPath];
    if (cachedModule) {
        return cachedModule.exports;
    }

    // 2.3 创建模块对象
    const module = new Module(resolvedPath, this);

    // 2.4 缓存模块
    Module._cache[resolvedPath] = module;

    // 2.5 加载模块
    module.load(resolvedPath);

    return module.exports;
}

// 3. Module类实现
class Module {
    constructor(id, parent) {
        this.id = id;
        this.exports = {};
        this.parent = parent;
        this.filename = null;
        this.loaded = false;
        this.children = [];
    }

    load(filename) {
        this.filename = filename;
        this.paths = Module._nodeModulePaths(path.dirname(filename));

        // 根据扩展名加载
        const extension = path.extname(filename);
        Module._extensions[extension](this, filename);
        this.loaded = true;
    }
}

// 4. 扩展名处理器
Module._extensions = {
    // JavaScript文件
    '.js': function(module, filename) {
        const content = fs.readFileSync(filename, 'utf8');
        const compiledWrapper = vm.compileFunction(
            content,
            ['exports', 'require', 'module', '__filename', '__dirname'],
            { filename }
        );

        compiledWrapper.call(
            module.exports,
            module.exports,
            require,
            module,
            filename,
            path.dirname(filename)
        );
    },

    // JSON文件
    '.json': function(module, filename) {
        const content = fs.readFileSync(filename, 'utf8');
        module.exports = JSON.parse(content);
    },

    // Node扩展
    '.node': function(module, filename) {
        const dlopen = process.dlopen;
        dlopen(module, filename);
    }
};

// 5. 模块路径解析算法
Module._resolveFilename = function(request, parent, isMain) {
    // 5.1 检查是否是核心模块
    const nativeModule = require('internal/modules/cjs/native_module');
    if (nativeModule.canBeRequiredByUsers(request)) {
        return request;
    }

    // 5.2 解析路径
    let paths = [];

    // 从当前目录开始向上查找node_modules
    if (parent && parent.paths) {
        paths = parent.paths.slice();
    }

    // 添加全局路径
    paths = paths.concat(Module.globalPaths);

    // 5.3 尝试每个路径
    for (let i = 0; i < paths.length; i++) {
        const basePath = path.resolve(paths[i], request);
        const filename = tryFile(basePath) ||
                         tryPackage(basePath) ||
                         tryExtensions(basePath);

        if (filename) {
            return filename;
        }
    }

    throw new Error(`Cannot find module '${request}'`);
};

// 6. package.json处理
function tryPackage(requestPath) {
    const pkgJsonPath = path.join(requestPath, 'package.json');

    if (!fs.existsSync(pkgJsonPath)) {
        return null;
    }

    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));

    // 查找入口文件
    const entryPoint = pkg.main || 'index.js';
    const entryPath = path.join(requestPath, entryPoint);

    return tryFile(entryPath) || tryExtensions(entryPath);
}

// 7. 模块缓存机制
Module._cache = Object.create(null);

// 清除缓存
function deleteCache(modulePath) {
    delete Module._cache[require.resolve(modulePath)];
}

// 8. 循环依赖处理
/**
 * 循环依赖示例：
 *
 * a.js:
 * exports.loaded = false;
 * const b = require('./b.js');
 * exports.loaded = true;
 *
 * b.js:
 * const a = require('./a.js');
 * console.log(a.loaded);  // false（a还未完全加载）
 * exports.done = true;
 *
 * Node.js处理方式：
 * - a开始加载
 * - a加载到一半，require b
 * - b开始加载
 * - b require a，发现a正在加载中
 * - Node返回a当前的exports（不完整的）
 * - b完成加载
 * - a完成加载
 */

// ========== ES Module加载流程 ==========

// 9. ES Module特性
/**
 * ES Module与CommonJS的区别：
 *
 * 1. 加载时机：
 *    - CommonJS：运行时加载
 *    - ES Module：编译时静态分析
 *
 * 2. 输出方式：
 *    - CommonJS：值拷贝
 *    - ES Module：值引用（绑定）
 *
 * 3. this指向：
 *    - CommonJS：指向当前模块
 *    - ES Module：undefined
 *
 * 4. 循环依赖：
 *    - CommonJS：只输出已执行的部分
 *    - ES Module：动态引用
 */

// ES Module示例
// module.mjs
export const name = '张三';

export function greet() {
    return `Hello, ${name}`;
}

// main.mjs
import { name, greet } from './module.mjs';

console.log(name);  // 张三
console.log(greet());  // Hello, 张三

// 10. 动态import
async function loadModule() {
    const module = await import('./module.mjs');
    console.log(module.name);
}

// 11. ES Module包装器
const esModuleWrapper = `
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 模块代码
`;

// 12. 模块混合使用
// CommonJS导入ES Module
// package.json
{
    "type": "commonjs"
}

// 使用动态import
const fs = require('fs');

async function main() {
    const { default: myModule } = await import('./myModule.mjs');
    myModule.doSomething();
}

// ES Module导入CommonJS
// package.json
{
    "type": "module"
}

// 使用createRequire
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const myCommonJSModule = require('./myModule.js');
```

---

## 2. 事件循环与异步机制详解

### 2.1 Node.js事件循环架构

```javascript
/**
 * Node.js事件循环完整架构
 *
 * Node.js使用libuv实现跨平台的异步I/O操作
 * 事件循环是Node.js能够处理高并发的基础
 */

/**
 * 事件循环各阶段详解
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    事件循环（Event Loop）                      │
 * ├─────────────────────────────────────────────────────────────┤
 * │                                                             │
 * │  ┌───────────┐                                             │
 * │  │  timers    │ ← setTimeout, setInterval 的回调           │
 * │  └───────────┘                                             │
 * │       │                                                      │
 * │       ▼                                                      │
 * │  ┌───────────┐                                             │
 * │  │ pending   │ ← I/O callbacks (除了close/settimeout)    │
 * │  │ callbacks  │                                             │
 * │  └───────────┘                                             │
 * │       │                                                      │
 * │       ▼                                                      │
 * │  ┌───────────┐                                             │
 * │  │ idle,     │ ← Node.js内部使用                           │
 * │  │ prepare   │                                             │
 * │  └───────────┘                                             │
 * │       │                                                      │
 * │       ▼                                                      │
 * │  ┌───────────┐                                             │
 * │  │   poll    │ ← 获取新的I/O事件                           │
 * │  │           │   执行除了 close/timer/check 的回调          │
 * │  └───────────┘                                             │
 * │       │                                                      │
 * │       ▼                                                      │
 * │  ┌───────────┐                                             │
 * │  │   check   │ ← setImmediate 的回调                        │
 * │  └───────────┘                                             │
 * │       │                                                      │
 * │       ▼                                                      │
 * │  ┌───────────┐                                             │
 * │  │ close     │ ← 关闭事件的回调                             │
 * │  │ callbacks │                                             │
 * │  └───────────┘                                             │
 * │                                                             │
 * └─────────────────────────────────────────────────────────────┘
 */

// 1. timers阶段
// setTimeout和setInterval的回调在此阶段执行
setTimeout(() => {
    console.log('setTimeout回调 - timers阶段');
}, 0);

// setInterval
const interval = setInterval(() => {
    console.log('setInterval回调');
}, 100);

// 清除定时器
setTimeout(() => {
    clearInterval(interval);
}, 350);

// 2. check阶段
// setImmediate的回调在check阶段执行
setImmediate(() => {
    console.log('setImmediate回调 - check阶段');
});

// 3. poll阶段
// I/O相关回调在poll阶段执行
const fs = require('fs');

fs.readFile('/etc/passwd', (err, data) => {
    if (err) throw err;
    console.log('文件读取完成 - poll阶段');
});

// 4. nextTick和setImmediate的执行顺序
/**
 * nextTickQueue vs microtaskQueue 的执行顺序
 *
 * nextTickQueue（process.nextTick）优先级高于microtaskQueue
 * nextTickQueue在每个阶段结束后都会执行
 * microtaskQueue（Promise.then）仅在poll阶段后检查
 */

process.nextTick(() => {
    console.log('nextTick 回调');
});

Promise.resolve().then(() => {
    console.log('Promise.then 回调');
});

// 输出顺序：
// nextTick 回调
// Promise.then 回调
```

### 2.2 异步操作分类与队列

```javascript
/**
 * Node.js中的异步操作分类
 *
 * 1. 非I/O异步操作：
 *    - setTimeout/setInterval → timers队列
 *    - setImmediate → check队列
 *    - process.nextTick → nextTickQueue
 *
 * 2. I/O异步操作：
 *    - 文件系统操作 → thread pool → poll队列
 *    - DNS查询 → thread pool → poll队列
 *    - 网络操作 → 直接在poll阶段处理
 *
 * 3. 微任务：
 *    - Promise.then/catch/finally → microtaskQueue
 *    - queueMicrotask → microtaskQueue
 */

// 1. timers vs setImmediate 执行顺序
// 取决于I/O操作是否完成

// 情况1：主模块中（无I/O）
setTimeout(() => console.log('setTimeout'), 0);
setImmediate(() => console.log('setImmediate'));
// 输出：setTimeout, setImmediate（setTimeout先执行）

// 情况2：在I/O回调中
const fs = require('fs');
fs.readFile(__filename, () => {
    setTimeout(() => console.log('setTimeout'), 0);
    setImmediate(() => console.log('setImmediate'));
});
// 输出：setImmediate, setImmediate（在I/O回调中setImmediate先执行）

// 2. process.nextTick的高优先级
function readFile() {
    const fs = require('fs');

    return new Promise((resolve) => {
        fs.readFile(__filename, (err, data) => {
            process.nextTick(() => {
                console.log('nextTick in readFile');
            });
            resolve(data);
        });
    });
}

readFile().then(() => {
    console.log('Promise.then after readFile');
});

// 输出顺序：
// nextTick in readFile
// Promise.then after readFile
// （nextTick在Promise.then之前执行）

// 3. 微任务队列详解
async function asyncMicrotask() {
    console.log('1. 同步代码开始');

    await Promise.resolve();
    console.log('3. await之后');

    queueMicrotask(() => {
        console.log('4. queueMicrotask');
    });

    console.log('2. 同步代码结束');
}

asyncMicrotask().then(() => {
    console.log('5. async函数完成');
});

// 输出顺序：
// 1. 同步代码开始
// 2. 同步代码结束
// 3. await之后
// 4. queueMicrotask
// 5. async函数完成
```

### 2.3 异步流程控制模式

```javascript
/**
 * 异步流程控制的几种模式
 */

// 1. 回调模式
function callbackPattern(callback) {
    fs.readFile('file1.txt', (err, data1) => {
        if (err) return callback(err);

        fs.readFile('file2.txt', (err, data2) => {
            if (err) return callback(err);

            callback(null, { data1, data2 });
        });
    });
}

// 2. Promise链式模式
function promisePattern() {
    return fs.promises.readFile('file1.txt')
        .then(data1 => {
            return fs.promises.readFile('file2.txt')
                .then(data2 => ({ data1, data2 }));
        });
}

// 3. async/await模式
async function asyncAwaitPattern() {
    const data1 = await fs.promises.readFile('file1.txt');
    const data2 = await fs.promises.readFile('file2.txt');
    return { data1, data2 };
}

// 4. Promise.all并发模式
async function promiseAllPattern() {
    const [data1, data2] = await Promise.all([
        fs.promises.readFile('file1.txt'),
        fs.promises.readFile('file2.txt')
    ]);
    return { data1, data2 };
}

// 5. 顺序执行vs并发执行对比
async function sequentialVsConcurrent() {
    // 顺序执行：总时间 = t1 + t2 + t3
    const start1 = Date.now();
    await fs.promises.readFile('file1.txt');
    await fs.promises.readFile('file2.txt');
    await fs.promises.readFile('file3.txt');
    const time1 = Date.now() - start1;

    // 并发执行：总时间 = max(t1, t2, t3)
    const start2 = Date.now();
    await Promise.all([
        fs.promises.readFile('file1.txt'),
        fs.promises.readFile('file2.txt'),
        fs.promises.readFile('file3.txt')
    ]);
    const time2 = Date.now() - start2;

    console.log(`顺序: ${time1}ms, 并发: ${time2}ms`);
}

// 6. 并发限制控制
async function parallelLimit(tasks, limit) {
    const results = [];
    const executing = [];

    for (const task of tasks) {
        const promise = task().then(result => {
            results.push(result);
            executing.splice(executing.indexOf(promise), 1);
        });

        executing.push(promise);

        if (executing.length >= limit) {
            await Promise.race(executing);
        }
    }

    return Promise.all(executing).then(() => results);
}

// 使用示例
async function downloadFiles() {
    const urls = ['url1', 'url2', 'url3', 'url4', 'url5'];

    await parallelLimit(
        urls.map(url => () => download(url)),
        2  // 最多同时下载2个文件
    );
}

// 7. 错误处理模式
async function errorHandling() {
    // 模式1：try-catch
    try {
        const data = await fs.promises.readFile('file.txt');
        console.log(data);
    } catch (error) {
        console.error('读取文件失败:', error);
    }

    // 模式2：Promise catch
    await fs.promises.readFile('file.txt')
        .catch(error => {
            console.error('读取文件失败:', error);
            throw error;  // 可以重新抛出
        });

    // 模式3：finally清理
    const connection = await createConnection();
    try {
        await connection.query('SELECT * FROM users');
    } finally {
        await connection.end();  // 无论成功失败都关闭连接
    }
}

// 8. 重试机制
async function retry(fn, maxAttempts = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (attempt === maxAttempts) {
                throw error;
            }
            console.log(`第${attempt}次尝试失败，${delay}ms后重试...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// 使用示例
async function fetchWithRetry(url) {
    return retry(
        () => fetch(url).then(r => r.json()),
        3,
        1000
    );
}
```

### 2.4 事件循环实战应用

```javascript
/**
 * 事件循环在实际应用中的使用技巧
 */

// 1. 非阻塞代码设计
function nonBlockingCode() {
    // ❌ 错误：在事件循环中执行CPU密集型任务会阻塞
    function badFibonacci(n) {
        if (n <= 1) return n;
        return badFibonacci(n - 1) + badFibonacci(n - 2);
    }

    // ✅ 正确：使用setImmediate分片执行
    function goodFibonacci(n) {
        return new Promise(resolve => {
            function compute(start, end, a, b) {
                if (start === end) {
                    return resolve(b);
                }

                setImmediate(() => {
                    compute(start + 1, end, b, a + b);
                });
            }

            compute(0, n, 0, 1);
        });
    }

    // ✅ 正确：使用Worker线程
    const { Worker } = require('worker_threads');
    function fibonacciWorker(n) {
        return new Promise((resolve, reject) => {
            const worker = new Worker('./fibonacci-worker.js', {
                workerData: n
            });
            worker.on('message', resolve);
            worker.on('error', reject);
        });
    }
}

// 2. 批量处理数据
async function batchProcess(items, batchSize, processFn) {
    const results = [];

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);

        // 并发处理当前批次
        const batchResults = await Promise.all(
            batch.map(item => processFn(item))
        );

        results.push(...batchResults);

        // 让出事件循环，防止阻塞
        await new Promise(resolve => setImmediate(resolve));
    }

    return results;
}

// 使用示例
async function processOrders() {
    const orders = await getAllOrders();
    return batchProcess(orders, 100, processOrder);
}

// 3. 平滑退出处理
async function gracefulShutdown(server) {
    // 停止接受新连接
    server.close(() => {
        console.log('HTTP服务器已关闭');
    });

    // 等待现有请求完成
    const maxWait = 10000;  // 最多等待10秒
    const startTime = Date.now();

    while (server.getConnections() > 0) {
        if (Date.now() - startTime > maxWait) {
            console.log('等待超时，强制退出');
            process.exit(1);
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 关闭数据库连接
    await database.close();

    // 关闭Redis连接
    await redis.quit();

    console.log('所有连接已关闭，准备退出');
    process.exit(0);
}

// 4. 定时任务调度
class TaskScheduler {
    constructor() {
        this.tasks = new Map();
    }

    // 添加定时任务
    addTask(name, fn, interval) {
        const taskId = setInterval(async () => {
            try {
                await fn();
            } catch (error) {
                console.error(`任务${name}执行失败:`, error);
            }
        }, interval);

        this.tasks.set(name, taskId);
        console.log(`任务${name}已添加，间隔${interval}ms`);
    }

    // 添加一次性延迟任务
    addDelayedTask(fn, delay) {
        return new Promise((resolve, reject) => {
            setTimeout(async () => {
                try {
                    const result = await fn();
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            }, delay);
        });
    }

    // 添加在当前事件循环阶段结束后执行的任务
    addNextTickTask(fn) {
        process.nextTick(async () => {
            try {
                await fn();
            } catch (error) {
                console.error('nextTick任务执行失败:', error);
            }
        });
    }

    // 取消任务
    cancelTask(name) {
        const taskId = this.tasks.get(name);
        if (taskId) {
            clearInterval(taskId);
            this.tasks.delete(name);
            console.log(`任务${name}已取消`);
        }
    }

    // 关闭调度器
    shutdown() {
        for (const [name, taskId] of this.tasks) {
            clearInterval(taskId);
        }
        this.tasks.clear();
        console.log('调度器已关闭');
    }
}

// 使用示例
const scheduler = new TaskScheduler();
scheduler.addTask('数据清理', cleanOldData, 3600000);  // 每小时
scheduler.addTask('心跳检测', heartbeatCheck, 30000);   // 每30秒

// 5. 避免事件循环阻塞
function avoidBlocking() {
    // ❌ 大数据JSON解析会阻塞
    const bigJson = fs.readFileSync('large.json', 'utf8');
    const data = JSON.parse(bigJson);

    // ✅ 使用流式解析
    const { parse } = require('stream-json');
    const stream = fs.createReadStream('large.json')
        .pipe(parse());

    stream.on('data', console.log);

    // ❌ 同步文件操作
    const content = fs.readFileSync('file.txt', 'utf8');

    // ✅ 异步文件操作
    const content = fs.promises.readFile('file.txt', 'utf8');

    // ❌ 大循环不分解
    for (const item of largeArray) {
        processItem(item);
    }

    // ✅ 使用generator分解
    function* chunkProcessor(array, chunkSize) {
        for (let i = 0; i < array.length; i += chunkSize) {
            yield array.slice(i, i + chunkSize);
        }
    }

    async function processInChunks() {
        for (const chunk of chunkProcessor(largeArray, 1000)) {
            await Promise.all(chunk.map(processItem));
            // 让出事件循环
            await new Promise(resolve => setImmediate(resolve));
        }
    }
}
```

---

## 3. Buffer与Stream流处理

### 3.1 Buffer二进制数据处理

```javascript
/**
 * Buffer是Node.js中用于处理二进制数据的类
 * 在Node.js 6.0之前使用Buffer()构造函数
 * 现在使用Buffer.from()、Buffer.alloc()、Buffer.allocUnsafe()
 */

// 1. 创建Buffer
// Buffer.alloc() - 创建并初始化
const buf1 = Buffer.alloc(10);  // 分配10字节，初始化为0
const buf2 = Buffer.alloc(10, 1);  // 分配10字节，初始化为1

// Buffer.allocUnsafe() - 快速分配但不初始化（可能包含旧数据）
const buf3 = Buffer.allocUnsafe(10);

// Buffer.from() - 从已有数据创建
const buf4 = Buffer.from('hello');  // 从字符串
const buf5 = Buffer.from([1, 2, 3]);  // 从数组
const buf6 = Buffer.from(buf4);  // 从另一个Buffer

// 2. Buffer与字符串转换
const str = '你好，Node.js';
const buf = Buffer.from(str, 'utf8');

console.log('字节长度:', buf.length);  // 17（UTF-8编码）
console.log('转为字符串:', buf.toString('utf8'));  // 你好，Node.js

// 3. Buffer读写操作
const buf7 = Buffer.alloc(16);

// 写入数据
buf7.write('hello');  // 默认offset=0
buf7.write('world', 5);  // 从offset=5开始
buf7.writeUInt16LE(42, 10);  // 写入小端序16位无符号整数
buf7.writeUInt16BE(42, 12);  // 写入大端序16位无符号整数

// 读取数据
console.log('读取字符串:', buf7.toString('utf8', 0, 5));  // hello
console.log('读取字符串:', buf7.toString('utf8', 5, 10));  // world
console.log('读取小端序:', buf7.readUInt16LE(10));  // 42
console.log('读取大端序:', buf7.readUInt16BE(12));  // 42

// 4. Buffer拼接
const bufA = Buffer.from('hello');
const bufB = Buffer.from(' world');
const bufC = Buffer.concat([bufA, bufB]);
console.log(bufC.toString());  // hello world

// 5. Buffer比较
const bufX = Buffer.from('abc');
const bufY = Buffer.from('abd');
const bufZ = Buffer.from('abc');

console.log(bufX.compare(bufY));  // -1 (abc < abd)
console.log(bufX.compare(bufZ));  // 0  (abc === abc)

// 6. Buffer复制
const bufSrc = Buffer.from('hello');
const bufDst = Buffer.alloc(5);
bufSrc.copy(bufDst);
console.log(bufDst.toString());  // hello

// 7. Buffer切片
const bufLarge = Buffer.from('hello world');
const bufSlice = bufLarge.slice(0, 5);
console.log(bufSlice.toString());  // hello

// 8. Base64编解码
const original = Buffer.from('Hello, 世界!');
const encoded = original.toString('base64');
const decoded = Buffer.from(encoded, 'base64');
console.log(encoded);  // SGVsbG8sIOiW8K4hIQ==
console.log(decoded.toString());  // Hello, 世界!

// 9. 十六进制转换
const hexStr = Buffer.from('test').toString('hex');
const fromHex = Buffer.from(hexStr, 'hex');
console.log(hexStr);  // 74657374
console.log(fromHex.toString());  // test

// 10. TypedArray互转
const arr = new Uint8Array([1, 2, 3]);
const bufFromTyped = Buffer.from(arr.buffer);
console.log(bufFromTyped.toString());  // ,,
```

### 3.2 Stream流处理架构

```javascript
/**
 * Stream是Node.js处理流式数据的抽象接口
 * 解决了大文件处理和背压问题
 */

const { Readable, Writable, Transform, Duplex, pipeline } = require('stream');
const fs = require('fs');
const zlib = require('zlib');

/**
 * Stream类型：
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │                        Stream类型                            │
 * ├─────────────┬─────────────┬─────────────┬─────────────────┤
 * │  Readable   │  Writable  │    Duplex   │   Transform     │
 * ├─────────────┼─────────────┼─────────────┼─────────────────┤
 * │  可读流     │   可写流    │   双工流    │   转换流        │
 * │             │             │             │                 │
 * │  读取数据   │   写入数据   │  读写数据   │  读写转换       │
 * │             │             │             │                 │
 * │  fs.create  │  fs.create  │  net.Socket │  zlib.createGzip│
 * │  ReadStream │  WriteStream│             │                 │
 * └─────────────┴─────────────┴─────────────┴─────────────────┘
 */

// 1. Readable流
// 消费模式1：流动模式
process.stdin.on('data', (chunk) => {
    console.log('收到数据:', chunk.toString());
});

// 消费模式2：暂停模式
class MyReadable extends Readable {
    constructor(data) {
        super();
        this.data = data;
        this.index = 0;
    }

    _read() {
        if (this.index < this.data.length) {
            this.push(this.data[this.index++]);
        } else {
            this.push(null);  // 发送end信号
        }
    }
}

const readable = new MyReadable(['hello', 'world', '!']);
readable.on('data', (chunk) => {
    console.log('Readable收到:', chunk.toString());
});
readable.on('end', () => {
    console.log('Readable完成');
});

// 2. Writable流
class MyWritable extends Writable {
    constructor(options) {
        super(options);
        this.data = [];
    }

    _write(chunk, encoding, callback) {
        this.data.push(chunk.toString());
        callback();  // 必须调用callback表示处理完成
    }
}

const writable = new MyWritable();
writable.write(Buffer.from('hello'));
writable.write(Buffer.from(' '));
writable.write(Buffer.from('world'));
writable.end();  // 标记结束

writable.on('finish', () => {
    console.log('Writable完成:', this.data.join(''));
});

// 3. Transform流
class UpperCaseTransform extends Transform {
    _transform(chunk, encoding, callback) {
        this.push(chunk.toString().toUpperCase());
        callback();
    }
}

const upperCase = new UpperCaseTransform();
upperCase.on('data', (chunk) => {
    console.log('转换后:', chunk.toString());
});

upperCase.write(Buffer.from('hello'));
upperCase.write(Buffer.from('world'));
upperCase.end();

// 4. 使用内置流
// 文件复制 - 高效方式
async function copyFile(src, dest) {
    const readStream = fs.createReadStream(src);
    const writeStream = fs.createWriteStream(dest);

    return new Promise((resolve, reject) => {
        readStream.on('error', reject);
        writeStream.on('error', reject);
        writeStream.on('finish', resolve);

        // 使用pipeline确保错误处理
        pipeline(readStream, writeStream, (err) => {
            if (err) {
                console.error('管道失败:', err);
                reject(err);
            } else {
                console.log('文件复制完成');
                resolve();
            }
        });
    });
}

// 5. 文件压缩示例
async function compressFile(input, output) {
    const readStream = fs.createReadStream(input);
    const gzipStream = zlib.createGzip();
    const writeStream = fs.createWriteStream(output);

    return new Promise((resolve, reject) => {
        pipeline(readStream, gzipStream, writeStream, (err) => {
            if (err) {
                console.error('压缩失败:', err);
                reject(err);
            } else {
                console.log('压缩完成');
                resolve();
            }
        });
    });
}

// 6. HTTP流处理
const http = require('http');

// 服务器端：流式响应
http.createServer((req, res) => {
    const fileStream = fs.createReadStream('large-file.txt');

    res.writeHead(200, { 'Content-Type': 'text/plain' });

    // 背压处理：当客户端跟不上时暂停读取
    fileStream.on('data', (chunk) => {
        const canContinue = res.write(chunk);
        if (!canContinue) {
            fileStream.pause();
            res.on('drain', () => {
                fileStream.resume();
            });
        }
    });

    fileStream.on('end', () => {
        res.end();
    });

    fileStream.on('error', (err) => {
        console.error('文件读取错误:', err);
        res.end('Error occurred');
    });
});

// 7. 对象模式流
class ObjectReadable extends Readable {
    constructor(objects, options) {
        super({ ...options, objectMode: true });
        this.objects = objects;
        this.index = 0;
    }

    _read() {
        if (this.index < this.objects.length) {
            this.push(this.objects[this.index++]);
        } else {
            this.push(null);
        }
    }
}

class ObjectWritable extends Writable {
    constructor(options) {
        super({ ...options, objectMode: true });
        this.results = [];
    }

    _write(chunk, encoding, callback) {
        this.results.push(chunk);
        callback();
    }
}

const objectReadable = new ObjectReadable([
    { id: 1, name: '张三' },
    { id: 2, name: '李四' },
    { id: 3, name: '王五' }
]);

const objectWritable = new ObjectWritable();

pipeline(objectReadable, objectWritable, (err) => {
    if (err) {
        console.error('对象流处理失败:', err);
    } else {
        console.log('处理结果:', objectWritable.results);
    }
});

// 8. 背压机制详解
/**
 * 背压（Backpressure）是指数据生产速度超过消费速度时的问题
 * 不处理背压会导致内存溢出
 *
 * 场景：
 * 磁盘读取速度快，网络写入速度慢
 *
 * 解决方案：
 * 1. Writable.write() 返回false时暂停Readable
 * 2. Writable 'drain' 事件恢复Readable
 */

function backpressureExample() {
    const readable = fs.createReadStream('large-file.txt');
    const writable = fs.createWriteStream('network-output');

    readable.on('data', (chunk) => {
        const canContinue = writable.write(chunk);

        if (!canContinue) {
            // 暂停读取，等待drain事件
            readable.pause();

            writable.once('drain', () => {
                readable.resume();
            });
        }
    });

    // 或者使用pipeline自动处理背压
    pipeline(readable, writable, (err) => {
        if (err) {
            console.error('处理失败:', err);
        }
    });
}
```

### 3.3 高效文件处理

```javascript
/**
 * 实际应用中的文件处理模式
 */

// 1. 大文件处理 - 逐行读取
const readline = require('readline');

async function processLargeFile(filePath) {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let lineNumber = 0;
    let matchCount = 0;

    for await (const line of rl) {
        lineNumber++;
        if (line.includes('特定内容')) {
            matchCount++;
        }

        // 每处理10000行输出进度
        if (lineNumber % 10000 === 0) {
            console.log(`已处理 ${lineNumber} 行`);
        }
    }

    console.log(`处理完成，共 ${lineNumber} 行，匹配 ${matchCount} 次`);
}

// 2. CSV文件流式处理
const { parse } = require('csv-parse');

async function processCSV(inputPath, outputPath) {
    const inputStream = fs.createReadStream(inputPath);
    const outputStream = fs.createWriteStream(outputPath);
    const parser = parse({
        columns: true,  // 第一行作为列名
        skip_empty_lines: true
    });

    let recordCount = 0;
    const startTime = Date.now();

    parser.on('readable', async function() {
        let record;
        while ((record = parser.read()) !== null) {
            recordCount++;

            // 处理每条记录
            const processed = transformRecord(record);

            // 写入（这里简化处理）
            outputStream.write(JSON.stringify(processed) + '\n');
        }
    });

    parser.on('error', (err) => {
        console.error('CSV解析错误:', err);
    });

    parser.on('end', () => {
        const duration = Date.now() - startTime;
        console.log(`处理完成，共 ${recordCount} 条记录，耗时 ${duration}ms`);
        outputStream.end();
    });

    inputStream.pipe(parser);
}

function transformRecord(record) {
    return {
        ...record,
        timestamp: Date.now(),
        processed: true
    };
}

// 3. 多文件并发处理
async function processMultipleFiles(files, concurrency = 5) {
    const results = [];
    const executing = [];

    for (const file of files) {
        const promise = processFile(file)
            .then(result => {
                results.push({ file, result, success: true });
                executing.splice(executing.indexOf(promise), 1);
            })
            .catch(error => {
                results.push({ file, error: error.message, success: false });
                executing.splice(executing.indexOf(promise), 1);
            });

        executing.push(promise);

        if (executing.length >= concurrency) {
            await Promise.race(executing);
        }
    }

    await Promise.all(executing);
    return results;
}

async function processFile(filePath) {
    const content = await fs.promises.readFile(filePath, 'utf8');
    // 模拟处理
    await new Promise(resolve => setTimeout(resolve, 100));
    return content.length;
}

// 4. 文件监控
const chokidar = require('chokidar');

function watchDirectory(dirPath) {
    const watcher = chokidar.watch(dirPath, {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 2000,
            pollInterval: 100
        }
    });

    watcher
        .on('add', path => console.log(`文件添加: ${path}`))
        .on('change', path => console.log(`文件修改: ${path}`))
        .on('unlink', path => console.log(`文件删除: ${path}`))
        .on('error', error => console.error(`监控错误: ${error}`));

    return watcher;
}

// 5. 流式JSON处理
class JSONArrayStream extends Transform {
    constructor(options) {
        super({ ...options, readableObjectMode: true, writableObjectMode: true });
        this.buffer = '';
    }

    _transform(chunk, encoding, callback) {
        this.buffer += chunk.toString();

        // 按换行分割
        const lines = this.buffer.split('\n');
        this.buffer = lines.pop();  // 保留最后一行（可能不完整）

        for (const line of lines) {
            if (line.trim()) {
                try {
                    this.push(JSON.parse(line));
                } catch (e) {
                    // 忽略无效JSON
                }
            }
        }

        callback();
    }

    _flush(callback) {
        // 处理最后残留的数据
        if (this.buffer.trim()) {
            try {
                this.push(JSON.parse(this.buffer));
            } catch (e) {
                // 忽略
            }
        }
        callback();
    }
}

// 使用流式JSON处理
const inputStream = fs.createReadStream('data.jsonl');
const jsonStream = new JSONArrayStream();
const transform = new UpperCaseTransform();  // 使用之前的转换流

pipeline(inputStream, jsonStream, transform, (err) => {
    if (err) {
        console.error('处理失败:', err);
    } else {
        console.log('JSON流处理完成');
    }
});
```

---

## 4. 进程与集群管理

### 4.1 进程管理基础

```javascript
/**
 * Node.js进程管理API
 */

// 1. 进程信息
console.log('进程ID:', process.pid);
console.log('父进程ID:', process.ppid);
console.log('Node版本:', process.version);
console.log('平台:', process.platform);
console.log('架构:', process.arch);
console.log('工作目录:', process.cwd());
console.log('内存使用:', process.memoryUsage());

/**
 * memoryUsage() 返回：
 * {
 *   rss: 内存占用（Resident Set Size）
 *   heapTotal: 堆内存总量
 *   heapUsed: 堆内存使用量
 *   external: 外部内存（C++对象等）
 *   arrayBuffers: ArrayBuffer内存
 * }
 */

// 2. 进程信号处理
process.on('SIGTERM', () => {
    console.log('收到SIGTERM信号，准备优雅退出');
    // 清理资源
    closeConnections();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('收到SIGINT信号（Ctrl+C）');
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', error);
    // 记录错误日志
    fs.promises.appendFile(
        'error.log',
        `${new Date().toISOString()} - ${error.stack}\n`
    );
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的Promise拒绝:', reason);
});

// 3. 进程环境变量
console.log('环境:', process.env.NODE_ENV);
console.log('PATH:', process.env.PATH);

// 设置环境变量
process.env.DEBUG = 'app:*';
process.env.PORT = '3000';

// 4. 进程资源限制
if (process.platform === 'linux') {
    // 设置内存限制（需要root权限）
    // process.resourceUsage((err, usage) => {
    //     console.log('资源使用:', usage);
    // });
}

// 5. 进程输出
// stdout - 标准输出
process.stdout.write('Hello from stdout\n');

// stderr - 标准错误
process.stderr.write('Hello from stderr\n');

// 格式化输出
console.log('格式化输出: %s, %d', 'string', 123);
console.error('错误输出');

// 6. 进程退出
/**
 * process.exit(code):
 * - 0: 正常退出
 * - 1: 异常退出
 * - 2: 误用exit()（已废弃）
 */

// 退出码示例
function exitWithCode(success) {
    if (success) {
        console.log('执行成功');
        process.exit(0);
    } else {
        console.error('执行失败');
        process.exit(1);
    }
}

// 7. process.nextTick vs setImmediate
console.log('1. 开始');

process.nextTick(() => {
    console.log('2. nextTick回调');
});

setImmediate(() => {
    console.log('3. setImmediate回调');
});

console.log('4. 结束');

// 输出：1. 开始, 4. 结束, 2. nextTick回调, 3. setImmediate回调

// 8. 监控进程内存
setInterval(() => {
    const mem = process.memoryUsage();
    console.log('内存使用:');
    console.log(`  RSS: ${(mem.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Heap Used: ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Heap Total: ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`);
}, 5000);

// 9. 进程命令参数
console.log('命令行参数:', process.argv);
/**
 * process.argv 返回：
 * [node路径, 脚本路径, arg1, arg2, ...]
 */

// 解析命令行参数
const args = process.argv.slice(2);
const options = {};

for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
        const key = args[i].slice(2);
        const value = args[i + 1] && !args[i + 1].startsWith('--')
            ? args[++i]
            : true;
        options[key] = value;
    }
}

console.log('解析后的选项:', options);
```

### 4.2 Child Process子进程管理

```javascript
/**
 * Node.js子进程模块 - 用于执行系统命令和运行其他脚本
 */

const { spawn, exec, execFile, fork, ChildProcess } = require('child_process');

// 1. spawn - 流式处理，适合大输出
// 启动一个子进程
const child = spawn('find', ['.', '-type', 'f', '-name', '*.js'], {
    cwd: '/tmp',
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe']
});

child.stdout.on('data', (data) => {
    console.log('stdout:', data.toString());
});

child.stderr.on('data', (data) => {
    console.error('stderr:', data.toString());
});

child.on('close', (code) => {
    console.log('子进程退出，代码:', code);
});

child.on('error', (err) => {
    console.error('子进程错误:', err);
});

// 2. exec - 一次性执行，适合小输出
exec('ls -la', (error, stdout, stderr) => {
    if (error) {
        console.error('执行错误:', error);
        return;
    }
    if (stderr) {
        console.error('stderr:', stderr);
    }
    console.log('stdout:', stdout);
});

// exec with promise
function execPromise(command, options = {}) {
    return new Promise((resolve, reject) => {
        exec(command, options, (error, stdout, stderr) => {
            if (error) {
                reject({ error, stderr });
            } else {
                resolve({ stdout, stderr });
            }
        });
    });
}

async function runCommand() {
    try {
        const { stdout } = await execPromise('ls -la');
        console.log(stdout);
    } catch ({ error, stderr }) {
        console.error('命令失败:', stderr);
    }
}

// 3. execFile - 执行文件
// 不通过shell执行，更安全
execFile('node', ['--version'], (error, stdout, stderr) => {
    if (error) {
        console.error('执行错误:', error);
        return;
    }
    console.log('Node版本:', stdout);
});

// 4. fork - 创建Node.js子进程
// 用于运行Node.js模块
const child = fork('./child-script.js', ['arg1', 'arg2'], {
    silent: true  // 将stdio绑定到父进程
});

// 发送消息到子进程
child.send({ type: 'hello', data: 'world' });

// 接收子进程消息
child.on('message', (message) => {
    console.log('收到子进程消息:', message);
});

// 子进程脚本 child-script.js
/**
 * process.on('message', (message) => {
 *     console.log('收到父进程消息:', message);
 *
 *     // 发送消息回父进程
 *     process.send({ received: message });
 * });
 */

// 5. 进程间通信示例
// 主进程
function mainProcess() {
    const child = fork('./compute-worker.js');

    // 发送计算任务
    child.send({ numbers: [1, 2, 3, 4, 5] });

    child.on('message', (result) => {
        console.log('计算结果:', result.sum);
    });

    child.on('exit', (code) => {
        console.log('工作进程退出，代码:', code);
    });
}

// 工作进程 compute-worker.js
/**
 * process.on('message', ({ numbers }) => {
 *     const sum = numbers.reduce((a, b) => a + b, 0);
 *     process.send({ sum });
 *     process.exit(0);
 * });
 */

// 6. 子进程管理类
class ProcessManager {
    constructor() {
        this.processes = new Map();
        this.idCounter = 0;
    }

    // 启动进程
    spawn(command, args, options = {}) {
        const id = ++this.idCounter;
        const child = spawn(command, args, {
            ...options,
            stdio: ['ignore', 'pipe', 'pipe']
        });

        const processInfo = {
            id,
            child,
            command,
            startTime: Date.now(),
            status: 'running'
        };

        child.stdout.on('data', (data) => {
            console.log(`[进程${id}] stdout:`, data.toString());
        });

        child.stderr.on('data', (data) => {
            console.error(`[进程${id}] stderr:`, data.toString());
        });

        child.on('close', (code) => {
            processInfo.status = 'exited';
            processInfo.exitCode = code;
            console.log(`[进程${id}] 退出，代码: ${code}`);
        });

        child.on('error', (err) => {
            console.error(`[进程${id}] 错误:`, err);
            processInfo.status = 'error';
        });

        this.processes.set(id, processInfo);
        return id;
    }

    // 杀掉进程
    kill(id) {
        const processInfo = this.processes.get(id);
        if (processInfo && processInfo.status === 'running') {
            processInfo.child.kill('SIGTERM');
        }
    }

    // 杀掉所有进程
    killAll() {
        for (const [id, info] of this.processes) {
            if (info.status === 'running') {
                info.child.kill('SIGTERM');
            }
        }
    }

    // 获取进程状态
    getStatus(id) {
        return this.processes.get(id);
    }

    // 获取所有进程
    getAllProcesses() {
        return Array.from(this.processes.values());
    }
}

// 7. Shell脚本执行
async function executeShellScript(script) {
    return new Promise((resolve, reject) => {
        const child = exec(`/bin/bash -c "${script.replace(/"/g, '\\"')}"`, {
            maxBuffer: 1024 * 1024 * 10  // 10MB
        }, (error, stdout, stderr) => {
            if (error) {
                reject({ error, stderr });
            } else {
                resolve({ stdout, stderr });
            }
        });

        child.stdout.pipe(process.stdout);
        child.stderr.pipe(process.stderr);
    });
}

// 8. 进程池
class ProcessPool {
    constructor(workerPath, poolSize = 4) {
        this.workerPath = workerPath;
        this.poolSize = poolSize;
        this.available = [];
        this.busy = [];

        // 初始化进程池
        for (let i = 0; i < poolSize; i++) {
            this.available.push(this.createWorker());
        }
    }

    createWorker() {
        const worker = fork(this.workerPath);

        worker.on('message', (result) => {
            // 完成任务，将进程移回可用队列
            const index = this.busy.indexOf(worker);
            if (index > -1) {
                this.busy.splice(index, 1);
                this.available.push(worker);
            }
        });

        worker.on('exit', () => {
            // 进程退出，创建新进程
            const index = this.available.indexOf(worker);
            if (index > -1) {
                this.available.splice(index, 1);
            }
            this.available.push(this.createWorker());
        });

        return worker;
    }

    async executeTask(task) {
        if (this.available.length === 0) {
            // 等待可用进程
            await new Promise(resolve => setTimeout(resolve, 100));
            return this.executeTask(task);
        }

        const worker = this.available.pop();
        this.busy.push(worker);

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                worker.kill();
                reject(new Error('任务超时'));
            }, 30000);

            const handler = (result) => {
                clearTimeout(timeout);
                worker.off('message', handler);
                resolve(result);
            };

            worker.on('message', handler);
            worker.send(task);
        });
    }

    destroy() {
        for (const worker of [...this.available, ...this.busy]) {
            worker.kill();
        }
    }
}
```

### 4.3 集群模式

```javascript
/**
 * Node.js cluster模块 - 实现多进程服务器
 */

const cluster = require('cluster');
const os = require('os');

/**
 * 集群架构：
 *
 * 主进程（Master）
 *     │
 *     ├── Worker 1 ──→ 处理请求
 *     ├── Worker 2 ──→ 处理请求
 *     ├── Worker 3 ──→ 处理请求
 *     └── Worker 4 ──→ 处理请求
 *
 * 优点：
 * - 利用多核CPU
 * - 提高应用稳定性
 * - 无缝重启/升级
 */

if (cluster.isMaster) {
    const numCPUs = os.cpus().length;
    console.log(`主进程 ${process.pid} 启动`);
    console.log(`检测到 ${numCPUs} 个CPU核心`);

    // 创建工作进程
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    // 监听工作进程退出
    cluster.on('exit', (worker, code, signal) => {
        console.log(`工作进程 ${worker.process.pid} 退出`);
        console.log(`退出代码: ${code}, 信号: ${signal}`);

        // 如果工作进程异常退出，重新启动
        if (code !== 0) {
            console.log('工作进程异常退出，重新启动...');
            cluster.fork();
        }
    });

    // 工作进程上线
    cluster.on('listening', (worker, address) => {
        console.log(`工作进程 ${worker.process.pid} 正在监听 ${address.address}:${address.port}`);
    });

} else {
    // 工作进程运行HTTP服务器
    const http = require('http');

    const server = http.createServer((req, res) => {
        console.log(`请求来自工作进程 ${process.pid}`);

        res.writeHead(200);
        res.end(`Hello from worker ${process.pid}\n`);
    });

    server.listen(3000, () => {
        console.log(`工作进程 ${process.pid} 启动，监听3000端口`);
    });
}

// 增强版集群管理
class EnhancedCluster {
    constructor(options = {}) {
        this.port = options.port || 3000;
        this.workers = options.workers || os.cpus().length;
        this.maxRetries = options.maxRetries || 3;
        this.retryDelay = options.retryDelay || 5000;
        this.workers = new Map();
    }

    start() {
        if (cluster.isMaster) {
            console.log(`主进程 ${process.pid} 启动`);

            // 创建工作进程
            for (let i = 0; i < this.workers; i++) {
                this.createWorker();
            }

            // 监听退出
            cluster.on('exit', (worker, code, signal) => {
                const info = this.workers.get(worker.id);
                console.log(`工作进程 ${worker.process.pid} 退出`);

                // 如果超过最大重试次数，不再重启
                if (info.retryCount >= this.maxRetries) {
                    console.log(`工作进程已达到最大重试次数，不再重启`);
                    this.workers.delete(worker.id);
                    return;
                }

                // 延迟重启
                info.retryCount++;
                console.log(`${this.retryDelay}ms后重启工作进程...`);

                setTimeout(() => {
                    const newWorker = cluster.fork();
                    this.workers.set(newWorker.id, {
                        pid: newWorker.process.pid,
                        startTime: Date.now(),
                        retryCount: info.retryCount,
                        restartCount: info.restartCount + 1
                    });
                }, this.retryDelay);
            });

            //优雅关闭
            process.on('SIGTERM', () => this.shutdown());
            process.on('SIGINT', () => this.shutdown());

        } else {
            // 工作进程运行服务器
            this.startServer();
        }
    }

    createWorker() {
        const worker = cluster.fork();
        this.workers.set(worker.id, {
            pid: worker.process.pid,
            startTime: Date.now(),
            retryCount: 0,
            restartCount: 0
        });
        console.log(`创建工作进程 ${worker.process.pid}`);
        return worker;
    }

    startServer() {
        const http = require('http');

        const server = http.createServer((req, res) => {
            res.writeHead(200);
            res.end(`Worker ${process.pid}\n`);
        });

        server.listen(this.port, () => {
            console.log(`Worker ${process.pid} 监听端口 ${this.port}`);
        });

        // 处理优雅关闭
        server.on('close', () => {
            console.log(`Worker ${process.pid} 关闭`);
        });
    }

    async shutdown() {
        console.log('收到关闭信号，正在关闭集群...');

        // 通知所有工作进程关闭
        for (const worker of Object.values(cluster.workers)) {
            worker.process.kill('SIGTERM');
        }

        // 等待所有工作进程退出
        await new Promise(resolve => {
            cluster.on('exit', () => {
                if (Object.keys(cluster.workers).length === 0) {
                    resolve();
                }
            });
        });

        console.log('所有工作进程已关闭');
        process.exit(0);
    }

    // 获取集群状态
    getStatus() {
        const status = {
            master: { pid: process.pid },
            workers: []
        };

        for (const [id, info] of this.workers) {
            status.workers.push({
                id,
                pid: info.pid,
                uptime: Date.now() - info.startTime,
                restartCount: info.restartCount
            });
        }

        return status;
    }
}

// PM2风格的进程管理（简化版）
const pm2Like = {
    processes: [],

    start(script, options = {}) {
        const name = options.name || script;
        const instances = options.instances || 1;

        for (let i = 0; i < instances; i++) {
            const worker = cluster.fork();
            this.processes.push({
                name,
                pid: worker.process.pid,
                id: worker.id,
                status: 'online',
                restart_time: 0,
                pm_id: this.processes.length
            });
        }

        return this.processes;
    },

    stop(name) {
        for (const worker of Object.values(cluster.workers)) {
            if (worker.process.pid === this.getProcess(name).pid) {
                worker.process.kill();
            }
        }
    },

    restart(name) {
        this.stop(name);
        this.start(name);
    },

    getProcess(name) {
        return this.processes.find(p => p.name === name);
    },

    list() {
        return this.processes;
    }
};
```

---

## 5. 内存管理与性能优化

### 5.1 内存管理机制

```javascript
/**
 * Node.js内存管理详解
 */

// 1. 内存使用分析
function analyzeMemory() {
    const mem = process.memoryUsage();

    console.log('=== 内存使用分析 ===');
    console.log(`堆内存总量: ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`堆内存使用: ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`物理内存(RSS): ${(mem.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`外部内存: ${(mem.external / 1024 / 1024).toFixed(2)} MB`);
    console.log(`内存使用率: ${((mem.heapUsed / mem.heapTotal) * 100).toFixed(2)}%`);
}

analyzeMemory();

// 2. V8垃圾回收机制
/**
 * V8垃圾回收策略：
 *
 * 1. 新生代（Scavenge）- 快速回收，存活时间短的对象
 *    - From Space / To Space
 *    - 对象晋升条件：经历过两次GC或To Space已使用超过25%
 *
 * 2. 老生代（Mark-Sweep & Mark-Compact）
 *    - 对象存活时间长
 *    - 标记-清除 / 标记-整理
 *
 * 3. 增量标记（Incremental Marking）
 *    - 分批执行，减少GC停顿时间
 *
 * 4. 并行GC / 并发GC
 *    - 多线程GC，减少停顿时间
 */

// 3. 常见内存泄漏及解决方案

// 泄漏1：全局变量
function leak1() {
    // ❌ 错误：创建隐式全局变量
    leakData = createLargeArray();

    // ✅ 正确：使用局部变量或显式声明
    const data = createLargeArray();
    return data;
}

// 泄漏2：未清理的定时器
function leak2() {
    // ❌ 错误：定时器永不清理
    setInterval(() => {
        const data = fetchData();
        console.log(data);
    }, 1000);

    // ✅ 正确：保存定时器ID并清理
    const timerId = setInterval(() => {
        const data = fetchData();
        console.log(data);
    }, 1000);

    // 在合适时机清理
    clearInterval(timerId);
}

// 泄漏3：闭包引用
function leak3() {
    // ❌ 错误：闭包持有大对象引用
    const largeObject = new Array(1000000);

    return function() {
        console.log('闭包函数');
    };
    // largeObject无法被回收

    // ✅ 正确：及时释放引用
    function createCleanClosure() {
        const largeObject = new Array(1000000);

        function closure() {
            console.log('处理数据');
        }

        // 使用完后清空
        largeObject = null;

        return closure;
    }
}

// 泄漏4：事件监听器未移除
class EventEmitter {
    constructor() {
        this.handlers = [];
    }

    on(event, handler) {
        if (event === 'data') {
            document.addEventListener('click', handler);
            this.handlers.push({ event, handler });
        }
    }

    // ❌ 错误：没有off方法
    // ✅ 正确：添加off方法清理监听器
    off(event, handler) {
        if (event === 'data') {
            document.removeEventListener('click', handler);
            this.handlers = this.handlers.filter(h => h.handler !== handler);
        }
    }

    destroy() {
        // 清理所有监听器
        for (const { event, handler } of this.handlers) {
            document.removeEventListener(event, handler);
        }
        this.handlers = [];
    }
}

// 泄漏5：缓存未清理
class Cache {
    constructor(maxSize) {
        this.maxSize = maxSize;
        this.cache = new Map();
    }

    set(key, value) {
        if (this.cache.size >= this.maxSize) {
            // 删除最早的条目
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    }

    get(key) {
        return this.cache.get(key);
    }

    // 添加清理方法
    clear() {
        this.cache.clear();
    }

    // 添加过期清理
    setWithExpiry(key, value, ttl) {
        this.set(key, value);
        setTimeout(() => {
            this.cache.delete(key);
        }, ttl);
    }
}

// 4. WeakMap和WeakSet
function weakCollections() {
    // WeakMap不会阻止对象被垃圾回收
    const weakMap = new WeakMap();

    function processData(obj) {
        const metadata = { processed: true, timestamp: Date.now() };
        weakMap.set(obj, metadata);

        // obj被垃圾回收后，metadata也会自动被回收
    }

    const data = { id: 1, content: 'test' };
    processData(data);

    // data被回收后，WeakMap中的条目也会消失
}

// 5. 对象池模式
class ObjectPool {
    constructor(factory, resetFn, initialSize = 10) {
        this.factory = factory;
        this.resetFn = resetFn;
        this.pool = [];

        // 预创建对象
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(factory());
        }
    }

    acquire() {
        if (this.pool.length > 0) {
            return this.pool.pop();
        }
        return this.factory();
    }

    release(obj) {
        if (this.resetFn) {
            this.resetFn(obj);
        }
        this.pool.push(obj);
    }
}

// 使用对象池
const bufferPool = new ObjectPool(
    () => Buffer.alloc(1024),
    (buf) => buf.fill(0),
    100
);

// 6. 内存监控和告警
class MemoryMonitor {
    constructor(options = {}) {
        this.threshold = options.threshold || 0.8;  // 80%告警
        this.interval = options.interval || 5000;
        this.callback = options.callback || console.warn;

        this.startMonitoring();
    }

    startMonitoring() {
        this.timer = setInterval(() => {
            const mem = process.memoryUsage();
            const usageRatio = mem.heapUsed / mem.heapTotal;

            if (usageRatio > this.threshold) {
                this.callback({
                    type: 'memory_warning',
                    usage: (usageRatio * 100).toFixed(2) + '%',
                    heapUsed: (mem.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
                    heapTotal: (mem.heapTotal / 1024 / 1024).toFixed(2) + ' MB'
                });

                // 触发GC（仅在V8中可用）
                if (global.gc) {
                    console.log('触发手动GC');
                    global.gc();
                }
            }
        }, this.interval);
    }

    stopMonitoring() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
}

// 7. 大数据处理优化
async function processLargeData(data) {
    // ❌ 错误：一次性处理所有数据
    const result = data.map(item => heavyProcess(item));

    // ✅ 正确：分批处理
    const BATCH_SIZE = 1000;
    const results = [];

    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
            batch.map(item => heavyProcess(item))
        );
        results.push(...batchResults);

        // 让出事件循环
        await new Promise(resolve => setImmediate(resolve));
    }

    return results;
}

// 8. 流式处理大文件
function streamLargeFile(inputPath, outputPath, transform) {
    const readStream = fs.createReadStream(inputPath);
    const writeStream = fs.createWriteStream(outputPath);

    let totalBytes = 0;
    let processedBytes = 0;

    readStream.on('data', (chunk) => {
        totalBytes += chunk.length;
    });

    const transformStream = new Transform({
        objectMode: false,
        transform(chunk, encoding, callback) {
            const result = transform(chunk);
            processedBytes += result.length;
            callback(null, result);
        }
    });

    return new Promise((resolve, reject) => {
        pipeline(readStream, transformStream, writeStream, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve({ totalBytes, processedBytes });
            }
        });
    });
}

// 9. 内存分析工具
function memorySnapshot() {
    // 使用 --inspect 启动后，可以用Chrome DevTools进行内存分析
    // 命令行: node --inspect server.js

    // 或使用heapdump模块
    const heapdump = require('heapdump');

    // 手动生成快照
    heapdump.writeSnapshot('./heapdump-' + Date.now() + '.heapsnapshot');

    // 信号触发快照
    process.on('SIGUSR2', () => {
        heapdump.writeSnapshot('./heapdump-' + Date.now() + '.heapsnapshot');
    });
}

// 10. 性能分析
const profiler = require('v8-profiler');

function startProfiling() {
    profiler.startProfiling('CPU-profile');

    setTimeout(() => {
        const profile = profiler.stopProfiling('CPU-profile');
        profile.export((error, result) => {
            fs.writeFileSync('./profile.cpuprofile', result);
            profile.delete();
        });
    }, 10000);
}
```

### 5.2 性能分析与优化

```javascript
/**
 * Node.js性能优化实战
 */

// 1. 高性能代码模式

// 模式1：避免重复计算
// ❌ 错误
function badCalculate(items) {
    return items.map(item => {
        const factor = computeExpensiveFactor();  // 每次都计算
        return item.value * factor;
    });
}

// ✅ 正确
function goodCalculate(items) {
    const factor = computeExpensiveFactor();  // 只计算一次
    return items.map(item => item.value * factor);
}

// 模式2：使用Map替代Object进行频繁查找
// ❌ 错误
function badLookup(items, id) {
    return items.find(item => item.id === id);
}

// ✅ 正确
const itemsMap = new Map(items.map(item => [item.id, item]));
function goodLookup(id) {
    return itemsMap.get(id);
}

// 模式3：避免try-catch在热路径中
// ❌ 错误
function badHotPath(items) {
    for (const item of items) {
        try {
            processItem(item);
        } catch (e) {
            console.error(e);
        }
    }
}

// ✅ 正确
function goodHotPath(items) {
    for (const item of items) {
        if (isValid(item)) {
            processItem(item);
        }
    }
}

// 模式4：使用位移替代数学运算
// ❌ 错误
const result = value * 2;

// ✅ 正确
const result = value << 1;

// 2. 异步操作优化
async function optimizeAsync() {
    // ❌ 错误：串行异步操作
    const a = await fetchA();
    const b = await fetchB();
    const c = await fetchC();

    // ✅ 正确：并行异步操作
    const [a, b, c] = await Promise.all([fetchA(), fetchB(), fetchC()]);

    // ⚠️ 注意：有时需要串行（如有依赖关系）
}

// 3. 字符串拼接优化
function optimizeStringConcat() {
    // ❌ 错误：多次字符串拼接
    let result = '';
    for (const item of largeArray) {
        result += item.name + ',' + item.value + '\n';
    }

    // ✅ 正确：使用数组join
    const lines = largeArray.map(item =>
        `${item.name},${item.value}`
    );
    const result = lines.join('\n');

    // ✅ 正确：使用Buffer（大量字符串时）
    const chunks = [];
    for (const item of largeArray) {
        chunks.push(Buffer.from(`${item.name},${item.value}\n`));
    }
    const bufferResult = Buffer.concat(chunks);
}

// 4. 正则表达式优化
function optimizeRegex() {
    // ❌ 错误：在循环中创建正则
    for (const text of texts) {
        const match = text.match(/\d+/g);  // 每次创建正则
    }

    // ✅ 正确：预编译正则
    const regex = /\d+/g;
    for (const text of texts) {
        const match = text.match(regex);
    }

    // ❌ 错误：使用不高效的正则
    const badPattern = /(.*)@(.*)/;  // 贪婪匹配

    // ✅ 正确：精确匹配
    const goodPattern = /(\w+)@(\w+)/;
}

// 5. HTTP请求优化
const http = require('http');

// ❌ 错误：每次请求都创建新的agent
async function badHttpRequest() {
    const result = await fetch('http://api.example.com/data');
    return result;
}

// ✅ 正确：使用keep-alive连接池
const agent = new http.Agent({
    keepAlive: true,
    keepAliveMsecs: 10000,
    maxSockets: 10
});

async function goodHttpRequest() {
    return fetch('http://api.example.com/data', { agent });
}

// 6. 缓存优化
class LRUCache {
    constructor(maxSize) {
        this.maxSize = maxSize;
        this.cache = new Map();
    }

    get(key) {
        if (!this.cache.has(key)) {
            return undefined;
        }

        // 移动到末尾（最近使用）
        const value = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, value);

        return value;
    }

    set(key, value) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxSize) {
            // 删除最旧的
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }

        this.cache.set(key, value);
    }

    clear() {
        this.cache.clear();
    }
}

// 7. 数据库连接池优化
const { Pool } = require('pg');

const pool = new Pool({
    // 连接池大小
    min: 2,
    max: 20,

    // 连接超时
    connectionTimeoutMillis: 10000,

    // 空闲超时
    idleTimeoutMillis: 30000,

    // 自动获取连接
    allowExitOnIdle: false
});

async function query(sql, params) {
    const start = Date.now();

    try {
        const result = await pool.query(sql, params);
        const duration = Date.now() - start;

        // 慢查询日志
        if (duration > 100) {
            console.warn(`慢查询 (${duration}ms): ${sql}`);
        }

        return result;
    } catch (error) {
        console.error('查询失败:', error);
        throw error;
    }
}

// 8. 性能基准测试
const Benchmark = require('benchmark');

const suite = new Benchmark.Suite();

suite
    .add('Array#push', () => {
        const arr = [];
        for (let i = 0; i < 1000; i++) {
            arr.push(i);
        }
    })
    .add('Array#concat', () => {
        let arr = [];
        for (let i = 0; i < 1000; i++) {
            arr = arr.concat([i]);
        }
    })
    .on('cycle', (event) => {
        console.log(String(event.target));
    })
    .on('complete', function() {
        console.log('最快: ' + this.filter('fastest').map('name'));
    })
    .run({ async: true });

// 9. 异步性能分析
const async_hooks = require('async_hooks');

const hook = async_hooks.createHook({
    init(asyncId, type, triggerAsyncId) {
        // console.log(`Init: ${type} (${asyncId}), triggered by ${triggerAsyncId}`);
    },
    before(asyncId) {
        // console.log(`Before: ${asyncId}`);
    },
    after(asyncId) {
        // console.log(`After: ${asyncId}`);
    },
    destroy(asyncId) {
        // console.log(`Destroy: ${asyncId}`);
    }
});

hook.enable();
```

---

## 6. Node.js网络编程实战

### 6.1 HTTP服务器与客户端

```javascript
/**
 * Node.js HTTP模块实战
 */

const http = require('http');
const https = require('https');
const url = require('url');

// 1. 创建HTTP服务器
const server = http.createServer((req, res) => {
    // 解析URL
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;

    // 获取请求方法
    const method = req.method;

    // 获取请求头
    const contentType = req.headers['content-type'];
    const userAgent = req.headers['user-agent'];

    // 获取请求体
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        // 路由处理
        if (pathname === '/api/users' && method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ users: [] }));
        } else if (pathname === '/api/users' && method === 'POST') {
            const user = JSON.parse(body);
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ id: 1, ...user }));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not Found' }));
        }
    });
});

server.listen(3000, () => {
    console.log('HTTP服务器运行在 http://localhost:3000');
});

// 2. HTTP客户端请求
function httpClient() {
    // GET请求
    const options = {
        hostname: 'api.example.com',
        port: 443,
        path: '/users?page=1&limit=10',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer token',
            'Accept': 'application/json'
        }
    };

    const req = https.request(options, (res) => {
        console.log('状态码:', res.statusCode);
        console.log('响应头:', res.headers);

        let data = '';
        res.on('data', chunk => {
            data += chunk;
        });

        res.on('end', () => {
            const result = JSON.parse(data);
            console.log('响应数据:', result);
        });
    });

    req.on('error', (error) => {
        console.error('请求错误:', error);
    });

    req.end();

    // POST请求
    const postData = JSON.stringify({
        name: '张三',
        email: 'zhangsan@example.com'
    });

    const postOptions = {
        hostname: 'api.example.com',
        port: 443,
        path: '/users',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const postReq = https.request(postOptions, (res) => {
        let data = '';
        res.on('data', chunk => {
            data += chunk;
        });
        res.on('end', () => {
            console.log('创建成功:', data);
        });
    });

    postReq.write(postData);
    postReq.end();
}

// 3. HTTP/2服务器
const http2 = require('http2');
const fs = require('fs');

const serverKey = fs.readFileSync('server-key.pem');
const serverCert = fs.readFileSync('server-cert.pem');

const server2 = http2.createSecureServer({
    key: serverKey,
    cert: serverCert
});

server2.on('stream', (stream, headers) => {
    const path = headers[':path'];

    if (path === '/') {
        stream.respond({
            'content-type': 'text/html',
            ':status': 200
        });
        stream.end('<h1>HTTP/2 Server</h1>');
    } else {
        stream.respond({
            'content-type': 'application/json',
            ':status': 404
        });
        stream.end(JSON.stringify({ error: 'Not Found' }));
    }
});

server2.listen(8443, () => {
    console.log('HTTP/2服务器运行在 https://localhost:8443');
});

// 4. WebSocket服务器
const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('WebSocket客户端连接');

    // 接收消息
    ws.on('message', (message) => {
        console.log('收到消息:', message.toString());

        // 广播给所有客户端
        wss.clients.forEach(client => {
            if (client.readyState === 1) {  // OPEN
                client.send(`服务器收到: ${message}`);
            }
        });
    });

    // 发送欢迎消息
    ws.send('欢迎连接到WebSocket服务器');

    // 处理关闭
    ws.on('close', () => {
        console.log('客户端断开连接');
    });

    // 处理错误
    ws.on('error', (error) => {
        console.error('WebSocket错误:', error);
    });
});

// 定时广播
setInterval(() => {
    wss.clients.forEach(client => {
        if (client.readyState === 1) {
            client.send(`服务器心跳: ${Date.now()}`);
        }
    });
}, 30000);

// 5. TCP服务器
const net = require('net');

const tcpServer = net.createServer((socket) => {
    console.log('TCP客户端连接:', socket.remoteAddress, socket.remotePort);

    // 设置编码
    socket.setEncoding('utf8');

    // 接收数据
    socket.on('data', (data) => {
        console.log('收到数据:', data);

        // 回显数据
        socket.write('服务器收到: ' + data);
    });

    // 客户端关闭连接
    socket.on('close', () => {
        console.log('TCP客户端断开连接');
    });

    // 处理错误
    socket.on('error', (error) => {
        console.error('TCP错误:', error);
    });

    // 设置超时
    socket.setTimeout(60000, () => {
        socket.write('连接超时，正在关闭...');
        socket.end();
    });
});

tcpServer.listen(8080, () => {
    console.log('TCP服务器运行在 0.0.0.0:8080');
});

// 6. TCP客户端
function tcpClient() {
    const client = net.createConnection({
        host: 'localhost',
        port: 8080
    });

    client.on('connect', () => {
        console.log('已连接到服务器');
        client.write('Hello, Server!');
    });

    client.on('data', (data) => {
        console.log('收到服务器响应:', data.toString());
    });

    client.on('close', () => {
        console.log('连接已关闭');
    });

    client.on('error', (error) => {
        console.error('连接错误:', error);
    });
}

// 7. UDP服务器
const dgram = require('dgram');

const udpServer = dgram.createSocket('udp4');

udpServer.on('message', (msg, rinfo) => {
    console.log(`收到来自 ${rinfo.address}:${rinfo.port} 的消息: ${msg}`);

    // 发送响应
    const response = Buffer.from('UDP服务器收到消息');
    udpServer.send(response, rinfo.port, rinfo.address);
});

udpServer.on('listening', () => {
    const address = udpServer.address();
    console.log(`UDP服务器运行在 ${address.address}:${address.port}`);
});

udpServer.bind(41234);

// 8. 请求路由系统
class Router {
    constructor() {
        this.routes = [];
    }

    add(method, path, handler) {
        // 将路径转换为正则
        const paramNames = [];
        const pattern = path.replace(/:([^/]+)/g, (_, name) => {
            paramNames.push(name);
            return '([^/]+)';
        });

        this.routes.push({
            method,
            pattern: new RegExp(`^${pattern}$`),
            paramNames,
            handler
        });
    }

    get(path, handler) {
        this.add('GET', path, handler);
    }

    post(path, handler) {
        this.add('POST', path, handler);
    }

    handle(req, res) {
        const pathname = url.parse(req.url).pathname;

        for (const route of this.routes) {
            if (route.method !== req.method) continue;

            const match = pathname.match(route.pattern);
            if (match) {
                // 提取参数
                const params = {};
                route.paramNames.forEach((name, index) => {
                    params[name] = match[index + 1];
                });

                // 调用处理函数
                route.handler(req, res, params);
                return;
            }
        }

        res.writeHead(404);
        res.end('Not Found');
    }
}

// 使用路由
const router = new Router();

router.get('/users/:id', (req, res, params) => {
    res.end(`获取用户 ${params.id}`);
});

router.post('/users', (req, res, params) => {
    let body = '';
    req.on('data', chunk => {
        body += chunk;
    });
    req.on('end', () => {
        res.end('创建用户: ' + body);
    });
});

// 9. 中间件系统
function createMiddlewareStack() {
    const middlewares = [];

    const use = (middleware) => {
        middlewares.push(middleware);
    };

    const handle = (req, res) => {
        let index = 0;

        const next = () => {
            if (index >= middlewares.length) {
                return;
            }

            const middleware = middlewares[index++];
            middleware(req, res, next);
        };

        next();
    };

    return { use, handle };
}

// 创建中间件栈
const stack = createMiddlewareStack();

// 添加中间件
stack.use((req, res, next) => {
    console.log('1. 请求开始:', req.method, req.url);
    req.startTime = Date.now();
    next();
});

stack.use((req, res, next) => {
    console.log('2. 解析请求体...');
    let body = '';
    req.on('data', chunk => {
        body += chunk;
    });
    req.on('end', () => {
        req.body = body ? JSON.parse(body) : {};
        next();
    });
});

stack.use((req, res, next) => {
    console.log('3. 路由处理...');
    // 调用router.handle(req, res)
    next();
});

// 10. HTTPS配置
const https2 = require('https');
const sslOptions = {
    key: fs.readFileSync('server-key.pem'),
    cert: fs.readFileSync('server-cert.pem'),
    ca: fs.readFileSync('ca-cert.pem'),

    // TLS版本控制
    minVersion: 'TLSv1.2',

    // 密码套件
    ciphers: [
        'ECDHE-RSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES256-GCM-SHA384'
    ].join(':'),

    // 客户端证书验证
    requestCert: true,
    rejectUnauthorized: true
};

const secureServer = https2.createServer(sslOptions, (req, res) => {
    res.writeHead(200);
    res.end('Secure Connection');
});
```

### 6.2 网络工具与调试

```javascript
/**
 * Node.js网络调试工具
 */

const net = require('net');
const dns = require('dns');
const {lookup} = dns.promises;

// 1. DNS查询
async function dnsLookup() {
    // 解析域名
    const address = await lookup('example.com');
    console.log('IPv4地址:', address.address);
    console.log('地址类型:', address.family);  // 4=IPv4, 6=IPv6

    // 查找所有IP（轮询）
    dns.resolve4('example.com', (err, addresses) => {
        if (err) {
            console.error('DNS解析错误:', err);
            return;
        }
        console.log('所有IPv4地址:', addresses);
    });

    // 反向DNS
    dns.reverse('93.184.216.34', (err, hostnames) => {
        if (err) {
            console.error('反向DNS错误:', err);
            return;
        }
        console.log('主机名:', hostnames);
    });
}

// 2. 端口扫描
async function scanPort(host, port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();

        socket.setTimeout(3000);

        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });

        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });

        socket.on('error', () => {
            socket.destroy();
            resolve(false);
        });

        socket.connect(port, host);
    });
}

async function scanPorts(host, ports) {
    const results = [];

    for (const port of ports) {
        const isOpen = await scanPort(host, port);
        results.push({ port, isOpen });
        console.log(`端口 ${port}: ${isOpen ? '开放' : '关闭'}`);
    }

    return results;
}

// 3. 连接池管理
class ConnectionPool {
    constructor(options = {}) {
        this.host = options.host;
        this.port = options.port;
        this.maxConnections = options.maxConnections || 10;
        this.connections = [];
        this.waiting = [];

        // 初始化连接
        this.init();
    }

    async init() {
        for (let i = 0; i < this.maxConnections; i++) {
            const conn = await this.createConnection();
            this.connections.push(conn);
        }
    }

    createConnection() {
        return new Promise((resolve, reject) => {
            const socket = new net.Socket();

            socket.connect(this.port, this.host, () => {
                resolve(socket);
            });

            socket.on('error', reject);
        });
    }

    async acquire() {
        if (this.connections.length > 0) {
            return this.connections.pop();
        }

        return new Promise((resolve) => {
            this.waiting.push(resolve);
        });
    }

    release(connection) {
        if (this.waiting.length > 0) {
            const resolve = this.waiting.shift();
            resolve(connection);
        } else {
            this.connections.push(connection);
        }
    }

    async close() {
        for (const conn of this.connections) {
            conn.destroy();
        }
        this.connections = [];
    }
}

// 4. HTTP请求重试
async function httpRetry(url, options = {}) {
    const maxRetries = options.maxRetries || 3;
    const retryDelay = options.retryDelay || 1000;
    const retryCodes = options.retryCodes || [408, 429, 500, 502, 503, 504];

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url);

            if (!retryCodes.includes(response.status)) {
                return response;
            }

            throw new Error(`HTTP ${response.status}`);
        } catch (error) {
            if (attempt === maxRetries) {
                throw error;
            }

            console.log(`请求失败，第${attempt}次重试...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
    }
}

// 5. 网络延迟测量
async function measureLatency(host, port = 80) {
    const results = [];
    const numSamples = 10;

    for (let i = 0; i < numSamples; i++) {
        const start = Date.now();

        await new Promise((resolve) => {
            const socket = new net.Socket();
            socket.setTimeout(5000);

            socket.on('connect', () => {
                const latency = Date.now() - start;
                results.push(latency);
                socket.destroy();
                resolve();
            });

            socket.on('timeout', () => {
                results.push(-1);
                socket.destroy();
                resolve();
            });

            socket.on('error', () => {
                results.push(-1);
                socket.destroy();
                resolve();
            });

            socket.connect(port, host);
        });

        await new Promise(resolve => setTimeout(resolve, 100));
    }

    const validResults = results.filter(r => r > 0);
    const avgLatency = validResults.reduce((a, b) => a + b, 0) / validResults.length;
    const minLatency = Math.min(...validResults);
    const maxLatency = Math.max(...validResults);

    return {
        avg: avgLatency.toFixed(2) + 'ms',
        min: minLatency + 'ms',
        max: maxLatency + 'ms',
        samples: results
    };
}

// 6. 请求限流器
class RateLimiter {
    constructor(options = {}) {
        this.maxRequests = options.maxRequests || 100;
        this.windowMs = options.windowMs || 60000;
        this.requests = [];
    }

    async acquire() {
        const now = Date.now();

        // 清理过期请求记录
        this.requests = this.requests.filter(time => time > now - this.windowMs);

        if (this.requests.length >= this.maxRequests) {
            const waitTime = this.requests[0] + this.windowMs - now;
            console.log(`限流中，等待 ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            return this.acquire();
        }

        this.requests.push(now);
        return true;
    }

    reset() {
        this.requests = [];
    }
}

// 使用限流器
const limiter = new RateLimiter({
    maxRequests: 10,
    windowMs: 1000
});

async function rateLimitedRequest(url) {
    await limiter.acquire();
    return fetch(url);
}

// 7. Keep-Alive连接池
const httpAgent = new http.Agent({
    keepAlive: true,
    keepAliveMsecs: 30000,
    maxSockets: 5,
    maxFreeSockets: 2,
    timeout: 60000
});

// 8. TCP反向代理
const proxyServer = net.createServer((clientSocket) => {
    const targetHost = 'example.com';
    const targetPort = 80;

    const targetSocket = net.createConnection({
        host: targetHost,
        port: targetPort
    });

    // 客户端 -> 目标
    clientSocket.on('data', (data) => {
        targetSocket.write(data);
    });

    // 目标 -> 客户端
    targetSocket.on('data', (data) => {
        clientSocket.write(data);
    });

    clientSocket.on('close', () => {
        targetSocket.end();
    });

    targetSocket.on('close', () => {
        clientSocket.end();
    });

    clientSocket.on('error', (err) => {
        console.error('客户端连接错误:', err);
        targetSocket.end();
    });

    targetSocket.on('error', (err) => {
        console.error('目标连接错误:', err);
        clientSocket.end();
    });
});

proxyServer.listen(8080, () => {
    console.log('TCP反向代理运行在 0.0.0.0:8080');
});
```

---

## 参考资源

- [Node.js官方文档](https://nodejs.org/zh-cn/docs/)
- [libuv官方文档](http://docs.libuv.org/)
- [V8官方文档](https://v8.dev/docs)
- [Node.js性能优化指南](https://nodejs.org/en/docs/guides/)
- [Node.js调试指南](https://nodejs.org/en/docs/guides/debugging-getting-started/)

---

*本文档持续更新，最后更新于2026年3月*