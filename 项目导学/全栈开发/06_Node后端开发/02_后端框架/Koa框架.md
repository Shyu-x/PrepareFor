# Koa 框架详解

## 目录

1. [Koa vs Express](#1-koa-vs-express)
2. [Koa 基础](#2-koa-基础)
3. [中间件组合](#3-中间件组合)
4. [洋葱模型](#4-洋葱模型)
5. [异步错误处理](#5-异步错误处理)

---

## 1. Koa vs Express

### 1.1 核心区别

| 特性 | Express | Koa |
|------|---------|-----|
| 体积 | 较大 | 非常轻量 |
| 异步处理 | 回调函数 | async/await |
| 中间件模型 | 线性 | 洋葱模型 |
| 社区 | 更大 | 较小但活跃 |
| 学习曲线 | 较低 | 较低 |

### 1.2 代码对比

```javascript
// Express 写法
const express = require('express');
const app = express();

app.get('/users', (req, res, next) => {
  // 异步操作
  getUsers((err, users) => {
    if (err) return next(err);
    res.json(users);
  });
});

// Koa 写法
const Koa = require('koa');
const app = new Koa();

app.use(async (ctx, next) => {
  if (ctx.path === '/users') {
    const users = await getUsers();
    ctx.body = users;
  } else {
    await next();
  }
});
```

---

## 2. Koa 基础

### 2.1 快速开始

```javascript
const Koa = require('koa');
const app = new Koa();

// 基础中间件
app.use(async (ctx) => {
  ctx.body = 'Hello Koa!';
});

app.listen(3000, () => {
  console.log('Koa 服务器运行在 http://localhost:3000');
});
```

### 2.2 Context 对象

Koa 的 Context 对象封装了请求和响应，提供统一的 API。

```javascript
app.use(async (ctx) => {
  // ctx.request - 请求对象
  // ctx.response - 响应对象

  // 请求信息
  console.log(ctx.method);     // GET
  console.log(ctx.url);        // /users?id=1
  console.log(ctx.path);       // /users
  console.log(ctx.query);      // { id: '1' }
  console.log(ctx.params);     // 路由参数
  console.log(ctx.headers);    // 请求头

  // 响应设置
  ctx.status = 200;
  ctx.body = '响应内容';
  ctx.set('X-Custom-Header', 'value');

  // 便捷方法
  // ctx.assert(condition, status, message)
  // ctx.throw(status, message)
});
```

### 2.3 路由

Koa 本身不包含路由，需要使用第三方中间件 `@koa/router`。

```javascript
const Koa = require('koa');
const Router = require('@koa/router');

const app = new Koa();
const router = new Router();

// 基础路由
router.get('/', (ctx) => {
  ctx.body = '首页';
});

router.get('/users', (ctx) => {
  ctx.body = ['张三', '李四'];
});

router.get('/users/:id', (ctx) => {
  ctx.body = { id: ctx.params.id, name: '用户' + ctx.params.id };
});

// POST 路由
router.post('/users', (ctx) => {
  const user = ctx.request.body;
  ctx.body = { success: true, user };
});

// 路由前缀
const apiRouter = new Router({ prefix: '/api' });
apiRouter.get('/users', (ctx) => {
  ctx.body = 'API 用户列表';
});

// 注册路由中间件
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000);
```

---

## 3. 中间件组合

### 3.1 中间件基础

```javascript
const Koa = require('koa');
const app = new Koa();

// 中间件函数
const logger = async (ctx, next) => {
  console.log(`${ctx.method} ${ctx.url}`);
  await next();
  console.log('响应完成');
};

const authenticate = async (ctx, next) => {
  const token = ctx.headers.authorization;

  if (!token) {
    ctx.status = 401;
    ctx.body = { error: '未授权' };
    return;
  }

  await next();
};

const validateBody = async (ctx, next) => {
  if (ctx.method === 'POST' || ctx.method === 'PUT') {
    if (!ctx.request.body || Object.keys(ctx.request.body).length === 0) {
      ctx.status = 400;
      ctx.body = { error: '请求体不能为空' };
      return;
    }
  }

  await next();
};

// 注册中间件
app.use(logger);
app.use(validateBody);
app.use(authenticate);

app.use(async (ctx) => {
  ctx.body = 'Hello';
});
```

### 3.2 中间件模块化

```javascript
// middleware/logger.js
const logger = () => {
  return async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
  };
};

module.exports = logger;

// middleware/error.js
const errorHandler = () => {
  return async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      ctx.status = err.status || 500;
      ctx.body = { error: err.message };
      console.error('错误:', err);
    }
  };
};

module.exports = errorHandler;

// app.js
const Koa = require('koa');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/error');

const app = new Koa();

app.use(errorHandler());
app.use(logger());

app.use(async (ctx) => {
  ctx.body = 'Hello Koa!';
});
```

---

## 4. 洋葱模型

### 4.1 洋葱模型原理

Koa 的中间件执行像洋葱一样，外层中间件先执行，然后在适当位置执行内层，最后再执行外层的后续代码。

```
请求进入:
┌─────────────────────────────────────┐
│  Middleware 1 (外层)                 │
│  ┌─────────────────────────────────┐│
│  │  Middleware 2                   ││
│  │  ┌───────────────────────────┐ ││
│  │  │  Middleware 3 (最内层)   │ ││
│  │  │       处理请求            │ ││
│  │  └───────────────────────────┘ ││
│  │  Middleware 2 后续代码          ││
│  └─────────────────────────────────┘│
│  Middleware 1 后续代码              │
└─────────────────────────────────────┘
响应返回:
```

### 4.2 代码示例

```javascript
const Koa = require('koa');
const app = new Koa();

// 第一个中间件
app.use(async (ctx, next) => {
  console.log('1. 开始 - 第一个中间件');
  await next();
  console.log('1. 结束 - 第一个中间件');
});

// 第二个中间件
app.use(async (ctx, next) => {
  console.log('2. 开始 - 第二个中间件');
  await next();
  console.log('2. 结束 - 第二个中间件');
});

// 第三个中间件
app.use(async (ctx, next) => {
  console.log('3. 开始 - 第三个中间件');
  await next();
  console.log('3. 结束 - 第三个中间件');
});

app.use(async (ctx) => {
  console.log('4. 处理请求');
  ctx.body = 'Hello';
});

/*
输出顺序:
1. 开始 - 第一个中间件
2. 开始 - 第二个中间件
3. 开始 - 第三个中间件
4. 处理请求
3. 结束 - 第三个中间件
2. 结束 - 第二个中间件
1. 结束 - 第一个中间件
*/
```

### 4.3 洋葱模型应用场景

```javascript
// 场景 1: 请求日志
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();  // 执行后续中间件
  const duration = Date.now() - start;
  console.log(`请求 ${ctx.url} 耗时 ${duration}ms`);
});

// 场景 2: 错误处理
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = { error: err.message };
  }
});

// 场景 3: 缓存
app.use(async (ctx, next) => {
  const cached = cache.get(ctx.url);
  if (cached) {
    ctx.body = cached;
    return;
  }

  await next();  // 执行请求处理

  // 缓存响应
  cache.set(ctx.url, ctx.body);
});
```

---

## 5. 异步错误处理

### 5.1 try-catch 处理

```javascript
const Koa = require('koa');
const app = new Koa();

// 错误处理中间件
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = {
      error: err.message
    };
    // 生产环境可以记录详细日志
    if (process.env.NODE_ENV === 'development') {
      ctx.body.stack = err.stack;
    }
  }
});

// 异步路由
app.use(async (ctx) => {
  const id = ctx.params.id;
  const user = await getUserById(id);  // 可能抛出错误

  if (!user) {
    ctx.throw(404, '用户不存在');
  }

  ctx.body = user;
});
```

### 5.2 ctx.throw 抛出错误

```javascript
app.use(async (ctx) => {
  const { id } = ctx.params;

  if (!id) {
    ctx.throw(400, '缺少 ID 参数');
  }

  const user = await findUser(id);

  if (!user) {
    ctx.throw(404, '用户不存在');
  }

  // 简化写法
  ctx.assert(id, 400, '缺少 ID');

  ctx.body = user;
});
```

### 5.3 自定义错误类

```javascript
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

class NotFoundError extends AppError {
  constructor(message = '资源不存在') {
    super(message, 404);
  }
}

class ValidationError extends AppError {
  constructor(message = '验证失败') {
    super(message, 400);
  }
}

// 使用
app.use(async (ctx) => {
  const user = await getUser(ctx.params.id);

  if (!user) {
    throw new NotFoundError('用户不存在');
  }

  ctx.body = user;
});
```

### 5.4 error 事件

```javascript
const Koa = require('koa');
const app = new Koa();

// 监听 error 事件
app.on('error', (err, ctx) => {
  console.error('应用错误:', err);
  console.error('错误上下文:', ctx.url);
  // 可以发送错误通知
  sendErrorNotification(err);
});

app.use(async (ctx) => {
  throw new Error('测试错误');
});
```

---

## Koa 常用中间件

| 中间件 | 用途 |
|--------|------|
| @koa/router | 路由 |
| koa-body | 请求体解析 |
| @koa/cors | 跨域 |
| koa-static | 静态文件 |
| koa-views | 模板引擎 |
| koa-logger | 日志 |
| koa-mount | 挂载应用 |
| koa-compose | 组合中间件 |

---

## 常见面试问题

### 问题 1：Koa 的洋葱模型是什么？

**答案：** Koa 的中间件执行像洋葱，外层中间件先执行，遇到 next() 进入内层，执行完后再返回外层执行后续代码。

### 问题 2：Koa 和 Express 哪个更好？

**答案：** 选择取决于项目需求。Express 更成熟，生态更丰富；Koa 更轻量，代码更优雅。需要快速开发选 Express，追求轻量选 Koa。

---

## 最佳实践

1. **使用 async/await**：Koa 天然支持 async/await，避免回调
2. **错误处理**：使用 try-catch 包装异步代码
3. **中间件组织**：按功能拆分中间件，保持代码清晰
4. **类型检查**：使用 TypeScript 或 JSDoc 增强类型安全

---

## 6. 实战：RESTful API 完整示例

### 6.1 项目结构

```
koa-api/
├── src/
│   ├── controllers/      # 控制器
│   │   ├── user.controller.js
│   │   └── auth.controller.js
│   ├── middleware/       # 中间件
│   │   ├── auth.js
│   │   ├── error.js
│   │   └── validate.js
│   ├── models/           # 数据模型
│   │   └── user.model.js
│   ├── routes/           # 路由
│   │   ├── index.js
│   │   ├── user.routes.js
│   │   └── auth.routes.js
│   ├── services/         # 业务逻辑
│   │   ├── user.service.js
│   │   └── auth.service.js
│   ├── utils/            # 工具函数
│   │   ├── jwt.js
│   │   └── response.js
│   └── app.js            # 应用入口
├── tests/                # 测试文件
├── .env                  # 环境变量
└── package.json
```

### 6.2 完整应用代码

```javascript
// src/app.js
const Koa = require('koa');
const Router = require('@koa/router');
const koaBody = require('koa-body');
const cors = require('@koa/cors');
const helmet = require('koa-helmet');
const rateLimit = require('koa-ratelimit');

const errorHandler = require('./middleware/error');
const authMiddleware = require('./middleware/auth');
const userRoutes = require('./routes/user.routes');
const authRoutes = require('./routes/auth.routes');

const app = new Koa();
const router = new Router();

// 安全中间件
app.use(helmet());

// CORS 配置
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// 请求体解析
app.use(koaBody({
  json: true,
  multipart: true,
  formidable: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
  },
}));

// 速率限制
app.use(rateLimit({
  db: new Map(),
  duration: 60000, // 1 分钟
  max: 100, // 每个 IP 最多 100 次请求
  id: (ctx) => ctx.ip,
  errorMessage: '请求过于频繁，请稍后再试',
}));

// 错误处理
app.use(errorHandler);

// 路由
router.use('/auth', authRoutes.routes());
router.use('/users', authMiddleware, userRoutes.routes());

// 健康检查
router.get('/health', (ctx) => {
  ctx.body = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
});

app.use(router.routes());
app.use(router.allowedMethods());

// 404 处理
app.use((ctx) => {
  ctx.status = 404;
  ctx.body = { error: '资源不存在' };
});

module.exports = app;
```

### 6.3 认证中间件

```javascript
// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { unauthorized, forbidden } = require('../utils/response');

// JWT 认证中间件
const authMiddleware = async (ctx, next) => {
  const authHeader = ctx.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorized(ctx, '未提供认证令牌');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    ctx.state.user = decoded;
    await next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return unauthorized(ctx, '令牌已过期');
    }
    return unauthorized(ctx, '无效的令牌');
  }
};

// 角色授权中间件
const authorize = (...roles) => {
  return async (ctx, next) => {
    if (!ctx.state.user) {
      return unauthorized(ctx, '未认证');
    }

    if (!roles.includes(ctx.state.user.role)) {
      return forbidden(ctx, '无权限执行此操作');
    }

    await next();
  };
};

module.exports = authMiddleware;
module.exports.authorize = authorize;
```

### 6.4 错误处理中间件

```javascript
// src/middleware/error.js
const errorHandler = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;

    // 开发环境显示详细错误
    const response = {
      error: err.message || '服务器内部错误',
      code: err.code || 'INTERNAL_ERROR',
    };

    if (process.env.NODE_ENV === 'development') {
      response.stack = err.stack;
      response.details = err.details;
    }

    ctx.body = response;

    // 记录错误日志
    console.error(`[${new Date().toISOString()}] ${ctx.method} ${ctx.url} - ${ctx.status} - ${err.message}`);
  }
};

// 自定义错误类
class AppError extends Error {
  constructor(message, status = 500, code = 'APP_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

class NotFoundError extends AppError {
  constructor(message = '资源不存在') {
    super(message, 404, 'NOT_FOUND');
  }
}

class ValidationError extends AppError {
  constructor(message = '验证失败', details = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class UnauthorizedError extends AppError {
  constructor(message = '未授权') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = '禁止访问') {
    super(message, 403, 'FORBIDDEN');
  }
}

module.exports = errorHandler;
module.exports.AppError = AppError;
module.exports.NotFoundError = NotFoundError;
module.exports.ValidationError = ValidationError;
module.exports.UnauthorizedError = UnauthorizedError;
module.exports.ForbiddenError = ForbiddenError;
```

### 6.5 用户路由和服务

```javascript
// src/routes/user.routes.js
const Router = require('@koa/router');
const { validate } = require('../middleware/validate');
const { authorize } = require('../middleware/auth');
const userService = require('../services/user.service');
const { createUserSchema, updateUserSchema } = require('../validators/user.validator');

const router = new Router();

// 获取用户列表
router.get('/', async (ctx) => {
  const { page = 1, limit = 10, search } = ctx.query;
  const result = await userService.findAll({
    page: parseInt(page),
    limit: parseInt(limit),
    search,
  });
  ctx.body = result;
});

// 获取单个用户
router.get('/:id', async (ctx) => {
  const user = await userService.findById(parseInt(ctx.params.id));
  ctx.body = user;
});

// 创建用户（仅管理员）
router.post('/', authorize('admin'), validate(createUserSchema), async (ctx) => {
  const user = await userService.create(ctx.request.body);
  ctx.status = 201;
  ctx.body = user;
});

// 更新用户
router.put('/:id', validate(updateUserSchema), async (ctx) => {
  const user = await userService.update(
    parseInt(ctx.params.id),
    ctx.request.body,
    ctx.state.user.id
  );
  ctx.body = user;
});

// 删除用户（仅管理员）
router.delete('/:id', authorize('admin'), async (ctx) => {
  await userService.delete(parseInt(ctx.params.id));
  ctx.status = 204;
});

module.exports = router;
```

```javascript
// src/services/user.service.js
const { NotFoundError, ForbiddenError } = require('../middleware/error');

class UserService {
  constructor() {
    // 模拟数据库
    this.users = [
      { id: 1, name: '张三', email: 'zhangsan@example.com', role: 'user' },
      { id: 2, name: '李四', email: 'lisi@example.com', role: 'admin' },
    ];
    this.nextId = 3;
  }

  async findAll({ page = 1, limit = 10, search } = {}) {
    let filtered = this.users;

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower)
      );
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id) {
    const user = this.users.find(u => u.id === id);
    if (!user) {
      throw new NotFoundError(`用户 ${id} 不存在`);
    }
    return user;
  }

  async create(data) {
    const user = {
      id: this.nextId++,
      ...data,
      createdAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  async update(id, data, currentUserId) {
    const user = await this.findById(id);

    // 只能修改自己或管理员可以修改所有人
    if (user.id !== currentUserId) {
      throw new ForbiddenError('无权修改其他用户');
    }

    Object.assign(user, data, { updatedAt: new Date() });
    return user;
  }

  async delete(id) {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) {
      throw new NotFoundError(`用户 ${id} 不存在`);
    }
    this.users.splice(index, 1);
  }
}

module.exports = new UserService();
```

---

## 7. 测试

### 7.1 单元测试

```javascript
// tests/user.service.test.js
const userService = require('../src/services/user.service');

describe('UserService', () => {
  describe('findAll', () => {
    it('应该返回用户列表', async () => {
      const result = await userService.findAll({ page: 1, limit: 10 });
      expect(result.data).toBeInstanceOf(Array);
      expect(result.pagination).toBeDefined();
    });

    it('应该支持搜索', async () => {
      const result = await userService.findAll({ search: '张三' });
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0].name).toContain('张三');
    });
  });

  describe('findById', () => {
    it('应该返回指定用户', async () => {
      const user = await userService.findById(1);
      expect(user.id).toBe(1);
    });

    it('应该抛出 NotFoundError', async () => {
      await expect(userService.findById(999)).rejects.toThrow('不存在');
    });
  });
});
```

### 7.2 API 测试

```javascript
// tests/api.test.js
const request = require('supertest');
const app = require('../src/app');

describe('User API', () => {
  let token;

  beforeAll(async () => {
    // 获取测试 token
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    token = response.body.token;
  });

  describe('GET /users', () => {
    it('应该返回用户列表', async () => {
      const response = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('应该拒绝未认证请求', async () => {
      await request(app)
        .get('/users')
        .expect(401);
    });
  });

  describe('POST /users', () => {
    it('应该创建用户', async () => {
      const response = await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: '新用户',
          email: 'new@example.com',
          password: 'password123',
        })
        .expect(201);

      expect(response.body.name).toBe('新用户');
    });
  });
});
```

---

## 8. 生产环境部署

### 8.1 PM2 配置

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'koa-api',
    script: './src/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3000,
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
  }],
};
```

### 8.2 Docker 部署

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src ./src

EXPOSE 3000

CMD ["node", "src/index.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://user:pass@db:5432/mydb
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: always

  db:
    image: postgres:16
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## 9. 面试高频问题

### 问题 1：Koa 的洋葱模型是什么？

**答案：** Koa 的中间件执行像洋葱，外层中间件先执行，遇到 next() 进入内层，执行完后再返回外层执行后续代码。这种模型非常适合日志记录、错误处理、性能监控等场景。

### 问题 2：Koa 和 Express 哪个更好？

**答案：** 
- **Express**：生态成熟，中间件丰富，适合快速开发
- **Koa**：轻量优雅，async/await 支持好，适合追求代码质量的项目

### 问题 3：Koa 中如何处理错误？

**答案：**
1. 使用 try-catch 包装异步代码
2. 使用 ctx.throw() 抛出错误
3. 使用 error 事件监听全局错误
4. 创建错误处理中间件统一处理

### 问题 4：Koa 的 Context 对象有什么作用？

**答案：** Context 对象封装了 request 和 response，提供统一的 API 来处理请求和响应。它还包含 state 属性用于在中间件间传递数据。

### 问题 5：如何在 Koa 中实现文件上传？

**答案：** 使用 koa-body 或 koa-multer 中间件处理文件上传，支持单文件、多文件上传，可以配置文件大小限制、类型过滤等。

---

## 10. 最佳实践总结

### 10.1 安全清单

- [ ] 使用 koa-helmet 设置安全头
- [ ] 配置 CORS 白名单
- [ ] 实现速率限制
- [ ] 输入验证和清洗
- [ ] JWT 安全配置
- [ ] 错误信息不暴露敏感信息
- [ ] 使用 HTTPS

### 10.2 性能优化清单

- [ ] 启用响应压缩
- [ ] 使用连接池
- [ ] 实现缓存策略
- [ ] 静态资源 CDN
- [ ] 数据库索引优化
- [ ] 使用集群模式
- [ ] 日志异步写入

### 10.3 代码规范

- [ ] 使用 ESLint + Prettier
- [ ] 统一错误处理
- [ ] 统一响应格式
- [ ] 编写单元测试
- [ ] 使用 TypeScript

---

*本文档最后更新于 2026年3月*
