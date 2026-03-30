# 状态管理 (Zustand Stores)

webEnvOS 前端状态被切分为多个领域驱动的 Store，以确保最小颗粒度的渲染性能。

## 1. useThemeStore
管理全局视觉状态。
- **核心状态**: `isDarkMode: boolean`。
- **注入机制**: 根据状态调用 `generateCSSVariables` 并修改 `documentElement` 样式。

## 2. useIDEStore
IDE 的“控制总线”。
- **管理内容**: 
    - `sidebarVisible`: 侧边栏开关。
    - `openFiles`: 当前已打开的文件路径数组。
    - `currentFile`: 活动文件的路径。
    - `panels`: 底部面板 (Terminal, Output) 的状态。

## 3. useEditorStore
针对代码编辑器的垂直状态管理。
- **主要用途**: 记录编辑器内未保存的变更（Dirty State）。

## 4. useWorkspaceStore
后端云环境连接状态。
- **属性**: `currentWorkspaceId`, `connectionStatus`。

## 5. useFileSystem (Hooks + VFS)
虽非 Store，但负责 VFS 与组件间的数据同步。
- **核心对象**: `vfs` (VirtualFileSystemService 实例)。
- **持久化**: 自动同步至 LocalStorage。