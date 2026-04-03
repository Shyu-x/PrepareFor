# RESTful API设计完全指南

## 目录

1. [RESTful概述](#1-restful概述)
2. [API设计原则](#2-api设计原则)
3. [HTTP方法使用](#3-http方法使用)
4. [状态码规范](#4-状态码规范)
5. [版本管理](#5-版本管理)
6. [认证与授权](#6-认证与授权)
7. [分页与过滤](#7-分页与过滤)
8. [错误处理](#8-错误处理)

---

## 1. RESTful概述

### 1.1 什么是RESTful

REST（Representational State Transfer）是一种软件架构风格，RESTful API是遵循REST原则设计的Web API。

```
RESTful核心概念：
- 资源（Resource）：一切皆资源，使用URI标识
- 表现形式（Representation）：资源的某种表现形式（JSON/XML）
- 状态转移（State Transfer）：通过HTTP方法改变资源状态
- 统一接口（Uniform Interface）：使用标准HTTP方法和状态码
- 无状态（Stateless）：每个请求包含所有必要信息
```

### 1.2 RESTful设计风格

| 风格 | 说明 | 示例 |
|------|------|------|
| **资源导向** | URL表示资源 | `/users/1` |
| **HTTP动词** | 使用标准HTTP方法 | GET、POST、PUT、DELETE |
| **无状态** | 不存储会话信息 | 每个请求独立 |
| **统一响应** | 标准格式 | `{code, message, data}` |

---

## 2. API设计原则

### 2.1 资源命名规范

```
✅ 推荐命名方式：
GET    /users          # 获取用户列表
GET    /users/123       # 获取指定用户
POST   /users          # 创建用户
PUT    /users/123       # 更新用户
DELETE /users/123       # 删除用户
GET    /users/123/posts # 获取用户的文章

❌ 避免命名方式：
GET    /getUsers       # 动词在URL中
POST   /createUser     # 混合动词
GET    /user            # 使用复数形式
GET    /User           # 不使用大写
```

### 2.2 嵌套资源

```
# 用户详情中的关联资源
GET /users/123
{
    "id": 123,
    "name": "张三",
    "email": "zhangsan@example.com",
    "posts": {
        "url": "/users/123/posts",
        "count": 5
    }
}

# 或者直接返回数据
GET /users/123/posts
[
    { "id": 1, "title": "文章1" },
    { "id": 2, "title": "文章2" }
]
```

---

## 3. HTTP方法使用

### 3.1 常用方法对比

| 方法 | 幂等性 | 用途 | 示例 |
|------|--------|------|------|
| **GET** | 幂等 | 获取资源 | `GET /users` |
| **POST** | 非幂等 | 创建资源 | `POST /users` |
| **PUT** | 幂等 | 完整更新资源 | `PUT /users/123` |
| **PATCH** | 非幂等 | 部分更新资源 | `PATCH /users/123` |
| **DELETE** | 幂等 | 删除资源 | `DELETE /users/123` |

### 3.2 使用规范

```javascript
// GET - 获取资源（幂等）
GET /users?page=1&limit=20

// POST - 创建资源（非幂等）
POST /users
{
    "name": "张三",
    "email": "zhangsan@example.com"
}

// PUT - 完整替换（幂等）
PUT /users/123
{
    "id": 123,
    "name": "李四",
    "email": "lisi@example.com"
}

// PATCH - 部分更新（非幂等）
PATCH /users/123
{
    "email": "newemail@example.com"
}

// DELETE - 删除资源（幂等）
DELETE /users/123
```

---

## 4. 状态码规范

### 4.1 状态码分类

| 分类 | 状态码 | 含义 |
|------|--------|------|
| **2xx** | 200 | 请求成功 |
| **3xx** | 301, 302 | 重定向 |
| **4xx** | 400, 401, 403, 404, 409 | 客户端错误 |
| **5xx** | 500, 502, 503, 504 | 服务器端错误 |

### 4.2 常用状态码详解

```javascript
// 200 OK - 请求成功
GET /users/123
200 OK
{
    "id": 123,
    "name": "张三"
}

// 201 Created - 资源创建成功
POST /users
201 Created
{
    "id": 456,
    "name": "新用户"
}

// 204 No Content - 删除成功（无返回内容）
DELETE /users/123
204 No Content

// 400 Bad Request - 请求参数错误
POST /users
400 Bad Request
{
    "error": "缺少必填字段",
    "fields": ["name", "email"]
}

// 401 Unauthorized - 未认证
GET /users/123
401 Unauthorized
{
    "error": "请先登录"
}

// 403 Forbidden - 无权限
GET /admin/users
403 Forbidden
{
    "error": "权限不足"
}

// 404 Not Found - 资源不存在
GET /users/999
404 Not Found
{
    "error": "用户不存在"
}

// 409 Conflict - 资源冲突
POST /users
409 Conflict
{
    "error": "邮箱已被使用"
}

// 500 Internal Server Error - 服务器错误
GET /users/123
500 Internal Server Error
{
    "error": "服务器内部错误"
}
```

---

## 5. 版本管理

### 5.1 版本控制方式

```javascript
// 方式1：URL路径
GET /api/v1/users
GET /api/v2/users

// 方式2：查询参数
GET /api/users?version=v1
GET /api/users?version=v2

// 方式3：请求头
GET /api/users
Header: API-Version: v1

// 方式式：内容协商
GET /api/users
Accept: application/vnd.myapi.v1+json
```

### 5.2 版本升级策略

```javascript
// API版本升级示例
// v1版本
GET /api/v1/users
{
    "id": 1,
    "name": "张三",
    "email": "zhangsan@example.com"
}

// v2版本（添加新字段）
GET /api/v2/users
{
    "id": 1,
    "name": "张三",
    "email": "zhangsan@example.com",
    "avatar":.        // 新增
    "createdAt": "2024-01-01T00:00:00Z"  // 新增
}
```

---

## 6. 认证与授权

### 6.1 常见认证方式

| 方式 | 说明 | 示例 |
|------|------|------|
| **Token认证** | 请求头携带Token | `Authorization: Bearer xxx` |
| **API Key** | 请求头或查询参数 | `X-API-Key: xxx` |
| **Basic Auth** | 基础认证 | `Authorization: Basic xxx` |
| **OAuth 2.0** | 授权码模式 | `/authorize`, `/token` |

### 6.2 Token认证实现

```javascript
// 客户端：发送请求
fetch('/api/users', {
    headers: {
        'Authorization': `Bearer ${token}`
    }
})

// 服务端：验证Token（Node.js示例）
function authenticateToken(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: '未提供认证Token' });
    }

    try {
        // 验证Token有效性
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token无效或已过期' });
    }
}

// 使用中间件
app.get('/api/users', authenticateToken, (req, res) => {
    res.json({ user: req.user });
});
```

### 6.3 权限检查

```javascript
// 权限定义
const permissions = {
    READ_USERS: 'read:users',
    WRITE_USERS: 'write:users',
    DELETE_USERS: 'delete:users'
};

// 权限中间件
function requirePermission(permission) {
    return (req, res, next) => {
        if (!req.user.permissions.includes(permission)) {
            return res.status(403).json({
                error: '权限不足',
                required: permission
            });
        }
        next();
    };
}

// 使用示例
app.delete('/api/users/:id', authenticateToken,
    requirePermission(permissions.DELETE_USERS),
    (req, res) => {
        // 删除用户逻辑
    });
```

---

## 7. 分页与过滤

### 7.1 分页设计

```javascript
// 分页查询参数
GET /api/users?page=1&limit=20&sort=name:desc

// 服务端实现
function getUsers(req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { users, total } = await userService.getUsers({
        offset,
        limit,
        sort: req.query.sort
    });

    res.json({
        data: users,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: offset + limit < total,
            hasPrev: page > 1
        }
    });
}

// 响应示例
{
    "data": [
        { "id": 1, "name": "张三" },
        { "id": 2, "name": "李四" }
    ],
    "pagination": {
        "page": 1,
        "limit": 20,
        "total": 100,
        "totalPages": 5,
        "hasNext": true,
        "hasPrev": false
    }
}
```

### 7.2 基于游标的分页（大数据集）

```javascript
// 使用cursor代替offset
GET /api/users?cursor=abc123&limit=20

// 服务端实现
async function getUsers(req, res) {
    const cursor = req.query.cursor;
    const limit = parseInt(req.query.limit) || 20;

    const { users, nextCursor, hasMore } = await userService.getUsersByCursor({
        cursor,
        limit
    });

    res.json({
        data: users,
        pagination: {
            nextCursor,
            hasMore,
            limit
        }
    });
}
```

### 7.3 过滤与排序

```javascript
// 查询参数
GET /api/users?name=张&age=18&sort=createdAt:desc

// 服务端实现
async function searchUsers(req, res) {
    const filters = {};

    if (req.query.name) {
        filters.name = { $like: `%${req.query.name}%` };  // 模糊查询
    }

    if (req.query.age) {
        filters.age = { $gte: parseInt(req.query.age) };  // 大于等于
    }

    const sort = req.query.sort || 'createdAt:desc';
    const [sortField, sortOrder] = sort.split(':');

    const users = await userService.find({
        where: filters,
        order: { [sortField]: sortOrder },
        limit: 50
    });

    res.json({ data: users });
}
```

### 7.4 字段选择

```javascript
// 只返回需要的字段
GET /api/users/123?fields=name,email

// 服务端实现
async function getUser(req, res) {
    const user = await userService.findById(req.params.id);
    const fields = req.query.fields?.split(',');

    if (fields) {
        const selected = {};
        fields.forEach(field => {
            if (user[field] !== undefined) {
                selected[field] = user[field];
            }
        });
        res.json({ data: selected });
    } else {
        res.json({ data: user });
    }
}

// 响应示例
{
    "data": {
        "name": "张三",
        "email": "zhangsan@example.com"
    }
}
```

---

## 8. 错误处理

### 8.1 统一错误响应格式

```javascript
// 错误响应格式
{
    "code": "USER_NOT_FOUND",
    "message": "用户不存在",
    "details": {
        "userId": 123
    },
    "timestamp": "2024-01-01T00:00:00Z",
    "path": "/api/users/123"
}
```

### 8.2 错误处理实现

```javascript
// 错误类
class AppError extends Error {
    constructor(code, message, statusCode = 400, details = {}) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.timestamp = new Date().toISOString();
    }

    toJSON() {
        return {
            code: this.code,
            message: this.message,
            details: this.details,
            timestamp: this.timestamp
        };
    }
}

// 错误码定义
const ErrorCodes = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    INTERNAL_ERROR: 'INTERNAL_ERROR'
};

// 错误处理中间件
function errorHandler(err, req, res, next) {
    // 已知错误
    if (err instanceof AppError) {
        return res.status(err.statusCode).json(err.toJSON());
    }

    // JWT验证错误
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            code: ErrorCodes.UNAUTHORIZED,
            message: 'Token无效',
            timestamp: new Date().toISOString()
        });
    }

    // 数据库错误
    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            code: ErrorCodes.VALIDATION_ERROR,
            message: '数据验证失败',
            details: err.errors
        });
    }

    // 未知错误
    console.error(err);
    res.status(500).json({
        code: ErrorCodes.INTERNAL_ERROR,
        message: '服务器内部错误',
        timestamp: new Date().toISOString()
    });
}

// 404处理
function notFoundHandler(req, res) {
    res.status(404).json({
        code: ErrorCodes.NOT_FOUND,
        message: `路径 ${req.path} 不存在`,
        path: req.path,
        timestamp: new Date().toISOString()
    });
}
```

### 8.3 使用示例

```javascript
// 路由中使用
app.get('/api/users/:id', async (req, res, next) => {
    try {
        const user = await userService.findById(req.params.id);

        if (!user) {
            throw new AppError(
                ErrorCodes.NOT_FOUND,
                '用户不存在',
                404,
                { userId: req.params.id }
            );
        }

        res.json({ data: user });
    } catch (error) {
        next(error);
    }
});
```

---

## 9. 性能优化

### 9.1 HATEOAS支持

```javascript
// 允许客户端请求返回的响应格式
GET /api/users/123
Header: Accept: application/vnd.api.v1+json

// 服务端实现
app.get('/api/users/:id', async (req, res) => {
    const user = await userService.findById(req.params.id);

    // 支持多种格式
    const formats = {
        'application/vnd.api.v1+json': () => formatUserV1(user),
        'application/vnd.api.v2+json': () => formatUserV2(user)
    };

    const format = formats[req.accepts().type] || formatUserV1;
    res.type(req.accepts().type).json({ data: format(user) });
});
```

### 9.2 缓存控制

```javascript
// 客户端控制缓存
GET /api/users/123
Header: Cache-Control: no-cache

// 服务端设置缓存
app.get('/api/users/:id', async (req, res) => {
    const user = await userService.findById(req.params.id);

    // 设置缓存策略
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('ETag', generateETag(user));

    // 检查If-None-Match
    if (req.headers['if-none-match'] === res.getHeader('ETag')) {
        return res.status(304).end();
    }

    res.json({ data: user });
});
```

### 9.3 压缩响应

```javascript
// 启用响应压缩
const compression = require('compression');
app.use(compression());

// 或者手动处理
app.get('/api/users', async (req, res) => {
    const users = await userService.getAll();

    // 检查客户端是否支持压缩
    const acceptEncoding = req.headers['accept-encoding'] || '';
    if (acceptEncoding.includes('gzip')) {
        const gzip = require('zlib').createGzip();
        const compressed = JSON.stringify({ data: users }).pipe(gzip);
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Content-Type', 'application/json');
        compressed.pipe(res);
    } else {
        res.json({ data: users });
    }
});
```

---

## 参考资源

- [RESTful API设计指南](https://restfulapi.net/)
- [MDN Web APIs](https://developer.mozilla.org/zh-CN/docs/Web/HTTP)
- [JSON API规范](https://jsonapi.org/)

---

*本文档持续更新，最后更新于2026年3月*
