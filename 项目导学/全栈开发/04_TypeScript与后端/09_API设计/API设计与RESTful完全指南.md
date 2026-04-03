# API设计与RESTful完全指南

## 目录

1. [API设计基础](#1-api设计基础)
2. [RESTful API最佳实践](#2-restful-api最佳实践)
3. [GraphQL深度解析](#3-graphql深度解析)
4. [API网关设计](#4-api网关设计)
5. [API文档与测试](#5-api文档与测试)
6. [API安全与认证](#6-api安全与认证)

---

## 1. API设计基础

### 1.1 API设计原则

```
API设计核心原则（The Twelve-Factor App API）

1. 无状态（Stateless）
   └── 每个请求包含所有必要信息

2. 统一接口（Uniform Interface）
   └── 使用统一的资源命名和操作

3. 客户端-服务器分离（Client-Server）
   └── 前端后端解耦

4. 可缓存（Cacheable）
   └── 响应必须明确是否可缓存

5. 按需代码（Code on Demand）
   └── 可选功能，如JavaScript执行

6. 分层系统（Layered System）
   └── 架构分层，每层独立
```

### 1.2 HTTP方法语义

| HTTP方法 | 语义 | 幂等性 | 安全性 | 请求体 | 示例 |
|----------|------|--------|--------|--------|------|
| **GET** | 获取资源 | ✅ 是 | ✅ 是 | ❌ 否 | GET /users/1 |
| **POST** | 创建资源 | ❌ 否 | ❌ 否 | ✅ 是 | POST /users |
| **PUT** | 完整更新 | ✅ 是 | ❌ 否 | ✅ 是 | PUT /users/1 |
| **PATCH** | 部分更新 | ❌ 否 | ❌ 否 | ✅ 是 | PATCH /users/1 |
| **DELETE** | 删除资源 | ✅ 是 | ❌ 否 | ❌ 否 | DELETE /users/1 |
| **OPTIONS** | 获取支持方法 | ✅ 是 | ✅ 是 | ❌ 否 | OPTIONS /users |
| **HEAD** | 获取响应头 | ✅ 是 | ✅ 是 | ❌ 否 | HEAD /users/1 |

### 1.3 HTTP状态码

| 状态码 | 类别 | 含义 | 使用场景 |
|--------|------|------|----------|
| **200** | 成功 | OK | 请求成功 |
| **201** | 成功 | Created | 资源创建成功 |
| **204** | 成功 | No Content | 成功但无返回内容 |
| **400** | 客户端错误 | Bad Request | 请求参数错误 |
| **401** | 客户端错误 | Unauthorized | 未认证 |
| **403** | 客户端错误 | Forbidden | 无权限 |
| **404** | 客户端错误 | Not Found | 资源不存在 |
| **409** | 客户端错误 | Conflict | 资源冲突 |
| **422** | 客户端错误 | Unprocessable Entity | 语义错误 |
| **429** | 客户端错误 | Too Many Requests | 请求过多 |
| **500** | 服务器错误 | Internal Server Error | 服务器内部错误 |
| **502** | 服务器错误 | Bad Gateway | 网关错误 |
| **503** | 服务器错误 | Service Unavailable | 服务不可用 |

---

## 2. RESTful API最佳实践

### 2.1 资源命名规范

```javascript
// 1. 使用名词，不用动词
// ✅ 好的做法
GET /users           // 获取用户列表
GET /users/1         // 获取单个用户
POST /users          // 创建用户
PUT /users/1         // 更新用户
DELETE /users/1      // 删除用户

// ❌ 不好的做法
GET /getUsers
POST /createUser
PUT /updateUser/1
DELETE /deleteUser/1

// 2. 使用复数形式
// ✅ 好的做法
GET /users
GET /products
GET /orders

// ❌ 不好的做法
GET /user
GET /product
GET /order

// 3. 使用小写字母和连字符
// ✅ 好的做法
GET /user-profiles
GET /order-items
GET /shopping-carts

// ❌ 不好的做法
GET /userProfiles
GET /order_items
GET /shoppingCarts

// 4. 层级嵌套不要超过3层
// ✅ 好的做法（2层）
GET /users/1/orders
GET /users/1/orders/2

// ❌ 不好的做法（超过3层）
GET /users/1/orders/2/items/3/reviews/4

// ✅ 更好的做法（使用查询参数）
GET /orders?userId=1
GET /orders?userId=1&status=pending

// 5. 使用查询参数过滤、排序、分页
// ✅ 好的做法
GET /users?role=admin&status=active
GET /users?page=1&limit=20
GET /users?sort=name&order=asc
GET /users?search=zhangsan

// 6. 版本控制
// ✅ 好的做法：URL版本
GET /api/v1/users
GET /api/v2/users

// ✅ 好的做法：Header版本
GET /users
Headers:
  Accept-Version: v1

// ✅ 好的做法：域名版本
GET v1.api.example.com/users
GET v2.api.example.com/users
```

### 2.2 请求与响应设计

```javascript
// 1. 请求体设计
// ✅ 好的做法：统一结构
{
  "data": {
    "name": "张三",
    "email": "zhangsan@example.com",
    "age": 25
  }
}

// ✅ 好的做法：扁平化结构
{
  "name": "张三",
  "email": "zhangsan@example.com",
  "age": 25
}

// ❌ 不好的做法：过度嵌套
{
  "user": {
    "profile": {
      "personal": {
        "name": "张三",
        "email": "zhangsan@example.com"
      }
    }
  }
}

// 2. 响应体设计
// ✅ 好的做法：统一成功响应
{
  "success": true,
  "data": {
    "id": 1,
    "name": "张三",
    "email": "zhangsan@example.com"
  },
  "message": "获取成功"
}

// ✅ 好的做法：统一错误响应
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "用户不存在",
    "details": {
      "userId": 999
    }
  }
}

// ✅ 好的做法：分页响应
{
  "success": true,
  "data": [
    { "id": 1, "name": "张三" },
    { "id": 2, "name": "李四" }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}

// 3. 时间格式
// ✅ 好的做法：ISO 8601格式
{
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00+08:00"
}

// ❌ 不好的做法：时间戳
{
  "createdAt": 1705315800,
  "updatedAt": 1705315800
}

// 4. 金额格式
// ✅ 好的做法：使用字符串
{
  "price": "99.99",
  "currency": "CNY"
}

// ❌ 不好的做法：使用浮点数
{
  "price": 99.99
}

// 5. 布尔值格式
// ✅ 好的做法：使用布尔类型
{
  "isActive": true,
  "isVerified": false
}

// ❌ 不好的做法：使用字符串
{
  "isActive": "true",
  "isVerified": "false"
}
```

### 2.3 Express RESTful API实现

```javascript
// 1. 基础路由结构
// routes/users.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validateUser } = require('../middleware/validator');
const { authenticate } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');

// 用户路由
router
  .route('/')
  .get(authenticate, rateLimiter, userController.getUsers)  // 获取用户列表
  .post(authenticate, validateUser, userController.createUser);  // 创建用户

router
  .route('/:id')
  .get(authenticate, userController.getUserById)  // 获取单个用户
  .put(authenticate, validateUser, userController.updateUser)  // 更新用户
  .patch(authenticate, userController.partialUpdateUser)  // 部分更新用户
  .delete(authenticate, userController.deleteUser);  // 删除用户

// 用户订单路由
router
  .route('/:id/orders')
  .get(authenticate, userController.getUserOrders)  // 获取用户订单
  .post(authenticate, userController.createUserOrder);  // 创建用户订单

module.exports = router;

// 2. 控制器实现
// controllers/userController.js
const UserService = require('../services/UserService');

class UserController {
  // 获取用户列表
  async getUsers(req, res, next) {
    try {
      const { page = 1, limit = 20, sort = 'createdAt', order = 'desc' } = req.query;

      const users = await UserService.getUsers({
        page: parseInt(page),
        limit: parseInt(limit),
        sort,
        order,
      });

      res.json({
        success: true,
        data: users.data,
        pagination: users.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  // 获取单个用户
  async getUserById(req, res, next) {
    try {
      const user = await UserService.getUserById(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '用户不存在',
          },
        });
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  // 创建用户
  async createUser(req, res, next) {
    try {
      const user = await UserService.createUser(req.body);

      res.status(201).json({
        success: true,
        data: user,
        message: '用户创建成功',
      });
    } catch (error) {
      next(error);
    }
  }

  // 更新用户
  async updateUser(req, res, next) {
    try {
      const user = await UserService.updateUser(req.params.id, req.body);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '用户不存在',
          },
        });
      }

      res.json({
        success: true,
        data: user,
        message: '用户更新成功',
      });
    } catch (error) {
      next(error);
    }
  }

  // 部分更新用户
  async partialUpdateUser(req, res, next) {
    try {
      const user = await UserService.partialUpdateUser(req.params.id, req.body);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '用户不存在',
          },
        });
      }

      res.json({
        success: true,
        data: user,
        message: '用户部分更新成功',
      });
    } catch (error) {
      next(error);
    }
  }

  // 删除用户
  async deleteUser(req, res, next) {
    try {
      const deleted = await UserService.deleteUser(req.params.id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '用户不存在',
          },
        });
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // 获取用户订单
  async getUserOrders(req, res, next) {
    try {
      const { userId } = req.params;
      const { status, page = 1, limit = 20 } = req.query;

      const orders = await UserService.getUserOrders(userId, {
        status,
        page: parseInt(page),
        limit: parseInt(limit),
      });

      res.json({
        success: true,
        data: orders.data,
        pagination: orders.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  // 创建用户订单
  async createUserOrder(req, res, next) {
    try {
      const order = await UserService.createUserOrder(req.params.id, req.body);

      res.status(201).json({
        success: true,
        data: order,
        message: '订单创建成功',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();

// 3. 服务层实现
// services/UserService.js
const UserRepository = require('../repositories/UserRepository');
const { AppError } = require('../utils/errors');

class UserService {
  // 获取用户列表（带分页）
  async getUsers(options) {
    const { page, limit, sort, order } = options;
    const offset = (page - 1) * limit;

    const users = await UserRepository.findAll({
      limit,
      offset,
      order: [[sort, order.toUpperCase()]],
    });

    const total = await UserRepository.count();

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // 获取单个用户
  async getUserById(id) {
    return await UserRepository.findByPk(id);
  }

  // 创建用户
  async create(userData) {
    // 检查邮箱是否已存在
    const existingUser = await UserRepository.findOne({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new AppError('EMAIL_ALREADY_EXISTS', '邮箱已存在', 409);
    }

    return await UserRepository.create(userData);
  }

  // 更新用户
  async updateUser(id, updates) {
    const user = await UserRepository.findByPk(id);

    if (!user) {
      throw new AppError('USER_NOT_FOUND', '用户不存在', 404);
    }

    return await user.update(updates);
  }

  // 部分更新用户
  async partialUpdateUser(id, updates) {
    return await this.updateUser(id, updates);
  }

  // 删除用户
  async deleteUser(id) {
    const user = await UserRepository.findByPk(id);

    if (!user) {
      return false;
    }

    await user.destroy();
    return true;
  }

  // 获取用户订单
  async getUserOrders(userId, options) {
    const user = await UserRepository.findByPk(userId);

    if (!user) {
      throw new AppError('USER_NOT_FOUND', '用户不存在', 404);
    }

    return await UserRepository.getUserOrders(userId, options);
  }

  // 创建用户订单
  async createUserOrder(userId, orderData) {
    const user = await UserRepository.findByPk(userId);

    if (!user) {
      throw new AppError('USER_NOT_FOUND', '用户不存在', 404);
    }

    return await UserRepository.createOrder(userId, orderData);
  }
}

module.exports = new UserService();

// 4. 错误处理中间件
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  // 默认错误
  const statusCode = err.statusCode || 500;
  const message = err.message || '内部服务器错误';

  // 开发环境返回详细错误
  if (process.env.NODE_ENV === 'development') {
    return res.status(statusCode).json({
      success: false,
      error: {
        code: err.code || 'INTERNAL_ERROR',
        message,
        stack: err.stack,
        details: err.details,
      },
    });
  }

  // 生产环境返回简单错误
  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message,
    },
  });
};

module.exports = errorHandler;

// 5. 验证中间件
// middleware/validator.js
const { body, param, query } = require('express-validator');
const { validationResult } = require('express-validator');

// 验证用户数据
const validateUser = [
  body('name')
    .notEmpty()
    .withMessage('姓名不能为空')
    .isLength({ min: 2, max: 50 })
    .withMessage('姓名长度在2-50之间'),
  body('email')
    .isEmail()
    .withMessage('邮箱格式不正确'),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('密码至少8位'),
  body('age')
    .optional()
    .isInt({ min: 0, max: 120 })
    .withMessage('年龄在0-120之间'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '参数验证失败',
          details: errors.array(),
        },
      });
    }
    next();
  },
];

// 验证ID参数
const validateId = [
  param('id')
    .isInt()
    .withMessage('ID必须是整数'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '参数验证失败',
          details: errors.array(),
        },
      });
    }
    next();
  },
];

module.exports = { validateUser, validateId };
```

---

## 3. GraphQL深度解析

### 3.1 GraphQL基础

```graphql
# 1. 类型定义（Schema）
type User {
  id: ID!
  name: String!
  email: String!
  age: Int
  createdAt: DateTime!
  orders: [Order!]!
}

type Order {
  id: ID!
  total: Float!
  status: OrderStatus!
  items: [OrderItem!]!
  createdAt: DateTime!
  user: User!
}

type OrderItem {
  id: ID!
  product: Product!
  quantity: Int!
  price: Float!
}

type Product {
  id: ID!
  name: String!
  price: Float!
  description: String
}

enum OrderStatus {
  PENDING
  PAID
  SHIPPED
  DELIVERED
  CANCELLED
}

scalar DateTime

# 查询和变更
type Query {
  users(limit: Int, offset: Int): [User!]!
  user(id: ID!): User
  orders(status: OrderStatus, userId: ID): [Order!]!
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
  deleteUser(id: ID!): Boolean!
  createOrder(input: CreateOrderInput!): Order!
}

input CreateUserInput {
  name: String!
  email: String!
  password: String!
  age: Int
}

input UpdateUserInput {
  name: String
  email: String
  age: Int
}

input CreateOrderInput {
  userId: ID!
  items: [OrderItemInput!]!
}

input OrderItemInput {
  productId: ID!
  quantity: Int!
}
```

### 3.2 Apollo Server实现

```javascript
// 1. Apollo Server配置
// server.js
const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    // 认证逻辑
    const token = req.headers.authorization || '';
    const user = await verifyToken(token);
    return { user };
  },
  // 格式化错误
  formatError: (formattedError, error) => {
    return {
      ...formattedError,
      message: error.message,
      code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
    };
  },
});

startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async ({ req }) => {
    // 认证上下文
    const token = req.headers.authorization || '';
    const user = await verifyToken(token);
    return { user };
  },
}).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});

// 2. Resolvers实现
// graphql/resolvers.js
const UserService = require('../services/UserService');
const OrderService = require('../services/OrderService');

const resolvers = {
  // 查询
  Query: {
    users: async (parent, { limit = 20, offset = 0 }, context) => {
      return await UserService.getUsers({ limit, offset });
    },

    user: async (parent, { id }, context) => {
      return await UserService.getUserById(id);
    },

    orders: async (parent, { status, userId }, context) => {
      return await OrderService.getOrders({ status, userId });
    },
  },

  // 变更
  Mutation: {
    createUser: async (parent, { input }, context) => {
      return await UserService.createUser(input);
    },

    updateUser: async (parent, { id, input }, context) => {
      return await UserService.updateUser(id, input);
    },

    deleteUser: async (parent, { id }, context) => {
      return await UserService.deleteUser(id);
    },

    createOrder: async (parent, { input }, context) => {
      return await OrderService.createOrder(input);
    },
  },

  // 类型解析器
  User: {
    orders: async (parent, args, context) => {
      return await OrderService.getOrdersByUserId(parent.id);
    },
  },

  Order: {
    user: async (parent, args, context) => {
      return await UserService.getUserById(parent.userId);
    },
  },

  OrderItem: {
    product: async (parent, args, context) => {
      return await ProductService.getProductById(parent.productId);
    },
  },

  // 自定义标量
  DateTime: {
    serialize: (value) => value.toISOString(),
    parseValue: (value) => new Date(value),
    parseLiteral: (ast) => new Date(ast.value),
  },
};

module.exports = resolvers;

// 3. 客户端查询
// GraphQL查询示例
const GET_USERS = gql`
  query GetUsers($limit: Int, $offset: Int) {
    users(limit: $limit, offset: $offset) {
      id
      name
      email
      age
      createdAt
      orders {
        id
        total
        status
      }
    }
  }
`;

// 使用Apollo Client
import { useQuery } from '@apollo/client';

function UserList() {
  const { loading, error, data } = useQuery(GET_USERS, {
    variables: { limit: 20, offset: 0 },
  });

  if (loading) return <p>加载中...</p>;
  if (error) return <p>错误: {error.message}</p>;

  return (
    <ul>
      {data.users.map((user) => (
        <li key={user.id}>
          {user.name} - {user.email}
        </li>
      ))}
    </ul>
  );
}

// 4. GraphQL变更
// GraphQL变更示例
const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      name
      email
      createdAt
    }
  }
`;

// 使用变更
import { useMutation } from '@apollo/client';

function CreateUserForm() {
  const [createUser, { loading, error, data }] = useMutation(CREATE_USER, {
    refetchQueries: [{ query: GET_USERS }],
  });

  const handleSubmit = (formData) => {
    createUser({ variables: { input: formData } });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" type="text" />
      <input name="email" type="email" />
      <button type="submit" disabled={loading}>
        创建用户
      </button>
    </form>
  );
}
```

### 3.3 GraphQL高级特性

```javascript
// 1. 订阅（Subscriptions）
// 类型定义
type Subscription {
  orderUpdated: Order!
}

// Resolvers
const { PubSub } = require('graphql-subscriptions');
const pubsub = new PubSub();

const resolvers = {
  Subscription: {
    orderUpdated: {
      subscribe: () => pubsub.asyncIterator(['ORDER_UPDATED']),
    },
  },
};

// 发布事件
pubsub.publish('ORDER_UPDATED', {
  orderUpdated: orderData,
});

// 客户端订阅
const ORDER_UPDATED = gql`
  subscription OrderUpdated {
    orderUpdated {
      id
      total
      status
    }
  }
`;

function OrderStatus() {
  const { data, loading } = useSubscription(ORDER_UPDATED);

  if (loading) return <p>订阅中...</p>;

  return <div>订单状态: {data.orderUpdated.status}</div>;
}

// 2. 数据加载器（DataLoader）
// 解决N+1查询问题
const DataLoader = require('dataloader');

const userLoader = new DataLoader(async (userIds) => {
  const users = await UserService.getUsersByIds(userIds);
  return userIds.map((id) => users.find((user) => user.id === id));
});

const resolvers = {
  Order: {
    user: async (order) => {
      return await userLoader.load(order.userId);
    },
  },
};

// 3. 权限控制
const resolvers = {
  Query: {
    users: async (parent, args, context) => {
      if (!context.user) {
        throw new AuthenticationError('未认证');
      }
      return await UserService.getUsers(args);
    },

    adminUsers: async (parent, args, context) => {
      if (!context.user || !context.user.roles.includes('admin')) {
        throw new ForbiddenError('无权限');
      }
      return await UserService.getUsers(args);
    },
  },
};

// 4. 缓存控制
const resolvers = {
  Query: {
    users: async (parent, args, { cacheControl }) => {
      cacheControl.setCacheHint({ maxAge: 60 });
      return await UserService.getUsers(args);
    },
  },
};
```

---

## 4. API网关设计

### 4.1 API网关基础

```javascript
// 1. Express Gateway实现
// gateway/index.js
const express = require('express');
const httpProxy = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

// 安全中间件
app.use(helmet());
app.use(cors({
  origin: ['https://example.com'],
  credentials: true,
}));

// 限流
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15分钟
  max: 100,  // 每个IP最多100个请求
});

app.use('/api', limiter);

// 日志
app.use(morgan('combined'));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 路由到用户服务
app.use('/api/users', httpProxy.createProxyMiddleware({
  target: 'http://user-service:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/users': '',
  },
}));

// 路由到订单服务
app.use('/api/orders', httpProxy.createProxyMiddleware({
  target: 'http://order-service:3002',
  changeOrigin: true,
  pathRewrite: {
    '^/api/orders': '',
  },
}));

// 路由到产品服务
app.use('/api/products', httpProxy.createProxyMiddleware({
  target: 'http://product-service:3003',
  changeOrigin: true,
  pathRewrite: {
    '^/api/products': '',
  },
}));

// 聚合网关
app.get('/api/users/:userId/orders', async (req, res, next) => {
  try {
    // 并发请求用户和订单服务
    const [user, orders] = await Promise.all([
      fetch(`http://user-service:3001/users/${req.params.userId}`),
      fetch(`http://order-service:3002/orders?userId=${req.params.userId}`),
    ]);

    const userData = await user.json();
    const ordersData = await orders.json();

    res.json({
      user: userData.data,
      orders: ordersData.data,
    });
  } catch (error) {
    next(error);
  }
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    error: {
      message: '内部服务器错误',
    },
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});

// 2. 认证网关
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '未提供认证令牌',
      },
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '无效的令牌',
        },
      });
    }

    req.user = user;
    next();
  });
}

// 保护路由
app.use('/api/users', authenticateToken);
app.use('/api/orders', authenticateToken);

// 3. 熔断器
const CircuitBreaker = require('opossum');

const options = {
  timeout: 3000,  // 超时时间
  errorThresholdPercentage: 50,  // 错误百分比阈值
  resetTimeout: 30000,  // 重置时间
};

const breaker = new CircuitBreaker(async (url) => {
  const response = await fetch(url);
  return response.json();
}, options);

breaker.on('open', () => {
  console.log('熔断器打开');
});

breaker.on('halfOpen', () => {
  console.log('熔断器半开');
});

breaker.on('close', () => {
  console.log('熔断器关闭');
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const data = await breaker.fire(`http://user-service:3001/users/${req.params.id}`);
    res.json(data);
  } catch (error) {
    if (error.message.includes('CircuitBreaker')) {
      res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: '服务暂时不可用',
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          message: error.message,
        },
      });
    }
  }
});
```

### 4.2 API网关高级功能

```javascript
// 1. 请求转换
const transformRequest = (req, res, next) => {
  // 添加请求头
  req.headers['X-Request-ID'] = generateRequestId();
  req.headers['X-User-Agent'] = req.headers['user-agent'];

  // 转换请求体
  if (req.body) {
    req.body = {
      data: req.body,
      timestamp: new Date().toISOString(),
    };
  }

  next();
};

app.use(transformRequest);

// 2. 响应转换
const transformResponse = (req, res, next) => {
  const originalSend = res.send;

  res.send = function (data) {
    let transformedData = data;

    // 统一响应格式
    if (res.statusCode >= 200 && res.statusCode < 300) {
      transformedData = {
        success: true,
        data: data,
      };
    } else {
      transformedData = {
        success: false,
        error: data,
      };
    }

    originalSend.call(this, transformedData);
  };

  next();
};

app.use(transformResponse);

// 3. 动态路由
const serviceRegistry = {
  'user-service': 'http://user-service:3001',
  'order-service': 'http://order-service:3002',
  'product-service': 'http://product-service:3003',
};

app.use('/api/:service/*', (req, res, next) => {
  const serviceName = req.params.service;
  const serviceUrl = serviceRegistry[serviceName];

  if (!serviceUrl) {
    return res.status(404).json({
      success: false,
      error: {
        message: '服务不存在',
      },
    });
  }

  httpProxy.createProxyMiddleware({
    target: serviceUrl,
    changeOrigin: true,
  })(req, res, next);
});

// 4. 缓存
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 });  // 5分钟缓存

app.get('/api/cache/:key', (req, res) => {
  const { key } = req.params;

  const cached = cache.get(key);
  if (cached) {
    return res.json({
      success: true,
      data: cached,
      fromCache: true,
    });
  }

  res.json({
    success: false,
    error: {
      message: '缓存未命中',
    },
  });
});

// 5. 监控和统计
const stats = {
  requests: 0,
  errors: 0,
  responseTime: [],
};

app.use((req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    stats.requests++;

    if (res.statusCode >= 400) {
      stats.errors++;
    }

    stats.responseTime.push(responseTime);

    // 只保留最近1000个响应时间
    if (stats.responseTime.length > 1000) {
      stats.responseTime.shift();
    }
  });

  next();
});

app.get('/stats', (req, res) => {
  const avgResponseTime = stats.responseTime.length > 0
    ? stats.responseTime.reduce((a, b) => a + b, 0) / stats.responseTime.length
    : 0;

  res.json({
    success: true,
    data: {
      totalRequests: stats.requests,
      totalErrors: stats.errors,
      errorRate: stats.errors / stats.requests,
      avgResponseTime,
    },
  });
});
```

---

## 5. API文档与测试

### 5.1 OpenAPI/Swagger文档

```yaml
# openapi.yaml
openapi: 3.0.0
info:
  title: 用户管理API
  description: 用户管理系统的RESTful API文档
  version: 1.0.0
  contact:
    name: API支持
    email: support@example.com

servers:
  - url: https://api.example.com/v1
    description: 生产环境
  - url: https://staging-api.example.com/v1
    description: 测试环境
  - url: http://localhost:3000/v1
    description: 开发环境

paths:
  /users:
    get:
      summary: 获取用户列表
      description: 获取分页的用户列表，支持过滤和排序
      tags:
        - 用户
      parameters:
        - name: page
          in: query
          description: 页码
          required: false
          schema:
            type: integer
            minimum: 1
            default: 1
        - name: limit
          in: query
          description: 每页数量
          required: false
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
        - name: sort
          in: query
          description: 排序字段
          required: false
          schema:
            type: string
            enum: [id, name, email, createdAt]
            default: createdAt
        - name: order
          in: query
          description: 排序方向
          required: false
          schema:
            type: string
            enum: [asc, desc]
            default: desc
      responses:
        '200':
          description: 成功
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/User'
                  pagination:
                    $ref: '#/components/schemas/Pagination'
        '401':
          description: 未认证
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
    post:
      summary: 创建用户
      description: 创建新用户
      tags:
        - 用户
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserInput'
      responses:
        '201':
          description: 创建成功
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    $ref: '#/components/schemas/User'
                  message:
                    type: string
        '400':
          description: 参数错误
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '409':
          description: 邮箱已存在
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /users/{userId}:
    get:
      summary: 获取单个用户
      description: 根据ID获取用户详情
      tags:
        - 用户
      parameters:
        - name: userId
          in: path
          description: 用户ID
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: 成功
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    $ref: '#/components/schemas/User'
        '404':
          description: 用户不存在
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
          description: 用户ID
        name:
          type: string
          description: 用户姓名
        email:
          type: string
          format: email
          description: 用户邮箱
        age:
          type: integer
          description: 用户年龄
        createdAt:
          type: string
          format: date-time
          description: 创建时间
      required:
        - id
        - name
        - email
        - createdAt

    CreateUserInput:
      type: object
      properties:
        name:
          type: string
          minLength: 2
          maxLength: 50
        email:
          type: string
          format: email
        password:
          type: string
          minLength: 8
        age:
          type: integer
          minimum: 0
          maximum: 120
      required:
        - name
        - email
        - password

    Pagination:
      type: object
      properties:
        page:
          type: integer
          description: 当前页码
        limit:
          type: integer
          description: 每页数量
        total:
          type: integer
          description: 总记录数
        totalPages:
          type: integer
          description: 总页数

    Error:
      type: object
      properties:
        success:
          type: boolean
          example: false
        error:
          type: object
          properties:
            code:
              type: string
              description: 错误代码
            message:
              type: string
              description: 错误信息
            details:
              type: object
              description: 错误详情
```

### 5.2 API测试

```javascript
// 1. Jest测试示例
// tests/api/users.test.js
const request = require('supertest');
const app = require('../../app');
const db = require('../../config/database');

describe('用户API测试', () => {
  beforeAll(async () => {
    await db.sync({ force: true });
  });

  afterAll(async () => {
    await db.close();
  });

  describe('GET /api/v1/users', () => {
    test('应该返回用户列表', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    test('应该支持分页', async () => {
      const response = await request(app)
        .get('/api/v1/users?page=1&limit=10')
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });

    test('应该支持排序', async () => {
      const response = await request(app)
        .get('/api/v1/users?sort=name&order=asc')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/users', () => {
    test('应该创建用户', async () => {
      const userData = {
        name: '张三',
        email: 'zhangsan@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/v1/users')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(userData.name);
      expect(response.body.data.email).toBe(userData.email);
    });

    test('应该验证必填字段', async () => {
      const userData = {
        name: '张三',
        // 缺少email和password
      };

      const response = await request(app)
        .post('/api/v1/users')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('应该拒绝重复邮箱', async () => {
      const userData = {
        name: '李四',
        email: 'zhangsan@example.com',  // 已存在的邮箱
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/v1/users')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });
  });

  describe('GET /api/v1/users/:id', () => {
    test('应该返回用户详情', async () => {
      const response = await request(app)
        .get('/api/v1/users/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(1);
    });

    test('应该返回404当用户不存在', async () => {
      const response = await request(app)
        .get('/api/v1/users/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });
  });
});

// 2. Playwright E2E测试
// tests/e2e/api.spec.ts
import { test, expect } from '@playwright/test';

test.describe('API E2E测试', () => {
  test('用户注册流程', async ({ request }) => {
    // 注册用户
    const registerResponse = await request.post('https://api.example.com/v1/users', {
      name: '张三',
      email: 'zhangsan@example.com',
      password: 'password123',
    });

    expect(registerResponse.ok()).toBeTruthy();
    const registerData = await registerResponse.json();
    expect(registerData.success).toBe(true);
    expect(registerData.data.email).toBe('zhangsan@example.com');

    // 登录用户
    const loginResponse = await request.post('https://api.example.com/v1/auth/login', {
      email: 'zhangsan@example.com',
      password: 'password123',
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    expect(loginData.success).toBe(true);
    expect(loginData.data.token).toBeDefined();
  });

  test('创建订单流程', async ({ request }) => {
    // 登录获取token
    const loginResponse = await request.post('https://api.example.com/v1/auth/login', {
      email: 'zhangsan@example.com',
      password: 'password123',
    });

    const loginData = await loginResponse.json();
    const token = loginData.data.token;

    // 创建订单
    const orderResponse = await request.post('https://api.example.com/v1/orders', {
      userId: 1,
      items: [
        {
          productId: 1,
          quantity: 2,
        },
      ],
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(orderResponse.ok()).toBeTruthy();
    const orderData = await orderResponse.json();
    expect(orderData.success).toBe(true);
    expect(orderData.data.status).toBe('PENDING');
  });
});

// 3. 性能测试
// tests/performance/api.perf.js
const autocannon = require('autocannon');

async function runPerformanceTest() {
  const result = await autocannon({
    url: 'http://localhost:3000/api/v1/users',
    connections: 100,  // 并发连接数
    duration: 30,  // 持续时间（秒）
  });

  console.log(result);
  console.log('平均延迟:', result.latency.mean);
  console.log('吞吐量:', result.requests.mean, '请求/秒');
}

runPerformanceTest().catch(console.error);
```

---

## 6. API安全与认证

### 6.1 JWT认证

```javascript
// 1. JWT工具函数
// utils/jwt.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';
const JWT_REFRESH_EXPIRES_IN = '30d';

// 生成访问令牌
function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

// 生成刷新令牌
function generateRefreshToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });
}

// 验证令牌
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('无效的令牌');
  }
}

// 解码令牌（不验证）
function decodeToken(token) {
  return jwt.decode(token);
}

// 生成令牌对
function generateTokenPair(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    roles: user.roles,
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
  generateTokenPair,
};

// 2. 认证中间件
// middleware/auth.js
const { verifyToken } = require('../utils/jwt');

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '未提供认证令牌',
      },
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: '无效的令牌',
      },
    });
  }
}

// 可选认证
function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = verifyToken(token);
      req.user = decoded;
    } catch (error) {
      // 忽略错误
    }
  }

  next();
}

// 角色验证
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未认证',
        },
      });
    }

    if (!roles.some(role => req.user.roles.includes(role))) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '无权限',
        },
      });
    }

    next();
  };
}

module.exports = {
  authenticate,
  optionalAuthenticate,
  authorize,
};

// 3. 认证路由
// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 登录
router.post('/login', authController.login);

// 注册
router.post('/register', authController.register);

// 刷新令牌
router.post('/refresh', authController.refreshToken);

// 登出
router.post('/logout', authenticate, authController.logout);

// 获取当前用户
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;

// 4. 认证控制器
// controllers/authController.js
const UserService = require('../services/UserService');
const { generateTokenPair } = require('../utils/jwt');
const { AppError } = require('../utils/errors');

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await UserService.findByEmail(email);
      if (!user) {
        throw new AppError('INVALID_CREDENTIALS', '邮箱或密码错误', 401);
      }

      const isValidPassword = await UserService.verifyPassword(
        user,
        password
      );

      if (!isValidPassword) {
        throw new AppError('INVALID_CREDENTIALS', '邮箱或密码错误', 401);
      }

      const tokens = generateTokenPair(user);

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            roles: user.roles,
          },
          ...tokens,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async register(req, res, next) {
    try {
      const user = await UserService.create(req.body);
      const tokens = generateTokenPair(user);

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            roles: user.roles,
          },
          ...tokens,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      const decoded = verifyToken(refreshToken);
      const user = await UserService.getUserById(decoded.userId);

      if (!user) {
        throw new AppError('USER_NOT_FOUND', '用户不存在', 404);
      }

      const tokens = generateTokenPair(user);

      res.json({
        success: true,
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      // 在实际应用中，这里应该将刷新令牌加入黑名单
      res.json({
        success: true,
        message: '登出成功',
      });
    } catch (error) {
      next(error);
    }
  }

  async getCurrentUser(req, res, next) {
    try {
      const user = await UserService.getUserById(req.user.userId);

      if (!user) {
        throw new AppError('USER_NOT_FOUND', '用户不存在', 404);
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          roles: user.roles,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
```

### 6.2 OAuth 2.0实现

```javascript
// OAuth 2.0授权码流程
// 1. 授权端点
app.get('/oauth/authorize', (req, res) => {
  const {
    response_type = 'code',
    client_id,
    redirect_uri,
    scope,
    state,
  } = req.query;

  // 验证client_id
  const client = await Client.findByClientId(client_id);
  if (!client) {
    return res.status(400).json({
      error: 'invalid_client',
    });
  }

  // 检查用户是否已登录
  if (!req.user) {
    return res.redirect(`/login?redirect_uri=${encodeURIComponent(req.originalUrl)}`);
  }

  // 显示授权页面
  res.render('authorize', {
    client,
    scope,
    state,
    redirect_uri,
  });
});

// 2. 授权确认
app.post('/oauth/authorize', async (req, res) => {
  const {
    client_id,
    redirect_uri,
    scope,
    state,
    approve,
  } = req.body;

  if (approve !== 'true') {
    // 用户拒绝授权
    return res.redirect(`${redirect_uri}?error=access_denied&state=${state}`);
  }

  // 生成授权码
  const code = generateAuthorizationCode({
    userId: req.user.id,
    clientId: client_id,
    scope,
  });

  // 重定向到回调地址
  res.redirect(`${redirect_uri}?code=${code}&state=${state}`);
});

// 3. 令牌端点
app.post('/oauth/token', async (req, res) => {
  const {
    grant_type,
    code,
    redirect_uri,
    client_id,
    client_secret,
    refresh_token,
  } = req.body;

  if (grant_type === 'authorization_code') {
    // 授权码模式
    const authorizationCode = await AuthorizationCode.findByCode(code);
    if (!authorizationCode) {
      return res.status(400).json({
        error: 'invalid_grant',
      });
    }

    // 验证client
    const client = await Client.findByClientId(client_id);
    if (!client || client.secret !== client_secret) {
      return res.status(400).json({
        error: 'invalid_client',
      });
    }

    // 生成访问令牌
    const accessToken = generateAccessToken({
      userId: authorizationCode.userId,
      clientId: client_id,
      scope: authorizationCode.scope,
    });

    const refreshToken = generateRefreshToken({
      userId: authorizationCode.userId,
      clientId: client_id,
      scope: authorizationCode.scope,
    });

    // 删除授权码
    await authorizationCode.destroy();

    res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 3600,
    });
  } else if (grant_type === 'refresh_token') {
    // 刷新令牌模式
    const decoded = verifyRefreshToken(refresh_token);

    const accessToken = generateAccessToken({
      userId: decoded.userId,
      clientId: decoded.clientId,
      scope: decoded.scope,
    });

    res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
    });
  } else {
    res.status(400).json({
      error: 'unsupported_grant_type',
    });
  }
});
```

---

## 参考资源

- [RESTful API设计指南](https://restfulapi.net/)
- [OpenAPI规范](https://swagger.io/specification/)
- [GraphQL官方文档](https://graphql.org/)
- [Apollo Server](https://www.apollographql.com/docs/apollo-server/)
- [JWT.io](https://jwt.io/)

---

*本文档持续更新，最后更新于2026年3月*