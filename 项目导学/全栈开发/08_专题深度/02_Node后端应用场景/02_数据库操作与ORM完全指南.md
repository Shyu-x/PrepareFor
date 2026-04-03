# 数据库操作与ORM完全指南

## 目录

1. [数据库基础概念](#1-数据库基础概念)
2. [为什么需要数据库](#2-为什么需要数据库)
3. [ORM是什么](#3-orm是什么)
4. [MongoDB基本操作](#4-mongodb基本操作)
5. [Mongoose使用详解](#5-mongoose使用详解)
6. [Prisma使用详解](#6-prisma使用详解)
7. [TypeORM使用详解](#7-typeorm使用详解)
8. [数据库设计原则](#8-数据库设计原则)
9. [索引与性能优化](#9-索引与性能优化)
10. [实战项目：电商订单系统](#10-实战项目电商订单系统)

---

## 1. 数据库基础概念

### 1.1 什么是数据库

数据库（Database）是按照数据结构来组织、存储和管理数据的仓库。简单来说，数据库就是电子化的文件柜，用来存储我们的各种数据。

**生活中的类比：**
- 没有数据库：一个杂乱的仓库，东西乱放，找东西要翻箱倒柜
- 有数据库：一个整理好的图书馆，每本书都有编号，分类清晰，找书非常方便

### 1.2 数据库的核心术语

```
┌─────────────────────────────────────────────────────────────┐
│                        数据库系统结构                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐                                            │
│   │  Database   │  数据库 - 最大的容器                        │
│   └─────────────┘                                            │
│         │                                                    │
│         ▼                                                    │
│   ┌─────────────┐                                            │
│   │ Collection  │  集合（MongoDB）/ Table（关系型）           │
│   │   或 Table  │  存放一类相关的文档/记录                    │
│   └─────────────┘                                            │
│         │                                                    │
│         ▼                                                    │
│   ┌─────────────┐                                            │
│   │  Document   │  文档（MongoDB）/ Row（关系型）             │
│   │    或 Row   │  一条具体的数据记录                         │
│   └─────────────┘                                            │
│         │                                                    │
│         ▼                                                    │
│   ┌─────────────┐                                            │
│   │   Field     │  字段（MongoDB）/ Column（关系型）         │
│   │   或 Column │  数据记录中的具体属性                       │
│   └─────────────┘                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 数据库的两大阵营

| 类型 | 代表数据库 | 数据存储方式 | 适用场景 |
|------|----------|-------------|----------|
| **关系型数据库** | MySQL、PostgreSQL、Oracle、SQL Server | 表（Table） | 结构化数据、需要事务支持 |
| **非关系型数据库** | MongoDB、Redis、Cassandra、DynamoDB | 文档、键值、列族、图 | 灵活结构、高并发、大数据 |

### 1.4 MongoDB vs 关系型数据库对比

```
关系型数据库（以MySQL为例）          MongoDB（文档数据库）

┌──────────────────────┐            ┌──────────────────────┐
│     users 表         │            │    users 集合         │
├──────────────────────┤            ├──────────────────────┤
│ id │ name │ email   │            │ {                    │
│ 1  │ 张三 │ a@ex.co │            │   "_id": 1,           │
│ 2  │ 李四 │ b@ex.co │            │   "name": "张三",     │
└──────────────────────┘            │   "email": "a@ex.co", │
                                    │   "age": 25           │
                                    │ }                    │
                                    └──────────────────────┘

关系型：固定结构，强类型              MongoDB：灵活结构，弱类型
需要预先定义表结构                   可以随时添加字段
通过SQL查询，通过JOIN关联            通过文档嵌套或引用关联
```

---

## 2. 为什么需要数据库

### 2.1 不用数据库会怎样

**原始方案：文件存储**

```javascript
// 使用文件存储用户数据
const fs = require('fs');

// 保存用户 - 问题多多！
function saveUser(user) {
    // 问题1：所有用户数据混在一个文件里
    // 问题2：读取时要解析整个文件
    // 问题3：并发写入会数据丢失
    // 问题4：无法高效查询特定用户
    const data = fs.readFileSync('users.json', 'utf8');
    const users = JSON.parse(data);
    users.push(user);
    fs.writeFileSync('users.json', JSON.stringify(users));
}
```

**文件存储的缺点：**
- **数据冗余**：相同数据重复存储，浪费空间
- **更新困难**：修改一条数据要重写整个文件
- **查询低效**：找数据只能遍历全部内容
- **并发问题**：多个请求同时写入会数据丢失
- **无法支持复杂查询**：例如"查询所有年龄大于20岁的用户"

### 2.2 数据库的优势

| 特性 | 文件存储 | 数据库 |
|------|---------|--------|
| **数据结构化** | 混乱的JSON/CSV | 规范的表/文档 |
| **查询能力** | 只能遍历搜索 | 索引快速定位 |
| **事务支持** | 无 | ACID保证 |
| **并发控制** | 无 | 行锁/表锁 |
| **数据完整性** | 难以保证 | 约束、级联 |
| **容量** | 小规模 | 海量数据 |
| **备份恢复** | 手动复制 | 内置工具 |

### 2.3 真实开发场景

**假设开发一个电商系统：**

```
不用数据库的困境：
├── 用户注册了100万个用户，怎么存储？
├── 用户下单、支付、发货、退款，怎么追踪？
├── 秒杀活动10万人同时抢购，怎么处理并发？
├── 查询"本月销量最高的商品"，怎么做？
└── 用户删除了账号，相关订单怎么处理？

用数据库的解决方案：
├── 用户数据 → users 表（索引加速查询）
├── 订单数据 → orders 表（事务保证一致性）
├── 商品数据 → products 表（库存原子操作）
├── 支付数据 → payments 表（外键关联）
└── 日志数据 → logs 表（分表分库）
```

---

## 3. ORM是什么

### 3.1 ORM的定义

ORM（Object-Relational Mapping，对象关系映射）是一种程序设计技术，用于实现面向对象编程语言中"对象"与"关系型数据库"之间的映射。

**一句话理解：** ORM就是让我们可以用操作对象的方式来操作数据库，不用写SQL语句。

### 3.2 ORM工作原理图解

```
┌─────────────────────────────────────────────────────────────────┐
│                     没有ORM vs 有ORM                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   传统方式（手写SQL）：                                          │
│   ┌─────────┐         ┌─────────┐         ┌─────────┐           │
│   │  JavaScript │ ──── │  SQL    │ ──── │ Database│           │
│   │   代码     │       │ 语句    │       │         │           │
│   └─────────┘         └─────────┘         └─────────┘           │
│        │                   │                                   │
│        ▼                   ▼                                   │
│   "SELECT * FROM      需要懂SQL语法                             │
│    users WHERE         拼接容易出错                             │
│    id = 1"            维护困难                                   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   使用ORM：                                                     │
│   ┌─────────┐         ┌─────────┐         ┌─────────┐           │
│   │  JavaScript │ ──── │  ORM    │ ──── │ Database│           │
│   │   代码     │       │ 框架    │       │         │           │
│   └─────────┘         └─────────┘         └─────────┘           │
│        │                   │                                   │
│        ▼                   ▼                                   │
│   User.find()          ORM自动生成SQL                           │
│   User.create()        用对象思维操作                           │
│   User.update()        代码即文档                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 为什么要用ORM

**手写SQL的问题：**

```sql
-- 复杂的SQL语句，难以维护
SELECT u.name, COUNT(o.id) as order_count, SUM(o.amount) as total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active' AND u.created_at > '2024-01-01'
GROUP BY u.id, u.name
HAVING COUNT(o.id) > 5
ORDER BY total_spent DESC
LIMIT 20;
```

**使用ORM后的代码：**

```typescript
// TypeScript - 使用Prisma
const users = await prisma.user.findMany({
    where: {
        status: 'active',
        createdAt: { gt: new Date('2024-01-01') }
    },
    include: {
        orders: true  // 自动JOIN
    },
    orderBy: {
        orders: {
            _count: 'desc'
        }
    },
    take: 20
});

// 代码即文档，类型安全，IDE自动补全
```

### 3.4 ORM的优势

| 优势 | 说明 |
|------|------|
| **代码简洁** | 不用写SQL，用对象方法操作数据 |
| **类型安全** | TypeScript类型检查，减少运行时错误 |
| **数据库无关** | 更换数据库只需改配置，代码不动 |
| **防止SQL注入** | 参数化查询，自动转义 |
| **易于维护** | 代码清晰，新人容易上手 |
| **自动CRUD** | 内置增删改查方法 |

### 3.5 ORM的劣势

| 劣势 | 说明 |
|------|------|
| **性能损耗** | ORM转换有开销，极端场景需手写SQL |
| **学习成本** | 需要学习ORM API |
| **复杂查询** | 某些复杂SQL用原生更简单 |
| **过度封装** | 隐藏SQL细节，出问题难排查 |

### 3.6 Node.js中常见的ORM框架

| ORM | 适用数据库 | 特点 |
|-----|----------|------|
| **Mongoose** | MongoDB | 最流行的MongoDB ODM，Schema定义 |
| **Prisma** | PostgreSQL/MySQL/SQLite | 类型安全、自动生成客户端、现代感强 |
| **TypeORM** | 所有关系型数据库 | 功能最全、装饰器支持 |
| **Sequelize** | MySQL/PostgreSQL/SQLite | 老牌稳健、Promise封装 |
| **Drizzle** | PostgreSQL/MySQL/SQLite | 轻量级、SQL-like、性能好 |

---

## 4. MongoDB基本操作

### 4.1 MongoDB简介

MongoDB是一个基于分布式文件存储的文档数据库，使用BSON（Binary JSON）格式存储数据。它最大的特点是"灵活"——文档可以有任何结构。

**MongoDB数据结构：**

```javascript
// 一个典型的MongoDB文档
{
    "_id": ObjectId("507f1f191bced86f81934567"),  // 自动生成的唯一ID
    "username": "zhangsan",
    "email": "zhangsan@example.com",
    "age": 28,
    "address": {                    // 嵌套文档
        "city": "北京",
        "district": "朝阳区",
        "street": "建国路88号"
    },
    "tags": ["程序员", "前端", "开源贡献者"],  // 数组
    "isActive": true,
    "createdAt": ISODate("2024-01-15T08:00:00Z"),
    "updatedAt": ISODate("2024-03-20T10:30:00Z")
}
```

### 4.2 基础增删改查操作

#### 4.2.1 插入操作

```javascript
// 插入单个文档
db.users.insertOne({
    username: "zhangsan",
    email: "zhangsan@example.com",
    age: 25
});

// 插入多个文档
db.users.insertMany([
    { username: "lisi", email: "lisi@example.com", age: 30 },
    { username: "wangwu", email: "wangwu@example.com", age: 28 },
    { username: "zhaoliu", email: "zhaoliu@example.com", age: 35 }
]);

// 推荐用法：insertOne/insertMany返回插入结果
// {
//     acknowledged: true,
//     insertedIds: {
//         '0': ObjectId("..."),
//         '1': ObjectId("...")
//     }
// }
```

#### 4.2.2 查询操作

```javascript
// 查询所有文档
db.users.find();                    // 返回所有用户
db.users.find({});                  // 同上，空对象表示匹配所有

// 条件查询 - 等于查询
db.users.find({ age: 25 });         // 年龄等于25的用户
db.users.find({ username: "zhangsan" });  // 用户名为zhangsan

// 比较运算符
db.users.find({ age: { $gt: 25 } });      // age > 25
db.users.find({ age: { $gte: 25 } });     // age >= 25
db.users.find({ age: { $lt: 30 } });      // age < 30
db.users.find({ age: { $lte: 30 } });     // age <= 30
db.users.find({ age: { $ne: 25 } });      // age != 25
db.users.find({ age: { $in: [25, 30, 35] } });  // age in [25, 30, 35]
db.users.find({ age: { $nin: [25, 30] } });     // age not in [25, 30]

// 逻辑运算符
db.users.find({ $and: [{ age: { $gt: 20 } }, { age: { $lt: 30 } }] });  // AND
db.users.find({ $or: [{ age: { $lt: 20 } }, { age: { $gt: 30 } }] });   // OR
db.users.find({ $nor: [{ age: 25 }, { username: "admin" }] });          // NOT OR
db.users.find({ age: { $not: { $gt: 25 } } });                           // NOT

// 嵌套文档查询
db.users.find({ "address.city": "北京" });        // 查询地址城市为北京的用户
db.users.find({ "address.district": "朝阳区" });   // 查询朝阳区用户

// 数组查询
db.users.find({ tags: "程序员" });                 // tags数组包含"程序员"
db.users.find({ tags: { $all: ["程序员", "前端"] } });  // 同时包含多个元素
db.users.find({ tags: { $size: 3 } });             // tags数组长度为3

// 正则表达式查询
db.users.find({ username: /^zhang/ });             // 用户名以zhang开头
db.users.find({ email: /@example\.com$/ });        // 邮箱以@example.com结尾

// 查询方法
db.users.findOne({ age: 25 });                     // 返回单个文档
db.users.find().limit(10);                         // 只返回前10条
db.users.find().skip(20);                           // 跳过前20条
db.users.find().sort({ age: 1 });                   // 按age升序排序
db.users.find().sort({ age: -1 });                  // 按age降序排序

// 投影（只返回指定字段）
db.users.find({}, { username: 1, email: 1, _id: 0 });  // 只返回username和email

// 统计数量
db.users.countDocuments({ age: { $gt: 20 } });     // 统计年龄大于20的用户数量
db.users.estimatedDocumentCount();                  // 估算集合中的文档数量
```

#### 4.2.3 更新操作

```javascript
// 更新单个文档 - $set操作符
db.users.updateOne(
    { username: "zhangsan" },           // 查询条件
    {
        $set: {                         // 设置字段值
            email: "new@example.com",
            age: 26
        },
        $currentDate: {                // 自动更新为当前时间
            updatedAt: true
        }
    }
);

// 更新多个文档
db.users.updateMany(
    { status: "inactive" },
    {
        $set: { status: "archived" }
    }
);

// $inc 递增/递减
db.users.updateOne(
    { username: "zhangsan" },
    { $inc: { age: 1 } }               // 年龄加1
);

// $mul 乘法
db.products.updateOne(
    { name: "iPhone" },
    { $mul: { price: 0.9 } }            // 价格打9折
);

// $push 数组添加元素
db.users.updateOne(
    { username: "zhangsan" },
    { $push: { tags: "架构师" } }
);

// $push + $each 批量添加数组元素
db.users.updateOne(
    { username: "zhangsan" },
    { $push: { tags: { $each: ["架构师", "技术总监"] } } }
);

// $pull 从数组中删除元素
db.users.updateOne(
    { username: "zhangsan" },
    { $pull: { tags: "程序员" } }       // 删除"程序员"标签
);

// $addToSet 类似push，但只添加不重复的元素
db.users.updateOne(
    { username: "zhangsan" },
    { $addToSet: { tags: "开源贡献者" } }
);

// $unset 删除字段
db.users.updateOne(
    { username: "zhangsan" },
    { $unset: { temporaryField: "" } }
);

// $rename 重命名字段
db.users.updateMany(
    {},
    { $rename: { "oldName": "newName" } }
);

// 替换整个文档（不推荐，会丢失_id）
db.users.replaceOne(
    { username: "zhangsan" },
    { username: "zhangsan", email: "new@example.com", age: 30 }
);

// 更新后返回更新后的文档
db.users.findOneAndUpdate(
    { username: "zhangsan" },
    { $set: { age: 30 } },
    { returnDocument: "after" }
);
```

#### 4.2.4 删除操作

```javascript
// 删除单个文档
db.users.deleteOne({ username: "zhangsan" });       // 删除第一个匹配的文档

// 删除多个文档
db.users.deleteMany({ status: "deleted" });         // 删除所有status为deleted的文档

// 删除所有文档（慎用！）
db.users.deleteMany({});

// 删除集合（包括所有文档和索引）
db.users.drop();

// 删除整个数据库
db.dropDatabase();
```

### 4.3 聚合管道

聚合管道是MongoDB中强大的数据处理工具，类似于数据加工流水线。

```javascript
// 聚合管道基础结构
db.orders.aggregate([
    // 阶段1：$match - 筛选数据
    { $match: { status: "completed" } },

    // 阶段2：$group - 分组统计
    { $group: {
        _id: "$userId",                    // 按userId分组
        totalAmount: { $sum: "$amount" },  // 统计总金额
        orderCount: { $sum: 1 },           // 统计订单数量
        avgAmount: { $avg: "$amount" },    // 计算平均金额
        maxAmount: { $max: "$amount" },    // 最大金额
        minAmount: { $min: "$amount" }     // 最小金额
    }},

    // 阶段3：$sort - 排序
    { $sort: { totalAmount: -1 } },

    // 阶段4：$limit - 限制数量
    { $limit: 10 },

    // 阶段5：$project - 投影
    { $project: {
        userId: "$_id",
        totalAmount: 1,
        orderCount: 1,
        avgAmount: { $round: ["$avgAmount", 2] }  // 保留2位小数
    }}
]);
```

**常用聚合操作符：**

| 操作符 | 说明 | 示例 |
|--------|------|------|
| $sum | 求和 | { $sum: "$amount" } |
| $avg | 平均值 | { $avg: "$score" } |
| $min | 最小值 | { $min: "$price" } |
| $max | 最大值 | { $max: "$price" } |
| $first | 首元素 | { $first: "$createdAt" } |
| $last | 尾元素 | { $last: "$status" } |
| $push | 数组收集 | { $push: "$item" } |
| $addToSet | 集合收集（去重） | { $addToSet: "$tag" } |

---

## 5. Mongoose使用详解

### 5.1 Mongoose简介

Mongoose是MongoDB的对象建模工具（ODM），为MongoDB提供模式（Schema）定义和数据验证。

### 5.2 Mongoose安装和基础配置

```bash
# 安装Mongoose
npm install mongoose

# 或使用pnpm
pnpm add mongoose
```

### 5.3 Mongoose基础代码

```typescript
// 数据库连接 - mongoose基础配置
import mongoose from 'mongoose';

// 连接字符串格式
// mongodb://主机:端口/数据库名
const MONGODB_URI = 'mongodb://localhost:27017/myshop';

async function connectDatabase() {
    try {
        // 连接到MongoDB
        await mongoose.connect(MONGODB_URI, {
            // 连接选项
            maxPoolSize: 10,               // 连接池最大连接数
            serverSelectionTimeoutMS: 5000, // 服务器选择超时
            socketTimeoutMS: 45000,        // Socket超时
        });

        console.log('MongoDB连接成功！');

        // 监听连接事件
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB连接错误:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB连接断开');
        });

    } catch (error) {
        console.error('MongoDB连接失败:', error);
        // 退出进程
        process.exit(1);
    }
}

// 定义用户Schema
const userSchema = new mongoose.Schema({
    // 字段定义：类型、必填、默认值、验证器
    username: {
        type: String,              // 字段类型
        required: [true, '用户名不能为空'],  // 必填
        unique: true,              // 唯一索引
        trim: true,               // 自动去除首尾空格
        minlength: [3, '用户名至少3个字符'],
        maxlength: [20, '用户名最多20个字符']
    },
    email: {
        type: String,
        required: [true, '邮箱不能为空'],
        unique: true,
        lowercase: true,          // 自动转为小写
        match: [/^\S+@\S+\.\S+$/, '邮箱格式不正确']  // 正则验证
    },
    password: {
        type: String,
        required: [true, '密码不能为空'],
        minlength: [6, '密码至少6个字符']
    },
    age: {
        type: Number,
        min: [0, '年龄不能为负数'],
        max: [150, '年龄不合理']
    },
    // 枚举类型
    role: {
        type: String,
        enum: ['user', 'admin', 'vip'],
        default: 'user'
    },
    // 嵌套文档
    address: {
        city: String,
        district: String,
        street: String,
        zipCode: String
    },
    // 数组类型
    tags: [String],
    // 布尔类型
    isActive: {
        type: Boolean,
        default: true
    },
    // 日期类型
    createdAt: {
        type: Date,
        default: Date.now          // 默认当前时间
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    // Schema配置选项
    timestamps: true,              // 自动管理createdAt和updatedAt
    toJSON: { virtuals: true },     // 转换JSON时包含虚拟字段
    toObject: { virtuals: true }
});

// 创建索引 - 提高查询性能
userSchema.index({ email: 1 });              // 单字段索引
userSchema.index({ username: 1 }, { unique: true });  // 唯一索引
userSchema.index({ age: 1, createdAt: -1 }); // 复合索引

// 虚拟字段 - 不存储在数据库中，但可以读取
userSchema.virtual('fullAddress').get(function() {
    if (this.address) {
        return `${this.address.city || ''}${this.address.district || ''}${this.address.street || ''}`;
    }
    return '';
});

// 实例方法 - 给文档添加自定义方法
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
    // 注意：实际项目中密码应该哈希存储，这里仅作为示例
    return candidatePassword === this.password;
};

// 静态方法 - 给Model添加的方法
userSchema.statics.findByEmail = function(email: string) {
    return this.findOne({ email: email });
};

// 中间件 - 在保存前/后执行的操作
userSchema.pre('save', function(next) {
    console.log('保存用户前:', this.username);
    // 可以在这里做数据处理
    next();
});

userSchema.post('save', function(doc) {
    console.log('保存用户后:', doc.username);
});

// 创建模型
const User = mongoose.model('User', userSchema);

// 导出模型供其他文件使用
export { User, connectDatabase };
```

### 5.4 Mongoose CRUD操作

```typescript
import { User } from './models/User';

// ==================== 创建（Create）====================

// 创建单个用户
async function createUser() {
    const user = new User({
        username: 'zhangsan',
        email: 'zhangsan@example.com',
        password: '123456',
        age: 28,
        role: 'user'
    });

    // 保存到数据库
    const savedUser = await user.save();
    console.log('创建的用户:', savedUser);
}

// 使用create直接创建
async function createUsers() {
    // 创建一个用户
    const user1 = await User.create({
        username: 'lisi',
        email: 'lisi@example.com',
        password: '123456'
    });

    // 批量创建
    const users = await User.create([
        { username: 'wangwu', email: 'wangwu@example.com', password: '123456' },
        { username: 'zhaoliu', email: 'zhaoliu@example.com', password: '123456' },
        { username: 'sunqi', email: 'sunqi@example.com', password: '123456' }
    ]);

    console.log('批量创建:', users);
}

// ==================== 读取（Read）====================

// 查询所有用户
async function findAllUsers() {
    const users = await User.find();                    // 返回所有用户
    const users2 = await User.find({});                // 同上
    const activeUsers = await User.find({ isActive: true });  // 条件查询
}

// 根据ID查询
async function findUserById() {
    const user = await User.findById('507f1f191bced86f81934567');
    console.log('根据ID查询:', user);
}

// 条件查询
async function findUsers() {
    // 等于查询
    const vipUsers = await User.find({ role: 'vip' });

    // 比较查询
    const adultUsers = await User.find({ age: { $gte: 18 } });

    // 逻辑查询
    const users = await User.find({
        $and: [
            { age: { $gte: 18 } },
            { isActive: true }
        ]
    });

    // 正则查询
    const zhangUsers = await User.find({
        username: /^zhang/
    });

    // 嵌套文档查询
    const beijingUsers = await User.find({
        'address.city': '北京'
    });

    // 数组查询
    const tagUsers = await User.find({
        tags: { $in: ['程序员', '开源'] }
    });

    // 投影查询 - 只返回指定字段
    const usernames = await User.find({}, { username: 1, _id: 0 });

    // 限制返回数量
    const top10 = await User.find().limit(10);

    // 跳过和分页
    const page2 = await User.find().skip(10).limit(10);

    // 排序
    const sortedUsers = await User.find().sort({ age: -1 });  // 按年龄降序
    const sortedUsers2 = await User.find().sort({ createdAt: 1 });  // 按时间升序

    // 链式调用
    const result = await User.find({ isActive: true })
        .select('username email age')
        .sort({ age: -1 })
        .skip(0)
        .limit(20)
        .exec();  // 执行查询

    console.log('查询结果:', result);
}

// 使用查询操作符
async function findWithOperators() {
    // $exists - 字段存在
    const users = await User.find({ email: { $exists: true } });

    // $type - 字段类型
    const numberUsers = await User.find({ age: { $type: 'number' } });

    // $regex - 正则匹配
    const mailUsers = await User.find({
        email: { $regex: /@example\.com$/ }
    });

    // $elemMatch - 数组元素匹配
    const tagUsers = await User.find({
        tags: { $elemMatch: { $eq: 'vip' } }
    });
}

// ==================== 更新（Update）====================

// 根据ID更新
async function updateUserById() {
    const user = await User.findByIdAndUpdate(
        '507f1f191bced86f81934567',
        {
            $set: { age: 30 },
            $push: { tags: '高级用户' }
        },
        { new: true }  // 返回更新后的文档
    );
    console.log('更新后:', user);
}

// updateOne - 更新单个
async function updateOneUser() {
    const result = await User.updateOne(
        { username: 'zhangsan' },
        {
            $set: { age: 28 },
            $currentDate: { updatedAt: true }
        }
    );
    console.log('更新结果:', result);
    // { acknowledged: true, modifiedCount: 1, matchedCount: 1, upsertedCount: 0 }
}

// updateMany - 更新多个
async function updateManyUsers() {
    const result = await User.updateMany(
        { isActive: false },
        { $set: { status: 'archived' } }
    );
    console.log('批量更新:', result.modifiedCount, '条记录');
}

// findOneAndUpdate - 查询并更新
async function findAndUpdate() {
    const user = await User.findOneAndUpdate(
        { username: 'zhangsan' },
        { $inc: { age: 1 } },
        { new: true }
    );
}

// ==================== 删除（Delete）====================

// 根据ID删除
async function deleteUserById() {
    const user = await User.findByIdAndDelete('507f1f191bced86f81934567');
    console.log('删除的用户:', user);
}

// deleteOne - 删除单个
async function deleteOneUser() {
    const result = await User.deleteOne({ username: 'zhangsan' });
    console.log('删除结果:', result);
    // { acknowledged: true, deletedCount: 1 }
}

// deleteMany - 删除多个
async function deleteManyUsers() {
    const result = await User.deleteMany({ isActive: false });
    console.log('批量删除:', result.deletedCount, '条记录');
}
```

### 5.5 Mongoose聚合操作

```typescript
import { Order } from './models/Order';

// 聚合管道查询
async function aggregateOrders() {
    const result = await Order.aggregate([
        // 阶段1：筛选已完成的订单
        { $match: { status: 'completed' } },

        // 阶段2：按用户ID分组
        { $group: {
            _id: '$userId',
            totalSpent: { $sum: '$amount' },
            orderCount: { $sum: 1 },
            avgOrderAmount: { $avg: '$amount' },
            maxOrderAmount: { $max: '$amount' }
        }},

        // 阶段3：按消费总额降序排序
        { $sort: { totalSpent: -1 } },

        // 阶段4：限制前10名
        { $limit: 10 },

        // 阶段5：添加用户信息
        { $lookup: {
            from: 'users',           // 关联的集合名
            localField: '_id',       // 本地字段
            foreignField: '_id',     // 外部字段
            as: 'userInfo'           // 输出数组名
        }},

        // 阶段6：展开用户信息
        { $unwind: '$userInfo' },

        // 阶段7：投影输出字段
        { $project: {
            userId: '$_id',
            username: '$userInfo.username',
            email: '$userInfo.email',
            totalSpent: 1,
            orderCount: 1,
            avgOrderAmount: { $round: ['$avgOrderAmount', 2] }
        }}
    ]);

    console.log('聚合结果:', result);
}

// 聚合管道中的日期处理
async function aggregateByMonth() {
    const result = await Order.aggregate([
        // 按月份分组统计
        { $group: {
            _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
            },
            totalAmount: { $sum: '$amount' },
            orderCount: { $sum: 1 }
        }},

        // 排序
        { $sort: { '_id.year': 1, '_id.month': 1 } },

        // 格式化输出
        { $project: {
            period: {
                $concat: [
                    { $toString: '$_id.year' },
                    '-',
                    { $toString: '$_id.month' }
                ]
            },
            totalAmount: 1,
            orderCount: 1
        }}
    ]);
}
```

---

## 6. Prisma使用详解

### 6.1 Prisma简介

Prisma是一个现代化的ORM框架，特点是类型安全、自动生成代码、声明式的Schema定义。

### 6.2 Prisma安装和配置

```bash
# 安装Prisma CLI和客户端
npm install prisma --save-dev
npm install @prisma/client

# 初始化Prisma项目
npx prisma init
```

### 6.3 Prisma Schema定义

```prisma
// prisma/schema.prisma

// 指定数据源
datasource db {
    provider = "postgresql"   // 可选: postgresql, mysql, sqlite, mongodb, sqlserver
    url      = env("DATABASE_URL")
}

// 生成客户端配置
generator client {
    provider = "prisma-client-js"
    // 输出路径
    output   = "../node_modules/.prisma/client"
}

// ==================== 数据模型定义 ====================

// 用户模型
model User {
    // 主键 - 默认自增（PostgreSQL）
    id        Int      @id @default(autoincrement())

    // 字符串字段
    username  String   @unique @db.VarChar(50)  // @unique 唯一索引
    email     String   @unique
    password  String   @map("password_hash")    // @map 映射到数据库列名

    // 可选字段
    avatar    String?
    bio       String?  @db.Text                 // Text类型

    // 枚举字段
    role      UserRole @default(USER)
    status    UserStatus @default(ACTIVE)

    // 数字字段
    age       Int?
    height    Float?                              // Float对应数据库的Decimal/Double

    // 布尔字段
    isVerified Boolean  @default(false)

    // 日期字段
    createdAt DateTime @default(now()) @map("created_at")
    updatedAt DateTime @updatedAt @map("updated_at")

    // 关系 - 一个用户有多个订单
    orders    Order[]

    // 索引
    @@index([email])                              // 单独索引
    @@index([role, status])                       // 复合索引

    // 映射到表名
    @@map("users")
}

// 枚举定义
enum UserRole {
    USER
    ADMIN
    VIP
}

enum UserStatus {
    ACTIVE
    INACTIVE
    BANNED
}

// 订单模型
model Order {
    id          Int       @id @default(autoincrement())
    orderNo     String    @unique @map("order_no")  // 订单号
    userId      Int       @map("user_id")           // 外键字段
    amount      Decimal   @db.Decimal(10, 2)        // 金额，精确到分
    status      OrderStatus @default(PENDING)

    // 订单项 - 嵌入式数组
    items       OrderItem[]

    // 关系定义
    user        User      @relation(fields: [userId], references: [id])

    // 时间戳
    createdAt   DateTime  @default(now()) @map("created_at")
    updatedAt   DateTime  @updatedAt @map("updated_at")

    // 复合唯一约束
    @@unique([userId, orderNo])
    @@index([userId])
    @@map("orders")
}

// 订单状态枚举
enum OrderStatus {
    PENDING
    PAID
    SHIPPED
    COMPLETED
    CANCELLED
    REFUNDED
}

// 订单项模型
model OrderItem {
    id        Int      @id @default(autoincrement())
    orderId   Int      @map("order_id")
    productId Int      @map("product_id")
    product   Product  @relation(fields: [productId], references: [id])
    order     Order    @relation(fields: [orderId], references: [id])

    quantity  Int
    price     Decimal  @db.Decimal(10, 2)

    // 唯一约束
    @@unique([orderId, productId])
    @@map("order_items")
}

// 商品模型
model Product {
    id          Int       @id @default(autoincrement())
    name        String    @db.VarChar(200)
    description String?   @db.Text
    price       Decimal   @db.Decimal(10, 2)
    stock       Int       @default(0)
    category    String    @db.VarChar(50)

    // 关系
    orderItems  OrderItem[]

    createdAt   DateTime  @default(now()) @map("created_at")
    updatedAt   DateTime  @updatedAt @map("updated_at")

    @@index([category])
    @@index([price])
    @@map("products")
}
```

### 6.4 Prisma CRUD操作

```typescript
import { PrismaClient } from '@prisma/client';

// 创建Prisma客户端实例
const prisma = new PrismaClient({
    // 日志配置
    log: ['query', 'info', 'warn', 'error']
});

async function main() {
    // ==================== 创建（Create）====================

    // 创建单个用户
    const user = await prisma.user.create({
        data: {
            username: 'zhangsan',
            email: 'zhangsan@example.com',
            password: 'hashed_password_123',
            age: 28,
            role: 'USER'
        }
    });
    console.log('创建的用户:', user);

    // 批量创建
    const users = await prisma.user.createMany({
        data: [
            { username: 'lisi', email: 'lisi@example.com', password: 'pass123' },
            { username: 'wangwu', email: 'wangwu@example.com', password: 'pass123' },
            { username: 'zhaoliu', email: 'zhaoliu@example.com', password: 'pass123' }
        ],
        skipDuplicates: true  // 跳过已存在的记录
    });
    console.log('批量创建:', users.count, '条');

    // 创建用户并同时创建关联订单
    const userWithOrder = await prisma.user.create({
        data: {
            username: 'vip_user',
            email: 'vip@example.com',
            password: 'vippass',
            role: 'VIP',
            orders: {
                create: {
                    orderNo: 'ORDER001',
                    amount: 999.99,
                    status: 'PENDING',
                    items: {
                        create: [
                            { productId: 1, quantity: 2, price: 499.99 }
                        ]
                    }
                }
            }
        },
        // 包含关联数据
        include: {
            orders: {
                include: { items: true }
            }
        }
    });

    // ==================== 读取（Read）====================

    // 查询所有用户
    const allUsers = await prisma.user.findMany();

    // 条件查询
    const vipUsers = await prisma.user.findMany({
        where: {
            role: 'VIP',
            age: { gte: 18 }
        }
    });

    // 分页查询
    const page1 = await prisma.user.findMany({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' }
    });

    // 根据ID查询
    const userById = await prisma.user.findUnique({
        where: { id: 1 }
    });

    // 根据唯一字段查询
    const userByEmail = await prisma.user.findUnique({
        where: { email: 'zhangsan@example.com' }
    });

    // 查询单个（返回null或抛异常）
    const userOrNull = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
    });

    // 统计数量
    const userCount = await prisma.user.count({
        where: { role: 'USER' }
    });

    // 去重查询
    const distinctRoles = await prisma.user.findMany({
        select: { role: true },
        distinct: ['role']
    });

    // 投影查询 - 只返回指定字段
    const usernames = await prisma.user.findMany({
        select: {
            id: true,
            username: true,
            email: true
        }
    });

    // 包含关联数据
    const userWithOrders = await prisma.user.findUnique({
        where: { id: 1 },
        include: {
            orders: {
                where: { status: 'COMPLETED' },
                orderBy: { createdAt: 'desc' },
                take: 5
            }
        }
    });

    // ==================== 更新（Update）====================

    // 根据ID更新
    const updatedUser = await prisma.user.update({
        where: { id: 1 },
        data: {
            age: 30,
            role: 'VIP'
        }
    });

    // 原子操作 - 递增
    const incrementResult = await prisma.user.update({
        where: { id: 1 },
        data: {
            age: { increment: 1 }
        }
    });

    // 原子操作 - 乘法
    await prisma.product.update({
        where: { id: 1 },
        data: {
            price: { multiply: 0.9 }  // 打9折
        }
    });

    // 批量更新
    await prisma.user.updateMany({
        where: { status: 'INACTIVE' },
        data: {
            status: 'BANNED'
        }
    });

    // upsert - 不存在则创建
    const upsertUser = await prisma.user.upsert({
        where: { email: 'newuser@example.com' },
        update: {
            age: 25
        },
        create: {
            username: 'newuser',
            email: 'newuser@example.com',
            password: 'newpass'
        }
    });

    // ==================== 删除（Delete）====================

    // 根据ID删除
    await prisma.user.delete({
        where: { id: 1 }
    });

    // 批量删除
    await prisma.user.deleteMany({
        where: {
            status: 'BANNED',
            createdAt: { lt: new Date('2024-01-01') }
        }
    });
}

// ==================== 高级查询 ====================

async function advancedQueries() {
    // OR查询
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { role: 'ADMIN' },
                { age: { gte: 30 } }
            ]
        }
    });

    // 嵌套查询
    const orders = await prisma.order.findMany({
        where: {
            user: {
                role: 'VIP'
            },
            items: {
                some: {
                    quantity: { gte: 2 }
                }
            }
        }
    });

    // 关系查询 - 包含
    const userWithManyOrders = await prisma.user.findMany({
        where: {
            orders: {
                some: {
                    status: 'COMPLETED'
                }
            }
        },
        include: {
            orders: {
                where: { status: 'COMPLETED' }
            }
        }
    });

    // 排序
    const sortedProducts = await prisma.product.findMany({
        orderBy: [
            { category: 'asc' },
            { price: 'desc' }
        ]
    });

    // 聚合查询
    const aggregateResult = await prisma.order.aggregate({
        where: { status: 'COMPLETED' },
        _count: { id: true },
        _sum: { amount: true },
        _avg: { amount: true },
        _min: { amount: true },
        _max: { amount: true }
    });

    // 分组查询
    const groupByResult = await prisma.order.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: { amount: true }
    });

    // 分页游标查询（用于海量数据）
    const cursorResult = await prisma.user.findMany({
        take: 10,
        skip: 1,
        cursor: {
            id: 10
        }
    });
}

// 事务操作
async function transactionExample() {
    // 创建订单并扣减库存（原子操作）
    const result = await prisma.$transaction(async (tx) => {
        // 查询商品
        const product = await tx.product.findUnique({
            where: { id: 1 }
        });

        if (!product || product.stock < 1) {
            throw new Error('库存不足');
        }

        // 创建订单
        const order = await tx.order.create({
            data: {
                orderNo: `ORDER${Date.now()}`,
                userId: 1,
                amount: product.price,
                status: 'PAID',
                items: {
                    create: {
                        productId: product.id,
                        quantity: 1,
                        price: product.price
                    }
                }
            }
        });

        // 扣减库存
        await tx.product.update({
            where: { id: 1 },
            data: {
                stock: { decrement: 1 }
            }
        });

        return order;
    });

    console.log('事务执行成功:', result);
}

// 主函数
main()
    .catch((e) => {
        console.error('执行错误:', e);
        process.exit(1);
    })
    .finally(async () => {
        // 关闭连接
        await prisma.$disconnect();
    });
```

---

## 7. TypeORM使用详解

### 7.1 TypeORM简介

TypeORM是一个同时支持ActiveRecord和DataMapper模式的ORM框架，功能全面，支持TypeScript装饰器。

### 7.2 TypeORM安装和配置

```bash
# 安装TypeORM和相关依赖
npm install typeorm reflect-metadata
npm install mysql2  # MySQL驱动，或 pg for PostgreSQL
```

### 7.3 TypeORM实体定义

```typescript
// src/entities/User.ts
import {
    Entity,                  // 实体装饰器
    PrimaryGeneratedColumn,  // 主键，自增
    Column,                  // 列装饰器
    CreateDateColumn,        // 创建时间
    UpdateDateColumn,        // 更新时间
    OneToMany,               // 一对多关系
    ManyToOne,               // 多对一关系
    OneToOne,                // 一对一关系
    ManyToMany,              // 多对多关系
    JoinTable,               // 关联表（多对多）
    Index,                   // 索引
    Unique,                  // 唯一约束
    Check,                   // 检查约束
    TableInheritance,        // 表继承
    ChildEntity,             // 子实体
    DiscriminatorColumn      // 区分列
} from 'typeorm';

// ==================== 基础实体 ====================

@Entity('users')  // 映射到users表
@Index(['email'])  // 邮箱索引
@Unique(['username', 'email'])  // 联合唯一
export class User {
    // 主键，自增
    @PrimaryGeneratedColumn()
    id: number;

    // 普通列
    @Column({ length: 50 })
    username: string;

    @Column({ unique: true })
    email: string;

    // 密码列，密码要哈希存储
    @Column({ select: false })  // select: false 查询时默认不返回
    password: string;

    // 可选列
    @Column({ nullable: true })
    avatar: string;

    @Column({ type: 'int', nullable: true })
    age: number;

    // 枚举列
    @Column({
        type: 'enum',
        enum: ['USER', 'ADMIN', 'VIP'],
        default: 'USER'
    })
    role: 'USER' | 'ADMIN' | 'VIP';

    // 布尔列，默认false
    @Column({ default: false })
    isActive: boolean;

    // 小数/金额列
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    balance: number;

    // JSON列（MySQL 5.7+，PostgreSQL）
    @Column({ type: 'json', nullable: true })
    profile: {
        bio?: string;
        skills?: string[];
        interests?: string[];
    };

    // 数组列（PostgreSQL特有）
    @Column('simple-array', { nullable: true })
    tags: string[];

    // 日期列
    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // 关系：一对多
    @OneToMany(() => Order, (order) => order.user)
    orders: Order[];

    // 关系：多对多
    @ManyToMany(() => Role, (role) => role.users)
    @JoinTable({
        name: 'user_roles',      // 关联表名
        joinColumn: { name: 'user_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' }
    })
    roles: Role[];
}

// ==================== 订单实体 ====================

@Entity('orders')
export class Order {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    orderNo: string;  // 订单号

    // 外键关联
    @ManyToOne(() => User, (user) => user.orders)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column('decimal', { precision: 10, scale: 2 })
    amount: number;

    @Column({
        type: 'enum',
        enum: ['PENDING', 'PAID', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'REFUNDED'],
        default: 'PENDING'
    })
    status: string;

    @Column({ nullable: true })
    paidAt: Date;

    @Column({ nullable: true })
    shippedAt: Date;

    @Column({ nullable: true })
    completedAt: Date;

    // 一对多：订单明细
    @OneToMany(() => OrderItem, (item) => item.order)
    items: OrderItem[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

// ==================== 订单明细实体 ====================

@Entity('order_items')
export class OrderItem {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    orderId: number;

    @Column()
    productId: number;

    @ManyToOne(() => Order, (order) => order.items)
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @ManyToOne(() => Product)
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Column('int')
    quantity: number;

    @Column('decimal', { precision: 10, scale: 2 })
    price: number;  // 购买时的价格
}

// ==================== 商品实体 ====================

@Entity('products')
@Index(['category', 'price'])
export class Product {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 200 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column('decimal', { precision: 10, scale: 2 })
    price: number;

    @Column('int', { default: 0 })
    stock: number;

    @Column({ length: 50 })
    category: string;

    @Column({ default: true })
    isActive: boolean;

    @Column('simple-json', { nullable: true })
    images: string[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

// ==================== 角色实体（多对多） ====================

@Entity('roles')
export class Role {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column({ nullable: true })
    description: string;

    @ManyToMany(() => User, (user) => user.roles)
    users: User[];
}
```

### 7.4 TypeORM数据库连接配置

```typescript
// src/data-source.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './entities/User';
import { Order } from './entities/Order';
import { OrderItem } from './entities/OrderItem';
import { Product } from './entities/Product';
import { Role } from './entities/Role';

// 数据源配置
export const AppDataSource = new DataSource({
    // 数据库类型
    type: 'mysql',  // mysql, postgres, sqlite, mongodb等

    // 连接配置
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'your_password',
    database: 'myshop',

    // 实体文件路径
    entities: [
        User,
        Order,
        OrderItem,
        Product,
        Role
    ],

    // 是否同步schema（开发环境true，生产环境false）
    synchronize: process.env.NODE_ENV === 'development',

    // 日志
    logging: process.env.NODE_ENV === 'development',

    // 连接池
    extra: {
        connectionLimit: 10
    },

    // 迁移文件路径
    migrations: ['src/migrations/*.ts'],

    // 订阅者路径
    subscribers: ['src/subscribers/*.ts']
});

// 初始化连接
export async function initializeDatabase() {
    try {
        await AppDataSource.initialize();
        console.log('数据库连接成功！');

        // 开启订阅者日志
        AppDataSource.subscribers;
    } catch (error) {
        console.error('数据库连接失败:', error);
        throw error;
    }
}
```

### 7.5 TypeORM CRUD操作

```typescript
// src/repository/UserRepository.ts
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { Order } from '../entities/Order';
import { Like, In, Between, Not } from 'typeorm';

// 获取Repository
const userRepository = AppDataSource.getRepository(User);
const orderRepository = AppDataSource.getRepository(Order);

// ==================== 创建（Create）====================

// 创建单个用户
async function createUser() {
    const user = userRepository.create({
        username: 'zhangsan',
        email: 'zhangsan@example.com',
        password: 'hashed_password',
        age: 28,
        role: 'USER'
    });

    // 保存到数据库
    const savedUser = await userRepository.save(user);
    console.log('创建的用户:', savedUser);
}

// 使用save创建（更常用）
async function createUserWithSave() {
    const user = await userRepository.save({
        username: 'lisi',
        email: 'lisi@example.com',
        password: 'pass123',
        role: 'VIP'
    });
}

// 批量创建
async function batchCreateUsers() {
    const users = await userRepository.save([
        { username: 'wangwu', email: 'wangwu@example.com', password: 'pass' },
        { username: 'zhaoliu', email: 'zhaoliu@example.com', password: 'pass' }
    ]);
}

// ==================== 读取（Read）====================

// 查询所有用户
async function findAllUsers() {
    const users = await userRepository.find();
    console.log('所有用户:', users);
}

// 条件查询
async function findUsers() {
    // 等于
    const vipUsers = await userRepository.find({
        where: { role: 'VIP' }
    });

    // 比较
    const adultUsers = await userRepository.find({
        where: { age: Between(18, 30) }
    });

    // IN查询
    const selectedUsers = await userRepository.find({
        where: { id: In([1, 2, 3]) }
    });

    // NOT查询
    const notAdminUsers = await userRepository.find({
        where: { role: Not('ADMIN') }
    });

    // LIKE查询
    const zhangUsers = await userRepository.find({
        where: { username: Like('%zhang%') }
    });

    // IS NULL查询
    const nullAgeUsers = await userRepository.find({
        where: { age: Not(IsNull()) }
    });
}

// 高级条件查询
async function advancedFind() {
    const result = await userRepository.find({
        // WHERE条件
        where: {
            role: 'USER',
            age: MoreThanOrEqual(18)
        },
        // SELECT字段
        select: ['id', 'username', 'email', 'age'],
        // 排序
        order: {
            age: 'DESC',
            createdAt: 'ASC'
        },
        // 分页
        skip: 0,
        take: 10,
        // 缓存（查询结果缓存）
        cache: true
    });
}

// 查询单个
async function findOneUser() {
    // 根据ID查询
    const user1 = await userRepository.findOne({
        where: { id: 1 }
    });

    // 根据唯一字段查询
    const user2 = await userRepository.findOne({
        where: { email: 'zhangsan@example.com' }
    });

    // 查询第一个匹配的
    const firstVip = await userRepository.findOne({
        where: { role: 'VIP' },
        order: { createdAt: 'ASC' }
    });

    // 包含关联数据
    const userWithOrders = await userRepository.findOne({
        where: { id: 1 },
        relations: ['orders']  // 加载关联的订单
    });
}

// 使用QueryBuilder（最灵活）
async function queryWithBuilder() {
    const result = await userRepository
        .createQueryBuilder('user')  // 给表起别名
        .select(['user.id', 'user.username', 'user.email'])
        .where('user.role = :role', { role: 'VIP' })
        .andWhere('user.age >= :minAge', { minAge: 18 })
        .orderBy('user.createdAt', 'DESC')
        .limit(10)
        .getMany();

    // 关联查询示例
    const orderStats = await orderRepository
        .createQueryBuilder('order')
        .select('order.userId', 'userId')
        .addSelect('COUNT(*)', 'orderCount')
        .addSelect('SUM(order.amount)', 'totalAmount')
        .where('order.status = :status', { status: 'COMPLETED' })
        .groupBy('order.userId')
        .having('SUM(order.amount) > :minAmount', { minAmount: 1000 })
        .orderBy('totalAmount', 'DESC')
        .getRawMany();

    return result;
}

// ==================== 更新（Update）====================

// 更新单个
async function updateUser() {
    const user = await userRepository.findOne({ where: { id: 1 } });

    if (user) {
        user.age = 30;
        user.role = 'VIP';
        await userRepository.save(user);
    }
}

// update方法（更快，不查询完整实体）
async function quickUpdate() {
    await userRepository.update(1, {
        age: 28,
        role: 'ADMIN'
    });
}

// 批量更新
async function batchUpdate() {
    await userRepository.update(
        { role: 'INACTIVE' },
        { status: 'BANNED' }
    );
}

// 更新或插入
async function upsertUser() {
    await userRepository.upsert({
        email: 'new@example.com',
        username: 'newuser',
        age: 25
    }, ['email']);  // 根据email判断是否存在
}

// ==================== 删除（Delete）====================

// 删除单个
async function deleteUser() {
    const user = await userRepository.findOne({ where: { id: 1 } });
    if (user) {
        await userRepository.remove(user);
    }
}

// 根据条件删除
async function deleteByCondition() {
    await userRepository.delete({
        role: 'BANNED',
        createdAt: LessThan(new Date('2024-01-01'))
    });
}

// 软删除（需添加deletedAt列）
async function softDelete() {
    await userRepository.softDelete(1);
    // 或使用
    const user = await userRepository.findOne({ where: { id: 1 } });
    if (user) {
        await userRepository.softRemove(user);
    }
}

// 恢复软删除
async function restoreDeleted() {
    await userRepository.restore(1);
}
```

### 7.6 TypeORM事务操作

```typescript
// 事务处理示例
async function transactionExample() {
    // 方式1：使用queryRunner（细粒度控制）
    const queryRunner = AppDataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        // 创建用户
        const user = queryRunner.manager.create(User, {
            username: 'newuser',
            email: 'new@example.com',
            password: 'pass'
        });
        const savedUser = await queryRunner.manager.save(user);

        // 创建订单
        const order = queryRunner.manager.create(Order, {
            orderNo: `ORDER${Date.now()}`,
            user: savedUser,
            amount: 999.99,
            status: 'PENDING'
        });
        await queryRunner.manager.save(order);

        // 提交事务
        await queryRunner.commitTransaction();
        console.log('事务提交成功');
    } catch (error) {
        // 回滚事务
        await queryRunner.rollbackTransaction();
        console.error('事务回滚:', error);
        throw error;
    } finally {
        // 释放连接
        await queryRunner.release();
    }

    // 方式2：使用DataSource.transaction（更简洁）
    await AppDataSource.transaction(async (manager) => {
        const user = await manager.save(User, {
            username: 'another',
            email: 'another@example.com',
            password: 'pass'
        });

        await manager.save(Order, {
            orderNo: `ORDER${Date.now()}`,
            userId: user.id,
            amount: 500
        });
    });
}
```

---

## 8. 数据库设计原则

### 8.1 关系型数据库设计范式

**三大范式：**

```
第一范式（1NF）：原子性
├── 每个字段都是不可分割的原子值
├── ❌ 错误：address = "北京市朝阳区建国路88号"（可拆分）
└── ✅ 正确：city = "北京"，district = "朝阳区"，street = "建国路88号"

第二范式（2NF）：唯一性 + 1NF
├── 必须有主键
├── 非主键字段完全依赖主键（不能只依赖主键的一部分）
├── ❌ 错误：订单明细表 (order_id, product_id, product_name, quantity)
│         product_name只依赖product_id，不完全依赖主键
└── ✅ 正确：拆分为订单明细表 + 商品表

第三范式（3NF）：直接依赖 + 2NF
├── 非主键字段不能传递依赖主键
├── ❌ 错误：用户表 (id, name, department_id, department_name)
│         department_name传递依赖department_id
└── ✅ 正确：拆分用户表 + 部门表
```

### 8.2 表关系设计

```
┌─────────────────────────────────────────────────────────────────┐
│                       表关系类型                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   一对一关系（1:1）                                               │
│   ┌─────────┐         ┌─────────┐                               │
│   │  用户    │──1:1──< │  档案    │                               │
│   │  表      │         │  表     │                               │
│   └─────────┘         └─────────┘                               │
│   场景：每个用户只有一份详细档案                                  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   一对多关系（1:N）                                               │
│   ┌─────────┐         ┌─────────┐                               │
│   │  用户    │──1:N──< │  订单    │                               │
│   │  表      │         │  表     │                               │
│   └─────────┘         └─────────┘                               │
│   场景：一个用户可以有多个订单                                    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   多对多关系（M:N）                                               │
│   ┌─────────┐         ┌─────────┐                               │
│   │  用户    │──M:N──< │  角色    │                               │
│   │  表      │         │  表     │                               │
│   └─────────┘         └─────────┘                               │
│          │                  │                                   │
│          ▼                  ▼                                   │
│   ┌─────────────────────────────┐                               │
│   │      用户_角色 关联表         │                               │
│   │  user_id  │  role_id         │                               │
│   └─────────────────────────────┘                               │
│   场景：一个用户可以有多个角色                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.3 电商订单系统数据模型设计

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          电商订单系统数据模型                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────┐        ┌─────────┐        ┌─────────┐        ┌─────────┐    │
│   │  用户    │──1:N──<│  订单    │──1:N──<│ 订单项   │──N:1──>│  商品    │    │
│   │  表     │        │  表     │        │  表     │        │  表     │    │
│   └─────────┘        └─────────┘        └─────────┘        └─────────┘    │
│         │                                           │                        │
│         │                                           │                        │
│         N                                           │                        │
│         │                                           │                        │
│         ▼                                           │                        │
│   ┌─────────┐                                       │                        │
│   │  地址    │                                       │                        │
│   │  表     │                                       │                        │
│   └─────────┘                                       │                        │
│         │                                            │                        │
│         │        ┌─────────┐        ┌─────────┐       │                        │
│         └─1:N──<│  支付    │──N:1──>│ 物流    │<──────┘                        │
│                 │  表     │        │  表     │                                │
│                 └─────────┘        └─────────┘                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

详细字段设计：

用户表 (users)
├── id (PK)              主键，自增
├── username             用户名，唯一
├── email                邮箱，唯一
├── password_hash        密码哈希
├── phone                手机号
├── avatar               头像URL
├── status               状态（active/inactive/banned）
├── last_login_at        最后登录时间
├── created_at           创建时间
└── updated_at           更新时间

地址表 (addresses)
├── id (PK)              主键
├── user_id (FK)         用户ID，外键
├── receiver_name        收货人姓名
├── phone                联系电话
├── province             省
├── city                 市
├── district             区
├── street               街道详细地址
├── postal_code          邮编
├── is_default           是否默认地址
└── created_at           创建时间

商品表 (products)
├── id (PK)              主键
├── name                 商品名称
├── description          商品描述
├── price                价格
├── stock                库存数量
├── category_id (FK)     分类ID
├── main_image           主图URL
├── images               图片列表（JSON）
├── is_active            是否上架
├── sales_count          销量
├── created_at           创建时间
└── updated_at           更新时间

商品分类表 (categories)
├── id (PK)              主键
├── name                 分类名称
├── parent_id            父分类ID（支持多级分类）
├── level                层级深度
└── sort_order           排序
```

---

## 9. 索引与性能优化

### 9.1 索引基础概念

**什么是索引？**

索引就像书籍的目录，没有索引的书要找某个内容要翻完整本书，有索引的书可以直接翻到对应章节。

```
无索引查询：
users表（100万条）
├── 查找 name='张三'
└── 全表扫描：100万次比较

有索引查询：
users表（100万条）+ name索引
├── 查找 name='张三'
└── 索引查找：约20次比较（索引树高度）
    ├── 根节点
    ├── 分支节点
    └── 叶子节点（包含数据指针）
```

### 9.2 MongoDB索引操作

```javascript
// 创建单字段索引
db.users.createIndex({ email: 1 });         // 升序索引
db.users.createIndex({ email: -1 });         // 降序索引
db.users.createIndex({ email: 1 }, { unique: true });  // 唯一索引

// 创建复合索引（多字段）
db.users.createIndex({ role: 1, age: 1, createdAt: -1 });
// 复合索引使用原则：
// ✅ 命中索引：{ role: 'VIP' }
// ✅ 命中索引：{ role: 'VIP', age: 25 }
// ✅ 命中索引：{ role: 'VIP', age: 25, createdAt: { $gt: ... } }
// ❌ 不命中：{ age: 25 }
// ❌ 不命中：{ createdAt: { $gt: ... } }

// 创建文本索引（全文搜索）
db.articles.createIndex({ title: 'text', content: 'text' });
// 文本搜索
db.articles.find({
    $text: { $search: 'javascript tutorial' }
});

// 文本搜索带权重
db.articles.createIndex(
    { title: 'text', content: 'text' },
    { weights: { title: 10, content: 1 } }  // title权重更高
);

// 多键索引（数组字段）
db.users.createIndex({ tags: 1 });  // tags是数组字段

// 部分索引（只索引满足条件的文档）
db.users.createIndex(
    { email: 1 },
    { partialFilterExpression: { email: { $exists: true } } }
);

// 稀疏索引（只索引存在该字段的文档）
db.users.createIndex(
    { phone: 1 },
    { sparse: true }
);

// 查看索引
db.users.getIndexes();

// 删除索引
db.users.dropIndex('email_1');

// 分析查询
db.users.find({ email: 'test@example.com' }).explain('executionStats');
// executionStats显示：
// - executionTimeMillis: 查询耗时
// - totalDocsExamined: 检查的文档数
// - nReturned: 返回的文档数
// - indexUsed: 使用的索引
```

### 9.3 关系型数据库索引

```sql
-- PostgreSQL/MySQL 索引操作

-- 创建单字段索引
CREATE INDEX idx_users_email ON users(email);

-- 创建唯一索引
CREATE UNIQUE INDEX idx_users_username ON users(username);

-- 创建复合索引
CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- 创建表达式索引
CREATE INDEX idx_users_email_lower ON users(LOWER(email));

-- 创建部分索引（PostgreSQL）
CREATE INDEX idx_active_users ON users(email)
WHERE status = 'active';

-- 创建全文索引（PostgreSQL）
CREATE INDEX idx_products_search ON products
USING gin(to_tsvector('chinese', name || ' ' || description));

-- 全文搜索
SELECT * FROM products
WHERE to_tsvector('chinese', name || ' ' || description)
@@ to_tsquery('chinese', '手机 & 5G');

-- 查看查询计划
EXPLAIN ANALYZE
SELECT * FROM users
WHERE email = 'test@example.com';

-- 查看表的所有索引
SELECT * FROM pg_indexes WHERE tablename = 'users';
SELECT * FROM mysql.indexes WHERE table_name = 'users';

-- 删除索引
DROP INDEX idx_users_email ON users;

-- 索引使用建议
-- 1. 选择性高的字段建索引（性别这种低选择性字段不建议）
-- 2. 经常用于WHERE、JOIN、ORDER BY的字段建索引
-- 3. 复合索引考虑字段顺序
-- 4. 避免在太多索引的表上频繁写操作
-- 5. 定期分析表，更新统计信息
```

### 9.4 查询性能优化技巧

```typescript
// 1. 选择需要的字段，而不是SELECT *
const userLight = await User.find({
    select: ['id', 'username', 'email']
});

// 2. 使用分页而不是一次性加载
const page1 = await User.find({ take: 10, skip: 0 });
const page2 = await User.find({ take: 10, skip: 10 });

// 3. 合理使用populate/include
// ❌ 错误：加载不需要的关联
const usersWithAll = await User.find({ include: { orders: true, roles: true } });

// ✅ 正确：只加载需要的关联
const users = await User.find({
    where: { role: 'VIP' },
    relations: ['orders']  // 只需要订单
});

// 4. 使用分页的游标方式（海量数据）
const cursorResult = await User.find({
    take: 10,
    cursor: { id: lastId }
});

// 5. 使用count而不是length
// ❌ 慢：加载所有数据再统计
const count = (await User.find()).length;

// ✅ 快：只统计数量
const count = await User.count();

// 6. 批量操作代替循环单条操作
// ❌ 慢：循环插入
for (const user of users) {
    await User.save(user);
}

// ✅ 快：批量插入
await User.save(users);

// 7. 合理使用缓存
const cacheKey = `user:${userId}`;
const cached = await redis.get(cacheKey);
if (cached) {
    return JSON.parse(cached);
}
const user = await User.findOne({ where: { id: userId } });
await redis.setex(cacheKey, 3600, JSON.stringify(user));
return user;

// 8. 避免在索引字段上使用函数
// ❌ 慢：函数导致索引失效
db.users.find({ createdAt: { $gte: new Date() } }); // 如果createdAt有索引但按月查询

// ✅ 使用索引范围查询
db.users.find({ createdAt: { $gte: ISODate('2024-01-01') } });
```

---

## 10. 实战项目：电商订单系统

### 10.1 项目需求分析

**电商订单系统核心功能：**
- 用户注册登录
- 商品浏览和搜索
- 购物车管理
- 下单和支付
- 订单管理
- 物流跟踪

### 10.2 使用Mongoose实现

```typescript
// ==================== 1. 用户模型 ====================

import mongoose, { Schema, Document } from 'mongoose';

// 用户接口定义
export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    phone?: string;
    avatar?: string;
    status: 'active' | 'inactive' | 'banned';
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

// 用户Schema定义
const userSchema = new Schema<IUser>({
    username: {
        type: String,
        required: [true, '用户名不能为空'],
        unique: true,
        trim: true,
        minlength: [3, '用户名至少3个字符'],
        maxlength: [20, '用户名最多20个字符']
    },
    email: {
        type: String,
        required: [true, '邮箱不能为空'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, '邮箱格式不正确']
    },
    password: {
        type: String,
        required: [true, '密码不能为空'],
        minlength: [6, '密码至少6个字符']
    },
    phone: {
        type: String,
        trim: true
    },
    avatar: String,
    status: {
        type: String,
        enum: ['active', 'inactive', 'banned'],
        default: 'active'
    },
    lastLoginAt: Date
}, {
    timestamps: true
});

// 密码比对实例方法
userSchema.methods.comparePassword = async function(
    candidatePassword: string
): Promise<boolean> {
    // 实际项目中应该用bcrypt哈希比对
    return candidatePassword === this.password;
};

// 索引
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ status: 1 });

// 导出模型
export const User = mongoose.model<IUser>('User', userSchema);


// ==================== 2. 商品模型 ====================

import mongoose, { Schema, Document, Types } from 'mongoose';

// 商品接口
export interface IProduct extends Document {
    name: string;
    description?: string;
    price: number;
    originalPrice?: number;  // 原价
    stock: number;
    category: Types.ObjectId | ICategory;
    mainImage: string;
    images: string[];
    isActive: boolean;
    salesCount: number;
    createdAt: Date;
    updatedAt: Date;
}

// 分类Schema（嵌入商品中）
const categorySchema = new Schema({
    name: String,
    slug: String,
    parentId: { type: Schema.Types.ObjectId, ref: 'Category' }
});

const productSchema = new Schema<IProduct>({
    name: {
        type: String,
        required: [true, '商品名称不能为空'],
        trim: true,
        maxlength: [200, '商品名称最多200个字符']
    },
    description: {
        type: String,
        maxlength: [5000, '商品描述最多5000个字符']
    },
    price: {
        type: Number,
        required: [true, '商品价格不能为空'],
        min: [0, '价格不能为负数']
    },
    originalPrice: Number,
    stock: {
        type: Number,
        default: 0,
        min: [0, '库存不能为负数']
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    mainImage: {
        type: String,
        required: [true, '请上传商品主图']
    },
    images: [String],
    isActive: {
        type: Boolean,
        default: true
    },
    salesCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// 索引
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isActive: 1, salesCount: -1 });
productSchema.index({ name: 'text', description: 'text' });  // 全文搜索

// 虚拟字段：计算折扣
productSchema.virtual('discount').get(function() {
    if (this.originalPrice && this.originalPrice > this.price) {
        return Math.round((1 - this.price / this.originalPrice) * 100);
    }
    return 0;
});

export const Product = mongoose.model<IProduct>('Product', productSchema);


// ==================== 3. 购物车模型 ====================

export interface ICart extends Document {
    userId: Types.ObjectId | IUser;
    items: ICartItem[];
    totalAmount: number;
    createdAt: Date;
    updatedAt: Date;
    addItem(productId: Types.ObjectId, quantity: number): Promise<void>;
    removeItem(productId: Types.ObjectId): Promise<void>;
    clearCart(): Promise<void>;
}

export interface ICartItem {
    product: Types.ObjectId | IProduct;
    quantity: number;
    price: number;  // 下单时的价格快照
}

const cartItemSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, '数量至少为1'],
        max: [99, '单商品数量不能超过99']
    },
    price: {
        type: Number,
        required: true
    }
}, { _id: true });

const cartSchema = new Schema<ICart>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [cartItemSchema],
    totalAmount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// 添加商品到购物车
cartSchema.methods.addItem = async function(
    productId: Types.ObjectId,
    quantity: number
) {
    // 查找商品
    const product = await Product.findById(productId);
    if (!product) {
        throw new Error('商品不存在');
    }

    // 检查库存
    if (product.stock < quantity) {
        throw new Error('库存不足');
    }

    // 检查购物车中是否已有该商品
    const existItem = this.items.find(
        item => item.product.toString() === productId.toString()
    );

    if (existItem) {
        // 更新数量
        existItem.quantity += quantity;
    } else {
        // 添加新商品
        this.items.push({
            product: productId,
            quantity,
            price: product.price
        });
    }

    // 重新计算总价
    this.totalAmount = this.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    await this.save();
};

// 移除商品
cartSchema.methods.removeItem = async function(productId: Types.ObjectId) {
    this.items = this.items.filter(
        item => item.product.toString() !== productId.toString()
    );
    this.totalAmount = this.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );
    await this.save();
};

// 清空购物车
cartSchema.methods.clearCart = async function() {
    this.items = [];
    this.totalAmount = 0;
    await this.save();
};

// 索引
cartSchema.index({ userId: 1 }, { unique: true });

export const Cart = mongoose.model<ICart>('Cart', cartSchema);


// ==================== 4. 订单模型 ====================

export interface IOrder extends Document {
    orderNo: string;  // 订单号
    userId: Types.ObjectId | IUser;
    items: IOrderItem[];
    totalAmount: number;
    status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled' | 'refunded';
    shippingAddress: IShippingAddress;
    paymentMethod?: string;
    paidAt?: Date;
    shippedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IOrderItem {
    product: Types.ObjectId | IProduct;
    productSnapshot: {  // 商品快照，保留下单时的信息
        name: string;
        mainImage: string;
        price: number;
    };
    quantity: number;
    price: number;  // 下单时的价格
}

export interface IShippingAddress {
    receiverName: string;
    phone: string;
    province: string;
    city: string;
    district: string;
    street: string;
    postalCode: string;
}

const orderItemSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productSnapshot: {
        name: String,
        mainImage: String,
        price: Number
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true
    }
}, { _id: true });

const orderSchema = new Schema<IOrder>({
    orderNo: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [orderItemSchema],
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'shipped', 'completed', 'cancelled', 'refunded'],
        default: 'pending'
    },
    shippingAddress: {
        receiverName: String,
        phone: String,
        province: String,
        city: String,
        district: String,
        street: String,
        postalCode: String
    },
    paymentMethod: String,
    paidAt: Date,
    shippedAt: Date,
    completedAt: Date
}, {
    timestamps: true
});

// 生成订单号的静态方法
orderSchema.statics.generateOrderNo = function() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `ORDER${timestamp}${randomStr}`.toUpperCase();
};

// 索引
orderSchema.index({ orderNo: 1 }, { unique: true });
orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ createdAt: -1 });

export const Order = mongoose.model<IOrder>('Order', orderSchema);


// ==================== 5. 订单服务 ====================

import { User } from './models/User';
import { Product } from './models/Product';
import { Cart } from './models/Cart';
import { Order } from './models/Order';
import mongoose from 'mongoose';

export class OrderService {
    /**
     * 创建订单（从购物车结算）
     * 包含完整的业务流程：
     * 1. 验证用户和购物车
     * 2. 检查商品库存和价格
     * 3. 扣减库存
     * 4. 生成订单
     * 5. 清空购物车
     * 6. 开启事务保证一致性
     */
    async createOrderFromCart(
        userId: string,
        shippingAddress: IShippingAddress
    ): Promise<IOrder> {
        // 开启事务
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. 获取用户和购物车
            const user = await User.findById(userId).session(session);
            if (!user) {
                throw new Error('用户不存在');
            }

            const cart = await Cart.findOne({ userId }).session(session);
            if (!cart || cart.items.length === 0) {
                throw new Error('购物车为空');
            }

            // 2. 验证商品库存和获取最新价格
            const productIds = cart.items.map(item => item.product);
            const products = await Product.find({
                _id: { $in: productIds }
            }).session(session);

            const productMap = new Map(
                products.map(p => [p._id.toString(), p])
            );

            let totalAmount = 0;
            const orderItems = [];

            for (const cartItem of cart.items) {
                const product = productMap.get(cartItem.product.toString());

                if (!product) {
                    throw new Error(`商品不存在: ${cartItem.product}`);
                }

                if (product.stock < cartItem.quantity) {
                    throw new Error(`商品库存不足: ${product.name}`);
                }

                // 计算小计
                const subtotal = product.price * cartItem.quantity;
                totalAmount += subtotal;

                // 保存商品快照
                orderItems.push({
                    product: product._id,
                    productSnapshot: {
                        name: product.name,
                        mainImage: product.mainImage,
                        price: product.price
                    },
                    quantity: cartItem.quantity,
                    price: product.price
                });
            }

            // 3. 生成订单
            const order = new Order({
                orderNo: Order.generateOrderNo(),
                userId: user._id,
                items: orderItems,
                totalAmount,
                status: 'pending',
                shippingAddress
            });

            await order.save({ session });

            // 4. 扣减库存
            for (const cartItem of cart.items) {
                await Product.updateOne(
                    { _id: cartItem.product },
                    { $inc: { stock: -cartItem.quantity } }
                ).session(session);
            }

            // 5. 清空购物车
            await Cart.deleteOne({ userId }).session(session);

            // 6. 提交事务
            await session.commitTransaction();

            console.log(`订单创建成功: ${order.orderNo}`);
            return order;

        } catch (error) {
            // 回滚事务
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * 获取用户订单列表（带分页）
     */
    async getUserOrders(
        userId: string,
        page: number = 1,
        pageSize: number: 10
    ) {
        const skip = (page - 1) * pageSize;

        const [orders, total] = await Promise.all([
            Order.find({ userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(pageSize)
                .populate('items.product'),
            Order.countDocuments({ userId })
        ]);

        return {
            orders,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize)
            }
        };
    }

    /**
     * 更新订单状态
     */
    async updateOrderStatus(orderId: string, status: string) {
        const order = await Order.findById(orderId);
        if (!order) {
            throw new Error('订单不存在');
        }

        // 状态更新映射
        const statusUpdate: Record<string, any> = {
            paid: { paidAt: new Date() },
            shipped: { shippedAt: new Date() },
            completed: { completedAt: new Date() }
        };

        if (statusUpdate[status]) {
            await Order.findByIdAndUpdate(orderId, {
                $set: {
                    status,
                    ...statusUpdate[status]
                }
            });
        } else {
            order.status = status;
            await order.save();
        }

        return Order.findById(orderId);
    }

    /**
     * 取消订单（恢复库存）
     */
    async cancelOrder(orderId: string) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const order = await Order.findById(orderId).session(session);

            if (!order) {
                throw new Error('订单不存在');
            }

            if (!['pending', 'paid'].includes(order.status)) {
                throw new Error('该订单无法取消');
            }

            // 恢复库存
            for (const item of order.items) {
                await Product.updateOne(
                    { _id: item.product },
                    { $inc: { stock: item.quantity } }
                ).session(session);
            }

            // 更新状态
            order.status = 'cancelled';
            await order.save({ session });

            await session.commitTransaction();

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
}

// 导出服务实例
export const orderService = new OrderService();
```

### 10.3 使用Prisma实现

```prisma
// ==================== Prisma Schema 定义 ====================

// prisma/schema.prisma

generator client {
    provider = "prisma-client-js"
}

datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
}

// 用户模型
model User {
    id        Int      @id @default(autoincrement())
    username  String   @unique
    email     String   @unique
    password  String
    phone     String?
    avatar    String?
    status    UserStatus @default(ACTIVE)

    // 关系
    addresses Address[]
    orders    Order[]
    cart      Cart?

    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    @@map("users")
}

enum UserStatus {
    ACTIVE
    INACTIVE
    BANNED
}

// 用户地址模型
model Address {
    id           Int      @id @default(autoincrement())
    userId       Int
    receiverName String
    phone        String
    province     String
    city         String
    district     String
    street       String
    postalCode   String
    isDefault    Boolean  @default(false)

    user         User     @relation(fields: [userId], references: [id])

    createdAt    DateTime @default(now())

    @@map("addresses")
}

// 商品分类模型
model Category {
    id       Int       @id @default(autoincrement())
    name     String
    slug     String    @unique
    parentId Int?
    parent   Category? @relation("CategorySubcategories", fields: [parentId], references: [id])
    children Category[] @relation("CategorySubcategories")
    products Product[]

    @@map("categories")
}

// 商品模型
model Product {
    id            Int       @id @default(autoincrement())
    name          String
    description   String?
    price         Decimal   @db.Decimal(10, 2)
    originalPrice Decimal?  @db.Decimal(10, 2)
    stock         Int       @default(0)
    mainImage     String
    images        String[]
    isActive      Boolean   @default(true)
    salesCount    Int       @default(0)

    categoryId    Int
    category      Category  @relation(fields: [categoryId], references: [id])

    orderItems    OrderItem[]

    createdAt     DateTime  @default(now())
    updatedAt     DateTime  @updatedAt

    @@index([categoryId])
    @@index([isActive, salesCount])
    @@map("products")
}

// 购物车模型
model Cart {
    id        Int      @id @default(autoincrement())
    userId    Int      @unique
    user      User     @relation(fields: [userId], references: [id])
    items     CartItem[]
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    @@map("carts")
}

// 购物车项模型
model CartItem {
    id        Int     @id @default(autoincrement())
    cartId    Int
    productId Int
    quantity  Int     @default(1)
    price     Decimal @db.Decimal(10, 2)

    cart      Cart    @relation(fields: [cartId], references: [id], onDelete: Cascade)
    product   Product @relation(fields: [productId], references: [id])

    @@unique([cartId, productId])
    @@map("cart_items")
}

// 订单模型
model Order {
    id              Int         @id @default(autoincrement())
    orderNo         String      @unique
    userId          Int
    totalAmount     Decimal     @db.Decimal(10, 2)
    status          OrderStatus @default(PENDING)

    // 收货地址快照
    shippingAddress Json

    // 关系
    user            User        @relation(fields: [userId], references: [id])
    items           OrderItem[]

    paymentMethod   String?
    paidAt          DateTime?
    shippedAt       DateTime?
    completedAt     DateTime?

    createdAt       DateTime    @default(now())
    updatedAt       DateTime    @updatedAt

    @@index([userId, status])
    @@index([createdAt])
    @@map("orders")
}

enum OrderStatus {
    PENDING
    PAID
    SHIPPED
    COMPLETED
    CANCELLED
    REFUNDED
}

// 订单项模型
model OrderItem {
    id        Int      @id @default(autoincrement())
    orderId   Int
    productId Int

    // 商品快照
    productSnapshot Json

    quantity  Int
    price     Decimal  @db.Decimal(10, 2)

    order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
    product   Product  @relation(fields: [productId], references: [id])

    @@map("order_items")
}
```

```typescript
// ==================== Prisma 订单服务 ====================

import { PrismaClient, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

export class OrderService {
    /**
     * 创建订单
     */
    async createOrder(userId: number, shippingAddress: any) {
        // 开启事务
        return await prisma.$transaction(async (tx) => {
            // 1. 获取购物车
            const cart = await tx.cart.findUnique({
                where: { userId },
                include: {
                    items: {
                        include: { product: true }
                    }
                }
            });

            if (!cart || cart.items.length === 0) {
                throw new Error('购物车为空');
            }

            // 2. 验证库存并计算总价
            let totalAmount = 0;
            const orderItems = [];

            for (const item of cart.items) {
                if (item.product.stock < item.quantity) {
                    throw new Error(`商品库存不足: ${item.product.name}`);
                }

                totalAmount += Number(item.price) * item.quantity;

                orderItems.push({
                    productId: item.productId,
                    productSnapshot: {
                        name: item.product.name,
                        mainImage: item.product.mainImage,
                        price: Number(item.price)
                    },
                    quantity: item.quantity,
                    price: item.price
                });

                // 3. 扣减库存
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: { decrement: item.quantity },
                        salesCount: { increment: item.quantity }
                    }
                });
            }

            // 4. 创建订单
            const order = await tx.order.create({
                data: {
                    orderNo: this.generateOrderNo(),
                    userId,
                    totalAmount,
                    status: 'PENDING',
                    shippingAddress,
                    items: {
                        create: orderItems
                    }
                },
                include: {
                    items: true
                }
            });

            // 5. 清空购物车
            await tx.cartItem.deleteMany({
                where: { cartId: cart.id }
            });

            return order;
        });
    }

    /**
     * 生成订单号
     */
    private generateOrderNo(): string {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `ORDER${timestamp}${random}`.toUpperCase();
    }

    /**
     * 获取用户订单列表
     */
    async getUserOrders(userId: number, page: number = 1, pageSize: number = 10) {
        const skip = (page - 1) * pageSize;

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize,
                include: {
                    items: {
                        include: { product: true }
                    }
                }
            }),
            prisma.order.count({ where: { userId } })
        ]);

        return {
            orders,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize)
            }
        };
    }

    /**
     * 更新订单状态
     */
    async updateOrderStatus(orderId: number, status: OrderStatus) {
        const updateData: any = { status };

        // 根据状态添加时间戳
        if (status === 'PAID') updateData.paidAt = new Date();
        if (status === 'SHIPPED') updateData.shippedAt = new Date();
        if (status === 'COMPLETED') updateData.completedAt = new Date();

        return await prisma.order.update({
            where: { id: orderId },
            data: updateData,
            include: { items: true }
        });
    }

    /**
     * 取消订单
     */
    async cancelOrder(orderId: number) {
        return await prisma.$transaction(async (tx) => {
            // 获取订单
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: { items: true }
            });

            if (!order) {
                throw new Error('订单不存在');
            }

            if (!['PENDING', 'PAID'].includes(order.status)) {
                throw new Error('该订单无法取消');
            }

            // 恢复库存
            for (const item of order.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: { increment: item.quantity },
                        salesCount: { decrement: item.quantity }
                    }
                });
            }

            // 更新状态
            return await tx.order.update({
                where: { id: orderId },
                data: { status: 'CANCELLED' }
            });
        });
    }

    /**
     * 订单统计
     */
    async getOrderStats(userId: number) {
        const [totalOrders, totalSpent, completedOrders] = await Promise.all([
            prisma.order.count({ where: { userId } }),
            prisma.order.aggregate({
                where: {
                    userId,
                    status: { in: ['PAID', 'SHIPPED', 'COMPLETED'] }
                },
                _sum: { totalAmount: true }
            }),
            prisma.order.count({
                where: { userId, status: 'COMPLETED' }
            })
        ]);

        return {
            totalOrders,
            totalSpent: totalSpent._sum.totalAmount || 0,
            completedOrders
        };
    }
}

export const orderService = new OrderService();
```

---

## 总结

### 核心要点回顾

| 知识点 | 关键内容 |
|--------|----------|
| **数据库基础** | 关系型 vs 非关系型，表/集合、文档，ACID特性 |
| **MongoDB操作** | insert/find/update/delete，聚合管道，索引 |
| **Mongoose** | Schema定义，模型创建，CRUD，事务 |
| **Prisma** | schema.prisma定义，类型安全客户端，事务 |
| **TypeORM** | 实体装饰器，Repository模式，QueryBuilder |
| **数据库设计** | 范式理论，表关系，一对一/一对多/多对多 |
| **性能优化** | 索引创建原则，查询优化技巧，缓存策略 |

### 学习建议

1. **理论与实践结合**：学习每个知识点后动手实践
2. **对比学习**：对比Mongoose、Prisma、TypeORM的异同
3. **项目驱动**：通过完整项目串联所有知识点
4. **性能意识**：从一开始就要注意查询性能
5. **阅读源码**：有精力可以阅读ORM框架源码

---

*本文档由Claude Code生成，最后更新于2026年4月*
