# 领域驱动设计（DDD）实战完全指南

## 前言：什么是领域驱动设计？

想象你要建造一座城市。如果你只是随便盖房子，不考虑道路规划、商业区、住宅区的分布，那么这座城市很快就会变得混乱不堪。但如果你在建造之前先做好城市规划——哪里是商业区、哪里是住宅区、河流怎么流、道路怎么开——这座城市就会井然有序。

软件开发也是一样。如果我们不思考"业务是什么"、"业务逻辑怎么组织"，只是简单地CRUD（增删改查），那么当业务变得复杂时，代码就会变得混乱。领域驱动设计（Domain-Driven Design，简称DDD）就是一种"城市规划"的方法论，它帮助我们把业务概念和业务规则清晰地组织到代码中。

DDD最初由Eric Evans在他的著作《Domain-Driven Design》中提出，被广泛应用于复杂业务系统的开发中。本文将带你深入理解DDD的核心概念和实战技巧。

---

## 一、DDD核心概念

### 1.1 战略设计与战术设计

DDD分为两个层面：

**战略设计（Strategic Design）**：从宏观角度思考业务，划分限界上下文、建立上下文映射。

**战术设计（Tactical Design）**：从微观角度实现，用代码表达领域模型，包含聚合、实体、值对象等模式。

**生活类比**：建造城市时，战略设计就像城市规划——决定商业区、住宅区、工业区的位置。战术设计就像建筑设计——具体的一砖一瓦怎么摆放。

```
┌─────────────────────────────────────────────────────────────────┐
│                        战略设计                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  电商上下文  │  │  支付上下文  │  │  物流上下文  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
├─────────────────────────────────────────────────────────────────┤
│                        战术设计                                   │
│  实体 | 值对象 | 聚合 | 领域服务 | 仓储 | 工厂                    │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 核心概念总览

| 概念 | 说明 | 核心作用 |
|------|------|----------|
| **限界上下文** | 业务边界，一个独立的业务范围 | 划分系统边界 |
| **聚合** | 相关对象的集合，有一个聚合根 | 保证业务一致性 |
| **实体** | 有唯一标识的对象 | 表达业务主体 |
| **值对象** | 无标识、不可变的对象 | 表达业务概念 |
| **领域服务** | 不属于任何实体的领域逻辑 | 封装跨实体逻辑 |
| **领域事件** | 领域中发生的业务事件 | 解耦和事件溯源 |
| **仓储** | 存储和检索聚合 | 管理聚合生命周期 |
| **工厂** | 创建复杂对象或聚合 | 封装创建逻辑 |

---

## 二、限界上下文（Bounded Context）

### 2.1 什么是限界上下文？

限界上下文是一个业务边界，在这个边界内，某个领域术语、概念和规则有明确的含义。换句话说，一个限界上下文是一个"说同一种语言"的区域。

**生活类比**：在公司里，"产品"这个词在不同部门含义不同。在销售部，"产品"是商品；在研发部，"产品"是功能特性；在财务部，"产品"是成本中心。限界上下文就是让每个部门有自己的"产品"定义，不至于混淆。

### 2.2 如何识别限界上下文

**识别方法**：
1. 业务职责是否独立
2. 是否有不同的概念定义
3. 是否可以独立部署
4. 是否有不同的团队负责

```typescript
/**
 * 电商系统的限界上下文识别
 */

// 上下文1：商品上下文
// 负责：商品信息管理、库存管理、商品搜索
// 核心概念：商品(Product)、库存(Stock)、SKU

// 上下文2：订单上下文
// 负责：订单管理、订单履约、订单取消
// 核心概念：订单(Order)、订单项(OrderItem)、优惠券(Coupon)

// 上下文3：支付上下文
// 负责：支付处理、退款处理、账务管理
// 核心概念：支付(Payment)、退款(Refund)、账户(Account)

// 上下文4：用户上下文
// 负责：用户注册、用户认证、会员管理
// 核心概念：用户(User)、角色(Role)、权限(Permission)

// 上下文5：物流上下文
// 负责：物流调度、物流跟踪、配送管理
// 核心概念：运单(Waybill)、配送员(Deliverer)、配送站(Station)
```

### 2.3 上下文映射

限界上下文之间需要建立映射关系：

```
┌─────────────┐       ┌─────────────┐
│  商品上下文  │──────▶│  订单上下文  │
│             │  共享  │             │
│ ProductInfo │  概念  │ Order       │
└─────────────┘       └─────────────┘
       │                     │
       │ 上游                 │ 下游
       ▼                     ▼
┌─────────────┐       ┌─────────────┐
│  库存上下文  │       │  物流上下文  │
│             │       │             │
│ Stock       │       │ Waybill    │
└─────────────┘       └─────────────┘
```

**上下文映射类型**：
1. **共享内核（Shared Kernel）**：两个上下文共享部分模型
2. **客户-供应商（Customer-Supplier）**：上下游关系
3. **防腐层（Anti-Corruption Layer）**：隔离不同上下文
4. **开放主机服务（Open Host Service）**：提供API
5. **发布语言（Published Language）**：通过事件通信

---

## 三、实体（Entity）

### 3.1 什么是实体？

实体是有唯一标识的对象，它的生命周期内标识保持不变。即使属性不同，只要标识相同，就是同一个对象。

**生活类比**：人的身份证号码。即使你改了名字、换了发型，你还是同一个人，因为身份证号码没变。在DDD中，实体就像人，标识（身份证号）不变，但属性可以变。

```typescript
/**
 * 实体示例：用户实体
 */

class User {
  // 实体必须有唯一标识
  private readonly id: string;

  // 属性可以变化
  private name: string;
  private email: string;
  private avatar: string;
  private lastLoginAt: Date | null;

  // 构造函数
  constructor(
    id: string,
    name: string,
    email: string
  ) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.avatar = 'default-avatar.png';
    this.lastLoginAt = null;
  }

  // 获取标识（只读）
  getId(): string {
    return this.id;
  }

  // 更新个人信息
  updateProfile(name: string, email: string): void {
    this.name = name;
    this.email = email;
  }

  // 更新头像
  updateAvatar(avatar: string): void {
    this.avatar = avatar;
  }

  // 记录登录
  recordLogin(): void {
    this.lastLoginAt = new Date();
  }

  // 判断是否首次登录
  isFirstLogin(): boolean {
    return this.lastLoginAt === null;
  }

  // 实体相等的判断标准是标识
  equals(other: User): boolean {
    if (!other) return false;
    return this.id === other.getId();
  }
}

// 使用示例
const user1 = new User('U001', '张三', 'zhangsan@example.com');
const user2 = new User('U001', '李四', 'lisi@example.com');

// 同一个标识，即使名字不同，也是同一个用户
console.log(user1.equals(user2)); // true

// 修改user1的名字
user1.updateProfile('张三丰', 'zhangsanfeng@example.com');
console.log(user1.getId()); // 'U001'，标识不变
```

### 3.2 实体的设计原则

1. **标识不可变**：实体的ID在整个生命周期内不变
2. **属性可变**：实体的状态可以变化
3. **方法封装**：通过方法修改状态，而不是直接暴露属性
4. **防御性复制**：返回数据时使用防御性复制

```typescript
/**
 * 实体设计示例：订单实体
 */

class Order {
  // 私有属性，通过方法访问
  private readonly id: string;
  private status: OrderStatus;
  private items: OrderItem[];
  private readonly createdAt: Date;
  private updatedAt: Date;
  private paidAt: Date | null;

  constructor(id: string) {
    this.id = id;
    this.status = OrderStatus.CREATED;
    this.items = [];
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.paidAt = null;
  }

  // 只读属性通过getter访问
  getId(): string { return this.id; }
  getStatus(): OrderStatus { return this.status; }
  getCreatedAt(): Date { return new Date(this.createdAt); } // 防御性复制
  getItems(): OrderItem[] { return [...this.items]; } // 返回副本

  /**
   * 订单的业务方法（业务行为）
   */

  // 添加订单项
  addItem(productId: string, productName: string, price: number, quantity: number): void {
    // 业务规则验证
    if (this.status !== OrderStatus.CREATED) {
      throw new Error('只能向创建状态的订单添加商品');
    }

    if (quantity <= 0) {
      throw new Error('数量必须大于0');
    }

    this.items.push({
      productId,
      productName,
      price,
      quantity
    });

    this.touch();
  }

  // 支付订单
  pay(paymentId: string): void {
    // 业务规则验证
    if (this.status !== OrderStatus.CREATED) {
      throw new Error('订单状态不正确，无法支付');
    }

    if (this.items.length === 0) {
      throw new Error('订单不能为空');
    }

    // 更新状态
    this.status = OrderStatus.PAID;
    this.paidAt = new Date();
    this.touch();
  }

  // 取消订单
  cancel(reason: string): void {
    // 业务规则验证
    if (this.status === OrderStatus.SHIPPED || this.status === OrderStatus.COMPLETED) {
      throw new Error('已发货或已完成的订单不能取消');
    }

    // 状态转换
    if (this.status === OrderStatus.PAID) {
      this.status = OrderStatus.REFUNDING;
    } else {
      this.status = OrderStatus.CANCELLED;
    }

    this.touch();
  }

  // 计算订单总价
  calculateTotal(): number {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  // 更新时间戳
  private touch(): void {
    this.updatedAt = new Date();
  }
}

// 订单项
interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

// 订单状态枚举
enum OrderStatus {
  CREATED = 'created',
  PAID = 'paid',
  SHIPPED = 'shipped',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDING = 'refunding'
}
```

---

## 四、值对象（Value Object）

### 4.1 什么是值对象？

值对象是没有唯一标识的对象，它由其属性值定义，相等性基于属性值而不是标识。

**生活类比**：人民币100元。不管这100元是哪张纸币，只要值是100元，它们就是等价的。但如果你有一张特定的纸币（序列号），那它就是实体而不是值对象了。

```typescript
/**
 * 值对象示例：金额、地址
 */

/**
 * 金额值对象
 * 没有唯一标识，相等性基于数值
 */
class Money {
  // 值对象通常是 immutable（不可变）
  private constructor(
    private readonly amount: number,
    private readonly currency: string
  ) {}

  // 工厂方法创建
  static of(amount: number, currency: string = 'CNY'): Money {
    if (amount < 0) {
      throw new Error('金额不能为负');
    }
    return new Money(Math.round(amount * 100) / 100, currency);
  }

  // 相等性基于属性值
  equals(other: Money): boolean {
    if (!other) return false;
    return this.amount === other.amount && this.currency === other.currency;
  }

  // 加法
  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  // 减法
  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    const result = this.amount - other.amount;
    if (result < 0) {
      throw new Error('余额不足');
    }
    return new Money(result, this.currency);
  }

  // 乘法
  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  // 格式化显示
  format(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error('货币单位不一致');
    }
  }
}

// 地址值对象
class Address {
  constructor(
    private readonly province: string,
    private readonly city: string,
    private readonly district: string,
    private readonly street: string,
    private readonly zipCode: string
  ) {}

  // 相等性基于属性值
  equals(other: Address): boolean {
    if (!other) return false;
    return this.province === other.province &&
           this.city === other.city &&
           this.district === other.district &&
           this.street === other.street &&
           this.zipCode === other.zipCode;
  }

  // 获取完整地址
  getFullAddress(): string {
    return `${this.province}${this.city}${this.district}${this.street}`;
  }

  // 工厂方法
  static create(province: string, city: string, district: string, street: string, zipCode: string): Address {
    return new Address(province, city, district, street, zipCode);
  }
}

// 使用示例
function testValueObject() {
  // 金额值对象
  const price1 = Money.of(100, 'CNY');
  const price2 = Money.of(100, 'CNY');
  const price3 = Money.of(200, 'CNY');

  // 相等性比较
  console.log(price1.equals(price2)); // true
  console.log(price1.equals(price3)); // false

  // 运算
  const total = price1.add(price2);
  console.log(total.format()); // "CNY 200.00"

  // 地址值对象
  const addr1 = Address.create('北京', '北京市', '朝阳区', '某某路123号', '100000');
  const addr2 = Address.create('北京', '北京市', '朝阳区', '某某路123号', '100000');

  console.log(addr1.equals(addr2)); // true
  console.log(addr1.getFullAddress()); // "北京北京市朝阳区某某路123号"
}
```

### 4.2 值对象的特点

1. **无标识**：没有唯一ID
2. **不可变**：创建后不能修改
3. **可替换**：修改时创建新实例而不是修改原实例
4. **相等性基于值**：属性相同则相等
5. **可以组合**：可以包含其他值对象

```typescript
/**
 * 值对象组合：邮政编码包含城市信息
 */

class ZipCode {
  constructor(
    private readonly code: string
  ) {
    // 简单验证
    if (!/^\d{6}$/.test(code)) {
      throw new Error('无效的邮政编码');
    }
  }

  equals(other: ZipCode): boolean {
    return this.code === other.code;
  }

  // 获取省份代码
  getProvinceCode(): string {
    return this.code.substring(0, 2);
  }

  // 获取城市代码
  getCityCode(): string {
    return this.code.substring(0, 4);
  }
}

class AddressWithZipCode {
  constructor(
    private readonly province: string,
    private readonly city: string,
    private readonly district: string,
    private readonly street: string,
    private readonly zipCode: ZipCode
  ) {}

  equals(other: AddressWithZipCode): boolean {
    return this.province === other.province &&
           this.city === other.city &&
           this.district === other.district &&
           this.street === other.street &&
           this.zipCode.equals(other.zipCode);
  }
}
```

---

## 五、聚合（Aggregate）

### 5.1 什么是聚合？

聚合是一组相关对象的集合，作为数据修改的单元。每个聚合有一个聚合根（Aggregate Root），外部对象只能通过聚合根访问聚合内的其他对象。

**核心思想**：
- 聚合内部的修改是原子的
- 聚合边界定义了业务不变式的范围
- 外部只能通过聚合根访问内部对象

**生活类比**：一支足球队。球队是一个聚合，教练是聚合根。如果外部想要更换球员，必须通过教练（聚合根）来操作，而不能直接替换某个球员。球队的整体战术和人员配置由教练来维护。

### 5.2 聚合的设计原则

1. **聚合边界要小**：只包含必要的对象
2. **聚合根是唯一入口**：外部只能通过聚合根访问
3. **引用其他聚合时使用ID**：而不是直接引用对象
4. **聚合内保持业务不变式**：所有业务规则在聚合内验证

```typescript
/**
 * 聚合示例：订单和订单项
 */

class OrderAggregate {
  // 聚合根
  private readonly order: Order;
  // 聚合内的订单项（内部对象，不是聚合根）
  private items: OrderItem[] = [];

  constructor(orderId: string, customerId: string) {
    this.order = new Order(orderId, customerId);
  }

  // 获取聚合根
  getOrder(): Order {
    return this.order;
  }

  // 获取订单项（副本，防止外部修改）
  getItems(): OrderItem[] {
    return [...this.items];
  }

  /**
   * 聚合的方法：所有对聚合的修改都通过这个方法
   * 保证了业务不变式
   */
  addItem(productId: string, productName: string, price: number, quantity: number): void {
    // 业务规则在聚合根层面验证
    if (this.order.getStatus() !== OrderStatus.CREATED) {
      throw new Error('只能向创建状态的订单添加商品');
    }

    if (quantity <= 0) {
      throw new Error('数量必须大于0');
    }

    // 创建订单项
    const item = new OrderItem(productId, productName, price, quantity);
    this.items.push(item);
  }

  /**
   * 移除订单项
   */
  removeItem(productId: string): void {
    if (this.order.getStatus() !== OrderStatus.CREATED) {
      throw new Error('只能修改创建状态的订单');
    }

    const index = this.items.findIndex(item => item.productId === productId);
    if (index === -1) {
      throw new Error('订单项不存在');
    }

    this.items.splice(index, 1);
  }

  /**
   * 支付订单
   */
  pay(paymentId: string): void {
    // 验证业务规则
    if (this.order.getStatus() !== OrderStatus.CREATED) {
      throw new Error('订单状态不正确');
    }

    if (this.items.length === 0) {
      throw new Error('订单不能为空');
    }

    // 更新聚合根状态
    this.order.pay(paymentId);
  }

  /**
   * 取消订单
   */
  cancel(reason: string): void {
    // 只有创建状态或已支付状态可以取消
    const status = this.order.getStatus();
    if (status === OrderStatus.SHIPPED || status === OrderStatus.COMPLETED) {
      throw new Error('已发货或已完成的订单不能取消');
    }

    this.order.cancel(reason);
  }

  /**
   * 计算总价（聚合内计算）
   */
  calculateTotal(): number {
    return this.items.reduce((sum, item) => sum + item.getSubtotal(), 0);
  }
}

/**
 * 订单聚合根
 */
class Order {
  private readonly id: string;
  private readonly customerId: string;
  private status: OrderStatus;
  private paymentId: string | null;
  private readonly createdAt: Date;
  private updatedAt: Date;
  private paidAt: Date | null;

  constructor(id: string, customerId: string) {
    this.id = id;
    this.customerId = customerId;
    this.status = OrderStatus.CREATED;
    this.paymentId = null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.paidAt = null;
  }

  getId(): string { return this.id; }
  getCustomerId(): string { return this.customerId; }
  getStatus(): OrderStatus { return this.status; }

  pay(paymentId: string): void {
    this.status = OrderStatus.PAID;
    this.paymentId = paymentId;
    this.paidAt = new Date();
    this.updatedAt = new Date();
  }

  cancel(reason: string): void {
    this.status = this.status === OrderStatus.PAID
      ? OrderStatus.REFUNDING
      : OrderStatus.CANCELLED;
    this.updatedAt = new Date();
  }
}

/**
 * 订单项（内部对象，不是聚合根）
 */
class OrderItem {
  private readonly productId: string;
  private readonly productName: string;
  private readonly price: number;
  private readonly quantity: number;

  constructor(productId: string, productName: string, price: number, quantity: number) {
    this.productId = productId;
    this.productName = productName;
    this.price = price;
    this.quantity = quantity;
  }

  getSubtotal(): number {
    return this.price * this.quantity;
  }

  getProductId(): string { return this.productId; }
  getPrice(): number { return this.price; }
  getQuantity(): number { return this.quantity; }
}
```

### 5.3 聚合之间的引用

聚合之间应该通过ID引用，而不是直接引用对象：

```typescript
/**
 * 聚合间引用的正确方式
 */

// 订单聚合引用用户（通过ID）
class OrderAggregate {
  private readonly customerId: string; // 使用ID而不是User对象

  constructor(orderId: string, customerId: string) {
    this.customerId = customerId;
  }

  getCustomerId(): string {
    return this.customerId;
  }
}

// 如果需要获取关联对象，通过服务查找
class OrderService {
  constructor(
    private orderRepository: IOrderRepository,
    private userService: IUserService // 其他领域的服务
  ) {}

  async getOrderWithCustomer(orderId: string): Promise<{ order: Order; customer: User }> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('订单不存在');
    }

    // 通过ID查找用户
    const customer = await this.userService.findById(order.getCustomerId());

    return { order, customer };
  }
}
```

---

## 六、领域服务（Domain Service）

### 6.1 什么是领域服务？

领域服务用于封装不属于任何实体或值对象的领域逻辑。当某个操作不自然地属于任何一个实体时，就该使用领域服务。

**判断标准**：
- 这个操作涉及多个领域对象吗？
- 这个操作是实体的核心行为吗？
- 这个操作有副作用吗？

```typescript
/**
 * 领域服务示例：转账服务
 */

/**
 * 转账是一个跨两个账户的操作
 * 不属于Account实体，也不属于Money值对象
 * 因此需要用领域服务来表达
 */
class TransferService {
  /**
   * 转账操作
   * 这个方法封装了转账的业务逻辑
   */
  transfer(
    fromAccount: BankAccount,
    toAccount: BankAccount,
    amount: Money,
    transferId: string
  ): TransferResult {
    // 业务规则验证
    if (amount.getCurrency() !== fromAccount.getBalance().getCurrency()) {
      throw new Error('货币单位不一致');
    }

    if (amount.getCurrency() !== toAccount.getBalance().getCurrency()) {
      throw new Error('货币单位不一致');
    }

    // 检查余额
    if (fromAccount.getBalance().getAmount() < amount.getAmount()) {
      return {
        success: false,
        error: '余额不足'
      };
    }

    // 执行转账（原子操作）
    fromAccount.debit(amount);
    toAccount.credit(amount);

    // 记录转账
    const transfer = new Transfer(transferId, fromAccount.getId(), toAccount.getId(), amount);
    transfer.record();

    return {
      success: true,
      transfer
    };
  }
}

/**
 * 转账结果
 */
interface TransferResult {
  success: boolean;
  error?: string;
  transfer?: Transfer;
}

/**
 * 转账记录
 */
class Transfer {
  constructor(
    private readonly id: string,
    private readonly fromAccountId: string,
    private readonly toAccountId: string,
    private readonly amount: Money
  ) {}

  record(): void {
    console.log(`转账记录: ${this.id}`);
    console.log(`从: ${this.fromAccountId}`);
    console.log(`到: ${this.toAccountId}`);
    console.log(`金额: ${this.amount.format()}`);
  }
}

/**
 * 银行账户（实体）
 */
class BankAccount {
  private readonly id: string;
  private balance: Money;

  constructor(id: string, initialBalance: Money) {
    this.id = id;
    this.balance = initialBalance;
  }

  getId(): string { return this.id; }
  getBalance(): Money { return this.balance; }

  debit(amount: Money): void {
    if (this.balance.getAmount() < amount.getAmount()) {
      throw new Error('余额不足');
    }
    this.balance = this.balance.subtract(amount);
  }

  credit(amount: Money): void {
    this.balance = this.balance.add(amount);
  }
}
```

### 6.2 领域服务 vs 实体方法

| 特征 | 实体方法 | 领域服务 |
|------|----------|----------|
| **涉及对象** | 单个实体 | 多个实体或聚合 |
| **状态变化** | 实体自身状态 | 多个对象状态 |
| **调用方式** | 实体.method() | Service.method() |
| **典型场景** | order.pay() | transfer.transfer() |

```typescript
/**
 * 决策示例：应该用实体方法还是领域服务
 */

// 场景1：单个实体操作 -> 用实体方法
class User {
  changePassword(oldPassword: string, newPassword: string): void {
    // 只涉及User自身
    if (!this.verifyPassword(oldPassword)) {
      throw new Error('原密码错误');
    }
    this.passwordHash = this.hash(newPassword);
  }
}

// 场景2：跨多个聚合操作 -> 用领域服务
class UserService {
  // 用户注册涉及多个实体验证
  registerUser(command: RegisterUserCommand): UserAggregate {
    // 验证邮箱唯一
    if (this.userRepository.existsByEmail(command.email)) {
      throw new Error('邮箱已被注册');
    }

    // 验证用户名唯一
    if (this.userRepository.existsByUsername(command.username)) {
      throw new Error('用户名已被占用');
    }

    // 创建用户
    return UserAggregate.create(command);
  }
}
```

---

## 七、领域事件（Domain Event）

### 7.1 什么是领域事件？

领域事件是领域中发生的业务事件，用于解耦微服务、事件溯源和异步通信。

**核心思想**：
- 事件代表"已发生"的事实
- 事件发布后，订阅者可以做出响应
- 事件可以用于实现CQRS和EDA

**生活类比**：就像新闻发布。某地发生了一件大事（事件），各个媒体（订阅者）可以报道这个新闻。事件本身是"已发生"的，媒体根据事件做出反应。

```typescript
/**
 * 领域事件示例：订单事件
 */

/**
 * 领域事件基类
 */
abstract class DomainEvent {
  abstract readonly eventType: string;
  abstract readonly occurredAt: Date;

  constructor(
    protected readonly aggregateId: string
  ) {
    this.occurredAt = new Date();
  }
}

/**
 * 订单创建事件
 */
class OrderCreatedEvent extends DomainEvent {
  readonly eventType = 'OrderCreated';

  constructor(
    aggregateId: string,
    public readonly customerId: string,
    public readonly totalAmount: number,
    public readonly itemCount: number
  ) {
    super(aggregateId);
  }
}

/**
 * 订单支付事件
 */
class OrderPaidEvent extends DomainEvent {
  readonly eventType = 'OrderPaid';

  constructor(
    aggregateId: string,
    public readonly paymentId: string,
    public readonly paymentMethod: string
  ) {
    super(aggregateId);
  }
}

/**
 * 订单取消事件
 */
class OrderCancelledEvent extends DomainEvent {
  readonly eventType = 'OrderCancelled';

  constructor(
    aggregateId: string,
    public readonly reason: string,
    public readonly needRefund: boolean
  ) {
    super(aggregateId);
  }
}

/**
 * 事件发布器
 */
class EventPublisher {
  private handlers: Map<string, Array<(event: DomainEvent) => void>> = new Map();

  /**
   * 订阅事件
   */
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: (event: T) => void
  ): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler as any);
  }

  /**
   * 发布事件
   */
  publish(event: DomainEvent): void {
    console.log(`[Event] 发布事件: ${event.eventType}`);

    const eventHandlers = this.handlers.get(event.eventType);
    if (eventHandlers) {
      for (const handler of eventHandlers) {
        try {
          handler(event);
        } catch (error) {
          console.error(`事件处理错误: ${error}`);
        }
      }
    }
  }
}

// 全局事件发布器
const eventPublisher = new EventPublisher();

/**
 * 订单聚合（带事件发布）
 */
class OrderAggregateWithEvents {
  private order: Order;
  private publisher: EventPublisher;

  constructor(orderId: string, customerId: string, publisher: EventPublisher) {
    this.order = new Order(orderId, customerId);
    this.publisher = publisher;
  }

  /**
   * 创建订单并发布事件
   */
  static create(orderId: string, customerId: string): OrderAggregateWithEvents {
    const aggregate = new OrderAggregateWithEvents(
      orderId,
      customerId,
      eventPublisher
    );
    return aggregate;
  }

  addItem(productId: string, productName: string, price: number, quantity: number): void {
    if (this.order.getStatus() !== OrderStatus.CREATED) {
      throw new Error('订单状态不正确');
    }

    this.order.addItem(productId, productName, price, quantity);
  }

  /**
   * 支付并发布事件
   */
  pay(paymentId: string, paymentMethod: string): void {
    if (this.order.getStatus() !== OrderStatus.CREATED) {
      throw new Error('订单状态不正确');
    }

    if (this.order.getItems().length === 0) {
      throw new Error('订单不能为空');
    }

    // 更新状态
    this.order.pay(paymentId);

    // 发布支付事件
    const event = new OrderPaidEvent(
      this.order.getId(),
      paymentId,
      paymentMethod
    );
    this.publisher.publish(event);
  }

  /**
   * 取消并发布事件
   */
  cancel(reason: string): void {
    const needRefund = this.order.getStatus() === OrderStatus.PAID;

    this.order.cancel(reason);

    // 发布取消事件
    const event = new OrderCancelledEvent(
      this.order.getId(),
      reason,
      needRefund
    );
    this.publisher.publish(event);
  }

  getOrder(): Order {
    return this.order;
  }
}

/**
 * 事件处理器示例
 */
function setupEventHandlers() {
  // 库存服务订阅订单创建事件
  eventPublisher.subscribe('OrderCreated', (event: OrderCreatedEvent) => {
    console.log('[库存服务] 收到订单创建事件');
    console.log(`  预留商品，订单ID: ${event.aggregateId}`);
    console.log(`  商品数量: ${event.itemCount}`);
  });

  // 通知服务订阅订单支付事件
  eventPublisher.subscribe('OrderPaid', (event: OrderPaidEvent) => {
    console.log('[通知服务] 收到订单支付事件');
    console.log(`  订单ID: ${event.aggregateId}`);
    console.log(`  支付方式: ${event.paymentMethod}`);
  });

  // 财务服务订阅订单取消事件
  eventPublisher.subscribe('OrderCancelled', (event: OrderCancelledEvent) => {
    console.log('[财务服务] 收到订单取消事件');
    console.log(`  订单ID: ${event.aggregateId}`);
    console.log(`  取消原因: ${event.reason}`);
    if (event.needRefund) {
      console.log('  需要退款处理');
    }
  });
}

// 测试领域事件
function testDomainEvents() {
  console.log('=== 领域事件测试 ===\n');

  // 设置事件处理器
  setupEventHandlers();

  // 创建并使用订单
  const order = OrderAggregateWithEvents.create('ORD-001', 'CUST-001');

  order.addItem('P001', 'iPhone', 6999, 1);
  console.log('已添加商品');

  order.pay('PAY-001', 'credit_card');
  console.log('已支付');

  order.cancel('用户主动取消');
  console.log('已取消');
}
```

### 7.2 领域事件的设计原则

1. **事件代表过去**：命名用过去式
2. **包含相关数据**：事件应包含处理所需的数据
3. **不可变**：事件一旦发布就不应修改
4. **幂等性**：处理事件应该幂等

```typescript
/**
 * 好的领域事件设计示例
 */

// ❌ 不好：事件名用将来时
class OrderWillCreateEvent {
  readonly eventType = 'OrderWillCreate'; // 不好
}

// ✅ 好：事件名用过去时
class OrderCreatedEvent {
  readonly eventType = 'OrderCreated'; // 好
}

// ❌ 不好：事件数据不完整
class OrderPaidEvent {
  constructor(orderId: string) {} // 缺少支付相关信息
}

// ✅ 好：事件包含完整数据
class OrderPaidEvent {
  constructor(
    orderId: string,
    paymentId: string,
    paymentMethod: string,
    amount: number
  ) {}
}
```

---

## 八、仓储（Repository）

### 8.1 什么是仓储？

仓储是聚合的存储和检索机制。它抽象了数据访问的细节，让领域层不需要关心数据是怎么存储的。

**核心思想**：
- 仓储是面向聚合的
- 仓储只负责存储和检索
- 业务逻辑不在仓储中

**生活类比**：就像图书馆的借阅系统。你不需要知道书是放在哪个书架上，只需要通过系统（仓储）来借书和还书。仓储就是领域的"书架"。

```typescript
/**
 * 仓储示例
 */

/**
 * 仓储接口（定义在领域层）
 */
interface OrderRepository {
  // 保存聚合
  save(order: OrderAggregate): Promise<void>;

  // 通过ID查找聚合
  findById(orderId: string): Promise<OrderAggregate | null>;

  // 查找用户的订单
  findByCustomerId(customerId: string): Promise<OrderAggregate[]>;

  // 查找状态为某值的订单
  findByStatus(status: OrderStatus): Promise<OrderAggregate[]>;

  // 删除聚合
  delete(orderId: string): Promise<void>;
}

/**
 * 内存仓储实现（仅用于演示）
 */
class InMemoryOrderRepository implements OrderRepository {
  private orders: Map<string, OrderAggregate> = new Map();

  async save(order: OrderAggregate): Promise<void> {
    console.log(`[Repository] 保存订单 ${order.getOrder().getId()}`);
    this.orders.set(order.getOrder().getId(), order);
  }

  async findById(orderId: string): Promise<OrderAggregate | null> {
    console.log(`[Repository] 查找订单 ${orderId}`);
    return this.orders.get(orderId) || null;
  }

  async findByCustomerId(customerId: string): Promise<OrderAggregate[]> {
    console.log(`[Repository] 查找客户 ${customerId} 的订单`);
    return Array.from(this.orders.values())
      .filter(order => order.getOrder().getCustomerId() === customerId);
  }

  async findByStatus(status: OrderStatus): Promise<OrderAggregate[]> {
    console.log(`[Repository] 查找状态为 ${status} 的订单`);
    return Array.from(this.orders.values())
      .filter(order => order.getOrder().getStatus() === status);
  }

  async delete(orderId: string): Promise<void> {
    console.log(`[Repository] 删除订单 ${orderId}`);
    this.orders.delete(orderId);
  }
}

/**
 * 仓储使用示例
 */
async function testRepository() {
  const repository = new InMemoryOrderRepository();

  // 创建订单
  const order = OrderAggregate.create('ORD-001', 'CUST-001');
  order.addItem('P001', 'iPhone', 6999, 1);

  // 保存
  await repository.save(order);

  // 查询
  const found = await repository.findById('ORD-001');
  if (found) {
    console.log(`找到订单: ${found.getOrder().getId()}`);
  }

  // 查询客户的订单
  const customerOrders = await repository.findByCustomerId('CUST-001');
  console.log(`客户有 ${customerOrders.length} 个订单`);

  // 查询某状态的订单
  const paidOrders = await repository.findByStatus(OrderStatus.PAID);
  console.log(`已支付订单: ${paidOrders.length} 个`);
}
```

### 8.2 仓储的设计原则

1. **面向聚合**：一个仓储对应一个聚合
2. **只返回聚合**：不要返回内部对象
3. **集合语义**：像操作集合一样操作仓储
4. **封装持久化**：领域层不需要知道存储细节

```typescript
/**
 * 仓储设计原则示例
 */

// ❌ 不好：仓储暴露了内部对象
interface BadRepository {
  // 返回内部对象，违反封装
  findItems(orderId: string): Promise<OrderItem[]>;
}

// ✅ 好：仓储只返回聚合
interface GoodRepository {
  // 返回聚合，外部通过聚合访问内部对象
  findById(orderId: string): Promise<OrderAggregate | null>;
}
```

---

## 九、CQRS在DDD中的应用

### 9.1 什么是CQRS？

CQRS（Command Query Responsibility Segregation，命令查询职责分离）是一种将读取和写入分离的模式。在DDD中，CQRS通常与聚合和事件配合使用。

### 9.2 CQRS + DDD实现

```typescript
/**
 * CQRS + DDD 示例
 */

/**
 * 命令侧（Write）
 */

// 命令：创建订单
interface CreateOrderCommand {
  customerId: string;
  items: { productId: string; quantity: number; price: number }[];
}

// 命令处理器
class OrderCommandHandler {
  constructor(
    private repository: OrderRepository,
    private eventPublisher: EventPublisher
  ) {}

  async handleCreateOrder(command: CreateOrderCommand): Promise<string> {
    // 创建聚合
    const orderId = 'ORD-' + Date.now();
    const order = new OrderAggregate(orderId, command.customerId);

    // 添加订单项
    for (const item of command.items) {
      order.addItem(item.productId, '', item.price, item.quantity);
    }

    // 保存
    await this.repository.save(order);

    // 发布事件
    this.eventPublisher.publish(new OrderCreatedEvent(
      orderId,
      command.customerId,
      order.calculateTotal(),
      command.items.length
    ));

    return orderId;
  }
}

/**
 * 查询侧（Read）
 */

// 查询模型（专门为读取优化的模型）
interface OrderSummaryDTO {
  orderId: string;
  customerId: string;
  status: string;
  itemCount: number;
  totalAmount: number;
}

interface OrderDetailDTO {
  orderId: string;
  customerId: string;
  status: string;
  items: {
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    subtotal: number;
  }[];
  totalAmount: number;
  createdAt: string;
  paidAt: string | null;
}

// 查询处理器
class OrderQueryHandler {
  constructor(private readDatabase: OrderReadDatabase) {}

  async getOrderSummary(orderId: string): Promise<OrderSummaryDTO | null> {
    return this.readDatabase.findOrderSummary(orderId);
  }

  async getOrderDetail(orderId: string): Promise<OrderDetailDTO | null> {
    return this.readDatabase.findOrderDetail(orderId);
  }

  async getCustomerOrders(customerId: string): Promise<OrderSummaryDTO[]> {
    return this.readDatabase.findCustomerOrders(customerId);
  }
}

/**
 * 读取数据库（专门为查询优化的存储）
 */
class OrderReadDatabase {
  private summaries: Map<string, OrderSummaryDTO> = new Map();
  private details: Map<string, OrderDetailDTO> = new Map();

  // 接收事件来更新读取模型
  onOrderCreated(event: OrderCreatedEvent): void {
    const summary: OrderSummaryDTO = {
      orderId: event.aggregateId,
      customerId: event.customerId,
      status: 'CREATED',
      itemCount: event.itemCount,
      totalAmount: event.totalAmount
    };
    this.summaries.set(event.aggregateId, summary);
  }

  onOrderPaid(event: OrderPaidEvent): void {
    const summary = this.summaries.get(event.aggregateId);
    if (summary) {
      summary.status = 'PAID';
    }
  }

  findOrderSummary(orderId: string): OrderSummaryDTO | null {
    return this.summaries.get(orderId) || null;
  }

  findOrderDetail(orderId: string): OrderDetailDTO | null {
    return this.details.get(orderId) || null;
  }

  findCustomerOrders(customerId: string): OrderSummaryDTO[] {
    return Array.from(this.summaries.values())
      .filter(o => o.customerId === customerId);
  }
}
```

---

## 十、CQRS + 事件溯源实战

### 10.1 什么是事件溯源？

事件溯源（Event Sourcing）是一种通过存储领域事件来记录状态变化的模式。系统的当前状态可以通过重放事件来重建。

```typescript
/**
 * 事件溯源示例
 */

/**
 * 事件存储
 */
class EventStore {
  private events: Map<string, DomainEvent[]> = new Map();

  /**
   * 追加事件
   */
  append(event: DomainEvent): void {
    if (!this.events.has(event.aggregateId)) {
      this.events.set(event.aggregateId, []);
    }
    this.events.get(event.aggregateId)!.push(event);
  }

  /**
   * 获取聚合的所有事件
   */
  getEvents(aggregateId: string): DomainEvent[] {
    return this.events.get(aggregateId) || [];
  }

  /**
   * 获取所有事件（用于投影）
   */
  getAllEvents(): DomainEvent[] {
    const all: DomainEvent[] = [];
    for (const events of this.events.values()) {
      all.push(...events);
    }
    return all;
  }
}

// 全局事件存储
const eventStore = new EventStore();

/**
 * 订单聚合（事件溯源版本）
 */
class OrderAggregateWithEventSourcing {
  private order: Order;
  private version: number = 0;

  constructor(orderId: string, customerId: string) {
    this.order = new Order(orderId, customerId);
  }

  /**
   * 从事件流重建聚合
   */
  static rebuild(events: DomainEvent[]): OrderAggregateWithEventSourcing {
    const firstEvent = events[0] as any;
    const aggregate = new OrderAggregateWithEventSourcing(
      firstEvent.aggregateId,
      ''
    );

    for (const event of events) {
      aggregate.replay(event);
    }

    return aggregate;
  }

  /**
   * 重放事件
   */
  private replay(event: DomainEvent): void {
    switch (event.eventType) {
      case 'OrderCreated':
        this.order = new Order((event as OrderCreatedEvent).aggregateId, (event as OrderCreatedEvent).customerId);
        break;
      case 'OrderItemAdded':
        this.order.addItem(
          (event as any).productId,
          (event as any).productName,
          (event as any).price,
          (event as any).quantity
        );
        break;
      case 'OrderPaid':
        this.order.pay((event as OrderPaidEvent).paymentId);
        break;
      case 'OrderCancelled':
        this.order.cancel((event as OrderCancelledEvent).reason);
        break;
    }
    this.version++;
  }

  /**
   * 添加订单项并发布事件
   */
  addItem(productId: string, productName: string, price: number, quantity: number): void {
    if (this.order.getStatus() !== OrderStatus.CREATED) {
      throw new Error('订单状态不正确');
    }

    this.order.addItem(productId, productName, price, quantity);

    // 创建并发布事件
    const event = new OrderItemAddedEvent(
      this.order.getId(),
      productId,
      productName,
      price,
      quantity
    );
    eventStore.append(event);
  }

  /**
   * 支付并发布事件
   */
  pay(paymentId: string, paymentMethod: string): void {
    if (this.order.getStatus() !== OrderStatus.CREATED) {
      throw new Error('订单状态不正确');
    }

    this.order.pay(paymentId);

    const event = new OrderPaidEvent(
      this.order.getId(),
      paymentId,
      paymentMethod
    );
    eventStore.append(event);
  }

  getOrder(): Order {
    return this.order;
  }

  getVersion(): number {
    return this.version;
  }
}

class OrderItemAddedEvent extends DomainEvent {
  readonly eventType = 'OrderItemAdded';

  constructor(
    aggregateId: string,
    public readonly productId: string,
    public readonly productName: string,
    public readonly price: number,
    public readonly quantity: number
  ) {
    super(aggregateId);
  }
}

/**
 * 事件溯源测试
 */
function testEventSourcing() {
  console.log('=== 事件溯源测试 ===\n');

  // 创建新订单
  const order = OrderAggregateWithEventSourcing.rebuild([]);

  // 添加商品
  order.addItem('P001', 'iPhone', 6999, 1);
  order.addItem('P002', 'AirPods', 999, 2);

  // 支付
  order.pay('PAY-001', 'credit_card');

  console.log('\n--- 从事件重建聚合 ---');

  // 获取事件
  const events = eventStore.getEvents('ORD-' + Date.now());
  console.log(`共有 ${events.length} 个事件`);

  // 重建聚合
  const rebuiltOrder = OrderAggregateWithEventSourcing.rebuild(events);
  console.log(`重建后订单状态: ${rebuiltOrder.getOrder().getStatus()}`);
}
```

---

## 十一、DDD实战流程

### 11.1 DDD开发步骤

```
1. 战略设计
   ├── 理解业务领域
   ├── 划分限界上下文
   └── 建立上下文映射

2. 战术设计
   ├── 确定实体和值对象
   ├── 设计聚合
   ├── 定义领域服务
   └── 设计领域事件

3. 实现
   ├── 实现聚合根
   ├── 实现仓储接口
   ├── 实现领域服务
   └── 编写单元测试

4. 集成
   ├── 实现基础设施层
   ├── 配置依赖注入
   └── 端到端测试
```

### 11.2 DDD项目结构

```
src/
├── domain/                    # 领域层（核心）
│   ├── aggregates/            # 聚合
│   │   └── Order/
│   │       ├── Order.ts
│   │       ├── OrderItem.ts
│   │       └── OrderStatus.ts
│   ├── entities/              # 实体
│   ├── valueObjects/          # 值对象
│   │   ├── Money.ts
│   │   └── Address.ts
│   ├── services/              # 领域服务
│   │   └── TransferService.ts
│   ├── events/                # 领域事件
│   │   ├── DomainEvent.ts
│   │   └── OrderEvents.ts
│   └── repositories/           # 仓储接口
│       └── IOrderRepository.ts
│
├── application/               # 应用层
│   ├── commands/             # 命令
│   │   └── CreateOrderCommand.ts
│   ├── queries/              # 查询
│   │   └── OrderQueryHandler.ts
│   └── services/              # 应用服务
│       └── OrderApplicationService.ts
│
├── infrastructure/            # 基础设施层
│   ├── persistence/          # 持久化
│   │   └── InMemoryOrderRepository.ts
│   ├── messaging/            # 消息
│   │   └── EventPublisher.ts
│   └── config/               # 配置
│
└── presentation/              # 展示层
    ├── controllers/
    └── dto/
```

---

## 十二、DDD常见问题与解决方案

### 12.1 聚合该多大？

**问题**：聚合边界如何确定？

**原则**：
- 聚合要小，只包含必要对象
- 聚合内保持业务不变式
- 聚合之间通过ID引用

### 12.2 贫血模型 vs 充血模型

**贫血模型**：实体只有getter/setter，业务逻辑在服务中

**充血模型**：实体包含业务逻辑，方法在实体上

**建议**：在DDD中推荐充血模型，让实体承担更多业务职责。

### 12.3 如何处理跨聚合的业务场景？

**方案**：
1. 使用领域服务封装跨聚合逻辑
2. 使用领域事件实现最终一致性
3. 使用saga处理分布式事务

```typescript
/**
 * 跨聚合业务处理示例：订单+支付
 */

// 订单聚合
class OrderAggregate {
  private order: Order;
  private paymentId: string | null;

  pay(paymentId: string): void {
    this.order.pay(paymentId);
    this.paymentId = paymentId;
  }

  getPaymentId(): string | null {
    return this.paymentId;
  }
}

// 支付服务（领域服务）
class PaymentDomainService {
  constructor(
    private orderRepository: OrderRepository,
    private paymentRepository: PaymentRepository,
    private eventPublisher: EventPublisher
  ) {}

  /**
   * 处理订单支付（跨聚合操作）
   */
  async processPayment(orderId: string, paymentMethod: string): Promise<void> {
    // 1. 获取订单
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('订单不存在');
    }

    // 2. 创建支付记录
    const paymentId = await this.paymentRepository.create({
      orderId,
      amount: order.calculateTotal(),
      method: paymentMethod
    });

    // 3. 更新订单状态
    order.pay(paymentId);
    await this.orderRepository.save(order);

    // 4. 发布事件
    this.eventPublisher.publish(new OrderPaidEvent(orderId, paymentId, paymentMethod));
  }
}
```

---

## 十三、总结

### 13.1 DDD核心要点

1. **限界上下文是边界**：划分业务边界，让团队独立工作
2. **聚合是一致性边界**：聚合内的修改是原子的
3. **实体有标识**：标识不变，属性可变
4. **值对象无标识**：基于属性值相等
5. **领域服务封装跨实体逻辑**
6. **领域事件解耦系统**

### 13.2 DDD适用场景

| 场景 | 是否适合DDD |
|------|------------|
| 简单CRUD应用 | 不需要 |
| 中等复杂度业务系统 | 可以考虑 |
| 复杂业务核心系统 | 强烈推荐 |
| 微服务架构 | 强烈推荐 |
| 需要高度可维护性 | 强烈推荐 |

### 13.3 DDD注意事项

1. **不要过度设计**：简单场景用简单方案
2. **团队需要DDD知识**：DDD需要团队理解和支持
3. **持续迭代**：DDD是一个渐进的过程
4. **结合实际**：根据业务特点调整实现方式

---

**注意**：DDD是一种思想，不是一成不变的教条。在实际应用中，需要根据业务特点、团队能力和项目约束来灵活调整。记住：DDD的目的是让代码更好地表达业务，而不是为了用DDD而用DDD。
