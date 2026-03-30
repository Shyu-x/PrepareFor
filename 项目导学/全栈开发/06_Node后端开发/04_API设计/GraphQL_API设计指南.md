# GraphQL API设计指南

## 目录

1. [GraphQL概述](#1-graphql概述)
2. [Schema设计](#2-schema设计)
3. [Query查询设计](#3-query查询设计)
4. [Mutation变更设计](#4-mutation变更设计)
5. [Apollo Server实战](#5-apollo-server实战)
6. [性能优化](#6-性能优化)
7. [面试高频问题](#7-面试高频问题)

---

## 1. GraphQL概述

### 1.1 什么是GraphQL？

GraphQL是一种用于API的查询语言，由Facebook于2015年开源。它允许客户端精确指定需要的数据，避免了REST API中的过度获取和获取不足问题。

### 1.2 GraphQL vs REST

```
┌─────────────────────────────────────────────────────────────┐
│                   GraphQL vs REST对比                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  REST API问题:                                              │
│  1. 过度获取 (Over-fetching)                                │
│     GET /users/123                                          │
│     返回: { id, name, email, phone, address, ... }          │
│     但只需要: { name, email }                                │
│                                                             │
│  2. 获取不足 (Under-fetching)                               │
│     GET /users/123          → 获取用户信息                  │
│     GET /users/123/posts    → 获取用户文章                  │
│     GET /posts/1/comments   → 获取文章评论                  │
│     需要多次请求                                            │
│                                                             │
│  GraphQL解决方案:                                            │
│  query {                                                    │
│    user(id: "123") {                                        │
│      name                                                   │
│      email                                                  │
│      posts {                                                │
│        title                                                │
│        comments { text }                                    │
│      }                                                      │
│    }                                                        │
│  }                                                          │
│  一次请求获取所有需要的数据                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 GraphQL核心概念

```typescript
// GraphQL核心概念

/*
1. Schema（模式）
   - 定义API的类型系统
   - 描述可查询的数据和操作

2. Query（查询）
   - 获取数据（类似GET）
   - 只读操作

3. Mutation（变更）
   - 修改数据（类似POST/PUT/DELETE）
   - 写操作

4. Subscription（订阅）
   - 实时数据更新
   - WebSocket实现

5. Resolver（解析器）
   - 处理查询和变更的函数
   - 连接Schema和数据源

6. Type（类型）
   - 标量类型: Int, Float, String, Boolean, ID
   - 对象类型: 自定义类型
   - 枚举类型: enum
   - 接口类型: interface
   - 联合类型: union
   - 输入类型: input
*/

// 基础Schema示例
const typeDefs = `#graphql
  # 用户类型
  type User {
    id: ID!
    name: String!
    email: String!
    posts: [Post!]!
    createdAt: String!
  }

  # 文章类型
  type Post {
    id: ID!
    title: String!
    content: String!
    author: User!
    comments: [Comment!]!
    createdAt: String!
  }

  # 评论类型
  type Comment {
    id: ID!
    text: String!
    author: User!
    createdAt: String!
  }

  # 查询
  type Query {
    user(id: ID!): User
    users: [User!]!
    post(id: ID!): Post
    posts: [Post!]!
  }

  # 变更
  type Mutation {
    createUser(input: CreateUserInput!): User!
    updateUser(id: ID!, input: UpdateUserInput!): User!
    deleteUser(id: ID!): Boolean!
    createPost(input: CreatePostInput!): Post!
  }

  # 输入类型
  input CreateUserInput {
    name: String!
    email: String!
    password: String!
  }

  input UpdateUserInput {
    name: String
    email: String
    avatar: String
  }

  input CreatePostInput {
    title: String!
    content: String!
    authorId: ID!
  }
`;
```

---

## 2. Schema设计

### 2.1 类型系统

```typescript
// GraphQL类型系统详解

const typeDefs = `#graphql
  # ==================== 标量类型 ====================
  # 内置标量: Int, Float, String, Boolean, ID

  # 自定义标量
  scalar Date      # 日期
  scalar JSON      # JSON对象
  scalar Upload    # 文件上传

  # ==================== 枚举类型 ====================
  enum UserRole {
    USER
    ADMIN
    MODERATOR
  }

  enum PostStatus {
    DRAFT
    PUBLISHED
    ARCHIVED
  }

  enum SortOrder {
    ASC
    DESC
  }

  # ==================== 对象类型 ====================
  type User {
    id: ID!
    name: String!
    email: String!
    avatar: String
    role: UserRole!
    bio: String
    posts: [Post!]!
    postsCount: Int!
    followers: [User!]!
    followersCount: Int!
    following: [User!]!
    followingCount: Int!
    createdAt: Date!
    updatedAt: Date!
  }

  type Post {
    id: ID!
    title: String!
    slug: String!
    content: String!
    excerpt: String!
    status: PostStatus!
    author: User!
    tags: [Tag!]!
    comments: [Comment!]!
    commentsCount: Int!
    likesCount: Int!
    viewCount: Int!
    publishedAt: Date
    createdAt: Date!
    updatedAt: Date!
  }

  type Tag {
    id: ID!
    name: String!
    slug: String!
    posts: [Post!]!
    postsCount: Int!
  }

  type Comment {
    id: ID!
    text: String!
    author: User!
    post: Post!
    parent: Comment
    replies: [Comment!]!
    createdAt: Date!
  }

  # ==================== 接口类型 ====================
  interface Node {
    id: ID!
    createdAt: Date!
  }

  interface Content {
    id: ID!
    author: User!
    createdAt: Date!
  }

  # 实现接口
  type Article implements Node & Content {
    id: ID!
    title: String!
    content: String!
    author: User!
    createdAt: Date!
  }

  # ==================== 联合类型 ====================
  union SearchResult = User | Post | Tag

  # ==================== 输入类型 ====================
  input PaginationInput {
    page: Int = 1
    limit: Int = 20
  }

  input UserFilterInput {
    role: UserRole
    search: String
  }

  input PostFilterInput {
    status: PostStatus
    authorId: ID
    tagId: ID
    search: String
  }

  input SortInput {
    field: String!
    order: SortOrder = DESC
  }

  input CreateUserInput {
    name: String!
    email: String!
    password: String!
    role: UserRole = USER
  }

  input UpdateUserInput {
    name: String
    email: String
    avatar: String
    bio: String
  }

  input CreatePostInput {
    title: String!
    content: String!
    tagIds: [ID!]
  }

  input UpdatePostInput {
    title: String
    content: String
    status: PostStatus
    tagIds: [ID!]
  }

  # ==================== 响应类型 ====================
  type UserConnection {
    edges: [UserEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type UserEdge {
    node: User!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  type MutationResponse {
    success: Boolean!
    message: String!
  }

  type UserMutationResponse {
    success: Boolean!
    message: String!
    user: User
  }
`;
```

### 2.2 Schema设计最佳实践

```typescript
// Schema设计最佳实践

const typeDefs = `#graphql
  # 1. 使用非空类型（!）标记必填字段
  type User {
    id: ID!           # 必填
    name: String!     # 必填
    bio: String       # 可选
  }

  # 2. 使用ID类型作为标识符
  type Post {
    id: ID!           # 使用ID而非String
    # ...
  }

  # 3. 关系字段返回对象类型
  type Post {
    author: User!     # 返回User对象，而非authorId
    comments: [Comment!]!
  }

  # 4. 添加计数字段避免额外查询
  type User {
    posts: [Post!]!
    postsCount: Int!  # 添加计数
  }

  # 5. 使用枚举限制可选值
  enum PostStatus {
    DRAFT
    PUBLISHED
    ARCHIVED
  }

  # 6. 分离输入类型
  input CreateUserInput {
    name: String!
    email: String!
  }

  input UpdateUserInput {
    name: String      # 更新时可选
    email: String
  }

  # 7. 使用接口共享字段
  interface Timestamped {
    createdAt: Date!
    updatedAt: Date!
  }

  type User implements Timestamped {
    # ...
    createdAt: Date!
    updatedAt: Date!
  }

  # 8. 使用联合类型处理多态
  union SearchResult = User | Post | Comment

  # 9. 使用自定义标量
  scalar Date
  scalar JSON
  scalar Upload

  # 10. 添加描述
  """
  用户类型，表示系统中的一个用户
  """
  type User {
    """
    用户唯一标识符
    """
    id: ID!

    """
    用户显示名称
    """
    name: String!
  }
`;
```

---

## 3. Query查询设计

### 3.1 查询设计

```typescript
// Query查询设计

const typeDefs = `#graphql
  type Query {
    # 单个资源查询
    user(id: ID!): User
    post(id: ID!): Post
    postBySlug(slug: String!): Post

    # 列表查询
    users: [User!]!
    posts: [Post!]!

    # 分页查询
    usersPaginated(page: Int, limit: Int): UserConnection!
    postsPaginated(page: Int, limit: Int): PostConnection!

    # 游标分页
    usersCursor(first: Int, after: String): UserConnection!
    postsCursor(first: Int, after: String): PostConnection!

    # 过滤查询
    usersByRole(role: UserRole!): [User!]!
    postsByStatus(status: PostStatus!): [Post!]!
    postsByAuthor(authorId: ID!): [Post!]!

    # 搜索查询
    searchUsers(query: String!): [User!]!
    searchPosts(query: String!): [Post!]!
    search(query: String!): [SearchResult!]!

    # 复杂过滤
    usersFiltered(
      filter: UserFilterInput
      sort: SortInput
      pagination: PaginationInput
    ): UserConnection!

    postsFiltered(
      filter: PostFilterInput
      sort: SortInput
      pagination: PaginationInput
    ): PostConnection!

    # 聚合查询
    usersCount: Int!
    postsCount(status: PostStatus): Int!

    # 当前用户
    me: User
  }
`;

// Resolvers实现
const resolvers = {
  Query: {
    // 单个用户
    user: async (_: any, { id }: { id: string }, context: any) => {
      return context.dataSources.userAPI.findById(id);
    },

    // 用户列表
    users: async (_: any, __: any, context: any) => {
      return context.dataSources.userAPI.findAll();
    },

    // 分页查询
    usersPaginated: async (
      _: any,
      { page = 1, limit = 20 }: { page: number; limit: number },
      context: any
    ) => {
      const [users, total] = await Promise.all([
        context.dataSources.userAPI.findPaginated(page, limit),
        context.dataSources.userAPI.count(),
      ]);

      return {
        edges: users.map((user: any) => ({
          node: user,
          cursor: Buffer.from(String(user.id)).toString('base64'),
        })),
        pageInfo: {
          hasNextPage: page * limit < total,
          hasPreviousPage: page > 1,
        },
        totalCount: total,
      };
    },

    // 游标分页
    usersCursor: async (
      _: any,
      { first = 20, after }: { first: number; after?: string },
      context: any
    ) => {
      const cursor = after
        ? Buffer.from(after, 'base64').toString()
        : null;

      const users = await context.dataSources.userAPI.findAfterCursor(
        first + 1,
        cursor
      );

      const hasNextPage = users.length > first;
      const edges = users.slice(0, first).map((user: any) => ({
        node: user,
        cursor: Buffer.from(String(user.id)).toString('base64'),
      }));

      return {
        edges,
        pageInfo: {
          hasNextPage,
          hasPreviousPage: !!cursor,
          startCursor: edges[0]?.cursor,
          endCursor: edges[edges.length - 1]?.cursor,
        },
        totalCount: await context.dataSources.userAPI.count(),
      };
    },

    // 搜索
    search: async (_: any, { query }: { query: string }, context: any) => {
      const [users, posts] = await Promise.all([
        context.dataSources.userAPI.search(query),
        context.dataSources.postAPI.search(query),
      ]);

      return [...users, ...posts];
    },

    // 当前用户
    me: async (_: any, __: any, context: any) => {
      if (!context.user) {
        throw new AuthenticationError('未登录');
      }
      return context.dataSources.userAPI.findById(context.user.id);
    },
  },
};
```

---

## 4. Mutation变更设计

### 4.1 Mutation设计

```typescript
// Mutation变更设计

const typeDefs = `#graphql
  type Mutation {
    # 用户相关
    createUser(input: CreateUserInput!): UserMutationResponse!
    updateUser(id: ID!, input: UpdateUserInput!): UserMutationResponse!
    deleteUser(id: ID!): MutationResponse!

    # 文章相关
    createPost(input: CreatePostInput!): PostMutationResponse!
    updatePost(id: ID!, input: UpdatePostInput!): PostMutationResponse!
    deletePost(id: ID!): MutationResponse!
    publishPost(id: ID!): PostMutationResponse!
    archivePost(id: ID!): PostMutationResponse!

    # 评论相关
    createComment(input: CreateCommentInput!): CommentMutationResponse!
    updateComment(id: ID!, input: UpdateCommentInput!): CommentMutationResponse!
    deleteComment(id: ID!): MutationResponse!

    # 点赞
    likePost(postId: ID!): PostMutationResponse!
    unlikePost(postId: ID!): PostMutationResponse!

    # 关注
    followUser(userId: ID!): MutationResponse!
    unfollowUser(userId: ID!): MutationResponse!

    # 认证
    login(email: String!, password: String!): AuthPayload!
    logout: MutationResponse!
    refreshToken(token: String!): AuthPayload!
    register(input: RegisterInput!): AuthPayload!

    # 文件上传
    uploadAvatar(file: Upload!): UserMutationResponse!
    uploadImage(file: Upload!): ImageUploadResponse!
  }

  type AuthPayload {
    success: Boolean!
    message: String!
    user: User
    accessToken: String
    refreshToken: String
  }

  type ImageUploadResponse {
    success: Boolean!
    url: String
  }
`;

const resolvers = {
  Mutation: {
    // 创建用户
    createUser: async (
      _: any,
      { input }: { input: any },
      context: any
    ) => {
      try {
        // 验证输入
        const existingUser = await context.dataSources.userAPI.findByEmail(
          input.email
        );
        if (existingUser) {
          return {
            success: false,
            message: '邮箱已被注册',
            user: null,
          };
        }

        // 创建用户
        const user = await context.dataSources.userAPI.create(input);

        return {
          success: true,
          message: '用户创建成功',
          user,
        };
      } catch (error) {
        return {
          success: false,
          message: '创建失败',
          user: null,
        };
      }
    },

    // 更新用户
    updateUser: async (
      _: any,
      { id, input }: { id: string; input: any },
      context: any
    ) => {
      // 权限检查
      if (context.user.id !== id && context.user.role !== 'ADMIN') {
        throw new ForbiddenError('无权限修改此用户');
      }

      const user = await context.dataSources.userAPI.update(id, input);

      return {
        success: true,
        message: '更新成功',
        user,
      };
    },

    // 删除用户
    deleteUser: async (
      _: any,
      { id }: { id: string },
      context: any
    ) => {
      // 权限检查
      if (context.user.id !== id && context.user.role !== 'ADMIN') {
        throw new ForbiddenError('无权限删除此用户');
      }

      await context.dataSources.userAPI.delete(id);

      return {
        success: true,
        message: '删除成功',
      };
    },

    // 登录
    login: async (
      _: any,
      { email, password }: { email: string; password: string },
      context: any
    ) => {
      const user = await context.dataSources.userAPI.findByEmail(email);

      if (!user || !(await user.comparePassword(password))) {
        return {
          success: false,
          message: '邮箱或密码错误',
          user: null,
          accessToken: null,
          refreshToken: null,
        };
      }

      const tokens = context.utils.generateTokens(user);

      return {
        success: true,
        message: '登录成功',
        user,
        ...tokens,
      };
    },

    // 文件上传
    uploadAvatar: async (
      _: any,
      { file }: { file: any },
      context: any
    ) => {
      const { createReadStream, filename, mimetype } = await file;

      // 验证文件类型
      if (!mimetype.startsWith('image/')) {
        return {
          success: false,
          message: '只支持图片文件',
          user: null,
        };
      }

      // 上传到存储服务
      const stream = createReadStream();
      const url = await context.dataSources.storageAPI.upload(
        stream,
        filename,
        'avatars'
      );

      // 更新用户头像
      const user = await context.dataSources.userAPI.update(context.user.id, {
        avatar: url,
      });

      return {
        success: true,
        message: '头像上传成功',
        user,
      };
    },
  },
};
```

---

## 5. Apollo Server实战

### 5.1 完整项目配置

```typescript
// Apollo Server完整配置

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { applyMiddleware } from 'graphql-middleware';
import { GraphQLDateTime } from 'graphql-scalars';

// 类型定义
const typeDefs = `#graphql
  scalar DateTime

  type User {
    id: ID!
    name: String!
    email: String!
    posts: [Post!]!
    createdAt: DateTime!
  }

  type Post {
    id: ID!
    title: String!
    content: String!
    author: User!
    createdAt: DateTime!
  }

  type Query {
    users: [User!]!
    user(id: ID!): User
    posts: [Post!]!
    post(id: ID!): Post
    me: User
  }

  type Mutation {
    createUser(name: String!, email: String!, password: String!): User!
    createPost(title: String!, content: String!): Post!
  }
`;

// Resolvers
const resolvers = {
  DateTime: GraphQLDateTime,

  Query: {
    users: async (_: any, __: any, { dataSources }: any) => {
      return dataSources.userAPI.findAll();
    },
    user: async (_: any, { id }: any, { dataSources }: any) => {
      return dataSources.userAPI.findById(id);
    },
    posts: async (_: any, __: any, { dataSources }: any) => {
      return dataSources.postAPI.findAll();
    },
    me: async (_: any, __: any, { user, dataSources }: any) => {
      if (!user) throw new Error('未认证');
      return dataSources.userAPI.findById(user.id);
    },
  },

  Mutation: {
    createUser: async (_: any, args: any, { dataSources }: any) => {
      return dataSources.userAPI.create(args);
    },
    createPost: async (_: any, args: any, { user, dataSources }: any) => {
      if (!user) throw new Error('未认证');
      return dataSources.postAPI.create({ ...args, authorId: user.id });
    },
  },

  User: {
    posts: async (user: any, _: any, { dataSources }: any) => {
      return dataSources.postAPI.findByAuthorId(user.id);
    },
  },

  Post: {
    author: async (post: any, _: any, { dataSources }: any) => {
      return dataSources.userAPI.findById(post.authorId);
    },
  },
};

// 数据源
import { RESTDataSource } from '@apollo/datasource-rest';

class UserAPI extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = 'http://localhost:3001/api/';
  }

  async findAll() {
    return this.get('users');
  }

  async findById(id: string) {
    return this.get(`users/${id}`);
  }

  async create(user: any) {
    return this.post('users', { body: user });
  }
}

class PostAPI extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = 'http://localhost:3001/api/';
  }

  async findAll() {
    return this.get('posts');
  }

  async findById(id: string) {
    return this.get(`posts/${id}`);
  }

  async findByAuthorId(authorId: string) {
    return this.get(`posts?authorId=${authorId}`);
  }

  async create(post: any) {
    return this.post('posts', { body: post });
  }
}

// 认证中间件
import jwt from 'jsonwebtoken';

const getUser = (req: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    return null;
  }
};

// 权限中间件
import { shield, rule, and, or, not } from 'graphql-shield';

const isAuthenticated = rule()(async (parent, args, { user }) => {
  return user !== null;
});

const isAdmin = rule()(async (parent, args, { user }) => {
  return user?.role === 'ADMIN';
});

const isOwner = rule()(async (parent, args, { user, dataSources }) => {
  const resource = await dataSources.userAPI.findById(args.id);
  return resource?.id === user?.id;
});

const permissions = shield({
  Query: {
    me: isAuthenticated,
  },
  Mutation: {
    createUser: not(isAuthenticated),
    updateUser: or(isAdmin, isOwner),
    deleteUser: isAdmin,
    createPost: isAuthenticated,
  },
});

// 创建服务器
async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // 创建schema
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const schemaWithMiddleware = applyMiddleware(schema, permissions);

  const server = new ApolloServer({
    schema: schemaWithMiddleware,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    formatError: (error) => {
      console.error(error);
      return {
        message: error.message,
        code: error.extensions?.code,
      };
    },
  });

  await server.start();

  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    bodyParser.json(),
    expressMiddleware(server, {
      context: async ({ req }) => ({
        user: getUser(req),
        dataSources: {
          userAPI: new UserAPI(),
          postAPI: new PostAPI(),
        },
      }),
    })
  );

  await new Promise<void>((resolve) =>
    httpServer.listen({ port: 4000 }, resolve)
  );

  console.log(`🚀 Server ready at http://localhost:4000/graphql`);
}

startServer();
```

---

## 6. 性能优化

### 6.1 N+1问题与DataLoader

```typescript
// DataLoader解决N+1问题

import DataLoader from 'dataloader';

// 问题：N+1查询
// 查询10个文章，每个文章需要查询作者
// 会产生 1 + 10 = 11 次数据库查询

// 解决方案：DataLoader批量加载
const userLoader = new DataLoader(async (ids: string[]) => {
  // 批量查询所有用户
  const users = await User.find({ _id: { $in: ids } });

  // 创建ID到用户的映射
  const userMap = new Map(users.map((user) => [user.id.toString(), user]));

  // 按原始顺序返回
  return ids.map((id) => userMap.get(id) || null);
});

// 在Resolver中使用
const resolvers = {
  Post: {
    author: async (post: any, _: any, { userLoader }: any) => {
      // 自动批量加载
      return userLoader.load(post.authorId);
    },
  },
};

// 完整DataLoader配置
function createLoaders() {
  return {
    userLoader: new DataLoader(async (ids: string[]) => {
      const users = await User.find({ _id: { $in: ids } });
      const userMap = new Map(users.map((u) => [u.id, u]));
      return ids.map((id) => userMap.get(id));
    }),

    postLoader: new DataLoader(async (ids: string[]) => {
      const posts = await Post.find({ _id: { $in: ids } });
      const postMap = new Map(posts.map((p) => [p.id, p]));
      return ids.map((id) => postMap.get(id));
    }),

    postsByAuthorLoader: new DataLoader(async (authorIds: string[]) => {
      const posts = await Post.find({ authorId: { $in: authorIds } });
      return authorIds.map((authorId) =>
        posts.filter((p) => p.authorId === authorId)
      );
    }),
  };
}

// 在context中注入
app.use(
  '/graphql',
  expressMiddleware(server, {
    context: async ({ req }) => ({
      user: getUser(req),
      ...createLoaders(),
    }),
  })
);
```

### 6.2 查询复杂度控制

```typescript
// 查询复杂度控制

import { createComplexityLimitRule } from 'graphql-validation-complexity';

// 配置复杂度限制
const complexityLimit = createComplexityLimitRule(1000, {
  onCost: (cost: number) => console.log(`查询成本: ${cost}`),
  formatErrorMessage: (cost: number) =>
    `查询过于复杂，成本 ${cost} 超过限制 1000`,
});

const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [complexityLimit],
});

// 使用graphql-cost-analysis
import { complexityAnalysis } from 'graphql-cost-analysis';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [
    complexityAnalysis({
      maximumComplexity: 1000,
      variables: {},
      onComplete: (complexity: number) => {
        console.log('查询复杂度:', complexity);
      },
    }),
  ],
});

// Schema中定义复杂度
const typeDefs = `#graphql
  type User {
    id: ID!
    name: String!
    posts(limit: Int = 10): [Post!]!
      @cost(complexity: 1, multipliers: ["limit"])
  }

  type Post {
    id: ID!
    title: String!
    comments(limit: Int = 10): [Comment!]!
      @cost(complexity: 1, multipliers: ["limit"])
  }

  type Query {
    users(limit: Int = 10): [User!]!
      @cost(complexity: 1, multipliers: ["limit"])
  }
`;
```

---

## 7. 面试高频问题

### 问题1：GraphQL和REST的区别？

**答案：**
| 方面 | GraphQL | REST |
|------|---------|------|
| 数据获取 | 精确指定 | 固定返回 |
| 请求次数 | 单次请求 | 可能多次 |
| 版本控制 | 无需版本 | 需要版本 |
| 学习曲线 | 较陡 | 较平缓 |
| 缓存 | 需要额外处理 | HTTP缓存 |

### 问题2：什么是N+1问题？

**答案：** 在GraphQL中，查询列表时，每个项目都需要单独查询关联数据，导致N+1次数据库查询。解决方案是使用DataLoader进行批量加载。

### 问题3：GraphQL的优缺点？

**答案：**
优点：
1. 精确获取数据
2. 单次请求获取多资源
3. 强类型系统
4. 自文档化

缺点：
1. 学习曲线陡
2. 缓存复杂
3. 文件上传不友好
4. 可能过度查询

### 问题4：如何处理GraphQL认证？

**答案：**
1. 在context中解析token
2. 使用中间件验证
3. 在resolver中检查权限
4. 使用graphql-shield统一管理

### 问题5：如何优化GraphQL性能？

**答案：**
1. 使用DataLoader解决N+1
2. 限制查询深度
3. 限制查询复杂度
4. 实现持久化查询
5. 启用响应缓存

---

## 8. 最佳实践总结

### 8.1 GraphQL清单

- [ ] 设计清晰的Schema
- [ ] 使用DataLoader解决N+1
- [ ] 实现查询复杂度限制
- [ ] 添加认证授权
- [ ] 处理错误和异常
- [ ] 实现分页
- [ ] 添加文档注释
- [ ] 编写单元测试

### 8.2 常见陷阱

| 陷阱 | 解决方案 |
|------|----------|
| N+1查询 | DataLoader |
| 过度查询 | 复杂度限制 |
| 深度嵌套 | 深度限制 |
| 缓存困难 | 持久化查询 |

---

*本文档最后更新于 2026年3月*