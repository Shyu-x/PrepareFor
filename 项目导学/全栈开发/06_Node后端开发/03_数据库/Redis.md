# Redis 数据库详解

## 目录

1. [Redis 基础](#1-redis-基础)
2. [数据类型详解](#2-数据类型详解)
3. [缓存策略](#3-缓存策略)
4. [会话存储](#4-会话存储)
5. [消息队列](#5-消息队列)

---

## 1. Redis 基础

### 1.1 Redis 简介

Redis 是一个开源的内存数据结构存储系统，可用作数据库、缓存和消息队列。它支持多种数据结构，如字符串、哈希、列表、集合、有序集合等。

**Redis 核心特性：**

- 内存存储，性能极高
- 多种数据结构
- 持久化支持
- 主从复制
- 集群支持
- 事务支持
- 发布/订阅
- Lua 脚本

### 1.2 连接 Redis

```javascript
// 使用 ioredis
const Redis = require('ioredis');

const redis = new Redis({
  host: 'localhost',
  port: 6379,
  password: 'password',  // 如果有密码
  db: 0,               // 数据库编号 0-15
  // 连接池配置
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
  connectTimeout: 10000,
  // 集群配置
  // cluster: true,
  // nodes: [{ host: 'localhost', port: 7000 }]
});

// 事件监听
redis.on('connect', () => console.log('已连接'));
redis.on('ready', () => console.log('就绪'));
redis.on('error', (err) => console.error('错误:', err));
redis.on('close', () => console.log('连接关闭'));

// 基础操作
await redis.set('key', 'value');
const value = await redis.get('key');
await redis.quit();
```

### 1.3 基础命令

```javascript
// 键操作
await redis.set('name', '张三');
await redis.get('name');
await redis.exists('name');      // 1 或 0
await redis.del('name');          // 删除
await redis.expire('name', 60);  // 设置过期时间（秒）
await redis.ttl('name');          // 获取剩余过期时间
await redis.type('name');         // 获取类型
await redis.keys('user:*');       // 查找键（生产环境慎用）
await redis.flushdb();           // 清空当前数据库

// 批量操作
await redis.mget('key1', 'key2', 'key3');
await redis.mset('key1', 'value1', 'key2', 'value2');
```

---

## 2. 数据类型详解

### 2.1 String（字符串）

```javascript
// 基础操作
await redis.set('name', '张三');
await redis.get('name');
await redis.append('name', ' is good');  // 追加

// 数字操作
await redis.set('count', '0');
await redis.incr('count');      // +1
await redis.decr('count');      // -1
await redis.incrby('count', 5); // +5
await redis.decrby('count', 3); // -3

// 设置选项
await redis.set('key', 'value', 'EX', 60);  // 60秒过期
await redis.set('key', 'value', 'NX');       // 不存在时设置
await redis.set('key', 'value', 'XX');       // 存在时设置

// 获取和设置多个
await redis.getset('name', '李四');  // 获取旧值并设置新值
await redis.getrange('name', 0, 2); // 获取子串
await redis.setrange('name', 0, '王'); // 替换子串
```

### 2.2 Hash（哈希）

```javascript
// 基础操作
await redis.hset('user:1', 'name', '张三');
await redis.hset('user:1', 'age', '25');
await redis.hget('user:1', 'name');
await redis.hgetall('user:1');
// { name: '张三', age: '25' }

await redis.hdel('user:1', 'age');    // 删除字段
await redis.hexists('user:1', 'name'); // 检查字段存在

// 批量操作
await redis.hmset('user:2', { name: '李四', age: '30' });
await redis.hmget('user:2', 'name', 'age');

// 数字操作
await redis.hincrby('user:1', 'age', 1);  // +1
await redis.hincrbyfloat('user:1', 'score', 0.5);

// 获取字段
await redis.hkeys('user:1');  // 所有字段
await redis.hvals('user:1');  // 所有值
await redis.hlen('user:1');    // 字段数量
```

### 2.3 List（列表）

```javascript
// 基础操作
await redis.lpush('list', 'a');    // 头部插入
await redis.rpush('list', 'd');    // 尾部插入

await redis.lrange('list', 0, -1); // 获取所有元素
// ['a', 'b', 'c', 'd']

// 弹出操作
await redis.lpop('list');          // 头部弹出
await redis.rpop('list');          // 尾部弹出

// 列表操作
await redis.llen('list');          // 长度
await redis.lindex('list', 0);     // 获取指定索引
await redis.lset('list', 0, 'x');  // 设置指定索引

// 阻塞操作
await redis.blpop('list', 0);      // 阻塞弹出
await redis.brpop('list', 0);      // 阻塞弹出尾部

// 列表修剪
await redis.ltrim('list', 0, 9);   // 保留前10个
```

### 2.4 Set（集合）

```javascript
// 基础操作
await redis.sadd('tags', 'js', 'node', 'redis');  // 添加
await redis.smembers('tags');                       // 获取所有成员
await redis.scard('tags');                         // 成员数量
await redis.sismember('tags', 'js');               // 是否存在
await redis.srem('tags', 'node');                   // 删除

// 集合操作
await redis.sadd('set1', 'a', 'b', 'c');
await redis.sadd('set2', 'b', 'c', 'd');

await redis.sunion('set1', 'set2');    // 并集
await redis.sinter('set1', 'set2');    // 交集
await redis.sdiff('set1', 'set2');     // 差集

// 随机操作
await redis.srandmember('set1', 2);    // 随机获取成员
await redis.spop('set1');              // 随机弹出成员
```

### 2.5 Sorted Set（有序集合）

```javascript
// 基础操作
await redis.zadd('leaderboard', { 'alice': 100, 'bob': 90, 'charlie': 80 });

await redis.zrange('leaderboard', 0, -1);  // 按分数升序
await redis.zrevrange('leaderboard', 0, 9); // 按分数降序

// 带分数获取
await redis.zrange('leaderboard', 0, -1, 'WITHSCORES');

// 分数操作
await redis.zincrby('leaderboard', 10, 'bob'); // 增加分数
await redis.zscore('leaderboard', 'bob');       // 获取分数
await redis.zrank('leaderboard', 'alice');      // 获取排名（升序）
await redis.zrevrank('leaderboard', 'alice');   // 获取排名（降序）

// 范围查询
await redis.zrangebyscore('leaderboard', 80, 100);  // 按分数范围
await redis.zcount('leaderboard', 80, 100);          // 分数范围内数量

// 有序集合操作
await redis.zunion('zset1', 'zset2');   // 并集
await redis.zinter('zset1', 'zset2');   // 交集
```

### 2.6 Bitmaps（位图）

```javascript
// 设置位
await redis.setbit('online:2024-01-01', 100, 1);  // 用户100在线

// 获取位
await redis.getbit('online:2024-01-01', 100);      // 获取用户状态

// 位运算
await redis.bitcount('online:2024-01-01');         // 统计1的数量

// 多字符串位图
await redis.set('a', 'a');  // 97 (01100001)
await redis.bitop('AND', 'result', 'a', 'b');
```

### 2.7 HyperLogLog（基数统计）

```javascript
// 添加元素
await redis.pfadd('users:2024-01-01', 'user1', 'user2', 'user3');

// 估算基数
await redis.pfcount('users:2024-01-01');

// 合并
await redis.pfmerge('result', 'users:2024-01-01', 'users:2024-01-02');
```

---

## 3. 缓存策略

### 3.1 缓存模式

```javascript
// 1. Cache-Aside（旁路缓存，最常用）
async function getUser(id) {
  const cacheKey = `user:${id}`;

  // 先查缓存
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 缓存未命中，查数据库
  const user = await db.query('SELECT * FROM users WHERE id = ?', [id]);

  // 写入缓存
  await redis.setex(cacheKey, 3600, JSON.stringify(user));

  return user;
}

// 更新时删除缓存
async function updateUser(id, data) {
  await db.query('UPDATE users SET ? WHERE id = ?', [data, id]);
  await redis.del(`user:${id}`);
}

// 2. Read-Through
async function getUserFromCache(id) {
  return await cache.getOrLoad(`user:${id}`, () => db.getUser(id));
}

// 3. Write-Through
async function saveUser(user) {
  await db.saveUser(user);
  await cache.set(`user:${user.id}`, user);
}
```

### 3.2 缓存过期策略

```javascript
// 固定过期时间
await redis.setex('key', 3600, 'value');  // 1小时

// 滑动过期时间（访问时刷新）
// 每次访问时重新设置过期时间
async function accessWithSlide(key) {
  const value = await redis.get(key);
  if (value) {
    await redis.expire(key, 3600);  // 重置过期时间
  }
  return value;
}

// 延迟过期（随机偏移）
function setWithJitter(key, value, ttl = 3600) {
  const jitter = Math.floor(Math.random() * 300);  // 0-5分钟偏移
  return redis.setex(key, ttl + jitter, value);
}

// 缓存预热
async function warmupCache() {
  const hotUsers = await db.query('SELECT * FROM users WHERE status = ?', ['hot']);
  const pipeline = redis.pipeline();

  hotUsers.forEach(user => {
    pipeline.setex(`user:${user.id}`, 3600, JSON.stringify(user));
  });

  await pipeline.exec();
}
```

### 3.3 缓存击穿和雪崩

```javascript
// 1. 缓存击穿（使用互斥锁）
async function getUserWithLock(id) {
  const cacheKey = `user:${id}`;

  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // 使用分布式锁
  const lockKey = `lock:user:${id}`;
  const lock = await redis.set(lockKey, '1', 'EX', 10, 'NX');

  if (lock === 'OK') {
    try {
      // 查数据库
      const user = await db.query('SELECT * FROM users WHERE id = ?', [id]);
      await redis.setex(cacheKey, 3600, JSON.stringify(user));
      return user;
    } finally {
      await redis.del(lockKey);
    }
  } else {
    // 等待其他请求写入缓存
    await new Promise(resolve => setTimeout(resolve, 100));
    return await getUserWithLock(id);
  }
}

// 2. 缓存雪崩（使用随机过期时间和持久化）
async function setWithRandomExpiry(key, value) {
  const ttl = 3600 + Math.floor(Math.random() * 3600);  // 1-2小时随机
  await redis.setex(key, ttl, value);
}
```

---

## 4. 会话存储

### 4.1 Express Session + Redis

```javascript
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const { RedisClient } = require('redis');

// 创建 Redis 客户端
const redisClient = RedisClient.createClient({
  url: `redis://localhost:6379`
});
redisClient.connect().catch(console.error);

// 使用 Redis 存储会话
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,  // 生产环境设为 true
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000  // 24小时
  }
}));

// 在路由中使用
app.get('/login', (req, res) => {
  req.session.user = { id: 1, name: '张三' };
  res.send('登录成功');
});

app.get('/profile', (req, res) => {
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).send('未登录');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.send('已退出');
});
```

### 4.2 Token 存储

```javascript
// 存储 Token（带过期时间）
async function saveToken(userId, token, expiresIn = 3600) {
  const key = `token:${token}`;
  await redis.setex(key, expiresIn, userId.toString());
}

// 验证 Token
async function validateToken(token) {
  const key = `token:${token}`;
  const userId = await redis.get(key);
  return userId ? parseInt(userId) : null;
}

// 删除 Token（登出）
async function removeToken(token) {
  const key = `token:${token}`;
  await redis.del(key);
}

// 黑名单
async function addToBlacklist(token, exp) {
  const ttl = exp - Math.floor(Date.now() / 1000);
  if (ttl > 0) {
    await redis.setex(`blacklist:${token}`, ttl, '1');
  }
}

async function isBlacklisted(token) {
  return await redis.exists(`blacklist:${token}`) === 1;
}
```

---

## 5. 消息队列

### 5.1 列表实现队列

```javascript
// 生产者 - 添加消息
async function produce(queue, message) {
  await redis.lpush(queue, JSON.stringify(message));
}

// 消费者 - 消费消息
async function consume(queue, handler) {
  while (true) {
    const result = await redis.brpop(queue, 0);  // 阻塞等待
    const [_, message] = result;
    const data = JSON.parse(message);

    try {
      await handler(data);
    } catch (error) {
      console.error('处理失败:', error);
      // 可以重新放入队列或记录
    }
  }
}

// 使用
await produce('tasks', { type: 'email', to: 'user@example.com' });
await consume('tasks', async (task) => {
  if (task.type === 'email') {
    await sendEmail(task.to);
  }
});
```

### 5.2 发布/订阅

```javascript
// 发布者
const publisher = new Redis();

async function publish(channel, message) {
  await publisher.publish(channel, JSON.stringify(message));
}

// 订阅者
const subscriber = new Redis();

subscriber.subscribe('notifications');

subscriber.on('message', (channel, message) => {
  if (channel === 'notifications') {
    const data = JSON.parse(message);
    console.log('收到通知:', data);
  }
});

// 模式订阅
subscriber.psubscribe('user:*');

subscriber.on('pmessage', (pattern, channel, message) => {
  console.log(`匹配 ${pattern}: ${channel} - ${message}`);
});
```

### 5.3 延迟队列

```javascript
// 延迟队列（使用 sorted set）
async function addDelayQueue(queue, score, message) {
  await redis.zadd(queue, score, JSON.stringify(message));
}

async function processDelayQueue(queue, handler) {
  while (true) {
    const now = Date.now();
    const items = await redis.zrangebyscore(queue, 0, now);

    if (items.length > 0) {
      for (const item of items) {
        const data = JSON.parse(item);
        try {
          await handler(data);
          await redis.zrem(queue, item);
        } catch (error) {
          console.error('处理失败:', error);
        }
      }
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// 使用
await addDelayQueue('delay:email', Date.now() + 5000, {
  to: 'user@example.com',
  content: '您的验证码是 123456'
});
```

---

## 常见面试问题

### 问题 1：Redis 和 Memcached 的区别？

**答案：** Redis 支持更多数据结构（String、Hash、List、Set、Sorted Set），支持持久化和复制；Memcached 只支持简单字符串，性能更高，适合简单缓存场景。

### 问题 2：Redis 为什么快？

**答案：** 基于内存存储；单线程避免锁竞争；I/O 多路复用；简单数据结构操作复杂度低。

---

## 6. 高级特性

### 6.1 Lua 脚本

```javascript
// 使用 Lua 脚本保证原子性
const luaScript = `
  local key = KEYS[1]
  local limit = tonumber(ARGV[1])
  local window = tonumber(ARGV[2])
  
  local current = redis.call('GET', key)
  if current and tonumber(current) >= limit then
    return 0
  end
  
  local ttl = redis.call('TTL', key)
  if ttl < 0 then
    redis.call('SET', key, 1, 'EX', window)
    return 1
  end
  
  redis.call('INCR', key)
  return 1
`;

// 加载脚本
const scriptSha = await redis.script('LOAD', luaScript);

// 执行脚本
const result = await redis.evalsha(scriptSha, 1, 'rate:user:1', 10, 60);

// 限流器实现
class RateLimiter {
  constructor(private redis: Redis, private limit: number, private window: number) {}
  
  async check(key: string): Promise<boolean> {
    const fullKey = `rate:${key}`;
    const current = await this.redis.incr(fullKey);
    
    if (current === 1) {
      await this.redis.expire(fullKey, this.window);
    }
    
    return current <= this.limit;
  }
}
```

### 6.2 Redis 集群

```javascript
// 连接 Redis 集群
const Redis = require('ioredis');

const cluster = new Redis.Cluster([
  { host: 'redis-1.example.com', port: 6379 },
  { host: 'redis-2.example.com', port: 6379 },
  { host: 'redis-3.example.com', port: 6379 },
], {
  scaleReads: 'slave',  // 读操作分发到从节点
  maxRedirections: 16,
  retryDelayOnFailover: 100,
  slotsRefreshTimeout: 1000,
});

// 集群操作
await cluster.set('key', 'value');
const value = await cluster.get('key');

// 使用 Pipeline 批量操作
const pipeline = cluster.pipeline();
pipeline.set('key1', 'value1');
pipeline.set('key2', 'value2');
pipeline.get('key1');
await pipeline.exec();
```

### 6.3 Redis Streams

```javascript
// 添加消息到流
await redis.xadd('mystream', '*', {
  field1: 'value1',
  field2: 'value2'
});

// 读取消息
const messages = await redis.xread('STREAMS', 'mystream', '0');

// 消费者组
await redis.xgroup('CREATE', 'mystream', 'mygroup', '$', 'MKSTREAM');

// 消费消息
const messages = await redis.xreadgroup(
  'GROUP', 'mygroup', 'consumer1',
  'COUNT', 10,
  'STREAMS', 'mystream', '>'
);

// 确认消息
await redis.xack('mystream', 'mygroup', 'messageId');

// 消息队列实现
class MessageQueue {
  constructor(private redis: Redis, private stream: string, private group: string) {}
  
  async publish(data: object) {
    return await this.redis.xadd(this.stream, '*', data);
  }
  
  async consume(consumer: string, count: number = 10) {
    const messages = await this.redis.xreadgroup(
      'GROUP', this.group, consumer,
      'COUNT', count,
      'BLOCK', 5000,  // 阻塞5秒
      'STREAMS', this.stream, '>'
    );
    
    return messages?.[0]?.[1] || [];
  }
  
  async ack(messageId: string) {
    await this.redis.xack(this.stream, this.group, messageId);
  }
}
```

### 6.4 分布式锁

```javascript
// Redlock 算法实现分布式锁
class DistributedLock {
  constructor(private redis: Redis) {}
  
  async acquire(key: string, ttl: number = 10000): Promise<string | null> {
    const token = Math.random().toString(36).substring(2);
    const lockKey = `lock:${key}`;
    
    const result = await this.redis.set(lockKey, token, 'PX', ttl, 'NX');
    
    if (result === 'OK') {
      return token;
    }
    
    return null;
  }
  
  async release(key: string, token: string): Promise<boolean> {
    const lockKey = `lock:${key}`;
    
    const luaScript = `
      if redis.call('GET', KEYS[1]) == ARGV[1] then
        return redis.call('DEL', KEYS[1])
      else
        return 0
      end
    `;
    
    const result = await this.redis.eval(luaScript, 1, lockKey, token);
    return result === 1;
  }
  
  async extend(key: string, token: string, ttl: number): Promise<boolean> {
    const lockKey = `lock:${key}`;
    
    const luaScript = `
      if redis.call('GET', KEYS[1]) == ARGV[1] then
        return redis.call('PEXPIRE', KEYS[1], ARGV[2])
      else
        return 0
      end
    `;
    
    const result = await this.redis.eval(luaScript, 1, lockKey, token, ttl);
    return result === 1;
  }
}

// 使用示例
const lock = new DistributedLock(redis);

async function withLock(key: string, callback: () => Promise<void>) {
  const token = await lock.acquire(key);
  
  if (!token) {
    throw new Error('获取锁失败');
  }
  
  try {
    await callback();
  } finally {
    await lock.release(key, token);
  }
}
```

---

## 7. 性能优化

### 7.1 内存优化

```javascript
// 1. 使用合适的数据结构
// 小对象使用 Hash 代替多个 String
// 当字段数 < 512 且值 < 64 字节时，Hash 使用 ziplist 编码

// ❌ 不推荐：多个 String
await redis.set('user:1:name', '张三');
await redis.set('user:1:age', '25');
await redis.set('user:1:email', 'zhangsan@example.com');

// ✅ 推荐：使用 Hash
await redis.hset('user:1', {
  name: '张三',
  age: '25',
  email: 'zhangsan@example.com'
});

// 2. 使用压缩列表
// 配置 hash-max-ziplist-entries 和 hash-max-ziplist-value

// 3. 设置过期时间
await redis.setex('key', 3600, 'value');

// 4. 使用 SCAN 代替 KEYS
// ❌ 不推荐：KEYS 会阻塞
const keys = await redis.keys('user:*');

// ✅ 推荐：SCAN 非阻塞
for await (const key of redis.scanIterator({ match: 'user:*', count: 100 })) {
  console.log(key);
}

// 5. 内存淘汰策略
// 在 redis.conf 中配置
// maxmemory 2gb
// maxmemory-policy allkeys-lru
```

### 7.2 Pipeline 优化

```javascript
// 使用 Pipeline 减少网络往返
const pipeline = redis.pipeline();

// 批量设置
for (let i = 0; i < 1000; i++) {
  pipeline.set(`key:${i}`, `value:${i}`);
}

const results = await pipeline.exec();

// 批量获取
const pipeline = redis.pipeline();
for (let i = 0; i < 1000; i++) {
  pipeline.get(`key:${i}`);
}

const results = await pipeline.exec();

// 使用 multi 保证原子性
const results = await redis.multi()
  .set('key1', 'value1')
  .set('key2', 'value2')
  .get('key1')
  .exec();
```

### 7.3 持久化配置

```
# redis.conf 配置

# RDB 快照
save 900 1      # 900秒内至少1次修改
save 300 10     # 300秒内至少10次修改
save 60 10000   # 60秒内至少10000次修改

# AOF 日志
appendonly yes
appendfsync everysec  # 每秒同步一次
no-appendfsync-on-rewrite no

# 混合持久化（Redis 4.0+）
aof-use-rdb-preamble yes

# 重写配置
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
```

---

## 8. 与 Node.js 集成实战

### 8.1 完整的缓存服务

```typescript
// services/cache.service.ts
import Redis from 'ioredis';

export class CacheService {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
  }
  
  /**
   * 获取或设置缓存
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    // 尝试从缓存获取
    const cached = await this.redis.get(key);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    // 缓存未命中，获取数据
    const data = await fetcher();
    
    // 写入缓存
    await this.redis.setex(key, ttl, JSON.stringify(data));
    
    return data;
  }
  
  /**
   * 批量获取
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (keys.length === 0) return [];
    
    const values = await this.redis.mget(...keys);
    
    return values.map(v => v ? JSON.parse(v) : null);
  }
  
  /**
   * 批量设置
   */
  async mset<T>(items: { key: string; value: T; ttl?: number }[]): Promise<void> {
    if (items.length === 0) return;
    
    const pipeline = this.redis.pipeline();
    
    for (const { key, value, ttl } of items) {
      const serialized = JSON.stringify(value);
      
      if (ttl) {
        pipeline.setex(key, ttl, serialized);
      } else {
        pipeline.set(key, serialized);
      }
    }
    
    await pipeline.exec();
  }
  
  /**
   * 删除匹配的键
   */
  async deletePattern(pattern: string): Promise<number> {
    let count = 0;
    
    for await (const key of this.redis.scanIterator({ match: pattern })) {
      await this.redis.del(key);
      count++;
    }
    
    return count;
  }
  
  /**
   * 带锁执行
   */
  async withLock<T>(
    key: string,
    callback: () => Promise<T>,
    ttl: number = 10000
  ): Promise<T> {
    const lockKey = `lock:${key}`;
    const token = Math.random().toString(36);
    
    // 获取锁
    const acquired = await this.redis.set(lockKey, token, 'PX', ttl, 'NX');
    
    if (acquired !== 'OK') {
      throw new Error('获取锁失败');
    }
    
    try {
      return await callback();
    } finally {
      // 释放锁（使用 Lua 脚本保证原子性）
      const lua = `
        if redis.call('GET', KEYS[1]) == ARGV[1] then
          return redis.call('DEL', KEYS[1])
        end
        return 0
      `;
      await this.redis.eval(lua, 1, lockKey, token);
    }
  }
}

export const cacheService = new CacheService();
```

### 8.2 会话管理

```typescript
// services/session.service.ts
import Redis from 'ioredis';

interface SessionData {
  userId: string;
  email: string;
  role: string;
  createdAt: number;
  lastAccessAt: number;
}

export class SessionService {
  private redis: Redis;
  private prefix = 'session:';
  private ttl = 7 * 24 * 60 * 60; // 7天
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
  }
  
  /**
   * 创建会话
   */
  async create(sessionId: string, data: Omit<SessionData, 'createdAt' | 'lastAccessAt'>): Promise<void> {
    const session: SessionData = {
      ...data,
      createdAt: Date.now(),
      lastAccessAt: Date.now()
    };
    
    await this.redis.setex(
      `${this.prefix}${sessionId}`,
      this.ttl,
      JSON.stringify(session)
    );
  }
  
  /**
   * 获取会话
   */
  async get(sessionId: string): Promise<SessionData | null> {
    const data = await this.redis.get(`${this.prefix}${sessionId}`);
    
    if (!data) return null;
    
    const session = JSON.parse(data) as SessionData;
    
    // 更新最后访问时间
    session.lastAccessAt = Date.now();
    await this.redis.setex(
      `${this.prefix}${sessionId}`,
      this.ttl,
      JSON.stringify(session)
    );
    
    return session;
  }
  
  /**
   * 更新会话
   */
  async update(sessionId: string, data: Partial<SessionData>): Promise<boolean> {
    const existing = await this.get(sessionId);
    
    if (!existing) return false;
    
    const updated = { ...existing, ...data, lastAccessAt: Date.now() };
    
    await this.redis.setex(
      `${this.prefix}${sessionId}`,
      this.ttl,
      JSON.stringify(updated)
    );
    
    return true;
  }
  
  /**
   * 删除会话
   */
  async delete(sessionId: string): Promise<void> {
    await this.redis.del(`${this.prefix}${sessionId}`);
  }
  
  /**
   * 删除用户所有会话
   */
  async deleteAllByUserId(userId: string): Promise<number> {
    let count = 0;
    
    for await (const key of this.redis.scanIterator({ match: `${this.prefix}*` })) {
      const data = await this.redis.get(key);
      
      if (data) {
        const session = JSON.parse(data) as SessionData;
        if (session.userId === userId) {
          await this.redis.del(key);
          count++;
        }
      }
    }
    
    return count;
  }
}
```

---

## 9. 常见面试问题

### 问题 1：Redis 如何实现持久化？

**答案：** Redis 提供两种持久化方式：
1. **RDB**：定时将内存数据快照保存到磁盘，文件小、恢复快，但可能丢失数据
2. **AOF**：记录每个写操作，数据更安全，但文件较大
3. **混合持久化**（Redis 4.0+）：结合两者优点

### 问题 2：Redis 如何处理缓存穿透、击穿、雪崩？

**答案：**
- **穿透**：查询不存在的数据。解决方案：布隆过滤器、缓存空值
- **击穿**：热点数据过期。解决方案：互斥锁、永不过期
- **雪崩**：大量缓存同时过期。解决方案：随机过期时间、多级缓存

### 问题 3：Redis 为什么使用单线程？

**答案：** 
1. Redis 是内存操作，CPU 不是瓶颈
2. 单线程避免锁竞争
3. I/O 多路复用提高并发
4. Redis 6.0 引入多线程处理网络 I/O

### 问题 4：如何保证 Redis 和数据库的一致性？

**答案：**
1. **Cache-Aside 模式**：先更新数据库，再删除缓存
2. **延迟双删**：删除缓存 -> 更新数据库 -> 延迟删除缓存
3. **订阅 Binlog**：使用 Canal 等工具同步
4. **设置合理的过期时间**作为兜底

### 问题 5：Redis 集群如何实现数据分片？

**答案：** Redis Cluster 使用哈希槽（16384个）分片：
1. 每个节点负责一部分槽位
2. 使用 CRC16(key) % 16384 计算槽位
3. 支持在线扩缩容
4. 自动故障转移

---

## 10. 最佳实践总结

### 10.1 Key 命名规范

```
# 使用冒号分隔命名空间
user:1:profile
user:1:settings
session:abc123
cache:api:users:page:1

# 避免过长（影响内存）
# ✅ user:1:profile
# ❌ application:module:submodule:user:identifier:profile
```

### 10.2 性能优化清单

- [ ] 使用 Pipeline 批量操作
- [ ] 使用 SCAN 代替 KEYS
- [ ] 合理设置过期时间
- [ ] 选择合适的数据结构
- [ ] 使用连接池
- [ ] 监控内存使用

### 10.3 安全配置清单

- [ ] 设置密码（requirepass）
- [ ] 禁用危险命令（rename-command）
- [ ] 绑定内网 IP
- [ ] 启用 TLS
- [ ] 使用防火墙限制访问

---

*本文档最后更新于 2026年3月*
