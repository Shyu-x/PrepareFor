# React Hooks 详解

## 目录

1. Hooks 概述
2. useState - 状态管理
3. useEffect - 副作用处理
4. useContext - 上下文
5. useReducer - 复杂状态逻辑
6. useMemo - 记忆化计算
7. useCallback - 记忆化函数
8. useRef - 引用
9. 自定义 Hooks

---

## 1. Hooks 概述

### 1.1 什么是 Hooks？

Hooks 是 React 16.8 引入的新特性，允许在函数组件中使用状态和其他 React 特性。

**为什么使用 Hooks？**
- 状态逻辑复用：自定义 Hooks 可以复用状态逻辑
- 代码组织：相关代码可以放在一起
- 类组件替代：不再需要类组件

### 1.2 Hooks 规则

```tsx
// ✅ 正确：在函数组件顶层调用
function MyComponent() {
  const [state, setState] = useState(0)
  const [another, setAnother] = useState(0)

  return <div>{state + another}</div>
}

// ❌ 错误：在条件语句中调用
function MyComponent() {
  if (condition) {
    const [state, setState] = useState(0) // 错误！
  }
  return <div />
}

// ❌ 错误：在循环中调用
function MyComponent() {
  items.map(item => {
    const [state, setState] = useState(0) // 错误！
    return <div>{state}</div>
  })
}
```

---

## 2. useState - 状态管理

### 2.1 基础用法

```tsx
import { useState } from 'react'

// 基本类型
function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(count - 1)}>-</button>
    </div>
  )
}

// 字符串
function NameInput() {
  const [name, setName] = useState('')

  return (
    <input
      value={name}
      onChange={(e) => setName(e.target.value)}
      placeholder="Enter name"
    />
  )
}

// 布尔值
function Toggle() {
  const [isOn, setIsOn] = useState(false)

  return (
    <button onClick={() => setIsOn(!isOn)}>
      {isOn ? 'ON' : 'OFF'}
    </button>
  )
}
```

### 2.2 对象状态

```tsx
function UserForm() {
  const [user, setUser] = useState({
    name: '',
    email: '',
    age: 0,
  })

  // ❌ 错误：直接修改对象
  const updateName = (name) => {
    user.name = name // 不会触发重新渲染！
  }

  // ✅ 正确：创建新对象
  const updateName = (name) => {
    setUser({ ...user, name })
  }

  // 或使用函数式更新
  const updateEmail = (email) => {
    setUser(prev => ({ ...prev, email }))
  }

  return (
    <form>
      <input
        value={user.name}
        onChange={(e) => setUser({ ...user, name: e.target.value })}
      />
      <input
        value={user.email}
        onChange={(e) => setUser({ ...user, email: e.target.value })}
      />
    </form>
  )
}
```

### 2.3 数组状态

```tsx
function TodoList() {
  const [todos, setTodos] = useState([])

  // 添加
  const addTodo = (text) => {
    const newTodo = {
      id: Date.now(),
      text,
      completed: false,
    }
    setTodos([...todos, newTodo])
  }

  // 删除
  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  // 更新
  const toggleTodo = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  // 排序
  const sortTodos = () => {
    setTodos([...todos].sort((a, b) => a.text.localeCompare(b.text)))
  }

  return (
    <div>
      {todos.map(todo => (
        <div key={todo.id}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => toggleTodo(todo.id)}
          />
          <span>{todo.text}</span>
          <button onClick={() => deleteTodo(todo.id)}>Delete</button>
        </div>
      ))}
    </div>
  )
}
```

### 2.4 初始值计算

```tsx
// ✅ 正确：初始值是简单的
const [data, setData] = useState(() => {
  const saved = localStorage.getItem('data')
  return saved ? JSON.parse(saved) : defaultValue
})

// ✅ 正确：初始值来自 props
function UserProfile({ userId }) {
  const [user, setUser] = useState(() => {
    // 只在首次渲染时执行
    return fetchUser(userId)
  })

  return <div>{user.name}</div>
}
```

---

## 3. useEffect - 副作用处理

### 3.1 基础用法

```tsx
import { useEffect, useState } from 'react'

function DataFetcher() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  // 组件挂载后获取数据
  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(result => {
        setData(result)
        setLoading(false)
      })
  }, []) // 空依赖数组 = 只在挂载时执行

  if (loading) return <div>Loading...</div>
  return <div>{data}</div>
}
```

### 3.2 依赖数组

```tsx
function UserProfile({ userId }) {
  const [user, setUser] = useState(null)

  // 每次 userId 变化时重新获取
  useEffect(() => {
    setUser(null)
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(setUser)
  }, [userId]) // 依赖 userId

  return <div>{user?.name}</div>
}

// 多个依赖
function SearchResults({ query, page, sort }) {
  const [results, setResults] = useState([])

  useEffect(() => {
    fetch(`/api/search?q=${query}&page=${page}&sort=${sort}`)
      .then(res => res.json())
      .then(setResults)
  }, [query, page, sort]) // 任意一个变化都重新获取
}
```

### 3.3 清理副作用

```tsx
function Timer() {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(s => s + 1)
    }, 1000)

    // 清理函数：组件卸载时清除
    return () => clearInterval(interval)
  }, []) // 空依赖 = 只设置一次

  return <div>Seconds: {seconds}</div>
}

// 订阅外部数据源
function EventSubscriber({ eventName }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    const handler = (event) => setData(event.data)

    // 订阅
    eventBus.on(eventName, handler)

    // 取消订阅
    return () => {
      eventBus.off(eventName, handler)
    }
  }, [eventName])

  return <div>{data}</div>
}
```

### 3.4 实际应用：数据获取

```tsx
// 基础 API 调用
function useDocument(documentId) {
  const [document, setDocument] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetchDocument() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/documents/${documentId}`)
        if (!response.ok) throw new Error('Failed to fetch')
        const data = await response.json()

        if (!cancelled) {
          setDocument(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchDocument()

    return () => {
      cancelled = true
    }
  }, [documentId])

  return { document, loading, error }
}

// 使用
function DocumentView({ documentId }) {
  const { document, loading, error } = useDocument(documentId)

  if (loading) return <Spin />
  if (error) return <Alert message={error} />

  return <DocumentContent document={document} />
}
```

---

## 4. useContext - 上下文

### 4.1 创建和使用上下文

```tsx
// 创建上下文
import { createContext, useContext } from 'react'

const ThemeContext = createContext(null)

// 提供者
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light')

  const toggleTheme = () => {
    setTheme(t => t === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// 消费上下文
function ThemeToggle() {
  const { theme, toggleTheme } = useContext(ThemeContext)

  return (
    <button onClick={toggleTheme}>
      Current: {theme}, Click to toggle
    </button>
  )
}

// 使用
function App() {
  return (
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  )
}
```

### 4.2 实际应用：用户认证

```tsx
// AuthContext.tsx
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 检查 localStorage 中的 token
    const token = localStorage.getItem('token')
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setUser(data))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (username, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await response.json()
    localStorage.setItem('token', data.token)
    setUser(data.user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

// 使用
function Header() {
  const { user, logout } = useAuth()

  return (
    <header>
      {user ? (
        <>
          <span>Welcome, {user.name}</span>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <a href="/login">Login</a>
      )}
    </header>
  )
}
```

---

## 5. useReducer - 复杂状态逻辑

### 5.1 基础用法

```tsx
import { useReducer } from 'react'

// 定义状态和操作
const initialState = { count: 0 }

function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 }
    case 'decrement':
      return { count: state.count - 1 }
    case 'reset':
      return { count: 0 }
    default:
      return state
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, initialState)

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
      <button onClick={() => dispatch({ type: 'reset' })}>Reset</button>
    </div>
  )
}
```

### 5.2 复杂状态示例：表单

```tsx
const initialState = {
  values: {
    title: '',
    content: '',
    tags: [],
  },
  errors: {
    title: '',
    content: '',
  },
  touched: {},
}

function formReducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        values: { ...state.values, [action.field]: action.value },
      }
    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.field]: action.error },
      }
    case 'SET_TOUCHED':
      return {
        ...state,
        touched: { ...state.touched, [action.field]: true },
      }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

function DocumentForm() {
  const [state, dispatch] = useReducer(formReducer, initialState)

  const handleChange = (field) => (e) => {
    dispatch({ type: 'SET_FIELD', field, value: e.target.value })
  }

  const handleBlur = (field) => () => {
    dispatch({ type: 'SET_TOUCHED', field })

    // 验证
    if (field === 'title' && !state.values.title) {
      dispatch({ type: 'SET_ERROR', field: 'title', error: 'Title is required' })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Submit:', state.values)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={state.values.title}
        onChange={handleChange('title')}
        onBlur={handleBlur('title')}
      />
      {state.touched.title && state.errors.title && (
        <span className="error">{state.errors.title}</span>
      )}

      <textarea
        value={state.values.content}
        onChange={handleChange('content')}
      />

      <button type="submit">Submit</button>
    </form>
  )
}
```

### 5.3 useReducer vs useState 选择

| 场景 | 推荐 |
|------|------|
| 简单状态（1-2个值） | useState |
| 状态之间相互依赖 | useReducer |
| 复杂表单 | useReducer |
| 多个子值 | useReducer |
| 状态逻辑复杂 | useReducer |

---

## 6. useMemo - 记忆化计算

### 6.1 基础用法

```tsx
import { useMemo } from 'react'

function ExpensiveComponent({ items, filter }) {
  // 昂贵的计算
  const filteredItems = useMemo(() => {
    console.log('Filtering...') // 调试用
    return items.filter(item =>
      item.name.toLowerCase().includes(filter.toLowerCase())
    )
  }, [items, filter]) // 只有 items 或 filter 变化时才重新计算

  return (
    <ul>
      {filteredItems.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  )
}
```

### 6.2 对象引用

```tsx
function Component({ name, age }) {
  // ❌ 每次渲染都创建新对象
  const user = { name, age }

  // ✅ 使用 useMemo 保持引用稳定
  const user = useMemo(() => ({ name, age }), [name, age])

  // ✅ 当作 props 传递给子组件时很有用
  return <ChildComponent user={user} />
}
```

### 6.3 选择器模式

```tsx
function UserList() {
  const [users, setUsers] = useState([])
  const [filter, setFilter] = useState('')

  // 派生状态：活跃用户
  const activeUsers = useMemo(
    () => users.filter(u => u.status === 'active'),
    [users]
  )

  // 派生状态：过滤后的用户
  const filteredUsers = useMemo(
    () => activeUsers.filter(u =>
      u.name.toLowerCase().includes(filter.toLowerCase())
    ),
    [activeUsers, filter]
  )

  // 派生状态：统计
  const stats = useMemo(() => ({
    total: users.length,
    active: activeUsers.length,
    filtered: filteredUsers.length,
  }), [users, activeUsers, filteredUsers])

  return (
    <div>
      <StatsDisplay stats={stats} />
      <UserListView users={filteredUsers} />
    </div>
  )
}
```

---

## 7. useCallback - 记忆化函数

### 7.1 基础用法

```tsx
import { useCallback } from 'react'

function ParentComponent() {
  const [count, setCount] = useState(0)

  // ❌ 每次渲染都创建新函数
  const handleClick = () => {
    console.log(count)
  }

  // ✅ 使用 useCallback 保持引用稳定
  const handleClick = useCallback(() => {
    console.log(count)
  }, [count])

  return <ChildComponent onClick={handleClick} />
}
```

### 7.2 作为 Props 传递

```tsx
function Parent() {
  const [items, setItems] = useState([])

  // ✅ 稳定引用，避免不必要的子组件渲染
  const handleAdd = useCallback((item) => {
    setItems(prev => [...prev, item])
  }, [])

  const handleDelete = useCallback((id) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  return (
    <>
      <ItemList items={items} onDelete={handleDelete} />
      <AddForm onAdd={handleAdd} />
    </>
  )
}

function ItemList({ items, onDelete }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>
          {item.name}
          <button onClick={() => onDelete(item.id)}>Delete</button>
        </li>
      ))}
    </ul>
  )
}
```

---

## 8. useRef - 引用

### 8.1 基础用法

```tsx
import { useRef } from 'react'

function TextInput() {
  const inputRef = useRef(null)

  const focusInput = () => {
    inputRef.current?.focus()
  }

  return (
    <div>
      <input ref={inputRef} type="text" />
      <button onClick={focusInput}>Focus</button>
    </div>
  )
}
```

### 8.2 存储不需要触发渲染的值

```tsx
function Timer() {
  const [count, setCount] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCount(c => c + 1)
    }, 1000)

    return () => clearInterval(intervalRef.current)
  }, [])

  // 不需要重新渲染的值
  const startTimeRef = useRef(Date.now())

  const getElapsed = () => {
    return Date.now() - startTimeRef.current
  }

  return (
    <div>
      <p>Count: {count}</p>
      <p>Elapsed: {getElapsed()}ms</p>
    </div>
  )
}
```

### 8.3 访问上一个状态值

```tsx
function PreviousValue() {
  const [count, setCount] = useState(0)
  const prevCountRef = useRef()

  useEffect(() => {
    prevCountRef.current = count
  }, [count])

  const prevCount = prevCountRef.current

  return (
    <div>
      <p>Current: {count}</p>
      <p>Previous: {prevCount}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
    </div>
  )
}
```

---

## 9. 自定义 Hooks

### 9.1 什么是自定义 Hooks？

自定义 Hooks 是复用状态逻辑的函数，以 `use` 开头：

```tsx
// useLocalStorage.ts
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      return initialValue
    }
  })

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(error)
    }
  }

  return [storedValue, setValue]
}

// 使用
function App() {
  const [name, setName] = useLocalStorage('name', '')
  return <input value={name} onChange={e => setName(e.target.value)} />
}
```

### 9.2 实际应用：Socket 连接

```tsx
// useSocket.ts
function useSocket(docId, userId, userName) {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState([])

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_BACKEND_URL, {
      transports: ['websocket'],
    })

    newSocket.on('connect', () => {
      setConnected(true)
      newSocket.emit('joinDocument', { docId, userId, userName })
    })

    newSocket.on('disconnect', () => {
      setConnected(false)
    })

    newSocket.on('onlineUsers', (users) => {
      setOnlineUsers(users)
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [docId, userId, userName])

  return { socket, connected, onlineUsers }
}

// 使用
function Editor({ docId }) {
  const { socket, connected, onlineUsers } = useSocket(
    docId,
    userId,
    userName
  )

  useEffect(() => {
    if (!socket) return

    socket.on('blockUpdated', (data) => {
      // 处理块更新
    })

    return () => {
      socket.off('blockUpdated')
    }
  }, [socket])

  return (
    <div>
      <StatusIndicator connected={connected} />
      <OnlineUsersList users={onlineUsers} />
    </div>
  )
}
```

### 9.3 实际应用：文档状态管理

```tsx
// useDocument.ts
function useDocument(documentId) {
  const [document, setDocument] = useState(null)
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // 加载文档
  useEffect(() => {
    if (!documentId) return

    setLoading(true)
    api.getDocument(documentId)
      .then(data => {
        setDocument(data.document)
        setBlocks(data.blocks)
      })
      .finally(() => setLoading(false))
  }, [documentId])

  // 更新块
  const updateBlock = useCallback((blockId, updates) => {
    setBlocks(prev => prev.map(b =>
      b.id === blockId ? { ...b, ...updates } : b
    ))
  }, [])

  // 添加块
  const addBlock = useCallback((afterBlockId, newBlock) => {
    setBlocks(prev => {
      const index = prev.findIndex(b => b.id === afterBlockId)
      const newBlocks = [...prev]
      newBlocks.splice(index + 1, 0, newBlock)
      return newBlocks
    })
  }, [])

  // 删除块
  const deleteBlock = useCallback((blockId) => {
    setBlocks(prev => prev.filter(b => b.id !== blockId))
  }, [])

  // 保存文档
  const saveDocument = useCallback(async () => {
    setSaving(true)
    try {
      await api.saveDocument(documentId, { blocks })
    } finally {
      setSaving(false)
    }
  }, [documentId, blocks])

  return {
    document,
    blocks,
    loading,
    saving,
    updateBlock,
    addBlock,
    deleteBlock,
    saveDocument,
  }
}
```

---

## 10. Hooks 最佳实践

### 10.1 性能优化

```tsx
// ✅ 好：使用 useCallback 避免子组件重渲染
const handleBlockChange = useCallback((blockId, content) => {
  updateBlock(blockId, { content })
}, [updateBlock])

// ✅ 好：使用 useMemo 缓存计算结果
const sortedBlocks = useMemo(() => {
  return [...blocks].sort((a, b) => a.order - b.order)
}, [blocks])

// ✅ 好：使用 useRef 存储不需要渲染的值
const lastContentRef = useRef('')
```

### 10.2 清理函数

```tsx
// ✅ 好：清理订阅和定时器
useEffect(() => {
  const subscription = api.subscribe(handleUpdate)
  const interval = setInterval(doSomething, 1000)

  return () => {
    subscription.unsubscribe()
    clearInterval(interval)
  }
}, [])

// ✅ 好：使用 AbortController 取消请求
useEffect(() => {
  const controller = new AbortController()

  fetch('/api/data', { signal: controller.signal })
    .then(setData)
    .catch(err => {
      if (err.name !== 'AbortError') throw err
    })

  return () => controller.abort()
}, [])
```

### 10.3 依赖数组

```tsx
// ✅ 好：包含所有使用的值
useEffect(() => {
  document.title = `${count} items`
}, [count])

// ✅ 好：使用函数式更新避免依赖
const [count, setCount] = useState(0)
setCount(prev => prev + 1) // 不需要依赖数组
```

---

## 练习题

### 练习 1：创建 useDebounce Hook

创建一个 `useDebounce` Hook，用于防抖处理：

```tsx
function useDebounce<T>(value: T, delay: number): T
// 示例
const debouncedSearch = useDebounce(search, 500)
```

### 练习 2：创建 useOnlineStatus Hook

创建一个检测网络状态的 Hook：

```tsx
function useOnlineStatus(): boolean
// 返回当前是否在线
```

### 练习 3：完善文档编辑器状态

使用 useReducer 实现一个简单的块编辑器，支持：
- 添加块
- 删除块
- 编辑块内容
- 块排序

---

## 下一步

- 学习 [状态管理详解](./Zustand状态管理.md)
- 查看项目中的实际 Hooks 用法
- 学习性能优化技巧
