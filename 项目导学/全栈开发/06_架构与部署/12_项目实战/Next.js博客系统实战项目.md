# Next.js 16博客系统实战项目

## 项目概述

本项目是一个完整的全栈博客系统，使用Next.js 16构建，包含文章管理、评论系统、收藏功能、搜索功能等核心模块。

### 技术栈

- **框架**：Next.js 16 (App Router)
- **语言**：TypeScript 5.x
- **数据库**：PostgreSQL + Prisma
- **认证**：NextAuth.js
- **富文本编辑**：Tiptap
- **Markdown渲染**：React Markdown
- **状态管理**：Zustand
- **样式方案**：Tailwind CSS 4.x
- **表单验证**：Zod
- **SEO优化**：Next.js内置SEO支持

---

## 项目结构

```
nextjs-blog/
├── app/                          # App Router路由
│   ├── layout.tsx               # 根布局
│   ├── page.tsx                 # 首页
│   ├── posts/                   # 文章相关页面
│   │   ├── page.tsx            # 文章列表页
│   │   └── [slug]/             # 文章详情页
│   │       ├── page.tsx
│   │       └── loading.tsx
│   ├── api/                     # API路由
│   │   └── posts/              # 文章API
│   │       └── route.ts
│   ├── auth/                    # 认证路由
│   │   └── [...nextauth]/      # NextAuth路由
│   │       └── route.ts
│   └── actions/                 # Server Actions
│       └── posts.ts
├── components/                   # 组件
│   ├── ui/                      # UI组件
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── input.tsx
│   ├── posts/                   # 文章相关组件
│   │   ├── post-list.tsx
│   │   ├── post-card.tsx
│   │   ├── post-content.tsx
│   │   └── comment-list.tsx
│   ├── layout/                  # 布局组件
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   └── sidebar.tsx
│   └── forms/                   # 表单组件
│       ├── post-form.tsx
│       └── comment-form.tsx
├── lib/                         # 工具函数
│   ├── prisma.ts                # Prisma客户端
│   ├── auth.ts                  # 认证工具
│   ├── markdown.ts              # Markdown工具
│   └── utils.ts                 # 通用工具
├── hooks/                       # 自定义Hooks
│   └── use-post.ts
├── stores/                      # Zustand状态管理
│   └── theme-store.ts
├── public/                      # 静态资源
│   ├── images/
│   └── favicon.ico
├── styles/                      # 全局样式
│   └── globals.css
├── types/                       # TypeScript类型定义
│   └── index.ts
├── config/                      # 配置文件
│   └── site.ts
├── middleware.ts                # 中间件
├── next.config.js               # Next.js配置
├── prisma/                      # Prisma配置
│   ├── schema.prisma
│   └── migrations/
└── package.json
```

---

## 核心功能模块

### 1. 数据模型 (Prisma Schema)

#### Prisma Schema (prisma/schema.prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 用户模型
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  username      String?   @unique
  bio           String?
  website       String?
  location      String?
  
  // 关系
  posts         Post[]    @relation("AuthorPosts")
  comments      Comment[] @relation("UserComments")
  favorites     Favorite[] @relation("UserFavorites")
  likes         Like[]    @relation("UserLikes")
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@map("users")
}

// 账户模型（用于OAuth）
model Account {
  id                 String  @id @default(cuid())
  userId             String
  type               String
  provider           String
  providerAccountId  String
  refresh_token      String?
  access_token       String?
  expires_at         Int?
  token_type         String?
  scope              String?
  id_token           String?
  session_state      String?
  
  user User @relation("AccountUser", onDelete: Cascade)
  
  @@unique([provider, providerAccountId])
  @@map("accounts")
}

// 会话模型
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  
  user User @relation("SessionUser", onDelete: Cascade)
  
  @@map("sessions")
}

// 验证请求模型
model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  
  @@unique([identifier, token])
  @@map("verification_tokens")
}

// 文章模型
model Post {
  id              String    @id @default(cuid())
  title           String
  slug            String    @unique
  excerpt         String?
  content         String    @db.Text
  coverImage      String?
  published       Boolean   @default(false)
  publishDate     DateTime?
  featured        Boolean   @default(false)
  views           Int       @default(0)
  
  // 关系
  author          User      @relation("AuthorPosts", fields: [authorId], references: [id])
  authorId        String
  comments        Comment[] @relation("PostComments")
  favorites       Favorite[] @relation("PostFavorites")
  likes           Like[]    @relation("PostLikes")
  tags            PostTag[] @relation("PostTags")
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([authorId])
  @@index([slug])
  @@index([published, publishDate])
  @@index([featured])
  @@map("posts")
}

// 标签模型
model Tag {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String?
  
  // 关系
  posts       PostTag[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("tags")
}

// 文章-标签关联模型
model PostTag {
  id        String   @id @default(cuid())
  post      Post     @relation("PostTags", fields: [postId], references: [id], onDelete: Cascade)
  postId    String
  tag       Tag      @relation("PostTags", fields: [tagId], references: [id], onDelete: Cascade)
  tagId     String
  
  createdAt DateTime @default(now())
  
  @@unique([postId, tagId])
  @@map("post_tags")
}

// 评论模型
model Comment {
  id          String   @id @default(cuid())
  content     String   @db.Text
  parentId    String?
  
  // 关系
  post        Post     @relation("PostComments", fields: [postId], references: [id], onDelete: Cascade)
  postId      String
  author      User     @relation("UserComments", fields: [authorId], references: [id], onDelete: Cascade)
  authorId    String
  replies     Comment[] @relation("ParentComments")
  parent      Comment?  @relation("ParentComments", fields: [parentId], references: [id])
  
  likes       Like[]   @relation("CommentLikes")
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([postId])
  @@index([parentId])
  @@map("comments")
}

// 收藏模型
model Favorite {
  id        String   @id @default(cuid())
  post      Post     @relation("PostFavorites", fields: [postId], references: [id], onDelete: Cascade)
  postId    String
  user      User     @relation("UserFavorites", fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  
  createdAt DateTime @default(now())
  
  @@unique([postId, userId])
  @@map("favorites")
}

// 点赞模型
model Like {
  id        String   @id @default(cuid())
  post      Post?    @relation("PostLikes", fields: [postId], references: [id], onDelete: Cascade)
  postId    String?
  comment   Comment? @relation("CommentLikes", fields: [commentId], references: [id], onDelete: Cascade)
  commentId String?
  user      User     @relation("UserLikes", fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  
  createdAt DateTime @default(now())
  
  @@unique([postId, userId])
  @@unique([commentId, userId])
  @@map("likes")
}
```

---

### 2. Prisma客户端配置

#### Prisma工具 (lib/prisma.ts)

```typescript
/**
 * Prisma客户端单例模式
 * 避免Next.js热更新时创建多个客户端实例
 */

import { PrismaClient } from '@prisma/client';

// 声明全局变量
declare const globalThis: {
  prisma: PrismaClient | undefined;
} & typeof global;

// 创建或复用Prisma客户端
export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

// 在开发环境中设置全局变量
if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
```

---

### 3. 认证配置

#### NextAuth配置 (lib/auth.ts)

```typescript
/**
 * NextAuth.js配置
 * 支持邮箱登录和GitHub OAuth
 */

import { PrismaAdapter } from '@auth/prisma-adapter';
import { NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import GitHubProvider from 'next-auth/providers/github';
import { prisma } from './prisma';

/**
 * 配置NextAuth选项
 */
export const authOptions: NextAuthOptions = {
  // 使用Prisma适配器
  adapter: PrismaAdapter(prisma),
  
  // 认证提供商
  providers: [
    // 邮箱登录
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
    
    // GitHub OAuth
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],
  
  // 回调函数
  callbacks: {
    // 会话回调
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.username = user.username;
        session.user.image = user.image;
      }
      return session;
    },
    
    // JWT回调
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
      }
      return token;
    },
  },
  
  // 页面配置
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  
  // JWT配置
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30天
  },
  
  // 秘钥
  secret: process.env.NEXTAUTH_SECRET,
};

/**
 * 获取NextAuth请求处理函数
 * 用于API路由
 */
import NextAuth from 'next-auth/next';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

#### 认证路由 (app/api/auth/[...nextauth]/route.ts)

```typescript
/**
 * NextAuth API路由
 * 处理所有认证相关的API请求
 */

import { handler as nextAuth } from '@/lib/auth';

// 导出GET和POST处理函数
export { nextAuth as GET, nextAuth as POST };
```

---

### 4. 文章管理模块

#### 文章类型定义 (types/index.ts)

```typescript
/**
 * TypeScript类型定义
 */

// 用户类型
export interface User {
  id: string;
  name?: string;
  email: string;
  image?: string;
  username?: string;
  bio?: string;
  website?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

// 文章类型
export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  published: boolean;
  publishDate?: string;
  featured: boolean;
  views: number;
  author: User;
  comments: Comment[];
  favorites: Favorite[];
  likes: Like[];
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

// 标签类型
export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  postsCount?: number;
  createdAt: string;
  updatedAt: string;
}

// 评论类型
export interface Comment {
  id: string;
  content: string;
  parentId?: string;
  post: Post;
  author: User;
  replies: Comment[];
  likes: Like[];
  createdAt: string;
  updatedAt: string;
}

// 收藏类型
export interface Favorite {
  id: string;
  postId: string;
  userId: string;
  createdAt: string;
}

// 点赞类型
export interface Like {
  id: string;
  postId?: string;
  commentId?: string;
  userId: string;
  createdAt: string;
}

// 分页信息
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: Pagination;
}

// 文章查询参数
export interface PostQuery {
  page?: number;
  limit?: number;
  search?: string;
  tag?: string;
  author?: string;
  featured?: boolean;
  published?: boolean;
  sort?: 'newest' | 'oldest' | 'popular';
}

// 评论查询参数
export interface CommentQuery {
  postId: string;
  parentId?: string;
  page?: number;
  limit?: number;
}
```

#### 文章服务 (services/post.service.ts)

```typescript
/**
 * 文章业务逻辑服务
 */

import { prisma } from '@/lib/prisma';
import { PostQuery, Post, CommentQuery, Comment } from '@/types';

/**
 * 获取文章列表
 * @param query 查询参数
 * @returns 文章列表和分页信息
 */
export async function getPosts(query: PostQuery): Promise<{ posts: Post[]; pagination: any }> {
  const {
    page = 1,
    limit = 10,
    search,
    tag,
    author,
    featured,
    published = true,
    sort = 'newest',
  } = query;

  // 构建查询条件
  const where: any = {};
  
  if (published !== undefined) {
    where.published = published;
  }
  
  if (featured !== undefined) {
    where.featured = featured;
  }
  
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { excerpt: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ];
  }
  
  if (tag) {
    where.tags = {
      some: {
        tag: {
          slug: tag,
        },
      },
    };
  }
  
  if (author) {
    where.author = {
      username: { equals: author, mode: 'insensitive' },
    };
  }

  // 构建排序
  const orderBy: any = {};
  if (sort === 'newest') {
    orderBy.publishDate = 'desc';
  } else if (sort === 'oldest') {
    orderBy.publishDate = 'asc';
  } else if (sort === 'popular') {
    orderBy.views = 'desc';
  }

  // 计算跳过数量
  const skip = (Number(page) - 1) * Number(limit);

  // 获取文章列表
  const posts = await prisma.post.findMany({
    where,
    orderBy,
    skip,
    take: Number(limit),
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
      _count: {
        select: {
          comments: true,
          favorites: true,
          likes: true,
        },
      },
    },
  });

  // 获取总数
  const total = await prisma.post.count({ where });

  // 格式化文章数据
  const formattedPosts = posts.map(post => ({
    ...post,
    tags: post.tags.map((pt: any) => pt.tag),
    commentsCount: post._count.comments,
    favoritesCount: post._count.favorites,
    likesCount: post._count.likes,
  }));

  return {
    posts: formattedPosts,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
      hasMore: skip + Number(limit) < total,
    },
  };
}

/**
 * 根据slug获取文章详情
 * @param slug 文章slug
 * @returns 文章详情
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const post = await prisma.post.findUnique({
    where: { slug },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          image: true,
          bio: true,
          website: true,
          location: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
      comments: {
        where: { parentId: null },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  image: true,
                },
              },
            },
          },
          _count: {
            select: { replies: true, likes: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      _count: {
        select: {
          comments: true,
          favorites: true,
          likes: true,
        },
      },
    },
  });

  if (!post) return null;

  // 增加文章浏览数
  await prisma.post.update({
    where: { slug },
    data: { views: { increment: 1 } },
  });

  // 格式化文章数据
  return {
    ...post,
    tags: post.tags.map((pt: any) => pt.tag),
    commentsCount: post._count.comments,
    favoritesCount: post._count.favorites,
    likesCount: post._count.likes,
    comments: post.comments.map(comment => ({
      ...comment,
      repliesCount: comment._count.replies,
      likesCount: comment._count.likes,
    })),
  };
}

/**
 * 创建新文章
 * @param data 文章数据
 * @returns 创建的文章
 */
export async function createPost(data: {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  published?: boolean;
  publishDate?: Date;
  featured?: boolean;
  tagIds: string[];
  authorId: string;
}): Promise<Post> {
  const post = await prisma.post.create({
    data: {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      coverImage: data.coverImage,
      published: data.published || false,
      publishDate: data.publishDate,
      featured: data.featured || false,
      author: { connect: { id: data.authorId } },
      tags: {
        create: data.tagIds.map(tagId => ({
          tag: { connect: { id: tagId } },
        })),
      },
    },
    include: {
      author: true,
      tags: {
        include: { tag: true },
      },
    },
  });

  return {
    ...post,
    tags: post.tags.map((pt: any) => pt.tag),
  };
}

/**
 * 更新文章
 * @param id 文章ID
 * @param data 更新数据
 * @returns 更新后的文章
 */
export async function updatePost(id: string, data: Partial<Post>): Promise<Post> {
  const post = await prisma.post.update({
    where: { id },
    data,
    include: {
      author: true,
      tags: {
        include: { tag: true },
      },
    },
  });

  return {
    ...post,
    tags: post.tags.map((pt: any) => pt.tag),
  };
}

/**
 * 删除文章
 * @param id 文章ID
 * @returns 删除结果
 */
export async function deletePost(id: string): Promise<void> {
  await prisma.post.delete({
    where: { id },
  });
}

/**
 * 获取热门文章（按浏览量排序）
 * @param limit 返回数量
 * @returns 热门文章列表
 */
export async function getPopularPosts(limit: number = 5): Promise<Post[]> {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { views: 'desc' },
    take: limit,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
      _count: {
        select: { comments: true, likes: true },
      },
    },
  });

  return posts.map(post => ({
    ...post,
    commentsCount: post._count.comments,
    likesCount: post._count.likes,
  }));
}

/**
 * 获取标签列表
 * @returns 标签列表
 */
export async function getTags(): Promise<any[]> {
  const tags = await prisma.tag.findMany({
    include: {
      _count: {
        select: { posts: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  return tags.map(tag => ({
    ...tag,
    postsCount: tag._count.posts,
  }));
}

/**
 * 根据标签获取文章
 * @param tagSlug 标签slug
 * @returns 文章列表
 */
export async function getPostsByTag(tagSlug: string): Promise<Post[]> {
  const posts = await prisma.post.findMany({
    where: {
      published: true,
      tags: {
        some: {
          tag: { slug: tagSlug },
        },
      },
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
      _count: {
        select: { comments: true, likes: true },
      },
    },
  });

  return posts.map(post => ({
    ...post,
    commentsCount: post._count.comments,
    likesCount: post._count.likes,
  }));
}
```

#### 文章API路由 (app/api/posts/route.ts)

```typescript
/**
 * 文章API路由
 * 处理文章相关的API请求
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
} from '@/services/post.service';

/**
 * 获取文章列表
 * GET /api/posts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 解析查询参数
    const query: any = {};
    if (searchParams.get('page')) query.page = Number(searchParams.get('page'));
    if (searchParams.get('limit')) query.limit = Number(searchParams.get('limit'));
    if (searchParams.get('search')) query.search = searchParams.get('search');
    if (searchParams.get('tag')) query.tag = searchParams.get('tag');
    if (searchParams.get('author')) query.author = searchParams.get('author');
    if (searchParams.get('featured')) query.featured = searchParams.get('featured') === 'true';
    if (searchParams.get('sort')) query.sort = searchParams.get('sort') as any;

    // 获取文章列表
    const result = await getPosts(query);

    return NextResponse.json({
      success: true,
      data: result.posts,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('获取文章列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取文章列表失败' },
      { status: 500 }
    );
  }
}

/**
 * 创建新文章
 * POST /api/posts
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户认证
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: '未认证' },
        { status: 401 }
      );
    }

    // 解析请求体
    const data = await request.json();

    // 创建文章
    const post = await createPost({
      ...data,
      authorId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error('创建文章失败:', error);
    return NextResponse.json(
      { success: false, error: '创建文章失败' },
      { status: 500 }
    );
  }
}

/**
 * 获取文章详情
 * GET /api/posts/[slug]
 */
export async function GET_BY_SLUG(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { success: false, error: '缺少slug参数' },
        { status: 400 }
      );
    }

    // 获取文章详情
    const post = await getPostBySlug(slug);

    if (!post) {
      return NextResponse.json(
        { success: false, error: '文章不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error('获取文章详情失败:', error);
    return NextResponse.json(
      { success: false, error: '获取文章详情失败' },
      { status: 500 }
    );
  }
}
```

---

### 5. 评论模块

#### 评论服务 (services/comment.service.ts)

```typescript
/**
 * 评论业务逻辑服务
 */

import { prisma } from '@/lib/prisma';
import { CommentQuery, Comment } from '@/types';

/**
 * 获取文章评论列表
 * @param query 查询参数
 * @returns 评论列表
 */
export async function getComments(query: CommentQuery): Promise<Comment[]> {
  const { postId, parentId, page = 1, limit = 10 } = query;

  // 构建查询条件
  const where: any = { postId };
  
  if (parentId) {
    where.parentId = parentId;
  } else {
    where.parentId = null;
  }

  // 计算跳过数量
  const skip = (Number(page) - 1) * Number(limit);

  // 获取评论列表
  const comments = await prisma.comment.findMany({
    where,
    skip,
    take: Number(limit),
    orderBy: { createdAt: 'asc' },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
      replies: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
      },
      _count: {
        select: { replies: true, likes: true },
      },
    },
  });

  // 格式化评论数据
  return comments.map(comment => ({
    ...comment,
    repliesCount: comment._count.replies,
    likesCount: comment._count.likes,
  }));
}

/**
 * 创建评论
 * @param data 评论数据
 * @returns 创建的评论
 */
export async function createComment(data: {
  content: string;
  postId: string;
  parentId?: string;
  authorId: string;
}): Promise<Comment> {
  const comment = await prisma.comment.create({
    data: {
      content: data.content,
      postId: data.postId,
      parentId: data.parentId,
      authorId: data.authorId,
    },
    include: {
      author: true,
    },
  });

  return comment;
}

/**
 * 删除评论
 * @param id 评论ID
 * @returns 删除结果
 */
export async function deleteComment(id: string): Promise<void> {
  await prisma.comment.delete({
    where: { id },
  });
}

/**
 * 点赞评论
 * @param commentId 评论ID
 * @param userId 用户ID
 * @returns 点赞结果
 */
export async function toggleCommentLike(commentId: string, userId: string) {
  const existingLike = await prisma.like.findFirst({
    where: {
      commentId,
      userId,
    },
  });

  if (existingLike) {
    // 取消点赞
    await prisma.like.delete({
      where: { id: existingLike.id },
    });
    return { liked: false };
  } else {
    // 添加点赞
    await prisma.like.create({
      data: {
        commentId,
        userId,
      },
    });
    return { liked: true };
  }
}

/**
 * 获取用户点赞的评论
 * @param userId 用户ID
 * @returns 点赞的评论列表
 */
export async function getUserLikedComments(userId: string): Promise<Comment[]> {
  const likes = await prisma.like.findMany({
    where: { userId },
    include: {
      comment: {
        include: {
          author: true,
          replies: true,
        },
      },
    },
  });

  return likes.map(like => like.comment);
}
```

#### 评论API路由 (app/api/comments/route.ts)

```typescript
/**
 * 评论API路由
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getComments, createComment } from '@/services/comment.service';

/**
 * 获取评论列表
 * GET /api/comments
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const query: any = {
      postId: searchParams.get('postId'),
      parentId: searchParams.get('parentId'),
      page: Number(searchParams.get('page')) || 1,
      limit: Number(searchParams.get('limit')) || 10,
    };

    const comments = await getComments(query);

    return NextResponse.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    console.error('获取评论列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取评论列表失败' },
      { status: 500 }
    );
  }
}

/**
 * 创建评论
 * POST /api/comments
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户认证
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: '未认证' },
        { status: 401 }
      );
    }

    // 解析请求体
    const data = await request.json();

    // 创建评论
    const comment = await createComment({
      ...data,
      authorId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      data: comment,
    });
  } catch (error) {
    console.error('创建评论失败:', error);
    return NextResponse.json(
      { success: false, error: '创建评论失败' },
      { status: 500 }
    );
  }
}
```

---

### 6. 收藏和点赞模块

#### 收藏服务 (services/favorite.service.ts)

```typescript
/**
 * 收藏业务逻辑服务
 */

import { prisma } from '@/lib/prisma';

/**
 * 切换收藏状态
 * @param postId 文章ID
 * @param userId 用户ID
 * @returns 收藏结果
 */
export async function toggleFavorite(postId: string, userId: string) {
  const existingFavorite = await prisma.favorite.findFirst({
    where: {
      postId,
      userId,
    },
  });

  if (existingFavorite) {
    // 取消收藏
    await prisma.favorite.delete({
      where: { id: existingFavorite.id },
    });
    return { favorited: false };
  } else {
    // 添加收藏
    await prisma.favorite.create({
      data: {
        postId,
        userId,
      },
    });
    return { favorited: true };
  }
}

/**
 * 获取用户收藏的文章
 * @param userId 用户ID
 * @returns 收藏的文章列表
 */
export async function getUserFavorites(userId: string) {
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    include: {
      post: {
        include: {
          author: true,
          tags: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return favorites.map(f => f.post);
}

/**
 * 检查用户是否收藏了文章
 * @param postId 文章ID
 * @param userId 用户ID
 * @returns 是否收藏
 */
export async function isPostFavorite(postId: string, userId: string) {
  const favorite = await prisma.favorite.findFirst({
    where: { postId, userId },
  });
  return !!favorite;
}
```

#### 点赞服务 (services/like.service.ts)

```typescript
/**
 * 点赞业务逻辑服务
 */

import { prisma } from '@/lib/prisma';

/**
 * 切换文章点赞状态
 * @param postId 文章ID
 * @param userId 用户ID
 * @returns 点赞结果
 */
export async function togglePostLike(postId: string, userId: string) {
  const existingLike = await prisma.like.findFirst({
    where: {
      postId,
      userId,
    },
  });

  if (existingLike) {
    // 取消点赞
    await prisma.like.delete({
      where: { id: existingLike.id },
    });
    return { liked: false };
  } else {
    // 添加点赞
    await prisma.like.create({
      data: {
        postId,
        userId,
      },
    });
    return { liked: true };
  }
}

/**
 * 获取用户点赞的文章
 * @param userId 用户ID
 * @returns 点赞的文章列表
 */
export async function getUserLikedPosts(userId: string) {
  const likes = await prisma.like.findMany({
    where: { userId },
    include: {
      post: {
        include: {
          author: true,
          tags: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return likes.map(l => l.post);
}
```

---

### 7. Server Actions

#### 文章Server Actions (app/actions/posts.ts)

```typescript
/**
 * Server Actions - 服务端操作
 * 用于处理表单提交和数据修改
 */

'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createPost, updatePost, deletePost } from '@/services/post.service';
import { createComment } from '@/services/comment.service';
import { toggleFavorite } from '@/services/favorite.service';
import { togglePostLike } from '@/services/like.service';

/**
 * 创建文章
 */
export async function createPostAction(formData: FormData) {
  try {
    // 验证用户认证
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return { success: false, error: '未认证' };
    }

    // 从表单获取数据
    const title = formData.get('title') as string;
    const slug = formData.get('slug') as string;
    const excerpt = formData.get('excerpt') as string;
    const content = formData.get('content') as string;
    const coverImage = formData.get('coverImage') as string;
    const published = formData.get('published') === 'on';
    const featured = formData.get('featured') === 'on';
    const tagIds = JSON.parse(formData.get('tagIds') as string);

    // 创建文章
    await createPost({
      title,
      slug,
      excerpt,
      content,
      coverImage,
      published,
      featured,
      tagIds,
      authorId: session.user.id,
    });

    // 重新验证路径
    revalidatePath('/posts');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('创建文章失败:', error);
    return { success: false, error: '创建文章失败' };
  }
}

/**
 * 更新文章
 */
export async function updatePostAction(id: string, formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return { success: false, error: '未认证' };
    }

    const title = formData.get('title') as string;
    const excerpt = formData.get('excerpt') as string;
    const content = formData.get('content') as string;
    const coverImage = formData.get('coverImage') as string;
    const published = formData.get('published') === 'on';
    const featured = formData.get('featured') === 'on';
    const tagIds = JSON.parse(formData.get('tagIds') as string);

    // 更新文章
    await updatePost(id, {
      title,
      excerpt,
      content,
      coverImage,
      published,
      featured,
      tagIds,
    });

    revalidatePath('/posts');
    revalidatePath(`/posts/${id}`);

    return { success: true };
  } catch (error) {
    console.error('更新文章失败:', error);
    return { success: false, error: '更新文章失败' };
  }
}

/**
 * 删除文章
 */
export async function deletePostAction(id: string) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return { success: false, error: '未认证' };
    }

    await deletePost(id);

    revalidatePath('/posts');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('删除文章失败:', error);
    return { success: false, error: '删除文章失败' };
  }
}

/**
 * 添加评论
 */
export async function addCommentAction(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return { success: false, error: '未认证' };
    }

    const postId = formData.get('postId') as string;
    const content = formData.get('content') as string;
    const parentId = formData.get('parentId') as string;

    await createComment({
      postId,
      content,
      parentId: parentId || undefined,
      authorId: session.user.id,
    });

    revalidatePath(`/posts/${postId}`);

    return { success: true };
  } catch (error) {
    console.error('添加评论失败:', error);
    return { success: false, error: '添加评论失败' };
  }
}

/**
 * 切换收藏
 */
export async function toggleFavoriteAction(postId: string) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return { success: false, error: '未认证' };
    }

    const result = await toggleFavorite(postId, session.user.id);

    revalidatePath(`/posts/${postId}`);

    return { success: true, favorited: result.favorited };
  } catch (error) {
    console.error('切换收藏失败:', error);
    return { success: false, error: '切换收藏失败' };
  }
}

/**
 * 切换点赞
 */
export async function toggleLikeAction(postId: string) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return { success: false, error: '未认证' };
    }

    const result = await togglePostLike(postId, session.user.id);

    revalidatePath(`/posts/${postId}`);

    return { success: true, liked: result.liked };
  } catch (error) {
    console.error('切换点赞失败:', error);
    return { success: false, error: '切换点赞失败' };
  }
}
```

---

### 8. 组件实现

#### 文章卡片组件 (components/posts/post-card.tsx)

```tsx
/**
 * 文章卡片组件
 * 展示文章的简要信息
 */

import Link from 'next/link';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Post } from '@/types';

interface PostCardProps {
  post: Post;
  showAuthor?: boolean;
  showExcerpt?: boolean;
}

export function PostCard({ post, showAuthor = true, showExcerpt = true }: PostCardProps) {
  return (
    <article className="group flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm transition-all hover:shadow-md">
      {/* 文章封面图片 */}
      {post.coverImage && (
        <Link href={`/posts/${post.slug}`} className="overflow-hidden rounded-lg">
          <img
            src={post.coverImage}
            alt={post.title}
            className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
      )}

      {/* 文章内容 */}
      <div className="flex flex-col flex-1">
        {/* 文章标题 */}
        <Link href={`/posts/${post.slug}`}>
          <h2 className="mb-2 text-xl font-bold text-gray-900 transition-colors group-hover:text-blue-600">
            {post.title}
          </h2>
        </Link>

        {/* 文章摘要 */}
        {showExcerpt && post.excerpt && (
          <p className="mb-4 text-gray-600 line-clamp-2">{post.excerpt}</p>
        )}

        {/* 文章信息 */}
        <div className="mt-auto flex items-center justify-between text-sm text-gray-500">
          {/* 发布日期 */}
          <time dateTime={post.publishDate || post.createdAt}>
            {format(new Date(post.publishDate || post.createdAt), 'yyyy年M月d日', {
              locale: zhCN,
            })}
          </time>

          {/* 文章统计 */}
          <div className="flex items-center gap-4">
            {/* 浏览数 */}
            <span className="flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              {post.views}
            </span>

            {/* 评论数 */}
            <span className="flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
              {post.commentsCount || 0}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
```

#### 文章列表组件 (components/posts/post-list.tsx)

```tsx
/**
 * 文章列表组件
 * 展示文章列表，支持分页
 */

import { Post } from '@/types';
import { PostCard } from './post-card';

interface PostListProps {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  onPaginationChange?: (page: number) => void;
}

export function PostList({ posts, pagination, onPaginationChange }: PostListProps) {
  // 处理分页变化
  const handlePageChange = (page: number) => {
    if (onPaginationChange) {
      onPaginationChange(page);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8">
      {/* 文章网格 */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {/* 分页 */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {/* 上一页 */}
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>

          {/* 页码 */}
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                page === pagination.page
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          ))}

          {/* 下一页 */}
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={!pagination.hasMore}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
```

#### 文章详情组件 (components/posts/post-content.tsx)

```tsx
/**
 * 文章详情组件
 * 展示文章的完整内容
 */

import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Post } from '@/types';
import { Markdown } from '@/lib/markdown';

interface PostContentProps {
  post: Post;
}

export function PostContent({ post }: PostContentProps) {
  return (
    <article className="prose prose-lg mx-auto max-w-3xl">
      {/* 文章标题 */}
      <h1 className="mb-4 text-3xl font-bold text-gray-900">{post.title}</h1>

      {/* 文章元信息 */}
      <div className="mb-8 flex items-center gap-4 text-gray-600">
        <span className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          {post.author.name || post.author.username}
        </span>
        
        <span className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <time dateTime={post.publishDate || post.createdAt}>
            {format(new Date(post.publishDate || post.createdAt), 'yyyy年M月d日', {
              locale: zhCN,
            })}
          </time>
        </span>

        <span className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          {post.views} 阅读
        </span>
      </div>

      {/* 文章标签 */}
      {post.tags && post.tags.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {post.tags.map(tag => (
            <span
              key={tag.id}
              className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* 文章封面图片 */}
      {post.coverImage && (
        <img
          src={post.coverImage}
          alt={post.title}
          className="mb-8 w-full rounded-xl"
        />
      )}

      {/* 文章内容 */}
      <div className="prose prose-lg max-w-none">
        <Markdown content={post.content} />
      </div>

      {/* 文章统计 */}
      <div className="mt-12 flex items-center gap-6 border-t border-gray-200 pt-8">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <span>{post.likesCount || 0} 赞</span>
        </div>

        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
          <span>{post.commentsCount || 0} 评论</span>
        </div>
      </div>
    </article>
  );
}
```

#### Markdown渲染组件 (lib/markdown.tsx)

```tsx
/**
 * Markdown渲染组件
 * 安全地渲染Markdown内容
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface MarkdownProps {
  content: string;
}

export function Markdown({ content }: MarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        // 代码块高亮
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter
              {...props}
              children={String(children).replace(/\n$/, '')}
              style={oneDark}
              language={match[1]}
              PreTag="div"
              className="rounded-lg"
            />
          ) : (
            <code {...props} className={className}>
              {children}
            </code>
          );
        },
        // 链接
        a({ node, children, ...props }) {
          return (
            <a
              {...props}
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          );
        },
        // 标题
        h1({ node, children, ...props }) {
          return (
            <h1 {...props} className="text-3xl font-bold mt-6 mb-4">
              {children}
            </h1>
          );
        },
        h2({ node, children, ...props }) {
          return (
            <h2 {...props} className="text-2xl font-bold mt-5 mb-3">
              {children}
            </h2>
          );
        },
        h3({ node, children, ...props }) {
          return (
            <h3 {...props} className="text-xl font-bold mt-4 mb-2">
              {children}
            </h3>
          );
        },
        // 列表
        ul({ node, children, ...props }) {
          return (
            <ul {...props} className="list-disc pl-6 my-4">
              {children}
            </ul>
          );
        },
        ol({ node, children, ...props }) {
          return (
            <ol {...props} className="list-decimal pl-6 my-4">
              {children}
            </ol>
          );
        },
        // 图片
        img({ node, children, ...props }) {
          return (
            <img
              {...props}
              className="max-w-full rounded-lg my-4"
              alt={props.alt || '图片'}
            />
          );
        },
        // 引用
        blockquote({ node, children, ...props }) {
          return (
            <blockquote
              {...props}
              className="border-l-4 border-blue-500 pl-4 italic my-4"
            >
              {children}
            </blockquote>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
```

---

### 9. 状态管理

#### 主题状态管理 (stores/theme-store.ts)

```typescript
/**
 * 主题状态管理
 * 使用Zustand管理主题切换
 */

import { create } from 'zustand';

// 主题类型
type Theme = 'light' | 'dark';

// 主题状态
interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

// 创建状态管理
export const useThemeStore = create<ThemeState>((set, get) => ({
  // 默认主题
  theme: 'light',
  
  // 切换主题
  toggleTheme: () => {
    const currentTheme = get().theme;
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    set({ theme: newTheme });
    
    // 更新HTML元素的class
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },
  
  // 设置主题
  setTheme: (theme: Theme) => {
    set({ theme });
    
    // 更新HTML元素的class
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },
}));

// 初始化主题
export function initTheme() {
  const savedTheme = localStorage.getItem('theme') as Theme | null;
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
  
  const theme = savedTheme || systemTheme;
  
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  }
  
  useThemeStore.getState().setTheme(theme);
}
```

---

### 10. 布局组件

#### 头部组件 (components/layout/header.tsx)

```tsx
/**
 * 网站头部组件
 * 包含导航栏和搜索功能
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useThemeStore } from '@/stores/theme-store';
import { useState } from 'react';

export function Header() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useThemeStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // 导航链接
  const navLinks = [
    { name: '首页', href: '/' },
    { name: '文章', href: '/posts' },
    { name: '关于', href: '/about' },
    { name: '联系', href: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">B</span>
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            博客系统
          </span>
        </Link>

        {/* 导航链接 */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* 右侧操作 */}
        <div className="flex items-center gap-4">
          {/* 搜索按钮 */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>

          {/* 主题切换 */}
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            {theme === 'light' ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            )}
          </button>

          {/* 用户菜单 */}
          <div className="relative">
            <button className="rounded-full p-1">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                <span className="text-sm font-medium">U</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 搜索框 */}
      {isSearchOpen && (
        <div className="container mx-auto px-4 py-4">
          <div className="relative">
            <input
              type="text"
              placeholder="搜索文章..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2 pl-10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      )}
    </header>
  );
}
```

#### 底部组件 (components/layout/footer.tsx)

```tsx
/**
 * 网站底部组件
 */

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white py-12 dark:border-gray-800 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* 公司信息 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                博客系统
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              一个现代化的博客平台，支持Markdown、评论、收藏等功能。
            </p>
          </div>

          {/* 快速链接 */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
              快速链接
            </h3>
            <ul className="space-y-2">
              {['首页', '文章', '关于', '联系'].map(item => (
                <li key={item}>
                  <Link
                    href={`/${item === '首页' ? '' : item.toLowerCase()}`}
                    className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 标签云 */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
              热门标签
            </h3>
            <div className="flex flex-wrap gap-2">
              {['React', 'Next.js', 'TypeScript', 'Node.js', 'Tailwind CSS'].map(
                tag => (
                  <span
                    key={tag}
                    className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  >
                    {tag}
                  </span>
                )
              )}
            </div>
          </div>

          {/* 订阅 */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
              订阅我们的邮件
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              获取最新的文章更新和技术分享
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="输入邮箱地址"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                订阅
              </button>
            </div>
          </div>
        </div>

        {/* 版权信息 */}
        <div className="mt-12 border-t border-gray-200 pt-8 dark:border-gray-800">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {new Date().getFullYear()} 博客系统. 保留所有权利。
            </p>
            <div className="flex gap-6">
              {['隐私政策', '服务条款', 'Cookie政策'].map(item => (
                <Link
                  key={item}
                  href={`/${item.replace('政策', '').toLowerCase()}`}
                  className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

---

### 11. 页面实现

#### 首页 (app/page.tsx)

```tsx
/**
 * 首页
 * 展示最新文章和热门文章
 */

import { getPosts, getPopularPosts } from '@/services/post.service';
import { PostList } from '@/components/posts/post-list';
import { Post } from '@/types';

// 首页元数据
export const metadata = {
  title: '首页 - 博客系统',
  description: '一个现代化的博客平台，分享技术文章和学习笔记',
};

export default async function HomePage() {
  // 获取最新文章
  const latestPosts = await getPosts({ page: 1, limit: 6, sort: 'newest' });
  
  // 获取热门文章
  const popularPosts = await getPopularPosts(5);

  return (
    <div className="space-y-12">
      {/* Hero区域 */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">
            欢迎来到我们的博客
          </h1>
          <p className="mb-8 text-lg text-blue-100">
            分享技术文章、学习笔记和开发经验
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="/posts"
              className="rounded-lg bg-white px-6 py-3 font-medium text-blue-600 hover:bg-blue-50"
            >
              浏览文章
            </a>
            <a
              href="/about"
              className="rounded-lg bg-blue-700 px-6 py-3 font-medium text-white hover:bg-blue-800"
            >
              关于我们
            </a>
          </div>
        </div>
      </section>

      {/* 最新文章 */}
      <section>
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            最新文章
          </h2>
          <a
            href="/posts"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            查看更多 →
          </a>
        </div>
        <PostList
          posts={latestPosts.posts}
          pagination={latestPosts.pagination}
        />
      </section>

      {/* 热门文章 */}
      <section className="bg-gray-50 py-12 dark:bg-gray-800/50">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white">
            热门文章
          </h2>
          <div className="grid gap-4">
            {popularPosts.map(post => (
              <div
                key={post.id}
                className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-sm font-bold text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400">
                  {post.views}
                </span>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {post.author.name || post.author.username}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
```

#### 文章列表页 (app/posts/page.tsx)

```tsx
/**
 * 文章列表页
 * 支持搜索、筛选、分页
 */

import { getPosts, getTags } from '@/services/post.service';
import { PostList } from '@/components/posts/post-list';
import { Post } from '@/types';

export const metadata = {
  title: '文章列表 - 博客系统',
  description: '浏览我们的文章列表',
};

// 生成静态参数
export async function generateStaticParams() {
  const posts = await getPosts({ page: 1, limit: 100 });
  const totalPages = posts.pagination.totalPages;
  
  return Array.from({ length: totalPages }, (_, i) => ({
    page: (i + 1).toString(),
  }));
}

interface PostsPageProps {
  searchParams: {
    page?: string;
    search?: string;
    tag?: string;
  };
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  // 获取查询参数
  const page = Number(searchParams.page) || 1;
  const search = searchParams.search || '';
  const tag = searchParams.tag || '';

  // 获取文章列表
  const posts = await getPosts({
    page,
    limit: 12,
    search,
    tag,
    sort: 'newest',
  });

  // 获取标签列表
  const tags = await getTags();

  return (
    <div className="grid gap-8 lg:grid-cols-4">
      {/* 主内容区 */}
      <div className="lg:col-span-3">
        {/* 搜索和筛选 */}
        <div className="mb-8 space-y-4">
          {/* 搜索框 */}
          <div className="relative">
            <input
              type="text"
              placeholder="搜索文章..."
              defaultValue={search}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 pl-10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* 标签筛选 */}
          <div className="flex flex-wrap gap-2">
            <button
              className={`rounded-full px-4 py-2 text-sm ${
                !tag
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
              }`}
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                params.delete('tag');
                window.location.href = `/posts?${params.toString()}`;
              }}
            >
              全部
            </button>
            {tags.map(tagItem => (
              <button
                key={tagItem.id}
                className={`rounded-full px-4 py-2 text-sm ${
                  tag === tagItem.slug
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                }`}
                onClick={() => {
                  const params = new URLSearchParams(window.location.search);
                  params.set('tag', tagItem.slug);
                  window.location.href = `/posts?${params.toString()}`;
                }}
              >
                {tagItem.name}
              </button>
            ))}
          </div>
        </div>

        {/* 文章列表 */}
        <PostList
          posts={posts.posts}
          pagination={posts.pagination}
        />
      </div>

      {/* 侧边栏 */}
      <div className="space-y-6">
        {/* 热门文章 */}
        <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
            热门文章
          </h3>
          <div className="space-y-4">
            {posts.posts.slice(0, 5).map(post => (
              <div key={post.id} className="group cursor-pointer">
                <h4 className="line-clamp-2 text-sm font-medium text-gray-900 group-hover:text-blue-600 dark:text-white">
                  {post.title}
                </h4>
                <p className="mt-1 text-xs text-gray-500">
                  {post.views} 阅读 • {post.commentsCount || 0} 评论
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 标签云 */}
        <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
            标签云
          </h3>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <span
                key={tag.id}
                className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### 文章详情页 (app/posts/[slug]/page.tsx)

```tsx
/**
 * 文章详情页
 */

import { getPostBySlug } from '@/services/post.service';
import { PostContent } from '@/components/posts/post-content';
import { CommentList } from '@/components/posts/comment-list';
import { toggleFavoriteAction, toggleLikeAction } from '@/actions/posts';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  
  if (!post) {
    return {
      title: '文章不存在 - 博客系统',
    };
  }

  return {
    title: `${post.title} - 博客系统`,
    description: post.excerpt || post.content.slice(0, 100),
  };
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  // 获取文章详情
  const post = await getPostBySlug(params.slug);

  if (!post) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            文章不存在
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            您请求的文章不存在或已被删除
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* 主内容 */}
      <div className="lg:col-span-2">
        {/* 文章内容 */}
        <PostContent post={post} />

        {/* 评论区 */}
        <div className="mt-12">
          <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
            评论 ({post.commentsCount || 0})
          </h2>
          <CommentList postId={post.id} />
        </div>
      </div>

      {/* 侧边栏 */}
      <div className="space-y-6">
        {/* 作者信息 */}
        <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
              {post.author.name?.[0] || post.author.username?.[0] || 'U'}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">
                {post.author.name || post.author.username}
              </h3>
              <p className="text-sm text-gray-500">@{post.author.username}</p>
            </div>
          </div>
          {post.author.bio && (
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              {post.author.bio}
            </p>
          )}
          {post.author.website && (
            <a
              href={post.author.website}
              className="mt-2 inline-block text-sm text-blue-600 hover:underline"
            >
              {post.author.website}
            </a>
          )}
        </div>

        {/* 文章操作 */}
        <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
            文章操作
          </h3>
          <div className="space-y-3">
            <button className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              分享文章
            </button>
            <button className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              打赏作者
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### 12. 全局样式

#### 全局样式 (styles/globals.css)

```css
/**
 * 全局样式
 */

@tailwind base;
@tailwind components;
@tailwind utilities;

/* 自定义变量 */
:root {
  --background: #ffffff;
  --foreground: #1a1a1a;
}

/* 暗色模式 */
@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

/* 应用主题变量 */
body {
  color: var(--foreground);
  background: var(--background);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 代码块样式 */
code {
  font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* 暗色模式滚动条 */
.dark ::-webkit-scrollbar-track {
  background: #374151;
}

.dark ::-webkit-scrollbar-thumb {
  background: #6b7280;
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* 禁用选择 */
.noselect {
  user-select: none;
}

/* 链接样式 */
a {
  @apply text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300;
}

/* 图片响应式 */
img {
  @apply max-w-full h-auto;
}
```

---

### 13. 配置文件

#### Next.js配置 (next.config.js)

```javascript
/**
 * Next.js配置
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 图片配置
  images: {
    domains: ['localhost', 'example.com', 'your-cdn.com'],
  },
  
  // 打包优化
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
        },
      };
    }
    return config;
  },
  
  // 安全头
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
      ],
    },
  ],
  
  // 重写规则
  rewrites: async () => [
    {
      source: '/api/:path*',
      destination: 'http://localhost:3000/api/:path*',
    },
  ],
};

module.exports = nextConfig;
```

#### Tailwind CSS配置 (tailwind.config.ts)

```typescript
/**
 * Tailwind CSS配置
 */

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Fira Sans',
          'Droid Sans',
          'Helvetica Neue',
          'sans-serif',
        ],
        mono: [
          'Fira Code',
          'Consolas',
          'Monaco',
          'Courier New',
          'monospace',
        ],
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};

export default config;
```

---

### 14. 环境变量

#### 环境变量 (.env.local)

```env
# 数据库配置
DATABASE_URL="postgresql://username:password@localhost:5432/blog?schema=public"

# NextAuth配置
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key_here

# OAuth配置
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret

# 邮箱配置
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your_email@example.com
EMAIL_SERVER_PASSWORD=your_email_password
EMAIL_FROM=noreply@example.com

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="博客系统"
```

---

### 15. package.json

```json
{
  "name": "nextjs-blog",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "db:seed": "ts-node prisma/seed.ts"
  },
  "dependencies": {
    "@auth/prisma-adapter": "^1.0.6",
    "@prisma/client": "^5.7.0",
    "@tailwindcss/typography": "^0.5.10",
    "date-fns": "^3.0.0",
    "next": "16.0.0",
    "next-auth": "^4.24.5",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-markdown": "^9.0.1",
    "react-syntax-highlighter": "^15.5.0",
    "rehype-raw": "^7.0.0",
    "remark-gfm": "^4.0.0",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/react-syntax-highlighter": "^15.5.11",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "prisma": "^5.7.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.2"
  }
}
```

---

## 最佳实践

### 1. 安全最佳实践

```typescript
// ✅ 正确：使用Server Actions处理表单提交
'use server';
export async function createPostAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('未认证');
  // ...
}

// ❌ 错误：在客户端直接调用API
const response = await fetch('/api/posts', {
  method: 'POST',
  body: JSON.stringify(data),
});
```

### 2. 性能优化

```typescript
// ✅ 正确：使用Next.js Image组件
import Image from 'next/image';

<Image
  src={post.coverImage}
  alt={post.title}
  width={800}
  height={400}
  className="rounded-lg"
/>

// ❌ 错误：使用原生img标签
<img src={post.coverImage} alt={post.title} />
```

### 3. SEO优化

```typescript
// ✅ 正确：使用Next.js metadata
export const metadata = {
  title: '文章标题 - 网站名称',
  description: '文章摘要',
  keywords: ['关键词1', '关键词2'],
  openGraph: {
    title: '文章标题',
    description: '文章摘要',
    images: ['/cover-image.jpg'],
  },
};

// ❌ 错误：不设置metadata
```

### 4. 数据获取优化

```typescript
// ✅ 正确：使用并行查询
const [posts, tags] = await Promise.all([
  getPosts({ page, limit }),
  getTags(),
]);

// ❌ 错误：串行查询
const posts = await getPosts({ page, limit });
const tags = await getTags();
```

---

## 部署指南

### 1. 生产环境配置

```env
# .env.production
DATABASE_URL="postgresql://username:password@host:5432/blog?schema=public"
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=strong_secret_key
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret
```

### 2. Docker部署

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# 安装依赖
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

# 开发依赖
FROM base AS dev-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 构建
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 生产环境
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

---

## 总结

本项目实现了完整的博客系统核心功能：

✅ **文章管理**：CRUD、Markdown渲染、标签、分类  
✅ **评论系统**：评论、回复、点赞  
✅ **收藏功能**：文章收藏  
✅ **用户系统**：NextAuth认证、OAuth登录  
✅ **SEO优化**：元数据、Open Graph  
✅ **响应式设计**：Tailwind CSS  
✅ **类型安全**：TypeScript  
✅ **性能优化**：Next.js优化、Image组件  

项目采用Next.js 16 App Router架构，代码结构清晰，易于维护和扩展。
