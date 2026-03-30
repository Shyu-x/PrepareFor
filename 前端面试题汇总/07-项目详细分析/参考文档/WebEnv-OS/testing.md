# 测试指南

## 1. 后端测试

- **单元测试**: `npm run test`。
- **端到端测试**: `npm run test:e2e`。

### 后端 API 测试

```bash
cd webenv-backend
npm run test:e2e
```

测试覆盖：
- 健康检查
- 认证（登录、注册）
- 工作区管理
- 文件管理
- 开发服务器
- Docker 容器
- 系统信息

## 2. 前端验证

- **构建测试**: `npm run build`。
- **Lint 检查**: `npm run lint`。

## 3. Playwright 端到端测试

### 安装依赖

```bash
cd webenv-os
npx playwright install chromium
```

### 运行测试

```bash
# 运行所有测试
cd D:/Develeping/webEnv
npx playwright test

# 运行特定测试文件
npx playwright test tests/e2e.spec.ts
npx playwright test tests/workflow.spec.ts
npx playwright test tests/claude-docker.spec.ts

# 在 headed 模式下运行
npx playwright test --headed
```

### 测试文件

- `tests/e2e.spec.ts` - 基础端到端测试
- `tests/workflow.spec.ts` - 完整工作流测试
- `tests/claude-docker.spec.ts` - Claude Code 和 Docker 测试

### 工作流测试覆盖

1. 创建文件夹
2. 创建工作区
3. 在工作区创建文件
4. 获取文件树
5. 搜索文件
6. 获取开发服务器状态
7. 启动开发服务器
8. 获取容器列表
9. 获取系统信息
10. 获取系统指标
11. 停止开发服务器
12. 获取工作区统计

### Claude Code 和 Docker 测试

测试文件：`tests/claude-docker.spec.ts`

覆盖功能：
- 管理员账户登录（xu/123456）
- Docker 信息获取
- 容器列表、统计
- 镜像管理（搜索、列表）
- 网络管理
- 卷管理
- 开发服务器启动/停止
- 系统信息获取

API 密钥配置：
- Claude Code API 密钥已内置在测试文件中
- 使用默认管理员账户 xu 进行认证

## 4. 手动验证流程

1. 启动后端并确认 Docker 连接正常。
2. 登录前端，创建一个名为 "Test Workspace" 的工作区。
3. 开启终端，执行 `uname -a` 确认容器内核。
4. 停止工作区，检查 Docker 容器是否被正确释放。

## 5. 桌面验证流程

1. 访问 `/desktop`，检查桌面与 Dock 是否正确渲染。
2. 点击 Dock 图标，窗口是否能打开与聚焦。
3. 单实例应用重复点击时，焦点是否跳转到已有窗口。
4. 右键 Dock 图标，是否能关闭该应用全部窗口。
5. 在设置中切换壁纸（预设/图片/视频）。
