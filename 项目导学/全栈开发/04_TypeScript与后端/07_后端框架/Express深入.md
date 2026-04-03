# Express 深入详解

## 目录

1. [Express 概述](#1-express-概述)
2. [中间件系统](#2-中间件系统)
3. [路由机制](#3-路由机制)
4. [请求对象（req）](#4-请求对象req)
5. [响应对象（res）](#5-响应对象res)
6. [错误处理](#6-错误处理)
7. [模板引擎](#7-模板引擎)

---

## 1. Express 概述

### 1.1 Express 是什么？

Express 是一个简洁、灵活的 Node.js Web 应用框架，提供强大的特性用于创建单页、多页以及混合 Web 应用。它是 Node.js 最流行的 Web 框架之一。

**Express 核心特性：**

- 强大的路由系统
- 中间件支持
- 灵活的视图模板
- 高性能
- HTTP 辅助工具
- 内容协商

### 1.2 快速开始

```javascript
const express = require('express');
const app = express();

// 简单路由
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// 启动服务器
app.listen(3000, () => {
  console.log('服务器运行在 http://localhost:3000');
});
```

---

## 2. 中间件系统

### 2.1 什么是中间件？

中间件是一种函数，可以访问请求对象（req）、响应对象（res）和应用程序中处于请求-响应循环流程中的函数。

```javascript
// 中间件函数结构
function middleware(req, res, next) {
  // 处理逻辑
  next();  // 传递给下一个中间件
}

// 中间件示例：日志中间件
app.use((req, res, next) => {
  const start = Date.now();

  // 响应完成后记录日志
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} - ${duration}ms`);
  });

  next();  // 继续处理请求
});
```

### 2.2 中间件类型

#### 2.2.1 全局中间件

```javascript
// 所有请求都会经过这个中间件
app.use((req, res, next) => {
  console.log('全局中间件');
  next();
});
```

#### 2.2.2 路由级中间件

```javascript
// 只有匹配 /api 的路由才会经过这个中间件
const apiMiddleware = (req, res, next) => {
  console.log('API 中间件');
  next();
};

app.use('/api', apiMiddleware);
```

#### 2.2.3 特定路由中间件

```javascript
// 只有 /about 路由会经过这个中间件
const aboutMiddleware = (req, res, next) => {
  console.log('About 中间件');
  next();
};

app.get('/about', aboutMiddleware, (req, res) => {
  res.send('About 页面');
});
```

### 2.3 常用中间件

```javascript
const express = require('express');
const app = express();

// 1. body-parser - 解析请求体
const bodyParser = require('body-parser');

// 解析 JSON
app.use(bodyParser.json());
app.use(express.json());  // Express 内置

// 解析 URL 编码
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));

// 解析文本
app.use(express.text());

// 解析原始请求体
app.use(express.raw());

// 2. cors - 处理跨域
const cors = require('cors');
app.use(cors());  // 允许所有跨域
app.use(cors({
  origin: 'http://example.com',  // 允许特定域名
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// 3. express.static - 静态文件服务
app.use(express.static('public'));  // public 目录
app.use('/static', express.static('public'));  // 带前缀

// 4. morgan - HTTP 请求日志
const morgan = require('morgan');
app.use(morgan('dev'));  // 开发模式日志
app.use(morgan('combined'));  // Apache 格式日志

// 5. cookie-parser - 解析 Cookie
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// 6. helmet - 安全头
const helmet = require('helmet');
app.use(helmet());

// 7. multer - 文件上传
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('file'), (req, res) => {
  res.send('文件上传成功');
});
```

### 2.4 自定义中间件

```javascript
// 1. 请求计时中间件
app.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

// 2. 请求 ID 中间件
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// 3. 认证中间件
function authenticate(req, res, next) {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: '未授权' });
  }

  try {
    const decoded = jwt.verify(token, 'secret');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: '无效的令牌' });
  }
}

// 使用认证中间件
app.get('/profile', authenticate, (req, res) => {
  res.json(req.user);
});

// 4. 权限检查中间件
function authorize(roles = []) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
}

// 使用权限中间件
app.get('/admin', authenticate, authorize(['admin']), (req, res) => {
  res.send('管理员页面');
});
```

---

## 3. 路由机制

### 3.1 基本路由

```javascript
app.get('/users', (req, res) => {
  res.send('获取用户列表');
});

app.post('/users', (req, res) => {
  res.send('创建用户');
});

app.put('/users/:id', (req, res) => {
  res.send(`更新用户 ${req.params.id}`);
});

app.patch('/users/:id', (req, res) => {
  res.send(`部分更新用户 ${req.params.id}`);
});

app.delete('/users/:id', (req, res) => {
  res.send(`删除用户 ${req.params.id}`);
});

// 链式路由
app.route('/users')
  .get((req, res) => res.send('获取用户'))
  .post((req, res) => res.send('创建用户'))
  .put((req, res) => res.send('更新用户'));
```

### 3.2 路由参数

```javascript
// 路径参数
app.get('/users/:id', (req, res) => {
  res.send(`用户 ID: ${req.params.id}`);
});

// 多个路径参数
app.get('/users/:userId/posts/:postId', (req, res) => {
  res.send(`用户 ${req.params.userId} 的帖子 ${req.params.postId}`);
});

// 可选参数
app.get('/users/:id?', (req, res) => {
  if (req.params.id) {
    res.send(`用户 ID: ${req.params.id}`);
  } else {
    res.send('用户列表');
  }
});

// 正则表达式参数
app.get('/users/:id([0-9]+)', (req, res) => {
  res.send(`用户 ID: ${req.params.id}`);
});

// 通配符
app.get('/users/*', (req, res) => {
  res.send('匹配 /users/ 下的任何路径');
});
```

### 3.3 Router 路由模块化

```javascript
// users.js - 用户路由模块
const express = require('express');
const router = express.Router();

// 中间件
router.use((req, res, next) => {
  console.log('Users 路由中间件');
  next();
});

// 路由
router.get('/', (req, res) => {
  res.send('用户列表');
});

router.get('/:id', (req, res) => {
  res.send(`用户 ${req.params.id}`);
});

router.post('/', (req, res) => {
  res.send('创建用户');
});

module.exports = router;

// app.js - 主应用
const express = require('express');
const app = express();

const usersRouter = require('./users');
app.use('/users', usersRouter);
```

### 3.4 路由优先级

```javascript
// 精确匹配优先于参数路由
app.get('/users', (req, res) => {
  res.send('用户列表');  // 优先匹配
});

app.get('/users/:id', (req, res) => {
  res.send(`用户 ${req.params.id}`);
});

// 使用正则调整优先级
app.get('/users/:id', (req, res) => {
  res.send(`用户 ${req.params.id}`);
});
```

---

## 4. 请求对象（req）

### 4.1 请求属性

```javascript
app.get('/request-demo', (req, res) => {
  // 基础属性
  console.log(req.method);       // GET
  console.log(req.url);          // /request-demo?id=1
  console.log(req.path);         // /request-demo
  console.log(req.hostname);     // localhost
  console.log(req.protocol);     // http / https
  console.log(req.secure);       // false (http) / true (https)

  // IP 地址
  console.log(req.ip);           // 127.0.0.1
  console.log(req.ips);          // ['127.0.0.1']

  // 请求头
  console.log(req.headers);      // 所有请求头
  console.log(req.get('Content-Type'));  // application/json

  // 内容类型
  console.log(req.accepts('html'));  // true/false
  console.log(req.acceptsLanguages('en'));  // 'en' 或 undefined

  res.send('请求对象示例');
});
```

### 4.2 查询参数

```javascript
app.get('/search', (req, res) => {
  // 查询字符串
  console.log(req.query);           // { q: 'keyword', page: '1' }
  console.log(req.query.q);         // 'keyword'
  console.log(req.query.page);      // '1'

  // 解构
  const { q, page = 1, limit = 10 } = req.query;

  res.json({ q, page, limit });
});
```

### 4.3 请求体

```javascript
// 需要中间件解析: app.use(express.json())

app.post('/users', (req, res) => {
  // JSON 请求体
  console.log(req.body);  // { name: '张三', email: 'xxx' }
  console.log(req.body.name);  // '张三'

  // 文件上传 (需要 multer)
  // req.file 或 req.files
});
```

### 4.4 路由参数

```javascript
app.get('/users/:id/comments/:commentId', (req, res) => {
  console.log(req.params);   // { id: '1', commentId: '2' }
  console.log(req.params.id);   // '1'
  console.log(req.params.commentId);  // '2'
});
```

---

## 5. 响应对象（res）

### 5.1 发送响应

```javascript
app.get('/', (req, res) => {
  // 1. send - 发送任何类型响应
  res.send('<h1>Hello</h1>');
  res.send({ message: '成功' });
  res.send([1, 2, 3]);

  // 2. json - 发送 JSON 响应
  res.json({ message: '成功', code: 200 });

  // 3. jsonp - 发送 JSONP 响应
  res.jsonp({ message: 'Hello' });

  // 4. sendFile - 发送文件
  res.sendFile(__dirname + '/public/index.html');

  // 5. download - 下载文件
  res.download(__dirname + '/files/document.pdf');
  res.download(__dirname + '/files/image.png', 'custom-name.png');

  // 6. redirect - 重定向
  res.redirect('/new-page');
  res.redirect(301, '/new-page');  // 状态码重定向
  res.redirect('http://example.com');

  // 7. end - 结束响应
  res.status(404).end();

  // 8. render - 渲染模板
  res.render('index', { title: '首页' });
});
```

### 5.2 设置响应头

```javascript
app.get('/', (req, res) => {
  // 设置单个响应头
  res.setHeader('Content-Type', 'application/json');

  // 批量设置响应头
  res.set({
    'Content-Type': 'application/json',
    'X-Custom-Header': 'value',
    'Cache-Control': 'no-cache'
  });

  // 设置 Cookie
  res.cookie('username', 'zhangsan', {
    maxAge: 900000,    // 过期时间（毫秒）
    httpOnly: true,   // 禁止 JavaScript 访问
    secure: true,     // 仅 HTTPS
    sameSite: 'strict'  // CSRF 保护
  });

  // 清除 Cookie
  res.clearCookie('username');

  res.send('响应示例');
});
```

### 5.3 设置状态码

```javascript
app.get('/', (req, res) => {
  // 常用状态码
  res.status(200).send('成功');
  res.status(201).json({ message: '创建成功' });
  res.status(204).end();  // 无内容

  res.status(400).json({ error: '请求错误' });
  res.status(401).json({ error: '未授权' });
  res.status(403).json({ error: '禁止访问' });
  res.status(404).json({ error: '资源不存在' });

  res.status(500).json({ error: '服务器错误' });
  res.status(503).json({ error: '服务不可用' });
});
```

### 5.4 响应链式调用

```javascript
app.get('/', (req, res) => {
  res
    .status(200)
    .setHeader('Content-Type', 'application/json')
    .json({ message: '成功' });
});
```

---

## 6. 错误处理

### 6.1 同步错误处理

```javascript
app.get('/error', (req, res) => {
  // 同步代码抛出的错误会被 Express 自动捕获
  throw new Error('发生错误');
});
```

### 6.2 异步错误处理

```javascript
// Promise 方式
app.get('/async-error', async (req, res, next) => {
  try {
    const result = await someAsyncOperation();
    res.json(result);
  } catch (err) {
    next(err);  // 传递给错误处理中间件
  }
});

// 回调方式
app.get('/callback-error', (req, res, next) => {
  someAsyncOperation((err, result) => {
    if (err) {
      return next(err);
    }
    res.json(result);
  });
});
```

### 6.3 错误处理中间件

```javascript
// 错误处理中间件必须有 4 个参数
app.use((err, req, res, next) => {
  console.error('错误:', err);

  // 开发环境显示详细错误
  if (process.env.NODE_ENV === 'development') {
    res.status(err.status || 500).json({
      error: err.message,
      stack: err.stack
    });
  } else {
    // 生产环境隐藏错误详情
    res.status(err.status || 500).json({
      error: '服务器内部错误'
    });
  }
});

// 多个错误处理中间件
app.use((err, req, res, next) => {
  // 处理特定错误
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: '数据验证失败',
      details: err.message
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: '未授权'
    });
  }

  // 传递给下一个错误处理中间件
  next(err);
});
```

### 6.4 404 处理

```javascript
// 放在所有路由之后
app.use((req, res, next) => {
  res.status(404).json({
    error: '页面不存在'
  });
});
```

### 6.5 自定义错误类

```javascript
// 1. HTTP 错误基类
class HttpError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
  }
}

// 2. 具体错误类
class NotFoundError extends HttpError {
  constructor(message = '资源不存在') {
    super(message, 404);
  }
}

class ValidationError extends HttpError {
  constructor(message = '数据验证失败') {
    super(message, 400);
  }
}

class UnauthorizedError extends HttpError {
  constructor(message = '未授权') {
    super(message, 401);
  }
}

class ForbiddenError extends HttpError {
  constructor(message = '禁止访问') {
    super(message, 403);
  }
}

// 使用
app.get('/user/:id', async (req, res, next) => {
  const user = await getUserById(req.params.id);

  if (!user) {
    throw new NotFoundError(`用户 ${req.params.id} 不存在`);
  }

  res.json(user);
});
```

---

## 7. 模板引擎

### 7.1 EJS 模板引擎

```javascript
// 安装: npm install ejs
const express = require('express');
const app = express();

// 设置模板引擎
app.set('view engine', 'ejs');
app.set('views', './views');

// 渲染模板
app.get('/', (req, res) => {
  res.render('index', {
    title: '首页',
    message: '欢迎来到我的网站',
    users: [
      { name: '张三', age: 25 },
      { name: '李四', age: 30 }
    ]
  });
});

// views/index.ejs
/*
<!DOCTYPE html>
<html>
<head>
  <title><%= title %></title>
</head>
<body>
  <h1><%= message %></h1>
  <ul>
    <% users.forEach(user => { %>
      <li><%= user.name %> - <%= user.age %>岁</li>
    <% }) %>
  </ul>
</body>
</html>
*/
```

### 7.2 Pug 模板引擎

```javascript
// 安装: npm install pug
const express = require('express');
const app = express();

app.set('view engine', 'pug');
app.set('views', './views');

app.get('/', (req, res) => {
  res.render('index', {
    title: '首页',
    message: '欢迎'
  });
});

// views/index.pug
/*
doctype html
html
  head
    title= title
  body
    h1= message
*/
```

### 7.3 局部模板

```javascript
// 创建局部模板 partials/header.ejs
/*
<header>
  <nav>
    <a href="/">首页</a>
    <a href="/about">关于</a>
    <a href="/contact">联系</a>
  </nav>
</header>
*/

// 在模板中引入
// <%- include('partials/header') %>
```

---

## 常见面试问题

### 问题 1：Express 中间件的执行顺序？

**答案：** 中间件按照定义顺序执行，每个中间件通过调用 next() 将控制权传递给下一个中间件。

### 问题 2：如何处理 Express 中的异步错误？

**答案：** 在 async 路由处理器中使用 try-catch 捕获错误，并通过 next(err) 传递给错误处理中间件。

### 问题 3：Express 和 Koa 的区别？

**答案：** Express 是 Node.js 最流行的 Web 框架，使用回调处理异步；Koa 是 Express 原班人马打造，使用 async/await，更加轻量。

---

## 最佳实践

1. **路由模块化**：使用 Router 将路由拆分成独立模块
2. **错误处理**：创建全局错误处理中间件
3. **中间件顺序**：日志 -> 静态文件 -> 路由 -> 错误处理
4. **环境变量**：使用 .env 管理配置
5. **请求验证**：使用 joi 或 express-validator 验证输入

---

## 8. 安全最佳实践

### 8.1 安全中间件配置

```javascript
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const app = express();

// 1. 设置安全 HTTP 头
app.use(helmet());

// 2. CORS 配置
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
}));

// 3. 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 每个 IP 最多 100 次请求
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '请求过于频繁，请稍后再试',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// 4. 登录接口严格限流
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 小时
  max: 5, // 每个 IP 最多 5 次
  message: {
    error: {
      code: 'TOO_MANY_ATTEMPTS',
      message: '尝试次数过多，请1小时后再试',
    },
  },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// 5. 数据清洗
app.use(mongoSanitize()); // 防止 NoSQL 注入
app.use(xss());           // 防止 XSS 攻击
app.use(hpp());           // 防止参数污染

// 6. 请求体大小限制
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
```

### 8.2 输入验证

```javascript
const { body, param, query, validationResult } = require('express-validator');

// 验证结果处理中间件
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: '请求参数验证失败',
        details: errors.array().map(err => ({
          field: err.path,
          message: err.msg,
        })),
      },
    });
  }
  
  next();
};

// 用户注册验证
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('姓名不能为空')
    .isLength({ min: 2, max: 50 }).withMessage('姓名长度为2-50个字符'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('邮箱不能为空')
    .isEmail().withMessage('邮箱格式不正确')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('密码不能为空')
    .isLength({ min: 8 }).withMessage('密码至少8个字符')
    .matches(/[A-Z]/).withMessage('密码需包含大写字母')
    .matches(/[a-z]/).withMessage('密码需包含小写字母')
    .matches(/[0-9]/).withMessage('密码需包含数字'),
  
  validate,
];

// 路由使用
app.post('/api/auth/register', registerValidation, authController.register);
```

### 8.3 JWT 认证中间件

```javascript
const jwt = require('jsonwebtoken');

// 认证中间件
const authenticate = (req, res, next) => {
  try {
    // 获取 token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: '未提供认证令牌',
        },
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // 验证 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 将用户信息附加到请求对象
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: {
          code: 'TOKEN_EXPIRED',
          message: '认证令牌已过期',
        },
      });
    }
    
    return res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: '无效的认证令牌',
      },
    });
  }
};

// 角色授权中间件
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: '未认证',
        },
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: '无权限执行此操作',
        },
      });
    }
    
    next();
  };
};

// 使用示例
app.get('/api/admin/users', authenticate, authorize('admin'), userController.getAll);
app.get('/api/profile', authenticate, userController.getProfile);
```

---

## 9. 文件上传处理

### 9.1 Multer 配置

```javascript
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 存储配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 根据文件类型分目录
    const type = file.mimetype.split('/')[0];
    const dir = `${uploadDir}${type}/`;
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// 文件过滤
const fileFilter = (req, file, cb) => {
  // 允许的文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'), false);
  }
};

// 创建 multer 实例
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5, // 最多5个文件
  },
});

// 单文件上传
app.post('/api/upload/single', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '未上传文件' });
  }
  
  res.json({
    message: '文件上传成功',
    file: {
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
    },
  });
});

// 多文件上传
app.post('/api/upload/multiple', upload.array('files', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: '未上传文件' });
  }
  
  res.json({
    message: '文件上传成功',
    count: req.files.length,
    files: req.files.map(file => ({
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
    })),
  });
});

// 字段名不同的多文件上传
app.post('/api/upload/fields', upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'documents', maxCount: 5 },
]), (req, res) => {
  res.json({
    message: '文件上传成功',
    avatar: req.files.avatar?.[0],
    documents: req.files.documents,
  });
});

// 错误处理
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: '文件大小超过限制' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: '文件数量超过限制' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: '意外的文件字段' });
    }
  }
  
  if (error.message === '不支持的文件类型') {
    return res.status(400).json({ error: error.message });
  }
  
  next(error);
});
```

---

## 10. WebSocket 集成

### 10.1 Socket.io 集成

```javascript
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// 认证中间件
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.userRole = decoded.role;
    next();
  } catch (error) {
    next(new Error('认证失败'));
  }
});

// 连接处理
io.on('connection', (socket) => {
  console.log(`用户 ${socket.userId} 已连接`);
  
  // 加入用户专属房间
  socket.join(`user:${socket.userId}`);
  
  // 加入角色房间
  socket.join(`role:${socket.userRole}`);
  
  // 发送欢迎消息
  socket.emit('message', {
    type: 'welcome',
    message: '欢迎连接到服务器',
  });
  
  // 监听消息
  socket.on('chat:message', async (data) => {
    // 验证数据
    if (!data.to || !data.content) {
      return socket.emit('error', { message: '参数错误' });
    }
    
    // 保存消息到数据库
    const message = await Message.create({
      from: socket.userId,
      to: data.to,
      content: data.content,
    });
    
    // 发送给目标用户
    io.to(`user:${data.to}`).emit('chat:message', {
      id: message.id,
      from: socket.userId,
      content: data.content,
      createdAt: message.createdAt,
    });
    
    // 确认发送成功
    socket.emit('chat:sent', { messageId: message.id });
  });
  
  // 监听打字状态
  socket.on('typing:start', (data) => {
    socket.to(`user:${data.to}`).emit('typing:start', {
      from: socket.userId,
    });
  });
  
  socket.on('typing:stop', (data) => {
    socket.to(`user:${data.to}`).emit('typing:stop', {
      from: socket.userId,
    });
  });
  
  // 断开连接
  socket.on('disconnect', () => {
    console.log(`用户 ${socket.userId} 已断开连接`);
    socket.leave(`user:${socket.userId}`);
    socket.leave(`role:${socket.userRole}`);
  });
});

// 广播给所有用户
function broadcastToAll(event, data) {
  io.emit(event, data);
}

// 广播给特定用户
function sendToUser(userId, event, data) {
  io.to(`user:${userId}`).emit(event, data);
}

// 广播给角色
function broadcastToRole(role, event, data) {
  io.to(`role:${role}`).emit(event, data);
}

// 启动服务器
httpServer.listen(3000, () => {
  console.log('服务器运行在 http://localhost:3000');
});
```

---

## 11. 测试

### 11.1 单元测试

```javascript
const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

describe('Auth API', () => {
  beforeEach(async () => {
    // 清理测试数据
    await User.deleteMany({});
  });
  
  describe('POST /api/auth/register', () => {
    it('应该成功注册新用户', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: '测试用户',
          email: 'test@example.com',
          password: 'Password123',
        })
        .expect(201);
      
      expect(response.body.message).toBe('注册成功');
      expect(response.body.data.user.email).toBe('test@example.com');
    });
    
    it('应该拒绝重复邮箱', async () => {
      // 先注册一个用户
      await User.create({
        name: '已存在用户',
        email: 'existing@example.com',
        password: 'hashedPassword',
      });
      
      // 尝试使用相同邮箱注册
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: '新用户',
          email: 'existing@example.com',
          password: 'Password123',
        })
        .expect(409);
      
      expect(response.body.error.code).toBe('EMAIL_EXISTS');
    });
    
    it('应该验证输入参数', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'A', // 太短
          email: 'invalid-email', // 无效邮箱
          password: '123', // 太短
        })
        .expect(400);
      
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toHaveLength(3);
    });
  });
  
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // 创建测试用户
      await User.create({
        name: '测试用户',
        email: 'test@example.com',
        password: await bcrypt.hash('Password123', 10),
      });
    });
    
    it('应该成功登录', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123',
        })
        .expect(200);
      
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });
    
    it('应该拒绝错误密码', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword',
        })
        .expect(401);
    });
  });
});

describe('User API', () => {
  let token;
  let userId;
  
  beforeEach(async () => {
    // 创建测试用户并获取 token
    const user = await User.create({
      name: '测试用户',
      email: 'test@example.com',
      password: await bcrypt.hash('Password123', 10),
      role: 'user',
    });
    
    userId = user._id;
    token = jwt.sign({ userId, role: 'user' }, process.env.JWT_SECRET);
  });
  
  describe('GET /api/users', () => {
    it('应该返回用户列表', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });
  
  describe('GET /api/users/:id', () => {
    it('应该返回指定用户', async () => {
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.data.email).toBe('test@example.com');
    });
    
    it('应该返回404对于不存在的用户', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await request(app)
        .get(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });
});
```

---

## 12. 生产环境部署

### 12.1 PM2 配置

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'api-server',
      script: './dist/index.js',
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
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      // 优雅关闭
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 3000,
    },
  ],
};
```

### 12.2 健康检查

```javascript
// 健康检查端点
app.get('/health', (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
  };
  
  res.json(health);
});

// 就绪检查
app.get('/ready', async (req, res) => {
  try {
    // 检查数据库连接
    await mongoose.connection.db.admin().ping();
    
    // 检查 Redis 连接
    await redis.ping();
    
    res.json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('收到 SIGTERM 信号，开始优雅关闭...');
  
  // 停止接受新请求
  server.close(() => {
    console.log('HTTP 服务器已关闭');
  });
  
  // 关闭数据库连接
  await mongoose.connection.close();
  console.log('数据库连接已关闭');
  
  // 关闭 Redis 连接
  await redis.quit();
  console.log('Redis 连接已关闭');
  
  // 通知 PM2
  process.send('ready');
  
  process.exit(0);
});
```

---

## 13. 面试高频问题

### 问题1：Express 中间件的执行顺序？

**答案：** 中间件按照定义顺序执行，每个中间件通过调用 next() 将控制权传递给下一个中间件。如果不调用 next()，请求会被挂起。

### 问题2：如何处理 Express 中的异步错误？

**答案：** 
1. 在 async 路由处理器中使用 try-catch 捕获错误
2. 通过 next(err) 传递给错误处理中间件
3. 使用 express-async-errors 包自动捕获

### 问题3：Express 和 Koa 的区别？

**答案：**
| 特性 | Express | Koa |
|------|---------|-----|
| 异步处理 | 回调 | async/await |
| 中间件模型 | 线性 | 洋葱模型 |
| 体积 | 较大 | 轻量 |
| 内置功能 | 较多 | 极简 |

### 问题4：如何防止 SQL 注入？

**答案：**
1. 使用参数化查询
2. 使用 ORM（如 Sequelize、Prisma）
3. 输入验证和清洗
4. 最小权限原则

### 问题5：如何实现 API 版本控制？

**答案：**
1. URL 路径版本：`/api/v1/users`
2. 请求头版本：`Accept: application/vnd.api+json;version=1`
3. 查询参数：`/api/users?version=1`

---

## 14. 最佳实践总结

### 14.1 项目结构

```
project/
├── src/
│   ├── controllers/    # 控制器
│   ├── middleware/     # 中间件
│   ├── models/         # 数据模型
│   ├── routes/         # 路由
│   ├── services/       # 业务逻辑
│   ├── utils/          # 工具函数
│   ├── validators/     # 验证器
│   └── app.js          # 应用入口
├── tests/              # 测试文件
├── logs/               # 日志文件
├── uploads/            # 上传文件
├── .env                # 环境变量
├── .env.example        # 环境变量示例
└── package.json
```

### 14.2 安全清单

- [ ] 使用 helmet 设置安全头
- [ ] 配置 CORS
- [ ] 实现速率限制
- [ ] 输入验证和清洗
- [ ] 使用 HTTPS
- [ ] 密码加密存储
- [ ] JWT 安全配置
- [ ] 防止 SQL/NoSQL 注入
- [ ] 防止 XSS 攻击
- [ ] 错误信息不暴露敏感信息

### 14.3 性能优化清单

- [ ] 启用响应压缩
- [ ] 使用连接池
- [ ] 实现缓存策略
- [ ] 静态资源 CDN
- [ ] 数据库索引优化
- [ ] 使用集群模式
- [ ] 日志异步写入

---

*本文档最后更新于 2026年3月*
