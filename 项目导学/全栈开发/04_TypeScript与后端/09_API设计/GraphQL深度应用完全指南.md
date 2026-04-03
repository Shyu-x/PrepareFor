# GraphQL深度应用完全指南

## 概述

GraphQL是一种用于API的查询语言，由Facebook在2015年开源并迅速成为现代API开发的重要标准。与传统的REST API不同，GraphQL提供了一种更加灵活、高效的数据获取方式，让客户端能够精确地指定需要的数据，避免了过度获取（over-fetching）和不足获取（under-fetching）的问题。

本文档将深入探讨GraphQL的核心原理、实战技巧和最佳实践，帮助开发者从基础概念到高级应用全面掌握GraphQL技术栈。

---

## 一、GraphQL核心原理

### 1.1 查询语言 vs REST API

要理解GraphQL的优势，首先需要对比它与REST API的核心差异。

**REST API的工作方式**：

```typescript
// REST API：获取用户及其帖子，需要多次请求
// 请求1：获取用户信息
GET /api/users/123

// 请求2：获取用户的帖子
GET /api/users/123/posts

// 请求3：获取用户的关注者
GET /api/users/123/followers

// 问题：网络往返次数多，存在过度获取
```

**GraphQL的解决方案**：

```graphql
# 一次请求，获取所有需要的数据
query GetUserData {
  user(id: "123") {
    name
    email
    avatar

    posts {
      title
      content
      createdAt
    }

    followers(first: 10) {
      name
      avatar
    }
  }
}
```

**核心差异对比**：

| 特性 | REST API | GraphQL |
|------|----------|---------|
| 数据获取 | 固定端点返回固定数据结构 | 客户端指定所需字段 |
| 请求次数 | 多次请求获取关联数据 | 单次请求获取复杂图谱 |
| 版本控制 | 通过URL versioning (/v1/, /v2/) | 通过Schema演进，无需版本 |
| 类型安全 | 依赖文档和约定 | 内置类型系统，SDL定义 |
| 缓存 | HTTP缓存天然支持 | 需要单独实现缓存策略 |
| 实时数据 | 轮询或WebSocket | 原生支持订阅 |

**过度获取与不足获取问题**：

```typescript
// REST场景：用户端只需要用户名，但获取了整个用户对象
// GET /api/users/123 返回：
{
  "id": "123",
  "name": "张三",
  "email": "zhangsan@example.com",    // 不需要
  "phone": "13800138000",              // 不需要
  "address": "北京市朝阳区...",         // 不需要
  "createdAt": "2024-01-01T00:00:00Z", // 不需要
  "updatedAt": "2024-06-01T00:00:00Z", // 不需要
  "profile": { ... },                  // 不需要
  "settings": { ... }                  // 不需要
}

// GraphQL场景：精确获取所需字段
query {
  user(id: "123") {
    name  # 只获取这个字段
  }
}

// 返回：
{
  "data": {
    "user": {
      "name": "张三"
    }
  }
}
```

### 1.2 Schema定义

GraphQL的Schema是整个API的核心，它使用**Schema Definition Language（SDL）**来定义类型系统。

**基础标量类型**：

```graphql
# GraphQL内置标量类型
scalar String      # UTF-8字符序列
scalar Int         # 32位整数
scalar Float       # 双精度浮点数
scalar Boolean     # true 或 false
scalar ID          # 唯一标识符，序列化方式与String相同

# 自定义标量类型示例
scalar DateTime    # ISO 8601格式的日期时间
scalar JSON        # 任意JSON对象
scalar Upload      # 文件上传
```

**对象类型定义**：

```graphql
# 定义用户类型
type User {
  id: ID!                    # ! 表示非空字段
  name: String!
  email: String!
  age: Int
  isActive: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!

  # 关系字段
  posts: [Post!]!           # 用户的所有帖子，非空数组
  followers: [User!]!       // 关注者列表
  following: [User!]!       # 关注列表
  profile: Profile          # 可空的一对一关系
}

# 定义帖子类型
type Post {
  id: ID!
  title: String!
  content: String!
  published: Boolean!
  viewCount: Int!
  author: User!              # 非空的一对多关系
  comments: [Comment!]!
  tags: [Tag!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

# 定义评论类型
type Comment {
  id: ID!
  content: String!
  author: User!
  post: Post!
  parentComment: Comment    # 自引用：回复功能
  replies: [Comment!]!      # 子回复
  createdAt: DateTime!
}
```

**枚举类型**：

```graphql
# 定义用户角色枚举
enum UserRole {
  ADMIN        # 管理员
  EDITOR       # 编辑
  AUTHOR       # 作者
  READER       # 读者
  GUEST        # 游客
}

# 定义帖子状态枚举
enum PostStatus {
  DRAFT        # 草稿
  PUBLISHED    # 已发布
  ARCHIVED     # 已归档
  DELETED      # 已删除
}

# 枚举在Schema中的使用
type User {
  role: UserRole!
  posts(status: PostStatus): [Post!]!
}
```

**接口类型（Interface）**：

```graphql
# 定义可发布内容的接口
interface Publishable {
  id: ID!
  title: String!
  content: String!
  published: Boolean!
  author: User!
  createdAt: DateTime!
  updatedAt: DateTime!
}

# 帖子实现该接口
type Post implements Publishable {
  id: ID!
  title: String!
  content: String!
  published: Boolean!
  author: User!
  createdAt: DateTime!
  updatedAt: DateTime!

  # Post特有字段
  viewCount: Int!
  comments: [Comment!]!
  tags: [Tag!]!
}

# 页面也实现该接口
type Page implements Publishable {
  id: ID!
  title: String!
  content: String!
  published: Boolean!
  author: User!
  createdAt: DateTime!
  updatedAt: DateTime!

  # Page特有字段
  slug: String!
  template: String!
  metaDescription: String
}
```

**联合类型（Union）**：

```graphql
# 定义搜索结果联合类型
union SearchResult = User | Post | Comment | Page

# 使用示例
type Query {
  search(query: String!): [SearchResult!]!
}

# 客户端如何处理
query {
  search(query: "GraphQL") {
    ... on User {
      name
      email
    }
    ... on Post {
      title
      excerpt
    }
    ... on Comment {
      content
      createdAt
    }
    ... on Page {
      title
      slug
    }
  }
}
```

**输入类型（Input）**：

```graphql
# 输入类型用于mutation和query参数
input CreatePostInput {
  title: String!
  content: String!
  tags: [String!]
  published: Boolean = false  # 带默认值的字段
}

input UpdatePostInput {
  title: String
  content: String
  tags: [String!]
  published: Boolean
}

input UserFilterInput {
  role: UserRole
  isActive: Boolean
  searchQuery: String
  createdAfter: DateTime
  createdBefore: DateTime
}

# 使用输入类型
type Mutation {
  createPost(input: CreatePostInput!): Post!
  updatePost(id: ID!, input: UpdatePostInput!): Post
  deletePost(id: ID!): Boolean!
}

type Query {
  posts(filter: UserFilterInput, limit: Int = 10, offset: Int = 0): [Post!]!
}
```

### 1.3 Resolver机制

Resolver是GraphQL执行引擎的核心，每个字段都对应一个Resolver函数。

**Resolver基础结构**：

```typescript
// resolver签名
// resolver函数接收四个参数
const resolver = (parent, args, context, info) => {
  // parent: 父对象（根Query的parent是undefined）
  // args: 查询参数
  // context: 共享上下文
  // info: 查询执行信息
  return result;
}
```

**完整Resolver示例**：

```typescript
// 定义Schema
const typeDefs = `
  type Query {
    user(id: ID!): User
    users(filter: UserFilterInput): [User!]!
  }

  type User {
    id: ID!
    name: String!
    email: String!
    posts: [Post!]!
    followerCount: Int!
  }

  input UserFilterInput {
    role: UserRole
    searchQuery: String
  }
`;

// 用户数据
const users = [
  { id: "1", name: "张三", email: "zhangsan@example.com", role: "ADMIN" },
  { id: "2", name: "李四", email: "lisi@example.com", role: "EDITOR" },
  { id: "3", name: "王五", email: "wangwu@example.com", role: "READER" },
];

// 帖子数据
const posts = [
  { id: "1", authorId: "1", title: "GraphQL入门", content: "..." },
  { id: "2", authorId: "1", title: "REST vs GraphQL", content: "..." },
  { id: "3", authorId: "2", title: "TypeScript教程", content: "..." },
];

// Query resolvers
const resolvers = {
  Query: {
    // 简单字段resolver
    user: (parent, { id }, context, info) => {
      // parent在根Query时是undefined
      // args是查询参数 { id: "1" }
      // context是共享上下文
      // info包含当前查询的元信息
      return users.find(u => u.id === id) || null;
    },

    users: (parent, { filter }, context, info) => {
      let result = [...users];

      if (filter?.role) {
        result = result.filter(u => u.role === filter.role);
      }

      if (filter?.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        result = result.filter(u =>
          u.name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query)
        );
      }

      return result;
    },
  },

  User: {
    // 简单字段可以省略，GraphQL会直接返回对应属性
    // id, name, email 会自动从parent对象中提取

    // 计算字段resolver
    posts: (parent, args, context, info) => {
      // parent是当前User对象 { id: "1", name: "张三", ... }
      // 返回该用户的所有帖子
      return posts.filter(p => p.authorId === parent.id);
    },

    followerCount: async (parent, args, context, info) => {
      // 可以返回Promise，GraphQL会等待其resolve
      const followers = await context.db.followers.findMany({
        where: { followingId: parent.id }
      });
      return followers.length;
    },
  },
};
```

**隐式Resolver与显式Resolver**：

```typescript
// 当字段名与parent属性名匹配时，可以省略resolver
const resolvers = {
  Query: {
    // 显式resolver
    user: (parent, { id }) => findUserById(id),

    // 如果只返回单一对象，也可以省略
    // user: findUserById  等价于上面的写法
  },

  User: {
    // 这些字段的resolver被省略，GraphQL默认行为：
    // id: (parent) => parent.id
    // name: (parent) => parent.name
    // email: (parent) => parent.email

    // 显式resolver：需要特殊处理
    fullName: (parent) => `${parent.name} (ID: ${parent.id})`,

    // 异步resolver
    latestPost: async (parent, args, context) => {
      return await context.db.posts.findFirst({
        where: { authorId: parent.id },
        orderBy: { createdAt: 'desc' }
      });
    },
  },
};
```

### 1.4 执行引擎

GraphQL执行引擎负责解析查询字符串、验证Schema、执行Resolver并返回结果。

**查询解析与验证流程**：

```typescript
import { graphql, parse, validate, execute, getOperationRootType } from 'graphql';

// 完整执行流程
async function executeQuery(schema, queryString, variables, context) {
  // 1. 解析Query字符串为AST
  const document = parse(queryString);

  // 2. 验证查询是否符合Schema
  const errors = validate(schema, document);
  if (errors.length > 0) {
    throw new Error(`Validation errors: ${errors.map(e => e.message).join(', ')}`);
  }

  // 3. 执行查询
  const result = await execute({
    schema,
    document,
    variableValues: variables,
    contextValue: context,
  });

  return result;
}

// 使用示例
const result = await executeQuery(
  schema,
  `
    query GetUser($id: ID!) {
      user(id: $id) {
        name
        email
      }
    }
  `,
  { id: "1" },
  { db: database }
);

console.log(result);
// { data: { user: { name: "张三", email: "zhangsan@example.com" } } }
```

**执行顺序与并行化**：

```typescript
// GraphQL执行顺序示例
const typeDefs = `
  type Query {
    user: User
  }

  type User {
    name: String!
    posts: [Post!]!
    followers: [User!]!
    stats: UserStats!
  }

  type Post {
    id: ID!
    title: String!
    comments: [Comment!]!
  }

  type UserStats {
    postCount: Int!
    followerCount: Int!
    totalViews: Int!
  }
`;

// 执行流程分析
const query = `
  query {
    user {
      name                    # 1. 先执行user resolver
      posts {                 # 2. posts与followers并行（同一层级）
        title
        comments {            # 3. comments在所有posts的posts resolver完成后并行
          content
        }
      }
      followers {
        name
      }
      stats {                  # 4. stats与其他字段并行
        postCount
      }
    }
  }
`;

// 实际执行顺序：
// Level 0: user
// Level 1: user.name, user.posts, user.followers, user.stats (并行)
// Level 2: posts[].comments, followers[].name, stats fields (并行)
// Level 3: comments[].content (并行)
```

**Info对象详解**：

```typescript
// info参数包含丰富的查询元信息
const resolvers = {
  User: {
    dynamicField: (parent, args, context, info) => {
      // info.fieldName: 当前字段名
      console.log(info.fieldName); // "dynamicField"

      // info.fieldNodes[0]: AST中的字段节点
      console.log(info.fieldNodes[0].alias); // 字段别名

      // info.returnType: 返回类型
      console.log(info.returnType); // GraphQLString

      // info.parentType: 父类型
      console.log(info.parentType); // User类型

      // info.path: 当前路径
      console.log(info.path); // { prev: { fieldName: 'user' }, fieldName: 'dynamicField' }

      // info.schema: 完整Schema
      console.log(info.schema);

      // info.fragments: 使用的片段
      console.log(info.fragments);

      // info.operation: 操作（Query/Mutation/Subscription）
      console.log(info.operation); // { operation: 'query', ... }

      // info.variableValues: 变量值
      console.log(info.variableValues);

      return "动态值";
    },
  },
};
```

---

## 二、Schema设计

### 2.1 类型定义最佳实践

**命名规范**：

```graphql
# 类型命名：使用PascalCase
type UserAccount { ... }
type BlogPost { ... }

# 字段命名：使用camelCase
type User {
  firstName: String!           # ✓
  lastName: String!            # ✓
  user_id: ID!                 # ✗ 避免下划线
  userId: ID!                  # ✓ 统一camelCase
}

# 枚举值：使用UPPER_SNAKE_CASE
enum UserRole {
  ADMIN
  EDITOR
  AUTHOR
  READER
}

# 输入类型：添加Input后缀
input CreateUserInput { ... }
input UpdateUserInput { ... }
input UserFilterInput { ... }

# 接口实现：添加Impl后缀或使用前缀
interface Node {
  id: ID!
}

type User implements Node { ... }
type Post implements Node { ... }
```

**关系建模**：

```graphql
# 一对一关系
type User {
  id: ID!
  profile: Profile          # 隐式nullable
  explicitProfile: Profile! # 显式非空
}

type Profile {
  id: ID!
  user: User!                # 反向引用
  bio: String
  avatar: String
}

# 一对多关系
type Author {
  id: ID!
  posts: [Post!]!            # 非空数组，元素非空
  postCount: Int!            # 显式计数
}

type Post {
  id: ID!
  author: Author!            # 外键关系
  authorId: ID!              # 显式外键（有时需要）
}

# 多对多关系
type Post {
  id: ID!
  tags: [Tag!]!              # 通过连接表
}

type Tag {
  id: ID!
  posts: [Post!]!            # 反向关系
  name: String!
}

# 自引用关系
type Employee {
  id: ID!
  name: String!
  manager: Employee          # 可空：CEO没有manager
  directReports: [Employee!]!
  colleagues: [Employee!]!   # 同级关系
}
```

**连接表实现（多对多）**：

```graphql
# 显式连接表类型（有时需要额外数据）
type Post {
  id: ID!
  postTags: [PostTag!]!
}

type Tag {
  id: ID!
  postTags: [PostTag!]!
}

type PostTag {
  post: Post!
  tag: Tag!
  addedAt: DateTime!
  addedBy: User!
}

# 简化查询：直接关系
query {
  post(id: "1") {
    tags {
      name
    }
  }
}
```

### 2.2 关系建模实战

**社交网络建模**：

```graphql
# 完整的社交网络Schema
type User {
  # 基本信息
  id: ID!
  username: String! @unique
  displayName: String!
  email: String! @unique
  avatar: String
  bio: String

  # 时间戳
  createdAt: DateTime!
  updatedAt: DateTime!
  lastActiveAt: DateTime

  # 关系字段
  posts(limit: Int = 10, offset: Int = 0): [Post!]!
  publishedPosts: [Post!]!
  draftPosts: [Post!]!

  followers(limit: Int = 20, offset: Int = 0): [User!]!
  following(limit: Int = 20, offset: Int = 0): [User!]!
  followerCount: Int!
  followingCount: Int!
  mutualFollowers(otherUserId: ID!): [User!]!

  # 互动数据
  likes: [Like!]!
  comments: [Comment!]!
  savedPosts: [SavedPost!]!

  # 社交GraphQL特有字段
  isFollowing: Boolean!          # 当前用户是否关注此人
  isFollowedBy: Boolean!         # 此人是否关注当前用户
  followButtonState: FollowState! # 按钮状态

  # 统计
  postCount: Int!
  totalLikeCount: Int!
  totalCommentCount: Int!

  # 推荐
  suggestedUsers(limit: Int = 5): [User!]!
  trendingInNetwork: [Post!]!
}

enum FollowState {
  NONE              # 未关注
  FOLLOWING         # 已关注
  FOLLOWING_BACK    # 互相关注
  BLOCKED           # 被屏蔽
}

type Post {
  id: ID!
  author: User!
  title: String!
  content: String!
  excerpt: String
  coverImage: String
  status: PostStatus!

  # 互动
  likes: [Like!]!
  comments: [Comment!]!
  viewers: [User!]!

  # 统计
  likeCount: Int!
  commentCount: Int!
  viewCount: Int!

  # 时间
  createdAt: DateTime!
  updatedAt: DateTime!
  publishedAt: DateTime
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
  DELETED
}

type Comment {
  id: ID!
  author: User!
  post: Post!
  parentComment: Comment
  replies: [Comment!]!
  content: String!

  likeCount: Int!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Like {
  id: ID!
  user: User!
  post: Post
  comment: Comment
  createdAt: DateTime!
}
```

**电商建模**：

```graphql
# 电商完整Schema片段
type Product {
  id: ID!
  name: String!
  slug: String! @unique
  description: String
  price: Price!
  images: [ProductImage!]!
  videos: [ProductVideo!]

  # 库存
  inventory: Inventory!
  inStock: Boolean!
  stockQuantity: Int!

  # 分类
  categories: [Category!]!
  primaryCategory: Category!
  tags: [Tag!]!

  # 变体
  variants: [ProductVariant!]!
  attributes: [ProductAttribute!]!

  # 评价
  reviews: [Review!]!
  averageRating: Float!
  reviewCount: Int!

  # 关联
  relatedProducts: [Product!]!
  frequentlyBoughtTogether: [Product!]!

  # 促销
  currentPromotion: Promotion
  discount: Float

  createdAt: DateTime!
  updatedAt: DateTime!
}

type Price {
  amount: Float!
  currency: Currency!
  formatted: String!  # "$99.00"
}

enum Currency {
  USD
  EUR
  GBP
  CNY
  JPY
}

type ProductVariant {
  id: ID!
  sku: String! @unique
  name: String!
  price: Price!
  attributes: [AttributeValue!]!
  inventory: Inventory!
  image: ProductImage
}

type Inventory {
  quantity: Int!
  warehouse: Warehouse!
  reservedQuantity: Int!
  availableQuantity: Int!  # 计算字段
  lowStockThreshold: Int!
  inStock: Boolean!
  restockDate: DateTime
}
```

### 2.3 接口与联合

**接口实现模式**：

```graphql
# 内容发布接口
interface Content {
  id: ID!
  title: String!
  slug: String!
  content: String!
  author: User!
  status: ContentStatus!
  createdAt: DateTime!
  updatedAt: DateTime!
  publishedAt: DateTime

  # 通用统计
  viewCount: Int!
  likeCount: Int!
  commentCount: Int!
}

# 博客文章
type BlogPost implements Content {
  id: ID!
  title: String!
  slug: String!
  content: String!
  author: User!
  status: ContentStatus!
  createdAt: DateTime!
  updatedAt: DateTime!
  publishedAt: DateTime

  # Content字段
  viewCount: Int!
  likeCount: Int!
  commentCount: Int!

  # BlogPost特有字段
  coverImage: String
  tags: [Tag!]!
  readingTime: Int!
  isFeatured: Boolean!
}

# 静态页面
type StaticPage implements Content {
  id: ID!
  title: String!
  slug: String!
  content: String!
  author: User!
  status: ContentStatus!
  createdAt: DateTime!
  updatedAt: DateTime!
  publishedAt: DateTime

  # Content字段
  viewCount: Int!
  likeCount: Int!
  commentCount: Int!

  # StaticPage特有字段
  template: PageTemplate!
  metaDescription: String
  metaKeywords: [String!]!
}

enum ContentStatus {
  DRAFT
  PUBLISHED
  SCHEDULED
  ARCHIVED
}

enum PageTemplate {
  DEFAULT
  LANDING
  ABOUT
  CONTACT
}

# 媒体内容
type Media implements Content {
  id: ID!
  title: String!
  slug: String!
  content: String!           # 描述
  author: User!
  status: ContentStatus!
  createdAt: DateTime!
  updatedAt: DateTime!
  publishedAt: DateTime

  # Content字段
  viewCount: Int!
  likeCount: Int!
  commentCount: Int!

  # Media特有字段
  url: String!
  mimeType: String!
  fileSize: Int!
  duration: Int              # 视频/音频时长
  dimensions: ImageDimensions
}
```

**联合类型实战**：

```graphql
# 搜索结果联合
union SearchResult = User | Post | Comment | Tag | Product

type Query {
  search(query: String!, type: SearchType, limit: Int = 20): SearchResultConnection!
}

type SearchResultConnection {
  edges: [SearchResultEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
  facets: [SearchFacet!]!
}

type SearchResultEdge {
  cursor: String!
  node: SearchResult!
}

# 资产联合
union Asset = Image | Video | Document | Audio

type MediaLibrary {
  assets: [Asset!]!
}

# 内容订阅联合
union SubscribableContent = BlogPost | PodcastEpisode | Video | LiveStream

type Subscription {
  content: SubscribableContent!
  subscribedAt: DateTime!
  notifyOn: [NotificationType!]!
}
```

### 2.4 输入类型设计

**分页输入**：

```graphql
# 标准分页输入
input PaginationInput {
  first: Int
  after: String        # 游标
  last: Int
  before: String
}

# 排序输入
input SortInput {
  field: String!
  order: SortOrder = ASC
}

enum SortOrder {
  ASC
  DESC
}

# 组合分页和排序
input PostConnectionInput {
  pagination: PaginationInput
  sort: PostSortInput
  filter: PostFilterInput
}

input PostSortInput {
  field: PostSortField!
  order: SortOrder = DESC
}

enum PostSortField {
  CREATED_AT
  UPDATED_AT
  PUBLISHED_AT
  VIEW_COUNT
  LIKE_COUNT
  COMMENT_COUNT
}

# 过滤器输入
input PostFilterInput {
  status: PostStatus
  authorId: ID
  categoryId: ID
  tags: [String!]
  searchQuery: String
  createdAfter: DateTime
  createdBefore: DateTime
  minViews: Int
  maxViews: Int
  isFeatured: Boolean
}
```

**复杂过滤输入**：

```graphql
# 地理位置过滤
input LocationFilterInput {
  latitude: Float!
  longitude: Float!
  radiusKm: Float!
  unit: DistanceUnit = KILOMETER
}

enum DistanceUnit {
  KILOMETER
  MILE
}

# 价格范围过滤
input PriceRangeInput {
  min: Float
  max: Float
  currency: Currency
}

# 组合过滤器
input AdvancedSearchInput {
  # 文本搜索
  query: String
  searchFields: [String!]

  # 分类过滤
  categories: [ID!]
  excludeCategories: [ID!]

  # 属性过滤
  attributes: [AttributeFilterInput!]

  # 价格过滤
  priceRange: PriceRangeInput

  # 地理位置
  location: LocationFilterInput

  # 时间范围
  dateRange: DateRangeInput

  # 排序
  sortBy: String
  sortOrder: SortOrder = DESC

  # 分页
  pagination: PaginationInput
}

input AttributeFilterInput {
  name: String!
  values: [String!]!
  operator: AttributeOperator = ANY
}

enum AttributeOperator {
  ALL      # 必须匹配所有值
  ANY      # 匹配任意值
  EXACT    # 精确匹配
}
```

---

## 三、Resolver深入

### 3.1 Resolver签名详解

**标准Resolver结构**：

```typescript
// 完整Resolver签名
type GraphQLResolver = (
  parent: any,                    // 父对象
  args: {                         // 查询参数
    [key: string]: any;
  },
  context: Context,               // 共享上下文
  info: GraphQLResolveInfo        // 解析信息
) => any;                         // 同步或Promise

// 解析信息类型
interface GraphQLResolveInfo {
  fieldName: string;              // 字段名
  fieldNodes: FieldNode[];        // AST节点
  returnType: GraphQLObjectType;  // 返回类型
  parentType: GraphQLObjectType;  // 父类型
  path: ResponsePath;             // 路径
  schema: GraphQLSchema;           // Schema
  fragments: FragmentMap;         // 片段
  rootValue: any;                 // 根值
  operation: OperationDefinitionNode; // 操作
  variableValues: { [key: string]: any }; // 变量
}
```

**不同场景的Resolver示例**：

```typescript
// 1. 根Query Resolver
const resolvers = {
  Query: {
    // 无参数resolver
    me: (parent, args, context) => {
      return context.currentUser;
    },

    // 有参数resolver
    user: (parent, { id }, context) => {
      return context.db.user.findUnique({ where: { id } });
    },

    // 带默认值参数
    posts: (parent, { limit = 10, offset = 0 }, context) => {
      return context.db.post.findMany({
        take: limit,
        skip: offset,
      });
    },

    // 多参数
    searchPosts: (parent, {
      query,
      tags,
      authorId,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      page = 1,
      pageSize = 20
    }, context) => {
      return context.searchService.search({
        query,
        filters: { tags, authorId },
        sort: { field: sortBy, order: sortOrder },
        pagination: { page, pageSize }
      });
    },
  },
};

// 2. 对象字段Resolver
const resolvers = {
  User: {
    // computed field - 计算字段
    fullName: (parent) => `${parent.firstName} ${parent.lastName}`,

    // async field - 异步字段
    posts: async (parent, args, context) => {
      return await context.db.post.findMany({
        where: { authorId: parent.id }
      });
    },

    // conditional field - 条件字段
    email: (parent, args, context) => {
      // 只有作者本人或管理员才能查看邮箱
      if (context.currentUser.id === parent.id || context.currentUser.role === 'ADMIN') {
        return parent.email;
      }
      return null; // 其他人看不到邮箱
    },

    // field with arguments - 带参数的字段
    posts: (parent, { limit, offset, status }, context) => {
      return context.db.post.findMany({
        where: {
          authorId: parent.id,
          ...(status && { status })
        },
        take: limit || 10,
        skip: offset || 0,
      });
    },

    // connection field - 分页连接
    followers: (parent, { first, after }, context) => {
      return context.db.user.findMany({
        where: { followingId: parent.id },
        take: first + 1, // 多取一个判断hasNextPage
        cursor: after ? { id: after } : undefined,
      }).then(users => ({
        edges: users.slice(0, first).map(user => ({
          node: user,
          cursor: encodeCursor(user.id),
        })),
        pageInfo: {
          hasNextPage: users.length > first,
          endCursor: users.length > first ? encodeCursor(users[first - 1].id) : null,
        },
      }));
    },
  },
};

// 3. 枚举字段Resolver
const resolvers = {
  UserRole: {
    ADMIN: 'ADMIN',
    EDITOR: 'EDITOR',
    AUTHOR: 'AUTHOR',
    READER: 'READER',
  },
};
```

### 3.2 Context传递机制

**Context创建与传递**：

```typescript
// 创建Apollo Server
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';

const app = express();

// Context创建函数 - 每个请求都会调用
const createContext = async ({ req, res }) => {
  // 从请求头获取token
  const token = req.headers.authorization?.replace('Bearer ', '');

  // 验证token并获取用户
  let currentUser = null;
  if (token) {
    try {
      currentUser = await verifyJWT(token);
    } catch (error) {
      // token无效，继续但不设置用户
    }
  }

  // 创建DataLoader实例（每个请求独立）
  const loaders = createLoaders();

  return {
    currentUser,
    token,
    db: database,
    loaders,
    req,
    res,
    t: i18next.t, // 国际化函数
  };
};

// 在Resolver中使用context
const resolvers = {
  Query: {
    me: (parent, args, { currentUser, db }) => {
      if (!currentUser) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }
      return currentUser;
    },

    user: async (parent, { id }, { loaders }) => {
      // 使用DataLoader批量加载
      return loaders.user.load(id);
    },

    posts: async (parent, args, { db, currentUser }) => {
      return db.post.findMany({
        where: {
          authorId: currentUser?.id,
          status: 'PUBLISHED'
        }
      });
    },
  },

  User: {
    // 使用context中的服务
    posts: async (parent, args, { db, currentUser }) => {
      // 检查隐私设置
      if (parent.id !== currentUser?.id && !parent.showPostsPublicly) {
        // 只返回公开帖子
        return db.post.findMany({
          where: { authorId: parent.id, status: 'PUBLISHED' }
        });
      }
      return db.post.findMany({ where: { authorId: parent.id } });
    },

    email: (parent, args, { currentUser }) => {
      // 字段级权限：只允许本人查看
      if (currentUser?.id !== parent.id) {
        return null;
      }
      return parent.email;
    },
  },
};
```

**Context类型定义**：

```typescript
// 定义Context类型
interface Context {
  currentUser: User | null;
  token: string | null;
  db: Database;
  loaders: Loaders;
  req: Request;
  res: Response;
  t: TranslateFunction;
}

// Loaders定义
interface Loaders {
  user: DataLoader<string, User>;
  post: DataLoader<string, Post>;
  comment: DataLoader<string, Comment>;
  // 批量加载器
}

// 创建Loaders工厂函数
function createLoaders(db: Database): Loaders {
  return {
    // 用户批量加载器
    user: new DataLoader(async (ids) => {
      const users = await db.user.findMany({
        where: { id: { in: ids } }
      });
      // 确保返回顺序与ids一致
      return ids.map(id => users.find(u => u.id === id) || null);
    }),

    // 帖子批量加载器
    post: new DataLoader(async (ids) => {
      const posts = await db.post.findMany({
        where: { id: { in: ids } }
      });
      return ids.map(id => posts.find(p => p.id === id) || null);
    }),
  };
}
```

### 3.3 异步Resolver

**Promise处理**：

```typescript
const resolvers = {
  Query: {
    // 同步resolver
    viewer: (parent, args, context) => {
      return context.currentUser;
    },

    // 异步resolver - 返回Promise
    user: async (parent, { id }, context) => {
      const user = await context.db.user.findUnique({ where: { id } });
      if (!user) {
        throw new GraphQLError(`User with id ${id} not found`);
      }
      return user;
    },

    // 并行异步操作
    dashboard: async (parent, args, context) => {
      // 并行执行多个查询
      const [user, posts, notifications, recommendations] = await Promise.all([
        context.db.user.findUnique({ where: { id: context.currentUser.id } }),
        context.db.post.findMany({ where: { authorId: context.currentUser.id }, take: 5 }),
        context.db.notification.findMany({ where: { userId: context.currentUser.id }, take: 10 }),
        getRecommendations(context.currentUser.id),
      ]);

      return {
        user,
        recentPosts: posts,
        notifications,
        recommendations,
      };
    },
  },

  User: {
    // 异步计算字段
    stats: async (parent, args, { db }) => {
      const [postCount, followerCount, followingCount] = await Promise.all([
        db.post.count({ where: { authorId: parent.id } }),
        db.follow.count({ where: { followingId: parent.id } }),
        db.follow.count({ where: { followerId: parent.id } }),
      ]);

      return { postCount, followerCount, followingCount };
    },

    // 延迟加载的关联
    recentActivity: async (parent, args, { db }) => {
      const [posts, comments, likes] = await Promise.all([
        db.post.findMany({
          where: { authorId: parent.id },
          orderBy: { createdAt: 'desc' },
          take: 5
        }),
        db.comment.findMany({
          where: { authorId: parent.id },
          orderBy: { createdAt: 'desc' },
          take: 5
        }),
        db.like.findMany({
          where: { userId: parent.id },
          orderBy: { createdAt: 'desc' },
          take: 5
        }),
      ]);

      return [...posts.map(p => ({ type: 'POST', data: p })),
              ...comments.map(c => ({ type: 'COMMENT', data: c })),
              ...likes.map(l => ({ type: 'LIKE', data: l }))]
        .sort((a, b) => b.data.createdAt - a.data.createdAt)
        .slice(0, 10);
    },
  },
};
```

**Error Boundaries与错误处理**：

```typescript
// 自定义错误类型
class GraphQLError extends Error {
  constructor(message, extensions) {
    super(message);
    this.extensions = extensions;
  }
}

// Resolver中的错误处理
const resolvers = {
  Mutation: {
    createPost: async (parent, { input }, { db, currentUser }) => {
      try {
        // 验证输入
        if (!input.title || input.title.length < 3) {
          throw new GraphQLError('Title must be at least 3 characters', {
            code: 'VALIDATION_ERROR',
            field: 'title'
          });
        }

        // 创建帖子
        const post = await db.post.create({
          data: {
            title: input.title,
            content: input.content,
            authorId: currentUser.id,
          }
        });

        return post;

      } catch (error) {
        // 处理数据库唯一约束错误
        if (error.code === 'P2002') {
          throw new GraphQLError('A post with this title already exists', {
            code: 'DUPLICATE_ERROR',
            field: 'title'
          });
        }

        // 重新抛出已知错误
        if (error instanceof GraphQLError) {
          throw error;
        }

        // 处理未知错误
        console.error('Error creating post:', error);
        throw new GraphQLError('Internal server error', {
          code: 'INTERNAL_ERROR'
        });
      }
    },

    // 事务中的错误处理
    transferFunds: async (parent, { fromId, toId, amount }, { db }) => {
      return await db.$transaction(async (tx) => {
        const fromAccount = await tx.account.findUnique({ where: { id: fromId } });
        if (!fromAccount || fromAccount.balance < amount) {
          throw new GraphQLError('Insufficient funds', {
            code: 'INSUFFICIENT_FUNDS'
          });
        }

        await tx.account.update({
          where: { id: fromId },
          data: { balance: { decrement: amount } }
        });

        await tx.account.update({
          where: { id: toId },
          data: { balance: { increment: amount } }
        });

        // 创建交易记录
        const transaction = await tx.transaction.create({
          data: { fromId, toId, amount }
        });

        return transaction;
      });
    },
  },
};
```

### 3.4 N+1问题与DataLoader

**N+1问题演示**：

```typescript
// 问题场景：N+1查询
const posts = await db.post.findMany({ where: { status: 'PUBLISHED' } });
// 1次查询获取所有帖子

// 然后遍历每个帖子获取作者
const postsWithAuthors = posts.map(async (post) => {
  const author = await db.user.findUnique({ where: { id: post.authorId } });
  return { ...post, author };
});
// N次查询获取作者 - N+1问题！

// GraphQL中的N+1问题
const query = `
  query {
    posts {
      title
      author {  # 每个post都会触发一次author查询
        name
      }
    }
  }
`;

// 如果有100个posts，会执行：
// 1次: SELECT * FROM posts
// 100次: SELECT * FROM users WHERE id = ?
// 总计：101次数据库查询
```

**DataLoader解决方案**：

```typescript
import DataLoader from 'dataloader';

// 创建BatchLoadFn
type BatchLoadFn<K, V> = (keys: K[]) => Promise<V[]>;

// 用户加载器
const createUserLoader = (db: Database): DataLoader<string, User> => {
  return new DataLoader(async (ids: readonly string[]) => {
    // 一次性查询所有用户
    const users = await db.user.findMany({
      where: { id: { in: ids as string[] } }
    });

    // 创建ID到用户的映射
    const userMap = new Map(users.map(u => [u.id, u]));

    // 按原始顺序返回
    return ids.map(id => {
      const user = userMap.get(id as string);
      if (!user) {
        return new Error(`User not found: ${id}`);
      }
      return user;
    });
  });
};

// 评论加载器（带嵌套批量）
const createCommentLoader = (db: Database): DataLoader<string, Comment[]> => {
  return new DataLoader(async (postIds: readonly string[]) => {
    const comments = await db.comment.findMany({
      where: { postId: { in: postIds as string[] } },
      orderBy: { createdAt: 'asc' }
    });

    // 按postId分组
    const commentsByPostId = new Map<string, Comment[]>();
    postIds.forEach(id => commentsByPostId.set(id as string, []));

    comments.forEach(comment => {
      const list = commentsByPostId.get(comment.postId);
      if (list) list.push(comment);
    });

    return postIds.map(id => commentsByPostId.get(id as string) || []);
  });
};

// 在Resolver中使用DataLoader
const resolvers = {
  Query: {
    posts: (parent, args, { db, loaders }) => {
      // 直接返回数据，不做N+1
      return db.post.findMany({
        where: { status: 'PUBLISHED' },
        take: 10
      });
    },
  },

  Post: {
    // 使用DataLoader加载author
    author: (post, args, { loaders }) => {
      // DataLoader会批量去重
      return loaders.user.load(post.authorId);
    },

    // 使用DataLoader加载comments
    comments: (post, args, { loaders }) => {
      return loaders.comment.load(post.id);
    },

    // 嵌套N+1问题：每个comment的author
    comments: async (post, args, { loaders }) => {
      const comments = await loaders.comment.load(post.id);

      // 对每个comment的author也使用DataLoader
      // 这时DataLoader会再次批量处理所有comment的authorId
      return comments;
    },
  },

  Comment: {
    author: (comment, args, { loaders }) => {
      return loaders.user.load(comment.authorId);
    },
  },
};

// 带缓存键的DataLoader
const createPostsByAuthorLoader = (db: Database): DataLoader<string, Post[]> => {
  return new DataLoader(async (authorIds: readonly string[]) => {
    const posts = await db.post.findMany({
      where: { authorId: { in: authorIds as string[] } }
    });

    const postsByAuthorId = new Map<string, Post[]>();
    authorIds.forEach(id => postsByAuthorId.set(id as string, []));

    posts.forEach(post => {
      const list = postsByAuthorId.get(post.authorId);
      if (list) list.push(post);
    });

    return authorIds.map(id => postsByAuthorId.get(id as string) || []);
  });
};
```

**复杂DataLoader示例**：

```typescript
// 带过滤和排序的DataLoader
const createFilteredPostsLoader = (db: Database) => {
  return new DataLoader(async (requests: readonly { authorId: string; status?: string }[]) => {
    const authorIds = requests.map(r => r.authorId);
    const statuses = requests.map(r => r.status).filter(Boolean);

    const posts = await db.post.findMany({
      where: {
        authorId: { in: authorIds as string[] },
        ...(statuses.length > 0 && { status: { in: statuses as string[] } })
      },
      orderBy: { createdAt: 'desc' }
    });

    // 按authorId和status分组
    const postsMap = new Map<string, Post[]>();
    requests.forEach(req => {
      const key = `${req.authorId}:${req.status || 'all'}`;
      postsMap.set(key, []);
    });

    posts.forEach(post => {
      const keyAll = `${post.authorId}:all`;
      const keyStatus = `${post.authorId}:${post.status}`;

      const listAll = postsMap.get(keyAll);
      const listStatus = postsMap.get(keyStatus);

      if (listAll) listAll.push(post);
      if (listStatus) listStatus.push(post);
    });

    return requests.map(req => {
      const key = `${req.authorId}:${req.status || 'all'}`;
      return postsMap.get(key) || [];
    });
  });
};

// 使用
const resolvers = {
  User: {
    posts: async (user, { status }, { loaders }) => {
      // 带过滤条件的批量加载
      return loaders.filteredPosts.load({ authorId: user.id, status });
    },
  },
};
```

---

## 四、认证与权限

### 4.1 JWT集成

**JWT认证流程**：

```typescript
// 1. 生成Token
import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;
const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

function generateAccessToken(user: User): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );
}

function generateRefreshToken(user: User): string {
  return jwt.sign(
    { userId: user.id },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
}

// 2. 验证Token
function verifyAccessToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as JWTPayload;
  } catch (error) {
    throw new GraphQLError('Invalid or expired access token', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }
}

// 3. Context中添加用户
const createContext = async ({ req }) => {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const payload = verifyAccessToken(token);
      const user = await db.user.findUnique({ where: { id: payload.userId } });
      return { currentUser: user };
    } catch {
      return { currentUser: null };
    }
  }

  return { currentUser: null };
};
```

**GraphQL认证Mutations**：

```typescript
const typeDefs = `
  type AuthPayload {
    accessToken: String!
    refreshToken: String!
    user: User!
  }

  type RefreshPayload {
    accessToken: String!
    expiresIn: Int!
  }

  type Mutation {
    login(email: String!, password: String!): AuthPayload!
    register(input: RegisterInput!): AuthPayload!
    refreshToken(token: String!): RefreshPayload!
    logout: Boolean!
  }
`;

const resolvers = {
  Mutation: {
    login: async (parent, { email, password }, { db }) => {
      // 查找用户
      const user = await db.user.findUnique({ where: { email } });
      if (!user) {
        throw new GraphQLError('Invalid email or password', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      // 验证密码
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new GraphQLError('Invalid email or password', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      // 生成tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // 存储refreshToken
      await db.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }
      });

      return { accessToken, refreshToken, user };
    },

    register: async (parent, { input }, { db }) => {
      // 检查邮箱唯一性
      const existingUser = await db.user.findUnique({
        where: { email: input.email }
      });
      if (existingUser) {
        throw new GraphQLError('Email already registered', {
          extensions: { code: 'DUPLICATE_FIELD', field: 'email' }
        });
      }

      // 哈希密码
      const hashedPassword = await bcrypt.hash(input.password, 12);

      // 创建用户
      const user = await db.user.create({
        data: {
          email: input.email,
          password: hashedPassword,
          name: input.name,
          role: 'READER',
        }
      });

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      return { accessToken, refreshToken, user };
    },

    refreshToken: async (parent, { token }, { db }) => {
      try {
        const payload = jwt.verify(token, REFRESH_TOKEN_SECRET) as { userId: string };

        // 验证refreshToken存在且未过期
        const storedToken = await db.refreshToken.findUnique({
          where: { token }
        });

        if (!storedToken || storedToken.expiresAt < new Date()) {
          throw new GraphQLError('Invalid refresh token', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }

        // 获取用户
        const user = await db.user.findUnique({
          where: { id: payload.userId }
        });

        if (!user) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }

        // 生成新的accessToken
        const accessToken = generateAccessToken(user);

        return { accessToken, expiresIn: 900 }; // 15分钟

      } catch (error) {
        throw new GraphQLError('Invalid refresh token', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }
    },

    logout: async (parent, args, { currentUser, db, token }) => {
      if (currentUser && token) {
        // 删除refreshToken
        await db.refreshToken.deleteMany({
          where: { token }
        });
      }
      return true;
    },
  },
};
```

### 4.2 字段级权限

**字段级权限控制**：

```typescript
// 字段级权限示例
const resolvers = {
  User: {
    // 邮箱只能本人查看
    email: (user, args, { currentUser }) => {
      if (!currentUser) return null;
      if (currentUser.id !== user.id && currentUser.role !== 'ADMIN') {
        return null;
      }
      return user.email;
    },

    // 电话号码需要认证后查看
    phone: (user, args, { currentUser }) => {
      if (!currentUser) return null;
      return user.phone;
    },

    // 管理员可以看到IP地址
    ipAddress: (user, args, { currentUser }) => {
      if (currentUser?.role !== 'ADMIN') return null;
      return user.ipAddress;
    },

    // 私人帖子只能本人或好友查看
    privatePosts: async (user, args, { currentUser, db }) => {
      if (!currentUser) return [];

      // 本人可以看自己的
      if (currentUser.id === user.id) {
        return db.post.findMany({ where: { authorId: user.id } });
      }

      // 检查是否是好关友
      const isFriend = await db.friendship.findOne({
        where: {
          OR: [
            { followerId: currentUser.id, followingId: user.id },
            { followerId: user.id, followingId: currentUser.id },
          ]
        }
      });

      if (!isFriend) return [];

      return db.post.findMany({
        where: { authorId: user.id, visibility: 'FRIENDS' }
      });
    },
  },

  Post: {
    // 草稿只有作者可以看到
    content: (post, args, { currentUser }) => {
      if (post.status === 'DRAFT') {
        if (!currentUser || currentUser.id !== post.authorId) {
          return null;
        }
      }
      return post.content;
    },

    // 只有作者和管理员可以看到viewCount的真实数据
    viewCount: (post, args, { currentUser }) => {
      if (!currentUser) return 0;
      if (currentUser.id === post.authorId || currentUser.role === 'ADMIN') {
        return post.viewCount;
      }
      // 对非作者返回模糊值
      if (post.viewCount > 1000) return '1000+';
      return post.viewCount;
    },
  },
};
```

**权限守卫函数**：

```typescript
// 权限守卫辅助函数
type Permission = 'READ' | 'WRITE' | 'DELETE' | 'ADMIN';

const checkPermission = (
  resource: { authorId?: string; visibility?: string },
  permission: Permission,
  currentUser: User | null,
  options?: { allowIfNoAuth?: boolean }
): boolean => {
  // 未登录处理
  if (!currentUser) {
    return options?.allowIfNoAuth ?? false;
  }

  // 管理员权限
  if (currentUser.role === 'ADMIN') return true;

  switch (permission) {
    case 'READ':
      // 公开内容任何人都能读
      if (resource.visibility === 'PUBLIC') return true;
      // 作者本人
      if (resource.authorId === currentUser.id) return true;
      // 好友可见
      if (resource.visibility === 'FRIENDS') {
        return checkIsFriend(currentUser.id, resource.authorId!);
      }
      return false;

    case 'WRITE':
      // 只有作者能写
      return resource.authorId === currentUser.id;

    case 'DELETE':
      // 作者和管理员能删除
      return resource.authorId === currentUser.id || currentUser.role === 'ADMIN';

    default:
      return false;
  }
};

// 在Mutation中使用权限守卫
const resolvers = {
  Mutation: {
    updatePost: async (parent, { id, input }, { currentUser, db }) => {
      const post = await db.post.findUnique({ where: { id } });

      if (!post) {
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      if (!checkPermission(post, 'WRITE', currentUser)) {
        throw new GraphQLError('Not authorized to update this post', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      return db.post.update({
        where: { id },
        data: input
      });
    },

    deletePost: async (parent, { id }, { currentUser, db }) => {
      const post = await db.post.findUnique({ where: { id } });

      if (!post) {
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      if (!checkPermission(post, 'DELETE', currentUser)) {
        throw new GraphQLError('Not authorized to delete this post', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      await db.post.delete({ where: { id } });
      return true;
    },
  },
};
```

### 4.3 指令系统

**自定义Schema指令**：

```graphql
# 定义指令
directive @auth(requires: Role = USER) on FIELD_DEFINITION | OBJECT
directive @rateLimit(max: Int, window: String) on FIELD_DEFINITION
directive @deprecated(reason: String) on FIELD_DEFINITION | ENUM_VALUE
directive @uppercase on FIELD_DEFINITION

enum Role {
  ADMIN
  EDITOR
  USER
  GUEST
}

type Query {
  # 需要登录的字段
  me: User @auth(requires: USER)

  # 需要管理员权限
  allUsers: [User!]! @auth(requires: ADMIN)

  # 限流字段
  search(query: String!): [SearchResult!]! @rateLimit(max: 100, window: "1m")

  # 已废弃字段
  legacyApi: String @deprecated(reason: "Use newApi instead")
}
```

**指令实现**：

```typescript
import { SchemaDirectiveVisitor } from '@graphql-tools/utils';
import { GraphQLDirective, GraphQLField, GraphQLObjectType } from 'graphql';

class AuthDirective extends SchemaDirectiveVisitor {
  visitObject(type: GraphQLObjectType) {
    this.ensureFieldsWrapped(type);
  }

  visitFieldDefinition(field: GraphQLField) {
    this.ensureFieldsWrapped(field);
  }

  ensureFieldsWrapped(objectOrField) {
    const { requires } = this.args;

    // 原来的resolver
    const fieldResolver = objectOrField.resolve;

    objectOrField.resolve = async (parent, args, context, info) => {
      // 检查认证
      if (!context.currentUser) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      // 检查角色权限
      const roleHierarchy = ['GUEST', 'USER', 'EDITOR', 'ADMIN'];
      const userRoleIndex = roleHierarchy.indexOf(context.currentUser.role);
      const requiredRoleIndex = roleHierarchy.indexOf(requires);

      if (userRoleIndex < requiredRoleIndex) {
        throw new GraphQLError(
          `Requires ${requires} role, but you have ${context.currentUser.role}`,
          { extensions: { code: 'FORBIDDEN' } }
        );
      }

      // 调用原resolver
      return fieldResolver ? fieldResolver.call(this, parent, args, context, info) : parent[info.fieldName];
    };
  }
}

class RateLimitDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field: GraphQLField) {
    const { max, window } = this.args;
    const windowMs = parseWindow(window); // "1m" -> 60000

    const originalResolve = field.resolve;

    field.resolve = async function(parent, args, context, info) {
      const key = `ratelimit:${info.fieldName}:${context.currentUser?.id || context.ip}`;

      // 使用Redis进行限流
      const current = await context.redis.incr(key);
      if (current === 1) {
        await context.redis.expire(key, windowMs / 1000);
      }

      if (current > max) {
        throw new GraphQLError('Rate limit exceeded', {
          extensions: {
            code: 'RATE_LIMITED',
            retryAfter: await context.redis.ttl(key)
          }
        });
      }

      return originalResolve ? originalResolve.call(this, parent, args, context, info) : parent[info.fieldName];
    };
  }
}

// 注册指令
const schema = makeExecutableSchema({
  typeDefs,
  schemaDirectives: {
    auth: AuthDirective,
    rateLimit: RateLimitDirective,
  },
});
```

### 4.4 实战：完整权限设计

**权限系统设计**：

```typescript
// 权限配置
const permissions = {
  // 资源 -> 操作 -> 角色
  Post: {
    read: ['ADMIN', 'EDITOR', 'USER', 'GUEST'],
    create: ['ADMIN', 'EDITOR', 'AUTHOR'],
    update: ['ADMIN', 'EDITOR'], // 只有编辑和管理员能更新任何帖子
    updateOwn: ['ADMIN', 'EDITOR', 'AUTHOR'], // 作者能更新自己的
    delete: ['ADMIN'], // 只有管理员能删除
    deleteOwn: ['ADMIN', 'EDITOR', 'AUTHOR'],
  },

  Comment: {
    read: ['ADMIN', 'EDITOR', 'USER', 'GUEST'],
    create: ['ADMIN', 'EDITOR', 'USER'],
    update: ['ADMIN', 'EDITOR'],
    updateOwn: ['ADMIN', 'EDITOR', 'USER'],
    delete: ['ADMIN', 'EDITOR'],
    deleteOwn: ['ADMIN', 'EDITOR', 'USER'],
  },

  User: {
    read: ['ADMIN', 'EDITOR', 'USER', 'GUEST'],
    update: ['ADMIN'],
    updateOwn: ['ADMIN', 'EDITOR', 'USER'],
    delete: ['ADMIN'],
  },
};

// 检查权限函数
function canAccess(
  resource: string,
  action: string,
  user: User | null,
  resourceAuthorId?: string
): boolean {
  if (!user) {
    // 未登录只能访问public read
    return resource in permissions &&
           'read' in permissions[resource] &&
           permissions[resource].read.includes('GUEST');
  }

  const resourcePermissions = permissions[resource];
  if (!resourcePermissions) return false;

  // 检查完整权限
  const actionPermission = `${action}Own` as keyof typeof resourcePermissions;
  const directPermission = action as keyof typeof resourcePermissions;

  // 检查是否匹配直接权限
  const directAccess = resourcePermissions[directPermission]?.includes(user.role);

  // 检查是否匹配Own权限
  const ownAccess = resourcePermissions[actionPermission]?.includes(user.role)
                    && resourceAuthorId === user.id;

  return directAccess || ownAccess;
}

// 权限检查高阶函数
function requirePermission(resource: string, action: string) {
  return (resolve, parent, args, context, info) => {
    // 从info中获取资源信息
    const resourceId = args.id || args[info.fieldName]?.id;

    // 如果是更新/删除操作，需要先获取资源检查作者
    if (['update', 'delete'].includes(action)) {
      // 验证资源存在且用户有权限
    }

    if (!canAccess(resource, action, context.currentUser)) {
      throw new GraphQLError(
        `Not authorized to ${action} this ${resource}`,
        { extensions: { code: 'FORBIDDEN' } }
      );
    }

    return resolve(parent, args, context, info);
  };
}

// 在Resolver中使用
const resolvers = {
  Mutation: {
    createPost: async (parent, { input }, { currentUser, db }) => {
      if (!canAccess('Post', 'create', currentUser)) {
        throw new GraphQLError('Not authorized to create posts', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      return db.post.create({
        data: {
          ...input,
          authorId: currentUser!.id,
        }
      });
    },

    updatePost: async (parent, { id, input }, { currentUser, db }) => {
      const post = await db.post.findUnique({ where: { id } });

      if (!post) {
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      if (!canAccess('Post', 'update', currentUser, post.authorId)) {
        throw new GraphQLError('Not authorized to update this post', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      return db.post.update({
        where: { id },
        data: input
      });
    },

    deletePost: async (parent, { id }, { currentUser, db }) => {
      const post = await db.post.findUnique({ where: { id } });

      if (!post) {
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      if (!canAccess('Post', 'delete', currentUser, post.authorId)) {
        throw new GraphQLError('Not authorized to delete this post', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      await db.post.delete({ where: { id } });
      return true;
    },
  },
};
```

---

## 五、性能优化

### 5.1 查询复杂度分析

**查询复杂度计算**：

```typescript
import { createComplexityLimitRule } from 'graphql-query-complexity';

// 复杂度估算器
const queryComplexity = ({
  // 字段复杂度
  User: 1,
  Post: 2,
  Comment: 1,

  // 列表字段：列表长度 * 单项复杂度
  users: (args) => Math.min(args.first || 10, 100) * 1,
  posts: (args) => Math.min(args.limit || 10, 50) * 2,
  followers: (args) => Math.min(args.first || 10, 50) * 1,

  // 连接字段
  comments: (args) => Math.min(args.first || 10, 50) * 1,
  replies: (args) => Math.min(args.first || 10, 20) * 1,

  // 嵌套查询乘法
  // user { posts { comments { replies } } }
  // = 1 * 2 * 1 * 1 = 4（基础）到 1 * 50 * 50 * 20 = 50000（最大）
}) => {
  return {
    estimators: [
      // 字段复杂度估算
      (args) => {
        return (node) => {
          switch (node.name.value) {
            case 'Query':
            case 'Mutation':
              return 0;
            case 'users':
              return Math.min(node.arguments?.find(a => a.name.value === 'first')?.value?.value || 10, 100);
            case 'posts':
              return Math.min(node.arguments?.find(a => a.name.value === 'limit')?.value?.value || 10, 50) * 2;
            default:
              return 1;
          }
        };
      },
    ],
  };
};

// 应用复杂度限制
const rule = createComplexityLimitRule(1000, {
  formatError: ({ complexity, maxComplexity }) => {
    return new GraphQLError(
      `Query complexity is ${complexity}, maximum allowed is ${maxComplexity}`,
      { extensions: { code: 'QUERY_TOO_COMPLEX' } }
    );
  },
});

// Apollo Server配置
const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [rule],
});
```

**深度限制**：

```typescript
import { depthLimit } from 'graphql-depth-limit';

// 限制查询深度
const depthRule = depthLimit(10, { ignore: ['id', '_id'] });

// Apollo Server配置
const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [depthRule],
});
```

### 5.2 持久化查询

**持久化查询实现**：

```typescript
import { createHash } from 'crypto';

// 存储已注册的查询
const persistedQueries = new Map<string, { hash: string; query: string; variablesSchema?: string }>();

// 注册查询
async function registerQuery(query: string, variablesSchema?: string): Promise<string> {
  const hash = createHash('sha256').update(query).digest('hex').substring(0, 16);

  // 存储查询
  persistedQueries.set(hash, { hash, query, variablesSchema });

  // 可选：持久化到数据库
  await db.persistedQuery.create({
    data: { hash, query, variablesSchema }
  });

  return hash;
}

// 检查持久化查询
async function getPersistedQuery(hash: string): Promise<string | null> {
  // 先检查内存
  const cached = persistedQueries.get(hash);
  if (cached) return cached.query;

  // 再检查数据库
  const stored = await db.persistedQuery.findUnique({ where: { hash } });
  return stored?.query || null;
}

// Apollo Server 4 持久化配置
const server = new ApolloServer({
  typeDefs,
  resolvers,
  allowAuthenticatedForPersistedQueries: true,
  async resolvePersistedQuery(hash: string) {
    const query = await getPersistedQuery(hash);
    if (!query) {
      throw new GraphQLError('PersistedQueryNotFound', {
        extensions: { code: 'PERSISTED_QUERY_NOT_FOUND' }
      });
    }
    return parse(query);
  },
});

// 客户端使用
// POST /graphql?extensions={"persistedQuery":{"version":1,"sha256Hash":"abc123"}}
```

### 5.3 响应缓存

**响应缓存策略**：

```typescript
import DataLoader from 'dataloader';
import { CachedExecution } from '@graphql-box/core';

// 1. 字段级缓存
const fieldCache = new Map<string, { data: any; expiresAt: number }>();

function cacheField(key: string, data: any, ttlSeconds: number) {
  fieldCache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

function getCachedField(key: string): any | null {
  const cached = fieldCache.get(key);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    fieldCache.delete(key);
    return null;
  }
  return cached.data;
}

// Resolver中使用缓存
const resolvers = {
  User: {
    // 缓存用户公开信息60秒
    displayName: (user, args, context) => {
      const cacheKey = `user:displayName:${user.id}`;
      const cached = getCachedField(cacheKey);
      if (cached) return cached;

      const result = user.displayName;
      cacheField(cacheKey, result, 60);
      return result;
    },

    // 统计数据缓存5分钟
    stats: async (user, args, { db }) => {
      const cacheKey = `user:stats:${user.id}`;
      const cached = getCachedField(cacheKey);
      if (cached) return cached;

      const stats = await db.$queryRaw`
        SELECT
          (SELECT COUNT(*) FROM posts WHERE author_id = ${user.id}) as post_count,
          (SELECT COUNT(*) FROM followers WHERE following_id = ${user.id}) as follower_count
      `;

      cacheField(cacheKey, stats, 300);
      return stats;
    },
  },
};

// 2. Redis缓存层
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

class GraphQLCache {
  private redis: Redis;
  private defaultTTL = 300; // 5分钟

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async get(key: string): Promise<any | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.redis.setex(key, ttl || this.defaultTTL, JSON.stringify(value));
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  // 生成缓存key
  generateCacheKey(
    fieldName: string,
    parentId: string | undefined,
    args: Record<string, any>
  ): string {
    const parts = ['graphql', 'cache'];
    if (parentId) parts.push(parentId);
    parts.push(fieldName);
    if (Object.keys(args).length > 0) {
      parts.push(JSON.stringify(sortObject(args)));
    }
    return parts.join(':');
  }
}

const cache = new GraphQLCache(redis);

// 缓存优化后的Resolver
const resolvers = {
  Post: {
    async author(post, args, { db, cache }) {
      const cacheKey = cache.generateCacheKey('author', post.id, {});

      const cached = await cache.get(cacheKey);
      if (cached) return cached;

      const author = await db.user.findUnique({ where: { id: post.authorId } });

      // 缓存5分钟
      await cache.set(cacheKey, author, 300);

      return author;
    },
  },
};

// 3. Cache-Control 头
function setCacheHeaders(res, cacheControl) {
  if (cacheControl.scope === 'PUBLIC') {
    res.set('Cache-Control', `public, max-age=${cacheControl.maxAge}`);
  } else {
    res.set('Cache-Control', 'private');
  }
}

// Apollo Server插件
const cacheControlPlugin = {
  async responseForOperation(operation) {
    // 根据操作类型设置缓存策略
    if (operation.operation === 'query') {
      return {
        // 公开查询缓存10秒
        ttl: 10,
        scope: 'PUBLIC',
      };
    }
    return {
      ttl: 0,
      scope: 'PRIVATE',
    };
  },
};
```

### 5.4 实战：N+1彻底解决

**完整DataLoader工厂**：

```typescript
// DataLoader工厂
import DataLoader from 'dataloader';

interface Loaders {
  userLoader: DataLoader<string, User>;
  postLoader: DataLoader<string, Post>;
  commentsLoader: DataLoader<string, Comment[]>;
  userPostsLoader: DataLoader<string, Post[]>;
  postCommentsLoader: DataLoader<string, Comment[]>;
  followerCountLoader: DataLoader<string, number>;
  postCountLoader: DataLoader<string, number>;
}

function createLoaders(db: any): Loaders {
  return {
    // 简单批量加载器
    userLoader: new DataLoader(async (ids) => {
      const users = await db.user.findMany({
        where: { id: { in: ids as string[] } }
      });
      const userMap = new Map(users.map(u => [u.id, u]));
      return ids.map(id => userMap.get(id as string) || null);
    }),

    postLoader: new DataLoader(async (ids) => {
      const posts = await db.post.findMany({
        where: { id: { in: ids as string[] } }
      });
      const postMap = new Map(posts.map(p => [p.id, p]));
      return ids.map(id => postMap.get(id as string) || null);
    }),

    // 一对多批量加载器
    commentsLoader: new DataLoader(async (postIds) => {
      const comments = await db.comment.findMany({
        where: { postId: { in: postIds as string[] } },
        orderBy: { createdAt: 'asc' }
      });

      const commentsByPostId = new Map<string, Comment[]>();
      postIds.forEach(id => commentsByPostId.set(id as string, []));
      comments.forEach(c => {
        const list = commentsByPostId.get(c.postId);
        if (list) list.push(c);
      });

      return postIds.map(id => commentsByPostId.get(id as string) || []);
    }),

    userPostsLoader: new DataLoader(async (userIds) => {
      const posts = await db.post.findMany({
        where: { authorId: { in: userIds as string[] } },
        orderBy: { createdAt: 'desc' }
      });

      const postsByUserId = new Map<string, Post[]>();
      userIds.forEach(id => postsByUserId.set(id as string, []));
      posts.forEach(p => {
        const list = postsByUserId.get(p.authorId);
        if (list) list.push(p);
      });

      return userIds.map(id => postsByUserId.get(id as string) || []);
    }),

    // 带过滤的批量加载器
    postCommentsLoader: new DataLoader(async (requests: any[]) => {
      const postIds = requests.map(r => r.postId);
      const filters = requests.map(r => r.filter);

      const allComments = await db.comment.findMany({
        where: {
          postId: { in: postIds },
          ...buildFilter(filters[0])
        },
        orderBy: { createdAt: 'asc' }
      });

      const commentsByPostId = new Map<string, Comment[]>();
      postIds.forEach(id => commentsByPostId.set(id as string, []));
      allComments.forEach(c => {
        const list = commentsByPostId.get(c.postId);
        if (list) list.push(c);
      });

      return requests.map(r => commentsByPostId.get(r.postId) || []);
    }),

    // 计数批量加载器
    followerCountLoader: new DataLoader(async (userIds) => {
      const counts = await db.follow.groupBy({
        by: ['followingId'],
        _count: { followerId: true },
        where: { followingId: { in: userIds as string[] } }
      });

      const countMap = new Map(counts.map(c => [c.followingId, c._count.followerId]));
      return userIds.map(id => countMap.get(id as string) || 0);
    }),

    postCountLoader: new DataLoader(async (userIds) => {
      const counts = await db.post.groupBy({
        by: ['authorId'],
        _count: { id: true },
        where: { authorId: { in: userIds as string[] } }
      });

      const countMap = new Map(counts.map(c => [c.authorId, c._count.id]));
      return userIds.map(id => countMap.get(id as string) || 0);
    }),
  };
}

// 在Context中创建
const createContext = async ({ req }) => {
  return {
    db,
    loaders: createLoaders(db),
  };
};

// Resolver使用
const resolvers = {
  Query: {
    posts: async (parent, args, { db }) => {
      return db.post.findMany({
        where: { status: 'PUBLISHED' },
        take: args.limit || 10,
      });
    },
  },

  Post: {
    author: (post, args, { loaders }) => {
      return loaders.userLoader.load(post.authorId);
    },

    comments: (post, args, { loaders }) => {
      return loaders.commentsLoader.load(post.id);
    },

    commentCount: (post, args, { loaders }) => {
      return loaders.postCommentsLoader.load({ postId: post.id, filter: {} })
        .then(comments => comments.length);
    },

    authorFollowerCount: (post, args, { loaders }) => {
      return loaders.followerCountLoader.load(post.authorId);
    },
  },

  User: {
    posts: (user, args, { loaders }) => {
      return loaders.userPostsLoader.load(user.id);
    },

    followerCount: (user, args, { loaders }) => {
      return loaders.followerCountLoader.load(user.id);
    },

    postCount: (user, args, { loaders }) => {
      return loaders.postCountLoader.load(user.id);
    },

    // 嵌套关系也使用DataLoader
    posts: (user, args, { loaders }) => {
      return loaders.userPostsLoader.load(user.id);
    },
  },

  Comment: {
    author: (comment, args, { loaders }) => {
      return loaders.userLoader.load(comment.authorId);
    },

    post: (comment, args, { loaders }) => {
      return loaders.postLoader.load(comment.postId);
    },

    replies: (comment, args, { loaders }) => {
      return loaders.commentsLoader.load(comment.id);
    },
  },
};
```

---

## 六、实时订阅

### 6.1 Subscription实现

**基本Subscription设置**：

```typescript
import { PubSub } from 'graphql-subscriptions';

const pubsub = new PubSub();

// 定义Subscription类型
const typeDefs = `
  type Subscription {
    # 帖子相关订阅
    postCreated: Post!
    postUpdated(id: ID!): Post!
    postDeleted(id: ID!): Post!

    # 评论相关订阅
    commentAdded(postId: ID!): Comment!
    commentRemoved(postId: ID!): ID!

    # 消息相关订阅
    messageReceived(conversationId: ID!): Message!
    messageRead(conversationId: ID!): Message!

    # 用户状态订阅
    userOnline(userId: ID!): UserStatus!
    userTyping(conversationId: ID!): TypingStatus!
  }

  type Post {
    id: ID!
    title: String!
    content: String!
    author: User!
    createdAt: DateTime!
  }

  type Comment {
    id: ID!
    content: String!
    author: User!
    post: Post!
    createdAt: DateTime!
  }

  type Message {
    id: ID!
    content: String!
    sender: User!
    conversationId: ID!
    createdAt: DateTime!
    readAt: DateTime
  }

  type UserStatus {
    userId: ID!
    isOnline: Boolean!
    lastSeenAt: DateTime!
  }

  type TypingStatus {
    userId: ID!
    conversationId: ID!
    isTyping: Boolean!
  }
`;

// Subscription Resolvers
const resolvers = {
  Subscription: {
    postCreated: {
      subscribe: () => pubsub.asyncIterator(['POST_CREATED']),
    },

    postUpdated: {
      subscribe: (parent, { id }) => {
        return pubsub.asyncIterator(`POST_UPDATED:${id}`);
      },
    },

    commentAdded: {
      subscribe: (parent, { postId }) => {
        return pubsub.asyncIterator(`COMMENT_ADDED:${postId}`);
      },
    },

    messageReceived: {
      subscribe: (parent, { conversationId }) => {
        return pubsub.asyncIterator(`MESSAGE:${conversationId}`);
      },
    },

    userOnline: {
      subscribe: (parent, { userId }) => {
        return pubsub.asyncIterator(`USER_ONLINE:${userId}`);
      },
    },
  },

  Mutation: {
    createPost: async (parent, { input }, { db, currentUser }) => {
      if (!currentUser) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const post = await db.post.create({
        data: {
          ...input,
          authorId: currentUser.id,
        },
        include: { author: true },
      });

      // 发布事件
      pubsub.publish('POST_CREATED', { postCreated: post });

      return post;
    },

    addComment: async (parent, { postId, content }, { db, currentUser }) => {
      if (!currentUser) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const comment = await db.comment.create({
        data: {
          content,
          postId,
          authorId: currentUser.id,
        },
        include: { author: true, post: true },
      });

      // 发布事件到特定帖子的频道
      pubsub.publish(`COMMENT_ADDED:${postId}`, { commentAdded: comment });

      return comment;
    },

    sendMessage: async (parent, { conversationId, content }, { db, currentUser }) => {
      if (!currentUser) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const message = await db.message.create({
        data: {
          content,
          conversationId,
          senderId: currentUser.id,
        },
        include: { sender: true },
      });

      pubsub.publish(`MESSAGE:${conversationId}`, { messageReceived: message });

      return message;
    },

    setUserOnline: async (parent, args, { db, currentUser }) => {
      if (!currentUser) return { userId: null, isOnline: false };

      await db.user.update({
        where: { id: currentUser.id },
        data: { lastSeenAt: new Date() }
      });

      const status = {
        userId: currentUser.id,
        isOnline: true,
        lastSeenAt: new Date()
      };

      pubsub.publish(`USER_ONLINE:${currentUser.id}`, { userOnline: status });

      return status;
    },
  },
};
```

### 6.2 PubSub高级用法

**高级PubSub模式**：

```typescript
import { PubSub, withFilter } from 'graphql-subscriptions';

// 带过滤的订阅
const resolvers = {
  Subscription: {
    // 只推送作者订阅自己帖子的更新
    postUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(['POST_UPDATED']),
        (payload, variables, context) => {
          // 只推送作者本人的更新
          return payload.postUpdated.authorId === context.currentUser?.id;
        }
      ),
    },

    // 根据角色过滤
    systemNotification: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(['SYSTEM_NOTIFICATION']),
        (payload, variables, context) => {
          // 推送给所有用户，但每个用户只看到自己角色的通知
          return payload.systemNotification.targetRoles.includes(context.currentUser?.role);
        }
      ),
    },

    // 多人聊天室的实时消息
    chatMessage: {
      subscribe: withFilter(
        (parent, { roomId }) => pubsub.asyncIterator(`CHAT:${roomId}`),
        (payload, variables, context) => {
          // 不推送消息发送者自己
          return payload.chatMessage.senderId !== context.currentUser?.id;
        }
      ),
    },
  },
};

// 触发过滤后的订阅
const resolvers = {
  Mutation: {
    sendChatMessage: async (parent, { roomId, content }, { db, currentUser }) => {
      const message = await db.message.create({
        data: { content, roomId, senderId: currentUser.id }
      });

      // 广播到聊天室（所有订阅者都会收到，withFilter会处理过滤）
      pubsub.publish(`CHAT:${roomId}`, { chatMessage: message });

      return message;
    },
  },
};

// Redis PubSub（生产环境推荐）
import { RedisPubSub } from 'graphql-redis-subscriptions';

const pubsub = new RedisPubSub({
  connection: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  },
});

// 使用Redis PubSub进行跨实例通信
// 当部署多个GraphQL服务器实例时，Redis PubSub可以确保所有实例都收到事件
```

### 6.3 实时聊天实战

**完整聊天系统实现**：

```typescript
// 类型定义
const typeDefs = `
  type Conversation {
    id: ID!
    participants: [User!]!
    messages(limit: Int = 50): [Message!]!
    lastMessage: Message
    unreadCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Message {
    id: ID!
    content: String!
    sender: User!
    conversation: Conversation!
    readBy: [User!]!
    createdAt: DateTime!
    isRead: Boolean!
  }

  type TypingIndicator {
    conversationId: ID!
    user: User!
    isTyping: Boolean!
  }

  type Subscription {
    messageReceived(conversationId: ID!): Message!
    messageRead(conversationId: ID!): ReadReceipt!
    userTyping(conversationId: ID!): TypingIndicator!
    conversationUpdated(userId: ID!): Conversation!
  }

  type ReadReceipt {
    messageId: ID!
    user: User!
    readAt: DateTime!
  }

  input SendMessageInput {
    conversationId: ID!
    content: String!
    tempId: String  # 客户端生成的临时ID，用于乐观更新
  }
`;

// Resolver实现
const TYPING_TIMEOUT = 3000; // 3秒后自动停止打字指示

const resolvers = {
  Subscription: {
    messageReceived: {
      subscribe: withFilter(
        (parent, { conversationId }, context) => {
          return pubsub.asyncIterator(`MESSAGE:${conversationId}`);
        },
        (payload, variables, context) => {
          // 不推送消息发送者
          return payload.messageReceived.senderId !== context.currentUser?.id;
        }
      ),
    },

    messageRead: {
      subscribe: withFilter(
        (parent, { conversationId }, context) => {
          return pubsub.asyncIterator(`MESSAGE_READ:${conversationId}`);
        },
        (payload, variables, context) => {
          // 不推送自己的已读回执
          return payload.messageRead.userId !== context.currentUser?.id;
        }
      ),
    },

    userTyping: {
      subscribe: withFilter(
        (parent, { conversationId }, context) => {
          return pubsub.asyncIterator(`TYPING:${conversationId}`);
        },
        (payload, variables, context) => {
          // 不推送自己
          return payload.userTyping.userId !== context.currentUser?.id;
        }
      ),
    },

    conversationUpdated: {
      subscribe: withFilter(
        (parent, args, context) => {
          return pubsub.asyncIterator(`CONVERSATION:${context.currentUser?.id}`);
        },
        (payload, variables, context) => {
          return true;
        }
      ),
    },
  },

  Mutation: {
    sendMessage: async (parent, { input }, { db, currentUser, pubsub }) => {
      if (!currentUser) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      // 验证用户是否参与该对话
      const conversation = await db.conversation.findUnique({
        where: { id: input.conversationId },
        include: { participants: true }
      });

      if (!conversation) {
        throw new GraphQLError('Conversation not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      const isParticipant = conversation.participants.some(
        p => p.id === currentUser.id
      );

      if (!isParticipant) {
        throw new GraphQLError('Not a participant of this conversation', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      const message = await db.message.create({
        data: {
          content: input.content,
          conversationId: input.conversationId,
          senderId: currentUser.id,
          tempId: input.tempId,
        },
        include: { sender: true },
      });

      // 更新对话更新时间
      await db.conversation.update({
        where: { id: input.conversationId },
        data: { updatedAt: new Date() }
      });

      // 广播消息
      pubsub.publish(`MESSAGE:${input.conversationId}`, {
        messageReceived: message,
      });

      // 更新所有参与者的对话列表
      for (const participant of conversation.participants) {
        pubsub.publish(`CONVERSATION:${participant.id}`, {
          conversationUpdated: conversation,
        });
      }

      return message;
    },

    markAsRead: async (parent, { conversationId, messageId }, { db, currentUser, pubsub }) => {
      if (!currentUser) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      // 标记消息为已读
      await db.message.update({
        where: { id: messageId },
        data: {
          readBy: { connect: { id: currentUser.id } } }
      });

      const readReceipt = {
        messageId,
        userId: currentUser.id,
        readAt: new Date(),
      };

      // 广播已读回执
      pubsub.publish(`MESSAGE_READ:${conversationId}`, {
        messageRead: readReceipt,
      });

      return readReceipt;
    },

    setTyping: async (parent, { conversationId, isTyping }, { db, currentUser, pubsub }) => {
      if (!currentUser) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const typingIndicator = {
        conversationId,
        userId: currentUser.id,
        user: currentUser,
        isTyping,
      };

      pubsub.publish(`TYPING:${conversationId}`, {
        userTyping: typingIndicator,
      });

      // 如果是开始打字，设置定时器自动停止
      if (isTyping) {
        setTimeout(() => {
          pubsub.publish(`TYPING:${conversationId}`, {
            userTyping: { ...typingIndicator, isTyping: false },
          });
        }, TYPING_TIMEOUT);
      }

      return typingIndicator;
    },
  },
};
```

---

## 七、文件上传

### 7.1 Base64方案

**Base64上传实现**：

```typescript
const typeDefs = `
  type File {
    id: ID!
    filename: String!
    mimetype: String!
    encoding: String!
    url: String!
    size: Int!
    createdAt: DateTime!
  }

  type Query {
    files: [File!]!
    file(id: ID!): File
  }

  type Mutation {
    # Base64上传
    uploadFileBase64(filename: String!, mimetype: String!, base64Data: String!): File!

    # 批量Base64上传
    uploadFilesBase64(files: [FileInput!]!): [File!]!
  }

  input FileInput {
    filename: String!
    mimetype: String!
    base64Data: String!
  }
`;

// Resolver实现
const resolvers = {
  Mutation: {
    uploadFileBase64: async (parent, { filename, mimetype, base64Data }, { db, currentUser }) => {
      if (!currentUser) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      // 验证文件大小（Base64会增大33%）
      const buffer = Buffer.from(base64Data, 'base64');
      const sizeKB = buffer.length / 1024;

      if (sizeKB > 10 * 1024) { // 限制10MB
        throw new GraphQLError('File size exceeds 10MB limit', {
          extensions: { code: 'BAD_USER_INPUT', field: 'base64Data' }
        });
      }

      // 验证文件类型
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(mimetype)) {
        throw new GraphQLError('File type not allowed', {
          extensions: { code: 'BAD_USER_INPUT', field: 'mimetype' }
        });
      }

      // 生成唯一文件名
      const ext = path.extname(filename);
      const id = nanoid();
      const storedFilename = `${id}${ext}`;

      // 上传到存储服务（以S3为例）
      const key = `uploads/${currentUser.id}/${storedFilename}`;
      await s3.upload({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
      }).promise();

      // 保存文件记录
      const file = await db.file.create({
        data: {
          filename,
          mimetype,
          encoding: '7bit',
          url: `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`,
          size: buffer.length,
          userId: currentUser.id,
        }
      });

      return file;
    },

    uploadFilesBase64: async (parent, { files }, { db, currentUser }) => {
      if (!currentUser) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      // 限制批量上传数量
      if (files.length > 10) {
        throw new GraphQLError('Maximum 10 files per batch upload', {
          extensions: { code: 'BAD_USER_INPUT', field: 'files' }
        });
      }

      // 并行处理上传
      const uploadPromises = files.map(file =>
        resolvers.Mutation.uploadFileBase64(null, file, { db, currentUser })
      );

      return Promise.all(uploadPromises);
    },
  },
};
```

### 7.2 Multipart方案

**GraphQL Multipart上传规范**：

```typescript
// Apollo Server 4 multipart upload
import { graphqlUploadExpress, GraphQLUpload } from 'graphql-upload';
import { FileUpload } from 'graphql-upload/minimal';

// 类型定义
const typeDefs = `
  # 标量类型用于文件上传
  scalar Upload

  type File {
    id: ID!
    filename: String!
    mimetype: String!
    encoding: String!
    url: String!
    size: Int!
    createdAt: DateTime!
  }

  type Mutation {
    # 单文件上传
    uploadFile(file: Upload!): File!

    # 多文件上传
    uploadFiles(files: [Upload!]!): [File!]!

    # 带额外元数据的上传
    uploadFileWithMetadata(file: Upload!, metadata: FileMetadataInput!): File!
  }

  input FileMetadataInput {
    category: String!
    tags: [String!]
    description: String
  }
`;

// 处理上传的Resolver
const processUpload = async (
  upload: Promise<FileUpload>,
  userId: string,
  metadata?: { category: string; tags?: string[]; description?: string }
) => {
  const { createReadStream, filename, mimetype, encoding } = await upload;

  // 验证文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  if (!allowedTypes.includes(mimetype)) {
    throw new GraphQLError(`File type ${mimetype} not allowed`, {
      extensions: { code: 'BAD_USER_INPUT' }
    });
  }

  // 创建上传流
  const stream = createReadStream();

  // 生成唯一文件名
  const id = nanoid();
  const ext = path.extname(filename);
  const key = `uploads/${userId}/${id}${ext}`;

  // 上传到S3
  const result = await s3.upload({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
    Body: stream,
    ContentType: mimetype,
  }).promise();

  // 获取文件大小
  const size = await getStreamSize(stream);

  // 保存数据库记录
  return await db.file.create({
    data: {
      filename,
      mimetype,
      encoding,
      url: result.Location,
      size,
      userId,
      category: metadata?.category,
      tags: metadata?.tags,
      description: metadata?.description,
    }
  });
};

const resolvers = {
  Upload: GraphQLUpload,

  Mutation: {
    uploadFile: async (parent, { file }, { db, currentUser }) => {
      if (!currentUser) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      return processUpload(file, currentUser.id);
    },

    uploadFiles: async (parent, { files }, { db, currentUser }) => {
      if (!currentUser) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      if (files.length > 20) {
        throw new GraphQLError('Maximum 20 files per batch upload', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      // 并行处理上传
      return Promise.all(
        files.map(file => processUpload(file, currentUser.id))
      );
    },

    uploadFileWithMetadata: async (parent, { file, metadata }, { db, currentUser }) => {
      if (!currentUser) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      return processUpload(file, currentUser.id, metadata);
    },
  },
};

// Express中间件配置
import express from 'express';
const app = express();

app.use(graphqlUploadExpress({
  maxFileSize: 10 * 1024 * 1024,     // 10MB
  maxFiles: 20,
}));
```

### 7.3 S3完整集成

**完整的S3上传服务**：

```typescript
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// 签名URL生成（用于直接客户端上传）
const resolvers = {
  Mutation: {
    // 获取预签名上传URL
    getPresignedUploadUrl: async (
      parent,
      { filename, mimetype, folder },
      { currentUser }
    ) => {
      if (!currentUser) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      // 生成唯一key
      const id = nanoid();
      const ext = path.extname(filename);
      const key = `${folder || 'uploads'}/${currentUser.id}/${id}${ext}`;

      // 生成预签名URL（15分钟有效期）
      const signedUrl = s3.getSignedUrl('putObject', {
        Bucket: process.env.S3_BUCKET,
        Key: key,
        ContentType: mimetype,
        Expires: 900, // 15分钟
      });

      // 返回供客户端直接上传的URL和key
      return {
        uploadUrl: signedUrl,
        key,
        publicUrl: `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
      };
    },

    // 确认上传完成
    confirmUpload: async (parent, { key, metadata }, { db, currentUser }) => {
      if (!currentUser) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      // 验证文件存在
      try {
        const headData = await s3.headObject({
          Bucket: process.env.S3_BUCKET,
          Key: key,
        }).promise();

        // 提取文件名
        const filename = key.split('/').pop() || 'unknown';

        // 创建数据库记录
        const file = await db.file.create({
          data: {
            filename,
            mimetype: headData.ContentType,
            encoding: '7bit',
            url: `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
            size: headData.ContentLength,
            userId: currentUser.id,
            s3Key: key,
            category: metadata?.category,
            tags: metadata?.tags,
          }
        });

        return file;
      } catch (error) {
        throw new GraphQLError('File not found in S3', {
          extensions: { code: 'NOT_FOUND' }
        });
      }
    },

    // 删除文件
    deleteFile: async (parent, { id }, { db, currentUser }) => {
      if (!currentUser) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const file = await db.file.findUnique({ where: { id } });

      if (!file) {
        throw new GraphQLError('File not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      // 验证所有权
      if (file.userId !== currentUser.id && currentUser.role !== 'ADMIN') {
        throw new GraphQLError('Not authorized to delete this file', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      // 从S3删除
      await s3.deleteObject({
        Bucket: process.env.S3_BUCKET,
        Key: file.s3Key,
      }).promise();

      // 从数据库删除
      await db.file.delete({ where: { id } });

      return true;
    },
  },
};
```

---

## 八、联邦架构

### 8.1 Apollo Federation概述

**Federation架构图**：

```
                    ┌─────────────────┐
                    │   Apollo Router  │
                    │   (Gateway)       │
                    └────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  Users  Svc   │  │  Products Svc │  │  Orders Svc   │
│  (Accounts)    │  │  (Catalog)     │  │  (Commerce)   │
└───────────────┘  └───────────────┘  └───────────────┘
        │                    │                    │
        └────────────────────┴────────────────────┘
                    Subgraphs (各自独立的Schema)
```

### 8.2 Federation实现

**各服务的Subgraph定义**：

```typescript
// accounts-service/src/schema.ts
// 用户账号服务

const typeDefs = `
  extend type Query {
    me: User
    user(id: ID!): User
    users(filter: UserFilterInput): [User!]!
  }

  extend type Mutation {
    updateProfile(input: UpdateProfileInput!): User!
    changePassword(oldPassword: String!, newPassword: String!): Boolean!
  }

  type User @key(fields: "id") {
    id: ID!
    email: String!
    name: String!
    avatar: String
    role: UserRole!
    createdAt: DateTime!
    updatedAt: DateTime!

    # 本服务特有的查询
    permissions: [Permission!]!
    lastLoginAt: DateTime
  }

  enum UserRole {
    ADMIN
    EDITOR
    AUTHOR
    READER
  }

  enum Permission {
    READ
    WRITE
    DELETE
    ADMIN
  }

  input UserFilterInput {
    role: UserRole
    searchQuery: String
  }

  input UpdateProfileInput {
    name: String
    avatar: String
    bio: String
  }
`;

const resolvers = {
  // 引用其他服务的字段
  User: {
    __resolveReference(reference, { usersService }) {
      return usersService.findById(reference.id);
    },
  },
};

// accounts-service/src/index.ts
import { buildSubgraphSchema } from '@apollo/federation';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

const server = new ApolloServer({
  schema: buildSubgraphSchema({ typeDefs, resolvers }),
});

const { url } = await startStandaloneServer(server, {
  context: async ({ req }) => createContext(req),
  listen: { port: 4001 },
});

console.log(`Accounts service ready at ${url}`);
```

```typescript
// products-service/src/schema.ts
// 产品目录服务

const typeDefs = `
  extend type Query {
    products(filter: ProductFilterInput, limit: Int, offset: Int): ProductConnection!
    product(id: ID!): Product
    categories: [Category!]!
  }

  extend type Mutation {
    createProduct(input: CreateProductInput!): Product!
    updateProduct(id: ID!, input: UpdateProductInput!): Product
    deleteProduct(id: ID!): Boolean!
  }

  type Product @key(fields: "id") {
    id: ID!
    name: String!
    slug: String!
    description: String
    price: Price!
    category: Category!
    tags: [String!]!
    inventory: Int!
    status: ProductStatus!

    # 引用用户服务的用户（卖家）
    seller: User!

    # 本服务的关联
    reviews: [Review!]!
    averageRating: Float
  }

  type Category @key(fields: "id") {
    id: ID!
    name: String!
    slug: String!
    parent: Category
    children: [Category!]!
    productCount: Int!
  }

  type Price {
    amount: Float!
    currency: String!
  }

  type ProductConnection {
    edges: [ProductEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type ProductEdge {
    node: Product!
    cursor: String!
  }

  enum ProductStatus {
    DRAFT
    ACTIVE
    DISCONTINUED
  }

  input ProductFilterInput {
    categoryId: ID
    minPrice: Float
    maxPrice: Float
    status: ProductStatus
    searchQuery: String
  }

  input CreateProductInput {
    name: String!
    description: String
    price: PriceInput!
    categoryId: ID!
    tags: [String!]
    inventory: Int!
  }

  input UpdateProductInput {
    name: String
    description: String
    price: PriceInput
    categoryId: ID
    tags: [String!]
    inventory: Int
    status: ProductStatus
  }

  input PriceInput {
    amount: Float!
    currency: String = "USD"
  }
`;

const resolvers = {
  Product: {
    // Federation需要的引用解析
    __resolveReference(reference, { productsService }) {
      return productsService.findById(reference.id);
    },

    // 关联的用户（来自accounts服务）
    seller: (product) => {
      return { __typename: 'User', id: product.sellerId };
    },

    reviews: (product, args, { reviewsService }) => {
      return reviewsService.findByProductId(product.id);
    },

    averageRating: async (product, args, { reviewsService }) => {
      const reviews = await reviewsService.findByProductId(product.id);
      if (reviews.length === 0) return null;
      return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    },
  },

  Category: {
    __resolveReference(reference, { categoriesService }) {
      return categoriesService.findById(reference.id);
    },

    parent: (category, args, { categoriesService }) => {
      if (!category.parentId) return null;
      return { __typename: 'Category', id: category.parentId };
    },

    children: (category, args, { categoriesService }) => {
      return categoriesService.findChildren(category.id);
    },

    productCount: (category, args, { productsService }) => {
      return productsService.countByCategory(category.id);
    },
  },
};
```

### 8.3 Gateway配置

**Apollo Router配置**：

```yaml
# router.yaml
supergraph:
  listen: 0.0.0.0:4000

# 启用追踪
telemetry:
  tracing:
    enabled: true
    exporter: jaeger
    jaeger:
      agent:
        host: localhost
        port: 6831

# 限流配置
rate_limit:
  enabled: true
  global:
    max: 1000
    window: 1m

# 缓存配置
cache:
  inMemory: true
  ttl: 300
```

**Node.js Gateway**：

```typescript
// gateway/src/index.ts
import { ApolloGateway } from '@apollo/gateway';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

const gateway = new ApolloGateway({
  serviceList: [
    { name: 'accounts', url: 'http://localhost:4001/graphql' },
    { name: 'products', url: 'http://localhost:4002/graphql' },
    { name: 'reviews', url: 'http://localhost:4003/graphql' },
    { name: 'inventory', url: 'http://localhost:4004/graphql' },
  ],

  // Introspection轮询
  introspectionCache: new Map(),
  pollIntervalInMs: 10000,
});

const server = new ApolloServer({
  gateway,

  // 插件
  plugins: [
    // 追踪插件
    {
      async requestDidStart({ request, logger }) {
        logger.info('GraphQL request started');
        return {
          async didResolveOperation({ operation }) {
            logger.info(`Operation: ${operation.operation}`);
          },
          async queryDidEnd({ query, duration }) {
            logger.info(`Query completed in ${duration}ms`);
          },
        };
      },
    },
  ],
});

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`Gateway ready at ${url}`);
```

---

## 九、客户端应用

### 9.1 Apollo Client配置

**Apollo Client 3.x 设置**：

```typescript
// client/src/apollo.ts
import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { setContext } from '@apollo/client/link/context';

// HTTP连接
const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql',
  credentials: 'include',
});

// WebSocket连接（Subscriptions）
const wsLink = new GraphQLWsLink(
  createClient({
    url: 'ws://localhost:4000/graphql',
    connectionParams: async () => {
      // 从localStorage获取token
      const token = localStorage.getItem('token');
      return {
        authorization: token ? `Bearer ${token}` : '',
      };
    },
    retryAttempts: 5,
    shouldRetry: () => true,
    on: {
      connected: () => console.log('WebSocket connected'),
      error: (error) => console.error('WebSocket error:', error),
    },
  })
);

// 根据操作类型分割链接
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

// Auth链接：添加Authorization头
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// 创建Apollo Client
export const apolloClient = new ApolloClient({
  link: authLink.concat(splitLink),
  cache: new InMemoryCache({
    typePolicies: {
      // 分页字段策略
      Query: {
        fields: {
          posts: {
            // 合并分页结果
            keyArgs: ['filter'],
            merge(existing = { edges: [] }, incoming, { args }) {
              if (!args?.cursor) {
                // 首次加载或替换
                return incoming;
              }
              // 游标分页：追加
              return {
                ...incoming,
                edges: [...existing.edges, ...incoming.edges],
              };
            },
          },
        },
      },
      // 引用类型解析
      User: {
        keyFields: ['id'],
      },
      Post: {
        keyFields: ['id'],
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});
```

### 9.2 缓存策略

**高级缓存配置**：

```typescript
// 缓存配置
const cache = new InMemoryCache({
  typePolicies: {
    // User类型策略
    User: {
      keyFields: ['id'],

      fields: {
        // posts字段合并策略
        posts: {
          keyArgs: ['filter', 'sort'],
          merge(existing = [], incoming, { args }) {
            // 如果是分页：追加
            if (args?.cursor) {
              return [...existing, ...incoming];
            }
            // 如果是全部替换
            return incoming;
          },
        },

        // computed field缓存
        fullName: {
          read(fullName, { variables }) {
            // 基于读取时的变量缓存
            return fullName;
          },
        },
      },
    },

    // Post类型策略
    Post: {
      keyFields: ['id'],

      fields: {
        comments: {
          keyArgs: ['sort', 'filter'],
          merge(existing = [], incoming) {
            return [...existing, ...incoming];
          },
        },

        likeCount: {
          // 不缓存，直接读取
          read: undefined,
        },
      },
    },

    // 连接类型
    PostConnection: {
      keyFields: ['cursor'],

      fields: {
        edges: {
          merge: false, // 不合并，保留原样
        },
      },
    },
  },
});

// 手动缓存操作
import { gql } from '@apollo/client';

// 读取缓存
const cachedUser = apolloClient.readFragment({
  id: 'User:123',
  fragment: gql`
    fragment UserFields on User {
      id
      name
      email
    }
  `,
});

// 写入缓存
apolloClient.writeFragment({
  id: 'User:123',
  fragment: gql`
    fragment UpdatedUser on User {
      id
      name
      email
    }
  `,
  data: {
    id: '123',
    name: 'New Name',
    email: 'new@example.com',
  },
});

// 修改缓存
apolloClient.modify({
  id: 'User:123',
  fields: {
    name: () => 'Modified Name',
  },
});

// 清除缓存
apolloClient.evict({ id: 'User:123' });
apolloClient.gc(); // 垃圾回收
```

### 9.3 乐观更新

**乐观更新实现**：

```typescript
import { gql } from '@apollo/client';

// 定义Mutation
const LIKE_POST = gql`
  mutation LikePost($postId: ID!) {
    likePost(postId: $postId) {
      id
      likeCount
      isLiked
    }
  }
`;

const UNLIKE_POST = gql`
  mutation UnlikePost($postId: ID!) {
    unlikePost(postId: $postId) {
      id
      likeCount
      isLiked
    }
  }
`;

// React组件中使用乐观更新
function LikeButton({ post }) {
  const [likePost] = useMutation(LIKE_POST, {
    // 乐观更新配置
    optimisticResponse: {
      likePost: {
        __typename: 'Post',
        id: post.id,
        likeCount: post.likeCount + 1,
        isLiked: true,
      },
    },

    // 更新缓存
    update(cache, { data: { likePost } }) {
      // 直接修改缓存中的数据
      cache.modify({
        id: cache.identify({ __typename: 'Post', id: post.id }),
        fields: {
          likeCount: (count) => count + 1,
          isLiked: () => true,
        },
      });
    },

    // 错误处理：回滚乐观更新
    onError: (error) => {
      console.error('Like failed:', error);
      // Apollo会自动回滚optimisticResponse
    },
  });

  const handleLike = async () => {
    try {
      await likePost({
        variables: { postId: post.id },
      });
    } catch (error) {
      // 错误已在onError中处理
    }
  };

  return (
    <button onClick={handleLike}>
      {post.isLiked ? '❤️' : '🤍'} {post.likeCount}
    </button>
  );
}

// 更复杂的乐观更新：评论
const ADD_COMMENT = gql`
  mutation AddComment($postId: ID!, $content: String!) {
    addComment(postId: $postId, content: $content) {
      id
      content
      createdAt
      author {
        id
        name
        avatar
      }
    }
  }
`;

function CommentForm({ postId, onCommentAdded }) {
  const [content, setContent] = useState('');
  const [addComment, { loading }] = useMutation(ADD_COMMENT, {
    optimisticResponse: {
      addComment: {
        __typename: 'Comment',
        id: `temp-${Date.now()}`, // 临时ID
        content: content,
        createdAt: new Date().toISOString(),
        author: {
          __typename: 'User',
          id: 'current-user-id', // 从context获取
          name: 'Current User',
          avatar: null,
        },
      },
    },

    update(cache, { data: { addComment } }) {
      // 读取现有评论
      const cacheKey = cache.identify({ __typename: 'Post', id: postId });
      const existing = cache.readQuery({
        query: GET_POST_COMMENTS,
        variables: { postId },
      });

      // 写入更新后的评论列表
      cache.writeQuery({
        query: GET_POST_COMMENTS,
        variables: { postId },
        data: {
          post: {
            ...existing.post,
            comments: [addComment, ...existing.post.comments],
          },
        },
      });
    },

    // 成功后处理
    onCompleted: (data) => {
      setContent('');
      onCommentAdded?.(data.addComment);
    },
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      if (!content.trim()) return;
      addComment({ variables: { postId, content } });
    }}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment..."
      />
      <button type="submit" disabled={loading || !content.trim()}>
        {loading ? 'Posting...' : 'Post'}
      </button>
    </form>
  );
}
```

---

## 十、NestJS + GraphQL

### 10.1 Code First方式

**NestJS GraphQL Code First示例**：

```typescript
// posts/posts.module.ts
import { Module } from '@nestjs/common';
import { TypeGraphQLModule } from '@nestjs/graphql';
import { PrismaModule } from '../prisma/prisma.module';
import { PostsResolver } from './posts.resolver';
import { PostsService } from './posts.service';
import { AuthorizerGuard } from '../auth/authorizer.guard';

@Module({
  imports: [
    PrismaModule,
    TypeGraphQLModule.forRoot({
      autoSchemaFile: path.join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      context: ({ req }) => ({ req }),
    }),
  ],
  providers: [PostsResolver, PostsService],
  exports: [PostsService],
})
export class PostsModule {}
```

```typescript
// posts/entities/post.entity.ts
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { Author } from './author.entity';
import { Comment } from './comment.entity';
import { prop, mongooseDocument } from '@typegoose/typegoose';

@ObjectType({ description: 'Blog post' })
export class Post {
  @Field(() => ID)
  id: string;

  @Field()
  @prop({ required: true })
  title: string;

  @Field({ nullable: true })
  @prop()
  content?: string;

  @Field(() => Int)
  @prop({ default: 0 })
  viewCount: number;

  @Field()
  @prop({ default: false })
  published: boolean;

  @Field(() => Author)
  @prop({ type: () => Author, ref: () => Author })
  author: Author;

  @Field(() => [Comment], { nullable: true })
  @prop({ type: () => [Comment], ref: () => Comment })
  comments?: Comment[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
```

```typescript
// posts/dto/create-post.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MinLength, IsOptional, IsBoolean, IsArray } from 'class-validator';

@InputType()
export class CreatePostInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  title: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  content?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @Field({ defaultValue: false })
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
```

```typescript
// posts/posts.resolver.ts
import { Resolver, Query, Mutation, Args, Int, ResolveField, Parent, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { Post } from './entities/post.entity';
import { CreatePostInput } from './dto/create-post.input';
import { UpdatePostInput } from './dto/update-post.input';
import { PostConnection } from './dto/post-connection';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Resolver(() => Post)
export class PostsResolver {
  constructor(private readonly postsService: PostsService) {}

  @Query(() => PostConnection)
  async posts(
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
    @Args('cursor', { nullable: true }) cursor?: string,
  ): Promise<PostConnection> {
    return this.postsService.findAll({ limit, cursor });
  }

  @Query(() => Post, { nullable: true })
  async post(@Args('id', { type: () => ID }) id: string): Promise<Post> {
    return this.postsService.findOne(id);
  }

  @Mutation(() => Post)
  @UseGuards(GqlAuthGuard)
  async createPost(
    @Args('input') input: CreatePostInput,
    @CurrentUser() user: User,
  ): Promise<Post> {
    return this.postsService.create(input, user.id);
  }

  @Mutation(() => Post)
  @UseGuards(GqlAuthGuard)
  async updatePost(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdatePostInput,
    @CurrentUser() user: User,
  ): Promise<Post> {
    return this.postsService.update(id, input, user);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async deletePost(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    return this.postsService.delete(id, user);
  }

  @ResolveField()
  async comments(@Parent() post: Post) {
    return this.postsService.getComments(post.id);
  }
}
```

### 10.2 Schema First方式

**NestJS GraphQL Schema First示例**：

```graphql
# schema.graphql
type Query {
  posts(limit: Int = 10, cursor: String): PostConnection!
  post(id: ID!): Post
  me: User
}

type Mutation {
  createPost(input: CreatePostInput!): Post!
  updatePost(id: ID!, input: UpdatePostInput!): Post
  deletePost(id: ID!): Boolean!
}

type Post {
  id: ID!
  title: String!
  content: String
  viewCount: Int!
  published: Boolean!
  author: User!
  comments: [Comment!]!
  createdAt: DateTime!
  updatedAt: DateTime!
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
  endCursor: String
}

input CreatePostInput {
  title: String!
  content: String
  tags: [String!]
  published: Boolean
}

input UpdatePostInput {
  title: String
  content: String
  tags: [String!]
  published: Boolean
}

scalar DateTime
```

```typescript
// posts/posts.resolver.ts (Schema First)
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { Post } from './post.model';
import { CreatePostInput } from './dto/create-post.input';
import { UpdatePostInput } from './dto/update-post.input';
import { PostConnection } from './dto/post-connection';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.model';

@Resolver(() => Post)
export class PostsResolver {
  constructor(private readonly postsService: PostsService) {}

  @Query(() => PostConnection)
  async posts(
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
    @Args('cursor', { nullable: true }) cursor?: string,
  ): Promise<PostConnection> {
    return this.postsService.findAll({ limit, cursor });
  }

  @Query(() => Post, { nullable: true })
  async post(@Args('id') id: string): Promise<Post> {
    return this.postsService.findOne(id);
  }

  @Mutation(() => Post)
  @UseGuards(GqlAuthGuard)
  async createPost(
    @Args('input') input: CreatePostInput,
    @CurrentUser() user: User,
  ): Promise<Post> {
    return this.postsService.create(input, user.id);
  }

  @Mutation(() => Post, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async updatePost(
    @Args('id') id: string,
    @Args('input') input: UpdatePostInput,
    @CurrentUser() user: User,
  ): Promise<Post> {
    return this.postsService.update(id, input, user);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async deletePost(
    @Args('id') id: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    return this.postsService.delete(id, user);
  }
}
```

### 10.3 完整NestJS GraphQL项目

**综合示例**：

```typescript
// posts/posts.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Post, PostConnection } from './post.model';
import { CreatePostInput } from './dto/create-post.input';
import { UpdatePostInput } from './dto/update-post.input';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll({ limit, cursor }: { limit: number; cursor?: string }) {
    const queryOptions = {
      take: limit + 1, // 多取一个判断hasNextPage
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' as const },
    };

    const posts = await this.prisma.post.findMany({
      ...queryOptions,
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        _count: { select: { comments: true } },
      },
    });

    const hasNextPage = posts.length > limit;
    const edges = posts.slice(0, limit).map((post) => ({
      node: post,
      cursor: post.id,
    }));

    return {
      edges,
      pageInfo: {
        hasNextPage,
        endCursor: hasNextPage ? edges[edges.length - 1].cursor : null,
      },
      totalCount: await this.prisma.post.count(),
    };
  }

  async findOne(id: string): Promise<Post> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: true,
        comments: {
          include: { author: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return post;
  }

  async create(input: CreatePostInput, authorId: string): Promise<Post> {
    return this.prisma.post.create({
      data: {
        title: input.title,
        content: input.content,
        tags: input.tags,
        published: input.published ?? false,
        authorId,
      },
      include: { author: true },
    });
  }

  async update(
    id: string,
    input: UpdatePostInput,
    user: { id: string; role: string },
  ): Promise<Post> {
    const post = await this.prisma.post.findUnique({ where: { id } });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    // 检查权限：只有作者或管理员可以更新
    if (post.authorId !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException('You can only update your own posts');
    }

    return this.prisma.post.update({
      where: { id },
      data: {
        ...(input.title && { title: input.title }),
        ...(input.content !== undefined && { content: input.content }),
        ...(input.tags && { tags: input.tags }),
        ...(input.published !== undefined && { published: input.published }),
      },
      include: { author: true },
    });
  }

  async delete(id: string, user: { id: string; role: string }): Promise<boolean> {
    const post = await this.prisma.post.findUnique({ where: { id } });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    if (post.authorId !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.prisma.post.delete({ where: { id } });
    return true;
  }

  async getComments(postId: string) {
    return this.prisma.comment.findMany({
      where: { postId },
      include: { author: true },
      orderBy: { createdAt: 'asc' },
    });
  }
}
```

---

## 十一、对比REST

### 11.1 选型建议

**GraphQL适用场景**：

| 场景 | 推荐理由 | 示例 |
|------|----------|------|
| 移动应用 | 减少网络请求，避免过度获取 | 新闻App、社交App |
| 微服务架构 | Federation解耦服务 | 电商平台、SaaS产品 |
| 复杂数据关系 | 图状数据查询 | 社交网络、推荐系统 |
| 快速迭代前端 | 减少API版本维护 | MVP产品、初创公司 |
| 公共API | 灵活的数据获取 | 开放平台、第三方集成 |

**REST适用场景**：

| 场景 | 推荐理由 | 示例 |
|------|----------|------|
| 简单CRUD | 无需复杂查询能力 | CMS内容管理 |
| 静态资源 | HTTP缓存优化 | CDN、图片服务 |
| 强缓存需求 | HTTP缓存机制成熟 | 天气预报、数据API |
| 简单监控 | 端点即监控点 | 监控服务、健康检查 |
| 团队经验 | 团队熟悉REST | 传统企业系统 |

### 11.2 混合架构实践

**REST + GraphQL共存**：

```typescript
// 场景：电商平台
// REST用于简单CRUD和静态资源
// GraphQL用于复杂产品查询和购物车

// app.module.ts
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { RestApiModule } from './rest/rest-api.module';

@Module({
  imports: [
    // GraphQL用于产品目录和用户交互
    GraphQLModule.forRoot({
      autoSchemaFile: true,
    }),

    // REST用于支付、库存等简单操作
    RestApiModule,
  ],
})
export class AppModule {}

// 典型使用场景
// REST端点（简单、缓存友好）
// GET /api/products/:id/stock - 库存检查
// POST /api/orders/:id/pay - 支付处理
// GET /api/users/:id/profile - 用户基本信息

// GraphQL查询（复杂、灵活）
// query {
//   product(id: "123") {
//     name
//     description
//     price
//     variants { size color stock }
//     reviews { rating content author }
//     relatedProducts { name price }
//   }
// }
```

### 11.3 我的思考：选择看场景

**技术选型决策矩阵**：

```typescript
// 决策框架
const decisionMatrix = {
  // 优先GraphQL
  preferGraphQL: [
    '移动端应用（网络敏感）',
    '复杂关联数据查询',
    '多端差异化数据需求',
    '需要高效实时订阅',
    '微服务架构解耦',
    '开放平台API',
  ],

  // 优先REST
  preferREST: [
    '简单CRUD操作为主',
    '需要HTTP标准缓存',
    '团队GraphQL经验不足',
    '简单监控和追踪需求',
    '公共服务静态数据',
    '需要成熟的工具链',
  ],

  // 混合使用
  hybridApproach: [
    '核心业务用REST',
    '复杂查询用GraphQL',
    '静态资源用REST CDN',
    '实时数据用GraphQL Subscriptions',
    '外部API用REST',
    '内部服务通信用gRPC',
  ],
};

// 实际建议
const practicalAdvice = `
1. 新项目评估维度：
   - 团队技术栈和经验
   - 项目规模和复杂度
   - 移动端需求程度
   - 实时性要求
   - 长期维护计划

2. 渐进式迁移策略：
   - 保持现有REST API
   - 新功能使用GraphQL
   - 逐步迁移核心模块
   - 监控性能和稳定性

3. 技术债务管理：
   - 不要为了GraphQL而GraphQL
   - 评估迁移成本收益
   - 保持技术选型一致性
   - 避免过度设计
`;
```

---

## 十二、GraphQL生态

### 12.1 GraphQL生态工具全景

**开发工具链**：

| 类别 | 工具 | 用途 |
|------|------|------|
| **服务器** | Apollo Server | 主流GraphQL服务器 |
| | GraphQL Yoga | 轻量级高性能服务器 |
| | Dgraph | 原生GraphQL数据库 |
| | Hasura | GraphQL+PostgreSQL |
| **客户端** | Apollo Client | 成熟的全功能客户端 |
| | urql | 轻量级客户端 |
| | Relay | Facebook官方客户端 |
| **代码生成** | GraphQL Codegen | TypeScript类型生成 |
| | Apollo CLI | Schema管理 |
| **监控** | Apollo Studio | Schema注册、查询分析 |
| | GraphQL Inspector | Schema变更检测 |
| **测试** | GraphQL Faker | Mock数据 |
| | Apollo Server Testing | 集成测试 |

### 12.2 Prisma集成

**Prisma + GraphQL实战**：

```typescript
// schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String?
  posts     Post[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Post {
  id        String    @id @default(cuid())
  title     String
  content   String?
  published Boolean   @default(false)
  author    User      @relation(fields: [authorId], references: [id])
  authorId  String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

// 生成Prisma Client
// npx prisma generate
```

```typescript
// posts/post.service.ts (使用Prisma)
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Post, CreatePostInput } from './post.model';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  async findAll(where?: { published?: boolean; authorId?: string }) {
    return this.prisma.post.findMany({
      where,
      include: { author: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.post.findUnique({
      where: { id },
      include: { author: true },
    });
  }

  async create(data: CreatePostInput, authorId: string) {
    return this.prisma.post.create({
      data: {
        ...data,
        author: { connect: { id: authorId } },
      },
      include: { author: true },
    });
  }

  async update(id: string, data: Partial<CreatePostInput>) {
    return this.prisma.post.update({
      where: { id },
      data,
      include: { author: true },
    });
  }

  async delete(id: string) {
    await this.prisma.post.delete({ where: { id } });
    return true;
  }
}
```

### 12.3 Hasura实战

**Hasura作为GraphQL BaaS**：

```yaml
# hasura/metadata/databases/default/tables/public_user.yaml
table:
  name: user
  schema: public

array_relationships:
  - name: posts
    using:
      foreign_key_constraint_on:
        column: author_id
        table:
          name: post
          schema: public

select_permissions:
  - role: public
    permission:
      columns:
        - id
        - name
        - avatar
      filter: {}

  - role: user
    permission:
      columns:
        - id
        - name
        - email
        - avatar
        - created_at
      filter:
        id:
          _eq: X-Hasura-User-Id

insert_permissions:
  - role: user
    permission:
      check:
        id:
          _eq: X-Hasura-User-Id
      set:
        author_id: X-Hasura-User-Id

update_permissions:
  - role: user
    permission:
      columns:
        - name
        - avatar
      filter:
        id:
          _eq: X-Hasura-User-Id
```

### 12.4 我的思考：生态工具选型

**工具选型建议**：

```typescript
const toolRecommendations = {
  // 小型项目（< 3个月）
  smallProject: {
    backend: 'Hasura / Apollo Server + Prisma',
    frontend: 'Apollo Client / urql',
    deployment: 'Vercel / Railway',
    reasoning: '快速启动，最小配置',
  },

  // 中型项目（3-6个月）
  mediumProject: {
    backend: 'Apollo Server + Prisma',
    frontend: 'Apollo Client',
    extra: ['GraphQL Code Generator', 'GraphQL Inspector'],
    deployment: 'AWS ECS / GCP Cloud Run',
    reasoning: '需要类型安全和更好的开发体验',
  },

  // 大型项目（> 6个月）
  largeProject: {
    backend: 'Apollo Federation + NestJS',
    frontend: 'Apollo Client / Relay',
    extra: [
      'GraphQL Code Generator',
      'Apollo Studio',
      'GraphQL Mesh',
      'Custom Directives',
    ],
    deployment: 'Kubernetes',
    reasoning: '微服务解耦，团队协作，性能优化',
  },

  // 实时应用
  realtime: {
    backend: 'GraphQL Yoga + Redis PubSub',
    frontend: 'Apollo Client Subscriptions',
    extra: ['LiveQuery', 'GraphQL Subscriptions'],
    reasoning: '需要可靠的实时能力',
  },
};
```

---

## 总结

GraphQL作为现代API查询语言，为开发者提供了前所未有的灵活性和效率。从本文可以看到：

**核心优势**：
1. **精确数据获取**：客户端指定所需字段，避免过度获取
2. **强类型系统**：Schema即文档，类型安全
3. **单一端点**：简化API管理
4. **实时能力**：原生支持Subscriptions

**实战要点**：
1. **Schema设计**：良好的类型建模是GraphQL成功的基础
2. **Resolver优化**：使用DataLoader解决N+1问题
3. **性能保障**：查询复杂度限制、响应缓存、分页策略
4. **安全认证**：JWT集成、字段级权限、自定义指令
5. **生产就绪**：监控、日志、错误处理、限流

**生态工具**：
1. **Apollo**：最完整的生态覆盖
2. **Prisma**：现代ORM，类型安全
3. **NestJS**：企业级框架集成
4. **Hasura**：快速BaaS方案

GraphQL不是银弹，选择合适的技术栈需要根据项目需求、团队经验和长期规划综合考虑。在正确的场景下使用GraphQL，可以显著提升开发效率和用户体验。
