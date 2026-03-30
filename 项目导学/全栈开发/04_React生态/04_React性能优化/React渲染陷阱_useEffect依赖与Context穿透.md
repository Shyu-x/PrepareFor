# React 渲染陷阱：useEffect 依赖浅比较与 Context 穿透深度解析 (2026版)

## 1. 概述：为什么面试官总爱问 `useEffect`？

在 React 面试中，`useEffect` 的依赖数组（Dependency Array）是最经典的“钓鱼题”。表面上看，它只是一个数组，但在底层，它牵扯到 JavaScript 的内存分配、Fiber 架构的协调（Reconciliation）以及不可变数据（Immutability）的哲学。

本篇指南将从 `Object.is()` 的底层源码出发，详细拆解依赖比较的边缘情况，并探讨大厂常考的 **Context 穿透** 难题。

---

## 2. `useEffect` 依赖数组的默认行为：浅比较之殇

### 2.1 底层算法：`areHookInputsEqual`
当你向 `useEffect` 传递 `[user, options]` 时，React 不会去深度遍历这些对象的属性。
在 React 源码的 `react-reconciler` 中，依赖比较的核心是：
```javascript
function areHookInputsEqual(nextDeps, prevDeps) {
  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    // 关键：使用 Object.is 进行全等比较
    if (Object.is(nextDeps[i], prevDeps[i])) {
      continue;
    }
    return false; // 一旦发现内存地址不同，立刻判定依赖改变
  }
  return true;
}
```

### 2.2 面试经典陷阱 1：内联对象/数组导致死循环
```jsx
// ❌ 灾难代码：无限重渲染
function SearchUser() {
  const [data, setData] = useState(null);
  
  // 陷阱：每次组件重新执行，都会在堆内存中 new 一个新对象
  // 它的内存地址每次都在变！
  const searchParams = { role: 'admin', active: true };

  useEffect(() => {
    fetchData(searchParams).then(setData);
  }, [searchParams]); // Object.is(旧地址, 新地址) 永远返回 false
}
```
**解决方案**：
1. **静态提升**：把 `searchParams` 移到组件外部。
2. **打平依赖**：如果只需要部分属性，直接依赖基础数据类型 `[searchParams.role, searchParams.active]`（因为字符串的 `Object.is` 是按值比较的）。
3. **React 19 编译器**：如果你启用了 React Compiler，它会在底层自动将其转化为 `useMemo`，死循环会在编译期被消灭。

### 2.3 面试经典陷阱 2：隐蔽的函数重造
```jsx
// ❌ 也是死循环
function Chat() {
  const [messages, setMessages] = useState([]);

  // 每次渲染，内存中产生一个新的闭包函数地址
  const fetchMessages = () => {
    api.getMessages().then(setMessages);
  };

  useEffect(() => {
    const timer = setInterval(fetchMessages, 1000);
    return () => clearInterval(timer);
  }, [fetchMessages]); // 函数地址每次不同，导致定时器疯狂重启
}
```
**解决方案**：使用 `useCallback` 包裹，或利用 **最新引用 Ref (Latest Ref Pattern)** 将函数储存在 `useRef` 的 `current` 中绕过闭包限制。

---

## 3. 高阶架构难题：Context 穿透 (Context Penetration)

这是高级前端面试的必考题。

### 3.1 什么是 Context 穿透？
React Context 的设计初衷是为了解决 Prop Drilling（属性逐层传递）。
但是，**只要 Context Provider 的 `value` 发生了变化，所有消费了该 Context（使用了 `useContext`）的组件，无论是否被 `React.memo` 包裹，都会被强制重新渲染。** 这种无视 `memo` 防线的强制更新，被称为“Context 穿透”。

### 3.2 致命场景
```jsx
const AppContext = createContext();

function App() {
  const [theme, setTheme] = useState('light');
  const [user, setUser] = useState({ name: 'Alice' });

  // ❌ 极度危险：每次 theme 改变，都会生成一个全新的 { theme, user } 对象
  return (
    <AppContext.Provider value={{ theme, user }}>
      <HeavySidebar />      {/* 消费了 theme，理应更新 */}
      <UserProfileMemo />   {/* 只消费了 user，但因为 value 对象地址变了，它也被强制拉下水！ */}
    </AppContext.Provider>
  );
}
```
由于 `value` 对象的内存地址每次 Render 都会改变，`UserProfileMemo` 虽然用了 `React.memo`，依然会被击穿，导致严重的性能回退。

### 3.3 2026 年大厂终极解法

1. **多 Context 拆分 (Context Splitting)**：
   将变动频率高的状态和低的状态分开放置。
   ```jsx
   <ThemeContext.Provider value={theme}>
     <UserContext.Provider value={user}>
       {children}
     </UserContext.Provider>
   </ThemeContext.Provider>
   ```
2. **Context Selectors (TC39 提案级别/Zustand 替代)**：
   在纯 React 中，最好的办法是放弃使用 Context 存储复杂状态，直接使用 **Zustand**。因为 Zustand 底层使用 `useSyncExternalStore` 和 Selector 进行严格的 `===` 比较，天然免疫 Context 穿透。
3. **React Compiler 的自动拆分**：
   在 React 19 中，Compiler 会尽可能地在编译时将 `value` 对象的生成逻辑用缓存数组包裹起来，但如果其中的 `theme` 依然在变，穿透仍然会发生。此时，拥抱原子化状态 (Jotai) 或外部 Store 是正解。

---
*本文档持续更新，最后更新于 2026 年 3 月*