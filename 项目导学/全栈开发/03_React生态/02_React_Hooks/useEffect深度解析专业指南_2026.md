# useEffect深度解析专业指南（2026年最新版）

> **本文档全面深入解析React useEffect Hook：从基础原理到高级应用，涵盖依赖数组、清理函数、性能优化、常见陷阱等所有核心知识点**

---

## 目录

1. [useEffect概述](#1-useeffect概述)
   - [1.1 useEffect的设计哲学](#11-useeffect的设计哲学)
   - [1.2 useEffect与类组件生命周期对比](#12-useeffect与类组件生命周期对比)
   - [1.3 useEffect的执行时机](#13-useeffect的执行时机)
2. [useEffect基础用法](#2-useeffect基础用法)
   - [2.1 基础语法](#21-基础语法)
   - [2.2 无依赖数组的Effect](#22-无依赖数组的effect)
   - [2.3 空依赖数组的Effect](#23-空依赖数组的effect)
   - [2.4 依赖数组的Effect](#24-依赖数组的effect)
3. [依赖数组深度解析](#3-依赖数组深度解析)
   - [3.1 依赖数组的工作原理](#31-依赖数组的工作原理)
   - [3.2 Object.is比较算法](#32-objectis比较算法)
   - [3.3 依赖数组的常见陷阱](#33-依赖数组的常见陷阱)
   - [3.4 依赖数组的最佳实践](#34-依赖数组的最佳实践)
4. [清理函数深度解析](#4-清理函数深度解析)
   - [4.1 清理函数的执行时机](#41-清理函数的执行时机)
   - [4.2 订阅和事件监听的清理](#42-订阅和事件监听的清理)
   - [4.3 定时器的清理](#43-定时器的清理)
   - [4.4 异步操作的清理](#44-异步操作的清理)
5. [useEffect与性能优化](#5-useeffect与性能优化)
   - [5.1 避免不必要的Effect执行](#51-避免不必要的effect执行)
   - [5.2 使用useCallback优化依赖](#52-使用usecallback优化依赖)
   - [5.3 使用useMemo优化依赖](#53-使用usememo优化依赖)
   - [5.4 Effect的拆分与组合](#54-effect的拆分与组合)
6. [useEffect高级模式](#6-useeffect高级模式)
   - [6.1 基于状态的Effect](#61-基于状态的effect)
   - [6.2 基于属性的Effect](#62-基于属性的effect)
   - [6.3 基于副作用的Effect](#63-基于副作用的effect)
   - [6.4 Effect的错误边界](#64-effect的错误边界)
7. [useEffect与useLayoutEffect对比](#7-useeffect与uselayouteffect对比)
   - [7.1 执行时机对比](#71-执行时机对比)
   - [7.2 使用场景对比](#72-使用场景对比)
   - [7.3 性能影响对比](#73-性能影响对比)
8. [useEffect经典面试题](#8-useeffect经典面试题)
   - [8.1 基础面试题](#81-基础面试题)
   - [8.2 进阶面试题](#82-进阶面试题)
   - [8.3 复杂面试题](#83-复杂面试题)
9. [useEffect最佳实践](#9-useeffect最佳实践)
   - [9.1 代码组织最佳实践](#91-代码组织最佳实践)
   - [9.2 错误处理最佳实践](#92-错误处理最佳实践)
   - [9.3 测试最佳实践](#93-测试最佳实践)
10. [useEffect的未来](#10-useeffect的未来)
    - [10.1 React 19的改进](#101-react-19的改进)
    - [10.2 新的API和模式](#102-新的api和模式)

---

## 1. useEffect概述

### 1.1 useEffect的设计哲学

**useEffect**是React Hooks中最核心的Hook之一，用于处理副作用（Side Effects）。副作用是指那些不直接返回UI，但会影响组件外部状态的操作。

```typescript
// 副作用的定义
// 副作用是指函数内部操作了函数外部的状态或资源
// 包括：DOM操作、网络请求、订阅、定时器等

// ✅ 纯函数：不产生副作用
function pureFunction(a, b) {
  return a + b;
}

// ❌ 非纯函数：产生副作用
function impureFunction(a, b) {
  console.log(a + b); // 输出到控制台是副作用
  return a + b;
}
```

**useEffect的设计理念**：

1. **统一的副作用处理**：将类组件中的componentDidMount、componentDidUpdate、componentWillUnmount统一为一个API
2. **声明式编程**：通过声明依赖关系，React自动管理副作用的执行
3. **自动清理**：通过返回清理函数，确保资源正确释放
4. **性能优化**：通过依赖数组，避免不必要的副作用执行

**useEffect的执行流程**：

```javascript
// useEffect的执行流程
// 1. 组件首次渲染后执行Effect
// 2. 依赖变化时重新执行Effect
// 3. 组件卸载时执行清理函数
// 4. 下次Effect执行前执行上一次的清理函数

useEffect(() => {
  console.log('Effect执行');
  
  return () => {
    console.log('清理函数执行');
  };
}, [dependency]);
```

### 1.2 useEffect与类组件生命周期对比

**useEffect与类组件生命周期方法的对应关系**：

| useEffect | 类组件生命周期 | 说明 |
|-----------|---------------|------|
| `useEffect(() => {}, [])` | `componentDidMount` | 组件挂载后执行 |
| `useEffect(() => {}, [prop])` | `componentDidUpdate` | prop变化时执行 |
| `useEffect(() => {}, [])` 的清理函数 | `componentWillUnmount` | 组件卸载时执行 |

**类组件的生命周期方法**：

```javascript
class MyClassComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = { count: 0 };
  }

  // 组件挂载后执行
  componentDidMount() {
    console.log('组件挂载');
    // 订阅事件、获取数据等
  }

  // 组件更新后执行
  componentDidUpdate(prevProps, prevState) {
    console.log('组件更新');
    console.log('之前的props:', prevProps);
    console.log('之前的state:', prevState);
    // 对比新旧props和state，执行相应操作
  }

  // 组件卸载前执行
  componentWillUnmount() {
    console.log('组件卸载');
    // 清理订阅、定时器等
  }

  render() {
    return <div>内容</div>;
  }
}
```

**函数组件使用useEffect的对应实现**：

```typescript
function MyFunctionComponent(props) {
  const [count, setCount] = useState(0);

  // 组件挂载后执行（类似componentDidMount）
  useEffect(() => {
    console.log('组件挂载');
    // 订阅事件、获取数据等
  }, []);

  // 组件更新后执行（类似componentDidUpdate）
  useEffect(() => {
    console.log('组件更新');
    console.log('当前props:', props);
    // 处理props变化
  }, [props]);

  // 组件卸载前执行（类似componentWillUnmount）
  useEffect(() => {
    return () => {
      console.log('组件卸载');
      // 清理订阅、定时器等
    };
  }, []);

  return <div>内容</div>;
}
```

**useEffect的优势**：

1. **更简洁**：不需要区分不同的生命周期方法
2. **更灵活**：可以创建多个Effect，每个处理一个关注点
3. **更易维护**：相关逻辑组织在一起，不需要在不同生命周期方法间跳转
4. **自动清理**：通过返回清理函数，确保资源正确释放

### 1.3 useEffect的执行时机

**useEffect的执行时机**：

```javascript
// useEffect的执行时机
// 1. 组件首次渲染后（mount）
// 2. 依赖变化后（update）
// 3. 组件卸载前（unmount）

// 执行时机示意图
// ┌─────────────────────────────────────────────────────┐
// │ 1. 组件渲染（render）                               │
// │    - 计算JSX                                       │
// │    - 调用组件函数                                  │
// └─────────────────────────────────────────────────────┘
//                    │
//                    ▼
// ┌─────────────────────────────────────────────────────┐
// │ 2. DOM更新（commit）                                │
// │    - 更新DOM                                       │
// │    - 调用useLayoutEffect                           │
// └─────────────────────────────────────────────────────┘
//                    │
//                    ▼
// ┌─────────────────────────────────────────────────────┐
// │ 3. 浏览器绘制（paint）                              │
// │    - 浏览器绘制UI                                  │
// └─────────────────────────────────────────────────────┘
//                    │
//                    ▼
// ┌─────────────────────────────────────────────────────┐
// │ 4. useEffect执行                                    │
// │    - 执行Effect函数                                │
// │    - 执行清理函数（如果有）                        │
// └─────────────────────────────────────────────────────┘
```

**useEffect与浏览器绘制的关系**：

```javascript
// useEffect是异步执行的，在浏览器绘制之后
// 这意味着useEffect不会阻塞浏览器绘制

function Component() {
  useEffect(() => {
    console.log('useEffect执行');
    // 这里的代码在浏览器绘制之后执行
  });

  console.log('组件渲染');
  // 这里的代码在浏览器绘制之前执行

  return <div>内容</div>;
}

// 输出顺序：
// 1. 组件渲染
// 2. 浏览器绘制
// 3. useEffect执行
```

**useEffect与useLayoutEffect的执行时机对比**：

```javascript
// useLayoutEffect是同步执行的，在DOM更新后、浏览器绘制前
// 这意味着useLayoutEffect会阻塞浏览器绘制

function Component() {
  useLayoutEffect(() => {
    console.log('useLayoutEffect执行');
    // 这里的代码在浏览器绘制之前执行
  });

  useEffect(() => {
    console.log('useEffect执行');
    // 这里的代码在浏览器绘制之后执行
  });

  console.log('组件渲染');
  // 这里的代码在浏览器绘制之前执行

  return <div>内容</div>;
}

// 输出顺序：
// 1. 组件渲染
// 2. useLayoutEffect执行
// 3. 浏览器绘制
// 4. useEffect执行
```

**执行时机总结**：

| Hook | 执行时机 | 是否阻塞绘制 | 适用场景 |
|------|---------|-------------|---------|
| `useEffect` | 浏览器绘制后 | ❌ 不阻塞 | 数据获取、订阅、日志、非紧急DOM操作 |
| `useLayoutEffect` | DOM更新后、绘制前 | ✅ 阻塞 | 测量DOM、同步更新UI、动画 |

---

## 2. useEffect基础用法

### 2.1 基础语法

**useEffect的基础语法**：

```typescript
useEffect(effect: EffectCallback, deps?: DependencyList): void;

// EffectCallback类型
type EffectCallback = () => (void | (() => void));

// DependencyList类型
type DependencyList = readonly any[];
```

**useEffect的基本用法**：

```javascript
// 语法
useEffect(() => {
  // 副作用逻辑
  // 1. 执行副作用操作
  // 2. 订阅事件、获取数据等
  
  // 返回清理函数（可选）
  return () => {
    // 清理逻辑
    // 1. 取消订阅
    // 2. 清除定时器
    // 3. 移除事件监听器
  };
}, [dependencies]);
```

**useEffect的参数说明**：

1. **effect函数**：副作用函数，可以返回清理函数
2. **依赖数组**：可选参数，指定依赖项
   - 不传：每次渲染后都执行
   - 空数组：只在挂载时执行
   - 有依赖：依赖变化时执行

### 2.2 无依赖数组的Effect

**无依赖数组的Effect**：每次渲染后都会执行

```javascript
function Component({ count }) {
  useEffect(() => {
    console.log('每次渲染后都执行');
    // 这里的代码会在每次渲染后执行
  });

  return <div>Count: {count}</div>;
}
```

**使用场景**：

```javascript
// 场景1：日志记录
function Component({ data }) {
  useEffect(() => {
    console.log('组件渲染', data);
    // 记录日志
  });

  return <div>{data}</div>;
}

// 场景2：同步状态到外部
function Component({ value }) {
  useEffect(() => {
    // 每次渲染后同步状态到外部存储
    window.externalStore.setValue(value);
  });

  return <div>{value}</div>;
}

// 场景3：动态标题
function Component({ title }) {
  useEffect(() => {
    document.title = title;
    // 每次渲染后更新标题
  });

  return <div>{title}</div>;
}
```

**注意事项**：

```javascript
// ❌ 不推荐：可能导致性能问题
function BadComponent({ data }) {
  useEffect(() => {
    // 每次渲染都执行，包括不必要的渲染
    console.log('每次渲染都执行', data);
  });

  return <div>{data}</div>;
}

// ✅ 推荐：使用依赖数组
function GoodComponent({ data }) {
  useEffect(() => {
    // 只在data变化时执行
    console.log('data变化', data);
  }, [data]);

  return <div>{data}</div>;
}
```

### 2.3 空依赖数组的Effect

**空依赖数组的Effect**：只在组件挂载时执行一次

```javascript
function Component() {
  useEffect(() => {
    console.log('组件挂载');
    // 这里的代码只在组件挂载时执行一次
  }, []);

  return <div>内容</div>;
}
```

**使用场景**：

```javascript
// 场景1：数据获取
function DataFetching() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // 只在组件挂载时获取一次数据
    fetch('/api/data')
      .then(res => res.json())
      .then(setData);
  }, []);

  return <div>{JSON.stringify(data)}</div>;
}

// 场景2：订阅事件
function EventSubscription() {
  useEffect(() => {
    // 只在组件挂载时订阅一次
    window.addEventListener('resize', handleResize);

    // 清理函数：组件卸载时取消订阅
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <div>内容</div>;
}

// 场景3：初始化定时器
function Timer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    // 只在组件挂载时启动一次定时器
    const interval = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);

    // 清理函数：组件卸载时清除定时器
    return () => clearInterval(interval);
  }, []);

  return <div>{seconds}秒</div>;
}

// 场景4：初始化第三方库
function ThirdPartyLibrary() {
  useEffect(() => {
    // 只在组件挂载时初始化一次第三方库
    const editor = new Editor({
      container: document.getElementById('editor'),
    });

    // 清理函数：组件卸载时销毁第三方库
    return () => {
      editor.destroy();
    };
  }, []);

  return <div id="editor"></div>;
}
```

**经典面试题**：

```javascript
// 面试题1：空依赖数组的执行次数
function Component() {
  useEffect(() => {
    console.log('Effect执行');
  }, []);

  console.log('组件渲染');

  return <div>内容</div>;
}

// 输出顺序：
// 1. 组件渲染
// 2. Effect执行

// 面试题2：空依赖数组与状态更新
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log('Effect执行，count:', count);
  }, []);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
    </div>
  );
}

// 输出：
// 1. 组件渲染（count: 0）
// 2. Effect执行（count: 0）
// 点击按钮后：
// 3. 组件渲染（count: 1）
// 4. 组件渲染（count: 2）
// ...（Effect不再执行）
```

### 2.4 依赖数组的Effect

**依赖数组的Effect**：依赖变化时执行

```javascript
function Component({ userId }) {
  useEffect(() => {
    console.log('userId变化', userId);
    // 这里的代码只在userId变化时执行
  }, [userId]);

  return <div>用户ID: {userId}</div>;
}
```

**使用场景**：

```javascript
// 场景1：依赖props
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // userId变化时重新获取用户数据
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(setUser);
  }, [userId]);

  return <div>{user?.name}</div>;
}

// 场景2：依赖state
function Counter({ max }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // count变化时执行
    console.log('count变化:', count);
  }, [count]);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
    </div>
  );
}

// 场景3：依赖多个变量
function Search({ query, filter }) {
  const [results, setResults] = useState([]);

  useEffect(() => {
    // query或filter变化时重新搜索
    fetch(`/api/search?q=${query}&filter=${filter}`)
      .then(res => res.json())
      .then(setResults);
  }, [query, filter]);

  return <div>{JSON.stringify(results)}</div>;
}

// 场景4：依赖函数
function Component({ onClick }) {
  useEffect(() => {
    // onClick函数变化时重新绑定事件
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [onClick]);

  return <div>内容</div>;
}
```

**依赖数组的规则**：

1. **依赖数组必须包含所有在Effect中使用的外部变量**
2. **依赖数组中的变量使用Object.is进行比较**
3. **依赖数组为空时，只在挂载时执行**
4. **依赖数组不传时，每次渲染后都执行**

---

## 3. 依赖数组深度解析

### 3.1 依赖数组的工作原理

**依赖数组的工作原理**：

```javascript
// useEffect的依赖数组比较逻辑（简化版）
function useEffect(effect, deps) {
  // 保存上一次的依赖
  const prevDeps = currentHook.dependencies;
  
  // 检查依赖是否变化
  const hasChanged = deps.some((dep, index) => {
    return !Object.is(dep, prevDeps[index]);
  });
  
  // 如果依赖变化，执行Effect
  if (hasChanged) {
    effect();
  }
}
```

**依赖数组的比较过程**：

```javascript
// 依赖数组比较示例
function Component({ count, name }) {
  useEffect(() => {
    console.log('Effect执行');
  }, [count, name]);

  // 第一次渲染：count=0, name='John'
  // 依赖数组：[0, 'John']
  // 比较：无上一次依赖，执行Effect
  
  // 第二次渲染：count=1, name='John'
  // 依赖数组：[1, 'John']
  // 比较：Object.is(1, 0) = false，执行Effect
  
  // 第三次渲染：count=1, name='Jane'
  // 依赖数组：[1, 'Jane']
  // 比较：Object.is(1, 1) = true, Object.is('Jane', 'John') = false，执行Effect
  
  // 第四次渲染：count=1, name='Jane'
  // 依赖数组：[1, 'Jane']
  // 比较：Object.is(1, 1) = true, Object.is('Jane', 'Jane') = true，不执行Effect
}
```

### 3.2 Object.is比较算法

**Object.is与===的区别**：

```javascript
// Object.is与===的区别

// 1. NaN比较
console.log(Object.is(NaN, NaN)); // true
console.log(NaN === NaN);         // false

// 2. +0和-0比较
console.log(Object.is(+0, -0));   // false
console.log(+0 === -0);           // true

// 3. 对象比较
const obj1 = { a: 1 };
const obj2 = { a: 1 };
console.log(Object.is(obj1, obj1)); // true
console.log(Object.is(obj1, obj2)); // false

// 4. 基本类型比较
console.log(Object.is(1, 1));     // true
console.log(Object.is('a', 'a')); // true
```

**依赖数组中Object.is的使用**：

```javascript
function Component({ obj, arr }) {
  useEffect(() => {
    console.log('Effect执行');
  }, [obj, arr]);

  // ❌ 问题：每次渲染都创建新对象
  const handleClick = () => {
    setObj({ a: 1 }); // 新对象，依赖变化
  };

  // ✅ 解决：使用useMemo
  const memoizedObj = useMemo(() => ({ a: 1 }), []);
  const handleClickCorrect = () => {
    setObj(memoizedObj); // 相同对象，依赖不变
  };
}
```

### 3.3 依赖数组的常见陷阱

**陷阱1：忘记依赖**

```javascript
// ❌ 错误：忘记依赖
function BadComponent({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser(userId).then(setUser);
    // ❌ userId应该在依赖数组中
  }, []);

  return <div>{user?.name}</div>;
}

// ✅ 正确：正确的依赖数组
function GoodComponent({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser(userId).then(setUser);
    // ✅ userId在依赖数组中
  }, [userId]);

  return <div>{user?.name}</div>;
}
```

**陷阱2：依赖对象引用**

```javascript
// ❌ 错误：依赖对象引用
function BadComponent() {
  const [count, setCount] = useState(0);
  const options = { a: 1 }; // 每次渲染创建新对象

  useEffect(() => {
    console.log(options);
  }, [options]); // ❌ 每次渲染都执行

  // ✅ 正确：使用useMemo
  function GoodComponent() {
    const [count, setCount] = useState(0);
    const options = useMemo(() => ({ a: 1 }), []);

    useEffect(() => {
      console.log(options);
    }, [options]); // ✅ 只在依赖变化时执行
  }
}
```

**陷阱3：依赖函数引用**

```javascript
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

  // ✅ 正确：使用useCallback
  function GoodComponent() {
    const [count, setCount] = useState(0);

    const handleClick = useCallback(() => {
      console.log(count);
    }, [count]);

    useEffect(() => {
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }, [handleClick]); // ✅ 只在count变化时执行
  }
}
```

**陷阱4：依赖数组过大**

```javascript
// ❌ 错误：依赖数组过大
function BadComponent() {
  const [state1, setState1] = useState(0);
  const [state2, setState2] = useState(0);
  const [state3, setState3] = useState(0);

  useEffect(() => {
    console.log(state1, state2, state3);
  }, [state1, state2, state3]); // ❌ 依赖数组过大

  // ✅ 正确：只依赖必要的变量
  function GoodComponent() {
    const [state1, setState1] = useState(0);
    const [state2, setState2] = useState(0);
    const [state3, setState3] = useState(0);

    useEffect(() => {
      console.log(state1); // 只依赖state1
    }, [state1]); // ✅ 只依赖必要的变量
  }
}
```

### 3.4 依赖数组的最佳实践

**最佳实践1：使用ESLint插件**

```javascript
// 安装eslint-plugin-react-hooks
// npm install eslint-plugin-react-hooks --save-dev

// .eslintrc.js
module.exports = {
  plugins: ['react-hooks'],
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
};
```

**最佳实践2：使用函数式更新**

```javascript
// ❌ 错误：依赖状态
function BadCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(count + 1); // ❌ 闭包中的count是固定的
    }, 1000);

    return () => clearInterval(interval);
  }, [count]); // ❌ 每次count变化都重新创建定时器

  // ✅ 正确：使用函数式更新
  function GoodCounter() {
    const [count, setCount] = useState(0);

    useEffect(() => {
      const interval = setInterval(() => {
        setCount(prev => prev + 1); // ✅ 使用前一个状态
      }, 1000);

      return () => clearInterval(interval);
    }, []); // ✅ 只在挂载时执行一次

    return <div>{count}</div>;
  }
}
```

**最佳实践3：使用useRef存储可变值**

```javascript
// ❌ 错误：依赖状态
function BadComponent() {
  const [value, setValue] = useState('');

  useEffect(() => {
    console.log(value);
  }, [value]); // ❌ 每次value变化都执行

  // ✅ 正确：使用useRef
  function GoodComponent() {
    const [value, setValue] = useState('');
    const valueRef = useRef(value);

    useEffect(() => {
      valueRef.current = value;
    }, [value]);

    useEffect(() => {
      console.log(valueRef.current); // ✅ 不依赖value
    }, []);

    return <div>{value}</div>;
  }
}
```

---

## 4. 清理函数深度解析

### 4.1 清理函数的执行时机

**清理函数的执行时机**：

```javascript
// 清理函数在以下情况执行：
// 1. 组件卸载时
// 2. 下次Effect执行前（依赖变化时）

function Component({ userId }) {
  useEffect(() => {
    console.log('Effect执行');

    return () => {
      console.log('清理函数执行');
    };
  }, [userId]);

  // 执行顺序：
  // 1. 首次渲染：Effect执行 -> 清理函数不执行
  // 2. userId变化：清理函数执行 -> Effect执行
  // 3. 组件卸载：清理函数执行
}
```

**清理函数的执行时机示意图**：

```javascript
// ┌─────────────────────────────────────────────────────┐
// │ 组件挂载                                            │
// │ useEffect执行                                       │
// └─────────────────────────────────────────────────────┘
//                    │
//                    ▼
// ┌─────────────────────────────────────────────────────┐
// │ 依赖变化                                            │
// │ 上一次Effect的清理函数执行                          │
// │ 新Effect执行                                        │
// └─────────────────────────────────────────────────────┘
//                    │
//                    ▼
// ┌─────────────────────────────────────────────────────┐
// │ 组件卸载                                            │
// │ 最后一次Effect的清理函数执行                        │
// └─────────────────────────────────────────────────────┘
```

### 4.2 订阅和事件监听的清理

**订阅和事件监听的清理**：

```javascript
// 订阅事件
function ChatRoom({ roomId }) {
  useEffect(() => {
    const subscription = chat.subscribe(roomId, onMessage);

    return () => {
      subscription.unsubscribe(); // 清理订阅
    };
  }, [roomId]);

  return <div>聊天室</div>;
}

// 事件监听
function WindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    function handleResize() {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize); // 清理事件监听
    };
  }, []);

  return <div>{size.width} x {size.height}</div>;
}

// DOM事件监听
function ClickCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function handleClick() {
      setCount(c => c + 1);
    }

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick); // 清理DOM事件监听
    };
  }, []);

  return <div>点击次数: {count}</div>;
}
```

### 4.3 定时器的清理

**定时器的清理**：

```javascript
// setInterval
function Timer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);

    return () => clearInterval(interval); // 清理定时器
  }, []);

  return <div>{seconds}秒</div>;
}

// setTimeout
function DelayedAction() {
  const [action, setAction] = useState(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAction('执行延迟操作');
    }, 1000);

    return () => clearTimeout(timeout); // 清理定时器
  }, []);

  return <div>{action}</div>;
}

// 动态定时器
function DynamicTimer({ delay }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(c => c + 1);
    }, delay);

    return () => clearInterval(interval);
  }, [delay]); // delay变化时重新创建定时器

  return <div>Count: {count}</div>;
}
```

### 4.4 异步操作的清理

**异步操作的清理**：

```javascript
// ❌ 错误：不清理异步操作
function BadDataFetching({ url }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData);
    // ❌ 如果组件在请求完成前卸载，会报错
  }, [url]);

  return <div>{JSON.stringify(data)}</div>;
}

// ✅ 正确：清理异步操作
function GoodDataFetching({ url }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false; // 标记组件是否已卸载

    async function fetchData() {
      try {
        setLoading(true);
        const result = await fetch(url);
        const json = await result.json();

        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true; // 组件卸载时标记为已取消
    };
  }, [url]);

  return (
    <div>
      {loading && <div>加载中...</div>}
      {error && <div>错误: {error.message}</div>}
      {data && <div>{JSON.stringify(data)}</div>}
    </div>
  );
}

// 使用AbortController
function DataFetchingWithAbort({ url }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(url, { signal: controller.signal })
      .then(res => res.json())
      .then(setData)
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error(err);
        }
      });

    return () => {
      controller.abort(); // 取消请求
    };
  }, [url]);

  return <div>{JSON.stringify(data)}</div>;
}

// React Query的实现方式
function ReactQueryLike({ url }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error('请求失败');
        }
        const json = await response.json();
        setData(json);
        setError(null);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    return () => {
      controller.abort();
    };
  }, [url]);

  return (
    <div>
      {loading && <div>加载中...</div>}
      {error && <div>错误: {error.message}</div>}
      {data && <div>{JSON.stringify(data)}</div>}
    </div>
  );
}
```

---

## 5. useEffect与性能优化

### 5.1 避免不必要的Effect执行

**避免不必要的Effect执行**：

```javascript
// ❌ 错误：每次渲染都执行
function BadComponent({ data }) {
  useEffect(() => {
    console.log('每次渲染都执行', data);
  });

  return <div>{data}</div>;
}

// ✅ 正确：只在依赖变化时执行
function GoodComponent({ data }) {
  useEffect(() => {
    console.log('data变化', data);
  }, [data]);

  return <div>{data}</div>;
}

// ❌ 错误：依赖对象引用
function BadObjectDependency() {
  const [count, setCount] = useState(0);
  const options = { a: 1 }; // 每次渲染创建新对象

  useEffect(() => {
    console.log(options);
  }, [options]); // ❌ 每次渲染都执行

  // ✅ 正确：使用useMemo
  function GoodObjectDependency() {
    const [count, setCount] = useState(0);
    const options = useMemo(() => ({ a: 1 }), []);

    useEffect(() => {
      console.log(options);
    }, [options]); // ✅ 只在依赖变化时执行
  }
}
```

### 5.2 使用useCallback优化依赖

**使用useCallback优化依赖**：

```javascript
// ❌ 错误：依赖函数引用
function BadComponent({ onClick }) {
  const handleClick = () => {
    onClick();
  };

  useEffect(() => {
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [handleClick]); // ❌ 每次渲染都创建新函数
}

// ✅ 正确：使用useCallback
function GoodComponent({ onClick }) {
  const handleClick = useCallback(() => {
    onClick();
  }, [onClick]);

  useEffect(() => {
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [handleClick]); // ✅ 只在onClick变化时执行
}

// 实际应用场景：表单提交
function Form({ onSubmit }) {
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    onSubmit(formData);
  }, [formData, onSubmit]);

  useEffect(() => {
    // 只在handleSubmit变化时重新绑定
    document.addEventListener('submit', handleSubmit);
    return () => document.removeEventListener('submit', handleSubmit);
  }, [handleSubmit]);
}
```

### 5.3 使用useMemo优化依赖

**使用useMemo优化依赖**：

```javascript
// ❌ 错误：依赖对象引用
function BadComponent({ config }) {
  useEffect(() => {
    console.log(config);
  }, [config]); // ❌ 每次渲染都执行
}

// ✅ 正确：使用useMemo
function GoodComponent({ config }) {
  const memoizedConfig = useMemo(() => config, [config]);

  useEffect(() => {
    console.log(memoizedConfig);
  }, [memoizedConfig]); // ✅ 只在config变化时执行
}

// 实际应用场景：API请求配置
function DataFetching({ url, options }) {
  const memoizedOptions = useMemo(() => ({
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  }), [options]);

  useEffect(() => {
    fetch(url, memoizedOptions)
      .then(res => res.json())
      .then(setData);
  }, [url, memoizedOptions]);
}
```

### 5.4 Effect的拆分与组合

**Effect的拆分与组合**：

```javascript
// ❌ 错误：一个Effect处理多个关注点
function BadComponent({ userId, theme }) {
  useEffect(() => {
    // 关注点1：获取用户数据
    fetchUser(userId).then(setUser);
    
    // 关注点2：设置主题
    document.body.className = theme;
    
    // 关注点3：订阅事件
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [userId, theme]);
}

// ✅ 正确：拆分为多个Effect
function GoodComponent({ userId, theme }) {
  // 关注点1：获取用户数据
  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);

  // 关注点2：设置主题
  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  // 关注点3：订阅事件
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
}
```

---

## 6. useEffect高级模式

### 6.1 基于状态的Effect

**基于状态的Effect**：

```javascript
// 场景1：状态变化时执行副作用
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // count变化时执行
    console.log('count变化:', count);
  }, [count]);

  return <div>Count: {count}</div>;
}

// 场景2：状态变化时更新DOM
function ThemeSwitcher() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // theme变化时更新DOM
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      切换主题
    </button>
  );
}

// 场景3：状态变化时触发动画
function Modal({ isOpen }) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  return (
    <div className={isAnimating ? 'animate' : ''}>
      {isOpen && <div>模态框内容</div>}
    </div>
  );
}
```

### 6.2 基于属性的Effect

**基于属性的Effect**：

```javascript
// 场景1：属性变化时获取数据
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // userId变化时重新获取用户数据
    fetchUser(userId).then(setUser);
  }, [userId]);

  return <div>{user?.name}</div>;
}

// 场景2：属性变化时更新标题
function PageTitle({ title }) {
  useEffect(() => {
    // title变化时更新页面标题
    document.title = title;
  }, [title]);

  return <div>{title}</div>;
}

// 场景3：属性变化时设置样式
function Resizable({ width, height }) {
  useEffect(() => {
    // width或height变化时更新样式
    document.body.style.width = `${width}px`;
    document.body.style.height = `${height}px`;
  }, [width, height]);

  return <div>内容</div>;
}
```

### 6.3 基于副作用的Effect

**基于副作用的Effect**：

```javascript
// 场景1：订阅事件
function WindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    function handleResize() {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <div>{size.width} x {size.height}</div>;
}

// 场景2：订阅WebSocket
function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const subscription = chat.subscribe(roomId, onMessage);

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId]);

  return <div>{messages.map(m => <div key={m.id}>{m.text}</div>)}</div>;
}

// 场景3：订阅Redux store
function Counter() {
  const [count, setCount] = useState(store.getState());

  useEffect(() => {
    function handleChange() {
      setCount(store.getState());
    }

    store.subscribe(handleChange);

    return () => {
      store.unsubscribe(handleChange);
    };
  }, []);

  return <div>Count: {count}</div>;
}
```

### 6.4 Effect的错误边界

**Effect的错误边界**：

```javascript
// ❌ 错误：Effect中的错误不会被捕获
function BadComponent() {
  useEffect(() => {
    // 这里的错误不会被捕获
    throw new Error('Error in useEffect');
  }, []);

  return <div>内容</div>;
}

// ✅ 正确：使用try-catch
function GoodComponent() {
  useEffect(() => {
    try {
      // 副作用逻辑
      riskyOperation();
    } catch (error) {
      // 捕获错误
      setError(error);
    }
  }, []);

  return <div>内容</div>;
}

// ✅ 更好的方案：使用错误边界组件
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <h1>出错了</h1>;
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <Component />
    </ErrorBoundary>
  );
}
```

---

## 7. useEffect与useLayoutEffect对比

### 7.1 执行时机对比

**执行时机对比**：

```javascript
// useEffect：异步执行，在浏览器绘制后执行
function useEffectExample() {
  useEffect(() => {
    console.log('useEffect: 绘制后执行');
  }, []);

  return <div>内容</div>;
}

// useLayoutEffect：同步执行，在DOM改变后、浏览器绘制前执行
function useLayoutExample() {
  useLayoutEffect(() => {
    console.log('useLayoutEffect: 绘制前执行');
  }, []);

  return <div>内容</div>;
}

// 执行顺序
function Component() {
  useEffect(() => {
    console.log('1. useEffect');
  }, []);

  useLayoutEffect(() => {
    console.log('2. useLayoutEffect');
  }, []);

  // 输出顺序：
  // 2. useLayoutEffect (同步，DOM改变后立即执行)
  // 1. useEffect (异步，浏览器绘制后执行)
}
```

**执行时机示意图**：

```javascript
// ┌─────────────────────────────────────────────────────┐
// │ 1. 组件渲染（render）                               │
// │    - 计算JSX                                       │
// │    - 调用组件函数                                  │
// └─────────────────────────────────────────────────────┘
//                    │
//                    ▼
// ┌─────────────────────────────────────────────────────┐
// │ 2. DOM更新（commit）                                │
// │    - 更新DOM                                       │
// │    - 调用useLayoutEffect（同步）                   │
// └─────────────────────────────────────────────────────┘
//                    │
//                    ▼
// ┌─────────────────────────────────────────────────────┐
// │ 3. 浏览器绘制（paint）                              │
// │    - 浏览器绘制UI                                  │
// └─────────────────────────────────────────────────────┘
//                    │
//                    ▼
// ┌─────────────────────────────────────────────────────┐
// │ 4. useEffect执行（异步）                            │
// │    - 执行Effect函数                                │
// │    - 执行清理函数（如果有）                        │
// └─────────────────────────────────────────────────────┘
```

### 7.2 使用场景对比

**使用场景对比**：

| Hook | 执行时机 | 适用场景 |
|------|---------|---------|
| `useEffect` | 浏览器绘制后 | 数据获取、订阅、日志、非紧急DOM操作 |
| `useLayoutEffect` | DOM改变后、绘制前 | 测量DOM、同步更新UI、动画 |

**useLayoutEffect的使用场景**：

```javascript
// 场景1：测量DOM尺寸
function useMeasure() {
  const [rect, setRect] = useState({ width: 0, height: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (ref.current) {
      const { width, height } = ref.current.getBoundingClientRect();
      setRect({ width, height });
    }
  }, []);

  return { ref, rect };
}

// 场景2：同步更新UI
function ScrollPosition() {
  const [position, setPosition] = useState(window.scrollY);
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (ref.current) {
      // 在浏览器绘制前同步更新滚动位置
      window.scrollTo(0, position);
    }
  }, [position]);

  return <div ref={ref}>内容</div>;
}

// 场景3：动画
function AnimatedComponent() {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (ref.current) {
      // 在浏览器绘制前设置初始状态
      ref.current.style.opacity = '0';
      ref.current.style.transform = 'translateX(-100px)';
    }
  }, []);

  useEffect(() => {
    if (ref.current) {
      // 在浏览器绘制后开始动画
      requestAnimationFrame(() => {
        ref.current.style.opacity = '1';
        ref.current.style.transform = 'translateX(0)';
      });
    }
  }, []);

  return <div ref={ref}>动画内容</div>;
}
```

### 7.3 性能影响对比

**性能影响对比**：

```javascript
// ❌ 错误：使用useLayoutEffect导致性能问题
function BadComponent() {
  useLayoutEffect(() => {
    // 同步执行，阻塞浏览器绘制
    console.log('useLayoutEffect阻塞绘制');
  });

  return <div>内容</div>;
}

// ✅ 正确：使用useEffect避免性能问题
function GoodComponent() {
  useEffect(() => {
    // 异步执行，不阻塞浏览器绘制
    console.log('useEffect不阻塞绘制');
  });

  return <div>内容</div>;
}

// 性能测试
function PerformanceTest() {
  const [count, setCount] = useState(0);

  // useLayoutEffect：阻塞绘制
  useLayoutEffect(() => {
    setCount(c => c + 1);
  });

  // useEffect：不阻塞绘制
  useEffect(() => {
    setCount(c => c + 1);
  }, []);

  return <div>Count: {count}</div>;
}
```

**性能影响总结**：

| Hook | 性能影响 | 适用场景 |
|------|---------|---------|
| `useEffect` | 无阻塞 | 大多数场景 |
| `useLayoutEffect` | 阻塞绘制 | 只有在需要立即读取/修改DOM时 |

---

## 8. useEffect经典面试题

### 8.1 基础面试题

**题目1：useEffect的执行时机**

```javascript
// 面试题
function Component() {
  console.log('1. 渲染');

  useEffect(() => {
    console.log('2. useEffect');
  });

  return <div>内容</div>;
}

// 答案：1. 渲染 -> 2. useEffect
// 解释：useEffect在浏览器绘制后执行
```

**题目2：useEffect与依赖数组**

```javascript
// 面试题
function Counter({ count }) {
  useEffect(() => {
    console.log('useEffect执行', count);
  }, [count]);

  console.log('渲染', count);

  return <div>{count}</div>;
}

// 答案：
// 1. 渲染 0 -> useEffect执行 0
// 点击按钮后：
// 2. 渲染 1 -> useEffect执行 1
// 解释：依赖数组控制Effect的执行时机
```

**题目3：useEffect的清理函数**

```javascript
// 面试题
function Component({ userId }) {
  useEffect(() => {
    console.log('Effect执行', userId);

    return () => {
      console.log('清理函数执行', userId);
    };
  }, [userId]);

  // 答案：
  // 1. 首次渲染：Effect执行 1 -> 清理函数不执行
  // 2. userId变化：清理函数执行 1 -> Effect执行 2
  // 3. 组件卸载：清理函数执行 2
}
```

### 8.2 进阶面试题

**题目1：useEffect与闭包**

```javascript
// 面试题
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      console.log(count); // 问题：count始终是0
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return <button onClick={() => setCount(c => c + 1)}>+1</button>;
}

// 答案：count始终是0
// 解释：useEffect只在挂载时执行一次，闭包中的count是0
// 解决方案：使用函数式更新
function GoodCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(prev => prev + 1); // 使用前一个状态
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return <div>{count}</div>;
}
```

**题目2：useEffect与异步操作**

```javascript
// 面试题
function DataFetching({ url }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData);
  }, [url]);

  return <div>{JSON.stringify(data)}</div>;
}

// 问题：如果组件在请求完成前卸载，会报错
// 解决方案：使用清理函数
function GoodDataFetching({ url }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (!cancelled) {
          setData(data);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return <div>{JSON.stringify(data)}</div>;
}
```

**题目3：useEffect与性能优化**

```javascript
// 面试题
function Component({ config }) {
  useEffect(() => {
    console.log(config);
  }, [config]);

  const handleClick = () => {
    setConfig({ a: 1 }); // 每次都创建新对象
  };

  // 问题：每次渲染都执行Effect
  // 解决方案：使用useMemo
  function GoodComponent({ config }) {
    const memoizedConfig = useMemo(() => config, [config]);

    useEffect(() => {
      console.log(memoizedConfig);
    }, [memoizedConfig]);

    const handleClick = () => {
      setConfig(memoizedConfig);
    };
  }
}
```

### 8.3 复杂面试题

**题目1：useEffect与useLayoutEffect混合**

```javascript
// 面试题
function Component() {
  console.log('1. 渲染');

  useEffect(() => {
    console.log('2. useEffect');
  });

  useLayoutEffect(() => {
    console.log('3. useLayoutEffect');
  });

  return <div>内容</div>;
}

// 答案：1. 渲染 -> 3. useLayoutEffect -> 2. useEffect
// 解释：useLayoutEffect在DOM更新后立即执行，useEffect在浏览器绘制后执行
```

**题目2：useEffect与状态更新**

```javascript
// 面试题
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(c => c + 1);
    setCount(c => c + 1);
    setCount(c => c + 1);
  }, []);

  console.log(count);

  return <div>{count}</div>;
}

// 答案：3
// 解释：React 18+自动批处理，三次状态更新合并为一次
```

**题目3：useEffect与依赖数组的依赖**

```javascript
// 面试题
function Component({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);

  // 问题：如果userId是对象，每次渲染都创建新对象
  // 解决方案：使用useMemo或useCallback
  function GoodComponent({ userId }) {
    const memoizedUserId = useMemo(() => userId.id, [userId.id]);

    useEffect(() => {
      fetchUser(memoizedUserId).then(setUser);
    }, [memoizedUserId]);
  }
}
```

---

## 9. useEffect最佳实践

### 9.1 代码组织最佳实践

**最佳实践1：一个Effect只处理一个关注点**

```javascript
// ❌ 错误：一个Effect处理多个关注点
function BadComponent({ userId, theme }) {
  useEffect(() => {
    // 关注点1：获取用户数据
    fetchUser(userId).then(setUser);
    
    // 关注点2：设置主题
    document.body.className = theme;
    
    // 关注点3：订阅事件
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [userId, theme]);
}

// ✅ 正确：拆分为多个Effect
function GoodComponent({ userId, theme }) {
  // 关注点1：获取用户数据
  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);

  // 关注点2：设置主题
  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  // 关注点3：订阅事件
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
}
```

**最佳实践2：使用自定义Hook封装复杂Effect**

```javascript
// ❌ 错误：在组件中编写复杂Effect
function BadComponent({ url }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        const result = await fetch(url);
        const json = await result.json();

        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [url]);

  return <div>{JSON.stringify(data)}</div>;
}

// ✅ 正确：使用自定义Hook封装
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        const result = await fetch(url);
        const json = await result.json();

        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [url]);

  return { data, loading, error };
}

function GoodComponent({ url }) {
  const { data, loading, error } = useFetch(url);

  return <div>{JSON.stringify(data)}</div>;
}
```

### 9.2 错误处理最佳实践

**最佳实践1：使用try-catch捕获错误**

```javascript
// ❌ 错误：不处理错误
function BadComponent() {
  useEffect(() => {
    riskyOperation(); // 可能抛出错误
  }, []);

  return <div>内容</div>;
}

// ✅ 正确：使用try-catch
function GoodComponent() {
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      riskyOperation();
    } catch (err) {
      setError(err);
    }
  }, []);

  if (error) {
    return <div>错误: {error.message}</div>;
  }

  return <div>内容</div>;
}
```

**最佳实践2：使用错误边界**

```javascript
// ❌ 错误：Effect中的错误不会被捕获
function BadComponent() {
  useEffect(() => {
    throw new Error('Error in useEffect');
  }, []);

  return <div>内容</div>;
}

// ✅ 正确：使用错误边界
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <h1>出错了</h1>;
    }

    return this.props.children;
  }
}

function GoodComponent() {
  return (
    <ErrorBoundary>
      <Component />
    </ErrorBoundary>
  );
}
```

### 9.3 测试最佳实践

**最佳实践1：测试Effect的执行**

```javascript
// ❌ 错误：不测试Effect
function BadComponent() {
  useEffect(() => {
    console.log('Effect执行');
  }, []);

  return <div>内容</div>;
}

// ✅ 正确：测试Effect
function GoodComponent() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log('count变化:', count);
  }, [count]);

  return <div>{count}</div>;
}

// 测试
test('useEffect在count变化时执行', () => {
  const consoleSpy = jest.spyOn(console, 'log');
  render(<GoodComponent count={0} />);
  expect(consoleSpy).toHaveBeenCalledWith('count变化: 0');
  
  render(<GoodComponent count={1} />);
  expect(consoleSpy).toHaveBeenCalledWith('count变化: 1');
});
```

**最佳实践2：测试Effect的清理**

```javascript
// 测试Effect的清理函数
test('useEffect在组件卸载时清理', () => {
  const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
  const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

  const { unmount } = render(<WindowSize />);
  expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

  unmount();
  expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function);
});
```

---

## 10. useEffect的未来

### 10.1 React 19的改进

**React 19的useEffect改进**：

```javascript
// React 19的新特性：useEffect的改进
// 1. 更好的性能优化
// 2. 更智能的依赖数组
// 3. 更好的错误处理

// React 19的新API：useEffectEvent（实验性）
function Component({ onAction }) {
  const onActionRef = useEffectEvent(() => {
    onAction();
  });

  useEffect(() => {
    window.addEventListener('click', onActionRef);
    return () => window.removeEventListener('click', onActionRef);
  }, []);

  return <div>内容</div>;
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

本文档全面深入解析了React useEffect Hook，包括：

1. **useEffect概述**：设计哲学、与类组件生命周期对比、执行时机
2. **useEffect基础用法**：基础语法、无依赖数组、空依赖数组、依赖数组
3. **依赖数组深度解析**：工作原理、Object.is比较算法、常见陷阱、最佳实践
4. **清理函数深度解析**：执行时机、订阅和事件监听、定时器、异步操作
5. **useEffect与性能优化**：避免不必要的Effect执行、useCallback优化、useMemo优化、Effect的拆分与组合
6. **useEffect高级模式**：基于状态、属性、副作用的Effect、错误边界
7. **useEffect与useLayoutEffect对比**：执行时机、使用场景、性能影响
8. **useEffect经典面试题**：基础、进阶、复杂面试题
9. **useEffect最佳实践**：代码组织、错误处理、测试
10. **useEffect的未来**：React 19的改进、新的API和模式

这些内容可以帮助你更好地理解和使用useEffect，掌握React的核心知识点。