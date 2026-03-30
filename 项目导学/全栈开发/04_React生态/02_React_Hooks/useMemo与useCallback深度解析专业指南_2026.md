# useMemo与useCallback深度解析专业指南（2026年最新版）

> **本文档全面深入解析React useMemo和useCallback Hook：从基础原理到高级应用，涵盖性能优化、常见陷阱、最佳实践等所有核心知识点**

---

## 目录

1. [useMemo与useCallback概述](#1-usememo与usecallback概述)
   - [1.1 两个Hook的设计哲学](#11-两个hook的设计哲学)
   - [1.2 useMemo与useCallback的区别](#12-usememo与usecallback的区别)
   - [1.3 性能优化原理](#13-性能优化原理)
2. [useMemo深度解析](#2-usememo深度解析)
   - [2.1 useMemo基础用法](#21-usememo基础用法)
   - [2.2 useMemo的内部机制](#22-usememo的内部机制)
   - [2.3 useMemo的依赖数组](#23-usememo的依赖数组)
   - [2.4 useMemo的使用场景](#24-usememo的使用场景)
3. [useCallback深度解析](#3-usecallback深度解析)
   - [3.1 useCallback基础用法](#31-usecallback基础用法)
   - [3.2 useCallback的内部机制](#32-usecallback的内部机制)
   - [3.3 useCallback与useMemo的关系](#33-usecallback与usememo的关系)
   - [3.4 useCallback的使用场景](#34-usecallback的使用场景)
4. [性能优化深度解析](#4-性能优化深度解析)
   - [4.1 何时使用useMemo/useCallback](#41-何时使用usememousecallback)
   - [4.2 过度优化的陷阱](#42-过度优化的陷阱)
   - [4.3 性能测试与分析](#43-性能测试与分析)
   - [4.4 性能优化最佳实践](#44-性能优化最佳实践)
5. [常见陷阱与反模式](#5-常见陷阱与反模式)
   - [5.1 依赖数组错误](#51-依赖数组错误)
   - [5.2 闭包陷阱](#52-闭包陷阱)
   - [5.3 引用稳定性问题](#53-引用稳定性问题)
   - [5.4 性能反模式](#54-性能反模式)
6. [useMemo与useCallback对比](#6-usememo与usecallback对比)
   - [6.1 功能对比](#61-功能对比)
   - [6.2 性能对比](#62-性能对比)
   - [6.3 选择指南](#63-选择指南)
   - [6.4 迁移指南](#64-迁移指南)
7. [高级使用模式](#7-高级使用模式)
   - [7.1 缓存计算结果](#71-缓存计算结果)
   - [7.2 缓存函数引用](#72-缓存函数引用)
   - [7.3 组合使用模式](#73-组合使用模式)
   - [7.4 自定义Hook模式](#74-自定义hook模式)
8. [经典面试题](#8-经典面试题)
   - [8.1 基础面试题](#81-基础面试题)
   - [8.2 进阶面试题](#82-进阶面试题)
   - [8.3 复杂面试题](#83-复杂面试题)
9. [最佳实践](#9-最佳实践)
   - [9.1 代码组织最佳实践](#91-代码组织最佳实践)
   - [9.2 性能优化最佳实践](#92-性能优化最佳实践)
   - [9.3 测试最佳实践](#93-测试最佳实践)
10. [useMemo与useCallback的未来](#10-usememo与usecallback的未来)
    - [10.1 React 19的改进](#101-react-19的改进)
    - [10.2 新的API和模式](#102-新的api和模式)

---

## 1. useMemo与useCallback概述

### 1.1 两个Hook的设计哲学

**useMemo和useCallback的设计理念**：

```typescript
// useMemo：缓存计算结果
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);

// useCallback：缓存函数引用
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

**设计哲学**：

1. **性能优化**：避免不必要的计算和重渲染
2. **引用稳定性**：保持对象和函数的引用稳定
3. **手动优化**：开发者手动指定优化点
4. **可预测性**：明确的依赖关系，可预测的行为

**useMemo vs useCallback**：

```javascript
// useMemo：缓存任意值
const memoizedValue = useMemo(() => {
  return expensiveCalculation(a, b);
}, [a, b]);

// useCallback：缓存函数（等价于useMemo缓存函数）
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);

// useCallback等价于useMemo
const memoizedCallback = useMemo(() => {
  return () => doSomething(a, b);
}, [a, b]);
```

### 1.2 useMemo与useCallback的区别

**核心区别**：

```javascript
// useMemo：缓存计算结果
function Component({ items }) {
  // 缓存计算结果
  const sortedItems = useMemo(() => {
    console.log('重新排序');
    return [...items].sort((a, b) => a - b);
  }, [items]);

  return <div>{sortedItems.map(item => item)}</div>;
}

// useCallback：缓存函数引用
function Component({ count }) {
  const [count, setCount] = useState(0);

  // 缓存函数引用
  const handleClick = useCallback(() => {
    console.log(count);
  }, [count]);

  return <Child onClick={handleClick} />;
}
```

**对比表格**：

| Hook | 缓存内容 | 返回值 | 适用场景 |
|------|---------|--------|---------|
| useMemo | 计算结果 | 任意值 | 复杂计算、对象、数组 |
| useCallback | 函数引用 | 函数 | 传递给子组件的函数 |

### 1.3 性能优化原理

**性能优化原理**：

```javascript
// 1. 避免不必要的计算
function Component({ items }) {
  // ❌ 每次渲染都重新计算
  const sortedItems = [...items].sort((a, b) => a - b);

  // ✅ 只在items变化时重新计算
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a - b);
  }, [items]);
}

// 2. 避免不必要的重渲染
function Parent() {
  const [count, setCount] = useState(0);

  // ❌ 每次渲染都创建新函数，导致子组件重渲染
  const handleClick = () => {
    console.log(count);
  };

  // ✅ 只在count变化时创建新函数
  const handleClick = useCallback(() => {
    console.log(count);
  }, [count]);

  return <Child onClick={handleClick} />;
}

// 3. 保持引用稳定
function Component({ config }) {
  // ❌ 每次渲染都创建新对象
  const options = { timeout: 5000, retry: 3 };

  // ✅ 只在config变化时创建新对象
  const options = useMemo(() => ({
    timeout: 5000,
    retry: 3,
    ...config,
  }), [config]);
}
```

---

## 2. useMemo深度解析

### 2.1 useMemo基础用法

**useMemo的基础语法**：

```typescript
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
```

**useMemo的基础用法**：

```javascript
// 基础用法
function Component({ a, b }) {
  const result = useMemo(() => {
    console.log('计算中...');
    return a + b;
  }, [a, b]);

  return <div>{result}</div>;
}

// 复杂计算
function ExpensiveComponent({ items, filter }) {
  const filteredItems = useMemo(() => {
    console.log('过滤中...');
    return items.filter(item =>
      item.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [items, filter]);

  return (
    <ul>
      {filteredItems.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}

// 对象缓存
function Component() {
  const [count, setCount] = useState(0);

  const config = useMemo(() => ({
    timeout: 5000,
    retry: 3,
    headers: { 'Content-Type': 'application/json' },
  }), []);

  return <div>{count}</div>;
}

// 数组缓存
function Component({ items }) {
  const processedItems = useMemo(() => {
    return items
      .filter(item => item.name.length > 0)
      .map(item => ({ ...item, processed: true }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  return <div>{processedItems.length}</div>;
}
```

### 2.2 useMemo的内部机制

**useMemo的内部机制**：

```javascript
// useMemo的简化实现（简化版）
function useMemo(callback, deps) {
  const currentHook = ReactCurrentHook.current;

  // 检查依赖是否变化
  const hasChanged = deps.some((dep, index) => {
    return !Object.is(dep, currentHook.dependencies[index]);
  });

  // 如果依赖变化，重新计算
  if (hasChanged) {
    currentHook.memoizedState = callback();
  }

  return currentHook.memoizedState;
}
```

**useMemo的执行流程**：

```javascript
// useMemo的执行流程
// 1. 组件首次渲染：执行callback，缓存结果
// 2. 依赖变化：重新执行callback，更新缓存
// 3. 依赖不变：返回缓存的结果

function Component({ a, b }) {
  const result = useMemo(() => {
    console.log('计算中...');
    return a + b;
  }, [a, b]);

  // 首次渲染：a=0, b=0
  // 输出：计算中...
  // 返回：0

  // 重新渲染：a=1, b=0
  // 输出：计算中...
  // 返回：1

  // 重新渲染：a=1, b=1
  // 输出：计算中...
  // 返回：2

  // 重新渲染：a=1, b=1（依赖不变）
  // 不输出
  // 返回：2（缓存的结果）
}
```

### 2.3 useMemo的依赖数组

**useMemo的依赖数组**：

```javascript
// 依赖数组为空：只计算一次
function Component() {
  const config = useMemo(() => ({
    timeout: 5000,
    retry: 3,
  }), []);

  // 只在首次渲染时计算一次
}

// 依赖数组有依赖：依赖变化时重新计算
function Component({ a, b }) {
  const result = useMemo(() => {
    return a + b;
  }, [a, b]);

  // a或b变化时重新计算
}

// 依赖数组不传：每次渲染都计算
function Component({ a, b }) {
  const result = useMemo(() => {
    return a + b;
  });

  // 每次渲染都重新计算
}
```

### 2.4 useMemo的使用场景

**使用场景1：复杂计算**

```javascript
function ExpensiveComponent({ items, filter }) {
  const filteredItems = useMemo(() => {
    console.log('过滤中...');
    return items.filter(item =>
      item.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [items, filter]);

  return (
    <ul>
      {filteredItems.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

**使用场景2：对象缓存**

```javascript
function Component() {
  const [count, setCount] = useState(0);

  const config = useMemo(() => ({
    timeout: 5000,
    retry: 3,
    headers: { 'Content-Type': 'application/json' },
  }), []);

  return <Child config={config} count={count} />;
}
```

**使用场景3：数组处理**

```javascript
function Component({ items }) {
  const processedItems = useMemo(() => {
    return items
      .filter(item => item.name.length > 0)
      .map(item => ({ ...item, processed: true }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  return <div>{processedItems.length}</div>;
}
```

---

## 3. useCallback深度解析

### 3.1 useCallback基础用法

**useCallback的基础语法**：

```typescript
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

**useCallback的基础用法**：

```javascript
// 基础用法
function Component({ count }) {
  const handleClick = useCallback(() => {
    console.log(count);
  }, [count]);

  return <button onClick={handleClick}>点击</button>;
}

// 配合React.memo使用
const Child = React.memo(({ onClick, data }) => {
  console.log('Child渲染');
  return <button onClick={onClick}>{data.label}</button>;
});

function Parent() {
  const [count, setCount] = useState(0);

  // ❌ 每次渲染都创建新函数，导致Child重渲染
  const handleClickWrong = () => {
    console.log('click');
  };

  // ✅ 只在count变化时创建新函数
  const handleClickCorrect = useCallback(() => {
    console.log('click');
  }, [count]);

  return (
    <div>
      <Child onClick={handleClickWrong} data={{ label: '按钮' }} />
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
    </div>
  );
}
```

### 3.2 useCallback的内部机制

**useCallback的内部机制**：

```javascript
// useCallback的简化实现（简化版）
function useCallback(callback, deps) {
  const currentHook = ReactCurrentHook.current;

  // 检查依赖是否变化
  const hasChanged = deps.some((dep, index) => {
    return !Object.is(dep, currentHook.dependencies[index]);
  });

  // 如果依赖变化，返回新函数
  if (hasChanged) {
    currentHook.memoizedState = callback;
  }

  return currentHook.memoizedState;
}
```

**useCallback的执行流程**：

```javascript
// useCallback的执行流程
// 1. 组件首次渲染：返回callback函数
// 2. 依赖变化：返回新的callback函数
// 3. 依赖不变：返回缓存的函数

function Component({ count }) {
  const handleClick = useCallback(() => {
    console.log(count);
  }, [count]);

  // 首次渲染：count=0
  // 返回：函数1

  // 重新渲染：count=1
  // 返回：函数2

  // 重新渲染：count=1（依赖不变）
  // 返回：函数2（缓存的函数）
}
```

### 3.3 useCallback与useMemo的关系

**useCallback与useMemo的关系**：

```javascript
// useCallback等价于useMemo

// useCallback
const handleClick = useCallback(() => {
  console.log(count);
}, [count]);

// 等价于useMemo
const handleClick = useMemo(() => {
  return () => console.log(count);
}, [count]);
```

**何时使用useCallback**：

```javascript
// 1. 传递给子组件的函数
const Child = React.memo(({ onClick }) => <button onClick={onClick}>点击</button>);

function Parent() {
  const handleClick = useCallback(() => {
    console.log('click');
  }, []);

  return <Child onClick={handleClick} />;
}

// 2. 传递给useEffect的函数
useEffect(() => {
  window.addEventListener('click', handleClick);
  return () => window.removeEventListener('click', handleClick);
}, [handleClick]);

// 3. 传递给其他Hook的函数
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

### 3.4 useCallback的使用场景

**使用场景1：React.memo优化**

```javascript
const Child = React.memo(({ onClick, data }) => {
  console.log('Child渲染');
  return <button onClick={onClick}>{data.label}</button>;
});

function Parent() {
  const [count, setCount] = useState(0);

  // ❌ 每次渲染都创建新函数，导致Child重渲染
  const handleClickWrong = () => {
    console.log('click');
  };

  // ✅ 只在count变化时创建新函数
  const handleClickCorrect = useCallback(() => {
    console.log('click');
  }, [count]);

  return (
    <div>
      <Child onClick={handleClickWrong} data={{ label: '按钮' }} />
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
    </div>
  );
}
```

**使用场景2：事件监听**

```javascript
function Component({ count }) {
  const handleClick = useCallback(() => {
    console.log(count);
  }, [count]);

  useEffect(() => {
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [handleClick]);

  return <div>内容</div>;
}
```

**使用场景3：依赖其他状态**

```javascript
function Component() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');

  const handleDelete = useCallback((id: string) => {
    setCount(prev => prev - 1);
  }, []);

  return (
    <div>
      <button onClick={() => handleDelete('1')}>删除</button>
      <p>Count: {count}</p>
    </div>
  );
}
```

---

## 4. 性能优化深度解析

### 4.1 何时使用useMemo/useCallback

**何时使用useMemo/useCallback**：

```javascript
// ✅ 应该使用useMemo/useCallback的场景

// 1. 复杂计算
function ExpensiveComponent({ items }) {
  const processedItems = useMemo(() => {
    return items
      .filter(item => item.name.length > 0)
      .map(item => ({ ...item, processed: true }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  return <div>{processedItems.length}</div>;
}

// 2. 传递给React.memo的函数
const Child = React.memo(({ onClick }) => <button onClick={onClick}>点击</button>);

function Parent() {
  const handleClick = useCallback(() => {
    console.log('click');
  }, []);

  return <Child onClick={handleClick} />;
}

// 3. 传递给useEffect的函数
useEffect(() => {
  window.addEventListener('click', handleClick);
  return () => window.removeEventListener('click', handleClick);
}, [handleClick]);

// 4. 传递给子组件的对象
const config = useMemo(() => ({
  timeout: 5000,
  retry: 3,
}), []);
```

**何时不需要使用useMemo/useCallback**：

```javascript
// ❌ 不需要使用useMemo/useCallback的场景

// 1. 简单计算
function Component({ name }) {
  // ❌ 不需要useMemo
  const upperName = useMemo(() => name.toUpperCase(), [name]);

  // ✅ 直接计算
  const upperName = name.toUpperCase();
}

// 2. 没有传递给子组件的函数
function Component() {
  const [count, setCount] = useState(0);

  // ❌ 不需要useCallback
  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []);

  // ✅ 直接定义
  const handleClick = () => {
    setCount(c => c + 1);
  };
}

// 3. 每次都需要重新计算的值
function Component() {
  // ❌ 不需要useMemo
  const now = useMemo(() => Date.now(), []);

  // ✅ 直接调用
  const now = Date.now();
}
```

### 4.2 过度优化的陷阱

**过度优化的陷阱**：

```javascript
// ❌ 陷阱1：不必要地使用useMemo
function BadComponent({ name }) {
  // 简单计算不需要useMemo
  const upperName = useMemo(() => name.toUpperCase(), [name]);
}

// ✅ 正确：简单计算直接执行
function GoodComponent({ name }) {
  const upperName = name.toUpperCase();
}

// ❌ 陷阱2：不必要地使用useCallback
function BadComponent() {
  const handleClick = useCallback(() => {
    console.log('click');
  }, []); // 简单函数不需要useCallback
}

// ✅ 正确：简单函数直接定义
function GoodComponent() {
  const handleClick = () => {
    console.log('click');
  };
}

// ❌ 陷阱3：依赖数组过大
function BadComponent() {
  const [state1, setState1] = useState(0);
  const [state2, setState2] = useState(0);
  const [state3, setState3] = useState(0);

  // 依赖数组过大，容易触发重新计算
  const expensiveValue = useMemo(() => {
    return computeExpensiveValue(state1, state2, state3);
  }, [state1, state2, state3]);
}

// ✅ 正确：只依赖必要的状态
function GoodComponent() {
  const [state1, setState1] = useState(0);
  const [state2, setState2] = useState(0);
  const [state3, setState3] = useState(0);

  // 只依赖必要的状态
  const expensiveValue = useMemo(() => {
    return computeExpensiveValue(state1);
  }, [state1]);
}

// ❌ 陷阱4：依赖对象引用
function BadComponent() {
  const [options, setOptions] = useState({ a: 1, b: 2 });

  // 每次渲染都创建新对象
  useEffect(() => {
    console.log(options);
  }, [options]); // 每次渲染都执行
}

// ✅ 正确：使用useMemo优化
function GoodComponent() {
  const [options, setOptions] = useState({ a: 1, b: 2 });

  const memoizedOptions = useMemo(() => ({ a: 1, b: 2 }), []);
  useEffect(() => {
    console.log(memoizedOptions);
  }, [memoizedOptions]);
}

// ❌ 陷阱5：依赖函数引用
function BadComponent() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    console.log(count);
  };

  useEffect(() => {
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [handleClick]); // ❌ 每次渲染都创建新函数
}

// ✅ 正确：使用useCallback优化
function GoodComponent() {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    console.log(count);
  }, [count]);

  useEffect(() => {
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [handleClick]);
}
```

### 4.3 性能测试与分析

**性能测试**：

```javascript
// 使用React DevTools Profiler
<React.Profiler id="Component" onRender={onRenderCallback}>
  <Component />
</React.Profiler>

// onRenderCallback函数
function onRenderCallback(
  id, // 发生提交的组件的"id"
  phase, // "mount" 或 "update"
  actualDuration, // 本次更新实际花费的时间
  baseDuration, // 估算的渲染时间
  startTime, // 本次更新开始的时间
  commitTime, // 本次提交完成的时间
  interactions // 本次更新相关的交互
) {
  console.log(`${id}渲染耗时: ${actualDuration}ms`);
}
```

**性能分析**：

```javascript
// 分析组件渲染
function Component({ items }) {
  const [count, setCount] = useState(0);

  // 使用Profiler分析
  return (
    <React.Profiler id="Component" onRender={onRenderCallback}>
      <div>
        <Child items={items} />
        <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      </div>
    </React.Profiler>
  );
}
```

### 4.4 性能优化最佳实践

**最佳实践1：使用React.memo**

```javascript
const Child = React.memo(({ data }) => {
  return <div>{data}</div>;
});

function Parent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <Child data="固定数据" />
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
    </div>
  );
}
```

**最佳实践2：使用useMemo缓存计算结果**

```javascript
function ExpensiveComponent({ items, filter }) {
  const filteredItems = useMemo(() => {
    return items.filter(item =>
      item.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [items, filter]);

  return (
    <ul>
      {filteredItems.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

**最佳实践3：使用useCallback缓存函数**

```javascript
function Parent() {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    console.log(count);
  }, [count]);

  return <Child onClick={handleClick} />;
}
```

**最佳实践4：拆分Context**

```javascript
const UserContext = createContext<User | null>(null);
const UserActionsContext = createContext<{
  updateUser: (user: User) => void;
} | null>(null);

function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const actions = useMemo(() => ({
    updateUser: setUser,
  }), []);

  return (
    <UserContext.Provider value={user}>
      <UserActionsContext.Provider value={actions}>
        {children}
      </UserActionsContext.Provider>
    </UserContext.Provider>
  );
}
```

**最佳实践5：使用useTransition标记非紧急更新**

```javascript
function SearchResults() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    startTransition(() => {
      setQuery(e.target.value);
    });
  };

  return (
    <div>
      <input onChange={handleChange} />
      {isPending && <div>加载中...</div>}
      <Results query={query} />
    </div>
  );
}
```

---

## 5. 常见陷阱与反模式

### 5.1 依赖数组错误

**依赖数组错误**：

```javascript
// ❌ 错误：忘记依赖
function BadComponent({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, []); // ❌ userId应该在依赖数组中
}

// ✅ 正确：正确的依赖数组
function GoodComponent({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]); // ✅ 依赖userId
}

// ❌ 错误：依赖对象引用
function BadComponent() {
  const [options, setOptions] = useState({ a: 1 });

  useEffect(() => {
    console.log(options);
  }, [options]); // ❌ 每次渲染都执行
}

// ✅ 正确：使用useMemo优化
function GoodComponent() {
  const [options, setOptions] = useState({ a: 1 });

  const memoizedOptions = useMemo(() => ({ a: 1 }), []);
  useEffect(() => {
    console.log(memoizedOptions);
  }, [memoizedOptions]);
}

// ❌ 错误：依赖函数引用
function BadComponent() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    console.log(count);
  };

  useEffect(() => {
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [handleClick]); // ❌ 每次渲染都创建新函数
}

// ✅ 正确：使用useCallback优化
function GoodComponent() {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    console.log(count);
  }, [count]);

  useEffect(() => {
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [handleClick]);
}
```

### 5.2 闭包陷阱

**闭包陷阱**：

```javascript
// ❌ 错误：闭包陷阱
function BadCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(count + 1); // ❌ count在闭包中是固定的
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 问题：count始终是0
}

// ✅ 正确：使用函数式更新
function GoodCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(prev => prev + 1); // ✅ 使用前一个状态
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // ✅ count正常递增
}
```

### 5.3 引用稳定性问题

**引用稳定性问题**：

```javascript
// ❌ 错误：对象引用不稳定
function BadComponent() {
  const [count, setCount] = useState(0);
  const options = { a: 1 }; // 每次渲染创建新对象

  useEffect(() => {
    console.log(options);
  }, [options]); // ❌ 每次渲染都执行
}

// ✅ 正确：使用useMemo优化
function GoodComponent() {
  const [count, setCount] = useState(0);
  const options = useMemo(() => ({ a: 1 }), []);

  useEffect(() => {
    console.log(options);
  }, [options]); // ✅ 只在依赖变化时执行
}

// ❌ 错误：函数引用不稳定
function BadComponent() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    console.log(count);
  };

  useEffect(() => {
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [handleClick]); // ❌ 每次渲染都创建新函数
}

// ✅ 正确：使用useCallback优化
function GoodComponent() {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    console.log(count);
  }, [count]);

  useEffect(() => {
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [handleClick]);
}
```

### 5.4 性能反模式

**性能反模式**：

```javascript
// ❌ 反模式1：过度优化
function OverOptimization() {
  const [name, setName] = useState('');

  // ❌ 简单计算不需要useMemo
  const upperName = useMemo(() => name.toUpperCase(), [name]);

  // ❌ 简单函数不需要useCallback
  const handleChange = useCallback((e) => {
    setName(e.target.value);
  }, []);

  // ✅ 简单计算直接执行
  const upperNameCorrect = name.toUpperCase();

  // ✅ 简单函数直接定义
  const handleChangeCorrect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };
}

// ❌ 反模式2：依赖数组过大
function LargeDependency() {
  const [state1, setState1] = useState(0);
  const [state2, setState2] = useState(0);
  const [state3, setState3] = useState(0);

  // ❌ 依赖数组过大，容易触发重新计算
  const expensiveValue = useMemo(() => {
    return computeExpensiveValue(state1, state2, state3);
  }, [state1, state2, state3]);

  // ✅ 只依赖必要的状态
  const expensiveValueCorrect = useMemo(() => {
    return computeExpensiveValue(state1);
  }, [state1]);
}

// ❌ 反模式3：不必要地使用useMemo/useCallback
function UnnecessaryOptimization() {
  const [count, setCount] = useState(0);

  // ❌ 简单值不需要useMemo
  const value = useMemo(() => count, [count]);

  // ✅ 简单值直接使用
  const valueCorrect = count;
}
```

---

## 6. useMemo与useCallback对比

### 6.1 功能对比

**功能对比**：

```javascript
// useMemo：缓存计算结果
function Component({ items }) {
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a - b);
  }, [items]);

  return <div>{sortedItems.map(item => item)}</div>;
}

// useCallback：缓存函数引用
function Component({ count }) {
  const handleClick = useCallback(() => {
    console.log(count);
  }, [count]);

  return <button onClick={handleClick}>点击</button>;
}
```

**功能对比表格**：

| 特性 | useMemo | useCallback |
|------|---------|-------------|
| 缓存内容 | 计算结果 | 函数引用 |
| 返回值 | 任意值 | 函数 |
| 适用场景 | 复杂计算、对象、数组 | 传递给子组件的函数 |
| 等价形式 | - | useMemo(() => fn, deps) |

### 6.2 性能对比

**性能对比**：

```javascript
// useMemo性能
function Component({ items }) {
  const processedItems = useMemo(() => {
    return items.filter(item => item.name.length > 0);
  }, [items]);

  // 只在items变化时重新计算
}

// useCallback性能
function Component({ count }) {
  const handleClick = useCallback(() => {
    console.log(count);
  }, [count]);

  // 只在count变化时创建新函数
}

// 性能对比总结
// useMemo：避免不必要的计算
// useCallback：避免不必要的重渲染
```

### 6.3 选择指南

**选择指南**：

```javascript
// 经验法则：
// - 函数传给子组件 -> useCallback
// - 计算结果传给子组件 -> useMemo
// - 简单计算不需要useMemo（可能更慢）

function App() {
  const [count, setCount] = useState(0);

  // 传给子组件的函数
  const handleSubmit = useCallback((data: any) => {
    console.log('提交', data);
  }, []);

  // 传给子组件的对象
  const config = useMemo(() => ({
    timeout: 5000,
    retry: 3
  }), []);

  // 简单值不需要useMemo
  const upperName = name.toUpperCase(); // 直接执行

  return <Form onSubmit={handleSubmit} config={config} />;
}
```

### 6.4 迁移指南

**从useMemo迁移到useCallback**：

```javascript
// ❌ 使用useMemo缓存函数
function BadComponent() {
  const handleClick = useMemo(() => {
    return () => console.log(count);
  }, [count]);
}

// ✅ 使用useCallback缓存函数
function GoodComponent() {
  const handleClick = useCallback(() => {
    console.log(count);
  }, [count]);
}
```

---

## 7. 高级使用模式

### 7.1 缓存计算结果

**缓存计算结果**：

```javascript
function ExpensiveComponent({ items, filter }) {
  // 缓存过滤结果
  const filteredItems = useMemo(() => {
    console.log('过滤中...');
    return items.filter(item =>
      item.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [items, filter]);

  // 缓存统计信息
  const statistics = useMemo(() => {
    return {
      sum: items.reduce((a, b) => a + b, 0),
      avg: items.length > 0 ? items.reduce((a, b) => a + b, 0) / items.length : 0,
      max: Math.max(...items),
      min: Math.min(...items),
    };
  }, [items]);

  return (
    <div>
      {filteredItems.map(item => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}
```

### 7.2 缓存函数引用

**缓存函数引用**：

```javascript
interface Item {
  id: string;
  name: string;
}

const ItemComponent = React.memo(({ item, onClick }: { item: Item; onClick: (id: string) => void }) => {
  console.log('渲染:', item.name);
  return <div onClick={() => onClick(item.id)}>{item.name}</div>;
});

function ParentComponent() {
  const [items, setItems] = useState<Item[]>([
    { id: '1', name: '项目1' },
    { id: '2', name: '项目2' },
  ]);

  // 传递给memo组件的函数使用useCallback
  const handleClick = useCallback((id: string) => {
    console.log('点击:', id);
  }, []);

  // 依赖其他state的回调使用useCallback
  const handleDelete = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  return (
    <div>
      {items.map(item => (
        <ItemComponent key={item.id} item={item} onClick={handleClick} />
      ))}
    </div>
  );
}
```

### 7.3 组合使用模式

**组合使用模式**：

```javascript
function Component({ data, onItemClick }) {
  // 复杂计算使用useMemo
  const processedData = useMemo(() => {
    return data
      .filter(item => item.name.length > 0)
      .map(item => ({ ...item, processed: true }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  // 传递给memo组件的函数使用useCallback
  const handleClick = useCallback((id: string) => {
    onItemClick(id);
  }, [onItemClick]);

  // 依赖其他state的计算使用useMemo
  const [filter, setFilter] = useState('');
  const filteredData = useMemo(() => {
    return processedData.filter(item =>
      item.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [processedData, filter]);

  return (
    <div>
      <input value={filter} onChange={e => setFilter(e.target.value)} />
      {filteredData.map(item => (
        <ItemComponent key={item.id} item={item} onClick={handleClick} />
      ))}
    </div>
  );
}
```

### 7.4 自定义Hook模式

**自定义Hook模式**：

```javascript
function useExpensiveCalculation(data: Data[]): ProcessedData[] {
  return useMemo(() => {
    return data
      .filter(item => item.name.length > 0)
      .map(item => ({ ...item, processed: true }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);
}

function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
) {
  const throttledCallback = useCallback((...args: Parameters<T>) => {
    // 节流逻辑
  }, [callback, delay]);

  return throttledCallback;
}

function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
) {
  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    // 防抖逻辑
  }, [callback, delay]);

  return debouncedCallback;
}
```

---

## 8. 经典面试题

### 8.1 基础面试题

**题目1：useMemo和useCallback的区别**

```javascript
// 面试题
function Component({ items }) {
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a - b);
  }, [items]);

  return <div>{sortedItems.map(item => item)}</div>;
}

// 答案：
// useMemo：缓存计算结果
// useCallback：缓存函数引用
```

**题目2：useCallback与useMemo的关系**

```javascript
// 面试题
const handleClick = useCallback(() => {
  console.log(count);
}, [count]);

// 等价于
const handleClick = useMemo(() => {
  return () => console.log(count);
}, [count]);

// 答案：useCallback(fn, deps) 等价于 useMemo(() => fn, deps)
```

**题目3：useMemo的依赖数组**

```javascript
// 面试题
function Component({ a, b }) {
  const result = useMemo(() => {
    return a + b;
  }, [a, b]);

  // 依赖数组为空
  const config = useMemo(() => ({
    timeout: 5000,
  }), []);

  // 答案：
  // 1. a或b变化时重新计算
  // 2. 只在首次渲染时计算
}
```

### 8.2 进阶面试题

**题目1：useMemo的性能优化**

```javascript
// 面试题
function Component({ items }) {
  const processedItems = useMemo(() => {
    return items
      .filter(item => item.name.length > 0)
      .map(item => ({ ...item, processed: true }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  // 问题：如何进一步优化？
  // 答案：
  // 1. 使用useCallback缓存过滤函数
  // 2. 使用useMemo缓存排序函数
  // 3. 使用虚拟列表
}
```

**题目2：useCallback的闭包陷阱**

```javascript
// 面试题
function Component() {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    console.log(count);
  }, [count]);

  useEffect(() => {
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [handleClick]);

  // 问题：count变化时会发生什么？
  // 答案：handleClick会重新创建，导致事件监听器重新绑定
}
```

**题目3：useMemo与useCallback的选择**

```javascript
// 面试题
function Component({ data, onItemClick }) {
  // 传给子组件的函数
  const handleSubmit = useCallback((data: any) => {
    console.log('提交', data);
  }, []);

  // 传给子组件的对象
  const config = useMemo(() => ({
    timeout: 5000,
    retry: 3
  }), []);

  // 答案：
  // 函数传给子组件 -> useCallback
  // 对象传给子组件 -> useMemo
}
```

### 8.3 复杂面试题

**题目1：useMemo的内部机制**

```javascript
// 面试题：useMemo的内部实现
function useMemo(callback, deps) {
  const currentHook = ReactCurrentHook.current;

  // 检查依赖是否变化
  const hasChanged = deps.some((dep, index) => {
    return !Object.is(dep, currentHook.dependencies[index]);
  });

  // 如果依赖变化，重新计算
  if (hasChanged) {
    currentHook.memoizedState = callback();
  }

  return currentHook.memoizedState;
}

// 答案：useMemo使用依赖数组比较，依赖变化时重新计算
```

**题目2：useCallback与React.memo**

```javascript
// 面试题：useCallback与React.memo的关系
const Child = React.memo(({ onClick, data }) => {
  console.log('Child渲染');
  return <button onClick={onClick}>{data.label}</button>;
});

function Parent() {
  const [count, setCount] = useState(0);

  // ❌ 每次渲染都创建新函数，导致Child重渲染
  const handleClickWrong = () => {
    console.log('click');
  };

  // ✅ 只在count变化时创建新函数
  const handleClickCorrect = useCallback(() => {
    console.log('click');
  }, [count]);

  return (
    <div>
      <Child onClick={handleClickWrong} data={{ label: '按钮' }} />
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
    </div>
  );
}

// 答案：
// 1. 没有useCallback：Child每次都会重渲染
// 2. 使用useCallback：Child只在count变化时重渲染
```

**题目3：useMemo与useCallback的性能优化**

```javascript
// 面试题：如何优化React应用的性能？
// 答案：
// 1. 使用React.memo
// 2. 使用useMemo缓存计算结果
// 3. 使用useCallback缓存函数
// 4. 拆分Context
// 5. 使用useTransition标记非紧急更新
// 6. 使用useDeferredValue延迟非紧急值
// 7. 虚拟列表
// 8. 懒加载
// 9. 状态最小化
// 10. 状态扁平化
```

---

## 9. 最佳实践

### 9.1 代码组织最佳实践

**最佳实践1：使用useMemo缓存复杂计算**

```javascript
function ExpensiveComponent({ items, filter }) {
  // 缓存过滤结果
  const filteredItems = useMemo(() => {
    return items.filter(item =>
      item.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [items, filter]);

  // 缓存统计信息
  const statistics = useMemo(() => {
    return {
      sum: items.reduce((a, b) => a + b, 0),
      avg: items.length > 0 ? items.reduce((a, b) => a + b, 0) / items.length : 0,
      max: Math.max(...items),
      min: Math.min(...items),
    };
  }, [items]);

  return (
    <div>
      {filteredItems.map(item => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}
```

**最佳实践2：使用useCallback缓存函数**

```javascript
function Parent() {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    console.log(count);
  }, [count]);

  return <Child onClick={handleClick} />;
}
```

### 9.2 性能优化最佳实践

**最佳实践1：使用React.memo**

```javascript
const Child = React.memo(({ data }) => {
  return <div>{data}</div>;
});

function Parent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <Child data="固定数据" />
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
    </div>
  );
}
```

**最佳实践2：使用useMemo缓存计算结果**

```javascript
function ExpensiveComponent({ items, filter }) {
  const filteredItems = useMemo(() => {
    return items.filter(item =>
      item.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [items, filter]);

  return (
    <ul>
      {filteredItems.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

**最佳实践3：使用useCallback缓存函数**

```javascript
function Parent() {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    console.log(count);
  }, [count]);

  return <Child onClick={handleClick} />;
}
```

### 9.3 测试最佳实践

**最佳实践1：测试useMemo**

```javascript
function Component({ items }) {
  const processedItems = useMemo(() => {
    return items.filter(item => item.name.length > 0);
  }, [items]);

  return <div>{processedItems.length}</div>;
}

// 测试
test('useMemo缓存计算结果', () => {
  const { rerender } = render(<Component items={[{ name: 'a' }]} />);

  // 初始渲染
  expect(getByText('1')).toBeInTheDocument();

  // 重新渲染，items不变
  rerender(<Component items={[{ name: 'a' }]} />);
  expect(getByText('1')).toBeInTheDocument();

  // 重新渲染，items变化
  rerender(<Component items={[{ name: 'a' }, { name: 'b' }]} />);
  expect(getByText('2')).toBeInTheDocument();
});
```

**最佳实践2：测试useCallback**

```javascript
function Component({ count }) {
  const handleClick = useCallback(() => {
    console.log(count);
  }, [count]);

  return <button onClick={handleClick}>点击</button>;
}

// 测试
test('useCallback缓存函数引用', () => {
  const { rerender } = render(<Component count={0} />);

  // 初始渲染
  const button = getByRole('button');
  const handleClick1 = button.onclick;

  // 重新渲染，count不变
  rerender(<Component count={0} />);
  const handleClick2 = button.onclick;

  // 函数引用相同
  expect(handleClick1).toBe(handleClick2);

  // 重新渲染，count变化
  rerender(<Component count={1} />);
  const handleClick3 = button.onclick;

  // 函数引用不同
  expect(handleClick1).not.toBe(handleClick3);
});
```

---

## 10. useMemo与useCallback的未来

### 10.1 React 19的改进

**React 19的useMemo和useCallback改进**：

```javascript
// React 19的新特性：useMemo和useCallback的改进
// 1. 更好的性能优化
// 2. 更智能的依赖数组
// 3. 更好的TypeScript支持

// React 19的新API：useMemo和useCallback的改进
function Component() {
  const [count, setCount] = useState(0);

  // React 19的改进
  // 1. 自动批处理
  // 2. 更好的性能优化
  // 3. 更好的错误处理
}
```

### 10.2 新的API和模式

**新的API和模式**：

```javascript
// 1. useActionState（React 19）
function Form() {
  const [state, formAction, isPending] = useActionState(
    async (previousState, formData) => {
      // 表单提交逻辑
    },
    { error: undefined }
  );

  return <form action={formAction}>...</form>;
}

// 2. useOptimistic（React 19）
function TodoList({ todos }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo) => [...state, { ...newTodo, id: Date.now() }]
  );

  return <div>{optimisticTodos.map(todo => <div key={todo.id}>{todo.text}</div>)}</div>;
}

// 3. useId（React 18）
function Form() {
  const id = useId();

  return (
    <div>
      <label htmlFor={id}>姓名</label>
      <input id={id} type="text" />
    </div>
  );
}

// 4. useTransition（React 18）
function SearchResults() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleChange = (e) => {
    startTransition(() => {
      setQuery(e.target.value);
    });
  };

  return (
    <div>
      <input onChange={handleChange} />
      {isPending && <div>加载中...</div>}
      <Results query={query} />
    </div>
  );
}

// 5. useDeferredValue（React 18）
function SearchResults({ query }) {
  const deferredQuery = useDeferredValue(query);

  return <ExpensiveComponent query={deferredQuery} />;
}
```

---

## 总结

本文档全面深入解析了React useMemo和useCallback Hook，包括：

1. **useMemo与useCallback概述**：两个Hook的设计哲学、区别、性能优化原理
2. **useMemo深度解析**：基础用法、内部机制、依赖数组、使用场景
3. **useCallback深度解析**：基础用法、内部机制、与useMemo的关系、使用场景
4. **性能优化深度解析**：何时使用、过度优化的陷阱、性能测试与分析、最佳实践
5. **常见陷阱与反模式**：依赖数组错误、闭包陷阱、引用稳定性问题、性能反模式
6. **useMemo与useCallback对比**：功能对比、性能对比、选择指南、迁移指南
7. **高级使用模式**：缓存计算结果、缓存函数引用、组合使用模式、自定义Hook模式
8. **经典面试题**：基础面试题、进阶面试题、复杂面试题
9. **最佳实践**：代码组织最佳实践、性能优化最佳实践、测试最佳实践
10. **useMemo与useCallback的未来**：React 19的改进、新的API和模式

这些内容可以帮助你更好地理解和使用useMemo和useCallback，掌握React的核心知识点。