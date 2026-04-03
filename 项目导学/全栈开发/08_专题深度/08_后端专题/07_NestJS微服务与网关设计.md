# NestJS微服务与网关设计

> 如果把传统后端比作一家公司的前台，所有业务都经过她，那么NestJS微服务模式就像把前台的工作分配给多个专业接待员——有人专门接待VIP、有人专门处理咨询、有人专门引导参观。消息队列（MQ）就像是对讲机，让这些接待员能够异步沟通；而网关则是智能分配系统，根据客户需求精准匹配最合适的服务。本文档将深入探讨NestJS的微服务模式、消息通信、网关设计以及安全认证。

## 一、NestJS微服务架构概述

### 1.1 为什么选择NestJS构建微服务

NestJS是基于TypeScript的Node.js框架，它借鉴了Angular的依赖注入和模块化思想，同时支持微服务架构。

**NestJS微服务优势：**

```
┌─────────────────────────────────────────────────────────────────┐
│                   NestJS 微服务核心优势                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TypeScript原生支持                                             │
│  ├── 完整的类型系统                                              │
│  ├── 接口定义与业务逻辑分离                                       │
│  └── IDE强力支持，代码提示丰富                                    │
│                                                                 │
│  装饰器驱动开发                                                  │
│  ├── @Controller / @Injectable / @Module                        │
│  ├── 声明式定义路由、服务、依赖                                   │
│  └── 代码即文档，易读易维护                                       │
│                                                                 │
│  多种传输层支持                                                  │
│  ├── TCP - 高性能二进制通信                                      │
│  ├── Redis - 消息队列模式                                        │
│  ├── Kafka / RabbitMQ - 企业级MQ                                │
│  └── gRPC - 高效跨语言调用                                       │
│                                                                 │
│  成熟的生态系统                                                   │
│  ├── @nestjs/microservices - 微服务基础                         │
│  ├── @nestjs/platform-socket.io - WebSocket                    │
│  └── @nestjs/swagger - API文档                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 微服务模式对比

| 模式 | 通信方式 | 适用场景 | 延迟 | 可靠性 |
|------|----------|----------|------|--------|
| **同步REST** | HTTP/TCP | 实时响应、低并发 | 低 | 一般 |
| **异步MQ** | 消息队列 | 解耦、削峰、高并发 | 中 | 高 |
| **事件驱动** | Event Bus | 跨服务状态同步 | 中 | 高 |
| **gRPC** | Protobuf | 多语言、内部调用 | 低 | 高 |

### 1.3 NestJS微服务架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                    NestJS 微服务架构图                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                         ┌───────────────┐                      │
│                         │   API Gateway  │                      │
│                         │   (网关层)     │                      │
│                         └───────┬───────┘                      │
│                                 │                               │
│          ┌──────────────────────┼──────────────────────┐        │
│          │                      │                      │        │
│          ▼                      ▼                      ▼        │
│   ┌─────────────┐        ┌─────────────┐        ┌─────────────┐  │
│   │   用户服务   │        │   订单服务   │        │   商品服务   │  │
│   │  (Users)   │        │  (Orders)   │        │  (Products) │  │
│   └──────┬──────┘        └──────┬──────┘        └──────┬──────┘  │
│          │                      │                      │        │
│          └──────────────────────┼──────────────────────┘        │
│                                 │                                │
│                                 ▼                                │
│                    ┌───────────────────────┐                    │
│                    │       Redis / Kafka   │                    │
│                    │      (消息中间件)       │                    │
│                    └───────────────────────┘                    │
│                                 │                                │
│          ┌──────────────────────┼──────────────────────┐        │
│          │                      │                      │        │
│          ▼                      ▼                      ▼        │
│   ┌─────────────┐        ┌─────────────┐        ┌─────────────┐  │
│   │   通知服务   │        │   支付服务   │        │   日志服务   │  │
│   │  (Notify)   │        │  (Payment)  │        │   (Logger)  │  │
│   └─────────────┘        └─────────────┘        └─────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 二、NestJS微服务模式实现

### 2.1 基础微服务创建

**服务端创建：**

```typescript
// 用户服务主入口
// 演示如何创建一个基于TCP的NestJS微服务

import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { UsersModule } from './users.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('UsersService');

  // 创建独立微服务（不启动HTTP服务器）
  // 微服务通常不需要HTTP入口，专注于处理消息
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    UsersModule,
    {
      // 使用TCP传输层
      // TCP是最常用的微服务通信方式，性能好、延迟低
      transport: Transport.TCP,
      // TCP配置选项
      options: {
        // 服务主机地址
        host: '0.0.0.0',
        // 服务端口
        port: 3001,
        // 启用protobuf编码（需要安装 @nestjs/microservices protobuf相关包）
        // 使用Protocol Buffers可以显著提升序列化性能
        // serializers: [
        //   {
        //     serialize: (input) => protobuf.encode(input),
        //   },
        // ],
        // 反序列化器
        // deserializer: (input) => protobuf.decode(input),
      },
    },
  );

  // 启动微服务
  await app.listen();
  logger.log('用户服务已启动，监听端口: 3001');
}

bootstrap();
```

**客户端连接：**

```typescript
// 订单服务 - 调用用户服务
// 演示如何通过TCP连接调用其他微服务

import { Module } from '@nestjs/common';
import { ClientsModule, Transport, ClientsModuleOptions } from '@nestjs/microservices';
import { join } from 'path';
import { OrderController } from './order.controller';

@Module({
  imports: [
    // 注册微服务客户端
    // 这样OrderController可以注入UserServiceClient来调用用户服务
    ClientsModule.register([
      {
        // 客户端名称，用于注入标识
        name: 'USERS_SERVICE',
        // 传输层类型
        transport: Transport.TCP,
        // 连接选项
        options: {
          // 用户服务地址
          host: 'localhost',
          port: 3001,
          // 连接池配置
          // 维护多个连接，提高并发能力
          connectionCount: 5,
          // 连接超时时间（毫秒）
          connectTimeout: 10000,
          // 重连配置
          retries: 5,
          retryDelay: 3000,
          retryStrategy: (retryAttempt: number) => {
            // 重试策略：指数退避
            // 避免频繁重连造成服务雪崩
            return Math.min(retryAttempt * 1000, 5000);
          },
        },
      } as ClientsModuleOptions,
    ]),
  ],
  controllers: [OrderController],
})
export class OrderModule {}
```

### 2.2 消息模式详解

**请求-响应模式：**

```typescript
// 消息模式一：请求-响应（Request-Response）
// 就像打电话，对方必须即时回复

// 用户服务 - 定义消息处理器
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Ctx, RpcException } from '@nestjs/microservices';
import { UsersService } from './users.service';

// @MessagePattern装饰器定义消息处理器
// 第一个参数是pattern（模式），用于匹配客户端发送的消息
@Controller()
export class UsersController {
  private readonly logger = new Logger('UsersController');

  constructor(private readonly usersService: UsersService) {}

  // 处理获取用户信息的消息
  // 客户端发送 { pattern: 'users.findOne', data: { id: 1 } }
  // 这里会收到 pattern='users.findOne', data={ id: 1 }
  @MessagePattern('users.findOne')
  async findOne(
    @Payload() data: { id: number },  // 消息载荷，即客户端发送的数据
    @Ctx() context: any,  // 消息上下文，包含发送者信息
  ) {
    this.logger.debug(`收到获取用户请求, id=${data.id}`);

    try {
      // 业务逻辑
      const user = await this.usersService.findById(data.id);

      // 如果用户不存在，抛出RPC异常
      // 异常会被发送到客户端
      if (!user) {
        throw new RpcException({
          code: 404,
          message: '用户不存在',
        });
      }

      // 返回结果会自动序列化并发送回客户端
      return user;
    } catch (error) {
      // 重新抛出异常，让NestJS统一处理
      throw new RpcException(error);
    }
  }

  // 处理创建用户的消息（异步模式）
  // return语句会发送响应，但客户端不会等待
  @MessagePattern('users.create')
  async create(@Payload() data: CreateUserDto) {
    const user = await this.usersService.create(data);
    // 返回创建的用户信息
    return user;
  }

  // 批量查询用户
  @MessagePattern('users.findMany')
  async findMany(@Payload() data: { ids: number[] }) {
    const users = await this.usersService.findByIds(data.ids);
    return users;
  }
}

// 订单服务 - 调用用户服务
import { Controller, Inject, Post, Body } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';

@Controller('orders')
export class OrderController {
  constructor(
    // 注入名为USERS_SERVICE的客户端
    // 客户端在OrderModule中通过ClientsModule注册
    @Inject('USERS_SERVICE') private readonly usersClient: ClientProxy,
  ) {}

  // 同步调用方式：发送消息并等待响应
  async getUser(userId: number) {
    // send方法发送消息并返回Observable
    // 第一个参数是pattern
    // 第二个参数是发送给服务端的数据
    // complete()之前会等待响应
    const user = this.usersClient.send(
      { pattern: 'users.findOne' },  // 消息模式
      { id: userId },  // 消息数据
    );

    return new Promise((resolve, reject) => {
      user.subscribe({
        next: (result) => resolve(result),  // 收到响应时resolve
        error: (error) => reject(error),    // 发生错误时reject
        complete: () => {},                  // 完成时回调
      });
    });
  }

  // 更简洁的调用方式：使用async/await
  async getUserSimple(userId: number) {
    try {
      // send方法返回Observable，直接用firstValueFrom转换
      const { firstValueFrom } = await import('rxjs');
      const user = await firstValueFrom(
        this.usersClient.send({ pattern: 'users.findOne' }, { id: userId }),
      );
      return user;
    } catch (error) {
      throw error;
    }
  }

  // 异步事件模式：发送后不等待响应
  // 适用于日志、通知等不需要返回值的场景
  async notifyUserCreated(userId: number, orderId: string) {
    // emit方法发送事件，不等待响应
    // 适用于"发完就忘"的场景，提高系统吞吐量
    this.usersClient.emit('user.orderCreated', {
      userId,
      orderId,
      timestamp: Date.now(),
    });
  }

  // 批量获取用户（带超时控制）
  async getUsersWithTimeout(userIds: number[], timeoutMs = 5000) {
    const { timeout, catchError } = await import('rxjs');
    const { firstValueFrom } = await import('rxjs');

    try {
      const result = await firstValueFrom(
        this.usersClient.send({ pattern: 'users.findMany' }, { ids: userIds }).pipe(
          timeout(timeoutMs),  // 设置超时
          catchError((err) => {
            if (err.name === 'TimeoutError') {
              throw new Error('获取用户信息超时');
            }
            throw err;
          }),
        ),
      );
      return result;
    } catch (error) {
      throw error;
    }
  }
}
```

### 2.3 Redis消息队列模式

**Redis pub/sub实现：**

```typescript
// 使用Redis作为消息队列
// 适合需要消息持久化、延迟队列等高级特性的场景

import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NotificationController } from './notification.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NOTIFICATION_SERVICE',
        // 使用Redis作为传输层
        transport: Transport.REDIS,
        options: {
          // Redis连接配置
          host: 'localhost',
          port: 6379,
          password: 'your_password',
          db: 0,
          // 队列名称前缀
          // Redis会创建 redis://host:port/{prefix} 的键
          // 生产者用该键发送消息，消费者订阅该键接收
          queue: 'notification-queue',
          // 消费者数量
          // 如果有多个消费者实例，消息会负载均衡分发
          // 每个消息只会被一个消费者处理
          // 注意：只有在使用Channel关注点分离模式时才生效
          // 这种模式主要用于消息持久化和负载均衡，不支持请求-响应模式
          consumers: 1,
          // 重连配置
          reconnectTime: 3000,
        },
      },
    ]),
  ],
  controllers: [NotificationController],
})
export class NotificationModule {}

// 通知服务 - 消息处理器
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, EventPattern, Payload, Ctx, RpcException } from '@nestjs/microservices';
import { NotificationService } from './notification.service';

@Controller()
export class NotificationController {
  private readonly logger = new Logger('NotificationController');

  constructor(private readonly notificationService: NotificationService) {}

  // 处理发送邮件通知
  // Redis模式下，使用EventPattern处理事件
  @EventPattern('notification.email')
  async handleEmailNotification(@Payload() data: EmailNotificationDto) {
    this.logger.log(`收到邮件通知请求: ${data.to}`);

    try {
      // 发送邮件
      await this.notificationService.sendEmail(data);
      this.logger.log(`邮件发送成功: ${data.to}`);
    } catch (error) {
      this.logger.error(`邮件发送失败: ${error.message}`);
      // 对于异步消息，通常记录日志并告警，不抛异常
      // 因为消息已经被消费，无法重试
    }
  }

  // 处理发送短信通知
  @EventPattern('notification.sms')
  async handleSmsNotification(@Payload() data: SmsNotificationDto) {
    this.logger.log(`收到短信通知请求: ${data.phone}`);
    await this.notificationService.sendSms(data);
  }

  // 处理发送WebSocket推送
  @EventPattern('notification.websocket')
  async handleWebSocketNotification(@Payload() data: WebSocketNotificationDto) {
    const { userId, message } = data;
    await this.notificationService.sendToUser(userId, message);
  }
}

// 通知服务 - 批量处理
import { Controller, MessagePattern } from '@nestjs/common';

@Controller()
export class BatchNotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // 批量发送通知
  // 使用Redis的LIST数据结构，支持消息持久化
  @MessagePattern('notification.batch')
  async handleBatchNotification(@Payload() data: BatchNotificationDto) {
    const { notifications, delayMs = 100 } = data;
    const results = [];

    // 逐个发送，控制发送频率
    // 避免对短信网关、邮件服务造成压力
    for (const notification of notifications) {
      try {
        await this.notificationService.send(notification);
        results.push({ id: notification.id, status: 'success' });
      } catch (error) {
        results.push({ id: notification.id, status: 'failed', error: error.message });
      }

      // 控制发送频率
      if (delayMs > 0) {
        await this.sleep(delayMs);
      }
    }

    return { total: notifications.length, results };
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

### 2.4 Kafka消息队列集成

```typescript
// Kafka消息队列集成
// Kafka适合高吞吐量、持久化、事件溯源等场景

import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { OrderEventController } from './order-event.controller';

// Kafka客户端配置
// Kafka配置文件在nest-cli.json的assets中声明
// 使得Kafka客户端能够读取schema注册表
const microservicesConfig = require('./kafka.client.config.json');

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'ORDERS_KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          // Kafka客户端配置
          client: {
            // Kafka集群broker地址
            // 生产环境通常配置多个broker实现高可用
            brokers: ['localhost:9092', 'localhost:9093', 'localhost:9094'],
            // 客户端ID，用于在Kafka中标识消费者
            // 同一消费者组的多个实例会共享这个ID
            clientId: 'order-service',
            // 连接超时时间
            connectionTimeout: 10000,
            // 请求超时时间
            requestTimeout: 30000,
            // 重试配置
            retry: {
              retries: 5,
              initialRetryTime: 100,
              maxRetryTime: 3000,
              factor: 2,
            },
            // SSL配置（生产环境建议开启）
            // ssl: true,
            // sasl: {
            //   mechanism: 'plain',
            //   username: 'username',
            //   password: 'password',
            // },
          },
          // 消费者配置
          consumer: {
            // 消费者组ID
            // 同一组的消费者会负载均衡消费消息
            // 不同组的消费者会各自消费一次消息（广播）
            groupId: 'order-service-group',
            // 会话超时时间
            sessionTimeout: 30000,
            // 心跳间隔
            heartbeatInterval: 3000,
            // 最大拉取字节数
            maxBytesPerPartition: 1048576,  // 1MB
            // 最大等待时间
            maxWaitTimeInMs: 500,
            // 是否自动提交offset
            // 自动提交可能在消费者崩溃时丢失消息
            // 重要业务建议设置为false，手动提交
            autoCommit: false,
          },
          // 生产者配置
          producer: {
            // acks: 0 - 不等待确认，高吞吐但可能丢失消息
            // acks: 1 - 等 leader 确认，中等吞吐，可能丢失消息（leader崩溃）
            // acks: all - 等所有副本确认，最低吞吐但最安全
            acks: -1,  // all
            // 压缩类型：none, gzip, snappy, lz4
            compression: 'gzip',
            // 发送重试次数
            retries: 3,
          },
        },
      },
    ]),
  ],
  controllers: [OrderEventController],
})
export class OrderEventModule {}
```

## 三、API网关设计

### 3.1 网关核心功能

**类比：** API网关就像机场的智能航站楼系统。它根据乘客的目的地（路由），检查证件（认证），称量行李（限流），并指引到正确的登机口（负载均衡）。

```
┌─────────────────────────────────────────────────────────────────┐
│                      API 网关功能矩阵                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────┐      │
│  │     路由       │   │     认证       │   │     限流       │      │
│  │               │   │               │   │               │      │
│  │  /api/users   │   │   JWT验证     │   │   令牌桶算法   │      │
│  │      ↓        │   │      ↓        │   │      ↓        │      │
│  │ user-service  │   │   权限校验     │   │   流量控制     │      │
│  └───────────────┘   └───────────────┘   └───────────────┘      │
│                                                                 │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────┐      │
│  │     聚合       │   │     缓存       │   │     日志       │      │
│  │               │   │               │   │               │      │
│  │  合并多个接口  │   │   Redis缓存   │   │   请求追踪     │      │
│  │      ↓        │   │      ↓        │   │      ↓        │      │
│  │   减少请求数   │   │   减轻后端压力 │   │   问题排查     │      │
│  └───────────────┘   └───────────────┘   └───────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 NestJS网关实现

**网关模块配置：**

```typescript
// API网关主模块
// 网关是微服务架构的单一入口，负责路由、认证、限流等功能

import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { AuthGuard } from './guards/auth.guard';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { PrometheusModule } from './prometheus.module';

@Module({
  imports: [
    // 注册后端微服务客户端
    // 网关需要连接所有后端服务来转发请求
    ClientsModule.register([
      // 用户服务客户端
      {
        name: 'USERS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: 3001,
        },
      },
      // 订单服务客户端
      {
        name: 'ORDERS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: 3002,
        },
      },
      // 商品服务客户端
      {
        name: 'PRODUCTS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: 3003,
        },
      },
      // 通知服务客户端
      {
        name: 'NOTIFICATION_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: 'localhost',
          port: 6379,
        },
      },
    ]),

    // Prometheus监控模块
    PrometheusModule,
  ],
  controllers: [GatewayController],
  providers: [
    GatewayService,
    // 全局认证守卫 - 所有请求都会经过认证
    // 注意：WebSocket网关使用不同的守卫
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    // 全局限流守卫
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
    // 全局日志拦截器
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // 全局响应转换拦截器
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    // 全局异常过滤器
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class GatewayModule {}
```

**网关控制器：**

```typescript
// 网关控制器 - 统一的API入口
// 网关根据请求路径将请求路由到对应的后端微服务

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  Headers,
  Req,
  Res,
  HttpStatus,
  HttpCode,
  UseGuards,
  UseInterceptors,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { RateLimit, RateLimitMetadata } from '@nestjs/throttler';
import { GatewayService } from './gateway.service';
import { AuthGuard } from './guards/auth.guard';
import { SkipRateLimit } from './decorators/skip-rate-limit.decorator';

@Controller('api')
export class GatewayController {
  private readonly logger = new Logger('GatewayController');

  constructor(private readonly gatewayService: GatewayService) {}

  // ============================================================
  // 用户相关路由 - 转发到用户服务
  // ============================================================

  @Get('users')
  async getUsers(@Query() query: GetUsersQueryDto) {
    // 查询用户列表
    // 转发到用户服务的 users.findMany pattern
    return this.gatewayService.send('USERS_SERVICE', 'users.findMany', query);
  }

  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    // 获取单个用户
    return this.gatewayService.send('USERS_SERVICE', 'users.findOne', { id: Number(id) });
  }

  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() body: CreateUserDto) {
    // 创建用户
    return this.gatewayService.send('USERS_SERVICE', 'users.create', body);
  }

  @Put('users/:id')
  async updateUser(@Param('id') id: string, @Body() body: UpdateUserDto) {
    // 更新用户
    return this.gatewayService.send('USERS_SERVICE', 'users.update', {
      id: Number(id),
      ...body,
    });
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string) {
    // 删除用户
    return this.gatewayService.send('USERS_SERVICE', 'users.delete', { id: Number(id) });
  }

  // ============================================================
  // 订单相关路由 - 转发到订单服务
  // ============================================================

  @Get('orders')
  async getOrders(@Query() query: GetOrdersQueryDto) {
    return this.gatewayService.send('ORDERS_SERVICE', 'orders.findMany', query);
  }

  @Get('orders/:id')
  async getOrder(@Param('id') id: string) {
    return this.gatewayService.send('ORDERS_SERVICE', 'orders.findOne', { id: Number(id) });
  }

  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@Body() body: CreateOrderDto) {
    return this.gatewayService.send('ORDERS_SERVICE', 'orders.create', body);
  }

  @Put('orders/:id/cancel')
  async cancelOrder(@Param('id') id: string) {
    return this.gatewayService.send('ORDERS_SERVICE', 'orders.cancel', { id: Number(id) });
  }

  @Put('orders/:id/pay')
  async payOrder(@Param('id') id: string, @Body() body: PayOrderDto) {
    return this.gatewayService.send('ORDERS_SERVICE', 'orders.pay', {
      id: Number(id),
      ...body,
    });
  }

  // ============================================================
  // 商品相关路由 - 转发到商品服务
  // ============================================================

  @Get('products')
  async getProducts(@Query() query: GetProductsQueryDto) {
    return this.gatewayService.send('PRODUCTS_SERVICE', 'products.findMany', query);
  }

  @Get('products/:id')
  async getProduct(@Param('id') id: string) {
    return this.gatewayService.send('PRODUCTS_SERVICE', 'products.findOne', { id: Number(id) });
  }

  @Get('products/:id/stock')
  async getProductStock(@Param('id') id: string) {
    return this.gatewayService.send('PRODUCTS_SERVICE', 'products.getStock', { id: Number(id) });
  }

  // ============================================================
  // 聚合接口 - 网关层聚合多个服务响应
  // ============================================================

  @Get('dashboard')
  @SkipRateLimit()  // 跳过限流，dashboard访问频繁
  async getDashboard(@Headers('x-user-id') userId: string) {
    // 聚合接口：一次性获取仪表板所需的所有数据
    // 减少客户端请求次数，提高页面加载速度

    if (!userId) {
      throw new Error('用户未登录');
    }

    // 并行调用多个服务
    const [user, orders, recommendations] = await Promise.all([
      // 获取用户信息
      this.gatewayService.send('USERS_SERVICE', 'users.findOne', { id: Number(userId) }),
      // 获取最近订单
      this.gatewayService.send('ORDERS_SERVICE', 'orders.findRecent', { userId: Number(userId), limit: 5 }),
      // 获取商品推荐
      this.gatewayService.send('PRODUCTS_SERVICE', 'products.getRecommendations', { userId: Number(userId), limit: 10 }),
    ]);

    // 聚合响应
    return {
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        level: user.level,
      },
      stats: {
        totalOrders: orders.total,
        pendingOrders: orders.pending,
        totalSpent: orders.totalSpent,
      },
      recentOrders: orders.items.slice(0, 3),
      recommendations: recommendations.items,
    };
  }

  // ============================================================
  // 事件发布接口 - 发布事件到消息队列
  // ============================================================

  @Post('events/order-created')
  async publishOrderCreatedEvent(@Body() body: OrderCreatedEventDto) {
    // 发布订单创建事件
    // 使用Redis pub/sub异步通知其他服务
    // 不等待处理结果，提高响应速度
    return this.gatewayService.emit('NOTIFICATION_SERVICE', 'order.created', body);
  }

  // ============================================================
  // 文件上传 - 特殊处理
  // ============================================================

  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @SkipRateLimit()  // 上传文件不计入限流
  async uploadFile(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // 文件上传需要特殊处理
    // 1. 使用流式处理，避免内存溢出
    // 2. 限制文件大小
    // 3. 验证文件类型
    // 4. 返回文件访问URL

    const file = req.file;
    if (!file) {
      throw new Error('请选择要上传的文件');
    }

    // 上传到文件服务或OSS
    const result = await this.gatewayService.uploadFile(file);

    return {
      url: result.url,
      filename: result.filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  // ============================================================
  // WebSocket接口 - 实时通信
  // ============================================================

  @Get('ws-token')
  async getWebSocketToken(@Headers('x-user-id') userId: string) {
    // 获取WebSocket连接Token
    // 用于建立实时通信连接
    return this.gatewayService.getWsToken(userId);
  }
}
```

**网关服务：**

```typescript
// 网关核心服务
// 负责请求转发、响应聚合、缓存等核心逻辑

import { Injectable, Inject, Logger, HttpException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, of, from } from 'rxjs';
import { map, catchError, timeout, retry, switchMap } from 'rxjs/operators';

@Injectable()
export class GatewayService {
  private readonly logger = new Logger('GatewayService');

  constructor(
    // 注入所有微服务客户端
    @Inject('USERS_SERVICE') private readonly usersClient: ClientProxy,
    @Inject('ORDERS_SERVICE') private readonly ordersClient: ClientProxy,
    @Inject('PRODUCTS_SERVICE') private readonly productsClient: ClientProxy,
    @Inject('NOTIFICATION_SERVICE') private readonly notificationClient: ClientProxy,
  ) {}

  // 获取客户端实例
  private getClient(serviceName: string): ClientProxy {
    const clients = {
      USERS_SERVICE: this.usersClient,
      ORDERS_SERVICE: this.ordersClient,
      PRODUCTS_SERVICE: this.productsClient,
      NOTIFICATION_SERVICE: this.notificationClient,
    };

    const client = clients[serviceName];
    if (!client) {
      throw new HttpException(`服务不存在: ${serviceName}`, 404);
    }
    return client;
  }

  // 发送请求-响应模式的消息
  async send<T>(
    serviceName: string,
    pattern: string | object,
    data: any,
    options?: { timeout?: number; retries?: number },
  ): Promise<T> {
    const client = this.getClient(serviceName);
    const timeoutMs = options?.timeout || 30000;
    const retries = options?.retries || 3;

    this.logger.debug(`[${serviceName}] 发送请求: ${JSON.stringify(pattern)}, 数据: ${JSON.stringify(data)}`);

    // 使用firstValueFrom将Observable转为Promise
    const { firstValueFrom } = await import('rxjs');

    try {
      // 发送消息并设置超时和重试
      const result = await firstValueFrom(
        client.send(pattern, data).pipe(
          // 超时控制
          timeout(timeoutMs),
          // 重试机制
          retry({
            count: retries,
            delay: (retryCount, error) => {
              this.logger.warn(`[${serviceName}] 请求失败，第${retryCount}次重试: ${error.message}`);
              // 指数退避：重试间隔 = 100ms * 2^retryCount，最大5秒
              const delay = Math.min(100 * Math.pow(2, retryCount), 5000);
              return new Promise((resolve) => setTimeout(resolve, delay));
            },
          }),
          // 错误处理
          catchError((error) => {
            this.logger.error(`[${serviceName}] 请求异常: ${error.message}`);
            throw error;
          }),
        ),
      );

      this.logger.debug(`[${serviceName}] 收到响应: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      // 根据错误类型抛出适当的HTTP异常
      if (error.name === 'TimeoutError') {
        throw new HttpException(
          {
            code: 'TIMEOUT',
            message: `服务响应超时: ${serviceName}`,
          },
          504,
        );
      }
      throw error;
    }
  }

  // 发送事件（异步，不等待响应）
  emit(serviceName: string, pattern: string | object, data: any): void {
    const client = this.getClient(serviceName);

    this.logger.debug(`[${serviceName}] 发布事件: ${JSON.stringify(pattern)}`);
    client.emit(pattern, data);
  }

  // 批量请求
  async sendBatch(requests: Array<{
    serviceName: string;
    pattern: string | object;
    data: any;
  }>): Promise<any[]> {
    // 并行发送所有请求
    const promises = requests.map((req) =>
      this.send(req.serviceName, req.pattern, req.data).catch((error) => ({
        error: error.message,
      })),
    );

    return Promise.all(promises);
  }

  // 聚合请求 - 依赖前一个请求结果
  async sendChain(requests: Array<{
    serviceName: string;
    pattern: string | object;
    data: any;
  }>): Promise<any> {
    let result: any = null;

    for (const req of requests) {
      // 如果前一个请求有结果，将其加入下一个请求的数据中
      if (result) {
        req.data = { ...req.data, previousResult: result };
      }
      result = await this.send(req.serviceName, req.pattern, req.data);
    }

    return result;
  }

  // 文件上传（特殊处理）
  async uploadFile(file: any): Promise<{ url: string; filename: string }> {
    // 实际项目中，这里会上传到OSS、S3或文件服务器
    // 这里简化处理
    const filename = `${Date.now()}-${file.originalname}`;
    const url = `https://cdn.example.com/uploads/${filename}`;

    this.logger.log(`文件上传: ${filename}`);

    return { url, filename };
  }

  // WebSocket Token生成
  async getWsToken(userId: string): Promise<{ token: string; expiresIn: number }> {
    // 生成WebSocket连接用的Token
    // 通常使用JWT，包含用户ID和有效期
    const secret = process.env.WS_TOKEN_SECRET || 'ws-secret';
    const expiresIn = 3600; // 1小时

    // 使用crypto生成简单的Token
    // 生产环境应该使用jsonwebtoken库
    const payload = {
      userId,
      type: 'ws',
      iat: Math.floor(Date.now() / 1000),
    };

    const token = Buffer.from(JSON.stringify(payload)).toString('base64');

    return { token, expiresIn };
  }
}
```

## 四、安全认证

### 4.1 JWT认证实现

**JWT守卫：**

```typescript
// 认证守卫 - 验证请求的JWT Token
// 守卫是NestJS认证授权的核心组件

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger('AuthGuard');

  constructor(
    // JWT服务，用于验证Token
    private readonly jwtService: JwtService,
    // 反射器，用于获取路由元数据
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 检查是否是公开路由
    // 公开路由不需要认证
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // 获取请求对象
    const request = context.switchToHttp().getRequest();

    // 从请求头获取Token
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      this.logger.warn('请求缺少认证Token');
      throw new UnauthorizedException('请先登录');
    }

    try {
      // 验证Token
      const payload = await this.jwtService.verifyAsync(token, {
        // 密钥，可以从配置中读取
        secret: process.env.JWT_SECRET || 'jwt-secret',
      });

      // 将用户信息挂载到请求对象上
      // 后续的控制器和服务可以直接通过req.user获取用户信息
      request['user'] = payload;

      this.logger.debug(`用户认证成功: ${payload.sub || payload.userId}`);

      return true;
    } catch (error) {
      this.logger.warn(`Token验证失败: ${error.message}`);
      throw new UnauthorizedException('Token已过期或无效');
    }
  }

  // 从请求头提取Token
  private extractTokenFromHeader(request: Request): string | undefined {
    // 支持两种格式：
    // Authorization: Bearer <token>
    // Authorization: <token>
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');

    // Bearer Token格式
    if (type === 'Bearer' && token) {
      return token;
    }

    // 直接是Token的格式
    if (type && !token) {
      return type;
    }

    return undefined;
  }
}

// 角色守卫 - 验证用户角色
import { Injectable, CanActivate, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/user-role.enum';

// 保存角色要求的key
export const ROLES_KEY = 'roles';

// 装饰器：设置路由需要的角色
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // 获取路由要求的角色
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 如果没有设置角色要求，放行
    if (!requiredRoles) {
      return true;
    }

    // 获取请求中的用户信息
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // 检查用户角色是否匹配要求
    // 支持多角色匹配：用户只需拥有其中任意一个角色即可
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
```

**JWT模块配置：**

```typescript
// JWT模块配置
// 提供JWT生成和验证功能

import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtService } from './jwt.service';
import { JwtStrategy } from './jwt.strategy';

@Global()
@Module({
  imports: [
    // Passport用于JWT认证
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // 配置JWT模块
    JwtModule.register({
      // 签名选项
      signOptions: {
        // Token有效期
        expiresIn: '7d', // 7天
        // 算法（默认HS256）
        algorithm: 'HS256',
      },
      // 密钥（生产环境应该从安全存储中读取）
      secret: process.env.JWT_SECRET || 'jwt-secret-change-in-production',
    }),
  ],
  providers: [JwtService, JwtStrategy],
  exports: [JwtModule, JwtService],
})
export class JwtModule {}

// JWT策略 - Passport的验证策略
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      // 从请求头提取JWT的方式
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // 忽略过期Token
      ignoreExpiration: false,
      // 密钥
      secretOrKey: process.env.JWT_SECRET || 'jwt-secret-change-in-production',
      // 验证选项
      validateStrategy: 'jwt',
    });
  }

  // Token验证通过后执行的回调
  // 将用户信息挂载到request对象上
  async validate(payload: any) {
    // payload是Token中存储的用户信息
    // 可以在这里查询数据库获取完整用户信息
    const user = await this.usersService.findById(payload.sub || payload.userId);

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    return {
      userId: payload.sub || payload.userId,
      email: payload.email,
      roles: payload.roles,
      // 可以附加额外信息
      ...user,
    };
  }
}
```

### 4.2 网关限流实现

```typescript
// 基于Token Bucket的限流实现
// 限流是保护系统不被瞬时高流量冲垮的关键

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { RedisService } from './redis.service';
import { RateLimitConfig } from '../config/rate-limit.config';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger('RateLimitGuard');

  constructor(
    private readonly redisService: RedisService,
    private readonly config: RateLimitConfig,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // 获取限流key（通常是用户ID或IP地址）
    const key = this.getKey(request);

    // 获取限流配置
    const { limit, windowMs } = this.getLimitConfig(request);

    try {
      // 使用Redis实现Token Bucket算法
      const result = await this.checkRateLimit(key, limit, windowMs);

      // 设置响应头，告诉客户端限流信息
      response.setHeader('X-RateLimit-Limit', limit);
      response.setHeader('X-RateLimit-Remaining', result.remaining);
      response.setHeader('X-RateLimit-Reset', result.resetTime);

      // 如果被限流，返回429错误
      if (!result.allowed) {
        this.logger.warn(`限流触发: key=${key}, limit=${limit}, window=${windowMs}ms`);
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: '请求过于频繁，请稍后再试',
            error: 'Too Many Requests',
            retryAfter: result.retryAfter,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      return true;
    } catch (error) {
      if (error.status === 429) {
        throw error;
      }
      // Redis异常时，放行请求（fail-open）
      this.logger.error(`限流检查异常: ${error.message}`);
      return true;
    }
  }

  // 获取限流key
  private getKey(request: Request): string {
    // 优先使用用户ID
    if (request.user?.userId) {
      return `ratelimit:user:${request.user.userId}`;
    }

    // 其次使用Token
    const authHeader = request.headers.authorization;
    if (authHeader) {
      return `ratelimit:token:${authHeader}`;
    }

    // 最后使用IP
    const ip = request.ip || request.headers['x-forwarded-for'] || 'unknown';
    return `ratelimit:ip:${ip}`;
  }

  // 获取限流配置
  private getLimitConfig(request: Request): { limit: number; windowMs: number } {
    // 可以根据路由、用户等级等动态调整限流
    const baseConfig = this.config.getConfig();

    // 特殊路由配置
    const path = request.path;
    if (path.startsWith('/api/auth')) {
      // 登录接口限流更严格
      return { limit: 5, windowMs: 60000 }; // 1分钟5次
    }
    if (path.startsWith('/api/search')) {
      // 搜索接口中等限流
      return { limit: 30, windowMs: 60000 }; // 1分钟30次
    }
    if (path.startsWith('/api/upload')) {
      // 上传接口限制更宽松
      return { limit: 10, windowMs: 60000 }; // 1分钟10次
    }

    // VIP用户限流更宽松
    if (request.user?.isVip) {
      return { limit: baseConfig.vipLimit, windowMs: baseConfig.windowMs };
    }

    return { limit: baseConfig.defaultLimit, windowMs: baseConfig.windowMs };
  }

  // 检查限流
  private async checkRateLimit(
    key: string,
    limit: number,
    windowMs: number,
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter: number;
  }> {
    const now = Date.now();
    const windowStart = now - windowMs;

    // 使用Redis Lua脚本保证原子性
    // 脚本逻辑：
    // 1. 删除窗口外的旧记录
    // 2. 统计当前窗口内的请求数
    // 3. 如果超过限制，返回拒绝
    // 4. 否则，添加新记录并返回允许
    const luaScript = `
      local key = KEYS[1]
      local limit = tonumber(ARGV[1])
      local windowStart = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])

      -- 删除窗口外的旧记录
      redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)

      -- 获取当前窗口内的请求数
      local count = redis.call('ZCARD', key)

      if count >= limit then
        -- 超过限制，计算剩余时间
        local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
        local retryAfter = 0
        if #oldest > 0 then
          retryAfter = math.ceil((tonumber(oldest[2]) + ${windowMs} - now) / 1000)
        end
        return {0, 0, 0, retryAfter}
      end

      -- 添加新请求
      redis.call('ZADD', key, now, now .. '-' .. math.random())
      -- 设置过期时间
      redis.call('PEXPIRE', key, ${windowMs})

      return {1, limit - count - 1, now + ${windowMs}, 0}
    `;

    const result = await this.redisService.eval(
      luaScript,
      [key],
      [limit.toString(), windowStart.toString(), now.toString()],
    ) as [number, number, number, number];

    return {
      allowed: result[0] === 1,
      remaining: result[1],
      resetTime: result[2],
      retryAfter: result[3],
    };
  }
}
```

## 五、实战踩坑经验

### 5.1 微服务通信常见问题

**坑1：消息丢失**

```
问题：使用Redis pub/sub时，消费者下线期间的消息会丢失

原因：pub/sub不持久化消息，消息在管道中即发即弃

解决方案：
1. 使用Redis Streams替代pub/sub
2. 使用Kafka、RabbitMQ等支持持久化的MQ
3. 使用Redis的BLPOP阻塞版本实现简单的队列
```

**坑2：消息重复消费**

```
问题：消费者处理成功后，ack失败导致消息被重复投递

原因：网络波动、消费者崩溃等导致ack未成功

解决方案：
1. 消费者实现幂等性（处理前检查是否已处理）
2. 使用唯一消息ID进行去重
3. 使用事务保证原子性
```

**坑3：分布式事务问题**

```
问题：跨服务的数据一致性难以保证

症状：
- 服务A成功了，服务B失败了
- 部分订单已支付，但库存没扣减

解决方案：
1. 使用Saga模式（编排型/协同型）
2. 使用可靠消息最终一致性
3. 使用Seata等分布式事务框架（谨慎）
```

### 5.2 网关配置常见问题

**坑4：JWT验证绕过**

```
问题：某些路由没有正确应用认证守卫

原因：
- 全局守卫配置不当
- 守卫执行顺序问题

解决方案：
1. 显式标注公开路由
2. 使用@SkipAuth装饰器
3. 定期审查路由配置
```

**坑5：限流不生效**

```
问题：限流规则没有正确应用

原因：
- Redis连接失败
- Lua脚本错误

解决方案：
1. 添加限流异常的日志记录
2. 使用fail-open策略（异常时放行）
3. 定期测试限流功能
```

### 5.3 性能优化建议

**1. 连接池配置**

```typescript
// Redis连接池配置
// 连接池大小影响并发能力
@Injectable()
export class RedisService {
  private readonly pool;

  constructor() {
    this.pool = createPool(
      {
        host: 'localhost',
        port: 6379,
        // 连接池大小
        maxConnections: 50,
        // 最小空闲连接
        minConnections: 5,
        // 连接获取超时
        acquireTimeout: 10000,
        // 连接空闲超时
        idleTimeout: 30000,
        // 重连配置
        reconnectTime: 1000,
      },
      {
        // 最大等待客户端数
        max: 100,
      },
    );
  }
}
```

**2. 消息压缩**

```typescript
// Kafka消息压缩配置
// 压缩可以减少网络传输，提升吞吐量
{
  producer: {
    acks: -1,
    // 压缩算法：snappy比gzip更快，但压缩比较低
    compression: 'snappy',
  },
}
```

**3. 批量处理**

```typescript
// 批量处理优化
// 减少网络开销，提高吞吐量
@MessagePattern('batch.process')
async handleBatch(@Payload() data: { ids: number[] }) {
  // 批量查询，一次数据库访问获取所有数据
  const items = await this.itemsService.findByIds(data.ids);

  // 批量处理
  const results = await Promise.all(
    items.map((item) => this.processItem(item)),
  );

  return results;
}
```

## 六、总结

NestJS微服务架构提供了现代化的后端解决方案，通过TCP、Redis、Kafka等多种传输层支持，可以灵活应对不同业务场景。网关作为统一入口，承担了认证、限流、路由聚合等重要职责。

**最佳实践清单：**

| 场景 | 推荐方案 |
|------|----------|
| 同步调用 | TCP + 消息模式 |
| 异步通知 | Redis pub/sub |
| 高可靠消息 | Kafka |
| 服务发现 | Consul / Nacos |
| 配置管理 | Nacos Config |
| 限流 | Redis + Lua |
| 认证 | JWT + 守卫 |

---

*文档版本：v1.0*
*更新日期：2024年*
*适用技术栈：NestJS 10.x / TypeScript 5.x / Node.js 18+ / Redis / Kafka*
