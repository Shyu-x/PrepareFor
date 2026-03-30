# NestJS框架深入指南

## 目录

1. [NestJS核心概念](#1-nestjs核心概念)
2. [模块系统](#2-模块系统)
3. [依赖注入](#3-依赖注入)
4. [控制器与路由](#4-控制器与路由)
5. [数据库集成](#5-数据库集成)
6. [微服务架构](#6-微服务架构)
7. [面试高频问题](#7-面试高频问题)

---

## 1. NestJS核心概念

### 1.1 NestJS架构概述

```
┌─────────────────────────────────────────────────────────────┐
│                   NestJS架构分层                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    控制器层 (Controllers)            │   │
│  │              处理HTTP请求，返回响应                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    服务层 (Services)                 │   │
│  │              业务逻辑处理                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    仓储层 (Repositories)             │   │
│  │              数据访问抽象                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    数据库 (Database)                 │   │
│  │              PostgreSQL / MongoDB / Redis            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  横切关注点:                                                │
│  ├── 守卫 (Guards) - 认证授权                              │
│  ├── 拦截器 (Interceptors) - 日志、转换                    │
│  ├── 管道 (Pipes) - 验证、转换                             │
│  ├── 过滤器 (Filters) - 异常处理                           │
│  └── 中间件 (Middleware) - 请求预处理                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 项目结构

```typescript
// NestJS项目结构

/*
src/
├── main.ts                    # 应用入口
├── app.module.ts              # 根模块
├── app.controller.ts          # 根控制器
├── app.service.ts             # 根服务
│
├── common/                    # 公共模块
│   ├── decorators/            # 自定义装饰器
│   ├── filters/               # 异常过滤器
│   ├── guards/                # 守卫
│   ├── interceptors/          # 拦截器
│   ├── pipes/                 # 管道
│   └── interfaces/            # 公共接口
│
├── config/                    # 配置
│   ├── database.config.ts
│   ├── jwt.config.ts
│   └── app.config.ts
│
├── modules/                   # 功能模块
│   ├── auth/                  # 认证模块
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   └── dto/
│   │
│   ├── users/                 # 用户模块
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── entities/
│   │   └── dto/
│   │
│   └── products/              # 产品模块
│       ├── products.module.ts
│       ├── products.controller.ts
│       ├── products.service.ts
│       └── ...
│
├── database/                  # 数据库
│   ├── migrations/
│   ├── seeds/
│   └── data-source.ts
│
└── utils/                     # 工具函数
    ├── logger.util.ts
    └── hash.util.ts
*/

// main.ts - 应用入口
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // 过滤非白名单属性
      forbidNonWhitelisted: true, // 拒绝非白名单属性
      transform: true,           // 自动转换类型
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS配置
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // API前缀
  app.setGlobalPrefix('api/v1');

  // Swagger文档
  const config = new DocumentBuilder()
    .setTitle('API文档')
    .setDescription('NestJS API文档')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
  console.log(`应用运行在: ${await app.getUrl()}`);
}
bootstrap();
```

---

## 2. 模块系统

### 2.1 模块定义

```typescript
// NestJS模块系统详解

import { Module, Global, DynamicModule, Provider } from '@nestjs/common';

// 基本模块定义
@Module({
  imports: [      // 导入其他模块
    TypeOrmModule.forFeature([User]),
    AuthModule,
  ],
  controllers: [UsersController],  // 控制器
  providers: [UsersService],       // 提供者（服务）
  exports: [UsersService],         // 导出给其他模块使用
})
export class UsersModule {}

// 全局模块
@Global()
@Module({
  providers: [ConfigService, LoggerService],
  exports: [ConfigService, LoggerService],
})
export class SharedModule {}

// 动态模块
@Module({})
export class DatabaseModule {
  static forRoot(config: DatabaseConfig): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        {
          provide: 'DATABASE_CONFIG',
          useValue: config,
        },
        {
          provide: DatabaseService,
          useFactory: (config: DatabaseConfig) => {
            return new DatabaseService(config);
          },
          inject: ['DATABASE_CONFIG'],
        },
      ],
      exports: [DatabaseService],
      global: true,
    };
  }

  static forFeature(entities: Function[]): DynamicModule {
    return {
      module: DatabaseModule,
      providers: entities.map((entity) => ({
        provide: `${entity.name}REPOSITORY`,
        useFactory: (dataSource: DataSource) => {
          return dataSource.getRepository(entity);
        },
        inject: [DataSource],
      })),
      exports: entities.map((entity) => `${entity.name}REPOSITORY`),
    };
  }
}

// 使用动态模块
@Module({
  imports: [
    DatabaseModule.forRoot({
      host: 'localhost',
      port: 5432,
      database: 'mydb',
    }),
    DatabaseModule.forFeature([User, Product]),
  ],
})
export class AppModule {}

// 模块懒加载
import { LazyModuleLoader } from '@nestjs/core';

@Module({})
export class AppModule {
  constructor(private lazyModuleLoader: LazyModuleLoader) {}

  async onModuleInit() {
    // 懒加载模块
    const { LazyModule } = await import('./lazy.module');
    const moduleRef = await this.lazyModuleLoader.load(() => LazyModule);
    const lazyService = moduleRef.get(LazyService);
  }
}
```

### 2.2 模块组织最佳实践

```typescript
// 模块组织最佳实践

// 1. 功能模块
// modules/users/users.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    // 只导入需要的模块
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService], // 只导出需要共享的服务
})
export class UsersModule {}

// 2. 核心模块
// modules/core/core.module.ts
@Global()
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [
    // 全局服务
    LoggerService,
    CacheService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
  exports: [LoggerService, CacheService],
})
export class CoreModule {}

// 3. 共享模块
// modules/shared/shared.module.ts
@Global()
@Module({
  imports: [CoreModule],
  providers: [DateUtil, StringUtil, HashUtil],
  exports: [DateUtil, StringUtil, HashUtil],
})
export class SharedModule {}

// 4. 根模块
// app.module.ts
@Module({
  imports: [
    // 核心模块
    CoreModule,
    SharedModule,

    // 功能模块
    UsersModule,
    AuthModule,
    ProductsModule,
    OrdersModule,

    // 基础设施模块
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
        logging: true,
      }),
      inject: [ConfigService],
    }),

    // Redis模块
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        host: config.get('REDIS_HOST'),
        port: config.get('REDIS_PORT'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

---

## 3. 依赖注入

### 3.1 提供者类型

```typescript
// NestJS依赖注入详解

import { Injectable, Inject, Optional, Scope } from '@nestjs/common';

// 1. 基本提供者
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }
}

// 2. 自定义提供者
// 使用值
const configProvider = {
  provide: 'CONFIG',
  useValue: {
    apiUrl: 'https://api.example.com',
    timeout: 5000,
  },
};

// 使用类
const loggerProvider = {
  provide: 'LOGGER',
  useClass: LoggerService,
};

// 使用工厂
const databaseProvider = {
  provide: 'DATABASE_CONNECTION',
  useFactory: async (configService: ConfigService) => {
    const connection = await createConnection({
      host: configService.get('DB_HOST'),
      port: configService.get('DB_PORT'),
    });
    return connection;
  },
  inject: [ConfigService],
};

// 使用现有提供者
const aliasProvider = {
  provide: 'ALIAS_LOGGER',
  useExisting: LoggerService,
};

// 3. 异步提供者
const asyncProvider = {
  provide: 'ASYNC_SERVICE',
  useFactory: async () => {
    const data = await fetchDataFromSomewhere();
    return new AsyncService(data);
  },
};

// 4. 作用域提供者
@Injectable({ scope: Scope.REQUEST })
export class RequestScopedService {
  constructor(private readonly request: Request) {}

  getUserId(): string {
    return this.request.user?.id;
  }
}

@Injectable({ scope: Scope.TRANSIENT })
export class TransientService {
  // 每次注入创建新实例
}

// 5. 条件提供者
const conditionalProvider = {
  provide: 'FEATURE_SERVICE',
  useFactory: (config: ConfigService) => {
    if (config.get('FEATURE_ENABLED')) {
      return new FeatureService();
    }
    return new NoOpService();
  },
  inject: [ConfigService],
};

// 6. 注入方式
@Injectable()
export class OrdersService {
  // 构造函数注入
  constructor(
    private usersService: UsersService,
    @Inject('CONFIG') private config: any,
    @Optional() private optionalService?: OptionalService,
  ) {}

  // 属性注入
  @Inject('LOGGER')
  private logger: LoggerService;

  // 方法注入
  @Inject('CACHE')
  setCache(cache: CacheService) {
    this.cache = cache;
  }
}

// 7. 循环依赖解决
// 使用forwardRef
@Injectable()
export class ServiceA {
  constructor(
    @Inject(forwardRef(() => ServiceB))
    private serviceB: ServiceB,
  ) {}
}

@Injectable()
export class ServiceB {
  constructor(
    @Inject(forwardRef(() => ServiceA))
    private serviceA: ServiceA,
  ) {}
}

// 模块中使用forwardRef
@Module({
  imports: [forwardRef(() => ServiceBModule)],
})
export class ServiceAModule {}
```

### 3.2 自定义装饰器

```typescript
// 自定义装饰器

import {
  SetMetadata,
  createParamDecorator,
  ExecutionContext,
  applyDecorators,
  UseGuards,
} from '@nestjs/common';

// 1. 元数据装饰器
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// 使用
@Roles('admin', 'manager')
@UseGuards(RolesGuard)
@Controller('admin')
export class AdminController {}

// 2. 参数装饰器
export const User = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);

// 使用
@Controller('users')
export class UsersController {
  @Get('profile')
  getProfile(@User() user: UserEntity) {
    return user;
  }

  @Get('email')
  getEmail(@User('email') email: string) {
    return { email };
  }
}

// 3. 组合装饰器
export function Auth(...roles: string[]) {
  return applyDecorators(
    SetMetadata('roles', roles),
    UseGuards(JwtAuthGuard, RolesGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: '未授权' }),
  );
}

// 使用
@Controller('admin')
export class AdminController {
  @Auth('admin')
  @Get('dashboard')
  getDashboard() {
    return { message: 'Admin Dashboard' };
  }
}

// 4. 缓存装饰器
import { CacheKey, CacheTTL } from '@nestjs/cache-manager';

export function Cache(key: string, ttl: number = 60) {
  return applyDecorators(
    CacheKey(key),
    CacheTTL(ttl),
  );
}

// 使用
@Controller('products')
export class ProductsController {
  @Get()
  @Cache('products_list', 300)
  findAll() {
    return this.productsService.findAll();
  }
}

// 5. 事务装饰器
import { Transaction, TransactionManager, EntityManager } from 'typeorm';

export function Transactional() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return this.dataSource.transaction(async (manager: EntityManager) => {
        return originalMethod.apply(this, [...args, manager]);
      });
    };

    return descriptor;
  };
}

// 使用
@Injectable()
export class OrdersService {
  @Transactional()
  async createOrder(dto: CreateOrderDto, @TransactionManager() manager: EntityManager) {
    const order = manager.create(Order, dto);
    await manager.save(order);
    return order;
  }
}
```

---

## 4. 控制器与路由

### 4.1 控制器详解

```typescript
// NestJS控制器详解

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  Headers,
  Ip,
  Session,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Redirect,
  Header,
  Render,
  UseGuards,
  UseInterceptors,
  UsePipes,
  UseFilters,
  ParseIntPipe,
  ParseUUIDPipe,
  DefaultValuePipe,
} from '@nestjs/common';

@Controller('users')
@UseGuards(JwtAuthGuard)
@UseInterceptors(LoggingInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('sort') sort?: 'asc' | 'desc',
  ) {
    return this.usersService.findAll({ page, limit, sort });
  }

  // GET /users/:id
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.findOne(id);
  }

  // POST /users
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createUserDto: CreateUserDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.usersService.create(createUserDto, { ip, userAgent });
  }

  // PUT /users/:id
  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  // PATCH /users/:id/status
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: UserStatus,
  ) {
    return this.usersService.updateStatus(id, status);
  }

  // DELETE /users/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.usersService.remove(id);
  }

  // 重定向
  @Get('docs')
  @Redirect('https://docs.nestjs.com', 302)
  getDocs() {
    return { url: 'https://docs.nestjs.com/v6/' };
  }

  // 自定义响应头
  @Get('custom-header')
  @Header('Cache-Control', 'none')
  @Header('X-Custom-Header', 'value')
  getWithCustomHeader() {
    return { message: 'Custom header set' };
  }

  // 渲染模板
  @Get('profile-page')
  @Render('profile')
  getProfilePage(@User() user: UserEntity) {
    return { user };
  }

  // 原始请求/响应
  @Post('upload')
  async uploadFile(@Req() req: Request, @Res() res: Response) {
    // 处理文件上传
    const file = req.file;

    // 手动发送响应
    res.status(201).json({
      message: 'File uploaded',
      filename: file.originalname,
    });
  }

  // Session
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Session() session: Record<string, any>,
  ) {
    const user = await this.usersService.validateUser(loginDto);
    session.userId = user.id;
    return { message: 'Logged in' };
  }
}

// 路由参数验证
@Controller('products')
export class ProductsController {
  // 自定义管道验证
  @Get(':id')
  async findOne(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }))
    id: number,
  ) {
    return this.productsService.findOne(id);
  }

  // 多个参数
  @Get(':categoryId/products/:productId')
  async findProductInCategory(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.productsService.findByCategory(categoryId, productId);
  }
}

// 版本控制
@Controller({
  path: 'users',
  version: '1',
})
export class UsersV1Controller {
  @Get()
  findAll() {
    return { version: 1 };
  }
}

@Controller({
  path: 'users',
  version: '2',
})
export class UsersV2Controller {
  @Get()
  findAll() {
    return { version: 2 };
  }
}

// main.ts启用版本控制
app.enableVersioning({
  type: VersioningType.URI,
});
```

### 4.2 请求生命周期

```typescript
// NestJS请求生命周期

/*
┌─────────────────────────────────────────────────────────────┐
│                   请求处理流程                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Incoming Request                                        │
│         │                                                   │
│         ▼                                                   │
│  2. Middleware (中间件)                                     │
│         │                                                   │
│         ▼                                                   │
│  3. Guards (守卫)                                           │
│         │                                                   │
│         ▼                                                   │
│  4. Interceptors - Before (拦截器前置)                      │
│         │                                                   │
│         ▼                                                   │
│  5. Pipes (管道)                                            │
│         │                                                   │
│         ▼                                                   │
│  6. Controller Handler (控制器处理)                         │
│         │                                                   │
│         ▼                                                   │
│  7. Service (服务)                                          │
│         │                                                   │
│         ▼                                                   │
│  8. Interceptors - After (拦截器后置)                       │
│         │                                                   │
│         ▼                                                   │
│  9. Exception Filters (异常过滤器)                          │
│         │                                                   │
│         ▼                                                   │
│  10. Response                                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
*/

// 中间件
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  }
}

// 守卫
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request.user = payload;
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

// 拦截器
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          `${request.method} ${request.url} - ${Date.now() - now}ms`,
        );
      }),
      map((data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
      catchError((error) => {
        this.logger.error(`${request.method} ${request.url} - Error: ${error.message}`);
        return throwError(() => error);
      }),
    );
  }
}

// 管道
@Injectable()
export class ValidationPipe implements PipeTransform {
  constructor(private readonly validator: Validator) {}

  async transform(value: any, metadata: ArgumentMetadata) {
    if (!value) {
      throw new BadRequestException('No data submitted');
    }

    const { metatype } = metadata;
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value);
    const errors = await this.validator.validate(object);

    if (errors.length > 0) {
      const messages = errors.map((error) => ({
        property: error.property,
        constraints: error.constraints,
      }));
      throw new BadRequestException(messages);
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}

// 异常过滤器
@Catch()
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message;
    }

    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${JSON.stringify(message)}`,
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
```

---

## 5. 数据库集成

### 5.1 TypeORM集成

```typescript
// TypeORM集成详解

// 1. 实体定义
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column()
  name: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ type: 'jsonb', nullable: true })
  preferences: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  // 关联关系
  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @OneToOne(() => Profile, (profile) => profile.user)
  profile: Profile;

  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable()
  roles: Role[];
}

// 2. 仓储模式
@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private repository: Repository<User>,
  ) {}

  async findAll(options: FindUsersDto): Promise<[User[], number]> {
    const queryBuilder = this.repository.createQueryBuilder('user');

    if (options.search) {
      queryBuilder.where(
        'user.name ILIKE :search OR user.email ILIKE :search',
        { search: `%${options.search}%` },
      );
    }

    if (options.role) {
      queryBuilder.andWhere('user.role = :role', { role: options.role });
    }

    queryBuilder
      .orderBy('user.createdAt', options.sort || 'DESC')
      .skip((options.page - 1) * options.limit)
      .take(options.limit);

    return queryBuilder.getManyAndCount();
  }

  async findOneById(id: string): Promise<User | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['profile', 'roles'],
    });
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'name', 'role'],
    });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.repository.create(createUserDto);
    return this.repository.save(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    await this.repository.update(id, updateUserDto);
    return this.findOneById(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}

// 3. 服务层
@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly cacheManager: Cache,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(options: FindUsersDto): Promise<PaginatedResult<User>> {
    const cacheKey = `users:${JSON.stringify(options)}`;

    // 尝试从缓存获取
    const cached = await this.cacheManager.get<PaginatedResult<User>>(cacheKey);
    if (cached) {
      return cached;
    }

    const [users, total] = await this.usersRepository.findAll(options);
    const result: PaginatedResult<User> = {
      data: users,
      meta: {
        total,
        page: options.page,
        limit: options.limit,
        totalPages: Math.ceil(total / options.limit),
      },
    };

    // 缓存结果
    await this.cacheManager.set(cacheKey, result, 300);

    return result;
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOneById(id);
    if (!user) {
      throw new NotFoundException(`用户 ${id} 不存在`);
    }
    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // 检查邮箱是否存在
    const existing = await this.usersRepository.findOneByEmail(createUserDto.email);
    if (existing) {
      throw new ConflictException('邮箱已被注册');
    }

    // 哈希密码
    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

    // 创建用户
    const user = await this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    // 发送事件
    this.eventEmitter.emit('user.created', user);

    return user;
  }

  @Transactional()
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // 如果更新密码，需要哈希
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 12);
    }

    return this.usersRepository.update(id, updateUserDto);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.softDelete(id);

    // 发送事件
    this.eventEmitter.emit('user.deleted', user);
  }
}

// 4. 数据库迁移
// migrations/1234567890-CreateUsersTable.ts
export class CreateUsersTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'email',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'password',
            type: 'varchar',
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
```

---

## 6. 微服务架构

### 6.1 微服务通信

```typescript
// NestJS微服务架构

// 1. 微服务配置
// main.ts
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://localhost:5672'],
        queue: 'users_queue',
        queueOptions: {
          durable: true,
        },
      },
    },
  );

  await app.listen();
}
bootstrap();

// 2. 消息模式
@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 请求-响应模式
  @MessagePattern({ cmd: 'find_user' })
  async findOne(@Payload() data: { id: string }): Promise<User> {
    return this.usersService.findOne(data.id);
  }

  // 事件模式
  @EventPattern('user_created')
  async handleUserCreated(@Payload() data: UserCreatedEvent) {
    await this.usersService.handleUserCreated(data);
  }
}

// 3. 客户端代理
@Injectable()
export class OrdersService {
  constructor(
    @Inject('USERS_SERVICE') private usersClient: ClientProxy,
  ) {}

  async createOrder(userId: string, orderData: CreateOrderDto) {
    // 调用用户服务
    const user = await this.usersClient
      .send({ cmd: 'find_user' }, { id: userId })
      .toPromise();

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 创建订单
    const order = await this.create(orderData);

    // 发送事件
    this.usersClient.emit('order_created', { userId, orderId: order.id });

    return order;
  }
}

// 4. 模块配置
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'USERS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'users_queue',
        },
      },
      {
        name: 'PRODUCTS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'products_queue',
        },
      },
    ]),
  ],
})
export class OrdersModule {}

// 5. gRPC微服务
// proto/user.proto
/*
syntax = "proto3";

package user;

service UserService {
  rpc FindOne (UserById) returns (User) {}
  rpc FindAll (Empty) returns (UserList) {}
}

message UserById {
  string id = 1;
}

message User {
  string id = 1;
  string name = 2;
  string email = 3;
}

message UserList {
  repeated User users = 1;
}

message Empty {}
*/

// gRPC控制器
@Controller()
export class UsersGrpcController {
  constructor(private readonly usersService: UsersService) {}

  @GrpcMethod('UserService', 'FindOne')
  async findOne(data: UserById): Promise<User> {
    return this.usersService.findOne(data.id);
  }

  @GrpcMethod('UserService', 'FindAll')
  async findAll(): Promise<UserList> {
    const users = await this.usersService.findAll();
    return { users };
  }
}

// gRPC客户端
@Injectable()
export class UsersGrpcClient {
  private userService: UserService;

  onModuleInit() {
    const client = new ClientGrpc({
      transport: Transport.GRPC,
      options: {
        package: 'user',
        protoPath: join(__dirname, 'proto/user.proto'),
      },
    });

    this.userService = client.getService<UserService>('UserService');
  }

  async findOne(id: string): Promise<User> {
    return this.userService.findOne({ id }).toPromise();
  }
}
```

---

## 7. 面试高频问题

### 问题1：NestJS的依赖注入是如何实现的？

**答案：**
1. 使用反射API获取构造函数参数类型
2. 通过@Injectable装饰器注册提供者
3. 容器根据类型信息自动解析依赖
4. 支持多种注入方式：构造函数、属性、方法

### 问题2：NestJS请求生命周期？

**答案：**
1. 中间件
2. 守卫
3. 拦截器（前置）
4. 管道
5. 控制器
6. 服务
7. 拦截器（后置）
8. 异常过滤器

### 问题3：模块间如何通信？

**答案：**
1. 导出服务供其他模块使用
2. 使用全局模块
3. 微服务消息通信
4. 事件发射器

### 问题4：如何处理循环依赖？

**答案：**
1. 使用forwardRef延迟解析
2. 重构模块结构避免循环
3. 提取共享服务到公共模块

### 问题5：NestJS vs Express的区别？

**答案：**
| 方面 | NestJS | Express |
|------|--------|---------|
| 架构 | 模块化、分层 | 灵活、无约束 |
| TypeScript | 原生支持 | 需要配置 |
| 依赖注入 | 内置 | 需要第三方库 |
| 测试 | 易于测试 | 需要更多配置 |
| 学习曲线 | 较陡 | 平缓 |

---

## 8. 最佳实践总结

### 8.1 项目结构清单

- [ ] 按功能划分模块
- [ ] 使用全局模块共享服务
- [ ] 分离控制器、服务、仓储
- [ ] 使用DTO进行数据传输
- [ ] 统一异常处理

### 8.2 性能优化清单

- [ ] 使用缓存
- [ ] 数据库连接池
- [ ] 启用压缩
- [ ] 使用懒加载模块
- [ ] 实现请求限流

---

*本文档最后更新于 2026年3月*