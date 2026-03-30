# React Hooks 深度命题：从 useWindowSize 看设计哲学与 2026 实战

## 一、 命题引入：设计一个获取界面宽度 (Width) 的 Hook

在初级面试中，面试官可能会让你写一个获取窗口宽度的 Hook。大多数人会直接写出基于 `useEffect` 的版本。但在 2026 年的中高级全栈开发中，我们需要考虑 **SSR 水合一致性**、**Concurrent Mode 并发安全**以及**浏览器原生 API 性能**。

### 1.1 经典实现 (不推荐方案及其缺陷)

```tsx
// ❌ 存在问题的实现
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return width;
}
```

**缺陷分析：**
1.  **SSR 崩溃**：在服务端渲染时 `window` 是 undefined，导致报错。
2.  **水合抖动 (Hydration Mismatch)**：服务端渲染的宽度（如 0 或默认值）与客户端真实的宽度不一致，导致初次渲染闪烁。
3.  **性能瓶颈**：高频触发 `resize` 事件会频繁触发 `setState` 导致 React 树的全量 Diff。

### 1.2 2026 最佳实践：基于 `useSyncExternalStore`

在 React 19 中，官方推荐使用 `useSyncExternalStore` 来订阅外部数据源。它天然解决了并发渲染时的“撕裂”问题，并简化了订阅逻辑。

```tsx
/**
 * 2026 工业级实现：useWindowSize
 * 特点：SSR 安全、并发安全、自动解耦
 */
import { useSyncExternalStore } from 'react';

// 1. 定义订阅逻辑
const subscribe = (callback: () => void) => {
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
};

// 2. 定义快照获取逻辑
const getSnapshot = () => window.innerWidth;

// 3. 定义服务端渲染快照（关键：防止 Hydration Mismatch）
const getServerSnapshot = () => 1200; // 返回一个基准宽度或 0

export function useWindowWidth() {
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
}
```

---

## 二、 深度解读：Hooks 到底是什么？

### 2.1 Hooks 的本质：代数效应 (Algebraic Effects)
Hooks 并不是简单的“特殊函数”，它是**代数效应**在 JavaScript 中的近似实现。

- **Class 时代**：组件是一个“生物”，它自己持有状态（`this.state`），并随着生命周期（`componentDidMount`）呼吸。
- **Hooks 时代**：组件是一个“投影仪”，它是一个纯函数。当它需要状态时，它向 React 引擎发起一个“请求”（Call Hook）。React 引擎作为外部环境，负责寻找并返回该状态。

### 2.2 React 为什么要这么写？ (Rationale)

1.  **逻辑复用的“扁平化”**：
    以前复用逻辑用 HOC（高阶组件），会导致 DOM 树嵌套几十层。Hooks 允许我们将逻辑拆分为独立的函数（自定义 Hooks），在组件内像积木一样平铺组合。
2.  **解决闭包陷阱与一致性**：
    函数组件通过**闭包 (Closure)** 捕获了单次渲染的所有 Props 和 State。这确保了在异步操作（如 `setTimeout`）中，UI 始终反映的是“操作发起时”的状态，这对于**并发渲染 (Concurrent Rendering)** 至关重要。
3.  **拥抱函数式编程 (FP)**：
    Hooks 让 UI 逻辑回归到 `UI = f(state)` 的本质，极大地提升了可测试性。

---

## 三、 练手习题：进阶设计挑战

### 习题 1：实现 `useIntersectionObserver`
**要求**：
- 支持传入 `rootMargin` 和 `threshold`。
- 必须支持 React 19 的 Ref 作为 regular prop 的特性。
- **核心难点**：如何确保当目标 DOM 节点动态改变时，Observer 能够自动重新绑定？

### 习题 2：封装 `useThrottledValue`
**要求**：
- 不允许使用 `setTimeout`，请尝试使用 2026 年普及的 `requestIdleCallback` 或 React 19 的 `useDeferredValue` 实现。
- **思考**：为什么在某些高频输入场景下，`useDeferredValue` 优于传统的 Throttle 函数？

---

## 四、 2026 实战项目：自研高性能监控可视化 Hook 库

**背景**：你需要为公司开发一套大屏监控系统，需要处理每秒 100 次的传感器数据更新。

### 4.1 技术方案设计
1.  **数据流隔离**：使用 **Signals** 管理高频传感器数据，避免 React 渲染频率上限。
2.  **可视化适配**：
    - 开发 `useResponsiveCanvas`：自动根据 `useWindowWidth` 计算 Canvas 像素比（DPR），防止模糊。
    - 结合 `useSyncExternalStore` 订阅消息队列 (Web Worker)。

### 4.2 核心代码：`useResponsiveCanvas`

```tsx
export function useResponsiveCanvas(ref: React.RefObject<HTMLCanvasElement>) {
  const width = useWindowWidth();
  
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // 设置逻辑大小与物理大小，防止高分屏模糊
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    const ctx = canvas.getContext('2d');
    ctx?.scale(dpr, dpr);
    
    // 触发重新绘制
    draw(ctx);
  }, [width]); // 仅在宽度变化时重新调整
}
```

---

## 五、 总结与工程师思考

一个优秀的 React 工程师在写 Hooks 时，脑中应该有三层模型：
1.  **UI 层**：这个 Hook 返回的数据如何直接映射到屏幕？
2.  **状态层**：这个 Hook 依赖了哪些闭包变量？是否会产生脏读？
3.  **环境层**：这个 Hook 在服务器端（Node.js）如何表现？在并发渲染下是否安全？

Hooks 的引入不是为了让代码更短，而是为了让逻辑更**透明**、更**可预测**。

---
*本文档由 Gemini CLI 高级研究员维护，最后更新于 2026年3月*
