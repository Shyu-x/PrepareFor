# Core Web Vitals 指标详解

## 一、概述

Core Web Vitals（核心网页指标）是 Google 定义的一组关键性能指标，用于衡量网页的用户体验。这些指标直接影响 SEO 排名和用户体验。

### 1.1 三大核心指标

| 指标 | 全称 | 含义 | 良好阈值 | 需改进 | 较差 |
|------|------|------|----------|--------|------|
| **LCP** | Largest Contentful Paint | 最大内容绘制时间 | ≤ 2.5s | 2.5s - 4s | > 4s |
| **INP** | Interaction to Next Paint | 交互到下一次绘制 | ≤ 200ms | 200ms - 500ms | > 500ms |
| **CLS** | Cumulative Layout Shift | 累积布局偏移 | ≤ 0.1 | 0.1 - 0.25 | > 0.25 |

### 1.2 辅助指标

| 指标 | 全称 | 含义 | 良好阈值 |
|------|------|------|----------|
| **FCP** | First Contentful Paint | 首次内容绘制 | ≤ 1.8s |
| **TTFB** | Time to First Byte | 首字节时间 | ≤ 800ms |
| **TTI** | Time to Interactive | 可交互时间 | ≤ 3.8s |
| **FID** | First Input Delay | 首次输入延迟（已弃用） | ≤ 100ms |

---

## 二、LCP（最大内容绘制）

### 2.1 什么是 LCP

LCP 衡量的是视口中最大内容元素渲染的时间。最大内容元素通常是：

- `<img>` 图片元素
- `<video>` 视频元素
- 带有背景图片的块级元素
- 包含文本节点的块级元素

### 2.2 测量 LCP

```typescript
// 使用 PerformanceObserver 测量 LCP
import { onLCP } from 'web-vitals';

// 方式一：使用 web-vitals 库
onLCP((metric) => {
  console.log('LCP:', metric.value, 'ms');
  console.log('LCP 元素:', metric.entries[0].element);
  console.log('LCP URL:', metric.entries[0].url);
  console.log('LCP 资源加载延迟:', metric.entries[0].loadTime);
  
  // 发送到分析服务
  sendToAnalytics({
    name: 'LCP',
    value: metric.value,
    rating: metric.rating, // 'good' | 'needs-improvement' | 'poor'
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
  });
});

// 方式二：使用原生 PerformanceObserver
function measureLCP() {
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    
    console.log('LCP 时间:', lastEntry.startTime);
    console.log('LCP 元素:', lastEntry.element);
    console.log('LCP 大小:', lastEntry.size);
    console.log('LCP URL:', lastEntry.url);
  });
  
  observer.observe({ type: 'largest-contentful-paint', buffered: true });
}

// 在页面加载完成后测量
if ('PerformanceObserver' in window) {
  measureLCP();
}
```

### 2.3 LCP 优化策略

```typescript
// 1. 优化服务器响应时间（TTFB）
// 服务端：使用 CDN、启用缓存、优化数据库查询

// 2. 预加载关键资源
// HTML 中添加预加载标签
/*
<link rel="preload" href="/images/hero.webp" as="image">
<link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin>
*/

// 3. 使用图片占位符避免布局偏移
interface ImageWithPlaceholderProps {
  src: string;
  alt: string;
  width: number;
  height: number;
}

function ImageWithPlaceholder({ src, alt, width, height }: ImageWithPlaceholderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  
  return (
    <div
      style={{
        width,
        height,
        backgroundColor: '#f0f0f0',
        overflow: 'hidden',
      }}
    >
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="eager" // LCP 图片不使用懒加载
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />
    </div>
  );
}

// 4. 内联关键 CSS
// 将首屏关键 CSS 内联到 HTML 中
/*
<style>
  .hero { ... }
  .header { ... }
</style>
*/

// 5. 使用 fetchpriority 提高优先级
/*
<img 
  src="/images/hero.webp" 
  fetchpriority="high" 
  alt="Hero Image"
>
*/
```

### 2.4 LCP 调试工具

```typescript
// 使用 Lighthouse 分析 LCP
// 命令行运行：npx lighthouse https://example.com --view

// 使用 Chrome DevTools
// 1. 打开 DevTools -> Performance 面板
// 2. 点击录制按钮，刷新页面
// 3. 查看 Timings 区域的 LCP 标记

// 使用 web-vitals 获取详细诊断信息
import { onLCP } from 'web-vitals';

onLCP((metric) => {
  const entry = metric.entries[0];
  
  // 分析 LCP 资源加载阶段
  const phases = {
    // 资源加载延迟
    resourceLoadDelay: entry.resourceLoadDelay || 0,
    // 资源加载时间
    resourceLoadTime: entry.resourceLoadTime || 0,
    // 元素渲染延迟
    elementRenderDelay: entry.renderTime || 0,
    // TTFB
    ttfb: entry.loadTime || 0,
  };
  
  console.table(phases);
});
```

---

## 三、INP（交互到下一次绘制）

### 3.1 什么是 INP

INP 是 2024 年新增的核心指标，替代了 FID。它衡量的是用户交互后到页面下一次绘制的延迟时间。

- **计算方式**：取页面整个生命周期中所有交互延迟的最大值（忽略异常值）
- **交互类型**：点击、触摸、键盘输入
- **重要性**：反映页面的响应能力和交互流畅度

### 3.2 测量 INP

```typescript
import { onINP } from 'web-vitals';

// 使用 web-vitals 库测量 INP
onINP((metric) => {
  console.log('INP:', metric.value, 'ms');
  console.log('评级:', metric.rating);
  
  // 获取交互详情
  metric.entries.forEach((entry) => {
    console.log('交互类型:', entry.interactionType);
    console.log('处理时长:', entry.processingDuration);
    console.log('输入延迟:', entry.inputDelay);
    console.log('呈现延迟:', entry.presentationDelay);
  });
  
  // 发送到分析服务
  sendToAnalytics({
    name: 'INP',
    value: metric.value,
    rating: metric.rating,
    interactionType: metric.entries[0]?.interactionType,
  });
});

// 原生 PerformanceObserver 测量
function measureINP() {
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    
    entries.forEach((entry) => {
      if (entry.interactionId) {
        console.log('交互延迟:', {
          duration: entry.duration,
          inputDelay: entry.processingStart - entry.startTime,
          processingDuration: entry.processingEnd - entry.processingStart,
          presentationDelay: entry.duration - (entry.processingEnd - entry.startTime),
        });
      }
    });
  });
  
  observer.observe({ type: 'event', buffered: true, durationThreshold: 16 });
}
```

### 3.3 INP 优化策略

```typescript
// 1. 分解长任务
// ❌ 错误：阻塞主线程的长任务
function processLargeArray(data: any[]) {
  data.forEach(item => {
    // 处理每个项目（可能很耗时）
    processItem(item);
  });
}

// ✅ 正确：使用 requestIdleCallback 或 setTimeout 分解任务
function processLargeArrayOptimized(data: any[], callback: () => void) {
  const BATCH_SIZE = 50;
  let index = 0;
  
  function processBatch() {
    const end = Math.min(index + BATCH_SIZE, data.length);
    
    while (index < end) {
      processItem(data[index]);
      index++;
    }
    
    if (index < data.length) {
      // 让出主线程，处理下一批
      requestIdleCallback(processBatch, { timeout: 100 });
    } else {
      callback();
    }
  }
  
  processBatch();
}

// 2. 使用 Web Worker 处理计算密集型任务
// main.ts
const worker = new Worker('/workers/compute.js');

function heavyComputation(data: any[]): Promise<any> {
  return new Promise((resolve, reject) => {
    worker.onmessage = (e) => resolve(e.data);
    worker.onerror = (e) => reject(e.error);
    worker.postMessage(data);
  });
}

// workers/compute.js
self.onmessage = (e) => {
  const result = heavyCalculation(e.data);
  self.postMessage(result);
};

function heavyCalculation(data: any[]) {
  // 执行复杂计算
  return data.map(item => {
    // ... 计算逻辑
    return processedItem;
  });
}

// 3. 优化事件处理函数
// ❌ 错误：同步处理大量数据
function handleSearch(event: React.ChangeEvent<HTMLInputElement>) {
  const query = event.target.value;
  const results = largeDataArray.filter(item => 
    item.name.includes(query)
  );
  setResults(results);
}

// ✅ 正确：使用防抖 + 虚拟列表
import { useMemo, useCallback, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

function SearchComponent({ data }: { data: any[] }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  // 防抖处理
  const debouncedSetQuery = useDebouncedCallback(
    (value: string) => setDebouncedQuery(value),
    300
  );
  
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value);
    debouncedSetQuery(value);
  }, [debouncedSetQuery]);
  
  // 使用 useMemo 缓存过滤结果
  const results = useMemo(() => {
    if (!debouncedQuery) return [];
    return data.filter(item => 
      item.name.toLowerCase().includes(debouncedQuery.toLowerCase())
    );
  }, [data, debouncedQuery]);
  
  return (
    <div>
      <input value={query} onChange={handleChange} />
      <VirtualList items={results} />
    </div>
  );
}

// 4. 使用 scheduler.yield()（实验性 API）
async function processWithYield(tasks: (() => void)[]) {
  for (const task of tasks) {
    task();
    // 让出主线程
    if ('scheduler' in window && 'yield' in scheduler) {
      await (scheduler as any).yield();
    } else {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
}
```

### 3.4 React 中的 INP 优化

```typescript
// 1. 使用 useTransition 处理非紧急更新
import { useState, useTransition } from 'react';

function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();
  
  const handleSearch = (value: string) => {
    // 紧急更新：立即更新输入框
    setQuery(value);
    
    // 非紧急更新：延迟更新搜索结果
    startTransition(() => {
      const filtered = filterResults(value);
      setResults(filtered);
    });
  };
  
  return (
    <div>
      <input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
      />
      {isPending ? <Spinner /> : <ResultsList results={results} />}
    </div>
  );
}

// 2. 使用 useDeferredValue 延迟渲染
import { useState, useDeferredValue, useMemo } from 'react';

function SearchPage({ data }: { data: any[] }) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  
  // 使用延迟值进行计算
  const results = useMemo(() => {
    return data.filter(item => 
      item.name.toLowerCase().includes(deferredQuery.toLowerCase())
    );
  }, [data, deferredQuery]);
  
  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <ResultsList results={results} />
    </div>
  );
}

// 3. 避免在渲染函数中进行复杂计算
// ❌ 错误
function BadComponent({ items }: { items: any[] }) {
  // 每次渲染都会重新排序
  const sortedItems = items.sort((a, b) => a.name.localeCompare(b.name));
  
  return <List items={sortedItems} />;
}

// ✅ 正确
function GoodComponent({ items }: { items: any[] }) {
  // 使用 useMemo 缓存计算结果
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);
  
  return <List items={sortedItems} />;
}
```

---

## 四、CLS（累积布局偏移）

### 4.1 什么是 CLS

CLS 衡量的是页面整个生命周期中发生的所有意外布局偏移的总和。布局偏移发生在：

- 图片加载导致元素位置变化
- 字体加载导致文本跳动
- 动态插入内容导致元素移动
- 尺寸未知的嵌入内容

### 4.2 测量 CLS

```typescript
import { onCLS } from 'web-vitals';

// 使用 web-vitals 库测量 CLS
onCLS((metric) => {
  console.log('CLS:', metric.value);
  console.log('评级:', metric.rating);
  
  // 获取布局偏移详情
  metric.entries.forEach((entry) => {
    if (entry.hadRecentInput) return; // 忽略用户输入导致的偏移
    
    console.log('偏移值:', entry.value);
    console.log('偏移源:', entry.sources);
    
    entry.sources.forEach((source) => {
      console.log('元素:', source.node);
      console.log('当前矩形:', source.currentRect);
      console.log('之前矩形:', source.previousRect);
    });
  });
});

// 原生 PerformanceObserver 测量
function measureCLS() {
  let clsValue = 0;
  const entries: LayoutShift[] = [];
  
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries() as LayoutShift[]) {
      // 忽略用户交互导致的偏移
      if (entry.hadRecentInput) continue;
      
      clsValue += entry.value;
      entries.push(entry);
      
      console.log('布局偏移:', {
        value: entry.value,
        sources: entry.sources.map(s => ({
          node: s.node,
          currentRect: s.currentRect,
          previousRect: s.previousRect,
        })),
      });
    }
    
    console.log('累积 CLS:', clsValue);
  });
  
  observer.observe({ type: 'layout-shift', buffered: true });
}

interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
  sources: Array<{
    node: Element;
    currentRect: DOMRect;
    previousRect: DOMRect;
  }>;
}
```

### 4.3 CLS 优化策略

```typescript
// 1. 为图片和视频设置尺寸属性
// ❌ 错误：未设置尺寸
/*
<img src="/images/hero.jpg" alt="Hero">
<video src="/video/intro.mp4"></video>
*/

// ✅ 正确：设置尺寸属性
/*
<img 
  src="/images/hero.jpg" 
  alt="Hero" 
  width="800" 
  height="600"
  style="aspect-ratio: 800/600;"
>
<video 
  src="/video/intro.mp4" 
  width="800" 
  height="450"
></video>
*/

// 2. 使用 aspect-ratio CSS 属性
interface ResponsiveImageProps {
  src: string;
  alt: string;
  aspectRatio: string; // 如 "16/9"
}

function ResponsiveImage({ src, alt, aspectRatio }: ResponsiveImageProps) {
  return (
    <div style={{ aspectRatio, backgroundColor: '#f0f0f0' }}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </div>
  );
}

// 使用示例
<ResponsiveImage 
  src="/images/hero.jpg" 
  alt="Hero" 
  aspectRatio="16/9" 
/>

// 3. 预留广告位空间
function AdPlaceholder() {
  return (
    <div 
      style={{ 
        width: '100%', 
        minHeight: '250px', // 预留广告高度
        backgroundColor: '#f5f5f5',
      }}
    >
      <span>广告位</span>
    </div>
  );
}

// 4. 字体加载优化
// 使用 font-display: swap 避免字体加载导致的布局偏移
/*
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter.woff2') format('woff2');
  font-display: swap;
}
*/

// 使用 CSS Font Loading API 预加载字体
async function loadFont() {
  const font = new FontFace(
    'Inter',
    'url(/fonts/inter.woff2)',
    { weight: '400', style: 'normal' }
  );
  
  // 等待字体加载
  await font.load();
  document.fonts.add(font);
  document.documentElement.classList.add('font-loaded');
}

// 5. 使用 CSS containment 隔离布局
/*
.card {
  contain: layout;
}
*/

// 6. 避免在已渲染内容上方插入内容
// ❌ 错误：在顶部插入内容
function BadNotification() {
  useEffect(() => {
    // 这会导致整个页面内容下移
    const notification = document.createElement('div');
    notification.className = 'notification';
    document.body.insertBefore(notification, document.body.firstChild);
  }, []);
  
  return null;
}

// ✅ 正确：使用固定定位或预留空间
function GoodNotification() {
  return (
    <div 
      className="notification"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}
    >
      通知内容
    </div>
  );
}

// 或者预留空间
function PageWithNotification() {
  const [showNotification, setShowNotification] = useState(true);
  
  return (
    <div>
      {/* 预留通知空间 */}
      <div style={{ minHeight: showNotification ? '48px' : '0' }}>
        {showNotification && (
          <div className="notification">通知内容</div>
        )}
      </div>
      <main>页面内容</main>
    </div>
  );
}
```

### 4.4 CLS 调试工具

```typescript
// Chrome DevTools 调试 CLS
// 1. 打开 DevTools -> Performance 面板
// 2. 勾选 "Web Vitals" 复选框
// 3. 录制页面加载和交互
// 4. 查看 Layout Shift 区域

// 使用 Layout Instability API 监控
function setupCLSMonitoring() {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries() as LayoutShift[]) {
      if (entry.hadRecentInput) continue;
      
      // 高亮导致偏移的元素
      entry.sources.forEach((source) => {
        const element = source.node;
        element.style.outline = '2px solid red';
        
        console.log('布局偏移元素:', {
          tagName: element.tagName,
          id: element.id,
          className: element.className,
          shift: entry.value,
        });
        
        // 3秒后移除高亮
        setTimeout(() => {
          element.style.outline = '';
        }, 3000);
      });
    }
  });
  
  observer.observe({ type: 'layout-shift', buffered: true });
}

// 在开发环境启用
if (process.env.NODE_ENV === 'development') {
  setupCLSMonitoring();
}
```

---

## 五、辅助指标详解

### 5.1 FCP（首次内容绘制）

```typescript
import { onFCP } from 'web-vitals';

onFCP((metric) => {
  console.log('FCP:', metric.value, 'ms');
  console.log('评级:', metric.rating);
});

// FCP 优化策略
// 1. 内联关键 CSS
// 2. 移除阻塞渲染的资源
// 3. 使用 preload 预加载关键资源
// 4. 减少服务器响应时间
```

### 5.2 TTFB（首字节时间）

```typescript
import { onTTFB } from 'web-vitals';

onTTFB((metric) => {
  console.log('TTFB:', metric.value, 'ms');
  console.log('评级:', metric.rating);
});

// TTFB 优化策略
// 1. 使用 CDN
// 2. 启用服务器缓存
// 3. 优化数据库查询
// 4. 使用服务端渲染（SSR）
// 5. 使用流式响应
```

### 5.3 TTI（可交互时间）

```typescript
// TTI 测量（需要使用 polyfill）
import { onTTI } from 'web-vitals';

onTTI((metric) => {
  console.log('TTI:', metric.value, 'ms');
});

// TTI 优化策略
// 1. 减少 JavaScript 体积
// 2. 代码分割
// 3. 移除未使用的代码
// 4. 延迟加载非关键脚本
```

---

## 六、性能监控实现

### 6.1 完整的性能监控方案

```typescript
// performance-monitor.ts
import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
    this.init();
  }

  private init() {
    // 注册所有核心指标监听
    onLCP(this.handleMetric.bind(this));
    onINP(this.handleMetric.bind(this));
    onCLS(this.handleMetric.bind(this));
    onFCP(this.handleMetric.bind(this));
    onTTFB(this.handleMetric.bind(this));

    // 监听页面卸载，发送数据
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.sendMetrics();
      }
    });

    // 备用：使用 pagehide 事件
    window.addEventListener('pagehide', () => {
      this.sendMetrics();
    });
  }

  private handleMetric(metric: any) {
    const performanceMetric: PerformanceMetric = {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
      timestamp: Date.now(),
    };

    this.metrics.push(performanceMetric);

    // 如果指标较差，立即上报
    if (metric.rating === 'poor') {
      this.sendMetric(performanceMetric);
    }
  }

  private sendMetric(metric: PerformanceMetric) {
    const body = JSON.stringify({
      ...metric,
      url: window.location.href,
      userAgent: navigator.userAgent,
      connection: (navigator as any).connection?.effectiveType,
    });

    // 使用 sendBeacon 确保数据发送
    if (navigator.sendBeacon) {
      navigator.sendBeacon(this.endpoint, body);
    } else {
      fetch(this.endpoint, {
        method: 'POST',
        body,
        keepalive: true,
      });
    }
  }

  private sendMetrics() {
    if (this.metrics.length === 0) return;

    const body = JSON.stringify({
      metrics: this.metrics,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(this.endpoint, body);
    } else {
      fetch(this.endpoint, {
        method: 'POST',
        body,
        keepalive: true,
      });
    }

    this.metrics = [];
  }

  // 获取当前指标
  getMetrics() {
    return [...this.metrics];
  }

  // 获取特定指标
  getMetric(name: string) {
    return this.metrics.find(m => m.name === name);
  }
}

// 初始化监控
const monitor = new PerformanceMonitor('/api/analytics/performance');

// 导出供其他模块使用
export { PerformanceMonitor };
```

### 6.2 自定义性能标记

```typescript
// 使用 User Timing API 进行自定义性能测量
class PerformanceTracker {
  private marks: Map<string, number> = new Map();

  // 开始标记
  start(name: string) {
    this.marks.set(name, performance.now());
    performance.mark(`${name}-start`);
  }

  // 结束标记
  end(name: string) {
    const startTime = this.marks.get(name);
    if (startTime === undefined) {
      console.warn(`未找到标记: ${name}`);
      return;
    }

    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);

    const duration = performance.now() - startTime;
    this.marks.delete(name);

    return duration;
  }

  // 测量异步函数执行时间
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.start(name);
    try {
      const result = await fn();
      const duration = this.end(name);
      console.log(`${name} 耗时: ${duration?.toFixed(2)}ms`);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  // 获取所有测量结果
  getMeasures() {
    return performance.getEntriesByType('measure');
  }

  // 清除所有标记
  clear() {
    performance.clearMarks();
    performance.clearMeasures();
    this.marks.clear();
  }
}

// 使用示例
const tracker = new PerformanceTracker();

// 测量同步操作
tracker.start('data-processing');
processData();
tracker.end('data-processing');

// 测量异步操作
await tracker.measure('api-request', async () => {
  const response = await fetch('/api/data');
  return response.json();
});

// 测量 React 组件渲染
function usePerformanceTracking(componentName: string) {
  useEffect(() => {
    tracker.start(`render-${componentName}`);
    return () => {
      const duration = tracker.end(`render-${componentName}`);
      if (duration && duration > 16) {
        console.warn(`${componentName} 渲染时间过长: ${duration.toFixed(2)}ms`);
      }
    };
  });
}
```

---

## 七、性能预算

### 7.1 设置性能预算

```typescript
// performance-budget.ts
interface PerformanceBudget {
  metric: string;
  good: number;
  needsImprovement: number;
  poor: number;
}

const PERFORMANCE_BUDGETS: PerformanceBudget[] = [
  { metric: 'LCP', good: 2500, needsImprovement: 4000, poor: 4000 },
  { metric: 'INP', good: 200, needsImprovement: 500, poor: 500 },
  { metric: 'CLS', good: 0.1, needsImprovement: 0.25, poor: 0.25 },
  { metric: 'FCP', good: 1800, needsImprovement: 3000, poor: 3000 },
  { metric: 'TTFB', good: 800, needsImprovement: 1800, poor: 1800 },
];

// 检查性能预算
function checkPerformanceBudget(metric: string, value: number) {
  const budget = PERFORMANCE_BUDGETS.find(b => b.metric === metric);
  if (!budget) return;

  if (value <= budget.good) {
    console.log(`✅ ${metric}: ${value} - 良好`);
  } else if (value <= budget.needsImprovement) {
    console.warn(`⚠️ ${metric}: ${value} - 需改进`);
  } else {
    console.error(`❌ ${metric}: ${value} - 较差`);
  }
}

// 资源大小预算
const RESOURCE_BUDGETS = {
  javascript: 300 * 1024, // 300KB
  css: 100 * 1024, // 100KB
  images: 500 * 1024, // 500KB
  fonts: 50 * 1024, // 50KB
  total: 1000 * 1024, // 1MB
};

// 检查资源大小
function checkResourceBudget() {
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  const sizes = {
    javascript: 0,
    css: 0,
    images: 0,
    fonts: 0,
    total: 0,
  };

  resources.forEach((resource) => {
    const size = resource.transferSize || 0;
    sizes.total += size;

    if (resource.initiatorType === 'script') {
      sizes.javascript += size;
    } else if (resource.initiatorType === 'css') {
      sizes.css += size;
    } else if (resource.initiatorType === 'img') {
      sizes.images += size;
    } else if (resource.initiatorType === 'font') {
      sizes.fonts += size;
    }
  });

  // 检查是否超出预算
  Object.entries(sizes).forEach(([type, size]) => {
    const budget = RESOURCE_BUDGETS[type as keyof typeof RESOURCE_BUDGETS];
    if (budget && size > budget) {
      console.warn(`⚠️ ${type} 超出预算: ${(size / 1024).toFixed(2)}KB / ${(budget / 1024).toFixed(2)}KB`);
    }
  });

  return sizes;
}
```

### 7.2 构建时性能预算

```javascript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['lodash', 'dayjs'],
        },
      },
    },
    // 设置 chunk 大小警告阈值
    chunkSizeWarningLimit: 500,
  },
});

// webpack.config.js - 性能预算配置
module.exports = {
  performance: {
    hints: 'warning',
    maxEntrypointSize: 300 * 1024, // 300KB
    maxAssetSize: 200 * 1024, // 200KB
    assetFilter: (assetFilename) => {
      return !/\.map$/.test(assetFilename);
    },
  },
};

// 使用 bundlesize 进行 CI 检查
// package.json
/*
{
  "bundlesize": [
    {
      "path": "./dist/assets/*.js",
      "maxSize": "300 kB"
    },
    {
      "path": "./dist/assets/*.css",
      "maxSize": "100 kB"
    }
  ]
}
*/
```

---

## 八、面试高频问题

### 问题 1：什么是 Core Web Vitals？为什么它们很重要？

**答案：**

Core Web Vitals 是 Google 定义的一组核心网页性能指标，用于衡量用户体验质量。包括三个核心指标：

1. **LCP（最大内容绘制）**：衡量加载性能，目标 ≤ 2.5s
2. **INP（交互到下一次绘制）**：衡量交互性，目标 ≤ 200ms
3. **CLS（累积布局偏移）**：衡量视觉稳定性，目标 ≤ 0.1

**重要性：**
- 直接影响 SEO 排名（Google 搜索排名因素）
- 影响用户体验和转化率
- 提供可量化的性能目标
- 帮助开发者关注用户感知的性能

### 问题 2：如何优化 LCP？

**答案：**

LCP 优化策略：

1. **优化服务器响应时间**
   - 使用 CDN 缩短物理距离
   - 启用服务器缓存
   - 优化数据库查询

2. **预加载关键资源**
   ```html
   <link rel="preload" href="/images/hero.webp" as="image">
   <link rel="preload" href="/fonts/main.woff2" as="font" crossorigin>
   ```

3. **优化图片**
   - 使用现代格式（WebP、AVIF）
   - 压缩图片
   - 为 LCP 图片禁用懒加载

4. **内联关键 CSS**
   - 将首屏 CSS 内联到 HTML
   - 异步加载非关键 CSS

5. **使用 fetchpriority**
   ```html
   <img src="/images/hero.webp" fetchpriority="high">
   ```

### 问题 3：INP 和 FID 有什么区别？

**答案：**

| 特性 | FID | INP |
|------|-----|-----|
| 测量内容 | 首次输入延迟 | 所有交互的响应时间 |
| 计算方式 | 单次测量 | 取最大值（忽略异常） |
| 交互类型 | 仅首次点击 | 点击、触摸、键盘 |
| 状态 | 已弃用 | 2024 年成为核心指标 |

INP 更全面地反映了页面整个生命周期的交互响应能力，而 FID 只测量首次交互。

### 问题 4：如何减少 CLS？

**答案：**

1. **为图片和视频设置尺寸**
   ```html
   <img src="image.jpg" width="800" height="600">
   ```

2. **使用 aspect-ratio**
   ```css
   .image-container {
     aspect-ratio: 16/9;
   }
   ```

3. **预留广告位空间**
   ```css
   .ad-slot {
     min-height: 250px;
   }
   ```

4. **字体加载优化**
   ```css
   @font-face {
     font-family: 'Inter';
     font-display: swap;
   }
   ```

5. **避免在已渲染内容上方插入内容**
   - 使用固定定位
   - 预留空间

### 问题 5：如何在 React 项目中实现性能监控？

**答案：**

```typescript
import { onLCP, onINP, onCLS } from 'web-vitals';

// 1. 初始化监控
class PerformanceMonitor {
  constructor() {
    onLCP(this.sendMetric);
    onINP(this.sendMetric);
    onCLS(this.sendMetric);
  }

  private sendMetric(metric: any) {
    navigator.sendBeacon('/api/analytics', JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      url: window.location.href,
    }));
  }
}

// 2. 使用 React Profiler
import { Profiler } from 'react';

function onRenderCallback(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number
) {
  console.log(`${id} ${phase} 耗时: ${actualDuration}ms`);
}

<Profiler id="App" onRender={onRenderCallback}>
  <App />
</Profiler>

// 3. 使用自定义 Hook
function usePerformanceTracking(componentName: string) {
  useEffect(() => {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      if (duration > 16) {
        console.warn(`${componentName} 渲染时间过长`);
      }
    };
  });
}
```

### 问题 6：什么是性能预算？如何实施？

**答案：**

性能预算是为关键指标设定的目标值，用于确保网站性能不退化。

**实施方式：**

1. **设定预算值**
   ```javascript
   const budgets = {
     LCP: 2500, // ms
     INP: 200, // ms
     CLS: 0.1,
     JS: 300 * 1024, // bytes
   };
   ```

2. **构建时检查**
   ```javascript
   // webpack.config.js
   module.exports = {
     performance: {
       maxEntrypointSize: 300 * 1024,
       hints: 'warning',
     },
   };
   ```

3. **运行时监控**
   ```typescript
   onLCP((metric) => {
     if (metric.value > budgets.LCP) {
       reportToAnalytics('budget-exceeded', metric);
     }
   });
   ```

4. **CI/CD 集成**
   - 使用 Lighthouse CI
   - 使用 bundlesize 检查
   - 设置 PR 检查

---

## 九、总结

### 核心要点

1. **Core Web Vitals 是用户体验的核心指标**
   - LCP 衡量加载性能
   - INP 衡量交互响应
   - CLS 衡量视觉稳定性

2. **持续监控是关键**
   - 使用 web-vitals 库收集数据
   - 建立性能预算
   - 集成到 CI/CD 流程

3. **优化是持续的过程**
   - 定期审计性能
   - 关注真实用户数据
   - 持续改进

### 最佳实践

1. **加载优化**
   - 预加载关键资源
   - 代码分割
   - 图片优化

2. **交互优化**
   - 分解长任务
   - 使用 Web Worker
   - 合理使用防抖节流

3. **布局优化**
   - 设置元素尺寸
   - 预留空间
   - 优化字体加载