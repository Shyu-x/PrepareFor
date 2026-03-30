# FastDocument 项目技术栈深度认证分析报告

## 一、项目概述

FastDocument 是一个现代化的文档协作平台，采用原子化设计理念，支持文档编辑、知识库管理、项目管理、视频会议等功能。项目采用前后端分离架构。

---

## 二、技术栈清单（第一层：基础技术栈识别）

### 2.1 前端技术栈

| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **框架** | Next.js | 16.1.6 | 核心框架 |
| **UI库** | React | 19.2.3 | UI 构建 |
| **语言** | TypeScript | ^5 | 类型系统 |
| **状态管理** | Zustand | 5.0.11 | 全局状态 |
| **样式** | Tailwind CSS | ^4 | 样式方案 |
| **组件库** | Ant Design | ^6.3.0 | UI 组件 |
| **动画** | Framer Motion | 12.34.3 | 动画效果 |
| **HTTP** | Axios | ^1.13.5 | 网络请求 |
| **WebSocket** | Socket.io Client | 4.8.3 | 实时通信 |
| **视频** | LiveKit Client | 2.17.2 | 视频会议 |
| **表单** | React Hook Form | 7.71.2 | 表单处理 |
| **构建** | Turbopack | (Next.js 内置) | 开发构建 |
| **测试** | Playwright | ^1.58.2 | E2E 测试 |
| **测试** | Vitest | ^4.0.18 | 单元测试 |

### 2.2 后端技术栈

| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **框架** | NestJS | 11.x | 核心框架 |
| **数据库** | PostgreSQL | - | 主数据库 |
| **ORM** | TypeORM | 0.3.28 | 数据库操作 |
| **缓存** | Redis (ioredis) | ^5.9.3 | 缓存层 |
| **WebSocket** | Socket.io | 4.8.3 | 实时通信 |
| **视频** | LiveKit Server SDK | 2.15.0 | 视频服务 |
| **认证** | Passport + JWT | - | 用户认证 |
| **验证** | class-validator | 0.14.3 | DTO 验证 |
| **安全** | bcrypt | ^6.0.0 | 密码加密 |
| **限流** | express-rate-limit | ^8.0.0 | API 限流 |

---

## 三、架构模式认证（第二层）

### 3.1 路由系统详解

**认证结果：App Router（Next.js 16）**

#### 3.1.1 项目路由结构

```
app/
├── layout.tsx              # 根布局（服务端组件）
├── page.tsx               # 主页面（客户端组件）
├── globals.css             # 全局样式
├── login/
│   └── page.tsx            # 登录页（/login）
└── share/
    └── [code]/
        └── page.tsx        # 分享页（/share/:code）
```

#### 3.1.2 根布局组件（RootLayout）

`src/app/layout.tsx` - 服务端组件，负责全局配置：

```typescript
import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider, App as AntApp } from "antd";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "FastDocument - Collaborative Productivity",
  description: "Atomic, semantic, convenient, efficient online document editing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
        />
      </head>
      <body>
        <AntdRegistry>
          <ThemeProvider>
            <ConfigProvider
              theme={{
                token: {
                  colorPrimary: "#0D9488",  // 主题色
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  borderRadius: 8,
                },
              }}
            >
              <AntApp>
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

**关键特性：**
- **服务端组件**：直接在服务端渲染，无需 `"use client"`
- **AntdRegistry**：解决 Ant Design 在 Next.js 中的 SSR 样式问题
- **ThemeProvider**：管理深色/浅色主题
- **ConfigProvider**：配置 Ant Design 全局主题

#### 3.1.3 主页面组件（Home）

`src/app/page.tsx` - 客户端组件，负责页面路由和内容渲染：

```typescript
"use client";

import { Sidebar } from "@/components/Sidebar";
import { Editor } from "@/components/Editor";
import { Dashboard } from "@/components/Dashboard";
import { VideoConference } from "@/components/VideoConference";
import { useSearchParams, useRouter } from "next/navigation";

/**
 * 内容组件 - 使用 useSearchParams 监听 URL 参数
 */
function HomeContent() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const searchParams = useSearchParams();

  // 监听 URL 参数变化，自动加载文档
  useEffect(() => {
    const docId = searchParams.get("doc");
    if (docId) {
      fetchDocument(docId);
      setCurrentPage("editor");
    }
  }, [searchParams]);

  // 渲染页面内容
  const renderContent = = () => {
    switch (currentPage) {
      case "editor":
        return <Editor />;
      case "meeting":
        return <VideoConference />;
      default:
        return <Dashboard category={currentPage} />;
    }
    };
  };

  return (
    <main className="min-h-[100dvh]">
      <Sidebar onNavigate={handleNavigate} />
      <div>
        <Header />
        <AnimatePresence mode="popLayout">
          <motion.div key={currentPage}>
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

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

**路由特点：**
- **URL 参数驱动**：通过 `?doc=xxx` 切换到编辑器
- **状态管理**：使用 `useState` 管理当前页面
- **动画过渡**：使用 Framer Motion 的 `AnimatePresence` 实现页面切换动画
- **认证检查**：`AuthCheck` 组件检查用户登录状态

#### 3.1.4 动态路由示例

`src/app/share/[code]/page.tsx` - 动态路由页面：

```typescript
import { Metadata } from "next";
import { notFound } from "next/navigation";

interface Props {
  params: { code: string };
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  // 根据分享代码获取文档信息
  const document = await fetchDocumentByShareCode(params.code);

  return {
    title: `${document.title} - FastDocument`,
    description: document.content.slice(0, 160),
  };
}

export default async function SharePage({ params }: Props) {
  const document = await fetchDocumentByShareCode(params.code);

  if (!document) {
    notFound();
  }

  return (
    <div>
      <h1>{document.title}</h1>
      <p>{document.content}</p>
    </div>
  );
}
```

**动态路由特性：**
- `[code]` 作为动态参数
- `generateMetadata` 生成动态 SEO 元数据
- 服务端组件直接获取数据

### 3.2 数据流模式详解

**认证结果：Zustand + URL 驱动**

#### 3.2.1 Zustand Store 架构

FastDocument 使用 Zustand 作为全局状态管理方案，采用原子化设计理念。

**核心 Store 结构（store/documentStore.ts）：**

```typescript
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * 文档块接口定义
 */
export interface Block {
  id: string;                    // 唯一标识符
  type: BlockType;                // 块类型
  content: string;                // 块内容
  properties?: BlockProperties;     // 块属性
  order?: number;                  // 排序
}

/**
 * 块类型定义
 */
export type BlockType = "text" | "h1" | "h2" | "h3" | "todo" | "callout" | "divider" | "code" | "image" | "table" | "mindmap" | "flowchart" | "math" | "quote";

/**
 * 文档状态管理接口
 */
interface DocumentState {
  // 核心数据
  id: string;                                      // 文档 ID
  title: string;                                    // 文档标题
  blocks: Block[];                                  // 所有的文档块
  isSaving: boolean;                                // 是否正在保存
  isOnline: boolean;                                // 后端连接状态
  onlineUsers: { id: string; name: string }[];      // 在线用户列表
  typingUsers: Record<string, string>;              // 正在输入的用户

  // UI 状态
  selectedBlockId: string | null;                   // 当前选中的块 ID
  focusedBlockId: string | null;                   // 当前聚焦的块 ID

  // 撤销/重做历史
  history: { blocks: Block[]; title: string }[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;

  // 核心数据拉取与管理
  fetchDocument: (id: string) => Promise<void>;
  fetchDocuments: () => Promise<any[]>;
  createDocument: (title: string, parentId?: string, type?: string, blocks?: Block[]) => Promise<string>;

  // 块级操作方法
  updateBlock: (id: string, content: string, properties?: Block["properties"], type?: Block["type"]) => void;
  remoteUpdateBlock: (id: string, content: string, properties?: Block["properties"], type?: Block["type"]) => void;
  addBlock: (type: Block["type"], afterId?: string) => void;
  removeBlock: (id: string) => void;
  moveBlock: (fromIndex: number, toIndex: number) => void;
  transformBlock: (id: string, newType: Block["type"]) => void; // 块转化

  // 撤销/重做
  saveHistory: () => void;
  undo: () => void;
  redo: () => void;
}
```

**主要 Actions 实现：**

```typescript
export const useDocumentStore = create<DocumentState>()(
  persist(
    (set, get) => ({
      id: generateId(),
      title: "加载中...",
      blocks: [],
      isSaving: false,
      isOnline: false,
      onlineUsers: [],
      typingUsers: {},
      selectedBlockId: null,
      focusedBlockId: null,

      // 拉取文档
      fetchDocument: async (id: string) => {
        try {
          const res = await api.get(`${API_URL}/${id}`);
          set({
            id: res.data.id,
            title: res.data.title,
            blocks: res.data.blocks?.length > 0 ? res.data.blocks : [
              { id: "init-1", type: "h1", content: res.data.title || "未命名文档" }
            ],
            isOnline: true,
          });
        } catch (error) {
          console.warn("无法从云端获取文档，正在回退至本地缓存");
          set({ isOnline: false });
        }
      },

      // 创建文档
      createDocument: async (title: string, parentId?: string, type?: string, blocks?: Block[]) => {
        const newDoc = {
          title,
          parentId: parentId || null,
          type: type || "document",
          blocks: blocks || [{ id: generateId(), type: "text", content: "" }],
        };
        const res = await api.post(API_URL, newDoc);
        return res.data.id;
      },

      // 更新块
      updateBlock: (id: string, content: string, properties?: Block["properties"], type?: Block["type"]) => {
        const { blocks, focusedBlockId } = get();
        const index = blocks.findIndex((b) => b.id === id);
        if (index === -1) return;

        const updatedBlocks = [...blocks];
        updatedBlocks[index] = {
          ...updatedBlocks[index],
          content,
          ...(properties && { properties }),
          ...(type && { type }),
        };

        set({ blocks: updatedBlocks });

        // 发送到服务器
        socketClient.updateBlock(get().id, id, content, type, properties);

        // 更新历史
        if (id === focusedBlockId) {
          get().saveHistory();
        }
      },

      // 添加块
      addBlock: (type: Block["type"], afterId?: string) => {
        const { blocks, focusedBlockId } = get();
        const newBlock: Block = {
          id: generateId(),
          type,
          content: "",
        };

        let newBlocks: Block[];
        if (afterId) {
          const index = blocks.findIndex((b) => b.id === afterId);
          newBlocks = [
            ...blocks.slice(0, index + 1),
            newBlock,
            ...blocks.slice(index + 1),
          ];
        } else if (focusedBlockId) {
          const index = blocks.findIndex((b) => b.id === focusedBlockId);
          newBlocks = [
            ...blocks.slice(0, index + 1),
            newBlock,
            ...blocks.slice(index + 1),
          ];
        } else {
          newBlocks = [...blocks, newBlock];
        }

        set({ blocks: newBlocks });
        get().saveHistory();
      },

      // 删除块
      removeBlock: (id: string) => {
        const { blocks } = get();
        const newBlocks = blocks.filter((b) => b.id !== id);
        set({ blocks: newBlocks });
        get().saveHistory();
      },

      // 保存历史
      saveHistory: () => {
        const { blocks, history, historyIndex } = get();
        // 移除当前索引之后的历史
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push({ blocks: [...blocks], title: get().title });

        set({
          history: newHistory,
          historyIndex: newHistory.length - 1,
          canUndo: newHistory.length > 1,
          canRedo: false,
        });
      },

      // 撤销
      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          set({
            blocks: [...history[newIndex].blocks],
            historyIndex: newIndex,
            canUndo: newIndex > 0,
            canRedo: true,
          });
        }
      },

      // 重做
      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          set({
            blocks: [...history[newIndex].blocks],
            historyIndex: newIndex,
            canUndo: true,
            canRedo: newIndex < history.length - 1,
          });
        }
      },
    }),
    {
      name: 'fastdoc-document-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

#### 3.2.2 数据流模式

**URL 参数驱动 + Zustand 状态管理：**

```typescript
// src/app/page.tsx
function HomeContent() {
  const searchParams = useSearchParams();
  const { fetchDocument } = useDocumentStore();

  // 监听 URL 参数变化，自动加载文档
  useEffect(() => {
    const docId = searchParams.get("doc");
    if (docId) {
      fetchDocument(docId);
      setCurrentPage("editor");
    }
  }, [searchParams]);

  const handleNavigate = async (page: string) => {
    if (["dashboard", "all", "starred", "trash", "memos", "meeting", "knowledge", "calendar", "node-map"].includes(page)) {
      setCurrentPage(page);
    } else {
      // 假设是具体的文档 ID
      await fetchDocument(page);
      setCurrentPage("editor");
    }
  };
}
```

**数据流特点：**
- **URL 参数驱动**：通过 `?doc=xxx` 切换文档
- **Zustand 全局状态**：管理文档内容、块操作、历史记录
- **本地持久化**：使用 `persist` 中间件保存到 localStorage
- **WebSocket 实时同步**：块更新通过 socketClient 发送到服务器
- **撤销/重做机制**：本地维护历史栈，支持操作回滚

### 3.3 组件架构

**认证结果：分层组件架构**

```
components/
├── 页面组件 (page-level)
│   ├── Editor.tsx
│   ├── Dashboard.tsx
│   ├── VideoConference.tsx
│   └── KnowledgeBaseView.tsx
│
├── 通用组件 (shared)
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   └── BlockTransformMenu.tsx
│
├── 块组件 (blocks)
│   ├── TextBlock.tsx
│   ├── TodoBlock.tsx
│   └── CodeBlock.tsx
│
└── 平台适配
    ├── mobile/
    └── tablet/
```

**组件特点**：
- `"use client"` 标记客户端组件
- 使用 Framer Motion 实现动画
- Ant Design 组件 + Tailwind 样式混用
- 支持响应式布局（mobile/tablet/desktop）

---

## 四、性能与质量认证（第三层）

### 4.1 性能配置分析

**next.config.ts 分析**：

```typescript
const nextConfig: NextConfig = {
  sassOptions: {
    includePaths: [path.join(__dirname, "src")],
  },
  turbopack: {},  // 使用 Turbopack 构建
};
```

**性能特点**：
- ✅ 使用 Turbopack（Next.js 16 新特性）
- ⚠️ 缺少图片优化配置
- ⚠️ 缺少代码分割配置
- ⚠️ 缺少缓存策略配置

### 4.2 TypeScript 配置分析

**tsconfig.json 分析**：

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "strict": true,
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./src/*"]  // 路径别名
    }
  }
}
```

**配置特点**：
- ✅ 严格模式开启
- ✅ 使用 bundler 模块解析
- ✅ 配置路径别名
- ⚠️ 目标版本较旧（ES2017）

---

## 五、选型评估表

### 5.1 框架选型评估

| 技术 | 优点 | 缺点 | 评分 |
|------|------|------|------|
| Next.js 16 | 最新版本、Turbopack 快 | 相对较新 | ⭐⭐⭐⭐⭐ |
| React 19 | 最新版本、性能好 | 生态适配中 | ⭐⭐⭐⭐ |

### 5.2 状态管理评估

| 技术 | 优点 | 缺点 | 评分 |
|------|------|------|------|
| Zustand 5 | 极简 API、无 Provider 嵌套 | 功能相对简单 | ⭐⭐⭐⭐⭐ |

### 5.3 样式方案评估

| 技术 | 优点 | 缺点 | 评分 |
|------|------|------|------|
| Tailwind CSS 4 | 原子化类、性能好 | 学习曲线 | ⭐⭐⭐⭐ |
| Ant Design 6 | 组件丰富 | 包体积大 | ⭐⭐⭐⭐ |

---

## 六、认证结论

### 6.1 技术栈适用性评估

| 评估维度 | 结论 | 说明 |
|----------|------|------|
| **技术选型** | ✅ 合适 | 使用最新稳定版本技术栈 |
| **架构设计** | ✅ 合理 | 分层清晰、职责明确 |
| **性能配置** | ⚠️ 待优化 | 缺少一些优化配置 |
| **代码质量** | ✅ 良好 | TypeScript 严格模式 |

### 6.2 技术栈清单汇总

```
前端技术栈：
├── Next.js 16.1.6 (App Router + Turbopack)
├── React 19.2.3
├── TypeScript 5
├── Zustand 5.0.11
├── Tailwind CSS 4 + Ant Design 6.3.0
├── Framer Motion 12.34.3
├── Socket.io 4.8.3 + LiveKit 2.17.2
└── Playwright + Vitest

后端技术栈：
├── NestJS 11.x
├── PostgreSQL + TypeORM
├── Redis (ioredis)
├── Socket.io + LiveKit Server
├── Passport JWT
└── PM2 部署
```

---

## 七、下一步建议

### 7.1 立即可执行

1. **添加图片优化配置**：`next.config.js` 中配置 `images`
2. **升级 TypeScript 目标**：从 ES2017 升级到 ES2022
3. **添加缓存策略**：配置 ISR/SSG

### 7.2 长期优化

1. **考虑添加 React Query**：进行服务端状态管理
2. **考虑迁移到 Server Actions**：替代部分 API 路由
3. **性能监控**：添加 Vercel Analytics 或自建监控

---

## 附录：关键配置文件路径

| 配置文件 | 路径 |
|----------|------|
| package.json | `frontend/package.json` |
| next.config.ts | `frontend/next.config.ts` |
| tsconfig.json | `frontend/tsconfig.json` |
| playwright.config.ts | `frontend/playwright.config.ts` |
| vitest.config.ts | `frontend/vitest.config.ts` |
| 后端 package.json | `backend/package.json` |
| nest-cli.json | `backend/nest-cli.json` |
