# Express / Koa / NestJS 框架完全指南

## 目录

1. [Express 框架深入](#1-express-框架深入)
2. [Koa 框架](#2-koa-框架)
3. [NestJS 框架](#3-nestjs-框架)
4. [框架对比与选型](#4-框架对比与选型)
5. [实战案例](#5-实战案例)

---

## 1. Express 框架深入

### 1.1 Express 核心概念

Express 是 Node.js 最流行的 Web 框架，简洁灵活，提供强大的中间件机制。

```
┌─────────────────────────────────────────────────────────────────┐
│                        Express 请求处理流程                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   客户端请求                                                      │
│       ↓                                                          │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    中间件链                               │   │
│   │                                                          │   │
│   │  ┌──────────┐    ┌──────────┐    ┌──────────┐        │   │
│   │  │ Logger   │ → │ Auth    │ → │ Router   │        │   │
│   │  │ 中间件    │    │ 中间件    │    │ 中间件    │        │   │
│   │  └──────────┘    └──────────┘    └──────────┘        │   │
│   │                                                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│       ↓                                                          │
│   路由处理器                                                     │
│       ↓                                                          │
│   响应返回                                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 快速开始

```javascript
const express = require('express');
const app = express();

// 基础路由
app.get('/', (req, res) => {
  res.send('Hello Express!');
});

app.post('/api/users', (req, res) => {
  res.status(201).json({ message: '用户创建成功' });
});

// 监听端口
app.listen(3000, () => {
  console.log('服务器运行在 http://localhost:3000');
});
```

### 1.3 中间件

中间件是 Express 的核心概念，是一个具有访问请求对象、响应对象和下一个中间件函数的函数。

```javascript
// 中间件函数结构
function middleware(req, res, next) {
  // 处理逻辑
  // ...
  next(); // 调用下一个中间件
}

// ============================================
// 1. 应用级中间件 - 全局使用
// ============================================

// 日志中间件
app.use((req, res, next) => {
  const start = Date.now();

  // 监听响应完成
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });

  next();
});

// 路径匹配中间件
app.use('/api', (req, res, next) => {
  console.log('API 请求:', req.path);
  next();
});

// 条件中间件
app.use((req, res, next) => {
  if (req.path.startsWith('/admin')) {
    // 管理员特殊处理
  }
  next();
});

// ============================================
// 2. 路由级中间件 - 仅在特定路由使用
// ============================================

const verifyAuth = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: '未授权' });
  }
  // 验证 token...
  next();
};

app.get('/profile', verifyAuth, (req, res) => {
  res.json({ user: req.user });
});

// ============================================
// 3. 错误处理中间件 - 必须在最后
// ============================================

// 同步错误处理
app.use((err, req, res, next) => {
  console.error('错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

// 异步错误处理（需要手动传递错误）
app.get('/async', async (req, res, next) => {
  try {
    const result = await someAsyncOperation();
    res.json(result);
  } catch (err) {
    next(err); // 传递给错误处理中间件
  }
});

// ============================================
// 4. 内置中间件
// ============================================

// 解析 JSON 请求体
app.use(express.json());

// 解析 URL 编码表单
app.use(express.urlencoded({ extended: true }));

// 解析原始请求体
app.use(express.raw());

// 解析文本请求体
app.use(express.text());

// 提供静态文件
app.use(express.static('public'));
app.use('/static', express.static('public'));

// 视图模板引擎
app.set('view engine', 'ejs');
app.set('views', './views');

// ============================================
// 5. 第三方中间件
// ============================================

const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(helmet()); // 安全头
app.use(morgan('dev')); // HTTP 日志
app.use(compression()); // 响应压缩
```

### 1.4 路由系统

```javascript
const express = require('express');
const router = express.Router();

// ============================================
// 1. 基础路由
// ============================================

// GET 请求
router.get('/users', (req, res) => {
  res.json({ users: [] });
});

// POST 请求
router.post('/users', (req, res) => {
  const user = req.body;
  res.status(201).json({ id: 1, ...user });
});

// PUT 请求（完整更新）
router.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const data = req.body;
  res.json({ id, ...data });
});

// PATCH 请求（部分更新）
router.patch('/users/:id', (req, res) => {
  const { id } = req.params;
  res.json({ message: `用户 ${id} 更新成功` });
});

// DELETE 请求
router.delete('/users/:id', (req, res) => {
  res.json({ message: '用户删除成功' });
});

// ============================================
// 2. 路由参数
// ============================================

// 路径参数
router.get('/users/:id', (req, res) => {
  const { id } = req.params;
  res.json({ userId: id });
});

// 多个参数
router.get('/users/:userId/posts/:postId', (req, res) => {
  const { userId, postId } = req.params;
  res.json({ userId, postId });
});

// 可选参数
router.get('/users/:id?', (req, res) => {
  const { id } = req.params;
  if (id) {
    res.json({ user: { id } });
  } else {
    res.json({ users: [] });
  }
});

// 正则匹配
router.get('/users/:id([0-9]+)', (req, res) => {
  res.json({ id: req.params.id });
});

// ============================================
// 3. 查询参数
// ============================================

router.get('/search', (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;

  res.json({
    query: q,
    page: parseInt(page),
    limit: parseInt(limit),
    results: []
  });
});

// ============================================
// 4. 路由模块化
// ============================================

// users.js 路由模块
// const express = require('express');
// const router = express.Router();
// router.get('/', ...)
// router.get('/:id', ...)
// module.exports = router;

// 主应用中使用
// const usersRouter = require('./routes/users');
// app.use('/users', usersRouter);

// 路由前缀
app.use('/api/v1', usersRouter);

// ============================================
// 5. 路由链式调用
// ============================================

router
  .route('/users/:id')
  .get((req, res) => {
    res.json({ id: req.params.id });
  })
  .put((req, res) => {
    res.json({ message: '更新成功' });
  })
  .delete((req, res) => {
    res.json({ message: '删除成功' });
  });
```

### 1.5 请求对象与响应对象

```javascript
// ============================================
// 请求对象 (Request)
// ============================================

// 请求路径
req.path      // /api/users
req.originalUrl // /api/users?id=1
req.url       // /api/users?id=1
req.baseUrl   // /api
req.route     // 路由信息

// 请求方法
req.method    // GET, POST, PUT, DELETE

// 查询参数
req.query     // { id: '1', name: 'test' }

// 路径参数
req.params    // { id: '1' }

// 请求体（需使用 express.json() 中间件）
req.body      // { name: '张三', email: 'test@example.com' }

// 请求头
req.headers   // { authorization: 'Bearer token', content-type: 'application/json' }

// IP 地址
req.ip        // '192.168.1.1'
req.ips       // ['192.168.1.1', '192.168.1.2']

// 协议与主机
req.protocol  // 'http' 或 'https'
req.hostname  // 'example.com'
req.subdomains // ['api', 'v2']

// 文件上传
req.file      // 单个文件
req.files     // 多个文件（需使用 multer）

// Cookies
req.cookies   // { token: 'xxx' }
req.signedCookies // 签名 cookies

// 判断内容类型
req.is('json')   // 'json' | false
req.is('html')   // 'html' | false

// ============================================
// 响应对象 (Response)
// ============================================

// 发送响应
res.send('Hello');              // 发送字符串
res.send({ error: 'error' });  // 发送对象
res.send(Buffer.from('buf'));  // 发送 Buffer

// JSON 响应
res.json({ error: 'error' });
res.jsonp({ error: 'error' }); // JSONP 响应

// 状态码
res.status(404).json({ error: 'Not Found' });
res.statusCode = 404;

// 响应头
res.set('Content-Type', 'application/json');
res.set({
  'Content-Type': 'application/json',
  'X-Custom-Header': 'value'
});

// 重定向
res.redirect('/new-page');
res.redirect(301, '/new-page'); // 301 永久重定向
res.redirect('http://external.com');

// 文件下载
res.download('./file.pdf'); // 弹出下载对话框
res.download('./file.pdf', 'custom-name.pdf'); // 指定文件名
res.attachment('./image.png'); // 设置下载头但不发送

// 发送文件
res.sendFile('./static/index.html'); // 发送静态文件
res.render('template', { data: 'value' }); // 渲染模板

// 响应完成回调
res.on('finish', () => {
  console.log('响应发送完成');
});

// 结束响应
res.end(); // 结束响应，不发送数据

// 链式调用
res
  .status(201)
  .set('X-Custom', 'value')
  .json({ success: true });
```

### 1.6 错误处理

```javascript
// ============================================
// 1. 基础错误处理
// ============================================

// 404 处理（必须放在所有路由之后）
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('错误堆栈:', err.stack);

  // 根据错误类型返回不同状态码
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// 2. 异步错误处理
// ============================================

// Promise  rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
});

// 包装异步函数
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 使用方式
app.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await getUserById(req.params.id);
  if (!user) {
    throw new NotFoundError('用户不存在');
  }
  res.json(user);
}));

// ============================================
// 3. 自定义错误类
// ============================================

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    Error.captureStackTrace(this, this.constructor);
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

class UnauthorizedError extends AppError {
  constructor(message = '未授权') {
    super(message, 401);
  }
}

// 使用
app.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await getUser(req.params.id);
  if (!user) {
    throw new NotFoundError('用户不存在');
  }
  res.json(user);
}));

// ============================================
// 4. Express 错误处理中间件扩展
// ============================================

// 错误日志中间件
const errorLogger = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${err.stack}`);
  next(err);
};

// 统一错误响应中间件
const errorResponder = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || '服务器错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// 应用错误处理中间件
app.use(errorLogger);
app.use(errorResponder);
```

### 1.7 模板引擎

```javascript
const express = require('express');
const path = require('path');
const app = express();

// 设置模板引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// EJS 示例
// views/index.ejs
/*
<!DOCTYPE html>
<html>
<head>
  <title><%= title %></title>
</head>
<body>
  <h1><%= title %></h1>
  <ul>
    <% users.forEach(user => { %>
      <li><%= user.name %></li>
    <% }) %>
  </ul>
</body>
</html>
*/

// 渲染模板
app.get('/', (req, res) => {
  res.render('index', {
    title: '用户列表',
    users: [
      { name: '张三' },
      { name: '李四' }
    ]
  });
});

// 布局模板（express-partials）
app.use(require('express-partials')());
app.get('/', (req, res) => {
  res.partial('header');
  res.partial('content');
  res.partial('footer');
});
```

---

## 2. Koa 框架

### 2.1 Koa 核心概念

Koa 是 Express 原班人马打造的下一代 Node.js 框架，特点是轻量、优雅，核心只有约 550 行代码。

```
┌─────────────────────────────────────────────────────────────────┐
│                    Koa 洋葱模型                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                         请求                                     │
│                           ↓                                      │
│              ┌──────────────────────────┐                      │
│              │     中间件 1 (前置)       │                      │
│              │    ┌─────────────────┐   │                      │
│              │    │  中间件 2      │   │                      │
│              │    │ ┌───────────┐  │   │                      │
│              │    │ │  中间件 3  │  │   │                      │
│              │    │ │   业务逻辑 │  │   │                      │
│              │    │ └───────────┘  │   │                      │
│              │    └─────────────────┘   │                      │
│              └──────────────────────────┘                      │
│                           ↓                                      │
│                         响应                                     │
│                                                                  │
│   特点：                                                        │
│   - 请求经过所有「前置」中间件后，才会执行后续代码                   │
│   - 然后再以相反顺序执行「后置」中间件                              │
│   - 每个中间件都可以决定是否向下传递                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Koa vs Express

```javascript
const Koa = require('koa');
const express = require('express');

// Express 写法
const expressApp = express();

expressApp.use((req, res, next) => {
  console.log('1. Express 中间件');
  next(); // 手动调用下一个
  console.log('5. Express 后置处理');
});

expressApp.get('/', (req, res) => {
  console.log('3. 处理请求');
  res.send('Hello Express');
});

expressApp.listen(3000, () => console.log('Express on 3000'));

// ============================================
// Koa 写法
// ============================================

const koaApp = new Koa();

// Koa 使用 async/await 风格的中间件
koaApp.use(async (ctx, next) => {
  console.log('1. Koa 中间件 - 前置');

  await next(); // 等待下游中间件执行

  console.log('5. Koa 中间件 - 后置');
});

koaApp.use(async (ctx, next) => {
  console.log('2. 第二个中间件 - 前置');
  await next();
  console.log('4. 第二个中间件 - 后置');
});

koaApp.use(async (ctx) => {
  console.log('3. 处理请求');
  ctx.body = 'Hello Koa'; // 设置响应体
});

koaApp.listen(4000, () => console.log('Koa on 4000'));

// ============================================
// 主要区别
// ============================================

/*
| 特性         | Express           | Koa                    |
|--------------|-------------------|------------------------|
| 体积         | 较大 (~500KB)     | 极小 (~550行代码)      |
| 中间件模型   | 线性，next()      | 洋葱模型，await next()  |
| 错误处理     | 回调/中间件       | try-catch              |
| Context      | req/res 分离      | ctx 统一对象           |
| 异步支持     | 回调              | async/await 原生支持  |
| 路由         | 内置              | 需安装 koa-router      |
*/
```

### 2.3 Koa 核心 API

```javascript
const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');

const app = new Koa();
const router = new Router();

// ============================================
// Context 对象 (ctx)
// ============================================

// ctx.request - Koa 请求对象
// ctx.response - Koa 响应对象
// ctx.app - 应用实例
// ctx.state - 状态对象（用于中间件数据传递）
// ctx.cookies - Cookie 操作
// ctx.throw() - 抛出错误

app.use(async (ctx, next) => {
  // 请求信息
  console.log('请求方法:', ctx.method);
  console.log('请求路径:', ctx.path);
  console.log('查询参数:', ctx.query);
  console.log('请求体:', ctx.request.body);

  // 设置状态
  ctx.state.user = { id: 1, name: '张三' };

  // 设置响应
  ctx.status = 200;
  ctx.body = {
    message: '成功',
    data: { id: 1 }
  };

  // 抛出错误
  // ctx.throw(400, '验证失败');
});

// ============================================
// 路由
// ============================================

router.get('/', (ctx) => {
  ctx.body = '首页';
});

router.get('/users', (ctx) => {
  ctx.body = { users: [] };
});

router.get('/users/:id', (ctx) => {
  ctx.body = { id: ctx.params.id };
});

router.post('/users', (ctx) => {
  const data = ctx.request.body;
  ctx.body = { id: 1, ...data };
});

// 路由前缀
const apiRouter = new Router({ prefix: '/api/v1' });

app
  .use(router.routes())
  .use(router.allowedMethods());

// ============================================
// 请求体解析
// ============================================

app.use(bodyParser());

router.post('/users', (ctx) => {
  // 获取 JSON 请求体
  const body = ctx.request.body;

  // 获取表单数据
  // ctx.request.body.username

  ctx.body = { received: body };
});

// ============================================
// 静态文件
// ============================================

const serve = require('koa-static');
const path = require('path');

app.use(serve(path.join(__dirname, 'public')));

// 根路径渲染 index.html
const mount = require('koa-mount');
app.use(mount('/', serve(path.join(__dirname, 'public'))));
```

### 2.4 中间件组合与洋葱模型

```javascript
const Koa = require('koa');
const app = new Koa();

// ============================================
// 1. 中间件组合
// ============================================

const composed = require('koa-compose');

// 中间件数组
const middleware = [
  async (ctx, next) => {
    console.log('1. 开始');
    await next();
    console.log('1. 结束');
  },
  async (ctx, next) => {
    console.log('2. 开始');
    await next();
    console.log('2. 结束');
  },
  async (ctx) => {
    console.log('3. 业务处理');
    ctx.body = 'Hello';
  }
];

app.use(composed(middleware));

// ============================================
// 2. 条件执行中间件
// ============================================

// 错误处理中间件
const errorHandler = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = { error: err.message };
  }
};

// 日志中间件
const logger = async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
};

// 组合使用
app.use(errorHandler);
app.use(logger);

// ============================================
// 3. 中间件传递数据
// ============================================

// 通过 ctx.state 传递
app.use(async (ctx, next) => {
  ctx.state.user = { id: 1 };
  await next();
});

app.use(async (ctx, next) => {
  console.log('用户ID:', ctx.state.user.id);
  await next();
});

// 通过 ctx 传递
app.use(async (ctx, next) => {
  ctx.customData = { from: 'middleware1' };
  await next();
});

// ============================================
// 4. 条件中间件
// ============================================

const ifStatement = (condition, middleware) => {
  return async (ctx, next) => {
    if (condition(ctx)) {
      await middleware(ctx, next);
    } else {
      await next();
    }
  };
};

// 仅在开发环境使用日志
const devLogger = ifStatement(
  (ctx) => process.env.NODE_ENV === 'development',
  async (ctx, next) => {
    console.log('开发环境日志:', ctx.path);
    await next();
  }
);

app.use(devLogger);
```

### 2.5 异步错误处理

```javascript
const Koa = require('koa');
const app = new Koa();

// ============================================
// 1. try-catch 错误处理
// ============================================

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = {
      error: err.message
    };
  }
});

// 异步路由
app.use(async (ctx) => {
  // 自动捕获 Promise 错误
  const data = await fetchData();
  ctx.body = data;
});

// ============================================
// 2. 自定义错误类
// ============================================

class HttpError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

class NotFoundError extends HttpError {
  constructor(message = 'Not Found') {
    super(message, 404);
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

// ============================================
// 3. 全局错误监听
// ============================================

app.on('error', (err, ctx) => {
  console.error('服务器错误:', err);

  // 发送到错误追踪服务
  // sentry.captureException(err);
});

// 特定错误处理
app.on('error', (err, ctx) => {
  if (err.status === 404) {
    console.log('404 错误:', ctx.url);
  }
});
```

### 2.6 实战示例

```javascript
const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const jwt = require('koa-jwt');
const jsonwebtoken = require('jsonwebtoken');

const app = new Koa();
const router = new Router();

// 中间件
app.use(cors({
  origin: ctx => ctx.request.header.origin
}));

app.use(bodyParser());

// 错误处理
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = {
      success: false,
      message: err.message
    };
  }
});

// JWT 认证中间件
const SECRET = 'your-secret-key';

const authMiddleware = async (ctx, next) => {
  const token = ctx.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    ctx.throw(401, '未提供 token');
  }

  try {
    const decoded = jsonwebtoken.verify(token, SECRET);
    ctx.state.user = decoded;
    await next();
  } catch (err) {
    ctx.throw(401, '无效的 token');
  }
};

// 公开路由
router.get('/api/public', (ctx) => {
  ctx.body = { message: '公开接口' };
});

// 认证路由
router.get('/api/private', authMiddleware, (ctx) => {
  ctx.body = {
    message: '私有接口',
    user: ctx.state.user
  };
});

// 用户路由
const userRouter = new Router({ prefix: '/api/users' });

userRouter.get('/', (ctx) => {
  ctx.body = { users: [] };
});

userRouter.post('/', (ctx) => {
  const { username, password } = ctx.request.body;
  // 创建用户...
  ctx.body = { id: 1, username };
});

// 挂载路由
app
  .use(router.routes())
  .use(router.allowedMethods())
  .use(userRouter.routes())
  .use(userRouter.allowedMethods());

app.listen(3000, () => {
  console.log('Koa 服务器运行在 http://localhost:3000');
});
```

---

## 3. NestJS 框架

### 3.1 NestJS 核心概念

NestJS 是一个用于构建高效、可扩展的 Node.js 服务器端应用程序的框架。它使用 TypeScript 开发，结合了 OOP（面向对象编程）、FP（函数式编程）和 FRP（函数式响应式编程）的元素。

```
┌─────────────────────────────────────────────────────────────────┐
│                      NestJS 架构图                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                      控制器层 (Controllers)                  │ │
│  │   - 处理请求                                                │ │
│  │   - 路由管理                                                │ │
│  │   - 参数校验                                                │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              ↓                                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                      服务层 (Services)                       │ │
│  │   - 业务逻辑                                                │ │
│  │   - 数据处理                                                │ │
│  │   - 依赖注入                                                │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              ↓                                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                      数据访问层 (Repositories)               │ │
│  │   - 数据库操作                                              │ │
│  │   - ORM 查询                                               │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                      核心模块                               │ │
│  │   - 依赖注入容器                                            │ │
│  │   - 模块系统                                                │ │
│  │   - 中间件                                                  │ │
│  │   - 守卫                                                    │ │
│  │   - 拦截器                                                  │ │
│  │   - 管道                                                    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 模块系统

```typescript
// user.module.ts
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';

@Module({
  // 导入其他模块
  imports: [
    // 导入 TypeORM 模块
    TypeOrmModule.forFeature([User]),
  ],
  // 控制器
  controllers: [UserController],
  // 服务提供者
  providers: [UserService],
  // 导出模块（供其他模块使用）
  exports: [UserService],
})
export class UserModule {}

// ============================================
// 全局模块
// ============================================

@Global()
@Module({
  imports: [TypeOrmModule.forRoot({...})],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}

// ============================================
// 动态模块
// ============================================

@Module({})
export class ConfigModule {
  static register(options: ConfigOptions): DynamicModule {
    return {
      module: ConfigModule,
      providers: [
        {
          provide: 'CONFIG_OPTIONS',
          useValue: options,
        },
        ConfigService,
      ],
      exports: [ConfigService],
    };
  }
}

// 使用动态模块
ConfigModule.register({ folder: './config' })
```

### 3.3 依赖注入

```typescript
import { Injectable, Inject, Optional } from '@nestjs/common';

// ============================================
// 基础依赖注入
// ============================================

@Injectable()
export class UserService {
  // 构造函数注入（最常用）
  constructor(
    private readonly userRepository: UserRepository,
  ) {}

  async findAll() {
    return this.userRepository.find();
  }
}

// ============================================
// 属性注入（不推荐）
// ============================================

@Injectable()
class UserService {
  @Inject(UserRepository)
  private readonly userRepository: UserRepository;
}

// ============================================
// 可选依赖
// ============================================

@Injectable()
class ConfigService {
  constructor(
    @Optional() @Inject('CONFIG') private readonly config: string,
  ) {}
}

// ============================================
// 作用域注入
// ============================================

// 请求级别注入（每个请求创建新实例）
@Injectable({ scope: Scope.REQUEST })
export class UserService {
  constructor(@Inject(REQUEST) private readonly request: Request) {}
}

// 瞬态注入（每次注入创建新实例）
@Injectable({ scope: Scope.TRANSIENT })
export class UserService {}

// ============================================
// 自定义 Provider
// ============================================

// 值 Provider
{
  provide: 'APP_NAME',
  useValue: 'MyApp',
}

// 类 Provider（别名）
{
  provide: 'UserRepository',
  useClass: TypeOrmUserRepository,
}

// 工厂 Provider（可注入依赖）
{
  provide: 'DATABASE_CONFIG',
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    type: 'postgres',
    host: config.get('DB_HOST'),
    // ...
  }),
}

// 现有 Provider 别名
{
  provide: 'AliasedService',
  useExisting: RealService,
}
```

### 3.4 控制器

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  Header,
  Redirect,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { AuthGuard } from './auth.guard';
import { LoggingInterceptor, TransformInterceptor } from './interceptors';

// ============================================
// 基础控制器
// ============================================

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // 获取所有用户
  @Get()
  async findAll() {
    return this.userService.findAll();
  }

  // 获取单个用户
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  // 创建用户
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  // 更新用户
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto
  ) {
    return this.userService.update(id, updateUserDto);
  }

  // 删除用户
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}

// ============================================
// 请求参数装饰器
// ============================================

@Controller('params')
export class ParamController {
  // 路径参数
  @Get('users/:id')
  getById(@Param('id') id: string) {
    return { id };
  }

  // 查询参数
  @Get('search')
  search(
    @Query('q') query: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return { query, page, limit };
  }

  // 请求体
  @Post()
  create(@Body() body: CreateUserDto) {
    return body;
  }

  // 请求头
  @Get('headers')
  getHeaders(@Headers('authorization') auth: string) {
    return { auth };
  }

  // Cookie
  @Get('cookies')
  getCookies(@Req() req: Request) {
    return req.cookies;
  }

  // 响应对象（谨慎使用）
  @Get('raw')
  rawResponse(@Res() res: Response) {
    res.status(200).json({ message: '使用原生响应' });
  }
}

// ============================================
// 路由配置
// ============================================

@Controller({
  path: 'api',
  version: '1',
})
export class ApiController {
  @Get('users')
  @Header('Cache-Control', 'none')
  @Redirect('/api/v1/users', 301)
  redirect() {
    // 返回新 URL
    return { url: '/api/v1/users' };
  }
}
```

### 3.5 服务层

```typescript
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto, UpdateUserDto } from './dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // 查找所有
  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  // 条件查询
  async findByConditions(conditions: Partial<User>): Promise<User[]> {
    return this.userRepository.find({ where: conditions });
  }

  // 查找单个
  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`ID 为 ${id} 的用户不存在`);
    }
    return user;
  }

  // 创建
  async create(createUserDto: CreateUserDto): Promise<User> {
    // 检查邮箱是否已存在
    const existing = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existing) {
      throw new ConflictException('邮箱已被使用');
    }

    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  // 更新
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    // 合并更新
    Object.assign(user, updateUserDto);

    return this.userRepository.save(user);
  }

  // 删除
  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.userRepository.remove(user);
  }

  // 事务操作
  async createWithTransaction(data: CreateUserDto): Promise<User> {
    return this.userRepository.manager.transaction(async (manager) => {
      const user = manager.create(User, data);
      return manager.save(user);
    });
  }
}
```

### 3.6 守卫（Guards）

守卫在路由处理之前执行，用于验证请求是否有权限访问某个端点。

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// ============================================
// 自定义守卫
// ============================================

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 获取请求对象
    const request = context.switchToHttp().getRequest();

    // 验证 token
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('未提供认证 token');
    }

    try {
      // 验证并解码 token
      const decoded = this.verifyToken(token);
      // 将用户信息附加到请求
      request.user = decoded;
      return true;
    } catch (error) {
      throw new UnauthorizedException('无效的 token');
    }
  }

  private verifyToken(token: string) {
    // JWT 验证逻辑
    return { userId: '123', role: 'admin' };
  }
}

// ============================================
// 角色守卫
// ============================================

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 获取所需的角色
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());

    // 如果没有设置角色要求，放行
    if (!requiredRoles) {
      return true;
    }

    // 获取当前用户
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 检查角色
    return requiredRoles.includes(user.role);
  }
}

// ============================================
// 使用守卫
// ============================================

// 控制器级别
@Controller('users')
@UseGuards(AuthGuard, RolesGuard)
export class UserController {
  @Get(':id')
  findOne(@Param('id') id: string) {
    // ...
  }
}

// 方法级别
@Controller('users')
export class UserController {
  @Post()
  @UseGuards(AuthGuard)
  create(@Body() dto: CreateUserDto) {
    // ...
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @SetRoles('admin')
  remove(@Param('id') id: string) {
    // ...
  }
}

// 全局守卫
app.useGlobalGuards(new AuthGuard(reflector));
```

### 3.7 拦截器（Interceptors）

拦截器可以在方法执行前后的特定阶段添加逻辑。

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

// ============================================
// 日志拦截器
// ============================================

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    return next
      .handle()
      .pipe(
        tap(() => {
          const response = context.switchToHttp().getResponse();
          console.log(`${method} ${url} - ${Date.now() - now}ms - ${response.statusCode}`);
        }),
      );
  }
}

// ============================================
// 响应转换拦截器
// ============================================

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}

// ============================================
// 错误处理拦截器
// ============================================

@Injectable()
export class ErrorsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error: Error) => {
        throw {
          success: false,
          message: error.message,
          statusCode: 500,
        };
      }),
    );
  }
}

// ============================================
// 使用拦截器
// ============================================

// 控制器级别
@Controller('users')
@UseInterceptors(LoggingInterceptor, TransformInterceptor)
export class UserController {
  @Get()
  findAll() {
    return [{ id: 1 }];
  }
}

// 方法级别
@Controller('users')
export class UserController {
  @Get()
  @UseInterceptors(LoggingInterceptor)
  findAll() {
    return [{ id: 1 }];
  }
}

// 全局拦截器
app.useGlobalInterceptors(new LoggingInterceptor());
```

### 3.8 管道（Pipes）

管道用于数据转换和验证。

```typescript
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

// ============================================
// 内置管道
// ============================================

// ParseIntPipe - 转换字符串为数字
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {
  return { id };
}

// ParseUUIDPipe - 验证 UUID
@Get(':id')
findOne(@Param('id', ParseUUIDPipe) id: string) {
  return { id };
}

// ValidationPipe - 自动验证 DTO
app.useGlobalPipes(new ValidationPipe({
  whitelist: true, // 自动剥离非白名单属性
  forbidNonWhitelisted: true, // 拒绝非白名单属性
  transform: true, // 自动类型转换
  transformOptions: {
    enableImplicitConversion: true,
  },
}));

// ============================================
// 自定义管道
// ============================================

@Injectable()
export class ParseJsonPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (error) {
        throw new BadRequestException('无效的 JSON 字符串');
      }
    }
    return value;
  }
}

@Injectable()
export class MinLengthPipe implements PipeTransform {
  constructor(private readonly minLength: number) {}

  transform(value: string, metadata: ArgumentMetadata): string {
    if (value.length < this.minLength) {
      throw new BadRequestException(
        `字段 ${metadata.data} 长度必须大于 ${this.minLength}`
      );
    }
    return value;
  }
}

// ============================================
// 使用管道
// ============================================

@Controller('users')
export class UserController {
  @Post()
  create(
    @Body('name', new MinLengthPipe(2)) name: string,
    @Body('data', ParseJsonPipe) data: object,
  ) {
    return { name, data };
  }
}
```

### 3.9 FastDocument 项目实际代码示例

以下是来自 FastDocument 项目的 NestJS 实际代码：

```typescript
// auth.controller.ts - 认证控制器
import { Controller, Post, Body, Get, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, LoginWithCodeDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 用户注册
  @Post('register')
  @HttpCode(HttpStatus.OK)
  async register(@Body() dto: RegisterDto & { code?: string }) {
    try {
      // 验证邀请码
      if (!dto.code || !this.authService.validateInvitationCode(dto.code)) {
        return { success: false, message: '注册已禁用，请联系管理员获取邀请码' };
      }
      const result = await this.authService.register(dto.username, dto.password, dto.email);
      return { success: true, ...result };
    } catch (error) {
      return { success: false, message: error.message || '注册失败' };
    }
  }

  // 用户登录
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    try {
      const result = await this.authService.loginWithPassword(dto.username, dto.password);
      return { success: true, ...result };
    } catch (error) {
      return { success: false, message: error.message || '登录失败' };
    }
  }

  // 获取当前用户信息
  @Get('me')
  async getUserInfo(@Request() req: any) {
    const userId = req.user?.sub;
    if (!userId) {
      return { success: false, message: '未登录' };
    }
    const userInfo = await this.authService.getUserInfo(userId);
    return { success: true, user: userInfo };
  }
}

// auth.module.ts - 认证模块
import { Module, Global, OnModuleInit } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { InvitationService } from './invitation.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { User } from './user.entity';

@Global()
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fastdoc-secret-key-change-in-production',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, InvitationService, JwtAuthGuard],
  exports: [AuthService, InvitationService, JwtModule, TypeOrmModule, JwtAuthGuard],
})
export class AuthModule implements OnModuleInit {
  constructor(private authService: AuthService) {}

  async onModuleInit() {
    // 启动时创建种子用户
    await this.authService.createSeedUsers();
  }
}
```

---

## 4. 框架对比与选型

### 4.1 框架对比

| 特性 | Express | Koa | NestJS |
|------|---------|-----|--------|
| **设计理念** | 简约灵活 | 洋葱模型 | 企业级架构 |
| **学习曲线** | 低 | 中 | 高 |
| **体积** | ~500KB | ~16KB | ~100KB |
| **语言支持** | JavaScript | JavaScript | TypeScript |
| **装饰器** | 无 | 无 | 原生支持 |
| **依赖注入** | 无 | 无 | 原生支持 |
| **模块系统** | 无 | 无 | 完整模块化 |
| **类型安全** | 弱 | 弱 | 强 |
| **社区生态** | 最大 | 中等 | 快速增长 |
| **适合场景** | 快速原型、中小型项目 | 追求简洁、现代项目 | 企业级应用 |

### 4.2 选型建议

```
┌─────────────────────────────────────────────────────────────────┐
│                        框架选型决策树                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  项目规模？                                                       │
│  ├── 小型/微型项目                                               │
│  │   └── 技术团队经验丰富？                                       │
│  │       ├── 是 → Koa（轻量、灵活）                             │
│  │       └── 否 → Express（文档最全、生态最好）                  │
│  │                                                                │
│  ├── 中型项目                                                    │
│  │   └── 需要快速开发？                                           │
│  │       ├── 是 → Express + 成熟中间件                          │
│  │       └── 否 → NestJS（结构化、类型安全）                     │
│  │                                                                │
│  └── 大型/企业级项目                                             │
│      └── NestJS（依赖注入、模块化、测试友好）                     │
│                                                                  │
│  技术栈？                                                         │
│  ├── TypeScript → NestJS（首选）                                │
│  ├── 前后端分离 → Express/Koa                                   │
│  └── 全栈统一 → NestJS                                          │
│                                                                  │
│  团队经验？                                                       │
│  ├── Java/C# 背景 → NestJS（Spring 风格）                      │
│  ├── 前端背景 → Express/Koa（JS 风格）                         │
│  └── 新手 → Express（学习资源最丰富）                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 迁移路径

```
Express → NestJS
══════════════════

1. 将中间件转换为 NestJS 中间件
2. 将路由迁移到 Controller
3. 将业务逻辑移至 Service
4. 使用模块组织代码
5. 添加类型定义（TypeScript）
```

```typescript
// Express 路由
app.get('/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user);
});

// NestJS Controller
@Controller('users')
export class UserController {
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userService.findById(id);
  }
}
```

---

## 5. 实战案例

### 5.1 RESTful API 完整示例

```typescript
// main.ts - NestJS 应用入口
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // 全局前缀
  app.setGlobalPrefix('api/v1');

  // CORS 配置
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`应用运行在 http://localhost:${port}`);
}

bootstrap();

// ============================================
// DTO (Data Transfer Object)
// ============================================

// create-user.dto.ts
import { IsString, IsEmail, MinLength, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

// ============================================
// Entity
// ============================================

// user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: 'user' })
  role: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// ============================================
// Controller
// ============================================

// users.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}

// ============================================
// Service
// ============================================

// users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto, UpdateUserDto } from './dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`用户 ${id} 不存在`);
    }
    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    return this.userRepository.save(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.userRepository.remove(user);
  }
}
```

---

## 附录

### 附录 A: Express 常用中间件

| 中间件 | 用途 | 安装命令 |
|--------|------|----------|
| cors | 跨域资源共享 | `npm i cors` |
| helmet | 安全头 | `npm i helmet` |
| morgan | HTTP 日志 | `npm i morgan` |
| compression | 响应压缩 | `npm i compression` |
| multer | 文件上传 | `npm i multer` |
| cookie-parser | Cookie 解析 | `npm i cookie-parser` |
| express-session | 会话管理 | `npm i express-session` |
| passport | 认证框架 | `npm i passport` |
| Joi/zod | 数据验证 | `npm i joi` / `npm i zod` |
| express-rate-limit | 限流 | `npm i express-rate-limit` |

### 附录 B: Koa 常用中间件

| 中间件 | 用途 | 安装命令 |
|--------|------|----------|
| @koa/router | 路由 | `npm i @koa/router` |
| @koa/cors | 跨域 | `npm i @koa/cors` |
| @koa/bodyparser | 请求体解析 | `npm i @koa/bodyparser` |
| @koa/static | 静态文件 | `npm i @koa/static` |
| koa-compose | 中间件组合 | `npm i koa-compose` |
| koa-jwt | JWT 认证 | `npm i koa-jwt` |
| koa-mount | 挂载应用 | `npm i koa-mount` |
| koa-views | 模板引擎 | `npm i koa-views` |

### 附录 C: NestJS 常用模块

| 模块 | 用途 | 安装命令 |
|------|------|----------|
| @nestjs/typeorm | TypeORM ORM | `npm i @nestjs/typeorm typeorm` |
| @nestjs/mongoose | MongoDB | `npm i @nestjs/mongoose mongoose` |
| @nestjs/jwt | JWT 认证 | `npm i @nestjs/jwt passport-jwt` |
| @nestjs/passport | Passport 集成 | `npm i @nestjs/passport passport` |
| @nestjs/config | 配置管理 | `npm i @nestjs/config` |
| @nestjs/schedule | 定时任务 | `npm i @nestjs/schedule` |
| @nestjs/websockets | WebSocket | `npm i @nestjs/websockets @nestjs/platform-socket.io` |
| @nestjs/platform-express | Express 平台 | `npm i @nestjs/platform-express` |

---

## 六、后端框架常见面试题详解

### 6.1 Express与Koa框架对比面试题

**面试题1：Express和Koa的核心区别是什么？**

**参考答案：**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Express vs Koa 核心对比                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Express ( стартовая )                    Koa (современный)       │
│  ────────────────────                    ───────────────          │
│  基于 Connect 中间件                    基于 async 函数            │
│  回调函数处理异步                      原生 async/await         │
│  错误处理通过回调                      错误通过 try-catch        │
│  不支持ES6模块                         支持ES6模块               │
│  功能全面但较重                        轻量且可扩展             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**核心代码对比：**

```javascript
// Express - 使用回调函数
app.get('/user/:id', (req, res, next) => {
  User.findById(req.params.id, (err, user) => {
    if (err) return next(err);  // 错误通过回调传递
    res.json(user);
  });
});

// Koa - 使用 async/await
app.get('/user/:id', async (ctx) => {
  const user = await User.findById(ctx.params.id);  // 原生异步支持
  ctx.body = user;  // 简化的上下文API
});

// Koa 的错误处理
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = { error: err.message };
  }
});
```

---

**面试题2：Koa的洋葱模型是什么？**

**参考答案：**

```
┌─────────────────────────────────────────────────────────────────┐
│                      Koa 洋葱模型执行流程                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│     请求进入                                                     │
│        │                                                        │
│        ▼                                                        │
│   ┌─────────────┐                                               │
│   │  中间件 A    │                                              │
│   │  (before)   │                                              │
│   └──────┬──────┘                                               │
│          │                                                       │
│          ▼                                                       │
│   ┌─────────────┐                                               │
│   │  中间件 B    │                                              │
│   │  (before)   │                                              │
│   └──────┬──────┘                                               │
│          │                                                       │
│          ▼                                                       │
│   ┌─────────────┐                                               │
│   │  核心逻辑    │                                              │
│   └──────┬──────┘                                               │
│          │                                                       │
│   ┌──────┴──────┐                                               │
│   │  中间件 B    │  ← 后进先出，逆向执行                         │
│   │  (after)    │                                              │
│   └──────┬──────┘                                               │
│          │                                                       │
│   ┌──────┴──────┐                                               │
│   │  中间件 A    │                                              │
│   │  (after)    │                                              │
│   └──────┬──────┘                                               │
│          │                                                       │
│          ▼                                                       │
│     响应返回                                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**代码示例：**

```javascript
// Koa 洋葱模型示例
const app = new Koa();

// 第一个中间件
app.use(async (ctx, next) => {
  console.log('1️⃣ 请求前 - 记录开始时间');
  const start = Date.now();

  await next();  // 等待下游中间件执行

  console.log('4️⃣ 响应后 - 计算耗时:', Date.now() - start, 'ms');
  ctx.body += ' <- 来自中间件A';
});

// 第二个中间件
app.use(async (ctx, next) => {
  console.log('2️⃣ 请求前 - 验证用户');
  ctx.body = 'Hello';

  await next();  // 等待下游中间件执行

  console.log('3️⃣ 响应后 - 添加后缀');
  ctx.body += ' World';
});

// 响应输出: Hello World <- 来自中间件A
```

---

### 6.2 NestJS框架面试题

**面试题3：NestJS的依赖注入是如何工作的？**

**参考答案：**

```typescript
// NestJS 依赖注入的核心原理

// 1. 使用 @Injectable() 声明一个服务
@Injectable()
export class UsersService {
  private users: User[] = [];

  // 2. 在构造函数中声明依赖
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly logger: LoggerService
  ) {}

  // 3. NestJS 容器自动注入实例
  async findAll(): Promise<User[]> {
    this.logger.log('查询所有用户');
    return this.usersRepository.find();
  }
}

// 底层原理：Reflect Metadata
// TypeScript 编译时，通过 emitDecoratorMetadata 保留类型信息
// NestJS 通过这些元数据构建依赖图

// 编译后的代码（简化）
UsersService = __decorate([
  Injectable(),
  __metadata("design:paramtypes", [UsersRepository, LoggerService])
], UsersService);

// NestJS 容器启动时扫描这些元数据，构建依赖图并实例化
```

---

**面试题4：NestJS的请求生命周期是什么？**

**参考答案：**

```
┌─────────────────────────────────────────────────────────────────┐
│                    NestJS 请求生命周期                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Middleware（中间件）                                        │
│     ├─ 全局中间件：app.use()                                   │
│     └─ 路由中间件：MiddlewareConsumer                           │
│     ↓                                                           │
│  2. Guards（守卫）                                              │
│     ├─ 职责：权限验证、角色检查                                │
│     └─ 返回 boolean，决定是否继续                              │
│     ↓                                                           │
│  3. Interceptors（拦截器 - 请求前）                            │
│     ├─ 职责：日志、响应格式化、缓存                            │
│     └─ 在调用处理器之前执行                                    │
│     ↓                                                           │
│  4. Pipes（管道）                                               │
│     ├─ 职责：数据转换、参数验证                                │
│     └─ Transform: 转换数据类型                                 │
│     └─ Validation: 使用 class-validator 验证                  │
│     ↓                                                           │
│  5. Controller（控制器）                                       │
│     ├─ 接收请求，调用服务                                      │
│     └─ 返回响应                                                │
│     ↓                                                           │
│  6. Service（服务）                                            │
│     ├─ 执行业务逻辑                                            │
│     └─ 可能抛出异常                                            │
│     ↓                                                           │
│  7. Interceptors（拦截器 - 响应后）                            │
│     ├─ 职责：响应包装、统一格式                                │
│     └─ 在发送响应之前执行                                      │
│     ↓                                                           │
│  8. Exception Filters（异常过滤器）                            │
│     └─ 捕获异常，格式化错误响应                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**代码示例：**

```typescript
// Guards - 权限守卫
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization;
    return this.authService.validateToken(token);
  }
}

// Pipes - 参数验证管道
@Injectable()
export class ValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    return plainToClass(metadata.metatype, value);
  }
}

// Interceptors - 响应拦截器
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => ({
        success: true,
        data
      }))
    );
  }
}

// Exception Filters - 全局异常过滤器
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = getStatus(exception);

    response.status(status).json({
      success: false,
      message: exception.message
    });
  }
}
```

---

**面试题5：NestJS的模块是如何组织的？**

**参考答案：**

```typescript
// 典型的 NestJS 模块结构
// src/
// ├── app.module.ts              // 根模块
// ├── main.ts                    // 入口文件
// └── users/                     // Users 功能模块
//     ├── users.module.ts        // 模块定义
//     ├── users.controller.ts     // 控制器
//     ├── users.service.ts       // 服务
//     ├── entities/
//     │   └── user.entity.ts     // 实体
//     └── dto/
//         └── create-user.dto.ts  // 数据传输对象

// users.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([User])],  // 导入相关模块
  controllers: [UsersController],                // 控制器
  providers: [UsersService],                    // 提供者
  exports: [UsersService]                      // 导出供其他模块使用
})
export class UsersModule {}

// app.module.ts - 根模块
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(typeOrmConfig),
    UsersModule,
    AuthModule,
    DocumentsModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}

// 模块间依赖
// AuthModule 依赖 UsersModule
@Module({
  imports: [UsersModule],  // 导入 UsersModule
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
```

---

### 6.3 框架选型与架构面试题

**面试题6：什么场景下选择Express/Koa/NestJS？**

**参考答案：**

```
┌─────────────────────────────────────────────────────────────────┐
│                    框架选型决策矩阵                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Express                         适用场景                         │
│  ───────                         ───────                        │
│  • 快速原型开发                  • 小型项目                       │
│  • 简单的REST API                • 需要高度定制                  │
│  • 学习Node.js基础               • 已有大量Express中间件        │
│                                  • 团队熟悉回调式编程            │
│                                                                  │
│  Koa                            适用场景                         │
│  ────                            ───────                        │
│  • 现代ES6+项目                  • 中型项目                      │
│  • 需要优雅的错误处理            • 追求代码简洁                  │
│  • 需要灵活的中间件定制          • 团队熟悉async/await          │
│                                                                  │
│  NestJS                          适用场景                         │
│  ──────                          ───────                        │
│  • 企业级大型应用                • 复杂业务逻辑                  │
│  • 需要强类型检查                • 需要模块化架构                │
│  • 需要依赖注入                  • 团队有Angular背景            │
│  • 需要完善的测试体系            • 需要长期维护                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

**面试题7：NestJS如何实现数据库事务？**

**参考答案：**

```typescript
// NestJS + TypeORM 事务处理

// 方法1：手动管理事务
@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private itemRepository: Repository<OrderItem>,
    private dataSource: DataSource  // 注入数据源
  ) {}

  async createOrderWithItems(orderData: CreateOrderDto): Promise<Order> {
    // 创建查询_runner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 创建订单
      const order = queryRunner.manager.create(Order, orderData);
      const savedOrder = await queryRunner.manager.save(order);

      // 创建订单项
      for (const item of orderData.items) {
        const orderItem = queryRunner.manager.create(OrderItem, {
          ...item,
          orderId: savedOrder.id
        });
        await queryRunner.manager.save(orderItem);
      }

      // 提交事务
      await queryRunner.commitTransaction();
      return savedOrder;
    } catch (err) {
      // 回滚事务
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      // 释放连接
      await queryRunner.release();
    }
  }
}

// 方法2：使用装饰器（@Transactional）
// 需要安装 @_INTERCEPTORS/TransactionInterceptor
@Injectable()
export class TransactionalService {
  constructor(private transactionManager: EntityManager) {}

  @Transactional()
  async doSomething() {
    // 自动管理事务
    await this.transactionManager.save(User, { name: 'test' });
    await this.transactionManager.save(Order, { userId: 1 });
  }
}
```

---

**文档信息**

- 作者：后端教学团队
- 创建时间：2026年3月
- 版本：1.0.0
- 参考资料：Express 官方文档、Koa 官方文档、NestJS 官方文档、FastDocument 项目源码
