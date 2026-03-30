# MongoDB 数据库详解

## 目录

1. [MongoDB 基础](#1-mongodb-基础)
2. [CRUD 操作](#2-crud-操作)
3. [聚合管道](#3-聚合管道)
4. [索引优化](#4-索引优化)
5. [Mongoose ODM](#5-mongoose-odm)

---

## 1. MongoDB 基础

### 1.1 MongoDB 是什么？

MongoDB 是一个基于文档的 NoSQL 数据库，使用 JSON 格式的文档存储数据。它是非关系型数据库中最流行的选择之一，具有高性能、高可用性和易扩展性的特点。

**MongoDB 核心特性：**

- 文档存储（BSON 格式）
- 灵活的 Schema
- 高性能
- 水平扩展
- 丰富的查询语言
- 聚合框架

### 1.2 基本概念

| SQL 术语 | MongoDB 术语 | 说明 |
|----------|--------------|------|
| Database | Database | 数据库 |
| Table | Collection | 集合 |
| Row | Document | 文档 |
| Column | Field | 字段 |
| Index | Index | 索引 |
| Join | $lookup | 关联查询 |

### 1.3 连接 MongoDB

```javascript
// 使用 mongoose 连接
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/mydb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  user: 'username',
  pass: 'password',
  // 连接池配置
  poolSize: 10,
  // 自动重连
  reconnectTries: 30,
  reconnectInterval: 3000,
})
.then(() => console.log('MongoDB 连接成功'))
.catch(err => console.error('MongoDB 连接失败:', err));

// 监听连接事件
mongoose.connection.on('connected', () => console.log('连接已建立'));
mongoose.connection.on('disconnected', () => console.log('连接已断开'));
mongoose.connection.on('error', err => console.error('连接错误:', err));
```

---

## 2. CRUD 操作

### 2.1 创建文档（Create）

```javascript
// 插入单个文档
const result = await db.collection('users').insertOne({
  name: '张三',
  age: 25,
  email: 'zhangsan@example.com',
  address: {
    city: '北京',
    district: '朝阳区'
  },
  tags: ['developer', 'music'],
  createdAt: new Date()
});

console.log('插入的文档 ID:', result.insertedId);

// 插入多个文档
const results = await db.collection('users').insertMany([
  { name: '李四', age: 28 },
  { name: '王五', age: 30 }
]);

console.log('插入的文档数量:', results.insertedCount);
```

### 2.2 读取文档（Read）

```javascript
// 查询所有文档
const allUsers = await db.collection('users').find().toArray();

// 条件查询
const users = await db.collection('users')
  .find({ age: { $gte: 25 } })
  .toArray();

// 查询单个文档
const user = await db.collection('users').findOne({ _id: new ObjectId('xxx') });

// 投影（只返回指定字段）
const users = await db.collection('users')
  .find({})
  .project({ name: 1, email: 1, _id: 0 })
  .toArray();

// 排序
const users = await db.collection('users')
  .find({})
  .sort({ age: -1 })  // -1 降序，1 升序
  .toArray();

// 限制数量
const users = await db.collection('users')
  .find({})
  .limit(10)
  .toArray();

// 跳过文档
const users = await db.collection('users')
  .find({})
  .skip(20)
  .limit(10)
  .toArray();

// 分页查询
async function getPage(page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    db.collection('users').find({}).skip(skip).limit(limit).toArray(),
    db.collection('users').countDocuments({})
  ]);
  return { data, total, page, limit };
}
```

### 2.3 更新文档（Update）

```javascript
// 更新单个文档
const result = await db.collection('users').updateOne(
  { _id: new ObjectId('xxx') },
  { $set: { age: 26 } }
);
console.log('更新的文档数量:', result.modifiedCount);

// 更新多个文档
const result = await db.collection('users').updateMany(
  { age: { $lt: 25 } },
  { $set: { status: 'young' } }
);

// 使用 $inc 递增/递减
await db.collection('users').updateOne(
  { _id: new ObjectId('xxx') },
  { $inc: { age: 1 } }  // 年龄 +1
);

// 使用 $push 添加数组元素
await db.collection('users').updateOne(
  { _id: new ObjectId('xxx') },
  { $push: { tags: 'new-tag' } }
);

// 使用 $pull 移除数组元素
await db.collection('users').updateOne(
  { _id: new ObjectId('xxx') },
  { $pull: { tags: 'old-tag' } }
);

// 使用 upsert（不存在则插入）
const result = await db.collection('users').updateOne(
  { email: 'new@example.com' },
  { $set: { name: '新用户', email: 'new@example.com' } },
  { upsert: true }
);
```

### 2.4 删除文档（Delete）

```javascript
// 删除单个文档
const result = await db.collection('users').deleteOne({ _id: new ObjectId('xxx') });
console.log('删除的文档数量:', result.deletedCount);

// 删除多个文档
const result = await db.collection('users').deleteMany({ age: { $lt: 18 } });
console.log('删除的文档数量:', result.deletedCount);

// 删除集合
await db.collection('users').drop();

// 删除数据库
await db.dropDatabase();
```

### 2.5 查询操作符

```javascript
// 比较操作符
{ age: { $eq: 25 } }      // 等于
{ age: { $ne: 25 } }      // 不等于
{ age: { $gt: 25 } }      // 大于
{ age: { $gte: 25 } }     // 大于等于
{ age: { $lt: 25 } }      // 小于
{ age: { $lte: 25 } }     // 小于等于
{ age: { $in: [20, 25, 30] } }  // 在数组中
{ age: { $nin: [20, 25] } }     // 不在数组中

// 逻辑操作符
{ $and: [{ age: { $gt: 20 } }, { age: { $lt: 30 } }] }
{ $or: [{ name: '张三' }, { name: '李四' }] }
{ $nor: [{ status: 'A' }, { status: 'B' }] }
{ $not: { age: { $gt: 25 } } }

// 元素操作符
{ age: { $exists: true } }           // 字段存在
{ name: { $type: 'string' } }        // 字段类型
{ age: { $exists: true, $ne: null } } // 字段非空

// 数组操作符
{ tags: { $all: ['a', 'b'] } }       // 包含所有元素
{ tags: { $size: 3 } }               // 数组长度为 3
{ 'comments.5': { $exists: true } }   // 数组索引存在

// 正则表达式
{ name: { $regex: /^张/ } }          // 以张开头
{ email: { $regex: '@example\\.com$' } }  // 以 example.com 结尾
```

---

## 3. 聚合管道

### 3.1 聚合管道基础

```javascript
// 聚合管道语法
const results = await db.collection('orders').aggregate([
  { $match: { status: 'completed' } },     // 筛选
  { $group: { _id: '$product', total: { $sum: '$amount' } } },  // 分组
  { $sort: { total: -1 } },                 // 排序
  { $limit: 10 }                            // 限制
]).toArray();
```

### 3.2 常用聚合阶段

```javascript
// $match - 筛选文档
db.collection('orders').aggregate([
  { $match: { status: 'completed', amount: { $gt: 100 } } }
]);

// $project - 选择字段
db.collection('users').aggregate([
  { $project: { name: 1, email: 1, _id: 0 } }
]);

// $group - 分组聚合
db.collection('orders').aggregate([
  {
    $group: {
      _id: '$userId',
      totalAmount: { $sum: '$amount' },
      orderCount: { $sum: 1 },
      avgAmount: { $avg: '$amount' },
      maxAmount: { $max: '$amount' },
      minAmount: { $min: '$amount' },
      products: { $addToSet: '$product' }
    }
  }
]);

// $sort - 排序
db.collection('users').aggregate([
  { $sort: { age: -1, name: 1 } }
]);

// $limit 和 $skip - 分页
db.collection('users').aggregate([
  { $skip: 20 },
  { $limit: 10 }
]);

// $lookup - 关联查询
db.collection('orders').aggregate([
  {
    $lookup: {
      from: 'users',           // 关联的集合
      localField: 'userId',    // 本地字段
      foreignField: '_id',      // 外部字段
      as: 'userInfo'           // 输出字段名
    }
  }
]);

// $unwind - 展开数组
db.collection('orders').aggregate([
  { $unwind: '$items' },
  { $group: { _id: '$_id', total: { $sum: '$items.price' } } }
]);

// $addFields - 添加字段
db.collection('users').aggregate([
  { $addFields: { fullName: { $concat: ['$name', ' ', '$surname'] } } }
]);
```

### 3.3 聚合表达式

```javascript
// 字符串表达式
{ $toUpper: '$name' }        // 转大写
{ $toLower: '$name' }        // 转小写
{ $concat: ['$name', '-', '$email'] }  // 字符串连接
{ $substr: ['$name', 0, 5] } // 截取字符串

// 数值表达式
{ $add: ['$price', '$tax'] }             // 加法
{ $subtract: ['$price', '$discount'] }   // 减法
{ $multiply: ['$price', '$quantity'] }   // 乘法
{ $divide: ['$price', 2] }               // 除法
{ $mod: ['$price', 3] }                  // 取模

// 日期表达式
{ $year: '$createdAt' }                   // 年
{ $month: '$createdAt' }                  // 月
{ $dayOfMonth: '$createdAt' }            // 日
{ $dayOfWeek: '$createdAt' }              // 周几
{ $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }

// 条件表达式
{
  $cond: {
    if: { $gte: ['$score', 60] },
    then: '及格',
    else: '不及格'
  }
}

{
  $switch: {
    branches: [
      { case: { $eq: ['$level', 1] }, then: '初级' },
      { case: { $eq: ['$level', 2] }, then: '中级' }
    ],
    default: '未知'
  }
}
```

---

## 4. 索引优化

### 4.1 创建索引

```javascript
// 单字段索引
await db.collection('users').createIndex({ email: 1 });

// 复合索引（顺序重要）
await db.collection('users').createIndex({ age: 1, name: -1 });

// 唯一索引
await db.collection('users').createIndex({ email: 1 }, { unique: true });

// 部分索引
await db.collection('orders').createIndex(
  { userId: 1 },
  { partialFilterExpression: { status: 'active' } }
);

// 文本索引
await db.collection('articles').createIndex({ title: 'text', content: 'text' });

// 哈希索引
await db.collection('users').createIndex({ _id: 'hashed' });
```

### 4.2 查看和删除索引

```javascript
// 查看集合的索引
const indexes = await db.collection('users').indexes();
console.log(indexes);

// 删除索引
await db.collection('users').dropIndex('email_1');

// 删除所有索引（除了 _id）
await db.collection('users').dropIndexes();
```

### 4.3 索引优化原则

```javascript
// 1. 为常用查询创建索引
// 查询: { age: 25, name: '张三' }
// 索引: { age: 1, name: 1 }

// 2. 遵循 ESR 规则
// Equal - 先等值查询字段
// Sort - 再排序字段
// Range - 最后范围查询字段

// 3. 避免过多索引
// 索引占用空间，影响写入性能

// 4. 使用覆盖查询
// 查询字段都在索引中，不需要回表查询

// 5. 监控慢查询
db.setProfilingLevel(1, { slowms: 100 });
const slowQueries = db.system.profile.find({ millis: { $gt: 100 } }).limit(10);
```

---

## 5. Mongoose ODM

### 5.1 Mongoose 基础

```javascript
const mongoose = require('mongoose');

// 连接数据库
mongoose.connect('mongodb://localhost:27017/mydb');

// 定义 Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 50,
    minlength: 2,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  age: {
    type: Number,
    min: 0,
    max: 150
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  tags: [String],
  address: {
    city: String,
    district: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 创建模型
const User = mongoose.model('User', userSchema);
```

### 5.2 模型方法

```javascript
// 创建文档
const user = new User({
  name: '张三',
  email: 'zhangsan@example.com',
  age: 25
});

await user.save();

// 使用静态方法
const user = await User.create({
  name: '李四',
  email: 'lisi@example.com'
});

// 查询
const users = await User.find({ age: { $gte: 25 } });
const user = await User.findById('xxx');
const user = await User.findOne({ email: 'xxx@example.com' });

// 更新
const user = await User.findByIdAndUpdate('xxx', { age: 26 }, { new: true });
const result = await User.updateMany({ status: 'inactive' }, { status: 'archived' });

// 删除
await User.findByIdAndDelete('xxx');
await User.deleteOne({ email: 'xxx@example.com' });
```

### 5.3 虚拟属性

```javascript
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String
});

// 虚拟属性
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('fullName').set(function(name) {
  const [firstName, lastName] = name.split(' ');
  this.firstName = firstName;
  this.lastName = lastName;
});

// 启用虚拟属性 JSON 转换
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });
```

### 5.4 中间件（Hook）

```javascript
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String
});

// 保存前中间件
userSchema.pre('save', function(next) {
  if (this.isModified('password')) {
    this.password = bcrypt.hashSync(this.password, 10);
  }
  next();
});

// 保存后中间件
userSchema.post('save', function(doc) {
  console.log('用户已保存:', doc._id);
});

// 查询前中间件
userSchema.pre('findOneAndUpdate', function() {
  console.log('即将更新用户');
});
```

### 5.5 实例方法

```javascript
userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compareSync(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// 使用
const user = await User.findOne({ email: 'xxx@example.com' });
const isMatch = user.comparePassword('password123');
```

---

## 常见面试问题

### 问题 1：MongoDB 和 MySQL 的区别？

**答案：** MongoDB 是文档型数据库，存储 JSON 格式文档，灵活性强；MySQL 是关系型数据库，需要预先定义表结构，适合复杂关联查询。

### 问题 2：MongoDB 的索引优化原则？

**答案：** 为常用查询创建复合索引；遵循 ESR 规则安排索引字段顺序；避免创建过多索引；使用覆盖查询避免回表。

---

## 6. 高级特性

### 6.1 事务处理

```javascript
// MongoDB 4.0+ 支持多文档事务
const session = await mongoose.startSession();

try {
  await session.withTransaction(async () => {
    // 在事务中执行多个操作
    
    // 扣减用户余额
    await User.updateOne(
      { _id: userId },
      { $inc: { balance: -amount } },
      { session }
    );
    
    // 增加商户余额
    await Merchant.updateOne(
      { _id: merchantId },
      { $inc: { balance: amount } },
      { session }
    );
    
    // 创建交易记录
    await Transaction.create(
      [{
        userId,
        merchantId,
        amount,
        type: 'payment',
        status: 'completed'
      }],
      { session }
    );
  });
  
  console.log('事务提交成功');
} catch (error) {
  console.error('事务失败:', error);
} finally {
  await session.endSession();
}
```

### 6.2 Change Streams（变更流）

```javascript
// 监听集合变更
const changeStream = db.collection('users').watch();

changeStream.on('change', (change) => {
  console.log('变更类型:', change.operationType);
  
  switch (change.operationType) {
    case 'insert':
      console.log('新增文档:', change.fullDocument);
      break;
    case 'update':
      console.log('更新字段:', change.updateDescription.updatedFields);
      break;
    case 'delete':
      console.log('删除文档ID:', change.documentKey._id);
      break;
  }
});

// 监听特定条件
const changeStream = db.collection('orders').watch(
  [
    { $match: { 'fullDocument.status': 'completed' } },
    { $project: { 'fullDocument._id': 1, 'fullDocument.amount': 1 } }
  ]
);

// 关闭监听
changeStream.close();
```

### 6.3 GridFS（大文件存储）

```javascript
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

// 上传文件
async function uploadFile(fileBuffer, filename, metadata = {}) {
  const bucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads'
  });
  
  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      metadata,
      contentType: metadata.contentType
    });
    
    uploadStream.end(fileBuffer);
    
    uploadStream.on('finish', () => resolve(uploadStream.id));
    uploadStream.on('error', reject);
  });
}

// 下载文件
async function downloadFile(fileId) {
  const bucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads'
  });
  
  const chunks = [];
  return new Promise((resolve, reject) => {
    const downloadStream = bucket.openDownloadStream(fileId);
    
    downloadStream.on('data', chunk => chunks.push(chunk));
    downloadStream.on('end', () => resolve(Buffer.concat(chunks)));
    downloadStream.on('error', reject);
  });
}

// 删除文件
async function deleteFile(fileId) {
  const bucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads'
  });
  
  await bucket.delete(fileId);
}
```

### 6.4 全文搜索

```javascript
// 创建文本索引
await db.collection('articles').createIndex({
  title: 'text',
  content: 'text',
  tags: 'text'
}, {
  weights: {
    title: 10,    // 标题权重最高
    content: 5,
    tags: 3
  },
  name: 'article_text_index'
});

// 全文搜索
const results = await db.collection('articles').find(
  { $text: { $search: 'MongoDB 教程' } },
  { 
    score: { $meta: 'textScore' },
    sort: { score: { $meta: 'textScore' } }
  }
).toArray();

// 模糊搜索（支持中文分词需要额外配置）
const results = await db.collection('articles').find(
  { $text: { $search: '"完整短语"' } }  // 引号表示精确匹配
).toArray();
```

---

## 7. 性能优化进阶

### 7.1 查询优化分析

```javascript
// 使用 explain 分析查询计划
const explanation = await db.collection('users').find({
  age: { $gte: 25 },
  status: 'active'
}).explain('executionStats');

console.log('执行时间:', explanation.executionStats.executionTimeMillis);
console.log('扫描文档数:', explanation.executionStats.totalDocsExamined);
console.log('返回文档数:', explanation.executionStats.nReturned);
console.log('是否使用索引:', explanation.executionStats.executionStages.stage);

// 优化建议：
// 1. totalDocsExamined 应该接近 nReturned
// 2. 如果 stage 是 COLLSCAN，说明没有使用索引
// 3. 如果 executionTimeMillis 过高，考虑添加索引
```

### 7.2 索引策略

```javascript
// ESR 规则：Equal(等值) -> Sort(排序) -> Range(范围)

// 查询示例
// db.users.find({ status: 'active' }).sort({ age: -1 }).limit(10)
// 索引应该是：{ status: 1, age: -1 }

// 复合索引设计
await db.collection('orders').createIndex({
  userId: 1,        // 等值查询
  createdAt: -1,    // 排序
  amount: 1         // 范围查询
});

// 部分索引（减少索引大小）
await db.collection('orders').createIndex(
  { userId: 1, createdAt: -1 },
  { 
    partialFilterExpression: { 
      status: 'completed',
      amount: { $gt: 100 }
    }
  }
);

// TTL 索引（自动过期删除）
await db.collection('sessions').createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 3600 }  // 1小时后自动删除
);
```

### 7.3 分片集群

```javascript
// 启用分片
sh.enableSharding('mydb');

// 配置分片键
sh.shardCollection('mydb.users', { userId: 'hashed' });  // 哈希分片
sh.shardCollection('mydb.logs', { createdAt: 1 });       // 范围分片

// 分片键选择原则：
// 1. 高基数（值多样性高）
// 2. 写入分布均匀
// 3. 查询模式匹配（大多数查询包含分片键）
```

---

## 8. 与 Node.js 集成实战

### 8.1 完整的用户服务

```javascript
// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false  // 默认不返回密码
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'banned'],
    default: 'active'
  },
  profile: {
    avatar: String,
    bio: String,
    location: String,
    website: String
  },
  lastLoginAt: Date,
  loginCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

// 索引
userSchema.index({ email: 1 });
userSchema.index({ status: 1, createdAt: -1 });

// 密码加密中间件
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// 密码验证方法
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// 静态方法：查找活跃用户
userSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

// 实例方法：更新登录信息
userSchema.methods.updateLoginInfo = async function() {
  this.lastLoginAt = new Date();
  this.loginCount += 1;
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
```

### 8.2 服务层实现

```javascript
// services/userService.js
const User = require('../models/User');
const { AppError } = require('../utils/errors');

class UserService {
  /**
   * 创建用户
   */
  async create(userData) {
    // 检查邮箱是否已存在
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new AppError(409, 'EMAIL_EXISTS', '该邮箱已被注册');
    }
    
    const user = await User.create(userData);
    return user;
  }
  
  /**
   * 用户登录
   */
  async login(email, password) {
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      throw new AppError(401, 'INVALID_CREDENTIALS', '邮箱或密码错误');
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError(401, 'INVALID_CREDENTIALS', '邮箱或密码错误');
    }
    
    await user.updateLoginInfo();
    return user;
  }
  
  /**
   * 分页查询用户
   */
  async findAll(options = {}) {
    const {
      page = 1,
      limit = 20,
      sort = '-createdAt',
      status,
      role,
      search
    } = options;
    
    const query = {};
    
    if (status) query.status = status;
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const [users, total] = await Promise.all([
      User.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ]);
    
    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  /**
   * 更新用户
   */
  async update(id, updateData) {
    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', '用户不存在');
    }
    
    return user;
  }
  
  /**
   * 聚合统计
   */
  async getStatistics() {
    const stats = await User.aggregate([
      {
        $facet: {
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          byRole: [
            { $group: { _id: '$role', count: { $sum: 1 } } }
          ],
          recentLogins: [
            { $match: { lastLoginAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
            { $count: 'count' }
          ],
          total: [
            { $count: 'count' }
          ]
        }
      }
    ]);
    
    return stats[0];
  }
}

module.exports = new UserService();
```

---

## 9. 常见面试问题

### 问题 1：MongoDB 如何实现事务？

**答案：** MongoDB 4.0+ 支持多文档事务。使用 `session.withTransaction()` 方法，在回调中执行多个操作。事务保证 ACID 特性，但会影响性能，应谨慎使用。

### 问题 2：MongoDB 的聚合管道和 MapReduce 有什么区别？

**答案：** 聚合管道更高效，支持索引，语法简洁；MapReduce 更灵活，支持复杂逻辑，但性能较差。推荐优先使用聚合管道。

### 问题 3：如何优化 MongoDB 查询性能？

**答案：** 
1. 为常用查询创建合适的索引
2. 使用 explain 分析查询计划
3. 使用投影只返回需要的字段
4. 避免使用 $where 和正则表达式开头匹配
5. 使用分片分散负载

### 问题 4：MongoDB 如何处理大量数据？

**答案：** 
1. 使用分片集群水平扩展
2. 使用 TTL 索引自动清理过期数据
3. 使用归档策略将历史数据迁移到冷存储
4. 使用 GridFS 存储大文件

### 问题 5：Mongoose 的 populate 如何工作？

**答案：** populate 是 Mongoose 的关联查询功能，类似于 SQL 的 JOIN。它通过 ref 字段关联其他集合，在查询时自动填充关联文档。

```javascript
// 定义关联
const postSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User' }
});

// 使用 populate
const posts = await Post.find().populate('author', 'name email');
```

---

## 10. 最佳实践总结

### 10.1 Schema 设计原则

1. **根据查询模式设计**：优先考虑查询频率和模式
2. **避免过深嵌套**：嵌套层级不超过3层
3. **使用引用避免数据冗余**：一对多关系使用引用
4. **适度反范式化**：频繁访问的字段可以冗余

### 10.2 索引优化清单

- [ ] 为常用查询字段创建索引
- [ ] 复合索引遵循 ESR 规则
- [ ] 使用部分索引减少索引大小
- [ ] 定期审查和清理无用索引
- [ ] 监控索引使用情况

### 10.3 性能优化清单

- [ ] 使用投影减少返回数据
- [ ] 使用批量操作减少请求次数
- [ ] 使用连接池管理连接
- [ ] 启用压缩减少网络传输
- [ ] 使用读写分离分担负载

---

*本文档最后更新于 2026年3月*
