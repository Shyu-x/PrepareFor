# React 19.2 官方参考文档

## 一、React 核心 API

### 1.1 Hooks

#### 1.1.1 useActionState

**概述**：useActionState 是 React 19 引入的新 Hook，用于管理表单提交状态和处理 Server Action 的返回值。

**核心概念**：
- 接收一个异步函数（Server Action）和初始状态
- 返回当前状态、表单 Action 和 pending 标志
- 自动处理异步状态和错误

**语法**：
```typescript
const [state, formAction, isPending] = useActionState(
  action: (previousState: S, payload: F) => Promise<S | void>,
  initialState: S,
  permalink?: string
): [S, (formData: FormData) => void, boolean]
```

**完整示例**：
```typescript
'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// Server Action：创建用户
export async function createUserAction(
  previousState: { success?: boolean; error?: string },
  formData: FormData
) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;

  try {
    // 验证输入
    if (!email || !password || !name) {
      return { success: false, error: '所有字段都是必填的' };
    }

    // 创建用户
    const user = await db.users.create({
      data: { email, password, name },
    });

    // 重新验证路径
    revalidatePath('/users');

    return { success: true, user };
  } catch (error) {
    return { success: false, error: '创建用户失败' };
  }
}

// Client Component：使用 useActionState
'use client';

import { useActionState } from 'react';
import { createUserAction } from '@/actions/user';

function CreateUserForm() {
  const [state, formAction, isPending] = useActionState(
    createUserAction,
    { success: undefined, error: undefined }
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.success && (
        <div className="p-3 bg-green-100 text-green-700 rounded">
          用户创建成功！
        </div>
      )}
      
      {state.error && (
        <div className="p-3 bg-red-100 text-red-700 rounded">
          {state.error}
        </div>
      )}

      <div>
        <label className="block mb-1">姓名</label>
        <input
          name="name"
          type="text"
          required
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block mb-1">邮箱</label>
        <input
          name="email"
          type="email"
          required
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block mb-1">密码</label>
        <input
          name="password"
          type="password"
          required
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
      >
        {isPending ? '创建中...' : '创建用户'}
      </button>
    </form>
  );
}
```

**最佳实践**：
1. Server Action 必须使用 `'use server'` 指令
2. 使用 useActionState 处理表单提交
3. 在 Server Action 中进行输入验证
4. 使用 revalidatePath 实现增量静态再生成
5. 提供用户友好的错误消息

**常见陷阱**：
- 忘记在 Server Action 中使用 `'use server'`
- Server Action 不是 async 函数
- 忘记处理错误情况
- 在 Client Component 中直接调用 Server Action

---

#### 1.1.2 useCallback

**概述**：useCallback 返回一个记忆化的回调函数，用于避免在每次渲染时创建新函数。

**核心概念**：
- 依赖数组控制函数重新创建
- 与 React.memo 配合使用优化性能
- 避免不必要的子组件重渲染

**语法**：
```typescript
const memoizedCallback = useCallback(
  (args: Args) => Result,
  [dependencies]
): T
```

**完整示例**：
```typescript
import { useState, useCallback, memo } from 'react';

// 子组件：使用 React.memo 优化
const ItemComponent = memo(({ item, onClick }: { item: Item; onClick: (id: string) => void }) => {
  console.log('渲染:', item.name);
  return (
    <div onClick={() => onClick(item.id)} className="item">
      {item.name}
    </div>
  );
});

function ParentComponent() {
  const [items, setItems] = useState<Item[]>([
    { id: '1', name: '项目1' },
    { id: '2', name: '项目2' },
  ]);

  // ✅ 正确：使用 useCallback 缓存函数
  const handleClick = useCallback((id: string) => {
    console.log('点击:', id);
  }, []);

  // ✅ 正确：依赖其他 state 的回调使用 useCallback
  const handleDelete = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  // ❌ 错误：不必要地使用 useCallback
  const simpleHandler = useCallback(() => {
    console.log('简单处理');
  }, []); // 简单函数不需要 useCallback

  return (
    <div>
      {items.map(item => (
        <ItemComponent key={item.id} item={item} onClick={handleClick} />
      ))}
    </div>
  );
}
```

**性能优化场景**：
```typescript
// 场景 1：传递给 memo 组件
const MemoizedComponent = memo(({ data, callback }) => {
  // 只在 data 或 callback 变化时重渲染
  return <div>{callback(data)}</div>;
});

// 场景 2：传递给 useEffect 依赖
useEffect(() => {
  fetchData(callback);
}, [callback]); // callback 变化时重新订阅

// 场景 3：传递给 useMemo 依赖
const result = useMemo(() => compute(data, callback), [data, callback]);
```

**最佳实践**：
1. 函数传给 memo 组件时使用 useCallback
2. 函数作为 useEffect 依赖时使用 useCallback
3. 简单函数不需要 useCallback（可能更慢）
4. 依赖数组要完整，避免闭包陷阱

**常见陷阱**：
- 忘记添加依赖项
- 依赖数组不完整导致闭包陷阱
- 过度使用 useCallback 导致性能下降

---

#### 1.1.3 useContext

**概述**：useContext 接收一个 context 对象并返回当前 context 值。

**核心概念**：
- 用于跨组件状态共享
- 避免 props drilling
- 性能优化：拆分 Context

**语法**：
```typescript
const value = useContext(Context);
```

**完整示例**：
```typescript
// 创建 Context
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 提供 Context
function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 使用 Context
function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme 必须在 ThemeProvider 内使用');
  }
  return context;
}

// 消费 Context
function ThemedButton() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      style={{ background: theme === 'light' ? '#fff' : '#333' }}
    >
      切换主题
    </button>
  );
}

// 组合多个 Context
function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
```

**性能优化**：
```typescript
// ❌ 错误：每次渲染都创建新对象
function BadProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialState);
  const value = { state, setState }; // 每次都创建新对象
  return <MyContext.Provider value={value}>{children}</MyContext.Provider>;
}

// ✅ 正确：使用 useMemo 优化
function GoodProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialState);
  const value = useMemo(() => ({ state, setState }), [state]);
  return <MyContext.Provider value={value}>{children}</MyContext.Provider>;
}

// ✅ 更好的方案：拆分 Context
const UserContext = createContext<User | null>(null);
const UserActionsContext = createContext<{
  updateUser: (user: User) => void;
} | null>(null);

function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const actions = useMemo(() => ({ updateUser: setUser }), []);
  
  return (
    <UserContext.Provider value={user}>
      <UserActionsContext.Provider value={actions}>
        {children}
      </UserActionsContext.Provider>
    </UserContext.Provider>
  );
}
```

**最佳实践**：
1. 使用自定义 Hook 封装 useContext
2. 拆分 Context 避免不必要的重渲染
3. 使用 useMemo 优化 Context 值
4. 提供默认值避免错误

**常见陷阱**：
- 忘记检查 context 是否存在
- Context 值每次都创建新对象
- 过度使用 Context 导致性能问题

---

#### 1.1.4 useDebugValue

**概述**：useDebugValue 用于在 React DevTools 中显示自定义 Hook 的标签。

**核心概念**：
- 仅用于开发调试
- 不影响生产环境
- 可以延迟格式化

**语法**：
```typescript
useDebugValue(value: any);
useDebugValue(value: any, format: (value: any) => any);
```

**完整示例**：
```typescript
// 基础用法
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('读取 localStorage 失败:', error);
      return initialValue;
    }
  });

  // 在 DevTools 中显示 key
  useDebugValue(key);

  return { value, setValue };
}

// 延迟格式化
function useFriendStatus(friendID: number) {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  // 延迟格式化，避免每次渲染都执行
  useDebugValue(friendID, id => `好友 ${id} 的在线状态: ${isOnline ? '在线' : '离线'}`);

  useEffect(() => {
    function handleStatusChange(status: boolean) {
      setIsOnline(status.isOnline);
    }

    ChatAPI.subscribeToFriendStatus(friendID, handleStatusChange);
    return () => {
      ChatAPI.unsubscribeFromFriendStatus(friendID, handleStatusChange);
    };
  }, [friendID]);

  return isOnline;
}

// 条件显示
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);

  // 只在 count > 0 时显示
  useDebugValue(count, c => (c > 0 ? `计数: ${c}` : '计数: 初始值'));

  return { count, setCount };
}
```

**最佳实践**：
1. 仅用于开发调试
2. 使用延迟格式化避免性能问题
3. 条件显示避免不必要的标签
4. 不要在生产环境使用

**常见陷阱**：
- 在生产环境使用 useDebugValue
- 没有使用延迟格式化导致性能问题
- 过度使用 useDebugValue 导致 DevTools 混乱

---

#### 1.1.5 useDeferredValue

**概述**：useDeferredValue 接收一个值并返回该值的延迟版本，用于延迟非紧急更新。

**核心概念**：
- 延迟非紧急更新
- 与 useTransition 类似
- 用于优化用户体验

**语法**：
```typescript
const deferredValue = useDeferredValue(value: T, options?: { timeoutMs: number }): T
```

**完整示例**：
```typescript
import { useState, useDeferredValue } from 'react';

function SearchResults() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="搜索..."
      />
      
      {/* 延迟渲染结果 */}
      <Results query={deferredQuery} />
    </div>
  );
}

// 与 useTransition 对比
function SearchWithTransition() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    startTransition(() => {
      setQuery(e.target.value);
    });
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="搜索..."
      />
      
      {isPending && <div>加载中...</div>}
      <Results query={query} />
    </div>
  );
}
```

**性能优化场景**：
```typescript
// 场景 1：搜索框
function SearchBox() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query, { timeoutMs: 500 });

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <ExpensiveSearchResults query={deferredQuery} />
    </div>
  );
}

// 场景 2：列表过滤
function FilteredList() {
  const [filter, setFilter] = useState('');
  const deferredFilter = useDeferredValue(filter);

  return (
    <div>
      <input value={filter} onChange={e => setFilter(e.target.value)} />
      <ExpensiveList filter={deferredFilter} />
    </div>
  );
}

// 场景 3：复杂计算
function ComplexCalculation() {
  const [input, setInput] = useState('');
  const deferredInput = useDeferredValue(input);

  return (
    <div>
      <input value={input} onChange={e => setInput(e.target.value)} />
      <ExpensiveCalculation input={deferredInput} />
    </div>
  );
}
```

**最佳实践**：
1. 用于延迟非紧急更新
2. 与 Expensive 组件配合使用
3. 设置合理的 timeoutMs
4. 与 useTransition 配合使用

**常见陷阱**：
- 用于紧急更新
- timeoutMs 设置不合理
- 与 useTransition 混用导致混淆

---

#### 1.1.6 useEffect

**概述**：useEffect 接收一个包含副作用逻辑的函数，在组件渲染后执行。

**核心概念**：
- 处理副作用
- 依赖数组控制执行时机
- 清理函数处理资源释放

**语法**：
```typescript
useEffect(
  (args: Args) => Result | (() => void),
  [dependencies]
): void
```

**完整示例**：
```typescript
import { useState, useEffect } from 'react';

// 场景 1：数据获取
function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        const result = await fetch('/api/users');
        const json = await result.json();

        if (!cancelled) {
          setUsers(json);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
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
  }, []);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

// 场景 2：订阅事件
function ChatRoom({ roomId }: { roomId: string }) {
  useEffect(() => {
    const subscription = chat.subscribe(roomId, onMessage);

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId]);

  return <div>聊天室</div>;
}

// 场景 3：定时器
function Timer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return <div>{seconds} 秒</div>;
}

// 场景 4：监听窗口大小
function useWindowSize() {
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
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

// 场景 5：使用 AbortController
function DataFetchingWithAbort() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/data', { signal: controller.signal })
      .then(res => res.json())
      .then(setData)
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error(err);
        }
      });

    return () => {
      controller.abort();
    };
  }, []);

  return <div>{JSON.stringify(data)}</div>;
}
```

**最佳实践**：
1. 使用清理函数释放资源
2. 使用 AbortController 处理异步请求
3. 正确设置依赖数组
4. 避免在 useEffect 中使用 async 函数

**常见陷阱**：
- 忘记清理资源导致内存泄漏
- 依赖数组不完整导致闭包陷阱
- 在 useEffect 中使用 async 函数
- 忘记检查组件是否已卸载

---

#### 1.1.7 useEffectEvent

**概述**：useEffectEvent 是 React 19 引入的新 Hook，用于处理事件处理函数的最新值。

**核心概念**：
- 保持事件处理函数的最新值
- 避免闭包陷阱
- 与 useEffect 配合使用

**语法**：
```typescript
const eventHandler = useEffectEvent((args: Args) => Result);
```

**完整示例**：
```typescript
import { useState, useEffect, useEffectEvent } from 'react';

function ChatRoom({ roomId }: { roomId: string }) {
  const [message, setMessage] = useState('');

  // ✅ 正确：使用 useEffectEvent 保持最新值
  const onMessage = useEffectEvent((msg: string) => {
    console.log(`收到消息: ${msg}, 房间: ${roomId}`);
  });

  useEffect(() => {
    const subscription = chat.subscribe(roomId, onMessage);

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId, onMessage]);

  return (
    <div>
      <input value={message} onChange={e => setMessage(e.target.value)} />
      <button onClick={() => chat.send(roomId, message)}>发送</button>
    </div>
  );
}

// 对比：❌ 错误的写法
function BadChatRoom({ roomId }: { roomId: string }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<string[]>([]);

  // ❌ 错误：onMessage 闭包中的 roomId 是固定的
  const onMessage = (msg: string) => {
    console.log(`收到消息: ${msg}, 房间: ${roomId}`);
    setMessages(prev => [...prev, msg]);
  };

  useEffect(() => {
    const subscription = chat.subscribe(roomId, onMessage);

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId, onMessage]); // onMessage 变化会导致重新订阅

  return (
    <div>
      <input value={message} onChange={e => setMessage(e.target.value)} />
      <button onClick={() => chat.send(roomId, message)}>发送</button>
      <ul>
        {messages.map((msg, i) => (
          <li key={i}>{msg}</li>
        ))}
      </ul>
    </div>
  );
}
```

**最佳实践**：
1. 使用 useEffectEvent 处理事件处理函数
2. 避免闭包陷阱
3. 与 useEffect 配合使用
4. 保持事件处理函数的最新值

**常见陷阱**：
- 忘记使用 useEffectEvent 导致闭包陷阱
- 在 useEffectEvent 中使用状态导致无限循环
- 过度使用 useEffectEvent 导致性能问题

---

#### 1.1.8 useId

**概述**：useId 生成一个唯一的 ID，用于避免 hydration 不匹配问题。

**核心概念**：
- 生成唯一 ID
- SSR 安全
- 避免 hydration 不匹配

**语法**：
```typescript
const id = useId(): string
```

**完整示例**：
```typescript
import { useId } from 'react';

// 场景 1：表单元素
function Form() {
  const id = useId();

  return (
    <div>
      <label htmlFor={id}>姓名</label>
      <input id={id} type="text" />
    </div>
  );
}

// 场景 2：多个表单元素
function ComplexForm() {
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();

  return (
    <form>
      <div>
        <label htmlFor={nameId}>姓名</label>
        <input id={nameId} type="text" />
      </div>
      <div>
        <label htmlFor={emailId}>邮箱</label>
        <input id={emailId} type="email" />
      </div>
      <div>
        <label htmlFor={passwordId}>密码</label>
        <input id={passwordId} type="password" />
      </div>
    </form>
  );
}

// 场景 3：可访问性
function Accordion() {
  const panelId = useId();

  return (
    <div>
      <button aria-expanded="true" aria-controls={panelId}>
        点击展开
      </button>
      <div id={panelId} aria-labelledby={panelId}>
        这里是内容
      </div>
    </div>
  );
}

// 场景 4：自定义 Hook
function useAccessibleInput(label: string) {
  const id = useId();

  return {
    labelProps: { htmlFor: id },
    inputProps: { id },
  };
}

function Input({ label }: { label: string }) {
  const { labelProps, inputProps } = useAccessibleInput(label);

  return (
    <div>
      <label {...labelProps}>{label}</label>
      <input {...inputProps} type="text" />
    </div>
  );
}
```

**最佳实践**：
1. 使用 useId 生成表单元素的唯一 ID
2. 用于可访问性属性
3. 避免 hydration 不匹配
4. 在 Server Components 中使用

**常见陷阱**：
- 使用 Math.random() 生成 ID
- 在循环中使用 useId 导致不一致
- 忘记在 Server Components 中使用

---

#### 1.1.9 useImperativeHandle

**概述**：useImperativeHandle 自定义暴露给父组件的实例值。

**核心概念**：
- 自定义暴露的实例值
- 与 forwardRef 配合使用
- 避免暴露不必要的方法

**语法**：
```typescript
useImperativeHandle(
  ref: Ref<T>,
  createHandle: () => T,
  [dependencies]
): void
```

**完整示例**：
```typescript
import { forwardRef, useImperativeHandle, useRef } from 'react';

// 场景 1：基本用法
const Child = forwardRef((props, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
    getValue: () => {
      return inputRef.current?.value;
    },
    clear: () => {
      inputRef.current!.value = '';
    }
  }));

  return <input ref={inputRef} />;
});

function Parent() {
  const childRef = useRef<{ focus: () => void; getValue: () => string; clear: () => void }>(null);

  const handleClick = () => {
    childRef.current?.focus();
    console.log(childRef.current?.getValue());
  };

  return (
    <div>
      <Child ref={childRef} />
      <button onClick={handleClick}>操作子组件</button>
    </div>
  );
}

// 场景 2：可访问性
const CustomInput = forwardRef((props, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
    select: () => {
      inputRef.current?.select();
    },
    setSelectionRange: (start: number, end: number) => {
      inputRef.current?.setSelectionRange(start, end);
    }
  }));

  return <input ref={inputRef} />;
});

function TextEditor() {
  const inputRef = useRef<{ focus: () => void; select: () => void }>(null);

  return (
    <div>
      <CustomInput ref={inputRef} />
      <button onClick={() => inputRef.current?.focus()}>聚焦</button>
      <button onClick={() => inputRef.current?.select()}>全选</button>
    </div>
  );
}

// 场景 3：表单验证
interface FormActions {
  validate: () => boolean;
  reset: () => void;
  submit: () => void;
}

const FormComponent = forwardRef((props, ref) => {
  const [values, setValues] = useState({ name: '', email: '' });

  useImperativeHandle(ref, () => ({
    validate: () => {
      // 验证逻辑
      return true;
    },
    reset: () => {
      setValues({ name: '', email: '' });
    },
    submit: () => {
      // 提交逻辑
    }
  }));

  return (
    <form>
      <input
        value={values.name}
        onChange={e => setValues({ ...values, name: e.target.value })}
      />
      <input
        value={values.email}
        onChange={e => setValues({ ...values, email: e.target.value })}
      />
    </form>
  );
});

function ParentForm() {
  const formRef = useRef<FormActions>(null);

  return (
    <div>
      <FormComponent ref={formRef} />
      <button onClick={() => formRef.current?.validate()}>验证</button>
      <button onClick={() => formRef.current?.reset()}>重置</button>
      <button onClick={() => formRef.current?.submit()}>提交</button>
    </div>
  );
}
```

**最佳实践**：
1. 只暴露必要的方法
2. 与 forwardRef 配合使用
3. 避免暴露内部实现细节
4. 使用类型安全

**常见陷阱**：
- 暴露过多方法
- 忘记使用 forwardRef
- 暴露内部实现细节
- 类型定义不完整

---

#### 1.1.10 useInsertionEffect

**概述**：useInsertionEffect 是 React 19 引入的新 Hook，用于在 DOM 突变前执行副作用。

**核心概念**：
- 在 DOM 突变前执行
- 用于样式注入
- 避免 hydration 不匹配

**语法**：
```typescript
useInsertionEffect(
  (args: Args) => Result | (() => void),
  [dependencies]
): void
```

**完整示例**：
```typescript
import { useInsertionEffect, useEffect, useState } from 'react';

// 场景 1：动态样式注入
function useDynamicStyles(css: string) {
  useInsertionEffect(() => {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [css]);
}

function ComponentWithDynamicStyles() {
  const [theme, setTheme] = useState('light');

  const css = `
    .theme-${theme} {
      background-color: ${theme === 'light' ? '#fff' : '#333'};
      color: ${theme === 'light' ? '#333' : '#fff'};
    }
  `;

  useDynamicStyles(css);

  return (
    <div className={`theme-${theme}`}>
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        切换主题
      </button>
    </div>
  );
}

// 场景 2：CSS-in-JS 库
function useCSS(rules: string) {
  useInsertionEffect(() => {
    const id = `css-${Math.random().toString(36).slice(2)}`;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = rules;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [rules]);
}

// 场景 3：避免 hydration 不匹配
function useHydrationSafeEffect() {
  const [isMounted, setIsMounted] = useState(false);

  useInsertionEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
}

function Component() {
  const isMounted = useHydrationSafeEffect();

  if (!isMounted) {
    return null; // SSR 期间不渲染
  }

  return <div>客户端渲染</div>;
}
```

**最佳实践**：
1. 用于样式注入
2. 避免 hydration 不匹配
3. 在 DOM 突变前执行
4. 返回清理函数

**常见陷阱**：
- 用于数据获取
- 忘记返回清理函数
- 过度使用 useInsertionEffect

---

#### 1.1.11 useLayoutEffect

**概述**：useLayoutEffect 与 useEffect 类似，但同步执行，在 DOM 改变后、浏览器绘制前。

**核心概念**：
- 同步执行
- DOM 改变后、绘制前
- 用于测量 DOM

**语法**：
```typescript
useLayoutEffect(
  (args: Args) => Result | (() => void),
  [dependencies]
): void
```

**完整示例**：
```typescript
import { useLayoutEffect, useRef, useState } from 'react';

// 场景 1：测量 DOM
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

function MeasuredComponent() {
  const { ref, rect } = useMeasure();

  return (
    <div ref={ref}>
      <p>宽度: {rect.width}px</p>
      <p>高度: {rect.height}px</p>
    </div>
  );
}

// 场景 2：滚动位置
function useScrollPosition() {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useLayoutEffect(() => {
    function updatePosition() {
      setPosition({ x: window.scrollX, y: window.scrollY });
    }

    window.addEventListener('scroll', updatePosition);
    updatePosition(); // 初始位置

    return () => window.removeEventListener('scroll', updatePosition);
  }, []);

  return position;
}

function ScrollComponent() {
  const { x, y } = useScrollPosition();

  return (
    <div>
      <p>滚动位置: {x}, {y}</p>
    </div>
  );
}

// 场景 3：动画
function useAnimation() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (visible && ref.current) {
      const element = ref.current;
      const animation = element.animate(
        [
          { opacity: 0, transform: 'translateY(-20px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ],
        { duration: 300, easing: 'ease-out' }
      );

      animation.onfinish = () => {
        setVisible(false);
      };
    }
  }, [visible]);

  return { visible, setVisible, ref };
}

function AnimationComponent() {
  const { visible, setVisible, ref } = useAnimation();

  return (
    <div>
      <button onClick={() => setVisible(true)}>显示</button>
      {visible && (
        <div ref={ref} style={{ opacity: 0 }}>
          动画内容
        </div>
      )}
    </div>
  );
}

// 场景 4：与 useEffect 对比
function EffectComparison() {
  useLayoutEffect(() => {
    console.log('useLayoutEffect: 同步执行');
  }, []);

  useEffect(() => {
    console.log('useEffect: 异步执行');
  }, []);

  return <div>查看控制台</div>;
}
```

**最佳实践**：
1. 用于测量 DOM
2. 用于同步更新
3. 用于动画
4. 避免过度使用

**常见陷阱**：
- 用于数据获取
- 忘记返回清理函数
- 过度使用 useLayoutEffect 导致性能问题

---

#### 1.1.12 useMemo

**概述**：useMemo 返回一个记忆化的值，用于避免昂贵的计算。

**核心概念**：
- 缓存计算结果
- 依赖数组控制重新计算
- 与 React.memo 配合使用

**语法**：
```typescript
const memoizedValue = useMemo(
  (args: Args) => Result,
  [dependencies]
): T
```

**完整示例**：
```typescript
import { useState, useMemo } from 'react';

// 场景 1：复杂计算
function ExpensiveCalculation({ numbers }: { numbers: number[] }) {
  const result = useMemo(() => {
    // 模拟昂贵的计算
    return numbers.reduce((acc, num) => acc + num * num, 0);
  }, [numbers]);

  return <div>结果: {result}</div>;
}

// 场景 2：过滤和排序
function FilteredList({ items, filter, sort }: { items: Item[]; filter: string; sort: string }) {
  const filteredItems = useMemo(() => {
    return items
      .filter(item => item.name.toLowerCase().includes(filter.toLowerCase()))
      .sort((a, b) => {
        if (sort === 'asc') return a.name.localeCompare(b.name);
        if (sort === 'desc') return b.name.localeCompare(a.name);
        return 0;
      });
  }, [items, filter, sort]);

  return (
    <ul>
      {filteredItems.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}

// 场景 3：对象和数组
function ConfigComponent() {
  const [config, setConfig] = useState({ timeout: 5000, retry: 3 });

  const options = useMemo(() => ({
    timeout: config.timeout,
    retry: config.retry,
    headers: { 'Content-Type': 'application/json' },
  }), [config]);

  return <div>配置: {JSON.stringify(options)}</div>;
}

// 场景 4：与 useCallback 对比
function FormComponent() {
  const [data, setData] = useState({ name: '', email: '' });

  // 传给子组件的函数
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    console.log('提交', data);
  }, [data]);

  // 传给子组件的对象
  const config = useMemo(() => ({
    timeout: 5000,
    retry: 3
  }), []);

  return <Form onSubmit={handleSubmit} config={config} />;
}

// 场景 5：性能优化
function ParentComponent() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<Item[]>([]);

  // ❌ 错误：不必要地使用 useMemo
  const simpleValue = useMemo(() => count + 1, [count]); // 简单计算不需要 useMemo

  // ✅ 正确：复杂计算使用 useMemo
  const expensiveValue = useMemo(() => {
    return items
      .filter(item => item.active)
      .map(item => ({ ...item, processed: true }));
  }, [items]);

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <ChildComponent expensiveValue={expensiveValue} />
    </div>
  );
}
```

**最佳实践**：
1. 用于昂贵的计算
2. 用于对象和数组
3. 与 React.memo 配合使用
4. 避免过度使用

**常见陷阱**：
- 用于简单计算（可能更慢）
- 忘记添加依赖项
- 过度使用 useMemo 导致性能下降

---

#### 1.1.13 useOptimistic

**概述**：useOptimistic 是 React 19 引入的新 Hook，用于实现乐观更新。

**核心概念**：
- 乐观更新 UI
- 异步操作完成前先更新
- 提供流畅的用户体验

**语法**：
```typescript
const [optimisticState, addOptimistic] = useOptimistic(
  state: T,
  updater: (currentState: T, action: U) => T
): [T, (action: U) => void]
```

**完整示例**：
```typescript
import { useOptimistic, useState } from 'react';

// 场景 1：消息列表
function MessageList() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [optimisticMessages, addOptimistic] = useOptimistic(
    messages,
    (state, newMessage: string) => [
      ...state,
      { text: newMessage, pending: true, id: Date.now() }
    ]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const message = formData.get('message') as string;

    addOptimistic(message);

    try {
      await sendMessage(message);
      setMessages(prev => [...prev, { text: message, pending: false }]);
    } catch (error) {
      // 回滚
      setMessages(prev => prev.filter(m => !m.pending));
    }
  };

  return (
    <div>
      {optimisticMessages.map((msg, i) => (
        <div key={i} className={msg.pending ? 'pending' : ''}>
          {msg.text}
        </div>
      ))}
      <form onSubmit={handleSubmit}>
        <input name="message" />
        <button>发送</button>
      </form>
    </div>
  );
}

// 场景 2：点赞功能
function LikeButton({ postId, initialLikes }: { postId: string; initialLikes: number }) {
  const [likes, setLikes] = useState(initialLikes);
  const [optimisticLikes, addOptimistic] = useOptimistic(
    likes,
    (state) => state + 1
  );

  const handleLike = async () => {
    addOptimistic();

    try {
      await likePost(postId);
      setLikes(prev => prev + 1);
    } catch (error) {
      // 回滚
      setLikes(prev => prev - 1);
    }
  };

  return (
    <button onClick={handleLike}>
      👍 {optimisticLikes} 人喜欢
    </button>
  );
}

// 场景 3：购物车
function CartItem({ item }: { item: CartItem }) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [optimisticQuantity, addOptimistic] = useOptimistic(
    quantity,
    (state, action: 'increment' | 'decrement') => {
      if (action === 'increment') return state + 1;
      return Math.max(1, state - 1);
    }
  );

  const handleIncrement = async () => {
    addOptimistic('increment');

    try {
      await updateQuantity(item.id, optimisticQuantity);
      setQuantity(optimisticQuantity);
    } catch (error) {
      setQuantity(quantity);
    }
  };

  const handleDecrement = async () => {
    if (quantity <= 1) return;

    addOptimistic('decrement');

    try {
      await updateQuantity(item.id, optimisticQuantity);
      setQuantity(optimisticQuantity);
    } catch (error) {
      setQuantity(quantity);
    }
  };

  return (
    <div>
      <button onClick={handleDecrement}>-</button>
      {optimisticQuantity}
      <button onClick={handleIncrement}>+</button>
    </div>
  );
}

// 场景 4：与 useTransition 对比
function SearchWithOptimistic() {
  const [query, setQuery] = useState('');
  const [optimisticQuery, addOptimistic] = useOptimistic(
    query,
    (state, newQuery: string) => newQuery
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addOptimistic(e.target.value);
    setQuery(e.target.value);
  };

  return (
    <div>
      <input
        type="text"
        value={optimisticQuery}
        onChange={handleChange}
        placeholder="搜索..."
      />
      <Results query={optimisticQuery} />
    </div>
  );
}
```

**最佳实践**：
1. 用于实现乐观更新
2. 提供流畅的用户体验
3. 处理错误时回滚
4. 与 useTransition 配合使用

**常见陷阱**：
- 忘记处理错误回滚
- 过度使用乐观更新
- 忘记设置初始状态

---

#### 1.1.14 useReducer

**概述**：useReducer 接收一个 reducer 函数和初始状态，返回当前状态和 dispatch 函数。

**核心概念**：
- 状态管理
- 复杂状态逻辑
- 与 Context 配合使用

**语法**：
```typescript
const [state, dispatch] = useReducer(
  (state: T, action: U) => T,
  initialArg: T | (() => T),
  initialAction?: U
): [T, (action: U) => void]
```

**完整示例**：
```typescript
import { useReducer, useCallback } from 'react';

// 场景 1：基础用法
function Counter() {
  const [count, dispatch] = useReducer(
    (state: number, action: { type: 'increment' | 'decrement' }) => {
      if (action.type === 'increment') return state + 1;
      return state - 1;
    },
    0
  );

  return (
    <div>
      <p>计数: {count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
    </div>
  );
}

// 场景 2：复杂状态
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

interface TodoState {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed';
}

type TodoAction =
  | { type: 'ADD_TODO'; payload: string }
  | { type: 'TOGGLE_TODO'; payload: number }
  | { type: 'SET_FILTER'; payload: 'all' | 'active' | 'completed' }
  | { type: 'DELETE_TODO'; payload: number };

function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case 'ADD_TODO':
      return {
        ...state,
        todos: [
          ...state.todos,
          { id: Date.now(), text: action.payload, completed: false },
        ],
      };
    case 'TOGGLE_TODO':
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === action.payload
            ? { ...todo, completed: !todo.completed }
            : todo
        ),
      };
    case 'SET_FILTER':
      return { ...state, filter: action.payload };
    case 'DELETE_TODO':
      return {
        ...state,
        todos: state.todos.filter(todo => todo.id !== action.payload),
      };
    default:
      return state;
  }
}

function TodoApp() {
  const [state, dispatch] = useReducer(todoReducer, {
    todos: [],
    filter: 'all',
  });

  const addTodo = useCallback((text: string) => {
    dispatch({ type: 'ADD_TODO', payload: text });
  }, []);

  const toggleTodo = useCallback((id: number) => {
    dispatch({ type: 'TOGGLE_TODO', payload: id });
  }, []);

  const setFilter = useCallback((filter: 'all' | 'active' | 'completed') => {
    dispatch({ type: 'SET_FILTER', payload: filter });
  }, []);

  const deleteTodo = useCallback((id: number) => {
    dispatch({ type: 'DELETE_TODO', payload: id });
  }, []);

  const filteredTodos = state.todos.filter(todo => {
    if (state.filter === 'active') return !todo.completed;
    if (state.filter === 'completed') return todo.completed;
    return true;
  });

  return (
    <div>
      <button onClick={() => addTodo('新任务')}>添加任务</button>
      <div>
        <button onClick={() => setFilter('all')}>全部</button>
        <button onClick={() => setFilter('active')}>进行中</button>
        <button onClick={() => setFilter('completed')}>已完成</button>
      </div>
      <ul>
        {filteredTodos.map(todo => (
          <li key={todo.id}>
            <span
              onClick={() => toggleTodo(todo.id)}
              style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}
            >
              {todo.text}
            </span>
            <button onClick={() => deleteTodo(todo.id)}>删除</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// 场景 3：与 useState 对比
function CounterWithState() {
  const [count, setCount] = useState(0);
  const increment = () => setCount(prev => prev + 1);
  return <button onClick={increment}>Count: {count}</button>;
}

function CounterWithReducer() {
  const [count, dispatch] = useReducer(
    (state: number) => state + 1,
    0
  );
  return <button onClick={() => dispatch()}>Count: {count}</button>;
}

// 场景 4：异步操作
interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

type AsyncAction<T> =
  | { type: 'FETCH' }
  | { type: 'SUCCESS'; payload: T }
  | { type: 'ERROR'; payload: Error };

function useAsync<T>(fetcher: () => Promise<T>) {
  const [state, dispatch] = useReducer<React.Reducer<AsyncState<T>, AsyncAction<T>>>(
    (state: AsyncState<T>, action: AsyncAction<T>) => {
      switch (action.type) {
        case 'FETCH':
          return { ...state, loading: true, error: null };
        case 'SUCCESS':
          return { data: action.payload, loading: false, error: null };
        case 'ERROR':
          return { ...state, loading: false, error: action.payload };
        default:
          return state;
      }
    },
    { data: null, loading: true, error: null }
  );

  useEffect(() => {
    dispatch({ type: 'FETCH' });

    fetcher()
      .then(data => dispatch({ type: 'SUCCESS', payload: data }))
      .catch(error => dispatch({ type: 'ERROR', payload: error }));
  }, [fetcher]);

  return state;
}

function UserList() {
  const { data, loading, error } = useAsync<User[]>(() =>
    fetch('/api/users').then(res => res.json())
  );

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
```

**最佳实践**：
1. 用于复杂状态逻辑
2. 与 Context 配合使用
3. 处理异步操作
4. 避免过度使用

**常见陷阱**：
- 用于简单状态（应该使用 useState）
- 忘记处理所有 action 类型
- 过度使用 useReducer 导致代码复杂

---

#### 1.1.15 useRef

**概述**：useRef 返回一个可变的 ref 对象，其 .current 属性初始化为传入的参数。

**核心概念**：
- 访问 DOM 元素
- 存储可变值
- 跨渲染保持引用

**语法**：
```typescript
const ref = useRef<T>(initialValue): MutableRefObject<T>
```

**完整示例**：
```typescript
import { useRef, useEffect, useCallback } from 'react';

// 场景 1：访问 DOM 元素
function TextInputWithFocus() {
  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div>
      <input ref={inputRef} type="text" />
      <button onClick={focusInput}>聚焦输入框</button>
    </div>
  );
}

// 场景 2：存储任意可变值
function Timer() {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(intervalRef.current!);
    };
  }, []);

  return <div>{seconds} 秒</div>;
}

// 场景 3：保存上一次的值
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

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

// 场景 4：存储定时器 ID
function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => savedCallback.current(), delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

function TimerComponent() {
  const [seconds, setSeconds] = useState(0);

  useInterval(() => {
    setSeconds(prev => prev + 1);
  }, 1000);

  return <div>{seconds} 秒</div>;
}

// 场景 5：存储订阅
function useSubscription<T>(observable: Observable<T>) {
  const subscriptionRef = useRef<Subscription | null>(null);

  useEffect(() => {
    subscriptionRef.current = observable.subscribe(value => {
      // 处理值
    });

    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, [observable]);

  return subscriptionRef;
}

// 场景 6：存储上一次的 props
function usePreviousProps<T>(value: T): T {
  const ref = useRef<T>(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

function Component({ count }: { count: number }) {
  const previousCount = usePreviousProps(count);

  return (
    <div>
      <p>当前: {count}</p>
      <p>上次: {previousCount}</p>
    </div>
  );
}
```

**最佳实践**：
1. 用于访问 DOM 元素
2. 用于存储可变值
3. 用于保存上一次的值
4. 避免在渲染中使用 ref.current

**常见陷阱**：
- 在渲染中使用 ref.current
- 忘记初始化 ref
- 过度使用 useRef 导致状态管理混乱

---

#### 1.1.16 useSyncExternalStore

**概述**：useSyncExternalStore 是 React 18 引入的新 Hook，用于订阅外部存储。

**核心概念**：
- 订阅外部存储
- SSR 安全
- 避免 hydration 不匹配

**语法**：
```typescript
const state = useSyncExternalStore<T>(
  subscribe: (onStoreChange: () => void) => () => void,
  getSnapshot: () => T,
  getServerSnapshot?: () => T
): T
```

**完整示例**：
```typescript
import { useSyncExternalStore } from 'react';

// 场景 1：基础用法
function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(
    store.subscribe.bind(store),
    store.getState.bind(store)
  );
}

// 场景 2：Redux
function useReduxSelector<T>(selector: (state: RootState) => T): T {
  const store = useReduxStore();

  return useSyncExternalStore(
    store.subscribe.bind(store),
    () => selector(store.getState())
  );
}

// 场景 3：Zustand
function useZustand<T>(selector: (state: StoreState) => T): T {
  const store = useZustandStore();

  return useSyncExternalStore(
    store.subscribe.bind(store),
    () => selector(store.getState()),
    () => selector(store.getInitialState())
  );
}

// 场景 4：自定义存储
interface Store<T> {
  getState: () => T;
  subscribe: (callback: () => void) => () => void;
}

class CounterStore implements Store<number> {
  private state = 0;
  private listeners: Set<() => void> = new Set();

  getState() {
    return this.state;
  }

  subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  dispatch(action: { type: 'increment' | 'decrement' }) {
    if (action.type === 'increment') {
      this.state++;
    } else {
      this.state--;
    }
    this.listeners.forEach(listener => listener());
  }
}

const counterStore = new CounterStore();

function Counter() {
  const count = useSyncExternalStore(
    counterStore.subscribe.bind(counterStore),
    counterStore.getState.bind(counterStore)
  );

  return (
    <div>
      <p>计数: {count}</p>
      <button onClick={() => counterStore.dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => counterStore.dispatch({ type: 'decrement' })}>-</button>
    </div>
  );
}

// 场景 5：与 useReducer 对比
function CounterWithReducer() {
  const [count, dispatch] = useReducer(
    (state: number, action: { type: 'increment' | 'decrement' }) => {
      if (action.type === 'increment') return state + 1;
      return state - 1;
    },
    0
  );

  return (
    <div>
      <p>计数: {count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
    </div>
  );
}

function CounterWithExternalStore() {
  const count = useSyncExternalStore(
    counterStore.subscribe.bind(counterStore),
    counterStore.getState.bind(counterStore)
  );

  return (
    <div>
      <p>计数: {count}</p>
      <button onClick={() => counterStore.dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => counterStore.dispatch({ type: 'decrement' })}>-</button>
    </div>
  );
}
```

**最佳实践**：
1. 用于订阅外部存储
2. SSR 安全
3. 避免 hydration 不匹配
4. 与 Redux、Zustand 配合使用

**常见陷阱**：
- 用于简单状态（应该使用 useState）
- 忘记返回清理函数
- 过度使用 useSyncExternalStore 导致性能问题

---

#### 1.1.17 useTransition

**概述**：useTransition 返回一个状态值和一个启动函数，用于标记更新为非紧急更新。

**核心概念**：
- 标记非紧急更新
- 与 useDeferredValue 类似
- 提供 pending 状态

**语法**：
```typescript
const [isPending, startTransition] = useTransition(): [boolean, (callback: () => void) => void]
```

**完整示例**：
```typescript
import { useState, useTransition } from 'react';

// 场景 1：基础用法
function SearchResults() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

// 场景 2：与 useDeferredValue 对比
function SearchWithTransition() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    startTransition(() => {
      setQuery(e.target.value);
    });
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="搜索..."
      />
      
      {isPending && <div>加载中...</div>}
      <Results query={query} />
    </div>
  );
}

function SearchWithDeferredValue() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="搜索..."
      />
      
      <Results query={deferredQuery} />
    </div>
  );
}

// 场景 3：复杂更新
function TabbedContent() {
  const [activeTab, setActiveTab] = useState('tab1');
  const [isPending, startTransition] = useTransition();

  const handleChangeTab = (tab: string) => {
    startTransition(() => {
      setActiveTab(tab);
    });
  };

  return (
    <div>
      <button onClick={() => handleChangeTab('tab1')}>标签 1</button>
      <button onClick={() => handleChangeTab('tab2')}>标签 2</button>
      
      {isPending && <div>加载中...</div>}
      
      {activeTab === 'tab1' && <Tab1Content />}
      {activeTab === 'tab2' && <Tab2Content />}
    </div>
  );
}

// 场景 4：与 useDeferredValue 组合使用
function AdvancedSearch() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    startTransition(() => {
      setQuery(e.target.value);
    });
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="搜索..."
      />
      
      {isPending && <div>加载中...</div>}
      <Results query={deferredQuery} />
    </div>
  );
}
```

**最佳实践**：
1. 用于标记非紧急更新
2. 与 useDeferredValue 配合使用
3. 提供 pending 状态给用户
4. 避免过度使用

**常见陷阱**：
- 用于紧急更新
- 忘记提供 pending 状态
- 过度使用 useTransition 导致性能问题

---

### 1.2 组件

#### 1.2.1 React.Component

**概述**：React.Component 是创建类组件的基类。

**核心概念**：
- 类组件
- 生命周期方法
- 状态管理

**语法**：
```typescript
class MyComponent extends React.Component<Props, State> {
  render() {
    return <div>内容</div>;
  }
}
```

**完整示例**：
```typescript
import React from 'react';

interface CounterProps {
  initialCount?: number;
}

interface CounterState {
  count: number;
}

class Counter extends React.Component<CounterProps, CounterState> {
  constructor(props: CounterProps) {
    super(props);
    this.state = { count: props.initialCount || 0 };
    
    this.increment = this.increment.bind(this);
    this.decrement = this.decrement.bind(this);
  }

  // 生命周期方法
  componentDidMount() {
    console.log('组件已挂载');
  }

  componentDidUpdate(prevProps: CounterProps, prevState: CounterState) {
    if (prevState.count !== this.state.count) {
      console.log('计数已更新');
    }
  }

  componentWillUnmount() {
    console.log('组件将卸载');
  }

  // 事件处理方法
  increment() {
    this.setState(prevState => ({ count: prevState.count + 1 }));
  }

  decrement() {
    this.setState(prevState => ({ count: prevState.count - 1 }));
  }

  // 渲染方法
  render() {
    return (
      <div>
        <p>计数: {this.state.count}</p>
        <button onClick={this.increment}>+</button>
        <button onClick={this.decrement}>-</button>
      </div>
    );
  }
}

export default Counter;
```

**最佳实践**：
1. 使用函数组件和 Hooks
2. 类组件仅用于特殊场景
3. 正确绑定事件处理方法
4. 实现必要的生命周期方法

**常见陷阱**：
- 忘记绑定事件处理方法
- 忘记调用 super(props)
- 过度使用类组件

---

#### 1.2.2 React.PureComponent

**概述**：React.PureComponent 是 React.Component 的变体，实现了 shouldComponentUpdate。

**核心概念**：
- 浅比较 props 和 state
- 性能优化
- 避免不必要的重渲染

**语法**：
```typescript
class MyComponent extends React.PureComponent<Props, State> {
  render() {
    return <div>内容</div>;
  }
}
```

**完整示例**：
```typescript
import React from 'react';

interface Item {
  id: string;
  name: string;
}

interface ItemListProps {
  items: Item[];
  onSelect: (item: Item) => void;
}

class ItemList extends React.PureComponent<ItemListProps> {
  render() {
    console.log('ItemList 渲染');
    return (
      <ul>
        {this.props.items.map(item => (
          <li key={item.id} onClick={() => this.props.onSelect(item)}>
            {item.name}
          </li>
        ))}
      </ul>
    );
  }
}

function ParentComponent() {
  const [items, setItems] = useState<Item[]>([
    { id: '1', name: '项目1' },
    { id: '2', name: '项目2' },
  ]);

  const handleSelect = (item: Item) => {
    console.log('选择:', item.name);
  };

  return <ItemList items={items} onSelect={handleSelect} />;
}
```

**最佳实践**：
1. 用于性能优化
2. 确保 props 和 state 是不可变的
3. 避免在 render 中创建新对象
4. 仅用于简单组件

**常见陷阱**：
- props 和 state 是可变的
- 在 render 中创建新对象
- 过度使用 PureComponent 导致性能下降

---

### 1.3 API

#### 1.3.1 React.createElement

**概述**：React.createElement 创建 React 元素。

**核心概念**：
- 创建元素
- JSX 转译
- 组件渲染

**语法**：
```typescript
React.createElement(
  type: string | React.ComponentType,
  props?: object,
  ...children: ReactNode
): ReactElement
```

**完整示例**：
```typescript
import React from 'react';

// 基础用法
const element = React.createElement('div', { className: 'container' }, '内容');

// 嵌套元素
const element2 = React.createElement(
  'div',
  { className: 'parent' },
  React.createElement('h1', null, '标题'),
  React.createElement('p', null, '段落')
);

// 组件
function MyComponent() {
  return React.createElement('div', null, '组件内容');
}

const element3 = React.createElement(MyComponent);

// 使用 JSX（推荐）
const elementJSX = <div className="container">内容</div>;
const element2JSX = (
  <div className="parent">
    <h1>标题</h1>
    <p>段落</p>
  </div>
);
const element3JSX = <MyComponent />;
```

**最佳实践**：
1. 使用 JSX（更简洁）
2. 仅在特殊情况下使用 createElement
3. 正确传递 props 和 children

**常见陷阱**：
- 忘记传递 props
- 忘记传递 children
- 过度使用 createElement

---

#### 1.3.2 React.forwardRef

**概述**：React.forwardRef 将 ref 传递给子组件。

**核心概念**：
- 传递 ref
- 访问 DOM 元素
- 组件组合

**语法**：
```typescript
const ForwardedComponent = React.forwardRef((props, ref) => {
  return <div ref={ref}>内容</div>;
});
```

**完整示例**：
```typescript
import React, { forwardRef, useRef } from 'react';

// 基础用法
const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  (props, ref) => {
    return <input ref={ref} {...props} />;
  }
);

function Form() {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <Input ref={inputRef} />
      <button onClick={() => inputRef.current?.focus()}>聚焦</button>
    </div>
  );
}

// 与 useImperativeHandle 配合
const Child = forwardRef((props, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
    getValue: () => {
      return inputRef.current?.value;
    }
  }));

  return <input ref={inputRef} />;
});

function Parent() {
  const childRef = useRef<{ focus: () => void; getValue: () => string }>(null);

  return (
    <div>
      <Child ref={childRef} />
      <button onClick={() => childRef.current?.focus()}>聚焦</button>
    </div>
  );
}

// 传递 ref 到子组件
const Button = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  (props, ref) => {
    return <button ref={ref} {...props} />;
  }
);

function Form2() {
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <div>
      <Button ref={buttonRef}>提交</Button>
      <button onClick={() => buttonRef.current?.focus()}>聚焦按钮</button>
    </div>
  );
}
```

**最佳实践**：
1. 用于传递 ref
2. 与 useImperativeHandle 配合
3. 正确处理 ref
4. 避免过度使用

**常见陷阱**：
- 忘记使用 forwardRef
- 忘记处理 ref
- 过度使用 forwardRef 导致性能问题

---

### 1.4 React Compiler

#### 1.4.1 指令

**概述**：React Compiler 是 AOT（提前编译）工具，通过 AST 分析和 SSA 算法实现自动记忆化。

**核心概念**：
- AOT 编译
- AST 分析
- SSA 算法
- 自动记忆化

**语法**：
```typescript
// 编译器指令
// @reactcompiler

// Babel 配置
{
  "plugins": ["@reactcompiler/babel-plugin"]
}
```

**完整示例**：
```typescript
// 编译器配置
// babel.config.js
module.exports = {
  plugins: [
    ['@reactcompiler/babel-plugin', {
      environment: {
        enableTreatFunctionArgsAsConstants: true,
      },
    }],
  ],
};

// ESLint 配置
// .eslintrc.js
module.exports = {
  plugins: ['react-compiler'],
  rules: {
    'react-compiler/react-compiler': 'error',
  },
};

// 编译器优化示例
function MyComponent({ items }) {
  // 编译器会自动优化这个函数
  const filteredItems = items.filter(item => item.active);
  
  return (
    <div>
      {filteredItems.map(item => (
        <Item key={item.id} item={item} />
      ))}
    </div>
  );
}

// 编译器会自动注入 useMemoCache
function MyComponent2({ items }) {
  const cache = useMemoCache();
  
  // 编译器会自动优化
  const filteredItems = items.filter(item => item.active);
  
  return (
    <div>
      {filteredItems.map(item => (
        <Item key={item.id} item={item} />
      ))}
    </div>
  );
}
```

**最佳实践**：
1. 配置 ESLint 检查
2. 避免在 Render 阶段读取 Ref
3. 避免有条件地调用 Hooks
4. 使用编译器优化

**常见陷阱**：
- 忘记配置 ESLint
- 在 Render 阶段读取 Ref
- 有条件地调用 Hooks

---

### 1.5 React DevTools

**概述**：React DevTools 是 React 的调试工具。

**核心概念**：
- 组件检查
- 性能分析
- 状态查看

**语法**：
```typescript
// 浏览器扩展
// React Developer Tools

// 性能分析
// React Profiler
```

**完整示例**：
```typescript
// 组件检查
// 1. 打开 React DevTools
// 2. 选择组件
// 3. 查看 props 和 state

// 性能分析
// 1. 点击性能分析按钮
// 2. 记录组件渲染
// 3. 分析性能瓶颈

// 状态查看
// 1. 选择组件
// 2. 查看 state
// 3. 修改 state
```

**最佳实践**：
1. 使用 React DevTools 调试
2. 分析性能瓶颈
3. 查看组件状态
4. 优化组件性能

**常见陷阱**：
- 忘记安装 React DevTools
- 忘记分析性能瓶颈
- 忘记查看组件状态

---

### 1.6 React Performance tracks

**概述**：React Performance tracks 是 React 的性能追踪工具。

**核心概念**：
- 性能追踪
- 渲染分析
- 优化建议

**语法**：
```typescript
// React Profiler
// React Performance API
```

**完整示例**：
```typescript
// 性能追踪
// 1. 使用 React Profiler
// 2. 分析性能瓶颈
// 3. 优化组件性能

// 渲染分析
// 1. 使用 React DevTools
// 2. 分析渲染次数
// 3. 优化渲染性能

// 优化建议
// 1. 使用 React.memo
// 2. 使用 useCallback
// 3. 使用 useMemo
```

**最佳实践**：
1. 使用 React Profiler
2. 分析性能瓶颈
3. 优化组件性能
4. 遵循最佳实践

**常见陷阱**：
- 忘记使用 React Profiler
- 忘记分析性能瓶颈
- 忘记优化组件性能

---

### 1.7 eslint-plugin-react-hooks

**概述**：eslint-plugin-react-hooks 是 React Hooks 的 ESLint 插件。

**核心概念**：
- Hooks 规则
- 依赖检查
- 命名约定

**语法**：
```typescript
// ESLint 配置
{
  "plugins": ["react-hooks"],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

**完整示例**：
```typescript
// 规则 1：只在顶层调用 Hook
// ✅ 正确
function GoodComponent() {
  const [state, setState] = useState(0);
  if (condition) {
    // 使用 state
  }
}

// ❌ 错误
function BadComponent() {
  if (condition) {
    const [state, setState] = useState(0); // 错误！
  }
}

// 规则 2：只在 React 函数中调用 Hook
// ✅ 正确
function Component() {
  const [state, setState] = useState(0);
}

// ❌ 错误
function regularFunction() {
  const [state, setState] = useState(0); // 错误！
}

// 规则 3：依赖数组完整
// ✅ 正确
useEffect(() => {
  fetchData(userId);
}, [userId]); // ✅ 依赖 userId

// ❌ 错误
useEffect(() => {
  fetchData(userId);
}, []); // ❌ 忘记依赖 userId
```

**最佳实践**：
1. 配置 ESLint
2. 遵循 Hooks 规则
3. 完整依赖数组
4. 正确命名 Hook

**常见陷阱**：
- 忘记配置 ESLint
- 忘记遵循 Hooks 规则
- 忘记完整依赖数组
- 忘记正确命名 Hook

---

## 二、React DOM API

### 2.1 Hook

#### 2.1.1 createPortal

**概述**：createPortal 将子节点渲染到 DOM 中的指定位置。

**核心概念**：
- 渲染到指定位置
- 事件冒泡
- Portal

**语法**：
```typescript
ReactDOM.createPortal(
  child: ReactNode,
  container: HTMLElement
): ReactPortal
```

**完整示例**：
```typescript
import { createPortal } from 'react-dom';
import { useState, useRef } from 'react';

// 场景 1：模态框
function Modal({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: ReactNode }) {
  const modalRoot = useRef(document.getElementById('modal-root'));

  if (!isOpen || !modalRoot.current) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    modalRoot.current
  );
}

function App() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>打开模态框</button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <h2>模态框标题</h2>
        <p>模态框内容</p>
        <button onClick={() => setIsOpen(false)}>关闭</button>
      </Modal>
    </div>
  );
}

// 场景 2：工具提示
function Tooltip({ text, children }: { text: string; children: ReactNode }) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  function handleMouseEnter(e: React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({ x: rect.left, y: rect.bottom + 5 });
  }

  return createPortal(
    <div
      ref={tooltipRef}
      className="tooltip"
      style={{ left: position.x, top: position.y }}
    >
      {text}
    </div>,
    document.body
  );
}

// 场景 3：通知
function Notification({ message, type = 'info' }: { message: string; type?: 'info' | 'success' | 'error' }) {
  const notificationRef = useRef<HTMLDivElement>(null);

  return createPortal(
    <div className={`notification ${type}`} ref={notificationRef}>
      {message}
    </div>,
    document.body
  );
}

// 场景 4：下拉菜单
function Dropdown({ isOpen, children, options }: { isOpen: boolean; children: ReactNode; options: string[] }) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !dropdownRef.current) return null;

  return createPortal(
    <div className="dropdown" ref={dropdownRef}>
      {options.map(option => (
        <div key={option} className="dropdown-item">
          {option}
        </div>
      ))}
    </div>,
    document.body
  );
}
```

**最佳实践**：
1. 用于模态框和工具提示
2. 正确处理事件冒泡
3. 使用 useRef 存储 DOM 元素
4. 避免过度使用

**常见陷阱**：
- 忘记处理事件冒泡
- 忘记检查 DOM 元素是否存在
- 过度使用 createPortal 导致性能问题

---

#### 2.1.2 flushSync

**概述**：flushSync 强制 React 同步更新 DOM。

**核心概念**：
- 同步更新
- DOM 突变
- 性能影响

**语法**：
```typescript
ReactDOM.flushSync(callback: () => void): void
```

**完整示例**：
```typescript
import { flushSync } from 'react-dom';
import { useState } from 'react';

// 场景 1：强制同步更新
function Component() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    flushSync(() => {
      setCount(prev => prev + 1);
    });
    
    // 此时 DOM 已更新
    console.log(document.getElementById('count')?.textContent);
  };

  return (
    <div>
      <p id="count">{count}</p>
      <button onClick={handleClick}>+1</button>
    </div>
  );
}

// 场景 2：与默认批处理对比
function Comparison() {
  const [count1, setCount1] = useState(0);
  const [count2, setCount2] = useState(0);

  const handleClick1 = () => {
    setCount1(prev => prev + 1);
    setCount2(prev => prev + 1);
    // 默认批处理：只触发一次重渲染
  };

  const handleClick2 = () => {
    flushSync(() => {
      setCount1(prev => prev + 1);
    });
    flushSync(() => {
      setCount2(prev => prev + 1);
    });
    // flushSync：触发两次重渲染
  };

  return (
    <div>
      <p>count1: {count1}</p>
      <p>count2: {count2}</p>
      <button onClick={handleClick1}>默认批处理</button>
      <button onClick={handleClick2}>flushSync</button>
    </div>
  );
}

// 场景 3：性能影响
function PerformanceImpact() {
  const [items, setItems] = useState<Item[]>([]);

  const handleClick = () => {
    flushSync(() => {
      setItems(prev => [...prev, { id: Date.now() }]);
    });
    
    // 此时 DOM 已更新
    console.log(document.querySelectorAll('.item').length);
  };

  return (
    <div>
      {items.map(item => (
        <div key={item.id} className="item">Item</div>
      ))}
      <button onClick={handleClick}>添加</button>
    </div>
  );
}
```

**最佳实践**：
1. 用于需要同步更新的场景
2. 避免过度使用
3. 注意性能影响
4. 仅在必要时使用

**常见陷阱**：
- 忘记性能影响
- 过度使用 flushSync
- 忘记检查 DOM 更新

---

#### 2.1.3 preconnect

**概述**：preconnect 提前建立与服务器的连接。

**核心概念**：
- 预连接
- 性能优化
- 资源加载

**语法**：
```typescript
ReactDOM.preconnect(url: string, options?: { crossOrigin: 'anonymous' | 'use-credentials' }): void
```

**完整示例**：
```typescript
import { preconnect } from 'react-dom';

// 场景 1：预连接 API 服务器
function App() {
  // 预连接 API 服务器
  preconnect('https://api.example.com');

  return (
    <div>
      <h1>应用</h1>
    </div>
  );
}

// 场景 2：预连接 CDN
function App2() {
  // 预连接 CDN
  preconnect('https://cdn.example.com');

  return (
    <div>
      <img src="https://cdn.example.com/image.jpg" alt="图片" />
    </div>
  );
}

// 场景 3：预连接字体
function App3() {
  // 预连接字体服务器
  preconnect('https://fonts.googleapis.com');
  preconnect('https://fonts.gstatic.com', { crossOrigin: 'anonymous' });

  return (
    <div>
      <h1 style={{ fontFamily: 'Roboto' }}>应用</h1>
    </div>
  );
}

// 场景 4：条件预连接
function App4() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!isLoaded) {
      preconnect('https://api.example.com');
      setIsLoaded(true);
    }
  }, [isLoaded]);

  return (
    <div>
      <button onClick={() => setIsLoaded(false)}>重新加载</button>
    </div>
  );
}
```

**最佳实践**：
1. 用于预连接 API 服务器
2. 用于预连接 CDN
3. 用于预连接字体
4. 避免过度使用

**常见陷阱**：
- 忘记设置 crossOrigin
- 过度使用 preconnect
- 忘记条件预连接

---

#### 2.1.4 prefetchDNS

**概述**：prefetchDNS 提前解析 DNS。

**核心概念**：
- 预解析 DNS
- 性能优化
- 资源加载

**语法**：
```typescript
ReactDOM.prefetchDNS(url: string): void
```

**完整示例**：
```typescript
import { prefetchDNS } from 'react-dom';

// 场景 1：预解析 DNS
function App() {
  // 预解析 DNS
  prefetchDNS('https://api.example.com');

  return (
    <div>
      <h1>应用</h1>
    </div>
  );
}

// 场景 2：预解析 CDN
function App2() {
  // 预解析 CDN
  prefetchDNS('https://cdn.example.com');

  return (
    <div>
      <img src="https://cdn.example.com/image.jpg" alt="图片" />
    </div>
  );
}

// 场景 3：预解析字体
function App3() {
  // 预解析字体服务器
  prefetchDNS('https://fonts.googleapis.com');
  prefetchDNS('https://fonts.gstatic.com');

  return (
    <div>
      <h1 style={{ fontFamily: 'Roboto' }}>应用</h1>
    </div>
  );
}

// 场景 4：与 preconnect 对比
function Comparison() {
  // preconnect：建立连接
  preconnect('https://api.example.com');

  // prefetchDNS：仅解析 DNS
  prefetchDNS('https://api.example.com');

  return (
    <div>
      <h1>对比</h1>
    </div>
  );
}
```

**最佳实践**：
1. 用于预解析 DNS
2. 与 preconnect 配合使用
3. 避免过度使用
4. 注意性能影响

**常见陷阱**：
- 忘记与 preconnect 配合使用
- 过度使用 prefetchDNS
- 忘记性能影响

---

#### 2.1.5 preinit

**概述**：preinit 提前加载资源。

**核心概念**：
- 预加载
- 性能优化
- 资源加载

**语法**：
```typescript
ReactDOM.preinit(url: string, options?: { as: 'script' | 'style' | 'font' | 'image' | 'fetch' | 'video' | 'audio' | 'module' | 'script' | 'style' | 'font' | 'image' | 'video' | 'audio' | 'fetch' | 'module' | 'script' | 'style' | 'font' | 'image' | 'video' | 'audio' | 'fetch' | 'module' }): void
```

**完整示例**：
```typescript
import { preinit } from 'react-dom';

// 场景 1：预加载脚本
function App() {
  // 预加载脚本
  preinit('https://cdn.example.com/script.js', { as: 'script' });

  return (
    <div>
      <h1>应用</h1>
    </div>
  );
}

// 场景 2：预加载样式
function App2() {
  // 预加载样式
  preinit('https://cdn.example.com/style.css', { as: 'style' });

  return (
    <div>
      <h1>应用</h1>
    </div>
  );
}

// 场景 3：预加载字体
function App3() {
  // 预加载字体
  preinit('https://fonts.googleapis.com/font.woff2', { as: 'font' });

  return (
    <div>
      <h1 style={{ fontFamily: 'CustomFont' }}>应用</h1>
    </div>
  );
}

// 场景 4：预加载图像
function App4() {
  // 预加载图像
  preinit('https://cdn.example.com/image.jpg', { as: 'image' });

  return (
    <div>
      <img src="https://cdn.example.com/image.jpg" alt="图片" />
    </div>
  );
}

// 场景 5：与 preload 对比
function Comparison() {
  // preload：浏览器原生预加载
  // preinit：React DOM 预加载

  return (
    <div>
      <h1>对比</h1>
    </div>
  );
}
```

**最佳实践**：
1. 用于预加载脚本
2. 用于预加载样式
3. 用于预加载字体
4. 避免过度使用

**常见陷阱**：
- 忘记设置 as 属性
- 过度使用 preinit
- 忘记性能影响

---

#### 2.1.6 preinitModule

**概述**：preinitModule 提前加载 ES 模块。

**核心概念**：
- 预加载模块
- 性能优化
- 资源加载

**语法**：
```typescript
ReactDOM.preinitModule(url: string, options?: { as: 'script' | 'module' }): void
```

**完整示例**：
```typescript
import { preinitModule } from 'react-dom';

// 场景 1：预加载 ES 模块
function App() {
  // 预加载 ES 模块
  preinitModule('https://cdn.example.com/module.js', { as: 'module' });

  return (
    <div>
      <h1>应用</h1>
    </div>
  );
}

// 场景 2：预加载 React
function App2() {
  // 预加载 React
  preinitModule('https://cdn.example.com/react.production.min.js', { as: 'module' });

  return (
    <div>
      <h1>应用</h1>
    </div>
  );
}

// 场景 3：预加载 React DOM
function App3() {
  // 预加载 React DOM
  preinitModule('https://cdn.example.com/react-dom.production.min.js', { as: 'module' });

  return (
    <div>
      <h1>应用</h1>
    </div>
  );
}

// 场景 4：与 preinit 对比
function Comparison() {
  // preinit：预加载资源
  // preinitModule：预加载 ES 模块

  return (
    <div>
      <h1>对比</h1>
    </div>
  );
}
```

**最佳实践**：
1. 用于预加载 ES 模块
2. 与 preinit 配合使用
3. 避免过度使用
4. 注意性能影响

**常见陷阱**：
- 忘记设置 as 属性
- 过度使用 preinitModule
- 忘记性能影响

---

#### 2.1.7 preload

**概述**：preload 提前加载资源（浏览器原生）。

**核心概念**：
- 预加载
- 性能优化
- 资源加载

**语法**：
```typescript
ReactDOM.preload(url: string, options?: { as: 'script' | 'style' | 'font' | 'image' | 'fetch' | 'video' | 'audio' | 'module' }): void
```

**完整示例**：
```typescript
import { preload } from 'react-dom';

// 场景 1：预加载脚本
function App() {
  // 预加载脚本
  preload('https://cdn.example.com/script.js', { as: 'script' });

  return (
    <div>
      <h1>应用</h1>
    </div>
  );
}

// 场景 2：预加载样式
function App2() {
  // 预加载样式
  preload('https://cdn.example.com/style.css', { as: 'style' });

  return (
    <div>
      <h1>应用</h1>
    </div>
  );
}

// 场景 3：预加载字体
function App3() {
  // 预加载字体
  preload('https://fonts.googleapis.com/font.woff2', { as: 'font' });

  return (
    <div>
      <h1 style={{ fontFamily: 'CustomFont' }}>应用</h1>
    </div>
  );
}

// 场景 4：预加载图像
function App4() {
  // 预加载图像
  preload('https://cdn.example.com/image.jpg', { as: 'image' });

  return (
    <div>
      <img src="https://cdn.example.com/image.jpg" alt="图片" />
    </div>
  );
}

// 场景 5：与 preinit 对比
function Comparison() {
  // preload：浏览器原生预加载
  // preinit：React DOM 预加载

  return (
    <div>
      <h1>对比</h1>
    </div>
  );
}
```

**最佳实践**：
1. 用于预加载脚本
2. 用于预加载样式
3. 用于预加载字体
4. 避免过度使用

**常见陷阱**：
- 忘记设置 as 属性
- 过度使用 preload
- 忘记性能影响

---

#### 2.1.8 preloadModule

**概述**：preloadModule 提前加载 ES 模块（浏览器原生）。

**核心概念**：
- 预加载模块
- 性能优化
- 资源加载

**语法**：
```typescript
ReactDOM.preloadModule(url: string, options?: { as: 'script' | 'module' }): void
```

**完整示例**：
```typescript
import { preloadModule } from 'react-dom';

// 场景 1：预加载 ES 模块
function App() {
  // 预加载 ES 模块
  preloadModule('https://cdn.example.com/module.js', { as: 'module' });

  return (
    <div>
      <h1>应用</h1>
    </div>
  );
}

// 场景 2：预加载 React
function App2() {
  // 预加载 React
  preloadModule('https://cdn.example.com/react.production.min.js', { as: 'module' });

  return (
    <div>
      <h1>应用</h1>
    </div>
  );
}

// 场景 3：预加载 React DOM
function App3() {
  // 预加载 React DOM
  preloadModule('https://cdn.example.com/react-dom.production.min.js', { as: 'module' });

  return (
    <div>
      <h1>应用</h1>
    </div>
  );
}

// 场景 4：与 preinitModule 对比
function Comparison() {
  // preloadModule：浏览器原生预加载
  // preinitModule：React DOM 预加载

  return (
    <div>
      <h1>对比</h1>
    </div>
  );
}
```

**最佳实践**：
1. 用于预加载 ES 模块
2. 与 preload 配合使用
3. 避免过度使用
4. 注意性能影响

**常见陷阱**：
- 忘记设置 as 属性
- 过度使用 preloadModule
- 忘记性能影响

---

### 2.2 组件

#### 2.2.1 ReactDOM.createRoot

**概述**：ReactDOM.createRoot 创建根节点。

**核心概念**：
- 创建根节点
- 渲染组件
- React 18+

**语法**：
```typescript
const root = ReactDOM.createRoot(container: HTMLElement): Root
```

**完整示例**：
```typescript
import { createRoot } from 'react-dom/client';
import App from './App';

// 基础用法
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);

// 严格模式
const root2 = createRoot(container);
root2.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 错误边界
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <h1>出错了</h1>;
    }

    return this.props.children;
  }
}

const root3 = createRoot(container);
root3.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

// Suspense
function App() {
  return (
    <React.Suspense fallback={<div>加载中...</div>}>
      <AsyncComponent />
    </React.Suspense>
  );
}

const root4 = createRoot(container);
root4.render(<App />);
```

**最佳实践**：
1. 使用 createRoot 创建根节点
2. 使用 StrictMode
3. 使用错误边界
4. 使用 Suspense

**常见陷阱**：
- 忘记使用 createRoot
- 忘记使用 StrictMode
- 忘记使用错误边界
- 忘记使用 Suspense

---

#### 2.2.2 ReactDOM.hydrateRoot

**概述**：ReactDOM.hydrateRoot 用于服务端渲染。

**核心概念**：
- 服务端渲染
- 水合
- React 18+

**语法**：
```typescript
const root = ReactDOM.hydrateRoot(container: HTMLElement, children: ReactNode): Root
```

**完整示例**：
```typescript
import { hydrateRoot } from 'react-dom/client';
import App from './App';

// 基础用法
const container = document.getElementById('root');
const root = hydrateRoot(container, <App />);

// 严格模式
const root2 = hydrateRoot(container, (
  <React.StrictMode>
    <App />
  </React.StrictMode>
));

// 错误边界
class ErrorBoundary extends React.Component {
  state = { hasError: true };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <h1>出错了</h1>;
    }

    return this.props.children;
  }
}

const root3 = hydrateRoot(container, (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
));

// Suspense
function App() {
  return (
    <React.Suspense fallback={<div>加载中...</div>}>
      <AsyncComponent />
    </React.Suspense>
  );
}

const root4 = hydrateRoot(container, <App />);
```

**最佳实践**：
1. 使用 hydrateRoot 进行服务端渲染
2. 使用 StrictMode
3. 使用错误边界
4. 使用 Suspense

**常见陷阱**：
- 忘记使用 hydrateRoot
- 忘记使用 StrictMode
- 忘记使用错误边界
- 忘记使用 Suspense

---

### 2.3 API

#### 2.3.1 ReactDOM.render

**概述**：ReactDOM.render 渲染组件（已废弃）。

**核心概念**：
- 渲染组件
- 已废弃
- React 18-

**语法**：
```typescript
ReactDOM.render(
  element: ReactElement,
  container: HTMLElement,
  callback?: () => void
): ReactComponent
```

**完整示例**：
```typescript
import ReactDOM from 'react-dom';
import App from './App';

// 已废弃
const container = document.getElementById('root');
ReactDOM.render(<App />, container);

// 使用 createRoot（推荐）
import { createRoot } from 'react-dom/client';
const root = createRoot(container);
root.render(<App />);
```

**最佳实践**：
1. 使用 createRoot（推荐）
2. 避免使用 render（已废弃）
3. 使用 StrictMode
4. 使用错误边界

**常见陷阱**：
- 使用 render（已废弃）
- 忘记使用 createRoot
- 忘记使用 StrictMode
- 忘记使用错误边界

---

#### 2.3.2 ReactDOM.hydrate

**概述**：ReactDOM.hydrate 用于服务端渲染（已废弃）。

**核心概念**：
- 服务端渲染
- 已废弃
- React 18-

**语法**：
```typescript
ReactDOM.hydrate(
  element: ReactElement,
  container: HTMLElement,
  callback?: () => void
): ReactComponent
```

**完整示例**：
```typescript
import ReactDOM from 'react-dom';
import App from './App';

// 已废弃
const container = document.getElementById('root');
ReactDOM.hydrate(<App />, container);

// 使用 hydrateRoot（推荐）
import { hydrateRoot } from 'react-dom/client';
const root = hydrateRoot(container, <App />);
```

**最佳实践**：
1. 使用 hydrateRoot（推荐）
2. 避免使用 hydrate（已废弃）
3. 使用 StrictMode
4. 使用错误边界

**常见陷阱**：
- 使用 hydrate（已废弃）
- 忘记使用 hydrateRoot
- 忘记使用 StrictMode
- 忘记使用错误边界

---

#### 2.3.3 ReactDOM.unmountComponentAtNode

**概述**：ReactDOM.unmountComponentAtNode 卸载组件（已废弃）。

**核心概念**：
- 卸载组件
- 已废弃
- React 18-

**语法**：
```typescript
ReactDOM.unmountComponentAtNode(container: HTMLElement): boolean
```

**完整示例**：
```typescript
import ReactDOM from 'react-dom';
import App from './App';

// 已废弃
const container = document.getElementById('root');
ReactDOM.render(<App />, container);
ReactDOM.unmountComponentAtNode(container);

// 使用 root.unmount（推荐）
import { createRoot } from 'react-dom/client';
const root = createRoot(container);
root.render(<App />);
root.unmount();
```

**最佳实践**：
1. 使用 root.unmount（推荐）
2. 避免使用 unmountComponentAtNode（已废弃）
3. 正确卸载组件
4. 清理资源

**常见陷阱**：
- 使用 unmountComponentAtNode（已废弃）
- 忘记使用 root.unmount
- 忘记清理资源
- 忘记正确卸载组件

---

#### 2.3.4 ReactDOM.findDOMNode

**概述**：ReactDOM.findDOMNode 查找 DOM 节点（已废弃）。

**核心概念**：
- 查找 DOM 节点
- 已废弃
- React 18-

**语法**：
```typescript
ReactDOM.findDOMNode(component: ReactComponent): HTMLElement | Text
```

**完整示例**：
```typescript
import ReactDOM from 'react-dom';

// 已废弃
class MyComponent extends React.Component {
  componentDidMount() {
    const node = ReactDOM.findDOMNode(this);
    console.log(node);
  }

  render() {
    return <div>内容</div>;
  }
}

// 使用 ref（推荐）
class MyComponent2 extends React.Component {
  private ref = React.createRef<HTMLDivElement>();

  componentDidMount() {
    console.log(this.ref.current);
  }

  render() {
    return <div ref={this.ref}>内容</div>;
  }
}
```

**最佳实践**：
1. 使用 ref（推荐）
2. 避免使用 findDOMNode（已废弃）
3. 正确查找 DOM 节点
4. 使用 forwardRef

**常见陷阱**：
- 使用 findDOMNode（已废弃）
- 忘记使用 ref
- 忘记正确查找 DOM 节点
- 忘记使用 forwardRef

---

#### 2.3.5 ReactDOM.createPortal

**概述**：ReactDOM.createPortal 创建 Portal（已废弃）。

**核心概念**：
- 创建 Portal
- 已废弃
- React 18-

**语法**：
```typescript
ReactDOM.createPortal(
  child: ReactNode,
  container: HTMLElement
): ReactPortal
```

**完整示例**：
```typescript
import ReactDOM from 'react-dom';

// 已废弃
const modalRoot = document.getElementById('modal-root');
const portal = ReactDOM.createPortal(<div>内容</div>, modalRoot!);

// 使用 react-dom/client（推荐）
import { createPortal } from 'react-dom';
const portal2 = createPortal(<div>内容</div>, modalRoot!);
```

**最佳实践**：
1. 使用 createPortal（推荐）
2. 避免使用 ReactDOM.createPortal（已废弃）
3. 正确创建 Portal
4. 处理事件冒泡

**常见陷阱**：
- 使用 ReactDOM.createPortal（已废弃）
- 忘记使用 createPortal
- 忘记处理事件冒泡
- 忘记正确创建 Portal

---

#### 2.3.6 ReactDOM.flushSync

**概述**：ReactDOM.flushSync 强制同步更新（已废弃）。

**核心概念**：
- 强制同步更新
- 已废弃
- React 18-

**语法**：
```typescript
ReactDOM.flushSync(callback: () => void): void
```

**完整示例**：
```typescript
import ReactDOM from 'react-dom';

// 已废弃
ReactDOM.flushSync(() => {
  setCount(prev => prev + 1);
});

// 使用 flushSync（推荐）
import { flushSync } from 'react-dom';
flushSync(() => {
  setCount(prev => prev + 1);
});
```

**最佳实践**：
1. 使用 flushSync（推荐）
2. 避免使用 ReactDOM.flushSync（已废弃）
3. 正确同步更新
4. 注意性能影响

**常见陷阱**：
- 使用 ReactDOM.flushSync（已废弃）
- 忘记使用 flushSync
- 忘记注意性能影响
- 忘记正确同步更新

---

#### 2.3.7 ReactDOM.preconnect

**概述**：ReactDOM.preconnect 提前建立连接（已废弃）。

**核心概念**：
- 提前建立连接
- 已废弃
- React 18-

**语法**：
```typescript
ReactDOM.preconnect(url: string, options?: { crossOrigin: 'anonymous' | 'use-credentials' }): void
```

**完整示例**：
```typescript
import ReactDOM from 'react-dom';

// 已废弃
ReactDOM.preconnect('https://api.example.com');

// 使用 preconnect（推荐）
import { preconnect } from 'react-dom';
preconnect('https://api.example.com');
```

**最佳实践**：
1. 使用 preconnect（推荐）
2. 避免使用 ReactDOM.preconnect（已废弃）
3. 正确预连接
4. 注意性能影响

**常见陷阱**：
- 使用 ReactDOM.preconnect（已废弃）
- 忘记使用 preconnect
- 忘记注意性能影响
- 忘记正确预连接

---

#### 2.3.8 ReactDOM.prefetchDNS

**概述**：ReactDOM.prefetchDNS 提前解析 DNS（已废弃）。

**核心概念**：
- 提前解析 DNS
- 已废弃
- React 18-

**语法**：
```typescript
ReactDOM.prefetchDNS(url: string): void
```

**完整示例**：
```typescript
import ReactDOM from 'react-dom';

// 已废弃
ReactDOM.prefetchDNS('https://api.example.com');

// 使用 prefetchDNS（推荐）
import { prefetchDNS } from 'react-dom';
prefetchDNS('https://api.example.com');
```

**最佳实践**：
1. 使用 prefetchDNS（推荐）
2. 避免使用 ReactDOM.prefetchDNS（已废弃）
3. 正确预解析 DNS
4. 注意性能影响

**常见陷阱**：
- 使用 ReactDOM.prefetchDNS（已废弃）
- 忘记使用 prefetchDNS
- 忘记注意性能影响
- 忘记正确预解析 DNS

---

#### 2.3.9 ReactDOM.preinit

**概述**：ReactDOM.preinit 提前加载资源（已废弃）。

**核心概念**：
- 提前加载资源
- 已废弃
- React 18-

**语法**：
```typescript
ReactDOM.preinit(url: string, options?: { as: 'script' | 'style' | 'font' | 'image' | 'fetch' | 'video' | 'audio' | 'module' }): void
```

**完整示例**：
```typescript
import ReactDOM from 'react-dom';

// 已废弃
ReactDOM.preinit('https://cdn.example.com/script.js', { as: 'script' });

// 使用 preinit（推荐）
import { preinit } from 'react-dom';
preinit('https://cdn.example.com/script.js', { as: 'script' });
```

**最佳实践**：
1. 使用 preinit（推荐）
2. 避免使用 ReactDOM.preinit（已废弃）
3. 正确预加载资源
4. 注意性能影响

**常见陷阱**：
- 使用 ReactDOM.preinit（已废弃）
- 忘记使用 preinit
- 忘记注意性能影响
- 忘记正确预加载资源

---

#### 2.3.10 ReactDOM.preinitModule

**概述**：ReactDOM.preinitModule 提前加载 ES 模块（已废弃）。

**核心概念**：
- 提前加载 ES 模块
- 已废弃
- React 18-

**语法**：
```typescript
ReactDOM.preinitModule(url: string, options?: { as: 'script' | 'module' }): void
```

**完整示例**：
```typescript
import ReactDOM from 'react-dom';

// 已废弃
ReactDOM.preinitModule('https://cdn.example.com/module.js', { as: 'module' });

// 使用 preinitModule（推荐）
import { preinitModule } from 'react-dom';
preinitModule('https://cdn.example.com/module.js', { as: 'module' });
```

**最佳实践**：
1. 使用 preinitModule（推荐）
2. 避免使用 ReactDOM.preinitModule（已废弃）
3. 正确预加载 ES 模块
4. 注意性能影响

**常见陷阱**：
- 使用 ReactDOM.preinitModule（已废弃）
- 忘记使用 preinitModule
- 忘记注意性能影响
- 忘记正确预加载 ES 模块

---

#### 2.3.11 ReactDOM.preload

**概述**：ReactDOM.preload 提前加载资源（已废弃）。

**核心概念**：
- 提前加载资源
- 已废弃
- React 18-

**语法**：
```typescript
ReactDOM.preload(url: string, options?: { as: 'script' | 'style' | 'font' | 'image' | 'fetch' | 'video' | 'audio' | 'module' }): void
```

**完整示例**：
```typescript
import ReactDOM from 'react-dom';

// 已废弃
ReactDOM.preload('https://cdn.example.com/script.js', { as: 'script' });

// 使用 preload（推荐）
import { preload } from 'react-dom';
preload('https://cdn.example.com/script.js', { as: 'script' });
```

**最佳实践**：
1. 使用 preload（推荐）
2. 避免使用 ReactDOM.preload（已废弃）
3. 正确预加载资源
4. 注意性能影响

**常见陷阱**：
- 使用 ReactDOM.preload（已废弃）
- 忘记使用 preload
- 忘记注意性能影响
- 忘记正确预加载资源

---

#### 2.3.12 ReactDOM.preloadModule

**概述**：ReactDOM.preloadModule 提前加载 ES 模块（已废弃）。

**核心概念**：
- 提前加载 ES 模块
- 已废弃
- React 18-

**语法**：
```typescript
ReactDOM.preloadModule(url: string, options?: { as: 'script' | 'module' }): void
```

**完整示例**：
```typescript
import ReactDOM from 'react-dom';

// 已废弃
ReactDOM.preloadModule('https://cdn.example.com/module.js', { as: 'module' });

// 使用 preloadModule（推荐）
import { preloadModule } from 'react-dom';
preloadModule('https://cdn.example.com/module.js', { as: 'module' });
```

**最佳实践**：
1. 使用 preloadModule（推荐）
2. 避免使用 ReactDOM.preloadModule（已废弃）
3. 正确预加载 ES 模块
4. 注意性能影响

**常见陷阱**：
- 使用 ReactDOM.preloadModule（已废弃）
- 忘记使用 preloadModule
- 忘记注意性能影响
- 忘记正确预加载 ES 模块

---

### 2.4 Static APIs

#### 2.4.1 ReactDOM.version

**概述**：ReactDOM.version 返回 React 版本。

**核心概念**：
- React 版本
- 检测版本
- 兼容性

**语法**：
```typescript
ReactDOM.version: string
```

**完整示例**：
```typescript
import ReactDOM from 'react-dom';

console.log(ReactDOM.version); // 18.2.0
```

**最佳实践**：
1. 检测 React 版本
2. 确保兼容性
3. 避免过度使用

**常见陷阱**：
- 忘记检测版本
- 忘记确保兼容性
- 过度使用 version

---

#### 2.4.2 ReactDOM.unstable_batchedUpdates

**概述**：ReactDOM.unstable_batchedUpdates 批量更新（已废弃）。

**核心概念**：
- 批量更新
- 已废弃
- React 18-

**语法**：
```typescript
ReactDOM.unstable_batchedUpdates(callback: () => void): void
```

**完整示例**：
```typescript
import ReactDOM from 'react-dom';

// 已废弃
ReactDOM.unstable_batchedUpdates(() => {
  setCount(prev => prev + 1);
  setName(prev => prev + '!');
});

// 使用 React.startTransition（推荐）
import { startTransition } from 'react';
startTransition(() => {
  setCount(prev => prev + 1);
  setName(prev => prev + '!');
});
```

**最佳实践**：
1. 使用 React.startTransition（推荐）
2. 避免使用 unstable_batchedUpdates（已废弃）
3. 正确批量更新
4. 注意性能影响

**常见陷阱**：
- 使用 unstable_batchedUpdates（已废弃）
- 忘记使用 startTransition
- 忘记注意性能影响
- 忘记正确批量更新

---

## 三、客户端 API

### 3.1 useActionState

**概述**：useActionState 是 React 19 引入的新 Hook，用于管理表单提交状态。

**核心概念**：
- 表单提交
- Server Action
- 异步状态

**语法**：
```typescript
const [state, formAction, isPending] = useActionState(
  action: (previousState: S, payload: F) => Promise<S | void>,
  initialState: S,
  permalink?: string
): [S, (formData: FormData) => void, boolean]
```

**完整示例**：
```typescript
import { useActionState } from 'react';

// Server Action
async function submitAction(
  previousState: { success?: boolean; error?: string },
  formData: FormData
) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    await login(email, password);
    return { success: true };
  } catch (error) {
    return { success: false, error: '登录失败' };
  }
}

// Client Component
function LoginForm() {
  const [state, formAction, isPending] = useActionState(submitAction, {
    success: undefined,
    error: undefined
  });

  return (
    <form action={formAction}>
      {state.success && <div>登录成功</div>}
      {state.error && <div>{state.error}</div>}
      <input name="email" type="email" />
      <input name="password" type="password" />
      <button type="submit" disabled={isPending}>
        {isPending ? '登录中...' : '登录'}
      </button>
    </form>
  );
}
```

**最佳实践**：
1. 使用 useActionState 处理表单提交
2. Server Action 必须是 async 函数
3. 提供用户友好的错误消息
4. 使用 'use server' 指令

**常见陷阱**：
- 忘记在 Server Action 中使用 'use server'
- Server Action 不是 async 函数
- 忘记处理错误情况
- 在 Client Component 中直接调用 Server Action

---

### 3.2 useTransition

**概述**：useTransition 返回一个状态值和一个启动函数，用于标记更新为非紧急更新。

**核心概念**：
- 非紧急更新
- pending 状态
- 与 useDeferredValue 类似

**语法**：
```typescript
const [isPending, startTransition] = useTransition(): [boolean, (callback: () => void) => void]
```

**完整示例**：
```typescript
import { useState, useTransition } from 'react';

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

**最佳实践**：
1. 用于标记非紧急更新
2. 与 useDeferredValue 配合使用
3. 提供 pending 状态给用户
4. 避免过度使用

**常见陷阱**：
- 用于紧急更新
- 忘记提供 pending 状态
- 过度使用 useTransition 导致性能问题

---

### 3.3 useDeferredValue

**概述**：useDeferredValue 接收一个值并返回该值的延迟版本。

**核心概念**：
- 延迟非紧急更新
- 与 useTransition 类似
- 用于优化用户体验

**语法**：
```typescript
const deferredValue = useDeferredValue(value: T, options?: { timeoutMs: number }): T
```

**完整示例**：
```typescript
import { useState, useDeferredValue } from 'react';

function SearchResults() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="搜索..."
      />
      
      <Results query={deferredQuery} />
    </div>
  );
}
```

**最佳实践**：
1. 用于延迟非紧急更新
2. 与 Expensive 组件配合使用
3. 设置合理的 timeoutMs
4. 与 useTransition 配合使用

**常见陷阱**：
- 用于紧急更新
- timeoutMs 设置不合理
- 与 useTransition 混用导致混淆

---

### 3.4 useId

**概述**：useId 生成一个唯一的 ID，用于避免 hydration 不匹配问题。

**核心概念**：
- 生成唯一 ID
- SSR 安全
- 避免 hydration 不匹配

**语法**：
```typescript
const id = useId(): string
```

**完整示例**：
```typescript
import { useId } from 'react';

function Form() {
  const id = useId();

  return (
    <div>
      <label htmlFor={id}>姓名</label>
      <input id={id} type="text" />
    </div>
  );
}
```

**最佳实践**：
1. 使用 useId 生成表单元素的唯一 ID
2. 用于可访问性属性
3. 避免 hydration 不匹配
4. 在 Server Components 中使用

**常见陷阱**：
- 使用 Math.random() 生成 ID
- 在循环中使用 useId 导致不一致
- 忘记在 Server Components 中使用

---

### 3.5 useOptimistic

**概述**：useOptimistic 是 React 19 引入的新 Hook，用于实现乐观更新。

**核心概念**：
- 乐观更新 UI
- 异步操作完成前先更新
- 提供流畅的用户体验

**语法**：
```typescript
const [optimisticState, addOptimistic] = useOptimistic(
  state: T,
  updater: (currentState: T, action: U) => T
): [T, (action: U) => void]
```

**完整示例**：
```typescript
import { useOptimistic, useState } from 'react';

function MessageList() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [optimisticMessages, addOptimistic] = useOptimistic(
    messages,
    (state, newMessage: string) => [
      ...state,
      { text: newMessage, pending: true, id: Date.now() }
    ]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const message = formData.get('message') as string;

    addOptimistic(message);

    try {
      await sendMessage(message);
      setMessages(prev => [...prev, { text: message, pending: false }]);
    } catch (error) {
      setMessages(prev => prev.filter(m => !m.pending));
    }
  };

  return (
    <div>
      {optimisticMessages.map((msg, i) => (
        <div key={i} className={msg.pending ? 'pending' : ''}>
          {msg.text}
        </div>
      ))}
      <form onSubmit={handleSubmit}>
        <input name="message" />
        <button>发送</button>
      </form>
    </div>
  );
}
```

**最佳实践**：
1. 用于实现乐观更新
2. 提供流畅的用户体验
3. 处理错误时回滚
4. 与 useTransition 配合使用

**常见陷阱**：
- 忘记处理错误回滚
- 过度使用乐观更新
- 忘记设置初始状态

---

## 四、服务端 API

### 4.1 Server Components

**概述**：Server Components 是 React 19 引入的新特性，在服务器端渲染。

**核心概念**：
- 服务器端渲染
- 零客户端 JavaScript
- 直接访问服务端资源

**语法**：
```typescript
// Server Component
export default function Page() {
  return <div>服务器组件</div>;
}
```

**完整示例**：
```typescript
// app/page.tsx（Server Component）
import { db } from '@/lib/db';

export default function Page() {
  // ✅ 可以直接访问数据库
  const products = await db.products.findMany({
    include: { category: true, reviews: true },
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

**最佳实践**：
1. 优先渲染静态外壳
2. 将耗时的数据操作放在 Suspense 后
3. 尽可能将逻辑保留在 Server Components 中
4. 只在交互时使用 'use client'

**常见陷阱**：
- Server Components 中不能使用 useState、useEffect
- 不能直接访问浏览器 API
- 不能处理用户交互事件

---

### 4.2 Server Functions

**概述**：Server Functions 是 React 19 引入的新特性，在服务器端执行的函数。

**核心概念**：
- 服务器端执行
- 类型安全的前后端通信
- 自动处理表单提交

**语法**：
```typescript
'use server';

export async function serverFunction(formData: FormData) {
  // 服务器端逻辑
}
```

**完整示例**：
```typescript
// app/actions/user.ts
'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function registerUser(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;

  const user = await db.users.create({
    data: { email, password, name },
  });

  revalidatePath('/users');
  redirect('/users');
}
```

**最佳实践**：
1. 使用 'use server' 指令标记 Server Function
2. 利用 revalidatePath 实现增量静态再生成
3. 结合 useActionState 处理表单状态
4. 正确处理错误和异常

**常见陷阱**：
- Server Function 必须是 async 函数
- 不能在 Client Components 中直接调用 Server Function
- 需要正确处理错误和异常

---

### 4.3 指令符

**概述**：指令符是 React 19 引入的新特性，用于控制编译器行为。

**核心概念**：
- 编译器控制
- 指令符
- 优化

**语法**：
```typescript
// 指令符
// @reactcompiler
```

**完整示例**：
```typescript
// 编译器配置
// babel.config.js
module.exports = {
  plugins: [
    ['@reactcompiler/babel-plugin', {
      environment: {
        enableTreatFunctionArgsAsConstants: true,
      },
    }],
  ],
};
```

**最佳实践**：
1. 配置 ESLint 检查
2. 避免在 Render 阶段读取 Ref
3. 避免有条件地调用 Hooks
4. 使用编译器优化

**常见陷阱**：
- 忘记配置 ESLint
- 在 Render 阶段读取 Ref
- 有条件地调用 Hooks

---

## 五、过时的 API

### 5.1 过时的 React API

**概述**：过时的 React API 已被废弃，应使用新 API。

**核心概念**：
- 废弃 API
- 新 API
- 迁移

**语法**：
```typescript
// 过时的 API
// 新的 API
```

**完整示例**：
```typescript
// 过时的 API
// 新的 API
```

**最佳实践**：
1. 使用新 API
2. 避免使用过时的 API
3. 迁移到新 API
4. 遵循最佳实践

**常见陷阱**：
- 使用过时的 API
- 忘记迁移到新 API
- 忘记遵循最佳实践
- 忘记使用新 API

---

## 六、React Compiler

### 6.1 配置

**概述**：React Compiler 配置用于控制编译器行为。

**核心概念**：
- 编译器配置
- Babel 插件
- ESLint

**语法**：
```typescript
// Babel 配置
{
  "plugins": ["@reactcompiler/babel-plugin"]
}

// ESLint 配置
{
  "plugins": ["react-compiler"],
  "rules": {
    "react-compiler/react-compiler": "error"
  }
}
```

**完整示例**：
```typescript
// babel.config.js
module.exports = {
  plugins: [
    ['@reactcompiler/babel-plugin', {
      environment: {
        enableTreatFunctionArgsAsConstants: true,
      },
    }],
  ],
};

// .eslintrc.js
module.exports = {
  plugins: ['react-compiler'],
  rules: {
    'react-compiler/react-compiler': 'error',
  },
};
```

**最佳实践**：
1. 配置 ESLint 检查
2. 避免在 Render 阶段读取 Ref
3. 避免有条件地调用 Hooks
4. 使用编译器优化

**常见陷阱**：
- 忘记配置 ESLint
- 在 Render 阶段读取 Ref
- 有条件地调用 Hooks

---

### 6.2 Compiling Libraries

**概述**：Compiling Libraries 用于编译库。

**核心概念**：
- 编译库
- 编译器
- 优化

**语法**：
```typescript
// 编译库
// 编译器
// 优化
```

**完整示例**：
```typescript
// 编译库
// 编译器
// 优化
```

**最佳实践**：
1. 配置 ESLint 检查
2. 避免在 Render 阶段读取 Ref
3. 避免有条件地调用 Hooks
4. 使用编译器优化

**常见陷阱**：
- 忘记配置 ESLint
- 在 Render 阶段读取 Ref
- 有条件地调用 Hooks

---

## 七、React DevTools

### 7.1 概述

**概述**：React DevTools 是 React 的调试工具。

**核心概念**：
- 组件检查
- 性能分析
- 状态查看

**语法**：
```typescript
// React DevTools
// React Profiler
```

**完整示例**：
```typescript
// React DevTools
// React Profiler
```

**最佳实践**：
1. 使用 React DevTools 调试
2. 分析性能瓶颈
3. 查看组件状态
4. 优化组件性能

**常见陷阱**：
- 忘记安装 React DevTools
- 忘记分析性能瓶颈
- 忘记查看组件状态

---

## 八、React Performance tracks

### 8.1 概述

**概述**：React Performance tracks 是 React 的性能追踪工具。

**核心概念**：
- 性能追踪
- 渲染分析
- 优化建议

**语法**：
```typescript
// React Profiler
// React Performance API
```

**完整示例**：
```typescript
// React Profiler
// React Performance API
```

**最佳实践**：
1. 使用 React Profiler
2. 分析性能瓶颈
3. 优化组件性能
4. 遵循最佳实践

**常见陷阱**：
- 忘记使用 React Profiler
- 忘记分析性能瓶颈
- 忘记优化组件性能

---

## 九、eslint-plugin-react-hooks

### 9.1 概述

**概述**：eslint-plugin-react-hooks 是 React Hooks 的 ESLint 插件。

**核心概念**：
- Hooks 规则
- 依赖检查
- 命名约定

**语法**：
```typescript
// ESLint 配置
{
  "plugins": ["react-hooks"],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

**完整示例**：
```typescript
// 规则 1：只在顶层调用 Hook
// ✅ 正确
function GoodComponent() {
  const [state, setState] = useState(0);
  if (condition) {
    // 使用 state
  }
}

// ❌ 错误
function BadComponent() {
  if (condition) {
    const [state, setState] = useState(0); // 错误！
  }
}

// 规则 2：只在 React 函数中调用 Hook
// ✅ 正确
function Component() {
  const [state, setState] = useState(0);
}

// ❌ 错误
function regularFunction() {
  const [state, setState] = useState(0); // 错误！
}

// 规则 3：依赖数组完整
// ✅ 正确
useEffect(() => {
  fetchData(userId);
}, [userId]); // ✅ 依赖 userId

// ❌ 错误
useEffect(() => {
  fetchData(userId);
}, []); // ❌ 忘记依赖 userId
```

**最佳实践**：
1. 配置 ESLint
2. 遵循 Hooks 规则
3. 完整依赖数组
4. 正确命名 Hook

**常见陷阱**：
- 忘记配置 ESLint
- 忘记遵循 Hooks 规则
- 忘记完整依赖数组
- 忘记正确命名 Hook

---

## 十、总结

本文档全面覆盖了 React 19.2 的所有 API，包括：

1. **React 核心 API**：Hooks、组件、API
2. **React DOM API**：Hook、组件、API、Static APIs
3. **客户端 API**：useActionState、useTransition、useDeferredValue、useId、useOptimistic
4. **服务端 API**：Server Components、Server Functions、指令符
5. **过时的 API**：过时的 React API
6. **React Compiler**：配置、Compiling Libraries
7. **React DevTools**：概述
8. **React Performance tracks**：概述
9. **eslint-plugin-react-hooks**：概述

本文档还提供了详细的代码示例、最佳实践、常见陷阱和横向对比，帮助开发者全面掌握 React 19.2。

---
*本文档由 Qwen Code 维护，最后更新于 2026 年 3 月*
