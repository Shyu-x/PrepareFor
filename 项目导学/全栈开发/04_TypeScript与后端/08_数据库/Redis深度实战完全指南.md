# Redis深度实战完全指南

> 全栈工程师视角：从底层原理到生产实践的完整体系
>
> 作者：全栈开发教学系统
>
> 版本：Redis 7.x

---

## 目录

1. [Redis不只是缓存](#1-redis不只是缓存)
2. [Redis数据结构深入](#2-redis数据结构深入)
3. [Redis持久化](#3-redis持久化)
4. [Redis集群](#4-redis集群)
5. [Redis应用场景](#5-redis应用场景)
6. [Redis高级特性](#6-redis高级特性)
7. [Redis安全](#7-redis安全)
8. [Redis运维](#8-redis运维)
9. [Redis + Node.js](#9-redis--nodejs)

---

## 前言

Redis（Remote Dictionary Server）是由Salvatore Sanfilippo开发的开源内存数据结构存储系统。自2009年首次发布以来，Redis已经成为现代Web架构中不可或缺的组件。从最初的简单缓存服务器，到如今支持多种数据结构的全能型数据库，Redis的发展历程诠释了"简单设计+极致执行"的技术哲学。

作为全栈工程师，我们每天都在与Redis打交道： session存储、缓存层、实时排行榜、消息队列、分布式锁...Redis的影子无处不在。然而，很多开发者对Redis的理解仅停留在"快速的缓存"这一层面，错过了Redis带来的更多可能性。

本指南将从全栈工程师的视角，系统讲解Redis的底层原理、数据结构、集群方案、生产级应用场景，以及与Node.js的集成实践。通过阅读本文档，你将能够：

- 理解Redis为什么这么快，以及如何选择合适的数据结构
- 掌握Redis持久化机制，根据业务需求做出合理配置
- 设计高可用的Redis集群架构
- 实现分布式锁、延迟队列、排行榜等复杂功能
- 在Node.js项目中高效、安全地使用Redis

---

## 1. Redis不只是缓存

### 1.1 Redis的定位：多面手的数据引擎

Redis的定位不是单一的缓存服务器，而是一个**内存数据结构存储系统**。它可以用作：

| 用途 | 说明 | 典型场景 |
|------|------|----------|
| **缓存层** | 热点数据加速访问 | 页面缓存、API响应缓存 |
| **会话存储** | 用户session管理 | Web应用会话、多节点session共享 |
| **消息队列** | 异步任务处理 | 订单处理、邮件发送、任务调度 |
| **分布式锁** | 跨进程互斥访问 | 库存扣减、订单幂等、限流控制 |
| **计数器** | 高并发计数 | UV统计、点赞数、访问频率 |
| **排行榜** | 有序集合操作 | 游戏排名、内容热度、内容推荐 |
| **实时分析** | 时序数据处理 | 实时统计、监控指标、用户行为 |

```typescript
// Redis多用途示例：一个用户系统的多种Redis应用

// 1. 缓存层 - 用户信息缓存
async function getUserInfo(userId: string) {
  const cacheKey = `user:info:${userId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const user = await db.query('SELECT * FROM users WHERE id = ?', userId);
  await redis.setex(cacheKey, 3600, JSON.stringify(user)); // 1小时过期
  return user;
}

// 2. 分布式锁 - 防止重复操作
async function processOrder(orderId: string) {
  const lockKey = `lock:order:${orderId}`;
  const lockValue = uuid();

  // SETNX + 过期时间 = 分布式锁
  const acquired = await redis.set(lockKey, lockValue, 'NX', 'EX', 30);
  if (!acquired) {
    throw new Error('订单正在处理中，请勿重复提交');
  }

  try {
    // 执行业务逻辑
    await doProcessOrder(orderId);
  } finally {
    // 释放锁（Lua脚本保证原子性）
    await redis.eval(
      `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end`,
      1, lockKey, lockValue
    );
  }
}

// 3. 计数器 - 访问频率限制
async function checkRateLimit(userId: string, maxRequests: number, windowSeconds: number) {
  const key = `ratelimit:${userId}`;

  const multi = redis.multi();
  multi.incr(key);
  multi.expire(key, windowSeconds);
  const results = await multi.exec();

  const currentCount = results[0][1];
  return currentCount <= maxRequests;
}

// 4. 排行榜 - ZSet实现
async function incrementUserScore(userId: string, increment: number) {
  await redis.zincrby('leaderboard:total_score', increment, userId);
}

async function getTopUsers(limit: number = 10) {
  return redis.zrevrange('leaderboard:total_score', 0, limit - 1, 'WITHSCORES');
}
```

### 1.2 为什么Redis这么快：底层架构解析

Redis的高性能源于其精心设计的底层架构：

```
┌─────────────────────────────────────────────────────────────────┐
│                        Redis 高性能架构                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Client ──────► Event Loop (I/O多路复用) ──────► Command Handler │
│                          │                                      │
│                          ▼                                      │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    单线程执行引擎                         │   │
│   │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │   │
│   │  │  命令   │  │  命令   │  │  命令   │  │  命令   │    │   │
│   │  │  解析   │  │  校验   │  │  执行   │  │  响应   │    │   │
│   │  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │   │
│   └─────────────────────────────────────────────────────────┘   │
│                          │                                      │
│                          ▼                                      │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    内存数据结构                            │   │
│   │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐               │   │
│   │  │SDS  │ │Dict │ │Zip  │ │QList│ │Skip │               │   │
│   │  │String│ │Hash │ │List │ │ List│ │ZSet │               │   │
│   │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘               │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 1.2.1 内存存储：速度的根基

Redis数据存储在内存中，而内存访问速度比磁盘快**100-1000倍**：

| 存储介质 | 读取速度 | 随机访问 | 备注 |
|----------|----------|----------|------|
| CPU缓存 | 0.5ns | 是 | L1/L2/L3 |
| 内存 | 100ns | 是 | DDR4/DDR5 |
| SSD | 100μs | 是 | NVMe |
| 机械硬盘 | 10ms | 是 | SATA |
| Redis | ~100ns | 是 | 内存访问 |

内存的随机访问特性使得Redis可以做到O(1)时间复杂度的数据读写，这是Redis高性能的根本原因。

#### 1.2.2 单线程模型：简化与高效

Redis采用单线程模型，这里"单线程"指的是**命令执行线程**，而不是整个Redis进程：

```
Redis 6 之前的单线程模型：
                    ┌──────────────┐
                    │   主线程     │
                    │  (单线程)    │
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   ┌─────────┐       ┌─────────┐        ┌─────────┐
   │ socket  │       │  命令   │        │  响应   │
   │  读取   │ ────► │  执行   │ ────►  │  发送   │
   └─────────┘       └─────────┘        └─────────┘
```

**为什么单线程这么快？**

1. **避免锁竞争**：多线程需要复杂的锁机制来保证数据一致性，单线程完全避免了这个问题
2. **减少上下文切换**：CPU不需要在多个线程间切换
3. **简化开发模型**：开发者不需要考虑线程安全问题
4. **高效利用CPU缓存**：数据访问模式更可预测

**Redis 6+ 的多线程改进**：

Redis 6引入了I/O多线程，用于处理网络I/O的读取和响应，而命令执行仍然是单线程：

```
Redis 6+ 多线程I/O模型：
                           ┌──────────────┐
                           │   主线程     │
                           │ (命令执行)   │
                           └──────┬───────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
   ┌─────────┐               ┌─────────┐               ┌─────────┐
   │ I/O     │               │ I/O     │               │ I/O     │
   │ 线程1   │               │ 线程2   │               │ 线程3   │
   └─────────┘               └─────────┘               └─────────┘
        ▲                         ▲                         ▲
        │                         │                         │
        └─────────────────────────┴─────────────────────────┘
                                  │
                           ┌──────┴───────┐
                           │  socket      │
                           │  读写        │
                           └──────────────┘
```

#### 1.2.3 I/O多路复用：高效的网络处理

传统的网络服务器采用同步阻塞I/O，每个连接需要一个线程处理：

```
传统阻塞I/O模型（1连接1线程）：
   Client1 ──► Thread1 ──► 阻塞等待 ──► 响应
   Client2 ──► Thread2 ──► 阻塞等待 ──► 响应
   Client3 ──► Thread3 ──► 阻塞等待 ──► 响应
   ...

   问题：连接数增长时，线程数爆炸，CPU忙于上下文切换
```

Redis使用I/O多路复用（Linux的epoll/FreeBSD的kqueue/Windows的IOCP）同时监听多个socket：

```
I/O多路复用模型：

   ┌─────────────────────────────────────────┐
   │           Event Loop (epoll)            │
   │  ┌─────────────────────────────────┐    │
   │  │  监听多个 socket 的就绪事件      │    │
   │  └─────────────────────────────────┘    │
   │         ▲           ▲           ▲       │
   │         │           │           │       │
   │    Socket1      Socket2     Socket3     │
   └─────────────────────────────────────────┘

   优势：单线程同时处理 thousands of connections
```

#### 1.2.4 纯内存操作：无磁盘I/O阻塞

Redis的核心数据操作完全在内存中完成，没有任何磁盘I/O阻塞：

- 读取数据：直接从内存读取，O(1)或O(logN)
- 写入数据：直接写入内存，定期异步持久化到磁盘
- 即使开启持久化，RDB快照和AOF重写也在后台线程执行，不阻塞主线程

### 1.3 数据结构：五大基础类型

Redis支持五种基础数据结构，每种结构都有其特定的使用场景：

| 数据结构 | 底层实现 | 时间复杂度 | 典型用途 |
|----------|----------|------------|----------|
| **String** | SDS (Simple Dynamic String) | O(1) | 缓存、计数器、分布式锁 |
| **Hash** | ziplist / hashtable | O(1) / O(N) | 对象存储、配置缓存 |
| **List** | quicklist | O(1) / O(N) | 消息队列、最新N条记录 |
| **Set** | intset / hashtable | O(1) / O(N) | 标签系统、去重 |
| **ZSet** | skiplist + ziplist | O(logN) / O(N) | 排行榜、有序消息 |

```typescript
// Redis数据结构示例

// String - 最简单的数据结构
await redis.set('user:count', 0);
await redis.incr('user:count');           // 原子递增
const count = await redis.get('user:count');

// Hash - 存储对象
await redis.hset('user:1001', 'name', '张三', 'age', '28', 'city', '北京');
const user = await redis.hgetall('user:1001');
// { name: '张三', age: '28', city: '北京' }
await redis.hincrby('user:1001', 'age', 1); // 年龄+1

// List - 有序列表（可重复）
await redis.lpush('history', 'page1', 'page2', 'page3');
const latest = await redis.lrange('history', 0, 2); // 获取最新3条
await redis.ltrim('history', 0, 99);                  // 只保留最新100条

// Set - 无序集合（不重复）
await redis.sadd('tags:article:1', 'Redis', 'Node.js', '数据库');
const allTags = await redis.smembers('tags:article:1');
const isMember = await redis.sismember('tags:article:1', 'Redis'); // 检查是否包含

// ZSet - 有序集合（按分数排序）
await redis.zadd('leaderboard', 1000, 'user1', 2000, 'user2', 1500, 'user3');
const top3 = await redis.zrevrange('leaderboard', 0, 2, 'WITHSCORES');
// [['user2', '2000'], ['user3', '1500'], ['user1', '1000']]
const rank = await redis.zrevrank('leaderboard', 'user3'); // 获取排名（0-based）
```

### 1.4 我的思考：Redis是全栈工程师的瑞士军刀

作为全栈工程师，我们面临着各种技术挑战：前端、后端、数据库、缓存、消息队列...Redis以其丰富的功能，成为了我日常工作中的"瑞士军刀"：

**为什么Redis如此重要？**

1. **统一数据访问层**：不需要为每种需求引入不同的技术栈
2. **高性能**：内存操作 + 单线程 + I/O多路复用 = 极致性能
3. **简化架构**：用一个Redis解决缓存、锁、队列、计数器等多种需求
4. **降低成本**：相比付费解决方案，Redis是开源免费的
5. **生态丰富**：Redis Cluster、Redis Sentinel、Redis Module满足各种部署需求

**全栈工程师使用Redis的场景**：

```
前端场景：
├── 浏览器端数据缓存（通过API）
├── WebSocket实时通信状态
└── 用户行为追踪

Node.js后端场景：
├── Session共享存储
├── API响应缓存
├── 分布式锁
├── 限流控制
└── 消息队列

DevOps场景：
├── 配置中心
├── 分布式协调
├── 服务发现
└── 分布式缓存
```

---

## 2. Redis数据结构深入

### 2.1 String：SDS简单动态字符串

Redis的String类型不是使用C语言原生的char数组，而是实现了SDS（Simple Dynamic String）：

```
C语言字符串 vs SDS：

C语言字符串：
┌───┬───┬───┬───┬───┬───┐
│ H │ e │ l │ l │ o │ \0│  ──► 连续内存，长度固定
└───┴───┴───┴───┴───┴───┘

SDS (Redis字符串)：
┌───┬───┬───┬───┬───┬───┬───┬───┬───┐
│ 6 │   │ H │ e │ l │ l │ o │   │   │  ──► 元数据 + 实际数据
└───┴───┴───┴───┴───┴───┴───┴───┴───┘
  │        ▲                           ▲
  │        │                           │
  │    字符数组                    预分配空间
  │  (char数组)                  (避免频繁重分配)
  │
  长度字段(len)
```

**SDS的六大优势**：

| 特性 | 说明 | 性能影响 |
|------|------|----------|
| **O(1)长度获取** | 字符串头部存储长度 | 快速判断字符串边界 |
| **二进制安全** | 不依赖\0判断结束 | 可存储任意二进制数据 |
| **防止缓冲区溢出** | 自动扩容 | 避免C字符串溢出自攻击 |
| **减少内存重分配** | 空间预分配 + 惰性释放 | 提升字符串操作效率 |
| **兼容C字符串** | 保留末尾\0 | 可直接使用C字符串函数 |
| **长度扩展优化** | 小于1MB时倍增，大于1MB时+1MB | 平衡内存使用和重分配次数 |

```typescript
// SDS的JavaScript/TypeScript实现模拟

class SDS {
  private len: number;      // 已使用长度
  private alloc: number;    // 总分配空间
  private content: Buffer;  // 实际数据

  constructor(str: string = '') {
    this.content = Buffer.from(str);
    this.len = str.length;
    this.alloc = str.length;
  }

  // O(1) 长度获取
  length(): number {
    return this.len;
  }

  // 追加操作（自动扩容）
  append(追加内容: string): this {
    const newLen = this.len + 追加内容.length;

    // 空间不足，需要扩容
    if (newLen > this.alloc) {
      // 扩容策略：小于1MB时倍增，大于1MB时+1MB
      const newAlloc = newLen < 1024 * 1024
        ? newLen * 2
        : newLen + 1024 * 1024;

      const newContent = Buffer.alloc(newAlloc);
      this.content.copy(newContent);
      this.content = newContent;
      this.alloc = newAlloc;
    }

    // 复制新内容
    this.content.write(追加内容, this.len);
    this.len = newLen;

    return this;
  }

  // 惰性空间释放（缩短时不立即回收空间）
  trim(newLength: number): this {
    this.len = newLength;
    // 不立即回收alloc中的空闲空间
    return this;
  }
}
```

### 2.2 Hash：ziplist vs hashtable

Hash类型会根据数据量自动选择编码：

```
Hash编码选择：

数据量小（默认配置）：
┌─────┬─────┬─────┬─────┬─────┐
│ z1  │ v1  │ z2  │ v2  │ ... │  ──► ziplist（压缩列表，内存连续）
└─────┴─────┴─────┴─────┴─────┘

数据量大时：
┌───────────────────────────────┐
│      hashtable（字典）        │
│  ┌─────┐      ┌─────┐       │
│  │key1 │ ───► │value1│       │
│  ├─────┤      └─────┘       │
│  │key2 │ ───► │value2│       │
│  ├─────┤      └─────┘       │
│  │ ... │      │ ... │       │
│  └─────┘      └─────┘       │
└───────────────────────────────┘
```

**ziplist（压缩列表）**：

当Hash字段数较少（<512）且每个字段值较短时，Redis使用ziplist：

- 内存连续，节省指针开销
- 适合小数据量的快速访问
- 插入/删除需要移动后续元素，O(N)

**hashtable（字典）**：

当Hash字段数超过阈值或某个value超过阈值时，转换为hashtable：

- O(1) 平均时间复杂度
- 需要额外的指针存储
- 适合大数据量的快速访问

```typescript
// ioredis中Hash操作的性能考量

import Redis from 'ioredis';

// 小Hash - 使用ziplist，适合频繁读取
// 场景：用户基本信息（字段数<512）
async function cacheUserProfile(userId: string, profile: UserProfile) {
  const key = `user:profile:${userId}`;

  // 使用hset一次设置多个字段
  await redis.hset(key, {
    name: profile.name,
    avatar: profile.avatar,
    bio: profile.bio,
    // ... 其他字段
  });

  // 设置过期时间
  await redis.expire(key, 86400); // 24小时
}

// 大Hash - 字段数>512时，考虑拆分
async function cacheProductDetails(productId: string, details: ProductDetails) {
  const basicKey = `product:basic:${productId}`;
  const detailKey = `product:detail:${productId}`;
  const stockKey = `product:stock:${productId}`;

  // 拆分为多个Hash，按访问频率分组
  await redis.hset(basicKey, {
    name: details.name,
    category: details.category,
    brand: details.brand,
  });

  await redis.hset(detailKey, {
    description: details.description,
    spec: JSON.stringify(details.spec),
    images: JSON.stringify(details.images),
  });

  await redis.hset(stockKey, {
    stock: details.stock.toString(),
    reserved: details.reserved.toString(),
  });
}
```

### 2.3 List：quicklist实现

Redis 3.2之前，List使用ziplist或linkedlist作为底层实现。Redis 3.2之后，统一使用quicklist：

```
quicklist结构（双向链表 + ziplist）：

┌───┐   ┌───┐   ┌───┐   ┌───┐
│ * │◄─►│ * │◄─►│ * │◄─►│ * │   ──► 双向链表节点
└─┬─┘   └─┬─┘   └─┬─┘   └─┬─┘
  │       │       │       │
  ▼       ▼       ▼       ▼
┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│ziplist│ │ziplist│ │ziplist│ │ziplist│  ──► 每个节点是压缩列表
└─────┘ └─────┘ └─────┘ └─────┘
```

**quicklist的优势**：

| 特性 | 说明 |
|------|------|
| **内存效率** | ziplist节省指针开销 |
| **插入效率** | 链表头尾O(1)插入 |
| **折中方案** | 平衡内存使用和操作效率 |
| **可配置** | list-max-ziplist-size控制每个ziplist大小 |

```typescript
// List实现消息队列

class RedisMessageQueue {
  constructor(private redis: Redis, private queueName: string) {}

  // 生产者 - 右插入
  async enqueue(message: Message): Promise<void> {
    await this.redis.rpush(
      this.queueName,
      JSON.stringify({
        id: uuid(),
        payload: message,
        timestamp: Date.now(),
      })
    );
  }

  // 消费者 - 左弹出（阻塞）
  async dequeue(timeout: number = 0): Promise<Message | null> {
    const result = await this.redis.blpop(this.queueName, timeout);
    if (!result) return null;

    const [, messageStr] = result;
    return JSON.parse(messageStr);
  }

  // 批量处理
  async processBatch(
    batchSize: number,
    processor: (messages: Message[]) => Promise<void>
  ): Promise<void> {
    const messages: Message[] = [];

    // 使用pipeline快速获取多条消息
    const pipeline = this.redis.pipeline();
    for (let i = 0; i < batchSize; i++) {
      pipeline.lpop(this.queueName);
    }

    const results = await pipeline.exec();
    for (const [err, value] of results!) {
      if (!err && value) {
        messages.push(JSON.parse(value as string));
      }
    }

    if (messages.length > 0) {
      await processor(messages);
    }
  }

  // 获取队列长度
  async length(): Promise<number> {
    return this.redis.llen(this.queueName);
  }

  // 获取最新N条消息（不删除）
  async peek(count: number = 10): Promise<Message[]> {
    const items = await this.redis.lrange(this.queueName, -count, -1);
    return items.map(item => JSON.parse(item));
  }
}

// 使用示例
const queue = new RedisMessageQueue(redis, 'order:processing');

await queue.enqueue({ orderId: '1001', type: 'create' });
await queue.enqueue({ orderId: '1002', type: 'create' });

const message = await queue.dequeue(5); // 阻塞最多5秒
console.log('收到消息:', message);
```

### 2.4 Set：intset vs hashtable

Set类型的底层实现根据元素类型选择：

```
Set编码选择：

全部为整数元素（默认<512个）：
┌───────┬───────┬───────┬───────┐
│ intset│  1    │  2    │  100  │  ──► 整数集合，内存紧凑
└───────┴───────┴───────┴───────┘

包含字符串或元素超过阈值：
┌─────────────────────────────────┐
│        hashtable（字典）        │
│     所有元素作为字典的key        │
│     value统一为null              │
└─────────────────────────────────┘
```

**intset（整数集合）**：

当Set只包含整数且元素数量较少时使用，内存非常紧凑：

- 使用字节数组存储，无需额外指针
- 支持升序排列，支持二分查找
- 升级机制：元素类型从int16升级到int32/int64

```typescript
// Set应用：标签系统

class TagSystem {
  constructor(private redis: Redis) {}

  // 添加标签（自动去重）
  async addTag(entityType: string, entityId: string, tags: string[]): Promise<void> {
    const key = `tags:${entityType}:${entityId}`;
    await this.redis.sadd(key, ...tags);
  }

  // 移除标签
  async removeTag(entityType: string, entityId: string, tags: string[]): Promise<void> {
    const key = `tags:${entityType}:${entityId}`;
    await this.redis.srem(key, ...tags);
  }

  // 获取所有标签
  async getTags(entityType: string, entityId: string): Promise<string[]> {
    const key = `tags:${entityType}:${entityId}`;
    return this.redis.smembers(key);
  }

  // 检查是否有某个标签
  async hasTag(entityType: string, entityId: string, tag: string): Promise<boolean> {
    const key = `tags:${entityType}:${entityId}`;
    return this.redis.sismember(key, tag) === 1;
  }

  // 获取有所有指定标签的实体
  async getEntitiesWithAllTags(
    entityType: string,
    tagSet: string[]
  ): Promise<string[]> {
    if (tagSet.length === 0) return [];

    // 找出所有标签的交集
    const keys = tagSet.map(tag => `tags:${entityType}:*:${tag}`);
    // 注意：这里需要用scan匹配真实key，或者维护tag到实体的反向索引

    // 方案1：使用Redis Set的SUNION求并集
    const allKeys = await this.redis.keys(`tags:${entityType}:*`);

    // 方案2：维护反向索引（推荐大数据量）
    // tags:index:nodejs -> Set{entity1, entity2, ...}
  }

  // 获取标签总数
  async getTagCount(entityType: string, entityId: string): Promise<number> {
    const key = `tags:${entityType}:${entityId}`;
    return this.redis.scard(key);
  }
}
```

### 2.5 ZSet：skiplist vs ziplist

ZSet（有序集合）是Redis最复杂的数据结构，同时使用跳表和压缩列表：

```
ZSet底层结构（skiplist + hashtable）：

┌─────────────────────────────────────────────────────────┐
│                    ZSet 完整结构                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  skiplist (跳表)           hashtable (字典)             │
│  ┌───┐                      ┌─────────┐                 │
│  │ 1 │ ─┐                   │ member1 │ ──► score1     │
│  ├───┤  │                   │ member2 │ ──► score2     │
│  │ 2 │──┼──┐                │ member3 │ ──► score3     │
│  ├───┤  │  │                │   ...   │    ...         │
│  │ 4 │──┼──┼──┐             └─────────┘                 │
│  ├───┤  │  │  │                                       │
│  │ 6 │  │  │  │  ──► 双向索引：skiplist保证有序，       │
│  └───┘  │  │  │      hashtable保证O(1)查找             │
│         │  │  │                                        │
└─────────┴──┴──┴────────────────────────────────────────┘

skiplist节点结构：
┌───────────┬───────────┬────────────┐
│  forward  │   span    │   member   │   ──► 多层索引加速范围查询
├───────────┼───────────┼────────────┤
│  backward │   score   │    data    │
└───────────┴───────────┴────────────┘
```

**为什么ZSet使用跳表而不是红黑树？**

| 特性 | 跳表 | 红黑树 |
|------|------|--------|
| 范围查询 | O(logN) + 输出 | O(logN) + 输出 |
| 插入/删除 | O(logN) | O(logN) |
| 实现复杂度 | 简单 | 复杂 |
| 有序遍历 | 天然支持 | 需要中序遍历 |
| 锁竞争 | 无锁实现可能 | 需要读写锁 |
| 内存占用 | 略高（多层索引） | 较低 |

跳表的实现比红黑树简单很多，而且范围查询更加自然，因此Redis选择了跳表。

```typescript
// ZSet应用：实时排行榜

class Leaderboard {
  constructor(private redis: Redis, private leaderboardKey: string) {}

  // 更新用户分数（增加或减少）
  async updateScore(userId: string, delta: number): Promise<number> {
    const newScore = await this.redis.zincrby(this.leaderboardKey, delta, userId);
    return parseFloat(newScore);
  }

  // 设置用户分数（绝对值）
  async setScore(userId: string, score: number): Promise<void> {
    await this.redis.zadd(this.leaderboardKey, score, userId);
  }

  // 获取用户排名（0-based，从高到低）
  async getRank(userId: string): Promise<number | null> {
    const rank = await this.redis.zrevrank(this.leaderboardKey, userId);
    return rank; // null表示不存在
  }

  // 获取用户分数
  async getScore(userId: string): Promise<number | null> {
    const score = await this.redis.zscore(this.leaderboardKey, userId);
    return score ? parseFloat(score) : null;
  }

  // 获取Top N用户
  async getTopUsers(count: number = 10): Promise<Array<{userId: string, score: number}>> {
    const results = await this.redis.zrevrange(
      this.leaderboardKey,
      0,
      count - 1,
      'WITHSCORES'
    );

    const users: Array<{userId: string, score: number}> = [];
    for (let i = 0; i < results.length; i += 2) {
      users.push({
        userId: results[i],
        score: parseFloat(results[i + 1]),
      });
    }
    return users;
  }

  // 获取指定排名范围的用户
  async getUsersByRankRange(
    start: number,
    end: number
  ): Promise<Array<{userId: string, score: number, rank: number}>> {
    const results = await this.redis.zrevrange(
      this.leaderboardKey,
      start,
      end,
      'WITHSCORES'
    );

    const users: Array<{userId: string, score: number, rank: number}> = [];
    for (let i = 0; i < results.length; i += 2) {
      users.push({
        userId: results[i],
        score: parseFloat(results[i + 1]),
        rank: start + i / 2,
      });
    }
    return users;
  }

  // 获取用户周围的用户（类似游戏中查看附近玩家）
  async getUsersAroundUser(userId: string, range: number = 5): Promise<{
    above: Array<{userId: string, score: number}>,
    user: {userId: string, score: number, rank: number},
    below: Array<{userId: string, score: number}>
  }> {
    const rank = await this.getRank(userId);
    if (rank === null) {
      throw new Error('用户不在排行榜中');
    }

    const score = await this.getScore(userId);

    // 获取排名更高的（上面）
    const aboveStart = Math.max(0, rank - range);
    const above = await this.getUsersByRankRange(aboveStart, rank - 1);

    // 获取排名更低的（下面）
    const below = await this.getUsersByRankRange(rank + 1, rank + range);

    return {
      above,
      user: { userId, score: score!, rank },
      below,
    };
  }

  // 删除用户
  async removeUser(userId: string): Promise<void> {
    await this.redis.zrem(this.leaderboardKey, userId);
  }

  // 获取排行榜总数
  async getTotalCount(): Promise<number> {
    return this.redis.zcard(this.leaderboardKey);
  }

  // 获取指定分数范围内的用户数
  async getCountByScoreRange(min: number, max: number): Promise<number> {
    return this.redis.zcount(this.leaderboardKey, min, max);
  }
}

// 多维度排行榜
class MultiDimensionLeaderboard {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  // 游戏排行榜：多个维度
  async updateGameScores(userId: string, scores: {
    kills?: number;
    damage?: number;
    healing?: number;
    wins?: number;
  }): Promise<void> {
    const pipeline = this.redis.pipeline();

    if (scores.kills !== undefined) {
      pipeline.zincrby('leaderboard:kills', scores.kills, userId);
    }
    if (scores.damage !== undefined) {
      pipeline.zincrby('leaderboard:damage', scores.damage, userId);
    }
    if (scores.healing !== undefined) {
      pipeline.zincrby('leaderboard:healing', scores.healing, userId);
    }
    if (scores.wins !== undefined) {
      pipeline.zincrby('leaderboard:wins', scores.wins, userId);
    }

    // 综合评分
    pipeline.zincrby('leaderboard:total',
      (scores.kills || 0) * 10 +
      (scores.damage || 0) * 1 +
      (scores.healing || 0) * 2 +
      (scores.wins || 0) * 50,
      userId
    );

    await pipeline.exec();
  }

  // 获取用户在各维度的排名
  async getUserAllRanks(userId: string): Promise<Record<string, {rank: number, score: number}>> {
    const ranks = await this.redis.pipeline()
      .zrevrank('leaderboard:kills', userId)
      .zscore('leaderboard:kills', userId)
      .zrevrank('leaderboard:damage', userId)
      .zscore('leaderboard:damage', userId)
      .zrevrank('leaderboard:healing', userId)
      .zscore('leaderboard:healing', userId)
      .zrevrank('leaderboard:wins', userId)
      .zscore('leaderboard:wins', userId)
      .zrevrank('leaderboard:total', userId)
      .zscore('leaderboard:total', userId)
      .exec();

    return {
      kills: { rank: ranks[0][1], score: parseFloat(ranks[1][1] as string || '0') },
      damage: { rank: ranks[2][1], score: parseFloat(ranks[3][1] as string || '0') },
      healing: { rank: ranks[4][1], score: parseFloat(ranks[5][1] as string || '0') },
      wins: { rank: ranks[6][1], score: parseFloat(ranks[7][1] as string || '0') },
      total: { rank: ranks[8][1], score: parseFloat(ranks[9][1] as string || '0') },
    };
  }
}
```

### 2.6 我的思考：为什么Redis有这么多种数据结构

初学Redis时，很多人会疑惑：为什么不能只用一个Hash把所有数据都存了？

**数据结构选择的核心原则：合适的数据结构做合适的事**

| 数据结构 | 核心优势 | 选型场景 |
|----------|----------|----------|
| String | O(1)读写，原子操作 | 缓存、计数器、锁 |
| Hash | 字段级操作 | 对象存储、配置 |
| List | 顺序保证，可两端的操作 | 队列、最新消息 |
| Set | 自动去重，集合运算 | 标签、好友关系 |
| ZSet | 自动排序，排名计算 | 排行榜、有序消息 |

**性能差异的现实考量**：

```
操作类型                      时间复杂度
─────────────────────────────────────────
SET/GET                       O(1)
INCR/DECR                     O(1)
HSET/HGET                     O(1)
HGETALL (Hash字段少时)         O(N)
LPUSH/RPOP                    O(1)
LINSERT                       O(N)
SADD                          O(1)
SINTER (小集合)               O(N)
SINTER (大集合)               O(M*N) 可能很慢
ZADD                          O(logN)
ZRANGE                        O(logN + M)
```

**全栈工程师的数据结构选择心法**：

1. **先想读写模式**：读多还是写多？需要排序吗？
2. **再看数据特征**：数据量大小？是否需要去重？
3. **最后看操作需求**：需要集合运算吗？需要范围查询吗？

---

## 3. Redis持久化

### 3.1 持久化的重要性

Redis的数据存储在内存中，这意味着如果没有持久化机制，一旦服务器重启，所有数据都会丢失。在生产环境中，数据的持久性和可用性同样重要。

```
持久化 vs 性能：

┌─────────────────┐     ┌─────────────────┐
│   内存模式       │     │   持久化模式     │
│   最快           │     │   有持久化开销   │
│   数据易丢失      │     │   数据更安全     │
└─────────────────┘     └─────────────────┘
         │                       │
         ▼                       ▼
    开发/测试环境          生产环境必须
```

### 3.2 RDB：快照持久化

RDB（Redis Database）是一种快照持久化方式，它会在特定的时间点生成数据集的完整快照。

```
RDB快照时机：

┌─────────────────────────────────────────────────────────┐
│                    触发RDB快照的时机                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. 定时触发（配置）                                      │
│     save 900 1      ──► 900秒内≥1次写操作                │
│     save 300 10     ──► 300秒内≥10次写操作               │
│     save 60 10000   ──► 60秒内≥10000次写操作             │
│                                                         │
│  2. BGSAVE手动触发                                       │
│     redis-cli BGSAVE   ──► 后台异步执行，不阻塞主线程     │
│                                                         │
│  3. FLUSHALL + AOF关闭时                                 │
│     (危险！会清空RDB文件)                                 │
│                                                         │
│  4. 主从复制时                                            │
│     从库自动触发                                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**RDB的优势**：

| 特性 | 说明 |
|------|------|
| **紧凑文件** | 单文件包含完整数据，适合备份和灾难恢复 |
| **恢复快** | 直接加载RDB文件，无需重放命令 |
| **性能高** | 子进程完成持久化，不阻塞主线程 |
| **适合大数据集** | 大数据集下比AOF恢复更快 |

**RDB的劣势**：

| 特性 | 说明 |
|------|------|
| **可能丢失数据** | 两次快照之间的数据会丢失 |
| **fork耗时** | 数据集大时，fork可能较慢 |
| **无法实时持久化** | 无法做到每秒甚至每毫秒持久化 |

```conf
# RDB配置示例 (redis.conf)

# 快照保存策略
save 900 1      # 900秒内≥1次写操作
save 300 10     # 300秒内≥10次写操作
save 60 10000   # 60秒内≥10000次写操作

# 关闭RDB快照（如果只用AOF）
# save ""

# RDB文件名称
dbfilename dump.rdb

# RDB文件目录
dir /var/lib/redis

# bgsave出错时是否停止写入
stop-writes-on-bgsave-error yes

# 是否压缩RDB文件
rdbcompression yes

# 是否校验RDB文件
rdbchecksum yes
```

### 3.3 AOF：追加文件持久化

AOF（Append Only File）通过记录每次写操作命令来实现持久化。

```
AOF持久化流程：

客户端 ──► 主线程 ──► 写入命令 ──► 缓冲区 ──► 刷盘策略 ──► AOF文件
                                      │
                                      ▼
                              ┌───────────────┐
                              │   aof-use-rdb-preamble │
                              │   (混合持久化)  │
                              └───────────────┘
```

**AOF刷盘策略**：

| 策略 | 说明 | 安全性 | 性能 |
|------|------|--------|------|
| **always** | 每个命令都刷盘 | 最高 | 最低 |
| **everysec** | 每秒刷盘一次（默认） | 较好 | 较高 |
| **no** | 由操作系统决定 | 最低 | 最高 |

**AOF的重写机制**：

随着写操作增加，AOF文件会越来越大。AOF重写可以压缩AOF文件：

```conf
# AOF配置示例

# 开启AOF持久化
appendonly yes

# AOF文件名称
appendfilename "appendonly.aof"

# 刷盘策略
appendfsync everysec

# AOF重写策略
auto-aof-rewrite-percentage 100  # 文件比上次重写大100%时触发
auto-aof-rewrite-min-size 64mb   # 文件至少达到64MB时触发

# 混合持久化（Redis 4.0+）
aof-use-rdb-preamble yes
```

**AOF的优势**：

| 特性 | 说明 |
|------|------|
| **数据安全性高** | 可配置每秒或每个命令持久化 |
| **日志格式** | 易于理解和修复 |
| **自动重写** | 后台压缩AOF文件 |
| **支持混合持久化** | 4.0+支持RDB+AOF混合 |

**AOF的劣势**：

| 特性 | 说明 |
|------|------|
| **文件较大** | 记录所有命令，包含冗余 |
| **恢复慢** | 需要重放所有命令 |
| **可能阻塞** | AOF重写时可能短暂阻塞 |

### 3.4 混合持久化：4.0+的新特性

Redis 4.0引入了混合持久化，结合RDB和AOF的优点：

```
混合持久化原理：

┌─────────────────────────────────────────────────────────┐
│                    混合持久化文件                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐  ┌─────────────────────────────────┐  │
│  │    RDB      │  │            AOF                   │  │
│  │   头部      │  │       (增量命令)                 │  │
│  │  (二进制)   │  │                                 │  │
│  └─────────────┘  │  *3\r\n$6\r\nSELECT\r\n...      │  │
│                   │  *3\r\n$5\r\nHSET\r\n...         │  │
│                   └─────────────────────────────────┘  │
│                                                         │
│  恢复时：先加载RDB部分，再重放AOF部分                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

```conf
# 开启混合持久化
aof-use-rdb-preamble yes
```

### 3.5 实战：AOF配置优化

根据业务场景优化AOF配置：

```typescript
// AOF配置的业务场景选择

/**
 * 高数据安全性场景（金融、订单）
 * 配置：appendfsync always
 */
const highSafetyConfig = {
  appendonly: true,
  appendfsync: 'always',  // 每个命令都刷盘
};

/**
 * 平衡场景（一般Web应用）
 * 配置：appendfsync everysec
 */
const balancedConfig = {
  appendonly: true,
  appendfsync: 'everysec',  // 每秒刷盘
};

/**
 * 高性能场景（缓存、日志）
 * 配置：appendfsync no
 */
const highPerformanceConfig = {
  appendonly: true,
  appendfsync: 'no',  // 依赖系统刷盘
};
```

```typescript
// 生产环境的AOF运维脚本

import Redis from 'ioredis';

// 检查AOF重写状态
async function checkAOFStatus(redis: Redis) {
  const info = await redis.info('persistence');

  console.log('=== AOF状态检查 ===');
  console.log(info);

  // 解析关键指标
  const lines = info.split('\r\n');
  const metrics: Record<string, string> = {};

  for (const line of lines) {
    const [key, value] = line.split(':');
    if (key && value) {
      metrics[key.trim()] = value.trim();
    }
  }

  console.log(`AOF当前大小: ${metrics['aof_current_size']}`);
  console.log(`AOF基础大小: ${metrics['aof_base_size']}`);
  console.log(`AOF重写进行中: ${metrics['aof_rewrite_in_progress']}`);
  console.log(`AOF待重写大小: ${metrics['aof_pending_rewrite']}`);
}

// 手动触发AOF重写
async function triggerAOF rewrite(redis: Redis) {
  // 后台重写
  await redis.bgrewriteaof();
  console.log('AOF重写已触发');
}

// 等待AOF重写完成
async function waitForAOF rewrite(redis: Redis, timeout: number = 60000) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const status = await redis.info('persistence');
    const inProgress = status.includes('aof_rewrite_in_progress:1');

    if (!inProgress) {
      console.log('AOF重写完成');
      return true;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error('AOF重写超时');
}
```

### 3.6 我的思考：持久化选择影响数据安全

持久化策略的选择直接影响数据安全等级，需要根据业务场景权衡：

```
持久化策略选择矩阵：

                    数据安全性
                         ▲
                         │
              最高 ◄─────┼─────► 最低
                         │
    ┌─────────────────────┼─────────────────────┐
    │                     │                     │
    │   RDB + AOF         │      only AOF       │
    │   (混合模式)         │      (always)       │
    │                     │                     │
    │   推荐：金融、       │   推荐：金融、       │
    │   订单、支付        │   订单、支付         │
    │                     │                     │
    ├─────────────────────┼─────────────────────┤
    │                     │                     │
    │   RDB + AOF         │      only AOF       │
    │   (everysec)        │      (no)          │
    │                     │                     │
    │   推荐：一般         │   推荐：缓存、       │
    │   Web应用           │   日志、实时计算     │
    │                     │                     │
    ├─────────────────────┼─────────────────────┤
    │                     │                     │
    │   only RDB          │     无持久化         │
    │                     │                     │
    │   推荐：开发/测试    │   推荐：绝对不用      │
    │   或可丢失数据      │                     │
    │                     │                     │
    └─────────────────────┴─────────────────────┘
                         │
                    性能 ►
```

**数据丢失的容忍度决定持久化策略**：

| 业务场景 | 丢失容忍 | 推荐策略 |
|----------|----------|----------|
| 金融交易 | 0容忍 | RDB+AOF(always) + 主从 |
| 用户订单 | 秒级 | RDB+AOF(everysec) |
| 用户会话 | 分钟级 | RDB+AOF(everysec) |
| 热点缓存 | 允许丢失 | AOF(no) 或 RDB |
| 实时计算 | 允许丢失 | 无持久化或 RDB |

---

## 4. Redis集群

### 4.1 主从复制：读写分离

主从复制是最基础的集群方案，通过将写操作集中在主节点，读操作分散到从节点来提升性能和可用性：

```
主从复制架构：

                    ┌─────────────┐
                    │   客户端     │
                    │  (读写分离)  │
                    └──────┬──────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
            ▼              ▼              ▼
      ┌─────────┐   ┌─────────┐   ┌─────────┐
      │ Master  │   │ Slave1  │   │ Slave2  │
      │  (写)   │   │  (读)   │   │  (读)   │
      └────┬────┘   └────┬────┘   └────┬────┘
           │            │            │
           │            │            │
           └────────────┴────────────┘
                  SYNC / PSYNC
```

**复制原理**：

```
第一次连接：
1. Master执行BGSAVE，生成RDB快照
2. Master将RDB文件发送给Slave
3. Slave接收并加载RDB文件
4. Master记录后续写命令到缓冲区
5. Master发送缓冲区内容给Slave
6. 之后Master发送增量命令给Slave

断线重连：
1. Slave尝试PSYNC（部分重同步）
2. Master判断是否需要全量同步
3. 如果RunID和Offset匹配，执行增量同步
4. 否则执行全量同步
```

```typescript
// Node.js中实现主从复制读写分离

import Redis from 'ioredis';

// 创建主节点和从节点连接
const master = new Redis({ host: '192.168.1.100', port: 6379 });
const slave1 = new Redis({ host: '192.168.1.101', port: 6379 });
const slave2 = new Redis({ host: '192.168.1.102', port: 6379 });

// 读写分离的Redis客户端类
class ReadWriteSplitRedis {
  private master: Redis;
  private slaves: Redis[];

  constructor(master: Redis, slaves: Redis[]) {
    this.master = master;
    this.slaves = slaves;
  }

  // 写操作总是走主节点
  async set(key: string, value: string): Promise<string> {
    return this.master.set(key, value);
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    return this.master.hset(key, field, value);
  }

  async incr(key: string): Promise<number> {
    return this.master.incr(key);
  }

  // 读操作轮询到从节点
  private getNextSlave(): Redis {
    // 简单轮询
    const index = Math.floor(Math.random() * this.slaves.length);
    return this.slaves[index];
  }

  async get(key: string): Promise<string | null> {
    return this.getNextSlave().get(key);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.getNextSlave().hget(key, field);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.getNextSlave().hgetall(key);
  }

  // 读操作也支持主节点（需要强一致性时）
  async getFromMaster(key: string): Promise<string | null> {
    return this.master.get(key);
  }
}

// 使用示例
const redis = new ReadWriteSplitRedis(master, [slave1, slave2]);

// 写操作
await redis.set('user:1001', JSON.stringify({ name: '张三' }));

// 读操作（自动负载均衡到从节点）
const user = await redis.get('user:1001');
```

### 4.2 哨兵模式：自动故障转移

哨兵（Sentinel）是Redis的高可用解决方案，监控主从节点的健康状况，自动进行故障转移：

```
哨兵模式架构：

                    ┌─────────────────┐
                    │     客户端       │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Sentinel 1   │
                    │  (领导者选举)   │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
   ┌───────────┐       ┌───────────┐       ┌───────────┐
   │ Sentinel 2 │       │ Sentinel 3 │       │ Sentinel N │
   └───────────┘       └───────────┘       └───────────┘
         │                   │                   │
         └───────────────────┴───────────────────┘
                             │
                    ┌────────▼────────┐
                    │   监控/选举     │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
   ┌───────────┐       ┌───────────┐       ┌───────────┐
   │  Master   │──────►│  Slave1   │       │  Slave2   │
   │  (主)     │       │  (从)     │       │  (从)     │
   └───────────┘       └───────────┘       └───────────┘
```

**哨兵的核心功能**：

| 功能 | 说明 |
|------|------|
| **监控** | 定期检查主从节点是否正常运行 |
| **通知** | 故障时通知应用程序和运维 |
| **自动故障转移** | 主节点故障时自动选举新主节点 |
| **配置提供者** | 客户端查询当前主节点地址 |

```conf
# sentinel.conf 配置示例

# 哨兵监控的主节点
# sentinel monitor <master-name> <ip> <port> <quorum>
sentinel monitor mymaster 192.168.1.100 6379 2

# 主观下线时间（毫秒）
sentinel down-after-milliseconds mymaster 30000

# 故障转移超时时间
sentinel failover-timeout mymaster 180000

# 并行同步数量
sentinel parallel-syncs mymaster 1

# 故障转移后执行脚本
sentinel client-reconfig-script mymaster /opt/redis/failover.sh
```

```typescript
// ioredis + 哨兵模式

import Redis from 'ioredis';

// 创建哨兵连接
const redis = new Redis({
  sentinels: [
    { host: '192.168.1.201', port: 26379 },
    { host: '192.168.1.202', port: 26379 },
    { host: '192.168.1.203', port: 26379 },
  ],
  name: 'mymaster',  // 匹配sentinel.conf中的master-name

  // 密码配置（如需要）
  // password: 'your-redis-password',

  // 哨兵认证密码（如需要）
  // sentinelsPassword: 'your-sentinel-password',

  // 连接到从节点读取
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
});

// 监听事件
redis.on('connect', () => {
  console.log('已连接到Redis集群');
});

redis.on('error', (err) => {
  console.error('Redis连接错误:', err);
});

redis.on('reconnecting', () => {
  console.log('正在重新连接...');
});

// Sentinel模式下自动故障转移
redis.on('ready', () => {
  console.log('Redis已就绪');
});
```

### 4.3 Redis Cluster：分片集群

Redis Cluster是Redis官方提供的分布式集群方案，支持数据分片和自动故障转移：

```
Redis Cluster架构（6节点示例）：

                    ┌─────────────────┐
                    │     客户端       │
                    │  (Smart Client) │
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
      ┌───────────┐    ┌───────────┐    ┌───────────┐
      │ Master A  │    │ Master B  │    │ Master C  │
      │ Slot 0-5460│   │Slot 5461-│   │Slot 10923-│
      │           │    │ 10922    │    │ 16383    │
      └─────┬─────┘    └─────┬─────┘    └─────┬─────┘
            │                │                │
            ▼                ▼                ▼
      ┌───────────┐    ┌───────────┐    ┌───────────┐
      │ Slave A1  │    │ Slave B1  │    │ Slave C1  │
      │  (从)     │    │  (从)     │    │  (从)     │
      └───────────┘    └───────────┘    └───────────┘
```

**集群核心概念**：

| 概念 | 说明 |
|------|------|
| **槽（Slot）** | 16384个槽，均匀分配给所有主节点 |
| **路由** | 客户端计算key所属槽，直接请求目标节点 |
| **MOVED重定向** | 槽迁移时返回新节点地址 |
| **ASK重定向** | 槽迁移过程中，询问是否到新节点 |
| **故障转移** | 主节点故障后，从节点自动升级 |

```typescript
// Redis Cluster客户端

import Redis from 'ioredis';

// 创建集群连接
const cluster = new Redis.Cluster([
  { host: '192.168.1.100', port: 6379 },
  { host: '192.168.1.101', port: 6379 },
  { host: '192.168.1.102', port: 6379 },
  { host: '192.168.1.103', port: 6379 },
  { host: '192.168.1.104', port: 6379 },
  { host: '192.168.1.105', port: 6379 },
], {
  // 集群选项
  redisOptions: {
    // password: 'your-cluster-password',
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
  },

  // 槽迁移策略
  slotsRefreshTimeout: 60000,
  slotsRefreshInterval: 10000,

  // 分片策略
  scaleReads: 'masters',  // 读操作到主节点
});

// 分布式锁实现（集群版）
async function clusterLock(
  cluster: Redis.Cluster,
  key: string,
  value: string,
  ttlMs: number = 30000
): Promise<boolean> {
  const result = await cluster.set(key, value, 'PX', ttlMs, 'NX');
  return result === 'OK';
}

// 分布式解锁（Lua脚本保证原子性）
async function clusterUnlock(
  cluster: Redis.Cluster,
  key: string,
  value: string
): Promise<void> {
  const luaScript = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

  await cluster.eval(luaScript, 1, key, value);
}

// 获取集群节点信息
async function getClusterNodes(cluster: Redis.Cluster) {
  const info = await cluster.cluster('nodes');
  const lines = info.split('\n');

  const nodes: Array<{
    id: string;
    ip: string;
    port: number;
    flags: string;
    masterId: string;
    connected: boolean;
  }> = [];

  for (const line of lines) {
    const [id, addr, flags, masterId, ...rest] = line.split(':');
    const [ip, portStr] = addr.split('@');
    const [ipOnly, port] = [ip, parseInt(portStr)];

    nodes.push({
      id,
      ip: ipOnly,
      port,
      flags: flags.split(',')[0],
      masterId,
      connected: !flags.includes('disconnected'),
    });
  }

  return nodes;
}
```

### 4.4 客户端路由：MOVED重定向

Redis Cluster使用哈希槽分片，客户端需要知道key在哪个节点：

```
哈希槽计算：

┌─────────────────────────────────────────────────────────┐
│                                                         │
│   slot = CRC16(key) mod 16384                          │
│                                                         │
│   CRC16算法保证key均匀分布到16384个槽                    │
│                                                         │
└─────────────────────────────────────────────────────────┘

MOVED重定向流程：

1. 客户端计算槽：slot = CRC16("user:1001") % 16384 = 5461
2. 客户端向Master A发送请求
3. Master A返回 MOVED 5461 192.168.1.101:6379
4. 客户端更新本地槽映射表
5. 客户端向正确的节点重新发送请求
```

```typescript
// Smart Client - 自己处理MOVED重定向

class SmartRedisClient {
  private cluster: Redis.Cluster;
  private slotsMap: Map<number, { host: string, port: number }> = new Map();

  constructor(cluster: Redis.Cluster) {
    this.cluster = cluster;
    this.cluster.on(' MOVED', (slot, host, port) => {
      // 更新本地槽映射
      this.slotsMap.set(slot, { host, port });
    });
  }

  // 计算key的槽号
  private crc16(key: string): number {
    let crc = 0xFFFF;
    for (const char of key) {
      crc ^= char.charCodeAt(0) << 8;
      for (let i = 0; i < 8; i++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc = crc << 1;
        }
      }
    }
    return (crc ^ 0xFFFF) % 16384;
  }

  // 获取连接
  private async getConnection(key: string): Promise<Redis> {
    const slot = this.crc16(key);
    const node = this.slotsMap.get(slot);

    if (!node) {
      // 槽信息未知，尝试从任意节点获取
      const info = await this.cluster.cluster('slots');
      // 解析并更新slotsMap...
    }

    return this.cluster.getConnection(node.host, node.port);
  }

  async get(key: string): Promise<string | null> {
    const slot = this.crc16(key);

    try {
      // 先尝试直接获取
      return await this.cluster.get(key);
    } catch (err) {
      // 如果是MOVED错误，更新路由并重试
      if (err.message.includes('MOVED')) {
        const [, , host, port] = err.message.split(' ');
        this.slotsMap.set(slot, { host, port: parseInt(port) });
        return this.cluster.get(key);
      }
      throw err;
    }
  }
}
```

### 4.5 我的思考：集群方案选择依据

选择Redis集群方案需要综合考虑多个因素：

```
集群方案对比矩阵：

┌────────────┬─────────────┬─────────────┬─────────────┐
│   特性     │   主从复制   │   哨兵模式   │  Cluster   │
├────────────┼─────────────┼─────────────┼─────────────┤
│  数据分片  │     否       │     否       │     是      │
├────────────┼─────────────┼─────────────┼─────────────┤
│  自动故障  │     否       │     是       │     是      │
│   转移     │             │             │             │
├────────────┼─────────────┼─────────────┼─────────────┤
│  写扩展    │     否       │     否       │     是      │
├────────────┼─────────────┼─────────────┼─────────────┤
│  读扩展    │     是       │     是       │     是      │
├────────────┼─────────────┼─────────────┼─────────────┤
│  节点数量  │    2-4      │    3-5      │    6+       │
├────────────┼─────────────┼─────────────┼─────────────┤
│  配置复杂度│    低        │    中       │     高      │
├────────────┼─────────────┼─────────────┼─────────────┤
│  客户端    │   普通客户端  │   哨兵客户端 │ Smart Client│
│   支持     │             │             │             │
└────────────┴─────────────┴─────────────┴─────────────┘
```

**选择建议**：

| 场景 | 推荐方案 | 理由 |
|------|----------|------|
| 小规模应用 | 主从复制 | 简单，够用 |
| 需要高可用 | 哨兵模式 | 自动故障转移 |
| 大数据量 | Cluster | 数据分片，水平扩展 |
| 多写多读 | Cluster | 多个主节点 |

---

## 5. Redis应用场景

### 5.1 缓存：缓存策略

缓存是Redis最常见的用途，合理的缓存策略能显著提升系统性能：

```
缓存分层架构：

┌─────────────────────────────────────────────────────────┐
│                      应用层                              │
│                   (业务代码)                             │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                    L1缓存层                              │
│              (本地缓存/浏览器)                           │
│             响应时间：<1ms                               │
│             容量：小（MB级）                            │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                    L2缓存层                              │
│                    (Redis)                              │
│             响应时间：<10ms                              │
│             容量：中（GB级）                            │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                    数据库层                              │
│                 (MySQL/PG)                              │
│             响应时间：10-100ms                           │
│             容量：大（TB级）                            │
└─────────────────────────────────────────────────────────┘
```

**缓存策略设计**：

```typescript
// 多级缓存实现

import LRU from 'lru-cache';

// L1: 本地缓存
const l1Cache = new LRU<string, any>({
  max: 1000,           // 最大1000条
  ttl: 1000 * 60,      // 1分钟
  updateAgeOnGet: true,
});

// L2: Redis缓存
const l2Cache = new Redis({
  host: '127.0.0.1',
  port: 6379,
});

class MultiLevelCache {
  // 缓存键前缀
  private prefix = 'cache:';

  // 获取数据（逐层穿透）
  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.prefix + key;

    // L1查询
    const l1Value = l1Cache.get(fullKey);
    if (l1Value !== undefined) {
      console.log('L1缓存命中');
      return l1Value as T;
    }

    // L2查询
    const l2Value = await l2Cache.get(fullKey);
    if (l2Value) {
      console.log('L2缓存命中');
      // 回填L1
      l1Cache.set(fullKey, l2Value);
      return JSON.parse(l2Value) as T;
    }

    return null;
  }

  // 设置数据（逐层回填）
  async set(key: string, value: any, l1Ttl?: number, l2Ttl?: number): Promise<void> {
    const fullKey = this.prefix + key;
    const serialized = JSON.stringify(value);

    // 写入L2（必须）
    if (l2Ttl) {
      await l2Cache.setex(fullKey, l2Ttl, serialized);
    } else {
      await l2Cache.set(fullKey, serialized);
    }

    // 写入L1（可选）
    if (l1Ttl) {
      l1Cache.set(fullKey, value);
    }
  }

  // 删除数据
  async delete(key: string): Promise<void> {
    const fullKey = this.prefix + key;
    l1Cache.delete(fullKey);
    await l2Cache.del(fullKey);
  }

  // 清除所有缓存
  async clear(): Promise<void> {
    l1Cache.clear();
    await l2Cache.flushdb();
  }
}
```

### 5.2 缓存问题：穿透/雪崩/击穿

缓存使用中有三个经典问题：

```
缓存穿透/雪崩/击穿对比：

┌─────────────────────────────────────────────────────────┐
│                                                         │
│  缓存穿透                        缓存雪崩                │
│  ┌─────────┐                    ┌─────────┐           │
│  │  恶意   │                    │  缓存    │           │
│  │  请求   │──►数据库查询──►无数据│  同时过期 │           │
│  │  不存在 │                    │  导致    │           │
│  │  的数据 │                    │  雪崩    │           │
│  └─────────┘                    └─────────┘           │
│                                                         │
│  缓存击穿                                                 │
│  ┌─────────┐                                           │
│  │  热点key│──►过期──►数据库查询──►并发击穿              │
│  │  突然   │                                           │
│  │  大量   │                                           │
│  │  访问   │                                           │
│  └─────────┘                                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**缓存穿透解决方案**：

```typescript
// 1. 布隆过滤器（Bloom Filter）

import BloomFilter from 'bloomfilter';

class BloomFilterCache {
  private bloom: BloomFilter;
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
    // 初始化布隆过滤器（可从Redis恢复）
    this.bloom = new BloomFilter(10000000, 0.01); // 1000万条，1%误差
  }

  // 添加合法key到布隆过滤器
  async addValidKey(key: string): Promise<void> {
    this.bloom.add(key);
    // 持久化到Redis
    await this.redis.set('bloom:valid_keys', Buffer.from(this.bloom.toBuffer()));
  }

  // 检查key是否可能存在
  mightExist(key: string): boolean {
    return this.bloom.test(key);
  }

  // 带布隆过滤器的数据获取
  async getWithBloomFilter<T>(
    key: string,
    fetcher: () => Promise<T | null>
  ): Promise<T | null> {
    // 先检查布隆过滤器
    if (!this.mightExist(key)) {
      console.log('布隆过滤器判断key不存在，直接返回空');
      return null;
    }

    // 查询缓存
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }

    // 查询数据库
    const result = await fetcher();

    if (result) {
      // 回填缓存
      await this.redis.setex(key, 3600, JSON.stringify(result));
    } else {
      // 即使查询为空，也缓存空值（防止穿透）
      await this.redis.setex(key, 300, 'NULL'); // 短期缓存空值
    }

    return result;
  }
}

// 2. 缓存空值
async function getWithNullValue(
  redis: Redis,
  key: string,
  fetcher: () => Promise<any>
): Promise<any> {
  const cached = await redis.get(key);

  if (cached === 'NULL') {
    return null; // 已知的不存在数据
  }

  if (cached) {
    return JSON.parse(cached);
  }

  const result = await fetcher();

  if (result) {
    await redis.setex(key, 3600, JSON.stringify(result));
  } else {
    // 缓存空值，短过期时间
    await redis.setex(key, 300, 'NULL');
  }

  return result;
}
```

**缓存雪崩解决方案**：

```typescript
// 1. 过期时间加随机值
async function setWithJitter(
  redis: Redis,
  key: string,
  value: any,
  baseTtl: number = 3600
): Promise<void> {
  const jitter = Math.floor(Math.random() * 300); // 0-5分钟随机
  const ttl = baseTtl + jitter;
  await redis.setex(key, ttl, JSON.stringify(value));
}

// 2. 热点数据永不过期 + 异步更新
async function setWithAsyncRefresh(
  redis: Redis,
  key: string,
  value: any,
  fetcher: () => Promise<any>
): Promise<void> {
  // 永不过期
  await redis.set(key, JSON.stringify(value));

  // 启动后台刷新任务
  setInterval(async () => {
    try {
      const fresh = await fetcher();
      await redis.set(key, JSON.stringify(fresh));
      console.log(`Key ${key} 已异步刷新`);
    } catch (err) {
      console.error(`Key ${key} 刷新失败:`, err);
    }
  }, 30000); // 每30秒刷新
}

// 3. 使用ZSet实现均匀过期的缓存
class DistributedExpireCache {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async set(key: string, value: any, ttlMs: number): Promise<void> {
    const now = Date.now();
    const expireAt = now + ttlMs;

    const pipeline = this.redis.pipeline();
    pipeline.set(key, JSON.stringify(value));
    pipeline.zadd('cache:expire', expireAt, key);
    await pipeline.exec();
  }

  async get<T>(key: string): Promise<T | null> {
    const now = Date.now();

    // 检查是否过期
    const score = await this.redis.zscore('cache:expire', key);
    if (score && parseFloat(score) < now) {
      // 已过期，删除并返回null
      await this.redis.del(key);
      await this.redis.zrem('cache:expire', key);
      return null;
    }

    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }
}
```

**缓存击穿解决方案**：

```typescript
// 1. 互斥锁（分布式锁）
async function getWithMutexLock<T>(
  redis: Redis,
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const mutexKey = `mutex:${key}`;

  // 尝试获取锁
  const lock = await redis.set(mutexKey, '1', 'NX', 'EX', 10);

  if (lock === 'OK') {
    try {
      // 获取到锁，从数据库读取
      const result = await fetcher();
      await redis.setex(key, 3600, JSON.stringify(result));
      return result;
    } finally {
      // 释放锁
      await redis.del(mutexKey);
    }
  } else {
    // 未获取到锁，等待后重试
    await new Promise(resolve => setTimeout(resolve, 100));
    return getWithMutexLock(redis, key, fetcher);
  }
}

// 2. 热点key永不过期 + 逻辑过期
class LogicExpireCache {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    const data = {
      value,
      expireAt: Date.now() + ttlSeconds * 1000,
    };
    await this.redis.set(key, JSON.stringify(data));
  }

  async get<T>(
    key: string,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const raw = await this.redis.get(key);

    if (!raw) {
      // 缓存不存在，执行回源
      const result = await fetcher();
      await this.set(key, result, 3600);
      return result;
    }

    const data = JSON.parse(raw);
    const now = Date.now();

    if (data.expireAt > now) {
      // 未过期，直接返回
      return data.value;
    }

    // 已过期，尝试获取锁
    const lockKey = `lock:${key}`;
    const lock = await redis.set(lockKey, '1', 'NX', 'EX', 10);

    if (lock === 'OK') {
      // 获取到锁，异步更新缓存
      fetcher().then(async (result) => {
        await this.set(key, result, 3600);
        await redis.del(lockKey);
      }).catch(async (err) => {
        console.error('缓存更新失败:', err);
        await redis.del(lockKey);
      });

      // 返回旧数据（不阻塞）
      return data.value;
    } else {
      // 未获取到锁，返回旧数据
      return data.value;
    }
  }
}
```

### 5.3 分布式锁：SETNX + Lua

分布式锁是分布式系统中协调多个进程的重要机制：

```typescript
// Redis分布式锁完整实现

class DistributedLock {
  private redis: Redis;
  private lockPrefix = 'lock:';

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * 获取锁
   * @param key 锁的key
   * @param value 锁的值（通常用uuid）
   * @param ttlMs 过期时间（毫秒）
   */
  async acquire(
    key: string,
    value: string,
    ttlMs: number = 30000
  ): Promise<boolean> {
    const lockKey = this.lockPrefix + key;
    const result = await this.redis.set(lockKey, value, 'PX', ttlMs, 'NX');
    return result === 'OK';
  }

  /**
   * 释放锁（Lua脚本保证原子性）
   */
  async release(key: string, value: string): Promise<boolean> {
    const lockKey = this.lockKey + key;

    const luaScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    const result = await this.redis.eval(luaScript, 1, lockKey, value);
    return result === 1;
  }

  /**
   * 续期锁（watch dog机制）
   */
  async extend(
    key: string,
    value: string,
    ttlMs: number
  ): Promise<boolean> {
    const lockKey = this.lockPrefix + key;

    const luaScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("pexpire", KEYS[1], ARGV[2])
      else
        return 0
      end
    `;

    const result = await this.redis.eval(luaScript, 1, lockKey, value, ttlMs);
    return result === 1;
  }

  /**
   * 尝试获取锁（失败不等待）
   */
  async tryLock<T>(
    key: string,
    ttlMs: number,
    task: () => Promise<T>
  ): Promise<T | null> {
    const value = uuid(); // 生成唯一标识

    const acquired = await this.acquire(key, value, ttlMs);
    if (!acquired) {
      return null;
    }

    try {
      return await task();
    } finally {
      await this.release(key, value);
    }
  }

  /**
   * 等待获取锁（带超时）
   */
  async waitForLock(
    key: string,
    ttlMs: number,
    retryIntervalMs: number = 100,
    maxWaitMs: number = 30000
  ): Promise<boolean> {
    const value = uuid();
    const start = Date.now();

    while (Date.now() - start < maxWaitMs) {
      const acquired = await this.acquire(key, value, ttlMs);
      if (acquired) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, retryIntervalMs));
    }

    return false;
  }
}

// Watch Dog自动续期实现
class AutoRenewalLock {
  private redis: Redis;
  private locks: Map<string, {
    value: string;
    ttlMs: number;
    timer: NodeJS.Timeout;
  }> = new Map();

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async acquire(
    key: string,
    ttlMs: number = 30000,
    autoRenewal: boolean = true
  ): Promise<boolean> {
    const value = uuid();
    const lockKey = `lock:${key}`;

    const result = await this.redis.set(lockKey, value, 'PX', ttlMs, 'NX');
    if (result === 'OK' && autoRenewal) {
      // 启动自动续期
      const timer = setInterval(async () => {
        const lockInfo = this.locks.get(key);
        if (lockInfo) {
          await this.redis.pexpire(lockKey, lockInfo.ttlMs);
        }
      }, ttlMs / 3); // 每1/3 TTL续期一次

      this.locks.set(key, { value, ttlMs, timer });
    }

    return result === 'OK';
  }

  async release(key: string): Promise<void> {
    const lockKey = `lock:${key}`;
    const lockInfo = this.locks.get(key);

    if (lockInfo) {
      clearInterval(lockInfo.timer);
      this.locks.delete(key);

      const luaScript = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;

      await this.redis.eval(luaScript, 1, lockKey, lockInfo.value);
    }
  }
}
```

### 5.4 延迟队列：ZSet实现

延迟队列是分布式系统中常用的组件，用于延迟执行任务：

```typescript
// 基于ZSet的延迟队列实现

class DelayQueue {
  private redis: Redis;
  private queueName: string;

  constructor(redis: Redis, queueName: string) {
    this.redis = redis;
    this.queueName = queueName;
  }

  /**
   * 添加延迟任务
   * @param data 任务数据
   * @param delayMs 延迟毫秒数
   */
  async add<T>(data: T, delayMs: number): Promise<string> {
    const jobId = uuid();
    const executeAt = Date.now() + delayMs;

    await this.redis.zadd(
      this.queueName,
      executeAt,
      JSON.stringify({ id: jobId, data, addedAt: Date.now() })
    );

    return jobId;
  }

  /**
   * 消费延迟任务（阻塞）
   * @param timeoutMs 阻塞超时时间
   */
  async take<T>(): Promise<{ id: string, data: T } | null> {
    while (true) {
      // 获取所有已到期的任务
      const now = Date.now();
      const jobs = await this.redis.zrangebyscore(
        this.queueName,
        0,
        now,
        'LIMIT',
        0,
        1
      );

      if (jobs.length === 0) {
        // 没有到期任务，阻塞等待
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      const job = JSON.parse(jobs[0]);

      // 尝试删除任务（保证只有一个消费者）
      const removed = await this.redis.zrem(this.queueName, jobs[0]);

      if (removed === 1) {
        return { id: job.id, data: job.data };
      }
      // 如果删除失败，说明已被其他消费者拿走，重试
    }
  }

  /**
   * 消费任务（非阻塞，立即返回）
   */
  async poll<T>(): Promise<{ id: string, data: T } | null> {
    const now = Date.now();

    const jobs = await this.redis.zrangebyscore(
      this.queueName,
      0,
      now,
      'LIMIT',
      0,
      1
    );

    if (jobs.length === 0) {
      return null;
    }

    const job = JSON.parse(jobs[0]);
    const removed = await this.redis.zrem(this.queueName, jobs[0]);

    if (removed === 1) {
      return { id: job.id, data: job.data };
    }

    return null;
  }

  /**
   * 取消任务
   */
  async cancel(jobId: string): Promise<boolean> {
    // 需要遍历找到对应任务
    const jobs = await this.redis.zrange(this.queueName, 0, -1);

    for (const jobStr of jobs) {
      const job = JSON.parse(jobStr);
      if (job.id === jobId) {
        return (await this.redis.zrem(this.queueName, jobStr)) === 1;
      }
    }

    return false;
  }

  /**
   * 获取队列长度
   */
  async size(): Promise<number> {
    return this.redis.zcard(this.queueName);
  }

  /**
   * 获取已过期的任务数
   */
  async expiredCount(): Promise<number> {
    return this.redis.zcount(this.queueName, 0, Date.now());
  }
}

// 使用示例：订单超时取消
async function demoOrderCancel() {
  const redis = new Redis();
  const delayQueue = new DelayQueue(redis, 'order:cancel:queue');

  // 模拟创建订单
  const orderId = 'ORDER_12345';
  console.log(`订单 ${orderId} 已创建，将于30分钟后检查支付状态`);

  // 添加30分钟后的延迟任务
  await delayQueue.add(
    { orderId, action: 'check_payment' },
    30 * 60 * 1000 // 30分钟
  );

  // 启动消费者
  console.log('启动订单超时检查消费者...');

  while (true) {
    const job = await delayQueue.take<{ orderId: string; action: string }>();

    if (job) {
      console.log(`处理延迟任务: ${job.id}`);

      if (job.data.action === 'check_payment') {
        // 检查订单是否已支付
        const isPaid = await checkOrderPayment(job.data.orderId);

        if (!isPaid) {
          console.log(`订单 ${job.data.orderId} 未支付，执行取消`);
          await cancelOrder(job.data.orderId);
        } else {
          console.log(`订单 ${job.data.orderId} 已支付，跳过`);
        }
      }
    }
  }
}
```

### 5.5 排行榜：ZSet应用

排行榜是游戏、社交、电商等场景的常见需求：

```typescript
// 游戏排行榜完整实现

class GameLeaderboard {
  private redis: Redis;
  private dailyKey: string;
  private weeklyKey: string;
  private monthlyKey: string;
  private totalKey: string;

  constructor(redis: Redis, gameId: string) {
    this.redis = redis;
    this.dailyKey = `leaderboard:${gameId}:daily`;
    this.weeklyKey = `leaderboard:${gameId}:weekly`;
    this.monthlyKey = `leaderboard:${gameId}:monthly`;
    this.totalKey = `leaderboard:${gameId}:total`;
  }

  // 获取当前日期字符串
  private getDateStr(date: Date = new Date()): string {
    return date.toISOString().split('T')[0];
  }

  // 获取当前周字符串 (YYYY-WW)
  private getWeekStr(date: Date = new Date()): string {
    const year = date.getFullYear();
    const week = Math.ceil((date.getDate()) / 7);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  // 获取当前月字符串 (YYYY-MM)
  private getMonthStr(date: Date = new Date()): string {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  // 更新分数（支持多个维度）
  async updateScore(
    userId: string,
    score: number,
    options: {
      daily?: boolean;
      weekly?: boolean;
      monthly?: boolean;
      total?: boolean;
    } = {}
  ): Promise<void> {
    const pipeline = this.redis.pipeline();

    const keys = [];

    if (options.daily !== false) {
      keys.push(`${this.dailyKey}:${this.getDateStr()}`);
    }
    if (options.weekly) {
      keys.push(`${this.weeklyKey}:${this.getWeekStr()}`);
    }
    if (options.monthly) {
      keys.push(`${this.monthlyKey}:${this.getMonthStr()}`);
    }
    if (options.total !== false) {
      keys.push(this.totalKey);
    }

    for (const key of keys) {
      pipeline.zincrby(key, score, userId);
    }

    await pipeline.exec();
  }

  // 获取用户在所有维度的排名
  async getUserAllRanks(userId: string): Promise<{
    daily: { rank: number; score: number };
    weekly: { rank: number; score: number };
    monthly: { rank: number; score: number };
    total: { rank: number; score: number };
  }> {
    const dateStr = this.getDateStr();
    const weekStr = this.getWeekStr();
    const monthStr = this.getMonthStr();

    const [dailyRank, dailyScore, weeklyRank, weeklyScore, monthlyRank, monthlyScore, totalRank, totalScore] =
      await this.redis.pipeline()
        .zrevrank(`${this.dailyKey}:${dateStr}`, userId)
        .zscore(`${this.dailyKey}:${dateStr}`, userId)
        .zrevrank(`${this.weeklyKey}:${weekStr}`, userId)
        .zscore(`${this.weeklyKey}:${weekStr}`, userId)
        .zrevrank(`${this.monthlyKey}:${monthStr}`, userId)
        .zscore(`${this.monthlyKey}:${monthStr}`, userId)
        .zrevrank(this.totalKey, userId)
        .zscore(this.totalKey, userId)
        .exec();

    return {
      daily: { rank: dailyRank, score: parseFloat(dailyScore || '0') },
      weekly: { rank: weeklyRank, score: parseFloat(weeklyScore || '0') },
      monthly: { rank: monthlyRank, score: parseFloat(monthlyScore || '0') },
      total: { rank: totalRank, score: parseFloat(totalScore || '0') },
    };
  }

  // 获取日榜
  async getDailyTop(count: number = 10): Promise<Array<{rank: number, userId: string, score: number}>> {
    const dateStr = this.getDateStr();
    return this.getTopN(`${this.dailyKey}:${dateStr}`, count);
  }

  // 获取周榜
  async getWeeklyTop(count: number = 10): Promise<Array<{rank: number, userId: string, score: number}>> {
    const weekStr = this.getWeekStr();
    return this.getTopN(`${this.weeklyKey}:${weekStr}`, count);
  }

  // 获取月榜
  async getMonthlyTop(count: number = 10): Promise<Array<{rank: number, userId: string, score: number}>> {
    const monthStr = this.getMonthStr();
    return this.getTopN(`${this.monthlyKey}:${monthStr}`, count);
  }

  // 获取总榜
  async getTotalTop(count: number = 10): Promise<Array<{rank: number, userId: string, score: number}>> {
    return this.getTopN(this.totalKey, count);
  }

  // 获取Top N的通用方法
  private async getTopN(key: string, count: number): Promise<Array<{rank: number, userId: string, score: number}>> {
    const results = await this.redis.zrevrange(key, 0, count - 1, 'WITHSCORES');

    const topN: Array<{rank: number, userId: string, score: number}> = [];

    for (let i = 0; i < results.length; i += 2) {
      topN.push({
        rank: Math.floor(i / 2) + 1,
        userId: results[i],
        score: parseFloat(results[i + 1]),
      });
    }

    return topN;
  }

  // 获取用户在指定维度的排名范围（前后N名）
  async getUserSurroundingRank(
    key: string,
    userId: string,
    range: number = 5
  ): Promise<{
    above: Array<{userId: string, score: number}>;
    user: {userId: string, score: number, rank: number};
    below: Array<{userId: string, score: number}>;
  }> {
    const rank = await this.redis.zrevrank(key, userId);

    if (rank === null) {
      throw new Error('用户不在排行榜中');
    }

    const score = await this.redis.zscore(key, userId);

    // 获取排名更高的
    const aboveStart = Math.max(0, rank - range);
    const aboveResults = await this.redis.zrevrange(key, aboveStart, rank - 1, 'WITHSCORES');

    // 获取排名更低的
    const belowResults = await this.redis.zrevrange(key, rank + 1, rank + range, 'WITHSCORES');

    const above: Array<{userId: string, score: number}> = [];
    for (let i = 0; i < aboveResults.length; i += 2) {
      above.push({ userId: aboveResults[i], score: parseFloat(aboveResults[i + 1]) });
    }

    const below: Array<{userId: string, score: number}> = [];
    for (let i = 0; i < belowResults.length; i += 2) {
      below.push({ userId: belowResults[i], score: parseFloat(belowResults[i + 1]) });
    }

    return {
      above,
      user: { userId, score: parseFloat(score!), rank },
      below,
    };
  }

  // 定时清理过期数据
  async cleanupOldData(): Promise<void> {
    const keys = await this.redis.keys(`leaderboard:*`);

    for (const key of keys) {
      // 解析key类型
      if (key.includes(':daily:')) {
        // 保留最近7天
        const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
        await this.redis.zremrangebyscore(key, 0, cutoff);
      } else if (key.includes(':weekly:')) {
        // 保留最近12周
        const cutoff = Date.now() - 84 * 24 * 60 * 60 * 1000;
        await this.redis.zremrangebyscore(key, 0, cutoff);
      } else if (key.includes(':monthly:')) {
        // 保留最近12个月
        const cutoff = Date.now() - 365 * 24 * 60 * 60 * 1000;
        await this.redis.zremrangebyscore(key, 0, cutoff);
      }
      // total key 不清理
    }
  }
}
```

### 5.6 实战：高并发计数器

```typescript
// 高并发计数器系统

class HighConcurrencyCounter {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  // 简单计数器
  async incr(key: string): Promise<number> {
    return this.redis.incr(key);
  }

  // 批量增加
  async incrBy(key: string, increment: number): Promise<number> {
    return this.redis.incrby(key, increment);
  }

  // 限流计数器（滑动窗口）
  async slidingWindowRateLimit(
    key: string,
    maxRequests: number,
    windowMs: number
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const now = Date.now();
    const windowStart = now - windowMs;

    const pipeline = this.redis.pipeline();

    // 移除窗口外的记录
    pipeline.zremrangebyscore(key, 0, windowStart);

    // 添加当前请求
    pipeline.zadd(key, now, `${now}:${Math.random()}`);

    // 获取窗口内请求数
    pipeline.zcard(key);

    // 设置过期时间
    pipeline.pexpire(key, windowMs);

    const results = await pipeline.exec();
    const requestCount = results![2][1] as number;

    const allowed = requestCount <= maxRequests;
    const remaining = Math.max(0, maxRequests - requestCount);
    const resetAt = now + windowMs;

    return { allowed, remaining, resetAt };
  }

  // 令牌桶算法
  async tokenBucketRateLimit(
    key: string,
    capacity: number,
    refillRate: number, // 每秒补充的令牌数
  ): Promise<{ allowed: boolean; remaining: number; retryAfterMs: number }> {
    const now = Date.now();
    const script = `
      local key = KEYS[1]
      local capacity = tonumber(ARGV[1])
      local refill_rate = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])

      local data = redis.call('hmget', key, 'tokens', 'last_refill')
      local tokens = tonumber(data[1]) or capacity
      local last_refill = tonumber(data[2]) or now

      -- 计算应该补充的令牌数
      local elapsed = (now - last_refill) / 1000
      local tokens_to_add = elapsed * refill_rate
      tokens = math.min(capacity, tokens + tokens_to_add)

      -- 尝试消费令牌
      local allowed = 0
      if tokens >= 1 then
        tokens = tokens - 1
        allowed = 1
      end

      -- 更新状态
      redis.call('hmset', key, 'tokens', tokens, 'last_refill', now)
      redis.call('pexpire', key, 60000)

      local retry_after_ms = 0
      if allowed == 0 then
        retry_after_ms = math.ceil((1 - tokens) / refill_rate * 1000)
      end

      return { allowed, math.floor(tokens), retry_after_ms }
    `;

    const result = await this.redis.eval(
      script,
      1,
      key,
      capacity,
      refillRate,
      now
    ) as [number, number, number];

    return {
      allowed: result[0] === 1,
      remaining: result[1],
      retryAfterMs: result[2],
    };
  }

  // 计数器统计（UV/PV）
  async pageStats(pageId: string): Promise<{
    pv: number;
    uv: number;
  }> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const pvKey = `stats:${pageId}:pv:${today}`;
    const uvKey = `stats:${pageId}:uv:${today}`;

    const pipeline = this.redis.pipeline();
    pipeline.incr(pvKey);
    pipeline.expire(pvKey, 86400 * 2); // 保留2天
    pipeline.scard(uvKey);

    const results = await pipeline.exec();

    return {
      pv: results![0][1] as number,
      uv: results![1][1] as number,
    };
  }

  // 记录UV（需要用户ID）
  async recordUV(pageId: string, userId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const uvKey = `stats:${pageId}:uv:${today}`;

    await this.redis.sadd(uvKey, userId);
    await this.redis.expire(uvKey, 86400 * 2);
  }

  // 热门内容统计
  class HotContentTracker {
    private redis: Redis;
    private hotKey = 'content:hot';
    private trendingKey = 'content:trending';

    constructor(redis: Redis) {
      this.redis = redis;
    }

    // 记录内容热度
    async recordHit(contentId: string, weight: number = 1): Promise<void> {
      const pipeline = this.redis.pipeline();

      // 实时热度
      pipeline.zincrby(this.hotKey, weight, contentId);

      // 近期热度（带时间衰减）
      const hour = Math.floor(Date.now() / 3600000);
      pipeline.zincrby(`${this.trendingKey}:${hour}`, weight, contentId);

      // 设置过期
      pipeline.expire(`${this.trendingKey}:${hour}`, 86400);

      await pipeline.exec();
    }

    // 获取热门内容
    async getHotContent(count: number = 10): Promise<Array<{contentId: string, score: number}>> {
      const results = await this.redis.zrevrange(this.hotKey, 0, count - 1, 'WITHSCORES');

      const hot: Array<{contentId: string, score: number}> = [];
      for (let i = 0; i < results.length; i += 2) {
        hot.push({ contentId: results[i], score: parseFloat(results[i + 1]) });
      }

      return hot;
    }

    // 获取Trending内容（近几小时的加权）
    async getTrendingContent(hours: number = 24, count: number = 10): Promise<Array<{contentId: string, score: number}>> {
      const currentHour = Math.floor(Date.now() / 3600000);
      const pipeline = this.redis.pipeline();

      for (let i = 0; i < hours; i++) {
        const hour = currentHour - i;
        pipeline.zrange(`${this.trendingKey}:${hour}`, 0, -1, 'WITHSCORES');
      }

      const results = await pipeline.exec();

      // 聚合分数
      const aggregated: Map<string, number> = new Map();

      for (const [err, data] of results!) {
        if (err || !data) continue;

        const items = data as string[];
        for (let i = 0; i < items.length; i += 2) {
          const contentId = items[i];
          const score = parseFloat(items[i + 1]) * (1 - i / hours * 0.5); // 近期权重更高
          aggregated.set(contentId, (aggregated.get(contentId) || 0) + score);
        }
      }

      // 排序并返回Top N
      const sorted = Array.from(aggregated.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, count);

      return sorted.map(([contentId, score]) => ({ contentId, score }));
    }
  }
}
```

### 5.7 我的思考：Redis应用场景设计原则

Redis的应用场景设计需要考虑以下几个原则：

```
应用场景设计检查清单：

1. 数据结构选择 ✓
   ├── 读多还是写多？
   ├── 需要排序吗？
   ├── 需要去重吗？
   └── 需要集合运算吗？

2. 性能考量 ✓
   ├── QPS需求是多少？
   ├── 延迟要求是多少？
   ├── 数据量有多大？
   └── 热点数据有哪些？

3. 一致性要求 ✓
   ├── 允许数据丢失吗？
   ├── 需要强一致性吗？
   └── 如何处理并发？

4. 成本效益 ✓
   ├── Redis内存够用吗？
   ├── 需要集群吗？
   └── 如何平衡性能和成本？
```

---

## 6. Redis高级特性

### 6.1 Pipeline：批量操作

Pipeline是Redis提升批量操作性能的利器：

```
普通模式 vs Pipeline模式：

普通模式（每次命令都往返一次）：
   Client ───► Server (命令1) ───► Client
   Client ───► Server (命令2) ───► Client
   Client ───► Server (命令3) ───► Client
   ...
   延迟累加：N * RTT

Pipeline模式（批量发送一次）：
   Client ───► Server (命令1+2+3+...) ───► Client
   延迟：1 * RTT
```

```typescript
// Pipeline使用示例

import Redis from 'ioredis';

class PipelineExample {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  // 批量设置用户信息
  async batchSetUsers(users: Array<{id: string, name: string, age: number}>): Promise<void> {
    const pipeline = this.redis.pipeline();

    for (const user of users) {
      const key = `user:${user.id}`;
      pipeline.hset(key, {
        name: user.name,
        age: user.age.toString(),
      });
      pipeline.expire(key, 86400);
    }

    await pipeline.exec();
  }

  // 批量获取用户信息
  async batchGetUsers(userIds: string[]): Promise<Map<string, any>> {
    const pipeline = this.redis.pipeline();

    for (const id of userIds) {
      pipeline.hgetall(`user:${id}`);
    }

    const results = await pipeline.exec();
    const users = new Map<string, any>();

    if (results) {
      for (let i = 0; i < userIds.length; i++) {
        const [err, data] = results[i];
        if (!err && data) {
          users.set(userIds[i], data);
        }
      }
    }

    return users;
  }

  // 批量更新分数
  async batchUpdateScores(
    updates: Array<{key: string, delta: number}>
  ): Promise<void> {
    const pipeline = this.redis.pipeline();

    for (const update of updates) {
      pipeline.incrby(update.key, update.delta);
    }

    await pipeline.exec();
  }

  // Pipeline + 事务（监控）
  async pipelineWithWatch(
    key: string,
    operations: (pipeline: ReturnType<typeof this.redis.pipeline>) => void
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const maxRetries = 3;
      let retries = 0;

      const attempt = async () => {
        try {
          await this.redis.watch(key);

          const pipeline = this.redis.pipeline();
          operations(pipeline);

          const results = await pipeline.exec();

          if (results === null) {
            // 被监控的key被其他客户端修改，重试
            if (++retries < maxRetries) {
              await attempt();
            } else {
              resolve(false);
            }
          } else {
            resolve(true);
          }
        } catch (err) {
          await this.redis.unwatch();
          reject(err);
        }
      };

      attempt();
    });
  }

  // 大规模数据迁移
  async migrateData(
    sourceRedis: Redis,
    destRedis: Redis,
    pattern: string,
    batchSize: number = 1000
  ): Promise<{ migrated: number; errors: number }> {
    let cursor = '0';
    let migrated = 0;
    let errors = 0;

    do {
      // 使用SCAN遍历
      const [newCursor, keys] = await sourceRedis.scan(cursor, 'MATCH', pattern, 'COUNT', batchSize);
      cursor = newCursor;

      if (keys.length === 0) continue;

      // 批量获取数据
      const pipeline = sourceRedis.pipeline();
      for (const key of keys) {
        pipeline.dump(key);
      }

      const dumps = await pipeline.exec();

      // 批量写入目标
      const importPipeline = destRedis.pipeline();
      for (let i = 0; i < keys.length; i++) {
        const [err, dump] = dumps![i];
        if (!err && dump) {
          importPipeline.restore(keys[i], 0, dump as string, 'REPLACE');
        }
      }

      const results = await importPipeline.exec();

      // 统计结果
      for (const [err] of results!) {
        if (err) errors++;
        else migrated++;
      }

      console.log(`已迁移: ${migrated}, 错误: ${errors}`);

    } while (cursor !== '0');

    return { migrated, errors };
  }
}
```

### 6.2 Lua脚本：原子操作

Lua脚本在Redis中执行具有原子性，适合复杂操作的场景：

```typescript
// Lua脚本示例

class LuaScriptExamples {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  // 1. 实现SETNX + EXPIRE的原子操作
  // Redis SET key value NX EX 10 可以在SET时设置过期时间
  // 但如果我们需要在设置值之前做一些计算呢？
  async setnxWithExpire(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    const script = `
      local exists = redis.call('exists', KEYS[1])
      if exists == 0 then
        redis.call('setex', KEYS[1], ARGV[2], ARGV[1])
        return 1
      else
        return 0
      end
    `;

    const result = await this.redis.eval(script, 1, key, value, ttlSeconds);
    return result === 1;
  }

  // 2. 分布式锁（带重试）
  async distributedLockWithRetry(
    key: string,
    ttlMs: number,
    retryCount: number = 3,
    retryDelayMs: number = 100
  ): Promise<string | null> {
    const lockKey = `lock:${key}`;
    const lockValue = uuid();

    for (let i = 0; i < retryCount; i++) {
      const result = await this.redis.set(lockKey, lockValue, 'PX', ttlMs, 'NX');

      if (result === 'OK') {
        return lockValue;
      }

      await new Promise(resolve => setTimeout(resolve, retryDelayMs));
    }

    return null;
  }

  // 3. 限流器（滑动窗口）
  async slidingWindowLimiter(
    key: string,
    maxRequests: number,
    windowMs: number
  ): Promise<{ allowed: boolean; current: number }> {
    const script = `
      local key = KEYS[1]
      local max = tonumber(ARGV[1])
      local window = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      local window_start = now - window

      -- 删除窗口外的数据
      redis.call('zremrangebyscore', key, 0, window_start)

      -- 获取当前请求数
      local current = redis.call('zcard', key)

      if current < max then
        -- 添加新请求
        redis.call('zadd', key, now, now .. ':' .. math.random())
        redis.call('pexpire', key, window)
        return { 1, current + 1 }
      else
        return { 0, current }
      end
    `;

    const now = Date.now();
    const result = await this.redis.eval(
      script,
      1,
      key,
      maxRequests,
      windowMs,
      now
    ) as [number, number];

    return {
      allowed: result[0] === 1,
      current: result[1],
    };
  }

  // 4. 排行榜批量更新（原子操作）
  async batchLeaderboardUpdate(
    leaderboardKey: string,
    updates: Array<{userId: string, score: number}>
  ): Promise<void> {
    const script = `
      local key = KEYS[1]
      for i, userId in ipairs(ARGV) do
        local score = ARGV[i + #ARGV / 2]
        redis.call('zincrby', key, score, userId)
      end
      return #ARGV / 2
    `;

    const args: (string | number)[] = [];
    for (const update of updates) {
      args.push(update.userId, update.score);
    }

    await this.redis.eval(script, 1, leaderboardKey, ...args);
  }

  // 5. 优先级队列
  async priorityEnqueue(
    queueKey: string,
    items: Array<{priority: number, data: string}>
  ): Promise<void> {
    const script = `
      local key = KEYS[1]
      for i, item in ipairs(ARGV) do
        local parts = {}
        for part in string.gmatch(item, "[^:]+") do
          table.insert(parts, part)
        end
        local priority = tonumber(parts[1])
        local data = parts[2]
        -- 负数优先级，这样大的优先级会排在前面
        redis.call('zadd', key, -priority, data)
      end
    `;

    const args = items.map(item => `${item.priority}:${item.data}`);
    await this.redis.eval(script, 1, queueKey, ...args);
  }

  async priorityDequeue(queueKey: string): Promise<string | null> {
    // 取出最高优先级（score最小的）
    const result = await this.redis.zpopmin(queueKey, 1);

    if (result.length === 0) {
      return null;
    }

    // result[0] 是 member，result[1] 是 score
    return result[0][0] as string;
  }

  // 6. 缓存访问频率限制
  async cacheAccessLimiter(
    cacheKey: string,
    maxAccesses: number,
    periodSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
    const script = `
      local key = KEYS[1]
      local max = tonumber(ARGV[1])
      local period = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])

      -- 增加访问计数
      local current = redis.call('incr', key)

      if current == 1 then
        -- 第一次访问，设置过期时间
        redis.call('expire', key, period)
      end

      local ttl = redis.call('ttl', key)

      if current <= max then
        return { 1, max - current, ttl }
      else
        return { 0, 0, ttl }
      end
    `;

    const now = Date.now() / 1000;
    const result = await this.redis.eval(
      script,
      1,
      cacheKey,
      maxAccesses,
      periodSeconds,
      now
    ) as [number, number, number];

    return {
      allowed: result[0] === 1,
      remaining: result[1],
      resetIn: result[2],
    };
  }

  // 7. 多键操作（带验证）
  async atomicTransfer(
    fromKey: string,
    toKey: string,
    amount: number
  ): Promise<'OK' | 'INSUFFICIENT_BALANCE' | 'ERROR'> {
    const script = `
      local from_key = KEYS[1]
      local to_key = KEYS[2]
      local amount = tonumber(ARGV[1])

      -- 检查源账户余额
      local balance = redis.call('get', from_key)
      if not balance then
        return 'ERROR'
      end

      balance = tonumber(balance)
      if balance < amount then
        return 'INSUFFICIENT_BALANCE'
      end

      -- 执行转账
      redis.call('decrby', from_key, amount)
      redis.call('incrby', to_key, amount)

      return 'OK'
    `;

    const result = await this.redis.eval(
      script,
      2,
      fromKey,
      toKey,
      amount
    );

    return result as 'OK' | 'INSUFFICIENT_BALANCE' | 'ERROR';
  }
}
```

### 6.3 事务：MULTI/EXEC

Redis的事务提供批量执行能力，但需要注意其与传统数据库事务的区别：

```
Redis事务 vs 数据库事务：

┌─────────────────────────────────────────────────────────┐
│                   Redis事务                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  MULTI ──► 命令1 ──► 命令2 ──► 命令3 ──► EXEC          │
│                                                         │
│  特点：                                                  │
│  ├── 命令入队，不立即执行                                 │
│  ├── EXEC时一次性执行所有命令                             │
│  ├── 无回滚机制（部分失败不影响其他命令）                  │
│  └── 无隔离级别（执行期间其他命令可插入）                   │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   数据库事务                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  BEGIN ──► SQL1 ──► SQL2 ──► SQL3 ──► COMMIT/ROLLBACK   │
│                                                         │
│  特点：                                                  │
│  ├── 隔离级别（脏读、不可重复读、幻读）                    │
│  ├── 回滚机制（任意命令失败可回滚）                        │
│  └── 锁机制（行锁、表锁）                                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

```typescript
// Redis事务示例

class TransactionExamples {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  // 基本事务
  async basicTransaction(userId: string): Promise<void> {
    const pipeline = this.redis.multi();

    pipeline.incr(`user:${userId}:posts`);
    pipeline.incr(`user:${userId}:xp`);
    pipeline.lpush(`user:${userId}:feed`, 'new_post_id');
    pipeline.expire(`user:${userId}:feed`, 86400);

    const results = await pipeline.exec();
    console.log('事务执行结果:', results);
  }

  // 监视（乐观锁）
  async optimisticLock(userId: string, amount: number): Promise<boolean> {
    const key = `account:${userId}:balance`;

    // 监视key
    await this.redis.watch(key);

    // 检查余额
    const balance = await this.redis.get(key);
    if (!balance || parseInt(balance) < amount) {
      await this.redis.unwatch();
      return false;
    }

    // 开启事务
    const multi = this.redis.multi();
    multi.decrby(key, amount);
    multi.incr(`account:${userId}:expense`, amount);

    // 执行事务
    const result = await multi.exec();

    // result === null 表示监视的key被修改了，事务未执行
    return result !== null;
  }

  // 批量操作（Pipeline vs Transaction）
  async pipelineVsTransaction(): Promise<void> {
    // Pipeline：不保证原子性，但性能更好
    const pipeStart = Date.now();
    const pipeline = this.redis.pipeline();
    for (let i = 0; i < 1000; i++) {
      pipeline.incr(`counter:${i}`);
    }
    await pipeline.exec();
    console.log(`Pipeline 1000次操作: ${Date.now() - pipeStart}ms`);

    // Transaction：保证原子性
    const txStart = Date.now();
    for (let i = 0; i < 100; i++) { // 100次，因为事务更慢
      const tx = this.redis.multi();
      tx.incr(`counter:tx:${i}`);
      await tx.exec();
    }
    console.log(`Transaction 100次操作: ${Date.now() - txStart}ms`);
  }

  // 错误处理
  async errorHandling(): Promise<void> {
    const multi = this.redis.multi();

    // 这个会成功
    multi.set('key1', 'value1');

    // 这个会失败（WRONGTYPE错误）
    multi.set('key2', 'value2');
    multi.lpush('key2', 'item'); // key2是string，不能lpush

    // 这个会成功
    multi.incr('key3');

    const results = await multi.exec();

    results!.forEach(([err, result], index) => {
      if (err) {
        console.log(`命令${index}执行失败:`, err.message);
      } else {
        console.log(`命令${index}执行成功:`, result);
      }
    });
    // 注意：即使有错误，其他命令仍会执行
  }

  // 丢弃事务
  async discardTransaction(): Promise<void> {
    const multi = this.redis.multi();
    multi.set('key1', 'value1');
    multi.incr('key1'); // 这个会失败

    // 放弃事务
    await multi.discard();

    // 验证key1是否存在
    const exists = await this.redis.exists('key1');
    console.log('key1 exists after discard:', exists);
  }
}
```

### 6.4 Pub/Sub：发布订阅

Redis的发布订阅提供实时消息传递能力：

```
Pub/Sub架构：

┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Publisher          Channel            Subscriber      │
│      │                 │                    │           │
│      │──publish───────►│                    │           │
│      │                 │                    │           │
│      │                 │◄─────subscribe─────┤           │
│      │                 │                    │           │
│      │──publish───────►│──notify───────────►│           │
│      │                 │                    │           │
│      │                 │◄─────subscribe─────┤           │
│      │                 │                    │           │
│      │──publish───────►│──notify───────────►│           │
│                                                         │
└─────────────────────────────────────────────────────────┘

模式订阅（Pattern Subscribe）：
   频道: news:* 可匹配 news.sports, news.tech, news.business
```

```typescript
// Pub/Sub示例

class PubSubExamples {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  // 1. 基础发布订阅
  async basicPubSub(): Promise<void> {
    const subscriber = this.redis.duplicate();

    // 订阅频道
    await subscriber.subscribe('chat:room1');
    await subscriber.subscribe('chat:room2');

    // 订阅模式
    await subscriber.psubscribe('notifications:*');

    // 监听消息
    subscriber.on('message', (channel, message) => {
      console.log(`频道 ${channel} 收到消息:`, message);
    });

    subscriber.on('pmessage', (pattern, channel, message) => {
      console.log(`模式 ${pattern} 匹配频道 ${channel}:`, message);
    });

    // 发布消息
    await this.redis.publish('chat:room1', 'Hello from room1');
    await this.redis.publish('chat:room2', 'Hello from room2');
    await this.redis.publish('notifications:user:123', '您有新消息');
  }

  // 2. 订阅者异常处理和重连
  async resilientSubscriber(): Promise<void> {
    const subscriber = this.redis.duplicate();

    subscriber.on('error', (err) => {
      console.error('订阅者错误:', err);
    });

    subscriber.on('close', () => {
      console.log('订阅者连接关闭');
    });

    subscriber.on('reconnecting', () => {
      console.log('订阅者正在重连');
    });

    try {
      await subscriber.subscribe('critical:channel');
    } catch (err) {
      console.error('订阅失败:', err);
    }
  }

  // 3. 按需订阅/取消订阅
  async dynamicSubscription(): Promise<void> {
    const subscriber = this.redis.duplicate();

    // 初始订阅
    await subscriber.subscribe('initial:channel');

    // 动态添加订阅
    await subscriber.subscribe('dynamic:channel1');
    await subscriber.subscribe('dynamic:channel2');

    // 动态取消订阅
    await subscriber.unsubscribe('initial:channel');

    // 批量订阅
    await subscriber.subscribe('news:sports', 'news:tech', 'news:entertainment');

    // 批量取消订阅
    await subscriber.unsubscribe('news:sports', 'news:tech');

    // 模式订阅
    await subscriber.psubscribe('user:*:status');

    // 取消模式订阅
    await subscriber.punsubscribe('user:*:status');

    subscriber.on('message', (channel, message) => {
      console.log(`收到消息 [${channel}]:`, message);
    });
  }

  // 4. 实时聊天应用
  class RealTimeChat {
    private redis: Redis;
    private subscriber: Redis;

    constructor(redis: Redis) {
      this.redis = redis;
      this.subscriber = redis.duplicate();
    }

    async sendMessage(
      roomId: string,
      userId: string,
      content: string
    ): Promise<void> {
      const message = {
        id: uuid(),
        userId,
        content,
        timestamp: Date.now(),
      };

      // 发布到房间频道
      await this.redis.publish(`chat:room:${roomId}`, JSON.stringify(message));

      // 保存消息历史（使用List）
      const historyKey = `chat:history:${roomId}`;
      await this.redis.lpush(historyKey, JSON.stringify(message));
      await this.redis.ltrim(historyKey, 0, 999); // 只保留最近1000条
    }

    async joinRoom(roomId: string, handler: (message: any) => void): Promise<void> {
      await this.subscriber.subscribe(`chat:room:${roomId}`);

      this.subscriber.on('message', (channel, message) => {
        if (channel === `chat:room:${roomId}`) {
          handler(JSON.parse(message));
        }
      });
    }

    async leaveRoom(roomId: string): Promise<void> {
      await this.subscriber.unsubscribe(`chat:room:${roomId}`);
    }

    async getHistory(roomId: string, limit: number = 50): Promise<any[]> {
      const historyKey = `chat:history:${roomId}`;
      const messages = await this.redis.lrange(historyKey, 0, limit - 1);
      return messages.map(m => JSON.parse(m)).reverse();
    }
  }

  // 5. 事件广播系统
  class EventBroadcaster {
    private redis: Redis;

    constructor(redis: Redis) {
      this.redis = redis;
    }

    // 发布事件
    async publish(
      eventType: string,
      source: string,
      payload: any
    ): Promise<void> {
      const event = {
        type: eventType,
        source,
        payload,
        timestamp: Date.now(),
      };

      // 发布到事件类型频道
      await this.redis.publish(`events:${eventType}`, JSON.stringify(event));

      // 发布到所有事件频道（用于全局监听）
      await this.redis.publish('events:all', JSON.stringify(event));
    }

    // 订阅特定事件类型
    async subscribeToType(
      eventType: string,
      handler: (event: any) => void
    ): Promise<Redis> {
      const subscriber = this.redis.duplicate();
      await subscriber.subscribe(`events:${eventType}`);

      subscriber.on('message', (channel, message) => {
        const event = JSON.parse(message);
        console.log(`收到事件 [${event.type}]:`, event);
        handler(event);
      });

      return subscriber;
    }

    // 订阅所有事件
    async subscribeToAll(handler: (event: any) => void): Promise<Redis> {
      const subscriber = this.redis.duplicate();
      await subscriber.subscribe('events:all');

      subscriber.on('message', (channel, message) => {
        const event = JSON.parse(message);
        handler(event);
      });

      return subscriber;
    }
  }

  // 6. 实现消息队列（使用Stream替代）
  // 注意：Redis 5.0引入了Stream，比Pub/Sub更适合做消息队列
  class MessageQueueWithStream {
    private redis: Redis;
    private consumerGroup: string;
    private consumerName: string;

    constructor(redis: Redis, consumerGroup: string, consumerName: string) {
      this.redis = redis;
      this.consumerGroup = consumerGroup;
      this.consumerName = consumerName;
    }

    // 生产消息
    async produce(streamKey: string, data: Record<string, string>): Promise<string> {
      const fields: string[] = [];
      for (const [key, value] of Object.entries(data)) {
        fields.push(key, value);
      }
      const messageId = await this.redis.xadd(streamKey, '*', ...fields);
      return messageId;
    }

    // 消费消息（消费者组）
    async consume(
      streamKey: string,
      count: number = 10,
      blockMs: number = 5000
    ): Promise<Array<{id: string, data: Record<string, string>}>> {
      try {
        // 尝试读取新消息
        const result = await this.redis.xreadgroup(
          'GROUP', this.consumerGroup, this.consumerName,
          'COUNT', count,
          'BLOCK', blockMs,
          'STREAMS', streamKey, '>'
        );

        if (!result) return [];

        const messages: Array<{id: string, data: Record<string, string>}> = [];
        for (const [, entries] of result) {
          for (const [id, fields] of entries as [string, string[]]) {
            const data: Record<string, string> = {};
            for (let i = 0; i < fields.length; i += 2) {
              data[fields[i]] = fields[i + 1];
            }
            messages.push({ id, data });
          }
        }

        return messages;
      } catch (err) {
        // 消费者组不存在，创建它
        if ((err as Error).message.includes('NOGROUP')) {
          await this.redis.xgroup('CREATE', streamKey, this.consumerGroup, '0', 'MKSTREAM');
          return this.consume(streamKey, count, blockMs);
        }
        throw err;
      }
    }

    // 确认消息已处理
    async ack(streamKey: string, messageId: string): Promise<void> {
      await this.redis.xack(streamKey, this.consumerGroup, messageId);
    }

    // 获取待处理消息
    async getPending(streamKey: string): Promise<number> {
      const info = await this.redis.xpending(streamKey, this.consumerGroup);
      return info[0] as number;
    }

    // 认领超时消息
    async claimTimeouts(
      streamKey: string,
      minIdleTimeMs: number = 30000
    ): Promise<Array<{id: string, data: Record<string, string>}>> {
      const result = await this.redis.xautoclaim(
        streamKey, this.consumerGroup, this.consumerName,
        minIdleTimeMs, '0-0', 'COUNT', 10
      );

      if (!result || result[1].length === 0) return [];

      const messages: Array<{id: string, data: Record<string, string>}> = [];
      for (const [id, fields] of result[1]) {
        const data: Record<string, string> = {};
        for (let i = 0; i < fields.length; i += 2) {
          data[fields[i]] = fields[i + 1];
        }
        messages.push({ id, data });
      }

      return messages;
    }
  }
}
```

### 6.5 模块：RediSearch、RedisJSON

Redis支持模块扩展，提供了强大的搜索和JSON存储能力：

```typescript
// Redis模块使用示例

// 注意：需要安装 RediSearch 和 RedisJSON 模块
// https://redis.io/docs/interact/search-and-query/
// https://redis.io/docs/data-types/json/

class RedisModulesExample {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  // ============ RedisJSON ============

  // 设置JSON对象
  async jsonSet(): Promise<void> {
    // JSON.SET path key '$' value
    await this.redis.call('JSON.SET', 'user:1001', '$', JSON.stringify({
      name: '张三',
      age: 28,
      address: {
        city: '北京',
        district: '朝阳区'
      },
      tags: ['vip', 'active']
    }));
  }

  // 获取JSON属性
  async jsonGet(): Promise<void> {
    // 获取顶层属性
    const name = await this.redis.call('JSON.GET', 'user:1001', '$.name');
    console.log('name:', name); // ["张三"]

    // 获取嵌套属性
    const city = await this.redis.call('JSON.GET', 'user:1001', '$.address.city');
    console.log('city:', city); // ["北京"]

    // 获取数组属性
    const tags = await this.redis.call('JSON.GET', 'user:1001', '$.tags[*]');
    console.log('tags:', tags); // ["vip","active"]

    // 获取多个属性
    const multi = await this.redis.call('JSON.GET', 'user:1001', '$.name', '$.age');
    console.log('multi:', multi);
  }

  // 更新JSON
  async jsonUpdate(): Promise<void> {
    // 更新属性
    await this.redis.call('JSON.NUMINCRBY', 'user:1001', '$.age', 1);

    // 添加数组元素
    await this.redis.call('JSON.ARRAPPEND', 'user:1001', '$.tags', '"premium"');

    // 删除属性
    await this.redis.call('JSON.DEL', 'user:1001', '$.address.district');
  }

  // ============ RediSearch ============

  // 创建索引
  async createSearchIndex(): Promise<void> {
    // FT.CREATE index_name ON HASH PREFIX 1 prefix: SCHEMA field_name type [options]
    await this.redis.call('FT.CREATE', 'idx:users', 'ON', 'HASH', 'PREFIX', '1', 'user:',
      'SCHEMA',
      'name', 'TEXT', 'WEIGHT', '5',
      'age', 'NUMERIC',
      'city', 'TAG',
      'created_at', 'NUMERIC',
      'status', 'TAG'
    );
  }

  // 索引已存在的用户数据
  async indexUser(userId: string): Promise<void> {
    const user = await this.redis.hgetall(`user:${userId}`);

    // 使用HSET存储基础数据
    await this.redis.hset(`user:${userId}`, {
      name: user.name,
      age: user.age,
      city: user.city,
      status: user.status,
    });

    // RediSearch会自动索引（基于prefix）
  }

  // 全文搜索
  async fullTextSearch(query: string): Promise<string[]> {
    // FT.SEARCH index_name query [options]
    const results = await this.redis.call('FT.SEARCH', 'idx:users', query, 'LIMIT', '0', '20');

    // 解析结果
    const docs: string[] = [];
    for (let i = 1; i < results.length; i += 2) {
      const [, docId] = results[i];
      docs.push(docId as string);
    }

    return docs;
  }

  // 组合搜索
  async complexSearch(): Promise<void> {
    // 搜索北京的用户，年龄在25-35之间，状态为active
    const query = '@city:{北京} @age:[25 35] @status:{active}';
    const results = await this.redis.call('FT.SEARCH', 'idx:users', query);
    console.log('搜索结果:', results);

    // 聚合查询
    // FT.AGGREGATE index query [options]
    const aggResult = await this.redis.call('FT.AGGREGATE', 'idx:users', '*',
      'GROUPBY', '1', '@city',
      'REDUCE', 'COUNT', '0', 'AS', 'user_count',
      'SORTBY', '@user_count', 'DESC'
    );
    console.log('聚合结果:', aggResult);
  }

  // 自动补全
  async autocomplete(): Promise<void> {
    // 创建补全词典
    await this.redis.call('FT.SUGADD', 'idx:users:suggest', '张三', '1.0');
    await this.redis.call('FT.SUGADD', 'idx:users:suggest', '李四', '1.0');
    await this.redis.call('FT.SUGADD', 'idx:users:suggest', '张三维', '0.8');

    // 获取建议
    const suggestions = await this.redis.call('FT.SUGGET', 'idx:users:suggest', '张');
    console.log('建议:', suggestions); // ["张三", "张三维"]
  }
}
```

### 6.6 我的思考：Redis的扩展能力

Redis的模块系统让它不仅仅是一个缓存数据库，更是一个功能丰富的数据平台：

```
Redis能力扩展图谱：

基础功能                    扩展模块
────────                    ────────
String (缓存)              → RedisJSON (JSON存储)
Hash (对象)                → RediSearch (搜索引擎)
List (队列)                → RedisGraph (图数据库)
Set (去重)                 → RedisTimeSeries (时序数据)
ZSet (排行)                → RedisBloom (布隆过滤器)
                           → RedisGears (计算引擎)
                           → RedisAI (ML模型服务)
```

**选择模块的原则**：

| 需求 | 推荐方案 |
|------|----------|
| 复杂搜索 | RediSearch |
| JSON存储 | RedisJSON |
| 时序数据 | RedisTimeSeries |
| 图关系 | RedisGraph |
| 概率计算 | RedisBloom |
| 分布式计算 | RedisGears |

---

## 7. Redis安全

### 7.1 密码认证

Redis支持设置密码进行认证：

```conf
# redis.conf 配置密码
requirepass your_redis_password

# 或者通过命令行
redis-cli config set requirepass "your_redis_password"
```

```typescript
// 密码认证

import Redis from 'ioredis';

// 方法1：连接时指定密码
const redis1 = new Redis({
  host: '127.0.0.1',
  port: 6379,
  password: 'your_redis_password',
});

// 方法2：连接后认证
const redis2 = new Redis({
  host: '127.0.0.1',
  port: 6379,
});

await redis2.auth('your_redis_password');

// 方法3：使用 AUTH 命令
await redis2.call('AUTH', 'username', 'password');

// 方法4：连接池中使用密码
import { RedisPool } from 'ioredis-pool';

const pool = new RedisPool({
  host: '127.0.0.1',
  port: 6379,
  password: 'your_redis_password',
  maxConnections: 10,
});
```

### 7.2 IP白名单

通过防火墙或Redis的bind配置限制访问来源：

```conf
# redis.conf 绑定IP
bind 127.0.0.1 192.168.1.100

# 保护模式（无密码时禁止远程访问）
protected-mode yes

# 或者禁用保护模式（仅在内网环境）
protected-mode no
```

```typescript
// 使用TLS连接（需要编译时支持）
const redis = new Redis({
  host: '127.0.0.1',
  port: 6379,
  tls: {
    // CA证书
    ca: fs.readFileSync('./ca.crt'),
    // 客户端证书
    cert: fs.readFileSync('./client.crt'),
    // 客户端私钥
    key: fs.readFileSync('./client.key'),
  },
});
```

### 7.3 命令重命名

将危险命令重命名为空或复杂名称：

```conf
# redis.conf 重命名命令
# 格式：rename-command command new_command_name

# 禁止 FLUSHDB 和 FLUSHALL
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG ""
rename-command KEYS ""

# 或者重命名为复杂名称
rename-command SHUTDOWN "shutdown_mYcOmPlEx123"
rename-command DEBUG "debug_cRaCkEr123"
```

```typescript
// 应用代码中仍然可以使用原命令名
// 但Redis服务器会执行重命名后的命令
await redis.flushdb(); // 实际执行 ""（空命令）
await redis.config('GET', '*'); // 实际执行 "config_cRaCkEr123"（可能被拒绝）
```

### 7.4 生产环境安全检查清单

```typescript
// 生产环境Redis安全检查

class RedisSecurityChecklist {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async runSecurityAudit(): Promise<{
    passed: boolean;
    issues: string[];
    warnings: string[];
  }> {
    const issues: string[] = [];
    const warnings: string[] = [];

    // 1. 检查密码
    const config = await this.redis.config('GET', 'requirepass');
    if (!config[1]) {
      issues.push('Redis未设置密码');
    }

    // 2. 检查绑定地址
    const bind = await this.redis.config('GET', 'bind');
    const bindValue = bind[1] as string;
    if (bindValue.includes('0.0.0.0') || bindValue.includes('::')) {
      warnings.push('Redis绑定到所有地址，请确保有防火墙保护');
    }

    // 3. 检查保护模式
    const protectedMode = await this.redis.config('GET', 'protected-mode');
    if (protectedMode[1] === 'yes') {
      warnings.push('保护模式已开启，但建议设置密码');
    }

    // 4. 检查危险命令
    const dangerousCommands = ['FLUSHDB', 'FLUSHALL', 'KEYS', 'DEBUG', 'CONFIG'];
    for (const cmd of dangerousCommands) {
      const renameConfig = await this.redis.config('GET', `rename-command`);
      // 检查是否已被重命名
    }

    // 5. 检查AOF/RDB持久化状态
    const appendonly = await this.redis.config('GET', 'appendonly');
    if (appendonly[1] === 'no') {
      warnings.push('AOF持久化未开启，数据可能丢失');
    }

    // 6. 检查慢查询日志
    const slowlog = await this.redis.slowlog('len');
    if ((slowlog as number) > 100) {
      warnings.push('慢查询日志过多，可能存在性能问题');
    }

    return {
      passed: issues.length === 0,
      issues,
      warnings,
    };
  }

  // 安全建议报告
  async generateSecurityReport(): Promise<string> {
    const report = `
Redis 安全审计报告
==================

1. 认证配置
   - 密码保护: ${await this.hasPassword() ? '已配置' : '未配置'}
   - 保护模式: ${await this.isProtectedMode()}

2. 网络安全
   - 绑定地址: ${await this.getBindAddress()}
   - 端口: ${await this.getPort()}
   - TLS: ${await this.isTLSEnabled() ? '已启用' : '未启用'}

3. 命令安全
   - FLUSHDB限制: ${await this.isCommandRenamed('FLUSHDB')}
   - FLUSHALL限制: ${await this.isCommandRenamed('FLUSHALL')}
   - KEYS限制: ${await this.isCommandRenamed('KEYS')}

4. 数据安全
   - RDB持久化: ${await this.isRDBEnabled()}
   - AOF持久化: ${await this.isAOFEnabled()}
   - 备份策略: ${await this.getBackupStrategy()}

5. 监控配置
   - 慢查询阈值: ${await this.getSlowLogThreshold()}ms
   - 客户端最大数: ${await this.getMaxClients()}

建议:
${await this.generateRecommendations()}
    `.trim();

    return report;
  }

  private async hasPassword(): Promise<boolean> {
    const config = await this.redis.config('GET', 'requirepass');
    return !!config[1];
  }

  private async isProtectedMode(): Promise<string> {
    const config = await this.redis.config('GET', 'protected-mode');
    return config[1] as string;
  }

  private async getBindAddress(): Promise<string> {
    const config = await this.redis.config('GET', 'bind');
    return config[1] as string;
  }

  private async getPort(): Promise<string> {
    const config = await this.redis.config('GET', 'port');
    return config[1] as string;
  }

  private async isTLSEnabled(): Promise<boolean> {
    const config = await this.redis.config('GET', 'tls-port');
    return parseInt(config[1] as string) > 0;
  }

  private async isCommandRenamed(command: string): Promise<string> {
    const config = await this.redis.config('GET', `rename-command`);
    // 检查实现...
    return '未检查';
  }

  private async isRDBEnabled(): Promise<string> {
    const config = await this.redis.config('GET', 'save');
    const saveValue = config[1] as string;
    return saveValue ? '已配置' : '未配置';
  }

  private async isAOFEnabled(): Promise<string> {
    const config = await this.redis.config('GET', 'appendonly');
    return config[1] === 'yes' ? '已启用' : '未启用';
  }

  private async getBackupStrategy(): Promise<string> {
    // 根据配置判断备份策略
    return '需人工评估';
  }

  private async getSlowLogThreshold(): Promise<string> {
    const config = await this.redis.config('GET', 'slowlog-log-slower-than');
    return (parseInt(config[1] as string) / 1000).toString();
  }

  private async getMaxClients(): Promise<string> {
    const config = await this.redis.config('GET', 'maxclients');
    return config[1] as string;
  }

  private async generateRecommendations(): Promise<string> {
    return `
1. 【必须】为Redis设置强密码
2. 【必须】禁止将Redis暴露在公网
3. 【必须】重命名或禁用危险命令（FLUSHDB, FLUSHALL, CONFIG）
4. 【建议】启用TLS加密传输
5. 【建议】配置AOF + RDB混合持久化
6. 【建议】设置合适的慢查询阈值
7. 【建议】配置定期备份策略
    `.trim();
  }
}
```

### 7.5 我的思考：生产环境Redis安全配置

生产环境Redis安全需要多层防护：

```
安全防护层次：

外层防护
├── 网络隔离（VPC/防火墙）
├── DDoS防护
└── WAF防护
    │
中间层
├── IP白名单
├── 密码认证
├── TLS加密
└── 命令重命名
    │
内层
├── 最小权限原则（应用程序用户）
├── 敏感数据加密（应用层）
└── 审计日志
```

---

## 8. Redis运维

### 8.1 内存管理：内存淘汰策略

Redis提供了8种内存淘汰策略：

```
淘汰策略分类：

┌─────────────────────────────────────────────────────────┐
│                    不淘汰（默认）                        │
│                   maxmemory-policy = noeviction        │
│         所有写操作（SET/INCR等）会报错                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                 在过期key中淘汰                          │
│                                                         │
│  volatile-lru    ──► LRU算法，选择最近最少使用的过期key  │
│  volatile-lfu    ──► LFU算法，选择最少使用的过期key      │
│  volatile-ttl    ──► 选择剩余TTL最短的过期key            │
│  volatile-random ──► 随机选择过期key                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    在所有key中淘汰                       │
│                                                         │
│  allkeys-lru    ──► LRU算法，选择最近最少使用的key        │
│  allkeys-lfu    ──► LFU算法，选择最少使用的key            │
│  allkeys-random ──► 随机选择key                         │
└─────────────────────────────────────────────────────────┘
```

```conf
# 内存配置
maxmemory 2gb                    # 最大内存2GB
maxmemory-policy allkeys-lru     # 使用allkeys-lru淘汰策略
maxmemory-samples 5              # LRU/LFU采样数
```

```typescript
// 内存管理示例

class MemoryManagement {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  // 获取内存使用信息
  async getMemoryInfo(): Promise<{
    usedMemory: number;
    usedMemoryPeak: number;
    usedMemoryRss: number;
    memFragmentationRatio: number;
  }> {
    const info = await this.redis.info('memory');
    const lines = info.split('\r\n');

    const memInfo: Record<string, string> = {};
    for (const line of lines) {
      const [key, value] = line.split(':');
      if (key && value) {
        memInfo[key.trim()] = value.trim();
      }
    }

    return {
      usedMemory: parseInt(memInfo['used_memory']),
      usedMemoryPeak: parseInt(memInfo['used_memory_peak']),
      usedMemoryRss: parseInt(memInfo['used_memory_rss']),
      memFragmentationRatio: parseFloat(memInfo['mem_fragmentation_ratio']),
    };
  }

  // 诊断内存问题
  async diagnoseMemory(): Promise<{
    totalMemory: number;
    usedMemory: number;
    fragmentation: number;
    peakMemory: number;
    issues: string[];
  }> {
    const info = await this.getMemoryInfo();
    const config = await this.redis.config('GET', 'maxmemory');
    const maxMemory = parseInt(config[1] as string);

    const issues: string[] = [];

    // 检查内存使用率
    const usageRatio = info.usedMemory / maxMemory;
    if (usageRatio > 0.8) {
      issues.push(`内存使用率过高: ${(usageRatio * 100).toFixed(1)}%`);
    }

    // 检查内存碎片
    if (info.memFragmentationRatio > 1.5) {
      issues.push(`内存碎片率过高: ${info.memFragmentationRatio.toFixed(2)}`);
    } else if (info.memFragmentationRatio < 1) {
      issues.push('内存碎片率为负，可能需要重启');
    }

    // 检查峰值
    const peakRatio = info.usedMemoryPeak / maxMemory;
    if (peakRatio > 0.9) {
      issues.push(`历史峰值接近上限: ${(peakRatio * 100).toFixed(1)}%`);
    }

    return {
      totalMemory: maxMemory,
      usedMemory: info.usedMemory,
      fragmentation: info.memFragmentationRatio,
      peakMemory: info.usedMemoryPeak,
      issues,
    };
  }

  // 内存优化建议
  async getOptimizationSuggestions(): Promise<string[]> {
    const suggestions: string[] = [];

    const info = await this.redis.info('memory');
    const lines = info.split('\r\n');
    const memInfo: Record<string, string> = {};

    for (const line of lines) {
      const [key, value] = line.split(':');
      if (key && value) {
        memInfo[key.trim()] = value.trim();
      }
    }

    // 检查大字符串
    const bigStringKeys = await this.findBigStrings();
    if (bigStringKeys.length > 0) {
      suggestions.push(`发现${bigStringKeys.length}个大字符串，建议使用Hash存储`);
    }

    // 检查过期策略
    const keyCount = await this.redis.dbsize();
    const expireCount = await this.redis.info('keyspace');

    // 检查内存碎片
    if (parseFloat(memInfo['mem_fragmentation_ratio']) > 1.5) {
      suggestions.push('内存碎片率高，建议重启Redis或执行MEMORY PURGE');
    }

    // 检查过期key比例
    const expireInfo = memInfo['expired_keys'];
    const totalConnections = memInfo['total_connections_received'];
    if (expireInfo && parseInt(expireInfo) > 1000000) {
      suggestions.push('过期key过多，考虑调整TTL或使用volatile淘汰策略');
    }

    return suggestions;
  }

  // 查找大字符串
  async findBigStrings(threshold: number = 10000): Promise<string[]> {
    const bigKeys: string[] = [];
    let cursor = '0';

    do {
      const [newCursor, keys] = await this.redis.scan(cursor, 'TYPE', 'string', 'COUNT', 1000);
      cursor = newCursor;

      for (const key of keys) {
        const len = await this.redis.strlen(key);
        if (len > threshold) {
          bigKeys.push(key);
        }
      }
    } while (cursor !== '0');

    return bigKeys;
  }

  // 查找大Hash
  async findBigHashes(threshold: number = 1000): Promise<string[]> {
    const bigKeys: string[] = [];
    let cursor = '0';

    do {
      const [newCursor, keys] = await this.redis.scan(cursor, 'TYPE', 'hash', 'COUNT', 1000);
      cursor = newCursor;

      for (const key of keys) {
        const fieldCount = await this.redis.hlen(key);
        if (fieldCount > threshold) {
          bigKeys.push(key);
        }
      }
    } while (cursor !== '0');

    return bigKeys;
  }

  // 清理内存碎片
  async defragmentMemory(): Promise<void> {
    // 仅主动释放fragmented内存（需要Redis 4.0+）
    await this.redis.memory('PURGE');
  }
}
```

### 8.2 慢查询分析：slowlog

```typescript
// 慢查询分析

class SlowQueryAnalysis {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  // 获取慢查询配置
  async getSlowLogConfig(): Promise<{
    threshold: number;
    maxLength: number;
  }> {
    const threshold = await this.redis.config('GET', 'slowlog-log-slower-than');
    const maxLength = await this.redis.config('GET', 'slowlog-max-len');

    return {
      threshold: parseInt(threshold[1] as string) / 1000, // 转换为毫秒
      maxLength: parseInt(maxLength[1] as string),
    };
  }

  // 设置慢查询阈值
  async setThreshold(ms: number): Promise<void> {
    await this.redis.config('SET', 'slowlog-log-slower-than', (ms * 1000).toString());
  }

  // 获取最近的慢查询
  async getRecentSlowQueries(count: number = 10): Promise<Array<{
    id: number;
    duration: number;
    command: string;
    args: string[];
    timestamp: number;
  }>> {
    const slowLogs = await this.redis.slowlog('GET', count);

    return slowLogs.map(log => ({
      id: log[0] as number,
      duration: (log[1] as number) / 1000, // 微秒转毫秒
      command: (log[3] as string[])[0],
      args: (log[3] as string[]).slice(1),
      timestamp: log[2] as number,
    }));
  }

  // 分析慢查询模式
  async analyzeSlowQueryPattern(): Promise<{
    total: number;
    commands: Map<string, number>;
    avgDuration: number;
    suggestions: string[];
  }> {
    const slowLogs = await this.redis.slowlog('GET', 1000);

    const commands = new Map<string, number>();
    let totalDuration = 0;

    for (const log of slowLogs) {
      const command = (log[3] as string[])[0];
      const duration = log[1] as number;

      commands.set(command, (commands.get(command) || 0) + 1);
      totalDuration += duration;
    }

    const suggestions: string[] = [];

    // 分析命令模式
    for (const [command, count] of commands.entries()) {
      if (command === 'KEYS') {
        suggestions.push('使用SCAN替代KEYS命令');
      }
      if (command === 'SMEMBERS' && count > 10) {
        suggestions.push('考虑使用SSCAN替代SMEMBERS');
      }
      if (command === 'HGETALL' && count > 10) {
        suggestions.push('考虑使用HSCAN替代HGETALL');
      }
    }

    return {
      total: slowLogs.length,
      commands,
      avgDuration: slowLogs.length > 0 ? totalDuration / slowLogs.length / 1000 : 0,
      suggestions,
    };
  }

  // 实时监控慢查询
  async monitorSlowQueries(
    onSlowQuery: (query: { command: string; duration: number }) => void,
    thresholdMs: number = 100
  ): Promise<void> {
    // 先设置阈值
    await this.setThreshold(thresholdMs);

    // 定期检查slowlog
    setInterval(async () => {
      const slowLogs = await this.redis.slowlog('GET', 10);

      for (const log of slowLogs) {
        const duration = (log[1] as number) / 1000;
        const command = (log[3] as string[]).join(' ');
        onSlowQuery({ command, duration });
      }

      // 清空slowlog以获取新的
      await this.redis.slowlog('RESET');
    }, 5000);
  }
}
```

### 8.3 bigkey处理：如何发现和优化

```typescript
// bigkey检测与处理

class BigKeyHandler {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  // 扫描并检测bigkey
  async findBigKeys(
    type?: 'string' | 'hash' | 'list' | 'set' | 'zset'
  ): Promise<Array<{
    key: string;
    type: string;
    size: number;
    memoryEstimate: number;
  }>> {
    const bigKeys: Array<{
      key: string;
      type: string;
      size: number;
      memoryEstimate: number;
    }> = [];

    // 使用--bigkeys选项（通过redis-cli）
    // redis-cli --bigkeys

    // 使用SCAN + TYPE遍历
    let cursor = '0';
    do {
      const [newCursor, keys] = await this.redis.scan(
        cursor,
        'COUNT',
        1000,
        type ? 'TYPE' : undefined,
        type
      );
      cursor = newCursor;

      for (const key of keys) {
        const info = await this.getKeyInfo(key);
        if (info.size > 10000) { // 超过10KB
          bigKeys.push(info);
        }
      }
    } while (cursor !== '0');

    // 按size排序
    bigKeys.sort((a, b) => b.size - a.size);

    return bigKeys.slice(0, 100); // 返回Top 100
  }

  // 获取单个key的信息
  async getKeyInfo(key: string): Promise<{
    key: string;
    type: string;
    size: number;
    memoryEstimate: number;
  }> {
    const type = await this.redis.type(key);
    let size = 0;
    let memoryEstimate = 0;

    switch (type) {
      case 'string':
        size = await this.redis.strlen(key);
        memoryEstimate = size;
        break;

      case 'hash':
        const hashLen = await this.redis.hlen(key);
        size = hashLen;
        // Hash编码转换判断
        const hashInfo = await this.redis.debug('OBJECT', 'ENCODING', key);
        memoryEstimate = hashInfo === 'ziplist'
          ? hashLen * 50
          : hashLen * 200;
        break;

      case 'list':
        const listLen = await this.redis.llen(key);
        size = listLen;
        memoryEstimate = listLen * 100;
        break;

      case 'set':
        const setLen = await this.redis.scard(key);
        size = setLen;
        memoryEstimate = setLen * 200;
        break;

      case 'zset':
        const zsetLen = await this.redis.zcard(key);
        size = zsetLen;
        memoryEstimate = zsetLen * 300;
        break;
    }

    return { key, type, size, memoryEstimate };
  }

  // 渐进式删除bigkey
  async safeDelete(key: string): Promise<void> {
    const type = await this.redis.type(key);

    switch (type) {
      case 'string':
        await this.redis.del(key);
        break;

      case 'hash':
        // 渐进式删除
        await this.deleteHashIncrementally(key, 1000);
        break;

      case 'list':
        // 渐进式删除
        await this.deleteListIncrementally(key, 1000);
        break;

      case 'set':
        await this.redis.del(key);
        break;

      case 'zset':
        await this.redis.del(key);
        break;
    }
  }

  private async deleteHashIncrementally(key: string, batchSize: number): Promise<void> {
    let deleted = 0;
    do {
      // 使用HDEL批量删除
      const fields = await this.redis.hkeys(key);
      if (fields.length === 0) break;

      const toDelete = fields.slice(0, batchSize);
      await this.redis.hdel(key, ...toDelete);
      deleted += toDelete.length;

      console.log(`已删除Hash ${key} 的 ${deleted} 个字段`);
    } while (true);
  }

  private async deleteListIncrementally(key: string, batchSize: number): Promise<void> {
    let deleted = 0;
    do {
      const length = await this.redis.llen(key);
      if (length === 0) break;

      const toDelete = Math.min(batchSize, length);
      await this.redis.ltrim(key, toDelete, -1);
      deleted += toDelete;

      console.log(`已删除List ${key} 的 ${deleted} 个元素`);
    } while (true);
  }

  // 异步删除bigkey（不阻塞）
  async asyncDelete(key: string): Promise<void> {
    // Redis 4.0+ 支持UNLINK命令（异步删除）
    await this.redis.unlink(key);
  }

  // 分割bigkey为小key
  async splitBigHash(
    sourceKey: string,
    targetPattern: string,
    fieldsPerKey: number = 100
  ): Promise<void> {
    const fields = await this.redis.hgetall(sourceKey);

    let index = 0;
    let currentKey = `${targetPattern}:${index}`;
    let fieldCount = 0;

    const pipeline = this.redis.pipeline();

    for (const [field, value] of Object.entries(fields)) {
      pipeline.hset(currentKey, field, value);
      fieldCount++;

      if (fieldCount >= fieldsPerKey) {
        await pipeline.exec();
        index++;
        currentKey = `${targetPattern}:${index}`;
        fieldCount = 0;
      }
    }

    // 处理剩余字段
    if (fieldCount > 0) {
      await pipeline.exec();
    }

    // 删除原key
    await this.redis.unlink(sourceKey);

    console.log(`已将Hash ${sourceKey} 分割为 ${index + 1} 个小Hash`);
  }
}
```

### 8.4 监控指标：info命令解读

```typescript
// Redis监控指标收集

class RedisMonitor {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  // 获取所有监控指标
  async getAllMetrics(): Promise<{
    server: Record<string, string>;
    clients: Record<string, string>;
    memory: Record<string, string>;
    persistence: Record<string, string>;
    stats: Record<string, string>;
    replication: Record<string, string>;
    cpu: Record<string, string>;
    commandstats: Record<string, string>;
  }> {
    const info = await this.redis.info();
    const sections = info.split('\r\n\r\n');

    const result: any = {};

    for (const section of sections) {
      const lines = section.split('\r\n');
      if (lines.length < 1) continue;

      const sectionName = lines[0].replace('#', '').toLowerCase();
      const sectionData: Record<string, string> = {};

      for (let i = 1; i < lines.length; i++) {
        const [key, value] = lines[i].split(':');
        if (key && value) {
          sectionData[key.trim()] = value.trim();
        }
      }

      result[sectionName] = sectionData;
    }

    return result;
  }

  // 关键指标健康检查
  async healthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    metrics: {
      memoryUsagePercent: number;
      connectedClients: number;
      opsPerSecond: number;
      hitRate: number;
      replicationLag: number;
    };
  }> {
    const metrics = await this.getAllMetrics();
    const issues: string[] = [];

    // 内存检查
    const maxMemory = parseInt(metrics.memory?.maxmemory || '0');
    const usedMemory = parseInt(metrics.memory?.used_memory || '0');
    const memoryUsagePercent = maxMemory > 0 ? (usedMemory / maxMemory) * 100 : 0;

    if (memoryUsagePercent > 90) {
      issues.push('内存使用率超过90%');
    } else if (memoryUsagePercent > 80) {
      issues.push('内存使用率超过80%');
    }

    // 客户端检查
    const connectedClients = parseInt(metrics.clients?.connected_clients || '0');
    const maxClients = parseInt((await this.redis.config('GET', 'maxclients'))[1] as string);

    if (connectedClients / maxClients > 0.8) {
      issues.push('客户端连接数接近上限');
    }

    // OPS检查
    const opsPerSecond = parseInt(metrics.stats?.instantaneous_ops_per_sec || '0');

    // 命中率检查
    const keyspaceHits = parseInt(metrics.keyspace?.hits || '0');
    const keyspaceMisses = parseInt(metrics.keyspace?.misses || '0');
    const total = keyspaceHits + keyspaceMisses;
    const hitRate = total > 0 ? (keyspaceHits / total) * 100 : 0;

    if (hitRate < 50) {
      issues.push(`缓存命中率过低: ${hitRate.toFixed(1)}%`);
    }

    // 复制延迟检查
    let replicationLag = 0;
    if (metrics.replication) {
      const masterSyncInProgress = metrics.replication.master_sync_in_progress;
      if (masterSyncInProgress === '1') {
        issues.push('主从同步正在进行中');
      }
    }

    // 判断健康状态
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (issues.some(i => i.includes('超过90%') || i.includes('接近上限'))) {
      status = 'critical';
    } else if (issues.length > 0) {
      status = 'warning';
    }

    return {
      status,
      issues,
      metrics: {
        memoryUsagePercent,
        connectedClients,
        opsPerSecond,
        hitRate,
        replicationLag,
      },
    };
  }

  // 命令统计
  async getCommandStats(): Promise<Array<{
    command: string;
    calls: number;
    usec: number;
    usecPerCall: number;
  }>> {
    const stats = await this.redis.info('commandstats');
    const lines = stats.split('\r\n');

    const commands: Array<{
      command: string;
      calls: number;
      usec: number;
      usecPerCall: number;
    }> = [];

    for (const line of lines) {
      if (!line.startsWith('cmdstat_')) continue;

      const parts = line.split(':');
      const command = parts[0].replace('cmdstat_', '');
      const values = parts[1].split(',');

      const calls = parseInt(values.find(v => v.includes('calls='))?.split('=')[1] || '0');
      const usec = parseInt(values.find(v => v.includes('usec='))?.split('=')[1] || '0');
      const usecPerCall = calls > 0 ? usec / calls : 0;

      commands.push({ command, calls, usec, usecPerCall });
    }

    return commands.sort((a, b) => b.calls - a.calls);
  }

  // 实时监控面板数据
  async getDashboardData(): Promise<{
    qps: number;
    clients: number;
    memory: { used: number; percent: number };
    hits: { hits: number; misses: number; rate: number };
    commands: Array<{ name: string; count: number }>;
    cpu: { used: number };
    network: { inbound: number; outbound: number };
  }> {
    const metrics = await this.getAllMetrics();

    // QPS
    const qps = parseInt(metrics.stats?.instantaneous_ops_per_sec || '0');

    // 客户端
    const clients = parseInt(metrics.clients?.connected_clients || '0');

    // 内存
    const maxMemory = parseInt((await this.redis.config('GET', 'maxmemory'))[1] as string);
    const usedMemory = parseInt(metrics.memory?.used_memory || '0');

    // 命中率
    const hits = parseInt(metrics.stats?.keyspace_hits || '0');
    const misses = parseInt(metrics.stats?.keyspace_misses || '0');

    // 命令统计
    const commandStats = await this.getCommandStats();

    // CPU
    const usedCpuSys = parseFloat(metrics.cpu?.used_cpu_sys || '0');
    const usedCpuUser = parseFloat(metrics.cpu?.used_cpu_user || '0');

    // 网络
    const totalNetInput = parseInt(metrics.clients?.total_net_input_bytes || '0');
    const totalNetOutput = parseInt(metrics.clients?.total_net_output_bytes || '0');

    return {
      qps,
      clients,
      memory: {
        used: usedMemory,
        percent: maxMemory > 0 ? (usedMemory / maxMemory) * 100 : 0,
      },
      hits: {
        hits,
        misses,
        rate: hits + misses > 0 ? (hits / (hits + misses)) * 100 : 0,
      },
      commands: commandStats.slice(0, 10).map(c => ({
        name: c.command,
        count: c.calls,
      })),
      cpu: {
        used: usedCpuSys + usedCpuUser,
      },
      network: {
        inbound: totalNetInput,
        outbound: totalNetOutput,
      },
    };
  }
}
```

### 8.5 我的思考：Redis监控的重要性

Redis监控是生产环境的必要保障：

```
监控维度：

┌─────────────────────────────────────────────────────────┐
│                      监控金字塔                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                        业务层                            │
│                   (错误率、响应时间)                      │
│                        ▲                                │
│                        │                                │
│                       性能层                             │
│                  (QPS、延迟、命中率)                      │
│                        ▲                                │
│                        │                                │
│                       资源层                             │
│               (内存、CPU、连接数)                         │
│                        ▲                                │
│                        │                                │
│                       可用层                             │
│              (主从状态、故障转移、重启)                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 9. Redis + Node.js

### 9.1 ioredis使用

```typescript
// ioredis基础使用

import Redis from 'ioredis';

// 1. 基本连接
const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),

  // 连接选项
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  connectTimeout: 10000,
});

// 连接事件
redis.on('connect', () => {
  console.log('Redis连接成功');
});

redis.on('ready', () => {
  console.log('Redis已就绪');
});

redis.on('error', (err) => {
  console.error('Redis错误:', err);
});

redis.on('close', () => {
  console.log('Redis连接关闭');
});

redis.on('reconnecting', () => {
  console.log('Redis正在重连');
});

// 2. 自动重连配置
const redisAutoReconnect = new Redis({
  host: '127.0.0.1',
  port: 6379,

  // 重试策略
  retryStrategy: (times) => {
    if (times > 10) {
      // 重试10次后停止
      console.error('Redis重试次数过多，停止重连');
      return null;
    }

    // 指数退避，最大2秒
    const delay = Math.min(times * 100, 2000);
    console.log(`${delay}ms后重连...`);
    return delay;
  },

  // 断线后是否自动重连
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true; // 只对READONLY错误自动重连
    }
    return false;
  },
});

// 3. 哨兵模式
const redisSentinel = new Redis({
  sentinels: [
    { host: '192.168.1.201', port: 26379 },
    { host: '192.168.1.202', port: 26379 },
    { host: '192.168.1.203', port: 26379 },
  ],
  name: 'mymaster',
  password: 'your-password',

  // 密码
  sentinelPassword: 'your-sentinel-password',

  // 选择最近的哨兵
  enableSentinelTLS: false,

  // 连接到从节点读取
  readOnly: false,
});

// 4. 集群模式
const redisCluster = new Redis.Cluster([
  { host: '192.168.1.100', port: 6379 },
  { host: '192.168.1.101', port: 6379 },
  { host: '192.168.1.102', port: 6379 },
  { host: '192.168.1.103', port: 6379 },
  { host: '192.168.1.104', port: 6379 },
  { host: '192.168.1.105', port: 6379 },
], {
  redisOptions: {
    password: 'your-password',
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
  },

  // 槽刷新策略
  slotsRefreshTimeout: 60000,
  slotsRefreshInterval: 10000,

  // 故障转移
  maxRedirections: 16,

  // 读取策略
  scaleReads: 'masters', // 'masters' | 'slaves' | 'all'
});
```

### 9.2 连接池配置

```typescript
// 连接池配置

import Redis from 'ioredis';

// 1. 单连接配置
const singleConnection = new Redis({
  // 连接复用（默认）
  family: 4,           // IPv4
  keepAlive: 0,        // TCP keepalive，0表示禁用
  connectTimeout: 10000,
  maxRetriesPerRequest: 3,

  // 命令超时
  commandTimeout: 5000,

  // 自动管道
  enablePipelining: true,
});

// 2. 连接池（使用cluster模式自动管理）
const pool = new Redis.Cluster([/* nodes */], {
  // 连接池大小
  clusterPoolSize: 10,
  clusterPoolThreshold: 0.5,

  // 共享连接
  shareTLS: false,
});

// 3. 手动连接池实现
import { Pool } from 'generic-pool';

class RedisPoolManager {
  private pool: Pool<Redis>;

  constructor(config: {
    min: number;
    max: number;
    host: string;
    port: number;
  }) {
    this.pool = Pool({
      min: config.min,
      max: config.max,

      create: async () => {
        const redis = new Redis({
          host: config.host,
          port: config.port,
          maxRetriesPerRequest: 3,
        });

        await new Promise<void>((resolve, reject) => {
          redis.once('ready', resolve);
          redis.once('error', reject);
        });

        return redis;
      },

      destroy: async (redis) => {
        await redis.quit();
      },

      validate: async (redis) => {
        try {
          await redis.ping();
          return true;
        } catch {
          return false;
        }
      },
    });
  }

  async acquire(): Promise<Redis> {
    return this.pool.acquire();
  }

  async release(redis: Redis): Promise<void> {
    this.pool.release(redis);
  }

  async drain(): Promise<void> {
    await this.pool.drain();
    await this.pool.clear();
  }
}

// 使用示例
async function poolExample() {
  const manager = new RedisPoolManager({
    min: 5,
    max: 20,
    host: '127.0.0.1',
    port: 6379,
  });

  try {
    const redis = await manager.acquire();

    // 使用redis
    await redis.get('key');

    // 释放回池
    await manager.release(redis);
  } finally {
    await manager.drain();
  }
}

// 4. 优雅关闭
async function gracefulShutdown(redis: Redis): Promise<void> {
  console.log('开始关闭Redis连接...');

  // 1. 停止接收新请求
  redis.disconnect();

  // 2. 等待现有请求完成
  await new Promise(resolve => setTimeout(resolve, 100));

  // 3. 关闭连接
  await redis.quit();

  console.log('Redis连接已关闭');
}
```

### 9.3 实战：Redis实现Session共享

```typescript
// Redis Session共享实现

import Redis from 'ioredis';
import { v4 as uuid } from 'uuid';

interface SessionData {
  userId: string;
  username: string;
  email: string;
  roles: string[];
  createdAt: number;
  lastAccessedAt: number;
  [key: string]: any;
}

class RedisSessionManager {
  private redis: Redis;
  private prefix: string;
  private defaultTtl: number;

  constructor(
    redis: Redis,
    options: {
      prefix?: string;
      defaultTtl?: number;
    } = {}
  ) {
    this.redis = redis;
    this.prefix = options.prefix || 'session:';
    this.defaultTtl = options.defaultTtl || 86400; // 默认24小时
  }

  // 创建Session
  async createSession(data: Omit<SessionData, 'createdAt' | 'lastAccessedAt'>): Promise<string> {
    const sessionId = uuid();
    const key = this.prefix + sessionId;

    const session: SessionData = {
      ...data,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
    };

    await this.redis.setex(key, this.defaultTtl, JSON.stringify(session));

    return sessionId;
  }

  // 获取Session
  async getSession(sessionId: string): Promise<SessionData | null> {
    const key = this.prefix + sessionId;
    const data = await this.redis.get(key);

    if (!data) {
      return null;
    }

    const session = JSON.parse(data) as SessionData;

    // 更新最后访问时间
    session.lastAccessedAt = Date.now();
    await this.redis.expire(key, this.defaultTtl);

    return session;
  }

  // 更新Session
  async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<boolean> {
    const session = await this.getSession(sessionId);

    if (!session) {
      return false;
    }

    const key = this.prefix + sessionId;
    const updatedSession = {
      ...session,
      ...updates,
      lastAccessedAt: Date.now(),
    };

    await this.redis.setex(key, this.defaultTtl, JSON.stringify(updatedSession));

    return true;
  }

  // 删除Session
  async deleteSession(sessionId: string): Promise<boolean> {
    const key = this.prefix + sessionId;
    const result = await this.redis.del(key);

    return result === 1;
  }

  // Session续期
  async refreshSession(sessionId: string, ttl?: number): Promise<boolean> {
    const key = this.prefix + sessionId;
    const exists = await this.redis.exists(key);

    if (!exists) {
      return false;
    }

    await this.redis.expire(key, ttl || this.defaultTtl);

    return true;
  }

  // 统计在线用户
  async getOnlineUserCount(): Promise<number> {
    let cursor = '0';
    let count = 0;

    do {
      const [newCursor, keys] = await this.redis.scan(
        cursor,
        'MATCH',
        this.prefix + '*',
        'COUNT',
        100
      );
      cursor = newCursor;
      count += keys.length;
    } while (cursor !== '0');

    return count;
  }

  // 获取所有Session（管理员用）
  async getAllSessions(
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ sessions: SessionData[]; total: number }> {
    let cursor = '0';
    const allKeys: string[] = [];

    do {
      const [newCursor, keys] = await this.redis.scan(
        cursor,
        'MATCH',
        this.prefix + '*',
        'COUNT',
        1000
      );
      cursor = newCursor;
      allKeys.push(...keys);
    } while (cursor !== '0');

    const sessions: SessionData[] = [];
    const pipeline = this.redis.pipeline();

    for (const key of allKeys) {
      pipeline.get(key);
    }

    const results = await pipeline.exec();

    if (results) {
      for (const [err, data] of results) {
        if (!err && data) {
          sessions.push(JSON.parse(data as string));
        }
      }
    }

    // 按最后访问时间排序
    sessions.sort((a, b) => b.lastAccessedAt - a.lastAccessedAt);

    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      sessions: sessions.slice(start, end),
      total: sessions.length,
    };
  }

  // 清理过期Session（通过SCAN而非keys）
  async cleanupExpiredSessions(): Promise<number> {
    let cursor = '0';
    let deleted = 0;

    do {
      const [newCursor, keys] = await this.redis.scan(
        cursor,
        'MATCH',
        this.prefix + '*',
        'COUNT',
        100
      );
      cursor = newCursor;

      for (const key of keys) {
        const ttl = await this.redis.ttl(key);
        if (ttl === -1) {
          // 永不过期的session（数据异常），删除它
          await this.redis.del(key);
          deleted++;
        }
      }
    } while (cursor !== '0');

    return deleted;
  }
}

// Express中间件集成
import { Request, Response, NextFunction } from 'express';

function sessionMiddleware(sessionManager: RedisSessionManager) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // 从Cookie或Header获取sessionId
    const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];

    if (sessionId) {
      const session = await sessionManager.getSession(sessionId);
      if (session) {
        (req as any).session = session;
        (req as any).sessionId = sessionId;
      }
    }

    next();
  };
}

// 使用示例
async function sessionExample() {
  const redis = new Redis({ host: '127.0.0.1', port: 6379 });
  const sessionManager = new RedisSessionManager(redis);

  // 创建session
  const sessionId = await sessionManager.createSession({
    userId: 'user_123',
    username: '张三',
    email: 'zhangsan@example.com',
    roles: ['admin', 'user'],
  });

  console.log('Session创建成功:', sessionId);

  // 获取session
  const session = await sessionManager.getSession(sessionId);
  console.log('Session数据:', session);

  // 更新session
  await sessionManager.updateSession(sessionId, {
    lastLoginAt: Date.now(),
  });

  // 删除session
  await sessionManager.deleteSession(sessionId);
}
```

### 9.4 实战：Redis实现缓存服务

```typescript
// Redis缓存服务完整实现

import Redis from 'ioredis';

interface CacheOptions {
  ttl?: number;
  prefix?: string;
  compress?: boolean;
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  keys: number;
  memory: number;
}

class RedisCacheService {
  private redis: Redis;
  private prefix: string;
  private defaultTtl: number;
  private stats = { hits: 0, misses: 0 };

  constructor(
    redis: Redis,
    options: {
      prefix?: string;
      defaultTtl?: number;
    } = {}
  ) {
    this.redis = redis;
    this.prefix = options.prefix || 'cache:';
    this.defaultTtl = options.defaultTtl || 3600; // 默认1小时
  }

  // 获取缓存
  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.prefix + key;
    const data = await this.redis.get(fullKey);

    if (!data) {
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return JSON.parse(data) as T;
  }

  // 设置缓存
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const fullKey = this.prefix + key;
    const ttl = options?.ttl || this.defaultTtl;

    await this.redis.setex(fullKey, ttl, JSON.stringify(value));
  }

  // 删除缓存
  async delete(key: string): Promise<boolean> {
    const fullKey = this.prefix + key;
    const result = await this.redis.del(fullKey);
    return result === 1;
  }

  // 批量删除（通配符）
  async deletePattern(pattern: string): Promise<number> {
    const fullPattern = this.prefix + pattern;
    let cursor = '0';
    let deleted = 0;

    do {
      const [newCursor, keys] = await this.redis.scan(
        cursor,
        'MATCH',
        fullPattern,
        'COUNT',
        100
      );
      cursor = newCursor;

      if (keys.length > 0) {
        deleted += await this.redis.del(...keys);
      }
    } while (cursor !== '0');

    return deleted;
  }

  // 缓存是否存在
  async exists(key: string): Promise<boolean> {
    const fullKey = this.prefix + key;
    return (await this.redis.exists(fullKey)) === 1;
  }

  // 获取TTL
  async getTtl(key: string): Promise<number> {
    const fullKey = this.prefix + key;
    return this.redis.ttl(fullKey);
  }

  // 续期缓存
  async expire(key: string, ttl?: number): Promise<boolean> {
    const fullKey = this.prefix + key;
    const newTtl = ttl || this.defaultTtl;
    return (await this.redis.expire(fullKey, newTtl)) === 1;
  }

  // 获取缓存统计
  getStats(): CacheStats {
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: this.stats.hits + this.stats.misses > 0
        ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100
        : 0,
      keys: 0, // 需要手动计算
      memory: 0, // 需要手动计算
    };
  }

  // 重置统计
  resetStats(): void {
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  // 带副作用的缓存获取
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    await this.set(key, value, options);

    return value;
  }

  // 批量获取
  async mget<T>(keys: string[]): Promise<Map<string, T>> {
    if (keys.length === 0) {
      return new Map();
    }

    const fullKeys = keys.map(k => this.prefix + k);
    const results = await this.redis.mget(...fullKeys);

    const map = new Map<string, T>();

    for (let i = 0; i < keys.length; i++) {
      if (results[i]) {
        map.set(keys[i], JSON.parse(results[i]) as T);
      }
    }

    return map;
  }

  // 批量设置
  async mset<T>(entries: Array<{ key: string; value: T }>, ttl?: number): Promise<void> {
    if (entries.length === 0) return;

    const pipeline = this.redis.pipeline();

    for (const { key, value } of entries) {
      const fullKey = this.prefix + key;
      pipeline.setex(fullKey, ttl || this.defaultTtl, JSON.stringify(value));
    }

    await pipeline.exec();
  }

  // 缓存预热
  async warmup<T>(
    entries: Array<{ key: string; value: T }>,
    ttl?: number
  ): Promise<void> {
    await this.mset(entries, ttl);
    console.log(`缓存预热完成: ${entries.length}条数据`);
  }

  // 获取缓存键数量
  async getKeyCount(): Promise<number> {
    let cursor = '0';
    let count = 0;

    do {
      const [newCursor, keys] = await this.redis.scan(
        cursor,
        'MATCH',
        this.prefix + '*',
        'COUNT',
        1000
      );
      cursor = newCursor;
      count += keys.length;
    } while (cursor !== '0');

    return count;
  }

  // 清空所有缓存
  async clear(): Promise<void> {
    await this.deletePattern('*');
  }
}

// 带版本控制的缓存
class VersionedCacheService extends RedisCacheService {
  async invalidateVersion(key: string): Promise<void> {
    // 递增版本号
    const versionKey = this.getVersionKey(key);
    await this.redis.incr(versionKey);

    // 删除旧版本数据
    await this.delete(key);
  }

  private getVersionKey(key: string): string {
    return `${this.prefix}${key}:_version`;
  }

  async getVersion(key: string): Promise<number> {
    const versionKey = this.getVersionKey(key);
    const version = await this.redis.get(versionKey);
    return version ? parseInt(version) : 0;
  }

  async get<T>(key: string): Promise<T | null> {
    const version = await this.getVersion(key);
    const versionedKey = `${key}:v${version}`;
    return super.get<T>(versionedKey);
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const version = await this.getVersion(key);
    const versionedKey = `${key}:v${version}`;
    await super.set(versionedKey, value, options);
  }
}

// 使用示例
async function cacheServiceExample() {
  const redis = new Redis({ host: '127.0.0.1', port: 6379 });
  const cache = new RedisCacheService(redis, {
    prefix: 'app:',
    defaultTtl: 3600,
  });

  // 基本使用
  await cache.set('user:1001', { name: '张三', age: 28 });
  const user = await cache.get<{ name: string; age: number }>('user:1001');
  console.log('用户信息:', user);

  // getOrSet模式
  const product = await cache.getOrSet(
    'product:2001',
    async () => {
      // 从数据库或API获取
      return { id: '2001', name: '商品A', price: 99.9 };
    },
    { ttl: 7200 }
  );

  // 批量缓存
  await cache.mset([
    { key: 'config:theme', value: { theme: 'dark' } },
    { key: 'config:language', value: { language: 'zh-CN' } },
  ]);

  // 获取统计
  console.log('缓存统计:', cache.getStats());
}
```

### 9.5 我的思考：Node.js中Redis的坑

Node.js中使用Redis有一些常见的陷阱：

```
常见问题与解决方案：

┌─────────────────────────────────────────────────────────┐
│ 问题1：连接未就绪就执行命令                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 错误写法：                                               │
│ const redis = new Redis();                              │
│ redis.get('key'); // 连接未建立，可能报错                 │
│                                                         │
│ 正确写法：                                               │
│ const redis = new Redis();                              │
│ redis.on('ready', () => {                               │
│   redis.get('key');                                     │
│ });                                                      │
│                                                         │
│ 或者：                                                   │
│ await new Promise(resolve => {                          │
│   redis.once('ready', resolve);                         │
│ });                                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 问题2：大量命令未使用Pipeline                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 错误写法（性能差）：                                       │
│ for (const item of items) {                             │
│   await redis.set(item.key, item.value);                │
│ }                                                        │
│                                                         │
│ 正确写法（Pipeline）：                                    │
│ const pipeline = redis.pipeline();                       │
│ for (const item of items) {                             │
│   pipeline.set(item.key, item.value);                  │
│ }                                                        │
│ await pipeline.exec();                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 问题3：未处理连接断开                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 错误写法：                                               │
│ const redis = new Redis();                              │
│ // 网络波动导致连接断开，后面的请求全部失败                │
│                                                         │
│ 正确写法：                                               │
│ const redis = new Redis({                               │
│   retryStrategy: (times) => Math.min(times * 50, 2000),│
│   maxRetriesPerRequest: 3,                              │
│ });                                                      │
│                                                         │
│ redis.on('error', (err) => {                            │
│   console.error('Redis错误:', err);                      │
│   // 告警通知                                            │
│ });                                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 问题4：Buffer vs String混用                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 错误写法：                                               │
│ await redis.set('key', Buffer.from('data'));           │
│ const value = await redis.get('key');                   │
│ value.toString(); // 可能是Buffer，不是String             │
│                                                         │
│ 正确写法：                                               │
│ await redis.set('key', JSON.stringify(data));           │
│ const value = await redis.get('key');                   │
│ if (typeof value === 'string') {                        │
│   JSON.parse(value);                                    │
│ }                                                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 10. 总结

### 10.1 核心要点回顾

```
Redis知识体系：

┌─────────────────────────────────────────────────────────┐
│                      基础数据结构                         │
│   String ── Hash ── List ── Set ── ZSet                  │
│                                                         │
│                      底层实现                            │
│   SDS ── ziplist/hashtable ── quicklist ── skiplist      │
│                                                         │
│                      持久化                              │
│   RDB ── AOF ── 混合持久化                               │
│                                                         │
│                      高可用                              │
│   主从 ── 哨兵 ── Cluster                               │
│                                                         │
│                      应用场景                            │
│   缓存 ── 锁 ── 队列 ── 计数器 ── 排行榜                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 10.2 学习路径建议

| 阶段 | 内容 | 目标 |
|------|------|------|
| 第一阶段 | 数据结构、命令基础 | 熟练使用Redis命令行 |
| 第二阶段 | 客户端使用、Pipeline | 能够在Node.js中使用Redis |
| 第三阶段 | 持久化、内存管理 | 理解数据安全与性能 |
| 第四阶段 | 主从、哨兵、Cluster | 搭建高可用集群 |
| 第五阶段 | 分布式锁、延迟队列、缓存策略 | 解决生产问题 |

### 10.3 进一步学习资源

- **官方文档**: https://redis.io/documentation
- **Redis命令参考**: https://redis.io/commands
- **Redis Cluster教程**: https://redis.io/topics/cluster-tutorial
- **ioredis文档**: https://github.com/luin/ioredis

---

> 全栈工程师的Redis最佳实践：
> 1. 理解数据结构，选择合适的存储方式
> 2. 注意内存管理，避免bigkey
> 3. 合理配置持久化，平衡性能和数据安全
> 4. 生产环境必须开启认证和网络安全
> 5. 监控是关键，及时发现和解决问题

---

*本文档由全栈开发教学系统生成*
*版本：1.0*
*更新时间：2026年*
