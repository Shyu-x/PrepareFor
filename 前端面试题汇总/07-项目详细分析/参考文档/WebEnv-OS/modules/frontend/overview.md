# 前端模块总览

前端是 webEnvOS 的视觉交互中心，旨在提供一个接近 macOS 原生体验的高性能 Web 桌面与 IDE。

## 核心设计理念
- **macOS 体验**: 固定 macOS 风格，采用毛玻璃与圆角设计。
- **原子化架构**: IDE、编辑器、桌面模块解耦，支持独立按需加载。
- **可选 Mock**: 内置 VFS Mock，必要时提供离线预览能力。

## 技术选型
- **核心框架**: Next.js 16.1.6 (App Router), React 19.2.3
- **UI 库**: Ant Design 6.3.0 (必须使用)
- **样式**: Tailwind CSS v4 (必须使用)
- **状态管理**: Zustand 5.0.11 + SWR 2.3.8
- **编辑器**: Monaco Editor (核心)
- **终端**: @xterm/xterm (新版包名)
- **动效**: Framer Motion 12.x (已改名为 motion)

## 目录结构分析
```bash
src/
├── app/              # 路由入口 (desktop, ide)
├── components/       
│   ├── desktop/      # 桌面核心 (Dock, MenuBar, WindowManager)
│   ├── ide/          # IDE 框架 (ActivityBar, Sidebar, PanelArea)
│   ├── editor/       # 核心编辑器 (EditorPane, CodeEditor)
│   └── ui/           # 高频原子 UI
├── store/            # 领域状态 (Theme, IDE, Editor, Workspace)
├── lib/mock/         # 前端仿真层 (VFS, Mock Data)
└── styles/           # 全局样式与主题配置
```