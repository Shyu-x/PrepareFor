# 前端组件详细剖析

本文档对 webEnvOS 前端的核心组件进行技术层面的深度解读。

## 1. 桌面基础设施 (Desktop Infrastructure)

### 1.1 WindowManager (窗口管理器)
- **源码**: `src/components/desktop/WindowManager.tsx`
- **内部状态**: 维护一个 `WindowItem[]` 数组，包含每个窗口的 `zIndex`, `position`, `size` 及 `minimized` 等元数据。
- **层级逻辑**: 每次点击或聚焦窗口时，会将该窗口的 `zIndex` 设置为 `max(all_z_index) + 1`。
- **渲染策略**: 直接渲染可见窗口列表，支持聚焦/恢复/最小化。

### 1.2 Dock (智能底栏)
- **源码**: `src/components/desktop/Dock.tsx`
- **动效实现**: 根据 hover 计算缩放比例，提供 macOS 风格放大效果。
- **微交互**: 运行指示点、计数徽标、右键关闭全部窗口。

## 2. 桌面应用 (Desktop Apps)

### 2.1 Terminal (交互式终端)
- **源码**: `src/components/desktop/Terminal.tsx`
- **核心逻辑**:
    - 通过 Socket.io 与后端终端网关建立会话。
    - `mode` 切换不同容器会话（webenvos/debian）。

### 2.2 FileManager (文件管理器)
- **源码**: `src/components/desktop/FileManager.tsx`
- **视图切换**: 通过 `activeTab` 维持文件/收藏/最近等视图。
- **数据来源**: 结合本地 VFS 与后端文件接口完成操作。

## 3. IDE 核心组件 (IDE Core)

### 3.1 MonacoEditor (原子编辑器)
- **源码**: `src/components/editor/CodeEditor.tsx`
- **封装特性**:
    - **路径建模**: 每一个文件路径映射为一个唯一的 Monaco Model URI，确保 Tab 切换时不丢失撤销历史 (Undo/Redo Stack)。
    - **自适应布局**: 监听容器高度变化，调用 `editor.layout()`。
    - **多语言映射**: 根据文件后缀名自动切换 `languageId` (如 `.tsx` -> `typescript`)。

### 3.2 EditorPane (多标签管理)
- **源码**: `src/components/editor/EditorPane.tsx`
- **缓存策略**: 结合 `useFileContent` Hook，利用 SWR 的 `dedupingInterval` 避免短时间内重复读取磁盘数据。
- **标签联动**: 深度绑定 `useIDEStore.openFiles`，实现侧边栏文件树与顶部标签栏的强同步。

## 4. UI 原子组件 (UI Atoms)

### 4.1 Window (窗口原子)
- **Props**:
    - `windowControls`: 当前仅支持 `macos`。
    - `resizable`, `draggable`: 布尔值，控制交互锁。
- **样式**: `.glass` + `.window-shadow`。

### 4.2 SVGIcon
- **逻辑**: 自动补全 `/icons/` 前缀，解决静态资源引用路径问题。
- **防错**: 处理 `img.alt` 为空，防止图片加载失败时显示重叠文本。
