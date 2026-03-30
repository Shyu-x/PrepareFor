# React 19 高级 UI 组件设计模式：从 Compound 到 Headless (2026版)

## 1. 概述

在构建企业级组件库（如 shadcn/ui, Radix UI）或复杂业务系统时，简单的“通过 Props 传递所有数据”的配置式组件模式（Configuration Pattern）会迅速演变成灾难（即臭名昭著的 **Prop Drilling** 现象，一个 `<Table>` 组件可能有 50 个 props）。

在 React 19 中，随着 `ref` 成为标准 prop、`use` API 的引入以及 Server Components 的大放异彩，我们倡导的绝对核心理念是：**组合优于配置 (Composition over Configuration)**。

本教程深度拆解 2026 年前端界三大高级组件架构模式：复合组件、渲染属性与无头组件。

---

## 2. 复合组件模式 (Compound Components)

复合组件模式通过将一个复杂的组件拆分成多个语义化的小组件（如 `Select`, `Select.Trigger`, `Select.Content`, `Select.Item`），并通过隐式的 Context 共享状态，赋予使用者极大的 DOM 结构控制权。

### 2.1 传统模式的痛点
在 React 18 及以前，子组件为了暴露 DOM 节点，必须套一层极其丑陋的 `forwardRef`：
```jsx
// 旧时代的噩梦
const TabTrigger = React.forwardRef(({ children, ...props }, ref) => {
  return <button ref={ref} {...props}>{children}</button>
});
TabTrigger.displayName = 'TabTrigger';
```

### 2.2 React 19 时代的优雅实现
React 19 废弃了 `forwardRef`，`ref` 变成了像 `className` 一样的普通 prop！

**实战：构建一个高度灵活的 `<Tabs>` 组件**

```tsx
import { createContext, useContext, useState, ReactNode, Ref } from 'react';

// 1. 定义私有 Context (不对外暴露)
type TabsContextType = {
  activeTab: string;
  setActiveTab: (val: string) => void;
};
const TabsContext = createContext<TabsContextType | null>(null);

// 自定义 Hook 处理空安全
function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) throw new Error("Tabs sub-components must be wrapped in <Tabs.Root>");
  return context;
}

// 2. 根组件 (提供状态)
// 在 React 19 中，我们可以直接用 <Context> 替代 <Context.Provider>
export function TabsRoot({ children, defaultValue }: { children: ReactNode, defaultValue: string }) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  return (
    <TabsContext value={{ activeTab, setActiveTab }}>
      <div className="tabs-container">{children}</div>
    </TabsContext>
  );
}

// 3. 子组件：Trigger (React 19 爽快的 ref 写法)
export function TabsTrigger({ 
  value, 
  children, 
  ref // ✅ 直接从 props 解构，不再需要 forwardRef!
}: { value: string, children: ReactNode, ref?: Ref<HTMLButtonElement> }) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      ref={ref}
      role="tab"
      aria-selected={isActive}
      onClick={() => setActiveTab(value)}
      className={`tab-trigger ${isActive ? 'active' : ''}`}
    >
      {children}
    </button>
  );
}

// 4. 子组件：Content
export function TabsContent({ value, children }: { value: string, children: ReactNode }) {
  const { activeTab } = useTabsContext();
  if (activeTab !== value) return null;
  return <div role="tabpanel" className="tab-content">{children}</div>;
}

// 5. 挂载为命名空间 (提供极佳的 IDE 自动补全)
export const Tabs = {
  Root: TabsRoot,
  Trigger: TabsTrigger,
  Content: TabsContent
};
```

**使用者视角：**
使用者可以随意插入图标、调整 Trigger 和 Content 的顺序，这就是**组合**的威力。
```tsx
<Tabs.Root defaultValue="account">
  <div className="flex gap-4">
    <Tabs.Trigger value="account"> <IconUser /> 账号设置 </Tabs.Trigger>
    <Tabs.Trigger value="security"> <IconLock /> 安全隐私 </Tabs.Trigger>
  </div>
  <Tabs.Content value="account"> 账号表单... </Tabs.Content>
  <Tabs.Content value="security"> 修改密码... </Tabs.Content>
</Tabs.Root>
```

---

## 3. Render Props 模式与 React 19 的 `use` 替换

### 3.1 什么是 Render Props (渲染属性)？
当你有一个处理通用逻辑的组件（比如鼠标追踪器、或者一个动态表单状态机），你希望复用它的**逻辑**，但不希望它限制你的 **UI 长什么样**。
传统做法是将 `children` 作为函数调用：

```tsx
// 逻辑层组件
function MouseTracker({ children }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return <div onMouseMove={e => setPos({ x: e.clientX, y: e.clientY })}>{children(pos)}</div>;
}

// 消费层
<MouseTracker>
  {({ x, y }) => <p>鼠标坐标: {x}, {y}</p>}
</MouseTracker>
```

### 3.2 React 19 的 `use` API 降维打击
Render Props 很容易陷入嵌套地狱（Callback Hell）。在 React 19 中，如果我们通过 Context 分发这种状态，消费者现在可以使用 `use()` API 在**条件语句**中提取数据，从而写出比 Render Props 更线性的代码。

```tsx
import { use } from 'react';

function UserProfile() {
  // 如果需要，use() 允许你在这个组件的 if/else 语句内部直接读取 Context！
  // 这彻底打破了以前 Hook 不能在条件判断中使用的限制。
  if (someCondition) {
    const contextData = use(SomeDeepContext);
    return <div>{contextData.name}</div>;
  }
  return <Fallback />;
}
```

---

## 4. 终极奥义：无头组件 (Headless Components) 架构

2026 年，组件库设计最前沿的流派是 **Headless UI**（如 Radix UI Primitives, TanStack Table）。

### 4.1 什么是 Headless？
**核心哲学：组件只输出状态 (State)、行为 (Actions) 和可访问性属性 (A11y Props)，绝对不输出哪怕一个 `<div>` 标签和一丝 CSS 样式。**

这意味着 UI 和业务逻辑被 100% 彻底剥离。

### 4.2 编写一个 Headless Toggle Hook
我们将上面提到的设计理念化为一个自定义 Hook。它返回“状态”和“Prop Getters”（一组需要绑定到目标元素上的原生 HTML 属性）。

```tsx
import { useState, useCallback } from 'react';

// Headless Hook: 纯粹的逻辑
export function useToggle({ initial = false } = {}) {
  const [on, setOn] = useState(initial);
  const toggle = useCallback(() => setOn(prev => !prev), []);

  return {
    on,
    toggle,
    // Prop Getter：帮助使用者一键绑定所有符合 W3C 无障碍标准的属性
    getTogglerProps: (overrideProps = {}) => ({
      'aria-pressed': on,
      role: 'button',
      tabIndex: 0,
      onClick: (e: React.MouseEvent) => {
        toggle();
        // 允许使用者传入自己的 onClick，在这里合并执行
        if (overrideProps.onClick) overrideProps.onClick(e); 
      },
      ...overrideProps,
    }),
  };
}
```

### 4.3 消费 Headless 逻辑
使用者拿到逻辑后，可以自由地将其附加到 `<button>`、`<div>` 甚至是一个 SVG 图标上，并随心所欲地使用 Tailwind CSS 编写样式。

```tsx
function AppleStyleSwitch() {
  const { on, getTogglerProps } = useToggle();

  return (
    // 使用者完全掌控 DOM 结构和样式
    <button 
      {...getTogglerProps({ className: `rounded-full p-1 ${on ? 'bg-green-500' : 'bg-gray-300'}` })}
    >
      <div className={`h-4 w-4 bg-white rounded-full transition-transform ${on ? 'translate-x-4' : ''}`} />
    </button>
  );
}
```

---

## 5. 架构总结：混合组装 (Server & Client 协同)

在 2026 年构建 React 应用，最成熟的页面架构是：
1. **RSC (Server Components)** 作为外壳，负责通过数据库获取初始数据（无 JS 开销）。
2. 使用 **Headless Hooks** 封装复杂的客户端交互逻辑（如拖拽、复杂表单状态）。
3. 使用 **Compound Components** 构建页面上高度灵活的客户端区块结构。

通过这种“状态下放，结构上浮”的设计，你将获得一个类型安全、利于维护且性能爆炸的企业级组件库架构。

---
*本文档由 Gemini CLI 持续维护，最后更新于 2026 年 3 月*