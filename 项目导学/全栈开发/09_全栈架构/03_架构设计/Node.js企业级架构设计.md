# Node.js企业级架构设计

## 目录

1. [NestJS企业架构核心](#1-nestjs企业架构核心)
2. [TypeScript类型安全实践](#2-typescript类型安全实践)
3. [依赖注入最佳实践](#3-依赖注入最佳实践)
4. [微服务架构设计](#4-微服务架构设计)
5. [Redis缓存策略](#5-redis缓存策略)
6. [消息队列集成](#6-消息队列集成)
7. [实战面试题](#7-实战面试题)

---

## 1. NestJS企业架构核心

### 1.1 模块化架构设计

```typescript
/**
 * NestJS企业级模块化架构
 * 采用DDD（领域驱动设计）思想组织代码结构
 */

// src/
// ├── modules/              # 功能模块
// │   ├── auth/            # 认证模块
// │   ├── users/           # 用户模块
// │   ├── orders/          # 订单模块
// │   └── products/        # 产品模块
// ├── common/              # 公共模块
// │   ├── decorators/      # 自定义装饰器
// │   ├── filters/         # 异常过滤器
// │   ├── guards/          # 守卫
// │   ├── interceptors/    # 拦截器
// │   └── pipes/           # 管道
// ├── config/             # 配置模块
// ├── database/           # 数据库模块
// └── shared/             # 共享模块

/**
 * 用户模块完整结构示例
 * 遵循单一职责原则，每个模块内聚相关功能
 */

// modules/users/users.module.ts - 模块定义
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';
import { UsersRepository } from './users.repository';

// 领域模块定义
@Module({
  imports: [
    // 导入TypeORM实体
    TypeOrmModule.forFeature([User, UserProfile]),
    // 导入相关模块
    AuthModule,
    MailModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  // 导出服务供其他模块使用
  exports: [UsersService],
})
export class UsersModule {}

// modules/users/users.service.ts - 领域服务
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { HashService } from '../../common/services/hash.service';

/**
 * 用户服务 - 处理用户相关业务逻辑
 * 遵循依赖注入原则，所有依赖通过构造函数注入
 */
@Injectable()
export class UsersService {
  constructor(
    // 使用装饰器注入Repository
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    // 注入其他服务
    private readonly hashService: HashService,
    private readonly mailService: MailService,
  ) {}

  /**
   * 创建用户
   * @param createUserDto - 创建用户数据传输对象
   * @returns 创建的用户
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // 检查邮箱是否已存在
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('该邮箱已被注册');
    }

    // 哈希密码
    const hashedPassword = await this.hashService.hash(createUserDto.password);

    // 创建用户实体
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    // 保存并返回
    const savedUser = await this.userRepository.save(user);

    // 发送欢迎邮件（异步，不阻塞响应）
    this.mailService.sendWelcomeEmail(savedUser.email).catch(console.error);

    return savedUser;
  }

  /**
   * 分页查询用户列表
   * @param page - 页码
   * @param limit - 每页数量
   * @returns 分页结果
   */
  async findAll(page = 1, limit = 10) {
    const [users, total] = await this.userRepository.findAndCount({
      select: ['id', 'email', 'username', 'status', 'createdAt'],
      where: { status: UserStatus.ACTIVE },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

// modules/users/entities/user.entity.ts - 实体定义
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { UserProfile } from './user-profile.entity';
import { Order } from '../../orders/entities/order.entity';

/**
 * 用户实体 - 对应数据库users表
 * 使用装饰器定义表结构
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  username: string;

  @Column()
  password: string; // 加密存储

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @OneToOne(() => UserProfile, (profile) => profile.user)
  profile: UserProfile;

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// 枚举定义
enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned',
}
```

### 1.2 控制器与路由设计

```typescript
/**
 * RESTful API控制器设计
 * 遵循REST最佳实践和NestJS约定
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  Pagination,
  // 认证相关
  UseGuards,
  // 文档相关
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

/**
 * 用户控制器
 * 处理HTTP请求，返回标准化响应
 */
@ApiTags('用户管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * 创建用户
   * POST /users
   */
  @Post()
  @Roles('admin')
  @ApiOperation({ summary: '创建用户', description: '管理员创建新用户' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 409, description: '邮箱已存在' })
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return {
      code: 201,
      message: '创建成功',
      data: user,
    };
  }

  /**
   * 分页查询用户列表
   * GET /users?page=1&limit=10
   */
  @Get()
  @ApiOperation({ summary: '查询用户列表' })
  async findAll(@Query() paginationDto: PaginationDto) {
    const result = await this.usersService.findAll(
      paginationDto.page,
      paginationDto.limit,
    );
    return {
      code: 200,
      message: '查询成功',
      ...result,
    };
  }

  /**
   * 获取单个用户
   * GET /users/:id
   */
  @Get(':id')
  @ApiOperation({ summary: '获取用户详情' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return {
      code: 200,
      message: '查询成功',
      data: user,
    };
  }

  /**
   * 更新用户
   * PUT /users/:id
   */
  @Put(':id')
  @ApiOperation({ summary: '更新用户信息' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.usersService.update(id, updateUserDto);
    return {
      code: 200,
      message: '更新成功',
      data: user,
    };
  }

  /**
   * 删除用户（软删除）
   * DELETE /users/:id
   */
  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: '删除用户' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.usersService.softDelete(id);
    return {
      code: 200,
      message: '删除成功',
    };
  }
}
```

---

## 2. TypeScript类型安全实践

### 2.1 泛型与类型约束

```typescript
/**
 * TypeScript泛型深度应用
 * 实现类型安全的通用工具和业务逻辑
 */

/**
 * 基础响应包装器
 * 确保所有API响应具有统一结构
 */
interface ApiResponse<T> {
  code: number;      // 状态码
  message: string;   // 消息
  data: T;           // 数据
  timestamp: number; // 时间戳
  traceId?: string;  // 追踪ID
}

/**
 * 分页响应
 * 统一分页数据结构
 */
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;       // 总数
    page: number;       // 当前页
    limit: number;      // 每页数量
    totalPages: number; // 总页数
  };
}

/**
 * 泛型分页查询参数
 */
interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * 带排序的分页查询参数
 */
interface SortablePaginationParams extends PaginationParams {
  sortBy?: string;      // 排序字段
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * 泛型CRUD服务基类
 * 提供标准的增删改查实现
 */
abstract class BaseService<
  Entity extends { id: string },
  CreateDto,
  UpdateDto,
  WhereDto,
> {
  protected abstract getRepository(): any;

  /**
   * 创建实体
   */
  async create(dto: CreateDto): Promise<Entity> {
    const repo = this.getRepository();
    const entity = repo.create(dto);
    return repo.save(entity);
  }

  /**
   * 根据ID查找
   */
  async findById(id: string): Promise<Entity | null> {
    return this.getRepository().findOne({ where: { id } });
  }

  /**
   * 分页查询
   */
  async findAll(
    params: SortablePaginationParams,
  ): Promise<PaginatedResponse<Entity>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = params;

    const [data, total] = await this.getRepository().findAndCount({
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 条件查询
   */
  async findByCondition(where: WhereDto): Promise<Entity[]> {
    return this.getRepository().find({ where });
  }

  /**
   * 更新
   */
  async update(id: string, dto: UpdateDto): Promise<Entity> {
    const repo = this.getRepository();
    const entity = await this.findById(id);
    if (!entity) {
      throw new NotFoundException('实体不存在');
    }
    Object.assign(entity, dto);
    return repo.save(entity);
  }

  /**
   * 删除
   */
  async delete(id: string): Promise<void> {
    await this.getRepository().delete(id);
  }
}

/**
 * 类型守卫 - 运行时类型检查
 */
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'email' in obj &&
    'username' in obj
  );
}

/**
 * 类型谓词 - 过滤特定类型
 */
function filterUsers(items: unknown[]): User[] {
  return items.filter((item): item is User => isUser(item));
}

/**
 * 条件类型 - 根据状态返回不同类型
 */
type Response<T> = T extends { status: 'success' }
  ? { data: T['data']; error: null }
  : { data: null; error: T['error'] };

/**
 * 映射类型 - 全部属性可选
 */
type Partial<T> = {
  [P in keyof T]?: T[P];
};

/**
 * 映射类型 - 全部属性只读
 */
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

/**
 * 映射类型 - 选择性属性
 */
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

type UserNameAndEmail = Pick<User, 'username' | 'email'>;
```

### 2.2 装饰器与元数据

```typescript
/**
 * 自定义TypeScript装饰器
 * 实现声明式编程风格
 */

// 定义元数据的键
const METADATA_KEY = {
  RATE_LIMIT: 'rate_limit',
  CACHE_TTL: 'cache_ttl',
  AUDIT_LOG: 'audit_log',
};

/**
 * 限流装饰器
 * 为接口设置请求频率限制
 */
function RateLimit(limit: number, windowMs: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    // 保存原始方法
    const originalMethod = descriptor.value;

    // 替换方法实现
    descriptor.value = async function (...args: any[]) {
      // 获取用户标识（从请求上下文）
      const userId = this.getUserId?.();

      // 检查限流
      if (userId && !checkRateLimit(userId, limit, windowMs)) {
        throw new HttpException('请求过于频繁', 429);
      }

      // 执行原方法
      return originalMethod.apply(this, args);
    };

    // 将元数据附加到方法
    Reflect.defineMetadata(
      METADATA_KEY.RATE_LIMIT,
      { limit, windowMs },
      target,
      propertyKey,
    );

    return descriptor;
  };
}

/**
 * 缓存装饰器
 * 自动缓存方法返回值
 */
function Cacheable(ttlSeconds: number) {
  const cache = new Map<string, { value: any; expiry: number }>();

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // 生成缓存键
      const cacheKey = `${propertyKey}:${JSON.stringify(args)}`;

      // 检查缓存
      const cached = cache.get(cacheKey);
      if (cached && cached.expiry > Date.now()) {
        return cached.value;
      }

      // 执行原方法
      const result = await originalMethod.apply(this, args);

      // 存入缓存
      cache.set(cacheKey, {
        value: result,
        expiry: Date.now() + ttlSeconds * 1000,
      });

      return result;
    };

    return descriptor;
  };
}

/**
 * 审计日志装饰器
 * 自动记录操作日志
 */
function AuditLog(action: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const userId = this.getUserId?.();

      try {
        const result = await originalMethod.apply(this, args);

        // 记录成功日志
        this.logger.log({
          action,
          userId,
          method: propertyKey,
          duration: Date.now() - startTime,
          status: 'success',
        });

        return result;
      } catch (error) {
        // 记录失败日志
        this.logger.error({
          action,
          userId,
          method: propertyKey,
          duration: Date.now() - startTime,
          status: 'error',
          error: error.message,
        });
        throw error;
      }
    };

    return descriptor;
  };
}

// 使用示例
class UsersController {
  @RateLimit(100, 60000) // 1分钟内最多100次请求
  @Cacheable(300) // 缓存5分钟
  @AuditLog('查询用户')
  async findUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @RateLimit(10, 60000) // 1分钟内最多10次请求
  @AuditLog('创建用户')
  async createUser(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }
}
```

---

## 3. 依赖注入最佳实践

### 3.1 作用域与生命周期

```typescript
/**
 * NestJS依赖注入作用域与生命周期
 * 理解不同作用域对性能和状态的影响
 */

// Scope枚举定义
export enum Scope {
  DEFAULT = 'default',      // 单例（默认）
  TRANSIENT = 'transient',  // 临时（每次注入创建新实例）
  REQUEST = 'request',      // 请求作用域（每个请求创建新实例）
}

/**
 * 单例服务 - 默认作用域
 * 应用启动时创建，整个应用生命周期内共享
 * 适用于：无状态服务、配置服务、工具类
 */
@Injectable()
class ConfigService {
  private config = { /* 加载配置 */ };

  get(key: string) {
    return this.config[key];
  }
}

/**
 * 请求作用域服务
 * 每个HTTP请求创建新实例，请求结束时销毁
 * 适用于：需要请求上下文的服务
 */
@Injectable({ scope: Scope.REQUEST })
class RequestContextService {
  // 每次请求有独立的请求ID
  constructor(
    @Inject(REQUEST) private readonly request: Request,
  ) {
    this.requestId = crypto.randomUUID();
  }

  requestId: string;

  getHeaders() {
    return this.request.headers;
  }
}

/**
 * 临时作用域服务
 * 每次注入都创建新实例
 * 适用于：有状态且不应共享的服务
 */
@Injectable({ scope: Scope.TRANSIENT })
class LoggerService {
  // 每个实例有独立的实例ID
  private instanceId = crypto.randomUUID();

  log(message: string) {
    console.log(`[${this.instanceId}] ${message}`);
  }
}

/**
 * 使用工厂函数创建服务
 * 适用于：需要根据配置或依赖动态创建服务
 */
@Injectable()
class DatabaseService {
  constructor(
    private readonly configService: ConfigService,
  ) {}

  // 动态获取连接池大小
  getPoolSize() {
    return this.configService.get('database.poolSize');
  }
}

// 工厂提供者示例
{
  provide: 'ASYNC_CONFIG',
  useFactory: async (configService: ConfigService) => {
    // 可以进行异步初始化
    const config = await fetchRemoteConfig();
    return config;
  },
  inject: [ConfigService],
}

/**
 * 可选依赖
 * 当依赖不存在时不抛出错误
 */
@Injectable()
class OptionalDepService {
  constructor(
    @Optional()
    @Inject('CACHE_SERVICE')
    private readonly cacheService?: CacheService,
  ) {}

  async getData(key: string) {
    if (this.cacheService) {
      const cached = await this.cacheService.get(key);
      if (cached) return cached;
    }
    return this.fetchFromDb(key);
  }
}
```

### 3.2 模块间依赖组织

```typescript
/**
 * 模块间依赖组织最佳实践
 * 避免循环依赖，合理设计模块边界
 */

/**
 * 共享模块
 * 被多个模块依赖的公共服务
 */
@Module({
  providers: [
    ConfigService,
    LoggerService,
    HashService,
    ValidationService,
  ],
  exports: [
    ConfigService,
    LoggerService,
    HashService,
    ValidationService,
  ],
})
export class CommonModule {}

/**
 * 数据库模块
 * 提供数据库连接和仓储
 */
@Module({
  imports: [ConfigModule],
  providers: [DatabaseService, ...entityProviders],
  exports: [DatabaseService],
})
export class DatabaseModule {}

/**
 * 认证模块
 * 只导出必要的接口，不暴露内部实现
 */
@Module({
  imports: [DatabaseModule, CommonModule],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    LocalAuthGuard,
  ],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard], // 只导出需要共享的
})
export class AuthModule {}

/**
 * 用户模块
 * 依赖认证模块获取用户信息
 */
@Module({
  imports: [
    DatabaseModule,
    CommonModule,
    forwardRef(() => AuthModule), // 解决循环依赖
  ],
  providers: [UsersService, UsersRepository],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}

/**
 * 产品模块
 * 不依赖认证模块，通过其他方式验证权限
 */
@Module({
  imports: [DatabaseModule, CommonModule],
  providers: [ProductsService, ProductsRepository],
  controllers: [ProductsController],
  exports: [ProductsService],
})
export class ProductsModule {}
```

---

## 4. 微服务架构设计

### 4.1 服务间通信

```typescript
/**
 * NestJS微服务通信模式
 * 支持TCP、Redis、MQTT等多种传输层
 */

import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { Observable } from 'rxjs';

/**
 * 用户服务 - 消息生产者
 */
@Controller()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    // 注入客户端代理
    private readonly client: ClientProxy,
  ) {}

  /**
   * 发送消息到订单服务
   */
  async notifyOrderCreated(userId: string, orderId: string) {
    // 异步发送，不等待响应
    this.client.emit('user.order.created', {
      userId,
      orderId,
      timestamp: Date.now(),
    });
  }

  /**
   * 请求-响应模式
   */
  async getUserOrders(userId: string) {
    // 发送请求并等待响应
    const orders = await this.client.send(
      { cmd: 'orders.getByUser' },
      userId,
    ).toPromise();

    return orders;
  }
}

/**
 * 订单服务 - 消息消费者
 */
@Controller()
export class OrdersController {
  @MessagePattern({ cmd: 'orders.getByUser' })
  // 处理来自用户的请求
  async getUserOrders(@Payload() userId: string): Promise<Order[]> {
    return this.ordersService.findByUserId(userId);
  }

  @MessagePattern('user.order.created')
  // 监听用户创建订单的事件
  handleUserOrderCreated(@Payload() data: any) {
    // 更新用户订单统计
    return this.userStatsService.updateStats(data.userId);
  }
}

/**
 * Redis消息模式
 * 使用Redis作为消息中间件
 */
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'REDIS_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: 'localhost',
          port: 6379,
        },
      },
    ]),
  ],
  controllers: [RedisController],
})
export class RedisModule {}

@Controller()
export class RedisController {
  @MessagePattern('cache.invalidate')
  async handleCacheInvalidate(@Payload() keys: string[]) {
    // 清除缓存
    const redis = this.redisClient.getConnection();
    await redis.del(...keys);
  }
}
```

### 4.2 API网关设计

```typescript
/**
 * API网关 - 微服务统一入口
 * 负责请求路由、认证、限流等功能
 */

import {
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
  CacheInterceptor,
  SetMetadata,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

/**
 * GraphQL网关控制器
 * 聚合多个微服务的数据
 */
@ApiTags('API网关')
@ApiBearerAuth()
@Controller('graphql')
export class GraphqlGatewayController {
  constructor(
    private readonly userClient: ClientProxy,
    private readonly orderClient: ClientProxy,
    private readonly productClient: ClientProxy,
  ) {}

  /**
   * 聚合查询 - 获取用户及其订单和产品
   */
  @Post()
  async query(@Body() query: GraphQLQuery) {
    // 并行获取多个服务的数据
    const [user, orders, preferences] = await Promise.all([
      this.userClient.send({ cmd: 'users.getFullProfile' }, query.userId).toPromise(),
      this.orderClient.send({ cmd: 'orders.getRecent' }, { userId: query.userId, limit: 10 }).toPromise(),
      this.productClient.send({ cmd: 'products.getRecommended' }, query.userId).toPromise(),
    ]);

    return {
      user,
      orders,
      recommendedProducts: preferences?.products || [],
    };
  }
}

/**
 * REST网关控制器
 * 提供统一的REST API入口
 */
@Controller('api/v1')
export class RestGatewayController {
  /**
   * 动态路由 - 代理到下游服务
   */
  @Get('proxy/:service/*')
  @UseGuards(RateLimitGuard)
  @UseInterceptors(CacheInterceptor, LoggingInterceptor)
  async proxyRequest(
    @Param('service') service: string,
    @Req() req: Request,
    @Query() query: Record<string, string>,
  ) {
    // 根据service参数路由到不同服务
    const targetService = this.serviceRegistry.get(service);
    if (!targetService) {
      throw new NotFoundException('服务不存在');
    }

    // 转发请求
    return this.httpService.forward(
      targetService.url,
      req.method,
      req.body,
      { ...query, ...req.params },
    );
  }
}
```

---

## 5. Redis缓存策略

### 5.1 缓存模式实现

```typescript
/**
 * Redis缓存策略完整实现
 * 支持多种缓存模式和过期策略
 */

import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * 缓存服务
 * 提供统一的缓存操作接口
 */
@Injectable()
class CacheService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly defaultTTL = 3600; // 默认1小时

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  /**
   * 基础操作
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await this.redis.setex(key, ttl, serialized);
    } else {
      await this.redis.set(key, serialized);
    }
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.redis.exists(key)) === 1;
  }

  /**
   * 缓存-aside模式
   * 先查缓存，缓存不存在再查数据库并写入缓存
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    // 1. 尝试从缓存获取
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // 2. 缓存不存在，从数据源获取
    const value = await factory();

    // 3. 写入缓存
    await this.set(key, value, ttl || this.defaultTTL);

    return value;
  }

  /**
   * 缓存穿透防护 - 布隆过滤器
   */
  private bloomFilter = new Set<string>(); // 简化实现

  async getWithBloomFilter<T>(
    key: string,
    factory: () => Promise<T | null>,
    ttl?: number,
  ): Promise<T | null> {
    // 检查布隆过滤器
    if (!this.bloomFilter.has(key)) {
      // 布隆过滤器认为不存在，直接返回null（防止缓存穿透）
      return null;
    }

    return this.getOrSet(key, factory, ttl);
  }

  /**
   * 缓存击穿防护 - 单飞模式
   * 大量请求同时访问同一个不存在的key时，只让一个请求回源
   */
  private locks = new Map<string, Promise<any>>();

  async getWithLock<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    // 已有请求在加载数据
    if (this.locks.has(key)) {
      return this.locks.get(key);
    }

    // 缓存存在
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // 创建锁
    const lockPromise = (async () => {
      try {
        const value = await factory();
        await this.set(key, value, ttl);
        return value;
      } finally {
        this.locks.delete(key);
      }
    })();

    this.locks.set(key, lockPromise);
    return lockPromise;
  }

  /**
   * 缓存雪崩防护 - 随机过期时间
   */
  async setWithJitter(key: string, value: any, baseTTL?: number): Promise<void> {
    const ttl = baseTTL
      ? baseTTL + Math.floor(Math.random() * baseTTL * 0.1) // ±10%抖动
      : this.defaultTTL;
    await this.set(key, value, ttl);
  }

  /**
   * Redis Hash - 对象缓存
   */
  async hget<T>(key: string, field: string): Promise<T | null> {
    const value = await this.redis.hget(key, field);
    return value ? JSON.parse(value) : null;
  }

  async hset(key: string, field: string, value: any): Promise<void> {
    await this.redis.hset(key, field, JSON.stringify(value));
  }

  async hgetall<T>(key: string): Promise<Record<string, T>> {
    const data = await this.redis.hgetall(key);
    const result: Record<string, T> = {};
    for (const [field, value] of Object.entries(data)) {
      result[field] = JSON.parse(value);
    }
    return result;
  }

  /**
   * Redis Sorted Set - 有序集合
   * 适用于排行榜、限流等场景
   */
  async zadd(key: string, score: number, member: string): Promise<void> {
    await this.redis.zadd(key, score, member);
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.redis.zrange(key, start, stop);
  }

  async zrevrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.redis.zrevrange(key, start, stop);
  }

  /**
   * 分布式锁
   */
  async acquireLock(
    resource: string,
    ttlMs: number = 10000,
  ): Promise<string | null> {
    const lockKey = `lock:${resource}`;
    const lockValue = crypto.randomUUID();

    // SET NX EX 原子操作
    const result = await this.redis.set(lockKey, lockValue, 'PX', ttlMs, 'NX');

    return result === 'OK' ? lockValue : null;
  }

  async releaseLock(resource: string, lockValue: string): Promise<boolean> {
    const lockKey = `lock:${resource}`;

    // Lua脚本确保原子性
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    const result = await this.redis.eval(script, 1, lockKey, lockValue);
    return result === 1;
  }
}
```

### 5.2 会话与Token管理

```typescript
/**
 * 基于Redis的会话和Token管理
 */

// JWT Token刷新机制
@Injectable()
class TokenService {
  constructor(
    private readonly redis: Redis,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 创建访问令牌
   */
  async createAccessToken(userId: string): Promise<string> {
    const token = this.jwtService.sign(
      { sub: userId, type: 'access' },
      { expiresIn: '15m' },
    );

    // 将token加入黑名单（用于撤销）
    await this.redis.setex(`blacklist:${token}`, 900, '1'); // 15分钟过期

    return token;
  }

  /**
   * 创建刷新令牌
   */
  async createRefreshToken(userId: string): Promise<string> {
    const token = this.jwtService.sign(
      { sub: userId, type: 'refresh' },
      { expiresIn: '7d' },
    );

    // 存储刷新令牌到Redis
    await this.redis.setex(`refresh:${userId}`, 7 * 24 * 3600, token);

    return token;
  }

  /**
   * 验证并刷新令牌
   */
  async refreshTokens(refreshToken: string): Promise<Tokens | null> {
    try {
      const payload = this.jwtService.verify(refreshToken);

      if (payload.type !== 'refresh') {
        return null;
      }

      // 检查Redis中的令牌是否匹配
      const storedToken = await this.redis.get(`refresh:${payload.sub}`);
      if (storedToken !== refreshToken) {
        return null; // 令牌已被撤销或刷新
      }

      // 生成新令牌
      const newAccessToken = await this.createAccessToken(payload.sub);
      const newRefreshToken = await this.createRefreshToken(payload.sub);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch {
      return null;
    }
  }

  /**
   * 撤销所有用户令牌（登出所有设备）
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    // 删除刷新令牌
    await this.redis.del(`refresh:${userId}`);

    // 将用户的访问令牌加入黑名单集合
    // （实际应用中可以用布隆过滤器优化）
    const keys = await this.redis.keys(`blacklist:user:${userId}:*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

---

## 6. 消息队列集成

### 6.1 Bull队列实现

```typescript
/**
 * Bull消息队列完整实现
 * 用于异步任务处理和系统解耦
 */

import { Processor, Process, OnQueueActive, OnQueueCompleted } from '@nestjs/bull';
import { Job } from 'bull';

/**
 * 邮件队列处理器
 */
@Processor('mail')
export class MailProcessor {
  constructor(
    private readonly mailerService: MailerService,
    private readonly logger: LoggerService,
  ) {}

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`开始处理任务 ${job.id}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job) {
    this.logger.log(`任务 ${job.id} 已完成`);
  }

  /**
   * 处理发送邮件任务
   */
  @Process('send')
  async handleSendMail(job: Job<MailJobData>) {
    const { to, subject, template, context } = job.data;

    this.logger.log(`发送邮件到 ${to}`);

    try {
      await this.mailerService.send({
        to,
        subject,
        template,
        context,
      });

      return { success: true, to };
    } catch (error) {
      this.logger.error(`发送邮件失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 处理批量发送任务
   */
  @Process('batch')
  async handleBatchMail(job: Job<BatchMailJobData>) {
    const { emails } = job.data;
    const results = [];

    // 分批处理，每批100个
    const batchSize = 100;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);

      await Promise.all(
        batch.map((email) =>
          this.mailerService.send(email).then(() => ({ success: true })),
        ),
      );

      // 更新进度
      await job.progress(Math.min(((i + batchSize) / emails.length) * 100, 100));
    }

    return { success: true, count: emails.length };
  }
}

/**
 * 订单服务 - 任务生产者
 */
@Injectable()
class OrderService {
  constructor(
    @InjectQueue('mail') private readonly mailQueue: Queue,
    @InjectQueue('notification') private readonly notificationQueue: Queue,
  ) {}

  /**
   * 创建订单后，触发后续处理
   */
  async createOrder(createOrderDto: CreateOrderDto, user: User) {
    // 1. 创建订单
    const order = await this.orderRepository.save(createOrderDto);

    // 2. 发送确认邮件（异步）
    await this.mailQueue.add('send', {
      to: user.email,
      subject: '订单确认',
      template: 'order-confirmation',
      context: { order },
    });

    // 3. 发送推送通知（延迟执行）
    await this.notificationQueue.add(
      'push',
      { userId: user.id, message: '您的订单已创建' },
      { delay: 5000 }, // 5秒后执行
    );

    // 4. 更新统计数据（立即执行）
    await this.notificationQueue.add('stats', {
      type: 'order_created',
      amount: order.total,
    });

    return order;
  }

  /**
   * 延迟任务示例 - 订单超时取消
   */
  async scheduleOrderTimeout(orderId: string, ttlMinutes: number) {
    await this.notificationQueue.add(
      'order-timeout',
      { orderId },
      {
        delay: ttlMinutes * 60 * 1000, // 转换为毫秒
        jobId: `order-timeout:${orderId}`, // 唯一ID，防止重复
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }
}

/**
 * 订单超时处理器
 */
@Processor('notification')
export class OrderTimeoutProcessor {
  @Process('order-timeout')
  async handleOrderTimeout(job: Job<{ orderId: string }>) {
    const { orderId } = job.data;

    // 检查订单状态
    const order = await this.orderRepository.findOne(orderId);

    if (order && order.status === OrderStatus.PENDING) {
      // 超时未支付，取消订单
      await this.orderRepository.update(orderId, {
        status: OrderStatus.CANCELLED,
        cancelReason: '支付超时自动取消',
      });

      // 释放库存
      await this.inventoryService.releaseReservedStock(orderId);
    }
  }
}
```

### 6.2 事件驱动架构

```typescript
/**
 * 事件驱动架构实现
 * 使用EventEmitter实现领域事件
 */

import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * 定义领域事件
 */
class OrderCreatedEvent {
  eventName = 'order.created';

  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly total: number,
    public readonly timestamp: Date = new Date(),
  ) {}
}

class OrderPaidEvent {
  eventName = 'order.paid';

  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly paymentId: string,
  ) {}
}

/**
 * 事件发布者
 */
@Injectable()
class OrderEventPublisher {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * 发布订单创建事件
   */
  publishOrderCreated(order: Order) {
    this.eventEmitter.emit(
      'order.created',
      new OrderCreatedEvent(order.id, order.userId, order.total),
    );
  }

  /**
   * 发布订单支付事件
   */
  publishOrderPaid(order: Order, paymentId: string) {
    this.eventEmitter.emit(
      'order.paid',
      new OrderPaidEvent(order.id, order.userId, paymentId),
    );
  }
}

/**
 * 事件监听器
 */
@Injectable()
class OrderEventListeners {
  constructor(
    private readonly mailService: MailService,
    private readonly inventoryService: InventoryService,
    private readonly statsService: StatsService,
  ) {}

  /**
   * 监听订单创建事件
   */
  @OnEvent('order.created')
  async handleOrderCreated(event: OrderCreatedEvent) {
    // 发送确认邮件
    await this.mailService.sendOrderConfirmation(event.orderId);
  }

  /**
   * 监听订单支付事件
   */
  @OnEvent('order.paid')
  async handleOrderPaid(event: OrderPaidEvent) {
    // 扣减库存
    await this.inventoryService.confirmReservation(event.orderId);

    // 更新统计
    await this.statsService.recordPayment(event.orderId, event.paymentId);

    // 发送通知
    await this.notificationService.notifyUser(event.userId, '订单已支付');
  }
}

/**
 * 异步事件监听器
 * 使用@OnEvent装饰器标记异步处理
 */
@Injectable()
class AnalyticsEventListener {
  @OnEvent('order.paid', { async: true })
  async handleOrderPaidAsync(event: OrderPaidEvent) {
    // 异步记录分析数据，不阻塞主流程
    await this.analyticsService.trackOrder(event);
  }
}
```

---

## 7. 实战面试题

### 面试题1：NestJS依赖注入原理

```typescript
// 面试题：NestJS的依赖注入是如何工作的？

/**
 * 答案要点：
 * 1. NestJS使用IoC容器管理依赖关系
 * 2. @Injectable()装饰器标记可注入的服务
 * 3. 构造函数注入是最常用的方式
 * 4. 装饰器@Inject()指定注入的token
 * 5. 模块封装作用域，控制依赖可见性
 *
 * 底层实现：
 * - Reflect.metadata获取构造函数参数类型
 * - 使用IoC容器存储和解析依赖
 * - 支持多种注入方式（构造函数、属性、setter）
 */

// 示例代码
@Injectable()
class UserService {
  constructor(
    @Inject('USER_REPOSITORY')
    private readonly userRepo: Repository<User>,

    private readonly configService: ConfigService,
  ) {}
}
```

### 面试题2：微服务通信模式选择

```typescript
// 面试题：什么时候使用同步通信（RPC）？什么时候使用异步通信（消息队列）？

/**
 * 答案要点：
 *
 * 同步通信（RPC）- 适用场景：
 * - 需要立即获取结果
 * - 强一致性要求
 * - 简单查询操作
 * 示例：获取用户信息、验证Token
 *
 * 异步通信（消息队列）- 适用场景：
 * - 不需要立即返回结果
 * - 可接受最终一致性
 * - 耗时较长的处理
 * - 需要解耦和削峰
 * 示例：发送邮件、生成报表、订单后续处理
 */

// 示例决策逻辑
function shouldUseAsync(serviceName: string): boolean {
  const asyncServices = [
    'mail',           // 发送邮件不需要立即响应
    'notification',   // 推送通知可异步
    'analytics',      // 分析数据可批量处理
    'export',         // 导出任务耗时较长
  ];

  return asyncServices.includes(serviceName);
}
```

### 面试题3：缓存一致性策略

```typescript
// 面试题：如何保证缓存和数据库的一致性？

/**
 * 答案要点：
 *
 * 1. Cache-Aside（旁路缓存）
 *    - 读：先读缓存，没有再读DB并写入缓存
 *    - 写：先更新DB，再删除缓存（不是更新）
 *
 * 2. Read-Through
 *    - 缓存自动加载数据，应用程序不感知缓存
 *
 * 3. Write-Through
 *    - 同时更新缓存和数据库
 *
 * 4. Write-Behind
 *    - 先写缓存，异步批量写数据库
 *
 * 实际推荐：Cache-Aside + TTL
 */

// 示例实现
class UserService {
  async findById(id: string): Promise<User | null> {
    // 1. 先查缓存
    const cached = await this.cache.get<User>(`user:${id}`);
    if (cached) return cached;

    // 2. 缓存不存在，查数据库
    const user = await this.userRepo.findOne(id);
    if (!user) return null;

    // 3. 写入缓存
    await this.cache.set(`user:${id}`, user, 3600);

    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    // 1. 更新数据库
    const user = await this.userRepo.update(id, dto);

    // 2. 删除缓存（不是更新，防止数据不一致）
    await this.cache.delete(`user:${id}`);

    return user;
  }
}
```

---

## 总结

Node.js企业级架构设计的核心要点：

1. **NestJS模块化**：DDD思想组织代码，清晰的模块边界，依赖注入实现解耦
2. **TypeScript类型安全**：泛型、装饰器、元数据实现声明式编程
3. **依赖注入**：理解作用域与生命周期，避免循环依赖
4. **微服务架构**：同步RPC与异步消息队列合理选择，API网关统一入口
5. **Redis缓存**：多种缓存模式防护穿透、击穿、雪崩
6. **消息队列**：Bull实现异步任务，事件驱动实现系统解耦

掌握这些架构设计原则，能够构建可扩展、可维护的企业级Node.js应用。
