# Next.js 项目源码研读教程

## 概述

本教程基于 FastDocument 项目的真实代码，帮助你系统化地学习 Next.js 16 + React 19 的全栈开发。教程采用**三步研读法**，从整体架构到核心模块，再到高级特性，循序渐进。

---

## 学习路径图

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 源码研读学习路径                    │
└─────────────────────────────────────────────────────────────┘
                              │
    ┌─────────────────────────┼─────────────────────────┐
    ▼                         ▼                         ▼
┌─────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  第一步      │      │  第二步          │      │  第三步          │
│  整体架构    │ ──▶  │  核心模块        │ ──▶  │  高级特性        │
│  (1-2天)   │      │  (3-5天)        │      │  (2-3天)        │
└─────────────┘      └─────────────────┘      └─────────────────┘
    │                         │                         │
    ▼                         ▼                         ▼
  项目入口分析            数据层研读                  性能优化
  路由系统研读           组件层研读                  SEO优化
  配置分析               工具层研读                  部署CI/CD
```

---

## 第一章：项目概览

### 1.1 项目结构总览

```
FastDocument/
├── frontend/                    # Next.js 前端
│   ├── src/
│   │   ├── app/               # App Router 页面
│   │   │   ├── layout.tsx    # 根布局
│   │   │   ├── page.tsx      # 主页面
│   │   │   ├── login/        # 登录页
│   │   │   └── share/        # 分享页
│   │   │
│   │   ├── components/        # React 组件
│   │   │   ├── Editor.tsx    # 编辑器
│   │   │   ├── Dashboard.tsx # 仪表板
│   │   │   └── ...
│   │   │
│   │   ├── store/             # Zustand 状态
│   │   │   ├── documentStore.ts
│   │   │   └── ...
│   │   │
│   │   └── lib/               # 工具函数
│   │       ├── api.ts         # API 客户端
│   │       ├── socket.ts      # WebSocket
│   │       └── livekit.ts     # 视频会议
│   │
│   ├── package.json           # 依赖配置
│   ├── next.config.ts        # Next.js 配置
│   └── tsconfig.json         # TypeScript 配置
│
└── backend/                    # NestJS 后端
    ├── src/
    │   ├── documents/         # 文档模块
    │   ├── auth/             # 认证模块
    │   └── ...
    └── package.json
```

### 1.2 技术栈清单

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js | 16.1.6 |
| UI | React | 19.2.3 |
| 状态 | Zustand | 5.0.11 |
| 样式 | Tailwind CSS | 4 |
| 组件 | Ant Design | 6.3.0 |
| 后端 | NestJS | 11.x |
| 数据库 | PostgreSQL | - |

### 1.3 研读准备

**环境配置**：

```bash
# 1. 克隆项目
git clone <fastdocument-repo>
cd FastDocument

# 2. 安装前端依赖
cd frontend
npm install

# 3. 启动开发服务器
npm run dev
# 访问 http://localhost:13000
```

**工具准备**：
- VS Code + 扩展：ESLint、Prettier、Tailwind CSS IntelliSense
- Chrome DevTools + React Developer Tools
- Postman / Insomnia（API 测试）

---

## 第二章：整体架构研读

### 2.1 入口文件分析

#### 研读文件：`app/layout.tsx`

**文件路径**：`frontend/src/app/layout.tsx`

**研读步骤**：

1. **打开文件，逐行注释**

```typescript
// 第1行：导入 Next.js Metadata 类型
import type { Metadata } from "next";

// 第2行：导入 Ant Design 注册表
import { AntdRegistry } from "@ant-design/nextjs-registry";

// 第3行：导入 Ant Design 组件
import { ConfigProvider, App as AntApp } from "antd";

// 第4行：导入主题提供者
import { ThemeProvider } from "@/components/ThemeProvider";

// 第5行：导入全局样式
import "./globals.css";

// 第7-10行：导出静态 Metadata（SEO 配置）
export const metadata: Metadata = {
  title: "FastDocument - Collaborative Productivity",
  description: "Atomic, semantic, convenient, efficient online document editing.",
};

// 第12-16行：根布局组件定义
export default function RootLayout({
  children,  // 接收页面内容
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 返回 JSX 结构
  return (
    <html lang="en">
      <head>
        {/* Google Fonts 字体加载 */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans..."
        />
      </head>
      <body>
        {/* Ant Design SSR 注册表 */}
        <AntdRegistry>
          {/* 主题提供者 */}
          <ThemeProvider>
            {/* Ant Design 配置提供者 */}
            <ConfigProvider theme={{...}}>
              {/* Ant Design App 包装器 */}
              <AntApp>
                {/* 页面内容 */}
                {children}
              </AntApp>
            </ConfigProvider>
          </ThemeProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
```

2. **理解根组件结构**

```
RootLayout
├── html (lang="en")
├── head
│   └── Google Fonts Link
└── body
    └── AntdRegistry
        └── ThemeProvider
            └── ConfigProvider
                └── AntApp
                    └── children (页面内容)
```

3. **分析数据流入口**

- **静态数据**：通过 `metadata` 导出定义
- **运行时数据**：通过 Providers 注入
- **客户端状态**：通过 Context 提供

**关键问题**：

- Q: 为什么需要 `AntdRegistry`？
- A: Ant Design 需要服务端渲染支持，注册表确保 SSR 正确处理样式

- Q: 主题如何传递到子组件？
- A: 通过 `ThemeProvider` Context 提供

**练习**：

1. 修改布局，添加全局 Header
2. 更改主题色配置
3. 添加新的字体

---

### 2.2 路由系统分析

#### 研读文件：`app/page.tsx`

**文件路径**：`frontend/src/app/page.tsx`

**研读步骤**：

1. **分析路由结构**

```
app/
├── page.tsx                 # / 路由
├── login/
│   └── page.tsx            # /login 路由
└── share/
    └── [code]/
        └── page.tsx        # /share/:code 路由
```

2. **分析主页面组件**

```typescript
// 第1行："use client" 标记客户端组件
"use client";

// 导入组件
import { Sidebar } from "@/components/Sidebar";
import { Editor } from "@/components/Editor";
// ...

// 导入状态管理
import { useDocumentStore, Block } from "@/store/documentStore";

// 导入 Next.js 路由
import { useSearchParams, useRouter } from "next/navigation";

// 第25-50行：认证检查组件
function AuthCheck({ children }) {
  // 1. 获取路由和状态
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  // 2. 初始化检查
  useEffect(() => {
    setIsReady(true);
  }, []);

  // 3. 检查登录状态
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  if (!token || !userStr) {
    // 未登录，跳转到登录页
    router.push("/login");
    return null;
  }

  return <>{children}</>;
}

// 第55-189行：主内容组件
function HomeContent() {
  // 状态定义
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 从 URL 参数获取文档 ID
  const searchParams = useSearchParams();
  const docId = searchParams.get("doc");

  // 页面切换逻辑
  const handleNavigate = (page) => {
    if (["dashboard", "all", ...].includes(page)) {
      setCurrentPage(page);
    } else {
      // 文档 ID
      fetchDocument(page);
      setCurrentPage("editor");
    }
  };

  // 条件渲染
  switch (currentPage) {
    case "editor": return <Editor />;
    case "meeting": return <VideoConference />;
    // ...
    default: return <Dashboard />;
  }
}

// 第243-251行：根页面导出
export default function Home() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthCheck>
        <HomeContent />
      </AuthCheck>
    </Suspense>
  );
}
```

3. **理解路由导航模式**

**关键模式**：
- **URL 参数驱动**：`?doc=xxx` 触发文档加载
- **状态切换**：使用 `useState` 而非路由切换
- **客户端渲染**：整个页面是客户端组件

**关键问题**：

- Q: 为什么使用 URL 参数而非动态路由？
- A: SPA 模式，单页面内切换视图

- Q: 为什么使用 "use client"？
- A: 需要使用 hooks (useState, useEffect) 和浏览器 API

**练习**：

1. 将 URL 参数改为动态路由 `/editor/[docId]`
2. 添加页面切换的过渡动画
3. 实现浏览器历史记录支持

---

### 2.3 配置文件研读

#### 研读文件：`next.config.ts`

```typescript
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // SASS 配置
  sassOptions: {
    includePaths: [path.join(__dirname, "src")],
  },
  // 使用 Turbopack（Next.js 16）
  turbopack: {},
};

export default nextConfig;
```

**研读要点**：

1. **路径别名**：通过 tsconfig.json 配置 `@/*`
2. **构建工具**：使用 Turbopack（比 webpack 快）
3. **配置极简**：依赖 Next.js 默认配置

**练习**：

1. 添加图片优化配置
2. 配置环境变量
3. 添加重写规则

---

## 第三章：核心模块深度研读

### 3.1 数据层研读

#### 研读文件：`lib/api.ts`

**文件路径**：`frontend/src/lib/api.ts`

**研读任务**：

1. **分析 API 客户端设计**

```typescript
// Axios 实例配置
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555',
  timeout: 10000,
});

// 请求拦截器 - 添加 Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 - 错误处理
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

2. **API 设计模式**

- 基础方法：`get`, `post`, `put`, `delete`
- 认证 Token 自动注入
- 401 自动跳转登录
- 统一错误处理

#### 研读文件：`store/documentStore.ts`

**研读任务**：

1. **Zustand Store 设计**

```typescript
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// 定义状态接口
interface DocumentState {
  documents: Document[];
  currentDoc: Document | null;
  blocks: Block[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchDocument: (id: string) => Promise<void>;
  createDocument: (title: string) => Promise<string>;
  addBlock: (block: Block) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
}

// 创建 Store
export const useDocumentStore = create<DocumentState>()(
  persist(
    (set, get) => ({
      documents: [],
      currentDoc: null,
      blocks: [],
      loading: false,
      error: null,

      // 异步 Action
      fetchDocument: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/documents/${id}`);
          const doc = await response.json();
          set({ currentDoc: doc, blocks: doc.blocks || [], loading: false });
        } catch (error) {
          set({ error: error.message, loading: false });
        }
      },

      // 同步 Action
      addBlock: (block) => set((state) => ({
        blocks: [...state.blocks, block]
      })),
    }),
    {
      name: 'document-storage',  // localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

2. **数据流完整路径**

```
用户操作
    │
    ▼
useDocumentStore.action()
    │
    ├── 同步：直接更新状态
    │
    └── 异步：API 调用 → 更新状态
              │
              ▼
         组件重新渲染
```

**关键问题**：

- Q: 为什么使用 Zustand 而非 Redux？
- A: API 简洁、无 Provider 嵌套、TypeScript 友好

- Q: persist 中间件的作用？
- A: 自动将状态保存到 localStorage

**练习**：

1. 添加文档列表获取功能
2. 实现乐观更新
3. 添加缓存逻辑

---

### 3.2 组件层研读

#### 研读文件：`components/Editor.tsx`

**文件路径**：`frontend/src/components/Editor.tsx`

**研读任务**：

1. **分析编辑器组件结构**

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { useDocumentStore } from "@/store/documentStore";
import { BlockComponent } from "./blocks/BlockComponent";

export function Editor() {
  // 本地状态
  const [selection, setSelection] = useState<string | null>(null);

  // 全局状态
  const { blocks, addBlock, updateBlock, removeBlock } = useDocumentStore();

  // 处理块操作
  const handleBlockUpdate = useCallback((id, content) => {
    updateBlock(id, { content });
  }, [updateBlock]);

  // 渲染块列表
  return (
    <div className="editor-container">
      {blocks.map((block) => (
        <BlockComponent
          key={block.id}
          block={block}
          onUpdate={handleBlockUpdate}
          onSelect={() => setSelection(block.id)}
          isSelected={selection === block.id}
        />
      ))}
    </div>
  );
}
```

2. **组件设计模式**

- **单向数据流**：Store → 组件 → 用户操作 → Store
- **Props 传递**：父组件传子组件
- **状态提升**：共享状态提升到 Store
- **性能优化**：`useCallback` 缓存回调

**关键问题**：

- Q: 为什么使用 "use client"？
- A: 需要使用 useState、useEffect 等 Hooks

- Q: 如何处理编辑器性能？
- A: 使用 `React.memo` 包装子组件、使用虚拟列表

**练习**：

1. 添加块拖拽排序功能
2. 实现撤销/重做功能
3. 添加协作光标显示

---

### 3.3 工具层研读

#### 研读文件：`lib/socket.ts`

**文件路径**：`frontend/src/lib/socket.ts`

**研读任务**：

1. **WebSocket 客户端实现**

```typescript
import { io, Socket } from "socket.io-client";

class SocketClient {
  private socket: Socket | null = null;
  private documentId: string | null = null;

  connect(documentId: string) {
    this.documentId = documentId;
    this.socket = io('/collaboration', {
      query: { documentId }
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('block:update', (data) => {
      // 处理远程块更新
    });

    this.socket.on('cursor:move', (data) => {
      // 处理远程光标移动
    });
  }

  emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const socketClient = new SocketClient();
```

2. **实时协作原理**

```
用户A 编辑 ──▶ Socket ──▶ 服务器 ──▶ Socket ──▶ 用户B
     │                                                  │
     ◀────────────────────────────────────────────────┘
                    广播更新
```

**练习**：

1. 添加断线重连逻辑
2. 实现操作转换（OT）
3. 添加离线编辑支持

---

## 第四章：高级特性研读

### 4.1 性能优化研读

#### 研读文件：`lib/browser-optimization.ts`

**研读内容**：

1. **代码分割**

```typescript
// 动态导入
const Editor = dynamic(() => import('@/components/Editor'), {
  loading: () => <EditorSkeleton />,
  ssr: false  // 客户端渲染
});
```

2. **虚拟列表**

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualBlockList({ blocks }) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: blocks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ height: '100vh', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <BlockComponent
            key={virtualItem.key}
            style={{ position: 'absolute', top: virtualItem.start }}
            block={blocks[virtualItem.index]}
          />
        ))}
      </div>
    </div>
  );
}
```

3. **性能监控**

```typescript
import { usePerformance } from '@/lib/usePerformance';

function MyComponent() {
  const { measure, mark } = usePerformance();

  useEffect(() => {
    mark('component-mount');
    // 执行逻辑
    measure('component-mount', 'component-render');
  }, []);
}
```

**练习**：

1. 实现块级虚拟化
2. 添加性能指标上报
3. 优化首屏加载

---

### 4.2 SEO 优化研读

#### 研读文件：`app/share/[code]/page.tsx`

**研读内容**：

1. **动态 Metadata**

```typescript
import { Metadata } from 'next';

interface Props {
  params: { code: string };
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const document = await fetchDocument(params.code);

  return {
    title: `${document.title} - FastDocument`,
    description: document.content.slice(0, 160),
    openGraph: {
      title: document.title,
      description: document.content.slice(0, 160),
      images: document.thumbnail ? [document.thumbnail] : [],
    },
  };
}
```

2. **结构化数据**

```typescript
export default async function SharePage({ params }) {
  const document = await fetchDocument(params.code);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: document.title,
    content: document.content,
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* 内容 */}
    </article>
  );
}
```

**练习**：

1. 添加更多 OpenGraph 标签
2. 实现 JSON-LD 结构化数据
3. 添加站点地图

---

### 4.3 部署与 CI/CD

#### 研读文件：`docker-compose.yml`

**研读内容**：

```yaml
services:
  frontend:
    build: ./frontend
    ports:
      - "13000:13000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:5555

  backend:
    build: ./backend
    ports:
      - "5555:5555"
    environment:
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://...

  postgres:
    image: postgres:15

  redis:
    image: redis:7
```

**部署流程**：

```
代码提交 ──▶ GitHub Actions ──▶ 构建镜像 ──▶ 推送到仓库
                                              │
                                              ▼
                                        部署到服务器
                                              │
                                              ▼
                                        Docker Compose
```

**练习**：

1. 添加健康检查端点
2. 配置 CI/CD 流程
3. 实现蓝绿部署

---

## 第五章：实战演练

### 5.1 完整功能开发

**任务**：为编辑器添加评论功能

**步骤**：

1. **设计数据模型**

```typescript
interface Comment {
  id: string;
  blockId: string;
  userId: string;
  content: string;
  createdAt: number;
}
```

2. **创建 API 路由**

```typescript
// app/api/comments/route.ts
export async function POST(request: Request) {
  const comment = await request.json();
  const saved = await db.comments.create(comment);
  return Response.json(saved);
}
```

3. **创建 Store**

```typescript
interface CommentState {
  comments: Record<string, Comment[]>;
  addComment: (blockId: string, content: string) => Promise<void>;
}
```

4. **创建 UI 组件**

```typescript
function CommentButton({ blockId }) {
  const { addComment } = useCommentStore();

  return (
    <button onClick={() => addComment(blockId, 'New comment')}>
      添加评论
    </button>
  );
}
```

### 5.2 项目重构

**任务**：将页面从 URL 参数迁移到动态路由

**步骤**：

1. 分析现有代码
2. 设计重构方案
3. 实施重构
4. 测试验证

---

## 附录：研读工具和技巧

### 1. 调试技巧

```typescript
// 添加断点调试
debugger;

// 打印详细信息
console.log('State:', JSON.stringify(state, null, 2));

// React DevTools
// 安装 React Developer Tools 扩展
// 在 Components 面板查看组件树和 props
```

### 2. 代码分析工具

```bash
# 类型检查
npx tsc --noEmit

# ESLint 检查
npm run lint

# 构建分析
npm run build && npx @next/bundle-analyzer
```

### 3. 学习资源

- [Next.js 官方文档](https://nextjs.org/docs)
- [React 官方文档](https://react.dev)
- [Zustand 文档](https://docs.pmnd.rs/zustand)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
