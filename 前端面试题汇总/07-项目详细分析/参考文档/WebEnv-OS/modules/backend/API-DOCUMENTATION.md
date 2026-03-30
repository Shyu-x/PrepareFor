# webEnvOS Backend API Documentation

## 📋 概述

webEnvOS 后端提供 RESTful API 和 WebSocket 实时协作功能。API 基于 NestJS 构建，支持 JWT 认证和 Swagger 文档。

## 🚀 快速开始

### 启动服务器
```bash
cd webenv-backend
npm run start:dev
```

### 访问地址
- **API 根地址**: http://localhost:8082/api
- **Swagger 文档**: http://localhost:8082/api/docs
- **WebSocket**: ws://localhost:8082/collaboration

## 🔐 认证

### 登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**响应**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "username": "admin",
    "email": "admin@webenv.com",
    "role": "admin"
  }
}
```

### 注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123"
}
```

### 获取用户信息
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### 更新用户信息
```http
POST /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newemail@example.com"
}
```

## 📁 文件管理

### 获取文件树
```http
GET /api/files/tree
```

**响应**:
```json
[
  {
    "id": "root",
    "name": "workspace",
    "type": "folder",
    "path": "/",
    "children": [...]
  }
]
```

### 获取文件内容
```http
GET /api/files/content?path=/src/app/page.tsx
```

### 创建文件
```http
POST /api/files
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "newfile.tsx",
  "type": "file",
  "path": "/src/newfile.tsx",
  "content": "console.log('hello');",
  "language": "typescript"
}
```

### 更新文件
```http
PUT /api/files/:path
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "console.log('updated');"
}
```

### 删除文件
```http
DELETE /api/files/:path
Authorization: Bearer <token>
```

### 重命名文件
```http
PUT /api/files/rename/:path
Authorization: Bearer <token>
Content-Type: application/json

{
  "newPath": "/src/newname.tsx"
}
```

### 搜索文件
```http
GET /api/files/search?query=page
```

## 🏢 工作区管理

### 获取所有工作区
```http
GET /api/workspaces
Authorization: Bearer <token>
```

### 获取工作区详情
```http
GET /api/workspaces/:id
Authorization: Bearer <token>
```

### 创建工作区
```http
POST /api/workspaces
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "我的工作区",
  "description": "这是一个测试工作区",
  "theme": "windows"
}
```

### 更新工作区
```http
PUT /api/workspaces/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "更新后的工作区",
  "theme": "macos"
}
```

### 删除工作区
```http
DELETE /api/workspaces/:id
Authorization: Bearer <token>
```

### 导出工作区
```http
GET /api/workspaces/:id/export
Authorization: Bearer <token>
```

### 导入工作区
```http
POST /api/workspaces/import
Authorization: Bearer <token>
Content-Type: application/json

{
  "json": "{...}"
}
```

### 复制工作区
```http
POST /api/workspaces/:id/duplicate
Authorization: Bearer <token>
Content-Type: application/json

{
  "newName": "工作区副本"
}
```

## 🤝 协作管理

### 创建协作房间
```http
POST /api/collaboration/room
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "开发协作室",
  "description": "团队开发协作"
}
```

### 获取房间列表
```http
GET /api/collaboration/room
Authorization: Bearer <token>
```

### 获取房间详情
```http
GET /api/collaboration/room/:id
Authorization: Bearer <token>
```

### 加入房间
```http
POST /api/collaboration/room/:id/join
Authorization: Bearer <token>
Content-Type: application/json

{
  "userName": "Alice"
}
```

### 离开房间
```http
POST /api/collaboration/room/:id/leave
Authorization: Bearer <token>
```

### 删除房间
```http
DELETE /api/collaboration/room/:id
Authorization: Bearer <token>
```

## 🐳 容器管理

### 获取所有容器
```http
GET /api/containers
Authorization: Bearer <token>
```

### 获取容器详情
```http
GET /api/containers/:id
Authorization: Bearer <token>
```

### 创建容器
```http
POST /api/containers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "my-container",
  "image": "ubuntu:22.04",
  "ports": ["8080:80"],
  "environment": {
    "WEBENV_USER": "webenv",
    "WEBENV_PASSWORD": "webenv123"
  }
}
```

### 启动容器
```http
PUT /api/containers/:id/start
Authorization: Bearer <token>
```

### 停止容器
```http
PUT /api/containers/:id/stop
Authorization: Bearer <token>
```

### 删除容器
```http
DELETE /api/containers/:id
Authorization: Bearer <token>
```

### 获取容器日志
```http
GET /api/containers/:id/logs
Authorization: Bearer <token>
```

### 获取所有部署
```http
GET /api/containers/deployments
Authorization: Bearer <token>
```

### 创建部署
```http
POST /api/containers/deployments
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "webenv-deployment",
  "namespace": "default",
  "replicas": 2,
  "image": "webenv/webenv-os:latest",
  "ports": [8081],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 扩展部署
```http
PUT /api/containers/deployments/:id/scale
Authorization: Bearer <token>
Content-Type: application/json

{
  "replicas": 3
}
```

### 获取部署状态
```http
GET /api/containers/deployments/:id/status
Authorization: Bearer <token>
```

## 🔄 WebSocket 实时协作

### 连接
```javascript
const socket = io('ws://localhost:8082/collaboration', {
  transports: ['websocket']
});
```

### 加入房间
```javascript
socket.emit('joinRoom', {
  roomId: 'room-123',
  userId: 'user-1',
  userName: 'Alice'
});
```

### 发送光标位置
```javascript
socket.emit('cursor', {
  roomId: 'room-123',
  userId: 'user-1',
  cursor: {
    x: 100,
    y: 100,
    line: 10,
    column: 5
  }
});
```

### 发送选择范围
```javascript
socket.emit('selection', {
  roomId: 'room-123',
  userId: 'user-1',
  selection: {
    start: { line: 10, column: 5 },
    end: { line: 15, column: 20 }
  }
});
```

### 发送编辑操作
```javascript
socket.emit('edit', {
  roomId: 'room-123',
  userId: 'user-1',
  filePath: '/src/app/page.tsx',
  content: 'console.log("hello");'
});
```

### 发送文件变更
```javascript
socket.emit('fileChange', {
  roomId: 'room-123',
  userId: 'user-1',
  filePath: '/src/newfile.tsx',
  action: 'create'
});
```

### 接收事件
```javascript
// 用户加入
socket.on('userJoined', (data) => {
  console.log(`${data.userName} 加入了房间`);
});

// 用户离开
socket.on('userLeft', (data) => {
  console.log(`用户 ${data.userId} 离开了房间`);
});

// 接收光标
socket.on('cursor', (data) => {
  // 更新协作者光标位置
});

// 接收选择
socket.on('selection', (data) => {
  // 更新协作者选择范围
});

// 接收编辑
socket.on('edit', (data) => {
  // 更新文件内容
});

// 接收文件变更
socket.on('fileChange', (data) => {
  // 更新文件树
});
```

## 📊 响应格式

### 成功响应
```json
{
  "statusCode": 200,
  "message": "操作成功",
  "data": {...}
}
```

### 错误响应
```json
{
  "statusCode": 404,
  "message": "资源不存在",
  "error": "Not Found"
}
```

## 🔧 错误码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（缺少token或token无效） |
| 403 | 禁止访问（无权限） |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 📝 使用示例

### 完整工作流程

1. **注册/登录**
```bash
# 注册
curl -X POST http://localhost:8082/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"test123"}'

# 登录
curl -X POST http://localhost:8082/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}'
```

2. **获取token**
```bash
# 保存token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

3. **创建工作区**
```bash
curl -X POST http://localhost:8082/api/workspaces \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"我的项目","description":"测试项目"}'
```

4. **创建文件**
```bash
curl -X POST http://localhost:8082/api/files \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"app.tsx","type":"file","path":"/src/app.tsx","content":"console.log(123);","language":"typescript"}'
```

5. **创建协作房间**
```bash
curl -X POST http://localhost:8082/api/collaboration/room \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"团队开发","description":"实时协作"}'
```

6. **WebSocket协作**
```javascript
// 前端代码
const socket = io('ws://localhost:8082/collaboration');
socket.emit('joinRoom', { roomId: 'room-1', userId: 'user-1', userName: 'Alice' });
```

## 🎯 端口配置

- **后端API**: 8082
- **前端**: 8081
- **WebSocket**: 8082

## 📚 技术栈

- **框架**: NestJS 11
- **数据库**: 内存存储（可扩展为PostgreSQL）
- **认证**: JWT + Passport
- **实时通信**: Socket.io
- **文档**: Swagger/OpenAPI
- **验证**: class-validator

## 🔒 安全说明

1. **JWT密钥**: 生产环境请修改 `webenv-secret-key-change-in-production`
2. **CORS**: 配置了允许的域名列表
3. **速率限制**: 建议添加速率限制中间件
4. **输入验证**: 所有输入都经过验证

## 🚀 部署

### 开发环境
```bash
npm run start:dev
```

### 生产环境
```bash
npm run build
npm run start:prod
```

### Docker
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

## 📞 支持

如有问题，请查看：
1. Swagger 文档: http://localhost:8082/api/docs
2. NestJS 文档: https://nestjs.com/docs
3. 项目文档: 查看项目根目录的文档文件

---

**文档版本**: 1.0
**更新时间**: 2026-01-22
**维护者**: Claude Code
