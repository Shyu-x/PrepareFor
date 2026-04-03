# 浏览器原理深度解析：从 URL 到页面渲染 (2026版)

## 1. 概述：浏览器不只是页面展示工具

在 2026 年的前端面试中，浏览器原理已经从"加分项"变成了"必考项"。理解浏览器的渲染流程、事件循环、垃圾回收，是写出高性能 Web 应用的基础。

---

## 2. URL 解析到页面展示的完整流程

```
用户输入 URL
      │
      ▼
┌─────────────────────────────────────────────────────────┐
│                    1. URL 解析                           │
│  - 协议 (http/https)                                    │
│  - 域名解析 (DNS)                                        │
│  - 端口号                                                │
│  - 路径                                                  │
└─────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────┐
│                    2. DNS 解析                           │
│  - 浏览器缓存 → 系统缓存 → DNS 服务器                     │
│  - 递归查询 / 迭代查询                                    │
│  - DNS over HTTPS (DoH)                                  │
└─────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────┐
│                    3. TCP 连接                           │
│  - 三次握手 (SYN, SYN-ACK, ACK)                         │
│  - TLS 握手 (HTTPS)                                      │
│  - 连接复用 (HTTP/2 多路复用, HTTP/3 QUIC)                │
└─────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────┐
│                    4. HTTP 请求                         │
│  - 请求行 (方法, URL, 协议版本)                          │
│  - 请求头 (User-Agent, Cookie, Accept 等)                │
│  - 请求体 (POST/PUT 数据)                                │
└─────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────┐
│                    5. 服务器响应                        │
│  - 状态码 (200, 301, 404, 500 等)                      │
│  - 响应头 (Content-Type, Set-Cookie, Cache-Control 等)  │
│  - 响应体 (HTML, CSS, JS, 图片等资源)                   │
└─────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────┐
│                    6. 浏览器渲染                          │
│  - HTML 解析 → DOM 树                                    │
│  - CSS 解析 → CSSOM 树                                   │
│  - 合成 → Render Tree                                     │
│  - 布局 (Layout)                                          │
│  - 绘制 (Paint)                                           │
│  - 合成 (Composite)                                       │
└─────────────────────────────────────────────────────────┘
      │
      ▼
         页面展示
```

---

## 3. DOM 构建与 CSSOM

### 3.1 HTML 解析器

```javascript
// 浏览器解析 HTML 的简化过程
function parseHTML(html) {
  const tokens = tokenize(html);  // 分词
  const dom = buildDOMTree(tokens);  // 构建 DOM 树
  return dom;
}

// 令牌类型
const TokenType = {
  StartTag: 'StartTag',    // <div>
  EndTag: 'EndTag',        // </div>
  SelfClosingTag: 'SelfClosingTag',  // <br/>
  Doctype: 'Doctype',
  Comment: 'Comment',
  Text: 'Text',
};

// 示例
parseHTML('<div class="container"><p>Hello</p></div>');
// 生成 DOM 树结构:
// document
// └── html
//     └── body
//         └── div.container
//             └── p
//                 └── #text "Hello"
```

### 3.2 CSSOM 构建

```css
/* CSS 解析规则 */
.container {           /* 派生选择器 */
  color: red;
}

#app {                /* ID 选择器 */
  font-size: 16px;
}

.button.primary {     /* 组合选择器 */
  background: blue;
}

p > span {            /* 子元素选择器 */
  font-weight: bold;
}
```

```javascript
// CSSOM 的计算过程
function computeCSS(element, parentStyles) {
  // 1. 获取所有适用规则
  const rules = getMatchingRules(element);

  // 2. 按优先级排序 ( specificity )
  // 内联 > ID > 类/属性/伪类 > 标签/伪元素
  const sortedRules = rules.sort((a, b) => {
    return calculateSpecificity(b) - calculateSpecificity(a);
  });

  // 3. 应用层叠规则
  const computedStyle = {};
  for (const rule of sortedRules) {
    Object.assign(computedStyle, rule.properties);
  }

  // 4. 继承
  for (const prop of inheritedProperties) {
    if (computedStyle[prop] === undefined) {
      computedStyle[prop] = parentStyles[prop];
    }
  }

  return computedStyle;
}
```

### 3.3 渲染树 (Render Tree)

```
┌─────────────────────────────────────────────────────────┐
│                      DOM 树                             │
│                                                         │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐          │
│  │  html   │     │  head   │     │  body   │          │
│  └────┬────┘     └─────────┘     └────┬────┘          │
│       │                               │                │
│       ▼                               ▼                │
│  ┌─────────┐                   ┌─────────┐             │
│  │  head   │                   │  div    │             │
│  └─────────┘                   └────┬────┘             │
│                                    │                   │
└────────────────────────────────────┼───────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────┐
│                    CSSOM 树                            │
│                                                         │
│  div { display: block; color: red; }                   │
│  └── .container { display: flex; }                     │
│  └── p { font-size: 16px; }                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────┐
│                    Render 树                           │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ RenderBlock(div)                                 │  │
│  │   display: flex                                 │  │
│  │   └── RenderInline(p)                           │  │
│  │        color: red                               │  │
│  │        font-size: 16px                         │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  注意：display:none 的元素不会生成 Render 节点          │
└─────────────────────────────────────────────────────────┘
```

---

## 4. 渲染流水线 (Rendering Pipeline)

### 4.1 关键渲染路径

```javascript
/*
┌─────────────────────────────────────────────────────────┐
│                  渲染流水线                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   JavaScript ──▶ Style ──▶ Layout ──▶ Paint ──▶ Composite │
│       │            │            │          │            │
│       ▼            ▼            ▼          ▼            │
│   [重排]      [重排+重绘]   [重绘]     [合成]          │
│                                                         │
│   性能开销: 重排 >> 重绘 >> 合成                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
*/

// 1. JavaScript 触发变化
element.style.width = '200px';  // 触发 Layout
element.style.backgroundColor = 'red';  // 只触发 Paint
element.style.transform = 'translateX(100px)';  // 只触发 Composite

// 2. Layout（布局） - 计算几何信息
// 改变 width, height, margin, padding, display 等
// 整个布局树需要重新计算

// 3. Paint（绘制） - 填充像素
// 改变 color, background, border, visibility 等
// 不改变几何信息

// 4. Composite（合成） - 图层合并
// 改变 transform, opacity, filter 等
// 在独立的合成层上进行
```

### 4.2 强制同步布局 (Forced Reflow)

```javascript
// ❌ 性能杀手：强制同步布局
function badPractice() {
  const elements = document.querySelectorAll('.item');

  elements.forEach(el => {
    // 每次循环都触发一次布局计算
    const height = el.offsetHeight;  // 触发 Layout

    el.style.height = height + 'px';
  });
}

// ✅ 优化：批量读取，先读后写
function goodPractice() {
  const elements = document.querySelectorAll('.item');

  // 1. 批量读取（会触发一次 Layout）
  const heights = Array.from(elements).map(el => el.offsetHeight);

  // 2. 批量写入（不会触发额外 Layout）
  elements.forEach((el, i) => {
    el.style.height = heights[i] + 'px';
  });
}
```

### 4.3 合成层 (Compositor Layer)

```css
/* 提升为独立合成层的条件 */
.accelerated {
  /* 1. transform */
  transform: translateZ(0);
  /* 或 */
  will-change: transform;

  /* 2. opacity (配合 transform 使用) */
  opacity: 0.9;
  will-change: opacity;

  /* 3. filter (部分浏览器) */
  filter: blur(0);
}

/* 注意：滥用合成层会增加内存占用 */
```

---

## 5. 事件循环与任务调度

### 5.1 任务队列 vs 微任务队列

```javascript
/*
┌─────────────────────────────────────────────────────────┐
│                    事件循环                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   1. 执行同步代码 (Call Stack)                           │
│         │                                               │
│         ▼                                               │
│   2. 执行所有微任务 (Microtask Queue)                    │
│         │                                               │
│         ▼                                               │
│   3. 渲染更新 (requestAnimationFrame)                   │
│         │                                               │
│         ▼                                               │
│   4. 执行一个宏任务 (Task Queue)                       │
│         │                                               │
│         ▼                                               │
│   5. 重复 2-4                                          │
│                                                         │
└─────────────────────────────────────────────────────────┘

宏任务：setTimeout, setInterval, I/O, UI 渲染
微任务：Promise.then, queueMicrotask, MutationObserver
*/
```

### 5.2 具体执行顺序

```javascript
console.log('1. 同步代码开始');

setTimeout(() => {
  console.log('5. setTimeout (宏任务)');
}, 0);

Promise.resolve().then(() => {
  console.log('3. Promise.then (微任务)');
});

queueMicrotask(() => {
  console.log('3.5 queueMicrotask (微任务)');
});

requestAnimationFrame(() => {
  console.log(' RAF (渲染前回调)');
});

new Promise((resolve) => {
  console.log('2. Promise executor (同步)');
  resolve();
});

console.log('4. 同步代码结束');

// 执行顺序:
// 1. 同步代码开始
// 2. Promise executor (同步)
// 4. 同步代码结束
// 3. Promise.then (微任务)
// 3.5 queueMicrotask (微任务)
// 5. setTimeout (宏任务)
// (可能) RAF (渲染前)
```

### 5.3 requestAnimationFrame vs requestIdleCallback

```javascript
// 1. requestAnimationFrame：每帧前执行（60fps = 16.67ms）
function animate() {
  // 更新动画
  element.style.transform = `translateX(${x}px)`;

  // 继续下一帧
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// 2. requestIdleCallback：浏览器空闲时执行
requestIdleCallback((deadline) => {
  console.log(`剩余时间: ${deadline.timeRemaining()}ms`);

  while (deadline.timeRemaining() > 0 && tasks.length > 0) {
    const task = tasks.pop();
    processTask(task);
  }

  // 如果还有任务，继续调度
  if (tasks.length > 0) {
    requestIdleCallback(processTasks);
  }
}, { timeout: 2000 });  // 最长等待时间

// 3. 实际应用：懒加载大量数据
function loadDataInIdleTime(dataArray) {
  let index = 0;

  function loadBatch(deadline) {
    while (deadline.timeRemaining() > 0 && index < dataArray.length) {
      processItem(dataArray[index]);
      index++;
    }

    if (index < dataArray.length) {
      requestIdleCallback(loadBatch);
    }
  }

  requestIdleCallback(loadBatch);
}
```

---

## 6. 垃圾回收 (Garbage Collection)

### 6.1 V8 垃圾回收架构

```javascript
/*
┌─────────────────────────────────────────────────────────┐
│                    V8 内存布局                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌─────────────────────────────────────────────────┐   │
│   │              新生代区域 (1-8 MB)                │   │
│   │   ┌─────────────┐     ┌─────────────┐        │   │
│   │   │   From Space │     │  To Space   │        │   │
│   │   │   (使用中)   │ ──▶ │   (空闲)    │        │   │
│   │   └─────────────┘     └─────────────┘        │   │
│   │                                                 │   │
│   │   Scavenge 算法：快速，频率高                   │   │
│   └─────────────────────────────────────────────────┘   │
│                                                         │
│   ┌─────────────────────────────────────────────────┐   │
│   │              老生代区域 (数百 MB - 数 GB)        │   │
│   │                                                 │   │
│   │   Mark-Sweep-Compact 算法                       │   │
│   │   - Mark: 标记可达对象                          │   │
│   │   - Sweep: 清除不可达对象                      │   │
│   │   - Compact: 整理碎片                          │   │
│   │                                                 │   │
│   └─────────────────────────────────────────────────┘   │
│                                                         │
│   ┌─────────────────────────────────────────────────┐   │
│   │              大对象区域                          │   │
│   │   对象大小超过阈值时直接分配在这里               │   │
│   └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
*/
```

### 6.2 内存泄漏常见场景

```javascript
// ❌ 场景1：全局变量
function leaky() {
  result = doSomething();  // 隐式全局变量
  this.data = doSomething();  // 指向 window
}

// ❌ 场景2：闭包
function leakyClosure() {
  const largeData = new Array(1000000);

  // 这个闭包引用了 largeData
  return function() {
    console.log(largeData.length);
  };
}

// ✅ 修复：手动释放
function fixedClosure() {
  let largeData = new Array(1000000);
  const getLength = () => largeData.length;

  // 使用完毕后清理引用
  return function() {
    const len = getLength();
    largeData = null;  // 手动清理
    return len;
  };
}

// ❌ 场景3：未清理的事件监听器
class Component {
  constructor() {
    this.handler = () => this.doSomething();
    window.addEventListener('resize', this.handler);
  }

  // 忘记清理
  destroy() {
    // ❌ 应该移除监听器
    // window.removeEventListener('resize', this.handler);
  }
}

// ✅ 修复
class FixedComponent {
  constructor() {
    this.handler = () => this.doSomething();
    window.addEventListener('resize', this.handler);
  }

  destroy() {
    window.removeEventListener('resize', this.handler);
    this.handler = null;
  }
}

// ❌ 场景4：定时器
function leakyTimer() {
  const data = new Array(1000000);

  setInterval(() => {
    console.log(data.length);  // 定时器一直引用 data
  }, 1000);

  // 即使组件销毁，定时器仍在运行
}

// ✅ 修复
function fixedTimer() {
  const data = new Array(1000000);
  const intervalId = setInterval(() => {
    console.log(data.length);
  }, 1000);

  // 返回清理函数
  return () => {
    clearInterval(intervalId);
    data.length = 0;  // 释放引用
  };
}
```

### 6.3 WeakMap 与 WeakSet

```javascript
// WeakMap：键为对象，且不影响垃圾回收
const cache = new WeakMap();

function processData(obj) {
  if (cache.has(obj)) {
    return cache.get(obj);
  }

  const result = expensiveComputation(obj);
  cache.set(obj, result);  // obj 作为键
  return result;
}

// 当 obj 不再被其他引用时，会被自动垃圾回收
// 缓存项也会自动清理

// 应用场景：缓存 DOM 节点相关数据
const elementCache = new WeakMap();

function getElementData(element) {
  if (elementCache.has(element)) {
    return elementCache.get(element);
  }

  const data = {
    rect: element.getBoundingClientRect(),
    computedStyle: getComputedStyle(element),
  };

  elementCache.set(element, data);
  return data;
}
```

---

## 7. HTTP 缓存机制

### 7.1 缓存流程

```
请求发起
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│                    1. 强缓存                            │
│                                                         │
│   Cache-Control: max-age=3600                          │
│   Expires: Wed, 21 Oct 2026 07:28:00 GMT             │
│                                                         │
│   ✓ 命中 → 直接使用缓存 (不发请求)                      │
│   ✗ 未命中 → 进入协商缓存                               │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│                    2. 协商缓存                          │
│                                                         │
│   请求携带: If-Modified-Since / If-None-Match         │
│   响应携带: Last-Modified / ETag                      │
│                                                         │
│   ✓ 命中 (304) → 使用缓存                              │
│   ✗ 未命中 (200) → 下载新资源                           │
└─────────────────────────────────────────────────────────┘
```

### 7.2 Cache-Control 指令

```javascript
// 常用缓存策略
const cacheStrategies = {
  // 1. 不缓存
  noCache: {
    'Cache-Control': 'no-store',
    // 每次都从服务器获取
  },

  // 2. 缓存但验证
  noStore: {
    'Cache-Control': 'no-cache',
    // 缓存但每次都验证
  },

  // 3. 私有缓存（浏览器）
  private: {
    'Cache-Control': 'private, max-age=600',
    // 只能被浏览器缓存，CDN 不能缓存
  },

  // 4. 公共缓存（CDN）
  public: {
    'Cache-Control': 'public, max-age=3600',
    // 可以被任何中间节点缓存
  },

  // 5. 必须重新验证
  mustRevalidate: {
    'Cache-Control': 'max-age=3600, must-revalidate',
    // 过期后必须向服务器验证
  },

  // 6.  immutable（内容不会变）
  immutable: {
    'Cache-Control': 'public, max-age=31536000, immutable',
    // 永久缓存，适合带 hash 的静态资源
  },
};
```

### 7.3 Service Worker 缓存

```javascript
// sw.js
const CACHE_NAME = 'v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/logo.png',
];

// 安装阶段：缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// 激活阶段：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

// 请求拦截：多种缓存策略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 策略1：网络优先（API 请求）
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('/offline.json'))
    );
    return;
  }

  // 策略2：缓存优先（静态资源）
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        });
      })
    );
    return;
  }

  // 策略3：Stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, clone);
        });
        return response;
      });

      return cached || networkFetch;
    })
  );
});
```

---

## 8. 浏览器安全机制

### 8.1 CSP (Content Security Policy)

```http
# 响应头配置
Content-Security-Policy:
  default-src 'self';                    # 默认只允许同源
  script-src 'self' 'nonce-abc123';      # 只允许同源脚本和内联脚本(nonce)
  style-src 'self' 'unsafe-inline';      # 允许内联样式（生产环境不推荐）
  img-src 'self' https://images.example.com;  # 允许指定域名的图片
  connect-src 'self' https://api.example.com;  # 允许 API 请求的目标
  frame-ancestors 'none';               # 禁止被 iframe 嵌入
  form-action 'self';                    # 表单只能提交到同源
```

```html
<!-- Meta 标签配置 -->
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'">
```

### 8.2 XSS 防护

```javascript
// 1. HTML 转义
function escapeHTML(str) {
  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return str.replace(/[&<>"']/g, (c) => escapeMap[c]);
}

// 2. URL 参数转义
function escapeURL(str) {
  return encodeURIComponent(str);
}

// 3. DOM 安全的属性白名单
const SAFE_ATTRS = new Set([
  'href', 'src', 'title', 'alt', 'class', 'id'
]);

function safeSetAttribute(element, attr, value) {
  if (SAFE_ATTRS.has(attr)) {
    element.setAttribute(attr, value);
  }
}
```

---

*本文档持续更新，最后更新于 2026 年 3 月*
