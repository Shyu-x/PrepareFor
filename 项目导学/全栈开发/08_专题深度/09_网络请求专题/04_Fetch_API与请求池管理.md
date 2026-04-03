# Fetch API 与请求池管理

## 前言：为什么还需要学Fetch？

你可能会问："既然Axios已经这么好用了，为什么还要学Fetch？"

好问题！让我打个比方：

**Axios**就像一位专业的秘书，你告诉它"帮我约张三"，它会帮你搞定一切——打电话、确认时间、记录备忘。

**Fetch**就像是手机自带的基础通话功能。你也可以用它来打电话，但需要自己记号码、自己看时间。

**为什么还要学Fetch？**

1. **React Native、UniApp等框架原生支持Fetch**
2. **Service Worker和PWA中Fetch是唯一选择**
3. **学习Fetch能帮你理解Web请求的本质**
4. **某些轻量级场景不需要引入整个Axios库**

本章我们就来深入学习Fetch API，以及如何用它来构建健壮的请求系统。

---

## 第一部分：Fetch API基础

### 1.1 Fetch vs XHR vs Axios

```javascript
// ========== XHR（老式对讲机）==========
// 功能全但笨重，需要手动管理一切

const xhr = new XMLHttpRequest();
xhr.open('GET', '/api/data', true);
xhr.onload = () => console.log(xhr.responseText);
xhr.send();

// ========== Axios（智能手机+秘书）==========
// 智能、方便，但需要安装库

axios.get('/api/data').then(r => console.log(r.data));

// ========== Fetch（智能手机自带功能）==========
// 原生支持，但功能相对基础

fetch('/api/data')
  .then(response => response.json()) // 需要手动转换
  .then(data => console.log(data))
  .catch(error => console.error(error));

// 或者用async/await
async function getData() {
  const response = await fetch('/api/data');
  const data = await response.json();
  console.log(data);
}
```

### 1.2 Fetch的基本用法

```javascript
// ========== 最简单的GET请求 ==========
fetch('/api/users')
  .then(response => {
    // response是一个Response对象，不是数据本身
    console.log('状态:', response.status);
    console.log('状态文字:', response.statusText);
    console.log('响应头:', response.headers);

    // 读取响应体，需要调用相应的方法
    // response.json() - 解析为JSON
    // response.text() - 解析为文本
    // response.blob() - 解析为二进制
    // response.formData() - 解析为FormData
    // response.arrayBuffer() - 解析为ArrayBuffer
    return response.json();
  })
  .then(data => console.log(data));

// ========== async/await写法（推荐）==========
async function getUsers() {
  try {
    const response = await fetch('/api/users');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error('获取用户失败:', error);
  }
}

// ========== POST请求 ==========
async function createUser(userData) {
  const response = await fetch('/api/users', {
    method: 'POST',                          // HTTP方法
    headers: {
      'Content-Type': 'application/json',    // 请求体类型
      'Authorization': 'Bearer token'       // 可以加任何header
    },
    body: JSON.stringify(userData)          // 请求体，必须是字符串
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// ========== 响应状态码与错误 ==========

// Fetch不会因为HTTP错误状态码而reject！
// 只有网络错误或请求被阻止时才会reject
fetch('/api/nonexistent')
  .then(response => {
    // 即使是404，这里也不会抛出错误
    console.log('状态:', response.status); // 404
    // 需要手动检查
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .catch(error => {
    // 只有网络错误才会到这里
    console.error('请求失败:', error);
  });
```

### 1.3 Response对象详解

```javascript
// fetch返回的Response对象包含了很多有用信息

const response = await fetch('/api/users');

// ========== 属性 ==========

// ok - 是否成功（状态码200-299）
console.log(response.ok); // true 或 false

// status - HTTP状态码
console.log(response.status); // 200

// statusText - 状态文字
console.log(response.statusText); // "OK"

// headers - 响应头对象
console.log(response.headers.get('Content-Type')); // "application/json"
console.log(response.headers.has('X-Custom-Header')); // true

// url - 请求的URL
console.log(response.url); // "https://api.example.com/api/users"

// type - 响应类型
// "basic" - 同源响应
// "cors" - 跨域响应
// "error" - 网络错误
// "opaque" - 不透明响应（如fetch不支持的资源）
console.log(response.type);

// redirected - 是否重定向过
console.log(response.redirected); // true 或 false

// ========== 方法 ==========

// json() - 解析为JSON
const data = await response.json();

// text() - 解析为文本
const text = await response.text();

// blob() - 解析为Blob（二进制）
const blob = await response.blob();

// arrayBuffer() - 解析为ArrayBuffer
const buffer = await response.arrayBuffer();

// formData() - 解析为FormData
const formData = await response.formData();

// clone() - 克隆响应（响应体只能读一次）
const response1 = response.clone();
const data1 = await response1.json();
const data2 = await response.json(); // 原始response还能用

// ========== 实际使用示例 ==========

async function fetchUserProfile(userId) {
  const response = await fetch(`/api/users/${userId}`);

  // 检查是否成功
  if (!response.ok) {
    // 根据状态码做不同处理
    if (response.status === 404) {
      return null; // 用户不存在
    }
    if (response.status === 401) {
      throw new Error('请先登录');
    }
    throw new Error(`HTTP错误: ${response.status}`);
  }

  // 获取内容类型
  const contentType = response.headers.get('Content-Type');

  // 根据内容类型决定如何解析
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}
```

---

## 第二部分：Fetch的高级特性

### 2.1 AbortController：取消Fetch请求

```javascript
// AbortController就像"电话切断器"
// 可以随时中断正在进行的fetch请求

// ========== 基本用法 ==========

// 1. 创建AbortController
const controller = new AbortController();

// 2. 获取signal
const signal = controller.signal;

// 3. 在fetch中使用signal
fetch('/api/slow-request', { signal })
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => {
    if (error.name === 'AbortError') {
      console.log('请求被取消了');
    } else {
      console.error('其他错误:', error);
    }
  });

// 4. 取消请求
controller.abort();

// ========== 实际场景：搜索防抖 ==========

let searchController = null;

async function search(query) {
  // 取消之前的搜索请求
  if (searchController) {
    searchController.abort();
  }

  // 创建新的controller
  searchController = new AbortController();

  try {
    const response = await fetch(`/api/search?q=${query}`, {
      signal: searchController.signal
    });

    const results = await response.json();
    console.log('搜索结果:', results);
    return results;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('搜索被取消');
    } else {
      throw error;
    }
  } finally {
    searchController = null;
  }
}

// 防抖包装
let searchTimer = null;
function debouncedSearch(query) {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    search(query);
  }, 300);
}

// ========== 超时控制 ==========

function fetchWithTimeout(url, options = {}, timeout = 5000) {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error(`请求超时（${timeout}ms）`);
    }
    throw error;
  }
}

// 使用
async function loadData() {
  try {
    const response = await fetchWithTimeout('/api/data', {}, 3000);
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('加载失败:', error.message);
  }
}
```

### 2.2 Stream流处理

```javascript
// Fetch的流处理能力是XHR和Axios做不到的
// 可以一边下载一边处理数据，适合大文件

// ========== 基本流处理 ==========

// 获取大文件
const response = await fetch('/api/large-file');

// response.body是一个ReadableStream
const reader = response.body.getReader();

// 逐块读取
while (true) {
  const { done, value } = await reader.read();

  if (done) {
    console.log('读取完成');
    break;
  }

  console.log('收到一块数据，大小:', value.length);
  // value是一个Uint8Array
}

// ========== 实际应用：下载进度 ==========

async function downloadWithProgress(url, onProgress) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  // 获取总大小
  const contentLength = response.headers.get('Content-Length');
  const total = parseInt(contentLength, 10);
  let loaded = 0;

  // 获取流
  const reader = response.body.getReader();

  // 创建下载用的blob
  const chunks = [];

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    chunks.push(value);
    loaded += value.length;

    // 报告进度
    if (total) {
      const percent = Math.round((loaded / total) * 100);
      onProgress?.(percent);
    }
  }

  // 合并所有chunk
  return new Blob(chunks);
}

// 使用
const blob = await downloadWithProgress('/api/download/file', (percent) => {
  console.log(`下载进度: ${percent}%`);
  updateProgressBar(percent);
});

// ========== 流式文本处理（如聊天机器人）=========

async function* streamChat(url, question) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    // 解码二进制数据
    const chunk = decoder.decode(value);
    yield chunk;
  }
}

// 使用
async function chat() {
  for await (const chunk of streamChat('/api/chat', '你好')) {
    process.stdout.write(chunk); // 流式输出
  }
}
```

### 2.3 跨域请求与Cookie

```javascript
// ========== 跨域请求 ==========

// 默认情况下，fetch不会发送跨域cookie
// 需要设置 credentials: 'include'

fetch('https://api.example.com/data', {
  // 1. 同源请求：默认发送cookie
  // 2. 跨域请求：需要设置credentials
  credentials: 'include' // 'same-origin' | 'include' | 'omit'
});

// ========== 简单请求 vs 复杂请求 ==========

// 简单请求：GET/POST + 简单headers
// 会直接发送，然后检查Access-Control-Allow-*

// 复杂请求：PUT/DELETE 或 自定义Headers
// 会先发OPTIONS预检请求

fetch('https://api.example.com/data', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'X-Custom-Header': 'value'
  },
  body: JSON.stringify({ name: 'test' }),
  credentials: 'include'
});

// 如果服务器不支持CORS，会失败

// ========== CORS错误处理 ==========

async function safeFetch(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;

  } catch (error) {
    if (error.message.includes('CORS') || error.name === 'TypeError') {
      console.error('跨域错误：服务器可能不支持CORS');
      throw new Error('跨域请求失败，请联系管理员配置CORS');
    }
    throw error;
  }
}
```

---

## 第三部分：Fetch封装实战

### 3.1 手写一个类似Axios的Fetch封装

```javascript
/**
 * 基于Fetch的HTTP客户端封装
 * 目标是：让Fetch像Axios一样好用
 */

class HttpClient {
  constructor(baseUrl = '', defaultOptions = {}) {
    this.baseUrl = baseUrl;
    this.defaultOptions = {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin',
      ...defaultOptions
    };

    // 拦截器
    this.interceptors = {
      request: [],
      response: []
    };
  }

  /**
   * 添加请求拦截器
   */
  addRequestInterceptor(onFulfilled, onRejected) {
    this.interceptors.request.push({ onFulfilled, onRejected });
    return this;
  }

  /**
   * 添加响应拦截器
   */
  addResponseInterceptor(onFulfilled, onRejected) {
    this.interceptors.response.push({ onFulfilled, onRejected });
    return this;
  }

  /**
   * 核心请求方法
   */
  async request(url, options = {}) {
    // 合并配置
    const config = {
      ...this.defaultOptions,
      ...options
    };

    // 处理baseURL
    const fullUrl = url.startsWith('http')
      ? url
      : `${this.baseUrl}${url}`;

    // 执行请求拦截器
    let modifiedConfig = config;
    for (const interceptor of this.interceptors.request) {
      try {
        modifiedConfig = await interceptor.onFulfilled(modifiedConfig);
      } catch (error) {
        if (interceptor.onRejected) {
          throw await interceptor.onRejected(error);
        }
        throw error;
      }
    }

    // 创建AbortController（用于超时和取消）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
      // 发送请求
      const response = await fetch(fullUrl, {
        ...modifiedConfig,
        signal: controller.signal,
        headers: {
          ...this.defaultOptions.headers,
          ...modifiedConfig.headers
        }
      });

      clearTimeout(timeoutId);

      // 检查响应状态
      if (!response.ok && config.validateStatus) {
        if (!config.validateStatus(response.status)) {
          throw new HttpError(response.status, response.statusText, response);
        }
      }

      // 解析响应数据
      let data = null;
      const contentType = response.headers.get('Content-Type');

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else if (contentType && contentType.includes('text/')) {
        data = await response.text();
      } else {
        data = await response.blob();
      }

      // 创建响应对象
      const httpResponse = {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: this.parseHeaders(response.headers),
        config
      };

      // 执行响应拦截器
      let result = httpResponse;
      for (const interceptor of this.interceptors.response) {
        try {
          result = await interceptor.onFulfilled(result);
        } catch (error) {
          if (interceptor.onRejected) {
            throw await interceptor.onRejected(error);
          }
          throw error;
        }
      }

      return result;

    } catch (error) {
      clearTimeout(timeoutId);

      // 处理取消和超时
      if (error.name === 'AbortError') {
        if (controller.signal.aborted) {
          throw new Error('请求被取消');
        }
        throw new Error(`请求超时（${config.timeout}ms）`);
      }

      throw error;
    }
  }

  /**
   * GET请求
   */
  get(url, params = {}, options = {}) {
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    return this.request(fullUrl, { ...options, method: 'GET' });
  }

  /**
   * POST请求
   */
  post(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * PUT请求
   */
  put(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * PATCH请求
   */
  patch(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  /**
   * DELETE请求
   */
  delete(url, options = {}) {
    return this.request(url, { ...options, method: 'DELETE' });
  }

  /**
   * 文件上传
   */
  upload(url, file, onProgress, options = {}) {
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open('POST', url, true);

      // 设置headers
      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });
      }

      // 上传进度
      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        };
      }

      // 完成
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            resolve(xhr.responseText);
          }
        } else {
          reject(new HttpError(xhr.status, xhr.statusText, null));
        }
      };

      xhr.onerror = () => reject(new Error('网络错误'));
      xhr.send(formData);
    });
  }

  /**
   * 解析响应头
   */
  parseHeaders(headers) {
    const result = {};
    headers.forEach((value, key) => {
      result[key.toLowerCase()] = value;
    });
    return result;
  }
}

/**
 * HTTP错误类
 */
class HttpError extends Error {
  constructor(status, statusText, response) {
    super(`HTTP Error ${status}: ${statusText}`);
    this.name = 'HttpError';
    this.status = status;
    this.statusText = statusText;
    this.response = response;
  }
}

// ========== 创建实例并配置拦截器 ==========

const http = new HttpClient('/api', {
  timeout: 30000
});

// 请求拦截器：添加token
http.addRequestInterceptor(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`
      };
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：统一错误处理
http.addResponseInterceptor(
  (response) => response,
  (error) => {
    if (error.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 使用
const users = await http.get('/users', { page: 1 });
const newUser = await http.post('/users', { name: '张三' });
```

### 3.2 实际项目中的Fetch封装

```javascript
/**
 * 实际项目：React中使用的Fetch Hook
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Fetch数据Hook
 * @param {string} url 请求地址
 * @param {Object} options Fetch选项
 * @returns {Object} { data, loading, error, refetch }
 */
function useFetch(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 用于取消请求
  const abortControllerRef = useRef(null);

  const fetchData = useCallback(async () => {
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 创建新的AbortController
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        ...options,
        signal: abortControllerRef.current.signal,
        credentials: options.credentials || 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);

    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [url]);

  // 首次加载
  useEffect(() => {
    fetchData();

    // 清理：组件卸载时取消请求
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ========== 使用示例 ==========

function UserProfile({ userId }) {
  const { data: user, loading, error, refetch } = useFetch(`/api/users/${userId}`);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;
  if (!user) return <div>没有数据</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <button onClick={refetch}>刷新</button>
    </div>
  );
}

/**
 * 带状态的Fetch Hook
 * 支持POST/PUT/DELETE等操作后的数据更新
 */
function useFetchWithMutation(initialUrl, initialOptions = {}) {
  const [url, setUrl] = useState(initialUrl);
  const [options, setOptions] = useState(initialOptions);
  const { data, loading, error, refetch } = useFetch(url, options);

  const mutate = useCallback((newUrl, newOptions) => {
    setUrl(newUrl);
    setOptions(newOptions || {});
  }, []);

  return { data, loading, error, mutate, refetch };
}
```

---

## 第四部分：请求池管理

### 4.1 为什么需要请求池？

想象一下：
- 你在电商网站搜索"手机"，搜出了1000个商品
- 如果一次性发1000个请求，浏览器会崩溃
- 请求池就像"排队叫号"，一次只处理N个请求

```javascript
/**
 * 请求池管理器
 * 用于控制并发请求数量，避免浏览器卡顿
 */

class RequestPool {
  constructor(concurrency = 5) {
    this.concurrency = concurrency; // 最大并发数
    this.running = 0;              // 当前运行数
    this.queue = [];               // 等待队列

    // 请求统计
    this.stats = {
      total: 0,
      success: 0,
      failed: 0,
      cancelled: 0
    };
  }

  /**
   * 添加请求
   * @param {Function} requestFn 返回Promise的异步函数
   * @param {Object} metadata 元数据（用于追踪）
   * @returns {Promise}
   */
  add(requestFn, metadata = {}) {
    return new Promise((resolve, reject) => {
      const task = {
        requestFn,
        metadata,
        resolve,
        reject,
        retries: 0
      };

      this.queue.push(task);
      this.stats.total++;
      this.process();
    });
  }

  /**
   * 处理队列
   */
  process() {
    // 如果队列空或已达并发上限，返回
    if (this.queue.length === 0 || this.running >= this.concurrency) {
      return;
    }

    // 取出一个任务
    const task = this.queue.shift();
    this.running++;

    // 执行任务
    this.executeTask(task);
  }

  /**
   * 执行单个任务
   */
  async executeTask(task) {
    try {
      const result = await task.requestFn();
      this.stats.success++;
      task.resolve(result);
    } catch (error) {
      this.stats.failed++;
      task.reject(error);
    } finally {
      this.running--;
      this.process(); // 继续处理下一个
    }
  }

  /**
   * 带重试的请求
   */
  addWithRetry(requestFn, metadata = {}, options = {}) {
    const { retries = 3, retryDelay = 1000 } = options;

    return new Promise((resolve, reject) => {
      const task = {
        requestFn,
        metadata,
        retries,
        retryDelay,
        resolve,
        reject
      };

      this.queue.push(task);
      this.stats.total++;
      this.process();
    });
  }

  /**
   * 取消所有请求
   */
  cancelAll() {
    const cancelled = this.queue.length;
    this.queue.forEach(task => {
      task.reject(new Error('请求被取消'));
      this.stats.cancelled++;
    });
    this.queue = [];
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      ...this.stats,
      queueLength: this.queue.length,
      running: this.running,
      pending: this.queue.length + this.running
    };
  }

  /**
   * 清空队列（但继续运行中的请求）
   */
  clearQueue() {
    this.queue.forEach(task => {
      task.reject(new Error('队列已清空'));
      this.stats.cancelled++;
    });
    this.queue = [];
  }
}

// ========== 使用示例 ==========

// 创建一个最多5个并发的请求池
const pool = new RequestPool(5);

// 模拟请求
function createRequest(id) {
  return fetch(`/api/items/${id}`).then(r => r.json());
}

// 批量添加请求
async function batchFetch(itemIds) {
  const promises = itemIds.map(id =>
    pool.add(() => createRequest(id), { id })
  );

  return Promise.all(promises);
}

// 使用
const itemIds = Array.from({ length: 100 }, (_, i) => i + 1);
const results = await batchFetch(itemIds);

console.log('统计:', pool.getStats());

// 取消所有
pool.cancelAll();
```

### 4.2 优先级请求池

```javascript
/**
 * 带优先级的请求池
 * 重要请求可以插队
 */

class PriorityRequestPool {
  constructor(concurrency = 5) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queues = {
      high: [],    // 高优先级
      normal: [],  // 普通优先级
      low: []      // 低优先级
    };
  }

  /**
   * 添加请求
   * @param {Function} requestFn 请求函数
   * @param {string} priority 优先级: 'high' | 'normal' | 'low'
   */
  add(requestFn, priority = 'normal') {
    return new Promise((resolve, reject) => {
      const task = { requestFn, resolve, reject };
      this.queues[priority].push(task);
      this.process();
    });
  }

  process() {
    if (this.running >= this.concurrency) {
      return;
    }

    // 从高到低优先级取任务
    let task = null;

    if (this.queues.high.length > 0) {
      task = this.queues.high.shift();
    } else if (this.queues.normal.length > 0) {
      task = this.queues.normal.shift();
    } else if (this.queues.low.length > 0) {
      task = this.queues.low.shift();
    }

    if (task) {
      this.running++;
      this.executeTask(task);
    }
  }

  async executeTask(task) {
    try {
      const result = await task.requestFn();
      task.resolve(result);
    } catch (error) {
      task.reject(error);
    } finally {
      this.running--;
      this.process();
    }
  }
}

// 使用
const priorityPool = new PriorityRequestPool(3);

// 普通搜索请求
priorityPool.add(() => fetch('/api/search?q=手机').then(r => r.json()), 'normal');

// 高优先级的用户操作请求
priorityPool.add(() => fetch('/api/user/action', { method: 'POST' }).then(r => r.json()), 'high');
```

### 4.3 请求缓存管理

```javascript
/**
 * 带缓存的请求池
 * 相同URL的请求会被缓存，避免重复请求
 */

class CachedRequestPool {
  constructor(concurrency = 5, cacheOptions = {}) {
    this.pool = new RequestPool(concurrency);
    this.cache = new Map();

    const { maxAge = 60000, maxSize = 100 } = cacheOptions;
    this.maxAge = maxAge;      // 缓存有效期（毫秒）
    this.maxSize = maxSize;    // 最大缓存数量

    // 定时清理过期缓存
    setInterval(() => this.cleanExpiredCache(), this.maxAge);
  }

  /**
   * 发送请求，相同URL会被缓存
   */
  async fetch(url, options = {}) {
    const cacheKey = this.getCacheKey(url, options);
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      console.log('命中缓存:', cacheKey);
      return cached.data;
    }

    // 发起请求
    const requestFn = () => fetch(url, options).then(r => r.json());
    const data = await this.pool.add(requestFn);

    // 存入缓存
    this.setCache(cacheKey, data);

    return data;
  }

  /**
   * 获取缓存Key
   */
  getCacheKey(url, options) {
    return `${options.method || 'GET'}:${url}:${JSON.stringify(options.body || {})}`;
  }

  /**
   * 从缓存获取
   */
  getFromCache(key) {
    const cached = this.cache.get(key);

    if (!cached) return null;

    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }

    return cached;
  }

  /**
   * 设置缓存
   */
  setCache(key, data) {
    // 如果缓存已满，删除最老的
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      expiry: Date.now() + this.maxAge
    });
  }

  /**
   * 清理过期缓存
   */
  cleanExpiredCache() {
    const now = Date.now();

    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 清除所有缓存
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * 清除特定URL的缓存
   */
  invalidate(url) {
    for (const key of this.cache.keys()) {
      if (key.includes(url)) {
        this.cache.delete(key);
      }
    }
  }
}

// 使用
const cachedPool = new CachedRequestPool(5, { maxAge: 30000, maxSize: 50 });

// 第一次请求，会发出去
const data1 = await cachedPool.fetch('/api/users');

// 第二次请求（30秒内），命中缓存
const data2 = await cachedPool.fetch('/api/users');

// 清除缓存
cachedPool.invalidate('/api/users');
```

---

## 第五部分：Fetch最佳实践

### 5.1 错误处理模式

```javascript
/**
 * Fetch错误处理最佳实践
 */

// 方式1：手动检查状态码
async function fetchWithManualCheck(url) {
  const response = await fetch(url);

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.status = response.status;
    error.response = response;
    throw error;
  }

  return response.json();
}

// 方式2：封装成工具函数
async function safeFetch(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: options.credentials || 'include'
    });

    // 检查HTTP错误
    if (!response.ok) {
      let errorMessage;

      try {
        // 尝试解析错误信息
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error;
      } catch {
        errorMessage = response.statusText;
      }

      const error = new Error(errorMessage || '请求失败');
      error.status = response.status;
      error.response = response;
      throw error;
    }

    return response;

  } catch (error) {
    // 处理网络错误
    if (error.name === 'AbortError') {
      throw new Error('请求被取消');
    }

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('网络错误，请检查您的网络连接');
    }

    throw error;
  }
}

// 方式3：创建Fetch实例（类似Axios）
class FetchClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async get(endpoint, params) {
    const url = this.buildUrl(endpoint, params);
    return this.request(url, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async request(url, options = {}) {
    const response = await safeFetch(url, options);
    return response.json();
  }

  buildUrl(endpoint, params) {
    const url = this.baseUrl + endpoint;
    if (!params) return url;
    return url + '?' + new URLSearchParams(params);
  }
}
```

### 5.2 重试机制

```javascript
/**
 * Fetch重试机制
 */

async function fetchWithRetry(url, options = {}) {
  const {
    retries = 3,
    retryDelay = 1000,
    retryCondition = () => true, // 什么错误要重试
    onRetry = null               // 重试回调
  } = options;

  let lastError;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response;

    } catch (error) {
      lastError = error;

      // 判断是否要重试
      const shouldRetry = retryCondition(error) && i < retries - 1;

      if (shouldRetry) {
        const delay = retryDelay * Math.pow(2, i); // 指数退避
        console.log(`重试 ${i + 1}/${retries}，等待 ${delay}ms...`);

        if (onRetry) {
          onRetry(i + 1, error);
        }

        await new Promise(r => setTimeout(r, delay));
      } else {
        throw error;
      }
    }
  }

  throw lastError;
}

// 使用示例
const response = await fetchWithRetry('/api/data', {
  retries: 3,
  retryDelay: 1000,
  retryCondition: (error) => {
    // 只有网络错误或5xx错误才重试
    return error.name === 'TypeError' ||
           (error.status && error.status >= 500);
  },
  onRetry: (attempt, error) => {
    console.log(`第${attempt}次重试失败:`, error.message);
  }
});
```

### 5.3 并发请求控制

```javascript
/**
 * 并发请求控制
 * 控制同时进行的请求数量
 */

// 简单队列
class SimpleQueue {
  constructor(concurrency = 5) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  async add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.process();
    });
  }

  process() {
    while (this.running < this.concurrency && this.queue.length > 0) {
      const { fn, resolve, reject } = this.queue.shift();
      this.running++;

      fn()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          this.running--;
          this.process();
        });
    }
  }
}

// 使用
const queue = new SimpleQueue(3); // 最多3个并发

async function batchRequest(urls) {
  const requests = urls.map(url =>
    queue.add(() => fetch(url).then(r => r.json()))
  );

  return Promise.all(requests);
}

// 处理
const results = await batchRequest([
  '/api/users',
  '/api/posts',
  '/api/comments',
  '/api/tags',
  '/api/config'
]);
```

---

## 第六部分：Fetch与Service Worker

### 6.1 Service Worker中的Fetch

```javascript
// Service Worker拦截Fetch请求
// 可以用于缓存、离线支持等

const CACHE_NAME = 'my-app-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/main.js',
  '/static/css/main.css'
];

// 安装Service Worker时缓存资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('缓存文件');
        return cache.addAll(urlsToCache);
      })
  );
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 只缓存GET请求
  if (request.method !== 'GET') {
    return;
  }

  // 策略：缓存优先，网络其次
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // 如果缓存中有，直接返回
        if (cachedResponse) {
          // 同时发起网络请求更新缓存
          fetchAndCache(request);
          return cachedResponse;
        }

        // 缓存没有，发起网络请求
        return fetchAndCache(request);
      })
  );
});

// 获取并缓存
async function fetchAndCache(request) {
  const response = await fetch(request);

  // 如果是成功的响应，缓存起来
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }

  return response;
}
```

### 6.2 离线数据同步

```javascript
/**
 * 离线数据同步队列
 * 网络离线时把请求存入队列，恢复后自动重发
 */

class OfflineQueue {
  constructor() {
    this.storageKey = 'offline_queue';
  }

  /**
   * 添加到队列
   */
  async add(request) {
    const queue = await this.getQueue();
    queue.push({
      id: Date.now().toString(),
      request,
      timestamp: Date.now()
    });
    await localStorage.setItem(this.storageKey, JSON.stringify(queue));
  }

  /**
   * 获取队列
   */
  async getQueue() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  /**
   * 处理队列
   */
  async processQueue() {
    const queue = await this.getQueue();
    const failed = [];

    for (const item of queue) {
      try {
        await fetch(item.request.url, item.request);
        console.log('离线请求发送成功:', item.id);
      } catch (error) {
        console.error('离线请求失败:', item.id, error);
        failed.push(item);
      }
    }

    // 保存失败的
    await localStorage.setItem(this.storageKey, JSON.stringify(failed));
  }

  /**
   * 清空队列
   */
  async clear() {
    localStorage.removeItem(this.storageKey);
  }
}

const offlineQueue = new OfflineQueue();

// 监听网络状态
window.addEventListener('online', () => {
  console.log('网络恢复，处理离线队列...');
  offlineQueue.processQueue();
});

// 发送请求时自动处理离线情况
async function sendRequest(url, options = {}) {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();

  } catch (error) {
    // 网络离线，存入队列
    if (!navigator.onLine) {
      console.log('网络离线，请求已加入队列');
      await offlineQueue.add({ url, options });
      return { offline: true };
    }

    throw error;
  }
}
```

---

## 总结：Fetch的使用指南

1. **Fetch是浏览器原生API**，不需要安装库，体积为零
2. **需要手动处理很多Axios自动处理的事情**：
   - JSON转换
   - 错误状态码处理
   - 请求取消（用AbortController）
3. **Stream流处理是Fetch的独特优势**
4. **请求池是大型项目的必备基础设施**
5. **Service Worker中只能用Fetch**

**什么时候用Fetch？**
- 轻量级项目，不需要复杂功能
- 需要Stream流处理
- Service Worker/PWA开发
- React Native等非浏览器环境

**什么时候用Axios？**
- 需要完善的拦截器
- 需要取消请求（Axios的CancelToken更友好）
- 需要批量请求管理
- 需要完整的错误处理

---

**作者**：WebEnv-OS 教学组
**最后更新**：2026年4月
