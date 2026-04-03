# Redis缓存与分布式锁实战

> 本文将带你深入理解Redis的核心技术，包括数据结构、持久化机制、集群方案、缓存策略、Redisson分布式锁、秒杀场景等。通过大量实战案例，让你掌握Redis企业级应用技能。

---

## 一、Redis概述

### 1.1 Redis是什么？

**Redis**（Remote Dictionary Server）就像**餐厅的即时储物柜**：比数据库（仓库）快很多，用于存储需要快速访问的数据。数据存储在内存中，读写速度极快（每秒百万级别）。

```
┌────────────────────────────────────────────────────────────────────┐
│                         Redis vs MySQL对比                          │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  MySQL（磁盘数据库）：                                               │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                                                              │ │
│  │   磁盘 ──────> 读取 ──────> 内存 ──────> CPU处理            │ │
│  │                     ↑                                         │ │
│  │                   慢（随机IO）                               │ │
│  │                                                              │ │
│  │   优点：持久化、事务支持、数据量大                            │ │
│  │   缺点：读写速度受限于磁盘IO                                 │ │
│  │                                                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  Redis（内存数据库）：                                              │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                                                              │ │
│  │   内存 ──────> 读取 ──────> CPU处理                          │ │
│  │                     ↑                                         │ │
│  │                   快（内存操作）                             │ │
│  │                                                              │ │
│  │   优点：极速、数据结构丰富、支持集群                          │ │
│  │   缺点：数据量受限于内存、无原生事务                          │ │
│  │                                                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

### 1.2 Redis典型应用场景

```
┌────────────────────────────────────────────────────────────────────┐
│                        Redis应用场景图                               │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                      缓存（Cache）                             │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │ │
│  │  │接口缓存 │  │页面缓存 │  │数据查询缓存│ │热点数据缓存│        │ │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                      会话存储（Session）                       │ │
│  │  ┌─────────────────────────────────────────────────────┐   │ │
│  │  │  用户登录状态、购物车、分布式Session共享              │   │ │
│  │  └─────────────────────────────────────────────────────┘   │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                      分布式锁（Distributed Lock）              │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐                      │ │
│  │  │ 防重复提交│  │库存扣减 │  │ 任务分配 │                      │ │
│  │  └─────────┘  └─────────┘  └─────────┘                      │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                      计数器（Counter）                        │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐                      │ │
│  │  │ UV统计  │  │点赞计数 │  │限流计数 │                      │ │
│  │  └─────────┘  └─────────┘  └─────────┘                      │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                      消息队列（Message Queue）                │ │
│  │  ┌─────────────────────────────────────────────────────┐   │ │
│  │  │  延迟队列、排行榜、实时排行榜                       │   │ │
│  │  └─────────────────────────────────────────────────────┘   │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                      位图与GEO                                │ │
│  │  ┌─────────┐  ┌─────────┐                                   │ │
│  │  │签到统计 │  │附近的人 │                                   │ │
│  │  └─────────┘  └─────────┘                                   │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

---

## 二、数据结构详解

### 2.1 Redis 5种基本数据结构

```java
/**
 * Redis 5种基本数据类型
 */

/*
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                    Redis数据类型总览                              │
 ├─────────────────────────────────────────────────────────────────┤
 > │                                                                  │
 > │  String（字符串）                                                │
 > │  - 场景：缓存、计数器、分布式ID                                  │
 > │  - 命令：GET/SET/MGET/MSET/INCR/DECR                            │
 > │                                                                  │
 > │  Hash（哈希）                                                    │
 > │  - 场景：对象存储、购物车                                        │
 > │  - 命令：HGET/HSET/HGETALL/HMGET                                │
 > │                                                                  │
 > │  List（列表）                                                    │
 > │  - 场景：消息队列、最新消息、关注列表                            │
 > │  - 命令：LPUSH/RPOP/LRANGE/LLEN                                 │
 > │                                                                  │
 > │  Set（集合）                                                     │
 > │  - 场景：标签、好友关系、去重                                    │
 > │  - 命令：SADD/SMEMBERS/SISMEMBER/SINTER                         │
 > │                                                                  │
 > │  Zset（有序集合）                                               │
 > │  - 场景：排行榜、延时队列、权重队列                              │
 > │  - 命令：ZADD/ZRANGE/ZSCORE/ZRANK                               │
 > │                                                                  │
 > └─────────────────────────────────────────────────────────────────┘
 */

/**
 * String类型操作
 */
public class RedisStringDemo {

    private RedisTemplate<String, Object> redisTemplate;

    public void stringOps() {
        // 基本操作
        redisTemplate.opsForValue().set("key", "value");
        String value = redisTemplate.opsForValue().get("key");

        // 设置过期时间
        redisTemplate.opsForValue().set("token", "abc123", Duration.ofHours(1));

        // 批量操作
        Map<String, String> map = new HashMap<>();
        map.put("name", "张三");
        map.put("age", "25");
        redisTemplate.opsForValue().multiSet(map);

        // 计数器
        redisTemplate.opsForValue().increment("viewCount");  // +1
        redisTemplate.opsForValue().increment("viewCount", 5);  // +5
        redisTemplate.opsForValue().decrement("viewCount");  // -1

        // 分布式ID生成
        // 使用原子操作保证唯一性
        long userId = redisTemplate.opsForValue().increment("user:id:");

        // SETNX - 不存在则设置（用于分布式锁）
        Boolean success = redisTemplate.opsForValue()
            .setIfAbsent("lock:order:123", "locked", Duration.ofSeconds(30));
    }

    /**
     * String实现分布式锁
     */
    public boolean distributedLock(String key, String requestId, Duration timeout) {
        // SET key value NX EX seconds - 原子操作
        Boolean result = redisTemplate.opsForValue()
            .setIfAbsent(key, requestId, timeout);
        return Boolean.TRUE.equals(result);
    }

    public void releaseLock(String key, String requestId) {
        // Lua脚本保证原子性：只有持有锁的人才能释放
        String script = "if redis.call('get', KEYS[1]) == ARGV[1] then " +
                       "return redis.call('del', KEYS[1]) else return 0 end";
        redisTemplate.execute(
            new DefaultRedisScript<>(script, Long.class),
            Collections.singletonList(key),
            requestId
        );
    }
}

/**
 * Hash类型操作
 */
public class RedisHashDemo {

    public void hashOps() {
        // 存储对象
        redisTemplate.opsForHash().put("user:1001", "name", "张三");
        redisTemplate.opsForHash().put("user:1001", "age", "25");
        redisTemplate.opsForHash().put("user:1001", "city", "北京");

        // 获取字段
        Object name = redisTemplate.opsForHash().get("user:1001", "name");

        // 获取所有字段
        Map<Object, Object> user = redisTemplate.opsForHash().entries("user:1001");

        // 批量操作
        Map<String, String> fields = new HashMap<>();
        fields.put("name", "李四");
        fields.put("age", "30");
        redisTemplate.opsForHash().putAll("user:1002", fields);

        // 删除字段
        redisTemplate.opsForHash().delete("user:1001", "city");

        // 计数器
        redisTemplate.opsForHash().increment("stats:user:1001", "loginCount", 1);
    }

    /**
     * Hash实现购物车
     */
    public void shoppingCartDemo() {
        String userId = "user123";
        String cartKey = "cart:" + userId;

        // 添加商品到购物车
        redisTemplate.opsForHash().put(cartKey, "product:001", "2");  // 2件
        redisTemplate.opsForHash().put(cartKey, "product:002", "1");  // 1件

        // 修改商品数量
        redisTemplate.opsForHash().increment(cartKey, "product:001", 1);  // +1件

        // 查看购物车商品数量
        Long size = redisTemplate.opsForHash().size(cartKey);

        // 获取所有商品
        Map<Object, Object> cart = redisTemplate.opsForHash().entries(cartKey);

        // 删除商品
        redisTemplate.opsForHash().delete(cartKey, "product:001");
    }
}

/**
 * List类型操作
 */
public class RedisListDemo {

    public void listOps() {
        // 消息队列（lpush + rpop 或 rpush + lpop）
        redisTemplate.opsForList().leftPush("queue:orders", "order:001");
        redisTemplate.opsForList().leftPush("queue:orders", "order:002");

        // 消费消息
        String order = (String) redisTemplate.opsForList().rightPop("queue:orders");

        // 最新消息列表（ltrim保持固定长度）
        redisTemplate.opsForList().leftPush("recent:products", "product:123");
        redisTemplate.opsForList().trim("recent:products", 0, 99);  // 只保留100条

        // 获取列表范围
        List<Object> recentProducts = redisTemplate.opsForList().range("recent:products", 0, 9);

        // 列表长度
        Long length = redisTemplate.opsForList().size("queue:orders");
    }

    /**
     * 模拟消息队列
     */
    public void messageQueueDemo() {
        // 生产者：发送消息
        redisTemplate.opsForList().leftPush("mq:message", "{\"type\":\"order\",\"data\":\"...\"}");

        // 消费者：接收消息（阻塞）
        // brpop mq:message 0 - 阻塞等待

        // 或者使用定期轮询
        while (true) {
            String message = (String) redisTemplate.opsForList().rightPop("mq:message");
            if (message != null) {
                processMessage(message);
            } else {
                Thread.sleep(1000);  // 无消息时休眠
            }
        }
    }
}

/**
 * Set类型操作
 */
public class RedisSetDemo {

    public void setOps() {
        // 添加标签
        redisTemplate.opsForSet().add("tags:article:001", "Java", "Redis", "数据库");

        // 获取所有标签
        Set<Object> tags = redisTemplate.opsForSet().members("tags:article:001");

        // 检查是否存在
        Boolean hasTag = redisTemplate.opsForSet().isMember("tags:article:001", "Java");

        // 标签去重
        redisTemplate.opsForSet().add("tags:hot", "Java", "Python", "Java");  // 只有2个

        // 交集、并集、差集
        redisTemplate.opsForSet().intersect("tags:1", "tags:2");  // 共同标签
        redisTemplate.opsForSet().union("tags:1", "tags:2");      // 所有标签
        redisTemplate.opsForSet().difference("tags:1", "tags:2");  // 差集

        // 随机获取
        Object randomTag = redisTemplate.opsForSet().randomMember("tags:hot");

        // 随机弹出（用于抽奖）
        redisTemplate.opsForSet().pop("tags:hot");
    }

    /**
     * 实现用户关注关系
     */
    public void followSystemDemo() {
        String userId = "1001";

        // 关注的人
        redisTemplate.opsForSet().add("following:" + userId, "2001", "2002", "2003");

        // 粉丝
        redisTemplate.opsForSet().add("followers:2001", userId, "3001", "3002");

        // 检查是否关注
        Boolean isFollowing = redisTemplate.opsForSet()
            .isMember("following:" + userId, "2001");

        // 共同关注
        Set<Object> commonFollowings = redisTemplate.opsForSet()
            .intersect("following:" + userId, "following:" + "1002");
    }
}

/**
 * Zset类型操作
 */
public class RedisZSetDemo {

    public void zsetOps() {
        // 添加排行榜
        redisTemplate.opsForZSet().add("ranking:score", "user:001", 1000);
        redisTemplate.opsForZSet().add("ranking:score", "user:002", 950);
        redisTemplate.opsForZSet().add("ranking:score", "user:003", 1100);

        // 增加分数
        redisTemplate.opsForZSet().incrementScore("ranking:score", "user:001", 50);

        // 获取排名（0开始）
        Long rank = redisTemplate.opsForZSet().rank("ranking:score", "user:001");

        // 获取分数
        Double score = redisTemplate.opsForZSet().score("ranking:score", "user:001");

        // 获取Top N
        Set<Object> top10 = redisTemplate.opsForZSet().reverseRange("ranking:score", 0, 9);

        // 获取排名区间
        Set<Object> top100 = redisTemplate.opsForZSet().reverseRangeByScore(
            "ranking:score", 900, 1000);

        // 获取排名和分数
        Set<ZSetOperations.TypedTuple<Object>> results =
            redisTemplate.opsForZSet().reverseRangeWithScores("ranking:score", 0, 9);
    }

    /**
     * 实现延时队列
     */
    public void delayQueueDemo() {
        // 发送延时消息（score为到期时间戳）
        long delayTime = System.currentTimeMillis() + 5000;  // 5秒后到期
        redisTemplate.opsForZSet().add("delay:queue", "order:123:timeout", delayTime);

        // 轮询获取到期消息
        while (true) {
            // 获取当前时间之前的所有消息
            Set<Object> expired = redisTemplate.opsForZSet()
                .rangeByScore("delay:queue", 0, System.currentTimeMillis());

            for (Object msg : expired) {
                // 处理消息
                processDelayMessage(msg);

                // 删除已处理的消息
                redisTemplate.opsForZSet().remove("delay:queue", msg);
            }

            Thread.sleep(1000);  // 每秒检查一次
        }
    }
}
```

### 2.2 数据结构底层原理

```java
/**
 * Redis数据结构的底层实现
 */

/*
 * Redis不会直接使用数据结构，而是通过encoding字段选择最优底层实现
 *
 * Object_encoding命令查看编码类型
 * OBJECT ENCODING key
 */

/*
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                    String 编码类型                               │
 ├─────────────────────────────────────────────────────────────────┤
 > │                                                                  │
 > │  embstr <= 39字节：                                              │
 > │  - embstr编码的SDS（简单动态字符串）                             │
 > │  - 连续的内存区域，性能更高                                      │
 > │                                                                  │
 > │  raw > 39字节：                                                  │
 > │  - raw编码的SDS                                                 │
 > │  - 不连续的内存区域                                             │
 > │                                                                  │
 > │  int：                                                           │
 > │  - 如果字符串是整数，且<=20位数字                                │
 > │  - 直接存储为整数，节省内存                                      │
 > │                                                                  │
 > └─────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                    List 编码类型                                 │
 ├─────────────────────────────────────────────────────────────────┤
 > │                                                                  │
 > │  ziplist（压缩列表）：<= 512字节 且 元素数 <= 64                 │
 > │  - 内存紧凑，连续存储                                           │
 > │  - 适合少量数据                                                │
 > │                                                                  │
 > │  quicklist（快速列表）：默认                                     │
 > │  - ziplist的链表，每个节点是一个ziplist                        │
 > │  - 结合了链表和ziplist的优点                                  │
 > │  - 每个ziplist默认最大8KB                                      │
 > │                                                                  │
 > └─────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                    Hash 编码类型                                 │
 ├─────────────────────────────────────────────────────────────────┤
 > │                                                                  │
 > │  ziplist: field <= 512 且 value <= 64字节                      │
 > │  - 压缩存储，内存紧凑                                           │
 > │  - 新增/删除需要移动数据                                        │
 > │                                                                  │
 > │  hashtable: 超过ziplist限制时                                   │
 > │  - Hash表实现，O(1)查找                                         │
 > │  - 支持O(1)新增/删除                                            │
 > │                                                                  │
 > └─────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────┐
> > │                    Set 编码类型                                 │█
 ├─────────────────────────────────────────────────────────────────┤
> │                                                                  │
> > │  intset：集合元素都是整数，且<= 512个                          │
> > > │  - 整数集合，内存紧凑                                       │
> > │  - 新增/删除需要移动数据                                       │
> > │                                                                  │
> > │  hashtable：超过intset限制时                                   │
> > > │  - 哈希表实现                                                │
> > │  - 无序                                                       │
> > │                                                                  │
> > └─────────────────────────────────────────────────────────────────┘
 *
> * ┌─────────────────────────────────────────────────────────────────┐
> > │                    Zset 编码类型                                 │
 ├─────────────────────────────────────────────────────────────────┤
> > │                                                                  │
> > │  ziplist：<=128字节 且 元素数 <= 64                             │
> > │  - 按分数排序                                                   │
> > │  - 新增/删除需要移动数据                                       │
> > │                                                                  │
> > │  skiplist + hashtable：超过ziplist限制时                        │
> > │  - 跳表实现有序                                                │
> > │  - 哈希表实现O(1)查找                                          │
> > │                                                                  │
> └─────────────────────────────────────────────────────────────────┘
*/

/*
 * Redis跳表（Skip List）原理：
 *
 * 跳表是一种多层链表，每一层都是有序链表
 * 通过随机层数实现 O(log n) 的查找
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                        跳表结构示意                              │
 ├─────────────────────────────────────────────────────────────────┤
 > > │                                                                  │
 > > │  Level 3:  ──────────────────────────→ NULL                  │
 > > │  Level 2:  ───────────→ ───────────→ ───────────→ NULL      │
 > > │  Level 1:  → → → → → → → → → → → → → → → → → → → → NULL      │
 > > │  Level 0:  → → → → → → → → → → → → → → → → → → → → → NULL    │
 > > │               1     5    10    15    20    25    30    35     │
 > > │               ↑                                        ↑       │
 > > │              head                                     tail     │
 > > │                                                                  │
> > │  Level 0: 最底层，包含所有元素                                 │
> > │  Level 1+: 索引层，用于快速定位                                │
> > │                                                                  │
> > │  查找20：                                                      │
> > > │  Level 3: head → NULL (20在tail之后，向下)                    │
> > │  Level 2: head → 15 → 30 → NULL (20在15和30之间，向下)          │
> > │  Level 1: 15 → 20 → 20 ✓                                      │
> > │                                                                  │
> └─────────────────────────────────────────────────────────────────┘
*/
```

---

## 三、持久化机制

### 3.1 RDB快照

```java
/**
 * RDB持久化机制
 */

/*
 * RDB（Redis Database）：定时生成数据快照
 *
 * 触发方式：
 * 1. 手动触发：SAVE（阻塞）、BGSAVE（后台异步）
 * 2. 自动触发：根据配置自动执行
 *
 * 配置示例：
 * save 900 1      # 900秒内至少1个key变化
 * save 300 10     # 300秒内至少10个key变化
 * save 60 10000   # 60秒内至少10000个key变化
 *
 * bgsave流程：
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                     BGSAVE执行流程                                │
 ├─────────────────────────────────────────────────────────────────┤
 > > │                                                                  │
 > > │  客户端执行BGSAVE                                               │
 > > │       │                                                        │
 > > │       ▼                                                        │
 > > │  Redis进程fork()一个子进程                                     │
 > > │       │                                                        │
 > > │       ▼                                                        │
 > > │  子进程开始遍历内存                                             │
 > > │       │                                                        │
 > > │       ▼                                                        │
 > > │  将数据写入临时RDB文件                                          │
 > > │       │                                                        │
 > > │       ▼                                                        │
 > > │  替换旧的RDB文件（原子操作）                                    │
 > > │       │                                                        │
 > > │       ▼                                                        │
 > > │  子进程完成，通知父进程                                         │
 > > │                                                                  │
> > └─────────────────────────────────────────────────────────────────┘
*
* RDB优点：
* - 文件紧凑，适合备份
* - 恢复快（直接加载RDB文件）
* - fork子进程，不阻塞主进程
*
* RDB缺点：
* - 可能丢失最近的数据（取决于BGSAVE时机）
* - fork进程有开销（数据量大会卡顿）
*/

/**
 * RDB相关命令
 */

// 手动触发
// 阻塞直到RDB保存完成
redisTemplate.execute(new RedisCallback<Object>() {
    @Override
    public Object doInRedis(RedisConnection connection) throws DataAccessException {
        connection.serverCommands().save();
        return null;
    }
});

// 后台异步执行
redisTemplate.execute(new RedisCallback<Object>() {
    @Override
    public Object doInRedis(RedisConnection connection) throws DataAccessException {
        connection.serverCommands().bgSave();
        return null;
    }
});

// 查看最后一次BGSAVE状态
redisTemplate.execute((RedisCallback<String>) connection ->
    connection.serverCommands().lastSaveTime() + "");

// 异步执行且不阻塞（Spring封装的简单方法）
// redisTemplate.execute(new RedisScript<>())
```

### 3.2 AOF日志

```java
/**
 * AOF持久化机制
 */

/*
 * AOF（Append Only File）：记录所有写操作
 *
 * 三种刷盘策略：
 *
 * ┌─────────────────────────────────────────────────────────────────┐
> > │                    AOF刷盘策略                                  │
 ├─────────────────────────────────────────────────────────────────┤
> > │                                                                  │
> > │  always：每次写操作都刷盘                                      │
> > > │  - 最安全，不会丢数据                                        │
> > │  - 性能最差                                                   │
> > │                                                                  │
> > │  everysec（默认）：每秒刷盘一次                                 │
> > > │  - 可能丢失1秒数据                                          │
> > │  - 性能适中                                                   │
> > │                                                                  │
> > │  no：由操作系统决定刷盘时机                                    │
> > > │  - 性能最好                                                  │
> > > │  - 可能会丢失较多样数据                                      │
> > │                                                                  │
> > └─────────────────────────────────────────────────────────────────┘
*
* AOF重写（Rewrite）：
*
* - 合并重复命令，减小文件大小
* - 后台BGREWRITEAOF执行，不阻塞
* - 与RDB同时启用时，优先使用AOF恢复
*
* AOF重写流程：
*
* ┌─────────────────────────────────────────────────────────────────┐
> │                    AOF重写流程                                   │
 ├─────────────────────────────────────────────────────────────────┤
> > │                                                                  │
> > │  触发重写                                                      │
> > │       │                                                        │
> > │       ▼                                                        │
> > │  fork()子进程                                                   │
> > │       │                                                        │
> > │       ▼                                                        │
> > │  子进程遍历内存，写入新的AOF文件                                │
> > │       │                                                        │
> > │       ▼                                                        │
> > │  父进程继续处理请求，记录操作到AOF缓冲                          │
> > │       │                                                        │
> > │       ▼                                                        │
> > │  子进程重写完成，通知父进程                                     │
> > │       │                                                        │
> > │       ▼                                                        │
> > │  父进程将缓冲内容写入新AOF文件                                  │
> > │       │                                                        │
> > │       ▼                                                        │
> > │  替换旧的AOF文件                                               │
> > │                                                                  │
> └─────────────────────────────────────────────────────────────────┘
*
* 配置示例：
*
* appendonly yes                    # 开启AOF
* appendfilename "appendonly.aof"  # AOF文件名
* appendfsync everysec             # 刷盘策略
* auto-aof-rewrite-percentage 100  # 文件大小超过100%时重写
* auto-aof-rewrite-min-size 64mb   # 最小重写大小
*/

/**
 * AOF配置和操作
 */

// application.yml配置
/*
spring:
  redis:
    host: localhost
    port: 6379
  redis:
    lettuce:
      pool:
        max-active: 8
        max-idle: 8
        min-idle: 0
*/

// Redis命令
// BGREWRITEAOF - 异步重写AOF
redisTemplate.execute(new RedisCallback<Object>() {
    @Override
    public Object doInRedis(RedisConnection connection) throws DataAccessException {
        connection.serverCommands().bgRewriteAppendOnlyFile();
        return null;
    }
});
```

### 3.3 混合持久化

```java
/**
 * 混合持久化（Redis 4.0+）
 */

/*
 * RDB + AOF混合持久化：
 *
 * - AOF重写时，先以RDB格式写入，然后追加增量AOF
 * - 恢复时先加载RDB，再处理增量AOF
 *
 * 配置：
 * aof-use-rdb-preamble yes
 *
 * 优势：
 * - 快速恢复（RDB部分）
 * - 少丢数据（AOF部分）
 */

// 混合持久化文件格式
/*
┌────────────────────────────────────────┐
│              RDB格式头                  │
│  ────────────────────────────────────│
│                                        │
│  ┌──────────────────────────────────┐ │
│  │          RDB数据内容               │ │
│  │  （fork子进程时内存快照）          │ │
│  └──────────────────────────────────┘ │
│                                        │
│              AOF格式                    │
│  ────────────────────────────────────│
│                                        │
│  *3\r\n                                │
│  $3\r\n                                │
│  SET\r\n                               │
│  ...                                   │
└────────────────────────────────────────┘
*/

/**
 * 持久化策略选择
 */

/*
 * ┌─────────────────────────────────────────────────────────────────┐
> > │                    持久化策略选择                                │
 ├─────────────────────────────────────────────────────────────────┤
> > │                                                                  │
> > │  缓存场景（数据可丢失）：                                        │
> > > │  - 不开启持久化                                               │
> > │  - 或RDB + 定期备份                                            │
> > │                                                                  │
> > │  一般场景：                                                      │
> > > │  - RDB + AOF everysec                                        │
> > │  - 兼顾性能和数据安全                                          │
> > │                                                                  │
> > > │  高可用场景：                                                 │
> > │  - AOF everysec + Redis Sentinel                              │
> > │  - 或Redis Cluster                                            │
> > │                                                                  │
> > > │  关键数据场景：                                               │
> > │  - AOF always + Redis Sentinel                                │
> > │  - 数据零丢失                                                  │
> > │                                                                  │
> > └─────────────────────────────────────────────────────────────────┘
*/
```

---

## 四、集群方案

### 4.1 主从复制

```
┌────────────────────────────────────────────────────────────────────┐
│                        Redis主从复制架构                             │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                        ┌─────────────────┐                          │
│                        │      Master     │                          │
│                        │   (主节点)       │                          │
│                        │   读写操作       │                          │
│                        └────────┬────────┘                          │
│                                 │                                    │
│                    ┌────────────┼────────────┐                      │
│                    │            │            │                      │
│                    ▼            ▼            ▼                      │
│              ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│              │  Slave1  │ │  Slave2  │ │  Slave3  │               │
│              │  (从节点) │ │  (从节点) │ │  (从节点) │               │
│              │  只读     │ │  只读     │ │  只读     │               │
│              └──────────┘ └──────────┘ └──────────┘               │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                      复制原理                                  │ │
│  │                                                              │ │
│  │  1. 从节点保存主节点信息                                      │ │
│  │  2. 从节点定时发送PSYNC命令                                   │ │
│  │  3. 主节点执行BGSAVE，发送RDB文件                            │ │
│  │  4. 从节点加载RDB，更新数据                                   │ │
│  │  5. 主节点发送增量写命令（复制积压缓冲区）                     │ │
│  │  6. 后续主节点写命令同步推送给从节点                          │ │
│  │                                                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

### 4.2 哨兵模式

```
┌────────────────────────────────────────────────────────────────────┐
│                        Redis哨兵模式                                 │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                         ┌──────────┐                                │
│                         │  客户端   │                                │
│                         └────┬─────┘                                │
│                              │                                       │
│                              ▼                                       │
│                    ┌─────────────────┐                             │
│                    │   Sentinel集群   │                             │
│                    │  (哨兵节点集群)   │                             │
│                    │  ┌───┐ ┌───┐ ┌───┐ │                          │
│                    │  │ S1│ │ S2│ │ S3│ │                          │
│                    │  └───┘ └───┘ └───┘ │                          │
│                    └──────────┬──────────┘                             │
│                               │                                      │
│                    ┌──────────┼──────────┐                            │
│                    │          │          │                            │
│                    ▼          ▼          ▼                            │
│              ┌──────────┐ ┌──────────┐ ┌──────────┐                 │
│              │  Master  │ │  Slave1  │ │  Slave2  │                 │
│              │   主节点  │ │  从节点  │ │  从节点  │                 │
│              └──────────┘ └──────────┘ └──────────┘                 │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                      哨兵职责                                  │ │
│  │                                                              │ │
│  │  监控：监控主从节点是否正常运行                                │ │
│  │  通知：故障时通知应用                                          │ │
│  │  自动故障转移：主节点宕机时自动选举新主节点                    │ │
│  │  配置中心：提供当前主节点地址                                  │ │
│  │                                                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

### 4.3 Cluster集群

```
┌────────────────────────────────────────────────────────────────────┐
│                        Redis Cluster集群                            │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                         ┌─────────────────────────────────────┐   │
│                         │              Cluster集群               │   │
│                         │                                       │   │
│                         │   ┌─────────┐    ┌─────────┐         │   │
│                         │   │ Node 1  │───│ Node 2  │         │   │
│                         │   │ (Master)│    │(Master) │         │   │
│                         │   └────┬────┘    └────┬────┘         │   │
│                         │        │              │              │   │
│                         │   ┌────┴────┐    ┌────┴────┐         │   │
│                         │   │ Slave 1  │    │ Slave 2  │         │   │
│                         │   │ (从节点) │    │ (从节点) │         │   │
│                         │   └─────────┘    └─────────┘         │   │
│                         │                                       │   │
│                         │   ┌─────────┐    ┌─────────┐         │   │
│                         │   │ Node 3  │───│ Node 4  │         │   │
│                         │   │ (Master)│    │(Master) │         │   │
│                         │   └────┬────┘    └────┬────┘         │   │
│                         │        │              │              │   │
│                         │   ┌────┴────┐    ┌────┴────┐         │   │
│                         │   │ Slave 3  │    │ Slave 4  │         │   │
│                         │   └─────────┘    └─────────┘         │   │
│                         │                                       │   │
│                         └─────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                      分片原理                                  │ │
│  │                                                              │ │
│  │  16384个槽位（Slot），平均分配给16384个Master节点            │ │
│  │                                                              │ │
│  │  key → CRC16(key) mod 16384 → slot → 节点                    │ │
│  │                                                              │ │
│  │  例如：                                                       │ │
│  │  - key "user:1001" 的CRC16 = 12345                          │ │
│  │  - 12345 mod 16384 = 12345                                   │ │
│  │  - 12345槽位分配给Node 1                                     │ │
│  │  - key存储在Node 1                                           │ │
│  │                                                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

---

## 五、缓存策略

### 5.1 缓存常见问题

```java
/**
 * 缓存三大问题：缓存穿透、缓存击穿、缓存雪崩
 */

/*
 * ┌─────────────────────────────────────────────────────────────────┐
> > │                    缓存穿透                                    │█
 ├─────────────────────────────────────────────────────────────────┤
> > │                                                                  │
> > │  原因：查询不存在的数据，每次都穿透到数据库                    │
> > │                                                                  │
> > │  例子：查询ID=-1的用户                                         │
> > │  - Redis无 → MySQL无 → 返回空                                 │
> > │  - 频繁查询导致数据库压力                                       │
> > │                                                                  │
> > │  解决方案：                                                     │
> > > │  1. 参数校验，拦截非法参数                                    │
> > │  2. 布隆过滤器（BloomFilter）                                   │
> > > │  3. 缓存空值（NULL），但要设置短过期时间                      │
> > │                                                                  │
> > └─────────────────────────────────────────────────────────────────┘
*
* ┌─────────────────────────────────────────────────────────────────┐
> > │                    缓存击穿                                    │
 ├─────────────────────────────────────────────────────────────────┤
> > │                                                                  │
> > │  原因：热点key过期瞬间，大量并发请求击穿到数据库                │
> > │                                                                  │
> > │  例子：商品详情页cache:product:1，过期瞬间                     │
> > │  - 1000个并发请求同时查询                                      │
> > │  - 全部打到数据库                                               │
> > │                                                                  │
> > │  解决方案：                                                     │
> > > │  1. 互斥锁（Redis SETNX）                                    │
> > │  2. 永不过期（逻辑过期 + 后台异步更新）                         │
> > > │  3. 热点数据预热                                              │
> > │                                                                  │
> > └─────────────────────────────────────────────────────────────────┘
*
* ┌─────────────────────────────────────────────────────────────────┐
> > │                    缓存雪崩                                    │
 ├─────────────────────────────────────────────────────────────────┤
> > │                                                                  │
> > > │  原因：大量缓存同时过期或Redis宕机，请求全部打到数据库        │
> > │                                                                  │
> > > │  例子：                                                         │
> > > │  - 同一时刻大量key过期                                        │
> > │  - Redis集群宕机                                               │
> > │                                                                  │
> > > │  解决方案：                                                     │
> > > │  1. 过期时间随机化                                            │
> > > │  2. 永不过期 + 逻辑过期                                        │
> > > │  3. Redis高可用（哨兵/集群）                                   │
> > > │  4. 限流降级（Redis + Sentinel）                               │
> > > │  5. 数据库熔断                                                │
> > > │                                                                  │
> > └─────────────────────────────────────────────────────────────────┘
*/

/**
 * 缓存穿透解决方案：布隆过滤器
 */
public class BloomFilterDemo {

    // 引入Google Guava的布隆过滤器
    private BloomFilter<String> bloomFilter = BloomFilter.create(
        Funnels.stringFunnel(StandardCharsets.UTF_8),
        1000000,  // 预期插入数量
        0.01      // 误判率
    );

    /**
     * 初始化布隆过滤器（从数据库加载所有合法ID）
     */
    public void initBloomFilter() {
        // 从数据库查询所有合法用户ID
        List<String> validUserIds = userRepository.findAllUserIds();

        // 放入布隆过滤器
        validUserIds.forEach(bloomFilter::put);
    }

    /**
     * 查询时先检查布隆过滤器
     */
    public User getUser(Long userId) {
        String key = "user:" + userId;

        // 1. 先检查布隆过滤器
        if (!bloomFilter.mightContain(key)) {
            // 布隆过滤器说不存在，直接返回null
            return null;
        }

        // 2. 布隆过滤器说可能存在，查询Redis
        User user = redisTemplate.opsForValue().get(key);
        if (user != null) {
            return user;
        }

        // 3. Redis也没有，查询数据库
        user = userRepository.findById(userId);
        if (user != null) {
            redisTemplate.opsForValue().set(key, user, Duration.ofHours(1));
        }

        return user;
    }
}

/**
 * 缓存击穿解决方案：互斥锁
 */
public class CacheBreakdownDemo {

    /**
     * 互斥锁方式防止缓存击穿
     */
    public User getUserWithLock(Long userId) {
        String key = "user:" + userId;
        String lockKey = "lock:" + key;

        // 1. 先查缓存
        User user = redisTemplate.opsForValue().get(key);
        if (user != null) {
            return user;
        }

        // 2. 获取互斥锁
        Boolean locked = redisTemplate.opsForValue()
            .setIfAbsent(lockKey, "1", Duration.ofSeconds(10));

        if (locked) {
            try {
                // 双重检查
                user = redisTemplate.opsForValue().get(key);
                if (user != null) {
                    return user;
                }

                // 3. 查数据库
                user = userRepository.findById(userId);

                // 4. 写入缓存
                redisTemplate.opsForValue().set(key, user, Duration.ofHours(1));

                return user;
            } finally {
                // 5. 释放锁
                redisTemplate.delete(lockKey);
            }
        } else {
            // 获取锁失败，短暂等待后重试
            try {
                Thread.sleep(50);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            return getUserWithLock(userId);  // 递归重试
        }
    }

    /**
     * 逻辑过期方式防止缓存击穿
     */
    public User getUserWithLogicalExpire(Long userId) {
        String key = "user:" + userId;

        // 1. 先查缓存
        UserCache userCache = redisTemplate.opsForValue().get(key);
        if (userCache == null) {
            return null;
        }

        // 2. 检查是否逻辑过期
        if (userCache.isLogicallyExpired()) {
            // 开启异步线程更新缓存
            threadPool.execute(() -> {
                // 获取互斥锁
                String lockKey = "lock:" + key;
                Boolean locked = redisTemplate.opsForValue()
                    .setIfAbsent(lockKey, "1", Duration.ofSeconds(10));

                if (locked) {
                    try {
                        // 查数据库，更新缓存
                        User user = userRepository.findById(userId);
                        UserCache newCache = new UserCache(user, Duration.ofHours(1));
                        redisTemplate.opsForValue().set(key, newCache);
                    } finally {
                        redisTemplate.delete(lockKey);
                    }
                }
            });
        }

        // 3. 返回当前数据（可能是过期数据，但用户体验更好）
        return userCache.getUser();
    }
}

/**
 * 缓存雪崩预防：过期时间随机化
 */
public class CacheAvalancheDemo {

    /**
     * 设置随机过期时间
     */
    public void setUser(Long userId, User user) {
        String key = "user:" + userId;

        // 基础过期时间1小时，随机偏移量±10分钟
        int baseExpire = 3600;  // 1小时
        int randomExpire = new Random().nextInt(600) - 300;  // -300到300秒

        int finalExpire = baseExpire + randomExpire;

        redisTemplate.opsForValue().set(key, user, Duration.ofSeconds(finalExpire));
    }

    /**
     * 批量设置时确保过期时间分散
     */
    public void batchSetUsers(List<User> users) {
        for (User user : users) {
            // 不同的key设置不同的过期时间
            int randomDelay = new Random().nextInt(300);  // 0-300秒随机延迟
            // 从1小时后的某个随机时刻开始过期
            long expireTime = System.currentTimeMillis() / 1000 + 3600 + randomDelay;

            String key = "user:" + user.getId();
            redisTemplate.opsForValue().set(key, user,
                Duration.ofSeconds(3600 + randomDelay));
        }
    }
}
```

### 5.2 缓存更新策略

```java
/**
 * 缓存更新策略
 */

/*
 * ┌─────────────────────────────────────────────────────────────────┐
> > │                    Cache Aside（旁路缓存）最常用                │
 ├─────────────────────────────────────────────────────────────────┤
> > │                                                                  │
> > │  读操作：                                                       │
> > │  1. 查缓存                                                     │
> > │  2. 缓存命中 → 返回                                            │
> > │  3. 缓存未命中 → 查数据库 → 写入缓存 → 返回                    │
> > │                                                                  │
> > │  写操作：                                                       │
> > │  1. 写数据库                                                   │
> > │  2. 删除缓存（而非更新）                                        │
> > │                                                                  │
> > │  为什么删除而非更新？                                           │
> > │  - 更新缓存可能造成数据不一致                                   │
> > │  - 删除缓存开销更小                                             │
> > │                                                                  │
> > └─────────────────────────────────────────────────────────────────┘
*
* ┌─────────────────────────────────────────────────────────────────┐
> │                    Read Through（读穿透）                        │
 ├─────────────────────────────────────────────────────────────────┤
> │                                                                  │
> │  应用程序只访问缓存层                                            │
> │  缓存层自动从数据库加载数据                                      │
> │  Redis本身不实现，需要包装                                      │
> │                                                                  │
> └─────────────────────────────────────────────────────────────────┘
*
* ┌─────────────────────────────────────────────────────────────────┐
> │                    Write Through（写穿透）                      │
 ├─────────────────────────────────────────────────────────────────┤
> │                                                                  │
> > │  应用程序写缓存                                                │
> > │  缓存层自动写数据库                                            │
> > │  写入是同步的                                                  │
> > │                                                                  │
> └─────────────────────────────────────────────────────────────────┘
*
* ┌─────────────────────────────────────────────────────────────────┐
> │                    Write Behind（异步写回）                      │
 ├─────────────────────────────────────────────────────────────────┤
> │                                                                  │
> > │  先写缓存                                                      │
> > │  异步批量写回数据库                                            │
> > > │  - 性能最高                                                  │
> > │  - 但可能丢数据                                                │
> > │  - 操作系统Page Cache、MySQL InnoDB Buffer采用此策略           │
> > │                                                                  │
> └─────────────────────────────────────────────────────────────────┘
*/

/**
 * Cache Aside实现
 */
public class CacheAsideDemo {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private UserRepository userRepository;

    /**
     * 查询：Cache Aside
     */
    public User findUserById(Long id) {
        String key = "user:" + id;

        // 1. 查询缓存
        User user = (User) redisTemplate.opsForValue().get(key);
        if (user != null) {
            return user;
        }

        // 2. 缓存未命中，查询数据库
        user = userRepository.findById(id);

        // 3. 写入缓存
        if (user != null) {
            redisTemplate.opsForValue().set(key, user, Duration.ofHours(1));
        }

        return user;
    }

    /**
     * 更新：先更新数据库，再删除缓存
     */
    @Transactional
    public void updateUser(User user) {
        // 1. 先更新数据库
        userRepository.update(user);

        // 2. 删除缓存（而不是更新）
        String key = "user:" + user.getId();
        redisTemplate.delete(key);

        // 为什么删除而不是更新？
        // 因为更新缓存+删除数据库顺序可能导致数据不一致
    }

    /**
     * 删除：删除数据库 + 删除缓存
     */
    public void deleteUser(Long id) {
        // 1. 删除数据库
        userRepository.deleteById(id);

        // 2. 删除缓存
        String key = "user:" + id;
        redisTemplate.delete(key);
    }
}
```

---

## 六、Redisson分布式锁

### 6.1 Redisson概述

**Redisson**是Redis的Java客户端，提供了**丰富的分布式数据结构和服务**，其中最核心的就是**分布式锁**。

```
┌────────────────────────────────────────────────────────────────────┐
│                        Redisson分布式锁原理                          │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    加锁流程                                    │ │
│  │                                                              │ │
│  │  1. 尝试获取锁（SETNX）                                      │ │
│  │  2. 成功 → 设置过期时间 → 返回                                │ │
│  │  3. 失败 → 循环尝试 / 订阅解锁消息 → 等待通知                 │ │
│  │                                                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    锁续期机制（WatchDog）                     │ │
│  │                                                              │ │
│  │  - 锁默认过期时间30秒                                        │ │
│  │  - 后台线程每10秒检查是否持有锁                              │ │
│  │  - 如果持有，自动延长过期时间                                 │ │
│  │  - 防止业务处理超时导致锁自动释放                             │ │
│  │                                                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

### 6.2 Redisson使用

```java
/**
 * Redisson分布式锁实战
 *
 * 引入依赖：
 * <dependency>
 *     <groupId>org.redisson</groupId>
 *     <artifactId>redisson-spring-boot-starter</artifactId>
 * </dependency>
 */

/**
 * Redisson配置
 */
@Configuration
public class RedissonConfig {

    @Bean(destroyMethod = "shutdown")
    public RedissonClient redissonClient() {
        Config config = new Config();

        // 单节点模式
        config.useSingleServer()
            .setAddress("redis://127.0.0.1:6379")
            .setPassword("password")
            .setConnectionPoolSize(10)
            .setConnectionMinimumIdleSize(5);

        // 集群模式
        // config.useClusterServers()
        //     .addNodeAddress("redis://127.0.0.1:7000", "redis://127.0.0.1:7001")
        //     .setPassword("password");

        return Redisson.create(config);
    }
}

/**
 * Redisson分布式锁基础用法
 */
@Service
public class RedissonLockDemo {

    @Autowired
    private RedissonClient redissonClient;

    /**
     * 基础加锁和解锁
     */
    public void basicLock() {
        String lockKey = "lock:product:001";

        // 获取锁
        RLock lock = redissonClient.getLock(lockKey);

        try {
            // 加锁（阻塞等待，默认30秒）
            // lock.lock();
            // lock.lock(10, TimeUnit.SECONDS);  // 指定过期时间

            // 推荐：tryLock方式（非阻塞）
            boolean locked = lock.tryLock(10, 30, TimeUnit.SECONDS);
            if (locked) {
                // 执行业务逻辑
                doSomething();

                // 释放锁
                lock.unlock();
            }
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    /**
     * 公平锁
     * 保证锁的获取顺序，按照请求顺序依次获取
     */
    public void fairLock() {
        String lockKey = "fairlock:product:001";

        // 获取公平锁
        RLock fairLock = redissonClient.getFairLock(lockKey);

        try {
            fairLock.lock(30, TimeUnit.SECONDS);

            // 业务逻辑
            doSomething();

        } finally {
            if (fairLock.isHeldByCurrentThread()) {
                fairLock.unlock();
            }
        }
    }

    /**
     * 读写锁
     * 读锁共享，写锁独占
     */
    public void readWriteLock() {
        String lockKey = "rwlock:product:001";
        RReadWriteLock rwLock = redissonClient.getReadWriteLock(lockKey);

        // 获取读锁
        RLock readLock = rwLock.readLock();
        readLock.lock(30, TimeUnit.SECONDS);
        try {
            // 多个线程可以同时读取
            String data = readData();
        } finally {
            readLock.unlock();
        }

        // 获取写锁
        RLock writeLock = rwLock.writeLock();
        writeLock.lock(30, TimeUnit.SECONDS);
        try {
            // 同时只有一个线程可以写
            writeData("new data");
        } finally {
            writeLock.unlock();
        }
    }

    /**
     * 锁的有效期和WatchDog机制
     */
    public void lockWithWatchDog() {
        String lockKey = "watchdog:lock:001";
        RLock lock = redissonClient.getLock(lockKey);

        /*
         * lock() 不指定过期时间：
         * - 默认过期时间30秒
         * - 启动WatchDog（每10秒自动续期到30秒）
         * - 如果不调用unlock()，锁会在30秒后自动释放
         */

        try {
            lock.lock();  // 使用WatchDog机制

            // 业务逻辑执行中，锁会自动续期
            doSomethingLongTime();

        } finally {
            lock.unlock();
        }

        /*
         * lock(10, TimeUnit.SECONDS) 指定过期时间：
         * - 不会启动WatchDog
         * - 10秒后锁自动释放，即使业务还在执行
         * - 用于明确知道业务执行时间的场景
         */
    }

    private void doSomething() {
        System.out.println("执行业务逻辑");
    }

    private void doSomethingLongTime() throws InterruptedException {
        System.out.println("开始执行长时间业务...");
        Thread.sleep(20000);  // 20秒
        System.out.println("业务执行完成");
    }

    private String readData() {
        return "data";
    }

    private void writeData(String data) {
        System.out.println("写入数据：" + data);
    }
}

/**
 * Redisson分布式锁实战：商品库存扣减
 */
@Service
public class StockService {

    @Autowired
    private RedissonClient redissonClient;

    @Autowired
    private ProductRepository productRepository;

    /**
     * 乐观锁扣减库存（使用分布式锁保证原子性）
     */
    public boolean decreaseStock(Long productId, Integer count) {
        String lockKey = "lock:stock:" + productId;
        RLock lock = redissonClient.getLock(lockKey);

        try {
            // 尝试获取锁，等待5秒，锁定30秒
            boolean locked = lock.tryLock(5, 30, TimeUnit.SECONDS);
            if (!locked) {
                throw new RuntimeException("系统繁忙，请稍后再试");
            }

            // 查询库存
            Product product = productRepository.findById(productId);
            if (product == null) {
                throw new RuntimeException("商品不存在");
            }

            int currentStock = product.getStock();
            if (currentStock < count) {
                throw new RuntimeException("库存不足");
            }

            // 扣减库存
            product.setStock(currentStock - count);
            productRepository.save(product);

            return true;

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("库存扣减失败");
        } finally {
            // 必须释放锁
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }

    /**
     * 批量扣减库存（分段锁优化）
     */
    public boolean decreaseStockBatch(List<Long> productIds, Map<Long, Integer> counts) {
        // 对商品ID排序
        List<Long> sortedIds = productIds.stream().sorted().collect(Collectors.toList());

        // 获取所有需要的锁
        List<RLock> locks = new ArrayList<>();
        try {
            // 按顺序加锁，避免死锁
            for (Long productId : sortedIds) {
                RLock lock = redissonClient.getLock("lock:stock:" + productId);
                boolean locked = lock.tryLock(5, 30, TimeUnit.SECONDS);
                if (!locked) {
                    throw new RuntimeException("系统繁忙，请稍后再试");
                }
                locks.add(lock);
            }

            // 执行业务逻辑
            for (Long productId : productIds) {
                decreaseStock(productId, counts.get(productId));
            }

            return true;

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("库存扣减失败");
        } finally {
            // 释放所有锁（逆序）
            for (int i = locks.size() - 1; i >= 0; i--) {
                RLock lock = locks.get(i);
                if (lock.isHeldByCurrentThread()) {
                    lock.unlock();
                }
            }
        }
    }
}

/**
 * Redisson分布式锁实战：分布式计数器
 */
@Service
public class CounterService {

    @Autowired
    private RedissonClient redissonClient;

    /**
     * 分布式计数器
     */
    public void incrementCounter(String key) {
        RAtomicLong counter = redissonClient.getAtomicLong(key);
        counter.incrementAndGet();
    }

    public long getCounter(String key) {
        RAtomicLong counter = redissonClient.getAtomicLong(key);
        return counter.get();
    }

    /**
     * 限流器
     */
    public void rateLimiterDemo(String userId) {
        String key = "ratelimit:api:" + userId;

        // 创建限流器：每秒最多10个请求
        RRateLimiter limiter = redissonClient.getRateLimiter(key);
        limiter.trySetRate(RateType.OVERALL, 10, 1, RateIntervalUnit.SECONDS);

        // 尝试获取许可
        boolean allowed = limiter.tryAcquire(1);
        if (!allowed) {
            throw new RuntimeException("请求过于频繁，请稍后再试");
        }

        // 执行业务逻辑
        doBusiness();
    }
}

/**
 * Redisson分布式信号量和闭锁
 */
public class SemaphoreDemo {

    @Autowired
    private RedissonClient redissonClient;

    /**
     * 停车场示例（信号量）
     */
    public void parkingLotDemo() {
        // 3个车位
        RSemaphore parkingLot = redissonClient.getSemaphore("parking:lot");
        parkingLot.trySetPermits(3);

        // 获取车位（阻塞）
        parkingLot.acquire();

        try {
            // 停车
            System.out.println("停车成功");
            Thread.sleep(5000);

        } finally {
            // 离开，释放车位
            parkingLot.release();
        }

        // 非阻塞获取
        boolean success = parkingLot.tryAcquire();
        if (success) {
            // 停车
        } else {
            // 车位已满
        }
    }

    /**
     * 模拟运动会发令枪（闭锁）
     */
    public void latchDemo() throws InterruptedException {
        int teamCount = 5;
        RCountDownLatch startLatch = redissonClient.getCountDownLatch("start:race");
        startLatch.trySetCount(teamCount);

        // 裁判：等待所有运动员就位
        System.out.println("等待运动员就位...");

        // 运动员：就位后倒数
        for (int i = 0; i < teamCount; i++) {
            Thread thread = new Thread(() -> {
                try {
                    // 准备就绪
                    Thread.sleep((long) (Math.random() * 3000));
                    System.out.println("运动员准备就绪");

                    // 倒数
                    startLatch.countDown();

                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            });
            thread.start();
        }

        // 等待所有运动员
        startLatch.await();

        // 裁判：开枪
        System.out.println("砰！比赛开始！");
    }
}
```

---

## 七、秒杀场景实战

### 7.1 秒杀系统设计

```
┌────────────────────────────────────────────────────────────────────┐
│                          秒杀系统架构                                │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  用户请求                                                             │
│      │                                                               │
│      ▼                                                               │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                  接入层（CDN + Nginx）                        │ │
│  │  - 静态资源缓存                                               │ │
│  │  - IP限流                                                    │ │
│  │  - 负载均衡                                                   │ │
│  └──────────────────────────────────────────────────────────────┘ │
│      │                                                               │
│      ▼                                                               │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                  应用层（Spring Cloud Gateway）                 │ │
│  │  - 路由转发                                                  │ │
│  │  - 统一认证                                                  │ │
│  │  - 接口限流                                                  │ │
│  └──────────────────────────────────────────────────────────────┘ │
│      │                                                               │
│      ▼                                                               │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                  秒杀服务                                     │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │ │
│  │  │ 验证码   │ │ 库存判断 │ │ 订单创建 │ │ 支付回调 │           │ │
│  │  │ 校验    │ │ 预扣减   │ │ 异步处理 │ │          │           │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │ │
│  └──────────────────────────────────────────────────────────────┘ │
│      │                                                               │
│      ▼                                                               │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                  缓存层（Redis集群）                           │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐                        │ │
│  │  │ 秒杀资格 │ │ 库存扣减 │ │ 验证码   │                        │ │
│  │  │ 判断    │ │ Lua原子 │ │ 校验    │                        │ │
│  │  └─────────┘ └─────────┘ └─────────┘                        │ │
│  └──────────────────────────────────────────────────────────────┘ │
│      │                                                               │
│      ▼                                                               │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                  消息队列（RabbitMQ/RocketMQ）                 │ │
│  │  ┌─────────────────────────────────────────────────────┐    │ │
│  │  │  异步创建订单                                        │    │ │
│  │  │  削峰填谷                                            │    │ │
│  │  └─────────────────────────────────────────────────────┘    │ │
│  └──────────────────────────────────────────────────────────────┘ │
│      │                                                               │
│      ▼                                                               │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                  数据库层（MySQL + 主从）                       │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐                        │ │
│  │  │ 订单表   │ │ 库存表   │ │ 用户表   │                        │ │
│  │  │          │ │ 行锁     │ │ 幂等校验 │                        │ │
│  │  └─────────┘ └─────────┘ └─────────┘                        │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

### 7.2 秒杀核心代码

```java
/**
 * 秒杀服务核心实现
 */
@Service
public class SeckillService {

    @Autowired
    private RedissonClient redissonClient;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private SeckillOrderService orderService;

    @Autowired
    private RabbitTemplate rabbitTemplate;

    /**
     * 秒杀下单核心流程
     */
    public Result<SeckillOrderResponse> seckill(SeckillRequest request) {
        Long userId = request.getUserId();
        Long productId = request.getProductId();

        // 1. 限流：用户级别限流
        if (!checkUserRateLimit(userId)) {
            return Result.error("请求过于频繁，请稍后再试");
        }

        // 2. 幂等性校验：防止重复下单
        if (checkDuplicateOrder(userId, productId)) {
            return Result.error("您已下单，请勿重复提交");
        }

        // 3. 活动有效性校验
        if (!checkSeckillActivity(productId)) {
            return Result.error("秒杀活动未开始或已结束");
        }

        // 4. 验证码校验（可选，防止脚本）
        if (!verifyCaptcha(userId, request.getCaptcha())) {
            return Result.error("验证码错误");
        }

        // 5. 库存扣减（Redis Lua保证原子性）
        boolean stockDeducted = deductStock(productId);
        if (!stockDeducted) {
            return Result.error("库存不足");
        }

        // 6. 发送订单创建消息到MQ
        try {
            SeckillOrderMessage message = new SeckillOrderMessage();
            message.setUserId(userId);
            message.setProductId(productId);
            message.setOrderTime(System.currentTimeMillis());

            rabbitTemplate.convertAndSend(
                "seckill.order.exchange",
                "seckill.order.create",
                message
            );

            return Result.success(new SeckillOrderResponse("下单成功"));

        } catch (Exception e) {
            // 发送失败，补偿库存
            compensateStock(productId);
            return Result.error("下单失败，请稍后重试");
        }
    }

    /**
     * Redis Lua脚本扣减库存（原子操作）
     */
    private boolean deductStock(Long productId) {
        String stockKey = "seckill:stock:" + productId;

        // Lua脚本：原子检查和扣减
        String luaScript =
            "local stock = redis.call('get', KEYS[1]) " +
            "if not stock then " +
            "    return 0 " +  -- 库存不存在
            "end " +
            "stock = tonumber(stock) " +
            "if stock <= 0 then " +
            "    return -1 " +  -- 库存不足
            "end " +
            "redis.call('decr', KEYS[1]) " +
            "return 1";  -- 扣减成功

        DefaultRedisScript<Long> script = new DefaultRedisScript<>();
        script.setScriptText(luaScript);
        script.setResultType(Long.class);

        Long result = redisTemplate.execute(script, Collections.singletonList(stockKey));

        return result != null && result == 1;
    }

    /**
     * 补偿库存
     */
    private void compensateStock(Long productId) {
        String stockKey = "seckill:stock:" + productId;
        redisTemplate.opsForValue().increment(stockKey);
    }

    /**
     * 用户限流检查
     */
    private boolean checkUserRateLimit(Long userId) {
        String key = "ratelimit:seckill:user:" + userId;
        RRateLimiter limiter = redissonClient.getRateLimiter(key);

        // 每秒最多1个请求
        limiter.trySetRate(RateType.PER_USER, 1, 1, RateIntervalUnit.SECONDS);

        return limiter.tryAcquire(1);
    }

    /**
     * 幂等性检查：用户是否已下单
     */
    private boolean checkDuplicateOrder(Long userId, Long productId) {
        String key = "seckill:order:exists:" + userId + ":" + productId;

        // 使用SETNX保证原子性
        Boolean success = redisTemplate.opsForValue()
            .setIfAbsent(key, "1", Duration.ofMinutes(30));

        return !Boolean.TRUE.equals(success);
    }

    /**
     * 检查秒杀活动是否有效
     */
    private boolean checkSeckillActivity(Long productId) {
        String activityKey = "seckill:activity:" + productId;

        Map<Object, Object> activity = redisTemplate.opsForHash().entries(activityKey);
        if (activity.isEmpty()) {
            return false;
        }

        long now = System.currentTimeMillis();
        long startTime = Long.parseLong(activity.get("startTime").toString());
        long endTime = Long.parseLong(activity.get("endTime").toString());

        return now >= startTime && now <= endTime;
    }

    /**
     * 验证码校验
     */
    private boolean verifyCaptcha(Long userId, String captcha) {
        if (captcha == null || captcha.isEmpty()) {
            return true;  // 没有验证码则放行
        }

        String captchaKey = "captcha:seckill:" + userId;
        String storedCaptcha = (String) redisTemplate.opsForValue().get(captchaKey);

        // 使用后删除
        redisTemplate.delete(captchaKey);

        return captcha.equals(storedCaptcha);
    }
}

/**
 * 秒杀订单消费者
 */
@Component
public class SeckillOrderConsumer {

    @Autowired
    private SeckillOrderService orderService;

    @RabbitListener(queues = "seckill.order.queue")
    public void handleOrderCreate(SeckillOrderMessage message) {
        try {
            // 创建订单
            orderService.createSeckillOrder(message);

            // 发送延迟消息，检查支付状态
            // ...

        } catch (Exception e) {
            // 订单创建失败，记录日志
            log.error("秒杀订单创建失败：{}", message, e);

            // 补偿库存
            compensateStock(message.getProductId());
        }
    }

    private void compensateStock(Long productId) {
        // 补偿库存逻辑
    }
}

/**
 * 秒杀订单服务
 */
@Service
public class SeckillOrderService {

    @Autowired
    private ProductMapper productMapper;

    @Autowired
    private OrderMapper orderMapper;

    @Transactional
    public void createSeckillOrder(SeckillOrderMessage message) {
        Long productId = message.getProductId();
        Long userId = message.getUserId();

        // 1. 再次检查库存（数据库层面）
        Product product = productMapper.selectById(productId);
        if (product.getStock() <= 0) {
            throw new RuntimeException("库存不足");
        }

        // 2. 乐观锁扣减库存
        int affectedRows = productMapper.decreaseStock(productId, 1);
        if (affectedRows == 0) {
            throw new RuntimeException("库存扣减失败");
        }

        // 3. 创建订单
        SeckillOrder order = new SeckillOrder();
        order.setOrderNo(generateOrderNo());
        order.setUserId(userId);
        order.setProductId(productId);
        order.setStatus("PENDING_PAYMENT");
        order.setCreateTime(new Date());

        orderMapper.insert(order);

        // 4. 发送订单成功消息
        // ...
    }

    private String generateOrderNo() {
        return "SK" + new SimpleDateFormat("yyyyMMddHHmmss").format(new Date())
            + String.format("%06d", new Random().nextInt(999999));
    }
}

/**
 * 秒杀库存预热
 */
@Component
public class SeckillStockPreheat {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    /**
     * 活动开始前预热库存到Redis
     */
    public void preheatStock(Long productId, int stock) {
        String stockKey = "seckill:stock:" + productId;

        // 设置库存
        redisTemplate.opsForValue().set(stockKey, stock);

        // 设置库存预警
        String warningKey = "seckill:stock:warning:" + productId;
        redisTemplate.opsForValue().set(warningKey, stock / 2);
    }

    /**
     * 监控库存，低于预警时告警
     */
    @Scheduled(fixedRate = 10000)
    public void monitorStock() {
        // 获取所有秒杀商品
        Set<String> keys = redisTemplate.keys("seckill:stock:*");

        for (String key : keys) {
            Integer stock = (Integer) redisTemplate.opsForValue().get(key);
            String productId = key.replace("seckill:stock:", "");
            Integer warning = (Integer) redisTemplate.opsForValue()
                .get("seckill:stock:warning:" + productId);

            if (stock != null && warning != null && stock < warning) {
                // 发送告警
                sendAlert("商品" + productId + "库存不足：" + stock);
            }
        }
    }
}
```

---

## 八、总结

### 8.1 核心知识点回顾

```
┌────────────────────────────────────────────────────────────────────┐
│                       Redis知识图谱                                 │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                     数据结构                                   │ │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │ │
│  │  │ String │ │  Hash  │ │  List  │ │  Set   │ │ Zset   │       │ │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘       │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                      持久化机制                                │ │
│  │  ┌────────┐ ┌────────┐ ┌────────┐                            │ │
│  │  │  RDB   │ │  AOF   │ │ 混合   │                            │ │
│  │  └────────┘ └────────┘ └────────┘                            │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                      集群方案                                  │ │
│  │  ┌────────┐ ┌────────┐ ┌────────┐                            │ │
│  │  │主从复制│ │ 哨兵模式│ │ Cluster│                            │ │
│  │  └────────┘ └────────┘ └────────┘                            │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                      缓存策略                                  │ │
│  │  ┌────────┐ ┌────────┐ ┌────────┐                            │ │
│  │  │Cache Aside│ │Read Through│ │Write Through│                │ │
│  │  └────────┘ └────────┘ └────────┘                            │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                      缓存问题                                  │ │
│  │  ┌────────┐ ┌────────┐ ┌────────┐                            │ │
│  │  │ 穿透   │ │ 击穿   │ │ 雪崩   │                            │ │
│  │  └────────┘ └────────┘ └────────┘                            │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              │                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                      分布式锁                                  │ │
│  │  ┌────────┐ ┌────────┐ ┌────────┐                            │ │
│  │  │Redisson│ │ 公平锁 │ │ 读写锁 │                            │ │
│  │  └────────┘ └────────┘ └────────┘                            │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

### 8.2 面试高频问题

| 问题 | 核心回答要点 |
|------|-------------|
| Redis的数据结构？ | String、Hash、List、Set、Zset及其底层实现 |
| Redis持久化方式？ | RDB、AOF、混合持久化 |
| Redis为什么这么快？ | 单线程、IO多路复用、内存操作 |
| 缓存穿透/击穿/雪崩？ | 布隆过滤器、互斥锁、过期随机化 |
| Redis集群方案？ | 主从复制、哨兵、Cluster |
| Redis分布式锁原理？ | SETNX、过期时间、WatchDog |
| Redisson和SETNX区别？ | Redisson封装完善，支持自动续期 |
| Redis和Memcache区别？ | Redis支持更多数据结构、持久化 |
| Redis过期策略？ | 定期删除 + 惰性删除 |
| 如何保证Redis和MySQL一致？ | Cache Aside + 延迟双删 |

---

> 希望本文能帮助你全面掌握Redis缓存与分布式锁技术！如果有任何问题，欢迎交流！
