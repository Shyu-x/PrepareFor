# API设计最佳实践完全指南

本文档将深入讲解现代后端接口设计的核心知识体系，从RESTful规范、版本管理、参数校验到接口安全与性能优化。通过NestJS框架结合实际项目代码，帮助读者全面掌握企业级API开发能力。

---

## 一、RESTful规范深度解析

### 1.1 REST核心概念

REST（Representational State Transfer，表述性状态转移）是一种软件架构风格，由Roy Fielding在2000年提出。REST并不是一个标准，而是一组设计原则和约束条件。理解REST的六个约束条件对于设计高质量的API至关重要。

**客户端-服务器架构**：客户端负责用户界面和用户体验，服务器负责业务逻辑和数据存储。这种分离使得客户端可以独立于服务器进行开发和演进，提高了系统的可扩展性和可维护性。

**无状态性**：每个请求都必须包含所有必要的信息，服务器不需要存储任何会话状态。这简化了服务器设计，提高了系统的可伸缩性，因为任何服务器都可以处理任何请求。同时也使得负载均衡和故障转移变得更加简单。

**可缓存性**：响应可以被标记为可缓存或不可缓存。缓存可以减少网络传输、降低服务器负载、提高客户端响应速度。RESTful API应当充分利用HTTP协议提供的缓存机制。

**分层系统**：系统可以分为多层，每层只知道自己相邻层的信息。这提高了系统的复杂度的同时，也提高了系统的可扩展性和灵活性。

**统一接口**：这是REST的核心特征，包括资源的标识、会话的表示、操作的方式等。统一接口使得整个系统的交互方式保持一致，降低了学习和使用成本。

**按需代码（可选）**：服务器可以临时扩展客户端的功能，通过传输可执行的代码（如JavaScript）来实现。这是REST的可选约束，现代Web应用中这种特性已经非常常见。

### 1.2 资源命名规范

资源命名是RESTful API设计中最基础也是最重要的环节。良好的资源命名应当具备描述性、一致性和层次结构。

**基本原则**：

```typescript
// ✅ 良好的资源命名：使用复数名词，清晰表达资源类型
GET    /users          // 获取用户列表
GET    /users/:id      // 获取单个用户
POST   /users          // 创建用户
PUT    /users/:id      // 完整更新用户
PATCH  /users/:id      // 部分更新用户
DELETE /users/:id      // 删除用户

// ❌ 不良的命名：使用动词，违背REST原则
GET    /getUsers
POST   /createUser
POST   /updateUser
POST   /deleteUser
```

**嵌套资源的命名**：

```typescript
// ✅ 嵌套资源：表达资源的从属关系
GET    /users/:userId/orders           // 获取某用户的所有订单
GET    /users/:userId/orders/:orderId  // 获取某用户的某个订单
POST   /users/:userId/orders           // 为某用户创建订单

// ✅ 关联资源：当嵌套层级超过2-3层时，考虑使用查询参数
GET    /users/:userId/documents?folderId=xxx  // 推荐：减少嵌套层级
GET    /users/:userId/folders/:folderId/documents  // 可接受：2层嵌套
```

**集合与单个资源**：

```typescript
// 集合资源：返回列表
GET /products              // 获取产品列表
GET /articles              // 获取文章列表

// 单个资源：返回单个对象
GET /products/:id          // 获取单个产品
GET /articles/:slug       // 使用语义化的唯一标识

// 计数资源：返回数量统计
GET /users/count           // 返回用户总数
GET /orders/:orderId/items/count  // 返回订单项数量
```

**抽象资源的设计**：

```typescript
// ✅ 抽象概念作为资源
GET /recommendations       // 推荐列表
GET /notifications         // 通知列表
GET /activities            // 活动日志

// ✅ 交易型资源：表达业务操作
POST /transfers            // 创建转账
POST /payments             // 创建支付
POST /reservations         // 创建预订

// ✅ 事件型资源：表达发生的事件
POST /events               // 记录事件
GET  /events/:id           // 获取事件详情
```

### 1.3 HTTP方法语义

HTTP方法在RESTful API中承载着丰富的语义，正确使用每种方法对于API的可读性和一致性至关重要。

**GET方法**：

GET方法是安全且幂等的，主要用于检索资源。使用GET方法时，请求应该只读取数据而不修改任何资源。GET请求可以被浏览器缓存，也可以被CDN等中间节点缓存。

```typescript
// NestJS中GET方法的使用示例
@Controller('users')
export class UsersController {
  // 获取用户列表（可选的分页和过滤）
  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
  ) {
    const pageNum = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);

    return this.usersService.findAll({
      page: pageNum,
      limit: pageSize,
      status,
    });
  }

  // 获取单个用户
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  // 搜索用户（保持GET语义，使用查询参数）
  @Get('search/by-email')
  async searchByEmail(@Query('email') email: string) {
    return this.usersService.findByEmail(email);
  }
}
```

**POST方法**：

POST方法既不安全也不幂等，主要用于创建资源。每次POST请求都应该创建一个新的资源，返回201状态码和创建的资源。

```typescript
// POST创建资源示例
@Controller('users')
export class UsersController {
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return {
      code: 0,
      message: '创建成功',
      data: user,
    };
  }
}
```

**PUT与PATCH方法**：

PUT方法用于完整替换资源，是幂等的；PATCH方法用于部分更新资源，通常不是幂等的。选择使用PUT还是PATCH取决于业务场景。

```typescript
@Controller('users')
export class UsersController {
  // PUT：完整更新资源（幂等）
  @Put(':id')
  async replace(
    @Param('id') id: string,
    @Body() replaceUserDto: ReplaceUserDto,
  ) {
    // PUT要求提供资源的完整表示
    // 如果资源不存在，应该创建（upsert语义）
    return this.usersService.replace(id, replaceUserDto);
  }

  // PATCH：部分更新资源（非幂等，但可设计为幂等）
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    // PATCH只更新提供的字段
    // 其他字段保持不变
    return this.usersService.update(id, updateUserDto);
  }
}
```

**DELETE方法**：

DELETE方法用于删除资源，是幂等的。删除成功后返回204状态码。如果资源不存在，也应返回204而不是404，以保持幂等性。

```typescript
@Controller('users')
export class UsersController {
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    // 成功删除或资源不存在，都返回204
  }
}
```

### 1.4 状态码体系

HTTP状态码是API响应语义的重要组成部分，正确使用状态码可以让客户端开发者清楚地知道请求的结果。

**2xx成功状态码**：

```typescript
// 200 OK：请求成功，默认状态码
// 201 Created：资源创建成功，通常与POST请求配合
// 202 Accepted：请求已接收，但处理尚未完成（异步操作）
// 204 No Content：请求成功，但响应体为空（通常与DELETE配合）

// NestJS中自定义统一响应格式
{
  code: 0,        // 业务状态码，0表示成功
  message: '操作成功',
  data: { ... },  // 响应数据
  meta: {         // 可选的元信息
    timestamp: '2024-01-15T10:30:00Z',
    requestId: 'uuid-xxx',
  }
}
```

**4xx客户端错误状态码**：

```typescript
// 400 Bad Request：请求参数错误或格式不正确
// 401 Unauthorized：未认证，需要登录
// 403 Forbidden：已认证但没有权限
// 404 Not Found：资源不存在
// 405 Method Not Allowed：HTTP方法不允许
// 408 Request Timeout：请求超时
// 409 Conflict：资源冲突，如重复创建
// 422 Unprocessable Entity：请求格式正确但语义错误
// 429 Too Many Requests：请求频率超限

// NestJS异常处理
throw new BadRequestException('用户名不能为空');
throw new UnauthorizedException('登录已过期，请重新登录');
throw new ForbiddenException('您没有权限访问此资源');
throw new NotFoundException('用户不存在');
throw new ConflictException('用户名已被占用');
```

**5xx服务器错误状态码**：

```typescript
// 500 Internal Server Error：服务器内部错误
// 502 Bad Gateway：网关错误
// 503 Service Unavailable：服务不可用
// 504 Gateway Timeout：网关超时

// 生产环境不应暴露具体错误信息
// 日志应记录详细错误，但返回给客户端的是通用错误信息
{
  code: 500,
  message: '服务器内部错误',
  requestId: 'uuid-xxx',
}
```

**状态码与业务的对应关系**：

```typescript
// 完整的HTTP状态码使用指南
const HTTP_STATUS = {
  // 成功
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // 客户端错误
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // 服务器错误
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;
```

### 1.5 版本管理策略

API版本管理是保证系统向后兼容的重要手段。当API需要做出不兼容的变更时，通过版本管理让新旧API共存，给客户端足够的迁移时间。

**URL版本方案**：

```typescript
// 最常用的版本管理方式：URL路径包含版本号
// 优点：直观、便于调试、便于路由配置
// 缺点：版本污染URL、多个版本需要独立部署

@Controller('v1/users')
export class UsersControllerV1 {
  @Get()
  findAll() {
    // v1版本的实现
    return { users: [], version: 'v1' };
  }
}

@Controller('v2/users')
export class UsersControllerV2 {
  @Get()
  findAll(
    @Query('include') include?: string,  // v2新增特性
  ) {
    // v2版本的实现
    return { users: [], version: 'v2', include };
  }
}

// 路由配置
const routes = [
  { path: 'v1/users', controller: UsersControllerV1 },
  { path: 'v2/users', controller: UsersControllerV2 },
];
```

**Header版本方案**：

```typescript
// 通过请求头指定版本
// 优点：不污染URL，更符合REST精神
// 缺点：调试不便，需要额外配置

@Controller('users')
export class UsersController {
  @Get()
  async findAll(@Headers('API-Version') version: string = 'v1') {
    if (version === 'v2') {
      return this.usersServiceV2.findAll();
    }
    return this.usersServiceV1.findAll();
  }
}

// 客户端请求示例
fetch('/api/users', {
  headers: {
    'API-Version': 'v2',
    'Authorization': 'Bearer xxx',
  }
});
```

**Query版本方案**：

```typescript
// 通过查询参数指定版本
// 优点：灵活，便于A/B测试
// 缺点：可能影响缓存、URL显得冗余

@Controller('users')
export class UsersController {
  @Get()
  async findAll(@Query('version') version?: string) {
    const v = version || 'v1';
    if (v === 'v2') {
      return this.usersServiceV2.findAll();
    }
    return this.usersServiceV1.findAll();
  }
}

// 客户端请求示例
fetch('/api/users?version=v2');
```

**版本演进策略**：

```typescript
// 版本生命周期管理策略
const VERSION_STRATEGY = {
  // 旧版本生命周期：通常给予12-24个月的维护期
  // 在此期间提供安全更新和关键bug修复
  // 明确废弃时间点，给客户端充足的迁移时间

  // 建议的版本演进路径
  v1: {
    released: '2023-01-01',
    deprecated: '2024-06-01',    // 标记废弃
    sunset: '2024-12-31',        // 停止维护
    migration: '请迁移至v2版本，新版本提供更好的性能和更多特性',
  },

  v2: {
    released: '2024-01-01',
    deprecated: null,
    sunset: null,
    features: ['分页增强', '字段筛选', '更详细的错误信息'],
  },
};
```

### 1.6 RESTful实战：规范实现

下面我们通过NestJS框架实现一个完整的RESTful API，涵盖所有最佳实践。

**项目结构设计**：

```typescript
// src/modules/users/
// ├── dto/
// │   ├── create-user.dto.ts
// │   ├── update-user.dto.ts
// │   ├── query-user.dto.ts
// │   └── response-user.dto.ts
// ├── schemas/
// │   └── user.schema.ts
// ├── users.controller.ts
// ├── users.service.ts
// ├── users.module.ts
// └── users.repository.ts
```

**DTO定义**：

```typescript
// dto/create-user.dto.ts
import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// 枚举类型定义
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export class CreateUserDto {
  @ApiProperty({ description: '用户名', minLength: 3, maxLength: 20 })
  @IsString()
  @MinLength(3, { message: '用户名至少3个字符' })
  @MaxLength(20, { message: '用户名最多20个字符' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: '用户名只能包含字母、数字和下划线',
  })
  username: string;

  @ApiProperty({ description: '邮箱', example: 'user@example.com' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @ApiProperty({ description: '密码', minLength: 8 })
  @IsString()
  @MinLength(8, { message: '密码至少8个字符' })
  @MaxLength(50, { message: '密码最多50个字符' })
  password: string;

  @ApiPropertyOptional({ description: '昵称' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  nickname?: string;

  @ApiPropertyOptional({ description: '用户状态', enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
```

```typescript
// dto/query-user.dto.ts
import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from './create-user.dto';

export class QueryUserDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: '用户名关键词' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ description: '用户状态' })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ description: '排序字段' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: '排序方向', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';
}
```

```typescript
// dto/response-user.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from './create-user.dto';

export class UserResponseDto {
  @ApiProperty({ description: '用户ID' })
  id: string;

  @ApiProperty({ description: '用户名' })
  username: string;

  @ApiProperty({ description: '邮箱' })
  email: string;

  @ApiPropertyOptional({ description: '昵称' })
  nickname?: string;

  @ApiProperty({ description: '用户状态', enum: UserStatus })
  status: UserStatus;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export class PaginatedUserResponseDto {
  @ApiProperty({ description: '用户列表', type: [UserResponseDto] })
  items: UserResponseDto[];

  @ApiProperty({ description: '总数' })
  total: number;

  @ApiProperty({ description: '当前页' })
  page: number;

  @ApiProperty({ description: '每页数量' })
  limit: number;

  @ApiProperty({ description: '总页数' })
  totalPages: number;
}
```

**Controller实现**：

```typescript
// users.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UserStatus } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import {
  UserResponseDto,
  PaginatedUserResponseDto,
} from './dto/response-user.dto';

@ApiTags('用户管理')
@ApiResponse({ status: 200, description: '成功' })
@ApiResponse({ status: 400, description: '参数错误' })
@ApiResponse({ status: 401, description: '未认证' })
@ApiResponse({ status: 403, description: '无权限' })
@ApiResponse({ status: 404, description: '资源不存在' })
@Controller({ path: 'users', version: ['1', '2'] })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: '获取用户列表' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: UserStatus })
  async findAll(@Query() query: QueryUserDto): Promise<PaginatedUserResponseDto> {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个用户' })
  @ApiParam({ name: 'id', description: '用户ID' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<UserResponseDto> {
    return this.usersService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建用户' })
  async create(
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  @ApiOperation({ summary: '完整更新用户' })
  @ApiParam({ name: 'id', description: '用户ID' })
  async replace(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.replace(id, updateUserDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '部分更新用户' })
  @ApiParam({ name: 'id', description: '用户ID' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.partialUpdate(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除用户' })
  @ApiParam({ name: 'id', description: '用户ID' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}
```

---

## 二、接口版本管理详解

### 2.1 URL版本管理实现

URL版本是最直观也是最广泛使用的版本管理方案。在NestJS中，可以通过路由前缀或模块版本控制来实现。

```typescript
// main.ts - 全局版本配置
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局前缀
  app.setGlobalPrefix('api');

  // 全局版本
  app.enableVersioning({
    type: VersioningType.URI,  // URL版本
    defaultVersion: '1',
    changeOrigin: true,
  });

  // Swagger文档配置（支持多版本）
  const config = new DocumentBuilder()
    .setTitle('API文档')
    .setDescription('API描述文档')
    .setVersion('1.0')
    .addTag('users', '用户管理相关接口')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(3000);
}
bootstrap();
```

```typescript
// app.module.ts - 模块配置
import { Module, VersioningType } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    // 版本控制配置
    NestFactory.create(AppModule, {
      versioning: {
        type: VersioningType.URI,
        defaultVersion: '1',
      },
    }),

    // 限流配置
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
  ],
  providers: [
    // 全局Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

### 2.2 Header版本管理实现

Header版本管理通过请求头来指定API版本，这种方式更符合REST的规范，但调试相对困难。

```typescript
// Header版本配置
app.enableVersioning({
  type: VersioningType.HEADER,
  header: 'API-Version',  // 自定义版本头
});

// 支持多个版本
@Controller({ path: 'users', version: ['1', '2'] })

// 请求示例
GET /users
API-Version: v2

// 或者使用Accept头
app.enableVersioning({
  type: VersioningType.ACCEPT,
  header: 'Accept',
  key: 'version',
});

// 请求示例
GET /users
Accept: application/vnd.myapp.v2+json
```

```typescript
// 扩展Header版本的中间件
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class VersionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const version = req.headers['api-version'] || 'v1';
    req['apiVersion'] = version;
    next();
  }
}
```

### 2.3 Query版本管理实现

Query版本通过URL查询参数指定版本号，这种方式便于测试和A/B实验。

```typescript
// Query版本配置
app.enableVersioning({
  type: VersioningType.QUERY,
  key: 'version',  // 默认是v，改为version更语义化
});

// 请求示例
GET /users?version=2

// NestJS中使用
@Controller({ path: 'users', version: ['1', '2'] })
export class UsersController {
  @Get()
  findAll(@Query('version') version?: string) {
    // 手动处理版本逻辑
    console.log('Requested version:', version);
  }
}
```

### 2.4 版本升级策略

```typescript
// 版本升级策略配置
const VERSION_UPGRADE = {
  // 推荐的版本升级路径
  upgradePaths: {
    'v1->v2': {
      breakingChanges: [
        '移除了deprecated字段',
        '分页参数从page/size改为cursor/size',
        '响应结构变更',
      ],
      migrationGuide: '/docs/migration/v1-to-v2',
      estimatedTime: '2-4周',
    },
    'v2->v3': {
      breakingChanges: [
        '认证方式从API Key改为OAuth 2.0',
        '实时接口改用WebSocket',
      ],
      migrationGuide: '/docs/migration/v2-to-v3',
      estimatedTime: '4-8周',
    },
  },

  // 废弃策略
  deprecationPolicy: {
    announced: true,           // 是否公开废弃通知
    sunsetDate: '2024-12-31',  // 停止维护日期
    migrationDeadline: '2024-10-01',  // 迁移截止日期
    consequences: '废弃版本将返回Warning头，提醒客户端即将停止服务',
  },
};
```

---

## 三、请求参数校验详解

### 3.1 参数校验重要性

参数校验是API安全的第一道防线。不进行校验的API可能导致以下问题：

**数据安全问题**：恶意用户可能通过构造特殊参数来攻击系统，如SQL注入、XSS攻击等。参数校验可以过滤掉大部分恶意请求。

**业务逻辑问题**：没有校验的参数可能导致业务逻辑混乱，如创建用户时传入负数年龄、存储超过长度限制的字符串等。

**系统稳定性问题**：格式错误的参数可能导致服务器异常，如日期格式错误、枚举值不存在等。

### 3.2 class-validator核心用法

NestJS推荐使用class-validator结合class-transformer进行参数校验，这是一套成熟的校验方案。

```typescript
// 安装依赖
// npm install class-validator class-transformer

// create-user.dto.ts - 完整的校验示例
import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsNumber,
  IsInt,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsDate,
  IsUUID,
  IsUrl,
  IsPhoneNumber,
  IsMilitaryTime,
  Min,
  Max,
  MinLength,
  MaxLength,
  Matches,
  IsPositive,
  Length,
  Contains,
  IsNotEmpty,
  ValidateIf,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// 基础校验示例
export class CreateUserDto {
  @ApiProperty({ description: '用户名', example: 'john_doe' })
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(3, { message: '用户名至少3个字符' })
  @MaxLength(20, { message: '用户名最多20个字符' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: '用户名只能包含字母、数字和下划线',
  })
  username: string;

  @ApiProperty({ description: '邮箱', example: 'john@example.com' })
  @IsNotEmpty()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @ApiProperty({ description: '密码' })
  @IsString()
  @MinLength(8, { message: '密码至少8个字符' })
  @MaxLength(50, { message: '密码最多50个字符' })
  // 密码强度校验：至少包含字母和数字
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]+$/, {
    message: '密码必须包含字母和数字',
  })
  password: string;

  @ApiPropertyOptional({ description: '年龄' })
  @IsOptional()
  @IsInt({ message: '年龄必须是整数' })
  @Min(0, { message: '年龄不能为负数' })
  @Max(150, { message: '年龄不能超过150' })
  age?: number;

  @ApiPropertyOptional({ description: '个人网站' })
  @IsOptional()
  @IsUrl({}, { message: '个人网站必须是有效的URL' })
  website?: string;

  @ApiPropertyOptional({ description: '手机号' })
  @IsOptional()
  @IsPhoneNumber('CN', { message: '请输入有效的中国手机号' })
  phone?: string;
}
```

### 3.3 嵌套对象校验

```typescript
// 地址DTO
export class AddressDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  province: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  city: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  district?: string;

  @ApiProperty()
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  street: string;

  @ApiProperty()
  @IsString()
  @IsPostalCode('CN', { message: '邮编格式不正确' })
  postalCode: string;
}

// 用户档案DTO（嵌套地址）
export class UserProfileDto {
  @ApiPropertyOptional({ description: '姓名' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ description: '生日' })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: '生日必须是有效的日期' })
  birthday?: Date;

  @ApiPropertyOptional({ description: '性别' })
  @IsOptional()
  @IsEnum(['male', 'female', 'other'])
  gender?: 'male' | 'female' | 'other';

  @ApiPropertyOptional({ description: '地址', type: AddressDto })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  address?: AddressDto;
}

// 创建用户的完整DTO
export class CreateUserWithProfileDto {
  @ApiProperty({ description: '用户名' })
  @IsString()
  username: string;

  @ApiProperty({ description: '邮箱' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '密码' })
  @IsString()
  password: string;

  @ApiPropertyOptional({ description: '用户档案', type: UserProfileDto })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UserProfileDto)
  profile?: UserProfileDto;
}
```

### 3.4 数组和动态字段校验

```typescript
// 数组校验示例
export class CreatePostDto {
  @ApiProperty({ description: '标题' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: '标签' })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: '至少需要一个标签' })
  @ArrayMaxSize(10, { message: '最多10个标签' })
  @Transform(({ value }) => {
    // 自动去重和trim
    return [...new Set(value.map((v: string) => v.trim().toLowerCase()))];
  })
  tags: string[];

  @ApiPropertyOptional({ description: '分类ID列表' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];
}

// 动态键对象校验
export class MetadataDto {
  // 使用@ValidateNested装饰器配合@Type来校验动态对象
  [key: string]: string | number | boolean;
}

export class CreateProductDto {
  @ApiProperty({ description: '商品名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '价格' })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiPropertyOptional({ description: '元数据' })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  metadata?: Record<string, string | number | boolean>;
}
```

### 3.5 自定义校验器

```typescript
// 自定义校验装饰器 - 验证密码强度
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

// 密码强度要求：
// 1. 至少8个字符
// 2. 至少包含一个大写字母
// 3. 至少包含一个小写字母
// 4. 至少包含一个数字
// 5. 至少包含一个特殊字符
export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;

          const hasUpperCase = /[A-Z]/.test(value);
          const hasLowerCase = /[a-z]/.test(value);
          const hasNumber = /\d/.test(value);
          const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
          const isLongEnough = value.length >= 8;

          return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar && isLongEnough;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} 密码强度不足，密码必须包含大小写字母、数字和特殊字符，且至少8个字符`;
        },
      },
    });
  };
}

// 自定义校验装饰器 - 验证日期范围
export function IsDateRange(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isDateRange',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!(value instanceof Date)) return false;
          const now = new Date();
          const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          const oneYearLater = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

          return value >= oneYearAgo && value <= oneYearLater;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} 必须是未来一年内的日期`;
        },
      },
    });
  };
}

// 自定义校验装饰器 - 验证枚举值列表
export function IsEnumArray(targetEnum: any, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isEnumArray',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any[]) {
          if (!Array.isArray(value)) return false;
          const enumValues = Object.values(targetEnum);
          return value.every(item => enumValues.includes(item));
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} 包含无效的枚举值`;
        },
      },
    });
  };
}

// 使用自定义校验器
export class CreateEventDto {
  @ApiProperty({ description: '密码' })
  @IsString()
  @IsStrongPassword()
  password: string;

  @ApiProperty({ description: '开始时间' })
  @IsDate()
  @IsDateRange()
  startDate: Date;

  @ApiProperty({ description: '状态' })
  @IsEnumArray(EventStatus)  // 必须是EventStatus枚举值的数组
  statuses: EventStatus[];
}
```

### 3.6 全局校验管道配置

```typescript
// main.ts - 配置全局校验管道
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局前缀
  app.setGlobalPrefix('api');

  // 全局版本控制
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // 全局校验管道配置
  app.useGlobalPipes(
    new ValidationPipe({
      // 启用白名单：过滤掉没有装饰器的属性
      whitelist: true,

      // 启用转换：自动将字符串转换为对应类型
      transform: true,

      // 禁用自动转换到枚举
      transformNonPanarors: true,

      // 返回详细的验证错误信息
      exceptionFactory: (errors) => {
        const formattedErrors = errors.map((error) => ({
          field: error.property,
          message: Object.values(error.constraints || {}).join(', '),
          value: error.value,
        }));
        return new BadRequestException({
          code: 400,
          message: '参数校验失败',
          errors: formattedErrors,
        });
      },
    }),
  );

  // 全局响应拦截器
  app.useGlobalInterceptors(new TransformInterceptor());

  // 全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger文档配置
  const config = new DocumentBuilder()
    .setTitle('API文档')
    .setDescription('企业级API文档')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(3000);
}
bootstrap();
```

---

## 四、响应格式统一设计

### 4.1 成功响应格式

统一的响应格式可以让客户端更容易处理API响应，降低前后端沟通成本。

```typescript
// common/response/response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// 基础响应格式
export class BaseResponse<T> {
  @ApiProperty({ description: '业务状态码，0表示成功' })
  code: number;

  @ApiProperty({ description: '响应消息' })
  message: string;

  @ApiPropertyOptional({ description: '响应数据' })
  data?: T;

  @ApiPropertyOptional({ description: '请求追踪ID' })
  requestId?: string;

  @ApiPropertyOptional({ description: '响应时间戳' })
  timestamp?: string;

  constructor(code: number, message: string, data?: T, requestId?: string) {
    this.code = code;
    this.message = message;
    this.data = data;
    this.requestId = requestId || this.generateRequestId();
    this.timestamp = new Date().toISOString();
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 成功响应
export class SuccessResponse<T> extends BaseResponse<T> {
  constructor(data: T, message: string = '操作成功') {
    super(0, message, data);
  }
}

// 分页响应
export class PaginatedResponse<T> extends BaseResponse<T[]> {
  @ApiProperty({ description: '总数' })
  total: number;

  @ApiProperty({ description: '当前页' })
  page: number;

  @ApiProperty({ description: '每页数量' })
  pageSize: number;

  @ApiProperty({ description: '总页数' })
  totalPages: number;

  @ApiProperty({ description: '是否有下一页' })
  hasNext: boolean;

  @ApiProperty({ description: '是否有上一页' })
  hasPrev: boolean;

  constructor(
    items: T[],
    total: number,
    page: number,
    pageSize: number,
  ) {
    super(0, '查询成功', items);
    this.total = total;
    this.page = page;
    this.pageSize = pageSize;
    this.totalPages = Math.ceil(total / pageSize);
    this.hasNext = page < this.totalPages;
    this.hasPrev = page > 1;
  }
}
```

### 4.2 失败响应格式

```typescript
// common/response/error-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// 错误码定义
export enum ErrorCode {
  // 系统错误 (1000-1999)
  SYSTEM_ERROR = 1000,
  SERVICE_UNAVAILABLE = 1001,
  DATABASE_ERROR = 1002,

  // 认证错误 (2000-2999)
  UNAUTHORIZED = 2000,
  TOKEN_EXPIRED = 2001,
  TOKEN_INVALID = 2002,
  PERMISSION_DENIED = 3000,

  // 参数错误 (3000-3999)
  VALIDATION_ERROR = 3000,
  PARAMETER_MISSING = 3001,
  PARAMETER_INVALID = 3002,

  // 资源错误 (4000-4999)
  RESOURCE_NOT_FOUND = 4000,
  RESOURCE_ALREADY_EXISTS = 4001,
  RESOURCE_CONFLICT = 4002,

  // 业务错误 (5000-5999)
  BUSINESS_ERROR = 5000,
  INSUFFICIENT_BALANCE = 5001,
  QUOTA_EXCEEDED = 5002,
}

// 错误响应详情
export class ErrorDetails {
  @ApiPropertyOptional({ description: '错误字段' })
  field?: string;

  @ApiPropertyOptional({ description: '错误消息' })
  message: string;

  @ApiPropertyOptional({ description: '错误约束' })
  constraints?: Record<string, string>;
}

// 失败响应
export class ErrorResponse {
  @ApiProperty({ description: '错误码' })
  code: number;

  @ApiProperty({ description: '错误类型' })
  error: string;

  @ApiProperty({ description: '错误消息' })
  message: string;

  @ApiPropertyOptional({ description: '详细错误信息' })
  details?: ErrorDetails[];

  @ApiPropertyOptional({ description: '请求追踪ID' })
  requestId?: string;

  @ApiPropertyOptional({ description: '文档链接' })
  docUrl?: string;

  @ApiProperty({ description: '错误时间' })
  timestamp: string;

  constructor(
    code: number,
    error: string,
    message: string,
    details?: ErrorDetails[],
    requestId?: string,
  ) {
    this.code = code;
    this.error = error;
    this.message = message;
    this.details = details;
    this.requestId = requestId;
    this.docUrl = `https://docs.example.com/errors/${code}`;
    this.timestamp = new Date().toISOString();
  }
}
```

### 4.3 统一响应拦截器

```typescript
// common/interceptors/transform.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SuccessResponse, PaginatedResponse } from '../response/response.dto';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // 如果已经是标准响应格式，直接返回
        if (data instanceof SuccessResponse || data instanceof PaginatedResponse) {
          return data;
        }

        // 如果是分页数据，转换为分页响应
        if (data && typeof data === 'object') {
          if ('items' in data && 'total' in data) {
            const { items, total, page, pageSize } = data;
            return new PaginatedResponse(items, total, page, pageSize);
          }
        }

        // 普通数据包装为成功响应
        return new SuccessResponse(data);
      }),
    );
  }
}
```

### 4.4 异常过滤器

```typescript
// common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponse, ErrorCode, ErrorDetails } from '../response/error-response.dto';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = ErrorCode.SYSTEM_ERROR;
    let message = '服务器内部错误';
    let error = 'Internal Server Error';
    let details: ErrorDetails[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as any;
        message = resp.message || message;
        code = resp.code || this.mapStatusToErrorCode(status);
        error = resp.error || this.getErrorName(status);

        // 处理验证异常
        if (Array.isArray(resp.message)) {
          details = resp.message.map((msg: any) => ({
            field: msg.property,
            message: Object.values(msg.constraints || {}).join(', '),
            constraints: msg.constraints,
          }));
          message = '参数校验失败';
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const errorResponse = new ErrorResponse(
      code,
      error,
      message,
      details,
      request.headers['x-request-id'] as string,
    );

    // 生产环境不返回堆栈信息
    if (process.env.NODE_ENV === 'production') {
      delete (errorResponse as any).stack;
    }

    response.status(status).json(errorResponse);
  }

  private mapStatusToErrorCode(status: number): number {
    const statusToCode: Record<number, ErrorCode> = {
      [HttpStatus.BAD_REQUEST]: ErrorCode.VALIDATION_ERROR,
      [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHORIZED,
      [HttpStatus.FORBIDDEN]: ErrorCode.PERMISSION_DENIED,
      [HttpStatus.NOT_FOUND]: ErrorCode.RESOURCE_NOT_FOUND,
      [HttpStatus.CONFLICT]: ErrorCode.RESOURCE_ALREADY_EXISTS,
      [HttpStatus.TOO_MANY_REQUESTS]: ErrorCode.QUOTA_EXCEEDED,
    };
    return statusToCode[status] || ErrorCode.SYSTEM_ERROR;
  }

  private getErrorName(status: number): string {
    return HttpStatus[status] || 'Error';
  }
}
```

### 4.5 响应格式使用示例

```typescript
// users.controller.ts - 响应格式使用示例
@ApiTags('用户管理')
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 返回分页响应
  @Get()
  async findAll(@Query() query: QueryUserDto): Promise<PaginatedResponse<User>> {
    const result = await this.usersService.findAll(query);
    return new PaginatedResponse(
      result.items,
      result.total,
      query.page,
      query.limit,
    );
  }

  // 返回单个资源
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<SuccessResponse<User>> {
    const user = await this.usersService.findById(id);
    return new SuccessResponse(user, '获取成功');
  }

  // 创建资源
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createUserDto: CreateUserDto,
  ): Promise<SuccessResponse<User>> {
    const user = await this.usersService.create(createUserDto);
    return new SuccessResponse(user, '创建成功');
  }
}
```

---

## 五、分页设计深度解析

### 5.1 传统分页：page/size

传统分页是最常用的分页方式，适合数据量相对稳定的场景。

```typescript
// 分页DTO
export class PaginationDto {
  @ApiProperty({ description: '页码', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiProperty({ description: '每页数量', default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;
}

// 分页结果
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Service实现
@Injectable()
export class UsersService {
  async findAll(query: PaginationDto): Promise<PaginatedResult<User>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [items, total] = await this.userRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
```

### 5.2 游标分页：cursor

游标分页适合数据量巨大或需要实时性的场景，避免了传统分页的深度分页问题。

```typescript
// 游标分页DTO
export class CursorPaginationDto {
  @ApiPropertyOptional({ description: '游标（最后一条记录的ID）' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiProperty({ description: '每页数量', default: 20, maximum: 100 })
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({ description: '排序方向', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  order: 'asc' | 'desc' = 'desc';
}

// 游标分页结果
export interface CursorPaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

// Service实现
@Injectable()
export class UsersService {
  async findAllWithCursor(
    query: CursorPaginationDto,
  ): Promise<CursorPaginatedResult<User>> {
    const { cursor, limit, order } = query;

    // 构建查询条件
    const whereCondition: any = {};
    if (cursor) {
      // 根据游标获取对应记录
      const cursorUser = await this.userRepository.findOne({
        where: { id: cursor },
      });

      if (cursorUser) {
        // 使用游标时间戳作为分页依据
        // 需要确保排序字段有索引
        whereCondition.createdAt = order === 'desc'
          ? LessThan(cursorUser.createdAt)
          : MoreThan(cursorUser.createdAt);
      }
    }

    const users = await this.userRepository.find({
      where: whereCondition,
      take: limit + 1, // 多查一条用于判断是否有下一页
      order: { createdAt: order },
    });

    // 判断是否有下一页
    const hasMore = users.length > limit;
    if (hasMore) {
      users.pop(); // 移除多查的那条
    }

    // 生成下一个游标
    const nextCursor = hasMore && users.length > 0
      ? users[users.length - 1].id
      : null;

    return {
      items: users,
      nextCursor,
      hasMore,
    };
  }
}
```

### 5.3 分页性能优化

```typescript
// 分页查询优化 - 使用有索引的排序字段
@Injectable()
export class UsersService {
  // 确保排序字段有索引：created_at, updated_at
  // 避免 SELECT *，只查询需要的字段
  async findAllOptimized(query: PaginationDto): Promise<PaginatedResult<User>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    // 只查询需要的字段，减少网络传输
    const [items, total] = await this.userRepository.findAndCount({
      select: ['id', 'username', 'email', 'status', 'createdAt'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' }, // 确保createdAt有索引
      where: { status: 'active' },   // 确保有筛选条件时，字段也有索引
    });

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // 使用子查询优化计数
  async countWithFilter(where: any): Promise<number> {
    // 对于复杂的查询条件，使用子查询优化计数
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.status = :status', { status: where.status });

    if (where.username) {
      queryBuilder.andWhere('user.username LIKE :username', {
        username: `%${where.username}%`,
      });
    }

    // 使用getCount而不是select count(*)，更高效
    return queryBuilder.getCount();
  }
}
```

### 5.4 无限滚动实现

```typescript
// 前端无限滚动实现示例（TypeScript + React）
interface UseInfiniteScrollOptions<T> {
  fetchFn: (cursor?: string) => Promise<{ items: T[]; nextCursor: string | null }>;
  threshold?: number;
}

function useInfiniteScroll<T>({
  fetchFn,
  threshold = 100,
}: UseInfiniteScrollOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const result = await fetchFn(cursor || undefined);
      setItems((prev) => [...prev, ...result.items]);
      setCursor(result.nextCursor);
      setHasMore(result.nextCursor !== null);
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsLoading(false);
    }
  }, [cursor, fetchFn, isLoading, hasMore]);

  // 监听滚动
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;

      if (scrollHeight - scrollTop - clientHeight < threshold) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore, threshold]);

  return { items, isLoading, hasMore, error, loadMore };
}
```

---

## 六、接口幂等性设计

### 6.1 幂等性定义

幂等性是指同一操作执行一次和执行多次的效果相同。在API设计中，幂等性非常重要，因为网络请求可能因为超时等原因导致客户端重复发送请求。

**幂等操作**：GET、PUT、DELETE、HEAD、OPTIONS
**非幂等操作**：POST、PATCH（通常情况下）

### 6.2 唯一Token方案

```typescript
// 生成幂等Token
export function generateIdempotencyToken(): string {
  return `${Date.now()}-${randomBytes(16).toString('hex')}`;
}

// 幂等性中间件
@Injectable()
export class IdempotencyMiddleware implements NestMiddleware {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly usersService: UsersService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const idempotencyKey = req.headers['idempotency-key'] as string;

    if (!idempotencyKey) {
      // POST请求需要幂等Key
      if (req.method === 'POST') {
        throw new BadRequestException('POST请求需要提供Idempotency-Key');
      }
      return next();
    }

    // 检查是否已处理过
    const cachedResponse = await this.cacheManager.get(`idempotency:${idempotencyKey}`);
    if (cachedResponse) {
      // 返回缓存的响应
      return res.json(JSON.parse(cachedResponse as string));
    }

    // 存储原始响应处理器
    const originalJson = res.json.bind(res);
    let responseData: any;

    res.json = (body: any) => {
      responseData = body;
      // 延迟存储响应，确保业务逻辑执行完成
      setImmediate(async () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          await this.cacheManager.set(
            `idempotency:${idempotencyKey}`,
            JSON.stringify(responseData),
            { ttl: 86400 }, // 24小时过期
          );
        }
      });
      return originalJson(body);
    };

    next();
  }
}
```

### 6.3 乐观锁实现

```typescript
// 使用版本号实现乐观锁
// User实体
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  username: string;

  @Column()
  @VersionColumn()  // 自动版本号
  version: number;

  @Column()
  balance: number;
}

// 更新时检查版本
@Injectable()
export class UsersService {
  async deductBalance(
    userId: string,
    amount: number,
    expectedVersion: number,
  ): Promise<User> {
    const result = await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({
        balance: () => `balance - ${amount}`,
        version: () => 'version + 1',
      })
      .where('id = :id AND version = :version', { id: userId, version: expectedVersion })
      .andWhere('balance >= :amount', { amount })
      .execute();

    if (result.affected === 0) {
      throw new ConflictException('余额不足或版本不匹配，请重试');
    }

    return this.userRepository.findOne({ where: { id: userId } });
  }
}

// Controller使用
@Patch(':id/balance')
async deductBalance(
  @Param('id') userId: string,
  @Body() dto: { amount: number; version: number },
) {
  return this.usersService.deductBalance(userId, dto.amount, dto.version);
}
```

### 6.4 业务幂等性设计

```typescript
// 订单支付幂等性实现
@Injectable()
export class OrdersService {
  async processPayment(orderId: string, paymentDto: PaymentDto): Promise<Order> {
    // 1. 查询订单
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      lock: { mode: 'pessimistic_write' }, // 悲观锁
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    // 2. 检查是否已支付（幂等性检查）
    if (order.status === 'paid') {
      // 订单已支付，直接返回成功
      return order;
    }

    // 3. 检查支付幂等Key
    const idempotencyKey = paymentDto.idempotencyKey;
    if (idempotencyKey) {
      const existingPayment = await this.paymentRepository.findOne({
        where: { idempotencyKey },
      });

      if (existingPayment) {
        // 已处理过该支付请求，直接返回
        return order;
      }
    }

    // 4. 执行支付逻辑
    const payment = await this.paymentRepository.save({
      orderId,
      amount: order.amount,
      method: paymentDto.method,
      idempotencyKey,
      status: 'success',
    });

    // 5. 更新订单状态
    order.status = 'paid';
    order.paidAt = new Date();
    order.paymentId = payment.id;
    await this.orderRepository.save(order);

    return order;
  }
}
```

---

## 七、接口限流设计

### 7.1 限流算法

**固定窗口算法**：简单但可能出现临界问题

```typescript
// 固定窗口限流
@Injectable()
export class FixedWindowRateLimiter {
  private windows: Map<string, { count: number; resetTime: number }> = new Map();

  isAllowed(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const window = this.windows.get(key);

    if (!window || now > window.resetTime) {
      // 新窗口
      this.windows.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    if (window.count >= limit) {
      return false;
    }

    window.count++;
    return true;
  }
}
```

**滑动窗口算法**：更精确但实现复杂

```typescript
// 滑动窗口限流
@Injectable()
export class SlidingWindowRateLimiter {
  isAllowed(
    key: string,
    limit: number,
    windowMs: number,
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const windowStart = now - windowMs;
    const requests = this.getRequests(key);

    // 清理过期的请求记录
    const validRequests = requests.filter((time) => time > windowStart);

    if (validRequests.length >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: Math.min(...validRequests) + windowMs,
      };
    }

    // 记录新请求
    validRequests.push(now);
    this.storeRequests(key, validRequests);

    return {
      allowed: true,
      remaining: limit - validRequests.length - 1,
      resetTime: windowStart + windowMs,
    };
  }

  private getRequests(key: string): number[] {
    const stored = Redis.get(`rate:${key}`);
    return stored ? JSON.parse(stored) : [];
  }

  private storeRequests(key: string, requests: number[]): void {
    Redis.setex(`rate:${key}`, Math.ceil(windowMs / 1000), JSON.stringify(requests));
  }
}
```

**令牌桶算法**：允许一定程度的突发流量

```typescript
// 令牌桶限流
@Injectable()
export class TokenBucketRateLimiter {
  private buckets: Map<string, { tokens: number; lastRefill: number }> = new Map();

  constructor(
    @Inject(REDIS) private redis: Redis,
  ) {}

  async isAllowed(
    key: string,
    rate: number,      // 每秒补充的令牌数
    capacity: number,  // 桶的容量
  ): Promise<{ allowed: boolean; remaining: number }> {
    const now = Date.now();

    // 使用Redis原子操作
    const script = `
      local key = KEYS[1]
      local rate = tonumber(ARGV[1])
      local capacity = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])

      local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
      local tokens = tonumber(bucket[1]) or capacity
      local lastRefill = tonumber(bucket[2]) or now

      -- 计算应该补充的令牌数
      local elapsed = (now - lastRefill) / 1000
      tokens = math.min(capacity, tokens + elapsed * rate)

      -- 尝试获取令牌
      if tokens >= 1 then
        tokens = tokens - 1
        redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', now)
        redis.call('EXPIRE', key, 3600)
        return {1, tokens}
      else
        redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', now)
        redis.call('EXPIRE', key, 3600)
        return {0, tokens}
      end
    `;

    const result = await this.redis.eval(script, 1, key, rate, capacity, now) as number[];
    return {
      allowed: result[0] === 1,
      remaining: Math.floor(result[1]),
    };
  }
}
```

### 7.2 NestJS限流实现

```typescript
// 使用@nestjs/throttler实现限流
// 安装：npm install @nestjs/throttler

// app.module.ts
@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,   // 时间窗口：60秒
      limit: 100,    // 最多100个请求
    }]),
  ],
})
export class AppModule {}

// users.controller.ts - 应用限流
@ApiTags('用户管理')
@Controller('users')
@UseGuards(ThrottlerGuard)  // 应用默认限流规则
export class UsersController {
  // 标准限流：60秒内最多100次请求
  @Get()
  findAll() {}

  // 严格限流：60秒内最多10次请求
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get('search')
  search(@Query('q') q: string) {}

  // 宽松限流：60秒内最多1000次请求（需要高频率调用的接口）
  @Throttle({ default: { limit: 1000, ttl: 60000 } })
  @Get('suggestions')
  suggestions(@Query('q') q: string) {}
}
```

### 7.3 多维度限流

```typescript
// 多维度限流：用户维度 + IP维度 + 接口维度
@Injectable()
export class MultiDimensionalRateLimiter {
  constructor(
    @Inject(REDIS) private redis: Redis,
  ) {}

  // 用户维度限流
  async checkUserRateLimit(
    userId: string,
    tier: 'free' | 'pro' | 'enterprise',
  ): Promise<{ allowed: boolean; tier: string }> {
    const limits = {
      free: 100,
      pro: 1000,
      enterprise: 10000,
    };

    const limit = limits[tier];
    const key = `rate:user:${userId}`;

    const result = await this.checkRateLimit(key, limit, 60);
    return { allowed: result.allowed, tier };
  }

  // IP维度限流（防止恶意刷接口）
  async checkIPRateLimit(ip: string): Promise<{ allowed: boolean; blocked: boolean }> {
    const key = `rate:ip:${ip}`;

    // 短时间大量请求，触发临时封禁
    const shortTerm = await this.checkRateLimit(key, 1000, 60);

    if (!shortTerm.allowed) {
      // 封禁该IP 10分钟
      await this.redis.setex(`block:ip:${ip}`, 600, '1');
      return { allowed: false, blocked: true };
    }

    return { allowed: true, blocked: false };
  }

  // 接口维度限流（保护特定接口）
  async checkEndpointRateLimit(
    endpoint: string,
    limit: number,
  ): Promise<boolean> {
    const key = `rate:endpoint:${endpoint}`;
    const result = await this.checkRateLimit(key, limit, 60);
    return result.allowed;
  }

  private async checkRateLimit(
    key: string,
    limit: number,
    windowSec: number,
  ): Promise<{ allowed: boolean; remaining: number }> {
    const current = await this.redis.incr(key);

    if (current === 1) {
      await this.redis.expire(key, windowSec);
    }

    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
    };
  }
}
```

---

## 八、接口文档生成

### 8.1 Swagger/OpenAPI配置

```typescript
// swagger.config.ts
import { DocumentBuilder, SwaggerCustomOptions } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('企业级API文档')
  .setDescription(`
    # API说明

    ## 认证方式
    本API使用JWT Bearer Token认证，请在请求头中添加：
    \`Authorization: Bearer <your_token>\`

    ## 错误码说明
    - \`0\`: 成功
    - \`1000-1999\`: 系统错误
    - \`2000-2999\`: 认证错误
    - \`3000-3999\`: 参数错误
    - \`4000-4999\`: 资源错误
    - \`5000-5999\`: 业务错误

    ## 限流说明
    不同等级用户有不同的调用限制：
    - Free: 100次/分钟
    - Pro: 1000次/分钟
    - Enterprise: 10000次/分钟
  `)
  .setVersion('1.0')
  .setContact('API Support', 'https://example.com/support', 'support@example.com')
  .setLicense('MIT', 'https://opensource.org/licenses/MIT')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: '输入JWT token',
      in: 'header',
    },
    'JWT-auth',
  )
  .addTag(
    'users',
    '用户管理接口',
    {
      description: '用户CRUD操作',
      externalDocs: {
        description: '了解更多',
        url: 'https://docs.example.com/users',
      },
    },
  )
  .addTag('auth', '认证授权接口')
  .addTag('posts', '文章管理接口')
  .addTag('orders', '订单管理接口')
  .build();

export const swaggerOptions: SwaggerCustomOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,  // 刷新页面保留token
    docExpansion: 'list',       // 默认展开所有tag
    filter: true,               // 显示过滤框
    showRequestDuration: true, // 显示请求耗时
  },
  customSiteTitle: 'API文档',
  customfavIcon: 'https://example.com/favicon.ico',
};
```

### 8.2 动态文档生成

```typescript
// dynamic-docs.service.ts - 动态生成API文档
@Injectable()
export class DynamicDocsService {
  constructor(
    private readonly reflector: Reflector,
  ) {}

  // 为不同版本生成不同文档
  generateVersionedDocs(app: INestApplication, version: string) {
    const config = new DocumentBuilder()
      .setTitle(`${version} API文档`)
      .setVersion(version)
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`api-docs/${version}`, app, document);
  }

  // 自定义文档元数据
  setDocMetadata(doc: OpenAPIObject, metadata: DocMetadata) {
    return {
      ...doc,
      info: {
        ...doc.info,
        title: metadata.title,
        description: metadata.description,
        version: metadata.version,
        contact: metadata.contact,
        termsOfService: metadata.termsOfService,
      },
      servers: metadata.servers,
      tags: metadata.tags,
    };
  }
}
```

### 8.3 文档维护策略

```typescript
// 文档版本策略
const DOC_VERSION_STRATEGY = {
  // 主版本：重大变更，不兼容的API修改
  // 次版本：新增功能，向后兼容
  // 修订版本：bug修复，向后兼容

  currentVersions: ['1.0', '1.1', '2.0'],

  versionLifecycle: {
    '1.0': {
      status: 'deprecated',
      sunsetDate: '2024-12-31',
      migration: '请迁移到v1.1或v2.0',
    },
    '1.1': {
      status: 'stable',
      eolDate: '2025-12-31',
    },
    '2.0': {
      status: 'current',
      releaseDate: '2024-01-01',
      features: [
        'GraphQL支持',
        '批量操作接口',
        '增强的分页机制',
      ],
    },
  },
};
```

---

## 九、GraphQL API设计

### 9.1 Schema设计

```typescript
// graphql/schema.gql

# 用户类型
type User {
  id: ID!
  username: String!
  email: String!
  nickname: String
  status: UserStatus!
  profile: UserProfile
  createdAt: DateTime!
  updatedAt: DateTime!
}

# 用户档案
type UserProfile {
  name: String
  avatar: String
  bio: String
  birthday: Date
  address: Address
}

# 地址
type Address {
  province: String!
  city: String!
  district: String
  street: String!
  postalCode: String!
}

# 用户状态枚举
enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

# 分页类型
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

# 查询类型
type Query {
  # 获取用户列表（分页）
  users(
    first: Int!
    after: String
    last: Int
    before: String
    where: UserWhereInput
    orderBy: UserOrderByInput
  ): UserConnection!

  # 获取单个用户
  user(id: ID!): User

  # 获取当前用户
  me: User
}

# 输入类型（用于过滤和排序）
input UserWhereInput {
  username: StringFilter
  email: StringFilter
  status: UserStatus
  createdAt: DateTimeFilter
  AND: [UserWhereInput!]
  OR: [UserWhereInput!]
}

input StringFilter {
  equals: String
  contains: String
  startsWith: String
  endsWith: String
  in: [String!]
}

input DateTimeFilter {
  equals: DateTime
  gte: DateTime
  lte: DateTime
}

input UserOrderByInput {
  username: SortOrder
  createdAt: SortOrder
  updatedAt: SortOrder
}

enum SortOrder {
  ASC
  DESC
}

# 变更类型
type Mutation {
  # 创建用户
  createUser(input: CreateUserInput!): CreateUserPayload!

  # 更新用户
  updateUser(id: ID!, input: UpdateUserInput!): UpdateUserPayload!

  # 删除用户
  deleteUser(id: ID!): DeleteUserPayload!
}

# 输入类型
input CreateUserInput {
  username: String!
  email: String!
  password: String!
  nickname: String
}

input UpdateUserInput {
  username: String
  email: String
  nickname: String
  profile: UpdateUserProfileInput
}

input UpdateUserProfileInput {
  name: String
  avatar: String
  bio: String
}

# 变更结果
type CreateUserPayload {
  user: User
  errors: [UserError!]
}

type UpdateUserPayload {
  user: User
  errors: [UserError!]
}

type DeleteUserPayload {
  deleted: Boolean!
  errors: [UserError!]
}

type UserError {
  field: String
  message: String!
  code: String!
}
```

### 9.2 Resolver实现

```typescript
// graphql/users/users.resolver.ts
import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserType, UserConnection, UserEdge, PageInfo } from './users.types';
import { CreateUserInput, UpdateUserInput } from './users.inputs';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

@Resolver(() => UserType)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => UserConnection)
  @UseGuards(GqlAuthGuard)
  async users(
    @Args('first') first: number,
    @Args('after', { nullable: true }) after?: string,
    @Args('last', { nullable: true }) last?: number,
    @Args('before', { nullable: true }) before?: string,
  ): Promise<UserConnection> {
    const result = await this.usersService.findAllWithCursor({
      first,
      after,
      last,
      before,
    });

    const edges: UserEdge[] = result.items.map((user) => ({
      node: user,
      cursor: Buffer.from(`cursor:${user.id}`).toString('base64'),
    }));

    return {
      edges,
      pageInfo: {
        hasNextPage: result.hasNextPage,
        hasPreviousPage: result.hasPreviousPage,
        startCursor: edges[0]?.cursor,
        endCursor: edges[edges.length - 1]?.cursor,
      },
      totalCount: result.total,
    };
  }

  @Query(() => UserType, { nullable: true })
  async user(@Args('id') id: string): Promise<UserType> {
    return this.usersService.findById(id);
  }

  @Query(() => UserType)
  @UseGuards(GqlAuthGuard)
  async me(@Context() context: any): Promise<UserType> {
    return context.req.user;
  }

  @Mutation(() => CreateUserPayload)
  async createUser(
    @Args('input') input: CreateUserInput,
  ): Promise<CreateUserPayload> {
    try {
      const user = await this.usersService.create(input);
      return { user };
    } catch (error) {
      return {
        user: null,
        errors: [{
          field: error.field || 'unknown',
          message: error.message,
          code: error.code || 'CREATE_ERROR',
        }],
      };
    }
  }

  @Mutation(() => UpdateUserPayload)
  @UseGuards(GqlAuthGuard)
  async updateUser(
    @Args('id') id: string,
    @Args('input') input: UpdateUserInput,
  ): Promise<UpdateUserPayload> {
    try {
      const user = await this.usersService.update(id, input);
      return { user };
    } catch (error) {
      return {
        user: null,
        errors: [{
          field: error.field || 'unknown',
          message: error.message,
          code: error.code || 'UPDATE_ERROR',
        }],
      };
    }
  }
}
```

### 9.3 N+1问题解决

```typescript
// 使用DataLoader解决N+1问题
// users.dataloader.ts
import DataLoader from 'dataloader';
import { Injectable, Scope } from '@nestjs/common';
import { UsersService } from './users.service';

@Injectable({ scope: Scope.REQUEST })
export class UsersDataLoader {
  private batchLoader: DataLoader<string, User>;

  constructor(private readonly usersService: UsersService) {
    this.batchLoader = new DataLoader<string, User>(
      async (ids: string[]) => {
        // 批量查询用户
        const users = await this.usersService.findByIds(ids);
        // 确保返回顺序与输入IDs一致
        const userMap = new Map(users.map((user) => [user.id, user]));
        return ids.map((id) => userMap.get(id) || null);
      },
      {
        maxBatchSize: 100,  // 最大批量大小
        cache: true,       // 启用缓存
      },
    );
  }

  load(id: string): Promise<User> {
    return this.batchLoader.load(id);
  }

  loadMany(ids: string[]): Promise<(User | Error)[]> {
    return this.batchLoader.loadMany(ids);
  }
}

// 在Resolver中使用DataLoader
@Resolver(() => PostType)
export class PostsResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersDataLoaderFactory: UsersDataLoader,
  ) {}

  @ResolveField(() => UserType)
  async author(@Parent() post: Post, @Context() context: any): Promise<UserType> {
    // 获取当前请求的DataLoader实例
    const loader = context.usersLoader as UsersDataLoader;
    return loader.load(post.authorId);
  }
}
```

---

## 十、接口安全设计

### 10.1 签名验证

```typescript
// 签名验证服务
@Injectable()
export class SignatureService {
  private readonly secret: string;

  constructor() {
    this.secret = process.env.API_SIGNATURE_SECRET || 'default-secret';
  }

  // 生成签名
  generateSignature(params: Record<string, any>, timestamp: number): string {
    // 1. 排序参数
    const sortedParams = this.sortObject(params);

    // 2. 拼接参数字符串
    const queryString = Object.entries(sortedParams)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    // 3. 拼接时间戳
    const stringToSign = `${timestamp}${queryString}`;

    // 4. HMAC-SHA256签名
    return crypto
      .createHmac('sha256', this.secret)
      .update(stringToSign)
      .digest('hex');
  }

  // 验证签名
  verifySignature(
    params: Record<string, any>,
    signature: string,
    timestamp: number,
    ttl: number = 300000, // 5分钟
  ): boolean {
    // 1. 检查时间戳是否过期（防止重放攻击）
    if (Date.now() - timestamp > ttl) {
      return false;
    }

    // 2. 生成签名
    const expectedSignature = this.generateSignature(params, timestamp);

    // 3. 使用 TimingSafeEqual 比较，防止时序攻击
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  private sortObject(obj: Record<string, any>): Record<string, any> {
    return Object.keys(obj)
      .sort()
      .reduce((result, key) => {
        if (obj[key] !== undefined && obj[key] !== null) {
          result[key] = obj[key];
        }
        return result;
      }, {});
  }
}

// 签名验证中间件
@Injectable()
export class SignatureMiddleware implements NestMiddleware {
  constructor(private readonly signatureService: SignatureService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // 跳过GET请求
    if (req.method === 'GET') {
      return next();
    }

    const signature = req.headers['x-signature'] as string;
    const timestamp = parseInt(req.headers['x-timestamp'] as string, 10);

    if (!signature || !timestamp) {
      throw new BadRequestException('缺少签名参数');
    }

    const isValid = this.signatureService.verifySignature(
      req.body,
      signature,
      timestamp,
    );

    if (!isValid) {
      throw new UnauthorizedException('签名验证失败');
    }

    next();
  }
}
```

### 10.2 时间戳与防重放

```typescript
// 防重放攻击服务
@Injectable()
export class ReplayProtectionService {
  constructor(
    @Inject(REDIS) private redis: Redis,
  ) {}

  // 检查请求是否重复（5分钟窗口内）
  async isReplay(
    requestId: string,
    timestamp: number,
    windowMs: number = 300000,
  ): Promise<boolean> {
    const key = `replay:${requestId}`;

    // 检查是否已存在
    const exists = await this.redis.exists(key);
    if (exists) {
      return true; // 请求重复
    }

    // 设置过期时间
    await this.redis.setex(key, Math.ceil(windowMs / 1000), timestamp.toString());
    return false;
  }

  // 完整的请求验证
  async validateRequest(
    requestId: string,
    timestamp: number,
    signature: string,
    body: any,
  ): Promise<{ valid: boolean; reason?: string }> {
    const now = Date.now();

    // 1. 检查时间戳是否合理（前后5分钟）
    if (Math.abs(now - timestamp) > 300000) {
      return { valid: false, reason: '时间戳无效' };
    }

    // 2. 检查是否重复请求
    const isReplay = await this.isReplay(requestId, timestamp);
    if (isReplay) {
      return { valid: false, reason: '请求重复' };
    }

    // 3. 验证签名
    const signatureService = new SignatureService();
    const isValid = signatureService.verifySignature(body, signature, timestamp);
    if (!isValid) {
      return { valid: false, reason: '签名无效' };
    }

    return { valid: true };
  }
}

// 使用防重放中间件
@Injectable()
export class AntiReplayMiddleware implements NestMiddleware {
  constructor(
    private readonly replayProtectionService: ReplayProtectionService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const requestId = req.headers['x-request-id'] as string;
    const timestamp = parseInt(req.headers['x-timestamp'] as string, 10);
    const signature = req.headers['x-signature'] as string;

    if (!requestId || !timestamp || !signature) {
      throw new BadRequestException('缺少安全请求头');
    }

    const result = await this.replayProtectionService.validateRequest(
      requestId,
      timestamp,
      signature,
      req.body,
    );

    if (!result.valid) {
      throw new UnauthorizedException(result.reason);
    }

    next();
  }
}
```

### 10.3 防篡改设计

```typescript
// 防篡改验证服务
@Injectable()
export class TamperProofService {
  constructor(
    @Inject(REDIS) private redis: Redis,
  ) {}

  // 生成请求指纹
  generateFingerprint(req: Request): string {
    const components = [
      req.ip || '',
      req.headers['user-agent'] || '',
      req.headers['accept-language'] || '',
      req.url || '',
    ];

    const fingerprint = components.join('|');
    return crypto.createHash('sha256').update(fingerprint).digest('hex');
  }

  // 验证请求指纹
  async verifyFingerprint(
    requestId: string,
    expectedFingerprint: string,
  ): Promise<boolean> {
    const key = `fingerprint:${requestId}`;
    const stored = await this.redis.get(key);

    if (!stored) {
      // 首次请求，记录指纹
      const fingerprint = expectedFingerprint;
      await this.redis.setex(key, 3600, fingerprint);
      return true;
    }

    return stored === expectedFingerprint;
  }

  // 敏感数据加密
  encrypt(data: string, key?: string): string {
    const encryptionKey = key || process.env.ENCRYPTION_KEY;
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      Buffer.from(encryptionKey, 'hex'),
      iv,
    );

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  // 敏感数据解密
  decrypt(encryptedData: string, key?: string): string {
    const encryptionKey = key || process.env.ENCRYPTION_KEY;
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(encryptionKey, 'hex'),
      Buffer.from(ivHex, 'hex'),
    );

    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

---

## 十一、性能优化策略

### 11.1 压缩传输

```typescript
// compression配置
// npm install compression

// main.ts
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 启用gzip压缩
  app.use(compression({
    filter: (req, res) => {
      // 不压缩小于1KB的响应
      if (req.headers['x-no-compression']) {
        return false;
      }
      const contentType = res.getHeader('Content-Type') as string;
      return /json|text|javascript|css/.test(contentType);
    },
    level: 6, // 压缩级别 1-9
    threshold: 1024, // 小于1KB不压缩
  }));

  await app.listen(3000);
}
```

### 11.2 缓存控制

```typescript
// 缓存控制服务
@Injectable()
export class CacheControlService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  // 设置缓存
  async setCache(
    key: string,
    value: any,
    ttlSeconds: number,
  ): Promise<void> {
    await this.cacheManager.set(key, value, { ttl: ttlSeconds });
  }

  // 获取缓存
  async getCache<T>(key: string): Promise<T | null> {
    return this.cacheManager.get<T>(key);
  }

  // 清除缓存
  async invalidateCache(pattern: string): Promise<void> {
    // 使用通配符清除匹配的缓存
    const keys = await this.cacheManager.keys(`${pattern}*`);
    if (keys.length > 0) {
      await Promise.all(keys.map((key) => this.cacheManager.del(key)));
    }
  }
}

// HTTP缓存头控制
@Controller('users')
export class UsersController {
  @Get(':id')
  @Header('Cache-Control', 'private, max-age=300') // 私有缓存，5分钟
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  // 公开数据，使用CDN缓存
  @Get('public/list')
  @Header('Cache-Control', 'public, max-age=3600') // 公开缓存，1小时
  async findPublicList() {
    return this.usersService.findPublicUsers();
  }

  // 不缓存
  @Get('sensitive/data')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  async findSensitiveData() {
    return this.usersService.findSensitiveData();
  }
}
```

### 11.3 批量接口设计

```typescript
// 批量查询接口
@Controller('batch')
export class BatchController {
  @Post()
  async batchQuery(@Body() requests: BatchRequestDto[]): Promise<BatchResponseDto[]> {
    const results = await Promise.all(
      requests.map(async (req) => {
        try {
          const data = await this.resolveRequest(req);
          return { success: true, data };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }),
    );
    return results;
  }

  private async resolveRequest(req: BatchRequestDto): Promise<any> {
    switch (req.resource) {
      case 'users':
        return this.usersService.findById(req.id);
      case 'posts':
        return this.postsService.findById(req.id);
      case 'orders':
        return this.ordersService.findById(req.id);
      default:
        throw new BadRequestException('未知的资源类型');
    }
  }
}

// 批量DTO
export class BatchRequestDto {
  @IsString()
  @IsIn(['users', 'posts', 'orders'])
  resource: string;

  @IsString()
  id: string;
}
```

### 11.4 接口聚合

```typescript
// Dashboard聚合接口
@Controller('dashboard')
export class DashboardController {
  @Get()
  async getDashboard(@Req() req: Request): Promise<DashboardData> {
    const userId = req.user.id;

    // 并行获取多个数据源
    const [
      userProfile,
      recentOrders,
      notifications,
      stats,
    ] = await Promise.all([
      this.usersService.getProfile(userId),
      this.ordersService.getRecentOrders(userId, 5),
      this.notificationsService.getUnread(userId),
      this.statsService.getUserStats(userId),
    ]);

    return {
      user: userProfile,
      recentOrders,
      notifications,
      stats,
    };
  }
}
```

---

## 十二、案例：开放平台设计

### 12.1 平台架构

```typescript
// 开放平台核心架构

// 1. 网关层 - 统一入口
// 负责：路由转发、认证鉴权、限流熔断、日志监控

// 2. API层 - 业务逻辑
// 负责：参数校验、业务处理、响应封装

// 3. 服务层 - 领域服务
// 负责：核心业务逻辑、数据处理

// 4. 数据层 - 数据存储
// 负责：数据库访问、缓存管理

// 网关配置
const API_GATEWAY_CONFIG = {
  endpoints: [
    {
      path: '/open/api/v1/users',
      target: 'http://user-service:3001',
      methods: ['GET', 'POST'],
      rateLimit: { requests: 100, period: 60 },
    },
    {
      path: '/open/api/v1/orders',
      target: 'http://order-service:3002',
      methods: ['GET', 'POST', 'PATCH'],
      rateLimit: { requests: 50, period: 60 },
    },
  ],

  // 全局限流配置
  globalRateLimit: {
    free: { requests: 100, period: 60 },
    basic: { requests: 1000, period: 60 },
    pro: { requests: 10000, period: 60 },
    enterprise: { requests: 100000, period: 60 },
  },

  // 熔断配置
  circuitBreaker: {
    threshold: 50,        // 失败率阈值
    timeout: 30000,       // 超时时间
    resetTime: 60000,     // 重置时间
  },
};
```

### 12.2 认证机制

```typescript
// 开放平台认证：API Key + JWT
// 1. API Key：用于标识调用方
// 2. JWT：用于接口访问授权

@Injectable()
export class OpenPlatformAuthService {
  constructor(
    @Inject(REDIS) private redis: Redis,
    private readonly jwtService: JwtService,
  ) {}

  // 生成访问令牌
  async generateAccessToken(
    appId: string,
    appSecret: string,
  ): Promise<{ accessToken: string; expiresIn: number }> {
    // 1. 验证应用凭证
    const app = await this.validateAppCredentials(appId, appSecret);
    if (!app) {
      throw new UnauthorizedException('应用凭证无效');
    }

    // 2. 检查应用状态
    if (app.status !== 'active') {
      throw new ForbiddenException('应用已被禁用');
    }

    // 3. 生成JWT令牌
    const accessToken = await this.jwtService.signAsync(
      {
        sub: appId,
        type: 'access',
        permissions: app.permissions,
        tier: app.tier,
      },
      { expiresIn: '2h' },
    );

    // 4. 存储令牌黑名单（用于撤销）
    await this.redis.setex(`token:blacklist:${accessToken}`, 7200, '1');

    return { accessToken, expiresIn: 7200 };
  }

  // 验证访问令牌
  async validateAccessToken(token: string): Promise<TokenPayload> {
    // 检查是否在黑名单
    const isBlacklisted = await this.redis.get(`token:blacklist:${token}`);
    if (isBlacklisted) {
      throw new UnauthorizedException('令牌已失效');
    }

    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(token);
      return payload;
    } catch (error) {
      throw new UnauthorizedException('令牌验证失败');
    }
  }

  // 生成API Key
  async generateApiKey(userId: string): Promise<{ apiKey: string; apiSecret: string }> {
    const apiKey = `apk_${generateRandomString(16)}`;
    const apiSecret = generateRandomString(32);
    const hashedSecret = await bcrypt.hash(apiSecret, 10);

    await this.apiKeyRepository.save({
      userId,
      apiKey,
      apiSecret: hashedSecret,
      status: 'active',
      createdAt: new Date(),
    });

    // 返回原始密钥（只显示一次）
    return { apiKey, apiSecret };
  }

  // 验证API Key
  async validateApiKey(apiKey: string, apiSecret: string): Promise<AppInfo> {
    const keyRecord = await this.apiKeyRepository.findOne({
      where: { apiKey, status: 'active' },
      relations: ['user'],
    });

    if (!keyRecord) {
      throw new UnauthorizedException('API Key无效');
    }

    const isValid = await bcrypt.compare(apiSecret, keyRecord.apiSecret);
    if (!isValid) {
      throw new UnauthorizedException('API Secret错误');
    }

    return {
      appId: keyRecord.apiKey,
      userId: keyRecord.userId,
      permissions: keyRecord.user.permissions,
      tier: keyRecord.user.tier,
    };
  }
}
```

### 12.3 流量控制

```typescript
// 开放平台流量控制
@Injectable()
export class OpenPlatformRateLimitService {
  constructor(
    @Inject(REDIS) private redis: Redis,
  ) {}

  // 应用维度限流
  async checkAppRateLimit(
    appId: string,
    tier: 'free' | 'basic' | 'pro' | 'enterprise',
  ): Promise<RateLimitResult> {
    const limits = {
      free: { requests: 100, period: 60 },
      basic: { requests: 1000, period: 60 },
      pro: { requests: 10000, period: 60 },
      enterprise: { requests: 100000, period: 60 },
    };

    const limit = limits[tier];
    const key = `ratelimit:app:${appId}:${Math.floor(Date.now() / 1000 / limit.period)}`;

    const current = await this.redis.incr(key);
    if (current === 1) {
      await this.redis.expire(key, limit.period * 2);
    }

    const remaining = Math.max(0, limit.requests - current);
    const resetTime = Math.ceil(Date.now() / 1000 / limit.period) * limit.period + limit.period;

    return {
      allowed: current <= limit.requests,
      limit: limit.requests,
      remaining,
      resetAt: new Date(resetTime * 1000).toISOString(),
    };
  }

  // 接口维度限流
  async checkEndpointRateLimit(
    appId: string,
    endpoint: string,
  ): Promise<RateLimitResult> {
    const key = `ratelimit:endpoint:${appId}:${endpoint}`;
    const limit = 1000; // 默认每分钟1000次
    const window = 60;

    const current = await this.redis.incr(key);
    if (current === 1) {
      await this.redis.expire(key, window * 2);
    }

    return {
      allowed: current <= limit,
      limit,
      remaining: Math.max(0, limit - current),
      resetAt: new Date(Date.now() + window * 1000).toISOString(),
    };
  }

  // 突发流量控制
  async checkBurstRateLimit(appId: string): Promise<boolean> {
    const key = `ratelimit:burst:${appId}`;
    const now = Date.now();

    // 获取最近1秒的请求数
    const requests = await this.redis.lrange(key, 0, -1);
    const recentRequests = requests.filter((t) => now - parseInt(t) < 1000);

    if (recentRequests.length >= 10) {
      // 1秒内超过10个请求，触发限流
      return false;
    }

    // 记录当前请求
    await this.redis.rpush(key, now.toString());
    await this.redis.expire(key, 2);

    return true;
  }
}
```

### 12.4 监控体系

```typescript
// 开放平台监控
@Injectable()
export class OpenPlatformMonitorService {
  constructor(
    @Inject(REDIS) private redis: Redis,
  ) {}

  // 记录API调用
  async recordApiCall(call: ApiCallRecord): Promise<void> {
    const { appId, endpoint, method, statusCode, responseTime, timestamp } = call;

    // 存储调用记录
    const key = `metrics:calls:${appId}:${Math.floor(timestamp / 60000)}`;
    await this.redis.lpush(key, JSON.stringify({
      endpoint,
      method,
      statusCode,
      responseTime,
      timestamp,
    }));
    await this.redis.expire(key, 86400); // 保留24小时

    // 更新聚合统计
    await this.updateAggregatedStats(appId, endpoint, statusCode, responseTime);
  }

  // 更新聚合统计
  private async updateAggregatedStats(
    appId: string,
    endpoint: string,
    statusCode: number,
    responseTime: number,
  ): Promise<void> {
    const now = new Date();
    const hourKey = `${now.getHours()}`;
    const dateKey = now.toISOString().split('T')[0];

    // 更新小时统计
    const hourStatsKey = `metrics:hourly:${appId}:${dateKey}:${hourKey}`;
    await this.redis.hincrby(hourStatsKey, 'total', 1);
    await this.redis.hincrby(hourStatsKey, statusCode >= 400 ? 'errors' : 'success', 1);
    await this.redis.hincrbyfloat(hourStatsKey, 'totalResponseTime', responseTime);
    await this.redis.expire(hourStatsKey, 604800); // 保留7天

    // 更新日统计
    const dayStatsKey = `metrics:daily:${appId}:${dateKey}`;
    await this.redis.hincrby(dayStatsKey, 'total', 1);
    await this.redis.hincrby(dayStatsKey, statusCode >= 400 ? 'errors' : 'success', 1);
    await this.redis.hincrbyfloat(dayStatsKey, 'totalResponseTime', responseTime);
    await this.redis.expire(dayStatsKey, 2592000); // 保留30天
  }

  // 获取应用调用统计
  async getAppStats(
    appId: string,
    date: string,
  ): Promise<AppStats> {
    const dayStatsKey = `metrics:daily:${appId}:${date}`;
    const stats = await this.redis.hgetall(dayStatsKey);

    const total = parseInt(stats.total || '0', 10);
    const errors = parseInt(stats.errors || '0', 10);
    const totalResponseTime = parseFloat(stats.totalResponseTime || '0');

    return {
      totalCalls: total,
      successCalls: total - errors,
      errorCalls: errors,
      avgResponseTime: total > 0 ? totalResponseTime / total : 0,
      errorRate: total > 0 ? errors / total : 0,
    };
  }

  // 获取实时监控数据
  async getRealtimeMetrics(appId: string): Promise<RealtimeMetrics> {
    const recentCalls = await this.getRecentCalls(appId, 100);

    const responseTimes = recentCalls.map((c) => c.responseTime);
    const successRate = recentCalls.filter((c) => c.statusCode < 400).length / recentCalls.length;

    return {
      qps: this.calculateQPS(recentCalls),
      avgResponseTime: this.average(responseTimes),
      p95ResponseTime: this.percentile(responseTimes, 95),
      p99ResponseTime: this.percentile(responseTimes, 99),
      successRate,
      errorRate: 1 - successRate,
    };
  }
}

// 监控中间件
@Injectable()
export class MonitorMiddleware implements NestMiddleware {
  constructor(
    private readonly monitorService: OpenPlatformMonitorService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const appId = req.headers['x-app-id'] as string;

    // 记录响应
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;

      if (appId) {
        this.monitorService.recordApiCall({
          appId,
          endpoint: req.url,
          method: req.method,
          statusCode: res.statusCode,
          responseTime,
          timestamp: Date.now(),
        });
      }
    });

    next();
  }
}
```

---

## 总结

本文档全面介绍了企业级API设计的核心知识体系，涵盖以下关键领域：

**设计与规范**：掌握RESTful设计原则、资源命名、HTTP方法语义、状态码体系和版本管理策略，建立API设计的基础规范。

**安全性**：通过参数校验、签名验证、时间戳防重放、幂等性设计等手段，确保API的安全性和可靠性。

**性能优化**：通过压缩传输、缓存控制、批量接口和接口聚合等策略，提升API的响应速度和处理能力。

**开发效率**：通过自动文档生成、GraphQL等现代API技术，提高前后端协作效率和开发者体验。

**监控运维**：建立完善的限流机制、监控体系和告警策略，确保API服务的稳定运行。

这些最佳实践需要根据具体的业务场景和技术栈进行选择和调整，但核心原则是通用的：设计清晰、安全可靠、性能优异、易于维护。
