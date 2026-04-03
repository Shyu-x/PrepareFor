# RESTful API设计最佳实践

## 目录

1. [RESTful API概述](#1-restful-api概述)
2. [URL设计规范](#2-url设计规范)
3. [HTTP方法与状态码](#3-http方法与状态码)
4. [请求与响应设计](#4-请求与响应设计)
5. [认证与授权](#5-认证与授权)
6. [API版本控制](#6-api版本控制)
7. [面试高频问题](#7-面试高频问题)

---

## 1. RESTful API概述

### 1.1 什么是REST？

REST（Representational State Transfer，表述性状态转移）是一种软件架构风格，用于设计网络应用程序的API。

### 1.2 REST核心原则

```
┌─────────────────────────────────────────────────────────────┐
│                    REST架构约束原则                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 客户端-服务器分离                                       │
│     ├── 关注点分离                                          │
│     ├── 客户端负责用户界面                                  │
│     └── 服务器负责数据存储和业务逻辑                        │
│                                                             │
│  2. 无状态                                                  │
│     ├── 每个请求包含所有必要信息                            │
│     ├── 服务器不保存客户端上下文                            │
│     └── 提高可伸缩性                                        │
│                                                             │
│  3. 可缓存                                                  │
│     ├── 响应应标明是否可缓存                                │
│     └── 减少服务器负载                                      │
│                                                             │
│  4. 统一接口                                                │
│     ├── 资源标识（URI）                                     │
│     ├── 通过表述操作资源                                    │
│     ├── 自描述消息                                          │
│     └── HATEOAS（超媒体作为应用状态引擎）                   │
│                                                             │
│  5. 分层系统                                                │
│     ├── 中间层（代理、网关）                                │
│     └── 提高可扩展性和安全性                                │
│                                                             │
│  6. 按需代码（可选）                                        │
│     └── 服务器可以扩展客户端功能                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 RESTful API设计原则

```typescript
// RESTful API设计原则

interface RESTfulPrinciples {
  // 资源为中心
  resourceOriented: {
    description: '以资源为中心设计API';
    example: 'GET /users, POST /articles';
  };

  // 使用HTTP动词
  httpMethods: {
    GET: '获取资源';
    POST: '创建资源';
    PUT: '更新资源（完整替换）';
    PATCH: '更新资源（部分更新）';
    DELETE: '删除资源';
  };

  // 无状态
  stateless: {
    description: '每个请求独立，不依赖之前的请求';
    example: '每次请求携带认证token';
  };

  // 统一接口
  uniformInterface: {
    description: '一致的URL结构和响应格式';
    example: '所有API返回统一的JSON结构';
  };

  // 层次化URL
  hierarchicalURL: {
    description: 'URL表示资源之间的层次关系';
    example: '/users/123/posts/456';
  };
}
```

---

## 2. URL设计规范

### 2.1 URL命名规范

```typescript
// URL设计规范

// ✅ 正确的URL设计

// 1. 使用名词表示资源
GET    /users              // 获取用户列表
GET    /users/123          // 获取指定用户
POST   /users              // 创建用户
PUT    /users/123          // 更新用户
DELETE /users/123          // 删除用户

// 2. 使用复数形式
GET    /articles           // ✅ 正确
GET    /article            // ❌ 错误

// 3. 使用小写字母
GET    /user-profiles      // ✅ 正确（kebab-case）
GET    /userProfiles       // ❌ 错误
GET    /UserProfiles       // ❌ 错误

// 4. 层次关系
GET    /users/123/posts              // 用户的文章列表
GET    /users/123/posts/456          // 用户的指定文章
POST   /users/123/posts              // 为用户创建文章

// 5. 避免动词
GET    /users                        // ✅ 正确
GET    /getUsers                     // ❌ 错误
DELETE /users/123                    // ✅ 正确
GET    /deleteUser/123               // ❌ 错误

// 6. 使用查询参数过滤
GET    /articles?status=published&category=tech
GET    /articles?sort=-created_at&page=1&limit=20

// 7. 非CRUD操作使用动词（作为子资源）
POST   /articles/123/publish         // 发布文章
POST   /orders/456/cancel            // 取消订单
POST   /users/123/follow             // 关注用户

// 8. 版本控制
GET    /v1/users
GET    /v2/users

// 9. 特殊操作
GET    /search?q=keyword             // 搜索
GET    /users/me                     // 当前用户
POST   /auth/login                   // 登录
POST   /auth/logout                  // 登出
```

### 2.2 查询参数设计

```typescript
// 查询参数设计

// 1. 分页
interface PaginationParams {
  page?: number;      // 页码，从1开始
  limit?: number;     // 每页数量
  offset?: number;    // 偏移量（替代page）
}

// GET /articles?page=1&limit=20
// GET /articles?offset=0&limit=20

// 2. 排序
interface SortParams {
  sort?: string;      // 排序字段
  order?: 'asc' | 'desc'; // 排序方向
}

// GET /articles?sort=created_at&order=desc
// GET /articles?sort=-created_at  // -表示降序
// GET /articles?sort=-created_at,title  // 多字段排序

// 3. 过滤
interface FilterParams {
  status?: string;
  category?: string;
  author_id?: string;
}

// GET /articles?status=published&category=tech

// 4. 字段选择
interface FieldParams {
  fields?: string;    // 返回的字段
}

// GET /users?fields=id,name,email
// GET /articles?fields=id,title,author(name)

// 5. 搜索
interface SearchParams {
  q?: string;         // 搜索关键词
  search?: string;    // 搜索字段
}

// GET /articles?q=javascript
// GET /users?search=name:张三

// 6. 展开/嵌套
interface ExpandParams {
  expand?: string;    // 展开关联资源
  include?: string;   // 包含关联资源
}

// GET /articles/123?expand=author,comments
// GET /users/123?include=posts,comments

// 7. 综合示例
// GET /articles?
//     page=1&
//     limit=20&
//     sort=-created_at&
//     status=published&
//     category=tech&
//     q=javascript&
//     fields=id,title,summary,author&
//     expand=author
```

---

## 3. HTTP方法与状态码

### 3.1 HTTP方法使用

```typescript
// HTTP方法详解

interface HTTPMethod {
  method: string;
  description: string;
  idempotent: boolean; // 是否幂等
  safe: boolean;       // 是否安全（不修改资源）
  cacheable: boolean;  // 是否可缓存
}

const httpMethods: HTTPMethod[] = [
  {
    method: 'GET',
    description: '获取资源',
    idempotent: true,
    safe: true,
    cacheable: true,
  },
  {
    method: 'POST',
    description: '创建资源',
    idempotent: false,
    safe: false,
    cacheable: false,
  },
  {
    method: 'PUT',
    description: '完整更新资源',
    idempotent: true,
    safe: false,
    cacheable: false,
  },
  {
    method: 'PATCH',
    description: '部分更新资源',
    idempotent: true,
    safe: false,
    cacheable: false,
  },
  {
    method: 'DELETE',
    description: '删除资源',
    idempotent: true,
    safe: false,
    cacheable: false,
  },
  {
    method: 'HEAD',
    description: '获取资源头信息',
    idempotent: true,
    safe: true,
    cacheable: true,
  },
  {
    method: 'OPTIONS',
    description: '获取支持的HTTP方法',
    idempotent: true,
    safe: true,
    cacheable: false,
  },
];

// Express实现示例
import express from 'express';

const app = express();

// 获取用户列表
app.get('/users', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// 获取单个用户
app.get('/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  res.json(user);
});

// 创建用户
app.post('/users', async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).location(`/users/${user.id}`).json(user);
});

// 完整更新用户
app.put('/users/:id', async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, overwrite: true }
  );
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  res.json(user);
});

// 部分更新用户
app.patch('/users/:id', async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true }
  );
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  res.json(user);
});

// 删除用户
app.delete('/users/:id', async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  res.status(204).send();
});
```

### 3.2 HTTP状态码

```typescript
// HTTP状态码使用

// 2xx 成功
const successCodes = {
  200: 'OK - 请求成功',
  201: 'Created - 资源创建成功',
  202: 'Accepted - 请求已接受，处理中',
  204: 'No Content - 成功但无返回内容',
};

// 3xx 重定向
const redirectCodes = {
  301: 'Moved Permanently - 资源已永久移动',
  302: 'Found - 资源临时移动',
  304: 'Not Modified - 资源未修改（缓存）',
  307: 'Temporary Redirect - 临时重定向',
  308: 'Permanent Redirect - 永久重定向',
};

// 4xx 客户端错误
const clientErrorCodes = {
  400: 'Bad Request - 请求格式错误',
  401: 'Unauthorized - 未认证',
  403: 'Forbidden - 无权限',
  404: 'Not Found - 资源不存在',
  405: 'Method Not Allowed - 方法不允许',
  406: 'Not Acceptable - 无法满足Accept头',
  409: 'Conflict - 资源冲突',
  410: 'Gone - 资源已删除',
  415: 'Unsupported Media Type - 不支持的媒体类型',
  422: 'Unprocessable Entity - 语义错误',
  429: 'Too Many Requests - 请求过多',
};

// 5xx 服务器错误
const serverErrorCodes = {
  500: 'Internal Server Error - 服务器内部错误',
  501: 'Not Implemented - 功能未实现',
  502: 'Bad Gateway - 网关错误',
  503: 'Service Unavailable - 服务不可用',
  504: 'Gateway Timeout - 网关超时',
};

// Express错误处理
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);

  // 验证错误
  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.details,
    });
  }

  // 认证错误
  if (err instanceof AuthenticationError) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: err.message,
    });
  }

  // 权限错误
  if (err instanceof AuthorizationError) {
    return res.status(403).json({
      error: 'Forbidden',
      message: err.message,
    });
  }

  // 资源不存在
  if (err instanceof NotFoundError) {
    return res.status(404).json({
      error: 'Not Found',
      message: err.message,
    });
  }

  // 默认服务器错误
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? '服务器错误' : err.message,
  });
});
```

---

## 4. 请求与响应设计

### 4.1 请求设计

```typescript
// 请求设计

// 1. 请求头
const requestHeaders = {
  // 内容类型
  'Content-Type': 'application/json',

  // 接受的响应类型
  'Accept': 'application/json',

  // 认证
  'Authorization': 'Bearer <token>',

  // API版本
  'X-API-Version': '2.0',

  // 请求ID（用于追踪）
  'X-Request-ID': 'uuid',

  // 语言
  'Accept-Language': 'zh-CN',

  // 缓存控制
  'Cache-Control': 'no-cache',

  // 条件请求
  'If-Modified-Since': 'Wed, 21 Oct 2025 07:28:00 GMT',
  'If-None-Match': '"etag-value"',
};

// 2. 请求体设计
// 创建用户请求
interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role?: 'user' | 'admin';
}

// 更新用户请求
interface UpdateUserRequest {
  name?: string;
  email?: string;
  avatar?: string;
}

// 批量操作请求
interface BatchRequest {
  ids: string[];
  action: 'delete' | 'archive' | 'publish';
}

// 3. 文件上传
// multipart/form-data
app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  res.json({
    filename: file.filename,
    size: file.size,
    mimetype: file.mimetype,
    url: `/uploads/${file.filename}`,
  });
});

// 4. 复杂查询请求
// POST /articles/search
interface ArticleSearchRequest {
  query?: string;
  filters?: {
    status?: string[];
    category?: string[];
    author_id?: string;
    created_at?: {
      from?: string;
      to?: string;
    };
  };
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    limit: number;
  };
}
```

### 4.2 响应设计

```typescript
// 响应设计

// 1. 单资源响应
interface UserResponse {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

// GET /users/123
{
  "id": "123",
  "name": "张三",
  "email": "zhangsan@example.com",
  "avatar": "https://cdn.example.com/avatars/123.jpg",
  "role": "user",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-03-10T14:20:00Z"
}

// 2. 列表响应（带分页）
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// GET /articles?page=1&limit=20
{
  "data": [
    { "id": "1", "title": "文章1" },
    { "id": "2", "title": "文章2" }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5
  }
}

// 3. 创建响应
// POST /users
// Status: 201 Created
// Location: /users/123
{
  "id": "123",
  "name": "张三",
  "email": "zhangsan@example.com",
  "created_at": "2025-03-15T10:30:00Z"
}

// 4. 更新响应
// PUT /users/123
{
  "id": "123",
  "name": "李四",
  "updated_at": "2025-03-15T11:00:00Z"
}

// 5. 删除响应
// DELETE /users/123
// Status: 204 No Content
// Body: (空)

// 6. 错误响应
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    request_id: string;
  };
}

// 400 Bad Request
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "details": [
      {
        "field": "email",
        "message": "邮箱格式不正确"
      }
    ],
    "request_id": "req-123-456"
  }
}

// 401 Unauthorized
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "请先登录",
    "request_id": "req-123-456"
  }
}

// 404 Not Found
{
  "error": {
    "code": "NOT_FOUND",
    "message": "用户不存在",
    "request_id": "req-123-456"
  }
}

// 7. HATEOAS响应
{
  "id": "123",
  "name": "张三",
  "email": "zhangsan@example.com",
  "_links": {
    "self": { "href": "/users/123" },
    "posts": { "href": "/users/123/posts" },
    "avatar": { "href": "/users/123/avatar" }
  },
  "_actions": {
    "update": {
      "method": "PUT",
      "href": "/users/123",
      "fields": ["name", "email", "avatar"]
    },
    "delete": {
      "method": "DELETE",
      "href": "/users/123"
    }
  }
}
```

---

## 5. 认证与授权

### 5.1 JWT认证实现

```typescript
// JWT认证实现

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = '7d';
const REFRESH_TOKEN_EXPIRES_IN = '30d';

// 生成Token
interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

function generateTokens(payload: TokenPayload) {
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(
    { ...payload, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
}

// 验证Token
function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

// 登录
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  // 查找用户
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({
      error: 'INVALID_CREDENTIALS',
      message: '邮箱或密码错误',
    });
  }

  // 验证密码
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({
      error: 'INVALID_CREDENTIALS',
      message: '邮箱或密码错误',
    });
  }

  // 生成Token
  const tokens = generateTokens({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  // 保存刷新Token
  await RefreshToken.create({
    userId: user.id,
    token: tokens.refreshToken,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  res.json({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    token_type: 'Bearer',
    expires_in: 7 * 24 * 60 * 60,
  });
});

// 刷新Token
app.post('/auth/refresh', async (req, res) => {
  const { refresh_token } = req.body;

  // 验证刷新Token
  const payload = verifyToken(refresh_token);
  if (!payload || (payload as any).type !== 'refresh') {
    return res.status(401).json({
      error: 'INVALID_TOKEN',
      message: '无效的刷新Token',
    });
  }

  // 检查Token是否在数据库中
  const storedToken = await RefreshToken.findOne({
    token: refresh_token,
    userId: payload.userId,
  });

  if (!storedToken) {
    return res.status(401).json({
      error: 'INVALID_TOKEN',
      message: '刷新Token已失效',
    });
  }

  // 生成新Token
  const tokens = generateTokens({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  });

  // 更新刷新Token
  await RefreshToken.findByIdAndUpdate(storedToken.id, {
    token: tokens.refreshToken,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  res.json({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    token_type: 'Bearer',
    expires_in: 7 * 24 * 60 * 60,
  });
});

// 登出
app.post('/auth/logout', authMiddleware, async (req, res) => {
  await RefreshToken.deleteMany({ userId: req.user.userId });
  res.status(204).send();
});

// 认证中间件
function authMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: '请提供认证Token',
    });
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({
      error: 'INVALID_TOKEN',
      message: 'Token无效或已过期',
    });
  }

  req.user = payload;
  next();
}

// 角色授权中间件
function requireRole(...roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: '无权限访问',
      });
    }
    next();
  };
}

// 使用
app.get('/admin/users', authMiddleware, requireRole('admin'), async (req, res) => {
  const users = await User.find();
  res.json(users);
});
```

---

## 6. API版本控制

### 6.1 版本控制策略

```typescript
// API版本控制策略

// 1. URL路径版本（推荐）
// GET /v1/users
// GET /v2/users

// Express实现
import { Router } from 'express';

const v1Router = Router();
const v2Router = Router();

// v1版本
v1Router.get('/users', async (req, res) => {
  const users = await User.find().select('name email');
  res.json(users);
});

// v2版本
v2Router.get('/users', async (req, res) => {
  const users = await User.find().select('name email avatar role');
  res.json({
    data: users,
    version: '2.0',
  });
});

app.use('/v1', v1Router);
app.use('/v2', v2Router);

// 2. 请求头版本
// GET /users
// Accept: application/vnd.myapi.v2+json

app.get('/users', async (req, res) => {
  const acceptHeader = req.headers.accept || '';
  const version = acceptHeader.includes('v2') ? 'v2' : 'v1';

  if (version === 'v2') {
    const users = await User.find().select('name email avatar role');
    return res.json({ data: users, version: '2.0' });
  }

  const users = await User.find().select('name email');
  res.json(users);
});

// 3. 查询参数版本
// GET /users?version=2

app.get('/users', async (req, res) => {
  const version = req.query.version || '1';

  if (version === '2') {
    // v2逻辑
  } else {
    // v1逻辑
  }
});

// 4. 自定义请求头
// X-API-Version: 2.0

app.use((req, res, next) => {
  req.apiVersion = req.headers['x-api-version'] || '1.0';
  next();
});
```

### 6.2 版本迁移策略

```typescript
// 版本迁移策略

// 1. 废弃警告
app.use('/v1', (req, res, next) => {
  res.setHeader('X-API-Deprecated', 'true');
  res.setHeader('X-API-Sunset', '2025-12-31');
  res.setHeader('Link', '</v2/users>; rel="successor-version"');
  next();
}, v1Router);

// 2. 版本兼容层
class UserAPIV1 {
  async getUsers() {
    const users = await User.find();
    // 转换为v1格式
    return users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
    }));
  }
}

class UserAPIV2 {
  async getUsers() {
    const users = await User.find();
    // v2格式
    return {
      data: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      })),
      meta: {
        version: '2.0',
      },
    };
  }
}

// 3. 版本路由工厂
function createVersionRouter(version: string) {
  const router = Router();

  const api = version === 'v2' ? new UserAPIV2() : new UserAPIV1();

  router.get('/users', async (req, res) => {
    const result = await api.getUsers();
    res.json(result);
  });

  return router;
}

app.use('/v1', createVersionRouter('v1'));
app.use('/v2', createVersionRouter('v2'));
```

---

## 7. 面试高频问题

### 问题1：RESTful API的特点？

**答案：**
1. 以资源为中心
2. 使用HTTP动词操作资源
3. 无状态
4. 统一接口
5. 支持缓存
6. 分层系统

### 问题2：PUT和PATCH的区别？

**答案：**
- **PUT**：完整替换资源，需要提供所有字段
- **PATCH**：部分更新资源，只更新提供的字段

### 问题3：如何处理API版本？

**答案：**
1. URL路径版本：`/v1/users`
2. 请求头版本：`Accept: application/vnd.api.v2+json`
3. 查询参数：`?version=2`
4. 自定义请求头：`X-API-Version: 2.0`

### 问题4：HTTP状态码如何选择？

**答案：**
- 2xx：成功
- 4xx：客户端错误
- 5xx：服务器错误

常用：200成功、201创建、204无内容、400请求错误、401未认证、403无权限、404不存在、500服务器错误

### 问题5：如何设计分页API？

**答案：**
```typescript
// 偏移分页
GET /articles?page=1&limit=20

// 游标分页
GET /articles?cursor=xxx&limit=20

// 响应包含分页信息
{
  data: [],
  pagination: { page, limit, total, total_pages }
}
```

---

## 8. 最佳实践总结

### 8.1 API设计清单

- [ ] 使用名词表示资源
- [ ] 使用复数形式
- [ ] 使用正确的HTTP方法
- [ ] 返回正确的状态码
- [ ] 统一响应格式
- [ ] 实现版本控制
- [ ] 添加认证授权
- [ ] 实现错误处理
- [ ] 添加API文档
- [ ] 实现限流

### 8.2 安全清单

- [ ] 使用HTTPS
- [ ] 验证所有输入
- [ ] 实现认证授权
- [ ] 防止SQL注入
- [ ] 实现CORS策略
- [ ] 添加请求限流
- [ ] 记录访问日志
- [ ] 敏感数据加密

---

*本文档最后更新于 2026年3月*