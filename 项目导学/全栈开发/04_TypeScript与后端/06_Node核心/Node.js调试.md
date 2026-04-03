# Node.js 调试

## 目录

1. [Console 调试](#1-console-调试)
2. [VS Code 调试](#2-vs-code-调试)
3. [Node Inspector](#3-node-inspector)
4. [内存泄漏排查](#4-内存泄漏排查)

---

## 1. Console 调试

### 1.1 基础调试

```javascript
// 基础输出
console.log('普通日志');
console.info('提示信息');
console.warn('警告信息');
console.error('错误信息');

// 格式化输出
console.log('字符串: %s, 数字: %d', 'hello', 42);
console.log('浮点数: %.2f', 3.14159);
console.log('对象: %o', { name: '张三' });
console.log('JSON: %j', { name: '张三' });
```

### 1.2 调试技巧

```javascript
// 调试时显示变量值
function add(a, b) {
  console.log(`add(${a}, ${b}) 被调用`);
  const result = a + b;
  console.log(`结果是: ${result}`);
  return result;
}

// 使用 console.assert 进行断言
console.assert(true, '条件为 true 时不输出');
console.assert(false, '条件为 false 时输出');

// 使用 console.trace 打印堆栈
function foo() {
  console.trace('打印堆栈信息');
}

function bar() {
  foo();
}

bar();
```

### 1.3 性能调试

```javascript
// 使用 console.time 进行性能测量
console.time('forLoop');
for (let i = 0; i < 1000000; i++) {}
console.timeEnd('forLoop');

// 使用 console.count 计数
function repeat() {
  console.count('repeat 调用次数');
}

repeat();
repeat();
repeat();

// 使用 console.group 组织输出
console.group('用户信息');
console.log('姓名: 张三');
console.log('年龄: 25');
console.group('联系方式');
console.log('电话: 123456789');
console.log('邮箱: zhangsan@example.com');
console.groupEnd();
console.groupEnd();
```

### 1.4 调试日志模块

```javascript
// logger.js - 自定义日志模块
class Logger {
  constructor(name) {
    this.name = name;
    this.level = process.env.LOG_LEVEL || 'info';
  }

  debug(...args) {
    if (this.shouldLog('debug')) {
      console.debug(`[${this.name}]`, ...args);
    }
  }

  info(...args) {
    if (this.shouldLog('info')) {
      console.info(`[${this.name}]`, ...args);
    }
  }

  warn(...args) {
    if (this.shouldLog('warn')) {
      console.warn(`[${this.name}]`, ...args);
    }
  }

  error(...args) {
    if (this.shouldLog('error')) {
      console.error(`[${this.name}]`, ...args);
    }
  }

  shouldLog(level) {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevel = levels.indexOf(this.level);
    const messageLevel = levels.indexOf(level);
    return messageLevel >= currentLevel;
  }
}

module.exports = (name) => new Logger(name);

// 使用
const logger = require('./logger')('App');

logger.info('应用启动');
logger.error('发生错误');
logger.debug('调试信息');
```

---

## 2. VS Code 调试

### 2.1 启动调试

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "启动程序",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/app.js"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "启动并调试测试",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--testPathPattern=app.test.js"]
    },
    {
      "type": "node",
      "request": "launch",
      "name": "附加到端口",
      "port": 9229,
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### 2.2 调试配置选项

```json
{
  "type": "node",
  "request": "launch",
  "name": "完整调试配置示例",
  "program": "${workspaceFolder}/app.js",
  "args": ["--arg1", "value1"],
  "env": {
    "NODE_ENV": "development"
  },
  "cwd": "${workspaceFolder}",
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen",
  "runtimeVersion": "20.10.0",
  "runtimeExecutable": "/usr/local/bin/node",
  "envFile": "${workspaceFolder}/.env",
  "preLaunchTask": "build",
  "postDebugTask": "cleanup",
  "sourceMaps": true,
  "outFiles": ["${workspaceFolder}/dist/**/*.js"]
}
```

### 2.3 断点类型

```javascript
// 1. 行断点 - 在特定行暂停
function calculate(a, b) {
  return a + b;  // 在这行设置断点
}

// 2. 条件断点 - 满足条件时暂停
function findUser(users, targetId) {
  return users.find(user => {
    return user.id === targetId;  // 设置条件断点: user.id === 2
  });
}

// 3. 函数断点 - 函数被调用时暂停
function processData(data) {
  // 处理数据
}

// 4. 异常断点 - 捕获异常时暂停
try {
  throw new Error('测试错误');
} catch (e) {
  console.error(e);
}

// 5. 监视点 - 变量值改变时暂停
let counter = 0;
function increment() {
  counter++;  // 监视 counter 变量
}
```

### 2.4 调试技巧

```javascript
// 使用 debugger 关键字
function buggyFunction(items) {
  let result = 0;
  for (const item of items) {
    debugger;  // 调试器会在这里暂停
    result += item.value;
  }
  return result;
}

// 调试异步代码
async function fetchData() {
  const response = await fetch('http://api.example.com/data');
  const data = await response.json();
  return data;
}

// 调试 Promise
function fetchUser(id) {
  return fetch(`/api/users/${id}`)
    .then(res => res.json())
    .then(user => {
      debugger;  // 可以查看 user 对象
      return user;
    });
}

// 调试 WebSocket
const ws = new WebSocket('ws://localhost:8080');
ws.onmessage = (event) => {
  debugger;  // 查看消息内容
};
```

---

## 3. Node Inspector

### 3.1 内置调试器

```bash
# 启动调试模式
node --inspect app.js

# 启动并在第一行暂停
node --inspect-brk app.js

# 调试特定端口
node --inspect=0.0.0.0:9229 app.js

# 查看可用的调试选项
node --help | grep inspect
```

### 3.2 Chrome 调试

```javascript
// 使用 --inspect 标志启动
// 1. 终端运行: node --inspect app.js
// 2. Chrome 访问: chrome://inspect
// 3. 点击 "Open DevTools" 开始调试
```

### 3.3 命令行调试

```bash
# 使用 node inspect
node inspect app.js

# 常用命令
# cont, c - 继续执行
# next, n - 下一行
# step, s - 进入函数
# out, o - 跳出函数
# repl - 进入 REPL 模式
# watch('expression') - 添加监视
# unwatch('expression') - 移除监视
```

### 3.4 远程调试

```bash
# 远程服务器启动调试
node --inspect=0.0.0.0:9229 app.js

# 本地通过 SSH 隧道连接
ssh -L 9229:localhost:9229 user@remote-server

# 或者直接连接远程
chrome://inspect -> Configure -> 添加远程地址
```

---

## 4. 内存泄漏排查

### 4.1 内存泄漏常见原因

```javascript
// 1. 全局变量
global.someData = [];  // 不会自动释放
someData = [];  // 隐式全局变量

// 2. 闭包
function createLeaker() {
  const largeData = new Array(1000000).fill('x');

  return function() {
    console.log('闭包引用了 largeData');
  };
}

// 3. 定时器未清理
setInterval(() => {
  // 持续创建对象
}, 1000);

// 4. 事件监听器未移除
const element = document.getElementById('button');
element.addEventListener('click', () => {
  // 处理点击
});
// 组件卸载时未移除

// 5. Map/Set 持续添加
const cache = new Map();
function addToCache(key, value) {
  cache.set(key, value);  // 无限增长
}
```

### 4.2 内存分析工具

```javascript
// 使用 v8 模块获取堆快照
const v8 = require('v8');

// 获取堆统计
const heapStats = v8.getHeapStatistics();
console.log('堆总大小:', heapStats.total_heap_size);
console.log('堆使用:', heapStats.used_heap_size);
console.log('堆上限:', heapStats.heap_size_limit);

// 获取堆空间统计
const heapSpaceStats = v8.getHeapSpaceStatistics();
console.log(heapSpaceStats);

// 序列化为快照
const snapshot = v8.writeHeapSnapshot();
console.log('堆快照已写入:', snapshot);
```

### 4.3 使用 Chrome DevTools 排查

```javascript
// 1. 启动带调试的应用
node --inspect app.js

// 2. Chrome 访问 chrome://inspect

// 3. 在 Memory 标签中进行操作:
//    - 录制堆快照
//    - 执行操作
//    - 再次录制堆快照
//    - 对比快照找出增长的对象
```

### 4.4 内存泄漏检测代码

```javascript
// memory-leak-detector.js
class MemoryLeakDetector {
  constructor() {
    this.snapshots = [];
    this.interval = null;
  }

  // 开始监控
  start(interval = 5000) {
    this.takeSnapshot('初始');

    this.interval = setInterval(() => {
      this.takeSnapshot('定期');
    }, interval);

    // 捕获未处理的 Promise 拒绝
    process.on('unhandledRejection', (reason, promise) => {
      console.error('未处理的 Promise 拒绝:', reason);
    });
  }

  // 停止监控
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  // 拍摄快照
  takeSnapshot(label) {
    const memoryUsage = process.memoryUsage();

    this.snapshots.push({
      label,
      time: new Date().toISOString(),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
      rss: Math.round(memoryUsage.rss / 1024 / 1024)
    });

    console.log(`[${label}] 内存使用:`, this.snapshots[this.snapshots.length - 1]);
  }

  // 分析内存增长
  analyze() {
    if (this.snapshots.length < 2) {
      console.log('快照不足，无法分析');
      return;
    }

    const first = this.snapshots[0];
    const last = this.snapshots[this.snapshots.length - 1];

    const heapGrowth = last.heapUsed - first.heapUsed;
    const rssGrowth = last.rss - first.rss;

    console.log('=== 内存分析报告 ===');
    console.log(`堆内存增长: ${heapGrowth} MB`);
    console.log(`RSS 增长: ${rssGrowth} MB`);
    console.log(`快照数量: ${this.snapshots.length}`);

    if (heapGrowth > 100) {
      console.warn('警告: 堆内存增长超过 100MB，可能存在内存泄漏');
    }
  }
}

// 使用示例
const detector = new MemoryLeakDetector();

// 模拟内存泄漏
function simulateLeak() {
  const leakyData = [];
  let count = 0;

  const interval = setInterval(() => {
    leakyData.push(new Array(100000).fill('leak'));
    count++;

    detector.takeSnapshot(`第 ${count} 次添加数据`);

    if (count >= 10) {
      clearInterval(interval);
      detector.stop();
      detector.analyze();
    }
  }, 1000);
}

// 启动检测
detector.start();
simulateLeak();
```

### 4.5 防止内存泄漏的最佳实践

```javascript
// 1. 正确清理定时器
class TimerExample {
  constructor() {
    this.timer = null;
  }

  start() {
    this.timer = setInterval(() => {
      // 处理任务
    }, 1000);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;  // 清理引用
    }
  }
}

// 2. 正确清理事件监听器
class EventExample {
  constructor(element) {
    this.element = element;
    this.handler = () => this.handleClick();
    this.element.addEventListener('click', this.handler);
  }

  handleClick() {
    // 处理点击
  }

  destroy() {
    this.element.removeEventListener('click', this.handler);
    this.handler = null;
  }
}

// 3. 限制缓存大小
class LimitedCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  get(key) {
    return this.cache.get(key);
  }
}

// 4. 使用 WeakMap/WeakSet
const weakMap = new WeakMap();
const obj = { name: '临时对象' };
weakMap.set(obj, '相关数据');
// obj 被回收时，WeakMap 中的条目也会被自动清理
```

---

## 常见面试问题

### 问题 1：Node.js 如何调试？

**答案：** 可以使用 console.log 进行基础调试，使用 VS Code 的调试功能进行可视化调试，使用 node --inspect 启动调试模式并通过 Chrome DevTools 调试。

### 问题 2：如何排查内存泄漏？

**答案：** 使用 process.memoryUsage() 监控内存使用，使用 Chrome DevTools 的 Memory 标签分析堆快照，拍摄多个快照进行对比，找出持续增长的对象。

### 问题 3：常见的内存泄漏有哪些？

**答案：** 全局变量、闭包、定时器未清理、事件监听器未移除、Map/Set 无限增长。

---

## 最佳实践

1. **开发阶段**：使用 VS Code 调试，添加适当的断点
2. **测试阶段**：使用内存泄漏检测工具
3. **生产阶段**：监控内存使用，设置告警
4. **代码审查**：检查是否有未清理的定时器、事件监听器
5. **日志**：记录关键操作的内存使用情况

---

## 参考资源

- [VS Code Node.js 调试](https://code.visualstudio.com/docs/nodejs/nodejs-debugging)
- [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools)
- [Node.js 调试指南](https://nodejs.org/en/docs/guides/debugging-getting-started/)
