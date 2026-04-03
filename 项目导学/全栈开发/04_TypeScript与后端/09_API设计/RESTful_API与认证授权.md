# API 设计与认证详解（深度扩展版）

## 目录

1. [RESTful API 设计](#1-restful-api-设计)
2. [HATEOAS超媒体控制](#2-hateoas超媒体控制)
3. [API网关与架构模式](#3-api网关与架构模式)
4. [认证授权](#4-认证授权)
5. [OAuth2.0深度实现](#5-oauth20深度实现)
6. [高级安全实践](#6-高级安全实践)
7. [常见面试问题](#7-常见面试问题)

---

## 1. RESTful API 设计

### 1.1 REST 原则

REST（Representational State Transfer）是一种软件架构风格，RESTful API 遵循以下原则：

- **资源导向**：URL 代表资源，而非动作
- **统一接口**：使用 HTTP 方法表达操作
- **无状态**：每个请求包含所有必要信息
- **分层系统**：客户端无需了解后端细节

### 1.2 资源命名

```javascript
// 资源命名最佳实践

// 复数形式表示资源集合
GET /users           // 获取用户列表
GET /users/:id       // 获取单个用户

// 嵌套资源
GET /users/:id/posts           // 获取用户的所有帖子
GET /users/:id/posts/:postId   // 获取用户的指定帖子
GET /posts/:postId/comments    // 获取帖子的评论

// 避免动词
// ❌ GET /getUsers
// ❌ POST /createUser
// ✅ GET /users

// 使用查询参数进行过滤、排序、分页
GET /users?status=active&sort=createdAt,desc&page=1&limit=10
```

### 1.3 HTTP 方法

```javascript
// RESTful 方法对应操作

// GET - 读取资源
app.get('/users', (req, res) => {
  // 获取资源列表
  // 幂等操作
});

app.get('/users/:id', (req, res) => {
  // 获取单个资源
});

// POST - 创建资源
app.post('/users', (req, res) => {
  // 创建新资源
  // 非幂等操作
  // 201 Created
});

// PUT - 完整更新
app.put('/users/:id', (req, res) => {
  // 替换整个资源
  // 幂等操作
});

// PATCH - 部分更新
app.patch('/users/:id', (req, res) => {
  // 更新部分字段
  // 幂等操作
});

// DELETE - 删除资源
app.delete('/users/:id', (req, res) => {
  // 删除资源
  // 幂等操作
});
```

### 1.4 状态码

```javascript
// 成功状态码
200 OK                      // GET、PUT、PATCH 成功
201 Created                // POST 创建成功
204 No Content            // DELETE 成功，无返回内容

// 客户端错误状态码
400 Bad Request           // 请求格式错误
401 Unauthorized          // 未认证
403 Forbidden             // 无权限
404 Not Found             // 资源不存在
409 Conflict              // 资源冲突
422 Unprocessable Entity  // 验证失败
429 Too Many Requests     // 请求过多

// 服务器错误状态码
500 Internal Server Error // 服务器内部错误
502 Bad Gateway           // 网关错误
503 Service Unavailable    // 服务不可用

// 完整示例
app.get('/users/:id', (req, res) => {
  const user = findUser(req.params.id);

  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  res.status(200).json(user);
});

app.post('/users', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: '邮箱不能为空' });
  }

  if (await findUserByEmail(email)) {
    return res.status(409).json({ error: '邮箱已存在' });
  }

  const user = createUser(req.body);
  res.status(201).json(user);
});
```

### 1.5 分页与过滤

```javascript
// 分页
app.get('/users', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const { users, total } = getUsers({ limit, offset });

  res.json({
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

// 过滤
app.get('/users', (req, res) => {
  const filters = {};

  if (req.query.status) filters.status = req.query.status;
  if (req.query.role) filters.role = req.query.role;
  if (req.query.search) filters.name = { $regex: req.query.search };

  const users = getUsers(filters);
  res.json(users);
});

// 排序
app.get('/users', (req, res) => {
  const sortField = req.query.sort || 'createdAt';
  const sortOrder = req.query.order === 'asc' ? 1 : -1;

  const users = getUsers({}, { [sortField]: sortOrder });
  res.json(users);
});

// 字段选择
app.get('/users', (req, res) => {
  const fields = req.query.fields?.split(',') || [];

  const users = getUsers({}, fields.length ? { select: fields } : {});
  res.json(users);
});
```

### 1.6 API 版本控制

```javascript
// 方式 1：URL 路径
app.use('/api/v1', v1Routes);
app.use('/api/v2', v2Routes);

// 方式 2：查询参数
app.get('/api/users', (req, res) => {
  const version = req.query.v || '1';

  if (version === '2') {
    return res.json(getUsersV2());
  }

  return res.json(getUsersV1());
});

// 方式 3：自定义请求头
app.get('/api/users', (req, res) => {
  const version = req.headers['accept-version'] || '1';

  if (version === '2') {
    return res.json(getUsersV2());
  }

  return res.json(getUsersV1());
});

// 响应中包含版本信息
app.get('/api/users', (req, res) => {
  res.setHeader('API-Version', '2.0');
  res.json(users);
});
```

### 1.7 完整 API 示例

```javascript
const express = require('express');
const app = express();
app.use(express.json());

// 用户 API
const users = [
  { id: 1, name: '张三', email: 'zhangsan@example.com', status: 'active' },
  { id: 2, name: '李四', email: 'lisi@example.com', status: 'inactive' }
];

let nextId = 3;

// 获取用户列表
app.get('/api/users', (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  let filtered = users;
  if (status) {
    filtered = filtered.filter(u => u.status === status);
  }

  const start = (page - 1) * limit;
  const end = start + parseInt(limit);

  res.json({
    data: filtered.slice(start, end),
    meta: {
      total: filtered.length,
      page: parseInt(page),
      limit: parseInt(limit)
    }
  });
});

// 获取单个用户
app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));

  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  res.json(user);
});

// 创建用户
app.post('/api/users', (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: '姓名和邮箱不能为空' });
  }

  const user = { id: nextId++, name, email, status: 'active' };
  users.push(user);

  res.status(201).json(user);
});

// 更新用户
app.put('/api/users/:id', (req, res) => {
  const index = users.findIndex(u => u.id === parseInt(req.params.id));

  if (index === -1) {
    return res.status(404).json({ error: '用户不存在' });
  }

  users[index] = { ...users[index], ...req.body };
  res.json(users[index]);
});

// 部分更新
app.patch('/api/users/:id', (req, res) => {
  const index = users.findIndex(u => u.id === parseInt(req.params.id));

  if (index === -1) {
    return res.status(404).json({ error: '用户不存在' });
  }

  Object.assign(users[index], req.body);
  res.json(users[index]);
});

// 删除用户
app.delete('/api/users/:id', (req, res) => {
  const index = users.findIndex(u => u.id === parseInt(req.params.id));

  if (index === -1) {
    return res.status(404).json({ error: '用户不存在' });
  }

  users.splice(index, 1);
  res.status(204).send();
});

app.listen(3000);
```

---

## 2. HATEOAS超媒体控制

### 2.1 HATEOAS是什么？

**HATEOAS（Hypermedia As The Engine Of Application State）** 是 REST 架构的核心约束之一。它意味着客户端只需要知道一个入口 URL，通过响应中包含的超媒体链接，客户端可以发现所有其他可用的操作，而无需硬编码 API 结构。

```javascript
// 传统API响应（客户端需要预先知道所有端点）
{
  "id": 1,
  "name": "张三",
  "accountBalance": 10000
}

// HATEOAS API响应（响应中包含下一步操作的链接）
{
  "id": 1,
  "name": "张三",
  "accountBalance": 10000,
  "_links": {
    "self": { "href": "/api/users/1" },
    "accounts": { "href": "/api/users/1/accounts" },
    "transfer": { "href": "/api/users/1/transfer" },
    "close": { "href": "/api/users/1", "method": "DELETE" }
  }
}
```

### 2.2 HATEOAS实现示例

```javascript
// HATEOAS链接生成中间件
function addHATEOASLinks(resource, baseUrl, userRole) {
  const links = {
    self: { href: `${baseUrl}/${resource.id}`, method: 'GET' }
  };

  // 根据资源状态添加动态链接
  if (resource.status === 'active') {
    links.deactivate = { href: `${baseUrl}/${resource.id}/deactivate`, method: 'POST' };
  } else {
    links.activate = { href: `${baseUrl}/${resource.id}/activate`, method: 'POST' };
  }

  // 根据用户角色添加链接
  if (userRole === 'admin') {
    links.delete = { href: `${baseUrl}/${resource.id}`, method: 'DELETE' };
    links.update = { href: `${baseUrl}/${resource.id}`, method: 'PUT' };
  }

  return { ...resource, _links: links };
}

// 分页响应中的HATEOAS
function addPaginationLinks(pagination, req) {
  const { page, limit, total } = pagination;
  const totalPages = Math.ceil(total / limit);
  const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;

  const links = {
    self: { href: `${baseUrl}?page=${page}&limit=${limit}` },
    first: { href: `${baseUrl}?page=1&limit=${limit}` },
    last: { href: `${baseUrl}?page=${totalPages}&limit=${limit}` }
  };

  if (page > 1) {
    links.prev = { href: `${baseUrl}?page=${page - 1}&limit=${limit}` };
    links.prevPage = { href: `${baseUrl}?page=${page - 1}&limit=${limit}` };
  }

  if (page < totalPages) {
    links.next = { href: `${baseUrl}?page=${page + 1}&limit=${limit}` };
    links.nextPage = { href: `${baseUrl}?page=${page + 1}&limit=${limit}` };
  }

  return { ...pagination, _links: links };
}

// 集合资源的HATEOAS包装
function wrapCollection(collection, options, req) {
  const wrappedItems = collection.data.map(item =>
    addHATEOASLinks(item, options.basePath, req.user?.role)
  );

  return {
    count: wrappedItems.length,
    total: collection.total,
    data: wrappedItems,
    _embedded: { items: wrappedItems },
    ...addPaginationLinks(collection.pagination, req)
  };
}
```

### 2.3 HAL（JSON Hypertext Application Language）

HAL 是一种流行的超媒体格式，定义了 JSON 中 `_links` 和 `_embedded` 的标准结构：

```javascript
// HAL格式响应
{
  "_links": {
    "self": { "href": "/api/orders" },
    "curies": [{ "name": "ea", "href": "/api/docs/rels/{rel}", "templated": true }],
    "ea:find": { "href": "/api/orders{?id}", "templated": true }
  },
  "_embedded": {
    "orders": [
      {
        "_links": {
          "self": { "href": "/api/orders/123" },
          "ea:customer": { "href": "/api/customers/456" },
          "ea:items": { "href": "/api/orders/123/items" }
        },
        "total": 99.99,
        "status": "shipped",
        "_embedded": {
          "customer": {
            "name": "张三",
            "email": "zhangsan@example.com"
          }
        }
      }
    ]
  }
}
```

---

## 3. API网关与架构模式

### 3.1 API网关核心职责

API网关是所有客户端请求的单一入口，负责路由、认证、限流、监控等横切关注点：

```yaml
# Kong网关配置示例
# 路由配置
services:
  - name: user-service
    url: http://user-service:3001
    routes:
      - name: user-route
        paths:
          - /api/users
        strip_path: false
        plugins:
          # 认证插件
          - name: jwt
            config:
              uri_param_names:
                - jwt
              header_names:
                - Authorization
              claims_to_verify:
                - exp
              maximum_expiration: 3600
          # 限流插件
          - name: rate-limiting
            config:
              minute: 100
              policy: redis
              redis_host: redis
              fault_tolerant: true
          # CORS插件
          - name: cors
            config:
              origins:
                - https://example.com
              methods:
                - GET
                - POST
                - PUT
                - DELETE
              headers:
                - Authorization
                - Content-Type
              exposed_headers:
                - X-Total-Count
              credentials: true
              max_age: 86400
```

### 3.2 网关限流算法实现

```javascript
// 令牌桶算法实现
class TokenBucket {
  constructor(capacity, refillRate) {
    this.capacity = capacity;        // 桶容量
    this.tokens = capacity;          // 当前令牌数
    this.refillRate = refillRate;    // 每秒补充令牌数
    this.lastRefill = Date.now();    // 上次补充时间
  }

  // 尝试获取令牌
  tryConsume(tokens = 1) {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return { allowed: true, remainingTokens: this.tokens };
    }

    return {
      allowed: false,
      remainingTokens: this.tokens,
      retryAfter: Math.ceil((tokens - this.tokens) / this.refillRate)
    };
  }

  // 补充令牌
  refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const tokensToAdd = elapsed * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

// 滑动窗口限流实现
class SlidingWindowLog {
  constructor(maxRequests, windowSizeSeconds) {
    this.maxRequests = maxRequests;
    this.windowSize = windowSizeSeconds * 1000;  // 转换为毫秒
    this.requests = new Map();  // clientId -> timestamp[]
  }

  isAllowed(clientId) {
    const now = Date.now();
    const windowStart = now - this.windowSize;

    // 获取或初始化该客户端的请求时间戳
    if (!this.requests.has(clientId)) {
      this.requests.set(clientId, []);
    }

    const timestamps = this.requests.get(clientId);

    // 清理超出窗口的旧记录
    const validTimestamps = timestamps.filter(ts => ts > windowStart);

    if (validTimestamps.length >= this.maxRequests) {
      return {
        allowed: false,
        remainingRequests: 0,
        retryAfter: Math.ceil((validTimestamps[0] - windowStart) / 1000)
      };
    }

    // 记录新请求
    validTimestamps.push(now);
    this.requests.set(clientId, validTimestamps);

    return {
      allowed: true,
      remainingRequests: this.maxRequests - validTimestamps.length
    };
  }
}

// 分布式限流中间件（基于Redis）
async function distributedRateLimiter(req, res, next) {
  const clientId = req.user?.id || req.ip;  // 基于用户ID或IP
  const key = `rate_limit:${clientId}`;
  const limit = 100;  // 每分钟限制100次
  const window = 60;   // 60秒窗口

  try {
    // 使用Redis原子操作实现滑动窗口
    const now = Date.now();
    const windowStart = now - window * 1000;

    // 事务执行：删除旧记录 + 统计当前窗口请求数 + 添加新记录
    const multi = redis.multi();
    multi.zremrangebyscore(key, 0, windowStart);  // 删除窗口外的记录
    multi.zadd(key, now, `${now}-${Math.random()}`);  // 添加当前请求
    multi.zcard(key);  // 统计请求数
    multi.expire(key, window);  // 设置过期时间

    const results = await multi.exec();
    const requestCount = results[2][1];

    if (requestCount > limit) {
      // 获取最旧请求的时间，计算重试时间
      const oldestRequests = await redis.zrange(key, 0, 0, 'WITHSCORES');
      const retryAfter = Math.ceil((oldestRequests[1] + window * 1000 - now) / 1000);

      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.ceil((now + retryAfter * 1000) / 1000));
      res.setHeader('Retry-After', retryAfter);

      return res.status(429).json({
        error: '请求过于频繁，请稍后再试',
        retryAfter
      });
    }

    // 设置限流响应头
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - requestCount));

    next();
  } catch (error) {
    // Redis故障时，降级为通过（避免影响服务可用性）
    console.error('限流服务异常:', error);
    next();
  }
}
```

### 3.3 BFF（Backend For Frontend）模式

BFF为不同前端提供定制化的后端服务：

```javascript
// BFF架构示例

// mobile-bff/server.js - 移动端专用API聚合
const express = require('express');
const app = express();

// 聚合多个微服务的数据
app.get('/api/mobile/home', async (req, res) => {
  try {
    // 并行请求多个服务
    const [banners, categories, hotProducts, recommendations] = await Promise.all([
      fetch('http://content-service/banners'),
      fetch('http://catalog-service/categories'),
      fetch('http://catalog-service/products?sort=hot&limit=10'),
      fetch('http://recommendation-service/personalized?userId=' + req.user.id)
    ]);

    // 移动端特化：精简数据、合并响应
    res.json({
      banner: banners[0],  // 移动端只显示首张轮播图
      categories: categories.slice(0, 8),  // 只显示8个分类
      hotProducts: hotProducts.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        thumb: p.thumbUrl  // 只返回小图
      })),
      recommendations: recommendations.slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ error: '服务暂不可用' });
  }
});

// web-bff/server.js - Web端专用API
app.get('/api/web/home', async (req, res) => {
  // Web端可以返回更丰富的数据
  const [banners, categories, hotProducts, recommendations] = await Promise.all([
    fetch('http://content-service/banners'),
    fetch('http://catalog-service/categories?includeChildren=true'),
    fetch('http://catalog-service/products?sort=hot&limit=20&includeDetails=true'),
    fetch('http://recommendation-service/personalized?userId=' + req.user.id + '&limit=10')
  ]);

  res.json({
    banners,  // 返回所有轮播图
    categories,  // 返回完整分类树
    hotProducts,  // 返回完整商品信息
    recommendations
  });
});
```

---

## 4. 认证授权

### 2.1 JWT 原理与实现

```javascript
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// 生成密钥
const secret = crypto.randomBytes(32).toString('hex');
const refreshSecret = crypto.randomBytes(32).toString('hex');

// 生成 Token
function generateTokens(user) {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    secret,
    { expiresIn: '1h' }  // 1小时过期
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    refreshSecret,
    { expiresIn: '7d' }  // 7天过期
  );

  return { accessToken, refreshToken };
}

// 验证 Access Token
function verifyAccessToken(token) {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
}

// 中间件：验证 Token
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供令牌' });
  }

  const token = authHeader.substring(7);
  const decoded = verifyAccessToken(token);

  if (!decoded) {
    return res.status(401).json({ error: '令牌无效或已过期' });
  }

  req.user = decoded;
  next();
}

// 刷新 Token
async function refreshToken(req, res) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: '刷新令牌不能为空' });
  }

  try {
    const decoded = jwt.verify(refreshToken, refreshSecret);
    const user = await getUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    const tokens = generateTokens(user);
    res.json(tokens);
  } catch (error) {
    res.status(401).json({ error: '刷新令牌无效' });
  }
}

// 使用示例
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await validateUser(email, password);
  if (!user) {
    return res.status(401).json({ error: '邮箱或密码错误' });
  }

  const tokens = generateTokens(user);
  res.json(tokens);
});

app.get('/profile', authenticate, (req, res) => {
  res.json(req.user);
});
```

### 2.2 OAuth 2.0

```javascript
// OAuth 2.0 授权流程

// 1. 授权端点
app.get('/auth/oauth/authorize', (req, res) => {
  const { client_id, redirect_uri, response_type, scope, state } = req.query;

  // 验证客户端
  const client = getClient(client_id);
  if (!client || client.redirect_uri !== redirect_uri) {
    return res.status(400).json({ error: '无效的客户端' });
  }

  // 显示授权页面让用户确认
  res.render('authorize', {
    client: client.name,
    scope: scope,
    state: state
  });
});

// 2. 用户确认后生成授权码
app.post('/auth/oauth/authorize', (req, res) => {
  const { client_id, redirect_uri, scope, state, user_id } = req.body;

  // 生成授权码
  const code = generateAuthorizationCode();

  // 存储授权码
  await saveAuthorizationCode(code, {
    client_id,
    user_id,
    redirect_uri,
    scope,
    expiresAt: Date.now() + 600000  // 10分钟
  });

  // 重定向回客户端
  const redirect = new URL(redirect_uri);
  redirect.searchParams.set('code', code);
  if (state) redirect.searchParams.set('state', state);

  res.redirect(redirect.toString());
});

// 3. 令牌端点
app.post('/auth/oauth/token', async (req, res) => {
  const { grant_type, code, client_id, client_secret, refresh_token } = req.body;

  if (grant_type === 'authorization_code') {
    // 验证授权码
    const authCode = await getAuthorizationCode(code);
    if (!authCode || authCode.expiresAt < Date.now()) {
      return res.status(400).json({ error: '授权码无效或已过期' });
    }

    // 验证客户端
    const client = getClient(client_id);
    if (!client || client.client_secret !== client_secret) {
      return res.status(400).json({ error: '客户端验证失败' });
    }

    // 生成令牌
    const accessToken = generateAccessToken({ userId: authCode.user_id, client_id });
    const refreshToken = generateRefreshToken({ userId: authCode.user_id, client_id });

    res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: refreshToken
    });
  } else if (grant_type === 'refresh_token') {
    // 刷新令牌
    // ...
  }
});
```

### 2.3 Session vs Token

```javascript
// Session 认证
const session = require('express-session');

// 配置 Session
app.use(session({
  secret: 'your-secret',
  resave: false,
  saveUninitialized: false,
  store: new RedisStore({ client: redis }),
  cookie: {
    secure: true,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Session 登录
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const user = validateUser(email, password);
  if (!user) {
    return res.status(401).json({ error: '认证失败' });
  }

  // 存储用户信息到 session
  req.session.user = { id: user.id, email: user.email };
  res.json({ success: true });
});

// Session 验证中间件
function requireSession(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: '未登录' });
  }
  next();
}

// Token vs Session 对比
/*
| 特性        | Token (JWT)              | Session                 |
|-------------|-------------------------|------------------------|
| 存储位置    | 客户端                  | 服务端 (Redis)          |
| 扩展性      | 好（无状态）            | 差（需要同步）         |
| 跨域        | 容易                    | 较难                   |
| 安全性      | 需考虑 token 泄露       | 相对安全               |
| 性能        | 无需查库                | 需要查库/缓存          |
| 移动端支持  | 友好                    | 需要额外处理            |
*/
```

### 2.4 权限控制（RBAC/ABAC）

```javascript
// RBAC (基于角色的访问控制)

// 定义角色和权限
const roles = {
  admin: ['users:read', 'users:write', 'users:delete', 'posts:read', 'posts:write'],
  editor: ['posts:read', 'posts:write'],
  user: ['posts:read'],
  guest: []
};

// 角色检查中间件
function authorize(...allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: '权限不足' });
    }

    next();
  };
}

// 权限检查中间件
function checkPermission(permission) {
  return (req, res, next) => {
    const userRole = req.user?.role;
    const permissions = roles[userRole] || [];

    if (!permissions.includes(permission)) {
      return res.status(403).json({ error: '无此权限' });
    }

    next();
  };
}

// 使用
app.get('/users', authenticate, authorize('admin', 'editor'), (req, res) => {
  res.json(users);
});

app.delete('/users/:id', authenticate, checkPermission('users:delete'), (req, res) => {
  res.json({ message: '用户已删除' });
});

// ABAC (基于属性的访问控制)
function canAccess(resource, action, req) {
  // 用户属性
  const userDept = req.user?.department;
  const userRole = req.user?.role;
  const userLevel = req.user?.level;

  // 资源属性
  const resourceDept = resource.department;
  const resourceLevel = resource.level;

  // 环境属性
  const isWorkHours = new Date().getHours() >= 9 && new Date().getHours() < 18;

  // 策略规则
  if (userRole === 'admin') return true;
  if (userDept === resourceDept && userLevel >= resourceLevel) return true;
  if (userRole === 'manager' && isWorkHours) return true;

  return false;
}
```

---

## 3. 安全性

### 3.1 XSS 防护

```javascript
// 1. 使用 sanitize-html 过滤 HTML
const sanitizeHtml = require('sanitize-html');

function sanitize(input) {
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {}
  });
}

// 2. 设置安全响应头
const helmet = require('helmet');
app.use(helmet());

// 3. 内容安全策略 (CSP)
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://api.example.com"]
  }
}));

// 4. 防止 XSS 的 Express 中间件
app.use((req, res, next) => {
  // 转义 HTML 特殊字符
  req.sanitize = (str) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  };
  next();
});

// 5. 验证输入
const Joi = require('joi');

const userSchema = Joi.object({
  name: Joi.string().max(50).pattern(/^[a-zA-Z0-9\u4e00-\u9fa5]+$/),
  email: Joi.string().email(),
  age: Joi.number().integer().min(0).max(150)
});
```

### 3.2 CSRF 防护

```javascript
// 1. 使用 csurf 中间件（已废弃，推荐使用 SameSite Cookie）
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// 2. 使用 SameSite Cookie
app.use(session({
  cookie: {
    sameSite: 'strict',  // 'strict', 'lax', 'none'
    secure: true
  }
}));

// 3. 自定义 CSRF 令牌
const csrf = require('csurf');
app.use(cookieParser());
app.use(csrf({ cookie: true }));

// 4. 验证 CSRF 令牌
app.get('/form', (req, res) => {
  res.render('form', { csrfToken: req.csrfToken() });
});

app.post('/submit', (req, res) => {
  // CSRF 验证由 csurf 中间件自动处理
  res.json({ message: '提交成功' });
});
```

### 3.3 SQL 注入防护

```javascript
// 1. 使用参数化查询
// ❌ 错误：直接拼接字符串
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ✅ 正确：使用参数化查询
const query = 'SELECT * FROM users WHERE id = $1';
const result = await pool.query(query, [userId]);

// 2. 使用 ORM
const user = await prisma.user.findUnique({
  where: { id: userId }
});

// 3. 验证输入
const Joi = require('joi');

const idSchema = Joi.object({
  id: Joi.number().integer().positive()
});

const { error, value } = idSchema.validate(req.params);
if (error) {
  return res.status(400).json({ error: '无效的 ID' });
}

// 4. 使用数据库的权限控制
// 只给应用分配需要的权限，避免使用 root 用户
```

### 3.4 速率限制

```javascript
// 1. 使用 express-rate-limit
const rateLimit = require('express-rate-limit');

// 基础限流
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 分钟
  max: 100,  // 每次 IP 最多 100 个请求
  message: '请求过于频繁，请稍后再试'
});

app.use('/api/', limiter);

// 2. 登录限流
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,  // 15 分钟内最多 5 次登录尝试
  message: '登录尝试过多，请 15 分钟后重试'
});

app.post('/login', loginLimiter, (req, res) => {
  // 登录逻辑
});

// 3. 自定义 Redis 限流
const { RedisStore } = require('rate-limit-redis');

const redisLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  store: new RedisStore({
    sendCommand: (...args) => redis.sendCommand(...args)
  })
});
```

### 3.5 CORS 配置

```javascript
// 1. 基础 CORS
const cors = require('cors');
app.use(cors());

// 2. 详细 CORS 配置
app.use(cors({
  origin: 'https://example.com',  // 允许的域名
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count'],
  credentials: true,
  maxAge: 86400  // 预检请求缓存 24 小时
}));

// 3. 动态 origin
app.use(cors({
  origin: (origin, callback) => {
    const allowed = ['https://example.com', 'http://localhost:3000'];
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

// 4. 生产环境使用
const whitelist = process.env.CORS_ORIGIN?.split(',') || [];
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? whitelist
    : true
}));
```

---

## 4. 认证授权

### 4.1 JWT深度解析

#### JWT结构详解

```javascript
// JWT由三部分组成：Header.Payload.Signature
// 1. Header（头部）- 包含算法和类型
{
  "alg": "ES256",      // 算法：HS256(对称), RS256(非对称), ES256(椭圆曲线)
  "typ": "JWT",        // 类型
  "kid": "key-id-1"    // 密钥ID，用于多密钥场景
}

// 2. Payload（负载）- 包含声明
{
  "iss": "https://auth.example.com",    // 签发者
  "sub": "user-123",                     // 主题（用户ID）
  "aud": ["api.example.com"],           // 受众（可选多个）
  "exp": 1710000000,                    // 过期时间（Unix时间戳）
  "nbf": 1709996400,                    // 生效时间
  "iat": 1709992800,                    // 签发时间
  "jti": "unique-token-id",             // JWT唯一标识（用于黑名单）
  "role": "admin",
  "permissions": ["users:read", "users:write"]
}

// 3. Signature（签名）- 确保数据完整性
// HMAC SHA256: HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)
```

#### JWT安全实现

```javascript
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// 密钥管理 - 定期轮换密钥
class KeyManager {
  constructor() {
    this.currentKey = process.env.JWT_SECRET_CURRENT;
    this.previousKey = process.env.JWT_SECRET_PREVIOUS;
    this.keyId = process.env.JWT_KEY_ID;
  }

  // 签名时使用当前密钥
  sign(payload) {
    return jwt.sign(payload, this.currentKey, {
      algorithm: 'ES256',  // 使用椭圆曲线算法，安全性更高
      keyid: this.keyId,
      expiresIn: '15m',
      issuer: 'my-app',
      audience: 'api.my-app.com'
    });
  }

  // 验证时尝试多个密钥（支持密钥轮换）
  verify(token) {
    try {
      // 先尝试当前密钥
      return jwt.verify(token, this.currentKey, {
        algorithms: ['ES256', 'RS256'],
        issuer: 'my-app',
        audience: 'api.my-app.com'
      });
    } catch (error) {
      if (error.name === 'JsonWebTokenError' &&
          error.message.includes('signature')) {
        // 当前密钥验证失败，尝试旧密钥（允许短暂的重叠期）
        if (this.previousKey) {
          return jwt.verify(token, this.previousKey, {
            algorithms: ['ES256', 'RS256'],
            issuer: 'my-app',
            audience: 'api.my-app.com'
          });
        }
      }
      throw error;
    }
  }
}

// Token黑名单实现
class TokenBlacklist {
  constructor(redis) {
    this.redis = redis;
  }

  // 将token加入黑名单
  async add(token, reason = 'logout') {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return;

    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await this.redis.setex(`blacklist:${decoded.jti}`, ttl, JSON.stringify({
        reason,
        revokedAt: Date.now(),
        revokedBy: 'system'
      }));
    }
  }

  // 检查token是否在黑名单
  async isBlacklisted(jti) {
    const exists = await this.redis.exists(`blacklist:${jti}`);
    return exists === 1;
  }
}

// 完整的认证中间件
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const token = authHeader.substring(7);

    // 1. 验证Token格式和签名
    const decoded = keyManager.verify(token);

    // 2. 检查Token是否在黑名单
    if (decoded.jti && await blacklist.isBlacklisted(decoded.jti)) {
      return res.status(401).json({ error: '令牌已被撤销' });
    }

    // 3. 检查Token是否过期
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ error: '令牌已过期' });
    }

    // 4. 将用户信息附加到请求对象
    req.user = {
      id: decoded.sub,
      role: decoded.role,
      permissions: decoded.permissions || [],
      tokenId: decoded.jti
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '令牌已过期，请刷新' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: '无效的令牌' });
    }
    next(error);
  }
};
```

### 4.2 密码安全存储

```javascript
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// 密码哈希方案对比
/*
| 方案 | 算法 | 速度 | 安全性 | 备注 |
|------|------|------|--------|------|
| MD5 | MD5 | 极快 | 低 | 已不建议使用 |
| SHA-256 | SHA2 | 快 | 中 | 不适合密码存储 |
| bcrypt | bcrypt | 中 | 高 | 自动加盐，work factor可调 |
| scrypt | scrypt | 慢 | 高 | 内存硬化，抗ASIC |
| Argon2 | Argon2 | 慢 | 最高 | 2015年密码学竞赛冠军 |
*/

// 使用bcrypt存储密码
async function hashPassword(password) {
  const saltRounds = 12;  // 越高越安全，但越慢
  return await bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// 更安全的Argon2实现
const argon2 = require('argon2');

async function hashPasswordArgon2(password) {
  return await argon2.hash(password, {
    type: argon2.argon2id,      // 结合argon2d和argon2i的优点
    memoryCost: 2 ** 16,        // 64MB内存
    timeCost: 3,                // 3次迭代
    parallelism: 1,             // 单线程
    saltLength: 16,
    hashLength: 32
  });
}

async function verifyPasswordArgon2(password, hash) {
  return await argon2.verify(hash, password);
}

// 密码强度验证
function validatePasswordStrength(password) {
  const errors = [];

  if (password.length < 8) {
    errors.push('密码长度至少8个字符');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含小写字母');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含大写字母');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('密码必须包含数字');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('密码必须包含特殊字符');
  }

  // 检查常见密码模式
  const commonPatterns = ['password', '123456', 'qwerty', 'admin'];
  if (commonPatterns.some(p => password.toLowerCase().includes(p))) {
    errors.push('密码包含常见的弱密码模式');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
```

### 4.3 权限控制深度设计

```javascript
// 基于策略的访问控制（PBAC）
class PermissionChecker {
  constructor(policies) {
    this.policies = policies;  // 策略规则
  }

  // 检查用户是否有权限
  can(user, action, resource) {
    // 1. 检查直接权限
    if (user.permissions?.includes(`${resource}:${action}`)) {
      return true;
    }
    if (user.permissions?.includes(`${resource}:*`)) {
      return true;
    }
    if (user.permissions?.includes(`*:${action}`)) {
      return true;
    }
    if (user.permissions?.includes('*:*')) {
      return true;
    }

    // 2. 检查角色策略
    const role = user.role;
    const resourcePolicies = this.policies[role]?.[resource];
    if (resourcePolicies?.includes(action)) {
      return true;
    }

    return false;
  }

  // 条件权限检查
  canWithConditions(user, action, resource, context) {
    // 获取资源的属性
    const resourceOwner = context[`${resource}Owner`];
    const resourceDepartment = context[`${resource}Department`];

    // 管理员拥有所有权限
    if (user.role === 'admin') return true;

    // 所有者可以对自己的资源进行任何操作
    if (resourceOwner === user.id) return true;

    // 同部门用户可以读取
    if (user.department === resourceDepartment && action === 'read') {
      return true;
    }

    // 经理在工作时间内可以操作
    const isWorkHours = new Date().getHours() >= 9 && new Date().getHours() < 18;
    if (user.role === 'manager' && isWorkHours) return true;

    return this.can(user, action, resource);
  }
}

// 策略定义
const policies = {
  admin: {
    users: ['*'],
    orders: ['*'],
    reports: ['*']
  },
  manager: {
    users: ['read', 'write'],
    orders: ['*'],
    reports: ['read', 'write']
  },
  employee: {
    users: ['read'],
    orders: ['read', 'write'],
    reports: []
  }
};

const permissionChecker = new PermissionChecker(policies);

// 权限检查中间件
function requirePermission(resource, action) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '需要登录' });
    }

    if (!permissionChecker.can(req.user, action, resource)) {
      return res.status(403).json({
        error: '权限不足',
        required: `${resource}:${action}`
      });
    }

    next();
  };
}

// 使用示例
app.delete('/users/:id',
  authenticate,
  requirePermission('users', 'delete'),
  async (req, res) => {
    await deleteUser(req.params.id);
    res.json({ message: '用户已删除' });
  }
);
```

---

## 5. OAuth2.0深度实现

### 5.1 OAuth2.0授权类型对比

```javascript
/*
| 授权类型 | 适用场景 | 安全性 | 说明 |
|----------|----------|--------|------|
| Authorization Code | 有后端服务器的Web应用 | 高 | 最安全，推荐使用 |
| PKCE + Authorization Code | SPA、移动端 | 高 | 无后端时的最佳选择 |
| Client Credentials | 服务间通信 | 中 | 机器对机器通信 |
| Device Code | CLI工具、智能电视 | 中 | 适合无浏览器场景 |
| Refresh Token | Token刷新 | 高 | 配合其他授权类型使用 |
| Implicit (已废弃) | - | 低 | 2022年起不推荐使用 |
*/
```

### 5.2 PKCE授权码流程完整实现

```javascript
// OAuth2.0 + PKCE 授权服务器实现
const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const app = express();

// 存储授权请求（生产环境应使用Redis）
const authorizationRequests = new Map();

// 1. 生成授权端点
app.get('/oauth/authorize', async (req, res) => {
  const {
    response_type,      // 必须是code
    client_id,
    redirect_uri,
    scope,
    state,              // CSRF防护
    code_challenge,     // PKCE: 挑战
    code_challenge_method  // PKCE: 方法(S256)
  } = req.query;

  // 验证client_id
  const client = await getClient(client_id);
  if (!client) {
    return res.status(400).send('无效的客户端ID');
  }

  // 验证redirect_uri
  if (!client.redirectUris.includes(redirect_uri)) {
    return res.status(400).send('无效的回调地址');
  }

  // 验证response_type
  if (response_type !== 'code') {
    return res.status(400).send('不支持的响应类型');
  }

  // 生成授权请求ID
  const requestId = crypto.randomUUID();
  authorizationRequests.set(requestId, {
    clientId: client_id,
    redirectUri: redirect_uri,
    scope,
    codeChallenge: code_challenge,
    codeChallengeMethod: code_challenge_method,
    state,
    createdAt: Date.now(),
    userId: null  // 待用户确认后填充
  });

  // 渲染授权确认页面（实际项目中应该是一个完整的登录+授权页面）
  res.send(`
    <html>
      <body>
        <h1>授权确认</h1>
        <p>应用 "${client.name}" 请求以下权限：</p>
        <ul>${scope.split(' ').map(s => `<li>${s}</li>`).join('')}</ul>
        <form method="POST" action="/oauth/authorize/${requestId}">
          <button type="submit" name="action" value="approve">授权</button>
          <button type="submit" name="action" value="deny">拒绝</button>
        </form>
      </body>
    </html>
  `);
});

// 2. 用户确认后处理
app.post('/oauth/authorize/:requestId', async (req, res) => {
  const { requestId } = req.params;
  const { action } = req.body;
  const request = authorizationRequests.get(requestId);

  if (!request) {
    return res.status(400).send('无效的授权请求');
  }

  // 验证请求未过期（10分钟）
  if (Date.now() - request.createdAt > 600000) {
    authorizationRequests.delete(requestId);
    return res.status(400).send('授权请求已过期');
  }

  if (action === 'deny') {
    const redirectUrl = new URL(request.redirectUri);
    redirectUrl.searchParams.set('error', 'access_denied');
    redirectUrl.searchParams.set('error_description', '用户拒绝了授权请求');
    if (request.state) redirectUrl.searchParams.set('state', request.state);
    return res.redirect(redirectUrl.toString());
  }

  // 用户已登录（实际应检查session）
  const userId = req.session?.userId || 'demo-user';
  request.userId = userId;

  // 生成授权码（短期一次性使用）
  const authCode = crypto.randomBytes(32).toString('base64url');

  // 存储授权码（关联PKCE挑战和用户）
  await saveAuthCode(authCode, {
    clientId: request.clientId,
    userId: request.userId,
    redirectUri: request.redirectUri,
    scope: request.scope,
    codeChallenge: request.codeChallenge,
    codeChallengeMethod: request.codeChallengeMethod,
    expiresAt: Date.now() + 600000  // 10分钟有效期
  });

  // 重定向回客户端
  const redirectUrl = new URL(request.redirectUri);
  redirectUrl.searchParams.set('code', authCode);
  if (request.state) redirectUrl.searchParams.set('state', request.state);

  res.redirect(redirectUrl.toString());
  authorizationRequests.delete(requestId);
});

// 3. 令牌端点
app.post('/oauth/token', async (req, res) => {
  const {
    grant_type,
    code,
    client_id,
    client_secret,
    redirect_uri,
    code_verifier  // PKCE: 证明
  } = req.body;

  // 验证客户端凭证
  const client = await getClient(client_id);
  if (!client || client.clientSecret !== client_secret) {
    return res.status(401).json({
      error: 'invalid_client',
      error_description: '客户端认证失败'
    });
  }

  if (grant_type === 'authorization_code') {
    // 获取并验证授权码
    const authCode = await getAuthCode(code);

    if (!authCode) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: '授权码无效'
      });
    }

    // 验证授权码是否过期
    if (Date.now() > authCode.expiresAt) {
      await deleteAuthCode(code);
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: '授权码已过期'
      });
    }

    // 验证客户端ID
    if (authCode.clientId !== client_id) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: '客户端ID不匹配'
      });
    }

    // 验证redirect_uri
    if (authCode.redirectUri !== redirect_uri) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: '回调地址不匹配'
      });
    }

    // PKCE验证：验证code_verifier的哈希等于code_challenge
    if (authCode.codeChallengeMethod === 'S256') {
      const expectedChallenge = crypto
        .createHash('sha256')
        .update(code_verifier)
        .digest('base64url');

      if (expectedChallenge !== authCode.codeChallenge) {
        return res.status(400).json({
          error: 'invalid_grant',
          error_description: 'PKCE验证失败'
        });
      }
    }

    // 删除已使用的授权码（一次性）
    await deleteAuthCode(code);

    // 生成访问令牌和刷新令牌
    const accessToken = jwt.sign(
      {
        sub: authCode.userId,
        clientId: authCode.clientId,
        scope: authCode.scope
      },
      jwtSecret,
      {
        algorithm: 'ES256',
        expiresIn: '1h'
      }
    );

    const refreshToken = jwt.sign(
      {
        sub: authCode.userId,
        clientId: authCode.clientId,
        type: 'refresh',
        jti: crypto.randomUUID()
      },
      refreshSecret,
      {
        algorithm: 'ES256',
        expiresIn: '7d'
      }
    );

    res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: refreshToken,
      scope: authCode.scope
    });

  } else if (grant_type === 'refresh_token') {
    // 刷新令牌流程
    try {
      const decoded = jwt.verify(refreshToken, refreshSecret);

      // 生成新的访问令牌
      const newAccessToken = jwt.sign(
        {
          sub: decoded.sub,
          clientId: decoded.clientId
        },
        jwtSecret,
        {
          algorithm: 'ES256',
          expiresIn: '1h'
        }
      );

      res.json({
        access_token: newAccessToken,
        token_type: 'Bearer',
        expires_in: 3600
      });
    } catch (error) {
      res.status(401).json({
        error: 'invalid_grant',
        error_description: '刷新令牌无效或已过期'
      });
    }
  }
});
```

---

## 6. 高级安全实践

### 6.1 安全响应头完整配置

```javascript
const helmet = require('helmet');

// 完整的安全头配置
app.use(helmet({
  // 内容安全策略（CSP）
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      frameAncestors: ["'none'"],           // 禁止被iframe嵌入
      imgSrc: ["'self'", "data:", "https:"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      upgradeInsecureRequests: [],           // 自动升级HTTP请求到HTTPS
      workerSrc: ["'self'", "blob:"]
    }
  },

  // 防止点击劫持
  frameguard: {
    action: 'deny'  // 禁止被任何网站用iframe嵌入
  },

  // X-Content-Type-Options
  noSniff: true,  // 禁止浏览器猜测内容类型

  // X-XSS-Protection（现代浏览器已忽略，但保留兼容性）
  xssFilter: true,

  // 严格传输安全（HSTS）
  hsts: {
    maxAge: 31536000,        // 1年
    includeSubDomains: true,  // 包含子域名
    preload: true            // 加入浏览器预加载列表
  },

  // 引用策略
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'  // 尽量减少信息泄露
  },

  // 权限策略（Permissions Policy）
  permissionsPolicy: {
    features: {
      fullscreen: ["self"],
      microphone: ["none"],
      camera: ["none"],
      geolocation: ["self"],
      payment: ["self"]
    }
  }
}));

// 额外的安全头
app.use((req, res, next) => {
  // 禁止缓存敏感内容
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store');
  }

  // 自定义安全相关头
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

  // 可信时间戳头（用于日志追溯）
  res.setHeader('X-Request-Id', crypto.randomUUID());

  next();
});
```

### 6.2 输入验证深度实现

```javascript
const Joi = require('joi');
const { validator } = require('express-joi-validation');

// 用户注册验证模式
const registerSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': '用户名只能包含字母和数字',
      'string.min': '用户名至少3个字符',
      'string.max': '用户名最多30个字符'
    }),

  email: Joi.string()
    .email()
    .max(255)
    .required()
    .lowercase()
    .normalizeEmail(),

  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.pattern.base': '密码必须包含大小写字母、数字和特殊字符'
    }),

  age: Joi.number()
    .integer()
    .min(13)
    .max(120)
    .optional(),

  role: Joi.string()
    .valid('user', 'admin')
    .default('user'),

  // 自定义验证函数
  referralCode: Joi.string()
    .custom((value, helpers) => {
      if (value && !isValidReferralCode(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    })
    .optional()
});

// 文件上传验证
const uploadSchema = Joi.object({
  file: Joi.object({
    mimetype: Joi.string()
      .valid('image/jpeg', 'image/png', 'image/gif', 'application/pdf')
      .required(),
    size: Joi.number()
      .max(5 * 1024 * 1024)  // 5MB
      .required(),
    originalname: Joi.string()
      .max(255)
      .pattern(/^[\w\s.-]+$/)
      .required()
  }).required(),

  folder: Joi.string()
    .max(100)
    .pattern(/^[\w-]+$/)
    .default('uploads')
});

// 查询参数验证（用于过滤和分页）
const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().pattern(/^[a-zA-Z_]+:(asc|desc)$/),
  filter: Joi.object().pattern(
    Joi.string().valid('status', 'role', 'createdAt'),
    Joi.alternatives().try(
      Joi.string(),
      Joi.number(),
      Joi.object({
        gte: Joi.date().iso(),
        lte: Joi.date().iso()
      })
    )
  ),
  search: Joi.string().max(100).trim()
});

// 验证中间件工厂
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,    // 收集所有错误
      stripUnknown: true,    // 移除未知字段
      convert: true          // 自动类型转换
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }));

      return res.status(400).json({
        error: '验证失败',
        details: errors
      });
    }

    // 用验证后的值替换原请求数据
    req[property] = value;
    next();
  };
};

// 使用示例
app.post('/api/users',
  validate(registerSchema, 'body'),
  validate(querySchema, 'query'),
  async (req, res) => {
    // req.body 和 req.query 已通过验证
    const { username, email, password } = req.body;
    // ...
  }
);
```

### 6.3 敏感数据处理

```javascript
const crypto = require('crypto');

// 敏感字段自动脱敏中间件
const sensitiveFields = ['password', 'ssn', 'creditCard', 'apiKey', 'secret'];

function redactSensitiveData(obj, depth = 0) {
  if (depth > 10) return '[MAX_DEPTH]';  // 防止无限递归
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveData(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveFields.includes(key.toLowerCase())) {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        result[key] = redactSensitiveData(value, depth + 1);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  return obj;
}

// 日志脱敏中间件
app.use((req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    const sanitizedBody = redactSensitiveData(body);
    console.log('Response:', JSON.stringify(sanitizedBody));
    return originalJson(sanitizedBody);
  };

  // 记录请求（不包含敏感数据）
  const sanitizedReq = redactSensitiveData({
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    headers: {
      host: req.headers.host,
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type']
      // 移除 authorization 等敏感头
    }
  });
  console.log('Request:', JSON.stringify(sanitizedReq));

  next();
});

// 数据加密存储（AES-256-GCM）
class DataEncryption {
  constructor(key) {
    // 密钥必须是32字节
    this.key = crypto.scryptSync(key, 'salt', 32);
  }

  encrypt(plaintext) {
    const iv = crypto.randomBytes(16);  // 初始化向量
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();  // 认证标签

    return {
      iv: iv.toString('hex'),
      encrypted,
      authTag: authTag.toString('hex')
    };
  }

  decrypt(encryptedData) {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.key,
      Buffer.from(encryptedData.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

---

## 7. 常见面试问题

### 问题1：RESTful API设计最佳实践？

**答案：**

1. **资源命名**：使用名词复数形式，使用嵌套表示关系
2. **HTTP方法**：GET（读取）、POST（创建）、PUT（完整更新）、PATCH（部分更新）、DELETE（删除）
3. **状态码**：正确使用HTTP状态码，2xx成功、4xx客户端错误、5xx服务器错误
4. **版本控制**：URL路径方式最直观，如 `/api/v1/users`
5. **分页**：使用 `page`、`limit` 或 `offset`、`limit` 参数
6. **错误处理**：返回统一的错误格式，包含错误码和描述
7. **安全性**：使用HTTPS、认证授权、输入验证、限流

### 问题2：JWT vs Session，哪个更好？

**答案：** 根据场景选择

| 场景 | 推荐方案 | 原因 |
|------|----------|------|
| 微服务架构 | JWT | 无状态，跨服务验证方便 |
| 单体应用 | Session | 服务器端控制，安全性更高 |
| 移动端 | JWT | 移动端存储Token更方便 |
| 高安全要求 | Session | 可以立即撤销，HttpOnly Cookie防XSS |

### 问题3：如何防止API被恶意调用？

**答案：**

1. **认证授权**：JWT、OAuth2.0、API Key
2. **限流**：令牌桶、滑动窗口、Redis分布式限流
3. **黑白名单**：IP白名单/黑名单
4. **验证码**：行为验证、图形验证码
5. **监控**：异常请求模式检测
6. **WAF**：Web应用防火墙

### 问题4：HATEOAS的作用是什么？

**答案：**

1. **解耦**：客户端不需要硬编码API结构
2. **自描述**：响应包含可用操作的链接
3. **可发现性**：新API无需更新客户端即可使用
4. **导航**：客户端可以通过链接自然导航

### 问题5：API网关的核心功能有哪些？

**答案：**

1. **路由**：根据路径、方法等路由到后端服务
2. **认证**：集中处理身份验证
3. **限流**：防止DDoS和资源滥用
4. **监控**：请求日志、性能指标
5. **缓存**：减少后端压力
6. **协议转换**：支持多种协议
7. **负载均衡**：分发请求到多个实例

---

## 最佳实践清单

- [ ] 使用HTTPS加密所有通信
- [ ] 使用正确的HTTP方法
- [ ] 返回合适的HTTP状态码
- [ ] 实现认证授权机制
- [ ] 验证所有输入数据
- [ ] 设置限流防止滥用
- [ ] 记录审计日志
- [ ] 使用安全响应头
- [ ] 实现优雅的错误处理
- [ ] 考虑分页和过滤
- [ ] 版本控制API
- [ ] 使用HATEOAS提高可发现性
- [ ] 加密存储敏感数据
- [ ] 定期更新依赖库
- [ ] 进行安全测试

---

*本文档最后更新于 2026年3月*
