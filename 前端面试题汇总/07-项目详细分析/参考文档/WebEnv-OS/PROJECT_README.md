# webEnvOS

webEnvOS 是一个基于 Web 的云端操作系统与 IDE 仿真环境。它旨在为开发者提供一个高度隔离、可定制且随处可用的桌面化工作空间。

## 🚀 项目愿景

通过浏览器交付完整的 Linux 开发环境体验，结合容器化技术实现资源隔离与环境一致性。同时支持**离线优先 (Offline First)**，确保在无网络环境下依然可用。

## 🛠 技术栈

- **前端**: Next.js 16.1.6 (App Router), React 19.2.3, Ant Design 6.3.0, Tailwind CSS v4, Zustand 5.0.11, Three.js 0.183.x
- **终端**: xterm.js（注意：新版包名为 @xterm/xterm）
- **编辑器**: Monaco Editor (@monaco-editor/react)
- **虚拟文件系统**: @zenfs/core + @zenfs/dom
- **浏览器运行时**: @webcontainer/api
- **版本控制**: isomorphic-git
- **后端**: NestJS, TypeScript, Dockerode, Socket.io, PostgreSQL
- **基础设施**: Docker (容器化执行环境)

## ✨ 核心特性

- **纯前端模式**: 基于 IndexedDB 的本地文件系统 (ZenFS)，无后端也可运行
- **WebContainer 运行时**: 在浏览器中原生运行 Node.js，支持 npm/pnpm
- **VS Code 风格 IDE**: 完整的代码编辑器体验，支持多标签页、文件树、终端
- **桌面环境**: macOS 风格桌面，包含窗口管理、任务栏、Dock 及多应用支持
- **AI 编程助手**: AI 对话、代码补全、代码解释 (支持 OpenAI/Claude)
- **Docker 管理**: 可视化容器管理、端口转发、环境变量配置

## 📁 项目结构

```
webenv-os/          # Next.js 前端应用 (主开发目录)
├── src/
│   ├── app/        # Next.js App Router 页面
│   ├── components/ # React 组件
│   │   ├── desktop/# 桌面组件 (Window, Dock, Taskbar, etc.)
│   │   ├── ide/   # IDE 组件 (Sidebar, PanelArea, etc.)
│   │   └── ai/    # AI 助手组件
│   ├── apps/      # 桌面应用程序
│   ├── store/     # Zustand 状态管理
│   ├── kernel/    # 内核模块 (进程管理、系统调用)
│   └── lib/      # 工具库 (文件系统、Git、Docker)
docs/              # 项目文档
scripts/           # 启动脚本
```

## 📂 文档导航

请访问 [docs/](docs/) 目录获取详细文档：

- [文档索引](docs/README.md) - 完整文档导航
- [架构设计](docs/architecture.md) - 系统分层、交互模型与核心机制
- [IDE 需求规格](docs/ide-requirements.md) - IDE 功能需求与实现详情
- [前端模块](docs/modules/frontend/overview.md) - UI 组件、状态管理
- [后端模块](docs/modules/backend/overview.md) - API 接口、业务逻辑与 Docker 调度

## 快速启动

### 前端开发 (推荐)

```bash
cd webenv-os
npm install
npm run dev
```

访问 `http://localhost:11451`

### 使用 Docker Compose

```bash
docker-compose up -d
```

或使用一键启动脚本：

```bash
# Windows
scripts\start.bat

# Linux/Mac
./scripts/start.sh
```

- **前端地址**: `http://localhost:11451`
- **后端 API**: `http://localhost:8082/api`

### 系统验证

运行全局验证脚本确保环境就绪：

```bash
# Linux/Mac
./scripts/verify.sh

# Windows
scripts\start.bat
```

---

*本项目遵循 [简体中文文档规范](docs/contribution.md)。*