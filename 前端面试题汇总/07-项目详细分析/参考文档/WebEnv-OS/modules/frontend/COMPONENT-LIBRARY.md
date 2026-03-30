# webEnvOS 组件库文档

## 📋 概述

webEnvOS 采用高度模块化的组件化设计，所有功能都封装为独立的组件，支持按需加载和懒加载。本文档详细说明所有组件的用途、接口和使用方法。

## 🏗️ 组件架构

```
组件库
├── 核心组件
│   ├── ThemeProvider.tsx          # 主题提供者
│   ├── IDELayout.tsx              # IDE布局（基础）
│   └── EnhancedIDELayout.tsx      # IDE布局（增强）
│
├── 桌面环境组件
│   ├── WindowManager.tsx          # 窗口管理器
│   ├── TaskBar.tsx                # 任务栏（预留）
│   └── StartMenu.tsx              # 开始菜单（预留）
│
├── IDE功能组件
│   ├── FileTree.tsx               # 文件树
│   ├── Editor.tsx                 # 编辑器
│   ├── DocBlock.tsx               # 文档区块
│   ├── DocBlockContainer.tsx      # 文档区块容器
│   ├── StatusBar.tsx              # 状态栏
│   └── CommandPalette.tsx         # 命令面板
│
├── 工作区组件
│   ├── WorkspaceManager.tsx       # 工作区管理器
│   └── WorkspaceSelector.tsx      # 工作区选择器（预留）
│
├── 协作组件
│   ├── CollaborationPanel.tsx     # 协作面板
│   └── UserList.tsx               # 用户列表（预留）
│
├── 主题组件
│   ├── ThemeSelector.tsx          # 主题选择器
│   └── ThemePreview.tsx           # 主题预览（预留）
│
├── 工具组件
│   ├── LazyComponents.tsx         # 懒加载组件
│   └── LoadingSpinner.tsx         # 加载动画（预留）
│
└── 工具库
    ├── css-server.ts              # CSS服务端化
    └── utils.ts                   # 工具函数（预留）
```

## 📦 核心组件

### 1. ThemeProvider

**文件**: `src/components/ThemeProvider.tsx`

**用途**: 管理全局主题，将CSS变量注入到DOM

**接口**:
```typescript
interface ThemeProviderProps {
  children: ReactNode;
}
```

**功能**:
- 监听主题变化
- 动态注入CSS变量
- 支持主题切换

**使用示例**:
```tsx
import ThemeProvider from "@/components/ThemeProvider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 2. IDELayout

**文件**: `src/components/IDELayout.tsx`

**用途**: 基础IDE布局，包含Header、Sidebar、Editor、Panels、StatusBar

**接口**:
```typescript
interface IDELayoutProps {
  className?: string;
}
```

**功能**:
- 基础IDE界面布局
- 文件树显示
- 编辑器区域
- 面板切换
- 状态栏显示

**使用示例**:
```tsx
import IDELayout from "@/components/IDELayout";

export default function Home() {
  return <IDELayout />;
}
```

### 3. EnhancedIDELayout

**文件**: `src/components/EnhancedIDELayout.tsx`

**用途**: 增强的IDE布局，集成所有高级功能

**接口**:
```typescript
interface EnhancedIDELayoutProps {
  // 无额外props
}
```

**功能**:
- 桌面环境集成
- 工作区管理
- 多人协作
- 命令面板
- 完整的工具栏
- 增强的状态栏

**使用示例**:
```tsx
import EnhancedIDELayout from "@/components/EnhancedIDELayout";

export default function Home() {
  return <EnhancedIDELayout />;
}
```

## 🖥️ 桌面环境组件

### 4. WindowManager

**文件**: `src/components/WindowManager.tsx`

**用途**: 管理桌面环境中的所有窗口

**接口**:
```typescript
interface WindowManagerProps {
  className?: string;
}

interface Window {
  id: string;
  title: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  zIndex?: number;
  minimized?: boolean;
  maximized?: boolean;
  visible?: boolean;
}
```

**功能**:
- 窗口拖拽
- 窗口调整大小
- 窗口最小化/最大化
- 窗口层级管理
- 任务栏集成
- 快速启动

**使用示例**:
```tsx
import WindowManager from "@/components/WindowManager";

function App() {
  return <WindowManager />;
}
```

**窗口操作**:
```tsx
// 添加窗口
const addWindow = (window: Omit<Window, "id" | "zIndex" | "visible">) => {
  // 实现逻辑
};

// 关闭窗口
const closeWindow = (id: string) => {
  // 实现逻辑
};

// 最小化窗口
const minimizeWindow = (id: string) => {
  // 实现逻辑
};

// 最大化窗口
const maximizeWindow = (id: string) => {
  // 实现逻辑
};
```

## 📁 IDE功能组件

### 5. FileTree

**文件**: `src/components/FileTree.tsx`

**用途**: 显示和管理文件系统树

**接口**:
```typescript
interface FileTreeProps {
  className?: string;
}

interface FileItem {
  id: string;
  name: string;
  type: "file" | "folder";
  path: string;
  content?: string;
  language?: string;
  children?: FileItem[];
  expanded?: boolean;
  active?: boolean;
}
```

**功能**:
- 文件树浏览
- 文件夹展开/折叠
- 文件点击选择
- 文件图标显示
- 当前文件高亮

**使用示例**:
```tsx
import FileTree from "@/components/FileTree";

function Sidebar() {
  return <FileTree />;
}
```

### 6. Editor

**文件**: `src/components/Editor.tsx`

**用途**: 代码编辑器组件

**接口**:
```typescript
interface EditorProps {
  // 无额外props
}
```

**功能**:
- 多标签页支持
- 文件编辑
- 文件保存
- 未保存状态标记
- 语言模式显示
- 代码编辑（textarea实现）

**使用示例**:
```tsx
import Editor from "@/components/Editor";

function EditorArea() {
  return <Editor />;
}
```

### 7. DocBlock

**文件**: `src/components/DocBlock.tsx`

**用途**: 文档区块组件

**接口**:
```typescript
interface DocBlockProps {
  block: DocBlockState;
}

interface DocBlockState {
  id: string;
  title: string;
  content: string;
  language: string;
  visible: boolean;
  position: "left" | "right" | "bottom";
}
```

**功能**:
- Markdown渲染
- 文档/代码视图切换
- 关闭和隐藏
- 位置信息显示

**使用示例**:
```tsx
import DocBlock from "@/components/DocBlock";

function DocArea() {
  const block = {
    id: "doc-1",
    title: "API文档",
    content: "# API文档\n\n...",
    language: "markdown",
    visible: true,
    position: "right",
  };

  return <DocBlock block={block} />;
}
```

### 8. DocBlockContainer

**文件**: `src/components/DocBlockContainer.tsx`

**用途**: 文档区块容器，管理多个文档区块

**接口**:
```typescript
interface DocBlockContainerProps {
  position: "left" | "right" | "bottom";
  className?: string;
}
```

**功能**:
- 按位置分组显示文档
- 空状态处理
- 添加示例文档

**使用示例**:
```tsx
import DocBlockContainer from "@/components/DocBlockContainer";

function RightPanel() {
  return <DocBlockContainer position="right" />;
}
```

### 9. StatusBar

**文件**: `src/components/StatusBar.tsx`

**用途**: 状态栏组件

**接口**:
```typescript
interface StatusBarProps {
  className?: string;
}
```

**功能**:
- 显示当前文件
- 显示语言模式
- 显示编码、行尾符
- 显示Git分支
- 显示字体大小
- 显示自动保存状态
- 显示时间

**使用示例**:
```tsx
import StatusBar from "@/components/StatusBar";

function IDEFooter() {
  return <StatusBar />;
}
```

### 10. CommandPalette

**文件**: `src/components/CommandPalette.tsx`

**用途**: 命令面板组件

**接口**:
```typescript
interface CommandPaletteProps {
  visible: boolean;
  onClose: () => void;
  commands: Command[];
}

interface Command {
  id: string;
  name: string;
  description: string;
  icon?: React.ReactNode;
  category: "file" | "edit" | "view" | "go" | "run" | "help" | "collaboration";
  shortcut?: string;
  action: () => void;
  enabled?: boolean;
}
```

**功能**:
- 命令搜索
- 键盘导航
- 类别过滤
- 快捷键显示

**使用示例**:
```tsx
import CommandPalette from "@/components/CommandPalette";

function App() {
  const [showPalette, setShowPalette] = useState(false);

  const commands = [
    {
      id: "save",
      name: "保存文件",
      description: "保存当前文件",
      category: "file",
      shortcut: "Ctrl+S",
      action: () => console.log("保存"),
    },
  ];

  return (
    <>
      <button onClick={() => setShowPalette(true)}>打开命令面板</button>
      <CommandPalette
        visible={showPalette}
        onClose={() => setShowPalette(false)}
        commands={commands}
      />
    </>
  );
}
```

## 🏢 工作区组件

### 11. WorkspaceManager

**文件**: `src/components/WorkspaceManager.tsx`

**用途**: 工作区管理器组件

**接口**:
```typescript
interface WorkspaceManagerProps {
  className?: string;
  onClose?: () => void;
}

interface WorkspaceConfig {
  id: string;
  name: string;
  description: string;
  theme: string;
  windows: Array<{
    id: string;
    title: string;
    x: number;
    y: number;
    width: number;
    height: number;
    minimized: boolean;
    maximized: boolean;
  }>;
  fileTree: any[];
  openFiles: string[];
  settings: {
    fontSize: number;
    tabSize: number;
    autoSave: boolean;
    wordWrap: boolean;
    minimap: boolean;
  };
  createdAt: string;
  updatedAt: string;
}
```

**功能**:
- 创建工作区
- 编辑工作区
- 删除工作区
- 切换工作区
- 保存工作区
- 导出工作区
- 导入工作区
- 复制工作区

**使用示例**:
```tsx
import WorkspaceManager from "@/components/WorkspaceManager";

function App() {
  const [showManager, setShowManager] = useState(false);

  return (
    <>
      <button onClick={() => setShowManager(true)}>管理工作区</button>
      {showManager && (
        <WorkspaceManager onClose={() => setShowManager(false)} />
      )}
    </>
  );
}
```

## 🤝 协作组件

### 12. CollaborationPanel

**文件**: `src/components/CollaborationPanel.tsx`

**用途**: 协作面板组件

**接口**:
```typescript
interface CollaborationPanelProps {
  className?: string;
  roomId?: string;
}

interface Collaborator {
  id: string;
  name: string;
  color: string;
  status: "online" | "offline" | "away";
  lastSeen: string;
  cursor?: {
    x: number;
    y: number;
    line: number;
    column: number;
  };
  selection?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}
```

**功能**:
- 连接协作房间
- 显示协作者列表
- 实时光标同步
- 选择范围同步
- 编辑操作同步
- 文件变更同步
- 用户状态管理

**使用示例**:
```tsx
import CollaborationPanel from "@/components/CollaborationPanel";

function CollaborationArea() {
  return <CollaborationPanel roomId="my-room" />;
}
```

## 🎨 主题组件

### 13. ThemeSelector

**文件**: `src/components/ThemeSelector.tsx`

**用途**: 主题选择器组件

**接口**:
```typescript
interface ThemeSelectorProps {
  className?: string;
  compact?: boolean;
}

type ThemeType = "windows" | "kde" | "gnome" | "macos";
```

**功能**:
- 主题切换
- 紧凑模式
- 主题图标显示
- 实时预览

**使用示例**:
```tsx
import ThemeSelector from "@/components/ThemeSelector";

function Header() {
  return <ThemeSelector compact />;
}
```

## 📦 懒加载组件

### 14. LazyComponents

**文件**: `src/components/LazyComponents.tsx`

**用途**: 懒加载组件集合

**接口**:
```typescript
// 所有组件都支持懒加载
export const LazyWindowManager = dynamic(() => import("./WindowManager"), {
  ssr: false,
  loading: () => <LoadingSpinner />,
});

export const LazyWorkspaceManager = dynamic(() => import("./WorkspaceManager"), {
  ssr: false,
  loading: () => <LoadingSpinner />,
});

// ... 其他懒加载组件
```

**功能**:
- 按需加载
- 自定义加载状态
- SSR兼容

**使用示例**:
```tsx
import { LazyWindowManager, LazyWorkspaceManager } from "@/components/LazyComponents";

function App() {
  return (
    <>
      <LazyWindowManager />
      <LazyWorkspaceManager />
    </>
  );
}
```

## 🛠️ 工具库

### 15. CSS Server

**文件**: `src/lib/css-server.ts`

**用途**: CSS资源服务端化管理

**接口**:
```typescript
class CSSResourceManager {
  static getInstance(): CSSResourceManager;
  inlineCSS(cssContent: string, className?: string): string;
  inlineCriticalCSS(cssContent: string, selectors: string[]): string;
  cacheCSS(name: string, content: string): CSSResource;
  getFromCache(name: string): CSSResource | null;
  generateCacheHeaders(resource: CSSResource): Record<string, string>;
  cleanupExpiredCache(): void;
  getAllCachedCSS(): CSSResource[];
  clearCache(): void;
}

function generateCSSVariablesString(theme: any): string;
function generateInlineCSS(theme: any): string;
```

**功能**:
- CSS内联
- CSS缓存
- 缓存管理
- 生成缓存头
- 清理过期缓存

**使用示例**:
```tsx
import { generateInlineCSS } from "@/lib/css-server";
import { getTheme } from "@/styles/theme";

const inlineCSS = generateInlineCSS(getTheme("windows"));

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <style dangerouslySetInnerHTML={{ __html: inlineCSS }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

## 📊 状态管理Store

### 16. useThemeStore

**文件**: `src/store/useThemeStore.ts`

**用途**: 主题状态管理

**接口**:
```typescript
interface ThemeState {
  currentTheme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  getThemeConfig: () => ThemeConfig;
  getCSSVariables: () => string;
  themeList: Array<{ value: ThemeType; label: string }>;
}
```

### 17. useIDEStore

**文件**: `src/store/useIDEStore.ts`

**用途**: IDE状态管理

**接口**:
```typescript
interface IDEState {
  fileTree: FileItem[];
  currentFile: string | null;
  openFiles: string[];
  activeEditor: string | null;
  panels: Record<string, PanelState>;
  sidebarVisible: boolean;
  statusBarVisible: boolean;
  toolbarVisible: boolean;
  docBlocks: DocBlockState[];
  activeDocBlock: string | null;
  settings: IDESettings;
  // ... 方法
}
```

### 18. useWorkspaceStore

**文件**: `src/store/useWorkspaceStore.ts`

**用途**: 工作区状态管理

**接口**:
```typescript
interface WorkspaceState {
  workspaces: WorkspaceConfig[];
  currentWorkspace: string | null;
  // ... 方法
}
```

### 19. useCollaborationStore

**文件**: `src/store/useCollaborationStore.ts`

**用途**: 协作状态管理

**接口**:
```typescript
interface CollaborationState {
  isConnected: boolean;
  connectionStatus: "disconnected" | "connecting" | "connected" | "error";
  currentRoom: CollaborationRoom | null;
  collaborators: Collaborator[];
  // ... 方法
}
```

## 🎯 使用模式

### 1. 基础使用

```tsx
import EnhancedIDELayout from "@/components/EnhancedIDELayout";

export default function Home() {
  return <EnhancedIDELayout />;
}
```

### 2. 自定义布局

```tsx
import { useState } from "react";
import WindowManager from "@/components/WindowManager";
import WorkspaceManager from "@/components/WorkspaceManager";
import CollaborationPanel from "@/components/CollaborationPanel";

export default function CustomLayout() {
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [showCollaboration, setShowCollaboration] = useState(false);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ height: 48, background: "var(--color-surface)" }}>
        <button onClick={() => setShowWorkspace(true)}>工作区</button>
        <button onClick={() => setShowCollaboration(true)}>协作</button>
      </header>

      {/* Main Area */}
      <main style={{ flex: 1, overflow: "hidden" }}>
        <WindowManager />
      </main>

      {/* Modals */}
      {showWorkspace && (
        <WorkspaceManager onClose={() => setShowWorkspace(false)} />
      )}
      {showCollaboration && (
        <CollaborationPanel onClose={() => setShowCollaboration(false)} />
      )}
    </div>
  );
}
```

### 3. 懒加载模式

```tsx
import { LazyWindowManager, LazyWorkspaceManager } from "@/components/LazyComponents";

export default function App() {
  return (
    <>
      <LazyWindowManager />
      <LazyWorkspaceManager />
    </>
  );
}
```

## 🔧 组件通信

### 1. Props传递

```tsx
// 父组件
function Parent() {
  const [theme, setTheme] = useState("windows");

  return <Child theme={theme} onThemeChange={setTheme} />;
}

// 子组件
function Child({ theme, onThemeChange }) {
  return <button onClick={() => onThemeChange("macos")}>切换主题</button>;
}
```

### 2. Context API

```tsx
// 创建Context
const MyContext = createContext();

// 提供者
function Provider({ children }) {
  const [state, setState] = useState(initialState);
  return (
    <MyContext.Provider value={{ state, setState }}>
      {children}
    </MyContext.Provider>
  );
}

// 消费者
function Consumer() {
  const { state, setState } = useContext(MyContext);
  return <div>{state}</div>;
}
```

### 3. Zustand Store

```tsx
// Store
import { create } from "zustand";

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// 组件
function Counter() {
  const { count, increment } = useStore();
  return <button onClick={increment}>{count}</button>;
}
```

## 📈 性能优化

### 1. 懒加载

```tsx
import dynamic from "next/dynamic";

const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});
```

### 2. 虚拟滚动

```tsx
import { FixedSizeList as List } from "react-window";

const Row = ({ index, style }) => (
  <div style={style}>Row {index}</div>
);

function VirtualList() {
  return (
    <List
      height={400}
      itemCount={1000}
      itemSize={35}
      width={300}
    >
      {Row}
    </List>
  );
}
```

### 3. Memoization

```tsx
import { memo, useMemo } from "react";

const MemoizedComponent = memo(function Component({ data }) {
  return <div>{data}</div>;
});

function Parent() {
  const processedData = useMemo(() => {
    // 复杂计算
    return data.map(item => item * 2);
  }, [data]);

  return <MemoizedComponent data={processedData} />;
}
```

### 4. useCallback

```tsx
import { useCallback } from "react";

function Parent() {
  const handleClick = useCallback(() => {
    // 处理逻辑
  }, [dependencies]);

  return <Child onClick={handleClick} />;
}
```

## 🎨 样式系统

### 1. CSS变量

```css
:root {
  --color-primary: #0078d4;
  --color-background: #ffffff;
  --border-radius-md: 4px;
  --shadow-md: 0 2px 4px rgba(0,0,0,0.15);
}
```

### 2. Tailwind CSS

```tsx
<div className="flex items-center justify-center p-4 bg-surface text-text">
  <span className="font-mono text-sm">Content</span>
</div>
```

### 3. Ant Design覆盖

```css
.ant-layout {
  background: var(--color-background) !important;
}

.ant-btn-primary {
  background: var(--color-primary) !important;
}
```

## 🧪 测试组件

### 1. 单元测试

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ThemeSelector from "./ThemeSelector";

test("theme selector changes theme", async () => {
  const user = userEvent.setup();
  render(<ThemeSelector />);

  const button = screen.getByText("Windows");
  await user.click(button);

  expect(button).toHaveClass("active");
});
```

### 2. 集成测试

```tsx
import { render, screen } from "@testing-library/react";
import EnhancedIDELayout from "./EnhancedIDELayout";

test("renders IDE layout", () => {
  render(<EnhancedIDELayout />);

  expect(screen.getByText("webEnvOS")).toBeInTheDocument();
  expect(screen.getByText("文件资源管理器")).toBeInTheDocument();
});
```

## 📋 组件清单

| 组件 | 文件 | 状态 | 懒加载 | 用途 |
|------|------|------|--------|------|
| ThemeProvider | ThemeProvider.tsx | ✅ | ❌ | 主题管理 |
| IDELayout | IDELayout.tsx | ✅ | ❌ | 基础IDE布局 |
| EnhancedIDELayout | EnhancedIDELayout.tsx | ✅ | ✅ | 增强IDE布局 |
| WindowManager | WindowManager.tsx | ✅ | ✅ | 窗口管理 |
| FileTree | FileTree.tsx | ✅ | ✅ | 文件树 |
| Editor | Editor.tsx | ✅ | ✅ | 编辑器 |
| DocBlock | DocBlock.tsx | ✅ | ❌ | 文档区块 |
| DocBlockContainer | DocBlockContainer.tsx | ✅ | ✅ | 文档容器 |
| StatusBar | StatusBar.tsx | ✅ | ❌ | 状态栏 |
| CommandPalette | CommandPalette.tsx | ✅ | ✅ | 命令面板 |
| WorkspaceManager | WorkspaceManager.tsx | ✅ | ✅ | 工作区管理 |
| CollaborationPanel | CollaborationPanel.tsx | ✅ | ✅ | 协作面板 |
| ThemeSelector | ThemeSelector.tsx | ✅ | ❌ | 主题选择 |
| LazyComponents | LazyComponents.tsx | ✅ | ❌ | 懒加载集合 |
| CSS Server | css-server.ts | ✅ | ❌ | CSS服务端化 |

## 🔧 扩展指南

### 添加新组件

1. 创建组件文件 `src/components/NewComponent.tsx`
2. 定义接口和props
3. 实现组件逻辑
4. 导出组件
5. 在需要的地方使用

### 添加新Store

1. 创建store文件 `src/store/useNewStore.ts`
2. 定义state接口
3. 创建store
4. 导出store
5. 在组件中使用

### 添加新主题

1. 在 `src/styles/theme.ts` 添加主题配置
2. 更新 `themes` 映射
3. 主题选择器会自动显示

### 性能优化

1. 使用懒加载组件
2. 实现虚拟滚动
3. 使用memoization
4. 优化CSS内联
5. 配置代码分割

## 📝 最佳实践

### 1. 组件设计原则
- 单一职责
- 可组合
- 可复用
- 可测试

### 2. 状态管理
- 集中管理状态
- 使用Zustand
- 持久化存储
- 避免过度嵌套

### 3. 性能优化
- 懒加载组件
- 虚拟滚动
- Memoization
- 代码分割

### 4. 样式管理
- 使用CSS变量
- 避免全局样式
- 组件级样式
- 主题化设计

### 5. 测试策略
- 单元测试
- 集成测试
- E2E测试
- 性能测试

## 🎯 组件开发流程

1. **需求分析**: 确定组件功能和接口
2. **设计接口**: 定义props和state
3. **实现组件**: 编写组件代码
4. **添加样式**: 使用CSS变量和Tailwind
5. **测试验证**: 编写测试用例
6. **文档编写**: 添加使用文档
7. **性能优化**: 懒加载、memoization
8. **代码审查**: 确保质量

## 📚 参考资料

- [React文档](https://react.dev/)
- [Next.js文档](https://nextjs.org/docs)
- [Ant Design文档](https://ant.design/docs)
- [Tailwind CSS文档](https://tailwindcss.com/docs)
- [Zustand文档](https://zustand-demo.pmnd.rs/)
- [TypeScript文档](https://www.typescriptlang.org/docs/)

---

**文档版本**: 1.0
**更新时间**: 2026-01-22
**维护者**: Claude Code
