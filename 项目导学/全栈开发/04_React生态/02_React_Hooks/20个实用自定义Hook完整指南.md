# 20个实用自定义Hook完整指南（2026年最新版）

## 目录

1. [状态管理类Hook](#1-状态管理类hook)
2. [副作用处理类Hook](#2-副作用处理类hook)
3. [数据获取类Hook](#3-数据获取类hook)
4. [DOM操作类Hook](#4-dom操作类hook)
5. [性能优化类Hook](#5-性能优化类hook)
6. [工具类Hook](#6-工具类hook)
7. [高级模式类Hook](#7-高级模式类hook)

---

## 1. 状态管理类Hook

### 1.1 usePrevious - 获取上一次的值

```typescript
import { useEffect, useRef } from 'react';

/**
 * 获取上一次渲染时的值
 * @param value 当前值
 * @returns 上一次的值
 */
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// 使用示例
function Counter() {
  const [count, setCount] = useState(0);
  const previousCount = usePrevious(count);

  return (
    <div>
      <p>当前值: {count}</p>
      <p>上一次值: {previousCount}</p>
      <button onClick={() => setCount(c => c + 1)}>增加</button>
    </div>
  );
}

// 实际应用场景：比较值变化
function UserCompare({ user }) {
  const previousUser = usePrevious(user);

  if (previousUser && previousUser.id !== user.id) {
    console.log('用户切换:', previousUser.name, '->', user.name);
  }

  return <div>{user.name}</div>;
}
```

### 1.2 useToggle - 开关状态管理

```typescript
import { useState, useCallback } from 'react';

/**
 * 开关状态管理
 * @param initialValue 初始值，默认false
 * @returns [当前值, 切换函数, 设置为true, 设置为false]
 */
function useToggle(initialValue = false): [
  boolean,
  () => void,
  () => void,
  () => void
] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue(prev => !prev);
  }, []);

  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  return [value, toggle, setTrue, setFalse];
}

// 使用示例
function ToggleExample() {
  const [isOpen, toggle, open, close] = useToggle(false);

  return (
    <div>
      <p>状态: {isOpen ? '开启' : '关闭'}</p>
      <button onClick={toggle}>切换</button>
      <button onClick={open}>打开</button>
      <button onClick={close}>关闭</button>
    </div>
  );
}

// 实际应用场景：模态框开关
function Modal() {
  const [isOpen, toggle] = useToggle(false);

  return (
    <>
      <button onClick={toggle}>打开模态框</button>
      {isOpen && (
        <div className="modal">
          <div className="modal-content">
            <button onClick={toggle}>关闭</button>
            <p>模态框内容</p>
          </div>
        </div>
      )}
    </>
  );
}
```

### 1.3 useCounter - 计数器状态管理

```typescript
import { useState, useCallback } from 'react';

/**
 * 计数器状态管理
 * @param initialCount 初始值，默认0
 * @param min 最小值，默认Infinity
 * @param max 最大值，默认Infinity
 */
function useCounter(
  initialCount = 0,
  min = -Infinity,
  max = Infinity
) {
  const [count, setCount] = useState(initialCount);

  const increment = useCallback(() => {
    setCount(prev => Math.min(prev + 1, max));
  }, [max]);

  const decrement = useCallback(() => {
    setCount(prev => Math.max(prev - 1, min));
  }, [min]);

  const reset = useCallback(() => {
    setCount(initialCount);
  }, [initialCount]);

  const set = useCallback((value: number) => {
    setCount(Math.max(min, Math.min(value, max)));
  }, [min, max]);

  return {
    count,
    increment,
    decrement,
    reset,
    set,
  };
}

// 使用示例
function CounterExample() {
  const { count, increment, decrement, reset } = useCounter(0, 0, 10);

  return (
    <div>
      <p>计数: {count}</p>
      <button onClick={decrement}>-1</button>
      <button onClick={reset}>重置</button>
      <button onClick={increment}>+1</button>
    </div>
  );
}

// 实际应用场景：购物车数量
function CartItem({ item }) {
  const { count, increment, decrement } = useCounter(
    item.quantity,
    0,
    item.stock
  );

  return (
    <div>
      <button onClick={decrement}>-</button>
      <span>{count}</span>
      <button onClick={increment}>+</button>
    </div>
  );
}
```

### 1.4 useInterval - 定时器管理

```typescript
import { useEffect, useRef, useCallback } from 'react';

/**
 * 定时器管理 Hook
 * @param callback 回调函数
 * @param delay 间隔时间（毫秒），null则停止定时器
 * @param immediate 是否立即执行
 */
function useInterval(
  callback: () => void,
  delay: number | null,
  immediate = false
) {
  const savedCallback = useRef(callback);

  // 保存最新的回调函数
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay !== null) {
      // 立即执行
      if (immediate) {
        savedCallback.current();
      }

      const id = setInterval(() => {
        savedCallback.current();
      }, delay);

      return () => clearInterval(id);
    }
  }, [delay, immediate]);
}

// 使用示例
function Timer() {
  const [seconds, setSeconds] = useState(0);

  useInterval(() => {
    setSeconds(s => s + 1);
  }, 1000);

  return <div>已运行: {seconds} 秒</div>;
}

// 实际应用场景：倒计时
function Countdown({ duration = 60 }) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useInterval(() => {
    setTimeLeft(t => {
      if (t <= 1) {
        return 0;
      }
      return t - 1;
    });
  }, timeLeft > 0 ? 1000 : null);

  return <div>倒计时: {timeLeft} 秒</div>;
}
```

### 1.5 useDebounce - 防抖值

```typescript
import { useState, useEffect } from 'react';

/**
 * 防抖值 Hook
 * @param value 原始值
 * @param delay 防抖延迟时间（毫秒）
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// 使用示例
function SearchBox() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) {
      console.log('搜索:', debouncedQuery);
      // 执行搜索API
    }
  }, [debouncedQuery]);

  return (
    <input
      type="text"
      value={query}
      onChange={e => setQuery(e.target.value)}
      placeholder="搜索..."
    />
  );
}

// 实际应用场景：实时验证
function Form() {
  const [email, setEmail] = useState('');
  const debouncedEmail = useDebounce(email, 500);

  useEffect(() => {
    if (debouncedEmail) {
      // 验证邮箱格式
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(debouncedEmail);
      console.log('邮箱验证:', isValid);
    }
  }, [debouncedEmail]);

  return (
    <input
      type="email"
      value={email}
      onChange={e => setEmail(e.target.value)}
      placeholder="邮箱"
    />
  );
}
```

### 1.6 useThrottle - 节流值

```typescript
import { useState, useEffect } from 'react';

/**
 * 节流值 Hook
 * @param value 原始值
 * @param delay 节流延迟时间（毫秒）
 */
function useThrottle<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRun = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();

    if (now - lastRun.current >= delay) {
      setThrottledValue(value);
      lastRun.current = now;
    } else {
      const timer = setTimeout(() => {
        setThrottledValue(value);
        lastRun.current = Date.now();
      }, delay - (now - lastRun.current));

      return () => clearTimeout(timer);
    }
  }, [value, delay]);

  return throttledValue;
}

// 使用示例
function WindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // 节流窗口大小变化
  const throttledSize = useThrottle(size, 100);

  useEffect(() => {
    function handleResize() {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <div>{throttledSize.width} x {throttledSize.height}</div>;
}

// 实际应用场景：滚动事件
function ScrollTracker() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    function handleScroll() {
      setScrollY(window.scrollY);
    }

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const throttledScrollY = useThrottle(scrollY, 100);

  return <div>滚动位置: {throttledScrollY}</div>;
}
```

### 1.7 useLocalStorage - 本地存储

```typescript
import { useState, useEffect, useCallback } from 'react';

/**
 * 本地存储 Hook
 * @param key 存储键名
 * @param initialValue 初始值
 */
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
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

// 使用示例
function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <button onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}>
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}

// 实际应用场景：表单记忆
function FormWithMemory() {
  const [name, setName] = useLocalStorage('form-name', '');
  const [email, setEmail] = useLocalStorage('form-email', '');

  return (
    <form>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="姓名"
      />
      <input
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="邮箱"
      />
    </form>
  );
}
```

### 1.8 useSessionStorage - 会话存储

```typescript
import { useState, useCallback } from 'react';

/**
 * 会话存储 Hook
 * @param key 存储键名
 * @param initialValue 初始值
 */
function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function
        ? value(storedValue)
        : value;

      setStoredValue(valueToStore);
      window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

// 使用示例
function Form() {
  const [formData, setFormData] = useSessionStorage('form-data', {
    name: '',
    email: '',
  });

  return (
    <form>
      <input
        value={formData.name}
        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
        placeholder="姓名"
      />
      <input
        value={formData.email}
        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
        placeholder="邮箱"
      />
    </form>
  );
}
```

### 1.9 useAsync - 异步状态管理

```typescript
import { useState, useEffect, useCallback } from 'react';

/**
 * 异步状态管理 Hook
 * @param asyncFunction 异步函数
 * @param immediate 是否立即执行
 */
function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = true
) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(() => {
    setStatus('pending');
    setData(null);
    setError(null);

    asyncFunction()
      .then((response: T) => {
        setData(response);
        setStatus('success');
      })
      .catch((error: Error) => {
        setError(error);
        setStatus('error');
      });
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  const reset = useCallback(() => {
    setStatus('idle');
    setData(null);
    setError(null);
  }, []);

  return { execute, status, data, error, reset };
}

// 使用示例
function DataFetching() {
  const { execute, status, data, error } = useAsync(
    () => fetch('/api/data').then(res => res.json()),
    false
  );

  return (
    <div>
      <button onClick={execute}>获取数据</button>
      {status === 'pending' && <div>加载中...</div>}
      {status === 'success' && <div>{JSON.stringify(data)}</div>}
      {status === 'error' && <div>错误: {error.message}</div>}
    </div>
  );
}

// 实际应用场景：表单提交
function LoginForm() {
  const { execute, status, data, error } = useAsync(
    async (credentials) => {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        throw new Error('登录失败');
      }
      return response.json();
    },
    false
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    execute({
      email: formData.get('email'),
      password: formData.get('password'),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" placeholder="邮箱" />
      <input name="password" type="password" placeholder="密码" />
      <button type="submit" disabled={status === 'pending'}>
        {status === 'pending' ? '登录中...' : '登录'}
      </button>
      {status === 'error' && <p>{error.message}</p>}
      {status === 'success' && <p>登录成功!</p>}
    </form>
  );
}
```

### 1.10 useMount - 组件挂载时执行

```typescript
import { useEffect } from 'react';

/**
 * 组件挂载时执行的 Hook
 * @param callback 回调函数
 */
function useMount(callback: () => void) {
  useEffect(() => {
    callback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// 使用示例
function ComponentWithMountEffect() {
  useMount(() => {
    console.log('组件已挂载');
    // 初始化逻辑
  });

  return <div>内容</div>;
}

// 实际应用场景：数据初始化
function Dashboard() {
  useMount(() => {
    // 初始化数据
    fetchInitialData();
    // 设置定时器
    const interval = setInterval(fetchData, 60000);
    // 清理函数
    return () => clearInterval(interval);
  });

  return <div>仪表盘</div>;
}
```

### 1.11 useUnmount - 组件卸载时执行

```typescript
import { useEffect } from 'react';

/**
 * 组件卸载时执行的 Hook
 * @param callback 回调函数
 */
function useUnmount(callback: () => void) {
  useEffect(() => {
    return () => {
      callback();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// 使用示例
function ComponentWithUnmountEffect() {
  useUnmount(() => {
    console.log('组件已卸载');
    // 清理逻辑
  });

  return <div>内容</div>;
}

// 实际应用场景：清理订阅
function ChatRoom({ roomId }) {
  useMount(() => {
    const subscription = chat.subscribe(roomId, onMessage);
    return () => subscription.unsubscribe();
  });

  return <div>聊天室</div>;
}
```

### 1.12 useMountUnmount - 挂载和卸载监听

```typescript
import { useEffect, useCallback } from 'react';

/**
 * 监听组件挂载和卸载的 Hook
 * @param onMount 挂载时执行
 * @param onUnmount 卸载时执行
 */
function useMountUnmount(
  onMount: () => void,
  onUnmount: () => void
) {
  useEffect(() => {
    onMount();
    return () => {
      onUnmount();
    };
  }, [onMount, onUnmount]);
}

// 使用示例
function ComponentWithLifecycle() {
  useMountUnmount(
    () => console.log('组件挂载'),
    () => console.log('组件卸载')
  );

  return <div>内容</div>;
}
```

---

## 2. 副作用处理类Hook

### 2.1 useClickOutside - 点击外部关闭

```typescript
import { useEffect, RefObject } from 'react';

/**
 * 点击外部关闭 Hook
 * @param ref 元素引用
 * @param handler 点击外部时的回调
 */
function useClickOutside(
  ref: RefObject<HTMLElement>,
  handler: (event: MouseEvent | TouchEvent) => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      // 如果点击的是ref内的元素，则不执行handler
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

// 使用示例
function Dropdown() {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useClickOutside(dropdownRef, () => setIsOpen(false));

  return (
    <div ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)}>下拉菜单</button>
      {isOpen && <div className="dropdown-menu">菜单内容</div>}
    </div>
  );
}

// 实际应用场景：模态框
function Modal() {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useClickOutside(modalRef, () => setIsOpen(false));

  return (
    <>
      <button onClick={() => setIsOpen(true)}>打开模态框</button>
      {isOpen && (
        <div className="modal-overlay">
          <div ref={modalRef} className="modal-content">
            <button onClick={() => setIsOpen(false)}>关闭</button>
            <p>模态框内容</p>
          </div>
        </div>
      )}
    </>
  );
}
```

### 2.2 useKeyPress - 键盘按键监听

```typescript
import { useEffect, useCallback } from 'react';

/**
 * 键盘按键监听 Hook
 * @param key 按键名称
 * @param handler 按键按下时的回调
 */
function useKeyPress(
  key: string | string[],
  handler: (event: KeyboardEvent) => void
) {
  const keyArray = Array.isArray(key) ? key : [key];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (keyArray.includes(event.key)) {
      handler(event);
    }
  }, [keyArray, handler]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// 使用示例
function HotkeyExample() {
  useKeyPress('Escape', () => {
    console.log('按下了 Escape 键');
    // 关闭模态框等
  });

  useKeyPress(['Ctrl.s', 'Meta.s'], (event) => {
    event.preventDefault();
    console.log('按下了保存快捷键');
    // 保存逻辑
  });

  return <div>按 Escape 键或 Ctrl+S</div>;
}

// 实际应用场景：快捷键
function Editor() {
  useKeyPress(['Ctrl.z', 'Meta.z'], (event) => {
    event.preventDefault();
    undo();
  });

  useKeyPress(['Ctrl.y', 'Meta.y'], (event) => {
    event.preventDefault();
    redo();
  });

  return <div>编辑器</div>;
}
```

### 2.3 useMousePosition - 鼠标位置

```typescript
import { useState, useEffect } from 'react';

/**
 * 鼠标位置 Hook
 */
function useMousePosition() {
  const [position, setPosition] = useState({
    x: 0,
    y: 0
  });

  useEffect(() => {
    function handleMouseMove(event: MouseEvent) {
      setPosition({
        x: event.clientX,
        y: event.clientY
      });
    }

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return position;
}

// 使用示例
function MouseTracker() {
  const { x, y } = useMousePosition();

  return (
    <div>
      <p>鼠标位置: {x}, {y}</p>
    </div>
  );
}

// 实际应用场景：跟随鼠标的效果
function FollowCursor() {
  const { x, y } = useMousePosition();

  return (
    <div
      style={{
        position: 'fixed',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      🐱
    </div>
  );
}
```

### 2.4 useScrollPosition - 滚动位置

```typescript
import { useState, useEffect, useCallback } from 'react';

/**
 * 滚动位置 Hook
 * @param throttle 节流时间（毫秒）
 */
function useScrollPosition(throttle = 0) {
  const [position, setPosition] = useState({
    x: 0,
    y: 0
  });

  const updatePosition = useCallback(() => {
    setPosition({
      x: window.pageXOffset,
      y: window.pageYOffset
    });
  }, []);

  useEffect(() => {
    let timeoutId: number;

    function handleScroll() {
      if (throttle > 0) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(updatePosition, throttle);
      } else {
        updatePosition();
      }
    }

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [throttle, updatePosition]);

  return position;
}

// 使用示例
function ScrollTracker() {
  const { y } = useScrollPosition(100);

  return (
    <div>
      <p>滚动位置: {y}px</p>
      {y > 100 && <button onClick={() => window.scrollTo(0, 0)}>回到顶部</button>}
    </div>
  );
}

// 实际应用场景：回到顶部按钮
function BackToTop() {
  const { y } = useScrollPosition(100);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(y > 200);
  }, [y]);

  return (
    <button
      className={isVisible ? 'visible' : 'hidden'}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      ↑
    </button>
  );
}
```

### 2.5 useEventListener - 事件监听

```typescript
import { useEffect, useRef, useCallback } from 'react';

/**
 * 事件监听 Hook
 * @param eventName 事件名称
 * @param handler 事件处理函数
 * @param element 监听的元素，默认window
 */
function useEventListener<
  K extends keyof WindowEventMap,
  T extends HTMLElement = HTMLElement
>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element?: T | Window | null
) {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const targetElement = element || window;

    if (!targetElement?.addEventListener) {
      return;
    }

    const eventListener = (event: Event) =>
      savedHandler.current(event as WindowEventMap[K]);

    targetElement.addEventListener(eventName, eventListener);

    return () => {
      targetElement.removeEventListener(eventName, eventListener);
    };
  }, [eventName, element]);
}

// 使用示例
function WindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEventListener('resize', () => {
    setSize({
      width: window.innerWidth,
      height: window.innerHeight
    });
  });

  return <div>{size.width} x {size.height}</div>;
}

// 实际应用场景：监听全局事件
function KeyboardShortcuts() {
  useEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      closeModal();
    }
  });

  return <div>按 Escape 键关闭模态框</div>;
}
```

### 2.6 useMediaQuery - 响应式断点

```typescript
import { useState, useEffect, useCallback } from 'react';

/**
 * 响应式断点 Hook
 * @param query 媒体查询字符串
 */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  const updateMatches = useCallback(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);
  }, [query]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// 使用示例
function ResponsiveComponent() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1024px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return (
    <div>
      <p>移动端: {isMobile ? '是' : '否'}</p>
      <p>平板端: {isTablet ? '是' : '否'}</p>
      <p>桌面端: {isDesktop ? '是' : '否'}</p>
    </div>
  );
}

// 实际应用场景：响应式布局
function ResponsiveLayout() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <div className={isMobile ? 'mobile-layout' : 'desktop-layout'}>
      <h1>响应式布局</h1>
    </div>
  );
}
```

### 2.7 useNetwork - 网络状态

```typescript
import { useState, useEffect } from 'react';

/**
 * 网络状态 Hook
 */
function useNetwork() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// 使用示例
function NetworkStatus() {
  const isOnline = useNetwork();

  return (
    <div>
      <p>网络状态: {isOnline ? '在线' : '离线'}</p>
      {!isOnline && <div>⚠️ 你已离线</div>}
    </div>
  );
}

// 实际应用场景：离线提示
function App() {
  const isOnline = useNetwork();

  return (
    <div>
      {!isOnline && (
        <div className="offline-banner">
          你已离线，部分功能可能不可用
        </div>
      )}
      <MainContent />
    </div>
  );
}
```

### 2.8 useVisibilityChange - 页面可见性

```typescript
import { useEffect, useState, useCallback } from 'react';

/**
 * 页面可见性 Hook
 */
function useVisibilityChange() {
  const [isVisible, setIsVisible] = useState(true);

  const handleVisibilityChange = useCallback(() => {
    setIsVisible(document.visibilityState === 'visible');
  }, []);

  useEffect(() => {
    handleVisibilityChange();

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  return isVisible;
}

// 使用示例
function PageVisibility() {
  const isVisible = useVisibilityChange();

  return (
    <div>
      <p>页面可见: {isVisible ? '是' : '否'}</p>
    </div>
  );
}

// 实际应用场景：视频暂停
function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isVisible = useVisibilityChange();

  useEffect(() => {
    if (videoRef.current) {
      if (isVisible) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [isVisible]);

  return <video ref={videoRef} src="video.mp4" controls />;
}
```

---

## 3. 数据获取类Hook

### 3.1 useFetch - 数据获取（完整版）

```typescript
import { useState, useEffect, useCallback } from 'react';

/**
 * 数据获取 Hook
 * @param url 请求URL
 * @param options 请求选项
 */
interface UseFetchReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

function useFetch<T>(
  url: string,
  options?: RequestInit
): UseFetchReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);

    fetch(url, options)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url, options]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

// 使用示例
function UserList() {
  const { data, loading, error } = useFetch<User[]>('/api/users');

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <ul>
      {data?.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

// 实际应用场景：搜索功能
function Search() {
  const [query, setQuery] = useState('');
  const { data, loading, error, refetch } = useFetch<Product[]>(
    `/api/products?q=${query}`
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    // 防抖后执行refetch
  };

  return (
    <div>
      <input
        value={query}
        onChange={handleSearch}
        placeholder="搜索产品..."
      />
      {loading && <div>加载中...</div>}
      {error && <div>错误: {error.message}</div>}
      <ul>
        {data?.map(product => (
          <li key={product.id}>{product.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 3.2 useDebounceFetch - 防抖数据获取

```typescript
import { useState, useEffect, useCallback } from 'react';

/**
 * 防抖数据获取 Hook
 * @param url 请求URL
 * @param delay 防抖延迟时间
 * @param options 请求选项
 */
function useDebounceFetch<T>(
  url: string,
  delay: number = 300,
  options?: RequestInit
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number;

    // 防抖处理
    timeoutId = setTimeout(() => {
      setLoading(true);
      setError(null);

      fetch(url, options)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          if (!cancelled) {
            setData(data);
          }
        })
        .catch(error => {
          if (!cancelled) {
            setError(error);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [url, delay, options]);

  return { data, loading, error };
}

// 使用示例
function SearchBox() {
  const [query, setQuery] = useState('');
  const { data, loading, error } = useDebounceFetch<Product[]>(
    `/api/products?q=${query}`,
    500
  );

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="搜索..."
      />
      {loading && <div>加载中...</div>}
      {error && <div>错误: {error.message}</div>}
      <ul>
        {data?.map(product => (
          <li key={product.id}>{product.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 3.3 usePolling - 轮询数据

```typescript
import { useState, useEffect, useCallback } from 'react';

/**
 * 轮询数据 Hook
 * @param url 请求URL
 * @param interval 轮询间隔（毫秒）
 * @param enabled 是否启用轮询
 */
function usePolling<T>(
  url: string,
  interval: number = 5000,
  enabled: boolean = true
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setData(data);
    } catch (error) {
      setError(error as Error);
    } finally {
      setLoading(false);
    }
  }, [url, enabled]);

  useEffect(() => {
    if (!enabled) return;

    // 立即执行一次
    fetchData();

    // 开始轮询
    const intervalId = setInterval(fetchData, interval);

    return () => clearInterval(intervalId);
  }, [fetchData, interval, enabled]);

  return { data, loading, error };
}

// 使用示例
function Dashboard() {
  const { data, loading, error } = usePolling<Stats>('/api/stats', 10000);

  return (
    <div>
      {loading && <div>加载中...</div>}
      {error && <div>错误: {error.message}</div>}
      <div>统计: {JSON.stringify(data)}</div>
    </div>
  );
}

// 实际应用场景：实时数据
function StockTicker() {
  const { data, loading, error } = usePolling<StockPrice>(
    '/api/stock/price',
    1000
  );

  return (
    <div>
      <h1>股票价格</h1>
      {loading && <div>加载中...</div>}
      {error && <div>错误: {error.message}</div>}
      {data && <p>价格: ¥{data.price}</p>}
    </div>
  );
}
```

### 3.4 useInfiniteScroll - 无限滚动

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 无限滚动 Hook
 * @param callback 加载更多回调
 * @param options 配置选项
 */
interface UseInfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
}

function useInfiniteScroll(
  callback: () => void,
  options: UseInfiniteScrollOptions = {}
) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  const { threshold = 0, rootMargin = '0px' } = options;

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(sentinel);

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [threshold, rootMargin]);

  useEffect(() => {
    if (isIntersecting) {
      callback();
      setIsIntersecting(false);
    }
  }, [isIntersecting, callback]);

  return sentinelRef;
}

// 使用示例
function InfiniteList() {
  const [items, setItems] = useState<number[]>([1, 2, 3]);
  const sentinelRef = useInfiniteScroll(() => {
    // 加载更多
    const newItems = [4, 5, 6];
    setItems(prev => [...prev, ...newItems]);
  });

  return (
    <div>
      {items.map(item => (
        <div key={item}>Item {item}</div>
      ))}
      <div ref={sentinelRef}>加载更多...</div>
    </div>
  );
}

// 实际应用场景：瀑布流
function Waterfall() {
  const [images, setImages] = useState<Image[]>([]);
  const sentinelRef = useInfiniteScroll(() => {
    // 加载更多图片
    fetchMoreImages().then(newImages => {
      setImages(prev => [...prev, ...newImages]);
    });
  });

  return (
    <div className="waterfall">
      {images.map(image => (
        <img key={image.id} src={image.url} alt={image.title} />
      ))}
      <div ref={sentinelRef}>加载中...</div>
    </div>
  );
}
```

---

## 4. DOM操作类Hook

### 4.1 useMeasure - 元素尺寸测量

```typescript
import { useState, useEffect, useRef, RefObject } from 'react';

/**
 * 元素尺寸测量 Hook
 */
interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  left: number;
  right: number;
  bottom: number;
}

function useMeasure(): [RefObject<HTMLElement>, Rect] {
  const ref = useRef<HTMLElement>(null);
  const [rect, setRect] = useState<Rect>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  });

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        setRect(entry.contentRect as Rect);
      }
    });

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);

  return [ref, rect];
}

// 使用示例
function ResizableBox() {
  const [ref, rect] = useMeasure();

  return (
    <div ref={ref} style={{ border: '1px solid black' }}>
      <p>宽度: {rect.width.toFixed(2)}px</p>
      <p>高度: {rect.height.toFixed(2)}px</p>
      <p>顶部: {rect.top.toFixed(2)}px</p>
      <p>左侧: {rect.left.toFixed(2)}px</p>
    </div>
  );
}

// 实际应用场景：图表自适应
function Chart() {
  const [ref, rect] = useMeasure();

  return (
    <div ref={ref} style={{ width: '100%', height: '400px' }}>
      <ResponsiveChart width={rect.width} height={rect.height} />
    </div>
  );
}
```

### 4.2 useCopyToClipboard - 复制到剪贴板

```typescript
import { useCallback, useState } from 'react';

/**
 * 复制到剪贴板 Hook
 */
function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback((text: string) => {
    if (!navigator.clipboard) {
      // 旧版浏览器兼容
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('复制失败:', err);
      } finally {
        document.body.removeChild(textarea);
      }

      return;
    }

    // 现代浏览器
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('复制失败:', err);
    });
  }, []);

  return { copied, copyToClipboard };
}

// 使用示例
function CopyButton({ text }: { text: string }) {
  const { copied, copyToClipboard } = useCopyToClipboard();

  return (
    <button onClick={() => copyToClipboard(text)}>
      {copied ? '✅ 已复制' : '📋 复制'}
    </button>
  );
}

// 实际应用场景：代码高亮
function CodeBlock({ code }: { code: string }) {
  const { copied, copyToClipboard } = useCopyToClipboard();

  return (
    <div className="code-block">
      <pre>{code}</pre>
      <button onClick={() => copyToClipboard(code)}>
        {copied ? '已复制' : '复制代码'}
      </button>
    </div>
  );
}
```

### 4.3 useScript - 动态加载脚本

```typescript
import { useEffect, useState } from 'react';

/**
 * 动态加载脚本 Hook
 * @param src 脚本URL
 */
function useScript(src: string) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  useEffect(() => {
    // 如果脚本已加载，直接返回
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      setStatus('ready');
      return;
    }

    // 创建脚本元素
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.setAttribute('data-status', 'loading');

    // 加载完成
    script.onload = () => {
      setStatus('ready');
      script.setAttribute('data-status', 'ready');
    };

    // 加载失败
    script.onerror = () => {
      setStatus('error');
      script.setAttribute('data-status', 'error');
    };

    // 添加到文档
    document.head.appendChild(script);

    return () => {
      if (script) {
        script.remove();
      }
    };
  }, [src]);

  return status;
}

// 使用示例
function GoogleMaps() {
  const status = useScript('https://maps.googleapis.com/maps/api/js?key=YOUR_KEY');

  if (status === 'loading') return <div>加载地图...</div>;
  if (status === 'error') return <div>地图加载失败</div>;

  return <div id="map" style={{ height: '400px' }} />;
}

// 实际应用场景：第三方SDK
function Analytics() {
  const status = useScript('https://www.googletagmanager.com/gtag/js?id=GA_ID');

  useEffect(() => {
    if (status === 'ready') {
      window.dataLayer = window.dataLayer || [];
      function gtag() { window.dataLayer.push(arguments); }
      gtag('js', new Date());
      gtag('config', 'GA_ID');
    }
  }, [status]);

  return null;
}
```

### 4.4 useStyle - 动态加载样式

```typescript
import { useEffect, useState } from 'react';

/**
 * 动态加载样式 Hook
 * @param href 样式URL
 */
function useStyle(href: string) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  useEffect(() => {
    // 如果样式已加载，直接返回
    const existingLink = document.querySelector(`link[href="${href}"]`);
    if (existingLink) {
      setStatus('ready');
      return;
    }

    // 创建link元素
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-status', 'loading');

    // 加载完成
    link.onload = () => {
      setStatus('ready');
      link.setAttribute('data-status', 'ready');
    };

    // 加载失败
    link.onerror = () => {
      setStatus('error');
      link.setAttribute('data-status', 'error');
    };

    // 添加到文档
    document.head.appendChild(link);

    return () => {
      if (link) {
        link.remove();
      }
    };
  }, [href]);

  return status;
}

// 使用示例
function ComponentWithExternalStyle() {
  const status = useStyle('https://example.com/style.css');

  if (status === 'loading') return <div>加载样式...</div>;
  if (status === 'error') return <div>样式加载失败</div>;

  return <div className="external-component">组件内容</div>;
}
```

### 4.5 useThrottleEffect - 节流Effect

```typescript
import { useEffect, useRef } from 'react';

/**
 * 节流Effect Hook
 * @param effect Effect函数
 * @param delay 节流延迟时间
 * @param deps 依赖数组
 */
function useThrottleEffect(
  effect: () => void | (() => void),
  delay: number,
  deps: any[] = []
) {
  const lastRun = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();

    if (now - lastRun.current >= delay) {
      const cleanup = effect();
      lastRun.current = now;
      return cleanup;
    } else {
      const timer = setTimeout(() => {
        const cleanup = effect();
        lastRun.current = Date.now();
        return cleanup;
      }, delay - (now - lastRun.current));

      return () => {
        clearTimeout(timer);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// 使用示例
function WindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useThrottleEffect(() => {
    function handleResize() {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, 100, []);

  return <div>{size.width} x {size.height}</div>;
}

// 实际应用场景：滚动优化
function ScrollTracker() {
  const [scrollY, setScrollY] = useState(0);

  useThrottleEffect(() => {
    function handleScroll() {
      setScrollY(window.scrollY);
    }

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, 100, []);

  return <div>滚动位置: {scrollY}</div>;
}
```

---

## 5. 性能优化类Hook

### 5.1 useDebounceCallback - 防抖回调

```typescript
import { useCallback, useRef } from 'react';

/**
 * 防抖回调 Hook
 * @param callback 回调函数
 * @param delay 防抖延迟时间
 */
function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
) {
  const timerRef = useRef<number | null>(null);

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return { debouncedCallback, cancel };
}

// 使用示例
function SearchBox() {
  const [query, setQuery] = useState('');

  const { debouncedCallback } = useDebounceCallback((q: string) => {
    console.log('搜索:', q);
    // 执行搜索API
  }, 300);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    debouncedCallback(e.target.value);
  };

  return (
    <input
      value={query}
      onChange={handleChange}
      placeholder="搜索..."
    />
  );
}

// 实际应用场景：窗口大小变化
function ResponsiveComponent() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  const { debouncedCallback } = useDebounceCallback(() => {
    setSize({
      width: window.innerWidth,
      height: window.innerHeight
    });
  }, 100);

  useEffect(() => {
    window.addEventListener('resize', debouncedCallback);
    return () => window.removeEventListener('resize', debouncedCallback);
  }, [debouncedCallback]);

  return <div>{size.width} x {size.height}</div>;
}
```

### 5.2 useThrottleCallback - 节流回调

```typescript
import { useCallback, useRef } from 'react';

/**
 * 节流回调 Hook
 * @param callback 回调函数
 * @param delay 节流延迟时间
 */
function useThrottleCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
) {
  const lastRun = useRef(Date.now());
  const timerRef = useRef<number | null>(null);

  const throttledCallback = useCallback((...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = now;
    } else if (!timerRef.current) {
      timerRef.current = setTimeout(() => {
        callback(...args);
        lastRun.current = Date.now();
        timerRef.current = null;
      }, delay - (now - lastRun.current));
    }
  }, [callback, delay]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return { throttledCallback, cancel };
}

// 使用示例
function ScrollTracker() {
  const [scrollY, setScrollY] = useState(0);

  const { throttledCallback } = useThrottleCallback(() => {
    setScrollY(window.scrollY);
  }, 100);

  useEffect(() => {
    window.addEventListener('scroll', throttledCallback);
    return () => window.removeEventListener('scroll', throttledCallback);
  }, [throttledCallback]);

  return <div>滚动位置: {scrollY}</div>;
}

// 实际应用场景：输入验证
function Form() {
  const [email, setEmail] = useState('');

  const { throttledCallback } = useThrottleCallback((value: string) => {
    // 验证邮箱格式
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    console.log('邮箱验证:', isValid);
  }, 500);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    throttledCallback(e.target.value);
  };

  return (
    <input
      type="email"
      value={email}
      onChange={handleChange}
      placeholder="邮箱"
    />
  );
}
```

### 5.3 useIsomorphicLayoutEffect - 同构布局Effect

```typescript
import { useEffect, useLayoutEffect } from 'react';

/**
 * 同构布局Effect Hook
 * 用于SSR环境，避免useLayoutEffect在服务端报错
 */
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// 使用示例
function useMeasure() {
  const ref = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState({ width: 0, height: 0 });

  useIsomorphicLayoutEffect(() => {
    if (ref.current) {
      const { width, height } = ref.current.getBoundingClientRect();
      setRect({ width, height });
    }
  }, []);

  return [ref, rect] as const;
}

// 实际应用场景：SSR组件
function SSRComponent() {
  const [ref, rect] = useMeasure();

  return (
    <div ref={ref}>
      <p>宽度: {rect.width}</p>
      <p>高度: {rect.height}</p>
    </div>
  );
}
```

---

## 6. 工具类Hook

### 6.1 useId - 唯一ID生成

```typescript
import { useState, useEffect, useCallback } from 'react';

/**
 * 唯一ID生成 Hook
 * @param prefix ID前缀
 */
function useId(prefix = 'use-id'): string {
  const [id, setId] = useState<string>('');

  useEffect(() => {
    setId(`${prefix}-${Math.random().toString(36).substr(2, 9)}`);
  }, [prefix]);

  return id;
}

// 使用示例
function Form() {
  const id = useId('input');

  return (
    <div>
      <label htmlFor={id}>姓名</label>
      <input id={id} type="text" />
    </div>
  );
}

// 实际应用场景：无障碍访问
function Accordion() {
  const id = useId('accordion');

  return (
    <div>
      <h3>
        <button
          id={`${id}-button`}
          aria-expanded="false"
          aria-controls={`${id}-panel`}
        >
          标题
        </button>
      </h3>
      <div id={`${id}-panel`} aria-labelledby={`${id}-button`}>
        内容
      </div>
    </div>
  );
}
```

### 6.2 useConst - 常量值

```typescript
import { useRef } from 'react';

/**
 * 常量值 Hook
 * @param value 常量值
 */
function useConst<T>(value: T): T {
  const ref = useRef<T>(value);
  return ref.current;
}

// 使用示例
function Component() {
  const config = useConst({
    apiUrl: '/api',
    timeout: 5000,
    retry: 3,
  });

  // config 引用始终不变
  return <div>{config.apiUrl}</div>;
}

// 实际应用场景：配置对象
function Chart() {
  const defaultOptions = useConst<ChartOptions>({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
    },
  });

  return <ResponsiveChart options={defaultOptions} />;
}
```

### 6.3 useConstCallback - 常量回调

```typescript
import { useRef, useCallback } from 'react';

/**
 * 常量回调 Hook
 * @param callback 回调函数
 */
function useConstCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const ref = useRef<T>(callback);
  return useCallback((...args: Parameters<T>) => {
    return ref.current(...args);
  }, []);
}

// 使用示例
function Component() {
  const handleClick = useConstCallback(() => {
    console.log('点击');
    // 这个函数引用始终不变
  });

  return <button onClick={handleClick}>点击</button>;
}

// 实际应用场景：传递给memo组件
const Child = React.memo(({ onClick }: { onClick: () => void }) => {
  return <button onClick={onClick}>子组件</button>;
});

function Parent() {
  const handleClick = useConstCallback(() => {
    console.log('点击');
  });

  return <Child onClick={handleClick} />;
}
```

### 6.4 usePreviousDistinct - 上一次不同的值

```typescript
import { useEffect, useRef } from 'react';

/**
 * 获取上一次不同的值
 * @param value 当前值
 */
function usePreviousDistinct<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    if (ref.current !== value) {
      ref.current = value;
    }
  }, [value]);

  return ref.current;
}

// 使用示例
function ValueCompare({ value }) {
  const previousValue = usePreviousDistinct(value);

  if (previousValue !== undefined && previousValue !== value) {
    console.log('值变化:', previousValue, '->', value);
  }

  return <div>当前值: {value}</div>;
}

// 实际应用场景：状态变化监听
function StateMonitor({ state }) {
  const previousState = usePreviousDistinct(state);

  useEffect(() => {
    if (previousState !== undefined && previousState !== state) {
      console.log('状态变化:', previousState, '->', state);
      // 执行状态变化后的逻辑
    }
  }, [state, previousState]);

  return <div>{state}</div>;
}
```

### 6.5 useShallowCompareEffect - 浅比较Effect

```typescript
import { useEffect, useRef } from 'react';

/**
 * 浅比较Effect Hook
 * @param effect Effect函数
 * @param deps 依赖数组
 */
function useShallowCompareEffect(
  effect: () => void | (() => void),
  deps: any[]
) {
  const ref = useRef<any[]>([]);

  // 浅比较依赖
  const hasChanged = deps.some((dep, index) => {
    if (!ref.current[index]) return true;
    return !Object.is(dep, ref.current[index]);
  });

  useEffect(() => {
    if (hasChanged) {
      const cleanup = effect();
      ref.current = deps;
      return cleanup;
    }
  }, deps);
}

// 使用示例
function Component({ object, array }) {
  useShallowCompareEffect(() => {
    console.log('对象或数组变化');
  }, [object, array]);

  return <div>内容</div>;
}

// 实际应用场景：复杂对象依赖
function Chart({ data }) {
  useShallowCompareEffect(() => {
    // 只在data实际变化时重新渲染
    renderChart(data);
  }, [data]);

  return <div id="chart" />;
}
```

---

## 7. 高级模式类Hook

### 7.1 useAsyncEffect - 异步Effect

```typescript
import { useEffect, useRef } from 'react';

/**
 * 异步Effect Hook
 * @param effect 异步Effect函数
 * @param deps 依赖数组
 */
function useAsyncEffect(
  effect: (isMounted: () => boolean) => Promise<void | (() => void)>,
  deps: any[] = []
) {
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    const cleanup = effect(() => isMountedRef.current);

    return () => {
      isMountedRef.current = false;
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, deps);
}

// 使用示例
function DataFetching() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useAsyncEffect(async (isMounted) => {
    try {
      setLoading(true);
      const response = await fetch('/api/data');
      const json = await response.json();

      if (isMounted()) {
        setData(json);
        setError(null);
      }
    } catch (error) {
      if (isMounted()) {
        setError(error);
      }
    } finally {
      if (isMounted()) {
        setLoading(false);
      }
    }
  }, []);

  return (
    <div>
      {loading && <div>加载中...</div>}
      {error && <div>错误: {error.message}</div>}
      {data && <div>{JSON.stringify(data)}</div>}
    </div>
  );
}

// 实际应用场景：复杂异步逻辑
function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([]);

  useAsyncEffect(async (isMounted) => {
    const subscription = await subscribeToRoom(roomId);

    subscription.onMessage((message) => {
      if (isMounted()) {
        setMessages(prev => [...prev, message]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId]);

  return (
    <div>
      {messages.map(message => (
        <div key={message.id}>{message.text}</div>
      ))}
    </div>
  );
}
```

### 7.2 useCreation - 仅创建一次

```typescript
import { useRef } from 'react';

/**
 * 仅创建一次 Hook
 * @param factory 工厂函数
 */
function useCreation<T>(factory: () => T): T {
  const ref = useRef<T | null>(null);

  if (ref.current === null) {
    ref.current = factory();
  }

  return ref.current;
}

// 使用示例
function Component() {
  const expensiveObject = useCreation(() => {
    console.log('创建对象');
    return {
      data: 'expensive data',
      compute: () => {
        // 复杂计算
        return 42;
      },
    };
  });

  return <div>{expensiveObject.compute()}</div>;
}

// 实际应用场景：单例模式
function ServiceContainer() {
  const apiClient = useCreation(() => new ApiClient());
  const eventBus = useCreation(() => new EventBus());

  return <div>服务容器</div>;
}
```

### 7.3 useLatest - 最新值引用

```typescript
import { useRef, useEffect } from 'react';

/**
 * 最新值引用 Hook
 * @param value 值
 */
function useLatest<T>(value: T): { current: T } {
  const ref = useRef<T>(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
}

// 使用示例
function Component({ callback }) {
  const latestCallback = useLatest(callback);

  useEffect(() => {
    const interval = setInterval(() => {
      // 使用最新值
      latestCallback.current();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return <div>定时调用回调</div>;
}

// 实际应用场景：定时器中的回调
function Timer({ onTick }) {
  const latestOnTick = useLatest(onTick);

  useEffect(() => {
    const interval = setInterval(() => {
      latestOnTick.current();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return <div>定时器运行中...</div>;
}
```

### 7.4 useEventListenerWithTarget - 带目标的事件监听

```typescript
import { useEffect, useRef, useCallback } from 'react';

/**
 * 带目标的事件监听 Hook
 * @param target 目标元素或事件名称
 * @param event 事件名称
 * @param handler 事件处理函数
 * @param options 事件选项
 */
function useEventListenerWithTarget<
  K extends keyof WindowEventMap,
  T extends HTMLElement | Window | Document | null
>(
  target: T,
  event: K,
  handler: (event: WindowEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
) {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const effectiveTarget = target || window;

    if (!effectiveTarget?.addEventListener) {
      return;
    }

    const eventListener = (event: Event) =>
      savedHandler.current(event as WindowEventMap[K]);

    effectiveTarget.addEventListener(event, eventListener, options);

    return () => {
      effectiveTarget.removeEventListener(event, eventListener, options);
    };
  }, [event, target, options]);
}

// 使用示例
function Component() {
  const divRef = useRef<HTMLDivElement>(null);

  // 监听div点击
  useEventListenerWithTarget(divRef, 'click', () => {
    console.log('div clicked');
  });

  // 监听window滚动
  useEventListenerWithTarget(window, 'scroll', () => {
    console.log('window scrolled');
  });

  return <div ref={divRef}>点击我</div>;
}

// 实际应用场景：文档点击
function Dropdown() {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEventListenerWithTarget(dropdownRef, 'click', () => {
    setIsOpen(true);
  });

  useEventListenerWithTarget(document, 'click', (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  });

  return (
    <div ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)}>菜单</button>
      {isOpen && <div className="dropdown">菜单内容</div>}
    </div>
  );
}
```

### 7.5 useThrottleEffectWithLeading - 带前导的节流Effect

```typescript
import { useEffect, useRef } from 'react';

/**
 * 带前导的节流Effect Hook
 * @param effect Effect函数
 * @param delay 节流延迟时间
 * @param leading 是否立即执行
 * @param deps 依赖数组
 */
function useThrottleEffectWithLeading(
  effect: () => void | (() => void),
  delay: number,
  leading: boolean = true,
  deps: any[] = []
) {
  const lastRun = useRef(Date.now());
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const now = Date.now();

    if (leading && !lastRun.current) {
      const cleanup = effect();
      lastRun.current = now;
      return cleanup;
    }

    if (now - lastRun.current >= delay) {
      const cleanup = effect();
      lastRun.current = now;
      return cleanup;
    }

    if (!timerRef.current) {
      timerRef.current = setTimeout(() => {
        const cleanup = effect();
        lastRun.current = Date.now();
        timerRef.current = null;
      }, delay - (now - lastRun.current));
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// 使用示例
function ScrollTracker() {
  const [scrollY, setScrollY] = useState(0);

  useThrottleEffectWithLeading(() => {
    setScrollY(window.scrollY);
  }, 100, true);

  return <div>滚动位置: {scrollY}</div>;
}

// 实际应用场景：搜索输入
function SearchBox() {
  const [query, setQuery] = useState('');

  useThrottleEffectWithLeading(() => {
    if (query) {
      console.log('搜索:', query);
      // 执行搜索
    }
  }, 300, true);

  return (
    <input
      value={query}
      onChange={e => setQuery(e.target.value)}
      placeholder="搜索..."
    />
  );
}
```

---

## 总结

本指南提供了20个实用的自定义Hook，涵盖了：

1. **状态管理类**（11个）：usePrevious、useToggle、useCounter、useInterval、useDebounce、useThrottle、useLocalStorage、useSessionStorage、useAsync、useMount、useUnmount
2. **副作用处理类**（8个）：useClickOutside、useKeyPress、useMousePosition、useScrollPosition、useEventListener、useMediaQuery、useNetwork、useVisibilityChange
3. **数据获取类**（4个）：useFetch、useDebounceFetch、usePolling、useInfiniteScroll
4. **DOM操作类**（5个）：useMeasure、useCopyToClipboard、useScript、useStyle、useThrottleEffect
5. **性能优化类**（3个）：useDebounceCallback、useThrottleCallback、useIsomorphicLayoutEffect
6. **工具类**（5个）：useId、useConst、useConstCallback、usePreviousDistinct、useShallowCompareEffect
7. **高级模式类**（5个）：useAsyncEffect、useCreation、useLatest、useEventListenerWithTarget、useThrottleEffectWithLeading

这些Hook遵循以下最佳实践：

- ✅ 遵循Hooks使用规则（只在顶层调用）
- ✅ 使用TypeScript类型安全
- ✅ 包含清理函数避免内存泄漏
- ✅ 支持SSR环境
- ✅ 提供详细的使用示例
- ✅ 符合React 19最新规范

建议将这些Hook保存到项目中，根据需要使用。