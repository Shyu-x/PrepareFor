# API接口开发完全指南

## 目录

1. [什么是API？用生活例子详解](#什么是api)
2. [为什么要使用API？](#为什么要使用api)
3. [RESTful是什么？](#restful是什么)
4. [Node.js创建HTTP服务](#nodejs创建http服务)
5. [Express框架快速入门](#express框架快速入门)
6. [Koa框架快速入门](#koa框架快速入门)
7. [请求处理：GET/POST/PUT/DELETE](#请求处理getpostputdelete)
8. [参数获取详解](#参数获取详解)
9. [响应格式设计](#响应格式设计)
10. [错误处理机制](#错误处理机制)
11. [中间件机制详解](#中间件机制详解)
12. [实战项目：图书管理系统API](#实战项目图书管理系统api)
13. [用curl测试API](#用curl测试api)
14. [用Postman测试API](#用postman测试api)
15. [最佳实践与总结](#最佳实践与总结)

---

## 什么是API？

### 生活例子理解API

想象一下你去餐厅吃饭的场景：

```
顾客（客户端） → 服务员（API接口） → 厨房（服务器/数据库）
```

你不需要亲自去厨房做菜，只需要告诉服务员你想要什么，服务员会把你的需求传达给厨房，然后把做好的菜端回来给你。

**API（Application Programming Interface，应用编程接口）** 就是这样一个"服务员"——它定义了一套规则，让不同的软件系统可以相互通信。你不需要了解厨房是怎么工作的，只需要按照规定的方式点餐（发送请求），就能得到你需要的结果（响应数据）。

### 更具体的生活例子

**例子1：手机充电**

当你用充电线把手机连接到充电器时，你不需要关心：
- 充电器内部是如何将交流电转换为直流电的
- 手机电池的化学原理是什么
- 充电协议是如何协商的

你只需要：
1. 插入充电线
2. 手机开始充电

这个充电线的接口就是"API"，它隐藏了复杂的内部实现，只暴露了你需要的充电功能。

**例子2：银行ATM机**

ATM机就是银行系统的API：
- **暴露的接口**：插卡、输入密码、选择操作（取款、存款、查询）、取卡
- **隐藏的细节**：账户数据库、安全验证系统、资金流转系统

你不需要知道银行内部是如何运作的，只需要按照ATM机的操作流程，就能完成各种金融操作。

### Web API的具体解释

在Web开发中，API通常指的是：

```
浏览器（客户端） ←→ HTTP协议 ←→ 服务器（API接口） ←→ 数据库
```

当你打开一个天气App查看天气时：

1. App向天气预报服务器的API发送请求
2. API接收请求，理解你需要什么（哪个城市的天气）
3. API从数据库获取天气数据
4. API把数据按照固定格式返回给App
5. App解析数据并展示给你

**整个过程中，App不需要知道天气数据是如何采集的、存储在哪里，只需要通过API获取即可。**

---

## 为什么要使用API？

### 1. 解耦合：各司其职，互不干扰

**没有API的问题（紧耦合）：**

```
前端代码直接操作数据库
┌─────────────────────────────────────┐
│ 前端代码                             │
│ ├── 必须了解数据库表结构              │
│ ├── 必须知道如何编写SQL查询           │
│ ├── 数据库类型变更时前端代码也要改     │
│ └── 前端和后端必须同时开发            │
└─────────────────────────────────────┘
```

**使用API后（松耦合）：**

```
前端代码                API接口              数据库
    │                     │                   │
    │  "给我第5本书"       │                   │
    │ ──────────────────> │                   │
    │                     │  SELECT * FROM    │
    │                     │  books WHERE id=5 │
    │                     │ ─────────────────> │
    │                     │                   │
    │                     │  {id:5,title:...} │
    │                     │ <─────────────────│
    │  {id:5,title:...}   │                   │
    │ <────────────────── │                   │
```

前端只需要知道"如何请求"，不需要知道"数据存在哪里"。

### 2. 复用：一套API，多个客户端

```
                    ┌──────────┐
                    │  API接口  │
                    └────┬─────┘
           ┌─────────────┼─────────────┐
           ▼             ▼             ▼
     ┌──────────┐ ┌──────────┐ ┌──────────┐
     │  Web网站  │ │ 手机App   │ │  小程序   │
     └──────────┘ └──────────┘ └──────────┘
```

同样的图书数据，网站/App/小程序都可以使用同一套API，无需为每个客户端单独开发数据接口。

### 3. 安全性：保护核心数据

```
客户端请求：GET /api/books/5
                ↓
         API接口检查：
         ├── 用户是否登录？
         ├── 用户是否有权限查看这本书？
         ├── 请求参数是否合法？
         └── 是否遭到攻击？
                ↓
         通过检查 → 返回数据
         未通过 → 返回错误信息
```

用户永远无法直接访问数据库，只能通过API操作数据，API就像一个守门员，保护着数据安全。

### 4. 跨平台：不同技术栈可以协作

```
前端：React/Vue       后端：Node.js/Python/Java   数据库：MySQL/PostgreSQL
   │                      │                           │
   └──────────────────────┴───────────────────────────┘
                              │
                         通过API通信
```

无论前端用什么框架、后端用什么语言，只要遵循HTTP协议和API规范，就能正常通信。

---

## RESTful是什么？

### REST的基本概念

**REST（Representational State Transfer，表述性状态转移）** 是一种软件架构风格，由Roy Fielding在他2000年的博士论文中提出。

用通俗的话说：**REST就是定义了一套"Web标准"，让不同的系统能够用统一的方式进行交互。**

### REST的核心原则

#### 1. 万物皆资源（Resources）

在REST中，所有的东西都是"资源"：

```
资源          →  具体例子
─────────────────────────────
书籍          →  /books
用户          →  /users
订单          →  /orders
评论          →  /comments
```

每本书、每个用户、每个订单都是资源。

#### 2. 每个资源有唯一的标识（URI）

```
资源的标识（URI）              代表的资源
──────────────────────────────────────────
GET /books                    所有书籍
GET /books/1                  ID为1的书籍
GET /books/1/chapters          ID为1的书籍的所有章节
GET /users/5                  ID为5的用户
GET /users/5/orders           ID为5的用户的所有订单
```

URI（统一资源标识符）就像资源的"身份证号"，每个资源都有唯一的标识。

#### 3. 使用HTTP动词描述操作

RESTful API使用HTTP方法（动词）来描述对资源的操作：

| HTTP方法 | 操作 | 示例 |
|---------|------|------|
| GET | 获取资源 | GET /books — 获取所有书籍 |
| POST | 创建资源 | POST /books — 创建一本新书 |
| PUT | 更新资源（完整更新）| PUT /books/1 — 更新ID为1的书籍（完整更新）|
| PATCH | 部分更新资源 | PATCH /books/1 — 部分更新ID为1的书籍 |
| DELETE | 删除资源 | DELETE /books/1 — 删除ID为1的书籍 |

**用点餐来类比：**

```
点餐系统（RESTful API）

服务员（API）接受以下指令：

GET /menu          — "我想看看菜单"（获取菜单）
POST /orders       — "我要点这个菜"（创建订单）
PUT /orders/5      — "我要换一道菜"（完整更新订单）
DELETE /orders/5   — "我不要这个订单了"（删除订单）
```

#### 4. 无状态（Stateless）

每次请求都是独立的，服务器不保存客户端的"状态"：

```
❌ 错误理解：服务器记住你上次点了什么
GET /books
GET /books  ← 服务器还记得你上次查的是books

✅ 正确理解：每次请求都是独立的
GET /books/1     — "我要ID为1的书"
GET /books/2     — "我要ID为2的书"
                  （两次请求完全独立，没有任何关联）
```

每个请求都必须包含服务器需要的所有信息，服务器不会记住之前的请求。

#### 5. 使用标准HTTP状态码

RESTful API使用HTTP状态码来表示请求的结果：

| 状态码 | 含义 | 例子 |
|-------|------|------|
| 200 | 成功 | GET /books 返回书籍列表 |
| 201 | 已创建 | POST /books 成功创建了新书 |
| 400 | 请求错误 | 发送了不合法的参数 |
| 401 | 未授权 | 没有登录就想操作数据 |
| 404 | 未找到 | 请求的资源不存在 |
| 500 | 服务器错误 | 服务器内部出错了 |

### RESTful API URL设计示例

**一个图书管理系统的RESTful API：**

```
📚 书籍相关接口
───────────────────────────────────────────────────────────────
GET    /api/books           — 获取所有书籍
GET    /api/books/:id       — 获取某本书的详情
POST   /api/books           — 创建新书
PUT    /api/books/:id       — 更新某本书（完整更新）
PATCH  /api/books/:id       — 更新某本书（部分更新）
DELETE /api/books/:id       — 删除某本书

👤 作者相关接口
───────────────────────────────────────────────────────────────
GET    /api/authors          — 获取所有作者
GET    /api/authors/:id      — 获取某个作者详情
POST   /api/authors          — 创建新作者
PUT    /api/authors/:id      — 更新某个作者
DELETE /api/authors/:id      — 删除某个作者

📝 借阅相关接口
───────────────────────────────────────────────────────────────
GET    /api/borrows          — 获取所有借阅记录
GET    /api/borrows/:id      — 获取某条借阅记录
POST   /api/borrows          — 创建借阅记录（借书）
PUT    /api/borrows/:id      — 更新借阅记录（还书）
DELETE /api/borrows/:id      — 删除借阅记录
```

### RESTful vs 非RESTful对比

```
场景：获取ID为5的用户信息

❌ 非RESTful（随意命名）
GET /getUser?id=5
GET /userInfo?id=5
GET /queryUserData?userId=5

✅ RESTful（统一规范）
GET /users/5
```

```
场景：删除ID为10的书籍

❌ 非RESTful
GET /deleteBook?id=10
POST /book/delete.php?id=10

✅ RESTful
DELETE /books/10
```

---

## Node.js创建HTTP服务

### 基础HTTP服务器

Node.js内置了`http`模块，可以直接创建Web服务器：

```javascript
// 01_basic_server.js
// 引入Node.js内置的http模块
const http = require('http');

// 创建HTTP服务器
const server = http.createServer((request, response) => {
    // request：客户端请求信息
    // response：服务器响应对象

    // 获取请求方法和路径
    const method = request.method;
    const url = request.url;

    console.log(`收到请求：${method} ${url}`);

    // 设置响应头，告诉浏览器返回的是JSON格式
    response.setHeader('Content-Type', 'application/json; charset=utf-8');

    // 根据不同路径返回不同数据
    if (url === '/api/books' && method === 'GET') {
        const books = [
            { id: 1, title: '《红楼梦》', author: '曹雪芹' },
            { id: 2, title: '《西游记》', author: '吴承恩' },
            { id: 3, title: '《三国演义》', author: '罗贯中' }
        ];
        // 返回JSON数据
        response.end(JSON.stringify({
            code: 200,
            message: '获取成功',
            data: books
        }));
    } else {
        // 返回404错误
        response.statusCode = 404;
        response.end(JSON.stringify({
            code: 404,
            message: '请求的资源不存在'
        }));
    }
});

// 让服务器监听3000端口
server.listen(3000, () => {
    console.log('🚀 服务器已启动，访问 http://localhost:3000');
});
```

**运行服务器：**

```bash
node 01_basic_server.js
```

**访问测试：**

```
浏览器访问：http://localhost:3000/api/books

响应：
{
    "code": 200,
    "message": "获取成功",
    "data": [
        {"id": 1, "title": "《红楼梦》", "author": "曹雪芹"},
        {"id": 2, "title": "《西游记》", "author": "吴承恩"},
        {"id": 3, "title": "《三国演义》", "author": "罗贯中"}
    ]
}
```

### 处理不同HTTP方法

```javascript
// 02_method_router.js
const http = require('http');

const server = http.createServer((req, res) => {
    // 设置CORS头（允许跨域访问）
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 处理OPTIONS预检请求
    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
    }

    const url = req.url.split('?')[0]; // 去掉查询参数
    const method = req.method;

    console.log(`${method} ${url}`);

    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    // 路由匹配
    if (url === '/api/books' && method === 'GET') {
        // 获取所有书籍
        res.end(JSON.stringify({ code: 200, data: [] }));
    } else if (url === '/api/books' && method === 'POST') {
        // 创建书籍 - 稍后处理POST请求体
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            const newBook = JSON.parse(body);
            res.end(JSON.stringify({ code: 201, data: newBook }));
        });
    } else if (url.match(/^\/api\/books\/\d+$/) && method === 'GET') {
        // 获取单本书籍 - 提取ID
        const id = url.split('/').pop();
        res.end(JSON.stringify({ code: 200, data: { id, title: '示例书籍' } }));
    } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ code: 404, message: '未找到' }));
    }
});

server.listen(3000, () => {
    console.log('服务器运行在 http://localhost:3000');
});
```

### 处理URL参数和查询字符串

```javascript
// 03_url_parsing.js
const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    // 解析URL
    const parsedUrl = url.parse(req.url, true); // true表示解析查询参数
    const pathname = parsedUrl.pathname;        // 路径：/api/books
    const query = parsedUrl.query;             // 查询参数：{ page: '1', limit: '10' }

    console.log('路径:', pathname);
    console.log('查询参数:', query);

    if (pathname === '/api/books' && req.method === 'GET') {
        // 获取分页参数
        const page = parseInt(query.page) || 1;      // 默认第1页
        const limit = parseInt(query.limit) || 10;   // 默认每页10条

        // 模拟数据库查询
        const books = [
            { id: 1, title: '红楼梦' },
            { id: 2, title: '西游记' },
            { id: 3, title: '三国演义' }
        ];

        // 分页处理
        const start = (page - 1) * limit;
        const end = start + limit;
        const paginatedBooks = books.slice(start, end);

        res.end(JSON.stringify({
            code: 200,
            data: {
                list: paginatedBooks,
                pagination: {
                    page,
                    limit,
                    total: books.length,
                    totalPages: Math.ceil(books.length / limit)
                }
            }
        }));
    } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ code: 404, message: '未找到' }));
    }
});

server.listen(3000, () => {
    console.log('服务器运行在 http://localhost:3000');
    console.log('测试：http://localhost:3000/api/books?page=1&limit=2');
});
```

---

## Express框架快速入门

### Express简介

Express是最流行的Node.js Web框架，它简化了HTTP服务器的创建和路由处理。

**安装Express：**

```bash
npm init -y
npm install express
```

### 基础Express应用

```javascript
// 04_express_basic.js
// 引入Express框架
const express = require('express');

// 创建Express应用
const app = express();

// 中间件：解析JSON请求体
app.use(express.json());

// 中间件：记录请求日志
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next(); // 继续处理下一个中间件
});

// GET请求 - 获取资源
app.get('/api/books', (req, res) => {
    // 返回书籍列表
    res.json({
        code: 200,
        message: '获取成功',
        data: [
            { id: 1, title: '红楼梦', author: '曹雪芹', price: 59.00 },
            { id: 2, title: '西游记', author: '吴承恩', price: 49.00 },
            { id: 3, title: '三国演义', author: '罗贯中', price: 55.00 }
        ]
    });
});

// GET请求 - 获取单个资源
app.get('/api/books/:id', (req, res) => {
    // 获取URL参数
    const { id } = req.params;

    // 模拟数据库查询
    const book = {
        id,
        title: '红楼梦',
        author: '曹雪芹',
        price: 59.00,
        description: '中国古典四大名著之一'
    };

    res.json({
        code: 200,
        data: book
    });
});

// POST请求 - 创建资源
app.post('/api/books', (req, res) => {
    // 获取请求体数据
    const { title, author, price, description } = req.body;

    // 模拟保存到数据库
    const newBook = {
        id: Date.now(), // 使用时间戳作为ID
        title,
        author,
        price,
        description
    };

    res.status(201).json({
        code: 201,
        message: '创建成功',
        data: newBook
    });
});

// PUT请求 - 完整更新资源
app.put('/api/books/:id', (req, res) => {
    const { id } = req.params;
    const { title, author, price, description } = req.body;

    // 模拟完整更新
    const updatedBook = {
        id,
        title,
        author,
        price,
        description
    };

    res.json({
        code: 200,
        message: '更新成功',
        data: updatedBook
    });
});

// PATCH请求 - 部分更新资源
app.patch('/api/books/:id', (req, res) => {
    const { id } = req.params;
    const updateData = req.body; // 只更新提供的字段

    // 模拟部分更新
    res.json({
        code: 200,
        message: '部分更新成功',
        data: { id, ...updateData }
    });
});

// DELETE请求 - 删除资源
app.delete('/api/books/:id', (req, res) => {
    const { id } = req.params;

    res.json({
        code: 200,
        message: '删除成功',
        data: { id }
    });
});

// 启动服务器
app.listen(3000, () => {
    console.log('🚀 Express服务器已启动');
    console.log('📖 访问 http://localhost:3000/api/books');
});
```

### 运行和测试

```bash
node 04_express_basic.js
```

**测试各接口：**

```bash
# 获取所有书籍
curl http://localhost:3000/api/books

# 获取ID为1的书籍
curl http://localhost:3000/api/books/1

# 创建新书
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{"title":"水浒传","author":"施耐庵","price":65}'

# 更新书籍
curl -X PUT http://localhost:3000/api/books/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"红楼梦（新版）","author":"曹雪芹","price":69}'

# 部分更新
curl -X PATCH http://localhost:3000/api/books/1 \
  -H "Content-Type: application/json" \
  -d '{"price":69}'

# 删除书籍
curl -X DELETE http://localhost:3000/api/books/1
```

---

## Koa框架快速入门

### Koa简介

Koa是Express的升级版，由Express团队重新设计，使用async/await语法，号称"更小、更富表现力、更健壮"。

**安装Koa：**

```bash
npm install koa koa-router koa-bodyparser
```

### 基础Koa应用

```javascript
// 05_koa_basic.js
// 引入Koa框架
const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');

// 创建Koa应用实例
const app = new Koa();

// 创建路由实例
const router = new Router();

// 模拟数据库
let books = [
    { id: 1, title: '红楼梦', author: '曹雪芹', price: 59.00 },
    { id: 2, title: '西游记', author: '吴承恩', price: 49.00 },
    { id: 3, title: '三国演义', author: '罗贯中', price: 55.00 }
];

// Koa中间件：记录日志
app.use(async (ctx, next) => {
    const start = Date.now();
    console.log(`[${new Date().toISOString()}] ${ctx.method} ${ctx.url}`);

    await next(); // 等待其他中间件处理

    const ms = Date.now() - start;
    console.log(`处理耗时：${ms}ms`);
});

// Koa中间件：解析请求体
app.use(bodyParser());

// Koa中间件：处理错误
app.use(async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        ctx.status = err.status || 500;
        ctx.body = {
            code: ctx.status,
            message: err.message || '服务器内部错误'
        };
        console.error('错误：', err.message);
    }
});

// GET请求 - 获取所有书籍
router.get('/api/books', async (ctx) => {
    ctx.body = {
        code: 200,
        message: '获取成功',
        data: books
    };
});

// GET请求 - 获取单本书籍
router.get('/api/books/:id', async (ctx) => {
    const { id } = ctx.params;
    const book = books.find(b => b.id === parseInt(id));

    if (!book) {
        ctx.status = 404;
        ctx.body = {
            code: 404,
            message: '书籍不存在'
        };
        return;
    }

    ctx.body = {
        code: 200,
        data: book
    };
});

// POST请求 - 创建书籍
router.post('/api/books', async (ctx) => {
    const { title, author, price } = ctx.request.body;

    // 验证必填字段
    if (!title || !author) {
        ctx.status = 400;
        ctx.body = {
            code: 400,
            message: '书名和作者不能为空'
        };
        return;
    }

    const newBook = {
        id: books.length + 1,
        title,
        author,
        price: price || 0
    };

    books.push(newBook);

    ctx.status = 201;
    ctx.body = {
        code: 201,
        message: '创建成功',
        data: newBook
    };
});

// PUT请求 - 完整更新
router.put('/api/books/:id', async (ctx) => {
    const { id } = ctx.params;
    const { title, author, price } = ctx.request.body;

    const index = books.findIndex(b => b.id === parseInt(id));

    if (index === -1) {
        ctx.status = 404;
        ctx.body = {
            code: 404,
            message: '书籍不存在'
        };
        return;
    }

    // 完整更新
    books[index] = {
        id: parseInt(id),
        title: title || books[index].title,
        author: author || books[index].author,
        price: price !== undefined ? price : books[index].price
    };

    ctx.body = {
        code: 200,
        message: '更新成功',
        data: books[index]
    };
});

// DELETE请求 - 删除书籍
router.delete('/api/books/:id', async (ctx) => {
    const { id } = ctx.params;
    const index = books.findIndex(b => b.id === parseInt(id));

    if (index === -1) {
        ctx.status = 404;
        ctx.body = {
            code: 404,
            message: '书籍不存在'
        };
        return;
    }

    const deleted = books.splice(index, 1)[0];

    ctx.body = {
        code: 200,
        message: '删除成功',
        data: deleted
    };
});

// 将路由注册到应用
app.use(router.routes());
app.use(router.allowedMethods());

// 启动服务器
app.listen(3000, () => {
    console.log('🚀 Koa服务器已启动');
    console.log('📖 访问 http://localhost:3000/api/books');
});
```

---

## 请求处理（GET/POST/PUT/DELETE）

### GET请求 - 获取数据

**特点：** 从服务器获取数据，不修改服务器状态

```javascript
// GET请求示例
app.get('/api/books', (req, res) => {
    // 返回所有书籍
    res.json({
        code: 200,
        data: books
    });
});

app.get('/api/books/:id', (req, res) => {
    // req.params 包含URL参数
    const { id } = req.params;

    const book = books.find(b => b.id === parseInt(id));

    if (!book) {
        return res.status(404).json({
            code: 404,
            message: '书籍不存在'
        });
    }

    res.json({
        code: 200,
        data: book
    });
});

// 支持查询参数
app.get('/api/books/search', (req, res) => {
    // req.query 包含查询字符串
    const { keyword, author, minPrice, maxPrice } = req.query;

    let result = books;

    // 按关键词搜索
    if (keyword) {
        result = result.filter(b =>
            b.title.includes(keyword) || b.description?.includes(keyword)
        );
    }

    // 按作者筛选
    if (author) {
        result = result.filter(b => b.author === author);
    }

    // 按价格范围筛选
    if (minPrice) {
        result = result.filter(b => b.price >= parseFloat(minPrice));
    }
    if (maxPrice) {
        result = result.filter(b => b.price <= parseFloat(maxPrice));
    }

    res.json({
        code: 200,
        data: result,
        total: result.length
    });
});
```

**URL示例：**

```
GET /api/books/search?keyword=红&author=曹雪芹&minPrice=50&maxPrice=100
```

### POST请求 - 创建数据

**特点：** 在服务器创建新资源

```javascript
// POST请求示例
app.post('/api/books', (req, res) => {
    // req.body 包含请求体数据
    const { title, author, price, description, coverImage } = req.body;

    // 数据验证
    const errors = [];

    if (!title || title.trim() === '') {
        errors.push('书名不能为空');
    }
    if (!author || author.trim() === '') {
        errors.push('作者不能为空');
    }
    if (price !== undefined && (isNaN(price) || price < 0)) {
        errors.push('价格必须是正数');
    }

    // 如果有验证错误
    if (errors.length > 0) {
        return res.status(400).json({
            code: 400,
            message: '数据验证失败',
            errors
        });
    }

    // 创建新书籍
    const newBook = {
        id: Date.now(), // 简单生成ID的方式
        title: title.trim(),
        author: author.trim(),
        price: price || 0,
        description: description || '',
        coverImage: coverImage || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    books.push(newBook);

    // 返回201 Created状态码
    res.status(201).json({
        code: 201,
        message: '创建成功',
        data: newBook
    });
});
```

**curl测试POST：**

```bash
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "水浒传",
    "author": "施耐庵",
    "price": 65.00,
    "description": "中国古典四大名著之一"
  }'
```

### PUT请求 - 完整更新

**特点：** 替换整个资源，所有字段都必须提供

```javascript
// PUT请求示例 - 完整更新
app.put('/api/books/:id', (req, res) => {
    const { id } = req.params;
    const { title, author, price, description, coverImage } = req.body;

    // 查找书籍
    const index = books.findIndex(b => b.id === parseInt(id));

    if (index === -1) {
        return res.status(404).json({
            code: 404,
            message: '书籍不存在'
        });
    }

    // 验证必填字段
    if (!title || !author) {
        return res.status(400).json({
            code: 400,
            message: '书名和作者不能为空'
        });
    }

    // 完整更新（替换整个对象）
    books[index] = {
        id: parseInt(id),
        title: title.trim(),
        author: author.trim(),
        price: price || 0,
        description: description || '',
        coverImage: coverImage || '',
        createdAt: books[index].createdAt, // 保留创建时间
        updatedAt: new Date().toISOString() // 更新修改时间
    };

    res.json({
        code: 200,
        message: '更新成功',
        data: books[index]
    });
});
```

### PATCH请求 - 部分更新

**特点：** 只更新提供的字段，其他字段保持不变

```javascript
// PATCH请求示例 - 部分更新
app.patch('/api/books/:id', (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    // 查找书籍
    const index = books.findIndex(b => b.id === parseInt(id));

    if (index === -1) {
        return res.status(404).json({
            code: 404,
            message: '书籍不存在'
        });
    }

    // 部分更新（只更新提供的字段）
    const book = books[index];

    if (updateData.title !== undefined) {
        book.title = updateData.title.trim();
    }
    if (updateData.author !== undefined) {
        book.author = updateData.author.trim();
    }
    if (updateData.price !== undefined) {
        if (isNaN(updateData.price) || updateData.price < 0) {
            return res.status(400).json({
                code: 400,
                message: '价格必须是正数'
            });
        }
        book.price = updateData.price;
    }
    if (updateData.description !== undefined) {
        book.description = updateData.description;
    }
    if (updateData.coverImage !== undefined) {
        book.coverImage = updateData.coverImage;
    }

    book.updatedAt = new Date().toISOString();

    res.json({
        code: 200,
        message: '更新成功',
        data: book
    });
});
```

**PUT vs PATCH的区别：**

```
场景：更新书籍价格

假设原书籍：{ id: 1, title: "红楼梦", author: "曹雪芹", price: 59 }

请求：只更新价格

PUT /api/books/1
Body: { "price": 69 }

结果：书籍变成 { id: 1, title: undefined, author: undefined, price: 69 }
      ❌ 错误！其他字段被清空了

PATCH /api/books/1
Body: { "price": 69 }

结果：书籍变成 { id: 1, title: "红楼梦", author: "曹雪芹", price: 69 }
      ✅ 正确！只更新了价格
```

### DELETE请求 - 删除数据

```javascript
// DELETE请求示例
app.delete('/api/books/:id', (req, res) => {
    const { id } = req.params;

    const index = books.findIndex(b => b.id === parseInt(id));

    if (index === -1) {
        return res.status(404).json({
            code: 404,
            message: '书籍不存在'
        });
    }

    // 删除书籍
    const deleted = books.splice(index, 1)[0];

    res.json({
        code: 200,
        message: '删除成功',
        data: deleted
    });
});

// 批量删除
app.delete('/api/books', (req, res) => {
    const { ids } = req.body; // ids应该是数组，如 [1, 2, 3]

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
            code: 400,
            message: '请提供要删除的ID列表'
        });
    }

    const deletedCount = 0;
    ids.forEach(id => {
        const index = books.findIndex(b => b.id === id);
        if (index !== -1) {
            books.splice(index, 1);
            deletedCount++;
        }
    });

    res.json({
        code: 200,
        message: `成功删除 ${deletedCount} 条记录`,
        data: { deletedCount }
    });
});
```

---

## 参数获取详解

### 1. URL路径参数（params）

**定义：** 在URL路径中定义的参数

```javascript
// 路由定义：/api/books/:id
// 访问URL：/api/books/123

app.get('/api/books/:id', (req, res) => {
    // req.params = { id: '123' }
    console.log(req.params.id);
});


// 多级参数
app.get('/api/users/:userId/orders/:orderId', (req, res) => {
    // req.params = { userId: '1', orderId: '5' }
    console.log(`用户 ${req.params.userId} 的订单 ${req.params.orderId}`);
});

// 可选参数
app.get('/api/books/:id/:chapter?', (req, res) => {
    // chapter是可选的
    // /api/books/1     -> req.params = { id: '1', chapter: undefined }
    // /api/books/1/3   -> req.params = { id: '1', chapter: '3' }
});
```

### 2. 查询字符串参数（query）

**定义：** URL中?后面的参数

```
URL: /api/books?page=1&limit=10&sort=price&order=asc
```

```javascript
app.get('/api/books', (req, res) => {
    // req.query = { page: '1', limit: '10', sort: 'price', order: 'asc' }

    const {
        page = 1,      // 默认第1页
        limit = 10,    // 默认每页10条
        sort = 'id',   // 默认按ID排序
        order = 'asc'  // 默认升序
    } = req.query;

    // 转换类型
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // 分页计算
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;

    // 排序
    let sortedBooks = [...books];
    if (sort === 'price') {
        sortedBooks.sort((a, b) => {
            return order === 'desc' ? b.price - a.price : a.price - b.price;
        });
    }

    // 返回分页数据
    const paginatedData = sortedBooks.slice(startIndex, endIndex);

    res.json({
        code: 200,
        data: {
            list: paginatedData,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: books.length,
                totalPages: Math.ceil(books.length / limitNum)
            }
        }
    });
});
```

### 3. 请求头参数（headers）

```javascript
// 常用请求头
app.get('/api/books', (req, res) => {
    // 获取常用请求头
    const token = req.headers.authorization;       // Bearer token
    const contentType = req.headers['content-type']; // Content-Type
    const userAgent = req.headers['user-agent'];    // 用户代理
    const accept = req.headers.accept;              // 可接受的内容类型
    const lang = req.headers['accept-language'];    // 接受的语言

    // JWT认证示例
    if (!token) {
        return res.status(401).json({
            code: 401,
            message: '请先登录'
        });
    }

    // 验证token（这里简化处理）
    const isValid = verifyToken(token);
    if (!isValid) {
        return res.status(401).json({
            code: 401,
            message: 'token无效'
        });
    }

    res.json({
        code: 200,
        data: books
    });
});
```

### 4. 请求体参数（body）

```javascript
// 需要中间件支持：app.use(express.json())

// JSON请求体
app.post('/api/books', (req, res) => {
    // req.body 包含解析后的JSON数据
    const { title, author, price } = req.body;

    // 验证
    if (!title) {
        return res.status(400).json({
            code: 400,
            message: '书名不能为空'
        });
    }

    res.json({
        code: 201,
        data: { title, author, price }
    });
});

// 表单数据（application/x-www-form-urlencoded）
// 需要中间件：app.use(express.urlencoded({ extended: true }))

app.post('/api/login', (req, res) => {
    // express.urlencoded 解析后的数据也在 req.body 中
    const { username, password } = req.body;

    console.log(`用户登录：${username}`);

    res.json({
        code: 200,
        message: '登录成功'
    });
});
```

### 5. 文件上传参数

```javascript
// 需要中间件：npm install multer
const multer = require('multer');

// 配置上传
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // 保存到uploads目录
    },
    filename: (req, file, cb) => {
        // 生成唯一文件名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// 单文件上传
app.post('/api/upload/cover', upload.single('cover'), (req, res) => {
    // req.file 包含上传文件的信息
    console.log('文件信息：', req.file);

    res.json({
        code: 200,
        message: '上传成功',
        data: {
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size
        }
    });
});

// 多文件上传
app.post('/api/upload/images', upload.array('images', 5), (req, res) => {
    // req.files 包含所有上传的文件
    console.log('文件数量：', req.files.length);

    res.json({
        code: 200,
        message: '上传成功',
        data: req.files.map(f => ({
            filename: f.filename,
            path: f.path
        }))
    });
});
```

### 参数获取方法对比

```
┌─────────────────────────────────────────────────────────────────┐
│                        参数获取方法对比                          │
├──────────────┬──────────────────────────────────────────────────┤
│ 参数类型      │ 获取方式                                         │
├──────────────┼──────────────────────────────────────────────────┤
│ URL路径参数   │ req.params.id                                    │
│ 查询字符串    │ req.query.page                                   │
│ 请求头        │ req.headers.authorization                        │
│ JSON请求体    │ req.body (需要express.json()中间件)              │
│ 表单数据      │ req.body (需要express.urlencoded()中间件)         │
│ 文件上传      │ req.file / req.files (需要multer中间件)           │
└──────────────┴──────────────────────────────────────────────────┘
```

---

## 响应格式设计

### 统一响应格式

```javascript
// 统一响应格式
const response = {
    // 成功响应
    success: (data, message = '操作成功') => {
        return {
            code: 200,
            success: true,
            message,
            data,
            timestamp: new Date().toISOString()
        };
    },

    // 创建成功响应
    created: (data, message = '创建成功') => {
        return {
            code: 201,
            success: true,
            message,
            data,
            timestamp: new Date().toISOString()
        };
    },

    // 错误响应
    error: (message, code = 500, errors = null) => {
        return {
            code,
            success: false,
            message,
            errors,
            timestamp: new Date().toISOString()
        };
    },

    // 分页响应
    paginated: (list, pagination, message = '获取成功') => {
        return {
            code: 200,
            success: true,
            message,
            data: list,
            pagination,
            timestamp: new Date().toISOString()
        };
    }
};

// 使用示例
app.get('/api/books', (req, res) => {
    res.json(response.success(books));
});

app.post('/api/books', (req, res) => {
    const newBook = { id: Date.now(), ...req.body };
    res.status(201).json(response.created(newBook));
});

app.get('/api/books', (req, res) => {
    const pagination = {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10
    };
    res.json(response.paginated(books, pagination));
});
```

### 完整响应示例

```javascript
// 响应示例

// 1. 成功获取单个资源
{
    "code": 200,
    "success": true,
    "message": "获取成功",
    "data": {
        "id": 1,
        "title": "红楼梦",
        "author": "曹雪芹",
        "price": 59.00
    },
    "timestamp": "2024-01-15T10:30:00.000Z"
}

// 2. 成功获取资源列表
{
    "code": 200,
    "success": true,
    "message": "获取成功",
    "data": [
        {"id": 1, "title": "红楼梦", "author": "曹雪芹"},
        {"id": 2, "title": "西游记", "author": "吴承恩"}
    ],
    "timestamp": "2024-01-15T10:30:00.000Z"
}

// 3. 成功分页数据
{
    "code": 200,
    "success": true,
    "message": "获取成功",
    "data": [
        {"id": 1, "title": "红楼梦"},
        {"id": 2, "title": "西游记"}
    ],
    "pagination": {
        "page": 1,
        "limit": 10,
        "total": 50,
        "totalPages": 5
    },
    "timestamp": "2024-01-15T10:30:00.000Z"
}

// 4. 创建成功
{
    "code": 201,
    "success": true,
    "message": "创建成功",
    "data": {
        "id": 4,
        "title": "水浒传",
        "author": "施耐庵"
    },
    "timestamp": "2024-01-15T10:30:00.000Z"
}

// 5. 错误响应 - 验证失败
{
    "code": 400,
    "success": false,
    "message": "数据验证失败",
    "errors": [
        "书名不能为空",
        "价格必须是正数"
    ],
    "timestamp": "2024-01-15T10:30:00.000Z"
}

// 6. 错误响应 - 资源不存在
{
    "code": 404,
    "success": false,
    "message": "书籍不存在",
    "timestamp": "2024-01-15T10:30:00.000Z"
}

// 7. 错误响应 - 未授权
{
    "code": 401,
    "success": false,
    "message": "请先登录",
    "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 设置响应头

```javascript
// 设置各种响应头
app.get('/api/books', (req, res) => {
    // 设置内容类型
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    // 设置允许跨域
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // 设置缓存（对于API通常不缓存）
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    // 设置X-Powered-By（安全考虑可以隐藏）
    res.setHeader('X-Powered-By', 'Express');

    // 发送JSON响应
    res.json({
        code: 200,
        data: books
    });
});

// 设置Cookie
app.post('/api/login', (req, res) => {
    const { token } = req.body;

    // 设置Cookie
    res.cookie('token', token, {
        httpOnly: true,    // 防止XSS攻击
        secure: false,     // 生产环境应为true（HTTPS）
        maxAge: 24 * 60 * 60 * 1000, // 24小时
        sameSite: 'strict' // 防止CSRF攻击
    });

    res.json({
        code: 200,
        message: '登录成功'
    });
});
```

---

## 错误处理机制

### HTTP状态码详解

```javascript
// 常用HTTP状态码及使用场景

// 成功状态码
200 OK                    // GET请求成功、PUT/PATCH/DELETE成功
201 Created               // POST创建资源成功
204 No Content            // 删除成功但不返回数据

// 客户端错误状态码
400 Bad Request           // 请求参数错误、验证失败
401 Unauthorized          // 未登录、未认证
403 Forbidden             // 已登录但没有权限
404 Not Found             // 资源不存在
405 Method Not Allowed    // HTTP方法不允许
409 Conflict              // 资源冲突（如重复创建）
422 Unprocessable Entity  // 格式正确但语义错误
429 Too Many Requests      // 请求过于频繁

// 服务器错误状态码
500 Internal Server Error // 服务器内部错误
502 Bad Gateway           // 网关错误
503 Service Unavailable   // 服务不可用
504 Gateway Timeout       // 网关超时
```

### 统一错误处理

```javascript
// 01_error_handling.js
const express = require('express');
const app = express();

app.use(express.json());

// 自定义错误类
class ApiError extends Error {
    constructor(code, message, errors = null) {
        super(message);
        this.code = code;
        this.errors = errors;
        this.name = 'ApiError';
    }
}

// 常用错误快捷方式
const errors = {
    badRequest: (message = '请求参数错误', errors = null) =>
        new ApiError(400, message, errors),

    unauthorized: (message = '请先登录') =>
        new ApiError(401, message),

    forbidden: (message = '没有权限访问') =>
        new ApiError(403, message),

    notFound: (message = '资源不存在') =>
        new ApiError(404, message),

    conflict: (message = '资源冲突') =>
        new ApiError(409, message),

    serverError: (message = '服务器内部错误') =>
        new ApiError(500, message)
};

// 错误处理中间件（必须放在所有路由之后）
app.use((err, req, res, next) => {
    console.error('错误发生：', err);

    // 处理ApiError
    if (err instanceof ApiError) {
        return res.status(err.code).json({
            code: err.code,
            success: false,
            message: err.message,
            errors: err.errors
        });
    }

    // 处理JSON解析错误
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            code: 400,
            success: false,
            message: 'JSON格式错误'
        });
    }

    // 处理验证错误（如Joi验证）
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            code: 400,
            success: false,
            message: '数据验证失败',
            errors: err.details
        });
    }

    // 默认服务器错误
    res.status(500).json({
        code: 500,
        success: false,
        message: '服务器内部错误'
    });
});

// 模拟数据
let books = [
    { id: 1, title: '红楼梦', author: '曹雪芹', price: 59 }
];

// 路由：验证示例
app.post('/api/books', (req, res, next) => {
    const { title, author, price } = req.body;

    const errors = [];

    // 验证
    if (!title || title.trim() === '') {
        errors.push('书名不能为空');
    }
    if (!author || author.trim() === '') {
        errors.push('作者不能为空');
    }
    if (title && title.length > 100) {
        errors.push('书名不能超过100个字符');
    }
    if (price !== undefined && (isNaN(price) || price < 0)) {
        errors.push('价格必须是正数');
    }

    // 如果有验证错误，抛出错误
    if (errors.length > 0) {
        return next(errors.badRequest('数据验证失败', errors));
    }

    // 创建书籍
    const newBook = {
        id: Date.now(),
        title: title.trim(),
        author: author.trim(),
        price: price || 0
    };

    books.push(newBook);

    res.status(201).json({
        code: 201,
        success: true,
        message: '创建成功',
        data: newBook
    });
});

// 404处理（处理未匹配的路由）
app.use((req, res) => {
    res.status(404).json({
        code: 404,
        success: false,
        message: `路由 ${req.method} ${req.url} 不存在`
    });
});

app.listen(3000, () => {
    console.log('错误处理服务器已启动');
});
```

### 异步错误处理

```javascript
// 异步错误处理

// ❌ 错误：异步错误没有被捕获
app.get('/api/books/:id', (req, res) => {
    // 如果findById抛出异常，这个错误不会被Express的错误处理中间件捕获
    const book = await Book.findById(req.params.id);
    res.json(book);
});

// ✅ 正确：使用try-catch
app.get('/api/books/:id', async (req, res, next) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({
                code: 404,
                message: '书籍不存在'
            });
        }
        res.json(book);
    } catch (err) {
        next(err); // 将错误传递给错误处理中间件
    }
});

// ✅ 更简洁：使用express-async-errors
require('express-async-errors');

app.get('/api/books/:id', async (req, res) => {
    // 如果这里抛出错误，会自动被错误处理中间件捕获
    const book = await Book.findById(req.params.id);
    if (!book) {
        throw new ApiError(404, '书籍不存在');
    }
    res.json(book);
});
```

---

## 中间件机制详解

### 中间件概念

中间件（Middleware）是Express最核心的概念。它是一个函数，可以访问请求对象（req）和响应对象（res），以及处理流程中的下一个中间件（next）。

**中间件的工作流程：**

```
请求 → 中间件1 → 中间件2 → 中间件3 → 路由处理 → 响应
            ↓         ↓         ↓
          next()    next()    next()
```

### 中间件类型

```javascript
// 02_middleware_types.js
const express = require('express');
const app = express();

app.use(express.json());

// 1. 应用级中间件 - 每个请求都会执行
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] 收到请求：${req.method} ${req.url}`);
    next();
});

// 2. 路由级中间件 - 只在匹配特定路由时执行
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization;
    if (token === 'valid-token') {
        req.user = { id: 1, name: '张三' }; // 添加用户信息到请求对象
        next();
    } else {
        res.status(401).json({
            code: 401,
            message: '未授权'
        });
    }
};

const validateMiddleware = (req, res, next) => {
    if (req.body && req.body.title) {
        next();
    } else {
        res.status(400).json({
            code: 400,
            message: '缺少必填字段'
        });
    }
};

// 3. 错误处理中间件 - 必须有4个参数(err, req, res, next)
app.use((err, req, res, next) => {
    console.error('发生错误：', err);
    res.status(500).json({
        code: 500,
        message: '服务器错误'
    });
});

// 4. 内置中间件 - Express自带
// express.json() - 解析JSON请求体
// express.urlencoded() - 解析URL编码的表单数据
// express.static() - 提供静态文件服务

// 5. 第三方中间件
// cors - 处理跨域
// helmet - 安全 headers
// morgan - HTTP日志
// compression - 压缩响应

// 使用路由级中间件
app.post('/api/books', authMiddleware, validateMiddleware, (req, res) => {
    // 只有通过 authMiddleware 和 validateMiddleware 才会执行到这里
    res.json({
        code: 201,
        message: '创建成功',
        data: req.body
    });
});

// 为一组路由使用中间件
const bookRoutes = express.Router();

// 书籍相关路由都需要认证
bookRoutes.use(authMiddleware);

bookRoutes.get('/', (req, res) => {
    res.json({ books: [] });
});

bookRoutes.post('/', validateMiddleware, (req, res) => {
    res.json({ code: 201 });
});

bookRoutes.delete('/:id', (req, res) => {
    res.json({ code: 200 });
});

app.use('/api/books', bookRoutes);

app.listen(3000, () => {
    console.log('中间件示例服务器已启动');
});
```

### 常用中间件实现

```javascript
// 03_common_middlewares.js

// 1. CORS中间件 - 允许跨域请求
const corsMiddleware = (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // 处理预检请求
    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        return res.end();
    }

    next();
};

// 2. 日志中间件
const loggerMiddleware = (req, res, next) => {
    const start = Date.now();

    // 响应结束时记录日志
    res.on('finish', () => {
        const duration = Date.now() - start;
        const log = {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.headers['user-agent']
        };
        console.log(JSON.stringify(log));
    });

    next();
};

// 3. 请求限流中间件
const rateLimitMiddleware = (() => {
    const requests = new Map();

    return (req, res, next) => {
        const key = req.ip;
        const now = Date.now();

        // 获取该IP的请求记录
        let record = requests.get(key) || { count: 0, resetTime: now + 60000 };

        // 检查是否需要重置计数器
        if (now > record.resetTime) {
            record = { count: 0, resetTime: now + 60000 };
        }

        // 检查是否超过限制
        if (record.count >= 100) { // 每分钟最多100次
            return res.status(429).json({
                code: 429,
                message: '请求过于频繁，请稍后再试'
            });
        }

        record.count++;
        requests.set(key, record);

        next();
    };
})();

// 4. 请求体大小限制中间件
const bodySizeLimitMiddleware = (limit = '1mb') => {
    return (req, res, next) => {
        if (req.headers['content-length'] && parseInt(req.headers['content-length']) > 1024 * 1024) {
            return res.status(413).json({
                code: 413,
                message: '请求体过大'
            });
        }
        next();
    };
};

// 5. JWT认证中间件
const jwtAuthMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            code: 401,
            message: '未提供认证token'
        });
    }

    const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : authHeader;

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded; // 将解码后的用户信息添加到请求对象
        next();
    } catch (err) {
        return res.status(401).json({
            code: 401,
            message: 'token无效或已过期'
        });
    }
};

// 6. 参数验证中间件工厂
const validateBody = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                code: 400,
                message: '数据验证失败',
                errors: error.details.map(d => d.message)
            });
        }
        next();
    };
};

// 完整应用示例
const express = require('express');
const app = express();

app.use(express.json());
app.use(corsMiddleware);
app.use(loggerMiddleware);
app.use(rateLimitMiddleware);
app.use(bodySizeLimitMiddleware());

// 需要认证的路由
app.get('/api/profile', jwtAuthMiddleware, (req, res) => {
    res.json({
        code: 200,
        data: req.user
    });
});

app.listen(3000, () => {
    console.log('完整中间件示例服务器已启动');
});
```

---

## 实战项目：图书管理系统API

### 项目结构

```
book-api/
├── app.js              # 应用入口
├── package.json        # 项目配置
├── routes/             # 路由目录
│   ├── index.js        # 路由入口
│   ├── books.js        # 书籍路由
│   ├── authors.js      # 作者路由
│   └── borrow.js       # 借阅路由
├── controllers/        # 控制器目录
│   ├── bookController.js
│   ├── authorController.js
│   └── borrowController.js
├── models/             # 数据模型目录
│   └── database.js     # 模拟数据库
├── middlewares/        # 中间件目录
│   ├── auth.js
│   ├── validator.js
│   └── errorHandler.js
└── utils/              # 工具函数目录
    └── response.js     # 响应工具
```

### 1. 项目初始化

```bash
# 创建项目目录
mkdir book-api
cd book-api

# 初始化项目
npm init -y

# 安装依赖
npm install express cors helmet morgan joi jsonwebtoken uuid
npm install --save-dev nodemon
```

**package.json配置：**

```json
{
  "name": "book-api",
  "version": "1.0.0",
  "description": "图书管理系统API",
  "main": "app.js",
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "joi": "^17.11.0",
    "jsonwebtoken": "^9.0.2",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

### 2. 主应用文件

```javascript
// app.js
// 图书管理系统API主入口文件

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

// 创建Express应用
const app = express();

// 安全中间件
app.use(helmet()); // 设置安全相关的HTTP头
app.use(cors());   // 允许跨域请求

// 日志中间件
app.use(morgan('combined'));

// 解析请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 健康检查接口
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

// API路由
app.use('/api', routes);

// 404处理
app.use((req, res) => {
    res.status(404).json({
        code: 404,
        success: false,
        message: '请求的接口不存在'
    });
});

// 统一错误处理
app.use(errorHandler);

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 图书管理系统API已启动`);
    console.log(`📖 访问地址：http://localhost:${PORT}`);
    console.log(`❤️  健康检查：http://localhost:${PORT}/health`);
});
```

### 3. 工具函数

```javascript
// utils/response.js
// 统一响应格式工具

/**
 * 成功响应
 * @param {any} data - 响应数据
 * @param {string} message - 成功消息
 * @returns {object} 统一格式的响应对象
 */
const success = (data = null, message = '操作成功') => {
    return {
        code: 200,
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    };
};

/**
 * 创建成功响应
 * @param {any} data - 响应数据
 * @param {string} message - 成功消息
 * @returns {object} 201状态码的响应对象
 */
const created = (data = null, message = '创建成功') => {
    return {
        code: 201,
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    };
};

/**
 * 错误响应
 * @param {string} message - 错误消息
 * @param {number} code - 错误状态码
 * @param {array} errors - 详细错误列表
 * @returns {object} 错误响应对象
 */
const error = (message = '操作失败', code = 500, errors = null) => {
    const response = {
        code,
        success: false,
        message,
        timestamp: new Date().toISOString()
    };
    if (errors) {
        response.errors = errors;
    }
    return response;
};

/**
 * 分页响应
 * @param {array} list - 数据列表
 * @param {object} pagination - 分页信息
 * @param {string} message - 成功消息
 * @returns {object} 分页响应对象
 */
const paginated = (list, pagination, message = '获取成功') => {
    return {
        code: 200,
        success: true,
        message,
        data: list,
        pagination,
        timestamp: new Date().toISOString()
    };
};

module.exports = {
    success,
    created,
    error,
    paginated
};
```

### 4. 模拟数据库

```javascript
// models/database.js
// 模拟数据库 - 在实际项目中应该使用真实的数据库

// 作者数据
const authors = [
    { id: 1, name: '曹雪芹', country: '中国', birthYear: 1715, deathYear: 1763 },
    { id: 2, name: '吴承恩', country: '中国', birthYear: 1500, deathYear: 1582 },
    { id: 3, name: '罗贯中', country: '中国', birthYear: 1330, deathYear: 1400 },
    { id: 4, name: '施耐庵', country: '中国', birthYear: 1296, deathYear: 1370 },
    { id: 5, name: 'J.K.罗琳', country: '英国', birthYear: 1965, deathYear: null }
];

// 书籍数据
const books = [
    { id: 1, title: '红楼梦', authorId: 1, price: 59.00, stock: 100, createdAt: '2024-01-01' },
    { id: 2, title: '西游记', authorId: 2, price: 49.00, stock: 150, createdAt: '2024-01-02' },
    { id: 3, title: '三国演义', authorId: 3, price: 55.00, stock: 80, createdAt: '2024-01-03' },
    { id: 4, title: '水浒传', authorId: 4, price: 65.00, stock: 90, createdAt: '2024-01-04' },
    { id: 5, title: '哈利·波特', authorId: 5, price: 199.00, stock: 200, createdAt: '2024-01-05' }
];

// 借阅记录数据
const borrows = [
    { id: 1, bookId: 1, userId: 1, borrowDate: '2024-01-10', returnDate: '2024-01-20', status: 'returned' },
    { id: 2, bookId: 2, userId: 2, borrowDate: '2024-01-15', returnDate: null, status: 'borrowed' }
];

// 用户数据
const users = [
    { id: 1, username: 'admin', password: '123456', role: 'admin' },
    { id: 2, username: 'user1', password: '123456', role: 'user' }
];

// 导出数据库操作接口
module.exports = {
    authors,
    books,
    borrows,
    users,

    // 作者操作
    author: {
        findAll: () => [...authors],
        findById: (id) => authors.find(a => a.id === parseInt(id)),
        create: (data) => {
            const newAuthor = { id: Date.now(), ...data };
            authors.push(newAuthor);
            return newAuthor;
        },
        update: (id, data) => {
            const index = authors.findIndex(a => a.id === parseInt(id));
            if (index === -1) return null;
            authors[index] = { ...authors[index], ...data };
            return authors[index];
        },
        delete: (id) => {
            const index = authors.findIndex(a => a.id === parseInt(id));
            if (index === -1) return false;
            authors.splice(index, 1);
            return true;
        }
    },

    // 书籍操作
    book: {
        findAll: () => [...books],
        findById: (id) => books.find(b => b.id === parseInt(id)),
        findByAuthor: (authorId) => books.filter(b => b.authorId === parseInt(authorId)),
        create: (data) => {
            const newBook = { id: Date.now(), ...data, createdAt: new Date().toISOString() };
            books.push(newBook);
            return newBook;
        },
        update: (id, data) => {
            const index = books.findIndex(b => b.id === parseInt(id));
            if (index === -1) return null;
            books[index] = { ...books[index], ...data };
            return books[index];
        },
        delete: (id) => {
            const index = books.findIndex(b => b.id === parseInt(id));
            if (index === -1) return false;
            books.splice(index, 1);
            return true;
        },
        updateStock: (id, change) => {
            const book = books.find(b => b.id === parseInt(id));
            if (!book) return null;
            book.stock += change;
            return book;
        }
    },

    // 借阅操作
    borrow: {
        findAll: () => [...borrows],
        findById: (id) => borrows.find(b => b.id === parseInt(id)),
        findByUser: (userId) => borrows.filter(b => b.userId === parseInt(userId)),
        findByBook: (bookId) => borrows.filter(b => b.bookId === parseInt(bookId)),
        create: (data) => {
            const newBorrow = {
                id: Date.now(),
                ...data,
                borrowDate: new Date().toISOString().split('T')[0],
                returnDate: null,
                status: 'borrowed'
            };
            borrows.push(newBorrow);
            return newBorrow;
        },
        return: (id) => {
            const borrow = borrows.find(b => b.id === parseInt(id));
            if (!borrow) return null;
            borrow.status = 'returned';
            borrow.returnDate = new Date().toISOString().split('T')[0];
            return borrow;
        }
    },

    // 用户操作
    user: {
        findByUsername: (username) => users.find(u => u.username === username),
        findById: (id) => users.find(u => u.id === parseInt(id))
    }
};
```

### 5. 错误处理中间件

```javascript
// middlewares/errorHandler.js
// 统一错误处理中间件

const { error } = require('../utils/response');

// ApiError类
class ApiError extends Error {
    constructor(code, message, errors = null) {
        super(message);
        this.code = code;
        this.errors = errors;
        this.name = 'ApiError';
    }
}

// 错误处理中间件
const errorHandler = (err, req, res, next) => {
    console.error('=== 错误发生 ===');
    console.error('时间：', new Date().toISOString());
    console.error('请求：', req.method, req.url);
    console.error('错误：', err.message);
    console.error('堆栈：', err.stack);
    console.error('==============');

    // 处理ApiError
    if (err instanceof ApiError) {
        return res.status(err.code).json(
            error(err.message, err.code, err.errors)
        );
    }

    // 处理JSON解析错误
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json(
            error('JSON格式错误，请检查请求体格式', 400)
        );
    }

    // 处理Joi验证错误
    if (err.isJoi) {
        return res.status(400).json(
            error('数据验证失败', 400, err.details.map(d => d.message))
        );
    }

    // 默认服务器错误
    res.status(500).json(
        error('服务器内部错误，请稍后重试', 500)
    );
};

// 404处理中间件
const notFoundHandler = (req, res) => {
    res.status(404).json(
        error(`接口 ${req.method} ${req.url} 不存在`, 404)
    );
};

module.exports = {
    errorHandler,
    notFoundHandler,
    ApiError
};
```

### 6. 认证中间件

```javascript
// middlewares/auth.js
// 认证和授权中间件

const jwt = require('jsonwebtoken');
const { ApiError } = require('./errorHandler');
const { error } = require('../utils/response');
const db = require('../models/database');

// JWT密钥（生产环境应从环境变量获取）
const JWT_SECRET = process.env.JWT_SECRET || 'my-secret-key-12345';

/**
 * JWT验证中间件
 * 验证请求头中的token
 */
const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new ApiError(401, '未提供认证token');
        }

        const token = authHeader.startsWith('Bearer ')
            ? authHeader.slice(7)
            : authHeader;

        if (!token) {
            throw new ApiError(401, 'token格式错误');
        }

        // 验证token
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if (err instanceof ApiError) {
            return res.status(err.code).json(error(err.message, err.code));
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json(error('token无效', 401));
        }
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json(error('token已过期', 401));
        }
        next(err);
    }
};

/**
 * 生成JWT token
 * @param {object} payload - token载荷（用户信息）
 * @param {string} expiresIn - 过期时间
 * @returns {string} JWT token
 */
const generateToken = (payload, expiresIn = '24h') => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

/**
 * 管理员权限验证中间件
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json(error('请先登录', 401));
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json(error('需要管理员权限', 403));
    }

    next();
};

/**
 * 登录接口（示例）
 */
const login = (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            throw new ApiError(400, '用户名和密码不能为空');
        }

        // 查找用户
        const user = db.user.findByUsername(username);

        if (!user) {
            throw new ApiError(401, '用户名或密码错误');
        }

        // 验证密码（实际项目应使用bcrypt加密）
        if (user.password !== password) {
            throw new ApiError(401, '用户名或密码错误');
        }

        // 生成token
        const token = generateToken({
            id: user.id,
            username: user.username,
            role: user.role
        });

        res.json({
            code: 200,
            success: true,
            message: '登录成功',
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            }
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    verifyToken,
    generateToken,
    requireAdmin,
    login
};
```

### 7. 验证器中间件

```javascript
// middlewares/validator.js
// 数据验证中间件

const Joi = require('joi');
const { ApiError } = require('./errorHandler');

/**
 * 创建验证规则
 */
const schemas = {
    // 书籍验证
    book: {
        create: Joi.object({
            title: Joi.string().required().min(1).max(100).messages({
                'string.empty': '书名不能为空',
                'any.required': '书名是必填项',
                'string.max': '书名不能超过100个字符'
            }),
            authorId: Joi.number().required().integer().positive().messages({
                'number.base': '作者ID必须是数字',
                'any.required': '作者ID是必填项',
                'number.positive': '作者ID必须是正数'
            }),
            price: Joi.number().required().min(0).messages({
                'number.base': '价格必须是数字',
                'any.required': '价格是必填项',
                'number.min': '价格不能为负数'
            }),
            stock: Joi.number().integer().min(0).default(0).messages({
                'number.base': '库存必须是整数',
                'number.min': '库存不能为负数'
            })
        }),
        update: Joi.object({
            title: Joi.string().min(1).max(100),
            authorId: Joi.number().integer().positive(),
            price: Joi.number().min(0),
            stock: Joi.number().integer().min(0)
        }).min(1).messages({
            'object.min': '至少需要提供一个要更新的字段'
        }),
        id: Joi.object({
            id: Joi.number().required().integer().positive().messages({
                'number.base': 'ID必须是数字',
                'any.required': 'ID是必填项',
                'number.positive': 'ID必须是正数'
            })
        })
    },

    // 作者验证
    author: {
        create: Joi.object({
            name: Joi.string().required().min(1).max(50).messages({
                'string.empty': '作者姓名不能为空',
                'any.required': '作者姓名是必填项'
            }),
            country: Joi.string().default('中国'),
            birthYear: Joi.number().integer().min(0).max(new Date().getFullYear()),
            deathYear: Joi.number().integer().min(0).max(new Date().getFullYear()).allow(null)
        }),
        update: Joi.object({
            name: Joi.string().min(1).max(50),
            country: Joi.string(),
            birthYear: Joi.number().integer().min(0).max(new Date().getFullYear()),
            deathYear: Joi.number().integer().min(0).max(new Date().getFullYear()).allow(null)
        }).min(1)
    },

    // 借阅验证
    borrow: {
        create: Joi.object({
            bookId: Joi.number().required().integer().positive().messages({
                'any.required': '书籍ID是必填项'
            }),
            userId: Joi.number().required().integer().positive().messages({
                'any.required': '用户ID是必填项'
            })
        })
    }
};

/**
 * 创建验证中间件
 * @param {string} resource - 资源名称（book, author, borrow）
 * @param {string} type - 验证类型（create, update）
 */
const validate = (resource, type) => {
    return (req, res, next) => {
        const schema = schemas[resource]?.[type];

        if (!schema) {
            return next(new ApiError(500, `未找到 ${resource} 的 ${type} 验证规则`));
        }

        const { error, value } = schema.validate(req.body, {
            abortEarly: false, // 检查所有错误
            stripUnknown: true // 移除未知字段
        });

        if (error) {
            const errors = error.details.map(d => d.message);
            return res.status(400).json({
                code: 400,
                success: false,
                message: '数据验证失败',
                errors
            });
        }

        // 验证通过，将验证后的值保存到req.body
        req.body = value;
        next();
    };
};

module.exports = {
    schemas,
    validate
};
```

### 8. 书籍路由和控制器

```javascript
// routes/books.js
// 书籍路由

const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { verifyToken, requireAdmin } = require('../middlewares/auth');
const { validate } = require('../middlewares/validator');

// 公开路由
router.get('/', bookController.getAllBooks);
router.get('/:id', bookController.getBookById);
router.get('/author/:authorId', bookController.getBooksByAuthor);

// 需要登录的路由
router.post('/', verifyToken, requireAdmin, validate('book', 'create'), bookController.createBook);
router.put('/:id', verifyToken, requireAdmin, validate('book', 'update'), bookController.updateBook);
router.patch('/:id', verifyToken, requireAdmin, validate('book', 'update'), bookController.patchBook);
router.delete('/:id', verifyToken, requireAdmin, bookController.deleteBook);

module.exports = router;
```

```javascript
// controllers/bookController.js
// 书籍控制器

const db = require('../models/database');
const { success, created, error, paginated } = require('../utils/response');

/**
 * 获取所有书籍
 * GET /api/books
 * GET /api/books?page=1&limit=10&sort=price&order=asc
 */
const getAllBooks = (req, res, next) => {
    try {
        // 获取查询参数
        const { page = 1, limit = 10, sort = 'id', order = 'asc', keyword, authorId } = req.query;

        let books = db.book.findAll();

        // 按作者筛选
        if (authorId) {
            books = books.filter(b => b.authorId === parseInt(authorId));
        }

        // 按关键词搜索
        if (keyword) {
            books = books.filter(b =>
                b.title.toLowerCase().includes(keyword.toLowerCase())
            );
        }

        // 排序
        books.sort((a, b) => {
            const aVal = a[sort];
            const bVal = b[sort];
            if (order === 'desc') {
                return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
            }
            return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        });

        // 分页
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const startIndex = (pageNum - 1) * limitNum;
        const paginatedBooks = books.slice(startIndex, startIndex + limitNum);

        // 补充作者信息
        const booksWithAuthor = paginatedBooks.map(book => {
            const author = db.author.findById(book.authorId);
            return {
                ...book,
                authorName: author ? author.name : '未知作者'
            };
        });

        res.json(paginated(booksWithAuthor, {
            page: pageNum,
            limit: limitNum,
            total: books.length,
            totalPages: Math.ceil(books.length / limitNum)
        }));
    } catch (err) {
        next(err);
    }
};

/**
 * 获取单个书籍
 * GET /api/books/:id
 */
const getBookById = (req, res, next) => {
    try {
        const { id } = req.params;
        const book = db.book.findById(id);

        if (!book) {
            return res.status(404).json(error('书籍不存在', 404));
        }

        // 补充作者信息
        const author = db.author.findById(book.authorId);

        res.json(success({
            ...book,
            authorName: author ? author.name : '未知作者'
        }));
    } catch (err) {
        next(err);
    }
};

/**
 * 获取某个作者的所有书籍
 * GET /api/books/author/:authorId
 */
const getBooksByAuthor = (req, res, next) => {
    try {
        const { authorId } = req.params;
        const books = db.book.findByAuthor(authorId);

        res.json(success(books));
    } catch (err) {
        next(err);
    }
};

/**
 * 创建书籍
 * POST /api/books
 */
const createBook = (req, res, next) => {
    try {
        const { title, authorId, price, stock } = req.body;

        // 检查作者是否存在
        const author = db.author.findById(authorId);
        if (!author) {
            return res.status(400).json(error('作者不存在', 400));
        }

        // 创建书籍
        const newBook = db.book.create({
            title,
            authorId,
            price,
            stock: stock || 0
        });

        res.status(201).json(created({
            ...newBook,
            authorName: author.name
        }, '书籍创建成功'));
    } catch (err) {
        next(err);
    }
};

/**
 * 完整更新书籍
 * PUT /api/books/:id
 */
const updateBook = (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, authorId, price, stock } = req.body;

        // 检查书籍是否存在
        const existingBook = db.book.findById(id);
        if (!existingBook) {
            return res.status(404).json(error('书籍不存在', 404));
        }

        // 检查作者是否存在（如果提供了authorId）
        if (authorId) {
            const author = db.author.findById(authorId);
            if (!author) {
                return res.status(400).json(error('作者不存在', 400));
            }
        }

        // 更新书籍
        const updatedBook = db.book.update(id, {
            title: title || existingBook.title,
            authorId: authorId || existingBook.authorId,
            price: price !== undefined ? price : existingBook.price,
            stock: stock !== undefined ? stock : existingBook.stock
        });

        // 补充作者信息
        const author = db.author.findById(updatedBook.authorId);

        res.json(success({
            ...updatedBook,
            authorName: author ? author.name : '未知作者'
        }, '书籍更新成功'));
    } catch (err) {
        next(err);
    }
};

/**
 * 部分更新书籍
 * PATCH /api/books/:id
 */
const patchBook = (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // 检查书籍是否存在
        const existingBook = db.book.findById(id);
        if (!existingBook) {
            return res.status(404).json(error('书籍不存在', 404));
        }

        // 如果更新作者ID，检查作者是否存在
        if (updateData.authorId) {
            const author = db.author.findById(updateData.authorId);
            if (!author) {
                return res.status(400).json(error('作者不存在', 400));
            }
        }

        // 部分更新
        const updatedBook = db.book.update(id, updateData);

        // 补充作者信息
        const author = db.author.findById(updatedBook.authorId);

        res.json(success({
            ...updatedBook,
            authorName: author ? author.name : '未知作者'
        }, '书籍更新成功'));
    } catch (err) {
        next(err);
    }
};

/**
 * 删除书籍
 * DELETE /api/books/:id
 */
const deleteBook = (req, res, next) => {
    try {
        const { id } = req.params;

        // 检查书籍是否存在
        const book = db.book.findById(id);
        if (!book) {
            return res.status(404).json(error('书籍不存在', 404));
        }

        // 删除书籍
        db.book.delete(id);

        res.json(success({ id: parseInt(id) }, '书籍删除成功'));
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAllBooks,
    getBookById,
    getBooksByAuthor,
    createBook,
    updateBook,
    patchBook,
    deleteBook
};
```

### 9. 路由入口

```javascript
// routes/index.js
// 路由入口文件

const express = require('express');
const router = express.Router();

const booksRouter = require('./books');
const authorsRouter = require('./authors');
const borrowRouter = require('./borrow');
const { login } = require('../middlewares/auth');

// 登录接口（公开）
router.post('/login', login);

// 挂载子路由
router.use('/books', booksRouter);
router.use('/authors', authorsRouter);
router.use('/borrows', borrowRouter);

module.exports = router;
```

### 10. 作者和借阅路由（简略版）

```javascript
// routes/authors.js
// 作者路由

const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { success, created, error } = require('../utils/response');
const { verifyToken, requireAdmin } = require('../middlewares/auth');

// 公开路由
router.get('/', (req, res) => {
    const authors = db.author.findAll();
    res.json(success(authors));
});

router.get('/:id', (req, res) => {
    const author = db.author.findById(req.params.id);
    if (!author) {
        return res.status(404).json(error('作者不存在', 404));
    }
    res.json(success(author));
});

// 需要管理员权限
router.post('/', verifyToken, requireAdmin, (req, res, next) => {
    try {
        const { name, country, birthYear, deathYear } = req.body;

        if (!name) {
            return res.status(400).json(error('作者姓名不能为空', 400));
        }

        const newAuthor = db.author.create({ name, country, birthYear, deathYear });
        res.status(201).json(created(newAuthor, '作者创建成功'));
    } catch (err) {
        next(err);
    }
});

router.put('/:id', verifyToken, requireAdmin, (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, country, birthYear, deathYear } = req.body;

        const existing = db.author.findById(id);
        if (!existing) {
            return res.status(404).json(error('作者不存在', 404));
        }

        const updated = db.author.update(id, { name, country, birthYear, deathYear });
        res.json(success(updated, '作者更新成功'));
    } catch (err) {
        next(err);
    }
});

router.delete('/:id', verifyToken, requireAdmin, (req, res, next) => {
    try {
        const { id } = req.params;

        if (!db.author.findById(id)) {
            return res.status(404).json(error('作者不存在', 404));
        }

        db.author.delete(id);
        res.json(success({ id: parseInt(id) }, '作者删除成功'));
    } catch (err) {
        next(err);
    }
});

module.exports = router;
```

```javascript
// routes/borrow.js
// 借阅路由

const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { success, created, error } = require('../utils/response');
const { verifyToken } = require('../middlewares/auth');

// 所有借阅接口都需要登录
router.use(verifyToken);

// 获取所有借阅记录
router.get('/', (req, res) => {
    const borrows = db.borrow.findAll();
    // 补充书籍和用户信息
    const enrichedBorrows = borrows.map(borrow => {
        const book = db.book.findById(borrow.bookId);
        const user = db.user.findById(borrow.userId);
        return {
            ...borrow,
            bookTitle: book ? book.title : '未知书籍',
            username: user ? user.username : '未知用户'
        };
    });
    res.json(success(enrichedBorrows));
});

// 借书
router.post('/', (req, res, next) => {
    try {
        const { bookId, userId } = req.body;

        if (!bookId || !userId) {
            return res.status(400).json(error('书籍ID和用户ID不能为空', 400));
        }

        // 检查书籍是否存在且有库存
        const book = db.book.findById(bookId);
        if (!book) {
            return res.status(404).json(error('书籍不存在', 404));
        }
        if (book.stock <= 0) {
            return res.status(400).json(error('库存不足', 400));
        }

        // 检查用户是否存在
        const user = db.user.findById(userId);
        if (!user) {
            return res.status(404).json(error('用户不存在', 404));
        }

        // 创建借阅记录
        const newBorrow = db.borrow.create({ bookId, userId });

        // 减少库存
        db.book.updateStock(bookId, -1);

        res.status(201).json(created(newBorrow, '借书成功'));
    } catch (err) {
        next(err);
    }
});

// 还书
router.patch('/:id/return', (req, res, next) => {
    try {
        const { id } = req.params;

        const borrow = db.borrow.findById(id);
        if (!borrow) {
            return res.status(404).json(error('借阅记录不存在', 404));
        }
        if (borrow.status === 'returned') {
            return res.status(400).json(error('该书已归还', 400));
        }

        // 还书
        const returnedBorrow = db.borrow.return(id);

        // 增加库存
        db.book.updateStock(borrow.bookId, 1);

        res.json(success(returnedBorrow, '还书成功'));
    } catch (err) {
        next(err);
    }
});

module.exports = router;
```

---

## 用curl测试API

### curl基础介绍

curl是一个命令行工具，用于发送HTTP请求。在Windows、Mac、Linux都可以使用，是测试API的利器。

### 基础curl命令

```bash
# 1. GET请求 - 获取数据
# 获取所有书籍
curl http://localhost:3000/api/books

# 2. GET请求 - 带查询参数
# 分页获取书籍
curl "http://localhost:3000/api/books?page=1&limit=2"

# 3. GET请求 - 获取单个资源
# 获取ID为1的书籍
curl http://localhost:3000/api/books/1

# 4. POST请求 - 创建数据
# 创建新书籍
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{"title":"聊斋志异","authorId":1,"price":45}'

# 5. PUT请求 - 完整更新
# 完整更新ID为1的书籍
curl -X PUT http://localhost:3000/api/books/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"红楼梦（珍藏版）","authorId":1,"price":99}'

# 6. PATCH请求 - 部分更新
# 只更新价格
curl -X PATCH http://localhost:3000/api/books/1 \
  -H "Content-Type: application/json" \
  -d '{"price":79}'

# 7. DELETE请求 - 删除数据
# 删除ID为1的书籍
curl -X DELETE http://localhost:3000/api/books/1
```

### 完整curl测试脚本

```bash
#!/bin/bash
# test_api.sh - API测试脚本

BASE_URL="http://localhost:3000/api"

echo "=========================================="
echo "   图书管理系统API测试"
echo "=========================================="

# 1. 健康检查
echo ""
echo "1. 健康检查"
echo "-------------------------------------------"
curl -s http://localhost:3000/health | jq .

# 2. 登录获取token
echo ""
echo "2. 登录获取Token"
echo "-------------------------------------------"
TOKEN=$(curl -s -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}' | jq -r '.data.token')
echo "获取到Token: ${TOKEN:0:20}..."

# 3. 获取所有书籍
echo ""
echo "3. 获取所有书籍"
echo "-------------------------------------------"
curl -s http://localhost:3000/api/books | jq .

# 4. 获取单个书籍
echo ""
echo "4. 获取ID为1的书籍"
echo "-------------------------------------------"
curl -s http://localhost:3000/api/books/1 | jq .

# 5. 搜索书籍
echo ""
echo "5. 搜索包含'红'字的书籍"
echo "-------------------------------------------"
curl -s "http://localhost:3000/api/books?keyword=红" | jq .

# 6. 获取所有作者
echo ""
echo "6. 获取所有作者"
echo "-------------------------------------------"
curl -s http://localhost:3000/api/authors | jq .

# 7. 创建新书籍（需要Token）
echo ""
echo "7. 创建新书籍（带Token）"
echo "-------------------------------------------"
curl -s -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"三体","authorId":5,"price":88}' | jq .

# 8. 更新书籍（需要Token）
echo ""
echo "8. 更新书籍价格（带Token）"
echo "-------------------------------------------"
curl -s -X PATCH http://localhost:3000/api/books/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"price":69}' | jq .

# 9. 获取所有借阅记录
echo ""
echo "9. 获取所有借阅记录（需要Token）"
echo "-------------------------------------------"
curl -s http://localhost:3000/api/borrows \
  -H "Authorization: Bearer $TOKEN" | jq .

# 10. 借书
echo ""
echo "10. 借书测试"
echo "-------------------------------------------"
curl -s -X POST http://localhost:3000/api/borrows \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"bookId":2,"userId":2}' | jq .

echo ""
echo "=========================================="
echo "   测试完成"
echo "=========================================="
```

### Windows批处理版本

```batch
@echo off
REM test_api.bat - Windows API测试脚本

set BASE_URL=http://localhost:3000/api

echo ==========================================
echo    图书管理系统API测试
echo ==========================================

echo.
echo 1. 健康检查
echo -------------------------------------------
curl http://localhost:3000/health

echo.
echo 2. 登录获取Token
echo -------------------------------------------
curl -X POST %BASE_URL%/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"123456\"}"

echo.
echo 3. 获取所有书籍
echo -------------------------------------------
curl %BASE_URL%/books

echo.
echo 4. 获取单个书籍
echo -------------------------------------------
curl %BASE_URL%/books/1

echo.
echo 5. 创建新书籍
echo -------------------------------------------
curl -X POST %BASE_URL%/books -H "Content-Type: application/json" -d "{\"title\":\"三体\",\"authorId\":5,\"price\":88}"

echo.
echo ==========================================
echo    测试完成
echo ==========================================

pause
```

---

## 用Postman测试API

### Postman简介

Postman是一款强大的API测试工具，提供图形界面，支持保存请求、管理环境、批量测试等功能。

### Postman基础使用

#### 1. 创建Collection（集合）

1. 点击左侧"Collections"旁边的"+"或右键"Collections" → "Create Collection"
2. 命名为"图书管理系统API"
3. 这个集合将存放所有图书管理相关的请求

#### 2. 创建请求

**请求1：健康检查**

```
方法：GET
URL：http://localhost:3000/health
```

1. 点击Collection右键 → "Add Request"
2. 命名为"01-健康检查"
3. 方法选择：GET
4. URL输入：`http://localhost:3000/health`
5. 点击"Send"按钮
6. 查看底部响应区域

**请求2：登录**

```
方法：POST
URL：http://localhost:3000/api/login
Headers：
  - Content-Type: application/json
Body（raw, JSON）：
{
    "username": "admin",
    "password": "123456"
}
```

1. 创建新请求"02-登录"
2. 方法选择：POST
3. 点击"Headers"标签，添加：
   - Key: `Content-Type`
   - Value: `application/json`
4. 点击"Body"标签
5. 选择"raw"并设置类型为"JSON"
6. 输入JSON数据
7. 点击"Send"

**请求3：获取所有书籍（无认证）**

```
方法：GET
URL：http://localhost:3000/api/books
```

**请求4：获取单个书籍**

```
方法：GET
URL：http://localhost:3000/api/books/1
```

**请求5：创建书籍（需要认证）**

```
方法：POST
URL：http://localhost:3000/api/books
Headers：
  - Content-Type: application/json
  - Authorization: Bearer {{token}}
Body（raw, JSON）：
{
    "title": "三体",
    "authorId": 5,
    "price": 88
}
```

#### 3. 使用Environment（环境变量）

1. 点击右上角"Environments"图标（齿轮图标）
2. 点击"Add"创建新环境
3. 命名："开发环境"
4. 添加变量：
   - `baseUrl`: `http://localhost:3000`
   - `token`: （留空，稍后登录后获取）
5. 点击"Save"

**在请求中使用环境变量：**

```
URL：{{baseUrl}}/api/books
Authorization: Bearer {{token}}
```

#### 4. 使用Collection Runner批量测试

1. 选择Collection
2. 点击"Runner"按钮
3. 选择环境和迭代次数
4. 点击"Run 图书管理系统API"

### Postman测试场景

#### 场景1：完整的CRUD测试流程

```
1. POST /api/login
   → 保存token到环境变量

2. GET /api/books
   → 获取当前书籍列表

3. POST /api/books
   → 创建新书籍，保存书籍ID

4. GET /api/books/{id}
   → 获取新创建的书籍

5. PATCH /api/books/{id}
   → 更新书籍价格

6. DELETE /api/books/{id}
   → 删除书籍

7. GET /api/books/{id}
   → 确认书籍已删除（返回404）
```

#### 场景2：借书还书流程

```
1. POST /api/login（user1用户）
   → 保存token

2. GET /api/books?stock=true
   → 查看有库存的书籍

3. POST /api/borrows
   → 借书

4. GET /api/borrows
   → 查看我的借阅记录

5. PATCH /api/borrows/{id}/return
   → 还书
```

### Postman脚本示例

#### 登录后自动保存Token

1. 在登录请求的"Tests"标签中添加：

```javascript
// Tests脚本
if (pm.response.code === 200) {
    // 解析响应JSON
    const responseJson = pm.response.json();

    // 检查响应是否包含token
    if (responseJson.data && responseJson.data.token) {
        // 保存token到环境变量
        pm.environment.set("token", responseJson.data.token);
        console.log("Token已保存: " + responseJson.data.token);
    }
}
```

#### 检查响应状态

```javascript
// 检查状态码是否为200
pm.test("状态码是200", function() {
    pm.response.to.have.status(200);
});

// 检查响应时间
pm.test("响应时间小于500ms", function() {
    pm.expect(pm.response.responseTime).to.be.below(500);
});

// 检查返回数据结构
pm.test("返回数据包含必要字段", function() {
    const responseData = pm.response.json();
    pm.expect(responseData).to.have.property('code');
    pm.expect(responseData).to.have.property('success');
    pm.expect(responseData).to.have.property('data');
});
```

#### 在后续请求中自动添加Token

在需要认证的请求的"Pre-request Script"中添加：

```javascript
// Pre-request Script
const token = pm.environment.get("token");
if (token) {
    pm.request.headers.add({
        key: "Authorization",
        value: "Bearer " + token
    });
}
```

---

## 最佳实践与总结

### API设计最佳实践

#### 1. URL设计规范

```
✅ 好的URL设计
/api/books                 — 复数名词
/api/books/1              — 资源嵌套
/api/books/1/chapters     — 嵌套资源
/users/5/orders            — 用户5的订单

❌ 不好的URL设计
/api/getBooks             — 使用动词
/api/book                 — 单数名词
/api/getUser?id=5          — 使用查询参数代替路径
```

#### 2. HTTP状态码使用

| 状态码 | 使用场景 |
|-------|---------|
| 200 | GET/PUT/PATCH/DELETE成功 |
| 201 | POST创建资源成功 |
| 400 | 请求参数错误、验证失败 |
| 401 | 未登录、未认证 |
| 403 | 已登录但没有权限 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

#### 3. 统一响应格式

```javascript
// 成功响应
{
    code: 200,
    success: true,
    message: '操作成功',
    data: { ... },
    timestamp: '2024-01-15T10:30:00.000Z'
}

// 错误响应
{
    code: 400,
    success: false,
    message: '数据验证失败',
    errors: ['书名不能为空', '价格必须是正数'],
    timestamp: '2024-01-15T10:30:00.000Z'
}
```

#### 4. 安全性考虑

```javascript
// 1. 使用HTTPS
// 生产环境必须使用HTTPS

// 2. 限流
const rateLimit = require('express-rate-limit');
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100 // 最多100次请求
}));

// 3. 验证所有输入
const Joi = require('joi');
const schema = Joi.object({
    title: Joi.string().required().max(100),
    price: Joi.number().required().min(0)
});

// 4. 隐藏敏感信息
// 不要在错误响应中暴露服务器内部信息
res.status(500).json({
    message: '服务器内部错误' // 不要写具体错误
});

// 5. 使用安全的Headers
const helmet = require('helmet');
app.use(helmet());
```

### 错误处理最佳实践

```javascript
// 1. 始终返回一致的错误格式
// 2. 使用适当的HTTP状态码
// 3. 不要在生产环境暴露敏感错误信息
// 4. 记录错误日志
// 5. 提供有意义的错误消息给客户端

// 错误处理中间件示例
app.use((err, req, res, next) => {
    // 记录日志
    logger.error({
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
    });

    // 判断是否为开发环境
    const isDev = process.env.NODE_ENV === 'development';

    res.status(err.status || 500).json({
        code: err.status || 500,
        success: false,
        message: isDev ? err.message : '服务器内部错误',
        // 生产环境可以额外添加错误ID，方便排查
        errorId: isDev ? undefined : generateErrorId()
    });
});
```

### 性能优化建议

```javascript
// 1. 启用压缩
const compression = require('compression');
app.use(compression());

// 2. 使用缓存
app.get('/api/static-data', cache('1 hour'), (req, res) => {
    res.json(staticData);
});

// 3. 分页获取大数据
app.get('/api/books', async (req, res) => {
    const { page = 1, limit = 100 } = req.query;

    // 限制每页最大数量
    const safeLimit = Math.min(parseInt(limit), 1000);

    const books = await Book.find()
        .skip((page - 1) * safeLimit)
        .limit(safeLimit);

    res.json({ books, page, limit: safeLimit });
});

// 4. 索引优化（数据库层面）
// 确保常用查询字段有索引
```

### 学习建议

1. **理解HTTP协议基础**：状态码、请求方法、Headers
2. **多动手实践**：自己搭建API，用curl/Postman测试
3. **阅读源码**：学习Express/Koa框架源码
4. **理解设计原则**：RESTful、无状态、分层架构
5. **关注安全性**：认证、授权、输入验证
6. **性能意识**：分页、缓存、限流

### 下一步学习

- NestJS框架深入学习
- 数据库设计与优化
- 身份认证与授权（JWT、OAuth）
- API文档生成（Swagger）
- 微服务架构入门

---

**文档信息**

| 项目 | 内容 |
|------|------|
| 编写时间 | 2024年1月 |
| 适用人群 | 前端开发者、Node.js初学者、全栈开发者 |
| 前置知识 | JavaScript基础、HTTP协议基本概念 |
| 学习时长 | 约8-10小时（理论+实践） |
