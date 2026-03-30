# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 一、项目概述与源码位置

这是一个**Web前端开发教学系统**，包含两个完整的实战项目：

| 项目 | 描述 | 源码位置 |
|------|------|----------|
| **FastDocument** | 现代化文档协作平台（原子化块编辑器、实时协作、视频会议） | `D:\Develeping\FastDocument` |
| **WebEnv-OS** | 基于Web的类桌面开发环境（IDE、终端、3D桌面） | `D:\Develeping\webEnv` |

### 项目源码结构

```
D:\Develeping\
├── FastDocument/              # 文档协作平台
│   ├── frontend/              # Next.js 16.1.6 前端
│   ├── backend/               # NestJS 11.x 后端
│   ├── mobile/                # 移动端
│   └── docs/                  # 项目文档
│
└── webEnv/                    # Web类桌面开发环境
    ├── webenv-os/             # Next.js 16.1.4 前端
    ├── webenv-backend/         # NestJS 11.x 后端
    └── docs/                   # 项目文档
```

---

## 二、技术栈深度解析

### 2.1 Next.js 16 核心特性

| 特性 | 说明 | 项目应用 |
|------|------|----------|
| **App Router** | 使用 `app/` 目录作为路由根目录 | FastDocument (16.1.6)、WebEnv-OS (16.1.4) |
| **React Server Components** | 组件在服务端渲染，减少客户端 JS | layout.tsx |
| **服务端组件** | 默认组件在服务端渲染，直接获取数据 | page.tsx |
| **客户端组件** | 添加 `"use client"` 标记使用 hooks | Editor.tsx |
| **Turbopack** | 新一代构建工具，比 webpack 快 10 倍+ | next.config.ts |
| **Metadata API** | 静态/动态 SEO 配置 | share/[code]/page.tsx |
| **Server Actions** | 直接在组件中调用服务端逻辑 | 表单提交 |

**服务端组件 (RSC) 核心优势：**

1. **直接访问数据源**：组件可在服务端直接查询数据库、文件系统
2. **减少客户端 JS**：只发送 HTML，不发送组件代码
3. **SEO 优化**：服务端渲染的内容更容易被搜索引擎索引
4. **安全**：敏感逻辑（如 API 密钥）只在服务端执行

**服务端 vs 客户端组件区别：**

```typescript
// 服务端组件（默认）- 数据获取、SEO、减少 JS
// app/layout.tsx
export default async function RootLayout({ children }) {
  // 可直接访问数据库
  const data = await fetchData();
  return <>{children}</>;
}

// 客户端组件 - 交互、hooks、浏览器 API
// app/page.tsx
"use client";
import { useState, useEffect } from 'react';
export default function Page() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c+1)}>{count}</button>;
}
```

**动态 Metadata 示例：**

```typescript
// app/share/[code]/page.tsx
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
      images: document.thumbnail ? [document.thumbnail] : [],
    },
  };
}
```

### 2.2 React 19 新特性

| Hook | 用途 | 项目应用 |
|------|------|----------|
| **useOptimistic** | 乐观更新，UI 先变化再同步服务端 | 点赞、文档更新 |
| **useActionState** | 管理表单 action 状态 | 登录、提交 |
| **use** | 消费 promise/Context（超越 hooks 限制） | 异步数据 |
| **useTransition** | 管理非紧急状态更新 | 搜索过滤 |

> **版本信息**: React 19.2.3（FastDocument 和 WebEnv-OS 均使用此版本）

**useOptimistic 乐观更新示例：**

```typescript
import { useOptimistic } from 'react';

function LikeButton({ initialLikes }) {
  const [likes, setLikes] = useState(initialLikes);
  const [optimisticLikes, addOptimistic] = useOptimistic(
    likes,
    (current, added) => current + added
  );

  return (
    <button onClick={() => addOptimistic(1)}>
      👍 {optimisticLikes}
    </button>
  );
}
```

**use() 消费 Promise/Context：**

```typescript
import { use } from 'react';

// 消费 Promise
function UserProfile({ userPromise }) {
  const user = use(userPromise); // 直接获取 Promise 结果
  return <div>{user.name}</div>;
}

// 消费 Context（无需 Provider）
function ThemedButton() {
  const theme = use(ThemeContext); // 直接使用，无需 Provider
  return <button className={theme}>Click</button>;
}
```

**useActionState 表单状态管理：**

```typescript
import { useActionState } from 'react';

async function submitForm(prevState, formData) {
  const name = formData.get('name');
  const result = await fetch('/api/submit', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  return result.ok ? { success: true } : { error: 'Failed' };
}

function MyForm() {
  const [state, formAction, isPending] = useActionState(submitForm, null);

  return (
    <form action={formAction}>
      <input name="name" />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Submitting...' : 'Submit'}
      </button>
      {state?.error && <p>{state.error}</p>}
    </form>
  );
}
```

### 2.3 Zustand 状态管理

| 特性 | 说明 | 项目应用 |
|------|------|----------|
| **persist 中间件** | 状态持久化到 localStorage | documentStore.ts |
| **无 Provider 嵌套** | 直接 import 使用 | 全项目 |
| **TypeScript 友好** | 完整类型推断 | 所有 Store |
| **useShallow** | 浅比较优化，避免不必要重渲染 | 性能优化 |
| **subscribeWithSelector** | 选择器函数订阅 | 高级用法 |

> **版本信息**: FastDocument 使用 Zustand 5.0.11，WebEnv-OS 使用 Zustand 5.0.10

### 2.4 SWR 数据获取

| 特性 | 说明 |
|------|------|
| **缓存策略** | stale-while-revalidate |
| **自动重新验证** | 窗口焦点、重新挂载时 |
| **预加载** | 提升用户体验 |

> **版本信息**: SWR 2.3.x（WebEnv-OS 使用）

**SWR 核心原理：**

```
请求流程：
1. 立即返回缓存数据（可能过期）
2. 后台发送请求验证
3. 获取新数据后更新缓存
4. 触发组件重新渲染
```

**使用示例：**

```typescript
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then(r => r.json());

function UserProfile({ userId }) {
  const { data, error, isLoading } = useSWR(
    `/api/users/${userId}`,
    fetcher,
    {
      revalidateOnFocus: true,  // 窗口聚焦时重新验证
      dedupingInterval: 2000,   // 2秒内重复请求去重
    }
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>Hello, {data.name}!</div>;
}
```

**项目中的 Store 结构：**

```typescript
// store/documentStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set, get) => ({
      documents: [],
      currentDoc: null,
      blocks: [],
      loading: false,

      fetchDocument: async (id) => {
        set({ loading: true });
        const doc = await fetch(`/api/documents/${id}`).then(r => r.json());
        set({ currentDoc: doc, blocks: doc.blocks || [], loading: false });
      },
    }),
    {
      name: 'fastdoc-document-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

**性能优化 - useShallow：**

```typescript
import { useShallow } from 'zustand/shallow';

// ❌ 每次渲染
const { name, age } = useStore((state) => state.user);

// ✅ 使用 useShallow 浅比较
const { name, age } = useStore(
  useShallow((state) => state.user)
);
```

### 2.4 Tailwind CSS v4 新特性

| 特性 | 说明 |
|------|------|
| **@theme 指令** | CSS 中定义主题变量 |
| **CSS 配置优先** | 不再依赖 tailwind.config.js |
| **Oxide 引擎** | 构建速度提升 3.5-182 倍 |
| **动态间距** | 从单一值派生成间距工具 |

> **版本信息**: Tailwind CSS v4（FastDocument 和 WebEnv-OS 均使用 v4）

### 2.5 Ant Design 6 SSR 配置

| 组件 | 用途 |
|------|------|
| **AntdRegistry** | SSR 样式注册，解决首屏闪烁 |
| **ConfigProvider** | 主题配置 |
| **App** | 应用级 Context |

> **版本信息**: FastDocument 使用 Ant Design 6.3.0，WebEnv-OS 使用 Ant Design 6.2.1

### 2.6 NestJS 后端架构

| 模块 | 技术 |
|------|------|
| **ORM** | TypeORM 0.3.x |
| **认证** | Passport + JWT |
| **数据库** | PostgreSQL + Redis |
| **实时** | Socket.io |

> **版本信息**: FastDocument 后端使用 NestJS 11.1.14 + TypeORM 0.3.28，WebEnv-OS 后端使用 NestJS 11.1.14 + TypeORM 0.3.20

### 2.7 实时协作方案

| 方案 | 用途 |
|------|------|
| **Socket.io** | 文档同步、在线状态、房间管理 |
| **Yjs** | CRDT 协作编辑 |
| **LiveKit** | WebRTC 视频会议 |

> **版本信息**: Socket.io Client 4.8.3，Yjs 13.6.29，LiveKit Client 2.17.2，FastDocument 还使用 Hocuspocus 3.4.4 协作服务器

**Socket.io 房间管理：**

```typescript
// 服务端
io.on('connection', (socket) => {
  // 加入文档房间
  socket.on('join-document', (docId) => {
    socket.join(docId);
    io.to(docId).emit('user-joined', socket.id);
  });

  // 广播块更新
  socket.on('block:update', ({ docId, block }) => {
    socket.to(docId).emit('block:updated', block);
  });
});
```

**Yjs CRDT 协作编辑原理：**

| 特性 | 说明 |
|------|------|
| **CRDT** | 无冲突复制数据类型，确保多用户同时编辑时数据一致 |
| **Y.Doc** | 文档容器，承载所有协作状态 |
| **Y.Text** | 共享文本类型，用于文本编辑器 |
| **Y.Map** | 共享映射，用于键值数据 |
| **Awareness** | 光标/选中状态同步 |

**CRDT 核心特性：**
- 操作可交换：操作顺序不影响最终结果
- 操作幂等：重复应用同一操作不会改变结果
- 最终一致：所有客户端最终达到相同状态

```typescript
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

// 创建文档
const doc = new Y.Doc();

// 创建共享文本
const ytext = doc.getText('content');

// 监听变化
ytext.observe((event) => {
  console.log('Content changed:', ytext.toString());
});

// 连接 WebSocket 同步
const provider = new WebsocketProvider(
  'ws://localhost:1234',
  'room-name',
  doc
);
```

### 2.8 Monaco Editor 集成

| 特性 | 说明 |
|------|------|
| **@monaco-editor/react** | React 封装组件 |
| **语言支持** | JS/TS/Python/Go 等 |
| **功能** | 语法高亮、自动补全、代码折叠 |

> **版本信息**: @monaco-editor/react 4.7.0，monaco-editor 0.55.1（WebEnv-OS 使用）

**Monaco Editor 集成示例：**

```typescript
import Editor from '@monaco-editor/react';

function CodeEditor() {
  const [code, setCode] = useState('// 开始编写代码...');

  return (
    <Editor
      height="90vh"
      language="javascript"
      theme="vs-dark"
      value={code}
      onChange={(value) => setCode(value)}
      options={{
        minimap: { enabled: true },
        fontSize: 14,
        automaticLayout: true,
      }}
    />
  );
}
```

### 2.9 xterm.js 终端模拟器

| 特性 | 说明 |
|------|------|
| **@xterm/xterm** | 新包名（WebEnv-OS 使用 v6.0.0） |
| **addon-fit** | 自动适应容器大小 |
| **WebSocket** | 后端实时通信 |

> **注意**: xterm.js 现已改用新包名 `@xterm/xterm`，WebEnv-OS 使用 v6.0.0

**xterm.js 集成示例：**

```typescript
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

function TerminalComponent() {
  const terminalRef = useRef(null);

  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, monospace',
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    // 连接 WebSocket
    const ws = new WebSocket('ws://localhost:8080');
    ws.onmessage = (event) => {
      term.write(event.data);
    };

    term.onData((data) => {
      ws.send(data);
    });

    return () => {
      term.dispose();
      ws.close();
    };
  }, []);

  return <div ref={terminalRef} style={{ height: '100%' }} />;
}
```

### 2.10 Three.js + React Three Fiber

| 概念 | 说明 |
|------|------|
| **Canvas** | R3F 渲染容器 |
| **mesh** | 3D 对象（几何体+材质） |
| **lights** | 光源（环境光、平行光） |
| **OrbitControls** | 轨道控制器 |

> **版本信息**: Three.js 0.183.x（FastDocument 使用 0.183.1，WebEnv-OS 使用 0.183.2），React Three Fiber 9.5.0

**R3F 基础示例：**

```typescript
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box } from '@react-three/drei';

function Scene() {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Box position={[0, 0, 0]}>
        <meshStandardMaterial color="orange" />
      </Box>
      <OrbitControls />
    </Canvas>
  );
}
```

### 2.11 Framer Motion 动画

| 特性 | 说明 |
|------|------|
| **motion.div** | 动画容器组件 |
| **AnimatePresence** | 出场动画 |
| **layoutId** | 跨元素过渡 |

> **版本信息**: Framer Motion 12.34.x（FastDocument 使用 12.34.3，WebEnv-OS 使用 12.34.0）

**Framer Motion 示例：**

```typescript
import { motion, AnimatePresence } from 'framer-motion';

function AnimatedList({ items, selectedId }) {
  return (
    <motion.div layout>
      {items.map(item => (
        <motion.div
          layoutId={item.id}
          onClick={() => setSelectedId(item.id)}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
        >
          {item.content}
        </motion.div>
      ))}
    </motion.div>
  );
}
```

### 2.12 LiveKit 视频会议

| 特性 | 说明 |
|------|------|
| **Room** | 视频会议房间 |
| **Participant** | 参会者 |
| **Track** | 音视频轨道 |

**LiveKit 集成示例：**

```typescript
import { LiveKitRoom, VideoConference } from '@livekit/components-react';

function VideoMeeting({ roomName, token }) {
  return (
    <LiveKitRoom
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      token={token}
      connect={true}
    >
      <VideoConference />
    </LiveKitRoom>
  );
}
```

### 2.13 TypeScript 5 新特性

| 特性 | 说明 |
|------|------|
| **装饰器** | Stage 3 装饰器标准支持 |
| **const 类型参数** | 泛型类型参数约束 |
| **moduleResolution: bundler** | 打包工具模块解析 |
| **NoInfer** | 禁止类型推断 |

> **版本信息**: TypeScript 5.x（两个项目均使用 ^5）

### 技术栈版本汇总表

| 类别 | 技术 | FastDocument | WebEnv-OS |
|------|------|--------------|-----------|
| **框架** | Next.js | 16.1.6 | 16.1.4 |
| **UI库** | React | 19.2.3 | 19.2.3 |
| **组件库** | Ant Design | 6.3.0 | 6.2.1 |
| **样式** | Tailwind CSS | v4 | v4 |
| **状态管理** | Zustand | 5.0.11 | 5.0.10 |
| **数据获取** | SWR | - | 2.3.8 |
| **编辑器** | Monaco Editor | - | 4.7.0 / 0.55.1 |
| **终端** | xterm.js | - | 6.0.0 (@xterm/xterm) |
| **3D渲染** | Three.js | 0.183.1 | 0.183.2 |
| **R3F** | React Three Fiber | 9.5.0 | 9.5.0 |
| **动画** | Framer Motion | 12.34.3 | 12.34.0 |
| **实时通信** | Socket.io | 4.8.3 | 4.8.3 |
| **协作编辑** | Yjs | 13.6.29 | 13.6.29 |
| **视频会议** | LiveKit | 2.17.2 | - |
| **后端框架** | NestJS | 11.1.14 | 11.1.14 |
| **ORM** | TypeORM | 0.3.28 | 0.3.20 |
| **数据库** | PostgreSQL | pg 8.18.0 | pg 8.13.1 |
| **缓存** | Redis | ioredis 5.9.3 | - |
| **容器** | Dockerode | - | 4.0.9 |
| **WebContainer** | @webcontainer/api | - | 1.6.1 |
| **测试** | Playwright | 1.58.2 | 1.58.2 |
| **测试** | Vitest | 4.0.18 | 4.0.18 |

---

## 三、技术栈汇总

```
项目导学/
├── FastDocument导学/          # FastDocument项目教学文档
│   ├── 00_项目概述与技术栈分析/
│   ├── 01_基础语法教程/
│   ├── 02_React核心教程/
│   ├── 03_项目技术栈详解/
│   ├── 04_项目代码解析/
│   ├── 05_实战练习/
│   └── 06_调试与问题解决/
│
└── WebEnv导学/               # WebEnv-OS项目教学文档
    ├── 00_项目概述与技术栈分析/
    ├── 01_基础语法教程/
    ├── 02_React核心教程/
    ├── 03_前端工程化/
    ├── 04_项目核心技术/
    ├── 05_项目代码解析/
    ├── 06_学习路径与资源/
    ├── 07_调试与问题解决/
    └── 08_实战练习/
```

---

## 四、教学文档清单

### FastDocument 导学 (约30个文档)

1. **00_项目概述与技术栈分析/**
   - 项目技术栈完全指南.md

2. **01_基础语法教程/**
   - JavaScript基础.md
   - ES6+新特性.md
   - TypeScript基础.md

3. **02_React核心教程/**
   - JSX与组件.md
   - Hooks详解.md

4. **03_项目技术栈详解/**
   - Next.js深度分析.md
   - Next.js源码研读教程.md
   - Zustand状态管理.md
   - NestJS后端基础.md

5. **04_项目代码解析/**
   - 文件结构说明.md

6. **05_实战练习/**
   - 基础练习.md

7. **06_调试与问题解决/**
   - 调试技巧.md

### WebEnv-OS 导学 (约30个文档)

1. **00_项目概述与技术栈分析.md**
2. **01_基础语法教程/** (4个文档)
3. **02_React核心教程/** (4个文档)
4. **03_前端工程化/** (4个文档)
5. **04_项目核心技术/** (6个文档)
6. **05_项目代码解析/** (5个文档)
7. **06_学习路径与资源/** (3个文档)
8. **07_调试与问题解决/** (3个文档)
9. **08_实战练习/** (3个文档)

---

## 五、学习路径

### 推荐顺序

```
第一阶段：基础入门 (1-2周)
├── HTML/CSS 基础
├── JavaScript 核心
├── ES6+ 新特性
└── TypeScript 基础

第二阶段：React 核心 (2-3周)
├── React 基础与 JSX
├── React Hooks 完全指南
├── 状态管理 (Zustand/SWR)
└── 组件库使用

第三阶段：工程化工具 (1-2周)
├── Next.js 完全指南
├── Tailwind CSS 实战
└── 测试实战

第四阶段：项目核心技术 (3-4周)
├── Monaco Editor 编辑器开发
├── xterm.js 终端模拟器
├── Three.js 3D 图形编程
├── 实时协作与 Socket 通信
├── Framer Motion 动画实战
└── Ant Design 组件库

第五阶段：实战与优化 (2-3周)
├── 项目代码解析
├── 调试技巧
└── 性能优化
```

---

## 六、关键配置文件

| 项目 | 配置文件 |
|------|----------|
| FastDocument 前端 | `frontend/package.json`, `frontend/next.config.ts`, `frontend/tsconfig.json` |
| FastDocument 后端 | `backend/package.json`, `backend/nest-cli.json`, `backend/tsconfig.json` |
| WebEnv-OS 前端 | `webenv-os/package.json`, `webenv-os/next.config.ts`, `webenv-os/tsconfig.json` |
| WebEnv-OS 后端 | `webenv-backend/package.json`, `webenv-backend/nest-cli.json`, `webenv-backend/tsconfig.json` |

---

## 七、常用命令

```bash
# FastDocument 前端
cd FastDocument/frontend
npm run dev      # 开发服务器 (localhost:13000)
npm run build    # 生产构建
npm run lint     # 代码检查
npm run test     # Playwright 测试
npm run test:unit # Vitest 单元测试

# FastDocument 后端
cd FastDocument/backend
npm run start:dev   # 开发模式（热重载）
npm run build       # 生产构建
npm run start:yjs   # 启动 Yjs 协作服务器
npm run start:all   # 同时启动后端和 Yjs 服务器

# WebEnv-OS 前端
cd webEnv/webenv-os
npm run dev      # 开发服务器 (localhost:11451)
npm run build    # 生产构建

# WebEnv-OS 后端
cd webEnv/webenv-backend
npm run start:dev   # 开发模式
npm run start:yjs   # 启动 Yjs 协作服务器
npm run start:all   # 同时启动后端和 Yjs 服务器
```

---

## 八、架构要点

### Next.js App Router 结构
- 使用 `app/` 目录作为路由根目录
- 默认服务端组件，需要交互时添加 `"use client"`
- 支持动态路由 `[param]`
- Metadata API 用于 SEO

### 状态管理方案
- **Zustand**: 全局客户端状态，使用 persist 中间件持久化
- **SWR**: 服务端数据获取和缓存
- **React Context**: 主题和配置共享

### 实时协作
- **Socket.io**: 文档实时同步、在线状态
- **Yjs**: CRDT 协作编辑
- **LiveKit**: WebRTC 视频会议

### 组件设计模式
- 原子化设计：Block → Component → Page
- 受控/非受控组件分离
- 自定义 Hook 抽取逻辑
- React.memo + useCallback 性能优化

---

## 九、注意事项

1. 所有教学文档使用**中文**编写（强制要求）
2. 代码示例基于实际项目源码
3. 保持术语一致性
4. 版本信息需与实际项目匹配
5. 搜索相关技术信息使用 minimax 搜索
6. **全程只允许使用中文进行交流、回复、注释和编写文档**

---

## 十、语言规范（强制要求）

**全程只允许使用中文，包括：**

1. **中文注释** - 所有代码注释必须使用中文
2. **中文回答** - 与用户交流必须使用中文
3. **中文交流** - 团队沟通必须使用中文
4. **中文文件** - 所有文档文件必须使用中文编写

### 中文注释规范

```typescript
// ✅ 正确：使用中文注释
// 创建用户状态管理
const [user, setUser] = useState<User | null>(null);

// ❌ 错误：使用英文注释
// Create user state management
```

### 文档命名规范

- 所有 Markdown 文件使用中文命名
- 目录名称使用中文
- 代码示例中的注释使用中文

---

## 十一、代码分析教学规范（强制要求）

### 11.1 源码比对原则

**所有教学文档中的代码示例必须与实际源码完全一致：**

1. **逐行比对**：每次更新文档前，必须读取实际源码文件
2. **完整引用**：使用实际项目中的完整代码，不简化或省略
3. **版本匹配**：确保代码与项目当前版本一致

### 11.2 源码文件检查清单

| 源码目录 | 关键文件 | 行数 | 教学文档 | 比对状态 |
|----------|----------|------|----------|----------|
| `frontend/src/lib/` | socket.ts | ~150 | 实时协作技术详解 | ✅ 已完成 |
| `frontend/src/lib/` | yjs.ts | ~200 | 实时协作技术详解 | ✅ 已完成 |
| `frontend/src/lib/` | livekit.ts | ~180 | 实时协作技术详解 | ✅ 已完成 |
| `frontend/src/store/` | documentStore.ts | 689 | Zustand状态管理 | ✅ 已完成 |
| `frontend/src/store/` | userStore.ts | 280 | Zustand状态管理 | ✅ 已完成 |
| `frontend/src/store/` | meetingStore.ts | 464 | Zustand状态管理 | ✅ 已完成 |
| `frontend/src/store/` | commentStore.ts | 354 | Zustand状态管理 | ✅ 已完成 |
| `frontend/src/store/` | themeStore.ts | 52 | Zustand状态管理 | ✅ 已完成 |
| `frontend/src/store/` | notificationStore.ts | 336 | Zustand状态管理 | ✅ 已完成 |
| `frontend/src/store/` | projectStore.ts | 367 | Zustand状态管理 | ✅ 已完成 |
| `frontend/src/store/` | knowledgeStore.ts | 397 | Zustand状态管理 | ✅ 已完成 |
| `frontend/src/store/` | shareStore.ts | 232 | Zustand状态管理 | ✅ 已完成 |
| `frontend/src/store/` | searchStore.ts | 263 | Zustand状态管理 | ✅ 已完成 |
| `frontend/src/store/` | mobileStore.ts | 84 | Zustand状态管理 | ✅ 已完成 |
| `frontend/src/store/` | responsiveStore.ts | 141 | Zustand状态管理 | ✅ 已完成 |
| `frontend/src/store/` | versionStore.ts | 320 | Zustand状态管理 | ✅ 已完成 |
| `frontend/src/components/` | Editor.tsx | - | 原子化块编辑器 | 待比对 |
| `backend/src/` | app.module.ts | - | NestJS后端基础 | 待比对 |
| `backend/src/` | documents.gateway.ts | - | NestJS后端基础 | 待比对 |

**总计**：16 个 Store 文件已完成源码比对，代码总量超过 **4000 行**

### 11.3 代码分析教学要求

**每个技术文档必须包含：**

1. **设计原理分析**
   - 为什么要这样设计？
   - 解决了什么问题？
   - 有什么优缺点？

2. **逐行代码注释**
   - 每段代码的功能说明
   - 关键逻辑的解释
   - 边界情况的处理

3. **实际应用场景**
   - 在项目中如何使用
   - 典型调用示例

### 11.4 更新流程

```
1. 读取实际源码文件
2. 逐行比对现有文档
3. 更新不匹配的代码示例
4. 添加设计原理分析
5. 验证文档可读性
```

---

## 十二、快速索引

- 想要学习基础语法 → `01_基础语法教程/`
- 想要学习 React → `02_React核心教程/`
- 想要深入技术栈 → `03_*_工程化/` 或 `03_项目技术栈详解/`
- 想要看代码解析 → `04_项目代码解析/` 或 `05_项目代码解析/`
- 想要实战练习 → `05_实战练习/` 或 `08_实战练习/`
- 想要调试帮助 → `06_调试与问题解决/` 或 `07_调试与问题解决/`
