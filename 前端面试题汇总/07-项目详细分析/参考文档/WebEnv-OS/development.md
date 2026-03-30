# 开发者配置与调试指南

本文档提供详细的环境变量说明、构建参数以及本地调试技巧。

## 1. 环境变量 (.env)

### 1.1 前端 (webenv-os)
| 变量名 | 说明 | 默认值 |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | 后端 API 地址 | `http://localhost:8082/api` |
| `NEXT_PUBLIC_WS_URL` | WebSocket 地址 | `http://localhost:8082` |
| `NEXT_PUBLIC_USE_MOCK` | 是否开启离线 VFS 模拟 | `true` |

### 1.2 后端 (webenv-backend)
| 变量名 | 说明 | 默认值 |
| :--- | :--- | :--- |
| `POSTGRES_HOST` | 数据库主机 | `localhost` |
| `DOCKER_HOST` | Docker 守护进程地址 | `npipe:////./pipe/docker_engine` (Win) |
| `JWT_SECRET` | 令牌签名密钥 | `webenv-super-secret` |

## 2. 构建参数与脚本

### 2.1 性能优化构建
```bash
# 生产环境预编译
npm run build
```
注意：项目在构建时会自动进行 TypeScript 类型检查和 ESLint 扫描。若存在布局不合规或类型错误，构建将中断。

### 2.2 开发端口配置
默认开发端口已配置为 **11451**。若需更改，请修改 `webenv-os/package.json` 中的 `dev` 脚本：
```json
"dev": "next dev -p YOUR_PORT"
```

### 2.3 桌面入口与壁纸
- 桌面入口：`/desktop`（macOS 固定主题）
- IDE 入口：`/ide`
- 壁纸可在设置中切换预设或自定义图片/视频

## 3. 调试技巧

### 3.1 监听 VFS 变更
在 Chrome 开发者工具的 `Application -> Local Storage` 中，可以实时查看到键名为 `webenv-mock-fs` 的数据，手动修改此数据可强制模拟文件损坏或大规模变更。

### 3.2 布局调试
使用组件内的 `debugger` 结合 `window.vfs` 全局对象，可以在控制台直接调用文件操作命令进行功能验证。

## 4. 测试覆盖

### 4.1 单元测试 (Jest)
后端核心逻辑（如路径解析、容器状态机）需通过单元测试：
```bash
cd webenv-backend
npm run test
```

### 4.2 视觉测试
前端视觉回归目前依赖本地运行 `npm run dev` 后的手动核对。关键核对点：
- 窗口缩放时 Monaco Editor 是否重绘布局。
- 深色模式下 Modal 背景是否出现硬编码颜色。
- 终端滚动条是否能正确触底。