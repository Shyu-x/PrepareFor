# API设计与认证模块完全指南

## 一、概述

本教学文档系统讲解现代Web应用API设计原则与认证授权方案，涵盖2026年3月最新的技术最佳实践。所有技术点均经过联网搜索验证，结合FastDocument实际项目代码进行讲解。

## 二、RESTful API设计原则

### 2.1 REST架构风格

REST（Representational State Transfer）是目前最流行的Web API设计风格，核心概念包括：

| 概念 | 说明 |
|------|------|
| **资源（Resource）** | API管理的核心实体，如用户、文档、项目 |
| **表现层（Representation）** | 资源的表现形式，如JSON、XML |
| **状态转移（State Transfer）** | 通过HTTP方法实现资源状态变化 |

### 2.2 HTTP方法语义

RESTful API正确使用HTTP方法表达操作语义：

```typescript
// FastDocument 文档控制器示例
@Controller('documents')
export class DocumentsController {
  // GET /documents - 获取文档列表
  @Get()
  findAll(@Request() request: any) {
    return this.documentsService.findAll(request.user.sub);
  }

  // GET /documents/:id - 获取单个文档
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  // POST /documents - 创建新文档
  @Post()
  create(@Body() body: CreateDocumentDto) {
    return this.documentsService.create(body);
  }

  // PATCH /documents/:id - 部分更新文档
  @Patch(':id')
  update(@Param('id') id: string, @Body() update: UpdateDocumentDto) {
    return this.documentsService.update(id, update);
  }

  // DELETE /documents/:id - 删除文档
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }

  // POST /documents/:id/toggle-star - 资源特定操作（动作）
  @Post(':id/toggle-star')
  toggleStar(@Param('id') id: string) {
    return this.documentsService.toggleStar(id);
  }
}
```

### 2.3 资源命名规范

| 规则 | 正确示例 | 错误示例 |
|------|----------|----------|
| **使用名词复数** | `/users`, `/documents` | `/getUsers`, `/getAllUser` |
| **使用小写** | `/documents` | `/Documents` |
| **使用连字符** | `/user-profiles` | `/user_profiles` |
| **层级关系** | `/users/123/documents` | `/documents?userId=123` |
| **避免动词** | `/documents/:id/toggle-star` | `/toggleStarDocument/:id` |

### 2.4 状态码规范

HTTP状态码准确表达请求结果：

```typescript
// 状态码使用示例（FastDocument）
@Controller('documents')
export class DocumentsController {
  @Post()
  async create(@Body() body: CreateDocumentDto, @Request() req) {
    try {
      const doc = await this.documentsService.create(body, req.user.sub);
      // 201 - 资源创建成功
      return doc;
    } catch (error) {
      if (error.code === '23505') { // PostgreSQL唯一约束错误
        // 409 - 资源冲突
        throw new ConflictException('文档标题重复');
      }
      throw error;
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const doc = await this.documentsService.findOne(id);
    if (!doc) {
      // 404 - 资源不存在
      throw new NotFoundException('文档不存在');
    }
    return doc;
  }
}
```

**常用状态码汇总：**

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| **2xx 成功** | | |
| 200 | OK | GET/PATCH成功返回 |
| 201 | Created | POST创建资源成功 |
| 204 | No Content | DELETE成功（无返回体） |
| **4xx 客户端错误** | | |
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未认证（未提供token） |
| 403 | Forbidden | 无权限（token无效） |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突（如重复创建） |
| 422 | Unprocessable Entity | 验证失败 |
| 429 | Too Many Requests | 请求频率超限 |
| **5xx 服务端错误** | | |
| 500 | Internal Server Error | 服务器内部错误 |
| 502 | Bad Gateway | 网关错误 |
| 503 | Service Unavailable | 服务不可用 |

### 2.5 分页、过滤与排序

```typescript
// 分页API设计示例
@Get()
async findAll(
  @Query('page') page: number = 1,
  @Query('pageSize') pageSize: number = 20,
  @Query('sortBy') sortBy: string = 'createdAt',
  @Query('sortOrder') sortOrder: 'ASC' | 'DESC' = 'DESC',
  @Query('category') category?: string,
  @Query('keyword') keyword?: string,
) {
  const [documents, total] = await this.documentsService.findAndCount({
    where: {
      ...(category && { category }),
      ...(keyword && { title: Like(`%${keyword}%`) }),
    },
    order: { [sortBy]: sortOrder },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return {
    data: documents,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// 响应格式
{
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 2.6 API版本控制

```typescript
// 方式1：URL路径版本（推荐）
@Controller('api/v1/users')
@Controller('api/v2/users')

// 方式2：查询参数版本
@Get('/users?version=2')

// 方式3：请求头版本
@Get('/users')
async findAll(@Headers('x-api-version') version: string) {}

// NestJS 路由前缀版本控制
// app.module.ts
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ApiVersionMiddleware)
      .forRoutes('*');
  }
}
```

### 2.7 统一响应格式

```typescript
// 响应拦截器
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: SwitchToHttpCall, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => ({
        code: 0,
        message: 'success',
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}

// 错误过滤
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    const status = exception.getStatus();

    response.status(status).json({
      code: status,
      message: exception.message,
      error: exception.getResponse(),
      timestamp: new Date().toISOString(),
    });
  }
}

// 实际响应示例
// 成功响应
{
  "code": 0,
  "message": "success",
  "data": { "id": "1", "title": "文档1" },
  "timestamp": "2026-03-12T10:30:00.000Z"
}

// 错误响应
{
  "code": 401,
  "message": "请先登录",
  "error": "Unauthorized",
  "timestamp": "2026-03-12T10:30:00.000Z"
}
```

## 三、JWT认证原理与实现

### 3.1 JWT工作原理

JWT（JSON Web Token）是一种开放标准（RFC 7519），用于在各方之间安全地传输JSON格式的信息：

```
┌─────────────────────────────────────────────────────────────┐
│                     JWT 工作流程                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   客户端                    服务器                          │
│     │                          │                            │
│     │   1. 登录请求           │                            │
│     │ ──────────────────────► │                            │
│     │                          │                            │
│     │   2. 验证用户名密码     │                            │
│     │                          │                            │
│     │   3. 生成 JWT Token     │                            │
│     │ ◄────────────────────── │                            │
│     │                          │                            │
│     │   4. 后续请求携带Token  │                            │
│     │ ──────────────────────► │                            │
│     │                          │                            │
│     │   5. 验证Token          │                            │
│     │                          │                            │
│     │   6. 返回请求资源       │                            │
│     │ ◄────────────────────── │                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 JWT Token结构

JWT由三部分组成，用`.`分隔：

```
xxxxx.yyyyy.zzzzz
  │     │     │
  │     │     └── Signature（签名）
  │     └────── Payload（载荷）
  └──────────── Header（头部）
```

**Header（头部）：**

```json
{
  "alg": "HS256",  // 签名算法
  "typ": "JWT"     // Token类型
}
```

**Payload（载荷）：**

```json
{
  "sub": "user-123",      // subject：用户ID
  "username": "zhangsan",  // 用户名
  "role": "user",         // 角色
  "iat": 1710123456,      // issued at：签发时间
  "exp": 1710209856       // expiration time：过期时间
}
```

**Signature（签名）：**

```javascript
// HMACSHA256签名算法
const signature = HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  SECRET_KEY
);
```

### 3.3 NestJS JWT认证实现

**安装依赖：**

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
npm install -D @types/passport-jwt @types/bcrypt
```

**JWT模块配置（FastDocument示例）：**

```typescript
// auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      global: true, // 全局可用
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: {
        expiresIn: '7d', // Token有效期7天
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, PassportModule],
})
export class AuthModule {}
```

**JWT策略实现：**

```typescript
// jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // 不忽略过期检查
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    // 从数据库获取最新用户信息（确保权限是最新的）
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('用户不存在或已被禁用');
    }

    // 返回的用户信息会挂载到 request.user
    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
    };
  }
}
```

### 3.4 认证服务实现（FastDocument实际代码）

```typescript
// auth.service.ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // 用户注册
  async register(username: string, password: string, email?: string) {
    // 检查用户名是否已存在
    const existingUser = await this.userRepository.findOne({ where: { username } });
    if (existingUser) {
      throw new ConflictException('用户名已存在');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建新用户
    const user = this.userRepository.create({
      username,
      password: hashedPassword,
      email,
      role: 'user',
      isActive: true,
    });

    await this.userRepository.save(user);

    // 返回 token（自动登录）
    return this.generateToken(user);
  }

  // 用户名密码登录
  async loginWithPassword(username: string, password: string) {
    const user = await this.userRepository.findOne({ where: { username } });

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('账户已被禁用');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    return this.generateToken(user);
  }

  // 生成 JWT Token
  private generateToken(user: User) {
    const payload = {
      sub: user.id,           // 用户ID
      username: user.username,
      role: user.role
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      }
    };
  }

  // 获取用户信息
  async getUserInfo(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
```

### 3.5 JWT认证守卫

```typescript
// jwt-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('请先登录');
    }

    try {
      // 验证Token并解码
      const payload = await this.jwtService.verifyAsync(token);
      // 将用户信息挂载到请求对象
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException('登录已过期，请重新登录');
    }

    return true;
  }

  // 从请求头提取Token
  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

### 3.6 路由保护示例

```typescript
// documents.controller.ts
@Controller('documents')
@UseGuards(JwtAuthGuard) // 整个控制器需要认证
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // 获取用户ID的辅助方法
  private getUserId(request: any): string {
    return request.user?.sub;
  }

  @Get()
  findAll(@Request() request: any) {
    const userId = this.getUserId(request);
    return this.documentsService.findByUser(userId);
  }

  @Post()
  create(@Request() request: any, @Body() body: CreateDocumentDto) {
    const userId = this.getUserId(request);
    return this.documentsService.create(body, userId);
  }

  // 公开路由不需要认证
  @Get('public/:shareCode')
  @UseGuards() // 不使用认证守卫
  async getPublicDocument(@Param('shareCode') shareCode: string) {
    return this.documentsService.findByShareCode(shareCode);
  }
}
```

## 四、Token刷新策略

### 4.1 为什么要刷新Token

```typescript
// 问题场景
// 1. Access Token 过期时间短（如15分钟），保证安全性
// 2. 用户需要长时间使用应用，不希望频繁登录
// 3. 解决方案：使用 Refresh Token 续期 Access Token

// Token配置
const TOKEN_CONFIG = {
  accessToken: {
    expiresIn: '15m',     // 15分钟短期
    secret: 'access-secret',
  },
  refreshToken: {
    expiresIn: '7d',      // 7天长期
    secret: 'refresh-secret',
  },
};
```

### 4.2 双Token机制实现

```typescript
// token.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from './refresh-token.entity';

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  // 生成双Token
  generateTokens(user: User) {
    const accessToken = this.jwtService.sign(
      { sub: user.id, username: user.username, type: 'access' },
      { expiresIn: '15m' }
    );

    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  // 刷新Access Token
  async refreshAccessToken(refreshToken: string) {
    // 1. 验证Refresh Token
    const payload = await this.jwtService.verifyAsync(refreshToken);

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('无效的刷新令牌');
    }

    // 2. 检查Token是否在数据库中存在
    const storedToken = await this.refreshTokenRepo.findOne({
      where: { token: refreshToken, userId: payload.sub },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('刷新令牌已过期');
    }

    // 3. 生成新的Access Token
    const user = await this.userRepository.findOne({
      where: { id: payload.sub }
    });

    const newAccessToken = this.jwtService.sign(
      { sub: user.id, username: user.username, type: 'access' },
      { expiresIn: '15m' }
    );

    return { access_token: newAccessToken };
  }

  // 存储Refresh Token到数据库
  async saveRefreshToken(userId: string, token: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenRepo.save({
      userId,
      token,
      expiresAt,
    });
  }

  // 撤销Refresh Token（登出时调用）
  async revokeRefreshToken(token: string) {
    await this.refreshTokenRepo.delete({ token });
  }
}
```

### 4.3 前端Token管理

```typescript
// api.ts - 请求拦截器自动处理Token
class ApiClient {
  private accessToken: string | null = null;
  private refreshPromise: Promise<string> | null = null;

  // 设置Token
  setAccessToken(token: string) {
    this.accessToken = token;
  }

  // 请求拦截器
  async request<T>(config: RequestConfig): Promise<T> {
    // 自动携带Token
    if (this.accessToken) {
      config.headers.Authorization = `Bearer ${this.accessToken}`;
    }

    try {
      return await this.execute<T>(config);
    } catch (error: any) {
      // 401：Token过期，尝试刷新
      if (error.status === 401 && !config._retry) {
        config._retry = true;
        await this.refreshAccessToken();
        // 重试请求
        config.headers.Authorization = `Bearer ${this.accessToken}`;
        return this.execute<T>(config);
      }
      throw error;
    }
  }

  // 刷新Token
  async refreshAccessToken() {
    // 防止并发刷新
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      const refreshToken = localStorage.getItem('refresh_token');
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        // 刷新失败，跳转登录页
        window.location.href = '/login';
        throw new Error('登录已过期');
      }

      const { access_token, refresh_token } = await response.json();
      this.setAccessToken(access_token);
      localStorage.setItem('refresh_token', refresh_token);

      return access_token;
    })();

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }
}
```

### 4.4 Token安全最佳实践

```typescript
// 安全最佳实践

// 1. Token存储（前端）
// ❌ 避免：localStorage（XSS攻击风险）
// ✅ 推荐：内存中存储，HttpOnly Cookie

// 服务端设置HttpOnly Cookie
async login(res: Response, user: User) {
  const token = this.jwtService.sign({ sub: user.id });

  // HttpOnly Cookie，无法通过JavaScript访问
  res.cookie('access_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // 生产环境使用HTTPS
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15分钟
  });
}

// 2. Token吊销（服务端）
// 当用户修改密码或异常登录时，吊销所有Token
async revokeAllUserTokens(userId: string) {
  // 在Redis中存储用户Token黑名单
  await this.redisClient.sadd(`blacklist:${userId}`, Date.now().toString());
}

// 3. 令牌限流
// 限制每个用户的请求频率
async rateLimitCheck(userId: string): Promise<boolean> {
  const key = `ratelimit:${userId}`;
  const count = await this.redisClient.incr(key);

  if (count === 1) {
    await this.redisClient.expire(key, 60); // 60秒窗口
  }

  return count <= 100; // 每分钟100次请求限制
}
```

## 五、OAuth 2.0第三方登录

### 5.1 OAuth 2.0流程

```
┌─────────────────────────────────────────────────────────────┐
│                    OAuth 2.0 授权流程                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   用户          客户端              授权服务器              │
│     │             │                   │                    │
│     │  1. 点击登录 │                   │                    │
│     │ ◄────────── │                   │                    │
│     │             │                   │                    │
│     │  2. 重定向到授权服务器          │                    │
│     │ ───────────►                   │                    │
│     │             │                   │                    │
│     │  3. 用户确认授权               │                    │
│     │ ◄──────────►                   │                    │
│     │             │                   │                    │
│     │  4. 授权码回调                 │                    │
│     │ ◄───────────────────────────────────────────       │
│     │             │                   │                    │
│     │  5. 用授权码换Token            │                    │
│     │ ─────────────────────────────►│                    │
│     │             │                   │                    │
│     │  6. 返回Access Token          │                    │
│     │ ◄─────────────────────────────│                    │
│     │             │                   │                    │
│     │  7. 用Token获取用户信息       │                    │
│     │ ─────────────────────────────►│                    │
│     │             │                   │                    │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 NestJS Google登录实现

**安装依赖：**

```bash
npm install @nestjs/passport passport passport-google-oauth20
npm install -D @types/passport-google-oauth20
```

**OAuth模块配置：**

```typescript
// oauth/google.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    // 从Google获取用户信息
    const { id, name, emails, photos } = profile;

    // 查询或创建用户（FastDocument中的逻辑）
    let user = await this.authService.findOrCreateOAuthUser({
      provider: 'google',
      providerId: id,
      email: emails[0].value,
      username: name?.givenName || emails[0].value.split('@')[0],
      avatar: photos[0]?.value,
    });

    done(null, user);
  }
}
```

**OAuth控制器：**

```typescript
// oauth/oauth.controller.ts
import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

@Controller('auth/oauth')
export class OAuthController {
  // Google登录入口
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin() {
    // 触发Google授权流程
  }

  // Google登录回调
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: Response) {
    // 生成应用Token
    const token = await this.authService.generateToken(req.user);

    // 跳转到前端并携带Token
    const redirectUrl = `${process.env.FRONTEND_URL}?token=${token}`;
    res.redirect(redirectUrl);
  }
}
```

### 5.3 多种OAuth提供商

```typescript
// 支持的OAuth提供商
const OAUTH_PROVIDERS = {
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scope: 'email profile',
  },
  github: {
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    scope: 'user:email',
  },
  microsoft: {
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
    scope: 'User.Read',
  },
};
```

## 六、Session vs Token对比

### 6.1 工作原理对比

```
┌─────────────────────────────────────────────────────────────┐
│              Session 认证 vs Token 认证                     │
├──────────────────────┬──────────────────────────────────────┤
│      Session        │             Token (JWT)              │
├──────────────────────┼──────────────────────────────────────┤
│                      │                                      │
│  1. 用户登录         │  1. 用户登录                         │
│  2. 服务端生成Session│  2. 服务端签发Token                  │
│  3. Session存储服务  │  3. Token返回给客户端                │
│  4. Cookie携带Session│  4. 客户端存储Token                  │
│  5. 服务端验证Session│  5. 每次请求携带Token                │
│                      │  6. 服务端验证Token签名              │
│                      │                                      │
└──────────────────────┴──────────────────────────────────────┘
```

### 6.2 对比表格

| 特性 | Session | Token (JWT) |
|------|---------|-------------|
| **服务端存储** | 需要（Redis/数据库） | 无状态，不需要 |
| **扩展性** | 困难（需要共享Session） | 简单（无需服务端存储） |
| **跨域支持** | 有限（Cookie限制） | 灵活（Authorization头） |
| **移动端支持** | 不友好 | 友好 |
| **安全性** | CSRF风险 | XSS风险 |
| **性能** | 每次请求查询Session | 无查询，直接验证 |
| **失效控制** | 服务端立即失效 | 依赖过期时间 |

### 6.3 适用场景

```typescript
// 场景1：传统Web应用（Session更合适）
// - 需要在服务端维护登录状态
// - 对安全性要求高（Session可立即失效）
// - 用户量较小

// 场景2：SPA/移动端（Token更合适）
// - 无状态架构
// - 需要跨域访问
// - 移动应用
// - 微服务架构

// 场景3：混合方案（最佳实践）
// - Access Token：短期（15分钟），用于API访问
// - Refresh Token：长期（7天），用于续期
// - Session：用于Web端关键操作（如支付、密码修改）
```

## 七、RBAC权限控制

### 7.1 权限模型

```
┌─────────────────────────────────────────────────────────────┐
│                    RBAC 权限模型                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   用户 ─────┐                                               │
│   (User)   │                                               │
│             ▼                                               │
│   角色 ◄────┼──── 权限                                      │
│   (Role)   │    (Permission)                               │
│             │                                               │
│   ┌────────┴────────┐                                     │
│   │                 │                                      │
│   ▼                 ▼                                      │
│ ┌──────┐       ┌──────────┐                               │
│ │ Admin │       │ Editor  │                                │
│ │ 管理员│       │ 编辑者  │                                │
│ └──────┘       └──────────┘                               │
│   │                 │                                      │
│   │ 权限列表        │ 权限列表                              │
│   ├─ user:read     │ ├─ document:read                     │
│   ├─ user:write    │ ├─ document:write                    │
│   ├─ user:delete   │ ├─ document:delete                   │
│   ├─ document:*    │ └─ comment:write                     │
│   └─ system:*      │                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 用户实体定义

```typescript
// user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column()
  email: string;

  // 角色：admin, editor, viewer
  @Column({ default: 'user' })
  role: string;

  // 是否激活
  @Column({ default: true })
  isActive: boolean;

  // 创建时间
  @CreateDateColumn()
  createdAt: Date;
}
```

### 7.3 角色权限装饰器

```typescript
// roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

// 定义角色枚举
export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  USER = 'user',
}

// 定义权限枚举
export enum Permission {
  DOCUMENT_READ = 'document:read',
  DOCUMENT_WRITE = 'document:write',
  DOCUMENT_DELETE = 'document:delete',
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  USER_DELETE = 'user:delete',
  SYSTEM_CONFIG = 'system:config',
}

// 角色装饰器
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

// 权限装饰器
export const Permissions = (...permissions: Permission[]) =>
  SetMetadata('permissions', permissions);
```

### 7.4 角色权限守卫

```typescript
// roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, Permission } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 获取路由上定义的所需角色
    const requiredRoles = this.reflector.get<UserRole[]>('roles', context.getHandler());
    // 获取路由上定义的所需权限
    const requiredPermissions = this.reflector.get<Permission[]>('permissions', context.getHandler());

    const { user } = context.switchToHttp().getRequest();

    // 如果既没有角色要求也没有权限要求，放行
    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    // 角色检查
    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(user.role)) {
        throw new ForbiddenException('您没有权限执行此操作');
      }
    }

    // 权限检查
    if (requiredPermissions && requiredPermissions.length > 0) {
      const userPermissions = this.getUserPermissions(user.role);
      const hasPermission = requiredPermissions.every(p => userPermissions.includes(p));

      if (!hasPermission) {
        throw new ForbiddenException('您没有执行此操作的权限');
      }
    }

    return true;
  }

  // 根据角色获取权限列表
  private getUserPermissions(role: string): Permission[] {
    const rolePermissions: Record<string, Permission[]> = {
      admin: [
        Permission.DOCUMENT_READ,
        Permission.DOCUMENT_WRITE,
        Permission.DOCUMENT_DELETE,
        Permission.USER_READ,
        Permission.USER_WRITE,
        Permission.USER_DELETE,
        Permission.SYSTEM_CONFIG,
      ],
      editor: [
        Permission.DOCUMENT_READ,
        Permission.DOCUMENT_WRITE,
        Permission.DOCUMENT_DELETE,
      ],
      user: [
        Permission.DOCUMENT_READ,
        Permission.DOCUMENT_WRITE,
      ],
    };

    return rolePermissions[role] || [];
  }
}
```

### 7.5 控制器中使用

```typescript
// documents.controller.ts
@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard) // 同时使用认证和角色守卫
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // 所有人可访问
  @Get()
  @Roles(UserRole.USER)
  findAll() {
    return this.documentsService.findAll();
  }

  // 只有编辑者和管理员可创建
  @Post()
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  create(@Body() body: CreateDocumentDto, @Request() req) {
    return this.documentsService.create(body, req.user.userId);
  }

  // 只有管理员可删除
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.DOCUMENT_DELETE)
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }

  // 系统配置只有管理员可访问
  @Get('system/config')
  @Roles(UserRole.ADMIN)
  @Permissions(Permission.SYSTEM_CONFIG)
  getSystemConfig() {
    return this.documentsService.getSystemConfig();
  }
}
```

### 7.6 Casbin权限管理

对于更复杂的权限控制，可以使用Casbin：

```typescript
// 安装
npm install casbin @nestjs/casbin

// 配置
// casbin.policy.csv
// p, admin, document, read
// p, admin, document, write
// p, admin, document, delete
// p, editor, document, read
// p, editor, document, write
// p, user, document, read

// p, admin, user, read
// p, admin, user, write
// p, admin, user, delete

// casbin.service.ts
import { Injectable } from '@nestjs/casbin';

@Injectable()
export class CasbinService {
  constructor(private enforcer: Enforcer) {}

  async checkPermission(sub: string, obj: string, act: string): Promise<boolean> {
    return await this.enforcer.enforce(sub, obj, act);
  }
}

// 使用
@Controller('documents')
export class DocumentsController {
  constructor(private casbinService: CasbinService) {}

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req) {
    const hasPermission = await this.casbinService.checkPermission(
      req.user.role,
      'document',
      'delete'
    );

    if (!hasPermission) {
      throw new ForbiddenException('没有权限删除文档');
    }

    return this.documentsService.remove(id);
  }
}
```

## 八、API安全防护

### 8.1 常见安全威胁

| 威胁 | 说明 | 防护措施 |
|------|------|----------|
| **XSS** | 跨站脚本攻击 | 输入转义、Content Security Policy |
| **CSRF** | 跨站请求伪造 | CSRF Token、SameSite Cookie |
| **SQL注入** | 恶意SQL语句 | 参数化查询、ORM |
| **暴力破解** | 密码猜测 | 限流、验证码 |
| **Token泄露** | JWT被盗 | 短期Token、HTTPS |
| **重放攻击** | 请求重复发送 | 时间戳、Nonce |

### 8.2 请求体验证

```typescript
// validation.pipe.ts
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const messages = errors.map(err => {
        return Object.values(err.constraints || {}).join(', ');
      });
      throw new BadRequestException(messages);
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}

// DTO 定义
// create-user.dto.ts
import { IsString, IsEmail, MinLength, MaxLength, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string;

  @IsOptional()
  @IsString()
  role?: string;
}
```

### 8.3 速率限制

```typescript
// 安装限流包
npm install @nestjs/throttler

// 配置限流
// app.module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,  // 时间窗口：1分钟
        limit: 100,  // 最多100次请求
      },
    ]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

// 自定义限流规则
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  // 登录接口更严格的限流
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 1分钟最多5次
  async login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }
}
```

### 8.4 CORS配置

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 配置CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization, X-Requested-With',
    exposedHeaders: 'Authorization',
    maxAge: 86400, // 预检请求缓存24小时
  });

  await app.listen(3000);
}

bootstrap();
```

### 8.5 Helmet安全头

```typescript
// 安装
npm install helmet

// 配置
// main.ts
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  await app.listen(3000);
}
```

### 8.6 请求日志与审计

```typescript
// audit.middleware.ts
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuditMiddleware implements NestMiddleware {
  private readonly logger = new Logger('AUDIT');

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const auditLog = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        userId: (req as any).user?.sub,
      };

      // 只记录敏感操作
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        this.logger.log(JSON.stringify(auditLog));
      }
    });

    next();
  }
}
```

## 九、FastDocument项目API实践

### 9.1 认证API完整示例

```typescript
// auth.controller.ts (FastDocument实际代码)
import { Controller, Post, Body, Get, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // 用户注册
  @Post('register')
  async register(@Body() body: { username: string; password: string; email?: string }) {
    return this.authService.register(body.username, body.password, body.email);
  }

  // 用户名密码登录
  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    return this.authService.loginWithPassword(body.username, body.password);
  }

  // 邀请码登录
  @Post('login/invitation')
  async loginWithInvitation(@Body() body: { username: string; invitationCode: string }) {
    return this.authService.loginWithInvitation(body.username, body.invitationCode);
  }

  // 获取当前用户信息（需认证）
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req: any) {
    return this.authService.getUserInfo(req.user.sub);
  }

  // 获取今日邀请码（开发环境）
  @Get('invitation-code')
  @UseGuards(JwtAuthGuard)
  getTodayCode() {
    return this.authService.getTodayCode();
  }
}
```

### 9.2 文档API权限控制示例

```typescript
// documents.controller.ts (FastDocument实际代码)
@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  // 获取文档树
  @Get('tree')
  getTree(@Request() request: any) {
    const userId = request.user.sub;
    return this.documentsService.findTree(userId);
  }

  // 分页获取文档
  @Get()
  findAll(
    @Request() request: any,
    @Query('category') category: 'all' | 'starred' | 'trash' = 'all'
  ) {
    const userId = request.user.sub;
    return this.documentsService.findByCategory(userId, category);
  }

  // 收藏/取消收藏
  @Post(':id/toggle-star')
  toggleStar(@Request() request: any, @Param('id') id: string) {
    const userId = request.user.sub;
    return this.documentsService.toggleStar(id, userId);
  }

  // 移动到回收站
  @Post(':id/trash')
  moveToTrash(@Request() request: any, @Param('id') id: string) {
    const userId = request.user.sub;
    return this.documentsService.moveToTrash(id, userId);
  }

  // 恢复文档
  @Post(':id/restore')
  restore(@Request() request: any, @Param('id') id: string) {
    const userId = request.user.sub;
    return this.documentsService.restoreFromTrash(id, userId);
  }

  // 永久删除
  @Delete(':id')
  remove(@Request() request: any, @Param('id') id: string) {
    const userId = request.user.sub;
    return this.documentsService.permanentlyDelete(id, userId);
  }

  // 获取单个文档
  @Get(':id')
  findOne(@Request() request: any, @Param('id') id: string) {
    const userId = request.user.sub;
    return this.documentsService.findOne(id, userId);
  }

  // 创建文档
  @Post()
  create(
    @Request() request: any,
    @Body() body: { title: string; parentId?: string; type?: string; blocks?: any[] }
  ) {
    const userId = request.user.sub;
    return this.documentsService.create(
      body.title,
      body.parentId,
      body.type || 'document',
      body.blocks,
      userId
    );
  }
}
```

## 十、总结与最佳实践

### 10.1 API设计 Checklist

| 项目 | 要求 |
|------|------|
| **URL设计** | 使用名词复数、资源层级、版本前缀 |
| **HTTP方法** | 正确使用GET/POST/PATCH/DELETE |
| **状态码** | 使用标准状态码表达结果 |
| **错误处理** | 统一错误格式、包含详细信息 |
| **安全性** | HTTPS、认证、限流、输入验证 |
| **性能** | 分页、缓存、压缩 |
| **文档化** | OpenAPI/Swagger完整描述 |

### 10.2 认证安全 Checklist

| 项目 | 要求 |
|------|------|
| **密码存储** | bcrypt加密、salt随机 |
| **Token** | 短期Access + 长期Refresh |
| **传输** | HTTPS强制使用 |
| **存储** | HttpOnly Cookie或内存 |
| **限流** | 登录/敏感操作限流 |
| **审计** | 记录登录日志 |

### 10.3 推荐学习资源

- [NestJS官方文档 - 认证](https://docs.nestjs.com/security/authentication)
- [JWT.io](https://jwt.io/) - JWT在线工具
- [OAuth 2.0规范](https://oauth.net/2/)
- [RESTful API设计最佳实践](https://restfulapi.net/)

---

## 十一、API设计与认证面试题详解

### 11.1 RESTful API设计面试题

**面试题1：如何设计一个好的RESTful API？**

**参考答案：**

```typescript
// RESTful API 设计最佳实践

// ✅ 好的设计示例
GET    /api/v1/users              // 获取用户列表
GET    /api/v1/users/:id          // 获取单个用户
POST   /api/v1/users              // 创建用户
PUT    /api/v1/users/:id          // 完整更新用户
PATCH  /api/v1/users/:id          // 部分更新用户
DELETE /api/v1/users/:id          // 删除用户

// 资源嵌套（合理的层级）
GET    /api/v1/users/:id/orders   // 获取用户的订单
GET    /api/v1/orders/:id/items   // 获取订单的商品

// 特殊操作（使用动词）
POST   /api/v1/documents/:id/toggle-star  // 切换收藏状态
POST   /api/v1/users/:id/reset-password   // 重置密码

// ❌ 错误的设计
GET    /api/getUsers              // 避免在URL中使用动词
GET    /api/user?id=1             // 用查询参数代替路径参数
POST   /api/deleteUser            // 避免在URL中使用动词

// 统一的响应格式
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page: number;
    pageSize: number;
    total: number;
  };
}

// NestJS 统一响应拦截器
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context, next) {
    return next.handle().pipe(
      map(data => ({
        success: true,
        data
      }))
    );
  }
}
```

---

**面试题2：HTTP状态码如何正确使用？**

**参考答案：**

```
┌─────────────────────────────────────────────────────────────────┐
│                    HTTP 状态码使用指南                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  2xx 成功                                                       │
│  ─────────                                                       │
│  200 OK              - GET成功 / PUT/PATCH更新成功              │
│  201 Created         - POST创建资源成功                         │
│  204 No Content      - DELETE成功（无返回体）                   │
│                                                                  │
│  3xx 重定向                                                      │
│  ──────────                                                      │
│  301 Moved Permanently  - 永久重定向                            │
│  302 Found             - 临时重定向                             │
│  304 Not Modified      - 缓存未变更                            │
│                                                                  │
│  4xx 客户端错误                                                  │
│  ─────────────                                                   │
│  400 Bad Request      - 请求参数错误、格式错误                  │
│  401 Unauthorized     - 未认证（未登录）                       │
│  403 Forbidden        - 已认证但无权限                          │
│  404 Not Found       - 资源不存在                             │
│  409 Conflict         - 资源冲突（如重复创建）                  │
│  422 Unprocessable   - 语义错误（验证失败）                    │
│  429 Too Many Requests - 请求过于频繁                          │
│                                                                  │
│  5xx 服务端错误                                                  │
│  ───────────                                                     │
│  500 Internal Server Error  - 服务端未知错误                    │
│  502 Bad Gateway           - 网关错误                          │
│  503 Service Unavailable    - 服务不可用                        │
│  504 Gateway Timeout       - 网关超时                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 11.2 认证授权面试题

**面试题3：JWT的原理是什么？如何安全使用？**

**参考答案：**

```
┌─────────────────────────────────────────────────────────────────┐
│                    JWT 认证流程                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  用户登录                                                       │
│      │                                                         │
│      ▼                                                         │
│  ┌─────────────────┐                                           │
│  │  服务器验证通过  │                                           │
│  └────────┬────────┘                                           │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  JWT Token 结构                                          │   │
│  │  ┌─────────┬─────────────────┬─────────────────────┐   │   │
│  │  │ Header  │     Payload    │    Signature       │   │   │
│  │  │(算法信息) │  (用户数据)   │   (防伪签名)       │   │   │
│  │  └─────────┴─────────────────┴─────────────────────┘   │   │
│  │     Base64        Base64           Base64             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Header: { "alg": "HS256", "typ": "JWT" }                     │
│  Payload: { "sub": "user123", "exp": 1234567890, ... }        │
│  Signature: HMACSHA256(base64(header) + "." + base64(payload), │
│                        secret_key)                              │
│                                                                  │
│  请求携带Token                                                  │
│  Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**代码实现：**

```typescript
// JWT 认证服务
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService
  ) {}

  // 登录
  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto);
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 生成 Token
    const payload = {
      sub: user.id,
      username: user.username,
      roles: user.roles
    };

    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
      expiresIn: 900  // 15分钟
    };
  }

  // 刷新 Token
  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      // 验证是否是 refresh token
      const user = await this.userRepository.findOne({
        where: { id: payload.sub }
      });

      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Refresh token无效');
      }

      // 生成新的 access token
      return {
        accessToken: this.jwtService.sign({
          sub: user.id,
          username: user.username
        }, { expiresIn: '15m' })
      };
    } catch (err) {
      throw new UnauthorizedException('Refresh token已过期');
    }
  }
}

// JWT 守卫
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('未提供认证令牌');
    }

    try {
      const payload = this.jwtService.verify(token);
      request.user = payload;
      return true;
    } catch (err) {
      throw new UnauthorizedException('令牌无效或已过期');
    }
  }

  private extractTokenFromHeader(request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

---

**面试题4：OAuth 2.0的工作原理是什么？**

**参考答案：**

```
┌─────────────────────────────────────────────────────────────────┐
│                    OAuth 2.0 授权流程                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  角色：                                                         │
│  ┌────────┐  ┌─────────┐  ┌────────────┐  ┌────────┐        │
│  │ 用户   │  │ 客户端   │  │ 授权服务器  │  │ 资源服务器│        │
│  │(Resource│  │(Client) │  │(Auth Server)│  │(Resource│        │
│  │ Owner) │  │         │  │            │  │ Server) │        │
│  └────┬───┘  └────┬────┘  └──────┬─────┘  └────┬───┘        │
│       │           │              │              │              │
│       │  1.授权请求│              │              │              │
│       │───────────▶│              │              │              │
│       │◀──────────│              │              │              │
│       │  2.用户登录│              │              │              │
│       │  授权确认  │              │              │              │
│       │───────────▶│              │              │              │
│       │           │  3.授权码    │              │              │
│       │◀──────────│◀─────────────              │              │
│       │           │  4.授权码    │              │              │
│       │           │─────────────▶│              │              │
│       │           │  5.Access   │              │              │
│       │           │    Token    │              │              │
│       │           │◀─────────────              │              │
│       │           │  6.请求资源  │              │              │
│       │           │───────────────────────────▶│              │
│       │           │◀──────────────────────────│              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

// 授权码模式示例（NestJS）
@Controller('auth')
export class AuthController {
  // 1. 跳转到授权服务器
  @Get('login/oauth')
  redirectToAuth() {
    const authUrl = `https://auth.example.com/authorize?
      client_id=YOUR_CLIENT_ID
      &redirect_uri=YOUR_CALLBACK_URL
      &response_type=code
      &scope=read:user`;
    return { url: authUrl };
  }

  // 2. 授权回调
  @Get('callback')
  async handleCallback(@Query('code') code: string) {
    // 用授权码换取 Access Token
    const tokenResponse = await fetch('https://auth.example.com/token', {
      method: 'POST',
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: 'YOUR_CLIENT_ID',
        client_secret: 'YOUR_CLIENT_SECRET',
        redirect_uri: 'YOUR_CALLBACK_URL'
      })
    });

    const { access_token, refresh_token } = await tokenResponse.json();
    return { access_token, refresh_token };
  }
}
```

---

### 11.3 API安全面试题

**面试题5：如何防止常见的API安全攻击？**

**参考答案：**

```typescript
// 1. SQL 注入防护
// ❌ 危险：直接拼接
const query = `SELECT * FROM users WHERE name = '${name}'`;

// ✅ 安全：参数化查询
const query = 'SELECT * FROM users WHERE name = $1';
await pool.query(query, [name]);

// TypeORM 自动参数化
await this.userRepository.findOne({
  where: { username: name }  // 自动处理
});

// 2. XSS 防护
// 使用 helmet 中间件设置安全头
import helmet from 'helmet';
app.use(helmet());

// 内容安全策略 (CSP)
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'nonce-{generated-nonce}'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"]
  }
}));

// 3. CSRF 防护
import csurf from 'csurf';
app.use(csurf({ cookie: true }));

// 4. 限流防护
import rateLimit from 'express-rate-limit';

// 全局限流
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,  // 15分钟
  max: 100,  // 最多100个请求
  message: '请求过于频繁，请稍后再试'
}));

// 登录限流
app.use('/auth/login', rateLimit({
  windowMs: 60 * 60 * 1000,  // 1小时
  max: 5,  // 最多5次
  message: '登录尝试次数过多'
}));

// 5. 输入验证
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform {
  transform(value: any, { metatype }: ArgumentMetadata) {
    const object = plainToInstance(metatype, value);
    const errors = validate(object);

    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }
    return value;
  }
}
```

---

**文档信息**

- 作者：API设计与认证教学团队
- 创建时间：2026年3月
- 版本：1.0.0
- 参考资料：RESTful API最佳实践、OAuth 2.0规范、JWT官方文档、FastDocument项目源码
