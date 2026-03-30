# 第2卷-框架生态

---

## 第3章 Node与BFF

---

### 3.1 BFF定义与优势详解

**面试常问题目**:
BFF（Backend For Frontend）模式是微服务架构中的一种前端适配层，它为每种前端类型提供定制化的后端服务。

#### 3.1.1 传统架构vsBFF架构

```javascript
// 传统架构示例
// 前端需要调用多个后端接口

// 场景：获取用户详情页数据
// 前端代码
async function fetchUserPageData(userId) {
  // 需要调用 5 个接口
  const user = await axios.get(`/api/users/${userId}`);
  const posts = await axios.get(`/api/users/${userId}/posts`);
  const followers = await axios.get(`/api/users/${userId}/followers`);
  const settings = await axios.get(`/api/users/${userId}/settings`);
  const notifications = await axios.get(`/api/notifications?userId=${userId}`);

  // 等待所有请求完成
  const [userRes, postsRes, followersRes, settingsRes, notificationsRes] =
    await Promise.all([
      user, posts, followers, settings, notifications
    ]);

  return {
    user: userRes.data,
    posts: postsRes.data,
    followers: followersRes.data,
    settings: settingsRes.data,
    notifications: notificationsRes.data
  };
}

// BFF 架构示例
// BFF 层聚合所有接口

// BFF 服务端代码
app.get('/api/bff/user-page/:userId', async (req, res) => {
  const { userId } = req.params;

  // 并行调用后端服务
  const [user, posts, followers, settings, notifications] = await Promise.all([
    userService.getUser(userId),
    postService.getUserPosts(userId),
    socialService.getFollowers(userId),
    userService.getSettings(userId),
    notificationService.getUserNotifications(userId)
  ]);

  // 按前端需求聚合数据
  res.json({
    user: {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      bio: user.bio
    },
    posts: posts.map(p => ({
      id: p.id,
      title: p.title,
      preview: p.content.substring(0, 100)
    })),
    followers: {
      count: followers.length,
      avatars: followers.slice(0, 5).map(f => f.avatar)
    },
    settings: settings.theme,
    notifications: {
      unread: notifications.filter(n => !n.read).length,
      latest: notifications.slice(0, 3)
    }
  });
});

// 前端代码 - 简单多了
async function fetchUserPageData(userId) {
  const response = await axios.get(`/api/bff/user-page/${userId}`);
  return response.data;
}
```

#### 3.1.2 BFF 的核心优势详解

```javascript
// 1. 减少网络请求
// 对比分析
const WITHOUT_BFF = {
  requests: 5, // 需要 5 个请求
  latency: 300, // 假设每个请求 300ms，串行需要 1500ms
  bandwidth: '500KB' // 每次传输冗余数据
};

const WITH_BFF = {
  requests: 1, // 只需 1 个请求
  latency: 400, // 聚合请求 400ms
  bandwidth: '80KB' // 只传输需要的数据
};

// 2. 保护前端免受后端变化影响
// 后端 API 变更时，只需修改 BFF 层

// 场景：后端将用户名称字段从 name 改为 fullName
// BFF 层处理
app.get('/api/bff/user/:id', async (req, res) => {
  const user = await userService.getUser(req.params.id);

  // BFF 层统一字段名
  res.json({
    name: user.fullName || user.name, // 兼容新旧字段
    // 其他字段处理...
  });
});

// 前端无感知，继续使用 name 字段

// 3. 接口定制化
// 不同端返回不同数据

// Web 端 - 返回完整数据
app.get('/api/bff/products/web', async (req, res) => {
  const products = await productService.getProducts();

  res.json({
    items: products.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description, // Web 端需要详细描述
      price: p.price,
      images: p.images,
      details: p.details
    }))
  });
});

// Mobile 端 - 返回精简数据
app.get('/api/bff/products/mobile', async (req, res) => {
  const products = await productService.getProducts();

  res.json({
    items: products.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      thumbnail: p.images[0] // Mobile 端只需缩略图
    }))
  });
});

// 4. 服务端渲染支持
// BFF 层可以做 SSR
```

### 3.2 BFF 技术选型

**面试常问题目**:
BFF 层的技术选型需要考虑多个因素，包括团队技术栈、性能要求、可维护性等。

#### 3.2.1 框架选型对比

```javascript
// 1. Express.js
// 优点：轻量、灵活、生态丰富
// 缺点：缺乏结构化、TypeScript 支持一般

const express = require('express');
const app = express();

app.get('/api/bff/user/:id', async (req, res) => {
  const user = await userService.getUser(req.params.id);
  res.json(user);
});

app.listen(3000);

// 2. Koa.js
// 优点：更轻量、async/await 原生支持、中间件机制优雅
// 缺点：需要自行组合中间件

const Koa = require('koa');
const Router = require('@koa/router');

const app = new Koa();
const router = new Router();

router.get('/api/bff/user/:id', async (ctx) => {
  const user = await userService.getUser(ctx.params.id);
  ctx.body = user;
});

app.use(router.routes());
app.listen(3000);

// 3. NestJS
// 优点：企业级、TypeScript、依赖注入、模块化
// 缺点：学习曲线较陡

// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();

// user.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('api/bff/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.userService.getUser(id);
  }
}

// 4. Fastify
// 优点：性能极高、Schema 验证、插件系统
// 缺点：生态相对较小

const fastify = require('fastify')({ logger: true });

fastify.get('/api/bff/user/:id', async (request, reply) => {
  const user = await userService.getUser(request.params.id);
  return user;
});

fastify.listen(3000);
```

#### 3.2.2 TypeScript 在 BFF 中的重要性

```typescript
// TypeScript 类型定义示例

// 1. 接口定义
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Post {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: Date;
}

// 2. BFF 聚合类型
interface BFFUserPageResponse {
  user: {
    id: User['id'];
    name: User['name'];
    avatar: User['avatar'];
  };
  posts: Array<{
    id: Post['id'];
    title: Post['title'];
    preview: string;
  }>;
  totalPosts: number;
}

// 3. 服务层接口
interface UserService {
  getUser(id: string): Promise<User>;
  getUserPosts(userId: string): Promise<Post[]>;
}

// 4. 泛型使用
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

async function fetchUser(id: string): Promise<ApiResponse<User>> {
  try {
    const user = await userService.getUser(id);
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### 3.3 服务端渲染 (SSR)

**面试常问题目**:
服务端渲染是 BFF 层的重要功能之一，可以提升首屏加载速度和 SEO 效果。

#### 3.3.1 Next.js SSR 实现

```javascript
// pages/user/[id].js - 服务端渲染页面
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

export async function getServerSideProps(context) {
  const { id } = context.params;

  // 在服务端获取数据
  const [user, posts] = await Promise.all([
    userService.getUser(id),
    postService.getUserPosts(id)
  ]);

  return {
    props: {
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar
      },
      posts: posts.map(p => ({
        id: p.id,
        title: p.title,
        preview: p.content.substring(0, 100)
      }))
    }
  };
}

export default function UserPage({ user, posts }) {
  return (
    <div>
      <h1>{user.name}</h1>
      <img src={user.avatar} alt={user.name} />
      <ul>
        {posts.map(post => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}

// API 路由 - BFF 接口
// pages/api/bff/user/[id].js
export default async function handler(req, res) {
  const { id } = req.query;

  const [user, posts, followers] = await Promise.all([
    userService.getUser(id),
    postService.getUserPosts(id),
    socialService.getFollowers(id)
  ]);

  res.status(200).json({
    user: {
      id: user.id,
      name: user.name,
      avatar: user.avatar
    },
    posts,
    followers
  });
}
```

#### 3.3.2 自定义 SSR 实现

```javascript
// 自定义 SSR 服务 (使用 Express + React)
const express = require('express');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const App = require('./App').default;

const app = express();

// 服务端渲染路由
app.get('/ssr/user/:id', async (req, res) => {
  const { id } = req.params;

  // 获取数据
  const user = await userService.getUser(id);
  const posts = await postService.getUserPosts(id);

  // 创建初始状态
  const initialState = {
    user,
    posts
  };

  // 服务端渲染 React 组件
  const html = ReactDOMServer.renderToString(
    React.createElement(App, { initialState })
  );

  // 返回完整 HTML
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${user.name} - 用户主页</title>
      <meta name="description" content="${user.bio || ''}">
    </head>
    <body>
      <div id="root">${html}</div>
      <script>
        window.__INITIAL_STATE__ = ${JSON.stringify(initialState)}
      </script>
      <script src="/bundle.js"></script>
    </body>
    </html>
  `);
});

// 静态资源
app.use(express.static('public'));
```

#### 3.3.3 SSR 性能优化

```javascript
// 1. 缓存策略
const cache = new Map();

async function ssrWithCache(req, res, next) {
  const cacheKey = req.originalUrl;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 60000) {
    return res.send(cached.html);
  }

  const html = await renderToString(req, res);

  cache.set(cacheKey, {
    html,
    timestamp: Date.now()
  });

  res.send(html);
}

// 2. 流式渲染
import { renderToPipeableStream } from 'react-dom/server';

app.get('/stream/:id', async (req, res) => {
  res.setHeader('Content-Type', 'text/html');

  const { pipe } = renderToPipeableStream(
    <App userId={req.params.id} />,
    {
      onShellReady() {
        // 流开始可以发送
        res.statusCode = 200;
        pipe(res);
      },
      onShellError() {
        res.statusCode = 500;
        res.end('Error');
      },
      onAllReady() {
        // 所有内容准备完毕
      }
    }
  );
});

// 3. 选择性水合
// 只对关键交互元素进行水合
```

### 3.4 接口聚合

**面试常问题目**:
接口聚合是 BFF 的核心功能之一，需要高效地组合多个后端服务的数据。

#### 3.4.1 基础接口聚合

```javascript
// 1. 简单聚合
app.get('/api/bff/dashboard', async (req, res) => {
  const userId = req.user.id;

  const [user, notifications, stats] = await Promise.all([
    userService.getUser(userId),
    notificationService.getUnread(userId),
    statsService.getUserStats(userId)
  ]);

  res.json({
    user: {
      name: user.name,
      avatar: user.avatar
    },
    notifications: notifications.slice(0, 5),
    stats: {
      posts: stats.postCount,
      followers: stats.followerCount,
      views: stats.totalViews
    }
  });
});

// 2. 条件聚合
app.get('/api/bff/products/:category', async (req, res) => {
  const { category } = req.params;
  const { sort, page, limit } = req.query;

  const [products, categories] = await Promise.all([
    productService.getProducts({ category, sort, page: +page, limit: +limit }),
    categoryService.getCategories()
  ]);

  res.json({
    products: products.items,
    pagination: {
      page: +page,
      limit: +limit,
      total: products.total
    },
    categories
  });
});

// 3. 嵌套依赖聚合
app.get('/api/bff/order/:id', async (req, res) => {
  const { id } = req.params;

  // 先获取订单
  const order = await orderService.getOrder(id);

  // 再根据订单获取详情
  const [items, address, invoice] = await Promise.all([
    orderItemService.getOrderItems(order.id),
    addressService.getAddress(order.addressId),
    invoiceService.getInvoice(order.invoiceId)
  ]);

  res.json({
    order: {
      id: order.id,
      status: order.status,
      total: order.total,
      createdAt: order.createdAt
    },
    items: items.map(item => ({
      productId: item.productId,
      name: item.productName,
      price: item.price,
      quantity: item.quantity
    })),
    address,
    invoice
  });
});
```

#### 3.4.2 错误处理与降级

```javascript
// 接口聚合中的错误处理

app.get('/api/bff/robust-dashboard', async (req, res) => {
  const userId = req.user.id;

  // 使用 Promise.allSettled 处理部分失败
  const results = await Promise.allSettled([
    userService.getUser(userId),
    notificationService.getUnread(userId),
    statsService.getUserStats(userId),
    recommendationService.getRecommendations(userId)
  ]);

  // 提取成功的结果
  const user = results[0].status === 'fulfilled' ? results[0].value : null;
  const notifications = results[1].status === 'fulfilled' ? results[1].value : [];
  const stats = results[2].status === 'fulfilled' ? results[2].value : {};
  const recommendations = results[3].status === 'fulfilled' ? results[3].value : [];

  // 如果关键服务失败，返回错误
  if (!user) {
    return res.status(503).json({
      error: 'Service temporarily unavailable',
      message: '核心服务暂时不可用'
    });
  }

  // 部分数据可以使用缓存或默认值
  res.json({
    user: {
      name: user.name,
      avatar: user.avatar
    },
    notifications: notifications.slice(0, 5),
    stats: {
      posts: stats.postCount || 0,
      followers: stats.followerCount || 0
    },
    recommendations,
    warnings: results
      .filter(r => r.status === 'rejected')
      .map((r, i) => ['通知', '统计', '推荐'][i])
  });
});
```

### 3.5 鉴权方案

**面试常问题目**:
BFF 层的鉴权方案需要考虑安全性、用户体验和后端服务集成。

#### 3.5.1 JWT 鉴权

```javascript
// JWT 生成与验证
const jwt = require('jsonwebtoken');

// 生成 Token
function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
}

// 验证 Token
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// 中间件
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.user = decoded;
  next();
}

// BFF 层使用
app.get('/api/bff/user/profile', authMiddleware, async (req, res) => {
  const user = await userService.getUser(req.user.id);

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar
  });
});
```

#### 3.5.2 Session 鉴权

```javascript
// Session 鉴权
const session = require('express-session');
const RedisStore = require('connect-redis').default;

app.use(session({
  store: new RedisStore({
    client: redisClient
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // HTTPS only
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// 登录
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await authService.verify(email, password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  req.session.userId = user.id;
  req.session.role = user.role;

  res.json({ success: true });
});

// 登出
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// 验证 Session
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}
```

#### 3.5.3 OAuth 2.0 集成

```javascript
// OAuth 2.0 第三方登录

const axios = require('axios');

// 1. 授权码模式
app.get('/auth/github', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = encodeURIComponent(process.env.GITHUB_CALLBACK_URL);

  res.redirect(
    `https://github.com/login/oauth/authorize?` +
    `client_id=${clientId}&` +
    `redirect_uri=${redirectUri}&` +
    `scope=read:user`
  );
});

app.get('/auth/github/callback', async (req, res) => {
  const { code } = req.query;

  // 交换访问令牌
  const tokenResponse = await axios.post(
    'https://github.com/login/oauth/access_token',
    {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code
    },
    { headers: { Accept: 'application/json' } }
  );

  const accessToken = tokenResponse.data.access_token;

  // 获取用户信息
  const userResponse = await axios.get(
    'https://api.github.com/user',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  // 创建或更新用户
  const user = await userService.upsertFromGitHub(userResponse.data);

  // 生成应用 Token
  const token = generateToken(user);

  // 返回给前端
  res.redirect(`/callback?token=${token}`);
});

// 2. BFF 层代理 OAuth
app.post('/api/bff/oauth/token', async (req, res) => {
  const { provider, code } = req.body;

  const tokenData = await oauthService.exchangeCode(provider, code);

  res.json(tokenData);
});
```

---

### 3.6 BFF vs API Gateway

**面试常问题目**:
BFF 和 API Gateway 都是微服务架构中的重要组件，但它们的职责和使用场景有所不同。理解两者的区别是架构设计面试中的常见问题。

#### 3.6.1 核心区别对比

| 特性 | BFF | API Gateway |
|------|-----|-------------|
| 层级位置 | 前端与后端之间 | 客户端与微服务之间 |
| 职责 | 适配前端需求，接口聚合 | 统一入口，请求路由 |
| 粒度 | 按前端类型（Web/Mobile） | 统一网关 |
| 业务逻辑 | 包含业务数据转换 | 仅路由和通用处理 |
| 典型功能 | 字段裁剪、数据聚合 | 限流、鉴权、协议转换 |

```javascript
// BFF 示例：针对前端类型的数据适配
app.get('/api/bff/products', async (req, res) => {
  const products = await productService.getProducts();

  // 根据客户端类型返回不同数据
  const clientType = req.headers['x-client-type'];

  if (clientType === 'mobile') {
    // Mobile 端返回精简数据
    res.json(products.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      thumbnail: p.images[0]
    })));
  } else {
    // Web 端返回完整数据
    res.json(products);
  }
});

// API Gateway 示例：统一入口和路由
// 使用 Kong、Nginx、Express Gateway 等实现
app.all('/api/gateway/:service/*', async (req, res) => {
  const service = req.params.service;
  const path = req.params[0];

  // 统一限流
  await rateLimiter.check(req.ip);

  // 统一鉴权
  const token = req.headers.authorization;
  const user = await authService.verify(token);
  req.user = user;

  // 路由转发
  const targetService = serviceRoutes[service];
  const response = await http.request({
    method: req.method,
    url: `${targetService}/${path}`,
    body: req.body,
    headers: { ...req.headers, 'x-user-id': user.id }
  });

  res.status(response.status).json(response.body);
});
```

#### 3.6.2 两者结合使用

```javascript
// BFF + API Gateway 架构

//                    ┏━━━━━━━━━━━━━┓                
//                    ┃   Browser   ┃                
//                    ┗━━━━━━┳━━━━━━┛                
//                           ┃                       
//                    ┏━━━━━━▼━━━━━━┓                
//                    ┃ API Gateway ┃  (Nginx / Kong)
//                    ┃ - 限流      ┃                
//                    ┃ - 鉴权      ┃                
//                    ┃ - 路由      ┃                
//                    ┗━━━━━━┳━━━━━━┛                
//                           ┃                       
//         ┏━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━━┓     
//         ┃                 ┃                 ┃     
//    ┏━━━━▼━━━━┓      ┏━━━━▼━━━━┓      ┏━━━━▼━━━━┓  
//    ┃  BFF   ┃      ┃  BFF   ┃      ┃  BFF   ┃     
//    ┃  Web   ┃      ┃ Mobile  ┃      ┃  Mini   ┃   
//    ┗━━━━┳━━━━┛      ┗━━━━┳━━━━┛      ┗━━━━┳━━━━┛  
//         ┃                 ┃                 ┃     
//         ┗━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━━┛     
//                           ┃                       
//                    ┏━━━━━━▼━━━━━━┓                
//                    ┃  微服务集群  ┃               
//                    ┃ - User      ┃                
//                    ┃ - Order     ┃                
//                    ┃ - Product   ┃                
//                    ┗━━━━━━━━━━━━━┛                
```

#### 3.6.3 何时选择 BFF vs API Gateway

```javascript
// 选择建议

// 使用 BFF 的场景
// 1. 多个前端应用需要不同格式的数据
// 2. 需要进行复杂的数据聚合和转换
// 3. 前端需要个性化的接口设计
// 4. 需要针对不同端做性能优化

// 使用 API Gateway 的场景
// 1. 统一的鉴权、限流需求
// 2. 服务路由和负载均衡
// 3. 协议转换 (REST -> GraphQL)
// 4. 统一的日志和监控

// 最佳实践: 两者结合使用
// API Gateway 处理通用逻辑，BFF 处理业务适配
```

---

### 3.7 服务端聚合模式

**面试常问题目**:
BFF 层的核心价值之一就是进行服务端数据聚合。了解不同的聚合模式有助于设计高效的数据聚合方案。

#### 3.7.1 串行聚合

```javascript
// 串行聚合: 按顺序调用依赖的服务
// 适用于服务间有依赖关系的场景

app.get('/api/bff/order/:orderId', async (req, res) => {
  const { orderId } = req.params;

  // 步骤1: 获取订单信息
  const order = await orderService.getOrder(orderId);

  // 步骤2: 依赖订单信息获取用户信息
  const user = await userService.getUser(order.userId);

  // 步骤3: 依赖订单信息获取商品信息
  const products = await productService.getProducts(order.productIds);

  // 步骤4: 获取物流信息
  const shipping = await shippingService.getShipping(order.shippingId);

  // 聚合结果
  res.json({
    order,
    user: { id: user.id, name: user.name },
    products,
    shipping
  });
});

// 时间复杂度: O(n) 其中 n 为服务调用次数
```

#### 3.7.2 并行聚合

```javascript
// 并行聚合: 同时调用多个无依赖关系的服务
// 适用于服务间无依赖的场景，显著减少响应时间

app.get('/api/bff/dashboard', async (req, res) => {
  const userId = req.user.id;

  // 同时发起多个请求
  const [user, orders, notifications, recommendations] = await Promise.all([
    userService.getProfile(userId),
    orderService.getRecentOrders(userId),
    notificationService.getUnread(userId),
    recommendationService.getForUser(userId)
  ]);

  res.json({
    user: {
      name: user.name,
      avatar: user.avatar,
      level: user.level
    },
    orders: orders.slice(0, 5).map(o => ({
      id: o.id,
      status: o.status,
      total: o.total
    })),
    unreadCount: notifications.filter(n => !n.read).length,
    recommendations: recommendations.slice(0, 10)
  });
});

// 时间复杂度: O(1) - 取最慢请求的时间
```

#### 3.7.3 混合聚合模式

```javascript
// 混合模式: 结合串行和并行的最优方案

app.get('/api/bff/checkout/:cartId', async (req, res) => {
  const { cartId } = req.params;
  const userId = req.user.id;

  // 第一步: 并行获取购物车和用户信息（无依赖）
  const [cart, user] = await Promise.all([
    cartService.getCart(cartId),
    userService.getProfile(userId)
  ]);

  // 第二步: 依赖购物车获取商品信息（并行）
  const products = await Promise.all(
    cart.items.map(item => productService.getProduct(item.productId))
  );

  // 第三步: 依赖商品信息计算库存（串行）
  const inventoryChecks = await Promise.all(
    products.map(p => inventoryService.check(p.id))
  );

  // 第四步: 依赖用户获取地址（并行）
  const [addresses, shippingOptions] = await Promise.all([
    addressService.getUserAddresses(userId),
    shippingService.getOptions()
  ]);

  // 聚合结果
  res.json({
    cart: {
      items: cart.items.map((item, i) => ({
        product: products[i],
        quantity: item.quantity,
        available: inventoryChecks[i].available
      })),
      subtotal: cart.subtotal
    },
    user: {
      name: user.name,
      points: user.points
    },
    addresses,
    shippingOptions
  });
});
```

#### 3.7.4 错误处理与容错

```javascript
// 聚合层的错误处理策略

// 1. 允许部分失败
async function resilientAggregation(requests) {
  const results = await Promise.allSettled(requests);

  const data = {};
  const errors = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      data[result.value.key] = result.value.data;
    } else {
      errors.push({ index, error: result.reason });
      // 设置默认值或使用缓存
      data[`fallback_${index}`] = getFallbackData(index);
    }
  });

  return { data, errors, partial: errors.length > 0 };
}

// 2. 使用 Circuit Breaker 模式
const CircuitBreaker = require('opossum');

const options = {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
};

const breaker = new CircuitBreaker(orderService.getOrder, options);

breaker.on('open', () => console.log('Circuit opened'));
breaker.on('close', () => console.log('Circuit closed'));

app.get('/api/bff/order/:id', async (req, res) => {
  try {
    const order = await breaker.fire(req.params.id);
    res.json(order);
  } catch (error) {
    // 返回缓存数据或降级响应
    const cached = await cache.get(`order:${req.params.id}`);
    if (cached) return res.json(cached);

    res.status(503).json({ error: 'Service temporarily unavailable' });
  }
});
```

---

### 3.8 缓存策略

**面试常问题目**:
BFF 层的缓存策略对于提升性能和减轻后端压力至关重要。合理的缓存设计可以显著改善用户体验。

#### 3.8.1 多级缓存架构

```javascript
// BFF 多级缓存架构

// L1: 进程内缓存 (Memory Cache)
// L2: Redis 分布式缓存
// L3: HTTP 缓存 (CDN/Browser)

const CacheService = require('./services/cache');

// 进程内缓存 (使用 node-cache 或 lru-cache)
const localCache = new Map();

// L1 缓存操作
function getFromLocalCache(key) {
  const item = localCache.get(key);
  if (!item) return null;

  if (item.expire < Date.now()) {
    localCache.delete(key);
    return null;
  }
  return item.value;
}

function setLocalCache(key, value, ttl = 60000) {
  localCache.set(key, {
    value,
    expire: Date.now() + ttl
  });
}

// L2 Redis 缓存操作
async function getFromRedis(key) {
  const value = await redis.get(key);
  return value ? JSON.parse(value) : null;
}

async function setRedis(key, value, ttl = 3600) {
  await redis.setex(key, ttl, JSON.stringify(value));
}

// 多级缓存读取
async function getCachedData(key, fetcher, ttl = 300) {
  // L1: 尝试进程缓存
  let data = getFromLocalCache(key);
  if (data) return data;

  // L2: 尝试 Redis
  data = await getFromRedis(key);
  if (data) {
    setLocalCache(key, data, ttl * 1000); // 写入 L1
    return data;
  }

  // L3: 读取源
  data = await fetcher();

  // 写入缓存
  setLocalCache(key, data, ttl * 1000);
  await setRedis(key, data, ttl);

  return data;
}
```

#### 3.8.2 缓存策略模式

```javascript
// 1. Cache-Aside (旁路缓存) - 最常用

app.get('/api/bff/user/:id', async (req, res) => {
  const { id } = req.params;
  const cacheKey = `user:${id}`;

  // 读操作
  let user = await getCachedData(cacheKey, () => userService.getUser(id));

  // 如果缓存不存在，从数据库读取并写入缓存
  if (!user) {
    user = await userService.getUser(id);
    if (user) {
      await setRedis(cacheKey, user, 3600);
    }
  }

  res.json(user);
});

// 写操作时删除缓存
app.put('/api/bff/user/:id', async (req, res) => {
  const { id } = req.params;

  await userService.updateUser(id, req.body);

  // 删除缓存，下一次读取会重新加载
  await redis.del(`user:${id}`);

  res.json({ success: true });
});

// 2. Write-Through (写穿透)

app.post('/api/bff/user', async (req, res) => {
  const user = await userService.createUser(req.body);

  // 同时写入数据库和缓存
  await setRedis(`user:${user.id}`, user, 3600);

  res.json(user);
});

// 3. TTL 差异化策略

const cacheStrategies = {
  // 用户信息: 变更少，缓存时间长
  user: { ttl: 3600, refreshAhead: 300 },

  // 商品信息: 变更频繁，缓存时间短
  product: { ttl: 300, refreshAhead: 30 },

  // 列表数据: 缓存时间中等
  list: { ttl: 600, refreshAhead: 60 },

  // 配置数据: 几乎不变，缓存时间长
  config: { ttl: 86400, refreshAhead: 3600 }
};
```

#### 3.8.3 缓存击穿与雪崩防护

```javascript
// 1. 缓存击穿 (Cache Stampede)
// 使用互斥锁或分布式锁防止大量请求同时访问数据库

const lock = require('redlock');
const locks = new lock([redis]);

async function getWithLock(key, fetcher, ttl) {
  let data = await getFromRedis(key);
  if (data) return data;

  // 尝试获取锁
  const lockKey = `lock:${key}`;
  try {
    await locks.acquire(lockKey, 5000);

    // 双重检查
    data = await getFromRedis(key);
    if (data) return data;

    data = await fetcher();
    await setRedis(key, data, ttl);

    return data;
  } catch (error) {
    // 未获取到锁，等待后重试
    await new Promise(r => setTimeout(r, 100));
    return getFromRedis(key);
  } finally {
    locks.release(lockKey).catch(() => {});
  }
}

// 2. 缓存雪崩 (Cache Avalanche)
// 使用随机 TTL + 预热

function getRandomTTL(base, variance) {
  return base + Math.floor(Math.random() * variance * 2 - variance);
}

app.get('/api/bff/products', async (req, res) => {
  const cacheKey = 'products:all';

  let products = await getFromRedis(cacheKey);
  if (!products) {
    products = await productService.getAllProducts();
    // 随机 TTL 3600-5400 秒
    const ttl = getRandomTTL(3600, 900);
    await setRedis(cacheKey, products, ttl);
  }

  res.json(products);
});

// 3. 缓存预热
async function cacheWarmUp() {
  const hotKeys = [
    'products:featured',
    'categories:all',
    'config:global'
  ];

  await Promise.all(
    hotKeys.map(async (key) => {
      const data = await fetchFromDB(key);
      await setRedis(key, data, getRandomTTL(3600, 300));
    })
  );

  console.log('Cache warm up completed');
}
```

#### 3.8.4 HTTP 缓存与 CDN

```javascript
// BFF 层设置 HTTP 缓存头

app.get('/api/bff/products', async (req, res) => {
  const products = await productService.getProducts();

  // ETag 缓存
  const etag = crypto.createHash('md5').update(JSON.stringify(products)).digest('hex');

  // 检查 If-None-Match
  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end();
  }

  res.set({
    'Cache-Control': 'public, max-age=300, s-maxage=600',
    'ETag': etag,
    'Vary': 'Accept-Encoding'
  });

  res.json(products);
});

// CDN 缓存策略

// 1. 静态资源 - 长期缓存
app.use('/static', express.static('public', {
  maxAge: '1y',
  etag: true
}));

// 2. 个性化数据 - 私有缓存
app.get('/api/bff/user/profile', async (req, res) => {
  const profile = await getUserProfile(req.user.id);

  res.set({
    'Cache-Control': 'private, max-age=0, must-revalidate',
    'Vary': 'Authorization'
  });

  res.json(profile);
});

// 3. 热点数据 - CDN 缓存
app.get('/api/bff/products/popular', async (req, res) => {
  const products = await getPopularProducts();

  res.set({
    'Cache-Control': 'public, max-age=60, s-maxage=300',
    'X-Cache-TTL': '60'
  });

  res.json(products);
});
```

---

## 第四章 NestJS 深入

### 4.1 NestJS 核心概念

**面试常问题目**:
NestJS 是一个用于构建高效、可扩展的 Node.js 服务器端应用的框架。

#### 4.1.1 依赖注入

```typescript
// 依赖注入示例

// 1. 服务提供者
// user.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  private users = [];

  findAll() {
    return this.users;
  }

  findOne(id: string) {
    return this.users.find(user => user.id === id);
  }

  create(user: any) {
    this.users.push(user);
    return user;
  }
}

// 2. 控制器
// user.controller.ts
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  // 依赖注入
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Post()
  create(@Body() createUserDto: any) {
    return this.userService.create(createUserDto);
  }
}

// 3. 模块
// user.module.ts
import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule {}

// 4. 根模块
// app.module.ts
import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';

@Module({
  imports: [UserModule]
})
export class AppModule {}
```

#### 4.1.2 装饰器与路由

```typescript
// NestJS 装饰器详解

// 1. 路由装饰器
@Controller('api')
export class AppController {
  @Get('users')           // GET /api/users
  @Post('users')          // POST /api/users
  @Put('users/:id')       // PUT /api/users/:id
  @Delete('users/:id')    // DELETE /api/users/:id
  @Patch('users/:id')     // PATCH /api/users/:id

  @Get('users/:id/posts') // GET /api/users/:id/posts
  getUserPosts(@Param('id') id: string) {}

  // 2. 参数装饰器
  @Get('query')
  getByQuery(
    @Query('id') id: string,
    @Query('name') name: string,
    @Query() query: any
  ) {}

  @Post('body')
  postBody(
    @Body() body: any,
    @Body('id') id: string
  ) {}

  @Get('headers')
  getHeaders(@Headers() headers: any) {}

  // 3. 自定义装饰器
  import { createParamDecorator, ExecutionContext } from '@nestjs/common';

  export const CurrentUser = createParamDecorator(
    (data: string, ctx: ExecutionContext) => {
      const request = ctx.switchToHttp().getRequest();
      const user = request.user;
      return data ? user?.[data] : user;
    }
  );

  @Get('profile')
  getProfile(@CurrentUser() user: any) {}

  @Get('profile/:field')
  getProfileField(@CurrentUser('id') userId: string) {}
}
```

### 4.2 NestJS 中间件与拦截器

```typescript
// 1. 中间件
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, originalUrl } = req;

    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${method} ${originalUrl} - ${res.statusCode} - ${duration}ms`);
    });

    next();
  }
}

// 2. 全局中间件
// main.ts
const app = await NestFactory.create(AppModule);
app.use(LoggerMiddleware);

// 3. 拦截器
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

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
        })
      );
  }
}

// 4. 异常过滤器
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message: typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message
    });
  }
}

// 使用拦截器和过滤器
@Controller('users')
@UseInterceptors(LoggingInterceptor)
@UseFilters(HttpExceptionFilter)
export class UserController {
  // ...
}
```

### 4.3 NestJS 与微服务

```typescript
// NestJS 微服务

// 1. TCP 微服务
// main.ts
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        port: 3001,
      },
    },
  );

  await app.listen();
  console.log('TCP Microservice is listening...');
}

// 微服务控制器
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class MathController {
  @MessagePattern('add')
  add(data: number[]): number {
    return data.reduce((a, b) => a + b, 0);
  }

  @MessagePattern('multiply')
  multiply(data: number[]): number {
    return data.reduce((a, b) => a * b, 1);
  }
}

// 2. gRPC 微服务
// main.ts
async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'math',
        protoPath: join(__dirname, 'math.proto'),
      },
    },
  );

  await app.listen();
}
```

---

## 第五章 面试高频问题汇总

### 5.1 Node.js 基础面试题

```javascript
// Q1: Node.js 事件循环的执行顺序是什么？
// A:
// 1. 同步代码执行
// 2. process.nextTick 队列
// 3. Promise.then 队列 (微任务)
// 4. Timers 阶段 (setTimeout, setInterval)
// 5. Pending callbacks
// 6. Idle, Prepare
// 7. Poll 阶段 (I/O 回调)
// 8. Check 阶段 (setImmediate)
// 9. Close callbacks

// Q2: Node.js 是单线程的吗？
// A: Node.js 主线程是单线程的，但 I/O 操作由 libuv 线程池处理。
//    可以使用 Cluster 模块或 Worker Threads 实现多线程。

// Q3: 什么是 Buffer？
// A: Buffer 是 Node.js 用来处理二进制数据的类，类似于整数数组，
//    但对应于 V8 堆内存之外的原始内存分配。

// Q4: 什么是 Stream？
// A: Stream 是 Node.js 处理流式数据的抽象接口，有四种类型：
//    Readable (可读)、Writable (可写)、Duplex (双工)、Transform (转换)

// Q5: 为什么需要 BFF？
// A:
// 1. 减少前端请求次数，聚合后端服务
// 2. 保护前端免受后端 API 变化影响
// 3. 为不同前端提供定制化接口
// 4. 支持服务端渲染

// Q6: Express vs Koa vs NestJS 区别？
// A:
// - Express: 轻量、灵活、生态成熟，但缺乏结构化
// - Koa: 更轻量、async/await 原生支持、中间件机制优雅
// - NestJS: 企业级、TypeScript 支持、依赖注入、模块化

// Q7: Node.js 如何处理高并发？
// A:
// 1. 事件循环 + 非阻塞 I/O
// 2. Cluster 模块利用多核
// 3. 合理使用缓存
// 4. 连接池复用

// Q8: 什么是背压问题？如何解决？
// A: 背压是指数据产生速度大于消费速度导致内存溢出的问题。
//    解决：使用 pipe() 方法或手动 pause/resume 机制。

// Q9: CommonJS vs ES Modules？
// A:
// - CommonJS: require/exports，同步加载
// - ES Modules: import/export，异步加载 (Node.js 12+ 支持混合使用)

// Q10: Promise vs async/await？
// A: async/await 是 Promise 的语法糖，让异步代码看起来像同步代码。
//    本质上都是基于 Promise 实现。
```

### 5.2 场景题与解决方案

```javascript
// 场景题1: 如何实现接口超时控制？

async function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Timeout')), ms);
  });

  return Promise.race([promise, timeout]);
}

// 使用
try {
  const result = await withTimeout(doSomething(), 5000);
} catch (error) {
  console.error('请求超时');
}

// 场景题2: 如何实现接口重试？

async function withRetry(fn, retries = 3, delay = 1000) {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise(r => setTimeout(r, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
}

// 场景题3: 如何实现接口限流？

class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  isAllowed(key) {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // 清理过期请求
    const validRequests = requests.filter(t => now - t < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }
}

// 场景题4: 如何处理循环依赖？

// 方案1: 使用 require 在函数内部
function A() {
  const B = require('./b');
  return B();
}

// 方案2: 延迟赋值
module.exports = {
  name: 'A',
  getB: function() {
    const B = require('./b');
    return B();
  }
};

// 场景题5: 如何优化大文件上传？

const multiparty = require('multiparty');
const fs = require('fs');
const path = require('path');

app.post('/upload', (req, res) => {
  const form = new multiparty.Form({
    uploadDir: '/tmp',
    maxFilesSize: 1024 * 1024 * 1024 // 1GB
  });

  form.on('part', (part) => {
    const filename = path.join('/uploads', part.filename);
    part.pipe(fs.createWriteStream(filename));
  });

  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true });
  });
});
```

### 5.3 手写代码题

```javascript
// 手写题1: 实现 Promise.all

function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(promises)) {
      return reject(new TypeError('参数必须是数组'));
    }

    const results = [];
    let completed = 0;

    if (promises.length === 0) {
      return resolve(results);
    }

    promises.forEach((promise, index) => {
      Promise.resolve(promise)
        .then(value => {
          results[index] = value;
          completed++;

          if (completed === promises.length) {
            resolve(results);
          }
        })
        .catch(reject);
    });
  });
}

// 手写题2: 实现 Promise.race

function promiseRace(promises) {
  return new Promise((resolve, reject) => {
    promises.forEach(promise => {
      Promise.resolve(promise)
        .then(resolve, reject);
    });
  });
}

// 手写题3: 实现深拷贝

function deepClone(obj, hash = new WeakMap()) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (hash.has(obj)) {
    return hash.get(obj);
  }

  const clone = Array.isArray(obj) ? [] : {};
  hash.set(obj, clone);

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clone[key] = deepClone(obj[key], hash);
    }
  }

  return clone;
}

// 手写题4: 实现防抖

function debounce(fn, delay) {
  let timer = null;

  return function(...args) {
    if (timer) clearTimeout(timer);

    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

// 手写题5: 实现节流

function throttle(fn, delay) {
  let lastTime = 0;

  return function(...args) {
    const now = Date.now();

    if (now - lastTime >= delay) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}

// 手写题6: 实现 LRU 缓存

class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return -1;

    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, value);
  }
}

// 手写题7: 实现继承

// 原型链继承
function Parent() {
  this.name = 'parent';
}

function Child() {
  Parent.call(this);
  this.type = 'child';
}

Child.prototype = new Parent();
Child.prototype.constructor = Child;

// ES6 Class 继承
class Parent {
  constructor() {
    this.name = 'parent';
  }
}

class Child extends Parent {
  constructor() {
    super();
    this.type = 'child';
  }
}
```

### 5.4 系统设计题

```javascript
// 场景：设计一个 BFF 服务

// 1. 整体架构
// ┏━━━━━━━━━┓     ┏━━━━━━━━━┓     ┏━━━━━━━━━━┓
// ┃  前端   ┃━━━━▶┃  BFF    ┃━━━━▶┃  微服务  ┃
// ┃  移动端 ┃     ┃  Web    ┃     ┃  用户服务┃
// ┃  小程序 ┃     ┃  Mobile ┃     ┃  订单服务┃
// ┗━━━━━━━━━┛     ┃  MiniApp┃     ┃  商品服务┃
//                 ┗━━━━━━━━━┛     ┗━━━━━━━━━━┛
//                      ┃                      
//                 ┏━━━━━━━━━┓                 
//                 ┃  缓存   ┃                 
//                 ┃  Redis  ┃                 
//                 ┗━━━━━━━━━┛                 
                                               
// 2. 目录结构设计
// src/
// ┣━━ modules/                         
// ┃   ┣━━ user/          # 用户模块    
// ┃   ┃   ┣━━ user.controller.ts       
// ┃   ┃   ┣━━ user.service.ts          
// ┃   ┃   ┣━━ user.module.ts           
// ┃   ┃   ┗━━ dto/                     
// ┃   ┣━━ order/         # 订单模块    
// ┃   ┗━━ product/       # 商品模块    
// ┣━━ common/                          
// ┃   ┣━━ decorators/    # 自定义装饰器
// ┃   ┣━━ filters/       # 异常过滤器  
// ┃   ┣━━ interceptors/  # 拦截器      
// ┃   ┗━━ middleware/    # 中间件      
// ┣━━ config/            # 配置文件    
// ┣━━ gateway/          # 网关相关     
// ┗━━ main.ts                          
                                        
// 3. 关键代码示例

// 3.1 统一响应格式
// common/response.interceptor.ts
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => ({
        code: 0,
        message: 'success',
        data
      }))
    );
  }
}

// 3.2 错误处理
// common/exception.filter.ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(status).json({
      code: status,
      message: exception instanceof Error ? exception.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      path: request.url
    });
  }
}

// 3.3 鉴权守卫
// common/auth.guard.ts
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

// 4. 性能优化策略

// 4.1 缓存策略
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(private cacheManager: CacheManager) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const key = request.originalUrl;

    const cached = await this.cacheManager.get(key);

    if (cached) {
      return of(cached);
    }

    return next.handle().pipe(
      tap(response => {
        this.cacheManager.set(key, response, { ttl: 300 });
      })
    );
  }
}

// 4.2 接口超时
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
    rawBody: true
  });

  app.use((req, res, next) => {
    res.setTimeout(10000, () => {
      res.status(408).json({ error: 'Request timeout' });
    });
    next();
  });
}
```

---

## 第六章 最佳实践与性能优化

### 6.1 BFF 项目结构最佳实践

```typescript
// 现代化 BFF 项目结构 (NestJS)

// src/
// ┣━━ main.ts                    # 应用入口    
// ┣━━ app.module.ts              # 根模块      
// ┣━━ config/                    # 配置        
// ┃   ┣━━ configuration.ts                     
// ┃   ┗━━ validation.ts                        
// ┣━━ modules/                   # 业务模块    
// ┃   ┣━━ common/                 # 公共模块   
// ┃   ┃   ┣━━ dto/               # 数据传输对象
// ┃   ┃   ┣━━ entities/          # 实体        
// ┃   ┃   ┣━━ interfaces/        # 接口定义    
// ┃   ┃   ┗━━ constants.ts                     
// ┃   ┣━━ auth/                  # 认证模块    
// ┃   ┃   ┣━━ auth.controller.ts               
// ┃   ┃   ┣━━ auth.service.ts                  
// ┃   ┃   ┣━━ auth.module.ts                   
// ┃   ┃   ┣━━ strategies/        # 认证策略    
// ┃   ┃   ┗━━ guards/            # 守卫        
// ┃   ┣━━ user/                  # 用户模块    
// ┃   ┣━━ order/                 # 订单模块    
┃   ┃   ┣━━ order.module.ts                     
┃   ┃   ┣━━ order.service.ts                    
┃   ┃   ┣━━ order.controller.ts                 
┃   ┃   ┣━━ dto/                                
┃   ┃   ┗━━ interfaces/                         
┃   ┣━━ product/                 # 商品模块     
┃   ┗━━ bff/                     # BFF 聚合模块 
┃       ┣━━ bff.controller.ts   # 聚合接口      
┃       ┣━━ bff.service.ts                      
┃       ┗━━ bff.module.ts                       
// ┣━━ shared/                    # 共享功能    
// ┃   ┣━━ cache/                 # 缓存        
// ┃   ┣━━ http/                  # HTTP 客户端 
// ┃   ┗━━ logger/                # 日志        
// ┗━━ database/                  # 数据库      
┃   ┣━━ entities/                               
┃   ┗━━ migrations/                             
```

### 6.2 日志与监控

```typescript
// 日志系统实现

// 1. 结构化日志
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  }
});

// 使用日志
logger.info({ userId: '123' }, 'User logged in');
logger.error({ err: error }, 'Request failed');

// 2. 请求日志中间件
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, body } = req;
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;

      logger.info({
        method,
        url: originalUrl,
        body: JSON.stringify(body),
        statusCode,
        duration,
        ip: req.ip,
        userAgent: req.get('user-agent')
      }, 'HTTP Request');
    });

    next();
  }
}

// 3. 统一错误日志
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    logger.error({
      method: request.method,
      url: request.url,
      statusCode: status,
      response: exceptionResponse,
      body: request.body,
      stack: exception.stack
    }, 'HTTP Error');

    response.status(status).json(exceptionResponse);
  }
}

// 4. 监控指标 (Prometheus)
import { Counter, Histogram, Gauge } from 'prom-client';

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'status', 'path']
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'status', 'path'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

// 使用
@Get()
async findAll(@Req() req: Request) {
  const start = Date.now();
  const result = await this.service.findAll();

  httpRequestsTotal.inc({ method: 'GET', status: 200, path: '/items' });
  httpRequestDuration.observe(
    { method: 'GET', status: 200, path: '/items' },
    (Date.now() - start) / 1000
  );

  return result;
}
```

### 6.3 安全最佳实践

```typescript
// 安全最佳实践

// 1. CORS 配置
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization'],
  credentials: true,
  maxAge: 86400
});

// 2. Helmet 安全头
import helmet from 'helmet';
app.use(helmet());

// 3. 请求限流
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      name: 'short',
      ttl: 1000,
      limit: 3
    }, {
      name: 'medium',
      ttl: 10000,
      limit: 20
    }, {
      name: 'long',
      ttl: 60000,
      limit: 100
    }])
  ]
})
export class AppModule {}

// 4. 输入验证
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsOptional()
  name?: string;
}

// 5. 敏感数据处理
// 不在日志中打印敏感信息
logger.info({
  userId: user.id,
  email: user.email, // 危险！
  // 应该只记录非敏感信息
}, 'User action');

// 6. SQL 注入防护 - 使用参数化查询
// 不好
const query = `SELECT * FROM users WHERE id = '${userId}'`;

// 好
const query = 'SELECT * FROM users WHERE id = $1';
const result = await client.query(query, [userId]);

// 7. XSS 防护 - 输出编码
import escapeHtml from 'escape-html';

// 在模板中
res.send(`<div>${escapeHtml(userInput)}</div>`);
```

### 6.4 部署与运维

```yaml
# Docker 配置
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main.js"]

# docker-compose.yml
version: '3.8'

services:
  app:
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
    restart: unless-stopped

  db:
    image: postgres:14
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=mydb

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:

# Kubernetes 配置
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bff-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: bff-service
  template:
    metadata:
      labels:
        app: bff-service
    spec:
      containers:
      - name: bff-service
        image: bff-service:latest
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        env:
        - name: NODE_ENV
          value: "production"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

---

## 总结

本文档全面覆盖了 Node.js 与 BFF 架构的核心知识点，包括：

1. **Node.js 核心原理**: 事件循环、进程与线程、Buffer 和 Stream、模块系统、异步编程、错误处理、性能优化
2. **BFF 架构设计**: BFF 定义与优势、技术选型、服务端渲染、接口聚合、鉴权方案
3. **NestJS 框架**: 依赖注入、装饰器、微服务
4. **面试高频问题**: 基础概念、场景题、手写代码、系统设计

希望这份面试题汇总能帮助你斩获理想的 Offer！

---

> 整理不易，**一键三连**支持一下！如果你有更好的题目或答案，欢迎提交 PR！
> **作者**: 前端面试题整理团队 | **版本**: 2025 最终版 | **License**: MIT
