# NestJS任务管理系统实战项目

## 项目概述

本项目是一个完整的全栈任务管理系统，使用NestJS构建，包含用户管理、认证授权、任务管理、通知系统、WebSocket实时更新等核心模块。

### 技术栈

- **框架**：NestJS 11.x
- **语言**：TypeScript 5.x
- **数据库**：PostgreSQL + TypeORM
- **认证**：JWT + Refresh Token
- **验证**：Class Validator + Class Transformer
- **实时通信**：Socket.IO
- **API文档**：Swagger
- **缓存**：Redis
- **队列**：BullMQ

---

## 项目结构

```
nestjs-task-manager/
├── src/
│   ├── app.module.ts              # 应用主模块
│   ├── main.ts                    # 应用入口
│   ├── common/                    # 公共模块
│   │   ├── decorators/           # 自定义装饰器
│   │   │   ├── roles.decorator.ts
│   │   │   └── user.decorator.ts
│   │   ├── filters/              # 异常过滤器
│   │   │   └── http-exception.filter.ts
│   │   ├── guards/               # 守卫
│   │   │   ├── roles.guard.ts
│   │   │   └── jwt-auth.guard.ts
│   │   ├── interceptors/         # 拦截器
│   │   │   ├── logging.interceptor.ts
│   │   │   └── response.interceptor.ts
│   │   └── pipes/                # 管道
│   │       └── parse-date.pipe.ts
│   ├── modules/                   # 业务模块
│   │   ├── users/                # 用户模块
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── entities/
│   │   │   │   └── user.entity.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   └── update-user.dto.ts
│   │   │   └── users.module.ts
│   │   ├── auth/                 # 认证模块
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── entities/
│   │   │   │   └── refresh-token.entity.ts
│   │   │   ├── dto/
│   │   │   │   ├── login.dto.ts
│   │   │   │   └── refresh-token.dto.ts
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts
│   │   │   └── auth.module.ts
│   │   ├── tasks/                # 任务模块
│   │   │   ├── tasks.controller.ts
│   │   │   ├── tasks.service.ts
│   │   │   ├── entities/
│   │   │   │   └── task.entity.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-task.dto.ts
│   │   │   │   ├── update-task.dto.ts
│   │   │   │   └── query-tasks.dto.ts
│   │   │   └── tasks.module.ts
│   │   ├── notifications/        # 通知模块
│   │   │   ├── notifications.controller.ts
│   │   │   ├── notifications.service.ts
│   │   │   ├── entities/
│   │   │   │   └── notification.entity.ts
│   │   │   ├── dto/
│   │   │   │   └── create-notification.dto.ts
│   │   │   └── notifications.module.ts
│   │   └── socket/               # WebSocket模块
│   │       ├── socket.gateway.ts
│   │       └── socket.module.ts
│   ├── config/                    # 配置
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   └── app.config.ts
│   └── utils/                     # 工具函数
│       ├── pagination.utils.ts
│       └── hash.utils.ts
├── test/                          # 测试文件
├── .env                           # 环境变量
├── nest-cli.json                  # NestJS CLI配置
├── tsconfig.json                  # TypeScript配置
└── package.json
```

---

## 核心功能模块

### 1. 用户管理模块

#### 用户实体 (modules/users/entities/user.entity.ts)

```typescript
/**
 * 用户实体
 * 定义用户数据结构和关系
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Task } from '../../tasks/entities/task.entity';
import { Notification } from '../../notifications/entities/notification.entity';

// 用户角色枚举
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

/**
 * 用户实体类
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true })
  username: string;

  @Column({ length: 100, unique: true })
  email: string;

  @Column({ select: false }) // 查询时默认不返回密码
  password: string;

  @Column({ length: 50, nullable: true })
  avatar: string;

  @Column({ length: 200, nullable: true })
  bio: string;

  @Column({ default: UserRole.USER })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @Column({ nullable: true })
  lastLoginIp: string;

  @OneToMany(() => Task, task => task.user)
  tasks: Task[];

  @OneToMany(() => Notification, notification => notification.user)
  notifications: Notification[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * 插入前加密密码
   */
  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  /**
   * 更新前加密密码
   */
  @BeforeUpdate()
  async updateHashPassword() {
    if (this.isPasswordModified()) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  /**
   * 检查密码是否被修改
   */
  isPasswordModified(): boolean {
    // 这里需要根据具体场景实现密码修改检测
    // 简单实现：如果password字段被设置则返回true
    return true;
  }

  /**
   * 验证密码
   * @param password 明文密码
   * @returns 是否匹配
   */
  async validatePassword(password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
  }

  /**
   * 生成密码哈希
   * @param password 明文密码
   * @returns 哈希值
   */
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }
}
```

#### 用户DTO (modules/users/dto/)

```typescript
/**
 * 创建用户DTO
 */
import { IsString, IsEmail, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @IsEmail()
  @MaxLength(100)
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  avatar?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  bio?: string;
}

/**
 * 更新用户DTO
 */
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsString()
  @IsOptional()
  id?: string;
}
```

#### 用户服务 (modules/users/users.service.ts)

```typescript
/**
 * 用户服务
 * 处理用户相关的业务逻辑
 */

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { hashPassword } from '../../utils/hash.utils';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * 创建新用户
   * @param createUserDto 用户数据
   * @returns 创建的用户
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // 检查用户名是否已存在
    const existingUsername = await this.usersRepository.findOne({
      where: { username: createUserDto.username },
    });
    
    if (existingUsername) {
      throw new BadRequestException('用户名已存在');
    }

    // 检查邮箱是否已存在
    const existingEmail = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });
    
    if (existingEmail) {
      throw new BadRequestException('邮箱已存在');
    }

    // 创建用户
    const user = this.usersRepository.create({
      ...createUserDto,
      password: await hashPassword(createUserDto.password),
      role: UserRole.USER,
      isActive: true,
    });

    return await this.usersRepository.save(user);
  }

  /**
   * 查询所有用户
   * @param options 查询选项
   * @returns 用户列表
   */
  async findAll(options?: {
    page?: number;
    limit?: number;
    role?: UserRole;
    isActive?: boolean;
  }): Promise<{ users: User[]; total: number }> {
    const { page = 1, limit = 10, role, isActive } = options || {};

    // 构建查询条件
    const where: any = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;

    // 计算跳过数量
    const skip = (page - 1) * limit;

    // 执行查询
    const [users, total] = await this.usersRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { users, total };
  }

  /**
   * 根据ID查询用户
   * @param id 用户ID
   * @returns 用户信息
   */
  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  /**
   * 根据用户名查询用户
   * @param username 用户名
   * @returns 用户信息
   */
  async findByUsername(username: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { username },
      select: ['id', 'username', 'email', 'password', 'role', 'isActive'],
    });

    return user;
  }

  /**
   * 根据邮箱查询用户
   * @param email 邮箱
   * @returns 用户信息
   */
  async findByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { email },
      select: ['id', 'username', 'email', 'password', 'role', 'isActive'],
    });

    return user;
  }

  /**
   * 更新用户信息
   * @param id 用户ID
   * @param updateUserDto 更新数据
   * @returns 更新后的用户
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // 检查用户名是否被其他用户使用
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUsername = await this.usersRepository.findOne({
        where: { username: updateUserDto.username },
      });
      
      if (existingUsername) {
        throw new BadRequestException('用户名已存在');
      }
    }

    // 检查邮箱是否被其他用户使用
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingEmail = await this.usersRepository.findOne({
        where: { email: updateUserDto.email },
      });
      
      if (existingEmail) {
        throw new BadRequestException('邮箱已存在');
      }
    }

    // 更新用户信息
    Object.assign(user, updateUserDto);

    // 如果更新了密码，需要重新哈希
    if (updateUserDto.password) {
      user.password = await hashPassword(updateUserDto.password);
    }

    return await this.usersRepository.save(user);
  }

  /**
   * 删除用户
   * @param id 用户ID
   * @returns 删除结果
   */
  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  /**
   * 更新用户最后登录信息
   * @param id 用户ID
   * @param ip 登录IP
   * @returns 更新后的用户
   */
  async updateLastLogin(id: string, ip: string): Promise<User> {
    const user = await this.findOne(id);
    user.lastLoginAt = new Date();
    user.lastLoginIp = ip;
    return await this.usersRepository.save(user);
  }

  /**
   * 激活/禁用用户
   * @param id 用户ID
   * @param isActive 是否激活
   * @returns 更新后的用户
   */
  async toggleActive(id: string, isActive: boolean): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = isActive;
    return await this.usersRepository.save(user);
  }
}
```

#### 用户控制器 (modules/users/users.controller.ts)

```typescript
/**
 * 用户控制器
 * 处理用户相关的HTTP请求
 */

import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * 创建用户（管理员）
   * POST /users
   */
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  /**
   * 查询所有用户（管理员）
   * GET /users
   */
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('role') role: UserRole,
    @Query('isActive') isActive: boolean,
  ) {
    return this.usersService.findAll({ page, limit, role, isActive });
  }

  /**
   * 查询当前用户信息
   * GET /users/me
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Request() req) {
    return this.usersService.findOne(req.user.id);
  }

  /**
   * 根据ID查询用户
   * GET /users/:id
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  /**
   * 更新用户信息
   * PUT /users/:id
   */
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  /**
   * 删除用户（管理员）
   * DELETE /users/:id
   */
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
```

---

### 2. 认证模块

#### JWT策略 (modules/auth/strategies/jwt.strategy.ts)

```typescript
/**
 * JWT认证策略
 */

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      // 从请求头提取JWT
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // JWT密钥
      secretOrKey: configService.get<string>('JWT_SECRET'),
      // 验证令牌时区
      ignoreExpiration: false,
    });
  }

  /**
   * 验证JWT令牌
   * @param payload JWT载荷
   * @returns 用户信息
   */
  async validate(payload: any) {
    const user = await this.usersService.findOne(payload.sub);
    
    if (!user) {
      throw new Error('用户不存在');
    }

    // 返回用户信息（除了密码）
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    };
  }
}
```

#### JWT守卫 (modules/auth/guards/jwt-auth.guard.ts)

```typescript
/**
 * JWT认证守卫
 */

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

#### 角色装饰器 (common/decorators/roles.decorator.ts)

```typescript
/**
 * 角色装饰器
 * 用于指定路由需要的角色权限
 */

import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/entities/user.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

#### 角色守卫 (common/guards/roles.guard.ts)

```typescript
/**
 * 角色守卫
 * 检查用户是否具有指定的角色权限
 */

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * 检查用户角色
   * @param context 执行上下文
   * @returns 是否有权限
   */
  canActivate(context: ExecutionContext): boolean {
    // 获取路由需要的角色
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 如果没有设置角色要求，允许访问
    if (!requiredRoles) {
      return true;
    }

    // 获取当前用户
    const { user } = context.switchToHttp().getRequest();
    
    // 检查用户角色是否匹配
    return requiredRoles.some(role => user.role === role);
  }
}
```

#### 认证服务 (modules/auth/auth.service.ts)

```typescript
/**
 * 认证服务
 * 处理登录、注册、令牌生成等认证逻辑
 */

import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/users.service';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { hashPassword } from '../../../utils/hash.utils';
import { JwtConfig } from '../../../config/jwt.config';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private jwtConfig: JwtConfig,
  ) {}

  /**
   * 用户注册
   * @param createUserDto 用户数据
   * @returns 注册结果
   */
  async register(createUserDto: CreateUserDto) {
    // 创建用户
    const user = await this.usersService.create(createUserDto);

    // 生成访问令牌和刷新令牌
    const tokens = await this.generateTokens(user.id, user.username, user.email, user.role);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      },
      ...tokens,
    };
  }

  /**
   * 用户登录
   * @param loginDto 登录数据
   * @returns 登录结果
   */
  async login(loginDto: LoginDto) {
    // 查找用户
    const user = await this.usersService.findByUsername(loginDto.usernameOrEmail);
    
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 验证密码
    const isPasswordValid = await user.validatePassword(loginDto.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 检查用户是否激活
    if (!user.isActive) {
      throw new UnauthorizedException('用户已被禁用');
    }

    // 生成令牌
    const tokens = await this.generateTokens(user.id, user.username, user.email, user.role);

    // 更新最后登录信息
    await this.usersService.updateLastLogin(user.id, loginDto.ip || '0.0.0.0');

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      },
      ...tokens,
    };
  }

  /**
   * 刷新令牌
   * @param refreshTokenDto 刷新令牌数据
   * @returns 新的令牌
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      // 验证刷新令牌
      const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
        secret: this.jwtConfig.refreshSecret,
      });

      // 查找用户
      const user = await this.usersService.findOne(payload.sub);
      
      if (!user) {
        throw new UnauthorizedException('用户不存在');
      }

      // 生成新的令牌
      const tokens = await this.generateTokens(user.id, user.username, user.email, user.role);

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('刷新令牌无效');
    }
  }

  /**
   * 生成访问令牌和刷新令牌
   * @param userId 用户ID
   * @param username 用户名
   * @param email 邮箱
   * @param role 角色
   * @returns 令牌对象
   */
  private async generateTokens(
    userId: string,
    username: string,
    email: string,
    role: string,
  ) {
    // 生成访问令牌（15分钟过期）
    const accessToken = this.jwtService.sign(
      { sub: userId, username, email, role },
      {
        secret: this.jwtConfig.secret,
        expiresIn: this.jwtConfig.expiresIn,
      },
    );

    // 生成刷新令牌（7天过期）
    const refreshToken = this.jwtService.sign(
      { sub: userId },
      {
        secret: this.jwtConfig.refreshSecret,
        expiresIn: this.jwtConfig.refreshExpiresIn,
      },
    );

    return { accessToken, refreshToken };
  }

  /**
   * 验证访问令牌
   * @param token 访问令牌
   * @returns 令牌载荷
   */
  async validateAccessToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.jwtConfig.secret,
      });
      return payload;
    } catch (error) {
      throw new UnauthorizedException('访问令牌无效');
    }
  }

  /**
   * 验证刷新令牌
   * @param token 刷新令牌
   * @returns 令牌载荷
   */
  async validateRefreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.jwtConfig.refreshSecret,
      });
      return payload;
    } catch (error) {
      throw new UnauthorizedException('刷新令牌无效');
    }
  }
}
```

#### 认证控制器 (modules/auth/auth.controller.ts)

```typescript
/**
 * 认证控制器
 * 处理认证相关的HTTP请求
 */

import { Controller, Post, Body, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * 用户注册
   * POST /auth/register
   */
  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  /**
   * 用户登录
   * POST /auth/login
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Request() req) {
    return this.authService.login({
      ...loginDto,
      ip: req.ip,
    });
  }

  /**
   * 刷新令牌
   * POST /auth/refresh
   */
  @Post('refresh')
  refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  /**
   * 测试认证（需要JWT）
   * GET /auth/test
   */
  @UseGuards(JwtAuthGuard)
  @Post('test')
  test(@Request() req) {
    return {
      message: '认证成功',
      user: req.user,
    };
  }
}
```

#### JWT配置 (config/jwt.config.ts)

```typescript
/**
 * JWT配置
 */

import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'your-secret-key',
  expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
}));
```

---

### 3. 任务管理模块

#### 任务实体 (modules/tasks/entities/task.entity.ts)

```typescript
/**
 * 任务实体
 * 定义任务数据结构
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeUpdate,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

// 任务状态枚举
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// 任务优先级枚举
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * 任务实体类
 */
@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  status: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @Column({ nullable: true })
  dueDate: Date;

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ default: 0 })
  completionPercentage: number;

  @Column({ default: 0 })
  commentsCount: number;

  @Column({ default: 0 })
  attachmentsCount: number;

  @ManyToOne(() => User, user => user.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column({ nullable: true })
  assignedTo: string;

  @Column({ default: 0 })
  progress: number;

  @Column({ default: 0 })
  estimatedHours: number;

  @Column({ default: 0 })
  actualHours: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * 更新前检查任务完成状态
   */
  @BeforeUpdate()
  beforeUpdate() {
    // 如果进度达到100%，标记为完成
    if (this.progress >= 100) {
      this.isCompleted = true;
      this.status = TaskStatus.COMPLETED;
    }
  }

  /**
   * 完成任务
   */
  complete() {
    this.progress = 100;
    this.isCompleted = true;
    this.status = TaskStatus.COMPLETED;
  }

  /**
   * 重新打开任务
   */
  reopen() {
    this.progress = 0;
    this.isCompleted = false;
    this.status = TaskStatus.PENDING;
  }
}
```

#### 任务DTO (modules/tasks/dto/)

```typescript
/**
 * 创建任务DTO
 */
import { IsString, IsOptional, IsEnum, IsDate, IsNumber, Min, Max } from 'class-validator';
import { TaskStatus, TaskPriority } from '../entities/task.entity';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsDate()
  @IsOptional()
  dueDate?: Date;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress?: number;

  @IsString()
  @IsOptional()
  assignedTo?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  estimatedHours?: number;
}

/**
 * 更新任务DTO
 */
import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @IsString()
  @IsOptional()
  id?: string;
}

/**
 * 查询任务DTO
 */
import { IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { TaskStatus, TaskPriority } from '../entities/task.entity';

export class QueryTasksDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  search?: string;

  @IsOptional()
  @IsEnum(['createdAt', 'dueDate', 'priority', 'status'])
  sortBy?: string;

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}
```

#### 任务服务 (modules/tasks/tasks.service.ts)

```typescript
/**
 * 任务服务
 * 处理任务相关的业务逻辑
 */

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus, TaskPriority } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { Pagination } from '../../utils/pagination.utils';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  /**
   * 创建新任务
   * @param createTaskDto 任务数据
   * @param userId 用户ID
   * @returns 创建的任务
   */
  async create(createTaskDto: CreateTaskDto, userId: string): Promise<Task> {
    const task = this.tasksRepository.create({
      ...createTaskDto,
      userId,
      status: createTaskDto.status || TaskStatus.PENDING,
      priority: createTaskDto.priority || TaskPriority.MEDIUM,
    });

    return await this.tasksRepository.save(task);
  }

  /**
   * 查询任务列表
   * @param query 查询参数
   * @param userId 用户ID
   * @returns 任务列表和分页信息
   */
  async findAll(query: QueryTasksDto, userId: string): Promise<Pagination<Task>> {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    // 构建查询条件
    const where: any = { userId };
    
    if (status) where.status = status;
    if (priority) where.priority = priority;
    
    if (search) {
      where.OR = [
        { title: { ilike: `%${search}%` } },
        { description: { ilike: `%${search}%` } },
      ];
    }

    // 计算跳过数量
    const skip = (page - 1) * limit;

    // 执行查询
    const [tasks, total] = await this.tasksRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: {
        [sortBy]: sortOrder,
      },
    });

    return {
      data: tasks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 根据ID查询任务
   * @param id 任务ID
   * @param userId 用户ID
   * @returns 任务信息
   */
  async findOne(id: string, userId: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id, userId },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    return task;
  }

  /**
   * 更新任务信息
   * @param id 任务ID
   * @param updateTaskDto 更新数据
   * @param userId 用户ID
   * @returns 更新后的任务
   */
  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    userId: string,
  ): Promise<Task> {
    const task = await this.findOne(id, userId);

    // 如果更新了进度，检查是否完成
    if (updateTaskDto.progress !== undefined) {
      if (updateTaskDto.progress < 0 || updateTaskDto.progress > 100) {
        throw new BadRequestException('进度必须在0-100之间');
      }
      
      if (updateTaskDto.progress >= 100) {
        task.complete();
      } else {
        task.reopen();
      }
    }

    // 更新任务信息
    Object.assign(task, updateTaskDto);

    return await this.tasksRepository.save(task);
  }

  /**
   * 删除任务
   * @param id 任务ID
   * @param userId 用户ID
   * @returns 删除结果
   */
  async remove(id: string, userId: string): Promise<void> {
    const task = await this.findOne(id, userId);
    await this.tasksRepository.remove(task);
  }

  /**
   * 批量更新任务状态
   * @param ids 任务ID列表
   * @param status 新状态
   * @param userId 用户ID
   * @returns 更新结果
   */
  async updateStatus(
    ids: string[],
    status: TaskStatus,
    userId: string,
  ): Promise<number> {
    const result = await this.tasksRepository.update(
      { id: ids, userId },
      { status },
    );
    return result.affected;
  }

  /**
   * 获取用户任务统计
   * @param userId 用户ID
   * @returns 任务统计信息
   */
  async getStats(userId: string) {
    const stats = await this.tasksRepository
      .createQueryBuilder('task')
      .select('task.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('task.userId = :userId', { userId })
      .groupBy('task.status')
      .getRawMany();

    // 计算总数
    const total = await this.tasksRepository.count({ where: { userId } });

    // 计算完成数
    const completed = await this.tasksRepository.count({
      where: { userId, status: TaskStatus.COMPLETED },
    });

    // 计算进行中数
    const inProgress = await this.tasksRepository.count({
      where: { userId, status: TaskStatus.IN_PROGRESS },
    });

    // 计算待处理数
    const pending = await this.tasksRepository.count({
      where: { userId, status: TaskStatus.PENDING },
    });

    return {
      total,
      completed,
      inProgress,
      pending,
      byStatus: stats.reduce((acc, curr) => {
        acc[curr.status] = parseInt(curr.count, 10);
        return acc;
      }, {}),
    };
  }

  /**
   * 获取用户任务日历
   * @param userId 用户ID
   * @param year 年份
   * @param month 月份
   * @returns 任务日历
   */
  async getCalendar(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const tasks = await this.tasksRepository.find({
      where: {
        userId,
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // 按日期分组
    const calendar: any = {};
    
    tasks.forEach(task => {
      const date = task.dueDate.toISOString().split('T')[0];
      if (!calendar[date]) {
        calendar[date] = [];
      }
      calendar[date].push(task);
    });

    return calendar;
  }
}
```

#### 任务控制器 (modules/tasks/tasks.controller.ts)

```typescript
/**
 * 任务控制器
 * 处理任务相关的HTTP请求
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  /**
   * 创建任务
   * POST /tasks
   */
  @Post()
  create(@Body() createTaskDto: CreateTaskDto, @Request() req) {
    return this.tasksService.create(createTaskDto, req.user.id);
  }

  /**
   * 查询任务列表
   * GET /tasks
   */
  @Get()
  findAll(@Query() query: QueryTasksDto, @Request() req) {
    return this.tasksService.findAll(query, req.user.id);
  }

  /**
   * 查询任务统计
   * GET /tasks/stats
   */
  @Get('stats')
  getStats(@Request() req) {
    return this.tasksService.getStats(req.user.id);
  }

  /**
   * 查询任务日历
   * GET /tasks/calendar?year=2024&month=1
   */
  @Get('calendar')
  getCalendar(
    @Query('year') year: number,
    @Query('month') month: number,
    @Request() req,
  ) {
    return this.tasksService.getCalendar(req.user.id, year, month);
  }

  /**
   * 根据ID查询任务
   * GET /tasks/:id
   */
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.tasksService.findOne(id, req.user.id);
  }

  /**
   * 更新任务
   * PUT /tasks/:id
   */
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req,
  ) {
    return this.tasksService.update(id, updateTaskDto, req.user.id);
  }

  /**
   * 删除任务
   * DELETE /tasks/:id
   */
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.tasksService.remove(id, req.user.id);
  }

  /**
   * 批量更新任务状态
   * PATCH /tasks/status
   */
  @Patch('status')
  updateStatus(
    @Body('ids') ids: string[],
    @Body('status') status: string,
    @Request() req,
  ) {
    return this.tasksService.updateStatus(ids, status, req.user.id);
  }
}
```

---

### 4. 通知模块

#### 通知实体 (modules/notifications/entities/notification.entity.ts)

```typescript
/**
 * 通知实体
 * 定义通知数据结构
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

// 通知类型枚举
export enum NotificationType {
  TASK_CREATED = 'task_created',
  TASK_ASSIGNED = 'task_assigned',
  TASK_COMPLETED = 'task_completed',
  TASK_DUE_SOON = 'task_due_soon',
  TASK_OVERDUE = 'task_overdue',
  COMMENT_ADDED = 'comment_added',
  SYSTEM = 'system',
}

// 通知状态枚举
export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  ARCHIVED = 'archived',
}

/**
 * 通知实体类
 */
@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  title: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.UNREAD,
  })
  status: NotificationStatus;

  @Column({ nullable: true })
  relatedId: string; // 相关任务ID

  @Column({ nullable: true })
  relatedType: string; // 相关类型

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  readAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column({ nullable: true })
  senderId: string;

  @CreateDateColumn()
  createdAt: Date;

  /**
   * 标记为已读
   */
  markAsRead() {
    this.status = NotificationStatus.READ;
    this.isRead = true;
    this.readAt = new Date();
  }

  /**
   * 标记为已归档
   */
  markAsArchived() {
    this.status = NotificationStatus.ARCHIVED;
  }
}
```

#### 通知服务 (modules/notifications/notifications.service.ts)

```typescript
/**
 * 通知服务
 * 处理通知相关的业务逻辑
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType, NotificationStatus } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Pagination } from '../../utils/pagination.utils';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
  ) {}

  /**
   * 创建通知
   * @param createNotificationDto 通知数据
   * @returns 创建的通知
   */
  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationsRepository.create(createNotificationDto);
    return await this.notificationsRepository.save(notification);
  }

  /**
   * 查询用户通知列表
   * @param userId 用户ID
   * @param status 通知状态
   * @param page 页码
   * @param limit 每页数量
   * @returns 通知列表和分页信息
   */
  async findAll(
    userId: string,
    status?: NotificationStatus,
    page: number = 1,
    limit: number = 20,
  ): Promise<Pagination<Notification>> {
    const where: any = { userId };
    
    if (status) where.status = status;

    const skip = (page - 1) * limit;

    const [notifications, total] = await this.notificationsRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 查询未读通知数量
   * @param userId 用户ID
   * @returns 未读通知数量
   */
  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationsRepository.count({
      where: { userId, status: NotificationStatus.UNREAD },
    });
  }

  /**
   * 标记通知为已读
   * @param id 通知ID
   * @param userId 用户ID
   * @returns 更新后的通知
   */
  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.findOne(id, userId);
    notification.markAsRead();
    return await this.notificationsRepository.save(notification);
  }

  /**
   * 标记所有通知为已读
   * @param userId 用户ID
   * @returns 更新的通知数量
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.notificationsRepository.update(
      { userId, status: NotificationStatus.UNREAD },
      { status: NotificationStatus.READ, isRead: true, readAt: new Date() },
    );
    return result.affected;
  }

  /**
   * 删除通知
   * @param id 通知ID
   * @param userId 用户ID
   * @returns 删除结果
   */
  async remove(id: string, userId: string): Promise<void> {
    const notification = await this.findOne(id, userId);
    await this.notificationsRepository.remove(notification);
  }

  /**
   * 批量删除通知
   * @param ids 通知ID列表
   * @param userId 用户ID
   * @returns 删除的通知数量
   */
  async removeBatch(ids: string[], userId: string): Promise<number> {
    const result = await this.notificationsRepository.delete({
      id: ids,
      userId,
    });
    return result.affected;
  }

  /**
   * 根据ID查询通知
   * @param id 通知ID
   * @param userId 用户ID
   * @returns 通知信息
   */
  async findOne(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new BadRequestException('通知不存在');
    }

    return notification;
  }

  /**
   * 发送系统通知
   * @param userId 接收用户ID
   * @param type 通知类型
   * @param title 标题
   * @param message 消息内容
   * @param relatedId 相关ID
   * @returns 创建的通知
   */
  async sendSystemNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    relatedId?: string,
  ): Promise<Notification> {
    return await this.create({
      userId,
      title,
      message,
      type,
      relatedId,
      status: NotificationStatus.UNREAD,
      isRead: false,
    });
  }
}
```

#### 通知控制器 (modules/notifications/notifications.controller.ts)

```typescript
/**
 * 通知控制器
 * 处理通知相关的HTTP请求
 */

import {
  Controller,
  Get,
  Patch,
  Delete,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationStatus } from './entities/notification.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * 查询通知列表
   * GET /notifications
   */
  @Get()
  findAll(
    @Query('status') status: NotificationStatus,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Request() req,
  ) {
    return this.notificationsService.findAll(
      req.user.id,
      status,
      page,
      limit,
    );
  }

  /**
   * 查询未读通知数量
   * GET /notifications/unread-count
   */
  @Get('unread-count')
  getUnreadCount(@Request() req) {
    return {
      unreadCount: await this.notificationsService.getUnreadCount(req.user.id),
    };
  }

  /**
   * 标记通知为已读
   * PATCH /notifications/:id/read
   */
  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Request() req) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  /**
   * 标记所有通知为已读
   * PATCH /notifications/read-all
   */
  @Patch('read-all')
  markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  /**
   * 删除通知
   * DELETE /notifications/:id
   */
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.notificationsService.remove(id, req.user.id);
  }

  /**
   * 批量删除通知
   * DELETE /notifications
   */
  @Delete()
  removeBatch(@Body('ids') ids: string[], @Request() req) {
    return this.notificationsService.removeBatch(ids, req.user.id);
  }
}
```

---

### 5. WebSocket实时通信模块

#### WebSocket网关 (modules/socket/socket.gateway.ts)

```typescript
/**
 * WebSocket网关
 * 处理实时通信
 */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../notifications/entities/notification.entity';
import { NotificationType, NotificationStatus } from '../notifications/entities/notification.entity';
import { UsersService } from '../../users/users.service';

// 定义Socket事件类型
interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: '*', // 生产环境应指定具体域名
    credentials: true,
  },
  namespace: '/notifications',
  path: '/socket.io',
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    private usersService: UsersService,
  ) {}

  /**
   * 客户端连接
   * @param client 客户端
   */
  async handleConnection(client: AuthenticatedSocket) {
    console.log(`客户端连接: ${client.id}`);

    // 验证JWT令牌
    const token = client.handshake.auth.token;
    
    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findOne(payload.sub);
      
      if (!user.isActive) {
        client.disconnect(true);
        return;
      }

      // 将用户信息附加到socket
      client.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      };

      // 加入用户房间
      client.join(`user:${user.id}`);

      // 发送连接成功事件
      client.emit('connected', {
        message: '连接成功',
        userId: user.id,
      });

      // 发送未读通知数量
      const unreadCount = await this.notificationsRepository.count({
        where: { userId: user.id, status: NotificationStatus.UNREAD },
      });
      
      client.emit('notification:unread-count', { unreadCount });
    } catch (error) {
      console.error('认证失败:', error);
      client.disconnect(true);
    }
  }

  /**
   * 客户端断开连接
   * @param client 客户端
   */
  handleDisconnect(client: AuthenticatedSocket) {
    console.log(`客户端断开连接: ${client.id}`);
  }

  /**
   * 订阅消息
   * @param client 客户端
   * @param data 消息数据
   */
  @SubscribeMessage('message')
  handleMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: any,
  ): void {
    // 处理消息逻辑
    client.emit('message', { 
      message: `收到消息: ${data.message}`,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 订阅加入房间
   * @param client 客户端
   * @param data 房间数据
   */
  @SubscribeMessage('join-room')
  handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ): void {
    client.join(data.roomId);
    client.emit('room-joined', { roomId: data.roomId });
  }

  /**
   * 订阅离开房间
   * @param client 客户端
   * @param data 房间数据
   */
  @SubscribeMessage('leave-room')
  handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ): void {
    client.leave(data.roomId);
    client.emit('room-left', { roomId: data.roomId });
  }

  /**
   * 发送系统通知
   * @param userId 用户ID
   * @param notification 通知数据
   */
  async sendNotification(userId: string, notification: any) {
    // 发送实时通知
    this.server.to(`user:${userId}`).emit('notification:new', notification);

    // 更新未读通知数量
    const unreadCount = await this.notificationsRepository.count({
      where: { userId, status: NotificationStatus.UNREAD },
    });
    
    this.server.to(`user:${userId}`).emit('notification:unread-count', { unreadCount });
  }

  /**
   * 广播任务更新
   * @param taskId 任务ID
   * @param taskData 任务数据
   */
  broadcastTaskUpdate(taskId: string, taskData: any) {
    // 广播到任务房间
    this.server.to(`task:${taskId}`).emit('task:updated', taskData);
  }

  /**
   * 发送任务分配通知
   * @param userId 用户ID
   * @param taskId 任务ID
   * @param taskTitle 任务标题
   */
  async sendTaskAssignedNotification(userId: string, taskId: string, taskTitle: string) {
    const notification = await this.notificationsRepository.create({
      userId,
      title: '新任务分配',
      message: `你被分配了一个新任务: ${taskTitle}`,
      type: NotificationType.TASK_ASSIGNED,
      relatedId: taskId,
      status: NotificationStatus.UNREAD,
      isRead: false,
    });

    await this.notificationsRepository.save(notification);

    this.sendNotification(userId, {
      type: 'task_assigned',
      title: '新任务分配',
      message: `你被分配了一个新任务: ${taskTitle}`,
      taskId,
    });
  }
}
```

#### WebSocket模块 (modules/socket/socket.module.ts)

```typescript
/**
 * WebSocket模块
 */

import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from '../notifications/entities/notification.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    UsersModule,
  ],
  providers: [
    SocketGateway,
    JwtService,
  ],
  exports: [SocketGateway],
})
export class SocketModule {}
```

---

### 6. 公共模块

#### 异常过滤器 (common/filters/http-exception.filter.ts)

```typescript
/**
 * 全局异常过滤器
 * 统一处理HTTP异常
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // 获取异常状态码和消息
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : {
            message: '服务器内部错误',
          };

    // 构建响应体
    const responseBody = {
      success: false,
      error: {
        statusCode,
        message: typeof message === 'string' ? message : message.message,
        timestamp: new Date().toISOString(),
        path: ctx.getRequest<Request>().url,
      },
    };

    // 发送响应
    response.status(statusCode).json(responseBody);
  }
}
```

#### 响应拦截器 (common/interceptors/response.interceptor.ts)

```typescript
/**
 * 响应拦截器
 * 统一响应格式
 */

import {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map(data => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
```

#### 日志拦截器 (common/interceptors/logging.interceptor.ts)

```typescript
/**
 * 日志拦截器
 * 记录请求日志
 */

import {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export class LoggingInterceptor implements NestInterceptor {
  private logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const userAgent = request.get('user-agent') || '';

    return next.handle().pipe(
      tap(() => {
        const contentLength = context.switchToHttp().getResponse().getHeader(
          'content-length',
        );
        this.logger.log(
          `${method} ${url} ${contentLength || 0}b ${Date.now() - now}ms ${userAgent}`,
        );
      }),
    );
  }
}
```

#### 分页工具 (utils/pagination.utils.ts)

```typescript
/**
 * 分页工具
 */

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Pagination<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * 创建分页信息
 * @param total 总数
 * @param page 当前页
 * @param limit 每页数量
 * @returns 分页信息
 */
export function createPaginationMeta(
  total: number,
  page: number = 1,
  limit: number = 10,
): PaginationMeta {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * 分页数据转换
 * @param data 数据数组
 * @param total 总数
 * @param page 当前页
 * @param limit 每页数量
 * @returns 分页数据
 */
export function paginate<T>(
  data: T[],
  total: number,
  page: number = 1,
  limit: number = 10,
): Pagination<T> {
  return {
    data,
    meta: createPaginationMeta(total, page, limit),
  };
}
```

#### 密码哈希工具 (utils/hash.utils.ts)

```typescript
/**
 * 密码哈希工具
 */

import * as bcrypt from 'bcryptjs';

/**
 * 哈希密码
 * @param password 明文密码
 * @returns 哈希值
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

/**
 * 验证密码
 * @param password 明文密码
 * @param hash 哈希值
 * @returns 是否匹配
 */
export async function validatePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
```

---

### 7. 应用入口

#### 主应用文件 (main.ts)

```typescript
/**
 * NestJS应用入口
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 配置服务
  const configService = app.get(ConfigService);

  // 全局前缀
  app.setGlobalPrefix('api');

  // 全局管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 移除未定义的属性
      transform: true, // 自动转换类型
      forbidNonWhitelisted: true, // 禁止非白名单属性
      validationError: {
        target: false, // 不显示target
        value: false, // 不显示value
      },
    }),
  );

  // 全局过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // 全局拦截器
  app.useGlobalInterceptors(
    new ResponseInterceptor(),
    new LoggingInterceptor(),
  );

  // CORS配置
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN') || '*',
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
  });

  // Swagger配置
  const swaggerConfig = new DocumentBuilder()
    .setTitle('任务管理系统API')
    .setDescription('任务管理系统的RESTful API文档')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: '输入JWT令牌',
        in: 'header',
      },
      'JWT',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document);

  // 启动应用
  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);

  console.log(`应用启动在端口 ${port}`);
  console.log(`API文档地址: http://localhost:${port}/api-docs`);
}

bootstrap();
```

#### 应用模块 (app.module.ts)

```typescript
/**
 * 应用主模块
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// 配置模块
import configuration from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';

// 业务模块
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SocketModule } from './modules/socket/socket.module';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration, databaseConfig, jwtConfig],
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),

    // TypeORM模块
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USER'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get<boolean>('DATABASE_SYNC'),
        logging: configService.get<boolean>('DATABASE_LOGGING'),
        logger: 'advanced-console',
      }),
    }),

    // 业务模块
    UsersModule,
    AuthModule,
    TasksModule,
    NotificationsModule,
    SocketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

---

### 8. 配置文件

#### 应用配置 (config/app.config.ts)

```typescript
/**
 * 应用配置
 */

import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  name: process.env.APP_NAME || '任务管理系统',
  version: process.env.APP_VERSION || '1.0.0',
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  apiPrefix: process.env.API_PREFIX || 'api',
}));
```

#### 数据库配置 (config/database.config.ts)

```typescript
/**
 * 数据库配置
 */

import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  name: process.env.DATABASE_NAME || 'task_manager',
  synchronize: process.env.DATABASE_SYNC === 'true',
  logging: process.env.DATABASE_LOGGING === 'true',
}));
```

---

### 9. 环境变量

#### 环境变量 (.env)

```env
# 应用配置
NODE_ENV=development
APP_NAME=任务管理系统
APP_VERSION=1.0.0
PORT=3000
CORS_ORIGIN=*

# 数据库配置
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=task_manager
DATABASE_SYNC=true
DATABASE_LOGGING=true

# JWT配置
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret_key_here
JWT_REFRESH_EXPIRES_IN=7d

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# 邮箱配置
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=noreply@example.com
EMAIL_PASSWORD=your_email_password

# Socket.IO配置
SOCKET_IO_CORS_ORIGIN=*
```

---

## 最佳实践

### 1. 模块设计最佳实践

```typescript
// ✅ 正确：模块职责单一
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}

// ❌ 错误：模块职责混乱
@Module({
  imports: [TypeOrmModule.forFeature([User, Task, Notification])],
  providers: [UsersService, TasksService, NotificationsService],
  controllers: [UsersController, TasksController, NotificationsController],
})
export class BigModule {}
```

### 2. DTO验证最佳实践

```typescript
// ✅ 正确：使用class-validator进行验证
export class CreateUserDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

// ❌ 错误：手动验证
export class CreateUserDto {
  username: string;
  email: string;
  password: string;
}
```

### 3. 异常处理最佳实践

```typescript
// ✅ 正确：使用NestJS内置异常
throw new BadRequestException('用户名已存在');
throw new UnauthorizedException('用户名或密码错误');
throw new NotFoundException('用户不存在');

// ❌ 错误：直接抛出Error
throw new Error('用户名已存在');
```

### 4. 数据库查询最佳实践

```typescript
// ✅ 正确：使用TypeORM查询构建器
const [tasks, total] = await this.tasksRepository.findAndCount({
  where: { userId },
  skip: (page - 1) * limit,
  take: limit,
  order: { createdAt: 'DESC' },
});

// ❌ 错误：查询所有数据后在内存中分页
const allTasks = await this.tasksRepository.find({ where: { userId } });
const tasks = allTasks.slice((page - 1) * limit, page * limit);
const total = allTasks.length;
```

### 5. JWT令牌最佳实践

```typescript
// ✅ 正确：使用访问令牌和刷新令牌
const accessToken = this.jwtService.sign(payload, {
  secret: this.jwtConfig.secret,
  expiresIn: '15m',
});

const refreshToken = this.jwtService.sign({ sub: userId }, {
  secret: this.jwtConfig.refreshSecret,
  expiresIn: '7d',
});

// ❌ 错误：只使用一个长期有效的令牌
const token = this.jwtService.sign(payload, {
  secret: this.jwtConfig.secret,
  expiresIn: '30d',
});
```

---

## 部署指南

### 1. 生产环境配置

```env
# .env.production
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://your-domain.com

# 数据库配置
DATABASE_HOST=prod-db.example.com
DATABASE_USER=prod_user
DATABASE_PASSWORD=strong_password
DATABASE_NAME=task_manager
DATABASE_SYNC=false
DATABASE_LOGGING=false

# JWT配置
JWT_SECRET=strong_jwt_secret_key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=strong_refresh_secret_key
JWT_REFRESH_EXPIRES_IN=7d

# Redis配置
REDIS_HOST=prod-redis.example.com
REDIS_PASSWORD=strong_redis_password
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

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

### 3. Kubernetes部署

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: task-manager
spec:
  replicas: 3
  selector:
    matchLabels:
      app: task-manager
  template:
    metadata:
      labels:
        app: task-manager
    spec:
      containers:
      - name: task-manager
        image: your-registry/task-manager:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_HOST
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: host
        - name: DATABASE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: password
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: task-manager
spec:
  selector:
    app: task-manager
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

---

## 总结

本项目实现了完整任务管理系统核心功能：

✅ **用户管理**：CRUD、角色权限、激活/禁用  
✅ **认证授权**：JWT、刷新令牌、角色守卫  
✅ **任务管理**：CRUD、状态、优先级、进度  
✅ **通知系统**：实时通知、未读计数、归档  
✅ **WebSocket**：实时通信、房间管理  
✅ **API文档**：Swagger自动生成  
✅ **错误处理**：统一异常过滤器  
✅ **日志记录**：请求日志拦截器  

项目采用NestJS最佳实践，代码结构清晰，易于维护和扩展。
