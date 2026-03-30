# 领域驱动设计 (DDD) 与复杂业务逻辑架构 (2026版)

## 一、概述

在全栈开发的初期，传统的 MVC（Model-View-Controller）和”贫血模型（Anemic Domain Model）”足以应付 CRUD 操作。然而，当业务逻辑极度膨胀（如：电商系统的促销、库存、支付、物流耦合在一起）时，MVC 架构会导致 Service 层变成数千行的”上帝类 (God Class)”。

**领域驱动设计 (Domain-Driven Design, DDD)** 是解决复杂业务逻辑的终极架构模式。本指南结合 Node.js (NestJS) / TypeScript 环境，深度剖析 DDD 的落地实践。

---

## 二、贫血模型 vs 充血模型

### 2.1 传统的贫血模型 (Anemic Domain Model)

这是目前 90% 后端开发者的写法：

```typescript
// 实体只是一个数据容器（只有 getter/setter）
class User {
  id: string;
  points: number;
  status: 'active' | 'banned';
}

// 所有的业务逻辑都在 Service 里
class UserService {
  usePoints(user: User, amount: number) {
    if (user.status === 'banned') throw new Error();
    if (user.points < amount) throw new Error();
    user.points -= amount;
    db.save(user); // 外部保存
  }
}
```

**痛点**：状态（User）和行为（usePoints）分离。任何人只要拿到 User 对象，就可以随意修改 `user.points = -100`，业务规则极易被破坏。

### 2.2 DDD 充血模型 (Rich Domain Model)

在 DDD 中，实体必须自己保护自己的业务不变性（Invariants）：

```typescript
// 充血模型 - 实体自己管理自己的状态
class User {
  private id: string;
  private points: number;
  private status: 'active' | 'banned';
  private domainEvents: DomainEvent[] = [];

  // 私有构造函数，强制通过工厂方法创建
  private constructor(props: UserProps) {
    this.id = props.id;
    this.points = props.points;
    this.status = props.status;
  }

  // 工厂方法
  static create(props: CreateUserProps): User {
    if (!props.username || props.username.length < 3) {
      throw new DomainException('用户名至少需要3个字符');
    }
    return new User({
      id: generateId(),
      points: 0,
      status: 'active',
      ...props
    });
  }

  // 业务行为与状态绑定在实体内部
  public consumePoints(amount: number): void {
    // 业务不变性检查
    if (this.status === 'banned') {
      throw new DomainException('账号已被封禁，无法使用积分');
    }
    if (this.points < amount) {
      throw new DomainException(`积分不足：当前${this.points}，需要${amount}`);
    }
    if (amount <= 0) {
      throw new DomainException('使用的积分必须大于0');
    }

    // 执行状态变更
    this.points -= amount;

    // 抛出领域事件
    this.addDomainEvent(new PointsConsumedEvent(this.id, amount));
  }

  public addPoints(amount: number): void {
    if (amount <= 0) {
      throw new DomainException('增加的积分必须大于0');
    }
    this.points += amount;
    this.addDomainEvent(new PointsAddedEvent(this.id, amount));
  }

  // 获取积分（只读）
  public getPoints(): number {
    return this.points;
  }

  // 聚合根不允许外部直接修改状态
  private addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  public pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents = [];
    return events;
  }
}

// Service 变得极度轻薄，只负责协调（编排）
class UserService {
  constructor(
    private readonly userRepository: UserRepository
  ) {}

  async checkout(userId: string, amount: number): Promise<void> {
    // 1. 获取聚合根
    const user = await this.userRepository.findById(userId);

    // 2. 调用聚合根的业务方法（所有检查在实体内部完成）
    user.consumePoints(amount);

    // 3. 仓储持久化（自动保存并发布领域事件）
    await this.userRepository.save(user);

    // 4. 发布领域事件到消息队列
    const events = user.pullDomainEvents();
    await this.eventPublisher.publish(events);
  }
}
```

---

## 三、DDD 核心战术模式构建

### 3.1 实体 (Entity) 与 值对象 (Value Object)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Entity vs Value Object                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Entity（实体）                                                  │
│  ────────────                                                   │
│  • 拥有唯一标识符（ID）                                         │
│  • 生命周期内，ID 保持不变                                      │
│  • 即使所有属性改变，它还是同一个对象                           │
│  • 示例：用户、订单、货物                                       │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ class User {                                           │   │
│  │   private id: string;  // 唯一标识                     │   │
│  │   private name: string;                               │   │
│  │   private email: string;                               │   │
│  │                                                         │   │
│  │   // 相等性基于 ID                                     │   │
│  │   equals(other: User): boolean {                      │   │
│  │     return this.id === other.id;                      │   │
│  │   }                                                   │   │
│  │ }                                                     │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                                  │
│  Value Object（值对象）                                          │
│  ────────────────────────                                       │
│  • 没有 ID，仅由其属性决定相等性                                │
│  • 不可变（Immutable）                                         │
│  • 用于描述事物的特征                                          │
│  • 示例：货币、地址、颜色、日期范围                             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ class Money {  // 值对象 - 必须不可变                   │   │
│  │   constructor(                                           │   │
│  │     public readonly amount: number,                      │   │
│  │     public readonly currency: string                     │   │
│  │   ) {}                                                   │   │
│  │                                                         │   │
│  │   // 值对象相等性基于所有属性                           │   │
│  │   equals(other: Money): boolean {                       │   │
│  │     return this.amount === other.amount &&              │   │
│  │            this.currency === other.currency;            │   │
│  │   }                                                     │   │
│  │                                                         │   │
│  │   // 返回新实例，而非修改原实例                         │   │
│  │   add(other: Money): Money {                            │   │
│  │     if (this.currency !== other.currency) {             │   │
│  │       throw new Error('货币单位必须相同');               │   │
│  │     }                                                   │   │
│  │     return new Money(this.amount + other.amount,        │   │
│  │                    this.currency);                      │   │
│  │   }                                                     │   │
│  │ }                                                       │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 聚合根 (Aggregate Root)

聚合是将强关联的实体和值对象绑定在一起的集合。

**核心规则：**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Aggregate Root 规则                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. 每个聚合都有一个聚合根（Aggregate Root）                    │
│                                                                  │
│  2. 外界只能通过聚合根来修改聚合内部的状态                      │
│     绝不允许直接绕过聚合根去操作内部的子实体                     │
│                                                                  │
│  3. 聚合边界内的对象可以相互引用                               │
│     聚合边界外的对象只能通过 ID 引用                            │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Order Aggregate                       │   │
│  │                                                         │   │
│  │   Order（聚合根）                                        │   │
│  │   ├── id: string                                        │   │
│  │   ├── items: OrderItem[]  ← 子实体                      │   │
│  │   ├── shippingAddress: Address  ← 值对象                 │   │
│  │   └── totalAmount: Money  ← 值对象                      │   │
│  │                                                         │   │
│  │   ✅ 可以通过 order.items.push(item) 修改              │   │
│  │   ❌ 不能直接创建 OrderItem 并添加到数据库             │   │
│  │                                                         │   │
│  │   外部引用                                              │   │
│  │   • orderId (只通过 ID 引用)                           │   │
│  │   • customerId (只通过 ID 引用)                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**代码实现：**

```typescript
// 聚合根 - Order
class Order extends AggregateRoot {
  private id: string;
  private customerId: string;
  private items: OrderItem[] = [];
  private status: OrderStatus;
  private shippingAddress: Address;

  // 只能在聚合内部创建子实体
  public addItem(product: Product, quantity: number): void {
    if (this.status !== 'pending') {
      throw new DomainException('只有待处理订单可以添加商品');
    }

    const existingItem = this.items.find(
      item => item.productId === product.id
    );

    if (existingItem) {
      existingItem.increaseQuantity(quantity);
    } else {
      const item = new OrderItem({
        id: generateId(),
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity
      });
      this.items.push(item);
    }

    this.addDomainEvent(new OrderItemAddedEvent(this.id, product.id));
  }

  public removeItem(productId: string): void {
    if (this.status !== 'pending') {
      throw new DomainException('只有待处理订单可以移除商品');
    }

    const index = this.items.findIndex(item => item.productId === productId);
    if (index === -1) {
      throw new DomainException('订单中没有该商品');
    }

    this.items.splice(index, 1);
  }

  public confirm(): void {
    if (this.items.length === 0) {
      throw new DomainException('订单不能为空');
    }
    this.status = 'confirmed';
    this.addDomainEvent(new OrderConfirmedEvent(this.id));
  }
}

// 子实体 - OrderItem
class OrderItem {
  private id: string;
  private productId: string;
  private productName: string;
  private unitPrice: Money;
  private quantity: number;

  constructor(props: OrderItemProps) {
    this.id = props.id;
    this.productId = props.productId;
    this.productName = props.productName;
    this.unitPrice = new Money(props.unitPrice, 'CNY');
    this.quantity = props.quantity;
  }

  public increaseQuantity(amount: number): void {
    if (amount <= 0) {
      throw new DomainException('数量必须大于0');
    }
    this.quantity += amount;
  }

  public get subtotal(): Money {
    return this.unitPrice.multiply(this.quantity);
  }
}
```

### 3.3 仓储层 (Repository)

仓储不是数据库表的 DAO (Data Access Object)。仓储的视角是”领域集合”。

```typescript
// Repository vs DAO
// ┌─────────────────────────────────────────────────────────────────┐
// │  DAO (Data Access Object)                                       │
// │  ─────────────────────────────────────────────────────────────── │
// │  • 视角：数据表                                                 │
// │  • 方法：insertRow, updateRow, deleteRow                       │
// │  • 例子：                                                        │
// │    - insertUser(user: UserEntity)                              │
// │    - updateUserRow(id, data)                                   │
// └─────────────────────────────────────────────────────────────────┘
//
// ┌─────────────────────────────────────────────────────────────────┐
// │  Repository                                                      │
// │  ─────────────────────────────────────────────────────────────── │
// │  • 视角：领域集合                                               │
// │  • 方法：findById, save(AggregateRoot), delete                │
// │  • 负责在底层把聚合根拆解为 SQL/文档并保存                      │
// │  • 例子：                                                        │
// │    - findById(id: string): Promise<User>                       │
// │    - save(user: User): Promise<void>                           │
// │    - delete(id: string): Promise<void>                         │
// └─────────────────────────────────────────────────────────────────┘

// Repository 接口（领域层）
interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}

// Repository 实现（基础设施层）
class TypeOrmUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private ormRepo: Repository<UserEntity>
  ) {}

  async findById(id: string): Promise<User | null> {
    const entity = await this.ormRepo.findOne({ where: { id } });
    if (!entity) return null;
    return this.toDomain(entity);  // ORM实体 → 领域实体
  }

  async save(user: User): Promise<void> {
    const entity = this.toOrmEntity(user);  // 领域实体 → ORM实体
    await this.ormRepo.save(entity);

    // 发布领域事件
    const events = user.pullDomainEvents();
    await this.eventBus.publish(events);
  }

  // 实体转换
  private toDomain(entity: UserEntity): User {
    return User.reconstitute({
      id: entity.id,
      username: entity.username,
      email: entity.email,
      points: entity.points,
      status: entity.status
    });
  }

  private toOrmEntity(user: User): UserEntity {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      points: user.points,
      status: user.status
    };
  }
}
```

---

## 四、CQRS (命令查询职责分离)

### 4.1 什么是 CQRS？

```
┌─────────────────────────────────────────────────────────────────┐
│                    CQRS 架构                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Command（命令）                    Query（查询）                │
│  ────────────────────               ──────────                  │
│  • 修改系统状态                    • 只读取数据                   │
│  • 不返回数据（或返回ID）         • 返回 DTO                    │
│  • 走完整领域模型                 • 完全绕过领域模型            │
│  • 保证业务规则正确               • 追求极致读取性能            │
│                                                                  │
│  ┌──────────────────┐           ┌──────────────────┐           │
│  │   命令端         │           │   查询端         │           │
│  │                  │           │                  │           │
│  │ OrderCommand     │           │ OrderQuery       │           │
│  │ Controller       │           │ Controller       │           │
│  │        ↓        │           │        ↓        │           │
│  │ OrderService     │           │ 直接 SQL/ORM     │           │
│  │ (领域逻辑)       │           │ 联表查询         │           │
│  │        ↓        │           │        ↓        │           │
│  │ OrderRepository │           │ OrderDTO         │           │
│  │        ↓        │           │ (直接返回)       │           │
│  │ PostgreSQL      │           │ PostgreSQL       │           │
│  │ (写入模型)       │  同步     │ (读取模型)       │           │
│  └──────────────────┘    ↓     └──────────────────┘           │
│                            ↓                                   │
│                     ┌──────────────────┐                       │
│                     │   事件总线        │                       │
│                     │  Event Bus       │                       │
│                     └────────┬─────────┘                       │
│                              ↓                                  │
│                     ┌──────────────────┐                       │
│                     │   读取模型        │                       │
│                     │ (Read Model)     │                       │
│                     │                  │                       │
│                     │ MongoDB/ES       │                       │
│                     │ (优化查询)        │                       │
│                     └──────────────────┘                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 NestJS 中的 CQRS 实现

```typescript
// 1. 定义命令
class CreateOrderCommand {
  constructor(
    public readonly customerId: string,
    public readonly items: { productId: string; quantity: number }[],
    public readonly shippingAddress: AddressDto
  ) {}
}

// 2. 定义查询
class GetOrderQuery {
  constructor(public readonly orderId: string) {}
}

// 3. 命令处理器
@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly eventBus: EventBus
  ) {}

  async execute(command: CreateOrderCommand): Promise<string> {
    // 创建聚合根
    const order = Order.create({
      customerId: command.customerId,
      shippingAddress: command.shippingAddress
    });

    // 添加商品
    for (const item of command.items) {
      const product = await this.productRepository.findById(item.productId);
      order.addItem(product, item.quantity);
    }

    // 确认订单
    order.confirm();

    // 保存
    await this.orderRepository.save(order);

    // 发布事件
    const events = order.pullDomainEvents();
    await this.eventBus.publish(events);

    return order.id;
  }
}

// 4. 查询处理器（直接读取）
@QueryHandler(GetOrderQuery)
export class GetOrderHandler implements IQueryHandler<GetOrderQuery, OrderDto> {
  constructor(
    @InjectRepository(OrderViewEntity)
    private orderViewRepo: Repository<OrderViewEntity>
  ) {}

  async execute(query: GetOrderQuery): Promise<OrderDto> {
    // 直接从读取模型查询，不经过领域逻辑
    const view = await this.orderViewRepo.findOne({
      where: { id: query.orderId },
      relations: ['items', 'customer']
    });

    if (!view) {
      throw new NotFoundException('订单不存在');
    }

    return {
      id: view.id,
      status: view.status,
      total: view.totalAmount,
      items: view.items.map(item => ({
        productName: item.productName,
        quantity: item.quantity,
        price: item.price
      })),
      customer: {
        name: view.customer.name,
        email: view.customer.email
      }
    };
  }
}
```

---

## 五、事件溯源 (Event Sourcing)

### 5.1 事件溯源原理

```
┌─────────────────────────────────────────────────────────────────┐
│                    事件溯源 vs 状态存储                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  传统方式（状态存储）                                           │
│  ────────────────────                                           │
│                                                                  │
│  当前状态：{ balance: 1000 }                                   │
│                                                                  │
│  问题：没有历史，无法审计                                        │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 事件溯源方式                                             │   │
│  │                                                          │   │
│  │ 事件序列：                                               │   │
│  │ 1. AccountCreated { id: “A1”, owner: “张三” }         │   │
│  │ 2. Deposited { amount: 500, balance: 500 }              │   │
│  │ 3. Withdrawn { amount: 200, balance: 300 }              │   │
│  │ 4. Deposited { amount: 700, balance: 1000 }            │   │
│  │                                                          │   │
│  │ 当前余额 = 重放所有事件 = 1000                           │   │
│  │                                                          │   │
│  │ 优势：                                                   │   │
│  │ • 完整审计日志                                          │   │
│  │ • 可以回溯到任意时间点                                   │   │
│  │ • 可以重新构建过去状态                                   │   │
│  │ • 可以预测未来状态                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 NestJS 事件溯源实现

```typescript
// 定义事件
@AggregateRoot()
class BankAccount {
  private id: string;
  private balance: number = 0;
  private events: DomainEvent[] = [];

  create(id: string, owner: string): void {
    this.apply(new AccountCreatedEvent(id, owner));
  }

  deposit(amount: number): void {
    if (amount <= 0) {
      throw new DomainException('存款金额必须大于0');
    }
    this.apply(new DepositedEvent(this.id, amount));
  }

  withdraw(amount: number): void {
    if (amount <= 0) {
      throw new DomainException('取款金额必须大于0');
    }
    if (this.balance < amount) {
      throw new DomainException('余额不足');
    }
    this.apply(new WithdrawnEvent(this.id, amount));
  }

  // 应用事件（修改状态）
  private apply(event: DomainEvent): void {
    this.events.push(event);
    this.when(event);
  }

  private when(event: DomainEvent): void {
    switch (event.type) {
      case 'AccountCreated':
        this.id = event.id;
        this.balance = 0;
        break;
      case 'Deposited':
        this.balance += event.amount;
        break;
      case 'Withdrawn':
        this.balance -= event.amount;
        break;
    }
  }

  public pullEvents(): DomainEvent[] {
    const events = [...this.events];
    this.events = [];
    return events;
  }
}

// 事件存储
class EventStore {
  async save(accountId: string, events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.eventRepository.save({
        accountId,
        eventType: event.type,
        payload: JSON.stringify(event),
        timestamp: new Date()
      });
    }
  }

  async getEvents(accountId: string): Promise<DomainEvent[]> {
    const records = await this.eventRepository.find({
      where: { accountId },
      order: { timestamp: 'ASC' }
    });
    return records.map(r => JSON.parse(r.payload));
  }

  async rebuildAggregate(accountId: string): Promise<BankAccount> {
    const events = await this.getEvents(accountId);
    const account = new BankAccount();

    for (const event of events) {
      account.when(event);
    }

    return account;
  }
}
```

---

## 六、DDD 在 NestJS 中的落地实践

### 6.1 模块结构

```
src/
├── modules/
│   ├── orders/
│   │   ├── commands/           # 命令
│   │   │   ├── create-order/
│   │   │   └── cancel-order/
│   │   ├── queries/            # 查询
│   │   │   ├── get-order/
│   │   │   └── list-orders/
│   │   ├── domain/             # 领域层
│   │   │   ├── entities/
│   │   │   │   └── order.entity.ts
│   │   │   ├── value-objects/
│   │   │   │   ├── address.vo.ts
│   │   │   │   └── money.vo.ts
│   │   │   ├── events/
│   │   │   │   └── order.events.ts
│   │   │   └── services/
│   │   │       └── order.domain.service.ts
│   │   ├── application/        # 应用层
│   │   │   ├── handlers/
│   │   │   └── dto/
│   │   ├── infrastructure/     # 基础设施层
│   │   │   ├── repositories/
│   │   │   └── persistence/
│   │   ├── orders.controller.ts
│   │   └── orders.module.ts
```

### 6.2 完整示例

```typescript
// domain/entities/order.entity.ts
export class Order extends AggregateRoot {
  // ... 充血模型实现
}

// application/handlers/create-order.handler.ts
@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly eventBus: EventBus
  ) {}

  async execute(command: CreateOrderCommand): Promise<string> {
    const order = Order.create({
      customerId: command.customerId,
      shippingAddress: command.shippingAddress
    });

    for (const item of command.items) {
      const product = await this.productService.getProduct(item.productId);
      order.addItem(product, item.quantity);
    }

    order.confirm();
    await this.orderRepository.save(order);

    const events = order.pullDomainEvents();
    await this.eventBus.publish(events);

    return order.id;
  }
}

// orders.module.ts
@Module({
  imports: [
    CqrsModule  // 启用 CQRS
  ],
  controllers: [OrdersController],
  providers: [
    // 领域
    Order,
    OrderRepository,
    // 应用
    CreateOrderHandler,
    GetOrderHandler,
    // 基础设施
    TypeOrmOrderRepository
  ]
})
export class OrdersModule {}
```

---

*本文档持续更新，最后更新于 2026 年 3 月*