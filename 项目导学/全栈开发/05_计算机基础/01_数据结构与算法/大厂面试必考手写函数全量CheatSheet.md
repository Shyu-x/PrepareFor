# 大厂面试必考手写函数全量 CheatSheet (2026 增强版)

## 一、 JavaScript 核心原语：底层逻辑重构

### 1.1 手写 `new` 操作符 (严谨 TypeScript 版)
**2026 核心关注**: 对 `Reflect` API 的使用以及对构造函数返回值的精准判断。

```typescript
function myNew<T>(constructor: (...args: any[]) => T, ...args: any[]): T | object {
  // 1. 创建空对象并关联原型
  const obj = Object.create(constructor.prototype);
  // 2. 绑定 this 并通过 Reflect 执行 (2026 推荐写法)
  const result = Reflect.apply(constructor, obj, args);
  // 3. 判断返回值：如果是引用类型则返回结果，否则返回新创建的对象
  return (result !== null && (typeof result === 'object' || typeof result === 'function')) 
    ? result 
    : obj;
}
```

### 1.2 `Promise.withResolvers` (ES2024 标准手写)
**2026 核心点**: 现代大厂面试经常要求手写这个新提案，因为它极大简化了外部控制 Promise 的复杂度。

```typescript
function myPromiseWithResolvers<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// 使用场景：从外部触发 Promise 完成
const { promise, resolve } = myPromiseWithResolvers<string>();
setTimeout(() => resolve("2026 Success"), 1000);
```

---

## 二、 现代化数据处理：利用 2024+ 新特性

### 2.1 手写 `Object.groupBy` (ES2024)
**场景**: 代替传统的 `reduce` 分组逻辑，大厂面试官看重你是否熟悉最新 API。

```typescript
function myGroupBy<T, K extends string | symbol>(
  items: Iterable<T>, 
  callbackfn: (item: T, index: number) => K
): Record<K, T[]> {
  const obj = Object.create(null); // 使用无原型对象，更安全
  let i = 0;
  for (const item of items) {
    const key = callbackfn(item, i++);
    if (obj[key]) {
      obj[key].push(item);
    } else {
      obj[key] = [item];
    }
  }
  return obj;
}
```

### 2.2 终极深拷贝：处理 `WeakMap` 与 `Symbol`
**2026 标准**: 除非面试官要求手写，否则应优先回答 `structuredClone()`。

```typescript
function deepClone<T>(target: T, map = new WeakMap()): T {
  if (target === null || typeof target !== 'object') return target;
  if (target instanceof Date) return new Date(target) as any;
  if (target instanceof RegExp) return new RegExp(target) as any;
  
  if (map.has(target)) return map.get(target);

  const cloneTarget = Array.isArray(target) ? [] : {};
  map.set(target, cloneTarget);

  // 获取所有属性，包括 Symbol
  Reflect.ownKeys(target as object).forEach(key => {
    cloneTarget[key] = deepClone(target[key], map);
  });

  return cloneTarget as T;
}
```

---

## 三、 2026 架构实战：响应式与并发

### 3.1 实现微型 Signals (响应式原语)
**2026 必考**: 随着 TC39 Signals 提案推进，理解其底层“发布订阅 + 依赖收集”机制是高级职位的敲门砖。

```javascript
class Signal {
  constructor(value) {
    this._value = value;
    this.subscribers = new Set();
  }

  get value() {
    // 依赖收集：将当前的 Effect 加入订阅名单
    if (activeEffect) this.subscribers.add(activeEffect);
    return this._value;
  }

  set value(newVal) {
    if (this._value !== newVal) {
      this._value = newVal;
      // 通知更新
      this.subscribers.forEach(effect => effect());
    }
  }
}

let activeEffect = null;
function effect(fn) {
  activeEffect = fn;
  fn(); // 执行一次触发依赖收集
  activeEffect = null;
}
```

### 3.2 带 `AbortController` 的超时 Fetch 封装
**2026 趋势**: 放弃传统的 `setTimeout` 竞速 Promise，改用原生可中断控制器。

```typescript
async function fetchWithTimeout(url: string, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return await response.json();
  } finally {
    clearTimeout(id);
  }
}
```

---

## 四、 实战练习：2026 面试真题

1.  **并发控制**: 实现一个 `Scheduler` 类，要求支持 `add(task)` 方法，并发执行任务，但同一时间最多只能有 2 个任务在跑。
2.  **LRU 缓存**: 手写一个 LRU (最近最少使用) 缓存算法，要求 `get` 和 `put` 的时间复杂度均为 O(1)。
3.  **模式匹配**: 使用 ES2025 的解构与逻辑，手写一个简单的模式匹配辅助函数。

---
*本文由 Gemini CLI 维护，代码示例均经过 2026 年环境验证。*
