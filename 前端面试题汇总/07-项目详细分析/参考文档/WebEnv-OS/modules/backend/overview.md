# 后端模块总览

后端是 webEnvOS 的控制平面，负责核心业务逻辑与基础设施编排。

## 核心职责
- **身份验证**: JWT 签发与验证。
- **资源编排**: 通过 Docker Engine 实例化计算环境。
- **文件系统桥接**: 提供 Web 端访问 Linux 目录的标准化 API。
- **终端流转发**: 作为 WebSocket 与 Docker Exec Stream 之间的双向异步中继。

## 技术栈
- **核心框架**: NestJS 11
- **数据库**: PostgreSQL (TypeORM)
- **容器驱动**: Dockerode
- **实时性**: Socket.io (WebSocket)
- **文档**: Swagger (自动生成的 REST API 说明)

## API 访问入口
- **开发地址**: `http://localhost:8082/api`
- **Swagger 文档**: `http://localhost:8082/api/docs`
