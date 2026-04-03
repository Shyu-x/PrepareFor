# React Hooks深入

## 目录

1. [useState与useEffect](#1-usestate与useeffect)
2. [useContext与useReducer](#2-usecontext与usereducer)
3. [useMemo与useCallback](#3-usememo与usecallback)
4. [自定义Hooks](#4-自定义hooks)
5. [Hooks规则](#5-hooks规则)

---

## 1. useState与useEffect

### 1.1 useState 详解

```jsx
import { useState } from 'react';

// 基础用法
function Counter() {
    const [count, setCount] = useState(0);

    return (
        <div>
            <p>计数: {count}</p>
            <button onClick={() => setCount(count + 1)}>+1</button>
            <button onClick={() => setCount(c => c + 1)}>+1 (函数式)</button>
        </div>
    );
}

// 多个状态
function Form() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [age, setAge] = useState(0);

    return (
        <form>
            <input value={name} onChange={e => setName(e.target.value)} />
            <input value={email} onChange={e => setEmail(e.target.value)} />
            <input type="number" value={age} onChange={e => setAge(+e.target.value)} />
        </form>
    );
}

// 对象状态
function Profile() {
    const [user, setUser] = useState({
        name: '',
        email: '',
        bio: ''
    });

    const updateField = (field, value) => {
        setUser(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <div>
            <input
                value={user.name}
                onChange={e => updateField('name', e.target.value)}
            />
        </div>
    );
}

// 状态延迟初始化
function ExpensiveComponent() {
    // 只有组件首次渲染时执行
    const [data, setData] = useState(() => {
        const saved = localStorage.getItem('data');
        return saved ? JSON.parse(saved) : computeExpensiveValue();
    });

    return <div>{data}</div>;
}

function computeExpensiveValue() {
    // 复杂计算
    return 'expensive result';
}
```

### 1.2 useEffect 详解

```jsx
import { useState, useEffect } from 'react';

// 基础用法：每次渲染后执行
function App() {
    const [count, setCount] = useState(0);

    useEffect(() => {
        console.log('组件已更新');
    });

    return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}

// 空依赖数组：只在挂载时执行一次
function DataFetcher() {
    const [data, setData] = useState(null);

    useEffect(() => {
        fetch('/api/data')
            .then(r => r.json())
            .then(setData);

        // 清理函数：组件卸载时执行
        return () => {
            console.log('清理');
        };
    }, []); // 空数组

    return <div>{data}</div>;
}

// 依赖数组：指定变量变化时执行
function UserProfile({ userId }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetch(`/api/users/${userId}`)
            .then(r => r.json())
            .then(setUser);
    }, [userId]); // userId 变化时重新执行

    return <div>{user?.name}</div>;
}

// 多个 useEffect：按顺序执行
function App() {
    useEffect(() => {
        console.log('Effect 1');
    }, []);

    useEffect(() => {
        console.log('Effect 2');
    }, []);

    return <div>App</div>;
    // 输出: Effect 1 -> Effect 2
}
```

### 1.3 useEffect 实战

```jsx
// 1. 数据获取
function UserList() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function fetchUsers() {
            try {
                const response = await fetch('/api/users');
                const data = await response.json();

                if (!cancelled) {
                    setUsers(data);
                    setLoading(false);
                }
            } catch (error) {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        fetchUsers();

        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) return <div>加载中...</div>;

    return (
        <ul>
            {users.map(user => (
                <li key={user.id}>{user.name}</li>
            ))}
        </ul>
    );
}

// 2. 订阅
function ChatRoom({ roomId }) {
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        const subscription = chat.subscribe(roomId, {
            onMessage: (message) => {
                setMessages(prev => [...prev, message]);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [roomId]);

    return <div>{/* 消息列表 */}</div>;
}

// 3. 定时器
function Timer() {
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setSeconds(s => s + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return <div>已运行: {seconds} 秒</div>;
}

// 4. 监听窗口大小
function WindowSize() {
    const [size, setSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });

    useEffect(() => {
        function handleResize() {
            setSize({
                width: window.innerWidth,
                height: window.innerHeight
            });
        }

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return <div>{size.width} x {size.height}</div>;
}
```

---

## 2. useContext与useReducer

### 2.1 useContext 详解

```jsx
import { createContext, useContext, useState } from 'react';

// 1. 创建 Context
const ThemeContext = createContext();
const UserContext = createContext();

// 2. 提供 Context
function App() {
    const [theme, setTheme] = useState('light');
    const [user, setUser] = useState({ name: '张三' });

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            <UserContext.Provider value={user}>
                <Layout />
            </UserContext.Provider>
        </ThemeContext.Provider>
    );
}

// 3. 使用 Context
function Layout() {
    return (
        <div>
            <Header />
            <Main />
        </div>
    );
}

function Header() {
    const { theme, setTheme } = useContext(ThemeContext);

    return (
        <header className={theme}>
            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
                切换主题
            </button>
        </header>
    );
}

function Main() {
    const user = useContext(UserContext);

    return <main>欢迎, {user.name}</main>;
}
```

### 2.2 useReducer 详解

```jsx
import { useReducer } from 'react';

// 定义 reducer
function counterReducer(state, action) {
    switch (action.type) {
        case 'increment':
            return { count: state.count + 1 };
        case 'decrement':
            return { count: state.count - 1 };
        case 'reset':
            return { count: 0 };
        default:
            return state;
    }
}

function Counter() {
    const [state, dispatch] = useReducer(counterReducer, { count: 0 });

    return (
        <div>
            <p>计数: {state.count}</p>
            <button onClick={() => dispatch({ type: 'increment' })}>+1</button>
            <button onClick={() => dispatch({ type: 'decrement' })}>-1</button>
            <button onClick={() => dispatch({ type: 'reset' })}>重置</button>
        </div>
    );
}

// 复杂示例：表单验证
const initialState = {
    values: { name: '', email: '' },
    errors: { name: '', email: '' },
    isValid: false
};

function formReducer(state, action) {
    switch (action.type) {
        case 'SET_VALUE':
            return {
                ...state,
                values: {
                    ...state.values,
                    [action.field]: action.value
                }
            };
        case 'SET_ERROR':
            return {
                ...state,
                errors: {
                    ...state.errors,
                    [action.field]: action.error
                }
            };
        case 'VALIDATE':
            const errors = {};
            let isValid = true;

            if (!state.values.name) {
                errors.name = '名称必填';
                isValid = false;
            }
            if (!state.values.email.includes('@')) {
                errors.email = '邮箱格式不正确';
                isValid = false;
            }

            return { ...state, errors, isValid };
        case 'RESET':
            return initialState;
        default:
            return state;
    }
}

function Form() {
    const [state, dispatch] = useReducer(formReducer, initialState);

    const handleChange = (field) => (e) => {
        dispatch({ type: 'SET_VALUE', field, value: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch({ type: 'VALIDATE' });

        if (state.isValid) {
            console.log('提交:', state.values);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                value={state.values.name}
                onChange={handleChange('name')}
            />
            {state.errors.name && <span>{state.errors.name}</span>}

            <input
                value={state.values.email}
                onChange={handleChange('email')}
            />
            {state.errors.email && <span>{state.errors.email}</span>}

            <button type="submit">提交</button>
        </form>
    );
}
```

---

## 3. useMemo与useCallback

### 3.1 useMemo

```jsx
import { useMemo } from 'react';

// 基础用法
function App() {
    const [a, setA] = useState(1);
    const [b, setB] = useState(2);

    // 只有 a 或 b 变化时才重新计算
    const result = useMemo(() => {
        console.log('计算中...');
        return a + b;
    }, [a, b]);

    return <div>{result}</div>;
}

// 避免不必要的计算
function ExpensiveComponent({ items, filter }) {
    // 只有 items 或 filter 变化时才重新过滤
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

// 保持引用相等性
function Parent() {
    const [count, setCount] = useState(0);

    // 避免每次渲染都创建新对象
    const options = useMemo(() => ({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 1 })
    }), []); // 空依赖，只创建一次

    return <Child options={options} count={count} />;
}
```

### 3.2 useCallback

```jsx
import { useCallback } from 'react';

// useCallback(fn, deps) 等价于 useMemo(() => fn, deps)

function App() {
    const [count, setCount] = useState(0);

    // 每次渲染都会创建新函数
    const handleClick = () => {
        console.log(count);
    };

    // 只有 count 变化时才创建新函数
    const handleClickMemoized = useCallback(() => {
        console.log(count);
    }, [count]);

    return (
        <div>
            <button onClick={handleClick}>点击1</button>
            <button onClick={handleClickMemoized}>点击2</button>
        </div>
    );
}

// 配合 React.memo 使用
const Child = React.memo(({ onClick, data }) => {
    console.log('Child 渲染');
    return <button onClick={onClick}>{data.label}</button>;
});

function Parent() {
    const [count, setCount] = useState(0);

    // 每次渲染都创建新函数，导致 Child 不必要的重渲染
    const handleClick = () => {
        console.log('click');
    };

    // 使用 useCallback 保持函数引用不变
    const handleClickCallback = useCallback(() => {
        console.log('click');
    }, []);

    return (
        <div>
            <Child onClick={handleClick} data={{ label: '按钮' }} />
            <button onClick={() => setCount(c => c + 1)}>{count}</button>
        </div>
    );
}
```

### 3.3 useMemo vs useCallback 选择

```jsx
// 经验法则：
// - 函数传给子组件 -> useCallback
// - 计算结果传给子组件 -> useMemo
// - 简单计算不需要 useMemo（可能更慢）

// 正确使用
function App() {
    const [count, setCount] = useState(0);

    // 传给子组件的函数
    const handleSubmit = useCallback((data) => {
        console.log('提交', data);
    }, []);

    // 传给子组件的对象
    const config = useMemo(() => ({
        timeout: 5000,
        retry: 3
    }), []);

    return <Form onSubmit={handleSubmit} config={config} />;
}
```

---

## 4. 自定义Hooks

### 4.1 自定义 Hook 基础

```jsx
import { useState, useEffect } from 'react';

// 自定义 Hook：窗口大小
function useWindowSize() {
    const [size, setSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });

    useEffect(() => {
        function handleResize() {
            setSize({
                width: window.innerWidth,
                height: window.innerHeight
            });
        }

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return size;
}

// 使用自定义 Hook
function App() {
    const { width, height } = useWindowSize();

    return (
        <div>
            窗口大小: {width} x {height}
        </div>
    );
}
```

### 4.2 更多自定义 Hook

```jsx
// 1. 异步数据获取
function useFetch(url) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function fetchData() {
            try {
                setLoading(true);
                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error('请求失败');
                }

                const json = await response.json();

                if (!cancelled) {
                    setData(json);
                    setError(null);
                }
            } catch (error) {
                if (!cancelled) {
                    setError(error.message);
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

// 使用
function UserList() {
    const { data, loading, error } = useFetch('/api/users');

    if (loading) return <div>加载中...</div>;
    if (error) return <div>错误: {error}</div>;

    return <ul>{data.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}

// 2. 本地存储
function useLocalStorage(key, initialValue) {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            return initialValue;
        }
    });

    const setValue = (value) => {
        try {
            const valueToStore = value instanceof Function
                ? value(storedValue)
                : value;

            setStoredValue(valueToStore);

            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(error);
        }
    };

    return [storedValue, setValue];
}

// 使用
function App() {
    const [name, setName] = useLocalStorage('name', '');

    return (
        <input
            value={name}
            onChange={e => setName(e.target.value)}
        />
    );
}

// 3. 轮询
function usePolling(fn, interval, enabled = true) {
    useEffect(() => {
        if (!enabled) return;

        const id = setInterval(fn, interval);

        return () => clearInterval(id);
    }, [fn, interval, enabled]);
}

// 4. 媒体查询
function useMediaQuery(query) {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);

        if (media.matches !== matches) {
            setMatches(media.matches);
        }

        const listener = () => setMatches(media.matches);
        media.addEventListener('change', listener);

        return () => media.removeEventListener('change', listener);
    }, [matches, query]);

    return matches;
}

// 使用
function ResponsiveComponent() {
    const isMobile = useMediaQuery('(max-width: 768px)');

    return <div>{isMobile ? '移动端' : '桌面端'}</div>;
}
```

---

## 5. Hooks规则

### 5.1 规则详解

```jsx
// 规则1：只在顶层调用 Hooks
function BadComponent() {
    // ❌ 错误：在条件语句中调用
    if (condition) {
        const [state, setState] = useState(0);
    }

    // ❌ 错误：在循环中调用
    for (let i = 0; i < 3; i++) {
        const [state, setState] = useState(0);
    }

    // ✅ 正确：始终在顶层调用
    const [a, setA] = useState(0);
    const [b, setB] = useState(0);
    const [c, setC] = useState(0);
}

// 规则2：只在 React 函数中调用
// ✅ 在函数组件中
function Component() {
    const [state, setState] = useState(0);
}

// ✅ 在自定义 Hook 中
function useCustomHook() {
    const [state, setState] = useState(0);
}

// ❌ 普通函数中不能调用
function regularFunction() {
    const [state, setState] = useState(0); // 错误！
}

// ✅ 类组件中不能使用 Hook
class ClassComponent extends React.Component {
    render() {
        // 不能使用 useState
        return <div>Class Component</div>;
    }
}
```

### 5.2 ESLint 规则

```javascript
// 安装 eslint-plugin-react-hooks
// npm install eslint-plugin-react-hooks --save-dev

// .eslintrc.js
module.exports = {
    plugins: ['react-hooks'],
    rules: {
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn'
    }
};
```

### 5.3 常见面试问题

**问题1：React Hooks 有哪些规则？**

答案：
1. 只在顶层调用 Hooks（不要在循环、条件、嵌套函数中调用）
2. 只在 React 函数或自定义 Hook 中调用 Hooks
3. 使用 ESLint 插件自动检查

**问题2：useEffect 和 useLayoutEffect 有什么区别？**

答案：
- useEffect：异步执行，在浏览器绘制后执行
- useLayoutEffect：同步执行，在 DOM 改变后、浏览器绘制前执行
- 需要立即操作 DOM 时使用 useLayoutEffect，否则使用 useEffect

---

## 6. useRef 与其他 Hooks

### 6.1 useRef

```jsx
import { useRef, useEffect } from 'react';

// 1. 访问 DOM 元素
function TextInput() {
    const inputRef = useRef(null);

    const focusInput = () => {
        inputRef.current.focus();
    };

    return (
        <div>
            <input ref={inputRef} type="text" />
            <button onClick={focusInput}>聚焦</button>
        </div>
    );
}

// 2. 存储可变值（不触发重渲染）
function Timer() {
    const countRef = useRef(0);
    const timerRef = useRef(null);

    useEffect(() => {
        timerRef.current = setInterval(() => {
            countRef.current++;
            console.log(countRef.current);
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, []);

    return <div>计时器运行中...</div>;
}

// 3. 保存上一次的 value
function usePrevious(value) {
    const ref = useRef();

    useEffect(() => {
        ref.current = value;
    }, [value]);

    return ref.current;
}

function Counter() {
    const [count, setCount] = useState(0);
    const previousCount = usePrevious(count);

    return (
        <div>
            <p>当前: {count}</p>
            <p>上次: {previousCount}</p>
            <button onClick={() => setCount(c => c + 1)}>+1</button>
        </div>
    );
}
```

### 6.2 useImperativeHandle

```jsx
import { forwardRef, useImperativeHandle, useRef } from 'react';

// 暴露给父组件的方法
const Child = forwardRef((props, ref) => {
    const inputRef = useRef();

    useImperativeHandle(ref, () => ({
        focus: () => {
            inputRef.current.focus();
        },
        getValue: () => {
            return inputRef.current.value;
        },
        clear: () => {
            inputRef.current.value = '';
        }
    }));

    return <input ref={inputRef} />;
});

// 父组件使用
function Parent() {
    const childRef = useRef();

    const handleClick = () => {
        childRef.current.focus();
        console.log(childRef.current.getValue());
    };

    return (
        <div>
            <Child ref={childRef} />
            <button onClick={handleClick}>操作子组件</button>
        </div>
    );
}
```

### 6.3 useTransition 与 useDeferredValue

```jsx
import { useTransition, useDeferredValue } from 'react';

// useTransition：标记非紧急更新
function SearchResults() {
    const [query, setQuery] = useState('');
    const [isPending, startTransition] = useTransition();

    const handleChange = (e) => {
        // 标记为非紧急更新
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

// useDeferredValue：延迟非紧急值
function SearchResults({ query }) {
    // query 变化时会延迟处理
    const deferredQuery = useDeferredValue(query);

    return <ExpensiveComponent query={deferredQuery} />;
}
```

---

## 7. Hooks 进阶：深入原理与高级用法

### 7.1 useState 的原理与陷阱

```jsx
import React, { useState, useRef, useEffect } from 'react';

// useState 原理简析
// useState 返回的 setState 是异步的，会被批量处理
// 这意味着调用 setState 后，state 不会立即更新

function StatePrinciple() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    // 错误理解：console.log 会立即显示更新后的值
    setCount(count + 1);
    console.log(count); // 这里仍然是旧值！

    // 正确做法：使用 useEffect 监听变化
  };

  useEffect(() => {
    console.log('count 已更新为:', count);
  }, [count]);

  return <button onClick={handleClick}>点击 {count}</button>;
}

// setState 的两种形式
function SetStateForms() {
  const [obj, setObj] = useState({ count: 0, name: '张三' });

  // 形式1：直接传递新值
  const updateDirect = () => {
    // 这种方式会完全替换 obj，而不是合并
    setObj({ count: obj.count + 1 });
    // obj 变成了 { count: 1 }，name 丢失了！
  };

  // 形式2：函数式更新（推荐）
  const updateFunctional = () => {
    setObj(prev => ({
      ...prev, // 使用展开运算符合并
      count: prev.count + 1
    }));
  };

  return (
    <div>
      <p>计数: {obj.count}, 姓名: {obj.name}</p>
      <button onClick={updateDirect}>直接更新（会丢失name）</button>
      <button onClick={updateFunctional}>函数式更新（保留name）</button>
    </div>
  );
}

// 延迟初始化：只有首次渲染时计算初始值
function LazyInit() {
  // 如果 initialState 是复杂计算，每次渲染都会执行
  const [data, setData] = useState(computeExpensiveValue()); // ❌ 不推荐

  // 使用函数形式，只有首次渲染时执行
  const [dataLazy, setDataLazy] = useState(() => computeExpensiveValue()); // ✅ 推荐
  // 或者
  const [dataLazy2, setDataLazy2] = useState(() => {
    // 可以访问 localStorage、cookie 等
    const saved = localStorage.getItem('data');
    return saved ? JSON.parse(saved) : computeExpensiveValue();
  });

  return <div>{dataLazy}</div>;
}

function computeExpensiveValue() {
  // 模拟复杂计算
  console.log('执行复杂计算...');
  return '计算结果';
}
```

### 7.2 useEffect 的深度解析

```jsx
import { useState, useEffect, useRef } from 'react';

// useEffect 执行时机
function EffectTiming() {
  const [count, setCount] = useState(0);

  // 1. 组件首次渲染后执行
  useEffect(() => {
    console.log('首次渲染后执行 - 类似 componentDidMount');
  }, []);

  // 2. 每次渲染后都执行
  useEffect(() => {
    console.log('每次渲染后都执行');
  });

  // 3. count 变化时执行
  useEffect(() => {
    console.log('count 变化时执行:', count);
  }, [count]);

  // 4. 清理函数
  useEffect(() => {
    const timer = setInterval(() => {
      console.log('定时器运行');
    }, 1000);

    // 返回清理函数：组件卸载或下一次 effect 执行前
    return () => {
      console.log('清理定时器');
      clearInterval(timer);
    };
  }, []);

  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}

// 常见的 useEffect 错误
function CommonMistakes() {
  const [data, setData] = useState(null);

  // 错误1：忘记包含依赖
  useEffect(() => {
    fetchData().then(setData);
  // 缺少 [data] 依赖，导致警告
  // React.useEffect has a missing dependency: 'data'
  }, []); // ❌

  // 正确：明确声明依赖
  useEffect(() => {
    fetchData().then(setData);
  }, []); // ✅ data 只在初始化时需要

  // 错误2：在 effect 中直接修改 state 导致无限循环
  useEffect(() => {
    if (data) {
      // 错误：修改依赖项会导致无限循环
      setData(transformData(data));
    }
  }, [data]); // ❌ 无限循环！

  // 正确：使用 useMemo 替代
  const transformedData = useMemo(() => {
    return data ? transformData(data) : null;
  }, [data]); // ✅

  // 错误3：使用 async 函数作为 effect
  useEffect(async () => {
    const response = await fetch('/api/data');
    const json = await response.json();
    setData(json);
  }, []); // ❌ async 函数返回的是 Promise，不是清理函数

  // 正确：在 effect 内部定义 async 函数
  useEffect(() => {
    async function fetchData() {
      const response = await fetch('/api/data');
      const json = await response.json();
      setData(json);
    }
    fetchData();
  }, []); // ✅

  return <div>{data}</div>;
}

function fetchData() {
  return Promise.resolve({ id: 1 });
}

function transformData(data) {
  return data;
}
```

### 7.3 useRef 的高级用法

```jsx
import { useState, useEffect, useRef, useCallback } from 'react';

// useRef 的两种用途
function RefUsages() {
  // 用途1：存储不需要触发重渲染的值
  const timerRef = useRef(null);
  const countRef = useRef(0);

  // 用途2：访问 DOM 元素
  const inputRef = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    // 聚焦输入框
    inputRef.current?.focus();

    // 获取 DOM 尺寸
    const rect = boxRef.current?.getBoundingClientRect();
    console.log('盒子尺寸:', rect);
  }, []);

  return (
    <div>
      <input ref={inputRef} />
      <div ref={boxRef} style={{ width: 100, height: 100 }} />
    </div>
  );
}

// 实战：用 ref 实现定时器（不影响渲染性能）
function TimerWithRef() {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, []);

  return <div>已运行: {seconds} 秒</div>;
}

// 实战：用 ref 保存上一次的值
function usePrevious(value) {
  const ref = useRef();

  // 每次渲染后更新 ref
  useEffect(() => {
    ref.current = value;
  });

  // 返回的是上一次的 value
  return ref.current;
}

function PreviousValueDemo() {
  const [count, setCount] = useState(0);
  const previousCount = usePrevious(count);

  return (
    <div>
      <p>当前: {count}</p>
      <p>上次: {previousCount}</p>
      <button onClick={() => setCount(c => c + 1)}>增加</button>
    </div>
  );
}

// 实战：测量 DOM 尺寸变化
function useMeasure(ref) {
  const [bounds, setBounds] = useState({ left: 0, top: 0, width: 0, height: 0 });

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      setBounds(entry.contentRect);
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);

  return bounds;
}

function MeasurableComponent() {
  const ref = useRef(null);
  const bounds = useMeasure(ref);

  return (
    <div>
      <div ref={ref} style={{ width: '100%', height: 200, background: 'lightblue' }}>
        测量这个元素
      </div>
      <p>尺寸: {bounds.width} x {bounds.height}</p>
    </div>
  );
}

// 实战：保存回调函数（避免闭包陷阱）
function useEventCallback(fn) {
  const ref = useRef(fn);

  // 更新 ref.current 为最新的函数
  useEffect(() => {
    ref.current = fn;
  });

  // 返回一个函数，调用最新的 fn
  return useCallback((...args) => {
    return ref.current(...args);
  }, []);
}

function EventCallbackDemo() {
  const [value, setValue] = useState('初始值');

  // 这个回调函数会始终使用最新的 value
  const handleClick = useEventCallback(() => {
    console.log('当前值:', value);
  });

  return (
    <div>
      <button onClick={handleClick}>打印当前值</button>
      <button onClick={() => setValue('新值')}>修改值</button>
    </div>
  );
}
```

### 7.4 useReducer 的高级模式

```jsx
import { useReducer, useContext, createContext, useCallback } from 'react';

// 标准 reducer 模式
function standardReducer(state, action) {
  switch (action.type) {
    case 'INCREMENT':
      return { ...state, count: state.count + 1 };
    case 'DECREMENT':
      return { ...state, count: state.count - 1 };
    case 'SET_USER':
      return { ...state, user: action.payload };
    default:
      return state;
  }
}

// 使用 useReducer 实现 todo list
const initialState = {
  todos: [],
  filter: 'all', // all, active, completed
  loading: false
};

function todoReducer(state, action) {
  switch (action.type) {
    case 'LOAD_TODOS':
      return { ...state, todos: action.payload, loading: false };

    case 'ADD_TODO':
      return {
        ...state,
        todos: [...state.todos, action.payload]
      };

    case 'TOGGLE_TODO':
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === action.payload
            ? { ...todo, completed: !todo.completed }
            : todo
        )
      };

    case 'DELETE_TODO':
      return {
        ...state,
        todos: state.todos.filter(todo => todo.id !== action.payload)
      };

    case 'SET_FILTER':
      return { ...state, filter: action.payload };

    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    default:
      return state;
  }
}

// 使用 useReducer 的组件
function TodoApp() {
  const [state, dispatch] = useReducer(todoReducer, initialState);
  const [input, setInput] = useState('');

  const addTodo = useCallback(() => {
    if (!input.trim()) return;
    dispatch({
      type: 'ADD_TODO',
      payload: {
        id: Date.now(),
        text: input.trim(),
        completed: false
      }
    });
    setInput('');
  }, [input]);

  const filteredTodos = state.todos.filter(todo => {
    if (state.filter === 'active') return !todo.completed;
    if (state.filter === 'completed') return todo.completed;
    return true;
  });

  return (
    <div>
      <input value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={addTodo}>添加</button>

      <div className="filters">
        {['all', 'active', 'completed'].map(f => (
          <button
            key={f}
            className={state.filter === f ? 'active' : ''}
            onClick={() => dispatch({ type: 'SET_FILTER', payload: f })}
          >
            {f}
          </button>
        ))}
      </div>

      <ul>
        {filteredTodos.map(todo => (
          <li
            key={todo.id}
            className={todo.completed ? 'completed' : ''}
            onClick={() => dispatch({ type: 'TOGGLE_TODO', payload: todo.id })}
          >
            {todo.text}
            <button
              onClick={(e) => {
                e.stopPropagation();
                dispatch({ type: 'DELETE_TODO', payload: todo.id });
              }}
            >
              删除
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Context + useReducer 实现全局状态
const AppContext = createContext();

function AppProvider({ children }) {
  const [state, dispatch] = useReducer(
    combineReducers({
      user: userReducer,
      theme: themeReducer,
      notifications: notificationReducer
    }),
    initialAppState
  );

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

function combineReducers(reducers) {
  return function combinedReducer(state = {}, action) {
    const nextState = {};
    let hasChanged = false;

    for (const key in reducers) {
      const reducer = reducers[key];
      const previousStateForKey = state[key];
      const nextStateForKey = reducer(previousStateForKey, action);
      nextState[key] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    }

    return hasChanged ? nextState : state;
  };
}
```

### 7.5 自定义 Hooks 最佳实践

```jsx
import { useState, useEffect, useCallback, useRef } from 'react';

// 1. useDebounce - 防抖
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// 使用防抖进行搜索
function SearchComponent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) {
      fetch(`/api/search?q=${debouncedQuery}`)
        .then(res => res.json())
        .then(setResults);
    }
  }, [debouncedQuery]);

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      {results.map(r => <div key={r.id}>{r.name}</div>)}
    </div>
  );
}

// 2. useThrottle - 节流
function useThrottle(value, interval) {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastExecuted = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    if (now - lastExecuted.current >= interval) {
      lastExecuted.current = now;
      setThrottledValue(value);
    } else {
      const timer = setTimeout(() => {
        lastExecuted.current = Date.now();
        setThrottledValue(value);
      }, interval - (now - lastExecuted.current));
      return () => clearTimeout(timer);
    }
  }, [value, interval]);

  return throttledValue;
}

// 3. useClickOutside - 检测点击外部
function useClickOutside(ref, handler) {
  useEffect(() => {
    function handleClick(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        handler();
      }
    }

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [ref, handler]);
}

// 4. useMediaQuery - 响应式
function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    const handler = (event) => setMatches(event.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// 5. useAsync - 异步状态管理
function useAsync(asyncFn, deps = []) {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    let cancelled = false;

    async function execute() {
      setState({ data: null, loading: true, error: null });
      try {
        const result = await asyncFn();
        if (!cancelled) {
          setState({ data: result, loading: false, error: null });
        }
      } catch (error) {
        if (!cancelled) {
          setState({ data: null, loading: false, error });
        }
      }
    }

    execute();

    return () => {
      cancelled = true;
    };
  }, deps);

  return state;
}

// 6. useInterval - 定时器（正确处理清理）
function useInterval(callback, delay) {
  const savedCallback = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const tick = () => {
      savedCallback.current();
    };

    const id = setInterval(tick, delay);
    return () => clearInterval(id);
  }, [delay]);
}

// 7. useHover - 悬停状态
function useHover() {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef(null);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  useEffect(() => {
    const node = ref.current;
    if (node) {
      node.addEventListener('mouseenter', handleMouseEnter);
      node.addEventListener('mouseleave', handleMouseLeave);
      return () => {
        node.removeEventListener('mouseenter', handleMouseEnter);
        node.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [handleMouseEnter, handleMouseLeave]);

  return [ref, isHovered];
}
```

### 7.6 React 18 useTransition 与 useDeferredValue 进阶

```jsx
import { useTransition, useDeferredValue, useState, useMemo } from 'react';

// useTransition - 标记非紧急更新
function TransitionExample() {
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  // 模拟大量数据过滤
  const largeDataset = useMemo(() => {
    return Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      name: `项目 ${i}`,
      category: ['A', 'B', 'C'][i % 3]
    }));
  }, []);

  function handleChange(e) {
    const value = e.target.value;
    setQuery(value);

    // 标记为非紧急更新，让搜索框立即响应
    startTransition(() => {
      // 这部分更新会被标记为非紧急
      const filtered = largeDataset.filter(item =>
        item.name.includes(value)
      );
      setResults(filtered);
    });
  }

  return (
    <div>
      <input value={query} onChange={handleChange} />
      {isPending && <div>加载中...</div>}
      <div>找到 {results.length} 个结果</div>
    </div>
  );
}

// useDeferredValue - 延迟非紧急值
function DeferredExample() {
  const [query, setQuery] = useState('');

  // query 变化时，deferredQuery 会延迟更新
  const deferredQuery = useDeferredValue(query);

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <SlowList text={deferredQuery} />
    </div>
  );
}

function SlowList({ text }) {
  // 这个组件会使用延迟的值，允许 UI 先更新
  const items = useMemo(() => {
    return Array.from({ length: 1000 }, (_, i) => (
      <div key={i}>{text} - 项目 {i}</div>
    ));
  }, [text]);

  return <div>{items}</div>;
}

// 组合使用
function CombinedExample() {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  // 延迟查询值
  const deferredQuery = useDeferredValue(query);

  function handleInputChange(e) {
    const value = e.target.value;
    setInput(value);

    // 输入变化立即反映到 input
    // 查询结果标记为 transition
    startTransition(() => {
      setQuery(value);
    });
  }

  return (
    <div>
      <input value={input} onChange={handleInputChange} />
      {isPending ? <Spinner /> : <Results query={deferredQuery} />}
    </div>
  );
}

function Spinner() {
  return <div>加载中...</div>;
}

function Results({ query }) {
  return <div>搜索结果: {query}</div>;
}
```

### 7.7 React 19 use() Hook

```jsx
import { use, useState, Suspense } from 'react';

// use() - 消费 Promise
function UserProfile({ userPromise }) {
  // 直接使用 Promise，React 会自动处理加载状态
  // 这比 useEffect + use state 更简洁
  const user = use(userPromise);

  return <div>{user.name}</div>;
}

// use() - 消费 Context
function ThemedButton() {
  // use() 可以直接消费 Context，无需 useContext
  // 这在深层嵌套组件中特别有用
  const theme = use(ThemeContext);

  return <button className={theme}>点击</button>;
}

// use() - 结合 Suspense
function App() {
  const userPromise = fetchUser();

  return (
    <Suspense fallback={<div>加载中...</div>}>
      <UserProfile userPromise={userPromise} />
    </Suspense>
  );
}
```

---

## 8. React 19 新 Hooks 完整指南

### 8.1 useActionState - 表单状态管理

```tsx
import { useActionState } from 'react';

// 定义 action 函数（可以在服务端执行）
async function submitForm(prevState, formData) {
  const name = formData.get('name');
  const email = formData.get('email');

  // 服务端验证
  if (!name || !email) {
    return { error: '请填写所有字段', success: false };
  }

  // 提交到 API
  const response = await fetch('/api/submit', {
    method: 'POST',
    body: JSON.stringify({ name, email })
  });

  if (!response.ok) {
    return { error: '提交失败', success: false };
  }

  return { error: null, success: true };
}

// 使用 useActionState
function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitForm, null);

  if (state?.success) {
    return <div>提交成功！</div>;
  }

  return (
    <form action={formAction}>
      <input name="name" placeholder="姓名" />
      <input name="email" placeholder="邮箱" type="email" />

      {state?.error && <div className="error">{state.error}</div>}

      <button type="submit" disabled={isPending}>
        {isPending ? '提交中...' : '提交'}
      </button>
    </form>
  );
}
```

### 8.2 useOptimistic - 乐观更新

```tsx
import { useOptimistic, useState, useTransition } from 'react';

function LikeButton({ initialLikes, onLike }) {
  const [likes, setLikes] = useState(initialLikes);

  // 乐观更新：UI 立即更新，服务器同步
  const [optimisticLikes, addOptimistic] = useOptimistic(
    likes,
    // 乐观更新函数
    (currentLikes, pendingValue) => currentLikes + pendingValue
  );

  const [isPending, startTransition] = useTransition();

  async function handleLike() {
    // 立即更新 UI
    addOptimistic(1);

    // 后台同步到服务器
    startTransition(async () => {
      try {
        await onLike();
        setLikes(likes + 1);
      } catch {
        // 失败时乐观更新会自动回滚
      }
    });
  }

  return (
    <button onClick={handleLike} disabled={isPending}>
      👍 {optimisticLikes}
    </button>
  );
}

// 复杂场景：编辑列表
function EditableList() {
  const [items, setItems] = useState([
    { id: 1, text: '项目 A' },
    { id: 2, text: '项目 B' }
  ]);

  const [optimisticItems, updateItemOptimistically] = useOptimistic(
    items,
    (state, { id, text }) =>
      state.map(item =>
        item.id === id ? { ...item, text } : item
      )
  );

  async function handleEdit(id, text) {
    // 立即更新 UI
    updateItemOptimistically({ id, text });

    // 同步到服务器
    await fetch(`/api/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ text })
    });
  }

  return (
    <ul>
      {optimisticItems.map(item => (
        <li key={item.id}>
          <input
            value={item.text}
            onChange={e => handleEdit(item.id, e.target.value)}
          />
        </li>
      ))}
    </ul>
  );
}
```

### 8.3 useFormStatus - 表单状态

```tsx
import { useFormStatus } from 'react';

// 表单提交按钮组件
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? '提交中...' : '提交'}
    </button>
  );
}

// 表单组件
function MyForm({ action }) {
  return (
    <form action={action}>
      <input name="email" type="email" />
      <SubmitButton />
    </form>
  );
}
```

### 8.4 useSyncExternalStore - 外部状态订阅

```tsx
import { useSyncExternalStore } from 'react';

// 订阅浏览器 API
function useWindowSize() {
  const subscribe = (callback) => {
    window.addEventListener('resize', callback);
    return () => window.removeEventListener('resize', callback);
  };

  const getSnapshot = () => ({
    width: window.innerWidth,
    height: window.innerHeight
  });

  const getServerSnapshot = () => ({
    width: 0,
    height: 0
  });

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// 订阅全局状态
function createStore(initialState) {
  let state = initialState;
  const listeners = new Set();

  return {
    getState: () => state,
    setState: (partial) => {
      state = { ...state, ...partial };
      listeners.forEach(listener => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}

const store = createStore({ count: 0, user: null });

function useStore(selector) {
  const state = useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState())
  );
  return state;
}

function Counter() {
  const count = useStore(state => state.count);
  return (
    <div>
      <p>计数: {count}</p>
      <button onClick={() => store.setState({ count: count + 1 })}>+1</button>
    </div>
  );
}
```

---

## 9. Hooks 常见面试题

### 9.1 基础概念面试题

**问题1：React Hooks 的两条核心规则是什么？**

答案：
1. **只在顶层调用 Hooks**：不要在循环、条件语句、嵌套函数中调用 Hooks。这确保了 Hooks 的调用顺序在每次渲染中都是稳定的。
2. **只在 React 函数中调用 Hooks**：只能在函数组件或自定义 Hooks 中调用 Hooks，不能在普通 JavaScript 函数中调用。

**问题2：useState 和 useRef 的区别是什么？**

答案：
| 特性 | useState | useRef |
|------|----------|--------|
| 用途 | 存储触发 UI 更新的状态 | 存储不需要触发更新的值 |
| 更新行为 | 调用 setState 触发重渲染 | 修改 .current 不触发重渲染 |
| 返回值 | [value, setValue] | { current: value } |
| 初始化 | 每次渲染都会执行 | 只在首次渲染执行 |
| 常见用途 | 表单输入、开关状态 | 定时器 ID、DOM 引用、缓存 |

**问题3：useEffect 和 useLayoutEffect 的区别？**

答案：
- `useEffect`：异步执行，在浏览器绘制（paint）后执行
- `useLayoutEffect`：同步执行，在 DOM 变更后、浏览器绘制前立即执行

```tsx
// 使用 useLayoutEffect 的场景：测量 DOM 元素尺寸
function MeasureExample() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    // 同步获取尺寸，避免闪烁
    setWidth(ref.current.offsetWidth);
  }, []);

  return (
    <div ref={ref} style={{ width: '100%' }}>
      宽度: {width}
    </div>
  );
}
```

### 9.2 进阶原理面试题

**问题4：Hooks 的实现原理是什么？**

答案：Hooks 通过链表实现。每次组件渲染时，React 会按顺序遍历 Hooks 链表，根据当前的 hookIndex 获取对应的 Hook 数据。

```javascript
// 简化版的 Hooks 实现
let hooks = null;
let hookIndex = 0;

function useState(initialValue) {
  const hook = hooks[hookIndex] || {
    state: typeof initialValue === 'function' ? initialValue() : initialValue,
    queue: [],
  };

  hooks[hookIndex++] = hook;

  const setState = (action) => {
    hook.state = typeof action === 'function'
      ? action(hook.state)
      : action;
    scheduleUpdate();
  };

  return [hook.state, setState];
}

function render() {
  hooks = [];
  hookIndex = 0;
  Component();
}
```

**问题5：为什么 Hooks 不能在条件语句中使用？**

答案：Hooks 依赖调用顺序来实现状态的关联。如果在条件语句中使用 Hooks，当条件为 false 时，Hook 的调用顺序会发生变化，导致状态错乱。

**问题6：如何正确清理 useEffect 中的订阅？**

答案：
```tsx
// 1. 清理函数返回
useEffect(() => {
  const subscription = eventSource.subscribe(handleMessage);
  return () => subscription.unsubscribe();
}, []);

// 2. 清理异步操作
useEffect(() => {
  let cancelled = false;
  async function fetchData() {
    const response = await fetch('/api/data');
    const data = await response.json();
    if (!cancelled) {
      setData(data);
    }
  }
  fetchData();
  return () => { cancelled = true; };
}, []);

// 3. 清理定时器
useEffect(() => {
  const timer = setInterval(() => setTime(Date.now()), 1000);
  return () => clearInterval(timer);
}, []);
```

### 9.3 性能优化面试题

**问题7：useMemo 和 useCallback 的最佳实践是什么？**

答案：
- `useMemo`：缓存计算结果，当依赖变化时才重新计算
- `useCallback`：缓存函数引用，配合 `React.memo` 避免子组件不必要的重渲染

```tsx
// 何时使用 useMemo
function ExpensiveList({ items, filter }) {
  const filteredItems = useMemo(() => {
    return items.filter(item =>
      item.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [items, filter]);

  return <List items={filteredItems} />;
}

// 何时使用 useCallback
const ChildComponent = React.memo(({ onClick }) => {
  return <button onClick={onClick}>点击</button>;
});

function ParentComponent() {
  const [count, setCount] = useState(0);

  // 传递给 memoized 子组件的回调
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);

  return <ChildComponent onClick={handleClick} />;
}
```

**问题8：React.memo、useMemo、useCallback 有什么区别？**

答案：
- `React.memo`：高阶组件，包装子组件，通过浅比较 props 决定是否重渲染
- `useMemo`：Hook，缓存计算结果
- `useCallback`：Hook，缓存函数引用，本质是 `useMemo(() => fn, deps)`

### 9.4 自定义 Hooks 面试题

**问题9：如何设计一个好的自定义 Hook？**

答案：
1. **单一职责**：每个 Hook 只做一件事
2. **明确的输入输出**：参数和返回值清晰
3. **处理边界情况**：加载状态、错误处理、清理逻辑
4. **避免闭包陷阱**：正确处理依赖和引用

**问题10：如何用自定义 Hook 封装 API 请求？**

答案：
```tsx
function useFetch(url, options = {}) {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function fetchData() {
      setState({ data: null, loading: true, error: null });

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP 错误: ${response.status}`);
        }

        const data = await response.json();

        if (!cancelled) {
          setState({ data, loading: false, error: null });
        }
      } catch (error) {
        if (!cancelled && error.name !== 'AbortError') {
          setState({ data: null, loading: false, error });
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [url]);

  return state;
}
```

---

## 附录：Hooks 版本特性对照表

| Hook | React 版本 | 用途 |
|------|-----------|------|
| useState | 16.8+ | 管理组件状态 |
| useEffect | 16.8+ | 处理副作用 |
| useContext | 16.8+ | 消费 Context |
| useReducer | 16.8+ | 复杂状态管理 |
| useCallback | 16.8+ | 缓存函数引用 |
| useMemo | 16.8+ | 缓存计算结果 |
| useRef | 16.8+ | 访问 DOM/存储可变值 |
| useImperativeHandle | 16.8+ | 暴露组件方法 |
| useLayoutEffect | 16.8+ | 同步副作用 |
| useDebugValue | 16.8+ | 调试信息 |
| useTransition | 18.0+ | 非紧急更新 |
| useDeferredValue | 18.0+ | 延迟值 |
| useId | 18.0+ | 生成唯一 ID |
| useSyncExternalStore | 18.0+ | 订阅外部状态 |
| useInsertionEffect | 18.0+ | CSS-in-JS 注入 |
| use() | 19.0+ | 消费 Promise/Context |
| useActionState | 19.0+ | 表单 action 状态 |
| useOptimistic | 19.0+ | 乐观更新 |
| useFormStatus | 19.0+ | 表单提交状态 |
