# NestJS 架构与依赖注入 (DI) 底层深度解析 (2026版)

## 1. 概述

在 Node.js 后端生态中，Express 和 Koa 曾经统治了很长一段时间。但它们过于自由，导致在中大型企业级项目中，代码结构往往演变成混乱的“面条代码”。

**NestJS** 横空出世，它深受 Angular 启发，引入了强类型的 TypeScript、面向对象编程 (OOP)、面向切面编程 (AOP) 以及最核心的 **依赖注入 (Dependency Injection, DI)** 容器。

本指南将深入剖析 NestJS 的底层架构引擎，解释它是如何通过装饰器和元数据管理成百上千个模块的，以及它与底层 Express/Fastify 的适配机制。

---

## 2. 核心灵魂：控制反转 (IoC) 与依赖注入 (DI)

### 2.1 什么是控制反转 (IoC)？
在传统的面向对象编程中，如果类 A 依赖类 B，类 A 通常会在内部 `new B()`。
这导致了**强耦合**：类 A 必须确切知道类 B 的构造细节，如果要替换 B 或者 mock B 写单元测试，将极其困难。

**IoC (Inversion of Control)** 是一种设计原则：将对象的创建权“交还”给一个外部的容器。

### 2.2 NestJS 的 DI 容器机制
NestJS 内部实现了一个强大的 IoC 容器。当你使用 `@Injectable()` 装饰一个类时，你实际上是在告诉 NestJS 容器：**“请帮我管理这个类的实例化。”**

```typescript
import { Injectable } from '@nestjs/common';

// 1. 声明这是一个可以被注入的 Provider
@Injectable()
export class UsersService {
  findAll() { return ['user1', 'user2']; }
}

import { Controller, Get } from '@nestjs/common';

@Controller('users')
export class UsersController {
  // 2. 在构造函数中声明依赖
  // NestJS 容器在实例化 Controller 时，会自动寻找 UsersService 的单例并注入进来
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getAll() {
    return this.usersService.findAll();
  }
}
```

### 2.3 底层魔法：Reflect Metadata
TypeScript 编译后，类型信息（如 `UsersService`）本该被抹除（Type Erasure）。NestJS 是如何知道 Controller 的参数需要什么类的？

答案是 **`reflect-metadata`**。
在 `tsconfig.json` 中开启 `emitDecoratorMetadata: true` 后，TS 编译器会在生成的 JS 代码中自动注入元数据：
```javascript
// 编译后的隐藏代码
Reflect.metadata("design:paramtypes", [UsersService])
```
NestJS 容器启动时，会扫描这些元数据，构建出一张全局的依赖图（Dependency Graph），然后根据拓扑排序自动、按顺序地实例化所有的类。

---

## 3. NestJS 请求生命周期与 AOP 架构

NestJS 实现了完美的**面向切面编程 (AOP)**。一个 HTTP 请求到达底层服务器后，会严格经过以下生命周期，然后再到达你的业务逻辑。

1. **Middleware (中间件)**：最先执行，与 Express 的中间件完全一致，可以修改 `req` 和 `res`。
2. **Guards (守卫)**：用于**授权 (Authorization)**。比如验证用户是否携带了有效的 JWT，是否有 Admin 角色。如果不通过，请求直接被拦截抛出 403。
3. **Interceptors (拦截器 - 请求前)**：在路由处理前执行。常用于：全局日志记录、请求数据转换。
4. **Pipes (管道)**：用于**数据转换**（如 String 转 Number）和**数据验证**（配合 `class-validator` 校验 DTO 格式）。
5. **Controller (控制器)**：你的业务路由。
6. **Service (服务层)**：处理核心业务逻辑并操作数据库。
7. **Interceptors (拦截器 - 响应后)**：在发送响应给客户端前拦截结果，比如将所有响应包裹成统一的 `{ code: 200, data: ... }` 格式。
8. **Exception Filters (异常过滤器)**：捕获上面任何阶段抛出的未处理异常，并格式化为友好的 HTTP 错误返回。

---

## 4. 底层 HTTP 适配器：Express vs Fastify

NestJS 本身并不是一个 HTTP 服务器，它是一个**框架层**。它通过**适配器模式 (Adapter Pattern)** 将所有的 HTTP 操作委托给底层的引擎。

### 4.1 默认引擎：ExpressAdapter
默认情况下，NestJS 使用 Express。它的生态极其繁荣，任何 Node.js 原生的库都能无缝接入。但在超高并发下，Express 的路由匹配和中间件遍历机制显得有些陈旧且缓慢。

### 4.2 性能引擎：FastifyAdapter
在 2026 年，对于对 QPS (每秒查询率) 要求极高的微服务，通常会切换到底层为 Fastify 的引擎。
- **为什么 Fastify 快？** Fastify 使用了基于 `Radix Tree`（基数树）的极速路由匹配算法，并使用 `fast-json-stringify` 预编译 JSON 序列化函数，这使得它的吞吐量通常是 Express 的 2 到 3 倍。

**如何切换？**
```typescript
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  // 只需要在启动时替换 Adapter，上层的 Controller 和 Service 代码一行都不用改！
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );
  await app.listen(3000);
}
bootstrap();
```
这就是 NestJS 优秀架构的体现：**业务逻辑与底层基础设施完全解耦**。

---

## 5. 面试高频问题

**Q1：NestJS 的 Provider 默认是单例模式 (Singleton) 吗？**
**答：** 是的。默认情况下，NestJS 容器中的 Service 在应用启动时被实例化一次，所有 Controller 共享这一个实例。这不仅节省内存，还能共享状态。但如果需要，可以通过 `@Injectable({ scope: Scope.REQUEST })` 将其配置为“请求级作用域”（每个 HTTP 请求来时实例化一次，请求结束销毁），但这会显著降低应用性能（因为带来了大量的 GC 垃圾回收开销）。

**Q2：Guards（守卫）和 Middleware（中间件）的区别是什么？**
**答：** 
- **执行上下文**：Middleware 不知道请求接下来要交给哪个路由处理器。而 Guards 是能够通过 `ExecutionContext` 拿到**反射信息**的，它确切知道接下来的 Controller 是谁，以及这个 Controller 上挂载了什么自定义装饰器（如 `@Roles('admin')`）。
- **职责**：Middleware 适合做泛泛的全局操作（日志、解密 body）。Guards 专为权限控制设计。

---
*本文档持续更新，最后更新于 2026 年 3 月*