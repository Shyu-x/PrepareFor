# IDE 核心组件解析

本文档详细解析 WebEnv-OS 项目中 IDE 核心组件的实现原理，包括布局结构、组件通信机制和快捷键系统。

## 1. IDELayout.tsx 完整解析

### 1.1 组件概述

`IDELayout.tsx` 是 IDE 的主布局组件，采用 **固定定位 + Flex 布局** 确保占满整个视口，不依赖父元素高度链。

```tsx
// 核心布局结构
<div style={{
  position: "fixed",
  top: 0, left: 0, right: 0, bottom: 0,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden"
}}>
  <MenuBar />                    // 顶部菜单栏
  <div style={{ flex: 1 }}>    // 主内容区
    <ActivityBar />             // 左侧活动栏
    <Sidebar />                  // 侧边栏
    <div style={{ flex: 1 }}>  // 编辑器区域
      <EditorPane />             // 编辑器窗格
      <PanelArea />              // 底部面板
    </div>
  </div>
  <StatusBar />                 // 底部状态栏
</div>
```

### 1.2 组件分层设计

```
IDELayout (根组件)
├── IDELayoutContent (内容组件 - 包含所有 hooks)
│   ├── MenuBar (菜单栏)
│   ├── ActivityBar (活动栏)
│   ├── Sidebar (侧边栏)
│   ├── EditorPane (编辑器窗格)
│   ├── PanelArea (底部面板)
│   ├── StatusBar (状态栏)
│   ├── CommandPalette (命令面板 - Modal)
│   ├── QuickOpen (快速打开 - Modal)
│   ├── GoToSymbol (跳转符号 - Modal)
│   ├── FindReplace (查找替换 - Modal)
│   ├── GlobalReplace (全局替换 - Modal)
│   └── WorkspaceManager (工作区管理 - Modal)
```

### 1.3 组件通信模式

IDELayout 使用 **Zustand Store** 进行状态管理，所有子组件通过 `useIDEStore` hook 访问和修改状态：

```tsx
// 从 Store 获取状态和方法
const {
  toggleSidebar,
  showBottomPanel,
  setActiveSidebarView,
  keybindings,
  currentFile,
  openFiles,
  setOpenFiles,
  setCurrentFile,
  appendRunOutput,
  clearRunOutput,
  renameFile,
  settings,
  workspaceRoot,
  setWorkspaceRoot,
  togglePreview,
} = useIDEStore();
```

### 1.4 快捷键系统实现

#### 1.4.1 快捷键定义

快捷键定义在 `useIDEStore.ts` 中：

```tsx
const defaultKeybindings: Record<KeybindingAction, string> = {
  quickOpen: "Ctrl+P",              // 快速打开
  goToSymbol: "Ctrl+Shift+O",      // 跳转符号
  goToSymbolGlobal: "Ctrl+T",       // 全局符号搜索
  commandPalette: "Ctrl+Shift+P",   // 命令面板
  findInFile: "Ctrl+F",             // 文件内查找
  replaceInFile: "Ctrl+H",         // 文件内替换
  replaceInFiles: "Ctrl+Shift+H",   // 全局替换
  toggleSidebar: "Ctrl+B",          // 切换侧边栏
  toggleTerminal: "Ctrl+`",         // 切换终端
  runActive: "Ctrl+Shift+R",        // 运行
  saveFile: "Ctrl+S",               // 保存
  formatDocument: "Shift+Alt+F",    // 格式化
  renameFile: "F2",                 // 重命名
  toggleComment: "Ctrl+/",           // 切换注释
  // ... 更多快捷键
};
```

#### 1.4.2 快捷键处理逻辑

```tsx
// 规范化按键组合
const normalizeCombo = (e: KeyboardEvent) => {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push("Ctrl");
  if (e.shiftKey) parts.push("Shift");
  if (e.altKey) parts.push("Alt");
  const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
  parts.push(key === "`" ? "`" : key);
  return parts.join("+");
};

// 键盘事件处理
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const combo = normalizeCombo(e);
    const match = Object.entries(keyMap).find(
      ([, value]) => value.toLowerCase() === combo.toLowerCase()
    );
    if (!match) return;
    const [action] = match;
    e.preventDefault();

    switch (action) {
      case "commandPalette":
        setCommandPaletteVisible(true);
        break;
      case "quickOpen":
        setQuickOpenVisible(true);
        break;
      // ... 更多 case
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [keyMap, ...dependencies]);
```

## 2. ActivityBar 活动栏组件解析

### 2.1 功能概述

ActivityBar 是 IDE 左侧的活动栏，类似 VSCode 的左侧图标栏，提供快速切换视图的功能。

### 2.2 视图配置

```tsx
const activities: ActivityItem[] = [
  { id: "files", icon: <FileOutlined />, tooltip: "资源管理器", position: "top" },
  { id: "snippets", icon: <FileTextOutlined />, tooltip: "代码片段", position: "top" },
  { id: "search", icon: <SearchOutlined />, tooltip: "搜索", position: "top" },
  { id: "git", icon: <BranchesOutlined />, tooltip: "源代码管理", position: "top" },
  { id: "debug", icon: <BugOutlined />, tooltip: "运行和调试", position: "top" },
  { id: "ports", icon: <GlobalOutlined />, tooltip: "端口转发", position: "bottom" },
  { id: "languages", icon: <CodeOutlined />, tooltip: "语言环境", position: "bottom" },
  { id: "docker", icon: <CloudServerOutlined />, tooltip: "Docker", position: "bottom" },
];
```

### 2.3 交互逻辑

- 点击图标切换到对应视图
- 再次点击同一图标关闭侧边栏
- 底部面板快捷方式（如端口、语言环境）直接打开底部面板

```tsx
const setActiveSidebarView = (view) => {
  const state = get();
  if (state.activeSidebarView === view && state.sidebarVisible) {
    // 再次点击同一图标，关闭侧边栏
    set({ sidebarVisible: false });
  } else {
    // 切换到新视图
    set({ activeSidebarView: view, sidebarVisible: true });
  }
};
```

## 3. Sidebar 侧边栏组件解析

### 3.1 功能概述

Sidebar 是侧边栏容器，根据 `activeSidebarView` 状态显示不同的面板内容。

### 3.2 面板映射

```tsx
const renderContent = () => {
  switch (activeSidebarView) {
    case "files":
      return <FileTree />;
    case "snippets":
      return <SnippetsPanel />;
    case "search":
      return <SearchPanel />;
    case "git":
      return <GitPanel />;
    case "debug":
      return <DebugPanel />;
    case "run":
      return <RunPanel />;
    case "languages":
      return <LanguagesPanel />;
    case "docker":
      return <DockerPanel />;
    // ... 更多面板
  }
};
```

### 3.3 可调整宽度

Sidebar 支持类似 VSCode 的拖拽调整宽度：

```tsx
// 拖拽处理
const handleMouseDown = (e: React.MouseEvent) => {
  e.preventDefault();
  setIsResizing(true);
  startXRef.current = e.clientX;
  startWidthRef.current = sidebarWidth;
};

useEffect(() => {
  if (!isResizing) return;
  const handleMouseMove = (e: MouseEvent) => {
    const deltaX = e.clientX - startXRef.current;
    const newWidth = startWidthRef.current + deltaX;
    if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= MAX_SIDEBAR_WIDTH) {
      setSidebarWidth(newWidth);
    }
  };
  // ... 拖拽结束处理
}, [isResizing]);
```

## 4. PanelArea 底部面板组件解析

### 4.1 功能概述

PanelArea 是 IDE 底部的面板区域，包含终端、问题、输出、调试控制台、预览等多个标签页。

### 4.2 标签页配置

```tsx
const TABS = [
  { id: "terminal", label: "终端" },
  { id: "problems", label: "问题" },
  { id: "output", label: "输出" },
  { id: "debug-console", label: "调试" },
  { id: "preview", label: "预览" },
  { id: "diff", label: "Diff" },
  { id: "ports", label: "端口" },
  { id: "references", label: "引用" },
  { id: "global-search", label: "搜索" },
];
```

### 4.3 面板类型

| 面板 | 功能描述 |
|-----|---------|
| terminal | 交互式终端（xterm.js），支持多标签页 |
| problems | 代码问题检测，显示错误、警告、信息 |
| output | 运行结果，显示命令执行输出 |
| debug-console | 调试输出 |
| preview | 页面预览 |
| diff | Diff 对比视图 |
| ports | 端口转发管理 |
| references | 符号引用搜索结果 |
| global-search | 全局搜索结果 |

### 4.4 可调整高度

类似 Sidebar，PanelArea 也支持拖拽调整高度：

```tsx
const handleMouseDown = (e: React.MouseEvent) => {
  e.preventDefault();
  setIsResizing(true);
  startYRef.current = e.clientY;
  startHeightRef.current = panelHeight;
};

const handleMouseMove = (e: MouseEvent) => {
  const deltaY = e.clientY - startYRef.current;
  const newHeight = startHeightRef.current - deltaY; // 反向：向上拖拽增加高度
  if (newHeight >= MIN_PANEL_HEIGHT && newHeight <= MAX_PANEL_HEIGHT) {
    setPanelHeight(newHeight);
  }
};
```

## 5. EditorPane 编辑器窗格解析

### 5.1 功能概述

EditorPane 管理多个打开的文件标签页，提供编辑器的容器功能。

### 5.2 核心功能

- 显示打开的文件标签页
- 支持标签页拖拽排序
- 显示文件修改状态（dirty indicator）
- 标签页关闭按钮

### 5.3 编辑器组件 CodeEditor

CodeEditor 是 Monaco 编辑器的 React 包装组件，核心特性：

```tsx
// Monaco 编辑器配置
<Editor
  height="100%"
  width="100%"
  path={path}
  language={currentLanguage}
  value={value}
  theme={isDarkMode ? "vs-dark" : "light"}
  onChange={onChange}
  onMount={handleEditorDidMount}
  options={{
    minimap: { enabled: true },
    fontSize: 14,
    fontFamily: "'SF Mono', Monaco, 'Cascadia Code', monospace",
    wordWrap: "on",
    automaticLayout: true,
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    cursorBlinking: "smooth",
    cursorSmoothCaretAnimation: "on",
    padding: { top: 16, bottom: 16 },
  }}
/>
```

### 5.4 LSP 智能提示集成

CodeEditor 集成了基于 WebSocket 的 LSP（Language Server Protocol）：

```tsx
// 启动语言服务器
const startLanguageServer = (langId: string, editorInstance) => {
  const backendUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001";
  const activeSocket = io(`${backendUrl}/lsp`, {
    transports: ["websocket"],
  });

  activeSocket.on("connect", () => {
    // 请求后端启动语言服务器容器
    activeSocket.emit("lsp:start", {
      workspaceId: workspaceRoot,
      language: langId,
    });
  });

  activeSocket.on("lsp:ready", (payload) => {
    // 初始化 Monaco Language Client
    initMonacoLanguageClient(activeSocket, langId);
  });
};
```

## 6. 命令面板系统（CommandPalette）

### 6.1 功能概述

CommandPalette 是类似 VSCode 的命令面板，提供快速搜索和执行命令的功能。

### 6.2 命令定义

```tsx
export interface Command {
  id: string;
  name: string;           // 命令名称
  description: string;    // 命令描述
  icon?: React.ReactNode; // 命令图标
  category: "file" | "edit" | "view" | "go" | "run" | "help" | "collaboration";
  shortcut?: string;      // 快捷键
  action: () => void;     // 执行函数
  enabled?: boolean;      // 是否可用
}
```

### 6.3 命令示例

```tsx
const commands: Command[] = [
  {
    id: "toggle-sidebar",
    name: "Toggle Sidebar",
    description: "Show/Hide the side bar",
    category: "view",
    shortcut: keybindings.toggleSidebar,
    action: () => toggleSidebar(),
  },
  {
    id: "toggle-terminal",
    name: "Toggle Terminal",
    description: "Show/Hide terminal panel",
    category: "view",
    shortcut: keybindings.toggleTerminal,
    action: () => showBottomPanel("terminal"),
  },
  // ... 更多命令
];
```

### 6.4 键盘导航

命令面板支持完整的键盘导航：

```tsx
const handleKeyDown = (e: KeyboardEvent) => {
  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      break;
    case "ArrowUp":
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      break;
    case "Enter":
      e.preventDefault();
      filteredCommands[selectedIndex].action();
      onClose();
      break;
    case "Escape":
      e.preventDefault();
      onClose();
      break;
  }
};
```

### 6.5 搜索过滤

```tsx
const filteredCommands = useMemo(() => {
  if (!searchTerm.trim()) {
    return commands.filter((cmd) => cmd.enabled !== false);
  }
  const term = searchTerm.toLowerCase();
  return commands.filter((cmd) => {
    if (cmd.enabled === false) return false;
    return (
      cmd.name.toLowerCase().includes(term) ||
      cmd.description.toLowerCase().includes(term) ||
      cmd.category.toLowerCase().includes(term)
    );
  });
}, [searchTerm, commands]);
```

## 7. 组件间通信最佳实践

### 7.1 状态提升模式

IDELayout 将状态提升到根组件，子组件通过 props 传递：

```tsx
// 父组件
function IDELayoutContent() {
  const [commandPaletteVisible, setCommandPaletteVisible] = useState(false);
  // ...
  return (
    <>
      <MenuBar onCommandPalette={() => setCommandPaletteVisible(true)} />
      <CommandPalette
        visible={commandPaletteVisible}
        onClose={() => setCommandPaletteVisible(false)}
      />
    </>
  );
}
```

### 7.2 Zustand 全局状态

复杂状态使用 Zustand Store 管理：

```tsx
// 定义 Store
export const useIDEStore = create<IDEState>()(
  persist(
    (set, get) => ({
      workspaceRoot: null,
      activeSidebarView: "files",
      // ... 更多状态
      setActiveSidebarView: (view) => set({ activeSidebarView: view }),
    }),
    { name: "ide-storage" }
  )
);

// 使用 Store
function Sidebar() {
  const { activeSidebarView, setActiveSidebarView } = useIDEStore();
  // ...
}
```

### 7.3 自定义事件

跨组件通信使用自定义事件：

```tsx
// 触发事件
const event = new CustomEvent('editor:goToLine', { detail: { line } });
window.dispatchEvent(event);

// 监听事件
useEffect(() => {
  const handleGoToLineEvent = (event: Event) => {
    const customEvent = event as CustomEvent;
    if (customEvent.detail?.line) {
      handleGoToLine(customEvent.detail.line);
    }
  };
  window.addEventListener("editor:goToLine", handleGoToLineEvent);
  return () => window.removeEventListener("editor:goToLine", handleGoToLineEvent);
}, [handleGoToLine]);
```
