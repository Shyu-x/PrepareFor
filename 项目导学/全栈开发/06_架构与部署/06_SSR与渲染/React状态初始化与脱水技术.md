# React状态初始化与脱水技术

在现代React全栈开发中，服务端渲染（SSR）已成为提升首屏性能和SEO效果的关键技术。然而，SSR引入了一个核心挑战：**如何在服务端和客户端之间安全、高效地传递状态**？这个问题通常被称为"状态初始化"或"脱水"（Dehydration）问题。

本文将深入探讨React应用中状态初始化与脱水技术的完整解决方案，帮助开发者掌握从服务端获取数据、传递给客户端、并在客户端恢复状态的完整流程。

---

## 一、状态初始化的核心概念

### 1.1 什么是脱水（Deduplication）

脱水是SSR中最重要的概念之一。在服务端渲染时，组件需要获取数据来生成完整的HTML。这个过程中产生的数据状态需要"脱水"——即序列化为可传输的格式（如JSON），嵌入到HTML中传递给客户端。客户端拿到HTML后，再将这些数据"水合"（Hydration）回React组件状态。

**脱水的核心价值**：

- **避免重复请求**：服务端已经获取的数据，不需要客户端再次请求
- **提升首屏性能**：HTML中已包含数据，用户无需等待额外请求即可看到内容
- **SEO友好**：搜索引擎爬虫可以直接获取完整的HTML内容
- **用户体验优化**：减少白屏时间，提升感知性能

### 1.2 Next.js中的数据获取方法演进

Next.js作为最流行的React全栈框架，经历了多次数据获取API的演进：

| 版本 | 数据获取方式 | 特点 |
|------|-------------|------|
| Pages Router | `getServerSideProps` / `getStaticProps` | 基于函数的显式数据获取 |
| App Router | Server Components + `fetch` | 默认服务端渲染，智能缓存 |
| App Router | `loading.tsx` / `error.tsx` | 文件级加载状态管理 |
| App Router | Server Actions | 表单提交和 Mutations |

**Pages Router时代的经典模式**：

```typescript
// pages/users/[id].tsx
import { GetServerSideProps } from 'next';

// 服务端数据获取函数
export const getServerSideProps: GetServerSideProps = async (context) => {
  // 从URL参数获取用户ID
  const { params } = context;
  const userId = params?.id as string;

  try {
    // 在服务端发起请求获取用户数据
    const response = await fetch(`https://api.example.com/users/${userId}`);
    const userData = await response.json();

    // 如果用户不存在，返回404页面
    if (!userData) {
      return { notFound: true };
    }

    // 将数据传递给页面组件
    return {
      props: {
        user: userData,
        // 可以传递额外元数据
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    // 错误处理
    return {
      props: {
        user: null,
        error: 'Failed to fetch user data',
      },
    };
  }
};

// 页面组件接收服务端数据
export default function UserProfile({ user, generatedAt, error }) {
  if (error || !user) {
    return <div>Error: {error || 'User not found'}</div>;
  }

  return (
    <div>
      <h1>{user.name}</h1>
      <p>Email: {user.email}</p>
      <p>Generated at: {generatedAt}</p>
    </div>
  );
}
```

**App Router时代的服务端组件模式**：

```typescript
// app/users/[id]/page.tsx
// 这是一个默认的服务端组件
async function UserProfile({ params }: { params: { id: string } }) {
  // 直接在组件内部使用 async/await 获取数据
  const response = await fetch(`https://api.example.com/users/${params.id}`, {
    // Next.js 16 的缓存配置选项
    cache: 'force-cache', // 默认行为：缓存请求结果
    next: {
      revalidate: 60, // 60秒后重新验证（ISR）
    },
  });

  if (!response.ok) {
    return <div>User not found</div>;
  }

  const user = await response.json();

  return (
    <div>
      <h1>{user.name}</h1>
      <p>Email: {user.email}</p>
      <UserStats userId={params.id} />
    </div>
  );
}

// 另一个服务端组件，负责获取统计信息
async function UserStats({ userId }: { userId: string }) {
  const stats = await fetch(
    `https://api.example.com/users/${userId}/stats`,
    { cache: 'no-store' } // 每次请求都重新获取
  ).then(res => res.json());

  return (
    <div className="stats">
      <span>Posts: {stats.posts}</span>
      <span>Followers: {stats.followers}</span>
    </div>
  );
}
```

---

## 二、状态传递技术详解

### 2.1 window.__INITIAL_STATE__ 模式

这是最经典的状态传递模式，通过在HTML中嵌入一个全局变量来传递服务端数据：

**服务端渲染时嵌入数据**：

```typescript
// lib/initialState.ts
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import App from './App';
import rootReducer from './store/rootReducer';

/**
 * 在服务端渲染应用，并将初始状态嵌入HTML
 * @param content App组件的JSX内容
 * @returns 包含HTML和初始状态的字符串
 */
export function renderToHtml(content: JSX.Element) {
  // 1. 创建Redux store
  const store = configureStore({
    reducer: rootReducer,
    // 服务端可以使用预加载状态
    preloadedState: window.__PRELOADED_STATE__,
  });

  // 2. 渲染React组件树
  const html = renderToString(
    <Provider store={store}>
      {content}
    </Provider>
  );

  // 3. 从store获取脱水后的状态
  const脱水State = store.getState();

  // 4. 返回HTML和状态，供模板使用
  return {
    html,
    脱水State,
  };
}

// 在Express服务器中使用
app.get('/', (req, res) => {
  // 服务端获取数据
  const articles = await fetchArticles();
  const categories = await fetchCategories();

  // 创建store并设置初始状态
  const store = configureStore({
    reducer: rootReducer,
    preloadedState: {
      articles: { list: articles, loading: false },
      categories: { list: categories },
    },
  });

  // 渲染应用
  const appHtml = renderToString(
    <Provider store={store}>
      <App />
    </Provider>
  );

  // 嵌入脱水状态到HTML
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>My App</title>
      </head>
      <body>
        <div id="root">${appHtml}</div>
        <!-- 脱水：将服务端状态嵌入到HTML中 -->
        <script>
          window.__INITIAL_STATE__ = ${JSON.stringify(store.getState())};
        </script>
        <script src="/bundle.js"></script>
      </body>
    </html>
  `);
});
```

**客户端水合恢复状态**：

```typescript
// client/index.tsx
import { createElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import App from './App';
import rootReducer from './store/rootReducer';

function hydrate() {
  // 从全局变量获取脱水状态
  const preloadedState = window.__INITIAL_STATE__;

  // 使用脱水状态创建store
  const store = configureStore({
    reducer: rootReducer,
    preloadedState, // 关键：用脱水状态初始化
  });

  // 水合渲染（使用hydrateRoot而非render）
  const container = document.getElementById('root');
  hydrateRoot(
    container,
    <Provider store={store}>
      <App />
    </Provider>
  );
}

// 等待DOM加载完成后执行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', hydrate);
} else {
  hydrate();
}
```

### 2.2 Script标签注入的安全方式

直接使用`JSON.stringify`注入状态存在XSS安全风险，必须进行适当的转义处理：

```typescript
/**
 * 安全地将状态注入到HTML中
 * 对特殊字符进行转义，防止XSS攻击
 */
function injectState(state: Record<string, unknown>): string {
  const json = JSON.stringify(state);

  // 手动转义特殊字符
  // JSON.stringify已经转义了<和>，但我们需要确保其他字符安全
  const escaped = json
    .replace(/</g, '\\u003c')   // 转义左尖括号
    .replace(/>/g, '\\u003e')   // 转义右尖括号
    .replace(/&/g, '\\u0026');  // 转义&符

  return `<script id="__STATE__" type="application/json">${escaped}</script>`;
}

// 验证：检查注入的脚本标签是否被正确转义
function validateInjectedState() {
  const scriptContent = document.getElementById('__STATE__')?.textContent;
  if (!scriptContent) return null;

  try {
    // 安全解析JSON
    return JSON.parse(scriptContent);
  } catch (e) {
    console.error('Failed to parse initial state:', e);
    return null;
  }
}
```

### 2.3 Next.js App Router的原生状态传递

Next.js 16的App Router提供了更优雅的状态传递方式，无需手动注入：

```typescript
// app/layout.tsx
// 服务端根布局 - 可以在这里获取全局数据
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 服务端获取全局数据
  const globalConfig = await fetchGlobalConfig();

  return (
    <html lang="zh-CN">
      <body>
        {/* 直接在组件树中传递数据，无需脱水/水合 */}
        <ConfigProvider config={globalConfig}>
          {children}
        </ConfigProvider>
      </body>
    </html>
  );
}

// app/page.tsx
// 服务端页面组件 - 数据获取自动处理状态传递
export default async function HomePage() {
  // 这些数据自动在服务端获取并传递给客户端
  const featuredArticles = await getFeaturedArticles();
  const userRecommendations = await getUserRecommendations();

  return (
    <main>
      <HeroSection articles={featuredArticles} />
      <RecommendationsGrid items={userRecommendations} />
    </main>
  );
}
```

---

## 三、客户端状态恢复技术

### 3.1 useState初始化模式

在React组件中，useState钩子的初始值只在首次渲染时使用。对于SSR场景，我们需要确保初始值与服务端渲染时的值一致：

```typescript
// components/UserProfile.tsx
'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

/**
 * 带服务端预填充的用户资料组件
 *
 * 初始化策略：
 * 1. 优先使用props中的服务端数据
 * 2. 如果props为空，尝试从全局状态恢复
 * 3. 最后才从API获取
 */
function UserProfile({ serverUser }: { serverUser?: User }) {
  // 初始化状态：使用服务端传入的数据
  const [user, setUser] = useState<User | null>(serverUser || null);
  const [isLoading, setIsLoading] = useState(!serverUser);
  const [error, setError] = useState<string | null>(null);

  // 如果服务端没有数据，从其他地方恢复
  useEffect(() => {
    // 情况1：服务端已有数据，无需客户端加载
    if (serverUser) {
      setUser(serverUser);
      setIsLoading(false);
      return;
    }

    // 情况2：尝试从Redux/Zustand状态恢复
    const cachedUser = window.__INITIAL_STATE__?.user;
    if (cachedUser) {
      setUser(cachedUser);
      setIsLoading(false);
      return;
    }

    // 情况3：客户端从API获取
    async function fetchUser() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/user/current');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          setError('Failed to fetch user');
        }
      } catch (e) {
        setError('Network error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, [serverUser]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>Please log in</div>;

  return (
    <div className="user-profile">
      <img src={user.avatar || '/default-avatar.png'} alt={user.name} />
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}
```

### 3.2 Zustand状态恢复

Zustand是现代React应用中流行的状态管理库，其`persist`中间件可以与服务端状态无缝集成：

```typescript
// store/userStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * 用户状态管理
 *
 * 特点：
 * - 服务端预填充初始状态
 * - 客户端水合时合并状态
 * - 支持localStorage持久化
 */
interface UserState {
  // 状态字段
  user: User | null;
  token: string | null;
  preferences: UserPreferences;
  isAuthenticated: boolean;

  // 操作方法
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  logout: () => void;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: boolean;
}

/**
 * 创建带服务端预填充的store工厂函数
 */
function createUserStore(serverState?: Partial<UserState>) {
  return create<UserState>()(
    persist(
      (set, get) => ({
        // 服务端预填充的初始值
        user: serverState?.user || null,
        token: serverState?.token || null,
        preferences: serverState?.preferences || {
          theme: 'auto',
          language: 'zh-CN',
          notifications: true,
        },
        isAuthenticated: !!serverState?.user,

        // 操作方法
        setUser: (user) => set({ user, isAuthenticated: !!user }),

        setToken: (token) => set({ token }),

        updatePreferences: (prefs) =>
          set((state) => ({
            preferences: { ...state.preferences, ...prefs },
          })),

        logout: () =>
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          }),
      }),
      {
        name: 'user-storage', // localStorage key
        storage: createJSONStorage(() => localStorage),
        // 只持久化特定字段，敏感信息不持久化
        partialize: (state) => ({
          preferences: state.preferences,
          // token应该存在HttpOnly Cookie中，这里不持久化
        }),
        // 水合完成后的回调
        onRehydrateStorage: () => (state) => {
          console.log('User store hydrated from storage');
          // 可以在这里验证token是否过期
          if (state?.token) {
            validateToken(state.token).then((isValid) => {
              if (!isValid) {
                state.logout();
              }
            });
          }
        },
      }
    )
  );
}

// 客户端使用：尝试从脱水状态恢复
let userStore: ReturnType<typeof createUserStore>;

// SSR环境判断
if (typeof window !== 'undefined') {
  // 从window.__INITIAL_STATE__恢复服务端状态
  const serverUser = window.__INITIAL_STATE__?.user;
  userStore = createUserStore({
    user: serverUser,
    token: serverUser ? window.__INITIAL_STATE__?.token : null,
  });
} else {
  // 服务端环境
  userStore = createUserStore();
}

export { userStore };
```

### 3.3 Context初始化与水合

React Context在SSR场景下需要特别注意初始化和状态同步：

```typescript
// context/ThemeContext.tsx
'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

interface ThemeContextValue {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * 主题提供者组件
 *
 * SSR友好策略：
 * 1. 服务端使用默认主题（避免闪烁）
 * 2. 客户端挂载后从localStorage恢复用户偏好
 * 3. 使用useEffect确保只在客户端更新，避免水合不匹配
 */
function ThemeProvider({
  children,
  serverTheme = 'light',
}: {
  children: ReactNode;
  serverTheme?: 'light' | 'dark';
}) {
  // 初始化时使用服务端传入的主题
  const [theme, setTheme] = useState<'light' | 'dark'>(serverTheme);

  // 客户端挂载后从存储恢复用户偏好
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as
      | 'light'
      | 'dark'
      | null;

    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // 主题变更时同步到localStorage
  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 使用hook消费Context
function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

export { ThemeProvider, useTheme };
```

---

## 四、常见问题场景与解决方案

### 4.1 情景一：表单状态预填充

表单是SSR中最常见的场景之一。用户提交表单失败后，页面刷新时需要保留已填写的内容：

```typescript
// app/edit-post/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

interface PostFormData {
  title: string;
  content: string;
  category: string;
  tags: string[];
}

interface EditPostProps {
  serverPost?: Post; // 服务端预加载的文章数据
}

/**
 * 文章编辑表单组件
 *
 * 状态管理策略：
 * 1. 服务端预填充：首次加载时使用服务端数据
 * 2. 客户端缓存：编辑过程中使用本地状态
 * 3. 错误恢复：提交失败时保留用户输入
 */
function EditPostForm({ serverPost }: EditPostProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<PostFormData>({
    // 默认值使用服务端数据
    defaultValues: {
      title: serverPost?.title || '',
      content: serverPost?.content || '',
      category: serverPost?.category || 'uncategorized',
      tags: serverPost?.tags || [],
    },
  });

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // 监听表单变化，保存到sessionStorage（防止页面刷新丢失）
  const formValues = watch();
  useEffect(() => {
    // 防抖保存，避免频繁写入
    const timeout = setTimeout(() => {
      sessionStorage.setItem('post-form-draft', JSON.stringify(formValues));
    }, 500);

    return () => clearTimeout(timeout);
  }, [formValues]);

  // 页面加载时尝试恢复草稿
  useEffect(() => {
    const draft = sessionStorage.getItem('post-form-draft');
    if (draft && !serverPost) {
      try {
        const parsedDraft = JSON.parse(draft);
        // 只有在没有服务端数据时才恢复草稿
        Object.keys(parsedDraft).forEach((key) => {
          setValue(key as keyof PostFormData, parsedDraft[key]);
        });
      } catch (e) {
        // 忽略解析错误
      }
    }
  }, [serverPost, setValue]);

  const onSubmit = async (data: PostFormData) => {
    try {
      setSubmitError(null);
      const response = await fetch(`/api/posts/${serverPost?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '提交失败');
      }

      setSubmitSuccess(true);
      // 清除草稿
      sessionStorage.removeItem('post-form-draft');
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : '提交失败');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {submitSuccess && (
        <div className="alert success">保存成功！</div>
      )}

      {submitError && (
        <div className="alert error">{submitError}</div>
      )}

      <div className="form-group">
        <label htmlFor="title">标题</label>
        <input
          id="title"
          {...register('title', { required: '标题不能为空' })}
        />
        {errors.title && <span className="error">{errors.title.message}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="content">内容</label>
        <textarea
          id="content"
          {...register('content', { required: '内容不能为空' })}
        />
        {errors.content && (
          <span className="error">{errors.content.message}</span>
        )}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '保存中...' : '保存'}
      </button>
    </form>
  );
}
```

### 4.2 情景二：分页状态与URL同步

分页状态需要与URL同步，以便用户可以分享链接或使用浏览器前进后退功能：

```typescript
// components/PaginatedList.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface PaginatedListProps {
  initialData: ListResponse;
  baseUrl: string;
}

/**
 * 带分页的列表组件
 *
 * URL同步策略：
 * 1. 读取URL参数初始化状态
 * 2. 状态变化时更新URL（不触发页面刷新）
 * 3. 浏览器前进后退时响应URL变化
 */
function PaginatedList({ initialData, baseUrl }: PaginatedListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 从URL参数初始化分页状态
  const [data, setData] = useState<ListResponse>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  // 解析URL参数
  const currentPage = Number(searchParams.get('page')) || 1;
  const pageSize = Number(searchParams.get('size')) || 10;
  const sortBy = searchParams.get('sort') || 'createdAt';
  const sortOrder = searchParams.get('order') || 'desc';

  /**
   * 更新URL参数的辅助函数
   * 使用router.replace而非router.push，避免污染浏览器历史
   */
  const updateUrlParams = useCallback(
    (updates: Record<string, string | number>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });

      // 第一页时不显示page参数
      if (params.get('page') === '1') {
        params.delete('page');
      }

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

      router.replace(newUrl, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  // 分页操作
  const goToPage = (page: number) => {
    updateUrlParams({ page });
  };

  const changePageSize = (size: number) => {
    updateUrlParams({ size, page: 1 }); // 改变页大小时重置到第一页
  };

  const changeSort = (field: string) => {
    if (field === sortBy) {
      // 切换排序方向
      updateUrlParams({ sort: field, order: sortOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      updateUrlParams({ sort: field, order: 'desc' });
    }
  };

  // 当URL参数变化时重新获取数据
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          size: String(pageSize),
          sort: sortBy,
          order: sortOrder,
        });

        const response = await fetch(`${baseUrl}?${params}`);
        const newData = await response.json();
        setData(newData);
      } catch (e) {
        console.error('Failed to fetch data:', e);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [currentPage, pageSize, sortBy, sortOrder, baseUrl]);

  return (
    <div className="paginated-list">
      {/* 加载指示器 */}
      {isLoading && <div className="skeleton-loader">加载中...</div>}

      {/* 列表内容 */}
      <ul className="list">
        {data.items.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>

      {/* 分页控件 */}
      <div className="pagination">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          上一页
        </button>

        <span>
          第 {currentPage} / {data.totalPages} 页
        </span>

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= data.totalPages}
        >
          下一页
        </button>

        <select
          value={pageSize}
          onChange={(e) => changePageSize(Number(e.target.value))}
        >
          <option value={10}>10条/页</option>
          <option value={20}>20条/页</option>
          <option value={50}>50条/页</option>
        </select>
      </div>

      {/* 排序控件 */}
      <div className="sort-controls">
        <button onClick={() => changeSort('createdAt')}>
          按创建时间 {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button onClick={() => changeSort('name')}>
          按名称 {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
      </div>
    </div>
  );
}
```

### 4.3 情景三：搜索状态与实时同步

搜索功能需要处理输入、URL同步、防抖请求等多种状态：

```typescript
// components/SearchInterface.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import useSWR from 'swr';

interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  url: string;
}

/**
 * 搜索界面组件
 *
 * 状态管理架构：
 * 1. 输入状态：即时响应用户输入
 * 2. URL状态：同步到URL，支持分享和历史
 * 3. 搜索状态：通过SWR管理API请求和缓存
 * 4. 提交状态：追踪搜索操作历史
 */
function SearchInterface() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 从URL初始化搜索词
  const initialQuery = searchParams.get('q') || '';
  const initialFilter = searchParams.get('filter') || 'all';

  // 本地输入状态（实时响应用户输入，不触发搜索）
  const [inputValue, setInputValue] = useState(initialQuery);
  const [selectedFilter, setSelectedFilter] = useState(initialFilter);
  const [isSearching, setIsSearching] = useState(false);

  // 防抖定时器引用
  const debounceRef = useRef<NodeJS.Timeout>();

  /**
   * 搜索函数
   * 使用SWR自动管理数据获取和缓存
   */
  const searchQuery = initialQuery ? `${initialQuery}&filter=${initialFilter}` : null;
  const { data: results, error } = useSWR<{ items: SearchResult[] }>(
    searchQuery ? `/api/search?q=${encodeURIComponent(searchQuery)}` : null,
    (url) => fetch(url).then((r) => r.json()),
    {
      // 搜索结果缓存时间较短
      dedupingInterval: 0,
      // 手动控制何时重新验证
      revalidateOnFocus: false,
    }
  );

  /**
   * 更新URL的防抖搜索
   * 用户停止输入500ms后才更新URL并发起搜索
   */
  const debouncedSearch = useCallback(
    (query: string, filter: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (filter && filter !== 'all') params.set('filter', filter);

        const queryString = params.toString();
        router.push(queryString ? `?${queryString}` : '/', { scroll: false });

        setIsSearching(true);
      }, 500);
    },
    [router]
  );

  // 输入变化处理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedSearch(value, selectedFilter);
  };

  // 筛选变化处理
  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    debouncedSearch(inputValue, filter);
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // 搜索完成回调
  useEffect(() => {
    if (results !== undefined) {
      setIsSearching(false);
    }
  }, [results]);

  return (
    <div className="search-interface">
      {/* 搜索框 */}
      <div className="search-box">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="搜索..."
          className="search-input"
        />
        {isSearching && <div className="spinner" />}
      </div>

      {/* 筛选器 */}
      <div className="filters">
        {['all', 'articles', 'users', 'tags'].map((filter) => (
          <button
            key={filter}
            onClick={() => handleFilterChange(filter)}
            className={selectedFilter === filter ? 'active' : ''}
          >
            {filter === 'all' ? '全部' : filter}
          </button>
        ))}
      </div>

      {/* 搜索结果 */}
      <div className="results">
        {error && <div className="error">搜索失败，请重试</div>}
        {results?.items.map((item) => (
          <div key={item.id} className="result-item">
            <a href={item.url}>{item.title}</a>
            <p>{item.snippet}</p>
          </div>
        ))}
      </div>

      {/* 搜索历史 */}
      <SearchHistory
        onSelect={(query) => {
          setInputValue(query);
          debouncedSearch(query, selectedFilter);
        }}
      />
    </div>
  );
}

/**
 * 搜索历史组件
 * 从localStorage恢复历史记录
 */
function SearchHistory({
  onSelect,
}: {
  onSelect: (query: string) => void;
}) {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('search-history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      // 忽略解析错误
    }
  }, []);

  const clearHistory = () => {
    localStorage.removeItem('search-history');
    setHistory([]);
  };

  return (
    <div className="search-history">
      {history.length > 0 && (
        <>
          <div className="history-header">
            <span>搜索历史</span>
            <button onClick={clearHistory}>清除</button>
          </div>
          <ul>
            {history.map((item, index) => (
              <li key={index} onClick={() => onSelect(item)}>
                {item}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
```

### 4.4 情景四：购物车状态合并

购物车是一个复杂的场景，需要合并服务端数据、客户端缓存，并在冲突时提供合理的解决方案：

```typescript
// store/cartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  addedAt: number; // 时间戳，用于解决冲突
}

interface CartState {
  items: CartItem[];
  lastSyncedAt: number | null;

  // 操作方法
  addItem: (item: Omit<CartItem, 'id' | 'addedAt'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;

  // 同步相关
  syncWithServer: (serverCart: CartItem[]) => void;
  getMergedCart: (serverCart: CartItem[]) => CartItem[];
}

/**
 * 购物车状态管理
 *
 * 服务端/客户端数据合并策略：
 * 1. 服务端数据具有权威性（价格、库存等）
 * 2. 客户端有用户最新的操作意图
 * 3. 冲突解决规则：
 *    - 商品存在性：服务端决定
 *    - 数量：客户端优先（用户的最新意图）
 *    - 新增商品：服务端没有的视为新增
 *    - 删除商品：客户端没有的视为已删除
 */
const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      lastSyncedAt: null,

      addItem: (item) => {
        const { items } = get();
        const existingItem = items.find(
          (i) => i.productId === item.productId
        );

        if (existingItem) {
          // 更新已有商品数量
          set({
            items: items.map((i) =>
              i.id === existingItem.id
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          });
        } else {
          // 添加新商品
          const newItem: CartItem = {
            ...item,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            addedAt: Date.now(),
          };
          set({ items: [...items, newItem] });
        }
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== itemId),
        }));
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.id === itemId ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => {
        set({ items: [], lastSyncedAt: null });
      },

      /**
       * 与服务端数据同步
       * 执行智能合并
       */
      syncWithServer: (serverCart) => {
        set({
          items: get().getMergedCart(serverCart),
          lastSyncedAt: Date.now(),
        });
      },

      /**
       * 合并购物车的核心算法
       * @param serverCart 服务端购物车数据
       * @returns 合并后的购物车
       */
      getMergedCart: (serverCart) => {
        const { items: localItems } = get();

        // 构建服务端商品Map（以productId为键）
        const serverMap = new Map(
          serverCart.map((item) => [item.productId, item])
        );

        // 构建本地商品Map
        const localMap = new Map(
          localItems.map((item) => [item.productId, item])
        );

        const mergedItems: CartItem[] = [];

        // 遍历服务端商品
        for (const serverItem of serverCart) {
          const localItem = localMap.get(serverItem.productId);

          if (localItem) {
            // 商品在两端都存在：使用服务端的权威数据，但采用本地数量
            // 原因：用户可能在多个标签页操作，数量是用户的最新意图
            mergedItems.push({
              ...serverItem,
              id: localItem.id, // 保留本地ID以保持UI稳定性
              quantity: localItem.quantity,
              addedAt: localItem.addedAt,
            });
            serverMap.delete(serverItem.productId);
          } else {
            // 商品只在服务端存在：保留
            mergedItems.push(serverItem);
          }
        }

        // 服务端没有但本地有的：这些是"离线添加"的商品
        // 需要验证商品是否仍然有效
        for (const localItem of localItems) {
          if (!serverMap.has(localItem.productId)) {
            // 标记为需要服务端验证
            // 实际项目中应该调用API验证商品状态
            console.warn(
              `Product ${localItem.productId} not found on server, needs validation`
            );
            // 这里我们暂时保留，但标记为未验证
            mergedItems.push({
              ...localItem,
              // 可以添加标记：isVerified: false
            });
          }
        }

        return mergedItems;
      },
    }),
    {
      name: 'shopping-cart',
      // 只持久化items，不持久化lastSyncedAt
      partialize: (state) => ({ items: state.items }),
    }
  )
);

export default useCartStore;
```

---

## 五、数据获取策略对比

### 5.1 CSR（客户端渲染）

传统的客户端渲染模式，所有数据获取都在浏览器中完成：

```typescript
// CSR模式示例
'use client';

import { useState, useEffect } from 'react';

function ClientRenderedPage({ initialData }: { initialData?: any }) {
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(!initialData);

  useEffect(() => {
    if (!initialData) {
      fetch('/api/data')
        .then((r) => r.json())
        .then((result) => {
          setData(result);
          setIsLoading(false);
        });
    }
  }, [initialData]);

  if (isLoading) return <div>Loading...</div>;

  return <div>{/* render data */}</div>;
}
```

### 5.2 SSR（服务端渲染）

服务端获取数据，首屏即可展示完整内容：

```typescript
// app/dashboard/page.tsx (Next.js App Router)
// 这是服务端组件，数据获取在服务端完成
async function DashboardPage() {
  // 并行获取多个数据源
  const [userData, statsData, notificationsData] = await Promise.all([
    fetchUserData(),
    fetchStatsData(),
    fetchNotificationsData(),
  ]);

  return (
    <Dashboard
      user={userData}
      stats={statsData}
      notifications={notificationsData}
    />
  );
}
```

### 5.3 SSG（静态站点生成）

构建时获取数据，部署后内容固定：

```typescript
// app/blog/[slug]/page.tsx
// 静态生成所有博客文章
export async function generateStaticParams() {
  const posts = await fetchAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// 构建时调用，之后不再变化
async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await fetchPostBySlug(params.slug);
  return <Article post={post} />;
}
```

### 5.4 混合策略：最佳实践

现代应用通常需要混合使用多种数据获取策略：

```typescript
// app/product/[id]/page.tsx
// 混合策略：SSG + ISR + 客户端更新

import { Suspense } from 'react';

// 第一层：静态生成产品列表页（SSG）
export async function generateStaticParams() {
  const products = await fetchTopProducts();
  return products.map((p) => ({ id: p.id }));
}

// 第二层：服务端获取产品详情（可选SSR/ISR）
async function ProductDetails({ id }: { id: string }) {
  // 设置较长的重新验证时间（1小时）
  const product = await fetchProduct(id, {
    next: { revalidate: 3600 },
  });

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      {/* 动态内容由客户端获取 */}
      <ClientPriceDisplay productId={id} basePrice={product.price} />
      <ClientReviews productId={id} />
      <ClientStockStatus productId={id} />
    </div>
  );
}

// 第三层：客户端获取实时数据
function ClientPriceDisplay({
  productId,
  basePrice,
}: {
  productId: string;
  basePrice: number;
}) {
  const [price, setPrice] = useState(basePrice);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    // WebSocket连接获取实时价格
    const ws = new WebSocket(`wss://api.example.com/prices/${productId}`);
    ws.onmessage = (event) => {
      const { price } = JSON.parse(event.data);
      setPrice(price);
      setIsLive(true);
    };

    return () => ws.close();
  }, [productId]);

  return (
    <div>
      <span className={isLive ? 'live' : ''}>
        ¥{price.toFixed(2)}
      </span>
      {isLive && <span className="live-indicator">实时价格</span>}
    </div>
  );
}

// 第四层：Suspense处理加载状态
export default function Page({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductDetails id={params.id} />
    </Suspense>
  );
}
```

---

## 六、面试高频问题

### 问题一：如何在SSR后保持客户端状态？

**参考答案**：

SSR后保持客户端状态主要通过"脱水/水合"机制实现：

1. **服务端脱水**：在HTML中嵌入序列化后的状态
   ```html
   <script type="application/json" id="__STATE__">
     {"user":{"name":"张三","email":"zhang@example.com"}}
   </script>
   ```

2. **客户端水合**：从DOM中读取状态并初始化Store
   ```typescript
   const preloadedState = JSON.parse(
     document.getElementById('__STATE__')?.textContent || '{}'
   );
   const store = createStore(preloadedState);
   ```

3. **常见问题处理**：
   - **水合不匹配**：确保服务端渲染的HTML与客户端初始渲染完全一致
   - **敏感数据**：不要在脱水状态中包含密码、Token等敏感信息
   - **大型状态**：对于大型状态，考虑分块加载或延迟水合

### 问题二：window.__STATE__和脱水有什么区别？

**参考答案**：

这两个概念紧密相关，但侧重点不同：

| 概念 | 侧重点 | 说明 |
|------|--------|------|
| `window.__STATE__` | 技术实现 | 一种具体的状态传递方式，通过全局变量注入 |
| 脱水（Deduplication） | 设计理念 | 避免重复请求的整体策略，__STATE__是实现手段之一 |

**脱水的完整流程**：

```
服务端:
  1. fetch('/api/user') → 获取用户数据
  2. 创建Redux Store → state = { user: {...} }
  3. renderToString(<App />) → 生成HTML
  4. 脱水: JSON.stringify(state) → 嵌入HTML

客户端:
  1. 解析HTML
  2. 提取脱水状态
  3. 水合: createStore(preloadedState)
  4. hydrateRoot(<App />) → 恢复交互
```

### 问题三：如何处理服务端和客户端数据不一致？

**参考答案**：

服务端和客户端数据不一致是常见问题，需要从多个层面处理：

1. **预防策略**：
   - 使用服务端权威数据作为初始值
   - 避免在服务端和客户端使用不同的数据源
   - 使用统一的API层

2. **检测策略**：
   - 实现水合不匹配警告（React默认会警告）
   - 使用`suppressHydrationWarning`处理预期的不一致
   - 添加开发时的一致性检查

3. **解决策略**：

```typescript
function UserProfile({ serverUser }) {
  const [user, setUser] = useState(serverUser);

  // 客户端重新验证数据
  useEffect(() => {
    async function validateData() {
      const clientUser = await fetch('/api/user/current').then(r => r.json());

      // 比较服务端和客户端数据
      if (JSON.stringify(clientUser) !== JSON.stringify(serverUser)) {
        // 数据不一致，更新到最新
        setUser(clientUser);
      }
    }

    validateData();
  }, [serverUser]);

  return <div>{user.name}</div>;
}
```

4. **业务策略**：
   - 购物车：合并策略，以服务端为基准
   - 用户偏好：客户端优先（个性化数据）
   - 实时数据：客户端优先（如价格、库存）

### 问题四：Redux在SSR中如何使用？

**参考答案**：

Redux在SSR中的使用需要特别注意Store的创建和管理：

**服务端Store创建**：

```typescript
// 创建独立的Store实例（每个请求一个）
export function createServerStore(req: Request) {
  const preloadedState = {
    // 从请求中恢复状态（如Cookie中的Session）
    auth: parseAuthFromCookie(req.headers.cookie),
    // 服务端预加载的数据
    products: await fetchProductsFromDatabase(),
  };

  return configureStore({
    reducer: rootReducer,
    preloadedState,
    // 服务端不使用 thunk middleware 的某些特性
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false, // 禁用序列化检查（可能有Date对象）
      }),
  });
}
```

**客户端Store水合**：

```typescript
// 从脱水状态恢复
const preloadedState = window.__INITIAL_STATE__;

export const store = configureStore({
  reducer: rootReducer,
  preloadedState, // 关键：使用脱水状态
});

// 可选：验证脱水状态与当前Store的一致性
if (process.env.NODE_ENV === 'development') {
  const state = store.getState();
  // 比较脱水前后的状态是否一致
  console.assert(
    deepEqual(state, preloadedState),
    'Hydration state mismatch'
  );
}
```

**关键注意事项**：

1. **每个请求创建新Store**：避免状态污染
2. **脱水序列化**：Date、Error等对象需要特殊处理
3. **异步数据**：使用` redux-thunk`或`redux-saga`处理异步action
4. **持久化状态**：如localStorage数据，需要水合后手动恢复

---

## 七、总结

React状态初始化与脱水技术是全栈开发中的核心技能。通过本文的学习，你应该掌握：

1. **脱水原理**：理解服务端状态序列化和HTML嵌入的机制
2. **水合恢复**：掌握从DOM提取状态并恢复组件的方法
3. **状态管理集成**：学会在Redux、Zustand等状态管理库中实现SSR支持
4. **场景解决方案**：能够处理表单、分页、搜索、购物车等常见场景
5. **数据获取策略**：根据业务需求选择CSR、SSR、SSG或混合策略

在实际项目中，状态初始化和脱水是确保SSR应用正确运行的关键。记住以下最佳实践：

- 服务端数据优先：使用服务端权威数据作为初始状态
- 避免水合不匹配：确保服务端和客户端渲染结果一致
- 安全注入：对脱水状态进行转义，防止XSS攻击
- 渐进增强：确保在禁用JavaScript的环境中页面仍能正常展示

掌握这些技术，你将能够构建出高性能、用户体验优秀的React全栈应用。
