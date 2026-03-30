# Node.js后端工程化完全指南

> 本文档集涵盖2026年Node.js后端开发的完整工程化体系，从框架选择到生产级部署，助力构建高性能、可维护的企业级应用。

---

## 文档索引

### 01_Express_NestJS框架工程化实践.md

**核心内容**：
- Express中间件架构与请求验证
- NestJS模块化架构与依赖注入
- 守卫、管道、拦截器完整实现
- 企业级特性：统一响应格式、速率限制
- 面试核心问题与参考答案

**关键技术点**：
```typescript
// NestJS依赖注入示例
@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject('CACHE_MANAGER') private cacheManager: CacheManager
  ) {}
}
```

**学习建议**：适合已掌握Express基础，希望进阶到企业级Node.js开发的工程师

---

### 02_Node.js_API设计与RESTful最佳实践.md

**核心内容**：
- RESTful API设计原则与HTTP状态码规范
- API版本管理策略
- 请求参数处理：分页、排序、过滤、搜索
- GraphQL集成与NestJS实现
- API安全：输入验证、速率限制
- 面试核心问题与参考答案

**关键技术点**：
```typescript
// GraphQL分页查询
@Query(() => PaginatedUserType)
async users(
  @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
  @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number
): Promise<PaginatedUserType>
```

**学习建议**：适合需要设计高质量API接口的后端开发者

---

### 03_Node.js认证授权与JWT实现.md

**核心内容**：
- 密码安全：bcrypt哈希、加密存储
- JWT完整实现：访问令牌、刷新令牌
- OAuth2与第三方登录（Google、GitHub）
- RBAC权限管理：角色、权限、守卫
- Token安全存储策略
- 面试核心问题与参考答案

**关键技术点**：
```typescript
// JWT令牌生成与验证
generateTokens(user: { id: string; email: string; roles: string[] }): TokenPair {
  const accessToken = this.jwtService.sign(accessPayload, {
    expiresIn: '15m',
    secret: this.configService.get('JWT_ACCESS_SECRET')
  });
  // ...
}
```

**学习建议**：适合需要实现用户认证和权限控制的开发者

---

### 04_Node.js_ORM与数据库设计.md

**核心内容**：
- ORM框架对比：Prisma、Drizzle、TypeORM、Sequelize
- Prisma完整实战：Schema设计、CRUD操作、事务
- 数据库设计模式：软删除、审计日志、索引设计
- Redis缓存策略：Cache Aside、Write Through、延迟双删
- 面试核心问题与参考答案

**关键技术点**：
```prisma
// Prisma Schema设计
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  posts     Post[]   // 一对多关系
  roles     Role[]   // 多对多关系
}
```

**学习建议**：适合需要设计数据库和实现数据访问层的开发者

---

### 05_Node.js日志系统与异常处理.md

**核心内容**：
- 日志级别规范与Winston配置
- 请求日志中间件实现
- 自定义异常类设计
- 全局异常过滤器
- OpenTelemetry链路追踪
- 健康检查与Kubernetes探针
- 面试核心问题与参考答案

**关键技术点**：
```typescript
// 全局异常过滤器
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // 统一错误响应格式
    response.status(status).json({
      success: false,
      error: { code, message, details }
    });
  }
}
```

**学习建议**：适合需要构建生产级可观测性的开发者

---

### 06_Node.js微服务架构实践.md

**核心内容**：
- 微服务vs单体架构对比
- NestJS消息传输：RabbitMQ、Kafka
- 服务网关设计与代理配置
- Consul服务注册与发现
- 分布式事务处理策略
- 面试核心问题与参考答案

**关键技术点**：
```typescript
// NestJS微服务配置
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.RMQ,
  options: {
    urls: ['amqp://localhost:5672'],
    queue: 'notifications'
  }
});
```

**学习建议**：适合需要构建分布式系统的开发者

---

## 学习路径建议

```
第一阶段：框架基础（1-2周）
├── Express框架工程化实践
└── API设计与RESTful最佳实践

第二阶段：核心功能（1-2周）
├── 认证授权与JWT实现
└── ORM与数据库设计

第三阶段：生产级特性（1-2周）
├── 日志系统与异常处理
└── 微服务架构实践

第四阶段：综合实战（持续）
├── 构建完整的后端项目
├── 配置CI/CD流水线
└── 性能调优与监控
```

## 技术栈版本参考

| 技术领域 | 技术名称 | 版本 |
|---------|---------|------|
| 后端框架 | Express | 4.x |
| 后端框架 | NestJS | 11.x |
| ORM | Prisma | 6.x |
| ORM | TypeORM | 0.3.x |
| 认证 | JWT | - |
| 数据库 | PostgreSQL | 16 |
| 缓存 | Redis | 7.x |
| 消息队列 | RabbitMQ | 3.x |
| 日志 | Winston | 3.x |
| 链路追踪 | OpenTelemetry | 1.x |

## 快速索引

- 想学框架选型 → `01_Express_NestJS框架工程化实践.md`
- 想学API设计 → `02_Node.js_API设计与RESTful最佳实践.md`
- 想学用户认证 → `03_Node.js认证授权与JWT实现.md`
- 想学数据库设计 → `04_Node.js_ORM与数据库设计.md`
- 想学日志监控 → `05_Node.js日志系统与异常处理.md`
- 想学微服务 → `06_Node.js微服务架构实践.md`

---

**文档版本**：v1.0
**最后更新**：2026-03-18
**维护团队**：全栈开发教学组
