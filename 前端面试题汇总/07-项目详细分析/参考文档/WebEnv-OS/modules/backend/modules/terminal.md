# 终端模块 (Terminal)

## 核心功能
- **容器抽象**: 封装 Docker API，提供对容器的生命周期控制。
- **流转发**: 桥接容器 PTY 与前端 WebSocket。
- **性能监控**: 实时获取 CPU/Memory 负载。

## 关键技术
- **Dockerode**: 核心驱动。
- **WebSocket Gateway**: 处理实时数据流。

## 主要接口 (HTTP)
- `POST /api/terminal/workspaces/:id/start`: 启动容器。
- `POST /api/terminal/workspaces/:id/stop`: 停止容器。
- `GET /api/terminal/workspaces/:id/status`: 健康检查。

## 主要消息 (WS)
- `session:start`: 请求建立新连接。
- `terminal:input`: 向容器写入指令。
- `terminal:output`: 向前端推送执行结果。
