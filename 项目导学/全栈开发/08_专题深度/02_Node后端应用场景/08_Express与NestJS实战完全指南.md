# Express与NestJS实战完全指南

## 概述

本文档系统讲解Express与NestJS两大Node.js后端框架的企业级最佳实践。Express作为Node.js最经典的Web框架，提供了最原始但也最灵活的请求处理模式；而NestJS则是现代化的企业级框架，采用模块化架构和依赖注入，提供了与Angular相似的开发体验。

**前置知识要求**：
- 熟练掌握JavaScript/TypeScript
- 理解HTTP协议与RESTful API设计
- 了解关系型数据库基础

---

## 第一部分：Express企业级最佳实践

### 1.1 Express项目结构设计

Express框架本身不强制项目结构，但企业级应用需要清晰的分层架构。以下是经典的洋葱圈架构在Express中的实现：

```
express-project/
├── src/
│   ├── config/              # 配置层
│   │   ├── index.ts          # 配置入口
│   │   ├── database.ts       # 数据库配置
│   │   └── env.ts            # 环境变量
│   ├── controllers/          # 控制器层（处理请求/响应）
│   │   ├── user.controller.ts
│   │   └── article.controller.ts
│   ├── services/             # 服务层（业务逻辑）
│   │   ├── user.service.ts
│   │   └── article.service.ts
│   ├── repositories/         # 仓储层（数据访问）
│   │   ├── user.repository.ts
│   │   └── article.repository.ts
│   ├── models/               # 数据模型
│   │   ├── user.model.ts
│   │   └── article.model.ts
│   ├── middlewares/          # 中间件
│   │   ├── auth.middleware.ts
│   │   ├── logger.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── validation.middleware.ts
│   ├── routes/               # 路由定义
│   │   ├── user.routes.ts
│   │   └── article.routes.ts
│   ├── dto/                  # 数据传输对象
│   │   ├── create-user.dto.ts
│   │   └── update-user.dto.ts
│   ├── utils/                # 工具函数
│   │   └── async-handler.ts
│   ├── types/                # 类型定义
│   │   └── express.d.ts
│   ├── app.ts               # 应用入口
│   └── server.ts             # 服务器启动
├── tests/                    # 测试文件
├── package.json
└── tsconfig.json
```

### 1.2 配置管理系统

#### 环境变量配置模块

```typescript
// src/config/env.ts
// 环境变量配置模块
// 统一管理所有环境变量，支持类型安全的环境变量访问

import dotenv from 'dotenv';
import path from 'path';

// 根据环境加载对应的 .env 文件
const envFile = process.env.NODE_ENV
  ? `.env.${process.env.NODE_ENV}`
  : '.env';

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// 定义配置接口，确保类型安全
interface EnvConfig {
  // 服务器配置
  port: number;
  env: 'development' | 'production' | 'test';

  // 数据库配置
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    name: string;
    // 连接池配置
    pool: {
      min: number;  // 最小连接数
      max: number;  // 最大连接数
    };
  };

  // Redis配置
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };

  // JWT配置
  jwt: {
    secret: string;
    expiresIn: string;      // Token过期时间
    refreshExpiresIn: string; // 刷新Token过期时间
  };

  // 日志配置
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
    format: 'json' | 'simple';
  };
}

// 验证环境变量，确保必填项都已配置
function validateEnv(): void {
  const requiredVars = [
    'PORT',
    'DATABASE_HOST',
    'DATABASE_PORT',
    'DATABASE_USERNAME',
    'DATABASE_PASSWORD',
    'DATABASE_NAME',
    'JWT_SECRET',
  ];

  const missing = requiredVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(`缺少必需的环境变量: ${missing.join(', ')}`);
  }
}

// 获取配置（带默认值）
export const config: Readonly<EnvConfig> = {
  // 服务器配置
  port: parseInt(process.env.PORT || '3000', 10),
  env: (process.env.NODE_ENV as any) || 'development',

  // 数据库配置
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    name: process.env.DATABASE_NAME || 'myapp',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    },
  },

  // Redis配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // 日志配置
  logging: {
    level: (process.env.LOG_LEVEL as any) || 'info',
    format: (process.env.LOG_FORMAT as any) || 'simple',
  },
};

// 验证配置
validateEnv();

export default config;
```

#### 数据库配置模块

```typescript
// src/config/database.ts
// PostgreSQL数据库连接配置
// 使用 pg 库实现连接池管理

import { Pool, PoolConfig, QueryResult } from 'pg';
import config from './env';

// 创建数据库连接池
// 连接池是数据库性能优化的关键：
// - 避免频繁创建/销毁连接的开销
// - 控制最大并发连接数，保护数据库
// - 自动管理连接的生命周期

const poolConfig: PoolConfig = {
  // 连接服务器地址
  host: config.database.host,
  port: config.database.port,
  // 认证信息
  user: config.database.username,
  password: config.database.password,
  database: config.database.name,

  // 连接池大小配置
  min: config.database.pool.min,  // 最小空闲连接数
  max: config.database.pool.max,  // 最大连接数

  // 连接空闲超时（毫秒）
  // 超过此时间的空闲连接会被释放
  idleTimeoutMillis: 30000,

  // 连接超时（毫秒）
  // 连接数据库服务器的最大等待时间
  connectionTimeoutMillis: 2000,

  // 最大生命周期（毫秒）
  // 连接创建后的最大存活时间，到期后会被替换
  max: 1000 * 60 * 30, // 30分钟

  // SSL配置（生产环境必须启用）
  ssl: config.env === 'production'
    ? { rejectUnauthorized: true }
    : false,
};

// 创建全局连接池实例
// 使用单例模式确保整个应用使用同一个连接池
class Database {
  private static instance: Database;
  private pool: Pool;

  // 私有构造函数，防止直接实例化
  private constructor() {
    this.pool = new Pool(poolConfig);

    // 监听连接池错误
    this.pool.on('error', (err) => {
      console.error('数据库连接池意外错误:', err);
    });

    // 监听连接获取事件（调试用）
    this.pool.on('connect', () => {
      console.debug('新数据库连接已建立');
    });
  }

  // 获取单例实例
  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  // 执行查询
  // 返回泛型结果，支持类型推断
  async query<T = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    const start = Date.now();

    try {
      // 从连接池获取连接并执行查询
      const result = await this.pool.query<T>(text, params);

      // 计算查询耗时
      const duration = Date.now() - start;

      // 在开发环境打印慢查询日志
      if (duration > 1000) {
        console.warn(`慢查询警告 (${duration}ms):`, text);
      }

      return result;
    } catch (error) {
      console.error('数据库查询错误:', error);
      throw error;
    }
  }

  // 获取连接（用于事务操作）
  // 事务可以确保多个操作原子执行
  async getConnection() {
    const client = await this.pool.connect();
    return client;
  }

  // 关闭连接池
  // 应用关闭时必须调用，防止连接泄漏
  async close(): Promise<void> {
    await this.pool.end();
    console.log('数据库连接池已关闭');
  }
}

// 导出单例
export const db = Database.getInstance();

// 事务辅助函数
// 使用示例:
// const client = await db.beginTransaction();
// try {
//   await db.query('INSERT INTO users...', [], client);
//   await db.query('INSERT INTO posts...', [], client);
//   await db.commitTransaction(client);
// } catch (e) {
//   await db.rollbackTransaction(client);
// }
export const beginTransaction = async () => {
  const client = await db.getConnection();
  await client.query('BEGIN');
  return client;
};

export const commitTransaction = async (client: any) => {
  await client.query('COMMIT');
  client.release();
};

export const rollbackTransaction = async (client: any) => {
  await client.query('ROLLBACK');
  client.release();
};

export default db;
```

### 1.3 中间件设计

中间件是Express最核心的概念，它形成了请求处理链。以下是企业级Express应用的中间件体系：

#### 日志中间件

```typescript
// src/middlewares/logger.middleware.ts
// HTTP日志中间件
// 记录所有HTTP请求的详细信息，用于调试和监控

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// 扩展Request对象，添加请求ID
declare global {
  namespace Express {
    interface Request {
      // 唯一请求ID，用于追踪请求链路
      id: string;
      // 请求开始时间
      startTime: number;
    }
  }
}

// 日志级别枚举
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// 日志级别配置
const currentLevel = process.env.LOG_LEVEL === 'debug'
  ? LogLevel.DEBUG
  : process.env.LOG_LEVEL === 'warn'
    ? LogLevel.WARN
    : LogLevel.INFO;

// 日志辅助函数
function log(level: LogLevel, message: string, meta?: object): void {
  if (level >= currentLevel) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logMessage, meta || '');
        break;
      case LogLevel.INFO:
        console.info(logMessage, meta || '');
        break;
      case LogLevel.WARN:
        console.warn(logMessage, meta || '');
        break;
      case LogLevel.ERROR:
        console.error(logMessage, meta || '');
        break;
    }
  }
}

/**
 * 请求日志中间件
 * 在请求开始时记录开始时间，在响应结束时计算耗时
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // 生成唯一请求ID
  req.id = req.headers['x-request-id'] as string || uuidv4();

  // 记录请求开始时间
  req.startTime = Date.now();

  // 添加请求ID到响应头，方便客户端追踪
  res.setHeader('X-Request-ID', req.id);

  // 记录请求信息
  log(LogLevel.INFO, '--> 请求开始', {
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    ip: req.ip,
    requestId: req.id,
    userAgent: req.headers['user-agent'],
  });

  // 监听响应结束事件
  res.on('finish', () => {
    // 计算请求处理耗时
    const duration = Date.now() - req.startTime;

    // 根据状态码选择日志级别
    const level = res.statusCode >= 500
      ? LogLevel.ERROR
      : res.statusCode >= 400
        ? LogLevel.WARN
        : LogLevel.INFO;

    // 记录响应信息
    log(level, '<-- 请求结束', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      requestId: req.id,
    });
  });

  next();
}

/**
 * 性能监控中间件
 * 标记慢请求并记录警告
 */
export function performanceMonitor(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const threshold = 1000; // 慢请求阈值（毫秒）

  res.on('finish', () => {
    const duration = Date.now() - req.startTime;

    if (duration > threshold) {
      log(LogLevel.WARN, '慢请求警告', {
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
        threshold: `${threshold}ms`,
        requestId: req.id,
      });
    }
  });

  next();
}

/**
 * 请求验证中间件
 * 验证必填头信息
 */
export function validateHeaders(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // 检查Content-Type（对于POST/PUT/PATCH请求）
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];

    if (!contentType || !contentType.includes('application/json')) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Content-Type must be application/json',
        requestId: req.id,
      });
      return;
    }
  }

  next();
}

export default requestLogger;
```

#### 认证中间件

```typescript
// src/middlewares/auth.middleware.ts
// JWT认证中间件
// 验证请求头中的JWT Token，解析用户信息

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/env';

// 扩展Express Request类型
declare global {
  namespace Express {
    interface Request {
      // 已认证的用户信息
      user?: {
        id: string;
        email: string;
        role: string;
        tokenId: string;
      };
    }
  }
}

// JWT负载类型定义
interface JwtPayload {
  sub: string;      // 用户ID
  email: string;     // 用户邮箱
  role: string;      // 用户角色
  tokenId: string;   // Token唯一ID（用于Token吊销）
  iat: number;        // 签发时间
  exp: number;        // 过期时间
}

// Token黑名单（生产环境应使用Redis存储）
const tokenBlacklist = new Set<string>();

/**
 * 认证中间件
 * 验证Bearer Token并挂载用户信息到req.user
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // 从Authorization头提取Token
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: '未提供认证令牌',
        requestId: req.id,
      });
      return;
    }

    // 解析Bearer Token格式
    // 格式: "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: '令牌格式错误，应为: Bearer <token>',
        requestId: req.id,
      });
      return;
    }

    const token = parts[1];

    // 检查Token是否在黑名单中（已吊销的Token）
    if (tokenBlacklist.has(token)) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: '令牌已失效',
        requestId: req.id,
      });
      return;
    }

    // 验证并解码Token
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // 挂载用户信息到请求对象
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      tokenId: decoded.tokenId,
    };

    next();
  } catch (error) {
    // 处理Token过期
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: '令牌已过期，请重新登录',
        requestId: req.id,
      });
      return;
    }

    // 处理无效Token
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: '无效的令牌',
        requestId: req.id,
      });
      return;
    }

    // 其他错误
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: '认证过程中发生错误',
      requestId: req.id,
    });
  }
}

/**
 * 角色授权中间件工厂
 * 创建检查用户角色的中间件
 *
 * @param allowedRoles 允许访问的角色列表
 */
export function authorize(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // 先确保用户已认证
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: '需要登录后才能访问',
        requestId: req.id,
      });
      return;
    }

    // 检查用户角色是否在允许列表中
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '权限不足，无法访问此资源',
        requestId: req.id,
      });
      return;
    }

    next();
  };
}

/**
 * 吊销Token的辅助函数
 * 将Token添加到黑名单
 */
export function revokeToken(token: string): void {
  tokenBlacklist.add(token);
}

/**
 * 清除用户所有Token（登出所有设备）
 * 生产环境中需要按用户ID清除所有相关Token
 */
export function revokeAllUserTokens(userId: string): void {
  // 在生产环境中，应该在Redis中按用户ID删除所有Token
  // 这里只是一个示例实现
  console.log(`Revoking all tokens for user: ${userId}`);
}

export default { authenticate, authorize, revokeToken };
```

#### 错误处理中间件

```typescript
// src/middlewares/error.middleware.ts
// 全局错误处理中间件
// 统一捕获和处理所有未处理的错误

import { Request, Response, NextFunction } from 'express';

// 自定义应用错误类
// 支持HTTP状态码和业务错误码
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode: string;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = 'INTERNAL_ERROR',
    details?: any
  ) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = true;  // 操作性错误 vs 编程错误
    this.errorCode = errorCode;
    this.details = details;

    // 捕获错误堆栈
    Error.captureStackTrace(this, this.constructor);
  }
}

// 预定义的应用错误类型
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

// 异步处理辅助函数
// 包装async路由处理器，自动捕获Promise错误
export const asyncHandler = <
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any
>(
  fn: (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response,
    next: NextFunction
  ) => Promise<any>
) => {
  return (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response,
    next: NextFunction
  ) => {
    // 使用Promise.resolve确保即使fn返回非Promise也会被正确处理
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 全局错误处理中间件
 * 必须注册在所有路由之后
 */
export function globalErrorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // 记录错误日志
  console.error('=== 错误信息 ===');
  console.error(`请求ID: ${req.id}`);
  console.error(`请求路径: ${req.method} ${req.url}`);
  console.error(`错误消息: ${err.message}`);
  console.error(`错误堆栈: ${err.stack}`);

  // 处理自定义应用错误
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.errorCode,
      message: err.message,
      details: err.details,
      requestId: req.id,
    });
    return;
  }

  // 处理JSON解析错误
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      error: 'PARSE_ERROR',
      message: '无效的JSON格式',
      requestId: req.id,
    });
    return;
  }

  // 处理验证错误（如Joi验证失败）
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: err.message,
      requestId: req.id,
    });
    return;
  }

  // 处理未知错误（生产环境不暴露详情）
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: isProduction
      ? '服务器内部错误，请稍后重试'
      : err.message,
    requestId: req.id,
    // 仅在开发环境返回堆栈信息
    stack: isProduction ? undefined : err.stack,
  });
}

/**
 * 404处理中间件
 * 处理所有未匹配的路由
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `路由 ${req.method} ${req.url} 不存在`,
    requestId: req.id,
  });
}

export default {
  AppError,
  asyncHandler,
  globalErrorHandler,
  notFoundHandler,
};
```

### 1.4 验证层设计

使用Joi进行请求体验证：

```typescript
// src/middlewares/validation.middleware.ts
// 请求数据验证中间件
// 使用Joi进行运行时类型验证

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

// 验证错误格式化函数
function formatValidationErrors(error: Joi.ValidationError): object {
  const errors: Record<string, string[]> = {};

  error.details.forEach((detail) => {
    const key = detail.path.join('.');
    if (!errors[key]) {
      errors[key] = [];
    }
    errors[key].push(detail.message);
  });

  return errors;
}

/**
 * 验证中间件工厂函数
 * 创建验证特定数据结构的中间件
 *
 * @param schema Joi验证模式
 * @param property 要验证的请求属性（body/query/params）
 */
export function validate(
  schema: Joi.ObjectSchema,
  property: 'body' | 'query' | 'params' = 'body'
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // 执行验证
    const { error, value } = schema.validate(req[property], {
      // 在第一条错误时就停止验证
      abortEarly: false,
      // 去除未定义的属性
      stripUnknown: true,
      // 将错误消息转换为中文
      messages: {
        'string.base': '{{#label}} 必须是字符串',
        'string.min': '{{#label}} 长度不能少于 {{#limit}} 个字符',
        'string.max': '{{#label}} 长度不能超过 {{#limit}} 个字符',
        'string.email': '{{#label}} 必须是有效的邮箱地址',
        'string.pattern.base': '{{#label}} 格式不正确',
        'number.base': '{{#label}} 必须是数字',
        'number.min': '{{#label}} 不能小于 {{#limit}}',
        'number.max': '{{#label}} 不能大于 {{#limit}}',
        'any.required': '{{#label}} 是必填字段',
        'any.only': '{{#label}} 的值不在允许列表中',
        'array.base': '{{#label}} 必须是数组',
        'array.min': '{{#label}} 至少需要 {{#limit}} 个元素',
        'array.max': '{{#label}} 最多只能有 {{#limit}} 个元素',
        'date.base': '{{#label}} 必须是有效的日期',
        'date.format': '{{#label}} 日期格式不正确',
        'uuid.base': '{{#label}} 必须是有效的UUID格式',
      },
    });

    if (error) {
      // 验证失败
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: '请求参数验证失败',
        validationErrors: formatValidationErrors(error),
        requestId: req.id,
      });
      return;
    }

    // 验证成功，用验证后的值替换原请求数据
    // 这样可以确保后续处理器收到的数据是经过清理的
    req[property] = value;
    next();
  };
}

// ============ 常用验证模式 ============

// 用户创建DTO
export const createUserSchema = Joi.object({
  // 用户名：必填，3-30个字符
  username: Joi.string()
    .min(3)
    .max(30)
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .required()
    .messages({
      'string.pattern.base': '用户名只能包含字母、数字、下划线和连字符',
    }),

  // 邮箱：必填，有效邮箱格式
  email: Joi.string()
    .email()
    .required(),

  // 密码：必填，最少8个字符，包含大小写字母和数字
  password: Joi.string()
    .min(8)
    .max(100)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.pattern.base': '密码必须包含大小写字母和数字',
    }),

  // 昵称：可选
  nickname: Joi.string()
    .max(50)
    .optional(),

  // 角色：可选，默认普通用户
  role: Joi.string()
    .valid('user', 'admin', 'editor')
    .default('user'),
});

// 用户更新DTO
export const updateUserSchema = Joi.object({
  nickname: Joi.string()
    .max(50)
    .optional(),

  avatar: Joi.string()
    .uri()
    .optional()
    .messages({
      'string.uri': '头像必须是有效的URL',
    }),

  bio: Joi.string()
    .max(500)
    .optional(),
}).min(1).messages({
  '.min': '至少需要提供一个要更新的字段',
});

// 文章创建DTO
export const createArticleSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(200)
    .required()
    .messages({
      'string.min': '文章标题不能为空',
      'string.max': '文章标题不能超过200个字符',
    }),

  content: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.min': '文章内容不能为空',
    }),

  summary: Joi.string()
    .max(500)
    .optional(),

  coverImage: Joi.string()
    .uri()
    .optional()
    .messages({
      'string.uri': '封面图必须是有效的URL',
    }),

  tags: Joi.array()
    .items(Joi.string().max(20))
    .max(10)
    .optional()
    .messages({
      'array.max': '最多只能添加10个标签',
    }),

  published: Joi.boolean()
    .default(false),
});

// 分页查询DTO
export const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.min': '页码必须大于0',
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.min': '每页数量必须大于0',
      'number.max': '每页数量不能超过100',
    }),

  sort: Joi.string()
    .pattern(/^[a-zA-Z_]+:(asc|desc)$/)
    .optional()
    .messages({
      'string.pattern.base': '排序格式应为 field:direction，如 createdAt:desc',
    }),
});

export default { validate };
```

### 1.5 RESTful API实战：构建用户管理服务

以下是一个完整的Express RESTful API实现，包括完整的项目结构、控制器、服务层和仓储层：

```typescript
// src/repositories/user.repository.ts
// 用户数据访问层
// 封装所有用户相关的数据库操作

import { db } from '../config/database';
import { User, UserRole } from '../models/user.model';

/**
 * 用户仓储接口
 * 定义用户数据的CRUD操作
 */
export interface UserRepository {
  // 根据ID查找用户
  findById(id: string): Promise<User | null>;
  // 根据邮箱查找用户
  findByEmail(email: string): Promise<User | null>;
  // 根据用户名查找用户
  findByUsername(username: string): Promise<User | null>;
  // 创建用户
  create(user: Partial<User>): Promise<User>;
  // 更新用户
  update(id: string, data: Partial<User>): Promise<User | null>;
  // 删除用户
  delete(id: string): Promise<boolean>;
  // 分页查找用户
  findPaginated(page: number, limit: number): Promise<{ users: User[]; total: number }>;
  // 批量查找
  findByIds(ids: string[]): Promise<User[]>;
}

/**
 * PostgreSQL实现的用户仓储
 */
export class PostgresUserRepository implements UserRepository {

  /**
   * 根据ID查找用户
   * @param id 用户UUID
   */
  async findById(id: string): Promise<User | null> {
    const result = await db.query<User>(
      `SELECT id, username, email, nickname, avatar, bio, role,
              created_at, updated_at, last_login_at
       FROM users
       WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * 根据邮箱查找用户（用于登录）
   * @param email 用户邮箱
   */
  async findByEmail(email: string): Promise<User | null> {
    const result = await db.query<User>(
      `SELECT id, username, email, password_hash, nickname, avatar, bio, role,
              created_at, updated_at, last_login_at
       FROM users
       WHERE email = $1 AND deleted_at IS NULL`,
      [email]
    );
    return result.rows[0] || null;
  }

  /**
   * 根据用户名查找用户
   * @param username 用户名
   */
  async findByUsername(username: string): Promise<User | null> {
    const result = await db.query<User>(
      `SELECT id, username, email, nickname, avatar, bio, role,
              created_at, updated_at, last_login_at
       FROM users
       WHERE username = $1 AND deleted_at IS NULL`,
      [username]
    );
    return result.rows[0] || null;
  }

  /**
   * 创建新用户
   * @param user 用户数据（不含密码）
   */
  async create(user: Partial<User>): Promise<User> {
    const result = await db.query<User>(
      `INSERT INTO users (username, email, password_hash, nickname, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, nickname, avatar, bio, role,
                 created_at, updated_at`,
      [
        user.username,
        user.email,
        user.passwordHash, // 实际应用中应该是加密后的密码
        user.nickname,
        user.role || UserRole.USER,
      ]
    );
    return result.rows[0];
  }

  /**
   * 更新用户信息
   * @param id 用户ID
   * @param data 要更新的字段
   */
  async update(id: string, data: Partial<User>): Promise<User | null> {
    // 构建动态更新查询
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // 只能更新允许的字段
    const allowedFields = ['nickname', 'avatar', 'bio', 'role'];
    for (const field of allowedFields) {
      if (field in data) {
        updates.push(`${field} = $${paramIndex}`);
        values.push((data as any)[field]);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    // 添加更新时间
    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await db.query<User>(
      `UPDATE users
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND deleted_at IS NULL
       RETURNING id, username, email, nickname, avatar, bio, role,
                 created_at, updated_at`,
      values
    );

    return result.rows[0] || null;
  }

  /**
   * 软删除用户（不真正删除，保留数据）
   * @param id 用户ID
   */
  async delete(id: string): Promise<boolean> {
    const result = await db.query(
      `UPDATE users
       SET deleted_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * 分页查询用户
   * @param page 页码（从1开始）
   * @param limit 每页数量
   */
  async findPaginated(
    page: number,
    limit: number
  ): Promise<{ users: User[]; total: number }> {
    const offset = (page - 1) * limit;

    // 并行执行计数查询和数据查询
    const [countResult, usersResult] = await Promise.all([
      db.query<{ count: string }>(
        'SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL'
      ),
      db.query<User>(
        `SELECT id, username, email, nickname, avatar, bio, role,
                created_at, updated_at, last_login_at
         FROM users
         WHERE deleted_at IS NULL
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
    ]);

    return {
      users: usersResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  /**
   * 批量查找用户
   * @param ids 用户ID数组
   */
  async findByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];

    const result = await db.query<User>(
      `SELECT id, username, email, nickname, avatar, bio, role,
              created_at, updated_at, last_login_at
       FROM users
       WHERE id = ANY($1) AND deleted_at IS NULL`,
      [ids]
    );
    return result.rows;
  }
}

// 导出仓储实例
export const userRepository = new PostgresUserRepository();
```

```typescript
// src/services/user.service.ts
// 用户服务层
// 封装用户相关业务逻辑

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../config/env';
import { User, UserRole } from '../models/user.model';
import { userRepository, UserRepository } from '../repositories/user.repository';
import {
  AppError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
} from '../middlewares/error.middleware';

// SALT轮数（越高越安全但越慢）
const BCRYPT_SALT_ROUNDS = 12;

/**
 * 用户服务接口
 * 定义用户相关的业务操作
 */
export interface UserService {
  // 用户注册
  register(data: {
    username: string;
    email: string;
    password: string;
    nickname?: string;
  }): Promise<{ user: Omit<User, 'passwordHash'>; token: string }>;

  // 用户登录
  login(
    email: string,
    password: string
  ): Promise<{ user: Omit<User, 'passwordHash'>; token: string }>;

  // 获取用户信息
  getUserById(id: string): Promise<Omit<User, 'passwordHash'>>;

  // 更新用户信息
  updateUser(
    id: string,
    data: { nickname?: string; avatar?: string; bio?: string }
  ): Promise<Omit<User, 'passwordHash'>>;

  // 删除用户
  deleteUser(id: string): Promise<void>;

  // 分页获取用户列表
  getUsers(
    page: number,
    limit: number
  ): Promise<{ users: Omit<User, 'passwordHash'>[]; total: number; page: number }>;

  // 刷新Token
  refreshToken(oldToken: string): string;
}

/**
 * 用户服务实现
 */
export class UserServiceImpl implements UserService {

  /**
   * 用户注册
   * 1. 验证用户名和邮箱是否已存在
   * 2. 加密密码
   * 3. 创建用户记录
   * 4. 生成JWT Token
   */
  async register(data: {
    username: string;
    email: string;
    password: string;
    nickname?: string;
  }): Promise<{ user: Omit<User, 'passwordHash'>; token: string }> {

    // 检查用户名是否已存在
    const existingUsername = await userRepository.findByUsername(data.username);
    if (existingUsername) {
      throw new ConflictError('用户名已被使用');
    }

    // 检查邮箱是否已存在
    const existingEmail = await userRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new ConflictError('邮箱已被注册');
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS);

    // 创建用户
    const user = await userRepository.create({
      username: data.username,
      email: data.email,
      passwordHash,
      nickname: data.nickname || data.username,
      role: UserRole.USER,
    });

    // 生成Token
    const token = this.generateToken(user);

    // 返回用户信息（不含密码）和Token
    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  /**
   * 用户登录
   * 1. 根据邮箱查找用户
   * 2. 验证密码
   * 3. 更新最后登录时间
   * 4. 生成Token
   */
  async login(
    email: string,
    password: string
  ): Promise<{ user: Omit<User, 'passwordHash'>; token: string }> {

    // 查找用户
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('邮箱或密码错误');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('邮箱或密码错误');
    }

    // 更新最后登录时间
    await userRepository.update(user.id, {});

    // 生成Token
    const token = this.generateToken(user);

    // 返回用户信息（不含密码）和Token
    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  /**
   * 获取用户信息
   */
  async getUserById(id: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('用户');
    }
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * 更新用户信息
   */
  async updateUser(
    id: string,
    data: { nickname?: string; avatar?: string; bio?: string }
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await userRepository.update(id, data);
    if (!user) {
      throw new NotFoundError('用户');
    }
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * 删除用户（软删除）
   */
  async deleteUser(id: string): Promise<void> {
    const deleted = await userRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError('用户');
    }
  }

  /**
   * 分页获取用户列表
   */
  async getUsers(
    page: number,
    limit: number
  ): Promise<{ users: Omit<User, 'passwordHash'>[]; total: number; page: number }> {
    const { users, total } = await userRepository.findPaginated(page, limit);

    // 移除密码字段
    const usersWithoutPassword = users.map(({ passwordHash: _, ...user }) => user);

    return { users: usersWithoutPassword, total, page };
  }

  /**
   * 刷新Token
   * 验证旧Token并颁发新Token
   */
  async refreshToken(oldToken: string): Promise<string> {
    try {
      // 验证旧Token（但不检查过期）
      const decoded = jwt.verify(oldToken, config.jwt.secret, {
        ignoreExpiration: true,
      }) as any;

      // 查找用户
      const user = await userRepository.findById(decoded.sub);
      if (!user) {
        throw new UnauthorizedError('用户不存在');
      }

      // 生成新Token
      return this.generateToken(user);
    } catch {
      throw new UnauthorizedError('无效的Token');
    }
  }

  /**
   * 生成JWT Token
   */
  private generateToken(user: User): string {
    const tokenId = crypto.randomUUID();

    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        tokenId,
      },
      config.jwt.secret,
      {
        expiresIn: config.jwt.expiresIn,
      }
    );
  }
}

// 导出服务实例
export const userService = new UserServiceImpl();
```

```typescript
// src/controllers/user.controller.ts
// 用户控制器
// 处理HTTP请求/响应，将请求委托给服务层

import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { asyncHandler } from '../middlewares/error.middleware';
import { paginationSchema } from '../middlewares/validation.middleware';

/**
 * 用户控制器类
 * 所有用户相关的HTTP请求处理
 */
export class UserController {

  /**
   * POST /users/register
   * 用户注册
   */
  register = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { username, email, password, nickname } = req.body;

      const result = await userService.register({
        username,
        email,
        password,
        nickname,
      });

      // 返回201 Created
      res.status(201).json({
        success: true,
        data: result.user,
        token: result.token,
        message: '注册成功',
      });
    }
  );

  /**
   * POST /users/login
   * 用户登录
   */
  login = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { email, password } = req.body;

      const result = await userService.login(email, password);

      res.status(200).json({
        success: true,
        data: result.user,
        token: result.token,
        message: '登录成功',
      });
    }
  );

  /**
   * GET /users
   * 获取用户列表（需要管理员权限）
   */
  getUsers = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      // 从查询参数获取分页信息
      const { page = 1, limit = 20 } = req.query as any;

      const result = await userService.getUsers(
        parseInt(page, 10),
        parseInt(limit, 10)
      );

      res.status(200).json({
        success: true,
        data: result.users,
        pagination: {
          page: result.page,
          limit: parseInt(limit, 10),
          total: result.total,
          totalPages: Math.ceil(result.total / parseInt(limit, 10)),
        },
      });
    }
  );

  /**
   * GET /users/:id
   * 获取单个用户信息
   */
  getUserById = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;

      const user = await userService.getUserById(id);

      res.status(200).json({
        success: true,
        data: user,
      });
    }
  );

  /**
   * PATCH /users/:id
   * 更新用户信息（只能更新自己的信息）
   */
  updateUser = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;
      const { nickname, avatar, bio } = req.body;

      // 确保用户只能更新自己的信息
      if (req.user?.id !== id && req.user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: '只能更新自己的用户信息',
        });
        return;
      }

      const user = await userService.updateUser(id, { nickname, avatar, bio });

      res.status(200).json({
        success: true,
        data: user,
        message: '更新成功',
      });
    }
  );

  /**
   * DELETE /users/:id
   * 删除用户（只能删除自己）
   */
  deleteUser = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id } = req.params;

      // 确保用户只能删除自己
      if (req.user?.id !== id && req.user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: '只能删除自己的账户',
        });
        return;
      }

      await userService.deleteUser(id);

      res.status(200).json({
        success: true,
        message: '账户已删除',
      });
    }
  );

  /**
   * POST /users/refresh-token
   * 刷新Token
   */
  refreshToken = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1];

      if (!token) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: '未提供Token',
        });
        return;
      }

      const newToken = await userService.refreshToken(token);

      res.status(200).json({
        success: true,
        token: newToken,
      });
    }
  );
}

// 导出控制器实例
export const userController = new UserController();
```

```typescript
// src/routes/user.routes.ts
// 用户路由定义
// 将HTTP方法绑定到控制器方法

import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate, createUserSchema, paginationSchema } from '../middlewares/validation.middleware';

const router = Router();

/**
 * 用户路由配置
 *
 * 公开路由：
 * - POST /users/register - 用户注册
 * - POST /users/login - 用户登录
 * - POST /users/refresh-token - 刷新Token
 *
 * 需要认证的路由：
 * - GET /users - 获取用户列表（仅管理员）
 * - GET /users/:id - 获取用户详情
 * - PATCH /users/:id - 更新用户信息
 * - DELETE /users/:id - 删除用户
 */

// 用户注册（公开）
router.post(
  '/register',
  validate(createUserSchema),
  userController.register
);

// 用户登录（公开）
router.post(
  '/login',
  validate(createUserSchema.pick(['email', 'password'])),
  userController.login
);

// 刷新Token（公开）
router.post(
  '/refresh-token',
  userController.refreshToken
);

// 获取当前用户信息（需要认证）
router.get(
  '/me',
  authenticate,
  async (req, res) => {
    const user = await userController.getUserById(req, res);
  }
);

// 获取用户列表（需要管理员权限）
router.get(
  '/',
  authenticate,
  authorize('admin'),
  validate(paginationSchema, 'query'),
  userController.getUsers
);

// 获取单个用户详情
router.get(
  '/:id',
  authenticate,
  userController.getUserById
);

// 更新用户信息
router.patch(
  '/:id',
  authenticate,
  validate(createUserSchema.pick(['nickname', 'avatar', 'bio'])),
  userController.updateUser
);

// 删除用户
router.delete(
  '/:id',
  authenticate,
  userController.deleteUser
);

export default router;
```

```typescript
// src/app.ts
// Express应用入口
// 组装所有中间件和路由

import express, { Application } from 'express';
import config from './config/env';
import { requestLogger, performanceMonitor } from './middlewares/logger.middleware';
import { authenticate } from './middlewares/auth.middleware';
import { globalErrorHandler, notFoundHandler } from './middlewares/error.middleware';
import userRoutes from './routes/user.routes';

export function createApp(): Application {
  const app = express();

  // ============ 基础中间件 ============

  // 解析JSON请求体
  app.use(express.json({ limit: '10mb' }));

  // 解析URL编码的请求体
  app.use(express.urlencoded({ extended: true }));

  // 解析text/plain请求体
  app.use(express.text());

  // ============ 日志与监控中间件 ============

  // HTTP请求日志
  app.use(requestLogger);

  // 性能监控
  app.use(performanceMonitor);

  // ============ 安全中间件 ============

  // CORS配置
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');

    // 处理preflight请求
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }

    next();
  });

  // Helmet安全头
  app.use((req, res, next) => {
    // 防止XSS
    res.header('X-XSS-Protection', '1; mode=block');
    // 防止点击劫持
    res.header('X-Frame-Options', 'DENY');
    // 防止MIME类型嗅探
    res.header('X-Content-Type-Options', 'nosniff');
    // 引用策略
    res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // ============ API路由 ============

  // 健康检查端点
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // API版本信息
  app.get('/api/v1', (req, res) => {
    res.json({
      version: '1.0.0',
      name: 'My Express API',
      description: 'Express企业级最佳实践API',
    });
  });

  // 用户相关路由
  app.use('/api/v1/users', userRoutes);

  // ============ 错误处理 ============

  // 404处理（必须在路由之后）
  app.use(notFoundHandler);

  // 全局错误处理（必须在最后）
  app.use(globalErrorHandler);

  return app;
}

export default createApp;
```

```typescript
// src/server.ts
// 服务器启动入口

import { createApp } from './app';
import config from './config/env';
import { db } from './config/database';

async function bootstrap(): Promise<void> {
  try {
    // 测试数据库连接
    console.log('正在连接数据库...');
    await db.query('SELECT 1');
    console.log('数据库连接成功');

    // 创建Express应用
    const app = createApp();

    // 启动服务器
    app.listen(config.port, () => {
      console.log(`
========================================
  服务器启动成功！
========================================
  环境: ${config.env}
  端口: ${config.port}
  地址: http://localhost:${config.port}
========================================
      `);
    });

    // 优雅关闭处理
    process.on('SIGTERM', async () => {
      console.log('收到SIGTERM信号，开始优雅关闭...');
      await db.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('收到SIGINT信号，开始优雅关闭...');
      await db.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

bootstrap();
```

---

## 第二部分：NestJS框架深入

### 2.1 NestJS核心概念解析

NestJS是一个用于构建高效、可扩展的Node.js服务器端应用程序的框架。它使用TypeScript作为开发语言，结合了OOP（面向对象编程）、FP（函数式编程）和FRP（函数式响应式编程）的元素。

**NestJS与Express的关系**：
- NestJS构建在Express之上，提供了更高级的抽象
- 可以替换底层HTTP框架（如使用Fastify）
- 保留了Express的所有功能

### 2.2 模块化架构

NestJS的核心理念是模块化。每个应用至少有一个根模块（AppModule），但企业级应用通常有多个功能模块。

```typescript
// src/app.module.ts
// 应用根模块
// 整个应用的入口模块，负责组织和连接所有功能模块

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DocumentsModule } from './documents/documents.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CommentsModule } from './comments/comments.module';

// 实体列表 - 告诉TypeORM需要管理哪些实体
const entities = [
  User,
  DocumentEntity,
  BlockEntity,
  CommentEntity,
  ProjectEntity,
  // ...其他实体
];

/**
 * TypeORM配置
 * 支持多种数据库类型：
 * - postgres: PostgreSQL生产环境
 * - sqljs: 内存数据库（开发/测试）
 */
const typeOrmConfig = {
  // 根据环境选择数据库类型
  type: 'postgres' as const,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities,
  // 开发环境自动同步schema（生产环境应使用迁移）
  synchronize: process.env.NODE_ENV !== 'production',
  // 日志配置
  logging: process.env.NODE_ENV === 'development',
};

/**
 * 根模块
 *
 * 模块是NestJS的基本组织单元，它将相关的控制器和服务归类在一起。
 * 使用@Module()装饰器标记的类就是模块。
 */
@Module({
  // 导入其他模块，使当前模块可以使用其他模块导出的内容
  imports: [
    // ConfigModule全局配置
    // isGlobal: true 使配置在整个应用中可用，无需重复导入
    ConfigModule.forRoot({
      isGlobal: true,
      // 加载环境变量文件
      envFilePath: ['.env.production', '.env.local', '.env'],
    }),

    // TypeORM模块配置
    TypeOrmModule.forRoot(typeOrmConfig),

    // 功能模块
    // 每个模块负责一个功能域
    DocumentsModule,  // 文档管理
    AuthModule,       // 认证授权
    UsersModule,      // 用户管理
    CommentsModule,   // 评论管理
  ],

  // 声明控制器，这些控制器属于根模块
  controllers: [AppController],

  // 声明服务，这些服务属于根模块
  // AppService提供应用级的基础功能
  providers: [AppService],
})
export class AppModule {}
```

### 2.3 依赖注入原理与实现

NestJS使用依赖注入（DI）来管理组件之间的依赖关系。这是通过IoC（控制反转）容器实现的。

#### 依赖注入的核心概念

**1. 提供者（Provider）**
```typescript
// 提供者是任何可被注入的东西
// 常见类型：Service、Repository、Factory、Value

// 标准Service提供者
@Injectable()
class DocumentsService {
  constructor(
    // 构造函数注入
    // NestJS会自动解析并注入依赖
    @InjectRepository(DocumentEntity)
    private readonly docRepo: Repository<DocumentEntity>,
    private readonly cacheService: CacheService,
  ) {}

  async findAll() {
    return this.docRepo.find();
  }
}
```

**2. 注入令牌（Injection Token）**
```typescript
// 用于标识要注入的依赖

// 方式1：使用类作为令牌（自动推断类型）
constructor(private readonly userService: UsersService) {}

// 方式2：使用字符串令牌
const MY_SERVICE_TOKEN = 'MY_SERVICE';
@Injectable()
class MyService {}

// 方式3：使用Symbol令牌
const MY_SYMBOL_TOKEN = Symbol('MY_SERVICE');

// 方式4：使用@Inject()装饰器 + OpaqueToken
constructor(@Inject(MY_SERVICE_TOKEN) private readonly myService: any) {}
```

**3. 模块间的依赖关系**
```typescript
// src/documents/documents.module.ts
// 文档模块

@Module({
  imports: [
    // 导入TypeORM实体模块，使本模块可以使用Repository
    TypeOrmModule.forFeature([DocumentEntity, BlockEntity]),

    // 导入其他模块
    // 这使得本模块可以访问被导入模块导出的提供者
    CommentsModule,
  ],

  controllers: [DocumentsController],

  // 声明本模块导出的服务
  // 导出的服务可以被其他导入本模块的模块使用
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
```

### 2.4 装饰器完整指南

NestJS大量使用TypeScript装饰器来实现各种功能。以下是完整的装饰器使用指南：

#### 2.4.1 类装饰器

```typescript
// @Module() - 定义模块
@Module({
  imports: [...],
  controllers: [...],
  providers: [...],
  exports: [...],
})
export class MyModule {}

// @Global() - 将模块设为全局模块
// 全局模块的所有提供者在整个应用中可见
@Global()
@Module({
  providers: [GlobalService],
  exports: [GlobalService],
})
export class GlobalModule {}

// @Injectable() - 标记类为可注入的服务
@Injectable()
class MyService {
  // 服务逻辑
}
```

#### 2.4.2 方法装饰器

```typescript
// @Body() - 获取请求体
@Post()
create(@Body() createDto: CreateDto) {}

// @Param() - 获取路由参数
@Get(':id')
findOne(@Param('id') id: string) {}

// @Query() - 获取查询参数
@Get()
findAll(@Query('page') page: number) {}

// @Headers() - 获取请求头
@Get()
findAll(@Headers('authorization') auth: string) {}

// @Request() / @Req() - 获取原生请求对象
@Get()
findAll(@Req() req: Request) {}

// @Response() / @Res() - 获取原生响应对象
@Get()
findAll(@Res() res: Response) {}

// @Next() - 获取next函数
@Get()
findAll(@Next() next: NextFunction) {}

// @Ip() - 获取客户端IP
@Get()
findAll(@Ip() ip: string) {}

// @Session() - 获取会话对象
@Get()
findAll(@Session() session: any) {}

// @HostParam() - 获取主机参数
@Get()
findAll(@HostParam('account') account: string) {}
```

#### 2.4.3 控制器装饰器

```typescript
// @Controller() - 定义控制器路径
@Controller('documents')
export class DocumentsController {}

// @Version() - 定义API版本
@Controller({ version: '1' })
export class DocumentsController {}

// @UseGuards() - 应用守卫
@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {}

// @UseInterceptors() - 应用拦截器
@Controller('documents')
@UseInterceptors(LoggingInterceptor, TransformInterceptor)
export class DocumentsController {}

// @UsePipes() - 应用管道
@Controller('documents')
@UsePipes(new ValidationPipe({ transform: true }))
export class DocumentsController {}

// @UseFilters() - 应用异常过滤器
@Controller('documents')
@UseFilters(HttpExceptionFilter)
export class DocumentsController {}
```

#### 2.4.4 HTTP方法装饰器

```typescript
// @Get() - GET请求
@Get()
findAll() {}

// @Post() - POST请求
@Post()
create() {}

// @Put() - PUT请求（完整更新）
@Put(':id')
update() {}

// @Patch() - PATCH请求（部分更新）
@Patch(':id')
updatePartial() {}

// @Delete() - DELETE请求
@Delete(':id')
remove() {}

// @Options() - OPTIONS请求
// @Head() - HEAD请求
// @All() - 处理所有HTTP方法
```

#### 2.4.5 自定义装饰器

```typescript
// src/common/decorators/current-user.decorator.ts
// 获取当前登录用户

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 获取当前用户装饰器
 * 从请求对象中提取已认证的用户信息
 *
 * 使用方式：
 * @Get('me')
 * getCurrentUser(@CurrentUser() user: UserPayload) {}
 *
 * // 或者获取特定字段
 * @Get('me')
 * getCurrentUser(@CurrentUser('email') email: string) {}
 */
export const CurrentUser = createParamDecorator(
  // data参数：从用户对象中提取的特定字段
  (data: string | undefined, ctx: ExecutionContext) => {
    // 获取请求对象
    const request = ctx.switchToHttp().getRequest();

    // 获取用户信息（由JwtAuthGuard设置）
    const user = request.user;

    // 如果指定了字段，返回该字段；否则返回整个用户对象
    return data ? user?.[data] : user;
  },
);

/**
 * 自定义请求超时装饰器
 * 设置特定端点的请求超时时间
 */
export const Timeout = createParamDecorator(
  (timeout: number, ctx: ExecutionContext) => {
    const response = ctx.switchToHttp().getResponse();
    response.setTimeout(timeout);
    return null;
  },
);

// 使用示例
// @Get('slow-endpoint')
// @Timeout(5000)
```

### 2.5 守卫（Guard）

守卫用于保护路由，决定是否允许请求继续处理。

```typescript
// src/auth/jwt-auth.guard.ts
// JWT认证守卫
// 实现CanActivate接口，在请求处理前验证用户身份

import {
  Injectable,           // 标记类为可注入的守卫
  CanActivate,          // 守卫接口，必须实现canActivate方法
  ExecutionContext,     // 执行上下文，包含请求和响应信息
  UnauthorizedException, // 未授权异常
  Inject,               // 手动注入依赖
  forwardRef,           // 处理循环依赖
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SessionService } from './session.service';

/**
 * JWT认证守卫
 *
 * 守卫的执行流程：
 * 1. 从请求头提取Token
 * 2. 验证Token是否有效
 * 3. 检查Token是否在黑名单（已吊销）
 * 4. 将用户信息挂载到请求对象
 * 5. 返回true允许请求继续，或抛出异常拒绝请求
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {

  constructor(
    // JWT服务，用于Token验证
    private readonly jwtService: JwtService,

    // 转发引用注入，处理与SessionService的循环依赖
    @Inject(forwardRef(() => SessionService))
    private readonly sessionService: SessionService,
  ) {}

  /**
   * 守卫的核心方法
   *
   * @param context 执行上下文
   * @returns boolean | Promise<boolean> | Observable<boolean>
   *          true: 允许请求继续
   *          false: 拒绝请求（不会自动抛出异常）
   *          抛出异常: 拒绝请求
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 获取HTTP请求对象
    const request = context.switchToHttp().getRequest();

    // 1. 提取Token
    const token = this.extractTokenFromHeader(request);

    // 2. 检查Token是否存在
    if (!token) {
      throw new UnauthorizedException('请先登录');
    }

    // 3. 检查Token是否已吊销
    if (await this.sessionService.isBlacklisted(token)) {
      throw new UnauthorizedException('Token已失效，请重新登录');
    }

    try {
      // 4. 验证Token并获取负载
      const payload = await this.jwtService.verifyAsync(token);

      // 5. 可选：验证会话有效性
      const userId = payload.sub;
      const tokenId = payload.tokenId;

      // 6. 将用户信息挂载到请求对象
      // 后续处理器和守卫可以通过@CurrentUser()获取用户信息
      request['user'] = payload;

    } catch (error) {
      // 处理Token过期
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('登录已过期，请重新登录');
      }

      // 处理无效Token
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('无效的令牌');
      }

      // 其他错误
      throw new UnauthorizedException('认证失败');
    }

    // 7. 返回true，允许请求继续
    return true;
  }

  /**
   * 从Authorization头提取Bearer Token
   *
   * @param request 请求对象
   * @returns Token字符串或undefined
   */
  private extractTokenFromHeader(request: any): string | undefined {
    // Authorization头格式: "Bearer <token>"
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

#### 角色守卫

```typescript
// src/auth/roles.guard.ts
// 基于角色的访问控制守卫
// 与@Roles()装饰器配合使用

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * 角色元数据键
 * 用于在守卫中读取控制器/方法上定义的角色
 */
export const ROLES_KEY = 'roles';

/**
 * 角色装饰器工厂
 * 用于标记端点允许访问的角色
 *
 * @param roles 允许访问的角色列表
 *
 * 使用示例：
 * @Get('admin-only')
 * @Roles('admin')
 * adminEndpoint() {}
 *
 * @Get('editor-or-admin')
 * @Roles('editor', 'admin')
 * editorAdminEndpoint() {}
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

/**
 * 角色守卫
 * 检查当前用户是否具有访问端点所需的角色
 */
@Injectable()
export class RolesGuard implements CanActivate {

  constructor(
    // Reflector用于读取装饰器元数据
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 获取端点要求的角色
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 如果没有定义角色要求，默认允许访问
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 获取当前用户（由JwtAuthGuard设置）
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 检查用户是否有匹配的角色
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException('权限不足，无法访问此资源');
    }

    return true;
  }
}
```

### 2.6 拦截器（Interceptor）

拦截器可以在请求处理前后执行自定义逻辑。

```typescript
// src/common/interceptors/logging.interceptor.ts
// 日志记录拦截器
// 记录每个请求的处理时间和结果

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * 日志拦截器
 *
 * 功能：
 * 1. 在请求处理前记录开始时间
 * 2. 在请求处理后计算并记录处理时长
 * 3. 记录请求方法和路径
 *
 * 使用RxJS的tap操作符来观察响应
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  /**
   * 拦截器方法
   *
   * @param context 执行上下文
   * @param next 调用处理器
   * @returns Observable流
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    // 获取用户信息（如果已登录）
    const userId = request.user?.sub || 'anonymous';

    // 在处理之前记录
    this.logger.log(`[${method}] ${url} - User: ${userId} - Started`);

    // 使用tap在响应时执行副作用
    return next.handle().pipe(
      tap({
        // 处理成功
        next: (data) => {
          const duration = Date.now() - now;
          this.logger.log(
            `[${method}] ${url} - User: ${userId} - Completed in ${duration}ms`,
          );
        },
        // 处理错误
        error: (error) => {
          const duration = Date.now() - now;
          this.logger.error(
            `[${method}] ${url} - User: ${userId} - Failed after ${duration}ms - Error: ${error.message}`,
          );
        },
      }),
    );
  }
}
```

```typescript
// src/common/interceptors/transform.interceptor.ts
// 响应转换拦截器
// 统一API响应格式

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * 统一响应接口
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  path: string;
}

/**
 * 分页响应接口
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
  path: string;
}

/**
 * 响应转换拦截器
 *
 * 功能：
 * 1. 统一API响应格式
 * 2. 自动包装数据为 { success, data, timestamp, path }
 * 3. 支持分页响应
 *
 * 使用示例：
 * // 不使用拦截器
 * return { items: [], total: 0 };
 *
 * // 使用拦截器后响应变为
 * return {
 *   success: true,
 *   data: { items: [], total: 0 },
 *   timestamp: '2024-01-01T00:00:00.000Z',
 *   path: '/api/users'
 * };
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T> | PaginatedResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T> | PaginatedResponse<T>> {
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      map((data) => {
        // 处理分页响应
        if (data && typeof data === 'object' && 'items' in data) {
          return {
            success: true,
            data: data.items,
            pagination: {
              page: data.page || 1,
              limit: data.limit || 20,
              total: data.total || 0,
              totalPages: Math.ceil((data.total || 0) / (data.limit || 20)),
            },
            timestamp: new Date().toISOString(),
            path: request.url,
          };
        }

        // 处理普通响应
        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      }),
    );
  }
}
```

### 2.7 管道（Pipes）

管道用于转换输入数据或进行验证。

```typescript
// src/common/pipes/validation.pipe.ts
// 参数验证管道
// 使用class-validator进行请求参数验证

import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';

/**
 * 验证管道
 *
 * 功能：
 * 1. 将请求数据转换为DTO类实例
 * 2. 使用class-validator验证数据
 * 3. 返回验证错误或转换后的数据
 *
 * 使用方式：
 * // 全局使用
 * app.useGlobalPipes(new ValidationPipe({ transform: true }));
 *
 * // 局部使用
 * @UsePipes(new ValidationPipe({ transform: true }))
 */
@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  constructor(
    // 是否自动转换类型
    private readonly transform = true,
    // 是否去除未定义的属性
    private readonly stripUnknown = true,
    // 是否在验证前转换数据
    private readonly skipMissingProperties = false,
  ) {}

  /**
   * 管道转换方法
   *
   * @param value 当前参数值
   * @param metadata 参数元数据
   */
  async transform(value: any, { metatype }: ArgumentMetadata): Promise<any> {
    // 如果没有类型信息或类型是原生JavaScript类型，直接返回
    // 原生类型：string, number, boolean, array, object, Date等
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // 将普通对象转换为DTO类实例
    // class-transformer会自动处理类型转换
    const object = plainToInstance(metatype, value, {
      // 启用隐式转换
      enableImplicitConversion: this.transform,
      // 排除未在类中定义的属性
      excludeExtraneousValues: this.stripUnknown,
    });

    // 验证转换后的对象
    const errors = await validate(object, {
      // 跳过缺失属性的验证
      skipMissingProperties: this.skipMissingProperties,
      // 在第一个错误时停止验证
      // 建议设为false，以获取所有错误
      whitelist: true,
      // 将验证错误转换为人类可读的格式
      forbidNonWhitelisted: true,
    });

    // 如果有验证错误
    if (errors.length > 0) {
      // 格式化错误信息
      const errorMessages = this.formatErrors(errors);

      throw new BadRequestException({
        statusCode: 400,
        message: '请求参数验证失败',
        errors: errorMessages,
      });
    }

    // 返回验证后的对象
    return object;
  }

  /**
   * 判断类型是否需要验证
   * 排除原生JavaScript类型
   */
  private toValidate(metatype: Function): boolean {
    const types: Function[] = [
      String,
      Boolean,
      Number,
      Array,
      Object,
      Date,
    ];
    return !types.includes(metatype);
  }

  /**
   * 格式化验证错误
   * 将class-validator错误转换为易读的格式
   */
  private formatErrors(errors: ValidationError[]): Record<string, string[]> {
    const result: Record<string, string[]> = {};

    for (const error of errors) {
      // 获取属性路径（如 'user.email'）
      const property = error.property;

      // 收集该属性的所有错误消息
      result[property] = [];

      if (error.constraints) {
        result[property].push(...Object.values(error.constraints));
      }

      // 递归处理嵌套对象
      if (error.children && error.children.length > 0) {
        const childErrors = this.formatErrors(error.children);
        for (const [key, messages] of Object.entries(childErrors)) {
          result[`${property}.${key}`] = messages;
        }
      }
    }

    return result;
  }
}
```

```typescript
// src/common/pipes/parse-int.pipe.ts
// 内置管道的自定义实现
// 演示如何创建转换管道

import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

/**
 * 整数解析管道
 *
 * 功能：
 * 1. 将字符串转换为整数
 * 2. 验证值是否为有效整数
 * 3. 可选的范围验证
 *
 * 使用示例：
 * @Get(':id')
 * findOne(@Param('id', new ParseIntPipe()) id: number) {}
 */
@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  constructor(
    // 可选的最小值
    private readonly min?: number,
    // 可选的最大值
    private readonly max?: number,
    // 可选的错误消息
    private readonly errorMessage?: string,
  ) {}

  transform(value: string, metadata: ArgumentMetadata): number {
    // 尝试转换为整数
    const radix = 10;
    const parsedValue = parseInt(value, radix);

    // 检查是否为有效整数
    if (isNaN(parsedValue)) {
      throw new BadRequestException(
        this.errorMessage || `${metadata.data} 必须是有效的整数`,
      );
    }

    // 验证最小值
    if (this.min !== undefined && parsedValue < this.min) {
      throw new BadRequestException(
        this.errorMessage || `${metadata.data} 不能小于 ${this.min}`,
      );
    }

    // 验证最大值
    if (this.max !== undefined && parsedValue > this.max) {
      throw new BadRequestException(
        this.errorMessage || `${metadata.data} 不能大于 ${this.max}`,
      );
    }

    return parsedValue;
  }
}

/**
 * UUID解析管道
 *
 * 使用示例：
 * @Get(':id')
 * findOne(@Param('id', new ParseUUIDPipe()) id: string) {}
 */
@Injectable()
export class ParseUUIDPipe implements PipeTransform<string, string> {
  // UUID v4的正则表达式
  private readonly uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  transform(value: string, metadata: ArgumentMetadata): string {
    if (!this.uuidRegex.test(value)) {
      throw new BadRequestException(
        `${metadata.data} 必须是有效的UUID格式`,
      );
    }
    return value;
  }
}
```

### 2.8 异常过滤器

异常过滤器用于处理控制器抛出的异常，返回标准化的错误响应。

```typescript
// src/common/filters/http-exception.filter.ts
// 全局HTTP异常过滤器
// 统一处理所有HTTP相关异常

import {
  ExceptionFilter,      // 异常过滤器接口
  Catch,                // 装饰器，标记要捕获的异常类型
  ArgumentsHost,         // 执行上下文宿主
  HttpException,         // HTTP异常基类
  HttpStatus,            // HTTP状态码枚举
  Logger,                // NestJS日志服务
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * 统一错误响应接口
 */
export interface ApiErrorResponse {
  success: boolean;           // 是否成功
  statusCode: number;          // HTTP状态码
  timestamp: string;           // 错误发生时间
  path: string;                // 请求路径
  method: string;              // 请求方法
  message: string;            // 错误消息
  error?: string;             // 错误类型
  validationErrors?: Record<string, string[]>;  // 验证错误详情
  stack?: string;             // 错误堆栈（仅开发环境）
}

/**
 * 全局HTTP异常过滤器
 *
 * 功能：
 * 1. 捕获所有HttpException及其子类
 * 2. 处理验证异常（class-validator）
 * 3. 统一错误响应格式
 * 4. 错误日志记录
 * 5. 生产环境隐藏敏感信息
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  /**
   * 异常捕获方法
   *
   * @param exception 捕获到的异常
   * @param host 宿主对象，包含请求和响应上下文
   */
  catch(exception: unknown, host: ArgumentsHost) {
    // 获取HTTP上下文
    const ctx = host.switchToHttp();

    // 获取响应对象
    const response = ctx.getResponse<Response>();

    // 获取请求对象
    const request = ctx.getRequest<Request>();

    // 初始化默认值
    let status = HttpStatus.INTERNAL_SERVER_ERROR;  // 默认500
    let message = '服务器内部错误';
    let error: string | undefined;
    let validationErrors: Record<string, string[]> | undefined;

    // ============ 根据异常类型进行处理 ============

    // 1. 处理HTTP异常
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        // 异常响应是字符串消息
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        // 异常响应是对象，提取详细信息
        const responseObj = exceptionResponse as Record<string, any>;
        message = responseObj.message || message;
        error = responseObj.error;
        validationErrors = responseObj.validationErrors;
      }
    }
    // 2. 处理验证错误（class-validator/Yup/Zod）
    else if (
      exception &&
      typeof exception === 'object' &&
      'message' in exception
    ) {
      const err = exception as any;

      // 处理数组形式的验证错误
      if (Array.isArray(err.message)) {
        status = HttpStatus.BAD_REQUEST;
        message = '请求参数验证失败';
        validationErrors = {};

        err.message.forEach((msg: string) => {
          // 解析 "field:error message" 格式
          const [field, ...rest] = msg.split(':');
          if (field && rest.length > 0) {
            if (!validationErrors![field]) {
              validationErrors![field] = [];
            }
            validationErrors![field].push(rest.join(':').trim());
          }
        });
      } else if (err.message) {
        message = err.message;
      }
    }
    // 3. 处理普通错误
    else if (exception instanceof Error) {
      message = exception.message;

      // 开发环境显示错误名称
      if (process.env.NODE_ENV === 'development') {
        error = exception.name;
      }
    }

    // ============ 构建错误响应 ============

    const errorResponse: ApiErrorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
    };

    // 添加可选字段
    if (error) {
      errorResponse.error = error;
    }
    if (validationErrors) {
      errorResponse.validationErrors = validationErrors;
    }

    // 仅在开发环境添加堆栈跟踪
    if (process.env.NODE_ENV === 'development' && exception instanceof Error) {
      errorResponse.stack = exception.stack;
    }

    // ============ 记录错误日志 ============

    this.logError(exception, status, request, message);

    // ============ 发送响应 ============

    response.status(status).json(errorResponse);
  }

  /**
   * 记录错误日志
   * 根据状态码选择日志级别
   */
  private logError(
    exception: unknown,
    status: number,
    request: Request,
    message: string,
  ) {
    // 根据状态码确定日志级别
    const logLevel =
      status >= 500 ? 'error' : status >= 400 ? 'warn' : 'log';

    // 获取客户端信息
    const userAgent = request.headers['user-agent'] || '';
    const ip = request.ip || request.socket.remoteAddress || 'unknown';

    // 格式化日志消息
    const logMessage = `[${status}] ${request.method} ${request.url} - ${message} - IP: ${ip} - UA: ${userAgent}`;

    // 根据级别输出日志
    if (logLevel === 'error') {
      this.logger.error(
        logMessage,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else if (logLevel === 'warn') {
      this.logger.warn(logMessage);
    } else {
      this.logger.log(logMessage);
    }
  }
}

/**
 * 业务异常基类
 * 用于抛出业务逻辑相关的异常
 */
export class BusinessException extends HttpException {
  constructor(
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    error?: string,
  ) {
    super(
      {
        success: false,
        message,
        error,
        statusCode: status,
      },
      status,
    );
  }
}

/**
 * 资源不存在异常
 */
export class NotFoundException extends BusinessException {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} (ID: ${id}) 不存在` : `${resource} 不存在`,
      HttpStatus.NOT_FOUND,
      'NOT_FOUND',
    );
  }
}

/**
 * 资源冲突异常
 * 用于处理重复创建等场景
 */
export class ConflictException extends BusinessException {
  constructor(resource: string, identifier?: string) {
    super(
      identifier
        ? `${resource} (${identifier}) 已存在`
        : `${resource} 已存在`,
      HttpStatus.CONFLICT,
      'CONFLICT',
    );
  }
}

/**
 * 认证失败异常
 */
export class UnauthorizedException extends BusinessException {
  constructor(message = '认证失败，请重新登录') {
    super(message, HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED');
  }
}

/**
 * 权限不足异常
 */
export class ForbiddenException extends BusinessException {
  constructor(message = '权限不足') {
    super(message, HttpStatus.FORBIDDEN, 'FORBIDDEN');
  }
}

/**
 * 参数验证异常
 */
export class ValidationException extends HttpException {
  constructor(
    message: string,
    validationErrors?: Record<string, string[]>,
  ) {
    super(
      {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message,
        error: 'VALIDATION_ERROR',
        validationErrors,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
```

### 2.9 NestJS生命周期

NestJS应用和每个模块都有自己的生命周期。

```typescript
// src/app.module.ts
// 演示NestJS生命周期钩子

import {
  Module,                    // 模块装饰器
  OnModuleInit,              // 模块初始化钩子
  OnModuleDestroy,           // 模块销毁钩子
  OnApplicationBootstrap,   // 应用启动完成钩子
  OnApplicationShutdown,    // 应用关闭钩子
  Logger,                   // 日志服务
} from '@nestjs/common';
import { Injectable, OnModuleInit as N OnModuleInit } from '@nestjs/common';

/**
 * 生命周期概述
 *
 * 应用启动顺序：
 * 1. onModuleCreate - 模块被创建（NestJS 10+）
 * 2. onModuleInit - 模块初始化完成
 * 3. onApplicationBootstrap - 应用启动完成
 * 4. 请求处理...
 * 5. onApplicationShutdown - 应用开始关闭
 * 6. onModuleDestroy - 模块销毁
 */

@Injectable()
class AppService implements OnModuleInit, OnModuleDestroy {

  private readonly logger = new Logger(AppService.name);

  /**
   * 模块初始化完成时调用
   * 此时所有依赖注入已完成
   */
  onModuleInit() {
    this.logger.log('AppService 初始化完成');
    // 适合：建立数据库连接、初始化缓存等
  }

  /**
   * 模块销毁时调用
   * 用于清理资源
   */
  onModuleDestroy() {
    this.logger.log('AppService 正在销毁');
    // 适合：关闭数据库连接、关闭Redis连接等
  }
}

/**
 * 应用启动钩子示例
 */
@Injectable()
class BootstrapService implements OnApplicationBootstrap {

  private readonly logger = new Logger(BootstrapService.name);

  /**
   * 应用完全启动后调用
   * 此时HTTP服务器已经开始监听
   */
  onApplicationBootstrap() {
    this.logger.log('应用启动完成，可以开始接收请求');

    // 适合：预热缓存、启动后台任务等
  }
}

/**
 * 应用关闭钩子示例
 * 需要启用关闭钩子：
 * app.enableShutdownHooks()
 */
@Injectable()
class ShutdownService implements OnApplicationShutdown {

  private readonly logger = new Logger(ShutdownService.name);

  /**
   * 应用开始关闭时调用
   * 收到SIGTERM或SIGINT信号时触发
   */
  onApplicationShutdown(signal: string) {
    this.logger.log(`收到关闭信号: ${signal}`);
    // 适合：保存状态、关闭文件句柄等
  }
}
```

### 2.10 模块间通信

NestJS中模块间通信有多种方式：

#### 方式1：通过导入导出（标准方式）

```typescript
// src/shared/shared.module.ts
// 共享模块示例

@Module({
  providers: [SharedService],
  exports: [SharedService],
})
export class SharedModule {}

// 使用方式
@Module({
  imports: [SharedModule],
})
export class DocumentsModule {}
```

#### 方式2：全局模块

```typescript
// src/config/config.module.ts
// 全局配置模块

@Global()
@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}

// 使用方式 - 无需导入
@Module({})
export class SomeModule {
  constructor(private configService: ConfigService) {}
}
```

#### 方式3：forwardRef处理循环依赖

```typescript
// src/auth/auth.module.ts
@Module({
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}

// src/users/users.module.ts
@Module({
  imports: [
    forwardRef(() => AuthModule),  // 使用forwardRef处理循环依赖
  ],
  providers: [UsersService],
})
export class UsersModule {}
```

### 2.11 实战：使用NestJS构建博客后端API

以下是一个完整的NestJS博客后端API实现：

#### 模块结构

```
src/
├── app.module.ts              # 根模块
├── main.ts                    # 入口文件
├── modules/
│   ├── auth/                  # 认证模块
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   ├── jwt-auth.guard.ts
│   │   └── dto/
│   ├── users/                 # 用户模块
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── entities/
│   ├── posts/                 # 文章模块
│   │   ├── posts.module.ts
│   │   ├── posts.controller.ts
│   │   ├── posts.service.ts
│   │   ├── dto/
│   │   └── entities/
│   └── comments/              # 评论模块
│       ├── comments.module.ts
│       ├── comments.controller.ts
│       ├── comments.service.ts
│       └── entities/
```

#### 文章模块完整实现

```typescript
// src/modules/posts/posts.module.ts
// 文章模块

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { Post } from './entities/post.entity';
import { User } from '../users/entities/user.entity';

@Module({
  // 导入实体，使PostRepository可用
  imports: [TypeOrmModule.forFeature([Post, User])],

  controllers: [PostsController],

  // 声明服务
  providers: [PostsService],

  // 导出服务，供其他模块使用
  exports: [PostsService],
})
export class PostsModule {}
```

```typescript
// src/modules/posts/entities/post.entity.ts
// 文章实体

import {
  Entity,              // 实体装饰器
  Column,              // 列装饰器
  PrimaryGeneratedColumn,  // 主键生成策略
  CreateDateColumn,    // 自动创建时间戳
  UpdateDateColumn,   // 自动更新时间戳
  ManyToOne,           // 多对一关系
  OneToMany,           // 一对多关系
  JoinColumn,          // 关系列配置
} from 'typeorm';

/**
 * 文章实体
 * 对应数据库中的 posts 表
 */
@Entity('posts')
export class Post {
  // 主键 - UUID格式
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 文章标题
  @Column({ type: 'varchar', length: 200 })
  title: string;

  // 文章内容（富文本/Markdown）
  @Column({ type: 'text' })
  content: string;

  // 文章摘要
  @Column({ type: 'varchar', length: 500, nullable: true })
  summary?: string;

  // 封面图片URL
  @Column({ type: 'varchar', length: 500, nullable: true })
  coverImage?: string;

  // 阅读数量
  @Column({ type: 'int', default: 0 })
  viewCount: number;

  // 点赞数量
  @Column({ type: 'int', default: 0 })
  likeCount: number;

  // 是否发布
  @Column({ type: 'boolean', default: false })
  published: boolean;

  // 发布时间
  @Column({ type: 'timestamp', nullable: true })
  publishedAt?: Date;

  // 作者ID（外键）
  @Column()
  authorId: string;

  // 作者关系
  @ManyToOne(() => User, (user) => user.posts)
  @JoinColumn({ name: 'authorId' })
  author: User;

  // 创建时间
  @CreateDateColumn()
  createdAt: Date;

  // 更新时间
  @UpdateDateColumn()
  updatedAt: Date;
}
```

```typescript
// src/modules/posts/dto/create-post.dto.ts
// 创建文章DTO

import {
  IsString,           // 字符串验证
  IsOptional,         // 可选字段
  IsBoolean,          // 布尔值验证
  IsArray,            // 数组验证
  MaxLength,          // 最大长度
  MinLength,          // 最小长度
} from 'class-validator';

/**
 * 创建文章数据传输对象
 * 用于验证POST请求的文章数据
 */
export class CreatePostDto {
  // 标题：必填，最大200字符
  @IsString()
  @MinLength(1, { message: '文章标题不能为空' })
  @MaxLength(200, { message: '文章标题不能超过200个字符' })
  title: string;

  // 内容：必填
  @IsString()
  @MinLength(1, { message: '文章内容不能为空' })
  content: string;

  // 摘要：可选，最大500字符
  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string;

  // 封面图：可选，有效URL
  @IsOptional()
  @IsString()
  coverImage?: string;

  // 标签：可选，字符串数组
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  // 是否立即发布
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

/**
 * 更新文章数据传输对象
 * 所有字段都是可选的
 */
export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

/**
 * 分页查询参数
 */
export class PaginationQueryDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  sort?: string;
}
```

```typescript
// src/modules/posts/posts.service.ts
// 文章服务

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { CreatePostDto, UpdatePostDto } from './dto/create-post.dto';

/**
 * 文章服务
 * 封装文章相关的业务逻辑
 */
@Injectable()
export class PostsService {
  constructor(
    // 注入Post实体的Repository
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  /**
   * 创建文章
   *
   * @param createPostDto 创建文章的数据
   * @param authorId 作者ID（从认证用户获取）
   */
  async create(
    createPostDto: CreatePostDto,
    authorId: string,
  ): Promise<Post> {
    // 创建文章实体
    const post = this.postRepository.create({
      ...createPostDto,
      authorId,
      // 如果设置为发布，设置发布时间
      publishedAt: createPostDto.published ? new Date() : null,
    });

    // 保存到数据库
    return this.postRepository.save(post);
  }

  /**
   * 分页获取已发布的文章列表
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    sort: string = 'createdAt:desc',
  ): Promise<{ items: Post[]; total: number }> {
    // 解析排序参数
    const [sortField, sortOrder] = sort.split(':');
    const order = { [sortField]: sortOrder?.toUpperCase() || 'DESC' };

    // 构建查询
    const [items, total] = await this.postRepository.findAndCount({
      // 只查询已发布的文章
      where: { published: true },
      // 分页
      skip: (page - 1) * limit,
      take: limit,
      // 排序
      order,
      // 预加载关联关系
      relations: ['author'],
      // 选择特定字段，减少数据传输
      select: {
        author: {
          id: true,
          username: true,
          nickname: true,
          avatar: true,
        },
      },
    });

    return { items, total };
  }

  /**
   * 获取当前用户的文章列表
   */
  async findByAuthor(
    authorId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ items: Post[]; total: number }> {
    const [items, total] = await this.postRepository.findAndCount({
      where: { authorId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['author'],
    });

    return { items, total };
  }

  /**
   * 根据ID获取文章详情
   */
  async findOne(id: string): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['author'],
      select: {
        author: {
          id: true,
          username: true,
          nickname: true,
          avatar: true,
        },
      },
    });

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    // 增加阅读数
    await this.postRepository.increment({ id }, 'viewCount', 1);

    return post;
  }

  /**
   * 更新文章
   * 只能更新自己的文章
   */
  async update(
    id: string,
    updatePostDto: UpdatePostDto,
    userId: string,
  ): Promise<Post> {
    // 查找文章
    const post = await this.postRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    // 检查权限
    if (post.authorId !== userId) {
      throw new ForbiddenException('只能修改自己的文章');
    }

    // 如果将文章设为发布，设置发布时间
    if (updatePostDto.published === true && !post.publishedAt) {
      (updatePostDto as any).publishedAt = new Date();
    }

    // 更新文章
    Object.assign(post, updatePostDto);
    return this.postRepository.save(post);
  }

  /**
   * 删除文章
   * 只能删除自己的文章
   */
  async remove(id: string, userId: string): Promise<void> {
    const post = await this.postRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('只能删除自己的文章');
    }

    await this.postRepository.remove(post);
  }

  /**
   * 点赞文章
   */
  async like(id: string): Promise<Post> {
    const post = await this.postRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    // 增加点赞数
    await this.postRepository.increment({ id }, 'likeCount', 1);

    return this.postRepository.findOne({ where: { id } });
  }
}
```

```typescript
// src/modules/posts/posts.controller.ts
// 文章控制器

import {
  Controller,           // 控制器装饰器
  Get,                  // GET方法装饰器
  Post,                 // POST方法装饰器
  Patch,                // PATCH方法装饰器
  Delete,               // DELETE方法装饰器
  Body,                 // 获取请求体
  Param,                // 获取路由参数
  Query,                // 获取查询参数
  UseGuards,            // 使用守卫
  UsePipes,             // 使用管道
  ValidationPipe,       // 验证管道
  ParseUUIDPipe,       // UUID解析管道
  HttpCode,             // HTTP状态码装饰器
  HttpStatus,           // HTTP状态码枚举
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto, PaginationQueryDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * 文章控制器
 * 处理所有文章相关的HTTP请求
 */
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  /**
   * GET /posts
   * 获取已发布的文章列表（公开）
   *
   * @Query page 页码（默认1）
   * @Query limit 每页数量（默认10）
   * @Query sort 排序（默认createdAt:desc）
   */
  @Get()
  async findAll(@Query() query: PaginationQueryDto) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const sort = query.sort || 'createdAt:desc';

    const result = await this.postsService.findAll(page, limit, sort);

    return {
      items: result.items,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }

  /**
   * GET /posts/:id
   * 获取文章详情（公开）
   */
  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.postsService.findOne(id);
  }

  /**
   * POST /posts
   * 创建新文章（需要登录）
   */
  @Post()
  @UseGuards(JwtAuthGuard)  // 需要认证
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @Body() createPostDto: CreatePostDto,
    @CurrentUser('sub') userId: string,  // 从Token获取用户ID
  ) {
    return this.postsService.create(createPostDto, userId);
  }

  /**
   * PATCH /posts/:id
   * 更新文章（需要登录，只能更新自己的文章）
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true, skipMissingProperties: true }))
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updatePostDto: UpdatePostDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.postsService.update(id, updatePostDto, userId);
  }

  /**
   * DELETE /posts/:id
   * 删除文章（需要登录，只能删除自己的文章）
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser('sub') userId: string,
  ) {
    await this.postsService.remove(id, userId);
  }

  /**
   * POST /posts/:id/like
   * 点赞文章（需要登录）
   */
  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  async like(
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.postsService.like(id);
  }

  /**
   * GET /posts/my/drafts
   * 获取当前用户的草稿列表
   */
  @Get('my/drafts')
  @UseGuards(JwtAuthGuard)
  async getMyDrafts(
    @CurrentUser('sub') userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);

    // 查询条件：作者是当前用户，且未发布
    const [items, total] = await this.postsService.findByAuthor(userId, page, limit);

    return {
      items: items.filter(p => !p.published),
      total: total,
      page,
      limit,
    };
  }
}
```

```typescript
// src/modules/comments/comments.module.ts
// 评论模块

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { Comment } from './entities/comment.entity';
import { PostsModule } from '../posts/posts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment]),
    PostsModule,  // 导入PostsModule以使用PostsService
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
```

```typescript
// src/modules/comments/entities/comment.entity.ts
// 评论实体

import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column()
  authorId: string;

  @ManyToOne(() => User, (user) => user.comments)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  postId: string;

  @ManyToOne(() => Post, (post) => post.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  // 回复目标评论ID（用于嵌套评论）
  @Column({ nullable: true })
  parentId?: string;

  @ManyToOne(() => Comment, (comment) => comment.replies, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent: Comment;

  // 子回复
  @OneToMany(() => Comment, (comment) => comment.parent)
  replies: Comment[];

  @CreateDateColumn()
  createdAt: Date;
}
```

```typescript
// src/modules/auth/auth.module.ts
// 认证模块

import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { User } from '../users/entities/user.entity';

@Global()
@Module({
  imports: [
    // Passport配置
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // TypeORM实体
    TypeOrmModule.forFeature([User]),

    // JWT模块配置
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [AuthService, JwtModule, JwtAuthGuard],
})
export class AuthModule {}
```

```typescript
// src/main.ts
// NestJS应用入口

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // 创建NestJS应用
  const app = await NestFactory.create(AppModule);

  // 全局前缀
  app.setGlobalPrefix('api/v1');

  // 启用CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      // 自动转换类型
      transform: true,
      // 去除多余字段
      whitelist: true,
      // 禁止多余字段
      forbidNonWhitelisted: true,
      // 转换验证错误消息
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 全局异常过滤器
  // app.useGlobalFilters(new HttpExceptionFilter());

  // 启用关闭钩子（用于优雅关闭）
  app.enableShutdownHooks();

  // 启动服务器
  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`应用已启动，监听端口: ${port}`);
  logger.log(`环境: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();
```

---

## 第三部分：核心概念深度解析

### 3.1 控制反转（IoC）与依赖注入（DI）

**控制反转（Inversion of Control）**是一种软件设计原则，它将组件依赖的获取方式反转，由组件内部创建依赖改为由外部注入。

**依赖注入（Dependency Injection）**是实现IoC的一种技术，通过构造函数、属性或方法将依赖传递给组件。

#### NestJS中的IoC容器

NestJS的IoC容器负责：
1. 解析依赖关系
2. 实例化组件
3. 管理组件生命周期

```typescript
// IoC容器工作流程示例

// 1. 定义服务（提供者）
@Injectable()
class UserService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly cacheService: CacheService,
  ) {}
}

// 2. 注册到模块
@Module({
  providers: [UserService, UserRepository, CacheService],
})
class UserModule {}

// 3. NestJS IoC容器自动解析依赖
// 当UserService被创建时，容器会：
// - 先创建UserRepository
// - 再创建CacheService
// - 最后将它们注入到UserService构造函数
```

### 3.2 AOP面向切面编程

AOP是一种编程范式，它允许将横切关注点（如日志、事务、安全）与业务逻辑分离。

NestJS中实现AOP的方式：
1. 守卫（Guard）- 安全
2. 拦截器（Interceptor）- 日志、性能监控
3. 管道（Pipe）- 参数验证、转换
4. 异常过滤器（Exception Filter）- 错误处理

```typescript
// AOP示例：日志切面

// 定义切面（拦截器）
@Injectable()
class LoggingInterceptor implements NestInterceptor {
  intercept(context, next) {
    console.log('Before...');  // 前置通知
    const result = next.handle();
    console.log('After...');   // 后置通知
    return result;
  }
}

// 应用切面
@Controller()
@UseInterceptors(LoggingInterceptor)
class UserController {}
```

### 3.3 装饰器模式

TypeScript装饰器是一种元编程特性，允许在编译时修改类、方法、属性。

NestJS中的装饰器应用：
- `@Module()` - 模块装饰器
- `@Controller()` - 控制器装饰器
- `@Injectable()` - 服务装饰器
- `@Get()`、`@Post()`等 - HTTP方法装饰器
- `@UseGuards()` - 守卫装饰器

### 3.4 元编程

元编程是指程序能够访问、修改自身或被其他程序修改的能力。TypeScript装饰器就是一种元编程形式。

```typescript
// 元编程示例：自动生成API文档

function ApiDocs(route: string) {
  return function (target: any, propertyKey: string) {
    // 读取方法名和参数
    const methodName = propertyKey;

    // 存储到类的元数据中
    if (!target.constructor.apiMethods) {
      target.constructor.apiMethods = [];
    }
    target.constructor.apiMethods.push({
      route,
      method: methodName,
    });
  };
}

@Controller('users')
class UserController {
  @Get(':id')
  @ApiDocs('GET /users/:id')
  findOne() {}
}
```

### 3.5 NestJS请求处理流程

```
HTTP请求
    ↓
Middleware（中间件）
    ↓
Guards（守卫）- 权限验证
    ↓
Interceptors - 前置处理
    ↓
Pipes（管道）- 参数验证/转换
    ↓
Controller（控制器）- 路由分发
    ↓
Service（服务）- 业务逻辑
    ↓
Repository/ORM - 数据访问
    ↓
Service返回
    ↓
Interceptors - 后置处理
    ↓
Exception Filter - 异常处理
    ↓
Middleware（中间件）
    ↓
HTTP响应
```

---

## 总结

本文档系统讲解了Express与NestJS两大Node.js后端框架的企业级最佳实践：

### Express要点
- 分层架构：控制器、服务层、仓储层
- 中间件体系：日志、认证、错误处理、验证
- 配置管理：环境变量、数据库连接池
- 实战：完整的RESTful API实现

### NestJS要点
- 模块化架构：根模块 + 功能模块
- 依赖注入：IoC容器自动管理
- 装饰器体系：完整的方法/类/参数装饰器
- 核心组件：Guard、Interceptor、Pipe、Exception Filter
- 实战：博客后端API完整实现

### 核心概念
- 控制反转（IoC）
- 依赖注入（DI）
- AOP面向切面编程
- 装饰器模式
- 元编程

掌握这些内容后，你将能够构建高效、可维护的企业级Node.js后端应用。

---

## 参考资源

- [NestJS官方文档](https://docs.nestjs.com)
- [Express官方文档](https://expressjs.com)
- [TypeORM文档](https://typeorm.io)
- [pg数据库驱动](https://node-postgres.com)
