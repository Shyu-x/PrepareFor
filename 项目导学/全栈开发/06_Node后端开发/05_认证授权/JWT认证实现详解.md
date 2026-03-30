# JWT 认证实现详解

## 一、JWT 概述

### 1.1 什么是 JWT

JWT（JSON Web Token）是一种开放标准（RFC 7519），用于在各方之间安全传输信息的紧凑、URL安全的方式。

**JWT 特点**：

| 特点 | 说明 |
|------|------|
| **紧凑** | 体积小，可通过 URL、POST 参数、Header 传输 |
| **自包含** | 包含用户信息，无需多次查询数据库 |
| **无状态** | 服务端无需存储 Session |
| **跨域友好** | 适合分布式系统和微服务架构 |

### 1.2 JWT 结构

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IuW8oOS4iSIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

# 结构分解
Header.Payload.Signature
```

```json
// Header（头部）
{
  "alg": "HS256",
  "typ": "JWT"
}

// Payload（载荷）
{
  "sub": "1234567890",
  "name": "张三",
  "iat": 1516239022,
  "exp": 1516242622
}

// Signature（签名）
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

### 1.3 认证流程

```
┌─────────┐                    ┌─────────┐                    ┌─────────┐
│  客户端  │                    │  服务端  │                    │ 数据库  │
└────┬────┘                    └────┬────┘                    └────┬────┘
     │                              │                              │
     │  1. 发送登录凭证              │                              │
     │  POST /auth/login            │                              │
     │─────────────────────────────>│                              │
     │                              │  2. 验证用户                  │
     │                              │─────────────────────────────>│
     │                              │  3. 返回用户信息              │
     │                              │<─────────────────────────────│
     │                              │                              │
     │                              │  4. 生成 JWT                  │
     │  5. 返回 JWT                 │                              │
     │<─────────────────────────────│                              │
     │                              │                              │
     │  6. 携带 JWT 访问资源         │                              │
     │  Authorization: Bearer <JWT> │                              │
     │─────────────────────────────>│                              │
     │                              │  7. 验证 JWT                  │
     │                              │  8. 解析用户信息              │
     │  9. 返回资源                  │                              │
     │<─────────────────────────────│                              │
```

---

## 二、JWT 实现

### 2.1 安装依赖

```bash
# 安装 jsonwebtoken
npm install jsonwebtoken

# 安装类型定义（TypeScript）
npm install -D @types/jsonwebtoken

# 安装 bcrypt（密码加密）
npm install bcrypt
npm install -D @types/bcrypt
```

### 2.2 JWT 工具类

```typescript
// src/utils/jwt.ts
import jwt from 'jsonwebtoken';

// JWT 配置
interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
  issuer: string;
}

const config: JwtConfig = {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  issuer: process.env.JWT_ISSUER || 'your-app',
};

// Token 载荷
interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

// Token 响应
interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

class JwtService {
  /**
   * 生成访问令牌
   */
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(
      {
        ...payload,
        type: 'access',
      },
      config.secret,
      {
        expiresIn: config.expiresIn,
        issuer: config.issuer,
        subject: payload.userId,
      }
    );
  }

  /**
   * 生成刷新令牌
   */
  generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(
      {
        userId: payload.userId,
        type: 'refresh',
      },
      config.secret,
      {
        expiresIn: config.refreshExpiresIn,
        issuer: config.issuer,
        subject: payload.userId,
      }
    );
  }

  /**
   * 生成令牌对
   */
  generateTokenPair(payload: TokenPayload): TokenResponse {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);
    
    // 解析过期时间（秒）
    const decoded = jwt.decode(accessToken) as any;
    const expiresIn = decoded.exp - decoded.iat;
    
    return {
      accessToken,
      refreshToken,
      expiresIn,
      tokenType: 'Bearer',
    };
  }

  /**
   * 验证令牌
   */
  verify(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, config.secret, {
        issuer: config.issuer,
      }) as any;
      
      return {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * 解码令牌（不验证）
   */
  decode(token: string): any {
    return jwt.decode(token);
  }

  /**
   * 检查令牌是否即将过期
   */
  isTokenExpiringSoon(token: string, thresholdSeconds: number = 300): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) return true;
      
      const expiresAt = decoded.exp * 1000;
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;
      
      return timeUntilExpiry < thresholdSeconds * 1000;
    } catch {
      return true;
    }
  }
}

export const jwtService = new JwtService();
```

### 2.3 密码加密

```typescript
// src/utils/password.ts
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

class PasswordService {
  /**
   * 加密密码
   */
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * 验证密码
   */
  async compare(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * 验证密码强度
   */
  validateStrength(password: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('密码长度至少8位');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('密码需包含大写字母');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('密码需包含小写字母');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('密码需包含数字');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('密码需包含特殊字符');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const passwordService = new PasswordService();
```

---

## 三、认证中间件

### 3.1 认证中间件实现

```typescript
// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { jwtService } from '../utils/jwt';

// 扩展 Request 类型
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

/**
 * 认证中间件
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  
  // 检查 Authorization 头
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'MISSING_TOKEN',
        message: '未提供认证令牌',
      },
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  // 验证令牌
  const payload = jwtService.verify(token);
  
  if (!payload) {
    return res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: '无效的认证令牌',
      },
    });
  }
  
  // 将用户信息附加到请求对象
  req.user = payload;
  next();
}

/**
 * 可选认证中间件（不强制要求认证）
 */
export function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = jwtService.verify(token);
    
    if (payload) {
      req.user = payload;
    }
  }
  
  next();
}

/**
 * 角色授权中间件
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
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
}

/**
 * 资源所有权验证中间件
 */
export function requireOwnership(getResourceId: (req: Request) => string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: '未认证',
        },
      });
    }
    
    const resourceId = getResourceId(req);
    
    // 管理员可以访问所有资源
    if (req.user.role === 'admin') {
      return next();
    }
    
    // 检查是否是资源所有者
    if (req.user.userId !== resourceId) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: '无权访问此资源',
        },
      });
    }
    
    next();
  };
}
```

### 3.2 令牌刷新机制

```typescript
// src/middleware/tokenRefresh.ts
import { Request, Response, NextFunction } from 'express';
import { jwtService } from '../utils/jwt';

/**
 * 自动刷新令牌中间件
 * 当访问令牌即将过期时，自动刷新
 */
export function autoRefreshToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  
  const token = authHeader.split(' ')[1];
  
  // 检查令牌是否即将过期
  if (jwtService.isTokenExpiringSoon(token)) {
    // 尝试使用刷新令牌
    const refreshToken = req.headers['x-refresh-token'] as string;
    
    if (refreshToken) {
      const payload = jwtService.verify(refreshToken);
      
      if (payload && payload.userId) {
        // 生成新的令牌对
        const newTokens = jwtService.generateTokenPair({
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
        });
        
        // 在响应头中返回新令牌
        res.setHeader('X-New-Access-Token', newTokens.accessToken);
        res.setHeader('X-New-Refresh-Token', newTokens.refreshToken);
      }
    }
  }
  
  next();
}
```

---

## 四、认证控制器

### 4.1 用户注册

```typescript
// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model';
import { passwordService } from '../utils/password';
import { jwtService } from '../utils/jwt';

class AuthController {
  /**
   * 用户注册
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password } = req.body;
      
      // 检查用户是否已存在
      const existingUser = await User.findOne({ where: { email } });
      
      if (existingUser) {
        return res.status(409).json({
          error: {
            code: 'USER_EXISTS',
            message: '该邮箱已被注册',
          },
        });
      }
      
      // 验证密码强度
      const validation = passwordService.validateStrength(password);
      
      if (!validation.valid) {
        return res.status(400).json({
          error: {
            code: 'WEAK_PASSWORD',
            message: '密码强度不足',
            details: validation.errors.map(msg => ({ message: msg })),
          },
        });
      }
      
      // 加密密码
      const hashedPassword = await passwordService.hash(password);
      
      // 创建用户
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: 'user',
        status: 'active',
      });
      
      // 生成令牌
      const tokens = jwtService.generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
      
      // 返回响应
      res.status(201).json({
        message: '注册成功',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          ...tokens,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 用户登录
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      
      // 查找用户
      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        return res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: '邮箱或密码错误',
          },
        });
      }
      
      // 检查用户状态
      if (user.status !== 'active') {
        return res.status(403).json({
          error: {
            code: 'ACCOUNT_DISABLED',
            message: '账户已被禁用',
          },
        });
      }
      
      // 验证密码
      const isValidPassword = await passwordService.compare(
        password,
        user.password
      );
      
      if (!isValidPassword) {
        return res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: '邮箱或密码错误',
          },
        });
      }
      
      // 生成令牌
      const tokens = jwtService.generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
      
      // 更新最后登录时间
      await user.update({ lastLoginAt: new Date() });
      
      // 返回响应
      res.json({
        message: '登录成功',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          ...tokens,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 刷新令牌
   */
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({
          error: {
            code: 'MISSING_REFRESH_TOKEN',
            message: '未提供刷新令牌',
          },
        });
      }
      
      // 验证刷新令牌
      const payload = jwtService.verify(refreshToken);
      
      if (!payload || !payload.userId) {
        return res.status(401).json({
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            message: '无效的刷新令牌',
          },
        });
      }
      
      // 检查用户是否存在且有效
      const user = await User.findByPk(payload.userId);
      
      if (!user || user.status !== 'active') {
        return res.status(401).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: '用户不存在或已被禁用',
          },
        });
      }
      
      // 生成新的令牌对
      const tokens = jwtService.generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
      
      res.json({
        message: '令牌刷新成功',
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 登出
   */
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // JWT 是无状态的，服务端无法主动使令牌失效
      // 可以通过以下方式实现登出：
      // 1. 客户端删除令牌
      // 2. 使用令牌黑名单（需要 Redis）
      // 3. 使用短期令牌 + 长期刷新令牌
      
      // 如果使用黑名单，将当前令牌加入黑名单
      // await redisClient.set(`blacklist:${token}`, '1', 'EX', remainingTime);
      
      res.json({
        message: '登出成功',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] },
      });
      
      if (!user) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: '用户不存在',
          },
        });
      }
      
      res.json({
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 修改密码
   */
  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { currentPassword, newPassword } = req.body;
      
      // 获取用户
      const user = await User.findByPk(userId);
      
      if (!user) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: '用户不存在',
          },
        });
      }
      
      // 验证当前密码
      const isValid = await passwordService.compare(
        currentPassword,
        user.password
      );
      
      if (!isValid) {
        return res.status(400).json({
          error: {
            code: 'INVALID_PASSWORD',
            message: '当前密码错误',
          },
        });
      }
      
      // 验证新密码强度
      const validation = passwordService.validateStrength(newPassword);
      
      if (!validation.valid) {
        return res.status(400).json({
          error: {
            code: 'WEAK_PASSWORD',
            message: '密码强度不足',
            details: validation.errors.map(msg => ({ message: msg })),
          },
        });
      }
      
      // 更新密码
      const hashedPassword = await passwordService.hash(newPassword);
      await user.update({ password: hashedPassword });
      
      res.json({
        message: '密码修改成功',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
```

### 4.2 路由配置

```typescript
// src/routes/auth.routes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// 注册验证规则
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
    .isLength({ min: 8 }).withMessage('密码至少8个字符'),
];

// 登录验证规则
const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('邮箱不能为空')
    .isEmail().withMessage('邮箱格式不正确'),
  
  body('password')
    .notEmpty().withMessage('密码不能为空'),
];

// 修改密码验证规则
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('当前密码不能为空'),
  
  body('newPassword')
    .notEmpty().withMessage('新密码不能为空')
    .isLength({ min: 8 }).withMessage('新密码至少8个字符'),
];

// 路由定义
router.post('/register', registerValidation, validate, authController.register);
router.post('/login', loginValidation, validate, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

// 需要认证的路由
router.get('/me', authenticate, authController.getCurrentUser);
router.put(
  '/password',
  authenticate,
  changePasswordValidation,
  validate,
  authController.changePassword
);

export default router;
```

---

## 五、令牌黑名单

### 5.1 Redis 实现

```typescript
// src/services/tokenBlacklist.ts
import Redis from 'ioredis';
import { jwtService } from '../utils/jwt';

class TokenBlacklistService {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }
  
  /**
   * 将令牌加入黑名单
   */
  async addToBlacklist(token: string): Promise<void> {
    const decoded = jwtService.decode(token);
    
    if (!decoded || !decoded.exp) return;
    
    // 计算剩余有效时间
    const remainingTime = decoded.exp - Math.floor(Date.now() / 1000);
    
    if (remainingTime > 0) {
      await this.redis.set(
        `blacklist:${token}`,
        '1',
        'EX',
        remainingTime
      );
    }
  }
  
  /**
   * 检查令牌是否在黑名单中
   */
  async isBlacklisted(token: string): Promise<boolean> {
    const result = await this.redis.get(`blacklist:${token}`);
    return result !== null;
  }
  
  /**
   * 将用户的所有令牌加入黑名单（强制登出）
   */
  async blacklistAllUserTokens(userId: string): Promise<void> {
    // 设置用户令牌版本，所有旧令牌都将失效
    await this.redis.set(`user:token:version:${userId}`, Date.now().toString());
  }
  
  /**
   * 获取用户令牌版本
   */
  async getUserTokenVersion(userId: string): Promise<number> {
    const version = await this.redis.get(`user:token:version:${userId}`);
    return version ? parseInt(version, 10) : 0;
  }
}

export const tokenBlacklistService = new TokenBlacklistService();
```

### 5.2 黑名单中间件

```typescript
// src/middleware/blacklist.ts
import { Request, Response, NextFunction } from 'express';
import { tokenBlacklistService } from '../services/tokenBlacklist';

/**
 * 检查令牌黑名单中间件
 */
export async function checkBlacklist(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    
    const isBlacklisted = await tokenBlacklistService.isBlacklisted(token);
    
    if (isBlacklisted) {
      return res.status(401).json({
        error: {
          code: 'TOKEN_REVOKED',
          message: '令牌已被撤销',
        },
      });
    }
  }
  
  next();
}
```

---

## 六、OAuth 2.0 集成

### 6.1 OAuth 概述

```
OAuth 2.0 授权流程：

┌─────────┐                              ┌─────────┐
│  用户   │                              │ 第三方  │
└────┬────┘                              │ 服务    │
     │                                   └────┬────┘
     │  1. 点击"使用XX登录"                   │
     │───────────────────────────────────────>│
     │                                        │
     │  2. 重定向到授权页面                    │
     │<───────────────────────────────────────│
     │                                        │
     │  3. 用户授权                           │
     │───────────────────────────────────────>│
     │                                        │
     │  4. 返回授权码                         │
     │<───────────────────────────────────────│
     │                                        │
     │  5. 使用授权码换取令牌                  │
     │───────────────────────────────────────>│
     │                                        │
     │  6. 返回访问令牌                        │
     │<───────────────────────────────────────│
```

### 6.2 Google OAuth 实现

```typescript
// src/services/oauth/google.ts
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

class GoogleOAuthService {
  /**
   * 生成授权 URL
   */
  getAuthUrl(state: string): string {
    return client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      state,
    });
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(code: string): Promise<{
    id: string;
    email: string;
    name: string;
    picture: string;
  }> {
    // 使用授权码获取令牌
    const { tokens } = await client.getToken(code);
    
    // 验证 ID 令牌
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload()!;
    
    return {
      id: payload.sub,
      email: payload.email!,
      name: payload.name!,
      picture: payload.picture!,
    };
  }
}

export const googleOAuthService = new GoogleOAuthService();
```

### 6.3 OAuth 控制器

```typescript
// src/controllers/oauth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { googleOAuthService } from '../services/oauth/google';
import { User } from '../models/user.model';
import { jwtService } from '../utils/jwt';

class OAuthController {
  /**
   * Google 登录
   */
  async googleLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.query;
      
      // 获取 Google 用户信息
      const googleUser = await googleOAuthService.getUserInfo(code as string);
      
      // 查找或创建用户
      let user = await User.findOne({
        where: { googleId: googleUser.id },
      });
      
      if (!user) {
        // 检查邮箱是否已注册
        user = await User.findOne({
          where: { email: googleUser.email },
        });
        
        if (user) {
          // 关联 Google 账号
          await user.update({ googleId: googleUser.id });
        } else {
          // 创建新用户
          user = await User.create({
            email: googleUser.email,
            name: googleUser.name,
            googleId: googleUser.id,
            avatar: googleUser.picture,
            role: 'user',
            status: 'active',
            emailVerified: true,
          });
        }
      }
      
      // 生成令牌
      const tokens = jwtService.generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
      
      // 重定向到前端，携带令牌
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?` +
        `accessToken=${tokens.accessToken}&` +
        `refreshToken=${tokens.refreshToken}`;
      
      res.redirect(redirectUrl);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 发起 Google 授权
   */
  async googleAuth(req: Request, res: Response) {
    const state = Math.random().toString(36).substring(7);
    const authUrl = googleOAuthService.getAuthUrl(state);
    res.redirect(authUrl);
  }
}

export const oauthController = new OAuthController();
```

---

## 七、安全最佳实践

### 7.1 安全配置清单

```typescript
// 安全配置建议

// 1. 使用强密钥
const JWT_SECRET = crypto.randomBytes(64).toString('hex');

// 2. 短期访问令牌 + 长期刷新令牌
const JWT_EXPIRES_IN = '15m';      // 访问令牌：15分钟
const JWT_REFRESH_EXPIRES_IN = '7d'; // 刷新令牌：7天

// 3. 使用 HTTPS
// 生产环境必须使用 HTTPS

// 4. 安全存储
// - 浏览器：使用 HttpOnly Cookie 或内存存储
// - 移动端：使用安全存储（Keychain/Keystore）

// 5. 令牌传输
// - 使用 Authorization 头
// - 不要在 URL 中传输令牌

// 6. 敏感操作二次验证
// 修改密码、删除账户等操作要求重新验证

// 7. 登录限制
// - 限制登录尝试次数
// - 异常登录提醒
// - 可疑 IP 封禁
```

### 7.2 Cookie 配置

```typescript
// src/config/cookie.ts
import { CookieOptions } from 'express';

// 安全 Cookie 配置
export const secureCookieOptions: CookieOptions = {
  httpOnly: true,      // 防止 XSS 攻击
  secure: true,        // 仅 HTTPS
  sameSite: 'strict',  // 防止 CSRF 攻击
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
  path: '/',
  domain: process.env.COOKIE_DOMAIN,
};

// 开发环境配置
export const devCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

// 使用 Cookie 存储令牌
res.cookie('refreshToken', refreshToken, secureCookieOptions);
```

### 7.3 CSRF 防护

```typescript
import csrf from 'csurf';

// CSRF 保护中间件
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  },
});

// 获取 CSRF Token
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// 需要 CSRF 保护的路由
app.post('/api/sensitive-action', csrfProtection, handler);
```

---

## 八、前端集成

### 8.1 Axios 拦截器

```typescript
// src/utils/api.ts
import axios, { AxiosInstance, AxiosError } from 'axios';

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：添加令牌
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：处理令牌刷新
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config!;
    
    // 令牌过期
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 等待令牌刷新完成
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        // 跳转到登录页
        window.location.href = '/login';
        return Promise.reject(error);
      }
      
      try {
        // 刷新令牌
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh-token`,
          { refreshToken }
        );
        
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        // 存储新令牌
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        // 重试失败的请求
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        // 处理等待队列
        failedQueue.forEach(({ resolve }) => resolve(accessToken));
        failedQueue = [];
        
        return api(originalRequest);
      } catch (refreshError) {
        // 刷新失败，跳转到登录页
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

### 8.2 React Hook

```typescript
// src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  
  // 获取当前用户
  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      setState({
        user: response.data.data,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);
  
  // 登录
  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { user, accessToken, refreshToken } = response.data.data;
    
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    setState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
    
    return user;
  }, []);
  
  // 登出
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);
  
  // 初始化
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      fetchUser();
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [fetchUser]);
  
  return {
    ...state,
    login,
    logout,
    fetchUser,
  };
}
```

---

*本文档最后更新于 2026年3月*

---

## 九、错误处理最佳实践

### 9.1 认证错误类型

```typescript
// 自定义认证错误类
class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// 具体错误类型
class InvalidTokenError extends AuthError {
  constructor(message = '无效的认证令牌') {
    super('INVALID_TOKEN', message, 401);
  }
}

class ExpiredTokenError extends AuthError {
  constructor(message = '认证令牌已过期') {
    super('TOKEN_EXPIRED', message, 401);
  }
}

class MissingTokenError extends AuthError {
  constructor(message = '未提供认证令牌') {
    super('MISSING_TOKEN', message, 401);
  }
}

class InvalidCredentialsError extends AuthError {
  constructor(message = '邮箱或密码错误') {
    super('INVALID_CREDENTIALS', message, 401);
  }
}

class AccountDisabledError extends AuthError {
  constructor(message = '账户已被禁用') {
    super('ACCOUNT_DISABLED', message, 403);
  }
}

class TokenRevokedError extends AuthError {
  constructor(message = '令牌已被撤销') {
    super('TOKEN_REVOKED', message, 401);
  }
}

class RefreshTokenError extends AuthError {
  constructor(message = '刷新令牌无效') {
    super('INVALID_REFRESH_TOKEN', message, 401);
  }
}
```

### 9.2 错误处理中间件

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// 认证错误处理中间件
export function authErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // 处理认证错误
  if (err instanceof AuthError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  // 处理 JWT 错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: '无效的认证令牌',
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: '认证令牌已过期',
        expiredAt: (err as jwt.TokenExpiredError).expiredAt,
      },
    });
  }

  if (err.name === 'NotBeforeError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_NOT_ACTIVE',
        message: '令牌尚未生效',
      },
    });
  }

  // 传递给下一个错误处理器
  next(err);
}

// 异步错误包装器
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

### 9.3 完整的错误处理示例

```typescript
// 认证控制器中的错误处理
class AuthController {
  // 登录
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      // 验证输入
      if (!email || !password) {
        throw new AuthError('MISSING_CREDENTIALS', '请提供邮箱和密码', 400);
      }

      // 查找用户
      const user = await User.findOne({ where: { email } });

      if (!user) {
        throw new InvalidCredentialsError();
      }

      // 检查账户状态
      if (user.status !== 'active') {
        throw new AccountDisabledError();
      }

      // 验证密码
      const isValid = await passwordService.compare(password, user.password);

      if (!isValid) {
        // 记录失败尝试
        await this.recordFailedAttempt(user.id);
        throw new InvalidCredentialsError();
      }

      // 检查是否需要二次验证
      if (user.twoFactorEnabled) {
        return res.json({
          requiresTwoFactor: true,
          tempToken: this.generateTempToken(user.id),
        });
      }

      // 生成令牌
      const tokens = jwtService.generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // 记录登录
      await this.recordLogin(user.id, req.ip, req.headers['user-agent']);

      res.json({
        success: true,
        data: {
          user: this.sanitizeUser(user),
          ...tokens,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // 刷新令牌
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new RefreshTokenError('未提供刷新令牌');
      }

      // 验证刷新令牌
      let payload;
      try {
        payload = jwtService.verify(refreshToken);
      } catch (err) {
        throw new RefreshTokenError('刷新令牌无效或已过期');
      }

      // 检查令牌类型
      if (payload.type !== 'refresh') {
        throw new RefreshTokenError('无效的令牌类型');
      }

      // 检查黑名单
      if (await tokenBlacklistService.isBlacklisted(refreshToken)) {
        throw new TokenRevokedError();
      }

      // 获取用户
      const user = await User.findByPk(payload.userId);

      if (!user || user.status !== 'active') {
        throw new RefreshTokenError('用户不存在或已被禁用');
      }

      // 将旧刷新令牌加入黑名单
      await tokenBlacklistService.blacklist(refreshToken);

      // 生成新令牌
      const tokens = jwtService.generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      res.json({
        success: true,
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }
}
```

---

## 十、安全性考虑

### 10.1 密码安全

```typescript
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const SALT_ROUNDS = 12;

class PasswordService {
  // 哈希密码
  async hash(password: string): Promise<string> {
    // 验证密码强度
    const strength = this.checkStrength(password);
    if (strength.score < 3) {
      throw new Error(`密码强度不足: ${strength.feedback.join(', ')}`);
    }

    return bcrypt.hash(password, SALT_ROUNDS);
  }

  // 验证密码
  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // 检查密码强度
  checkStrength(password: string): { score: number; feedback: string[] } {
    let score = 0;
    const feedback: string[] = [];

    if (password.length >= 8) score++;
    else feedback.push('密码长度至少8位');

    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    else feedback.push('需包含小写字母');

    if (/[A-Z]/.test(password)) score++;
    else feedback.push('需包含大写字母');

    if (/\d/.test(password)) score++;
    else feedback.push('需包含数字');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    else feedback.push('需包含特殊字符');

    // 检查常见密码
    const commonPasswords = ['password', '123456', 'qwerty', 'abc123'];
    if (commonPasswords.some(p => password.toLowerCase().includes(p))) {
      score = Math.max(0, score - 2);
      feedback.push('不能包含常见密码');
    }

    // 检查连续字符
    if (/(.)\1{2,}/.test(password)) {
      score = Math.max(0, score - 1);
      feedback.push('不能包含连续重复字符');
    }

    return { score, feedback };
  }

  // 生成随机密码
  generate(length: number = 16): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';

    // 确保包含各类字符
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)];

    for (let i = 4; i < length; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }

    // 打乱顺序
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}

export const passwordService = new PasswordService();
```

### 10.2 令牌安全

```typescript
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

class JwtService {
  private config = {
    accessTokenSecret: process.env.JWT_ACCESS_SECRET!,
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET!,
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d',
    issuer: process.env.JWT_ISSUER || 'api.example.com',
  };

  // 生成访问令牌
  generateAccessToken(payload: { userId: string; email: string; role: string }): string {
    return jwt.sign(
      {
        ...payload,
        type: 'access',
        jti: crypto.randomBytes(16).toString('hex'), // 唯一标识
      },
      this.config.accessTokenSecret,
      {
        expiresIn: this.config.accessTokenExpiry,
        issuer: this.config.issuer,
        subject: payload.userId,
      }
    );
  }

  // 生成刷新令牌
  generateRefreshToken(userId: string): string {
    return jwt.sign(
      {
        userId,
        type: 'refresh',
        jti: crypto.randomBytes(16).toString('hex'),
      },
      this.config.refreshTokenSecret,
      {
        expiresIn: this.config.refreshTokenExpiry,
        issuer: this.config.issuer,
        subject: userId,
      }
    );
  }

  // 验证令牌
  verify(token: string, type: 'access' | 'refresh' = 'access'): any {
    const secret = type === 'access'
      ? this.config.accessTokenSecret
      : this.config.refreshTokenSecret;

    try {
      const payload = jwt.verify(token, secret, {
        issuer: this.config.issuer,
      }) as any;

      // 验证令牌类型
      if (payload.type !== type) {
        throw new Error('无效的令牌类型');
      }

      return payload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new ExpiredTokenError();
      }
      if (err instanceof jwt.JsonWebTokenError) {
        throw new InvalidTokenError();
      }
      throw err;
    }
  }

  // 解码令牌（不验证）
  decode(token: string): any {
    return jwt.decode(token);
  }

  // 获取令牌剩余时间
  getTimeToExpiry(token: string): number {
    const decoded = this.decode(token) as any;
    if (!decoded?.exp) return 0;

    return Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
  }

  // 检查令牌是否即将过期
  isExpiringSoon(token: string, thresholdSeconds: number = 300): boolean {
    return this.getTimeToExpiry(token) < thresholdSeconds;
  }
}

export const jwtService = new JwtService();
```

### 10.3 防护措施

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// 登录尝试限制
class LoginAttemptService {
  private static PREFIX = 'login_attempts:';
  private static MAX_ATTEMPTS = 5;
  private static LOCKOUT_DURATION = 15 * 60; // 15分钟

  // 记录登录尝试
  async recordAttempt(identifier: string): Promise<{ attempts: number; locked: boolean }> {
    const key = `${LoginAttemptService.PREFIX}${identifier}`;
    const attempts = await redis.incr(key);

    // 设置过期时间
    if (attempts === 1) {
      await redis.expire(key, LoginAttemptService.LOCKOUT_DURATION);
    }

    // 检查是否锁定
    const locked = attempts >= LoginAttemptService.MAX_ATTEMPTS;

    return { attempts, locked };
  }

  // 检查是否锁定
  async isLocked(identifier: string): Promise<boolean> {
    const key = `${LoginAttemptService.PREFIX}${identifier}`;
    const attempts = await redis.get(key);

    return attempts !== null && parseInt(attempts) >= LoginAttemptService.MAX_ATTEMPTS;
  }

  // 清除尝试记录
  async clearAttempts(identifier: string): Promise<void> {
    const key = `${LoginAttemptService.PREFIX}${identifier}`;
    await redis.del(key);
  }

  // 获取剩余锁定时间
  async getLockoutRemaining(identifier: string): Promise<number> {
    const key = `${LoginAttemptService.PREFIX}${identifier}`;
    return redis.ttl(key);
  }
}

// 令牌黑名单
class TokenBlacklistService {
  private static PREFIX = 'blacklist:';
  private static USER_PREFIX = 'user_tokens:';

  // 将令牌加入黑名单
  async blacklist(token: string): Promise<void> {
    const decoded = jwtService.decode(token);
    if (!decoded?.exp) return;

    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await redis.set(`${TokenBlacklistService.PREFIX}${token}`, '1', 'EX', ttl);
    }
  }

  // 检查令牌是否在黑名单
  async isBlacklisted(token: string): Promise<boolean> {
    const result = await redis.get(`${TokenBlacklistService.PREFIX}${token}`);
    return result !== null;
  }

  // 将用户所有令牌加入黑名单（强制登出）
  async blacklistAllUserTokens(userId: string): Promise<void> {
    // 更新用户令牌版本
    await redis.set(`${TokenBlacklistService.USER_PREFIX}${userId}`, Date.now().toString());
  }

  // 获取用户令牌版本
  async getUserTokenVersion(userId: string): Promise<number> {
    const version = await redis.get(`${TokenBlacklistService.USER_PREFIX}${userId}`);
    return version ? parseInt(version) : 0;
  }
}

// 设备管理
class DeviceService {
  private static PREFIX = 'user_devices:';

  // 记录设备
  async registerDevice(userId: string, deviceInfo: {
    deviceId: string;
    userAgent: string;
    ip: string;
  }): Promise<void> {
    const key = `${DeviceService.PREFIX}${userId}`;
    const devices = await this.getDevices(userId);

    // 检查设备数量限制
    if (devices.length >= 5 && !devices.some(d => d.deviceId === deviceInfo.deviceId)) {
      throw new Error('设备数量已达上限');
    }

    // 添加或更新设备
    const existingIndex = devices.findIndex(d => d.deviceId === deviceInfo.deviceId);
    const device = {
      ...deviceInfo,
      lastActive: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      devices[existingIndex] = device;
    } else {
      devices.push(device);
    }

    await redis.set(key, JSON.stringify(devices));
  }

  // 获取用户设备列表
  async getDevices(userId: string): Promise<any[]> {
    const key = `${DeviceService.PREFIX}${userId}`;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : [];
  }

  // 移除设备
  async removeDevice(userId: string, deviceId: string): Promise<void> {
    const key = `${DeviceService.PREFIX}${userId}`;
    const devices = await this.getDevices(userId);
    const filtered = devices.filter(d => d.deviceId !== deviceId);
    await redis.set(key, JSON.stringify(filtered));
  }
}

export const loginAttemptService = new LoginAttemptService();
export const tokenBlacklistService = new TokenBlacklistService();
export const deviceService = new DeviceService();
```

---

## 十一、性能优化技巧

### 11.1 令牌验证优化

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// 令牌验证缓存
class TokenVerificationCache {
  private static PREFIX = 'token_valid:';
  private static TTL = 60; // 60秒缓存

  // 缓存验证结果
  async cacheValid(token: string, payload: any): Promise<void> {
    const key = `${TokenVerificationCache.PREFIX}${this.hashToken(token)}`;
    await redis.set(key, JSON.stringify(payload), 'EX', TokenVerificationCache.TTL);
  }

  // 获取缓存的验证结果
  async getCached(token: string): Promise<any | null> {
    const key = `${TokenVerificationCache.PREFIX}${this.hashToken(token)}`;
    const cached = await redis.get(key);

    if (cached) {
      return JSON.parse(cached);
    }

    return null;
  }

  // 使缓存失效
  async invalidate(token: string): Promise<void> {
    const key = `${TokenVerificationCache.PREFIX}${this.hashToken(token)}`;
    await redis.del(key);
  }

  // 哈希令牌（避免存储完整令牌）
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

// 优化的认证中间件
async function optimizedAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = extractToken(req);

  if (!token) {
    throw new MissingTokenError();
  }

  // 先检查缓存
  const cache = new TokenVerificationCache();
  const cachedPayload = await cache.getCached(token);

  if (cachedPayload) {
    req.user = cachedPayload;
    return next();
  }

  // 检查黑名单
  if (await tokenBlacklistService.isBlacklisted(token)) {
    throw new TokenRevokedError();
  }

  // 验证令牌
  const payload = jwtService.verify(token);

  // 缓存验证结果
  await cache.cacheValid(token, payload);

  req.user = payload;
  next();
}
```

### 11.2 批量令牌操作

```typescript
// 批量验证令牌
async function batchVerifyTokens(tokens: string[]): Promise<Map<string, any>> {
  const results = new Map();
  const cache = new TokenVerificationCache();

  // 先检查缓存
  const uncachedTokens: string[] = [];

  for (const token of tokens) {
    const cached = await cache.getCached(token);
    if (cached) {
      results.set(token, cached);
    } else {
      uncachedTokens.push(token);
    }
  }

  // 批量验证未缓存的令牌
  const verifyPromises = uncachedTokens.map(async token => {
    try {
      const payload = jwtService.verify(token);
      await cache.cacheValid(token, payload);
      return { token, payload };
    } catch {
      return { token, payload: null };
    }
  });

  const verifyResults = await Promise.all(verifyPromises);

  for (const { token, payload } of verifyResults) {
    results.set(token, payload);
  }

  return results;
}
```

### 11.3 连接池配置

```typescript
import Redis from 'ioredis';

// Redis 连接池配置
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),

  // 连接池
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  retryDelayOnClusterDown: 100,

  // 性能优化
  enableOfflineQueue: true,
  connectTimeout: 10000,
  lazyConnect: false,
  keepAlive: 30000,
};

// 创建连接
const redis = new Redis(redisConfig);

// 错误处理
redis.on('error', (err) => {
  console.error('Redis 连接错误:', err);
});

redis.on('connect', () => {
  console.log('Redis 连接成功');
});
```

---

## 十二、生产环境部署建议

### 12.1 环境配置

```typescript
// config/jwt.ts
export const jwtConfig = {
  // 访问令牌配置
  accessToken: {
    secret: process.env.JWT_ACCESS_SECRET!,
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  },

  // 刷新令牌配置
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET!,
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // 发行者
  issuer: process.env.JWT_ISSUER || 'api.example.com',

  // 受众
  audience: process.env.JWT_AUDIENCE || 'app.example.com',
};

// 验证配置
function validateConfig() {
  const required = [
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
  ];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`缺少必要的环境变量: ${key}`);
    }
  }

  // 检查密钥强度
  if (process.env.JWT_ACCESS_SECRET!.length < 32) {
    throw new Error('JWT_ACCESS_SECRET 长度不足，至少需要32字符');
  }

  if (process.env.JWT_REFRESH_SECRET!.length < 32) {
    throw new Error('JWT_REFRESH_SECRET 长度不足，至少需要32字符');
  }
}

validateConfig();
```

### 12.2 密钥轮换

```typescript
class KeyRotationService {
  private currentKey: string;
  private previousKey: string | null = null;

  constructor() {
    this.currentKey = process.env.JWT_ACCESS_SECRET!;
  }

  // 轮换密钥
  async rotate(newKey: string): Promise<void> {
    this.previousKey = this.currentKey;
    this.currentKey = newKey;

    // 更新环境变量
    process.env.JWT_ACCESS_SECRET = newKey;
    process.env.JWT_PREVIOUS_SECRET = this.previousKey;

    // 通知所有服务
    await this.notifyServices();
  }

  // 使用当前或旧密钥验证
  verifyWithFallback(token: string): any {
    // 先尝试当前密钥
    try {
      return jwt.verify(token, this.currentKey);
    } catch {}

    // 回退到旧密钥
    if (this.previousKey) {
      try {
        return jwt.verify(token, this.previousKey);
      } catch {}
    }

    throw new InvalidTokenError();
  }

  // 通知服务
  private async notifyServices(): Promise<void> {
    // 发送密钥更新通知
    // 可以通过消息队列或 HTTP 请求
  }
}
```

### 12.3 监控与日志

```typescript
// 认证日志服务
class AuthLogService {
  // 记录登录
  async logLogin(userId: string, ip: string, userAgent: string, success: boolean): Promise<void> {
    const log = {
      type: 'LOGIN',
      userId,
      ip,
      userAgent,
      success,
      timestamp: new Date().toISOString(),
    };

    // 存储到数据库
    await AuthLog.create(log);

    // 发送到日志服务
    console.log(JSON.stringify(log));
  }

  // 记录令牌刷新
  async logTokenRefresh(userId: string, ip: string): Promise<void> {
    const log = {
      type: 'TOKEN_REFRESH',
      userId,
      ip,
      timestamp: new Date().toISOString(),
    };

    await AuthLog.create(log);
  }

  // 记录登出
  async logLogout(userId: string, ip: string): Promise<void> {
    const log = {
      type: 'LOGOUT',
      userId,
      ip,
      timestamp: new Date().toISOString(),
    };

    await AuthLog.create(log);
  }

  // 检测异常登录
  async detectAnomalousLogin(userId: string, ip: string): Promise<boolean> {
    // 获取最近的登录记录
    const recentLogins = await AuthLog.findAll({
      where: { userId, type: 'LOGIN', success: true },
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    // 检查新IP
    const knownIPs = new Set(recentLogins.map(l => l.ip));
    if (!knownIPs.has(ip)) {
      return true;
    }

    return false;
  }
}

// 监控指标
class AuthMetrics {
  private static loginAttempts = 0;
  private static successfulLogins = 0;
  private static failedLogins = 0;
  private static tokenRefreshes = 0;

  static recordLoginAttempt(): void {
    this.loginAttempts++;
  }

  static recordSuccessfulLogin(): void {
    this.successfulLogins++;
  }

  static recordFailedLogin(): void {
    this.failedLogins++;
  }

  static recordTokenRefresh(): void {
    this.tokenRefreshes++;
  }

  static getMetrics() {
    return {
      loginAttempts: this.loginAttempts,
      successfulLogins: this.successfulLogins,
      failedLogins: this.failedLogins,
      tokenRefreshes: this.tokenRefreshes,
      successRate: this.loginAttempts > 0
        ? (this.successfulLogins / this.loginAttempts * 100).toFixed(2) + '%'
        : 'N/A',
    };
  }
}
```

---

## 十三、常见面试问题

### 13.1 JWT 基础问题

**Q1: JWT 的优缺点是什么？**

```
答案：
优点：
1. 无状态：服务端不需要存储会话信息
2. 跨域友好：适合分布式系统和微服务
3. 自包含：令牌本身包含用户信息
4. 性能好：不需要每次查询数据库

缺点：
1. 无法主动失效：令牌签发后无法撤销
2. 续期问题：需要刷新令牌机制
3. 安全风险：令牌泄露后难以处理
4. 体积大：包含更多信息，请求开销大
```

**Q2: JWT 和 Session 的区别？**

```
答案：
存储位置：
- JWT：客户端存储
- Session：服务端存储

扩展性：
- JWT：天然支持分布式
- Session：需要共享存储

安全性：
- JWT：令牌泄露风险
- Session：CSRF 风险

性能：
- JWT：不需要查询存储
- Session：需要查询存储

适用场景：
- JWT：移动应用、微服务、无状态API
- Session：传统Web应用、需要即时撤销
```

**Q3: 如何实现 JWT 的安全撤销？**

```typescript
// 方案1：令牌黑名单
class TokenBlacklist {
  async revoke(token: string): Promise<void> {
    const decoded = jwt.decode(token) as any;
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);

    if (ttl > 0) {
      await redis.set(`blacklist:${token}`, '1', 'EX', ttl);
    }
  }

  async isRevoked(token: string): Promise<boolean> {
    return await redis.exists(`blacklist:${token}`) === 1;
  }
}

// 方案2：令牌版本
class TokenVersion {
  async incrementVersion(userId: string): Promise<void> {
    await redis.incr(`token_version:${userId}`);
  }

  async verifyVersion(userId: string, version: number): Promise<boolean> {
    const currentVersion = await redis.get(`token_version:${userId}`);
    return parseInt(currentVersion || '0') === version;
  }
}

// 方案3：短期令牌 + 刷新令牌
// 访问令牌有效期短（15分钟），刷新令牌可撤销
```

### 13.2 安全问题

**Q4: 如何防止 JWT 被盗用？**

```typescript
// 1. 使用 HTTPS
// 生产环境必须使用 HTTPS

// 2. 设置安全 Cookie
res.cookie('token', token, {
  httpOnly: true,  // 防止 XSS
  secure: true,    // 仅 HTTPS
  sameSite: 'strict', // 防止 CSRF
});

// 3. 绑定设备信息
function generateToken(user: User, device: DeviceInfo) {
  return jwt.sign({
    userId: user.id,
    deviceId: device.id, // 绑定设备
    // ...
  }, secret);
}

// 4. 检测异常登录
async function detectAnomaly(userId: string, ip: string) {
  const recentIPs = await getRecentLoginIPs(userId);
  if (!recentIPs.includes(ip)) {
    await sendSecurityAlert(userId, ip);
  }
}

// 5. 敏感操作二次验证
async function sensitiveAction(req: Request, res: Response) {
  // 要求重新验证密码或 OTP
  const verified = await verifySecondFactor(req.body.otp);
  if (!verified) {
    throw new Error('二次验证失败');
  }
  // 执行敏感操作
}
```

**Q5: 如何实现多设备登录管理？**

```typescript
class DeviceManager {
  // 注册设备
  async registerDevice(userId: string, deviceInfo: DeviceInfo): Promise<string> {
    const deviceId = crypto.randomUUID();

    // 检查设备数量限制
    const devices = await this.getDevices(userId);
    if (devices.length >= 5) {
      // 移除最旧的设备
      await this.removeDevice(userId, devices[0].id);
    }

    // 存储设备信息
    await redis.hset(`devices:${userId}`, deviceId, JSON.stringify({
      ...deviceInfo,
      lastActive: new Date().toISOString(),
    }));

    return deviceId;
  }

  // 获取用户设备列表
  async getDevices(userId: string): Promise<DeviceInfo[]> {
    const devices = await redis.hgetall(`devices:${userId}`);
    return Object.entries(devices).map(([id, info]) => ({
      id,
      ...JSON.parse(info),
    }));
  }

  // 移除设备（强制登出）
  async removeDevice(userId: string, deviceId: string): Promise<void> {
    await redis.hdel(`devices:${userId}`, deviceId);

    // 将该设备的令牌加入黑名单
    await this.blacklistDeviceTokens(userId, deviceId);
  }

  // 验证设备
  async verifyDevice(userId: string, deviceId: string): Promise<boolean> {
    const device = await redis.hget(`devices:${userId}`, deviceId);
    return device !== null;
  }
}
```

---

## 十四、实战案例

### 14.1 完整的认证系统

```typescript
// 完整的认证服务
class AuthService {
  constructor(
    private userRepository: UserRepository,
    private tokenService: TokenService,
    private passwordService: PasswordService,
    private deviceService: DeviceService,
    private loginAttemptService: LoginAttemptService,
    private emailService: EmailService,
  ) {}

  // 注册
  async register(data: RegisterDto): Promise<AuthResult> {
    // 验证输入
    this.validateRegisterData(data);

    // 检查邮箱是否已注册
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('该邮箱已被注册');
    }

    // 哈希密码
    const hashedPassword = await this.passwordService.hash(data.password);

    // 创建用户
    const user = await this.userRepository.create({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      status: 'pending_verification',
    });

    // 发送验证邮件
    await this.sendVerificationEmail(user);

    return {
      success: true,
      message: '注册成功，请查收验证邮件',
    };
  }

  // 登录
  async login(data: LoginDto, context: LoginContext): Promise<AuthResult> {
    // 检查是否被锁定
    if (await this.loginAttemptService.isLocked(data.email)) {
      const remaining = await this.loginAttemptService.getLockoutRemaining(data.email);
      throw new Error(`账户已锁定，请${remaining}秒后重试`);
    }

    // 查找用户
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      await this.loginAttemptService.recordAttempt(data.email);
      throw new InvalidCredentialsError();
    }

    // 检查账户状态
    if (user.status !== 'active') {
      throw new AccountDisabledError();
    }

    // 验证密码
    const isValid = await this.passwordService.compare(data.password, user.password);
    if (!isValid) {
      await this.loginAttemptService.recordAttempt(data.email);
      throw new InvalidCredentialsError();
    }

    // 清除登录尝试记录
    await this.loginAttemptService.clearAttempts(data.email);

    // 注册设备
    const deviceId = await this.deviceService.registerDevice(user.id, {
      userAgent: context.userAgent,
      ip: context.ip,
    });

    // 检测异常登录
    const isAnomalous = await this.detectAnomalousLogin(user.id, context.ip);
    if (isAnomalous) {
      await this.emailService.sendSecurityAlert(user.email, context);
    }

    // 生成令牌
    const tokens = await this.tokenService.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      deviceId,
    });

    return {
      success: true,
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  // 登出
  async logout(userId: string, deviceId: string, token: string): Promise<void> {
    // 将当前令牌加入黑名单
    await this.tokenService.blacklist(token);

    // 更新设备最后活动时间
    await this.deviceService.updateLastActive(userId, deviceId);
  }

  // 强制登出所有设备
  async logoutAll(userId: string): Promise<void> {
    // 使所有令牌失效
    await this.tokenService.invalidateAllUserTokens(userId);

    // 清除设备列表
    await this.deviceService.clearDevices(userId);
  }

  // 刷新令牌
  async refreshToken(refreshToken: string): Promise<TokenPair> {
    // 验证刷新令牌
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);

    // 检查用户状态
    const user = await this.userRepository.findById(payload.userId);
    if (!user || user.status !== 'active') {
      throw new UnauthorizedError('用户不存在或已被禁用');
    }

    // 将旧刷新令牌加入黑名单
    await this.tokenService.blacklist(refreshToken);

    // 生成新令牌
    return this.tokenService.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      deviceId: payload.deviceId,
    });
  }

  // 修改密码
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('用户');
    }

    // 验证当前密码
    const isValid = await this.passwordService.compare(currentPassword, user.password);
    if (!isValid) {
      throw new Error('当前密码错误');
    }

    // 哈希新密码
    const hashedPassword = await this.passwordService.hash(newPassword);

    // 更新密码
    await this.userRepository.update(userId, { password: hashedPassword });

    // 使所有令牌失效
    await this.tokenService.invalidateAllUserTokens(userId);
  }

  // 忘记密码
  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // 不暴露用户是否存在
      return;
    }

    // 生成重置令牌
    const resetToken = await this.tokenService.generateResetToken(user.id);

    // 发送重置邮件
    await this.emailService.sendPasswordResetEmail(user.email, resetToken);
  }

  // 重置密码
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // 验证重置令牌
    const userId = await this.tokenService.verifyResetToken(token);

    // 哈希新密码
    const hashedPassword = await this.passwordService.hash(newPassword);

    // 更新密码
    await this.userRepository.update(userId, { password: hashedPassword });

    // 使所有令牌失效
    await this.tokenService.invalidateAllUserTokens(userId);
  }

  private sanitizeUser(user: User): SafeUser {
    const { password, ...safeUser } = user;
    return safeUser;
  }
}
```

---

*本文档最后更新于 2026年3月*