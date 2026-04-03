# PWA与WebAssembly完全指南

## 目录

1. [PWA渐进式Web应用](#1-pwa渐进式web应用)
2. [WebAssembly](#2-webassembly)
3. [Web Workers](#3-web-workers)
4. [离线存储](#4-离线存储)
5. [推送通知](#5-推送通知)
6. [原生能力](#6-原生能力)
7. [性能指标](#7-性能指标)
8. [高级特性](#8-高级特性)

---

## 1. PWA渐进式Web应用

### 1.1 PWA核心概念

PWA（Progressive Web App，渐进式Web应用）是一种使用现代Web技术构建的应用，具有类似原生应用的体验。PWA不是一种全新的技术，而是通过一系列技术标准和最佳实践的组合，让Web应用能够：

- **可安装**：用户可以将应用添加到主屏幕，像原生应用一样启动
- **可离线**：通过Service Worker实现离线可用，无网络也能访问
- **推送通知**：像原生应用一样接收实时推送消息
- **渐进增强**：适用于所有浏览器，在支持的浏览器中获得增强体验

```
┌─────────────────────────────────────────────────────────────┐
│                     PWA核心特性                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  可安装      │  │  可离线      │  │  推送通知    │          │
│  │  manifest   │  │  Service    │  │  Push API   │          │
│  │  .json      │  │  Worker     │  │             │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  响应式      │  │  安全        │  │  渐进增强    │          │
│  │  设计        │  │  HTTPS      │  │  任何浏览器  │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Service Worker生命周期

Service Worker是PWA的核心技术，它是一个运行在浏览器后台的独立脚本，可以拦截网络请求、缓存资源、推送通知等。Service Worker具有独立的生命周期：

```
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
```

**生命周期详解：**

1. **注册阶段**：浏览器读取Service Worker文件并在后台安装
2. **安装阶段**：执行安装事件回调，缓存静态资源
3. **等待阶段**：新版本等待旧版本完全退出
4. **激活阶段**：清理旧缓存，管理标签页
5. **运行阶段**：拦截所有 fetch 和 push 事件

```javascript
// Service Worker注册
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // 注册Service Worker，指定作用范围
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service Worker注册成功:', registration.scope);

      // 监听更新事件
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        newWorker.addEventListener('statechange', () => {
          // 当新版本安装完成且当前有旧版本在运行
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
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

// 监听控制器变化（当新SW激活时）
navigator.serviceWorker.addEventListener('controllerchange', () => {
  window.location.reload();
});
```

### 1.3 Service Worker核心事件

Service Worker有四个核心事件：install、activate、fetch、push。

```javascript
// sw.js - Service Worker完整实现

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

  // waitUntil确保安装完成后再激活
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: 缓存静态资源');
        // 添加所有静态资源到缓存
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // 跳过等待阶段，直接激活新版本
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
        // 过滤出需要删除的旧缓存
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
        // 立即获取所有客户端的控制权
        return self.clients.claim();
      })
  );
});

// 请求拦截 - 实现缓存策略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 只处理同源请求
  if (url.origin !== location.origin) {
    return;
  }

  // 根据请求类型选择不同的缓存策略
  if (url.pathname.startsWith('/api/')) {
    // API请求使用网络优先策略（优先获取最新数据）
    event.respondWith(networkFirst(request));
  } else {
    // 静态资源使用缓存优先策略（提升加载速度）
    event.respondWith(cacheFirst(request));
  }
});
```

### 1.4 离线缓存策略

离线缓存策略是Service Worker最核心的功能，不同类型的资源应该使用不同的策略：

```
┌─────────────────────────────────────────────────────────────┐
│                    缓存策略对比                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Cache First（缓存优先）                                    │
│  ├── 适用：静态资源（JS、CSS、图片、字体）                    │
│  ├── 流程：先查缓存 → 有则返回 → 无则网络 → 缓存结果          │
│  └── 优点：加载极快，节省带宽                                 │
│                                                             │
│  Network First（网络优先）                                   │
│  ├── 适用：API数据、实时内容                                 │
│  ├── 流程：先请求网络 → 成功则缓存 → 失败则用缓存            │
│  └── 优点：数据最新，兼容离线                                │
│                                                             │
│  Stale While Revalidate（过期回退）                         │
│  ├── 适用：可接受旧数据的场景                                │
│  ├── 流程：立即返回缓存 → 后台异步更新                       │
│  └── 优点：响应快，同时保证数据更新                           │
│                                                             │
│  Cache Only（仅缓存）                                        │
│  ├── 适用：版本化静态资源                                    │
│  └── 流程：仅从缓存返回                                      │
│                                                             │
│  Network Only（仅网络）                                      │
│  ├── 适用：实时数据、支付等                                  │
│  └── 流程：仅从网络获取                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**缓存策略实现代码：**

```javascript
// 缓存优先策略 - 适用于静态资源
async function cacheFirst(request) {
  // 1. 首先检查缓存中是否有响应
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // 2. 缓存命中，后台异步更新缓存（保证下次访问有最新内容）
    fetchAndCache(request);
    return cachedResponse;
  }

  // 3. 缓存未命中，从网络获取
  return fetchAndCache(request);
}

// 网络优先策略 - 适用于API数据
async function networkFirst(request) {
  try {
    // 1. 尝试从网络获取
    const networkResponse = await fetch(request);

    // 2. 网络成功，缓存响应
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // 3. 网络失败，尝试从缓存获取
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // 4. 缓存也没有，返回离线页面（仅对导航请求）
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }

    throw error;
  }
}

// Stale While Revalidate策略 - 平衡速度与新鲜度
async function staleWhileRevalidate(request) {
  // 1. 立即返回缓存（如果有）
  const cachedResponse = await caches.match(request);

  // 2. 同时发起网络请求更新缓存
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = caches.open(CACHE_NAME);
      cache.then((c) => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  });

  // 3. 返回缓存或等待网络响应
  return cachedResponse || fetchPromise;
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

### 1.5 manifest.json配置

Web App Manifest是PWA可安装性的关键，它定义了应用的名称、图标、启动画面等元数据。

```json
{
  "name": "新闻阅读器",
  "short_name": "新闻",
  "description": "一款支持离线阅读的新闻应用",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#007bff",
  "orientation": "portrait-primary",
  "scope": "/",
  "lang": "zh-CN",
  "categories": ["news", "productivity"],
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/wide.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    },
    {
      "src": "/screenshots/narrow.png",
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
      "name": "我的收藏",
      "short_name": "收藏",
      "url": "/favorites"
    }
  ],
  "prefer_related_applications": false
}
```

**HTML中引入manifest：**

```html
<!-- 引入Web App Manifest -->
<link rel="manifest" href="/manifest.json">

<!-- 主题颜色 - 影响浏览器地址栏颜色 -->
<meta name="theme-color" content="#007bff">

<!-- iOS Safari支持 -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="新闻阅读">
<link rel="apple-touch-icon" href="/icons/icon-192x192.png">

<!-- Windows磁贴图标 -->
<meta name="msapplication-TileImage" content="/icons/tile.png">
<meta name="msapplication-TileColor" content="#007bff">
```

### 1.6 实战：打造可离线阅读的新闻PWA

下面我们来实现一个完整的可离线新闻阅读器：

```typescript
// news-pwa/sw.ts - 新闻PWA的Service Worker

const CACHE_VERSION = 'news-v1';
const STATIC_CACHE = 'news-static-v1';
const DYNAMIC_CACHE = 'news-dynamic-v1';
const API_CACHE = 'news-api-v1';

// 需要预缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/scripts/app.js',
  '/images/logo.svg',
  '/offline.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// 安装事件 - 预缓存静态资源
self.addEventListener('install', (event) => {
  console.log('[SW] 安装中...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] 预缓存静态资源');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[SW] 激活中...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name.startsWith('news-') &&
                   name !== STATIC_CACHE &&
                   name !== DYNAMIC_CACHE &&
                   name !== API_CACHE;
          })
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// 获取请求 - 根据类型选择缓存策略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 同源请求处理
  if (url.origin === location.origin) {
    // API请求 - 网络优先
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(networkFirst(request, API_CACHE));
      return;
    }

    // 静态资源 - 缓存优先
    if (isStaticAsset(url.pathname)) {
      event.respondWith(cacheFirst(request, STATIC_CACHE));
      return;
    }

    // 页面导航 - Stale While Revalidate
    if (request.mode === 'navigate') {
      event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
      return;
    }
  }

  // 第三方资源 - Stale While Revalidate
  if (url.origin.includes('fonts.googleapis.com') ||
      url.origin.includes('fonts.gstatic.com')) {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
  }
});

// 推送通知事件
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};

  const options = {
    body: data.body || '您有一条新消息',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      articleId: data.articleId,
    },
    actions: [
      { action: 'read', title: '立即阅读' },
      { action: 'close', title: '稍后提醒' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '新闻推送', options)
  );
});

// 通知点击事件
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'read' || !event.action) {
    const url = event.notification.data.url;

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // 如果已有窗口打开，则聚焦
          for (const client of clientList) {
            if (client.url === url && 'focus' in client) {
              return client.focus();
            }
          }
          // 否则打开新窗口
          return clients.openWindow(url);
        })
    );
  }
});

// 后台同步事件
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-articles') {
    event.waitUntil(syncArticles());
  }
  if (event.tag === 'sync-favorites') {
    event.waitUntil(syncFavorites());
  }
});

// 同步离线时收藏的文章
async function syncArticles() {
  try {
    const db = await openDB();
    const offlineArticles = await db.getAll('offlineQueue');

    for (const article of offlineArticles) {
      try {
        await fetch('/api/articles', {
          method: 'POST',
          body: JSON.stringify(article),
          headers: { 'Content-Type': 'application/json' },
        });
        await db.delete('offlineQueue', article.id);
      } catch (error) {
        console.error('同步失败:', error);
      }
    }
  } catch (error) {
    console.error('同步出错:', error);
  }
}

async function syncFavorites() {
  // 实现收藏同步逻辑
}

// IndexedDB帮助类
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('NewsDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 创建文章存储
      if (!db.objectStoreNames.contains('articles')) {
        db.createObjectStore('articles', { keyPath: 'id' });
      }

      // 创建离线队列
      if (!db.objectStoreNames.contains('offlineQueue')) {
        db.createObjectStore('offlineQueue', { keyPath: 'id' });
      }
    };
  });
}

// 工具函数
function isStaticAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|gif|svg|woff2?|ttf|eot)$/.test(pathname);
}
```

**新闻应用的前端代码：**

```typescript
// app.ts - 新闻应用主逻辑

class NewsApp {
  private db: any;
  private articles: Article[] = [];

  constructor() {
    this.init();
  }

  async init() {
    // 打开IndexedDB
    this.db = await this.openDB();

    // 加载文章列表
    await this.loadArticles();

    // 监听网络状态
    this.setupNetworkListeners();

    // 注册推送通知
    await this.registerPush();
  }

  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('NewsDB', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('articles')) {
          db.createObjectStore('articles', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('offlineQueue')) {
          db.createObjectStore('offlineQueue', { keyPath: 'id', autoIncrement: true });
        }

        if (!db.objectStoreNames.contains('favorites')) {
          db.createObjectStore('favorites', { keyPath: 'id' });
        }
      };
    });
  }

  async loadArticles() {
    try {
      // 在线：获取网络数据并缓存
      if (navigator.onLine) {
        const response = await fetch('/api/articles');
        const articles = await response.json();

        // 缓存到IndexedDB
        for (const article of articles) {
          await this.saveToDB('articles', article);
        }

        this.articles = articles;
        this.renderArticles(articles);
      } else {
        // 离线：从IndexedDB加载
        this.articles = await this.getAllFromDB('articles');
        this.renderArticles(this.articles);
        this.showOfflineNotice();
      }
    } catch (error) {
      console.error('加载失败:', error);
      this.articles = await this.getAllFromDB('articles');
      this.renderArticles(this.articles);
    }
  }

  async saveArticle(article: Article) {
    // 保存到本地
    await this.saveToDB('articles', article);

    // 如果离线，加入同步队列
    if (!navigator.onLine) {
      await this.saveToDB('offlineQueue', article);

      // 注册后台同步
      if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-articles');
      }
    }

    // 更新UI
    this.showToast('文章已保存');
  }

  async toggleFavorite(article: Article) {
    const favorites = await this.getAllFromDB('favorites');
    const index = favorites.findIndex((a: Article) => a.id === article.id);

    if (index >= 0) {
      // 取消收藏
      await this.db.delete('favorites', article.id);
      this.showToast('已取消收藏');
    } else {
      // 添加收藏
      await this.saveToDB('favorites', { ...article, savedAt: Date.now() });
      this.showToast('已添加到收藏');
    }
  }

  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.hideOfflineNotice();
      this.showToast('网络已恢复');
      this.loadArticles();
    });

    window.addEventListener('offline', () => {
      this.showOfflineNotice();
      this.showToast('网络已断开，使用离线模式');
    });
  }

  async registerPush() {
    if (!('serviceWorker' in navigator)) return;
    if (!('PushManager' in window)) return;

    try {
      const registration = await navigator.serviceWorker.ready;

      // 检查现有订阅
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // 请求通知权限
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
          // 创建新订阅
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: this.getVAPIDPublicKey(),
          });

          // 发送到服务器
          await fetch('/api/push/subscribe', {
            method: 'POST',
            body: JSON.stringify(subscription),
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
    } catch (error) {
      console.error('推送注册失败:', error);
    }
  }

  getVAPIDPublicKey(): Uint8Array {
    // 替换为实际的VAPID公钥
    const publicKey = 'YOUR_VAPID_PUBLIC_KEY';
    return this.urlBase64ToUint8Array(publicKey);
  }

  urlBase64ToUint8Array(base64String: string): Uint8Array {
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

  // 数据库操作
  async saveToDB(storeName: string, data: any) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getAllFromDB(storeName: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // UI方法
  renderArticles(articles: Article[]) {
    const container = document.getElementById('articles');
    if (!container) return;

    container.innerHTML = articles.map((article) => `
      <article class="article-card">
        <img src="${article.thumbnail}" alt="${article.title}" loading="lazy">
        <div class="article-content">
          <h2>${article.title}</h2>
          <p>${article.summary}</p>
          <div class="article-meta">
            <span>${article.publishDate}</span>
            <button onclick="app.saveArticle(${JSON.stringify(article).replace(/"/g, '&quot;')})">
              离线保存
            </button>
            <button onclick="app.toggleFavorite(${JSON.stringify(article).replace(/"/g, '&quot;')})">
              收藏
            </button>
          </div>
        </div>
      </article>
    `).join('');
  }

  showOfflineNotice() {
    // 显示离线提示
    const notice = document.getElementById('offline-notice');
    if (notice) notice.style.display = 'block';
  }

  hideOfflineNotice() {
    const notice = document.getElementById('offline-notice');
    if (notice) notice.style.display = 'none';
  }

  showToast(message: string) {
    // 显示Toast提示
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
  }
}

// 初始化应用
const app = new NewsApp();
```

---

## 2. WebAssembly

### 2.1 WebAssembly是什么

WebAssembly（简称WASM）是一种基于堆栈的虚拟机的二进制指令格式。它不是一种手写编程语言，而是其他语言（如Rust、C、C++）的编译目标。WASM被设计为Web上的"第二语言"，用于处理性能密集型任务。

```
┌─────────────────────────────────────────────────────────────┐
│                    WebAssembly定位                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│    JavaScript                       WebAssembly             │
│  ┌─────────────┐                 ┌─────────────┐           │
│  │  DOM操作     │                 │  CPU密集计算  │           │
│  │  事件处理    │                 │  图像处理    │           │
│  │  网络请求    │                 │  视频编解码  │           │
│  │  状态管理    │                 │  游戏引擎    │           │
│  └─────────────┘                 └─────────────┘           │
│                                                             │
│              ┌─────────────────────────┐                    │
│              │     高性能计算区域       │                    │
│              │   (WASM负责执行)        │                    │
│              └─────────────────────────┘                    │
│                                                             │
│  JS是"胶水语言"，负责协调和调度                              │
│  WASM是"计算引擎"，负责高性能执行                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 WASM vs JavaScript性能

| 方面 | JavaScript | WebAssembly |
|------|------------|-------------|
| **类型系统** | 动态类型，需要JIT猜测 | 固定类型（i32/f64等），无类型猜测 |
| **解析成本** | 需要词法/语法分析 | 二进制格式，无需解析 |
| **内存管理** | 自动GC，可能卡顿 | 手动管理或使用宿主GC |
| **启动速度** | JIT编译需要预热 | Liftoff基线编译器几乎即时 |
| **执行效率** | 依赖JIT优化 | 直接执行优化后的机器码 |
| **适用场景** | DOM、事件、业务逻辑 | 图像处理、游戏、加密、AI |

**为什么WASM更快：**

1. **零解析成本**：WASM是紧凑的二进制格式，浏览器下载后几乎可以直接执行
2. **固定类型**：所有变量类型在编译时确定，无运行时类型猜测
3. **无GC干扰**：传统的WASM没有垃圾回收，不会出现GC卡顿
4. **并行化**：WASM可以利用SIMD指令进行数据级并行

### 2.3 Rust编译到WASM

Rust是编写WASM模块最流行的语言，因为它提供了内存安全和高性能的保证。

**环境准备：**

```bash
# 安装Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 安装wasm-pack（Rust到WASM的编译工具）
cargo install wasm-pack

# 安装wasm-bindgen（JS与WASM互操作的工具）
cargo install wasm-bindgen-cli
```

**Rust项目结构：**

```
wasm-module/
├── Cargo.toml
├── src/
│   └── lib.rs
└── pkg/          # 编译输出目录
```

**Cargo.toml配置：**

```toml
[package]
name = "wasm-image-processor"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]  # 编译为动态库，供外部调用

[dependencies]
wasm-bindgen = "0.2"
js-sys = "0.3"

[profile.release]
opt-level = "s"           # 优化大小
lto = true                # 链接时优化
```

**Rust源码实现：**

```rust
// src/lib.rs
use wasm_bindgen::prelude::*;

// 使用wasm_bindgen导出函数到JavaScript
#[wasm_bindgen]
pub fn process_image(image_data: &[u8], width: u32, height: u32) -> Vec<u8> {
    // 将RGB转灰度
    let mut result = Vec::with_capacity(image_data.len());

    for i in (0..image_data.len()).step_by(4) {
        // RGBA格式：r, g, b, a
        let r = image_data[i] as f32;
        let g = image_data[i + 1] as f32;
        let b = image_data[i + 2] as f32;

        // 使用BT.601标准计算灰度
        let gray = (0.299 * r + 0.587 * g + 0.114 * b) as u8;

        result.push(gray);
        result.push(gray);
        result.push(gray);
        result.push(image_data[i + 3]); // 保留Alpha通道
    }

    result
}

// 图像卷积操作
#[wasm_bindgen]
pub fn apply_convolution(
    image_data: &[u8],
    width: u32,
    height: u32,
    kernel: &[f32],
    kernel_size: u32,
) -> Vec<u8> {
    let mut result = vec![0u8; image_data.len()];
    let half = (kernel_size / 2) as i32;

    for y in half as u32..(height - half as u32) {
        for x in half as u32..(width - half as u32) {
            let mut r: f32 = 0.0;
            let mut g: f32 = 0.0;
            let mut b: f32 = 0.0;

            for ky in 0..kernel_size {
                for kx in 0..kernel_size {
                    let px = (x as i32 + kx as i32 - half) as u32;
                    let py = (y as i32 + ky as i32 - half) as u32;
                    let pixel_idx = ((py * width + px) * 4) as usize;
                    let kernel_idx = ((ky * kernel_size + kx)) as usize;

                    r += image_data[pixel_idx] as f32 * kernel[kernel_idx];
                    g += image_data[pixel_idx + 1] as f32 * kernel[kernel_idx];
                    b += image_data[pixel_idx + 2] as f32 * kernel[kernel_idx];
                }
            }

            let idx = ((y * width + x) * 4) as usize;
            result[idx] = r.clamp(0.0, 255.0) as u8;
            result[idx + 1] = g.clamp(0.0, 255.0) as u8;
            result[idx + 2] = b.clamp(0.0, 255.0) as u8;
            result[idx + 3] = image_data[idx + 3];
        }
    }

    result
}

// 矩阵乘法示例
#[wasm_bindgen]
pub fn matrix_multiply(a: &[f32], b: &[f32], rows: u32, cols: u32) -> Vec<f32> {
    let mut result = vec![0.0; (rows * cols) as usize];

    for i in 0..rows {
        for j in 0..cols {
            let mut sum = 0.0f32;
            for k in 0..rows {
                sum += a[(i * cols + k) as usize] * b[(k * cols + j) as usize];
            }
            result[(i * cols + j) as usize] = sum;
        }
    }

    result
}
```

**编译WASM模块：**

```bash
# 编译Rust代码为WASM
wasm-pack build --target web

# 编译输出文件
# pkg/
# ├── wasm_image_processor.js   # JS胶水代码
# ├── wasm_image_processor_bg.wasm  # 二进制文件
# └── wasm_image_processor.d.ts  # TypeScript类型定义
```

### 2.4 Emscripten编译C/C++到WASM

Emscripten是另一个流行的WASM编译器，专门用于将C/C++代码编译为WASM。

**安装Emscripten：**

```bash
# 下载并安装Emscripten SDK
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
```

**C语言源码：**

```c
// image_process.c
#include <emscripten.h>

// 使用EMSCRIPTEN_KEEPALIVE导出函数
EMSCRIPTEN_KEEPALIVE
unsigned char* process_image(unsigned char* image_data, int width, int height) {
    // 分配WASM内存
    unsigned char* result = (unsigned char*)malloc(width * height * 4);

    for (int i = 0; i < width * height * 4; i += 4) {
        // RGB转灰度
        unsigned char r = image_data[i];
        unsigned char g = image_data[i + 1];
        unsigned char b = image_data[i + 2];

        unsigned char gray = (unsigned char)(0.299 * r + 0.587 * g + 0.114 * b);

        result[i] = gray;
        result[i + 1] = gray;
        result[i + 2] = gray;
        result[i + 3] = image_data[i + 3];
    }

    return result;
}

// 高斯模糊
EMSCRIPTEN_KEEPALIVE
void gaussian_blur(unsigned char* data, int width, int height, int radius) {
    // 高斯核计算
    float* kernel = (float*)malloc((2 * radius + 1) * sizeof(float));
    float sigma = radius / 3.0f;
    float sum = 0.0f;

    for (int i = 0; i <= radius; i++) {
        kernel[radius + i] = kernel[radius - i] =
            expf(-(float)(i * i) / (2.0f * sigma * sigma));
        sum += kernel[radius + i] * (i == 0 ? 1.0f : 2.0f);
    }

    for (int i = 0; i <= radius * 2; i++) {
        kernel[i] /= sum;
    }

    // 水平方向卷积
    unsigned char* temp = (unsigned char*)malloc(width * height * 4);

    for (int y = 0; y < height; y++) {
        for (int x = 0; x < width; x++) {
            float r = 0, g = 0, b = 0;

            for (int kx = -radius; kx <= radius; kx++) {
                int px = (x + kx < 0) ? 0 : (x + kx >= width ? width - 1 : x + kx);
                int idx = (y * width + px) * 4;

                float weight = kernel[kx + radius];
                r += data[idx] * weight;
                g += data[idx + 1] * weight;
                b += data[idx + 2] * weight;
            }

            int idx = (y * width + x) * 4;
            temp[idx] = (unsigned char)r;
            temp[idx + 1] = (unsigned char)g;
            temp[idx + 2] = (unsigned char)b;
            temp[idx + 3] = data[idx + 3];
        }
    }

    // 垂直方向卷积
    for (int x = 0; x < width; x++) {
        for (int y = 0; y < height; y++) {
            float r = 0, g = 0, b = 0;

            for (int ky = -radius; ky <= radius; ky++) {
                int py = (y + ky < 0) ? 0 : (y + ky >= height ? height - 1 : y + ky);
                int idx = (py * width + x) * 4;

                float weight = kernel[ky + radius];
                r += temp[idx] * weight;
                g += temp[idx + 1] * weight;
                b += temp[idx + 2] * weight;
            }

            int idx = (y * width + x) * 4;
            data[idx] = (unsigned char)r;
            data[idx + 1] = (unsigned char)g;
            data[idx + 2] = (unsigned char)b;
        }
    }

    free(kernel);
    free(temp);
}
```

**编译命令：**

```bash
# 编译C代码为WASM
emcc image_process.c \
    -o image_process.js \
    -s EXPORTED_FUNCTIONS="['_process_image', '_gaussian_blur']" \
    -s EXPORTED_RUNTIME_METHODS="['ccall', 'cwrap']" \
    -s MODULARIZE=1 \
    -s EXPORT_NAME="ImageProcess" \
    -O3 \
    --closure 1

# 参数说明：
# -s EXPORTED_FUNCTIONS: 导出的函数列表（下划线开头）
# -s EXPORTED_RUNTIME_METHODS: 导出的运行时方法
# -s MODULARIZE: 模块化导出
# -O3: 最高级别优化
# --closure: 使用Google Closure Compiler压缩
```

### 2.5 WASM内存模型与调用约定

WASM的内存模型是理解JS与WASM交互的关键。WASM环境与JS环境完全隔离，它们通过一个共享的线性内存进行通信。

```
┌─────────────────────────────────────────────────────────────┐
│                    WASM内存模型                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  JS环境                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  WebAssembly.Memory { buffer: ArrayBuffer(64KB页) } │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │ 0 │ 1 │ 2 │ 3 │ ...        │ 4095 │ 4096 │   │    │   │
│  │  └───┴───┴───┴───────────────┴──────┴──────┘    │   │
│  │       线性内存区域（只读的ArrayBuffer视图）       │    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  WASM环境                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  i32 | f32 | f64 | i64 等基本类型                   │   │
│  │  线性内存: [byte0, byte1, byte2, ...]               │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ i32[0] │ i32[1] │ i32[2] │  ...  │ i32[1023] │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │  memory[0] │ memory[1] │ memory[2] │ ...          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  数据传递：                                                  │
│  JS ──写入ArrayBuffer──► WASM读取 ──计算──► WASM写入        │
│       ◄──读取ArrayBuffer──       结果                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**内存交互流程：**

```javascript
// JavaScript中使用WASM模块
async function initWasm() {
  // 导入WASM模块
  const wasmModule = await import('./wasm_image_processor.js');

  // 初始化WASM（传入JS环境的对象）
  await wasmModule.default();

  return wasmModule;
}

// 处理图像的示例
async function processImageWithWasm(imageElement) {
  const wasm = await initWasm();

  // 1. 获取图像数据
  const canvas = document.createElement('canvas');
  canvas.width = imageElement.width;
  canvas.height = imageElement.height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(imageElement, 0, 0);

  // 2. 获取图像像素数据（RGBA格式）
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // 3. 分配WASM内存
  const inputPtr = wasm.process_image.memory.buffer_ptr();
  const inputSize = imageData.data.length;

  // 4. 创建Uint8Array视图（用于写入）
  const wasmMemory = new Uint8Array(wasm.process_image.memory.buffer);
  wasmMemory.set(imageData.data, inputPtr);

  // 5. 调用WASM函数处理图像
  const outputPtr = wasm.process_image(
    inputPtr,
    canvas.width,
    canvas.height
  );

  // 6. 读取处理结果
  const processedData = new Uint8Array(
    wasm.process_image.memory.buffer,
    outputPtr,
    canvas.width * canvas.height * 4
  );

  // 7. 创建新的ImageData
  const resultImageData = new ImageData(
    new Uint8ClampedArray(processedData),
    canvas.width,
    canvas.height
  );

  // 8. 渲染结果
  ctx.putImageData(resultImageData, 0, 0);

  // 9. 释放WASM内存（如果WASM模块需要手动管理）
  wasm.process_image.memory.free(inputPtr);
  wasm.process_image.memory.free(outputPtr);

  return canvas.toDataURL();
}
```

### 2.6 JavaScript与WASM互调

JS调用WASM函数时，只能传递基本类型（数字），如果要传递复杂数据，必须通过内存手动编解码。

```javascript
// JS与WASM互操作完整示例
class WasmBridge {
  constructor(wasmModule) {
    this.wasm = wasmModule;
    this.memory = wasmModule.memory;
  }

  // 分配WASM内存并写入数据
  allocateString(str) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);

    // 分配内存：字符串长度 + 4字节长度前缀
    const ptr = this.wasm.allocate(bytes.length + 4);
    const view = new DataView(this.memory.buffer);

    // 写入长度
    view.setUint32(ptr, bytes.length, true); // true = little-endian

    // 写入字符串数据
    const memoryView = new Uint8Array(this.memory.buffer);
    memoryView.set(bytes, ptr + 4);

    return ptr;
  }

  // 从WASM内存读取字符串
  readString(ptr) {
    const view = new DataView(this.memory.buffer);

    // 读取长度
    const length = view.getUint32(ptr, true);

    // 读取数据
    const memoryView = new Uint8Array(this.memory.buffer);
    const bytes = memoryView.slice(ptr + 4, ptr + 4 + length);

    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  }

  // 释放内存
  deallocate(ptr) {
    this.wasm.deallocate(ptr);
  }

  // 调用WASM函数处理字符串
  processString(input) {
    const inputPtr = this.allocateString(input);

    try {
      // 调用WASM函数
      const outputPtr = this.wasm.process_string(inputPtr);
      const output = this.readString(outputPtr);

      // 释放输出内存
      this.deallocate(outputPtr);

      return output;
    } finally {
      // 释放输入内存
      this.deallocate(inputPtr);
    }
  }

  // 调用WASM函数处理数组
  processArray(data) {
    // 分配内存
    const ptr = this.wasm.allocate_array(data.length * data.BYTES_PER_ELEMENT);
    const view = new Float64Array(this.memory.buffer);

    // 写入数据
    view.set(data, ptr / 8);

    try {
      // 调用WASM函数
      const outputPtr = this.wasm.process_array(ptr, data.length);
      const length = view.getUint32(outputPtr / 4, true);
      const result = new Float64Array(this.memory.buffer, outputPtr + 4, length);

      return Array.from(result);
    } finally {
      this.deallocate(outputPtr);
    }
  }
}

// 使用示例
async function main() {
  const wasmModule = await import('./string_processor.js');
  await wasmModule.default();

  const bridge = new WasmBridge(wasmModule);

  // 处理字符串
  const input = "Hello, WebAssembly!";
  const output = bridge.processString(input);
  console.log('Input:', input);
  console.log('Output:', output);

  // 处理数组
  const numbers = [1.5, 2.3, 3.7, 4.1, 5.9];
  const result = bridge.processArray(numbers);
  console.log('Array input:', numbers);
  console.log('Array output:', result);
}
```

### 2.7 实战：使用Rust编写WASM模块

让我们实现一个完整的WASM图像处理模块，包括灰度转换、模糊、锐化等操作。

**完整的Rust实现：**

```rust
// src/lib.rs
use wasm_bindgen::prelude::*;
use js_sys::Math;

// 共享的WASM内存
static mut MEMORY: Option<wasm_bindgen::memory> = None;

// 导出内存对象供JS访问
#[wasm_bindgen]
pub fn get_memory() -> wasm_bindgen::memory {
    unsafe { MEMORY.unwrap() }
}

// 初始化（由JS调用）
#[wasm_bindgen(start)]
pub fn init() {
    unsafe {
        MEMORY = Some(wasm_bindgen::memory().unwrap());
    }
}

/// 灰度转换
/// params:
/// - data: RGBA格式的像素数据
/// - width: 图像宽度
/// - height: 图像高度
/// returns: 灰度化的像素数据
#[wasm_bindgen]
pub fn to_grayscale(data: &[u8], width: u32, height: u32) -> Vec<u8> {
    let mut result = Vec::with_capacity(data.len());

    for i in (0..data.len()).step_by(4) {
        // 使用BT.601标准转换
        let gray = (0.299 * data[i] as f32
                 + 0.587 * data[i + 1] as f32
                 + 0.114 * data[i + 2] as f32) as u8;

        result.push(gray);
        result.push(gray);
        result.push(gray);
        result.push(data[i + 3]); // 保留Alpha通道
    }

    result
}

/// 调节亮度
#[wasm_bindgen]
pub fn adjust_brightness(data: &[u8], factor: f32) -> Vec<u8> {
    data.chunks(4)
        .map(|chunk| {
            let r = (chunk[0] as f32 * factor).clamp(0.0, 255.0) as u8;
            let g = (chunk[1] as f32 * factor).clamp(0.0, 255.0) as u8;
            let b = (chunk[2] as f32 * factor).clamp(0.0, 255.0) as u8;
            [r, g, b, chunk[3]]
        })
        .flatten()
        .collect()
}

/// 调节对比度
#[wasm_bindgen]
pub fn adjust_contrast(data: &[u8], factor: f32) -> Vec<u8> {
    let factor = (259.0 * (factor + 255.0)) / (255.0 * (259.0 - factor));

    data.chunks(4)
        .map(|chunk| {
            let r = (factor * (chunk[0] as f32 - 128.0) + 128.0).clamp(0.0, 255.0) as u8;
            let g = (factor * (chunk[1] as f32 - 128.0) + 128.0).clamp(0.0, 255.0) as u8;
            let b = (factor * (chunk[2] as f32 - 128.0) + 128.0).clamp(0.0, 255.0) as u8;
            [r, g, b, chunk[3]]
        })
        .flatten()
        .collect()
}

/// 高斯模糊（可调节半径）
#[wasm_bindgen]
pub fn gaussian_blur(data: &[u8], width: u32, height: u32, radius: u32) -> Vec<u8> {
    if radius == 0 {
        return data.to_vec();
    }

    // 生成高斯核
    let kernel = create_gaussian_kernel(radius);
    let kernel_size = radius * 2 + 1;
    let half = radius as i32;

    let mut temp = vec![0u8; data.len()];

    // 水平卷积
    for y in 0..height {
        for x in 0..width {
            let mut r = 0.0f32;
            let mut g = 0.0f32;
            let mut b = 0.0f32;

            for kx in 0..kernel_size {
                let px = ((x as i32 + kx as i32 - half).max(0).min(width as i32 - 1)) as u32;
                let idx = ((y * width + px) * 4) as usize;
                let weight = kernel[kx];

                r += data[idx] as f32 * weight;
                g += data[idx + 1] as f32 * weight;
                b += data[idx + 2] as f32 * weight;
            }

            let idx = ((y * width + x) * 4) as usize;
            temp[idx] = r as u8;
            temp[idx + 1] = g as u8;
            temp[idx + 2] = b as u8;
            temp[idx + 3] = data[idx + 3];
        }
    }

    // 垂直卷积
    let mut result = vec![0u8; data.len()];

    for x in 0..width {
        for y in 0..height {
            let mut r = 0.0f32;
            let mut g = 0.0f32;
            let mut b = 0.0f32;

            for ky in 0..kernel_size {
                let py = ((y as i32 + ky as i32 - half).max(0).min(height as i32 - 1)) as u32;
                let idx = ((py * width + x) * 4) as usize;
                let weight = kernel[ky];

                r += temp[idx] as f32 * weight;
                g += temp[idx + 1] as f32 * weight;
                b += temp[idx + 2] as f32 * weight;
            }

            let idx = ((y * width + x) * 4) as usize;
            result[idx] = r as u8;
            result[idx + 1] = g as u8;
            result[idx + 2] = b as u8;
            result[idx + 3] = temp[idx + 3];
        }
    }

    result
}

/// 创建高斯核
fn create_gaussian_kernel(radius: u32) -> Vec<f32> {
    let size = radius * 2 + 1;
    let sigma = radius as f32 / 3.0;
    let mut kernel = Vec::with_capacity(size as usize);
    let mut sum = 0.0f32;

    for i in 0..size {
        let x = i as f32 - radius as f32;
        let value = (-(x * x) / (2.0 * sigma * sigma)).exp();
        kernel.push(value);
        sum += value;
    }

    // 归一化
    for v in &mut kernel {
        *v /= sum;
    }

    kernel
}

/// 锐化
#[wasm_bindgen]
pub fn sharpen(data: &[u8], width: u32, height: u32, amount: f32) -> Vec<u8> {
    // 锐化核
    let kernel = [
        [0.0, -1.0, 0.0],
        [-1.0, 5.0, -1.0],
        [0.0, -1.0, 0.0],
    ];

    apply_kernel(data, width, height, &kernel, amount)
}

/// 边缘检测（Sobel算子）
#[wasm_bindgen]
pub fn edge_detection(data: &[u8], width: u32, height: u32) -> Vec<u8> {
    // Sobel X核
    let sobel_x = [
        [-1.0, 0.0, 1.0],
        [-2.0, 0.0, 2.0],
        [-1.0, 0.0, 1.0],
    ];

    // Sobel Y核
    let sobel_y = [
        [-1.0, -2.0, -1.0],
        [0.0, 0.0, 0.0],
        [1.0, 2.0, 1.0],
    ];

    let gray = to_grayscale(data, width, height);

    let mut gx = apply_kernel_single(&gray, width, height, &sobel_x);
    let gy = apply_kernel_single(&gray, width, height, &sobel_y);

    // 合并结果
    for i in (0..gx.len()).step_by(4) {
        let mag = ((gx[i] as f32 * gx[i] as f32 + gy[i] as f32 * gy[i] as f32).sqrt()) as u8;
        gx[i] = mag;
        gx[i + 1] = mag;
        gx[i + 2] = mag;
    }

    gx
}

/// 应用卷积核（单通道）
fn apply_kernel_single(data: &[u8], width: u32, height: u32, kernel: &[[f32; 3]; 3]) -> Vec<u8> {
    let mut result = vec![0u8; data.len()];

    for y in 1..height - 1 {
        for x in 1..width - 1 {
            let mut sum = 0.0f32;

            for ky in 0..3 {
                for kx in 0..3 {
                    let px = x + kx - 1;
                    let py = y + ky - 1;
                    let idx = ((py * width + px) * 4) as usize;

                    sum += data[idx] as f32 * kernel[ky as usize][kx as usize];
                }
            }

            let idx = ((y * width + x) * 4) as usize;
            result[idx] = sum.clamp(0.0, 255.0) as u8;
            result[idx + 1] = sum.clamp(0.0, 255.0) as u8;
            result[idx + 2] = sum.clamp(0.0, 255.0) as u8;
            result[idx + 3] = data[idx + 3];
        }
    }

    result
}

/// 应用卷积核（RGBA）
fn apply_kernel(data: &[u8], width: u32, height: u32, kernel: &[[f32; 3]; 3], amount: f32) -> Vec<u8> {
    let mut result = vec![0u8; data.len()];

    for y in 1..height - 1 {
        for x in 1..width - 1 {
            let mut r = 0.0f32;
            let mut g = 0.0f32;
            let mut b = 0.0f32;

            for ky in 0..3 {
                for kx in 0..3 {
                    let px = x + kx - 1;
                    let py = y + ky - 1;
                    let idx = ((py * width + px) * 4) as usize;
                    let weight = kernel[ky as usize][kx as usize];

                    r += data[idx] as f32 * weight;
                    g += data[idx + 1] as f32 * weight;
                    b += data[idx + 2] as f32 * weight;
                }
            }

            // 混合原图和卷积结果
            let idx = ((y * width + x) * 4) as usize;
            result[idx] = (data[idx] as f32 * (1.0 - amount) + r * amount).clamp(0.0, 255.0) as u8;
            result[idx + 1] = (data[idx + 1] as f32 * (1.0 - amount) + g * amount).clamp(0.0, 255.0) as u8;
            result[idx + 2] = (data[idx + 2] as f32 * (1.0 - amount) + b * amount).clamp(0.0, 255.0) as u8;
            result[idx + 3] = data[idx + 3];
        }
    }

    result
}
```

**JavaScript调用层：**

```javascript
// image-processor.js
export class ImageProcessor {
  constructor() {
    this.wasm = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    // 动态导入WASM模块
    const wasmModule = await import('./pkg/wasm_image_processor.js');

    // 初始化WASM
    await wasmModule.default();

    // 导出内存引用
    this.wasm = wasmModule;

    this.initialized = true;
  }

  // 辅助方法：获取WASM内存视图
  getMemoryView() {
    return new Uint8Array(this.wasm.get_memory().buffer);
  }

  // 灰度转换
  toGrayscale(imageData) {
    this._ensureInit();

    const result = this.wasm.to_grayscale(
      imageData.data,
      imageData.width,
      imageData.height
    );

    return this._createImageData(result, imageData.width, imageData.height);
  }

  // 调整亮度
  adjustBrightness(imageData, factor) {
    this._ensureInit();

    const result = this.wasm.adjust_brightness(
      imageData.data,
      factor
    );

    return this._createImageData(result, imageData.width, imageData.height);
  }

  // 调整对比度
  adjustContrast(imageData, factor) {
    this._ensureInit();

    const result = this.wasm.adjust_contrast(
      imageData.data,
      factor
    );

    return this._createImageData(result, imageData.width, imageData.height);
  }

  // 高斯模糊
  gaussianBlur(imageData, radius = 5) {
    this._ensureInit();

    const result = this.wasm.gaussian_blur(
      imageData.data,
      imageData.width,
      imageData.height,
      radius
    );

    return this._createImageData(result, imageData.width, imageData.height);
  }

  // 锐化
  sharpen(imageData, amount = 1.0) {
    this._ensureInit();

    const result = this.wasm.sharpen(
      imageData.data,
      imageData.width,
      imageData.height,
      amount
    );

    return this._createImageData(result, imageData.width, imageData.height);
  }

  // 边缘检测
  edgeDetection(imageData) {
    this._ensureInit();

    const result = this.wasm.edge_detection(
      imageData.data,
      imageData.width,
      imageData.height
    );

    return this._createImageData(result, imageData.width, imageData.height);
  }

  // 创建ImageData
  _createImageData(data, width, height) {
    const clampedData = new Uint8ClampedArray(data);
    return new ImageData(clampedData, width, height);
  }

  _ensureInit() {
    if (!this.initialized) {
      throw new Error('ImageProcessor未初始化，请先调用init()方法');
    }
  }
}

// 使用示例
async function demo() {
  const processor = new ImageProcessor();
  await processor.init();

  // 加载图像
  const img = new Image();
  img.src = '/sample.jpg';

  await new Promise((resolve) => {
    img.onload = resolve;
  });

  // 创建Canvas
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  // 获取图像数据
  const originalData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // 应用WASM处理
  const grayscale = processor.toGrayscale(originalData);
  const brightened = processor.adjustBrightness(originalData, 1.3);
  const blurred = processor.gaussianBlur(originalData, 10);
  const sharpened = processor.sharpen(originalData, 1.5);
  const edges = processor.edgeDetection(originalData);

  // 渲染结果
  ctx.putImageData(grayscale, 0, 0);

  console.log('图像处理完成！');
}
```

---

## 3. Web Workers

### 3.1 Web Worker vs Service Worker

Web Workers和Service Worker都是Web平台上的后台脚本，但它们的用途完全不同：

```
┌─────────────────────────────────────────────────────────────┐
│              Web Worker vs Service Worker                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Web Worker                                                 │
│  ├── 用途：CPU密集型计算、大数据处理                        │
│  ├── 生命周期：与页面同步                                    │
│  ├── 通信：postMessage + MessageChannel                     │
│  └── 示例：图像处理、加密解密、数据分析                      │
│                                                             │
│  Service Worker                                             │
│  ├── 用途：网络代理、离线缓存、推送通知                      │
│  ├── 生命周期：独立于页面，可后台运行                        │
│  ├── 通信：fetch事件、push事件、sync事件                    │
│  └── 示例：PWA离线支持、后台同步                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 专用Worker与共享Worker

**专用Worker（Dedicated Worker）：** 只能被创建它的脚本访问。

```javascript
// 主线程
const worker = new Worker('/workers/data-processor.js');

// 发送消息到Worker
worker.postMessage({
  type: 'process',
  data: largeArray
});

// 接收Worker的消息
worker.onmessage = (event) => {
  console.log('处理结果:', event.data.result);
};

// 监听Worker错误
worker.onerror = (error) => {
  console.error('Worker错误:', error.message);
};

// 终止Worker
worker.terminate();
```

**共享Worker（Shared Worker）：** 可以被多个脚本访问（同一源）。

```javascript
// 共享Worker定义
// shared-worker.js
const connections = new Map();

self.onconnect = (event) => {
  const port = event.ports[0];

  port.onmessage = (e) => {
    if (e.data.type === 'register') {
      connections.set(e.data.id, port);
      port.postMessage({ type: 'registered', id: e.data.id });
    }

    if (e.data.type === 'broadcast') {
      // 广播消息给所有连接的端口
      connections.forEach((p) => {
        if (p !== port) {
          p.postMessage(e.data);
        }
      });
    }
  };

  port.start();
};
```

```javascript
// 主线程使用共享Worker
const sharedWorker = new SharedWorker('/workers/shared-worker.js');

sharedWorker.port.start();

sharedWorker.port.postMessage({
  type: 'register',
  id: 'user-123'
});

sharedWorker.port.onmessage = (event) => {
  if (event.data.type === 'registered') {
    console.log('已注册到共享Worker');
  }
};

// 广播消息
sharedWorker.port.postMessage({
  type: 'broadcast',
  message: 'Hello from main thread!'
});
```

### 3.3 Worker线程通信

Worker线程通信使用postMessage API，支持多种数据结构。

**主线程代码：**

```javascript
// 主线程 - worker-communication.js

// 创建Worker
const worker = new Worker('/workers/compute-worker.js');

// 1. 发送简单消息
worker.postMessage('Hello Worker');

// 2. 发送对象
worker.postMessage({
  type: 'process',
  payload: { id: 1, name: 'test' }
});

// 3. 发送数组（Transferable对象，可转移所有权）
const buffer = new ArrayBuffer(1024 * 1024); // 1MB
worker.postMessage({ buffer }, [buffer]); // buffer被转移，不再主线程可用

// 4. 发送可转移对象
const imageBitmap = await createImageBitmap(canvas);
worker.postMessage({ imageBitmap }, [imageBitmap]);

// 5. 使用MessageChannel进行双向通信
const channel = new MessageChannel();
worker.postMessage({ type: 'createChannel', channel: channel.port1 }, [channel.port1]);

channel.port2.onmessage = (event) => {
  console.log('收到Worker响应:', event.data);
};

channel.port2.start();

// 6. 接收消息
worker.onmessage = (event) => {
  console.log('收到Worker消息:', event.data);
};

// 7. 接收二进制数据
worker.onmessage = (event) => {
  if (event.data instanceof Blob) {
    // 处理Blob数据
    const url = URL.createObjectURL(event.data);
    img.src = url;
  } else if (event.data instanceof ArrayBuffer) {
    // 处理ArrayBuffer
    const view = new DataView(event.data);
    console.log('数据长度:', view.byteLength);
  }
};

// 8. 错误处理
worker.onerror = (error) => {
  console.error('Worker错误:', {
    message: error.message,
    filename: error.filename,
    lineno: error.lineno
  });
};

// 9. 终止Worker
setTimeout(() => {
  worker.terminate();
  console.log('Worker已终止');
}, 60000);
```

**Worker线程代码：**

```javascript
// Worker线程 - compute-worker.js

// 1. 接收主线程消息
self.onmessage = (event) => {
  console.log('收到主线程消息:', event.data);

  // 处理数据
  if (event.data.type === 'process') {
    const result = processData(event.data.payload);
    self.postMessage({ type: 'result', result });
  }
};

// 2. 处理大数据计算
function processData(payload) {
  const { data, operation } = payload;

  switch (operation) {
    case 'sort':
      return data.sort((a, b) => a - b);

    case 'filter':
      return data.filter(item => item.value > 100);

    case 'aggregate':
      return data.reduce((acc, item) => ({
        sum: acc.sum + item.value,
        count: acc.count + 1
      }), { sum: 0, count: 0 });

    case 'transform':
      return data.map(item => ({
        ...item,
        processed: true,
        value: item.value * 2
      }));

    default:
      return data;
  }
}

// 3. 使用MessageChannel通信
self.onmessage = (event) => {
  if (event.data.type === 'createChannel') {
    const port = event.data.channel;

    port.onmessage = (e) => {
      // 处理通过Channel收到的消息
      const result = heavyComputation(e.data);

      // 发送结果
      port.postMessage({ type: 'channelResult', result });
    };

    port.start();
  }
};

// 4. 导入其他模块
importScripts('/utils/math-helpers.js');

// 5. 复杂的长时间计算（使用进度报告）
function longRunningTask(data) {
  const total = data.length;
  const results = [];
  const chunkSize = 1000;

  for (let i = 0; i < total; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    const processed = chunk.map(item => expensiveOperation(item));
    results.push(...processed);

    // 报告进度
    self.postMessage({
      type: 'progress',
      percent: Math.min(100, ((i + chunkSize) / total) * 100),
      processed: i + chunkSize,
      total
    });
  }

  return results;
}

// 6. 错误处理和报告
try {
  const result = riskyOperation();
  self.postMessage({ type: 'success', result });
} catch (error) {
  self.postMessage({
    type: 'error',
    message: error.message,
    stack: error.stack
  });
}

// 7. 导出模块（ES Modules Worker）
export {};
```

### 3.4 实战：Worker中处理大数据计算

下面实现一个完整的大数据处理Worker，用于统计分析。

```javascript
// workers/data-analysis-worker.js

/**
 * 数据分析Worker
 * 职责：在大数据上执行统计分析，避免阻塞主线程
 */

// 导入数学工具
import { mean, median, standardDeviation, percentile } from '/utils/math.js';

// 存储待处理数据
let dataset = [];

// 接收主线程消息
self.onmessage = function(event) {
  const { type, payload, id } = event.data;

  switch (type) {
    case 'load':
      handleLoad(payload, id);
      break;

    case 'analyze':
      handleAnalyze(id);
      break;

    case 'filter':
      handleFilter(payload, id);
      break;

    case 'aggregate':
      handleAggregate(payload, id);
      break;

    case 'clear':
      dataset = [];
      self.postMessage({ type: 'cleared', id });
      break;

    default:
      self.postMessage({
        type: 'error',
        message: `未知操作类型: ${type}`,
        id
      });
  }
};

/**
 * 加载数据
 */
function handleLoad(data, requestId) {
  try {
    // 分块处理大数组，避免内存峰值
    const chunkSize = 10000;
    const total = data.length;

    for (let i = 0; i < total; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      dataset.push(...chunk);

      // 报告加载进度
      self.postMessage({
        type: 'loadProgress',
        percent: Math.min(100, ((i + chunkSize) / total) * 100),
        loaded: i + chunkSize,
        total,
        requestId
      });
    }

    self.postMessage({
      type: 'loaded',
      count: dataset.length,
      requestId
    });
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: '数据加载失败: ' + error.message,
      requestId
    });
  }
}

/**
 * 执行完整分析
 */
function handleAnalyze(requestId) {
  if (dataset.length === 0) {
    self.postMessage({
      type: 'error',
      message: '数据集为空',
      requestId
    });
    return;
  }

  try {
    // 提取数值列
    const values = dataset
      .map(item => item.value)
      .filter(v => typeof v === 'number' && !isNaN(v));

    // 计算基本统计量
    const result = {
      count: values.length,
      sum: values.reduce((a, b) => a + b, 0),
      mean: mean(values),
      median: median(values),
      stdDev: standardDeviation(values),
      min: Math.min(...values),
      max: Math.max(...values),
      percentile25: percentile(values, 25),
      percentile75: percentile(values, 75),
      // 分组统计
      byCategory: groupByCategory(),
      // 时间序列分析（如果有时间戳）
      timeSeries: analyzeTimeSeries()
    };

    self.postMessage({
      type: 'analysisComplete',
      result,
      requestId
    });
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: '分析失败: ' + error.message,
      requestId
    });
  }
}

/**
 * 分组统计
 */
function groupByCategory() {
  const groups = {};

  for (const item of dataset) {
    const category = item.category || 'unknown';

    if (!groups[category]) {
      groups[category] = {
        count: 0,
        sum: 0,
        values: []
      };
    }

    groups[category].count++;
    groups[category].sum += item.value || 0;
    groups[category].values.push(item.value);
  }

  // 计算每组的平均值
  for (const category in groups) {
    groups[category].mean = groups[category].sum / groups[category].count;
    delete groups[category].values; // 释放内存
  }

  return groups;
}

/**
 * 时间序列分析
 */
function analyzeTimeSeries() {
  // 检查是否有时间戳字段
  if (!dataset[0] || dataset[0].timestamp === undefined) {
    return null;
  }

  // 按时间排序
  const sorted = [...dataset]
    .filter(item => item.timestamp)
    .sort((a, b) => a.timestamp - b.timestamp);

  if (sorted.length === 0) {
    return null;
  }

  // 按天分组
  const dailyData = {};

  for (const item of sorted) {
    const date = new Date(item.timestamp).toISOString().split('T')[0];

    if (!dailyData[date]) {
      dailyData[date] = { count: 0, sum: 0 };
    }

    dailyData[date].count++;
    dailyData[date].sum += item.value || 0;
  }

  // 转换为数组
  return Object.entries(dailyData).map(([date, data]) => ({
    date,
    count: data.count,
    average: data.sum / data.count
  }));
}

/**
 * 过滤数据
 */
function handleFilter(criteria, requestId) {
  try {
    const { field, operator, value } = criteria;

    const filtered = dataset.filter(item => {
      const fieldValue = item[field];

      switch (operator) {
        case 'eq':
          return fieldValue === value;
        case 'ne':
          return fieldValue !== value;
        case 'gt':
          return fieldValue > value;
        case 'gte':
          return fieldValue >= value;
        case 'lt':
          return fieldValue < value;
        case 'lte':
          return fieldValue <= value;
        case 'contains':
          return String(fieldValue).includes(value);
        case 'in':
          return Array.isArray(value) && value.includes(fieldValue);
        default:
          return true;
      }
    });

    self.postMessage({
      type: 'filtered',
      count: filtered.length,
      data: filtered.slice(0, 1000), // 限制返回数量
      truncated: filtered.length > 1000,
      requestId
    });
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: '过滤失败: ' + error.message,
      requestId
    });
  }
}

/**
 * 聚合操作
 */
function handleAggregate(config, requestId) {
  try {
    const { groupBy, aggregates } = config;

    const groups = {};

    // 分组
    for (const item of dataset) {
      const key = item[groupBy] || 'unknown';

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    }

    // 计算聚合值
    const result = {};

    for (const [key, items] of Object.entries(groups)) {
      const group = { _count: items.length };

      for (const agg of aggregates) {
        const values = items.map(item => item[agg.field]).filter(v => typeof v === 'number');

        switch (agg.operation) {
          case 'sum':
            group[agg.alias || agg.field + '_sum'] = values.reduce((a, b) => a + b, 0);
            break;
          case 'avg':
            group[agg.alias || agg.field + '_avg'] = values.length > 0
              ? values.reduce((a, b) => a + b, 0) / values.length
              : 0;
            break;
          case 'min':
            group[agg.alias || agg.field + '_min'] = Math.min(...values);
            break;
          case 'max':
            group[agg.alias || agg.field + '_max'] = Math.max(...values);
            break;
          case 'count':
            group[agg.alias || agg.field + '_count'] = values.length;
            break;
        }
      }

      result[key] = group;
    }

    self.postMessage({
      type: 'aggregated',
      result,
      requestId
    });
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: '聚合失败: ' + error.message,
      requestId
    });
  }
}
```

**主线程使用Worker：**

```javascript
// data-analysis.js

class DataAnalysisManager {
  constructor() {
    this.worker = new Worker('/workers/data-analysis-worker.js');
    this.callbacks = new Map();
    this.requestId = 0;

    this.setupWorker();
  }

  setupWorker() {
    this.worker.onmessage = (event) => {
      const { type, requestId, ...data } = event.data;

      if (requestId && this.callbacks.has(requestId)) {
        const { resolve, reject, onProgress } = this.callbacks.get(requestId);

        if (type === 'error') {
          reject(new Error(data.message));
          this.callbacks.delete(requestId);
        } else if (type === 'loadProgress' && onProgress) {
          onProgress(data);
        } else if (type === 'loaded' || type === 'analysisComplete' || type === 'filtered' || type === 'aggregated') {
          resolve(data);
          this.callbacks.delete(requestId);
        }
      }
    };

    this.worker.onerror = (error) => {
      console.error('Worker错误:', error);
    };
  }

  // 生成请求ID
  generateRequestId() {
    return ++this.requestId;
  }

  // 加载数据
  async loadData(data, onProgress) {
    const requestId = this.generateRequestId();

    this.worker.postMessage({
      type: 'load',
      payload: data,
      id: requestId
    });

    return new Promise((resolve, reject) => {
      this.callbacks.set(requestId, { resolve, reject, onProgress });
    });
  }

  // 执行分析
  async analyze() {
    const requestId = this.generateRequestId();

    this.worker.postMessage({
      type: 'analyze',
      id: requestId
    });

    return new Promise((resolve, reject) => {
      this.callbacks.set(requestId, { resolve, reject });
    });
  }

  // 过滤数据
  async filter(criteria) {
    const requestId = this.generateRequestId();

    this.worker.postMessage({
      type: 'filter',
      payload: criteria,
      id: requestId
    });

    return new Promise((resolve, reject) => {
      this.callbacks.set(requestId, { resolve, reject });
    });
  }

  // 聚合查询
  async aggregate(groupBy, aggregates) {
    const requestId = this.generateRequestId();

    this.worker.postMessage({
      type: 'aggregate',
      payload: { groupBy, aggregates },
      id: requestId
    });

    return new Promise((resolve, reject) => {
      this.callbacks.set(requestId, { resolve, reject });
    });
  }

  // 终止Worker
  terminate() {
    this.worker.terminate();
  }
}

// 使用示例
async function demo() {
  const manager = new DataAnalysisManager();

  try {
    // 模拟大数据（100万条记录）
    const mockData = Array.from({ length: 1000000 }, (_, i) => ({
      id: i,
      category: ['A', 'B', 'C', 'D'][i % 4],
      value: Math.random() * 1000,
      timestamp: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
    }));

    // 加载数据（带进度回调）
    console.log('开始加载数据...');
    await manager.loadData(mockData, (progress) => {
      console.log(`加载进度: ${progress.percent.toFixed(1)}%`);
    });
    console.log('数据加载完成');

    // 执行分析
    console.log('开始分析...');
    const analysis = await manager.analyze();
    console.log('分析结果:', analysis);

    // 按分类聚合
    const aggregated = await manager.aggregate('category', [
      { field: 'value', operation: 'sum', alias: 'total_value' },
      { field: 'value', operation: 'avg', alias: 'avg_value' },
      { field: 'value', operation: 'min', alias: 'min_value' },
      { field: 'value', operation: 'max', alias: 'max_value' }
    ]);
    console.log('聚合结果:', aggregated);

    // 过滤数据
    const filtered = await manager.filter({
      field: 'category',
      operator: 'eq',
      value: 'A'
    });
    console.log('过滤结果:', filtered);

  } catch (error) {
    console.error('操作失败:', error);
  } finally {
    manager.terminate();
  }
}
```

---

## 4. 离线存储

### 4.1 IndexedDB：数据库、对象存储、事务

IndexedDB是浏览器内置的NoSQL数据库，用于存储大量结构化数据。

```
┌─────────────────────────────────────────────────────────────┐
│                    IndexedDB体系结构                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Database (数据库)                                          │
│  ├── ObjectStore (对象存储) ── 类似表                       │
│  │   ├── index: category      # 索引                        │
│  │   ├── index: createdAt     # 索引                        │
│  │   └── data: [{id, title, content, ...}]                  │
│  │                                                         │
│  ├── ObjectStore (对象存储) ── 类似表                       │
│  │   └── data: [...]                                        │
│  │                                                         │
│  └── ObjectStore (对象存储)                                 │
│      └── data: [...]                                        │
│                                                             │
│  特性：                                                      │
│  ├── 异步操作，不会阻塞UI                                   │
│  ├── 支持事务（ACID）                                       │
│  ├── 存储容量大（通常>50MB）                                │
│  └── 支持索引和查询                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**IndexedDB完整封装类：**

```typescript
// indexeddb.ts - IndexedDB完整封装

class IndexedDBHelper {
  private dbName: string;
  private version: number;
  private db: IDBDatabase | null = null;
  private transactionMode: IDBTransactionMode = 'readonly';

  constructor(dbName: string, version: number = 1) {
    this.dbName = dbName;
    this.version = version;
  }

  /**
   * 打开数据库
   */
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

        // 调用子类或外部的升级处理
        this.handleUpgrade(db, event.oldVersion);
      };
    });
  }

  /**
   * 处理数据库升级（版本迁移）
   */
  protected handleUpgrade(db: IDBDatabase, oldVersion: number) {
    console.log(`数据库升级: ${oldVersion} -> ${this.version}`);
  }

  /**
   * 创建对象存储
   */
  createObjectStore(
    storeName: string,
    options?: IDBObjectStoreParameters
  ): IDBObjectStore {
    if (!this.db) {
      throw new Error('数据库未打开');
    }

    if (this.db.objectStoreNames.contains(storeName)) {
      return this.db.transaction(storeName, 'readonly').objectStore(storeName);
    }

    return this.db.createObjectStore(storeName, {
      keyPath: 'id',
      autoIncrement: false,
      ...options
    });
  }

  /**
   * 创建索引
   */
  createIndex(
    storeName: string,
    indexName: string,
    keyPath: string | string[],
    options?: IDBIndexParameters
  ): IDBIndex {
    const store = this.getObjectStore(storeName, 'readonly');
    return store.createIndex(indexName, keyPath, options);
  }

  /**
   * 获取对象存储
   */
  getObjectStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db) {
      throw new Error('数据库未打开');
    }

    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  /**
   * 添加数据
   */
  async add<T>(storeName: string, data: T): Promise<IDBValidKey> {
    const db = await this.open();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(this.assignId(data));

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * 批量添加
   */
  async bulkAdd<T>(storeName: string, items: T[]): Promise<void> {
    const db = await this.open();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      for (const item of items) {
        store.add(this.assignId(item));
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * 更新数据（如果不存在则创建）
   */
  async put<T>(storeName: string, data: T): Promise<IDBValidKey> {
    const db = await this.open();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(this.assignId(data));

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * 批量更新
   */
  async bulkPut<T>(storeName: string, items: T[]): Promise<void> {
    const db = await this.open();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      for (const item of items) {
        store.put(this.assignId(item));
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * 获取单条数据
   */
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

  /**
   * 获取所有数据
   */
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

  /**
   * 按索引查询
   */
  async getByIndex<T>(
    storeName: string,
    indexName: string,
    value: IDBValidKey
  ): Promise<T[]> {
    const db = await this.open();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * 范围查询
   */
  async getByRange<T>(
    storeName: string,
    indexName: string,
    range: IDBKeyRange
  ): Promise<T[]> {
    const db = await this.open();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(range);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * 删除数据
   */
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

  /**
   * 清空存储
   */
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

  /**
   * 统计数量
   */
  async count(storeName: string): Promise<number> {
    const db = await this.open();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * 删除数据库
   */
  async deleteDatabase(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.dbName);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * 为数据分配ID
   */
  private assignId<T extends { id?: any }>(data: T): T {
    if (!data.id) {
      (data as any).id = crypto.randomUUID();
    }
    return data;
  }
}

// 导出单例
export const db = new IndexedDBHelper('AppDB', 1);
```

### 4.2 Cache API：缓存匹配、删除

Cache API用于存储Request/Response对象对，常与Service Worker配合实现离线缓存。

```typescript
// cache-api.ts - Cache API封装

class CacheManager {
  private cacheName: string;

  constructor(cacheName: string) {
    this.cacheName = cacheName;
  }

  /**
   * 打开缓存
   */
  async open(): Promise<Cache> {
    return caches.open(this.cacheName);
  }

  /**
   * 添加单个请求
   */
  async add(request: RequestInfo): Promise<void> {
    const cache = await this.open();
    await cache.add(request);
  }

  /**
   * 批量添加请求
   */
  async addAll(requests: RequestInfo[]): Promise<void> {
    const cache = await this.open();
    await cache.addAll(requests);
  }

  /**
   * 添加请求并指定响应（手动缓存）
   */
  async put(request: RequestInfo, response: Response): Promise<void> {
    const cache = await this.open();
    await cache.put(request, response);
  }

  /**
   * 匹配请求
   */
  async match(request: RequestInfo): Promise<Response | undefined> {
    const cache = await this.open();
    return cache.match(request);
  }

  /**
   * 匹配所有符合条件的请求
   */
  async matchAll(request?: RequestInfo): Promise<Response[]> {
    const cache = await this.open();
    return cache.matchAll(request);
  }

  /**
   * 检查请求是否在缓存中
   */
  async has(request: RequestInfo): Promise<boolean> {
    const cache = await this.open();
    return cache.has(request);
  }

  /**
   * 删除单个缓存条目
   */
  async delete(request: RequestInfo): Promise<boolean> {
    const cache = await this.open();
    return cache.delete(request);
  }

  /**
   * 删除所有缓存
   */
  async deleteAll(): Promise<void> {
    await caches.delete(this.cacheName);
  }

  /**
   * 获取缓存中的所有keys
   */
  async keys(): Promise<Request[]> {
    const cache = await this.open();
    return cache.keys();
  }

  /**
   * 缓存响应并设置过期时间
   */
  async cacheWithExpiration(
    request: RequestInfo,
    response: Response,
    expirationMs: number
  ): Promise<void> {
    const headers = new Headers(response.headers);
    headers.set('x-cache-date', Date.now().toString());
    headers.set('x-cache-expires', (Date.now() + expirationMs).toString());

    const cachedResponse = new Response(await response.clone().text(), {
      status: response.status,
      statusText: response.statusText,
      headers
    });

    const cache = await this.open();
    await cache.put(request, cachedResponse);
  }

  /**
   * 检查缓存是否过期
   */
  async isExpired(request: RequestInfo): Promise<boolean> {
    const response = await this.match(request);
    if (!response) return true;

    const expiresHeader = response.headers.get('x-cache-expires');
    if (!expiresHeader) return false;

    return Date.now() > parseInt(expiresHeader, 10);
  }

  /**
   * 清理过期缓存
   */
  async cleanupExpired(): Promise<number> {
    const keys = await this.keys();
    let deleted = 0;

    for (const request of keys) {
      if (await this.isExpired(request)) {
        await this.delete(request);
        deleted++;
      }
    }

    return deleted;
  }
}

// 使用示例
const staticCache = new CacheManager('static-v1');
const apiCache = new CacheManager('api-v1');
const imageCache = new CacheManager('images-v1');

// 在Service Worker中使用
self.addEventListener('fetch', async (event) => {
  const url = new URL(event.request.url);

  // 静态资源 - Cache First
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(event.request, staticCache));
    return;
  }

  // API请求 - Network First with Cache Fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(event.request, apiCache));
    return;
  }
});

async function cacheFirst(request: Request, cacheManager: CacheManager): Promise<Response> {
  // 检查缓存
  const cached = await cacheManager.match(request);
  if (cached) {
    // 后台更新缓存
    fetchAndCache(request, cacheManager).catch(console.error);
    return cached;
  }

  // 缓存未命中，从网络获取
  return fetchAndCache(request, cacheManager);
}

async function networkFirst(request: Request, cacheManager: CacheManager): Promise<Response> {
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cacheManager.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cacheManager.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

async function fetchAndCache(request: Request, cacheManager: CacheManager): Promise<Response> {
  const response = await fetch(request);
  if (response.ok) {
    await cacheManager.put(request, response.clone());
  }
  return response;
}
```

### 4.3 localStorage vs sessionStorage vs IndexedDB

```
┌─────────────────────────────────────────────────────────────┐
│              客户端存储方案对比                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  localStorage                   sessionStorage              │
│  ├── 持久化存储                  ├── 会话级存储             │
│  ├── 跨标签页共享                ├── 仅当前标签页            │
│  ├── 容量: ~5MB                 ├── 容量: ~5MB             │
│  ├── 同步API                    ├── 同步API                 │
│  └── 只能存字符串                └── 只能存字符串            │
│                                                             │
│  IndexedDB                        Cache API                  │
│  ├── 结构化数据                  ├── Request/Response        │
│  ├── 容量: 50MB+               ├── 容量: 50MB+             │
│  ├── 异步API                    ├── 异步API                 │
│  ├── 支持索引查询                ├── 存储网络请求             │
│  └── 支持事务                    └── 配合Service Worker      │
│                                                             │
│  选择指南:                                                  │
│  ├── 简单配置/状态 ──► localStorage/sessionStorage          │
│  ├── 离线缓存 ──► Cache API + Service Worker                 │
│  ├── 结构化数据 ──► IndexedDB                                │
│  └── 大文件存储 ──► IndexedDB + Blob                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.4 实战：实现离线笔记应用

```typescript
// offline-notes/notes-db.ts - 笔记应用数据库层

class NotesDatabase extends IndexedDBHelper {
  constructor() {
    super('NotesDB', 1);
  }

  // 数据库升级
  protected handleUpgrade(db: IDBDatabase, oldVersion: number): void {
    // 创建笔记存储
    if (!db.objectStoreNames.contains('notes')) {
      const notesStore = db.createObjectStore('notes', {
        keyPath: 'id',
        autoIncrement: false
      });

      // 创建索引
      notesStore.createIndex('folderId', 'folderId', { unique: false });
      notesStore.createIndex('createdAt', 'createdAt', { unique: false });
      notesStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      notesStore.createIndex('isPinned', 'isPinned', { unique: false });
      notesStore.createIndex('isDeleted', 'isDeleted', { unique: false });
    }

    // 创建文件夹存储
    if (!db.objectStoreNames.contains('folders')) {
      const foldersStore = db.createObjectStore('folders', {
        keyPath: 'id',
        autoIncrement: false
      });

      foldersStore.createIndex('createdAt', 'createdAt', { unique: false });
    }

    // 创建待同步队列
    if (!db.objectStoreNames.contains('syncQueue')) {
      db.createObjectStore('syncQueue', {
        keyPath: 'id',
        autoIncrement: true
      });
    }

    // 创建附件存储
    if (!db.objectStoreNames.contains('attachments')) {
      db.createObjectStore('attachments', {
        keyPath: 'id',
        autoIncrement: false
      });
    }
  }

  // 笔记操作
  async createNote(note: Partial<Note>): Promise<Note> {
    const now = Date.now();
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: note.title || '无标题',
      content: note.content || '',
      folderId: note.folderId || null,
      tags: note.tags || [],
      isPinned: note.isPinned || false,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
      syncedAt: null
    };

    await this.add('notes', newNote);
    await this.addToSyncQueue('create', newNote);

    return newNote;
  }

  async updateNote(id: string, updates: Partial<Note>): Promise<Note | undefined> {
    const existing = await this.get<Note>('notes', id);
    if (!existing) return undefined;

    const updated: Note = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
      syncedAt: null
    };

    await this.put('notes', updated);
    await this.addToSyncQueue('update', updated);

    return updated;
  }

  async deleteNote(id: string, permanent: boolean = false): Promise<void> {
    if (permanent) {
      await this.delete('notes', id);
      await this.addToSyncQueue('delete', { id });
    } else {
      // 软删除
      await this.updateNote(id, { isDeleted: true });
    }
  }

  async getNote(id: string): Promise<Note | undefined> {
    return this.get<Note>('notes', id);
  }

  async getAllNotes(options?: {
    folderId?: string | null;
    includeDeleted?: boolean;
    searchQuery?: string;
  }): Promise<Note[]> {
    let notes = await this.getAll<Note>('notes');

    // 过滤已删除
    if (!options?.includeDeleted) {
      notes = notes.filter(n => !n.isDeleted);
    }

    // 过滤文件夹
    if (options?.folderId !== undefined) {
      notes = notes.filter(n => n.folderId === options.folderId);
    }

    // 搜索
    if (options?.searchQuery) {
      const query = options.searchQuery.toLowerCase();
      notes = notes.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query) ||
        n.tags.some(t => t.toLowerCase().includes(query))
      );
    }

    // 排序：置顶优先，然后按更新时间
    notes.sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      return b.updatedAt - a.updatedAt;
    });

    return notes;
  }

  async getNotesByTag(tag: string): Promise<Note[]> {
    const notes = await this.getAll<Note>('notes');
    return notes.filter(n => n.tags.includes(tag) && !n.isDeleted);
  }

  // 文件夹操作
  async createFolder(folder: Partial<Folder>): Promise<Folder> {
    const newFolder: Folder = {
      id: crypto.randomUUID(),
      name: folder.name || '新文件夹',
      parentId: folder.parentId || null,
      color: folder.color || '#007bff',
      createdAt: Date.now()
    };

    await this.add('folders', newFolder);
    return newFolder;
  }

  async updateFolder(id: string, updates: Partial<Folder>): Promise<Folder | undefined> {
    const existing = await this.get<Folder>('folders', id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };
    await this.put('folders', updated);

    return updated;
  }

  async deleteFolder(id: string): Promise<void> {
    // 将文件夹中的笔记移到根目录
    const notes = await this.getByIndex<Note>('notes', 'folderId', id);
    for (const note of notes) {
      await this.updateNote(note.id, { folderId: null });
    }

    await this.delete('folders', id);
  }

  async getAllFolders(): Promise<Folder[]> {
    return this.getAll<Folder>('folders');
  }

  // 同步队列
  async addToSyncQueue(operation: string, data: any): Promise<void> {
    await this.add('syncQueue', {
      operation,
      data,
      timestamp: Date.now()
    });
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    return this.getAll<SyncQueueItem>('syncQueue');
  }

  async clearSyncQueue(): Promise<void> {
    await this.clear('syncQueue');
  }

  async processSyncQueue(apiClient: APIClient): Promise<SyncResult> {
    const queue = await this.getSyncQueue();
    const results: { success: number; failed: number; errors: string[] } = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const item of queue) {
      try {
        switch (item.operation) {
          case 'create':
            await apiClient.createNote(item.data);
            break;
          case 'update':
            await apiClient.updateNote(item.data.id, item.data);
            break;
          case 'delete':
            await apiClient.deleteNote(item.data.id);
            break;
        }
        await this.delete('syncQueue', item.id);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`${item.operation}失败: ${error}`);
      }
    }

    return results;
  }

  // 附件操作
  async saveAttachment(attachment: Attachment): Promise<void> {
    await this.put('attachments', attachment);
  }

  async getAttachment(id: string): Promise<Attachment | undefined> {
    return this.get<Attachment>('attachments', id);
  }

  async deleteAttachment(id: string): Promise<void> {
    await this.delete('attachments', id);
  }

  // 导出/导入
  async exportAll(): Promise<ExportData> {
    const notes = await this.getAll<Note>('notes', { includeDeleted: true });
    const folders = await this.getAll<Folder>('folders');
    const attachments = await this.getAll<Attachment>('attachments');

    return {
      version: 1,
      exportedAt: Date.now(),
      notes,
      folders,
      attachments
    };
  }

  async import(data: ExportData): Promise<void> {
    await this.bulkPut('folders', data.folders);
    await this.bulkPut('notes', data.notes);
    await this.bulkPut('attachments', data.attachments);
  }
}

// 类型定义
interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  tags: string[];
  isPinned: boolean;
  isDeleted: boolean;
  createdAt: number;
  updatedAt: number;
  syncedAt: number | null;
}

interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  color: string;
  createdAt: number;
}

interface Attachment {
  id: string;
  noteId: string;
  filename: string;
  mimeType: string;
  size: number;
  data: Blob;
}

interface SyncQueueItem {
  id?: number;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

interface ExportData {
  version: number;
  exportedAt: number;
  notes: Note[];
  folders: Folder[];
  attachments: Attachment[];
}

// API客户端
interface APIClient {
  createNote(note: Note): Promise<void>;
  updateNote(id: string, note: Partial<Note>): Promise<void>;
  deleteNote(id: string): Promise<void>;
}

// 导出单例
export const notesDb = new NotesDatabase();
```

---

## 5. 推送通知

### 5.1 Push API：订阅、接收、显示

Push API允许服务器向浏览器发送推送消息，即使页面未打开也能接收。

```
┌─────────────────────────────────────────────────────────────┐
│                    Web Push流程                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 用户授权通知权限                                         │
│       │                                                     │
│       ▼                                                     │
│  2. 浏览器订阅Push服务 ◄──► 第三方Push服务（如Firebase）    │
│       │                                                     │
│       ▼                                                     │
│  3. 获取PushSubscription（包含endpoint和keys）              │
│       │                                                     │
│       ▼                                                     │
│  4. 发送Subscription到我们的服务器保存                       │
│       │                                                     │
│       ▼                                                     │
│  5. 服务器使用VAPID密钥发送推送 ◄──► Push服务               │
│       │                                                     │
│       ▼                                                     │
│  6. Service Worker接收push事件                               │
│       │                                                     │
│       ▼                                                     │
│  7. 显示系统通知                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**前端Push订阅管理：**

```typescript
// push-notifications.ts - 推送通知管理

class PushNotificationManager {
  private vapidPublicKey: string = 'YOUR_VAPID_PUBLIC_KEY';
  private subscription: PushSubscription | null = null;

  /**
   * 检查浏览器支持
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * 请求通知权限
   */
  async requestPermission(): Promise<NotificationPermission> {
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

  /**
   * 订阅推送
   */
  async subscribe(): Promise<PushSubscription | null> {
    if (!this.isSupported()) {
      console.log('浏览器不支持Push API');
      return null;
    }

    try {
      // 1. 获取Service Worker注册
      const registration = await navigator.serviceWorker.ready;

      // 2. 检查现有订阅
      this.subscription = await registration.pushManager.getSubscription();

      // 3. 如果已有订阅，取消订阅
      if (this.subscription) {
        await this.unsubscribe();
      }

      // 4. 创建新订阅
      this.subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true, // 必须为true，Chrome政策要求
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      // 5. 发送订阅到服务器
      await this.sendSubscriptionToServer();

      console.log('推送订阅成功');
      return this.subscription;

    } catch (error) {
      console.error('订阅失败:', error);
      return null;
    }
  }

  /**
   * 取消订阅
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      // 尝试获取现有订阅
      const registration = await navigator.serviceWorker.ready;
      this.subscription = await registration.pushManager.getSubscription();
    }

    if (this.subscription) {
      const success = await this.subscription.unsubscribe();

      if (success) {
        await this.removeSubscriptionFromServer();
      }

      this.subscription = null;
      return success;
    }

    return false;
  }

  /**
   * 获取当前订阅
   */
  async getSubscription(): Promise<PushSubscription | null> {
    if (this.subscription) {
      return this.subscription;
    }

    if (!this.isSupported()) {
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    this.subscription = await registration.pushManager.getSubscription();

    return this.subscription;
  }

  /**
   * 检查订阅状态
   */
  async isSubscribed(): Promise<boolean> {
    const subscription = await this.getSubscription();
    return subscription !== null;
  }

  /**
   * 发送订阅到服务器
   */
  private async sendSubscriptionToServer(): Promise<void> {
    if (!this.subscription) return;

    const subscriptionData = this.subscription.toJSON();

    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscriptionData)
    });

    if (!response.ok) {
      throw new Error('订阅保存失败');
    }
  }

  /**
   * 从服务器删除订阅
   */
  private async removeSubscriptionFromServer(): Promise<void> {
    if (!this.subscription) return;

    const endpoint = this.subscription.endpoint;

    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ endpoint })
    });
  }

  /**
   * 显示本地通知（不通过Push）
   */
  async showNotification(
    title: string,
    options: NotificationOptions = {}
  ): Promise<Notification | null> {
    const permission = await this.requestPermission();

    if (permission !== 'granted') {
      console.log('通知权限未授权');
      return null;
    }

    const registration = await navigator.serviceWorker.ready;

    const notification = await registration.showNotification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge.png',
      vibrate: [100, 50, 100],
      ...options
    });

    return notification;
  }

  /**
   * VAPID公钥转换
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
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
}

// React Hook封装
function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const manager = useMemo(() => new PushNotificationManager(), []);

  useEffect(() => {
    setIsSupported(manager.isSupported());

    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    manager.getSubscription().then(setSubscription);
  }, [manager]);

  const subscribe = useCallback(async () => {
    const perm = await manager.requestPermission();
    setPermission(perm);

    if (perm === 'granted') {
      const sub = await manager.subscribe();
      setSubscription(sub);
      return sub;
    }

    return null;
  }, [manager]);

  const unsubscribe = useCallback(async () => {
    await manager.unsubscribe();
    setSubscription(null);
  }, [manager]);

  const showNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    return manager.showNotification(title, options);
  }, [manager]);

  return {
    permission,
    subscription,
    isSupported,
    subscribe,
    unsubscribe,
    showNotification
  };
}

// 导出
export const pushManager = new PushNotificationManager();
export { usePushNotifications };
```

### 5.2 Notification API

Notification API用于显示系统通知，与Push API配合使用。

```typescript
// notification-ui.ts - 通知UI管理

class NotificationUI {
  private container: HTMLElement | null = null;

  constructor() {
    this.createContainer();
    this.setupNotificationClick();
  }

  /**
   * 创建通知容器
   */
  private createContainer(): void {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.className = 'notification-container';
    this.container.style.cssText = `
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 360px;
    `;

    document.body.appendChild(this.container);
  }

  /**
   * 显示应用内通知
   */
  show(options: {
    title: string;
    message?: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    duration?: number;
    action?: {
      label: string;
      onClick: () => void;
    };
  }): string {
    const id = crypto.randomUUID();

    const notification = document.createElement('div');
    notification.id = id;
    notification.className = `notification notification-${options.type || 'info'}`;
    notification.style.cssText = `
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      padding: 16px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      animation: slideIn 0.3s ease;
      position: relative;
      overflow: hidden;
    `;

    // 颜色条
    const colorBar = document.createElement('div');
    const colors = {
      info: '#007bff',
      success: '#28a745',
      warning: '#ffc107',
      error: '#dc3545'
    };
    colorBar.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: ${colors[options.type || 'info']};
    `;

    // 图标
    const icon = document.createElement('span');
    icon.style.cssText = `
      font-size: 20px;
      flex-shrink: 0;
    `;
    const icons = {
      info: '\u2139',
      success: '\u2713',
      warning: '\u26a0',
      error: '\u2717'
    };
    icon.textContent = icons[options.type || 'info'];

    // 内容
    const content = document.createElement('div');
    content.style.cssText = `
      flex: 1;
      min-width: 0;
    `;

    const titleEl = document.createElement('div');
    titleEl.style.cssText = `
      font-weight: 600;
      margin-bottom: 4px;
      color: #333;
    `;
    titleEl.textContent = options.title;

    const messageEl = document.createElement('div');
    messageEl.style.cssText = `
      font-size: 14px;
      color: #666;
      line-height: 1.4;
    `;
    messageEl.textContent = options.message || '';

    content.appendChild(titleEl);
    if (options.message) {
      content.appendChild(messageEl);
    }

    // 关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: #999;
      padding: 0;
      line-height: 1;
    `;
    closeBtn.textContent = '\u00d7';
    closeBtn.onclick = () => this.dismiss(id);

    // 操作按钮
    let actionBtn: HTMLButtonElement | null = null;
    if (options.action) {
      actionBtn = document.createElement('button');
      actionBtn.style.cssText = `
        background: ${colors[options.type || 'info']};
        color: white;
        border: none;
        border-radius: 4px;
        padding: 6px 12px;
        font-size: 13px;
        cursor: pointer;
        margin-top: 8px;
      `;
      actionBtn.textContent = options.action.label;
      actionBtn.onclick = () => {
        options.action?.onClick();
        this.dismiss(id);
      };
      content.appendChild(actionBtn);
    }

    notification.appendChild(colorBar);
    notification.appendChild(icon);
    notification.appendChild(content);
    notification.appendChild(closeBtn);

    this.container?.appendChild(notification);

    // 自动消失
    if (options.duration !== 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, options.duration || 5000);
    }

    return id;
  }

  /**
   * 关闭通知
   */
  dismiss(id: string): void {
    const notification = document.getElementById(id);
    if (!notification) return;

    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }

  /**
   * 关闭所有通知
   */
  dismissAll(): void {
    this.container?.querySelectorAll('.notification').forEach((el) => {
      el.remove();
    });
  }

  /**
   * 监听Service Worker通知点击
   */
  private setupNotificationClick(): void {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'NOTIFICATION_CLICK') {
        const { url } = event.data;
        window.open(url, '_blank');
      }
    });
  }
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideOut {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100%);
    }
  }
`;
document.head.appendChild(style);

// 导出
export const notificationUI = new NotificationUI();
```

---

## 6. 原生能力

### 6.1 Web Share API分享

Web Share API允许Web应用使用系统原生的分享界面。

```typescript
// web-share.ts - Web Share API封装

class ShareManager {
  /**
   * 检查支持
   */
  isSupported(): boolean {
    return 'share' in navigator;
  }

  /**
   * 检查是否支持特定分享类型
   */
  async canShare(data?: ShareData): Promise<boolean> {
    if (!this.isSupported()) return false;

    if (data) {
      return navigator.canShare(data);
    }

    return true;
  }

  /**
   * 分享文本
   */
  async shareText(text: string, title?: string): Promise<boolean> {
    if (!this.isSupported()) {
      // 回退到复制到剪贴板
      await this.copyToClipboard(text);
      return false;
    }

    try {
      await navigator.share({
        title: title || document.title,
        text: text
      });
      return true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('分享失败:', error);
        await this.copyToClipboard(text);
      }
      return false;
    }
  }

  /**
   * 分享链接
   */
  async shareUrl(url: string, title?: string, text?: string): Promise<boolean> {
    if (!this.isSupported()) {
      await this.copyToClipboard(url);
      return false;
    }

    try {
      await navigator.share({
        title: title || document.title,
        text: text || '',
        url: url
      });
      return true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('分享失败:', error);
        await this.copyToClipboard(url);
      }
      return false;
    }
  }

  /**
   * 分享文件
   */
  async shareFiles(files: File[]): Promise<boolean> {
    if (!this.isSupported()) {
      console.log('浏览器不支持文件分享');
      return false;
    }

    const shareData = { files };

    if (!navigator.canShare(shareData)) {
      console.log('无法分享这些文件');
      return false;
    }

    try {
      await navigator.share(shareData);
      return true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('分享失败:', error);
      }
      return false;
    }
  }

  /**
   * 复制到剪贴板（回退方案）
   */
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      // 降级方案
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    }
  }
}

// React组件示例
function ShareButton({ url, title, text }: {
  url: string;
  title?: string;
  text?: string;
}) {
  const [shared, setShared] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareManager = useMemo(() => new ShareManager(), []);

  const handleShare = async () => {
    const success = await shareManager.shareUrl(url, title, text);

    if (success) {
      setShared(true);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (copied) {
    return <span>链接已复制！</span>;
  }

  if (shared) {
    return <span>感谢分享！</span>;
  }

  return (
    <button onClick={handleShare}>
      {shareManager.isSupported() ? '分享' : '复制链接'}
    </button>
  );
}

export const shareManager = new ShareManager();
```

### 6.2 Web NFC

Web NFC API允许Web应用读取和写入NFC标签。

```typescript
// web-nfc.ts - Web NFC封装

class NFCManager {
  private reader: NFCReader | null = null;

  /**
   * 检查支持
   */
  isSupported(): boolean {
    return 'nfc' in navigator;
  }

  /**
   * 请求NFC权限
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      console.log('浏览器不支持Web NFC');
      return false;
    }

    try {
      const permission = await navigator.nfc.requestPermission();
      return permission.state === 'granted';
    } catch (error) {
      console.error('NFC权限请求失败:', error);
      return false;
    }
  }

  /**
   * 开始读取NFC标签
   */
  async startReading(
    onMessage: (message: NFCMessage) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    if (!this.isSupported()) {
      onError?.(new Error('浏览器不支持Web NFC'));
      return;
    }

    try {
      this.reader = await navigator.nfc.requestScan([
        { techFilter: 'nfc-a' },
        { techFilter: 'ndef' }
      ]);

      this.reader.onmessage = (event) => {
        onMessage(event.message);
      };

      this.reader.onerror = (event) => {
        onError?.(new Error(event.error.message));
      };

    } catch (error) {
      onError?.(error as Error);
    }
  }

  /**
   * 停止读取
   */
  async stopReading(): Promise<void> {
    if (this.reader) {
      await this.reader.close();
      this.reader = null;
    }
  }

  /**
   * 写入NFC标签
   */
  async write(data: string | string[]): Promise<boolean> {
    if (!this.isSupported()) {
      console.log('浏览器不支持Web NFC');
      return false;
    }

    try {
      const message: NFCMessage = {
        records: Array.isArray(data)
          ? data.map(text => this.createTextRecord(text))
          : [this.createTextRecord(data)]
      };

      await navigator.nfc.push(message);
      return true;
    } catch (error) {
      console.error('NFC写入失败:', error);
      return false;
    }
  }

  /**
   * 创建文本记录
   */
  private createTextRecord(text: string): NFCRecord {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    return {
      recordType: 'text',
      data: {
        lang: 'zh',
        text: text
      }
    } as unknown as NFCRecord;
  }
}

// 使用示例
async function nfcDemo() {
  const nfc = new NFCManager();

  // 检查支持
  if (!nfc.isSupported()) {
    console.log('Web NFC不可用');
    return;
  }

  // 请求权限
  const granted = await nfc.requestPermission();
  if (!granted) {
    console.log('NFC权限未授权');
    return;
  }

  // 读取标签
  await nfc.startReading(
    (message) => {
      console.log('读到NFC标签:', message);
      for (const record of message.records) {
        console.log('记录类型:', record.recordType);
        console.log('记录数据:', record.data);
      }
    },
    (error) => {
      console.error('NFC错误:', error);
    }
  );

  // 写入标签
  const success = await nfc.write('Hello NFC!');
  console.log('写入结果:', success);
}

export const nfcManager = new NFCManager();
```

### 6.3 Web Bluetooth

Web Bluetooth API允许Web应用与蓝牙设备通信。

```typescript
// web-bluetooth.ts - Web Bluetooth封装

class BluetoothManager {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;

  /**
   * 检查支持
   */
  isSupported(): boolean {
    return 'bluetooth' in navigator;
  }

  /**
   * 请求设备
   */
  async requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice | null> {
    if (!this.isSupported()) {
      console.log('浏览器不支持Web Bluetooth');
      return null;
    }

    try {
      this.device = await navigator.bluetooth.requestDevice({
        filters: options?.filters || [
          { services: ['battery_service'] },
          { services: ['heart_rate'] },
          { services: ['device_information'] }
        ],
        optionalServices: options?.optionalServices || [
          'battery_service',
          'device_information'
        ],
        ...options
      });

      this.device.addEventListener('gattserverdisconnected', (event) => {
        console.log('蓝牙设备断开连接');
        this.onDisconnected?.(event);
      });

      return this.device;
    } catch (error) {
      console.error('请求蓝牙设备失败:', error);
      return null;
    }
  }

  /**
   * 连接设备
   */
  async connect(): Promise<boolean> {
    if (!this.device) {
      console.error('没有选择设备');
      return false;
    }

    if (!this.device.gatt) {
      console.error('设备不支持GATT');
      return false;
    }

    try {
      this.server = await this.device.gatt.connect();
      console.log('蓝牙设备已连接');
      return true;
    } catch (error) {
      console.error('连接失败:', error);
      return false;
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.server?.connected) {
      this.server.disconnect();
    }
    this.device = null;
    this.server = null;
  }

  /**
   * 获取服务
   */
  async getService(serviceUUID: string): Promise<BluetoothRemoteGATTService | null> {
    if (!this.server?.connected) {
      console.error('未连接设备');
      return null;
    }

    try {
      return await this.server.getPrimaryService(serviceUUID);
    } catch (error) {
      console.error('获取服务失败:', error);
      return null;
    }
  }

  /**
   * 获取特征
   */
  async getCharacteristic(
    serviceUUID: string,
    characteristicUUID: string
  ): Promise<BluetoothRemoteGATTCharacteristic | null> {
    const service = await this.getService(serviceUUID);
    if (!service) return null;

    try {
      return await service.getCharacteristic(characteristicUUID);
    } catch (error) {
      console.error('获取特征失败:', error);
      return null;
    }
  }

  /**
   * 读取特征值
   */
  async readValue(serviceUUID: string, characteristicUUID: string): Promise<DataView | null> {
    const characteristic = await this.getCharacteristic(serviceUUID, characteristicUUID);
    if (!characteristic) return null;

    try {
      return await characteristic.readValue();
    } catch (error) {
      console.error('读取值失败:', error);
      return null;
    }
  }

  /**
   * 写入特征值
   */
  async writeValue(
    serviceUUID: string,
    characteristicUUID: string,
    data: BufferSource
  ): Promise<boolean> {
    const characteristic = await this.getCharacteristic(serviceUUID, characteristicUUID);
    if (!characteristic) return false;

    try {
      await characteristic.writeValue(data);
      return true;
    } catch (error) {
      console.error('写入值失败:', error);
      return false;
    }
  }

  /**
   * 开启通知
   */
  async startNotifications(
    serviceUUID: string,
    characteristicUUID: string,
    callback: (value: DataView) => void
  ): Promise<boolean> {
    const characteristic = await this.getCharacteristic(serviceUUID, characteristicUUID);
    if (!characteristic) return false;

    try {
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        callback((event as any).target.value);
      });
      return true;
    } catch (error) {
      console.error('开启通知失败:', error);
      return false;
    }
  }

  /**
   * 获取电池电量
   */
  async getBatteryLevel(): Promise<number | null> {
    const value = await this.readValue('battery_service', 'battery_level');
    if (!value) return null;
    return value.getUint8(0);
  }

  /**
   * 获取设备信息
   */
  async getDeviceInfo(): Promise<{
    manufacturer?: string;
    model?: string;
    serial?: string;
    firmware?: string;
  } | null> {
    const info: any = {};

    // 制造商名称
    try {
      const manufacturer = await this.readValue('device_information', 'manufacturer_name');
      if (manufacturer) {
        info.manufacturer = new TextDecoder().decode(manufacturer);
      }
    } catch (e) {}

    // 型号
    try {
      const model = await this.readValue('device_information', 'model_number');
      if (model) {
        info.model = new TextDecoder().decode(model);
      }
    } catch (e) {}

    // 序列号
    try {
      const serial = await this.readValue('device_information', 'serial_number');
      if (serial) {
        info.serial = new TextDecoder().decode(serial);
      }
    } catch (e) {}

    // 固件版本
    try {
      const firmware = await this.readValue('device_information', 'firmware_revision');
      if (firmware) {
        info.firmware = new TextDecoder().decode(firmware);
      }
    } catch (e) {}

    return Object.keys(info).length > 0 ? info : null;
  }

  /**
   * 断开回调
   */
  onDisconnected?: (event: Event) => void;
}

// 使用示例
async function bluetoothDemo() {
  const bt = new BluetoothManager();

  // 检查支持
  if (!bt.isSupported()) {
    console.log('Web Bluetooth不可用');
    return;
  }

  // 请求设备
  const device = await bt.requestDevice();
  if (!device) return;

  console.log('选择的设备:', device.name);

  // 连接
  const connected = await bt.connect();
  if (!connected) return;

  // 读取电池电量
  const battery = await bt.getBatteryLevel();
  console.log('电池电量:', battery);

  // 获取设备信息
  const info = await bt.getDeviceInfo();
  console.log('设备信息:', info);

  // 开启心率通知
  await bt.startNotifications('heart_rate', 'heart_rate_measurement', (value) => {
    const flags = value.getUint8(0);
    const rate = flags & 0x1
      ? value.getUint16(1, true)
      : value.getUint8(1);
    console.log('心率:', rate);
  });
}

export const bluetoothManager = new BluetoothManager();
```

### 6.4 Web Serial

Web Serial API允许Web应用与串行设备（如Arduino、3D打印机）通信。

```typescript
// web-serial.ts - Web Serial封装

class SerialManager {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader | null = null;
  private writer: WritableStreamDefaultWriter | null = null;

  /**
   * 检查支持
   */
  isSupported(): boolean {
    return 'serial' in navigator;
  }

  /**
   * 请求端口
   */
  async requestPort(): Promise<SerialPort | null> {
    if (!this.isSupported()) {
      console.log('浏览器不支持Web Serial');
      return null;
    }

    try {
      this.port = await navigator.serial.requestPort();
      return this.port;
    } catch (error) {
      console.error('请求串口失败:', error);
      return null;
    }
  }

  /**
   * 连接
   */
  async open(options: SerialOptions = {
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    bufferSize: 255
  }): Promise<boolean> {
    if (!this.port) {
      console.error('没有选择端口');
      return false;
    }

    try {
      await this.port.open(options);
      console.log('串口已打开');
      return true;
    } catch (error) {
      console.error('打开串口失败:', error);
      return false;
    }
  }

  /**
   * 关闭连接
   */
  async close(): Promise<void> {
    // 停止读取
    if (this.reader) {
      await this.reader.cancel();
      this.reader = null;
    }

    // 停止写入
    if (this.writer) {
      await this.writer.close();
      this.writer = null;
    }

    // 关闭端口
    if (this.port?.opened) {
      await this.port.close();
    }

    this.port = null;
    console.log('串口已关闭');
  }

  /**
   * 写入数据
   */
  async write(data: string | Uint8Array): Promise<number> {
    if (!this.port?.writable) {
      throw new Error('端口未打开或不可写');
    }

    if (!this.writer) {
      this.writer = this.port.writable.getWriter();
    }

    const encoder = new TextEncoder();
    const bytes = typeof data === 'string'
      ? encoder.encode(data)
      : data;

    await this.writer.write(bytes);
    return bytes.length;
  }

  /**
   * 写入并等待响应
   */
  async writeAndRead(
    data: string,
    timeout: number = 1000
  ): Promise<string> {
    await this.write(data);

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('读取超时'));
      }, timeout);

      this.read().then((response) => {
        clearTimeout(timer);
        resolve(response);
      }).catch(reject);
    });
  }

  /**
   * 读取数据
   */
  async read(): Promise<string> {
    if (!this.port?.readable) {
      throw new Error('端口未打开或不可读');
    }

    if (!this.reader) {
      this.reader = this.port.readable.getReader();
    }

    const { value, done } = await this.reader.read();

    if (done) {
      this.reader = null;
      return '';
    }

    const decoder = new TextDecoder();
    return decoder.decode(value);
  }

  /**
   * 开始持续读取
   */
  startReading(callback: (data: string) => void): void {
    if (!this.port?.readable) {
      throw new Error('端口未打开');
    }

    const reader = this.port.readable.getReader();

    const read = async () => {
      try {
        while (true) {
          const { value, done } = await reader.read();

          if (done) {
            break;
          }

          const decoder = new TextDecoder();
          const text = decoder.decode(value);
          callback(text);
        }
      } catch (error) {
        console.error('读取错误:', error);
      }
    };

    read();
  }

  /**
   * 获取可用端口
   */
  async getPorts(): Promise<SerialPort[]> {
    if (!this.isSupported()) {
      return [];
    }

    return navigator.serial.getPorts();
  }
}

// 使用示例：与Arduino通信
async function arduinoDemo() {
  const serial = new SerialManager();

  // 检查支持
  if (!serial.isSupported()) {
    console.log('Web Serial不可用');
    return;
  }

  // 请求端口
  const port = await serial.requestPort();
  if (!port) return;

  // 打开连接（Arduino常用9600波特率）
  const opened = await serial.open({ baudRate: 9600 });
  if (!opened) return;

  try {
    // 发送命令
    await serial.write('Hello Arduino!\n');

    // 读取响应
    const response = await serial.writeAndRead('GET_DATA\n', 2000);
    console.log('Arduino响应:', response);

    // 持续读取
    serial.startReading((data) => {
      console.log('收到数据:', data);
    });

  } finally {
    // 关闭连接
    await serial.close();
  }
}

export const serialManager = new SerialManager();
```

### 6.5 传感器API：陀螺仪、加速度

```typescript
// sensors.ts - 设备传感器API封装

// 设备方向（DeviceOrientation）
class DeviceOrientationSensor {
  private listener: ((event: DeviceOrientationEvent) => void) | null = null;

  /**
   * 检查支持
   */
  isSupported(): boolean {
    return 'DeviceOrientationEvent' in window;
  }

  /**
   * 请求权限（iOS 13+需要）
   */
  async requestPermission(): Promise<boolean> {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        return permission === 'granted';
      } catch (error) {
        console.error('权限请求失败:', error);
        return false;
      }
    }
    return true;
  }

  /**
   * 开始监听
   */
  start(callback: (data: OrientationData) => void): void {
    if (!this.isSupported()) {
      console.log('设备方向传感器不可用');
      return;
    }

    this.listener = (event) => {
      callback({
        alpha: event.alpha ?? 0, // 绕Z轴旋转（0-360）
        beta: event.beta ?? 0,  // 绕X轴旋转（-180到180）
        gamma: event.gamma ?? 0, // 绕Y轴旋转（-90到90）
        absolute: event.absolute ?? false
      });
    };

    window.addEventListener('deviceorientation', this.listener);
  }

  /**
   * 停止监听
   */
  stop(): void {
    if (this.listener) {
      window.removeEventListener('deviceorientation', this.listener);
      this.listener = null;
    }
  }
}

// 设备运动（DeviceMotion）
class DeviceMotionSensor {
  private listener: ((event: DeviceMotionEvent) => void) | null = null;

  isSupported(): boolean {
    return 'DeviceMotionEvent' in window;
  }

  async requestPermission(): Promise<boolean> {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceMotionEvent.requestPermission();
        return permission === 'granted';
      } catch (error) {
        console.error('权限请求失败:', error);
        return false;
      }
    }
    return true;
  }

  start(callback: (data: MotionData) => void): void {
    if (!this.isSupported()) {
      console.log('设备运动传感器不可用');
      return;
    }

    this.listener = (event) => {
      callback({
        acceleration: {
          x: event.acceleration?.x ?? 0,
          y: event.acceleration?.y ?? 0,
          z: event.acceleration?.z ?? 0
        },
        accelerationIncludingGravity: {
          x: event.accelerationIncludingGravity?.x ?? 0,
          y: event.accelerationIncludingGravity?.y ?? 0,
          z: event.accelerationIncludingGravity?.z ?? 0
        },
        rotationRate: {
          alpha: event.rotationRate?.alpha ?? 0,
          beta: event.rotationRate?.beta ?? 0,
          gamma: event.rotationRate?.gamma ?? 0
        },
        interval: event.interval ?? 0
      });
    };

    window.addEventListener('devicemotion', this.listener);
  }

  stop(): void {
    if (this.listener) {
      window.removeEventListener('devicemotion', this.listener);
      this.listener = null;
    }
  }
}

// 通用传感器API（AmbientLight、Proximity等）
class GenericSensor {
  private sensor: any = null;

  async open(sensorClass: any, options?: any): Promise<boolean> {
    if (!('sensors' in navigator)) {
      console.log('通用传感器API不可用');
      return false;
    }

    try {
      this.sensor = new sensorClass(options);

      this.sensor.addEventListener('error', (event: any) => {
        console.error('传感器错误:', event.error);
      });

      await this.sensor.start();
      return true;
    } catch (error) {
      console.error('打开传感器失败:', error);
      return false;
    }
  }

  onReading(callback: () => void): void {
    if (this.sensor) {
      this.sensor.addEventListener('reading', callback);
    }
  }

  async close(): Promise<void> {
    if (this.sensor) {
      await this.sensor.stop();
      this.sensor = null;
    }
  }
}

// 类型定义
interface OrientationData {
  alpha: number;
  beta: number;
  gamma: number;
  absolute: boolean;
}

interface MotionData {
  acceleration: { x: number; y: number; z: number };
  accelerationIncludingGravity: { x: number; y: number; z: number };
  rotationRate: { alpha: number; beta: number; gamma: number };
  interval: number;
}

// React Hook
function useDeviceOrientation() {
  const [orientation, setOrientation] = useState<OrientationData | null>(null);
  const sensor = useMemo(() => new DeviceOrientationSensor(), []);

  useEffect(() => {
    const start = async () => {
      const granted = await sensor.requestPermission();
      if (granted) {
        sensor.start(setOrientation);
      }
    };

    start();

    return () => sensor.stop();
  }, [sensor]);

  return orientation;
}

function useDeviceMotion() {
  const [motion, setMotion] = useState<MotionData | null>(null);
  const sensor = useMemo(() => new DeviceMotionSensor(), []);

  useEffect(() => {
    const start = async () => {
      const granted = await sensor.requestPermission();
      if (granted) {
        sensor.start(setMotion);
      }
    };

    start();

    return () => sensor.stop();
  }, [sensor]);

  return motion;
}

// 导出
export const orientationSensor = new DeviceOrientationSensor();
export const motionSensor = new DeviceMotionSensor();
export { useDeviceOrientation, useDeviceMotion };
```

### 6.6 实战：访问设备相机

```typescript
// camera.ts - 相机访问封装

class CameraManager {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;

  /**
   * 检查支持
   */
  isSupported(): boolean {
    return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
  }

  /**
   * 请求相机权限并启动
   */
  async start(
    videoElement: HTMLVideoElement,
    options: MediaTrackConstraints = {}
  ): Promise<MediaStream> {
    if (!this.isSupported()) {
      throw new Error('浏览器不支持相机访问');
    }

    try {
      // 请求相机权限
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: options.facingMode || 'environment', // 后置相机优先
          width: options.width || { ideal: 1920 },
          height: options.height || { ideal: 1080 },
          frameRate: options.frameRate || { ideal: 30 },
          ...options
        },
        audio: options.audio !== false
      });

      this.videoElement = videoElement;
      videoElement.srcObject = this.stream;
      await videoElement.play();

      return this.stream;
    } catch (error) {
      console.error('启动相机失败:', error);
      throw error;
    }
  }

  /**
   * 停止相机
   */
  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
  }

  /**
   * 切换前后相机
   */
  async switchCamera(videoElement: HTMLVideoElement): Promise<MediaStream> {
    this.stop();

    const newFacing = this.stream?.getVideoTracks()[0].getSettings().facingMode === 'environment'
      ? 'user'
      : 'environment';

    return this.start(videoElement, { facingMode: newFacing });
  }

  /**
   * 拍照
   */
  captureImage(
    videoElement: HTMLVideoElement,
    format: 'image/png' | 'image/jpeg' = 'image/jpeg',
    quality: number = 0.92
  ): string {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(videoElement, 0, 0);

    return canvas.toDataURL(format, quality);
  }

  /**
   * 获取媒体流
   */
  getStream(): MediaStream | null {
    return this.stream;
  }

  /**
   * 获取当前轨道设置
   */
  getSettings(): MediaTrackSettings | null {
    const videoTrack = this.stream?.getVideoTracks()[0];
    return videoTrack?.getSettings() || null;
  }

  /**
   * 截图并下载
   */
  captureAndDownload(
    videoElement: HTMLVideoElement,
    filename: string = 'photo'
  ): void {
    const dataUrl = this.captureImage(videoElement);

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${filename}-${Date.now()}.png`;
    link.click();
  }

  /**
   * 录制视频
   */
  async startRecording(
    videoElement: HTMLVideoElement,
    options: MediaRecorderOptions = {}
  ): Promise<MediaRecorder> {
    if (!this.stream) {
      throw new Error('相机未启动');
    }

    const recorder = new MediaRecorder(this.stream, {
      mimeType: options.mimeType || 'video/webm;codecs=vp9',
      videoBitsPerSecond: options.videoBitsPerSecond || 2500000,
      ...options
    });

    const chunks: Blob[] = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.start(1000); // 每秒触发一次ondataavailable

    return recorder;
  }

  /**
   * 获取可用设备
   */
  async getDevices(): Promise<MediaDeviceInfo[]> {
    if (!this.isSupported()) {
      return [];
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === 'videoinput');
  }

  /**
   * 选择特定设备
   */
  async startWithDeviceId(
    videoElement: HTMLVideoElement,
    deviceId: string,
    options: MediaTrackConstraints = {}
  ): Promise<MediaStream> {
    if (!this.isSupported()) {
      throw new Error('浏览器不支持相机访问');
    }

    this.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: { exact: deviceId },
        ...options
      },
      audio: false
    });

    this.videoElement = videoElement;
    videoElement.srcObject = this.stream;
    await videoElement.play();

    return this.stream;
  }
}

// React组件
function CameraCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const camera = useMemo(() => new CameraManager(), []);

  useEffect(() => {
    camera.getDevices().then(setDevices);
  }, [camera]);

  const startCamera = async () => {
    try {
      if (selectedDevice) {
        await camera.startWithDeviceId(videoRef.current!, selectedDevice);
      } else {
        await camera.start(videoRef.current!);
      }
      setIsActive(true);
    } catch (error) {
      console.error('启动相机失败:', error);
    }
  };

  const stopCamera = () => {
    camera.stop();
    setIsActive(false);
  };

  const capture = () => {
    if (videoRef.current) {
      const dataUrl = camera.captureImage(videoRef.current);
      // 处理截图
      console.log('截图:', dataUrl);
    }
  };

  const download = () => {
    if (videoRef.current) {
      camera.captureAndDownload(videoRef.current, 'my-photo');
    }
  };

  return (
    <div className="camera-container">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ width: '100%', maxWidth: '640px' }}
      />

      <div className="controls">
        <select
          value={selectedDevice}
          onChange={(e) => setSelectedDevice(e.target.value)}
        >
          <option value="">默认相机</option>
          {devices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `相机 ${devices.indexOf(device) + 1}`}
            </option>
          ))}
        </select>

        {!isActive ? (
          <button onClick={startCamera}>启动相机</button>
        ) : (
          <>
            <button onClick={stopCamera}>停止</button>
            <button onClick={capture}>拍照</button>
            <button onClick={download}>下载</button>
          </>
        )}
      </div>
    </div>
  );
}

export const cameraManager = new CameraManager();
```

---

## 7. 性能指标

### 7.1 Core Web Vitals深度解析

Core Web Vitals是Google定义的衡量用户体验的核心指标：

```
┌─────────────────────────────────────────────────────────────┐
│                    Core Web Vitals                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  LCP (Largest Contentful Paint)                            │
│  ├── 定义：最大内容绘制时间                                  │
│  ├── 优秀：< 2.5秒                                          │
│  ├── 需改进：2.5 - 4秒                                      │
│  └── 差：> 4秒                                              │
│                                                             │
│  FID / INP (First Input Delay / Interaction to Next Paint) │
│  ├── 定义：首次输入延迟 / 交互到下一帧绘制                    │
│  ├── 优秀：< 100ms                                          │
│  ├── 需改进：100 - 300ms                                    │
│  └── 差：> 300ms                                            │
│                                                             │
│  CLS (Cumulative Layout Shift)                             │
│  ├── 定义：累计布局偏移量                                   │
│  ├── 优秀：< 0.1                                            │
│  ├── 需改进：0.1 - 0.25                                     │
│  └── 差：> 0.25                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 LCP优化：preload、priority

LCP是衡量页面加载性能的关键指标，优化LCP可以显著提升用户体验。

```typescript
// lcp-optimization.ts - LCP优化策略

class LCPOptimizer {
  /**
   * 预加载关键资源
   */
  preload CriticalResource(url: string, as: string): void {
    // 创建预加载链接
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = as;

    // 跨域支持
    if (as === 'fetch' || as === 'font') {
      link.crossOrigin = 'anonymous';
    }

    document.head.appendChild(link);
  }

  /**
   * 预加载LCP图片
   */
  preloadLCPImage(imageUrl: string): void {
    this.preloadCriticalResource(imageUrl, 'image');
  }

  /**
   * 预加载关键字体
   */
  preloadFont(fontUrl: string, fontDisplay: string = 'swap'): void {
    // 添加字体样式
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'CriticalFont';
        src: url('${fontUrl}') format('woff2');
        font-display: ${fontDisplay};
      }
    `;
    document.head.appendChild(style);

    this.preloadCriticalResource(fontUrl, 'font');
  }

  /**
   * 使用fetchpriority属性
   */
  setFetchPriority(element: HTMLImageElement, priority: 'high' | 'low' | 'auto'): void {
    element.fetchPriority = priority;
  }

  /**
   * 延迟加载非关键图片
   */
  lazyLoadImage(img: HTMLImageElement): void {
    img.loading = 'lazy';
  }

  /**
   * 移除低优先级图片的fetchpriority
   */
  clearFetchPriority(img: HTMLImageElement): void {
    img.fetchPriority = 'auto';
  }
}

// 使用示例
function optimizeLCP() {
  const optimizer = new LCPOptimizer();

  // 预加载Hero图片
  const heroImage = document.querySelector('img.hero') as HTMLImageElement;
  if (heroImage) {
    optimizer.preloadLCPImage(heroImage.src);
    optimizer.setFetchPriority(heroImage, 'high');
  }

  // 预加载关键字体
  optimizer.preloadFont('/fonts/main-font.woff2', 'swap');

  // 预加载关键CSS
  optimizer.preloadCriticalResource('/styles/critical.css', 'style');

  // 预加载关键API
  optimizer.preloadCriticalResource('/api/critical-data', 'fetch');
}

// 自动化LCP优化
class AutomatedLCPOptimizer {
  /**
   * 分析并优化LCP
   */
  async analyzeAndOptimize(): Promise<LCPReport> {
    const report: LCPReport = {
      lcpElement: null,
      lcpTime: 0,
      suggestions: []
    };

    // 使用Performance Observer
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as LargestContentfulPaint;

      report.lcpElement = lastEntry.element?.tagName;
      report.lcpTime = lastEntry.renderTime || lastEntry.loadTime;
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });

    // 获取关键路径分析
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    for (const resource of resources) {
      if (resource.initiatorType === 'img') {
        if (resource.fetchStart - resource.startTime > 100) {
          report.suggestions.push({
            type: 'preload',
            url: resource.name,
            message: `图片 ${resource.name} 加载较晚，建议预加载`
          });
        }
      }
    }

    return report;
  }
}

interface LCPReport {
  lcpElement: string | null;
  lcpTime: number;
  suggestions: Array<{
    type: string;
    url: string;
    message: string;
  }>;
}
```

### 7.3 FID/INP优化

FID（First Input Delay）和INP（Interaction to Next Paint）是衡量页面交互响应性的指标。

```typescript
// fid-inp-optimization.ts - FID/INP优化

class InteractionOptimizer {
  /**
   * 识别长任务
   */
  identifyLongTasks(threshold: number = 50): PerformanceLongTaskTiming[] {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      console.log('长任务:', entries);
    });

    observer.observe({ type: 'longtask', buffered: true });

    return [];
  }

  /**
   * 使用Web Worker处理重计算
   */
  scheduleWorkInWorker<T>(
    task: () => T,
    callback: (result: T) => void
  ): void {
    const worker = new Worker('/workers/heavy-task.js');

    worker.postMessage({ task: 'process' });

    worker.onmessage = (event) => {
      callback(event.data.result);
      worker.terminate();
    };
  }

  /**
   * 使用requestIdleCallback处理非紧急任务
   */
  scheduleNonUrgentTask(callback: () => void, options?: IdleRequestOptions): void {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        callback();
      }, options);
    } else {
      setTimeout(callback, 1);
    }
  }

  /**
   * 分割长任务
   */
  async yieldToMain(event?: Event): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (event?.target) {
          // 处理事件
        }
        resolve();
      }, 0);
    });
  }

  /**
   * 优化事件处理
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => {
        func(...args);
      }, wait);
    };
  }

  /**
   * 节流
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean = false;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  }
}

// 实战：优化输入处理
class InputOptimizer {
  /**
   * 优化输入事件处理
   */
  optimizeInput(
    inputElement: HTMLInputElement,
    processFn: (value: string) => void
  ): void {
    let pendingValue: string | null = null;
    let scheduled: boolean = false;

    const processInput = () => {
      scheduled = false;
      if (pendingValue !== null) {
        processFn(pendingValue);
        pendingValue = null;
      }
    };

    inputElement.addEventListener('input', (event) => {
      pendingValue = (event.target as HTMLInputElement).value;

      if (!scheduled) {
        scheduled = true;
        // 使用scheduler.yield或setTimeout让出主线程
        if ('scheduler' in window && 'yield' in (window as any).scheduler) {
          (window as any).scheduler.yield().then(processInput);
        } else {
          setTimeout(processInput, 0);
        }
      }
    });
  }

  /**
   * 延迟加载组件
   */
  async loadComponentOnInteraction<T>(
    trigger: HTMLElement,
    loadFn: () => Promise<T>,
    renderFn: (component: T) => void
  ): Promise<void> {
    const loadAndRender = async () => {
      const component = await loadFn();
      renderFn(component);

      // 清理事件监听
      trigger.removeEventListener('click', loadAndRender);
      trigger.removeEventListener('touchstart', loadAndRender);
    };

    // 预连接
    trigger.addEventListener('touchstart', loadAndRender, { passive: true });
    trigger.addEventListener('click', loadAndRender, { once: true });
  }
}

// 测量INP
class INPMeasurer {
  private interactions: Map<number, InteractionTiming> = new Map();
  private currentInteraction: number | null = null;

  measure(): void {
    // 观察interaction IDs
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const interaction = entry as PerformanceEventTiming;

        if (interaction.processingStart > interaction.startTime) {
          const duration = interaction.processingStart - interaction.startTime +
                          (interaction.processingEnd - interaction.processingStart);

          if (duration > 100) { // 记录超过100ms的交互
            console.log('慢交互:', {
              type: interaction.name,
              duration: Math.round(duration),
              target: (interaction.target as HTMLElement)?.tagName
            });
          }
        }
      }
    });

    observer.observe({
      type: 'event',
      buffered: true,
      durationThreshold: 100
    });
  }

  getINP(): number {
    let maxDuration = 0;

    this.interactions.forEach((interaction) => {
      const duration = interaction.processingEnd - interaction.startTime;
      if (duration > maxDuration) {
        maxDuration = duration;
      }
    });

    return maxDuration;
  }
}
```

### 7.4 CLS优化：图片尺寸、字体加载

CLS（Cumulative Layout Shift）衡量页面视觉稳定性。

```typescript
// cls-optimization.ts - CLS优化

class CLSOptimizer {
  /**
   * 为图片设置尺寸
   */
  setImageDimensions(
    img: HTMLImageElement,
    width: number,
    height: number,
    aspectRatio?: number
  ): void {
    // 设置宽高
    img.width = width;
    img.height = height;

    // 设置aspect-ratio CSS
    if (aspectRatio) {
      img.style.aspectRatio = `${aspectRatio}`;
    } else if (width && height) {
      img.style.aspectRatio = `${width} / ${height}`;
    }
  }

  /**
   * 使用aspect-ratio占位
   */
  setPlaceholderAspectRatio(
    element: HTMLElement,
    width: number,
    height: number
  ): void {
    const ratio = width / height;
    element.style.aspectRatio = `${ratio}`;
    element.style.width = '100%';
    // 高度将由aspect-ratio自动计算
    element.style.height = 'auto';
  }

  /**
   * 为动态内容预留空间
   */
  reserveSpace(
    element: HTMLElement,
    minHeight: number
  ): void {
    element.style.minHeight = `${minHeight}px`;
    element.style.overflow = 'hidden';
  }

  /**
   * 字体加载优化
   */
  optimizeFontLoading(
    fontFamily: string,
    fontUrl: string,
    options: {
      display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
      unicodeRange?: string;
      weight?: string;
      style?: string;
    } = {}
  ): void {
    // 创建@font-face
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: '${fontFamily}';
        src: url('${fontUrl}') format('woff2');
        font-display: ${options.display || 'swap'};
        ${options.unicodeRange ? `unicode-range: ${options.unicodeRange};` : ''}
        ${options.weight ? `font-weight: ${options.weight};` : ''}
        ${options.style ? `font-style: ${options.style};` : ''}
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * 预加载字体
   */
  preloadFont(fontUrl: string): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = fontUrl;
    link.as = 'font';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }

  /**
   * 使用字体度量API避免CLS
   */
  async adjustLayoutForFont(
    fontFamily: string,
    fallbackFont: string = 'sans-serif'
  ): Promise<void> {
    // 加载字体
    await document.fonts.load(`16px "${fontFamily}"`);

    // 比较字体度量
    const fontMetrics = await this.getFontMetrics(fontFamily);
    const fallbackMetrics = await this.getFontMetrics(fallbackFont);

    // 计算偏移量
    const adjustment = fontMetrics.xHeight - fallbackMetrics.xHeight;

    if (Math.abs(adjustment) > 0) {
      // 调整所有使用该字体的元素的line-height
      document.querySelectorAll(`[style*="${fontFamily}"], .uses-${fontFamily}`).forEach((el) => {
        const element = el as HTMLElement;
        const currentHeight = parseFloat(getComputedStyle(element).lineHeight);
        element.style.lineHeight = `${currentHeight + adjustment}px`;
      });
    }
  }

  private async getFontMetrics(fontFamily: string): Promise<{
    xHeight: number;
    capHeight: number;
  }> {
    // 创建测量canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const testText = 'xHp';
    ctx.font = `16px "${fontFamily}", sans-serif`;

    const metrics = ctx.measureText(testText);

    return {
      xHeight: metrics.actualBoundingBoxAscent || 0,
      capHeight: metrics.actualBoundingBoxAscent || 0
    };
  }

  /**
   * 观察CLS
   */
  observeCLS(callback: (cls: number) => void): PerformanceObserver {
    let cumulativeLayoutShift = 0;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShift = entry as LayoutShift;
        if (!layoutShift.hadRecentInput) {
          cumulativeLayoutShift += layoutShift.value;
          callback(cumulativeLayoutShift);
        }
      }
    });

    observer.observe({ type: 'layout-shift', buffered: true });

    return observer;
  }
}

// 自动化CLS检测
class CLSDetector {
  private observer: PerformanceObserver | null = null;
  private shifts: Array<{ value: number; sources: LayoutShiftAttribution[] }> = [];

  start(): void {
    this.observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as LayoutShift;
        if (!shift.hadRecentInput) {
          this.shifts.push({
            value: shift.value,
            sources: shift.sources as LayoutShiftAttribution[]
          });

          console.log('CLS检测:', {
            value: shift.value.toFixed(4),
            sources: shift.sources.map((s: any) => ({
              node: s.node?.tagName,
              previousRect: s.previousRect,
              currentRect: s.currentRect
            }))
          });
        }
      }
    });

    this.observer.observe({ type: 'layout-shift', buffered: true });
  }

  stop(): void {
    this.observer?.disconnect();
  }

  getTotalCLS(): number {
    return this.shifts.reduce((sum, shift) => sum + shift.value, 0);
  }

  getReport(): CLSReport {
    return {
      totalCLS: this.getTotalCLS(),
      shiftCount: this.shifts.length,
      worstShift: this.shifts.length > 0
        ? Math.max(...this.shifts.map(s => s.value))
        : 0,
      shifts: this.shifts
    };
  }
}

interface CLSReport {
  totalCLS: number;
  shiftCount: number;
  worstShift: number;
  shifts: Array<{ value: number; sources: LayoutShiftAttribution[] }>;
}
```

---

## 8. 高级特性

### 8.1 跨标签页通信：BroadcastChannel

BroadcastChannel API允许同源的标签页之间进行通信。

```typescript
// broadcast-channel.ts - 跨标签页通信封装

class CrossTabCommunicator {
  private channel: BroadcastChannel | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  /**
   * 初始化频道
   */
  init(channelName: string): void {
    this.channel = new BroadcastChannel(channelName);

    this.channel.onmessage = (event) => {
      const { type, data } = event.data;

      // 触发对应的监听器
      const typeListeners = this.listeners.get(type);
      if (typeListeners) {
        typeListeners.forEach((listener) => listener(data));
      }

      // 触发通配符监听器
      const allListeners = this.listeners.get('*');
      if (allListeners) {
        allListeners.forEach((listener) => listener({ type, data }));
      }
    };
  }

  /**
   * 发送消息
   */
  send(type: string, data?: any): void {
    if (!this.channel) {
      console.error('BroadcastChannel未初始化');
      return;
    }

    this.channel.postMessage({ type, data, timestamp: Date.now() });
  }

  /**
   * 订阅消息
   */
  subscribe(type: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }

    this.listeners.get(type)!.add(callback);

    // 返回取消订阅函数
    return () => {
      this.listeners.get(type)?.delete(callback);
    };
  }

  /**
   * 关闭频道
   */
  close(): void {
    this.channel?.close();
    this.channel = null;
    this.listeners.clear();
  }
}

// 实战：状态同步
class TabStateSync {
  private communicator: CrossTabCommunicator;
  private stateKey: string;
  private localState: any;

  constructor(stateKey: string) {
    this.stateKey = stateKey;
    this.communicator = new CrossTabCommunicator();

    // 初始化本地状态
    this.localState = this.loadFromStorage();

    // 监听远程状态更新
    this.communicator.subscribe('stateUpdate', ({ key, state }) => {
      if (key === this.stateKey) {
        this.localState = state;
        this.saveToStorage(state);
        this.onStateChange?.(state);
      }
    });

    // 监听远程状态请求
    this.communicator.subscribe('stateRequest', ({ key, tabId }) => {
      if (key === this.stateKey) {
        this.communicator.send('stateResponse', {
          key: this.stateKey,
          state: this.localState,
          requestTabId: tabId
        });
      }
    });

    // 监听远程响应
    this.communicator.subscribe('stateResponse', ({ key, state }) => {
      if (key === this.stateKey && !this.localState) {
        this.localState = state;
        this.saveToStorage(state);
        this.onStateChange?.(state);
      }
    });
  }

  init(channelName: string = 'app-state'): void {
    this.communicator.init(channelName);

    // 请求当前状态
    this.communicator.send('stateRequest', {
      key: this.stateKey,
      tabId: this.getTabId()
    });
  }

  updateState(newState: Partial<any>): void {
    this.localState = { ...this.localState, ...newState };
    this.saveToStorage(this.localState);
    this.communicator.send('stateUpdate', {
      key: this.stateKey,
      state: this.localState
    });
  }

  getState(): any {
    return this.localState;
  }

  private loadFromStorage(): any {
    try {
      return JSON.parse(localStorage.getItem(this.stateKey) || '{}');
    } catch {
      return {};
    }
  }

  private saveToStorage(state: any): void {
    localStorage.setItem(this.stateKey, JSON.stringify(state));
  }

  private getTabId(): string {
    let tabId = sessionStorage.getItem('tabId');
    if (!tabId) {
      tabId = crypto.randomUUID();
      sessionStorage.setItem('tabId', tabId);
    }
    return tabId;
  }

  onStateChange?: (state: any) => void;

  close(): void {
    this.communicator.close();
  }
}

// 使用示例
function tabSyncDemo() {
  const sync = new TabStateSync('user-settings');
  sync.init('app-state');

  // 监听状态变化
  sync.onStateChange = (state) => {
    console.log('状态更新:', state);
    // 更新UI
  };

  // 更新状态（所有标签页都会收到通知）
  sync.updateState({ theme: 'dark', language: 'zh-CN' });
}

// 锁机制（防止多标签页冲突）
class TabLock {
  private lockKey: string;
  private tabId: string;
  private heartbeatInterval: number | null = null;

  constructor(lockKey: string) {
    this.lockKey = `tab-lock-${lockKey}`;
    this.tabId = crypto.randomUUID();
  }

  async acquire(timeout: number = 5000): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      // 尝试获取锁
      const existing = localStorage.getItem(this.lockKey);

      if (!existing) {
        // 没有锁，创建锁
        localStorage.setItem(this.lockKey, JSON.stringify({
          tabId: this.tabId,
          timestamp: Date.now()
        }));

        // 启动心跳
        this.startHeartbeat();
        return true;
      }

      const lock = JSON.parse(existing);

      // 检查锁是否过期（超过30秒）
      if (Date.now() - lock.timestamp > 30000) {
        // 锁已过期，强制获取
        localStorage.setItem(this.lockKey, JSON.stringify({
          tabId: this.tabId,
          timestamp: Date.now()
        }));

        this.startHeartbeat();
        return true;
      }

      // 等待一小段时间后重试
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return false;
  }

  release(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // 只释放自己的锁
    const existing = localStorage.getItem(this.lockKey);
    if (existing) {
      const lock = JSON.parse(existing);
      if (lock.tabId === this.tabId) {
        localStorage.removeItem(this.lockKey);
      }
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = window.setInterval(() => {
      const existing = localStorage.getItem(this.lockKey);
      if (existing) {
        const lock = JSON.parse(existing);
        if (lock.tabId === this.tabId) {
          lock.timestamp = Date.now();
          localStorage.setItem(this.lockKey, JSON.stringify(lock));
        }
      }
    }, 5000);
  }
}
```

### 8.2 Background Sync后台同步

Background Sync API允许Service Worker在网络恢复后自动同步数据。

```typescript
// background-sync.ts - 后台同步封装

class BackgroundSyncManager {
  private registration: ServiceWorkerRegistration | null = null;

  /**
   * 初始化
   */
  async init(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker不可用');
      return false;
    }

    if (!('sync' in ServiceWorkerRegistration.prototype)) {
      console.log('Background Sync不可用');
      return false;
    }

    this.registration = await navigator.serviceWorker.ready;
    return true;
  }

  /**
   * 注册后台同步
   */
  async registerSync(tag: string, options?: SyncOptions): Promise<void> {
    if (!this.registration) {
      await this.init();
    }

    if (this.registration && 'sync' in this.registration) {
      await this.registration.sync.register(tag, options);
      console.log(`后台同步已注册: ${tag}`);
    }
  }

  /**
   * 注册一次性同步
   */
  async syncOnce(tag: string): Promise<void> {
    await this.registerSync(tag, { oneShot: true });
  }

  /**
   * 注册定期同步
   */
  async syncPeriodically(tag: string, minInterval: number): Promise<void> {
    await this.registerSync(tag, {
      minInterval: minInterval,
      background: true
    });
  }
}

// Service Worker中的同步处理
// sw-sync.js
const SYNC_TAG = 'sync-offline-data';

self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData(): Promise<void> {
  try {
    // 1. 获取离线队列
    const db = await openDB();
    const pendingItems = await db.getAll('offlineQueue');

    if (pendingItems.length === 0) {
      console.log('没有待同步数据');
      return;
    }

    console.log(`开始同步 ${pendingItems.length} 条数据`);

    // 2. 逐个同步
    let successCount = 0;
    let failCount = 0;

    for (const item of pendingItems) {
      try {
        const response = await fetch(item.url, {
          method: item.method || 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(item.data)
        });

        if (response.ok) {
          // 同步成功，删除本地记录
          await db.delete('offlineQueue', item.id);
          successCount++;

          // 通知客户端同步完成
          const clients = await self.clients.matchAll();
          clients.forEach((client) => {
            client.postMessage({
              type: 'SYNC_SUCCESS',
              itemId: item.id
            });
          });
        } else {
          failCount++;
        }
      } catch (error) {
        console.error('同步失败:', item, error);
        failCount++;
      }
    }

    console.log(`同步完成: 成功 ${successCount}, 失败 ${failCount}`);

    // 3. 如果还有未同步的数据，重新注册同步
    const remaining = await db.count('offlineQueue');
    if (remaining > 0) {
      // 使用 exponential backoff
      await self.sync.register(SYNC_TAG, {
        minInterval: getBackoffInterval(failCount)
      });
    }

  } catch (error) {
    console.error('同步过程出错:', error);
    throw error; // 重试
  }
}

function getBackoffInterval(failCount: number): number {
  // 指数退避：1s, 2s, 4s, 8s, 16s, 最大5分钟
  const base = Math.min(1000 * Math.pow(2, failCount), 5 * 60 * 1000);
  return base;
}

// 定期后台同步
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'periodic-sync-content') {
    event.waitUntil(syncPeriodicContent());
  }
});

async function syncPeriodicContent(): Promise<void> {
  try {
    // 获取最新内容
    const response = await fetch('/api/latest-content');
    const content = await response.json();

    // 更新缓存
    const cache = await caches.open('content-cache-v1');
    await cache.put('/api/latest-content', new Response(JSON.stringify(content)));

    // 更新IndexedDB
    const db = await openDB();
    for (const item of content) {
      await db.put('cachedContent', item);
    }

    console.log('定期同步完成');
  } catch (error) {
    console.error('定期同步失败:', error);
  }
}

// 前端使用
class OfflineSyncManager {
  private syncManager: BackgroundSyncManager;
  private db: IndexedDBHelper;

  constructor() {
    this.syncManager = new BackgroundSyncManager();
    this.db = new IndexedDBHelper('OfflineDB', 1);
  }

  async init(): Promise<void> {
    await this.syncManager.init();
    await this.db.open();

    // 监听Service Worker消息
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'SYNC_SUCCESS') {
        console.log('数据同步成功:', event.data.itemId);
        this.onSyncSuccess?.(event.data.itemId);
      }
    });
  }

  /**
   * 添加到离线队列
   */
  async addToQueue(item: {
    url: string;
    method?: string;
    data: any;
  }): Promise<void> {
    // 保存到IndexedDB
    await this.db.add('offlineQueue', {
      ...item,
      timestamp: Date.now()
    });

    // 注册后台同步
    await this.syncManager.syncOnce('sync-offline-data');
  }

  /**
   * 获取队列状态
   */
  async getQueueStatus(): Promise<{ total: number; items: any[] }> {
    const items = await this.db.getAll('offlineQueue');
    return {
      total: items.length,
      items
    };
  }

  /**
   * 手动触发同步
   */
  async triggerSync(): Promise<void> {
    await this.syncManager.syncOnce('sync-offline-data');
  }

  onSyncSuccess?: (itemId: number) => void;
}

// React Hook
function useOfflineSync() {
  const [queueStatus, setQueueStatus] = useState({ total: 0, items: [] as any[] });
  const manager = useMemo(() => new OfflineSyncManager(), []);

  useEffect(() => {
    manager.init();

    manager.onSyncSuccess = () => {
      // 刷新队列状态
      manager.getQueueStatus().then(setQueueStatus);
    };

    // 定期更新状态
    const interval = setInterval(async () => {
      const status = await manager.getQueueStatus();
      setQueueStatus(status);
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [manager]);

  const addToQueue = useCallback(async (item: any) => {
    await manager.addToQueue(item);
  }, [manager]);

  const triggerSync = useCallback(async () => {
    await manager.triggerSync();
  }, [manager]);

  return {
    queueStatus,
    addToQueue,
    triggerSync
  };
}
```

### 8.3 Periodic Background Sync定期同步

Periodic Background Sync允许Web应用在后台定期同步数据。

```typescript
// periodic-sync.ts - 定期后台同步

class PeriodicSyncManager {
  private registration: ServiceWorkerRegistration | null = null;

  async init(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) return false;
    if (!('periodicSync' in ServiceWorkerRegistration.prototype)) {
      console.log('Periodic Background Sync不可用');
      return false;
    }

    this.registration = await navigator.serviceWorker.ready;
    return true;
  }

  /**
   * 请求权限并注册定期同步
   */
  async register(tag: string, minInterval: number = 12 * 60 * 60 * 1000): Promise<boolean> {
    if (!this.registration) {
      await this.init();
    }

    if (!this.registration) return false;

    // 请求通知权限（定期同步需要）
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('定期同步需要通知权限');
      return false;
    }

    try {
      await (this.registration as any).periodicSync.register(tag, {
        minInterval
      });
      console.log('定期同步已注册:', tag);
      return true;
    } catch (error) {
      console.error('注册定期同步失败:', error);
      return false;
    }
  }

  /**
   * 取消定期同步
   */
  async unregister(tag: string): Promise<void> {
    if (this.registration && 'periodicSync' in this.registration) {
      await (this.registration as any).periodicSync.unregister(tag);
    }
  }

  /**
   * 获取已注册的定期同步
   */
  async getRegisteredTags(): Promise<string[]> {
    if (this.registration && 'periodicSync' in this.registration) {
      return await (this.registration as any).periodicSync.getTags();
    }
    return [];
  }
}

// Service Worker中的定期同步处理
// sw-periodic.js
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-news-feed') {
    event.waitUntil(syncNewsFeed());
  }

  if (event.tag === 'sync-weather') {
    event.waitUntil(syncWeatherData());
  }

  if (event.tag === 'cleanup-cache') {
    event.waitUntil(cleanupOldCache());
  }
});

async function syncNewsFeed(): Promise<void> {
  try {
    // 获取最新新闻
    const response = await fetch('/api/news/feed');
    const articles = await response.json();

    // 更新缓存
    const cache = await caches.open('news-cache-v1');
    await cache.put('/api/news/feed', response.clone());

    // 保存到IndexedDB
    const db = await openDB();
    for (const article of articles) {
      await db.put('cachedNews', {
        ...article,
        cachedAt: Date.now()
      });
    }

    // 显示新内容通知
    const newCount = articles.length;
    await self.registration.showNotification('新闻更新', {
      body: `有 ${newCount} 条新新闻`,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge.png',
      data: { url: '/news' }
    });

  } catch (error) {
    console.error('新闻同步失败:', error);
  }
}

async function syncWeatherData(): Promise<void> {
  try {
    // 获取位置
    const position = await getCurrentPosition();

    // 获取天气数据
    const response = await fetch(
      `/api/weather?lat=${position.lat}&lon=${position.lon}`
    );
    const weather = await response.json();

    // 保存天气
    const db = await openDB();
    await db.put('cachedWeather', {
      ...weather,
      cachedAt: Date.now()
    });

  } catch (error) {
    console.error('天气同步失败:', error);
  }
}

async function cleanupOldCache(): Promise<void> {
  const cacheNames = await caches.keys();
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天

  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();

    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const dateHeader = response.headers.get('date');
        if (dateHeader) {
          const date = new Date(dateHeader).getTime();
          if (Date.now() - date > maxAge) {
            await cache.delete(request);
          }
        }
      }
    }
  }
}

function getCurrentPosition(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude
        });
      },
      reject,
      { timeout: 5000 }
    );
  });
}

// 前端使用
async function setupPeriodicSync() {
  const periodicSync = new PeriodicSyncManager();

  // 检查支持
  const supported = await periodicSync.init();
  if (!supported) {
    console.log('定期同步不可用');
    return;
  }

  // 注册新闻同步（每小时）
  await periodicSync.register('sync-news-feed', 60 * 60 * 1000);

  // 注册天气同步（15分钟）
  await periodicSync.register('sync-weather', 15 * 60 * 1000);

  // 注册缓存清理（每天）
  await periodicSync.register('cleanup-cache', 24 * 60 * 60 * 1000);
}
```

### 8.4 Contact Picker API

Contact Picker API允许Web应用访问用户的通讯录。

```typescript
// contact-picker.ts - 通讯录访问封装

class ContactPickerManager {
  /**
   * 检查支持
   */
  isSupported(): boolean {
    return 'contacts' in navigator;
  }

  /**
   * 请求通讯录权限
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      console.log('Contact Picker API不可用');
      return false;
    }

    try {
      const result = await navigator.contacts.select([], { multiple: false });
      return true;
    } catch (error) {
      if ((error as Error).name === 'NotAllowedError') {
        console.log('用户未授权');
        return false;
      }
      throw error;
    }
  }

  /**
   * 选择联系人
   */
  async selectContact(options?: {
    multiple?: boolean;
    includeEmail?: boolean;
    includeTel?: boolean;
    includeAddress?: boolean;
    includeIcon?: boolean;
  }): Promise<ContactInfo[]> {
    if (!this.isSupported()) {
      throw new Error('Contact Picker API不可用');
    }

    // 指定要获取的字段
    const props: ContactProperty[] = ['name'];
    const fetch = {
      multiple: options?.multiple ?? false,
    };

    if (options?.includeEmail) props.push('email');
    if (options?.includeTel) props.push('tel');
    if (options?.includeAddress) props.push('address');
    if (options?.includeIcon) props.push('icon');

    try {
      const contacts = await navigator.contacts.select(props, fetch);
      return contacts.map(this.formatContact);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return []; // 用户取消
      }
      throw error;
    }
  }

  /**
   * 格式化联系人信息
   */
  private formatContact(contact: any): ContactInfo {
    return {
      id: contact.id || crypto.randomUUID(),
      name: contact.name?.[0] || '未知姓名',
      emails: contact.email || [],
      phones: contact.tel || [],
      addresses: (contact.address || []).map((addr: any) => ({
        type: addr.type || 'home',
        street: addr.street || '',
        city: addr.city || '',
        region: addr.region || '',
        postalCode: addr.postalCode || '',
        country: addr.country || ''
      })),
      icon: contact.icon?.[0] || null
    };
  }

  /**
   * 发送邮件
   */
  async sendEmail(to: string[], subject: string, body: string): Promise<void> {
    const url = `mailto:${to.join(',')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  }

  /**
   * 发送短信
   */
  async sendSMS(to: string[], body: string): Promise<void> {
    const url = `sms:${to.join(',')}?body=${encodeURIComponent(body)}`;
    window.location.href = url;
  }

  /**
   * 拨打电话（如果支持tel链接）
   */
  async dialPhone(number: string): Promise<void> {
    window.location.href = `tel:${number}`;
  }
}

interface ContactInfo {
  id: string;
  name: string;
  emails: string[];
  phones: string[];
  addresses: Array<{
    type: string;
    street: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  }>;
  icon: string | null;
}

// React组件
function ContactPicker() {
  const [contacts, setContacts] = useState<ContactInfo[]>([]);
  const [selectedContact, setSelectedContact] = useState<ContactInfo | null>(null);
  const picker = useMemo(() => new ContactPickerManager(), []);

  const handleSelect = async () => {
    try {
      const selected = await picker.selectContact({
        multiple: false,
        includeEmail: true,
        includeTel: true
      });

      if (selected.length > 0) {
        setSelectedContact(selected[0]);
      }
    } catch (error) {
      console.error('选择联系人失败:', error);
    }
  };

  const handleSendEmail = () => {
    if (selectedContact?.emails?.[0]) {
      picker.sendEmail(
        [selectedContact.emails[0]],
        '主题',
        '邮件内容'
      );
    }
  };

  const handleCall = () => {
    if (selectedContact?.phones?.[0]) {
      picker.dialPhone(selectedContact.phones[0]);
    }
  };

  return (
    <div className="contact-picker">
      <button onClick={handleSelect}>选择联系人</button>

      {selectedContact && (
        <div className="contact-info">
          <h3>{selectedContact.name}</h3>

          {selectedContact.phones.length > 0 && (
            <div>
              <p>电话:</p>
              <ul>
                {selectedContact.phones.map((phone, i) => (
                  <li key={i}>{phone}</li>
                ))}
              </ul>
              <button onClick={handleCall}>拨打电话</button>
            </div>
          )}

          {selectedContact.emails.length > 0 && (
            <div>
              <p>邮箱:</p>
              <ul>
                {selectedContact.emails.map((email, i) => (
                  <li key={i}>{email}</li>
                ))}
              </ul>
              <button onClick={handleSendEmail}>发送邮件</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const contactPicker = new ContactPickerManager();
```

---

## 总结

本文档涵盖了PWA与WebAssembly的完整技术体系，包括：

1. **PWA技术**：Service Worker生命周期、离线缓存策略、manifest配置、推送通知
2. **WebAssembly**：内存模型、Rust/Emscripten编译、JS互调
3. **Web Workers**：专用/共享Worker、线程通信、大数据处理
4. **离线存储**：IndexedDB、Cache API、存储方案对比
5. **推送通知**：Push API、Notification API
6. **原生能力**：Web Share、NFC、Bluetooth、Serial、传感器、相机
7. **性能指标**：Core Web Vitals、LCP/FID/CLS优化
8. **高级特性**：BroadcastChannel、Background Sync、Contact Picker

这些技术共同构成了现代Web应用的强大能力，使开发者能够构建接近原生应用体验的Web应用。

---

*本文档持续更新，最后更新于2026年4月*
