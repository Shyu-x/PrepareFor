# Web前端核心技术完全指南

## 目录

1. [浏览器存储技术](#1-浏览器存储技术)
2. [Cookie技术](#2-cookie技术)
3. [Session管理](#3-session管理)
4. [缓存机制](#4-缓存机制)
5. [网络请求](#5-网络请求)
6. [浏览器API](#6-浏览器api)
7. [Web安全基础](#7-web安全基础)

---

## 1. 浏览器存储技术

### 1.1 LocalStorage

```typescript
// LocalStorage特点：
// - 持久化存储，除非手动删除
// - 容量约5MB
// - 同源策略限制
// - 只支持字符串存储

// 存储数据
function setItem(key: string, value: any) {
  // 注意：LocalStorage只能存储字符串
  const serialized = JSON.stringify(value);
  localStorage.setItem(key, serialized);
}

// 读取数据
function getItem<T>(key: string): T | null {
  const item = localStorage.getItem(key);
  if (!item) return null;
  try {
    return JSON.parse(item) as T;
  } catch {
    return item as unknown as T;
  }
}

// 删除数据
function removeItem(key: string) {
  localStorage.removeItem(key);
}

// 清空所有
function clear() {
  localStorage.clear();
}

// 监听变化（其他标签页）
window.addEventListener('storage', (event) => {
  console.log('存储变化:', event.key, event.newValue);
});

// 使用示例
interface User {
  name: string;
  age: number;
}

setItem<User>('user', { name: '张三', age: 25 });
const user = getItem<User>('user');
console.log(user?.name); // 张三
```

### 1.2 SessionStorage

```typescript
// SessionStorage特点：
// - 会话级存储，关闭标签页后失效
// - 容量约5MB
// - 只支持当前标签页
// - 页面刷新后仍然存在

// 基本操作与LocalStorage相同
sessionStorage.setItem('key', 'value');
const value = sessionStorage.getItem('key');

// 区别：只在当前会话有效
sessionStorage.setItem('tempData', '临时数据');
// 关闭标签页后自动清除

// 常见用途
function saveFormState(formData: object) {
  sessionStorage.setItem('formDraft', JSON.stringify(formData));
}

function restoreFormState() {
  const draft = sessionStorage.getItem('formDraft');
  return draft ? JSON.parse(draft) : null;
}

function clearFormState() {
  sessionStorage.removeItem('formDraft');
}
```

### 1.3 IndexedDB

```typescript
// IndexedDB特点：
// - 大容量存储（取决于磁盘空间）
// - 支持索引和事务
// - 异步操作
// - 存储复杂数据结构

// 打开数据库
function openDB(dbName: string, version: number = 1): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      // 创建对象存储
      if (!db.objectStoreNames.contains('users')) {
        const store = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
        // 创建索引
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('email', 'email', { unique: true });
      }
    };
  });
}

// 添加数据
async function addUser(db: IDBDatabase, user: { name: string; email: string }) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['users'], 'readwrite');
    const store = transaction.objectStore('users');
    const request = store.add(user);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 查询数据
async function getUserById(db: IDBDatabase, id: number) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 使用索引查询
async function getUserByName(db: IDBDatabase, name: string) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    const index = store.index('name');
    const request = index.get(name);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 删除数据
async function deleteUser(db: IDBDatabase, id: number) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['users'], 'readwrite');
    const store = transaction.objectStore('users');
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}
```

### 1.4 存储对比

| 特性 | LocalStorage | SessionStorage | IndexedDB |
|------|--------------|----------------|------------|
| 容量 | ~5MB | ~5MB | 数百MB+ |
| 数据类型 | 字符串 | 字符串 | 复杂对象 |
| API | 同步 | 同步 | 异步 |
| 索引 | 不支持 | 不支持 | 支持 |
| 事务 | 不支持 | 不支持 | 支持 |
| 生命周期 | 永久 | 会话结束 | 永久 |
| 同源限制 | 是 | 是 | 是 |

---

## 2. Cookie技术

### 2.1 Cookie基础

```typescript
// Cookie特点：
// - 每次请求自动发送到服务器
// - 大小限制约4KB
// - 可设置过期时间
// - 支持HttpOnly（防止XSS）
// - 支持Secure（仅HTTPS）
// - 支持SameSite（CSRF防护）

// 读取Cookie
function getCookie(name: string): string | null {
  const matches = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)')
  );
  return matches ? decodeURIComponent(matches[1]) : null;
}

// 设置Cookie
function setCookie(name: string, value: string, options: {
  expires?: number | Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
} = {}) {
  let cookieStr = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (options.expires) {
    const date = options.expires instanceof Date
      ? options.expires
      : new Date(Date.now() + options.expires * 1000);
    cookieStr += `; expires=${date.toUTCString()}`;
  }

  if (options.path) cookieStr += `; path=${options.path}`;
  if (options.domain) cookieStr += `; domain=${options.domain}`;
  if (options.secure) cookieStr += '; secure';
  if (options.sameSite) cookieStr += `; samesite=${options.sameSite}`;

  document.cookie = cookieStr;
}

// 删除Cookie
function deleteCookie(name: string, path?: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT${path ? `; path=${path}` : ''}`;
}

// 使用示例
// 登录后保存Token
setCookie('auth_token', 'xxx', {
  expires: 7 * 24 * 60 * 60, // 7天
  path: '/',
  sameSite: 'strict'
});

// HttpOnly Cookie（需服务端设置）
// Set-Cookie: token=xxx; HttpOnly; Secure; SameSite=Strict
```

### 2.2 Cookie与Session

```typescript
// 前端发送Cookie（自动）
// 浏览器会自动发送同源的Cookie到服务器

// 手动设置Cookie用于认证
function setSessionCookie(sessionId: string) {
  setCookie('SESSION_ID', sessionId, {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时
    path: '/',
    sameSite: 'lax'
  });
}

// 检查登录状态
function isLoggedIn(): boolean {
  return !!getCookie('SESSION_ID') || !!getCookie('auth_token');
}

// 退出登录
function logout() {
  deleteCookie('SESSION_ID');
  deleteCookie('auth_token');
  window.location.href = '/login';
}
```

---

## 3. Session管理

### 3.1 Session基础

```typescript
// Session存储方式对比

// 1. 服务端Session
// 优点：安全、可存储大量数据
// 缺点：需要服务器存储、分布式需要共享

// 2. Client-side Session（JWT）
// 优点：无状态、易于扩展
// 缺点：Token泄露风险、大小限制

// 3. BFF模式 Session
// 优点：结合两者优点
// 缺点：复杂度增加
```

### 3.2 JWT实现

```typescript
// JWT结构：header.payload.signature

// 生成JWT（通常在服务端）
function createJWT(payload: object, secret: string): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = HMAC_SHA256(encodedHeader + '.' + encodedPayload, secret);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// 解析JWT
function parseJWT(token: string): { header: any; payload: any } | null {
  try {
    const [encodedHeader, encodedPayload] = token.split('.');
    return {
      header: JSON.parse(atob(encodedHeader)),
      payload: JSON.parse(atob(encodedPayload))
    };
  } catch {
    return null;
  }
}

// 验证JWT过期
function isTokenExpired(token: string): boolean {
  const { payload } = parseJWT(token) || {};
  if (!payload.exp) return false;
  return Date.now() >= payload.exp * 1000;
}

// Token刷新
async function refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  return response.json();
}
```

---

## 4. 缓存机制

### 4.1 HTTP缓存

```typescript
// 强缓存
// - Expires: 绝对时间
// - Cache-Control: 相对时间

// 响应头设置示例（服务端）
// Cache-Control: public, max-age=3600, s-maxage=86400
// Expires: Wed, 21 Oct 2026 07:28:00 GMT

// 协商缓存
// - ETag / If-None-Match
// - Last-Modified / If-Modified-Since

// 前端处理缓存
async function fetchWithCache(url: string): Promise<Response> {
  const response = await fetch(url, {
    headers: {
      // 强制使用网络（绕过缓存）
      // 'Cache-Control': 'no-cache'

      // 仅使用缓存
      // 'Cache-Control': 'only-if-cached'
    }
  });
  return response;
}
```

### 4.2 Service Worker缓存

```typescript
// sw.js - Service Worker
const CACHE_NAME = 'my-app-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/main.js',
  '/static/css/main.css'
];

// 安装事件
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// 缓存命中
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // 命中缓存返回缓存，否则网络请求
      return response || fetch(event.request).then((fetchResponse) => {
        // 可选：缓存新请求的资源
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, fetchResponse.clone());
          return fetchResponse;
        });
      });
    })
  );
});

// 激活事件（清理旧缓存）
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

### 4.3 缓存策略

```typescript
// 常见缓存策略

// 1. Cache First（缓存优先）
async function cacheFirst(request: Request): Promise<Response> {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  const cache = await caches.open(CACHE_NAME);
  cache.put(request, response.clone());
  return response;
}

// 2. Network First（网络优先）
async function networkFirst(request: Request): Promise<Response> {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    return caches.match(request);
  }
}

// 3. Stale-While-Revalidate
async function staleWhileRevalidate(request: Request): Promise<Response> {
  const cached = await caches.match(request);

  const fetchPromise = fetch(request).then((response) => {
    caches.open(CACHE_NAME).then((cache) => {
      cache.put(request, response.clone());
    });
    return response;
  });

  return cached || fetchPromise;
}

// 4. Cache Only
async function cacheOnly(request: Request): Promise<Response> {
  return caches.match(request);
}

// 5. Network Only
async function networkOnly(request: Request): Promise<Response> {
  return fetch(request);
}
```

---

## 5. 网络请求

### 5.1 Fetch API

```typescript
// 基础GET请求
async function getData<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// POST请求
async function postData<T>(url: string, data: object): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });

  return response.json();
}

// 文件上传
async function uploadFile(url: string, file: File): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(url, {
    method: 'POST',
    body: formData
    // 注意：不要设置Content-Type，让浏览器自动设置
  });
}

// 请求取消
const controller = new AbortController();
const signal = controller.signal;

fetch('/api/data', { signal })
  .then(response => response.json())
  .catch(err => {
    if (err.name === 'AbortError') {
      console.log('请求已取消');
    }
  });

// 取消请求
controller.abort();

// 请求超时
function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 5000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  return fetch(url, {
    ...options,
    signal: controller.signal
  }).finally(() => clearTimeout(timeoutId));
}
```

### 5.2 Axios封装

```typescript
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// 创建实例
const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加Token
    const token = getCookie('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token过期，跳转登录
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 封装常用方法
class HttpClient {
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await api.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await api.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await api.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await api.delete<T>(url, config);
    return response.data;
  }
}

export const http = new HttpClient();
```

### 5.3 WebSocket

```typescript
// 创建WebSocket连接
const ws = new WebSocket('wss://example.com/socket');

// 连接打开
ws.onopen = () => {
  console.log('WebSocket连接已建立');
  ws.send(JSON.stringify({ type: 'hello' }));
};

// 接收消息
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('收到消息:', data);
};

// 发生错误
ws.onerror = (error) => {
  console.error('WebSocket错误:', error);
};

// 连接关闭
ws.onclose = (event) => {
  console.log('连接关闭:', event.code, event.reason);
};

// 发送消息
ws.send(JSON.stringify({ type: 'message', content: 'Hello' }));

// 关闭连接
ws.close(1000, '正常关闭');

// 自动重连
class ReconnectingWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectInterval = 3000;

  constructor(url: string) {
    this.url = url;
    this.connect();
  }

  private connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onclose = () => {
      setTimeout(() => this.connect(), this.reconnectInterval);
    };
  }

  send(data: any) {
    this.ws?.send(JSON.stringify(data));
  }
}
```

---

## 6. 浏览器API

### 6.1 History API

```typescript
// 前进后退
history.back();
history.forward();
history.go(-1);

// 编程式导航
history.pushState({ page: 1 }, '', '/page1');
history.pushState({ page: 2 }, '', '/page2');

// 替换当前历史记录
history.replaceState({ page: 1 }, '', '/page1');

// 监听popstate事件
window.addEventListener('popstate', (event) => {
  console.log('状态变化:', event.state);
});

// 获取当前状态
const currentState = history.state;

// SPA路由实现
class Router {
  private routes: Map<string, () => void> = new Map();

  register(path: string, handler: () => void) {
    this.routes.set(path, handler);
  }

  navigate(path: string) {
    history.pushState({}, '', path);
    this.handleRoute(path);
  }

  handleRoute(path: string) {
    const handler = this.routes.get(path);
    if (handler) {
      handler();
    } else {
      console.error('路由不存在:', path);
    }
  }

  init() {
    window.addEventListener('popstate', () => {
      this.handleRoute(window.location.pathname);
    });
    this.handleRoute(window.location.pathname);
  }
}
```

### 6.2 Location API

```typescript
// 获取URL信息
const url = new URL('https://example.com:8080/path?name=张三&age=25#section');

console.log(url.href);        // 完整URL
console.log(url.origin);      // https://example.com:8080
console.log(url.protocol);    // https:
console.log(url.host);        // example.com:8080
console.log(url.hostname);    // example.com
console.log(url.port);        // 8080
console.log(url.pathname);     // /path
console.log(url.search);      // ?name=张三&age=25
console.log(url.hash);        // #section

// 解析查询参数
const params = new URLSearchParams(url.search);
console.log(params.get('name')); // 张三
console.log(params.get('age')); // 25

// 遍历参数
params.forEach((value, key) => {
  console.log(`${key}: ${value}`);
});

// 修改URL
url.searchParams.set('age', '30');
url.searchParams.append('city', '北京');
url.searchParams.delete('age');

window.location.href = 'https://example.com';
window.location.reload();
window.location.replace('https://example.com');
```

### 6.3 File API

```typescript
// 文件选择
<input type="file" id="fileInput" />

const fileInput = document.getElementById('fileInput') as HTMLInputElement;

fileInput.addEventListener('change', (event) => {
  const files = (event.target as HTMLInputElement).files;

  if (files && files.length > 0) {
    const file = files[0];

    // 文件信息
    console.log(file.name);        // 文件名
    console.log(file.size);        // 文件大小（字节）
    console.log(file.type);        // MIME类型
    console.log(file.lastModified); // 最后修改时间

    // 读取文件内容
    const reader = new FileReader();

    reader.onload = (e) => {
      console.log(e.target?.result); // 文件内容
    };

    // 读取为文本
    reader.readAsText(file);

    // 读取为DataURL（用于图片预览）
    reader.readAsDataURL(file);

    // 读取为ArrayBuffer
    reader.readAsArrayBuffer(file);
  }
});

// 拖拽上传
const dropZone = document.getElementById('dropZone');

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();

  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    handleFiles(files);
  }
});

function handleFiles(files: FileList) {
  Array.from(files).forEach(file => {
    console.log(file.name);
  });
}
```

### 6.4 Blob与URL

```typescript
// Blob操作
const blob = new Blob(['Hello, World!'], { type: 'text/plain' });
console.log(blob.size);  // 13
console.log(blob.type);  // text/plain

// 创建下载链接
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// 下载文本文件
function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, filename);
}

// 下载JSON
function downloadJSON(data: object, filename: string) {
  const text = JSON.stringify(data, null, 2);
  downloadText(text, filename);
}

// 从URL创建Blob
async function fetchAsBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  return response.blob();
}
```

---

## 7. Web安全基础

### 7.1 XSS防护

```typescript
// XSS（跨站脚本攻击）防护

// 1. HTML转义
function escapeHTML(str: string): string {
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  return str.replace(/[&<>"'/]/g, char => escapeMap[char]);
}

// 2. URL编码
function encodeURIComponentSafe(str: string): string {
  return encodeURIComponent(str)
    .replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

// 3. DOM中的XSS防护
// 使用textContent而不是innerHTML
element.textContent = userInput;  // 安全
// element.innerHTML = userInput;  // 危险

// 4. CSP（内容安全策略）
// 响应头设置
// Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://trusted.cdn.com
```

### 7.2 CSRF防护

```typescript
// CSRF（跨站请求伪造）防护

// 1. CSRF Token
function getCSRFToken(): string {
  return getCookie('csrf_token') || '';
}

function fetchWithCSRF(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'X-CSRF-Token': getCSRFToken()
    }
  });
}

// 2. SameSite Cookie
setCookie('session', token, {
  sameSite: 'strict'  // 完全阻止CSRF
  // sameSite: 'lax'   // 部分场景允许
  // sameSite: 'none' // 需要Secure
});

// 3. Origin检查（服务端）
// 检查请求Origin或Referer头
```

### 7.3 密码安全

```typescript
// 密码处理（前端只能做辅助，真正的安全在后端）

// 1. 不在前端存储明文密码
// 2. 使用HTTPS传输
// 3. 密码强度验证
function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('密码至少8个字符');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('密码需要包含大写字母');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('密码需要包含小写字母');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('密码需要包含数字');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('密码需要包含特殊字符');
  }

  return { valid: errors.length === 0, errors };
}

// 4. 密码显示/隐藏
function togglePasswordVisibility(input: HTMLInputElement) {
  input.type = input.type === 'password' ? 'text' : 'password';
}
```

---

## 参考资源

- [MDN Web Docs](https://developer.mozilla.org/)
- [Web API Reference](https://developer.mozilla.org/en-US/docs/Web/API)

---

*本文档持续更新，最后更新于2026年3月*
