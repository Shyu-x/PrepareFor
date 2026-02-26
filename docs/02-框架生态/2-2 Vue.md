# Vue 3 核心原理与实战

---

## 一、响应式原理实现流程

### 1.1 Vue 3 响应式系统深度拆解

**流程细节：**
1.  **初始化 (Proxy)**：通过 `reactive()` 使用 `Proxy` 拦截对象的 `get` 和 `set`。
2.  **依赖收集 (Track)**：
    *   当触发 `get` 时，Vue 会将当前的 `activeEffect` (副作用函数) 存储到 `targetMap` 中。
    *   `targetMap` (WeakMap) -> `depsMap` (Map) -> `dep` (Set)。
3.  **触发更新 (Trigger)**：
    *   当触发 `set` 时，从 `targetMap` 中找到该属性对应的所有 `effect`。
    *   依次执行这些 `effect` 函数，触发 UI 重新渲染。

---

## 二、Diff 算法与编译优化
... (此处省略其他已加固内容)
