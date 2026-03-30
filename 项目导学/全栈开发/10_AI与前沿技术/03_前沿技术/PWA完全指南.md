# PWA完全指南

## 目录

1. [PWA概述](#1-pwa概述)
2. [Service Worker详解](#2-service-worker详解)
3. [缓存策略](#3-缓存策略)
4. [离线应用开发](#4-离线应用开发)
5. [Web Push推送通知](#5-web-push推送通知)
6. [面试高频问题](#6-面试高频问题)

---

## 1. PWA概述

### 1.1 什么是PWA？

PWA（Progressive Web App）是一种使用现代Web技术构建的应用，具有类似原生应用的体验。

### 1.2 PWA核心特性

```
┌─────────────────────────────────────────────────────────────┐
│                     PWA核心特性                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 渐进式增强                                              │
│     └── 适用于所有浏览器，渐进增强体验                      │
│                                                             │
│  2. 响应式设计                                              │
│     └── 适配各种设备（手机、平板、桌面）                    │
│                                                             │
│  3. 离线可用                                                │
│     └── Service Worker缓存，离线也能访问                    │
│                                                             │
│  4. 类原生应用                                              │
│     └── 全屏运行、启动画面、推送通知                        │
│                                                             │
│  5. 安全                                                    │
│     └── 必须通过HTTPS提供服务                               │
│                                                             │
│  6. 可发现                                                  │
│     └── W3C清单，可被搜索引擎发现                           │
│                                                             │
│  7. 可安装                                                  │
│     └── 可添加到主屏幕，像原生应用一样启动                  │
│                                                             │
│  8. 可链接                                                  │
│     └── 通过URL分享，无需安装                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Web App Manifest

```json
// manifest.json

{
  "name": "我的PWA应用",
  "short_name": "PWA应用",
  "description": "一个现代化的PWA应用",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#007bff",
  "orientation": "portrait-primary",
  "scope": "/",
  "lang": "zh-CN",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/screenshot1.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    },
    {
      "src": "/screenshots/screenshot2.png",
      "sizes": "750x1334",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ],
  "shortcuts": [
    {
      "name": "新建文章",
      "short_name": "新建",
      "description": "创建一篇新文章",
      "url": "/new",
      "icons": [{ "src": "/icons/new.png", "sizes": "96x96" }]
    },
    {
      "name": "设置",
      "short_name": "设置",
      "url": "/settings",
      "icons": [{ "src": "/icons/settings.png", "sizes": "96x96" }]
    }
  ],
  "categories": ["productivity", "utilities"],
  "prefer_related_applications": false,
  "related_applications": [
    {
      "platform": "play",
      "url": "https://play.google.com/store/apps/details?id=com.example.app"
    }
  ]
}
```

```html
<!-- HTML中引入manifest -->
<link rel="manifest" href="/manifest.json">

<!-- 主题颜色 -->
<meta name="theme-color" content="#007bff">

<!-- iOS支持 -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="PWA应用">
<link rel="apple-touch-icon" href="/icons/icon-192x192.png">
```

---

## 2. Service Worker详解

### 2.1 Service Worker生命周期

```javascript
// Service Worker生命周期

/*
┌─────────────────────────────────────────────────────────────┐
│                 Service Worker生命周期                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  注册 (Register)                                            │
│     │                                                       │
│     ▼                                                       │
│  安装 (Install) ── 失败 ──► 销毁                            │
│     │                                                       │
│     ▼                                                       │
│  等待 (Waiting) ── 旧SW退出 ──► 激活                        │
│     │                                                       │
│     ▼                                                       │
│  激活 (Activate)                                            │
│     │                                                       │
│     ▼                                                       │
│  空闲 (Idle)                                                │
│     │                                                       │
│     ▼                                                       │
│  运行 (Running) ◄─── 拦截请求                               │
│     │                                                       │
│     ▼                                                       │
│  终止 (Terminated)                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
*/

// 注册Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/', // 作用范围
      });

      console.log('Service Worker注册成功:', registration.scope);

      // 检查更新
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // 新版本可用
            console.log('新版本可用，请刷新页面');
            showUpdateNotification();
          }
        });
      });
    } catch (error) {
      console.error('Service Worker注册失败:', error);
    }
  });
}

// 监听控制器变化
navigator.serviceWorker.addEventListener('controllerchange', () => {
  console.log('Service Worker已更新');
  window.location.reload();
});
```

### 2.2 Service Worker实现

```javascript
// sw.js - Service Worker实现

const CACHE_NAME = 'app-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/scripts/main.js',
  '/images/logo.png',
  '/offline.html',
];

// 安装事件 - 缓存静态资源
self.addEventListener('install', (event) => {
  console.log('Service Worker: 安装中...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: 缓存静态资源');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // 跳过等待，直接激活
        return self.skipWaiting();
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('Service Worker: 激活中...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('Service Worker: 删除旧缓存:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        // 立即控制所有客户端
        return self.clients.claim();
      })
  );
});

// 请求拦截 - 缓存策略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 只处理同源请求
  if (url.origin !== location.origin) {
    return;
  }

  // API请求使用网络优先
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 静态资源使用缓存优先
  event.respondWith(cacheFirst(request));
});

// 缓存优先策略
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    // 缓存响应
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // 网络失败，返回离线页面
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    throw error;
  }
}

// 网络优先策略
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    // 缓存响应
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // 网络失败，尝试从缓存获取
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

// 后台同步
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // 从IndexedDB获取待同步数据
  const pendingData = await getPendingDataFromIndexedDB();

  // 发送到服务器
  for (const data of pendingData) {
    await fetch('/api/sync', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 清除已同步数据
  await clearSyncedData();
}

// 推送通知
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};

  const options = {
    body: data.body || '您有新消息',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
    actions: [
      { action: 'open', title: '打开' },
      { action: 'close', title: '关闭' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '通知', options)
  );
});

// 通知点击
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});
```

---

## 3. 缓存策略

### 3.1 缓存策略详解

```javascript
// 缓存策略实现

// 1. 缓存优先（Cache First）
// 适用于：静态资源（JS、CSS、图片、字体）
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // 后台更新缓存
    fetchAndCache(request);
    return cachedResponse;
  }

  return fetchAndCache(request);
}

// 2. 网络优先（Network First）
// 适用于：API请求、动态内容
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

// 3. 网络优先，缓存回退，后台更新（Stale While Revalidate）
// 适用于：需要更新但可接受旧数据的内容
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = caches.open(CACHE_NAME);
      cache.then((c) => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  });

  return cachedResponse || fetchPromise;
}

// 4. 仅网络（Network Only）
// 适用于：实时数据、支付等
async function networkOnly(request) {
  return fetch(request);
}

// 5. 仅缓存（Cache Only）
// 适用于：版本化的静态资源
async function cacheOnly(request) {
  return caches.match(request);
}

// 辅助函数：获取并缓存
async function fetchAndCache(request) {
  const response = await fetch(request);

  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }

  return response;
}
```

### 3.2 Workbox使用

```javascript
// 使用Workbox简化Service Worker

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// 预缓存
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// 静态资源缓存
registerRoute(
  ({ request }) =>
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'worker',
  new CacheFirst({
    cacheName: 'static-resources',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  })
);

// 图片缓存
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  })
);

// 字体缓存
registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'fonts',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 }),
    ],
  })
);

// API缓存
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 }),
    ],
  })
);

// 第三方资源
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
  })
);

registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 }),
    ],
  })
);
```

---

## 4. 离线应用开发

### 4.1 IndexedDB存储

```typescript
// IndexedDB封装

class IndexedDBHelper {
  private dbName: string;
  private version: number;
  private db: IDBDatabase | null = null;

  constructor(dbName: string, version: number = 1) {
    this.dbName = dbName;
    this.version = version;
  }

  // 打开数据库
  async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建对象存储
        if (!db.objectStoreNames.contains('todos')) {
          const store = db.createObjectStore('todos', { keyPath: 'id' });
          store.createIndex('synced', 'synced', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('pending')) {
          db.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  // 添加数据
  async add<T>(storeName: string, data: T): Promise<void> {
    const db = await this.open();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // 获取所有数据
  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.open();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // 获取单条数据
  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    const db = await this.open();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // 更新数据
  async put<T>(storeName: string, data: T): Promise<void> {
    const db = await this.open();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // 删除数据
  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    const db = await this.open();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // 清空存储
  async clear(storeName: string): Promise<void> {
    const db = await this.open();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// 使用示例
const db = new IndexedDBHelper('myApp', 1);

// 添加待办事项
async function addTodo(todo: Todo) {
  await db.add('todos', {
    ...todo,
    synced: false,
    createdAt: new Date(),
  });

  // 注册后台同步
  if ('sync' in ServiceWorkerRegistration.prototype) {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-todos');
  }
}

// 获取所有待办事项
async function getTodos(): Promise<Todo[]> {
  return db.getAll('todos');
}
```

### 4.2 离线数据同步

```typescript
// 离线数据同步

// 1. 检测网络状态
class NetworkStatus {
  private online: boolean;
  private listeners: Set<(online: boolean) => void> = new Set();

  constructor() {
    this.online = navigator.onLine;

    window.addEventListener('online', () => {
      this.online = true;
      this.notifyListeners();
    });

    window.addEventListener('offline', () => {
      this.online = false;
      this.notifyListeners();
    });
  }

  isOnline(): boolean {
    return this.online;
  }

  subscribe(listener: (online: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.online));
  }
}

export const networkStatus = new NetworkStatus();

// 2. 离线队列
interface PendingRequest {
  id?: number;
  url: string;
  method: string;
  body?: any;
  headers?: Record<string, string>;
  timestamp: number;
}

class OfflineQueue {
  private db: IndexedDBHelper;

  constructor() {
    this.db = new IndexedDBHelper('offlineQueue', 1);
  }

  // 添加请求到队列
  async add(request: Omit<PendingRequest, 'timestamp'>): Promise<void> {
    await this.db.add('pending', {
      ...request,
      timestamp: Date.now(),
    });

    // 注册后台同步
    if ('sync' in ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-pending');
    }
  }

  // 获取所有待处理请求
  async getAll(): Promise<PendingRequest[]> {
    return this.db.getAll('pending');
  }

  // 删除已处理的请求
  async remove(id: number): Promise<void> {
    await this.db.delete('pending', id);
  }

  // 处理所有待处理请求
  async processAll(): Promise<void> {
    const pending = await this.getAll();

    for (const request of pending) {
      try {
        await fetch(request.url, {
          method: request.method,
          body: JSON.stringify(request.body),
          headers: request.headers,
        });

        await this.remove(request.id!);
      } catch (error) {
        console.error('同步失败:', request, error);
      }
    }
  }
}

export const offlineQueue = new OfflineQueue();

// 3. 离线感知的fetch
async function offlineAwareFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  if (networkStatus.isOnline()) {
    try {
      return await fetch(url, options);
    } catch (error) {
      // 网络错误，添加到离线队列
      if (options.method !== 'GET') {
        await offlineQueue.add({
          url,
          method: options.method || 'GET',
          body: options.body ? JSON.parse(options.body as string) : undefined,
          headers: options.headers as Record<string, string>,
        });
      }
      throw error;
    }
  } else {
    // 离线状态，添加到队列
    if (options.method !== 'GET') {
      await offlineQueue.add({
        url,
        method: options.method || 'GET',
        body: options.body ? JSON.parse(options.body as string) : undefined,
        headers: options.headers as Record<string, string>,
      });
    }
    throw new Error('离线状态');
  }
}

// 4. React Hook
function useNetworkStatus() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    return networkStatus.subscribe(setOnline);
  }, []);

  return online;
}

function useOfflineQueue() {
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const online = useNetworkStatus();

  useEffect(() => {
    if (online) {
      offlineQueue.processAll();
    }
  }, [online]);

  useEffect(() => {
    offlineQueue.getAll().then(setPending);
  }, []);

  return { pending, count: pending.length };
}
```

---

## 5. Web Push推送通知

### 5.1 推送通知实现

```typescript
// Web Push推送通知实现

// 1. 订阅推送
async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!('PushManager' in window)) {
    console.log('浏览器不支持推送通知');
    return null;
  }

  const registration = await navigator.serviceWorker.ready;

  // 检查是否已订阅
  let subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    return subscription;
  }

  // 创建新订阅
  try {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        'YOUR_PUBLIC_VAPID_KEY'
      ),
    });

    // 发送订阅到服务器
    await fetch('/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription),
      headers: { 'Content-Type': 'application/json' },
    });

    return subscription;
  } catch (error) {
    console.error('订阅失败:', error);
    return null;
  }
}

// 2. 取消订阅
async function unsubscribeFromPush(): Promise<boolean> {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    await subscription.unsubscribe();

    // 通知服务器
    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ endpoint: subscription.endpoint }),
      headers: { 'Content-Type': 'application/json' },
    });

    return true;
  }

  return false;
}

// 3. 请求通知权限
async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.log('浏览器不支持通知');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

// 4. 显示本地通知
async function showLocalNotification(title: string, options: NotificationOptions = {}) {
  const permission = await requestNotificationPermission();

  if (permission !== 'granted') {
    console.log('通知权限未授予');
    return;
  }

  const registration = await navigator.serviceWorker.ready;

  await registration.showNotification(title, {
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge.png',
    vibrate: [100, 50, 100],
    ...options,
  });
}

// 5. 辅助函数
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

// 6. React Hook
function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const subscribe = async () => {
    const perm = await requestNotificationPermission();
    setPermission(perm);

    if (perm === 'granted') {
      const sub = await subscribeToPush();
      setSubscription(sub);
    }
  };

  const unsubscribe = async () => {
    await unsubscribeFromPush();
    setSubscription(null);
  };

  const showNotification = async (title: string, options?: NotificationOptions) => {
    await showLocalNotification(title, options);
  };

  return {
    permission,
    subscription,
    subscribe,
    unsubscribe,
    showNotification,
    isSupported: 'PushManager' in window,
  };
}
```

### 5.2 服务端推送

```typescript
// 服务端推送实现 (Node.js)

import webpush from 'web-push';

// 配置VAPID密钥
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  'YOUR_PUBLIC_VAPID_KEY',
  'YOUR_PRIVATE_VAPID_KEY'
);

// 存储订阅
const subscriptions = new Map<string, PushSubscription>();

// 订阅接口
app.post('/api/push/subscribe', async (req, res) => {
  const subscription = req.body;
  subscriptions.set(subscription.endpoint, subscription);
  res.status(201).json({ success: true });
});

// 取消订阅接口
app.post('/api/push/unsubscribe', async (req, res) => {
  const { endpoint } = req.body;
  subscriptions.delete(endpoint);
  res.status(200).json({ success: true });
});

// 发送推送
async function sendPush(subscription: PushSubscription, payload: any) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return true;
  } catch (error) {
    console.error('推送失败:', error);
    // 订阅无效，删除
    if (error.statusCode === 410) {
      subscriptions.delete(subscription.endpoint);
    }
    return false;
  }
}

// 批量推送
async function broadcastPush(payload: any) {
  const results = await Promise.allSettled(
    Array.from(subscriptions.values()).map((sub) => sendPush(sub, payload))
  );

  const successful = results.filter((r) => r.status === 'fulfilled').length;
  console.log(`推送完成: ${successful}/${subscriptions.size}`);
}

// 定时推送
import cron from 'node-cron';

cron.schedule('0 9 * * *', async () => {
  await broadcastPush({
    title: '每日提醒',
    body: '您有新的任务待处理',
    icon: '/icons/icon-192x192.png',
    url: '/tasks',
  });
});
```

---

## 6. 面试高频问题

### 问题1：PWA和原生应用的区别？

**答案：**
| 方面 | PWA | 原生应用 |
|------|-----|----------|
| 安装 | 无需安装 | 需要下载安装 |
| 更新 | 自动更新 | 需要手动更新 |
| 离线 | 支持 | 支持 |
| 推送 | 支持 | 支持 |
| 性能 | 较低 | 较高 |
| 访问设备 | 有限 | 完全 |
| 分发 | URL分享 | 应用商店 |

### 问题2：Service Worker的作用？

**答案：**
1. 拦截网络请求
2. 实现离线缓存
3. 后台同步
4. 推送通知
5. 性能优化

### 问题3：常见的缓存策略有哪些？

**答案：**
1. **Cache First**：缓存优先，适用于静态资源
2. **Network First**：网络优先，适用于动态内容
3. **Stale While Revalidate**：缓存回退，后台更新
4. **Network Only**：仅网络，适用于实时数据
5. **Cache Only**：仅缓存，适用于版本化资源

### 问题4：如何实现离线数据同步？

**答案：**
1. 使用IndexedDB存储数据
2. 使用Background Sync API
3. 检测网络状态
4. 网络恢复后自动同步

### 问题5：PWA如何实现推送通知？

**答案：**
1. 请求通知权限
2. 订阅Push服务
3. 将订阅发送到服务器
4. 服务器使用web-push发送通知
5. Service Worker接收并显示通知

---

## 7. 最佳实践总结

### 7.1 PWA清单

- [ ] 创建manifest.json
- [ ] 注册Service Worker
- [ ] 实现离线缓存
- [ ] 配置HTTPS
- [ ] 添加安装提示
- [ ] 实现推送通知
- [ ] 优化性能
- [ ] 测试各种网络条件

### 7.2 常见问题解决

| 问题 | 解决方案 |
|------|----------|
| 缓存更新 | 版本化缓存名 |
| 离线数据 | IndexedDB |
| 推送权限 | 引导用户授权 |
| iOS兼容 | 添加meta标签 |

---

*本文档最后更新于 2026年3月*