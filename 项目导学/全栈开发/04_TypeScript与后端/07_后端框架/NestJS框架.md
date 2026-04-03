# NestJS 框架详解

## 目录

1. [NestJS 架构](#1-nestjs-架构)
2. [模块系统](#2-模块系统)
3. [依赖注入](#3-依赖注入)
4. [控制器与服务](#4-控制器与服务)
5. [守卫与拦截器](#5-守卫与拦截器)

---

## 1. NestJS 架构

### 1.1 NestJS 简介

NestJS 是一个用于构建高效、可扩展的 Node.js 服务器端应用的框架。它使用 TypeScript 开发，结合了面向对象编程（OOP）、函数式编程（FP）和函数式响应式编程（FRP）的元素。

**NestJS 核心特性：**

- 基于 TypeScript
- 模块化架构
- 依赖注入
- 类似 Angular 的装饰器语法
- 支持 Express/Fastify
- 强大的生态系统

### 1.2 快速开始

```bash
# 安装 NestJS CLI
npm i -g @nestjs/cli

# 创建新项目
nest new my-project

# 或者手动安装
npm init
npm install @nestjs/core @nestjs/common @nestjs/platform-express reflect-metadata rxjs
```

### 1.3 基础应用

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}

bootstrap();

// app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

// app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}

// app.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
```

---

## 2. 模块系统

### 2.1 模块定义

```typescript
// users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './user.entity';

@Module({
  // 导入其他模块
  imports: [
    // 注册实体
    TypeOrmModule.forFeature([User]),
  ],
  // 控制器
  controllers: [UsersController],
  // 服务提供者
  providers: [UsersService],
  // 导出服务供其他模块使用
  exports: [UsersService],
})
export class UsersModule {}
```

### 2.2 共享模块

```typescript
// shared/shared.module.ts
import { Module, Global } from '@nestjs/common';
import { SharedService } from './shared.service';

@Global()  // 全局模块，在所有模块中可用
@Module({
  providers: [SharedService],
  exports: [SharedService],
})
export class SharedModule {}

// 或者不使用 @Global，通过导入共享
@Module({
  providers: [SharedService],
  exports: [SharedService],
})
export class SharedModule {}
```

### 2.3 动态模块

```typescript
// config/config.module.ts
import { Module, DynamicModule } from '@nestjs/common';
import { ConfigService } from './config.service';

@Module({})
export class ConfigModule {
  static forRoot(options: { envFilePath: string }): DynamicModule {
    return {
      module: ConfigModule,
      providers: [
        {
          provide: 'CONFIG_OPTIONS',
          useValue: options,
        },
        ConfigService,
      ],
      exports: [ConfigService],
    };
  }
}
```

### 2.4 根模块

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // 导入子模块
    UsersModule,
    AuthModule,
    // 配置数据库
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'password',
      database: 'mydb',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

---

## 3. 依赖注入

### 3.1 依赖注入原理

依赖注入是一种设计模式，NestJS 通过构造函数注入实现依赖管理。

```typescript
// 1. 定义服务
@Injectable()
export class UsersService {
  private users = [];

  findAll() {
    return this.users;
  }

  findOne(id: number) {
    return this.users.find(u => u.id === id);
  }

  create(user: CreateUserDto) {
    const newUser = { id: Date.now(), ...user };
    this.users.push(newUser);
    return newUser;
  }
}

// 2. 注入服务
@Controller('users')
export class UsersController {
  // 通过构造函数注入
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(parseInt(id));
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}
```

### 3.2 提供者类型

```typescript
// 1. 类提供者（最常用）
providers: [UsersService]

// 2. 值提供者
providers: [
  {
    provide: 'APP_CONFIG',
    useValue: {
      port: 3000,
      env: 'development',
    },
  },
]

// 注入
constructor(@Inject('APP_CONFIG') private config: any) {}

// 3. 工厂提供者
providers: [
  {
    provide: 'DB_CONNECTION',
    useFactory: async () => {
      const connection = await createConnection({
        // 配置
      });
      return connection;
    },
    inject: [ConfigService],  // 注入其他依赖
  },
]

// 4. 别名提供者
providers: [
  UsersService,
  {
    provide: 'IUsersService',
    useExisting: UsersService,
  },
]
```

### 3.3 模块间共享服务

```typescript
// 方式 1：在模块中导出
@Module({
  providers: [SharedService],
  exports: [SharedService],  // 导出服务
})
export class SharedModule {}

// 方式 2：导入模块
@Module({
  imports: [SharedModule],  // 导入并使用导出的服务
})
export class UsersModule {}
```

---

## 4. 控制器与服务

### 4.1 控制器基础

```typescript
import { Controller, Get, Post, Body, Param, Query, Headers, Req, Res, HttpCode, Header, Redirect, Status, ParseIntPipe } from '@nestjs/common';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET 请求
  @Get()
  findAll(@Query('page') page: string, @Query('limit') limit: string) {
    return this.usersService.findAll({ page: +page, limit: +limit });
  }

  // GET 带路由参数
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  // POST 请求
  @Post()
  @HttpCode(201)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // PUT 更新
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  // DELETE 删除
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }

  // 自定义响应头
  @Get('export')
  @Header('Content-Type', 'application/json')
  @Header('Content-Disposition', 'attachment; filename=users.json')
  export() {
    return this.usersService.findAll();
  }

  // 重定向
  @Get('old')
  @Redirect('https://new-site.com', 301)
  old() {
    return { url: 'https://new-site.com' };
  }

  // 获取请求头
  @Get('headers')
  getHeaders(@Headers() headers: any) {
    return headers;
  }
}
```

### 4.2 DTO 和验证

```typescript
// create-user.dto.ts
import { IsString, IsEmail, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  role?: string;
}

// update-user.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

// 创建 PartialType，自动生成所有属性可选的类型
export class UpdateUserDto extends PartialType(CreateUserDto) {}

// main.ts 配置验证管道
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,  // 自动剥离非白名单属性
    transform: true,  // 自动转换类型
    forbidNonWhitelisted: true,  // 有非白名单属性时抛出错误
  }));

  await app.listen(3000);
}
```

### 4.3 服务层

```typescript
// users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './create-user.dto';
import { UpdateUserDto } from './update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(query: { page?: number; limit?: number } = {}): Promise<{ data: User[]; total: number }> {
    const { page = 1, limit = 10 } = query;
    const [data, total] = await this.usersRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total };
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`用户 ${id} 不存在`);
    }
    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(createUserDto);
    return await this.usersRepository.save(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return await this.usersRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }
}
```

### 4.4 CRUD 完整示例

```typescript
// users.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
```

---

## 5. 守卫与拦截器

### 5.1 守卫（Guard）

守卫用于保护路由，决定请求是否可以访问。

```typescript
// auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization;

    if (!token) {
      throw new UnauthorizedException('未提供认证令牌');
    }

    try {
      // 验证 token
      const decoded = this.verifyToken(token);
      request.user = decoded;
      return true;
    } catch (error) {
      throw new UnauthorizedException('无效的令牌');
    }
  }

  private verifyToken(token: string): any {
    // 实现 token 验证逻辑
    return { userId: 1, username: 'test' };
  }
}

// 使用守卫
@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  // ...
}

// 或者在模块中全局注册
// app.module.ts
@Module({
  providers: [AuthGuard],
})
export class AppModule {}
```

### 5.2 角色守卫

```typescript
// roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return requiredRoles.includes(user.role);
  }
}

// 自定义装饰器
import { SetMetadata } from '@nestjs/common';
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// 使用
@Controller('users')
@UseGuards(AuthGuard, RolesGuard)
export class UsersController {
  @Get()
  @Roles('admin')
  findAll() {
    return '只有管理员可以访问';
  }
}
```

### 5.3 拦截器（Interceptor）

拦截器可以在方法执行前后添加逻辑。

```typescript
// logging.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body } = request;
    const now = Date.now();

    return next
      .handle()
      .pipe(
        tap(() => {
          const response = context.switchToHttp().getResponse();
          console.log(`${method} ${url} - ${Date.now() - now}ms - ${response.statusCode}`);
        }),
      );
  }
}

// 使用拦截器
@Controller('users')
@UseInterceptors(LoggingInterceptor)
export class UsersController {
  // ...
}
```

### 5.4 响应转换拦截器

```typescript
// transform.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  code: number;
  message: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map(data => ({
        code: 0,
        message: 'success',
        data,
      })),
    );
  }
}

// 使用
@Controller('users')
@UseInterceptors(TransformInterceptor)
export class UsersController {
  @Get()
  findAll() {
    return [{ name: '张三' }, { name: '李四' }];
  }
  // 响应格式: { code: 0, message: 'success', data: [...] }
}
```

### 5.5 异常过滤器

```typescript
// http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message || message;
    }

    response.status(status).json({
      code: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}

// 使用
@Controller('users')
@UseFilters(AllExceptionsFilter)
export class UsersController {
  // ...
}
```

---

## 常见面试问题

### 问题 1：NestJS 的依赖注入如何工作？

**答案：** NestJS 通过构造函数注入实现依赖管理。提供者在模块中注册，NestJS 容器自动解析依赖并注入到构造函数中。

### 问题 2：守卫和拦截器的区别？

**答案：** 守卫用于权限控制，在请求处理前执行；拦截器可以修改请求/响应，在方法执行前后都可以执行。

---

## 最佳实践

1. **模块化**：按功能模块划分代码
2. **分层清晰**：控制器处理请求，服务处理业务逻辑
3. **DTO 验证**：使用 class-validator 验证输入
4. **异常处理**：使用异常过滤器统一处理错误
5. **使用 TypeScript**：充分利用类型系统

---

## 6. 数据库集成

### 6.1 TypeORM 配置

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'password'),
        database: configService.get('DB_NAME', 'mydb'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
        migrations: ['src/migrations/*.ts'],
        migrationsRun: true,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
  ],
})
export class AppModule {}
```

### 6.2 实体定义

```typescript
// users/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Post } from '../posts/post.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  @Index()
  name: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column()
  @Exclude() // 排除敏感字段
  password: string;

  @Column({ default: 'user' })
  role: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 关联关系
  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];
}
```

### 6.3 Repository 模式

```typescript
// users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // 创建查询构建器
  private createQueryBuilder(): SelectQueryBuilder<User> {
    return this.usersRepository.createQueryBuilder('user');
  }

  // 分页查询
  async findAll(options: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ data: User[]; total: number }> {
    const { page = 1, limit = 10, search } = options;

    const queryBuilder = this.createQueryBuilder()
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      queryBuilder.where(
        'user.name ILIKE :search OR user.email ILIKE :search',
        { search: `%${search}%` },
      );
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  // 根据 ID 查询
  async findOne(id: string): Promise<User> {
    const user = await this.createQueryBuilder()
      .where('user.id = :id', { id })
      .leftJoinAndSelect('user.posts', 'posts')
      .getOne();

    if (!user) {
      throw new NotFoundException(`用户 ${id} 不存在`);
    }

    return user;
  }

  // 根据邮箱查询
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  // 创建用户
  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  // 更新用户
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  // 软删除
  async softDelete(id: string): Promise<void> {
    const user = await this.findOne(id);
    user.isActive = false;
    await this.usersRepository.save(user);
  }

  // 硬删除
  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }
}
```

---

## 7. 认证与授权

### 7.1 JWT 认证模块

```typescript
// auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { User } from '../users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '7d'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
```

### 7.2 JWT 策略

```typescript
// auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.usersService.findByEmail(payload.email);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('用户不存在或已被禁用');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: user.role,
    };
  }
}
```

### 7.3 认证服务

```typescript
// auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    // 检查邮箱是否已存在
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('邮箱已被注册');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // 创建用户
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    // 生成令牌
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: { id: user.id, name: user.name, email: user.email },
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    // 查找用户
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 生成令牌
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const user = await this.usersService.findByEmail(payload.email);

      if (!user) {
        throw new UnauthorizedException('用户不存在');
      }

      return this.generateTokens(user.id, user.email);
    } catch (error) {
      throw new UnauthorizedException('无效的刷新令牌');
    }
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }
}
```

### 7.4 认证控制器

```typescript
// auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
```

---

## 8. WebSocket 实时通信

### 8.1 WebSocket 网关

```typescript
// chat/chat.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from './ws-jwt.guard';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private chatService: ChatService) {}

  // 连接处理
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      const user = await this.chatService.validateUser(token);

      if (!user) {
        client.disconnect();
        return;
      }

      // 存储用户信息
      client.data.user = user;

      // 加入用户专属房间
      client.join(`user:${user.userId}`);

      // 广播用户上线
      this.server.emit('user:online', {
        userId: user.userId,
        status: 'online',
      });

      console.log(`用户 ${user.userId} 已连接`);
    } catch (error) {
      client.disconnect();
    }
  }

  // 断开连接处理
  handleDisconnect(client: Socket) {
    const user = client.data.user;

    if (user) {
      // 广播用户离线
      this.server.emit('user:offline', {
        userId: user.userId,
        status: 'offline',
      });

      console.log(`用户 ${user.userId} 已断开连接`);
    }
  }

  // 发送消息
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('message:send')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { to: string; content: string },
  ) {
    const user = client.data.user;

    // 保存消息
    const message = await this.chatService.saveMessage({
      from: user.userId,
      to: data.to,
      content: data.content,
    });

    // 发送给目标用户
    this.server.to(`user:${data.to}`).emit('message:receive', {
      id: message.id,
      from: user.userId,
      content: data.content,
      createdAt: message.createdAt,
    });

    // 确认发送成功
    client.emit('message:sent', { messageId: message.id });
  }

  // 打字状态
  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { to: string },
  ) {
    const user = client.data.user;
    client.to(`user:${data.to}`).emit('typing:start', {
      from: user.userId,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { to: string },
  ) {
    const user = client.data.user;
    client.to(`user:${data.to}`).emit('typing:stop', {
      from: user.userId,
    });
  }

  // 加入房间
  @SubscribeMessage('room:join')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    client.join(`room:${data.roomId}`);
    client.to(`room:${data.roomId}`).emit('room:user-joined', {
      userId: client.data.user.userId,
    });
  }

  // 离开房间
  @SubscribeMessage('room:leave')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    client.leave(`room:${data.roomId}`);
    client.to(`room:${data.roomId}`).emit('room:user-left', {
      userId: client.data.user.userId,
    });
  }
}
```

---

## 9. 测试

### 9.1 单元测试

```typescript
// users/users.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('应该成功创建用户', async () => {
      const createUserDto = {
        name: '张三',
        email: 'zhangsan@example.com',
        password: 'password123',
      };

      const user = { id: '1', ...createUserDto };

      mockRepository.create.mockReturnValue(user);
      mockRepository.save.mockResolvedValue(user);

      const result = await service.create(createUserDto);

      expect(mockRepository.create).toHaveBeenCalledWith(createUserDto);
      expect(mockRepository.save).toHaveBeenCalledWith(user);
      expect(result).toEqual(user);
    });
  });

  describe('findOne', () => {
    it('应该返回用户', async () => {
      const user = { id: '1', name: '张三' };

      mockRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(user),
      });

      const result = await service.findOne('1');

      expect(result).toEqual(user);
    });

    it('应该抛出 NotFoundException', async () => {
      mockRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });
});
```

### 9.2 E2E 测试

```typescript
// test/auth.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('应该成功注册', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: '测试用户',
          email: 'test@example.com',
          password: 'Password123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.user.email).toBe('test@example.com');
          expect(res.body.accessToken).toBeDefined();
        });
    });

    it('应该拒绝重复邮箱', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: '测试用户',
          email: 'test@example.com',
          password: 'Password123',
        })
        .expect(409);
    });
  });

  describe('/auth/login (POST)', () => {
    it('应该成功登录', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.accessToken).toBeDefined();
        });
    });

    it('应该拒绝错误密码', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });
});
```

---

## 10. 生产环境部署

### 10.1 Docker 配置

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

### 10.2 Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USERNAME=postgres
      - DB_PASSWORD=password
      - DB_NAME=mydb
      - JWT_SECRET=your-secret-key
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis
    restart: always

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: always

volumes:
  postgres_data:
  redis_data:
```

---

## 11. 面试高频问题

### 问题 1：NestJS 的依赖注入如何工作？

**答案：** NestJS 通过构造函数注入实现依赖管理。提供者在模块中注册，NestJS 容器自动解析依赖并注入到构造函数中。支持类提供者、值提供者、工厂提供者等多种形式。

### 问题 2：守卫和拦截器的区别？

**答案：** 
- **守卫（Guard）**：用于权限控制，在请求处理前执行，返回布尔值决定是否继续
- **拦截器（Interceptor）**：可以修改请求/响应，在方法执行前后都可以执行，适合日志、缓存、响应转换等

### 问题 3：NestJS 的模块系统有什么优势？

**答案：**
1. 代码组织清晰，按功能模块划分
2. 依赖注入自动管理
3. 模块可复用、可共享
4. 支持动态模块配置
5. 全局模块简化共享

### 问题 4：如何在 NestJS 中实现缓存？

**答案：**
1. 使用 @nestjs/cache-manager 模块
2. 使用 @UseInterceptors(CacheInterceptor) 装饰器
3. 配置 TTL 和存储策略
4. 支持 Redis 等分布式缓存

### 问题 5：NestJS 和 Express 的关系？

**答案：** NestJS 默认使用 Express 作为 HTTP 平台，也可以切换到 Fastify。NestJS 在 Express 之上提供了模块化、依赖注入、装饰器等企业级特性。

---

## 12. 最佳实践总结

### 12.1 项目结构

```
src/
├── modules/           # 功能模块
│   ├── users/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   └── auth/
├── common/            # 公共模块
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   └── pipes/
├── config/            # 配置
├── database/          # 数据库
└── main.ts
```

### 12.2 安全清单

- [ ] 使用 class-validator 验证输入
- [ ] 使用 Helmet 设置安全头
- [ ] 配置 CORS 白名单
- [ ] 实现速率限制
- [ ] JWT 安全配置
- [ ] 密码加密存储
- [ ] SQL 注入防护（使用 ORM）
- [ ] XSS 防护

### 12.3 性能优化清单

- [ ] 启用响应压缩
- [ ] 实现缓存策略
- [ ] 数据库连接池
- [ ] 使用索引优化查询
- [ ] 启用集群模式
- [ ] 日志异步写入

---

*本文档最后更新于 2026年3月*
