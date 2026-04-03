# PWA与小程序开发对比完全指南

## 前言：为什么需要对比

在移动优先的时代，Web应用和轻量化应用是两个重要的开发方向。PWA（Progressive Web App，渐进式Web应用）是Web技术的进化形态，而小程序（如微信小程序、支付宝小程序）则是中国特色的轻量级应用生态。

理解两者的差异和适用场景，对于技术选型至关重要。

---

## 一、PWA核心概念

### 1.1 PWA是什么

PWA是使用Web技术（HTML、CSS、JavaScript）构建的应用，但通过现代浏览器API和特性，提供了接近原生应用体验的Web应用。

```
PWA 核心特性：

┌─────────────────────────────────────────────────────────────┐
│                     PWA 四大支柱                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │   可靠     │  │   快速      │  │   安全     │  │   沉浸     │  │
│  │  (Reliable) │  │  (Fast)     │  │  (Secure)   │  │ (Engaging) │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
│       │               │               │               │         │
│       ▼               ▼               ▼               ▼         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  Service   │  │  Web Workers│  │    HTTPS    │  │   Web App   │  │
│  │  Worker    │  │  & Cache    │  │   必须      │  │   Manifest  │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  离线访问   │  │  快速响应   │  │  安全通信   │  │  添加到桌面 │  │
│  │             │  │             │  │             │  │             │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**PWA的本质：**
- 不是一种新技术，而是Web应用的最佳实践集合
- 通过浏览器API增强Web应用能力
- 提供接近原生应用的用户体验
- 具备原生应用的可安装性

### 1.2 Service Worker详解

Service Worker是PWA的核心技术，它是运行在浏览器后台的脚本，独立于网页，可以拦截网络请求、缓存资源、推送消息等。

```javascript
// service-worker.js - Service Worker完整示例
// 这是PWA的核心，负责缓存管理和离线支持

// 当前缓存版本
const CACHE_NAME = 'my-pwa-cache-v1';

// 需要缓存的资源列表（预缓存）
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/scripts/main.js',
  '/images/logo.png',
  '/fonts/custom-font.woff2',
];

// ======================
// 1. 安装阶段 - 预缓存资源
// ======================
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] 安装中...');

  // waitUntil确保Service Worker不会过早终止
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] 预缓存资源');
        // addAll会等待所有资源缓存完成
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[ServiceWorker] 跳过等待');
        // 立即激活新的Service Worker
        return self.skipWaiting();
      })
  );
});

// ======================
// 2. 激活阶段 - 清理旧缓存
// ======================
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] 激活中...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        // 返回所有缓存名称的Promise
        return Promise.all(
          cacheNames.map((cacheName) => {
            // 删除不是当前版本的缓存
            if (cacheName !== CACHE_NAME) {
              console.log('[ServiceWorker] 删除旧缓存:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[ServiceWorker] 声称控制所有页面');
        // 立即接管所有页面
        return self.clients.claim();
      })
  );
});

// ======================
// 3. 请求拦截 - 缓存策略
// ======================
self.addEventListener('fetch', (event) => {
  // 只处理同源请求和CDN请求
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // 根据请求类型选择不同的缓存策略
  const url = new URL(event.request.url);

  // 策略1：缓存优先（适用于静态资源）
  if (event.request.destination === 'style' ||
      event.request.destination === 'script' ||
      event.request.destination === 'image') {
    event.respondWith(cacheFirst(event.request));
  }

  // 策略2：网络优先（适用于API数据）
  else if (event.request.url.includes('/api/')) {
    event.respondWith(networkFirst(event.request));
  }

  // 策略3：仅网络（适用于实时数据）
  // else if (event.request.url.includes('/realtime/')) {
  //   event.respondWith(networkOnly(event.request));
  // }

  // 策略4：仅缓存（适用于离线可用）
  // else if (event.request.url.includes('/offline/')) {
  //   event.respondWith(cacheOnly(event.request));
  // }

  // 策略5：Stale-while-revalidate
  else {
    event.respondWith(staleWhileRevalidate(event.request));
  }
});

// ======================
// 缓存策略实现
// ======================

// 缓存优先策略：先从缓存读取，缓存没有再请求网络
async function cacheFirst(request) {
  // 尝试从缓存获取
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    console.log('[ServiceWorker] 从缓存返回:', request.url);
    return cachedResponse;
  }

  console.log('[ServiceWorker] 缓存未命中，请求网络:', request.url);

  // 缓存没有，请求网络
  const networkResponse = await fetch(request);

  // 如果请求成功，缓存响应
  if (networkResponse.ok) {
    const cache = await caches.open(CACHE_NAME);
    // Clone响应，因为响应只能使用一次
    cache.put(request, networkResponse.clone());
  }

  return networkResponse;
}

// 网络优先策略：先请求网络，失败时使用缓存
async function networkFirst(request) {
  console.log('[ServiceWorker] 网络优先策略:', request.url);

  try {
    // 先尝试请求网络
    const networkResponse = await fetch(request);

    // 如果请求成功，缓存响应
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] 网络请求失败，使用缓存:', request.url);

    // 请求失败，从缓存获取
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // 缓存也没有，返回离线页面
    return caches.match('/offline.html');
  }
}

// Stale-while-revalidate：先返回缓存，同时后台更新缓存
async function staleWhileRevalidate(request) {
  console.log('[ServiceWorker] Stale-while-revalidate:', request.url);

  // 先从缓存获取
  const cachedResponse = await caches.match(request);

  // 同时发起网络请求更新缓存
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(request, networkResponse.clone());
      });
    }
    return networkResponse;
  });

  // 返回缓存的响应（如果存在），否则等待网络响应
  return cachedResponse || fetchPromise;
}

// 仅缓存策略：只从缓存返回
async function cacheOnly(request) {
  const cachedResponse = await caches.match(request);
  return cachedResponse || new Response('离线内容不可用', { status: 503 });
}

// 仅网络策略：只从网络返回
async function networkOnly(request) {
  const networkResponse = await fetch(request);
  return networkResponse;
}

// ======================
// 后台同步
// ======================
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] 后台同步:', event.tag);

  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // 从IndexedDB获取待同步数据
  // 发送到服务器
  console.log('[ServiceWorker] 执行数据同步');
}

// ======================
// 推送通知
// ======================
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] 收到推送:', event);

  let data = {
    title: '默认标题',
    body: '默认内容',
    icon: '/images/icon.png'
  };

  // 如果推送消息包含数据，解析它
  if (event.data) {
    data = {
      title: event.data.title() || data.title,
      body: event.data.body() || data.body,
      icon: event.data.icon() || data.icon,
      data: event.data.data() || {}
    };
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: '/images/badge.png',
    vibrate: [100, 50, 100],
    data: data.data,
    actions: [
      { action: 'open', title: '打开' },
      { action: 'close', title: '关闭' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 点击通知的处理
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] 通知被点击:', event);

  event.notification.close();

  if (event.action === 'open' || !event.action) {
    // 打开或聚焦应用窗口
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((windowClients) => {
          // 如果已有窗口，聚焦它
          for (const client of windowClients) {
            if (client.url.includes('/') && 'focus' in client) {
              return client.focus();
            }
          }
          // 如果没有窗口，打开新窗口
          if (clients.openWindow) {
            return clients.openWindow('/');
          }
        })
    );
  }
});
```

### 1.3 Web App Manifest

Web App Manifest是PWA的清单文件，定义了应用的元数据，使其可以"安装"到设备桌面。

```json
// manifest.json - Web App Manifest完整配置
{
  // 应用名称
  "name": "我的PWA应用",
  // 简短名称（桌面图标用）
  "short_name": "PWA应用",
  // 应用描述
  "description": "一个功能丰富的渐进式Web应用",
  // 起始URL（相对于域名的根路径）
  "start_url": "/",
  // 显示模式
  "display": "standalone",
  // 背景颜色（启动画面用）
  "background_color": "#ffffff",
  // 主题颜色（状态栏、标题栏用）
  "theme_color": "#2196F3",
  // 方向限制
  "orientation": "portrait-primary",
  // 范围（限制应用可以导航的范围）
  "scope": "/",
  // 语言
  "lang": "zh-CN",
  // 文字方向
  "dir": "ltr",

  // 图标列表（不同尺寸适应不同场景）
  "icons": [
    {
      "src": "/images/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/images/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/images/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/images/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/images/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/images/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/images/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/images/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],

  // 快捷方式（桌面右键菜单）
  "shortcuts": [
    {
      "name": "打开首页",
      "short_name": "首页",
      "description": "跳转到应用首页",
      "url": "/",
      "icons": [{ "src": "/images/shortcut-home.png", "sizes": "96x96" }]
    },
    {
      "name": "购物车",
      "short_name": "购物车",
      "description": "查看购物车",
      "url": "/cart"
    }
  ],

  // 截图（应用商店用）
  "screenshots": [
    {
      "src": "/images/screenshot-1.png",
      "sizes": "1080x1920",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "应用首页截图"
    }
  ],

  // 分类
  "categories": ["shopping", "productivity"],

  // 相关的Web应用
  "related_applications": [],
  // 偏好使用的应用
  "prefer_related_applications": false
}
```

```html
<!-- index.html - 引入Manifest -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- 基础元数据 -->
  <title>我的PWA应用</title>
  <meta name="description" content="一个功能丰富的渐进式Web应用">

  <!-- PWA必需：HTTPS -->
  <!-- PWA必需：Manifest -->
  <link rel="manifest" href="/manifest.json">

  <!-- 主题颜色 -->
  <meta name="theme-color" content="#2196F3">

  <!-- 图标 -->
  <link rel="icon" type="image/png" sizes="32x32" href="/images/icon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/images/icon-16x16.png">

  <!-- Apple Touch Icon（iOS） -->
  <link rel="apple-touch-icon" href="/images/icon-192x192.png">

  <!-- Apple Touch Icon（iOS启动画面） -->
  <link rel="apple-touch-startup-image" href="/images/launch-screen.png">

  <!-- iOS-specific meta tags -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="PWA应用">

  <style>
    /* CSS规则 */
  </style>
</head>
<body>
  <script>
    // ======================
    // 注册Service Worker
    // ======================
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          // 注册Service Worker
          const registration = await navigator.serviceWorker.register('/service-worker.js');

          console.log('[App] Service Worker注册成功:', registration.scope);

          // 监听更新
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('[App] 发现新版本Service Worker');

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // 新的Service Worker已安装
                console.log('[App] 新版本已就绪，请刷新页面');
                // 可以提示用户刷新或自动更新
                showUpdateNotification();
              }
            });
          });

          // 检查是否有正在等待的更新
          if (registration.waiting) {
            console.log('[App] 有待激活的更新');
            showUpdateNotification();
          }

        } catch (error) {
          console.error('[App] Service Worker注册失败:', error);
        }
      });
    }

    // 显示更新提示
    function showUpdateNotification() {
      // 可以显示一个"有新版本可用"的提示
      console.log('应用有新版本可用');
    }

    // ======================
    // PWA安装提示
    // ======================
    let deferredPrompt;
    const installButton = document.getElementById('install-button');

    // 捕获beforeinstallprompt事件
    window.addEventListener('beforeinstallprompt', (event) => {
      console.log('[App] 可以安装PWA');

      // 阻止自动弹出
      event.preventDefault();

      // 保存事件以便后续触发
      deferredPrompt = event;

      // 显示安装按钮
      if (installButton) {
        installButton.style.display = 'block';
      }
    });

    // 用户点击安装按钮
    async function installPWA() {
      if (!deferredPrompt) {
        console.log('[App] 没有可用的安装提示');
        return;
      }

      // 显示安装提示
      deferredPrompt.prompt();

      // 等待用户选择
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[App] 用户安装选择:', outcome);

      // 只能提示一次
      deferredPrompt = null;

      // 隐藏安装按钮
      if (installButton) {
        installButton.style.display = 'none';
      }
    }

    // 监听安装成功
    window.addEventListener('appinstalled', (event) => {
      console.log('[App] 应用已安装:', event);
      deferredPrompt = null;
    });
  </script>

  <!-- 安装按钮（初始隐藏） -->
  <button id="install-button" style="display: none;" onclick="installPWA()">
    安装应用
  </button>
</body>
</html>
```

---

## 二、离线缓存详解

### 2.1 缓存策略选择

根据资源类型和更新频率，需要选择合适的缓存策略。

```javascript
// cache-strategies.js - 缓存策略工具

/**
 * 缓存策略类型：
 *
 * 1. Cache First（缓存优先）
 *    - 适用：静态资源（CSS、JS、图片、字体）
 *    - 优点：响应快，节省带宽
 *    - 缺点：可能返回过期内容
 *
 * 2. Network First（网络优先）
 *    - 适用：API数据、用户生成内容
 *    - 优点：总是获取最新内容
 *    - 缺点：网络慢时体验差
 *
 * 3. Stale-While-Revalidate
 *    - 适用：既需要缓存又需要新内容
 *    - 优点：快速响应同时保持更新
 *    - 缺点：首次可能返回旧数据
 *
 * 4. Cache Only
 *    - 适用：完全离线场景
 *    - 优点：无需网络
 *    - 缺点：无法获取新内容
 *
 * 5. Network Only
 *    - 适用：实时数据
 *    - 优点：总是最新
 *    - 缺点：离线不可用
 */

// 创建缓存管理器
class CacheManager {
  constructor() {
    this.cacheName = 'my-cache-v1';
  }

  // 打开缓存
  async openCache() {
    return await caches.open(this.cacheName);
  }

  // 缓存资源
  async put(request, response) {
    const cache = await this.openCache();
    // 请求和响应都需要克隆，因为只能使用一次
    cache.put(request, response.clone());
  }

  // 获取缓存
  async get(request) {
    const cache = await this.openCache();
    return await cache.match(request);
  }

  // 删除缓存
  async delete(request) {
    const cache = await this.openCache();
    return await cache.delete(request);
  }

  // 清理旧缓存
  async cleanOldCaches() {
    const cacheNames = await caches.keys();
    return Promise.all(
      cacheNames
        .filter(name => name !== this.cacheName)
        .map(name => caches.delete(name))
    );
  }
}

// 实际应用：根据URL模式选择策略
function getCacheStrategy(url) {
  // 静态资源 - 缓存优先
  if (/\.(css|js|woff2?|png|jpg|jpeg|gif|svg|ico|webp)$/.test(url)) {
    return 'cache-first';
  }

  // API请求 - 网络优先
  if (url.includes('/api/')) {
    return 'network-first';
  }

  // HTML页面 - Stale-while-revalidate
  if (/\.html?$/.test(url) || url.endsWith('/')) {
    return 'stale-while-revalidate';
  }

  // 默认：网络优先
  return 'network-first';
}

// IndexedDB用于存储更大、更结构化的数据
class IndexedDBManager {
  constructor(dbName, version) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  // 打开数据库
  async open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // 创建对象存储
        if (!db.objectStoreNames.contains('data')) {
          // keyPath指定主键
          const store = db.createObjectStore('data', { keyPath: 'id', autoIncrement: true });
          // 创建索引
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  // 存储数据
  async put(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 获取数据
  async get(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 获取所有数据
  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 删除数据
  async delete(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 按索引查询
  async getByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
```

### 2.2 完整离线支持实现

```javascript
// offline-manager.js - 离线支持完整实现

class OfflineManager {
  constructor() {
    this.cacheManager = new CacheManager();
    this.idbManager = new IndexedDBManager('my-app', 1);
    this.isOnline = navigator.onLine;

    this.init();
  }

  async init() {
    // 打开IndexedDB
    await this.idbManager.open();

    // 监听网络状态变化
    window.addEventListener('online', () => {
      console.log('[OfflineManager] 网络已连接');
      this.isOnline = true;
      this.syncPendingData();
    });

    window.addEventListener('offline', () => {
      console.log('[OfflineManager] 网络已断开');
      this.isOnline = false;
    });

    // 注册后台同步
    if ('serviceWorker' in navigator && 'sync' in window.registration) {
      // 注册后台同步任务
      navigator.serviceWorker.ready.then(registration => {
        return registration.sync.register('sync-data');
      });
    }
  }

  // 保存数据（支持离线）
  async saveData(key, data) {
    // 保存到IndexedDB
    await this.idbManager.put('data', {
      key,
      data,
      timestamp: Date.now(),
      synced: this.isOnline
    });

    // 如果在线，尝试同步
    if (this.isOnline) {
      await this.syncData(key, data);
    } else {
      // 标记为待同步
      console.log('[OfflineManager] 数据已保存，等待网络恢复后同步');
    }
  }

  // 同步数据到服务器
  async syncData(key, data) {
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, data })
      });

      if (response.ok) {
        // 标记为已同步
        await this.markAsSynced(key);
      }
    } catch (error) {
      console.error('[OfflineManager] 同步失败:', error);
      throw error;
    }
  }

  // 标记数据已同步
  async markAsSynced(key) {
    const allData = await this.idbManager.getAll('data');
    const item = allData.find(d => d.key === key);
    if (item) {
      item.synced = true;
      await this.idbManager.put('data', item);
    }
  }

  // 获取数据
  async getData(key) {
    // 优先从网络获取
    if (this.isOnline) {
      try {
        const response = await fetch(`/api/data/${key}`);
        if (response.ok) {
          const data = await response.json();
          // 缓存到本地
          await this.saveData(key, data);
          return data;
        }
      } catch (error) {
        console.log('[OfflineManager] 网络请求失败，使用本地数据');
      }
    }

    // 返回本地数据
    const allData = await this.idbManager.getAll('data');
    const item = allData.find(d => d.key === key);
    return item ? item.data : null;
  }

  // 同步所有待同步的数据
  async syncPendingData() {
    console.log('[OfflineManager] 开始同步待同步数据');

    const allData = await this.idbManager.getAll('data');
    const pendingItems = allData.filter(d => !d.synced);

    for (const item of pendingItems) {
      try {
        await this.syncData(item.key, item.data);
        console.log(`[OfflineManager] ${item.key} 同步成功`);
      } catch (error) {
        console.error(`[OfflineManager] ${item.key} 同步失败:`, error);
      }
    }
  }

  // 获取网络状态
  getNetworkStatus() {
    return {
      isOnline: this.isOnline,
      effectiveType: navigator.connection?.effectiveType,
      downlink: navigator.connection?.downlink
    };
  }
}
```

---

## 三、小程序架构解析

### 3.1 微信小程序架构

微信小程序是运行在微信客户端内的轻量级应用，使用双线程架构。

```
微信小程序 架构：

┌─────────────────────────────────────────────────────────────┐
│                       微信客户端                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    WebView 渲染层                      │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │                   WXML + WXSS                    │  │  │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐        │  │  │
│  │  │  │  View   │  │  Block  │  │  Slot   │        │  │  │
│  │  │  └─────────┘  └─────────┘  └─────────┘        │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                              │                               │
│                              │ WeixinJSBridge                │
│                              ▼                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   JS 逻辑层 (JavaScriptCore)          │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │                   小程序实例                    │  │  │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐        │  │  │
│  │  │  │   App   │  │  Page   │  │Component│        │  │  │
│  │  │  │ Service │  │ Service │  │ Service │        │  │  │
│  │  │  └─────────┘  └─────────┘  └─────────┘        │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                              │                               │
│                              ▼                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    原生能力层                         │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │  │
│  │  │   微信支付   │  │    分享     │  │   地图     │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**双线程架构特点：**
- 渲染层：WebView组件负责UI渲染
- 逻辑层：独立的JS引擎执行业务逻辑
- 两者通过WeixinJSBridge通信

### 3.2 小程序代码结构

```
小程序项目结构：
├── app.js           # 应用入口
├── app.json         # 应用配置
├── app.wxss         # 全局样式
├── pages/           # 页面目录
│   ├── index/       # 首页
│   │   ├── index.js
│   │   ├── index.wxml
│   │   ├── index.wxss
│   │   └── index.json
│   └── detail/      # 详情页
│       ├── detail.js
│       ├── detail.wxml
│       ├── detail.wxss
│       └── detail.json
├── components/      # 自定义组件
│   └── myComponent/
│       ├── myComponent.js
│       ├── myComponent.wxml
│       ├── myComponent.wxss
│       └── myComponent.json
└── utils/          # 工具函数
    └── request.js
```

```javascript
// app.js - 应用入口
App({
  // 应用生命周期
  onLaunch(options) {
    // 小程序初始化时触发
    console.log('小程序启动', options);
  },

  onShow(options) {
    // 小程序显示时触发
    console.log('小程序显示', options);
  },

  onHide() {
    // 小程序隐藏时触发
    console.log('小程序隐藏');
  },

  onError(error) {
    // 小程序发生错误时触发
    console.error('小程序错误', error);
  },

  // 应用级别的全局数据
  globalData: {
    userInfo: null,
    apiBase: 'https://api.example.com'
  }
});
```

```json
// app.json - 应用配置
{
  // 页面路由
  "pages": [
    "pages/index/index",
    "pages/detail/detail",
    "pages/user/user"
  ],

  // 全局窗口样式
  "window": {
    "navigationBarTitleText": "我的小程序",
    "navigationBarBackgroundColor": "#ffffff",
    "navigationBarTextStyle": "black",
    "backgroundColor": "#f5f5f5",
    "enablePullDownRefresh": false
  },

  // TabBar配置（底部导航栏）
  "tabBar": {
    "color": "#999999",
    "selectedColor": "#1890ff",
    "backgroundColor": "#ffffff",
    "borderStyle": "black",
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "首页",
        "iconPath": "images/home.png",
        "selectedIconPath": "images/home-active.png"
      },
      {
        "pagePath": "pages/user/user",
        "text": "我的",
        "iconPath": "images/user.png",
        "selectedIconPath": "images/user-active.png"
      }
    ]
  },

  // 允许使用的所有组件
  "usingComponents": {
    "myComponent": "/components/myComponent/myComponent"
  },

  // 分包配置（优化加载）
  "subpackages": [
    {
      "root": "pages/detail",
      "pages": ["index"]
    }
  ],

  // 网络超时
  "networkTimeout": {
    "request": 10000,
    "connectSocket": 10000,
    "uploadFile": 10000,
    "downloadFile": 10000
  }
}
```

```javascript
// pages/index/index.js - 页面逻辑
Page({
  // 页面的初始数据
  data: {
    motto: 'Hello World',
    userInfo: {},
    hasUserInfo: false,
    list: [],
    loading: false,
    page: 1,
    pageSize: 10
  },

  // 页面加载时触发
  onLoad(options) {
    console.log('页面加载', options);
    // 可以从URL参数、上一页传入的数据获取信息
    this.loadData();
  },

  // 页面显示时触发
  onShow() {
    console.log('页面显示');
  },

  // 页面渲染完成
  onReady() {
    console.log('页面渲染完成');
  },

  // 页面隐藏时触发
  onHide() {
    console.log('页面隐藏');
  },

  // 页面卸载时触发
  onUnload() {
    console.log('页面卸载');
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({ page: 1, list: [] });
    this.loadData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 上拉加载更多
  onReachBottom() {
    if (!this.data.loading) {
      this.setData({ page: this.data.page + 1 });
      this.loadData();
    }
  },

  // 页面滚动
  onPageScroll(obj) {
    console.log('页面滚动', obj.scrollTop);
  },

  // 分享
  onShareAppMessage(options) {
    const { from, target, targetId } = options;
    return {
      title: '分享标题',
      path: '/pages/index/index',
      imageUrl: '/images/share.png'
    };
  },

  // 加载数据
  async loadData() {
    this.setData({ loading: true });

    try {
      // 使用微信请求API
      const res = await wx.request({
        url: 'https://api.example.com/list',
        data: {
          page: this.data.page,
          pageSize: this.data.pageSize
        },
        method: 'GET'
      });

      if (res.statusCode === 200) {
        this.setData({
          list: [...this.data.list, ...res.data.list],
          loading: false
        });
      }
    } catch (error) {
      console.error('加载失败', error);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 事件处理
  handleTap(e) {
    const { id } = e.currentTarget.dataset;
    // 页面跳转
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  },

  // 跳转到TabBar页面
  goToUser() {
    wx.switchTab({
      url: '/pages/user/user'
    });
  }
});
```

```html
<!-- pages/index/index.wxml - 页面结构 -->
<view class="container">
  <!-- 视图容器 -->
  <view class="header">
    <!-- 文本显示 -->
    <text class="title">{{motto}}</text>

    <!-- 条件渲染 -->
    <view wx:if="{{hasUserInfo}}">
      <image src="{{userInfo.avatarUrl}}" class="avatar"></image>
      <text>{{userInfo.nickName}}</text>
    </view>
    <view wx:else>
      <button open-type="getUserInfo" bindgetuserinfo="getUserInfo">
        获取用户信息
      </button>
    </view>
  </view>

  <!-- 列表渲染 -->
  <view class="list">
    <view
      wx:for="{{list}}"
      wx:key="id"
      class="list-item"
      bindtap="handleTap"
      data-id="{{item.id}}"
    >
      <image src="{{item.image}}" mode="aspectFill"></image>
      <view class="content">
        <text class="title">{{item.title}}</text>
        <text class="desc">{{item.description}}</text>
      </view>
    </view>
  </view>

  <!-- 加载状态 -->
  <view class="loading" wx:if="{{loading}}">
    <text>加载中...</text>
  </view>

  <!-- 空状态 -->
  <view class="empty" wx:if="{{!loading && list.length === 0}}">
    <text>暂无数据</text>
  </view>

  <!-- 原生组件使用 -->
  <map
    id="map"
    longitude="113.324520"
    latitude="23.212994"
    scale="14"
    controls="{{controls}}"
    bindcontroltap="onControlTap"
    markers="{{markers}}"
    bindmarkertap="onMarkerTap"
    style="width: 100%; height: 300px;"
  ></map>

  <!-- Canvas画布 -->
  <canvas
    type="2d"
    id="myCanvas"
    style="width: 300px; height: 200px;"
  ></canvas>
</view>
```

### 3.3 WXS脚本

WXS（WeiXin Script）是微信小程序的一套脚本语言，用于增强WXML的模板能力。

```html
<!-- WXS使用示例 -->
<wxs module="utils">
  // 格式化日期
  function formatDate(timestamp) {
    var date = getDate(timestamp);
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    return year + '-' + formatNum(month) + '-' + formatNum(day);
  }

  // 补零
  function formatNum(num) {
    return num < 10 ? '0' + num : num;
  }

  // 截断文本
  function truncate(str, length) {
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
  }

  // 导出模块
  module.exports = {
    formatDate: formatDate,
    truncate: truncate
  };
</wxs>

<view>
  <!-- 使用WXS函数 -->
  <text>{{utils.formatDate(item.timestamp)}}</text>
  <text>{{utils.truncate(item.title, 20)}}</text>
</view>
```

---

## 四、PWA与小程序对比

### 4.1 技术架构对比

| 对比维度 | PWA | 微信小程序 |
|----------|-----|------------|
| **运行环境** | 浏览器 | 微信客户端 |
| **开发语言** | HTML/CSS/JS | WXML/WXSS/JS |
| **渲染方式** | WebView/Service Worker | 双线程（渲染+逻辑） |
| **发布平台** | Web服务器 | 微信平台审核 |
| **分发渠道** | URL链接/应用商店 | 微信内分享 |
| **安装方式** | 添加到主屏幕 | 下载到微信 |
| **更新方式** | Service Worker | 微信强制更新/静默更新 |
| **离线能力** | 完整离线支持 | 部分离线支持 |
| **权限控制** | 依赖浏览器 | 依赖微信SDK |

### 4.2 功能能力对比

| 功能 | PWA | 微信小程序 |
|------|-----|------------|
| **推送通知** | 完整支持 | 需要微信订阅 |
| **位置获取** | Geolocation API | wx.getLocation |
| **相机** | getUserMedia | wx.chooseImage |
| **文件访问** | File System API | wx.saveFile |
| **支付** | 依赖第三方 | 微信支付API |
| **分享** | Web Share API | 微信分享API |
| **蓝牙** | Web Bluetooth | wx.openBluetoothAdapter |
| **NFC** | Web NFC API | 不支持 |
| **后台同步** | Background Sync | 不支持 |
| **账号登录** | OAuth 2.0 | 微信登录 |

### 4.3 开发体验对比

```javascript
// ===== PWA开发 =====
// 使用标准Web技术
// 无需审核，直接部署
// 可在任何浏览器测试

// 标准Web API
navigator.serviceWorker.register('/sw.js');
navigator.onLine; // 检测网络状态
window.location.reload(); // 刷新页面

// Fetch API进行网络请求
fetch('/api/data')
  .then(res => res.json())
  .then(data => console.log(data));

// IndexedDB存储
const db = await openDatabase('myDB', '1.0', 'My Database', 5 * 1024 * 1024);


// ===== 小程序开发 =====
// 使用微信定制技术
// 需要提交审核发布
// 需要微信开发者工具

// 微信API
wx.serviceModule.register('/service-worker.js'); // 不存在这个API
wx.getNetworkType({ success: res => console.log(res) });
wx.reLaunch({ url: '/pages/index/index' }); // 页面跳转

// 微信请求API
wx.request({
  url: 'https://api.example.com/data',
  success: res => console.log(res.data)
});

// 本地存储
wx.setStorageSync('key', 'value');
const value = wx.getStorageSync('key');
```

### 4.4 用户体验对比

```
用户获取路径对比：

PWA:
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ 用户访问  │───►│  提示安装 │───►│ 添加到桌面│───►│  桌面图标 │
│   URL    │    │  PWA     │    │          │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
     │                                                    │
     │                                                    ▼
     │                                            ┌──────────┐
     │                                            │ 启动应用  │
     └───────────────────────────────────────────►│  体验    │
                                                  └──────────┘

微信小程序:
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  发现小程序│───►│  搜索小程序│───►│  进入小程序│───►│  使用小程序│
│   扫码     │    │   分享     │    │          │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
     │                                                    │
     │◄───────────────────────────────────────────────┤
     │              下次访问（历史记录）                  │
```

---

## 五、选型决策指南

### 5.1 选择PWA的场景

**适合使用PWA：**
- 面向全球用户，不需要特定平台
- 需要SEO优化，希望被搜索引擎收录
- 希望用户通过URL直接访问
- 希望降低发布门槛，快速迭代
- 主要用户使用Chrome/Safari等现代浏览器

```javascript
// PWA最佳实践场景：内容型应用
// 新闻网站、博客、文档站点

// 关键PWA特性：
// 1. Service Worker缓存实现离线访问
// 2. Manifest实现可安装
// 3. 推送通知（可选）

// 示例：新闻阅读应用
class NewsPWA {
  constructor() {
    this.cacheName = 'news-cache-v1';
    this.apiBase = 'https://newsapi.org/v2';
  }

  async init() {
    // 注册Service Worker
    if ('serviceWorker' in navigator) {
      await navigator.serviceWorker.register('/sw.js');
    }

    // 监听网络状态
    window.addEventListener('online', () => this.loadLatestNews());
    window.addEventListener('offline', () => this.showCachedNews());
  }

  async loadLatestNews() {
    try {
      const response = await fetch(`${this.apiBase}/top-headlines`);
      const data = await response.json();
      this.renderNews(data.articles);
      await this.cacheNews(data.articles);
    } catch (error) {
      console.error('加载失败', error);
      this.showCachedNews();
    }
  }

  async cacheNews(articles) {
    // 缓存到IndexedDB
  }

  showCachedNews() {
    // 从IndexedDB读取缓存显示
  }
}
```

### 5.2 选择小程序的场景

**适合使用小程序：**
- 主要面向中国用户
- 需要微信生态的社交分享能力
- 需要微信支付、微信登录等功能
- 希望借助微信平台获取流量
- 需要审核机制保证内容合规

```javascript
// 小程序最佳实践场景：社交/电商/工具类应用

// 关键小程序特性：
// 1. 微信登录获取用户信息
// 2. 微信分享到朋友圈/好友
// 3. 微信支付完成交易
// 4. 附近的小程序发现

// 示例：电商小程序
class ShopMiniProgram {
  async login() {
    // 微信登录
    const { code } = await wx.login();
    // 发送到服务器换取openid
    const res = await wx.request({
      url: '/api/wx-login',
      data: { code }
    });
    this.openid = res.data.openid;
  }

  async requestPayment(orderId, totalFee) {
    // 获取支付参数
    const { paySign, ...params } = await wx.request({
      url: '/api/get-pay-params',
      data: { orderId, totalFee }
    });

    // 调起微信支付
    return new Promise((resolve, reject) => {
      wx.requestPayment({
        ...params,
        paySign,
        success: () => resolve('支付成功'),
        fail: () => reject('支付失败')
      });
    });
  }

  shareToFriends() {
    // 微信分享
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  }
}
```

### 5.3 混合方案

有些场景可以同时使用PWA和小程序，覆盖更多用户。

```javascript
// 混合方案：H5 + 小程序组件

// 在H5页面中判断环境
function getEnvironment() {
  // 小程序环境
  if (typeof wx !== 'undefined' && wx.miniProgram) {
    return 'miniProgram';
  }
  // PWA环境
  if ('serviceWorker' in navigator) {
    return 'pwa';
  }
  // 普通Web
  return 'web';
}

// 根据环境选择不同的API
class UnifiedAPI {
  async share(data) {
    const env = getEnvironment();

    switch (env) {
      case 'miniProgram':
        wx.miniProgram.postMessage({ data });
        break;
      case 'pwa':
        if (navigator.share) {
          await navigator.share(data);
        }
        break;
      default:
        console.log('普通Web环境');
    }
  }

  getUserInfo() {
    const env = getEnvironment();

    switch (env) {
      case 'miniProgram':
        return wx.getUserInfo();
      case 'pwa':
        return new Promise((resolve, reject) => {
          navigator.getUserMedia(
            { video: true },
            resolve,
            reject
          );
        });
      default:
        return null;
    }
  }
}
```

---

## 六、实战技巧

### 6.1 PWA性能优化

```javascript
// PWA性能优化技巧

// 1. 关键资源内联
// 在HTML中直接内联关键CSS和JS

// 2. 资源压缩和合并
// 使用Webpack等工具压缩CSS、JS

// 3. 图片优化
// 使用WebP格式
// 实现图片懒加载

// 4. 预加载关键资源
// <link rel="preload" href="/fonts/custom.woff2" as="font">
// <link rel="prefetch" href="/next-page.html">

// 5. 骨架屏/Loading占位
function showSkeleton() {
  document.getElementById('content').innerHTML = `
    <div class="skeleton">
      <div class="skeleton-header"></div>
      <div class="skeleton-body">
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
      </div>
    </div>
  `;
}

// 6. 使用Intersection Observer实现懒加载
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      observer.unobserve(img);
    }
  });
});

// 7. 使用requestIdleCallback处理非紧急任务
requestIdleCallback(() => {
  // 分析、埋点等非紧急任务
});
```

### 6.2 小程序分包加载

```json
// 分包配置示例
// app.json
{
  "pages": [
    "pages/index/index",
    "pages/user/user"
  ],
  "subpackages": [
    {
      "root": "pages/detail",
      "pages": ["index", "list", "comments"]
    },
    {
      "root": "pages/shop",
      "pages": ["cart", "order", "payment"]
    }
  ],
  "preloadRule": {
    "pages/index/index": {
      "network": "all",
      "packages": ["pages/detail"]
    }
  }
}
```

### 6.3 通用最佳实践

```javascript
// 1. 统一的网络请求封装
class HttpClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(url, options = {}) {
    // 在小程序中
    if (typeof wx !== 'undefined') {
      return new Promise((resolve, reject) => {
        wx.request({
          url: this.baseURL + url,
          ...options,
          success: res => {
            if (res.statusCode === 200) {
              resolve(res.data);
            } else {
              reject(new Error(`请求失败: ${res.statusCode}`));
            }
          },
          fail: reject
        });
      });
    }

    // 在Web/PWA中
    const response = await fetch(this.baseURL + url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`);
    }

    return response.json();
  }

  get(url, params) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`${url}?${queryString}`, { method: 'GET' });
  }

  post(url, data) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}

// 2. 统一的错误处理
function handleError(error, context = '') {
  console.error(`[${context}] 错误:`, error);

  // 显示错误提示
  const message = error.message || '发生错误';

  if (typeof wx !== 'undefined') {
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    });
  } else {
    // Web环境
    alert(message);
  }
}

// 3. 登录状态管理
class AuthManager {
  constructor() {
    this.token = null;
    this.refreshToken = null;
  }

  async ensureAuth() {
    if (this.token) return this.token;

    // 获取token
    if (typeof wx !== 'undefined') {
      // 小程序登录
      const { code } = await wx.login();
      const res = await this.request('/api/wx-login', { code });
      this.token = res.token;
      this.refreshToken = res.refreshToken;
    } else {
      // Web - 检查token
      this.token = localStorage.getItem('token');
    }

    return this.token;
  }

  async refreshAuth() {
    // 刷新token逻辑
  }
}
```

---

## 总结

PWA和小程序都是Web技术的延伸，但面向不同的场景和生态。

**PWA核心特点：**
- 标准化、跨平台、无需审核
- 依赖浏览器能力，受限于浏览器API
- 适合内容型、工具型应用
- 全球分发，URL可访问

**小程序核心特点：**
- 依赖微信生态，需要审核
- 微信专有API，功能丰富
- 适合社交、电商、工具类应用
- 微信内部分发，依赖微信平台

**技术选型建议：**
- 面向全球用户、需要SEO → PWA
- 需要微信支付/登录/分享 → 小程序
- 有能力和资源 → 两者同时支持
- 追求快速迭代、降低门槛 → PWA
- 追求微信流量、社交裂变 → 小程序

无论选择哪种方案，核心都是围绕用户体验，提供稳定、快速、可靠的应用服务。
