# webEnvOS Backend

webEnvOS 的后端服务，基于 NestJS 构建，提供 RESTful API 和 WebSocket 实时协作功能。

## 🚀 快速开始

### 前置要求
- Node.js 18+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run start:dev
```

服务器将在 http://localhost:8082 启动

### 访问 API 文档
打开浏览器访问: http://localhost:8082/api/docs

## 📁 项目结构

```
src/
├── modules/
│   ├── auth/              # 认证模块
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   └── jwt.strategy.ts
│   │
│   ├── files/             # 文件管理模块
│   │   ├── files.module.ts
│   │   ├── files.service.ts
│   │   └── files.controller.ts
│   │
│   ├── workspaces/        # 工作区管理模块
│   │   ├── workspaces.module.ts
│   │   ├── workspaces.service.ts
│   │   └── workspaces.controller.ts
│   │
│   ├── collaboration/     # 协作模块
│   │   ├── collaboration.module.ts
│   │   ├── collaboration.service.ts
│   │   ├── collaboration.controller.ts
│   │   └── collaboration.gateway.ts
│   │
│   └── containers/        # 容器管理模块
│       ├── containers.module.ts
│       ├── containers.service.ts
│       └── containers.controller.ts
│
├── app.module.ts          # 主模块
└── main.ts                # 入口文件
```

## 🔧 技术栈

- **框架**: NestJS 11
- **语言**: TypeScript
- **认证**: JWT + Passport
- **实时通信**: Socket.io
- **文档**: Swagger/OpenAPI
- **验证**: class-validator
- **加密**: bcrypt

## 📚 API 模块

### 1. 认证模块 (`/auth`)
- `POST /auth/login` - 用户登录
- `POST /auth/register` - 用户注册
- `GET /auth/profile` - 获取用户信息
- `POST /auth/profile` - 更新用户信息

### 2. 文件管理 (`/files`)
- `GET /files/tree` - 获取文件树
- `GET /files/content` - 获取文件内容
- `POST /files` - 创建文件
- `PUT /files/:path` - 更新文件
- `DELETE /files/:path` - 删除文件
- `PUT /files/rename/:path` - 重命名文件
- `GET /files/search` - 搜索文件

### 3. 工作区管理 (`/workspaces`)
- `GET /workspaces` - 获取所有工作区
- `GET /workspaces/:id` - 获取工作区详情
- `POST /workspaces` - 创建工作区
- `PUT /workspaces/:id` - 更新工作区
- `DELETE /workspaces/:id` - 删除工作区
- `GET /workspaces/:id/export` - 导出工作区
- `POST /workspaces/import` - 导入工作区
- `POST /workspaces/:id/duplicate` - 复制工作区

### 4. 协作管理 (`/collaboration`)
- `POST /collaboration/room` - 创建协作房间
- `GET /collaboration/room` - 获取房间列表
- `GET /collaboration/room/:id` - 获取房间详情
- `POST /collaboration/room/:id/join` - 加入房间
- `POST /collaboration/room/:id/leave` - 离开房间
- `DELETE /collaboration/room/:id` - 删除房间

**WebSocket 事件**:
- `joinRoom` - 加入房间
- `leaveRoom` - 离开房间
- `cursor` - 发送光标位置
- `selection` - 发送选择范围
- `edit` - 发送编辑操作
- `fileChange` - 发送文件变更

### 5. 容器管理 (`/containers`)
- `GET /containers` - 获取所有容器
- `GET /containers/:id` - 获取容器详情
- `POST /containers` - 创建容器
- `PUT /containers/:id/start` - 启动容器
- `PUT /containers/:id/stop` - 停止容器
- `DELETE /containers/:id` - 删除容器
- `GET /containers/:id/logs` - 获取容器日志
- `GET /containers/deployments` - 获取所有部署
- `POST /containers/deployments` - 创建部署
- `PUT /containers/deployments/:id` - 更新部署
- `DELETE /containers/deployments/:id` - 删除部署
- `PUT /containers/deployments/:id/scale` - 扩展部署
- `GET /containers/deployments/:id/status` - 获取部署状态

## 🔐 认证

所有需要认证的 API 都需要在请求头中添加 Bearer Token：

```http
Authorization: Bearer <your-jwt-token>
```

### 默认测试账号
- **用户名**: admin
- **密码**: admin123
- **角色**: admin

- **用户名**: user
- **密码**: user123
- **角色**: user

## 🎯 端口配置

- **后端API**: 8082
- **前端**: 8081
- **WebSocket**: 8082

## 📊 数据存储

当前使用内存存储，适合开发和测试。生产环境建议使用：
- PostgreSQL（关系型数据库）
- MongoDB（文档数据库）
- Redis（缓存和会话）

## 🚀 生产部署

### 环境变量
创建 `.env` 文件：
```env
PORT=8082
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=production
```

### 构建和启动
```bash
# 构建
npm run build

# 启动生产环境
npm run start:prod
```

### Docker 部署
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm run build
EXPOSE 8082
CMD ["npm", "run", "start:prod"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  webenv-backend:
    build: .
    ports:
      - "8082:8082"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=your-secret-key
    restart: unless-stopped
```

## 🧪 测试

```bash
# 单元测试
npm run test

# 测试覆盖率
npm run test:cov

# E2E 测试
npm run test:e2e
```

## 📝 开发指南

### 添加新模块
```bash
nest generate module users
nest generate service users
nest generate controller users
```

### 代码规范
```bash
# 格式化代码
npm run format

# 代码检查
npm run lint
```

## 🔒 安全注意事项

1. **JWT密钥**: 生产环境必须修改默认密钥
2. **CORS**: 配置允许的域名列表
3. **速率限制**: 建议添加速率限制中间件
4. **输入验证**: 所有输入都经过验证
5. **SQL注入**: 使用参数化查询（如果使用数据库）
6. **XSS防护**: 对输出进行转义

## 📚 参考资料

- [NestJS 文档](https://nestjs.com/docs)
- [NestJS Swagger](https://docs.nestjs.com/openapi/introduction)
- [Socket.io 文档](https://socket.io/docs/v4/)
- [JWT 文档](https://jwt.io/introduction/)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

UNLICENSED

---

**项目状态**: 开发中
**版本**: 0.1.0
**完成时间**: 2026-01-22
**开发者**: Claude Code
