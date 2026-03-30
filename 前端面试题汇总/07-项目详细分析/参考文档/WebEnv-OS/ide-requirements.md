# webEnvOS IDE 需求规格说明书（架构演进版）

> **注意**: 本文档已根据 `docs/GAP_ANALYSIS_AND_ROADMAP.md` 进行升级，聚焦于实现真实的操作系统能力。

## 1. 核心愿景调整
从“模拟 IDE UI”转向“**浏览器原生开发环境**”。不再仅仅是模仿 VS Code 的界面，而是要在浏览器中提供真实的 Node.js 运行时和 Linux 终端体验。

---

## 2. 功能需求细化

### 2.1 运行时环境 (Runtime Environment)
- **WebContainers 集成**:
  - **Node.js**: 支持在浏览器选项卡中原生运行 Node.js (v18+)。
  - **包管理**: 支持 `npm install` / `pnpm install`，直接从 NPM 注册表拉取依赖。
  - **HTTP 服务器**: 能够启动 Express/Next.js 开发服务器，并在浏览器内通过 iframe 预览 (如 `http://localhost:3000`)。
  - **安全性**: 所有代码执行必须限制在浏览器的安全沙箱内。

### 2.2 文件系统 (Virtual File System)
- **标准 POSIX 支持**: 废弃仅支持简单的读写，转向支持权限 (`chmod`)、符号链接 (`symlink`) 的完整文件系统。
- **混合存储后端 (ZenFS)**:
  - **IndexedDB**: 用于持久化存储项目文件 (默认)。
  - **Memory**: 用于 `/tmp` 和高速缓存。
  - **Native Mount**: 支持通过 File System Access API 挂载用户本地硬盘文件夹，实现真正的本地开发。

### 2.3 终端系统 (Terminal System)
- **Shell**: 集成 `jsh` (JavaScript Shell) 或类似 bash 的解释器。
- **管道 (Piping)**: 支持 `ls | grep` 等基础管道操作。
- **多会话**: 支持创建多个终端标签页，每个运行独立的进程。

### 2.4 版本控制 (Version Control)
- **Git 完整流**:
  - `clone`: 支持从 GitHub/GitLab 克隆公开仓库 (需解决 CORS 代理问题)。
  - `push/pull`: 支持通过 Personal Access Token 进行远程同步。
  - **差异对比**: 真正的 Monaco Diff Editor 集成，读取 git index 数据。

---

## 3. 非功能性需求

### 3.1 性能
- **冷启动**: 首次加载 WebContainer 需在 5秒 内完成。
- **持久化**: 刷新页面后，文件系统状态和打开的窗口必须完美恢复。

### 3.2 兼容性
- **Headers**: 必须配置 `Cross-Origin-Embedder-Policy: require-corp` 和 `Cross-Origin-Opener-Policy: same-origin` 以启用 SharedArrayBuffer (WebContainers 依赖)。

---

## 4. 差距与计划 (简述)

| 功能模块 | 当前状态 | 目标方案 | 优先级 |
| :--- | :--- | :--- | :--- |
| **内核** | React State | SystemProcess / IPC | P1 |
| **FS** | LocalStorage/IDB | ZenFS (Multi-backend) | P0 |
| **Exec** | Eval / Worker | WebContainers | P0 |
| **Net** | Fetch | Service Worker Proxy | P1 |

详细技术路线请参阅 [GAP_ANALYSIS_AND_ROADMAP.md](GAP_ANALYSIS_AND_ROADMAP.md)。
