# 第2卷-框架生态

---

## 第1章 React深入

---

### 2.1 ReactHooks核心原理

#### 2.1.1 useState深入理解

#### 2.1.1 useState基本用法

**参考答案：**

```javascript
// useState 基础用法
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}

// 函数式更新（当新值依赖旧值时）
function CounterFunctional() {
  const [count, setCount] = useState(0);

  // 正确：使用函数式更新
  const increment = () => {
    setCount(prevCount => prevCount + 1);
  };

  // 错误：闭包陷阱
  const incrementWrong = () => {
    // 这里的 count 永远是 0
    setCount(count + 1);
  };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}

// 惰性初始化（复杂计算时使用）
function ExpensiveComponent({ items }) {
  // 错误：每次渲染都会执行 computeExpensiveValue
  const [sortedItems, setSortedItems] = useState(
    items.sort((a, b) => a.name.localeCompare(b.name))
  );

  // 正确：只在首次渲染时执行
  const [sortedItemsLazy, setSortedItemsLazy] = useState(() => {
    return items.sort((a, b) => a.name.localeCompare(b.name));
  });

  // 更好的方式：使用 useMemo
  const sortedItemsMemo = useMemo(
    () => items.sort((a, b) => a.name.localeCompare(b.name)),
    [items]
  );

  return <div>{/* ... */}</div>;
}
```

#### 2.1.2 useState闭包问题详解

**参考答案：**

闭包问题是 React Hooks 中最常见的问题之一。

```javascript
// 问题 1：setInterval 中的闭包陷阱
function CounterWithInterval() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      // 问题：这里的 count 永远是 0
      // 因为 useEffect 只在首次渲染时执行一次
      // 回调函数形成了闭包，捕获了当时的 count 值
      console.log('Count:', count);
    }, 1000);

    return () => clearInterval(id);
  }, []); // 空依赖数组

  return <div>{count}</div>;
}

// 解决方案 1：使用函数式更新
function CounterWithIntervalFixed1() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      // 使用函数式更新，获取最新的 count 值
      setCount(prevCount => prevCount + 1);
      console.log('Count:', prevCount); // 注意：这里还是闭包中的值
    }, 1000);

    return () => clearInterval(id);
  }, []);

  return <div>{count}</div>;
}

// 解决方案 2：使用 useRef 存储最新值
function CounterWithIntervalFixed2() {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);

  // 保持 ref 和 state 同步
  useEffect(() => {
    countRef.current = count;
  }, [count]);

  useEffect(() => {
    const id = setInterval(() => {
      // 通过 ref 获取最新值
      console.log('Count:', countRef.current);
      setCount(countRef.current + 1);
    }, 1000);

    return () => clearInterval(id);
  }, []);

  return <div>{count}</div>;
}

// 问题 2：事件处理函数中的闭包
function FormHandler() {
  const [value, setValue] = useState('');

  // 问题：handleClick 中只能看到首次渲染时的 value
  const handleClick = () => {
    console.log('Value:', value); // 永远是空字符串
  };

  return (
    <div>
      <input value={value} onChange={e => setValue(e.target.value)} />
      <button onClick={handleClick}>Log Value</button>
    </div>
  );
}

// 解决方案：使用 useRef 或将依赖加入依赖数组
function FormHandlerFixed() {
  const [value, setValue] = useState('');
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const handleClick = () => {
    console.log('Value:', valueRef.current);
  };

  // 或者使用 useCallback 配合依赖数组
  const handleClickWithDeps = useCallback(() => {
    console.log('Value:', value);
  }, [value]); // value 变化时重新创建函数

  return (
    <div>
      <input value={value} onChange={e => setValue(e.target.value)} />
      <button onClick={handleClickWithDeps}>Log Value</button>
    </div>
  );
}

// 问题 3：异步操作中的闭包
function DataFetcher() {
  const [data, setData] = useState(null);
  const [id, setId] = useState(1);

  useEffect(() => {
    fetch(`/api/data/${id}`)
      .then(res => res.json())
      .then(result => {
        // 问题：这里的 id 可能是旧值
        // 因为 useEffect 在 id 变化时重新执行
        // 但异步回调可能在新的 useEffect 执行后才完成
        setData(result);
      });
  }, [id]);

  return <div>{data && data.name}</div>;
}

// 解决方案：使用 useRef 存储最新的 id
function DataFetcherFixed() {
  const [data, setData] = useState(null);
  const [id, setId] = useState(1);
  const idRef = useRef(id);

  useEffect(() => {
    idRef.current = id;
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/data/${id}`)
      .then(res => res.json())
      .then(result => {
        // 检查是否已经被取消
        if (!cancelled) {
          // 使用 ref 获取最新 id，确保数据匹配
          if (result.requestedId === idRef.current) {
            setData(result);
          }
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return <div>{data && data.name}</div>;
}
```

#### 2.1.3 useState的实现原理

**参考答案：**

```javascript
// useState 的简化实现
let hooks = [];
let hookIndex = 0;

function useState(initialValue) {
  const currentIndex = hookIndex;
  hooks[hookIndex] = hooks[hookIndex] || initialValue;

  function setState(newValue) {
    // 判断是函数还是值
    const valueToSet = typeof newValue === 'function'
      ? newValue(hooks[currentIndex])
      : newValue;

    // 更新值
    hooks[currentIndex] = valueToSet;

    // 触发重新渲染
    scheduleReRender();
  }

  hookIndex++;
  return [hooks[currentIndex], setState];
}

// 实际 React 源码中的实现更复杂
// 考虑到了并发模式、批量更新等场景
```

---

### 2.2 useEffect深入理解

#### 2.2.1 useEffect执行时机

**参考答案：**

```javascript
// useEffect vs useLayoutEffect 执行时机对比
import { useEffect, useLayoutEffect } from 'react';

function EffectTiming() {
  const [value, setValue] = useState(0);

  // 1. 组件渲染 - 同步执行组件函数
  console.log('1. Render:', value);

  // 2. DOM 更新完成 - 浏览器还未渲染
  useLayoutEffect(() => {
    console.log('2. useLayoutEffect - DOM 更新后，渲染前');
    // 这里可以读取 DOM，进行测量等操作
    // 不会导致闪烁
  }, [value]);

  // 3. 浏览器渲染 (Paint)
  // 此时用户看到界面

  // 4. useEffect 执行
  useEffect(() => {
    console.log('3. useEffect - 渲染完成后');
    // 适合：数据获取、订阅、日志上报等
    return () => {
      console.log('Cleanup - 组件卸载或依赖变化前');
    };
  }, [value]);

  return (
    <button onClick={() => setValue(v => v + 1)}>
      Count: {value}
    </button>
  );
}

// 实际执行顺序：
// 1. Render: 0
// 2. 浏览器更新 DOM
// 3. useLayoutEffect - DOM 更新后，渲染前
// 4. 浏览器渲染 (Paint)
// 5. useEffect - 渲染完成后
// 6. Cleanup - 依赖变化前（如果依赖变化）
// 7. 下一个渲染周期...
```

#### 2.2.2 useEffect依赖数组详解

**参考答案：**

```javascript
// 依赖数组的各种情况

function DependencyArray() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');

  // 情况 1：无依赖数组 - 每次渲染都执行
  useEffect(() => {
    console.log('Every render');
  });

  // 情况 2：空依赖数组 - 只在挂载时执行一次
  useEffect(() => {
    console.log('Mount only');

    // 适合：订阅、计时器、一次性初始化
    const subscription = someAPI.subscribe();

    return () => {
      // 清理函数：组件卸载时执行
      subscription.unsubscribe();
    };
  }, []);

  // 情况 3：指定依赖 - 依赖变化时执行
  useEffect(() => {
    console.log('Count changed:', count);

    // 适合：基于 props 或 state 的副作用
  }, [count]); // count 变化时执行

  // 情况 4：多个依赖
  useEffect(() => {
    console.log('Count or name changed:', count, name);
  }, [count, name]);

  // 情况 5：函数作为依赖
  const handleClick = () => {
    console.log('click');
  };

  useEffect(() => {
    console.log('handleClick changed');
  }, [handleClick]); // handleClick 引用变化时执行

  // 优化：使用 useCallback 稳定函数引用
  const handleClickStable = useCallback(() => {
    console.log('click');
  }, []);

  useEffect(() => {
    console.log('handleClickStable changed');
  }, [handleClickStable]); // 依赖稳定

  return <div onClick={handleClick}>Click</div>;
}
```

#### 2.2.3 useEffect常见陷阱

**参考答案：**

```javascript
// 陷阱 1：忘记依赖数组导致闭包陷阱
function WrongDependency() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // 问题：没有依赖数组，每次渲染都执行
    // 但这里可能期望只在挂载时执行一次
    console.log('Effect ran');
  });

  // 问题 2：依赖数组错误导致无限循环
  function WrongDependency2() {
    const [obj, setObj] = useState({ value: 0 });

    useEffect(() => {
      // 问题：每次渲染都创建新对象
      // 导致依赖变化，触发无限循环
      setObj({ value: obj.value + 1 });
    }, [obj]); // obj 作为依赖，每次都变

    return <div>{obj.value}</div>;
  }

  // 正确做法
  function CorrectDependency() {
    const [obj, setObj] = useState({ value: 0 });

    useEffect(() => {
      // 使用函数式更新，不依赖当前 state
      setObj(prev => ({ value: prev.value + 1 }));
    }, []); // 空依赖，运行一次

    return <div>{obj.value}</div>;
  }

  // 陷阱 3：异步 useEffect
  function AsyncEffect() {
    const [data, setData] = useState(null);

    useEffect(async () => {
      // 问题：async 函数会返回 Promise
      // useEffect 不支持返回 Promise
      const response = await fetch(url);
      const json = await response.json();
      setData(json);
    }, [url]);

    // 正确做法
    useEffect(() => {
      let cancelled = false;

      async function fetchData() {
        const response = await fetch(url);
        const json = await response.json();
        if (!cancelled) {
          setData(json);
        }
      }

      fetchData();

      return () => {
        cancelled = true;
      };
    }, [url]);

    return <div>{data}</div>;
  }

  // 陷阱 4：清理函数时机问题
  function CleanupTiming() {
    const [count, setCount] = useState(0);

    useEffect(() => {
      console.log('Effect:', count);

      return () => {
        console.log('Cleanup:', count);
      };
    }, [count]);

    return (
      <button onClick={() => setCount(c => c + 1)}>
        {count}
      </button>
    );
  }
  // 执行顺序：
  // 1. 初始渲染 count=0: Effect: 0
  // 2. 点击后 count=1: Cleanup: 0 -> Effect: 1
  // cleanup 函数使用的是上一次渲染的 count 值！
}
```

---

### 2.3 useMemo与useCallback

#### 2.3.1 useMemo用法详解

**参考答案：**

```javascript
// useMemo 的基本用法
import { useMemo } from 'react';

function ExpensiveCalculation() {
  const [a, setA] = useState(1);
  const [b, setB] = useState(2);

  // 基本用法
  const result = useMemo(() => {
    console.log('Computing...');
    // 模拟昂贵计算
    let sum = 0;
    for (let i = 0; i < 1000000; i++) {
      sum += Math.sqrt(i);
    }
    return a + b + sum % 1000;
  }, [a, b]);

  return (
    <div>
      <p>Result: {result}</p>
      <button onClick={() => setA(a + 1)}>A: {a}</button>
      <button onClick={() => setB(b + 1)}>B: {b}</button>
    </div>
  );
}

// 场景 1：避免子组件不必要的重渲染
function Parent() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('John');

  // data 变化时才重新计算
  const processedData = useMemo(() => {
    return {
      items: [1, 2, 3, 4, 5],
      sorted: [5, 4, 3, 2, 1]
    };
  }, []);

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
      <ExpensiveChild
        name={name}
        data={processedData}
      />
    </div>
  );
}

const ExpensiveChild = React.memo(({ name, data }) => {
  console.log('Child rendered');
  return <div>{name}: {data.items.join(',')}</div>;
});

// 场景 2：配合 useEffect 使用
function WithUseEffect() {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('');

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter(item =>
      item.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [data, filter]);

  useEffect(() => {
    console.log('Filtered data changed:', filteredData);
  }, [filteredData]);

  return <div>{filteredData.length} items</div>;
}

// 场景 3：复杂对象比较
function ObjectComparison() {
  const [config, setConfig] = useState({
    theme: 'dark',
    language: 'en'
  });

  // 错误：每次渲染都创建新对象
  // const value = computeSomething(config);

  // 正确：使用 useMemo
  const value = useMemo(() => {
    return computeSomething(config);
  }, [config]);

  // 或者拆分状态
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('en');
  const valueSplit = useMemo(() => {
    return computeSomething({ theme, language });
  }, [theme, language]);

  return <div>{value}</div>;
}
```

#### 2.3.2 useCallback用法详解

**参考答案：**

```javascript
// useCallback 的基本用法
import { useCallback } from 'react';

function CallbackExample() {
  const [count, setCount] = useState(0);

  // 基本用法 - 缓存函数引用
  const handleClick = useCallback(() => {
    console.log('Clicked:', count);
  }, [count]);

  // useCallback(fn, deps) 等价于 useMemo(() => fn, deps)
  const handleClickEquivalent = useMemo(() => {
    return () => {
      console.log('Clicked:', count);
    };
  }, [count]);

  return <button onClick={handleClick}>Click</button>;
}

// 场景 1：配合 React.memo 避免子组件重渲染
function Parent() {
  const [counter, setCounter] = useState(0);
  const [name, setName] = useState('John');

  // 每次 counter 变化都创建新函数
  // 导致 Child 组件不必要地重渲染
  const handleClick = () => {
    console.log('Clicked');
  };

  return (
    <div>
      <button onClick={() => setCounter(c => c + 1)}>
        Counter: {counter}
      </button>
      <Child onClick={handleClick} name={name} />
    </div>
  );
}

// 解决方案：使用 useCallback
function ParentFixed() {
  const [counter, setCounter] = useState(0);
  const [name, setName] = useState('John');

  // 只有 name 变化时才创建新函数
  const handleClick = useCallback(() => {
    console.log('Clicked');
  }, [name]);

  return (
    <div>
      <button onClick={() => setCounter(c => c + 1)}>
        Counter: {counter}
      </button>
      <Child onClick={handleClick} name={name} />
    </div>
  );
}

const Child = React.memo(({ onClick, name }) => {
  console.log('Child rendered');
  return <button onClick={onClick}>{name}</button>;
});

// 场景 2：useRef 配合 useCallback
function UseRefWithCallback() {
  const inputRef = useRef(null);

  // 每次渲染都返回同一个函数
  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div>
      <input ref={inputRef} />
      <button onClick={focusInput}>Focus</button>
    </div>
  );
}

// 场景 3：事件处理函数防抖
function DebouncedSearch() {
  const [query, setQuery] = useState('');

  const handleSearch = useCallback(
    debounce((value) => {
      console.log('Searching:', value);
      // 执行搜索逻辑
    }, 300),
    []
  );

  return (
    <input
      value={query}
      onChange={e => {
        setQuery(e.target.value);
        handleSearch(e.target.value);
      }}
    />
  );
}

function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}
```

#### 2.3.3 useMemo与useCallback的区别

**参考答案：**

```javascript
// useMemo vs useCallback 区别
function MemoVsCallback() {
  const [value, setValue] = useState(0);

  // useMemo: 缓存计算结果
  const memoizedValue = useMemo(() => {
    return computeExpensiveValue(value);
  }, [value]);

  // useCallback: 缓存函数引用
  const memoizedCallback = useCallback(() => {
    doSomething(value);
  }, [value]);

  // 实际上 useCallback 等价于：
  const memoizedCallbackEquivalent = useMemo(() => {
    return () => doSomething(value);
  }, [value]);

  return (
    <div>
      <p>Value: {memoizedValue}</p>
      <button onClick={memoizedCallback}>Click</button>
    </div>
  );
}

// 使用场景对比
function UseCaseComparison() {
  const [items, setItems] = useState([]);

  // useMemo 适用于：
  // 1. 复杂计算
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  // 2. 创建复杂对象
  const config = useMemo(() => ({
    theme: 'dark',
    language: 'en',
    items: items.map(i => ({ ...i, processed: true }))
  }), [items]);

  // 3. 派生状态
  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price, 0);
  }, [items]);

  // useCallback 适用于：
  // 1. 传递给子组件的回调函数
  const handleSubmit = useCallback((data) => {
    setItems([...items, data]);
  }, [items]);

  // 2. 事件处理函数
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);

  // 3. 作为其他 Hook 的依赖
  useEffect(() => {
    const handler = () => console.log('resize');
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [handleClick]); // handleClick 稳定，effect 只运行一次

  return <div>{/* ... */}</div>;
}
```

---

### 2.4 useRef深入理解

#### 2.4.1 useRef基本用法

**参考答案：**

```javascript
// useRef 的基本用法
import { useRef, useEffect } from 'react';

function UseRefBasics() {
  const inputRef = useRef(null);
  const countRef = useRef(0);

  function handleClick() {
    // 访问 DOM 元素
    inputRef.current.focus();

    // 存储值但不触发重渲染
    countRef.current++;
    console.log('Count:', countRef.current);
  }

  return (
    <div>
      <input ref={inputRef} type="text" />
      <button onClick={handleClick}>Focus & Count</button>
    </div>
  );
}

// useRef vs useState 对比
function RefVsState() {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);

  function updateState() {
    setCount(count + 1); // 触发重渲染
    console.log('State:', count + 1); // 此时还是旧值
  }

  function updateRef() {
    countRef.current++; // 不触发重渲染
    console.log('Ref:', countRef.current); // 是新值
  }

  return (
    <div>
      <p>State: {count}</p>
      <p>Ref: {countRef.current}</p>
      <button onClick={updateState}>Update State</button>
      <button onClick={updateRef}>Update Ref</button>
    </div>
  );
}

// 常见用途 1：存储上一个状态值
function PreviousValue() {
  const [value, setValue] = useState('');
  const previousValue = useRef('');

  useEffect(() => {
    previousValue.current = value;
  }, [value]);

  return (
    <div>
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
      />
      <p>Current: {value}</p>
      <p>Previous: {previousValue.current}</p>
    </div>
  );
}

// 常见用途 2：存储定时器 ID
function Timer() {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, []);

  return <div>Seconds: {seconds}</div>;
}

// 常见用途 3：存储不稳定的回调
function UnstableCallback() {
  const [query, setQuery] = useState('');

  // 使用 ref 存储最新的回调
  const latestCallback = useRef();

  useEffect(() => {
    latestCallback.current = () => {
      console.log('Query:', query);
    };
  }, [query]);

  const handleSearch = useCallback((q) => {
    // 使用 ref 访问最新值
    console.log('Searching:', latestCallback.current);
  }, []);

  return (
    <input
      value={query}
      onChange={e => setQuery(e.target.value)}
    />
  );
}

// 常见用途 4：强制组件重渲染
function ForceRerender() {
  const [, forceRender] = useReducer(x => x + 1, 0);

  const handleClick = () => {
    forceRender();
  };

  return <button onClick={handleClick}>Force Render</button>;
}

// useRef 初始化
function RefInitialization() {
  // 首次渲染后才会执行初始化函数
  const ref = useRef(computeExpensiveInitialValue);

  // 等价于
  const ref2 = useRef(null);
  if (ref2.current === null) {
    ref2.current = computeExpensiveInitialValue();
  }

  return <div>{ref.current}</div>;
}
```

---

### 2.5 自定义Hook

#### 2.5.1 自定义Hook基本模式

**参考答案：**

```javascript
// 自定义 Hook 命名规范：以 "use" 开头

// 自定义 Hook 示例 1：窗口尺寸
function useWindowSize() {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  useEffect(() => {
    function handleResize() {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }

    window.addEventListener('resize', handleResize);
    handleResize(); // 初始化

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

// 使用
function Component() {
  const { width, height } = useWindowSize();
  return <div>Window: {width} x {height}</div>;
}

// 自定义 Hook 示例 2：异步数据获取
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const json = await response.json();

        if (!cancelled) {
          setData(json);
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
function UserProfile({ userId }) {
  const { data, loading, error } = useFetch(`/api/users/${userId}`);

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;
  return <div>{data.name}</div>;
}

// 自定义 Hook 示例 3：本地存储
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function
        ? value(storedValue)
        : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

// 使用
function Settings() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  const [fontSize, setFontSize] = useLocalStorage('fontSize', 16);

  return (
    <div>
      <select value={theme} onChange={e => setTheme(e.target.value)}>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
      <input
        type="range"
        min="12"
        max="24"
        value={fontSize}
        onChange={e => setFontSize(Number(e.target.value))}
      />
    </div>
  );
}

// 自定义 Hook 示例 4：防抖
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// 使用
function SearchComponent() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) {
      // 执行搜索
      console.log('Searching:', debouncedQuery);
    }
  }, [debouncedQuery]);

  return (
    <input
      value={query}
      onChange={e => setQuery(e.target.value)}
    />
  );
}

// 自定义 Hook 示例 5：节流
function useThrottle(value, interval) {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastUpdated = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    const remaining = interval - (now - lastUpdated.current);

    if (remaining <= 0) {
      lastUpdated.current = now;
      setThrottledValue(value);
    } else {
      const timeoutId = setTimeout(() => {
        lastUpdated.current = Date.now();
        setThrottledValue(value);
      }, remaining);

      return () => clearTimeout(timeoutId);
    }
  }, [value, interval]);

  return throttledValue;
}
```

#### 2.5.2 高级自定义Hook

**参考答案：**

```javascript
// 高级 Hook 示例：表单管理
function useForm(initialValues) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = useCallback((name, value, validate) => {
    setValues(prev => ({ ...prev, [name]: value }));

    if (validate) {
      const error = validate(value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, []);

  const handleBlur = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  const handleSubmit = useCallback((onSubmit) => {
    return (event) => {
      event.preventDefault();
      onSubmit(values);
    };
  }, [values]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const setFieldValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setFieldValue,
    setFieldError,
    isValid: Object.values(errors).every(e => !e)
  };
}

// 使用
function LoginForm() {
  const form = useForm({
    email: '',
    password: ''
  });

  const validate = {
    email: (value) => {
      if (!value) return 'Email is required';
      if (!/\S+@\S+\.\S+/.test(value)) return 'Email is invalid';
      return null;
    },
    password: (value) => {
      if (!value) return 'Password is required';
      if (value.length < 6) return 'Password must be at least 6 characters';
      return null;
    }
  };

  const handleSubmit = form.handleSubmit((values) => {
    console.log('Form submitted:', values);
  });

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={form.values.email}
        onChange={e => form.handleChange('email', e.target.value, validate.email)}
        onBlur={() => form.handleBlur('email')}
      />
      {form.touched.email && form.errors.email && (
        <span>{form.errors.email}</span>
      )}

      <input
        type="password"
        value={form.values.password}
        onChange={e => form.handleChange('password', e.target.value, validate.password)}
        onBlur={() => form.handleBlur('password')}
      />
      {form.touched.password && form.errors.password && (
        <span>{form.errors.password}</span>
      )}

      <button type="submit" disabled={!form.isValid}>
        Submit
      </button>
    </form>
  );
}

// 高级 Hook 示例：媒体查询
function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    const handleChange = (event) => {
      setMatches(event.matches);
    };

    // 监听变化
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // 兼容旧版浏览器
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [query]);

  return matches;
}

// 使用
function ResponsiveComponent() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
  const isDesktop = useMediaQuery('(min-width: 1025px)');

  return (
    <div>
      {isMobile && <MobileLayout />}
      {isTablet && <TabletLayout />}
      {isDesktop && <DesktopLayout />}
    </div>
  );
}

// 高级 Hook 示例：轮询
function usePolling(fetchFn, interval, options = {}) {
  const { immediate = true, retries = 3 } = options;
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const attemptCount = useRef(0);

  const fetchData = useCallback(async () => {
    try {
      const result = await fetchFn();
      setData(result);
      setError(null);
      attemptCount.current = 0;
    } catch (err) {
      setError(err);
      attemptCount.current++;

      if (attemptCount.current < retries) {
        // 重试
        setTimeout(fetchData, interval);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFn, interval, retries]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }

    const intervalId = setInterval(fetchData, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchData, interval, immediate]);

  return { data, error, loading, refetch: fetchData };
}

// 使用
function RealTimeData() {
  const { data, loading, error, refetch } = usePolling(
    () => fetch('/api/status').then(r => r.json()),
    5000,
    { immediate: true, retries: 3 }
  );

  return (
    <div>
      {loading && <Loading />}
      {error && <Error message={error.message} />}
      {data && <div>Status: {data.status}</div>}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

---

