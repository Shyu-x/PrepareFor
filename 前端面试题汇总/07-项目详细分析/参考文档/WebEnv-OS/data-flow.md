# 数据流与状态同步机制

本文档详细描述 webEnvOS 在操作过程中的数据流转、事件传播以及前后端同步逻辑。

## 1. 前端内部状态流 (Store Flux)

### 1.1 主题切换流
1. 用户点击 MenuBar 的 **Control Center**。
2. 触发 `useThemeStore.toggleDarkMode()`。
3. Store 更新 `isDarkMode` 布尔值并持久化。
4. `ThemeProvider` 监听该值：
    - 调用 `generateCSSVariables(currentTheme)`。
    - 动态修改 `:root` 下的 CSS 变量。
    - 触发 Ant Design 的 `ConfigProvider` 重新计算 Token。

### 1.2 IDE 文件打开流
1. `FileTree` 组件被双击。
2. 动作 A: `useIDEStore.addOpenFile(path)` 将路径加入列表。
3. 动作 B: `useIDEStore.setCurrentFile(path)` 设置活动标签。
4. `EditorPane` 渲染，检测到 `currentFile` 变更。
5. `useFileContent(path)` Hook 启动：
    - 检查 SWR 缓存。
    - 缓存失效则从后端 `GET /api/files/content?path=...` 获取。
    - 返回结果喂给 `MonacoEditor`。

## 2. 前后端双向同步 (C/S Sync)

### 2.1 文件自动保存
- 前端 `CodeEditor` 的 `onChange` 事件防抖 (Debounce) 触发。
- 调用 `vfs.writeFile(id, content)` 更新本地内存与 LocalStorage。
- 后台触发 API 请求 `PUT /api/files` 同步至物理磁盘。

### 2.2 终端流实时性
- **输入**: 前端 React 事件 -> `terminalGateway.emit('terminal:input')` -> 后端 Service -> Docker PTY Stdin。
- **输出**: Docker PTY Stdout -> 后端 `stream.on('data')` -> `client.emit('terminal:output')` -> 前端 `Terminal` 渲染。

## 3. 跨应用通信 (Event Bus)

webEnvOS 使用 Zustand 作为隐式的事件总线：
- **场景**: 终端输入 `ide` 命令。
- **流程**:
    1. `Terminal` 组件解析到 `ide` 指令。
    2. 执行 `router.push('/ide')`。
    3. 如果是在同一个桌面环境下打开，则可能通过 `useIDEStore` 触发打开 IDE 窗口的动作。

## 4. 异常数据处理
- **网络中断**: 前端切换为 `Mock VFS` 模式，所有写操作记录在持久化队列中。
- **并发冲突**: (规划中) 采用 OT (Operational Transformation) 算法解决多人协作编辑时的冲突。
