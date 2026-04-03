# 整洁架构与SOLID原则

## 前言：什么是整洁架构？

想象你要建造一座房子。你不会把厨房的下水道管道埋在客厅的吊顶上，也不会把卧室的电线接到厨房的电路里。每样东西都有它应该待的位置，建筑师会规划好管道、电线、结构各自怎么布置。整洁架构（Clean Architecture）就是软件的"建筑规划图"，它告诉我们代码的每一部分应该放在哪里，以及它们之间应该怎么连接。

整洁架构的概念最早由Robert C. Martin（也就是"Uncle Bob"）提出，它的核心思想是让软件系统像洋葱一样，一层包裹着一层，内层不知道外层的存在，越往外层越容易变化。

---

## 一、整洁架构的核心思想

### 1.1 分层架构

整洁架构将系统分为几个同心圆层：

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    Frameworks & Drivers                    │   │
│   │         (框架和驱动程序层：Web框架、数据库、UI)            │   │
│   └─────────────────────────────────────────────────────────┘   │
│                               │                                   │
│                               ▼                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │               Interface Adapters                          │   │
│   │              (接口适配器层：控制器、网关、 presenters)       │   │
│   └─────────────────────────────────────────────────────────┘   │
│                               │                                   │
│                               ▼                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                   Application Rules                      │   │
│   │                  (应用规则层：用例、命令处理器)             │   │
│   └─────────────────────────────────────────────────────────┘   │
│                               │                                   │
│                               ▼                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                      Enterprise Business                 │   │
│   │               (企业业务规则层：实体、值对象)              │   │
│   └─────────────────────────────────────────────────────────┘   │
│                               │                                   │
│                               ▼                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    Entities (核心)                       │   │
│   │                  (最内层：核心业务实体)                   │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**层级说明**：
1. **Entities（实体层）**：最核心的层，包含企业级业务规则，不依赖任何其他层
2. **Enterprise Business（企业业务层）**：应用特定的业务规则
3. **Application Rules（应用规则层）**：用例和命令处理器
4. **Interface Adapters（接口适配器层）**：控制器、网关、数据转换
5. **Frameworks & Drivers（框架层）**：数据库、Web框架、外部服务

### 1.2 依赖规则

整洁架构的核心规则：**依赖只能指向内层**。

- 内层不知道外层的存在
- 外层依赖内层，内层与外层解耦
- 这是保证系统稳定性和可测试性的关键

```typescript
/**
 * 依赖规则示例
 *
 * 层级从内到外：
 * 1. Entities（核心）
 * 2. Use Cases（应用规则）
 * 3. Controllers（接口适配器）
 * 4. Database（框架层）
 */

// ❌ 违反依赖规则：内层依赖外层
class BadUserRepository {
  // 这个"仓储"使用了SQL，这是框架层的实现
  // 如果换了数据库，需要修改这层代码
  private db = new MySQLDatabase(); // 错误：内层依赖外层

  findUser(id: string): User {
    return this.db.query(`SELECT * FROM users WHERE id = ${id}`);
  }
}

// ✅ 符合依赖规则：依赖接口而非实现
interface UserRepository {
  findUser(id: string): User | null;
  save(user: User): void;
}

// 外层实现（在基础设施层）
class MySQLUserRepository implements UserRepository {
  private db = new MySQLDatabase();

  findUser(id: string): User | null {
    // 实现...
    return null;
  }

  save(user: User): void {
    // 实现...
  }
}

// 内层只依赖接口
class UserService {
  // 内层（Use Cases）只依赖接口，不关心具体实现
  constructor(private userRepository: UserRepository) {}

  getUser(id: string): User | null {
    return this.userRepository.findUser(id);
  }
}
```

---

## 二、SOLID原则详解

### 2.1 单一职责原则（SRP）

**定义**：一个类应该只有一个引起它变化的原因。

**核心思想**：让每个类只做一件事，并且把它做好。

**生活类比**：就像一个分工明确的厨房。切菜的就切菜，炒菜的就炒菜，摆盘的就摆盘。如果让一个人做所有事，那个人会累死，而且效率很低。

```typescript
/**
 * 单一职责原则示例
 */

// ❌ 违反SRP：一个类做了太多事
class UserManager {
  constructor() {}

  // 用户管理职责
  createUser(user: any): void {
    this.validateEmail(user.email);
    this.saveToDatabase(user);
    this.sendWelcomeEmail(user.email);
  }

  // 数据验证职责
  validateEmail(email: string): boolean {
    return email.includes('@');
  }

  // 数据库操作职责
  saveToDatabase(user: any): void {
    console.log('保存到数据库');
  }

  // 邮件发送职责
  sendWelcomeEmail(email: string): void {
    console.log('发送欢迎邮件');
  }

  // 报表生成职责
  generateReport(): string {
    return '报表数据';
  }

  // 日志记录职责
  log(message: string): void {
    console.log(`[LOG] ${message}`);
  }
}

// ✅ 符合SRP：每个类只做一件事
// 1. 用户验证器
class UserValidator {
  validateEmail(email: string): boolean {
    return email.includes('@');
  }

  validatePassword(password: string): boolean {
    return password.length >= 6;
  }
}

// 2. 用户仓储
class UserRepository {
  save(user: User): void {
    console.log('保存用户到数据库');
  }

  findById(id: string): User | null {
    return null;
  }
}

// 3. 邮件服务
class EmailService {
  sendWelcomeEmail(email: string): void {
    console.log(`发送欢迎邮件到 ${email}`);
  }
}

// 4. 日志记录器
class Logger {
  log(message: string): void {
    console.log(`[LOG] ${message}`);
  }
}

// 5. 报表生成器
class ReportGenerator {
  generateUserReport(users: User[]): string {
    return `用户报表，共 ${users.length} 个用户`;
  }
}

// 6. 用户服务（组合以上组件）
class UserService {
  constructor(
    private validator: UserValidator,
    private repository: UserRepository,
    private emailService: EmailService,
    private logger: Logger
  ) {}

  createUser(user: User): void {
    // 验证
    if (!this.validator.validateEmail(user.email)) {
      throw new Error('无效的邮箱');
    }

    // 保存
    this.repository.save(user);

    // 发送邮件
    this.emailService.sendWelcomeEmail(user.email);

    // 记录日志
    this.logger.log(`创建用户: ${user.email}`);
  }
}
```

### 2.2 开闭原则（OCP）

**定义**：软件实体应该对扩展开放，对修改关闭。

**核心思想**：允许添加新功能，但不要修改已有的代码。

**生活类比**：就像一个好的电源插座。你不需要改变插座本身（封闭），只需要买一个转换头插上去（扩展），就能适配各种电器。

```typescript
/**
 * 开闭原则示例
 */

// ❌ 违反OCP：每次添加新功能都要修改原有代码
class DiscountCalculator {
  calculateDiscount(order: Order): number {
    if (order.type === 'VIP') {
      return order.amount * 0.2; // 8折
    } else if (order.type === 'NORMAL') {
      return order.amount * 0.1; // 9折
    } else if (order.type === 'NEWBIE') {
      return order.amount * 0.15; // 85折
    }
    // 如果要添加新的会员类型，需要修改这个方法
    return 0;
  }
}

// ✅ 符合OCP：使用策略模式，对扩展开放，对修改关闭
interface DiscountStrategy {
  calculate(order: Order): number;
}

// VIP折扣策略
class VIPDiscount implements DiscountStrategy {
  calculate(order: Order): number {
    return order.amount * 0.2;
  }
}

// 普通会员折扣策略
class NormalDiscount implements DiscountStrategy {
  calculate(order: Order): number {
    return order.amount * 0.1;
  }
}

// 新用户折扣策略
class NewbieDiscount implements DiscountStrategy {
  calculate(order: Order): number {
    return order.amount * 0.15;
  }
}

// 折扣计算器（对扩展开放）
class DiscountCalculatorOCP {
  constructor(private strategies: Map<string, DiscountStrategy>) {}

  // 添加新策略不需要修改原有代码
  addStrategy(type: string, strategy: DiscountStrategy): void {
    this.strategies.set(type, strategy);
  }

  calculate(order: Order): number {
    const strategy = this.strategies.get(order.type);
    if (!strategy) {
      return 0;
    }
    return strategy.calculate(order);
  }
}

// 使用示例
const calculator = new DiscountCalculatorOCP(new Map([
  ['VIP', new VIPDiscount()],
  ['NORMAL', new NormalDiscount()],
  ['NEWBIE', new NewbieDiscount()]
]));

// 添加新折扣类型不需要修改原有类
calculator.addStrategy('SUPER_VIP', new VIPDiscount()); // 添加超级VIP折扣
```

### 2.3 里氏替换原则（LSP）

**定义**：子类必须能够替换其基类。

**核心思想**：子类是父类的"一种"，使用时应该能无缝替换父类。

**生活类比**：就像乐高零件。一个标注为"2x4砖块"的零件，无论它是什么颜色，都应该能插到任何需要2x4砖块的地方。子类也应该这样——无论具体是什么子类，用起来都应该像父类一样。

```typescript
/**
 * 里氏替换原则示例
 */

// ❌ 违反LSP：子类改变了父类的行为契约
class Rectangle {
  constructor(protected width: number, protected height: number) {}

  setWidth(width: number): void {
    this.width = width;
  }

  setHeight(height: number): void {
    this.height = height;
  }

  getArea(): number {
    return this.width * this.height;
  }
}

// 正方形继承了长方形，但行为不同
class Square extends Rectangle {
  constructor(size: number) {
    super(size, size);
  }

  // 重写时改变了行为契约
  setWidth(width: number): void {
    // 正方形的宽高应该相等
    this.width = width;
    this.height = width; // 这改变了行为
  }

  setHeight(height: number): void {
    this.height = height;
    this.width = height; // 这改变了行为
  }
}

// 函数期望长方形的行为，但正方形不符合
function calculateRectangleArea(rect: Rectangle): number {
  rect.setWidth(5);
  rect.setHeight(4);
  // 期望面积是20，但正方形会返回16
  return rect.getArea();
}

// ✅ 符合LSP：使用更抽象的设计
interface Shape {
  getArea(): number;
}

class RectangleLSP implements Shape {
  constructor(private width: number, private height: number) {}

  getArea(): number {
    return this.width * this.height;
  }
}

class SquareLSP implements Shape {
  constructor(private size: number) {}

  getArea(): number {
    return this.size * this.size;
  }
}

function calculateShapeArea(shape: Shape): number {
  // 任何Shape都能正确工作
  return shape.getArea();
}
```

### 2.4 依赖倒置原则（DIP）

**定义**：
1. 高层模块不应该依赖低层模块，两者都应该依赖抽象
2. 抽象不应该依赖细节，细节应该依赖抽象

**核心思想**：依赖抽象接口，而不是具体实现。

**生活类比**：就像手机的充电口。你不需要关心插座是什么牌子的，只需要一个符合标准的USB-C接口。代码也是一样，应该依赖"接口"这个标准，而不是具体实现。

```typescript
/**
 * 依赖倒置原则示例
 */

// ❌ 违反DIP：高层依赖低层
class OrderService {
  // 直接依赖具体实现
  private mysqlRepo = new MySQLOrderRepository();
  private emailSender = new SMTPEmailSender();

  createOrder(order: Order): void {
    // 保存订单
    this.mysqlRepo.save(order);
    // 发送邮件
    this.emailSender.send(order.customerEmail, '订单已创建');
  }
}

// ✅ 符合DIP：依赖抽象
interface IOrderRepository {
  save(order: Order): void;
  findById(id: string): Order | null;
}

interface IEmailSender {
  send(to: string, subject: string): void;
}

// 高层模块只依赖接口
class OrderServiceDIP {
  // 通过构造函数注入依赖
  constructor(
    private orderRepository: IOrderRepository,
    private emailSender: IEmailSender
  ) {}

  createOrder(order: Order): void {
    // 保存订单
    this.orderRepository.save(order);
    // 发送邮件
    this.emailSender.send(order.customerEmail, '订单已创建');
  }
}

// 低层实现
class MySQLOrderRepository implements IOrderRepository {
  save(order: Order): void {
    console.log('MySQL: 保存订单');
  }

  findById(id: string): Order | null {
    console.log('MySQL: 查询订单');
    return null;
  }
}

class SMTPEmailSender implements IEmailSender {
  send(to: string, subject: string): void {
    console.log(`SMTP: 发送邮件到 ${to}`);
  }
}

// 可以轻松替换实现，不修改高层代码
class MockEmailSender implements IEmailSender {
  send(to: string, subject: string): void {
    console.log(`[MOCK] 发送邮件到 ${to}: ${subject}`);
  }
}
```

### 2.5 接口隔离原则（ISP）

**定义**：不应该强迫客户依赖它不使用的方法。

**核心思想**：接口应该小而专注，不要一个"大而全"的接口。

**生活类比**：就像买手机。如果手机厂商把所有功能（打电话、发短信、上网、拍照、支付）都做成一个"超级手机"，但你只想要打电话和发短信，那你被迫为不需要的功能买单。接口也是一样，应该按需定制。

```typescript
/**
 * 接口隔离原则示例
 */

// ❌ 违反ISP：一个臃肿接口
interface Worker {
  work(): void;
  eat(): void;
  sleep(): void;
  attendMeeting(): void;
  codeReview(): void;
  writeDocument(): void;
  conductInterview(): void;
}

class Developer implements Worker {
  work(): void { console.log('开发中'); }
  eat(): void { console.log('吃饭'); }
  sleep(): void { console.log('睡觉'); }
  attendMeeting(): void { console.log('参加会议'); }
  codeReview(): void { console.log('代码审查'); }
  writeDocument(): void { console.log('写文档'); }
  conductInterview(): void { /* 开发者不面试，但必须实现 */ }
}

// ✅ 符合ISP：拆分为小接口
interface Workable {
  work(): void;
}

interface Eatable {
  eat(): void;
}

interface Sleepable {
  sleep(): void;
}

interface Meetingable {
  attendMeeting(): void;
}

interface CodeReviewable {
  codeReview(): void;
}

interface Interviewer {
  conductInterview(): void;
}

// 开发者只需要实现需要的接口
class DeveloperISP implements Workable, Eatable, Sleepable, Meetingable, CodeReviewable {
  work(): void { console.log('开发中'); }
  eat(): void { console.log('吃饭'); }
  sleep(): void { console.log('睡觉'); }
  attendMeeting(): void { console.log('参加会议'); }
  codeReview(): void { console.log('代码审查'); }
}

// 面试官实现不同的接口组合
class HRInterviewer implements Interviewer {
  conductInterview(): void { console.log('面试候选人'); }
}

// 组合多个小接口
interface TeamMember extends Workable, Eatable, Sleepable, Meetingable {}

class TeamMemberISP implements TeamMember {
  work(): void { console.log('工作中'); }
  eat(): void { console.log('吃饭'); }
  sleep(): void { console.log('睡觉'); }
  attendMeeting(): void { console.log('参加会议'); }
}
```

---

## 三、整洁架构实战

### 3.1 完整示例：用户注册系统

```typescript
/**
 * 整洁架构示例：用户注册系统
 *
 * 层级结构：
 * 1. Domain Layer（领域层）：实体、值对象、接口
 * 2. Application Layer（应用层）：用例
 * 3. Infrastructure Layer（基础设施层）：具体实现
 * 4. Presentation Layer（展示层）：控制器
 */

/**
 * ============================================================
 * 第一层：Domain Layer（领域层 - 最核心）
 * 这一层不依赖任何其他层
 * ============================================================
 */

// ========== 实体 ==========

/**
 * 用户实体
 * 这是系统的核心，包含基本的业务规则
 */
class User {
  // 用户ID
  private readonly id: string;

  // 用户名
  private name: string;

  // 邮箱
  private email: string;

  // 密码哈希
  private passwordHash: string;

  // 创建时间
  private readonly createdAt: Date;

  // 构造函数是创建用户的地方
  constructor(
    id: string,
    name: string,
    email: string,
    passwordHash: string
  ) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.passwordHash = passwordHash;
    this.createdAt = new Date();

    // 业务不变式：创建时验证
    this.validate();
  }

  // 业务不变式验证
  private validate(): void {
    if (!this.email.includes('@')) {
      throw new Error('无效的邮箱格式');
    }
    if (this.name.length < 2) {
      throw new Error('用户名至少2个字符');
    }
  }

  // 获取ID（只读）
  getId(): string {
    return this.id;
  }

  // 获取公开信息
  getProfile(): UserProfile {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      createdAt: this.createdAt
    };
  }

  // 更新用户名
  updateName(newName: string): void {
    if (newName.length < 2) {
      throw new Error('用户名至少2个字符');
    }
    this.name = newName;
  }
}

// 用户公开信息（避免暴露内部数据）
interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// ========== 值对象 ==========

/**
 * 邮箱值对象
 */
class Email {
  private constructor(private readonly value: string) {
    if (!value.includes('@')) {
      throw new Error('无效的邮箱格式');
    }
  }

  static create(value: string): Email {
    return new Email(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}

/**
 * 密码值对象
 */
class Password {
  private constructor(private readonly hash: string) {}

  static create(plainText: string): Password {
    // 简化的密码哈希
    const hash = btoa(plainText); // 实际应用中应使用bcrypt等
    return new Password(hash);
  }

  verify(plainText: string): boolean {
    return this.hash === btoa(plainText);
  }
}

// ========== 领域接口（端口） ==========

/**
 * 用户仓储接口
 * 定义了领域层需要的存储能力
 */
interface IUserRepository {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  exists(email: string): Promise<boolean>;
}

/**
 * 邮件服务接口
 */
interface IEmailService {
  send(to: string, subject: string, body: string): Promise<void>;
}

/**
 * 事件发布接口
 */
interface IDomainEventPublisher {
  publish(event: DomainEvent): void;
}

// 领域事件
abstract class DomainEvent {
  abstract readonly eventType: string;
  readonly occurredAt = new Date();
}

class UserRegisteredEvent extends DomainEvent {
  eventType = 'UserRegistered';

  constructor(public readonly userId: string, public readonly email: string) {
    super();
  }
}

// ========== 用例接口 ==========

/**
 * 用例接口
 * 每个用例代表一个业务操作
 */
interface IUseCase<I, O> {
  execute(input: I): Promise<O>;
}

/**
 * ============================================================
 * 第二层：Application Layer（应用层）
 * 这一层组合领域对象实现业务用例
 * ============================================================
 */

// ========== 用例实现 ==========

/**
 * 注册用户用例
 */
class RegisterUserUseCase implements IUseCase<RegisterUserInput, RegisterUserOutput> {
  constructor(
    private userRepository: IUserRepository,
    private emailService: IEmailService,
    private eventPublisher: IDomainEventPublisher
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    console.log(`[用例] 注册用户: ${input.email}`);

    // 1. 检查邮箱是否已被使用
    const emailExists = await this.userRepository.exists(input.email);
    if (emailExists) {
      throw new Error('邮箱已被注册');
    }

    // 2. 创建用户
    const userId = 'USR-' + Date.now();
    const password = Password.create(input.password);
    const user = new User(userId, input.name, input.email, password.getValue());

    // 3. 保存用户
    await this.userRepository.save(user);

    // 4. 发送欢迎邮件
    await this.emailService.send(
      input.email,
      '欢迎注册',
      `您好 ${input.name}，欢迎注册我们的平台！`
    );

    // 5. 发布领域事件
    this.eventPublisher.publish(new UserRegisteredEvent(userId, input.email));

    // 6. 返回结果
    return {
      success: true,
      userId,
      message: '注册成功'
    };
  }
}

// 输入输出DTO
interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

interface RegisterUserOutput {
  success: boolean;
  userId: string;
  message: string;
}

/**
 * 获取用户用例
 */
class GetUserUseCase implements IUseCase<string, UserProfile | null> {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string): Promise<UserProfile | null> {
    console.log(`[用例] 获取用户: ${userId}`);

    const user = await this.userRepository.findById(userId);
    if (!user) {
      return null;
    }

    return user.getProfile();
  }
}

/**
 * ============================================================
 * 第三层：Infrastructure Layer（基础设施层）
 * 实现领域层定义的接口
 * ============================================================
 */

// ========== 用户仓储实现 ==========

class InMemoryUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();

  async save(user: User): Promise<void> {
    console.log(`[仓储] 保存用户到内存: ${user.getId()}`);
    this.users.set(user.getId(), user);
  }

  async findById(id: string): Promise<User | null> {
    console.log(`[仓储] 查询用户: ${id}`);
    return this.users.get(id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    console.log(`[仓储] 按邮箱查询: ${email}`);
    for (const user of this.users.values()) {
      if (user.getProfile().email === email) {
        return user;
      }
    }
    return null;
  }

  async exists(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    return user !== null;
  }
}

// ========== 邮件服务实现 ==========

class ConsoleEmailService implements IEmailService {
  async send(to: string, subject: string, body: string): Promise<void> {
    console.log(`[邮件服务] 发送邮件`);
    console.log(`  收件人: ${to}`);
    console.log(`  主题: ${subject}`);
    console.log(`  内容: ${body}`);
  }
}

// ========== 事件发布器实现 ==========

class ConsoleEventPublisher implements IDomainEventPublisher {
  publish(event: DomainEvent): void {
    console.log(`[事件发布] 类型: ${event.eventType}, 时间: ${event.occurredAt}`);
  }
}

/**
 * ============================================================
 * 第四层：Presentation Layer（展示层）
 * 处理HTTP请求等外部交互
 * ============================================================
 */

class UserController {
  constructor(
    private registerUseCase: RegisterUserUseCase,
    private getUserUseCase: GetUserUseCase
  ) {}

  /**
   * 处理注册请求
   */
  async handleRegister(request: RegisterUserInput): Promise<RegisterUserOutput> {
    console.log('\n[控制器] 收到注册请求');
    console.log(`  姓名: ${request.name}`);
    console.log(`  邮箱: ${request.email}`);

    const result = await this.registerUseCase.execute(request);

    console.log('[控制器] 注册完成');
    return result;
  }

  /**
   * 处理获取用户请求
   */
  async handleGetUser(userId: string): Promise<UserProfile | null> {
    console.log(`\n[控制器] 收到获取用户请求: ${userId}`);
    return this.getUserUseCase.execute(userId);
  }
}

/**
 * ============================================================
 * 依赖注入容器
 * ============================================================
 */

class DIContainer {
  // 仓储
  private userRepository = new InMemoryUserRepository();

  // 服务
  private emailService = new ConsoleEmailService();
  private eventPublisher = new ConsoleEventPublisher();

  // 用例
  private registerUseCase = new RegisterUserUseCase(
    this.userRepository,
    this.emailService,
    this.eventPublisher
  );

  private getUserUseCase = new GetUserUseCase(this.userRepository);

  // 控制器
  getUserController(): UserController {
    return new UserController(
      this.registerUseCase,
      this.getUserUseCase
    );
  }
}

/**
 * ============================================================
 * 测试整洁架构
 * ============================================================
 */

async function testCleanArchitecture() {
  console.log('=== 整洁架构测试：用户注册系统 ===\n');

  // 创建依赖容器
  const container = new DIContainer();

  // 获取控制器
  const controller = container.getUserController();

  // 1. 注册新用户
  console.log('>>> 注册新用户 <<<');
  const registerResult = await controller.handleRegister({
    name: '张三',
    email: 'zhangsan@example.com',
    password: 'password123'
  });

  console.log(`注册结果: ${registerResult.message}`);
  console.log(`用户ID: ${registerResult.userId}`);

  // 2. 尝试用相同邮箱注册（应该失败）
  console.log('\n>>> 尝试重复注册 <<<');
  try {
    await controller.handleRegister({
      name: '李四',
      email: 'zhangsan@example.com',
      password: 'password456'
    });
  } catch (error: any) {
    console.log(`注册失败: ${error.message}`);
  }

  // 3. 获取用户信息
  console.log('\n>>> 获取用户信息 <<<');
  const userProfile = await controller.handleGetUser(registerResult.userId);
  if (userProfile) {
    console.log(`用户ID: ${userProfile.id}`);
    console.log(`用户名: ${userProfile.name}`);
    console.log(`邮箱: ${userProfile.email}`);
  }
}

testCleanArchitecture();
```

### 3.2 架构分层详解

```
┌─────────────────────────────────────────────────────────────────┐
│                        展示层 (Presentation)                      │
│  职责：处理外部请求（HTTP/WebSocket/CLI）                          │
│  依赖：应用层                                                      │
├─────────────────────────────────────────────────────────────────┤
│                        应用层 (Application)                       │
│  职责：编排用例，处理输入输出                                      │
│  依赖：领域层（接口）                                              │
├─────────────────────────────────────────────────────────────────┤
│                        领域层 (Domain)                            │
│  职责：核心业务逻辑、实体、值对象、领域服务、接口定义               │
│  依赖：无（最核心）                                                │
├─────────────────────────────────────────────────────────────────┤
│                     基础设施层 (Infrastructure)                    │
│  职责：实现领域层接口、数据库、文件系统、外部服务                    │
│  依赖：领域层（接口）                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 四、依赖注入（Dependency Injection）

### 4.1 什么是依赖注入？

依赖注入是一种实现依赖倒置的技术，通过"注入"的方式将依赖传递给对象，而不是在对象内部创建依赖。

**生活类比**：就像给汽车加油。你不需要自己造汽油，加油站把汽油注入到你的油箱里。代码中的依赖注入也是一样——通过"注入"的方式把依赖交给对象使用。

```typescript
/**
 * 依赖注入示例
 */

// ❌ 没有使用DI：对象自己创建依赖
class BadUserService {
  private emailService = new SMTPEmailService(); // 硬编码依赖

  sendEmail(to: string): void {
    this.emailService.send(to);
  }
}

// ✅ 使用DI：通过构造函数注入依赖
class GoodUserService {
  // 依赖通过构造函数注入
  constructor(private emailService: IEmailService) {}

  sendEmail(to: string): void {
    this.emailService.send(to);
  }
}

// ✅ 使用DI：通过属性注入
class PropertyInjectionService {
  // 依赖通过属性注入
  @Inject()
  emailService!: IEmailService;

  sendEmail(to: string): void {
    this.emailService.send(to);
  }
}

// ✅ 使用DI：通过方法注入
class MethodInjectionService {
  private emailService: IEmailService;

  // 依赖通过方法注入
  setEmailService(emailService: IEmailService): void {
    this.emailService = emailService;
  }

  sendEmail(to: string): void {
    this.emailService.send(to);
  }
}
```

### 4.2 DI容器

DI容器负责创建对象并自动注入依赖：

```typescript
/**
 * 简单的DI容器
 */

class DIContainerSimple {
  // 注册的依赖
  private services: Map<string, any> = new Map();

  // 注册服务
  register<T>(token: string, instance: T): void {
    this.services.set(token, instance);
  }

  // 获取服务
  get<T>(token: string): T {
    return this.services.get(token);
  }
}

// 使用
const container = new DIContainerSimple();
container.register('IEmailService', new SMTPEmailService());
container.register('IUserRepository', new MySQLUserRepository());

const emailService = container.get<IEmailService>('IEmailService');
```

---

## 五、实战：重构混乱代码

### 5.1 混乱的原始代码

```typescript
/**
 * 混乱的代码示例：一个订单处理系统，所有代码混在一起
 */

class BadOrderSystem {
  private db: any;
  private email: any;
  private sms: any;
  private logger: any;

  constructor() {
    // 直接创建依赖，违反依赖倒置
    this.db = new MySQLDatabase();
    this.email = new SMTPEmail();
    this.sms = new TencentSMS();
    this.logger = new FileLogger();
  }

  createOrder(data: any): any {
    // 业务逻辑、数据验证、数据库操作、发送通知全混在一起
    if (!data.customerId) throw new Error('需要客户ID');
    if (!data.items || data.items.length === 0) throw new Error('需要订单项');

    // 计算总价
    let total = 0;
    for (const item of data.items) {
      total += item.price * item.quantity;
    }

    // 保存订单
    const order = {
      id: 'ORD-' + Date.now(),
      customerId: data.customerId,
      items: data.items,
      total,
      status: 'created'
    };

    this.db.query('INSERT INTO orders VALUES (...)', order);
    this.logger.log(`创建订单: ${order.id}`);

    // 发送邮件
    this.email.send(data.customerEmail, '订单创建成功');

    // 发送短信
    this.sms.send(data.customerPhone, '订单创建成功');

    return order;
  }
}
```

### 5.2 整洁架构重构

```typescript
/**
 * 重构为整洁架构
 */

// ============================================================
// 领域层
// ============================================================

/**
 * 订单实体
 */
class OrderEntity {
  private readonly id: string;
  private customerId: string;
  private items: OrderItemEntity[];
  private status: string;
  private total: number;
  private createdAt: Date;

  constructor(id: string, customerId: string) {
    this.id = id;
    this.customerId = customerId;
    this.items = [];
    this.status = 'created';
    this.total = 0;
    this.createdAt = new Date();
  }

  getId(): string { return this.id; }
  getStatus(): string { return this.status; }
  getTotal(): number { return this.total; }

  addItem(productId: string, price: number, quantity: number): void {
    if (this.status !== 'created') {
      throw new Error('只能向创建状态的订单添加商品');
    }
    this.items.push({ productId, price, quantity });
    this.recalculateTotal();
  }

  private recalculateTotal(): void {
    this.total = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  pay(): void {
    if (this.status !== 'created') {
      throw new Error('订单状态不正确');
    }
    if (this.items.length === 0) {
      throw new Error('订单不能为空');
    }
    this.status = 'paid';
  }
}

interface OrderItemEntity {
  productId: string;
  price: number;
  quantity: number;
}

// 领域接口
interface IOrderRepository {
  save(order: OrderEntity): Promise<void>;
  findById(id: string): Promise<OrderEntity | null>;
}

interface INotificationService {
  notifyCustomer(customerId: string, message: string): Promise<void>;
}

interface ILogger {
  log(message: string): void;
}

// ============================================================
// 应用层
// ============================================================

interface CreateOrderInput {
  customerId: string;
  customerEmail: string;
  customerPhone: string;
  items: { productId: string; price: number; quantity: number }[];
}

interface CreateOrderOutput {
  success: boolean;
  orderId: string;
  total: number;
}

class CreateOrderUseCase {
  constructor(
    private orderRepository: IOrderRepository,
    private notificationService: INotificationService,
    private logger: ILogger
  ) {}

  async execute(input: CreateOrderInput): Promise<CreateOrderOutput> {
    // 创建订单
    const orderId = 'ORD-' + Date.now();
    const order = new OrderEntity(orderId, input.customerId);

    // 添加订单项
    for (const item of input.items) {
      order.addItem(item.productId, item.price, item.quantity);
    }

    // 保存订单
    await this.orderRepository.save(order);
    this.logger.log(`订单已创建: ${orderId}`);

    // 发送通知
    await this.notificationService.notifyCustomer(
      input.customerId,
      `订单创建成功，总金额 ${order.getTotal()}`
    );

    return {
      success: true,
      orderId,
      total: order.getTotal()
    };
  }
}

// ============================================================
// 基础设施层
// ============================================================

class InMemoryOrderRepository implements IOrderRepository {
  private orders: Map<string, OrderEntity> = new Map();

  async save(order: OrderEntity): Promise<void> {
    this.orders.set(order.getId(), order);
  }

  async findById(id: string): Promise<OrderEntity | null> {
    return this.orders.get(id) || null;
  }
}

class CompositeNotificationService implements INotificationService {
  constructor(
    private emailService: IEmailService,
    private smsService: ISMSService
  ) {}

  async notifyCustomer(customerId: string, message: string): Promise<void> {
    await Promise.all([
      this.emailService.sendEmail(customerId, message),
      this.smsService.sendSMS(customerId, message)
    ]);
  }
}

interface IEmailService {
  sendEmail(customerId: string, message: string): Promise<void>;
}

interface ISMSService {
  sendSMS(customerId: string, message: string): Promise<void>;
}

class ConsoleLogger implements ILogger {
  log(message: string): void {
    console.log(`[LOG] ${message}`);
  }
}

// ============================================================
// 展示层
// ============================================================

class OrderController {
  constructor(private createOrderUseCase: CreateOrderUseCase) {}

  async handleCreateOrder(input: CreateOrderInput): Promise<CreateOrderOutput> {
    return this.createOrderUseCase.execute(input);
  }
}
```

### 5.3 重构对比

| 维度 | 重构前 | 重构后 |
|------|--------|--------|
| **分层清晰度** | 混乱 | 清晰分层 |
| **依赖关系** | 硬编码 | 依赖注入 |
| **可测试性** | 困难 | 容易 |
| **可扩展性** | 差 | 好 |
| **业务逻辑** | 散落各处 | 集中在领域层 |
| **职责划分** | 不清 | 明确 |

---

## 六、常见架构模式对比

### 6.1 分层架构 vs 整洁架构

| 维度 | 分层架构 | 整洁架构 |
|------|----------|----------|
| **层级数量** | 3-4层 | 4+层 |
| **依赖方向** | 只能向下 | 只能向内 |
| **核心稳定性** | 中 | 高 |
| **适用场景** | 一般业务系统 | 复杂业务系统 |

### 6.2 选择建议

```
简单项目 → 分层架构
    ↓
中型项目 → 分层架构 + SOLID
    ↓
复杂项目 → 整洁架构 + DDD
    ↓
超复杂项目 → 整洁架构 + DDD + CQRS + 事件溯源
```

---

## 七、整洁架构实践建议

### 7.1 项目结构

```
src/
├── domain/                    # 领域层（核心）
│   ├── entities/             # 实体
│   ├── valueObjects/         # 值对象
│   ├── services/             # 领域服务
│   ├── events/               # 领域事件
│   └── interfaces/           # 端口接口
│
├── application/              # 应用层
│   ├── useCases/            # 用例
│   ├── dto/                  # 数据传输对象
│   └── services/             # 应用服务
│
├── infrastructure/           # 基础设施层
│   ├── repositories/         # 仓储实现
│   ├── services/             # 外部服务实现
│   └── config/               # 配置
│
├── presentation/             # 展示层
│   ├── controllers/          # 控制器
│   ├── routes/               # 路由
│   └── middleware/           # 中间件
│
└── di/                       # 依赖注入
    └── container.ts
```

### 7.2 实践检查清单

**代码组织**：
- [ ] 领域层不依赖任何其他层
- [ ] 依赖只指向内层
- [ ] 每个类有单一职责
- [ ] 接口小而专注

**SOLID原则**：
- [ ] 单一职责：类只有一个变化原因
- [ ] 开闭原则：对扩展开放，对修改关闭
- [ ] 里氏替换：子类可以替换父类
- [ ] 依赖倒置：依赖抽象接口
- [ ] 接口隔离：接口小而专注

**测试**：
- [ ] 领域层有单元测试
- [ ] 用例有集成测试
- [ ] 控制器有端到端测试

---

## 八、总结

### 8.1 整洁架构核心要点

1. **分层清晰**：从内到外，依赖只能指向内层
2. **核心稳定**：领域层是最稳定的，不依赖任何外层
3. **接口隔离**：依赖抽象接口，而不是具体实现
4. **依赖注入**：通过注入解耦依赖

### 8.2 SOLID原则速记

| 原则 | 一句话描述 |
|------|-----------|
| **S**ingle Responsibility | 一次只做一件事 |
| **O**pen/Closed | 对扩展开放，对修改关闭 |
| **L**iskov Substitution | 子类可以替换父类 |
| **I**nterface Segregation | 接口要小而专注 |
| **D**ependency Inversion | 依赖抽象，不依赖实现 |

### 8.3 架构决策指南

**选择分层架构**：当项目规模较小、业务逻辑不复杂时

**选择整洁架构**：当项目规模中等或较大、需要长期维护时

**结合DDD**：当业务领域复杂、有多个业务领域需要划分时

**结合CQRS**：当读写分离需求明显、查询复杂度高时

---

**注意**：整洁架构不是银弹，它为项目带来了额外的复杂性。应该根据项目的实际情况选择合适的架构。对于小项目，简单分层架构可能更合适；对于大项目，整洁架构能够提供更好的可维护性和可扩展性。记住：架构是手段，不是目的——解决问题才是最终目标。
