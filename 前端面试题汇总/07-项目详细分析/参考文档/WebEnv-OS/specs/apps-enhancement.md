# webEnvOS 应用增强需求规格说明书

本文档详细描述了对 webEnvOS 核心应用进行增强和重构的需求，旨在达到桌面级应用的用户体验。

## 1. 3D 资源监视器 (ResourceMonitorApp)

**目标**: 替换原有的简单 `ThreeDViewer`，构建一个极具视觉冲击力的 3D 系统资源展示应用。

### 1.1 功能需求
*   **实时数据展示**: 实时显示 CPU 负载、内存使用率、网络流量。
*   **3D 可视化**:
    *   **CPU**: 使用 3D 柱状图矩阵或动态波浪网格，高度/颜色随负载变化。
    *   **内存**: 使用粒子系统或液体容器，填充高度代表内存占用。
    *   **网络**: 使用流动的光线或管道，流速代表带宽使用率。
*   **交互性**: 支持鼠标旋转、缩放视角 (OrbitControls)。支持点击特定模块查看详细数值。
*   **数据源**:
    *   优先连接后端 WebSocket (`/system/stream`) 获取宿主机真实数据。
    *   若后端不可用，则回退到 WebContainer 模拟数据或浏览器性能 API (`window.performance`)。

### 1.2 UI 设计
*   **风格**:赛博朋克 (Cyberpunk) 或 科幻 HUD 风格。深色背景，高亮霓虹配色。
*   **布局**: 全屏 3D 场景，四周悬浮半透明 HUD 面板显示具体数值。

---

## 2. Docker Desktop 复刻版 (DockerApp)

**目标**: 提供一个功能完备的 Docker 管理界面，对标 Docker Desktop。

### 2.1 功能需求
*   **Dashboard (概览)**: 统计运行中/停止的容器数量，镜像总大小，磁盘占用。
*   **Containers (容器管理)**:
    *   列表视图：状态图标、名称、镜像、端口映射、CPU/内存实时占用（若 API 支持）。
    *   操作：启动、停止、重启、删除、查看日志、进入终端 (Exec)。
    *   批量操作：全选启动/停止/删除。
*   **Images (镜像管理)**:
    *   列表视图：标签、ID、创建时间、大小。
    *   操作：运行 (Run)、删除、推送到 Hub (可选)。
    *   拉取镜像：提供输入框 `docker pull`。
*   **Volumes (卷管理)**: 列出和删除 Docker Volume。
*   **Settings (设置)**: 配置 Docker Engine 选项 (如 Registry Mirrors)。

### 2.2 技术实现
*   **API Client**: 封装 `src/lib/api/docker.ts`，调用后端 NestJS 接口。
*   **终端集成**: 在“进入终端”功能中，复用 `TerminalApp` 组件，通过 WebSocket 连接到后端 `docker exec` 流。

---

## 3. 文本编辑器增强 (TextEditorApp)

**目标**: 将 `src/components/desktop/TextEditor.tsx` 重构为基于内核 VFS 的专业编辑器。

### 3.1 功能需求
*   **VFS 集成**: 直接读写 ZenFS (`/mnt/local`, `/home`)，不再使用 Mock 数据。
*   **多标签页**: 支持同时打开多个文件。
*   **语法高亮**: 自动识别文件扩展名，应用 Monaco Editor 语言模式。
*   **自动保存**: 配置项控制是否自动保存。
*   **快捷键**: `Ctrl+S` 保存，`Ctrl+W` 关闭标签。

---

## 4. 任务管理器 (TaskManagerApp)

**目标**: 监控和管理 webEnvOS 内部的进程 (Web Workers, WebContainers)。

### 4.1 功能需求
*   **进程列表**: 列出所有通过 `Kernel.process` 启动的 Worker 和 WebContainer 实例。
*   **资源估算**: (如果浏览器支持) 显示 Worker 的内存估算。
*   **操作**: 强制结束进程 (Kill)。

---

## 5. 实施计划

1.  **清理阶段**: 删除 `src/lib/mock` 及所有相关引用。
2.  **API 客户端开发**: 实现 `src/lib/api/` 下的 Docker 和 System 客户端。
3.  **应用重构**: 依次重构 TextEditor, TaskManager。
4.  **新应用开发**: 开发 DockerApp 和 ResourceMonitorApp。
5.  **集成测试**: 验证所有应用与内核及后端的交互。
