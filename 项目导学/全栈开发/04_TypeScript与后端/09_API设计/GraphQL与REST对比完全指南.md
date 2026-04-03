# GraphQL与REST对比完全指南

## 概述

在现代Web应用开发中，API（应用程序编程接口）是前后端通信的核心枢纽。选择合适的API设计风格，对于系统的可维护性、性能和开发效率都有着深远的影响。

目前业界最主流的两种API设计风格是**REST（Representational State Transfer）**和**GraphQL**。REST作为一种成熟的架构风格，已经被广泛采用；而GraphQL则由Facebook在2015年开源，凭借其灵活的数据获取能力，近年来在社区中获得了极高的关注度。

本指南将深入剖析这两种API设计风格的核心理念、实现机制、使用场景和最佳实践，帮助开发者在实际项目中做出明智的技术选型决策。

---

## 第一部分：REST API深入解析

### 1.1 REST架构风格详解

REST（表述性状态转移）是由Roy Fielding在其2000年的博士论文中提出的一种软件架构风格。它不是一种具体的技术规范，而是一组设计原则和约束条件。

#### 1.1.1 REST的六大核心原则

**客户端-服务器架构（Client-Server Architecture）**

客户端和服务器端应当分离，客户端负责用户界面和用户体验，服务器端负责数据存储和业务逻辑。这种分离使得两边可以独立演进，客户端可以支持多种平台（Web、iOS、Android），而服务器端的技术升级不会影响客户端。

**无状态（Stateless）**

每个请求都必须包含所有必要的信息，服务器不需要存储任何客户端上下文。这意味着每个请求都是独立的，服务器处理完请求后不会保留任何客户端相关信息。这种设计简化了服务器的实现，提高了可伸缩性，因为任何服务器都可以处理任何请求。

**可缓存性（Cacheability）**

服务器响应应当明确标记是否可以缓存，以及缓存的时长。缓存可以减少网络请求次数，降低服务器负载，提升客户端响应速度。RESTful API通常会使用HTTP的Cache-Control头来控制缓存行为。

**分层系统（Layered System）**

系统可以由多层结构组成，客户端不需要知道它直接连接的是终点服务器还是中间层（如负载均衡器、缓存服务器、API网关）。这种分层提高了系统的灵活性和可扩展性。

**统一接口（Uniform Interface）**

这是REST最核心的特征，它要求所有资源都通过统一的接口访问。统一接口包括四个子约束：资源标识符（如URL）、通过表述操作资源（如HTTP方法）、自描述消息（包含足够的信息来处理消息）、超媒体作为应用状态引擎（HATEOAS）。

**按需代码（Code on Demand）*

服务器可以向客户端发送可执行的代码（如JavaScript），扩展客户端的功能。这是一个可选的约束，在现代API设计中较少使用。

#### 1.1.2 资源、动词与状态码

**资源（Resources）**

在REST中，一切皆为资源。资源是任何可以被命名和操作的信息，比如用户（User）、文章（Post）、评论（Comment）等。每个资源都有一个唯一的标识符，在Web应用中通常使用URL来表示。

资源有几个关键概念需要理解：

- 资源实例：具体的某个资源，如ID为1的用户
- 资源集合：同类资源的集合，如所有用户的列表
- 子资源：从属于其他资源的资源，如某用户的文章

**HTTP动词（Verbs）**

RESTful API使用HTTP方法来表示对资源的操作：

| HTTP方法 | 含义 | 幂等性 | 安全性 | 常见用途 |
|---------|------|--------|--------|---------|
| GET | 获取资源 | 是 | 是 | 查询数据 |
| POST | 创建资源 | 否 | 否 | 新建数据 |
| PUT | 完整更新资源 | 是 | 否 | 替换数据 |
| PATCH | 部分更新资源 | 否 | 否 | 更新部分字段 |
| DELETE | 删除资源 | 是 | 否 | 删除数据 |

幂等性指的是执行多次相同操作与执行一次的效果相同。安全性指的是操作不会修改服务器端的数据。

**HTTP状态码（Status Codes）**

状态码是服务器对请求结果的标准化响应，客户端可以通过状态码判断请求是否成功，以及失败的原因：

```
1xx 信息性状态码
  - 100 Continue：服务器收到请求的初始部分，客户端应继续发送请求
  - 101 Switching Protocols：服务器同意切换协议（如HTTP升级为WebSocket）

2xx 成功状态码
  - 200 OK：请求成功，响应包含请求的内容
  - 201 Created：资源创建成功，响应包含新资源的URI
  - 204 No Content：请求成功，但响应不包含内容（常用于DELETE操作）

3xx 重定向状态码
  - 301 Moved Permanently：资源永久移动到新位置
  - 302 Found：资源临时移动到新位置
  - 304 Not Modified：资源未修改，可以使用缓存的版本

4xx 客户端错误状态码
  - 400 Bad Request：请求格式错误或参数无效
  - 401 Unauthorized：请求需要身份认证
  - 403 Forbidden：服务器拒绝执行请求（即使已认证）
  - 404 Not Found：请求的资源不存在
  - 409 Conflict：请求与服务器当前状态冲突（如重复创建）
  - 422 Unprocessable Entity：请求格式正确但语义错误
  - 429 Too Many Requests：请求频率超出限制

5xx 服务器错误状态码
  - 500 Internal Server Error：服务器内部错误
  - 502 Bad Gateway：网关收到无效响应
  - 503 Service Unavailable：服务暂时不可用
  - 504 Gateway Timeout：网关等待上游服务器超时
```

### 1.2 RESTful设计原则

#### 1.2.1 良好的URL设计

RESTful API的URL应当清晰地表达资源的层级关系和操作意图：

```typescript
// ❌ 错误的RESTful URL设计
GET /getUser?id=1
POST /createUser
PUT /updateUser/1
DELETE /deleteUser/1

// ✅ 正确的RESTful URL设计
GET /users/1          // 获取单个用户
GET /users            // 获取用户列表
POST /users           // 创建用户
PUT /users/1          // 完整更新用户
PATCH /users/1        // 部分更新用户
DELETE /users/1       // 删除用户
```

资源命名应当遵循以下规范：

- 使用复数名词表示资源集合（/users而非/user）
- 使用小写字母和连字符（kebab-case）提高可读性（/user-profiles而非/userProfiles）
- 避免在URL中使用动词，让HTTP方法承担语义
- 使用嵌套表示资源的从属关系（/users/1/posts表示用户1的所有文章）

```typescript
// 资源嵌套层级示例
GET /users/1                      // 获取用户1的信息
GET /users/1/posts                // 获取用户1的所有文章
GET /users/1/posts/5               // 获取用户1的第5篇文章
GET /users/1/posts/5/comments     // 获取用户1第5篇文章的所有评论
```

#### 1.2.2 查询参数与路径参数

合理区分路径参数和查询参数的使用场景：

```typescript
// 路径参数：用于标识特定资源
GET /users/1          // 获取ID为1的用户
GET /posts/10         // 获取ID为10的文章

// 查询参数：用于过滤、排序、分页
GET /users?role=admin           // 过滤管理员用户
GET /users?sort=created_at&order=desc   // 按创建时间降序排序
GET /users?page=2&per_page=20    // 分页获取用户
GET /posts?status=published&category=tech  // 组合过滤条件

// 复杂查询可以使用查询字符串
GET /posts?tags=javascript,react&author_id=1&published=true
```

#### 1.2.3 版本管理策略

API版本管理是RESTful设计中的重要考虑因素，主要有以下几种策略：

```typescript
// 策略一：URL路径版本（最常用）
GET /api/v1/users
GET /api/v2/users

// 策略二：查询参数版本（不推荐，缓存不友好）
GET /api/users?version=2

// 策略三：HTTP头版本（不直观，使用较少）
GET /api/users
Headers: {
  "API-Version": "2"
}

// 策略四：Content Negotiation（基于Accept头）
GET /api/users
Headers: {
  "Accept": "application/vnd.myapi.v2+json"
}
```

URL路径版本是最直观和常用的方式，便于调试和测试。版本变更应当是向后兼容的，或者在破坏性变更时提供充分的过渡期。

#### 1.2.4 统一响应格式

建立统一的API响应格式，便于客户端处理和错误追踪：

```typescript
// 成功响应格式
{
  "success": true,
  "data": {
    "id": 1,
    "name": "张三",
    "email": "zhangsan@example.com",
    "created_at": "2026-01-15T10:30:00Z"
  },
  "meta": {
    "timestamp": "2026-04-02T12:00:00Z"
  }
}

// 列表响应格式（包含分页信息）
{
  "success": true,
  "data": [
    { "id": 1, "name": "张三" },
    { "id": 2, "name": "李四" }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  },
  "meta": {
    "timestamp": "2026-04-02T12:00:00Z"
  }
}

// 错误响应格式
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "输入数据验证失败",
    "details": [
      { "field": "email", "message": "邮箱格式不正确" },
      { "field": "age", "message": "年龄必须大于0" }
    ]
  },
  "meta": {
    "timestamp": "2026-04-02T12:00:00Z",
    "request_id": "req_abc123"
  }
}
```

### 1.3 REST API最佳实践

#### 1.3.1 安全性实践

```typescript
// 认证机制：使用JWT Token
// 请求头携带Token
Headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

// 速率限制：通过响应头告知客户端限制
Headers: {
  "X-RateLimit-Limit": "100",           // 时间窗口内的最大请求数
  "X-RateLimit-Remaining": "95",         // 剩余可用请求数
  "X-RateLimit-Reset": "1712054400"       // 限制重置时间戳
}

// CORS配置：控制跨域访问
Headers: {
  "Access-Control-Allow-Origin": "https://example.com",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
}
```

#### 1.3.2 性能优化策略

```typescript
// 条件请求：减少不必要的数据传输
// 使用ETag进行缓存验证
GET /users/1
Headers: {
  "If-None-Match": "33a64df551425fcc55e4d42a148795d9f25f89d4"
}

// 响应（资源未变化）
Status: 304 Not Modified

// 部分资源获取：使用fields参数
GET /users/1?fields=id,name,email
// 响应只包含指定字段
{
  "id": 1,
  "name": "张三",
  "email": "zhangsan@example.com"
}

// 压缩传输：启用Gzip压缩
Headers: {
  "Accept-Encoding": "gzip, deflate, br"
}
```

#### 1.3.3 REST的局限性

尽管RESTful API被广泛采用，但它也存在一些固有的局限性：

**Over-fetching（过度获取）**

REST API返回的是固定格式的资源，无法让客户端精确指定需要哪些字段。这意味着客户端通常会获取大量不需要的数据，造成带宽浪费。

```typescript
// 场景：客户端只需要用户的姓名和头像
// REST API响应（过度获取）
GET /users/1

// 服务器返回完整用户对象，包含大量不需要的字段
{
  "id": 1,
  "name": "张三",
  "avatar": "https://example.com/avatars/1.jpg",
  "email": "zhangsan@example.com",
  "phone": "13800138000",
  "address": "北京市朝阳区...",
  "birthday": "1990-01-01",
  "bio": "这是一个很长的个人简介...",
  "created_at": "2020-01-01T00:00:00Z",
  "updated_at": "2026-01-01T00:00:00Z",
  // ...可能有几十个字段
}

// 实际上客户端只需要：
{
  "name": "张三",
  "avatar": "https://example.com/avatars/1.jpg"
}
```

**Under-fetching（获取不足）**

单个REST端点返回的资源往往不包含关联数据，如果需要关联数据，可能需要进行多次请求（多次往返）。

```typescript
// 场景：获取用户列表及其最新文章标题
// REST方式需要两次请求

// 第一次：获取用户列表
GET /users
// 响应
[
  { "id": 1, "name": "张三" },
  { "id": 2, "name": "李四" }
]

// 第二次：获取每个用户的最新文章
GET /users/1/latest-post
GET /users/2/latest-post
// 如果列表有100个用户，就需要101次请求（1次获取列表+100次获取文章）
```

**版本管理复杂度**

随着业务发展，API需要不断演进。RESTful API通常需要通过版本号来管理不同的API格式，这会导致维护多套API的问题。

---

## 第二部分：GraphQL核心解析

### 2.1 GraphQL是什么

GraphQL是一种用于API的数据查询和操作语言，由Facebook在2015年开源。与REST不同，GraphQL不是一种架构风格，而是一种查询语言和运行时。

#### 2.1.1 GraphQL的核心概念

**Schema定义（Schema-First）**

GraphQL采用强类型Schema-first的开发模式，先定义API可以提供哪些类型的数据，客户端再根据需要进行查询。

```typescript
// GraphQL Schema示例
const typeDefs = `
  type User {
    id: ID!
    name: String!
    email: String!
    avatar: String
    posts: [Post!]!
  }

  type Post {
    id: ID!
    title: String!
    content: String!
    author: User!
    comments: [Comment!]!
    createdAt: DateTime!
  }

  type Comment {
    id: ID!
    content: String!
    author: User!
    createdAt: DateTime!
  }

  type Query {
    user(id: ID!): User
    users(role: String, limit: Int): [User!]!
    post(id: ID!): Post
    posts(category: String, page: Int, perPage: Int): [Post!]!
  }

  type Mutation {
    createUser(input: CreateUserInput!): User!
    updateUser(id: ID!, input: UpdateUserInput!): User
    deleteUser(id: ID!): Boolean!
  }
`;
```

#### 2.1.2 GraphQL vs REST对比

| 维度 | REST | GraphQL |
|------|------|---------|
| 数据获取 | 固定端点返回完整资源 | 客户端指定需要的字段 |
| 请求次数 | 通常需要多次请求获取关联数据 | 单次请求获取复杂依赖图 |
| 类型系统 | 无内置类型系统（依赖文档） | 内置强类型Schema |
| 版本管理 | 需要版本号管理（如v1、v2） | Schema演进，无需版本号 |
| 缓存 | HTTP缓存，URL级别 | 客户端缓存，字段级别 |
| 学习曲线 | 较低，概念直观 | 较高，需要理解类型系统 |
| 工具生态 | 成熟（Swagger、Postman） | 成熟（Apollo、GraphiQL） |
| 适用场景 | 简单CRUD、资源导向 | 复杂数据依赖、灵活查询 |

### 2.2 GraphQL Schema定义

#### 2.2.1 标量类型与对象类型

GraphQL内置五种标量类型：

- `Int`：32位有符号整数
- `Float`：双精度浮点数
- `String`：UTF-8字符序列
- `Boolean`：布尔值
- `ID`：唯一标识符，序列化为字符串

自定义对象类型由多个字段组成：

```typescript
const typeDefs = `
  # 用户对象类型
  type User {
    # ID字段！表示非空
    id: ID!
    name: String!
    email: String!
    # 可选字段没有！
    avatar: String
    age: Int
    # 嵌套对象数组
    friends: [User!]!
  }

  # 文章对象类型
  type Post {
    id: ID!
    title: String!
    content: String!
    # 返回User类型
    author: User!
    # 返回Comment数组
    comments: [Comment!]!
    # 枚举类型字段
    status: PostStatus!
    # 接口类型字段
    metadata: ContentMetadata!
  }

  # 枚举类型
  enum PostStatus {
    DRAFT
    PUBLISHED
    ARCHIVED
  }

  # 接口类型
  interface ContentMetadata {
    viewCount: Int!
    likeCount: Int!
  }

  # 实现接口的类型
  type VideoMetadata implements ContentMetadata {
    viewCount: Int!
    likeCount: Int!
    duration: Int!
  }

  type ArticleMetadata implements ContentMetadata {
    viewCount: Int!
    likeCount: Int!
    readingTime: Int!
  }
`;
```

#### 2.2.2 Input类型

Input类型用于向Mutation传递复杂对象参数，类似于类型定义但不包含字段解析逻辑：

```typescript
const typeDefs = `
  # Input类型用于Mutation参数
  input CreateUserInput {
    name: String!
    email: String!
    password: String!
    age: Int
    avatar: String
  }

  input UpdateUserInput {
    name: String
    email: String
    age: Int
    avatar: String
  }

  input PostFilterInput {
    category: String
    tags: [String!]
    authorId: ID
    status: PostStatus
    dateRange: DateRangeInput
  }

  input DateRangeInput {
    start: DateTime!
    end: DateTime!
  }

  type Mutation {
    # 使用Input类型
    createUser(input: CreateUserInput!): User!
    updateUser(id: ID!, input: UpdateUserInput!): User
    createPost(title: String!, content: String!, input: PostFilterInput): Post
  }
`;
```

#### 2.2.3 接口与联合类型

接口（Interface）和联合类型（Union）用于处理类型多态：

```typescript
const typeDefs = `
  # 接口定义
  interface Node {
    id: ID!
  }

  interface Content {
    title: String!
    body: String!
  }

  # 实体类型实现接口
  type User implements Node {
    id: ID!
    name: String!
    email: String!
  }

  type Post implements Node & Content {
    id: ID!
    title: String!
    body: String!
    author: User!
    comments: [Comment!]!
  }

  type Comment implements Node {
    id: ID!
    content: String!
    author: User!
  }

  # 联合类型
  union SearchResult = User | Post | Comment

  type Query {
    # 返回接口类型
    node(id: ID!): Node

    # 返回联合类型
    search(query: String!): [SearchResult!]!
  }
`;

// 在Resolver中处理接口和联合类型
const resolvers = {
  Node: {
    __resolveType(obj) {
      if (obj.email) return 'User';
      if (obj.title) return 'Post';
      if (obj.content) return 'Comment';
      return null;
    },
  },
  SearchResult: {
    __resolveType(obj) {
      if (obj.email) return 'User';
      if (obj.title) return 'Post';
      if (obj.content) return 'Comment';
      return null;
    },
  },
};
```

### 2.3 Query查询详解

Query是GraphQL中用于获取数据的入口，类似于REST的GET请求。

#### 2.3.1 基本字段选择

GraphQL的核心优势在于客户端可以精确指定需要哪些字段：

```graphql
# 查询所有用户的基本信息
query {
  users {
    id
    name
    email
  }
}

# 响应：只返回请求的字段
{
  "data": {
    "users": [
      { "id": "1", "name": "张三", "email": "zhangsan@example.com" },
      { "id": "2", "name": "李四", "email": "lisi@example.com" }
    ]
  }
}
```

#### 2.3.2 参数传递

Query可以接受参数用于过滤、分页等场景：

```graphql
# 带参数的查询
query {
  # 查询特定用户
  user(id: "1") {
    id
    name
    avatar
  }

  # 过滤用户列表
  users(role: "admin", limit: 10) {
    id
    name
    role
  }

  # 分页查询文章
  posts(page: 1, perPage: 20) {
    id
    title
    author {
      name
    }
    createdAt
  }
}
```

#### 2.3.3 别名与片段

```graphql
# 使用别名区分同名字段
query {
  china: country(code: "CN") {
    name
    population
  }
  japan: country(code: "JP") {
    name
    population
  }
  usa: country(code: "US") {
    name
    population
  }
}

# 使用Fragment复用字段选择
fragment UserBasic on User {
  id
  name
  avatar
}

fragment PostWithAuthor on Post {
  id
  title
  author {
    ...UserBasic
  }
}

query {
  posts {
    ...PostWithAuthor
    comments {
      author {
        ...UserBasic
      }
    }
  }
}
```

#### 2.3.4 变量传递

使用变量使Query更加灵活和安全：

```graphql
# 使用变量的Query
query GetUser($userId: ID!, $includePosts: Boolean = false) {
  user(id: $userId) {
    id
    name
    email
    avatar
    # 条件包含字段
    posts @include(if: $includePosts) {
      id
      title
    }
  }
}

# 对应的变量
{
  "userId": "1",
  "includePosts": true
}
```

### 2.4 Mutation变更详解

Mutation用于创建、更新、删除数据，类似于REST的POST/PUT/DELETE。

#### 2.4.1 创建数据

```graphql
# 创建用户
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    name
    email
    createdAt
  }
}

# 变量
{
  "input": {
    "name": "王五",
    "email": "wangwu@example.com",
    "password": "securePassword123",
    "age": 28
  }
}
```

#### 2.4.2 更新数据

```graphql
# 更新用户信息
mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
  updateUser(id: $id, input: $input) {
    id
    name
    email
    avatar
    updatedAt
  }
}

# 变量
{
  "id": "1",
  "input": {
    "name": "张三（已更新）",
    "avatar": "https://example.com/new-avatar.jpg"
  }
}

# 删除数据
mutation DeleteUser($id: ID!) {
  deleteUser(id: $id)
}
```

#### 2.4.3 批量操作

```graphql
# 批量创建文章
mutation CreatePosts($inputs: [CreatePostInput!]!) {
  createPosts(inputs: $inputs) {
    id
    title
    author {
      name
    }
  }
}

# 变量
{
  "inputs": [
    { "title": "第一篇文章", "content": "内容1", "authorId": "1" },
    { "title": "第二篇文章", "content": "内容2", "authorId": "1" },
    { "title": "第三篇文章", "content": "内容3", "authorId": "2" }
  ]
}
```

### 2.5 Subscription订阅详解

Subscription用于实时数据推送，基于WebSocket协议实现：

```graphql
# Schema定义
type Subscription {
  # 监听新评论
  commentAdded(postId: ID!): Comment!
  # 监听用户消息
  newMessage(conversationId: ID!): Message!
  # 监听在线状态变化
  userStatusChanged(userId: ID!): UserStatus!
}

# 客户端订阅
subscription OnNewComment($postId: ID!) {
  commentAdded(postId: $postId) {
    id
    content
    author {
      name
      avatar
    }
    createdAt
  }
}

# 变量
{
  "postId": "1"
}
```

### 2.6 GraphQL实战：定义博客Schema

下面是一个完整的博客系统GraphQL Schema设计：

```typescript
// schema.ts - 博客系统完整Schema
import { gql } from 'apollo-server';

export const typeDefs = gql`
  # 日期时间标量类型
  scalar DateTime

  # 枚举类型
  enum PostStatus {
    DRAFT
    PUBLISHED
    ARCHIVED
  }

  enum OrderDirection {
    ASC
    DESC
  }

  # Input类型
  input CreateUserInput {
    username: String!
    email: String!
    password: String!
    displayName: String
    bio: String
  }

  input UpdateUserInput {
    displayName: String
    bio: String
    avatar: String
  }

  input CreatePostInput {
    title: String!
    content: String!
    summary: String
    coverImage: String
    tags: [String!]
    categoryId: ID
  }

  input UpdatePostInput {
    title: String
    content: String
    summary: String
    coverImage: String
    tags: [String!]
    status: PostStatus
  }

  input PostFilterInput {
    category: String
    tags: [String!]
    authorId: ID
    status: PostStatus
    search: String
  }

  input CommentFilterInput {
    postId: ID!
  }

  input PaginationInput {
    page: Int = 1
    perPage: Int = 10
  }

  input SortInput {
    field: String!
    direction: OrderDirection = DESC
  }

  # 接口类型
  interface Node {
    id: ID!
  }

  interface Content {
    title: String!
    body: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # 对象类型
  type User implements Node {
    id: ID!
    username: String!
    email: String!
    displayName: String!
    avatar: String
    bio: String
    posts(filter: PostFilterInput, pagination: PaginationInput): PostConnection!
    comments(pagination: PaginationInput): [Comment!]!
    followers: [User!]!
    following: [User!]!
    followerCount: Int!
    followingCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Post implements Node & Content {
    id: ID!
    title: String!
    slug: String!
    content: String!
    summary: String
    coverImage: String
    status: PostStatus!
    tags: [String!]!
    author: User!
    category: Category
    comments: [Comment!]!
    commentCount: Int!
    viewCount: Int!
    likeCount: Int!
    isLiked: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Category implements Node {
    id: ID!
    name: String!
    slug: String!
    description: String
    postCount: Int!
    posts(pagination: PaginationInput): [Post!]!
  }

  type Comment implements Node {
    id: ID!
    content: String!
    author: User!
    post: Post!
    parent: Comment
    replies: [Comment!]!
    likeCount: Int!
    isLiked: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Message implements Node {
    id: ID!
    content: String!
    sender: User!
    conversation: Conversation!
    isRead: Boolean!
    createdAt: DateTime!
  }

  type Conversation implements Node {
    id: ID!
    participants: [User!]!
    messages(pagination: PaginationInput): [Message!]!
    lastMessage: Message
    unreadCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type UserStatus {
    user: User!
    status: String!
    lastSeen: DateTime!
  }

  # 连接类型（用于分页）
  type PostConnection {
    edges: [PostEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type PostEdge {
    node: Post!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  # 认证相关类型
  type AuthPayload {
    token: String!
    user: User!
  }

  type LoginPayload {
    token: String!
    user: User!
  }

  # 联合类型
  union SearchResult = User | Post | Comment

  # 查询类型
  type Query {
    # 节点查询（接口实践）
    node(id: ID!): Node

    # 用户查询
    me: User
    user(id: ID, username: String): User
    users(pagination: PaginationInput, sort: SortInput): [User!]!
    searchUsers(query: String!): [User!]!

    # 文章查询
    post(id: ID, slug: String): Post
    posts(
      filter: PostFilterInput
      pagination: PaginationInput
      sort: SortInput
    ): PostConnection!
    featuredPosts(limit: Int = 5): [Post!]!
    relatedPosts(postId: ID!, limit: Int = 5): [Post!]!

    # 分类查询
    categories: [Category!]!
    category(id: ID, slug: String): Category

    # 评论查询
    comments(filter: CommentFilterInput!, pagination: PaginationInput): [Comment!]!

    # 搜索
    search(query: String!): [SearchResult!]!

    # 消息查询
    conversations: [Conversation!]!
    conversation(id: ID!): Conversation
  }

  # 变更类型
  type Mutation {
    # 认证
    register(input: CreateUserInput!): AuthPayload!
    login(email: String!, password: String!): LoginPayload!

    # 用户
    updateProfile(input: UpdateUserInput!): User!
    followUser(userId: ID!): User!
    unfollowUser(userId: ID!): User!

    # 文章
    createPost(input: CreatePostInput!): Post!
    updatePost(id: ID!, input: UpdatePostInput!): Post
    deletePost(id: ID!): Boolean!
    publishPost(id: ID!): Post!
    likePost(id: ID!): Post!
    unlikePost(id: ID!): Post!

    # 评论
    createComment(postId: ID!, content: String!, parentId: ID): Comment!
    updateComment(id: ID!, content: String!): Comment
    deleteComment(id: ID!): Boolean!
    likeComment(id: ID!): Comment!
    unlikeComment(id: ID!): Comment!

    # 消息
    sendMessage(conversationId: ID!, content: String!): Message!
    markAsRead(conversationId: ID!): Conversation!
  }

  # 订阅类型
  type Subscription {
    # 评论事件
    commentAdded(postId: ID!): Comment!
    commentUpdated(postId: ID!): Comment!
    commentDeleted(postId: ID!): ID!

    # 点赞事件
    postLiked(postId: ID!): Post!
    commentLiked(commentId: ID!): Comment!

    # 关注事件
    userFollowed(userId: ID!): User!
    userUnfollowed(userId: ID!): User!

    # 消息事件
    messageSent(conversationId: ID!): Message!
    messageRead(conversationId: ID!): Message!

    # 用户状态
    userOnline(userId: ID!): UserStatus!
  }
`;
```

---

## 第三部分：Apollo Server与Client

### 3.1 Apollo Server快速入门

Apollo Server是GraphQL生态中最流行的服务器实现，与各种Node.js框架（Express、Fastify、NestJS）都有良好的集成。

#### 3.1.1 基础配置

```typescript
// server.ts - Apollo Server基础配置
import { ApolloServer } from 'apollo-server';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

// 创建Apollo Server实例
const server = new ApolloServer({
  // Schema定义
  typeDefs,
  // 解析器映射
  resolvers,
  // 上下文配置
  context: ({ req }) => {
    // 从请求头提取用户信息
    const token = req.headers.authorization || '';
    const user = verifyToken(token);
    return { user };
  },
  // 验证规则
  validationRules: [],
  // 格式化错误
  formatError: (error) => {
    // 不在生产环境暴露内部错误
    if (process.env.NODE_ENV === 'production') {
      return {
        message: error.message,
        locations: error.locations,
        path: error.path,
      };
    }
    return error;
  },
  // 插件系统
  plugins: [
    // 审计日志插件
    {
      async requestDidStart({ request, queryHash }) {
        console.log(`[${new Date().toISOString()}] Query: ${queryHash}`);
        return {
          async didEncounterErrors({ errors }) {
            errors.forEach((err) => {
              console.error('GraphQL Error:', err);
            });
          },
        };
      },
    },
  ],
});

async function start() {
  const { url } = await server.listen(4000);
  console.log(`GraphQL Server ready at ${url}`);
}

start();
```

#### 3.1.2 与Express集成

```typescript
// express-server.ts - 使用Express作为HTTP层
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { authMiddleware, requireAuth } from './auth';

async function startServer() {
  const app = express();

  // 创建Apollo Server
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => {
      const user = await authMiddleware(req);
      return { user };
    },
    // 启用调试模式（仅开发环境）
    debug: process.env.NODE_ENV !== 'production',
  });

  // 启动Apollo Server
  await apolloServer.start();

  // 应用Apollo Server中间件
  apolloServer.applyMiddleware({
    app,
    path: '/graphql',
    cors: {
      origin: ['http://localhost:3000'],
      credentials: true,
    },
  });

  //  REST端点示例
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.listen(4000, () => {
    console.log('Server running at http://localhost:4000');
    console.log(`GraphQL endpoint: http://localhost:4000/graphql`);
  });
}

startServer();
```

### 3.2 Resolvers解析器

Resolver是GraphQL查询的实际执行函数，每个Schema字段都对应一个Resolver。

#### 3.2.1 基础Resolver结构

```typescript
// resolvers.ts - Resolver实现
import { IResolvers } from '@graphql-tools/utils';
import { Context } from './context';
import { prisma } from './database';
import { PubSub } from 'graphql-subscriptions';

// PubSub用于订阅功能
const pubsub = new PubSub();

// 评论相关事件
const COMMENT_EVENTS = {
  ADDED: 'COMMENT_ADDED',
  UPDATED: 'COMMENT_UPDATED',
  DELETED: 'COMMENT_DELETED',
};

export const resolvers: IResolvers<any, Context> = {
  // 处理接口类型解析
  Node: {
    __resolveType(obj: any) {
      if (obj.email) return 'User';
      if (obj.title) return 'Post';
      if (obj.content && obj.authorId) return 'Comment';
      return null;
    },
  },

  // DateTime标量类型解析
  DateTime: {
    __parseValue(value: string) {
      return new Date(value);
    },
    __serialize(value: Date) {
      return value.toISOString();
    },
    __parseLiteral(ast: any) {
      if (ast.kind === Kind.STRING) {
        return new Date(ast.value);
      }
      return null;
    },
  },

  // Query解析器
  Query: {
    // 获取当前登录用户
    me: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return prisma.user.findUnique({ where: { id: user.id } });
    },

    // 获取单个用户
    user: async (_, { id, username }, { prisma }) => {
      if (id) {
        return prisma.user.findUnique({ where: { id } });
      }
      if (username) {
        return prisma.user.findUnique({ where: { username } });
      }
      return null;
    },

    // 获取用户列表
    users: async (_, { pagination, sort }, { prisma }) => {
      const { page = 1, perPage = 10 } = pagination || {};
      const skip = (page - 1) * perPage;

      return prisma.user.findMany({
        skip,
        take: perPage,
        orderBy: sort?.field
          ? { [sort.field]: sort.direction?.toLowerCase() || 'asc' }
          : { createdAt: 'desc' },
      });
    },

    // 获取单篇文章
    post: async (_, { id, slug }, { prisma }) => {
      if (id) {
        return prisma.post.findUnique({ where: { id } });
      }
      if (slug) {
        return prisma.post.findUnique({ where: { slug } });
      }
      return null;
    },

    // 分页获取文章列表
    posts: async (_, { filter, pagination, sort }, { prisma }) => {
      const { page = 1, perPage = 10 } = pagination || {};
      const where: any = {};

      if (filter?.category) {
        where.category = { slug: filter.category };
      }
      if (filter?.tags?.length) {
        where.tags = { hasEvery: filter.tags };
      }
      if (filter?.authorId) {
        where.authorId = filter.authorId;
      }
      if (filter?.status) {
        where.status = filter.status;
      }
      if (filter?.search) {
        where.OR = [
          { title: { contains: filter.search, mode: 'insensitive' } },
          { content: { contains: filter.search, mode: 'insensitive' } },
        ];
      }

      const [posts, totalCount] = await Promise.all([
        prisma.post.findMany({
          where,
          skip: (page - 1) * perPage,
          take: perPage,
          orderBy: sort?.field
            ? { [sort.field]: sort.direction?.toLowerCase() || 'desc' }
            : { createdAt: 'desc' },
          include: { author: true, category: true },
        }),
        prisma.post.count({ where }),
      ]);

      return {
        edges: posts.map((post) => ({
          node: post,
          cursor: Buffer.from(post.id).toString('base64'),
        })),
        pageInfo: {
          hasNextPage: page * perPage < totalCount,
          hasPreviousPage: page > 1,
          startCursor: posts[0]?.id,
          endCursor: posts[posts.length - 1]?.id,
        },
        totalCount,
      };
    },

    // 搜索功能
    search: async (_, { query }, { prisma }) => {
      const [users, posts, comments] = await Promise.all([
        prisma.user.findMany({
          where: {
            OR: [
              { username: { contains: query, mode: 'insensitive' } },
              { displayName: { contains: query, mode: 'insensitive' } },
            ],
          },
        }),
        prisma.post.findMany({
          where: {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { content: { contains: query, mode: 'insensitive' } },
            ],
            status: 'PUBLISHED',
          },
        }),
        prisma.comment.findMany({
          where: {
            content: { contains: query, mode: 'insensitive' },
          },
        }),
      ]);

      return [...users, ...posts, ...comments];
    },
  },

  // Mutation解析器
  Mutation: {
    // 用户注册
    register: async (_, { input }, { prisma }) => {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email: input.email }, { username: input.username }],
        },
      });

      if (existingUser) {
        throw new Error('User with this email or username already exists');
      }

      const hashedPassword = await hashPassword(input.password);
      const user = await prisma.user.create({
        data: {
          ...input,
          password: hashedPassword,
          displayName: input.displayName || input.username,
        },
      });

      const token = generateToken(user);
      return { token, user };
    },

    // 用户登录
    login: async (_, { email, password }, { prisma }) => {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        throw new Error('Invalid credentials');
      }

      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        throw new Error('Invalid credentials');
      }

      const token = generateToken(user);
      return { token, user };
    },

    // 创建文章
    createPost: async (_, { input }, { prisma, user }) => {
      if (!user) throw new Error('Not authenticated');

      const slug = generateSlug(input.title);
      const post = await prisma.post.create({
        data: {
          ...input,
          slug,
          authorId: user.id,
          status: 'DRAFT',
        },
        include: { author: true },
      });

      return post;
    },

    // 更新文章
    updatePost: async (_, { id, input }, { prisma, user }) => {
      if (!user) throw new Error('Not authenticated');

      const post = await prisma.post.findUnique({ where: { id } });

      if (!post) throw new Error('Post not found');
      if (post.authorId !== user.id) throw new Error('Not authorized');

      if (input.title) {
        input.slug = generateSlug(input.title);
      }

      return prisma.post.update({
        where: { id },
        data: input,
        include: { author: true },
      });
    },

    // 删除文章
    deletePost: async (_, { id }, { prisma, user }) => {
      if (!user) throw new Error('Not authenticated');

      const post = await prisma.post.findUnique({ where: { id } });

      if (!post) throw new Error('Post not found');
      if (post.authorId !== user.id) throw new Error('Not authorized');

      await prisma.post.delete({ where: { id } });
      return true;
    },

    // 发布文章
    publishPost: async (_, { id }, { prisma, user }) => {
      if (!user) throw new Error('Not authenticated');

      const post = await prisma.post.findUnique({ where: { id } });

      if (!post) throw new Error('Post not found');
      if (post.authorId !== user.id) throw new Error('Not authorized');

      return prisma.post.update({
        where: { id },
        data: { status: 'PUBLISHED' },
        include: { author: true },
      });
    },

    // 创建评论
    createComment: async (_, { postId, content, parentId }, { prisma, user, pubsub }) => {
      if (!user) throw new Error('Not authenticated');

      const post = await prisma.post.findUnique({ where: { id: postId } });
      if (!post) throw new Error('Post not found');

      const comment = await prisma.comment.create({
        data: {
          content,
          postId,
          authorId: user.id,
          parentId,
        },
        include: { author: true, post: true },
      });

      // 发布订阅事件
      pubsub.publish(COMMENT_EVENTS.ADDED, {
        commentAdded: comment,
        postId,
      });

      return comment;
    },

    // 点赞文章
    likePost: async (_, { id }, { prisma, user, pubsub }) => {
      if (!user) throw new Error('Not authenticated');

      const existingLike = await prisma.like.findFirst({
        where: { postId: id, userId: user.id },
      });

      if (existingLike) {
        throw new Error('Already liked this post');
      }

      await prisma.like.create({
        data: { postId: id, userId: user.id },
      });

      const post = await prisma.post.update({
        where: { id },
        data: { likeCount: { increment: 1 } },
        include: { author: true },
      });

      // 发布点赞事件
      pubsub.publish('POST_LIKED', { postLiked: post, postId: id });

      return post;
    },

    // 发送消息
    sendMessage: async (_, { conversationId, content }, { prisma, user, pubsub }) => {
      if (!user) throw new Error('Not authenticated');

      // 验证用户是否参与该对话
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { participants: true },
      });

      if (!conversation) throw new Error('Conversation not found');
      if (!conversation.participants.some((p) => p.id === user.id)) {
        throw new Error('Not authorized');
      }

      const message = await prisma.message.create({
        data: {
          content,
          conversationId,
          senderId: user.id,
        },
        include: { sender: true, conversation: true },
      });

      // 更新对话的最后消息时间
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      // 发布消息事件
      pubsub.publish(`MESSAGE_SENT_${conversationId}`, {
        messageSent: message,
        conversationId,
      });

      return message;
    },
  },

  // Subscription解析器
  Subscription: {
    commentAdded: {
      subscribe: (_, { postId }, { pubsub }) => {
        return pubsub.asyncIterator([`${COMMENT_EVENTS.ADDED}_${postId}`]);
      },
    },
    postLiked: {
      subscribe: (_, { postId }, { pubsub }) => {
        return pubsub.asyncIterator([`POST_LIKED_${postId}`]);
      },
    },
    messageSent: {
      subscribe: (_, { conversationId }, { pubsub }) => {
        return pubsub.asyncIterator([`MESSAGE_SENT_${conversationId}`]);
      },
    },
  },

  // 嵌套类型解析器
  User: {
    posts: async (parent, { filter, pagination }, { prisma }) => {
      const { page = 1, perPage = 10 } = pagination || {};
      const where: any = { authorId: parent.id };

      if (filter?.status) where.status = filter.status;

      const [posts, totalCount] = await Promise.all([
        prisma.post.findMany({
          where,
          skip: (page - 1) * perPage,
          take: perPage,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.post.count({ where }),
      ]);

      return {
        edges: posts.map((post) => ({
          node: post,
          cursor: Buffer.from(post.id).toString('base64'),
        })),
        pageInfo: {
          hasNextPage: page * perPage < totalCount,
          hasPreviousPage: page > 1,
          startCursor: posts[0]?.id,
          endCursor: posts[posts.length - 1]?.id,
        },
        totalCount,
      };
    },
    followers: async (parent, _, { prisma }) => {
      const follows = await prisma.follow.findMany({
        where: { followingId: parent.id },
        include: { follower: true },
      });
      return follows.map((f) => f.follower);
    },
    following: async (parent, _, { prisma }) => {
      const follows = await prisma.follow.findMany({
        where: { followerId: parent.id },
        include: { following: true },
      });
      return follows.map((f) => f.following);
    },
    followerCount: (parent, _, { prisma }) =>
      prisma.follow.count({ where: { followingId: parent.id } }),
    followingCount: (parent, _, { prisma }) =>
      prisma.follow.count({ where: { followerId: parent.id } }),
  },

  Post: {
    author: (parent, _, { prisma }) =>
      prisma.user.findUnique({ where: { id: parent.authorId } }),
    category: (parent, _, { prisma }) =>
      parent.categoryId
        ? prisma.category.findUnique({ where: { id: parent.categoryId } })
        : null,
    comments: (parent, { pagination }, { prisma }) => {
      const { page = 1, perPage = 20 } = pagination || {};
      return prisma.comment.findMany({
        where: { postId: parent.id, parentId: null },
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: { author: true },
      });
    },
    commentCount: (parent, _, { prisma }) =>
      prisma.comment.count({ where: { postId: parent.id } }),
    isLiked: async (parent, _, { prisma, user }) => {
      if (!user) return false;
      const like = await prisma.like.findFirst({
        where: { postId: parent.id, userId: user.id },
      });
      return !!like;
    },
  },

  Comment: {
    author: (parent, _, { prisma }) =>
      prisma.user.findUnique({ where: { id: parent.authorId } }),
    post: (parent, _, { prisma }) =>
      prisma.post.findUnique({ where: { id: parent.postId } }),
    parent: (parent, _, { prisma }) =>
      parent.parentId
        ? prisma.comment.findUnique({ where: { id: parent.parentId } })
        : null,
    replies: (parent, _, { prisma }) =>
      prisma.comment.findMany({
        where: { parentId: parent.id },
        orderBy: { createdAt: 'asc' },
        include: { author: true },
      }),
    isLiked: async (parent, _, { prisma, user }) => {
      if (!user) return false;
      const like = await prisma.like.findFirst({
        where: { commentId: parent.id, userId: user.id },
      });
      return !!like;
    },
  },

  Conversation: {
    participants: (parent, _, { prisma }) =>
      prisma.conversationParticipant.findMany({
        where: { conversationId: parent.id },
        include: { user: true },
      }).then((parts) => parts.map((p) => p.user)),
    messages: (parent, { pagination }, { prisma }) => {
      const { page = 1, perPage = 50 } = pagination || {};
      return prisma.message.findMany({
        where: { conversationId: parent.id },
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: { sender: true },
      });
    },
    lastMessage: (parent, _, { prisma }) =>
      prisma.message.findFirst({
        where: { conversationId: parent.id },
        orderBy: { createdAt: 'desc' },
        include: { sender: true },
      }),
    unreadCount: async (parent, _, { prisma, user }) => {
      if (!user) return 0;
      return prisma.message.count({
        where: {
          conversationId: parent.id,
          senderId: { not: user.id },
          isRead: false,
        },
      });
    },
  },

  Message: {
    sender: (parent, _, { prisma }) =>
      prisma.user.findUnique({ where: { id: parent.senderId } }),
    conversation: (parent, _, { prisma }) =>
      prisma.conversation.findUnique({ where: { id: parent.conversationId } }),
  },

  // 联合类型解析器
  SearchResult: {
    __resolveType(obj: any) {
      if (obj.email) return 'User';
      if (obj.title) return 'Post';
      if (obj.content && obj.authorId) return 'Comment';
      return null;
    },
  },
};
```

### 3.3 Apollo Client使用

Apollo Client是GraphQL生态中最流行的客户端状态管理和数据获取库。

#### 3.3.1 基础配置

```typescript
// client.ts - Apollo Client配置
import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { setContext } from '@apollo/client/link/context';

// 错误处理链接
const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );

      // 处理认证错误
      if (extensions?.code === 'UNAUTHENTICATED') {
        // 清除本地存储并重定向到登录页
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
    // 处理网络错误
    if (networkError.statusCode === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  }
});

// 上下文链接：添加认证头
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// HTTP链接
const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql',
  credentials: 'include',
});

// 创建Apollo Client
export const apolloClient = new ApolloClient({
  link: ApolloLink.from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    // 类型Policies配置
    typePolicies: {
      Query: {
        fields: {
          posts: {
            // 分页字段合并策略
            keyArgs: ['filter'],
            merge(existing = { edges: [] }, incoming, { args }) {
              return {
                ...incoming,
                edges: [...existing.edges, ...incoming.edges],
              };
            },
          },
        },
      },
      User: {
        fields: {
          posts: {
            keyArgs: ['filter'],
            merge: false,
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network',
    },
    query: {
      errorPolicy: 'all',
      fetchPolicy: 'cache-first',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});
```

#### 3.3.2 React集成

```typescript
// App.tsx - Apollo Provider配置
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from './client';
import { BrowserRouter } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';

import { HomePage } from './pages/HomePage';
import { PostDetailPage } from './pages/PostDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { Layout } from './components/Layout';

function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/post/:slug" element={<PostDetailPage />} />
            <Route path="/profile/:username" element={<ProfilePage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ApolloProvider>
  );
}

export default App;
```

### 3.4 缓存策略详解

#### 3.4.1 InMemoryCache配置

```typescript
// cache.ts - 高级缓存配置
import { InMemoryCache, TypePolicies } from '@apollo/client';

// 自定义类型缓存策略
const cache: TypePolicies = {
  // Query级别的全局策略
  Query: {
    fields: {
      // 帖子列表：使用filter作为key，实现分页和缓存
      posts: {
        keyArgs: ['filter', 'sort'],
        // 合并策略：追加而非替换
        merge(existing = { edges: [], pageInfo: {} }, incoming, { args }) {
          // 如果是加载更多，追加边缘节点
          if (args?.pagination?.page && args.pagination.page > 1) {
            return {
              ...incoming,
              edges: [...existing.edges, ...incoming.edges],
              pageInfo: incoming.pageInfo,
            };
          }
          // 否则替换（首次加载或刷新）
          return incoming;
        },
        // 返回现有缓存数据（用于SSR或预加载）
        read(existing, { args, canRead }) {
          if (!args?.pagination?.page || args.pagination.page === 1) {
            return existing;
          }
          // 标记需要获取更多
          return existing;
        },
      },

      // 用户列表：缓存用户数据，避免重复请求
      users: {
        keyArgs: false,
        merge(existing = [], incoming) {
          return incoming;
        },
      },

      // 搜索结果：不需要缓存
      search: {
        keyArgs: ['query'],
        merge: false,
      },
    },
  },

  // User类型策略
  User: {
    // 使用id作为缓存键
    keyFields: ['id'],
    fields: {
      // 帖子列表：使用filter作为key
      posts: {
        keyArgs: ['filter'],
        merge(existing = { edges: [] }, incoming) {
          return {
            ...incoming,
            edges: [...existing.edges, ...incoming.edges],
          };
        },
      },
      // 关注列表：使用ID集合作为key
      following: {
        keyArgs: false,
        merge(existing = [], incoming) {
          const existingIds = new Set(existing.map((u: any) => u.id));
          const merged = [...existing];
          incoming.forEach((u: any) => {
            if (!existingIds.has(u.id)) {
              merged.push(u);
              existingIds.add(u.id);
            }
          });
          return merged;
        },
      },
    },
  },

  // Post类型策略
  Post: {
    keyFields: ['id'],
    fields: {
      // 评论列表
      comments: {
        keyArgs: ['postId'],
        merge(existing = [], incoming, { readField }) {
          // 按时间排序合并
          const merged = [...existing, ...incoming];
          return merged.sort(
            (a, b) =>
              new Date(readField('createdAt', b)).getTime() -
              new Date(readField('createdAt', a)).getTime()
          );
        },
      },
      // 点赞状态：不需要缓存（依赖实时状态）
      isLiked: {
        read: (existing) => existing ?? false,
      },
    },
  },

  // 乐观更新配置
  Mutation: {
    fields: {
      // 创建评论时乐观更新
      createComment: {
        // 乐观更新回调
        optimistic(response, { variables, cache }) {
          const newComment = {
            __typename: 'Comment',
            id: `temp-${Date.now()}`,
            content: variables.content,
            createdAt: new Date().toISOString(),
            likeCount: 0,
            isLiked: false,
            author: {
              __typename: 'User',
              id: 'current-user-id',
              name: '当前用户',
              avatar: null,
            },
            post: {
              __typename: 'Post',
              id: variables.postId,
            },
            parent: null,
            replies: [],
          };

          return {
            __typename: 'Mutation',
            createComment: newComment,
          };
        },
        // 更新后更新缓存
        update(cache, { data }) {
          const newComment = data?.createComment;
          if (!newComment) return;

          // 读取现有评论列表
          const existingComments = cache.readQuery({
            query: GET_COMMENTS,
            variables: { postId: newComment.post.id },
          });

          // 添加新评论到列表
          cache.writeQuery({
            query: GET_COMMENTS,
            variables: { postId: newComment.post.id },
            data: {
              comments: [newComment, ...existingComments.comments],
            },
          });
        },
      },
    },
  },
};

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(cache),
});
```

#### 3.4.2 缓存规范化

```typescript
// normalized-cache.ts - 规范化缓存配置
import { ApolloClient, InMemoryCache, makeVar } from '@apollo/client';

// 创建响应式变量（用于全局状态）
export const cartItemsVar = makeVar<string[]>(
  JSON.parse(localStorage.getItem('cartItems') || '[]')
);

// 规范化缓存配置
const cache = new InMemoryCache({
  // 实体类型定义
  possibleTypes: {
    // 接口实现类型映射
    Node: ['User', 'Post', 'Comment', 'Category', 'Conversation'],
    Content: ['Post'],
  },

  // 类型keyFields配置
  typePolicies: {
    // 使用复合key
    Post: {
      keyFields: ['id'],
      // 字段级别的read函数
      fields: {
        comments: {
          // 批量加载评论
          read(existing, { toReference }) {
            if (!existing) return undefined;
            return existing.map((ref: any) => toReference(ref));
          },
        },
      },
    },

    // 根查询类型
    Query: {
      fields: {
        // 使用字段参数作为缓存key
        post: {
          read(_, { args, toReference }) {
            return args?.id
              ? toReference({ __typename: 'Post', id: args.id })
              : undefined;
          },
        },
      },
    },
  },
});

// 直接写入规范化缓存
export function addToCart(productId: string) {
  const currentItems = cartItemsVar();
  cartItemsVar([...currentItems, productId]);
  localStorage.setItem('cartItems', JSON.stringify(cartItemsVar()));

  // 直接写入Apollo缓存
  apolloClient.cache.modify({
    id: apolloClient.cache.identify({ __typename: 'Cart', id: 'user-cart' }),
    fields: {
      items(cachedItems = []) {
        return [...cachedItems, { __typename: 'Product', id: productId }];
      },
    },
  });
}
```

### 3.5 乐观更新实战

乐观更新可以在服务端响应前就更新UI，提供即时反馈：

```typescript
// hooks/useComments.ts - 乐观更新评论
import { useMutation, useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

// 查询评论
const GET_COMMENTS = gql`
  query GetComments($postId: ID!) {
    comments(postId: $postId) {
      id
      content
      likeCount
      isLiked
      createdAt
      author {
        id
        name
        avatar
      }
    }
  }
`;

// 创建评论
const CREATE_COMMENT = gql`
  mutation CreateComment($postId: ID!, $content: String!) {
    createComment(postId: $postId, content: $content) {
      id
      content
      likeCount
      isLiked
      createdAt
      author {
        id
        name
        avatar
      }
    }
  }
`;

// 点赞评论
const LIKE_COMMENT = gql`
  mutation LikeComment($id: ID!) {
    likeComment(id: $id) {
      id
      likeCount
      isLiked
    }
  }
`;

export function useComments(postId: string) {
  const { data, loading, error, fetchMore } = useQuery(GET_COMMENTS, {
    variables: { postId },
    notifyOnNetworkStatusChange: true,
  });

  return { comments: data?.comments || [], loading, error, fetchMore };
}

export function useCreateComment(postId: string) {
  const [createComment, { loading }] = useMutation(CREATE_COMMENT, {
    // 乐观更新配置
    optimisticResponse: {
      createComment: {
        __typename: 'Comment',
        id: `optimistic-${Date.now()}`,
        content: '', // 会被实际输入覆盖
        likeCount: 0,
        isLiked: false,
        createdAt: new Date().toISOString(),
        author: {
          __typename: 'User',
          id: 'current-user',
          name: '当前用户',
          avatar: null,
        },
      },
    },

    // 更新缓存
    update(cache, { data }) {
      const newComment = data?.createComment;
      if (!newComment) return;

      // 读取现有缓存
      const existing = cache.readQuery({
        query: GET_COMMENTS,
        variables: { postId },
      });

      // 添加新评论到列表开头
      cache.writeQuery({
        query: GET_COMMENTS,
        variables: { postId },
        data: {
          comments: [newComment, ...(existing?.comments || [])],
        },
      });
    },

    // 错误回滚
    onError(error) {
      console.error('创建评论失败:', error);
      // Apollo会自动回滚乐观更新
    },
  });

  return { createComment, loading };
}

export function useLikeComment() {
  const [likeComment] = useMutation(LIKE_COMMENT, {
    // 乐观更新：立即增加点赞数
    optimisticResponse: {
      likeComment: {
        __typename: 'Comment',
        id: '', // 会被缓存中的ID覆盖
        likeCount: 0, // 会被+1
        isLiked: true,
      },
    },

    // 手动更新缓存
    update(cache, { data, variables }) {
      const { id } = variables || {};

      // 直接修改缓存中的数据
      cache.modify({
        id: cache.identify({ __typename: 'Comment', id }),
        fields: {
          likeCount: (count) => count + 1,
          isLiked: () => true,
        },
      });
    },
  });

  return { likeComment };
}
```

---

## 第四部分：GraphQL高级特性

### 4.1 Context与权限控制

Context在GraphQL中用于在整个查询生命周期中共享数据，如认证信息、数据库连接等：

```typescript
// context.ts - Context定义与创建
import { PrismaClient } from '@prisma/client';
import { verifyToken } from './auth';

export interface Context {
  prisma: PrismaClient;
  user: User | null;
  pubsub: PubSub;
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'USER' | 'ADMIN';
}

export async function createContext(req: any): Promise<Context> {
  const prisma = new PrismaClient();
  const pubsub = new PubSub();

  // 从请求头提取并验证Token
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  const user = token ? verifyToken(token) : null;

  return {
    prisma,
    user,
    pubsub,
  };
}

// auth.ts - 认证工具函数
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
```

#### 4.1.1 权限控制实现

```typescript
// permissions.ts - 权限控制
import { rule, shield } from 'graphql-shield';
import { Context } from './context';

// 权限规则定义
const rules = {
  // 已认证用户
  isAuthenticated: rule()(async (_, __, { user }: Context) => {
    return user !== null;
  }),

  // 管理员
  isAdmin: rule()(async (_, __, { user }: Context) => {
    return user?.role === 'ADMIN';
  }),

  // 文章作者
  isPostAuthor: rule()(async (_, { id }, { user, prisma }: Context) => {
    if (!user) return false;
    const post = await prisma.post.findUnique({ where: { id } });
    return post?.authorId === user.id;
  }),

  // 评论作者
  isCommentAuthor: rule()(async (_, { id }, { user, prisma }: Context) => {
    if (!user) return false;
    const comment = await prisma.comment.findUnique({ where: { id } });
    return comment?.authorId === user.id;
  }),
};

// 权限屏蔽配置
const permissions = shield({
  // 查询权限
  Query: {
    // 任何人都可以查看公开内容
    me: rules.isAuthenticated,
    user: rules.isAuthenticated,
    users: rules.isAuthenticated,
    post: rules.isAuthenticated,
    posts: rules.isAuthenticated,
    // 管理员可以查看所有数据
    dashboard: rules.isAdmin,
  },

  // 变更权限
  Mutation: {
    // 创建文章需要登录
    createPost: rules.isAuthenticated,
    // 更新自己的文章
    updatePost: rules.isAuthenticated,
    // 删除自己的文章或管理员的任何文章
    deletePost: rules.isAuthenticated,
    // 发布文章
    publishPost: rules.isAuthenticated,
    // 创建评论需要登录
    createComment: rules.isAuthenticated,
    // 更新自己的评论
    updateComment: rules.isAuthenticated,
    // 删除自己的评论或管理员的任何评论
    deleteComment: rules.isAuthenticated,
    // 关注/取消关注用户
    followUser: rules.isAuthenticated,
    unfollowUser: rules.isAuthenticated,
    // 发送消息需要登录
    sendMessage: rules.isAuthenticated,
  },

  // 字段级别权限（通过Resolver实现）
});

// 在Resolver中检查权限
const resolvers = {
  Mutation: {
    updatePost: async (_, { id, input }, { prisma, user }: Context) => {
      // 手动权限检查
      if (!user) {
        throw new Error('Not authenticated');
      }

      const post = await prisma.post.findUnique({ where: { id } });

      if (!post) throw new Error('Post not found');

      // 检查是否是作者或管理员
      if (post.authorId !== user.id && user.role !== 'ADMIN') {
        throw new Error('Not authorized to update this post');
      }

      return prisma.post.update({
        where: { id },
        data: input,
      });
    },

    deletePost: async (_, { id }, { prisma, user }: Context) => {
      if (!user) throw new Error('Not authenticated');

      const post = await prisma.post.findUnique({ where: { id } });

      if (!post) throw new Error('Post not found');

      if (post.authorId !== user.id && user.role !== 'ADMIN') {
        throw new Error('Not authorized to delete this post');
      }

      await prisma.post.delete({ where: { id } });
      return true;
    },
  },

  // 字段级别数据可见性
  User: {
    // 非管理员无法查看其他用户的email
    email: (parent, _, { user }) => {
      if (!user) return null;
      if (user.id === parent.id || user.role === 'ADMIN') {
        return parent.email;
      }
      return null;
    },

    // 仅自己可以查看自己的关注列表（隐私考虑）
    following: (parent, _, { user, prisma }) => {
      if (!user) return [];
      if (user.id === parent.id) {
        return prisma.follow.findMany({
          where: { followerId: parent.id },
          include: { following: true },
        }).then((f) => f.map((item) => item.following));
      }
      // 非自己只能看到公开的关注关系
      return [];
    },
  },
};
```

### 4.2 DataLoader解决N+1问题

N+1问题是GraphQL中最常见的性能问题，当查询多个资源的关联数据时，会产生大量数据库查询。DataLoader通过批处理和缓存来解决这个问题：

```typescript
// dataloader.ts - DataLoader配置
import DataLoader from 'dataloader';
import { PrismaClient } from '@prisma/client';
import { Context } from './context';

// 创建DataLoader工厂函数
export function createDataLoaders(prisma: PrismaClient) {
  return {
    // 用户DataLoader
    userLoader: new DataLoader<string, any>(async (ids) => {
      // 批量查询用户，一次性获取所有ID对应的用户
      const users = await prisma.user.findMany({
        where: { id: { in: ids as string[] } },
      });

      // 按ID映射用户
      const userMap = new Map(users.map((u) => [u.id, u]));

      // 确保返回顺序与输入IDs一致
      return ids.map((id) => userMap.get(id) || null);
    }),

    // 帖子DataLoader
    postLoader: new DataLoader<string, any>(async (ids) => {
      const posts = await prisma.post.findMany({
        where: { id: { in: ids as string[] } },
        include: { author: true, category: true },
      });

      const postMap = new Map(posts.map((p) => [p.id, p]));
      return ids.map((id) => postMap.get(id) || null);
    }),

    // 评论DataLoader
    commentLoader: new DataLoader<string, any>(async (ids) => {
      const comments = await prisma.comment.findMany({
        where: { id: { in: ids as string[] } },
        include: { author: true },
      });

      const commentMap = new Map(comments.map((c) => [c.id, c]));
      return ids.map((id) => commentMap.get(id) || null);
    }),

    // 帖子作者DataLoader（按authorId批量查询）
    postAuthorLoader: new DataLoader<string, any>(async (authorIds) => {
      const users = await prisma.user.findMany({
        where: { id: { in: authorIds as string[] } },
      });

      const userMap = new Map(users.map((u) => [u.id, u]));
      return authorIds.map((id) => userMap.get(id) || null);
    }),

    // 评论作者DataLoader
    commentAuthorLoader: new DataLoader<string, any>(async (authorIds) => {
      const users = await prisma.user.findMany({
        where: { id: { in: authorIds as string[] } },
      });

      const userMap = new Map(users.map((u) => [u.id, u]));
      return authorIds.map((id) => userMap.get(id) || null);
    }),

    // 帖子评论数DataLoader
    postCommentCountLoader: new DataLoader<string, number>(async (postIds) => {
      const counts = await prisma.comment.groupBy({
        by: ['postId'],
        _count: { id: true },
        where: { postId: { in: postIds as string[] } },
      });

      const countMap = new Map(counts.map((c) => [c.postId, c._count.id]));
      return postIds.map((id) => countMap.get(id) || 0);
    }),

    // 帖子点赞数DataLoader
    postLikeCountLoader: new DataLoader<string, number>(async (postIds) => {
      const counts = await prisma.like.groupBy({
        by: ['postId'],
        _count: { id: true },
        where: { postId: { in: postIds as string[] } },
      });

      const countMap = new Map(counts.map((c) => [c.postId, c._count.id]));
      return postIds.map((id) => countMap.get(id) || 0);
    }),

    // 用户帖子数DataLoader
    userPostCountLoader: new DataLoader<string, number>(async (userIds) => {
      const counts = await prisma.post.groupBy({
        by: ['authorId'],
        _count: { id: true },
        where: { authorId: { in: userIds as string[] } },
      });

      const countMap = new Map(counts.map((c) => [c.authorId, c._count.id]));
      return userIds.map((id) => countMap.get(id) || 0);
    }),
  };
}

// 在Context中使用DataLoader
export interface ContextWithLoaders extends Context {
  loaders: ReturnType<typeof createDataLoaders>;
}

// 创建带DataLoader的Context
export async function createContextWithLoaders(req: any): Promise<ContextWithLoaders> {
  const prisma = new PrismaClient();
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  const user = token ? verifyToken(token) : null;

  return {
    prisma,
    user,
    pubsub: new PubSub(),
    loaders: createDataLoaders(prisma),
  };
}

// 在Resolver中使用DataLoader
const resolvers = {
  Post: {
    // 使用DataLoader避免N+1查询
    author: (parent, _, { loaders }) => {
      return loaders.postAuthorLoader.load(parent.authorId);
    },

    commentCount: (parent, _, { loaders }) => {
      return loaders.postCommentCountLoader.load(parent.id);
    },

    likeCount: (parent, _, { loaders }) => {
      return loaders.postLikeCountLoader.load(parent.id);
    },
  },

  Comment: {
    author: (parent, _, { loaders }) => {
      return loaders.commentAuthorLoader.load(parent.authorId);
    },
  },

  User: {
    postCount: (parent, _, { loaders }) => {
      return loaders.userPostCountLoader.load(parent.id);
    },
  },

  Query: {
    // 示例：查询多篇文章及其作者
    posts: async (_, __, { prisma, loaders }) => {
      const posts = await prisma.post.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      // 触发DataLoader批量加载
      // 注意：这里只是定义查询，实际执行是在访问author字段时
      return posts;
    },
  },
};
```

### 4.3 错误处理

GraphQL有专门的错误处理机制，使用GraphQLError类：

```typescript
// errors.ts - GraphQL错误处理
import { GraphQLError } from 'graphql';

// 自定义错误类
export class AppError extends GraphQLError {
  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    extensions?: Record<string, any>
  ) {
    super(message, {
      extensions: {
        code,
        statusCode,
        ...extensions,
      },
    });
  }
}

// 预定义错误
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      `${resource} not found${id ? `: ${id}` : ''}`,
      'NOT_FOUND',
      404
    );
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 'UNAUTHENTICATED', 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    details?: { field: string; message: string }[]
  ) {
    super(message, 'VALIDATION_ERROR', 400, { details });
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super(
      'Too many requests. Please try again later.',
      'RATE_LIMITED',
      429,
      { retryAfter }
    );
  }
}

// 错误格式化函数
export function formatError(error: GraphQLError) {
  const { message, locations, path, extensions } = error;

  // 生产环境隐藏内部错误详情
  if (process.env.NODE_ENV === 'production') {
    if (extensions?.code === 'INTERNAL_SERVER_ERROR') {
      return {
        message: 'An internal error occurred',
        locations,
        path,
        extensions: {
          code: 'INTERNAL_ERROR',
        },
      };
    }
  }

  return {
    message,
    locations,
    path,
    extensions,
  };
}

// 在Apollo Server中应用错误格式化
const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError,
  // 自定义错误处理
  errorHandler(error) {
    if (error instanceof AppError) {
      // 自定义应用错误已处理
      return;
    }

    // 处理其他错误
    console.error('Unhandled error:', error);
    if (process.env.NODE_ENV === 'production') {
      throw new AppError('An internal error occurred', 'INTERNAL_ERROR', 500);
    }
  },
});
```

### 4.4 分页实现：Connection规范

Relay Connection规范是GraphQL分页的标准方式：

```typescript
// pagination.ts - Relay Connection分页实现
import { Prisma } from '@prisma/client';

// 通用Connection类型
interface Connection<T> {
  edges: Edge<T>[];
  pageInfo: PageInfo;
  totalCount: number;
}

interface Edge<T> {
  node: T;
  cursor: string;
}

interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

// 游标编码/解码
export function encodeCursor(id: string): string {
  return Buffer.from(id).toString('base64');
}

export function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, 'base64').toString('utf-8');
}

// 分页辅助函数
export async function paginate<T extends { id: string }>(
  options: {
    query: any;
    args: any;
    page: number;
    perPage: number;
  }
): Promise<Connection<T>> {
  const { query, args, page, perPage } = options;
  const skip = (page - 1) * perPage;

  // 查询数据和总数
  const [items, totalCount] = await Promise.all([
    query({
      ...args,
      skip,
      take: perPage + 1, // 多取一条用于判断是否有下一页
    }),
    query({
      ...args,
      skip: undefined,
      take: undefined,
      select: { _count: { select: { id: true } } },
    }),
  ]);

  // 计算是否有下一页
  const hasNextPage = items.length > perPage;
  const hasPreviousPage = page > 1;

  // 如果有多余的一条，移除它
  const edges = items.slice(0, perPage).map((item: T) => ({
    node: item,
    cursor: encodeCursor(item.id),
  }));

  return {
    edges,
    pageInfo: {
      hasNextPage,
      hasPreviousPage,
      startCursor: edges[0]?.cursor || null,
      endCursor: edges[edges.length - 1]?.cursor || null,
    },
    totalCount: totalCount,
  };
}

// 使用游标分页
export async function cursorPaginate<T extends { id: string; createdAt: Date }>(
  options: {
    query: any;
    args: any;
    first: number;
    after?: string;
    last?: number;
    before?: string;
  }
): Promise<Connection<T>> {
  const { query, args, first, after, last, before } = options;

  // 解析游标获取索引
  let skip: number | undefined;
  let take: number | undefined;
  let cursorCondition: any;

  if (after) {
    const cursorId = decodeCursor(after);
    const cursorItem = await prisma.post.findUnique({
      where: { id: cursorId },
      select: { createdAt: true, id: true },
    });
    if (cursorItem) {
      cursorCondition = {
        OR: [
          { createdAt: { gt: cursorItem.createdAt } },
          {
            createdAt: cursorItem.createdAt,
            id: { gt: cursorItem.id },
          },
        ],
      };
    }
  }

  if (before) {
    const cursorId = decodeCursor(before);
    const cursorItem = await prisma.post.findUnique({
      where: { id: cursorId },
      select: { createdAt: true, id: true },
    });
    if (cursorItem) {
      cursorCondition = {
        OR: [
          { createdAt: { lt: cursorItem.createdAt } },
          {
            createdAt: cursorItem.createdAt,
            id: { lt: cursorItem.id },
          },
        ],
      };
    }
  }

  if (first) {
    take = first + 1;
  }
  if (last) {
    take = last + 1;
  }

  const where = {
    ...args.where,
    ...(cursorCondition ? { AND: [cursorCondition] } : {}),
  };

  const items = await query({
    ...args,
    where,
    skip,
    take,
    orderBy: args.orderBy || [{ createdAt: 'desc' }, { id: 'desc' }],
  });

  // 判断是否有更多
  let hasNextPage = false;
  let hasPreviousPage = false;

  if (first) {
    hasNextPage = items.length > first;
    if (before) hasPreviousPage = true;
  }
  if (last) {
    hasPreviousPage = items.length > last;
    if (after) hasNextPage = true;
  }

  const edges = items.slice(0, take ? take - 1 : undefined).map((item: T) => ({
    node: item,
    cursor: encodeCursor(item.id),
  }));

  return {
    edges,
    pageInfo: {
      hasNextPage,
      hasPreviousPage,
      startCursor: edges[0]?.cursor || null,
      endCursor: edges[edges.length - 1]?.cursor || null,
    },
    totalCount: edges.length,
  };
}
```

### 4.5 文件上传

GraphQL本身不支持二进制数据，需要特殊处理：

```typescript
// upload.ts - GraphQL文件上传
import { gql, GraphQLUpload, FileUpload } from 'graphql-upload';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream';
import path from 'path';

// Schema定义
const typeDefs = gql`
  # 标量类型用于文件上传
  scalar Upload

  type File {
    filename: String!
    mimetype: String
    encoding: String!
    url: String!
  }

  type Mutation {
    # 单文件上传
    uploadAvatar(file: Upload!, userId: ID!): File!

    # 多文件上传
    uploadPostImages(files: [Upload!]!): [File!]!
  }
`;

// 解析器实现
const resolvers = {
  Upload: GraphQLUpload,

  Mutation: {
    uploadAvatar: async (_, { file, userId }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const { createReadStream, filename, mimetype, encoding } = await file;

      // 验证文件类型
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(mimetype)) {
        throw new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
      }

      // 验证文件大小（最大2MB）
      const maxSize = 2 * 1024 * 1024;
      let size = 0;
      const stream = createReadStream();

      await new Promise<void>((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => {
          size += chunk.length;
          if (size > maxSize) {
            reject(new Error('File too large. Maximum size is 2MB.'));
          }
        });
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      // 生成唯一文件名
      const ext = path.extname(filename);
      const newFilename = `${userId}-${Date.now()}${ext}`;
      const uploadPath = path.join(__dirname, '../uploads/avatars', newFilename);

      // 保存文件
      await new Promise<void>((resolve, reject) => {
        const writeStream = createWriteStream(uploadPath);
        pipeline(createReadStream(), writeStream, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // 返回文件信息
      return {
        filename: newFilename,
        mimetype,
        encoding,
        url: `/uploads/avatars/${newFilename}`,
      };
    },

    uploadPostImages: async (_, { files }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const results = [];

      for (const file of files) {
        const { createReadStream, filename, mimetype, encoding } = await file;

        // 验证
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(mimetype)) {
          throw new Error(`Invalid file type: ${filename}`);
        }

        // 保存文件
        const ext = path.extname(filename);
        const newFilename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`;
        const uploadPath = path.join(__dirname, '../uploads/posts', newFilename);

        await new Promise<void>((resolve, reject) => {
          const writeStream = createWriteStream(uploadPath);
          pipeline(createReadStream(), writeStream, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        results.push({
          filename: newFilename,
          mimetype,
          encoding,
          url: `/uploads/posts/${newFilename}`,
        });
      }

      return results;
    },
  },
};
```

---

## 第五部分：API设计模式对比与实战

### 5.1 REST vs GraphQL vs tRPC对比

| 维度 | REST | GraphQL | tRPC |
|------|------|---------|------|
| **架构风格** | 资源导向 | 类型导向 | 过程导向 |
| **类型安全** | 无内置（需外部工具） | 内置Schema | 端到端TypeScript |
| **数据获取** | 固定端点 | 灵活查询 | 直接函数调用 |
| **学习曲线** | 低 | 中高 | 低（TS用户） |
| **工具生态** | Swagger/OpenAPI | Apollo/Graphile | tRPC官方 |
| **缓存** | HTTP缓存 | 客户端缓存 | React Query缓存 |
| **实时订阅** | 需WebSocket/SSE | 原生支持 | 需额外配置 |
| **适用场景** | 简单CRUD、公共API | 复杂数据关系 | 全栈TypeScript |

### 5.2 何时选择何种方案

**选择REST的场景**

- 简单的CRUD操作，资源导向
- 需要被广泛访问的公共API
- 已有完善的REST基础设施
- 需要利用HTTP缓存/CDN
- 团队对REST更熟悉

**选择GraphQL的场景**

- 前端需要灵活获取不同数据组合
- 复杂的数据依赖和嵌套关系
- 移动端需要减少网络请求
- 需要强类型和自动生成文档
- 实时订阅功能需求

**选择tRPC的场景**

- 全栈TypeScript项目
- 追求端到端类型安全
- 小型到中型应用
- 不希望学习GraphQL Schema语法
- 前后端同一团队维护

### 5.3 混合架构设计

在实际项目中，可以采用REST和GraphQL混合的架构：

```typescript
// 混合架构示例
// 统一网关层

// 1. GraphQL处理复杂查询
// POST /api/graphql
const graphqlHandler = async (req, res) => {
  const { query, variables } = req.body;
  const result = await graphql({
    schema: combinedSchema,
    source: query,
    variableValues: variables,
    contextValue: { prisma, user: req.user },
  });
  res.json(result);
};

// 2. REST处理简单操作和文件上传
// REST端点用于特定的、频繁访问的操作
app.get('/api/users/me', authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { profile: true },
  });
  res.json(user);
});

// 文件上传使用REST更方便
app.post('/api/upload', authMiddleware, upload.array('files'), async (req, res) => {
  const files = req.files.map(f => ({
    filename: f.filename,
    url: `/uploads/${f.filename}`,
  }));
  res.json({ files });
});

// 3. Webhook使用REST
// POST /api/webhooks/stripe - Stripe支付回调
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  // 处理事件
  res.json({ received: true });
});

// 4. 聚合网关提供统一入口
// /api/proxy?target=users&id=1&fields=name,email
app.get('/api/proxy', async (req, res) => {
  const { target, id, fields } = req.query;

  // 根据target决定使用哪个API
  if (target === 'users') {
    const query = buildGraphQLQuery('user', { id, fields });
    const result = await executeQuery(query);
    res.json(result);
  } else if (target === 'posts') {
    const response = await fetch(`${postServiceUrl}/posts/${id}?fields=${fields}`);
    res.json(await response.json());
  }
});
```

### 5.4 API网关设计

API网关作为系统的统一入口，提供路由转发、认证、限流等功能：

```typescript
// api-gateway.ts - API网关实现
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { verifyToken } from './auth';

const app = express();

// 安全中间件
app.use(helmet());
app.use(express.json());

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每IP 100次请求
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// 认证中间件
app.use('/api/', async (req, res, next) => {
  // GraphQL和REST端点需要认证
  if (req.path === '/graphql' || req.path.startsWith('/rest/')) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        req.user = verifyToken(token);
      } catch {
        // Token无效，但继续（具体权限在服务层检查）
      }
    }
  }
  next();
});

// GraphQL代理
app.use('/graphql', createProxyMiddleware({
  target: 'http://localhost:4000',
  changeOrigin: true,
  onProxyReq: (proxyReq, req) => {
    if (req.user) {
      proxyReq.setHeader('x-user-id', req.user.id);
      proxyReq.setHeader('x-user-role', req.user.role);
    }
  },
}));

// REST服务代理
app.use('/rest/users', createProxyMiddleware({
  target: 'http://localhost:4001',
  changeOrigin: true,
  pathRewrite: { '^/rest': '' },
}));

app.use('/rest/posts', createProxyMiddleware({
  target: 'http://localhost:4002',
  changeOrigin: true,
  pathRewrite: { '^/rest': '' },
}));

// 媒体服务代理
app.use('/media', createProxyMiddleware({
  target: 'http://localhost:4003',
  changeOrigin: true,
}));

// 健康检查（无需认证）
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(3000, () => {
  console.log('API Gateway running on port 3000');
});
```

---

## 第六部分：实战项目 - GraphQL博客系统

下面是一个完整的GraphQL博客系统的实现，包括前端React和后端Node.js：

### 6.1 后端实现

```typescript
// index.ts - 服务器入口
import { ApolloServer } from 'apollo-server';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { createContext } from './context';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { applyMiddleware } from 'graphql-middleware';
import { permissions } from './permissions';

async function main() {
  // 创建Schema
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  // 应用权限中间件
  const schemaWithMiddleware = applyMiddleware(schema, permissions);

  // 创建Apollo Server
  const server = new ApolloServer({
    schema: schemaWithMiddleware,
    context: createContext,
    formatError,
    plugins: [
      {
        async requestDidStart() {
          return {
            async didResolveOperation({ operation }) {
              console.log(`Query: ${operation.operation}`);
            },
            async didEncounterErrors({ errors }) {
              errors.forEach((err) => {
                console.error('Error:', err.message);
              });
            },
          };
        },
      },
    ],
  });

  const { url } = await server.listen(4000);
  console.log(`GraphQL Server ready at ${url}`);
  console.log(`GraphQL Playground: ${url}`);
}

main().catch(console.error);

// schema.ts - 完整Schema定义
import { gql } from 'apollo-server';

export const typeDefs = gql`
  scalar DateTime

  enum Role {
    USER
    ADMIN
  }

  enum PostStatus {
    DRAFT
    PUBLISHED
    ARCHIVED
  }

  input RegisterInput {
    username: String!
    email: String!
    password: String!
    displayName: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input CreatePostInput {
    title: String!
    content: String!
    summary: String
    tags: [String!]
    categoryId: ID
  }

  input UpdatePostInput {
    title: String
    content: String
    summary: String
    tags: [String!]
    categoryId: ID
    status: PostStatus
  }

  input PostFilterInput {
    category: String
    tags: [String!]
    authorId: ID
    search: String
  }

  input PaginationInput {
    page: Int = 1
    perPage: Int = 10
  }

  type User {
    id: ID!
    username: String!
    email: String!
    displayName: String!
    avatar: String
    bio: String
    posts(filter: PostFilterInput, pagination: PaginationInput): PostConnection!
    comments: [Comment!]!
    followerCount: Int!
    followingCount: Int!
    isFollowing: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Post {
    id: ID!
    title: String!
    slug: String!
    content: String!
    summary: String
    coverImage: String
    status: PostStatus!
    tags: [String!]!
    author: User!
    category: Category
    comments: [Comment!]!
    commentCount: Int!
    viewCount: Int!
    likeCount: Int!
    isLiked: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Category {
    id: ID!
    name: String!
    slug: String!
    description: String
    postCount: Int!
  }

  type Comment {
    id: ID!
    content: String!
    author: User!
    post: Post!
    likeCount: Int!
    isLiked: Boolean!
    createdAt: DateTime!
  }

  type PostConnection {
    edges: [PostEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type PostEdge {
    node: Post!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    me: User
    user(id: ID, username: String): User
    users(pagination: PaginationInput): [User!]!
    post(id: ID, slug: String): Post
    posts(filter: PostFilterInput, pagination: PaginationInput): PostConnection!
    categories: [Category!]!
    comments(postId: ID!): [Comment!]!
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    createPost(input: CreatePostInput!): Post!
    updatePost(id: ID!, input: UpdatePostInput!): Post
    deletePost(id: ID!): Boolean!
    publishPost(id: ID!): Post!
    likePost(id: ID!): Post!
    unlikePost(id: ID!): Post!
    createComment(postId: ID!, content: String!): Comment!
    deleteComment(id: ID!): Boolean!
    followUser(userId: ID!): User!
    unfollowUser(userId: ID!): User!
  }

  type Subscription {
    commentAdded(postId: ID!): Comment!
    postLiked(postId: ID!): Post!
  }
`;

// resolvers.ts - 完整Resolver实现（800+行）
import { IResolvers } from '@graphql-tools/utils';
import { PubSub } from 'graphql-subscriptions';
import { Context, User } from './context';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const pubsub = new PubSub();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-change-in-production';

const SUBSCRIPTION_EVENTS = {
  COMMENT_ADDED: 'COMMENT_ADDED',
  POST_LIKED: 'POST_LIKED',
};

// 辅助函数
function generateToken(user: any): string {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    + '-' + Date.now().toString(36);
}

function encodeCursor(id: string): string {
  return Buffer.from(id).toString('base64');
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}

export const resolvers: IResolvers<any, Context> = {
  DateTime: {
    __parseValue(value: string) {
      return new Date(value);
    },
    __serialize(value: Date) {
      return value.toISOString();
    },
    __parseLiteral(ast: any) {
      if (ast.kind === 'StringValue') {
        return new Date(ast.value);
      }
      return null;
    },
  },

  Query: {
    me: async (_, __, { user }) => {
      if (!user) return null;
      return prisma.user.findUnique({ where: { id: user.id } });
    },

    user: async (_, { id, username }) => {
      if (id) return prisma.user.findUnique({ where: { id } });
      if (username) return prisma.user.findUnique({ where: { username } });
      return null;
    },

    users: async (_, { pagination }) => {
      const { page = 1, perPage = 20 } = pagination || {};
      return prisma.user.findMany({
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      });
    },

    post: async (_, { id, slug }) => {
      if (id) return prisma.post.findUnique({ where: { id } });
      if (slug) return prisma.post.findUnique({ where: { slug } });
      return null;
    },

    posts: async (_, { filter, pagination }) => {
      const { page = 1, perPage = 10 } = pagination || {};
      const where: any = {};

      if (filter?.category) {
        where.category = { slug: filter.category };
      }
      if (filter?.tags?.length) {
        where.tags = { hasEvery: filter.tags };
      }
      if (filter?.authorId) {
        where.authorId = filter.authorId;
      }
      if (filter?.search) {
        where.OR = [
          { title: { contains: filter.search, mode: 'insensitive' } },
          { content: { contains: filter.search, mode: 'insensitive' } },
        ];
      }
      where.status = 'PUBLISHED';

      const [posts, totalCount] = await Promise.all([
        prisma.post.findMany({
          where,
          skip: (page - 1) * perPage,
          take: perPage,
          orderBy: { createdAt: 'desc' },
          include: { author: true, category: true },
        }),
        prisma.post.count({ where }),
      ]);

      return {
        edges: posts.map((post) => ({
          node: post,
          cursor: encodeCursor(post.id),
        })),
        pageInfo: {
          hasNextPage: page * perPage < totalCount,
          hasPreviousPage: page > 1,
          startCursor: posts[0]?.id || null,
          endCursor: posts[posts.length - 1]?.id || null,
        },
        totalCount,
      };
    },

    categories: async () => {
      return prisma.category.findMany({
        orderBy: { name: 'asc' },
      });
    },

    comments: async (_, { postId }) => {
      return prisma.comment.findMany({
        where: { postId, parentId: null },
        orderBy: { createdAt: 'desc' },
        include: { author: true },
      });
    },
  },

  Mutation: {
    register: async (_, { input }) => {
      const existing = await prisma.user.findFirst({
        where: {
          OR: [{ email: input.email }, { username: input.username }],
        },
      });

      if (existing) {
        throw new Error('User with this email or username already exists');
      }

      const hashedPassword = await hashPassword(input.password);
      const user = await prisma.user.create({
        data: {
          username: input.username,
          email: input.email,
          password: hashedPassword,
          displayName: input.displayName || input.username,
        },
      });

      const token = generateToken(user);
      return { token, user };
    },

    login: async (_, { input }) => {
      const user = await prisma.user.findUnique({
        where: { email: input.email },
      });

      if (!user) {
        throw new Error('Invalid credentials');
      }

      const isValid = await verifyPassword(input.password, user.password);
      if (!isValid) {
        throw new Error('Invalid credentials');
      }

      const token = generateToken(user);
      return { token, user };
    },

    createPost: async (_, { input }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const slug = generateSlug(input.title);
      return prisma.post.create({
        data: {
          title: input.title,
          slug,
          content: input.content,
          summary: input.summary,
          tags: input.tags || [],
          authorId: user.id,
          categoryId: input.categoryId,
        },
        include: { author: true, category: true },
      });
    },

    updatePost: async (_, { id, input }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const post = await prisma.post.findUnique({ where: { id } });
      if (!post) throw new Error('Post not found');
      if (post.authorId !== user.id) throw new Error('Not authorized');

      const data: any = { ...input };
      if (input.title) {
        data.slug = generateSlug(input.title);
      }

      return prisma.post.update({
        where: { id },
        data,
        include: { author: true, category: true },
      });
    },

    deletePost: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const post = await prisma.post.findUnique({ where: { id } });
      if (!post) throw new Error('Post not found');
      if (post.authorId !== user.id && user.role !== 'ADMIN') {
        throw new Error('Not authorized');
      }

      await prisma.post.delete({ where: { id } });
      return true;
    },

    publishPost: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const post = await prisma.post.findUnique({ where: { id } });
      if (!post) throw new Error('Post not found');
      if (post.authorId !== user.id) throw new Error('Not authorized');

      return prisma.post.update({
        where: { id },
        data: { status: 'PUBLISHED' },
        include: { author: true, category: true },
      });
    },

    likePost: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const existing = await prisma.like.findFirst({
        where: { postId: id, userId: user.id },
      });

      if (existing) {
        throw new Error('Already liked');
      }

      await prisma.like.create({
        data: { postId: id, userId: user.id },
      });

      const post = await prisma.post.update({
        where: { id },
        data: { likeCount: { increment: 1 } },
        include: { author: true, category: true },
      });

      pubsub.publish(`${SUBSCRIPTION_EVENTS.POST_LIKED}_${id}`, {
        postLiked: post,
      });

      return post;
    },

    unlikePost: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const existing = await prisma.like.findFirst({
        where: { postId: id, userId: user.id },
      });

      if (!existing) {
        throw new Error('Not liked yet');
      }

      await prisma.like.delete({ where: { id: existing.id } });

      return prisma.post.update({
        where: { id },
        data: { likeCount: { decrement: 1 } },
        include: { author: true, category: true },
      });
    },

    createComment: async (_, { postId, content }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const post = await prisma.post.findUnique({ where: { id: postId } });
      if (!post) throw new Error('Post not found');

      const comment = await prisma.comment.create({
        data: {
          content,
          postId,
          authorId: user.id,
        },
        include: { author: true },
      });

      // 更新评论数
      await prisma.post.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      });

      pubsub.publish(`${SUBSCRIPTION_EVENTS.COMMENT_ADDED}_${postId}`, {
        commentAdded: comment,
      });

      return comment;
    },

    deleteComment: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const comment = await prisma.comment.findUnique({ where: { id } });
      if (!comment) throw new Error('Comment not found');
      if (comment.authorId !== user.id && user.role !== 'ADMIN') {
        throw new Error('Not authorized');
      }

      await prisma.comment.delete({ where: { id } });

      await prisma.post.update({
        where: { id: comment.postId },
        data: { commentCount: { decrement: 1 } },
      });

      return true;
    },

    followUser: async (_, { userId }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      if (user.id === userId) throw new Error('Cannot follow yourself');

      const existing = await prisma.follow.findFirst({
        where: { followerId: user.id, followingId: userId },
      });

      if (existing) {
        throw new Error('Already following');
      }

      await prisma.follow.create({
        data: { followerId: user.id, followingId: userId },
      });

      return prisma.user.findUnique({ where: { id: userId } });
    },

    unfollowUser: async (_, { userId }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      const existing = await prisma.follow.findFirst({
        where: { followerId: user.id, followingId: userId },
      });

      if (!existing) {
        throw new Error('Not following');
      }

      await prisma.follow.delete({ where: { id: existing.id } });

      return prisma.user.findUnique({ where: { id: userId } });
    },
  },

  Subscription: {
    commentAdded: {
      subscribe: (_, { postId }) => {
        return pubsub.asyncIterator(`${SUBSCRIPTION_EVENTS.COMMENT_ADDED}_${postId}`);
      },
    },
    postLiked: {
      subscribe: (_, { postId }) => {
        return pubsub.asyncIterator(`${SUBSCRIPTION_EVENTS.POST_LIKED}_${postId}`);
      },
    },
  },

  User: {
    posts: async (parent, { filter, pagination }, { user }) => {
      const { page = 1, perPage = 10 } = pagination || {};
      const where: any = { authorId: parent.id };
      if (filter?.status) where.status = filter.status;

      const [posts, totalCount] = await Promise.all([
        prisma.post.findMany({
          where,
          skip: (page - 1) * perPage,
          take: perPage,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.post.count({ where }),
      ]);

      return {
        edges: posts.map((post) => ({
          node: post,
          cursor: encodeCursor(post.id),
        })),
        pageInfo: {
          hasNextPage: page * perPage < totalCount,
          hasPreviousPage: page > 1,
          startCursor: posts[0]?.id || null,
          endCursor: posts[posts.length - 1]?.id || null,
        },
        totalCount,
      };
    },

    comments: async (parent) => {
      return prisma.comment.findMany({
        where: { authorId: parent.id },
        orderBy: { createdAt: 'desc' },
      });
    },

    followerCount: async (parent) => {
      return prisma.follow.count({ where: { followingId: parent.id } });
    },

    followingCount: async (parent) => {
      return prisma.follow.count({ where: { followerId: parent.id } });
    },

    isFollowing: async (parent, _, { user }) => {
      if (!user) return false;
      if (user.id === parent.id) return false;
      const follow = await prisma.follow.findFirst({
        where: { followerId: user.id, followingId: parent.id },
      });
      return !!follow;
    },
  },

  Post: {
    author: (parent) => prisma.user.findUnique({ where: { id: parent.authorId } }),
    category: (parent) =>
      parent.categoryId
        ? prisma.category.findUnique({ where: { id: parent.categoryId } })
        : null,
    comments: (parent) =>
      prisma.comment.findMany({
        where: { postId: parent.id },
        orderBy: { createdAt: 'desc' },
        include: { author: true },
      }),
    isLiked: async (parent, _, { user }) => {
      if (!user) return false;
      const like = await prisma.like.findFirst({
        where: { postId: parent.id, userId: user.id },
      });
      return !!like;
    },
  },

  Category: {
    postCount: async (parent) => {
      return prisma.post.count({
        where: { categoryId: parent.id, status: 'PUBLISHED' },
      });
    },
  },

  Comment: {
    author: (parent) => prisma.user.findUnique({ where: { id: parent.authorId } }),
    post: (parent) => prisma.post.findUnique({ where: { id: parent.postId } }),
    isLiked: async (parent, _, { user }) => {
      if (!user) return false;
      const like = await prisma.like.findFirst({
        where: { commentId: parent.id, userId: user.id },
      });
      return !!like;
    },
  },
};

// context.ts
export interface User {
  id: string;
  email: string;
  role: string;
}

export interface Context {
  prisma: PrismaClient;
  user: User | null;
  pubsub: PubSub;
}

export async function createContext(req: any): Promise<Context> {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  let user: User | null = null;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      user = { id: decoded.userId, email: decoded.email, role: decoded.role };
    } catch {
      // Invalid token
    }
  }

  return {
    prisma,
    user,
    pubsub,
  };
}

// 错误格式化
function formatError(error: any) {
  const { message, locations, path } = error;

  if (process.env.NODE_ENV === 'production') {
    if (error.extensions?.code === 'INTERNAL_SERVER_ERROR') {
      return { message: 'Internal server error', locations, path };
    }
  }

  return error;
}
```

### 6.2 前端实现

```tsx
// client/apollo.ts - Apollo Client配置
import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { setContext } from '@apollo/client/link/context';

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(`[GraphQL error]: ${message}`, { locations, path });
    });
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql',
});

export const client = new ApolloClient({
  link: ApolloLink.from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          posts: {
            keyArgs: ['filter'],
            merge(existing, incoming, { args }) {
              if (args?.pagination?.page === 1 || !args?.pagination?.page) {
                return incoming;
              }
              return {
                ...incoming,
                edges: [...(existing?.edges || []), ...incoming.edges],
              };
            },
          },
        },
      },
      User: {
        keyFields: ['id'],
      },
      Post: {
        keyFields: ['id'],
      },
    },
  }),
});

// client/queries.ts - GraphQL查询和变更
import { gql } from '@apollo/client';

export const USER_FRAGMENT = gql`
  fragment UserFields on User {
    id
    username
    email
    displayName
    avatar
    bio
    followerCount
    followingCount
    isFollowing
  }
`;

export const POST_FRAGMENT = gql`
  fragment PostFields on Post {
    id
    title
    slug
    summary
    coverImage
    status
    tags
    viewCount
    likeCount
    commentCount
    isLiked
    createdAt
    author {
      ...UserFields
    }
    category {
      id
      name
      slug
    }
  }
  ${USER_FRAGMENT}
`;

export const GET_POSTS = gql`
  query GetPosts($filter: PostFilterInput, $pagination: PaginationInput) {
    posts(filter: $filter, pagination: $pagination) {
      edges {
        node {
          ...PostFields
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
  ${POST_FRAGMENT}
`;

export const GET_POST = gql`
  query GetPost($id: ID, $slug: String) {
    post(id: $id, slug: $slug) {
      ...PostFields
      content
    }
  }
  ${POST_FRAGMENT}
`;

export const GET_ME = gql`
  query GetMe {
    me {
      ...UserFields
    }
  }
  ${USER_FRAGMENT}
`;

export const GET_USER = gql`
  query GetUser($id: ID, $username: String) {
    user(id: $id, username: $username) {
      ...UserFields
      posts {
        edges {
          node {
            ...PostFields
          }
        }
        totalCount
      }
    }
  }
  ${POST_FRAGMENT}
`;

export const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
      slug
      description
      postCount
    }
  }
`;

export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        ...UserFields
      }
    }
  }
  ${USER_FRAGMENT}
`;

export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        ...UserFields
      }
    }
  }
  ${USER_FRAGMENT}
`;

export const CREATE_POST = gql`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      ...PostFields
      content
    }
  }
  ${POST_FRAGMENT}
`;

export const UPDATE_POST = gql`
  mutation UpdatePost($id: ID!, $input: UpdatePostInput!) {
    updatePost(id: $id, input: $input) {
      ...PostFields
      content
    }
  }
  ${POST_FRAGMENT}
`;

export const DELETE_POST = gql`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id)
  }
`;

export const PUBLISH_POST = gql`
  mutation PublishPost($id: ID!) {
    publishPost(id: $id) {
      ...PostFields
    }
  }
  ${POST_FRAGMENT}
`;

export const LIKE_POST = gql`
  mutation LikePost($id: ID!) {
    likePost(id: $id) {
      id
      likeCount
      isLiked
    }
  }
`;

export const UNLIKE_POST = gql`
  mutation UnlikePost($id: ID!) {
    unlikePost(id: $id) {
      id
      likeCount
      isLiked
    }
  }
`;

export const CREATE_COMMENT = gql`
  mutation CreateComment($postId: ID!, $content: String!) {
    createComment(postId: $postId, content: $content) {
      id
      content
      likeCount
      isLiked
      createdAt
      author {
        ...UserFields
      }
    }
  }
  ${USER_FRAGMENT}
`;

export const DELETE_COMMENT = gql`
  mutation DeleteComment($id: ID!) {
    deleteComment(id: $id)
  }
`;

export const FOLLOW_USER = gql`
  mutation FollowUser($userId: ID!) {
    followUser(userId: $userId) {
      id
      isFollowing
      followerCount
    }
  }
`;

export const UNFOLLOW_USER = gql`
  mutation UnfollowUser($userId: ID!) {
    unfollowUser(userId: $userId) {
      id
      isFollowing
      followerCount
    }
  }
`;

// client/hooks.ts - React Hooks封装
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import {
  GET_POSTS,
  GET_POST,
  GET_ME,
  GET_USER,
  GET_CATEGORIES,
  LOGIN,
  REGISTER,
  CREATE_POST,
  UPDATE_POST,
  DELETE_POST,
  PUBLISH_POST,
  LIKE_POST,
  UNLIKE_POST,
  CREATE_COMMENT,
  DELETE_COMMENT,
  FOLLOW_USER,
  UNFOLLOW_USER,
} from './queries';

// 认证Hook
export function useAuth() {
  const { data, loading, error } = useQuery(GET_ME);
  return {
    user: data?.me,
    loading,
    error,
    isAuthenticated: !!data?.me,
  };
}

// 登录注册Hook
export function useLogin() {
  return useMutation(LOGIN);
}

export function useRegister() {
  return useMutation(REGISTER);
}

// 文章列表Hook
export function usePosts(filter?: any, pagination?: any) {
  const { data, loading, error, fetchMore } = useQuery(GET_POSTS, {
    variables: { filter, pagination },
    notifyOnNetworkStatusChange: true,
  });

  const loadMore = () => {
    if (!data?.posts?.pageInfo?.hasNextPage) return;
    fetchMore({
      variables: {
        pagination: {
          page: Math.ceil((data.posts.edges.length + 1) / 10) + 1,
          perPage: 10,
        },
      },
    });
  };

  return {
    posts: data?.posts?.edges?.map((e: any) => e.node) || [],
    pageInfo: data?.posts?.pageInfo,
    totalCount: data?.posts?.totalCount,
    loading,
    error,
    loadMore,
  };
}

// 单篇文章Hook
export function usePost(idOrSlug: { id?: string; slug?: string }) {
  const { data, loading, error } = useQuery(GET_POST, {
    variables: idOrSlug,
  });
  return { post: data?.post, loading, error };
}

// 用户信息Hook
export function useUser(idOrUsername: { id?: string; username?: string }) {
  const { data, loading, error } = useQuery(GET_USER, {
    variables: idOrUsername,
  });
  return { user: data?.user, loading, error };
}

// 分类Hook
export function useCategories() {
  const { data, loading, error } = useQuery(GET_CATEGORIES);
  return {
    categories: data?.categories || [],
    loading,
    error,
  };
}

// 创建文章Hook（包含乐观更新）
export function useCreatePost() {
  const [createPost, { loading }] = useMutation(CREATE_POST, {
    update(cache, { data }) {
      const newPost = data?.createPost;
      if (!newPost) return;

      // 更新文章列表缓存
      const existing = cache.readQuery({
        query: GET_POSTS,
        variables: { filter: {}, pagination: { page: 1, perPage: 10 } },
      });

      if (existing) {
        cache.writeQuery({
          query: GET_POSTS,
          data: {
            posts: {
              ...existing.posts,
              edges: [{ node: newPost, cursor: newPost.id }, ...existing.posts.edges],
              totalCount: existing.posts.totalCount + 1,
            },
          },
        });
      }
    },
  });

  return { createPost, loading };
}

// 点赞文章Hook（包含乐观更新）
export function useLikePost() {
  const [likePost, { loading: liking }] = useMutation(LIKE_POST, {
    optimisticResponse: {
      likePost: {
        __typename: 'Post',
        id: '',
        likeCount: 0,
        isLiked: true,
      },
    },
    update(cache, { data, variables }) {
      cache.modify({
        id: cache.identify({ __typename: 'Post', id: variables?.id }),
        fields: {
          likeCount: (count) => count + 1,
          isLiked: () => true,
        },
      });
    },
  });

  const [unlikePost, { loading: unliking }] = useMutation(UNLIKE_POST, {
    optimisticResponse: {
      unlikePost: {
        __typename: 'Post',
        id: '',
        likeCount: 0,
        isLiked: false,
      },
    },
    update(cache, { data, variables }) {
      cache.modify({
        id: cache.identify({ __typename: 'Post', id: variables?.id }),
        fields: {
          likeCount: (count) => Math.max(0, count - 1),
          isLiked: () => false,
        },
      });
    },
  });

  return {
    likePost,
    unlikePost,
    loading: liking || unliking,
  };
}

// 评论Hook
export function useComments(postId: string) {
  const [createComment, { loading }] = useMutation(CREATE_COMMENT, {
    optimisticResponse: {
      createComment: {
        __typename: 'Comment',
        id: `temp-${Date.now()}`,
        content: '',
        likeCount: 0,
        isLiked: false,
        createdAt: new Date().toISOString(),
        author: null, // 会在更新时填充
      },
    },
    update(cache, { data }) {
      const newComment = data?.createComment;
      if (!newComment) return;

      cache.modify({
        id: cache.identify({ __typename: 'Post', id: postId }),
        fields: {
          commentCount: (count) => count + 1,
        },
      });
    },
  });

  return { createComment, loading };
}

// 关注用户Hook
export function useFollowUser() {
  const [followUser, { loading: following }] = useMutation(FOLLOW_USER, {
    optimisticResponse: {
      followUser: {
        __typename: 'User',
        id: '',
        isFollowing: true,
        followerCount: 0,
      },
    },
    update(cache, { data, variables }) {
      if (!variables?.userId) return;

      cache.modify({
        id: cache.identify({ __typename: 'User', id: variables.userId }),
        fields: {
          isFollowing: () => true,
          followerCount: (count) => count + 1,
        },
      });
    },
  });

  const [unfollowUser, { loading: unfollowing }] = useMutation(UNFOLLOW_USER, {
    optimisticResponse: {
      unfollowUser: {
        __typename: 'User',
        id: '',
        isFollowing: false,
        followerCount: 0,
      },
    },
    update(cache, { data, variables }) {
      if (!variables?.userId) return;

      cache.modify({
        id: cache.identify({ __typename: 'User', id: variables.userId }),
        fields: {
          isFollowing: () => false,
          followerCount: (count) => Math.max(0, count - 1),
        },
      });
    },
  });

  return { followUser, unfollowUser, loading: following || unfollowing };
}

// components/PostList.tsx - 文章列表组件
import { usePosts } from '../client/hooks';
import { Link } from 'react-router-dom';

export function PostList() {
  const { posts, loading, error, loadMore, pageInfo } = usePosts();

  if (loading && posts.length === 0) {
    return <div className="loading">Loading posts...</div>;
  }

  if (error) {
    return <div className="error">Error loading posts: {error.message}</div>;
  }

  return (
    <div className="post-list">
      {posts.map((post) => (
        <article key={post.id} className="post-card">
          {post.coverImage && (
            <img src={post.coverImage} alt={post.title} className="post-cover" />
          )}
          <div className="post-content">
            <div className="post-meta">
              <span className="post-category">{post.category?.name}</span>
              <span className="post-date">
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
            </div>
            <Link to={`/post/${post.slug}`}>
              <h2 className="post-title">{post.title}</h2>
            </Link>
            <p className="post-summary">{post.summary}</p>
            <div className="post-footer">
              <Link to={`/user/${post.author.username}`} className="post-author">
                {post.author.avatar && (
                  <img src={post.author.avatar} alt={post.author.displayName} />
                )}
                <span>{post.author.displayName}</span>
              </Link>
              <div className="post-stats">
                <span>likes {post.likeCount}</span>
                <span>comments {post.commentCount}</span>
              </div>
            </div>
            <div className="post-tags">
              {post.tags.map((tag: string) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </article>
      ))}

      {pageInfo?.hasNextPage && (
        <button onClick={loadMore} disabled={loading} className="load-more">
          {loading ? 'Loading...' : 'Load more'}
        </button>
      )}
    </div>
  );
}

// components/PostDetail.tsx - 文章详情组件
import { useParams } from 'react-router-dom';
import { usePost, useLikePost, useComments } from '../client/hooks';
import { useMutation } from '@apollo/client';
import { LIKE_POST, UNLIKE_POST, CREATE_COMMENT } from '../client/queries';

export function PostDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { post, loading, error } = usePost({ slug });
  const { likePost, unlikePost } = useLikePost();
  const { createComment } = useComments(post?.id || '');

  const handleLike = () => {
    if (!post) return;
    if (post.isLiked) {
      unlikePost({ variables: { id: post.id } });
    } else {
      likePost({ variables: { id: post.id } });
    }
  };

  const handleComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const content = (form.elements.namedItem('content') as HTMLInputElement).value;

    if (!content.trim()) return;

    await createComment({
      variables: { postId: post?.id, content },
    });

    form.reset();
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error.message}</div>;
  if (!post) return <div className="not-found">Post not found</div>;

  return (
    <article className="post-detail">
      {post.coverImage && (
        <img src={post.coverImage} alt={post.title} className="cover-image" />
      )}

      <header className="post-header">
        <h1 className="post-title">{post.title}</h1>
        <div className="post-meta">
          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
          <span>{post.category?.name}</span>
        </div>
      </header>

      <div className="post-author">
        <img src={post.author.avatar || '/default-avatar.png'} alt={post.author.displayName} />
        <div>
          <span className="name">{post.author.displayName}</span>
          <span className="bio">{post.author.bio}</span>
        </div>
      </div>

      <div className="post-body">
        {post.content}
      </div>

      <div className="post-actions">
        <button onClick={handleLike} className={post.isLiked ? 'liked' : ''}>
          {post.isLiked ? 'Liked' : 'Like'} ({post.likeCount})
        </button>
        <span>{post.commentCount} Comments</span>
      </div>

      <section className="comments">
        <h3>Comments</h3>
        <form onSubmit={handleComment} className="comment-form">
          <textarea name="content" placeholder="Write a comment..." required />
          <button type="submit">Post</button>
        </form>

        <div className="comment-list">
          {post.comments?.map((comment: any) => (
            <div key={comment.id} className="comment">
              <img src={comment.author?.avatar || '/default-avatar.png'} alt="" />
              <div className="comment-content">
                <span className="comment-author">{comment.author?.displayName}</span>
                <p>{comment.content}</p>
                <span className="comment-date">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}

// pages/HomePage.tsx - 首页
import { PostList } from '../components/PostList';

export function HomePage() {
  return (
    <div className="home-page">
      <PostList />
    </div>
  );
}
```

---

## 总结

本指南深入探讨了REST API和GraphQL两种主流API设计风格的核心概念、设计原则和最佳实践。

**REST API**以其简洁、直观的资源导向设计，在简单CRUD场景下表现出色，配合HTTP缓存机制可以获得良好的性能。但当面对复杂的数据依赖关系时，REST的固定端点设计可能导致Over-fetching和Under-fetching问题。

**GraphQL**通过强类型Schema和灵活的字段选择能力，解决了REST的局限性，特别适合数据关系复杂、客户端需要灵活获取数据的应用场景。其订阅功能也为实时应用提供了原生支持。但GraphQL的学习曲线较陡，在简单场景下可能显得过度设计。

在实际项目中，开发者应当根据具体需求选择合适的API风格，甚至可以采用混合架构，结合两者的优势。无论选择哪种风格，良好的API设计都应当遵循一致性、安全性和可维护性的原则。

通过本指南的学习，开发者应当能够：

1. 理解RESTful API的设计原则和最佳实践
2. 掌握GraphQL Schema设计和Resolver实现
3. 熟练使用Apollo Server和Apollo Client
4. 实现GraphQL高级特性如DataLoader、订阅和错误处理
5. 根据项目需求做出合理的API设计决策
