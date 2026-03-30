# SWR 数据获取

## 目录
- [SWR 是什么？](#1-swr-是什么)
- [useSWR 的基本使用](#2-useswr-的基本使用)
- [数据预加载和缓存](#3-数据预加载和缓存)
- [错误处理和重试](#4-错误处理和重试)
- [乐观更新](#5-乐观更新)

---

## 1. SWR 是什么？

### 1.1 简介

**SWR** 是 React Hooks 用于数据获取的库，由 Vercel（Next.js 的创建者）开发。SWR 提供了一种现代、简单的方式来处理数据获取、缓存、重新验证等功能。

```
┌─────────────────────────────────────────────────────────────┐
│                        SWR 简介                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   S - Stale-while-revalidate                               │
│   W - 缓存数据同时在后台重新验证                            │
│   R - 返回缓存数据（陈旧但可用）                            │
│                                                             │
│   核心特性：                                                │
│   - 自动缓存                                                │
│   - 重新验证（焦点重新获取、窗口切换）                      │
│   - 乐观更新                                               │
│   - 错误重试                                                │
│   - 分页/无限滚动支持                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 为什么使用 SWR？

传统的数据获取方式存在问题：

```jsx
// ❌ 传统方式：手动管理所有状态
function UserList() {
  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return <ul>{users.map(u => <li>{u.name}</li>)}</ul>;
}
```

SWR 简化了这一切：

```jsx
// ✅ 使用 SWR：一个 Hook 搞定一切
import useSWR from 'swr';

function UserList() {
  const { data, error, isLoading } = useSWR('/api/users', fetcher);

  if (isLoading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return <ul>{data.map(u => <li>{u.name}</li>)}</ul>;
}
```

### 1.3 安装

```bash
npm install swr
# 或
yarn add swr
```

---

## 2. useSWR 的基本使用

### 2.1 基础语法

```jsx
import useSWR from 'swr';

const { data, error, isLoading, isValidating, mutate } = useSWR(
  key,           // 请求的 key（字符串或数组）
  fetcher,       // 获取数据的函数
  options        // 配置选项（可选）
);
```

### 2.2 返回值说明

| 属性 | 类型 | 说明 |
|------|------|------|
| data | any | 响应数据（未加载时为 undefined） |
| error | Error | 请求错误（无错误时为 undefined） |
| isLoading | boolean | 首次加载中（无缓存时为 true） |
| isValidating | boolean | 正在重新验证（后台更新中） |
| mutate | function | 手动更新数据的函数 |

### 2.3 第一个示例

```jsx
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((res) => res.json());

function UserProfile({ userId }) {
  const { data, error, isLoading } = useSWR(
    `/api/users/${userId}`,
    fetcher
  );

  if (isLoading) return <div>加载中...</div>;
  if (error) return <div>加载失败: {error.message}</div>;

  return (
    <div>
      <h2>{data.name}</h2>
      <p>{data.email}</p>
    </div>
  );
}
```

### 2.4 配置 Fetcher

```jsx
import useSWR, { SWRConfig } from 'swr';

// 方式一：全局配置
function App() {
  return (
    <SWRConfig
      value={{
        fetcher: (url) => fetch(url).then((res) => res.json()),
        revalidateOnFocus: false,
        retryCount: 3
      }}
    >
      <YourApp />
    </SWRConfig>
  );
}

// 方式二：在组件中使用
const fetcher = (url) => fetch(url).then((res) => res.json());

function Component() {
  const { data } = useSWR('/api/data', fetcher);
}
```

### 2.5 多种请求方式

```jsx
import useSWR from 'swr';

// Fetcher 可以是任意异步函数
const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('请求失败');
  }
  return res.json();
};

// 带参数的请求
function UserDetail({ userId }) {
  const { data } = useSWR(
    userId ? `/api/users/${userId}` : null,
    fetcher
  );
  // userId 为 null 时不发起请求
}

// POST 请求
const postFetcher = async (url, options) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options.arg)
  });
  return res.json();
};

function CreateUser() {
  const { mutate } = useSWR('/api/users', postFetcher);

  const handleCreate = async (userData) => {
    await mutate('/api/users', postFetcher('/api/users', userData), false);
  };
}
```

---

## 3. 数据预加载和缓存

### 3.1 自动缓存

SWR 会自动缓存请求结果：

```jsx
function ComponentA() {
  const { data } = useSWR('/api/users', fetcher);
  console.log('A 组件:', data);
}

function ComponentB() {
  const { data } = useSWR('/api/users', fetcher);
  console.log('B 组件:', data);
}

// 组件 A 请求后，组件 B 会使用缓存
```

### 3.2 预加载数据

```jsx
import useSWR, { preload } from 'swr';

// 页面加载前预加载
function App() {
  // 用户悬停在链接上时预加载
  const handleMouseEnter = () => {
    preload('/api/users', fetcher);
  };

  return (
    <div>
      <a href="/users" onMouseEnter={handleMouseEnter}>
        用户列表
      </a>
    </div>
  );
}

// 或者在 useEffect 中预加载
function PrefetchExample() {
  const { data } = useSWR('/api/data', fetcher);

  useEffect(() => {
    // 提前预加载其他数据
    preload('/api/other-data', fetcher);
  }, []);

  return <div>{data}</div>;
}
```

### 3.3 手动更新缓存

```jsx
import useSWR from 'swr';

function Component() {
  const { data, mutate } = useSWR('/api/users', fetcher);

  const handleUpdate = async () => {
    // 方式一：调用 mutate 触发重新获取
    await mutate();

    // 方式二：直接更新缓存
    await mutate(
      '/api/users',
      // 更新后的数据
      (currentData) => {
        return currentData.map(user =>
          user.id === 1 ? { ...user, name: '新名字' } : user
        );
      },
      false // 不立即重新获取
    );

    // 方式三：直接设置完全不同的数据
    await mutate('/api/users', newData, false);
  };

  return <button onClick={handleUpdate}>更新</button>;
}
```

### 3.4 依赖请求

```jsx
function DependentRequests() {
  // 先获取用户列表
  const { data: users } = useSWR('/api/users', fetcher);

  // 根据用户数据获取第一个用户的详情
  const { data: firstUserDetail } = useSWR(
    users ? `/api/users/${users[0].id}` : null,
    fetcher
  );

  return (
    <div>
      <h2>用户列表</h2>
      {users?.map(user => <div key={user.id}>{user.name}</div>)}

      <h2>第一个用户详情</h2>
      {firstUserDetail && <div>{firstUserDetail.bio}</div>}
    </div>
  );
}
```

### 3.5 离线支持

```jsx
import useSWR from 'swr';

function OfflineExample() {
  const { data, error } = useSWR('/api/data', fetcher, {
    // 离线时返回缓存数据
    fallbackData: [],

    // 错误时重试次数
    revalidateOnFocus: false,

    // 检测网络状态
    revalidateIfStale: false
  });

  return <div>{data}</div>;
}
```

---

## 4. 错误处理和重试

### 4.1 基本错误处理

```jsx
import useSWR from 'swr';

function UserProfile() {
  const { data, error, isLoading } = useSWR('/api/user', fetcher);

  if (isLoading) return <Spinner />;

  if (error) {
    return (
      <div>
        <h3>出错了！</h3>
        <p>{error.message}</p>
        <p>错误状态码: {error.status}</p>
      </div>
    );
  }

  return <div>用户: {data.name}</div>;
}
```

### 4.2 自定义错误处理

```jsx
import useSWR from 'swr';

function ErrorHandling() {
  const { data, error } = useSWR('/api/data', fetcher, {
    // 错误回调
    onError: (error, key) => {
      console.error('请求错误:', error);
      if (error.status === 401) {
        // 处理未授权
        redirectToLogin();
      }
      if (error.status === 403) {
        // 处理禁止访问
        showPermissionError();
      }
    },

    // 错误重试回调
    onErrorRetry: (error, key, config, revalidate, retryCount) => {
      // 不重试 404 错误
      if (error.status === 404) return;

      // 超过 3 次重试后停止
      if (retryCount >= 3) return;

      // 5 秒后重试
      setTimeout(() => revalidate({ retryCount }), 5000);
    }
  });
}
```

### 4.3 重试配置

```jsx
import useSWR from 'swr';

function RetryConfig() {
  const { data } = useSWR('/api/data', fetcher, {
    // 重试次数（默认 3）
    errorRetryCount: 3,

    // 重试延迟（毫秒，默认 5000）
    errorRetryInterval: 5000,

    // 是否在获得新数据后重试
    revalidateOnReconnect: true,

    // 是否在窗口获得焦点时重新验证
    revalidateOnFocus: true,

    // 是否在组件挂载时重新验证
    revalidateOnMount: true,

    // 重新验证的最小间隔
    dedupingInterval: 2000
  });
}
```

### 4.4 全局错误处理

```jsx
import { SWRConfig } from 'swr';

function App() {
  return (
    <SWRConfig
      value={{
        onError: (error, key) => {
          // 记录错误到监控系统
          console.error('SWR Error:', error);
        },
        onErrorRetry: (error, key, config, revalidate, retryCount) => {
          // 自定义重试逻辑
          if (retryCount > 5) return;
          setTimeout(() => revalidate({ retryCount }), 5000);
        }
      }}
    >
      <YourApp />
    </SWRConfig>
  );
}
```

### 4.5 条件错误处理

```jsx
function ConditionalError() {
  const { data, error } = useSWR('/api/data', fetcher, {
    // 只在特定条件下重试
    shouldRetryOnError: (err) => {
      // 不重试 4xx 错误
      if (err.status >= 400 && err.status < 500) {
        return false;
      }
      return true;
    }
  });
}
```

---

## 5. 乐观更新

### 5.1 什么是乐观更新？

乐观更新是指在服务器响应之前，先更新 UI，给用户一种"操作成功"的体验。如果服务器请求失败，再回滚到之前的状态。

```
┌─────────────────────────────────────────────────────────────┐
│                    乐观更新流程                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   用户点击 "点赞"                                            │
│           │                                                  │
│           ▼                                                  │
│   ┌─────────────────┐                                       │
│   │ 1. 立即更新 UI │ ← 用户立即看到效果                     │
│   │ (点赞数 +1)    │                                        │
│   └────────┬────────┘                                       │
│            │                                                 │
│            ▼                                                 │
│   ┌─────────────────┐                                       │
│   │ 2. 发送请求    │                                        │
│   │ POST /api/like │                                        │
│   └────────┬────────┘                                       │
│            │                                                 │
│     ┌──────┴──────┐                                         │
│     ▼             ▼                                         │
│  成功            失败                                        │
│     │             │                                         │
│     ▼             ▼                                         │
│  完成           回滚 UI                                     │
│                 (点赞数 -1)                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 基本乐观更新

```jsx
import useSWR, { mutate } from 'swr';

function LikeButton({ postId, initialLikes }) {
  const { data } = useSWR(`/api/posts/${postId}`, fetcher, {
    fallbackData: { likes: initialLikes }
  });

  const handleLike = async () => {
    const newLikes = (data?.likes || 0) + 1;

    // 1. 立即更新缓存
    mutate(
      `/api/posts/${postId}`,
      { likes: newLikes },
      false
    );

    try {
      // 2. 发送请求
      await fetch(`/api/posts/${postId}/like`, {
        method: 'POST'
      });

      // 3. 请求成功，触发重新验证（可选）
      mutate(`/api/posts/${postId}`);
    } catch (error) {
      // 4. 请求失败，回滚到之前的数据
      mutate(`/api/posts/${postId}`, data, true);
    }
  };

  return (
    <button onClick={handleLike}>
      点赞 ({data?.likes})
    </button>
  );
}
```

### 5.3 使用 mutate 的回调函数

```jsx
import useSWR, { mutate } from 'swr';

function UpdateTodo() {
  const { data, mutate } = useSWR('/api/todos', fetcher);

  const toggleTodo = async (todoId) => {
    // 使用回调函数进行乐观更新
    await mutate(
      '/api/todos',
      (todos) =>
        todos.map((todo) =>
          todo.id === todoId
            ? { ...todo, completed: !todo.completed }
            : todo
        ),
      false // 不立即重新获取
    );

    try {
      await fetch(`/api/todos/${todoId}/toggle`, {
        method: 'POST'
      });
      // 请求成功，触发重新验证以确保数据一致
      mutate('/api/todos');
    } catch (error) {
      // 请求失败，回滚
      mutate('/api/todos', data, true);
    }
  };

  return (
    <ul>
      {data?.map((todo) => (
        <li
          key={todo.id}
          onClick={() => toggleTodo(todo.id)}
          style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}
        >
          {todo.text}
        </li>
      ))}
    </ul>
  );
}
```

### 5.4 完整的表单提交示例

```jsx
import useSWR, { mutate } from 'swr';

function CreateUserForm() {
  const { data, mutate } = useSWR('/api/users', fetcher);

  const handleSubmit = async (formData) => {
    // 1. 创建新用户对象
    const newUser = {
      id: Date.now(),
      name: formData.name,
      email: formData.email
    };

    // 2. 乐观添加到列表
    await mutate(
      '/api/users',
      (users) => [...(users || []), newUser],
      false
    );

    try {
      // 3. 发送创建请求
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('创建失败');

      const createdUser = await response.json();

      // 4. 用服务器返回的数据替换
      await mutate('/api/users', (users) =>
        users.map((u) => (u.id === newUser.id ? createdUser : u))
      );
    } catch (error) {
      // 5. 失败则回滚
      mutate('/api/users', data, true);
      alert('创建失败');
    }
  };

  return <Form onSubmit={handleSubmit} />;
}
```

### 5.5 删除操作的乐观更新

```jsx
function DeleteUser() {
  const { data, mutate } = useSWR('/api/users', fetcher);

  const deleteUser = async (userId) => {
    // 保存原始数据用于回滚
    const originalUsers = data;

    // 乐观删除
    await mutate(
      '/api/users',
      (users) => users.filter((u) => u.id !== userId),
      false
    );

    try {
      await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      // 失败回滚
      mutate('/api/users', originalUsers, true);
    }
  };

  return (
    <ul>
      {data?.map((user) => (
        <li key={user.id}>
          {user.name}
          <button onClick={() => deleteUser(user.id)}>删除</button>
        </li>
      ))}
    </ul>
  );
}
```

### 5.6 乐观更新的最佳实践

```jsx
function BestPractice() {
  const { data, mutate } = useSWR('/api/items', fetcher);

  const updateItem = async (id, updates) => {
    // 1. 保存原始数据
    const originalData = data;

    // 2. 乐观更新
    mutate(
      '/api/items',
      (items) =>
        items.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        ),
      false
    );

    try {
      // 3. 发送请求
      const response = await fetch(`/api/items/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('更新失败');

      // 4. 请求成功，重新验证确保一致性
      mutate('/api/items');
    } catch (error) {
      // 5. 失败回滚
      mutate('/api/items', originalData, true);
      // 可选：显示错误提示
      showErrorToast('更新失败，已恢复');
    }
  };
}
```

---

## 6. 高级用法

### 6.1 分页支持

```jsx
import useSWR from 'swr';

function Pagination({ page }) {
  const { data, error } = useSWR(`/api/users?page=${page}`, fetcher);

  if (error) return <div>加载失败</div>;
  if (!data) return <div>加载中...</div>;

  return (
    <div>
      {data.users.map((user) => (
        <div key={user.id}>{user.name}</div>
      ))}

      <div className="pagination">
        <button
          disabled={page === 1}
          onClick={() => navigate(page - 1)}
        >
          上一页
        </button>
        <span>第 {page} 页</span>
        <button
          disabled={page === data.totalPages}
          onClick={() => navigate(page + 1)}
        >
          下一页
        </button>
      </div>
    </div>
  );
}
```

### 6.2 无限滚动

```jsx
import useSWRInfinite from 'swr/infinite';

function InfiniteScroll() {
  // 获取缓存的 key
  const getKey = (pageIndex, previousPageData) => {
    // 到达最后一页
    if (previousPageData && !previousPageData.next) return null;
    // 第一页
    return `/api/users?page=${pageIndex + 1}`;
  };

  const { data, size, setSize, isLoading } = useSWRInfinite(
    getKey,
    fetcher
  );

  // 扁平化所有页面的数据
  const users = data ? data.flatMap((page) => page.users) : [];
  const isLoadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined');

  return (
    <div>
      {users.map((user) => (
        <div key={user.id}>{user.name}</div>
      ))}

      <button
        disabled={isLoadingMore}
        onClick={() => setSize(size + 1)}
      >
        {isLoadingMore ? '加载中...' : '加载更多'}
      </button>
    </div>
  );
}
```

### 6.3 实时数据（轮询）

```jsx
import useSWR from 'swr';

function LiveData() {
  const { data } = useSWR('/api/notifications', fetcher, {
    // 每 3 秒刷新一次
    refreshInterval: 3000,

    // 窗口获得焦点时重新获取
    revalidateOnFocus: true,

    // 网络重新连接时重新获取
    revalidateOnReconnect: true
  });

  return (
    <div>
      未读通知: {data?.notifications?.length || 0}
    </div>
  );
}
```

### 6.4 完整示例：用户管理

```jsx
import useSWR, { mutate } from 'swr';

// Fetcher 配置
const fetcher = (url) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error('请求失败');
    return res.json();
  });

// 用户列表组件
function UserList() {
  const {
    data: users,
    error,
    isLoading,
    mutate
  } = useSWR('/api/users', fetcher);

  if (isLoading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>
          <span>{user.name}</span>
          <span>{user.email}</span>
          <button onClick={() => deleteUser(user.id)}>删除</button>
        </li>
      ))}
    </ul>
  );

  async function deleteUser(id) {
    const originalUsers = users;

    // 乐观删除
    await mutate(
      '/api/users',
      (users) => users.filter((u) => u.id !== id),
      false
    );

    try {
      await fetch(`/api/users/${id}`, { method: 'DELETE' });
      mutate('/api/users');
    } catch {
      // 回滚
      mutate('/api/users', originalUsers, true);
    }
  }
}

// 添加用户组件
function AddUser() {
  const { mutate } = useSWR('/api/users', fetcher);

  const handleAdd = async (userData) => {
    const newUser = { id: Date.now(), ...userData };

    // 乐观添加
    await mutate(
      '/api/users',
      (users) => [...(users || []), newUser],
      false
    );

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (!res.ok) throw new Error('添加失败');

      // 重新获取确保一致性
      mutate('/api/users');
    } catch {
      mutate('/api/users');
    }
  };

  return <Form onAdd={handleAdd} />;
}
```

---

## 7. SWR 源码实现深度解析

### 7.1 核心概念：Stale-While-Revalidate

SWR 的名称来源于 HTTP RFC 5861 中定义的缓存策略 **Stale-While-Revalidate**：

```
┌─────────────────────────────────────────────────────────────────┐
│              Stale-While-Revalidate 策略                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   缓存响应头示例：                                              │
│   Cache-Control: max-age=60, stale-while-revalidate=3600       │
│                                                                 │
│   含义：                                                        │
│   - max-age=60：缓存有效期 60 秒                               │
│   - stale-while-revalidate=3600：                             │
│     60-3600 秒内，返回缓存数据（stale）同时在后台重新验证     │
│                                                                 │
│   时间轴：                                                      │
│   0s ----60s----3600s----→                                   │
│   │     │        │                                              │
│   │     ▼        ▼                                              │
│   │   新数据   过期数据                                         │
│   │   + 重验证   + 重验证                                      │
│   ▼                                                            │
│   请求                                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

SWR 在前端实现了这一策略：

```typescript
// SWR 的核心逻辑
const { data, isLoading } = useSWR('/api/user', fetcher);

// 当缓存数据存在时：
// 1. 立即返回缓存数据（stale）
// 2. 在后台发起请求重新验证（revalidate）
// 3. 请求完成后更新缓存和 UI
```

### 7.2 SWR 内部机制详解

#### 7.2.1 缓存系统

SWR 使用内存缓存存储所有请求的数据：

```typescript
// SWR 内部缓存结构简化
const cache = new Map<string, CacheEntry>();

interface CacheEntry {
  data: any;           // 响应数据
  error: Error;        // 错误信息
  isValidating: boolean; // 是否正在验证
  revalidate: () => Promise<void>; // 重新验证函数
  ttl: number;         // 过期时间
}
```

#### 7.2.2 请求去重（Deduplication）

SWR 在短时间内对相同 key 的请求进行去重：

```typescript
// SWR 去重机制简化实现
const fetchCache = new Map<string, Promise<any>>();

async function swrFetch(key, fetcher, options = {}) {
  const { dedupingInterval = 2000 } = options; // 默认 2 秒

  // 检查是否有进行中的相同请求
  const existingRequest = fetchCache.get(key);
  if (existingRequest) {
    // 如果请求还在 dedupingInterval 内，返回现有请求
    return existingRequest;
  }

  // 创建新请求
  const request = fetcher(key).finally(() => {
    // 请求完成后清除缓存（等待 dedupingInterval 后）
    setTimeout(() => fetchCache.delete(key), dedupingInterval);
  });

  fetchCache.set(key, request);
  return request;
}
```

#### 7.2.3 焦点重新验证（Focus Revalidation）

当用户重新聚焦窗口时，SWR 会自动重新验证数据：

```typescript
// SWR 焦点重新验证简化实现
function useSWR(key, fetcher, options = {}) {
  const { revalidateOnFocus = true } = options;

  useEffect(() => {
    if (!revalidateOnFocus) return;

    const handleFocus = () => {
      // 窗口获得焦点时重新验证
      revalidate();
    };

    // 监听 focus 事件
    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
    };
  }, [revalidateOnFocus, revalidate]);
}
```

#### 7.2.4 网络重连重新验证

当网络重新连接时，SWR 会自动重新获取数据：

```typescript
// SWR 网络重连重新验证简化实现
useEffect(() => {
  if (!revalidateOnReconnect) return;

  const handleOnline = () => {
    // 网络恢复时重新验证
    revalidate();
  };

  window.addEventListener('online', handleOnline);

  return () => {
    window.removeEventListener('online', handleOnline);
  };
}, [revalidateOnReconnect, revalidate]);
```

### 7.3 useSWR 核心实现

```typescript
// useSWR 简化版实现
function useSWR(key, fetcher, options = {}) {
  // 1. 状态管理
  const [data, setData] = useState(undefined);
  const [error, setError] = useState(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);

  // 2. 获取缓存的数据（初始值）
  const cachedData = globalCache.get(key);

  // 3. 如果有缓存，直接使用缓存数据
  useEffect(() => {
    if (cachedData) {
      setData(cachedData.data);
      setError(cachedData.error);
      setIsLoading(false);
    }
  }, [key]);

  // 4. 定义重新验证函数
  const revalidate = useCallback(async () => {
    if (!key || !fetcher) return;

    setIsValidating(true);

    try {
      const newData = await fetcher(key);
      setData(newData);
      setError(undefined);

      // 更新全局缓存
      globalCache.set(key, { data: newData, error: undefined });
    } catch (err) {
      setError(err);

      // 更新全局缓存
      globalCache.set(key, { data, error: err });
    } finally {
      setIsValidating(false);
    }
  }, [key, fetcher]);

  // 5. 初始请求
  useEffect(() => {
    if (!key || !fetcher) return;

    setIsLoading(true);
    revalidate().finally(() => setIsLoading(false));
  }, [key, fetcher]);

  // 6. 焦点重新验证
  useEffect(() => {
    if (!revalidateOnFocus) return;
    window.addEventListener('focus', revalidate);
    return () => window.removeEventListener('focus', revalidate);
  }, [revalidateOnFocus, revalidate]);

  // 7. 轮询
  useEffect(() => {
    if (!refreshInterval) return;

    const interval = setInterval(revalidate, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, revalidate]);

  // 8. 返回值
  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate: (newData, shouldRevalidate = true) => {
      // 乐观更新
      if (typeof newData === 'function') {
        setData(newData(data));
      } else {
        setData(newData);
      }

      // 可选：重新验证
      if (shouldRevalidate) {
        revalidate();
      }
    }
  };
}
```

### 7.4 SWR 的性能优化

#### 7.4.1 键值派生

SWR 使用键值派生来管理缓存，键可以是任意值：

```typescript
// 字符串键
useSWR('/api/users', fetcher);

// 数组键 - 包含动态参数
const { data } = useSWR(['/api/user', userId], ([url, id]) =>
  fetch(`${url}/${id}`).then(r => r.json())
);

// 对象键
const { data } = useSWR({ url: '/api/users', args: { status: 'active' } }, fetcher);
```

#### 7.4.2 条件请求

```typescript
// key 为 null 或 false 时不发起请求
const { data } = useSWR(shouldFetch ? '/api/data' : null, fetcher);

// 依赖请求
const { data: user } = useSWR('/api/user', fetcher);
const { data: posts } = useSWR(user ? `/api/posts/${user.id}` : null, fetcher);
```

#### 7.4.3 缓存策略配置

```typescript
// 配置缓存策略
const { data } = useSWR('/api/data', fetcher, {
  // 初始数据（SSR 场景）
  fallbackData: initialData,

  // 重新验证间隔（毫秒）
  revalidateInterval: 0,

  // 是否在焦点时重新验证
  revalidateOnFocus: true,

  // 是否在网络重连时重新验证
  revalidateOnReconnect: true,

  // 是否在挂载时重新验证
  revalidateOnMount: true,

  // 是否在数据过期时重新验证
  revalidateIfStale: true,

  // 去重间隔
  dedupingInterval: 2000,

  // 错误重试次数
  errorRetryCount: 3,

  // 错误重试间隔
  errorRetryInterval: 5000
});
```

### 7.5 全局配置

```typescript
// 全局配置示例
import { SWRConfig } from 'swr';

function App() {
  return (
    <SWRConfig
      value={{
        // 全局 fetcher
        fetcher: (url) => fetch(url).then(r => r.json()),

        // 全局错误处理
        onError: (error, key) => {
          console.error('Error:', error);
        },

        // 全局错误重试
        onErrorRetry: (error, key, config, revalidate, retryCount) => {
          // 5 秒后重试
          setTimeout(() => revalidate(), 5000);
        },

        // 全局加载完成回调
        onSuccess: (data, key) => {
          console.log('Loaded:', key);
        },

        // 全局数据转换
        onLoad: (data, key) => {
          return transformData(data);
        },

        // 错误阈值
        errorRetryInterval: 5000,

        // 焦点重新验证
        revalidateOnFocus: true,

        // 离线模式
        isOnline: () => navigator.onLine,

        // 缓存窗口焦点
        isVisible: () => document.visibilityState === 'visible',

        // 初始化数据
        fallback: {
          '/api/user': { name: '初始用户' }
        }
      }}
    >
      <YourApp />
    </SWRConfig>
  );
}
```

### 7.6 SWR vs React Query vs Fetch

| 特性 | SWR | React Query | Fetch API |
|------|-----|--------------|-----------|
| 大小 | ~2KB | ~10KB | 原生 |
| API 复杂度 | 简单 | 中等 | 复杂 |
| TypeScript | 原生支持 | 原生支持 | 需手动 |
| 缓存策略 | Stale-While-Revalidate | Stale-While-Revalidate | 无 |
| 焦点重新验证 | 自动 | 自动 | 需手动 |
| 乐观更新 | 支持 | 支持 | 需手动 |
| SSR 支持 | 有限 | 完整 | 无 |
| 社区活跃度 | 高 | 高 | - |

### 7.7 项目实际使用示例

在本项目（WebEnv导学）中，SWR 的典型使用方式：

```typescript
// hooks/useUser.ts
import useSWR from 'swr';

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  });

export function useUser(userId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `/api/users/${userId}` : null,
    fetcher
  );

  return {
    user: data,
    isLoading,
    isError: error,
    mutate
  };
}

// hooks/useUsers.ts - 分页支持
export function useUsers(page: number) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/users?page=${page}`,
    fetcher
  );

  return {
    users: data?.users || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    mutate
  };
}

// hooks/useMutateUser.ts - 乐观更新示例
export function useMutateUser() {
  const { mutate } = useSWRConfig();

  const updateUser = async (userId: string, updates: Partial<User>) => {
    // 1. 乐观更新
    await mutate(
      `/api/users/${userId}`,
      (current: User) => ({ ...current, ...updates }),
      false
    );

    try {
      // 2. 发送请求
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!res.ok) throw new Error('Update failed');

      // 3. 重新验证
      mutate(`/api/users/${userId}`);
    } catch (error) {
      // 4. 失败回滚
      mutate(`/api/users/${userId}`);
      throw error;
    }
  };

  return { updateUser };
}
```

---

## 8. 总结

本教程详细介绍了 SWR 数据获取：

| 主题 | 关键点 |
|------|--------|
| 基础使用 | useSWR(key, fetcher) 一个 hook 搞定数据获取 |
| 返回值 | data, error, isLoading, isValidating, mutate |
| 缓存 | 自动缓存，跨组件共享 |
| 预加载 | preload() 提前加载数据 |
| 错误处理 | onError 回调，errorRetryCount 重试 |
| 乐观更新 | mutate() 立即更新 UI，失败回滚 |
| 高级用法 | 分页、无限滚动、轮询 |

SWR 的核心优势：
- 极简 API
- 强大的缓存机制
- 内置乐观更新支持
- 优秀的开发者体验

结合本项目使用的 Zustand 状态管理，你可以构建完整的数据流：
- **SWR**：处理服务端状态（API 数据）
- **Zustand**：处理客户端状态（UI 状态、用户信息）

---

## 9. 项目实际源码深度分析: Next.js API 路由

### 9.1 完整项目源码

```typescript
// ===== 项目源码路径: apps/web/src/app/api/md/[slug]/route.ts =====

import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// ===== 文档目录配置 =====
const docsDir = path.join(process.cwd(), '../../前端面试题汇总')
//                                      ^^^^^^^^^^^^^^^^
//                                      process.cwd() 返回 Next.js 应用的根目录
//                                      使用相对路径指向项目外的文档目录

// ===== GET 路由处理器 =====
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  // 从 params 中获取路由参数
  const { slug } = await params

  // 构建文件路径
  const filePath = path.join(docsDir, slug)

  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    )
  }

  // 读取文件内容
  const content = fs.readFileSync(filePath, 'utf-8')

  // 返回 JSON 响应
  return NextResponse.json({ content })
}
```

### 9.2 逐行源码深度解析

```typescript
// ===== 第 1-4 行: 导入语句 =====
import { NextResponse } from 'next/server'
//                           ^^^^^^^^^^^^^^^^^
//                           Next.js 13+ App Router 的 API 模块
//                           NextResponse 用于构建 HTTP 响应

import fs from 'fs'
//         ^^^^^
//         Node.js 原生文件系统模块
//         提供文件读写、目录操作等功能

import path from 'path'
//            ^^^^^
//            Node.js 原生路径模块
//           提供路径解析、拼接等功能

// ===== 第 5 行: 文档目录配置 =====
const docsDir = path.join(process.cwd(), '../../前端面试题汇总')
//         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//         process.cwd(): 返回当前工作目录
//         在 Next.js 中通常是项目的根目录
//
//         path.join(): 安全拼接路径（自动处理不同操作系统的分隔符）
//         Windows: 'D:\\...\\前端面试题汇总'
//         Linux/Mac: '/.../前端面试题汇总'
//
//         相对路径 '../../前端面试题汇总' 说明:
//         - apps/web/src/app/api/md/ → 向上 3 级到达项目根目录
//         - 然后进入 '前端面试题汇总' 目录

// ===== 第 7 行: 导出 GET 处理器 =====
export async function GET(
  request: Request,
//         ^^^^^^^^^^^
//         Next.js Request 对象，包含 HTTP 请求的所有信息
//         - url: 请求 URL
//         - method: HTTP 方法
//         - headers: 请求头
//         - body: 请求体

  { params }: { params: Promise<{ slug: string }> }
//           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//           params 参数包含动态路由的值
//           由于 Next.js 15+ params 是 Promise，需要 await 解析
//           [slug] 是动态路由参数，会匹配 URL 中的任何值
)
{
  // 路由示例:
  // /api/md/hello-world  → params.slug = 'hello-world'
  // /api/md/react-hooks  → params.slug = 'react-hooks'

  // ===== 第 11 行: 解析路由参数 =====
  const { slug } = await params
  //            ^^^^^^^^^^^^
  //            等待 params Promise 解析
  //            获取到 slug 参数的实际值

  // ===== 第 12 行: 构建文件路径 =====
  const filePath = path.join(docsDir, slug)
  //                        ^^^^^^^^  ^^^^
  //                        基础路径 动态文件名
  //                        结果: '/path/to/前端面试题汇总/hello-world'

  // ===== 第 14-16 行: 文件存在性检查 =====
  if (!fs.existsSync(filePath)) {
    //              ^^^^^^^^^^^^^^^^^^^^^
    //              检查文件或目录是否存在
    //              返回 boolean

    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    )
  }

  // ===== 第 18 行: 读取文件内容 =====
  const content = fs.readFileSync(filePath, 'utf-8')
  //                ^^^^^^^^^^^^^^^^^^^^^^^^^
  //                readFileSync: 同步读取文件内容
  //                filePath: 文件路径
  //                'utf-8': 文件编码

  // 注意: 使用同步读取是因为这是在服务端执行
  // 在 API 路由中，同步操作是安全的

  // ===== 第 20 行: 返回响应 =====
  return NextResponse.json({ content })
  //     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //     NextResponse.json(): 创建 JSON 格式的 HTTP 响应
  //     自动设置:
  //     - Content-Type: application/json
  //     - 自动 JSON 序列化

  // 响应结构:
  // {
  //   "content": "# Hello World\n这是一篇文档..."
  // }
}
```

### 9.3 Next.js API 路由机制详解

```typescript
// ===== Next.js App Router 路由结构 =====

// 文件路径                          URL 路径
// ─────────────────────────────────────────────────────────
// app/api/md/[slug]/route.ts     →  /api/md/hello-world
// app/api/users/route.ts         →  /api/users
// app/api/users/[id]/route.ts    →  /api/users/123
// app/api/posts/route.ts         →  /api/posts
// app/api/posts/[id]/route.ts    →  /api/posts/456

// ===== 动态路由参数 =====

// app/api/[category]/[id]/route.ts
// → /api/tech/123       category='tech', id='123'
// → /api/news/456        category='news', id='456'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ category: string; id: string }> }
) {
  const { category, id } = await params
  // 使用 category 和 id 查询数据
}
```

### 9.4 HTTP 方法支持

```typescript
// ===== 支持所有 HTTP 方法 =====

// GET - 获取资源
export async function GET(request, { params }) {
  return NextResponse.json({ method: 'GET' })
}

// POST - 创建资源
export async function POST(request, { params }) {
  const body = await request.json()  // 解析请求体
  return NextResponse.json({ method: 'POST', data: body })
}

// PUT - 替换资源
export async function PUT(request, { params }) {
  const body = await request.json()
  return NextResponse.json({ method: 'PUT', data: body })
}

// PATCH - 部分更新资源
export async function PATCH(request, { params }) {
  const body = await request.json()
  return NextResponse.json({ method: 'PATCH', data: body })
}

// DELETE - 删除资源
export async function DELETE(request, { params }) {
  return NextResponse.json({ method: 'DELETE' })
}

// HEAD - 获取头部信息
export async function HEAD(request, { params }) {
  return new Response(null, {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

// OPTIONS - CORS 预检请求
export async function OPTIONS(request, { params }) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
    }
  })
}
```

### 5.5 与 SWR 集成使用

```typescript
// ===== 前端使用 SWR 调用 API =====

import useSWR from 'swr';

// 定义 fetcher
const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`)
  return res.json()
}

// API 路由: /api/md/[slug]/route.ts
function DocumentViewer({ slug }: { slug: string }) {
  // SWR 自动处理缓存、重新验证、错误等
  const { data, error, isLoading } = useSWR(
    `/api/md/${encodeURIComponent(slug)}`,  // 对 slug 进行编码
    fetcher,
    {
      // 缓存策略配置
      revalidateOnFocus: false,  // 不在焦点时重新验证
      revalidateOnReconnect: true,  // 网络重连时重新验证
      dedupingInterval: 60 * 1000,  // 1 分钟内相同请求不重复
    }
  )

  if (isLoading) return <div>加载中...</div>
  if (error) return <div>错误: {error.message}</div>

  return (
    <div className="document-content">
      <pre>{data?.content || '暂无内容'}</pre>
    </div>
  )
}

// ===== 批量预加载示例 =====
async function preloadDocuments(slugs: string[]) {
  // 使用 SWRMutation 预加载多个文档
  const promises = slugs.map(slug =>
    fetch(`/api/md/${encodeURIComponent(slug)}`)
      .then(res => res.json())
  )

  const results = await Promise.all(promises)
  return results
}
```

### 5.6 API 路由高级功能

```typescript
// ===== 1. 缓存响应 =====
export const revalidate = 60  // 60 秒后重新验证

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const filePath = path.join(docsDir, slug)
  const content = fs.readFileSync(filePath, 'utf-8')

  return NextResponse.json({ content }, {
    headers: {
      // Next.js 自动缓存响应
      'Cache-Control': `public, s-maxage=${revalidate}, stale-while-revalidate=${revalidate * 10}`
    }
  })
}

// ===== 2. 流式响应 =====
export async function GET(request: Request) {
  const stream = new ReadableStream({
    async start(controller) {
      // 分块发送数据
      for (let i = 0; i < 10; i++) {
        controller.enqueue(`chunk ${i}\n`)
        await new Promise(r => setTimeout(r, 500))
      }
      controller.close()
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  })
}

// ===== 3. 处理 CORS =====
export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}

// ===== 4. 认证中间件 =====
function withAuth(handler: any) {
  return async (request: Request, ...args: any[]) => {
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    // 验证 token...

    return handler(request, ...args)
  }
}

export const GET = withAuth(async (request: Request) => {
  // 需要 Bearer token 的 GET 请求
  return NextResponse.json({ data: 'protected-data' })
})

// ===== 5. 错误处理 =====
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const filePath = path.join(docsDir, slug)

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: `Document not found: ${slug}` },
        { status: 404 }
      )
    }

    const content = fs.readFileSync(filePath, 'utf-8')
    return NextResponse.json({ content })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## 总结：React 生态系统的数据流

```
┌─────────────────────────────────────────────────────────────┐
│              React 完整数据流架构                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────────┐     ┌─────────────────┐              │
│   │   UI 组件       │────▶│   Zustand      │              │
│   │   (React)       │◀────│   (客户端状态)  │              │
│   └─────────────────┘     └─────────────────┘              │
│           │                           │                     │
│           │  useSWR                   │                     │
│           ▼                           │                     │
│   ┌─────────────────┐                │                     │
│   │   API 服务器    │◀───────────────┘                     │
│   │   (后端)        │                                        │
│   └─────────────────┘                                        │
│                                                             │
│   数据流说明：                                              │
│   - 组件通过 useSWR 请求 API 数据                           │
│   - 组件通过 Zustand 管理 UI 状态                          │
│   - 数据变化时自动触发重新渲染                             │
│   - 乐观更新提升用户体验                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

恭喜你完成了 React 核心教程的学习！这些知识将帮助你在 WebEnv 导学项目中构建现代化的 React 应用。

---

## 相关资源

- [React 官方文档](https://react.dev)
- [Zustand GitHub](https://github.com/pmndrs/zustand)
- [SWR 官方文档](https://swr.vercel.app)
